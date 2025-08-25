# マイクロモジュール設計テンプレート

## 🎯 AIへの指示テンプレート（コピペ用）

### **基本指示フォーマット**
```
マイクロモジュールを作成してください。

## 必須要件（チェックリスト）
- [ ] 外部依存: ゼロ（window, global, 他モジュール禁止）
- [ ] 単一責務: [具体的に1つだけ記述]
- [ ] 入力: [型と例を明記]
- [ ] 出力: [型と例を明記]
- [ ] 副作用: [あり/なし、詳細]
- [ ] cleanup(): 必ず元の状態に戻すメソッド
- [ ] テスト可能: 単独で動作確認可能

## 禁止事項
- SpineEditSystem参照禁止
- localStorage直接アクセス禁止
- 他のグローバル変数参照禁止
- DOM操作は最小限（指定要素のみ）
```

### **データ受け渡し仕様**
```javascript
// マイクロモジュール間のデータ形式（統一）
const CoordinateData = {
    x: number,      // px単位
    y: number,      // px単位  
    width: number,  // px単位
    height: number  // px単位
};
```

## 🚀 具体例：BoundingBoxマイクロモジュール

### モジュール仕様書
```
## モジュール名: PureBoundingBox

### 単一責務
- やること: DOM要素にバウンディングボックス表示・ドラッグ操作
- やらないこと: 座標変換、保存、他要素との連携

### 入力/出力仕様
- 入力: HTMLElement (canvas等)
- 出力: {x, y, width, height} (number型)
- 副作用: 一時的なDOM要素追加（cleanup()で完全削除）

### 依存関係
- 外部依存: なし
- DOM依存: 指定された要素とその親のみ
- グローバル変数: なし

### テスト条件
- 作成テスト: new PureBoundingBox(element)でエラーなし
- 動作テスト: ドラッグでgetCoordinates()の値が変化
- 清掃テスト: cleanup()後、DOM変更がゼロ
```

### 実装コード
```javascript
class PureBoundingBox {
    constructor(targetElement) {
        // 入力検証
        if (!targetElement || !targetElement.parentElement) {
            throw new Error('有効なDOM要素が必要です');
        }
        
        this.target = targetElement;
        this.parent = targetElement.parentElement;
        this.boundingBox = null;
        this.handles = [];
        
        // 初期状態のバックアップ
        this.originalState = this.backupOriginalState();
        
        // 初期化
        this.createBoundingBox();
        this.setupEventListeners();
    }
    
    // 完全独立：他モジュール参照なし
    backupOriginalState() {
        const rect = this.target.getBoundingClientRect();
        const parentRect = this.parent.getBoundingClientRect();
        
        return {
            left: rect.left - parentRect.left,
            top: rect.top - parentRect.top,
            width: rect.width,
            height: rect.height
        };
    }
    
    // シンプルな出力：座標数値のみ
    getCoordinates() {
        const rect = this.target.getBoundingClientRect();
        const parentRect = this.parent.getBoundingClientRect();
        
        return {
            x: rect.left - parentRect.left,
            y: rect.top - parentRect.top,
            width: rect.width,
            height: rect.height
        };
    }
    
    // 確実な清掃：元の状態に完全復元
    cleanup() {
        // バウンディングボックス削除
        if (this.boundingBox) {
            this.boundingBox.remove();
            this.boundingBox = null;
        }
        
        // イベントリスナー削除
        this.removeEventListeners();
        
        // 元の位置に復元
        this.target.style.left = this.originalState.left + 'px';
        this.target.style.top = this.originalState.top + 'px';
        this.target.style.width = this.originalState.width + 'px';
        this.target.style.height = this.originalState.height + 'px';
        
        this.handles = [];
    }
    
    // 以下、内部実装...
}
```

## 🤖 AIとの協働プロセス

### **1. 新しいセッションでの指示方法**
```
以下のテンプレートに従ってマイクロモジュールを作成してください：

【テンプレート貼り付け】

必ず cleanup() メソッドで元の状態に戻すこと。
外部依存は一切なし。
単独でnew Module(element)で動作すること。
```

### **2. チェックリスト自動確認**
```javascript
// AIに必ずこのテストコードを含めるよう指示
function testMicroModule() {
    const element = document.createElement('div');
    document.body.appendChild(element);
    
    // 作成テスト
    const module = new PureBoundingBox(element);
    console.assert(module.getCoordinates, 'getCoordinatesメソッドが存在すること');
    
    // 清掃テスト
    const initialHTML = document.body.innerHTML;
    module.cleanup();
    const afterHTML = document.body.innerHTML;
    console.assert(initialHTML === afterHTML, '完全に元に戻ること');
    
    document.body.removeChild(element);
    console.log('✅ マイクロモジュールテスト完了');
}
```

## 🎯 このアプローチのメリット

1. **記憶喪失AI対策**: テンプレートで毎回同じ品質
2. **デバッグ簡単**: 1モジュール1責務で問題箇所特定容易
3. **再利用可能**: 他プロジェクトでも使える
4. **テスト可能**: 単独で動作確認できる

**この方法で進めてみましょうか？**