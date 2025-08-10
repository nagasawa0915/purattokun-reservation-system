# 🎯 Spine Character Position Editor Desktop

**Professional Spine animation positioning tool for desktop**

本アプリケーションは、Spine WebGLアニメーションの位置・スケール・レイヤー管理を効率的に行うデスクトップアプリケーションです。既存のWeb版システムをベースに、デスクトップ特有の機能を追加して制作ワークフローを最適化します。

## 📋 主要機能

### ✅ 既存Web版機能（完全移植）
- **リアルタイム編集**: ドラッグ移動・スケール調整・精密制御
- **複数キャラクター管理**: キャラクター選択・レイヤー制御・z-index管理
- **座標系スワップ技術**: 複雑座標→シンプル絶対座標の自動変換
- **商用品質出力**: CSS出力・完全パッケージ生成（小数点4桁精度）

### 🚀 デスクトップ専用機能
- **ファイルシステム統合**: プロジェクトファイル(.spine-project)の保存・読み込み
- **ドラッグ&ドロップ**: Spineアセット（.atlas/.json/.png）の直接インポート
- **メニューバー**: File・Edit・View・Export メニュー完備
- **キーボードショートカット**: Ctrl+S保存、Ctrl+O開く等の標準操作
- **リサイズ可能パネル**: 左右パネルのカスタマイズ・ワークスペース保存
- **ダークモード**: システム設定連動・手動切り替え対応

## 🛠️ 技術構成

### フレームワーク・ライブラリ
- **Electron**: ^31.0.0
- **electron-builder**: ^24.13.3（ビルド・配布用）
- **fs-extra**: ^11.2.0（ファイル操作拡張）

### アーキテクチャ
```
desktop-app/
├── main.js                 # Electronメインプロセス
├── preload.js              # セキュアAPI公開
├── package.json            # プロジェクト設定
└── renderer/               # レンダラープロセス
    ├── index.html          # メインUI
    ├── css/               # スタイルシート
    │   ├── styles.css     # ベーススタイル
    │   └── spine-editor.css # Spine編集系スタイル
    └── js/                # JavaScript
        ├── spine-desktop-integration.js  # Web版統合
        ├── project-manager.js           # プロジェクト管理
        ├── desktop-ui-manager.js        # UI管理
        ├── spine-editor-main.js         # メインアプリ
        └── spine-edit-core.js          # 編集システムコア
```

## 🚀 セットアップ・起動

### 1. 依存関係インストール
```bash
cd desktop-app
npm install
```

### 2. 開発モード起動
```bash
npm run dev
# または
npm start
```

### 3. プロダクションビルド
```bash
# Mac版
npm run build:mac

# Windows版
npm run build:windows

# 全プラットフォーム
npm run build:all
```

## 💻 対応プラットフォーム

### macOS
- **対応バージョン**: macOS 10.15+
- **アーキテクチャ**: Intel x64, Apple Silicon (ARM64)
- **配布形式**: .dmg, .app

### Windows
- **対応バージョン**: Windows 10+
- **アーキテクチャ**: x64
- **配布形式**: .exe (NSIS installer), Portable版

## 📁 ファイル形式

### プロジェクトファイル (.spine-project)
```json
{
  "meta": {
    "name": "プロジェクト名",
    "version": "1.0.0",
    "created": "2025-08-10T00:00:00.000Z",
    "lastModified": "2025-08-10T00:00:00.000Z"
  },
  "characters": {
    "purattokun": {
      "position": { "left": "35%", "top": "75%" },
      "scale": { "x": 0.55, "y": 0.55 },
      "assets": {
        "atlas": "purattokun.atlas",
        "json": "purattokun.json",
        "textures": ["purattokun.png"]
      },
      "visible": true
    }
  },
  "settings": {
    "canvas": { "width": "100%", "height": "auto" },
    "export": { "format": "css", "precision": 4 }
  }
}
```

## ⌨️ キーボードショートカット

### ファイル操作
- `Ctrl/Cmd + N`: 新規プロジェクト作成
- `Ctrl/Cmd + O`: プロジェクトを開く
- `Ctrl/Cmd + S`: プロジェクト保存
- `Ctrl/Cmd + Shift + S`: 名前を付けて保存
- `Ctrl/Cmd + E`: CSS出力

### 編集操作
- `Enter`: 編集モード開始
- `Escape`: 編集モード終了
- `Delete/Backspace`: 選択要素削除

### UI操作
- `Ctrl/Cmd + Shift + L`: 左パネル表示/非表示
- `Ctrl/Cmd + Shift + R`: 右パネル表示/非表示
- `Ctrl/Cmd + Shift + T`: テーマ切り替え
- `F11`: フルスクリーン切り替え

## 🎨 使用方法

### 1. 新規プロジェクト作成
1. アプリ起動後、「新規」ボタンまたは`Ctrl+N`
2. プロジェクト名を入力
3. テンプレート選択（空のプロジェクト/ぷらっとくんテンプレート）

### 2. Spineアセット追加
1. Spineファイル（.atlas, .json, .png）をキャンバスエリアにドラッグ&ドロップ
2. 自動的にキャラクターとして認識・プロジェクトに追加
3. 右パネルのキャラクターリストで確認

### 3. キャラクター編集
1. 右パネルでキャラクターを選択
2. キャンバス上で直接クリックして編集モード開始
3. ドラッグで移動、ハンドルでリサイズ
4. 矢印キーで精密調整（0.1%/1%刻み）

### 4. プロジェクト保存・出力
1. `Ctrl+S`でプロジェクト保存
2. 「CSS出力」ボタンで配置データをCSS形式で出力
3. 「パッケージ出力」で完全なHTMLパッケージを生成

## 🔧 開発者向け情報

### デバッグモード
```bash
# 開発者ツールを開いた状態で起動
npm run dev
```

### ログ確認
- **メインプロセス**: ターミナル/コマンドプロンプト
- **レンダラープロセス**: F12開発者ツール→Console

### システム情報確認
```javascript
// F12コンソールで実行
console.log(window.spineEditDebug.getSystemStatus());
console.log(window.spineEditDebug.getModuleList());
```

## 📋 既知の制限事項

### 現在の制限
- **同時編集**: 1つのキャラクターのみ同時編集可能
- **アニメーション**: 静止画での位置調整のみ（アニメーション再生中の編集は非対応）
- **ファイル形式**: Spine WebGL形式のみ対応

### 将来の拡張予定
- **タイムライン機能**: キーフレーム・アニメーション編集
- **プラグインシステム**: 外部拡張機能対応
- **クラウド連携**: プロジェクト同期・チーム作業対応

## 🐛 トラブルシューティング

### よくある問題

#### 1. アプリが起動しない
- Node.js version 16以上がインストールされているか確認
- `npm install`で依存関係を再インストール

#### 2. Spineファイルが読み込めない
- .atlas, .json, .pngファイルがセットで存在するか確認
- ファイル名が一致しているか確認（例: purattokun.atlas, purattokun.json, purattokun.png）

#### 3. 編集モードでキャラクターが消える
- F12開発者ツールでエラーを確認
- `window.spineEditDebug.forceRestore(element)`で強制復元

#### 4. プロジェクト保存できない
- ディスクの空き容量を確認
- ファイル・フォルダの書き込み権限を確認

### サポート
問題が解決しない場合は、以下の情報を添えてお問い合わせください：
- OS・バージョン
- アプリバージョン
- エラーメッセージ（F12コンソール、ターミナル両方）
- 再現手順

## 📜 ライセンス

MIT License

---

**🎯 Spine Character Position Editor Desktop**  
**Version**: 1.0.0  
**Created**: 2025-08-10  
**Author**: Cloud Partner

既存Web版の全機能を保持しながら、デスクトップアプリならではの効率的なワークフローを提供する制作ツールです。