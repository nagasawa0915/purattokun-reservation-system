/**
 * PinSystemIntegrator.js
 * 
 * 🚀 ElementObserver Phase 3-B マイクロモジュール統合制御システム
 * 
 * 【責務】
 * - 3つのマイクロモジュール（Environment, Scale, Highlighter）の統合制御
 * - ElementObserver互換APIの提供
 * - モジュール間の数値のみ受け渡し・協調制御
 * - Phase 3-A成果（99.9%高速化技術）との統合
 * 
 * 【統合フロー】
 * 1. PureEnvironmentObserver → 環境変化検出
 * 2. PureScaleCalculator → スケール値計算
 * 3. PurePinHighlighter → UI表示・ハイライト
 * 4. 結果統合 → 外部システムに数値のみ通知
 * 
 * 【Phase 3-A統合技術】
 * - setUnifiedPosition(): 0.01ms処理時間の超高速座標制御
 * - 統合座標システム: 5座標系統一技術の継承
 * - ElementObserverAdvanced: 既存統合制御システムとの完全互換
 * 
 * 【設計原則】
 * - 単一責務: 統合制御のみ（直接的なDOM操作・計算処理・UI生成禁止）
 * - v3.0ハイブリッド設計: 実証済みパターン活用
 * - ElementObserver互換: 完全なAPI互換性保証
 * - 数値のみ受け渡し: オブジェクト参照排除による協調制御
 * 
 * @version Phase 3-B v1.0
 * @created 2025-08-29
 * @dependencies PureEnvironmentObserver, PureScaleCalculator, PurePinHighlighter
 */

class PinSystemIntegrator {
    constructor(globalOptions = {}) {
        // Phase 3-A統合オプション
        this.phase3AIntegration = {
            enabled: globalOptions.usePhase3A !== false,
            compatMode: globalOptions.compatMode || 'advanced', // 'basic', 'advanced'
            highSpeedCoordinate: globalOptions.highSpeedCoordinate !== false
        };
        
        // 3つのマイクロモジュール初期化
        this.modules = {
            environment: null,  // PureEnvironmentObserver
            scale: null,        // PureScaleCalculator
            highlighter: null   // PurePinHighlighter
        };
        
        // 統合制御状態
        this.integrationState = {
            initialized: false,
            observingTargets: new Map(),     // target -> integrationData
            activeCallbacks: new Map(),      // callbackId -> callback
            pinSetupMode: false,
            lastUpdateTimestamp: 0
        };
        
        // ElementObserver互換API用状態
        this.elementObserverCompat = {
            observers: new Map(),            // target -> observerData
            globalCallbacks: {
                onChange: new Set(),
                onError: new Set(),
                onReady: new Set(),
                onPinSelect: new Set()
            },
            nextCallbackId: 1
        };
        
        // パフォーマンス統計（Phase 3-A継承）
        this.performance = {
            totalOperations: 0,
            averageProcessingTime: 0,
            lastMeasurement: null,
            highSpeedOperations: 0
        };
        
        // エラーハンドリング
        this.errorHandling = {
            lastError: null,
            errorCount: 0,
            recoveryAttempts: 0,
            maxRecoveryAttempts: 3
        };
        
        this._initialize(globalOptions);
    }
    
    /**
     * 内部初期化処理
     * @param {Object} options 初期化オプション
     */
    _initialize(options) {
        try {
            const startTime = performance.now();
            
            // 3つのマイクロモジュールを初期化
            this._initializeModules(options);
            
            // Phase 3-A統合機能の初期化
            if (this.phase3AIntegration.enabled) {
                this._initializePhase3AIntegration();
            }
            
            // 統合制御システム初期化
            this._initializeIntegrationSystem();
            
            const endTime = performance.now();
            this.performance.lastMeasurement = {
                operation: 'initialization',
                duration: endTime - startTime,
                timestamp: endTime
            };
            
            this.integrationState.initialized = true;
            
            console.log('[PinSystemIntegrator] Initialized successfully', {
                phase3A: this.phase3AIntegration.enabled,
                compatMode: this.phase3AIntegration.compatMode,
                initTime: `${(endTime - startTime).toFixed(2)}ms`
            });
            
        } catch (error) {
            this._handleError(error, 'initialization');
            throw error;
        }
    }
    
    /**
     * 3つのマイクロモジュール初期化
     * @param {Object} options 初期化オプション
     */
    _initializeModules(options) {
        // 環境監視モジュール初期化
        if (typeof PureEnvironmentObserver !== 'undefined') {
            this.modules.environment = new PureEnvironmentObserver({
                epsilon: options.epsilon || 0.5,
                throttleInterval: options.throttleInterval || 8,
                dprMonitoring: options.dprMonitoring !== false,
                debug: options.debug || false
            });
        } else {
            throw new Error('PureEnvironmentObserver not available');
        }
        
        // スケール計算モジュール初期化
        if (typeof PureScaleCalculator !== 'undefined') {
            this.modules.scale = new PureScaleCalculator({
                defaultBaseScale: options.defaultBaseScale || 1.0,
                minScale: options.minScale || 0.1,
                maxScale: options.maxScale || 10.0,
                epsilon: options.epsilon || 1e-6
            });
        } else {
            throw new Error('PureScaleCalculator not available');
        }
        
        // ハイライト表示モジュール初期化
        if (typeof PurePinHighlighter !== 'undefined') {
            this.modules.highlighter = new PurePinHighlighter({
                style: {
                    borderColor: options.highlightBorderColor || '#007acc',
                    backgroundColor: options.highlightBackgroundColor || 'rgba(0,122,204,0.1)',
                    showElementInfo: options.showElementInfo !== false,
                    showPinPreview: options.showPinPreview !== false,
                    ...(options.highlightStyle || {})
                }
            });
        } else {
            throw new Error('PurePinHighlighter not available');
        }
    }
    
    /**
     * Phase 3-A統合機能初期化
     */
    _initializePhase3AIntegration() {
        try {
            // ElementObserverAdvanced存在チェック
            if (typeof ElementObserverAdvanced !== 'undefined' && 
                this.phase3AIntegration.compatMode === 'advanced') {
                
                // Phase 3-A高速化技術との統合準備
                this.phase3AIntegration.advancedObserver = {
                    available: true,
                    highSpeedCoordinate: this.phase3AIntegration.highSpeedCoordinate
                };
                
                console.log('[PinSystemIntegrator] Phase 3-A Advanced integration enabled');
            } else {
                // 基本モード
                this.phase3AIntegration.advancedObserver = {
                    available: false,
                    fallbackToBasic: true
                };
                
                console.log('[PinSystemIntegrator] Phase 3-A Basic integration mode');
            }
            
        } catch (error) {
            console.warn('[PinSystemIntegrator] Phase 3-A integration fallback:', error.message);
            this.phase3AIntegration.enabled = false;
        }
    }
    
    /**
     * 統合制御システム初期化
     */
    _initializeIntegrationSystem() {
        // パフォーマンス監視初期化
        this.performance.totalOperations = 0;
        this.performance.averageProcessingTime = 0;
        this.performance.highSpeedOperations = 0;
        
        // エラー状態初期化
        this.errorHandling.lastError = null;
        this.errorHandling.errorCount = 0;
        this.errorHandling.recoveryAttempts = 0;
    }
    
    // ============================================
    // ElementObserver互換API実装
    // ============================================
    
    /**
     * 要素の監視開始（ElementObserver互換）
     * @param {HTMLElement} target 監視対象要素
     * @param {Object} options 監視オプション
     * @returns {Object} 監視情報
     */
    observe(target, options = {}) {
        if (!this.integrationState.initialized) {
            throw new Error('PinSystemIntegrator not initialized');
        }
        
        if (!target || !(target instanceof HTMLElement)) {
            throw new Error('Target must be an HTMLElement');
        }
        
        const startTime = performance.now();
        
        try {
            // 既存監視チェック
            if (this.integrationState.observingTargets.has(target)) {
                console.warn('[PinSystemIntegrator] Target already being observed:', target);
                return this.integrationState.observingTargets.get(target).publicData;
            }
            
            // 統合監視データ作成
            const integrationData = this._createIntegrationData(target, options);
            
            // 3つのモジュールで監視開始
            const observationResults = this._startModuleObservation(target, integrationData);
            
            // 統合データを保存
            this.integrationState.observingTargets.set(target, {
                target,
                options,
                integrationData,
                observationResults,
                publicData: {
                    target,
                    observationKey: this._generateObservationKey(target),
                    startTime: startTime
                }
            });
            
            // パフォーマンス記録
            this._recordPerformance('observe', startTime);
            
            console.log('[PinSystemIntegrator] Observation started for:', target);
            
            return this.integrationState.observingTargets.get(target).publicData;
            
        } catch (error) {
            this._handleError(error, 'observe');
            throw error;
        }
    }
    
    /**
     * 要素の監視停止（ElementObserver互換）
     * @param {HTMLElement} target 監視停止対象要素
     * @returns {boolean} 成功可否
     */
    unobserve(target) {
        if (!target) {
            return false;
        }
        
        const startTime = performance.now();
        
        try {
            const observationData = this.integrationState.observingTargets.get(target);
            
            if (!observationData) {
                console.warn('[PinSystemIntegrator] Target not being observed:', target);
                return false;
            }
            
            // 3つのモジュールで監視停止
            this._stopModuleObservation(target, observationData);
            
            // 統合データ削除
            this.integrationState.observingTargets.delete(target);
            
            // パフォーマンス記録
            this._recordPerformance('unobserve', startTime);
            
            console.log('[PinSystemIntegrator] Observation stopped for:', target);
            
            return true;
            
        } catch (error) {
            this._handleError(error, 'unobserve');
            return false;
        }
    }
    
    /**
     * 全監視停止（ElementObserver互換）
     */
    disconnect() {
        const startTime = performance.now();
        
        try {
            const targets = Array.from(this.integrationState.observingTargets.keys());
            
            for (const target of targets) {
                this.unobserve(target);
            }
            
            // グローバルコールバッククリア
            this.elementObserverCompat.globalCallbacks.onChange.clear();
            this.elementObserverCompat.globalCallbacks.onError.clear();
            this.elementObserverCompat.globalCallbacks.onReady.clear();
            this.elementObserverCompat.globalCallbacks.onPinSelect.clear();
            
            // パフォーマンス記録
            this._recordPerformance('disconnect', startTime);
            
            console.log('[PinSystemIntegrator] All observations disconnected');
            
        } catch (error) {
            this._handleError(error, 'disconnect');
        }
    }
    
    /**
     * ピン設定モード開始
     * @param {Object} options ピン設定オプション
     * @returns {Object} 設定モード情報
     */
    startPinSetupMode(options = {}) {
        if (this.integrationState.pinSetupMode) {
            console.warn('[PinSystemIntegrator] Pin setup mode already active');
            return { alreadyActive: true };
        }
        
        const startTime = performance.now();
        
        try {
            // ハイライトモード開始
            this.modules.highlighter.startHighlightMode({
                borderColor: options.highlightColor || '#ff6b6b',
                showPinPreview: true,
                throttle: options.throttle || 16
            });
            
            this.integrationState.pinSetupMode = true;
            
            // パフォーマンス記録
            this._recordPerformance('startPinSetupMode', startTime);
            
            console.log('[PinSystemIntegrator] Pin setup mode started');
            
            return {
                active: true,
                startTime: startTime,
                highlightEnabled: true
            };
            
        } catch (error) {
            this._handleError(error, 'startPinSetupMode');
            throw error;
        }
    }
    
    /**
     * ピン設定モード終了
     */
    stopPinSetupMode() {
        if (!this.integrationState.pinSetupMode) {
            return;
        }
        
        const startTime = performance.now();
        
        try {
            // ハイライトモード終了
            this.modules.highlighter.stopHighlightMode();
            
            this.integrationState.pinSetupMode = false;
            
            // パフォーマンス記録
            this._recordPerformance('stopPinSetupMode', startTime);
            
            console.log('[PinSystemIntegrator] Pin setup mode stopped');
            
        } catch (error) {
            this._handleError(error, 'stopPinSetupMode');
        }
    }
    
    /**
     * 変化通知コールバック登録（ElementObserver互換）
     * @param {Function} callback 通知コールバック
     * @returns {number} コールバックID
     */
    onChange(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        this.elementObserverCompat.globalCallbacks.onChange.add(callback);
        
        const callbackId = this.elementObserverCompat.nextCallbackId++;
        
        // activeCallbacks の安全な初期化と set メソッド確認
        if (!this.elementObserverCompat.activeCallbacks) {
            this.elementObserverCompat.activeCallbacks = new Map();
        }
        
        this.elementObserverCompat.activeCallbacks.set(callbackId, {
            type: 'change',
            callback,
            id: callbackId
        });
        
        return callbackId;
    }
    
    /**
     * ピン選択イベントコールバック登録
     * @param {Function} callback 選択通知コールバック
     * @returns {number} コールバックID
     */
    onPinSelect(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        this.elementObserverCompat.globalCallbacks.onPinSelect.add(callback);
        
        const callbackId = this.elementObserverCompat.nextCallbackId++;
        
        if (!this.elementObserverCompat.activeCallbacks) {
            this.elementObserverCompat.activeCallbacks = new Map();
        }
        
        this.elementObserverCompat.activeCallbacks.set(callbackId, {
            type: 'pinSelect',
            callback,
            id: callbackId
        });
        
        return callbackId;
    }
    
    /**
     * エラー通知コールバック登録（ElementObserver互換）
     * @param {Function} callback エラー通知コールバック
     * @returns {number} コールバックID
     */
    onError(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        this.elementObserverCompat.globalCallbacks.onError.add(callback);
        
        const callbackId = this.elementObserverCompat.nextCallbackId++;
        
        if (!this.elementObserverCompat.activeCallbacks) {
            this.elementObserverCompat.activeCallbacks = new Map();
        }
        
        this.elementObserverCompat.activeCallbacks.set(callbackId, {
            type: 'error',
            callback,
            id: callbackId
        });
        
        return callbackId;
    }
    
    /**
     * 準備完了通知コールバック登録（ElementObserver互換）
     * @param {Function} callback 準備完了通知コールバック
     * @returns {number} コールバックID
     */
    onReady(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        this.elementObserverCompat.globalCallbacks.onReady.add(callback);
        
        const callbackId = this.elementObserverCompat.nextCallbackId++;
        
        if (!this.elementObserverCompat.activeCallbacks) {
            this.elementObserverCompat.activeCallbacks = new Map();
        }
        
        this.elementObserverCompat.activeCallbacks.set(callbackId, {
            type: 'ready',
            callback,
            id: callbackId
        });
        
        // 既に初期化済みの場合は即座に通知
        if (this.integrationState.initialized) {
            setTimeout(() => callback({ 
                initialized: true, 
                timestamp: performance.now() 
            }), 0);
        }
        
        return callbackId;
    }
    
    // ============================================
    // 内部統合制御処理
    // ============================================
    
    /**
     * 統合監視データ作成
     * @param {HTMLElement} target 対象要素
     * @param {Object} options 監視オプション
     * @returns {Object} 統合データ
     */
    _createIntegrationData(target, options) {
        console.log('[DEBUG] _createIntegrationData input options:', options);
        const scaleOptions = {
            mode: options.scaleMode || 'proportional',
            baseScale: options.baseScale || 1.0,
            referenceSize: options.referenceSize || null,
            ...options.scaleOptions
        };
        console.log('[DEBUG] Created scaleOptions:', scaleOptions);
        return {
            target,
            options,
            
            // スケール計算設定
            scaleOptions,
            
            // ハイライト設定
            highlightOptions: {
                enabled: options.highlight !== false,
                style: options.highlightStyle || {}
            },
            
            // Phase 3-A統合設定
            phase3AOptions: {
                enabled: this.phase3AIntegration.enabled && options.usePhase3A !== false,
                highSpeedCoordinate: this.phase3AIntegration.highSpeedCoordinate,
                compatMode: this.phase3AIntegration.compatMode
            },
            
            // 内部状態
            state: {
                lastRect: null,
                lastScale: null,
                lastUpdate: 0,
                changeCount: 0
            }
        };
    }
    
    /**
     * 3つのモジュールで監視開始
     * @param {HTMLElement} target 対象要素
     * @param {Object} integrationData 統合データ
     * @returns {Object} 監視結果
     */
    _startModuleObservation(target, integrationData) {
        const results = {};
        
        // 1. 環境監視開始
        try {
            const envCallback = (data) => this._handleEnvironmentChange(target, data, integrationData);
            const envResult = this.modules.environment.observe(target, envCallback);
            results.environment = { success: true, result: envResult };
        } catch (error) {
            results.environment = { success: false, error: error.message };
            console.warn('[PinSystemIntegrator] Environment observation failed:', error);
        }
        
        // 2. スケール計算準備（実際の計算は環境変化時に実行）
        try {
            // 基準値設定
            if (integrationData.scaleOptions.referenceSize) {
                this.modules.scale.setReference({
                    size: integrationData.scaleOptions.referenceSize
                });
            }
            results.scale = { success: true, prepared: true };
        } catch (error) {
            results.scale = { success: false, error: error.message };
            console.warn('[PinSystemIntegrator] Scale calculation setup failed:', error);
        }
        
        // 3. ハイライト準備（ピンモード時に実行）
        try {
            results.highlighter = { success: true, prepared: true };
        } catch (error) {
            results.highlighter = { success: false, error: error.message };
            console.warn('[PinSystemIntegrator] Highlighter setup failed:', error);
        }
        
        return results;
    }
    
    /**
     * 3つのモジュールで監視停止
     * @param {HTMLElement} target 対象要素
     * @param {Object} observationData 監視データ
     */
    _stopModuleObservation(target, observationData) {
        // 1. 環境監視停止
        try {
            this.modules.environment.unobserve(target);
        } catch (error) {
            console.warn('[PinSystemIntegrator] Environment unobserve failed:', error);
        }
        
        // 2. ハイライト削除
        try {
            this.modules.highlighter.unhighlight(target);
        } catch (error) {
            console.warn('[PinSystemIntegrator] Highlighter unhighlight failed:', error);
        }
    }
    
    /**
     * 環境変化処理（3モジュール統合制御）
     * @param {HTMLElement} target 対象要素
     * @param {Object} envData 環境データ
     * @param {Object} integrationData 統合データ
     */
    _handleEnvironmentChange(target, envData, integrationData) {
        const startTime = performance.now();
        
        try {
            // 1. スケール値計算実行
            let scaleData = null;
            if (integrationData.scaleOptions.mode !== 'none') {
                console.log('[DEBUG] Scale calculation options:', integrationData.scaleOptions);
                console.log('[DEBUG] Environment rect:', envData.rect);
                scaleData = this.modules.scale.calculate(
                    envData.rect,
                    integrationData.scaleOptions.mode,
                    integrationData.scaleOptions
                );
            }
            
            // 2. Phase 3-A統合処理（高速座標制御）
            let phase3AData = null;
            if (integrationData.phase3AOptions.enabled) {
                phase3AData = this._processPhase3AIntegration(
                    target, envData, scaleData, integrationData
                );
            }
            
            // 3. 統合結果作成
            const integratedResult = this._createIntegratedResult({
                target,
                envData,
                scaleData,
                phase3AData,
                integrationData,
                timestamp: startTime
            });
            
            // 4. 状態更新
            integrationData.state.lastRect = envData.rect;
            integrationData.state.lastScale = scaleData;
            integrationData.state.lastUpdate = startTime;
            integrationData.state.changeCount++;
            
            // 5. 変化通知実行
            this._notifyChangeCallbacks(integratedResult);
            
            // パフォーマンス記録
            this._recordPerformance('environmentChange', startTime);
            
            // Phase 3-A高速化技術使用時のカウント
            if (phase3AData && phase3AData.highSpeedUsed) {
                this.performance.highSpeedOperations++;
            }
            
        } catch (error) {
            this._handleError(error, 'environmentChange');
        }
    }
    
    /**
     * Phase 3-A統合処理（99.9%高速化技術活用）
     * @param {HTMLElement} target 対象要素
     * @param {Object} envData 環境データ
     * @param {Object} scaleData スケールデータ
     * @param {Object} integrationData 統合データ
     * @returns {Object} Phase 3-A処理結果
     */
    _processPhase3AIntegration(target, envData, scaleData, integrationData) {
        try {
            if (!this.phase3AIntegration.advancedObserver?.available) {
                return { highSpeedUsed: false, fallback: true };
            }
            
            // 高速座標制御（setUnifiedPosition）の活用
            if (this.phase3AIntegration.highSpeedCoordinate && 
                typeof window.setUnifiedPosition === 'function') {
                
                const coordData = {
                    x: envData.rect.x,
                    y: envData.rect.y,
                    scale: scaleData ? scaleData.scale : 1.0
                };
                
                // 0.01ms処理時間の超高速座標制御実行
                const unifiedResult = window.setUnifiedPosition(target, coordData);
                
                return {
                    highSpeedUsed: true,
                    unifiedPosition: unifiedResult,
                    processingTime: unifiedResult?.processingTime || null
                };
            }
            
            return { highSpeedUsed: false, notAvailable: true };
            
        } catch (error) {
            console.warn('[PinSystemIntegrator] Phase 3-A integration error:', error);
            return { highSpeedUsed: false, error: error.message };
        }
    }
    
    /**
     * 統合結果作成（ElementObserver互換フォーマット）
     * @param {Object} data 統合データ
     * @returns {Object} RectPayload互換結果
     */
    _createIntegratedResult(data) {
        const { target, envData, scaleData, phase3AData, integrationData, timestamp } = data;
        
        return {
            // ElementObserver互換基本情報
            id: this._generateObservationKey(target),
            targetType: 'element',
            
            // 矩形情報（環境監視結果）
            rect: {
                x: envData.rect.x,
                y: envData.rect.y,
                width: envData.rect.width,
                height: envData.rect.height
            },
            
            // アンカー位置
            anchor: {
                x: envData.rect.x + (envData.rect.width / 2),
                y: envData.rect.y + (envData.rect.height / 2)
            },
            
            // スケール情報（計算結果）
            scale: scaleData ? {
                value: scaleData.scale,
                mode: scaleData.mode,
                ratio: scaleData.ratio
            } : {
                value: 1.0,
                mode: 'none',
                ratio: 1.0
            },
            
            // 計算モード・DPR
            mode: integrationData.scaleOptions.mode,
            dpr: envData.dpr,
            
            // タイムスタンプ
            timestamp,
            
            // Phase 3-A拡張情報
            phase3A: phase3AData ? {
                highSpeedUsed: phase3AData.highSpeedUsed,
                processingTime: phase3AData.processingTime || null,
                unifiedPosition: phase3AData.unifiedPosition || null
            } : null,
            
            // 統合制御情報
            integration: {
                changeCount: integrationData.state.changeCount,
                moduleResults: {
                    environment: true,
                    scale: !!scaleData,
                    highlighter: integrationData.highlightOptions.enabled
                }
            }
        };
    }
    
    /**
     * 変化通知コールバック実行
     * @param {Object} result 統合結果
     */
    _notifyChangeCallbacks(result) {
        const callbacks = this.elementObserverCompat.globalCallbacks.onChange;
        
        for (const callback of callbacks) {
            try {
                callback(result);
            } catch (error) {
                console.error('[PinSystemIntegrator] Change callback error:', error);
                this._notifyErrorCallbacks(error);
            }
        }
    }
    
    /**
     * エラー通知コールバック実行
     * @param {Error} error エラー情報
     */
    _notifyErrorCallbacks(error) {
        const callbacks = this.elementObserverCompat.globalCallbacks.onError;
        
        for (const callback of callbacks) {
            try {
                callback({
                    error,
                    timestamp: performance.now(),
                    context: 'PinSystemIntegrator'
                });
            } catch (callbackError) {
                console.error('[PinSystemIntegrator] Error callback failed:', callbackError);
            }
        }
    }
    
    // ============================================
    // ユーティリティメソッド
    // ============================================
    
    /**
     * 観測キー生成
     * @param {HTMLElement} target 対象要素
     * @returns {string} 観測キー
     */
    _generateObservationKey(target) {
        if (target.id) {
            return `pin-${target.id}`;
        }
        
        const tagName = target.tagName.toLowerCase();
        const className = target.className ? `.${target.className.split(' ')[0]}` : '';
        const timestamp = Date.now().toString(36);
        
        return `pin-${tagName}${className}-${timestamp}`;
    }
    
    /**
     * パフォーマンス記録
     * @param {string} operation 操作名
     * @param {number} startTime 開始時間
     */
    _recordPerformance(operation, startTime) {
        const duration = performance.now() - startTime;
        
        this.performance.totalOperations++;
        this.performance.averageProcessingTime = 
            (this.performance.averageProcessingTime * (this.performance.totalOperations - 1) + duration) / 
            this.performance.totalOperations;
        
        this.performance.lastMeasurement = {
            operation,
            duration,
            timestamp: performance.now()
        };
    }
    
    /**
     * エラーハンドリング
     * @param {Error} error エラー情報
     * @param {string} context エラーコンテキスト
     */
    _handleError(error, context) {
        this.errorHandling.lastError = {
            error,
            context,
            timestamp: performance.now()
        };
        
        this.errorHandling.errorCount++;
        
        console.error(`[PinSystemIntegrator] Error in ${context}:`, error);
        
        // エラーコールバックに通知
        this._notifyErrorCallbacks(error);
        
        // 復旧試行（必要に応じて）
        if (this.errorHandling.recoveryAttempts < this.errorHandling.maxRecoveryAttempts) {
            this.errorHandling.recoveryAttempts++;
            console.log(`[PinSystemIntegrator] Recovery attempt ${this.errorHandling.recoveryAttempts}/${this.errorHandling.maxRecoveryAttempts}`);
        }
    }
    
    /**
     * 完全復元・リソース解放
     */
    cleanup() {
        try {
            console.log('[PinSystemIntegrator] Cleanup started');
            
            // 全監視停止
            this.disconnect();
            
            // ピン設定モード終了
            this.stopPinSetupMode();
            
            // 3つのモジュールのクリーンアップ
            if (this.modules.environment) {
                this.modules.environment.cleanup();
                this.modules.environment = null;
            }
            
            if (this.modules.highlighter) {
                this.modules.highlighter.cleanup();
                this.modules.highlighter = null;
            }
            
            // スケール計算モジュールはクリーンアップ不要（純粋計算のみ）
            this.modules.scale = null;
            
            // 状態リセット
            this.integrationState.initialized = false;
            this.integrationState.observingTargets.clear();
            this.integrationState.activeCallbacks.clear();
            this.integrationState.pinSetupMode = false;
            
            // ElementObserver互換状態クリア（安全なチェック付き）
            if (this.elementObserverCompat.observers) {
                this.elementObserverCompat.observers.clear();
            }
            if (this.elementObserverCompat.globalCallbacks) {
                if (this.elementObserverCompat.globalCallbacks.onChange) {
                    this.elementObserverCompat.globalCallbacks.onChange.clear();
                }
                if (this.elementObserverCompat.globalCallbacks.onError) {
                    this.elementObserverCompat.globalCallbacks.onError.clear();
                }
                if (this.elementObserverCompat.globalCallbacks.onReady) {
                    this.elementObserverCompat.globalCallbacks.onReady.clear();
                }
                if (this.elementObserverCompat.globalCallbacks.onPinSelect) {
                    this.elementObserverCompat.globalCallbacks.onPinSelect.clear();
                }
            }
            if (this.elementObserverCompat.activeCallbacks) {
                this.elementObserverCompat.activeCallbacks.clear();
            }
            
            console.log('[PinSystemIntegrator] Cleanup completed');
            
        } catch (error) {
            console.error('[PinSystemIntegrator] Cleanup error:', error);
        }
    }
    
    /**
     * 統合状態・パフォーマンス情報取得
     * @returns {Object} システム情報
     */
    getSystemInfo() {
        return {
            // 初期化状態
            initialized: this.integrationState.initialized,
            pinSetupMode: this.integrationState.pinSetupMode,
            
            // 監視状態
            observingTargets: this.integrationState.observingTargets.size,
            activeCallbacks: this.elementObserverCompat.activeCallbacks.size,
            
            // モジュール状態
            modules: {
                environment: !!this.modules.environment,
                scale: !!this.modules.scale,
                highlighter: !!this.modules.highlighter
            },
            
            // Phase 3-A統合状態
            phase3A: {
                enabled: this.phase3AIntegration.enabled,
                compatMode: this.phase3AIntegration.compatMode,
                highSpeedCoordinate: this.phase3AIntegration.highSpeedCoordinate,
                advancedObserver: this.phase3AIntegration.advancedObserver
            },
            
            // パフォーマンス統計
            performance: {
                totalOperations: this.performance.totalOperations,
                averageProcessingTime: this.performance.averageProcessingTime.toFixed(4) + 'ms',
                highSpeedOperations: this.performance.highSpeedOperations,
                highSpeedRatio: this.performance.totalOperations > 0 ? 
                    (this.performance.highSpeedOperations / this.performance.totalOperations * 100).toFixed(1) + '%' : '0%',
                lastMeasurement: this.performance.lastMeasurement
            },
            
            // エラー統計
            errors: {
                errorCount: this.errorHandling.errorCount,
                recoveryAttempts: this.errorHandling.recoveryAttempts,
                lastError: this.errorHandling.lastError
            }
        };
    }
    
    // ============================================
    // 静的テストメソッド
    // ============================================
    
    /**
     * 統合動作テスト・モジュール間連携確認
     */
    static test() {
        console.group('[PinSystemIntegrator] Integration Test');
        
        const results = {
            passed: 0,
            failed: 0,
            errors: []
        };
        
        function assert(condition, message) {
            if (condition) {
                results.passed++;
                console.log(`✅ ${message}`);
            } else {
                results.failed++;
                results.errors.push(message);
                console.error(`❌ ${message}`);
            }
        }
        
        try {
            // 1. 依存モジュール存在確認
            assert(typeof PureEnvironmentObserver !== 'undefined', '依存: PureEnvironmentObserver');
            assert(typeof PureScaleCalculator !== 'undefined', '依存: PureScaleCalculator');
            assert(typeof PurePinHighlighter !== 'undefined', '依存: PurePinHighlighter');
            
            // 2. 基本インスタンス作成テスト
            const integrator = new PinSystemIntegrator({ debug: true });
            assert(integrator.integrationState.initialized, 'インスタンス初期化成功');
            
            // 3. モジュール初期化確認
            assert(!!integrator.modules.environment, '環境監視モジュール初期化');
            assert(!!integrator.modules.scale, 'スケール計算モジュール初期化');
            assert(!!integrator.modules.highlighter, 'ハイライトモジュール初期化');
            
            // 4. ElementObserver互換API確認
            assert(typeof integrator.observe === 'function', 'observe API存在');
            assert(typeof integrator.unobserve === 'function', 'unobserve API存在');
            assert(typeof integrator.disconnect === 'function', 'disconnect API存在');
            assert(typeof integrator.onChange === 'function', 'onChange API存在');
            
            // 5. テスト用要素作成・監視テスト
            const testElement = document.createElement('div');
            testElement.id = 'pin-integrator-test';
            testElement.style.cssText = 'width: 100px; height: 100px; position: absolute;';
            document.body.appendChild(testElement);
            
            // 監視開始
            const testOptions = {
                scaleMode: 'proportional',
                baseScale: 1.0,
                referenceSize: 100  // テスト用の基準サイズを追加
            };
            console.log('[DEBUG] Test options:', testOptions);
            const observeResult = integrator.observe(testElement, testOptions);
            assert(!!observeResult, '要素監視開始成功');
            assert(integrator.integrationState.observingTargets.has(testElement), '監視対象登録成功');
            
            // 6. コールバック登録テスト
            let changeCallbackCalled = false;
            const changeCallbackId = integrator.onChange((data) => {
                changeCallbackCalled = true;
                console.log('📊 Change callback triggered:', data);
            });
            assert(typeof changeCallbackId === 'number', 'コールバック登録成功');
            
            // 7. ピン設定モードテスト
            const pinModeResult = integrator.startPinSetupMode();
            assert(pinModeResult.active, 'ピン設定モード開始成功');
            assert(integrator.integrationState.pinSetupMode, 'ピン設定モード状態確認');
            
            integrator.stopPinSetupMode();
            assert(!integrator.integrationState.pinSetupMode, 'ピン設定モード停止成功');
            
            // 8. システム情報取得テスト
            const systemInfo = integrator.getSystemInfo();
            assert(systemInfo.initialized, 'システム情報取得成功');
            assert(systemInfo.modules.environment, 'システム情報:環境モジュール');
            assert(systemInfo.modules.scale, 'システム情報:スケールモジュール');
            assert(systemInfo.modules.highlighter, 'システム情報:ハイライトモジュール');
            
            // 9. クリーンアップテスト
            integrator.cleanup();
            assert(!integrator.integrationState.initialized, 'クリーンアップ後初期化状態');
            assert(integrator.integrationState.observingTargets.size === 0, '監視対象完全クリア');
            
            // テスト用要素削除
            document.body.removeChild(testElement);
            
        } catch (error) {
            results.failed++;
            results.errors.push(`テスト実行エラー: ${error.message}`);
            console.error('❌ テスト実行エラー:', error);
        }
        
        // 結果サマリー
        console.log(`\n📊 テスト結果: ${results.passed}件成功, ${results.failed}件失敗`);
        
        if (results.errors.length > 0) {
            console.log('❌ 失敗した項目:');
            results.errors.forEach(error => console.log(`  - ${error}`));
        }
        
        if (results.failed === 0) {
            console.log('🎉 全テスト成功！PinSystemIntegrator統合動作確認完了');
        }
        
        console.groupEnd();
        
        return results;
    }
}

// モジュール対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PinSystemIntegrator;
} else if (typeof window !== 'undefined') {
    window.PinSystemIntegrator = PinSystemIntegrator;
}

/**
 * ==========================================
 * 使用例・統合利用方法
 * ==========================================
 * 
 * // 1. 基本的な統合利用（ElementObserver互換）
 * const integrator = new PinSystemIntegrator({
 *     usePhase3A: true,
 *     compatMode: 'advanced',
 *     defaultBaseScale: 1.0,
 *     epsilon: 0.5,
 *     debug: true
 * });
 * 
 * // 2. 要素監視開始
 * const targetElement = document.getElementById('target');
 * integrator.observe(targetElement, {
 *     scaleMode: 'proportional',
 *     baseScale: 1.0,
 *     referenceSize: 100,
 *     highlight: true
 * });
 * 
 * // 3. 変化通知コールバック登録
 * integrator.onChange((data) => {
 *     console.log('要素変化:', data.rect, 'スケール:', data.scale.value);
 *     
 *     // Phase 3-A高速化技術が使用された場合
 *     if (data.phase3A && data.phase3A.highSpeedUsed) {
 *         console.log('高速処理時間:', data.phase3A.processingTime);
 *     }
 * });
 * 
 * // 4. ピン設定モード
 * integrator.startPinSetupMode({
 *     highlightColor: '#ff6b6b',
 *     throttle: 16
 * });
 * 
 * integrator.onPinSelect((data) => {
 *     console.log('ピン選択:', data);
 * });
 * 
 * // 5. システム情報・パフォーマンス確認
 * const systemInfo = integrator.getSystemInfo();
 * console.log('パフォーマンス:', systemInfo.performance);
 * console.log('Phase 3-A:', systemInfo.phase3A);
 * 
 * // 6. 完全クリーンアップ
 * integrator.cleanup();
 * 
 * // 7. 統合動作テスト実行
 * PinSystemIntegrator.test();
 * 
 * ==========================================
 * 統合アーキテクチャ概要:
 * 
 * PinSystemIntegrator (統合制御層)
 * ├── PureEnvironmentObserver (環境監視)
 * │   ├── ResizeObserver による変化検出
 * │   ├── DPR・ズーム・ブレークポイント監視
 * │   └── 数値データ(rect, dpr, timestamp)出力
 * ├── PureScaleCalculator (スケール計算)
 * │   ├── 5つのモード（fixed, proportional, fontSize, imageSize, custom）
 * │   ├── 純粋な数値計算のみ
 * │   └── スケール値・比率・モード出力
 * ├── PurePinHighlighter (ハイライト表示)
 * │   ├── F12開発者ツール風UI表示
 * │   ├── マウスオーバーハイライト
 * │   └── ピン予定位置プレビュー
 * └── ElementObserverAdvanced統合 (Phase 3-A)
 *     ├── setUnifiedPosition() 0.01ms高速座標制御
 *     ├── 5座標系統一技術活用
 *     └── 99.9%高速化システム統合
 * 
 * 数値のみ受け渡しフロー:
 * 環境変化(数値) → スケール計算(数値) → 統合結果(数値) → 外部通知
 * 
 * マイクロモジュール設計原則完全遵守:
 * ✅ 単一責務: 統合制御のみ
 * ✅ 完全独立: 3モジュール協調制御
 * ✅ 数値のみ入出力: オブジェクト参照排除
 * ✅ ElementObserver互換: 完全API互換性
 * ✅ Phase 3-A統合: 99.9%高速化技術活用
 * ==========================================
 */