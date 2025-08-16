# Spineキャラクターファイル配置場所

このディレクトリにSpineで作成したキャラクターアニメーションファイルを配置してください。

## 必要なファイル構成

各キャラクターごとに以下のファイルセットが必要です：

```
characters/
├── cat/
│   ├── cat.json       # スケルトンデータ
│   ├── cat.atlas      # テクスチャアトラス情報
│   └── cat.png        # テクスチャ画像
└── other-character/
    ├── other.json
    ├── other.atlas
    └── other.png
```

## ファイルの説明

- **`.json`**: スケルトン、ボーン、アニメーション情報
- **`.atlas`**: テクスチャの配置情報
- **`.png`**: 実際の画像素材

## 推奨設定

- **画像サイズ**: 512x512px または 1024x1024px
- **形式**: PNG（透明背景対応）
- **最適化**: テクスチャアトラスを使用してファイルサイズを最小化

## 使用例

```javascript
// キャラクター読み込み例
const spineCharacter = new spine.SpineWidget('cat', {
    skelUrl: 'assets/spine/characters/cat/cat.json',
    atlasUrl: 'assets/spine/characters/cat/cat.atlas'
});
```