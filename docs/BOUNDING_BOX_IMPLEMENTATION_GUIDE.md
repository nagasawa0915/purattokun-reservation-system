# 🎯 バウンディングボックス編集システム実装ガイド

## 📋 このドキュメントについて

**目的**: 他のプロジェクトで同様のバウンディングボックス編集システムを実装するための完全ガイド  
**基準**: spine-positioning-system-explanation.js v3.0の完成実装  
**対象**: 開発者・Claude Code・他システムへの移植

---

## 🚀 実装の核心：座標系スワップ技術

### 基本アーキテクチャ

```javascript
const EditSystem = {
    // 座標系スワップ機能（競合回避の核心）
    coordinateSwap: {
        backup: { left: null, top: null, width: null, height: null, transform: null },
        isSwapped: false,
        
        // 編集開始: 複雑座標 → シンプル座標
        enterEditMode: function(element) {
            // 1. 元の座標系をバックアップ
            this.backup = {
                left: element.style.left,
                top: element.style.top,
                width: element.style.width,
                height: element.style.height,
                transform: element.style.transform
            };
            
            // 2. 実際の描画位置を取得
            const rect = element.getBoundingClientRect();
            
            // 3. シンプル絶対座標に変換
            element.style.left = rect.left + 'px';
            element.style.top = rect.top + 'px';
            element.style.width = rect.width + 'px';
            element.style.height = rect.height + 'px';
            element.style.transform = 'none'; // 重要：transform競合を排除
            
            this.isSwapped = true;
        },
        
        // 編集終了: シンプル座標 → 元座標系
        exitEditMode: function(element) {
            if (!this.isSwapped) return;
            
            // シンプル座標での編集結果を元の形式に変換
            const editedRect = element.getBoundingClientRect();
            const parentRect = element.parentElement.getBoundingClientRect();
            
            // %値 + transform形式に変換
            const newLeftPercent = ((editedRect.left + editedRect.width/2 - parentRect.left) / parentRect.width) * 100;
            const newTopPercent = ((editedRect.top + editedRect.height/2 - parentRect.top) / parentRect.height) * 100;
            const newWidthPercent = (editedRect.width / parentRect.width) * 100;
            const newHeightPercent = (editedRect.height / parentRect.height) * 100;
            
            // 元の形式で適用
            element.style.left = newLeftPercent.toFixed(1) + '%';
            element.style.top = newTopPercent.toFixed(1) + '%';
            element.style.width = newWidthPercent.toFixed(1) + '%';
            element.style.height = newHeightPercent.toFixed(1) + '%';
            element.style.transform = 'translate(-50%, -50%)';
            
            this.isSwapped = false;
        }
    }
};
```

---

## 🎯 バウンディングボックス実装の完全手順

### Step 1: 基本構造の作成

```javascript
const BoundingBoxModule = {
    isActive: false,
    dragState: {
        isDragging: false,
        operation: null, // 'corner-resize', 'edge-resize', 'move'
        activeHandle: null,
        startPos: { x: 0, y: 0 },
        startElementRect: null
    },
    
    // 初期化
    initialize: function(targetElement) {
        // 🚨 重要: 座標系スワップ確認
        if (!EditSystem.coordinateSwap.isSwapped) {
            EditSystem.coordinateSwap.enterEditMode(targetElement);
        }
        
        this.createBoundingBox(targetElement);
        this.setupEventListeners();
        this.isActive = true;
    }
};
```

### Step 2: バウンディングボックスUI作成

```javascript
createBoundingBox: function(targetElement) {
    const rect = targetElement.getBoundingClientRect();
    const parentRect = targetElement.parentElement.getBoundingClientRect();
    
    // バウンディングボックスコンテナ
    const boundingBox = document.createElement('div');
    boundingBox.id = 'bounding-box';
    boundingBox.style.cssText = `
        position: absolute;
        left: ${rect.left - parentRect.left}px;
        top: ${rect.top - parentRect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 2px solid #007acc;
        pointer-events: none;
        z-index: 9999;
    `;
    
    // 角ハンドル作成（4つ）
    const handleConfigs = [
        { position: 'nw', cursor: 'nw-resize' },
        { position: 'ne', cursor: 'ne-resize' },
        { position: 'sw', cursor: 'sw-resize' },
        { position: 'se', cursor: 'se-resize' }
    ];
    
    handleConfigs.forEach(config => {
        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        handle.dataset.position = config.position;
        handle.style.cssText = `
            position: absolute;
            width: 12px;
            height: 12px;
            background: #007acc;
            border: 2px solid white;
            border-radius: 50%;
            cursor: ${config.cursor};
            pointer-events: all;
        `;
        
        this.positionHandle(handle, config.position);
        boundingBox.appendChild(handle);
    });
    
    targetElement.parentElement.appendChild(boundingBox);
    this.boundingBox = boundingBox;
}
```

### Step 3: ハンドル位置設定

```javascript
positionHandle: function(handle, position) {
    switch(position) {
        case 'nw':
            handle.style.top = '0';
            handle.style.left = '0';
            handle.style.transform = 'translate(-50%, -50%)';
            break;
        case 'ne':
            handle.style.top = '0';
            handle.style.right = '0';
            handle.style.transform = 'translate(50%, -50%)';
            break;
        case 'sw':
            handle.style.bottom = '0';
            handle.style.left = '0';
            handle.style.transform = 'translate(-50%, 50%)';
            break;
        case 'se':
            handle.style.bottom = '0';
            handle.style.right = '0';
            handle.style.transform = 'translate(50%, 50%)';
            break;
    }
}
```

---

## 🔧 修飾キー対応リサイズロジック

### 完全実装版 performCornerResize

```javascript
performCornerResize: function(deltaX, deltaY, modifiers) {
    const targetElement = this.targetElement;
    const handle = this.dragState.activeHandle;
    const position = handle.dataset.position;
    
    // 🔧 座標系統一: 全てgetBoundingClientRectベースで統一
    const rect = targetElement.getBoundingClientRect();
    const parentRect = targetElement.parentElement.getBoundingClientRect();
    
    // 親要素基準の座標
    const currentMouseX = (this.dragState.startPos.x + deltaX) - parentRect.left;
    const currentMouseY = (this.dragState.startPos.y + deltaY) - parentRect.top;
    
    // 現在の要素位置（親要素基準）
    const currentLeft = rect.left - parentRect.left;
    const currentTop = rect.top - parentRect.top;
    const currentWidth = rect.width;
    const currentHeight = rect.height;
    
    let newWidth, newHeight, newLeft, newTop;
    
    // 🔧 Ctrl/Altキー: 中心固定拡縮（優先処理）
    if (modifiers.ctrl || modifiers.alt) {
        const centerX = currentLeft + currentWidth / 2;
        const centerY = currentTop + currentHeight / 2;
        
        // 中心からマウス位置までの距離を2倍
        const deltaFromCenterX = Math.abs(currentMouseX - centerX);
        const deltaFromCenterY = Math.abs(currentMouseY - centerY);
        
        newWidth = Math.max(20, deltaFromCenterX * 2);
        newHeight = Math.max(20, deltaFromCenterY * 2);
        
        // Shift併用: 縦横比保持
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
        
        // 対角固定点
        let fixedX, fixedY;
        switch(position) {
            case 'nw': fixedX = currentLeft + currentWidth; fixedY = currentTop + currentHeight; break;
            case 'ne': fixedX = currentLeft; fixedY = currentTop + currentHeight; break;
            case 'sw': fixedX = currentLeft + currentWidth; fixedY = currentTop; break;
            case 'se': fixedX = currentLeft; fixedY = currentTop; break;
        }
        
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
        
        // 対角固定での位置計算
        newLeft = Math.min(currentMouseX, fixedX);
        newTop = Math.min(currentMouseY, fixedY);
        
        // Shift使用時の位置補正
        if (modifiers.shift) {
            switch(position) {
                case 'nw': newLeft = fixedX - newWidth; newTop = fixedY - newHeight; break;
                case 'ne': newLeft = fixedX; newTop = fixedY - newHeight; break;
                case 'sw': newLeft = fixedX - newWidth; newTop = fixedY; break;
                case 'se': newLeft = fixedX; newTop = fixedY; break;
            }
        }
    }
    
    // 画面内チェック
    if (newLeft < 0 || newTop < 0 || 
        newLeft + newWidth > parentRect.width || 
        newTop + newHeight > parentRect.height) {
        return; // 画面外の場合は適用しない
    }
    
    // スタイル適用
    targetElement.style.left = newLeft + 'px';
    targetElement.style.top = newTop + 'px';
    targetElement.style.width = newWidth + 'px';
    targetElement.style.height = newHeight + 'px';
    
    // DOM更新を確実に反映
    targetElement.offsetHeight;
    
    // バウンディングボックス位置更新
    this.updateBoundingBoxPosition(targetElement);
}
```

---

## 🎯 イベント処理と競合回避

### マウスイベント設定

```javascript
setupEventListeners: function() {
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
},

handleMouseDown: function(event) {
    if (!this.isActive) return;
    
    const handle = event.target.closest('.resize-handle');
    if (handle) {
        event.preventDefault();
        
        this.dragState.isDragging = true;
        this.dragState.operation = 'corner-resize';
        this.dragState.activeHandle = handle;
        
        // 🚨 重要: マウス座標を親要素基準で記録
        const parentRect = this.targetElement.parentElement.getBoundingClientRect();
        this.dragState.startPos = {
            x: event.clientX,
            y: event.clientY
        };
        
        // 現在の要素状態を記録
        const rect = this.targetElement.getBoundingClientRect();
        this.dragState.startElementRect = {
            left: rect.left - parentRect.left,
            top: rect.top - parentRect.top,
            width: rect.width,
            height: rect.height
        };
    }
}
```

### 修飾キー検出

```javascript
getModifierKeys: function(event) {
    return {
        shift: event.shiftKey,
        ctrl: event.ctrlKey,
        alt: event.altKey,
        meta: event.metaKey
    };
}
```

---

## 🚨 競合回避システム

### 基本移動との排他制御

```javascript
// 基本移動処理に追加する排他制御
function handleMouseMove(event) {
    if (!isEditMode) return;
    
    // 🔧 バウンディングボックス操作中は基本移動を停止
    if (EditSystem.modules.has('boundingBox')) {
        const boundingBoxModule = EditSystem.modules.get('boundingBox');
        if (boundingBoxModule.dragState && boundingBoxModule.dragState.isDragging) {
            return; // バウンディングボックス処理を優先
        }
    }
    
    // 基本移動処理を継続...
}

function handleMouseDown(event) {
    if (!isEditMode) return;
    
    // 🔧 バウンディングボックス表示中は基本ドラッグを無効化
    if (EditSystem.modules.has('boundingBox')) {
        return;
    }
    
    // 基本ドラッグ処理を継続...
}
```

---

## 📋 実装チェックリスト

### 必須実装項目

- [ ] **座標系スワップ機能**: `coordinateSwap.enterEditMode/exitEditMode`
- [ ] **バウンディングボックスUI**: 4角ハンドル + 境界線
- [ ] **修飾キー対応**: Shift（縦横比）、Ctrl（中心固定）、併用
- [ ] **座標系統一**: 全計算を親要素基準で統一
- [ ] **競合回避**: 基本移動との排他制御
- [ ] **画面内制限**: 親要素境界での制限
- [ ] **緊急復元**: `emergencyRestore()`機能

### テスト項目

- [ ] **通常リサイズ**: 各角ハンドルでの対角固定動作
- [ ] **Shiftキー**: 縦横比保持（位置移動なし）
- [ ] **Ctrlキー**: 中心固定拡縮
- [ ] **Ctrl+Shift**: 中心固定 + 縦横比保持
- [ ] **画面外防止**: 親要素外への移動防止
- [ ] **座標保存**: 編集終了時の正確な座標変換

### トラブルシューティング

**問題**: ハンドルクリック時に要素が飛ぶ
**解決**: マウス座標と要素座標の座標系統一を確認

**問題**: 修飾キーが効かない
**解決**: `getModifierKeys(event)`の検出とリサイズロジックでの使用を確認

**問題**: 基本移動と競合する
**解決**: 排他制御の実装を確認

---

## 🔗 参考実装

**完全実装**: `/mnt/d/クラウドパートナーHP/spine-positioning-system-explanation.js`  
**仕様書**: `/mnt/d/クラウドパートナーHP/docs/POSITIONING_SYSTEM_SPECIFICATIONS.md`  

この実装ガイドに従うことで、他のプロジェクトでも同様の高品質なバウンディングボックス編集システムを実現できます。