# 📚 ドキュメント一覧

「ぷらっとくんの予約システム」の技術ドキュメント集です。

## 🚀 クイックナビゲーション

### 🎯 目的別ガイド

| 目的 | ドキュメント | 説明 |
|------|-------------|------|
| **日常的な開発作業** | [📘 CLAUDE.md](../CLAUDE.md) | サーバー起動、位置調整、基本操作 |
| **技術仕様の確認** | [📖 開発詳細ガイド](./DEVELOPMENT_GUIDE.md) | アニメーション、スタイル、SEO等の詳細 |
| **問題解決・デバッグ** | [🔧 レイヤー診断ガイド](./LAYER_DEBUGGING.md) | レイヤー問題の診断と解決手順 |
| **Spine関連の問題** | [⚙️ Spineトラブルシューティング](./SPINE_TROUBLESHOOTING.md) | Spine特有の問題と解決策 |
| **設計思想の理解** | [🏛️ アーキテクチャノート](./ARCHITECTURE_NOTES.md) | 設計思想とリファクタリング記録 |

### 📋 頻度別分類

#### 🔥 毎日使用
- **[CLAUDE.md](../CLAUDE.md)** - サーバー起動、HTML設定、基本操作

#### 🟡 週1-2回
- **[開発詳細ガイド](./DEVELOPMENT_GUIDE.md)** - 新機能開発、スタイル調整時

#### 🔵 問題発生時のみ
- **[レイヤー診断ガイド](./LAYER_DEBUGGING.md)** - 位置ずれ問題、レイヤー関連
- **[Spineトラブルシューティング](./SPINE_TROUBLESHOOTING.md)** - Spine表示問題、エラー解決

#### 🟣 設計・改修時
- **[アーキテクチャノート](./ARCHITECTURE_NOTES.md)** - 大規模変更、設計見直し

---

## 🆘 困った時のクイックリファレンス

### よくある問題と対処ドキュメント

| 問題 | 参照ドキュメント | セクション |
|------|----------------|-----------|
| **ぷらっとくんが表示されない** | [CLAUDE.md](../CLAUDE.md) → [Spine診断](./SPINE_TROUBLESHOOTING.md) | 基本操作 → 詳細診断 |
| **白い枠と同じ動きをする** | [レイヤー診断](./LAYER_DEBUGGING.md) | パターン1: 白い枠と同じ動き |
| **ウィンドウリサイズで位置がずれる** | [レイヤー診断](./LAYER_DEBUGGING.md) | 診断ツールとデバッグコマンド |
| **新機能を追加したい** | [開発詳細ガイド](./DEVELOPMENT_GUIDE.md) | アーキテクチャの特徴 |
| **コードをリファクタリングしたい** | [アーキテクチャノート](./ARCHITECTURE_NOTES.md) | リファクタリング設計ガイド |

### 🚀 緊急時の対応手順

1. **[CLAUDE.md](../CLAUDE.md)** で基本的な対処を確認
2. **[レイヤー診断](./LAYER_DEBUGGING.md)** の緊急時対処法を実行
3. **[Spine診断](./SPINE_TROUBLESHOOTING.md)** でSpine特有の問題をチェック
4. それでも解決しない場合は各ファイルの詳細セクションを参照

---

## 📁 ファイル構造

```
docs/
├── README.md                    # このファイル（ナビゲーション）
├── DEVELOPMENT_GUIDE.md         # 技術仕様と実装詳細
├── LAYER_DEBUGGING.md          # レイヤー問題診断ガイド
├── ARCHITECTURE_NOTES.md       # 設計思想とアーキテクチャ
└── SPINE_TROUBLESHOOTING.md    # Spine関連問題解決

../CLAUDE.md                    # 日常的な開発ガイド（メイン）
```

---

## 🔄 ドキュメント更新ルール

### 新しい問題を解決した時
1. **問題の種類を判断**
   - レイヤー関連 → [LAYER_DEBUGGING.md](./LAYER_DEBUGGING.md)
   - Spine関連 → [SPINE_TROUBLESHOOTING.md](./SPINE_TROUBLESHOOTING.md)
   - 一般的な開発 → [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)

2. **解決策を記録**
   - 問題の症状
   - 原因分析
   - 解決手順
   - 予防策

3. **このREADMEを更新**（必要に応じて）
   - クイックリファレンスに追加
   - よくある問題一覧に追加

### 新機能を追加した時
1. **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** に技術詳細を記録
2. **[CLAUDE.md](../CLAUDE.md)** に日常的な操作方法を記録
3. 必要に応じて **[ARCHITECTURE_NOTES.md](./ARCHITECTURE_NOTES.md)** に設計思想を記録

---

## 💡 効率的な活用方法

### 開発開始時
1. **[CLAUDE.md](../CLAUDE.md)** でサーバー起動
2. 何か追加したい場合は **[開発詳細ガイド](./DEVELOPMENT_GUIDE.md)** で既存パターンを確認

### 問題発生時
1. **[レイヤー診断](./LAYER_DEBUGGING.md)** の診断ツールを実行
2. 問題パターンを特定
3. 該当するセクションの解決策を実行

### 保守・改修時
1. **[アーキテクチャノート](./ARCHITECTURE_NOTES.md)** で設計思想を理解
2. **[開発詳細ガイド](./DEVELOPMENT_GUIDE.md)** で技術詳細を確認
3. 変更後は適切なドキュメントを更新

この構造により、情報が整理され、必要な時に必要なドキュメントへ迅速にアクセスできます。