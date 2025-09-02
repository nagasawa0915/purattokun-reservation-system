# UniversalSpineRendererアーカイブ

## アーカイブ理由
- StableSpineRenderer登場により、UniversalSpineRendererは置き換わりました
- 今後は StableSpineRenderer を使用してください

## アーカイブ日時
- 2025-09-02

## 開発経緯
1. PureSpineLoader.jsの機能統合のために UniversalSpineRenderer を作成
2. 黒枠問題の完全解決のために StableSpineRenderer を作成
3. StableSpineRenderer が優秀だったため、UniversalSpineRenderer は不要に

## 後継モジュール
- **推奨**: `micromodules/spine-renderer/StableSpineRenderer.js`
- **マニュアル**: `docs/manuals/STABLE_SPINE_RENDERER_GUIDE.md`

## アーカイブファイル
- `UniversalSpineRenderer.js` - 統合版レンダラー（689行）
- `test-universal-spine-renderer.html` - テストファイル（465行）

## 注意事項
- これらのファイルは参考目的でのみ保存されています
- 実際の開発では StableSpineRenderer を使用してください
- 黒枠問題は StableSpineRenderer で完全解決済みです