/**
 * ElementObserverResponsive.js
 * 
 * 📱 レスポンシブWebGL管理システム - Phase 2
 * - WebGL描画バッファとCSS表示サイズの分離管理
 * - DPR・ズーム変化の完全対応
 * - レスポンシブ対応WebGLシステム
 */

class ElementObserverResponsive {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        
        // レスポンシブ設定
        this.config = {
            // CSS表示サイズ（レスポンシブ）
            cssSize: {
                width: options.cssWidth || '25%',
                height: options.cssHeight || '25%',
                minWidth: options.minWidth || 200,
                minHeight: options.minHeight || 200,
                maxWidth: options.maxWidth || 800,
                maxHeight: options.maxHeight || 800
            },
            
            // WebGL描画バッファサイズ（固定・高解像度）
            bufferSize: {
                width: options.bufferWidth || 512,
                height: options.bufferHeight || 512,
                autoScale: options.autoScale !== false,  // 自動スケーリング
                quality: options.quality || 'high'      // 'low', 'medium', 'high', 'ultra'
            },
            
            // DPR・ズーム対応
            scaling: {
                devicePixelRatio: window.devicePixelRatio || 1,
                zoomLevel: 1.0,
                autoAdjustDPR: options.autoAdjustDPR !== false,
                maxDPR: options.maxDPR || 3.0
            },
            
            // ブレークポイント
            breakpoints: {
                mobile: options.mobileBreakpoint || 768,
                tablet: options.tabletBreakpoint || 1024,
                desktop: options.desktopBreakpoint || 1200
            }
        };
        
        // 現在の状態
        this.state = {
            currentBreakpoint: 'desktop',
            actualCSSSize: { width: 0, height: 0 },
            actualBufferSize: { width: 0, height: 0 },
            scaleRatio: { x: 1, y: 1 },
            isResponsive: this.isPercentageSize(this.config.cssSize.width) || 
                          this.isPercentageSize(this.config.cssSize.height)
        };
        
        // 監視・キャッシュ
        this.observers = {
            resize: null,
            media: new Map()
        };
        this.sizeCache = {
            cssSize: null,
            bufferSize: null,
            lastUpdate: 0,
            cacheTimeout: 16  // 約60fps
        };
        
        // コールバック
        this.changeCallbacks = new Set();
        this.isActive = false;
        
        this.initialize();
    }
    
    /**
     * 初期化処理
     */
    initialize() {
        console.log('📱 ElementObserverResponsive初期化開始', {
            canvas: this.getCanvasInfo(),
            config: this.config,
            initialState: this.state
        });
        
        // 初期サイズ設定
        this.updateCanvasSize();
        
        // ブレークポイント検出
        this.updateBreakpoint();
        
        // レスポンシブ監視開始
        this.setupResponsiveMonitoring();
        
        // DPR監視開始
        this.setupDPRMonitoring();
        
        this.isActive = true;
        
        console.log('✅ ElementObserverResponsive初期化完了', {
            finalState: this.state,
            actualSizes: this.getActualSizes()
        });
    }
    
    /**
     * Canvas サイズ更新（メイン処理）
     */
    updateCanvasSize() {
        try {
            const oldState = { ...this.state };
            
            // CSS表示サイズ計算
            const newCSSSize = this.calculateCSSSize();
            
            // WebGL描画バッファサイズ計算
            const newBufferSize = this.calculateBufferSize(newCSSSize);
            
            // CSS表示サイズ適用
            this.applyCSSSize(newCSSSize);
            
            // WebGL描画バッファサイズ適用
            this.applyBufferSize(newBufferSize);
            
            // スケール比率計算
            this.state.scaleRatio = {
                x: newBufferSize.width / newCSSSize.width,
                y: newBufferSize.height / newCSSSize.height
            };
            
            // 状態更新
            this.state.actualCSSSize = newCSSSize;
            this.state.actualBufferSize = newBufferSize;
            
            // キャッシュ更新
            this.updateSizeCache();
            
            // 変化通知
            if (this.hasStateChanged(oldState, this.state)) {
                this.notifyChange('sizeUpdate', {
                    oldState,
                    newState: { ...this.state },
                    cssSize: newCSSSize,
                    bufferSize: newBufferSize
                });
            }
            
            console.log('📐 Canvasサイズ更新完了', {
                cssSize: `${newCSSSize.width}x${newCSSSize.height}`,
                bufferSize: `${newBufferSize.width}x${newBufferSize.height}`,
                scaleRatio: `${this.state.scaleRatio.x.toFixed(2)}x${this.state.scaleRatio.y.toFixed(2)}`,
                dpr: this.config.scaling.devicePixelRatio
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Canvasサイズ更新エラー:', error);
            return false;
        }
    }
    
    /**
     * CSS表示サイズ計算
     */
    calculateCSSSize() {
        const containerRect = this.getContainerRect();
        
        // 幅計算
        let width;
        if (this.isPercentageSize(this.config.cssSize.width)) {
            const percentage = parseFloat(this.config.cssSize.width) / 100;
            width = containerRect.width * percentage;
        } else {
            width = parseFloat(this.config.cssSize.width);
        }
        
        // 高さ計算
        let height;
        if (this.isPercentageSize(this.config.cssSize.height)) {
            const percentage = parseFloat(this.config.cssSize.height) / 100;
            height = containerRect.height * percentage;
        } else {
            height = parseFloat(this.config.cssSize.height);
        }
        
        // 最小・最大サイズ制限
        width = Math.max(this.config.cssSize.minWidth, 
                Math.min(this.config.cssSize.maxWidth, width));
        height = Math.max(this.config.cssSize.minHeight, 
                 Math.min(this.config.cssSize.maxHeight, height));
        
        return {
            width: Math.round(width),
            height: Math.round(height)
        };
    }
    
    /**
     * WebGL描画バッファサイズ計算
     */
    calculateBufferSize(cssSize) {
        let bufferWidth = this.config.bufferSize.width;
        let bufferHeight = this.config.bufferSize.height;
        
        // 自動スケーリング
        if (this.config.bufferSize.autoScale) {
            const aspectRatio = cssSize.width / cssSize.height;
            
            // 品質設定に基づくスケール
            const qualityMultipliers = {
                'low': 0.5,
                'medium': 1.0,
                'high': 1.5,
                'ultra': 2.0
            };
            
            const qualityScale = qualityMultipliers[this.config.bufferSize.quality] || 1.0;
            const dprScale = Math.min(this.config.scaling.devicePixelRatio, this.config.scaling.maxDPR);
            
            // CSS表示サイズベースでバッファサイズ計算
            const baseSize = Math.max(cssSize.width, cssSize.height);
            const targetBufferSize = baseSize * qualityScale * dprScale;
            
            if (aspectRatio >= 1) {
                // 横長・正方形
                bufferWidth = Math.round(targetBufferSize);
                bufferHeight = Math.round(targetBufferSize / aspectRatio);
            } else {
                // 縦長
                bufferWidth = Math.round(targetBufferSize * aspectRatio);
                bufferHeight = Math.round(targetBufferSize);
            }
        }
        
        // DPR追加補正
        if (this.config.scaling.autoAdjustDPR) {
            const effectiveDPR = Math.min(this.config.scaling.devicePixelRatio, this.config.scaling.maxDPR);
            bufferWidth = Math.round(bufferWidth * effectiveDPR);
            bufferHeight = Math.round(bufferHeight * effectiveDPR);
        }
        
        return {
            width: bufferWidth,
            height: bufferHeight
        };
    }
    
    /**
     * CSS表示サイズ適用
     */
    applyCSSSize(cssSize) {
        this.canvas.style.width = cssSize.width + 'px';
        this.canvas.style.height = cssSize.height + 'px';
        
        // CSS表示プロパティ確保
        if (!this.canvas.style.display || this.canvas.style.display === 'none') {
            this.canvas.style.display = 'block';
        }
    }
    
    /**
     * WebGL描画バッファサイズ適用
     */
    applyBufferSize(bufferSize) {
        this.canvas.width = bufferSize.width;
        this.canvas.height = bufferSize.height;
    }
    
    /**
     * コンテナ矩形取得
     */
    getContainerRect() {
        // 親要素を優先、なければviewport
        const parent = this.canvas.parentElement;
        if (parent) {
            return parent.getBoundingClientRect();
        } else {
            return {
                width: window.innerWidth,
                height: window.innerHeight,
                left: 0,
                top: 0
            };
        }
    }
    
    /**
     * %サイズ判定
     */
    isPercentageSize(sizeValue) {
        return typeof sizeValue === 'string' && sizeValue.includes('%');
    }
    
    /**
     * ブレークポイント更新
     */
    updateBreakpoint() {
        const viewportWidth = window.innerWidth;
        let newBreakpoint;
        
        if (viewportWidth < this.config.breakpoints.mobile) {
            newBreakpoint = 'mobile';
        } else if (viewportWidth < this.config.breakpoints.tablet) {
            newBreakpoint = 'tablet';
        } else if (viewportWidth < this.config.breakpoints.desktop) {
            newBreakpoint = 'desktop';
        } else {
            newBreakpoint = 'large';
        }
        
        if (newBreakpoint !== this.state.currentBreakpoint) {
            const oldBreakpoint = this.state.currentBreakpoint;
            this.state.currentBreakpoint = newBreakpoint;
            
            // ブレークポイント変化通知
            this.notifyChange('breakpointChange', {
                oldBreakpoint,
                newBreakpoint,
                viewportWidth
            });
            
            console.log('📱 ブレークポイント変化:', {
                oldBreakpoint,
                newBreakpoint,
                viewportWidth
            });
        }
    }
    
    /**
     * レスポンシブ監視セットアップ
     */
    setupResponsiveMonitoring() {
        // Canvas要素リサイズ監視
        if (typeof ResizeObserver !== 'undefined') {
            this.observers.resize = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    if (entry.target === this.canvas || entry.target === this.canvas.parentElement) {
                        this.onResize();
                    }
                }
            });
            
            this.observers.resize.observe(this.canvas);
            if (this.canvas.parentElement) {
                this.observers.resize.observe(this.canvas.parentElement);
            }
        }
        
        // ウィンドウリサイズ監視
        this.windowResizeHandler = this.throttle(this.onWindowResize.bind(this), 16);
        window.addEventListener('resize', this.windowResizeHandler);
        
        // MediaQuery監視（ブレークポイント）
        this.setupMediaQueryMonitoring();
        
        console.log('👁️ レスポンシブ監視セットアップ完了');
    }
    
    /**
     * MediaQuery監視セットアップ
     */
    setupMediaQueryMonitoring() {
        const breakpoints = [
            { name: 'mobile', query: `(max-width: ${this.config.breakpoints.mobile - 1}px)` },
            { name: 'tablet', query: `(min-width: ${this.config.breakpoints.mobile}px) and (max-width: ${this.config.breakpoints.tablet - 1}px)` },
            { name: 'desktop', query: `(min-width: ${this.config.breakpoints.tablet}px) and (max-width: ${this.config.breakpoints.desktop - 1}px)` },
            { name: 'large', query: `(min-width: ${this.config.breakpoints.desktop}px)` }
        ];
        
        breakpoints.forEach(({ name, query }) => {
            const mediaQuery = window.matchMedia(query);
            const handler = (event) => {
                if (event.matches) {
                    this.updateBreakpoint();
                    this.onBreakpointChange(name);
                }
            };
            
            mediaQuery.addListener(handler);
            this.observers.media.set(name, { mediaQuery, handler });
            
            // 初期状態確認
            if (mediaQuery.matches) {
                this.state.currentBreakpoint = name;
            }
        });
    }
    
    /**
     * DPR監視セットアップ
     */
    setupDPRMonitoring() {
        // DPR変化監視（ズーム・画面変更）
        this.dprCheckInterval = setInterval(() => {
            const currentDPR = window.devicePixelRatio || 1;
            if (Math.abs(currentDPR - this.config.scaling.devicePixelRatio) > 0.1) {
                this.onDPRChange(currentDPR);
            }
        }, 1000);
        
        console.log('📊 DPR監視セットアップ完了:', {
            initialDPR: this.config.scaling.devicePixelRatio
        });
    }
    
    /**
     * リサイズイベント処理
     */
    onResize() {
        console.log('📐 リサイズイベント検出');
        this.updateCanvasSize();
    }
    
    /**
     * ウィンドウリサイズイベント処理
     */
    onWindowResize() {
        console.log('🖥️ ウィンドウリサイズイベント検出');
        this.updateBreakpoint();
        this.updateCanvasSize();
    }
    
    /**
     * ブレークポイント変化処理
     */
    onBreakpointChange(newBreakpoint) {
        console.log('📱 ブレークポイント変化処理:', newBreakpoint);
        
        // ブレークポイント別設定適用（拡張可能）
        switch (newBreakpoint) {
            case 'mobile':
                // モバイル用最適化
                this.config.bufferSize.quality = 'medium';
                break;
            case 'tablet':
                this.config.bufferSize.quality = 'high';
                break;
            case 'desktop':
            case 'large':
                this.config.bufferSize.quality = 'high';
                break;
        }
        
        // サイズ再計算
        this.updateCanvasSize();
    }
    
    /**
     * DPR変化処理
     */
    onDPRChange(newDPR) {
        console.log('📊 DPR変化検出:', {
            old: this.config.scaling.devicePixelRatio,
            new: newDPR
        });
        
        this.config.scaling.devicePixelRatio = newDPR;
        
        // DPR変化通知
        this.notifyChange('dprChange', {
            oldDPR: this.config.scaling.devicePixelRatio,
            newDPR: newDPR
        });
        
        // サイズ再計算
        this.updateCanvasSize();
    }
    
    /**
     * 状態変化判定
     */
    hasStateChanged(oldState, newState) {
        return (
            oldState.actualCSSSize.width !== newState.actualCSSSize.width ||
            oldState.actualCSSSize.height !== newState.actualCSSSize.height ||
            oldState.actualBufferSize.width !== newState.actualBufferSize.width ||
            oldState.actualBufferSize.height !== newState.actualBufferSize.height ||
            oldState.currentBreakpoint !== newState.currentBreakpoint
        );
    }
    
    /**
     * サイズキャッシュ更新
     */
    updateSizeCache() {
        this.sizeCache = {
            cssSize: { ...this.state.actualCSSSize },
            bufferSize: { ...this.state.actualBufferSize },
            lastUpdate: performance.now(),
            cacheTimeout: this.sizeCache.cacheTimeout
        };
    }
    
    /**
     * スロットリング
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * 変化通知
     */
    notifyChange(type, data) {
        const event = {
            type,
            data,
            timestamp: performance.now(),
            state: { ...this.state },
            config: { ...this.config },
            actualSizes: this.getActualSizes()
        };
        
        this.changeCallbacks.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error('❌ Responsive変化コールバックエラー:', error);
            }
        });
    }
    
    /**
     * 変化監視コールバック登録
     */
    onChange(callback) {
        this.changeCallbacks.add(callback);
        return () => this.changeCallbacks.delete(callback);
    }
    
    /**
     * 実際のサイズ取得
     */
    getActualSizes() {
        return {
            css: {
                width: parseInt(this.canvas.style.width) || this.canvas.clientWidth,
                height: parseInt(this.canvas.style.height) || this.canvas.clientHeight
            },
            buffer: {
                width: this.canvas.width,
                height: this.canvas.height
            },
            client: {
                width: this.canvas.clientWidth,
                height: this.canvas.clientHeight
            },
            scaleRatio: { ...this.state.scaleRatio }
        };
    }
    
    /**
     * Canvas情報取得（デバッグ用）
     */
    getCanvasInfo() {
        return {
            element: `${this.canvas.tagName}#${this.canvas.id || 'none'}`,
            cssSize: {
                width: this.canvas.style.width,
                height: this.canvas.style.height
            },
            bufferSize: {
                width: this.canvas.width,
                height: this.canvas.height
            },
            clientSize: {
                width: this.canvas.clientWidth,
                height: this.canvas.clientHeight
            }
        };
    }
    
    /**
     * 現在の状態取得
     */
    getState() {
        return {
            ...this.state,
            config: { ...this.config },
            actualSizes: this.getActualSizes()
        };
    }
    
    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            canvas: this.getCanvasInfo(),
            state: this.getState(),
            observers: {
                resize: !!this.observers.resize,
                mediaQueries: this.observers.media.size,
                dprInterval: !!this.dprCheckInterval
            },
            cache: {
                size: this.sizeCache,
                age: performance.now() - this.sizeCache.lastUpdate
            },
            changeCallbacks: this.changeCallbacks.size
        };
    }
    
    /**
     * 設定更新
     */
    updateConfig(newConfig) {
        const oldConfig = { ...this.config };
        
        // 設定マージ
        if (newConfig.cssSize) {
            Object.assign(this.config.cssSize, newConfig.cssSize);
        }
        if (newConfig.bufferSize) {
            Object.assign(this.config.bufferSize, newConfig.bufferSize);
        }
        if (newConfig.scaling) {
            Object.assign(this.config.scaling, newConfig.scaling);
        }
        if (newConfig.breakpoints) {
            Object.assign(this.config.breakpoints, newConfig.breakpoints);
        }
        
        // 設定変化通知
        this.notifyChange('configUpdate', {
            oldConfig,
            newConfig: { ...this.config }
        });
        
        // サイズ再計算
        this.updateCanvasSize();
        
        console.log('⚙️ 設定更新完了:', {
            oldConfig,
            newConfig: { ...this.config }
        });
    }
    
    /**
     * クリーンアップ
     */
    cleanup() {
        // ResizeObserver停止
        if (this.observers.resize) {
            this.observers.resize.disconnect();
            this.observers.resize = null;
        }
        
        // MediaQuery監視停止
        this.observers.media.forEach(({ mediaQuery, handler }) => {
            mediaQuery.removeListener(handler);
        });
        this.observers.media.clear();
        
        // ウィンドウリサイズ監視停止
        if (this.windowResizeHandler) {
            window.removeEventListener('resize', this.windowResizeHandler);
            this.windowResizeHandler = null;
        }
        
        // DPR監視停止
        if (this.dprCheckInterval) {
            clearInterval(this.dprCheckInterval);
            this.dprCheckInterval = null;
        }
        
        // コールバッククリア
        this.changeCallbacks.clear();
        
        this.isActive = false;
        
        console.log('🧹 ElementObserverResponsive クリーンアップ完了');
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.ElementObserverResponsive = ElementObserverResponsive;
}