// 🎯 Spine編集システム - UI管理モジュール
// 役割: キャラクター選択UI、編集UI、イベントリスナー管理
// 抽象度: 高（UIに関する統合的な制御）

console.log('🎨 Spine UI Manager モジュール読み込み開始');

// ========== キャラクター選択UI ========== //

/**
 * キャラクター選択ボタン生成関数
 */
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

/**
 * キャラクター選択イベントリスナー設定関数
 */
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

// ========== 編集開始UI ========== //

/**
 * 編集開始UI作成
 */
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
    // const characterButtons = generateCharacterSelectionButtons(); // 🚫 キャラクター選択機能無効化
    
    startPanel.innerHTML = `
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
        ">
            ✏️ 編集開始
        </button>
    `;
    
    document.body.appendChild(startPanel);
    console.log('📦 パネルをDOMに追加完了');
    
    // キャラクター選択ボタンイベントリスナー設定
    // setupCharacterSelectionListeners(); // 🚫 キャラクター選択機能無効化
    
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

// ========== 編集中UI ========== //

/**
 * 編集中UI作成
 */
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
    
    // タイトルバーモジュール読み込み（新しい仕組み - 個別モジュール化対応）
    createDraggableTitleBarModule();
    
    console.log('✅ 編集中UI作成完了');
}

// ========== イベントリスナー管理 ========== //

/**
 * 編集UIのイベントリスナー設定
 */
function setupEditingUIEvents() {
    console.log('🔘 編集UIイベントリスナー設定開始');
    
    // パッケージ出力ボタン
    const packageBtn = document.getElementById('package-export-btn');
    if (packageBtn) {
        packageBtn.addEventListener('click', () => {
            console.log('📦 パッケージ出力ボタンクリック');
            
            // デバッグ情報を表示
            console.log('🔍 PackageExportSystem存在チェック:', {
                PackageExportSystem: typeof PackageExportSystem,
                windowPackageExportSystem: typeof window.PackageExportSystem,
                exportPackage: typeof window.exportPackage
            });
            
            // 複数の方法でPackageExportSystemを試行
            if (typeof PackageExportSystem !== 'undefined') {
                console.log('✅ PackageExportSystem（グローバル）使用');
                PackageExportSystem.exportPackage();
            } else if (typeof window.PackageExportSystem !== 'undefined') {
                console.log('✅ window.PackageExportSystem使用');
                window.PackageExportSystem.exportPackage();
            } else if (typeof window.exportPackage === 'function') {
                console.log('✅ window.exportPackage関数使用');
                window.exportPackage();
            } else {
                console.error('❌ PackageExportSystemが見つかりません');
                console.log('🔍 利用可能なwindow関数:', Object.keys(window).filter(k => k.toLowerCase().includes('package')));
                alert('パッケージ出力機能の読み込みに失敗しました。ページをリロードして再試行してください。');
            }
        });
    }
    
    // レイヤー編集ボタン
    const layerBtn = document.getElementById('layer-edit-btn');
    if (layerBtn) {
        layerBtn.addEventListener('click', () => {
            console.log('🎭 レイヤー編集ボタンクリック');
            if (typeof createLayerEditModule === 'function') {
                const layerModule = createLayerEditModule();
                layerModule.initialize();  // 🔧 初期化を追加
            } else {
                console.error('❌ createLayerEditModule関数が見つかりません');
            }
        });
    }
    
    // 保存ボタン
    const saveBtn = document.getElementById('save-edit-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            console.log('💾 保存ボタンクリック');
            if (typeof saveCurrentState === 'function') {
                saveCurrentState();
            }
        });
    }
    
    // キャンセルボタン
    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            console.log('↶ キャンセルボタンクリック');
            if (typeof cancelEdit === 'function') {
                cancelEdit();
            }
        });
    }
    
    // 編集終了ボタン
    const endBtn = document.getElementById('end-edit-btn');
    if (endBtn) {
        endBtn.addEventListener('click', () => {
            console.log('✕ 編集終了ボタンクリック');
            if (typeof stopEditMode === 'function') {
                stopEditMode();
            }
        });
    }
    
    console.log('✅ 編集UIイベントリスナー設定完了');
}

// ========== UI削除機能 ========== //

/**
 * 編集開始UI削除
 */
function removeEditStartUI() {
    const panel = document.getElementById('spine-start-panel-v3');
    if (panel) {
        panel.remove();
        console.log('✅ 編集開始UI削除完了');
    }
}

/**
 * 編集UI削除
 */
function removeEditingUI() {
    const panel = document.getElementById('spine-edit-panel-v3');
    if (panel) {
        panel.remove();
        console.log('✅ 編集UI削除完了');
    }
}

// ========== 座標表示システム ========== //

/**
 * リアルタイム座標表示開始
 */
function startCoordinateDisplay() {
    console.log('📊 座標表示開始');
    
    const coordDisplay = document.getElementById('coord-display');
    if (!coordDisplay) {
        console.warn('⚠️ 座標表示要素が見つかりません');
        return;
    }
    
    let coordUpdateInterval;
    
    function updateCoords() {
        const activeChar = MultiCharacterManager.activeCharacter;
        if (!activeChar) {
            coordDisplay.textContent = '座標: キャラクター未選択';
            return;
        }
        
        const element = activeChar.element;
        if (!element) {
            coordDisplay.textContent = '座標: 要素が見つかりません';
            return;
        }
        
        const rect = element.getBoundingClientRect();
        const computedStyle = getComputedStyle(element);
        
        coordDisplay.innerHTML = `
            <strong>🎯 ${activeChar.name}</strong><br>
            位置: ${computedStyle.left || 'auto'} / ${computedStyle.top || 'auto'}<br>
            サイズ: ${Math.round(rect.width)}×${Math.round(rect.height)}px
        `;
    }
    
    // 初回更新
    updateCoords();
    
    // 定期更新開始
    coordUpdateInterval = setInterval(() => {
        if (!document.getElementById('coord-display')) {
            clearInterval(coordUpdateInterval);
            return;
        }
        updateCoords();
    }, 100);
}

console.log('✅ Spine UI Manager モジュール読み込み完了');
// ========== タイトルバードラッグ機能 ========== //

/**
 * ドラッグ可能なタイトルバー機能追加
 * メニューパネルをドラッグ移動可能にする
 */
function createDraggableTitleBarModule() {
    console.log('🖱️ タイトルバードラッグ機能初期化');
    
    const editPanel = document.getElementById('spine-edit-panel-v3');
    if (!editPanel) {
        console.warn('⚠️ 編集パネルが見つかりません - ドラッグ機能追加をスキップ');
        return;
    }
    
    // タイトルバーを作成
    const titleBar = editPanel.querySelector('div[style*="font-weight: bold"]');
    if (!titleBar) {
        console.warn('⚠️ タイトルバーが見つかりません');
        return;
    }
    
    // ドラッグ可能であることを示すスタイル設定
    titleBar.style.cursor = 'move';
    titleBar.style.userSelect = 'none';
    titleBar.title = 'ドラッグして移動';
    
    // ドラッグ状態管理
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let panelStart = { x: 0, y: 0 };
    
    // マウスダウン - ドラッグ開始
    titleBar.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        isDragging = true;
        dragStart.x = e.clientX;
        dragStart.y = e.clientY;
        
        // パネルの現在位置を取得
        const rect = editPanel.getBoundingClientRect();
        panelStart.x = rect.left;
        panelStart.y = rect.top;
        
        console.log('🖱️ ドラッグ開始', { dragStart, panelStart });
        
        // ドラッグ中のスタイル変更
        titleBar.style.background = '#007acc';
        titleBar.style.color = 'white';
        titleBar.style.borderRadius = '4px';
        titleBar.style.padding = '5px';
        titleBar.style.margin = '-5px -5px 10px -5px';
        
        document.body.style.userSelect = 'none';
    });
    
    // マウス移動 - ドラッグ中
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        const newX = panelStart.x + deltaX;
        const newY = panelStart.y + deltaY;
        
        // 画面境界チェック
        const maxX = window.innerWidth - editPanel.offsetWidth;
        const maxY = window.innerHeight - editPanel.offsetHeight;
        
        const constrainedX = Math.max(0, Math.min(newX, maxX));
        const constrainedY = Math.max(0, Math.min(newY, maxY));
        
        editPanel.style.left = constrainedX + 'px';
        editPanel.style.top = constrainedY + 'px';
        editPanel.style.right = 'auto'; // rightプロパティを無効化
        editPanel.style.bottom = 'auto'; // bottomプロパティを無効化
    });
    
    // マウスアップ - ドラッグ終了
    document.addEventListener('mouseup', function(e) {
        if (!isDragging) return;
        
        isDragging = false;
        
        console.log('🖱️ ドラッグ終了');
        
        // スタイルを元に戻す
        titleBar.style.background = '';
        titleBar.style.color = '#007acc';
        titleBar.style.borderRadius = '';
        titleBar.style.padding = '';
        titleBar.style.margin = '';
        
        document.body.style.userSelect = '';
    });
    
    console.log('✅ タイトルバードラッグ機能初期化完了');
}