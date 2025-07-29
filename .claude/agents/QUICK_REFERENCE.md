# 🚀 サブエージェント クイックリファレンス

## ✅ チェックリスト（動かない時）

1. **Claude Codeバージョン**: v1.0.60以降か？
2. **フォルダ構造**: `.claude/agents/` 存在するか？
3. **ファイル拡張子**: `.md`になっているか？
4. **YAMLヘッダー**: `---`のみか？（`---yaml`は✗）
5. **改行**: YAMLヘッダー後に空行あるか？

## 📝 正しいファイル形式

```markdown
---
name: agent-name
description: エージェントの説明
tools: Read, Edit, Bash
---

システムプロンプト本文
```

## 🎯 呼び出し方法

```
# 方法1：明示的
「agent-nameサブエージェントを使って」

# 方法2：英語
"Use the agent-name subagent"

# 方法3：自動
（Claude Codeが自動選択）
```

## 🔧 トラブル時のコマンド

```bash
# 構造確認
ls -la .claude/agents/

# ヘッダー確認
head -n 5 .claude/agents/*.md

# 修正例（YAMLヘッダー）
sed -i '1s/---yaml/---/' .claude/agents/*.md
```

## 📋 現在のエージェント

1. **trouble-diagnosis**: エラー診断
2. **fast-fixer**: 即座修正
3. **planning**: 計画立案
4. **careful-editor**: 慎重編集
5. **review-first**: 設計レビュー

---

詳細は `/docs/CLAUDE_CODE_SUBAGENT_MANUAL.md` 参照