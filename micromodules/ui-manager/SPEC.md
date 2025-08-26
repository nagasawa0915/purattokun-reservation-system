# UI Manager Module - Technical Specification

## 📋 モジュール仕様

### 入力仕様
**UI設定オブジェクト**: UI表示・動作をカスタマイズするための設定

### 出力仕様  
**UI制御インスタンス**: UI管理・イベント処理・状態制御を提供するインスタンス

## 🔧 技術仕様

### モジュール構成

| ファイル | 役割 | 抽象度 | サイズ |
|---------|------|--------|--------|
| `spine-ui-manager.js` | メインUI管理 | 高 | ~592行 |
| `spine-debug-tools.js` | デバッグ・診断 | 低 | ~437行 |

### 主要クラス・オブジェクト

#### SpineUIManager
```javascript
const SpineUIManager = {
    // Character Selection UI
    generateCharacterSelectionButtons: Function,
    setupCharacterSelectionListeners: Function,
    
    // UI Creation & Management
    createEditStartUI: Function,
    createEditingUI: Function,
    removeEditStartUI: Function,
    removeEditingUI: Function,
    
    // Event Management
    setupEditingUIEvents: Function,
    
    // Display Systems
    startCoordinateDisplay: Function,
    createDraggableTitleBarModule: Function
}
```

#### SpineDebugTools
```javascript
const SpineDebugTools = {
    // Core Diagnostic Functions
    diagnoseDragHandles: Function,
    isEditMode: Function,
    testDragHandleClick: Function,
    diagnoseEditSystem: Function,
    diagnoseSystemStatus: Function,
    
    // Advanced Testing Tools
    Phase3DebugTools: Object,
    
    // Event Handler Management
    setupGlobalClickHandler: Function,
    cleanupGlobalClickHandler: Function,
    clearCharacterSelection: Function
}
```

## 📊 入力パラメータ仕様

### UI設定オブジェクト構造

```typescript
interface UIConfiguration {
    // Panel Configuration
    panels?: {
        startPanel?: {
            position?: { top: string, right: string },
            background?: string,
            borderColor?: string,
            width?: string
        },
        editPanel?: {
            position?: { top: string, right: string },
            background?: string,
            borderColor?: string,
            minWidth?: string
        }
    },
    
    // Feature Flags
    features?: {
        characterSelection?: boolean,
        coordinateDisplay?: boolean,
        draggableTitle?: boolean,
        debugTools?: boolean
    },
    
    // Event Callbacks
    callbacks?: {
        onEditStart?: Function,
        onEditEnd?: Function,
        onSave?: Function,
        onCancel?: Function,
        onPackageExport?: Function
    },
    
    // Debug Configuration
    debug?: {
        enableConsoleOutput?: boolean,
        enableDiagnostics?: boolean,
        logLevel?: 'info' | 'warn' | 'error'
    }
}
```

### デフォルト設定値

```javascript
const DEFAULT_UI_CONFIG = {
    panels: {
        startPanel: {
            position: { top: '20px', right: '20px' },
            background: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#28a745',
            width: '150px'
        },
        editPanel: {
            position: { top: '60px', right: '20px' },
            background: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#007acc',
            minWidth: '200px'
        }
    },
    features: {
        characterSelection: false,  // 現在無効化中
        coordinateDisplay: true,
        draggableTitle: true,
        debugTools: true
    },
    callbacks: {
        // 外部関数への依存
        onEditStart: () => startEditMode(),
        onEditEnd: () => stopEditMode(),
        onSave: () => saveCurrentState(),
        onCancel: () => cancelEdit()
    },
    debug: {
        enableConsoleOutput: true,
        enableDiagnostics: true,
        logLevel: 'info'
    }
}
```

## 📤 出力インスタンス仕様

### UI制御インスタンス構造

```typescript
interface UIControllerInstance {
    // UI State Management
    state: {
        isEditMode: boolean,
        currentPanel: 'start' | 'editing' | null,
        selectedCharacter: Object | null,
        isDragging: boolean
    },
    
    // UI Control Methods
    ui: {
        showStartPanel: Function,
        showEditingPanel: Function,
        hideAllPanels: Function,
        updateCoordinateDisplay: Function,
        enableDrag: Function,
        disableDrag: Function
    },
    
    // Event Management
    events: {
        addListener: Function,
        removeListener: Function,
        trigger: Function,
        cleanup: Function
    },
    
    // Debug Interface
    debug: {
        runDiagnostics: Function,
        getSystemStatus: Function,
        testComponents: Function,
        enableDebugMode: Function
    }
}
```

## ⚡ パフォーマンス仕様

### メモリ使用量
- **基本UI**: ~50KB (DOM要素 + イベントリスナー)
- **デバッグツール**: ~30KB (診断関数 + テストデータ)
- **座標表示システム**: ~5KB (更新インターバル + DOM監視)

### 実行時間
- **UI作成**: <10ms (パネル生成 + スタイル適用)
- **イベント処理**: <5ms (ボタンクリック + 状態更新)
- **座標更新**: <2ms (100ms間隔での座標取得)
- **診断実行**: <50ms (全システム状態確認)

### DOM影響
- **追加要素**: 最大2つのパネル要素
- **イベントリスナー**: ~10個 (適切にクリーンアップ)
- **CSS注入**: なし (インラインスタイルのみ使用)

## 🔗 依存関係仕様

### 必須依存関係
```javascript
// Core Systems (必須)
- MultiCharacterManager     // キャラクター管理
- SpineEditSystem          // 編集システム本体

// Feature Dependencies (機能別)
- PackageExportSystem      // パッケージ出力機能
- createLayerEditModule    // レイヤー編集機能
```

### オプショナル依存関係
```javascript
// Debug Dependencies (デバッグ時のみ)
- spineSkeletonBounds      // バウンディングボックス判定
- Phase3DebugTools         // 高度診断機能

// UI Enhancement (拡張機能)
- localStorage             // 設定永続化
- console                  // デバッグ出力
```

### 依存関係チェック機能
```javascript
function checkDependencies() {
    const required = [
        { name: 'MultiCharacterManager', available: typeof MultiCharacterManager !== 'undefined' },
        { name: 'SpineEditSystem', available: typeof SpineEditSystem !== 'undefined' }
    ];
    
    const missing = required.filter(dep => !dep.available);
    
    if (missing.length > 0) {
        console.warn('⚠️ Missing dependencies:', missing.map(d => d.name));
        return false;
    }
    
    return true;
}
```

## 🎯 使用例・実装パターン

### 基本使用パターン
```javascript
// 1. 基本初期化
if (SpineUIManager.checkDependencies()) {
    SpineUIManager.createEditStartUI();
}

// 2. カスタム設定での初期化
const customConfig = {
    panels: {
        startPanel: { position: { top: '50px', right: '50px' } }
    },
    features: { debugTools: false }
};

SpineUIManager.initialize(customConfig);
```

### 高度使用パターン
```javascript
// 1. イベント処理カスタマイズ
SpineUIManager.events.addListener('editStart', () => {
    console.log('カスタム編集開始処理');
});

// 2. デバッグモード活用
if (process.env.NODE_ENV === 'development') {
    SpineDebugTools.enableDebugMode();
    SpineDebugTools.setupGlobalClickHandler();
}

// 3. 状態監視
SpineUIManager.state.onchange = (newState) => {
    console.log('UI状態変更:', newState);
};
```

## 🔧 エラーハンドリング仕様

### エラー分類
1. **依存関係エラー**: 必須モジュール未読み込み
2. **DOM操作エラー**: 要素作成・検索失敗  
3. **イベント処理エラー**: リスナー設定・実行失敗
4. **状態管理エラー**: 不正な状態遷移

### エラー処理戦略
```javascript
// Graceful Degradation
function safeExecute(func, fallback, context = 'UI操作') {
    try {
        return func();
    } catch (error) {
        console.warn(`⚠️ ${context}でエラー発生:`, error);
        if (fallback) return fallback();
        return null;
    }
}

// 使用例
safeExecute(
    () => SpineUIManager.createEditingUI(),
    () => alert('編集UIの作成に失敗しました'),
    '編集UI作成'
);
```

## 📈 拡張性・カスタマイズ

### プラグインシステム対応
```javascript
// プラグイン登録インターフェース
SpineUIManager.plugins.register('customPanel', {
    create: (config) => { /* パネル作成 */ },
    destroy: () => { /* クリーンアップ */ },
    events: { /* イベント定義 */ }
});
```

### テーマシステム対応
```javascript
// テーマ設定
const darkTheme = {
    panels: {
        background: 'rgba(33, 37, 41, 0.95)',
        borderColor: '#6c757d',
        textColor: '#ffffff'
    }
};

SpineUIManager.applyTheme(darkTheme);
```

## 🧪 テスト仕様

### 単体テストカバレッジ
- **UI作成**: パネル生成・DOM挿入・スタイル適用
- **イベント処理**: クリック・キーボード・ドラッグ操作
- **状態管理**: 状態遷移・データ整合性・永続化
- **エラーハンドリング**: 異常系・境界値・復旧処理

### 統合テスト項目
```javascript
// Phase3DebugTools.runFullTest() 実行項目
const testSuite = {
    detection: 'キャラクター検出機能',
    ui: 'UI要素存在確認',
    selection: 'キャラクター選択機能', 
    coordinate: '座標系管理機能'
};
```

### パフォーマンステスト
- **レスポンス時間**: UI操作後50ms以内の反応
- **メモリ使用量**: 100KB以下の追加メモリ使用
- **DOM影響**: 最小限の要素追加・変更

## 🔄 バージョン管理・後方互換性

### APIバージョニング
- **v3.0**: 現行バージョン（マイクロモジュール化対応）
- **v2.x**: 旧バージョン（モノリス構造）
- **v1.x**: 初期バージョン（基本機能のみ）

### 後方互換性確保
```javascript
// 旧API呼び出しの互換性維持
window.createEditStartUI = SpineUIManager.createEditStartUI;
window.createEditingUI = SpineUIManager.createEditingUI;
window.diagnoseDragHandles = SpineDebugTools.diagnoseDragHandles;
```

### 移行パス
1. **Phase 1**: 新旧API並行稼働
2. **Phase 2**: 警告付きで旧API利用
3. **Phase 3**: 新API完全移行