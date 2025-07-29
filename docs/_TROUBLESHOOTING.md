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

#### 編集モード位置ずれ問題
- **ファイル**: [編集モード位置ずれ問題.md](./troubleshooting/編集モード位置ずれ問題.md)
- **症状**: 編集モードでキャラクターがいない場所に枠が出る
- **タグ**: `#位置` `#レイヤー` `#編集システム` `#Canvas`
- **別名**: 編集モードで枠がずれる、キャラクター編集で違う場所に枠が出る、edit mode position mismatch

#### 編集モードキャラクターサイズ問題
- **ファイル**: [編集モードキャラクターサイズ問題.md](./troubleshooting/編集モードキャラクターサイズ問題.md)
- **症状**: 編集モードに入るとキャラクターが小さくなる、編集時にサイズが縮小
- **タグ**: `#編集システム` `#サイズ` `#Canvas要素` `#ラッパー` `#CSS`
- **別名**: 編集モードでキャラクターが小さくなる、キャラクター縮小問題、編集時サイズ変更、character size issue in edit mode

#### 確認パネル画面外問題
- **ファイル**: [確認パネル画面外問題.md](./troubleshooting/確認パネル画面外問題.md)
- **症状**: 「編集を確定しますか？」パネルが画面外に出て見えない、画面の下に消える
- **タグ**: `#確認パネル` `#画面外` `#位置制御` `#localStorage` `#UI`
- **別名**: 確認パネルが消える、確認パネルが見えない、確認パネルが画面下に行く、confirm panel out of screen、編集確認パネル位置問題

#### Spine配置システム編集UI問題
- **ファイル**: [Spine配置システム編集UI問題.md](./troubleshooting/Spine配置システム編集UI問題.md)
- **症状**: リサイズハンドルが表示されない、ハンドルがキャラクターから離れる
- **タグ**: `#編集システム` `#リサイズハンドル` `#Canvas要素` `#UI`
- **別名**: リサイズハンドル表示されない、編集UIが機能しない、ハンドルが遠い、resize handle not working

#### Spineアニメーション再生問題
- **ファイル**: [Spineアニメーション再生問題.md](./troubleshooting/Spineアニメーション再生問題.md)
- **症状**: Canvas全体でクリック判定、キャラクター外をクリックしても反応
- **タグ**: `#Spine` `#アニメーション` `#クリック判定` `#Canvas` `#UI`
- **別名**: クリック判定改善、Canvas全体クリック問題、キャラクター画像位置でのクリック、animation not playing

#### Canvas表示範囲編集ドラッグ問題
- **ファイル**: [Canvas表示範囲編集ドラッグ問題.md](./troubleshooting/Canvas表示範囲編集ドラッグ問題.md)
- **症状**: 表示範囲編集でCanvasをドラッグすると左上に瞬間移動する
- **タグ**: `#編集システム` `#Canvas` `#ドラッグ` `#座標` `#UI`
- **別名**: Canvas左上瞬間移動、オレンジ枠瞬間移動、canvas drag jump issue

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
- [編集モード位置ずれ問題.md](./troubleshooting/編集モード位置ずれ問題.md)
- [編集モードキャラクターサイズ問題.md](./troubleshooting/編集モードキャラクターサイズ問題.md)
- [Canvas表示範囲編集ドラッグ問題.md](./troubleshooting/Canvas表示範囲編集ドラッグ問題.md)

#### #CSS
- [Canvasサイズ変更問題.md](./troubleshooting/Canvasサイズ変更問題.md)
- [ウィンドウリサイズ問題.md](./troubleshooting/ウィンドウリサイズ問題.md)
- [編集モードキャラクターサイズ問題.md](./troubleshooting/編集モードキャラクターサイズ問題.md)

#### #レスポンシブ
- [ウィンドウリサイズ問題.md](./troubleshooting/ウィンドウリサイズ問題.md)

#### #編集システム
- [編集モード位置ずれ問題.md](./troubleshooting/編集モード位置ずれ問題.md)
- [編集モードキャラクターサイズ問題.md](./troubleshooting/編集モードキャラクターサイズ問題.md)
- [Spine配置システム編集UI問題.md](./troubleshooting/Spine配置システム編集UI問題.md)
- [Canvas表示範囲編集ドラッグ問題.md](./troubleshooting/Canvas表示範囲編集ドラッグ問題.md)

#### #リサイズハンドル
- [Spine配置システム編集UI問題.md](./troubleshooting/Spine配置システム編集UI問題.md)

#### #UI
- [Spine配置システム編集UI問題.md](./troubleshooting/Spine配置システム編集UI問題.md)
- [Canvas表示範囲編集ドラッグ問題.md](./troubleshooting/Canvas表示範囲編集ドラッグ問題.md)
- [確認パネル画面外問題.md](./troubleshooting/確認パネル画面外問題.md)

#### #ドラッグ
- [Canvas表示範囲編集ドラッグ問題.md](./troubleshooting/Canvas表示範囲編集ドラッグ問題.md)

#### #座標
- [Canvas表示範囲編集ドラッグ問題.md](./troubleshooting/Canvas表示範囲編集ドラッグ問題.md)

#### #ラッパー
- [編集モードキャラクターサイズ問題.md](./troubleshooting/編集モードキャラクターサイズ問題.md)

#### #localStorage
- [確認パネル画面外問題.md](./troubleshooting/確認パネル画面外問題.md)

#### #画面外
- [確認パネル画面外問題.md](./troubleshooting/確認パネル画面外問題.md)

#### #位置制御
- [確認パネル画面外問題.md](./troubleshooting/確認パネル画面外問題.md)

#### #確認パネル
- [確認パネル画面外問題.md](./troubleshooting/確認パネル画面外問題.md)

#### #レイヤー
- [編集モード位置ずれ問題.md](./troubleshooting/編集モード位置ずれ問題.md)

### 症状別

#### #表示
- [キャラクター表示問題.md](./troubleshooting/キャラクター表示問題.md)

#### #位置
- [ウィンドウリサイズ問題.md](./troubleshooting/ウィンドウリサイズ問題.md)
- [編集モード位置ずれ問題.md](./troubleshooting/編集モード位置ずれ問題.md)

#### #サイズ
- [Canvasサイズ変更問題.md](./troubleshooting/Canvasサイズ変更問題.md)
- [編集モードキャラクターサイズ問題.md](./troubleshooting/編集モードキャラクターサイズ問題.md)

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
→ [編集モード位置ずれ問題.md](./troubleshooting/編集モード位置ずれ問題.md)

### 「サイズ」「大きさ」「変更できない」
→ [Canvasサイズ変更問題.md](./troubleshooting/Canvasサイズ変更問題.md)

### 「小さくなる」「縮小」「編集モードでサイズが変わる」
→ [編集モードキャラクターサイズ問題.md](./troubleshooting/編集モードキャラクターサイズ問題.md)

### 「エラー」「undefined」「読み込み」
→ [Spineライブラリ読込問題.md](./troubleshooting/Spineライブラリ読込問題.md)

### 「動かない」「アニメーション」「静止」「クリック判定」
→ [Spineアニメーション再生問題.md](./troubleshooting/Spineアニメーション再生問題.md)

### 「編集モード」「枠がずれる」「違う場所」
→ [編集モード位置ずれ問題.md](./troubleshooting/編集モード位置ずれ問題.md)

### 「リサイズハンドル」「ハンドル表示されない」「ハンドルが遠い」「編集モード切り替えでハンドル消失」
→ [Spine配置システム編集UI問題.md](./troubleshooting/Spine配置システム編集UI問題.md)

### 「ドラッグ」「左上に移動」「瞬間移動」「オレンジ枠」
→ [Canvas表示範囲編集ドラッグ問題.md](./troubleshooting/Canvas表示範囲編集ドラッグ問題.md)

### 「確認パネル」「消える」「見えない」「画面外」「下に行く」
→ [確認パネル画面外問題.md](./troubleshooting/確認パネル画面外問題.md)

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