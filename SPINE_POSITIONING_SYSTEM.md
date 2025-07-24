# Spine Positioning System - 包括的配置システム設計書

**作成日**: 2024年7月24日  
**目的**: レスポンシブ対応 + 再利用可能なSpine配置システムの構築  
**対象**: 現在のサイト + 今後のすべてのSpineページ

---

## 📋 プロジェクト概要

### 解決すべき課題
1. **レスポンシブ問題**: ウィンドウサイズ変更時のキャラクター位置ズレ
2. **開発効率性**: 毎回の座標調整に伴う時間コスト
3. **再利用性**: 新しいページでの一からのコーディング
4. **UI/UX**: 直感的でない数値入力ベースの配置方法

### 統合解決アプローチ
- ✅ レスポンシブ問題の根本解決
- ✅ GIMP風ビジュアルエディター
- ✅ 再利用可能ライブラリシステム
- ✅ 設定ファイルベース運用

---

## 🏗️ システムアーキテクチャ

### レイヤー構造
```
┌─ Visual Editor Layer (GIMP風UI)
├─ Positioning Engine (座標変換・レスポンシブ)
├─ Spine Integration Layer (WebGL + アニメーション)
├─ Configuration Layer (設定ファイル管理)
└─ Base Canvas Layer (描画基盤)
```

### 技術スタック
- **Frontend**: HTML5 Canvas + SVG Overlay + JavaScript
- **座標系**: ビューポート基準 → Canvas座標 → Spine座標変換
- **設定**: JSON-based Configuration System
- **UI**: Custom Bounding Box + Drag Handles

---

## 🎯 Core Features (基本機能)

### 1. レスポンシブ対応システム完全復活

#### HTML設定ベース座標管理
```html
<!-- HTML配置設定（ビューポート基準） -->
<div id="character-config" style="display: none;"
     data-x="22"              <!-- 画面幅の22% -->
     data-y="18"              <!-- 画面高さの18% -->
     data-scale="0.75"        <!-- スケール -->
     data-canvas-size="auto"> <!-- Canvas自動サイズ -->
</div>
```

#### 座標変換システム
```javascript
class ResponsiveCoordinateSystem {
    // ビューポート基準 → 実際のピクセル座標
    viewportToPixel(vpX, vpY) {
        return {
            x: (vpX / 100) * window.innerWidth,
            y: (vpY / 100) * window.innerHeight
        };
    }
    
    // ウィンドウリサイズ時の自動調整
    onResize() {
        this.updateAllCharacterPositions();
        this.resizeCanvasToBackground();
    }
}
```

#### ウィンドウリサイズ対応
- `window.addEventListener('resize', autoAdjust)`
- 背景画像スケールとの同期
- Canvas自動リサイズ

### 2. ドラッグ&ドロップ配置システム

#### 基本ドラッグ機能
```javascript
class DragPositioningSystem {
    startDrag(event) {
        this.isDragging = true;
        this.currentCharacter = this.detectCharacterAt(event.x, event.y);
    }
    
    onDrag(event) {
        if (this.isDragging) {
            this.moveCharacter(this.currentCharacter, event.x, event.y);
            this.updateCoordinateDisplay(event.x, event.y);
        }
    }
    
    endDrag() {
        if (this.isDragging) {
            this.savePosition();
            this.generateConfigCode();
        }
    }
}
```

#### 座標自動取得・保存
- ドラッグ完了時の座標自動計算
- HTML設定形式での出力
- コピペ可能なコード生成

### 3. 再利用可能ライブラリシステム

#### 汎用クラス設計
```javascript
class SpinePositioningTool {
    constructor(config) {
        this.backgroundImage = config.backgroundImage;
        this.characters = config.characters;
        this.canvas = this.createResponsiveCanvas();
        this.positioningMode = false;
    }
    
    // どのページでも使える汎用メソッド
    loadFromConfig(configFile) { ... }
    enablePositioningMode() { ... }
    exportSettings() { ... }
}
```

#### 設定ファイル形式
```json
{
    "system": {
        "version": "2.0",
        "responsive": true,
        "canvasAutoSize": true
    },
    "background": {
        "image": "assets/images/background.png",
        "responsive": true
    },
    "characters": [
        {
            "name": "purattokun",
            "spineData": "assets/spine/characters/purattokun/",
            "position": {
                "viewport": {"x": 22, "y": 18},
                "scale": 0.75
            },
            "clickArea": {
                "custom": true,
                "bounds": {"x": -50, "y": -80, "width": 100, "height": 160}
            }
        }
    ]
}
```

---

## 🎨 Advanced Features (高度機能)

### 1. 背景画像認識・ハイライトシステム

#### マウスオーバー検出
```javascript
class BackgroundImageDetector {
    detectImageElements() {
        const images = document.querySelectorAll('[style*="background-image"], img');
        return images.filter(img => this.isPositionable(img));
    }
    
    addHoverEffects() {
        this.detectImageElements().forEach(img => {
            img.addEventListener('mouseenter', this.highlightImage);
            img.addEventListener('click', this.createCanvasFromImage);
        });
    }
}
```

#### ハイライト表示
```css
.positioning-highlight {
    outline: 3px solid #ff6b6b;
    outline-offset: 2px;
    cursor: crosshair;
    position: relative;
}

.positioning-highlight::after {
    content: "クリックしてキャラクター配置エリアに設定";
    position: absolute;
    background: rgba(255, 107, 107, 0.9);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    top: -30px;
    left: 0;
}
```

### 2. GIMP風バウンディングボックスエディター

#### バウンディングボックス表示
```javascript
class BoundingBoxEditor {
    createBoundingBox(x, y, width, height) {
        const box = document.createElement('div');
        box.className = 'bounding-box';
        box.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${width}px;
            height: ${height}px;
            border: 2px dashed #ff6b6b;
            background: rgba(255, 107, 107, 0.1);
            pointer-events: none;
        `;
        
        // 8方向リサイズハンドル追加
        this.addResizeHandles(box);
        return box;
    }
}
```

#### リサイズハンドル（8方向）
```javascript
class ResizeHandles {
    positions = [
        'top-left', 'top-center', 'top-right',
        'middle-left', 'middle-right',
        'bottom-left', 'bottom-center', 'bottom-right'
    ];
    
    createHandle(position) {
        const handle = document.createElement('div');
        handle.className = `resize-handle ${position}`;
        handle.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: #ff6b6b;
            border: 1px solid white;
            cursor: ${this.getCursor(position)};
        `;
        
        this.positionHandle(handle, position);
        this.addDragBehavior(handle, position);
        return handle;
    }
}
```

#### リサイズ動作
```css
.resize-handle {
    box-shadow: 0 0 3px rgba(0,0,0,0.3);
    transition: transform 0.1s ease;
}

.resize-handle:hover {
    transform: scale(1.5);
    background: #ff4444;
}

/* カーソル設定 */
.resize-handle.top-left,
.resize-handle.bottom-right { cursor: nw-resize; }

.resize-handle.top-right,
.resize-handle.bottom-left { cursor: ne-resize; }

.resize-handle.top-center,
.resize-handle.bottom-center { cursor: n-resize; }

.resize-handle.middle-left,
.resize-handle.middle-right { cursor: e-resize; }
```

### 3. キャラクタークリック範囲カスタマイズ

#### カスタムクリック範囲設定
```javascript
class ClickAreaCustomizer {
    setCustomClickArea(character, bounds) {
        character.clickArea = {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            custom: true
        };
        
        this.updateClickDetection(character);
    }
    
    visualizeClickArea(character) {
        const area = character.clickArea;
        const overlay = this.createClickAreaOverlay(area);
        overlay.style.cssText = `
            position: absolute;
            left: ${area.x}px;
            top: ${area.y}px;
            width: ${area.width}px;
            height: ${area.height}px;
            border: 2px dashed #00ff00;
            background: rgba(0, 255, 0, 0.1);
            pointer-events: none;
        `;
    }
}
```

---

## 📅 実装フェーズ・ロードマップ

### Phase 1: Foundation (基盤構築) - 3-4時間
**目標**: レスポンシブ問題の完全解決

#### 1.1 レスポンシブシステム復活 (1.5時間)
- [ ] HTML data-*設定システムの修復
- [ ] ビューポート基準座標変換の実装
- [ ] ウィンドウリサイズ対応の追加

#### 1.2 基本ドラッグ機能 (1.5時間)
- [ ] Canvas内ドラッグ検出
- [ ] リアルタイム移動表示
- [ ] 座標自動取得・保存

#### 1.3 テスト・検証 (1時間)
- [ ] 複数画面サイズでのテスト
- [ ] レスポンシブ動作の確認
- [ ] 既存機能の回帰テスト

### Phase 2: Visual Editor (ビジュアルエディター) - 3-4時間
**目標**: GIMP風の直感的UI

#### 2.1 バウンディングボックス (2時間)
- [ ] 半透明ボックス表示
- [ ] 8方向リサイズハンドル
- [ ] ドラッグによるサイズ変更

#### 2.2 背景画像認識 (1時間)
- [ ] マウスオーバーハイライト
- [ ] クリックによるCanvas作成
- [ ] 画像サイズ自動検出

#### 2.3 UI/UX改善 (1時間)
- [ ] 配置モードの切り替えUI
- [ ] 座標リアルタイム表示
- [ ] 操作ガイダンス

### Phase 3: Advanced UI (高度インターフェース) - 2-3時間
**目標**: プロフェッショナルツール品質

#### 3.1 GIMP風インターフェース (1.5時間)
- [ ] ツールパレット
- [ ] プロパティパネル
- [ ] レイヤー管理

#### 3.2 キャラクタークリック範囲 (1時間)
- [ ] カスタムクリック範囲設定
- [ ] 視覚的範囲表示
- [ ] 範囲調整UI

#### 3.3 高度機能 (0.5時間)
- [ ] スナップ機能
- [ ] グリッド表示
- [ ] アスペクト比固定

### Phase 4: Production Ready (実用化) - 2-3時間
**目標**: 再利用可能システム完成

#### 4.1 汎用ライブラリ化 (1.5時間)
- [ ] SpinePositioningTool クラス
- [ ] 設定ファイルベース運用
- [ ] プラグイン形式での提供

#### 4.2 設定管理システム (1時間)
- [ ] 設定エクスポート/インポート
- [ ] プリセット管理
- [ ] バックアップ機能

#### 4.3 ドキュメント・テンプレート (0.5時間)
- [ ] 使用方法ガイド
- [ ] 新ページ用テンプレート
- [ ] トラブルシューティング

---

## 🛠️ 技術仕様

### Canvas + SVG Overlay アーキテクチャ
```html
<div class="spine-positioning-container">
    <!-- 背景画像 -->
    <div class="background-layer"></div>
    
    <!-- Spine WebGL Canvas -->
    <canvas class="spine-canvas"></canvas>
    
    <!-- UI Overlay (SVG) -->
    <svg class="positioning-overlay">
        <g class="bounding-boxes"></g>
        <g class="drag-handles"></g>
        <g class="click-areas"></g>
    </svg>
    
    <!-- Control Panel -->
    <div class="positioning-controls"></div>
</div>
```

### 座標変換システム
```javascript
class CoordinateTransformSystem {
    // ビューポート(%) → Canvas(px) → Spine(WebGL)
    transformChain(viewportPercent) {
        const canvasPixel = this.viewportToCanvas(viewportPercent);
        const spineCoord = this.canvasToSpine(canvasPixel);
        return { viewport: viewportPercent, canvas: canvasPixel, spine: spineCoord };
    }
    
    // 逆変換チェーン（保存時）
    reverseTransform(spineCoord) {
        const canvasPixel = this.spineToCanvas(spineCoord);
        const viewportPercent = this.canvasToViewport(canvasPixel);
        return { spine: spineCoord, canvas: canvasPixel, viewport: viewportPercent };
    }
}
```

### イベント処理システム
```javascript
class PositioningEventSystem {
    events = {
        // ドラッグ関連
        'canvas.mousedown': this.startDrag,
        'canvas.mousemove': this.onDrag,
        'canvas.mouseup': this.endDrag,
        
        // リサイズ関連
        'window.resize': this.onWindowResize,
        'handle.drag': this.onHandleDrag,
        
        // モード切り替え
        'ui.togglePositioning': this.togglePositioningMode,
        'ui.exportSettings': this.exportCurrentSettings
    };
}
```

---

## 📖 使用方法・ドキュメント

### 開発者向け使用フロー

#### 1. システム初期化
```javascript
// ページに統合
const positioningSystem = new SpinePositioningTool({
    container: '.hero-section',
    background: 'assets/images/background.png',
    configFile: 'spine-config.json'  // オプション
});

await positioningSystem.initialize();
```

#### 2. 配置モード有効化
```javascript
// 配置モード開始
positioningSystem.enablePositioningMode();

// 背景画像選択（自動検出）
positioningSystem.detectBackgroundImages();

// または手動でCanvas設定
positioningSystem.setCanvasArea(x, y, width, height);
```

#### 3. キャラクター配置
```javascript
// キャラクター追加
positioningSystem.addCharacter({
    name: 'purattokun',
    spineData: 'assets/spine/characters/purattokun/',
    initialPosition: 'center'  // または具体的座標
});

// ドラッグで位置調整
// （UIで直感的に操作）
```

#### 4. 設定保存・エクスポート
```javascript
// 現在の配置を保存
const settings = positioningSystem.exportSettings();

// 設定ファイル生成
positioningSystem.generateConfigFile('spine-config.json');

// HTML設定コード生成
const htmlCode = positioningSystem.generateHTMLCode();
console.log(htmlCode);  // コピペ用コード
```

### 新ページでの使用方法

#### 1. ライブラリ読み込み
```html
<!DOCTYPE html>
<html>
<head>
    <script src="assets/spine/spine-positioning-tool.js"></script>
</head>
<body>
    <div class="hero-section" style="background-image: url('new-bg.png')">
        <!-- キャラクター配置エリア -->
    </div>
</body>
</html>
```

#### 2. 設定ファイル作成
```json
{
    "background": "assets/images/new-page-bg.png",
    "characters": [
        {
            "name": "cat",
            "spineData": "assets/spine/characters/cat/",
            "position": "drag-to-set"
        }
    ]
}
```

#### 3. 初期化・配置
```javascript
// 5分で完了
const newPageSpine = new SpinePositioningTool('new-page-config.json');
newPageSpine.enablePositioningMode();
// ドラッグで配置
// 設定保存
```

---

## 🎯 期待される成果・ROI

### 開発効率向上
- **現在**: 新ページでSpine統合 7-11時間
- **システム後**: 新ページでSpine統合 15分以内
- **時間削減**: 95%以上

### 品質向上
- ✅ レスポンシブ問題の完全解決
- ✅ 直感的なビジュアル配置
- ✅ 人的ミスの大幅削減
- ✅ 統一された品質基準

### 保守性向上
- ✅ 一元化された設定管理
- ✅ 標準化されたコード構造
- ✅ 将来機能追加の容易性

### 投資対効果
- **初回投資**: 10-14時間（システム構築）
- **回収期間**: 3-4ページ目で投資回収
- **長期利益**: 10ページで100時間以上節約

---

## 🔧 開発メモ・注意事項

### 実装時の重要ポイント
1. **レスポンシブ最優先**: すべての機能でレスポンシブ対応を考慮
2. **段階的テスト**: 各Phase完了時に必ず動作確認
3. **バックワード互換性**: 既存のHTML設定との互換性維持
4. **パフォーマンス**: 大きなCanvasでのレンダリング性能に注意

### 将来拡張可能性
- **マルチキャラクター管理**: レイヤーシステム
- **アニメーション連携**: タイムライン編集
- **3D対応**: Three.js統合
- **CMS化**: データベース連携

### トラブルシューティング準備
- **Canvas描画問題**: WebGL context lost対応
- **座標変換エラー**: デバッグ用座標表示機能
- **レスポンシブ不具合**: 強制リフレッシュ機能
- **設定ファイル破損**: バックアップ・復元機能

---

**最終更新**: 2024年7月24日  
**次回更新予定**: Phase 1完了時