# Archive フォルダについて

このフォルダには開発過程で作成された実験用・デバッグ用ファイルが保管されています。

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

## ⚠️ 注意事項

- これらのファイルは本番環境では使用されません
- 将来の問題調査や開発参考用として保管されています
- 削除前には必ずCLAUDE.mdの「シンプルサンプル方式」セクションを参照してください

## 🗑️ 安全な削除について

このarchiveフォルダ全体は必要に応じて削除可能ですが、以下の場合は保持をお勧めします：
- 類似問題が発生した際の調査資料として
- 成功パターンの参考実装として
- 開発手法の学習資料として