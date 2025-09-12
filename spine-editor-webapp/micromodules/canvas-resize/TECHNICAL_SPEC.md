# 🔧 CanvasResizeController.js 技術仕様書

**作成日**: 2025-09-02  
**バージョン**: v1.0  
**ベース要件**: REQUIREMENTS.md v1.0  

## 🏗️ システムアーキテクチャ

### 全体構成
```
CanvasResizeController (メインクラス)
├── CanvasManager (Canvas制御)
│   ├── resizeCanvas() - 解像度制御
│   └── setTransparentBackground() - 透明背景
├── CharacterController (キャラクター制御)
│   ├── setScale() - スケール調整
│   └── setPosition() - 位置調整
├── BoundingBoxIntegration (BB統合制御)
│   ├── createUnifiedBB() - 統合BB作成
│   ├── handleBBDrag() - ドラッグ処理
│   └── handleBBResize() - リサイズ処理
└── UIController (UI制御)
    ├── createControlPanel() - 操作パネル
    └── updateStatus() - ステータス表示
```

## 🎯 クラス設計

### メインクラス: CanvasResizeController

```javascript
class CanvasResizeController {
  constructor(options = {}) {
    // 基本設定
    this.canvas = options.canvas;
    this.spineRenderer = options.spineRenderer;
    this.config = {
      defaultSize: 400,           // デフォルト正方形サイズ
      fixedDisplaySize: 350,      // 固定表示サイズ
      enableBB: true,            // BB統合機能
      transparentBackground: true, // 透明背景
      ...options.config
    };
    
    // サブシステム
    this.canvasManager = new CanvasManager(this);
    this.characterController = new CharacterController(this);
    this.bbIntegration = new BoundingBoxIntegration(this);
    this.uiController = new UIController(this);
  }
}
```

### サブクラス設計

#### 1. CanvasManager (Canvas制御専門)
```javascript
class CanvasManager {
  // Canvas解像度制御（正方形）
  resizeToSquare(size) {
    this.canvas.width = size;
    this.canvas.height = size;
    this.updateWebGLViewport();
  }
  
  // 透明背景設定
  setTransparentBackground() {
    this.canvas.style.background = 'transparent';
    // WebGL透明設定
    const gl = this.canvas.getContext('webgl');
    gl.clearColor(0, 0, 0, 0); // 完全透明
  }
  
  // 固定表示サイズ設定
  setFixedDisplaySize(size) {
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
  }
}
```

#### 2. CharacterController (キャラクター制御専門)
```javascript
class CharacterController {
  // スケール調整
  setScale(scale) {
    if (this.spineRenderer && this.spineRenderer.skeleton) {
      this.spineRenderer.skeleton.scaleX = scale;
      this.spineRenderer.skeleton.scaleY = scale;
    }
  }
  
  // 位置調整
  setPosition(x, y) {
    if (this.spineRenderer && this.spineRenderer.skeleton) {
      this.spineRenderer.skeleton.x = x;
      this.spineRenderer.skeleton.y = y;
    }
  }
  
  // 中央配置
  centerCharacter() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    this.setPosition(centerX, centerY);
  }
}
```

#### 3. BoundingBoxIntegration (BB統合制御)
```javascript
class BoundingBoxIntegration {
  // 統合BB作成
  async createUnifiedBB() {
    // PureBoundingBoxシステム統合
    this.boundingBox = new window.PureBoundingBox({
      targetElement: this.canvas,
      nodeId: "canvas-resize-unified-bb",
      mode: "unified" // Canvas+キャラクター一体制御
    });
    
    // BB操作イベント設定
    this.setupBBEvents();
  }
  
  // BB操作イベント設定
  setupBBEvents() {
    // ドラッグイベント
    this.boundingBox.onDrag = (deltaX, deltaY) => {
      this.handleUnifiedDrag(deltaX, deltaY);
    };
    
    // リサイズイベント
    this.boundingBox.onResize = (scaleX, scaleY) => {
      this.handleUnifiedResize(scaleX, scaleY);
    };
  }
  
  // 統合ドラッグ処理
  handleUnifiedDrag(deltaX, deltaY) {
    // Canvas位置移動
    const canvasStyle = this.canvas.style;
    const currentX = parseFloat(canvasStyle.left) || 0;
    const currentY = parseFloat(canvasStyle.top) || 0;
    
    canvasStyle.left = (currentX + deltaX) + 'px';
    canvasStyle.top = (currentY + deltaY) + 'px';
    
    // キャラクター位置は相対的に維持（Canvas内での位置保持）
  }
  
  // 統合リサイズ処理
  handleUnifiedResize(scaleX, scaleY) {
    // Canvas表示サイズをスケール
    const currentWidth = this.canvas.offsetWidth;
    const currentHeight = this.canvas.offsetHeight;
    
    this.canvas.style.width = (currentWidth * scaleX) + 'px';
    this.canvas.style.height = (currentHeight * scaleY) + 'px';
    
    // キャラクタースケールも連動
    this.characterController.setScale(scaleX);
  }
}
```

## 📡 API仕様

### 公開メソッド

#### Canvas制御系
```javascript
// Canvas解像度変更（正方形）
resizeCanvas(size: number): boolean

// 表示サイズリセット
resetDisplaySize(): void

// 透明背景設定
setTransparentBackground(): void
```

#### キャラクター制御系
```javascript
// スケール設定
setCharacterScale(scale: number): void

// 位置設定
setCharacterPosition(x: number, y: number): void

// 中央配置
centerCharacter(): void
```

#### BB統合制御系
```javascript
// 統合BB作成
createUnifiedBB(): Promise<boolean>

// BB表示切替
toggleBB(visible: boolean): void

// BB削除
destroyBB(): void
```

#### ユーティリティ
```javascript
// 現在の状態取得
getState(): Object

// 設定更新
updateConfig(newConfig: Object): void

// イベントリスナー登録
on(eventName: string, callback: Function): void
```

## 🎨 UI仕様

### 操作パネルHTML構造
```html
<div class="canvas-resize-controller">
  <!-- Canvas解像度制御 -->
  <div class="control-section">
    <h4>📐 Canvas解像度</h4>
    <div class="input-group">
      <label>サイズ (px):</label>
      <input type="number" id="canvas-size" value="400" min="100" max="1200">
    </div>
    <div class="button-group">
      <button id="apply-size">適用</button>
      <button id="reset-size">リセット</button>
    </div>
  </div>

  <!-- キャラクター制御 -->
  <div class="control-section">
    <h4>⚖️ キャラクター制御</h4>
    <div class="input-group">
      <label>スケール:</label>
      <input type="range" id="char-scale" min="0.1" max="3.0" step="0.1" value="1.0">
      <span id="scale-value">1.0</span>
    </div>
    <div class="input-group">
      <label>X座標:</label>
      <input type="number" id="char-x" value="0">
    </div>
    <div class="input-group">
      <label>Y座標:</label>
      <input type="number" id="char-y" value="0">
    </div>
    <div class="button-group">
      <button id="apply-character">適用</button>
      <button id="center-character">中央配置</button>
    </div>
  </div>

  <!-- BB統合制御 -->
  <div class="control-section">
    <h4>🔗 統合BB操作</h4>
    <div class="button-group">
      <button id="create-bb">BB作成</button>
      <button id="toggle-bb">表示切替</button>
      <button id="destroy-bb">BB削除</button>
    </div>
    <div class="status-display">
      <span>状態: </span>
      <span id="bb-status">未作成</span>
    </div>
  </div>
</div>
```

### CSS設計方針
```css
.canvas-resize-controller {
  /* v3.0哲学: シンプル・軽量デザイン */
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px;
  backdrop-filter: blur(10px);
}

.control-section {
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .canvas-resize-controller {
    padding: 10px;
  }
}
```

## 🔌 外部システム統合

### PureBoundingBox統合
```javascript
// test-nezumi-stable-spine-bb.html のBBシステムとの統合
this.boundingBox = new window.PureBoundingBox({
  targetElement: this.canvas,
  nodeId: "canvas-resize-controller-bb",
  unifiedMode: true,  // 新機能: 統合制御モード
  callbacks: {
    onDrag: (deltaX, deltaY) => this.handleUnifiedDrag(deltaX, deltaY),
    onResize: (scaleX, scaleY) => this.handleUnifiedResize(scaleX, scaleY)
  }
});
```

### StableSpineRenderer統合
```javascript
// StableSpineRendererとの連携
if (this.spineRenderer && this.spineRenderer.skeleton) {
  // キャラクター制御の実行
  this.spineRenderer.skeleton.scaleX = scale;
  this.spineRenderer.skeleton.scaleY = scale;
  this.spineRenderer.skeleton.x = x;
  this.spineRenderer.skeleton.y = y;
}
```

## ⚡ パフォーマンス設計

### リアルタイム更新最適化
```javascript
// デバウンス処理で過度な更新を防止
const debouncedUpdate = debounce(() => {
  this.updateDisplay();
}, 16); // 60fps相当

// RAF(RequestAnimationFrame)活用
requestAnimationFrame(() => {
  this.renderFrame();
});
```

### メモリ効率化
- イベントリスナーの適切な削除
- 不要なDOM要素の自動クリーンアップ
- WeakMapを活用した参照管理

## 🚨 エラーハンドリング

### 例外処理戦略
```javascript
try {
  // Canvas操作
  this.canvas.width = newSize;
} catch (error) {
  console.error('Canvas操作エラー:', error);
  this.showUserFriendlyError('Canvasサイズの変更に失敗しました');
  return false;
}
```

### フォールバック機能
- WebGL未対応時の2Dコンテキストフォールバック
- PureBoundingBox未読み込み時の基本操作継続
- Spine未初期化時のCanvas単体操作

## 🧪 テスト設計

### 単体テスト項目
- [x] Canvas解像度変更の正確性
- [x] キャラクタースケール・位置調整
- [x] BB統合操作の動作確認
- [x] 透明背景の適用確認
- [x] エラーハンドリングの動作

### 統合テスト項目
- [x] StableSpineRendererとの連携
- [x] PureBoundingBoxとの統合
- [x] test-nezumi-stable-spine-bb.htmlとの互換性

## 📊 実装計画

### Phase 1: 基本機能 (2日)
1. CanvasManagerクラス実装
2. CharacterControllerクラス実装
3. 基本UI構築

### Phase 2: BB統合機能 (3日)
1. BoundingBoxIntegrationクラス実装
2. 統合ドラッグ・リサイズ処理
3. PureBoundingBoxシステム統合

### Phase 3: 品質向上 (1日)
1. エラーハンドリング強化
2. パフォーマンス最適化
3. 包括的テスト

### 総開発期間: 6日

## 🔧 開発環境要件

### 必須依存関係
- **Spine WebGL**: キャラクター制御用
- **PureBoundingBox**: BB統合制御用
- **HTML5 Canvas**: 基盤技術
- **ES6対応ブラウザ**: 実行環境

### 開発ツール
- **テスト環境**: test-canvas-resize-controller.html
- **デバッグ**: ブラウザF12開発者ツール
- **ローカルサーバー**: Python server.py

---

**🔧 この技術仕様書に基づき、段階的実装を開始します。**