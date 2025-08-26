# UI Manager Module

## 概要

Spine編集システムのUI管理を担当する統合モジュールです。キャラクター選択UI、編集パネル、デバッグツールを提供し、ユーザーインターフェース全体の管理とイベント処理を統合的に制御します。

## 🎯 責務・役割

### 主要責務
- **キャラクター選択UI**: 複数キャラクター対応の選択インターフェース
- **編集パネル管理**: 編集モード開始・編集中・終了の各UI状態管理
- **イベント処理統合**: UIボタン・操作のイベントリスナー一元管理
- **座標表示システム**: リアルタイム座標・サイズ情報の表示制御
- **デバッグ・診断機能**: 開発者向け診断ツール・テスト機能

### 抽象度レベル
- **高レベル**: UI統合管理・ユーザーフロー制御
- **中レベル**: 個別UIコンポーネント制御
- **低レベル**: デバッグ・診断・システム状態確認

## 📁 モジュール構成

```
ui-manager/
├── spine-ui-manager.js     # メインUI管理モジュール
├── spine-debug-tools.js    # デバッグ・診断ツール
├── README.md              # このファイル
└── SPEC.md               # 技術仕様書
```

## 🚀 API Reference

### SpineUIManager (メインモジュール)

#### キャラクター選択UI
```javascript
// キャラクター選択ボタン生成
const buttonsHtml = SpineUIManager.generateCharacterSelectionButtons();

// キャラクター選択イベントリスナー設定
SpineUIManager.setupCharacterSelectionListeners();
```

#### 編集UI管理
```javascript
// 編集開始UI作成
SpineUIManager.createEditStartUI();

// 編集中UI作成
SpineUIManager.createEditingUI();

// UI削除
SpineUIManager.removeEditStartUI();
SpineUIManager.removeEditingUI();
```

#### 座標表示・ドラッグ機能
```javascript
// リアルタイム座標表示開始
SpineUIManager.startCoordinateDisplay();

// ドラッグ可能タイトルバー機能追加
SpineUIManager.createDraggableTitleBarModule();
```

### SpineDebugTools (デバッグモジュール)

#### 診断機能
```javascript
// ドラッグハンドル診断
SpineDebugTools.diagnoseDragHandles();

// 編集モード状態確認
const isEdit = SpineDebugTools.isEditMode();

// 編集システム全体診断
SpineDebugTools.diagnoseEditSystem();

// システム状況診断
SpineDebugTools.diagnoseSystemStatus();
```

#### テスト機能
```javascript
// ドラッグハンドルクリックテスト
SpineDebugTools.testDragHandleClick('center');

// Phase 3統合テスト
const testResults = SpineDebugTools.Phase3DebugTools.runFullTest();
```

#### クリックハンドラー管理
```javascript
// グローバルクリックハンドラー設定
SpineDebugTools.setupGlobalClickHandler();

// クリックハンドラークリーンアップ
SpineDebugTools.cleanupGlobalClickHandler();

// キャラクター選択解除
SpineDebugTools.clearCharacterSelection();
```

## 🔧 イベント処理システム

### UIイベントフロー

1. **編集開始フロー**
   ```
   編集開始ボタンクリック → removeEditStartUI() → startEditMode() → createEditingUI()
   ```

2. **編集中イベント処理**
   ```
   - パッケージ出力: PackageExportSystem.exportPackage()
   - レイヤー編集: createLayerEditModule()
   - 保存: saveCurrentState()
   - キャンセル: cancelEdit()
   - 編集終了: stopEditMode()
   ```

3. **キャラクター選択フロー**
   ```
   キャラクターボタンクリック → UI状態更新 → MultiCharacterManager.selectCharacter()
   ```

### イベントリスナー管理

全てのUIイベントリスナーは`setupEditingUIEvents()`で一元管理されており、以下の機能を提供：

- **イベント委譲**: 効率的なイベント処理
- **エラーハンドリング**: 未定義関数・モジュールの安全な処理
- **状態管理**: UI状態とデータ状態の同期

## 🎨 UI Components

### 編集開始パネル
- **ID**: `spine-start-panel-v3`
- **位置**: 右上固定 (top: 20px, right: 20px)
- **機能**: 編集モード開始

### 編集中パネル
- **ID**: `spine-edit-panel-v3`
- **位置**: 右上固定 (top: 60px, right: 20px)
- **機能**: 
  - リアルタイム座標表示
  - パッケージ出力
  - レイヤー編集
  - 保存・キャンセル・終了

### ドラッグ機能
- **タイトルバードラッグ**: パネル移動可能
- **境界制限**: 画面外への移動防止
- **視覚フィードバック**: ドラッグ中のスタイル変更

## 🔍 デバッグ・診断機能

### 利用可能な診断コマンド (F12コンソール)

```javascript
// 基本診断
diagnoseDragHandles()        // ドラッグハンドル状態診断
isEditMode()                 // 編集モード確認
diagnoseEditSystem()         // 編集システム全体診断
diagnoseSystemStatus()       // v3.0システム状況診断

// テスト機能
testDragHandleClick()        // ハンドルクリックテスト
Phase3DebugTools.runFullTest()  // 統合テスト

// nezumi統合テスト
Phase3DebugTools.testNezumiDetection()      // nezumi検出テスト
Phase3DebugTools.testCharacterSelection()  // キャラクター選択テスト
Phase3DebugTools.testCoordinateSwap('nezumi')  // 座標系スワップテスト
```

### Phase 3統合テスト結果

統合テストは以下の項目を検証：
- `detection`: nezumiキャラクター検出
- `ui`: UI要素存在確認
- `selection`: キャラクター選択機能
- `coordinate`: 座標系管理機能

## 📋 使用方法・統合手順

### 基本統合
```javascript
// 1. モジュール読み込み
<script src="micromodules/ui-manager/spine-ui-manager.js"></script>
<script src="micromodules/ui-manager/spine-debug-tools.js"></script>

// 2. UI初期化
SpineUIManager.createEditStartUI();

// 3. デバッグ機能有効化（開発時のみ）
SpineDebugTools.setupGlobalClickHandler();
```

### 編集システム統合
```javascript
// 編集開始時
function startEditMode() {
    SpineUIManager.removeEditStartUI();
    SpineUIManager.createEditingUI();
    // 他の編集モード処理...
}

// 編集終了時
function stopEditMode() {
    SpineUIManager.removeEditingUI();
    SpineUIManager.createEditStartUI();
    // 他の終了処理...
}
```

## ⚠️ 注意事項・制約

### 依存関係
- `MultiCharacterManager`: キャラクター管理
- `SpineEditSystem`: 編集システム本体
- `PackageExportSystem`: パッケージ出力機能

### 既知の制約
- キャラクター選択機能は現在無効化中（シンプル化のため）
- バウンディングボックスボタンは削除済み（別モジュール化対応）

### ブラウザ要件
- モダンブラウザ (ES6+ サポート)
- DOM API サポート
- Console API サポート (デバッグ機能)

## 📊 パフォーマンス・メモリ管理

### 効率化施策
- **イベントリスナー一元管理**: メモリリーク防止
- **DOM要素キャッシュ**: 繰り返しクエリの最適化
- **条件分岐最適化**: 不要な処理の削減

### メモリ管理
- UI削除時のイベントリスナー自動クリーンアップ
- 座標更新インターバルの適切な管理
- グローバル変数の最小化

## 🔄 今後の拡張計画

### Phase 4対応
- モジュール間通信プロトコルの標準化
- 設定可能なUI テーマシステム
- アクセシビリティ機能の強化

### マイクロモジュール化完了項目
- ✅ UI管理機能の独立化
- ✅ デバッグツールの分離
- ✅ イベント処理の統合管理
- ✅ 後方互換性の確保