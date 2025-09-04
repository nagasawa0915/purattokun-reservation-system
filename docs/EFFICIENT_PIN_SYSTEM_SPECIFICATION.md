# 効率的ピンシステム仕様書 v2.0

## 📋 設計方針

### 🎯 基本コンセプト
- **ユーザー指定ベース**: 選択された要素・位置のみ計算（無駄排除）
- **責務分離アーキテクチャ**: 検出・計算・表示の完全分離
- **数値純化**: 複雑な処理を隠蔽し、シンプルな座標値のみ受け渡し
- **要素タイプ最適化**: テキスト・画像・その他で最適な計算方法を使用

### 🚫 従来システムの課題
- 全要素に対して9個×複数要素＝27個以上の無駄な計算
- Observer・計算・表示が密結合で不安定
- 複雑なコンテンツ矩形計算によるバグ多発
- デバッグ困難・テスト不可能

---

## 🏗️ システムアーキテクチャ

### 📊 3層分離設計

```
[変化検出層] Observer
      ↓ "変化通知"
[計算処理層] ElementCalculator
      ↓ "座標数値"
[表示制御層] PinRenderer
```

### 🔄 処理フロー

```
1. ユーザー操作 → 要素選択 + ピン位置指定
2. Observer → 要素変化を検出・通知
3. ElementCalculator → 指定要素の指定位置のみ計算
4. PinRenderer → 数値を受け取って表示
```

---

## 📐 ElementCalculator（計算処理層）

### 🎯 入力インターフェース

```typescript
interface CalculationRequest {
  element: HTMLElement;           // 選択された要素
  anchorPoints: AnchorPoint[];    // 指定されたピン位置
  elementType: ElementType;       // 要素タイプ
}

interface AnchorPoint {
  id: 'TL' | 'TC' | 'TR' | 'ML' | 'MC' | 'MR' | 'BL' | 'BC' | 'BR';
  ratioX: number;  // 0.0-1.0
  ratioY: number;  // 0.0-1.0
}

type ElementType = 'text' | 'image' | 'background' | 'container';
```

### 📤 出力インターフェース

```typescript
interface CalculationResult {
  elementId: string;
  pins: PinCoordinate[];
  metadata: CalculationMetadata;
}

interface PinCoordinate {
  anchorId: string;
  x: number;      // 絶対座標X
  y: number;      // 絶対座標Y
  isValid: boolean;
}

interface CalculationMetadata {
  elementType: ElementType;
  contentArea: ContentArea;
  timestamp: number;
}

interface ContentArea {
  x: number;       // コンテンツ領域の左上X
  y: number;       // コンテンツ領域の左上Y  
  width: number;   // コンテンツ領域の幅
  height: number;  // コンテンツ領域の高さ
}
```

---

## 🎨 要素タイプ別計算仕様

### 1️⃣ テキスト要素（シンプル）

```javascript
// 入力例
element: <h1>タイトル</h1>
anchorPoints: [{ id: 'BR', ratioX: 1.0, ratioY: 1.0 }]

// 計算処理
const rect = element.getBoundingClientRect();
const contentArea = {
  x: 0,
  y: 0, 
  width: rect.width,
  height: rect.height
};

// 出力例
{
  elementId: 'title-element',
  pins: [{ anchorId: 'BR', x: 250, y: 60, isValid: true }],
  metadata: {
    elementType: 'text',
    contentArea: { x: 0, y: 0, width: 250, height: 60 }
  }
}
```

### 2️⃣ 背景画像要素（複雑）

```javascript
// 入力例  
element: <div class="background-image">
anchorPoints: [
  { id: 'TL', ratioX: 0.0, ratioY: 0.0 },
  { id: 'MC', ratioX: 0.5, ratioY: 0.5 },
  { id: 'BR', ratioX: 1.0, ratioY: 1.0 }
]

// 計算処理（cover計算）
const parentRect = element.getBoundingClientRect();
const naturalSize = await getNaturalImageSize(backgroundImageUrl);
const contentArea = calculateCoverArea(naturalSize, parentRect);

// 出力例
{
  elementId: 'background-element',
  pins: [
    { anchorId: 'TL', x: 0, y: -180, isValid: true },
    { anchorId: 'MC', x: 600, y: 360, isValid: true },  
    { anchorId: 'BR', x: 1200, y: 900, isValid: false } // 画面外
  ],
  metadata: {
    elementType: 'background',
    contentArea: { x: 0, y: -180, width: 1200, height: 1080 }
  }
}
```

### 3️⃣ IMG要素（中程度複雑）

```javascript
// 計算処理（object-fit対応）
const img = element as HTMLImageElement;
const objectFit = getComputedStyle(img).objectFit;
const contentArea = calculateObjectFitArea(
  { width: img.naturalWidth, height: img.naturalHeight },
  img.getBoundingClientRect(),
  objectFit
);
```

---

## 🔍 Observer（変化検出層）

### 🎯 責務
- **要素サイズ変更の検出のみ**
- 計算処理は一切行わない
- 変化通知のみ送信

### 📡 通知インターフェース

```typescript
interface ChangeNotification {
  type: 'resize' | 'reposition' | 'style';
  elementId: string;
  timestamp: number;
  previousSize?: { width: number; height: number };
  currentSize: { width: number; height: number };
}
```

### 🔧 実装例

```javascript
class EfficientObserver {
  constructor(calculator, renderer) {
    this.calculator = calculator;
    this.renderer = renderer;
    this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
  }
  
  // 📍 シンプルな通知のみ
  handleResize(entries) {
    for (const entry of entries) {
      const notification = {
        type: 'resize',
        elementId: entry.target.id,
        currentSize: entry.contentRect
      };
      
      this.notifyChange(notification);
    }
  }
  
  notifyChange(notification) {
    // ElementCalculatorに計算を依頼
    this.calculator.recalculate(notification);
  }
}
```

---

## 🖼️ PinRenderer（表示制御層）

### 🎯 責務
- 座標数値を受け取って表示のみ
- DOM操作の最適化
- アニメーション・視覚効果

### 📥 入力インターフェース

```typescript
interface RenderRequest {
  pins: PinCoordinate[];
  options?: RenderOptions;
}

interface RenderOptions {
  showLabels?: boolean;
  animationDuration?: number;
  color?: string;
  size?: number;
}
```

### 🔧 実装例

```javascript
class PinRenderer {
  render(request) {
    const { pins, options = {} } = request;
    
    // 既存ピンをクリア
    this.clearPins();
    
    // 新しいピンを配置（シンプルな座標計算のみ）
    pins.forEach(pin => {
      if (pin.isValid) {
        const pinElement = this.createPinElement(pin, options);
        pinElement.style.left = pin.x + 'px';
        pinElement.style.top = pin.y + 'px';
        document.body.appendChild(pinElement);
      }
    });
  }
  
  createPinElement(pin, options) {
    const element = document.createElement('div');
    element.className = 'pin-marker';
    element.setAttribute('data-anchor', pin.anchorId);
    // スタイル適用
    return element;
  }
}
```

---

## 🚀 使用例

### 💻 基本的な使用方法

```javascript
// 1. システム初期化
const calculator = new ElementCalculator();
const renderer = new PinRenderer();
const observer = new EfficientObserver(calculator, renderer);

// 2. ユーザー選択（要素+ピン位置指定）
const request = {
  element: document.getElementById('background-element'),
  anchorPoints: [
    { id: 'TC', ratioX: 0.5, ratioY: 0.0 }  // 上中央のみ
  ],
  elementType: 'background'
};

// 3. 計算実行
const result = await calculator.calculate(request);

// 4. ピン表示
renderer.render({
  pins: result.pins,
  options: { showLabels: true, color: '#ff4757' }
});

// 5. 監視開始
observer.observe(request.element);
```

### 📱 2段階ピン設定との統合

```javascript
// Stage 1: F12風要素選択
elementSelector.selectElement((selectedElement) => {
  
  // Stage 2: ピン位置選択（ユーザーがMCを選択した場合）
  const request = {
    element: selectedElement,
    anchorPoints: [{ id: 'MC', ratioX: 0.5, ratioY: 0.5 }],
    elementType: detectElementType(selectedElement)
  };
  
  // 計算→表示
  processUserSelection(request);
});
```

---

## ⚡ パフォーマンス最適化

### 📊 効率化の実績

```
従来システム:
- 3要素 × 9アンカー = 27個の計算
- 1回のリサイズで27回の複雑計算

新システム:  
- ユーザー選択 1要素 × 1アンカー = 1個の計算
- 96%の計算量削減
```

### 🎯 最適化戦略

1. **遅延計算**: ユーザー選択時のみ実行
2. **キャッシュ活用**: 同一要素の結果を一時保存
3. **バッチ処理**: 複数変更を1回で処理
4. **無効ピン除外**: 画面外ピンの計算スキップ

---

## 🧪 テスト戦略

### 🔧 ユニットテスト

```javascript
// ElementCalculator単体テスト
describe('ElementCalculator', () => {
  test('テキスト要素の単一ピン計算', () => {
    const result = calculator.calculate({
      element: mockTextElement,
      anchorPoints: [{ id: 'BR', ratioX: 1.0, ratioY: 1.0 }],
      elementType: 'text'
    });
    
    expect(result.pins).toHaveLength(1);
    expect(result.pins[0].x).toBe(250);
    expect(result.pins[0].y).toBe(60);
  });
});
```

### 🎯 統合テスト

```javascript
// システム全体テスト
describe('EfficientPinSystem', () => {
  test('リサイズ→計算→表示の完全フロー', async () => {
    // 要素選択
    // リサイズイベント発生
    // 結果確認
  });
});
```

---

## 🔄 マイグレーション計画

### Phase 1: 基盤構築
- [ ] ElementCalculator クラス実装
- [ ] PinRenderer クラス実装  
- [ ] 基本的な要素タイプ対応

### Phase 2: 統合
- [ ] Observer 責務分離リファクタリング
- [ ] 既存システムとの並行稼働
- [ ] テストカバレッジ確保

### Phase 3: 完全移行
- [ ] 旧システム段階的削除
- [ ] パフォーマンス測定・最適化
- [ ] ドキュメント整備

---

## 📋 メリット・期待効果

### ✅ 技術的メリット
- **96%の計算量削減** (27個→1個)
- **責務分離によるテスト容易性**
- **バグ局所化・デバッグ効率向上**
- **保守性・拡張性の大幅向上**

### 🎯 ユーザー体験向上
- **レスポンス速度向上**
- **安定した動作保証**
- **直感的な操作フロー**

### 💡 開発効率向上
- **モジュール独立開発可能**
- **段階的実装・テスト可能**
- **問題の早期発見・解決**

---

*最終更新: 2025-09-04*
*作成者: Claude Code Assistant*
*バージョン: v2.0*