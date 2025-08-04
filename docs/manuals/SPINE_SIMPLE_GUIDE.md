# 🎯 シンプルSpine実装ガイド

**目的**: 背景なし・最小構成でSpineアニメーションを実装する  
**用途**: ボタンギミック・装飾要素・エフェクト・UI要素  
**前提知識**: HTML/CSS/JavaScript基礎知識

---

## 📋 このガイドで実現できること

- ✅ **最小構成**: 背景なし・シンプルな構造
- ✅ **柔軟な配置**: 任意の位置に配置可能
- ✅ **用途別対応**: ボタン・装飾・エフェクトに最適化
- ✅ **軽量実装**: 必要最小限のコード
- ✅ **エラーハンドリング**: フォールバック画像対応

---

## 🎯 用途別テンプレート選択

| 用途 | 特徴 | 推奨テンプレート |
|------|------|-----------------|
| **ボタンギミック** | クリック反応あり | [テンプレート A](#-テンプレート-a-ボタンギミック版) |
| **装飾要素** | アニメーションのみ | [テンプレート B](#-テンプレート-b-装飾要素版) |
| **エフェクト** | 短時間再生・消える | [テンプレート C](#-テンプレート-c-エフェクト版) |

---

## 📦 必要な準備

### 1. Spineアセット
```
assets/spine/characters/[名前]/
├── [名前].atlas
├── [名前].json
└── [名前].png
```

### 2. フォールバック画像（推奨）
```
assets/images/
└── [名前]_fallback.png
```

---

## 🎯 テンプレート A: ボタンギミック版

### HTML構造
```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spineボタンギミック</title>
    <style>
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

        /* Spineボタンコンテナ */
        .spine-button-container {
            position: relative;
            display: inline-block;
            margin: 50px;
        }

        /* Spineキャンバス */
        #spine-button-canvas {
            width: 200px;           /* ボタンサイズ調整 */
            aspect-ratio: 3/2;      /* 縦横比固定 */
            display: none;          /* 初期は非表示 */
            cursor: pointer;        /* クリック可能表示 */
        }

        /* フォールバック画像 */
        #spine-button-fallback {
            width: 200px;           /* キャンバスと同じサイズ */
            aspect-ratio: 3/2;
            object-fit: contain;
            display: block;         /* 初期表示 */
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="spine-button-container">
        <!-- Spineキャンバス -->
        <canvas id="spine-button-canvas" width="300" height="200"></canvas>
        
        <!-- フォールバック画像 -->
        <img src="assets/images/button_fallback.png" alt="ボタン" id="spine-button-fallback">
    </div>

    <!-- Spine WebGL Runtime -->
    <script src="https://unpkg.com/@esotericsoftware/spine-webgl@4.1.24/dist/iife/spine-webgl.js"></script>
    
    <script>
        // 🎯 Spineボタン初期化
        async function initSpineButton() {
            try {
                await waitForSpine();

                const canvas = document.getElementById("spine-button-canvas");
                const fallback = document.getElementById("spine-button-fallback");

                const gl = canvas.getContext("webgl", { alpha: true });
                if (!gl) {
                    throw new Error("WebGL未対応");
                }

                // アセットマネージャー
                const basePath = "./assets/spine/characters/button/";
                const assetManager = new spine.AssetManager(gl, basePath);

                assetManager.loadTextureAtlas("button.atlas");
                assetManager.loadJson("button.json");

                await waitForAssets(assetManager);

                // Spineスケルトン構築
                const atlas = assetManager.get("button.atlas");
                const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
                const skeletonJson = new spine.SkeletonJson(atlasLoader);
                const skeletonData = skeletonJson.readSkeletonData(
                    assetManager.get("button.json")
                );

                const skeleton = new spine.Skeleton(skeletonData);
                
                // キャラクター位置設定
                skeleton.x = 0;                          // Canvas中央
                skeleton.y = -50;                        // 調整可能
                skeleton.scaleX = skeleton.scaleY = 1.0; // スケール調整

                // アニメーション設定
                const animationStateData = new spine.AnimationStateData(skeleton.data);
                const animationState = new spine.AnimationState(animationStateData);

                // 初期アニメーション（idle等）
                if (skeleton.data.findAnimation("idle")) {
                    animationState.setAnimation(0, "idle", true);
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

                // 🎯 ボタンクリック判定
                canvas.addEventListener("click", () => {
                    console.log("🎯 ボタンクリック！");
                    
                    // クリックアニメーション再生
                    if (skeleton.data.findAnimation("click")) {
                        animationState.setAnimation(0, "click", false);
                        animationState.addAnimation(0, "idle", true, 0);
                    }
                    
                    // ここにボタン処理を追加
                    handleButtonClick();
                });

                // 成功時：Canvas表示、フォールバック非表示
                canvas.style.display = "block";
                fallback.style.display = "none";

                console.log("✅ Spineボタン初期化完了");

            } catch (error) {
                console.error("❌ Spineボタン初期化失敗:", error);
                // フォールバック画像のまま表示
            }
        }

        // ボタン処理関数
        function handleButtonClick() {
            console.log("ボタンが押されました！");
            // ここに実際の処理を記述
            // 例：ページ遷移、モーダル表示、API呼び出し等
        }

        // Spine WebGL読み込み待ち
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

        // 初期化実行
        window.addEventListener("load", () => {
            setTimeout(initSpineButton, 500);
        });
    </script>
</body>
</html>
```

---

## 🎨 テンプレート B: 装飾要素版

### HTML構造（簡略版）
```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Spine装飾要素</title>
    <style>
        .spine-decoration {
            position: absolute;      /* 自由配置用 */
            top: 20px;              /* 位置調整 */
            right: 20px;            /* 位置調整 */
            width: 150px;           /* サイズ調整 */
            aspect-ratio: 1/1;      /* 正方形 */
            pointer-events: none;   /* クリック無効 */
        }

        #decoration-canvas {
            width: 100%;
            height: 100%;
            display: none;
        }

        #decoration-fallback {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
        }
    </style>
</head>
<body>
    <!-- メインコンテンツ -->
    <h1>メインページ</h1>
    <p>この右上にSpine装飾要素が表示されます</p>

    <!-- Spine装飾要素 -->
    <div class="spine-decoration">
        <canvas id="decoration-canvas" width="200" height="200"></canvas>
        <img src="assets/images/decoration_fallback.png" alt="装飾" id="decoration-fallback">
    </div>

    <!-- Spine WebGL Runtime -->
    <script src="https://unpkg.com/@esotericsoftware/spine-webgl@4.1.24/dist/iife/spine-webgl.js"></script>
    
    <script>
        // 🎨 Spine装飾要素初期化（簡略版）
        async function initSpineDecoration() {
            try {
                await waitForSpine();

                const canvas = document.getElementById("decoration-canvas");
                const fallback = document.getElementById("decoration-fallback");

                const gl = canvas.getContext("webgl", { alpha: true });
                if (!gl) throw new Error("WebGL未対応");

                // アセット読み込み
                const basePath = "./assets/spine/characters/decoration/";
                const assetManager = new spine.AssetManager(gl, basePath);

                assetManager.loadTextureAtlas("decoration.atlas");
                assetManager.loadJson("decoration.json");

                await waitForAssets(assetManager);

                // Spine構築
                const atlas = assetManager.get("decoration.atlas");
                const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
                const skeletonJson = new spine.SkeletonJson(atlasLoader);
                const skeletonData = skeletonJson.readSkeletonData(
                    assetManager.get("decoration.json")
                );

                const skeleton = new spine.Skeleton(skeletonData);
                skeleton.x = 0;
                skeleton.y = -50;
                skeleton.scaleX = skeleton.scaleY = 0.8;

                const animationStateData = new spine.AnimationStateData(skeleton.data);
                const animationState = new spine.AnimationState(animationStateData);

                // ループアニメーション開始
                if (skeleton.data.findAnimation("loop")) {
                    animationState.setAnimation(0, "loop", true);
                }

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

                // 成功時表示切り替え
                canvas.style.display = "block";
                fallback.style.display = "none";

                console.log("✅ Spine装飾要素初期化完了");

            } catch (error) {
                console.error("❌ Spine装飾要素初期化失敗:", error);
            }
        }

        // Spine WebGL読み込み待ち（共通関数）
        async function waitForSpine() {
            return new Promise((resolve, reject) => {
                let checkCount = 0;
                const maxChecks = 50;
                const checkSpine = () => {
                    checkCount++;
                    if (typeof spine !== "undefined") {
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

        // アセット読み込み待ち（共通関数）
        async function waitForAssets(assetManager) {
            return new Promise((resolve, reject) => {
                let checkCount = 0;
                const maxChecks = 50;
                const checkAssets = () => {
                    checkCount++;
                    if (assetManager.isLoadingComplete()) {
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

        // 初期化実行
        window.addEventListener("load", () => {
            setTimeout(initSpineDecoration, 500);
        });
    </script>
</body>
</html>
```

---

## ⚡ テンプレート C: エフェクト版

### HTML構造（トリガー付き）
```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Spineエフェクト</title>
    <style>
        .spine-effect {
            position: fixed;        /* 画面固定 */
            top: 50%;              /* 中央配置 */
            left: 50%;             /* 中央配置 */
            transform: translate(-50%, -50%);
            width: 300px;
            aspect-ratio: 1/1;
            pointer-events: none;   /* クリック無効 */
            z-index: 1000;         /* 最前面 */
            opacity: 0;            /* 初期は透明 */
            transition: opacity 0.3s ease;
        }

        .spine-effect.show {
            opacity: 1;            /* 表示時は不透明 */
        }

        #effect-canvas {
            width: 100%;
            height: 100%;
            display: none;
        }

        #effect-fallback {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: none;         /* エフェクトはフォールバック非表示 */
        }

        /* トリガーボタン */
        .trigger-button {
            margin: 50px;
            padding: 15px 30px;
            background: #4caf50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <h1>Spineエフェクトデモ</h1>
    
    <!-- エフェクト発動ボタン -->
    <button class="trigger-button" onclick="playSpineEffect()">🎆 エフェクト発動</button>

    <!-- Spineエフェクト -->
    <div class="spine-effect" id="spine-effect-container">
        <canvas id="effect-canvas" width="400" height="400"></canvas>
        <img src="assets/images/effect_fallback.png" alt="エフェクト" id="effect-fallback">
    </div>

    <!-- Spine WebGL Runtime -->
    <script src="https://unpkg.com/@esotericsoftware/spine-webgl@4.1.24/dist/iife/spine-webgl.js"></script>
    
    <script>
        let spineEffect = null; // グローバル参照

        // 🎆 Spineエフェクト初期化
        async function initSpineEffect() {
            try {
                await waitForSpine();

                const canvas = document.getElementById("effect-canvas");
                const container = document.getElementById("spine-effect-container");

                const gl = canvas.getContext("webgl", { alpha: true });
                if (!gl) throw new Error("WebGL未対応");

                // アセット読み込み
                const basePath = "./assets/spine/characters/effect/";
                const assetManager = new spine.AssetManager(gl, basePath);

                assetManager.loadTextureAtlas("effect.atlas");
                assetManager.loadJson("effect.json");

                await waitForAssets(assetManager);

                // Spine構築
                const atlas = assetManager.get("effect.atlas");
                const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
                const skeletonJson = new spine.SkeletonJson(atlasLoader);
                const skeletonData = skeletonJson.readSkeletonData(
                    assetManager.get("effect.json")
                );

                const skeleton = new spine.Skeleton(skeletonData);
                skeleton.x = 0;
                skeleton.y = -100;
                skeleton.scaleX = skeleton.scaleY = 1.2;

                const animationStateData = new spine.AnimationStateData(skeleton.data);
                const animationState = new spine.AnimationState(animationStateData);

                const renderer = new spine.SceneRenderer(canvas, gl);

                // エフェクト完了時のコールバック
                animationState.addListener({
                    complete: (entry) => {
                        console.log("🎆 エフェクト完了");
                        // エフェクト終了時に非表示
                        container.classList.remove("show");
                    }
                });

                // 描画ループ
                let lastTime = Date.now() / 1000;
                let isPlaying = false;

                function render() {
                    const now = Date.now() / 1000;
                    const delta = now - lastTime;
                    lastTime = now;

                    if (isPlaying) {
                        animationState.update(delta);
                        animationState.apply(skeleton);
                        skeleton.updateWorldTransform();

                        gl.clearColor(0, 0, 0, 0);
                        gl.clear(gl.COLOR_BUFFER_BIT);
                        gl.viewport(0, 0, canvas.width, canvas.height);

                        renderer.begin();
                        renderer.drawSkeleton(skeleton, true);
                        renderer.end();
                    }

                    requestAnimationFrame(render);
                }
                render();

                // グローバル参照として保存
                spineEffect = {
                    skeleton,
                    animationState,
                    container,
                    canvas,
                    play: () => {
                        if (skeleton.data.findAnimation("effect")) {
                            console.log("🎆 エフェクト開始");
                            container.classList.add("show");
                            animationState.setAnimation(0, "effect", false);
                            isPlaying = true;
                        }
                    }
                };

                canvas.style.display = "block";
                console.log("✅ Spineエフェクト初期化完了");

            } catch (error) {
                console.error("❌ Spineエフェクト初期化失敗:", error);
            }
        }

        // エフェクト再生関数
        function playSpineEffect() {
            if (spineEffect) {
                spineEffect.play();
            } else {
                console.log("Spineエフェクトが初期化されていません");
            }
        }

        // 共通関数（waitForSpine, waitForAssets）
        async function waitForSpine() {
            return new Promise((resolve, reject) => {
                let checkCount = 0;
                const maxChecks = 50;
                const checkSpine = () => {
                    checkCount++;
                    if (typeof spine !== "undefined") {
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

        async function waitForAssets(assetManager) {
            return new Promise((resolve, reject) => {
                let checkCount = 0;
                const maxChecks = 50;
                const checkAssets = () => {
                    checkCount++;
                    if (assetManager.isLoadingComplete()) {
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

        // 初期化実行
        window.addEventListener("load", () => {
            setTimeout(initSpineEffect, 500);
        });
    </script>
</body>
</html>
```

---

## ⚙️ カスタマイズ設定

### 位置・サイズ調整
```css
/* 位置調整 */
.spine-container {
    position: absolute;
    top: 20px;        /* 上からの距離 */
    left: 50px;       /* 左からの距離 */
}

/* サイズ調整 */
#spine-canvas {
    width: 150px;     /* 幅 */
    aspect-ratio: 3/2; /* 縦横比 */
}
```

### Spineパラメータ調整
```javascript
// 位置調整
skeleton.x = 0;      // X位置（-200 ~ 200）
skeleton.y = -100;   // Y位置（-200 ~ 200）

// スケール調整
skeleton.scaleX = skeleton.scaleY = 0.8; // スケール（0.1 ~ 3.0）
```

---

## 🚨 よくある問題と対策

### 1. アニメーションが再生されない
**症状**: キャンバスは表示されるがアニメーションしない  
**原因**: アニメーション名の不一致  
**解決策**: コンソールでアニメーション一覧を確認
```javascript
// 利用可能なアニメーション確認
console.log("📋 利用可能なアニメーション:");
for (let i = 0; i < skeleton.data.animations.length; i++) {
    console.log(`  - ${skeleton.data.animations[i].name}`);
}
```

### 2. CDN読み込みエラー
**症状**: `spine is not defined` エラー  
**原因**: CDNバージョンの問題  
**解決策**: 正しいバージョン（4.1.24）を使用

### 3. Canvas表示されない
**症状**: フォールバック画像のまま  
**原因**: アセットパスの間違い  
**解決策**: F12でネットワークタブを確認

### 4. クリック判定が効かない
**症状**: ボタンクリックに反応しない  
**原因**: `pointer-events: none` または重なり要素  
**解決策**: CSS `z-index` と `pointer-events` を確認

---

## 🔍 デバッグ方法

### F12コンソールでの確認
```javascript
// Spine WebGL読み込み確認
typeof spine !== "undefined"

// アセット読み込み確認
assetManager.isLoadingComplete()

// アニメーション状態確認
animationState.getCurrent(0)
```

### 段階的テスト手順
1. **HTML表示確認**: ページが正常に読み込まれるか
2. **フォールバック確認**: 画像が表示されるか
3. **Spine読み込み確認**: CDNエラーがないか
4. **アセット読み込み確認**: .atlas/.jsonが200で取得できるか
5. **Canvas表示確認**: キャンバスが表示されるか
6. **アニメーション確認**: 期待通りの動作をするか

---

## 📈 応用・拡張

### 複数エフェクトの管理
```javascript
const effectManager = {
    effects: {},
    
    register(name, effect) {
        this.effects[name] = effect;
    },
    
    play(name) {
        if (this.effects[name]) {
            this.effects[name].play();
        }
    }
};
```

### レスポンシブ対応
```css
@media (max-width: 768px) {
    .spine-container {
        width: 120px;  /* モバイル時サイズ調整 */
    }
}
```

---

**🎯 次のステップ**: 用途に応じたテンプレートを選択し、アセットパスとアニメーション名を調整して実装してください。