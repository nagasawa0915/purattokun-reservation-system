# PureScaleCalculator

**ElementObserver Phase 3-B マイクロモジュール #2 - スケール値計算専門**

🔢 純粋な数値計算のみで5つのスケールモード（fixed、proportional、fontSize、imageSize、custom）をサポートする軽量モジュール

## 📋 概要

PureScaleCalculatorは、DOM要素のサイズ・フォントサイズ・画像面積などを基準とした、精密なスケール値計算を専門に行うマイクロモジュールです。外部依存ゼロの純粋な数値計算のみで実装され、5つの異なるスケールモードをサポートします。

### 🎯 特徴

- **純粋数値計算**: DOM操作・外部ライブラリ一切不使用
- **5モードサポート**: fixed、proportional、fontSize、imageSize、custom
- **高精度計算**: 1e-6（0.000001）精度のε（イプシロン）ベース計算
- **境界値制御**: 最小・最大スケール制限による安全性確保
- **完全独立**: 他モジュール参照なし・単独で完結

### ✅ マイクロモジュール設計原則遵守

- ✅ **単一責務**: スケール値計算のみ
- ✅ **完全独立**: 外部依存なし・純粋関数
- ✅ **数値のみ入出力**: プリミティブ値のみ受け渡し
- ✅ **単独テスト**: 独立でテスト実行可能
- ✅ **cleanup保証**: ステートレス設計・リソース不要

---

## 🚀 基本使用方法

### インストール・読み込み

```javascript
// ブラウザ環境
<script src="PureScaleCalculator.js"></script>

// Node.js環境
const PureScaleCalculator = require('./PureScaleCalculator');
```

### 基本的なスケール計算

```javascript
// 1. インスタンス作成
const calculator = new PureScaleCalculator({
    defaultBaseScale: 1.0,    // デフォルトベーススケール
    minScale: 0.1,            // 最小スケール制限
    maxScale: 10.0,           // 最大スケール制限
    epsilon: 1e-6             // 数値誤差許容範囲
});

// 2. 矩形データ（環境監視モジュールから取得）
const rect = {
    x: 100,
    y: 200,
    width: 300,
    height: 200
};

// 3. 固定スケール計算
const fixedResult = calculator.calculate(rect, 'fixed', {
    baseScale: 1.5
});

console.log('固定スケール:', fixedResult.scale);  // 1.5

// 4. 比例スケール計算
const propResult = calculator.calculate(rect, 'proportional', {
    baseScale: 1.0,
    referenceSize: 150,    // 基準サイズ
    scaleRatio: 1.2        // 比例倍率
});

console.log('比例スケール:', propResult.scale);  // 2.4 (300/150 * 1.2)
console.log('比率:', propResult.ratio);         // 2.0
```

---

## 📊 5つのスケールモード詳細

### 1. fixed（固定スケール）

常に同じスケール値を返すモードです。

```javascript
const result = calculator.calculate(rect, 'fixed', {
    baseScale: 2.0
});
// result.scale = 2.0 (常に固定値)
// result.ratio = 1.0 (固定スケールは比率1.0)
```

**用途**: UI要素の一定サイズ保持、アイコンのスケール固定

### 2. proportional（比例スケール）

要素サイズに比例してスケール値を計算するモードです。

```javascript
const result = calculator.calculate(rect, 'proportional', {
    baseScale: 1.0,
    referenceSize: 100,        // 基準サイズ（width基準）
    scaleRatio: 1.5,          // 比例倍率
    sizeDimension: 'width'     // 'width' or 'height'
});
// result.scale = baseScale * (currentSize/referenceSize) * scaleRatio
// 例: 1.0 * (300/100) * 1.5 = 4.5
```

**計算式**:
```
scale = baseScale × (currentSize ÷ referenceSize) × scaleRatio
```

**用途**: レスポンシブ要素のサイズ連動、コンテナサイズ比例

### 3. fontSize（フォントサイズ連動）

要素のフォントサイズに連動してスケール値を計算するモードです。

```javascript
const result = calculator.calculate(rect, 'fontSize', {
    baseScale: 1.0,
    currentFontSize: 18,       // 現在のフォントサイズ(px)
    referenceFontSize: 16,     // 基準フォントサイズ(px)
    scaleRatio: 1.0
});
// result.scale = 1.0 * (18/16) * 1.0 = 1.125
```

**計算式**:
```
scale = baseScale × (currentFontSize ÷ referenceFontSize) × scaleRatio
```

**用途**: タイポグラフィ連動UI、テキストサイズ比例要素

### 4. imageSize（画像サイズ面積比例）

画像の面積に基づいてスケール値を計算するモードです。

```javascript
const result = calculator.calculate(rect, 'imageSize', {
    baseScale: 1.0,
    referenceArea: 10000,      // 基準面積(px²)
    scaleRatio: 1.0
});
// currentArea = rect.width * rect.height = 300 * 200 = 60000
// result.scale = 1.0 * sqrt(60000/10000) * 1.0 = sqrt(6) ≈ 2.449
```

**計算式**:
```
scale = baseScale × √(currentArea ÷ referenceArea) × scaleRatio
```

**用途**: 画像ギャラリー、アスペクト比考慮スケーリング

### 5. custom（カスタム関数）

ユーザー定義の計算関数を使用するモードです。

```javascript
const result = calculator.calculate(rect, 'custom', {
    baseScale: 1.0,
    customFunction: (rect, options) => {
        // カスタム計算ロジック
        const diagonal = Math.sqrt(rect.width ** 2 + rect.height ** 2);
        return diagonal / 100;
    }
});
// rect(300x200) → diagonal = sqrt(300² + 200²) ≈ 360.56
// result.scale ≈ 3.606
```

**カスタム関数の戻り値**:
- `number`: スケール値のみ
- `{ scale: number, ratio?: number }`: スケール値と比率

**用途**: 独自の計算ロジック、複雑な数式、特殊要件対応

---

## 🔧 高度な設定・オプション

### 基準値の事前設定

```javascript
// 基準値を事前に設定（初回計算で使用）
calculator.setReference({
    size: 150,           // 基準サイズ
    fontSize: 16,        // 基準フォントサイズ
    imageArea: 20000     // 基準画像面積
});

// 基準値を使用した計算
const result = calculator.calculate(rect, 'proportional', {
    baseScale: 1.0
    // referenceSize省略時は事前設定値を使用
});
```

### スケール制限の動的変更

```javascript
const result = calculator.calculate(rect, 'proportional', {
    baseScale: 1.0,
    referenceSize: 100,
    minScale: 0.5,       // この計算のみの最小値
    maxScale: 3.0        // この計算のみの最大値
});

// 制限が適用されたかどうか確認
if (result.clipped) {
    console.log('スケール値が制限されました');
}
```

### 利用可能モード確認

```javascript
const supportedModes = calculator.getSupportedModes();
console.log('利用可能モード:', supportedModes);
// ['fixed', 'proportional', 'fontSize', 'imageSize', 'custom']
```

---

## 💡 実用的な計算例

### レスポンシブUI要素のスケーリング

```javascript
// 画面サイズに応じたボタンサイズ調整
const buttonScale = calculator.calculate(containerRect, 'proportional', {
    baseScale: 1.0,
    referenceSize: 1200,        // デスクトップ基準幅
    scaleRatio: 1.0,
    sizeDimension: 'width'
});

// モバイル: 375px → scale = 375/1200 = 0.3125
// タブレット: 768px → scale = 768/1200 = 0.64
// デスクトップ: 1200px → scale = 1.0
```

### フォント連動アイコンサイズ

```javascript
// フォントサイズに連動するアイコンサイズ
const iconScale = calculator.calculate(rect, 'fontSize', {
    baseScale: 1.0,
    currentFontSize: parseFloat(getComputedStyle(element).fontSize),
    referenceFontSize: 16,      // 1rem = 16px基準
    scaleRatio: 1.2             // フォントより20%大きく
});
```

### 画像ギャラリーのサムネイル

```javascript
// 画像面積に基づくサムネイルサイズ調整
const thumbnailScale = calculator.calculate(imageRect, 'imageSize', {
    baseScale: 0.3,             // 基本30%サイズ
    referenceArea: 400 * 300,   // 標準画像サイズ
    scaleRatio: 1.0
});

// 大きな画像ほど小さなサムネイル、小さな画像は大きめのサムネイルに
```

### 複合計算（複数モードの組み合わせ）

```javascript
// デバイスサイズとフォントサイズの両方を考慮
const deviceScale = calculator.calculate(rect, 'proportional', {
    baseScale: 1.0,
    referenceSize: 1200,
    scaleRatio: 1.0
});

const fontScale = calculator.calculate(rect, 'fontSize', {
    baseScale: 1.0,
    currentFontSize: 18,
    referenceFontSize: 16
});

// 両方のスケールを掛け合わせて最終値を決定
const finalScale = deviceScale.scale * fontScale.scale * 0.8;
```

---

## 🧮 他モジュール連携

### PureEnvironmentObserver との連携

```javascript
const environmentObserver = new PureEnvironmentObserver();
const scaleCalculator = new PureScaleCalculator();

// 環境変化を監視してスケール計算に連携
environmentObserver.observe(element, (envData) => {
    // 数値のみを受け取り
    const scaleResult = scaleCalculator.calculate(
        envData.rect,     // 矩形データ（数値のみ）
        'proportional',
        {
            baseScale: 1.0,
            referenceSize: 100,
            scaleRatio: 1.2
        }
    );
    
    // 統合結果（数値のみ）
    const integratedResult = {
        rect: envData.rect,
        scale: scaleResult.scale,
        ratio: scaleResult.ratio,
        timestamp: envData.timestamp
    };
    
    console.log('統合計算結果:', integratedResult);
});
```

### PinSystemIntegrator 経由での利用

```javascript
// 統合システム経由での利用（推奨）
const integrator = new PinSystemIntegrator({
    defaultBaseScale: 1.0,
    minScale: 0.1,
    maxScale: 5.0
});

// 内部でPureScaleCalculatorが使用される
integrator.observe(element, {
    scaleMode: 'proportional',
    baseScale: 1.0,
    referenceSize: 100
});
```

---

## 🧪 テスト・品質保証

### 単独テスト実行

```javascript
// 自動テストを実行
const testResults = PureScaleCalculator.test();
console.log('テスト結果:', testResults);

// またはブラウザのURLパラメータで自動実行
// http://localhost:8000/?test=scale
```

### パフォーマンステスト

```javascript
// 10,000回実行のパフォーマンステスト
const perfResults = PureScaleCalculator.performanceTest(10000);
console.log('パフォーマンス結果:', perfResults);

// 出力例:
// {
//   fixed: { avgTime: 0.0012, opsPerSecond: 833333 },
//   proportional: { avgTime: 0.0018, opsPerSecond: 555556 },
//   fontSize: { avgTime: 0.0015, opsPerSecond: 666667 },
//   imageSize: { avgTime: 0.0023, opsPerSecond: 434783 }
// }
```

### カスタムテスト

```javascript
// カスタム計算テスト
const calculator = new PureScaleCalculator();
const testRect = { x: 0, y: 0, width: 200, height: 100 };

// 1. 固定スケールテスト
const fixedResult = calculator.calculate(testRect, 'fixed', { baseScale: 1.5 });
assert(Math.abs(fixedResult.scale - 1.5) < 1e-6, '固定スケール正確性');

// 2. 比例計算テスト  
const propResult = calculator.calculate(testRect, 'proportional', {
    baseScale: 1.0,
    referenceSize: 100,
    scaleRatio: 1.0
});
assert(Math.abs(propResult.scale - 2.0) < 1e-6, '比例計算正確性');  // 200/100 = 2.0

// 3. 境界値テスト
const clampResult = calculator.calculate(testRect, 'fixed', {
    baseScale: 20.0,
    maxScale: 10.0
});
assert(Math.abs(clampResult.scale - 10.0) < 1e-6, 'スケール制限適用');
```

---

## ⚠️ トラブルシューティング

### よくある問題

#### 1. 計算結果がNaNになる

```javascript
// 原因チェック
try {
    const result = calculator.calculate(rect, 'proportional', {
        referenceSize: 0  // ゼロ割りエラー
    });
} catch (error) {
    console.error('計算エラー:', error.message);
    // 'Reference size is zero or too small'
}

// 解決策: 有効な基準値を設定
const result = calculator.calculate(rect, 'proportional', {
    referenceSize: Math.max(referenceSize, 1)  // 最小値1を保証
});
```

#### 2. カスタム関数エラー

```javascript
// エラーハンドリング付きカスタム関数
const result = calculator.calculate(rect, 'custom', {
    customFunction: (rect, options) => {
        try {
            // カスタム計算ロジック
            const result = rect.width / rect.height;
            
            // 無効値チェック
            if (!isFinite(result) || isNaN(result)) {
                return options.baseScale;  // フォールバック値
            }
            
            return result;
        } catch (error) {
            console.warn('カスタム関数エラー:', error);
            return options.baseScale;  // エラー時はbaseScaleを返す
        }
    }
});
```

#### 3. 精度問題

```javascript
// 浮動小数点精度問題の対処
const calculator = new PureScaleCalculator({
    epsilon: 1e-10  // より高精度に設定
});

// または計算結果を適切に丸める
const result = calculator.calculate(rect, 'proportional', options);
const roundedScale = Math.round(result.scale * 1000) / 1000;  // 小数点3桁
```

### デバッグ情報

```javascript
// 計算過程の詳細を確認
const result = calculator.calculate(rect, 'proportional', {
    baseScale: 1.0,
    referenceSize: 100,
    scaleRatio: 1.5
});

console.log('計算詳細:', {
    'rectサイズ': rect.width,
    '基準サイズ': 100,
    '比率': rect.width / 100,
    'baseScale': 1.0,
    'scaleRatio': 1.5,
    '最終スケール': result.scale,
    '制限適用': result.clipped
});
```

---

## 📚 参考資料

### 関連ドキュメント

- [SPEC.md](./SPEC.md) - 技術仕様書
- [PureEnvironmentObserver](../environment-observer/README.md) - 環境監視モジュール
- [PurePinHighlighter](../pin-highlighter/README.md) - ハイライト表示モジュール
- [PinSystemIntegrator](../pin-system/README.md) - 統合制御システム

### 設計思想

- [ElementObserver Phase 3-B設計書](../../docs/ELEMENT_OBSERVER_PHASE3B_MICROMODULE_DESIGN.md)
- [マイクロモジュール設計原則](../../docs/micromodules/)

### 数学的背景

- **比例計算**: 線形スケーリング理論
- **面積比例**: 2次元スケーリング（平方根による線形変換）
- **浮動小数点精度**: IEEE 754標準準拠
- **イプシロン比較**: 数値誤差許容による安定性確保

---

## 🔖 バージョン情報

**Version**: 1.0  
**Phase**: ElementObserver Phase 3-B  
**Created**: 2025-08-29  
**Dependencies**: なし（純粋数値計算のみ）  
**Compatibility**: ES6+対応環境

**Author**: Claude Code  
**License**: MIT