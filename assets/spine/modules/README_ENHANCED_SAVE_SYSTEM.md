# 📦 保存機能強化システム v1.0

完全モジュール化された保存機能強化システム。既存のSpinePositioningV2システムを壊すことなく、保存機能を大幅に強化します。

## 🎯 主な機能

### ✅ 基本保存機能
- **手動保存**: 明示的な保存ボタンによる確実な保存
- **自動保存**: 設定変更時の自動保存（10秒〜5分間隔で調整可能）
- **保存確認**: 保存前の内容確認ダイアログ
- **保存状態表示**: 未保存変更の視覚的表示

### 🔄 拡張保存機能
- **複製キャラクター対応**: 複数キャラクターの位置・設定を一括保存
- **アニメーション設定対応**: アニメーション選択状態の保存
- **UI状態対応**: パネル位置・ユーザー設定の保存
- **バックアップ・復元**: 手動バックアップ作成と任意時点への復元

### 🔗 システム統合
- **既存システム互換性**: SpinePositioningV2と完全互換
- **非破壊設計**: 既存機能への影響ゼロ保証
- **段階的導入**: 必要な機能のみ有効化可能
- **レガシー対応**: 従来のlocalStorage形式との互換性維持

### 🛡️ 安全性機能
- **変更検知**: DOM・スタイル・カスタムイベントの包括的監視
- **ページ離脱警告**: 未保存変更がある場合の離脱防止
- **エラーハンドリング**: 保存失敗時の自動リトライ・フォールバック
- **データ検証**: 保存データの整合性チェック

## 🚀 使用方法

### 基本的な導入手順

#### 1. ファイルの読み込み

```html
<!-- 既存のSpineシステム後に読み込み -->
<script src="assets/spine/modules/enhanced-save-system.js"></script>
<script src="assets/spine/modules/enhanced-save-integration-example.js"></script>
```

#### 2. 自動初期化

システムは自動的に初期化されます（DOM読み込み完了1秒後）。

```javascript
// 自動初期化の確認
console.log('Enhanced Save System:', window.enhancedSaveSystem);
console.log('Integration System:', window.enhancedSaveIntegration);
```

#### 3. 手動初期化（オプション）

```javascript
// 手動で初期化する場合
const saveSystem = initializeEnhancedSaveSystem();
const integration = new EnhancedSaveIntegration();
```

### UIの利用方法

#### 保存パネル

画面右上に表示される保存パネルで以下の操作が可能：

- **💾 保存**: 手動保存の実行
- **⚡ 自動保存**: 自動保存のON/OFF切り替え
- **⏰ 間隔設定**: 自動保存間隔の調整（10秒〜5分）
- **📦 バックアップ作成**: 手動バックアップの作成
- **🔄 復元**: バックアップからの復元

#### 保存状態の確認

- **🟢 緑の●**: 保存済み
- **🟡 黄の●**: 未保存変更あり
- **🔵 青の●**: 保存中（点滅）
- **🔴 赤の●**: 保存エラー

### プログラム的な利用

#### 基本的な保存操作

```javascript
// 手動保存
const result = await enhancedManualSave();
console.log('保存結果:', result ? '成功' : '失敗');

// バックアップ作成
await enhancedCreateBackup();

// 自動保存の切り替え
const autoSaveEnabled = enhancedToggleAutoSave();
console.log('自動保存:', autoSaveEnabled ? '有効' : '無効');
```

#### 状態の確認

```javascript
// 保存システムの状態確認
const status = enhancedSaveStatus();
console.log('状態:', status);
// {
//   hasUnsavedChanges: false,
//   autoSaveEnabled: true,
//   saveInProgress: false,
//   lastSavedTimestamp: 1640000000000
// }

// 診断情報の取得
const diagnosis = await enhancedSaveDiagnose();
console.log('診断:', diagnosis);
```

#### 高度な使用方法

```javascript
// Enhanced Save Systemインスタンスへの直接アクセス
const saveSystem = window.enhancedSaveSystem;

// カスタム変更リスナーの追加
saveSystem.addChangeListener((source) => {
    console.log(`変更検出: ${source}`);
});

// 自動保存間隔の変更
saveSystem.setAutoSaveInterval(60000); // 1分間隔

// 現在の状態を手動取得
const currentState = await saveSystem.getCurrentState();
console.log('現在の状態:', currentState);
```

## 🏗️ アーキテクチャ

### システム構成

```
📦 Enhanced Save System
├── 🎯 EnhancedSaveSystem (メインクラス)
│   ├── 💾 保存・読み込み機能
│   ├── 🔍 変更検知システム
│   ├── ⚡ 自動保存システム
│   ├── 🎨 UI システム
│   └── 📦 バックアップ・復元システム
│
├── 🔗 EnhancedSaveIntegration (統合クラス)
│   ├── 🤝 既存システム連携
│   ├── 📡 イベント中継
│   └── 🔧 機能拡張
│
└── 📱 UI Components
    ├── 💾 保存パネル
    ├── 📊 状態表示
    ├── 💬 確認ダイアログ
    └── 🔄 復元ダイアログ
```

### データフロー

```
1. 変更検知
   DOM Mutation → Style Change → Custom Events
                      ↓
2. 変更通知
   Enhanced Save System → Integration System
                      ↓
3. 保存処理
   State Collection → Validation → Storage
                      ↓
4. UI更新
   Status Indicator → Notification → Panel Update
```

### 保存データ形式

#### Enhanced形式（新システム）

```javascript
{
  timestamp: 1640000000000,
  version: '1.0',
  systemType: 'enhanced-save-system',
  saveType: 'manual', // 'auto' or 'manual'
  
  // 基本キャラクター情報
  character: {
    id: 'purattokun-canvas',
    left: '20%',
    top: '50%',
    width: '15%',
    height: '15%',
    transform: 'translate(-50%, -50%)',
    zIndex: '100'
  },
  
  // 拡張情報
  clones: [/* 複製キャラクター情報 */],
  animations: {/* アニメーション設定 */},
  ui: {/* UI状態 */},
  
  // システム設定
  settings: {
    autoSaveEnabled: true,
    autoSaveInterval: 30000
  }
}
```

#### レガシー形式（互換性維持）

```javascript
{
  timestamp: 1640000000000,
  character: {
    left: '20%',
    top: '50%',
    width: '15%'
  }
}
```

## 🔧 設定とカスタマイズ

### 初期化設定

```javascript
// カスタム設定で初期化
const saveSystem = new EnhancedSaveSystem();

// 自動保存を無効化
saveSystem.setAutoSaveEnabled(false);

// 自動保存間隔を変更
saveSystem.setAutoSaveInterval(120000); // 2分間隔
```

### UI設定

```javascript
// UIを非表示にする
const saveSystem = window.enhancedSaveSystem;
if (saveSystem.ui) {
    saveSystem.ui.style.display = 'none';
}

// カスタムスタイルの適用
const customStyles = `
    .enhanced-save-panel {
        background: rgba(0, 0, 0, 0.8) !important;
        color: white !important;
    }
`;
document.head.appendChild(document.createElement('style')).textContent = customStyles;
```

### 変更検知のカスタマイズ

```javascript
// カスタム変更検知の追加
saveSystem.addChangeListener((source) => {
    if (source === 'custom-action') {
        console.log('カスタムアクションが実行されました');
    }
});

// 手動で変更を通知
saveSystem.onChangeDetected('custom-action');
```

## 🚨 トラブルシューティング

### よくある問題

#### 1. システムが初期化されない

```javascript
// 診断実行
await enhancedSaveDiagnose();

// 手動初期化を試行
const saveSystem = initializeEnhancedSaveSystem();
```

#### 2. 保存が実行されない

```javascript
// 保存状態を確認
const status = enhancedSaveStatus();
console.log('保存中かどうか:', status.saveInProgress);

// 強制的に保存を試行
const result = await window.enhancedSaveSystem.manualSave(false); // 確認なし
```

#### 3. 自動保存が動作しない

```javascript
// 自動保存設定を確認
const saveSystem = window.enhancedSaveSystem;
console.log('自動保存有効:', saveSystem.autoSaveEnabled);
console.log('自動保存間隔:', saveSystem.autoSaveIntervalMs);

// 手動で有効化
saveSystem.setAutoSaveEnabled(true);
```

#### 4. UIが表示されない

```javascript
// UI存在確認
const ui = document.querySelector('#enhanced-save-ui');
console.log('UI要素:', ui);

// スタイル読み込み確認
const styles = document.querySelector('#enhanced-save-styles');
console.log('スタイル要素:', styles);
```

### デバッグコマンド

```javascript
// 完全診断
await enhancedSaveDiagnose();

// 統合システム診断
if (window.enhancedSaveIntegration) {
    await window.enhancedSaveIntegration.diagnose();
}

// localStorage内容確認
console.log('Enhanced Data:', localStorage.getItem('spine-enhanced-save-v1'));
console.log('Legacy Data:', localStorage.getItem('spine-positioning-state'));

// バックアップ一覧確認
const saveSystem = window.enhancedSaveSystem;
const backups = saveSystem.getBackupList();
console.log('バックアップ:', backups);
```

## 🔮 将来の拡張予定

### 計画中の機能

- **クラウド同期**: Google Drive、Dropbox連携
- **バージョン管理**: Git風の変更履歴管理
- **協業機能**: 複数ユーザーでの同時編集
- **インポート/エクスポート**: JSON、CSV形式での設定共有
- **プラグインシステム**: サードパーティ拡張機能

### API拡張

- **Webhook対応**: 保存イベントの外部通知
- **REST API**: リモートサーバーとの連携
- **リアルタイム同期**: WebSocket経由のリアルタイム更新

## 📄 ライセンス・サポート

### 使用条件

- 商用・非商用問わず自由に使用可能
- 改変・再配布も可能
- クレジット表記は任意

### サポート

- GitHub Issues: [プロジェクトページ]
- ドキュメント: このREADME
- デバッグ: `enhancedSaveDiagnose()`コマンド

---

## 📋 クイックリファレンス

### 主要なグローバル関数

```javascript
// 基本操作
enhancedManualSave()           // 手動保存
enhancedCreateBackup()         // バックアップ作成
enhancedToggleAutoSave()       // 自動保存切り替え
enhancedSaveStatus()           // 状態確認
enhancedSaveDiagnose()         // 診断実行

// システムアクセス
window.enhancedSaveSystem      // メインシステム
window.enhancedSaveIntegration // 統合システム
```

### 重要なCSS クラス

```css
.enhanced-save-panel          /* メインパネル */
.save-status-indicator        /* 状態インジケーター */
.save-btn                     /* 保存ボタン */
.auto-save-controls           /* 自動保存設定 */
.unsaved-indicator            /* 未保存警告 */
```

### localStorage キー

```
spine-enhanced-save-v1              // メイン保存データ
spine-positioning-state             // レガシー互換データ
spine-enhanced-save-v1_backup_*     // バックアップデータ
spine-enhanced-save-v1_backup_list  // バックアップ一覧
```

---

*Enhanced Save System v1.0 - 完全モジュール化された保存機能強化システム* 🚀