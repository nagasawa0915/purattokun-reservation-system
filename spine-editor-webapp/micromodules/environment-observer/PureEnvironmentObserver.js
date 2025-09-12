/**
 * PureEnvironmentObserver.js
 * 
 * 🌊 Phase 3-B マイクロモジュール #1 - 環境変化監視専門
 * 
 * 【責務】
 * - DOM要素のサイズ・位置変化監視
 * - DPR（Device Pixel Ratio）変化検出
 * - レスポンシブレイアウト変更監視
 * - ブラウザズーム・DevTools開閉検出
 * 
 * 【仕様】
 * - 入力: { target: HTMLElement, options: ObserveOptions }
 * - 出力: { rect: RectData, timestamp: number, dpr: number }
 * - 依存: ResizeObserver, getBoundingClientRect のみ
 * - 禁止: スケール計算、UI表示、ピン機能、他モジュール参照
 * 
 * 【技術基盤】
 * - Phase 3-A実証済み技術活用
 * - ElementObserverAdvanced.js環境監視部分を抽出・専門化
 * - 99.9-100%高速化システムとの統合考慮
 * 
 * Version: 1.0
 * Created: 2025-08-29
 * マイクロモジュール設計原則: 単一責務・完全独立・数値のみ入出力
 */

class PureEnvironmentObserver {
    constructor(options = {}) {
        // 初期化設定
        this.options = {
            // 監視精度設定
            epsilon: options.epsilon || 0.5,  // ±0.5px誤差許容（Phase 3-A実証値）
            throttleInterval: options.throttleInterval || 8,  // 8ms = 120fps対応
            
            // DPR監視設定
            dprMonitoring: options.dprMonitoring !== false,  // デフォルトON
            
            // デバッグ設定
            debug: options.debug || false,
            
            ...options
        };
        
        // 状態管理
        this.state = {
            initialized: false,
            isObserving: false,
            observationCount: 0
        };
        
        // 監視対象管理（target -> observationData）
        this.observations = new Map();
        
        // ResizeObserver（メインの監視システム）
        this.resizeObserver = null;
        
        // DPR（Device Pixel Ratio）監視
        this.dprState = {
            current: window.devicePixelRatio || 1,
            last: window.devicePixelRatio || 1,
            mediaQuery: null,
            changeCallback: null
        };
        
        // パフォーマンス最適化（Phase 3-A継承）
        this.performance = {
            frameRequestId: null,
            pendingUpdates: new Map(),  // target -> pendingData
            lastUpdateTime: 0,
            minUpdateInterval: this.options.throttleInterval,
            batchedCallbacks: new Map()  // target -> [callbacks]
        };
        
        // 環境変化監視（Phase 3-B新機能）
        this.environmentMonitoring = {
            // ウィンドウリサイズ監視
            windowResizeCallback: null,
            lastWindowSize: { width: 0, height: 0 },
            
            // ブラウザズーム・DevTools検出
            zoomDetection: {
                enabled: options.detectZoom !== false,
                lastInnerWidth: window.innerWidth,
                lastOuterWidth: window.outerWidth
            },
            
            // レスポンシブブレークポイント監視
            breakpointMonitoring: {
                enabled: options.monitorBreakpoints !== false,
                breakpoints: options.breakpoints || [768, 1024, 1200],
                currentBreakpoint: null
            }
        };
        
        // エラー処理・復旧
        this.errorHandling = {
            lastError: null,
            retryCount: 0,
            maxRetries: 3
        };
        
        this._initialize();
    }
    
    /**
     * 内部初期化処理
     */
    _initialize() {
        try {
            // ResizeObserver初期化
            this._initializeResizeObserver();
            
            // DPR監視初期化
            if (this.options.dprMonitoring) {
                this._initializeDPRMonitoring();
            }
            
            // 環境監視初期化
            this._initializeEnvironmentMonitoring();
            
            this.state.initialized = true;
            
            if (this.options.debug) {
                console.log('[PureEnvironmentObserver] Initialized successfully');
            }
            
        } catch (error) {
            this._handleError(error, 'initialization');
        }
    }
    
    /**
     * ResizeObserver初期化
     */
    _initializeResizeObserver() {
        if (typeof ResizeObserver === 'undefined') {
            throw new Error('ResizeObserver not supported in this browser');
        }
        
        this.resizeObserver = new ResizeObserver((entries) => {
            this._handleResizeObserverEntries(entries);
        });
    }
    
    /**
     * DPR（Device Pixel Ratio）監視初期化
     */
    _initializeDPRMonitoring() {
        // DPR変化検出用MediaQuery設定
        const dprQuery = `(resolution: ${window.devicePixelRatio}dppx)`;
        
        try {
            this.dprState.mediaQuery = window.matchMedia(dprQuery);
            this.dprState.changeCallback = () => {
                this._handleDPRChange();
            };
            
            // Modern API
            if (this.dprState.mediaQuery.addEventListener) {
                this.dprState.mediaQuery.addEventListener('change', this.dprState.changeCallback);
            } else {
                // Legacy API
                this.dprState.mediaQuery.addListener(this.dprState.changeCallback);
            }
            
        } catch (error) {
            if (this.options.debug) {
                console.warn('[PureEnvironmentObserver] DPR monitoring fallback to manual detection', error);
            }
            // フォールバック: 定期チェック
            this._initializeDPRFallback();
        }
    }
    
    /**
     * DPRフォールバック監視（古いブラウザ対応）
     */
    _initializeDPRFallback() {
        const checkDPR = () => {
            const currentDPR = window.devicePixelRatio || 1;
            if (Math.abs(currentDPR - this.dprState.current) > 0.1) {
                this.dprState.last = this.dprState.current;
                this.dprState.current = currentDPR;
                this._handleDPRChange();
            }
        };
        
        // 1秒間隔でDPRチェック（低頻度）
        setInterval(checkDPR, 1000);
    }
    
    /**
     * 環境監視初期化（ウィンドウリサイズ、ズーム検出等）
     */
    _initializeEnvironmentMonitoring() {
        // ウィンドウリサイズ監視
        this.environmentMonitoring.windowResizeCallback = () => {
            this._handleWindowResize();
        };
        window.addEventListener('resize', this.environmentMonitoring.windowResizeCallback, { passive: true });
        
        // 初期ウィンドウサイズ記録
        this.environmentMonitoring.lastWindowSize = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // ブレークポイント初期判定
        if (this.environmentMonitoring.breakpointMonitoring.enabled) {
            this._updateCurrentBreakpoint();
        }
    }
    
    /**
     * 監視開始
     * @param {HTMLElement} target 監視対象要素
     * @param {function} callback 変化通知コールバック
     * @param {object} options 監視オプション
     * @returns {object} 監視情報
     */
    observe(target, callback, options = {}) {
        if (!target || !(target instanceof HTMLElement)) {
            throw new Error('Target must be an HTMLElement');
        }
        
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        try {
            // 既存監視チェック
            const observationKey = this._getObservationKey(target);
            let observationData = this.observations.get(observationKey);
            
            if (!observationData) {
                // 新規監視データ作成
                observationData = this._createObservationData(target, options);
                this.observations.set(observationKey, observationData);
                
                // ResizeObserver監視開始
                this.resizeObserver.observe(target);
                
                this.state.observationCount++;
            }
            
            // コールバック追加
            observationData.callbacks.add(callback);
            
            // 初回データ送信
            this._sendInitialData(target, callback, observationData);
            
            this.state.isObserving = true;
            
            if (this.options.debug) {
                console.log(`[PureEnvironmentObserver] Started observing element`, { target, observationCount: this.state.observationCount });
            }
            
            return {
                target,
                observationKey,
                callbackCount: observationData.callbacks.size
            };
            
        } catch (error) {
            this._handleError(error, 'observe');
            throw error;
        }
    }
    
    /**
     * 監視停止
     * @param {HTMLElement} target 監視停止対象要素
     * @param {function} callback 特定のコールバックのみ停止（省略可）
     * @returns {boolean} 成功可否
     */
    unobserve(target, callback = null) {
        if (!target || !(target instanceof HTMLElement)) {
            return false;
        }
        
        try {
            const observationKey = this._getObservationKey(target);
            const observationData = this.observations.get(observationKey);
            
            if (!observationData) {
                return false;  // 監視されていない
            }
            
            if (callback) {
                // 特定のコールバックのみ削除
                observationData.callbacks.delete(callback);
                
                // まだ他のコールバックがある場合は監視継続
                if (observationData.callbacks.size > 0) {
                    return true;
                }
            }
            
            // 全コールバック削除または要素の監視完全停止
            this.resizeObserver.unobserve(target);
            this.observations.delete(observationKey);
            
            // ペンディング更新をクリア
            this.performance.pendingUpdates.delete(observationKey);
            this.performance.batchedCallbacks.delete(observationKey);
            
            this.state.observationCount--;
            
            if (this.state.observationCount <= 0) {
                this.state.isObserving = false;
                this.state.observationCount = 0;
            }
            
            if (this.options.debug) {
                console.log(`[PureEnvironmentObserver] Stopped observing element`, { target, observationCount: this.state.observationCount });
            }
            
            return true;
            
        } catch (error) {
            this._handleError(error, 'unobserve');
            return false;
        }
    }
    
    /**
     * 現在の矩形情報取得
     * @param {HTMLElement} target 対象要素
     * @returns {object} 矩形情報
     */
    getRect(target) {
        if (!target || !(target instanceof HTMLElement)) {
            return null;
        }
        
        try {
            const rect = this._computeRectData(target);
            return {
                ...rect,
                timestamp: performance.now(),
                dpr: this.dprState.current
            };
            
        } catch (error) {
            this._handleError(error, 'getRect');
            return null;
        }
    }
    
    /**
     * 完全復元・リソース解放
     */
    cleanup() {
        try {
            // ResizeObserver停止
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
            }
            
            // DPR監視停止
            if (this.dprState.mediaQuery && this.dprState.changeCallback) {
                if (this.dprState.mediaQuery.removeEventListener) {
                    this.dprState.mediaQuery.removeEventListener('change', this.dprState.changeCallback);
                } else {
                    this.dprState.mediaQuery.removeListener(this.dprState.changeCallback);
                }
                this.dprState.mediaQuery = null;
                this.dprState.changeCallback = null;
            }
            
            // 環境監視停止
            if (this.environmentMonitoring.windowResizeCallback) {
                window.removeEventListener('resize', this.environmentMonitoring.windowResizeCallback);
                this.environmentMonitoring.windowResizeCallback = null;
            }
            
            // フレーム要求キャンセル
            if (this.performance.frameRequestId) {
                cancelAnimationFrame(this.performance.frameRequestId);
                this.performance.frameRequestId = null;
            }
            
            // 状態クリア
            this.observations.clear();
            this.performance.pendingUpdates.clear();
            this.performance.batchedCallbacks.clear();
            
            // 状態リセット
            this.state.initialized = false;
            this.state.isObserving = false;
            this.state.observationCount = 0;
            
            // エラー状態クリア
            this.errorHandling.lastError = null;
            this.errorHandling.retryCount = 0;
            
            if (this.options.debug) {
                console.log('[PureEnvironmentObserver] Cleanup completed');
            }
            
        } catch (error) {
            console.error('[PureEnvironmentObserver] Cleanup error:', error);
        }
    }
    
    // ============================================
    // 内部処理メソッド
    // ============================================
    
    /**
     * 監視データ作成
     */
    _createObservationData(target, options) {
        const rect = this._computeRectData(target);
        
        return {
            target,
            callbacks: new Set(),
            options: { ...this.options, ...options },
            lastRect: rect,
            lastNotificationTime: 0,
            changeCount: 0,
            createdAt: performance.now()
        };
    }
    
    /**
     * 矩形データ計算（数値のみ）
     */
    _computeRectData(target) {
        const rect = target.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(target);
        
        return {
            // DOM基本矩形
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            
            // CSS計算値
            clientWidth: target.clientWidth,
            clientHeight: target.clientHeight,
            offsetWidth: target.offsetWidth,
            offsetHeight: target.offsetHeight,
            scrollWidth: target.scrollWidth,
            scrollHeight: target.scrollHeight,
            
            // ビューポート相対
            viewportX: rect.x / window.innerWidth,
            viewportY: rect.y / window.innerHeight,
            viewportWidth: rect.width / window.innerWidth,
            viewportHeight: rect.height / window.innerHeight,
            
            // CSS Transform情報
            transform: computedStyle.transform,
            position: computedStyle.position,
            
            // 現在のブレークポイント
            currentBreakpoint: this.environmentMonitoring.breakpointMonitoring.currentBreakpoint
        };
    }
    
    /**
     * 観測キー生成
     */
    _getObservationKey(target) {
        // 要素の一意性確保（idまたはDOM位置ベース）
        if (target.id) {
            return `id:${target.id}`;
        }
        
        // フォールバック: DOM階層位置
        const path = this._getElementPath(target);
        return `path:${path}`;
    }
    
    /**
     * DOM階層パス生成
     */
    _getElementPath(element) {
        const path = [];
        let current = element;
        
        while (current && current !== document.body) {
            let selector = current.tagName.toLowerCase();
            
            if (current.className) {
                selector += `.${current.className.split(' ').join('.')}`;
            }
            
            path.unshift(selector);
            current = current.parentElement;
        }
        
        return path.join(' > ');
    }
    
    /**
     * 初回データ送信
     */
    _sendInitialData(target, callback, observationData) {
        const data = {
            rect: observationData.lastRect,
            timestamp: performance.now(),
            dpr: this.dprState.current,
            changeType: 'initial',
            changeCount: 0
        };
        
        try {
            callback(data);
        } catch (error) {
            if (this.options.debug) {
                console.error('[PureEnvironmentObserver] Initial callback error:', error);
            }
        }
    }
    
    /**
     * ResizeObserver エントリ処理
     */
    _handleResizeObserverEntries(entries) {
        const now = performance.now();
        
        for (const entry of entries) {
            const target = entry.target;
            const observationKey = this._getObservationKey(target);
            const observationData = this.observations.get(observationKey);
            
            if (!observationData) continue;
            
            // 新しい矩形データ計算
            const newRect = this._computeRectData(target);
            
            // 変化検出（εベースの誤差許容）
            if (this._isSignificantChange(observationData.lastRect, newRect)) {
                // パフォーマンス最適化: バッチ処理
                this._scheduleUpdate(observationKey, observationData, newRect, now);
            }
        }
    }
    
    /**
     * 有意な変化検出
     */
    _isSignificantChange(lastRect, newRect) {
        const epsilon = this.options.epsilon;
        
        return (
            Math.abs(lastRect.x - newRect.x) > epsilon ||
            Math.abs(lastRect.y - newRect.y) > epsilon ||
            Math.abs(lastRect.width - newRect.width) > epsilon ||
            Math.abs(lastRect.height - newRect.height) > epsilon ||
            lastRect.currentBreakpoint !== newRect.currentBreakpoint
        );
    }
    
    /**
     * 更新スケジューリング（Phase 3-A高速化技術）
     */
    _scheduleUpdate(observationKey, observationData, newRect, timestamp) {
        // ペンディング更新に追加
        this.performance.pendingUpdates.set(observationKey, {
            observationData,
            newRect,
            timestamp
        });
        
        // バッチ処理タイマー
        if (!this.performance.frameRequestId) {
            this.performance.frameRequestId = requestAnimationFrame(() => {
                this._processPendingUpdates();
            });
        }
    }
    
    /**
     * ペンディング更新処理
     */
    _processPendingUpdates() {
        const now = performance.now();
        
        // フレーム要求IDクリア
        this.performance.frameRequestId = null;
        
        // スロットリングチェック
        if (now - this.performance.lastUpdateTime < this.performance.minUpdateInterval) {
            // 次フレームで再スケジュール
            this.performance.frameRequestId = requestAnimationFrame(() => {
                this._processPendingUpdates();
            });
            return;
        }
        
        this.performance.lastUpdateTime = now;
        
        // ペンディング更新を順次処理
        for (const [observationKey, updateData] of this.performance.pendingUpdates.entries()) {
            this._processUpdate(observationKey, updateData);
        }
        
        // ペンディング更新をクリア
        this.performance.pendingUpdates.clear();
    }
    
    /**
     * 個別更新処理
     */
    _processUpdate(observationKey, updateData) {
        const { observationData, newRect, timestamp } = updateData;
        
        // 矩形データ更新
        observationData.lastRect = newRect;
        observationData.changeCount++;
        observationData.lastNotificationTime = timestamp;
        
        // 通知データ作成
        const notificationData = {
            rect: newRect,
            timestamp,
            dpr: this.dprState.current,
            changeType: 'resize',
            changeCount: observationData.changeCount
        };
        
        // 全コールバックに通知
        for (const callback of observationData.callbacks) {
            try {
                callback(notificationData);
            } catch (error) {
                if (this.options.debug) {
                    console.error('[PureEnvironmentObserver] Callback error:', error);
                }
            }
        }
    }
    
    /**
     * DPR変化処理
     */
    _handleDPRChange() {
        const newDPR = window.devicePixelRatio || 1;
        const oldDPR = this.dprState.current;
        
        if (Math.abs(newDPR - oldDPR) > 0.1) {
            this.dprState.last = oldDPR;
            this.dprState.current = newDPR;
            
            if (this.options.debug) {
                console.log(`[PureEnvironmentObserver] DPR changed: ${oldDPR} -> ${newDPR}`);
            }
            
            // 全監視対象に DPR変化を通知
            this._notifyDPRChange(newDPR, oldDPR);
        }
    }
    
    /**
     * DPR変化通知
     */
    _notifyDPRChange(newDPR, oldDPR) {
        const timestamp = performance.now();
        
        for (const [observationKey, observationData] of this.observations.entries()) {
            const notificationData = {
                rect: observationData.lastRect,
                timestamp,
                dpr: newDPR,
                changeType: 'dpr',
                changeCount: observationData.changeCount,
                dprChange: { from: oldDPR, to: newDPR }
            };
            
            for (const callback of observationData.callbacks) {
                try {
                    callback(notificationData);
                } catch (error) {
                    if (this.options.debug) {
                        console.error('[PureEnvironmentObserver] DPR callback error:', error);
                    }
                }
            }
        }
    }
    
    /**
     * ウィンドウリサイズ処理
     */
    _handleWindowResize() {
        const newSize = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        const lastSize = this.environmentMonitoring.lastWindowSize;
        
        // 有意な変化チェック
        if (Math.abs(newSize.width - lastSize.width) > 1 || 
            Math.abs(newSize.height - lastSize.height) > 1) {
            
            this.environmentMonitoring.lastWindowSize = newSize;
            
            // ブレークポイント更新
            if (this.environmentMonitoring.breakpointMonitoring.enabled) {
                this._updateCurrentBreakpoint();
            }
            
            // ズーム検出
            if (this.environmentMonitoring.zoomDetection.enabled) {
                this._detectZoomChange();
            }
            
            if (this.options.debug) {
                console.log('[PureEnvironmentObserver] Window resized:', newSize);
            }
        }
    }
    
    /**
     * ブレークポイント更新
     */
    _updateCurrentBreakpoint() {
        const width = window.innerWidth;
        const breakpoints = this.environmentMonitoring.breakpointMonitoring.breakpoints;
        
        let currentBreakpoint = 'xs';  // デフォルト
        
        for (let i = breakpoints.length - 1; i >= 0; i--) {
            if (width >= breakpoints[i]) {
                currentBreakpoint = `bp-${breakpoints[i]}`;
                break;
            }
        }
        
        const oldBreakpoint = this.environmentMonitoring.breakpointMonitoring.currentBreakpoint;
        
        if (currentBreakpoint !== oldBreakpoint) {
            this.environmentMonitoring.breakpointMonitoring.currentBreakpoint = currentBreakpoint;
            
            if (this.options.debug) {
                console.log(`[PureEnvironmentObserver] Breakpoint changed: ${oldBreakpoint} -> ${currentBreakpoint}`);
            }
        }
    }
    
    /**
     * ズーム変化検出
     */
    _detectZoomChange() {
        const detection = this.environmentMonitoring.zoomDetection;
        
        const currentInnerWidth = window.innerWidth;
        const currentOuterWidth = window.outerWidth;
        
        // 簡易ズーム検出（精密な検出ではないが参考値として）
        const innerWidthRatio = currentInnerWidth / detection.lastInnerWidth;
        const outerWidthRatio = currentOuterWidth / detection.lastOuterWidth;
        
        if (Math.abs(innerWidthRatio - outerWidthRatio) > 0.1) {
            if (this.options.debug) {
                console.log('[PureEnvironmentObserver] Possible zoom change detected', {
                    innerRatio: innerWidthRatio,
                    outerRatio: outerWidthRatio
                });
            }
        }
        
        detection.lastInnerWidth = currentInnerWidth;
        detection.lastOuterWidth = currentOuterWidth;
    }
    
    /**
     * エラーハンドリング
     */
    _handleError(error, context) {
        this.errorHandling.lastError = {
            error,
            context,
            timestamp: Date.now()
        };
        
        if (this.options.debug) {
            console.error(`[PureEnvironmentObserver] Error in ${context}:`, error);
        }
        
        // 再試行ロジック（重要エラーの場合）
        if (context === 'initialization' && this.errorHandling.retryCount < this.errorHandling.maxRetries) {
            this.errorHandling.retryCount++;
            setTimeout(() => {
                this._initialize();
            }, 1000 * this.errorHandling.retryCount);
        }
    }
    
    // ============================================
    // ユーティリティメソッド
    // ============================================
    
    /**
     * 現在の監視状態取得
     */
    getState() {
        return {
            ...this.state,
            observationCount: this.observations.size,
            dpr: this.dprState.current,
            windowSize: { ...this.environmentMonitoring.lastWindowSize },
            currentBreakpoint: this.environmentMonitoring.breakpointMonitoring.currentBreakpoint
        };
    }
    
    /**
     * パフォーマンス統計取得
     */
    getPerformanceStats() {
        // 安全なstatsオブジェクトの作成
        const pendingSize = this.performance && this.performance.pendingUpdates ? this.performance.pendingUpdates.size : 0;
        const lastUpdate = this.performance && this.performance.lastUpdateTime ? this.performance.lastUpdateTime : 0;
        const minInterval = this.performance && this.performance.minUpdateInterval ? this.performance.minUpdateInterval : 8;
        const frameReq = this.performance && this.performance.frameRequestId ? 1 : 0;
        
        const stats = {
            pendingUpdates: pendingSize,
            lastUpdateTime: lastUpdate,
            minUpdateInterval: minInterval,
            frameRequests: frameReq,
            // 必ず存在することを保証
            total: pendingSize + frameReq,
            // 追加の統計情報
            observationCount: this.state ? this.state.observationCount || 0 : 0,
            initialized: this.state ? this.state.initialized || false : false
        };
        
        return stats;
    }
    
    /**
     * オプション更新
     */
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        this.performance.minUpdateInterval = this.options.throttleInterval;
        
        if (this.options.debug) {
            console.log('[PureEnvironmentObserver] Options updated:', this.options);
        }
    }
    
    // ============================================
    // 静的テストメソッド
    // ============================================
    
    /**
     * 単独動作テスト
     * @returns {Object} テスト結果オブジェクト
     */
    static test() {
        console.group('[PureEnvironmentObserver] Self Test');
        
        const testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            details: []
        };
        
        // テストヘルパー関数
        const runTest = (testName, testFn) => {
            testResults.total++;
            try {
                testFn();
                testResults.passed++;
                testResults.details.push(`✅ ${testName}`);
                console.log(`✅ ${testName}`);
            } catch (error) {
                testResults.failed++;
                testResults.details.push(`❌ ${testName}: ${error.message}`);
                console.error(`❌ ${testName}: ${error.message}`);
            }
        };
        
        try {
            // 1. 基本機能テスト
            runTest('Basic initialization', () => {
                const observer = new PureEnvironmentObserver({ debug: false });
                if (!observer.state.initialized) {
                    throw new Error('Failed to initialize');
                }
            });
            
            // 2. DOM要素作成テスト
            runTest('DOM element creation', () => {
                const testElement = document.createElement('div');
                testElement.style.cssText = 'width: 100px; height: 100px; position: absolute;';
                document.body.appendChild(testElement);
                
                if (!document.body.contains(testElement)) {
                    throw new Error('Test element not added to DOM');
                }
                
                document.body.removeChild(testElement);
            });
            
            // 3. 矩形データ取得テスト
            runTest('Rectangle data computation', () => {
                const observer = new PureEnvironmentObserver({ debug: false });
                const testElement = document.createElement('div');
                testElement.style.cssText = 'width: 100px; height: 100px; position: absolute;';
                document.body.appendChild(testElement);
                
                const rect = observer.getRect(testElement);
                if (!rect || typeof rect.width !== 'number' || typeof rect.height !== 'number') {
                    throw new Error('Invalid rect data');
                }
                
                document.body.removeChild(testElement);
                observer.cleanup();
            });
            
            // 4. 監視開始・停止テスト
            runTest('Observation start/stop', () => {
                const observer = new PureEnvironmentObserver({ debug: false });
                const testElement = document.createElement('div');
                testElement.style.cssText = 'width: 100px; height: 100px; position: absolute;';
                document.body.appendChild(testElement);
                
                let callbackCalled = false;
                const testCallback = (data) => {
                    callbackCalled = true;
                };
                
                // 監視開始
                const observeResult = observer.observe(testElement, testCallback);
                if (!observeResult.target || !observeResult.observationKey) {
                    throw new Error('Invalid observe result');
                }
                
                // 初回コールバック確認
                if (!callbackCalled) {
                    throw new Error('Initial callback not called');
                }
                
                // 監視停止
                const unobserveResult = observer.unobserve(testElement);
                if (!unobserveResult) {
                    throw new Error('Unobserve failed');
                }
                
                document.body.removeChild(testElement);
                observer.cleanup();
            });
            
            // 5. 状態管理テスト
            runTest('State management', () => {
                const observer = new PureEnvironmentObserver({ debug: false });
                const state = observer.getState();
                
                if (typeof state.initialized !== 'boolean' || 
                    typeof state.observationCount !== 'number') {
                    throw new Error('Invalid state structure');
                }
                
                observer.cleanup();
            });
            
            // 6. パフォーマンス統計テスト
            runTest('Performance statistics', () => {
                const observer = new PureEnvironmentObserver({ debug: false });
                const perfStats = observer.getPerformanceStats();
                
                if (typeof perfStats.total !== 'number' || 
                    typeof perfStats.pendingUpdates !== 'number') {
                    throw new Error('Invalid performance stats structure');
                }
                
                observer.cleanup();
            });
            
            // 7. エラーハンドリングテスト
            runTest('Error handling', () => {
                const observer = new PureEnvironmentObserver({ debug: false });
                
                try {
                    observer.observe(null, () => {}); // 無効な要素
                    throw new Error('Should have thrown error for null element');
                } catch (error) {
                    if (!error.message.includes('HTMLElement')) {
                        throw new Error(`Unexpected error message: ${error.message}`);
                    }
                }
                
                try {
                    const testElement = document.createElement('div');
                    observer.observe(testElement, null); // 無効なコールバック
                    throw new Error('Should have thrown error for null callback');
                } catch (error) {
                    if (!error.message.includes('function')) {
                        throw new Error(`Unexpected error message: ${error.message}`);
                    }
                }
                
                observer.cleanup();
            });
            
            // 8. クリーンアップテスト
            runTest('Cleanup functionality', () => {
                const observer = new PureEnvironmentObserver({ debug: false });
                const testElement = document.createElement('div');
                testElement.style.cssText = 'width: 100px; height: 100px; position: absolute;';
                document.body.appendChild(testElement);
                
                observer.observe(testElement, () => {});
                
                const stateBefore = observer.getState();
                if (stateBefore.observationCount === 0) {
                    throw new Error('No observations started');
                }
                
                observer.cleanup();
                
                const stateAfter = observer.getState();
                if (stateAfter.initialized || stateAfter.observationCount !== 0) {
                    throw new Error('Cleanup incomplete');
                }
                
                document.body.removeChild(testElement);
            });
            
        } catch (error) {
            testResults.failed++;
            testResults.details.push(`❌ Unexpected error: ${error.message}`);
            console.error('❌ Unexpected test error:', error);
        }
        
        // テスト結果表示
        console.log('\n📊 PureEnvironmentObserver テスト結果:');
        console.log(`   成功: ${testResults.passed}/${testResults.total}`);
        console.log(`   失敗: ${testResults.failed}/${testResults.total}`);
        
        if (testResults.failed === 0) {
            console.log('🎉 全テスト成功！PureEnvironmentObserver は正常に動作しています。');
        } else {
            console.log('❌ テスト失敗があります。詳細を確認してください。');
            testResults.details.forEach(detail => {
                if (detail.startsWith('❌')) {
                    console.log(`   ${detail}`);
                }
            });
        }
        
        console.groupEnd();
        
        return testResults;
    }
}

// モジュール対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PureEnvironmentObserver;
} else if (typeof window !== 'undefined') {
    window.PureEnvironmentObserver = PureEnvironmentObserver;
}