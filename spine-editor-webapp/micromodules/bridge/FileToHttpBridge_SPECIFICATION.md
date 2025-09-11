# 🌉 FileToHttpBridge マイクロモジュール仕様書

**Version**: 1.0  
**作成日**: 2025-09-11  
**目的**: File API経由のSpineアセットをStableSpineRenderer対応のHTTP形式に変換

---

## 📋 概要

### 🎯 モジュールの目的
File System Access API経由で取得したSpineアセット（Atlas/JSON/テクスチャ）をStableSpineRendererが理解できるHTTP形式に変換し、ローカルファイル選択とSpine描画のシームレスな統合を実現する。

### 🔄 問題解決の流れ
```
File API選択 → FileToHttpBridge → StableSpineRenderer → Spine描画
   ↓              ↓                  ↓
ローカルファイル  → HTTP形式変換 → 標準的な描画処理 → 成功
```

### 🚀 技術的アプローチ
- **Blob URL活用**: File API取得データをBlob URLに変換
- **仮想HTTP空間**: StableSpineRendererが期待するHTTPパス構造を模擬
- **標準API保持**: StableSpineRendererの既存使用方法を維持
- **自動クリーンアップ**: メモリリークを防ぐリソース管理

---

## 🎯 機能要件

### ✅ 必須機能

#### 1. File API → HTTP変換
```javascript
// 入力: FileSystemFileHandleセット
const fileHandles = {
    atlas: FileSystemFileHandle,    // nezumi.atlas
    json: FileSystemFileHandle,     // nezumi.json
    texture: FileSystemFileHandle   // nezumi.png
};

// 出力: HTTP形式アセット情報
const httpData = {
    basePath: '/temp/spine/nezumi/',
    files: {
        atlas: '/temp/spine/nezumi/nezumi.atlas',
        json: '/temp/spine/nezumi/nezumi.json',
        texture: '/temp/spine/nezumi/nezumi.png'
    },
    cleanup: () => void  // クリーンアップ関数
};
```

#### 2. StableSpineRenderer統合対応
```javascript
// 変換後のデータでStableSpineRenderer標準使用
const renderer = new StableSpineRenderer({
    character: 'nezumi',
    basePath: httpData.basePath  // FileToHttpBridge出力を使用
});
await renderer.initialize();  // 正常に動作
```

#### 3. 複数キャラクター対応
```javascript
// 複数キャラクター同時変換
const characters = ['nezumi', 'purattokun'];
const httpDataList = await bridge.convertMultipleCharacters(charactersData);
```

#### 4. 自動リソース管理
```javascript
// 自動クリーンアップでメモリリーク防止
httpData.cleanup();  // Blob URL解放、一時リソース削除
```

### 🔧 補助機能

#### A. キャラクター別最適化
- キャラクター名に基づくパス構造生成
- アニメーション名の自動検出・マッピング
- ファイル拡張子の自動判定

#### B. エラーハンドリング
- ファイル読み込み失敗の検出
- 不正なファイル形式の検出
- StableSpineRenderer要求仕様との適合性チェック

#### C. デバッグ支援
- 変換プロセスの詳細ログ
- 変換前後のデータ構造比較
- 性能測定（変換時間、メモリ使用量）

---

## 🏗️ アーキテクチャ設計

### 📦 クラス構造

#### **FileToHttpBridge** (メインクラス)
```javascript
class FileToHttpBridge {
    constructor(options = {}) {
        this.tempBasePath = options.tempBasePath || '/temp/spine/';
        this.debug = options.debug || false;
        this.activeUrls = new Map();  // Blob URL管理
    }

    // 🎯 メイン変換メソッド
    async convertCharacterFiles(characterName, fileHandles) { }

    // 🔄 複数キャラクター変換
    async convertMultipleCharacters(charactersData) { }

    // 🧹 リソースクリーンアップ  
    cleanup(characterName = null) { }

    // 📊 統計情報取得
    getStats() { }
}
```

#### **BlobUrlManager** (内部ユーティリティ)
```javascript
class BlobUrlManager {
    constructor() {
        this.urlMap = new Map();
    }

    // Blob URL作成・管理
    createBlobUrl(file, mimeType) { }
    
    // URL解放
    revokeBlobUrl(url) { }
    
    // 全URL解放
    revokeAllUrls() { }
}
```

#### **PathGenerator** (内部ユーティリティ)
```javascript
class PathGenerator {
    // StableSpineRenderer互換パス生成
    static generateBasePath(characterName, tempRoot = '/temp/spine/') { }
    
    // ファイル別パス生成
    static generateFilePath(basePath, fileName, fileType) { }
    
    // パス正規化
    static normalizePath(path) { }
}
```

### 🔗 データフロー

```
1. 入力受信
   ├─ characterName: string
   ├─ fileHandles: {atlas, json, texture}
   └─ options: object

2. ファイル内容読み込み
   ├─ atlas: FileHandle → File → text()
   ├─ json: FileHandle → File → text() 
   └─ texture: FileHandle → File → arrayBuffer()

3. Blob URL生成
   ├─ atlasBlob → blob://localhost/atlas-uuid
   ├─ jsonBlob → blob://localhost/json-uuid
   └─ textureBlob → blob://localhost/texture-uuid

4. HTTP形式パス構築
   ├─ basePath: '/temp/spine/nezumi/'
   ├─ atlasPath: '/temp/spine/nezumi/nezumi.atlas'
   ├─ jsonPath: '/temp/spine/nezumi/nezumi.json'
   └─ texturePath: '/temp/spine/nezumi/nezumi.png'

5. 仮想HTTPマッピング
   ├─ atlasPath → atlasBlob
   ├─ jsonPath → jsonBlob
   └─ texturePath → textureBlob

6. StableSpineRenderer対応データ出力
   └─ {basePath, files, cleanup()}
```

---

## 🛠️ 実装仕様

### 📝 APIメソッド仕様

#### **convertCharacterFiles(characterName, fileHandles, options = {})**

**用途**: 単一キャラクターのFile APIデータをHTTP形式に変換

**パラメータ**:
- `characterName` (string): キャラクター名 ('nezumi', 'purattokun')
- `fileHandles` (object): File System Access APIのFileHandleセット
  ```javascript
  {
      atlas: FileSystemFileHandle,    // 必須
      json: FileSystemFileHandle,     // 必須  
      texture: FileSystemFileHandle   // 必須
  }
  ```
- `options` (object): オプション設定
  ```javascript
  {
      customBasePath: string,     // カスタムベースパス
      debug: boolean,             // デバッグログ有効/無効
      autoCleanup: boolean,       // 自動クリーンアップ有効/無効
      mimeTypes: {                // カスタムMIMEタイプ
          atlas: 'text/plain',
          json: 'application/json', 
          texture: 'image/png'
      }
  }
  ```

**戻り値**: Promise&lt;HttpConversionResult&gt;
```javascript
{
    success: boolean,               // 変換成功/失敗
    characterName: string,          // キャラクター名
    basePath: string,              // '/temp/spine/nezumi/'
    files: {                       // 個別ファイルパス
        atlas: string,             // '/temp/spine/nezumi/nezumi.atlas'
        json: string,              // '/temp/spine/nezumi/nezumi.json'
        texture: string            // '/temp/spine/nezumi/nezumi.png'
    },
    blobUrls: {                    // 実際のBlob URL (デバッグ用)
        atlas: string,             // 'blob:http://localhost:8000/uuid'
        json: string,              
        texture: string            
    },
    stats: {                       // 統計情報
        conversionTime: number,    // 変換時間(ms)
        totalSize: number,         // 総ファイルサイズ(bytes)
        fileCount: number          // ファイル数
    },
    cleanup: Function              // クリーンアップ関数
}
```

**エラー**: ConversionError
```javascript
{
    name: 'ConversionError',
    message: string,
    code: 'INVALID_FILE_HANDLE' | 'READ_ERROR' | 'BLOB_CREATION_ERROR',
    details: object
}
```

#### **convertMultipleCharacters(charactersData, globalOptions = {})**

**用途**: 複数キャラクター一括変換

**パラメータ**:
- `charactersData` (Array): キャラクターデータ配列
  ```javascript
  [
      {
          name: 'nezumi',
          fileHandles: { atlas, json, texture },
          options: { ... }
      },
      {
          name: 'purattokun', 
          fileHandles: { atlas, json, texture },
          options: { ... }
      }
  ]
  ```

**戻り値**: Promise&lt;MultipleConversionResult&gt;
```javascript
{
    success: boolean,
    results: HttpConversionResult[],    // 個別結果配列
    failed: string[],                   // 失敗したキャラクター名
    globalCleanup: Function             // 全体クリーンアップ関数
}
```

#### **cleanup(characterName = null)**

**用途**: リソースクリーンアップ

**パラメータ**:
- `characterName` (string|null): 特定キャラクターのみ、nullで全体

**動作**:
- Blob URLの解放
- 内部マップのクリア
- メモリ使用量の最適化

#### **getStats()**

**用途**: 統計情報取得

**戻り値**: BridgeStats
```javascript
{
    totalConversions: number,        // 総変換回数
    activeCharacters: string[],      // アクティブなキャラクター名
    memoryUsage: {                   // メモリ使用量
        blobUrls: number,            // Blob URL数
        estimatedSize: number        // 推定メモリサイズ(MB)
    },
    performance: {                   // パフォーマンス情報
        averageConversionTime: number,
        totalConversionTime: number
    }
}
```

### 🔗 StableSpineRenderer統合方法

#### **基本統合パターン**
```javascript
// 1. FileToHttpBridge初期化
const bridge = new FileToHttpBridge({
    debug: true,
    tempBasePath: '/temp/spine/'
});

// 2. File APIデータ変換
const httpData = await bridge.convertCharacterFiles('nezumi', fileHandles);

// 3. StableSpineRenderer使用（標準的な方法）
const renderer = new StableSpineRenderer({
    character: 'nezumi',
    basePath: httpData.basePath
});

await renderer.initialize();
renderer.playAnimation('search');

// 4. 使用後クリーンアップ
httpData.cleanup();
```

#### **PreviewController統合パターン**
```javascript
class PreviewController {
    constructor() {
        this.bridge = new FileToHttpBridge({ debug: true });
        this.activeRenderers = new Map();
    }

    async loadSpineCharacter(characterData) {
        try {
            // 1. File API → HTTP変換
            const httpData = await this.bridge.convertCharacterFiles(
                characterData.name,
                characterData.fileHandles
            );

            // 2. StableSpineRenderer統合
            const renderer = new StableSpineRenderer({
                character: characterData.name,
                basePath: httpData.basePath,
                canvas: this.previewCanvas
            });

            await renderer.initialize();
            
            // 3. 管理登録
            this.activeRenderers.set(characterData.name, {
                renderer,
                httpData
            });

            // 4. アニメーション開始
            const defaultAnimation = characterData.spineConfig.animations[0];
            renderer.playAnimation(defaultAnimation);

            return { success: true, renderer };

        } catch (error) {
            console.error('Spine読み込み失敗:', error);
            return { success: false, error };
        }
    }

    cleanup() {
        // 全リソースクリーンアップ
        this.activeRenderers.forEach(({ httpData }) => {
            httpData.cleanup();
        });
        this.activeRenderers.clear();
        this.bridge.cleanup();
    }
}
```

---

## 🧪 テスト仕様

### 📋 単体テスト

#### **基本変換テスト**
```javascript
describe('FileToHttpBridge - 基本変換', () => {
    test('nezumiキャラクター正常変換', async () => {
        const result = await bridge.convertCharacterFiles('nezumi', validFileHandles);
        
        expect(result.success).toBe(true);
        expect(result.basePath).toBe('/temp/spine/nezumi/');
        expect(result.files.atlas).toContain('nezumi.atlas');
        expect(result.cleanup).toBeFunction();
    });

    test('不正FileHandle処理', async () => {
        await expect(
            bridge.convertCharacterFiles('invalid', invalidFileHandles)
        ).rejects.toThrow('ConversionError');
    });

    test('クリーンアップ動作', () => {
        const result = bridge.convertCharacterFiles('test', fileHandles);
        result.cleanup();
        
        expect(bridge.getStats().activeCharacters).not.toContain('test');
    });
});
```

### 🔗 統合テスト

#### **StableSpineRenderer統合テスト**
```javascript
describe('StableSpineRenderer統合', () => {
    test('変換データでSpine初期化', async () => {
        const httpData = await bridge.convertCharacterFiles('nezumi', fileHandles);
        
        const renderer = new StableSpineRenderer({
            character: 'nezumi',
            basePath: httpData.basePath
        });

        await expect(renderer.initialize()).resolves.not.toThrow();
        expect(renderer.getStatus().isReady).toBe(true);
        
        httpData.cleanup();
    });

    test('アニメーション再生', async () => {
        const httpData = await bridge.convertCharacterFiles('nezumi', fileHandles);
        const renderer = new StableSpineRenderer({
            character: 'nezumi',
            basePath: httpData.basePath
        });

        await renderer.initialize();
        
        expect(() => {
            renderer.playAnimation('search');
        }).not.toThrow();

        httpData.cleanup();
    });
});
```

### 🔄 e2eテスト

#### **完全ワークフローテスト**
```javascript
describe('File API → Spine描画 完全フロー', () => {
    test('フォルダ選択からSpine表示まで', async () => {
        // 1. File API選択模擬
        const fileHandles = await mockFileSystemPicker('nezumi');
        
        // 2. 変換
        const httpData = await bridge.convertCharacterFiles('nezumi', fileHandles);
        
        // 3. Spine描画
        const renderer = new StableSpineRenderer({
            character: 'nezumi',
            basePath: httpData.basePath
        });
        
        await renderer.initialize();
        renderer.playAnimation('search');
        
        // 4. 描画確認
        await waitForAnimation(1000);
        expect(renderer.getStatus().isAnimating).toBe(true);
        
        // 5. クリーンアップ
        httpData.cleanup();
    });
});
```

---

## 📊 パフォーマンス要件

### ⏱️ レスポンス時間

| 操作 | 目標時間 | 最大許容時間 |
|------|----------|--------------|
| 単一キャラクター変換 | < 500ms | < 1000ms |
| 複数キャラクター変換 | < 1500ms | < 3000ms |
| クリーンアップ | < 100ms | < 200ms |

### 💾 メモリ使用量

| 項目 | 目標値 | 最大許容値 |
|------|--------|------------|
| 1キャラクター当たり | < 5MB | < 10MB |
| 同時保持キャラクター | 5体 | 10体 |
| Blob URL数 | < 15個 | < 30個 |

### 🔄 同時実行

- **並行変換**: 最大3キャラクター同時変換対応
- **競合制御**: 同一キャラクター重複変換の防止
- **リソース制限**: メモリ使用量上限でのグレースフル制限

---

## 🛡️ エラーハンドリング

### 📋 エラー分類

#### **ConversionError** (変換エラー)
```javascript
class ConversionError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'ConversionError';
        this.code = code;
        this.details = details;
    }
}

// エラーコード
const ERROR_CODES = {
    INVALID_FILE_HANDLE: 'ファイルハンドルが無効',
    READ_ERROR: 'ファイル読み込みエラー',
    BLOB_CREATION_ERROR: 'Blob URL作成エラー',
    PATH_GENERATION_ERROR: 'パス生成エラー',
    MEMORY_LIMIT_EXCEEDED: 'メモリ制限超過'
};
```

#### **ValidationError** (検証エラー)
```javascript
// 入力検証エラー
const ValidationError = {
    MISSING_CHARACTER_NAME: 'キャラクター名が未指定',
    INVALID_FILE_HANDLES: 'FileHandlesが無効な形式',
    UNSUPPORTED_FILE_TYPE: 'サポートされていないファイル形式'
};
```

### 🔄 エラー復旧戦略

#### **段階的フォールバック**
```javascript
async convertCharacterFiles(characterName, fileHandles, options = {}) {
    try {
        // 通常変換処理
        return await this._normalConversion(characterName, fileHandles, options);
        
    } catch (error) {
        if (error.code === 'READ_ERROR') {
            // ファイル読み込みリトライ
            console.warn('ファイル読み込みリトライ中...');
            return await this._retryConversion(characterName, fileHandles, options);
            
        } else if (error.code === 'MEMORY_LIMIT_EXCEEDED') {
            // 既存リソースクリーンアップ後リトライ
            console.warn('メモリ制限超過 - クリーンアップ後リトライ...');
            await this.cleanup();
            return await this._normalConversion(characterName, fileHandles, options);
            
        } else {
            // 復旧不可能エラー
            throw error;
        }
    }
}
```

---

## 🔧 実装ガイドライン

### 📁 ファイル構造
```
spine-editor-webapp/micromodules/bridge/
├── FileToHttpBridge.js              # メインクラス
├── BlobUrlManager.js                # Blob URL管理
├── PathGenerator.js                 # パス生成ユーティリティ
├── FileToHttpBridge_SPECIFICATION.md # この仕様書
├── tests/
│   ├── FileToHttpBridge.test.js     # 単体テスト
│   ├── integration.test.js          # 統合テスト
│   └── e2e.test.js                  # e2eテスト
└── examples/
    ├── basic-usage.html             # 基本使用例
    ├── multiple-characters.html      # 複数キャラクター例
    └── previewcontroller-integration.html # PreviewController統合例
```

### 🎨 コーディング規約

#### **命名規則**
- クラス名: PascalCase (`FileToHttpBridge`)
- メソッド名: camelCase (`convertCharacterFiles`)  
- 定数: UPPER_SNAKE_CASE (`ERROR_CODES`)
- プライベートメソッド: `_` プレフィックス (`_normalConversion`)

#### **ログ出力規則**
```javascript
// デバッグログ形式
console.log(`[${new Date().toISOString()}] FileToHttpBridge: ${message}`);

// エラーログ形式  
console.error(`[FileToHttpBridge] ${error.name}: ${error.message}`, error.details);

// パフォーマンスログ
console.log(`[FileToHttpBridge] 変換完了: ${characterName} (${duration}ms)`);
```

### 🔗 依存関係

#### **必須依存**
- **File System Access API**: FileSystemFileHandle処理
- **Blob API**: Blob URL作成
- **StableSpineRenderer**: 統合対象（マニュアル準拠）

#### **推奨依存** 
- **Debug ライブラリ**: 詳細ログ出力
- **Performance API**: パフォーマンス測定

#### **開発依存**
- **Jest**: テストフレームワーク
- **jsdom**: DOM環境模擬

---

## 🚀 実装優先度

### 🎯 Phase 1: MVP実装
- [ ] `FileToHttpBridge` 基本クラス
- [ ] 単一キャラクター変換 (`convertCharacterFiles`)
- [ ] 基本クリーンアップ (`cleanup`)
- [ ] StableSpineRenderer基本統合

### 🔄 Phase 2: 機能拡張
- [ ] 複数キャラクター変換 (`convertMultipleCharacters`)
- [ ] 詳細統計情報 (`getStats`)
- [ ] 高度エラーハンドリング
- [ ] パフォーマンス最適化

### ⚡ Phase 3: プロダクション対応
- [ ] 包括的テストスイート
- [ ] メモリ使用量最適化
- [ ] 同時実行制御
- [ ] PreviewController完全統合

---

## 📚 参考資料

### 🔗 外部仕様
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
- [Blob API](https://developer.mozilla.org/en-US/docs/Web/API/Blob)
- [StableSpineRenderer マニュアル](../../../docs/manuals/STABLE_SPINE_RENDERER_GUIDE.md)

### 🏗️ プロジェクト内参照
- [spine-editor-webapp アーキテクチャ](../../../spine-editor-webapp/PANEL_DEVELOPMENT_RULES.md)
- [PreviewController 仕様](../preview/PreviewController.js)
- [SpineFolderController 仕様](../spine/SpineFolderController.js)

---

**🎯 このモジュールにより、File API選択 → Spine描画の完全なワークフローが実現し、spine-editor-webappの中核機能が完成します。**