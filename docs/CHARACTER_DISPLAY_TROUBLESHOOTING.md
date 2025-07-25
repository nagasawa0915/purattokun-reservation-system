# 🚨 キャラクター表示トラブルシューティング

## ⚠️ このガイドの利用条件

**このガイドに解決策を追加する前に:**
1. **実際に問題が解決したことを確認済み**
2. **複数の環境でテスト済み**
3. **再現可能な手順として整理済み**

**解決していない方法は絶対に追加しないでください。**
- 仮説段階の内容は含めない
- 失敗した方法は別途記録（このガイドには載せない）
- 推測による解決策は禁止

**目的**: 確実に効果のある解決策のみを提供し、ガイドの信頼性を維持する

---

## 📋 このガイドについて

**対象問題**: 「ぷらっとくんが見えない」「キャラクターが表示されない」

**対象外**: ウィンドウリサイズでズレる問題 → [CRITICAL_STRUCTURE_DIFFERENCE_ANALYSIS.md](./CRITICAL_STRUCTURE_DIFFERENCE_ANALYSIS.md) を参照

---

## 🎯 確実にキャラクターが見える基本設定（✅ 検証済み）

### 問題
- 複雑な設定で表示されない時の基本に戻る設定

### 解決策
以下の設定値でほぼ確実にキャラクターが表示されます：

```javascript
// Canvas設定
canvas.width = 400;
canvas.height = 200;

// Skeleton位置（Spineは左下原点）
skeleton.x = 0;  // 左下角
skeleton.y = 0;  // 左下角
skeleton.scaleX = skeleton.scaleY = 0.5;  // 適度なサイズ

// レンダリング内でビューポート設定（必須）
gl.viewport(0, 0, canvas.width, canvas.height);
```

### なぜこの設定が確実なのか
- **skeleton.x = 0, y = 0**: Spineの座標原点（左下）に配置
- **適度なCanvasサイズ**: 400x200で十分な描画領域
- **ビューポート設定**: Canvas全体を描画範囲に指定
- **スケール0.5**: 大きすぎて見切れることを防ぐ

### 応用
この基本設定から、必要に応じて位置を調整：
```javascript
// 中央付近に移動したい場合
skeleton.x = 100;  // 400の1/4位置
skeleton.y = 50;   // 200の1/4位置
```

---

## ⚡ 緊急診断（30秒チェック）

### ブラウザコンソール診断スクリプト
```javascript
// F12でコンソールを開いて以下を実行
console.log('=== キャラクター表示診断開始 ===');

// 要素の存在確認
const container = document.querySelector('.background-container');
const character = document.querySelector('.positioned-element, canvas, #purattokun-canvas');
const fallbackImage = document.querySelector('img[src*="purattokunn"]');

console.log('1. 要素確認:', {
    container: container ? '✅存在' : '❌なし',
    character: character ? '✅存在' : '❌なし',
    fallbackImage: fallbackImage ? '✅存在' : '❌なし'
});

// サイズ確認
if (character) {
    const rect = character.getBoundingClientRect();
    const styles = window.getComputedStyle(character);
    console.log('2. キャラクターサイズ:', {
        width: rect.width + 'px',
        height: rect.height + 'px',
        cssWidth: styles.width,
        cssHeight: styles.height,
        visible: rect.width > 0 && rect.height > 0 ? '✅見える' : '❌見えない'
    });
    
    console.log('3. 位置情報:', {
        left: styles.left,
        top: styles.top,
        position: styles.position,
        zIndex: styles.zIndex
    });
}

// 画像読み込み確認
if (fallbackImage) {
    console.log('4. フォールバック画像:', {
        loaded: fallbackImage.complete ? '✅読み込み済み' : '❌読み込み中',
        naturalWidth: fallbackImage.naturalWidth,
        src: fallbackImage.src
    });
}

console.log('=== 診断完了 ===');
```

---

## 🎯 問題パターン別解決法

### パターン0: ❌ キャラクターが歪んで表示される（Canvas比率問題） ✅ 検証済み

#### 🔍 確認方法
- キャラクターは表示されるが縦横比がおかしい
- 横に伸びたり縦に潰れたりしている
- Canvas内部サイズと表示サイズの比率が正方形でない

#### 💡 解決策

**A. Canvas内部サイズを正方形に統一**
```javascript
// ❌ 問題：横長や縦長のCanvasサイズ
canvas.width = 400;   // 横400
canvas.height = 200;  // 縦200（比率2:1 = 歪む）

// ✅ 解決：正方形のCanvasサイズ
canvas.width = 70;    // 横70
canvas.height = 70;   // 縦70（比率1:1 = 正常）
```

#### なぜこの問題が起こるのか
- **Canvas内部解像度**と**CSS表示サイズ**の比率が違うと歪みが発生
- SpineWebGLは内部解像度基準で描画するため、正方形以外では歪む
- 例：内部400x200、表示80x80の場合、縦横比が2:1から1:1に強制変換され歪む

#### 推奨設定
```javascript
// 最適なCanvas設定
canvas.width = 70;     // 正方形
canvas.height = 70;    // 正方形
// CSS側も正方形に合わせる
canvas.style.width = '80px';
canvas.style.height = '80px';
```

#### CSS変更時の注意
CSSでサイズを変更する場合は`!important`が必要な場合があります：
```css
.spine-character {
    width: 80px !important;
    height: 80px !important;
}
```

---

### パターン1: ❌ 何も見えない（完全に非表示） ✅ 検証済み

#### 🔍 確認方法
- 背景画像は見える
- キャラクターの位置に何もない
- コンソールエラーもない

#### 💡 解決策

**A. HTMLに要素が存在しない**
```html
<!-- ❌ キャラクター要素がない -->
<div class="background-container">
    <img src="background.jpg" class="background-image">
    <!-- キャラクター要素がない！ -->
</div>

<!-- ✅ 解決：キャラクター要素を追加 -->
<div class="background-container">
    <img src="background.jpg" class="background-image">
    <canvas class="positioned-element"></canvas>
    <!-- フォールバック画像も追加 -->
    <img src="assets/images/purattokunn.png" 
         class="positioned-element fallback-character"
         style="object-fit: contain;">
</div>
```

**B. CSSクラスが適用されていない**
```css
/* ✅ 必須のCSS設定 */
.positioned-element {
    position: absolute;
    left: 35%;
    top: 75%;
    transform: translate(-50%, -50%);
    width: 80px;  /* 見えるサイズ */
    height: 80px;
    z-index: 10;  /* 前面表示 */
}
```

### パターン2: ❌ サイズが巨大すぎて枠外 ✅ 検証済み

#### 🔍 確認方法
- 診断スクリプトでサイズが1000px以上
- 一部分だけ見える（頭だけ、足だけなど）

#### 💡 解決策
```css
/* ❌ 問題：背景に対する%指定 */
.positioned-element {
    width: 80%;   /* 背景画像の80% = 巨大 */
    height: 80%;
}

/* ✅ 解決：固定サイズに変更 */
.positioned-element {
    width: 80px;  /* 固定サイズ */
    height: 80px;
}
```

### パターン3: ❌ サイズが極小すぎて見えない ✅ 検証済み

#### 🔍 確認方法
- 診断スクリプトでサイズが10px以下
- 虫眼鏡で見ないと見えない

#### 💡 解決策
```css
/* ❌ 問題：実験用の極小サイズ */
.positioned-element {
    width: 0.8%;  /* 極小 */
    height: 0.8%;
}

/* ✅ 解決：適切なサイズ */
.positioned-element {
    width: 80px;
    height: 80px;
    min-width: 40px;   /* 最小保証 */
    min-height: 40px;
}
```

### パターン4: ❌ 他の要素に隠れている ✅ 検証済み

#### 🔍 確認方法
- 診断スクリプトでサイズは正常
- 一瞬見えてから消える

#### 💡 解決策
```css
/* ❌ 問題：z-indexが低い */
.positioned-element {
    z-index: 1;  /* 他の要素に隠れる */
}

/* ✅ 解決：z-indexを上げる */
.positioned-element {
    z-index: 10;  /* 前面表示 */
}

/* 他の要素のz-indexも確認 */
.background-image { z-index: 1; }
.animated-element { z-index: 5; }
.positioned-element { z-index: 10; }
```

### パターン5: ❌ 画像ファイルが読み込めない ✅ 検証済み

#### 🔍 確認方法
- コンソールに404エラー
- 診断スクリプトで`loaded: false`

#### 💡 解決策

**A. パスの修正**
```html
<!-- ❌ よくある間違い -->
<img src="purattokunn.png">
<img src="/assets/images/purattokunn.png">
<img src="images/purattokunn.png">

<!-- ✅ 正しいパス -->
<img src="assets/images/purattokunn.png">
```

**B. ファイル名の確認**
```bash
# ファイルの存在確認
ls assets/images/
# purattokunn.png があるか確認
# スペルミス、大文字小文字に注意
```

**C. 代替画像の設定**
```html
<img src="assets/images/purattokunn.png" 
     onerror="this.src='assets/images/placeholder.png'"
     alt="ぷらっとくん">
```

### パターン6: ❌ IDの不一致によるエラー ✅ 検証済み

#### 🔍 確認方法
- コンソールに`Cannot read properties of null`エラー
- `getElementById`が`null`を返している
- 要素のIDが間違っている

#### 💡 解決策

**A. HTMLとJavaScriptのID確認**
```javascript
// ❌ よくある間違い
const character = document.getElementById('demoCharacter');  // 存在しないID

// ✅ 正しいID
const character = document.getElementById('demo-purattokun-canvas');  // 実際のID
```

**B. デバッグ用ID確認スクリプト**
```javascript
// 全てのCanvas要素のIDを確認
const canvases = document.querySelectorAll('canvas');
console.log('Canvas要素一覧:');
canvases.forEach(canvas => {
    console.log('- ID:', canvas.id || '(IDなし)');
    console.log('  クラス:', canvas.className);
});
```

**C. 変数初期化タイミングの修正**
```javascript
// ❌ DOMロード前に取得
const element = document.getElementById('myElement');  // null

// ✅ DOMロード後に取得
window.addEventListener('load', () => {
    const element = document.getElementById('myElement');  // 要素取得可能
});
```

### パターン7: ❌ 要素の枠だけ見えて中身が表示されない ⚠️ 要検証

#### 🔍 確認方法
- ボーダー（枠線）は見える
- 背景色やデバッグ用の装飾は見える
- しかし画像やCanvasの内容が見えない

#### 💡 解決策

**A. Canvas要素の描画確認**
```javascript
// Canvasが実際に描画されているか確認
const canvas = document.getElementById('demo-purattokun-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    // テスト描画
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 10, 50, 50);
    console.log('✅ テスト四角形を描画しました');
}
```

**B. フォールバック画像の強制表示**
```javascript
// 両方の要素を取得
const canvas = document.getElementById('demo-purattokun-canvas');
const fallback = document.getElementById('demo-fallback-image');

// Canvasを非表示にしてフォールバックを表示
if (canvas && fallback) {
    canvas.style.display = 'none';
    fallback.style.display = 'block';
    // 枠線も確認のため一時的に太くする
    fallback.style.border = '3px solid blue';
    console.log('✅ フォールバック画像に切り替えました');
}
```

**C. 画像の読み込み状態確認**
```javascript
const img = document.getElementById('demo-fallback-image');
if (img) {
    console.log('画像状態:', {
        src: img.src,
        読み込み完了: img.complete,
        naturalWidth: img.naturalWidth,
        display: img.style.display,
        visibility: img.style.visibility
    });
    
    // 読み込みエラーの場合
    img.onerror = () => console.error('❌ 画像読み込みエラー');
    img.onload = () => console.log('✅ 画像読み込み成功');
}
```

**D. z-indexの競合確認**
```javascript
// 全ての要素のz-indexを確認
const elements = document.querySelectorAll('.positioned-element');
elements.forEach(el => {
    const zIndex = window.getComputedStyle(el).zIndex;
    console.log(el.id, 'z-index:', zIndex);
});
```

### パターン8: ❌ 要素の表示/非表示状態の混乱 ⚠️ 要検証

#### 🔍 確認方法
- Canvas要素とフォールバック画像が同じ位置に存在
- 両方とも`display: none`または片方だけ表示
- 赤い点線（ボーダー）は見えるが内容が見えない

#### 💡 解決策

**A. 表示状態の強制切り替え**
```javascript
// Canvas非表示、フォールバック画像表示
const canvas = document.getElementById('demo-purattokun-canvas');
const fallback = document.getElementById('demo-fallback-image');

if (canvas && fallback) {
    canvas.style.display = 'none';
    fallback.style.display = 'block';
    console.log('✅ フォールバック画像に切り替え完了');
}
```

**B. HTML直接修正**
```html
<!-- ❌ 問題のパターン -->
<canvas id="demo-purattokun-canvas" class="positioned-element"></canvas>
<img id="demo-fallback-image" style="display: none;">

<!-- ✅ 修正後 -->
<canvas id="demo-purattokun-canvas" class="positioned-element" style="display: none;"></canvas>
<img id="demo-fallback-image" style="display: block;">
```

**C. 検証方法**
```javascript
// 両方の要素の表示状態を確認
const elements = ['demo-purattokun-canvas', 'demo-fallback-image'];
elements.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        console.log(`${id}: display = ${el.style.display || 'default'}`);
    }
});
```

### パターン9: ❌ SpineとCanvasの問題 ✅ 検証済み

#### 🔍 確認方法
- Canvas要素は存在するが真っ白
- コンソールにSpine関連エラー

#### 💡 解決策

**A. Spineライブラリの読み込み確認**
```html
<!-- ✅ Spine WebGL読み込み -->
<script src="https://unpkg.com/@esotericsoftware/spine-webgl@4.1.*/dist/iife/spine-webgl.js"></script>

<script>
// Spine読み込み確認
if (typeof spine === 'undefined') {
    console.error('❌ Spine WebGLが読み込まれていません');
} else {
    console.log('✅ Spine WebGL読み込み完了');
}
</script>
```

**B. フォールバック画像の必須設定**
```html
<!-- ✅ Spineが失敗してもフォールバック画像で表示 -->
<canvas id="purattokun-canvas" class="positioned-element"></canvas>
<img src="assets/images/purattokunn.png" 
     id="fallback-purattokun"
     class="positioned-element"
     style="object-fit: contain; display: none;">

<script>
// Spine初期化失敗時にフォールバック表示
function showFallback() {
    document.getElementById('purattokun-canvas').style.display = 'none';
    document.getElementById('fallback-purattokun').style.display = 'block';
}
</script>
```

**C. Canvas サイズの設定**
```javascript
// Canvas要素のサイズ設定
const canvas = document.getElementById('purattokun-canvas');
const updateCanvasSize = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    console.log('Canvas実サイズ:', canvas.width + 'x' + canvas.height);
};
updateCanvasSize();
window.addEventListener('resize', updateCanvasSize);
```

---

## 🛠️ 段階的解決手順

### Step 1: 最小限テスト
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        .background-container {
            position: relative;
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid blue; /* 確認用 */
        }
        .background-image {
            width: 100%;
            height: auto;
            display: block;
        }
        .positioned-element {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            background: red; /* 確認用 */
            border: 2px solid yellow; /* 確認用 */
            z-index: 10;
        }
    </style>
</head>
<body>
    <div class="background-container">
        <img src="assets/images/クラウドパートナーTOP.png" class="background-image">
        <div class="positioned-element">TEST</div>
    </div>
</body>
</html>
```

### Step 2: 静的画像テスト
```html
<!-- Step 1が成功したら画像に置き換え -->
<div class="background-container">
    <img src="assets/images/クラウドパートナーTOP.png" class="background-image">
    <img src="assets/images/purattokunn.png" 
         class="positioned-element"
         style="object-fit: contain;">
</div>
```

### Step 3: Spine統合
```html
<!-- Step 2が成功したらSpineを追加 -->
<div class="background-container">
    <img src="assets/images/クラウドパートナーTOP.png" class="background-image">
    <canvas class="positioned-element"></canvas>
    <!-- フォールバック保持 -->
    <img src="assets/images/purattokunn.png" 
         class="positioned-element fallback"
         style="object-fit: contain; display: none;">
</div>
```

---

## 📋 チェックリスト

### 基本確認
- [ ] HTML要素が存在する
- [ ] CSSクラスが正しく適用されている
- [ ] 画像ファイルが存在する（404エラーなし）
- [ ] サイズが適切（80px程度）
- [ ] z-indexが適切（10以上）

### 応用確認
- [ ] 複数ブラウザで動作確認
- [ ] スマホでも表示確認
- [ ] Spineファイルの存在確認
- [ ] フォールバック画像の設定

### デバッグ確認
- [ ] 診断スクリプトでサイズ確認
- [ ] コンソールエラーの確認
- [ ] ネットワークタブで画像読み込み確認

---

## 🚀 予防策

### 1. 必ずフォールバック画像を設置
```html
<!-- ✅ 推奨パターン -->
<canvas class="positioned-element main-character"></canvas>
<img src="assets/images/purattokunn.png" 
     class="positioned-element fallback-character"
     style="object-fit: contain;">
```

### 2. 適切なサイズ設定
```css
/* ✅ 見えやすいサイズ */
.positioned-element {
    width: 80px;    /* 固定サイズ */
    height: 80px;
    min-width: 40px;  /* 最小保証 */
    min-height: 40px;
}
```

### 3. 段階的開発
```
1. 静的な赤い四角で位置確認
    ↓
2. 静的画像で表示確認
    ↓  
3. Spine統合
```

---

## 🔗 関連ドキュメント

- **Canvasサイズ変更問題**: [CANVAS_SIZE_TROUBLESHOOTING.md](./CANVAS_SIZE_TROUBLESHOOTING.md)
- **位置ズレ問題**: [CRITICAL_STRUCTURE_DIFFERENCE_ANALYSIS.md](./CRITICAL_STRUCTURE_DIFFERENCE_ANALYSIS.md)
- **Spine技術詳細**: [SPINE_TROUBLESHOOTING.md](./SPINE_TROUBLESHOOTING.md)
- **レイヤー問題**: [LAYER_DEBUGGING.md](./LAYER_DEBUGGING.md)

---

## 📊 検証状況について

**✅ 検証済み**: 実際に問題が解決したことを確認済みの項目
**⚠️ 要検証**: 理論的には正しいが、実環境での効果が未確認の項目

**効果が確認されていない項目は今後の検証で削除される可能性があります。**

---

**このガイドで解決しない場合は、最小限のテストケースを作成してから段階的に機能を追加してください。**