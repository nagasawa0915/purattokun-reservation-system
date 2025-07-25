# 効果的な指示方法ガイド - 開発問題を防ぐための指示テンプレート

**作成日**: 2024年7月25日  
**目的**: Canvas サイズ変更問題の再発防止のための指示方法改善

---

## 🎯 問題のある指示 vs 良い指示の比較

### ❌ 問題のある指示例（今回のケース）

**実際に行われた指示:**
> "SPINE_POSITIONING_SYSTEM.mdをもとに# Spine Positioning System を作成したいと思っているのですがまずは作成に移る前に実験で使ったいらないファイルをバックアップ用のフォルダに移すなどして環境をきれいにしてください。"

**問題点:**
1. **影響範囲が不明確**: 何に影響する可能性があるかの言及なし
2. **制約条件なし**: 既存機能への影響に関する制約なし
3. **テスト要求なし**: 動作確認の指示なし
4. **段階的実装の指示なし**: 一度に大きな変更を許容

### ✅ 改善された指示例

**推奨する指示:**
> "SPINE_POSITIONING_SYSTEM.mdをもとにSpine Positioning Systemを作成してください。
> 
> **制約条件:**
> - 既存のぷらっとくんの表示・動作に一切影響を与えないこと
> - 特にウィンドウリサイズ時の動作は現在と完全に同じであること
> 
> **実装手順:**
> 1. まず環境整理（実験ファイルのバックアップ移動）
> 2. 既存動作の詳細確認・記録
> 3. 新システムの段階的実装（Phase 1のみ）
> 4. 各段階で既存機能への影響確認
> 
> **必須テスト:**
> - ウィンドウリサイズ時のキャラクターサイズ・位置確認
> - 実装前後の動作比較
> 
> 何か既存動作に影響が出そうな場合は、必ず実装前に確認してください。"

---

## 📋 効果的な指示のテンプレート

### 1. **新機能追加時の指示テンプレート**

```
【機能名】を実装してください。

**目的・背景:**
- [なぜこの機能が必要か]
- [解決したい課題]

**制約条件（必須）:**
- 既存の[関連機能]に一切影響を与えないこと
- [特定の動作]は現在と完全に同じであること
- パフォーマンスに悪影響を与えないこと

**実装方針:**
- 段階的実装（Phase 1: [基本機能], Phase 2: [応用機能]）
- 既存システムとの互換性維持
- 新機能のオン/オフ切り替え可能

**必須テスト項目:**
- [具体的なテストケース1]
- [具体的なテストケース2]
- 既存機能の回帰テスト

**確認ポイント:**
実装過程で既存動作に影響が出そうな場合は、必ず実装前に報告・相談してください。
```

### 2. **既存コード変更時の指示テンプレート**

```
【対象ファイル・機能】を【変更内容】してください。

**変更理由:**
- [具体的な問題・課題]
- [期待する改善効果]

**厳重注意事項:**
- 変更前の動作を完全に記録すること
- 変更は最小限に留めること
- 既存の[関連機能]への影響を徹底確認すること

**必須手順:**
1. 変更前の動作確認・スクリーンショット保存
2. バックアップ作成
3. 最小限の変更実装
4. 変更後の動作確認・比較
5. 問題があれば即座にロールバック

**テスト項目:**
- [具体的なテストケース]
- 変更前後の動作比較
- 関連機能への影響確認

**報告要求:**
変更により予期せぬ動作の変化が見られた場合は、必ず報告してください。
```

### 3. **リファクタリング時の指示テンプレート**

```
【対象コード】のリファクタリングを行ってください。

**リファクタリングの目的:**
- [コードの改善目標]
- [保守性向上の具体的ポイント]

**絶対的制約:**
- 外部から見た動作は一切変更しないこと
- パフォーマンスを悪化させないこと
- 既存のAPIは完全に維持すること

**推奨アプローチ:**
- 既存テストケースを先に作成
- 小さな単位での段階的リファクタリング
- 各段階でテスト実行・確認

**検証方法:**
- リファクタリング前後で同一の入力に対し同一の出力を保証
- 自動テストの作成・実行
- 手動でのユーザー操作テスト

**安全策:**
問題が発生した場合の即座なロールバック準備をしてください。
```

---

## 🔍 指示に含めるべき重要要素

### 1. **制約条件の明確化**

**必須項目:**
- 既存機能への影響範囲の限定
- パフォーマンス制約
- 互換性要求
- UI/UX体験の維持

**具体例:**
```
制約条件:
- ぷらっとくんのサイズ・位置・アニメーションは現在と同一であること
- ウィンドウリサイズ時の動作は一切変更しないこと
- ページ読み込み速度は現在以上であること
- 既存のクリック機能は完全に維持すること
```

### 2. **段階的実装の指示**

**推奨パターン:**
```
実装手順:
1. Phase 1: [最小限の基本機能] - リスク低
2. Phase 2: [応用機能] - Phase 1の動作確認後
3. Phase 3: [高度機能] - Phase 2の安定確認後

各Phaseでの必須確認:
- 既存機能への影響確認
- パフォーマンス測定
- ユーザビリティテスト
```

### 3. **具体的なテスト指示**

**効果的なテスト指示:**
```
必須テスト項目:
1. ウィンドウリサイズテスト:
   - 最大化→縮小→最大化のサイクル
   - 横幅のみ・縦幅のみの変更
   - デベロッパーツールでの画面サイズ変更

2. 比較テスト:
   - 実装前のスクリーンショット保存
   - 実装後の同条件での比較
   - 数値的な差異の確認

3. 異常系テスト:
   - 高速なウィンドウリサイズ
   - 極端なサイズ変更
   - 複数タブでの同時動作
```

---

## 💡 指示方法のベストプラクティス

### 1. **「なぜ」を明確にする**

**❌ 悪い例:**
> "Canvasサイズを固定にしてください"

**✅ 良い例:**
> "ウィンドウリサイズ時にキャラクターサイズが変化する問題を解決するため、Canvasサイズを固定にしてください。ただし、レスポンシブ対応は維持する必要があります。"

### 2. **制約を先に伝える**

**推奨順序:**
1. 制約条件・注意事項
2. 目的・背景
3. 具体的な実装指示
4. テスト・確認項目

### 3. **確認ポイントを事前提示**

**例:**
```
実装過程での確認ポイント:
- キャラクターのサイズが意図せず変わった場合 → 即座に報告
- 新しいエラーがコンソールに出た場合 → 実装を停止して報告
- 既存機能の動作に疑問を感じた場合 → 実装前に確認
```

### 4. **段階的な報告を求める**

**例:**
```
報告タイミング:
- Phase 1完了時: 基本動作の確認結果
- 問題発見時: 即座の報告と対応相談
- 最終完了時: 全テスト結果の報告
```

---

## 🚫 避けるべき指示パターン

### 1. **曖昧な指示**
- ❌ "良い感じにしてください"
- ❌ "適当に調整してください"
- ❌ "問題を解決してください"

### 2. **制約のない指示**
- ❌ "自由に実装してください"
- ❌ "最適化してください"
- ❌ "改善してください"

### 3. **一度に大きな変更を求める指示**
- ❌ "システム全体をリファクタリングしてください"
- ❌ "全ての機能を同時に実装してください"

### 4. **テスト指示のない実装指示**
- ❌ "機能を追加してください"（テスト方法なし）
- ❌ "バグを修正してください"（確認方法なし）

---

## 📝 指示作成時のチェックリスト

実際に指示を出す前に、以下をチェック:

- [ ] 制約条件が明確に記載されているか
- [ ] 既存機能への影響範囲が限定されているか
- [ ] 段階的実装の指示があるか
- [ ] 具体的なテスト項目が含まれているか
- [ ] 問題発生時の報告指示があるか
- [ ] 実装の目的・背景が説明されているか
- [ ] 避けるべき変更が明記されているか
- [ ] 成功の判定基準が明確か

---

## 🎯 今回の問題に対する理想的な指示例

**もし今回のケースで理想的な指示をするなら:**

```
SPINE_POSITIONING_SYSTEM.mdをもとにSpine Positioning Systemを実装してください。

**重要な制約条件:**
- 既存のぷらっとくんの表示・動作に一切影響を与えないこと
- 特にウィンドウリサイズ時のキャラクターサイズ・位置は現在と完全に同じであること
- 既存のクリック機能・アニメーションは完全に維持すること

**実装前の準備:**
1. 環境整理（実験ファイルのアーカイブ移動）
2. 現在のぷらっとくんの動作を詳細に記録（スクリーンショット含む）
3. ウィンドウリサイズ時の動作を確認・記録

**段階的実装:**
- Phase 1のみ実装（基盤構築）
- 新機能は既存システムに影響しない独立したモジュールとして作成
- 既存システムとの統合は慎重に行う

**各段階での必須確認:**
- ウィンドウサイズを変更してキャラクターサイズが変わらないこと
- 実装前後でぷらっとくんの見た目・動作が同一であること
- 新しいエラーが発生していないこと

**実装中の注意:**
- 既存のCanvas要素のサイズ・位置設定に変更を加える場合は事前相談
- 自動リサイズ機能などの「便利機能」は既存動作への影響を慎重検証
- 少しでも既存動作に疑問を感じたら実装を停止して相談

この指示により、今回のような問題を防ぐことができたでしょう。
```

---

**重要**: 良い指示は「何をするか」だけでなく「何をしてはいけないか」「どう確認するか」を明確にすることです。

**最終更新**: 2024年7月25日