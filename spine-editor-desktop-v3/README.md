# 🎯 Spine Editor Desktop v3.0

Spineキャラクターのバウンディングボックス編集・配置システムのElectronデスクトップ版

## ✨ 主な機能

### 🎮 バウンディングボックス編集システム
- **ドラッグ&ドロップ移動**: 精密なピクセル単位操作
- **キーボード微調整**: 矢印キー 0.1%/1%刻み移動
- **リアルタイム座標表示**: 編集中の位置データ表示
- **複数キャラクター対応**: 同時編集・レイヤー管理

### 📁 プロジェクト管理
- **フォルダ選択**: Spineプロジェクトフォルダの自動検出
- **動的読み込み**: .atlas, .json, .pngファイルの自動認識
- **プロジェクト保存**: 編集データの永続化
- **履歴管理**: 編集操作の記録・復元

### 📦 エクスポート機能
- **HTML出力**: 完全なWebページとして出力
- **CSS出力**: 位置データのCSS形式出力
- **JSON出力**: プロジェクト設定の構造化データ出力

## 🚀 クイックスタート

### 1. インストール
```bash
cd spine-editor-desktop-v3
npm install
```

### 2. 開発モード起動
```bash
npm run dev
```

### 3. 本番ビルド
```bash
npm run build
```

## 📋 基本的な使い方

### プロジェクト開始
1. **フォルダを開く**: メニューまたは「📁 Spineフォルダを開く」ボタン
2. **キャラクター確認**: 自動検出されたキャラクター一覧を確認
3. **編集開始**: 「📝 編集モード」ボタンで編集システム起動

### 編集操作
- **キャラクター選択**: 画面内キャラクターを直接クリック
- **ドラッグ移動**: マウスでドラッグして位置調整
- **精密調整**: 矢印キー（0.1%）またはShift+矢印キー（1%）
- **バウンディングボックス**: 青い枠をドラッグしてサイズ調整

### プロジェクト保存・出力
- **保存**: Ctrl+S または メニュー > ファイル > プロジェクト保存
- **エクスポート**: Ctrl+E または 「📦 エクスポート」ボタン

## 🔧 技術仕様

### 対応ファイル形式
- **Spine**: .atlas, .json, .png (Spine WebGL 4.1+)
- **プロジェクト**: .json形式での保存
- **出力**: .html, .css, .json

### システム要件
- **OS**: Windows 10+, macOS 10.14+, Linux (Ubuntu 18.04+)
- **メモリ**: 4GB以上推奨
- **ディスク**: 500MB以上の空き容量
- **グラフィック**: WebGL対応

### 技術スタック
- **Electron**: デスクトップアプリケーションフレームワーク
- **Spine WebGL**: Spineアニメーションレンダリング
- **既存編集システム**: spine-positioning-system-explanation.js移植版

## 📁 プロジェクト構造

```
spine-editor-desktop-v3/
├── package.json                    # Electron設定・依存関係
├── src/
│   ├── main/
│   │   └── main.js                 # Electronメインプロセス
│   └── renderer/
│       ├── index.html              # メインUI
│       ├── styles.css              # アプリケーションスタイル
│       ├── app.js                  # メインアプリケーションロジック
│       ├── project-manager.js      # プロジェクト管理・エクスポート
│       ├── spine-integration.js    # Spine WebGL統合
│       ├── preload.js              # セキュアAPI Bridge
│       └── spine-edit/             # 編集システム（移植版）
│           ├── spine-positioning-system-explanation.js
│           ├── spine-positioning-system-explanation.css
│           └── spine-edit-core.js
└── README.md
```

## 🎯 既存システムからの移植

### Web版からの主な変更点
1. **URLパラメータ → UI制御**: `?edit=true` → 編集モードボタン
2. **localStorage → ファイルシステム**: データ永続化の改良
3. **手動ファイル配置 → 動的読み込み**: Spineデータの自動検出・配置
4. **ブラウザ依存 → ネイティブ機能**: ファイルダイアログ・メニューバー

### 移植済み機能
- ✅ バウンディングボックス編集システム（完全移植）
- ✅ 座標系スワップ技術（transform競合回避）
- ✅ 複数キャラクター管理
- ✅ リアルタイム座標表示
- ✅ 編集データ永続化

## 🔍 トラブルシューティング

### よくある問題

#### Spineファイルが認識されない
- **.atlas, .json, .pngが同じフォルダにあるか確認**
- **ファイル名が一致しているか確認**（例: character.atlas, character.json, character.png）
- **ファイルが破損していないか確認**

#### 編集モードが起動しない
- **プロジェクトが正常に読み込まれているか確認**
- **開発者ツール（Ctrl+Shift+I）でエラーログ確認**
- **spine-edit-core.js の読み込み状況確認**

#### エクスポートに失敗する
- **保存先フォルダの書き込み権限確認**
- **ディスク容量の確認**
- **プロジェクトデータの整合性確認**

### ログ確認方法
1. **開発者ツール**: Ctrl+Shift+I (Windows/Linux) または Cmd+Option+I (Mac)
2. **コンソールタブ**: エラーメッセージ・デバッグ情報確認
3. **ネットワークタブ**: ファイル読み込み状況確認

## 📈 パフォーマンス最適化

### 推奨設定
- **キャラクター数**: 同時表示10体以下推奨
- **テクスチャサイズ**: 2048x2048以下推奨
- **アニメーション**: 複雑なボーンアニメーション制限

### メモリ使用量削減
- **不要なキャラクター削除**: プロジェクトクローズ時の自動クリーンアップ
- **アセットキャッシュ**: 同一キャラクターの再利用最適化
- **描画最適化**: 非表示時のレンダリング停止

## 🛠️ 開発者向け情報

### カスタマイズポイント
- **UI拡張**: `src/renderer/styles.css` でスタイル調整
- **機能追加**: `src/renderer/app.js` にロジック追加
- **エクスポート形式**: `project-manager.js` で新形式対応
- **Spine統合**: `spine-integration.js` で描画・イベント制御

### ビルド設定
```json
{
  "build": {
    "appId": "com.spine.editor.desktop.v3",
    "productName": "Spine Editor Desktop v3",
    "directories": { "output": "dist" },
    "files": ["src/**/*", "package.json"],
    "mac": { "category": "public.app-category.graphics-design" },
    "win": { "target": "nsis" },
    "linux": { "target": "AppImage" }
  }
}
```

## 📜 ライセンス

MIT License

## 🤝 コントリビューション

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add some amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📞 サポート

- **Issues**: [GitHub Issues](https://github.com/spine-editor/desktop-v3/issues)
- **Discussions**: [GitHub Discussions](https://github.com/spine-editor/desktop-v3/discussions)
- **Email**: support@spine-editor.example.com

---

### 🎯 バージョン履歴

- **v3.0.0** (2025-08-16): 初回リリース・Electron移植版
- **v2.0.0** (2025-01-31): Web版完全実装版
- **v1.0.0** (2024-07-24): Web版初期実装

---

**Made with ❤️ by Spine Positioning System Team**