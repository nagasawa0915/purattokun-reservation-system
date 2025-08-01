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

#### キャラクター歪み問題
- **ファイル**: [キャラクター歪み問題.md](./troubleshooting/キャラクター歪み問題.md)
- **症状**: キャラクターが縦横に歪んで表示される、aspect-ratio設定による変形
- **タグ**: `#歪み` `#Canvas` `#CSS` `#aspect-ratio` `#レスポンシブ` `#編集システム`
- **別名**: キャラクター歪んでる、縦横歪み、縦も横も同数値、character distortion、canvas distortion

### 🔄 位置・レイアウト関連の問題

#### レスポンシブ版位置ズレ問題
- **ファイル**: [レスポンシブ版位置ズレ問題.md](./troubleshooting/レスポンシブ版位置ズレ問題.md)
- **症状**: デスクトップ版でキャラクター位置がズレる、モバイル版は正常
- **タグ**: `#位置` `#レスポンシブ` `#CSS` `#Canvas` `#width` `#競合`
- **別名**: PC版でずれる、デスクトップ版位置異常、レスポンシブ不一致

#### パッケージ出力位置ズレ問題
- **ファイル**: [パッケージ出力位置ズレ問題.md](./troubleshooting/パッケージ出力位置ズレ問題.md)
- **症状**: パッケージ出力後に「登場時は正常、途中からズレる」位置・スケール問題
- **タグ**: `#位置` `#パッケージ出力` `#CSS` `#HTML設定システム` `#商用制作ツール`
- **別名**: パッケージ出力後位置ずれ、ZIP出力後位置異常、登場時正常途中からズレ、package output position issue

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

#### 編集モード位置保存問題
- **ファイル**: [編集モード位置保存問題.md](./troubleshooting/編集モード位置保存問題.md)
- **症状**: 編集→保存→リロード時に位置が維持されない、localStorage復元失敗
- **タグ**: `#編集システム` `#localStorage` `#位置` `#永続化` `#HTML設定システム`
- **別名**: 編集位置保存失敗、リロード後位置リセット、localStorage復元問題、position save failure

#### 確認パネル画面外問題
- **ファイル**: [確認パネル画面外問題.md](./troubleshooting/確認パネル画面外問題.md)
- **症状**: 「編集を確定しますか？」パネルが画面外に出て見えない、画面の下に消える
- **タグ**: `#確認パネル` `#画面外` `#位置制御` `#localStorage` `#UI`
- **別名**: 確認パネルが消える、確認パネルが見えない、確認パネルが画面下に行く、confirm panel out of screen、編集確認パネル位置問題

#### 確認パネル位置固定問題
- **ファイル**: [確認パネル位置固定問題.md](./troubleshooting/確認パネル位置固定問題.md)
- **症状**: 確認パネルが画面下部に固定され、ドラッグしても戻ってしまう
- **タグ**: `#確認パネル` `#位置制御` `#CSS` `#JavaScript` `#UI`
- **別名**: 確認パネルが下に固定、確認パネルがドラッグしても戻る、確認パネルが中央に表示されない、confirm panel stuck at bottom、編集確認パネル位置固定問題


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

#### スケール機能問題
- **ファイル**: [スケール機能問題.md](./troubleshooting/スケール機能問題.md)
- **症状**: スケール調整が効かない、数値入力できない、debugScale関数エラー
- **タグ**: `#編集システム` `#スケール` `#数値入力` `#ドラッグ` `#transform` `#座標系` `#最小限実装版`
- **別名**: スケールが効かない、debugScale is not defined、スケールバー動かない、数値入力できない、scale function not working、スケール調整問題、transform scale issue

#### 複数キャラクター対応実装記録
- **ファイル**: [複数キャラクター対応実装記録.md](./troubleshooting/複数キャラクター対応実装記録.md)
- **症状**: 複数キャラクター編集、レイヤー順序制御、ドラッグハンドル位置ずれ
- **タグ**: `#編集システム` `#複数キャラクター` `#レイヤー制御` `#ドラッグ&ドロップ` `#z-index` `#位置ずれ修正`
- **別名**: 複数キャラクター編集、キャラクター選択機能、レイヤー順序制御、multiple character support、character layer management、drag and drop reordering

#### v2.0システム初期化問題
- **ファイル**: [v2.0システム初期化問題.md](./troubleshooting/v2.0システム初期化問題.md)
- **症状**: v2.0システムでキャラクター移動・選択機能が動作しない、編集モード未開始
- **タグ**: `#v2.0システム` `#初期化` `#編集モード` `#startEditMode` `#キャラクター選択` `#ドラッグ移動` `#解決済み`
- **別名**: v2.0編集モード開始しない、キャラクター選択効かない、ドラッグ移動動かない、v2 system initialization issue、edit mode not started

### 🔧 機能・UI関連の問題

#### ドラッグハンドル診断システム
- **ファイル**: [ドラッグハンドル診断システム.md](./troubleshooting/ドラッグハンドル診断システム.md)
- **症状**: ハンドルをクリックしてもドラッグが開始されない、ハンドルが表示されない、イベントが効かない
- **タグ**: `#診断システム` `#ドラッグハンドル` `#編集システム` `#イベント` `#z-index` `#クリック判定`
- **別名**: ハンドルクリック問題、ドラッグ開始されない、handle click not working、drag handle issues、ハンドル診断ツール

#### Spine編集システム完全実装記録
- **ファイル**: [Spine編集システム完全実装記録.md](./troubleshooting/Spine編集システム完全実装記録.md)
- **症状**: 完全実装達成による成功事例記録
- **タグ**: `#成功事例` `#完全実装` `#v2.0システム` `#軽量化` `#レイヤー管理` `#キーボード制御` `#ドラッグ移動` `#ドラッグ&ドロップ` `#基本ボタン機能` `#編集状態視覚化`
- **別名**: v2.0システム完全実装、編集システム成功記録、軽量システム実装、spine positioning v2 success、Phase 1-2実装完了、ドラッグ&ドロップレイヤー並び替え

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
- [キャラクター歪み問題.md](./troubleshooting/キャラクター歪み問題.md)
- [Canvasサイズ変更問題.md](./troubleshooting/Canvasサイズ変更問題.md)
- [編集モード位置ずれ問題.md](./troubleshooting/編集モード位置ずれ問題.md)
- [編集モードキャラクターサイズ問題.md](./troubleshooting/編集モードキャラクターサイズ問題.md)
- [Canvas表示範囲編集ドラッグ問題.md](./troubleshooting/Canvas表示範囲編集ドラッグ問題.md)

#### #CSS
- [キャラクター歪み問題.md](./troubleshooting/キャラクター歪み問題.md)
- [Canvasサイズ変更問題.md](./troubleshooting/Canvasサイズ変更問題.md)
- [ウィンドウリサイズ問題.md](./troubleshooting/ウィンドウリサイズ問題.md)
- [編集モードキャラクターサイズ問題.md](./troubleshooting/編集モードキャラクターサイズ問題.md)
- [パッケージ出力位置ズレ問題.md](./troubleshooting/パッケージ出力位置ズレ問題.md)

#### #レスポンシブ
- [キャラクター歪み問題.md](./troubleshooting/キャラクター歪み問題.md)
- [ウィンドウリサイズ問題.md](./troubleshooting/ウィンドウリサイズ問題.md)

#### #歪み
- [キャラクター歪み問題.md](./troubleshooting/キャラクター歪み問題.md)

#### #aspect-ratio
- [キャラクター歪み問題.md](./troubleshooting/キャラクター歪み問題.md)

#### #編集システム
- [キャラクター歪み問題.md](./troubleshooting/キャラクター歪み問題.md)
- [編集モード位置ずれ問題.md](./troubleshooting/編集モード位置ずれ問題.md)
- [編集モードキャラクターサイズ問題.md](./troubleshooting/編集モードキャラクターサイズ問題.md)
- [編集モード位置保存問題.md](./troubleshooting/編集モード位置保存問題.md)
- [Spine配置システム編集UI問題.md](./troubleshooting/Spine配置システム編集UI問題.md)
- [Canvas表示範囲編集ドラッグ問題.md](./troubleshooting/Canvas表示範囲編集ドラッグ問題.md)
- [スケール機能問題.md](./troubleshooting/スケール機能問題.md)
- [複数キャラクター対応実装記録.md](./troubleshooting/複数キャラクター対応実装記録.md)
- [ドラッグハンドル診断システム.md](./troubleshooting/ドラッグハンドル診断システム.md)
- [Spine編集システム完全実装記録.md](./troubleshooting/Spine編集システム完全実装記録.md)
- [v2.0システム初期化問題.md](./troubleshooting/v2.0システム初期化問題.md)

#### #リサイズハンドル
- [Spine配置システム編集UI問題.md](./troubleshooting/Spine配置システム編集UI問題.md)

#### #UI
- [Spine配置システム編集UI問題.md](./troubleshooting/Spine配置システム編集UI問題.md)
- [Canvas表示範囲編集ドラッグ問題.md](./troubleshooting/Canvas表示範囲編集ドラッグ問題.md)
- [確認パネル画面外問題.md](./troubleshooting/確認パネル画面外問題.md)

#### #ドラッグ
- [Canvas表示範囲編集ドラッグ問題.md](./troubleshooting/Canvas表示範囲編集ドラッグ問題.md)

#### #ドラッグハンドル
- [ドラッグハンドル診断システム.md](./troubleshooting/ドラッグハンドル診断システム.md)

#### #診断システム
- [ドラッグハンドル診断システム.md](./troubleshooting/ドラッグハンドル診断システム.md)

#### #イベント
- [ドラッグハンドル診断システム.md](./troubleshooting/ドラッグハンドル診断システム.md)

#### #クリック判定
- [ドラッグハンドル診断システム.md](./troubleshooting/ドラッグハンドル診断システム.md)

#### #座標
- [Canvas表示範囲編集ドラッグ問題.md](./troubleshooting/Canvas表示範囲編集ドラッグ問題.md)

#### #ラッパー
- [編集モードキャラクターサイズ問題.md](./troubleshooting/編集モードキャラクターサイズ問題.md)

#### #localStorage
- [確認パネル画面外問題.md](./troubleshooting/確認パネル画面外問題.md)
- [編集モード位置保存問題.md](./troubleshooting/編集モード位置保存問題.md)

#### #永続化
- [編集モード位置保存問題.md](./troubleshooting/編集モード位置保存問題.md)

#### #HTML設定システム
- [編集モード位置保存問題.md](./troubleshooting/編集モード位置保存問題.md)
- [パッケージ出力位置ズレ問題.md](./troubleshooting/パッケージ出力位置ズレ問題.md)

#### #パッケージ出力
- [パッケージ出力位置ズレ問題.md](./troubleshooting/パッケージ出力位置ズレ問題.md)

#### #商用制作ツール
- [パッケージ出力位置ズレ問題.md](./troubleshooting/パッケージ出力位置ズレ問題.md)

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
- [パッケージ出力位置ズレ問題.md](./troubleshooting/パッケージ出力位置ズレ問題.md)

#### #サイズ
- [Canvasサイズ変更問題.md](./troubleshooting/Canvasサイズ変更問題.md)
- [編集モードキャラクターサイズ問題.md](./troubleshooting/編集モードキャラクターサイズ問題.md)

#### #エラー
- [Spineライブラリ読込問題.md](./troubleshooting/Spineライブラリ読込問題.md)

#### #v2.0システム
- [v2.0システム初期化問題.md](./troubleshooting/v2.0システム初期化問題.md)

#### #初期化
- [v2.0システム初期化問題.md](./troubleshooting/v2.0システム初期化問題.md)

#### #startEditMode
- [v2.0システム初期化問題.md](./troubleshooting/v2.0システム初期化問題.md)

#### #キャラクター選択
- [v2.0システム初期化問題.md](./troubleshooting/v2.0システム初期化問題.md)

#### #ドラッグ移動
- [v2.0システム初期化問題.md](./troubleshooting/v2.0システム初期化問題.md)

#### #解決済み
- [v2.0システム初期化問題.md](./troubleshooting/v2.0システム初期化問題.md)

---

## 🚧 未解決問題

現在、以下の問題が未解決または部分解決の状態です：

### 🟡 部分解決
*(該当する問題が発見され次第、ここに追加されます)*

### 🔴 未解決  

#### 編集モードキャラクターサイズ問題（再発）
- **ファイル**: [編集モードキャラクターサイズ問題.md](./troubleshooting/編集モードキャラクターサイズ問題.md)
- **症状**: 編集モード初期表示でキャラクターが小さくなる（過去の解決策が効果なし）
- **最終更新**: 2025-01-29
- **試行回数**: 3回（全て失敗）

#### 編集モード位置保存問題
- **ファイル**: [編集モード位置保存問題.md](./troubleshooting/編集モード位置保存問題.md)
- **症状**: 編集→保存→リロード時に位置が維持されない
- **最終更新**: 2025-01-29
- **試行回数**: 4回（全て失敗）
- **緊急度**: 高（編集システムの基本機能が使用不可）

---

## 🔍 キーワード検索ガイド

よく使われる検索キーワードと対応する問題：

### 「見えない」「表示されない」「消えた」
→ [キャラクター表示問題.md](./troubleshooting/キャラクター表示問題.md)

### 「歪んでる」「縦横歪み」「縦も横も同数値」「aspect-ratio」「変形」
→ [キャラクター歪み問題.md](./troubleshooting/キャラクター歪み問題.md)

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

### 「確認パネル」「固定」「ドラッグしても戻る」「中央に表示されない」
→ [確認パネル位置固定問題.md](./troubleshooting/確認パネル位置固定問題.md)

### 「位置保存」「リロード後」「localStorage」「復元失敗」「保存されない」
→ [編集モード位置保存問題.md](./troubleshooting/編集モード位置保存問題.md)

### 「スケール」「効かない」「数値入力」「debugScale」「動かない」「スケールバー」
→ [スケール機能問題.md](./troubleshooting/スケール機能問題.md)

### 「複数キャラクター」「キャラクター選択」「レイヤー制御」「ドラッグ&ドロップ」「z-index」「並び替え」
→ [複数キャラクター対応実装記録.md](./troubleshooting/複数キャラクター対応実装記録.md)

### 「ハンドル」「ドラッグできない」「クリックできない」「ハンドル診断」「イベント効かない」
→ [ドラッグハンドル診断システム.md](./troubleshooting/ドラッグハンドル診断システム.md)

### 「完全実装」「v2.0」「軽量システム」「成功事例」「実装記録」「システム完成」
→ [Spine編集システム完全実装記録.md](./troubleshooting/Spine編集システム完全実装記録.md)

### 「パッケージ出力」「ZIP出力」「登場時正常途中からズレ」「パッケージ出力後位置ずれ」「商用制作ツール」
→ [パッケージ出力位置ズレ問題.md](./troubleshooting/パッケージ出力位置ズレ問題.md)

### 「v2.0」「編集モード開始しない」「キャラクター選択効かない」「ドラッグ移動動かない」「初期化問題」「startEditMode」
→ [v2.0システム初期化問題.md](./troubleshooting/v2.0システム初期化問題.md)

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