# SpineRenderer API技術仕様書

## 📋 API設計詳細

### クラス構造設計

```javascript
/**
 * SpineRenderer - 汎用Spineレンダリングモジュール
 * 
 * 責務:
 * - Spineキャラクターの安定描画
 * - WebGLコンテキスト管理・復旧
 * - レンダリングループ制御
 * - エラー処理・フォールバック
 */
class SpineRenderer {
    // === コンストラクタ ===
    constructor(options = {})
    
    // === 初期化API ===
    async initialize(spineData = null) : Promise<boolean>
    isInitialized() : boolean
    getInitializationStatus() : InitializationStatus
    
    // === 描画API ===
    render(skeleton, animationState = null) : void
    renderFrame(deltaTime) : void
    startRenderLoop() : void
    stopRenderLoop() : void
    
    // === キャラクター管理API ===
    async loadCharacter(characterConfig) : Promise<Character>
    removeCharacter(characterName) : boolean
    getCharacter(characterName) : Character | null
    getAllCharacters() : Character[]
    
    // === カメラ・表示制御API ===
    setCamera(position, viewport) : void
    setCameraPosition(x, y) : void
    setCameraViewport(width, height) : void
    setBackground(color) : void
    setCanvasSize(width, height) : void
    
    // === アニメーション制御API ===
    updateAnimation(character, deltaTime) : void
    setAnimation(character, animationName, loop = true) : AnimationTrack
    playAnimation(character, animationName, options = {}) : Promise<void>
    stopAnimation(character, track = 0) : void
    
    // === WebGL管理API ===
    getWebGLContext() : WebGLRenderingContext
    isWebGLSupported() : boolean
    restoreWebGLContext() : Promise<boolean>
    
    // === リソース管理API ===
    dispose() : void
    cleanup() : void
    clearCache() : void
    getMemoryUsage() : MemoryUsage
    
    // === エラー処理・診断API ===
    getStatus() : RendererStatus
    getLastError() : Error | null
    enableDebugMode(enabled = true) : void
    runDiagnostics() : DiagnosticsResult
    
    // === イベントAPI ===
    on(eventName, callback) : void
    off(eventName, callback) : void
    emit(eventName, ...args) : void
    
    // === 設定API ===
    setConfig(config) : void
    getConfig() : RendererConfig
    updateConfig(partialConfig) : void
}
```

---

## 🔧 データ型定義

### 基本型定義

```typescript
// レンダラー設定
interface RendererConfig {
    // 必須設定
    canvas: HTMLCanvasElement;
    
    // レンダリング設定
    renderMode: 'stable' | 'debug' | 'performance';
    frameRate: 30 | 60 | 120;
    errorRecovery: boolean;
    debugMode: boolean;
    
    // WebGL設定
    webglOptions: {
        alpha: boolean;
        premultipliedAlpha: boolean;
        antialias: boolean;
        depth: boolean;
        stencil: boolean;
        preserveDrawingBuffer: boolean;
        failIfMajorPerformanceCaveat: boolean;
    };
    
    // カメラ設定
    camera: {
        position: { x: number, y: number };
        viewport: { width: number, height: number };
        autoResize: boolean;
    };
    
    // 背景設定
    background: {
        r: number;
        g: number; 
        b: number;
        a: number;
    };
    
    // パフォーマンス設定
    performance: {
        maxCharacters: number;
        memoryLimit: number; // MB
        autoCleanup: boolean;
        backgroundPause: boolean;
    };
}

// キャラクター設定
interface CharacterConfig {
    name: string;
    atlasPath: string;
    jsonPath: string;
    basePath?: string;
    
    // 表示設定
    position: { x: number, y: number };
    scale: { x: number, y: number } | number;
    rotation: number;
    alpha: number;
    visible: boolean;
    
    // アニメーション設定
    defaultAnimation?: string;
    animationSpeed: number;
    loop: boolean;
    
    // 当たり判定設定
    bounds?: {
        enabled: boolean;
        debug: boolean;
    };
}

// キャラクター実体
interface Character {
    name: string;
    config: CharacterConfig;
    skeleton: spine.Skeleton;
    animationState: spine.AnimationState;
    spineData: any;
    
    // 状態管理
    isLoaded: boolean;
    isVisible: boolean;
    currentAnimation: string | null;
    
    // メソッド
    setPosition(x: number, y: number): void;
    setScale(scale: number | { x: number, y: number }): void;
    setRotation(rotation: number): void;
    setAlpha(alpha: number): void;
    show(): void;
    hide(): void;
}
```

### ステータス型定義

```typescript
// 初期化状態
interface InitializationStatus {
    initialized: boolean;
    webglSupported: boolean;
    spineLoaded: boolean;
    charactersLoaded: number;
    totalCharacters: number;
    initializationTime: number; // ms
    errors: string[];
}

// レンダラー状態
interface RendererStatus {
    // 基本状態
    running: boolean;
    renderMode: string;
    frameRate: number;
    
    // WebGL状態
    webgl: {
        supported: boolean;
        contextLost: boolean;
        vendor: string;
        renderer: string;
    };
    
    // パフォーマンス状態
    performance: {
        fps: number;
        frameTime: number; // ms
        memoryUsage: number; // MB
        drawCalls: number;
    };
    
    // エラー状態
    lastError: string | null;
    errorCount: number;
    warnings: string[];
}

// メモリ使用量
interface MemoryUsage {
    total: number; // MB
    textures: number; // MB
    buffers: number; // MB
    other: number; // MB
    characters: {
        name: string;
        memory: number; // MB
    }[];
}

// 診断結果
interface DiagnosticsResult {
    timestamp: number;
    webglSupport: boolean;
    spineVersion: string;
    canvasSize: { width: number, height: number };
    charactersStatus: {
        name: string;
        loaded: boolean;
        visible: boolean;
        animating: boolean;
        memoryUsage: number; // MB
    }[];
    recommendations: string[];
}
```

---

## ⚡ API使用例

### 基本的な使用方法

```javascript
// 1. 基本初期化
const renderer = new SpineRenderer({
    canvas: document.getElementById('spine-canvas'),
    renderMode: 'stable',
    frameRate: 60
});

// 2. 初期化実行
const initialized = await renderer.initialize();
if (!initialized) {
    console.error('SpineRenderer初期化失敗');
    return;
}

// 3. キャラクター読み込み
const purattokun = await renderer.loadCharacter({
    name: 'purattokun',
    atlasPath: 'characters/purattokun/purattokun.atlas',
    jsonPath: 'characters/purattokun/purattokun.json',
    position: { x: 150, y: 300 },
    scale: 0.6,
    defaultAnimation: 'idle'
});

// 4. レンダリング開始
renderer.startRenderLoop();

// 5. アニメーション制御
await renderer.playAnimation(purattokun, 'walk');
```

### 高度な使用方法

```javascript
// カスタム設定での初期化
const renderer = new SpineRenderer({
    canvas: canvas,
    renderMode: 'debug',
    frameRate: 60,
    errorRecovery: true,
    debugMode: true,
    
    webglOptions: {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false // パフォーマンス重視
    },
    
    camera: {
        position: { x: 0, y: 0 },
        viewport: { width: 800, height: 600 },
        autoResize: true
    },
    
    background: { r: 0, g: 0, b: 0, a: 0.1 },
    
    performance: {
        maxCharacters: 5,
        memoryLimit: 256,
        autoCleanup: true,
        backgroundPause: true
    }
});

// エラーハンドリング
renderer.on('error', (error) => {
    console.error('SpineRenderer エラー:', error);
});

renderer.on('webglcontextlost', () => {
    console.warn('WebGLコンテキストロスト - 復旧中...');
});

renderer.on('webglcontextrestored', () => {
    console.log('WebGLコンテキスト復旧完了');
});

// キャラクター管理
const characters = await Promise.all([
    renderer.loadCharacter({
        name: 'purattokun',
        atlasPath: 'characters/purattokun/purattokun.atlas',
        jsonPath: 'characters/purattokun/purattokun.json',
        position: { x: 200, y: 300 },
        scale: 0.6
    }),
    renderer.loadCharacter({
        name: 'nezumi',
        atlasPath: 'characters/nezumi/nezumi.atlas', 
        jsonPath: 'characters/nezumi/nezumi.json',
        position: { x: 400, y: 300 },
        scale: 0.8
    })
]);

// レンダリングループ制御
renderer.startRenderLoop();

// パフォーマンス監視
setInterval(() => {
    const status = renderer.getStatus();
    console.log(`FPS: ${status.performance.fps}, Memory: ${status.performance.memoryUsage}MB`);
}, 5000);
```

### PureSpineLoader統合例

```javascript
// PureSpineLoader統合使用
const renderer = new SpineRenderer({
    canvas: canvas,
    renderMode: 'stable'
});

await renderer.initialize();

// PureSpineLoaderでアセット読み込み
const spineData = await PureSpineLoader.load({
    atlasPath: 'characters/purattokun/purattokun.atlas',
    jsonPath: 'characters/purattokun/purattokun.json',
    basePath: 'characters/purattokun/'
});

// SpineRendererにキャラクター追加
const character = await renderer.loadCharacterFromSpineData({
    name: 'purattokun',
    spineData: spineData,
    position: { x: 300, y: 400 },
    scale: 0.7
});

renderer.startRenderLoop();
```

---

## 🔒 エラー処理仕様

### エラーレベル定義

```javascript
// エラーレベル
const ErrorLevels = {
    DEBUG: 0,    // デバッグ情報
    INFO: 1,     // 情報
    WARNING: 2,  // 警告
    ERROR: 3,    // エラー
    CRITICAL: 4  // 致命的エラー
};

// エラータイプ
const ErrorTypes = {
    INITIALIZATION: 'initialization',
    WEBGL_CONTEXT: 'webgl_context', 
    ASSET_LOADING: 'asset_loading',
    RENDERING: 'rendering',
    MEMORY: 'memory',
    CONFIGURATION: 'configuration'
};
```

### エラーハンドリングAPI

```javascript
class SpineRenderer {
    // エラー情報取得
    getLastError() {
        return {
            type: this.lastError?.type,
            message: this.lastError?.message,
            timestamp: this.lastError?.timestamp,
            stack: this.lastError?.stack,
            context: this.lastError?.context
        };
    }
    
    // エラー履歴取得
    getErrorHistory(limit = 10) {
        return this.errorHistory.slice(-limit);
    }
    
    // エラー回復試行
    async attemptRecovery() {
        switch (this.lastError?.type) {
            case ErrorTypes.WEBGL_CONTEXT:
                return await this.restoreWebGLContext();
                
            case ErrorTypes.ASSET_LOADING:
                return await this.reloadFailedAssets();
                
            case ErrorTypes.MEMORY:
                this.clearCache();
                return true;
                
            default:
                return false;
        }
    }
    
    // 診断実行
    runDiagnostics() {
        const result = {
            timestamp: Date.now(),
            webglSupport: this.isWebGLSupported(),
            spineVersion: window.spine?.version || 'unknown',
            canvasSize: {
                width: this.canvas.width,
                height: this.canvas.height
            },
            charactersStatus: this.getAllCharacters().map(char => ({
                name: char.name,
                loaded: char.isLoaded,
                visible: char.isVisible,
                animating: char.currentAnimation !== null,
                memoryUsage: this.getCharacterMemoryUsage(char.name)
            })),
            recommendations: []
        };
        
        // 推奨事項生成
        if (!result.webglSupport) {
            result.recommendations.push('WebGLがサポートされていません。Canvas2Dフォールバックを検討してください。');
        }
        
        if (result.charactersStatus.some(char => !char.loaded)) {
            result.recommendations.push('読み込み失敗したキャラクターがあります。アセットパスを確認してください。');
        }
        
        const totalMemory = this.getMemoryUsage().total;
        if (totalMemory > this.config.performance.memoryLimit * 0.8) {
            result.recommendations.push('メモリ使用量が上限の80%を超えています。キャッシュのクリアを検討してください。');
        }
        
        return result;
    }
}
```

---

## 📊 パフォーマンス仕様

### フレームレート制御

```javascript
// フレームレート設定
class RenderLoop {
    constructor(targetFrameRate = 60) {
        this.targetFrameRate = targetFrameRate;
        this.targetFrameTime = 1000 / targetFrameRate;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fpsHistory = [];
        this.maxFpsHistorySize = 60; // 1秒間のFPS履歴
    }
    
    // 可変フレームレート制御
    setFrameRate(frameRate) {
        this.targetFrameRate = frameRate;
        this.targetFrameTime = 1000 / frameRate;
    }
    
    // アダプティブフレームレート
    enableAdaptiveFrameRate(enabled = true) {
        this.adaptiveFrameRate = enabled;
    }
    
    // パフォーマンス監視
    getPerformanceMetrics() {
        const recentFps = this.fpsHistory.slice(-30);
        return {
            currentFps: this.getCurrentFps(),
            averageFps: recentFps.reduce((a, b) => a + b, 0) / recentFps.length,
            minFps: Math.min(...recentFps),
            maxFps: Math.max(...recentFps),
            frameDrops: this.frameDropCount,
            totalFrames: this.frameCount
        };
    }
}
```

### メモリ管理仕様

```javascript
class MemoryManager {
    constructor(maxMemoryMB = 256) {
        this.maxMemory = maxMemoryMB * 1024 * 1024; // bytes
        this.currentUsage = 0;
        this.assetCache = new Map();
        this.cleanupThreshold = 0.8; // 80%でクリーンアップ開始
    }
    
    // メモリ使用量チェック
    checkMemoryUsage() {
        const usage = this.getCurrentMemoryUsage();
        
        if (usage / this.maxMemory > this.cleanupThreshold) {
            this.performCleanup();
        }
        
        return usage;
    }
    
    // 自動クリーンアップ
    performCleanup() {
        // LRU戦略でアセットキャッシュをクリア
        const sortedAssets = Array.from(this.assetCache.entries())
            .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
            
        const assetsToRemove = sortedAssets.slice(0, Math.floor(sortedAssets.length * 0.3));
        
        for (const [key] of assetsToRemove) {
            this.assetCache.delete(key);
        }
        
        // WebGLリソースの解放
        this.cleanupWebGLResources();
    }
    
    // WebGLリソース解放
    cleanupWebGLResources() {
        // 使用されていないテクスチャ・バッファの解放
        for (const character of this.characters.values()) {
            if (!character.isVisible && character.lastRenderTime < Date.now() - 30000) {
                character.releaseGPUResources();
            }
        }
    }
}
```

---

## 🔧 設定駆動型実装

### 設定ファイル形式

```json
{
  "renderer": {
    "renderMode": "stable",
    "frameRate": 60,
    "errorRecovery": true,
    "debugMode": false
  },
  
  "webgl": {
    "alpha": true,
    "premultipliedAlpha": true,
    "antialias": true,
    "depth": false,
    "stencil": false
  },
  
  "camera": {
    "position": { "x": 400, "y": 300 },
    "viewport": { "width": 800, "height": 600 },
    "autoResize": true
  },
  
  "performance": {
    "maxCharacters": 10,
    "memoryLimit": 512,
    "autoCleanup": true,
    "backgroundPause": true
  },
  
  "characters": [
    {
      "name": "purattokun",
      "atlasPath": "characters/purattokun/purattokun.atlas",
      "jsonPath": "characters/purattokun/purattokun.json", 
      "position": { "x": 200, "y": 400 },
      "scale": 0.6,
      "defaultAnimation": "idle",
      "visible": true
    },
    {
      "name": "nezumi",
      "atlasPath": "characters/nezumi/nezumi.atlas",
      "jsonPath": "characters/nezumi/nezumi.json",
      "position": { "x": 600, "y": 400 },
      "scale": 0.8,
      "defaultAnimation": "walk",
      "visible": true
    }
  ]
}
```

### 設定読み込みAPI

```javascript
class SpineRenderer {
    // JSON設定から初期化
    static async fromConfig(configPath, canvas) {
        const response = await fetch(configPath);
        const config = await response.json();
        
        const renderer = new SpineRenderer({
            canvas: canvas,
            ...config.renderer,
            webglOptions: config.webgl,
            camera: config.camera,
            performance: config.performance
        });
        
        await renderer.initialize();
        
        // キャラクター一括読み込み
        for (const charConfig of config.characters) {
            await renderer.loadCharacter(charConfig);
        }
        
        return renderer;
    }
    
    // 設定の動的更新
    updateConfig(partialConfig) {
        this.config = { ...this.config, ...partialConfig };
        
        // 設定変更の適用
        if (partialConfig.frameRate) {
            this.renderLoop.setFrameRate(partialConfig.frameRate);
        }
        
        if (partialConfig.camera) {
            this.setCamera(partialConfig.camera.position, partialConfig.camera.viewport);
        }
        
        if (partialConfig.background) {
            this.setBackground(partialConfig.background);
        }
    }
}
```

---

## 📋 まとめ

### API設計の特徴

1. **直感的**: JavaScriptの慣習に従った自然なAPI
2. **型安全**: TypeScript型定義による設計時検証
3. **拡張可能**: プラグイン・カスタム設定による機能拡張
4. **エラー耐性**: 包括的なエラー処理・回復機能
5. **パフォーマンス重視**: メモリ管理・フレームレート制御

### 実装優先度

**Phase 1 (核心API)**:
- SpineRenderer基本クラス
- 初期化・描画・リソース管理API
- WebGLコンテキスト管理

**Phase 2 (安定性)**:
- エラー処理・回復システム
- メモリ管理・パフォーマンス監視
- 診断・デバッグ機能

**Phase 3 (汎用性)**:
- 設定駆動型実装
- PureSpineLoader統合
- イベント・プラグインシステム

この技術仕様書に基づいて、段階的な実装により確実で安定したSpineRendererシステムの構築が可能です。