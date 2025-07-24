# Spine WebGL ランタイム統合トラブルシューティングガイド

このドキュメントは、Spine WebGLランタイムの実装で遭遇した問題と解決策を詳細に記録し、今後の同様プロジェクトでの迅速な問題解決を支援することを目的としています。

## 🎯 目次

1. [バージョン互換性問題](#1-バージョン互換性問題)
2. [サーバー設定関連問題](#2-サーバー設定関連問題)
3. [Canvas位置指定問題](#3-canvas位置指定問題)
4. [アセット読み込み問題](#4-アセット読み込み問題)
5. [DOM配置・CSS制約問題](#5-dom配置css制約問題)
6. [パフォーマンス・メモリ管理](#6-パフォーマンスメモリ管理)
7. [デバッグ・診断システム](#7-デバッグ診断システム)
8. [CDN依存管理](#8-cdn依存管理)
9. [コードリファクタリング記録](#9-コードリファクタリング記録)
10. [クイック診断チェックリスト](#10-クイック診断チェックリスト)
11. [今後の問題記録](#11-今後の問題記録)

---

## 1. バージョン互換性問題

### 🚨 問題：Physics初期化エラー

**症状**：
```javascript
Error: physics is undefined at Skeleton.updateWorldTransform()
```

**根本原因**：
- Spine Runtime 4.2.*系 がphysics配列を要求
- Spine Data 4.1.24 にはphysicsConstraintsが存在しない
- バージョン不一致による互換性破綻

**解決策**：

#### 方法1：ランタイムバージョン固定（推奨）
```html
<!-- ❌ 問題のあるコード -->
<script src="https://unpkg.com/@esotericsoftware/spine-webgl@latest/dist/iife/spine-webgl.js"></script>

<!-- ✅ 修正版 -->
<script src="https://unpkg.com/@esotericsoftware/spine-webgl@4.1.*/dist/iife/spine-webgl.js"></script>
```

#### 方法2：多層防御システム（上級）
```javascript
// SkeletonDataレベル確認
if (skeleton.data.physicsConstraints) {
    skeleton.data.physicsConstraints.forEach(constraint => {
        constraint.active = false;
    });
}

// Skeletonオブジェクトレベル強制初期化
Object.defineProperty(skeleton, 'physics', { 
    value: [], 
    writable: true, 
    enumerable: true, 
    configurable: true 
});

// updateWorldTransform実行前最終チェック
if (typeof skeleton.physics === 'undefined') {
    skeleton.physics = [];
}
```

**予防策**：
- **絶対ルール**：Runtime と データのバージョンを必ず一致させる
- CDN URLでバージョンを明示的に固定
- `@latest`や`@*`での自動更新を避ける

---

## 2. サーバー設定関連問題

### 🚨 問題：Atlas読み込み404エラー

**症状**：
```
GET /assets/spine/characters/purattokun/purattokun.atlas HTTP/1.1 404 Not Found
```

**根本原因**：
標準HTTPサーバーが`.atlas`拡張子を認識せず、適切なMIMEタイプを返せない

**解決策**：

#### カスタムHTTPサーバー実装
```python
# server.py
import http.server
import socketserver
import mimetypes

class SpineHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        # .atlasファイルの特別処理
        if path.endswith('.atlas'):
            return 'text/plain', None
        
        # エラーハンドリング付きguess_type実装
        try:
            result = super().guess_type(path)
            # 複数の戻り値形式に対応
            return result if isinstance(result, tuple) else (result, None)
        except Exception:
            return 'application/octet-stream', None

# サーバー起動
PORT = 8000
with socketserver.TCPServer(("", PORT), SpineHTTPRequestHandler) as httpd:
    print(f"🚀 Spine対応HTTPサーバー起動: http://localhost:{PORT}")
    httpd.serve_forever()
```

**診断コマンド**：
```bash
# Atlas ファイル直接アクセステスト
curl -I http://localhost:8000/assets/spine/characters/purattokun/purattokun.atlas

# 期待結果：200 OK, Content-Type: text/plain
```

### 🚨 問題：JSONファイル読み込みタイムアウト

**症状**：
```javascript
⏳ Loading progress: 0/2 (attempt 100/100)
❌ Asset loading timeout after 10 seconds
```

**解決策**：
```bash
# サーバー再起動
pkill -f "python3 server.py"
python3 server.py > server.log 2>&1 &

# パフォーマンステスト
time curl -s -o /dev/null http://localhost:8000/assets/spine/characters/purattokun/purattokun.json
```

**予防策**：
- サーバーの定期再起動
- ファイルサイズ監視（12KB程度が正常）
- 読み込み時間監視（3ms以下が理想）

---

## 3. Canvas位置指定問題

### 🚨 問題：position設定が無効化される

**症状**：
```html
<!-- 期待値 -->
<canvas style="position: fixed; left: 18vw; top: 49vh;"></canvas>

<!-- 実際 -->
<canvas style="position: absolute; left: 0px; top: 0px;"></canvas>
```

**段階的診断と解決**：

#### Stage 1：初期設定問題
```javascript
// ❌ 問題のあるコード
canvas.style.cssText = `
    position: absolute;  // fixedであるべき
    pointer-events: none;
    z-index: 1;
`;

// ✅ 修正版
canvas.style.cssText = `
    position: absolute;  // または fixed（要件に応じて）
    pointer-events: none;
    z-index: 1;
`;
```

#### Stage 2：CSS上書き問題
```javascript
// ❌ 弱い設定（他CSSで上書きされる）
character.canvas.style.position = 'absolute';
character.canvas.style.left = x + 'vw';

// ✅ 強制設定（!important付き）
character.canvas.style.setProperty('position', 'absolute', 'important');
character.canvas.style.setProperty('left', x + 'vw', 'important');
character.canvas.style.setProperty('top', y + 'vh', 'important');
```

#### Stage 3：親要素制約問題
```css
/* 問題：.hero要素による制約 */
.hero {
    max-width: 1200px;  /* Canvas位置に影響 */
    margin: 0 auto;     /* 中央配置がCanvas制約 */
    position: relative; /* 子要素の基準点になる */
}
```

**最終解決策**：
```javascript
// Canvas を制約のない親要素に移動
document.body.appendChild(canvas);  // .heroから独立
```

**診断コード**：
```javascript
// 親要素の影響確認
let parent = canvas.parentElement;
let level = 0;
while (parent && level < 5) {
    const computedStyle = window.getComputedStyle(parent);
    console.log(`Parent ${level}: ${parent.tagName.toLowerCase()}`);
    console.log(`  - position: ${computedStyle.position}`);
    console.log(`  - transform: ${computedStyle.transform}`);
    console.log(`  - contain: ${computedStyle.contain}`);
    parent = parent.parentElement;
    level++;
}

// 実際の描画位置確認
const rect = canvas.getBoundingClientRect();
console.log(`Screen position: left=${rect.left}px, top=${rect.top}px`);
```

---

## 4. アセット読み込み問題

### 🚨 問題：AssetManager読み込み未完了

**症状**：
```javascript
📊 FORCE DEBUG - Asset Manager State:
   Assets to load: 2
   Assets loaded: 1
   Has errors: false
   
assets/spine/characters/purattokun/purattokun.json -> LOADED
assets/spine/characters/purattokun/purattokun.atlas -> NOT LOADED
```

**診断手順**：
```javascript
// 1. HTTP直接確認
const testUrls = [
    'assets/spine/characters/purattokun/purattokun.json',
    'assets/spine/characters/purattokun/purattokun.atlas',
    'assets/spine/characters/purattokun/purattokun.png'
];

testUrls.forEach(async (url) => {
    try {
        const response = await fetch(url);
        console.log(`${url}: ${response.status} ${response.statusText}`);
    } catch (error) {
        console.error(`${url}: ${error.message}`);
    }
});

// 2. AssetManager状態詳細確認
console.log('AssetManager internals:', {
    toLoad: assetManager.toLoad.length,
    loaded: assetManager.loaded.length,
    errors: Object.keys(assetManager.errors),
    isComplete: assetManager.isLoadingComplete()
});
```

**解決策**：
- カスタムサーバー使用確認
- ファイルパス検証
- ネットワークタブでHTTPステータス確認

---

## 5. DOM配置・CSS制約問題

### 🚨 問題：白い枠と一緒に動く

**症状**：
Canvas要素が`.hero-content`（白い枠）と連動して移動する

**根本原因**：
Canvas要素が`.hero`コンテナの子要素として制約を受けている

**解決策の変遷**：

#### Phase 1：position: fixed（画面固定）
```javascript
// スクロールに関係なく画面の同じ位置に固定
canvas.style.position = 'fixed';
canvas.style.left = x + 'vw';
canvas.style.top = y + 'vh';
```
**問題**：背景画像とずれる

#### Phase 2：position: absolute + body配置（背景同期）
```javascript
// 背景画像と一緒にスクロール
document.body.appendChild(canvas);  // 親要素から独立
canvas.style.position = 'absolute';
canvas.style.left = x + 'vw';
canvas.style.top = y + 'vh';
```
**結果**：背景画像の家と同期してスクロール

**要件明確化の重要性**：
- 「固定」には「画面固定」と「背景固定」がある
- ユーザー要求を正確に理解することが重要

---

## 6. パフォーマンス・メモリ管理

### WebGL最適化

```javascript
// WebGL Context設定
const canvas = document.createElement('canvas');
canvas.width = 600;   // 吹き出し表示対応
canvas.height = 500;  // 十分なサイズ確保

const context = new spine.ManagedWebGLRenderingContext(canvas);
const renderer = new spine.SceneRenderer(canvas, context);

// WebGL Capabilities確認
console.log('WebGL Capabilities:', {
    maxTextureSize: context.gl.getParameter(context.gl.MAX_TEXTURE_SIZE),
    maxViewportDims: context.gl.getParameter(context.gl.MAX_VIEWPORT_DIMS)
});
```

### メモリ管理

```javascript
class SpineCharacterManager {
    constructor() {
        this.characters = new Map();  // インスタンス管理
    }

    // 不要なリソース削除
    removeCharacter(name) {
        const character = this.characters.get(name);
        if (character) {
            if (character.canvas) character.canvas.remove();
            if (character.placeholder) character.placeholder.remove();
            this.characters.delete(name);
        }
    }
}
```

---

## 7. デバッグ・診断システム

### 段階的診断システム

```javascript
// 1. Spine Runtime確認
console.log('🔍 Spine Runtime Information:');
console.log('  - Type:', typeof spine);
console.log('  - Keys:', Object.keys(spine));
console.log('  - WebGL support:', !!spine.webgl);

// 2. アセット読み込み監視
function checkAssetLoading() {
    console.log(`⏳ Loading progress: ${assetManager.loaded.length}/${assetManager.toLoad.length}`);
    
    if (assetManager.isLoadingComplete()) {
        console.log('✅ All assets loaded successfully');
        // 次の段階へ
    } else if (assetManager.hasErrors()) {
        console.error('❌ Asset loading errors:', assetManager.getErrors());
    } else {
        setTimeout(checkAssetLoading, 100);
    }
}

// 3. Canvas位置検証
function verifyCanvasPosition(canvas, expectedX, expectedY) {
    const rect = canvas.getBoundingClientRect();
    const actualX = rect.left;
    const actualY = rect.top;
    
    console.log('📐 Position verification:');
    console.log(`  Expected: (${expectedX}px, ${expectedY}px)`);
    console.log(`  Actual: (${actualX}px, ${actualY}px)`);
    console.log(`  Match: ${Math.abs(actualX - expectedX) < 10 && Math.abs(actualY - expectedY) < 10}`);
}
```

### プレースホルダーシステム

```javascript
// 段階的フォールバック
function createPlaceholder(name, scale = 1.0) {
    const placeholder = document.createElement('div');
    placeholder.style.cssText = `
        width: 120px;
        height: 128px;
        background: linear-gradient(45deg, #ff6b6b22, #4ecdc422);
        border: 2px solid #ff6b6b;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8rem;
        position: absolute;
        animation: spineCharacterFloat 3s ease-in-out infinite;
        cursor: pointer;
        transform: scale(${scale});
    `;
    placeholder.textContent = '🐱';
    return placeholder;
}

@keyframes spineCharacterFloat {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-8px) rotate(2deg); }
    66% { transform: translateY(4px) rotate(-1deg); }
}
```

---

## 8. CDN依存管理

### 堅牢な初期化システム

```javascript
async function initSpineRuntime() {
    let attempts = 0;
    const maxAttempts = 100;  // 10秒間待機
    
    console.log('⏳ Waiting for Spine WebGL CDN to load...');
    
    while (typeof spine === 'undefined' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        
        if (attempts % 10 === 0) {
            console.log(`⏳ CDN loading attempt ${attempts}/${maxAttempts}...`);
        }
    }
    
    if (typeof spine === 'undefined') {
        console.error('❌ Spine WebGL runtime not loaded from CDN after 10 seconds');
        console.error('🔍 Check browser Network tab for CDN loading issues');
        return false;
    }
    
    console.log('✅ Spine WebGL 4.1.* initialized successfully from CDN');
    return true;
}
```

### CDN障害対策

```javascript
// 複数CDN対応（将来実装）
const SPINE_CDNS = [
    'https://unpkg.com/@esotericsoftware/spine-webgl@4.1.*/dist/iife/spine-webgl.js',
    'https://cdn.jsdelivr.net/npm/@esotericsoftware/spine-webgl@4.1.*/dist/iife/spine-webgl.js'
];

// ローカルフォールバック
if (typeof spine === 'undefined') {
    console.log('⚠️ CDN failed, attempting local fallback...');
    // ローカルファイル読み込み処理
}
```

---

## 9. クイック診断チェックリスト

### 問題発生時の確認手順

#### ✅ Step 1：基本確認
- [ ] Spine Runtime バージョン確認（4.1.*推奨）
- [ ] データファイルバージョン確認（4.1.24）
- [ ] カスタムサーバー起動確認（`python server.py`）
- [ ] ブラウザコンソールエラー確認

#### ✅ Step 2：アセット確認
```bash
# HTTPアクセステスト
curl -I http://localhost:8000/assets/spine/characters/purattokun/purattokun.json    # 200 OK
curl -I http://localhost:8000/assets/spine/characters/purattokun/purattokun.atlas  # 200 OK
curl -I http://localhost:8000/assets/spine/characters/purattokun/purattokun.png    # 200 OK
```

#### ✅ Step 3：Canvas位置確認
- [ ] Elements タブでCanvas要素のstyle確認
- [ ] `position: absolute/fixed` 確認
- [ ] `left: Xvw, top: Yvh` 確認
- [ ] 親要素が`body`であることを確認

#### ✅ Step 4：診断ツール使用
```html
<!-- 専用診断ページ -->
<a href="/test-atlas-fix.html">Atlas読み込み診断</a>
```

### 症状別クイック解決

| 症状 | 可能性の高い原因 | 解決策 |
|------|----------------|--------|
| 🐱プレースホルダー表示 | Atlas読み込み失敗 | カスタムサーバー確認 |
| Physics Error | バージョン不一致 | CDN URL修正（4.1.*） |
| Canvas位置ずれ | 親要素制約 | body配置確認 |
| 読み込みタイムアウト | サーバー応答遅延 | サーバー再起動 |

---

## 10. 今後の問題記録

> 📝 **今後遭遇した問題はこのセクションに追記してください**

### 🔄 ウィンドウリサイズ時の位置ズレ問題（2024年7月23日解決）

**発生日時**：2024-07-23

**症状**：
- ウィンドウサイズを変更すると、背景画像とぷらっとくんの位置関係がズレる
- 特に画面幅が1200px以上になると顕著にズレが発生
- スクロール時の位置関係は保たれるが、リサイズ時に基準が変わる

**根本原因**：
1. **基準の不一致**：
   - 背景画像：`.hero`セクション（`max-width: 1200px`で制限）を基準
   - ぷらっとくん：ビューポート全体（`vw/vh`単位）を基準
   - 大画面で`.hero`が1200pxに制限される一方、`vw/vh`は画面全体を基準に計算

2. **Canvas配置方式**：
   - Canvas要素を`document.body`に直接配置
   - ヒーローセクションとは独立した位置計算

**解決策**：

#### 1. CSS修正
```css
/* ヒーローセクションを基準枠として設定 */
.hero {
    width: 100%;  /* 明示的に幅を指定 */
    max-width: 1200px;
    position: relative;  /* 子要素の基準点 */
}

/* Spineキャラクター用CSS追加 */
#purattokun-canvas {
    position: absolute;
    pointer-events: none;
    z-index: 2;
    transform-origin: center center;
}
```

#### 2. JavaScript修正
```javascript
// Canvas配置先をheroセクション内に変更
const heroSection = document.querySelector('.hero');
heroSection.appendChild(canvas);

// 位置指定を%ベースに変更
character.canvas.style.setProperty('left', x + '%', 'important');
character.canvas.style.setProperty('top', y + '%', 'important');
character.canvas.style.setProperty('transform', `translate(-50%, -50%) scale(${scale})`, 'important');
```

#### 3. HTML設定更新
```html
<!-- 新しい%ベース設定ガイド -->
<div id="purattokun-config" style="display: none;"
     data-x="60"  <!-- ヒーローセクション幅の60% -->
     data-y="70"  <!-- ヒーローセクション高さの70% -->
     data-scale="0.80">
</div>
```

**実装のポイント**：
- **基準の統一**：ヒーローセクションを唯一の基準とする
- **相対位置計算**：`%`単位で親要素基準の位置指定
- **中心基準配置**：`translate(-50%, -50%)`でキャラクター中心を座標に固定

**テスト結果**：
- ✅ 320px〜1920px全域で背景画像との相対位置が完全に維持
- ✅ スクロール時も背景画像と一緒に移動し固定関係を保持
- ✅ モバイル・タブレット・デスクトップで一貫した表示

**影響範囲**：
- 既存のSpineアニメーション機能：影響なし
- 他のエフェクト系統：影響なし
- レスポンシブデザイン：大幅改善

**予防策**：
- 今後Spine要素を追加する際は、必ずヒーローセクション基準の相対位置を使用
- `vw/vh`ではなく`%`単位での位置指定を標準とする
- Canvas要素は対応する背景要素の子要素として配置する

**関連する既存問題**：
- [Canvas位置指定問題](#3-canvas位置指定問題)との関連性あり

### 🎭 キャラクター出現演出の変更（2024年7月23日実装）

**発生日時**：2024-07-23

**要求内容**：
- 透明度フェードイン演出を削除
- 初期配置を画面外に変更
- 2秒後に1フレームで瞬間移動する演出に変更

**変更前の仕様**：
```javascript
// 透明度ベースのフェードイン演出
character.canvas.style.opacity = '0'; // 初期は透明
fadeInCharacter(characterName, duration); // 透明→不透明のアニメーション
```

**変更後の仕様**：
```javascript
// 位置ベースの瞬間移動演出
character.canvas.style.setProperty('left', '-100%', 'important'); // 初期は画面外
slideInCharacter(characterName, delay); // 2秒後に瞬間移動
```

**実装の詳細**：

#### 1. 初期配置変更
```javascript
// setPositionメソッド内
// 変更前: 目標位置に透明で配置
character.canvas.style.setProperty('left', x + '%', 'important');
character.canvas.style.opacity = '0';

// 変更後: 画面外に不透明で配置
character.canvas.style.setProperty('left', '-100%', 'important');
character.canvas.style.opacity = '1';
character.targetX = x; // 目標位置を保存
```

#### 2. 演出メソッド変更
```javascript
// 変更前: fadeInCharacter
fadeInCharacter(characterName, duration = 2000) {
    element.style.transition = `opacity ${duration}ms ease-out`;
    element.style.opacity = '1';
}

// 変更後: slideInCharacter
slideInCharacter(characterName, delay = 2000) {
    setTimeout(() => {
        element.style.transition = 'none';
        element.style.setProperty('left', character.targetX + '%', 'important');
    }, delay);
}
```

#### 3. クリック時リプレイ演出変更
```javascript
// 変更前: 透明化→フェードイン
element.style.opacity = '0'; // 透明化
setTimeout(() => element.style.opacity = '1', 200); // フェードイン

// 変更後: 画面外移動→瞬間移動
element.style.setProperty('left', '-100%', 'important'); // 画面外
setTimeout(() => element.style.setProperty('left', character.targetX + '%', 'important'), 500); // 瞬間移動
```

**実装のポイント**：
- **瞬間移動**: `transition: 'none'`で補間を無効化
- **目標位置保存**: `character.targetX`でsetPosition時の位置を記録
- **タイミング調整**: 瞬間移動とSpineアニメーションの同期

**テスト結果**：
- ✅ 初期読み込み時：画面外から2秒後に瞬間移動
- ✅ クリック時リプレイ：画面外→0.5秒後に瞬間移動
- ✅ 位置固定問題と同時解決：背景画像との位置関係維持

**影響範囲**：
- 出現演出の視覚的変化：フェードイン→瞬間移動
- パフォーマンス向上：CSSアニメーション削減
- コード簡素化：透明度管理の削除

**予防策**：
- 今後演出変更時は、初期配置・目標位置・演出メソッドの3点セットで変更
- `targetX/Y`による位置管理を標準とする
- クリック時リプレイも同一方式で統一

**関連する既存問題**：
- [ウィンドウリサイズ時の位置ズレ問題](#🔄-ウィンドウリサイズ時の位置ズレ問題2024年7月23日解決)と同時実装

### 🎯 クリック検出座標系の不整合問題（2024年7月23日解決）

**発生日時**：2024-07-23

**症状**：
- ぷらっとくんのクリック可能範囲が実際の表示位置と一致しない
- クリック検出が「左上から右下に移った」状態
- コンソールログでは `Result: ✅ INSIDE` と表示されるがクリック位置がずれている

**根本原因**：
1. **座標変換の不一致**：
   - Canvas要素：`transform: translate(-50%, -50%)`による中心基準配置
   - クリック座標：左上基準の絶対座標で取得
   - 座標系の不一致により、クリック位置とキャラクター位置が一致しない

2. **境界計算の混乱**：
   - Skeleton座標：Canvas中心(0,0)基準
   - 境界計算：複雑なオフセット計算で実際の位置と乖離

**解決策**：

#### 1. クリック座標変換の修正
```javascript
// 変更前：誤った座標変換
const canvasX = (rawX / scaleX) - centerOffsetX;
const canvasY = (rawY / scaleY) - centerOffsetY;

// 変更後：正しい中心基準変換
const canvasX = (rawX - centerOffsetX) / scaleX;
const canvasY = (rawY - centerOffsetY) / scaleY;
```

#### 2. 境界計算の簡素化
```javascript
// 変更前：複雑なオフセット計算
const actualX = character.targetX !== undefined ? character.targetX : (character.canvas?.width / 2 || 300);
const renderX = actualX + scaledOffsetX;
const boundsLeft = renderX;

// 変更後：中心基準の統一計算
const characterX = skeleton.x;  // 既に中心基準で設定済み
const boundsLeft = characterX - scaledWidth / 2;
const boundsRight = characterX + scaledWidth / 2;
```

#### 3. 座標系の統一
```javascript
// Skeleton位置とクリック検出を同じ座標系（中心基準）で処理
isClickInsideSpineCharacter(character, canvasX, canvasY) {
    const characterX = skeleton.x;  // 中心基準座標
    const characterY = skeleton.y;  // 中心基準座標
    
    // 中心基準の境界計算
    const boundsLeft = characterX - scaledWidth / 2;
    const boundsRight = characterX + scaledWidth / 2;
    const boundsTop = characterY - scaledHeight / 2;
    const boundsBottom = characterY + scaledHeight / 2;
    
    return (canvasX >= boundsLeft && canvasX <= boundsRight && 
            canvasY >= boundsTop && canvasY <= boundsBottom);
}
```

**実装のポイント**：
- **座標系統一**：中心基準座標系でキャラクター位置とクリック位置を統一
- **変換順序修正**：クリック座標を「中心基準変換→スケール補正」の順で処理
- **計算簡素化**：複雑なオフセット計算を削除し、直接的な境界計算に変更

**テスト結果**：
- ✅ クリック検出がキャラクターの正確な表示位置で動作
- ✅ `🎯 Click position analysis` ログで座標変換の正確性を確認
- ✅ `Result: ✅ INSIDE` で正しい境界判定を確認
- ✅ ヤラレアニメーションが期待通りに再生

**影響範囲**：
- プレースホルダーモード：影響なし（同じ座標系を使用）
- 他のSpineキャラクター：同じ修正が適用される
- パフォーマンス：計算簡素化により微改善

**予防策**：
- Canvas要素に`transform`を適用する際は、クリック検出の座標系も同時に考慮する
- 座標変換は一箇所に集約し、統一された座標系を維持する
- 詳細なデバッグログで座標変換の各段階を監視する

**関連する既存問題**：
- [Canvas位置指定問題](#3-canvas位置指定問題)の座標系設計と連動
- 中心基準配置システムとの整合性確保

### 問題記録フォーマット
```markdown
### 🚨 問題：[問題名]

**発生日時**：YYYY-MM-DD

**症状**：
```
[エラーメッセージやコンソール出力]
```

**根本原因**：
[問題の技術的な原因]

**解決策**：
```javascript
// 解決コード
```

**予防策**：
- [同じ問題を避ける方法]

**関連する既存問題**：
- [このドキュメント内の関連セクション]
```

---

## 9. コードリファクタリング記録

### 🔄 Spine統合システム v2.0 リファクタリング (2024-07-23)

**実施理由**：
- 元のspine-integration.jsが2,035行で保守性が低下
- 391個のconsole.logによるパフォーマンス影響
- 単一責任原則違反による影響範囲予測困難

**リファクタリング成果**：

#### Phase 1: ログシステム整理
- **実装内容**：階層化ログレベル管理システム（ERROR/WARN/INFO/DEBUG）
- **効果**：本番環境でのデバッグログ無効化、カテゴリ別制御
- **ファイル**：新しいログシステムを全ファイルで統一

#### Phase 2: モジュール分割
```
spine-integration.js (2,035行) → 分割後:
├── spine-integration-v2.js (292行) - メイン統合管理
├── spine-character-manager.js (198行) - キャラクター管理
├── spine-debug-window.js (201行) - デバッグUI
├── spine-coordinate-utils.js (185行) - 座標計算
└── spine-animation-controller.js (260行) - アニメーション制御
```

**定量的改善**：
- **ファイルサイズ削減**：2,035行 → 1,136行 (44%削減)
- **デバッグログ最適化**：391個 → 必要最小限 (約80%削減)
- **保守性向上**：単一責任原則適用、機能別分離

#### 新しいアーキテクチャの特徴

**1. ログレベル管理**
```javascript
const DEBUG_CONFIG = {
    level: window.location.hostname === 'localhost' ? LogLevel.DEBUG : LogLevel.ERROR,
    categories: {
        initialization: true,
        animation: true,
        physics: true,
        performance: true,
        position: true,
        cache: true,
        debug_ui: false  // 本番では無効
    }
};
```

**2. モジュラー初期化**
```javascript
class SpineIntegrationManager {
    async init() {
        this.coordinateUtils = new SpineCoordinateUtils();
        this.animationController = new SpineAnimationController();
        this.characterManager = new SpineCharacterManager();
        // デバッグUIは開発モードのみ
        if (DEBUG_CONFIG.categories.debug_ui) {
            this.debugWindow = new SpineDebugWindow();
        }
    }
}
```

**3. 責任分離**
- **SpineCharacterManager**: キャラクター読み込み・管理専用
- **SpineAnimationController**: アニメーション制御・シーケンス管理
- **SpineCoordinateUtils**: 座標変換・レスポンシブ計算
- **SpineDebugWindow**: 開発時デバッグ機能（本番無効）

#### 互換性確保
- **API互換性**：既存の`window.spineManager`インターフェースを維持
- **機能互換性**：HTML設定制御システムをそのまま継承
- **エラー処理**：段階的フォールバック（Spine → Placeholder → Error）

#### テスト検証項目
1. **機能テスト**：ぷらっとくんクリック→アニメーション再生
2. **位置テスト**：HTMLdata-*設定→正確な位置表示
3. **パフォーマンステスト**：初期化時間・メモリ使用量
4. **ブラウザ互換性**：Chrome/Firefox/Safari確認

#### 今後の保守指針
- **1ファイル500行以内**を目標とした責任分離
- **新機能追加時**は適切なモジュールに配置
- **デバッグログ**は本番モードで自動無効化
- **定期的なコード品質チェック**の実施

---

## 10. クイック診断チェックリスト

このガイドは、Spine WebGL統合における包括的なトラブルシューティング知識を提供します：

### 重要な教訓
1. **バージョン管理の重要性**：Runtime-Data完全一致の原則
2. **サーバー設定の必要性**：特殊ファイル形式への対応
3. **DOM設計の重要性**：親要素制約を考慮した配置戦略
4. **段階的診断の有効性**：複雑な問題の体系的解決
5. **エラー処理の重要性**：ユーザー体験を損なわないフォールバック

### 開発効率化のために
- このドキュメントを定期的に更新
- 新しい問題は必ずここに記録
- チーム内での知識共有に活用
- 類似プロジェクトでの参照資料として使用

**🔄 このドキュメントは生きたドキュメントです。新しい問題や解決策があれば随時更新してください。**