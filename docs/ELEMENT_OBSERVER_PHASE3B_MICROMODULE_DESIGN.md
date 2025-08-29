# ElementObserver Phase 3-B マイクロモジュール分割設計書

**策定日**: 2025-08-29  
**バージョン**: v1.0 - マイクロモジュール分割設計  
**設計方針**: v3.0 ハイブリッド設計準拠

---

## 🎯 設計背景

### 問題の特定
**Phase 3-B統合仕様の問題点**:
- **複数責務混在**: 環境監視 + スケール計算 + ピン設定UI + ハイライト機能
- **外部依存複雑化**: DOM監視 + WebGL + CSS Transform + イベント処理
- **単独テスト困難**: UI機能テストにDOM環境が必要
- **マイクロモジュール原則違反**: 1モジュール4責務（オーバースペック）

### 解決方針
**v3.0 ハイブリッド設計による4モジュール分離**:
- 1モジュール1責務の厳格な分離
- 完全独立・外部依存最小化
- 数値のみ入出力・単独テスト可能
- 実証済みパターン活用・実用性優先

---

## 🏗️ マイクロモジュール分割構成

### **1️⃣ PureEnvironmentObserver**
```
責務: 環境変化の監視のみ
行数: 300-400行
ファイル: micromodules/environment-observer/PureEnvironmentObserver.js
```

#### 仕様
- **入力**: `{ target: HTMLElement, options: ObserveOptions }`
- **出力**: `{ rect: RectData, timestamp: number, dpr: number }`
- **依存**: ResizeObserver, getBoundingClientRect のみ
- **禁止**: スケール計算、UI表示、ピン機能、他モジュール参照

#### 監視対象
- DOM要素のサイズ・位置変化
- DPR（Device Pixel Ratio）変化
- レスポンシブレイアウト変更
- ブラウザズーム・DevTools開閉

#### API仕様
```javascript
class PureEnvironmentObserver {
    constructor(options = {}) {
        // 初期化・状態バックアップ
    }
    
    observe(target, callback) {
        // 監視開始・変化通知
    }
    
    unobserve(target) {
        // 監視停止
    }
    
    getRect(target) {
        // 現在の矩形情報取得
    }
    
    cleanup() {
        // 完全復元・リソース解放
    }
    
    static test() {
        // 単独動作テスト
    }
}
```

---

### **2️⃣ PureScaleCalculator**
```
責務: スケール値計算のみ
行数: 200-300行
ファイル: micromodules/scale-calculator/PureScaleCalculator.js
```

#### 仕様
- **入力**: `{ rect: RectData, mode: string, options: ScaleOptions }`
- **出力**: `{ scale: number, ratio: number, mode: string }`
- **依存**: なし（純粋な数値計算のみ）
- **禁止**: DOM操作、環境監視、UI機能、外部ライブラリ

#### スケールモード
1. **fixed**: 固定スケール値
2. **proportional**: 要素サイズ比例
3. **fontSize**: フォントサイズ連動
4. **imageSize**: 画像サイズ面積比例
5. **custom**: ユーザー定義関数

#### 計算式
```javascript
// proportional
scale = baseScale * (currentSize / referenceSize) * scaleRatio

// fontSize
scale = baseScale * (currentFontSize / referenceFontSize) * scaleRatio

// imageSize (面積ベース)
scale = baseScale * sqrt(currentArea / referenceArea) * scaleRatio
```

#### API仕様
```javascript
class PureScaleCalculator {
    constructor(options = {}) {
        // 基準値設定・計算パラメータ初期化
    }
    
    calculate(rect, mode, options) {
        // スケール値計算・数値のみ返却
    }
    
    setReference(referenceData) {
        // 基準値設定（初回計算用）
    }
    
    getSupportedModes() {
        // 利用可能モード一覧
    }
    
    static test() {
        // 計算精度テスト・境界値テスト
    }
}
```

---

### **3️⃣ PurePinHighlighter**
```
責務: 要素ハイライト表示のみ
行数: 200-300行
ファイル: micromodules/pin-highlighter/PurePinHighlighter.js
```

#### 仕様
- **入力**: `{ element: HTMLElement, style: HighlightStyle }`
- **出力**: `{ overlayElement: HTMLElement, cleanup: function }`
- **依存**: DOM操作のみ
- **禁止**: 監視機能、計算処理、データ保存、他モジュール通信

#### ハイライト機能
- F12開発者ツール風のバウンディングボックス表示
- マウスオーバーで半透明境界線表示
- 要素情報ツールチップ（tagName, class, size）
- ピン配置予定位置のプレビュー表示

#### スタイル設定
```javascript
const highlightStyle = {
    borderColor: '#007acc',        // F12風ブルー
    backgroundColor: 'rgba(0,122,204,0.1)',
    borderWidth: '2px',
    showElementInfo: true,         // 要素情報表示
    showPinPreview: true,         // ピン予定位置表示
    throttle: 16                  // 60fps制御
};
```

#### API仕様
```javascript
class PurePinHighlighter {
    constructor(options = {}) {
        // スタイル設定・DOM準備
    }
    
    highlight(element, style) {
        // ハイライト表示・オーバーレイ生成
    }
    
    unhighlight(element) {
        // ハイライト削除・クリーンアップ
    }
    
    startHighlightMode(options) {
        // マウスオーバーハイライトモード開始
    }
    
    stopHighlightMode() {
        // ハイライトモード終了・完全復元
    }
    
    cleanup() {
        // 全オーバーレイ削除・完全復元
    }
    
    static test() {
        // DOM操作テスト・メモリリークテスト
    }
}
```

---

### **4️⃣ PinSystemIntegrator**
```
責務: 上記3モジュールの統合制御のみ
行数: 300-400行
ファイル: micromodules/pin-system/PinSystemIntegrator.js
```

#### 仕様
- **依存**: 上記3つのマイクロモジュール（v3.0ハイブリッド設計）
- **機能**: モジュール間の数値のみ受け渡し・協調制御
- **実装**: 実証済みPhase 3-Aパターン活用
- **禁止**: 直接的なDOM操作・計算処理・UI生成

#### 統合フロー
```javascript
1. PureEnvironmentObserver → 環境変化検出
2. PureScaleCalculator → スケール値計算  
3. PurePinHighlighter → UI表示・ハイライト
4. 結果統合 → 外部システムに数値のみ通知
```

#### API仕様（ElementObserver互換）
```javascript
class PinSystemIntegrator {
    constructor(globalOptions = {}) {
        // 3モジュール初期化・Phase 3-A成果統合
    }
    
    observe(target, options) {
        // 統合監視開始
    }
    
    unobserve(target) {
        // 統合監視停止
    }
    
    startPinSetupMode(options) {
        // ピン設定モード開始（ハイライト+監視）
    }
    
    stopPinSetupMode() {
        // ピン設定モード終了
    }
    
    onChange(callback) {
        // 統合変化通知
    }
    
    onPinSelect(callback) {
        // ピン選択イベント
    }
    
    cleanup() {
        // 3モジュール完全クリーンアップ
    }
    
    static test() {
        // 統合動作テスト
    }
}
```

---

## 📊 設計効果・改善点

### 行数削減効果
```
従来Phase 3-B統合仕様: 1,500-2,000行（推定）

分割後:
├── PureEnvironmentObserver: 350行
├── PureScaleCalculator: 250行  
├── PurePinHighlighter: 280行
└── PinSystemIntegrator: 350行
─────────────────────────────
総計: 1,230行（18-38%削減）
```

### マイクロモジュール原則遵守
- ✅ **単一責務**: 各モジュール1つの専門分野
- ✅ **完全独立**: 他モジュール参照なし
- ✅ **数値のみ入出力**: オブジェクト参照排除
- ✅ **単独テスト**: 独立でテスト実行可能
- ✅ **cleanup保証**: 完全状態復元・メモリリーク防止

### 開発・保守効率化
- **問題特定高速化**: バグ箇所の即座特定
- **部分修正対応**: 1機能修正で他機能影響なし
- **再利用性向上**: 他プロジェクトでの個別活用
- **並列開発可能**: 4モジュール同時開発

---

## 🚀 実装計画

### Phase 1: 基盤モジュール（1週間）
1. **PureEnvironmentObserver**: Phase 2実証技術活用
2. **PureScaleCalculator**: 純粋数値計算・独立実装

### Phase 2: UI・統合（3日）  
3. **PurePinHighlighter**: F12風ハイライト・DOM操作専門
4. **PinSystemIntegrator**: v3.0ハイブリッド統合制御

### Phase 3: テスト・統合（2日）
- 各モジュール単独テスト実行
- 統合動作確認・Phase 3-A互換性検証
- パフォーマンステスト・メモリリークチェック

---

## 🧪 品質保証

### 単独テスト仕様
```javascript
// 環境監視テスト（DOM最小限）
PureEnvironmentObserver.test() // → 監視精度・性能測定

// スケール計算テスト（数値のみ）
PureScaleCalculator.test() // → 計算精度・境界値テスト

// ハイライトテスト（DOM操作のみ）
PurePinHighlighter.test() // → UI表示・メモリリーク確認

// 統合テスト
PinSystemIntegrator.test() // → モジュール間連携確認
```

### 成功基準
- 各モジュール100%独立テスト成功
- cleanup()後のメモリリーク0件
- 他モジュール存在なしで動作
- Phase 3-A成果との完全互換性

---

## 📁 ファイル構成

```
micromodules/
├── environment-observer/
│   ├── PureEnvironmentObserver.js    # 環境監視専門
│   ├── README.md                     # 使用方法
│   └── SPEC.md                       # 技術仕様
│
├── scale-calculator/
│   ├── PureScaleCalculator.js        # スケール計算専門
│   ├── README.md                     # 計算式・使用例
│   └── SPEC.md                       # 計算精度仕様
│
├── pin-highlighter/
│   ├── PurePinHighlighter.js         # ハイライト表示専門
│   ├── README.md                     # UI機能・スタイル設定
│   └── SPEC.md                       # DOM操作仕様
│
└── pin-system/
    ├── PinSystemIntegrator.js        # 統合制御システム
    ├── README.md                     # 統合利用方法
    └── SPEC.md                       # 統合仕様・互換性
```

---

## 🎯 Phase 3-A成果との統合

### 99.9-100%高速化技術の活用
- **setUnifiedPosition()**: 0.01ms処理時間の超高速座標制御
- **統合座標システム**: 5座標系統一技術の継承
- **ElementObserverAdvanced**: 既存統合制御システムとの完全互換

### 統合戦略
```javascript
// Phase 3-A + Phase 3-B統合利用例
const environmentObserver = new PureEnvironmentObserver();
const scaleCalculator = new PureScaleCalculator();
const pinHighlighter = new PurePinHighlighter();

// Phase 3-A高速化システムと連携
const integrator = new PinSystemIntegrator({
    usePhase3A: true,  // 99.9%高速化技術活用
    compatMode: 'advanced'  // ElementObserverAdvanced互換
});
```

---

## 📋 まとめ

**ElementObserver Phase 3-B → 4つの純粋マイクロモジュール分割**

### 達成される価値
- ✅ **マイクロモジュール設計原則の完全遵守**
- ✅ **18-38%の軽量化と保守性大幅向上**
- ✅ **開発・デバッグ・テスト効率の向上**
- ✅ **他プロジェクトでの個別活用可能性**
- ✅ **Phase 3-A成果との完全統合**
- ✅ **並列開発・部分修正の実現**

### 技術的優位性
- **完全独立性**: 各モジュールが独立して動作・テスト可能
- **実証技術活用**: Phase 2/3-A成功パターンの内部移植
- **v3.0ハイブリッド設計**: 理論と実用のバランス重視
- **段階的拡張**: 将来機能追加への対応力確保

**結論**: Phase 3-B統合仕様よりも、4モジュール分割により実用性・保守性・拡張性が大幅に向上し、マイクロモジュール設計思想に完全準拠した次世代システムを実現。

---

**策定者**: Claude Code  
**承認待ち**: 4モジュール分割実装開始承認  
**関連文書**: 
- [ElementObserver Phase 3-B要件定義書](./ELEMENT_OBSERVER_PHASE3B_REQUIREMENTS.md)
- [マイクロモジュール設計思想v3-ハイブリッド](./micromodules/マイクロモジュール設計思想v3-ハイブリッド.md)
- [ElementObserver Phase 3-A成功記録](./ELEMENT_OBSERVER_PHASE3A_SUCCESS.md)