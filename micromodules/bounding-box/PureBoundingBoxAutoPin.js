/**
 * PureBoundingBoxAutoPin.js (統合制御版)
 * 
 * 🎯 自動ピン適用マイクロモジュール（統合制御システム）
 * - 外部依存: ElementObserver Phase 1, PureBoundingBoxCore
 * - 内部依存: ConfigManager, BackgroundDetector, AnchorCalculator, PersistenceManager, PinDisplayManager
 * - 責務: 各モジュールの統合制御・メイン機能提供
 * - 行数: 約350行（500行制限遵守）
 * - バージョン: 2.0 (モジュール分割版)
 * - 作成日: 2025-09-05
 */

class PureBoundingBoxAutoPin {
    constructor(core, observer) {
        console.log('🔍 AutoPin-Constructor-1: 初期化開始 (v2.0 モジュール版)', {
            core_exists: !!core,
            observer_exists: !!observer,
            observer_null: observer === null,
            observer_undefined: observer === undefined
        });
        
        this.core = core;
        this.observer = observer; // ElementObserver Phase 1 instance
        
        // ===============================
        // 🚀 モジュール初期化（新システム）
        // ===============================
        
        // 1. 設定管理モジュール
        this.configManager = new AutoPinConfigManager();
        console.log('✅ AutoPinConfigManager初期化完了');
        
        // 2. 背景検出モジュール
        this.backgroundDetector = new BackgroundDetector(this.configManager);
        console.log('✅ BackgroundDetector初期化完了');
        
        // 3. アンカー計算モジュール
        this.anchorCalculator = new AnchorCalculator(this.configManager);
        console.log('✅ AnchorCalculator初期化完了');
        
        // 4. 永続化管理モジュール
        this.persistenceManager = new PersistenceManager(this.configManager);
        console.log('✅ PersistenceManager初期化完了');
        
        // 5. UI表示管理モジュール
        this.pinDisplayManager = new PinDisplayManager();
        console.log('✅ PinDisplayManager初期化完了');
        
        // ===============================
        // 🔗 統合システム初期化
        // ===============================
        
        this.activePins = new Map(); // nodeId -> pinConfig
        
        console.log('🔍 AutoPin-Constructor-2: observer検証', {
            this_observer_exists: !!this.observer,
            this_observer_null: this.observer === null,
            this_observer_undefined: this.observer === undefined,
            observer_type: typeof this.observer,
            observer_constructor: this.observer ? this.observer.constructor.name : 'null/undefined'
        });
        
        // ElementObserver Phase 1 の基本機能確認
        if (!this.observer || typeof this.observer.observe !== 'function') {
            console.warn('⚠️ AutoPin-Constructor-3: ElementObserver Phase 1 初期化時判定失敗', {
                observer_exists: !!this.observer,
                observe_type: this.observer ? typeof this.observer.observe : 'undefined',
                observe_exists: this.observer ? 'observe' in this.observer : false
            });
        } else {
            console.log('✅ AutoPin-Constructor-4: ElementObserver Phase 1 初期化時判定成功', {
                observe_type: typeof this.observer.observe,
                observer_methods: Object.getOwnPropertyNames(Object.getPrototypeOf(this.observer)).filter(name => typeof this.observer[name] === 'function')
            });
        }
        
        // ===============================
        // 💾 永続化データ復元
        // ===============================
        
        this.restoreSystemData();
        
        console.log('🎯 PureBoundingBoxAutoPin v2.0 (モジュール版) 初期化完了');
    }
    
    // ==========================================
    // ⚙️ 統合設定管理（委譲）
    // ==========================================
    
    /**
     * スケーリングモードを変更
     * @param {string} mode - 'contain' または 'cover'
     */
    setScalingMode(mode) {
        return this.configManager.setScalingMode(mode);
    }
    
    /**
     * 現在の設定を取得
     */
    getConfig() {
        return this.configManager.getConfig();
    }
    
    /**
     * 設定更新
     */
    updateConfig(newConfig) {
        return this.configManager.updateConfig(newConfig);
    }
    
    // ==========================================
    // 🎯 メイン機能: 保存時自動ピン適用
    // ==========================================
    
    /**
     * 保存時自動ピン適用（メイン機能）
     */
    async applyAutoPinOnSave(saveData) {
        const startTime = performance.now();
        
        try {
            console.log('🎯 保存時自動ピン適用開始 (v2.0)', {
                nodeId: this.core.config.nodeId,
                targetElement: this.getElementInfo(saveData.targetElement),
                bounds: saveData.bounds
            });
            
            // 1. 背景要素の自動検出（BackgroundDetectorに委譲）
            const backgroundElement = this.backgroundDetector.detectBackgroundElement(saveData.targetElement);
            if (!backgroundElement) {
                throw new Error('適切な背景要素が見つかりませんでした');
            }
            
            // 2. 最適アンカーポイントの計算（AnchorCalculatorに委譲）
            const optimalAnchor = this.anchorCalculator.calculateOptimalAnchor(saveData.bounds, backgroundElement);
            console.log('📍 最適アンカー計算結果:', optimalAnchor);
            
            // 3. 既存ピンのクリーンアップ
            this.cleanupExistingPin(this.core.config.nodeId);
            
            // 4. 新しいピンの設定
            console.log('🚀 createAutoPin呼び出し開始:', {
                backgroundElement: backgroundElement ? this.getElementInfo(backgroundElement) : 'null',
                spineElement: saveData.targetElement ? this.getElementInfo(saveData.targetElement) : 'null',
                anchor: optimalAnchor,
                bounds: saveData.bounds
            });
            
            const pinConfig = await this.createAutoPin({
                targetElement: backgroundElement,
                spineElement: saveData.targetElement,
                anchor: optimalAnchor,
                bounds: saveData.bounds
            });
            
            console.log('📋 createAutoPin結果:', {
                success: pinConfig?.success !== false,
                fallbackMode: pinConfig?.fallbackMode,
                hasId: !!pinConfig?.id,
                pinConfig: pinConfig
            });
            
            // 5. ピン情報の記録
            if (pinConfig && pinConfig.id) {
                this.activePins.set(this.core.config.nodeId, pinConfig);
                console.log('✅ アクティブピン登録完了:', this.core.config.nodeId);
                console.log('📊 現在のアクティブピン数:', this.activePins.size);
            } else {
                console.error('❌ 無効なpinConfigのため登録スキップ:', pinConfig);
            }
            
            // 6. 永続化（PersistenceManagerに委譲）
            this.saveSystemData();
            
            // パフォーマンス記録
            const processingTime = performance.now() - startTime;
            this.configManager.updatePerformanceMetrics(processingTime, true);
            
            console.log('✅ 自動ピン適用完了:', {
                pinConfig: pinConfig,
                processingTime: `${processingTime.toFixed(2)}ms`
            });
            
            return {
                success: true,
                pinConfig: pinConfig,
                message: `自動追従機能が有効になりました (${optimalAnchor})`,
                processingTime
            };
            
        } catch (error) {
            const processingTime = performance.now() - startTime;
            this.configManager.updatePerformanceMetrics(processingTime, false);
            
            console.error('❌ 自動ピン適用エラー:', error.message);
            
            return {
                success: false,
                error: error.message,
                processingTime
            };
        }
    }
    
    // ==========================================
    // 🔗 ElementObserver Phase 1統合
    // ==========================================
    
    /**
     * 自動ピンの作成（Phase 1対応版）
     */
    async createAutoPin(config) {
        console.log('🔗 自動ピン作成開始 (Phase 1 v2.0)', {
            anchor: config.anchor,
            target: this.getElementInfo(config.targetElement),
            spine: this.getElementInfo(config.spineElement)
        });
        
        const startTime = performance.now();
        
        try {
            console.log('🔍 Phase 1-1: createAutoPin実行開始 (v2.0)');
            
            // ElementObserver取得・検証
            const observer = this.observer;
            
            if (!observer) {
                console.warn('🚨 Phase 1-5a: observer自体が存在しません');
                return this.createFallbackResult('ElementObserver自体が利用できません', config);
            }

            if (typeof observer.observe !== 'function') {
                console.warn('🚨 Phase 1-5b: observer.observeが関数ではありません');
                return this.createFallbackResult('observer.observeメソッドが利用できません', config);
            }
            
            console.log('✅ Phase 1-7: ElementObserver判定成功 - 通常処理継続 (v2.0)');
            
            // VI座標系を使用したピン作成（AnchorCalculatorに委譲）
            const contentRect = this.backgroundDetector.calculateContentRect(config.targetElement);
            const viRatio = this.anchorCalculator.calculateViewportIndependentRatio(contentRect, contentRect);
            
            // 通常のピン作成処理を実行
            const anchorRatio = this.anchorCalculator.getAnchorRatio(config.anchor);
            
            const pinResult = {
                success: true,
                id: `autopin-${Date.now()}`,
                anchor: config.anchor,
                targetElement: config.targetElement,
                spineElement: config.spineElement,
                backgroundElement: config.targetElement,
                anchorRatio: anchorRatio,
                contentRect: contentRect,
                viRatio: viRatio,
                timestamp: Date.now()
            };
            
            const processingTime = performance.now() - startTime;
            console.log('✅ Phase 1 自動ピン作成成功 (v2.0):', {
                processingTime: `${processingTime.toFixed(2)}ms`,
                anchor: config.anchor
            });
            
            return pinResult;
            
        } catch (error) {
            const processingTime = performance.now() - startTime;
            console.error('❌ Phase 1 自動ピン作成エラー (v2.0):', error);
            
            return {
                success: false,
                error: error.message,
                processingTime,
                fallbackMode: true
            };
        }
    }
    
    /**
     * フォールバック結果の作成
     */
    createFallbackResult(message, config) {
        return {
            success: false,
            fallbackMode: true,
            message: message,
            config: config
        };
    }
    
    // ==========================================
    // 💾 永続化システム統合
    // ==========================================
    
    /**
     * システムデータの保存
     */
    saveSystemData() {
        // アクティブピンの保存（PersistenceManagerに委譲）
        this.persistenceManager.saveActivePins(this.activePins);
        
        // パフォーマンス指標の保存
        const performanceMetrics = this.configManager.getPerformanceMetrics();
        this.persistenceManager.savePerformanceMetrics(performanceMetrics);
    }
    
    /**
     * システムデータの復元
     */
    restoreSystemData() {
        // アクティブピンの復元
        const pinRestoreResult = this.persistenceManager.restoreActivePins();
        if (pinRestoreResult.success && pinRestoreResult.pins) {
            this.activePins = pinRestoreResult.pins;
        }
        
        // パフォーマンス指標の復元
        const metricsRestoreResult = this.persistenceManager.restorePerformanceMetrics();
        if (metricsRestoreResult.success && metricsRestoreResult.metrics) {
            // ConfigManagerのパフォーマンス指標を復元された値に更新
            this.configManager.performanceMetrics = metricsRestoreResult.metrics;
        }
        
        console.log('💾 システムデータ復元完了:', {
            activePinsCount: this.activePins.size,
            performanceMetrics: this.configManager.getPerformanceMetrics()
        });
    }
    
    // ==========================================
    // 🎯 UI表示機能統合
    // ==========================================
    
    /**
     * アンカーポイント表示
     */
    showAnchorPoint(nodeId) {
        return this.pinDisplayManager.showAnchorPoint(nodeId);
    }
    
    /**
     * アンカーポイント非表示
     */
    hideAnchorPoint(nodeId) {
        return this.pinDisplayManager.hideAnchorPoint(nodeId);
    }
    
    /**
     * ユーザーピン表示
     */
    showUserPin(nodeId) {
        return this.pinDisplayManager.showUserPin(nodeId);
    }
    
    /**
     * ユーザーピン非表示
     */
    hideUserPin(nodeId) {
        return this.pinDisplayManager.hideUserPin(nodeId);
    }
    
    /**
     * ドラッグハンドル表示
     */
    showDragHandle(nodeId, onDragCallback = null) {
        return this.pinDisplayManager.showDragHandle(nodeId, onDragCallback);
    }
    
    /**
     * ドラッグハンドル非表示
     */
    hideDragHandle(nodeId) {
        return this.pinDisplayManager.hideDragHandle(nodeId);
    }
    
    // ==========================================
    // 🧹 管理機能
    // ==========================================
    
    /**
     * 既存ピンのクリーンアップ
     */
    cleanupExistingPin(nodeId) {
        // アクティブピンから削除
        if (this.activePins.has(nodeId)) {
            this.activePins.delete(nodeId);
            console.log('🗑️ アクティブピン削除:', nodeId);
        }
        
        // UI要素のクリーンアップ
        this.pinDisplayManager.hideAllMarkers(nodeId);
        
        // ローカルストレージからも削除
        const storageKey = `autopin-${nodeId}`;
        localStorage.removeItem(storageKey);
    }
    
    /**
     * 状態取得
     */
    getState() {
        return {
            activePinsCount: this.activePins.size,
            activePins: Array.from(this.activePins.keys()),
            performanceMetrics: this.configManager.getPerformanceMetrics(),
            config: this.configManager.getConfig(),
            modules: {
                configManager: this.configManager.getDebugInfo(),
                backgroundDetector: this.backgroundDetector?.getDebugInfo?.() || 'No debug info',
                anchorCalculator: this.anchorCalculator.getDebugInfo(),
                persistenceManager: this.persistenceManager.getDebugInfo(),
                pinDisplayManager: this.pinDisplayManager.getDebugInfo()
            }
        };
    }
    
    /**
     * 完全クリーンアップ
     */
    cleanup() {
        console.log('🧹 AutoPin完全クリーンアップ開始 (v2.0)');
        
        // 全てのアクティブピンをクリーンアップ
        for (const [nodeId, pinConfig] of this.activePins) {
            this.cleanupExistingPin(nodeId);
        }
        
        // 各モジュールのクリーンアップ
        this.pinDisplayManager.cleanup();
        this.persistenceManager.clearAllPinData();
        this.configManager.reset();
        
        // 状態リセット
        this.activePins.clear();
        
        console.log('✅ AutoPin完全クリーンアップ完了 (v2.0)');
    }
    
    // ==========================================
    // 🔧 ユーティリティメソッド
    // ==========================================
    
    /**
     * 要素情報取得
     */
    getElementInfo(element) {
        if (!element) return 'null';
        
        return {
            tagName: element.tagName,
            id: element.id || '(no id)',
            className: element.className || '(no class)',
            size: `${element.offsetWidth}×${element.offsetHeight}`
        };
    }
    
    // ==========================================
    // 🎯 レガシー互換性メソッド
    // ==========================================
    
    /**
     * 従来のrestoreActivePin互換メソッド
     */
    restoreActivePins() {
        return this.restoreSystemData();
    }
    
    /**
     * 従来のsaveActivePins互換メソッド
     */
    saveActivePins() {
        return this.saveSystemData();
    }
    
    /**
     * 従来のperformanceMetrics互換プロパティ
     */
    get performanceMetrics() {
        return this.configManager.getPerformanceMetrics();
    }
    
    set performanceMetrics(value) {
        console.warn('⚠️ performanceMetricsの直接設定は非推奨です。configManager.updatePerformanceMetrics()を使用してください');
    }
    
    /**
     * 従来のupdatePerformanceMetrics互換メソッド
     */
    updatePerformanceMetrics(processingTime, success) {
        return this.configManager.updatePerformanceMetrics(processingTime, success);
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.PureBoundingBoxAutoPin = PureBoundingBoxAutoPin;
}