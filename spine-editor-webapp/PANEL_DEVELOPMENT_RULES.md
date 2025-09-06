# 🛡️ パネル開発安全ルールブック

**Version**: 1.0  
**対象**: シンプル司令塔システム (`index-coordinator-simple.html`)  
**目的**: 複数AIによる並行パネル開発での競合防止・品質保証  
**更新日**: 2025-09-06

## 📋 ルールブック概要

### 🎯 このルールブックの目的
- **競合ゼロ**: 司令塔システムとパネル実装の同時開発で問題を回避
- **品質保証**: 一定品質でのパネル機能実装を保証
- **効率化**: 他のAI・開発者が迷わずパネル実装できる明確な指針
- **安全性**: 既存システムを破壊しない段階的開発手順

### ✅ 適用範囲
- パネル内容の実装（アウトライナー、プレビュー、プロパティ、タイムライン）
- パネル固有のUI・機能追加
- パネル間の連携機能
- 外部ライブラリ統合

---

## 🚨 変更禁止事項（絶対ルール）

### 🔒 **Level 1: 絶対に触れてはいけない部分**
**違反 = システム完全破壊**

#### 🏗️ DOM構造（HTMLレイアウト）
```html
<!-- 🚨 変更禁止 -->
<body>
  <div class="top-bar">...</div>
  <div class="panel panel-outliner" data-panel="outliner">...</div>
  <div class="panel panel-preview" data-panel="preview">...</div>
  <div class="panel panel-properties" data-panel="properties">...</div>
  <div class="panel panel-timeline" data-panel="timeline">...</div>
  <div class="resize-handle resize-handle-left" data-direction="left"></div>
  <div class="resize-handle resize-handle-right" data-direction="right"></div>
  <div class="resize-handle resize-handle-timeline" data-direction="timeline"></div>
  <div class="drop-zone" id="drop-zone"></div>
</body>
```

#### 📐 CSS Grid システム
```css
/* 🚨 変更禁止 */
body {
    display: grid;
    grid-template-areas: 
        "header header header"
        "outliner preview properties"
        "timeline timeline timeline";
    grid-template-columns: var(--outliner-width, 300px) 1fr var(--properties-width, 300px);
    grid-template-rows: 60px 1fr var(--timeline-height, 200px);
}

.panel-outliner { grid-area: outliner; }
.panel-preview { grid-area: preview; }
.panel-properties { grid-area: properties; }
.panel-timeline { grid-area: timeline; }
```

#### ⚡ JavaScript システム核心部
```javascript
// 🚨 変更禁止
class SimpleSystemCoordinator {
    constructor() { /* ... */ }
    registerPanels() { /* ... */ }
    initializeResizeHandles() { /* ... */ }
    initializeDragDrop() { /* ... */ }
}
```

#### 🎛️ CSS変数システム
```css
/* 🚨 変更禁止 */
:root {
    --outliner-width: 300px;
    --properties-width: 300px;
    --timeline-height: 200px;
}
```

### 🔒 **Level 2: 慎重な変更が必要な部分**
**違反 = 機能不具合**

#### 🏷️ Data属性
```html
<!-- ⚠️ 変更には十分注意 -->
<div class="panel panel-outliner" data-panel="outliner">
```
**理由**: 司令塔システムがパネル識別に使用

#### 🎨 パネル共通クラス
```css
/* ⚠️ 基本構造の変更は慎重に */
.panel {
    background: #2d2d2d;
    border: 1px solid #404040;
    display: flex;
    flex-direction: column;
    position: relative;
}

.panel-header {
    height: 32px;
    background: #3a3a3a;
    /* ... */
}

.panel-content {
    flex: 1;
    padding: 15px;
    overflow: auto;
}
```

---

## ✅ 変更可能事項（自由実装エリア）

### 🎯 **Level 1: 完全に自由な部分**
**自由度 = 100%**

#### 📦 パネルコンテンツ内部
```html
<!-- ✅ 自由に実装可能 -->
<div class="panel-content">
    <!-- この中は完全に自由 -->
    <div class="your-custom-ui">...</div>
    <canvas id="spine-preview">...</canvas>
    <form class="property-form">...</form>
    <!-- 任意のHTML構造 -->
</div>
```

#### 🎨 カスタムスタイル
```css
/* ✅ 自由に追加可能 */
.your-custom-class {
    /* 任意のスタイル */
}

.panel-content .custom-ui {
    /* パネル内の独自UI */
}
```

#### ⚙️ パネル固有JavaScript
```javascript
// ✅ 自由に実装可能
class YourPanelManager {
    constructor() {
        this.initializePanel();
    }
    
    initializePanel() {
        // パネル内の機能実装
    }
}
```

### 🎯 **Level 2: 推奨実装パターン**
**ガイドライン準拠で品質向上**

#### 📋 パネルタイトル変更
```html
<!-- ✅ 推奨: 意味のあるタイトルに変更 -->
<div class="panel-header">
    <span class="panel-title">🔧 詳細プロパティ</span>
</div>
```

#### 🎛️ 動的コンテンツ更新
```javascript
// ✅ 推奨: コンテンツエリアのみ操作
function updatePanelContent(panelId, htmlContent) {
    const panel = document.querySelector(`[data-panel="${panelId}"] .panel-content`);
    if (panel) {
        panel.innerHTML = htmlContent;
    }
}
```

---

## 📐 推奨実装パターン

### 🎯 **Pattern 1: シンプルUI追加**
```html
<!-- プロパティパネルにフォーム追加例 -->
<div class="panel-content">
    <div class="property-section">
        <h4 class="section-title">位置調整</h4>
        <div class="input-group">
            <label>X座標</label>
            <input type="number" class="coord-input" data-axis="x">
        </div>
        <div class="input-group">
            <label>Y座標</label>
            <input type="number" class="coord-input" data-axis="y">
        </div>
    </div>
</div>
```

```css
/* 対応するCSS */
.property-section {
    margin-bottom: 20px;
    padding: 10px;
    background: #3a3a3a;
    border-radius: 4px;
}

.section-title {
    color: #ffffff;
    font-size: 14px;
    margin-bottom: 10px;
}

.input-group {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
}

.input-group label {
    width: 60px;
    color: #cccccc;
    font-size: 12px;
}

.coord-input {
    flex: 1;
    background: #1a1a1a;
    border: 1px solid #555555;
    color: white;
    padding: 4px 8px;
    border-radius: 2px;
}
```

### 🎯 **Pattern 2: Canvas/WebGL統合**
```html
<!-- プレビューパネルにCanvas追加例 -->
<div class="panel-content">
    <div class="canvas-container">
        <canvas id="spine-canvas" class="main-canvas"></canvas>
        <div class="canvas-controls">
            <button class="canvas-btn" data-action="play">▶️</button>
            <button class="canvas-btn" data-action="pause">⏸️</button>
            <button class="canvas-btn" data-action="reset">🔄</button>
        </div>
    </div>
</div>
```

```javascript
// Canvas初期化の推奨パターン
class SpinePreviewManager {
    constructor() {
        this.canvas = null;
        this.renderer = null;
        this.initializeCanvas();
    }
    
    initializeCanvas() {
        const container = document.querySelector('[data-panel="preview"] .panel-content');
        if (!container) {
            console.error('プレビューパネルが見つかりません');
            return;
        }
        
        this.canvas = document.getElementById('spine-canvas');
        if (this.canvas) {
            this.setupRenderer();
            this.bindEvents();
        }
    }
    
    setupRenderer() {
        // WebGL・Spineレンダラーの初期化
        // パネルサイズに合わせて自動リサイズ
        const resizeObserver = new ResizeObserver(() => {
            this.resizeCanvas();
        });
        resizeObserver.observe(this.canvas.parentElement);
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }
}
```

### 🎯 **Pattern 3: パネル間通信**
```javascript
// 安全なパネル間データ共有パターン
class PanelCommunicator {
    constructor() {
        this.eventBus = new EventTarget();
    }
    
    // データ送信
    broadcast(eventType, data) {
        this.eventBus.dispatchEvent(new CustomEvent(eventType, { detail: data }));
    }
    
    // データ受信
    subscribe(eventType, callback) {
        this.eventBus.addEventListener(eventType, callback);
    }
}

// グローバル通信バス
window.panelCommunicator = new PanelCommunicator();

// 使用例：プロパティ変更をプレビューに通知
function onPropertyChange(x, y, scale) {
    window.panelCommunicator.broadcast('property:update', { x, y, scale });
}

// プレビューパネルで受信
window.panelCommunicator.subscribe('property:update', (event) => {
    const { x, y, scale } = event.detail;
    updateSpineCharacter(x, y, scale);
});
```

---

## 🔄 競合回避方法

### 🛡️ **Rule 1: 段階的実装手順**
**必須**: 以下の順番で実装すること

```
1. 📋 計画フェーズ
   ├─ 実装対象パネルの決定
   ├─ 必要な機能の明確化
   └─ 競合可能性の事前確認

2. 🧪 テスト環境準備
   ├─ ローカルコピーでの動作確認
   ├─ 司令塔システムの正常動作確認
   └─ バックアップファイル作成

3. 🔧 最小限実装
   ├─ HTML構造の最小限追加
   ├─ 基本CSS適用
   └─ JavaScript機能の核心部分のみ

4. ✅ 動作確認
   ├─ 司令塔機能の正常動作確認
   ├─ パネルリサイズ機能確認
   └─ D&D機能確認

5. 🚀 本実装
   ├─ 詳細UI実装
   ├─ 高度機能追加
   └─ 最終テスト
```

### 🛡️ **Rule 2: 安全な変更方法**

#### ✅ **DO: 推奨される変更方法**
```javascript
// ✅ パネル内容のみ変更
function safeUpdatePanel(panelId, content) {
    const panelContent = document.querySelector(`[data-panel="${panelId}"] .panel-content`);
    if (panelContent) {
        panelContent.innerHTML = content;
    }
}

// ✅ CSSクラス追加（既存クラスに影響なし）
function addCustomStyle() {
    const style = document.createElement('style');
    style.textContent = `
        .my-custom-panel-ui {
            /* 独自スタイル */
        }
    `;
    document.head.appendChild(style);
}

// ✅ イベントリスナー追加（競合なし）
function bindPanelEvents(panelId) {
    const panel = document.querySelector(`[data-panel="${panelId}"]`);
    if (panel) {
        panel.addEventListener('custom:event', handleCustomEvent);
    }
}
```

#### ❌ **DON'T: 危険な変更方法**
```javascript
// ❌ DOM構造の直接変更
document.body.innerHTML = '...';

// ❌ 司令塔のイベント上書き
document.removeEventListener('mousemove', existingHandler);

// ❌ CSS Gridの直接変更
document.body.style.gridTemplateAreas = '...';

// ❌ パネル要素の削除・移動
panelElement.remove();
parentElement.appendChild(panelElement);
```

### 🛡️ **Rule 3: 競合検出方法**

#### 🔍 事前確認チェックリスト
```javascript
// 司令塔システム正常性確認
function checkCoordinatorHealth() {
    const checks = {
        coordinatorExists: typeof window.simpleCoordinator !== 'undefined',
        coordinatorReady: window.simpleCoordinator?.state === 'ready',
        panelsRegistered: window.simpleCoordinator?.panels?.size === 4,
        resizeWorking: window.simpleCoordinator?.resizeHandles?.size === 3,
        dragDropWorking: typeof window.simpleCoordinator?.startPanelDrag === 'function'
    };
    
    console.log('🔍 司令塔システム健康診断:', checks);
    return Object.values(checks).every(Boolean);
}

// 実装前の必須確認
function preImplementationCheck() {
    console.log('🚀 実装前チェック開始');
    
    if (!checkCoordinatorHealth()) {
        console.error('❌ 司令塔システムに問題あり - 実装を中止してください');
        return false;
    }
    
    console.log('✅ 実装前チェック完了 - 実装開始可能');
    return true;
}
```

#### 🔍 実装後確認チェックリスト
```javascript
// 実装後の動作確認
function postImplementationCheck() {
    console.log('🔍 実装後チェック開始');
    
    const checks = {
        coordinatorStillWorking: checkCoordinatorHealth(),
        panelResizable: testResizeFunctionality(),
        panelDraggable: testDragDropFunctionality(),
        layoutIntact: testLayoutIntegrity()
    };
    
    console.log('📊 実装後チェック結果:', checks);
    
    if (!Object.values(checks).every(Boolean)) {
        console.error('❌ 実装が司令塔システムに悪影響 - ロールバックを検討');
        return false;
    }
    
    console.log('✅ 実装後チェック完了 - 実装成功');
    return true;
}

function testResizeFunctionality() {
    // リサイズハンドルの動作確認
    const handles = document.querySelectorAll('.resize-handle');
    return handles.length === 3;
}

function testDragDropFunctionality() {
    // D&D機能の確認
    return typeof window.simpleCoordinator?.startPanelDrag === 'function';
}

function testLayoutIntegrity() {
    // レイアウト整合性の確認
    const panels = document.querySelectorAll('.panel');
    return panels.length === 4;
}
```

---

## 🧪 テスト手順

### 📋 **基本動作テスト（必須）**

#### Step 1: 司令塔システム起動確認
```bash
# サーバー起動
python3 server.py

# ブラウザでアクセス
http://localhost:8000/index-coordinator-simple.html
```

```javascript
// ブラウザコンソールで確認
debugCoordinator();
// 期待結果: システム状態が「ready」
```

#### Step 2: パネル機能テスト
```javascript
// F12コンソールで以下を実行

// ✅ パネルリサイズテスト
console.log('🔧 リサイズテスト開始');
// 左側のハンドルをドラッグしてアウトライナーパネルの幅を変更

// ✅ パネルD&Dテスト
console.log('🔄 D&Dテスト開始');
// パネルヘッダーをドラッグして他のパネルとの位置交換

// ✅ レイアウトリセットテスト
resetLayout();
console.log('✅ レイアウトリセット完了');
```

#### Step 3: 実装品質テスト
```javascript
// 実装前チェック
preImplementationCheck();

// パネル実装
// [あなたの実装コード]

// 実装後チェック
postImplementationCheck();
```

### 🔧 **詳細テスト項目**

#### UI/UX品質テスト
- [ ] パネル内スクロール動作確認
- [ ] レスポンシブ対応確認（ウィンドウリサイズ）
- [ ] ダークテーマ整合性確認
- [ ] フォント・色調整合性確認

#### パフォーマンステスト
- [ ] Canvas描画fps確認（60fps維持）
- [ ] 大量データ表示時の動作確認
- [ ] メモリリーク検出
- [ ] イベントリスナー重複防止

#### 互換性テスト
- [ ] Chrome動作確認
- [ ] Firefox動作確認  
- [ ] Safari動作確認（可能であれば）
- [ ] 異なる画面サイズでの動作確認

---

## 🚀 実装実例

### 📁 **実例1: アウトライナーパネル実装**

#### HTML実装
```html
<!-- 既存のパネルコンテンツを置換 -->
<div class="panel-content">
    <div class="outliner-toolbar">
        <button class="tool-btn" data-action="refresh" title="更新">🔄</button>
        <button class="tool-btn" data-action="expand-all" title="すべて展開">📂</button>
        <button class="tool-btn" data-action="collapse-all" title="すべて折り畳み">📁</button>
    </div>
    
    <div class="file-tree" id="file-tree">
        <!-- JavaScript で動的生成 -->
    </div>
</div>
```

#### CSS実装
```css
/* アウトライナー専用スタイル */
.outliner-toolbar {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
    padding: 8px;
    background: #3a3a3a;
    border-radius: 4px;
}

.tool-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: #4a4a4a;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition: background-color 0.2s;
}

.tool-btn:hover {
    background: #5a5a5a;
}

.file-tree {
    flex: 1;
    overflow: auto;
    user-select: none;
}

.tree-item {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    cursor: pointer;
    border-radius: 2px;
    margin: 1px 0;
    transition: background-color 0.2s;
}

.tree-item:hover {
    background: rgba(255, 255, 255, 0.1);
}

.tree-item.selected {
    background: rgba(0, 122, 204, 0.6);
    color: white;
}

.tree-item.folder {
    font-weight: bold;
}

.tree-item .icon {
    margin-right: 6px;
    font-size: 12px;
}

.tree-item .name {
    flex: 1;
    font-size: 13px;
}

.tree-children {
    margin-left: 20px;
    display: none;
}

.tree-children.expanded {
    display: block;
}
```

#### JavaScript実装
```javascript
class OutlinerManager {
    constructor() {
        this.treeData = null;
        this.selectedItem = null;
        this.initialize();
    }
    
    initialize() {
        console.log('📁 アウトライナー初期化開始');
        
        // 実装前チェック
        if (!preImplementationCheck()) {
            console.error('❌ アウトライナー実装中止 - 司令塔システムエラー');
            return;
        }
        
        this.bindEvents();
        this.loadFileTree();
        
        console.log('✅ アウトライナー初期化完了');
        
        // 実装後チェック
        postImplementationCheck();
    }
    
    bindEvents() {
        // ツールバーイベント
        const toolbar = document.querySelector('.outliner-toolbar');
        if (toolbar) {
            toolbar.addEventListener('click', (e) => {
                if (e.target.classList.contains('tool-btn')) {
                    this.handleToolbarAction(e.target.dataset.action);
                }
            });
        }
        
        // ファイルツリーイベント
        const fileTree = document.getElementById('file-tree');
        if (fileTree) {
            fileTree.addEventListener('click', (e) => {
                const treeItem = e.target.closest('.tree-item');
                if (treeItem) {
                    this.handleTreeItemClick(treeItem);
                }
            });
        }
    }
    
    handleToolbarAction(action) {
        switch (action) {
            case 'refresh':
                this.loadFileTree();
                break;
            case 'expand-all':
                this.expandAllItems();
                break;
            case 'collapse-all':
                this.collapseAllItems();
                break;
        }
    }
    
    handleTreeItemClick(item) {
        // 選択状態更新
        document.querySelectorAll('.tree-item.selected').forEach(el => {
            el.classList.remove('selected');
        });
        item.classList.add('selected');
        this.selectedItem = item;
        
        // フォルダーの場合は展開/折り畳み
        if (item.classList.contains('folder')) {
            const children = item.parentNode.querySelector('.tree-children');
            if (children) {
                children.classList.toggle('expanded');
            }
        }
        
        // 他のパネルに選択通知
        this.notifySelection(item.dataset.path);
    }
    
    loadFileTree() {
        // サンプルファイル構造
        const sampleData = {
            "name": "プロジェクト",
            "type": "folder",
            "children": [
                {
                    "name": "assets",
                    "type": "folder", 
                    "children": [
                        {
                            "name": "characters",
                            "type": "folder",
                            "children": [
                                { "name": "nezumi.json", "type": "file", "path": "assets/characters/nezumi.json" },
                                { "name": "nezumi.atlas", "type": "file", "path": "assets/characters/nezumi.atlas" },
                                { "name": "purattokun.json", "type": "file", "path": "assets/characters/purattokun.json" },
                                { "name": "purattokun.atlas", "type": "file", "path": "assets/characters/purattokun.atlas" }
                            ]
                        }
                    ]
                },
                { "name": "index.html", "type": "file", "path": "index.html" },
                { "name": "README.md", "type": "file", "path": "README.md" }
            ]
        };
        
        this.treeData = sampleData;
        this.renderFileTree();
    }
    
    renderFileTree() {
        const fileTree = document.getElementById('file-tree');
        if (!fileTree) return;
        
        fileTree.innerHTML = this.renderTreeNode(this.treeData);
    }
    
    renderTreeNode(node, level = 0) {
        const isFolder = node.type === 'folder';
        const icon = isFolder ? '📁' : '📄';
        const className = isFolder ? 'tree-item folder' : 'tree-item file';
        const dataPath = node.path || node.name;
        
        let html = `
            <div class="${className}" data-path="${dataPath}" style="padding-left: ${level * 20 + 8}px">
                <span class="icon">${icon}</span>
                <span class="name">${node.name}</span>
            </div>
        `;
        
        if (isFolder && node.children) {
            html += '<div class="tree-children">';
            node.children.forEach(child => {
                html += this.renderTreeNode(child, level + 1);
            });
            html += '</div>';
        }
        
        return html;
    }
    
    notifySelection(path) {
        // パネル間通信でファイル選択を通知
        if (window.panelCommunicator) {
            window.panelCommunicator.broadcast('outliner:file-selected', { path });
        }
    }
    
    expandAllItems() {
        document.querySelectorAll('.tree-children').forEach(el => {
            el.classList.add('expanded');
        });
    }
    
    collapseAllItems() {
        document.querySelectorAll('.tree-children').forEach(el => {
            el.classList.remove('expanded');
        });
    }
}

// アウトライナー自動初期化
document.addEventListener('DOMContentLoaded', () => {
    // 司令塔システム準備完了後に初期化
    const checkReady = () => {
        if (window.simpleCoordinator?.state === 'ready') {
            window.outlinerManager = new OutlinerManager();
        } else {
            setTimeout(checkReady, 100);
        }
    };
    checkReady();
});
```

### 🎬 **実例2: プレビューパネル実装（Spine統合）**

#### HTML実装
```html
<div class="panel-content">
    <div class="preview-toolbar">
        <div class="toolbar-group">
            <button class="tool-btn" data-action="load-character" title="キャラクター読み込み">📥</button>
            <select class="character-selector" id="character-selector">
                <option value="">キャラクター選択</option>
                <option value="nezumi">🐭 ねずみ</option>
                <option value="purattokun">🐱 ぷらっとくん</option>
            </select>
        </div>
        <div class="toolbar-group">
            <button class="tool-btn" data-action="play" title="再生">▶️</button>
            <button class="tool-btn" data-action="pause" title="一時停止">⏸️</button>
            <button class="tool-btn" data-action="reset" title="リセット">🔄</button>
        </div>
        <div class="toolbar-group">
            <button class="tool-btn" data-action="zoom-in" title="拡大">🔍+</button>
            <button class="tool-btn" data-action="zoom-out" title="縮小">🔍-</button>
            <button class="tool-btn" data-action="zoom-fit" title="画面に合わせる">📐</button>
        </div>
    </div>
    
    <div class="canvas-container">
        <canvas id="spine-preview-canvas"></canvas>
        <div class="canvas-overlay">
            <div class="loading-indicator" id="loading-indicator" style="display: none;">
                <div class="spinner">⏳</div>
                <div class="loading-text">読み込み中...</div>
            </div>
            <div class="error-message" id="error-message" style="display: none;">
                <div class="error-icon">❌</div>
                <div class="error-text"></div>
            </div>
        </div>
    </div>
    
    <div class="preview-status" id="preview-status">
        <div class="status-item">
            <span class="label">FPS:</span>
            <span class="value" id="fps-display">--</span>
        </div>
        <div class="status-item">
            <span class="label">アニメーション:</span>
            <span class="value" id="animation-display">--</span>
        </div>
        <div class="status-item">
            <span class="label">ズーム:</span>
            <span class="value" id="zoom-display">100%</span>
        </div>
    </div>
</div>
```

#### CSS実装
```css
/* プレビューパネル専用スタイル */
.preview-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background: #3a3a3a;
    border-radius: 4px;
    margin-bottom: 10px;
    flex-wrap: wrap;
    gap: 8px;
}

.toolbar-group {
    display: flex;
    align-items: center;
    gap: 4px;
}

.character-selector {
    background: #2a2a2a;
    color: white;
    border: 1px solid #555;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    min-width: 120px;
}

.canvas-container {
    position: relative;
    flex: 1;
    background: #1a1a1a;
    border-radius: 4px;
    overflow: hidden;
    min-height: 300px;
}

#spine-preview-canvas {
    width: 100%;
    height: 100%;
    display: block;
    background: transparent;
}

.canvas-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
}

.loading-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: #cccccc;
}

.spinner {
    font-size: 32px;
    animation: spin 2s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.loading-text {
    font-size: 14px;
}

.error-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: #ff6b6b;
    text-align: center;
    padding: 20px;
}

.error-icon {
    font-size: 48px;
}

.error-text {
    font-size: 14px;
    line-height: 1.4;
}

.preview-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background: #2a2a2a;
    border-radius: 4px;
    margin-top: 10px;
    font-size: 11px;
}

.status-item {
    display: flex;
    align-items: center;
    gap: 4px;
}

.status-item .label {
    color: #888888;
}

.status-item .value {
    color: #ffffff;
    font-weight: bold;
}
```

#### JavaScript実装（基本構造のみ）
```javascript
class SpinePreviewManager {
    constructor() {
        this.canvas = null;
        this.renderer = null;
        this.currentCharacter = null;
        this.animationState = 'stopped';
        this.zoomLevel = 1.0;
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = 0;
        
        this.initialize();
    }
    
    initialize() {
        console.log('🎬 プレビューパネル初期化開始');
        
        // 実装前チェック
        if (!preImplementationCheck()) {
            console.error('❌ プレビューパネル実装中止 - 司令塔システムエラー');
            return;
        }
        
        this.initializeCanvas();
        this.bindEvents();
        this.setupFileListener();
        
        console.log('✅ プレビューパネル初期化完了');
        
        // 実装後チェック
        postImplementationCheck();
    }
    
    initializeCanvas() {
        this.canvas = document.getElementById('spine-preview-canvas');
        if (!this.canvas) {
            console.error('❌ Canvas要素が見つかりません');
            return;
        }
        
        // ResizeObserver でキャンバスサイズを自動調整
        const resizeObserver = new ResizeObserver(() => {
            this.resizeCanvas();
        });
        resizeObserver.observe(this.canvas.parentElement);
        
        // 初期リサイズ
        this.resizeCanvas();
        
        // WebGL初期化（ここでSpine WebGLライブラリを初期化）
        this.initializeRenderer();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        if (this.renderer) {
            this.renderer.resize(width, height);
        }
    }
    
    initializeRenderer() {
        // Spine WebGL レンダラー初期化
        // 実際の実装では spine-webgl.js の使用を前提
        console.log('🎭 Spine レンダラー初期化');
        
        // [WebGL/Spine初期化コードはここに実装]
        
        // フレームレート計測開始
        this.startFPSCounter();
    }
    
    bindEvents() {
        // ツールバーイベント
        const toolbar = document.querySelector('.preview-toolbar');
        if (toolbar) {
            toolbar.addEventListener('click', (e) => {
                if (e.target.classList.contains('tool-btn')) {
                    this.handleToolbarAction(e.target.dataset.action);
                }
            });
            
            // キャラクター選択
            const selector = document.getElementById('character-selector');
            if (selector) {
                selector.addEventListener('change', (e) => {
                    this.loadCharacter(e.target.value);
                });
            }
        }
    }
    
    setupFileListener() {
        // アウトライナーからのファイル選択通知を受信
        if (window.panelCommunicator) {
            window.panelCommunicator.subscribe('outliner:file-selected', (event) => {
                const { path } = event.detail;
                if (path.endsWith('.json')) {
                    // Spine JSONファイルが選択された場合
                    const characterName = path.split('/').pop().replace('.json', '');
                    this.loadCharacter(characterName);
                }
            });
        }
    }
    
    handleToolbarAction(action) {
        switch (action) {
            case 'load-character':
                this.showCharacterSelector();
                break;
            case 'play':
                this.playAnimation();
                break;
            case 'pause':
                this.pauseAnimation();
                break;
            case 'reset':
                this.resetAnimation();
                break;
            case 'zoom-in':
                this.zoomIn();
                break;
            case 'zoom-out':
                this.zoomOut();
                break;
            case 'zoom-fit':
                this.zoomFit();
                break;
        }
    }
    
    loadCharacter(characterName) {
        if (!characterName) return;
        
        console.log(`🐭 キャラクター読み込み: ${characterName}`);
        
        this.showLoading(true);
        
        // 実際の実装では Spine ファイルを読み込み
        // [Spine読み込みコードはここに実装]
        
        // サンプル実装
        setTimeout(() => {
            this.currentCharacter = characterName;
            this.showLoading(false);
            this.updateStatus();
            
            // プロパティパネルに通知
            if (window.panelCommunicator) {
                window.panelCommunicator.broadcast('preview:character-loaded', { 
                    character: characterName 
                });
            }
        }, 1000);
    }
    
    showLoading(show) {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) {
            indicator.style.display = show ? 'flex' : 'none';
        }
    }
    
    showError(message) {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.querySelector('.error-text').textContent = message;
            errorElement.style.display = 'flex';
        }
    }
    
    hideError() {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
    
    startFPSCounter() {
        const updateFPS = (currentTime) => {
            this.frameCount++;
            
            if (currentTime - this.lastTime >= 1000) {
                this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastTime));
                this.frameCount = 0;
                this.lastTime = currentTime;
                
                this.updateStatus();
            }
            
            requestAnimationFrame(updateFPS);
        };
        
        requestAnimationFrame(updateFPS);
    }
    
    updateStatus() {
        const fpsDisplay = document.getElementById('fps-display');
        const animationDisplay = document.getElementById('animation-display');
        const zoomDisplay = document.getElementById('zoom-display');
        
        if (fpsDisplay) fpsDisplay.textContent = this.fps;
        if (animationDisplay) animationDisplay.textContent = this.currentCharacter || '--';
        if (zoomDisplay) zoomDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    }
    
    playAnimation() {
        this.animationState = 'playing';
        console.log('▶️ アニメーション再生');
        // [実際のアニメーション再生コード]
    }
    
    pauseAnimation() {
        this.animationState = 'paused';
        console.log('⏸️ アニメーション一時停止');
        // [実際のアニメーション一時停止コード]
    }
    
    resetAnimation() {
        this.animationState = 'stopped';
        console.log('🔄 アニメーションリセット');
        // [実際のアニメーションリセットコード]
    }
    
    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel * 1.2, 5.0);
        this.updateZoom();
    }
    
    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.1);
        this.updateZoom();
    }
    
    zoomFit() {
        this.zoomLevel = 1.0;
        this.updateZoom();
    }
    
    updateZoom() {
        // [実際のズーム適用コード]
        this.updateStatus();
        console.log(`🔍 ズーム: ${Math.round(this.zoomLevel * 100)}%`);
    }
}

// プレビューパネル自動初期化
document.addEventListener('DOMContentLoaded', () => {
    const checkReady = () => {
        if (window.simpleCoordinator?.state === 'ready') {
            window.spinePreviewManager = new SpinePreviewManager();
        } else {
            setTimeout(checkReady, 100);
        }
    };
    checkReady();
});
```

---

## 🚨 トラブルシューティング

### ❌ **よくある問題と解決策**

#### 問題1: 司令塔システムが動かない
**症状**: パネルリサイズ・D&Dが動作しない
```javascript
// 診断コマンド
debugCoordinator();

// 期待結果
{
    state: "ready",
    panels: ["outliner", "preview", "properties", "timeline"],
    resizeHandles: ["left", "right", "timeline"],
    isDragging: false
}
```

**解決策**:
1. ブラウザリロード
2. コンソールエラー確認
3. `resetLayout()` 実行
4. 最小限のHTMLで動作確認

#### 問題2: パネル実装後にレイアウト崩壊
**症状**: パネルが重なる、サイズがおかしい
```javascript
// 診断コマンド
const panels = document.querySelectorAll('.panel');
console.log('パネル数:', panels.length);
console.log('Grid Areas:', Array.from(panels).map(p => 
    getComputedStyle(p).gridArea
));
```

**解決策**:
1. CSS Grid プロパティの確認
2. パネル要素の `data-panel` 属性確認
3. カスタムCSS の `position` や `display` 確認
4. DOM構造の変更有無確認

#### 問題3: パフォーマンス問題
**症状**: 動作が重い、描画が遅い
```javascript
// 診断コマンド
console.log('イベントリスナー数:', getEventListeners(document).length);

// メモリ使用量確認 (Chrome DevTools)
performance.memory
```

**解決策**:
1. 不要なイベントリスナー削除
2. `removeEventListener` の確実な実行
3. `ResizeObserver` の `disconnect()` 実行
4. Canvas コンテキストの適切な管理

#### 問題4: パネル間通信エラー
**症状**: パネル間でデータが共有されない
```javascript
// 診断コマンド
console.log('通信バス存在:', typeof window.panelCommunicator);

// イベント送信テスト
if (window.panelCommunicator) {
    window.panelCommunicator.broadcast('test:event', { data: 'test' });
}
```

**解決策**:
1. `PanelCommunicator` の初期化確認
2. イベント名の typo 確認  
3. イベントリスナーの登録タイミング確認
4. `CustomEvent` のブラウザ対応確認

### 🛠️ **デバッグツール**

#### システム状態確認
```javascript
// 包括的システム診断
function fullSystemDiagnosis() {
    console.group('🔍 システム診断開始');
    
    // 司令塔状態
    console.log('司令塔:', window.simpleCoordinator?.state);
    
    // パネル状態
    const panels = document.querySelectorAll('.panel');
    console.log('パネル数:', panels.length);
    
    // CSS変数
    const root = getComputedStyle(document.documentElement);
    console.log('幅設定:', {
        outliner: root.getPropertyValue('--outliner-width'),
        properties: root.getPropertyValue('--properties-width'),
        timeline: root.getPropertyValue('--timeline-height')
    });
    
    // 通信バス
    console.log('通信バス:', typeof window.panelCommunicator);
    
    console.groupEnd();
}

// グローバル登録
window.fullSystemDiagnosis = fullSystemDiagnosis;
```

#### パフォーマンス監視
```javascript
// FPS・メモリ監視
class PerformanceMonitor {
    constructor() {
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.memoryLog = [];
        
        this.startMonitoring();
    }
    
    startMonitoring() {
        const monitor = () => {
            const now = performance.now();
            this.frameCount++;
            
            if (now - this.lastTime >= 1000) {
                this.fps = Math.round(this.frameCount * 1000 / (now - this.lastTime));
                this.frameCount = 0;
                this.lastTime = now;
                
                // メモリ使用量記録（Chrome）
                if (performance.memory) {
                    this.memoryLog.push({
                        time: now,
                        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
                    });
                    
                    // 直近10件のみ保持
                    if (this.memoryLog.length > 10) {
                        this.memoryLog.shift();
                    }
                }
                
                this.updateDisplay();
            }
            
            requestAnimationFrame(monitor);
        };
        
        requestAnimationFrame(monitor);
    }
    
    updateDisplay() {
        console.log(`📊 FPS: ${this.fps}, メモリ: ${this.getCurrentMemory()}MB`);
    }
    
    getCurrentMemory() {
        if (performance.memory) {
            return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        }
        return 'N/A';
    }
    
    getReport() {
        return {
            fps: this.fps,
            memory: this.getCurrentMemory(),
            memoryHistory: this.memoryLog
        };
    }
}

// 開発中のみ有効化
if (location.hostname === 'localhost') {
    window.performanceMonitor = new PerformanceMonitor();
    window.getPerformanceReport = () => window.performanceMonitor.getReport();
}
```

---

## 📚 参考資料

### 🔗 **外部資料**

#### CSS Grid 完全ガイド
- [MDN - CSS Grid Layout](https://developer.mozilla.org/ja/docs/Web/CSS/CSS_Grid_Layout)
- [CSS Grid レスポンシブパターン](https://css-tricks.com/snippets/css/complete-guide-grid/)

#### Canvas/WebGL
- [MDN - Canvas API](https://developer.mozilla.org/ja/docs/Web/API/Canvas_API)
- [WebGL 基礎知識](https://developer.mozilla.org/ja/docs/Web/API/WebGL_API)

#### Spine WebGL
- [Spine Runtime Documentation](http://esotericsoftware.com/spine-runtimes)
- [Spine WebGL 使用例](http://esotericsoftware.com/spine-webgl)

### 📋 **関連ファイル**

#### 司令塔システム
- `index-coordinator-simple.html` - HTML構造
- `coordinator-simple.js` - JavaScript実装

#### パネル実装例
- このドキュメントの「実装実例」セクション
- アウトライナーパネル完全実装
- プレビューパネル基本実装

### 💡 **推奨学習リソース**

#### 基礎知識
1. **CSS Grid** - レイアウトシステム理解必須
2. **EventTarget API** - パネル間通信で使用
3. **ResizeObserver** - レスポンシブ対応で使用
4. **CustomEvent** - カスタムイベント実装で使用

#### 応用知識
1. **Canvas API** - プレビューパネル実装用
2. **WebGL** - 高度なグラフィック実装用
3. **File API** - ファイル読み込み機能用
4. **Drag & Drop API** - ファイルD&D実装用

---

## 🔄 ルールブック更新履歴

### Version 1.0 (2025-09-06)
- 初版作成
- 基本ルール・パターン・実例を包括的に整備
- 司令塔システムとの競合回避方法確立
- アウトライナー・プレビューパネル実装例追加

### 🔮 今後の予定
- プロパティパネル実装実例追加
- タイムラインパネル実装実例追加
- 外部ライブラリ統合パターン追加
- パフォーマンス最適化ガイド追加

---

## 📞 サポート・質問

### 🤝 **実装支援**
このルールブックに従って実装を進めても問題が発生する場合:

1. **事前確認**: `preImplementationCheck()` の実行
2. **問題報告**: 具体的なエラーメッセージ・症状
3. **システム状態**: `debugCoordinator()` の結果
4. **実装内容**: 変更したHTML・CSS・JavaScript

### 💬 **よくある質問**

**Q: 司令塔システムを改造したい**
A: このルールブックでは司令塔システムの改造はカバーしていません。パネル内容の実装に特化しています。

**Q: 複数のパネルを同時に実装できる？**
A: 可能ですが、段階的実装を推奨。1パネルずつ完成させてから次へ。

**Q: 外部ライブラリを使いたい**
A: パネルコンテンツ内での利用は自由。司令塔システムとの競合に注意。

**Q: モバイル対応は必要？**
A: デスクトップ向けシステムです。モバイル対応は考慮されていません。

---

**🎯 このルールブックによって、複数のAI・開発者が安全に協調してパネル実装を行い、高品質なSpine Editor WebAppの完成を目指します。**

**📝 重要**: 実装前に必ず `preImplementationCheck()` を実行し、実装後に `postImplementationCheck()` で動作確認を行ってください。