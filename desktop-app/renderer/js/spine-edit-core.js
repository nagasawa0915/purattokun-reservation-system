// 🎯 Spine編集システム Core Module v3.0 - Desktop版
// SpineEditSystem基本状態 + ModuleManager + 座標系スワップ機能
// デスクトップアプリ用に最適化された版本
// 作成日: 2025-08-10

console.log('🚀 SpineEditCore Desktop版 モジュール読み込み開始');

// ========== 基本設計原則 ========== //
/*
デスクトップ版最適化:
├── レイヤー1: CSS基本配置（静的）
├── レイヤー2: JavaScript基本制御（動的・最小限）
└── Desktop拡張モジュール: ファイルI/O・メニュー連携（必要時のみ）

座標問題対策:
- 基本状態では常に2レイヤーのみ
- 複雑な機能は使用時のみ追加
- 使用後は完全にクリーンアップ
- 座標計算は常にシンプルに保つ
- デスクトップ特有機能との統合を考慮
*/

// ========== グローバル状態管理（最小限） ========== //

// 基本状態
const SpineEditSystem = {
    // レイヤー1: CSS基本配置データ
    baseLayer: {
        targetElement: null,
        initialPosition: { left: null, top: null, width: null, height: null }
    },
    
    // レイヤー2: JavaScript基本制御
    controlLayer: {
        isEditMode: false,
        isDragging: false,
        dragStartPos: { x: 0, y: 0 },
        elementStartPos: { left: 0, top: 0 },
        selectedCharacter: null
    },
    
    // モジュール管理（動的追加・削除）
    modules: new Map(),
    
    // 🔧 座標系スワップ機能（競合回避の核心）
    coordinateSwap: {
        backup: {
            left: null,
            top: null,
            width: null,
            height: null,
            transform: null
        },
        isSwapped: false,
        
        // 編集開始時：複雑な座標系をシンプルな絶対座標に変換
        enterEditMode: function(element) {
            if (!element) {
                console.warn('⚠️ 要素が指定されていません');
                return false;
            }
            
            console.log('🔄 座標系スワップ開始 - 複雑座標→シンプル座標');
            
            try {
                // 現在の描画位置を正確に取得
                const rect = element.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(element);
                
                // 元の座標系を完全バックアップ
                this.backup = {
                    left: element.style.left || computedStyle.left,
                    top: element.style.top || computedStyle.top,
                    width: element.style.width || computedStyle.width,
                    height: element.style.height || computedStyle.height,
                    transform: element.style.transform || computedStyle.transform
                };
                
                console.log('💾 元座標系をバックアップ:', this.backup);
                
                // シンプルな絶対座標に変換（transform除去）
                element.style.position = 'absolute';
                element.style.left = rect.left + 'px';
                element.style.top = rect.top + 'px';
                element.style.width = rect.width + 'px';
                element.style.height = rect.height + 'px';
                element.style.transform = 'none'; // 重要：transform競合を完全排除
                element.style.margin = '0';
                
                this.isSwapped = true;
                SpineEditSystem.controlLayer.isEditMode = true;
                
                console.log('✅ シンプル座標に変換完了:', {
                    left: rect.left + 'px',
                    top: rect.top + 'px',
                    width: rect.width + 'px',
                    height: rect.height + 'px',
                    transform: 'none'
                });
                
                return true;
            } catch (error) {
                console.error('座標系スワップエラー:', error);
                return false;
            }
        },
        
        // 編集終了時：シンプル座標を元の複雑な座標系に変換
        exitEditMode: function(element) {
            if (!this.isSwapped || !element) {
                console.log('⚠️ 座標系がスワップされていないか要素がありません');
                return false;
            }
            
            console.log('🔄 座標系復元開始 - シンプル座標→元座標系');
            
            try {
                // 編集後の絶対座標を取得
                const editedRect = element.getBoundingClientRect();
                const parentElement = element.parentElement;
                
                if (!parentElement) {
                    console.error('親要素が見つかりません');
                    return false;
                }
                
                const parentRect = parentElement.getBoundingClientRect();
                
                // 元の座標系形式（%値 + transform）に変換
                const newLeftPercent = ((editedRect.left + editedRect.width/2 - parentRect.left) / parentRect.width) * 100;
                const newTopPercent = ((editedRect.top + editedRect.height/2 - parentRect.top) / parentRect.height) * 100;
                const newWidthPercent = (editedRect.width / parentRect.width) * 100;
                const newHeightPercent = (editedRect.height / parentRect.height) * 100;
                
                // 元の形式で適用
                element.style.left = newLeftPercent.toFixed(1) + '%';
                element.style.top = newTopPercent.toFixed(1) + '%';
                element.style.width = newWidthPercent.toFixed(1) + '%';
                element.style.height = newHeightPercent.toFixed(1) + '%';
                element.style.transform = 'translate(-50%, -50%)'; // 元のtransform復元
                element.style.margin = ''; // marginをリセット
                
                console.log('✅ 元座標系に復元完了:', {
                    left: newLeftPercent.toFixed(1) + '%',
                    top: newTopPercent.toFixed(1) + '%',
                    width: newWidthPercent.toFixed(1) + '%',
                    height: newHeightPercent.toFixed(1) + '%',
                    transform: 'translate(-50%, -50%)'
                });
                
                this.isSwapped = false;
                SpineEditSystem.controlLayer.isEditMode = false;
                
                return true;
            } catch (error) {
                console.error('座標系復元エラー:', error);
                return false;
            }
        },
        
        // 緊急時：元の座標系に強制復元
        forceRestore: function(element) {
            if (!element || !this.backup || !this.backup.left) {
                console.log('⚠️ 強制復元用のバックアップがありません');
                return false;
            }
            
            console.log('🚨 緊急復元実行');
            
            try {
                element.style.left = this.backup.left;
                element.style.top = this.backup.top;
                element.style.width = this.backup.width;
                element.style.height = this.backup.height;
                element.style.transform = this.backup.transform;
                element.style.margin = '';
                
                this.isSwapped = false;
                SpineEditSystem.controlLayer.isEditMode = false;
                
                return true;
            } catch (error) {
                console.error('強制復元エラー:', error);
                return false;
            }
        }
    },
    
    // 座標計算ヘルパー（シンプル化）
    coords: {
        // 基本座標変換のみ（複雑な計算は避ける）
        pxToPercent: (pxValue, parentSize) => {
            if (!parentSize || parentSize === 0) return 0;
            return parseFloat(((pxValue / parentSize) * 100).toFixed(1));
        },
        percentToPx: (percentValue, parentSize) => {
            if (!parentSize || parentSize === 0) return 0;
            return (parseFloat(percentValue) / 100) * parentSize;
        }
    },
    
    // デスクトップ版拡張機能
    desktop: {
        // ファイル操作コールバック
        onProjectChange: null,
        onCharacterSelect: null,
        onEditStart: null,
        onEditEnd: null,
        
        // デスクトップAPI連携
        api: null
    },
    
    // システム状態
    status: {
        initialized: false,
        version: '3.0.0-desktop',
        platform: 'electron'
    }
};

console.log('✅ v3.0 Desktop版 基本構造準備完了');

// ========== モジュールマネージャー ========== //

const ModuleManager = {
    modules: new Map(),
    
    // モジュール存在確認
    hasModule: function(name) {
        return this.modules.has(name);
    },
    
    // モジュール取得
    getModule: function(name) {
        return this.modules.get(name) || null;
    },
    
    // モジュール追加
    addModule: function(name, module) {
        if (!name || !module) {
            console.warn('⚠️ 無効なモジュール名またはモジュールオブジェクト');
            return false;
        }
        
        try {
            this.modules.set(name, {
                instance: module,
                loaded: new Date().toISOString(),
                active: true
            });
            
            console.log(`✅ モジュール追加: ${name}`);
            return true;
        } catch (error) {
            console.error(`モジュール追加エラー (${name}):`, error);
            return false;
        }
    },
    
    // モジュール削除
    removeModule: function(name) {
        if (!this.modules.has(name)) {
            console.warn(`⚠️ モジュールが存在しません: ${name}`);
            return false;
        }
        
        try {
            const module = this.modules.get(name);
            
            // モジュールにクリーンアップ関数がある場合は実行
            if (module.instance && typeof module.instance.cleanup === 'function') {
                module.instance.cleanup();
            }
            
            this.modules.delete(name);
            console.log(`✅ モジュール削除: ${name}`);
            return true;
        } catch (error) {
            console.error(`モジュール削除エラー (${name}):`, error);
            return false;
        }
    },
    
    // 全モジュール削除
    removeAllModules: function() {
        const moduleNames = Array.from(this.modules.keys());
        
        moduleNames.forEach(name => {
            this.removeModule(name);
        });
        
        console.log('✅ 全モジュールクリア完了');
    },
    
    // モジュール一覧取得
    getAllModules: function() {
        return Array.from(this.modules.keys());
    },
    
    // モジュール数取得
    getModuleCount: function() {
        return this.modules.size;
    },
    
    // モジュール情報表示
    getModuleInfo: function(name) {
        const module = this.modules.get(name);
        if (!module) return null;
        
        return {
            name,
            loaded: module.loaded,
            active: module.active,
            hasCleanup: typeof module.instance.cleanup === 'function'
        };
    }
};

// ========== デスクトップ版初期化関数 ========== //

/**
 * デスクトップ版SpineEditSystem初期化
 * @param {Object} options - 初期化オプション
 */
function initializeSpineEditSystem(options = {}) {
    console.log('🚀 SpineEditSystem Desktop版 初期化開始');
    
    try {
        // デフォルトオプション設定
        const config = {
            autoDetect: true,
            enableKeyboardShortcuts: true,
            enableDragAndDrop: true,
            debugMode: false,
            ...options
        };
        
        // 1. ベースレイヤー初期化
        if (!initializeBaseLayer(config)) {
            console.error('ベースレイヤー初期化失敗');
            return false;
        }
        
        // 2. コントロールレイヤー初期化
        if (!initializeControlLayer(config)) {
            console.error('コントロールレイヤー初期化失敗');
            return false;
        }
        
        // 3. デスクトップ拡張機能初期化
        if (!initializeDesktopExtensions(config)) {
            console.warn('デスクトップ拡張機能初期化に一部問題がありました');
        }
        
        SpineEditSystem.status.initialized = true;
        
        console.log('✅ SpineEditSystem Desktop版 初期化完了');
        return true;
    } catch (error) {
        console.error('SpineEditSystem 初期化エラー:', error);
        return false;
    }
}

/**
 * ベースレイヤー初期化
 */
function initializeBaseLayer(config) {
    console.log('🔧 レイヤー1: 基本配置初期化開始');
    
    try {
        // 対象要素を取得（デスクトップ版用セレクター）
        const selectors = [
            '#character-canvas',
            '#purattokun-canvas',
            '#nezumi-canvas',
            'canvas[data-spine-character]',
            '.spine-character',
            '.spine-canvas'
        ];
        
        let targetElement = null;
        for (const selector of selectors) {
            targetElement = document.querySelector(selector);
            if (targetElement) {
                console.log(`✅ 対象要素検出: ${selector}`);
                break;
            }
        }
        
        if (!targetElement) {
            console.error('❌ 対象要素が見つかりません');
            return false;
        }
        
        SpineEditSystem.baseLayer.targetElement = targetElement;
        
        // 初期CSS状態を記録（座標計算の基準）
        const computedStyle = window.getComputedStyle(targetElement);
        const parentElement = targetElement.parentElement;
        
        if (!parentElement) {
            console.error('親要素が見つかりません');
            return false;
        }
        
        const parentRect = parentElement.getBoundingClientRect();
        
        SpineEditSystem.baseLayer.initialPosition = {
            left: SpineEditSystem.coords.pxToPercent(parseFloat(computedStyle.left || '0'), parentRect.width) + '%',
            top: SpineEditSystem.coords.pxToPercent(parseFloat(computedStyle.top || '0'), parentRect.height) + '%',
            width: SpineEditSystem.coords.pxToPercent(parseFloat(computedStyle.width || '0'), parentRect.width) + '%',
            height: SpineEditSystem.coords.pxToPercent(parseFloat(computedStyle.height || '0'), parentRect.height) + '%'
        };
        
        console.log('✅ レイヤー1: 基本配置初期化完了', SpineEditSystem.baseLayer.initialPosition);
        return true;
    } catch (error) {
        console.error('ベースレイヤー初期化エラー:', error);
        return false;
    }
}

/**
 * コントロールレイヤー初期化
 */
function initializeControlLayer(config) {
    console.log('🔧 レイヤー2: 基本制御初期化開始');
    
    try {
        const targetElement = SpineEditSystem.baseLayer.targetElement;
        if (!targetElement) {
            console.error('❌ 対象要素が未初期化です');
            return false;
        }
        
        // 基本的なマウスイベント（最小限）
        if (config.enableDragAndDrop) {
            targetElement.addEventListener('mousedown', handleMouseDown);
            targetElement.addEventListener('click', handleElementClick);
        }
        
        // キーボードショートカット
        if (config.enableKeyboardShortcuts) {
            document.addEventListener('keydown', handleKeyboardShortcuts);
        }
        
        console.log('✅ レイヤー2: 基本制御初期化完了');
        return true;
    } catch (error) {
        console.error('コントロールレイヤー初期化エラー:', error);
        return false;
    }
}

/**
 * デスクトップ拡張機能初期化
 */
function initializeDesktopExtensions(config) {
    console.log('🔧 デスクトップ拡張機能初期化開始');
    
    try {
        // Electron APIの確認
        if (window.spineEditorAPI) {
            SpineEditSystem.desktop.api = window.spineEditorAPI;
            console.log('✅ Electron API連携完了');
        } else {
            console.warn('⚠️ Electron APIが利用できません');
        }
        
        // ファイルドラッグ&ドロップ対応
        if (config.enableDragAndDrop) {
            setupFileDragAndDrop();
        }
        
        // デスクトップ固有のショートカット設定
        setupDesktopShortcuts();
        
        console.log('✅ デスクトップ拡張機能初期化完了');
        return true;
    } catch (error) {
        console.error('デスクトップ拡張機能初期化エラー:', error);
        return false;
    }
}

// ========== イベントハンドラー ========== //

function handleMouseDown(event) {
    // デスクトップ版ドラッグ処理はメインアプリケーションで実装
    console.log('🔄 マウスダウンイベント');
}

function handleElementClick(event) {
    console.log('🔄 要素クリックイベント');
    
    // デスクトップコールバック
    if (SpineEditSystem.desktop.onCharacterSelect) {
        SpineEditSystem.desktop.onCharacterSelect(event.target);
    }
}

function handleKeyboardShortcuts(event) {
    const { ctrlKey, metaKey, shiftKey, key } = event;
    const cmdOrCtrl = ctrlKey || metaKey;
    
    // Enter: 編集モード開始
    if (key === 'Enter' && !SpineEditSystem.controlLayer.isEditMode) {
        startEditMode();
    }
    
    // Escape: 編集モード終了
    if (key === 'Escape' && SpineEditSystem.controlLayer.isEditMode) {
        endEditMode();
    }
}

function setupFileDragAndDrop() {
    // ファイルドラッグ&ドロップはメインアプリケーションで実装
    console.log('✅ ファイルドラッグ&ドロップセットアップ準備完了');
}

function setupDesktopShortcuts() {
    console.log('✅ デスクトップショートカットセットアップ完了');
}

// ========== 編集モード制御 ========== //

function startEditMode(element) {
    const targetElement = element || SpineEditSystem.baseLayer.targetElement;
    if (!targetElement) {
        console.warn('編集対象要素が指定されていません');
        return false;
    }
    
    const success = SpineEditSystem.coordinateSwap.enterEditMode(targetElement);
    if (success && SpineEditSystem.desktop.onEditStart) {
        SpineEditSystem.desktop.onEditStart(targetElement);
    }
    
    return success;
}

function endEditMode(element) {
    const targetElement = element || SpineEditSystem.baseLayer.targetElement;
    if (!targetElement) {
        console.warn('編集対象要素が指定されていません');
        return false;
    }
    
    const success = SpineEditSystem.coordinateSwap.exitEditMode(targetElement);
    if (success && SpineEditSystem.desktop.onEditEnd) {
        SpineEditSystem.desktop.onEditEnd(targetElement);
    }
    
    return success;
}

// ========== グローバル公開 ========== //

// SpineEditSystemをグローバルに公開
window.SpineEditSystem = SpineEditSystem;
window.ModuleManager = ModuleManager;

// 初期化関数をグローバルに公開
window.initializeSpineEditSystem = initializeSpineEditSystem;
window.startEditMode = startEditMode;
window.endEditMode = endEditMode;

// デバッグ用関数
window.spineEditDebug = {
    getSystemStatus: () => SpineEditSystem.status,
    getModuleList: () => ModuleManager.getAllModules(),
    forceRestore: (element) => SpineEditSystem.coordinateSwap.forceRestore(element),
    clearAllModules: () => ModuleManager.removeAllModules()
};

console.log('✅ SpineEditCore Desktop版 - モジュール読み込み完了');
console.log('📊 システム情報:', SpineEditSystem.status);

// 自動初期化（DOM準備完了後）
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 DOM準備完了、SpineEditSystem自動初期化開始');
    
    // デスクトップ版では手動初期化を推奨
    // initializeSpineEditSystem();
    
    console.log('ℹ️ 手動初期化を待機中... window.initializeSpineEditSystem() で初期化してください');
});