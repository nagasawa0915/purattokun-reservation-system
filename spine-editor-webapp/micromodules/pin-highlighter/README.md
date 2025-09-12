# PurePinHighlighter

**ElementObserver Phase 3-B マイクロモジュール #3 - 要素ハイライト表示専門**

🔆 F12開発者ツール風のバウンディングボックス表示、マウスオーバーハイライト、要素情報ツールチップ、ピン配置プレビューを専門に行う軽量モジュール

## 📋 概要

PurePinHighlighterは、HTML要素のハイライト表示に特化したマイクロモジュールです。Chrome DevToolsのF12開発者ツールで覉染みの、プロフェッショナルなハイライトUIを提供し、ピン配置システムの用途に最適化されています。

### 🎯 特徴

- **F12風UI**: Chrome DevToolsの親しみやすいデザイン
- **プロフェッショナル品質**: 半透明境界線・要素情報表示・ピンプレビュー
- **60fpsスムーズ**: 16ms throttleでパフォーマンス最適化
- **メモリリーク防止**: 完全なDOMクリーンアップ保証
- **イベント透過**: pointer-events: noneでUI操作に影響なし

### ✅ マイクロモジュール設計原則遵守

- ✅ **単一責務**: 要素ハイライト表示のみ
- ✅ **完全独立**: 他モジュール参照なし
- ✅ **数値のみ入出力**: HTML要素以外はプリミティブ値のみ
- ✅ **単独テスト**: 独立でテスト実行可能
- ✅ **cleanup保証**: 完全DOM復元・メモリリーク防止

---

## 🚀 基本使用方法

### インストール・読み込み

```javascript
// ブラウザ環境
<script src="PurePinHighlighter.js"></script>

// Node.js環境
const PurePinHighlighter = require('./PurePinHighlighter');
```

### 基本的な要素ハイライト

```javascript
// 1. インスタンス作成
const highlighter = new PurePinHighlighter({
    style: {
        borderColor: '#007acc',                  // F12風ブルー
        backgroundColor: 'rgba(0,122,204,0.1)', // 半透明背景
        showElementInfo: true,                   // 要素情報表示
        showPinPreview: true,                   // ピンプレビュー
        throttle: 16                            // 60fps制御
    }
});

// 2. 対象要素を取得
const targetElement = document.getElementById('target');

// 3. ハイライト表示
const { overlayElement, cleanup } = highlighter.highlight(targetElement);

if (overlayElement) {
    console.log('ハイライト表示成功');
    
    // 5秒後にハイライトを削除
    setTimeout(() => {
        cleanup();
        console.log('ハイライト削除完了');
    }, 5000);
}

// 4. 完全クリーンアップ
// highlighter.cleanup();
```

---

## 🎨 ハイライトスタイルカスタマイズ

### デフォルトスタイル（F12風）

```javascript
const defaultStyle = {
    borderColor: '#007acc',                  // F12風ブルー
    backgroundColor: 'rgba(0,122,204,0.1)', // 半透明背景
    borderWidth: '2px',
    borderStyle: 'solid',
    showElementInfo: true,                   // 要素情報表示
    showPinPreview: true,                   // ピン配置プレビュー
    throttle: 16,                           // 60fps制御
    zIndex: 10000,                          // 最上位表示
    pointerEvents: 'none'                   // イベント透過
};
```

### カスタムスタイル例

```javascript
// 1. 赤い照明スタイル
const redHighlighter = new PurePinHighlighter({
    style: {
        borderColor: '#ff4444',
        backgroundColor: 'rgba(255, 68, 68, 0.2)',
        borderWidth: '3px',
        showElementInfo: true,
        showPinPreview: false
    }
});

// 2. 緑のシンプルスタイル
const greenHighlighter = new PurePinHighlighter({
    style: {
        borderColor: '#00cc44',
        backgroundColor: 'transparent',
        borderWidth: '1px',
        borderStyle: 'dashed',
        showElementInfo: false,
        showPinPreview: true
    }
});

// 3. 高コントラストスタイル
const highContrastHighlighter = new PurePinHighlighter({
    style: {
        borderColor: '#ffff00',              // 黄色
        backgroundColor: 'rgba(255,255,0,0.3)',
        borderWidth: '4px',
        showElementInfo: true,
        showPinPreview: true,
        throttle: 8                         // 120fps高パフォーマンス
    }
});
```

---

## 📍 マウスオーバーハイライトモード

### ハイライトモード開始

```javascript
// 1. 基本的なハイライトモード
const highlighter = new PurePinHighlighter();

// マウスオーバーで要素を自動ハイライト
highlighter.startHighlightMode();

console.log('マウスを要素にホバーしてください...');

// 10秒後にモード終了
setTimeout(() => {
    highlighter.stopHighlightMode();
    console.log('ハイライトモード終了');
}, 10000);

// 2. カスタムオプションでモード開始
highlighter.startHighlightMode({
    borderColor: '#ff6b6b',        // ピンク系
    backgroundColor: 'rgba(255,107,107,0.15)',
    showPinPreview: true,          // ピンプレビュー有効
    throttle: 8                    // 120fps高パフォーマンス
});
```

### 特定要素のフィルタリング

```javascript
// 特定のクラスを持つ要素のみハイライト
const selectiveHighlighter = new PurePinHighlighter();

// カスタムハイライトロジック
const originalHandleMouseOver = selectiveHighlighter.handleMouseOver;
selectiveHighlighter.handleMouseOver = function(event, settings) {
    const target = event.target;
    
    // '.highlightable' クラスを持つ要素のみ処理
    if (target.classList.contains('highlightable')) {
        originalHandleMouseOver.call(this, event, settings);
    }
};

selectiveHighlighter.startHighlightMode();
```

---

## 📊 要素情報表示機能

### 要素情報ツールチップ

ハイライトされた要素の上部に、以下の情報が表示されます：

```javascript
// 表示される情報の例
"div#main-content.container 300×200"
"button.submit-btn 120×80"
"img.hero-image...+3 800×600"
```

**情報内容**:
- **タグ名**: `div`, `button`, `img` など
- **ID**: `#main-content` (ある場合)
- **クラス**: `.container`, `.submit-btn` (最初の1つのみ、複数ある場合は+数で表示)
- **サイズ**: `300×200` (幅×高さ)

### 情報表示のカスタマイズ

```javascript
// 要素情報を無効化
const noInfoHighlighter = new PurePinHighlighter({
    style: {
        showElementInfo: false  // 情報非表示
    }
});

// カスタム情報表示（高度な使用方法）
const customInfoHighlighter = new PurePinHighlighter();

// createElementInfoメソッドをオーバーライド
const originalCreateElementInfo = customInfoHighlighter.createElementInfo;
customInfoHighlighter.createElementInfo = function(element, rect) {
    const info = originalCreateElementInfo.call(this, element, rect);
    if (info) {
        // カスタム情報を追加
        const customData = element.dataset.customInfo;
        if (customData) {
            info.textContent += ` [${customData}]`;
        }
    }
    return info;
};
```

---

## 📌 ピン配置プレビュー機能

### ピンプレビュー表示

ハイライトされた要素の中心に、ピン配置予定位置を表す赤い円が表示されます。

```javascript
// ピンプレビュー有効化
const pinHighlighter = new PurePinHighlighter({
    style: {
        showPinPreview: true  // デフォルトで有効
    }
});

// ピンプレビュー無効化
const noPinHighlighter = new PurePinHighlighter({
    style: {
        showPinPreview: false
    }
});
```

### ピンプレビューのカスタマイズ

ピンプレビューのスタイルは内部で生成されています：

```css
/* デフォルトピンスタイル */
.pin-highlighter-pin-preview {
    position: absolute;
    left: calc(50% - 4px);    /* 中心配置 */
    top: calc(50% - 4px);
    width: 8px;
    height: 8px;
    background: #ff6b6b;      /* 赤色 */
    border: 1px solid white;  /* 白い縁取り */
    border-radius: 50%;       /* 円形 */
    pointer-events: none;     /* イベント透過 */
}
```

---

## 🔄 他モジュール連携

### PureEnvironmentObserver との連携

```javascript
const environmentObserver = new PureEnvironmentObserver();
const pinHighlighter = new PurePinHighlighter();

// 環境変化を監視してハイライトを更新
environmentObserver.observe(element, (envData) => {
    // 要素のサイズが大きく変化したときのみハイライト更新
    const sizeChange = Math.abs(envData.rect.width - lastWidth) > 10 ||
                      Math.abs(envData.rect.height - lastHeight) > 10;
    
    if (sizeChange) {
        // 既存のハイライトを削除
        pinHighlighter.unhighlight(element);
        
        // 新しいサイズでハイライトを再表示
        pinHighlighter.highlight(element);
        
        lastWidth = envData.rect.width;
        lastHeight = envData.rect.height;
    }
});
```

### PinSystemIntegrator 経由での利用

```javascript
// 統合システム経由での利用（推奨）
const integrator = new PinSystemIntegrator({
    highlightBorderColor: '#ff6b6b',
    highlightBackgroundColor: 'rgba(255,107,107,0.2)',
    showElementInfo: true,
    showPinPreview: true
});

// 内部でPurePinHighlighterが使用される
integrator.startPinSetupMode({
    highlightColor: '#00cc44'
});
```

---

## 🧪 テスト・デバッグ

### 単独テスト実行

```javascript
// 自動テストを実行
const testResults = PurePinHighlighter.test();
console.log('テスト結果:', testResults);

// テスト結果例:
// {
//   passed: 7,
//   failed: 0,
//   errors: []
// }
```

### カスタムテスト

```javascript
// テスト用要素を作成
const testElement = document.createElement('div');
testElement.id = 'test-element';
testElement.className = 'test-class';
testElement.style.cssText = 'width: 200px; height: 100px; position: absolute; top: 50px; left: 100px;';
document.body.appendChild(testElement);

const highlighter = new PurePinHighlighter({
    style: {
        borderColor: '#00ff00',
        showElementInfo: true,
        showPinPreview: true
    }
});

// ハイライト表示テスト
const { overlayElement, cleanup } = highlighter.highlight(testElement);

if (overlayElement) {
    console.log('ハイライト表示成功');
    console.log('オーバーレイ位置:', overlayElement.style.left, overlayElement.style.top);
    console.log('オーバーレイサイズ:', overlayElement.style.width, overlayElement.style.height);
    
    // 3秒後にクリーンアップ
    setTimeout(() => {
        cleanup();
        document.body.removeChild(testElement);
        highlighter.cleanup();
        console.log('テスト完了');
    }, 3000);
}
```

### メモリリークテスト

```javascript
// メモリリークチェック
function memoryLeakTest() {
    const initialOverlayCount = document.querySelectorAll('.pin-highlighter-overlay').length;
    const highlighter = new PurePinHighlighter();
    
    // 100個の要素をハイライトして削除
    for (let i = 0; i < 100; i++) {
        const element = document.createElement('div');
        element.style.cssText = 'width: 10px; height: 10px; position: absolute;';
        document.body.appendChild(element);
        
        const { cleanup } = highlighter.highlight(element);
        cleanup();
        document.body.removeChild(element);
    }
    
    // 完全クリーンアップ
    highlighter.cleanup();
    
    const finalOverlayCount = document.querySelectorAll('.pin-highlighter-overlay').length;
    console.log('メモリリークテスト:', {
        initial: initialOverlayCount,
        final: finalOverlayCount,
        leaked: finalOverlayCount - initialOverlayCount
    });
    
    if (finalOverlayCount === initialOverlayCount) {
        console.log('✅ メモリリークなし');
    } else {
        console.warn('⚠️ メモリリーク検出');
    }
}

memoryLeakTest();
```

---

## ⚠️ トラブルシューティング

### よくある問題

#### 1. ハイライトが表示されない

```javascript
// 原因チェック
// 1. 要素のサイズ確認
const rect = element.getBoundingClientRect();
if (rect.width === 0 && rect.height === 0) {
    console.warn('要素のサイズが0です');
}

// 2. 要素の表示状態確認
const computedStyle = getComputedStyle(element);
if (computedStyle.display === 'none') {
    console.warn('要素がdisplay: noneです');
}

// 3. コンテナの存在確認
const container = document.getElementById('pin-highlighter-container');
if (!container) {
    console.error('ハイライトコンテナが存在しません');
}
```

#### 2. ハイライトの位置がずれる

```javascript
// スクロール位置を考慮した位置計算
function getAccuratePosition(element) {
    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    return {
        left: rect.left + scrollX,
        top: rect.top + scrollY,
        width: rect.width,
        height: rect.height
    };
}

// ハイライト更新（スクロール時）
window.addEventListener('scroll', () => {
    // アクティブなハイライトを更新
    highlighter.overlays.forEach((overlay, element) => {
        const newPos = getAccuratePosition(element);
        overlay.style.left = newPos.left + 'px';
        overlay.style.top = newPos.top + 'px';
    });
});
```

#### 3. パフォーマンス問題

```javascript
// throttle間隔を調整
const highPerformanceHighlighter = new PurePinHighlighter({
    style: {
        throttle: 32  // 30fpsに下げてパフォーマンス向上
    }
});

// またはハイライト機能を制限
const minimalHighlighter = new PurePinHighlighter({
    style: {
        showElementInfo: false,  // 情報表示無効
        showPinPreview: false    // ピンプレビュー無効
    }
});
```

#### 4. メモリリーク

```javascript
// 必ずcleanup()を呼び出す
window.addEventListener('beforeunload', () => {
    highlighter.cleanup();
});

// 個別のハイライトを削除
const { cleanup } = highlighter.highlight(element);
// ...
cleanup();  // 必ず呼び出す

// ハイライトモードを終了
highlighter.stopHighlightMode();
```

### デバッグ情報

```javascript
// ハイライト状態の確認
console.log('ハイライトモード:', highlighter.highlightMode);
console.log('現在のハイライト:', highlighter.currentHighlight);
console.log('オーバーレイ数:', highlighter.overlays.size);

// DOM状態の確認
const overlays = document.querySelectorAll('.pin-highlighter-overlay');
console.log('オーバーレイ要素数:', overlays.length);

const container = document.getElementById('pin-highlighter-container');
console.log('コンテナ存在:', !!container);

// イベントリスナーの確認
console.log('マウスハンドラー数:', highlighter.mouseHandlers.size);
```

---

## 📚 参考資料

### 関連ドキュメント

- [SPEC.md](./SPEC.md) - 技術仕様書
- [PureEnvironmentObserver](../environment-observer/README.md) - 環境監視モジュール
- [PureScaleCalculator](../scale-calculator/README.md) - スケール計算モジュール
- [PinSystemIntegrator](../pin-system/README.md) - 統合制御システム

### 設計思想

- [ElementObserver Phase 3-B設計書](../../docs/ELEMENT_OBSERVER_PHASE3B_MICROMODULE_DESIGN.md)
- [マイクロモジュール設計原則](../../docs/micromodules/)

### UI/UX参考

- **Chrome DevTools Elements**: F12開発者ツールの要素ハイライト
- **Firefox Inspector**: ブラウザ標準の要素検査機能
- **VS Code Extension Hover**: エディターの情報表示パターン

---

## 🔖 バージョン情報

**Version**: 1.0  
**Phase**: ElementObserver Phase 3-B  
**Created**: 2025-08-29  
**Dependencies**: DOM操作のみ  
**Compatibility**: モダンブラウザ（IE11+）

**Author**: Claude Code  
**License**: MIT