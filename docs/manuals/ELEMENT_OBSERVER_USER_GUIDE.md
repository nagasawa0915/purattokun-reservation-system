# ElementObserver Phase 1-2 完全ユーザーマニュアル

## 📋 目次
- [概要・選択指針](#概要選択指針)
- [Phase 1 基本利用](#phase-1-基本利用)
- [Phase 2 高度利用](#phase-2-高度利用)  
- [PureBoundingBox統合](#pureboundingbox統合)
- [実用パターン](#実用パターン)
- [トラブルシューティング](#トラブルシューティング)
- [完全サンプルコード](#完全サンプルコード)

---

## 📊 概要・選択指針

### 🎯 ElementObserverとは
ElementObserverは、DOM要素の位置・サイズ変化を安定的に監視し、複数の座標系を統合管理するシステムです。特にSpineアニメーションとDOMレイアウトの連携で威力を発揮します。

### 🚀 Phase別機能比較

| 機能 | Phase 1 Core | Phase 1 BB特化版 | Phase 2 Advanced |
|------|-------------|----------------|------------------|
| **基本座標管理** | ✅ | ✅ | ✅ |
| **PureBoundingBox連携** | ❌ | ✅ | ✅ |
| **CSS Transform統合** | ❌ | ❌ | ✅ |
| **WebGL座標変換** | ❌ | ❌ | ✅ |
| **レスポンシブ管理** | ❌ | ❌ | ✅ |
| **5座標系統合** | ❌ | ❌ | ✅ |
| **実装難易度** | 低 | 低 | 中〜高 |
| **パフォーマンス** | 軽量 | 軽量 | 高性能 |

### 🧭 選択指針

#### ✅ Phase 1 BB特化版を選ぶべき場合
- PureBoundingBoxと連携する基本的な位置管理
- シンプルな要素監視・親要素サイズ問題の解決
- 学習コストを抑えたい場合
- 軽量性を重視する場合

#### 🚀 Phase 2 Advancedを選ぶべき場合
- SpineアニメーションとDOMの高度連携
- CSS Transform・WebGL・レスポンシブ機能が必要
- 5つの座標系を統一的に管理したい場合
- プロフェッショナルな制作ツール開発

#### 🔧 Phase 1 Coreを選ぶべき場合
- 完全にカスタムな実装が必要
- 他システムの基盤として利用
- 最小限の機能のみ必要

---

## 🎯 Phase 1 基本利用

### 📦 必要ファイル
```html
<!-- Phase 1 Core（基盤） -->
<script src="micromodules/element-observer/ElementObserverCore.js"></script>

<!-- Phase 1 BB特化版（推奨） -->
<script src="micromodules/element-observer/ElementObserver.js"></script>
```

### 🚀 基本的な初期化

#### 1. ElementObserverCore（基盤システム）
```javascript
// 最小限のコアシステム
const core = new ElementObserverCore();

// 要素の監視開始
const targetElement = document.getElementById('my-element');
const unobserve = core.observe(targetElement, (rect, changeType) => {
    console.log('要素変化検出:', {
        changeType, // 'resize', 'mutation', 'scroll'
        size: `${rect.width}x${rect.height}`,
        position: `${rect.left}, ${rect.top}`
    });
}, {
    throttle: true,     // スロットリング有効
    precision: 0.1      // 0.1px未満の変化は無視
});

// 監視停止
unobserve();
```

#### 2. ElementObserver（PureBoundingBox特化版）
```javascript
// PureBoundingBox特化システム
const observer = new ElementObserver();

// 親要素サイズの安定監視（PureBoundingBox向け）
const characterElement = document.querySelector('.spine-character');
const unobserve = observer.observeParentSize(characterElement, (parentRect, isValid) => {
    if (isValid) {
        console.log('有効な親要素サイズ:', parentRect);
        // PureBoundingBox.commitToPercent() などで利用可能
    } else {
        console.warn('無効な親要素サイズ検出');
    }
});

// 安全な親要素矩形取得
const parentRect = observer.getStableParentRect(characterElement);
if (parentRect) {
    console.log('キャッシュされた親矩形:', parentRect);
}
```

### 🔧 Phase 1 主要API

#### ElementObserverCore
| メソッド | 説明 | 戻り値 |
|---------|------|-------|
| `observe(element, callback, options)` | 要素監視開始 | unobserve関数 |
| `unobserve(element)` | 要素監視停止 | void |
| `getElementRect(element)` | 要素矩形取得 | DOMRect |
| `getDebugInfo()` | デバッグ情報取得 | Object |

#### ElementObserver（PureBoundingBox特化）
| メソッド | 説明 | 戻り値 |
|---------|------|-------|
| `observeParentSize(element, callback)` | 親要素サイズ監視 | unobserve関数 |
| `getStableParentRect(element)` | 安定親矩形取得 | DOMRect |
| `isParentSizeValid(element)` | 親サイズ有効性確認 | Boolean |
| `clearParentCache(element)` | 親要素キャッシュクリア | void |

---

## 🚀 Phase 2 高度利用

### 📦 必要ファイル
```html
<!-- Phase 1基盤 -->
<script src="micromodules/element-observer/ElementObserverCore.js"></script>
<script src="micromodules/element-observer/ElementObserver.js"></script>

<!-- Phase 2高度機能 -->
<script src="micromodules/element-observer/ElementObserverTransform.js"></script>
<script src="micromodules/element-observer/ElementObserverWebGL.js"></script>
<script src="micromodules/element-observer/ElementObserverResponsive.js"></script>
<script src="micromodules/element-observer/ElementObserverAdvanced.js"></script>
```

### 🎯 基本初期化
```javascript
// Phase 2統合システム初期化
const advanced = new ElementObserverAdvanced();

// 統合機能の初期化（必須）
await advanced.initializeIntegration();

console.log('Phase 2システム準備完了:', advanced.getIntegrationStatus());
```

### 🌐 5座標系統合システム

ElementObserver Phase 2は、以下5つの座標系を統一管理します：

#### 1. DOM座標系（%基準）
```javascript
// DOM要素の位置設定（%単位）
advanced.setDOMPosition(element, { x: 50, y: 25 }); // 50%, 25%
```

#### 2. CSS Transform座標系
```javascript
// CSS変数による位置制御
advanced.setCSSTransform(element, { 
    tx: 100,      // --tx: 100px
    ty: 50,       // --ty: 50px
    scale: 1.5,   // --scale: 1.5
    rotation: 45  // --rotation: 45deg
});
```

#### 3. WebGL Canvas座標系
```javascript
// WebGL座標での位置管理
advanced.setWebGLPosition(canvas, skeleton, { x: 256, y: 256 });
```

#### 4. Spine Skeleton座標系
```javascript
// Skeletonオブジェクト直接制御
advanced.setSkeletonPosition(skeleton, { x: 0, y: 0, scaleX: 1.2, scaleY: 1.2 });
```

#### 5. Canvas描画座標系
```javascript
// Canvas描画バッファサイズ管理
advanced.setCanvasSize(canvas, { 
    displayWidth: 400, 
    displayHeight: 400,
    bufferWidth: 800,
    bufferHeight: 800 
});
```

### 🎯 統一API：setUnifiedPosition

**最重要機能**: 5つの座標系を一元制御

```javascript
// 統一位置設定（全座標系を自動同期）
advanced.setUnifiedPosition(element, {
    // DOM座標（%）
    domX: 50, domY: 25,
    
    // Transform座標（px）
    transformX: 100, transformY: 50,
    
    // WebGL座標
    webglX: 256, webglY: 256,
    
    // Skeleton座標
    skeletonX: 0, skeletonY: 0,
    
    // スケール・回転（共通）
    scale: 1.5,
    rotation: 45
});

// 自動座標同期の確認
const syncStatus = advanced.getCoordinateSync(element);
console.log('座標同期状況:', syncStatus);
```

### 🔧 Phase 2 主要API

#### ElementObserverAdvanced
| メソッド | 説明 | 主な用途 |
|---------|------|---------|
| `initializeIntegration()` | 統合機能初期化 | 必須初期化処理 |
| `setUnifiedPosition(element, coords)` | 統一位置設定 | **メイン機能** |
| `getCoordinateSync(element)` | 座標同期状況確認 | デバッグ・確認 |
| `enableTransformIntegration(element)` | Transform統合有効化 | CSS Transform制御 |
| `enableWebGLIntegration(canvas, skeleton)` | WebGL統合有効化 | WebGL連携 |
| `enableResponsiveIntegration(canvas)` | レスポンシブ統合有効化 | レスポンシブ対応 |

#### 専門モジュールAPI
| モジュール | 主要メソッド | 用途 |
|-----------|-------------|------|
| **Transform** | `updateCSSVariables()`, `getCombinedTransform()` | CSS Transform管理 |
| **WebGL** | `domToWebGL()`, `webGLToDOM()` | 座標変換 |
| **Responsive** | `updateBufferSize()`, `getCurrentBreakpoint()` | レスポンシブ制御 |

---

## 🎯 PureBoundingBox統合

### 🔄 統合手順

#### 1. Phase 1での基本統合
```javascript
// PureBoundingBox初期化
const boundingBox = new PureBoundingBox({
    targetSelector: '.spine-character',
    containerSelector: '.hero-section'
});

// ElementObserver連携
const observer = new ElementObserver();

// 親要素サイズ監視でPureBoundingBoxを安定化
const unobserve = observer.observeParentSize(
    boundingBox.targetElement, 
    (parentRect, isValid) => {
        if (isValid) {
            // 安全なcommitToPercent実行
            boundingBox.commitToPercent();
        } else {
            console.warn('親要素サイズが無効のため、変換をスキップ');
        }
    }
);
```

#### 2. Phase 2での高度統合
```javascript
// 高度統合システム
const advanced = new ElementObserverAdvanced();
await advanced.initializeIntegration();

// PureBoundingBox + 統一座標管理
const boundingBox = new PureBoundingBox({
    targetSelector: '.spine-character',
    containerSelector: '.hero-section'
});

// 統合監視設定
const integrationUnobserve = advanced.observeIntegratedElement(
    boundingBox.targetElement,
    {
        // PureBoundingBox連携設定
        enableBoundingBoxSync: true,
        boundingBoxInstance: boundingBox,
        
        // 座標系同期設定
        enableUnifiedCoordinates: true,
        
        // レスポンシブ対応
        enableResponsiveSync: true
    },
    (integrationData) => {
        console.log('統合データ更新:', integrationData);
        
        // 統一座標での更新
        advanced.setUnifiedPosition(boundingBox.targetElement, {
            domX: integrationData.domPosition.x,
            domY: integrationData.domPosition.y,
            scale: integrationData.scale,
            rotation: integrationData.rotation
        });
    }
);
```

### 🛠️ 統合パターン

#### パターン1: 親要素サイズ問題の解決
```javascript
const observer = new ElementObserver();
const boundingBox = new PureBoundingBox({ /* 設定 */ });

// 問題: 親要素サイズ0でcommitToPercent失敗
// 解決: ElementObserverで親要素を監視
observer.observeParentSize(boundingBox.targetElement, (parentRect, isValid) => {
    if (isValid && parentRect.width > 0 && parentRect.height > 0) {
        console.log('親要素サイズ有効、変換実行');
        boundingBox.commitToPercent();
    }
});
```

#### パターン2: 座標スワップの安定化
```javascript
const advanced = new ElementObserverAdvanced();
const boundingBox = new PureBoundingBox({ /* 設定 */ });

// 問題: 座標変換タイミングでの競合
// 解決: 統一座標システムでスワップ処理
advanced.enableBoundingBoxIntegration(boundingBox, {
    swapCoordinatesOnSave: true,
    restoreCoordinatesOnCancel: true,
    preventCoordinateConflicts: true
});
```

---

## 🎨 実用パターン

### 🎮 パターン1: Spine + DOM連携
```javascript
// Spineキャラクター + DOM位置の完全同期
const advanced = new ElementObserverAdvanced();
await advanced.initializeIntegration();

// HTML要素とCanvasの関連付け
const characterElement = document.querySelector('.spine-character');
const spineCanvas = document.querySelector('#spine-canvas');
const skeleton = spineApp.skeleton; // Spineスケルトン

// WebGL統合の有効化
advanced.enableWebGLIntegration(spineCanvas, skeleton);

// DOM位置変更 → Spine位置自動同期
characterElement.addEventListener('click', () => {
    advanced.setUnifiedPosition(characterElement, {
        domX: Math.random() * 100,    // DOM位置ランダム
        domY: Math.random() * 100,
        webglX: 256, webglY: 256,     // WebGL中央
        scale: 1.2,                   // 1.2倍スケール
        rotation: 0                   // 回転なし
    });
});
```

### 📱 パターン2: レスポンシブ対応
```javascript
const advanced = new ElementObserverAdvanced();
const canvas = document.querySelector('#responsive-canvas');

// レスポンシブWebGL設定
advanced.enableResponsiveIntegration(canvas, {
    cssWidth: '30%',        // レスポンシブ表示サイズ
    cssHeight: '30%',
    bufferWidth: 512,       // 固定描画サイズ
    bufferHeight: 512,
    quality: 'high',        // 高品質描画
    autoAdjustDPR: true     // DPR自動調整
});

// ブレークポイント変化の監視
advanced.onBreakpointChange((breakpoint, sizes) => {
    console.log('ブレークポイント変化:', breakpoint);
    console.log('新しいサイズ:', sizes);
    
    if (breakpoint === 'mobile') {
        // モバイル用の調整
        advanced.setUnifiedPosition(canvas, {
            domX: 50, domY: 80,  // モバイル用位置
            scale: 0.8           // 小さめスケール
        });
    }
});
```

### 🔄 パターン3: リアルタイム同期
```javascript
const advanced = new ElementObserverAdvanced();

// 複数要素のリアルタイム同期
const elements = [
    document.querySelector('.character-1'),
    document.querySelector('.character-2'), 
    document.querySelector('.character-3')
];

elements.forEach((element, index) => {
    // Transform統合の有効化
    advanced.enableTransformIntegration(element);
    
    // リアルタイム位置同期
    setInterval(() => {
        const time = Date.now() / 1000;
        const offset = index * Math.PI * 2 / elements.length;
        
        advanced.setUnifiedPosition(element, {
            domX: 50 + Math.sin(time + offset) * 20,
            domY: 50 + Math.cos(time + offset) * 20,
            transformX: Math.sin(time * 2 + offset) * 50,
            transformY: Math.cos(time * 2 + offset) * 50,
            rotation: time * 45 + offset * 180 / Math.PI,
            scale: 1 + Math.sin(time * 3 + offset) * 0.3
        });
    }, 16); // 60fps
});
```

### 🎯 パターン4: カスタムアニメーション
```javascript
class CustomSpineAnimation {
    constructor(element, canvas, skeleton) {
        this.element = element;
        this.canvas = canvas;
        this.skeleton = skeleton;
        this.advanced = new ElementObserverAdvanced();
        
        this.init();
    }
    
    async init() {
        await this.advanced.initializeIntegration();
        
        // 全統合機能有効化
        this.advanced.enableTransformIntegration(this.element);
        this.advanced.enableWebGLIntegration(this.canvas, this.skeleton);
        this.advanced.enableResponsiveIntegration(this.canvas);
    }
    
    // カスタムアニメーション: 滑らかな移動
    async moveTo(targetX, targetY, duration = 1000) {
        const startTime = Date.now();
        const startPos = this.advanced.getUnifiedPosition(this.element);
        
        return new Promise(resolve => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeProgress = this.easeInOutCubic(progress);
                
                const currentX = startPos.domX + (targetX - startPos.domX) * easeProgress;
                const currentY = startPos.domY + (targetY - startPos.domY) * easeProgress;
                
                this.advanced.setUnifiedPosition(this.element, {
                    domX: currentX,
                    domY: currentY,
                    webglX: this.domToWebGL(currentX),
                    webglY: this.domToWebGL(currentY)
                });
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            animate();
        });
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    domToWebGL(domPercent) {
        return (domPercent / 100) * this.canvas.width;
    }
}

// 使用例
const customAnim = new CustomSpineAnimation(
    document.querySelector('.spine-character'),
    document.querySelector('#spine-canvas'),
    spineApp.skeleton
);

// 滑らかアニメーション実行
customAnim.moveTo(75, 25, 2000); // 2秒で(75%, 25%)に移動
```

---

## 🔧 トラブルシューティング

### ❌ よくある問題と解決策

#### 1. 初期化エラー
**症状**: `ElementObserverCore is not defined` エラー
```javascript
// ❌ 問題: Core未読み込み
const observer = new ElementObserver();

// ✅ 解決: 正しいファイル読み込み順序
// <script src="ElementObserverCore.js"></script>
// <script src="ElementObserver.js"></script>
```

#### 2. 親要素サイズ0問題
**症状**: PureBoundingBoxで`commitToPercent`が失敗する
```javascript
// ❌ 問題: 親要素サイズチェックなし
boundingBox.commitToPercent(); // 失敗の可能性

// ✅ 解決: ElementObserverで事前チェック
const observer = new ElementObserver();
const parentRect = observer.getStableParentRect(targetElement);
if (parentRect && parentRect.width > 0) {
    boundingBox.commitToPercent();
} else {
    console.warn('親要素サイズが無効');
}
```

#### 3. 座標同期ずれ
**症状**: DOM位置とWebGL位置が同期しない
```javascript
// ❌ 問題: 個別に位置設定
element.style.left = '50%';
skeleton.x = 256;  // ずれる可能性

// ✅ 解決: 統一座標システム利用
advanced.setUnifiedPosition(element, {
    domX: 50,           // 50% 
    webglX: 256,        // WebGL座標
    autoSync: true      // 自動同期有効
});
```

#### 4. パフォーマンス問題
**症状**: 頻繁な座標更新でカクつき
```javascript
// ❌ 問題: 毎フレーム個別更新
setInterval(() => {
    advanced.setUnifiedPosition(element, newPosition);
}, 16);

// ✅ 解決: バッチ更新・スロットリング
advanced.enableBatchUpdates(true);
advanced.setUpdateThrottle(16); // 16ms間隔

// または requestAnimationFrame使用
function updateLoop() {
    if (hasPositionUpdates) {
        advanced.flushBatchedUpdates();
        hasPositionUpdates = false;
    }
    requestAnimationFrame(updateLoop);
}
```

#### 5. メモリリーク
**症状**: 長時間動作でメモリ使用量増加
```javascript
// ❌ 問題: 監視解除忘れ
const unobserve = observer.observeParentSize(element, callback);
// unobserve忘れ

// ✅ 解決: 適切なクリーンアップ
class MyComponent {
    constructor() {
        this.unobservers = [];
    }
    
    startObserving() {
        const unobserve = observer.observeParentSize(element, callback);
        this.unobservers.push(unobserve);
    }
    
    destroy() {
        // 全ての監視を停止
        this.unobservers.forEach(unobserve => unobserve());
        this.unobservers = [];
    }
}
```

### 🔍 デバッグ手法

#### 1. システム状態確認
```javascript
// Phase 1
const debugInfo = observer.getDebugInfo();
console.table(debugInfo);

// Phase 2
const integrationStatus = advanced.getIntegrationStatus();
console.log('統合状況:', integrationStatus);

const coordinateSync = advanced.getCoordinateSync(element);
console.log('座標同期:', coordinateSync);
```

#### 2. リアルタイムモニタリング
```javascript
// 座標変化の監視
advanced.onCoordinateChange(element, (coords, changeType) => {
    console.log(`座標変化[${changeType}]:`, coords);
});

// パフォーマンス監視
advanced.enablePerformanceMonitoring(true);
setInterval(() => {
    const perf = advanced.getPerformanceStats();
    console.log('パフォーマンス:', perf);
}, 1000);
```

#### 3. ビジュアルデバッグ
```javascript
// デバッグ情報の画面表示
advanced.enableVisualDebug(true);

// カスタムデバッグ表示
function showDebugInfo() {
    const debugDiv = document.getElementById('debug-info');
    const status = advanced.getIntegrationStatus();
    debugDiv.innerHTML = `
        <h3>ElementObserver Debug</h3>
        <p>Active Modules: ${status.activeModules.join(', ')}</p>
        <p>Coordinate Systems: ${status.coordinateSystemsActive}</p>
        <p>Last Update: ${new Date(status.lastSyncTimestamp).toLocaleTimeString()}</p>
    `;
}

setInterval(showDebugInfo, 100);
```

---

## 🎯 完全サンプルコード

### 🚀 サンプル1: Phase 1 基本実装

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>ElementObserver Phase 1 サンプル</title>
    <style>
        .container {
            width: 80%;
            height: 400px;
            position: relative;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            margin: 20px auto;
            border-radius: 10px;
        }
        .character {
            position: absolute;
            left: 25%;
            top: 50%;
            width: 100px;
            height: 100px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        .debug-panel {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            max-width: 300px;
        }
    </style>
</head>
<body>
    <div class="container" id="container">
        <div class="character" id="character">キャラクター</div>
    </div>
    
    <div class="debug-panel" id="debug-panel">
        ElementObserver Phase 1 デバッグ情報
    </div>

    <!-- ElementObserver Phase 1 -->
    <script src="micromodules/element-observer/ElementObserverCore.js"></script>
    <script src="micromodules/element-observer/ElementObserver.js"></script>

    <script>
        // Phase 1 基本実装
        class Phase1Sample {
            constructor() {
                this.observer = new ElementObserver();
                this.container = document.getElementById('container');
                this.character = document.getElementById('character');
                this.debugPanel = document.getElementById('debug-panel');
                
                this.init();
            }
            
            init() {
                console.log('Phase 1 サンプル開始');
                
                // 親要素サイズ監視
                this.setupParentSizeObserver();
                
                // インタラクティブ機能
                this.setupInteractions();
                
                // デバッグ表示
                this.startDebugDisplay();
            }
            
            setupParentSizeObserver() {
                // 親要素（container）のサイズ監視
                const unobserve = this.observer.observeParentSize(
                    this.character,
                    (parentRect, isValid) => {
                        console.log('親要素サイズ変化:', {
                            size: parentRect ? `${parentRect.width}x${parentRect.height}` : 'null',
                            isValid,
                            timestamp: new Date().toLocaleTimeString()
                        });
                        
                        if (isValid) {
                            this.updateCharacterPosition(parentRect);
                        }
                    }
                );
                
                // ページ離脱時のクリーンアップ
                window.addEventListener('beforeunload', () => {
                    unobserve();
                });
            }
            
            updateCharacterPosition(parentRect) {
                // 親要素サイズに基づく位置調整
                const newLeft = Math.random() * 80 + 10; // 10-90%
                const newTop = Math.random() * 80 + 10;
                
                this.character.style.left = `${newLeft}%`;
                this.character.style.top = `${newTop}%`;
                
                console.log('キャラクター位置更新:', { newLeft, newTop });
            }
            
            setupInteractions() {
                // クリックで位置変更
                this.character.addEventListener('click', () => {
                    this.updateCharacterPosition();
                });
                
                // ウィンドウリサイズでコンテナサイズ変更テスト
                window.addEventListener('resize', () => {
                    console.log('ウィンドウリサイズ検出');
                });
            }
            
            startDebugDisplay() {
                setInterval(() => {
                    const debugInfo = this.observer.getDebugInfo();
                    const parentRect = this.observer.getStableParentRect(this.character);
                    
                    this.debugPanel.innerHTML = `
                        <h4>ElementObserver Phase 1</h4>
                        <p><strong>監視要素数:</strong> ${debugInfo.totalObservedElements}</p>
                        <p><strong>アクティブ監視:</strong> ${debugInfo.activeObservations}</p>
                        <p><strong>親要素サイズ:</strong> ${
                            parentRect ? `${Math.round(parentRect.width)}x${Math.round(parentRect.height)}` : 'N/A'
                        }</p>
                        <p><strong>最終更新:</strong> ${new Date().toLocaleTimeString()}</p>
                        <p><strong>操作:</strong> キャラクターをクリック</p>
                    `;
                }, 100);
            }
        }
        
        // 初期化
        document.addEventListener('DOMContentLoaded', () => {
            new Phase1Sample();
        });
    </script>
</body>
</html>
```

### 🌟 サンプル2: Phase 2 高度実装

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>ElementObserver Phase 2 統合サンプル</title>
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            color: white;
        }
        .demo-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .control-panel {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 20px;
            backdrop-filter: blur(10px);
        }
        .stage {
            position: relative;
            width: 800px;
            height: 600px;
            background: rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.3);
            margin: 0 auto;
            border-radius: 15px;
            overflow: hidden;
        }
        .character-element {
            position: absolute;
            width: 80px;
            height: 80px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: box-shadow 0.3s ease;
        }
        .character-element:hover {
            box-shadow: 0 6px 20px rgba(0,0,0,0.4);
        }
        .interactive {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: translate(var(--tx, 0), var(--ty, 0)) scale(var(--scale, 1)) rotate(var(--rotation, 0deg));
        }
        .spine-canvas {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border: 2px solid #4ecdc4;
            border-radius: 8px;
            background: rgba(78, 205, 196, 0.1);
        }
        .controls {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .control-group {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 10px;
        }
        button {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 10px 15px;
            margin: 5px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        button:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
        }
        .debug-display {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #4ecdc4;
            padding: 15px;
            border-radius: 10px;
            font-family: monospace;
            font-size: 12px;
            max-width: 350px;
            max-height: 80vh;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="demo-container">
        <h1>🚀 ElementObserver Phase 2 統合システム デモ</h1>
        
        <div class="control-panel">
            <div class="controls">
                <div class="control-group">
                    <h3>🎯 統一座標制御</h3>
                    <button onclick="demo.randomPosition()">ランダム位置</button>
                    <button onclick="demo.centerPosition()">中央配置</button>
                    <button onclick="demo.animatedMove()">滑らか移動</button>
                </div>
                <div class="control-group">
                    <h3>🎨 Transform制御</h3>
                    <button onclick="demo.randomTransform()">ランダム変形</button>
                    <button onclick="demo.resetTransform()">変形リセット</button>
                    <button onclick="demo.spinAnimation()">回転アニメーション</button>
                </div>
                <div class="control-group">
                    <h3>📱 レスポンシブテスト</h3>
                    <button onclick="demo.testMobile()">モバイル表示</button>
                    <button onclick="demo.testDesktop()">デスクトップ表示</button>
                    <button onclick="demo.testDPR()">高DPI対応</button>
                </div>
                <div class="control-group">
                    <h3>🔧 システム制御</h3>
                    <button onclick="demo.enableDebug()">デバッグ表示</button>
                    <button onclick="demo.performanceTest()">パフォーマンステスト</button>
                    <button onclick="demo.resetAll()">全リセット</button>
                </div>
            </div>
        </div>
        
        <div class="stage" id="stage">
            <div class="character-element" id="character1">
                <div class="interactive">C1</div>
            </div>
            <div class="character-element" id="character2" style="left: 70%; top: 30%;">
                <div class="interactive">C2</div>
            </div>
            <canvas class="spine-canvas" id="spine-canvas" width="200" height="200"></canvas>
        </div>
    </div>
    
    <div class="debug-display" id="debug-display">
        デバッグ情報を表示中...
    </div>

    <!-- ElementObserver Phase 2 完全版 -->
    <script src="micromodules/element-observer/ElementObserverCore.js"></script>
    <script src="micromodules/element-observer/ElementObserver.js"></script>
    <script src="micromodules/element-observer/ElementObserverTransform.js"></script>
    <script src="micromodules/element-observer/ElementObserverWebGL.js"></script>
    <script src="micromodules/element-observer/ElementObserverResponsive.js"></script>
    <script src="micromodules/element-observer/ElementObserverAdvanced.js"></script>

    <script>
        // Phase 2 高度統合デモシステム
        class Phase2AdvancedDemo {
            constructor() {
                this.advanced = new ElementObserverAdvanced();
                this.elements = {
                    stage: document.getElementById('stage'),
                    character1: document.getElementById('character1'),
                    character2: document.getElementById('character2'),
                    canvas: document.getElementById('spine-canvas'),
                    debugDisplay: document.getElementById('debug-display')
                };
                
                this.animations = {
                    spinning: false,
                    moving: false
                };
                
                this.init();
            }
            
            async init() {
                console.log('🚀 Phase 2 統合デモ開始');
                
                try {
                    // 統合システム初期化
                    await this.advanced.initializeIntegration();
                    console.log('✅ 統合システム初期化完了');
                    
                    // 各要素の統合機能有効化
                    await this.setupIntegrations();
                    
                    // イベントリスナー設定
                    this.setupInteractions();
                    
                    // デバッグ表示開始
                    this.startDebugDisplay();
                    
                } catch (error) {
                    console.error('❌ 初期化エラー:', error);
                }
            }
            
            async setupIntegrations() {
                // Character 1: Transform統合
                this.advanced.enableTransformIntegration(this.elements.character1);
                console.log('✅ Character 1: Transform統合有効');
                
                // Character 2: Transform統合
                this.advanced.enableTransformIntegration(this.elements.character2);
                console.log('✅ Character 2: Transform統合有効');
                
                // Canvas: WebGL統合（ダミーSkeletonで代用）
                const dummySkeleton = { x: 0, y: 0, scaleX: 1, scaleY: 1 };
                this.advanced.enableWebGLIntegration(this.elements.canvas, dummySkeleton);
                console.log('✅ Canvas: WebGL統合有効');
                
                // Canvas: レスポンシブ統合
                this.advanced.enableResponsiveIntegration(this.elements.canvas, {
                    cssWidth: '200px',
                    cssHeight: '200px',
                    bufferWidth: 400,
                    bufferHeight: 400,
                    quality: 'high'
                });
                console.log('✅ Canvas: レスポンシブ統合有効');
            }
            
            setupInteractions() {
                // キャラクタークリックでランダム移動
                this.elements.character1.addEventListener('click', () => {
                    this.randomPosition(this.elements.character1);
                });
                
                this.elements.character2.addEventListener('click', () => {
                    this.randomTransform(this.elements.character2);
                });
                
                // Canvas描画テスト
                this.setupCanvasTest();
            }
            
            setupCanvasTest() {
                const canvas = this.elements.canvas;
                const ctx = canvas.getContext('2d');
                
                // シンプルなアニメーション描画
                let frame = 0;
                const animate = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    // 中央に円を描画
                    ctx.fillStyle = '#4ecdc4';
                    ctx.beginPath();
                    ctx.arc(
                        canvas.width / 2 + Math.sin(frame / 30) * 20,
                        canvas.height / 2 + Math.cos(frame / 30) * 20,
                        20,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                    
                    // フレーム更新
                    frame++;
                    requestAnimationFrame(animate);
                };
                animate();
            }
            
            // 公開メソッド（ボタンから呼ばれる）
            randomPosition(element = this.elements.character1) {
                const x = Math.random() * 80 + 10; // 10-90%
                const y = Math.random() * 80 + 10;
                
                this.advanced.setUnifiedPosition(element, {
                    domX: x,
                    domY: y,
                    webglX: (x / 100) * this.elements.canvas.width,
                    webglY: (y / 100) * this.elements.canvas.height
                });
                
                console.log(`📍 ${element.id} 位置設定:`, { x, y });
            }
            
            centerPosition() {
                [this.elements.character1, this.elements.character2].forEach(element => {
                    this.advanced.setUnifiedPosition(element, {
                        domX: 50,
                        domY: 50,
                        transformX: 0,
                        transformY: 0,
                        scale: 1,
                        rotation: 0
                    });
                });
                console.log('🎯 全要素を中央配置');
            }
            
            randomTransform(element = this.elements.character1) {
                const transforms = {
                    transformX: (Math.random() - 0.5) * 100,
                    transformY: (Math.random() - 0.5) * 100,
                    scale: Math.random() * 1.5 + 0.5,
                    rotation: Math.random() * 360
                };
                
                this.advanced.setUnifiedPosition(element, transforms);
                console.log(`🎨 ${element.id} Transform:`, transforms);
            }
            
            resetTransform() {
                [this.elements.character1, this.elements.character2].forEach(element => {
                    this.advanced.setUnifiedPosition(element, {
                        transformX: 0,
                        transformY: 0,
                        scale: 1,
                        rotation: 0
                    });
                });
                console.log('🔄 Transform リセット');
            }
            
            async animatedMove() {
                if (this.animations.moving) return;
                
                this.animations.moving = true;
                const element = this.elements.character1;
                const startTime = Date.now();
                const duration = 2000;
                const startPos = { x: 30, y: 30 };
                const endPos = { x: 70, y: 70 };
                
                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const easeProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI);
                    
                    const currentX = startPos.x + (endPos.x - startPos.x) * easeProgress;
                    const currentY = startPos.y + (endPos.y - startPos.y) * easeProgress;
                    
                    this.advanced.setUnifiedPosition(element, {
                        domX: currentX,
                        domY: currentY
                    });
                    
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        this.animations.moving = false;
                        console.log('✅ 滑らか移動完了');
                    }
                };
                
                animate();
            }
            
            spinAnimation() {
                if (this.animations.spinning) {
                    this.animations.spinning = false;
                    return;
                }
                
                this.animations.spinning = true;
                let rotation = 0;
                
                const spin = () => {
                    if (!this.animations.spinning) return;
                    
                    rotation += 5;
                    if (rotation >= 360) rotation = 0;
                    
                    [this.elements.character1, this.elements.character2].forEach(element => {
                        this.advanced.setUnifiedPosition(element, { rotation });
                    });
                    
                    requestAnimationFrame(spin);
                };
                
                spin();
                console.log('🔄 回転アニメーション開始');
            }
            
            testMobile() {
                // モバイル表示テスト
                this.elements.stage.style.width = '350px';
                this.elements.stage.style.height = '400px';
                console.log('📱 モバイル表示テスト');
            }
            
            testDesktop() {
                // デスクトップ表示復元
                this.elements.stage.style.width = '800px';
                this.elements.stage.style.height = '600px';
                console.log('🖥️ デスクトップ表示復元');
            }
            
            testDPR() {
                // DPRテスト
                const currentDPR = window.devicePixelRatio || 1;
                console.log('📏 現在のDPR:', currentDPR);
                
                const canvas = this.elements.canvas;
                canvas.style.imageRendering = 'pixelated';
                setTimeout(() => {
                    canvas.style.imageRendering = 'auto';
                }, 2000);
            }
            
            enableDebug() {
                this.advanced.enableVisualDebug(!this.advanced.isVisualDebugEnabled());
                console.log('🔍 ビジュアルデバッグ切り替え');
            }
            
            performanceTest() {
                console.log('⚡ パフォーマンステスト開始');
                const startTime = Date.now();
                
                for (let i = 0; i < 100; i++) {
                    this.advanced.setUnifiedPosition(this.elements.character1, {
                        domX: Math.random() * 100,
                        domY: Math.random() * 100,
                        transformX: (Math.random() - 0.5) * 50,
                        transformY: (Math.random() - 0.5) * 50,
                        scale: Math.random() * 0.5 + 0.75,
                        rotation: Math.random() * 360
                    });
                }
                
                const elapsed = Date.now() - startTime;
                console.log(`⚡ 100回更新完了: ${elapsed}ms`);
            }
            
            resetAll() {
                this.animations.spinning = false;
                this.animations.moving = false;
                
                this.centerPosition();
                this.resetTransform();
                this.testDesktop();
                
                console.log('🔄 全リセット完了');
            }
            
            startDebugDisplay() {
                setInterval(() => {
                    const integrationStatus = this.advanced.getIntegrationStatus();
                    const coord1 = this.advanced.getCoordinateSync(this.elements.character1);
                    const coord2 = this.advanced.getCoordinateSync(this.elements.character2);
                    
                    this.elements.debugDisplay.innerHTML = `
                        <h4>🚀 ElementObserver Phase 2</h4>
                        <p><strong>統合状況:</strong> ${integrationStatus.initialized ? '✅' : '❌'}</p>
                        <p><strong>アクティブモジュール:</strong> ${integrationStatus.activeModules.length}</p>
                        <p><strong>座標系数:</strong> ${integrationStatus.coordinateSystemsActive}</p>
                        
                        <h5>🎯 Character 1</h5>
                        <p>DOM: ${coord1.dom ? `${Math.round(coord1.dom.x)}%, ${Math.round(coord1.dom.y)}%` : 'N/A'}</p>
                        <p>Transform: ${coord1.transform ? `${Math.round(coord1.transform.tx)}px, ${Math.round(coord1.transform.ty)}px` : 'N/A'}</p>
                        <p>Scale: ${coord1.transform ? coord1.transform.scale.toFixed(2) : 'N/A'}</p>
                        <p>Rotation: ${coord1.transform ? Math.round(coord1.transform.rotation) : 'N/A'}°</p>
                        
                        <h5>🎨 Character 2</h5>
                        <p>DOM: ${coord2.dom ? `${Math.round(coord2.dom.x)}%, ${Math.round(coord2.dom.y)}%` : 'N/A'}</p>
                        
                        <p><small>最終同期: ${new Date(integrationStatus.lastSyncTimestamp).toLocaleTimeString()}</small></p>
                    `;
                }, 100);
            }
        }
        
        // デモインスタンス作成（グローバルからアクセス可能）
        let demo;
        document.addEventListener('DOMContentLoaded', async () => {
            demo = new Phase2AdvancedDemo();
        });
    </script>
</body>
</html>
```

---

## 📚 まとめ

### 🎯 Phase選択の最終指針

| ニーズ | 推奨Phase | 理由 |
|-------|----------|------|
| **基本的な位置管理** | Phase 1 BB特化版 | シンプル・軽量・学習コスト低 |
| **PureBoundingBox統合** | Phase 1 BB特化版 | 専用設計・安定性重視 |
| **Spine + DOM高度連携** | Phase 2 Advanced | 5座標系統合・統一API |
| **レスポンシブWebGL** | Phase 2 Advanced | 専門モジュール完備 |
| **プロフェッショナルツール開発** | Phase 2 Advanced | 商用品質・拡張性 |
| **カスタム実装** | Phase 1 Core | 最小基盤・柔軟性重視 |

### 🚀 実装の進め方

1. **Phase 1で基礎を固める** - 基本機能の理解・安定動作確認
2. **要件に応じてPhase 2** - 高度機能が必要になったら移行
3. **段階的な統合** - 一度に全機能を使わず、必要な部分から導入
4. **十分なテスト** - 各Phase独自のテスト環境で動作確認
5. **適切なクリーンアップ** - メモリリーク防止のため監視解除を忘れずに

### 📖 参考リソース

- **CURRENT_SYSTEM_STATUS.md** - システム現状・構成詳細
- **test-element-observer-phase2-integration.html** - Phase 2動作テスト環境
- **micromodules/element-observer/** - 各モジュールのソースコード

このマニュアルにより、他のAI開発者も ElementObserver を完全に理解・実装できるはずです。不明な点があれば、実際のコードファイルを参照してください。

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "ElementObserver\u306e\u5404\u30e2\u30b8\u30e5\u30fc\u30eb\u30d5\u30a1\u30a4\u30eb\u3092\u8a73\u7d30\u5206\u6790", "status": "completed", "activeForm": "ElementObserver\u30e2\u30b8\u30e5\u30fc\u30eb\u5206\u6790\u4e2d"}, {"content": "Phase 1-2\u306e\u6a5f\u80fd\u6bd4\u8f03\u30fb\u9078\u629e\u6307\u91dd\u3092\u660e\u78ba\u5316", "status": "completed", "activeForm": "Phase\u6bd4\u8f03\u5206\u6790\u4e2d"}, {"content": "\u5b9f\u7528\u30d1\u30bf\u30fc\u30f3\u30fb\u7d71\u5408\u4f8b\u306e\u30b3\u30fc\u30c9\u4f5c\u6210", "status": "completed", "activeForm": "\u5b9f\u7528\u30b3\u30fc\u30c9\u4f8b\u4f5c\u6210\u4e2d"}, {"content": "\u5b8c\u5168\u30e6\u30fc\u30b6\u30fc\u30de\u30cb\u30e5\u30a2\u30eb\u4f5c\u6210", "status": "completed", "activeForm": "\u30e6\u30fc\u30b6\u30fc\u30de\u30cb\u30e5\u30a2\u30eb\u4f5c\u6210\u4e2d"}]