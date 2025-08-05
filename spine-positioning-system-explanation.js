// 🎯 Spine編集システム v3.0 - シンプル・レイヤー管理版
// 基本2レイヤー + 必要時のみモジュール追加による座標問題解決

console.log('🚀 Spine編集システム v3.0 - シンプル版読み込み開始');

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
    // モジュール追加（動的）
    addModule: function(name, moduleInstance) {
        if (SpineEditSystem.modules.has(name)) {
            console.warn(`⚠️ モジュール '${name}' は既に存在します`);
            return false;
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

// ========== 基本UI作成（最小限） ========== //

function createEditStartUI() {
    console.log('🎨 編集開始UI作成');
    
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
        ">
            ✏️ 編集開始
        </button>
    `;
    
    document.body.appendChild(startPanel);
    
    // 編集開始ボタンイベント
    const startBtn = document.getElementById('start-edit-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            removeEditStartUI();
            startEditMode();
            createEditingUI();
        });
    }
    
    console.log('✅ 編集開始UI作成完了');
}

function createEditingUI() {
    console.log('🎨 編集中UI作成開始');
    
    // 編集中のUIパネル作成
    const editPanel = document.createElement('div');
    editPanel.id = 'spine-edit-panel-v3';
    editPanel.style.cssText = `
        position: fixed;
        top: 20px;
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
    
    console.log('✅ 編集中UI作成完了');
}

function setupEditingUIEvents() {
    // 編集終了ボタン（バウンディングボックスボタンは削除）
    const endBtn = document.getElementById('end-edit-btn');
    if (endBtn) {
        endBtn.addEventListener('click', () => {
            stopEditMode();
            createEditStartUI(); // 編集開始UIに戻る
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
function setupCharacterClickForBoundingBox() {
    const targetElement = SpineEditSystem.baseLayer.targetElement;
    if (!targetElement) return;
    
    // キャラクタークリックイベント
    targetElement.addEventListener('click', (event) => {
        if (!SpineEditSystem.controlLayer.isEditMode) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        const hasModule = SpineEditSystem.modules.has('boundingBox');
        
        if (hasModule) {
            // 既に表示中なら削除
            ModuleManager.removeModule('boundingBox');
            console.log('📦 バウンディングボックス非表示');
        } else {
            // バウンディングボックス表示
            const boundingBoxModule = createBoundingBoxModule();
            const success = ModuleManager.addModule('boundingBox', boundingBoxModule);
            
            if (success) {
                console.log('📦 バウンディングボックス表示');
            } else {
                console.error('❌ バウンディングボックス表示失敗');
            }
        }
    });
    
    console.log('✅ キャラクタークリック→バウンディングボックス設定完了');
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
        
        // モジュール初期化
        initialize: function(targetElement) {
            console.log('🔧 バウンディングボックス初期化');
            
            // 🔧 NEW: 座標系が確実にスワップされていることを確認
            if (!SpineEditSystem.coordinateSwap.isSwapped) {
                console.warn('⚠️ 座標系未スワップ検出 - 強制スワップ実行');
                SpineEditSystem.coordinateSwap.enterEditMode(targetElement);
            }
            
            this.createBoundingBox(targetElement);
            this.setupEventListeners();
            this.isActive = true;
        },
        
        // モジュールクリーンアップ
        cleanup: function() {
            console.log('🧹 バウンディングボックスクリーンアップ');
            this.removeBoundingBox();
            this.removeEventListeners();
            this.isActive = false;
        },
        
        // バウンディングボックス作成
        createBoundingBox: function(targetElement) {
            const rect = targetElement.getBoundingClientRect();
            const parentRect = targetElement.parentElement.getBoundingClientRect();
            
            // バウンディングボックス本体
            this.boundingBox = document.createElement('div');
            this.boundingBox.id = 'spine-bounding-box';
            this.boundingBox.style.cssText = `
                position: absolute;
                border: 2px dashed #007acc;
                background: rgba(0, 122, 204, 0.1);
                pointer-events: none;
                z-index: 9999;
                left: ${rect.left - parentRect.left}px;
                top: ${rect.top - parentRect.top}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
            `;
            
            targetElement.parentElement.appendChild(this.boundingBox);
            
            // ハンドル作成
            this.createHandles();
            
            // 中央移動エリア作成
            this.createCenterArea();
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
    
    SpineEditSystem.controlLayer.isEditMode = true;
    
    // 🔧 座標系を編集モードに切り替え（競合回避の核心）
    const targetElement = SpineEditSystem.baseLayer.targetElement;
    SpineEditSystem.coordinateSwap.enterEditMode(targetElement);
    
    // 視覚的フィードバック（最小限）
    targetElement.style.outline = '2px dashed #007acc';
    targetElement.style.cursor = 'move';
    
    // キャラクタークリック→バウンディングボックス機能設定
    setupCharacterClickForBoundingBox();
    
    console.log('✅ 編集モード開始完了（座標系スワップ済み）');
    return true;
}

function stopEditMode() {
    console.log('🔚 編集モード終了');
    
    SpineEditSystem.controlLayer.isEditMode = false;
    
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
    
    console.log('✅ 編集モード終了完了 - 座標系復元・クリーンな状態に復帰');
}

// ========== 初期化・起動システム ========== //

function initializeSpineEditSystem() {
    console.log('🚀 Spine編集システム v3.0 初期化開始');
    
    // URLパラメータ確認
    const urlParams = new URLSearchParams(window.location.search);
    const editMode = urlParams.get('edit') === 'true';
    
    if (editMode) {
        // 編集開始UIを表示
        createEditStartUI();
    }
    
    console.log('✅ Spine編集システム v3.0 初期化完了');
}

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
    
    // モジュール管理
    addModule: ModuleManager.addModule,
    removeModule: ModuleManager.removeModule,
    removeAllModules: ModuleManager.removeAllModules,
    
    // 座標ヘルパー
    coords: SpineEditSystem.coords
};

// ========== システム起動 ========== //

// DOM読み込み完了後に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSpineEditSystem);
} else {
    initializeSpineEditSystem();
}

console.log('🎯 Spine編集システム v3.0 - シンプル版読み込み完了');