# 📋 トラブルシューティング記録ルール

## 🎯 このドキュメントの目的

トラブルシューティングの記録品質を保ち、AIと人間の両方が効率的に問題解決できるシステムを維持するためのルール集です。

---

## 🚨 記録時の基本原則

### ✅ 記録すべき内容
1. **解決した問題** - 成功事例として価値あり
2. **解決しなかった試行錯誤** - 失敗パターンとして重要
3. **部分的に解決した問題** - 回避策として有用
4. **新たに発見した問題** - 未解決でも記録価値あり

### ❌ 記録しない内容
- 推測や仮説のみの内容
- 実際に試していない方法
- 環境情報が不足している報告
- 再現手順が不明な問題

---

## 📝 ファイル作成・更新ルール

### ファイル命名規則
```
形式: [問題の内容を表す日本語].md
例:
- キャラクター表示問題.md
- ウィンドウリサイズ問題.md  
- Spineライブラリ読込問題.md
- 特定条件で点滅する問題.md
```

### ファイルヘッダー（必須）
```markdown
---
title: [問題のタイトル]
status: 未解決/部分解決/解決済み
tags: [カテゴリ, 技術, 症状]
aliases: 
  - [ユーザーが使いそうな別名1]
  - [ユーザーが使いそうな別名2]
  - [英語での表現がある場合]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

### 必須セクション構成

**🚨 重要**: 全てのトラブルシューティングファイルに「⚡ 有効な解決策・回避策」セクションは必須

```markdown
# 🎯 [問題タイトル]

## 📊 現在の状況
**ステータス**: [未解決/部分解決/解決済み + 簡単な説明]

## ⚡ 有効な解決策・回避策  ← 【必須セクション】
[解決済みの場合は確実に効果がある方法を記載]
[未解決の場合は「現在調査中」または有効な回避策があれば記載]

## 🔍 問題の詳細
### 発生条件
[どういう時に起こるか]

### 症状
[具体的に何が起きるか]

### 環境情報
[ブラウザ、OS、バージョンなど]

## 📝 試行錯誤の履歴

### [✅/❌/⚠️] Case #[連番]: [日付] - [試した方法の概要]
**問題**: [具体的な状況]
**試した方法**: 
```[言語]
[実際に試したコード・設定・手順]
```
**結果**: [効果あり/効果なし/部分的効果]
**原因推測/学び**: [なぜこの結果になったか、何を学んだか]
**環境**: [テスト環境の詳細]
```

### ⚡セクションのルール
1. **全ファイル必須**: 例外なく全てのトラブルシューティングファイルに記載
2. **解決策の順序**: 必ず以下の順序で記載
   - **解決策1: 診断ツール** - 現状確認・問題特定
   - **解決策2: 最も効果的な解決策** - 確実に動作する方法
   - **解決策3: 代替案・回避策** - 解決策2が効かない場合
3. **実行順序**: AIは必ず解決策1から順番に実行
4. **解決済みの場合**: 確実に効果がある解決策を3つまで記載
5. **未解決の場合**: 「現在調査中」と明記、有効な回避策があれば記載
6. **部分解決の場合**: 有効な回避策と、未解決部分の説明を記載

---

## 🏷️ タグ付けルール

### タグカテゴリ
```
# 問題の種類
- 表示（見えない、表示されない）
- 位置（ずれる、位置がおかしい）
- サイズ（大きすぎ、小さすぎ、変形）
- アニメーション（動かない、おかしな動き）
- パフォーマンス（重い、遅い）
- エラー（コンソールエラー、例外）

# 関連技術
- Spine（Spine WebGL関連）
- Canvas（Canvas要素関連）
- CSS（スタイル関連）
- JavaScript（スクリプト関連）
- レスポンシブ（画面サイズ対応）
- レイヤー（z-index、重なり）

# 緊急度（未解決問題のみ使用）
- 緊急（サイト機能停止レベル）
- 重要（ユーザー体験に大きく影響）
- 通常（改善すべきだが運用可能）
```

### エイリアス（別名）設定
```
# ユーザーが実際に使いそうな表現
- ぷらっとくん見えない
- キャラクター消えた
- 表示されない
- ずれる
- 位置がおかしい
- 動かない

# 英語表現（開発者向け）
- character not visible
- display issue
- positioning problem
```

---

## 🤖 AI向け記録指示

### 自動記録のトリガー
AI（Claude）は以下の場合に自動的に記録を実行：

1. **問題を解決した直後**
2. **解決策を試したが効果がなかった場合**
3. **新しい問題を発見した場合**
4. **既存の問題に新しい情報を追加した場合**

### 記録実行手順
```
Step 1: 問題の特定
現在の状況を以下の形式で整理：
- 何が: [対象]
- どうなっている: [症状]  
- いつ: [発生条件]

Step 2: 既存ファイルの検索
1. docs/_TROUBLESHOOTING.mdを確認
2. タグ・エイリアスから最適なファイルを特定
3. 該当なしの場合は新規作成

Step 3: 記録内容の構造化
上記の「必須セクション構成」に従って記録

Step 4: ファイルの更新
1. 既存ファイル → 履歴セクションに追記
2. 新規ファイル → テンプレートに従って作成
3. status・updated日付を更新

Step 5: 完了報告
「トラブルシューティング記録を更新: [ファイル名]」
```

### 判断に迷った場合の行動
- **ファイル選択に迷う** → ユーザーに確認を求める
- **記録すべきか不明** → 記録して後で整理
- **エラーや問題発生** → 記録を中断して報告

---

## 📊 記録品質の管理

### 良い記録の例
```markdown
### ✅ Case #3: 2025-01-26 - Canvas内部サイズを正方形に統一

**問題**: キャラクターが横に伸びて表示される
**試した方法**: 
```javascript
// Canvas内部サイズを正方形に変更
canvas.width = 70;    
canvas.height = 70;   
// CSS表示サイズも合わせる
canvas.style.width = '80px';
canvas.style.height = '80px';
```
**結果**: ✅ 完全に解決
**原因推測**: Canvas内部解像度とCSS表示サイズの比率が違うと歪みが発生
**環境**: Chrome 120, Windows 11, localhost:8000
```

### 避けるべき記録
```markdown
### ❌ 悪い例

**問題**: なんか変
**試した方法**: いろいろ試した
**結果**: だめだった
**原因推測**: よくわからない
```

---

## 🔄 ファイル更新ルール

### status更新タイミング
- **未解決 → 部分解決**: 回避策が見つかった時
- **部分解決 → 解決済み**: 根本的解決策が確立した時
- **解決済み → 部分解決**: 新しい環境で問題が再発した時

### 履歴の整理
- **失敗事例は削除しない** - 貴重な知識として保持
- **解決後も失敗履歴を残す** - 同じ間違いを防ぐため
- **重複する内容は統合** - 読みやすさを重視

### バックアップ
- 大幅な変更前は該当ファイルのバックアップを作成
- Git コミットで変更履歴を保持

---

## 🔒 確定済み解決策の保護

### 保護ルール
- **変更禁止マーク**: `<!-- 🔒 確定済み解決策 - 変更禁止 -->`のコメントがある⚡セクションは変更禁止
- **追加のみ許可**: 新しいCaseの追加は可能、既存解決策の変更は禁止
- **順序変更禁止**: 解決策1, 2, 3の順序は固定（実績があるため）

### AIが実装前に必ず確認すべき事項
1. **既存ファイル変更の場合**: 🔒マークの有無を確認
2. **影響範囲の特定**: 変更が他のファイルに与える影響
3. **後戻りできない変更**: ユーザーに事前確認を求める
4. **矛盾の検出**: 新ルールと既存システムの矛盾

## ✅ チェックリスト

### 新規ファイル作成時
- [ ] ファイル名は日本語で内容が明確
- [ ] ヘッダー情報が完全
- [ ] タグ・エイリアスが適切
- [ ] 必須セクションがすべて存在

### 既存ファイル更新時
- [ ] Case番号が連番
- [ ] 日付が正確
- [ ] 具体的なコード・手順を記載
- [ ] 結果が明確（✅/❌/⚠️）
- [ ] 環境情報を記載

### 記録完了時
- [ ] _TROUBLESHOOTING.mdの目次を更新
- [ ] statusとupdated日付を更新
- [ ] 記録内容をユーザーに報告

---

このルールに従うことで、蓄積されたトラブルシューティング情報が確実に役立つ知識資産となります。