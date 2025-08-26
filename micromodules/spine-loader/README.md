# PureSpineLoader v4 マイクロモジュール

## 概要

🎯 **Spineファイル読み込み専用モジュール**

Spine WebGLライブラリを使用して、Spineアセット（.atlas, .json, .png）を読み込み、スケルトンデータを生成します。

### 主要機能
- 📁 **ファイル読み込み**: .atlas、.json、.pngファイルの自動読み込み
- 🎨 **Atlas作成**: テクスチャアトラスの自動生成
- 🦖 **Skeletonデータ生成**: アニメーション准備完了のSkeletonData作成
- 🧹 **クリーンアップ**: メモリリーク防止の完全リソース解放
- ⚡ **軽量設計**: 単一責務・外部依存なし・シンプルインターフェース

### 設計商念

🔮 **絶対ルール**:
- ✅ **単一責務**: Spineファイル読み込みのみ
- ✅ **外部依存ゼロ**: 他モジュールやグローバル変数に依存しない
- ✅ **完全復元**: cleanup()で初期状態に戻ることを保証
- ✅ **プリミティブ通信**: 数値・文字列のみで他モジュールとやり取り

❌ **禁止事項**:
- DOM操作禁止 (Canvasへの描画等)
- アニメーション制御禁止
- 他ファイルへの影響禁止
- 状態の永続化禁止

## 使い方

### 1. ファイル読み込み

```html
<!-- Spine WebGLライブラリが必要 -->
<script src="assets/spine/spine-webgl.js"></script>

<!-- PureSpineLoader -->
<script src="micromodules/spine-loader/PureSpineLoader.js"></script>
```

### 2. 基本使用例

```javascript
// Spineローダー作成
const spineLoader = new PureSpineLoader({
    basePath: '/assets/spine/characters/purattokun/',
    atlasPath: '/assets/spine/characters/purattokun/purattokun.atlas',
    jsonPath: '/assets/spine/characters/purattokun/purattokun.json',
    scale: 1.0  // オプション
});

// 読み込み実行
const result = await spineLoader.execute();

if (result.loaded) {
    console.log('読み込み成功!', result.spineData);
    
    // SkeletonDataを使用してCanvas描画等
    const skeletonData = result.spineData.skeletonData;
    const atlas = result.spineData.atlas;
    
} else {
    console.error('読み込み失敗:', result.error);
}

// 使用後は必ずクリーンアップ
spineLoader.cleanup();
```

### 3. ファイルパス設定例

```javascript
// パターン1: 相対パス
const loader1 = new PureSpineLoader({
    basePath: 'assets/spine/characters/nezumi/',
    atlasPath: 'assets/spine/characters/nezumi/nezumi.atlas',
    jsonPath: 'assets/spine/characters/nezumi/nezumi.json'
});

// パターン2: 絶対パス  
const loader2 = new PureSpineLoader({
    basePath: '/assets/spine/characters/hero/',
    atlasPath: '/assets/spine/characters/hero/hero.atlas',
    jsonPath: '/assets/spine/characters/hero/hero.json',
    scale: 0.8
});
```

### 4. エラーハンドリング

```javascript
try {
    const result = await spineLoader.execute();
    
    if (!result.loaded) {
        throw new Error(`Spine読み込みエラー: ${result.error}`);
    }
    
    // 正常処理
    useSpineData(result.spineData);
    
} catch (error) {
    console.error('予期しないエラー:', error);
} finally {
    // 必ずクリーンアップ
    spineLoader.cleanup();
}
```

### 5. 状態監視

```javascript
// 読み込み状態を監視
const checkProgress = () => {
    const status = spineLoader.getOutput();
    
    if (status.loading) {
        console.log('読み込み中...');
        setTimeout(checkProgress, 100);
    } else if (status.loaded) {
        console.log('読み込み完了!');
    } else if (status.error) {
        console.error('エラー:', status.error);
    }
};

// 読み込み開始
spineLoader.execute();
checkProgress();
```

## テスト方法

### ブラウザコンソールでテスト

```javascript
// 統合テスト実行
const testResult = await PureSpineLoader.test();
console.log('テスト結果:', testResult);

// またはショートカット
const testResult = await testSpineLoader();

if (testResult.success) {
    console.log('テスト成功! ローダーが正常に動作しました。');
} else {
    console.error('テスト失敗:', testResult.error);
}
```

### カスタムテスト

```javascript
// 独自のファイルパスでテスト
async function testMySpineFiles() {
    const loader = new PureSpineLoader({
        basePath: '/my-spine-assets/',
        atlasPath: '/my-spine-assets/character.atlas',
        jsonPath: '/my-spine-assets/character.json'
    });
    
    try {
        const result = await loader.execute();
        return {
            success: result.loaded,
            data: result.loaded ? result.spineData : null,
            error: result.error
        };
    } finally {
        loader.cleanup();
    }
}

// テスト実行
const myTestResult = await testMySpineFiles();
console.log('カスタムテスト:', myTestResult);
```

## APIリファレンス

### コンストラクタ

```javascript
new PureSpineLoader({
    basePath: string,    // 必須: ベースパス (末尾に「/」必要)
    atlasPath: string,   // 必須: .atlasファイルのパス
    jsonPath: string,    // 必須: .jsonファイルのパス
    scale?: number       // オプション: スケール値 (デフォルト: 1.0)
})
```

### メソッド

#### `async execute()`
Spineファイルの読み込みを実行します。

**戻り値:**
```javascript
{
    loaded: boolean,        // 読み込み成功フラグ
    loading: boolean,       // 読み込み中フラグ
    error: string | null,   // エラーメッセージ
    spineData: object | null, // Spineデータ(成功時のみ)
    config: object          // 設定情報
}
```

#### `getOutput()`
現在の状態を取得します。

#### `cleanup()`
リソースを解放し、初期状態にリセットします。

### 結果データ構造

成功時の`spineData`オブジェクト:

```javascript
{
    skeletonData: SkeletonData,    // Spineスケルトンデータ
    atlas: TextureAtlas,           // テクスチャアトラス
    assetManager: AssetManager,    // アセットマネージャ
    scale: number                  // スケール値
}
```

## 注意事項

### ❗ 重要な依存関係

- **Spine WebGLライブラリが必須**
- `window.spine`オブジェクトが必要
- ブラウザ環境でのみ動作 (Node.js非対応)

### ⚠️ ファイルパスの注意

```javascript
// ✅ 正しい例
basePath: '/assets/spine/character/'  // 末尾に'/'必須
atlasPath: '/assets/spine/character/char.atlas'  // フルパス

// ❌ 間違い例
basePath: '/assets/spine/character'   // 末尾の'/'がない
atlasPath: 'char.atlas'              // 相対パスのみではNG
```

### 📊 パフォーマンス

- **メモリ使用量**: ~2KB (クラス本体) + Spineデータサイズ
- **読み込み時間**: ファイルサイズとネットワーク速度に依存
- **cleanup()後**: メモリ完全解放、リークなし

### 🔄 再利用について

```javascript
// ✅ 推奨: 新しいインスタンスを作成
const loader1 = new PureSpineLoader(config1);
await loader1.execute();
loader1.cleanup();

const loader2 = new PureSpineLoader(config2);
await loader2.execute();
loader2.cleanup();

// ⚠️ 非推奨: 同じインスタンスで複数回
execute()
// 予期しない動作の可能性があります
```

## トラブルシューティング

### よくあるエラー

| エラーメッセージ | 原因 | 解決方法 |
|---------------------|------|----------|
| "Spine WebGLライブラリが..." | spine-webgl.js未読み込み | ライブラリを先に読み込む |
| "アセット読み込みエラー" | ファイルパス間違い | パスを再確認 |
| "入力パラメータが..." | 必須パラメータ不足 | configオブジェクトを確認 |

### デバッグ方法

```javascript
// 1. 設定確認
console.log('Config:', spineLoader.getOutput().config);

// 2. ファイル存在確認
fetch('/assets/spine/character/char.atlas')
    .then(response => console.log('Atlasファイル:', response.ok))
    .catch(err => console.error('Atlasエラー:', err));

// 3. Spineライブラリ確認
console.log('Spineライブラリ:', typeof window.spine);
```

## 関連ファイル

- [SPEC.md](./SPEC.md) - 詳細技術仕様
- [examples/](./examples/) - 使用例集
- [test/](./test/) - テストケース