# Spine WebGL 読み込みテストアプリ

シンプルなElectronアプリでSpine WebGL 4.1.24を使用したpurattokun読み込みテストツールです。

## 🎯 目的

既存のspine-editor-desktop-v2で発生しているSpine読み込み問題を診断するため、最小構成のテストアプリを作成。

## 📋 機能

- **Spine WebGL 4.1.24 CDN読み込み**
- **purattokuanアセット読み込み・表示**
- **アニメーション再生テスト（taiki, syutugen）**
- **詳細ログ出力・エラー診断**
- **リアルタイムステータス表示**

## 🚀 起動方法

### 1. 依存関係のインストール

```bash
cd /mnt/d/クラウドパートナーHP/spine-test-simple
npm install
```

### 2. アプリケーション起動

```bash
npm start
```

## 📊 テスト手順

1. **アプリ起動** - Electronウィンドウが開き、開発者ツールも自動で開きます
2. **Spine WebGLライブラリ確認** - ステータス表示で読み込み状況を確認
3. **アセット読み込み** - 「📋 アセット読み込み」ボタンをクリック
4. **アニメーション再生** - 「▶️ taikiアニメ再生」または「▶️ syutugenアニメ再生」ボタンをクリック
5. **ログ確認** - 詳細ログパネルでエラー・警告を確認

## 🔍 診断ポイント

### ✅ 成功時の表示
- ✅ Spine WebGLライブラリ: 読み込み成功
- ✅ Spineアセット: 読み込み成功  
- ▶️ アニメーション: taiki 再生中
- Canvasにpurattokuanキャラクターが表示される

### ❌ 失敗時の確認項目
- Spine WebGLライブラリの読み込みエラー
- アセットファイル（.atlas, .json, .png）の読み込みエラー
- WebGLコンテキスト取得エラー
- アニメーション設定エラー

## 📁 ファイル構成

```
spine-test-simple/
├── package.json          # Electron設定・依存関係
├── main.js              # Electronメインプロセス
├── index.html           # アプリUI
├── spine-test.js        # Spine WebGLテストロジック
├── assets/
│   └── purattokun/      # Spineアセット（.atlas, .json）
└── README.md            # このファイル
```

## 🔧 技術仕様

- **Electron**: ^24.0.0
- **Spine WebGL**: 4.1.24 (CDN)
- **アセット**: purattokun (4.1-from-4.2.43)
- **アニメーション**: syutugen (出現), taiki (待機), yarare (やられ)

## 🆚 既存システムとの比較

このテストアプリは以下の点で既存のspine-editor-desktop-v2よりシンプルです：

1. **最小依存関係** - ElectronとSpine WebGLのみ
2. **単純なUI** - 診断に特化したシンプルなインターフェース
3. **詳細ログ** - 全ての処理ステップを詳細にログ出力
4. **エラー特化** - エラー検出・表示に特化した設計

## 📝 ログ解析

重要なログパターン：

```
✅ Spine WebGL ライブラリを確認しました: WebGLRenderer
✅ WebGLコンテキストを取得しました
✅ アセット読み込み完了
✅ Skeleton データをパースしました
✅ Spineキャラクター作成完了
利用可能なアニメーション (3個):
  - syutugen (2.67秒)
  - taiki (0.00秒)
  - yarare (0.67秒)
```

## 🚨 トラブルシューティング

### Spine WebGLが読み込まれない
- インターネット接続を確認
- CDNアクセスを確認
- Electronのセキュリティ設定を確認

### アセットが読み込まれない
- ファイルパスを確認（相対パス）
- ファイルの存在を確認
- ファイル権限を確認

### WebGLエラー
- グラフィックドライバを更新
- ハードウェアアクセラレーションを確認
- 他のWebGLアプリケーションで動作確認
