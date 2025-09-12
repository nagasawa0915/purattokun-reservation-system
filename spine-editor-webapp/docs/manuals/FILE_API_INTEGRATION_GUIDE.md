# 🔗 File API → StableSpineRenderer 完全統合ガイド

**最終更新**: 2025-09-13  
**統合成功確認**: ✅ 完璧な動作確認済み  
**推奨度**: ⭐⭐⭐⭐⭐ **完全実用化** - Webアプリでローカルファイル読み込み完全対応

---

## 📋 概要

**File API統合システム**は、ローカルのSpineファイル（atlas/json/png）をWebアプリ上で直接読み込み、StableSpineRendererで表示するための完全統合ソリューションです。

### 🎯 主な特徴
- **完全ローカルファイル対応**: サーバー不要でSpineキャラクター表示
- **FileToHttpBridge**: File APIをHTTP形式に透過的変換
- **StableSpineRenderer統合**: 既存のStableSpineRendererと完全互換
- **自動クリーンアップ**: メモリリーク防止の完全なBlob URL管理
- **エラーハンドリング**: 段階的な問題診断とデバッグ支援

### 🚀 適用場面
- ✅ **Spine Editorワークフロー**: ローカルファイル→Webプレビュー
- ✅ **デスクトップアプリ統合**: Electronアプリでのファイル読み込み
- ✅ **制作ツール**: クライアントサイドでのSpine作業環境
- ✅ **プロトタイピング**: サーバーセットアップ不要の迅速開発

---

## 🚀 クイック実装（5分で動作）

### 📦 必要なファイル構成

```
project/
├── micromodules/
│   ├── spine-renderer/
│   │   └── StableSpineRenderer.js          # 6c2a7a1版（1:1比率対応）
│   └── bridge/
│       ├── BlobUrlManager.js               # Blob URL管理
│       ├── PathGenerator.js                # パス生成ユーティリティ
│       └── FileToHttpBridge.js             # File API→HTTP変換コア
└── test-file-api-integration.html          # 完全統合テストページ（動作確認済み）
```

### ⚡ 基本実装コード

```html
<!DOCTYPE html>
<html>
<head>
    <title>File API → StableSpineRenderer 統合</title>
</head>
<body>
    <canvas id="spine-canvas" width="400" height="400"></canvas>
    <button onclick="selectAndRenderSpine()">📂 Spineファイル選択・表示</button>
    
    <!-- 依存関係（順序重要） -->
    <script src="https://unpkg.com/@esotericsoftware/spine-webgl@4.1.24/dist/iife/spine-webgl.js"></script>
    <script src="micromodules/spine-renderer/StableSpineRenderer.js"></script>
    <script src="micromodules/bridge/BlobUrlManager.js"></script>
    <script src="micromodules/bridge/PathGenerator.js"></script>
    <script src="micromodules/bridge/FileToHttpBridge.js"></script>
    
    <script>
        let renderer = null;
        let httpData = null;
        
        async function selectAndRenderSpine() {
            try {
                // Step 1: ファイル選択（File System Access API）
                const fileHandles = await window.showOpenFilePicker({
                    multiple: true,
                    types: [{
                        description: 'Spine files',
                        accept: {
                            'application/json': ['.json'],
                            'text/plain': ['.atlas'],
                            'image/png': ['.png']
                        }
                    }]
                });
                
                // Step 2: ファイル種別分類
                const selectedFiles = {};
                for (const handle of fileHandles) {
                    const extension = handle.name.split('.').pop().toLowerCase();
                    if (extension === 'atlas') selectedFiles.atlas = handle;
                    else if (extension === 'json') selectedFiles.json = handle;
                    else if (extension === 'png') selectedFiles.texture = handle;
                }
                
                // Step 3: FileToHttpBridge変換
                const bridge = new FileToHttpBridge({ debug: true });
                httpData = await bridge.convertCharacterFiles('nezumi', selectedFiles);
                
                // Step 4: StableSpineRenderer統合
                renderer = StableSpineRenderer.createForCharacter('nezumi');
                renderer.config.blobUrls = {
                    atlas: httpData.blobUrls.atlas,
                    json: httpData.blobUrls.json,
                    texture: httpData.blobUrls.texture
                };
                
                await renderer.initialize();
                renderer.playAnimation('search', true);  // nezumi用アニメーション
                
                console.log('✅ File API統合完了 - nezumi表示成功');
                
            } catch (error) {
                console.error('❌ File API統合エラー:', error);
            }
        }
        
        // クリーンアップ関数
        function cleanup() {
            if (renderer?.dispose) renderer.dispose();
            if (httpData?.cleanup) httpData.cleanup();
        }
    </script>
</body>
</html>
```

---

## 🔧 詳細実装ガイド

### 1️⃣ 依存関係の正しい読み込み順序

```html
<!-- 🚨 重要：必ずこの順序で読み込み -->
<script src="https://unpkg.com/@esotericsoftware/spine-webgl@4.1.24/dist/iife/spine-webgl.js"></script>
<script src="micromodules/spine-renderer/StableSpineRenderer.js"></script>
<script src="micromodules/bridge/BlobUrlManager.js"></script>
<script src="micromodules/bridge/PathGenerator.js"></script>
<script src="micromodules/bridge/FileToHttpBridge.js"></script>
```

**🚨 よくあるエラーと解決策:**
- `BlobUrlManager is not defined` → BlobUrlManager.jsの読み込み不足
- `PathGenerator is not defined` → PathGenerator.jsの読み込み不足
- 順序間違い → 上記の順序を厳密に守る

### 2️⃣ FileToHttpBridgeの正しい使用方法

```javascript
// ✅ 正しい実装
const bridge = new FileToHttpBridge({ debug: true });

// FileSystemFileHandleを渡す（Fileオブジェクトではない）
const selectedFiles = {
    atlas: fileHandle,    // FileSystemFileHandle
    json: fileHandle,     // FileSystemFileHandle  
    texture: fileHandle   // FileSystemFileHandle
};

const httpData = await bridge.convertCharacterFiles('nezumi', selectedFiles);

// 戻り値構造を正しく理解
console.log(httpData.blobUrls.atlas);    // ✅ 正しい
console.log(httpData.atlas);              // ❌ undefined
```

### 3️⃣ StableSpineRendererとの統合

```javascript
// StableSpineRenderer作成（マニュアル通り）
const renderer = StableSpineRenderer.createForCharacter('nezumi');

// 🔥 重要：blobUrlsプロパティに設定
renderer.config.blobUrls = {
    atlas: httpData.blobUrls.atlas,
    json: httpData.blobUrls.json,
    texture: httpData.blobUrls.texture
};

// 通常通り初期化・アニメーション再生
await renderer.initialize();
renderer.playAnimation('search', true);
```

### 4️⃣ エラーハンドリングとデバッグ

```javascript
try {
    // File API統合処理
    const httpData = await bridge.convertCharacterFiles('nezumi', selectedFiles);
    
    // 成功確認
    console.log('✅ Blob URL生成成功:');
    console.log('  Atlas:', httpData.blobUrls.atlas);
    console.log('  JSON:', httpData.blobUrls.json);
    console.log('  Texture:', httpData.blobUrls.texture);
    
} catch (error) {
    // 段階的エラー診断
    if (error.message.includes('ファイルが不足')) {
        console.error('❌ ファイル選択不足:', error.message);
    } else if (error.message.includes('無効なFileSystemFileHandle')) {
        console.error('❌ ファイルハンドル形式エラー - Fileオブジェクトではなく、FileSystemFileHandleを渡してください');
    } else {
        console.error('❌ File API統合エラー:', error);
    }
}
```

---

## 📊 完全なワークフロー解説

### 🔄 技術フロー

```
1. File System Access API
   ├─ ユーザーファイル選択（atlas/json/png）
   ├─ FileSystemFileHandle取得
   └─ ファイル種別自動判別

2. FileToHttpBridge変換
   ├─ ファイル内容読み込み
   ├─ Blob URL生成（atlas/json/texture）
   ├─ 仮想HTTPパス作成
   └─ クリーンアップ機能付きデータ返却

3. StableSpineRenderer統合
   ├─ createForCharacter()でレンダラー作成
   ├─ config.blobUrls設定
   ├─ initialize()で初期化
   └─ playAnimation()でアニメーション開始

4. クリーンアップ
   ├─ renderer.dispose()
   └─ httpData.cleanup()
```

### 🎯 各段階での期待結果

**Stage 1 - ファイル選択:**
```javascript
// 期待される結果
selectedFiles = {
    atlas: FileSystemFileHandle,    // nezumi.atlas
    json: FileSystemFileHandle,     // nezumi.json  
    texture: FileSystemFileHandle   // nezumi.png
}
```

**Stage 2 - FileToHttpBridge変換:**
```javascript
// 期待される結果  
httpData = {
    success: true,
    characterName: 'nezumi',
    blobUrls: {
        atlas: 'blob:http://localhost/uuid-1',
        json: 'blob:http://localhost/uuid-2', 
        texture: 'blob:http://localhost/uuid-3'
    },
    stats: { conversionTime: 150, totalSize: 65521, fileCount: 3 },
    cleanup: function
}
```

**Stage 3 - StableSpineRenderer:**
```javascript
// 期待される結果
renderer.initialized = true
renderer.skeleton = SkeletonObject
// Canvas上にnezumiキャラクター表示
// searchアニメーションがループ再生
```

---

## 🧪 動作確認・テスト方法

### 完全統合テストページ

**テストURL**: `http://localhost:8000/spine-editor-webapp/test-file-api-integration.html`

**テスト手順**:
1. **Step 1**: 「📂 ファイル選択」でnezumi.atlas, nezumi.json, nezumi.pngを選択
2. **Step 2**: 「🔄 HTTP変換実行」でBlob URL生成確認
3. **Step 3**: 「🎬 Spine描画実行」でnezumi表示確認
4. **Step 4**: アニメーション切り替え・クリーンアップ動作確認

**期待される動作**:
- nezumiキャラクターが1:1比率で正常表示
- searchアニメーションがループ再生
- search/ketteiアニメーション切り替え可能
- クリーンアップでCanvas消去・メモリ解放

### デバッグ用コンソールコマンド

```javascript
// FileToHttpBridge状態確認
console.log(typeof FileToHttpBridge);  // "function"
console.log(typeof BlobUrlManager);    // "function"
console.log(typeof PathGenerator);     // "function"

// 変換結果詳細確認
console.log(httpData);
console.log('Blob URLs:', httpData.blobUrls);
console.log('Stats:', httpData.stats);

// StableSpineRenderer状態確認  
console.log(renderer.getStatus());
console.log('Available animations:', renderer.getAvailableAnimations());
```

---

## 🚨 実装時の重要注意事項

### ❌ よくある実装ミス

1. **依存関係読み込み順序間違い**
   ```html
   <!-- ❌ 間違い -->
   <script src="micromodules/bridge/FileToHttpBridge.js"></script>
   <script src="micromodules/bridge/BlobUrlManager.js"></script>
   
   <!-- ✅ 正しい -->
   <script src="micromodules/bridge/BlobUrlManager.js"></script>
   <script src="micromodules/bridge/PathGenerator.js"></script>
   <script src="micromodules/bridge/FileToHttpBridge.js"></script>
   ```

2. **データ構造の誤解**
   ```javascript
   // ❌ 間違い
   renderer.config.atlas = httpData.atlas;
   
   // ✅ 正しい  
   renderer.config.blobUrls = httpData.blobUrls;
   ```

3. **ファイルハンドル vs ファイルオブジェクト**
   ```javascript
   // ❌ 間違い
   selectedFiles.atlas = await handle.getFile();  // Fileオブジェクト
   
   // ✅ 正しい
   selectedFiles.atlas = handle;  // FileSystemFileHandle
   ```

### ✅ 成功のポイント

1. **StableSpineRenderer Version**: 必ず6c2a7a1版（1:1比率対応・複数キャラクター対応）を使用
2. **キャラクター別アニメーション**: nezumiは'search'/'kettei'、purattokuinは'taiki'/'yarare'/'syutugen'
3. **メモリ管理**: 必ず`httpData.cleanup()`でBlob URLを適切に解放
4. **エラーハンドリング**: try-catch でエラーを適切にキャッチし、段階別に原因を特定

---

## 📋 サポートされているファイル形式

| 拡張子 | MIME Type | 用途 | 必須 |
|--------|-----------|------|------|
| `.atlas` | `text/plain` | Spine TextureAtlas定義 | ✅ |
| `.json` | `application/json` | Spine SkeletonData定義 | ✅ |
| `.png` | `image/png` | テクスチャ画像 | ✅ |

---

## 🎯 高度な使用例

### 複数キャラクター対応

```javascript
const characters = ['nezumi', 'purattokun'];
const renderers = [];

for (const character of characters) {
    const bridge = new FileToHttpBridge();
    const httpData = await bridge.convertCharacterFiles(character, selectedFiles[character]);
    
    const renderer = StableSpineRenderer.createForCharacter(character);
    renderer.config.blobUrls = httpData.blobUrls;
    await renderer.initialize();
    
    renderers.push({ renderer, httpData });
}
```

### エラー回復機能付き統合

```javascript
async function robustFileApiIntegration(character, selectedFiles, retryCount = 3) {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
            const bridge = new FileToHttpBridge({ debug: true });
            const httpData = await bridge.convertCharacterFiles(character, selectedFiles);
            
            const renderer = StableSpineRenderer.createForCharacter(character);
            renderer.config.blobUrls = httpData.blobUrls;
            await renderer.initialize();
            
            return { renderer, httpData, success: true };
            
        } catch (error) {
            console.warn(`❌ Attempt ${attempt} failed:`, error.message);
            if (attempt === retryCount) {
                return { success: false, error };
            }
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
        }
    }
}
```

---

## 🎉 統合成功の確認方法

### ✅ 完全成功の指標

1. **ファイル選択成功**: 「✅ 3個のファイルが選択されました」
2. **HTTP変換成功**: 「✅ HTTP変換完了！以下のBlob URL生成:」
3. **Spine表示成功**: Canvasにnezumiキャラクター表示
4. **アニメーション成功**: searchアニメーションのループ再生
5. **クリーンアップ成功**: 「✅ クリーンアップ完了」

### 🔧 問題診断フロー

```
問題発生時の診断順序:
1. ブラウザサポート確認 → File System Access API対応確認
2. 依存関係確認 → F12コンソールでクラス存在確認
3. ファイル選択確認 → 3ファイル（atlas/json/png）正常選択確認
4. 変換処理確認 → FileToHttpBridge成功・Blob URL生成確認
5. レンダラー確認 → StableSpineRenderer初期化・表示確認
```

---

## 🚀 次のAIエージェント向けクイック開始ガイド

**この統合システムを使用する次のAIは以下の手順で即座に実装可能：**

1. **ファイル確認**: `micromodules/bridge/` 内の3ファイル存在確認
2. **依存関係**: 上記の順序でスクリプト読み込み
3. **コピペ実装**: 基本実装コードをそのまま使用
4. **テスト**: `test-file-api-integration.html` で動作確認
5. **カスタマイズ**: 必要に応じてキャラクター名・アニメーション変更

**🎯 重要**: このガイドの基本実装コードをコピーするだけで、File API → StableSpineRenderer統合が完璧に動作します。追加実装や修正は不要です。

---

## 📞 トラブルシューティング連絡先

**問題が発生した場合**:
1. まず `test-file-api-integration.html` で動作確認
2. F12コンソールでエラーメッセージ確認
3. このマニュアルの「よくあるエラーと解決策」を参照
4. 依存関係・読み込み順序を再確認

**成功事例**: 2025-09-13時点で完全動作確認済み、nezumiキャラクター表示・アニメーション・クリーンアップすべて正常動作。