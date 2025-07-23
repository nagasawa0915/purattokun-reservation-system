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
9. [クイック診断チェックリスト](#9-クイック診断チェックリスト)
10. [今後の問題記録](#10-今後の問題記録)

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

## 🎯 まとめ

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