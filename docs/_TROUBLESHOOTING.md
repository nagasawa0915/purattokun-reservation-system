# 🚨 トラブルシューティング総合ガイド

## 📋 このガイドについて

**目的**: 「ぷらっとくんの予約システム」で発生する全ての問題の解決策を集約  
**使い方**: 症状や技術から該当する問題を見つけて、詳細ファイルで解決策を確認  
**記録ルール**: [📋 _TROUBLESHOOTING_RULES.md](./_TROUBLESHOOTING_RULES.md) を参照

---

## 🔍 症状から探す

### 🚨 表示関連の問題

#### キャラクター表示問題
- **ファイル**: [キャラクター表示問題.md](./troubleshooting/キャラクター表示問題.md)
- **症状**: ぷらっとくんが見えない、表示されない、画面に現れない
- **タグ**: `#表示` `#Spine` `#Canvas` `#初期化`
- **別名**: ぷらっとくん見えない、キャラクター消えた、purattokun not visible

### 🔄 位置・レイアウト関連の問題

#### ウィンドウリサイズ問題  
- **ファイル**: [ウィンドウリサイズ問題.md](./troubleshooting/ウィンドウリサイズ問題.md)
- **症状**: ウィンドウサイズ変更時に位置がずれる、背景と位置が合わない
- **タグ**: `#位置` `#レスポンシブ` `#同期`
- **別名**: リサイズでずれる、位置がおかしい、背景と合わない

#### Canvasサイズ変更問題
- **ファイル**: [Canvasサイズ変更問題.md](./troubleshooting/Canvasサイズ変更問題.md)  
- **症状**: Canvasのサイズが変更できない、サイズ指定が効かない
- **タグ**: `#サイズ` `#Canvas` `#CSS`
- **別名**: キャンバスサイズ、canvas size、サイズ変更不可

### ⚙️ Spine関連の問題

#### Spineライブラリ読込問題
- **ファイル**: [Spineライブラリ読込問題.md](./troubleshooting/Spineライブラリ読込問題.md)
- **症状**: Spine WebGLが読み込めない、spine is undefinedエラー
- **タグ**: `#Spine` `#ライブラリ` `#エラー`
- **別名**: spine undefined、ライブラリエラー、CDN読込失敗

#### Spineアニメーション再生問題
- **ファイル**: [Spineアニメーション再生問題.md](./troubleshooting/Spineアニメーション再生問題.md)
- **症状**: アニメーションが再生されない、静止画になる
- **タグ**: `#Spine` `#アニメーション` `#再生`
- **別名**: アニメが動かない、animation not playing、静止状態

---

## 🏷️ タグから探す

### 技術別

#### #Spine
- [キャラクター表示問題.md](./troubleshooting/キャラクター表示問題.md)
- [Spineライブラリ読込問題.md](./troubleshooting/Spineライブラリ読込問題.md) 
- [Spineアニメーション再生問題.md](./troubleshooting/Spineアニメーション再生問題.md)

#### #Canvas  
- [キャラクター表示問題.md](./troubleshooting/キャラクター表示問題.md)
- [Canvasサイズ変更問題.md](./troubleshooting/Canvasサイズ変更問題.md)

#### #CSS
- [Canvasサイズ変更問題.md](./troubleshooting/Canvasサイズ変更問題.md)
- [ウィンドウリサイズ問題.md](./troubleshooting/ウィンドウリサイズ問題.md)

#### #レスポンシブ
- [ウィンドウリサイズ問題.md](./troubleshooting/ウィンドウリサイズ問題.md)

### 症状別

#### #表示
- [キャラクター表示問題.md](./troubleshooting/キャラクター表示問題.md)

#### #位置
- [ウィンドウリサイズ問題.md](./troubleshooting/ウィンドウリサイズ問題.md)

#### #サイズ
- [Canvasサイズ変更問題.md](./troubleshooting/Canvasサイズ変更問題.md)

#### #エラー
- [Spineライブラリ読込問題.md](./troubleshooting/Spineライブラリ読込問題.md)

---

## 🚧 未解決問題

現在、以下の問題が未解決または部分解決の状態です：

### 🟡 部分解決
*(該当する問題が発見され次第、ここに追加されます)*

### 🔴 未解決  
*(該当する問題が発見され次第、ここに追加されます)*

---

## 🔍 キーワード検索ガイド

よく使われる検索キーワードと対応する問題：

### 「見えない」「表示されない」「消えた」
→ [キャラクター表示問題.md](./troubleshooting/キャラクター表示問題.md)

### 「ずれる」「位置がおかしい」「合わない」  
→ [ウィンドウリサイズ問題.md](./troubleshooting/ウィンドウリサイズ問題.md)

### 「サイズ」「大きさ」「変更できない」
→ [Canvasサイズ変更問題.md](./troubleshooting/Canvasサイズ変更問題.md)

### 「エラー」「undefined」「読み込み」
→ [Spineライブラリ読込問題.md](./troubleshooting/Spineライブラリ読込問題.md)

### 「動かない」「アニメーション」「静止」
→ [Spineアニメーション再生問題.md](./troubleshooting/Spineアニメーション再生問題.md)

---

## 📝 新しい問題の記録方法

### 1. 既存の問題から探す
上記のリストとタグから、似た問題がないか確認

### 2. 該当する問題がない場合
新しいファイルを `troubleshooting/` フォルダに作成

### 3. 記録ルールに従う
[📋 _TROUBLESHOOTING_RULES.md](./_TROUBLESHOOTING_RULES.md) の形式で記録

### 4. この目次を更新
新しい問題ファイルを作成したら、この目次にも追加

---

## 🚀 緊急時の対応

### 即座に解決したい場合
1. **症状から探す**セクションで最も近い問題を選択
2. 該当ファイルの「⚡ 有効な解決策・回避策」を実行
3. 解決しない場合は「📝 試行錯誤の履歴」を参照

### 解決策がない場合
1. 問題の詳細を記録
2. 試した方法と結果を記録  
3. [📋 _TROUBLESHOOTING_RULES.md](./_TROUBLESHOOTING_RULES.md) に従って新規ファイル作成

---

## 🔗 関連ドキュメント

| 目的 | ドキュメント |
|------|-------------|
| **記録ルール** | [📋 _TROUBLESHOOTING_RULES.md](./_TROUBLESHOOTING_RULES.md) |
| **日常的な開発** | [📘 ../CLAUDE.md](../CLAUDE.md) |
| **技術詳細** | [📖 DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) |
| **アーキテクチャ** | [🏛️ ARCHITECTURE_NOTES.md](./ARCHITECTURE_NOTES.md) |

---

**💡 ヒント**: 問題が解決したら、必ず該当するファイルに解決方法を記録してください。あなたの解決策が他の人の時間を節約します。