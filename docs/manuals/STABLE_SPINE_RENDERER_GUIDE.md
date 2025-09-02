# 🎯 StableSpineRenderer 完全マニュアル

**最終更新**: 2025-09-02  
**対象**: StableSpineRenderer v1.0  
**推奨度**: ⭐⭐⭐⭐⭐ **最高推奨** - 黒枠問題完全解決・毎回確実動作

---

## 📋 概要

**StableSpineRenderer** は、Spine WebGL を使用した安定性重視のレンダリングモジュールです。

### 🎯 主な特徴
- **黒枠問題完全解決**: `premultipliedAlpha: true` 固定で口周りの黒枠を根本解決
- **毎回確実動作**: AIの「さじ加減」による問題を排除、設定固定化
- **汎用性確保**: キャラクター・位置・スケールを自由に設定可能
- **簡単統合**: 既存プロジェクトに最小限の変更で統合可能
- **キャラクター別最適化**: 各キャラクターの利用可能アニメーションを自動対応

### 🚀 適用場面
- ✅ **確実性重視**: 毎回エラーなく動作させたい
- ✅ **黒枠回避**: 口周りの黒枠問題を根本的に解決したい
- ✅ **商用プロジェクト**: 安定動作が必須の商用利用
- ✅ **複数キャラクター**: 複数のSpineキャラクターを管理
- ✅ **モジュール化**: 再利用可能な形で実装したい

---

## 🚀 クイックスタート

### 📦 必要なファイル

1. **Spine WebGL CDN**
```html
<script src="https://unpkg.com/@esotericsoftware/spine-webgl@4.1.24/dist/iife/spine-webgl.js"></script>
```

2. **StableSpineRenderer モジュール**
```html
<script src="micromodules/spine-renderer/StableSpineRenderer.js"></script>
```

3. **Canvas要素**
```html
<canvas id="spine-canvas" width="400" height="400"></canvas>
```

### ⚡ 3分で実装

```html
<!DOCTYPE html>
<html>
<head>
    <title>StableSpineRenderer クイックスタート</title>
</head>
<body>
    <canvas id="spine-canvas" width="400" height="400"></canvas>
    
    <script src="https://unpkg.com/@esotericsoftware/spine-webgl@4.1.24/dist/iife/spine-webgl.js"></script>
    <script src="micromodules/spine-renderer/StableSpineRenderer.js"></script>
    <script>
        async function start() {
            // 1行で作成・初期化（キャラクター名を指定）
            const renderer = StableSpineRenderer.createForCharacter('purattokun');  // または 'nezumi'
            await renderer.initialize();
            
            // アニメーション再生（キャラクターに応じて変更）
            renderer.playAnimation('taiki');  // purattokun用（nezumiの場合は'search'）
        }
        
        // ページ読み込み後に自動開始
        window.addEventListener('load', start);
    </script>
</body>
</html>
```

---

## 🎮 キャラクター別アニメーション対応表

### 📋 **重要**: キャラクター固有のアニメーション名

各Spineキャラクターは**固有のアニメーション名**を持ちます。存在しないアニメーション名を指定すると `Animation not found` エラーが発生します。

#### 🐱 **purattokun** キャラクター
```javascript
// ✅ 利用可能アニメーション
'taiki'     // 待機モーション（ループ推奨）
'yarare'    // やられモーション（単発）
'syutugen'  // 出現モーション（単発）

// ✅ 正しい設定例
const renderer = new StableSpineRenderer({
    character: 'purattokun',
    defaultAnimation: 'taiki'  // purattokun専用
});
```

#### 🐭 **nezumi** キャラクター
```javascript
// ✅ 利用可能アニメーション
'search'   // サーチモーション（ループ推奨）
'kettei'   // 決定モーション（単発）

// ✅ 正しい設定例
const renderer = new StableSpineRenderer({
    character: 'nezumi',
    defaultAnimation: 'search'  // nezumi専用
});
```

#### 🚨 **よくあるエラー**
```javascript
// ❌ 間違った例: nezumiにpurattokun用アニメーションを指定
const nezumiRenderer = new StableSpineRenderer({
    character: 'nezumi',
    defaultAnimation: 'taiki'  // ❌ nezumiには存在しない
});
// → エラー: Animation not found: taiki

// ❌ 間違った例: 存在しないアニメーション名
renderer.playAnimation('walk');  // ❌ どちらのキャラクターにも存在しない
```

#### 🎨 **Canvas縦横比の重要な注意事項**

**🚨 重要**: StableSpineRenderer v1.0では、HTMLのCanvas要素のサイズを自動的に尊重します。

```html
<!-- ✅ 正しい例: HTMLでCanvasサイズを指定 -->
<canvas id="spine-canvas" width="800" height="600"></canvas>

<script>
// コンストラクタでcanvasサイズを指定しない
const renderer = new StableSpineRenderer({
    character: 'purattokun'
    // canvasWidth, canvasHeight は指定不要（HTMLサイズを使用）
});
</script>
```

**解決された問題**:
- **症状**: キャラクターが歪んで表示される（縦横比が崩れる）
- **原因**: StableSpineRendererが内部でCanvas要素を400x400に強制リサイズ
- **解決策**: HTMLのCanvas要素サイズを優先する仕様に変更（v1.0で修正済み）

```javascript
// ❌ 旧バージョン（歪み発生）
// 内部で強制的に400x400に変更 → 縦横比が崩れる

// ✅ v1.0（修正済み）
// HTMLの800x600をそのまま使用 → 正しい縦横比を維持
```

#### 🔍 **アニメーション名の確認方法**
```javascript
// 初期化後に利用可能アニメーションを確認
const status = renderer.getStatus();
if (status.hasSkeleton) {
    console.log('利用可能アニメーション:', 
        renderer.skeleton.data.animations.map(anim => anim.name)
    );
}
```

---

## 🛠️ 基本的な使用方法

### 1️⃣ 基本パターン（推奨）

```javascript
// シンプルな使用法
const renderer = StableSpineRenderer.createForCharacter('YOUR_CHARACTER_NAME');
await renderer.initialize();
renderer.playAnimation('taiki');
```

### 2️⃣ カスタム設定パターン

```javascript
const renderer = new StableSpineRenderer({
    canvas: '#my-canvas',           // Canvas セレクター
    character: 'YOUR_CHARACTER_NAME',        // キャラクター名
    basePath: '/assets/spine/characters/',  // ベースパス
    position: {                     // 位置・スケール
        x: 0,
        y: -100,
        scaleX: 0.55,
        scaleY: 0.55
    },
    defaultAnimation: 'taiki',      // デフォルトアニメーション
    debug: true                     // デバッグログ有効
});

await renderer.initialize();
```

### 3️⃣ 複数キャラクターパターン

```javascript
// 複数キャラクター一括作成
const renderers = await StableSpineRenderer.createMultiple(
    ['purattokun', 'nezumi'],       // キャラクター配列
    '.spine-container'              // コンテナセレクター
);

// それぞれ個別に制御
renderers[0].playAnimation('syutugen');
renderers[1].playAnimation('taiki');
```

---

## 🎬 アニメーション制御

### 基本的なアニメーション再生

```javascript
// 単発アニメーション
renderer.playAnimation('syutugen', false);  // ループなし

// ループアニメーション
renderer.playAnimation('taiki', true);      // ループあり

// 自動判定（taikiはループ、その他は単発）
renderer.playAnimation('taiki');  // 自動的にループあり
renderer.playAnimation('yarare'); // 自動的にループなし
```

### アニメーションシーケンス

```javascript
// 出現 → 待機の自然遷移
renderer.playSequence(['syutugen', 'taiki']);

// 複数アニメーション連続再生
renderer.playSequence(['syutugen', 'yarare', 'taiki']);
```

### よく使うアニメーションパターン

```javascript
// 🎬 登場演出
renderer.playSequence(['syutugen', 'taiki']);

// 💥 クリック時のリアクション
renderer.playAnimation('yarare');

// 😊 通常の待機状態
renderer.playAnimation('taiki');
```

---

## 📍 位置・スケール制御

### 位置の変更

```javascript
// 位置のみ変更
renderer.setTransform(100, 200);

// X座標のみ変更
renderer.setTransform(100, null);

// Y座標のみ変更
renderer.setTransform(null, 200);
```

### スケールの変更

```javascript
// スケールのみ変更
renderer.setTransform(null, null, 0.8, 0.8);

// 位置とスケール同時変更
renderer.setTransform(100, 200, 0.8, 0.8);
```

### 設定値の目安

```javascript
// 推奨位置設定
const positions = {
    center: { x: 0, y: -100 },      // 中央
    left: { x: -150, y: -100 },     // 左寄り
    right: { x: 150, y: -100 },     // 右寄り
    bottom: { x: 0, y: 0 }          // 下部
};

// 推奨スケール設定
const scales = {
    large: 1.0,     // 大きめ
    normal: 0.55,   // 標準（推奨）
    small: 0.3      // 小さめ
};
```

---

## 🔧 高度な設定

### デバッグモード

```javascript
const renderer = new StableSpineRenderer({
    debug: true,                    // デバッグログ有効
    logCallback: (message) => {     // カスタムログ処理
        console.log('🎯', message);
        document.getElementById('log').textContent += message + '\n';
    }
});
```

### Canvas設定

```javascript
const renderer = new StableSpineRenderer({
    canvas: document.getElementById('my-canvas'),  // DOM要素直接指定
    canvasWidth: 800,               // Canvas幅
    canvasHeight: 600               // Canvas高さ
});
```

### キャラクター設定

```javascript
const renderer = new StableSpineRenderer({
    character: 'nezumi',            // 違うキャラクター
    basePath: '/custom/path/',      // カスタムパス
    defaultAnimation: 'syutugen'    // 異なるデフォルトアニメーション
});
```

---

## 📊 状態管理・監視

### システム状態の確認

```javascript
const status = renderer.getStatus();

console.log('初期化済み:', status.initialized);
console.log('読み込み中:', status.loading);
console.log('アニメーション実行中:', status.isAnimationRunning);
console.log('コンポーネント状態:', {
    canvas: status.hasCanvas,
    webgl: status.hasWebGL,
    skeleton: status.hasSkeleton
});
```

### デバッグ情報の表示

```javascript
// ステータス表示（デバッグ用）
function showStatus() {
    const status = renderer.getStatus();
    alert(`
        初期化: ${status.initialized ? '✅' : '❌'}
        アニメーション: ${status.isAnimationRunning ? '🎬' : '⏹️'}
        キャラクター: ${status.config.character}
    `);
}

// 定期的な状態確認
setInterval(() => {
    if (renderer.getStatus().initialized) {
        console.log('✅ StableSpineRenderer 正常動作中');
    }
}, 5000);
```

---

## 🎯 実用的なサンプル

### 1️⃣ クリック反応システム

```javascript
const renderer = StableSpineRenderer.createForCharacter('purattokun');
await renderer.initialize();

// キャラクターをクリックでリアクション
document.getElementById('spine-canvas').addEventListener('click', () => {
    renderer.playAnimation('yarare');
    
    // 3秒後に待機状態に戻る
    setTimeout(() => {
        renderer.playAnimation('taiki');
    }, 3000);
});
```

### 2️⃣ マウスオーバー演出

```javascript
const canvas = document.getElementById('spine-canvas');

canvas.addEventListener('mouseenter', () => {
    renderer.playAnimation('syutugen');
});

canvas.addEventListener('mouseleave', () => {
    renderer.playAnimation('taiki');
});
```

### 3️⃣ ボタン機能として使用

```javascript
// ボタンとして機能するSpineキャラクター
class SpineButton {
    constructor(character, onClick) {
        this.renderer = StableSpineRenderer.createForCharacter(character);
        this.onClick = onClick;
    }
    
    async initialize() {
        await this.renderer.initialize();
        
        // クリックイベント設定
        this.renderer.canvas.addEventListener('click', () => {
            this.renderer.playAnimation('yarare');
            this.onClick();
        });
        
        // ホバー効果
        this.renderer.canvas.style.cursor = 'pointer';
    }
}

// 使用例
const button = new SpineButton('purattokun', () => {
    alert('ぷらっとくんがクリックされました！');
});
await button.initialize();
```

### 4️⃣ 複数キャラクターでの会話シーン

```javascript
async function createConversationScene() {
    // 2キャラクター配置
    const purattokun = new StableSpineRenderer({
        canvas: '#canvas-1',
        character: 'purattokun',
        position: { x: -100, y: -100, scaleX: 0.5, scaleY: 0.5 }
    });
    
    const nezumi = new StableSpineRenderer({
        canvas: '#canvas-2',
        character: 'nezumi',
        position: { x: 100, y: -100, scaleX: 0.5, scaleY: 0.5 }
    });
    
    await Promise.all([
        purattokun.initialize(),
        nezumi.initialize()
    ]);
    
    // 会話シーケンス
    async function conversation() {
        // ぷらっとくん登場
        purattokun.playSequence(['syutugen', 'taiki']);
        await delay(2000);
        
        // ねずみ登場
        nezumi.playSequence(['syutugen', 'taiki']);
        await delay(2000);
        
        // リアクション
        purattokun.playAnimation('yarare');
        nezumi.playAnimation('yarare');
    }
    
    conversation();
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## 🛡️ エラーハンドリング

### 基本的なエラー処理

```javascript
try {
    const renderer = StableSpineRenderer.createForCharacter('purattokun');
    await renderer.initialize();
    console.log('✅ 初期化成功');
} catch (error) {
    console.error('❌ 初期化失敗:', error.message);
    
    // フォールバック処理
    document.getElementById('spine-canvas').style.display = 'none';
    document.getElementById('fallback-image').style.display = 'block';
}
```

### WebGL対応チェック

```javascript
function checkWebGLSupport() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
        alert('WebGLがサポートされていません');
        return false;
    }
    
    return true;
}

// 初期化前にチェック
if (checkWebGLSupport()) {
    const renderer = StableSpineRenderer.createForCharacter('purattokun');
    await renderer.initialize();
} else {
    // WebGL非対応時の代替処理
    showFallbackImage();
}
```

### アセット読み込みエラー処理

```javascript
const renderer = new StableSpineRenderer({
    character: 'purattokun',
    debug: true,
    logCallback: (message) => {
        // エラーログを監視
        if (message.includes('❌')) {
            console.warn('StableSpineRenderer エラー:', message);
            
            // 特定エラーへの対応
            if (message.includes('Asset loading failed')) {
                showAssetError();
            }
        }
    }
});

function showAssetError() {
    alert('Spineファイルの読み込みに失敗しました。ファイルパスを確認してください。');
}
```

---

## 🔧 トラブルシューティング

### よくある問題と解決策

#### 1️⃣ 黒枠が表示される
**症状**: キャラクターの口周りに黒い縁が表示  
**原因**: 他のSpineシステムが `premultipliedAlpha: false` を使用  
**解決策**: StableSpineRenderer を使用（自動的に `premultipliedAlpha: true` を適用）

```javascript
// ❌ 他のシステムで黒枠が発生する場合
const badRenderer = new SomeOtherSpineRenderer({
    premultipliedAlpha: false  // これが黒枠の原因
});

// ✅ StableSpineRenderer を使用
const goodRenderer = StableSpineRenderer.createForCharacter('purattokun');
// 自動的に premultipliedAlpha: true が適用される
```

#### 2️⃣ 初期化エラー
**症状**: `StableSpineRenderer is not defined`  
**解決策**: スクリプトの読み込み順序を確認

```html
<!-- ✅ 正しい順序 -->
<script src="https://unpkg.com/@esotericsoftware/spine-webgl@4.1.24/dist/iife/spine-webgl.js"></script>
<script src="micromodules/spine-renderer/StableSpineRenderer.js"></script>
<script>
    // ここでStableSpineRendererを使用
</script>
```

#### 3️⃣ キャラクターが表示されない
**症状**: Canvas は表示されるがキャラクターが見えない  
**解決策**: 

1. **アセットパスの確認**
```javascript
const renderer = new StableSpineRenderer({
    character: 'purattokun',  // ファイル名と一致しているか？
    basePath: '/assets/spine/characters/',  // パスが正しいか？
    debug: true  // ログを確認
});
```

2. **Canvas サイズの確認**
```javascript
const renderer = new StableSpineRenderer({
    canvasWidth: 400,   // 十分な大きさか？
    canvasHeight: 400
});
```

3. **位置の調整**
```javascript
renderer.setTransform(0, -100, 0.55, 0.55);  // 見える位置に調整
```

#### 4️⃣ アニメーションが動作しない
**症状**: キャラクターは表示されるがアニメーションしない  
**解決策**:

1. **アニメーション名の確認**
```javascript
// デバッグ: 利用可能なアニメーション一覧表示
const status = renderer.getStatus();
if (status.hasSkeleton) {
    console.log('利用可能アニメーション:', 
        renderer.skeleton.data.animations.map(anim => anim.name)
    );
}
```

2. **アニメーション状態の確認**
```javascript
const status = renderer.getStatus();
console.log('アニメーション実行中:', status.isAnimationRunning);
```

#### 5️⃣ 複数キャラクターの競合
**症状**: 複数のStableSpineRendererを使用時にエラー  
**解決策**: それぞれ異なるCanvas要素を使用

```html
<!-- ✅ 正しい方法 -->
<canvas id="canvas-1"></canvas>
<canvas id="canvas-2"></canvas>

<script>
const renderer1 = new StableSpineRenderer({ canvas: '#canvas-1', character: 'purattokun' });
const renderer2 = new StableSpineRenderer({ canvas: '#canvas-2', character: 'nezumi' });
</script>
```

---

## ⚡ パフォーマンス最適化

### 1️⃣ 初期化の最適化

```javascript
// 複数キャラクターの並列初期化
const renderers = [
    StableSpineRenderer.createForCharacter('purattokun'),
    StableSpineRenderer.createForCharacter('nezumi')
];

// 並列で初期化（高速）
await Promise.all(renderers.map(r => r.initialize()));

// ❌ 順次初期化（遅い）
// for (const renderer of renderers) {
//     await renderer.initialize();  // 順次実行で遅い
// }
```

### 2️⃣ メモリ使用量の最適化

```javascript
// 不要になったレンダラーの適切な停止
function cleanup() {
    renderer.stop();  // メモリ解放
    renderer = null;
}

// ページ遷移時のクリーンアップ
window.addEventListener('beforeunload', cleanup);
```

### 3️⃣ レンダリングの最適化

```javascript
// 画面外にある場合はアニメーション停止
function optimizePerformance() {
    const canvas = renderer.canvas;
    const rect = canvas.getBoundingClientRect();
    
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
        // 画面外の場合は停止
        renderer.status.isAnimationRunning = false;
    } else {
        // 画面内の場合は再開
        renderer.status.isAnimationRunning = true;
    }
}

// スクロール時に最適化実行
window.addEventListener('scroll', optimizePerformance);
```

---

## 📚 API リファレンス

### コンストラクタ

```javascript
new StableSpineRenderer(config)
```

**config オプション**:
- `canvas`: Canvas要素またはセレクター文字列
- `character`: キャラクター名（文字列）
- `basePath`: アセットベースパス（文字列）
- `canvasWidth`: Canvas幅（数値）
- `canvasHeight`: Canvas高さ（数値）
- `position`: 位置・スケール設定（オブジェクト）
  - `x`: X座標（数値）
  - `y`: Y座標（数値）
  - `scaleX`: X軸スケール（数値）
  - `scaleY`: Y軸スケール（数値）
- `defaultAnimation`: デフォルトアニメーション（文字列）
- `debug`: デバッグモード（真偽値）
- `logCallback`: ログコールバック（関数）

### インスタンスメソッド

#### `initialize()` : Promise<boolean>
レンダラーの初期化を実行

#### `playAnimation(animationName, loop?)` : boolean
指定されたアニメーションを再生

#### `playSequence(animations)` : boolean
アニメーションシーケンスを再生

#### `setTransform(x?, y?, scaleX?, scaleY?)` : boolean
位置・スケールを設定

#### `getStatus()` : object
システム状態を取得

#### `stop()` : void
レンダラーを停止・クリーンアップ

### 静的メソッド

#### `StableSpineRenderer.createForCharacter(character, canvas?, options?)` : StableSpineRenderer
キャラクター用の簡単ファクトリー

#### `StableSpineRenderer.createMultiple(characters, container?)` : Promise<StableSpineRenderer[]>
複数キャラクター一括作成

---

## 🔒 重要な注意事項

### ⚠️ 変更禁止設定

以下の設定は黒枠問題解決のため**変更禁止**です：

```javascript
// 🔒 変更禁止（StableSpineRenderer内部で固定）
this.STABLE_WEBGL_CONFIG = {
    alpha: true,
    premultipliedAlpha: true,    // 🔥 絶対に変更禁止
    antialias: true,
    depth: false,
    stencil: false
};
```

### 🚫 使用禁止パターン

```javascript
// ❌ 低レベルシェーダー操作の禁止
shader.bind();
shader.setUniform4x4f(...);  // 不安定・複雑

// ❌ premultipliedAlpha: false の禁止
const gl = canvas.getContext('webgl', {
    premultipliedAlpha: false  // 黒枠の原因
});

// ❌ 直接的なWebGL操作の禁止
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);  // 設定競合の原因
```

### ✅ 推奨パターン

```javascript
// ✅ 高レベルAPI使用
const renderer = StableSpineRenderer.createForCharacter('purattokun');
await renderer.initialize();
renderer.playAnimation('taiki');

// ✅ 設定の変更は専用メソッド使用
renderer.setTransform(100, 200, 0.8, 0.8);

// ✅ 状態管理は専用メソッド使用
const status = renderer.getStatus();
```

---

## 🎉 成功事例・実装例

### 成功事例1: 商用サイトでの安定運用

```javascript
// 商用サイトでの実装例
class CommercialSpineDisplay {
    constructor() {
        this.renderer = null;
        this.failCount = 0;
    }
    
    async initialize() {
        try {
            this.renderer = StableSpineRenderer.createForCharacter('purattokun');
            await this.renderer.initialize();
            
            // 成功ログ
            this.trackEvent('spine_load_success');
            this.failCount = 0;
            
        } catch (error) {
            this.failCount++;
            this.trackEvent('spine_load_failure', { error: error.message });
            
            // 3回失敗したらフォールバック
            if (this.failCount >= 3) {
                this.showFallbackImage();
            } else {
                // 再試行
                setTimeout(() => this.initialize(), 1000);
            }
        }
    }
    
    trackEvent(name, data = {}) {
        // 分析ツールに送信
        console.log(`Analytics: ${name}`, data);
    }
    
    showFallbackImage() {
        document.getElementById('spine-container').innerHTML = 
            '<img src="/assets/images/purattokun_fallback.png" alt="ぷらっとくん">';
    }
}
```

### 成功事例2: 複数キャラクター管理システム

```javascript
class MultiCharacterManager {
    constructor() {
        this.renderers = new Map();
    }
    
    async addCharacter(name, canvasId) {
        try {
            const renderer = new StableSpineRenderer({
                canvas: canvasId,
                character: name,
                debug: true
            });
            
            await renderer.initialize();
            this.renderers.set(name, renderer);
            
            console.log(`✅ キャラクター追加成功: ${name}`);
            return true;
            
        } catch (error) {
            console.error(`❌ キャラクター追加失敗: ${name}`, error);
            return false;
        }
    }
    
    playAnimationAll(animationName) {
        this.renderers.forEach((renderer, name) => {
            renderer.playAnimation(animationName);
            console.log(`🎬 ${name}: ${animationName}`);
        });
    }
    
    getSystemStatus() {
        const status = {};
        this.renderers.forEach((renderer, name) => {
            status[name] = renderer.getStatus();
        });
        return status;
    }
    
    cleanup() {
        this.renderers.forEach(renderer => renderer.stop());
        this.renderers.clear();
    }
}
```

---

## 📞 サポート・トラブル相談

### 問題が発生した場合の対処順序

1. **F12開発者ツール**でコンソールエラーを確認
2. **デバッグモード**を有効にしてログを確認
3. **最小構成**から始めて段階的に機能を追加
4. **このマニュアルのトラブルシューティング**セクションを参照
5. **基準ファイル** `test-stable-spine-renderer.html` と比較

### よくある質問

**Q: 他のSpineシステムとの併用は可能ですか？**  
A: 可能ですが、WebGL設定の競合を避けるため、StableSpineRenderer を優先使用することを推奨します。

**Q: モバイルでも動作しますか？**  
A: はい、WebGL対応デバイスで動作します。ただし、パフォーマンス最適化を推奨します。

**Q: キャラクターファイルの形式は？**  
A: Spine WebGL 4.1.24 対応の .atlas, .json, .png ファイルが必要です。

### 技術サポート

- **基準実装**: `test-stable-spine-renderer.html`
- **成功パターン**: `test-spine-basic-loading.html`
- **トラブルシューティング**: `docs/troubleshooting/Spine口周り黒枠問題完全解決記録.md`

---

**🎯 StableSpineRenderer は「確実に動作する」ことを最優先に設計されています。**  
**黒枠問題の根本解決と、毎回エラーなく動作する安定性を提供します。**

---

**マニュアル作成日**: 2025-09-02  
**対応バージョン**: StableSpineRenderer v1.0  
**基準実装**: test-spine-basic-loading.html の成功パターン