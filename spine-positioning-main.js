// 🎯 Spine編集システム - メイン統合システム
// 抽象度: 最高（初期化・起動・モジュール統合・フォールバック処理）
// 役割: システム全体の統括・各モジュールの協調制御

console.log('🚀 Spine編集システム v3.0 - メイン統合システム読み込み開始');

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
    if (typeof setupGlobalClickHandler === 'function') {
        setupGlobalClickHandler();
    }
    
    SpineEditSystem.controlLayer.isEditMode = true;
    
    // 🔧 座標系を編集モードに切り替え（競合回避の核心）
    const targetElement = SpineEditSystem.baseLayer.targetElement;
    SpineEditSystem.coordinateSwap.enterEditMode(targetElement);
    
    // 視覚的フィードバック（最小限）
    targetElement.style.outline = '2px dashed #007acc';
    targetElement.style.cursor = 'move';
    
    // キャラクタークリック→バウンディングボックス機能設定
    if (typeof setupCharacterClickForBoundingBox === 'function') {
        setupCharacterClickForBoundingBox();
    }
    
    // タイトルバーモジュール追加
    const editingUI = document.querySelector('.editing-ui');
    if (editingUI && window.ModuleManager && typeof createDraggableTitleBarModule === 'function') {
        const titleBarModule = createDraggableTitleBarModule();
        if (ModuleManager.addModule('titleBar', titleBarModule)) {
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
    if (typeof MultiCharacterManager !== 'undefined' && MultiCharacterManager.cleanup) {
        MultiCharacterManager.cleanup();
    }
    
    // グローバルクリックハンドラーを削除
    if (typeof cleanupGlobalClickHandler === 'function') {
        cleanupGlobalClickHandler();
    }
    
    // 🔧 座標系を元に戻す（編集結果を保存）
    const targetElement = SpineEditSystem.baseLayer.targetElement;
    if (targetElement) {
        SpineEditSystem.coordinateSwap.exitEditMode(targetElement);
        
        // 視覚的フィードバック削除
        targetElement.style.outline = '';
        targetElement.style.cursor = '';
    }
    
    // 編集中UI削除
    if (typeof removeEditingUI === 'function') {
        removeEditingUI();
    }
    
    // 全モジュール削除（クリーンな状態に戻す）
    if (window.ModuleManager) {
        ModuleManager.removeAllModules();
    }
    
    console.log('✅ 編集モード終了完了 - 複数キャラクター対応・座標系復元・クリーンな状態に復帰');
}

// ========== 基盤レイヤー初期化 ========== //

function initializeBaseLayer() {
    console.log('🏗️ 基本レイヤー初期化');
    
    // 対象要素の検出
    const selectors = [
        '#character-canvas',
        '#purattokun-canvas',
        '.spine-character',
        '.demo-character'
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
    
    // 基本レイヤー設定
    SpineEditSystem.baseLayer.targetElement = targetElement;
    
    // 初期位置を記録
    const computedStyle = window.getComputedStyle(targetElement);
    SpineEditSystem.baseLayer.initialPosition = {
        left: computedStyle.left,
        top: computedStyle.top,
        width: computedStyle.width,
        height: computedStyle.height,
        transform: computedStyle.transform
    };
    
    console.log('✅ 基本レイヤー初期化完了');
    return true;
}

function initializeControlLayer() {
    console.log('🎮 制御レイヤー初期化');
    
    // 制御レイヤーの基本設定
    SpineEditSystem.controlLayer.isEditMode = false;
    SpineEditSystem.controlLayer.isDragging = false;
    SpineEditSystem.controlLayer.dragStartPos = { x: 0, y: 0 };
    SpineEditSystem.controlLayer.elementStartPos = { x: 0, y: 0 };
    
    console.log('✅ 制御レイヤー初期化完了');
    return true;
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
        if (typeof createEditStartUI === 'function') {
            createEditStartUI();
        }
    } else {
        console.log('ℹ️ 編集モードではありません');
    }
    
    // 保存された状態の復元（編集モード以外でも実行）
    setTimeout(() => {
        if (typeof restoreCharacterState === 'function') {
            restoreCharacterState();
        }
    }, 1000); // DOM構築完了を待つ
    
    console.log('✅ Spine編集システム v3.0 初期化完了');
    
    // 🧪 初期化後の状況診断（デバッグ用）
    setTimeout(() => {
        if (typeof diagnoseSystemStatus === 'function') {
            diagnoseSystemStatus();
        }
    }, 500);
}

// ========== システム統合・モジュール管理 ========== //

/**
 * 全モジュールの動的読み込み
 */
async function loadAllModules() {
    console.log('📦 全モジュール動的読み込み開始');
    
    const modules = [
        { name: 'UI Manager', src: 'spine-ui-manager.js' },
        { name: 'Multi Character Manager', src: 'spine-multi-character-manager.js' },
        { name: 'Bounding Box Module', src: 'spine-bounding-box-module.js' },
        { name: 'State Manager', src: 'spine-state-manager.js' },
        { name: 'Layer Editor', src: 'spine-layer-editor.js' },
        { name: 'Package Export', src: 'spine-package-export.js' },
        { name: 'Debug Tools', src: 'spine-debug-tools.js' }
    ];
    
    const loadPromises = modules.map(module => loadModule(module.name, module.src));
    
    try {
        await Promise.all(loadPromises);
        console.log('✅ 全モジュール読み込み完了');
        return true;
    } catch (error) {
        console.error('❌ モジュール読み込み中にエラー:', error);
        return false;
    }
}

/**
 * 個別モジュール読み込み
 */
function loadModule(name, src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            console.log(`✅ ${name} モジュール読み込み完了`);
            resolve();
        };
        script.onerror = (error) => {
            console.warn(`⚠️ ${name} モジュール読み込み失敗 - 継続します`, error);
            resolve(); // エラーでも継続
        };
        document.head.appendChild(script);
    });
}

// ========== 外部インターフェース（モジュール用） ========== //

// 統合されたシステム API
window.SpineEditingSystem = {
    initialize: initializeSpineEditSystem,
    startEdit: startEditMode,
    stopEdit: stopEditMode,
    loadModules: loadAllModules,
    get isInitialized() { return systemInitialized; },
    get isEditMode() { 
        return SpineEditSystem && SpineEditSystem.controlLayer && SpineEditSystem.controlLayer.isEditMode; 
    }
};

// Backward compatibility
window.initializeSpineEditSystem = initializeSpineEditSystem;
window.startEditMode = startEditMode;
window.stopEditMode = stopEditMode;

// ========== システム起動 ========== //

// DOMContentLoaded時の自動初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📋 DOM読み込み完了 - spine-edit-core.js待機開始');
        
        waitForSpineEditCore(() => {
            console.log('🚀 spine-edit-core.js準備完了 - モジュール統合システム開始');
            
            // 全モジュールを非同期で読み込み、完了後にシステム初期化
            loadAllModules().then(() => {
                initializeSpineEditSystem();
            });
        });
    });
} else {
    console.log('📋 DOM既に読み込み済み - spine-edit-core.js待機開始');
    
    waitForSpineEditCore(() => {
        console.log('🚀 spine-edit-core.js準備完了 - モジュール統合システム開始');
        
        loadAllModules().then(() => {
            initializeSpineEditSystem();
        });
    });
}

console.log('✅ Spine編集システム v3.0 - メイン統合システム読み込み完了');
console.log('🎯 Spine編集システム v3.0 - Phase 2: モジュール化版 完全起動準備完了');