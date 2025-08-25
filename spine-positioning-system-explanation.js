// 🎯 Spine編集システム v3.0 - Phase 2: モジュール化版（修正版）
// SpineEditCore モジュール読み込み + 拡張機能統合
// 修正日: 2025-08-07 - 統合エラー包括修正

console.log('🚀 Spine編集システム v3.0 - Phase 2 モジュール化版読み込み開始（修正版）');

// ========== レイアウト確定待ちユーティリティ ========== //
/**
 * レイアウト確定レース問題解決用関数
 * F12の有無に関係なく、レイアウトが完全に確定するまで待機
 */
async function afterLayoutStable() {
    console.log('⏳ レイアウト確定待機開始...');
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => requestAnimationFrame(r)); // 2フレーム待つ
    console.log('✅ レイアウト確定完了');
}

// 🔍 座標上書き監視システム（デバッグ用）
function setupCoordinateMonitoring(element) {
    console.log('🔍 座標上書き監視開始:', element.id);
    
    const mo = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.attributeName === 'style') {
                console.debug(`[座標上書き検出] ${element.id}.style =`, element.style.cssText);
                console.debug('[上書き元スタック]', new Error().stack.split('\n')[2]);
            }
        });
    });
    
    mo.observe(element, { 
        attributes: true, 
        attributeFilter: ['style'] 
    });
    
    // DPR/サイズ情報ログ
    console.table({
        '要素ID': element.id,
        'DPR': window.devicePixelRatio,
        'CSS幅': element.clientWidth + 'px',
        'CSS高': element.clientHeight + 'px',
        'バッファ幅': element.width || 'N/A',
        'バッファ高': element.height || 'N/A'
    });
    
    return mo;
}

// ========== 重要な変数の事前宣言 ========== //
// Temporal Dead Zone回避のため、使用前に宣言
let globalClickHandler = null;
let spineEditCoreLoaded = false;
let systemInitialized = false;

// ========== SpineEditCore モジュール読み込み（強化版） ========== //
// 抽出された核心機能: SpineEditSystem基本状態 + ModuleManager + 座標系スワップ機能

/**
 * spine-edit-core.js読み込み完了待機システム
 */
function waitForSpineEditCore(callback, maxRetries = 50) {
    let retries = 0;
    const checkInterval = setInterval(() => {
        // SpineEditSystemが完全に読み込まれているかチェック
        if (window.SpineEditSystem && 
            window.SpineEditSystem.coords && 
            typeof window.SpineEditSystem.coords.pxToPercent === 'function' &&
            window.SpineEditSystem.coordinateSwap &&
            typeof window.SpineEditSystem.coordinateSwap.enterEditMode === 'function') {
            
            clearInterval(checkInterval);
            spineEditCoreLoaded = true;
            console.log('✅ spine-edit-core.js読み込み完了確認');
            callback();
        } else if (retries++ > maxRetries) {
            clearInterval(checkInterval);
            console.warn('⚠️ spine-edit-core.js読み込みタイムアウト - フォールバックモード');
            initializeFallbackSystem();
            callback();
        }
    }, 100);
}

// Core モジュール読み込み（改良版）
try {
    // spine-edit-core.js の動的読み込み
    const coreScript = document.createElement('script');
    coreScript.src = 'spine-edit-core.js';
    coreScript.onload = function() {
        console.log('📦 spine-edit-core.jsファイル読み込み完了');
        spineEditCoreLoaded = true;
    };
    coreScript.onerror = function() {
        console.error('❌ SpineEditCore モジュール読み込み失敗 - spine-edit-core.js が見つかりません');
        console.log('🔄 フォールバックシステムで継続...');
        initializeFallbackSystem();
    };
    document.head.appendChild(coreScript);
} catch (error) {
    console.error('❌ SpineEditCore モジュール読み込み例外:', error);
    initializeFallbackSystem();
}

// フォールバック用の最小システム（緊急時用）
function initializeFallbackSystem() {
    console.log('🚨 緊急フォールバックシステム実行中');
    // 最小限のSpineEditSystemオブジェクトを作成
    window.SpineEditSystem = {
        baseLayer: { targetElement: null, initialPosition: {} },
        controlLayer: { isEditMode: false, isDragging: false, dragStartPos: {}, elementStartPos: {} },
        modules: new Map(),
        coordinateSwap: { 
            backup: {}, 
            isSwapped: false, 
            enterEditMode: () => {}, 
            exitEditMode: () => {}, 
            forceRestore: () => {} 
        },
        coords: { 
            pxToPercent: (px, parent) => {
                if (!parent || parent === 0) return 0;
                return parseFloat(((px / parent) * 100).toFixed(1));
            },
            percentToPx: (percent, parent) => {
                if (!parent || parent === 0) return 0;
                return (parseFloat(percent) / 100) * parent;
            }
        }
    };
    window.ModuleManager = {
        hasModule: () => false,
        getModule: () => null,
        addModule: () => false,
        removeModule: () => false,
        removeAllModules: () => {}
    };
}

// ========== 基本UI作成（最小限） ========== //

// キャラクター選択ボタン生成関数
function generateCharacterSelectionButtons() {
    console.log('🎨 キャラクター選択ボタン生成開始');
    
    // MultiCharacterManagerが初期化されていない場合は初期化
    if (!MultiCharacterManager.characters || MultiCharacterManager.characters.length === 0) {
        MultiCharacterManager.detectAllCharacters();
    }
    
    if (MultiCharacterManager.characters.length === 0) {
        return '<div style="color: #888; font-size: 12px; text-align: center;">キャラクターが見つかりません</div>';
    }
    
    let buttonsHtml = '<div style="margin-bottom: 10px;">';
    
    MultiCharacterManager.characters.forEach(character => {
        const characterName = character.name || character.id;
        const displayName = characterName === 'purattokun' ? '🐱 ぷらっとくん' : 
                           characterName === 'nezumi' ? '🐭 ねずみ' : 
                           `🎯 ${characterName}`;
        
        buttonsHtml += `
            <button 
                id="char-select-${character.id}" 
                data-character-id="${character.id}"
                style="
                    width: 100%;
                    padding: 8px;
                    margin: 2px 0;
                    background: #f8f9fa;
                    border: 2px solid #dee2e6;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: bold;
                    transition: all 0.2s;
                "
                onmouseover="this.style.background='#e9ecef'"
                onmouseout="this.style.background='#f8f9fa'"
            >
                ${displayName}
            </button>
        `;
    });
    
    buttonsHtml += '</div>';
    
    console.log(`✅ ${MultiCharacterManager.characters.length}個のキャラクターボタン生成完了`);
    return buttonsHtml;
}

// キャラクター選択イベントリスナー設定関数
function setupCharacterSelectionListeners() {
    console.log('🔘 キャラクター選択イベントリスナー設定開始');
    
    // 選択状態管理
    let selectedCharacter = null;
    
    MultiCharacterManager.characters.forEach(character => {
        const button = document.getElementById(`char-select-${character.id}`);
        if (button) {
            button.addEventListener('click', () => {
                console.log(`🎯 キャラクター選択: ${character.name || character.id}`);
                
                // 前の選択を解除
                if (selectedCharacter) {
                    const prevButton = document.getElementById(`char-select-${selectedCharacter.id}`);
                    if (prevButton) {
                        prevButton.style.background = '#f8f9fa';
                        prevButton.style.border = '2px solid #dee2e6';
                        prevButton.style.color = '#000';
                    }
                }
                
                // 新しい選択を設定
                selectedCharacter = character;
                button.style.background = '#007acc';
                button.style.border = '2px solid #0056b3';
                button.style.color = '#fff';
                
                // MultiCharacterManagerに選択を反映
                MultiCharacterManager.selectCharacter(character);
                
                // 編集開始ボタンを有効化
                const startBtn = document.getElementById('start-edit-btn');
                if (startBtn) {
                    startBtn.disabled = false;
                    startBtn.style.background = '#28a745';
                    startBtn.style.opacity = '1';
                }
                
                console.log(`✅ キャラクター選択完了: ${character.name || character.id}`);
            });
        }
    });
    
    console.log('✅ キャラクター選択イベントリスナー設定完了');
}

function createEditStartUI() {
    console.log('🎨 編集開始UI作成');
    
    // 既存のパネルを削除
    const existingPanel = document.getElementById('spine-start-panel-v3');
    if (existingPanel) {
        existingPanel.remove();
        console.log('📝 既存パネル削除');
    }
    
    // 編集開始ボタンのみのシンプルUI
    const startPanel = document.createElement('div');
    startPanel.id = 'spine-start-panel-v3';
    startPanel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid #28a745;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
        min-width: 150px;
        text-align: center;
    `;
    
    // キャラクター選択ボタンを動的に生成
    const characterButtons = generateCharacterSelectionButtons();
    
    startPanel.innerHTML = `
        <div style="margin-bottom: 15px; font-weight: bold; color: #28a745; text-align: center;">
            🎯 キャラクター選択
        </div>
        ${characterButtons}
        <button id="start-edit-btn" style="
            width: 100%;
            padding: 12px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            margin-top: 10px;
        " disabled>
            ✏️ 編集開始
        </button>
    `;
    
    document.body.appendChild(startPanel);
    console.log('📦 パネルをDOMに追加完了');
    
    // キャラクター選択ボタンイベントリスナー設定
    setupCharacterSelectionListeners();
    
    // 編集開始ボタンイベント
    const startBtn = document.getElementById('start-edit-btn');
    if (startBtn) {
        console.log('🔘 編集開始ボタン取得成功 - イベントリスナー設定中...');
        startBtn.addEventListener('click', () => {
            console.log('🎯 編集開始ボタンがクリックされました！');
            removeEditStartUI();
            startEditMode();
            createEditingUI();
        });
        console.log('✅ イベントリスナー設定完了');
    } else {
        console.error('❌ 編集開始ボタンが見つかりません！');
    }
    
    console.log('✅ 編集開始UI作成完了');
}

function createEditingUI() {
    console.log('🎨 編集中UI作成開始');
    
    // 編集中のUIパネル作成
    const editPanel = document.createElement('div');
    editPanel.id = 'spine-edit-panel-v3';
    editPanel.className = 'editing-ui'; // タイトルバー用クラス追加
    editPanel.style.cssText = `
        position: fixed;
        top: 60px;
        right: 20px;
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid #007acc;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
        min-width: 200px;
    `;
    
    // バウンディングボックスボタンを削除したシンプル版
    editPanel.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: bold; color: #007acc;">
            📝 編集モード v3.0
        </div>
        
        <div id="coord-display" style="margin-bottom: 15px; padding: 8px; background: #f5f5f5; border-radius: 4px; font-family: monospace; font-size: 12px;">
            座標: 取得中...
        </div>
        
        <div style="margin-bottom: 15px;">
            <strong>基本操作:</strong><br>
            • ドラッグで移動<br>
            • ↑↓←→で微調整(0.1%)<br>
            • Shift+矢印で粗調整(1%)<br>
            <br>
            <strong>バウンディングボックス:</strong><br>
            • キャラクターをクリックで表示
        </div>
        
        <button id="package-export-btn" style="
            width: 100%;
            padding: 12px;
            background: #6f42c1;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 10px;
        ">
            📦 パッケージ出力
        </button>
        
        <button id="layer-edit-btn" style="
            width: 100%;
            padding: 12px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 10px;
        ">
            🎭 レイヤー編集
        </button>
        
        <div style="display: flex; gap: 8px; margin-bottom: 10px;">
            <button id="save-edit-btn" style="
                flex: 1;
                padding: 10px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                font-weight: bold;
            ">
                💾 保存
            </button>
            <button id="cancel-edit-btn" style="
                flex: 1;
                padding: 10px;
                background: #ffc107;
                color: #212529;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                font-weight: bold;
            ">
                ↶ キャンセル
            </button>
        </div>
        
        <button id="end-edit-btn" style="
            width: 100%;
            padding: 10px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        ">
            ✕ 編集終了
        </button>
    `;
    
    document.body.appendChild(editPanel);
    
    // イベントリスナー設定（バウンディングボックスボタン削除）
    setupEditingUIEvents();
    
    // 座標表示開始
    startCoordinateDisplay();
    
    // ドラッグ可能タイトルバーモジュール追加
    setTimeout(() => {
        const editingUI = document.querySelector('.editing-ui');
        if (editingUI && typeof createDraggableTitleBarModule === 'function') {
            console.log('🎨 ドラッグ可能タイトルバー追加中...');
            try {
                // グローバルスコープでModuleManagerを確認
                if (window.ModuleManager || (typeof ModuleManager !== 'undefined' && ModuleManager)) {
                    const manager = window.ModuleManager || ModuleManager;
                    manager.addModule('titleBar', createDraggableTitleBarModule());
                    const titleBarModule = manager.getModule('titleBar');
                    if (titleBarModule) {
                        titleBarModule.initialize(editingUI);
                        console.log('✅ ドラッグ可能タイトルバー初期化完了');
                    }
                } else {
                    console.warn('⚠️ ModuleManager が見つかりません');
                    // 代替手段：直接モジュールを作成・初期化
                    console.log('🔄 代替手段：直接初期化を実行');
                    const titleBarModule = createDraggableTitleBarModule();
                    titleBarModule.initialize(editingUI);
                    console.log('✅ 代替手段による初期化完了');
                }
            } catch (error) {
                console.error('❌ ドラッグ可能タイトルバー初期化エラー:', error);
                console.log('🔄 詳細なエラー情報:');
                console.log('- ModuleManager存在:', typeof ModuleManager !== 'undefined');
                console.log('- window.ModuleManager存在:', typeof window.ModuleManager !== 'undefined');
                console.log('- createDraggableTitleBarModule存在:', typeof createDraggableTitleBarModule !== 'undefined');
            }
        }
    }, 100); // UI構築完了を待つ
    
    console.log('✅ 編集中UI作成完了');
}

function setupEditingUIEvents() {
    // パッケージ出力ボタン
    const packageBtn = document.getElementById('package-export-btn');
    if (packageBtn) {
        packageBtn.addEventListener('click', async () => {
            if (PackageExportSystem.isProcessing) {
                alert('パッケージ出力処理中です。しばらくお待ちください。');
                return;
            }
            
            const confirmMessage = '現在の位置データでパッケージを出力しますか？\n\n' +
                                 '- 編集システムが除去されます\n' +
                                 '- CDN依存が解決されます\n' + 
                                 '- 完全な配布用パッケージが生成されます';
                                 
            if (confirm(confirmMessage)) {
                // ボタンを無効化して処理中状態にする
                packageBtn.disabled = true;
                packageBtn.style.background = '#6c757d';
                packageBtn.innerHTML = '📦 処理中...';
                
                try {
                    await exportPackage();
                } finally {
                    // 処理完了後にボタンを復元
                    packageBtn.disabled = false;
                    packageBtn.style.background = '#6f42c1';
                    packageBtn.innerHTML = '📦 パッケージ出力';
                }
            }
        });
    }
    
    // レイヤー編集ボタン
    const layerEditBtn = document.getElementById('layer-edit-btn');
    if (layerEditBtn) {
        layerEditBtn.addEventListener('click', () => {
            // 既にレイヤー編集モジュールが起動している場合
            if (window.ModuleManager && ModuleManager.hasModule('layerEdit')) {
                // 既存のモジュールを削除
                ModuleManager.removeModule('layerEdit');
                layerEditBtn.innerHTML = '🎭 レイヤー編集';
                layerEditBtn.style.background = '#667eea';
                return;
            }
            
            // レイヤー編集モジュールを起動
            const layerEditModule = createLayerEditModule();
            const success = window.ModuleManager ? ModuleManager.addModule('layerEdit', layerEditModule) : false;
            
            if (success) {
                console.log('🎭 レイヤー編集システム起動');
                layerEditBtn.innerHTML = '🎭 レイヤー編集 (起動中)';
                layerEditBtn.style.background = '#5a67d8';
            } else {
                alert('レイヤー編集システムの起動に失敗しました');
            }
        });
    }
    
    // 保存ボタン
    const saveBtn = document.getElementById('save-edit-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            saveCurrentState();
        });
    }
    
    // キャンセルボタン
    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            cancelEdit();
        });
    }
    
    // 編集終了ボタン（バウンディングボックスボタンは削除）
    const endBtn = document.getElementById('end-edit-btn');
    if (endBtn) {
        endBtn.addEventListener('click', () => {
            console.log('🗑️ 編集終了処理開始');
            try {
                // 1. 編集モード停止
                stopEditMode();
                
                // 2. 編集中UIを削除
                removeEditingUI();
                
                // 3. 編集開始UIを再作成
                setTimeout(() => {
                    createEditStartUI();
                    console.log('✅ 編集終了処理完了 - メニューが復元されました');
                }, 100);
                
            } catch (error) {
                console.error('❌ 編集終了処理エラー:', error);
            }
        });
    }
}

function removeEditStartUI() {
    const startPanel = document.getElementById('spine-start-panel-v3');
    if (startPanel) {
        startPanel.remove();
        console.log('✅ 編集開始UI削除完了');
    }
}

function removeEditingUI() {
    const editPanel = document.getElementById('spine-edit-panel-v3');
    if (editPanel) {
        editPanel.remove();
        console.log('✅ 編集中UI削除完了');
    }
}

function startCoordinateDisplay() {
    const coordDisplay = document.getElementById('coord-display');
    if (!coordDisplay) return;
    
    // 座標表示更新（定期実行）
    const updateCoords = () => {
        const targetElement = SpineEditSystem.baseLayer.targetElement;
        if (!targetElement) return;
        
        const computedStyle = window.getComputedStyle(targetElement);
        const parentRect = targetElement.parentElement.getBoundingClientRect();
        
        const leftPercent = SpineEditSystem.coords.pxToPercent(parseFloat(computedStyle.left), parentRect.width);
        const topPercent = SpineEditSystem.coords.pxToPercent(parseFloat(computedStyle.top), parentRect.height);
        const widthPercent = SpineEditSystem.coords.pxToPercent(parseFloat(computedStyle.width), parentRect.width);
        
        coordDisplay.innerHTML = `
            X: ${leftPercent}%<br>
            Y: ${topPercent}%<br>
            幅: ${widthPercent}%
        `;
    };
    
    // 初回更新
    updateCoords();
    
    // 定期更新（座標変更検知）
    const coordUpdateInterval = setInterval(() => {
        if (!SpineEditSystem.controlLayer.isEditMode) {
            clearInterval(coordUpdateInterval);
            return;
        }
        updateCoords();
    }, 100);
}

// キャラクター選択時のバウンディングボックス自動表示
// 複数キャラクター管理システム - モジュール化済み（spine-multi-character-manager.js）

function setupCharacterClickForBoundingBox() {
    // 複数キャラクター対応の初期化
    MultiCharacterManager.initialize();
    
    console.log('✅ 複数キャラクター対応バウンディングボックス設定完了');
}

// ========== バウンディングボックスモジュール ========== //

function createBoundingBoxModule() {
    console.log('📦 バウンディングボックスモジュール作成開始');
    
    const module = {
        boundingBox: null,
        handles: [],
        isActive: false,
        dragState: {
            isDragging: false,
            startPos: { x: 0, y: 0 },
            startElementRect: {},
            activeHandle: null,
            operation: null
        },
        
        // モジュール初期化（レイアウト確定待ち対応）
        initialize: async function(targetElement) {
            console.log('🔧 バウンディングボックス初期化');
            
            // 🔧 NEW: 座標系が確実にスワップされていることを確認
            if (!SpineEditSystem.coordinateSwap.isSwapped) {
                console.warn('⚠️ 座標系未スワップ検出 - 強制スワップ実行');
                console.log('🚫 enterEditMode呼び出しを完全無効化 - 瞬間移動防止');
                // SpineEditSystem.coordinateSwap.enterEditMode(targetElement); // 完全無効化
            }
            
            await this.createBoundingBox(targetElement);
            this.setupEventListeners();
            this.isActive = true;
        },
        
        // モジュールクリーンアップ
        cleanup: function() {
            console.log('🧹 バウンディングボックスクリーンアップ');
            this.removeBoundingBox();
            this.removeEventListeners();
            this.isActive = false;
            
            // プレビューボックス再表示
            if (MultiCharacterManager && MultiCharacterManager.updatePreviewBoxes) {
                MultiCharacterManager.updatePreviewBoxes();
            }
        },
        
        // バウンディングボックス作成（複数キャラクター対応・レイアウト確定待ち対応）
        createBoundingBox: async function(targetElement) {
            // レイアウト確定レース問題対策 - F12の有無に関係なく正確な座標取得
            await afterLayoutStable();
            
            const rect = targetElement.getBoundingClientRect();
            const parentRect = targetElement.parentElement.getBoundingClientRect();
            
            // 選択中キャラクターの名前を取得
            const characterName = MultiCharacterManager.activeCharacter ? 
                MultiCharacterManager.activeCharacter.name : 'Unknown';
            
            // バウンディングボックス本体（選択中は実線、より目立つ色）
            this.boundingBox = document.createElement('div');
            this.boundingBox.id = 'spine-bounding-box';
            this.boundingBox.style.cssText = `
                position: absolute;
                border: 2px solid #007acc;
                background: rgba(0, 122, 204, 0.15);
                pointer-events: none;
                z-index: 9999;
                left: ${rect.left - parentRect.left}px;
                top: ${rect.top - parentRect.top}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
                box-shadow: 0 0 8px rgba(0, 122, 204, 0.3);
            `;
            
            // キャラクター名表示ラベル追加
            const label = document.createElement('div');
            label.style.cssText = `
                position: absolute;
                top: -25px;
                left: 0;
                background: #007acc;
                color: white;
                padding: 2px 8px;
                font-size: 12px;
                border-radius: 3px;
                white-space: nowrap;
            `;
            label.textContent = characterName;
            this.boundingBox.appendChild(label);
            
            targetElement.parentElement.appendChild(this.boundingBox);
            
            // ハンドル作成
            this.createHandles();
            
            // 中央移動エリア作成
            this.createCenterArea();
            
            console.log(`📦 ${characterName} 用バウンディングボックス作成完了`);
        },
        
        // ハンドル作成
        createHandles: function() {
            const handleConfigs = [
                // 角ハンドル（○印）- 対角中心拡縮
                { position: 'nw', type: 'corner', cursor: 'nw-resize', opposite: 'se' },
                { position: 'ne', type: 'corner', cursor: 'ne-resize', opposite: 'sw' },
                { position: 'sw', type: 'corner', cursor: 'sw-resize', opposite: 'ne' },
                { position: 'se', type: 'corner', cursor: 'se-resize', opposite: 'nw' }
                // エッジハンドル削除：辺は直接クリック可能にする
            ];
            
            handleConfigs.forEach(config => {
                const handle = document.createElement('div');
                handle.className = `bbox-handle ${config.type}`;
                handle.dataset.position = config.position;
                handle.dataset.cursor = config.cursor;
                handle.dataset.opposite = config.opposite;
                
                // 角ハンドルスタイル（○印）
                handle.style.cssText = `
                    position: absolute;
                    background: #fff;
                    border: 2px solid #007acc;
                    pointer-events: all;
                    z-index: 10000;
                    cursor: ${config.cursor};
                    width: 12px; 
                    height: 12px; 
                    border-radius: 50%; 
                    margin: -6px 0 0 -6px;
                `;
                
                // ハンドル位置設定
                this.positionHandle(handle, config.position);
                
                this.boundingBox.appendChild(handle);
                this.handles.push({ element: handle, config });
            });
            
            // 辺のクリック領域作成（見えない・クリック可能）
            this.createEdgeClickAreas();
        },
        
        // 【修正1】ハンドル位置設定: transform重複を避けた安全な位置指定
        positionHandle: function(handle, position) {
            // シンプルな配置でtransform重複を回避
            switch(position) {
                case 'nw': 
                    handle.style.top = '0'; 
                    handle.style.left = '0'; 
                    break;
                case 'ne': 
                    handle.style.top = '0'; 
                    handle.style.right = '0'; 
                    handle.style.marginRight = '-6px';
                    break;
                case 'sw': 
                    handle.style.bottom = '0'; 
                    handle.style.left = '0'; 
                    handle.style.marginBottom = '-6px';
                    break;
                case 'se': 
                    handle.style.bottom = '0'; 
                    handle.style.right = '0'; 
                    handle.style.margin = '0 -6px -6px 0';
                    break;
            }
        },
        
        // 辺のクリック領域作成
        createEdgeClickAreas: function() {
            const edgeConfigs = [
                { position: 'n', cursor: 'n-resize', opposite: 's' },
                { position: 'e', cursor: 'e-resize', opposite: 'w' },
                { position: 's', cursor: 's-resize', opposite: 'n' },
                { position: 'w', cursor: 'w-resize', opposite: 'e' }
            ];
            
            edgeConfigs.forEach(config => {
                const edgeArea = document.createElement('div');
                edgeArea.className = 'bbox-edge-area';
                edgeArea.dataset.position = config.position;
                edgeArea.dataset.cursor = config.cursor;
                edgeArea.dataset.opposite = config.opposite;
                edgeArea.dataset.type = 'edge';
                
                // 辺のクリック領域スタイル（見えない・クリック可能）
                edgeArea.style.cssText = `
                    position: absolute;
                    background: transparent;
                    pointer-events: all;
                    z-index: 9999;
                    cursor: ${config.cursor};
                `;
                
                // 辺領域の位置とサイズ設定
                this.positionEdgeArea(edgeArea, config.position);
                
                this.boundingBox.appendChild(edgeArea);
            });
        },
        
        // 辺領域の位置設定
        positionEdgeArea: function(edgeArea, position) {
            const edgeWidth = 8; // クリック領域の幅
            
            switch(position) {
                case 'n': // 上辺
                    edgeArea.style.top = `-${edgeWidth/2}px`;
                    edgeArea.style.left = '0';
                    edgeArea.style.width = '100%';
                    edgeArea.style.height = `${edgeWidth}px`;
                    break;
                case 'e': // 右辺
                    edgeArea.style.top = '0';
                    edgeArea.style.right = `-${edgeWidth/2}px`;
                    edgeArea.style.width = `${edgeWidth}px`;
                    edgeArea.style.height = '100%';
                    break;
                case 's': // 下辺
                    edgeArea.style.bottom = `-${edgeWidth/2}px`;
                    edgeArea.style.left = '0';
                    edgeArea.style.width = '100%';
                    edgeArea.style.height = `${edgeWidth}px`;
                    break;
                case 'w': // 左辺
                    edgeArea.style.top = '0';
                    edgeArea.style.left = `-${edgeWidth/2}px`;
                    edgeArea.style.width = `${edgeWidth}px`;
                    edgeArea.style.height = '100%';
                    break;
            }
        },
        
        // 中央移動エリア作成
        createCenterArea: function() {
            const centerArea = document.createElement('div');
            centerArea.className = 'bbox-center-area';
            centerArea.style.cssText = `
                position: absolute;
                top: 20%;
                left: 20%;
                width: 60%;
                height: 60%;
                cursor: crosshair;
                background: transparent;
                pointer-events: all;
                z-index: 9998;
            `;
            
            this.boundingBox.appendChild(centerArea);
        },
        
        // イベントリスナー設定
        setupEventListeners: function() {
            this.mouseDownHandler = this.handleMouseDown.bind(this);
            this.mouseMoveHandler = this.handleMouseMove.bind(this);
            this.mouseUpHandler = this.handleMouseUp.bind(this);
            
            document.addEventListener('mousedown', this.mouseDownHandler);
            document.addEventListener('mousemove', this.mouseMoveHandler);
            document.addEventListener('mouseup', this.mouseUpHandler);
        },
        
        // イベントリスナー削除
        removeEventListeners: function() {
            document.removeEventListener('mousedown', this.mouseDownHandler);
            document.removeEventListener('mousemove', this.mouseMoveHandler);
            document.removeEventListener('mouseup', this.mouseUpHandler);
        },
        
        // マウスダウン処理
        handleMouseDown: function(event) {
            const target = event.target;
            
            // 角ハンドルクリック判定
            if (target.classList.contains('bbox-handle')) {
                this.startHandleOperation(event, target);
            } 
            // 辺エリアクリック判定
            else if (target.classList.contains('bbox-edge-area')) {
                this.startEdgeOperation(event, target);
            }
            // 中央移動エリアクリック判定
            else if (target.classList.contains('bbox-center-area')) {
                this.startMoveOperation(event);
            }
        },
        
        // 角ハンドル操作開始（対角中心拡縮）
        startHandleOperation: function(event, handle) {
            this.dragState.isDragging = true;
            this.dragState.operation = 'corner-resize';
            this.dragState.activeHandle = handle;
            this.dragState.startPos = { x: event.clientX, y: event.clientY };
            
            const targetElement = SpineEditSystem.baseLayer.targetElement;
            const computedStyle = window.getComputedStyle(targetElement);
            
            // CSS値での初期状態を記録（座標系統一）
            this.dragState.startElementRect = {
                left: parseFloat(computedStyle.left),
                top: parseFloat(computedStyle.top),
                width: parseFloat(computedStyle.width),
                height: parseFloat(computedStyle.height)
            };
            
            // 対角点を固定点として記録
            const position = handle.dataset.position;
            this.dragState.fixedPoint = this.getOppositeCornerPoint(position);
            
            event.preventDefault();
            event.stopPropagation();
        },
        
        // 辺操作開始（反対側中心拡縮）
        startEdgeOperation: function(event, edgeArea) {
            this.dragState.isDragging = true;
            this.dragState.operation = 'edge-resize';
            this.dragState.activeHandle = edgeArea;
            this.dragState.startPos = { x: event.clientX, y: event.clientY };
            
            const targetElement = SpineEditSystem.baseLayer.targetElement;
            const computedStyle = window.getComputedStyle(targetElement);
            
            // CSS値での初期状態を記録（座標系統一）
            this.dragState.startElementRect = {
                left: parseFloat(computedStyle.left),
                top: parseFloat(computedStyle.top),
                width: parseFloat(computedStyle.width),
                height: parseFloat(computedStyle.height)
            };
            
            // 反対側の辺を固定点として記録
            const position = edgeArea.dataset.position;
            this.dragState.fixedEdge = this.getOppositeEdge(position);
            
            event.preventDefault();
            event.stopPropagation();
        },
        
        // 【修正2】固定点計算の改善: getBoundingClientRect()で正確な位置取得
        getOppositeCornerPoint: function(position) {
            const targetElement = SpineEditSystem.baseLayer.targetElement;
            const rect = targetElement.getBoundingClientRect();
            const parentRect = targetElement.parentElement.getBoundingClientRect();
            
            // transform: translate(-50%, -50%)を考慮した実際の要素境界を取得
            let fixedPoint;
            switch(position) {
                case 'nw': fixedPoint = { x: rect.right - parentRect.left, y: rect.bottom - parentRect.top }; break; // SE角
                case 'ne': fixedPoint = { x: rect.left - parentRect.left, y: rect.bottom - parentRect.top }; break; // SW角
                case 'sw': fixedPoint = { x: rect.right - parentRect.left, y: rect.top - parentRect.top }; break; // NE角
                case 'se': fixedPoint = { x: rect.left - parentRect.left, y: rect.top - parentRect.top }; break; // NW角
            }
            
            console.log('🔧 修正済み固定点:', { position, fixedPoint, rect, parentRect });
            return fixedPoint;
        },
        
        // 【修正3】反対側の辺座標取得: 親要素基準統一、transform考慮
        getOppositeEdge: function(position) {
            const rect = this.dragState.startElementRect;
            const targetElement = SpineEditSystem.baseLayer.targetElement;
            
            // CSS座標系とJavaScript座標系の整合性を確保
            let oppositeEdge;
            switch(position) {
                case 'n': oppositeEdge = { type: 'horizontal', value: rect.top + rect.height }; break; // 下辺
                case 'e': oppositeEdge = { type: 'vertical', value: rect.left }; break; // 左辺
                case 's': oppositeEdge = { type: 'horizontal', value: rect.top }; break; // 上辺
                case 'w': oppositeEdge = { type: 'vertical', value: rect.left + rect.width }; break; // 右辺
                default: oppositeEdge = { type: 'horizontal', value: rect.top };
            }
            
            console.log('🔧 反対辺計算:', { position, oppositeEdge, rect });
            return oppositeEdge;
        },
        
        // 移動操作開始
        startMoveOperation: function(event) {
            this.dragState.isDragging = true;
            this.dragState.operation = 'move';
            this.dragState.startPos = { x: event.clientX, y: event.clientY };
            
            const targetElement = SpineEditSystem.baseLayer.targetElement;
            const computedStyle = window.getComputedStyle(targetElement);
            this.dragState.startElementRect = {
                left: parseFloat(computedStyle.left),
                top: parseFloat(computedStyle.top)
            };
            
            event.preventDefault();
            event.stopPropagation();
        },
        
        // マウス移動処理
        handleMouseMove: function(event) {
            if (!this.dragState.isDragging) return;
            
            const deltaX = event.clientX - this.dragState.startPos.x;
            const deltaY = event.clientY - this.dragState.startPos.y;
            
            const modifiers = {
                shift: event.shiftKey,    // 縦横比保持
                ctrl: event.ctrlKey,      // Windows: 中心から拡縮
                alt: event.altKey,        // Mac: 中心から拡縮
                meta: event.metaKey       // Mac Command
            };
            
            if (this.dragState.operation === 'move') {
                this.performMove(deltaX, deltaY);
            } else if (this.dragState.operation === 'corner-resize') {
                this.performCornerResize(deltaX, deltaY, modifiers);
            } else if (this.dragState.operation === 'edge-resize') {
                this.performEdgeResize(deltaX, deltaY, modifiers);
            }
        },
        
        // 移動実行
        performMove: function(deltaX, deltaY) {
            const targetElement = SpineEditSystem.baseLayer.targetElement;
            const parentRect = targetElement.parentElement.getBoundingClientRect();
            
            const newLeft = this.dragState.startElementRect.left + deltaX;
            const newTop = this.dragState.startElementRect.top + deltaY;
            
            const newLeftPercent = SpineEditSystem.coords.pxToPercent(newLeft, parentRect.width);
            const newTopPercent = SpineEditSystem.coords.pxToPercent(newTop, parentRect.height);
            
            targetElement.style.left = newLeftPercent + '%';
            targetElement.style.top = newTopPercent + '%';
            
            this.updateBoundingBoxPosition(targetElement);
        },
        
        performCornerResize: function(deltaX, deltaY, modifiers) {
            const targetElement = SpineEditSystem.baseLayer.targetElement;
            const handle = this.dragState.activeHandle;
            const position = handle.dataset.position;
            
            console.log('🔧 シンプル座標系でのリサイズ開始:', { deltaX, deltaY, position, modifiers });
            
            // 座標系完全統一: 全てgetBoundingClientRectベースで統一
            const rect = targetElement.getBoundingClientRect();
            const parentRect = targetElement.parentElement.getBoundingClientRect();
            
            // 全ての座標を親要素基準で統一
            const currentMouseX = (this.dragState.startPos.x + deltaX) - parentRect.left;
            const currentMouseY = (this.dragState.startPos.y + deltaY) - parentRect.top;
            
            // 現在の要素位置も親要素基準で統一
            const currentLeft = rect.left - parentRect.left;
            const currentTop = rect.top - parentRect.top;
            const currentWidth = rect.width;
            const currentHeight = rect.height;
            
            console.log('🔧 統一座標系確認:', { currentMouseX, currentMouseY, currentLeft, currentTop, currentWidth, currentHeight });
            
            let newWidth, newHeight, newLeft, newTop;
            
            // 🔧 Ctrl/Altキー: 中心固定拡縮（優先処理）
            if (modifiers.ctrl || modifiers.alt) {
                console.log('🔧 Ctrl/Altキー中心固定拡縮');
                
                const centerX = currentLeft + currentWidth / 2;
                const centerY = currentTop + currentHeight / 2;
                
                // 中心からマウス位置までの距離を2倍したものが新しいサイズ
                const deltaFromCenterX = Math.abs(currentMouseX - centerX);
                const deltaFromCenterY = Math.abs(currentMouseY - centerY);
                
                newWidth = Math.max(20, deltaFromCenterX * 2);
                newHeight = Math.max(20, deltaFromCenterY * 2);
                
                // Shiftキー併用時: 縦横比保持
                if (modifiers.shift) {
                    const aspectRatio = currentWidth / currentHeight;
                    console.log('🔧 Ctrl+Shift: 中心固定+縦横比保持');
                    
                    // より大きな変化に合わせる
                    if (deltaFromCenterX / currentWidth > deltaFromCenterY / currentHeight) {
                        newHeight = newWidth / aspectRatio;
                    } else {
                        newWidth = newHeight * aspectRatio;
                    }
                }
                
                // 中心固定なので位置は中心から計算
                newLeft = centerX - newWidth / 2;
                newTop = centerY - newHeight / 2;
                
            } else {
                // 🔧 通常の対角固定拡縮
                
                // 対角固定点を取得
                let fixedX, fixedY;
                switch(position) {
                    case 'nw': fixedX = currentLeft + currentWidth; fixedY = currentTop + currentHeight; break;  // SE角固定
                    case 'ne': fixedX = currentLeft; fixedY = currentTop + currentHeight; break;                // SW角固定
                    case 'sw': fixedX = currentLeft + currentWidth; fixedY = currentTop; break;                 // NE角固定
                    case 'se': fixedX = currentLeft; fixedY = currentTop; break;                                // NW角固定
                }
                
                // 基本的なサイズ計算
                newWidth = Math.max(20, Math.abs(currentMouseX - fixedX));
                newHeight = Math.max(20, Math.abs(currentMouseY - fixedY));
                
                // Shiftキー: 縦横比保持
                if (modifiers.shift) {
                    const aspectRatio = currentWidth / currentHeight;
                    console.log('🔧 Shiftキー縦横比保持:', { aspectRatio });
                    
                    // マウス移動量の大きい方向に合わせる
                    const deltaXRatio = Math.abs(currentMouseX - fixedX) / currentWidth;
                    const deltaYRatio = Math.abs(currentMouseY - fixedY) / currentHeight;
                    
                    if (deltaXRatio > deltaYRatio) {
                        // 横方向の変化が大きい場合、幅基準で高さを調整
                        newHeight = newWidth / aspectRatio;
                    } else {
                        // 縦方向の変化が大きい場合、高さ基準で幅を調整
                        newWidth = newHeight * aspectRatio;
                    }
                    
                    console.log('🔧 縦横比保持結果:', { newWidth, newHeight });
                }
                
                // 対角固定での位置計算
                newLeft = Math.min(currentMouseX, fixedX);
                newTop = Math.min(currentMouseY, fixedY);
                
                // Shiftキー使用時の位置補正
                if (modifiers.shift) {
                    // 縦横比調整後のサイズを反映した位置補正
                    switch(position) {
                        case 'nw':
                            newLeft = fixedX - newWidth;
                            newTop = fixedY - newHeight;
                            break;
                        case 'ne':
                            newLeft = fixedX;
                            newTop = fixedY - newHeight;
                            break;
                        case 'sw':
                            newLeft = fixedX - newWidth;
                            newTop = fixedY;
                            break;
                        case 'se':
                            newLeft = fixedX;
                            newTop = fixedY;
                            break;
                    }
                }
            }
            
            // 画面内チェック（親要素基準）
            const parentWidth = parentRect.width;
            const parentHeight = parentRect.height;
            
            if (newLeft < 0 || newTop < 0 || newLeft + newWidth > parentWidth || newTop + newHeight > parentHeight) {
                console.warn('🚨 親要素外配置検出、適用をスキップ');
                return;
            }
            
            // 座標をpx値として直接適用
            targetElement.style.left = newLeft + 'px';
            targetElement.style.top = newTop + 'px';
            targetElement.style.width = newWidth + 'px';
            targetElement.style.height = newHeight + 'px';
            
            // DOM更新を確実に反映させる
            targetElement.offsetHeight; // 強制リフロー
            
            console.log('✅ 修飾キー対応リサイズ完了:', {
                modifiers,
                left: newLeft + 'px',
                top: newTop + 'px', 
                width: newWidth + 'px',
                height: newHeight + 'px'
            });
            
            // バウンディングボックス位置更新
            this.updateBoundingBoxPosition(targetElement);
        },
        
        // 辺拡縮実行（反対側中心）
        performEdgeResize: function(deltaX, deltaY, modifiers) {
            const targetElement = SpineEditSystem.baseLayer.targetElement;
            const parentRect = targetElement.parentElement.getBoundingClientRect();
            const edgeArea = this.dragState.activeHandle;
            const position = edgeArea.dataset.position;
            const fixedEdge = this.dragState.fixedEdge;
            
            // 初期値
            let newWidth = this.dragState.startElementRect.width;
            let newHeight = this.dragState.startElementRect.height;
            let newLeft = this.dragState.startElementRect.left;
            let newTop = this.dragState.startElementRect.top;
            
            // 辺に応じた拡縮計算（反対側固定）
            if (position === 'n') {
                // 上辺：下辺を固定
                newHeight = fixedEdge.value - (this.dragState.startElementRect.top + deltaY);
                newTop = fixedEdge.value - newHeight;
            } else if (position === 's') {
                // 下辺：上辺を固定
                newHeight = (this.dragState.startElementRect.top + this.dragState.startElementRect.height + deltaY) - fixedEdge.value;
            } else if (position === 'w') {
                // 左辺：右辺を固定
                newWidth = fixedEdge.value - (this.dragState.startElementRect.left + deltaX);
                newLeft = fixedEdge.value - newWidth;
            } else if (position === 'e') {
                // 右辺：左辺を固定
                newWidth = (this.dragState.startElementRect.left + this.dragState.startElementRect.width + deltaX) - fixedEdge.value;
            }
            
            // 最小サイズ制限
            newWidth = Math.max(20, newWidth);
            newHeight = Math.max(20, newHeight);
            
            // 【修正2】Shiftキー処理: 辺操作時の縦横比保持機能追加
            if (modifiers.shift) {
                const aspectRatio = this.dragState.startElementRect.width / this.dragState.startElementRect.height;
                
                if (position === 'n' || position === 's') {
                    // 縦方向の変更時、横幅を調整
                    newWidth = newHeight * aspectRatio;
                    newLeft = this.dragState.startElementRect.left + (this.dragState.startElementRect.width - newWidth) / 2;
                } else if (position === 'w' || position === 'e') {
                    // 横方向の変更時、高さを調整
                    newHeight = newWidth / aspectRatio;
                    newTop = this.dragState.startElementRect.top + (this.dragState.startElementRect.height - newHeight) / 2;
                }
                
                console.log('🔧 Shiftキー縦横比保持:', { aspectRatio, newWidth, newHeight, newLeft, newTop });
            }
            
            console.log('🔧 辺拡縮最終計算:', { position, newLeft, newTop, newWidth, newHeight });
            
            // %に変換して適用
            const newLeftPercent = SpineEditSystem.coords.pxToPercent(newLeft, parentRect.width);
            const newTopPercent = SpineEditSystem.coords.pxToPercent(newTop, parentRect.height);
            const newWidthPercent = SpineEditSystem.coords.pxToPercent(newWidth, parentRect.width);
            const newHeightPercent = SpineEditSystem.coords.pxToPercent(newHeight, parentRect.height);
            
            targetElement.style.left = newLeftPercent + '%';
            targetElement.style.top = newTopPercent + '%';
            targetElement.style.width = newWidthPercent + '%';
            targetElement.style.height = newHeightPercent + '%';
            
            this.updateBoundingBoxPosition(targetElement);
        },
        
        
        // マウスアップ処理
        handleMouseUp: function(event) {
            if (!this.dragState.isDragging) return;
            
            this.dragState.isDragging = false;
            this.dragState.operation = null;
            this.dragState.activeHandle = null;
        },
        
        // バウンディングボックス位置更新
        updateBoundingBoxPosition: function(targetElement) {
            const rect = targetElement.getBoundingClientRect();
            const parentRect = targetElement.parentElement.getBoundingClientRect();
            
            this.boundingBox.style.left = (rect.left - parentRect.left) + 'px';
            this.boundingBox.style.top = (rect.top - parentRect.top) + 'px';
            this.boundingBox.style.width = rect.width + 'px';
            this.boundingBox.style.height = rect.height + 'px';
        },
        
        // バウンディングボックス削除
        removeBoundingBox: function() {
            if (this.boundingBox) {
                this.boundingBox.remove();
                this.boundingBox = null;
                this.handles = [];
            }
        }
    };
    
    console.log('✅ バウンディングボックスモジュール作成完了');
    return module;
}

// ========== 編集モード切り替え ========== //

function startEditMode() {
    console.log('🎯 編集モード開始');
    
    // 基本レイヤー初期化
    if (!initializeBaseLayer()) {
        console.error('❌ 基本レイヤー初期化失敗');
        return false;
    }
    
    // 制御レイヤー初期化
    if (!initializeControlLayer()) {
        console.error('❌ 制御レイヤー初期化失敗');
        return false;
    }
    
    // バウンディングボックス外クリック選択解除ハンドラーを追加
    setupGlobalClickHandler();
    
    SpineEditSystem.controlLayer.isEditMode = true;
    
    // 🔧 座標系を編集モードに切り替え（競合回避の核心）
    const targetElement = SpineEditSystem.baseLayer.targetElement;
    
    // 🔧 レイアウト確定を待ってから座標処理実行（F12問題対策・改良版）
    console.log('🎯 レイアウト確定待ち後に座標処理実行 - レイアウト確定レース問題解決');
    afterLayoutStable().then(() => {
        console.log('🔧 レイアウト確定後の座標処理開始');
        if (SpineEditSystem.coordinateSwap && typeof SpineEditSystem.coordinateSwap.enterEditMode === 'function') {
            SpineEditSystem.coordinateSwap.enterEditMode(targetElement);
            console.log('✅ 座標モード切り替え完了');
        } else {
            console.warn('⚠️ coordinateSwap.enterEditMode関数が利用できません');
        }
    }).catch(error => {
        console.error('❌ レイアウト確定待ち処理でエラー:', error);
    });
    
    // 視覚的フィードバック（最小限）
    targetElement.style.outline = '2px dashed #007acc';
    targetElement.style.cursor = 'move';
    
    // キャラクタークリック→バウンディングボックス機能設定
    setupCharacterClickForBoundingBox();
    
    // タイトルバーモジュール追加
    const editingUI = document.querySelector('.editing-ui');
    if (editingUI) {
        if (window.ModuleManager) {
            ModuleManager.addModule('titleBar', createDraggableTitleBarModule());
            const titleBarModule = ModuleManager.getModule('titleBar');
        }
        if (titleBarModule) {
            titleBarModule.initialize(editingUI);
        }
    }
    
    console.log('✅ 編集モード開始完了（座標系スワップ済み）');
    return true;
}

function stopEditMode() {
    console.log('🔚 編集モード終了');
    
    SpineEditSystem.controlLayer.isEditMode = false;
    
    // 複数キャラクターマネージャーのクリーンアップ
    if (MultiCharacterManager && MultiCharacterManager.cleanup) {
        MultiCharacterManager.cleanup();
    }
    
    // グローバルクリックハンドラーを削除
    cleanupGlobalClickHandler();
    
    // 🔧 座標系を元に戻す（編集結果を保存）
    const targetElement = SpineEditSystem.baseLayer.targetElement;
    if (targetElement) {
        SpineEditSystem.coordinateSwap.exitEditMode(targetElement);
        
        // 視覚的フィードバック削除
        targetElement.style.outline = '';
        targetElement.style.cursor = '';
    }
    
    // 編集中UI削除
    removeEditingUI();
    
    // 全モジュール削除（クリーンな状態に戻す）
    ModuleManager.removeAllModules();
    
    console.log('✅ 編集モード終了完了 - 複数キャラクター対応・座標系復元・クリーンな状態に復帰');
}

// ========== 状態管理・永続化システム ========== //

// 状態管理オブジェクト
// savedState - モジュール化済み（spine-state-manager.js）

// 現在の状態を保存
function saveCurrentState() {
    console.log('💾 編集中キャラクターの状態を保存開始');
    
    // 🎯 編集中のキャラクターのみを対象
    const targetElement = SpineEditSystem.baseLayer.targetElement;
    if (!targetElement) {
        console.error('❌ 編集中の対象要素が見つかりません');
        return false;
    }
    
    // 🔧 既存の保存データを取得（他のキャラクターデータを保持）
    let existingData = {};
    try {
        const saved = localStorage.getItem('spine-positioning-state');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.characters) {
                existingData = parsed.characters;
            }
        }
    } catch (e) {
        console.warn('既存データの読み込みに失敗、新規作成します');
    }
    
    // 🎯 編集中キャラクターの状態を取得
    // 座標系を一時的に元に戻して正確な値を取得
    if (SpineEditSystem.coordinateSwap) {
        SpineEditSystem.coordinateSwap.exitEditMode(targetElement);
    }
    
    // 編集中キャラクターのデータのみ更新
    existingData[targetElement.id] = {
        left: targetElement.style.left,
        top: targetElement.style.top,
        width: targetElement.style.width,
        height: targetElement.style.height,
        transform: targetElement.style.transform
    };
    
    // 座標系を編集モードに戻す
    if (SpineEditSystem.coordinateSwap) {
        console.log('🚫 enterEditMode呼び出しを完全無効化 - 瞬間移動防止');
        // SpineEditSystem.coordinateSwap.enterEditMode(targetElement); // 完全無効化
    }
    
    // 新しい汎用データ構造で保存
    savedState.characters = existingData;
    savedState.timestamp = new Date().toISOString();
    
    console.log(`✅ ${targetElement.id} の状態を更新:`, existingData[targetElement.id]);
    console.log('📋 全保存データ:', existingData);
    
    // localStorageに保存
    try {
        localStorage.setItem('spine-positioning-state', JSON.stringify(savedState));
        console.log('✅ localStorage保存完了:', savedState);
        
        // 保存成功のフィードバック
        const coordDisplay = document.getElementById('coord-display');
        if (coordDisplay) {
            const originalText = coordDisplay.textContent;
            coordDisplay.textContent = '💾 保存完了！';
            coordDisplay.style.background = '#d4edda';
            coordDisplay.style.color = '#155724';
            
            setTimeout(() => {
                coordDisplay.textContent = originalText;
                coordDisplay.style.background = '#f5f5f5';
                coordDisplay.style.color = '';
            }, 2000);
        }
        
        // 🔧 編集中の要素の座標系を編集モードに戻す
        const currentTarget = SpineEditSystem.baseLayer.targetElement;
        if (currentTarget && SpineEditSystem.coordinateSwap) {
            console.log('🚫 enterEditMode呼び出しを完全無効化 - 瞬間移動防止');
            // SpineEditSystem.coordinateSwap.enterEditMode(currentTarget); // 完全無効化
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ localStorage保存失敗:', error);
        
        // 🔧 エラー時も編集中の要素の座標系を編集モードに戻す
        const currentTarget = SpineEditSystem.baseLayer.targetElement;
        if (currentTarget && SpineEditSystem.coordinateSwap) {
            console.log('🚫 enterEditMode呼び出しを完全無効化 - 瞬間移動防止');
            // SpineEditSystem.coordinateSwap.enterEditMode(currentTarget); // 完全無効化
        }
        
        return false;
    }
}

// キャンセル（ページリロード方式）
function cancelEdit() {
    console.log('↶ 編集をキャンセル（ページリロード方式）');
    
    const coordDisplay = document.getElementById('coord-display');
    if (coordDisplay) {
        coordDisplay.textContent = '🔄 前回保存した状態に戻しています...';
        coordDisplay.style.background = '#fff3cd';
        coordDisplay.style.color = '#856404';
    }
    
    // 500ms後にページリロード（ユーザーがメッセージを読めるように）
    setTimeout(() => {
        location.reload();
    }, 500);
}

// 初期化時の状態復元
function restoreCharacterState() {
    console.log('🔄 全キャラクター状態の復元開始');
    
    try {
        const saved = localStorage.getItem('spine-positioning-state');
        if (!saved) {
            console.log('💡 保存された状態なし - 初期状態を維持');
            return false;
        }
        
        const loadedState = JSON.parse(saved);
        console.log('📋 localStorage状態:', loadedState);
        
        // 🎯 新形式（characters オブジェクト）での復元
        if (loadedState.characters) {
            console.log('✅ 新形式（汎用キャラクターデータ）で復元中...');
            
            let restoredCount = 0;
            for (const [characterId, characterData] of Object.entries(loadedState.characters)) {
                const element = document.getElementById(characterId);
                if (element && characterData) {
                    console.log(`✅ ${characterId} の状態を復元:`, characterData);
                    
                    if (characterData.left) element.style.left = characterData.left;
                    if (characterData.top) element.style.top = characterData.top;
                    if (characterData.width) element.style.width = characterData.width;
                    if (characterData.height) element.style.height = characterData.height;
                    if (characterData.transform) element.style.transform = characterData.transform;
                    
                    restoredCount++;
                } else {
                    console.warn(`⚠️ 要素が見つかりません: ${characterId}`);
                }
            }
            
            console.log(`✅ ${restoredCount}個のキャラクター状態復元完了`);
            return restoredCount > 0;
            
        } else if (loadedState.character) {
            // 🔄 旧形式でのフォールバック復元（下位互換性）
            console.log('⚠️ 旧形式データを検出 - フォールバック復元中...');
            
            // nezumi対応セレクターを追加
            const selectors = [
                '#character-canvas',
                '#purattokun-canvas',
                '#nezumi-canvas',        // ✅ nezumi対応追加
                '.demo-character',
                '.spine-character'
            ];
            
            let targetElement = null;
            for (const selector of selectors) {
                targetElement = document.querySelector(selector);
                if (targetElement) {
                    console.log(`✅ 対象要素見つかった: ${selector}`);
                    break;
                }
            }
            
            if (!targetElement) {
                console.warn('⚠️ 対象要素が見つかりません - 状態復元をスキップ');
                return false;
            }
            
            // 保存された状態を適用
            if (loadedState.character.left) targetElement.style.left = loadedState.character.left;
            if (loadedState.character.top) targetElement.style.top = loadedState.character.top;
            if (loadedState.character.width) targetElement.style.width = loadedState.character.width;
            if (loadedState.character.height) targetElement.style.height = loadedState.character.height;
            if (loadedState.character.transform) targetElement.style.transform = loadedState.character.transform;
            
            console.log('✅ 旧データ構造による状態復元完了');
            return true;
        }
        
        console.warn('⚠️ 復元可能なデータが見つかりません');
        return false;
        
    } catch (error) {
        console.error('❌ 状態復元失敗:', error);
        return false;
    }
}

// ========== 初期化・起動システム ========== //

function initializeSpineEditSystem() {
    if (systemInitialized) {
        console.log('⚠️ システム既に初期化済み');
        return;
    }
    
    console.log('🚀 Spine編集システム v3.0 初期化開始（spine-edit-core連携版）');
    systemInitialized = true;
    
    // URLパラメータ確認
    const urlParams = new URLSearchParams(window.location.search);
    const editMode = urlParams.get('edit') === 'true';
    console.log('📋 URLパラメータ確認:', { 
        url: window.location.href,
        search: window.location.search,
        editMode: editMode 
    });
    
    if (editMode) {
        console.log('✅ 編集モード検出 - 編集開始UI表示');
        // 編集開始UIを表示（自動開始はしない）
        createEditStartUI();
    } else {
        console.log('ℹ️ 編集モードではありません');
    }
    
    // 保存された状態の復元（編集モード以外でも実行）
    setTimeout(() => {
        restoreCharacterState();
    }, 1000); // DOM構築完了を待つ
    
    console.log('✅ Spine編集システム v3.0 初期化完了');
    
    // 🧪 初期化後の状況診断（デバッグ用）
    setTimeout(() => {
        diagnoseSystemStatus();
    }, 500);
}

// ========== システム診断機能（デバッグ用） ========== //

/**
 * システム状況の包括診断
 */
function diagnoseSystemStatus() {
    console.group('🔍 v3.0 Phase 2 システム診断');
    
    console.log('📋 コアシステム状況:');
    console.log(`  - spineEditCoreLoaded: ${spineEditCoreLoaded}`);
    console.log(`  - systemInitialized: ${systemInitialized}`);
    console.log(`  - globalClickHandler: ${globalClickHandler !== null ? '設定済み' : '未設定'}`);
    
    console.log('📋 SpineEditSystem状況:');
    console.log(`  - SpineEditSystem存在: ${!!window.SpineEditSystem}`);
    if (window.SpineEditSystem) {
        console.log(`  - baseLayer: ${!!window.SpineEditSystem.baseLayer}`);
        console.log(`  - controlLayer: ${!!window.SpineEditSystem.controlLayer}`);
        console.log(`  - coordinateSwap: ${!!window.SpineEditSystem.coordinateSwap}`);
        console.log(`  - coords: ${!!window.SpineEditSystem.coords}`);
        console.log(`  - 編集モード: ${window.SpineEditSystem.controlLayer?.isEditMode || false}`);
    }
    
    console.log('📋 モジュール管理状況:');
    console.log(`  - ModuleManager存在: ${!!window.ModuleManager}`);
    if (window.SpineEditSystem?.modules) {
        console.log(`  - 登録モジュール数: ${window.SpineEditSystem.modules.size}`);
    }
    
    console.groupEnd();
}

// デバッグ用のグローバル診断関数
window.diagnoseV3System = diagnoseSystemStatus;

// ========== 🧪 Phase 3 nezumi統合テスト・デバッグ関数群 ========== //
// Phase3DebugTools - モジュール化済み（spine-debug-tools.js）
// 互換性のため再定義なし

// ========== ドラッグ可能タイトルバーモジュール ========== //

function createDraggableTitleBarModule() {
    console.log('📋 ドラッグ可能タイトルバーモジュール作成開始');
    
    const module = {
        titleBar: null,
        isActive: false,
        dragState: {
            isDragging: false,
            startPos: { x: 0, y: 0 },
            startWindowPos: { x: 0, y: 0 }
        },
        
        // モジュール初期化
        initialize: function(parentContainer) {
            console.log('🔧 ドラッグ可能タイトルバー初期化');
            
            // 親コンテナの位置設定を確保
            this.ensureContainerPositioning(parentContainer);
            
            this.createTitleBar(parentContainer);
            this.setupEventListeners();
            this.isActive = true;
            
            console.log('✅ ドラッグ可能タイトルバー初期化完了');
        },
        
        // モジュールクリーンアップ
        cleanup: function() {
            console.log('🧹 ドラッグ可能タイトルバークリーンアップ');
            this.removeTitleBar();
            this.removeEventListeners();
            this.isActive = false;
        },
        
        // 親コンテナの位置設定確保
        ensureContainerPositioning: function(parentContainer) {
            // 既にpositionが設定されていない場合のみ設定
            const computedStyle = window.getComputedStyle(parentContainer);
            if (computedStyle.position === 'static') {
                parentContainer.style.position = 'fixed';
                
                // 初期位置の設定（右上）
                if (!parentContainer.style.top) {
                    parentContainer.style.top = '50px';
                }
                if (!parentContainer.style.right) {
                    parentContainer.style.right = '20px';
                }
                
                console.log('🎯 親コンテナの位置設定を確保:', {
                    position: parentContainer.style.position,
                    top: parentContainer.style.top,
                    right: parentContainer.style.right
                });
            }
        },

        // タイトルバー作成
        createTitleBar: function(parentContainer) {
            this.titleBar = document.createElement('div');
            this.titleBar.id = 'spine-edit-title-bar';
            this.titleBar.className = 'spine-draggable-title-bar';
            
            // タイトルバー内容構築
            this.titleBar.innerHTML = `
                <div class="title-bar-content">
                    <div class="title-bar-drag-handle">
                        <span class="drag-icon">≡</span>
                        <span class="title-text">編集モード</span>
                    </div>
                    <div class="title-bar-controls">
                        <button class="title-bar-btn minimize-btn" type="button" title="最小化">
                            <span class="btn-icon">−</span>
                        </button>
                        <button class="title-bar-btn close-btn" type="button" title="閉じる">
                            <span class="btn-icon">×</span>
                        </button>
                    </div>
                </div>
            `;
            
            // 親コンテナに追加（最上位）
            parentContainer.appendChild(this.titleBar);
            
            console.log('📋 タイトルバー作成完了');
        },
        
        // イベントリスナー設定
        setupEventListeners: function() {
            if (!this.titleBar) return;
            
            const dragHandle = this.titleBar.querySelector('.title-bar-drag-handle');
            const minimizeBtn = this.titleBar.querySelector('.minimize-btn');
            const closeBtn = this.titleBar.querySelector('.close-btn');
            
            // ドラッグ開始（マウス・タッチ両対応）
            dragHandle.addEventListener('mousedown', this.handleDragStart.bind(this));
            dragHandle.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            
            // ボタンイベント
            minimizeBtn.addEventListener('click', this.handleMinimize.bind(this));
            closeBtn.addEventListener('click', this.handleClose.bind(this));
            
            // グローバルイベントハンドラー
            this.mouseMoveHandler = this.handleDragMove.bind(this);
            this.mouseUpHandler = this.handleDragEnd.bind(this);
            this.touchMoveHandler = this.handleTouchMove.bind(this);
            this.touchEndHandler = this.handleTouchEnd.bind(this);
            
            console.log('🎯 タイトルバーイベントリスナー設定完了');
        },
        
        // イベントリスナー削除
        removeEventListeners: function() {
            // グローバルイベント削除
            document.removeEventListener('mousemove', this.mouseMoveHandler);
            document.removeEventListener('mouseup', this.mouseUpHandler);
            document.removeEventListener('touchmove', this.touchMoveHandler);
            document.removeEventListener('touchend', this.touchEndHandler);
            
            console.log('🧹 タイトルバーイベントリスナー削除完了');
        },
        
        // ドラッグ開始処理
        handleDragStart: function(event) {
            console.log('🎯 タイトルバードラッグ開始');
            
            this.dragState.isDragging = true;
            this.dragState.startPos = {
                x: event.clientX,
                y: event.clientY
            };
            
            // 現在のウィンドウ位置を記録
            const parentContainer = this.titleBar.parentElement;
            const rect = parentContainer.getBoundingClientRect();
            this.dragState.startWindowPos = {
                x: rect.left,
                y: rect.top
            };
            
            // グローバルイベント追加（マウス・タッチ両方）
            document.addEventListener('mousemove', this.mouseMoveHandler);
            document.addEventListener('mouseup', this.mouseUpHandler);
            document.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
            document.addEventListener('touchend', this.touchEndHandler);
            
            // ドラッグ中スタイル
            this.titleBar.classList.add('dragging');
            
            event.preventDefault();
        },
        
        // ドラッグ移動処理
        handleDragMove: function(event) {
            if (!this.dragState.isDragging) return;
            
            const deltaX = event.clientX - this.dragState.startPos.x;
            const deltaY = event.clientY - this.dragState.startPos.y;
            
            const parentContainer = this.titleBar.parentElement;
            const newX = this.dragState.startWindowPos.x + deltaX;
            const newY = this.dragState.startWindowPos.y + deltaY;
            
            // 画面外制限
            const screenBounds = this.getScreenBounds();
            const containerRect = parentContainer.getBoundingClientRect();
            
            const limitedX = Math.max(
                screenBounds.minX,
                Math.min(newX, screenBounds.maxX - containerRect.width)
            );
            const limitedY = Math.max(
                screenBounds.minY,
                Math.min(newY, screenBounds.maxY - containerRect.height)
            );
            
            // ウィンドウ位置更新
            parentContainer.style.left = `${limitedX}px`;
            parentContainer.style.top = `${limitedY}px`;
            
            event.preventDefault();
        },
        
        // ドラッグ終了処理
        handleDragEnd: function(event) {
            if (!this.dragState.isDragging) return;
            
            console.log('🏁 タイトルバードラッグ終了');
            
            this.dragState.isDragging = false;
            
            // イベント削除（マウス・タッチ両方）
            document.removeEventListener('mousemove', this.mouseMoveHandler);
            document.removeEventListener('mouseup', this.mouseUpHandler);
            document.removeEventListener('touchmove', this.touchMoveHandler);
            document.removeEventListener('touchend', this.touchEndHandler);
            
            // ドラッグ中スタイル解除
            this.titleBar.classList.remove('dragging');
            
            event.preventDefault();
        },
        
        // 画面境界取得
        getScreenBounds: function() {
            const margin = 20; // 画面端からのマージン
            
            return {
                minX: margin,
                minY: margin,
                maxX: window.innerWidth - margin,
                maxY: window.innerHeight - margin
            };
        },
        
        // 最小化処理
        handleMinimize: function(event) {
            console.log('📉 タイトルバー最小化');
            
            const parentContainer = this.titleBar.parentElement;
            parentContainer.classList.toggle('minimized');
            
            const minimizeBtn = this.titleBar.querySelector('.minimize-btn .btn-icon');
            if (parentContainer.classList.contains('minimized')) {
                minimizeBtn.textContent = '+';
                minimizeBtn.parentElement.title = '最大化';
            } else {
                minimizeBtn.textContent = '−';
                minimizeBtn.parentElement.title = '最小化';
            }
            
            event.preventDefault();
        },
        
        // 閉じる処理
        handleClose: function(event) {
            console.log('❌ タイトルバー閉じる');
            
            // 編集モード終了
            if (typeof stopEditMode === 'function') {
                stopEditMode();
            } else if (typeof endEditMode === 'function') {
                endEditMode();
            }
            
            event.preventDefault();
        },
        
        // タッチ開始処理
        handleTouchStart: function(event) {
            if (event.touches.length !== 1) return;
            
            const touch = event.touches[0];
            this.handleDragStart({
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => event.preventDefault()
            });
        },
        
        // タッチ移動処理
        handleTouchMove: function(event) {
            if (event.touches.length !== 1) return;
            
            const touch = event.touches[0];
            this.handleDragMove({
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => event.preventDefault()
            });
        },
        
        // タッチ終了処理
        handleTouchEnd: function(event) {
            this.handleDragEnd({
                preventDefault: () => event.preventDefault()
            });
        },

        // タイトルバー削除
        removeTitleBar: function() {
            if (this.titleBar && this.titleBar.parentElement) {
                this.titleBar.parentElement.removeChild(this.titleBar);
                this.titleBar = null;
                console.log('🗑️ タイトルバー削除完了');
            }
        }
    };
    
    return module;
}

// ========== レイヤー編集モジュール ========== //
function createLayerEditModule() {
    console.log('🎭 レイヤー編集モジュール作成開始');
    
    const module = {
        characters: [],
        activeCharacterIndex: 0,
        layerPanel: null,
        draggedIndex: null,
        
        // モジュール初期化
        initialize: function(targetElement) {
            console.log('🎭 レイヤー編集モジュール初期化開始');
            
            // キャラクター検出
            this.detectCharacters();
            
            // 初期レイヤー設定
            this.updateCharacterLayers();
            
            // UI作成
            this.createLayerUI();
            
            console.log('✅ レイヤー編集モジュール初期化完了');
            return true;
        },
        
        // モジュール終了処理
        cleanup: function() {
            console.log('🗑️ レイヤー編集モジュール終了処理');
            
            // キャラクター選択状態をリセット
            this.characters.forEach(char => {
                if (char.element) {
                    char.element.classList.remove('character-selected');
                    this.removeCharacterHighlight(char.element);
                }
            });
            
            // UI削除
            if (this.layerPanel && this.layerPanel.parentNode) {
                this.layerPanel.parentNode.removeChild(this.layerPanel);
                this.layerPanel = null;
            }
            
            // データリセット
            this.characters = [];
            this.activeCharacterIndex = 0;
            this.draggedIndex = null;
            
            console.log('✅ レイヤー編集モジュール終了処理完了');
        },
        
        // キャラクター検出システム
        detectCharacters: function() {
            console.log('🔍 キャラクター検出開始');
            
            const selectors = [
                '#purattokun-canvas',
                '#purattokun-fallback', 
                'canvas[data-spine-character]',
                '.spine-character',
                '[data-character-name]'
            ];
            
            this.characters = [];
            
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    // より厳密な重複チェック
                    if (!this.isElementAlreadyRegistered(element)) {
                        const characterName = this.getCharacterName(element);
                        
                        this.characters.push({
                            element: element,
                            id: element.id || this.generateCharacterId(),
                            name: characterName,
                            selector: selector,
                            scale: 1.0,
                            isActive: false
                        });
                        
                        console.log(`  ➕ 新規登録: ${characterName} (${selector})`);
                    } else {
                        console.log(`  ⚠️ 重複回避: ${element.id || element.tagName} (${selector})`);
                    }
                });
            });
            
            console.log(`🎯 検出されたキャラクター数: ${this.characters.length}`);
            this.characters.forEach((char, index) => {
                console.log(`  ${index + 1}. ${char.name} (${char.selector})`);
            });
            
            return this.characters.length > 0;
        },
        
        // 要素の重複登録チェック
        isElementAlreadyRegistered: function(element) {
            // 同じ要素のポインタが既に存在するかチェック
            const alreadyExists = this.characters.some(char => char.element === element);
            
            if (alreadyExists) {
                return true;
            }
            
            // フォールバック画像とCanvas要素の重複を特別処理
            if (element.id === 'purattokun-fallback') {
                const canvasExists = this.characters.some(char => char.element.id === 'purattokun-canvas');
                if (canvasExists) {
                    console.log('  🔄 Canvas優先: フォールバック画像をスキップ');
                    return true;
                }
            }
            
            if (element.id === 'purattokun-canvas') {
                // Canvas要素が登録される場合、フォールバック画像を削除
                const fallbackIndex = this.characters.findIndex(char => char.element.id === 'purattokun-fallback');
                if (fallbackIndex !== -1) {
                    console.log('  🔄 Canvas発見: フォールバック画像を削除');
                    this.characters.splice(fallbackIndex, 1);
                }
            }
            
            return false;
        },

        // キャラクターID生成
        generateCharacterId: function() {
            return 'char-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        },
        
        // キャラクター名取得
        getCharacterName: function(element) {
            // data-character-name属性から取得
            if (element.dataset.characterName) {
                return element.dataset.characterName;
            }
            
            // id属性から推測
            if (element.id) {
                if (element.id.includes('purattokun')) return 'ぷらっとくん';
                return element.id.replace(/[-_]canvas$|[-_]fallback$/, '');
            }
            
            // class属性から推測
            if (element.className) {
                const classes = element.className.split(' ');
                for (const cls of classes) {
                    if (cls.includes('character') || cls.includes('spine')) {
                        return cls;
                    }
                }
            }
            
            return 'キャラクター' + (this.characters.length + 1);
        },
        
        // z-index動的管理システム
        updateCharacterLayers: function() {
            console.log('🎭 レイヤー順序更新');
            
            this.characters.forEach((char, index) => {
                if (char.element) {
                    const zIndex = 1000 + index; // 配列の後方ほど前面
                    char.element.style.zIndex = zIndex;
                    console.log(`  ${char.name}: z-index ${zIndex}`);
                }
            });
        },
        
        // アクティブキャラクター設定
        setActiveCharacter: function(index) {
            if (index < 0 || index >= this.characters.length) return;
            
            console.log(`🎯 アクティブキャラクター変更: ${this.characters[index].name}`);
            
            // 全キャラクターのハイライトを解除
            this.characters.forEach(char => {
                if (char.element) {
                    char.element.classList.remove('character-selected');
                    this.removeCharacterHighlight(char.element);
                    char.isActive = false;
                }
            });
            
            // 新しいアクティブキャラクターを設定
            this.activeCharacterIndex = index;
            const activeChar = this.characters[index];
            
            if (activeChar && activeChar.element) {
                activeChar.element.classList.add('character-selected');
                this.addCharacterHighlight(activeChar.element);
                activeChar.isActive = true;
                
                // 既存システムとの互換性のため、グローバル変数を更新
                if (window.SpineEditAPI && window.SpineEditAPI.setTargetElement) {
                    window.SpineEditAPI.setTargetElement(activeChar.element);
                }
            }
            
            // UIを更新
            this.updateLayerUI();
        },
        
        // ハイライト表示
        addCharacterHighlight: function(element) {
            element.style.outline = '3px solid #ff6b6b';
            element.style.boxShadow = '0 0 10px rgba(255, 107, 107, 0.6)';
        },
        
        // ハイライト非表示
        removeCharacterHighlight: function(element) {
            element.style.outline = '';
            element.style.boxShadow = '';
        },
        
        // レイヤー制御UI作成
        createLayerUI: function() {
            console.log('🎨 レイヤー制御UI作成');
            
            // 既存のパネルを削除
            if (this.layerPanel && this.layerPanel.parentNode) {
                this.layerPanel.parentNode.removeChild(this.layerPanel);
            }
            
            // レイヤーパネル作成
            this.layerPanel = document.createElement('div');
            this.layerPanel.id = 'layer-management-panel';
            this.layerPanel.style.cssText = `
                position: fixed;
                right: 10px;
                top: 120px;
                width: 280px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10001;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 12px;
            `;
            
            this.layerPanel.innerHTML = `
                <div class="layer-panel-header" style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 10px;
                    border-radius: 8px 8px 0 0;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <span>🎭</span>
                    <span>レイヤー管理</span>
                    <button id="layer-close-btn" style="
                        background: none;
                        border: none;
                        color: white;
                        margin-left: auto;
                        cursor: pointer;
                        font-size: 16px;
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">✕</button>
                </div>
                <div class="layer-panel-content" style="padding: 12px;">
                    <div class="instruction" style="
                        color: #666;
                        font-size: 11px;
                        margin-bottom: 10px;
                        padding: 8px;
                        background: #f8f9fa;
                        border-radius: 4px;
                    ">
                        ドラッグで並び替え：下ほど前面に表示
                    </div>
                    <div id="character-list" style="
                        max-height: 300px;
                        overflow-y: auto;
                    ">
                        <!-- 動的生成 -->
                    </div>
                    <div class="character-stats" style="
                        margin-top: 10px;
                        padding-top: 8px;
                        border-top: 1px solid #eee;
                        font-size: 11px;
                        color: #666;
                        text-align: center;
                    ">
                        検出キャラクター数: <span id="character-count">${this.characters.length}</span>
                    </div>
                </div>
            `;
            
            document.body.appendChild(this.layerPanel);
            
            // イベントリスナー設定
            const closeBtn = document.getElementById('layer-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    if (window.ModuleManager) ModuleManager.removeModule('layerEdit');
                });
            }
            
            // キャラクターリストを構築
            this.rebuildCharacterList();
            
            console.log('✅ レイヤー制御UI作成完了');
        },
        
        // キャラクターリスト再構築
        rebuildCharacterList: function() {
            const listContainer = document.getElementById('character-list');
            if (!listContainer) return;
            
            listContainer.innerHTML = '';
            
            this.characters.forEach((char, index) => {
                const item = this.createCharacterItem(char, index);
                listContainer.appendChild(item);
            });
        },
        
        // キャラクターアイテム作成
        createCharacterItem: function(char, index) {
            const isActive = index === this.activeCharacterIndex;
            const item = document.createElement('div');
            
            item.className = 'character-item';
            item.style.cssText = `
                padding: 8px;
                margin: 4px 0;
                background: ${isActive ? '#e3f2fd' : '#ffffff'};
                border: 1px solid ${isActive ? '#2196f3' : '#ddd'};
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s;
                user-select: none;
            `;
            
            item.innerHTML = `
                <span class="drag-handle" style="
                    color: #999;
                    cursor: grab;
                    font-size: 16px;
                    line-height: 1;
                ">≡</span>
                <span class="character-status" style="
                    font-size: 16px;
                    line-height: 1;
                ">${isActive ? '🎯' : '⚪'}</span>
                <span class="character-name" style="
                    flex: 1;
                    font-weight: ${isActive ? 'bold' : 'normal'};
                    color: ${isActive ? '#1976d2' : '#333'};
                ">${char.name}</span>
                <span class="z-index-display" style="
                    font-size: 10px;
                    color: #666;
                    background: #f5f5f5;
                    padding: 2px 6px;
                    border-radius: 10px;
                ">z:${1000 + index}</span>
                <div class="layer-controls" style="
                    display: flex;
                    gap: 2px;
                ">
                    <button class="layer-btn front-btn" title="最前面" style="
                        background: #4caf50;
                        color: white;
                        border: none;
                        border-radius: 3px;
                        width: 20px;
                        height: 20px;
                        font-size: 10px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">⬆</button>
                    <button class="layer-btn back-btn" title="最背面" style="
                        background: #f44336;
                        color: white;
                        border: none;
                        border-radius: 3px;
                        width: 20px;
                        height: 20px;
                        font-size: 10px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">⬇</button>
                </div>
            `;
            
            // イベントリスナー設定
            this.setupCharacterItemEvents(item, index);
            
            return item;
        },
        
        // キャラクターアイテムのイベント設定
        setupCharacterItemEvents: function(item, index) {
            const char = this.characters[index];
            
            // キャラクター選択
            item.addEventListener('click', (e) => {
                if (e.target.closest('.layer-controls')) return;
                this.setActiveCharacter(index);
            });
            
            // ドラッグ&ドロップ設定
            this.makeDraggable(item, index);
            
            // レイヤー制御ボタン
            const frontBtn = item.querySelector('.front-btn');
            const backBtn = item.querySelector('.back-btn');
            
            if (frontBtn) {
                frontBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.moveToFront(index);
                });
            }
            
            if (backBtn) {
                backBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.moveToBack(index);
                });
            }
        },
        
        // ドラッグ&ドロップ機能
        makeDraggable: function(item, index) {
            item.draggable = true;
            
            item.addEventListener('dragstart', (e) => {
                this.draggedIndex = index;
                item.style.opacity = '0.5';
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', index.toString());
            });
            
            item.addEventListener('dragend', () => {
                item.style.opacity = '1';
                this.draggedIndex = null;
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                item.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
            });
            
            item.addEventListener('dragleave', () => {
                const isActive = index === this.activeCharacterIndex;
                item.style.backgroundColor = isActive ? '#e3f2fd' : '#ffffff';
            });
            
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const isActive = index === this.activeCharacterIndex;
                item.style.backgroundColor = isActive ? '#e3f2fd' : '#ffffff';
                
                if (this.draggedIndex !== null && this.draggedIndex !== index) {
                    this.reorderCharacters(this.draggedIndex, index);
                }
            });
        },
        
        // キャラクターの並び替え
        reorderCharacters: function(fromIndex, toIndex) {
            console.log(`🔄 キャラクター並び替え: ${fromIndex} → ${toIndex}`);
            
            // 配列の並び替え実行
            const draggedChar = this.characters.splice(fromIndex, 1)[0];
            this.characters.splice(toIndex, 0, draggedChar);
            
            // アクティブインデックスの調整
            if (this.activeCharacterIndex === fromIndex) {
                this.activeCharacterIndex = toIndex;
            } else if (fromIndex < this.activeCharacterIndex && toIndex >= this.activeCharacterIndex) {
                this.activeCharacterIndex--;
            } else if (fromIndex > this.activeCharacterIndex && toIndex <= this.activeCharacterIndex) {
                this.activeCharacterIndex++;
            }
            
            // z-indexを更新
            this.updateCharacterLayers();
            
            // UIを再構築
            this.rebuildCharacterList();
            
            console.log('✅ 並び替え完了');
        },
        
        // 最前面に移動
        moveToFront: function(index) {
            console.log(`⬆ キャラクターを最前面に移動: ${this.characters[index].name}`);
            
            const char = this.characters.splice(index, 1)[0];
            this.characters.push(char); // 配列の最後（最前面）に移動
            
            // アクティブインデックス調整
            if (this.activeCharacterIndex === index) {
                this.activeCharacterIndex = this.characters.length - 1;
            } else if (this.activeCharacterIndex > index) {
                this.activeCharacterIndex--;
            }
            
            this.updateCharacterLayers();
            this.rebuildCharacterList();
        },
        
        // 最背面に移動
        moveToBack: function(index) {
            console.log(`⬇ キャラクターを最背面に移動: ${this.characters[index].name}`);
            
            const char = this.characters.splice(index, 1)[0];
            this.characters.unshift(char); // 配列の最初（最背面）に移動
            
            // アクティブインデックス調整
            if (this.activeCharacterIndex === index) {
                this.activeCharacterIndex = 0;
            } else if (this.activeCharacterIndex >= index) {
                this.activeCharacterIndex++;
            }
            
            this.updateCharacterLayers();
            this.rebuildCharacterList();
        },
        
        // UIの更新
        updateLayerUI: function() {
            const countElement = document.getElementById('character-count');
            if (countElement) {
                countElement.textContent = this.characters.length;
            }
            
            this.rebuildCharacterList();
        }
    };
    
    console.log('✅ レイヤー編集モジュール作成完了');
    return module;
}

// ========== デバッグ・テスト機能 ========== //

// レイヤー編集システムのテスト関数
window.testLayerEditSystem = function() {
    console.log('🧪 レイヤー編集システムテスト開始');
    
    // 1. 編集モードが起動しているか確認
    if (!SpineEditSystem.controlLayer.isEditMode) {
        console.log('⚠️ 編集モードを先に起動してください');
        return;
    }
    
    // 2. レイヤー編集モジュールを起動
    const layerEditModule = createLayerEditModule();
    const success = window.ModuleManager ? ModuleManager.addModule('layerEditTest', layerEditModule) : false;
    
    if (success) {
        console.log('✅ レイヤー編集モジュールテスト成功');
        
        // 3. 検出されたキャラクター数を表示
        const module = SpineEditSystem.modules.get('layerEditTest');
        if (module && module.characters) {
            console.log(`🎯 検出キャラクター数: ${module.characters.length}`);
            module.characters.forEach((char, index) => {
                console.log(`  ${index + 1}. ${char.name} (z-index: ${1000 + index})`);
            });
        }
        
        // 5秒後に自動でテストを終了
        setTimeout(() => {
            if (window.ModuleManager) ModuleManager.removeModule('layerEditTest');
            console.log('✅ レイヤー編集テスト終了');
        }, 5000);
    } else {
        console.error('❌ レイヤー編集モジュールテスト失敗');
    }
};

// システム統合テスト関数
window.testSystemIntegration = function() {
    console.log('🔧 システム統合テスト開始');
    
    // 1. 基本システム状態確認
    console.log('📊 システム状態:');
    console.log(`  - 編集モード: ${SpineEditSystem.controlLayer.isEditMode ? '起動中' : '停止中'}`);
    console.log(`  - 登録モジュール数: ${SpineEditSystem.modules.size}`);
    console.log(`  - 対象要素: ${SpineEditSystem.baseLayer.targetElement ? '設定済み' : '未設定'}`);
    
    // 2. 各モジュールの互換性テスト
    SpineEditSystem.modules.forEach((module, name) => {
        console.log(`  🧩 モジュール '${name}': ${typeof module.initialize === 'function' ? '正常' : '異常'}`);
    });
    
    // 3. パフォーマンステスト
    const startTime = performance.now();
    for (let i = 0; i < 100; i++) {
        return window.ModuleManager ? ModuleManager.hasModule('testModule') : false;
    }
    const endTime = performance.now();
    console.log(`⚡ パフォーマンス: hasModule 100回実行に ${(endTime - startTime).toFixed(2)}ms`);
    
    console.log('✅ システム統合テスト完了');
};

// ========== 外部インターフェース（モジュール用） ========== //

// モジュールから使用可能なAPI
window.SpineEditAPI = {
    // 基本情報取得
    getTargetElement: () => SpineEditSystem.baseLayer.targetElement,
    getInitialPosition: () => SpineEditSystem.baseLayer.initialPosition,
    isEditMode: () => SpineEditSystem.controlLayer.isEditMode,
    
    // 🚨 緊急復元機能
    emergencyRestore: () => {
        console.log('🚨 緊急復元実行');
        const targetElement = SpineEditSystem.baseLayer.targetElement;
        if (targetElement) {
            SpineEditSystem.coordinateSwap.forceRestore(targetElement);
        }
    },
    
    // モジュール管理（安全チェック付き）
    addModule: window.ModuleManager ? window.ModuleManager.addModule : () => false,
    removeModule: window.ModuleManager ? window.ModuleManager.removeModule : () => false,
    removeAllModules: window.ModuleManager ? window.ModuleManager.removeAllModules : () => {},
    
    // 座標ヘルパー（spine-edit-core.js読み込み状況に依存しない安全な参照）
    coords: window.SpineEditSystem && window.SpineEditSystem.coords ? window.SpineEditSystem.coords : {
        pxToPercent: (px, containerSize) => (px / containerSize) * 100,
        percentToPx: (percent, containerSize) => (percent / 100) * containerSize
    }
};

// ========== システム起動 ========== //

// DOM読み込み完了後に初期化（非同期読み込み対応版）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        waitForSpineEditCore(initializeSpineEditSystem);
    });
} else {
    waitForSpineEditCore(initializeSpineEditSystem);
}

// ========== パッケージ出力システム（独立機能） ========== //

/**
 * 🎯 HTML固定化処理と依存ファイル収集を統合したパッケージ出力システム
 * 
 * 【機能概要】
 * - HTML固定化：編集システム除去、localStorage位置データをCSS直接埋め込み
 * - 依存ファイル収集：Spine一式、画像、ライブラリの自動収集
 * - CDN依存解決：spine-webgl.jsをローカル化
 * - ZIP生成：完全パッケージとしてダウンロード可能
 * 
 * 【技術要件】
 * - 2層座標システム対応
 * - エラーハンドリング完備
 * - 既存システムに影響なし
 */

// パッケージ出力システム - モジュール化済み（spine-package-export.js）

/**
 * メイン関数：パッケージ出力実行
 */
async function exportPackage() {
    if (PackageExportSystem.isProcessing) {
        console.warn('⚠️ パッケージ出力処理中です');
        return;
    }
    
    try {
        PackageExportSystem.isProcessing = true;
        console.log('📦 パッケージ出力開始');
        
        // ステップ1: 現在の位置データ取得
        console.log('📋 Step 1: 位置データ収集');
        if (!await collectPositionData()) {
            throw new Error('位置データの収集に失敗しました');
        }
        
        // ステップ2: HTML固定化処理
        console.log('🔧 Step 2: HTML固定化処理');
        if (!await processHTMLTemplate()) {
            throw new Error('HTML固定化処理に失敗しました');
        }
        
        // ステップ3: 依存ファイル収集
        console.log('📁 Step 3: 依存ファイル収集');
        if (!await collectDependencyFiles()) {
            throw new Error('依存ファイル収集に失敗しました');
        }
        
        // ステップ4: CDN依存解決
        console.log('🌐 Step 4: CDN依存解決');
        if (!await resolveCDNDependencies()) {
            throw new Error('CDN依存解決に失敗しました');
        }
        
        // ステップ5: ZIPパッケージ生成
        console.log('🗜️ Step 5: ZIPパッケージ生成');
        if (!await generateZIPPackage()) {
            throw new Error('ZIPパッケージ生成に失敗しました');
        }
        
        console.log('✅ パッケージ出力完了');
        
    } catch (error) {
        console.error('❌ パッケージ出力失敗:', error);
        alert(`パッケージ出力に失敗しました：${error.message}`);
    } finally {
        PackageExportSystem.isProcessing = false;
    }
}

/**
 * Step 1: 現在の位置データ収集（確実性向上版）
 */
async function collectPositionData() {
    console.log('📊 位置データ収集開始 - 複数ソースからの確実な取得');
    
    try {
        let positionData = null;
        
        // === 1. localStorage優先取得 ===
        console.log('💾 Step 1.1: localStorage位置データ取得');
        const savedStateString = localStorage.getItem('spine-positioning-state');
        
        if (savedStateString) {
            try {
                const savedState = JSON.parse(savedStateString);
                if (savedState && savedState.character) {
                    positionData = savedState.character;
                    console.log('✅ localStorage位置データ取得成功:', positionData);
                }
            } catch (parseError) {
                console.warn('⚠️ localStorage解析エラー:', parseError);
            }
        } else {
            console.log('💡 localStorage未保存 - DOM状態から取得');
        }
        
        // === 2. 現在のDOM状態から取得（詳細セレクター + 座標変換）===
        console.log('🎯 Step 1.2: 現在のDOM位置データ取得（複数セレクター対応）');
        const selectors = [
            '#character-canvas',
            '#purattokun-canvas', 
            'canvas[data-spine-character]',
            '.spine-character',
            '.demo-character'
        ];
        
        let targetElement = null;
        for (const selector of selectors) {
            targetElement = document.querySelector(selector);
            if (targetElement) {
                console.log(`✅ 対象要素発見: ${selector}`);
                break;
            }
        }
        
        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            const parentRect = targetElement.parentElement?.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(targetElement);
            
            // DOM状態から精密な位置データを構築
            const domPosition = {
                // インライン style 優先、なければ computed style
                left: targetElement.style.left || 
                      (parentRect ? SpineEditSystem.coords.pxToPercent(rect.left - parentRect.left, parentRect.width) + '%' : computedStyle.left),
                top: targetElement.style.top || 
                     (parentRect ? SpineEditSystem.coords.pxToPercent(rect.top - parentRect.top, parentRect.height) + '%' : computedStyle.top),
                width: targetElement.style.width || 
                       (parentRect ? SpineEditSystem.coords.pxToPercent(rect.width, parentRect.width) + '%' : computedStyle.width),
                height: targetElement.style.height || computedStyle.height,
                transform: targetElement.style.transform || computedStyle.transform
            };
            
            console.log('🎯 DOM位置データ詳細:', {
                rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
                parentRect: parentRect ? { left: parentRect.left, top: parentRect.top, width: parentRect.width, height: parentRect.height } : null,
                domPosition
            });
            
            // localStorageデータがない、または不完全な場合はDOM状態を使用
            if (!positionData || !positionData.left || !positionData.top) {
                positionData = domPosition;
                console.log('📋 DOM状態をベースとして採用');
            } else {
                console.log('📋 localStorage状態を優先、DOM状態をフォールバック用に保持');
            }
        }
        
        // === 3. 最終フォールバック（デフォルト値）===
        if (!positionData || !positionData.left || !positionData.top) {
            console.warn('⚠️ 全ての位置データソースが無効 - SPINE_BEST_PRACTICES準拠デフォルト値を使用');
            positionData = {
                left: '35%',      // Layer 1: CSS基本配置（中心基準）
                top: '75%',       // Layer 1: CSS基本配置（地面レベル）
                width: '25%',     // Layer 1: CSS基本配置（レスポンシブ対応）
                height: 'auto',   // Layer 1: CSS基本配置（縦横比保持）
                transform: 'translate(-50%, -50%)'  // Layer 2: transform制御（中心点基準）
            };
        }
        
        // === 4. 位置データの正規化・検証 ===
        console.log('🔧 Step 1.3: 位置データ正規化・検証');
        positionData = normalizePositionData(positionData);
        
        PackageExportSystem.positionData = positionData;
        console.log('✅ 位置データ収集完了（確実性向上版）:', positionData);
        return true;
        
    } catch (error) {
        console.error('❌ 位置データ収集エラー:', error);
        return false;
    }
}

/**
 * 位置データの正規化・検証
 */
function normalizePositionData(data) {
    const normalized = { ...data };
    
    // %値の正規化（px値が混じっている場合の対応）
    ['left', 'top', 'width', 'height'].forEach(prop => {
        if (normalized[prop] && typeof normalized[prop] === 'string') {
            // px値を%値に変換する必要があるかチェック
            if (normalized[prop].includes('px') && !normalized[prop].includes('%')) {
                console.log(`🔧 ${prop}: px値検出、%値への変換が必要: ${normalized[prop]}`);
                // この場合はそのまま保持（embedPositionDataで適切に処理される）
            }
        }
    });
    
    // transformの正規化
    if (!normalized.transform || normalized.transform === 'none') {
        normalized.transform = 'translate(-50%, -50%)';
        console.log('🔧 transform正規化: translate(-50%, -50%)を設定');
    }
    
    console.log('🔧 位置データ正規化完了:', normalized);
    return normalized;
}

/**
 * Step 2: HTML固定化処理
 */
async function processHTMLTemplate() {
    console.log('🔧 HTML固定化処理開始');
    
    try {
        // 現在のindex.htmlを取得
        const response = await fetch('index.html');
        if (!response.ok) {
            throw new Error(`HTMLファイル取得失敗: ${response.status}`);
        }
        
        let htmlContent = await response.text();
        console.log('📋 index.html取得完了');
        
        // 編集システム関連のコードを除去
        htmlContent = removeEditingSystem(htmlContent);
        
        // CDN依存をローカル参照に変更
        htmlContent = localizeSpineWebGL(htmlContent);
        
        // 位置データをCSS値として埋め込み
        htmlContent = embedPositionData(htmlContent);
        
        PackageExportSystem.htmlTemplate = htmlContent;
        console.log('✅ HTML固定化処理完了');
        return true;
        
    } catch (error) {
        console.error('❌ HTML固定化処理エラー:', error);
        return false;
    }
}

/**
 * 編集システム関連コードの除去（精密削除）
 */
function removeEditingSystem(htmlContent) {
    console.log('🚮 編集システムコード除去（精密削除）');
    
    // 1. URLパラメータ処理（editMode変数定義とデバッグ出力）を完全除去
    const urlParamsPattern = /\/\/ 🎯 URLパラメータで編集モード起動[\s\S]*?const editMode = urlParams\.get\('edit'\) === 'true';[\s\S]*?editMode: editMode[\s\S]*?\}\);/;
    htmlContent = htmlContent.replace(urlParamsPattern, '// URLパラメータ処理・editMode変数除去済み');
    
    // 2. 編集モード検出とCSS/JS動的読み込み処理を除去し、Spine初期化を直接実行に変更
    const editModeDetectionPattern = /if \(editMode\) \{[\s\S]*?document\.body\.appendChild\(editJS\);[\s\S]*?\} else \{[\s\S]*?initializeSpineSystem\(\);[\s\S]*?\}/;
    htmlContent = htmlContent.replace(editModeDetectionPattern, 'initializeSpineSystem(); // パッケージ用：Spine直接初期化');
    
    // 3. 編集システムの初期化関数呼び出しのみ除去
    const editInitPattern = /\/\/ 編集システム初期化[\s\S]*?initializeSpineEditSystem\(\);/;
    htmlContent = htmlContent.replace(editInitPattern, '// 編集システム初期化除去済み');
    
    // 4. 編集用CSS/JSファイル参照のみ除去（spine-positioning-system-explanation.*)
    const editCSSPattern = /<link[^>]*spine-positioning-system-explanation\.css[^>]*>/g;
    const editJSPattern = /<script[^>]*spine-positioning-system-explanation\.js[^>]*><\/script>/g;
    htmlContent = htmlContent.replace(editCSSPattern, '<!-- 編集用CSS除去済み -->');
    htmlContent = htmlContent.replace(editJSPattern, '<!-- 編集用JS除去済み -->');
    
    // ✅ 保持すべき重要なコード（削除してはいけない）
    console.log('✅ 以下のコードは保持されます：');
    console.log('  - Spine WebGL読み込み: <script src="...spine-webgl.js">');
    console.log('  - Spine統合処理: spine-integration-v2.js読み込み');
    console.log('  - キャラクター初期化: loadCharacter(), setupSpineCharacter()');
    console.log('  - アニメーション開始: playAnimation()');
    console.log('  - 基本HTML構造とSpine表示システム');
    
    console.log('✅ 編集システムコード精密除去完了');
    return htmlContent;
}

/**
 * CDN依存をローカル参照に変更
 */
function localizeSpineWebGL(htmlContent) {
    console.log('🌐 Spine WebGL CDN→ローカル変更');
    
    const cdnPattern = /<script src="https:\/\/unpkg\.com\/@esotericsoftware\/spine-webgl@[\d\.]+\/dist\/iife\/spine-webgl\.js"><\/script>/;
    const localReference = '<script src="assets/js/libs/spine-webgl.js"></script>';
    
    htmlContent = htmlContent.replace(cdnPattern, localReference);
    
    console.log('✅ CDN→ローカル変更完了');
    return htmlContent;
}

/**
 * 位置データのCSS埋め込み（確実性向上・2層座標システム対応）
 */
function embedPositionData(htmlContent) {
    console.log('📐 位置データCSS埋め込み - 確実性向上版');
    
    const positionData = PackageExportSystem.positionData;
    if (!positionData) {
        console.error('❌ 位置データがありません - 埋め込み処理を中断');
        return htmlContent;
    }
    
    console.log('📋 埋め込み対象位置データ:', positionData);
    
    // === 1. 2層座標システム準拠CSS生成 ===
    const coordinateCSS = generateCoordinateCSS(positionData);
    console.log('🔧 生成されたCSS:', coordinateCSS);
    
    // === 2. 複数パターン対応での確実な埋め込み ===
    let embedSuccess = false;
    
    // パターン1: #character-canvas スタイル定義に埋め込み
    console.log('🎯 パターン1: #character-canvas スタイル定義検索');
    const canvasStylePatterns = [
        /#character-canvas\s*\{[^}]*\}/g,
        /#purattokun-canvas\s*\{[^}]*\}/g,
        /\.spine-character\s*\{[^}]*\}/g
    ];
    
    for (const pattern of canvasStylePatterns) {
        const matches = htmlContent.match(pattern);
        if (matches && matches.length > 0) {
            for (const match of matches) {
                const originalStyle = match;
                const enhancedStyle = originalStyle.replace(
                    /\}$/,
                    `    /* === 保存された位置データ（固定化済み・2層座標システム） === */\n${coordinateCSS}        }`
                );
                htmlContent = htmlContent.replace(originalStyle, enhancedStyle);
                console.log(`✅ パターン1成功: ${pattern.source} - CSS埋め込み完了`);
                embedSuccess = true;
            }
        }
    }
    
    // パターン2: インライン style属性への直接埋め込み（フォールバック）
    if (!embedSuccess) {
        console.log('🎯 パターン2: インライン style属性への直接埋め込み');
        const inlineStylePatterns = [
            /<canvas[^>]*id=["']character-canvas["'][^>]*style=["']([^"']*)["']/g,
            /<canvas[^>]*id=["']purattokun-canvas["'][^>]*style=["']([^"']*)["']/g,
            /<canvas[^>]*class=["'][^"']*spine-character[^"']*["'][^>]*style=["']([^"']*)["']/g
        ];
        
        for (const pattern of inlineStylePatterns) {
            const matches = [...htmlContent.matchAll(pattern)];
            for (const match of matches) {
                const fullMatch = match[0];
                const currentStyle = match[1];
                
                // 既存のstyleに位置データを追加
                const enhancedInlineStyle = currentStyle + '; ' + coordinateCSS.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
                const enhancedElement = fullMatch.replace(
                    /style=["']([^"']*)["']/,
                    `style="${enhancedInlineStyle}"`
                );
                
                htmlContent = htmlContent.replace(fullMatch, enhancedElement);
                console.log(`✅ パターン2成功: インライン埋め込み完了`);
                embedSuccess = true;
            }
        }
    }
    
    // パターン3: 新規<style>ブロック追加（最終フォールバック）
    if (!embedSuccess) {
        console.log('🎯 パターン3: 新規<style>ブロック追加（最終フォールバック）');
        const newStyleBlock = `
    <style>
        /* === Spine位置データ（パッケージ固定化・自動追加） === */
        #character-canvas,
        #purattokun-canvas,
        .spine-character {
${coordinateCSS}        }
    </style>`;
        
        // </head>の直前に挿入
        if (htmlContent.includes('</head>')) {
            htmlContent = htmlContent.replace('</head>', newStyleBlock + '\n    </head>');
            console.log('✅ パターン3成功: 新規<style>ブロック追加完了');
            embedSuccess = true;
        } else {
            // <body>の直前に挿入
            htmlContent = htmlContent.replace('<body', newStyleBlock + '\n    <body');
            console.log('✅ パターン3代替: <body>前に<style>ブロック追加完了');
            embedSuccess = true;
        }
    }
    
    if (embedSuccess) {
        console.log('✅ 位置データCSS埋め込み完了（確実性向上版）');
        console.log('📐 埋め込み済みCSS内容:\n', coordinateCSS);
    } else {
        console.error('❌ 位置データCSS埋め込み失敗 - 全パターンで失敗');
    }
    
    return htmlContent;
}

/**
 * 2層座標システム準拠のCSS生成（SPINE_BEST_PRACTICES準拠）
 */
function generateCoordinateCSS(positionData) {
    console.log('🔧 CSS生成開始 - SPINE_BEST_PRACTICES 2層システム準拠');
    console.log('📋 入力位置データ:', positionData);
    
    let css = '';
    
    // === Layer 1: CSS基本配置（静的位置制御）===
    console.log('🎯 Layer 1: CSS基本配置生成');
    
    // left（必須）
    if (positionData.left) {
        css += `    left: ${positionData.left};\n`;
        console.log(`  - left: ${positionData.left}`);
    } else {
        css += `    left: 35%; /* デフォルト値 */\n`;
        console.log('  - left: デフォルト値35%を適用');
    }
    
    // top（必須）
    if (positionData.top) {
        css += `    top: ${positionData.top};\n`;
        console.log(`  - top: ${positionData.top}`);
    } else {
        css += `    top: 75%; /* デフォルト値 */\n`;
        console.log('  - top: デフォルト値75%を適用');
    }
    
    // width（レスポンシブ対応）
    if (positionData.width) {
        css += `    width: ${positionData.width};\n`;
        console.log(`  - width: ${positionData.width}`);
    } else {
        css += `    width: 25%; /* デフォルト値 */\n`;
        console.log('  - width: デフォルト値25%を適用');
    }
    
    // height（縦横比保持の為、通常はautoを推奨）
    if (positionData.height && positionData.height !== 'auto' && positionData.height !== '0px') {
        css += `    height: ${positionData.height};\n`;
        console.log(`  - height: ${positionData.height}`);
    } else {
        css += `    height: auto; /* 縦横比保持 */\n`;
        console.log('  - height: 縦横比保持のためautoを適用');
    }
    
    // === Layer 2: transform制御（動的効果・中心点基準）===
    console.log('🎯 Layer 2: transform制御生成');
    
    if (positionData.transform && positionData.transform !== 'none') {
        css += `    transform: ${positionData.transform};\n`;
        console.log(`  - transform: ${positionData.transform}`);
    } else {
        css += `    transform: translate(-50%, -50%); /* 中心点基準配置 */\n`;
        console.log('  - transform: デフォルト中心点基準を適用');
    }
    
    // === Layer 2補完: 位置制御に必要な基本スタイル ===
    css += `    position: absolute; /* Layer 1基本要件 */\n`;
    css += `    z-index: 1000; /* 表示順序保証 */\n`;
    
    console.log('✅ CSS生成完了（2層システム準拠）');
    console.log('📐 生成されたCSS:\n' + css);
    
    return css;
}

/**
 * Step 3: 依存ファイル収集
 */
async function collectDependencyFiles() {
    console.log('📁 依存ファイル収集開始');
    
    try {
        PackageExportSystem.collectedFiles.clear();
        
        // Spineファイル収集
        console.log('🎮 Spineファイル収集');
        for (const filePath of PackageExportSystem.config.spineFiles) {
            if (!await collectFile(filePath)) {
                console.warn(`⚠️ Spineファイル収集失敗: ${filePath}`);
            }
        }
        
        // 画像ファイル収集
        console.log('🖼️ 画像ファイル収集');
        for (const filePath of PackageExportSystem.config.imageFiles) {
            if (!await collectFile(filePath)) {
                console.warn(`⚠️ 画像ファイル収集失敗: ${filePath}`);
            }
        }
        
        // 統合ファイル収集
        console.log('⚙️ 統合ファイル収集');
        for (const filePath of PackageExportSystem.config.integrationFiles) {
            if (!await collectFile(filePath)) {
                console.warn(`⚠️ 統合ファイル収集失敗: ${filePath}`);
            }
        }
        
        console.log(`✅ 依存ファイル収集完了: ${PackageExportSystem.collectedFiles.size}ファイル`);
        return true;
        
    } catch (error) {
        console.error('❌ 依存ファイル収集エラー:', error);
        return false;
    }
}

/**
 * 個別ファイル収集
 */
async function collectFile(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            console.warn(`⚠️ ファイル取得失敗: ${filePath} (${response.status})`);
            return false;
        }
        
        let content;
        const fileName = filePath.split('/').pop();
        
        // ファイル形式に応じた処理
        if (filePath.endsWith('.json') || filePath.endsWith('.js')) {
            content = await response.text();
        } else if (filePath.endsWith('.atlas')) {
            content = await response.text();
        } else {
            content = await response.blob();
        }
        
        PackageExportSystem.collectedFiles.set(fileName, {
            content: content,
            originalPath: filePath,
            type: getFileType(filePath)
        });
        
        console.log(`📎 ファイル収集完了: ${fileName}`);
        return true;
        
    } catch (error) {
        console.error(`❌ ファイル収集エラー: ${filePath}`, error);
        return false;
    }
}

/**
 * ファイルタイプ判定
 */
function getFileType(filePath) {
    const extension = filePath.split('.').pop().toLowerCase();
    const typeMap = {
        'json': 'text',
        'js': 'text', 
        'atlas': 'text',
        'png': 'binary',
        'jpg': 'binary',
        'jpeg': 'binary'
    };
    return typeMap[extension] || 'binary';
}

/**
 * ファイルの配置先パス取得（適切なディレクトリ構造）
 */
function getTargetPath(fileName, originalPath) {
    // spine-webgl.jsは特別処理（ルート配置）
    if (fileName === 'spine-webgl.js') {
        return 'assets/js/libs/spine-webgl.js';
    }
    
    // 画像ファイル（assets/images/）
    const imageFiles = ['クラウドパートナーTOP.png', 'purattokunn.png'];
    if (imageFiles.includes(fileName)) {
        return `assets/images/${fileName}`;
    }
    
    // Spineキャラクターファイル（assets/spine/characters/purattokun/）
    const spineFiles = ['purattokun.json', 'purattokun.atlas', 'purattokun.png'];
    if (spineFiles.includes(fileName)) {
        return `assets/spine/characters/purattokun/${fileName}`;
    }
    
    // Spine統合ファイル（assets/spine/）
    const integrationFiles = ['spine-integration-v2.js', 'spine-character-manager.js'];
    if (integrationFiles.includes(fileName)) {
        return `assets/spine/${fileName}`;
    }
    
    // その他のファイルはルート配置
    return fileName;
}

/**
 * Step 4: CDN依存解決
 */
async function resolveCDNDependencies() {
    console.log('🌐 CDN依存解決開始');
    
    try {
        // spine-webgl.jsをダウンロード
        console.log('📥 spine-webgl.js ダウンロード');
        const response = await fetch(PackageExportSystem.config.spineWebGLCDN);
        if (!response.ok) {
            throw new Error(`spine-webgl.js取得失敗: ${response.status}`);
        }
        
        const spineWebGLContent = await response.text();
        PackageExportSystem.collectedFiles.set('spine-webgl.js', {
            content: spineWebGLContent,
            originalPath: PackageExportSystem.config.spineWebGLCDN,
            type: 'text'
        });
        
        console.log('✅ spine-webgl.js ダウンロード完了');
        return true;
        
    } catch (error) {
        console.error('❌ CDN依存解決エラー:', error);
        return false;
    }
}

/**
 * Step 5: ZIPパッケージ生成
 */
async function generateZIPPackage() {
    console.log('🗜️ ZIPパッケージ生成開始');
    
    try {
        // JSZipが利用可能か確認
        if (typeof JSZip === 'undefined') {
            // JSZipを動的読み込み
            await loadJSZip();
        }
        
        const zip = new JSZip();
        
        // HTMLテンプレート追加
        zip.file('index.html', PackageExportSystem.htmlTemplate);
        console.log('📄 index.html追加');
        
        // 適切なディレクトリ構造でファイルを配置
        for (const [fileName, fileData] of PackageExportSystem.collectedFiles) {
            const targetPath = getTargetPath(fileName, fileData.originalPath);
            
            if (fileData.type === 'text') {
                zip.file(targetPath, fileData.content);
            } else {
                zip.file(targetPath, fileData.content);
            }
            console.log(`📎 ${fileName} → ${targetPath} 追加`);
        }
        
        // ZIPファイル生成
        console.log('🗜️ ZIP圧縮中...');
        const zipBlob = await zip.generateAsync({type: 'blob'});
        
        // ダウンロード実行
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(zipBlob);
        downloadLink.download = `spine-package-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.zip`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        console.log('✅ ZIPパッケージ生成・ダウンロード完了');
        return true;
        
    } catch (error) {
        console.error('❌ ZIPパッケージ生成エラー:', error);
        return false;
    }
}

/**
 * JSZipライブラリ動的読み込み
 */
function loadJSZip() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js';
        script.onload = () => {
            console.log('📚 JSZip読み込み完了');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ JSZip読み込み失敗');
            reject(new Error('JSZip読み込み失敗'));
        };
        document.head.appendChild(script);
    });
}

// パッケージ出力機能は既にcreateEditingUI関数とsetupEditingUIEvents関数に統合済み

console.log('🎯 Spine編集システム v3.0 - シンプル版読み込み完了');

// ========== 診断機能システム ========== //
/**
 * 🔍 ドラッグハンドル診断機能
 * ユーザーが実行できる診断コマンド群
 */

// ドラッグハンドルの状態診断
function diagnoseDragHandles() {
    console.log('🔍 ドラッグハンドル診断開始');
    
    // 編集モード確認
    if (!SpineEditSystem || !SpineEditSystem.controlLayer.isEditMode) {
        console.log('❌ 編集モードが起動していません');
        console.log('💡 解決策: 編集モードでこのコマンドを実行してください');
        return false;
    }
    
    // ハンドル要素の存在確認
    const handles = document.querySelectorAll('.spine-edit-handle');
    console.log('📍 ハンドル数: ' + handles.length);
    
    if (handles.length === 0) {
        console.log('❌ ドラッグハンドルが見つかりません');
        return false;
    }
    
    // 各ハンドルの状態確認
    handles.forEach((handle, index) => {
        const rect = handle.getBoundingClientRect();
        const style = window.getComputedStyle(handle);
        
        console.log('🎯 ハンドル ' + (index + 1) + ':', {
            position: handle.dataset.position,
            visible: style.display !== 'none',
            size: rect.width + 'x' + rect.height,
            location: rect.left.toFixed(1) + ', ' + rect.top.toFixed(1),
            zIndex: style.zIndex,
            cursor: style.cursor
        });
    });
    
    // ドラッグ状態確認
    const dragModule = SpineEditSystem.controlLayer.dragHandler;
    if (dragModule && dragModule.dragState) {
        console.log('🖱️ ドラッグ状態:', {
            isDragging: dragModule.dragState.isDragging,
            operation: dragModule.dragState.operation,
            activeHandle: dragModule.dragState.activeHandle ? 'あり' : 'なし'
        });
    }
    
    console.log('✅ ドラッグハンドル診断完了');
    return true;
}

// 編集モード状態確認
function isEditMode() {
    const editMode = SpineEditSystem && SpineEditSystem.controlLayer.isEditMode;
    console.log('🎮 編集モード状態:', editMode ? '起動中' : '停止中');
    
    if (!editMode) {
        console.log('💡 編集モードを起動するには:');
        console.log('   1. URL末尾に?edit=trueを追加');
        console.log('   2. ページをリロード');
        console.log('   3. 編集開始ボタンをクリック');
    }
    
    return editMode;
}

// ドラッグハンドルクリックテスト
function testDragHandleClick(position = 'center') {
    console.log('🧪 ハンドルクリックテスト開始 (' + position + ')');
    
    if (!isEditMode()) {
        console.log('❌ 編集モードが必要です');
        return false;
    }
    
    const handle = document.querySelector('[data-position="' + position + '"]');
    if (!handle) {
        console.log('❌ ' + position + 'ハンドルが見つかりません');
        return false;
    }
    
    // クリックイベントをシミュレート
    const rect = handle.getBoundingClientRect();
    const clickEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
    });
    
    console.log('🖱️ ' + position + 'ハンドルをクリック');
    handle.dispatchEvent(clickEvent);
    
    // 状態確認
    setTimeout(() => {
        const dragModule = SpineEditSystem.controlLayer.dragHandler;
        if (dragModule && dragModule.dragState && dragModule.dragState.isDragging) {
            console.log('✅ ドラッグ開始が検出されました');
        } else {
            console.log('❌ ドラッグが開始されませんでした');
        }
    }, 100);
    
    return true;
}

// 編集システム全体診断
function diagnoseEditSystem() {
    console.log('🔍 編集システム全体診断開始');
    console.log('=====================================');
    
    // 基本システム確認
    console.log('📋 基本システム状態:');
    console.log('   - SpineEditSystem: ' + (typeof SpineEditSystem !== 'undefined' ? '✅' : '❌'));
    console.log('   - 編集モード: ' + (isEditMode() ? '✅' : '❌'));
    
    // UI要素確認
    console.log('🎨 UI要素状態:');
    const editingPanel = document.querySelector('.spine-editing-panel');
    console.log('   - 編集パネル: ' + (editingPanel ? '✅' : '❌'));
    
    const titleBar = document.querySelector('.draggable-titlebar');
    console.log('   - ドラッグタイトルバー: ' + (titleBar ? '✅' : '❌'));
    
    // ハンドル診断実行
    console.log('🎯 ハンドル診断:');
    diagnoseDragHandles();
    
    // 対象要素確認
    if (SpineEditSystem && SpineEditSystem.baseLayer) {
        const target = SpineEditSystem.baseLayer.targetElement;
        console.log('🎯 対象要素:', target ? target.id : '未設定');
    }
    
    console.log('=====================================');
    console.log('✅ 編集システム全体診断完了');
}

// グローバルスコープに関数を公開
window.diagnoseDragHandles = diagnoseDragHandles;
window.isEditMode = isEditMode;
window.testDragHandleClick = testDragHandleClick;
window.diagnoseEditSystem = diagnoseEditSystem;

console.log('🔍 診断機能システム追加完了');
console.log('💡 利用可能な診断コマンド:');
console.log('   - diagnoseDragHandles() - ハンドル状態診断');
console.log('   - isEditMode() - 編集モード確認');
console.log('   - testDragHandleClick() - ハンドルクリックテスト');
console.log('   - diagnoseEditSystem() - 全体診断');

// ========== バウンディングボックス外クリック選択解除システム ========== //


/**
 * グローバルクリックハンドラーのセットアップ
 * バウンディングボックス外クリックで選択解除する機能
 */
function setupGlobalClickHandler() {
    // 既存のハンドラーがある場合は削除
    cleanupGlobalClickHandler();
    
    globalClickHandler = function(event) {
        // 編集モードでない場合は何もしない
        if (!SpineEditSystem.controlLayer.isEditMode) {
            return;
        }
        
        // 編集UIクリックは無視
        if (event.target.closest('.spine-editing-panel') || 
            event.target.closest('.editing-ui') ||
            event.target.closest('.character-selected')) {
            return;
        }
        
        // 各キャラクターのバウンディングボックス判定
        let hitCharacter = false;
        
        // spineSkeletonBoundsが利用可能な場合の判定
        if (window.spineSkeletonBounds) {
            const characters = ['purattokun', 'nezumi'];
            
            for (const characterName of characters) {
                const hitResult = window.spineSkeletonBounds.checkBoundsHit(characterName, event.clientX, event.clientY);
                if (hitResult && hitResult.hit) {
                    hitCharacter = true;
                    console.log(`🎯 ${characterName}のバウンディングボックス内クリック検出`);
                    break;
                }
            }
        } else {
            // spineSkeletonBoundsが利用できない場合のフォールバック判定
            // キャラクター要素の範囲内かどうかで判定
            const characterElements = document.querySelectorAll('[data-character-name]');
            
            for (const element of characterElements) {
                const rect = element.getBoundingClientRect();
                if (event.clientX >= rect.left && 
                    event.clientX <= rect.right && 
                    event.clientY >= rect.top && 
                    event.clientY <= rect.bottom) {
                    hitCharacter = true;
                    console.log(`🎯 ${element.dataset.characterName}の要素範囲内クリック検出`);
                    break;
                }
            }
        }
        
        // バウンディングボックス外の場合、選択解除
        if (!hitCharacter) {
            console.log('🔄 バウンディングボックス外クリック - 選択解除');
            clearCharacterSelection();
        }
    };
    
    // documentにイベントリスナーを追加
    document.addEventListener('click', globalClickHandler, true); // キャプチャフェーズで処理
    console.log('✅ グローバルクリックハンドラー設定完了');
}

// globalClickHandlerは既にファイル上部で宣言済み

/**
 * グローバルクリックハンドラーのクリーンアップ
 */
function cleanupGlobalClickHandler() {
    if (globalClickHandler) {
        document.removeEventListener('click', globalClickHandler, true);
        globalClickHandler = null;
        console.log('✅ グローバルクリックハンドラー削除完了');
    }
}

/**
 * キャラクター選択状態をクリア
 */
function clearCharacterSelection() {
    // レイヤー編集モジュールが利用可能な場合
    if (window.ModuleManager && ModuleManager.hasModule('layerEdit')) {
        const layerModule = ModuleManager.getModule('layerEdit');
        if (layerModule && layerModule.characters) {
            // 全キャラクターのハイライトを解除
            layerModule.characters.forEach(char => {
                if (char.element) {
                    char.element.classList.remove('character-selected');
                    layerModule.removeCharacterHighlight(char.element);
                    char.isActive = false;
                }
            });
            
            // アクティブキャラクターをクリア
            layerModule.activeCharacterIndex = -1;
            
            // UIを更新
            if (layerModule.updateLayerUI) {
                layerModule.updateLayerUI();
            }
            
            console.log('✅ レイヤー編集モジュール: キャラクター選択解除');
        }
    }
    
    // SpineEditAPIとの互換性のため
    if (window.SpineEditAPI && window.SpineEditAPI.clearTargetElement) {
        window.SpineEditAPI.clearTargetElement();
    }
    
    // 既存の選択状態をクリア
    const selectedElements = document.querySelectorAll('.character-selected');
    selectedElements.forEach(element => {
        element.classList.remove('character-selected');
        element.style.outline = '';
        element.style.boxShadow = '';
    });
    
    console.log('🔄 全キャラクター選択状態クリア完了');
}

// グローバルスコープに関数を公開
window.setupGlobalClickHandler = setupGlobalClickHandler;
window.cleanupGlobalClickHandler = cleanupGlobalClickHandler;
window.clearCharacterSelection = clearCharacterSelection;
