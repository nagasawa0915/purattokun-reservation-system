# SystemCoordinator仕様書

## 🎯 概要
spine-editor-webappにおけるマイクロモジュール統合管理システムの中核コンポーネント

## 🏛️ アーキテクチャ原則

### **設計思想**
- **統合管理者**: 各マイクロモジュールの協調制御
- **ライフサイクル管理**: 段階的初期化による依存関係解決
- **エラーハンドリング**: システム全体の安定性保証
- **競合回避**: モジュール間の干渉防止

### **責務境界**
- ✅ **SystemCoordinatorの責務**: モジュール統合・初期化順序制御・エラー管理
- ❌ **SystemCoordinatorの非責務**: 個別機能実装・UI操作・データ処理

## 📋 管理対象モジュール

### **Core Modules（必須）**
1. **PanelManager** - パネル基盤管理システム
2. **DebugManager** - デバッグ・監視システム

### **UI Modules（機能別）**  
3. **ResizeController** - パネルリサイズ機能
4. **SimplePanelSwapController** - パネル入れ替え機能
5. **LayoutManager** - レイアウト自動管理（競合制御対象）

### **Integration Modules（統合）**
6. **HomepageIntegrationController** - ホームページ統合機能

## 🔄 初期化フェーズ仕様

### **Phase実行順序（固定）**
```javascript
Phase 1: debug-init        // デバッグシステム（最優先）
Phase 2: panel-init        // パネル基盤システム
Phase 3: panelswap-init    // パネル入れ替えシステム
Phase 4: resize-init       // リサイズシステム
Phase 5: homepage-integration // ホームページ統合
Phase 6: global-integration   // グローバル統合・イベント設定
```

### **Phase実行制御**
- **順次実行**: 前のPhaseが完了してから次のPhase開始
- **エラー時停止**: いずれかのPhaseでエラー発生時は初期化中断
- **パフォーマンス測定**: 各Phase実行時間の自動測定・記録

## ⚠️ 競合制御システム

### **LayoutManager競合問題**
**問題**: LayoutManagerとSimplePanelSwapControllerが同時動作すると相互干渉

**解決策**: 条件付き初期化
```javascript
const enableLayoutManager = localStorage.getItem('spine-editor-enable-layout-manager') !== 'false';
if (enableLayoutManager) {
    this.layoutManager = new LayoutManager();
} else {
    this.layoutManager = null; // パネル入れ替え優先モード
}
```

### **制御方法**
```javascript
// LayoutManager無効化（パネル入れ替え優先）
localStorage.setItem('spine-editor-enable-layout-manager', 'false');

// LayoutManager有効化（レイアウト管理優先）  
localStorage.setItem('spine-editor-enable-layout-manager', 'true');
```

## 🔧 API仕様

### **初期化制御**
```javascript
// 基本初期化
const coordinator = new SystemCoordinator();

// 初期化状態確認
coordinator.getCoordinatorStatus();

// システムヘルスチェック
coordinator.performSystemHealthCheck();
```

### **エラー対応**
```javascript
// 緊急停止
coordinator.emergencyStop();

// クリーンアップ
coordinator.cleanup();
```

### **グローバル関数**
```javascript
// ブラウザコンソールから利用可能
window.systemCoordinator     // SystemCoordinatorインスタンス
window.resetLayout()         // レイアウトリセット
debugSystem()                // システム状態確認
toggleDebugPanel()           // デバッグパネル表示切替
```

## 🚨 既知の問題と制限事項

### **パネル入れ替え重複実行問題**
**現象**: SimplePanelSwapControllerで入れ替えが2回実行され、結果的に元に戻る

**診断ログ例**:
```
🎯 ドロップ: outliner → preview
✅ パネル入れ替え完了: "preview outliner properties"
🎯 ドロップ: outliner → preview  // ← 重複実行
✅ パネル入れ替え完了: "outliner preview properties" // ← 元に戻る
```

**推定原因**: 
- マウスイベントの重複発火
- イベントリスナーの重複登録
- ドラッグ状態管理の競合

### **制限事項**
- LayoutManagerとSimplePanelSwapControllerの同時使用不可
- Phase初期化中のエラーは全体停止を引き起こす
- DOM構造変更時は手動再初期化が必要

## 🔍 診断・デバッグ機能

### **システム状態確認**
```javascript
// 各モジュール初期化状態確認
window.systemCoordinator.getCoordinatorStatus();

// 詳細ヘルスチェック
window.systemCoordinator.performSystemHealthCheck();

// 個別モジュール状態
window.systemCoordinator.panelSwapController.getDebugInfo();
```

### **パフォーマンス分析**
- 各Phase実行時間の自動測定
- DebugManagerによる詳細ログ出力
- リアルタイム状態監視

## 📈 今後の改善計画

### **Phase 1: 重複実行問題解決**
- SimplePanelSwapControllerの重複実行根本解決
- イベントリスナー管理の改善
- ドラッグ状態管理の強化

### **Phase 2: アーキテクチャ改善**
- モジュール間依存関係の明確化
- 初期化エラー時の部分復旧機能
- 動的モジュール読み込み対応

### **Phase 3: 拡張性向上**
- プラグインシステム導入
- 設定管理の統一化
- パフォーマンス最適化

---

**作成日**: 2025-09-12  
**バージョン**: 1.0  
**最終更新**: 重複実行問題分析追加（ログ解析結果反映）
