# 📚 ドキュメントナビゲーション - 総合ガイド

「ぷらっとくんの予約システム」の**全ドキュメントへの入り口**です。  
目的や状況に応じて、最適な情報に迅速にアクセスできます。

---

## 🚀 FAQ - よくある質問（即座解決）

<details>
<summary>🆘 <strong>緊急時：ぷらっとくんが見えない</strong></summary>

**答え**: [キャラクター表示問題](./troubleshooting/キャラクター表示問題.md) → 緊急診断ツール実行
```bash
python server.py
# ブラウザでF12 → コンソール → 診断コマンド実行
```
</details>

<details>
<summary>🎯 <strong>すぐ使いたい：編集モードの起動方法</strong></summary>

**答え**: URLに `?edit=true` を追加
```
http://localhost:8000/index.html?edit=true
```
詳細 → [Web編集ガイド](./user-guides/web-editing-guide.md)
</details>

<details>
<summary>📐 <strong>位置がズレる：座標問題の解決</strong></summary>

**答え**: [座標関連問題](./troubleshooting/coordinate-problems.md) → 症状別解決策
- PC版のみズレる → CSS width追加
- 編集モードでズレる → 座標変換修正
- デスクトップアプリでズレる → DPR補正適用
</details>

<details>
<summary>🖥️ <strong>デスクトップアプリが動かない</strong></summary>

**答え**: [デスクトップアプリ問題](./troubleshooting/desktop-app-issues.md) → バージョン別診断
```bash
cd spine-editor-desktop-v3
npm install
npm start
```
</details>

<details>
<summary>📦 <strong>パッケージを出力したい</strong></summary>

**答え**: [パッケージ出力ガイド](./user-guides/package-export-guide.md) → ワンクリック出力
- Web版：「📦 パッケージ出力」ボタン
- デスクトップ版：「📦 エクスポート」ボタン
</details>

---

## 🎯 タスクベース索引 - やりたいことから探す

### 👤 ユーザー向け操作

| やりたいこと | ガイド | 所要時間 |
|-------------|--------|---------|
| **新しいSpineキャラを配置したい** | [Web編集ガイド](./user-guides/web-editing-guide.md) | 5分 |
| **キャラクターの位置を調整したい** | [Web編集ガイド](./user-guides/web-editing-guide.md) | 2分 |
| **デスクトップアプリで編集したい** | [デスクトップv3ガイド](./user-guides/desktop-v3-guide.md) | 10分 |
| **お客様用パッケージを作成したい** | [パッケージ出力ガイド](./user-guides/package-export-guide.md) | 3分 |
| **バウンディングボックスを編集したい** | [Web編集ガイド](./user-guides/web-editing-guide.md) | 5分 |

### 👨‍💻 開発者向け作業

| やりたいこと | ガイド | 難易度 |
|-------------|--------|--------|
| **新機能を追加したい** | [開発セットアップ](./development/setup-guide.md) → [技術仕様](./technical/architecture-impl.md) | 🔥🔥🔥 |
| **バグを修正したい** | [問題別トラブルシューティング](#🔍-症状別ナビゲーション---問題解決) | 🔥🔥 |
| **コードレビューをしたい** | [コーディング規約](./development/coding-standards.md) | 🔥 |
| **座標系を理解したい** | [座標系仕様](./specifications/coordinate-specs.md) → [座標系実装](./technical/coordinate-impl.md) | 🔥🔥 |
| **Spine統合を改良したい** | [Spine統合仕様](./specifications/web-system-specs.md) → [Spine実装詳細](./technical/spine-integration-impl.md) | 🔥🔥🔥 |

### 📋 管理・保守作業

| やりたいこと | ガイド | 頻度 |
|-------------|--------|------|
| **システム仕様を確認したい** | [仕様書一覧](./specifications/) | 週1 |
| **リリース作業をしたい** | [リリースプロセス](./development/release-process.md) | 月1 |
| **新しい問題を記録したい** | [トラブルシューティング規則](./_TROUBLESHOOTING_RULES.md) | 随時 |
| **ドキュメントを更新したい** | [この文書の更新ルール](#🔄-ドキュメント管理ルール) | 随時 |

---

## 🔍 症状別ナビゲーション - 問題解決

### 🚨 表示関連の問題

| 症状 | 解決策 | 緊急度 |
|------|--------|--------|
| **キャラクターが見えない** | [キャラクター表示問題](./troubleshooting/キャラクター表示問題.md) | 🚨🚨🚨 |
| **アニメーションが動かない** | [Spine関連問題](./troubleshooting/spine-issues.md) | 🚨🚨 |
| **画像が表示されない** | [パッケージ出力問題](./troubleshooting/web-editing-issues.md) | 🚨🚨 |

### 📐 位置・座標関連の問題

| 症状 | 解決策 | 対象 |
|------|--------|------|
| **PC版で位置がズレる** | [座標関連問題](./troubleshooting/coordinate-problems.md) | Web版 |
| **編集モードで枠がズレる** | [座標関連問題](./troubleshooting/coordinate-problems.md) | Web版 |
| **デスクトップアプリで座標異常** | [デスクトップアプリ問題](./troubleshooting/desktop-app-issues.md) | Desktop |
| **マウスとキャラクターの動きが逆** | [座標関連問題](./troubleshooting/coordinate-problems.md) | Desktop |

### 🛠️ 機能・UI関連の問題

| 症状 | 解決策 | 対象 |
|------|--------|------|
| **編集ボタンが効かない** | [Web編集問題](./troubleshooting/web-editing-issues.md) | Web版 |
| **ハンドルが表示されない** | [Web編集問題](./troubleshooting/web-editing-issues.md) | Web版 |
| **パッケージ出力に失敗** | [Web編集問題](./troubleshooting/web-editing-issues.md) | Web版 |
| **デスクトップアプリが起動しない** | [デスクトップアプリ問題](./troubleshooting/desktop-app-issues.md) | Desktop |

---

## 📁 ドキュメント構造 - 全体マップ

### 🎯 使用頻度別分類

#### 🔥 毎日使用
- **[CLAUDE.md](../CLAUDE.md)** - 日常的な開発作業（サーバー起動、基本操作）
- **[📋 よくある問題](#🚨-表示関連の問題)** - クイック問題解決

#### 🟡 週1-2回使用  
- **[user-guides/](./user-guides/)** - 操作ガイド（Web編集、デスクトップアプリ）
- **[troubleshooting/](./troubleshooting/)** - 問題解決ガイド

#### 🔵 開発・改修時
- **[technical/](./technical/)** - 技術実装詳細
- **[specifications/](./specifications/)** - システム仕様・規格
- **[development/](./development/)** - 開発者ガイド

#### 🟣 参考・アーカイブ
- **[legacy/](./legacy/)** - レガシー情報・過去バージョン

### 📂 フォルダ別詳細

```
📁 docs/
├── 📄 README.md                    # 📖 このファイル（多層索引・FAQ）
├── 📄 QUICK_START.md               # 🚀 5分で始めるガイド
├── 📄 CHANGELOG.md                 # 📅 製品バージョン変更記録
│
├── 📁 user-guides/                 # 👤 ユーザー向け操作ガイド
│   ├── 📄 web-editing-guide.md     # 🌐 Web版編集システム完全ガイド
│   ├── 📄 desktop-v3-guide.md      # 🖥️ デスクトップv3.0操作ガイド
│   └── 📄 package-export-guide.md  # 📦 パッケージ出力完全ガイド
│
├── 📁 troubleshooting/             # 🚨 問題解決（統合版）
│   ├── 📄 README.md                # 🔍 問題解決索引
│   ├── 📄 coordinate-problems.md   # 📐 座標関連問題（統合版）
│   ├── 📄 spine-issues.md          # 🎮 Spine関連問題（統合版）
│   ├── 📄 desktop-app-issues.md    # 🖥️ デスクトップアプリ問題（統合版）
│   └── 📄 web-editing-issues.md    # 🌐 Web編集システム問題
│
├── 📁 technical/                   # 🔧 技術実装詳細（開発者向け）
│   ├── 📄 architecture-impl.md     # 🏛️ システム実装アーキテクチャ
│   ├── 📄 spine-integration-impl.md # 🎮 Spine WebGL実装技術
│   └── 📄 coordinate-impl.md       # 📐 座標系実装・変換処理
│
├── 📁 specifications/              # 📋 仕様書（規格・定義）
│   ├── 📄 web-system-specs.md      # 🌐 Web版システム仕様
│   ├── 📄 desktop-v3-specs.md      # 🖥️ デスクトップv3.0仕様
│   └── 📄 coordinate-specs.md      # 📐 座標系仕様・理論定義
│
├── 📁 development/                 # 👨‍💻 開発者向け情報
│   ├── 📄 setup-guide.md           # 🛠️ 開発環境セットアップ
│   ├── 📄 coding-standards.md      # 📝 コーディング規約
│   └── 📄 testing-guide.md         # 🧪 テスト方法・品質保証
│
└── 📁 legacy/                      # 📚 レガシー・アーカイブ
    ├── 📁 v1-archive/              # v1.0関連アーカイブ
    ├── 📁 v2-archive/              # v2.0関連アーカイブ
    └── 📁 experimental/            # 実験的実装記録
```

---

## 🎯 製品別ナビゲーション

### 🌐 Web版編集システム
- **操作方法**: [Web編集ガイド](./user-guides/web-editing-guide.md)
- **技術仕様**: [Web版システム仕様](./specifications/web-system-specs.md)
- **問題解決**: [Web編集問題](./troubleshooting/web-editing-issues.md)
- **座標問題**: [座標関連問題](./troubleshooting/coordinate-problems.md)

### 🖥️ デスクトップアプリ
- **v3.0操作**: [デスクトップv3ガイド](./user-guides/desktop-v3-guide.md)
- **v3.0仕様**: [デスクトップv3仕様](./specifications/desktop-v3-specs.md)
- **問題解決**: [デスクトップアプリ問題](./troubleshooting/desktop-app-issues.md)
- **過去バージョン**: [v2アーカイブ](./legacy/v2-archive/)

### 🎮 Spine WebGL統合
- **実装技術**: [Spine統合実装](./technical/spine-integration-impl.md)
- **問題解決**: [Spine関連問題](./troubleshooting/spine-issues.md)
- **座標系**: [座標系仕様](./specifications/coordinate-specs.md) + [座標系実装](./technical/coordinate-impl.md)

---

## 🔄 ドキュメント管理ルール

### ✅ 新しい問題を発見・解決した時
1. **[_TROUBLESHOOTING.md](./_TROUBLESHOOTING.md)** で記録先を確認
2. 該当する `troubleshooting/*.md` に解決策を追加
3. このREADMEの「症状別ナビゲーション」を更新（必要時）

### ✅ 新機能を追加した時
1. **仕様書** (`specifications/`) に「どうあるべきか」を記録
2. **技術文書** (`technical/`) に「どう実装したか」を記録  
3. **操作ガイド** (`user-guides/`) に「どう使うか」を記録

### ✅ ドキュメント命名ルール
- **操作説明**: `xxx-guide.md`
- **仕様・規格**: `xxx-specs.md`
- **問題解決**: `xxx-issues.md`
- **実装詳細**: `xxx-impl.md`

---

## ⚡ 緊急時の3ステップ対応

1. **まず [FAQ](#🚀-faq---よくある質問即座解決) をチェック** → 即座解決できるかも
2. **[症状別ナビゲーション](#🔍-症状別ナビゲーション---問題解決) で問題を特定** → 詳細解決策へ
3. **解決しない場合は [CLAUDE.md](../CLAUDE.md) の緊急連絡先** → エスカレーション

---

## 💡 このドキュメントの使い方

- **初回**: 全体を軽く流し読みして構造を把握
- **日常**: FAQとタスクベース索引をブックマーク
- **問題発生**: 症状別ナビゲーションで即座解決
- **開発**: 製品別ナビゲーションで関連情報へ

---

**🚀 ドキュメントが見つからない場合や改善提案は [CLAUDE.md](../CLAUDE.md) へ**