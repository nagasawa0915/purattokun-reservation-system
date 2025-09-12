/**
 * EfficientObserver.js
 * 
 * 🎯 効率的ピンシステム v2.0 - 変化検出層
 * - 責務: 要素変化の検出・通知のみ
 * - 特徴: 計算処理は一切行わない・シンプルな通知のみ送信
 * - 設計: ElementObserver Phase 1の責務分離版
 */

class EfficientObserver {
    constructor(calculator, renderer) {
        console.log('🎯 EfficientObserver 初期化開始');
        
        if (!calculator || !renderer) {
            throw new Error('ElementCalculator と PinRenderer のインスタンスが必要です');
        }
        
        // 依存モジュール
        this.calculator = calculator;
        this.renderer = renderer;
        
        // 監視中の要素管理
        this.observedElements = new Map(); // Map<element, observationConfig>
        this.activeRequests = new Map();   // Map<elementId, calculationRequest>
        
        // Observer インスタンス
        this.resizeObserver = null;
        this.mutationObserver = null;
        this.intersectionObserver = null;
        
        // 設定
        this.config = {
            enableResize: true,
            enableMutation: true,
            enableIntersection: false,
            debounceMs: 100,           // 連続変化の遅延処理
            maxRetries: 3,             // 計算失敗時の再試行回数
            logLevel: 'info'           // ログレベル
        };
        
        // 状態管理
        this.isActive = false;
        this.changeQueue = [];
        this.debounceTimer = null;
        
        this.initializeObservers();
        console.log('✅ EfficientObserver 初期化完了');
    }
    
    /**
     * 🏗️ Observer群初期化
     */
    initializeObservers() {
        // ResizeObserver (要素サイズ変更検出)
        if (this.config.enableResize && window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
            // console.log('📏 ResizeObserver 初期化完了'); // Observer初期化ログ無効化
        }
        
        // MutationObserver (DOM構造変更検出)
        if (this.config.enableMutation && window.MutationObserver) {
            this.mutationObserver = new MutationObserver(this.handleMutation.bind(this));
            // console.log('🔄 MutationObserver 初期化完了'); // Observer初期化ログ無効化
        }
        
        // IntersectionObserver (可視性変更検出・オプション)
        if (this.config.enableIntersection && window.IntersectionObserver) {
            this.intersectionObserver = new IntersectionObserver(
                this.handleIntersection.bind(this),
                {
                    root: null,
                    rootMargin: '0px',
                    threshold: [0, 0.1, 0.5, 1.0]
                }
            );
            // console.log('👁️ IntersectionObserver 初期化完了'); // Observer初期化ログ無効化
        }
        
        // ウィンドウリサイズ検出
        window.addEventListener('resize', this.handleWindowResize.bind(this));
        window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
        
        console.log('🏗️ Observer群初期化完了');
    }
    
    /**
     * 👀 要素監視開始
     * @param {HTMLElement} element - 監視対象要素
     * @param {CalculationRequest} request - 計算リクエスト設定
     */
    observe(element, request) {
        if (!element || !request) {
            throw new Error('要素と計算リクエストが必要です');
        }
        
        const elementId = element.id || `element-${Date.now()}`;
        if (!element.id) {
            element.id = elementId;
        }
        
        // 監視設定保存
        const observationConfig = {
            element: element,
            request: request,
            lastSize: this.getElementSize(element),
            lastPosition: this.getElementPosition(element),
            startTime: Date.now()
        };
        
        this.observedElements.set(element, observationConfig);
        this.activeRequests.set(elementId, request);
        
        // Observer群に登録
        if (this.resizeObserver) {
            this.resizeObserver.observe(element);
        }
        
        if (this.mutationObserver) {
            this.mutationObserver.observe(element, {
                attributes: true,
                attributeFilter: ['style', 'class'],
                subtree: false
            });
        }
        
        if (this.intersectionObserver) {
            this.intersectionObserver.observe(element);
        }
        
        // 初回計算実行
        this.requestCalculation(element, 'initial');
        
        console.log(`👀 要素監視開始: ${elementId}`, {
            anchorPoints: request.anchorPoints.length,
            elementType: request.elementType
        });
    }
    
    /**
     * 🛑 要素監視停止
     * @param {HTMLElement} element - 監視停止対象要素
     */
    unobserve(element) {
        if (!this.observedElements.has(element)) {
            console.warn('⚠️ 監視されていない要素です:', element);
            return;
        }
        
        // Observer群から削除
        if (this.resizeObserver) {
            this.resizeObserver.unobserve(element);
        }
        
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            // 他の要素も監視している場合は再接続が必要だが簡略化
        }
        
        if (this.intersectionObserver) {
            this.intersectionObserver.unobserve(element);
        }
        
        // 内部状態クリア
        const elementId = element.id;
        this.observedElements.delete(element);
        this.activeRequests.delete(elementId);
        
        console.log(`🛑 要素監視停止: ${elementId}`);
    }
    
    /**
     * 📏 リサイズイベント処理
     */
    handleResize(entries) {
        for (const entry of entries) {
            const element = entry.target;
            const config = this.observedElements.get(element);
            
            if (!config) continue;
            
            const currentSize = {
                width: entry.contentRect.width,
                height: entry.contentRect.height
            };
            
            // サイズ変更を検出
            if (this.hasSignificantSizeChange(config.lastSize, currentSize)) {
                const notification = {
                    type: 'resize',
                    elementId: element.id,
                    timestamp: Date.now(),
                    previousSize: config.lastSize,
                    currentSize: currentSize,
                    changeAmount: {
                        widthDelta: currentSize.width - config.lastSize.width,
                        heightDelta: currentSize.height - config.lastSize.height
                    }
                };
                
                config.lastSize = currentSize;
                this.queueChange(element, notification);
            }
        }
    }
    
    /**
     * 🔄 DOM変更イベント処理
     */
    handleMutation(mutations) {
        const affectedElements = new Set();
        
        for (const mutation of mutations) {
            const element = mutation.target;
            
            if (this.observedElements.has(element)) {
                affectedElements.add(element);
            }
        }
        
        // 影響を受けた要素の変更通知
        affectedElements.forEach(element => {
            const notification = {
                type: 'style',
                elementId: element.id,
                timestamp: Date.now(),
                mutationType: 'attributes'
            };
            
            this.queueChange(element, notification);
        });
    }
    
    /**
     * 👁️ 可視性変更イベント処理
     */
    handleIntersection(entries) {
        for (const entry of entries) {
            const element = entry.target;
            const config = this.observedElements.get(element);
            
            if (!config) continue;
            
            const notification = {
                type: 'visibility',
                elementId: element.id,
                timestamp: Date.now(),
                isVisible: entry.isIntersecting,
                intersectionRatio: entry.intersectionRatio
            };
            
            this.queueChange(element, notification);
        }
    }
    
    /**
     * 🪟 ウィンドウリサイズイベント処理
     */
    handleWindowResize() {
        // 全監視要素に対して位置再計算を要求
        this.observedElements.forEach((config, element) => {
            const notification = {
                type: 'reposition',
                elementId: element.id,
                timestamp: Date.now(),
                trigger: 'window-resize',
                windowSize: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            };
            
            this.queueChange(element, notification);
        });
    }
    
    /**
     * 📱 画面向き変更イベント処理
     */
    handleOrientationChange() {
        // 少し遅延してからリサイズ処理（端末の処理完了を待つ）
        setTimeout(() => {
            this.handleWindowResize();
        }, 100);
    }
    
    /**
     * ⏳ 変更キューイング（デバウンス処理）
     */
    queueChange(element, notification) {
        this.changeQueue.push({ element, notification });
        
        // デバウンスタイマーリセット
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        this.debounceTimer = setTimeout(() => {
            this.processChangeQueue();
        }, this.config.debounceMs);
    }
    
    /**
     * 🔄 変更キュー処理
     */
    processChangeQueue() {
        if (this.changeQueue.length === 0) return;
        
        // 要素別にグループ化
        const elementGroups = new Map();
        
        this.changeQueue.forEach(({ element, notification }) => {
            if (!elementGroups.has(element)) {
                elementGroups.set(element, []);
            }
            elementGroups.get(element).push(notification);
        });
        
        // 各要素の変更を処理
        elementGroups.forEach((notifications, element) => {
            this.processElementChanges(element, notifications);
        });
        
        // キューをクリア
        this.changeQueue = [];
        this.debounceTimer = null;
    }
    
    /**
     * 🎯 要素変更処理
     */
    processElementChanges(element, notifications) {
        // 最新の通知を使用（同じ要素の複数変更は最新のみ適用）
        const latestNotification = notifications[notifications.length - 1];
        
        this.logNotification(latestNotification);
        
        // 計算リクエスト実行
        this.requestCalculation(element, latestNotification.type);
    }
    
    /**
     * 🧮 計算リクエスト実行
     */
    async requestCalculation(element, changeType) {
        const request = this.activeRequests.get(element.id);
        if (!request) {
            console.warn(`⚠️ 計算リクエストが見つかりません: ${element.id}`);
            return;
        }
        
        try {
            // ElementCalculatorに計算を依頼
            const result = await this.calculator.calculate(request);
            
            // PinRendererに描画を依頼
            this.renderer.render({
                pins: result.pins,
                options: {
                    showLabels: true,
                    animationDuration: changeType === 'initial' ? 600 : 300
                }
            });
            
            console.log(`🧮 計算完了: ${element.id} (${changeType})`);
            
        } catch (error) {
            console.error(`❌ 計算エラー: ${element.id}`, error);
            
            // 再試行ロジック（簡略化）
            setTimeout(() => {
                if (this.activeRequests.has(element.id)) {
                    this.requestCalculation(element, `retry-${changeType}`);
                }
            }, 1000);
        }
    }
    
    /**
     * 📊 サイズ変更の重要度判定
     */
    hasSignificantSizeChange(previousSize, currentSize, threshold = 1) {
        const widthChange = Math.abs(currentSize.width - previousSize.width);
        const heightChange = Math.abs(currentSize.height - previousSize.height);
        
        return widthChange >= threshold || heightChange >= threshold;
    }
    
    /**
     * 📐 要素サイズ取得
     */
    getElementSize(element) {
        const rect = element.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height
        };
    }
    
    /**
     * 📍 要素位置取得
     */
    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top
        };
    }
    
    /**
     * 📝 通知ログ出力
     */
    logNotification(notification) {
        if (this.config.logLevel === 'silent') return;
        
        const logMethods = {
            'info': console.log,
            'warn': console.warn,
            'error': console.error
        };
        
        const logMethod = logMethods[this.config.logLevel] || console.log;
        
        logMethod(`🔔 EfficientObserver通知: ${notification.elementId} (${notification.type})`);
        
        if (this.config.logLevel === 'debug') {
            console.log('📋 通知詳細:', notification);
        }
    }
    
    /**
     * ⚙️ 設定更新
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('⚙️ EfficientObserver設定更新:', this.config);
    }
    
    /**
     * 📊 監視状態取得
     */
    getObservationState() {
        const state = {
            observedElementCount: this.observedElements.size,
            activeRequestCount: this.activeRequests.size,
            queuedChangeCount: this.changeQueue.length,
            isActive: this.isActive,
            config: { ...this.config }
        };
        
        // 監視中要素の詳細
        state.observedElements = [];
        this.observedElements.forEach((config, element) => {
            state.observedElements.push({
                elementId: element.id,
                elementType: config.request.elementType,
                anchorPointCount: config.request.anchorPoints.length,
                observationDuration: Date.now() - config.startTime
            });
        });
        
        return state;
    }
    
    /**
     * 🛑 全監視停止
     */
    stopAll() {
        // 全要素の監視停止
        const elements = Array.from(this.observedElements.keys());
        elements.forEach(element => this.unobserve(element));
        
        // Observer群の停止
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        // イベントリスナー削除
        window.removeEventListener('resize', this.handleWindowResize.bind(this));
        window.removeEventListener('orientationchange', this.handleOrientationChange.bind(this));
        
        // タイマークリア
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        
        // 状態クリア
        this.changeQueue = [];
        this.isActive = false;
        
        console.log('🛑 EfficientObserver全監視停止完了');
    }
    
    /**
     * 🧹 完全クリーンアップ
     */
    destroy() {
        this.stopAll();
        
        // 参照クリア
        this.calculator = null;
        this.renderer = null;
        this.observedElements.clear();
        this.activeRequests.clear();
        
        console.log('🧹 EfficientObserver完全クリーンアップ完了');
    }
}

// グローバル公開
if (typeof window !== 'undefined') {
    window.EfficientObserver = EfficientObserver;
    console.log('✅ EfficientObserver グローバル公開完了');
}

// AMD/CommonJS対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EfficientObserver;
}