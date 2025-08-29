/**
 * ElementObserverCore.js
 * 
 * 🌊 環境揺れ吸収モジュール - コア機能
 * - 要素の位置・サイズの安定監視
 * - DOM変化・リサイズ・スクロールによる影響の吸収
 * - 重複通知の排除とスロットリング制御
 */

class ElementObserverCore {
    constructor() {
        this.observers = new Map(); // element -> observerData
        this.throttleTimers = new Map(); // element -> timerId
        this.lastNotifications = new Map(); // element -> lastRect
        
        // スロットリング設定（60fps最適化）
        this.throttleDelay = 8; // ~120fps対応
        this.duplicateThreshold = 0.05; // 0.05px未満の変化は重複として扱う（精度向上）
        
        // グローバルObserver
        this.resizeObserver = null;
        this.mutationObserver = null;
        
        this.initializeGlobalObservers();
    }
    
    /**
     * グローバル監視システム初期化
     */
    initializeGlobalObservers() {
        // ResizeObserver: 要素サイズ変化監視
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver((entries) => {
                entries.forEach((entry) => {
                    this.handleElementChange(entry.target, 'resize');
                });
            });
        }
        
        // MutationObserver: DOM構造変化監視
        this.mutationObserver = new MutationObserver((mutations) => {
            const changedElements = new Set();
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    // 変更された要素とその子要素をチェック
                    if (mutation.target) {
                        changedElements.add(mutation.target);
                        
                        // 監視対象要素が影響を受けているかチェック
                        this.observers.forEach((data, element) => {
                            if (mutation.target.contains(element) || element.contains(mutation.target)) {
                                changedElements.add(element);
                            }
                        });
                    }
                }
            });
            
            changedElements.forEach((element) => {
                this.handleElementChange(element, 'mutation');
            });
        });
        
        // ドキュメント全体のMutation監視開始
        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
        
        // スクロールイベント監視
        window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
        window.addEventListener('resize', this.handleWindowResize.bind(this), { passive: true });
    }
    
    /**
     * 要素の監視開始
     * @param {Element} element - 監視対象要素
     * @param {Function} callback - 変化時のコールバック(rect, changeType)
     * @param {Object} options - 監視オプション
     */
    observe(element, callback, options = {}) {
        if (!element || typeof callback !== 'function') {
            throw new Error('ElementObserver: 有効な要素とコールバックが必要です');
        }
        
        const observerData = {
            element,
            callback,
            options: {
                throttle: options.throttle !== false, // デフォルトでスロットリング有効
                includeChildren: options.includeChildren || false,
                precision: options.precision || this.duplicateThreshold,
                ...options
            },
            lastRect: this.getElementRect(element),
            isActive: true
        };
        
        this.observers.set(element, observerData);
        
        // ResizeObserver登録
        if (this.resizeObserver) {
            this.resizeObserver.observe(element);
        }
        
        // 初回通知（現在の状態）
        this.notifyCallback(observerData, 'initial');
        
        console.log(`📡 ElementObserver: 監視開始 - ${element.tagName}${element.id ? '#' + element.id : ''}${element.className ? '.' + element.className : ''}`);
        
        return () => this.unobserve(element);
    }
    
    /**
     * 要素の監視停止
     */
    unobserve(element) {
        if (!this.observers.has(element)) return;
        
        // ResizeObserver解除
        if (this.resizeObserver) {
            this.resizeObserver.unobserve(element);
        }
        
        // スロットリングタイマーをクリア
        if (this.throttleTimers.has(element)) {
            clearTimeout(this.throttleTimers.get(element));
            this.throttleTimers.delete(element);
        }
        
        // データクリア
        this.observers.delete(element);
        this.lastNotifications.delete(element);
        
        console.log(`📡 ElementObserver: 監視停止 - ${element.tagName}${element.id ? '#' + element.id : ''}`);
    }
    
    /**
     * 要素の矩形情報を取得（安定版）
     */
    getElementRect(element) {
        if (!element || !element.getBoundingClientRect) {
            return null;
        }
        
        try {
            const rect = element.getBoundingClientRect();
            const computedStyle = getComputedStyle(element);
            
            // DPR補正
            const dpr = window.devicePixelRatio || 1;
            
            return {
                left: Math.round(rect.left * dpr) / dpr,
                top: Math.round(rect.top * dpr) / dpr,
                width: Math.round(rect.width * dpr) / dpr,
                height: Math.round(rect.height * dpr) / dpr,
                right: Math.round(rect.right * dpr) / dpr,
                bottom: Math.round(rect.bottom * dpr) / dpr,
                
                // 追加情報
                scrollLeft: element.scrollLeft || 0,
                scrollTop: element.scrollTop || 0,
                
                // CSS値
                cssLeft: computedStyle.left,
                cssTop: computedStyle.top,
                cssWidth: computedStyle.width,
                cssHeight: computedStyle.height,
                
                // 親要素との相対位置
                offsetLeft: element.offsetLeft,
                offsetTop: element.offsetTop,
                
                // タイムスタンプ
                timestamp: performance.now()
            };
        } catch (error) {
            console.warn('⚠️ ElementObserver: 矩形取得エラー', error);
            return null;
        }
    }
    
    /**
     * 要素変化処理（メイン処理）
     */
    handleElementChange(element, changeType = 'unknown') {
        if (!this.observers.has(element)) return;
        
        const observerData = this.observers.get(element);
        if (!observerData.isActive) return;
        
        const currentRect = this.getElementRect(element);
        if (!currentRect) return;
        
        // 重複チェック
        if (this.isDuplicateChange(observerData.lastRect, currentRect, observerData.options.precision)) {
            return;
        }
        
        // 前回の矩形を更新
        observerData.lastRect = currentRect;
        
        // スロットリング処理
        if (observerData.options.throttle) {
            this.throttleNotification(observerData, changeType);
        } else {
            this.notifyCallback(observerData, changeType);
        }
    }
    
    /**
     * 重複変化チェック
     */
    isDuplicateChange(lastRect, currentRect, precision) {
        if (!lastRect || !currentRect) return false;
        
        const diff = {
            left: Math.abs(currentRect.left - lastRect.left),
            top: Math.abs(currentRect.top - lastRect.top),
            width: Math.abs(currentRect.width - lastRect.width),
            height: Math.abs(currentRect.height - lastRect.height)
        };
        
        return diff.left < precision && 
               diff.top < precision && 
               diff.width < precision && 
               diff.height < precision;
    }
    
    /**
     * スロットリング通知
     */
    throttleNotification(observerData, changeType) {
        const element = observerData.element;
        
        // 既存のタイマーをクリア
        if (this.throttleTimers.has(element)) {
            clearTimeout(this.throttleTimers.get(element));
        }
        
        // 新しいタイマーを設定
        const timerId = setTimeout(() => {
            this.notifyCallback(observerData, changeType);
            this.throttleTimers.delete(element);
        }, this.throttleDelay);
        
        this.throttleTimers.set(element, timerId);
    }
    
    /**
     * コールバック通知実行
     */
    notifyCallback(observerData, changeType) {
        const { callback, lastRect, element } = observerData;
        
        try {
            callback(lastRect, changeType, element);
        } catch (error) {
            console.error('❌ ElementObserver: コールバックエラー', error);
        }
    }
    
    /**
     * スクロールイベント処理
     */
    handleScroll() {
        this.observers.forEach((data, element) => {
            this.handleElementChange(element, 'scroll');
        });
    }
    
    /**
     * ウィンドウリサイズイベント処理
     */
    handleWindowResize() {
        this.observers.forEach((data, element) => {
            this.handleElementChange(element, 'window-resize');
        });
    }
    
    /**
     * 全監視の一時停止
     */
    pauseAll() {
        this.observers.forEach((data) => {
            data.isActive = false;
        });
        console.log('⏸️ ElementObserver: 全監視を一時停止');
    }
    
    /**
     * 全監視の再開
     */
    resumeAll() {
        this.observers.forEach((data) => {
            data.isActive = true;
        });
        console.log('▶️ ElementObserver: 全監視を再開');
    }
    
    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        const info = {
            observerCount: this.observers.size,
            activeThrottleTimers: this.throttleTimers.size,
            resizeObserverEnabled: !!this.resizeObserver,
            mutationObserverEnabled: !!this.mutationObserver,
            observers: []
        };
        
        this.observers.forEach((data, element) => {
            info.observers.push({
                element: `${element.tagName}${element.id ? '#' + element.id : ''}${element.className ? '.' + element.className.split(' ')[0] : ''}`,
                isActive: data.isActive,
                lastRect: data.lastRect,
                options: data.options
            });
        });
        
        return info;
    }
    
    /**
     * クリーンアップ
     */
    cleanup() {
        // 全監視停止
        this.observers.forEach((data, element) => {
            this.unobserve(element);
        });
        
        // グローバルObserver停止
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
        
        // イベントリスナー削除
        window.removeEventListener('scroll', this.handleScroll.bind(this));
        window.removeEventListener('resize', this.handleWindowResize.bind(this));
        
        // データクリア
        this.observers.clear();
        this.throttleTimers.clear();
        this.lastNotifications.clear();
        
        console.log('🧹 ElementObserver: 完全クリーンアップ完了');
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.ElementObserverCore = ElementObserverCore;
}