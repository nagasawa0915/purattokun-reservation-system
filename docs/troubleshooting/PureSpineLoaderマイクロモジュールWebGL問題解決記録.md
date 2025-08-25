# PureSpineLoaderマイクロモジュール WebGLコンテキスト問題解決記録

## 📋 問題概要
**発生日時**: 2025-08-24  
**問題タイプ**: マイクロモジュール設計におけるWebGLリソース共有問題  
**影響範囲**: PureSpineLoaderマイクロモジュール使用時  

### 🚨 症状
- **ぷらっとくん（PureSpineLoader使用）**: 真っ黒で表示されない
- **ねずみ（従来方式）**: 正常に表示される
- エラーメッセージなし、コンソールに明確なエラー表示なし

## 🔍 根本原因分析

### ✅ 正常動作パターン（従来方式）
```javascript
// 同一WebGLコンテキストでアセット読み込みと描画
const gl = canvas.getContext("webgl", { alpha: true });        
const assetManager = new spine.AssetManager(gl, basePath);     
const renderer = new spine.SceneRenderer(canvas, gl);         
// → 全て同じglコンテキストを使用
```

### ❌ 問題パターン（PureSpineLoader初期実装）
```javascript
// PureSpineLoader内（仮想canvas）
const canvas = document.createElement('canvas');               // 仮想canvas
const gl = canvas.getContext('webgl', { alpha: true });       // 仮想WebGL
const assetManager = new spine.AssetManager(gl, basePath);    // 仮想glで作成

// 描画時（実際のcanvas） 
const gl = canvas.getContext("webgl", { alpha: true });       // 実WebGL
const renderer = new spine.SceneRenderer(canvas, gl);         // 実glで描画
// → 異なるコンテキスト間でリソース使用を試行 ← 問題の原因
```

### 🎯 技術的根本原因
**WebGLリソース（テクスチャ、バッファ等）は作成されたWebGLコンテキスト内でのみ有効**

- PureSpineLoaderで仮想canvasのWebGLコンテキスト内でSpineアセット（テクスチャ等）を作成
- 実際の描画では別のWebGLコンテキストを使用
- WebGLの仕様により、異なるコンテキスト間ではリソースが共有されない
- 結果として、テクスチャが無効になり真っ黒で表示

## ⚡ 解決策

### 🔗 WebGLコンテキスト統一パターン（採用解決策）

#### 1. PureSpineLoader.js修正
```javascript
// execute()メソッド: 外部WebGLコンテキストを受け取り可能に
async execute(externalGLContext = null) {
    // ...
    const spineData = await this.loadSpineAssets(externalGLContext);
    // ...
}

// loadSpineAssets()メソッド: WebGLコンテキスト統一対応
async loadSpineAssets(externalGLContext = null) {
    let gl;
    let virtualCanvas = null;
    
    if (externalGLContext) {
        // 外部WebGLコンテキストを使用（推奨）
        console.log('🔗 PureSpineLoader: 外部WebGLコンテキスト使用');
        gl = externalGLContext;
    } else {
        // 仮想WebGLコンテキスト作成（互換性のため）
        console.log('⚠️ PureSpineLoader: 仮想WebGLコンテキスト作成（非推奨）');
        virtualCanvas = document.createElement('canvas');
        gl = virtualCanvas.getContext('webgl', { alpha: true });
    }
    
    // 以降は統一されたWebGLコンテキストでアセット作成
    const assetManager = new spine.AssetManager(gl, this.config.basePath);
    // ...
}
```

#### 2. index2-micromodule-experiment.html修正
```javascript
async function initMicroModuleCharacter(config) {
    // 🔗 WebGLコンテキストを先に作成（重要：PureSpineLoaderと共有）
    const gl = canvas.getContext("webgl", { alpha: true });
    
    // 🧪 PureSpineLoader マイクロモジュール使用
    const loader = new PureSpineLoader(loaderConfig);
    
    // 🔑 WebGLコンテキストを渡す
    const loadResult = await loader.execute(gl);
    
    // 同じWebGLコンテキストでレンダリング
    const renderer = new spine.SceneRenderer(canvas, gl);
    // ...
}
```

## ✅ 解決確認

### 📊 修正後の動作
- ✅ **ぷらっとくん**: PureSpineLoader使用で正常表示
- ✅ **ねずみ**: 従来方式で正常表示
- ✅ **デバッグ表示**: 「WebGL: 統一」と確認メッセージ表示
- ✅ **ユーザー確認**: 「OKです」の動作確認済み

### 🔧 修正されたファイル
- `/mnt/d/クラウドパートナーHP/PureSpineLoader.js`
- `/mnt/d/クラウドパートナーHP/index2-micromodule-experiment.html`

## 📚 重要な学習事項

### 🎯 マイクロモジュール設計での注意点
1. **WebGLリソース共有**: 異なるWebGLコンテキスト間ではリソースが共有されない
2. **外部依存の設計**: 外部リソース（WebGLコンテキスト等）を適切に受け取る設計が重要
3. **デバッグの困難さ**: WebGLリソース問題はエラーメッセージが出ない場合が多い

### 🚀 v4開発への応用
1. **設計パターン**: `execute(externalContext)`パターンの標準化
2. **テストケース**: WebGLコンテキスト統合テストの必要性
3. **文書化**: マイクロモジュール間リソース共有のガイドライン策定

## 🔄 類似問題の予防

### ✅ 推奨パターン
```javascript
// マイクロモジュールでWebGLリソースを扱う場合の標準パターン
class PureMicroModule {
    async execute(externalContext) {
        if (externalContext) {
            // 外部コンテキスト使用（推奨）
            return this.processWithContext(externalContext);
        } else {
            // 内部コンテキスト作成（互換性のため）
            const context = this.createInternalContext();
            return this.processWithContext(context);
        }
    }
}
```

### 🚨 避けるべきパターン
```javascript
// ❌ 避けるべき：内部で仮想リソースを作成し、外部で別リソース使用
class BadMicroModule {
    async execute() {
        const virtualContext = createVirtualContext();
        const data = processWithContext(virtualContext);
        // → 外部で別のコンテキストを使用すると問題発生
        return data;
    }
}
```

## 📈 今後の改善計画

1. **標準化**: 他のマイクロモジュール（PureBoundingBox等）にも同様パターンを適用
2. **テスト強化**: WebGLコンテキスト統合の自動テスト作成
3. **ドキュメント化**: マイクロモジュール設計ガイドラインに追加

---

**解決日時**: 2025-08-24  
**解決者**: Claude Code  
**検証済み**: ユーザー動作確認「OKです」  
**重要度**: ⭐⭐⭐⭐⭐ (v4開発の基盤技術)