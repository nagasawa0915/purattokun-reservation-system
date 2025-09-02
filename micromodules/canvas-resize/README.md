# 🎯 CanvasResizeController.js

Canvas物理サイズ・表示サイズ制御専用マイクロモジュール

## 📋 概要

**CanvasResizeController** は、HTML5 Canvas要素のサイズ制御を専門とするマイクロモジュールです。
手動リサイズ、自動最適化、WebGL対応など、Canvas操作に必要な機能を軽量・シンプルに提供します。

### ✨ 主な機能

- 🔄 **手動リサイズ** - 任意サイズへの物理サイズ変更
- 🎯 **自動最適化** - Spineキャラクター境界に基づく最適サイズ算出
- 🎨 **表示サイズ変更** - 高解像度保持付き表示サイズ制御
- 🔄 **リセット機能** - デフォルトサイズへの復元
- 🔧 **WebGL対応** - ビューポート自動更新
- ⚙️ **設定カスタマイズ** - 各種パラメータのカスタマイズ

## 🚀 特徴

### v3.0システム開発哲学準拠
- **シンプル設計** - Canvas操作のみに特化
- **軽量実装** - 350行程度のコンパクトな実装  
- **単一責任** - Canvasサイズ制御のみを担当
- **独立動作** - 他システムに依存しない設計

### 高度な機能
- **高解像度保持** - 表示サイズ変更時の品質維持
- **Spine統合** - Spineキャラクター境界の自動検出
- **WebGL最適化** - ビューポート自動同期
- **エラーハンドリング** - 堅牢なエラー処理

## 📦 インストール

```html
<!-- HTML に直接読み込み -->
<script src="micromodules/canvas-resize/CanvasResizeController.js"></script>
```

## 🎯 基本的な使用方法

### 1. インスタンス作成

```javascript
// 基本設定で作成
const resizer = new CanvasResizeController();

// カスタム設定で作成
const resizer = new CanvasResizeController({
  minSize: 100,           // 最小サイズ（px）
  defaultWidth: 800,      // デフォルト幅
  defaultHeight: 600,     // デフォルト高さ
  padding: 40,            // 自動最適化時の余白
  enableLogging: true,    // ログ出力ON/OFF
  onLog: console.log,     // ログコールバック
  onError: console.error, // エラーコールバック
});
```

### 2. 基本操作

```javascript
const canvas = document.getElementById('my-canvas');

// 手動リサイズ
resizer.resize(canvas, 640, 480);

// デフォルトサイズにリセット  
resizer.resetToDefault(canvas);

// WebGLビューポート更新
resizer.updateWebGLViewport(canvas);
```

### 3. 高度な機能

```javascript
// Spineキャラクター基準の自動最適化
const optimalInfo = resizer.calculateOptimalSize(spineRenderer);
if (optimalInfo) {
  resizer.applyOptimalSize(canvas, spineRenderer);
}

// 高解像度保持付き表示サイズ変更
resizer.changeDisplaySize(canvas, 400, 300, spineRenderer, {
  containerSelector: '.canvas-container',
  centerCharacter: true
});
```

## 📚 API リファレンス

### メソッド一覧

#### `resize(canvas, width, height, options)`
Canvas物理サイズを変更します。

**パラメータ:**
- `canvas` - 対象のCanvas要素
- `width` - 新しい幅（px）
- `height` - 新しい高さ（px）
- `options` - オプション設定

**戻り値:** `boolean` - 成功/失敗

#### `resetToDefault(canvas, options)`
デフォルトサイズに復元します。

#### `calculateOptimalSize(spineRenderer)`
Spineキャラクターの境界に基づいて最適サイズを計算します。

**戻り値:** `Object|null` - 最適化情報

#### `applyOptimalSize(canvas, spineRenderer, options)`
計算された最適サイズを適用します。

#### `changeDisplaySize(canvas, displayWidth, displayHeight, spineRenderer, options)`
高解像度を保持したまま表示サイズを変更します。

#### `updateWebGLViewport(canvas)`
WebGLビューポートを更新します。

#### `updateConfig(newConfig)`
設定値を更新します。

#### `getConfig()`
現在の設定値を取得します。

## 🧪 テスト環境

専用のテスト環境が用意されています：

```bash
# サーバー起動
python server.py

# テストページアクセス
http://localhost:8000/test-canvas-resize-controller.html
```

### テスト項目
- ✅ 基本リサイズ機能
- ✅ デフォルトリセット機能
- ✅ 表示サイズ変更機能
- ✅ WebGL対応確認
- ✅ 設定値カスタマイズ
- ✅ 総合動作テスト

## 🔧 設定オプション

```javascript
{
  minSize: 100,              // 最小サイズ（px）
  defaultWidth: 800,         // デフォルト幅
  defaultHeight: 600,        // デフォルト高さ
  padding: 40,               // 自動最適化時の余白
  minScale: 0.5,             // 最小スケール比率
  enableLogging: true,       // ログ出力ON/OFF
  onLog: console.log,        // ログコールバック関数
  onError: console.error,    // エラーコールバック関数
}
```

## 📊 パフォーマンス

- **ファイルサイズ**: ~15KB（コメント込み）
- **実行時メモリ**: 最小限
- **処理速度**: 高速（同期処理）
- **互換性**: モダンブラウザ全対応

## 🔄 他モジュールとの連携

### StableSpineRenderer との統合

```javascript
// StableSpineRenderer + CanvasResizeController
const spineRenderer = window.StableSpineRenderer.createForCharacter({
  canvas: canvas,
  characterName: 'purattokun'
});

const resizer = new CanvasResizeController();

// Spine境界基準の自動最適化
resizer.applyOptimalSize(canvas, spineRenderer);
```

### バウンディングボックスシステムとの統合

```javascript
// Canvas サイズ変更後にBB再作成
resizer.resize(canvas, 400, 300);

if (boundingBoxSystem) {
  await boundingBoxSystem.recreate();
}
```

## 🎯 使用例・応用

### 1. レスポンシブ Canvas

```javascript
function makeCanvasResponsive() {
  const resizer = new CanvasResizeController();
  
  window.addEventListener('resize', () => {
    const container = document.querySelector('.canvas-container');
    const newWidth = container.offsetWidth;
    const newHeight = container.offsetHeight;
    
    resizer.changeDisplaySize(canvas, newWidth, newHeight);
  });
}
```

### 2. 動的品質調整

```javascript
function adjustCanvasQuality(qualityLevel) {
  const resizer = new CanvasResizeController();
  const baseSize = { width: 800, height: 600 };
  
  const scales = {
    low: 0.5,     // 400x300
    medium: 0.75, // 600x450  
    high: 1.0,    // 800x600
    ultra: 1.5    // 1200x900
  };
  
  const scale = scales[qualityLevel] || 1.0;
  const newWidth = baseSize.width * scale;
  const newHeight = baseSize.height * scale;
  
  resizer.resize(canvas, newWidth, newHeight);
}
```

## 🚨 注意事項

- Canvas物理サイズ変更時はWebGLコンテキストの再初期化が推奨されます
- 極端に大きなサイズ（4096px超）は避けてください
- Spine統合機能は `spine.js` ライブラリが必要です

## 📋 更新履歴

### v1.0.0 (2025-09-02)
- ✅ 初期リリース
- ✅ 基本リサイズ機能実装
- ✅ 自動最適化機能実装
- ✅ WebGL対応実装
- ✅ テスト環境構築完了

## 🤝 貢献

このモジュールは v3.0システム開発哲学に基づいて開発されています：
- シンプル・軽量・複雑化回避
- 必要最小限の機能実装
- 既存機能の安定化優先

## 📄 ライセンス

このプロジェクトの一部として提供されています。

---

**🎯 CanvasResizeController - Canvas操作の決定版マイクロモジュール**