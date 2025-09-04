/**
 * ElementObserverAdapter.js
 * 
 * 🔄 Phase 2: 既存システム統合アダプター
 * - 責務: 既存ElementObserver Phase 1 → EfficientObserver v2.0 ブリッジ
 * - 戦略: 既存APIを保持しつつ新システムに委譲
 * - 目標: 段階的移行・既存機能無影響・並行稼働確保
 */

class ElementObserverAdapter {
    constructor() {
        console.log('🔄 ElementObserverAdapter 初期化開始');
        
        // 既存システム保持（互換性確保）
        this.legacyObserver = null;
        this.isLegacyMode = false;
        
        // 新システム統合
        this.efficientPinSystem = null;
        this.isNewSystemEnabled = false;
        
        // 移行管理
        this.migrationConfig = {
            mode: 'legacy-first',  // 'legacy-first' | 'efficient-first' | 'parallel'
            enableAutoMigration: true,
            fallbackToLegacy: true
        };
        
        // 状態管理
        this.activeObservations = new Map(); // element -> observationConfig
        this.performanceMetrics = {
            legacyCallCount: 0,
            efficientCallCount: 0,
            migrationSuccessCount: 0,
            fallbackCount: 0
        };
        
        this.initializeSystem();
        console.log('✅ ElementObserverAdapter 初期化完了');
    }
    
    /**
     * 🏗️ システム初期化
     */
    initializeSystem() {
        // 既存システム初期化試行
        try {
            if (window.ElementObserver) {
                this.legacyObserver = new window.ElementObserver();
                this.isLegacyMode = true;
                console.log('✅ レガシー ElementObserver 初期化成功');
            }
        } catch (error) {
            console.warn('⚠️ レガシー ElementObserver 初期化失敗:', error.message);
        }
        
        // 新システム初期化試行
        try {
            if (window.ElementCalculator && window.PinRenderer && window.EfficientObserver) {
                this.efficientPinSystem = {
                    calculator: new window.ElementCalculator(),
                    renderer: new window.PinRenderer(),
                    observer: null // 必要時に初期化
                };
                this.isNewSystemEnabled = true;
                console.log('✅ 効率的ピンシステム v2.0 検出・準備完了');
            }
        } catch (error) {
            console.warn('⚠️ 効率的ピンシステム v2.0 初期化失敗:', error.message);
        }
        
        // システム選択ロジック
        this.selectOptimalSystem();
    }
    
    /**
     * 🎯 最適システム選択
     */
    selectOptimalSystem() {
        if (this.isNewSystemEnabled && this.isLegacyMode) {
            console.log('🔄 両システム利用可能 - 並行稼働モード');
            this.migrationConfig.mode = 'parallel';
        } else if (this.isNewSystemEnabled) {
            console.log('🚀 効率的ピンシステム v2.0 優先モード');
            this.migrationConfig.mode = 'efficient-first';
        } else if (this.isLegacyMode) {
            console.log('🔄 レガシーモード継続');
            this.migrationConfig.mode = 'legacy-first';
        } else {
            console.error('❌ 利用可能なシステムがありません');
        }
    }
    
    /**
     * 🎯 統合観察API（既存互換）
     * @param {Element} targetElement - 対象要素
     * @param {Function} callback - 変更時コールバック
     * @param {Object} options - オプション設定
     */
    observe(targetElement, callback, options = {}) {
        if (!targetElement || typeof callback !== 'function') {
            throw new Error('対象要素とコールバックが必要です');
        }
        
        const observationId = this.generateObservationId(targetElement);
        
        console.log('🎯 ElementObserverAdapter.observe 開始', {
            elementId: targetElement.id,
            observationId: observationId,
            mode: this.migrationConfig.mode
        });
        
        // モード別処理
        switch (this.migrationConfig.mode) {
            case 'efficient-first':
                return this.observeWithEfficientSystem(targetElement, callback, options, observationId);
            
            case 'legacy-first':
                return this.observeWithLegacySystem(targetElement, callback, options, observationId);
            
            case 'parallel':
                return this.observeWithParallelSystem(targetElement, callback, options, observationId);
            
            default:
                throw new Error(`未対応のモード: ${this.migrationConfig.mode}`);
        }
    }
    
    /**
     * 🚀 効率的ピンシステム v2.0での監視
     */
    observeWithEfficientSystem(targetElement, callback, options, observationId) {
        try {
            console.log('🚀 効率的ピンシステム v2.0 で監視開始');
            
            // EfficientObserver初期化（必要時）
            if (!this.efficientPinSystem.observer) {
                this.efficientPinSystem.observer = new window.EfficientObserver(
                    this.efficientPinSystem.calculator,
                    this.efficientPinSystem.renderer
                );
            }
            
            // 効率的ピンシステム用の計算リクエスト構築
            const calculationRequest = this.buildCalculationRequest(targetElement, options);
            
            // 新システムでの監視開始
            this.efficientPinSystem.observer.observe(targetElement, calculationRequest);
            
            // レガシーコールバック形式に適合
            const adaptedCallback = (changeType) => {
                const rect = targetElement.getBoundingClientRect();
                callback(rect, changeType);
            };
            
            // 観察情報記録
            this.activeObservations.set(observationId, {
                type: 'efficient',
                targetElement: targetElement,
                callback: adaptedCallback,
                unobserve: () => this.efficientPinSystem.observer.unobserve(targetElement),
                createdAt: Date.now()
            });
            
            this.performanceMetrics.efficientCallCount++;
            
            console.log('✅ 効率的ピンシステムでの監視開始完了');
            
            return () => this.unobserve(observationId);
            
        } catch (error) {
            console.error('❌ 効率的ピンシステムでの監視失敗:', error);
            
            if (this.migrationConfig.fallbackToLegacy && this.isLegacyMode) {
                console.log('🔄 レガシーシステムにフォールバック');
                this.performanceMetrics.fallbackCount++;
                return this.observeWithLegacySystem(targetElement, callback, options, observationId);
            }
            
            throw error;
        }
    }
    
    /**
     * 🔄 レガシーシステムでの監視
     */
    observeWithLegacySystem(targetElement, callback, options, observationId) {
        try {
            console.log('🔄 レガシーシステムで監視開始');
            
            // 既存ElementObserver Phase 1 API使用
            const unobserve = this.legacyObserver.observe ? 
                this.legacyObserver.observe(targetElement, callback) :
                this.legacyObserver.observeParentSize(targetElement, callback);
            
            // 観察情報記録
            this.activeObservations.set(observationId, {
                type: 'legacy',
                targetElement: targetElement,
                callback: callback,
                unobserve: unobserve,
                createdAt: Date.now()
            });
            
            this.performanceMetrics.legacyCallCount++;
            
            console.log('✅ レガシーシステムでの監視開始完了');
            
            return () => this.unobserve(observationId);
            
        } catch (error) {
            console.error('❌ レガシーシステムでの監視失敗:', error);
            throw error;
        }
    }
    
    /**
     * ⚖️ 並行システムでの監視（両システム同時稼働）
     */
    observeWithParallelSystem(targetElement, callback, options, observationId) {
        console.log('⚖️ 並行システムモード - 両方で監視');
        
        const results = [];
        
        // 効率的ピンシステムでの監視
        try {
            const efficientUnobserve = this.observeWithEfficientSystem(targetElement, callback, options, observationId + '-efficient');
            results.push({ type: 'efficient', unobserve: efficientUnobserve });
            console.log('✅ 効率的ピンシステム並行監視成功');
        } catch (error) {
            console.warn('⚠️ 効率的ピンシステム並行監視失敗:', error.message);
        }
        
        // レガシーシステムでの監視
        try {
            const legacyUnobserve = this.observeWithLegacySystem(targetElement, callback, options, observationId + '-legacy');
            results.push({ type: 'legacy', unobserve: legacyUnobserve });
            console.log('✅ レガシーシステム並行監視成功');
        } catch (error) {
            console.warn('⚠️ レガシーシステム並行監視失敗:', error.message);
        }
        
        if (results.length === 0) {
            throw new Error('並行システム監視: 両方のシステムが失敗しました');
        }
        
        // 並行監視用のunobserve関数
        return () => {
            results.forEach(result => {
                try {
                    result.unobserve();
                } catch (error) {
                    console.warn(`⚠️ ${result.type}システムの監視停止失敗:`, error.message);
                }
            });
        };
    }
    
    /**
     * 🏗️ 計算リクエスト構築（効率的ピンシステム用）
     */
    buildCalculationRequest(targetElement, options) {
        // 要素タイプの自動判定
        const elementType = this.detectElementType(targetElement);
        
        // デフォルトアンカーポイント（中央）
        const defaultAnchorPoints = options.anchorPoints || [
            { id: 'MC', ratioX: 0.5, ratioY: 0.5 }
        ];
        
        return {
            element: targetElement,
            anchorPoints: defaultAnchorPoints,
            elementType: elementType
        };
    }
    
    /**
     * 🔍 要素タイプ検出
     */
    detectElementType(element) {
        const tagName = element.tagName.toLowerCase();
        const computedStyle = window.getComputedStyle(element);
        
        if (tagName === 'img') {
            return 'image';
        } else if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
            return 'background';
        } else if (tagName === 'div' || tagName === 'section' || tagName === 'main') {
            return 'container';
        } else {
            return 'text';
        }
    }
    
    /**
     * 🛑 監視停止
     */
    unobserve(observationId) {
        const observation = this.activeObservations.get(observationId);
        if (!observation) {
            console.warn(`⚠️ 監視情報が見つかりません: ${observationId}`);
            return;
        }
        
        try {
            observation.unobserve();
            this.activeObservations.delete(observationId);
            console.log(`✅ 監視停止完了: ${observationId} (${observation.type})`);
        } catch (error) {
            console.error(`❌ 監視停止エラー: ${observationId}`, error);
        }
    }
    
    /**
     * 🆔 観察ID生成
     */
    generateObservationId(element) {
        const elementId = element.id || element.tagName.toLowerCase();
        const timestamp = Date.now();
        return `obs-${elementId}-${timestamp}`;
    }
    
    /**
     * 📊 パフォーマンス統計取得
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            activeObservationCount: this.activeObservations.size,
            systemAvailability: {
                legacy: this.isLegacyMode,
                efficient: this.isNewSystemEnabled
            },
            currentMode: this.migrationConfig.mode
        };
    }
    
    /**
     * ⚙️ 移行設定更新
     */
    updateMigrationConfig(newConfig) {
        this.migrationConfig = { ...this.migrationConfig, ...newConfig };
        console.log('⚙️ 移行設定更新:', this.migrationConfig);
        
        // システム再選択
        this.selectOptimalSystem();
    }
    
    /**
     * 🧹 完全クリーンアップ
     */
    destroy() {
        // 全監視停止
        this.activeObservations.forEach((observation, id) => {
            this.unobserve(id);
        });
        
        // システムクリーンアップ
        if (this.efficientPinSystem && this.efficientPinSystem.observer) {
            this.efficientPinSystem.observer.destroy();
        }
        
        console.log('🧹 ElementObserverAdapter完全クリーンアップ完了');
    }
    
    /**
     * 🔍 デバッグ情報取得
     */
    getDebugInfo() {
        return {
            migrationConfig: this.migrationConfig,
            systemStatus: {
                legacy: {
                    available: this.isLegacyMode,
                    instance: !!this.legacyObserver
                },
                efficient: {
                    available: this.isNewSystemEnabled,
                    components: {
                        calculator: !!(this.efficientPinSystem?.calculator),
                        renderer: !!(this.efficientPinSystem?.renderer),
                        observer: !!(this.efficientPinSystem?.observer)
                    }
                }
            },
            activeObservations: Array.from(this.activeObservations.entries()).map(([id, obs]) => ({
                id: id,
                type: obs.type,
                element: obs.targetElement.tagName + (obs.targetElement.id ? `#${obs.targetElement.id}` : ''),
                age: Date.now() - obs.createdAt
            })),
            performanceMetrics: this.performanceMetrics
        };
    }
}

// グローバル公開
if (typeof window !== 'undefined') {
    window.ElementObserverAdapter = ElementObserverAdapter;
    console.log('✅ ElementObserverAdapter グローバル公開完了');
}

// AMD/CommonJS対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElementObserverAdapter;
}