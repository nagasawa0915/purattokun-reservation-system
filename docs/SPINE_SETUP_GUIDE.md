# 🎯 Spine初期セットアップガイド

## 📚 このガイドについて

**目的**: Spineキャラクターを最初から正しく設定し、後からトラブルシューティングが不要な完璧な実装を実現する  
**適用範囲**: 新規Spineキャラクター追加時、既存キャラクターの改善時  
**前提知識**: HTML/CSS/JavaScript基礎知識、Spine WebGL概要

## 🏆 このガイドで実現できること

- ✅ **完全レスポンシブ対応**：ウィンドウリサイズでも背景画像と完全同期
- ✅ **キャラクター潰れなし**：縦横比固定による正常表示
- ✅ **精密クリック判定**：キャラクター画像位置のみでリアクション
- ✅ **背景画像同期**：背景画像との完璧な位置合わせ
- ✅ **シンプル座標管理**：複雑な座標変換を回避

## 📋 必要な準備

### 1. Spineアセット
```
assets/spine/characters/[キャラクター名]/
├── [キャラクター名].atlas
├── [キャラクター名].json
└── [キャラクター名].png
```

### 2. フォールバック画像
```
assets/images/
└── [キャラクター名].png
```

### 3. 背景画像
```
assets/images/
└── 背景画像.png
```

## 🎯 Step 1: HTML構造の作成

### 基本構造（推奨）
```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spineキャラクター</title>
    <style>
        /* Step 2のCSS設定をここに記述 */
    </style>
</head>
<body>
    <!-- Step 1.1: コンテナ構造 -->
    <div class="scene-container">
        <!-- Step 1.2: 背景画像 -->
        <img src="assets/images/背景画像.png" alt="背景" class="background-image">
        
        <!-- Step 1.3: Spineキャラクター（Canvas） -->
        <canvas id="character-canvas" width="300" height="200"></canvas>
        
        <!-- Step 1.4: フォールバック画像 -->
        <img src="assets/images/キャラクター.png" alt="キャラクター" id="character-fallback">
    </div>

    <!-- Step 1.5: Spine WebGL Runtime -->
    <script src="https://unpkg.com/@esotericsoftware/spine-webgl@4.1.*/dist/iife/spine-webgl.js"></script>
    
    <script>
        /* Step 3のJavaScript設定をここに記述 */
    </script>
</body>
</html>
```

### 重要なポイント
- **コンテナは1つ**：`.scene-container`でシンプル構造
- **Canvas解像度**：`width="300" height="200"`（3:2比率推奨）
- **要素順序**：背景→Canvas→フォールバック の順番を守る

## 🎨 Step 2: CSS設定（完全レスポンシブ対応）

```css
/* 基本リセット */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    background: #f0f0f0;
    font-family: Arial, sans-serif;
}

/* 🔑 重要：シーンコンテナ（レスポンシブ基準） */
.scene-container {
    position: relative;           /* 子要素の絶対位置基準 */
    width: 100%;                 /* 画面幅に合わせる */
    max-width: 1200px;           /* 最大幅制限 */
    margin: 0 auto;              /* 中央寄せ（50px autoは使わない） */
    background: white;           /* 必要に応じて */
    border-radius: 10px;         /* 必要に応じて */
    overflow: hidden;            /* はみ出し防止 */
    box-shadow: 0 4px 8px rgba(0,0,0,0.1); /* 必要に応じて */
}

/* 🎯 重要：背景画像（基準となる要素） */
.background-image {
    width: 100%;                 /* コンテナ幅に合わせる */
    height: auto;                /* 縦横比維持 */
    display: block;              /* inline要素の隙間除去 */
}

/* 🎮 重要：Spineキャラクター用Canvas */
#character-canvas {
    position: absolute;          /* 背景画像上に重ねる */
    left: 35%;                   /* 背景画像基準の位置（調整可能） */
    top: 75%;                    /* 背景画像基準の位置（調整可能） */
    transform: translate(-50%, -50%); /* 中央寄せ */
    width: 25%;                  /* 🔑 背景画像と同じ比例拡縮 */
    aspect-ratio: 3/2;           /* 🔑 縦横比固定（潰れ防止） */
    z-index: 10;                 /* 前面表示 */
    display: none;               /* 初期は非表示（JS読み込み後に表示） */
    cursor: pointer;             /* クリック可能表示 */
    
    /* デバッグ用（必要に応じて） */
    border: 2px dashed rgba(255, 0, 0, 0.3);
    background: rgba(255, 255, 0, 0.05);
}

/* 💫 フォールバック画像（Spine読み込み失敗時） */
#character-fallback {
    position: absolute;          /* Canvas位置と同期 */
    left: 35%;                   /* Canvasと同じ位置 */
    top: 75%;                    /* Canvasと同じ位置 */
    transform: translate(-50%, -50%);
    width: 10%;                  /* 🔑 背景画像と同じ比例拡縮 */
    aspect-ratio: 1/1;           /* 正方形維持 */
    object-fit: contain;         /* 画像比率維持 */
    z-index: 10;
    display: block;              /* 初期表示（Spine成功時に非表示化） */
}
```

### 🔑 CSS設定の重要なポイント

#### 1. レスポンシブ対応の核心
- **パーセンテージ（%）使用**：背景画像と同じ基準で拡縮
- **viewport units（vw/vh）は使わない**：親要素制約との相互作用で不安定

#### 2. キャラクター潰れ防止
- **aspect-ratio: 3/2**：Canvas内部解像度（300×200）と同じ比率
- **width指定のみ**：heightは自動計算で正確な比率維持

#### 3. 座標管理の統一
- **position: relative/absolute**：シンプルな2段階構造
- **transform: translate(-50%, -50%)**：正確な中央寄せ

## ⚙️ Step 3: JavaScript設定（精密クリック判定対応）

```javascript
// Spine WebGLの読み込み待ち
async function waitForSpine() {
    return new Promise((resolve, reject) => {
        let checkCount = 0;
        const maxChecks = 50;

        const checkSpine = () => {
            checkCount++;
            if (typeof spine !== "undefined") {
                console.log("✅ Spine WebGL読み込み完了");
                resolve();
            } else if (checkCount >= maxChecks) {
                reject(new Error("Spine WebGL読み込みタイムアウト"));
            } else {
                setTimeout(checkSpine, 100);
            }
        };

        checkSpine();
    });
}

// アセット読み込み待ち
async function waitForAssets(assetManager) {
    return new Promise((resolve, reject) => {
        let checkCount = 0;
        const maxChecks = 50;

        const checkAssets = () => {
            checkCount++;
            if (assetManager.isLoadingComplete()) {
                console.log("✅ アセット読み込み完了");
                resolve();
            } else if (checkCount >= maxChecks) {
                reject(new Error("アセット読み込みタイムアウト"));
            } else {
                setTimeout(checkAssets, 100);
            }
        };

        checkAssets();
    });
}

// 🎯 メイン：Spineキャラクター初期化
async function initSpineCharacter() {
    try {
        await waitForSpine();

        const canvas = document.getElementById("character-canvas");
        const fallback = document.getElementById("character-fallback");

        const gl = canvas.getContext("webgl", { alpha: true });
        if (!gl) {
            throw new Error("WebGL未対応");
        }

        // アセットマネージャー
        const basePath = "./assets/spine/characters/キャラクター名/";
        const assetManager = new spine.AssetManager(gl, basePath);

        assetManager.loadTextureAtlas("キャラクター名.atlas");
        assetManager.loadJson("キャラクター名.json");

        await waitForAssets(assetManager);

        // Spineスケルトン構築
        const atlas = assetManager.get("キャラクター名.atlas");
        const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
        const skeletonJson = new spine.SkeletonJson(atlasLoader);
        const skeletonData = skeletonJson.readSkeletonData(
            assetManager.get("キャラクター名.json")
        );

        const skeleton = new spine.Skeleton(skeletonData);
        
        // 🔑 重要：キャラクター位置設定
        skeleton.x = 0;              // Canvas中央（X軸）
        skeleton.y = -100;           // 地面から100px上（Spineアセット設計による）
        skeleton.scaleX = skeleton.scaleY = 0.55; // スケール調整

        // アニメーション設定
        const animationStateData = new spine.AnimationStateData(skeleton.data);
        const animationState = new spine.AnimationState(animationStateData);

        // 登場→待機のシーケンス開始
        if (skeleton.data.findAnimation("syutugen") && skeleton.data.findAnimation("taiki")) {
            console.log("🎬 syutugen（登場）アニメーション開始");
            animationState.setAnimation(0, "syutugen", false); // 1回のみ再生
            animationState.addAnimation(0, "taiki", true, 0);   // 完了後に待機ループ
        } else if (skeleton.data.findAnimation("taiki")) {
            console.log("🎬 taiki（待機）アニメーション開始（syutugenなし）");
            animationState.setAnimation(0, "taiki", true);
        }

        // レンダラー
        const renderer = new spine.SceneRenderer(canvas, gl);

        // 描画ループ
        let lastTime = Date.now() / 1000;
        function render() {
            const now = Date.now() / 1000;
            const delta = now - lastTime;
            lastTime = now;

            animationState.update(delta);
            animationState.apply(skeleton);
            skeleton.updateWorldTransform();

            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.viewport(0, 0, canvas.width, canvas.height);

            renderer.begin();
            renderer.drawSkeleton(skeleton, true);
            renderer.end();

            requestAnimationFrame(render);
        }
        render();

        // 🎯 重要：精密クリック判定（キャラクター画像位置のみ）
        canvas.addEventListener("click", (event) => {
            // Canvas内の相対座標を取得
            const rect = canvas.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;
            
            // Canvas内座標を0-1の範囲に正規化
            const normalizedX = clickX / rect.width;
            const normalizedY = clickY / rect.height;
            
            // キャラクター画像の範囲を定義（skeleton位置に合わせて調整）
            const charCenterX = 0.5;  // Canvas中央（50%）
            const charCenterY = 0.6;  // Canvas中央より少し下（60%）
            const charWidth = 0.4;    // キャラクター幅（40%）
            const charHeight = 0.5;   // キャラクター高さ（50%）
            
            // キャラクター画像範囲内かチェック
            const withinX = Math.abs(normalizedX - charCenterX) < charWidth / 2;
            const withinY = Math.abs(normalizedY - charCenterY) < charHeight / 2;
            
            if (withinX && withinY) {
                // キャラクター画像内をクリックした場合のみリアクション
                if (skeleton.data.findAnimation("yarare")) {
                    console.log("🎯 yarare（やられ）アニメーション開始");
                    animationState.setAnimation(0, "yarare", false); // 1回のみ再生
                    animationState.addAnimation(0, "taiki", true, 0); // 完了後に待機復帰
                } else {
                    console.log("⚠️ yarareアニメーションが見つかりません");
                }
            } else {
                console.log("🔍 キャラクター画像外をクリック（リアクションなし）");
            }
        });

        // 成功時：Canvas表示、フォールバック非表示
        canvas.style.display = "block";
        fallback.style.display = "none";

        console.log("✅ Spineキャラクター初期化完了");

        // 利用可能なアニメーション一覧をログ出力
        console.log("📋 利用可能なアニメーション:");
        for (let i = 0; i < skeleton.data.animations.length; i++) {
            console.log(`  - ${skeleton.data.animations[i].name}`);
        }

    } catch (error) {
        console.error("❌ Spineキャラクター初期化失敗:", error);
        // フォールバック画像のまま表示
    }
}

// 初期化実行
window.addEventListener("load", () => {
    setTimeout(initSpineCharacter, 500);
});
```

### 🔑 JavaScript設定の重要なポイント

#### 1. 精密クリック判定の実装
- **座標正規化**：Canvas内の相対座標を0-1範囲に変換
- **範囲チェック**：キャラクター画像位置のみでリアクション
- **デバッグログ**：クリック位置の判定結果を確認可能

#### 2. エラーハンドリング
- **読み込み待ち**：Spine WebGLとアセットの確実な読み込み
- **WebGL対応チェック**：未対応ブラウザへの対応
- **フォールバック表示**：Spine失敗時の画像表示

#### 3. アニメーション制御
- **シーケンス再生**：登場→待機の自然な流れ
- **リアクション制御**：クリック時のやられアニメーション

## 🔧 Step 4: カスタマイズ設定

### 4.1 キャラクター位置の調整
```css
/* CSS側：Canvas位置 */
#character-canvas {
    left: 35%;   /* 横位置調整（0-100%） */
    top: 75%;    /* 縦位置調整（0-100%） */
}
```

```javascript
// JavaScript側：Skeleton位置
skeleton.x = 0;      // Canvas内X位置（-200 ~ 200程度）
skeleton.y = -100;   // Canvas内Y位置（-200 ~ 200程度）
skeleton.scaleX = skeleton.scaleY = 0.55; // スケール（0.1 ~ 2.0程度）
```

### 4.2 クリック判定範囲の調整
```javascript
// キャラクター画像の範囲を定義
const charCenterX = 0.5;  // 中心X（0.0-1.0）
const charCenterY = 0.6;  // 中心Y（0.0-1.0）
const charWidth = 0.4;    // 幅（0.0-1.0）
const charHeight = 0.5;   // 高さ（0.0-1.0）
```

### 4.3 Canvas要素のサイズ調整
```css
#character-canvas {
    width: 25%;           /* 背景画像に対する割合 */
    aspect-ratio: 3/2;    /* 縦横比（内部解像度に合わせる） */
}
```

```html
<!-- Canvas内部解像度（aspect-ratioと合わせる） -->
<canvas id="character-canvas" width="300" height="200"></canvas>
```

## 📊 Step 5: 動作確認チェックリスト

### 5.1 基本動作確認
- [ ] ページ読み込み時にキャラクターが表示される
- [ ] アニメーション（登場→待機）が正常に再生される
- [ ] キャラクター画像をクリックするとリアクション（やられ）が発生する
- [ ] キャラクター外をクリックしてもリアクションしない

### 5.2 レスポンシブ動作確認
- [ ] ウィンドウサイズを変更しても位置がずれない
- [ ] ウィンドウサイズを変更してもキャラクターが潰れない
- [ ] 背景画像とキャラクターが同じ割合で拡縮する
- [ ] モバイル・タブレット・デスクトップで正常表示される

### 5.3 エラー処理確認
- [ ] WebGL未対応ブラウザでフォールバック画像が表示される
- [ ] Spineアセット読み込み失敗時にフォールバック画像が表示される
- [ ] コンソールエラーが発生しない（F12で確認）

## 🚨 よくある問題と対策

### 問題1: キャラクターが潰れる
**原因**: CSS `aspect-ratio` と Canvas内部解像度の比率が異なる  
**解決策**: `aspect-ratio: 3/2` と `width="300" height="200"` を一致させる

### 問題2: ウィンドウリサイズで位置がずれる
**原因**: viewport units（vw/vh）使用や親要素マージン設定  
**解決策**: パーセンテージ（%）使用と `margin: 0 auto` 設定

### 問題3: クリック判定が大雑把
**原因**: Canvas全体でのクリック判定  
**解決策**: 座標計算による精密範囲判定の実装

### 問題4: 背景画像と同期しない
**原因**: 異なる座標基準の混在  
**解決策**: 全てを親要素（背景画像コンテナ）基準に統一

## 📈 応用・拡張方法

### 複数キャラクターの追加
```html
<!-- 複数Canvas要素 -->
<canvas id="character1-canvas" width="300" height="200"></canvas>
<canvas id="character2-canvas" width="300" height="200"></canvas>
```

```css
/* 異なる位置に配置 */
#character1-canvas { left: 20%; top: 60%; }
#character2-canvas { left: 80%; top: 40%; }
```

### 動的位置変更システム
```javascript
// HTML設定制御システム（CLAUDE.md参照）
function updateCharacterPosition(characterId, x, y) {
    const canvas = document.getElementById(characterId + '-canvas');
    canvas.style.left = x + '%';
    canvas.style.top = y + '%';
}
```

### アニメーション拡張
```javascript
// 複数リアクションの実装
const reactions = ['yarare', 'yorokobi', 'kanashimi'];
const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
animationState.setAnimation(0, randomReaction, false);
```

## 🔗 関連ドキュメント

| 目的 | ドキュメント |
|------|-------------|
| **問題発生時の解決** | [📋 docs/_TROUBLESHOOTING.md](../docs/_TROUBLESHOOTING.md) |
| **日常的な開発作業** | [📘 ../CLAUDE.md](../CLAUDE.md) |
| **技術詳細・実装情報** | [📖 DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) |
| **アーキテクチャ設計** | [🏛️ ARCHITECTURE_NOTES.md](./ARCHITECTURE_NOTES.md) |

## 💡 まとめ

このガイドに従うことで：

1. **トラブルシューティング不要**：最初から正しい設定で実装
2. **完全レスポンシブ対応**：全デバイスで完璧な表示
3. **自然なインタラクション**：精密なクリック判定
4. **保守性の高い実装**：シンプルで理解しやすい構造

**重要**: このガイドは実際のプロジェクトでの問題解決経験から生まれました。各設定には確実な根拠があり、省略すると問題が発生する可能性があります。

---

**🎯 次のステップ**: このガイドを使用してSpineキャラクターを実装し、問題が発生した場合は関連ドキュメントを参照してください。