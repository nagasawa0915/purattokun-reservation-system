# PureSpineLoader v4 技術仕様書

## 技術アーキテクチャ

### モジュール設計

🎨 **シングルファイルモジュール**

| 項目 | 仕様 |
|------|------|
| **ファイル数** | 1 (分割なし) |
| **責務** | Spineファイル読み込みのみ |
| **依存関係** | Spine WebGLライブラリのみ |
| **メモリフットプリント** | ~2KB |
| **行数** | ~260行 |

### データフロー

```
入力パラメータ (config)
        ↓
  ファイルパス検証
        ↓
  Spine WebGLアセット読み込み
        ↓
  Atlas + SkeletonData 生成
        ↓
    出力データ
```

### クラス構造

```javascript
class PureSpineLoader {
    // コンストラクタプロパティ
    config: {
        basePath: string,
        atlasPath: string,
        jsonPath: string,
        scale: number
    }
    
    loadState: {
        loaded: boolean,
        loading: boolean,
        error: string | null,
        spineData: object | null
    }
    
    initialState: {
        windowSpine: object | undefined
    }
    
    // メソッド
    validateInput(input): void
    async execute(): Promise<OutputData>
    async waitForAssets(assetManager): Promise<void>
    getOutput(): OutputData
    cleanup(): void
    static async test(): Promise<TestResult>
}
```

## API仕様

### コンストラクタ

```typescript
constructor(input: {
    basePath: string,      // 必須: ベースパス (末尾に'/'必要)
    atlasPath: string,     // 必須: .atlasファイルのフルパス
    jsonPath: string,      // 必須: .jsonファイルのフルパス
    scale?: number         // オプション: デフォルト 1.0
})
```

#### 入力検証ルール

- 全ての必須フィールドが文字列であること
- `basePath`はベースディレクトリパス
- `atlasPath`と`jsonPath`は完全なファイルパス
- `scale`は数値 (オプション)

### メインAPI

#### `async execute(): Promise<OutputData>`

読み込み処理を実行します。

**処理シーケンス:**
1. 重複実行チェック
2. Spine WebGLライブラリ確認
3. AssetManager作成・ファイル登録
4. 読み込み完了待ち
5. TextureAtlas作成
6. SkeletonData作成
7. 結果データ保存

**戸り値:**
```typescript
interface OutputData {
    loaded: boolean,           // 成功: true, 失敗: false
    loading: boolean,          // 読み込み中: true
    error: string | null,      // エラーメッセージ
    spineData: SpineData | null, // Spineデータオブジェクト
    config: ConfigData         // 設定情報のコピー
}
```

#### `getOutput(): OutputData`

現在の状態を即座取得します。

#### `cleanup(): void`

リソースを解放し、初期状態にリセットします。

**解放対象:**
- `atlas.dispose()`
- `assetManager.dispose()`
- `loadState`のリセット

### 静的メソッド

#### `static async test(): Promise<TestResult>`

デフォルトのプラットくんファイルでテストを実行します。

```typescript
interface TestResult {
    success: boolean,
    loader?: PureSpineLoader,
    result?: OutputData,
    error?: string
}
```

## データ構造

### SpineDataオブジェクト

成功時に返される`spineData`オブジェクト:

```typescript
interface SpineData {
    skeletonData: spine.SkeletonData,  // Spineスケルトンデータ
    atlas: spine.TextureAtlas,         // テクスチャアトラス
    assetManager: spine.AssetManager,  // アセットマネージャ
    scale: number                      // スケール値
}
```

### 内部状態管理

```typescript
interface LoadState {
    loaded: boolean,          // 読み込み成功フラグ
    loading: boolean,         // 読み込み中フラグ
    error: string | null,     // エラー情報
    spineData: SpineData | null // 読み込み結果
}

interface Config {
    basePath: string,    // ベースパス
    atlasPath: string,   // Atlasファイルパス
    jsonPath: string,    // JSONファイルパス
    scale: number        // スケール値
}
```

## 非同期処理

### 読み込み機構

```javascript
// AssetManagerを使用した非同期読み込み
assetManager.loadText(atlasPath);
assetManager.loadJson(jsonPath);

// ポーリングベースの完了待ち
const checkLoading = () => {
    if (assetManager.isLoadingComplete()) {
        resolve(); // 成功
    } else if (assetManager.hasErrors()) {
        reject(error); // 失敗
    } else {
        setTimeout(checkLoading, 50); // 50ms後に再チェック
    }
};
```

### タイムアウトなし

AssetManagerの仕様上、タイムアウトは実装されていません。
ネットワークエラーやファイル不存在の場合は、
`hasErrors()`で検出されることを期待します。

## パフォーマンス特性

### メモリ使用量

| フェーズ | メモリ使用量 |
|---------|----------|
| **初期化** | ~2KB (クラス + 設定) |
| **読み込み中** | +1-5MB (ファイルサイズ依存) |
| **完了時** | +ファイルサイズ (テクスチャ + データ) |
| **cleanup()後** | 0KB (完全解放) |

### 読み込み時間

一般的なSpineファイルサイズ別の目安:

| ファイルサイズ | 読み込み時間 | 備考 |
|------------|----------|------|
| **~100KB** | 100-300ms | 簡単なキャラクター |
| **~500KB** | 300-800ms | 標準的なキャラクター |
| **~1MB** | 0.8-2.0s | 複雑なキャラクター |
| **~3MB+** | 2.0s+ | 非常に複雑なキャラクター |

*時間はネットワーク速度やデバイス性能に大きく依存

### CPU使用量

- **アイドル時**: 0% CPU
- **読み込み中**: 5-15% CPU (テクスチャデコード時)
- **完了後**: 0% CPU

## エラーハンドリング

### エラーカテゴリ

#### 1. 入力検証エラー

| エラーメッセージ | 原因 |
|---------------------|------|
| "入力パラメータがobjectで..." | `input`がオブジェクトではない |
| "basePathが必要です" | `input.basePath`が未定義または非文字列 |
| "atlasPathが必要です" | `input.atlasPath`が未定義または非文字列 |
| "jsonPathが必要です" | `input.jsonPath`が未定義または非文字列 |

#### 2. ライブラリエラー

| エラーメッセージ | 原因 | 解決方法 |
|---------------------|------|----------|
| "Spine WebGLライブラリが..." | `window.spine`が未定義 | spine-webgl.jsを先に読み込む |

#### 3. ファイルエラー

| エラーメッセージ | 原因 | 解決方法 |
|---------------------|------|----------|
| "アセット読み込みエラー" | ファイルが存在しない | ファイルパスを確認 |
| "アセット読み込みエラー" | CORSポリシーエラー | サーバー設定を確認 |
| "アセット読み込みエラー" | ネットワークエラー | インターネット接続を確認 |

### デバッグ技法

#### 1. 状態モニタリング

```javascript
// 読み込み進捗状況を監視
const monitorProgress = (loader) => {
    const interval = setInterval(() => {
        const state = loader.getOutput();
        console.log('Progress:', {
            loading: state.loading,
            loaded: state.loaded,
            error: state.error
        });
        
        if (!state.loading) {
            clearInterval(interval);
        }
    }, 200);
};

// 使用例
const loader = new PureSpineLoader(config);
monitorProgress(loader);
loader.execute();
```

#### 2. ネットワークデバッグ

```javascript
// ファイルアクセシビリティチェック
async function debugFileAccess(config) {
    const files = [config.atlasPath, config.jsonPath];
    
    for (const file of files) {
        try {
            const response = await fetch(file);
            console.log(`${file}: ${response.ok ? 'OK' : 'FAILED'} (${response.status})`);
        } catch (error) {
            console.error(`${file}: NETWORK ERROR`, error);
        }
    }
}

// 使用例
await debugFileAccess(config);
```

#### 3. Spineライブラリチェック

```javascript
// Spineライブラリの可用性チェック
function debugSpineLibrary() {
    const checks = {
        'window.spine': typeof window.spine,
        'spine.AssetManager': typeof window.spine?.AssetManager,
        'spine.TextureAtlas': typeof window.spine?.TextureAtlas,
        'spine.SkeletonJson': typeof window.spine?.SkeletonJson
    };
    
    console.table(checks);
    
    const missing = Object.entries(checks)
        .filter(([key, type]) => type === 'undefined')
        .map(([key]) => key);
    
    if (missing.length > 0) {
        console.error('不足しているSpine API:', missing);
    }
}

// 使用例
debugSpineLibrary();
```

## ブラウザサポート

### サポートブラウザ

| ブラウザ | バージョン | 状態 | 備考 |
|---------|--------|------|------|
| **Chrome** | 80+ | ✅完全サポート | 推奨環境 |
| **Firefox** | 75+ | ✅完全サポート | |
| **Safari** | 13+ | ✅完全サポート | |
| **Edge** | 80+ | ✅完全サポート | |
| **iOS Safari** | 13+ | ✅完全サポート | |
| **Chrome Android** | 80+ | ✅完全サポート | |

### 非サポート

| ブラウザ | 理由 |
|---------|------|
| **Internet Explorer** | Promise・async/await未対応 |
| **古いAndroidブラウザ** (<5.0) | ES6シンタックス未対応 |

### 必要なWeb API

- `fetch()` API
- `Promise`と`async/await`
- ES6 Class構文
- WebGL (Spineライブラリ経由)

## セキュリティ考慮

### CORSポリシー

ファイル読み込みは`fetch()`APIを使用するため、
CORSポリシーの制約を受けます。

```http
# サーバー側で必要なヘッダー
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
Access-Control-Allow-Headers: Content-Type
```

### ファイルパスインジェクション

入力ファイルパスは直接`fetch()`に渡されるため、
信頼できないパスを渡さないでください。

```javascript
// ⚠️ 危険: 外部入力をそのまま使用
const userPath = prompt('Spineファイルパス:');
const loader = new PureSpineLoader({
    basePath: userPath // ← 危険
});

// ✅ 安全: ホワイトリストで検証
const ALLOWED_PATHS = ['/assets/spine/'];
if (ALLOWED_PATHS.some(allowed => userPath.startsWith(allowed))) {
    const loader = new PureSpineLoader({
        basePath: userPath // ← 安全
    });
}
```

### メモリリーク防止

`cleanup()`を必ず呼び出してください。
特にSPAや長時間動作するアプリケーションでは重要です。

```javascript
// ✅ 推奨: try-finallyパターン
const loader = new PureSpineLoader(config);
try {
    const result = await loader.execute();
    // 処理
} finally {
    loader.cleanup(); // 必ず実行
}

// ✅ 推奨: スコープ限定関数
async function loadSpineData(config) {
    const loader = new PureSpineLoader(config);
    try {
        return await loader.execute();
    } finally {
        loader.cleanup();
    }
} // スコープ終了時に自動クリーンアップ
```

## バージョン履歴

### v4.0 (現在)
- マイクロモジュール設計で新規作成
- 単一責務・外部依存ゼロ哲学
- 完全復元保証機構
- async/awaitベースのAPI

### 将来版本予定

#### v4.1 (予定)
- タイムアウト機構追加
- 進捗コールバック機構
- キャッシュ機構

#### v5.0 (検討中)
- マルチファイル同時読み込み
- ストリーミング読み込み
- Service Worker統合