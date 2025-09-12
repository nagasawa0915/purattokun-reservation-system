# CanvasResizeController マイクロモジュール

🎛️ **HTML iframe統合による完全分離型Canvas制御UI**

## 概要

CanvasResizeControllerは、iframe + postMessage通信を使用してCanvas制御UIを完全に分離したマイクロモジュールです。HTMLサイトとElectronデスクトップアプリの両方で同一のUIを利用できます。

## 特徴

- ✅ **完全分離設計**: iframe による CSS・JavaScript の完全分離
- ✅ **双方向通信**: postMessage による安全な通信システム  
- ✅ **デスクトップアプリ対応**: Electron等での再利用可能
- ✅ **リアルタイムUI**: スライダー操作による即座の反映
- ✅ **オレンジBB連携**: 視覚フィードバック機能統合
- ✅ **状態同期**: iframe ⟷ メインページ間の双方向同期

## ファイル構成

```
micromodules/canvas-resize/
├── ui.html          # UI専用HTMLファイル（独立実行可能）
├── ui.css           # UI専用スタイル（完全分離）
├── ui.js            # iframe側制御JavaScript
└── README.md        # 本ファイル（使用方法・API仕様）
```

## 基本的な使用方法

### 1. HTML側での統合

```html
<!-- メインHTMLファイルに iframe を埋め込み -->
<div class="canvas-controls">
  <iframe 
    src="./micromodules/canvas-resize/ui.html" 
    id="canvas-resize-iframe"
    width="100%" 
    height="500"
    frameborder="0">
  </iframe>
</div>
```

### 2. JavaScript側での通信処理

```javascript
// postMessage 受信ハンドラー
window.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'canvasResize':
      canvas.width = data.size;
      canvas.height = data.size;
      break;
    case 'scaleChanged':
      spineRenderer.setTransform(null, null, data.scaleX, data.scaleY);
      break;
    // その他のイベント処理...
  }
});
```

## API仕様

### iframe → メインページ（送信）

| メッセージタイプ | データ | 説明 |
|-----------------|--------|------|
| `canvasResize` | `{size: number}` | Canvas解像度変更 |
| `canvasReset` | `{}` | Canvas解像度リセット |
| `scaleChanged` | `{axis, scaleX, scaleY}` | リアルタイムスケール変更 |
| `positionChanged` | `{axis, x, y}` | リアルタイム位置変更 |
| `scaleReset` | `{scaleX, scaleY}` | スケールリセット |
| `positionReset` | `{x, y}` | 位置リセット |
| `centerCharacter` | `{x, y}` | 中央配置 |
| `naturalRatioDetect` | `{scaleX, scaleY}` | 自然比率検出 |
| `detectBounds` | `{}` | 境界検出テスト |
| `applyOptimal` | `{}` | 最適サイズ適用 |
| `testMedium` | `{}` | 中サイズテスト |
| `debugInfo` | `{}` | デバッグ情報表示 |
| `clearLog` | `{}` | ログクリア |
| `uiReady` | `{state}` | UI初期化完了 |
| `uiLog` | `{message}` | iframeログメッセージ |

### メインページ → iframe（送信）

| メッセージタイプ | データ | 説明 |
|-----------------|--------|------|
| `updateUIState` | `{canvasSize, scaleX, scaleY, positionX, positionY}` | UI状態更新 |
| `showBBFeedback` | `{type}` | BBビジュアルフィードバック |
| `logMessage` | `{message}` | ログメッセージ送信 |

## 実装例：test-nezumi-stable-spine-bb.html

現在の統合実装では以下の機能が動作しています：

### 完全統合済み機能

1. **Canvas解像度制御**
   - 正方形サイズ入力（100-1200px）
   - リアルタイム表示更新
   - WebGLビューポート同期更新

2. **キャラクタースケール調整**  
   - 比率ロック機能（Y/X比率保持）
   - リアルタイムスケール変更
   - オレンジBB視覚フィードバック

3. **キャラクター位置調整**
   - リアルタイム位置変更  
   - 中央配置・リセット機能
   - オレンジBB視覚フィードバック

4. **自動最適化機能**
   - 境界検出テスト
   - 最適サイズ適用
   - 表示サイズテスト

### 通信処理クラス

`CanvasResizeIframeHandler` クラスが以下を担当：

- iframe読み込み管理
- postMessage通信処理  
- 状態同期（メイン ⟷ iframe）
- 既存機能との統合
- ログ統合管理

## デスクトップアプリでの使用

```javascript
// Electron等での利用例
const { BrowserWindow } = require('electron');

// 専用ウィンドウでUI表示
const controlWindow = new BrowserWindow({
  width: 300,
  height: 600,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true
  }
});

// マイクロモジュールUIを直接読み込み
controlWindow.loadFile('micromodules/canvas-resize/ui.html');

// IPCでメインプロセスと通信
controlWindow.webContents.on('ipc-message', (event, message) => {
  // Canvas制御処理...
});
```

## カスタマイズ

### UIスタイルのカスタマイズ

`ui.css` を編集してスタイルを変更：

```css
/* テーマカラー変更例 */
:root {
  --primary-color: #your-color;
  --accent-color: #your-accent;
}

.control-group {
  /* カスタムスタイル */
}
```

### 機能拡張

`ui.js` に新しい制御機能を追加：

```javascript
// 新機能追加例
handleCustomFunction(data) {
  this.sendToParent('customFunction', {
    // カスタムデータ
  });
}
```

## トラブルシューティング

### よくある問題

1. **iframe が読み込まれない**
   - ファイルパスを確認
   - HTTPサーバー経由で実行（file://プロトコルは制限あり）

2. **postMessage が届かない**
   - セキュリティチェック（origin確認）  
   - iframe読み込み完了待機

3. **機能が動作しない**
   - ブラウザのF12コンソールでエラー確認
   - iframe内のコンソールも確認

### デバッグ方法

```javascript
// iframe内でのデバッグ
console.log('[CanvasResizeUI]', '状態:', this.state);

// メインページでのデバッグ  
window.canvasResizeHandler.log('デバッグメッセージ');
```

## 将来の拡張予定

- [ ] React/Vue.js版UI作成
- [ ] Web Components対応
- [ ] npm パッケージ化
- [ ] TypeScript対応
- [ ] より多くのCanvas制御機能

---

## 更新履歴

**v1.0.0** (2025-01-XX)
- 初回リリース
- iframe + postMessage 基本実装
- test-nezumi-stable-spine-bb.html 統合完了
- オレンジBB連携機能実装