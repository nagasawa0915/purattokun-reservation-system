# PureEnvironmentObserver

**ElementObserver Phase 3-B マイクロモジュール #1 - 環境変化監視専門**

🌊 DOM要素のサイズ・位置変化、DPR変化、レスポンシブレイアウト変更、ブラウザズーム検出を専門に行う軽量モジュール

## 📋 概要

PureEnvironmentObserverは、DOM要素の環境変化を高精度で監視するマイクロモジュールです。Phase 3-A で実証済みの99.9%高速化技術を基盤として、環境監視のみに特化した設計になっています。

### 🎯 特徴

- **単一責務**: 環境変化監視のみに集中
- **高精度監視**: ±0.5px誤差許容のε（イプシロン）ベース検出
- **高速処理**: 120fps対応の8ms throttle間隔
- **完全独立**: 他モジュール参照なし
- **数値のみ出力**: オブジェクト参照排除による協調制御

### ✅ マイクロモジュール設計原則遵守

- ✅ **単一責務**: 環境変化監視のみ
- ✅ **完全独立**: 他モジュール参照なし
- ✅ **数値のみ入出力**: プリミティブ値のみ受け渡し
- ✅ **単独テスト**: 独立でテスト実行可能
- ✅ **cleanup保証**: 完全状態復元・メモリリーク防止

---

## 🚀 基本使用方法

### インストール・読み込み

```javascript
// ブラウザ環境
<script src="PureEnvironmentObserver.js"></script>

// Node.js環境
const PureEnvironmentObserver = require('./PureEnvironmentObserver');
```

### 基本的な要素監視

```javascript
// 1. インスタンス作成
const observer = new PureEnvironmentObserver({
    epsilon: 0.5,           // ±0.5px誤差許容
    throttleInterval: 8,    // 8ms = 120fps対応
    dprMonitoring: true,    // DPR変化監視
    debug: true             // デバッグログ出力
});

// 2. 監視対象要素を取得
const targetElement = document.getElementById('target');

// 3. 変化通知コールバックを定義
const changeCallback = (data) => {
    console.log('要素変化検出:', {
        size: `${data.rect.width}×${data.rect.height}`,
        position: `(${data.rect.x}, ${data.rect.y})`,
        dpr: data.dpr,
        changeType: data.changeType,
        timestamp: data.timestamp
    });
};

// 4. 監視開始
const result = observer.observe(targetElement, changeCallback);
console.log('監視開始:', result);

// 5. 監視停止
// observer.unobserve(targetElement);

// 6. 完全クリーンアップ
// observer.cleanup();
```

---

## 📊 出力データ形式

### 標準的な変化通知データ

```javascript
{
    // 矩形情報（数値のみ）
    rect: {
        // DOM基本矩形
        x: 150,
        y: 200, 
        width: 300,
        height: 200,
        left: 150,
        top: 200,
        right: 450,
        bottom: 400,
        
        // CSS計算値
        clientWidth: 300,
        clientHeight: 200,
        offsetWidth: 302,
        offsetHeight: 202,
        scrollWidth: 300,
        scrollHeight: 200,
        
        // ビューポート相対値
        viewportX: 0.125,      // x / window.innerWidth
        viewportY: 0.25,       // y / window.innerHeight
        viewportWidth: 0.25,   // width / window.innerWidth
        viewportHeight: 0.33,  // height / window.innerHeight
        
        // CSS Transform情報
        transform: 'none',
        position: 'absolute',
        
        // 現在のブレークポイント
        currentBreakpoint: 'bp-1024'
    },
    
    // メタデータ
    timestamp: 1693123456789,
    dpr: 2.0,
    changeType: 'resize',    // 'initial', 'resize', 'dpr'
    changeCount: 5
}
```

---

## 🔧 高度な設定・オプション

### 初期化オプション

```javascript
const observer = new PureEnvironmentObserver({
    // 監視精度設定
    epsilon: 0.5,                    // ±0.5px誤差許容（デフォルト）
    throttleInterval: 8,             // 8ms = 120fps対応（デフォルト）
    
    // DPR監視設定
    dprMonitoring: true,             // DPR変化監視有効（デフォルト）
    
    // 環境監視設定
    detectZoom: true,                // ブラウザズーム検出（デフォルト）
    monitorBreakpoints: true,        // ブレークポイント監視（デフォルト）
    breakpoints: [768, 1024, 1200],  // カスタムブレークポイント
    
    // デバッグ設定
    debug: false                     // デバッグログ出力（デフォルト）
});
```

### 現在の矩形情報取得

```javascript
// リアルタイムで現在の情報を取得
const currentRect = observer.getRect(targetElement);
if (currentRect) {
    console.log('現在のサイズ:', currentRect.width, 'x', currentRect.height);
    console.log('現在の位置:', currentRect.x, ',', currentRect.y);
    console.log('現在のDPR:', currentRect.dpr);
}
```

### 複数要素の監視

```javascript
// 複数の要素を同時に監視
const elements = document.querySelectorAll('.monitored');

elements.forEach(element => {
    observer.observe(element, (data) => {
        console.log(`要素変化 [${element.id}]:`, data.rect);
    });
});
```

### 状態・パフォーマンス情報取得

```javascript
// 現在の監視状態を確認
const state = observer.getState();
console.log('監視状態:', {
    初期化済み: state.initialized,
    監視中: state.isObserving,
    監視対象数: state.observationCount,
    現在DPR: state.dpr,
    ウィンドウサイズ: state.windowSize,
    ブレークポイント: state.currentBreakpoint
});

// パフォーマンス統計を確認
const perfStats = observer.getPerformanceStats();
console.log('パフォーマンス:', {
    ペンディング更新: perfStats.pendingUpdates,
    最終更新時間: perfStats.lastUpdateTime,
    更新間隔: perfStats.minUpdateInterval,
    フレーム要求: perfStats.frameRequests
});
```

---

## 🔄 他モジュール連携

### PureScaleCalculator との連携

```javascript
const environmentObserver = new PureEnvironmentObserver();
const scaleCalculator = new PureScaleCalculator();

// 環境変化を監視してスケール計算に連携
environmentObserver.observe(element, (envData) => {
    // 数値のみを受け渡し
    const scaleResult = scaleCalculator.calculate(
        envData.rect,
        'proportional',
        { baseScale: 1.0, referenceSize: 100 }
    );
    
    console.log('統合結果:', {
        環境: envData.rect,
        スケール: scaleResult.scale
    });
});
```

### PinSystemIntegrator 経由での利用

```javascript
// 統合システム経由での利用（推奨）
const integrator = new PinSystemIntegrator({
    epsilon: 0.5,
    throttleInterval: 8,
    dprMonitoring: true
});

// 内部でPureEnvironmentObserverが使用される
integrator.observe(element, {
    scaleMode: 'proportional',
    baseScale: 1.0
});
```

---

## 🧪 テスト・デバッグ

### 単独テスト実行

```javascript
// 自動テストを実行
PureEnvironmentObserver.test();

// またはブラウザのURLパラメータで自動実行
// http://localhost:8000/?test=environment
```

### カスタムテスト

```javascript
// テスト用要素を作成
const testElement = document.createElement('div');
testElement.style.cssText = 'width: 100px; height: 100px; position: absolute;';
document.body.appendChild(testElement);

const observer = new PureEnvironmentObserver({ debug: true });

// 監視開始
const testCallback = (data) => {
    console.log('テストコールバック:', data);
};

observer.observe(testElement, testCallback);

// 要素を変更してテスト
setTimeout(() => {
    testElement.style.width = '200px';
    testElement.style.height = '150px';
}, 1000);

// クリーンアップ
setTimeout(() => {
    observer.cleanup();
    document.body.removeChild(testElement);
}, 3000);
```

---

## ⚠️ トラブルシューティング

### よくある問題

#### 1. コールバックが呼ばれない

```javascript
// 原因チェック
const state = observer.getState();
if (!state.initialized) {
    console.error('初期化に失敗しています');
}
if (!state.isObserving) {
    console.error('監視が開始されていません');
}

// ResizeObserver対応確認
if (typeof ResizeObserver === 'undefined') {
    console.error('このブラウザはResizeObserverをサポートしていません');
}
```

#### 2. パフォーマンス問題

```javascript
// throttle間隔を調整
const observer = new PureEnvironmentObserver({
    throttleInterval: 16  // 60fpsに変更
});

// または更新間隔を動的に調整
observer.updateOptions({
    throttleInterval: 32  // 30fpsに変更
});
```

#### 3. メモリリーク

```javascript
// 必ずcleanup()を呼び出す
window.addEventListener('beforeunload', () => {
    observer.cleanup();
});

// 個別の監視停止
observer.unobserve(element);
```

### デバッグ情報

```javascript
// デバッグモードで詳細ログを確認
const observer = new PureEnvironmentObserver({ debug: true });

// エラー情報の確認
if (observer.errorHandling.lastError) {
    console.error('最終エラー:', observer.errorHandling.lastError);
}
```

---

## 📚 参考資料

### 関連ドキュメント

- [SPEC.md](./SPEC.md) - 技術仕様書
- [PureScaleCalculator](../scale-calculator/README.md) - スケール計算モジュール
- [PurePinHighlighter](../pin-highlighter/README.md) - ハイライト表示モジュール
- [PinSystemIntegrator](../pin-system/README.md) - 統合制御システム

### 設計思想

- [ElementObserver Phase 3-B設計書](../../docs/ELEMENT_OBSERVER_PHASE3B_MICROMODULE_DESIGN.md)
- [マイクロモジュール設計原則](../../docs/micromodules/)

---

## 🔖 バージョン情報

**Version**: 1.0  
**Phase**: ElementObserver Phase 3-B  
**Created**: 2025-08-29  
**Dependencies**: ResizeObserver, getBoundingClientRect のみ  
**Compatibility**: モダンブラウザ（IE11+）

**Author**: Claude Code  
**License**: MIT