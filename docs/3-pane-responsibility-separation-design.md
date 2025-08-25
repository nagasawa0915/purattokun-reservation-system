# 📐 3ペイン構造の理想的な責務分離設計書

**v4.0 Spine Editor - アーキテクチャ設計仕様書**  
**作成日**: 2025-08-25  
**バージョン**: v1.0  
**参考**: v2デスクトップ版成功パターン + v4問題分析

## 🎯 設計哲学・原則

### 🚀 v2成功パターンの継承
- **モジュール単一責任**: 1つのコントローラー = 1つの明確な責務
- **疎結合設計**: ペイン間は定義されたAPIでのみ通信
- **中央制御パターン**: ApplicationCoreが全体の状態とライフサイクルを統制
- **段階的初期化**: 依存関係に基づいた厳格な初期化順序

### ⚡ v4課題解決方針
- **責務混在の排除**: 各ペインの役割を明確に分離
- **通信経路の統制**: 直接参照を禁止、イベントベース通信のみ
- **状態管理の集約**: 複数箇所でのstate管理を統合
- **エラー境界の確立**: 1ペインのエラーが他に波及しない設計

---

## 📊 3ペイン責務マトリックス

| 責務領域 | OutlinerPane | PreviewPane | PropertiesPane | ApplicationCore |
|---------|-------------|-------------|---------------|----------------|
| **ファイル管理** | 🎯 **主責任** | ❌ なし | ❌ なし | 📋 状態管理 |
| **Spine表示** | ❌ なし | 🎯 **主責任** | ❌ なし | 📋 状態管理 |
| **設定・プロパティ** | ❌ なし | ❌ なし | 🎯 **主責任** | 📋 状態管理 |
| **UI操作** | 🔧 自ペイン内 | 🔧 自ペイン内 | 🔧 自ペイン内 | ❌ なし |
| **データ永続化** | ❌ なし | ❌ なし | ❌ なし | 🎯 **主責任** |
| **ペイン間通信** | 📡 イベント送受信 | 📡 イベント送受信 | 📡 イベント送受信 | 🎯 **中央制御** |

---

## 🗂️ ペイン別詳細責務定義

### 1️⃣ OutlinerPane（アウトライナー）

#### 🎯 **単一責任**
**プロジェクトファイルの階層管理・選択・操作**

#### ✅ **責任範囲**
- **ファイルツリー表示**: プロジェクトフォルダの階層構造表示
- **ファイル選択**: HTMLファイル・Spineアセットの選択UI
- **フォルダ操作**: フォルダ開く・リフレッシュ・検索機能
- **ファイル詳細**: ファイルサイズ・更新日時・メタデータ表示
- **プロジェクト状態**: 現在のプロジェクト・選択中ファイル表示

#### ❌ **責任外**
- Spine表示・レンダリング（PreviewPaneの責務）
- 設定・プロパティ変更（PropertiesPaneの責務）
- データ保存・永続化（ApplicationCoreの責務）

#### 🎮 **UI操作**
```
[📁 フォルダアイコン] プロジェクトフォルダ名
├─ [📄 HTMLアイコン] index.html ← 選択状態
├─ [📁 フォルダアイコン] assets/
│   └─ [🦴 Spineアイコン] purattokun/
└─ [🔍 検索ボックス] ファイル検索...

[📂 フォルダ開く] [🔄 リフレッシュ] [⚙️ 設定]
```

#### 📡 **イベント送信**
- `file-selected`: ファイル選択時
- `project-opened`: プロジェクト開始時
- `folder-refreshed`: フォルダリフレッシュ時

#### 📡 **イベント受信**
- `project-loaded`: プロジェクトロード完了通知
- `file-processing-status`: ファイル処理状況更新

---

### 2️⃣ PreviewPane（プレビュー）

#### 🎯 **単一責任**
**Spineキャラクターの表示・操作・リアルタイム編集**

#### ✅ **責任範囲**
- **Spineレンダリング**: WebGL Canvas上でのSpine表示
- **リアルタイム操作**: ドラッグ・スケール・回転の直接操作
- **バウンディングボックス**: 編集用のBB表示・ハンドル操作
- **プレビュー制御**: 再生・一時停止・アニメーション切り替え
- **視覚的フィードバック**: 操作中のハイライト・ガイド表示

#### ❌ **責任外**
- ファイル選択・管理（OutlinerPaneの責務）
- 数値入力・設定UI（PropertiesPaneの責務）
- データ保存・永続化（ApplicationCoreの責務）

#### 🎮 **UI操作**
```
┌─────────────────────────────────────┐
│  [WebGL Canvas - Spine表示エリア]      │
│                                   │
│     🦴 ← ドラッグ可能なSpineキャラクター    │
│     ┌─■─■─■┐                        │
│     ■     ■  ← バウンディングボックス     │
│     └─■─■─■┘                        │
│                                   │
│ [⏸️ 一時停止] [▶️ 再生] [🔄 リセット]       │
└─────────────────────────────────────┘
```

#### 📡 **イベント送信**
- `spine-position-changed`: 位置変更時
- `spine-scale-changed`: スケール変更時
- `spine-rotation-changed`: 回転変更時
- `animation-changed`: アニメーション変更時

#### 📡 **イベント受信**
- `spine-load`: Spineロード指示
- `position-update`: 外部からの位置更新
- `scale-update`: 外部からのスケール更新
- `animation-play`: アニメーション再生指示

---

### 3️⃣ PropertiesPane（プロパティ）

#### 🎯 **単一責任**
**数値・設定の詳細編集・プロパティ管理**

#### ✅ **責任範囲**
- **数値入力**: 位置・スケール・回転の精密数値編集
- **設定パネル**: エクスポート・品質・レンダリング設定
- **アニメーション制御**: アニメーション一覧・再生設定
- **メタデータ**: Spineファイル情報・統計表示
- **操作履歴**: Undo/Redo・操作ログ表示

#### ❌ **責任外**
- Spine表示・レンダリング（PreviewPaneの責務）
- ファイル管理・選択（OutlinerPaneの責務）
- データ保存・永続化（ApplicationCoreの責務）

#### 🎮 **UI操作**
```
┌─ 🎯 Transform ───────┐
│ Position X: [100.5] px │
│ Position Y: [200.3] px │
│ Scale X:    [1.25]     │
│ Scale Y:    [1.25]     │
│ Rotation:   [0°]       │
├─ 🎬 Animation ───────┤
│ Current: [taiki ▼]     │
│ Loop: [✓] Speed: [1.0] │
├─ ⚙️ Settings ────────┤
│ Quality: [High ▼]      │
│ Export:  [PNG ▼]       │
└─ 📊 Info ─────────────┤
│ File: purattokun.atlas │
│ Size: 512x512 px       │
│ Bones: 24, Slots: 15   │
└────────────────────────┘
```

#### 📡 **イベント送信**
- `property-changed`: プロパティ値変更時
- `animation-selected`: アニメーション選択時
- `settings-updated`: 設定変更時
- `export-requested`: エクスポート要求時

#### 📡 **イベント受信**
- `spine-state-updated`: Spine状態更新通知
- `position-synced`: 位置同期更新
- `animation-info-updated`: アニメーション情報更新

---

## 🔄 ApplicationCore - 中央制御システム

### 🎯 **統合責務**
**ペイン間調整・状態管理・データ永続化・ライフサイクル制御**

#### ✅ **中央制御機能**
- **状態管理**: アプリケーション全体の状態統合管理
- **ペイン間通信**: イベントルーティング・メッセージ配信
- **データ永続化**: localStorage・ファイル保存・設定管理
- **ライフサイクル**: 初期化・終了・エラー処理
- **依存関係管理**: モジュール読み込み・初期化順序制御

#### 🗂️ **統合状態管理**
```javascript
applicationState = {
    // プロジェクト状態
    project: {
        currentPath: null,
        selectedFile: null,
        recentProjects: []
    },
    
    // Spine状態
    spine: {
        character: null,
        position: {x: 0, y: 0},
        scale: {x: 1, y: 1},
        rotation: 0,
        currentAnimation: null,
        isPlaying: false
    },
    
    // UI状態
    ui: {
        activePane: 'preview',
        paneSizes: {outliner: 250, properties: 300},
        theme: 'dark',
        language: 'ja'
    },
    
    // 設定
    settings: {
        quality: 'high',
        exportFormat: 'png',
        autoSave: true,
        shortcuts: {}
    }
}
```

#### 🔧 **初期化フロー**
```javascript
async initializeApplication() {
    // 1. 基盤初期化
    await this.initializeCore();
    
    // 2. ペイン初期化（並列）
    await Promise.all([
        this.outlinerPane.initialize(),
        this.previewPane.initialize(), 
        this.propertiesPane.initialize()
    ]);
    
    // 3. ペイン間通信設定
    this.setupPaneEventHandlers();
    
    // 4. 前回セッション復元
    await this.restoreSession();
    
    // 5. 初期化完了通知
    this.broadcastEvent('application-ready');
}
```

---

## 📡 ペイン間通信API仕様

### 🎯 **通信原則**
- **イベント駆動**: 全てのペイン間通信はイベントベース
- **中央集権**: ApplicationCore経由での通信（直接参照禁止）
- **型安全性**: TypeScriptインターフェースによる型保証
- **非同期対応**: Promise・async/awaitベースの通信

#### 🔧 **イベントインターフェース定義**
```typescript
interface SpineEditorEvent {
    type: string;
    source: 'outliner' | 'preview' | 'properties' | 'core';
    target?: 'outliner' | 'preview' | 'properties' | 'core' | 'all';
    timestamp: number;
    data: any;
    requestId?: string; // 応答が必要な場合
}

// 具体的なイベント型定義
interface FileSelectedEvent extends SpineEditorEvent {
    type: 'file-selected';
    source: 'outliner';
    data: {
        filePath: string;
        fileType: 'html' | 'spine' | 'image';
        metadata: FileMetadata;
    }
}

interface SpinePositionChangedEvent extends SpineEditorEvent {
    type: 'spine-position-changed';
    source: 'preview';
    data: {
        position: {x: number, y: number};
        worldPosition: {x: number, y: number};
        isDragging: boolean;
    }
}
```

#### 📡 **通信フロー例**
```
【ファイル選択の通信フロー】
1. OutlinerPane: ファイルクリック
   ↓ event: file-selected
2. ApplicationCore: 状態更新 + 通知配信
   ↓ event: spine-load-requested → PreviewPane
   ↓ event: file-info-updated → PropertiesPane  
3. PreviewPane: Spine読み込み + 表示
   ↓ event: spine-loaded
4. ApplicationCore: 状態同期
   ↓ event: spine-state-updated → PropertiesPane
5. PropertiesPane: プロパティ情報更新

【リアルタイム編集の通信フロー】  
1. PreviewPane: ドラッグ操作
   ↓ event: spine-position-changing（リアルタイム）
2. ApplicationCore: 状態更新
   ↓ event: position-synced → PropertiesPane
3. PropertiesPane: 数値フィールド更新
   
4. PreviewPane: ドラッグ完了  
   ↓ event: spine-position-changed（確定）
5. ApplicationCore: 永続化 + 確定通知配信
```

---

## 💾 データ管理・保存処理の分離設計

### 🎯 **データレイヤー分離**
データ管理をビジネスロジックから完全分離し、保守性と拡張性を確保

#### 🗂️ **データアクセス層**
```typescript
class SpineEditorDataManager {
    // localStorage管理
    private localStorageManager: LocalStorageManager;
    
    // ファイルシステム管理（Electron）
    private fileSystemManager: FileSystemManager;
    
    // プロジェクト設定管理
    private projectConfigManager: ProjectConfigManager;
    
    // セッション管理
    private sessionManager: SessionManager;
}

interface DataManagerInterface {
    // プロジェクトデータ
    loadProject(path: string): Promise<ProjectData>;
    saveProject(project: ProjectData): Promise<void>;
    
    // Spine設定
    loadSpineSettings(characterId: string): Promise<SpineSettings>;
    saveSpineSettings(characterId: string, settings: SpineSettings): Promise<void>;
    
    // UI状態
    loadUIState(): Promise<UIState>;
    saveUIState(state: UIState): Promise<void>;
    
    // セッション復元
    saveSession(session: SessionData): Promise<void>;
    restoreSession(): Promise<SessionData>;
}
```

#### 💾 **保存処理の階層化**
```
【即座保存】(リアルタイム)
- UI状態（ペイン配置・選択状態）
- 編集中の一時データ（ドラッグ位置）
    ↓
【バッチ保存】(操作完了時) 
- Spine設定（位置・スケール・アニメーション）
- プロジェクト設定（ファイル選択・設定）
    ↓
【永続保存】(明示的保存)
- プロジェクトファイル（.spineproj）
- エクスポート設定・履歴
```

#### 🔄 **データ同期メカニズム**
```javascript
class DataSynchronizer {
    async syncSpinePosition(newPosition) {
        // 1. 即座UI更新（楽観的更新）
        this.applicationCore.updateState('spine.position', newPosition);
        this.broadcastEvent('position-synced', newPosition);
        
        // 2. バリデーション
        if (!this.validatePosition(newPosition)) {
            // ロールバック処理
            return this.rollbackPosition();
        }
        
        // 3. バックグラウンド保存
        await this.dataManager.saveSpineSettings(characterId, {
            position: newPosition,
            timestamp: Date.now()
        });
        
        // 4. 保存完了通知
        this.broadcastEvent('data-persisted', {type: 'position', success: true});
    }
}
```

---

## ⚡ イベント処理フローの設計

### 🎯 **イベント処理原則**
- **単方向データフロー**: データは常に上流から下流へ
- **イベント境界**: ペイン間でのロジック漏れを防止
- **エラー伝播制御**: 1つのペインのエラーが全体に影響しない

#### 🔄 **イベント処理パイプライン**
```
【イベント発生】
    ↓
【ペインコントローラー】（発生元）
- バリデーション・前処理
- ローカル状態更新
    ↓
【ApplicationCore】（中央処理）  
- グローバル状態更新
- 整合性チェック
- イベント変換・拡張
    ↓
【ターゲットペイン】（受信側）
- イベント受信・処理
- UI更新・副作用実行
    ↓
【データレイヤー】（永続化）
- 必要に応じて永続化実行
```

#### 🚨 **エラーハンドリング設計**
```typescript
class PaneEventHandler {
    async handleEvent(event: SpineEditorEvent): Promise<void> {
        try {
            // 1. イベントバリデーション
            this.validateEvent(event);
            
            // 2. 処理実行
            await this.processEvent(event);
            
        } catch (error) {
            // 3. エラー境界での捕捉
            this.handlePaneError(error, event);
            
            // 4. エラー通知（他ペインには影響させない）
            this.notifyError({
                pane: this.paneId,
                error: error.message,
                event: event.type,
                timestamp: Date.now()
            });
        }
    }
    
    private handlePaneError(error: Error, event: SpineEditorEvent): void {
        // ペイン固有のエラー処理
        console.error(`[${this.paneId}] Error handling ${event.type}:`, error);
        
        // UI状態をセーフモードに復帰
        this.enterSafeMode();
        
        // 必要に応じてペインリセット
        if (error instanceof CriticalError) {
            this.resetPane();
        }
    }
}
```

---

## 🏗️ 実装時の構造化指針

### 🎯 **ファイル構造設計**
```
src/
├── core/
│   ├── ApplicationCore.ts        # 中央制御システム
│   ├── DataManager.ts           # データアクセス層
│   ├── EventBus.ts              # イベント管理
│   └── types/                   # TypeScript型定義
│       ├── events.ts
│       ├── data.ts
│       └── ui.ts
├── panes/
│   ├── OutlinerPane/
│   │   ├── OutlinerPane.ts      # ペインコントローラー
│   │   ├── FileTree.ts          # ファイルツリーコンポーネント
│   │   ├── ProjectManager.ts    # プロジェクト管理ロジック
│   │   └── outliner.css         # ペイン専用スタイル
│   ├── PreviewPane/
│   │   ├── PreviewPane.ts       # ペインコントローラー
│   │   ├── SpineRenderer.ts     # Spine表示エンジン
│   │   ├── BoundingBox.ts       # BB操作コンポーネント
│   │   └── preview.css          # ペイン専用スタイル
│   └── PropertiesPane/
│       ├── PropertiesPane.ts    # ペインコントローラー
│       ├── PropertyEditor.ts    # プロパティ編集UI
│       ├── AnimationControl.ts  # アニメーション制御
│       └── properties.css       # ペイン専用スタイル
├── shared/
│   ├── utils/                   # 共通ユーティリティ
│   ├── components/              # 共通UIコンポーネント
│   └── constants.ts             # 定数定義
└── index.ts                     # エントリーポイント
```

### 🔧 **実装ガイドライン**

#### 1️⃣ **ペインコントローラーの標準実装**
```typescript
abstract class BasePaneController {
    protected abstract paneId: string;
    protected applicationCore: ApplicationCore;
    protected eventBus: EventBus;
    protected element: HTMLElement;
    
    constructor(core: ApplicationCore, element: HTMLElement) {
        this.applicationCore = core;
        this.eventBus = core.eventBus;
        this.element = element;
    }
    
    // 標準ライフサイクル
    abstract initialize(): Promise<void>;
    abstract destroy(): void;
    abstract onShow(): void;
    abstract onHide(): void;
    
    // 標準イベント処理
    protected abstract setupEventHandlers(): void;
    protected abstract handleEvent(event: SpineEditorEvent): Promise<void>;
}

// 具体的な実装例
class PreviewPaneController extends BasePaneController {
    protected paneId = 'preview';
    private spineRenderer: SpineRenderer;
    private boundingBox: BoundingBox;
    
    async initialize(): Promise<void> {
        // Spine描画エンジン初期化
        this.spineRenderer = new SpineRenderer(this.element);
        await this.spineRenderer.initialize();
        
        // バウンディングボックス初期化  
        this.boundingBox = new BoundingBox(this.element);
        
        // イベントハンドラー設定
        this.setupEventHandlers();
    }
}
```

#### 2️⃣ **イベント処理の標準パターン**
```typescript
// イベント送信の標準パターン
class OutlinerPaneController extends BasePaneController {
    private onFileSelected(file: FileData): void {
        const event: FileSelectedEvent = {
            type: 'file-selected',
            source: 'outliner',
            timestamp: Date.now(),
            data: {
                filePath: file.path,
                fileType: file.type,
                metadata: file.metadata
            }
        };
        
        // ApplicationCore経由で送信
        this.applicationCore.handleEvent(event);
    }
}

// イベント受信の標準パターン
class PreviewPaneController extends BasePaneController {
    protected async handleEvent(event: SpineEditorEvent): Promise<void> {
        switch (event.type) {
            case 'spine-load-requested':
                await this.loadSpineCharacter(event.data.filePath);
                break;
                
            case 'position-update':
                this.updateSpinePosition(event.data.position);
                break;
                
            default:
                console.warn(`[Preview] Unknown event: ${event.type}`);
        }
    }
}
```

#### 3️⃣ **状態管理の標準パターン**
```typescript
// ペイン固有の状態管理
class PropertiesPaneController extends BasePaneController {
    private localState = {
        editingProperty: null,
        undoStack: [],
        redoStack: []
    };
    
    // グローバル状態との同期
    private syncWithGlobalState(): void {
        const globalSpineState = this.applicationCore.getState('spine');
        
        // UI更新
        this.updatePositionInputs(globalSpineState.position);
        this.updateScaleInputs(globalSpineState.scale);
        this.updateAnimationSelector(globalSpineState.currentAnimation);
    }
    
    // 変更のグローバル状態への反映
    private propagateChange(property: string, value: any): void {
        const event: PropertyChangedEvent = {
            type: 'property-changed',
            source: 'properties',
            timestamp: Date.now(),
            data: {
                property,
                value,
                previousValue: this.getPreviousValue(property)
            }
        };
        
        this.applicationCore.handleEvent(event);
    }
}
```

### 📊 **品質保証・テスト指針**

#### 🔍 **各ペインの単体テスト**
```typescript
describe('PreviewPaneController', () => {
    let paneController: PreviewPaneController;
    let mockApplicationCore: jest.Mocked<ApplicationCore>;
    
    beforeEach(() => {
        mockApplicationCore = createMockApplicationCore();
        paneController = new PreviewPaneController(
            mockApplicationCore, 
            createMockElement()
        );
    });
    
    test('Spineキャラクター読み込み', async () => {
        const mockSpineData = createMockSpineData();
        
        await paneController.loadSpineCharacter('/path/to/spine.json');
        
        expect(paneController.currentSpine).toBeDefined();
        expect(mockApplicationCore.updateState).toHaveBeenCalledWith(
            'spine.character', 
            expect.objectContaining({path: '/path/to/spine.json'})
        );
    });
});
```

#### 🔗 **ペイン間通信の統合テスト**
```typescript
describe('Pane Integration', () => {
    let application: ApplicationCore;
    let outlinerPane: OutlinerPaneController;
    let previewPane: PreviewPaneController;
    let propertiesPane: PropertiesPaneController;
    
    test('ファイル選択→Spine表示→プロパティ更新フロー', async () => {
        // 1. ファイル選択
        await outlinerPane.selectFile('/project/spine/character.json');
        
        // 2. Preview表示確認
        expect(previewPane.currentSpine).toBeDefined();
        expect(previewPane.isSpineLoaded()).toBe(true);
        
        // 3. Properties更新確認
        expect(propertiesPane.getDisplayedFileName()).toBe('character.json');
        expect(propertiesPane.getPositionInputs()).toEqual({x: 0, y: 0});
    });
});
```

---

## 🚀 Electron化対応設計

### 🎯 **クロスプラットフォーム対応**
同一アーキテクチャでWeb版・Electron版の両対応を実現

#### 🔧 **プラットフォーム抽象化層**
```typescript
interface PlatformAdapter {
    // ファイルシステム操作
    openFileDialog(): Promise<string[]>;
    saveFileDialog(data: Uint8Array, filename: string): Promise<void>;
    readFile(path: string): Promise<Uint8Array>;
    
    // ウィンドウ操作
    setWindowTitle(title: string): void;
    showNotification(message: string): void;
    
    // システム統合
    openInExplorer(path: string): void;
    openInBrowser(url: string): void;
}

// Web版実装
class WebPlatformAdapter implements PlatformAdapter {
    async openFileDialog(): Promise<string[]> {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.onchange = (e) => {
                const files = Array.from(e.target.files || []);
                resolve(files.map(f => f.name));
            };
            input.click();
        });
    }
}

// Electron版実装
class ElectronPlatformAdapter implements PlatformAdapter {
    async openFileDialog(): Promise<string[]> {
        const { dialog } = require('electron').remote;
        const result = await dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections']
        });
        return result.filePaths;
    }
}
```

#### 🔄 **設定の共通化**
```typescript
// 共通設定インターフェース
interface ApplicationConfig {
    platform: 'web' | 'electron';
    dataPath: string;
    tempPath: string;
    maxFileSize: number;
    supportedFormats: string[];
    
    ui: {
        theme: 'light' | 'dark';
        language: string;
        paneSizes: PaneSizeConfig;
    };
    
    spine: {
        quality: 'low' | 'medium' | 'high';
        antiAlias: boolean;
        cacheSize: number;
    };
}

// プラットフォーム別設定
const createApplicationConfig = (platform: 'web' | 'electron'): ApplicationConfig => {
    const baseConfig: ApplicationConfig = {
        platform,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        supportedFormats: ['.json', '.atlas', '.png'],
        ui: {
            theme: 'dark',
            language: 'ja',
            paneSizes: {outliner: 250, properties: 300}
        },
        spine: {
            quality: 'high',
            antiAlias: true,
            cacheSize: 100 * 1024 * 1024 // 100MB
        }
    };
    
    if (platform === 'electron') {
        return {
            ...baseConfig,
            dataPath: require('electron').app.getPath('userData'),
            tempPath: require('electron').app.getPath('temp')
        };
    } else {
        return {
            ...baseConfig,
            dataPath: '/spine-editor-data',
            tempPath: '/tmp'
        };
    }
};
```

---

## 📋 実装チェックリスト

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "3\u30da\u30a4\u30f3\u8cac\u52d9\u5206\u96e2\u8a2d\u8a08\u306e\u7b56\u5b9a", "status": "completed", "activeForm": "3\u30da\u30a4\u30f3\u8cac\u52d9\u5206\u96e2\u8a2d\u8a08\u3092\u7b56\u5b9a\u4e2d"}, {"content": "\u30da\u30a4\u30f3\u9593\u901a\u4fe1\u306eAPI\u4ed5\u69d8\u8a2d\u8a08", "status": "in_progress", "activeForm": "\u30da\u30a4\u30f3\u9593\u901a\u4fe1\u306eAPI\u4ed5\u69d8\u3092\u8a2d\u8a08\u4e2d"}, {"content": "\u30c7\u30fc\u30bf\u7ba1\u7406\u30fb\u4fdd\u5b58\u51e6\u7406\u306e\u5206\u96e2\u8a2d\u8a08", "status": "pending", "activeForm": "\u30c7\u30fc\u30bf\u7ba1\u7406\u30fb\u4fdd\u5b58\u51e6\u7406\u306e\u5206\u96e2\u8a2d\u8a08\u4e2d"}, {"content": "\u30a4\u30d9\u30f3\u30c8\u51e6\u7406\u30d5\u30ed\u30fc\u306e\u8a2d\u8a08", "status": "pending", "activeForm": "\u30a4\u30d9\u30f3\u30c8\u51e6\u7406\u30d5\u30ed\u30fc\u3092\u8a2d\u8a08\u4e2d"}, {"content": "\u5b9f\u88c5\u6642\u306e\u69cb\u9020\u5316\u6307\u91dd\u306e\u7b56\u5b9a", "status": "pending", "activeForm": "\u5b9f\u88c5\u6642\u306e\u69cb\u9020\u5316\u6307\u91dd\u3092\u7b56\u5b9a\u4e2d"}]