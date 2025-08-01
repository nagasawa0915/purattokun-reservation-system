# 🎯 実装チェックリスト

## 📚 このチェックリストについて

**目的**: 実装時の仕様誤解・問題発生を防ぎ、確実で効率的な開発を実現する  
**使用方法**: 新機能実装・既存機能修正時に必ず参照し、チェックボックスを順番に確認する  
**更新ルール**: 問題発生時は該当項目を見直し、必要に応じてチェックリストを改善する

---

## 🚀 Phase 1: 実装前チェック（Pre-Implementation）

### 📖 仕様理解・調査
- [ ] **既存実装の確認**: 類似機能・システムを3つ以上確認した
- [ ] **ドキュメント熟読**: 関連ドキュメント（CLAUDE.md、仕様書、トラブルシューティング）を詳細に読んだ
- [ ] **実装例の理解**: 既存の実装コードを読み、「なぜそうなっているか」を理解した
- [ ] **仕様の文書化**: 実装すべき機能を自分の言葉で説明できる

### 🎯 実装方針の策定
- [ ] **実装方針の文書化**: コードを書く前に実装方針を文章で説明した
- [ ] **既存システムとの整合性**: 既存システムの設計思想・パターンと一致している
- [ ] **「追加」か「変更」かの明確化**: 既存機能への影響範囲を明確にした
- [ ] **代替案の検討**: より簡単・安全な実装方法がないか検討した

### 📋 実装計画の作成
- [ ] **段階的実装計画**: 機能を小さな単位に分割した（推奨：15-30分単位）
- [ ] **テスト計画**: 各段階での動作確認方法を決めた
- [ ] **ロールバック計画**: 問題発生時の戻し方を明確にした
- [ ] **成功基準の定義**: 「完成」の基準を具体的に定義した

---

## ⚙️ Phase 2: 実装中チェック（During Implementation）

### 🔧 段階的実装
- [ ] **最小実装の完成**: まず最も基本的な機能のみを実装した
- [ ] **即座の動作確認**: 実装後15分以内に動作確認を行った
- [ ] **問題の即座解決**: 動かない場合は次に進まず、必ず原因を究明した
- [ ] **コード品質の確保**: 既存コードスタイル・命名規則に従った

### 🧪 テスト・検証
- [ ] **基本動作確認**: 実装した機能が期待通りに動作する
- [ ] **エラーハンドリング**: 異常時の動作が適切に処理される
- [ ] **既存機能の回帰テスト**: 既存機能が破壊されていない
- [ ] **複数環境での確認**: 異なるブラウザ・デバイスでテストした

### 📊 進捗管理
- [ ] **進捗の記録**: 各段階の完了状況を記録している
- [ ] **問題の記録**: 発生した問題と解決策を記録している
- [ ] **時間管理**: 予定時間を大幅に超過していない（超過時は方針見直し）

---

## ✅ Phase 3: 完成後チェック（Post-Implementation）

### 🎯 最終確認
- [ ] **全機能の動作確認**: 実装した全機能が正常に動作する
- [ ] **ユーザビリティ確認**: 実際の使用シナリオで問題がない
- [ ] **パフォーマンス確認**: 表示速度・動作速度に問題がない
- [ ] **コンソールエラー確認**: F12コンソールにエラーが出ていない

### 📝 ドキュメント更新
- [ ] **実装内容の記録**: 実装した機能の詳細を適切なドキュメントに記録した
- [ ] **使用方法の記録**: 新機能の使用方法を分かりやすく記録した
- [ ] **トラブルシューティング準備**: 予想される問題と解決策を記録した
- [ ] **CLAUDE.md更新**: 必要に応じて開発ガイドを更新した

### 🔄 品質保証
- [ ] **コードレビュー**: 実装コードを客観的に見直した
- [ ] **命名・コメント**: 変数名・関数名・コメントが適切である
- [ ] **不要コードの削除**: デバッグ用コード・コメントアウトを削除した
- [ ] **セキュリティ確認**: セキュリティ上の問題がない

---

## 🚨 特別チェック項目（問題多発領域）

### 🎮 Spine関連実装
- [ ] **Canvas要素の表示制御**: `display`プロパティではなく`opacity`を使用している
- [ ] **座標系の統一**: 既存の座標管理システムと整合性がある
- [ ] **エラーハンドリング**: WebGL未対応・アセット読み込み失敗時の対応がある
- [ ] **レスポンシブ対応**: ウィンドウリサイズで位置・サイズが適切に調整される

### 🎯 HTML設定制御システム
- [ ] **「追加」方式の確認**: 既存CSS設定を上書きではなく、条件付きで適用している
- [ ] **data属性の存在確認**: 設定がない場合のデフォルト動作が適切である
- [ ] **動的更新対応**: 設定変更時の更新方法が実装されている
- [ ] **フォールバック対応**: 設定読み込み失敗時の動作が適切である

### 🖼️ レスポンシブ・UI関連
- [ ] **aspect-ratio使用**: キャラクター潰れ防止のため縦横比が固定されている
- [ ] **パーセンテージ基準**: viewport unitsではなく親要素基準の%を使用している
- [ ] **Transform統一**: `translate(-50%, -50%)`による中央寄せが統一されている
- [ ] **z-index管理**: 表示順序が適切に管理されている

---

## 🎯 実装パターン別チェック

### パターンA: 新機能追加
```markdown
重点チェック項目：
- [ ] 既存システムとの統合方法が適切
- [ ] 機能の有効/無効切り替えが可能
- [ ] 既存機能への影響がない
- [ ] 段階的な機能追加が可能
```

### パターンB: 既存機能修正
```markdown
重点チェック項目：
- [ ] 修正理由・目的が明確
- [ ] 修正範囲が最小限
- [ ] 回帰テストが充分
- [ ] ユーザーへの影響を評価済み
```

### パターンC: デバッグ・トラブルシューティング
```markdown
重点チェック項目：
- [ ] 問題の根本原因を特定
- [ ] 応急処置ではなく根本解決
- [ ] 同種問題の予防策を実装
- [ ] トラブルシューティング記録を更新
```

---

## 🔄 チェックリスト改善システム

### 問題発生時の対応
1. **問題分析**: どのチェック項目で防げたかを分析
2. **チェックリスト更新**: 不足していたチェック項目を追加
3. **重要度見直し**: 重要なチェック項目を上位に移動
4. **具体化**: 抽象的なチェック項目をより具体的に修正

### 定期的な見直し
- **月次レビュー**: チェックリストの有効性を評価
- **項目の統廃合**: 重複項目の整理・不要項目の削除
- **実例の追加**: 具体的な実装例・失敗例を追記
- **チーム共有**: チェックリストの改善点を共有

---

## 💡 効果的な使用方法

### 実装開始時
```markdown
1. このチェックリストを開く
2. Phase 1を順番に確認
3. 不明な項目は必ず調査・質問
4. 全てチェック完了後に実装開始
```

### 実装中
```markdown
1. 15-30分ごとにPhase 2を確認
2. 問題発生時は即座にチェックリスト参照
3. 予定外の作業は必ずチェックリストで確認
4. 疲労時は特に基本項目を重視
```

### 完成時
```markdown
1. Phase 3を全項目確認
2. 不合格項目は必ず修正
3. ドキュメント更新を忘れずに
4. 今回の改善点をチェックリストに反映
```

---

## 🎯 緊急時のクイックチェック

**時間がない場合の最重要5項目**
- [ ] 既存実装を確認したか？
- [ ] 基本動作を確認したか？
- [ ] 既存機能を壊していないか？
- [ ] エラーハンドリングはあるか？
- [ ] ドキュメントを更新したか？

---

## 🔗 関連ドキュメント

| 用途 | ドキュメント |
|------|-------------|
| **実装ガイド** | [🚀 docs/SPINE_SETUP_GUIDE.md](./SPINE_SETUP_GUIDE.md) |
| **トラブルシューティング** | [📋 docs/_TROUBLESHOOTING.md](.//_TROUBLESHOOTING.md) |
| **開発方針** | [📘 ../CLAUDE.md](../CLAUDE.md) |
| **アーキテクチャ** | [🏛️ docs/ARCHITECTURE_NOTES.md](./ARCHITECTURE_NOTES.md) |

---

**💡 重要**: このチェックリストは「面倒なルール」ではなく「問題を未然に防ぐツール」です。慣れると自然に高品質な実装ができるようになります。