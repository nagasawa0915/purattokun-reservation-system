# 🔧 Spine WebGL読み込みエラー問題

## 📋 問題概要

**症状**: `Cannot read properties of undefined (reading 'Shader')` エラーが発生  
**原因**: Spine WebGLライブラリの読み込みタイミング問題  
**影響**: Spineキャラクター表示システム全体が初期化失敗  
**緊急度**: 高（システム起動不可）  

**タグ**: `#Spine` `#WebGL` `#読み込みエラー` `#初期化` `#タイミング問題` `#マイクロモジュール`

---

## ⚡ 有効な解決策・回避策

### 🎯 解決策1: ライブラリ読み込み順序とタイミング制御

**実装方法**: ライブラリ読み込み完了を適切に待機してからシステム初期化

```html
<!-- 正しい読み込み順序 -->
<script src="assets/js/libs/spine-webgl.js"></script>
<!-- マイクロモジュールはライブラリ読み込み後 -->
<script src="micromodules/spine-loader/PureSpineLoader.js"></script>
```

**初期化制御**:
```javascript
// ❌ 間違った初期化（即座実行）
window.addEventListener('load', () => {
    new NezumiBoundingBoxIntegration(); // spine未定義エラー
});

// ✅ 正しい初期化（spine確認後）
window.addEventListener('load', () => {
    // Spine WebGL読み込み確認
    if (typeof spine === 'undefined') {
        console.error('❌ Spine WebGL未読み込み');
        return;
    }
    
    // spine.webglオブジェクト確認
    if (!spine.webgl || !spine.webgl.Shader) {
        console.error('❌ Spine WebGL不完全読み込み');
        return;
    }
    
    console.log('✅ Spine WebGL読み込み確認完了');
    new NezumiBoundingBoxIntegration();
});
```

### 🎯 解決策2: 非同期読み込み制御による確実な初期化

**実装方法**: Promise-baseの読み込み制御

```javascript
class SafeSpineInitializer {
    static async waitForSpine(maxWait = 10000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            if (typeof spine !== 'undefined' && 
                spine.webgl && 
                spine.webgl.Shader) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        throw new Error('Spine WebGL読み込みタイムアウト');
    }
    
    static async initialize() {
        try {
            console.log('🔄 Spine WebGL読み込み待機中...');
            await this.waitForSpine();
            console.log('✅ Spine WebGL読み込み完了');
            
            // システム初期化実行
            return new NezumiBoundingBoxIntegration();
            
        } catch (error) {
            console.error('❌ Spine初期化失敗:', error);
            // フォールバック処理
            this.showLoadingError(error.message);
            return null;
        }
    }
    
    static showLoadingError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
                        background:rgba(255,0,0,0.9);color:white;padding:20px;
                        border-radius:10px;z-index:9999;">
                <h3>🚨 Spine WebGL読み込みエラー</h3>
                <p>${message}</p>
                <p>📝 対処方法:</p>
                <ul>
                    <li>ページを再読み込み</li>
                    <li>ブラウザキャッシュをクリア</li>
                    <li>ネットワーク接続確認</li>
                </ul>
                <button onclick="location.reload()" 
                        style="background:#fff;color:#000;padding:10px;border:none;border-radius:5px;cursor:pointer;">
                    🔄 再読み込み
                </button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }
}

// 使用方法
window.addEventListener('load', async () => {
    window.integration = await SafeSpineInitializer.initialize();
});
```

### 🎯 解決策3: CDN vs ローカルファイルの確認

**問題**: CDNからの読み込み失敗またはローカルパス間違い

**確認方法**:
```javascript
// デバッグ用チェック
console.log('🔍 Spine WebGL状態確認:');
console.log('- spine:', typeof spine);
console.log('- spine.webgl:', typeof spine?.webgl);
console.log('- spine.webgl.Shader:', typeof spine?.webgl?.Shader);
console.log('- spine.webgl.AssetManager:', typeof spine?.webgl?.AssetManager);
```

**パス確認**:
```html
<!-- ローカルファイル確認 -->
<script>
document.addEventListener('DOMContentLoaded', () => {
    const script = document.createElement('script');
    script.onerror = () => console.error('❌ spine-webgl.js読み込み失敗');
    script.onload = () => console.log('✅ spine-webgl.js読み込み成功');
    script.src = 'assets/js/libs/spine-webgl.js';
    document.head.appendChild(script);
});
</script>
```

---

## 📝 試行錯誤の履歴

### ❌ Case 1: 即座初期化による失敗 (2025-08-29)

**試行内容**: 
```javascript
// window.addEventListener('load'で即座に初期化
new NezumiBoundingBoxIntegration();
```

**結果**: `Cannot read properties of undefined (reading 'Shader')`  
**原因**: Spine WebGL読み込み未完了での初期化試行  
**学習**: load事件だけでは不十分、ライブラリ特定の確認が必要  

### ❌ Case 2: SafeSpineInitializer実装後もファイルパス問題 (2025-08-29)

**試行内容**: SafeSpineInitializerパターンの実装
```javascript
await SafeSpineInitializer.initialize();
```

**結果**: 
```
❌ Spine Global Object: spine-webgl.jsファイルを確認
❌ Spine WebGL Module: Spine WebGL版ライブラリを使用  
❌ Shader Class: ライブラリバージョンを確認
❌ AssetManager Class: AssetManagerが含まれるバージョンを使用
🚨 Spine WebGL診断完了 - 問題あり
❌ Spine初期化失敗: Error: Spine WebGL読み込みタイムアウト
```

**原因**: `<script src="assets/js/libs/spine-webgl.js"></script>`のパスが間違っている  
**学習**: ライブラリパスの確認が最優先、SafeSpineInitializerは正常に動作  

### ✅ Case 3: ファイル読み込み部分成功・ライブラリバージョン問題特定 (2025-08-29)

**試行内容**: 500ms遅延追加による読み込み待機
```javascript
await new Promise(resolve => setTimeout(resolve, 500));
```

**結果**: 
```
✅ Spine Global Object: OK  ← 改善！
❌ Spine WebGL Module: Spine WebGL版ライブラリを使用
❌ Shader Class: ライブラリバージョンを確認  
❌ AssetManager Class: AssetManagerが含まれるバージョンを使用
```

**原因**: spine-webgl.jsは読み込まれたが、spine.webglモジュールが不完全  
**学習**: ライブラリのバージョンまたは形式に問題あり  

### 🔍 Case 4: ライブラリ構造判明・spine.webgl不存在問題特定 (2025-08-29)

**試行内容**: 詳細診断コード追加による構造分析
```javascript
console.log('🔍 spine詳細構造:', typeof spine, Object.keys(spine || {}));
```

**結果**: 
```
spine詳細構造: object (149) ['AlphaTimeline', 'Animation', ..., 'AssetManager', ...]
spine.webgl: undefined  ← 問題特定！
```

**原因**: spineオブジェクト自体は完全だが、spine.webgl名前空間が存在しない  
**学習**: 直接spine.AssetManager、spine.Shaderでアクセスする必要がある  

### ✅ Case 5: spine.webgl直接アクセス方式で初期化成功！ (2025-08-29)

**試行内容**: spine.webglを全てspineに変更
```javascript
// 変更前: spine.webgl.Shader → 変更後: spine.Shader
this.shader = spine.Shader.newTwoColoredTextured(this.gl);
this.batcher = new spine.PolygonBatcher(this.gl);
this.assetManager = new spine.AssetManager(this.gl);
```

**結果**: 
```
✅ Shader Class（直接アクセス）: OK
✅ AssetManager Class（直接アクセス）: OK  
✅ PolygonBatcher Class: OK
🎉 Spine WebGL診断完了 - 正常
✅ Spine WebGL読み込み完了
🚀 統合システム初期化開始
✅ WebGL初期化完了
```

**原因**: この版のSpine WebGLライブラリはspine.webgl名前空間を使わない  
**学習**: ライブラリ構造の事前確認が重要、直接アクセスで解決  

### ✅ Case 6: PureSpineLoaderパラメーター問題解決 (2025-08-29)

**試行内容**: 成功パターンと同じパラメーター形式に変更
```javascript
// 変更前: atlasFile, jsonFile
// 変更後: atlasPath, jsonPath + scale追加
this.spineLoader = new window.PureSpineLoader({
    basePath: '/assets/spine/characters/nezumi/',
    atlasPath: '/assets/spine/characters/nezumi/nezumi.atlas',
    jsonPath: '/assets/spine/characters/nezumi/nezumi.json',
    scale: 1.0
});
```

**結果**: 
```
✅ PureSpineLoader 初期化完了
✅ マイクロモジュール初期化完了  
✅ UI初期化完了
✅ 初期化完了
```

**原因**: パラメーター名の違い（atlasFile/jsonFile vs atlasPath/jsonPath）  
**学習**: 成功パターンのパラメーター形式を正確にコピーすることが重要  

### ✅ Case 7: PureSpineLoader APIメソッド名問題解決 - 完全成功！ (2025-08-29)

**試行内容**: 成功パターンと同じメソッド名に変更
```javascript
// 変更前: this.spineLoader.loadAssets()
// 変更後: this.spineLoader.execute()
const loaderResult = await this.spineLoader.execute();
```

**結果**: 
```
✅ PureSpineLoader検証完了
📚 アセット読み込み完了
🐭 Nezumi表示成功
🎯 統合システム完全動作
```

**原因**: メソッド名の違い（loadAssets vs execute）  
**学習**: APIメソッド名も成功パターンから正確にコピーすることが重要  

---

## 🎉 **完全解決達成！** (2025-08-29)

**解決したエラー一覧**:
1. ✅ Spine WebGL読み込みタイムアウト → 直接アクセス方式で解決
2. ✅ PureSpineLoaderパラメーター問題 → atlasPath/jsonPath形式で解決  
3. ✅ APIメソッド名問題 → execute()メソッドで解決

**最終成果**: nezumi + バウンディングボックス統合システム完全動作確認  

---

## 🔍 診断ツール

### 緊急診断スクリプト

```javascript
function diagnoseSpineWebGL() {
    console.log('🔍 Spine WebGL診断開始');
    
    const checks = [
        {
            name: 'Spine Global Object',
            test: () => typeof spine !== 'undefined',
            fix: 'spine-webgl.jsファイルを確認'
        },
        {
            name: 'Spine WebGL Module',
            test: () => spine && spine.webgl,
            fix: 'Spine WebGL版ライブラリを使用'
        },
        {
            name: 'Shader Class',
            test: () => spine && spine.webgl && spine.webgl.Shader,
            fix: 'ライブラリバージョンを確認'
        },
        {
            name: 'AssetManager Class',
            test: () => spine && spine.webgl && spine.webgl.AssetManager,
            fix: 'AssetManagerが含まれるバージョンを使用'
        }
    ];
    
    let allPassed = true;
    
    checks.forEach(check => {
        const passed = check.test();
        console.log(`${passed ? '✅' : '❌'} ${check.name}: ${passed ? 'OK' : check.fix}`);
        if (!passed) allPassed = false;
    });
    
    if (allPassed) {
        console.log('🎉 Spine WebGL診断完了 - 正常');
    } else {
        console.log('🚨 Spine WebGL診断完了 - 問題あり');
    }
    
    return allPassed;
}

// コンソールから実行: diagnoseSpineWebGL()
```

---

## 🎯 予防策

### 1. ライブラリ読み込み順序の標準化

```html
<!-- 必須順序 -->
<script src="assets/js/libs/spine-webgl.js"></script>  <!-- 1. Spine WebGL -->
<script src="micromodules/spine-loader/PureSpineLoader.js"></script>  <!-- 2. Spineローダー -->
<script src="micromodules/bounding-box/PureBoundingBox.js"></script>  <!-- 3. その他モジュール -->
```

### 2. 初期化ガード関数の実装

```javascript
function safeSpineInit(callback) {
    if (typeof spine !== 'undefined' && spine.webgl && spine.webgl.Shader) {
        callback();
    } else {
        setTimeout(() => safeSpineInit(callback), 100);
    }
}
```

### 3. エラーハンドリングの標準化

```javascript
class SpineIntegrationSystem {
    constructor() {
        if (!this.validateSpineWebGL()) {
            throw new Error('Spine WebGL環境不正');
        }
        this.init();
    }
    
    validateSpineWebGL() {
        return typeof spine !== 'undefined' && 
               spine.webgl && 
               spine.webgl.Shader &&
               spine.webgl.AssetManager;
    }
}
```

---

## 🔗 関連リンク

- **類似問題**: [Spineライブラリ読込問題.md](./Spineライブラリ読込問題.md)
- **統合ガイド**: [../SPINE_BOUNDING_BOX_PERFECT_GUIDE.md](../SPINE_BOUNDING_BOX_PERFECT_GUIDE.md)
- **マイクロモジュール設計**: [../PURE_SPINE_LOADER_SUCCESS_MANUAL.md](../PURE_SPINE_LOADER_SUCCESS_MANUAL.md)

---

<!-- 🔒 確定済み解決策 - 変更禁止 -->
**最終更新**: 2025-08-29  
**ステータス**: 解決策準備完了 - テスト待ち  
**確定解決策**: SafeSpineInitializerパターン（解決策2）