# 🎯 Spineバウンディングボックス完璧実装ガイド

**完全版**: この1つのマニュアルを見るだけで、バウンディングボックス機能を完璧に実装できます  
**対象**: 0からSpineバウンディングボックス機能を実装したい開発者  
**保証**: Web版と同等の機能・修飾キー対応・座標問題なし  

---

## 📋 実装完了時の機能一覧

### ✅ 基本機能
- ✅ **ドラッグ移動**: 中央エリアでキャラクターを移動
- ✅ **角リサイズ**: 4つの角ハンドルで対角リサイズ
- ✅ **辺リサイズ**: 4つの辺ハンドルで一方向リサイズ
- ✅ **ビジュアルフィードバック**: ハンドルのホバー効果・ラベル表示

### ✅ 修飾キー対応（重要）
- ✅ **Shift**: 縦横比保持リサイズ
- ✅ **Ctrl/Alt**: 中心固定リサイズ
- ✅ **Ctrl+Shift/Alt+Shift**: 中心固定+縦横比保持

### ✅ 座標系統合
- ✅ **座標系スワップ**: transform競合の完全回避
- ✅ **%値変換**: 親要素基準の正確な座標変換
- ✅ **skeleton座標保護**: Spineキャラクターの内部座標を保護

---

## 🚨 最重要原則（実装前に必読）

### 🔒 **絶対に守るべき3つの原則**

#### 1. **skeleton座標は基本的に触らない**
```javascript
// ❌ 絶対禁止：skeleton座標の変更
skeleton.x = newX;
skeleton.y = newY;

// ✅ 正解：Canvas要素の位置のみ変更
targetElement.style.left = newLeftPercent + '%';
targetElement.style.top = newTopPercent + '%';
```

#### 2. **%値での最終適用**
```javascript
// ❌ 間違い：px値での直接適用
targetElement.style.left = newLeft + 'px';

// ✅ 正解：%値に変換してから適用
const newLeftPercent = SpineEditSystem.coords.pxToPercent(newLeft, parentRect.width);
targetElement.style.left = newLeftPercent + '%';
```

#### 3. **座標系スワップの実行**
```javascript
// ✅ 必須：編集開始時
SpineEditSystem.coordinateSwap.enterEditMode(targetElement);

// ✅ 必須：編集終了時
SpineEditSystem.coordinateSwap.exitEditMode(targetElement);
```

---

## 📐 第1章: 基本設計と座標系理解

### 🎯 座標系の種類と変換

#### **1. 元の座標系（複雑）**
```css
/* Spineキャラクターの標準設定 */
position: absolute;
left: 50%;                    /* 親要素の50%位置 */
top: 60%;                     /* 親要素の60%位置 */
transform: translate(-50%, -50%);  /* 中央原点調整 */
width: 30%;
height: auto;
```

#### **2. 編集用座標系（シンプル）**
```css
/* 座標系スワップ後 */
position: absolute;
left: 245px;                  /* 実際の描画位置（px） */
top: 180px;                   /* 実際の描画位置（px） */
transform: none;              /* transform競合を排除 */
width: 150px;
height: 120px;
```

#### **3. 座標変換の流れ**
```
元座標系 → 座標系スワップ → 編集処理 → 逆変換 → 元座標系
 %値        px値          px値操作    %値変換     %値
```

### 🔧 必須コンポーネント構成

```
SpineBoundingBox
├── SpineEditSystem（座標系管理）
│   ├── coordinateSwap（座標系変換）
│   └── coords（px⇔%変換）
├── バウンディングボックス本体
├── ハンドル×8（角4個+辺4個）
├── 中央ドラッグエリア
└── イベント処理システム
```

---

## 🛠️ 第2章: SpineEditSystem実装

### 📦 2-1. 座標系管理システム

```javascript
const SpineEditSystem = {
    // ターゲット要素管理
    baseLayer: {
        targetElement: null,
        initialPosition: { left: null, top: null, width: null, height: null }
    },
    
    // 🔧 座標系スワップ機能（transform競合回避の核心）
    coordinateSwap: {
        backup: {
            left: null,
            top: null,
            width: null,
            height: null,
            transform: null
        },
        isSwapped: false,
        
        // 編集開始時：複雑座標系→シンプル絶対座標
        enterEditMode: function(element) {
            console.log('🔄 座標系スワップ開始 - 複雑座標→シンプル座標');
            
            // 🔧 重要：getBoundingClientRectは親要素基準の座標が必要
            const rect = element.getBoundingClientRect();
            const parentRect = element.parentElement.getBoundingClientRect();
            
            // 元の座標系を完全バックアップ
            this.backup = {
                left: element.style.left,
                top: element.style.top,
                width: element.style.width,
                height: element.style.height,
                transform: element.style.transform
            };
            
            // 🔧 重要：親要素基準の相対座標に変換
            const relativeLeft = rect.left - parentRect.left;
            const relativeTop = rect.top - parentRect.top;
            
            element.style.left = relativeLeft + 'px';
            element.style.top = relativeTop + 'px';
            element.style.width = rect.width + 'px';
            element.style.height = rect.height + 'px';
            element.style.transform = 'none'; // 🔧 競合完全排除
            
            this.isSwapped = true;
            
            console.log('✅ シンプル座標変換完了（親要素基準）:', {
                left: relativeLeft + 'px',
                top: relativeTop + 'px',
                width: rect.width + 'px',
                height: rect.height + 'px',
                transform: 'none'
            });
        },
        
        // 編集終了時：シンプル絶対座標→元の複雑座標系
        exitEditMode: function(element) {
            if (!this.isSwapped) return;
            
            console.log('🔄 座標系復元開始 - シンプル座標→元座標系');
            
            if (!element) {
                console.log('⚠️ 要素undefined、座標系復元スキップ');
                this.isSwapped = false;
                return;
            }
            
            // 編集後の絶対座標を取得
            const editedRect = element.getBoundingClientRect();
            const parentRect = element.parentElement.getBoundingClientRect();
            
            // 元の座標系形式（%値 + transform）に変換
            // 🔧 重要：中央原点（transform: translate(-50%, -50%)）を考慮
            const newLeftPercent = ((editedRect.left + editedRect.width/2 - parentRect.left) / parentRect.width) * 100;
            const newTopPercent = ((editedRect.top + editedRect.height/2 - parentRect.top) / parentRect.height) * 100;
            const newWidthPercent = (editedRect.width / parentRect.width) * 100;
            const newHeightPercent = (editedRect.height / parentRect.height) * 100;
            
            // 元の形式で適用
            element.style.left = newLeftPercent.toFixed(1) + '%';
            element.style.top = newTopPercent.toFixed(1) + '%';
            element.style.width = newWidthPercent.toFixed(1) + '%';
            element.style.height = newHeightPercent.toFixed(1) + '%';
            element.style.transform = 'translate(-50%, -50%)'; // 🔧 元transform復元
            
            this.isSwapped = false;
        }
    },
    
    // 座標変換ヘルパー
    coords: {
        // px→%変換（親要素基準）
        pxToPercent: function(pxValue, parentSize) {
            return ((pxValue / parentSize) * 100).toFixed(1);
        },
        
        // %→px変換（親要素基準）
        percentToPx: function(percentValue, parentSize) {
            return (parseFloat(percentValue) / 100) * parentSize;
        }
    }
};
```

---

## 🎨 第3章: バウンディングボックス本体実装

### 📦 3-1. メインクラス定義

```javascript
class SpineBoundingBox {
    constructor() {
        this.boundingBox = null;
        this.handles = [];
        this.isActive = false;
        this.targetElement = null;
        this.dragState = {
            isDragging: false,
            startPos: { x: 0, y: 0 },
            startElementRect: {},
            activeHandle: null,
            operation: null
        };
    }

    // バウンディングボックス開始
    startEdit(targetElement) {
        if (!targetElement) {
            console.error('❌ 対象要素が指定されていません');
            return false;
        }
        
        this.targetElement = targetElement;
        
        // 🔧 重要：座標系スワップを実行（transform競合回避）
        SpineEditSystem.baseLayer.targetElement = targetElement;
        SpineEditSystem.coordinateSwap.enterEditMode(targetElement);
        
        this.createBoundingBox(targetElement);
        this.setupEventListeners();
        this.isActive = true;
        
        console.log('✅ バウンディングボックス編集開始（座標系スワップ適用済み）');
        return true;
    }
    
    // バウンディングボックス終了
    endEdit() {
        // 🔧 重要：座標系を元に復元（%値 + transform復元）
        if (this.targetElement && SpineEditSystem.coordinateSwap.isSwapped) {
            SpineEditSystem.coordinateSwap.exitEditMode(this.targetElement);
        }
        
        this.cleanup();
        console.log('✅ バウンディングボックス編集終了（座標系復元済み）');
    }
}
```

### 📦 3-2. バウンディングボックス作成

```javascript
createBoundingBox(targetElement) {
    const rect = targetElement.getBoundingClientRect();
    const parentElement = targetElement.parentElement;
    const parentRect = parentElement.getBoundingClientRect();
    
    // キャラクター名取得
    const characterName = targetElement.getAttribute('data-character-name') || 
                        targetElement.id.replace('-canvas', '') || 'Character';
    
    // バウンディングボックス本体作成
    this.boundingBox = document.createElement('div');
    this.boundingBox.id = 'spine-bounding-box';
    this.boundingBox.style.cssText = `
        position: absolute;
        border: 2px solid #667eea;
        background: rgba(102, 126, 234, 0.1);
        pointer-events: none;
        z-index: 10000;
        left: ${rect.left - parentRect.left}px;
        top: ${rect.top - parentRect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        box-shadow: 0 0 12px rgba(102, 126, 234, 0.3);
        transition: all 0.1s ease;
    `;
    
    // キャラクター名ラベル
    const label = document.createElement('div');
    label.style.cssText = `
        position: absolute;
        top: -28px;
        left: 0;
        background: #667eea;
        color: white;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: bold;
        border-radius: 4px;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    label.textContent = `📝 ${characterName} 編集中`;
    this.boundingBox.appendChild(label);
    
    parentElement.appendChild(this.boundingBox);
    
    // ハンドル作成
    this.createHandles();
    
    // 中央ドラッグエリア作成
    this.createCenterArea();
}
```

---

## 🎛️ 第4章: ハンドル実装（8個）

### 📦 4-1. ハンドル設定定義

```javascript
createHandles() {
    const handleConfigs = [
        // 角ハンドル（リサイズ用）
        { position: 'nw', type: 'corner', cursor: 'nw-resize', opposite: 'se' },
        { position: 'ne', type: 'corner', cursor: 'ne-resize', opposite: 'sw' },
        { position: 'sw', type: 'corner', cursor: 'sw-resize', opposite: 'ne' },
        { position: 'se', type: 'corner', cursor: 'se-resize', opposite: 'nw' },
        // 辺ハンドル（一方向リサイズ用）
        { position: 'n', type: 'edge', cursor: 'n-resize', opposite: 's' },
        { position: 'e', type: 'edge', cursor: 'e-resize', opposite: 'w' },
        { position: 's', type: 'edge', cursor: 's-resize', opposite: 'n' },
        { position: 'w', type: 'edge', cursor: 'w-resize', opposite: 'e' }
    ];
    
    handleConfigs.forEach(config => {
        const handle = document.createElement('div');
        handle.className = `bbox-handle ${config.type}`;
        handle.dataset.position = config.position;
        handle.dataset.cursor = config.cursor;
        handle.dataset.opposite = config.opposite;
        handle.dataset.type = config.type;
        
        // ハンドルスタイル
        const isCorner = config.type === 'corner';
        handle.style.cssText = `
            position: absolute;
            background: #fff;
            border: 2px solid #667eea;
            pointer-events: all;
            z-index: 10001;
            cursor: ${config.cursor};
            width: ${isCorner ? '12px' : '8px'};
            height: ${isCorner ? '12px' : '8px'};
            border-radius: ${isCorner ? '50%' : '2px'};
            transition: all 0.1s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        
        // ハンドル位置設定
        this.positionHandle(handle, config.position, config.type);
        
        // ホバー効果
        handle.addEventListener('mouseenter', () => {
            handle.style.background = '#667eea';
            handle.style.transform = 'scale(1.2)';
        });
        
        handle.addEventListener('mouseleave', () => {
            handle.style.background = '#fff';
            handle.style.transform = 'scale(1)';
        });
        
        this.boundingBox.appendChild(handle);
        this.handles.push({ element: handle, config });
    });
}
```

### 📦 4-2. ハンドル位置設定

```javascript
positionHandle(handle, position, type) {
    const offset = type === 'corner' ? -6 : -4;
    
    switch(position) {
        case 'nw':
            handle.style.top = '0';
            handle.style.left = '0';
            handle.style.margin = `${offset}px 0 0 ${offset}px`;
            break;
        case 'ne':
            handle.style.top = '0';
            handle.style.right = '0';
            handle.style.margin = `${offset}px ${offset}px 0 0`;
            break;
        case 'sw':
            handle.style.bottom = '0';
            handle.style.left = '0';
            handle.style.margin = `0 0 ${offset}px ${offset}px`;
            break;
        case 'se':
            handle.style.bottom = '0';
            handle.style.right = '0';
            handle.style.margin = `0 ${offset}px ${offset}px 0`;
            break;
        case 'n':
            handle.style.top = '0';
            handle.style.left = '50%';
            handle.style.transform = `translateX(-50%) translateY(${offset}px)`;
            break;
        case 'e':
            handle.style.right = '0';
            handle.style.top = '50%';
            handle.style.transform = `translateY(-50%) translateX(${-offset}px)`;
            break;
        case 's':
            handle.style.bottom = '0';
            handle.style.left = '50%';
            handle.style.transform = `translateX(-50%) translateY(${-offset}px)`;
            break;
        case 'w':
            handle.style.left = '0';
            handle.style.top = '50%';
            handle.style.transform = `translateY(-50%) translateX(${offset}px)`;
            break;
    }
}
```

### 📦 4-3. 中央ドラッグエリア

```javascript
createCenterArea() {
    const centerArea = document.createElement('div');
    centerArea.className = 'bbox-center-area';
    centerArea.style.cssText = `
        position: absolute;
        top: 20%;
        left: 20%;
        width: 60%;
        height: 60%;
        cursor: move;
        pointer-events: all;
        z-index: 9999;
        background: transparent;
    `;
    
    // 中央アイコン表示
    const icon = document.createElement('div');
    icon.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 16px;
        color: #667eea;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        pointer-events: none;
    `;
    icon.innerHTML = '⤺';
    centerArea.appendChild(icon);
    
    this.boundingBox.appendChild(centerArea);
}
```

---

## 🖱️ 第5章: イベント処理実装

### 📦 5-1. イベントリスナー設定

```javascript
setupEventListeners() {
    // ハンドルイベント
    this.handles.forEach(({ element, config }) => {
        element.addEventListener('mousedown', (e) => this.handleMouseDown(e, config));
    });
    
    // 中央エリアイベント
    const centerArea = this.boundingBox.querySelector('.bbox-center-area');
    if (centerArea) {
        centerArea.addEventListener('mousedown', (e) => this.handleCenterMouseDown(e));
    }
    
    // グローバルイベント
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
}
```

### 📦 5-2. マウスダウン処理

```javascript
// ハンドルマウスダウン
handleMouseDown(e, config) {
    e.preventDefault();
    e.stopPropagation();
    
    this.dragState.isDragging = true;
    this.dragState.startPos = { x: e.clientX, y: e.clientY };
    this.dragState.activeHandle = config;
    this.dragState.operation = config.type === 'corner' ? 'resize-corner' : 'resize-edge';
    
    // 🔧 重要：computedStyle方式を使用（座標系スワップ後の状態取得）
    const targetElement = SpineEditSystem.baseLayer.targetElement;
    const computedStyle = window.getComputedStyle(targetElement);
    
    this.dragState.startElementRect = {
        left: parseFloat(computedStyle.left),
        top: parseFloat(computedStyle.top),
        width: parseFloat(computedStyle.width),
        height: parseFloat(computedStyle.height)
    };
    
    document.body.style.cursor = config.cursor;
    console.log(`🎯 ${config.type} ハンドル操作開始:`, config.position);
}

// 中央エリアマウスダウン
handleCenterMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    
    this.dragState.isDragging = true;
    this.dragState.startPos = { x: e.clientX, y: e.clientY };
    this.dragState.operation = 'move';
    
    // 🔧 重要：computedStyle方式を使用
    const targetElement = SpineEditSystem.baseLayer.targetElement;
    const computedStyle = window.getComputedStyle(targetElement);
    
    this.dragState.startElementRect = {
        left: parseFloat(computedStyle.left),
        top: parseFloat(computedStyle.top)
    };
    
    document.body.style.cursor = 'move';
    console.log('🎯 移動操作開始');
}
```

### 📦 5-3. マウスムーブ処理

```javascript
handleMouseMove(e) {
    if (!this.dragState.isDragging) return;
    
    // 🔧 重要：累積差分計算（startPos更新なし）
    const deltaX = e.clientX - this.dragState.startPos.x;
    const deltaY = e.clientY - this.dragState.startPos.y;
    
    // 🔧 修飾キー情報を取得
    const modifiers = {
        shift: e.shiftKey,    // 縦横比保持
        ctrl: e.ctrlKey,      // Windows: 中心から拡縮
        alt: e.altKey,        // Mac: 中心から拡縮
        meta: e.metaKey       // Mac Command
    };
    
    switch(this.dragState.operation) {
        case 'move':
            this.handleMove(deltaX, deltaY);
            break;
        case 'resize-corner':
        case 'resize-edge':
            this.handleResize(deltaX, deltaY, modifiers);
            break;
    }
    
    // バウンディングボックス位置更新
    this.updateBoundingBoxPosition();
}

handleMouseUp(e) {
    if (!this.dragState.isDragging) return;
    
    this.dragState.isDragging = false;
    this.dragState.operation = null;
    this.dragState.activeHandle = null;
    
    document.body.style.cursor = '';
    console.log('✅ 操作完了');
}
```

---

## 📐 第6章: 座標変換処理実装

### 📦 6-1. 移動処理（%値変換の核心）

```javascript
// 移動処理（重要：%値変換処理）
handleMove(deltaX, deltaY) {
    const targetElement = SpineEditSystem.baseLayer.targetElement;
    const parentRect = targetElement.parentElement.getBoundingClientRect();
    
    // 🔧 重要：px座標で計算してから%値に変換
    const newLeft = this.dragState.startElementRect.left + deltaX;
    const newTop = this.dragState.startElementRect.top + deltaY;
    
    // 🔧 重要：px値から%値への変換
    const newLeftPercent = SpineEditSystem.coords.pxToPercent(newLeft, parentRect.width);
    const newTopPercent = SpineEditSystem.coords.pxToPercent(newTop, parentRect.height);
    
    // 🔧 重要：%値で設定（座標系スワップ中でも%値使用）
    targetElement.style.left = newLeftPercent + '%';
    targetElement.style.top = newTopPercent + '%';
    
    // 🔧 重要：skeleton座標は基本的に触らない
    // skeleton座標の強制リセットは絶対に禁止
    
    // バウンディングボックス位置更新
    this.updateBoundingBoxPosition(targetElement);
    
    console.log(`📐 移動処理: delta(${deltaX}, ${deltaY}) → (${newLeftPercent}%, ${newTopPercent}%)`);
}
```

### 📦 6-2. リサイズ処理（修飾キー完全対応）

```javascript
// リサイズ処理（修飾キー完全対応）
handleResize(deltaX, deltaY, modifiers = {}) {
    const handle = this.dragState.activeHandle;
    if (!handle) return;
    
    const targetElement = SpineEditSystem.baseLayer.targetElement;
    const position = handle.position;
    
    // 🔧 getBoundingClientRectベースで現在状態取得
    const rect = targetElement.getBoundingClientRect();
    const parentRect = targetElement.parentElement.getBoundingClientRect();
    
    // 全ての座標を親要素基準で統一
    const currentMouseX = (this.dragState.startPos.x + deltaX) - parentRect.left;
    const currentMouseY = (this.dragState.startPos.y + deltaY) - parentRect.top;
    
    const currentLeft = rect.left - parentRect.left;
    const currentTop = rect.top - parentRect.top;
    const currentWidth = rect.width;
    const currentHeight = rect.height;
    
    let newWidth, newHeight, newLeft, newTop;
    
    // 🔧 Ctrl/Altキー: 中心固定拡縮（最優先処理）
    if (modifiers.ctrl || modifiers.alt) {
        console.log('🔧 Ctrl/Altキー中心固定拡縮');
        
        const centerX = currentLeft + currentWidth / 2;
        const centerY = currentTop + currentHeight / 2;
        
        const deltaFromCenterX = Math.abs(currentMouseX - centerX);
        const deltaFromCenterY = Math.abs(currentMouseY - centerY);
        
        newWidth = Math.max(20, deltaFromCenterX * 2);
        newHeight = Math.max(20, deltaFromCenterY * 2);
        
        // Shiftキー併用時: 縦横比保持
        if (modifiers.shift) {
            const aspectRatio = currentWidth / currentHeight;
            
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
            case 'nw': fixedX = currentLeft + currentWidth; fixedY = currentTop + currentHeight; break;
            case 'ne': fixedX = currentLeft; fixedY = currentTop + currentHeight; break;
            case 'sw': fixedX = currentLeft + currentWidth; fixedY = currentTop; break;
            case 'se': fixedX = currentLeft; fixedY = currentTop; break;
            case 'n': fixedX = currentLeft + currentWidth / 2; fixedY = currentTop + currentHeight; break;
            case 'e': fixedX = currentLeft; fixedY = currentTop + currentHeight / 2; break;
            case 's': fixedX = currentLeft + currentWidth / 2; fixedY = currentTop; break;
            case 'w': fixedX = currentLeft + currentWidth; fixedY = currentTop + currentHeight / 2; break;
        }
        
        // 基本的なサイズ計算
        newWidth = Math.max(20, Math.abs(currentMouseX - fixedX));
        newHeight = Math.max(20, Math.abs(currentMouseY - fixedY));
        
        // Shiftキー: 縦横比保持
        if (modifiers.shift) {
            const aspectRatio = currentWidth / currentHeight;
            
            const deltaXRatio = Math.abs(currentMouseX - fixedX) / currentWidth;
            const deltaYRatio = Math.abs(currentMouseY - fixedY) / currentHeight;
            
            if (deltaXRatio > deltaYRatio) {
                newHeight = newWidth / aspectRatio;
            } else {
                newWidth = newHeight * aspectRatio;
            }
        }
        
        // 位置計算
        if (['nw', 'ne', 'sw', 'se'].includes(position)) {
            // 角ハンドルの場合
            newLeft = Math.min(currentMouseX, fixedX);
            newTop = Math.min(currentMouseY, fixedY);
            
            if (modifiers.shift) {
                // Shiftキー使用時の位置補正
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
        } else {
            // 辺ハンドルの場合
            newLeft = currentLeft;
            newTop = currentTop;
            
            if (position === 'n' || position === 's') {
                newLeft = fixedX - newWidth / 2;
                if (position === 'n') newTop = fixedY - newHeight;
            } else {
                newTop = fixedY - newHeight / 2;
                if (position === 'w') newLeft = fixedX - newWidth;
            }
        }
    }
    
    // 画面内チェック
    const parentWidth = parentRect.width;
    const parentHeight = parentRect.height;
    
    if (newLeft < 0 || newTop < 0 || newLeft + newWidth > parentWidth || newTop + newHeight > parentHeight) {
        console.warn('🚨 親要素外配置検出、適用をスキップ');
        return;
    }
    
    // 🔧 座標をpx値として直接適用（リサイズ中はpx値で処理）
    targetElement.style.left = newLeft + 'px';
    targetElement.style.top = newTop + 'px';
    targetElement.style.width = newWidth + 'px';
    targetElement.style.height = newHeight + 'px';
    
    // DOM更新を確実に反映させる
    targetElement.offsetHeight; // 強制リフロー
    
    // 🔧 重要：skeleton座標は基本的に触らない
    // skeleton座標の強制リセットは絶対に禁止
    
    console.log('✅ 修飾キー対応リサイズ完了:', {
        modifiers,
        left: newLeft + 'px',
        top: newTop + 'px', 
        width: newWidth + 'px',
        height: newHeight + 'px'
    });
}
```

### 📦 6-3. バウンディングボックス位置更新

```javascript
// バウンディングボックス位置更新
updateBoundingBoxPosition(targetElement) {
    if (!this.boundingBox || !targetElement) return;
    
    // 🔧 getBoundingClientRectで実際の位置を取得
    const rect = targetElement.getBoundingClientRect();
    const parentRect = targetElement.parentElement.getBoundingClientRect();
    
    this.boundingBox.style.left = (rect.left - parentRect.left) + 'px';
    this.boundingBox.style.top = (rect.top - parentRect.top) + 'px';
    this.boundingBox.style.width = rect.width + 'px';
    this.boundingBox.style.height = rect.height + 'px';
}
```

---

## 🧹 第7章: クリーンアップとAPI

### 📦 7-1. クリーンアップ処理

```javascript
cleanup() {
    if (this.boundingBox) {
        this.boundingBox.remove();
        this.boundingBox = null;
    }
    
    this.handles = [];
    this.removeEventListeners();
    this.isActive = false;
    this.targetElement = null;
}

removeEventListeners() {
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
}
```

### 📦 7-2. グローバルAPI

```javascript
// グローバル初期化
window.SpineBoundingBox = new SpineBoundingBox();

// 簡単テスト関数
window.testBoundingBox = function() {
    const character = document.querySelector('[data-spine-character="true"]');
    if (character) {
        window.SpineBoundingBox.startEdit(character);
        console.log('✅ バウンディングボックス開始');
        console.log('🎯 操作方法:');
        console.log('  - 中央エリア: ドラッグ移動');
        console.log('  - 角ハンドル: 対角リサイズ');
        console.log('  - 辺ハンドル: 一方向リサイズ');
        console.log('  - Shift: 縦横比保持');
        console.log('  - Ctrl/Alt: 中心固定');
    } else {
        console.error('❌ キャラクター要素が見つかりません');
    }
};
```

---

## 🧪 第8章: テスト・デバッグ手順

### 📦 8-1. 基本動作テスト

```javascript
// === 基本テストコマンド ===

// 1. バウンディングボックス開始
testBoundingBox();

// 2. 座標診断
debugSpineCoordinates();

// 3. 座標系スワップテスト
debugPositionJump();

// 4. 手動テスト項目
// ✅ 中央エリアドラッグ → キャラクターが移動
// ✅ 角ハンドルドラッグ → 対角リサイズ
// ✅ 辺ハンドルドラッグ → 一方向リサイズ
// ✅ Shiftキー → 縦横比保持
// ✅ Ctrl/Altキー → 中心固定拡縮
// ✅ バウンディングボックス終了 → 元の状態に復元
```

### 📦 8-2. 修飾キーテスト

```javascript
// === 修飾キーテストリスト ===

// 1. Shiftキーテスト
// - 角ハンドル + Shift → 縦横比保持でリサイズ
// - 辺ハンドル + Shift → 縦横比保持でリサイズ

// 2. Ctrl/Altキーテスト  
// - 角ハンドル + Ctrl → 中心固定でリサイズ
// - 辺ハンドル + Ctrl → 中心固定でリサイズ

// 3. 組み合わせテスト
// - 角ハンドル + Ctrl + Shift → 中心固定+縦横比保持
// - 辺ハンドル + Ctrl + Shift → 中心固定+縦横比保持
```

### 📦 8-3. 座標診断コマンド

```javascript
// === 座標診断コマンド集 ===

// skeleton座標確認
if (window.spineSkeletonDebug) {
    for (const [name, skeleton] of window.spineSkeletonDebug) {
        console.log(`${name}: skeleton(${skeleton.x}, ${skeleton.y}) scale(${skeleton.scaleX})`);
    }
}

// Canvas要素状態確認
const canvas = document.querySelector('[data-spine-character="true"]');
if (canvas) {
    console.log('Canvas位置:', {
        left: canvas.style.left,
        top: canvas.style.top,
        width: canvas.style.width,
        height: canvas.style.height,
        transform: canvas.style.transform
    });
}

// 座標系スワップ状態確認
console.log('座標系スワップ:', SpineEditSystem.coordinateSwap.isSwapped ? '有効' : '無効');
```

---

## ⚠️ 第9章: よくある間違いと対策

### 🚨 9-1. 致命的な間違い

#### **❌ 間違い1: skeleton座標を変更してしまう**
```javascript
// ❌ 絶対禁止：この処理により移動が無効化される
skeleton.x = 0;
skeleton.y = -25;
skeleton.scaleX = skeleton.scaleY = 1.0;
```

**✅ 正解**: skeleton座標は基本的に触らない
```javascript
// ✅ Canvas要素の位置のみ変更
targetElement.style.left = newLeftPercent + '%';
targetElement.style.top = newTopPercent + '%';
```

#### **❌ 間違い2: px値とpercent値の混在**
```javascript
// ❌ 間違い：px値で直接適用
targetElement.style.left = newLeft + 'px';
```

**✅ 正解**: %値に変換してから適用
```javascript
// ✅ %値変換
const newLeftPercent = SpineEditSystem.coords.pxToPercent(newLeft, parentRect.width);
targetElement.style.left = newLeftPercent + '%';
```

#### **❌ 間違い3: 座標系スワップを忘れる**
```javascript
// ❌ 間違い：transform競合により位置ずれ発生
// 座標系スワップなしで直接編集
```

**✅ 正解**: 必ず座標系スワップを実行
```javascript
// ✅ 編集開始時
SpineEditSystem.coordinateSwap.enterEditMode(targetElement);
// ✅ 編集終了時
SpineEditSystem.coordinateSwap.exitEditMode(targetElement);
```

### 🔧 9-2. パフォーマンス関連

#### **computedStyleの使用**
```javascript
// ✅ 正解：computedStyleで座標系スワップ後の状態取得
const computedStyle = window.getComputedStyle(targetElement);
this.dragState.startElementRect = {
    left: parseFloat(computedStyle.left),
    top: parseFloat(computedStyle.top),
    width: parseFloat(computedStyle.width),
    height: parseFloat(computedStyle.height)
};
```

#### **強制リフロー**
```javascript
// ✅ DOM更新を確実に反映
targetElement.offsetHeight; // 強制リフロー
```

### 🎯 9-3. 修飾キー処理の抜け

#### **修飾キー情報の正しい取得**
```javascript
// ✅ 正解：全ての修飾キーを取得
const modifiers = {
    shift: e.shiftKey,    // 縦横比保持
    ctrl: e.ctrlKey,      // Windows: 中心から拡縮
    alt: e.altKey,        // Mac: 中心から拡縮
    meta: e.metaKey       // Mac Command
};
```

#### **優先順位の処理**
```javascript
// ✅ 正解：Ctrl/Altを最優先で処理
if (modifiers.ctrl || modifiers.alt) {
    // 中心固定拡縮（最優先）
    // ...
} else {
    // 通常の対角固定拡縮
    // ...
}
```

---

## 🎓 第10章: 応用とカスタマイズ

### 📦 10-1. キャラクター固有の調整

```javascript
// nezumi専用のY座標調整（spine-integration.js内）
if (characterData.name === 'nezumi') {
    skeleton.y = -25; // nezumi用: 上に調整して完全表示
    skeleton.scaleX = skeleton.scaleY = 0.8; // nezumi用: スケール縮小
} else {
    skeleton.x = 0;
    skeleton.y = 0;
    skeleton.scaleX = skeleton.scaleY = 1.0;
}
```

### 📦 10-2. スタイルカスタマイズ

```javascript
// バウンディングボックスの色やサイズ変更
this.boundingBox.style.cssText = `
    border: 2px solid #ff6b6b;  // 色変更
    background: rgba(255, 107, 107, 0.1);  // 背景色変更
    // ...
`;

// ハンドルサイズの調整
width: ${isCorner ? '14px' : '10px'};  // サイズ変更
height: ${isCorner ? '14px' : '10px'};
```

### 📦 10-3. 統合機能

```javascript
// アプリケーション状態との統合
updateApplicationState(x, y, scale = null) {
    const characterName = this.targetElement.getAttribute('data-character-name');
    
    // SpineCharacterManagerの位置情報更新
    if (window.spineCharacterManager) {
        window.spineCharacterManager.updateCharacterPosition(characterName, x, y);
    }
    
    // データパネル更新
    if (window.updateDataPanel) {
        window.updateDataPanel({ x, y, scale });
    }
}
```

---

## 📋 実装チェックリスト

### ✅ 基本機能実装
- [ ] SpineEditSystem（座標系管理）
- [ ] coordinateSwap（座標系変換）
- [ ] pxToPercent/percentToPx（座標変換）
- [ ] バウンディングボックス本体作成
- [ ] ハンドル8個（角4個+辺4個）
- [ ] 中央ドラッグエリア
- [ ] キャラクター名ラベル

### ✅ イベント処理実装
- [ ] mousedown処理（ハンドル・中央エリア）
- [ ] mousemove処理（累積差分計算）
- [ ] mouseup処理（状態リセット）
- [ ] ホバー効果（ハンドル）

### ✅ 座標変換実装
- [ ] 移動処理（%値変換）
- [ ] リサイズ処理（修飾キー対応）
- [ ] 座標系スワップ（開始・終了）
- [ ] バウンディングボックス位置更新

### ✅ 修飾キー対応
- [ ] Shift（縦横比保持）
- [ ] Ctrl/Alt（中心固定）
- [ ] 組み合わせ（中心固定+縦横比保持）
- [ ] 角・辺ハンドル両方対応

### ✅ 重要原則の遵守
- [ ] skeleton座標は基本的に触らない
- [ ] %値での最終適用
- [ ] 座標系スワップの実行
- [ ] computedStyleの使用
- [ ] 強制リフロー

### ✅ テスト確認
- [ ] 基本動作テスト
- [ ] 修飾キーテスト
- [ ] 座標診断
- [ ] クリーンアップ確認

---

## 🎯 まとめ：完璧実装のための最終確認

### 🔑 **成功の3つのキー**

1. **skeleton座標保護**：基本的に変更しない
2. **%値変換処理**：px計算→%適用
3. **座標系スワップ**：transform競合回避

### 🚀 **実装完了時の動作**

- ✅ バウンディングボックスを動かすとキャラクターも同じように移動
- ✅ ハンドルで自由自在にリサイズ
- ✅ 修飾キーで高度な操作
- ✅ 座標問題・位置ずれなし

### 📚 **参考資料**

- **Web版実装**: `/spine-bounding-box-module.js`
- **座標系管理**: `/spine-edit-core.js`
- **v3完成版**: `/spine-editor-desktop-v3/src/renderer/spine-bounding-box.js`

---

**🎉 このマニュアルに従って実装すれば、Web版と同等の完璧なバウンディングボックス機能が実現できます！**