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
        // console.log('🔍 AutoPin-Constructor-1: 初期化開始 (v2.0 モジュール版)', {
        //     core_exists: !!core,
        //     observer_exists: !!observer,
        //     observer_null: observer === null,
        //     observer_undefined: observer === undefined
        // }); // ログ無効化
        
        this.core = core;
        this.observer = observer; // ElementObserver Phase 1 instance
        
        // 🎯 ピン追従制御フラグ（BB編集中は無効化）
        this.pinSyncEnabled = true;
        
        // ===============================
        // 🚀 モジュール初期化（新システム）
        // ===============================
        
        // 1. 設定管理モジュール
        this.configManager = new AutoPinConfigManager();
        // console.log('✅ AutoPinConfigManager初期化完了'); // ログ無効化
        
        // 2. 背景検出モジュール
        this.backgroundDetector = new BackgroundDetector(this.configManager);
        // console.log('✅ BackgroundDetector初期化完了'); // ログ無効化
        
        // 3. アンカー計算モジュール
        this.anchorCalculator = new AnchorCalculator(this.configManager);
        // console.log('✅ AnchorCalculator初期化完了'); // ログ無効化
        
        // 4. 永続化管理モジュール
        this.persistenceManager = new PersistenceManager(this.configManager);
        // console.log('✅ PersistenceManager初期化完了'); // ログ無効化
        
        // 5. UI表示管理モジュール
        this.pinDisplayManager = new PinDisplayManager();
        // console.log('✅ PinDisplayManager初期化完了'); // ログ無効化
        
        // ===============================
        // 🔗 統合システム初期化
        // ===============================
        
        this.activePins = new Map(); // nodeId -> pinConfig
        
        // console.log('🔍 AutoPin-Constructor-2: observer検証', {
        //     this_observer_exists: !!this.observer,
        //     this_observer_null: this.observer === null,
        //     this_observer_undefined: this.observer === undefined,
        //     observer_type: typeof this.observer,
        //     observer_constructor: this.observer ? this.observer.constructor.name : 'null/undefined'
        // }); // ログ無効化
        
        // ElementObserver Phase 1 の基本機能確認
        if (!this.observer || typeof this.observer.observe !== 'function') {
            // console.warn('⚠️ AutoPin-Constructor-3: ElementObserver Phase 1 初期化時判定失敗', {
            //     observer_exists: !!this.observer,
            //     observe_type: this.observer ? typeof this.observer.observe : 'undefined',
            //     observe_exists: this.observer ? 'observe' in this.observer : false
            // }); // ログ無効化
        } else {
            // console.log('✅ AutoPin-Constructor-4: ElementObserver Phase 1 初期化時判定成功', {
            //     observe_type: typeof this.observer.observe,
            //     observer_methods: Object.getOwnPropertyNames(Object.getPrototypeOf(this.observer)).filter(name => typeof this.observer[name] === 'function')
            // }); // ログ無効化
        }
        
        // ===============================
        // 💾 永続化データ復元
        // ===============================
        
        this.restoreSystemData();
        
        // ===============================
        // 🔄 レスポンシブ追従システム初期化
        // ===============================
        
        this.initializeResponsiveSystem();
        
        // BB編集イベント監視の設定
        this.setupBoundingBoxEventListeners();
        
        // console.log('🎯 PureBoundingBoxAutoPin v2.0 (モジュール版) 初期化完了'); // ログ無効化
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
            // console.log('🎯 保存時自動ピン適用開始 (v2.0)', {
            //     nodeId: this.core.config.nodeId,
            //     targetElement: this.getElementInfo(saveData.targetElement),
            //     bounds: saveData.bounds
            // }); // ログ無効化
            
            // 1. 背景要素の自動検出（BackgroundDetectorに委譲）
            const backgroundElement = this.backgroundDetector.detectBackgroundElement(saveData.targetElement);
            if (!backgroundElement) {
                throw new Error('適切な背景要素が見つかりませんでした');
            }
            
            // 2. 最適アンカーポイントの計算（AnchorCalculatorに委譲）
            const optimalAnchor = this.anchorCalculator.calculateOptimalAnchor(saveData.bounds, backgroundElement);
            // console.log('📍 最適アンカー計算結果:', optimalAnchor); // ログ無効化
            
            // 3. 既存ピンのクリーンアップ
            this.cleanupExistingPin(this.core.config.nodeId);
            
            // 4. 新しいピンの設定
            // console.log('🚀 createAutoPin呼び出し開始:', {
            //     backgroundElement: backgroundElement ? this.getElementInfo(backgroundElement) : 'null',
            //     spineElement: saveData.targetElement ? this.getElementInfo(saveData.targetElement) : 'null',
            //     anchor: optimalAnchor,
            //     bounds: saveData.bounds
            // }); // ログ無効化
            
            const pinConfig = await this.createAutoPin({
                targetElement: backgroundElement,
                spineElement: saveData.targetElement,
                anchor: optimalAnchor,
                bounds: saveData.bounds
            });
            
            // console.log('📋 createAutoPin結果:', {
            //     success: pinConfig?.success !== false,
            //     fallbackMode: pinConfig?.fallbackMode,
            //     hasId: !!pinConfig?.id,
            //     pinConfig: pinConfig
            // }); // ログ無効化
            
            // 5. ピン情報の記録
            if (pinConfig && pinConfig.id) {
                this.activePins.set(this.core.config.nodeId, pinConfig);
                // console.log('✅ アクティブピン登録完了:', this.core.config.nodeId); // ログ無効化
                // console.log('📊 現在のアクティブピン数:', this.activePins.size); // ログ無効化
            } else {
                // console.error('❌ 無効なpinConfigのため登録スキップ:', pinConfig); // ログ無効化
            }
            
            // 6. 永続化（PersistenceManagerに委譲）
            this.saveSystemData();
            
            // 🎯 Phase 1: 保存処理完了後に座標レイヤースワップを強制実行
            this.forceCoordinateLayerSwapOnSave(saveData.targetElement);
            // パフォーマンス記録
            const processingTime = performance.now() - startTime;
            this.configManager.updatePerformanceMetrics(processingTime, true);
            
            // console.log('✅ 自動ピン適用完了:', {
            //     pinConfig: pinConfig,
            //     processingTime: `${processingTime.toFixed(2)}ms`
            // }); // ログ無効化
            
            return {
                success: true,
                pinConfig: pinConfig,
                message: `自動追従機能が有効になりました (${optimalAnchor})`,
                processingTime
            };
            
        } catch (error) {
            const processingTime = performance.now() - startTime;
            this.configManager.updatePerformanceMetrics(processingTime, false);
            
            // console.error('❌ 自動ピン適用エラー:', error.message); // ログ無効化
            
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
        // console.log('🔗 自動ピン作成開始 (Phase 1 v2.0)', {
        //     anchor: config.anchor,
        //     target: this.getElementInfo(config.targetElement),
        //     spine: this.getElementInfo(config.spineElement)
        // }); // ログ無効化
        
        const startTime = performance.now();
        
        try {
            // console.log('🔍 Phase 1-1: createAutoPin実行開始 (v2.0)'); // ログ無効化
            
            // ElementObserver取得・検証
            const observer = this.observer;
            
            if (!observer) {
                // console.warn('🚨 Phase 1-5a: observer自体が存在しません'); // ログ無効化
                return this.createFallbackResult('ElementObserver自体が利用できません', config);
            }

            if (typeof observer.observe !== 'function') {
                // console.warn('🚨 Phase 1-5b: observer.observeが関数ではありません'); // ログ無効化
                return this.createFallbackResult('observer.observeメソッドが利用できません', config);
            }
            
            // console.log('✅ Phase 1-7: ElementObserver判定成功 - 通常処理継続 (v2.0)'); // ログ無効化
            
            // VI座標系を使用したピン作成（AnchorCalculatorに委譲）
            const contentRect = this.backgroundDetector.calculateContentRect(config.targetElement);
            // 🆕 シンプル比率計算に変更
            const simpleRatio = this.anchorCalculator.calculateSimpleRatio(contentRect, contentRect);
            
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
            // console.log('✅ Phase 1 自動ピン作成成功 (v2.0):', {
            //     processingTime: `${processingTime.toFixed(2)}ms`,
            //     anchor: config.anchor
            // }); // ログ無効化
            
            return pinResult;
            
        } catch (error) {
            const processingTime = performance.now() - startTime;
            // console.error('❌ Phase 1 自動ピン作成エラー (v2.0):', error); // ログ無効化
            
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
        // 🚨 修正: 個別保存されたピンデータを保護
        // localStorage内の個別ピンデータ（user-pin-*, autopin-*）をマージしてから保存
        this.mergeAndSaveActivePins();
        
        // パフォーマンス指標の保存
        const performanceMetrics = this.configManager.getPerformanceMetrics();
        this.persistenceManager.savePerformanceMetrics(performanceMetrics);
    }
    
    /**
     * 個別保存データをマージしてから統合保存
     */
    mergeAndSaveActivePins() {
        // 現在のactivePinsと個別保存データをマージ
        const mergedPins = new Map(this.activePins);
        
        // localStorage内のautopin-*個別データを確認・マージ
        const keys = Object.keys(localStorage);
        const autoPinKeys = keys.filter(key => key.startsWith('autopin-') && key !== 'autopin-active-pins' && key !== 'autopin-performance-metrics');
        
        for (const key of autoPinKeys) {
            try {
                const nodeId = key.replace('autopin-', '');
                const data = localStorage.getItem(key);
                
                if (data) {
                    const pinConfig = JSON.parse(data);
                    // タイムスタンプが新しいデータを優先
                    const existingPin = mergedPins.get(nodeId);
                    
                    if (!existingPin || !existingPin.timestamp || pinConfig.timestamp > existingPin.timestamp) {
                        // デシリアライズして正しい形式に変換
                        const deserializedPin = this.persistenceManager.deserializePinConfig(pinConfig);
                        if (deserializedPin) {
                            mergedPins.set(nodeId, deserializedPin);
                            // console.log(`🔄 新しいピンデータをマージ: ${nodeId}`, pinConfig); // ログ無効化
                        }
                    }
                }
            } catch (error) {
                // console.warn(`⚠️ ピンデータマージ失敗 (${key}):`, error.message); // ログ無効化
            }
        }
        
        // マージされたデータで保存
        // console.log('💾 マージ後の統合保存開始:', mergedPins.size); // ログ無効化
        this.persistenceManager.saveActivePins(mergedPins);
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
        
        // console.log('💾 システムデータ復元完了:', {
        //     activePinsCount: this.activePins.size,
        //     performanceMetrics: this.configManager.getPerformanceMetrics()
        // }); // ログ無効化
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
            // console.log('🗑️ アクティブピン削除:', nodeId); // ログ無効化
        }
        
        // UI要素のクリーンアップ
        this.pinDisplayManager.hideAllMarkers(nodeId);
        
        // ローカルストレージからも削除
        const storageKey = `autopin-${nodeId}`;
        localStorage.removeItem(storageKey);
    }
    
    /**
     * 状態取得
     * 🎯 Phase 1: 座標レイヤー管理状態も追加
     */
    getState() {
        return {
            activePinsCount: this.activePins.size,
            activePins: Array.from(this.activePins.keys()),
            performanceMetrics: this.configManager.getPerformanceMetrics(),
            config: this.configManager.getConfig(),
            // 🎯 Phase 1: 座標レイヤー管理状態
            coordinateSystem: {
                pinSyncEnabled: this.pinSyncEnabled,
                originalSpineSettingsCount: this.originalSpineSettings ? Object.keys(this.originalSpineSettings).length : 0,
                activeCanvases: this.originalSpineSettings ? Object.keys(this.originalSpineSettings) : [],
                mode: this.pinSyncEnabled ? 'AutoPin座標系' : 'Original座標系'
            },
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
     * 🎯 Phase 1: 座標レイヤー管理のクリーンアップも追加
     */
    cleanup() {
        // console.log('🧹 [Phase 1] AutoPin完全クリーンアップ開始 (v2.0)'); // ログ無効化
        
        // 🎯 Phase 1: 全てのSpineキャンバスでピン追従モードを終了
        if (this.originalSpineSettings) {
            for (const canvasId of Object.keys(this.originalSpineSettings)) {
                const spineCanvas = document.getElementById(canvasId);
                if (spineCanvas) {
                    this.endPinFollowingMode(spineCanvas);
                }
            }
            this.originalSpineSettings = null;
        }
        
        // 全てのアクティブピンをクリーンアップ
        for (const [nodeId, pinConfig] of this.activePins) {
            this.cleanupExistingPin(nodeId);
        }
        
        // 各モジュールのクリーンアップ
        this.pinDisplayManager.cleanup();
        this.persistenceManager.clearAllPinData();
        this.configManager.reset();
        
        // レスポンシブシステムのクリーンアップ
        this.cleanupResponsiveSystem();
        
        // 状態リセット
        this.activePins.clear();
        this.pinSyncEnabled = true; // デフォルト状態にリセット
        
        // console.log('✅ [Phase 1] AutoPin完全クリーンアップ完了 (v2.0 + 座標レイヤー管理)'); // ログ無効化
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
        // console.warn('⚠️ performanceMetricsの直接設定は非推奨です。configManager.updatePerformanceMetrics()を使用してください'); // ログ無効化
    }
    
    /**
     * 従来のupdatePerformanceMetrics互換メソッド
     */
    updatePerformanceMetrics(processingTime, success) {
        return this.configManager.updatePerformanceMetrics(processingTime, success);
    }
    
    // ==========================================
    // 🔄 レスポンシブ追従システム
    // ==========================================
    
    /**
     * レスポンシブ追従システムの初期化
     */
    initializeResponsiveSystem() {
        // console.log('🔄 レスポンシブ追従システム初期化開始'); // ログ無効化
        
        // 1. ウィンドウリサイズ時のピン位置更新
        this.setupWindowResizeHandler();
        
        // 2. 要素変更監視（MutationObserver）
        this.setupElementObserver();
        
        // console.log('✅ レスポンシブ追従システム初期化完了'); // ログ無効化
    }
    
    /**
     * ウィンドウリサイズハンドラーの設定
     */
    setupWindowResizeHandler() {
        let resizeTimeout;
        
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // console.log('🔄 ウィンドウリサイズ検出 → ピン位置更新開始'); // ログ無効化
                this.updateAllPinPositions();
            }, 150); // 150msの遅延でリサイズ完了を待つ
        };
        
        window.addEventListener('resize', handleResize);
        
        // スクロールイベントハンドラー
        let scrollTimeout;
        const handleScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                // console.log('🔄 スクロール検出 → ピン位置更新開始'); // ログ無効化
                this.updateAllPinPositions();
            }, 50); // スクロールは50msの遅延（レスポンシブ性重視）
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // インスタンス破棄用の参照保持
        this._resizeHandler = handleResize;
        this._scrollHandler = handleScroll;
        
        // console.log('✅ ウィンドウリサイズ・スクロールハンドラー設定完了'); // ログ無効化
    }
    
    /**
     * 要素変更監視の設定
     */
    setupElementObserver() {
        if (!window.MutationObserver) {
            // console.warn('⚠️ MutationObserver がサポートされていません'); // ログ無効化
            return;
        }
        
        this.mutationObserver = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            
            mutations.forEach((mutation) => {
                // 🚨 ループ防止: Spineキャンバス要素の変更は無視
                const target = mutation.target;
                if (target.tagName === 'CANVAS' || 
                    target.id === 'spine-canvas' || 
                    target.id?.startsWith('spine-') ||
                    target.classList?.contains('spine-canvas')) {
                    return; // Spineキャンバス関連の変更は無視
                }
                
                // 属性変更の監視（style, class の変更）
                if (mutation.type === 'attributes' && 
                   (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                    shouldUpdate = true;
                }
            });
            
            if (shouldUpdate) {
                // console.log('🔄 要素変更検出 → ピン位置更新'); // ログ無効化
                this.updateAllPinPositions();
            }
        });
        
        // ドキュメント全体を監視（属性変更のみ）
        this.mutationObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['style', 'class'],
            subtree: true
        });
        
        // console.log('✅ 要素変更監視設定完了'); // ログ無効化
    }
    
    /**
     * 全てのピン位置を更新
     */
    updateAllPinPositions() {
        try {
            // console.log('🔄 全ピン位置更新開始'); // ログ無効化
            
            // PinDisplayManagerの位置更新メソッドを呼び出し
            if (this.pinDisplayManager && typeof this.pinDisplayManager.updateAllMarkerPositions === 'function') {
                this.pinDisplayManager.updateAllMarkerPositions();
                // console.log('✅ PinDisplayManager位置更新完了'); // ログ無効化
            } else {
                // console.warn('⚠️ PinDisplayManager.updateAllMarkerPositions が利用できません'); // ログ無効化
            }
            
            // 🎯 追加: ピン位置変更に合わせてSpineキャラクター位置も同期更新
            this.syncSpineCharactersToUpdatedPins();
            
        } catch (error) {
            // console.error('❌ ピン位置更新エラー:', error.message); // ログ無効化
        }
    }
    
    /**
     * ピン位置変更に合わせてSpineキャラクター位置を同期更新
     * 🎯 Phase 1: 座標レイヤースワップシステム実装
     */
    syncSpineCharactersToUpdatedPins() {
        try {
            // 🚨 BB編集中はピン追従無効化
            if (!this.pinSyncEnabled) {
                // console.log('🚫 BB編集中のためSpineキャラクター同期スキップ'); // ログ無効化
                return;
            }
            
            // console.log('🎯 [Phase 1] Spineキャラクター位置同期開始（座標レイヤースワップ版）'); // ログ無効化
            
            // 🚨 ループ防止: 一時的にMutationObserver停止
            if (this.mutationObserver) {
                this.mutationObserver.disconnect();
            }
            
            // 統合データから全ピン情報を取得
            const activeData = localStorage.getItem('autopin-active-pins');
            if (!activeData) {
                // console.log('📍 統合データなし - Spineキャラクター同期スキップ'); // ログ無効化
                // MutationObserver再開
                this.reconnectMutationObserver();
                return;
            }
            
            const parsed = JSON.parse(activeData);
            const pins = parsed.pins || {};
            
            for (const [nodeId, pinData] of Object.entries(pins)) {
                // 対象のSpineキャンバスを特定
                const spineCanvas = document.getElementById(pinData.spineElement || 'spine-canvas');
                if (!spineCanvas) {
                    // console.warn(`⚠️ Spineキャンバス未発見 (${pinData.spineElement})`); // ログ無効化
                    continue;
                }
                
                // 🎯 Phase 1: ピン追従開始時の座標レイヤースワップ
                this.startPinFollowingMode(spineCanvas);
                
                // 🎯 座標計算の安全性確認
                const coordinateResult = this.calculatePinCoordinatesSafely(pinData, spineCanvas);
                if (!coordinateResult.success) {
                    // console.warn(`⚠️ 座標計算失敗 (${nodeId}): ${coordinateResult.reason}`); // ログ無効化
                    continue;
                }
                
                // 🎯 適切な座標変換でピン追従位置を適用
                this.applyPinFollowingPosition(spineCanvas, coordinateResult.pinX, coordinateResult.pinY);
                
                // console.log(`🎯 [Phase 1] Spineピン追従: ${nodeId} → (${coordinateResult.pinX.toFixed(1)}, ${coordinateResult.pinY.toFixed(1)})`); // ログ無効化
            }
            
            // console.log('✅ [Phase 1] Spineキャラクター位置同期完了（座標レイヤースワップ保護済み）'); // ログ無効化
            
            // 🚨 ループ防止: MutationObserver再開
            setTimeout(() => {
                this.reconnectMutationObserver();
            }, 100); // 100ms後に再開（安全マージン）
            
        } catch (error) {
            // console.error('❌ [Phase 1] Spineキャラクター同期エラー:', error.message); // ログ無効化
            // エラー時もMutationObserver再開
            this.reconnectMutationObserver();
        }
    }
    
    // ==========================================
    // 🎯 Phase 1: 座標レイヤースワップシステム
    // ==========================================
    
    /**
     * 🎯 Phase 1: ピン追従モード開始（座標レイヤースワップ）
     * BBの座標継承方式を参考にした実装
     */
    startPinFollowingMode(spineCanvas) {
        const canvasId = spineCanvas.id || 'spine-canvas';
        
        // 既にピン追従モードの場合はスキップ
        if (this.originalSpineSettings && this.originalSpineSettings[canvasId]) {
            // console.log(`🎯 [Phase 1] 既にピン追従モード中: ${canvasId}`); // ログ無効化
            return;
        }
        
        // console.log(`🎯 [Phase 1] ピン追従モード開始: ${canvasId}`); // ログ無効化
        
        // 🎯 Step 1: 現在設定をバックアップ（BBのgetBoundingClientRect方式参考）
        const currentRect = spineCanvas.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(spineCanvas);
        
        // インスタンス変数で各Canvas別にバックアップを管理
        if (!this.originalSpineSettings) {
            this.originalSpineSettings = {};
        }
        
        this.originalSpineSettings[canvasId] = {
            // 🎯 座標継承用の現在位置記録（BBの位置継承方式）
            inheritedPosition: {
                left: currentRect.left,
                top: currentRect.top,
                width: currentRect.width,
                height: currentRect.height
            },
            // CSS設定の完全保護
            css: {
                position: spineCanvas.style.position || computedStyle.position,
                left: spineCanvas.style.left || computedStyle.left,
                top: spineCanvas.style.top || computedStyle.top,
                transform: spineCanvas.style.transform || computedStyle.transform,
                width: spineCanvas.style.width || computedStyle.width,
                height: spineCanvas.style.height || computedStyle.height,
                zIndex: spineCanvas.style.zIndex || computedStyle.zIndex
            },
            // StableSpineRenderer設定の保護
            renderer: this.createRendererBackup()
        };
        
        // 🎯 Step 2: AutoPin専用座標系に切り替え
        this.switchToAutoPinCoordinateSystem(spineCanvas);
        
        // console.log(`✅ [Phase 1] ピン追従モード開始完了: ${canvasId}`, {
        //     backup: this.originalSpineSettings[canvasId],
        //     currentMode: 'AutoPin専用座標系'
        // }); // ログ無効化
    }
    
    /**
     * 🎯 Phase 1: AutoPin専用座標系に切り替え（transform競合解消版）
     */
    switchToAutoPinCoordinateSystem(spineCanvas) {
        // console.log(`🎯 [Phase 1] AutoPin専用座標系切り替え開始: ${spineCanvas.id}`); // ログ無効化
        
        // 🔧 Transform競合解消: CSS変数による安全な合成システム
        this.setupTransformCompositionSystem(spineCanvas);
        
        // AutoPin専用座標系適用（設計メモのPhase 1仕様に従う）
        spineCanvas.style.position = 'fixed';
        
        // 🎯 CSS変数でのAutoPinモード設定（競合回避）
        spineCanvas.style.setProperty('--autopin-active', '1');
        spineCanvas.style.setProperty('--autopin-x', '0px');
        spineCanvas.style.setProperty('--autopin-y', '0px');
        
        // 🔧 他システム影響断ち切り（BB編集システム用変数をクリア）
        spineCanvas.style.setProperty('--pbx-edit', 'none');
        
        // 重要: width/height/zIndexは変更しない（競合回避）
        // console.log(`✅ [Phase 1] AutoPin専用座標系適用完了: ${spineCanvas.id}`); // ログ無効化
    }

    /**
     * 🎯 Transform合成システムの設定（競合解消）
     */
    setupTransformCompositionSystem(spineCanvas) {
        // console.log(`🔧 Transform合成システム設定開始: ${spineCanvas.id}`); // ログ無効化
        
        // 現在のtransform値を解析・保護
        const computedStyle = window.getComputedStyle(spineCanvas);
        const currentTransform = computedStyle.transform;
        
        // 基本的なレイアウト用transformを保護
        let baseTransform = 'translate(-50%, -50%)';
        
        // 既存のtransformがmatrix形式の場合、基本形に変換
        if (currentTransform && currentTransform !== 'none') {
            // console.log(`🔍 既存transform保護: ${currentTransform}`); // ログ無効化
            
            // 複雑なtransformの場合は現状維持
            if (currentTransform.includes('matrix')) {
                baseTransform = currentTransform;
            } else if (!currentTransform.includes('translate(-50%, -50%)')) {
                // 中心位置指定がない場合は追加
                baseTransform = `translate(-50%, -50%) ${currentTransform}`;
            } else {
                baseTransform = currentTransform;
            }
        }
        
        // CSS変数による合成transform設定
        spineCanvas.style.setProperty('--base-transform', baseTransform);
        spineCanvas.style.setProperty('--autopin-transform', 'translate(0px, 0px)');
        
        // 合成transformの適用
        const compositeTransform = 'var(--base-transform) var(--autopin-transform)';
        spineCanvas.style.transform = compositeTransform;
        
        // console.log(`✅ Transform合成システム設定完了`, {
        //     baseTransform: baseTransform,
        //     compositeTransform: compositeTransform
        // }); // ログ無効化
    }
    
    /**
     * 🎯 DOM座標をSpine座標系に変換（ElementObserver連携版）
     * @param {number} domX - DOM絶対座標X
     * @param {number} domY - DOM絶対座標Y
     * @param {HTMLElement} spineElement - 対象Spine要素
     * @returns {Object} - 変換されたSpine座標 {x, y, transform, method}
     */
    convertDOMToSpineCoordinates(domX, domY, spineElement) {
        try {
            // console.log('🔄 DOM→Spine座標変換開始', {
            //     domCoords: `(${domX}, ${domY})`,
            //     spineElement: spineElement.id || 'no-id'
            // }); // ログ無効化
            
            // 🎯 方法1: ElementObserver Phase 1での座標変換（推奨）
            if (this.observer && typeof this.observer.getElementRect === 'function') {
                const spineRect = this.observer.getElementRect(spineElement);
                const parentRect = this.observer.getStableParentRect(spineElement);
                
                if (spineRect && parentRect && parentRect.width > 0 && parentRect.height > 0) {
                    // 親要素基準の相対座標に変換
                    const relativeX = domX - parentRect.left;
                    const relativeY = domY - parentRect.top;
                    
                    // Spine要素の中心基準座標系に変換（translate(-50%, -50%)考慮）
                    const spineX = relativeX - (parentRect.width * 0.5);
                    const spineY = relativeY - (parentRect.height * 0.5);
                    
                    // console.log('✅ ElementObserver座標変換完了', {
                    //     method: 'ElementObserver Phase 1',
                    //     domCoords: `(${domX}, ${domY})`,
                    //     parentRect: `${parentRect.width}x${parentRect.height}`,
                    //     spineCoords: `(${spineX.toFixed(1)}, ${spineY.toFixed(1)})`
                    // }); // ログ無効化
                    
                    return {
                        x: spineX,
                        y: spineY,
                        transform: `translate(${spineX}px, ${spineY}px)`,
                        method: 'ElementObserver Phase 1',
                        success: true
                    };
                }
            }
            
            // 🎯 方法2: ElementObserverTransformとの連携（高度変換）
            if (typeof ElementObserverTransform !== 'undefined') {
                const transformHandler = new ElementObserverTransform(spineElement);
                
                // 現在のtransform設定を保持しつつ位置更新
                const parentRect = spineElement.parentElement?.getBoundingClientRect();
                if (parentRect && parentRect.width > 0 && parentRect.height > 0) {
                    const relativeX = domX - parentRect.left;
                    const relativeY = domY - parentRect.top;
                    
                    // 中心基準座標系で計算
                    const centerX = relativeX - (parentRect.width * 0.5);
                    const centerY = relativeY - (parentRect.height * 0.5);
                    
                    // CSS変数で位置更新（transform競合回避）
                    transformHandler.setCSSVariables({
                        tx: centerX,
                        ty: centerY
                    });
                    
                    // console.log('✅ ElementObserverTransform座標変換完了', {
                    //     method: 'ElementObserverTransform',
                    //     spineCoords: `(${centerX.toFixed(1)}, ${centerY.toFixed(1)})`
                    // }); // ログ無効化
                    
                    return {
                        x: centerX,
                        y: centerY,
                        transform: transformHandler.getCombinedTransform(),
                        method: 'ElementObserverTransform',
                        success: true,
                        transformHandler: transformHandler
                    };
                }
            }
            
            // 🎯 方法3: フォールバック座標変換（基本的な変換）
            // console.warn('⚠️ ElementObserver利用不可 → フォールバック座標変換'); // ログ無効化
            
            const parentRect = spineElement.parentElement?.getBoundingClientRect();
            if (parentRect && parentRect.width > 0 && parentRect.height > 0) {
                const relativeX = domX - parentRect.left;
                const relativeY = domY - parentRect.top;
                
                // 中心基準座標系で計算
                const fallbackX = relativeX - (parentRect.width * 0.5);
                const fallbackY = relativeY - (parentRect.height * 0.5);
                
                return {
                    x: fallbackX,
                    y: fallbackY,
                    transform: `translate(${fallbackX}px, ${fallbackY}px)`,
                    method: 'Fallback',
                    success: true
                };
            }
            
            throw new Error('親要素の矩形情報を取得できません');
            
        } catch (error) {
            // console.error('❌ DOM→Spine座標変換エラー:', error.message); // ログ無効化
            
            return {
                x: 0,
                y: 0,
                transform: 'translate(0px, 0px)',
                method: 'Error Fallback',
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 🎯 Phase 1: 適切な座標変換でSpine要素に位置を適用
     */
    applyPinFollowingPosition(spineCanvas, pinX, pinY) {
        try {
            // console.log(`🎯 [Phase 1] 座標変換統合版 位置適用開始: ${spineCanvas.id} → DOM座標(${pinX}, ${pinY})`); // ログ無効化
            
            // DOM座標をSpine座標系に変換
            const spineCoords = this.convertDOMToSpineCoordinates(pinX, pinY, spineCanvas);
            
            if (!spineCoords.success) {
                // console.error('❌ 座標変換失敗 → 直接CSS適用（緊急フォールバック）'); // ログ無効化
                spineCanvas.style.left = `${pinX}px`;
                spineCanvas.style.top = `${pinY}px`;
                return;
            }
            
            // 🎯 適切なSpine座標適用
            this.applySpineCoordinates(spineCanvas, spineCoords);
            
            // console.log(`✅ [Phase 1] 座標変換統合版 位置適用完了: ${spineCanvas.id}`, {
            //     method: spineCoords.method,
            //     spineCoords: `(${spineCoords.x.toFixed(1)}, ${spineCoords.y.toFixed(1)})`
            // }); // ログ無効化
            
        } catch (error) {
            // console.error(`❌ [Phase 1] 座標変換統合版エラー (${spineCanvas.id}):`, error.message); // ログ無効化
            
            // 緊急フォールバック: 直接CSS適用
            spineCanvas.style.left = `${pinX}px`;
            spineCanvas.style.top = `${pinY}px`;
        }
    }

    /**
     * 🎯 Spine座標をSpine要素に適用（CSS変数合成システム対応版）
     */
    applySpineCoordinates(spineCanvas, spineCoords) {
        const { x, y, transform, method, transformHandler } = spineCoords;
        
        // console.log(`🎨 Spine座標適用開始: ${method}`, {
        //     coords: `(${x.toFixed(1)}, ${y.toFixed(1)})`,
        //     canvasId: spineCanvas.id
        // }); // ログ無効化
        
        switch (method) {
            case 'ElementObserverTransform':
                // CSS変数による変換（既に適用済み）
                // console.log('✅ CSS変数による座標適用完了（ElementObserverTransform）'); // ログ無効化
                break;
                
            case 'ElementObserver Phase 1':
                // 🎯 CSS変数合成システムで安全に位置更新
                this.updateAutoPinTransformVariables(spineCanvas, x, y);
                // console.log('✅ CSS変数合成座標適用完了（ElementObserver Phase 1）'); // ログ無効化
                break;
                
            case 'Direct Background Element':
            case 'ElementObserver Safe Calculation':
                // 🎯 安全な計算結果をCSS変数で適用
                this.updateAutoPinTransformVariables(spineCanvas, x, y);
                // console.log('✅ 安全計算結果のCSS変数適用完了'); // ログ無効化
                break;
                
            case 'Fallback':
                // 🎯 フォールバック: CSS変数合成システム使用
                this.updateAutoPinTransformVariables(spineCanvas, x, y);
                // console.log('✅ フォールバックCSS変数適用完了'); // ログ無効化
                break;
                
            default:
                // 🎯 予期しない方法でもCSS変数合成を優先
                // console.warn('⚠️ 未知の座標変換方法 → CSS変数合成で対応:', method); // ログ無効化
                this.updateAutoPinTransformVariables(spineCanvas, x, y);
                break;
        }
        
        // console.log(`✅ Spine座標適用完了: ${spineCanvas.id}`, {
        //     method: method,
        //     finalCoords: `(${x.toFixed(1)}, ${y.toFixed(1)})`
        // }); // ログ無効化
    }
    
    /**
     * 🎯 AutoPin用CSS変数の更新（transform競合解消）
     */
    updateAutoPinTransformVariables(spineCanvas, x, y) {
        // AutoPin用のtransform変数を更新
        const autoPinTransform = `translate(${x}px, ${y}px)`;
        spineCanvas.style.setProperty('--autopin-transform', autoPinTransform);
        spineCanvas.style.setProperty('--autopin-x', `${x}px`);
        spineCanvas.style.setProperty('--autopin-y', `${y}px`);
        
        // 合成transformが設定されていない場合は設定
        const currentTransform = spineCanvas.style.transform;
        if (!currentTransform || !currentTransform.includes('var(--autopin-transform)')) {
            const baseTransform = spineCanvas.style.getPropertyValue('--base-transform') || 'translate(-50%, -50%)';
            spineCanvas.style.transform = `${baseTransform} var(--autopin-transform)`;
            
            // console.log(`🔧 合成transform更新: ${baseTransform} + ${autoPinTransform}`); // ログ無効化
        }
        
        // console.log(`🎨 AutoPinCSS変数更新完了`, {
        //     autoPinTransform: autoPinTransform,
        //     x: x,
        //     y: y
        // }); // ログ無効化
    }
    
    /**
     * 🎯 ピン座標の安全な計算
     * @param {Object} pinData - ピンデータ（anchor, backgroundElement等）
     * @param {HTMLElement} spineCanvas - Spine要素
     * @returns {Object} - 計算結果 {success, pinX, pinY, reason}
     */
    calculatePinCoordinatesSafely(pinData, spineCanvas) {
        try {
            // console.log('🔄 ピン座標安全計算開始', {
            //     nodeId: pinData.spineElement || 'unknown',
            //     anchor: pinData.anchor,
            //     backgroundElement: pinData.backgroundElement
            // }); // ログ無効化
            
            // 🎯 方法1: ElementObserverを使用した安全な座標計算（推奨）
            if (this.observer && typeof this.observer.getStableParentRect === 'function') {
                const result = this.calculateCoordinatesWithElementObserver(pinData, spineCanvas);
                if (result.success) {
                    // console.log('✅ ElementObserver座標計算完了', result); // ログ無効化
                    return result;
                }
            }
            
            // 🎯 方法2: 背景要素直接計算（フォールバック）
            const backgroundElement = this.findBackgroundElement(pinData.backgroundElement);
            if (!backgroundElement) {
                return {
                    success: false,
                    reason: '背景要素が見つかりません'
                };
            }
            
            const rect = backgroundElement.getBoundingClientRect();
            if (!rect || rect.width <= 0 || rect.height <= 0) {
                return {
                    success: false,
                    reason: '背景要素のサイズが無効です'
                };
            }
            
            const anchorRatios = this.getAnchorRatios(pinData.anchor);
            
            // ピン位置（絶対座標）
            const pinX = rect.left + (rect.width * anchorRatios.x);
            const pinY = rect.top + (rect.height * anchorRatios.y);
            
            // console.log('✅ フォールバック座標計算完了', {
            //     method: 'Direct Background Element',
            //     backgroundSize: `${rect.width}x${rect.height}`,
            //     anchor: pinData.anchor,
            //     anchorRatios: anchorRatios,
            //     pinCoords: `(${pinX.toFixed(1)}, ${pinY.toFixed(1)})`
            // }); // ログ無効化
            
            return {
                success: true,
                pinX: pinX,
                pinY: pinY,
                method: 'Direct Background Element'
            };
            
        } catch (error) {
            // console.error('❌ ピン座標計算エラー:', error.message); // ログ無効化
            
            return {
                success: false,
                reason: `計算エラー: ${error.message}`
            };
        }
    }
    
    /**
     * 🎯 ElementObserverを使用した安全な座標計算
     */
    calculateCoordinatesWithElementObserver(pinData, spineCanvas) {
        try {
            // 背景要素を取得
            const backgroundElement = this.findBackgroundElement(pinData.backgroundElement);
            if (!backgroundElement) {
                return {
                    success: false,
                    reason: 'ElementObserver: 背景要素未検出'
                };
            }
            
            // ElementObserverで安全な矩形を取得
            const stableRect = this.observer.getElementRect(backgroundElement);
            if (!stableRect || stableRect.width <= 0 || stableRect.height <= 0) {
                return {
                    success: false,
                    reason: 'ElementObserver: 安全な背景矩形を取得できません'
                };
            }
            
            // 座標変換の安全性チェック
            const safetyCheck = this.observer.isSafeForCoordinateSwap(spineCanvas);
            if (!safetyCheck.safe) {
                // console.warn('⚠️ ElementObserver座標変換安全性警告:', safetyCheck.reason); // ログ無効化
                // 警告のみで続行（完全にブロックはしない）
            }
            
            const anchorRatios = this.getAnchorRatios(pinData.anchor);
            
            // ピン位置（絶対座標）
            const pinX = stableRect.left + (stableRect.width * anchorRatios.x);
            const pinY = stableRect.top + (stableRect.height * anchorRatios.y);
            
            return {
                success: true,
                pinX: pinX,
                pinY: pinY,
                method: 'ElementObserver Safe Calculation',
                safetyCheck: safetyCheck
            };
            
        } catch (error) {
            return {
                success: false,
                reason: `ElementObserver計算エラー: ${error.message}`
            };
        }
    }
    
    /**
     * 🎯 Phase 1: ピン追従モード終了（完全復元）
     */
    endPinFollowingMode(spineCanvas) {
        const canvasId = spineCanvas.id || 'spine-canvas';
        
        if (!this.originalSpineSettings || !this.originalSpineSettings[canvasId]) {
            // console.warn(`⚠️ [Phase 1] バックアップ設定なし: ${canvasId}`); // ログ無効化
            return;
        }
        
        // console.log(`🎯 [Phase 1] ピン追従モード終了: ${canvasId}`); // ログ無効化
        
        const backup = this.originalSpineSettings[canvasId];
        
        // 🎯 完全復元（BBのObject.assign方式）
        Object.assign(spineCanvas.style, backup.css);
        
        // StableSpineRenderer設定の復元
        if (backup.renderer) {
            this.restoreRendererSettings(backup.renderer);
        }
        
        // バックアップデータをクリア
        delete this.originalSpineSettings[canvasId];
        
        // console.log(`✅ [Phase 1] ピン追従モード終了完了: ${canvasId}`); // ログ無効化
    }
    
    /**
     * StableSpineRenderer設定のバックアップ作成
     */
    createRendererBackup() {
        if (window.spineRenderer && window.spineRenderer.skeleton) {
            return {
                scaleX: window.spineRenderer.skeleton.scaleX,
                scaleY: window.spineRenderer.skeleton.scaleY,
                x: window.spineRenderer.skeleton.x,
                y: window.spineRenderer.skeleton.y
            };
        }
        return null;
    }
    
    /**
     * StableSpineRenderer設定の復元
     */
    restoreRendererSettings(rendererBackup) {
        if (rendererBackup && window.spineRenderer && window.spineRenderer.skeleton) {
            window.spineRenderer.skeleton.scaleX = rendererBackup.scaleX;
            window.spineRenderer.skeleton.scaleY = rendererBackup.scaleY;
            // 位置は更新しない（ピン追従のため）
            // window.spineRenderer.skeleton.x = rendererBackup.x;
            // window.spineRenderer.skeleton.y = rendererBackup.y;
            
            // console.log('🛡️ [Phase 1] StableSpineRenderer設定復元完了'); // ログ無効化
        }
    }
    
    /**
     * 🚨 レガシー互換: Phase 1緊急修正用の既存メソッド（非推奨）
     */
    createSpineSettingsBackup(spineCanvas) {
        // レガシー互換性のため残すが、新しいstartPinFollowingMode()使用を推奨
        // console.warn('⚠️ createSpineSettingsBackup()は非推奨です。startPinFollowingMode()を使用してください'); // ログ無効化
        
        const backup = {
            // CSS設定の完全保護
            css: {
                width: spineCanvas.style.width,
                height: spineCanvas.style.height,
                transform: spineCanvas.style.transform,
                zIndex: spineCanvas.style.zIndex
            },
            // StableSpineRenderer設定の保護
            renderer: this.createRendererBackup()
        };
        
        return backup;
    }
    
    /**
     * 🚨 レガシー互換: Phase 1緊急修正用の既存メソッド（非推奨）
     */
    restoreSpineSettings(spineCanvas, backup) {
        // レガシー互換性のため残すが、新しいendPinFollowingMode()使用を推奨
        // console.warn('⚠️ restoreSpineSettings()は非推奨です。endPinFollowingMode()を使用してください'); // ログ無効化
        
        if (!backup) return;
        
        // CSS設定の復元（位置以外）
        const css = backup.css;
        if (css.width !== undefined && css.width !== '') {
            spineCanvas.style.width = css.width;
        }
        if (css.height !== undefined && css.height !== '') {
            spineCanvas.style.height = css.height;
        }
        if (css.transform !== undefined && css.transform !== '') {
            spineCanvas.style.transform = css.transform;
        }
        if (css.zIndex !== undefined && css.zIndex !== '') {
            spineCanvas.style.zIndex = css.zIndex;
        }
        
        // StableSpineRenderer設定の復元
        this.restoreRendererSettings(backup.renderer);
    }
    
    /**
     * MutationObserver再開
     */
    reconnectMutationObserver() {
        if (this.mutationObserver && document.body) {
            try {
                this.mutationObserver.observe(document.body, {
                    attributes: true,
                    attributeFilter: ['style', 'class'],
                    subtree: true
                });
                // console.log('🔄 MutationObserver再開'); // ログ無効化
            } catch (error) {
                // console.warn('⚠️ MutationObserver再開失敗:', error.message); // ログ無効化
            }
        }
    }
    
    /**
     * 背景要素を検索・復元（PinDisplayManager互換）
     */
    findBackgroundElement(backgroundElementInfo) {
        if (!backgroundElementInfo) return null;
        
        // ID優先で検索
        if (backgroundElementInfo.id) {
            const element = document.getElementById(backgroundElementInfo.id);
            if (element) return element;
        }
        
        // セレクター文字列で検索
        if (backgroundElementInfo.selector) {
            const element = document.querySelector(backgroundElementInfo.selector);
            if (element) return element;
        }
        
        // フォールバック: ヒーロー画像要素を検索
        const heroSelectors = ['.hero-section', '.hero-image', '[class*="hero"]'];
        for (const selector of heroSelectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }
        
        return null;
    }
    
    /**
     * アンカー比率取得（PinDisplayManager互換）
     */
    getAnchorRatios(anchor) {
        const anchorMap = {
            'TL': { x: 0, y: 0 },     'TC': { x: 0.5, y: 0 },   'TR': { x: 1, y: 0 },
            'ML': { x: 0, y: 0.5 },   'MC': { x: 0.5, y: 0.5 }, 'MR': { x: 1, y: 0.5 },
            'BL': { x: 0, y: 1 },     'BC': { x: 0.5, y: 1 },   'BR': { x: 1, y: 1 }
        };
        return anchorMap[anchor] || { x: 0.5, y: 0.5 };
    }
    
    // ==========================================
    // 🎯 ピン追従制御システム
    // ==========================================
    
    /**
     * ピン追従機能を無効化（BB編集中）
     * 🎯 Phase 1: ピン追従モード終了も実行
     */
    disablePinSync() {
        this.pinSyncEnabled = false;
        
        // 🎯 Phase 1: 全てのSpineキャンバスでピン追従モードを終了
        if (this.originalSpineSettings) {
            for (const canvasId of Object.keys(this.originalSpineSettings)) {
                const spineCanvas = document.getElementById(canvasId);
                if (spineCanvas) {
                    this.endPinFollowingMode(spineCanvas);
                }
            }
        }
        
        // console.log('🚫 [Phase 1] ピン追従機能無効化（BB編集中・座標レイヤー復元済み）'); // ログ無効化
    }
    
    /**
     * ピン追従機能を有効化（BB編集完了時）
     * 🎯 Phase 1: ピン追従モード開始も実行
     */
    enablePinSync() {
        this.pinSyncEnabled = true;
        // console.log('✅ [Phase 1] ピン追従機能有効化（BB編集完了）'); // ログ無効化
        
        // 有効化後、即座に位置同期を実行（新システムでピン追従モードも開始）
        this.updateAllPinPositions();
    }
    
    /**
     * BB編集イベント監視の設定
     */
    setupBoundingBoxEventListeners() {
        // BB選択時（編集開始）
        document.addEventListener('boundingBoxSelected', (event) => {
            // console.log('🎯 BB選択検出 → ピン追従無効化', event.detail); // ログ無効化
            this.disablePinSync();
        });
        
        // BB選択解除時（編集完了・保存）
        document.addEventListener('boundingBoxDeselected', (event) => {
            // console.log('🎯 BB選択解除検出 → ピン追従有効化', event.detail); // ログ無効化
            this.enablePinSync();
        });
        
        // console.log('✅ BB編集イベント監視設定完了'); // ログ無効化
    }
    
    /**
     * レスポンシブシステムのクリーンアップ
     */
    cleanupResponsiveSystem() {
        // ウィンドウリサイズハンドラーを削除
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }
        
        if (this._scrollHandler) {
            window.removeEventListener('scroll', this._scrollHandler);
            this._scrollHandler = null;
        }
        
        // MutationObserverを停止
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
        
        // console.log('✅ レスポンシブシステムクリーンアップ完了'); // ログ無効化
    }
    /**
     * 🎯 Phase 1: 保存時の座標レイヤースワップ強制実行
     * pinSyncEnabledの状態に関係なく実行する強制版
     */
    forceCoordinateLayerSwapOnSave(spineElement) {
        // console.log("🎯 [Phase 1] 保存時座標レイヤースワップ強制実行"); // ログ無効化
        
        try {
            const spineCanvas = document.getElementById(spineElement || "spine-canvas");
            if (!spineCanvas) {
                // console.warn("⚠️ Spineキャンバス未発見:", spineElement || "spine-canvas"); // ログ無効化
                return;
            }
            
            // 🚨 重要: pinSyncEnabledの状態に関係なく座標レイヤースワップを実行
            // console.log("🎯 [Phase 1] 強制座標レイヤースワップ実行 - pinSyncEnabled:", this.pinSyncEnabled); // ログ無効化
            
            // 背景要素の自動検出
            const backgroundElement = this.backgroundDetector.detectBackgroundElement(spineCanvas.parentElement || document.body);
            if (backgroundElement) {
                // ピン追従モードを強制開始
                this.startPinFollowingMode(spineCanvas);
                
                // 最適アンカーポイントを取得（既存のピンデータがある場合は使用）
                const nodeId = this.core.config.nodeId || "spine-canvas";
                const activePinData = this.activePins.get(nodeId);
                const anchor = activePinData?.anchor || "MC";
                
                // 背景要素からアンカー位置を計算
                const rect = backgroundElement.getBoundingClientRect();
                const anchorRatios = this.getAnchorRatios(anchor);
                
                // ピン位置（絶対座標）
                const pinX = rect.left + (rect.width * anchorRatios.x);
                const pinY = rect.top + (rect.height * anchorRatios.y);
                
                // AutoPin専用座標系で位置更新
                this.applyPinFollowingPosition(spineCanvas, pinX, pinY);
                
                // console.log(`✅ [Phase 1] 保存時座標レイヤースワップ完了: ${spineCanvas.id} → (${pinX.toFixed(1)}, ${pinY.toFixed(1)})`); // ログ無効化
            } else {
                // console.warn("⚠️ 背景要素未検出 - 座標レイヤースワップスキップ"); // ログ無効化
            }
            
        } catch (error) {
            // console.error("❌ [Phase 1] 保存時座標レイヤースワップエラー:", error.message); // ログ無効化
        }
    }
    
    // ==========================================
    // 🎯 BB編集中AutoPin完全分離システム
    // ==========================================
    
    /**
     * 🎯 BB編集開始時: AutoPin座標レイヤー完全削除・保存
     */
    forceStopAndClearCoordinateLayers() {
        // console.log('🎯 BB編集開始 → AutoPin座標レイヤー完全分離開始'); // ログ無効化
        
        try {
            // 1. ピン追従機能を完全無効化
            this.pinSyncEnabled = false;
            
            // 2. 全てのSpineキャンバスでピン追従モードを完全終了
            if (this.originalSpineSettings) {
                for (const canvasId of Object.keys(this.originalSpineSettings)) {
                    const spineCanvas = document.getElementById(canvasId);
                    if (spineCanvas) {
                        // console.log(`🔄 BB編集用: ピン追従モード完全終了 → ${canvasId}`); // ログ無効化
                        this.endPinFollowingMode(spineCanvas);
                        
                        // 3. BB編集専用のクリーンな状態に設定
                        this.setBBEditingModeForCanvas(spineCanvas);
                    }
                }
            }
            
            // 4. AutoPin座標レイヤーの痕跡を完全除去
            this.clearAllAutoPinCoordinateTraces();
            
            // console.log('✅ BB編集開始: AutoPin座標レイヤー完全分離完了'); // ログ無効化
            
        } catch (error) {
            // console.error('❌ AutoPin座標レイヤー分離エラー:', error.message); // ログ無効化
        }
    }
    
    /**
     * 🎯 BB編集完了時: AutoPin座標レイヤー安全復元
     */
    restartWithCoordinateLayerProtection() {
        // console.log('🎯 BB編集完了 → AutoPin座標レイヤー安全復元開始'); // ログ無効化
        
        try {
            // 1. ピン追従機能を有効化
            this.pinSyncEnabled = true;
            
            // 2. レスポンシブシステムを安全に再開
            this.restartResponsiveSystem();
            
            // 3. AutoPin座標レイヤーを安全に復元
            // console.log('🔄 AutoPin座標レイヤー復元中...'); // ログ無効化
            
            // 少し遅延を置いてから復元（BB編集の影響を完全に回避）
            setTimeout(() => {
                try {
                    // 全ピン位置を更新（新システムでピン追従モードも自動開始）
                    this.updateAllPinPositions();
                    // console.log('✅ BB編集完了: AutoPin座標レイヤー安全復元完了'); // ログ無効化
                } catch (restoreError) {
                    // console.error('❌ AutoPin座標レイヤー復元エラー:', restoreError.message); // ログ無効化
                }
            }, 100); // 100ms遅延で安全な復元
            
        } catch (error) {
            // console.error('❌ AutoPin座標レイヤー復元エラー:', error.message); // ログ無効化
        }
    }
    
    /**
     * 🎯 BB編集専用のクリーンな状態に設定（CSS変数クリーンアップ対応）
     */
    setBBEditingModeForCanvas(spineCanvas) {
        // console.log(`🎯 BB編集専用モード設定 [CSS変数対応版]: ${spineCanvas.id}`); // ログ無効化
        
        try {
            // 🔥 Step 1: AutoPin用CSS変数を完全クリア
            this.clearAutoPinCSSVariables(spineCanvas);
            
            // 🔥 Step 2: 完全なCSS属性削除（従来の空文字設定では不完全）
            const cssPropertiesToClear = [
                'position', 'left', 'top', 'right', 'bottom',
                'transform', 'transformOrigin', 'translate',
                'width', 'height', 'zIndex', 'display',
                'visibility', 'opacity', 'margin', 'padding'
            ];
            
            // 従来の不完全な空文字設定を完全削除に変更
            cssPropertiesToClear.forEach(prop => {
                spineCanvas.style.removeProperty(prop);
            });
            
            // 🔥 Step 3: style属性を完全リセット
            const originalStyleContent = spineCanvas.getAttribute('style');
            // console.log(`🔍 BB編集前style属性:`, originalStyleContent); // ログ無効化
            
            // style属性を完全削除
            spineCanvas.removeAttribute('style');
            
            // 🔥 Step 4: BB編集専用のクリーンな基準状態を設定
            spineCanvas.style.position = 'relative';
            spineCanvas.style.left = '50%';
            spineCanvas.style.top = '25%';
            spineCanvas.style.transform = 'translate(-50%, -50%)';
            
            // 🔥 Step 5: BB編集システム用のCSS変数設定
            spineCanvas.style.setProperty('--pbx-edit-mode', '1');
            spineCanvas.style.setProperty('--autopin-active', '0'); // AutoPinモード無効化
            
            // 🔥 Step 6: 強制DOM更新（ブラウザキャッシュクリア）
            spineCanvas.offsetHeight; // Forced reflow
            
            // console.log(`✅ BB編集専用モード設定完了 [CSS変数対応版]: ${spineCanvas.id}`); // ログ無効化
            // console.log(`🔍 BB編集後style属性:`, spineCanvas.getAttribute('style')); // ログ無効化
            
        } catch (error) {
            // console.error(`❌ BB編集専用モード設定エラー [CSS変数対応版] (${spineCanvas.id}):`, error.message); // ログ無効化
        }
    }

    /**
     * 🎯 AutoPin用CSS変数の完全クリア（BB編集準備）
     */
    clearAutoPinCSSVariables(spineCanvas) {
        // console.log(`🧹 AutoPinCSS変数クリア開始: ${spineCanvas.id}`); // ログ無効化
        
        // AutoPin関連のCSS変数をすべてクリア
        const autoPinVariables = [
            '--autopin-active',
            '--autopin-x', 
            '--autopin-y',
            '--autopin-transform',
            '--base-transform',
            '--pbx-edit' // 他システム影響も除去
        ];
        
        autoPinVariables.forEach(varName => {
            spineCanvas.style.removeProperty(varName);
        });
        
        // console.log(`✅ AutoPinCSS変数クリア完了: ${spineCanvas.id}`, {
        //     clearedVariables: autoPinVariables
        // }); // ログ無効化
    }
    
    /**
     * 🎯 AutoPin座標レイヤーの痕跡を完全除去
     */
    clearAllAutoPinCoordinateTraces() {
        // console.log('🧹 AutoPin座標レイヤー痕跡完全除去開始 [強化版]'); // ログ無効化
        
        try {
            // 🔥 Step 1: MutationObserver完全停止（座標変更監視を停止）
            if (this.mutationObserver) {
                this.mutationObserver.disconnect();
                // console.log('🔄 MutationObserver停止 → 座標変更監視無効化'); // ログ無効化
            }
            
            // 🔥 Step 2: レスポンシブハンドラー完全停止
            if (this._resizeHandler) {
                window.removeEventListener('resize', this._resizeHandler);
                // console.log('🔄 リサイズハンドラー停止 → レスポンシブ追従無効化'); // ログ無効化
            }
            
            if (this._scrollHandler) {
                window.removeEventListener('scroll', this._scrollHandler);
                // console.log('🔄 スクロールハンドラー停止 → スクロール追従無効化'); // ログ無効化
            }
            
            // 🔥 Step 3: DOM上のAutoPinピン表示要素を完全削除
            this.forceRemoveAllAutoPinDOM();
            
            // 🔥 Step 4: 全てのSpineキャンバスからAutoPin座標情報を完全削除
            this.forceCleanAllSpineCanvasCoordinates();
            
            // 🔥 Step 5: ピン表示要素を一時非表示（BB編集の妨げを排除）
            this.hideAllPinDisplayElements();
            
            // console.log('✅ AutoPin座標レイヤー痕跡完全除去完了 [強化版]'); // ログ無効化
            
        } catch (error) {
            // console.error('❌ AutoPin座標レイヤー痕跡除去エラー [強化版]:', error.message); // ログ無効化
        }
    }
    /**
     * 🎯 全てのピン表示要素を一時非表示
     */
    hideAllPinDisplayElements() {
        try {
            // PinDisplayManagerを使用してピン表示要素を非表示
            if (this.pinDisplayManager) {
                // 全アクティブピンの表示要素を非表示
                for (const nodeId of this.activePins.keys()) {
                    this.pinDisplayManager.hideAllMarkers(nodeId);
                }
                // console.log('🚫 全ピン表示要素を一時非表示にしました'); // ログ無効化
            }
        } catch (error) {
            // console.warn('⚠️ ピン表示要素非表示処理でエラー:', error.message); // ログ無効化
        }
    }

    /**
     * 🔥 DOM上のAutoPinピン表示要素を完全削除
     */
    forceRemoveAllAutoPinDOM() {
        try {
            // console.log('🔥 DOM上のAutoPinピン表示要素完全削除開始'); // ログ無効化
            
            // AutoPinで作成されたDOM要素を全削除
            const autoPinElements = [
                '.autopin-marker',
                '.autopin-anchor',
                '[id^="autopin-"]',
                '[class*="autopin"]',
                '.pin-display',
                '.drag-handle'
            ];
            
            autoPinElements.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    element.remove();
                    // console.log(`🗑️ AutoPin DOM要素削除: ${selector}`); // ログ無効化
                });
            });
            
            // console.log('✅ DOM上のAutoPinピン表示要素完全削除完了'); // ログ無効化
            
        } catch (error) {
            // console.error('❌ AutoPinDOM削除エラー:', error.message); // ログ無効化
        }
    }

    /**
     * 🔥 全てのSpineキャンバスからAutoPin座標情報を完全削除
     */
    forceCleanAllSpineCanvasCoordinates() {
        try {
            // console.log('🔥 全SpineキャンバスのAutoPin座標情報完全削除開始'); // ログ無効化
            
            // 全てのspine-canvasを検索
            const spineCanvases = document.querySelectorAll('canvas[id*="spine"], #spine-canvas, .spine-canvas');
            
            spineCanvases.forEach(canvas => {
                // console.log(`🧹 AutoPin座標削除対象: ${canvas.id || canvas.className}`); // ログ無効化
                
                // AutoPin座標関連のCSS属性を完全削除
                const autoPinProperties = [
                    'position', 'left', 'top', 'right', 'bottom',
                    'transform', 'transformOrigin', 'translate',
                    'zIndex', 'display', 'visibility', 'opacity'
                ];
                
                // 完全削除（空文字ではなくremoveProperty使用）
                autoPinProperties.forEach(prop => {
                    canvas.style.removeProperty(prop);
                });
                
                // data-*属性もクリア（AutoPinが付与した可能性のある属性）
                const dataAttributes = Array.from(canvas.attributes)
                    .filter(attr => attr.name.startsWith('data-autopin'))
                    .map(attr => attr.name);
                
                dataAttributes.forEach(attrName => {
                    canvas.removeAttribute(attrName);
                    // console.log(`🗑️ data属性削除: ${attrName}`); // ログ無効化
                });
                
                // style属性を完全削除して、クリーンな基準状態を復元
                canvas.removeAttribute('style');
                
                // StableSpineRenderer基準の基本設定を復元
                canvas.style.position = 'relative';
                canvas.style.left = '50%';
                canvas.style.top = '25%';
                canvas.style.transform = 'translate(-50%, -50%)';
                
                // console.log(`✅ AutoPin座標削除完了: ${canvas.id || canvas.className}`); // ログ無効化
            });
            
            // console.log('✅ 全SpineキャンバスのAutoPin座標情報完全削除完了'); // ログ無効化
            
        } catch (error) {
            // console.error('❌ SpineキャンバスAutoPin座標削除エラー:', error.message); // ログ無効化
        }
    }

    
    /**
     * 🎯 レスポンシブシステムの安全な再開機能
     * BB編集完了後の復元時に使用
     */
    restartResponsiveSystem() {
        try {
            // console.log('🔄 レスポンシブシステム安全再開開始'); // ログ無効化
            
            // 1. MutationObserverの安全な再開
            if (!this.mutationObserver && window.MutationObserver) {
                this.setupElementObserver();
                // console.log('✅ MutationObserver再開完了'); // ログ無効化
            } else if (this.mutationObserver) {
                // 既に存在する場合は再接続
                this.reconnectMutationObserver();
            }
            
            // 2. ウィンドウリサイズハンドラーの再設定
            if (!this._resizeHandler) {
                this.setupWindowResizeHandler();
                // console.log('✅ ウィンドウリサイズハンドラー再設定完了'); // ログ無効化
            } else {
                // console.log('🔄 ウィンドウリサイズハンドラーは既に設定済み'); // ログ無効化
            }
            
            // console.log('✅ レスポンシブシステム安全再開完了'); // ログ無効化
            
        } catch (error) {
            // console.error('❌ レスポンシブシステム再開エラー:', error.message); // ログ無効化
        }
    }
    
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.PureBoundingBoxAutoPin = PureBoundingBoxAutoPin;
}