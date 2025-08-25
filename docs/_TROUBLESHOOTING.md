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

#### 座標関連問題（統合版）
- **ファイル**: [座標関連問題.md](./troubleshooting/coordinate-problems.md)
- **症状**: 位置ズレ、座標系問題、マウスとキャラクターの動きが逆、DPR補正問題
- **対象**: Web版、デスクトップv2、デスクトップv3、高解像度ディスプレイ
- **タグ**: `#位置` `#座標系` `#DPR補正` `#Y軸反転` `#統合解決策` `#環境別対応`
- **別名**: レスポンシブ版位置ズレ、ウィンドウリサイズ問題、Spine座標系問題、WebGL座標系問題、PC版でずれる、デスクトップ版位置異常、マウス動作逆転、高解像度ディスプレイ問題、座標変換エラー

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

#### 編集前バウンディングボックス表示問題
- **ファイル**: [編集前バウンディングボックス表示問題.md](./troubleshooting/編集前バウンディングボックス表示問題.md)
- **症状**: 編集開始ボタンを押す前から「赤い点線のバウンディングボックス」が表示される
- **タグ**: `#編集システム` `#バウンディングボックス` `#境界表示` `#初期化` `#UI` `#Spine` `#bounds-integration`
- **別名**: 編集前の赤枠表示、初期化時境界表示、bounding box auto display、編集開始前の赤い枠、自動境界表示問題

#### 編集ボタンクリック時瞬間移動問題
- **ファイル**: [編集ボタンクリック時瞬間移動問題.md](./troubleshooting/編集ボタンクリック時瞬間移動問題.md)
- **症状**: 編集ボタンクリック時にキャラクター（purattokun-canvas）が165px右に瞬間移動、F12開発者ツールの有無で発生条件が変わる
- **タグ**: `#編集システム` `#瞬間移動` `#座標系` `#F12依存` `#レイアウトレース` `#purattokun固有` `#spine-edit-core` `#完全解決`
- **別名**: 編集開始時瞬間移動、165px右移動、F12依存瞬間移動、レイアウト確定レース、enterEditMode問題、座標強制変更問題


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

### 🔧 機能・UI関連の問題

#### ドラッグハンドル診断システム
- **ファイル**: [ドラッグハンドル診断システム.md](./troubleshooting/ドラッグハンドル診断システム.md)
- **症状**: ハンドルをクリックしてもドラッグが開始されない、ハンドルが表示されない、イベントが効かない
- **タグ**: `#診断システム` `#ドラッグハンドル` `#編集システム` `#イベント` `#z-index` `#クリック判定`
- **別名**: ハンドルクリック問題、ドラッグ開始されない、handle click not working、drag handle issues、ハンドル診断ツール

#### Spine編集システム完全実装記録
- **ファイル**: [Spine編集システム完全実装記録.md](./troubleshooting/Spine編集システム完全実装記録.md)
- **症状**: 完全実装達成による成功事例記録
- **タグ**: `#成功事例` `#完全実装` `#v2.0システム` `#軽量化` `#レイヤー管理` `#キーボード制御` `#ドラッグ移動`
- **別名**: v2.0システム完全実装、編集システム成功記録、軽量システム実装、spine positioning v2 success

#### バウンディングボックス編集システム実装記録
- **ファイル**: [バウンディングボックス編集システム実装記録.md](./troubleshooting/バウンディングボックス編集システム実装記録.md)
- **症状**: バウンディングボックス編集の保存・キャンセル機能実装成功、編集ボタン問題解決
- **タグ**: `#成功事例` `#バウンディングボックス` `#編集システム` `#保存機能` `#localStorage` `#UI改善` `#関数名修正`
- **別名**: bbox編集実装、保存キャンセル機能、編集ボタン修正、bounding box edit system、座標系スワップ対応

#### パッケージ出力機能完全実装記録
- **ファイル**: [パッケージ出力機能完全実装記録.md](./troubleshooting/パッケージ出力機能完全実装記録.md)
- **症状**: お客様納品用完全パッケージ生成システムの実装成功、Spineアニメーション表示問題解決、editMode依存問題解決
- **タグ**: `#成功事例` `#パッケージ出力` `#ZIP生成` `#HTML固定化` `#CDN依存排除` `#Spineアニメーション` `#商用制作ツール` `#完全実装`
- **別名**: package output system、ZIP生成機能、HTML固定化システム、CDNローカル化、お客様納品パッケージ、商用パッケージ出力

#### nezumi編集機能実装成功記録
- **ファイル**: [nezumi編集機能実装成功記録.md](./troubleshooting/nezumi編集機能実装成功記録.md)
- **症状**: nezumi編集機能の完全実装成功、v3.0 Phase 2モジュール化システムの安定稼働実証、4001行→8モジュールの大規模ファイル分割成功
- **タグ**: `#成功事例` `#nezumi` `#複数キャラクター` `#v3.0システム` `#モジュール化` `#Phase2` `#ドラッグ移動` `#位置編集` `#キャラクター選択` `#ファイル分割`
- **別名**: nezumi編集成功、ネズミ編集機能、nezumi character editing、v3.0 Phase2成功事例、モジュール化システム成功、4001行→8モジュール成功、大規模ファイル分割成功

#### PackageExportSystem読み込み問題
- **ファイル**: [PackageExportSystem読み込み問題.md](./troubleshooting/PackageExportSystem読み込み問題.md)
- **症状**: 編集モードで「📦 パッケージ出力」ボタンクリック時に「PackageExportSystemが見つかりません」エラー
- **タグ**: `#未解決問題` `#パッケージ出力` `#読み込み` `#初期化` `#モジュール依存` `#スコープ問題` `#継続調査必要`
- **別名**: PackageExportSystem undefined、パッケージ出力エラー、モジュール読み込み失敗、package export system not found、継続調査中問題

#### 境界ボックス精密クリック判定実装成功記録
- **ファイル**: [境界ボックス精密クリック判定実装成功記録.md](./troubleshooting/境界ボックス精密クリック判定実装成功記録.md)
- **症状**: 境界ボックス視覚化の座標ずれ問題の完全解決、34頂点による精密クリック判定の実装成功、統一座標システム完全適用
- **タグ**: `#成功事例` `#境界ボックス` `#クリック判定` `#統一座標システム` `#精密判定` `#汎用性確保` `#フォールバック処理無効化` `#34頂点判定` `#完全解決`
- **別名**: 境界ボックス精密クリック判定、34頂点境界判定、統一座標システム完全適用、フォールバック処理無効化、bounding box precision click detection、unified coordinate system implementation

### ⚙️ Spine関連の問題

#### Spineライブラリ読込問題
- **ファイル**: [Spineライブラリ読込問題.md](./troubleshooting/Spineライブラリ読込問題.md)
- **症状**: Spine WebGLが読み込めない、spine is undefinedエラー
- **タグ**: `#Spine` `#ライブラリ` `#エラー`
- **別名**: spine undefined、ライブラリエラー、CDN読込失敗

#### Spine Editor Desktop v2.0パフォーマンス問題
- **ファイル**: [Spine Editor Desktop v2.0パフォーマンス問題.md](./troubleshooting/Spine Editor Desktop v2.0パフォーマンス問題.md)
- **症状**: WebGL問題継続、行数制限未達成、設計哲学との矛盾
- **タグ**: `#デスクトップアプリ` `#パフォーマンス` `#Spine WebGL` `#アーキテクチャ` `#重量システム` `#未解決問題`
- **別名**: v2.0パフォーマンス問題、デスクトップアプリ課題、WebGL失敗問題、設計哲学違反、軽量化課題

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

#### #ウィンドウサイズ依存
- [ウィンドウリサイズ問題.md](./troubleshooting/ウィンドウリサイズ問題.md)

#### #v2.0編集システム
- [ウィンドウリサイズ問題.md](./troubleshooting/ウィンドウリサイズ問題.md)

#### #編集システム
- [編集モード位置ずれ問題.md](./troubleshooting/編集モード位置ずれ問題.md)
- [編集モードキャラクターサイズ問題.md](./troubleshooting/編集モードキャラクターサイズ問題.md)
- [編集モード位置保存問題.md](./troubleshooting/編集モード位置保存問題.md)
- [Spine配置システム編集UI問題.md](./troubleshooting/Spine配置システム編集UI問題.md)
- [Canvas表示範囲編集ドラッグ問題.md](./troubleshooting/Canvas表示範囲編集ドラッグ問題.md)
- [スケール機能問題.md](./troubleshooting/スケール機能問題.md)
- [複数キャラクター対応実装記録.md](./troubleshooting/複数キャラクター対応実装記録.md)
- [ドラッグハンドル診断システム.md](./troubleshooting/ドラッグハンドル診断システム.md)
- [Spine編集システム完全実装記録.md](./troubleshooting/Spine編集システム完全実装記録.md)
- [バウンディングボックス編集システム実装記録.md](./troubleshooting/バウンディングボックス編集システム実装記録.md)

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
- [境界ボックス精密クリック判定実装成功記録.md](./troubleshooting/境界ボックス精密クリック判定実装成功記録.md)

#### #座標
- [Canvas表示範囲編集ドラッグ問題.md](./troubleshooting/Canvas表示範囲編集ドラッグ問題.md)

#### #ラッパー
- [編集モードキャラクターサイズ問題.md](./troubleshooting/編集モードキャラクターサイズ問題.md)

#### #localStorage
- [確認パネル画面外問題.md](./troubleshooting/確認パネル画面外問題.md)
- [編集モード位置保存問題.md](./troubleshooting/編集モード位置保存問題.md)
- [バウンディングボックス編集システム実装記録.md](./troubleshooting/バウンディングボックス編集システム実装記録.md)

#### #永続化
- [編集モード位置保存問題.md](./troubleshooting/編集モード位置保存問題.md)

#### #HTML設定システム
- [編集モード位置保存問題.md](./troubleshooting/編集モード位置保存問題.md)

#### #画面外
- [確認パネル画面外問題.md](./troubleshooting/確認パネル画面外問題.md)

#### #位置制御
- [確認パネル画面外問題.md](./troubleshooting/確認パネル画面外問題.md)

#### #確認パネル
- [確認パネル画面外問題.md](./troubleshooting/確認パネル画面外問題.md)

#### #レイヤー
- [編集モード位置ずれ問題.md](./troubleshooting/編集モード位置ずれ問題.md)

#### #バウンディングボックス
- [バウンディングボックス編集システム実装記録.md](./troubleshooting/バウンディングボックス編集システム実装記録.md)
- [編集前バウンディングボックス表示問題.md](./troubleshooting/編集前バウンディングボックス表示問題.md)
- [境界ボックス精密クリック判定実装成功記録.md](./troubleshooting/境界ボックス精密クリック判定実装成功記録.md)

#### #境界表示
- [編集前バウンディングボックス表示問題.md](./troubleshooting/編集前バウンディングボックス表示問題.md)

#### #bounds-integration
- [編集前バウンディングボックス表示問題.md](./troubleshooting/編集前バウンディングボックス表示問題.md)

#### #瞬間移動
- [編集ボタンクリック時瞬間移動問題.md](./troubleshooting/編集ボタンクリック時瞬間移動問題.md)

#### #F12依存
- [編集ボタンクリック時瞬間移動問題.md](./troubleshooting/編集ボタンクリック時瞬間移動問題.md)

#### #レイアウトレース
- [編集ボタンクリック時瞬間移動問題.md](./troubleshooting/編集ボタンクリック時瞬間移動問題.md)

#### #purattokun固有
- [編集ボタンクリック時瞬間移動問題.md](./troubleshooting/編集ボタンクリック時瞬間移動問題.md)

#### #spine-edit-core
- [編集ボタンクリック時瞬間移動問題.md](./troubleshooting/編集ボタンクリック時瞬間移動問題.md)

#### #保存機能
- [バウンディングボックス編集システム実装記録.md](./troubleshooting/バウンディングボックス編集システム実装記録.md)

#### #UI改善
- [バウンディングボックス編集システム実装記録.md](./troubleshooting/バウンディングボックス編集システム実装記録.md)

#### #関数名修正
- [バウンディングボックス編集システム実装記録.md](./troubleshooting/バウンディングボックス編集システム実装記録.md)

#### #成功事例
- [Spine編集システム完全実装記録.md](./troubleshooting/Spine編集システム完全実装記録.md)
- [バウンディングボックス編集システム実装記録.md](./troubleshooting/バウンディングボックス編集システム実装記録.md)
- [パッケージ出力機能完全実装記録.md](./troubleshooting/パッケージ出力機能完全実装記録.md)
- [nezumi編集機能実装成功記録.md](./troubleshooting/nezumi編集機能実装成功記録.md)
- [境界ボックス精密クリック判定実装成功記録.md](./troubleshooting/境界ボックス精密クリック判定実装成功記録.md)

#### #nezumi
- [nezumi編集機能実装成功記録.md](./troubleshooting/nezumi編集機能実装成功記録.md)

#### #複数キャラクター
- [複数キャラクター対応実装記録.md](./troubleshooting/複数キャラクター対応実装記録.md)
- [nezumi編集機能実装成功記録.md](./troubleshooting/nezumi編集機能実装成功記録.md)

#### #v3.0システム
- [nezumi編集機能実装成功記録.md](./troubleshooting/nezumi編集機能実装成功記録.md)

#### #モジュール化
- [nezumi編集機能実装成功記録.md](./troubleshooting/nezumi編集機能実装成功記録.md)

#### #Phase2
- [nezumi編集機能実装成功記録.md](./troubleshooting/nezumi編集機能実装成功記録.md)

#### #ドラッグ移動
- [Canvas表示範囲編集ドラッグ問題.md](./troubleshooting/Canvas表示範囲編集ドラッグ問題.md)
- [nezumi編集機能実装成功記録.md](./troubleshooting/nezumi編集機能実装成功記録.md)

#### #位置編集
- [nezumi編集機能実装成功記録.md](./troubleshooting/nezumi編集機能実装成功記録.md)

#### #キャラクター選択
- [nezumi編集機能実装成功記録.md](./troubleshooting/nezumi編集機能実装成功記録.md)

#### #ファイル分割
- [nezumi編集機能実装成功記録.md](./troubleshooting/nezumi編集機能実装成功記録.md)

#### #パッケージ出力
- [パッケージ出力機能完全実装記録.md](./troubleshooting/パッケージ出力機能完全実装記録.md)
- [PackageExportSystem読み込み問題.md](./troubleshooting/PackageExportSystem読み込み問題.md)

#### #ZIP生成
- [パッケージ出力機能完全実装記録.md](./troubleshooting/パッケージ出力機能完全実装記録.md)

#### #HTML固定化
- [パッケージ出力機能完全実装記録.md](./troubleshooting/パッケージ出力機能完全実装記録.md)

#### #CDN依存排除
- [パッケージ出力機能完全実装記録.md](./troubleshooting/パッケージ出力機能完全実装記録.md)

#### #商用制作ツール
- [パッケージ出力機能完全実装記録.md](./troubleshooting/パッケージ出力機能完全実装記録.md)

#### #未解決問題
- [PackageExportSystem読み込み問題.md](./troubleshooting/PackageExportSystem読み込み問題.md)

#### #読み込み
- [PackageExportSystem読み込み問題.md](./troubleshooting/PackageExportSystem読み込み問題.md)

#### #初期化
- [PackageExportSystem読み込み問題.md](./troubleshooting/PackageExportSystem読み込み問題.md)

#### #モジュール依存
- [PackageExportSystem読み込み問題.md](./troubleshooting/PackageExportSystem読み込み問題.md)

#### #スコープ問題
- [PackageExportSystem読み込み問題.md](./troubleshooting/PackageExportSystem読み込み問題.md)

#### #継続調査必要
- [PackageExportSystem読み込み問題.md](./troubleshooting/PackageExportSystem読み込み問題.md)

#### #統一座標システム
- [境界ボックス精密クリック判定実装成功記録.md](./troubleshooting/境界ボックス精密クリック判定実装成功記録.md)

#### #精密判定
- [境界ボックス精密クリック判定実装成功記録.md](./troubleshooting/境界ボックス精密クリック判定実装成功記録.md)

#### #34頂点判定
- [境界ボックス精密クリック判定実装成功記録.md](./troubleshooting/境界ボックス精密クリック判定実装成功記録.md)

#### #汎用性確保
- [境界ボックス精密クリック判定実装成功記録.md](./troubleshooting/境界ボックス精密クリック判定実装成功記録.md)

#### #フォールバック処理無効化
- [境界ボックス精密クリック判定実装成功記録.md](./troubleshooting/境界ボックス精密クリック判定実装成功記録.md)

#### #完全解決
- [境界ボックス精密クリック判定実装成功記録.md](./troubleshooting/境界ボックス精密クリック判定実装成功記録.md)

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

#### PackageExportSystem読み込み問題
- **ファイル**: [PackageExportSystem読み込み問題.md](./troubleshooting/PackageExportSystem読み込み問題.md)
- **症状**: 「📦 パッケージ出力」ボタンクリック時に「PackageExportSystemが見つかりません」エラー
- **最終更新**: 2025-08-07
- **試行回数**: 3回（全て失敗）
- **緊急度**: 中（商用パッケージ出力機能が使用不可）
- **関連**: 過去に成功実装済みだが、何らかの変更により動作停止

---

## 🔍 キーワード検索ガイド

よく使われる検索キーワードと対応する問題：

### 「見えない」「表示されない」「消えた」
→ [キャラクター表示問題.md](./troubleshooting/キャラクター表示問題.md)

### 「ずれる」「位置がおかしい」「合わない」「座標系」「マウス逆転」「DPR」「高解像度」
→ [座標関連問題.md](./troubleshooting/coordinate-problems.md) ⭐**統合版**⭐
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

### 「バウンディングボックス」「保存機能」「キャンセル機能」「編集ボタン」「関数名修正」「座標系スワップ」
→ [バウンディングボックス編集システム実装記録.md](./troubleshooting/バウンディングボックス編集システム実装記録.md)

### 「パッケージ出力」「ZIP生成」「HTML固定化」「CDN依存排除」「お客様納品」「商用パッケージ」「editMode問題」「Spineアニメーション表示」
→ [パッケージ出力機能完全実装記録.md](./troubleshooting/パッケージ出力機能完全実装記録.md)

### 「nezumi」「ネズミ」「nezumi編集」「第2キャラクター」「v3.0」「Phase2」「モジュール化」「ファイル分割」「4001行」「8モジュール」
→ [nezumi編集機能実装成功記録.md](./troubleshooting/nezumi編集機能実装成功記録.md)

### 「赤い枠」「赤い境界」「編集前に表示」「バウンディングボックス自動表示」「境界表示」「編集開始前」「bounds integration」「updateBoundingBoxVisual」
→ [編集前バウンディングボックス表示問題.md](./troubleshooting/編集前バウンディングボックス表示問題.md)

### 「PackageExportSystem」「見つかりません」「undefined」「読み込み失敗」「モジュール読み込み」「パッケージボタンエラー」「継続調査中」
→ [PackageExportSystem読み込み問題.md](./troubleshooting/PackageExportSystem読み込み問題.md)

### 「パッケージ出力」「位置情報反映されない」「編集位置が出力されない」「デフォルト位置になる」「v3.0データ形式」「CSS優先度競合」「inlineスタイル削除」
→ [パッケージ出力機能完全実装記録.md](./troubleshooting/パッケージ出力機能完全実装記録.md#-編集システム位置情報反映されない場合2025-08-08追加)

### 「境界ボックス」「精密クリック判定」「クリック範囲がずれる」「統一座標システム」「34頂点」「フォールバック処理」「座標一致」「精密判定」「bounding box」「click detection」「unified coordinate」
→ [境界ボックス精密クリック判定実装成功記録.md](./troubleshooting/境界ボックス精密クリック判定実装成功記録.md)

### 「瞬間移動」「165px移動」「編集ボタンクリック時」「F12で変わる」「レイアウトレース」「purattokun移動」「座標強制変更」「enterEditMode」「spine-edit-core」
→ [編集ボタンクリック時瞬間移動問題.md](./troubleshooting/編集ボタンクリック時瞬間移動問題.md)

---

## 📝 新しい問題の記録方法

### 1. まず新しい統合索引をチェック ✨
**[📚 ドキュメントナビゲーション](./README.md)** の以下を確認：
- **FAQ**: よくある問題の即座解決
- **症状別ナビゲーション**: 問題の症状から解決策へ
- **タスクベース索引**: やりたいことから適切なガイドへ

### 2. 既存の問題から探す
上記のリストとタグから、似た問題がないか確認
- **座標系関連** → [座標関連問題.md](./troubleshooting/coordinate-problems.md) （統合版）
- **Spine技術** → [Spine関連問題.md](./troubleshooting/spine-issues.md) （統合版）
- **デスクトップアプリ** → [デスクトップアプリ問題.md](./troubleshooting/desktop-app-issues.md) （統合版）

### 3. 該当する問題がない場合
新しいファイルを `troubleshooting/` フォルダに作成

### 4. 記録ルールに従う
[📋 _TROUBLESHOOTING_RULES.md](./_TROUBLESHOOTING_RULES.md) の形式で記録

### 5. 索引を更新
- この目次を更新
- **[📚 README.md](./README.md)** の該当セクションも更新

---

## 🚀 緊急時の対応

### ⚡ 3ステップ即座対応（最優先）
1. **[📚 ドキュメントナビゲーション](./README.md) の FAQ** をチェック → 即座解決の可能性
2. **症状別ナビゲーション**で問題を特定 → 詳細解決策へ
3. **解決しない場合は [CLAUDE.md](../CLAUDE.md) の緊急連絡先** → エスカレーション

### 📋 詳細対応フロー
1. **症状から探す**セクションで最も近い問題を選択
2. 該当ファイルの「⚡ 有効な解決策・回避策」を実行
3. 解決しない場合は「📝 試行錯誤の履歴」を参照

### 🆕 新しい問題の場合
1. 問題の詳細を記録
2. 試した方法と結果を記録  
3. [📋 _TROUBLESHOOTING_RULES.md](./_TROUBLESHOOTING_RULES.md) に従って新規ファイル作成
4. **[📚 README.md](./README.md)** の索引も更新

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