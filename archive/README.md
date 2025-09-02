# Archive フォルダについて

このフォルダには開発過程で作成された実験用・デバッグ用ファイルや、置き換えられたモジュールが保管されています。

## 🆕 最新のアーカイブ（2025-09-02追加）

### `pure-spine-loader-archive/`
**PureSpineLoader.js の完全アーカイブ**
- **PureSpineLoader.js** - Spineファイル読み込み専用モジュール
- **spine-loader-docs/** - 関連ドキュメント（README.md, SPEC.md）
- **置き換え先**: StableSpineRenderer に統合
- **理由**: より安定した統合版モジュールに移行

### `universal-spine-renderer-archive/`
**UniversalSpineRenderer.js の完全アーカイブ**
- **UniversalSpineRenderer.js** - PureSpineLoader統合版レンダラー（689行）
- **test-universal-spine-renderer.html** - テストファイル（465行）
- **置き換え先**: StableSpineRenderer
- **理由**: 黒枠問題の完全解決版に移行

## 📁 フォルダ構成

### `debug-experiments/`
位置調整・レスポンシブ・クリック問題の調査で作成されたデバッグ用ファイル
- debug-click.html
- debug-responsive.html  
- position-debug.html

### `test-files/`
test-simple-spine.htmlの成功パターン検証やCSS統合テストで作成されたファイル
- test-*.html ファイル群
- 各種実験用ページ

### `old-backups/`
作業開始前・重要な変更前に作成されたバックアップファイル
- index-old-*.html
- test-simple-spine-backup-*.html
- migration-plan.md

## 🚀 現在推奨のSpineシステム

**最高推奨**: `micromodules/spine-renderer/StableSpineRenderer.js`

### 推奨理由
- ✅ **黒枠問題完全解決**: 口周りの黒い縁を根本解決
- ✅ **毎回確実動作**: AIセッション間での実装ばらつき解消
- ✅ **汎用性確保**: 任意のSpineキャラクター・プロジェクトで利用可能
- ✅ **完全マニュアル**: 133セクションの詳細ドキュメント完備

### 使用方法
```javascript
// 基本的な使用法
const renderer = StableSpineRenderer.createForCharacter('purattokun');
await renderer.initialize();
renderer.playAnimation('taiki');
```

詳細は `docs/manuals/STABLE_SPINE_RENDERER_GUIDE.md` を参照してください。

## ⚠️ 注意事項

- **アーカイブ内のファイルは実際の開発では使用しないでください**
- **新規開発時は必ず StableSpineRenderer を使用してください**
- アーカイブファイルは参考目的・調査資料として保管されています

## 🗑️ 安全な削除について

このarchiveフォルダ全体は必要に応じて削除可能ですが、以下の場合は保持をお勧めします：
- 類似問題が発生した際の調査資料として
- 成功パターンの参考実装として  
- 開発手法の学習資料として