# 📚 Docs整理計画 - 使いやすいドキュメント構造への統合

## 🎯 整理の目標

### ✅ 解決すべき課題
- **分散したdocs**: 4箇所に分かれたドキュメント
- **重複する内容**: 同じ問題が複数場所に記録
- **アクセス困難**: 必要な情報を見つけにくい
- **バージョン混在**: v1.0, v2.0, v3.0の情報が混在

### 🎯 目指す状態
- **一元管理**: 1箇所ですべての情報にアクセス
- **明確な分類**: 目的別・技術別の整理
- **検索性向上**: 迅速な問題解決
- **重複削除**: 情報の統合・最新化

---

## 📁 新しいdocs構造（提案）

```
📁 docs/
├── 📄 README.md                    # 📖 ドキュメント全体のガイド・多層索引・FAQ
├── 📄 QUICK_START.md               # 🚀 クイックスタートガイド  
├── 📄 CHANGELOG.md                 # 📅 製品バージョンの変更記録
│
├── 📁 user-guides/                 # 👤 ユーザー向けガイド
│   ├── 📄 web-editing-guide.md     # 🌐 Web版編集システム操作
│   ├── 📄 desktop-v2-guide.md      # 🖥️ デスクトップv2.0操作
│   ├── 📄 desktop-v3-guide.md      # 🖥️ デスクトップv3.0操作
│   └── 📄 package-export-guide.md  # 📦 パッケージ出力ガイド
│
├── 📁 technical/                   # 🔧 技術実装詳細（開発者向け）
│   ├── 📄 architecture-impl.md     # 🏛️ システム実装アーキテクチャ
│   ├── 📄 spine-integration-impl.md # 🎮 Spine WebGL実装技術
│   ├── 📄 coordinate-impl.md       # 📐 座標系実装・変換処理
│   ├── 📄 editing-system-impl.md   # ✏️ 編集システム実装詳細
│   └── 📄 api-reference.md         # 📚 API・関数リファレンス
│
├── 📁 troubleshooting/             # 🚨 問題解決（統合版）
│   ├── 📄 README.md                # 🔍 トラブルシューティング索引
│   ├── 📄 common-issues.md         # ⚡ よくある問題・クイック解決
│   ├── 📄 coordinate-problems.md   # 📐 座標関連問題（統合版）
│   ├── 📄 spine-issues.md          # 🎮 Spine関連問題（統合版）
│   ├── 📄 desktop-app-issues.md    # 🖥️ デスクトップアプリ問題（統合版）
│   ├── 📄 web-editing-issues.md    # 🌐 Web編集システム問題
│   └── 📁 resolved/                # ✅ 解決済み不具合・問題対応記録
│       ├── 📄 v1-resolved.md       # v1.0で解決した不具合記録
│       ├── 📄 v2-resolved.md       # v2.0で解決した不具合記録
│       └── 📄 v3-resolved.md       # v3.0で解決した不具合記録
│
├── 📁 development/                 # 👨‍💻 開発者向け情報
│   ├── 📄 setup-guide.md           # 🛠️ 開発環境セットアップ
│   ├── 📄 coding-standards.md      # 📝 コーディング規約
│   ├── 📄 testing-guide.md         # 🧪 テスト方法・品質保証
│   ├── 📄 release-process.md       # 🚀 リリースプロセス
│   └── 📄 subagent-guide.md        # 🤖 Claude Code サブエージェント活用
│
├── 📁 specifications/              # 📋 仕様書（規格・定義・要求仕様）
│   ├── 📄 web-system-specs.md      # 🌐 Web版システム仕様・要求定義
│   ├── 📄 desktop-v2-specs.md      # 🖥️ デスクトップv2.0仕様・規格
│   ├── 📄 desktop-v3-specs.md      # 🖥️ デスクトップv3.0仕様・規格
│   ├── 📄 coordinate-specs.md      # 📐 座標系仕様・理論定義
│   └── 📄 package-system-specs.md  # 📦 パッケージシステム仕様
│
└── 📁 legacy/                      # 📚 レガシー・アーカイブ
    ├── 📄 README.md                # レガシー情報ガイド
    ├── 📁 v1-archive/              # v1.0関連アーカイブ
    ├── 📁 v2-archive/              # v2.0関連アーカイブ
    ├── 📁 experimental/            # 実験的実装記録
    └── 📁 deprecated/              # 廃止された機能・文書
```

---

## 🚀 整理実行計画

### Phase 1: 統合・重複解決 📋
1. **座標系問題の統合**
   - 4箇所に分散した座標系トラブルシューティングを統合
   - 最新の解決策を consolidated version として作成
   - 古い重複ファイルをlegacy移行

2. **デスクトップアプリ情報統合**
   - v2, v3の情報を分離・整理
   - 共通問題と固有問題を分類
   - 技術的詳細と操作ガイドを分離

3. **トラブルシューティング再編**
   - 症状別・技術別に再分類
   - 解決済み問題をアーカイブ移行
   - 未解決問題を明確化

### Phase 2: アクセス性向上 🔍
1. **多層索引システム作成**
   ```
   📄 README.md (メイン索引)
   ├── 目的別索引 (ユーザータイプ別)
   ├── 症状別索引 (問題解決用)
   ├── 技術別索引 (技術分野別)
   ├── 製品別索引 (Web/Desktop別)
   └── FAQ形式索引 (Q&Aリンク集)
   ```

2. **タスクベース索引の追加**
   - 「新しいSpineキャラを配置したい」→ user-guides参照
   - 「座標がズレる問題を解決したい」→ troubleshooting/coordinate-problems参照
   - 「デスクトップアプリを開発したい」→ development参照
   - 「システム仕様を確認したい」→ specifications参照

3. **FAQ形式の問題解決**
   - よくある質問Top10のQ&A形式
   - 即座解決できる簡単な問題
   - 複雑な問題への詳細文書リンク

4. **クロスリファレンス強化**
   - 関連文書への相互リンク
   - 「も参照」セクション充実
   - タグシステム活用

5. **検索キーワード最適化**
   - よく使われる検索語の追加
   - 別名・エイリアス充実
   - 英日両言語対応

### Phase 3: 保守性確保 🔧
1. **更新ルール策定**
   - 新規問題の記録先ルール
   - 重複防止ガイドライン
   - 古い情報の更新・削除基準

2. **品質管理**
   - テンプレート作成
   - レビュープロセス
   - 一貫性チェック

---

## 📊 移行対象ファイル分析

### 🎯 統合対象（重複解決）

#### 座標系関連 📐
- `docs/troubleshooting/ウィンドウリサイズ問題.md`
- `spine-editor-desktop-v2/docs/troubleshooting/Spine-WebGL座標系問題.md`
- `spine-editor-desktop-v2/src/renderer/docs/troubleshooting/Spine座標系ドラッグ問題解決記録.md`

**→ 統合先**: `docs/troubleshooting/coordinate-problems.md`

#### デスクトップアプリ関連 🖥️
- `docs/troubleshooting/Spine Editor Desktop v2.0パフォーマンス問題.md`
- `docs/troubleshooting/デスクトップアプリSpine統合成功記録.md`
- `spine-editor-desktop-v2/docs/troubleshooting/*`

**→ 統合先**: `docs/troubleshooting/desktop-app-issues.md`

#### Spine技術関連 🎮
- `docs/troubleshooting/Spineアニメーション再生問題.md`
- `docs/troubleshooting/Spineライブラリ読込問題.md`
- `docs/SPINE_BEST_PRACTICES.md`
- `docs/SPINE_COORDINATE_SYSTEM_ANALYSIS.md`

**→ 統合先**: `docs/troubleshooting/spine-issues.md` + `docs/technical/spine-integration.md`

### 🔄 移行対象（分類整理）

#### ユーザーガイド化 👤
- `docs/manuals/*` → `docs/user-guides/`
- 編集システム操作情報を抽出

#### 技術文書化 🔧
- `docs/ARCHITECTURE_NOTES.md` → `docs/technical/architecture.md`
- `docs/DEVELOPMENT_GUIDE.md` → `docs/development/setup-guide.md`

#### 仕様書整理 📋
- `docs/POSITIONING_SYSTEM_SPECIFICATIONS.md` → `docs/specifications/web-system-specs.md`
- `docs/specifications/*` → `docs/specifications/` (統合)

---

## ⚡ 即座実行可能な改善

### 1. メイン索引の改善
現在の `docs/README.md` を総合ガイドに改良

### 2. クイック解決ガイド作成
よくある問題Top10の即座解決ガイド

### 3. 重複ファイル特定・マーク
同じ内容の文書に「重複注意」マーク追加

---

## 🎯 実行後の効果

### ✅ 利用者メリット
- **検索時間50%削減**: 必要な情報への迅速アクセス
- **重複情報削除**: 混乱の原因排除
- **段階的学習**: 初心者→上級者への学習パス提供

### ✅ 保守メリット
- **更新効率向上**: 1箇所更新で情報同期
- **品質向上**: 重複チェック・一貫性確保
- **新規記録効率化**: 明確な記録先ルール

### ✅ 技術的メリット
- **知識の体系化**: 散在した技術情報の統合
- **解決策の継承**: 過去の解決実績の活用
- **問題予防**: 類似問題の事前防止

---

---

## 🔄 改良ポイント（フィードバック反映）

### ✅ 反映済み改善
1. **仕様書と技術文書の線引き明確化**
   - 仕様書（specifications）: 「どうあるべきか（規格・定義・要求仕様）」
   - 技術文書（technical）: 「どう実装したか・技術的な背景・実装詳細」

2. **CHANGELOGとresolved issuesの区別**
   - CHANGELOG: 製品バージョンの変更記録（機能追加・仕様変更）
   - resolved: 不具合や問題対応の記録（バグ修正・問題解決）

3. **ファイル命名ルールの一貫性**
   - `xxx-guide.md`（操作説明）
   - `xxx-specs.md`（仕様・規格）
   - `xxx-issues.md`（問題）
   - `xxx-impl.md`（実装詳細）

4. **アクセス性強化の具体化**
   - FAQ形式（Q&Aリンク集）
   - タスクベース索引（目的別ガイド）
   - 多層索引システム

### 📝 実行順序（確定）
1. **README索引改良**（道しるべ確立）→ 先行実施
2. **座標系問題の統合**（影響大）→ 本格実施  
3. **アクセス性強化**（FAQ・タスクベース）→ 並行実施

---

## 📝 次のステップ

1. **✅ フィードバック反映完了**
2. **🚀 README索引改良実行**（道しるべ確立）
3. **📐 座標系問題統合実行**（本格整理）
4. **🔍 アクセス性強化実行**（FAQ・タスクベース索引）
5. **📊 効果測定・継続改善**

**🚀 実行準備完了！README索引改良から開始します。**