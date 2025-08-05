# 🎯 Spine WebGL ベストプラクティス

**最終更新**: 2025年1月29日  
**ステータス**: 確定版（理想構成決定）  
**用途**: 今後のSpine実装における標準ガイドライン

---

## 🚀 座標制御理想構成（確定版）

### 🎯 基本方針
**「今後のSpineに関する座標は2層の理想構成で実装する」**

この構成は、複雑な7層システムから段階的に簡略化し、実用性と保守性を両立した最終形態です。

---

## 📐 2層座標制御システム

### **Layer 1: CSS位置制御システム**
**役割**: Canvas要素の画面上での配置制御

```css
#canvas-element {
    position: absolute;
    left: 35%;  /* 背景画像同期 */
    top: 75%;   /* 背景画像同期 */
    transform: translate(-50%, -50%);  /* 中心点基準配置 */
    width: 120px;   /* 表示サイズ */
    height: 120px;
    z-index: 10;
}
```

### **Layer 2: Spine WebGL座標制御システム**  
**役割**: Canvas内でのSpineキャラクターの配置・スケール制御

```javascript
// Canvas内部解像度設定
canvas.width = 200;   // 最適化済み解像度
canvas.height = 200;

// Skeleton配置（理想構成）
skeleton.x = 0;       // 基本は0,0ベース（重要）
skeleton.y = 0;       // 基本は0,0ベース（重要）
skeleton.scaleX = skeleton.scaleY = 0.55;  // 推奨スケール
```

---

## 💡 重要な技術的知見

### 🔑 確定済みベストプラクティス

1. **Skeleton座標は基本０，０でよい**
   - ユーザー実証済みの重要な発見
   - 複雑な座標計算は不要
   - シンプルな原点基準配置が最適

2. **2層が技術的な最小構成**
   - Spine WebGLの制約上、これ以上の削減は不可能
   - CSS位置制御 + Spine座標制御の組み合わせが必須

3. **大幅簡略化の実現**
   - **開始時**: 7層の複雑な座標制御
   - **最終形**: 2層のシンプル構成
   - **削減率**: 約71%の簡略化達成

---

## 🛠️ 実装ガイドライン

### ✅ 推奨実装パターン

```html
<!-- HTML構造（最小構成） -->
<div id="purattokun-config" style="display: none;"
     data-x="35"     <!-- CSS left値（%） -->
     data-y="75"     <!-- CSS top値（%） -->
     data-scale="0.55"> <!-- Skeletonスケール -->
</div>

<canvas id="purattokun-canvas" 
        data-spine-character="purattokun"
        style="position: absolute; width: 120px; height: 120px; z-index: 10;">
</canvas>
```

```javascript
// JavaScript実装（推奨パターン）
const config = document.getElementById('purattokun-config');
const canvas = document.getElementById('purattokun-canvas');

// Layer 1: CSS位置制御
const x = config.dataset.x;
const y = config.dataset.y;
canvas.style.left = x + '%';
canvas.style.top = y + '%';
canvas.style.transform = 'translate(-50%, -50%)';

// Layer 2: Spine座標制御（シンプル）
canvas.width = 200;
canvas.height = 200;
skeleton.x = 0;  // 基本0,0
skeleton.y = 0;  // 基本0,0
skeleton.scaleX = skeleton.scaleY = parseFloat(config.dataset.scale);
```

### ❌ 避けるべきパターン

```javascript
// ❌ 複雑な座標計算
skeleton.x = canvas.width / 2 + offset.x + adjustment.x;
skeleton.y = canvas.height / 2 + offset.y + adjustment.y;

// ❌ 多層座標変換
const finalX = htmlConfig.x * cssTransform.x * jsCalculation.x;
const finalY = htmlConfig.y * cssTransform.y * jsCalculation.y;

// ❌ 動的座標レイヤー追加
addCoordinateLayer('json-positioning');
addCoordinateLayer('edit-system-override');
```

---

## 📊 既知の実装事例

### ✅ 成功事例

| ファイル | 構成 | 状態 |
|---------|------|------|
| **index.html** | 2層理想構成 | ✅ 実装済み・動作確認済み |
| **spine-sample-simple.html** | 2層理想構成 | ✅ 実装済み・動作確認済み |

### 📋 移行履歴

```
7層複雑システム（2024年前半）
    ↓
段階的簡略化（2024年後半）  
    ↓
2層理想構成（2025年1月確定）← 現在
```

---

## 🔧 座標競合防止システム

### 1. Spine特有の座標レイヤー問題

#### Canvas座標系 vs DOM座標系の競合
```javascript
// ❌ 競合パターン：座標系の重複定義
// Canvas内座標とCSS座標が同時に位置を制御
skeleton.x = canvasWidth / 2;     // Canvas座標系
canvas.style.left = '50%';        // DOM座標系
// → 結果：予期しない位置ずれが発生
```

#### transform vs position プロパティの重複
```css
/* ❌ 競合パターン：プロパティの重複適用 */
#canvas {
    position: absolute;
    left: 35%;                    /* position系 */
    transform: translateX(20px);  /* transform系 */
}
/* → 結果：両方が同時に作用して位置が二重にずれる */
```

#### スケール・回転による座標ずれ
```javascript
// ❌ 問題パターン：スケール適用後の座標計算
skeleton.scaleX = 2.0;
skeleton.x = 100;  // スケール適用前の座標
// → 結果：スケール倍率分だけ実際の位置がずれる
```

### 2. 実装パターン（Spine専用）

#### 基本レイヤー1: Canvas配置（DOM制御）
```css
/* Canvas要素の画面上での位置制御 */
#character-canvas {
    position: absolute;
    left: var(--spine-x, 35%);        /* CSS変数による動的制御 */
    top: var(--spine-y, 75%);         /* 背景画像との同期位置 */
    transform: translate(-50%, -50%); /* 中心点基準配置（重要） */
    width: var(--spine-width, 120px); /* 表示サイズ制御 */
    height: var(--spine-height, 120px);
    z-index: var(--spine-z, 10);     /* レイヤー制御 */
}
```

#### 基本レイヤー2: 表示調整（Spine制御）
```javascript
// Canvas内部でのSpine座標制御
canvas.width = 200;   // 内部解像度（固定推奨）
canvas.height = 200;

// Skeleton配置（競合回避）
skeleton.x = 0;       // 基本は原点ベース（重要）
skeleton.y = 0;       // 複雑な計算を避ける
skeleton.scaleX = skeleton.scaleY = parseFloat(
    getComputedStyle(document.documentElement)
    .getPropertyValue('--spine-scale') || '0.55'
);
```

### 3. 編集システム統合パターン

#### URLパラメータによる動的システム切り替え
```javascript
// 動的編集システム読み込み（競合防止）
function loadEditSystem() {
    if (new URLSearchParams(window.location.search).get('edit') === 'true') {
        // 編集時のみレイヤー追加
        const editLayer = document.createElement('div');
        editLayer.id = 'spine-edit-layer';
        editLayer.style.cssText = 'position: absolute; pointer-events: auto; z-index: 1000;';
        document.body.appendChild(editLayer);
        
        // 既存システムとの分離
        originalSpineSystem.disable();
        editSpineSystem.enable();
    }
}
```

#### 編集時のみレイヤー追加、完了後の完全除去
```javascript
// 編集完了時の競合解除
function endEditMode() {
    // 編集レイヤーの完全除去
    const editLayer = document.getElementById('spine-edit-layer');
    if (editLayer) editLayer.remove();
    
    // 元システムの復元
    editSpineSystem.disable();
    originalSpineSystem.restore();
    
    // CSS変数更新（位置情報の永続化）
    document.documentElement.style.setProperty('--spine-x', finalPosition.x + '%');
    document.documentElement.style.setProperty('--spine-y', finalPosition.y + '%');
}
```

#### localStorage連携による状態保存
```javascript
// 座標情報の安全な永続化
function saveSpineState(characterId, state) {
    const stateKey = `spine-position-${characterId}`;
    const safeState = {
        x: Math.max(0, Math.min(100, state.x)),  // 0-100%範囲制限
        y: Math.max(0, Math.min(100, state.y)),
        scale: Math.max(0.1, Math.min(3.0, state.scale)), // スケール制限
        timestamp: Date.now()
    };
    localStorage.setItem(stateKey, JSON.stringify(safeState));
}
```

### 4. デバッグ・診断方法

#### 座標競合の検出方法
```javascript
// F12コンソールで実行可能な診断コマンド
function diagnoseCoordinateConflict(canvasId) {
    const canvas = document.getElementById(canvasId);
    const rect = canvas.getBoundingClientRect();
    
    console.log('=== 座標競合診断 ===');
    console.log('CSS位置:', {
        left: canvas.style.left,
        top: canvas.style.top,
        transform: canvas.style.transform
    });
    console.log('実際の表示位置:', {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
    });
    
    // Spine座標の確認
    if (window.spineApp && window.spineApp.skeleton) {
        console.log('Spine座標:', {
            x: window.spineApp.skeleton.x,
            y: window.spineApp.skeleton.y,
            scaleX: window.spineApp.skeleton.scaleX,
            scaleY: window.spineApp.skeleton.scaleY
        });
    }
}
```

#### レイヤー重複チェック
```javascript
// レイヤー競合の自動検出
function checkLayerConflicts() {
    const elements = document.querySelectorAll('[id*="spine"], [id*="character"], [class*="edit"]');
    const conflicts = [];
    
    elements.forEach(el => {
        const style = getComputedStyle(el);
        if (style.position === 'absolute' && style.zIndex) {
            conflicts.push({
                element: el.id || el.className,
                zIndex: style.zIndex,
                position: `${style.left}, ${style.top}`
            });
        }
    });
    
    console.table(conflicts);
    return conflicts;
}
```

#### 実際のDOM検証手順
```javascript
// 段階的DOM検証（F12コンソール）
// 1. 基本要素の存在確認
console.log('Canvas要素:', document.getElementById('purattokun-canvas'));

// 2. CSS適用状況確認
const canvas = document.getElementById('purattokun-canvas');
console.log('適用スタイル:', getComputedStyle(canvas));

// 3. Spine初期化状況確認
console.log('Spineアプリ:', window.spineApp);
console.log('Skeleton:', window.spineApp?.skeleton);

// 4. イベントリスナー確認
console.log('イベントリスナー:', getEventListeners(canvas));
```

### 5. トラブルシューティング

#### よくある座標ズレパターン
```javascript
// パターン1: CSS位置とSpine座標の二重適用
// 症状：キャラクターが予想より大きくずれる
// 原因：
canvas.style.left = '50%';          // CSS で中央
skeleton.x = canvas.width / 2;      // Spine でも中央
// 解決：どちらか一つに統一
skeleton.x = 0;  // Spine は原点ベース推奨

// パターン2: transform の重複適用
// 症状：回転やスケール時に位置がずれる
// 原因：
canvas.style.transform = 'translate(-50%, -50%) scale(1.5)';
skeleton.scaleX = 1.5;  // スケールが重複
// 解決：役割分担を明確化
canvas.style.transform = 'translate(-50%, -50%)';  // 位置のみ
skeleton.scaleX = 1.5;  // スケールのみ
```

#### レスポンシブ時の座標競合
```css
/* 問題：レスポンシブで座標系が崩れる */
@media (max-width: 768px) {
    #character-canvas {
        /* ❌ 危険：座標系の大幅変更 */
        position: relative;  /* absolute から relative に変更 */
        left: auto;          /* 位置リセット */
    }
}

/* 解決：座標系は維持し、値のみ調整 */
@media (max-width: 768px) {
    #character-canvas {
        /* ✅ 安全：座標系は維持 */
        left: var(--spine-x-mobile, 50%);   /* 値のみ変更 */
        top: var(--spine-y-mobile, 80%);
        width: var(--spine-width-mobile, 80px);
    }
}
```

#### 複数キャラクター時の管理方法
```javascript
// 複数キャラクター座標管理クラス
class SpineCoordinateManager {
    constructor() {
        this.characters = new Map();
        this.activeCharacter = null;
    }
    
    // 座標競合を避けるキャラクター登録
    registerCharacter(id, config) {
        // z-index の自動割り当て（競合防止）
        const baseZIndex = 10;
        const zIndex = baseZIndex + this.characters.size;
        
        this.characters.set(id, {
            ...config,
            zIndex,
            reserved: false  // 編集時の排他制御
        });
    }
    
    // 安全な座標更新
    updatePosition(id, x, y) {
        const character = this.characters.get(id);
        if (character && !character.reserved) {
            // CSS変数による競合回避
            document.documentElement.style.setProperty(`--spine-x-${id}`, x + '%');
            document.documentElement.style.setProperty(`--spine-y-${id}`, y + '%');
            
            character.x = x;
            character.y = y;
        }
    }
}
```

---

## 🔧 トラブルシューティング（基本問題）

### キャラクター切れ問題
```javascript
// 解決策：Canvas解像度調整
canvas.width = 200;   // 適切なサイズ
canvas.height = 200;
skeleton.x = 0;       // シンプルな原点配置
skeleton.y = 0;
```

### 位置ズレ問題
```css
/* 解決策：中心点基準配置 */
transform: translate(-50%, -50%);
```

### スケール問題
```javascript
// 解決策：統一スケール値
skeleton.scaleX = skeleton.scaleY = 0.55;  // 推奨値
```

---

## 🎯 今後の開発指針

### ✅ このベストプラクティスを適用すべき場面
- 新規Spineキャラクター実装
- 既存システムの改修・最適化
- パフォーマンス問題の解決

### ⚠️ 注意事項
- **2層以下への削減は技術的に不可能**
- **Skeleton座標は基本0,0を維持**
- **CSS中心点基準配置は必須**

### 🔄 継続的改善
このドキュメントは新しい知見や最適化技術の発見に応じて更新されます。

---

**📚 関連ドキュメント**
- [🎯 Canvas配置システム（CLAUDE.md）](../CLAUDE.md#🎯-canvas配置システム)
- [⚙️ Spine問題解決（docs/SPINE_TROUBLESHOOTING.md）](./SPINE_TROUBLESHOOTING.md)
- [🏛️ 設計思想（docs/ARCHITECTURE_NOTES.md）](./ARCHITECTURE_NOTES.md)