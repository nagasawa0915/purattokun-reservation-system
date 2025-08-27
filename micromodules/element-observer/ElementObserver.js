/**
 * ElementObserver.js
 * 
 * 🌊 環境揺れ吸収モジュール - 統合インターフェース
 * - PureBoundingBox特化の安定要素監視API
 * - 親要素サイズ0問題の直接解決
 * - 座標スワップ処理の安定化支援
 */

class ElementObserver {
    constructor() {
        // コアモジュールの依存チェック
        if (typeof ElementObserverCore === 'undefined') {
            throw new Error('ElementObserver: ElementObserverCoreが必要です');
        }
        
        this.core = new ElementObserverCore();
        
        // PureBoundingBox特化機能
        this.parentSizeCache = new Map(); // element -> parentRect
        this.stableParentCallbacks = new Map(); // element -> callback
    }
    
    /**
     * 🎯 PureBoundingBox特化API: 親要素の安定サイズ監視
     * - 親要素サイズ0問題を直接解決
     * - commitToPercent()での安全な変換を保証
     * 
     * @param {Element} targetElement - 対象要素（キャラクター要素）
     * @param {Function} callback - 親サイズ変化時のコールバック(parentRect, isValid)
     */
    observeParentSize(targetElement, callback) {
        if (!targetElement || typeof callback !== 'function') {
            throw new Error('ElementObserver: 対象要素とコールバックが必要です');
        }
        
        const parentElement = targetElement.parentElement;
        if (!parentElement) {
            console.warn('⚠️ ElementObserver: 親要素が見つかりません');
            callback(null, false);
            return () => {};
        }
        
        console.log('🎯 ElementObserver: 親要素サイズ監視開始', {
            target: this.getElementInfo(targetElement),
            parent: this.getElementInfo(parentElement)
        });
        
        // 親要素の監視開始
        const unobserve = this.core.observe(parentElement, (rect, changeType) => {
            const isValidSize = rect && rect.width > 0 && rect.height > 0;
            
            // キャッシュ更新
            this.parentSizeCache.set(targetElement, rect);
            
            // BB特化の詳細ログ
            if (changeType !== 'initial') {
                console.log('📐 ElementObserver: 親要素サイズ変化検出', {
                    changeType,
                    size: `${rect.width}x${rect.height}`,
                    isValid: isValidSize,
                    timestamp: new Date().toLocaleTimeString()
                });
            }
            
            // 有効サイズかどうかで処理分岐
            if (isValidSize) {
                callback(rect, true);
            } else {
                console.warn('⚠️ ElementObserver: 無効な親要素サイズ検出', {
                    width: rect?.width,
                    height: rect?.height,
                    changeType
                });
                callback(rect, false);
            }
        }, {
            throttle: true,
            precision: 0.1
        });
        
        // コールバック記録
        this.stableParentCallbacks.set(targetElement, callback);
        
        return unobserve;
    }
    
    /**
     * 🎯 PureBoundingBox特化API: 安全な親要素矩形取得
     * - commitToPercent()での即座利用可能
     * - キャッシュされた安定値を返す
     */
    getStableParentRect(targetElement) {
        if (!targetElement) return null;
        
        // キャッシュから取得
        if (this.parentSizeCache.has(targetElement)) {
            const cachedRect = this.parentSizeCache.get(targetElement);
            if (cachedRect && cachedRect.width > 0 && cachedRect.height > 0) {
                console.log('📐 ElementObserver: キャッシュ親矩形返却', {
                    size: `${cachedRect.width}x${cachedRect.height}`,
                    age: performance.now() - cachedRect.timestamp
                });
                return cachedRect;
            }
        }
        
        // リアルタイム取得（フォールバック）
        const parentElement = targetElement.parentElement;
        if (!parentElement) return null;
        
        const rect = this.core.getElementRect(parentElement);
        if (rect && rect.width > 0 && rect.height > 0) {
            // キャッシュに保存
            this.parentSizeCache.set(targetElement, rect);
            
            console.log('📐 ElementObserver: リアルタイム親矩形取得', {
                size: `${rect.width}x${rect.height}`
            });
            return rect;
        }
        
        console.warn('⚠️ ElementObserver: 安全な親矩形を取得できません', {
            parent: parentElement ? this.getElementInfo(parentElement) : 'none',
            rectSize: rect ? `${rect.width}x${rect.height}` : 'null'
        });
        
        return null;
    }
    
    /**
     * 🎯 PureBoundingBox特化API: 座標スワップ安全性チェック
     * - enterEditingMode/exitEditingMode前の事前チェック
     * - 安全な座標変換が可能かどうかを判定
     */
    isSafeForCoordinateSwap(targetElement) {
        const parentRect = this.getStableParentRect(targetElement);
        const targetRect = this.core.getElementRect(targetElement);
        
        const isParentSafe = parentRect && parentRect.width > 0 && parentRect.height > 0;
        const isTargetSafe = targetRect && targetRect.width >= 0 && targetRect.height >= 0;
        
        const result = {
            safe: isParentSafe && isTargetSafe,
            parentValid: isParentSafe,
            targetValid: isTargetSafe,
            parentSize: parentRect ? `${parentRect.width}x${parentRect.height}` : 'invalid',
            targetSize: targetRect ? `${targetRect.width}x${targetRect.height}` : 'invalid',
            reason: null
        };
        
        if (!result.safe) {
            if (!isParentSafe) {
                result.reason = '親要素サイズが無効（幅または高さが0）';
            } else if (!isTargetSafe) {
                result.reason = '対象要素サイズが無効';
            }
        }
        
        console.log('🔍 ElementObserver: 座標スワップ安全性チェック', result);
        return result;
    }
    
    /**
     * 汎用的な要素監視（既存API互換）
     */
    observe(element, callback, options = {}) {
        return this.core.observe(element, callback, options);
    }
    
    /**
     * 要素監視停止
     */
    unobserve(element) {
        this.core.unobserve(element);
        this.parentSizeCache.delete(element);
        this.stableParentCallbacks.delete(element);
    }
    
    /**
     * 要素の矩形情報を取得（安定版）
     */
    getElementRect(element) {
        return this.core.getElementRect(element);
    }
    
    /**
     * 🛠️ デバッグ用: 要素情報の取得
     */
    getElementInfo(element) {
        if (!element) return 'null';
        
        return {
            tag: element.tagName,
            id: element.id || 'none',
            class: element.className || 'none',
            size: (() => {
                const rect = element.getBoundingClientRect();
                return `${rect.width}x${rect.height}`;
            })()
        };
    }
    
    /**
     * 🛠️ デバッグ用: PureBoundingBox統合状況確認
     */
    getBoundingBoxIntegrationStatus(targetElement) {
        const status = {
            targetElement: this.getElementInfo(targetElement),
            parentElement: targetElement?.parentElement ? this.getElementInfo(targetElement.parentElement) : null,
            isParentCached: this.parentSizeCache.has(targetElement),
            isCallbackRegistered: this.stableParentCallbacks.has(targetElement),
            safetyCheck: this.isSafeForCoordinateSwap(targetElement),
            timestamp: new Date().toLocaleTimeString()
        };
        
        console.table(status);
        return status;
    }
    
    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        const coreInfo = this.core.getDebugInfo();
        
        return {
            ...coreInfo,
            pureBoundingBoxIntegration: {
                parentSizeCacheCount: this.parentSizeCache.size,
                stableCallbackCount: this.stableParentCallbacks.size,
                cachedElements: Array.from(this.parentSizeCache.keys()).map(el => this.getElementInfo(el))
            }
        };
    }
    
    /**
     * クリーンアップ
     */
    cleanup() {
        this.parentSizeCache.clear();
        this.stableParentCallbacks.clear();
        this.core.cleanup();
        
        console.log('🧹 ElementObserver: 統合インターフェース クリーンアップ完了');
    }
    
    /**
     * 🎯 静的メソッド: PureBoundingBox即座統合
     * - 既存のPureBoundingBoxに最小限の変更で統合
     */
    static createForBoundingBox(targetElement) {
        const observer = new ElementObserver();
        
        // 即座に親要素監視開始
        const unobserve = observer.observeParentSize(targetElement, (parentRect, isValid) => {
            // ここでは通知のみ（必要に応じて追加処理）
            console.log('📡 ElementObserver: BB専用監視通知', {
                isValid,
                size: parentRect ? `${parentRect.width}x${parentRect.height}` : 'invalid'
            });
        });
        
        // PureBoundingBox用のカスタムAPI追加
        observer.boundingBoxAPI = {
            unobserve,
            isReadyForSwap: () => observer.isSafeForCoordinateSwap(targetElement),
            getParentRect: () => observer.getStableParentRect(targetElement),
            getDebugStatus: () => observer.getBoundingBoxIntegrationStatus(targetElement)
        };
        
        return observer;
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.ElementObserver = ElementObserver;
}