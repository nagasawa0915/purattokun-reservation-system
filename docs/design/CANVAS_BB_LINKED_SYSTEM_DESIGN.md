# Canvas+BB連動システム設計書

**作成日**: 2025-09-02  
**目的**: 複数Canvas戦略におけるCanvas+BBの完全連動システム  
**コンセプト**: 必要最小限サイズのCanvas+BBペアを自由配置  

---

## 🎯 設計思想

### 核心アイデア
**「キャラクターにピッタリサイズのCanvas+BBペア」を自由配置**

```javascript
// 理想的な使用例
const compactCanvas = createOptimalSpineCanvas({
    character: 'purattokun',
    trimming: 'tight',        // キャラクター境界に合わせてトリミング
    padding: 10,              // 10pxの余白
    position: { x: 100, y: 200 },
    linkedMovement: true      // BBと連動移動
});

// 結果: 800x600 → 220x180の最適サイズ
```

---

## 🔧 技術実装仕様

### 1️⃣ **最適Canvasサイズ算出機能**

#### 🎯 キャラクター境界検出
```javascript
class SpineCanvasOptimizer {
    /**
     * Spineキャラクターの実際の境界を検出
     */
    detectCharacterBounds(spineRenderer) {
        const skeleton = spineRenderer.skeleton;
        
        // Spineボーンの境界計算
        skeleton.updateWorldTransform();
        const bounds = skeleton.getBounds();
        
        return {
            minX: bounds.x,
            minY: bounds.y,
            width: bounds.width,
            height: bounds.height,
            // 実際のキャラクター描画領域
            actualWidth: Math.ceil(bounds.width) + (this.config.padding || 10),
            actualHeight: Math.ceil(bounds.height) + (this.config.padding || 10)
        };
    }
    
    /**
     * 最適Canvasサイズ計算
     */
    calculateOptimalCanvasSize(characterBounds, options = {}) {
        return {
            width: Math.max(characterBounds.actualWidth, options.minWidth || 100),
            height: Math.max(characterBounds.actualHeight, options.minHeight || 100),
            // キャラクター位置調整（中央配置等）
            offsetX: options.centerX ? (characterBounds.actualWidth - characterBounds.width) / 2 : 0,
            offsetY: options.centerY ? (characterBounds.actualHeight - characterBounds.height) / 2 : 0
        };
    }
}
```

### 2️⃣ **Canvas+BB連動移動システム**

#### 🎮 連動移動の実装
```javascript
class LinkedCanvasBBSystem {
    constructor(canvas, boundingBox) {
        this.canvas = canvas;
        this.boundingBox = boundingBox;
        this.linkedMovement = true;
        
        // BBドラッグイベントを拡張
        this.extendBBEvents();
    }
    
    /**
     * BB移動時にCanvasも同じ距離移動
     */
    extendBBEvents() {
        const originalOnPointerMove = this.boundingBox.events.onPointerMove;
        
        this.boundingBox.events.onPointerMove = (event) => {
            // 元のBB移動処理
            const result = originalOnPointerMove.call(this.boundingBox.events, event);
            
            if (this.linkedMovement && this.boundingBox.events.isDragging) {
                // BBの移動量を取得
                const deltaX = event.clientX - this.boundingBox.events.lastPointer.x;
                const deltaY = event.clientY - this.boundingBox.events.lastPointer.y;
                
                // Canvasも同じ距離移動
                this.moveCanvas(deltaX, deltaY);
            }
            
            return result;
        };
    }
    
    /**
     * Canvas位置更新
     */
    moveCanvas(deltaX, deltaY) {
        const currentLeft = parseInt(this.canvas.style.left || 0);
        const currentTop = parseInt(this.canvas.style.top || 0);
        
        this.canvas.style.left = (currentLeft + deltaX) + 'px';
        this.canvas.style.top = (currentTop + deltaY) + 'px';
        
        console.log(`Canvas moved: (${currentLeft + deltaX}, ${currentTop + deltaY})`);
    }
    
    /**
     * Canvas+BB初期位置同期
     */
    syncInitialPosition() {
        const canvasRect = this.canvas.getBoundingClientRect();
        const bbElement = this.boundingBox.ui.element;
        
        // BBをCanvas位置に配置
        bbElement.style.left = canvasRect.left + 'px';
        bbElement.style.top = canvasRect.top + 'px';
    }
}
```

### 3️⃣ **統合Canvas作成システム**

#### 🏗️ ワンストップ作成機能
```javascript
class OptimalSpineCanvasFactory {
    /**
     * 最適サイズCanvas+BB+Spineを一括作成
     */
    async createOptimalSpineSystem(config) {
        const {
            character,          // 'purattokun' | 'nezumi'
            position,           // { x: 100, y: 200 }
            trimming = 'loose', // 'tight' | 'loose' | 'custom'
            padding = 10,       // 余白サイズ
            linkedMovement = true
        } = config;
        
        // 1. Spine一時読み込み（サイズ計算用）
        const tempRenderer = await this.createTempSpineRenderer(character);
        
        // 2. キャラクター境界検出
        const bounds = this.optimizer.detectCharacterBounds(tempRenderer);
        
        // 3. 最適Canvasサイズ計算
        const optimalSize = this.optimizer.calculateOptimalCanvasSize(bounds, {
            padding,
            minWidth: 100,
            minHeight: 100
        });
        
        // 4. 最適サイズCanvas作成
        const canvas = this.createCanvas({
            width: optimalSize.width,
            height: optimalSize.height,
            position: position
        });
        
        // 5. StableSpineRenderer初期化
        const spineRenderer = new StableSpineRenderer({
            canvas: canvas,
            character: character,
            basePath: '/assets/spine/characters/',
            debug: true
        });
        
        await spineRenderer.initialize();
        
        // 6. 最適サイズBB作成
        const boundingBox = new PureBoundingBox({
            targetElement: canvas,
            nodeId: `${character}-bb-${Date.now()}`
        });
        
        await boundingBox.execute({ visible: true });
        
        // 7. 連動システム初期化
        const linkedSystem = new LinkedCanvasBBSystem(canvas, boundingBox);
        linkedSystem.syncInitialPosition();
        
        // 8. 統合オブジェクトを返却
        return {
            canvas,
            spineRenderer,
            boundingBox,
            linkedSystem,
            optimalSize,
            bounds,
            
            // 便利メソッド
            move: (x, y) => linkedSystem.moveCanvasAndBB(x, y),
            resize: (newSize) => linkedSystem.resizeCanvasAndBB(newSize),
            destroy: () => linkedSystem.cleanup()
        };
    }
}
```

---

## 🎮 実際の使用例

### ケース1: **複数キャラクター最適配置**
```javascript
// ページ読み込み時に最適サイズで配置
const factory = new OptimalSpineCanvasFactory();

// ヒーロー部分（大きめ）
const heroChar = await factory.createOptimalSpineSystem({
    character: 'purattokun',
    position: { x: 200, y: 100 },
    trimming: 'loose',    // 少し余裕を持って
    padding: 20,
    linkedMovement: true
});

// サイドバー（コンパクト）
const sideChar = await factory.createOptimalSpineSystem({
    character: 'nezumi', 
    position: { x: 50, y: 300 },
    trimming: 'tight',    // ギリギリサイズ
    padding: 5,
    linkedMovement: true
});

// フッター（横長）
const footerChar = await factory.createOptimalSpineSystem({
    character: 'purattokun',
    position: { x: 400, y: 500 },
    trimming: 'custom',
    customSize: { width: 300, height: 100 }, // 横長強制
    linkedMovement: true
});

console.log('全キャラクター配置完了');
console.log(`Hero Canvas: ${heroChar.optimalSize.width}x${heroChar.optimalSize.height}`);
console.log(`Side Canvas: ${sideChar.optimalSize.width}x${sideChar.optimalSize.height}`);
```

### ケース2: **動的追加・移動**
```javascript
// D&Dでキャラクター追加
document.addEventListener('drop', async (event) => {
    const characterType = event.dataTransfer.getData('character');
    const dropPosition = { x: event.clientX, y: event.clientY };
    
    // その場に最適サイズで作成
    const newCharacter = await factory.createOptimalSpineSystem({
        character: characterType,
        position: dropPosition,
        trimming: 'tight',
        linkedMovement: true
    });
    
    // 作成したキャラクターをリストに追加
    characterManager.add(newCharacter);
});

// BBドラッグで自由移動（Canvas連動）
// → 自動で実装済み（linkedMovement: true）
```

---

## 💡 **期待される効果**

### ✅ **パフォーマンス最適化**
- **メモリ使用量**: キャラクター実際サイズのみ
- **GPU負荷**: 必要最小限の描画領域
- **レスポンス**: 軽量Canvasで高速動作

### ✅ **配置の自由度**
- **完全自由配置**: ページ内任意の位置
- **サイズ最適化**: 無駄な空白なし
- **連動移動**: Canvas+BB完全同期

### ✅ **開発・保守性**
- **自動最適化**: 手動サイズ調整不要
- **統一インターフェース**: 同じ方法で全キャラクター管理
- **デバッグ容易**: 各キャラクターが独立

---

## 📊 実装優先度

### 🚀 **Phase 1: 基本機能（高優先度）**
- [ ] SpineCanvasOptimizer実装
- [ ] LinkedCanvasBBSystem実装  
- [ ] 基本テストページ作成

### ⚡ **Phase 2: 統合システム（中優先度）**
- [ ] OptimalSpineCanvasFactory実装
- [ ] 複数キャラクター管理
- [ ] D&D対応

### 🌟 **Phase 3: 高度機能（低優先度）**
- [ ] アニメーション最適化
- [ ] レスポンシブ対応
- [ ] パフォーマンス監視

---

## 🎯 結論

**Option B は技術的に完全実装可能で、最も実用的なソリューションです！**

### 主要な利点：
1. **✅ 実現可能**: 既存技術の組み合わせで実装
2. **✅ 高性能**: 必要最小限リソース使用
3. **✅ 自由度**: 完全な配置・移動の自由
4. **✅ 保守性**: モジュラー設計で拡張容易

**実装テストを開始しませんか？**