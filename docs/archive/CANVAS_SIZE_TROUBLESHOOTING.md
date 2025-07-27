# 🎯 Canvasサイズ変更トラブルシューティング

## 📋 このガイドについて

**対象問題**: 「CSSでCanvasサイズを変更しても反映されない」「サイズ設定を変えても見た目が変わらない」

**関連ドキュメント**:
- [キャラクター表示問題の基本対処](./CHARACTER_DISPLAY_TROUBLESHOOTING.md)
- [レイヤー・位置問題の診断](./LAYER_DEBUGGING.md) 
- [Spine技術仕様・実装詳細](./DEVELOPMENT_GUIDE.md)

---

## ⚡ 30秒診断：何が表示されているか確認

### 🔍 ブラウザコンソール診断
```javascript
// F12でコンソールを開いて実行
console.log('=== Canvas表示状態診断 ===');

// Canvas要素の確認
const canvas = document.querySelector('canvas[id*="purattokun"], canvas[id*="spine"], canvas[data-spine-character]');
const fallback = document.querySelector('img[src*="purattokunn"], img[alt*="ぷらっとくん"]');

console.log('Canvas要素:', {
    存在: canvas ? '✅あり' : '❌なし',
    表示状態: canvas ? (canvas.style.display === 'none' ? '❌非表示' : '✅表示中') : 'N/A',
    ID: canvas ? canvas.id : 'N/A',
    クラス: canvas ? canvas.className : 'N/A'
});

console.log('フォールバック画像:', {
    存在: fallback ? '✅あり' : '❌なし', 
    表示状態: fallback ? (fallback.style.display === 'none' ? '❌非表示' : '✅表示中') : 'N/A',
    ID: fallback ? fallback.id : 'N/A',
    クラス: fallback ? fallback.className : 'N/A'
});

// 実際に見えている要素を特定
if (canvas && canvas.style.display !== 'none') {
    console.log('🎯 現在表示中: Canvas要素');
    console.log('   Canvas CSS設定を変更してください');
} else if (fallback && fallback.style.display !== 'none') {
    console.log('🎯 現在表示中: フォールバック画像');
    console.log('   フォールバック画像のCSS設定を変更してください');
} else {
    console.log('⚠️ どちらも非表示状態です');
}

console.log('=== 診断完了 ===');
```

---

## 🎯 問題パターン別解決法

### パターン1: ❌ Canvas CSSを変更しても効果なし ✅ 検証済み

#### 🔍 症状
- Canvas要素のCSS（`.spine-character`など）を変更
- 数値を変えてもキャラクターサイズに変化なし
- コンソールエラーもない

#### 💡 根本原因
**フォールバック画像が表示されているため、Canvas用CSS設定が無効**

```html
<!-- Canvas要素（非表示状態） -->
<canvas class="spine-character" style="display: none;"></canvas>

<!-- フォールバック画像（表示中） ← こちらが見えている！ -->
<img class="fallback-character" style="display: block;">
```

#### ✅ 解決策A: 統合CSS設定（推奨）

**両方に同じ設定を適用する仕組みを作る**

```css
/* ❌ 従来の分離設定 */
.spine-character {
    width: 160px;  /* Canvas用（非表示時は無効） */
    height: 160px;
}
.fallback-character {
    width: 120px;  /* フォールバック用（別々の設定） */
    height: 120px;
}

/* ✅ 統合設定 */
.spine-character,
.fallback-character {
    width: 160px;  /* 1箇所変更で両方に反映 */
    height: 160px;
    position: absolute;
    left: 35%;
    top: 75%;
    transform: translate(-50%, -50%);
    z-index: 10;
}

/* フォールバック専用設定 */
.fallback-character {
    object-fit: contain;
    display: block;
}
```

#### ✅ 解決策B: 表示切り替え確認

**Canvas表示に強制切り替えしてテスト**

```javascript
// Canvasを表示、フォールバックを非表示
const canvas = document.querySelector('canvas[id*="purattokun"]');
const fallback = document.querySelector('img[src*="purattokunn"]');

if (canvas && fallback) {
    canvas.style.display = 'block';
    fallback.style.display = 'none';
    console.log('✅ Canvas表示に切り替えました');
}
```

---

### パターン2: ❌ JavaScript内部サイズ変更も効果なし ✅ 検証済み

#### 🔍 症状
- `canvas.width = 200; canvas.height = 200;` を変更
- Canvas内部サイズは変わるが、画面上のサイズは変わらない

#### 💡 根本原因
**CSS表示サイズとJavaScript内部サイズの不一致**

#### ✅ 解決策: 両方を同期

```javascript
// Canvas内部サイズ設定
canvas.width = 200;
canvas.height = 200;

// CSS表示サイズも同期（CSSより優先度高）
canvas.style.width = '200px';
canvas.style.height = '200px';

// または、CSSクラスで統一管理
canvas.className = 'spine-character-large'; // 200px設定のクラス
```

**対応するCSS:**
```css
.spine-character-large {
    width: 200px !important;
    height: 200px !important;
}
```

---

### パターン3: ❌ !important設定で変更できない ✅ 検証済み

#### 🔍 症状
- CSS設定に`!important`が付いている
- 数値を変更してもブラウザで上書きされない

#### 💡 根本原因
**CSS優先度の競合**

```css
/* 問題のパターン */
.spine-character {
    width: 80px !important;  /* 固定化されて変更困難 */
    height: 80px !important;
}
```

#### ✅ 解決策A: !importantを削除

```css
/* ✅ 修正後 */
.spine-character {
    width: 80px;  /* !important削除 */
    height: 80px;
}
```

#### ✅ 解決策B: より具体的なセレクタ使用

```css
/* より高い優先度で上書き */
#spine-character-canvas.spine-character {
    width: 200px !important;  /* ID + クラスで優先度UP */
    height: 200px !important;
}
```

#### ✅ 解決策C: インラインスタイルで強制上書き

```javascript
// JavaScript経由でインラインスタイル設定（最高優先度）
canvas.style.width = '200px';
canvas.style.height = '200px';
```

---

### パターン4: ❌ キャラクターが歪んで表示される ✅ 検証済み

#### 🔍 症状
- サイズは変わるが縦横比がおかしい
- 横に伸びたり縦に潰れたりする

#### 💡 根本原因
**Canvas内部解像度とCSS表示サイズの比率不一致**

#### ✅ 解決策: 正方形比率で統一

```javascript
// ❌ 問題パターン
canvas.width = 400;   // 4:2比率
canvas.height = 200;
canvas.style.width = '160px';   // 1:1比率 → 歪む
canvas.style.height = '160px';

// ✅ 解決パターン
canvas.width = 160;   // 1:1比率
canvas.height = 160;
canvas.style.width = '160px';   // 1:1比率 → 正常
canvas.style.height = '160px';
```

**詳細解説**: [キャラクター表示トラブルシューティング - パターン0](./CHARACTER_DISPLAY_TROUBLESHOOTING.md#パターン0-❌-キャラクターが歪んで表示されるcanvas比率問題-✅-検証済み)

---

## 🛠️ 段階的解決手順

### Step 1: 現在表示されている要素を特定
```javascript
// 30秒診断スクリプトを実行（上記参照）
```

### Step 2: 適切なCSS設定対象を確認
```javascript
// 表示中の要素のクラス名を確認
const visibleElement = document.querySelector('[style*="display: block"], [style*="display: "]');
console.log('表示中要素のクラス:', visibleElement.className);
```

### Step 3: 対象に応じた修正実施

**Canvas表示中の場合:**
```css
.spine-character {
    width: 200px;
    height: 200px;
}
```

**フォールバック画像表示中の場合:**
```css
.fallback-character {
    width: 200px;
    height: 200px;
}
```

**両方対応（推奨）:**
```css
.spine-character,
.fallback-character {
    width: 200px;
    height: 200px;
}
```

### Step 4: JavaScript内部サイズも同期
```javascript
canvas.width = 200;
canvas.height = 200;
```

---

## 📋 チェックリスト

### 基本確認
- [ ] 30秒診断で表示中要素を特定済み
- [ ] 適切なCSS設定対象を確認済み
- [ ] !important の競合がないか確認済み
- [ ] Canvas内部サイズとCSS表示サイズが同期済み

### 応用確認
- [ ] フォールバック画像とCanvas両方に設定適用済み
- [ ] 歪み問題（正方形比率）を確認済み
- [ ] モバイル版レスポンシブ設定も調整済み
- [ ] ブラウザキャッシュクリア（Ctrl+Shift+R）実施済み

### デバッグ確認
- [ ] コンソール診断スクリプト実行済み
- [ ] F12開発者ツールでCSS適用状況確認済み
- [ ] ネットワークタブで画像読み込み確認済み

---

## 🚀 予防策・ベストプラクティス

### 1. 統合CSS設定を標準化
```css
/* ✅ 推奨パターン */
.character-base {
    width: var(--character-size, 160px);
    height: var(--character-size, 160px);
    position: absolute;
    left: 35%;
    top: 75%;
    transform: translate(-50%, -50%);
    z-index: 10;
}

.spine-character,
.fallback-character {
    @extend .character-base;  /* SASSの場合 */
}
```

### 2. CSS変数による一元管理
```css
:root {
    --character-size: 160px;
    --character-left: 35%;
    --character-top: 75%;
}

.spine-character,
.fallback-character {
    width: var(--character-size);
    height: var(--character-size);
    left: var(--character-left);
    top: var(--character-top);
}
```

### 3. JavaScript設定の自動同期
```javascript
function syncCanvasSize(size = 160) {
    const canvas = document.querySelector('canvas[id*="purattokun"]');
    if (canvas) {
        // 内部サイズ
        canvas.width = size;
        canvas.height = size;
        
        // CSS表示サイズ
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        
        console.log(`✅ Canvasサイズを${size}x${size}に同期しました`);
    }
}

// 使用例
syncCanvasSize(200);  // 200x200に変更
```

---

## 🔗 関連ドキュメント

### 基本的な表示問題
- **キャラクターが見えない場合**: [CHARACTER_DISPLAY_TROUBLESHOOTING.md](./CHARACTER_DISPLAY_TROUBLESHOOTING.md)
- **位置がずれる場合**: [LAYER_DEBUGGING.md](./LAYER_DEBUGGING.md)

### Spine技術関連
- **Spine WebGL詳細**: [SPINE_TROUBLESHOOTING.md](./SPINE_TROUBLESHOOTING.md)
- **技術仕様・実装**: [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)

### 設計・アーキテクチャ
- **システム設計思想**: [ARCHITECTURE_NOTES.md](./ARCHITECTURE_NOTES.md)
- **開発チェックリスト**: [DEVELOPMENT_CHECKLIST.md](./DEVELOPMENT_CHECKLIST.md)

---

## 📊 よくある組み合わせ問題

### Canvas表示 + サイズ変更不可
1. [このガイド](#パターン1-❌-canvas-cssを変更しても効果なし-✅-検証済み) でCSS対象確認
2. [CHARACTER_DISPLAY_TROUBLESHOOTING.md](./CHARACTER_DISPLAY_TROUBLESHOOTING.md) で基本表示確認

### 位置ズレ + サイズ問題
1. [LAYER_DEBUGGING.md](./LAYER_DEBUGGING.md) で位置問題解決
2. このガイドでサイズ調整

### Spine読み込み失敗 + フォールバック表示
1. [SPINE_TROUBLESHOOTING.md](./SPINE_TROUBLESHOOTING.md) でSpine問題解決
2. このガイドでフォールバックサイズ調整

---

**このガイドで解決しない場合は、spine-sample-clean-v3.htmlの成功パターンを参考に、最小限のテストケースを作成してから段階的に機能を追加してください。**