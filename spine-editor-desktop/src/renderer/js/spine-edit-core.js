// 🎯 Spine編集システム Core Module v3.0
// SpineEditSystem基本状態 + ModuleManager + 座標系スワップ機能
// 抽出日: 2025-08-07

console.log('🚀 SpineEditCore モジュール読み込み開始');

// ========== 基本設計原則 ========== //
/*
レイヤー構成（座標問題防止）:
├── レイヤー1: CSS基本配置（静的）
├── レイヤー2: JavaScript基本制御（動的・最小限）
└── 拡張モジュール: 必要時のみ追加（使用後削除）

座標問題対策:
- 基本状態では常に2レイヤーのみ
- 複雑な機能は使用時のみ追加
- 使用後は完全にクリーンアップ
- 座標計算は常にシンプルに保つ
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
        elementStartPos: { left: 0, top: 0 }
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
            console.log('🔄 座標系スワップ開始 - 複雑座標→シンプル座標');
            
            // 現在の描画位置を正確に取得
            const rect = element.getBoundingClientRect();
            
            // 元の座標系を完全バックアップ
            this.backup = {
                left: element.style.left,
                top: element.style.top,
                width: element.style.width,
                height: element.style.height,
                transform: element.style.transform
            };
            
            console.log('💾 元座標系をバックアップ:', this.backup);
            
            // シンプルな絶対座標に変換（transform除去）
            element.style.left = rect.left + 'px';
            element.style.top = rect.top + 'px';
            element.style.width = rect.width + 'px';
            element.style.height = rect.height + 'px';
            element.style.transform = 'none'; // 重要：transform競合を完全排除
            
            this.isSwapped = true;
            
            console.log('✅ シンプル座標に変換完了:', {
                left: rect.left + 'px',
                top: rect.top + 'px',
                width: rect.width + 'px',
                height: rect.height + 'px',
                transform: 'none'
            });
        },
        
        // 編集終了時：シンプル座標を元の複雑な座標系に変換
        exitEditMode: function(element) {
            if (!this.isSwapped) return;
            
            console.log('🔄 座標系復元開始 - シンプル座標→元座標系');
            
            // 要素のundefinedチェック
            if (!element) {
                console.log('⚠️ 要素がundefinedのため、座標系復元をスキップ');
                this.isSwapped = false;
                return;
            }
            
            // 編集後の絶対座標を取得
            const editedRect = element.getBoundingClientRect();
            const parentRect = element.parentElement.getBoundingClientRect();
            
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
            
            console.log('✅ 元座標系に復元完了:', {
                left: newLeftPercent.toFixed(1) + '%',
                top: newTopPercent.toFixed(1) + '%',
                width: newWidthPercent.toFixed(1) + '%',
                height: newHeightPercent.toFixed(1) + '%',
                transform: 'translate(-50%, -50%)'
            });
            
            this.isSwapped = false;
        },
        
        // 緊急時：元の座標系に強制復元
        forceRestore: function(element) {
            if (!this.backup.left) return;
            
            console.log('🚨 緊急復元実行');
            element.style.left = this.backup.left;
            element.style.top = this.backup.top;
            element.style.width = this.backup.width;
            element.style.height = this.backup.height;
            element.style.transform = this.backup.transform;
            
            this.isSwapped = false;
        }
    },
    
    // 座標計算ヘルパー（シンプル化）
    coords: {
        // 基本座標変換のみ（複雑な計算は避ける）
        pxToPercent: (pxValue, parentSize) => ((pxValue / parentSize) * 100).toFixed(1),
        percentToPx: (percentValue, parentSize) => (parseFloat(percentValue) / 100) * parentSize
    }
};

console.log('✅ v3.0 基本構造準備完了');

// ========== レイヤー1: CSS基本配置システム ========== //

function initializeBaseLayer() {
    console.log('🔧 レイヤー1: 基本配置初期化開始');
    
    // 対象要素を取得（シンプル化）
    const targetElement = document.querySelector('#character-canvas') ||
                         document.querySelector('#purattokun-canvas') || 
                         document.querySelector('canvas[data-spine-character]') ||
                         document.querySelector('.spine-character');
    
    if (!targetElement) {
        console.error('❌ 対象要素が見つかりません');
        return false;
    }
    
    SpineEditSystem.baseLayer.targetElement = targetElement;
    
    // 初期CSS状態を記録（座標計算の基準）
    const computedStyle = window.getComputedStyle(targetElement);
    const parentRect = targetElement.parentElement.getBoundingClientRect();
    
    SpineEditSystem.baseLayer.initialPosition = {
        left: SpineEditSystem.coords.pxToPercent(parseFloat(computedStyle.left), parentRect.width) + '%',
        top: SpineEditSystem.coords.pxToPercent(parseFloat(computedStyle.top), parentRect.height) + '%',
        width: SpineEditSystem.coords.pxToPercent(parseFloat(computedStyle.width), parentRect.width) + '%',
        height: SpineEditSystem.coords.pxToPercent(parseFloat(computedStyle.height), parentRect.height) + '%'
    };
    
    console.log('✅ レイヤー1: 基本配置初期化完了', SpineEditSystem.baseLayer.initialPosition);
    return true;
}

// ========== レイヤー2: JavaScript基本制御システム ========== //

function initializeControlLayer() {
    console.log('🔧 レイヤー2: 基本制御初期化開始');
    
    const targetElement = SpineEditSystem.baseLayer.targetElement;
    if (!targetElement) {
        console.error('❌ 対象要素が未初期化です');
        return false;
    }
    
    // 基本的なマウスイベント（最小限）
    targetElement.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // キーボードイベント（矢印キー移動）
    document.addEventListener('keydown', handleKeyDown);
    
    console.log('✅ レイヤー2: 基本制御初期化完了');
    return true;
}

// ========== 基本マウス操作（シンプル版） ========== //

function handleMouseDown(event) {
    if (!SpineEditSystem.controlLayer.isEditMode) return;
    
    // 🔧 NEW: バウンディングボックス表示中は基本ドラッグを無効化
    if (SpineEditSystem.modules.has('boundingBox')) {
        console.log('⚠️ バウンディングボックス表示中 - 基本ドラッグ無効');
        return;
    }
    
    SpineEditSystem.controlLayer.isDragging = true;
    SpineEditSystem.controlLayer.dragStartPos = {
        x: event.clientX,
        y: event.clientY
    };
    
    // 現在位置を記録
    const targetElement = SpineEditSystem.baseLayer.targetElement;
    const computedStyle = window.getComputedStyle(targetElement);
    SpineEditSystem.controlLayer.elementStartPos = {
        left: parseFloat(computedStyle.left),
        top: parseFloat(computedStyle.top)
    };
    
    event.preventDefault();
}

function handleMouseMove(event) {
    if (!SpineEditSystem.controlLayer.isDragging) return;
    
    // 🔧 NEW: バウンディングボックスモジュール動作中は基本移動を停止
    if (SpineEditSystem.modules.has('boundingBox')) {
        const boundingBoxModule = SpineEditSystem.modules.get('boundingBox');
        if (boundingBoxModule.dragState && boundingBoxModule.dragState.isDragging) {
            console.log('⚠️ バウンディングボックス操作中 - 基本移動を停止');
            return; // バウンディングボックス処理を優先
        }
    }
    
    const deltaX = event.clientX - SpineEditSystem.controlLayer.dragStartPos.x;
    const deltaY = event.clientY - SpineEditSystem.controlLayer.dragStartPos.y;
    
    const targetElement = SpineEditSystem.baseLayer.targetElement;
    const parentRect = targetElement.parentElement.getBoundingClientRect();
    
    // 新しい位置計算（シンプル）
    const newLeft = SpineEditSystem.controlLayer.elementStartPos.left + deltaX;
    const newTop = SpineEditSystem.controlLayer.elementStartPos.top + deltaY;
    
    // %に変換して適用
    const newLeftPercent = SpineEditSystem.coords.pxToPercent(newLeft, parentRect.width);
    const newTopPercent = SpineEditSystem.coords.pxToPercent(newTop, parentRect.height);
    
    targetElement.style.left = newLeftPercent + '%';
    targetElement.style.top = newTopPercent + '%';
}

function handleMouseUp(event) {
    if (!SpineEditSystem.controlLayer.isDragging) return;
    
    SpineEditSystem.controlLayer.isDragging = false;
    console.log('✅ 基本移動完了');
}

// ========== キーボード操作（矢印キー） ========== //

function handleKeyDown(event) {
    if (!SpineEditSystem.controlLayer.isEditMode) return;
    
    // 矢印キーのみ処理
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) return;
    
    event.preventDefault();
    
    const targetElement = SpineEditSystem.baseLayer.targetElement;
    const parentRect = targetElement.parentElement.getBoundingClientRect();
    
    // 移動量（0.1% または 1%）
    const moveAmount = event.shiftKey ? 1.0 : 0.1;
    
    // 現在位置取得
    const computedStyle = window.getComputedStyle(targetElement);
    const currentLeft = parseFloat(computedStyle.left);
    const currentTop = parseFloat(computedStyle.top);
    
    let newLeft = currentLeft;
    let newTop = currentTop;
    
    const moveAmountPx = (moveAmount / 100) * parentRect.width; // 1%をpxに変換
    
    switch(event.code) {
        case 'ArrowLeft':  newLeft -= moveAmountPx; break;
        case 'ArrowRight': newLeft += moveAmountPx; break;
        case 'ArrowUp':    newTop -= moveAmountPx; break;
        case 'ArrowDown':  newTop += moveAmountPx; break;
    }
    
    // %に変換して適用
    const newLeftPercent = SpineEditSystem.coords.pxToPercent(newLeft, parentRect.width);
    const newTopPercent = SpineEditSystem.coords.pxToPercent(newTop, parentRect.height);
    
    targetElement.style.left = newLeftPercent + '%';
    targetElement.style.top = newTopPercent + '%';
    
    console.log(`⌨️ キーボード移動: ${event.code}, 移動量: ${moveAmount}%`);
}

// ========== モジュール管理システム ========== //

const ModuleManager = {
    // モジュール存在確認
    hasModule: function(name) {
        return SpineEditSystem.modules.has(name);
    },
    
    // モジュール取得
    getModule: function(name) {
        return SpineEditSystem.modules.get(name);
    },
    
    // モジュール追加（動的）
    addModule: function(name, moduleInstance) {
        if (SpineEditSystem.modules.has(name)) {
            console.warn(`⚠️ モジュール "${name}" は既に存在します - 既存をクリーンアップして再登録`);
            const existingModule = SpineEditSystem.modules.get(name);
            if (existingModule && typeof existingModule.cleanup === "function") {
                existingModule.cleanup();
            }
            SpineEditSystem.modules.delete(name);
            console.log(`🧹 既存モジュール "${name}" クリーンアップ完了`);
        }        
        SpineEditSystem.modules.set(name, moduleInstance);
        
        // モジュール初期化
        if (typeof moduleInstance.initialize === 'function') {
            moduleInstance.initialize(SpineEditSystem.baseLayer.targetElement);
        }
        
        console.log(`✅ モジュール '${name}' 追加完了`);
        return true;
    },
    
    // モジュール削除（クリーンアップ）
    removeModule: function(name) {
        const moduleInstance = SpineEditSystem.modules.get(name);
        if (!moduleInstance) {
            console.warn(`⚠️ モジュール '${name}' が見つかりません`);
            return false;
        }
        
        // モジュールクリーンアップ
        if (typeof moduleInstance.cleanup === 'function') {
            moduleInstance.cleanup();
        }
        
        SpineEditSystem.modules.delete(name);
        console.log(`✅ モジュール '${name}' 削除完了`);
        return true;
    },
    
    // 全モジュール削除（基本状態に戻す）
    removeAllModules: function() {
        for (const [name, moduleInstance] of SpineEditSystem.modules) {
            if (typeof moduleInstance.cleanup === 'function') {
                moduleInstance.cleanup();
            }
        }
        SpineEditSystem.modules.clear();
        console.log('✅ 全モジュール削除完了 - 基本状態に復帰');
    }
};

// SpineEditCoreモジュールとしてエクスポート
if (typeof window !== 'undefined') {
    window.SpineEditSystem = SpineEditSystem;
    window.ModuleManager = ModuleManager;
    window.initializeBaseLayer = initializeBaseLayer;
    window.initializeControlLayer = initializeControlLayer;
}

console.log('✅ SpineEditCore モジュール読み込み完了');
