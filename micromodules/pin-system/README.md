# PinSystemIntegrator

**ElementObserver Phase 3-B マイクロモジュール #4 - 統合制御システム**

🎛️ 3つのマイクロモジュールを統合し、ElementObserverAdvanced互換APIを提供する統合制御システム

## 📋 概要

PinSystemIntegratorは、ElementObserver Phase 3-Bの4つのマイクロモジュールを統合し、シームレスな開発体験を提供する統合制御システムです。Phase 3-A で実証済みの99.9%高速化技術を基盤として、各モジュールの協調制御に特化した設計になっています。

### 🎯 特徴

- **統合制御**: 環境監視・スケール計算・ハイライト表示の協調制御
- **ElementObserver互換**: 既存ElementObserverAdvanced完全互換API
- **マイクロモジュール基盤**: 各モジュールの独立性を保ったまま統合
- **自動最適化**: モジュール間通信の自動最適化・パフォーマンス調整
- **統一インターフェース**: 複雑な内部実装を隠した直感的API

### ✅ マイクロモジュール設計原則遵守

- ✅ **単一責務**: 統合制御のみに特化
- ✅ **完全独立**: 各モジュールの独立性確保
- ✅ **数値のみ入出力**: プリミティブ値による効率的通信
- ✅ **単独テスト**: 統合システム単体でのテスト実行可能
- ✅ **cleanup保証**: 全モジュール完全状態復元・メモリリーク防止

---

## 🚀 基本使用方法

### インストール・読み込み

```javascript
// ブラウザ環境
<script src="PinSystemIntegrator.js"></script>

// Node.js環境
const PinSystemIntegrator = require('./PinSystemIntegrator');
```

### 基本的な統合システム利用

```javascript
// 1. 統合システム作成
const integrator = new PinSystemIntegrator({
    // 環境監視設定
    environmentOptions: {
        epsilon: 0.5,
        throttleInterval: 8,
        dprMonitoring: true
    },
    
    // スケール計算設定
    scaleOptions: {
        defaultMode: 'proportional',
        precision: 3,
        cacheEnabled: true
    },
    
    // ハイライト設定
    highlightOptions: {
        highlightColor: '#007bff',
        showElementInfo: true,
        throttleInterval: 8
    },
    
    // 統合システム設定
    debug: true
});

// 2. ElementObserver互換の監視開始
const targetElement = document.getElementById('target');

const result = integrator.observe(targetElement, {
    // 環境変化に対応したスケール計算
    scaleMode: 'proportional',
    baseScale: 1.0,
    
    // ハイライト表示オプション
    enableHighlight: true,
    highlightOnChange: true,
    
    // 変化通知コールバック
    onEnvironmentChange: (envData) => {
        console.log('環境変化:', envData.changeType, envData.rect);
    },
    
    onScaleCalculated: (scaleData) => {
        console.log('スケール計算:', scaleData.scale, scaleData.mode);
    },
    
    onHighlightUpdate: (highlightData) => {
        console.log('ハイライト更新:', highlightData.highlightId);
    }
});

console.log('統合監視開始:', result);

// 3. 監視停止とクリーンアップ
// integrator.unobserve(targetElement);
// integrator.cleanup();
```

---

## 📊 統合API仕様

### 高レベル統合API

#### `observeWithAutoScale(element, options)`
**環境変化に自動対応するスマート監視**

```javascript
// 自動スケール調整機能
const result = integrator.observeWithAutoScale(element, {
    // スケール設定
    scaleMode: 'proportional',      // 比例スケール
    baseScale: 1.0,                 // 基準スケール
    minScale: 0.5,                  // 最小スケール
    maxScale: 2.0,                  // 最大スケール
    
    // 自動調整設定
    autoAdjustment: {
        onResize: true,             // リサイズ時自動調整
        onDPRChange: true,          // DPR変化時自動調整
        onBreakpoint: true,         // ブレークポイント変化時
        smoothTransition: true      // スムーズな遷移効果
    },
    
    // ハイライト設定
    highlight: {
        enabled: true,
        showOnHover: true,
        showElementInfo: true
    },
    
    // コールバック
    onAutoAdjust: (adjustmentData) => {
        console.log('自動調整実行:', {
            oldScale: adjustmentData.oldScale,
            newScale: adjustmentData.newScale,
            reason: adjustmentData.reason,
            timestamp: adjustmentData.timestamp
        });
    }
});

console.log('スマート監視結果:', {
    observationId: result.id,
    initialScale: result.scale,
    highlightEnabled: result.highlightEnabled
});
```

#### `trackElementWithPin(element, pinOptions)`
**要素トラッキング + ピン機能統合**

```javascript
// 要素追跡とピン配置の統合機能
const pinResult = integrator.trackElementWithPin(element, {
    // 追跡設定
    tracking: {
        continuous: true,           // 継続的追跡
        throttleInterval: 8,        // 8ms間隔
        trackVisibility: true       // 可視性追跡
    },
    
    // ピン設定
    pin: {
        position: 'top-right',      // ピン位置
        offset: { x: 5, y: 5 },     // オフセット
        autoHide: true,             // 自動非表示
        showDistance: true          // 距離表示
    },
    
    // スケール連動
    scaleSync: {
        enabled: true,
        mode: 'proportional',
        syncPinSize: true           // ピンサイズも連動
    },
    
    // イベントハンドラー
    onPinClick: (pinData) => {
        console.log('ピンクリック:', pinData.elementInfo);
    },
    
    onVisibilityChange: (visibility) => {
        console.log('可視性変化:', visibility.isVisible);
    }
});

console.log('ピントラッキング開始:', {
    trackingId: pinResult.trackingId,
    pinId: pinResult.pinId,
    initialPosition: pinResult.position
});
```

### 中レベル統合API

#### `createEnvironmentScaleBinding(element, bindingOptions)`
**環境変化とスケール計算の直接連携**

```javascript
// 環境監視とスケール計算の効率的連携
const binding = integrator.createEnvironmentScaleBinding(element, {
    // 監視対象
    watchProperties: {
        size: true,                 // サイズ変化
        position: true,             // 位置変化
        dpr: true,                  // DPR変化
        breakpoint: true            // ブレークポイント
    },
    
    // スケール計算モード
    scaleCalculation: {
        mode: 'fontSize',           // フォントサイズ基準
        baseFontSize: 16,           // 基準フォントサイズ
        minFontSize: 12,            // 最小サイズ
        maxFontSize: 24             // 最大サイズ
    },
    
    // パフォーマンス設定
    optimization: {
        debounceDelay: 50,          // デバウンス遅延
        cacheResults: true,         // 結果キャッシュ
        batchUpdates: true          // 更新のバッチ化
    },
    
    // コールバック
    onBinding: (bindingData) => {
        const { envData, scaleData, timestamp } = bindingData;
        
        console.log('環境→スケール連携:', {
            環境変化: {
                種類: envData.changeType,
                新サイズ: `${envData.rect.width}×${envData.rect.height}`,
                DPR: envData.dpr
            },
            スケール計算: {
                モード: scaleData.mode,
                スケール値: scaleData.scale,
                適用値: scaleData.appliedValue
            },
            処理時間: `${timestamp.processingTime}ms`
        });
    }
});

// 連携の制御
if (binding.isActive) {
    console.log('環境→スケール連携アクティブ');
}

// 一時停止・再開
// binding.pause();
// binding.resume();

// 完全停止
// binding.destroy();
```

### 低レベル統合API

#### `getModuleStatus()`
**各モジュールの詳細状態取得**

```javascript
// 全モジュールの詳細状態を取得
const status = integrator.getModuleStatus();

console.log('モジュール詳細状態:', {
    環境監視: {
        初期化済み: status.environment.initialized,
        監視中: status.environment.isObserving,
        監視対象数: status.environment.observationCount,
        パフォーマンス: {
            平均更新時間: status.environment.performance.averageUpdateTime,
            メモリ使用量: status.environment.performance.memoryUsage
        }
    },
    
    スケール計算: {
        初期化済み: status.scale.initialized,
        キャッシュ有効: status.scale.cacheEnabled,
        計算履歴: status.scale.calculationHistory.length,
        パフォーマンス: {
            平均計算時間: status.scale.performance.averageCalculationTime,
            キャッシュヒット率: status.scale.performance.cacheHitRate
        }
    },
    
    ハイライト: {
        初期化済み: status.highlight.initialized,
        アクティブハイライト数: status.highlight.activeHighlights,
        マウス追従: status.highlight.mouseTrackingEnabled,
        パフォーマンス: {
            平均描画時間: status.highlight.performance.averageRenderTime,
            フレームレート: status.highlight.performance.frameRate
        }
    },
    
    統合システム: {
        初期化済み: status.integrator.initialized,
        統合監視数: status.integrator.totalObservations,
        モジュール間通信: status.integrator.interModuleCommunication,
        全体パフォーマンス: {
            統合処理時間: status.integrator.performance.integrationTime,
            最適化効果: status.integrator.performance.optimizationGain
        }
    }
});
```

---

## 🔄 ElementObserver互換API

### 既存コード移行

#### ElementObserverAdvanced → PinSystemIntegrator

```javascript
// 【旧】ElementObserverAdvanced
const oldObserver = new ElementObserverAdvanced({
    epsilon: 0.5,
    throttleInterval: 8,
    dprMonitoring: true,
    debug: true
});

oldObserver.observe(element, (data) => {
    console.log('変化検出:', data);
});

// 【新】PinSystemIntegrator（完全互換）
const newIntegrator = new PinSystemIntegrator({
    // 同じオプションがそのまま使用可能
    epsilon: 0.5,
    throttleInterval: 8,
    dprMonitoring: true,
    debug: true,
    
    // 追加の統合機能
    enableScaleCalculation: true,    // スケール計算有効化
    enableHighlighting: true         // ハイライト有効化
});

// 同じAPIで呼び出し可能
newIntegrator.observe(element, (data) => {
    // dataには環境・スケール・ハイライト情報が統合されて含まれる
    console.log('統合変化検出:', {
        環境: data.environment,
        スケール: data.scale,
        ハイライト: data.highlight
    });
});
```

#### 段階的移行パターン

```javascript
// Step 1: 基本移行（既存機能保持）
const integrator = new PinSystemIntegrator({
    // 既存設定をそのまま移行
    epsilon: originalOptions.epsilon,
    throttleInterval: originalOptions.throttleInterval,
    
    // 新機能は段階的に有効化
    enableScaleCalculation: false,   // まず無効
    enableHighlighting: false        // まず無効
});

// Step 2: スケール計算機能追加
setTimeout(() => {
    integrator.updateOptions({
        enableScaleCalculation: true,
        scaleOptions: {
            defaultMode: 'proportional',
            baseScale: 1.0
        }
    });
    console.log('スケール計算機能を追加');
}, 5000);

// Step 3: ハイライト機能追加
setTimeout(() => {
    integrator.updateOptions({
        enableHighlighting: true,
        highlightOptions: {
            highlightColor: '#007bff',
            showElementInfo: true
        }
    });
    console.log('ハイライト機能を追加');
}, 10000);
```

### API対応表

| ElementObserverAdvanced | PinSystemIntegrator | 備考 |
|-------------------------|---------------------|------|
| `observe(element, callback)` | `observe(element, options)` | 完全互換 + 拡張オプション |
| `unobserve(element)` | `unobserve(element)` | 完全互換 |
| `getRect(element)` | `getRect(element)` | 完全互換 + スケール情報付加 |
| `getState()` | `getState()` | 完全互換 + 各モジュール状態 |
| `cleanup()` | `cleanup()` | 完全互換 + 全モジュール清理 |
| `updateOptions(options)` | `updateOptions(options)` | 完全互換 + 統合オプション |

---

## 🔧 高度な統合制御

### モジュール間通信制御

#### `configureModuleCommunication(config)`
**モジュール間の通信方式を詳細設定**

```javascript
// モジュール間通信の最適化
integrator.configureModuleCommunication({
    // データフロー制御
    dataFlow: {
        environmentToScale: {
            enabled: true,              // 環境→スケール連携
            throttleInterval: 8,        // 連携間隔
            dataFiltering: true,        // データフィルタリング
            priorityMode: 'latency'     // レイテンシ重視
        },
        
        scaleToHighlight: {
            enabled: true,              // スケール→ハイライト連携
            batchUpdates: true,         // バッチ更新
            smoothTransition: true,     // スムーズ遷移
            priorityMode: 'accuracy'    // 精度重視
        },
        
        environmentToHighlight: {
            enabled: true,              // 環境→ハイライト直接連携
            directPath: true,           // 直接パス使用
            skipScaleCalculation: false // スケール計算スキップ
        }
    },
    
    // 最適化設定
    optimization: {
        cacheSharedData: true,          // 共有データキャッシュ
        deduplicateEvents: true,        // イベント重複排除
        batchProcessing: true,          // バッチ処理
        priorityQueuing: true           // 優先度キューイング
    },
    
    // 監視・デバッグ
    monitoring: {
        logCommunication: true,         // 通信ログ
        measureLatency: true,           // レイテンシ測定
        trackDataFlow: true,            // データフロー追跡
        generateReport: true            // レポート生成
    }
});
```

### 高性能バッチ処理

#### `processBatchOperations(operations)`
**複数要素の一括処理**

```javascript
// 大量要素の効率的処理
const elements = document.querySelectorAll('.monitored-elements');
const operations = Array.from(elements).map(element => ({
    type: 'observe',
    element: element,
    options: {
        scaleMode: 'proportional',
        enableHighlight: true,
        autoAdjustment: true
    }
}));

const batchResult = await integrator.processBatchOperations(operations, {
    // バッチ設定
    batchSize: 50,                      // 一度に処理する要素数
    concurrency: 4,                     // 並列度
    progressCallback: (progress) => {
        console.log(`処理進捗: ${progress.completed}/${progress.total}`);
    },
    
    // エラーハンドリング
    errorHandling: {
        continueOnError: true,          // エラー時継続
        retryCount: 3,                  // リトライ回数
        timeout: 5000                   // タイムアウト
    }
});

console.log('バッチ処理結果:', {
    成功: batchResult.successful.length,
    失敗: batchResult.failed.length,
    処理時間: batchResult.processingTime,
    平均要素あたり時間: batchResult.averageTimePerElement
});
```

### カスタム統合モード

#### `createCustomIntegration(integrationConfig)`
**特定用途向けカスタム統合**

```javascript
// カスタム統合パターンの作成
const customIntegration = integrator.createCustomIntegration({
    name: 'ResponsiveImageOptimizer',
    description: 'レスポンシブ画像の自動最適化統合',
    
    // カスタムフロー定義
    dataFlow: [
        {
            from: 'environment',
            to: 'scale',
            transform: (envData) => {
                // 画像専用の環境データ変換
                return {
                    targetWidth: envData.rect.width,
                    targetHeight: envData.rect.height,
                    devicePixelRatio: envData.dpr,
                    breakpoint: envData.currentBreakpoint
                };
            }
        },
        {
            from: 'scale',
            to: 'highlight',
            transform: (scaleData) => {
                // スケール結果から最適画像サイズを算出
                return {
                    optimalWidth: Math.round(scaleData.targetWidth * scaleData.scale),
                    optimalHeight: Math.round(scaleData.targetHeight * scaleData.scale),
                    compressionLevel: scaleData.scale < 0.5 ? 'high' : 'medium'
                };
            }
        }
    ],
    
    // カスタムアクション
    actions: {
        onImageOptimization: (optimizationData) => {
            console.log('画像最適化:', {
                元サイズ: optimizationData.originalSize,
                最適サイズ: optimizationData.optimalSize,
                圧縮レベル: optimizationData.compressionLevel,
                削減率: optimizationData.reductionRate
            });
        }
    }
});

// カスタム統合の使用
const imageElements = document.querySelectorAll('img.responsive');
for (const img of imageElements) {
    customIntegration.apply(img, {
        autoOptimize: true,
        qualityThreshold: 0.8,
        enablePreload: true
    });
}
```

---

## 🧪 テスト・デバッグ

### 統合システムテスト

#### 自動テスト実行

```javascript
// 統合システム全体のテスト
PinSystemIntegrator.test();

// またはブラウザのURLパラメータで自動実行
// http://localhost:8000/?test=integration
```

#### カスタム統合テスト

```javascript
// 統合機能のカスタムテスト
class IntegrationTester {
    constructor() {
        this.testResults = {
            environment: null,
            scale: null,
            highlight: null,
            integration: null
        };
    }
    
    async runFullIntegrationTest() {
        console.log('🧪 統合システム完全テスト開始');
        
        const integrator = new PinSystemIntegrator({
            debug: true,
            // テスト用の加速設定
            throttleInterval: 1,
            enableAllModules: true
        });
        
        // テスト用要素作成
        const testElement = this.createTestElement();
        
        // 1. 基本統合テスト
        console.log('1. 基本統合機能テスト');
        const basicResult = await this.testBasicIntegration(integrator, testElement);
        this.testResults.integration = basicResult;
        
        // 2. 環境変化連携テスト
        console.log('2. 環境変化連携テスト');
        const envResult = await this.testEnvironmentIntegration(integrator, testElement);
        this.testResults.environment = envResult;
        
        // 3. スケール計算連携テスト
        console.log('3. スケール計算連携テスト');
        const scaleResult = await this.testScaleIntegration(integrator, testElement);
        this.testResults.scale = scaleResult;
        
        // 4. ハイライト連携テスト
        console.log('4. ハイライト連携テスト');
        const highlightResult = await this.testHighlightIntegration(integrator, testElement);
        this.testResults.highlight = highlightResult;
        
        // 5. パフォーマンステスト
        console.log('5. 統合パフォーマンステスト');
        const perfResult = await this.testIntegrationPerformance(integrator);
        
        // 結果レポート
        this.generateIntegrationReport();
        
        // クリーンアップ
        integrator.cleanup();
        this.removeTestElements();
        
        console.log('✅ 統合システム完全テスト完了');
        return this.testResults;
    }
    
    async testBasicIntegration(integrator, element) {
        // 基本的な統合監視機能をテスト
        const startTime = performance.now();
        
        const observeResult = integrator.observe(element, {
            scaleMode: 'proportional',
            enableHighlight: true,
            autoAdjustment: true
        });
        
        // 要素サイズを変更して連携をテスト
        element.style.width = '200px';
        element.style.height = '150px';
        
        // 変化検出を待機
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const endTime = performance.now();
        
        return {
            success: observeResult.success,
            responseTime: endTime - startTime,
            observationId: observeResult.id,
            modulesActivated: observeResult.modulesActivated
        };
    }
    
    generateIntegrationReport() {
        const report = {
            テスト実行時刻: new Date().toLocaleString(),
            統合システム: {
                基本機能: this.testResults.integration?.success ? '✅ 成功' : '❌ 失敗',
                応答時間: `${this.testResults.integration?.responseTime?.toFixed(2)}ms`
            },
            環境監視: {
                連携機能: this.testResults.environment?.success ? '✅ 成功' : '❌ 失敗',
                変化検出: this.testResults.environment?.changesDetected || 0
            },
            スケール計算: {
                連携機能: this.testResults.scale?.success ? '✅ 成功' : '❌ 失敗',
                計算精度: this.testResults.scale?.accuracy || 'N/A'
            },
            ハイライト: {
                連携機能: this.testResults.highlight?.success ? '✅ 成功' : '❌ 失敗',
                描画性能: this.testResults.highlight?.renderTime || 'N/A'
            }
        };
        
        console.table(report);
        return report;
    }
}

// 実行
const tester = new IntegrationTester();
tester.runFullIntegrationTest().then(results => {
    console.log('最終テスト結果:', results);
});
```

### デバッグ支援機能

#### 統合状態の可視化

```javascript
// リアルタイム統合状態監視
const debugPanel = integrator.createDebugPanel({
    position: 'top-right',
    minimizable: true,
    showModuleStatus: true,
    showPerformanceMetrics: true,
    updateInterval: 1000
});

// デバッグパネル表示内容
/*
┌─ PinSystemIntegrator Debug Panel ─┐
│ Environment: ✅ Active (3 targets)   │
│   └─ Avg Update: 2.3ms              │
│ Scale: ✅ Active (Cache: 89%)        │
│   └─ Avg Calc: 0.8ms                │
│ Highlight: ✅ Active (12 overlays)   │
│   └─ Avg Render: 4.1ms              │
│ Integration: ✅ Healthy              │
│   └─ Comm Latency: 0.2ms            │
└─────────────────────────────────────┘
*/

// デバッグ情報の詳細出力
integrator.enableDetailedLogging({
    logLevel: 'verbose',        // minimal, normal, verbose
    logModules: ['all'],        // 'environment', 'scale', 'highlight', 'integration', 'all'
    logEvents: {
        communication: true,     // モジュール間通信
        performance: true,       // パフォーマンス
        errors: true,           // エラー
        stateChanges: true      // 状態変化
    }
});
```

---

## ⚠️ トラブルシューティング

### よくある問題

#### 1. 統合システムが初期化されない

```javascript
// 問題診断
const diagnostics = integrator.diagnose();

if (!diagnostics.initialized) {
    console.error('統合システム初期化失敗:');
    
    // モジュール別初期化状況確認
    if (!diagnostics.modules.environment.initialized) {
        console.error('- PureEnvironmentObserver初期化失敗');
        // ResizeObserver対応確認
        if (typeof ResizeObserver === 'undefined') {
            console.error('  → ResizeObserverがサポートされていません');
        }
    }
    
    if (!diagnostics.modules.scale.initialized) {
        console.error('- PureScaleCalculator初期化失敗');
    }
    
    if (!diagnostics.modules.highlight.initialized) {
        console.error('- PurePinHighlighter初期化失敗');
        // DOM準備確認
        if (document.readyState !== 'complete') {
            console.error('  → DOM読み込みが完了していません');
        }
    }
}
```

#### 2. モジュール間通信が機能しない

```javascript
// 通信診断
const commDiag = integrator.diagnoseCommunication();

console.log('モジュール間通信診断:', {
    環境→スケール: {
        接続状態: commDiag.environmentToScale.connected,
        最終通信: commDiag.environmentToScale.lastCommunication,
        エラー数: commDiag.environmentToScale.errorCount
    },
    スケール→ハイライト: {
        接続状態: commDiag.scaleToHighlight.connected,
        最終通信: commDiag.scaleToHighlight.lastCommunication,
        エラー数: commDiag.scaleToHighlight.errorCount
    },
    統合制御: {
        通信ハブ状態: commDiag.integrationHub.status,
        キューサイズ: commDiag.integrationHub.queueSize,
        処理遅延: commDiag.integrationHub.processingDelay
    }
});

// 通信復旧試行
if (commDiag.hasIssues) {
    console.log('通信問題を検出。復旧を試行します...');
    const recoveryResult = integrator.recoverCommunication();
    console.log('復旧結果:', recoveryResult.success ? '成功' : '失敗');
}
```

#### 3. パフォーマンス問題

```javascript
// パフォーマンス分析
const perfAnalysis = integrator.analyzePerformance({
    duration: 10000,  // 10秒間分析
    includeMemory: true,
    includeFrameRate: true
});

console.log('パフォーマンス分析結果:', {
    統合処理時間: {
        平均: `${perfAnalysis.integration.averageTime}ms`,
        最大: `${perfAnalysis.integration.maxTime}ms`,
        95パーセンタイル: `${perfAnalysis.integration.p95Time}ms`
    },
    
    モジュール別性能: {
        環境監視: `${perfAnalysis.modules.environment.averageTime}ms`,
        スケール計算: `${perfAnalysis.modules.scale.averageTime}ms`,
        ハイライト: `${perfAnalysis.modules.highlight.averageTime}ms`
    },
    
    メモリ使用量: {
        現在: `${perfAnalysis.memory.current}MB`,
        最大: `${perfAnalysis.memory.peak}MB`,
        増加傾向: perfAnalysis.memory.trend
    },
    
    推奨改善策: perfAnalysis.recommendations
});

// 自動最適化実行
if (perfAnalysis.hasPerformanceIssues) {
    const optimizationResult = integrator.autoOptimize({
        target: 'performance',
        aggressiveness: 'moderate'  // conservative, moderate, aggressive
    });
    
    console.log('自動最適化結果:', {
        実行された最適化: optimizationResult.appliedOptimizations,
        期待される改善: optimizationResult.expectedImprovement,
        副作用の可能性: optimizationResult.potentialSideEffects
    });
}
```

#### 4. メモリリーク

```javascript
// メモリリーク検出
const memoryTracker = integrator.createMemoryTracker({
    trackingInterval: 5000,  // 5秒間隔
    alertThreshold: 50 * 1024 * 1024,  // 50MB閾値
    autoCleanup: true
});

// リーク検出時の自動対応
memoryTracker.onMemoryLeak = (leakInfo) => {
    console.warn('メモリリーク検出:', {
        増加量: `${leakInfo.increaseAmount}MB`,
        疑わしいモジュール: leakInfo.suspectedModule,
        推奨アクション: leakInfo.recommendedAction
    });
    
    // 自動クリーンアップ実行
    if (leakInfo.autoCleanupAvailable) {
        const cleanupResult = integrator.performTargetedCleanup(
            leakInfo.suspectedModule
        );
        console.log('自動クリーンアップ結果:', cleanupResult);
    }
};

// 手動メモリクリーンアップ
setTimeout(() => {
    const cleanupReport = integrator.performFullCleanup();
    console.log('完全クリーンアップ報告:', {
        解放されたメモリ: cleanupReport.freedMemory,
        削除されたオブジェクト: cleanupReport.removedObjects,
        残存オブザーバー: cleanupReport.remainingObservers
    });
}, 60000);  // 1分後に実行
```

---

## 🔧 高度な設定・カスタマイズ

### 初期化オプション詳細

```javascript
const integrator = new PinSystemIntegrator({
    // === 各モジュール設定 ===
    
    // 環境監視設定
    environmentOptions: {
        epsilon: 0.5,                    // 精度設定
        throttleInterval: 8,             // 更新間隔
        dprMonitoring: true,             // DPR監視
        detectZoom: true,                // ズーム検出
        monitorBreakpoints: true,        // ブレークポイント監視
        breakpoints: [768, 1024, 1200]   // カスタムブレークポイント
    },
    
    // スケール計算設定
    scaleOptions: {
        defaultMode: 'proportional',     // デフォルトモード
        precision: 3,                    // 小数点精度
        cacheEnabled: true,              // キャッシュ有効化
        cacheSize: 100,                  // キャッシュサイズ
        enableNegativeScaling: false     // 負のスケーリング
    },
    
    // ハイライト設定
    highlightOptions: {
        highlightColor: '#007bff',       // ハイライト色
        highlightOpacity: 0.3,           // 透明度
        borderWidth: 2,                  // ボーダー幅
        showElementInfo: true,           // 要素情報表示
        infoPosition: 'top-right',       // 情報位置
        throttleInterval: 8              // 描画間隔
    },
    
    // === 統合システム設定 ===
    
    // 自動機能設定
    autoFeatures: {
        environmentToScale: true,        // 環境→スケール自動連携
        scaleToHighlight: true,          // スケール→ハイライト自動連携
        environmentToHighlight: false,   // 環境→ハイライト直接連携
        autoOptimization: true,          // 自動最適化
        adaptiveThrottling: true         // 適応的スロットリング
    },
    
    // 通信設定
    communication: {
        protocol: 'event-driven',        // 通信プロトコル
        batchUpdates: true,              // バッチ更新
        priorityQueue: true,             // 優先度キュー
        errorRecovery: true,             // エラー回復
        heartbeatInterval: 5000          // ハートビート間隔
    },
    
    // パフォーマンス設定
    performance: {
        targetFrameRate: 60,             // 目標フレームレート
        memoryLimit: 50 * 1024 * 1024,  // メモリ制限 (50MB)
        autoGC: true,                    // 自動ガベージコレクション
        performanceMonitoring: true,    // パフォーマンス監視
        adaptiveOptimization: true       // 適応的最適化
    },
    
    // デバッグ・ロギング
    debug: {
        enabled: false,                  // デバッグモード
        logLevel: 'normal',              // ログレベル
        logModules: ['integration'],     // ログ対象モジュール
        showDebugPanel: false,           // デバッグパネル表示
        recordPerformance: false         // パフォーマンス記録
    }
});
```

### 動的設定変更

```javascript
// 実行時設定変更
integrator.updateConfiguration({
    // 一部設定のみ変更
    environmentOptions: {
        throttleInterval: 16  // 60fpsに変更
    },
    
    // 新しい機能を有効化
    autoFeatures: {
        adaptiveThrottling: true
    },
    
    // パフォーマンス設定調整
    performance: {
        targetFrameRate: 30,  // 30fpsに変更
        memoryLimit: 30 * 1024 * 1024  // 30MBに制限
    }
});

// 設定変更の確認
const currentConfig = integrator.getConfiguration();
console.log('現在の設定:', currentConfig);

// 設定のバックアップ・復元
const configBackup = integrator.backupConfiguration();

// 何らかの設定変更後...

// 設定を復元
integrator.restoreConfiguration(configBackup);
console.log('設定を復元しました');
```

---

## 📊 統合システム状態管理

### 状態監視・取得

```javascript
// 詳細な統合システム状態取得
const systemState = integrator.getSystemState();

console.log('統合システム完全状態:', {
    // システム全体
    system: {
        initialized: systemState.system.initialized,
        version: systemState.system.version,
        uptime: systemState.system.uptime,
        totalObservations: systemState.system.totalObservations
    },
    
    // 各モジュール詳細
    modules: {
        environment: {
            status: systemState.modules.environment.status,
            observations: systemState.modules.environment.activeObservations,
            performance: systemState.modules.environment.performanceMetrics
        },
        scale: {
            status: systemState.modules.scale.status,
            calculations: systemState.modules.scale.totalCalculations,
            cache: systemState.modules.scale.cacheStatistics
        },
        highlight: {
            status: systemState.modules.highlight.status,
            activeHighlights: systemState.modules.highlight.activeCount,
            rendering: systemState.modules.highlight.renderingStats
        }
    },
    
    // 統合制御情報
    integration: {
        communicationHealth: systemState.integration.communicationHealth,
        dataFlowMetrics: systemState.integration.dataFlowMetrics,
        optimizationLevel: systemState.integration.currentOptimizationLevel
    },
    
    // リソース使用状況
    resources: {
        memory: systemState.resources.memoryUsage,
        cpu: systemState.resources.cpuUsage,
        domNodes: systemState.resources.domNodeCount
    }
});
```

### 状態変化通知

```javascript
// システム状態変化の監視
integrator.onSystemStateChange = (stateChange) => {
    console.log('システム状態変化:', {
        変化タイプ: stateChange.type,
        影響モジュール: stateChange.affectedModules,
        新しい状態: stateChange.newState,
        前の状態: stateChange.previousState,
        変化理由: stateChange.reason,
        タイムスタンプ: stateChange.timestamp
    });
    
    // 特定の状態変化に対する自動対応
    switch (stateChange.type) {
        case 'performance_degradation':
            console.warn('パフォーマンス低下を検出');
            integrator.autoOptimize({ target: 'performance' });
            break;
            
        case 'memory_threshold_exceeded':
            console.warn('メモリ閾値超過');
            integrator.performTargetedCleanup();
            break;
            
        case 'module_communication_failure':
            console.error('モジュール通信障害');
            integrator.recoverCommunication();
            break;
    }
};

// 定期的なヘルスチェック
integrator.enableHealthCheck({
    interval: 30000,  // 30秒間隔
    checks: [
        'module_health',
        'communication_health', 
        'performance_health',
        'memory_health'
    ],
    onHealthIssue: (issue) => {
        console.warn('ヘルスチェック異常:', issue);
    }
});
```

---

## 📚 参考資料

### 関連ドキュメント

- [SPEC.md](./SPEC.md) - PinSystemIntegrator技術仕様書
- [PureEnvironmentObserver](../environment-observer/README.md) - 環境監視モジュール
- [PureScaleCalculator](../scale-calculator/README.md) - スケール計算モジュール
- [PurePinHighlighter](../pin-highlighter/README.md) - ハイライト表示モジュール
- [ElementObserverAdvanced](../../docs/ELEMENT_OBSERVER_ADVANCED.md) - 従来システム

### 設計思想

- [ElementObserver Phase 3-B設計書](../../docs/ELEMENT_OBSERVER_PHASE3B_MICROMODULE_DESIGN.md)
- [マイクロモジュール設計原則](../../docs/MICROMODULE_DESIGN_PRINCIPLES.md)
- [統合システムアーキテクチャ](../../docs/INTEGRATION_ARCHITECTURE.md)

### 移行・統合ガイド

- [ElementObserver → PinSystemIntegrator 移行ガイド](../../docs/MIGRATION_GUIDE.md)
- [既存システム統合ベストプラクティス](../../docs/INTEGRATION_BEST_PRACTICES.md)
- [パフォーマンス最適化ガイド](../../docs/PERFORMANCE_OPTIMIZATION.md)

---

## 🔖 バージョン情報

**Version**: 1.0  
**Phase**: ElementObserver Phase 3-B  
**Created**: 2025-08-29  
**Dependencies**: 
- PureEnvironmentObserver v1.0
- PureScaleCalculator v1.0  
- PurePinHighlighter v1.0
- ResizeObserver, getBoundingClientRect のみ

**Compatibility**: モダンブラウザ（IE11+ with Polyfill）

**Author**: Claude Code  
**License**: MIT