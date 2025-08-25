# 🔍 PureSpineEditor 座標書き込み競合診断システム

## 📁 実装ファイル

### 1. 監視システムコア
- **coordinate-monitoring-system.js** - 座標書き込み監視システム（独立）
- **diagnosis-integration.js** - PureSpineEditorとの統合システム

### 2. テスト環境
- **coordinate-conflict-diagnosis-test.html** - 診断用Webページ
- **micromodules/features/PureSpineEditor.js** - 監視対象システム

## 🚀 実行手順

### Step 1: サーバー起動
```bash
python server.py
```

### Step 2: 診断ページ起動
```
http://localhost:8000/coordinate-conflict-diagnosis-test.html
```

### Step 3: 診断実行（2つの方法）

#### 方法A: GUI操作
1. 「Spine読み込み」ボタンクリック
2. 「一括診断実行」ボタンクリック
3. F12コンソールで結果確認

#### 方法B: F12コンソール直接実行
```javascript
// Spine読み込み
loadSpineEditor();

// 3秒待機後、診断実行
setTimeout(() => {
    runInstantDiagnosis(spineEditor);
}, 3000);
```

## 🔧 診断機能詳細

### 監視対象
1. **skeleton.x / skeleton.y** - Spine骨格座標への書き込み
2. **skeleton.scaleX / scaleY** - Spine骨格スケールへの書き込み
3. **canvas.style** - Canvas要素スタイル変更

### 検出する問題
- **瞬間移動**: showBoundingBox()実行時の意図しない座標変更
- **座標競合**: 複数のレイヤーによる同一座標への書き込み
- **書き込み元特定**: どのコード行が座標を変更しているか

### 分析レポート
- **書き込み頻度**: 各座標への書き込み回数
- **競合回数**: バウンディングボックス表示中の競合件数
- **時系列ログ**: 座標変更の時間順記録
- **コールスタック**: 各書き込みの実行元コード特定

## 📊 期待される診断結果

### ✅ 正常パターン
```
📊 診断結果:
✅ 座標競合は検出されませんでした
📈 書き込み頻度:
  skeleton.x: 1回 (初期化のみ)
  skeleton.y: 1回 (初期化のみ)
  canvas.style: 2回 (初期配置+バウンディングボックス表示)
```

### 🚨 問題パターン
```
📊 診断結果:
🚨 5件の座標競合を検出しました
📈 書き込み頻度:
  skeleton.x: 3回 (重複書き込み検出)
  skeleton.y: 3回 (重複書き込み検出)
  canvas.style: 4回 (頻繁な位置変更)
🔧 競合解決のため、該当コードの修正が必要です
```

## 🎯 問題箇所の特定方法

### コンソールログ確認
```
[COORDINATE WRITE] skeleton.x = 0
📍 Stack: at syncBoundingToSpine (PureSpineEditor.js:645)

[COORDINATE WRITE] canvas.style = left: 200px; top: 150px; transform: translate(-50%, -50%);
📍 Stack: at syncBoundingToSpine (PureSpineEditor.js:663)
```

### 修正すべき箇所
1. **PureSpineEditor.js:645-646** - skeleton座標の不要な再設定
2. **PureSpineEditor.js:663-665** - Canvas位置の重複変更
3. **showBoundingBox()内のsyncBoundingToSpine()呼び出し** - 初期表示時の不要な同期

## 🔧 修正提案

### 問題: 初期表示時の瞬間移動
**原因**: showBoundingBox()でsyncBoundingToSpine()が実行される
**解決策**: 初期表示時はsyncBoundingToSpine()をスキップ

### 問題: 座標の重複書き込み
**原因**: 複数の処理パスで同じ座標を設定
**解決策**: 書き込み前に現在値との比較を追加

### 問題: Canvas位置の頻繁な変更
**原因**: ドラッグ中の過度な位置更新
**解決策**: 更新頻度の制限（throttling）

## 📋 次の作業ステップ

1. ✅ 診断システムで問題箇所特定
2. ⏳ 特定された問題箇所の修正実装
3. ⏳ 修正後の再診断で効果確認
4. ⏳ 瞬間移動問題の完全解決

## 💡 使用上の注意

- **Chrome推奨**: F12コンソールで最適な表示
- **リロード**: 診断後はページリロードで監視状態をリセット
- **複数実行**: 監視は1つのインスタンスのみ対応
- **パフォーマンス**: 監視中は若干のパフォーマンス低下あり

---

📖 **実行結果を確認後、問題箇所の修正に進んでください**
