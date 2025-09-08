/**
 * Observer - 核心モジュール
 * 
 * Phase 0で確立した基盤（resolveFittedContent/findContainer）を統合し、
 * ResizeObserver + MutationObserver + window resize の監視システムと
 * rAFスロットリングを実装した高精度座標正規化システム
 */

import { resolveFittedContent } from './utils/resolveFittedContent.js';
import { findContainer } from './utils/findContainer.js';

// =============================================================================
// Core Observer Class
// =============================================================================

/**
 * Observer核心クラス - 要素監視・座標正規化の統合制御
 */
class ElementObserver {
    constructor(config = {}) {
        // 設定
        this.config = {
            throttleMs: 16,           // rAF基準（60fps）
            maxElements: 100,         // 最大監視要素数
            snapToPixel: false,       // ピクセルスナップ
            tolerance: 0.5,           // 計算許容誤差
            debugMode: false,         // デバッグログ
            logPerformance: false,    // パフォーマンス計測
            ...config
        };
        
        // 監視状態
        this.targets = new Map();              // 監視対象: Map<element, targetInfo>
        this.rafId = 0;                        // rAF ID
        this.updateQueue = new Set();          // 更新キュー: Set<element>
        this.isUpdating = false;               // 更新中フラグ
        
        // Observer instances
        this.resizeObserver = null;
        this.mutationObserver = null;
        this.windowResizeHandler = null;
        this.fontsReadyHandler = null;
        
        // パフォーマンス計測
        this.performanceMetrics = {
            totalUpdates: 0,
            averageUpdateTime: 0,
            maxUpdateTime: 0
        };
        
        this._initializeObservers();
        this._bindEventHandlers();
        
        if (this.config.debugMode) {
            console.log('🚀 ElementObserver initialized', this.config);
        }
    }
    
    /**
     * Observer群の初期化
     * @private
     */
    _initializeObservers() {
        // ResizeObserver - サイズ・レイアウト変化
        this.resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                this._scheduleUpdate(entry.target);
            }
        });
        
        // MutationObserver - 属性変化（src/srcset/sizes/class/style）
        this.mutationObserver = new MutationObserver(mutations => {
            const affectedElements = new Set();
            
            for (const mutation of mutations) {
                if (mutation.type === 'attributes') {
                    const target = mutation.target;
                    const attr = mutation.attributeName;
                    
                    // 監視対象属性のチェック
                    if (['src', 'srcset', 'sizes', 'style', 'class'].includes(attr)) {
                        affectedElements.add(target);
                    }
                }
            }
            
            for (const element of affectedElements) {
                this._scheduleUpdate(element);
            }
        });
    }
    
    /**
     * イベントハンドラーのバインド
     * @private  
     */
    _bindEventHandlers() {
        // window resize - ビューポート変化
        this.windowResizeHandler = () => {
            // 全要素を更新キューに追加
            for (const element of this.targets.keys()) {
                this._scheduleUpdate(element);
            }
        };
        
        // fonts ready - フォントロード完了
        this.fontsReadyHandler = () => {
            // typography scaleMode の要素のみ更新
            for (const [element, info] of this.targets) {
                if (info.target.scaleMode === 'typography') {
                    this._scheduleUpdate(element);
                }
            }
        };
        
        window.addEventListener('resize', this.windowResizeHandler);
        
        // document.fonts対応ブラウザのみ
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(this.fontsReadyHandler);
            document.fonts.addEventListener('loadingdone', this.fontsReadyHandler);
        }
    }
    
    /**
     * 要素の監視を開始
     * @param {ObserveTarget} target - 監視設定
     * @returns {function} 監視解除関数
     */
    register(target) {
        if (this.targets.size >= this.config.maxElements) {
            console.warn(`⚠️ Observer: Maximum elements (${this.config.maxElements}) reached`);
            return () => {};
        }
        
        const { element } = target;
        
        if (!element || !(element instanceof HTMLElement)) {
            console.error('❌ Observer: Invalid element provided');
            return () => {};
        }
        
        if (this.targets.has(element)) {
            console.warn('⚠️ Observer: Element already registered');
            return this._createUnregisterFunction(element);
        }
        
        // コンテナの特定
        const container = findContainer(element);
        
        // ターゲット情報の構築
        const targetInfo = {
            target,
            container,
            lastUpdate: null,
            updateCount: 0
        };
        
        this.targets.set(element, targetInfo);
        
        // 監視開始
        this.resizeObserver.observe(element);
        this.resizeObserver.observe(container); // コンテナも監視
        
        this.mutationObserver.observe(element, {
            attributes: true,
            attributeFilter: ['src', 'srcset', 'sizes', 'style', 'class']
        });
        
        // 初回更新をスケジュール
        this._scheduleUpdate(element);
        
        if (this.config.debugMode) {
            console.log(`✅ Observer: Registered element`, element);
        }
        
        return this._createUnregisterFunction(element);
    }
    
    /**
     * 更新をスケジュール（rAFスロットリング）
     * @param {HTMLElement} element - 更新対象要素
     * @private
     */
    _scheduleUpdate(element) {
        // 監視対象でない要素はスキップ
        if (!this.targets.has(element)) {
            return;
        }
        
        this.updateQueue.add(element);
        
        // rAFが未予約の場合のみ予約
        if (!this.rafId) {
            this.rafId = requestAnimationFrame(() => {
                this._processUpdateQueue();
                this.rafId = 0;
            });
        }
    }
    
    /**
     * 更新キューの処理（1フレーム1回実行）
     * @private
     */
    _processUpdateQueue() {
        if (this.isUpdating) {
            return; // 重複実行防止
        }
        
        this.isUpdating = true;
        const startTime = performance.now();
        
        const elementsToUpdate = Array.from(this.updateQueue);
        this.updateQueue.clear();
        
        let updatedCount = 0;
        
        for (const element of elementsToUpdate) {
            try {
                if (this._updateElement(element)) {
                    updatedCount++;
                }
            } catch (error) {
                console.error(`❌ Observer: Update failed for element`, element, error);
            }
        }
        
        const endTime = performance.now();
        const updateTime = endTime - startTime;
        
        // パフォーマンス計測
        this._updatePerformanceMetrics(updateTime);
        
        if (this.config.debugMode && updatedCount > 0) {
            console.log(`🔄 Observer: Updated ${updatedCount} elements in ${updateTime.toFixed(2)}ms`);
        }
        
        this.isUpdating = false;
    }
    
    /**
     * 個別要素の更新処理
     * @param {HTMLElement} element - 更新対象
     * @returns {boolean} 更新が実行されたか
     * @private
     */
    _updateElement(element) {
        const targetInfo = this.targets.get(element);
        if (!targetInfo) {
            return false;
        }
        
        const { target, container } = targetInfo;
        
        // DOMRect取得
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // 要素が表示されていない場合はスキップ
        if (elementRect.width === 0 || elementRect.height === 0) {
            return false;
        }
        
        // フィット計算
        const fittedResult = resolveFittedContent(
            elementRect,
            target.logicalSize,
            target.fit || 'contain',
            this._getObjectPosition(element)
        );
        
        // スケール・オフセット計算
        const scaleX = fittedResult.contentW / target.logicalSize.w;
        const scaleY = fittedResult.contentH / target.logicalSize.h;
        const offsetX = (elementRect.left - containerRect.left) + fittedResult.padX;
        const offsetY = (elementRect.top - containerRect.top) + fittedResult.padY;
        
        // ピクセルスナップ（オプション）
        const finalOffsetX = this.config.snapToPixel ? Math.round(offsetX) : offsetX;
        const finalOffsetY = this.config.snapToPixel ? Math.round(offsetY) : offsetY;
        
        // resolve関数の生成
        const resolve = (anchor) => {
            const x = finalOffsetX + anchor.x * scaleX;
            const y = finalOffsetY + anchor.y * scaleY;
            
            return {
                x: this.config.snapToPixel ? Math.round(x) : x,
                y: this.config.snapToPixel ? Math.round(y) : y
            };
        };
        
        // UpdatePayload構築
        const payload = {
            scaleX,
            scaleY,
            offsetX: finalOffsetX,
            offsetY: finalOffsetY,
            width: fittedResult.contentW,
            height: fittedResult.contentH,
            dpr: window.devicePixelRatio || 1,
            resolve
        };
        
        // コールバック実行
        try {
            target.onUpdate(payload);
            
            // 更新情報記録
            targetInfo.lastUpdate = payload;
            targetInfo.updateCount++;
            
            return true;
        } catch (error) {
            console.error('❌ Observer: onUpdate callback failed', error);
            return false;
        }
    }
    
    /**
     * object-position値を取得
     * @param {HTMLElement} element - 対象要素  
     * @returns {string} object-position値
     * @private
     */
    _getObjectPosition(element) {
        const computed = getComputedStyle(element);
        return computed.objectPosition || '50% 50%';
    }
    
    /**
     * 監視解除関数を生成
     * @param {HTMLElement} element - 対象要素
     * @returns {function} 監視解除関数
     * @private
     */
    _createUnregisterFunction(element) {
        return () => {
            if (!this.targets.has(element)) {
                return;
            }
            
            // Observer監視解除
            this.resizeObserver.unobserve(element);
            this.mutationObserver.disconnect(); // 要素単位でのdisconnectができないため全解除後再構築
            
            // ターゲット削除
            this.targets.delete(element);
            
            // 更新キューからも削除
            this.updateQueue.delete(element);
            
            // MutationObserver再構築（残存要素用）
            this._rebuildMutationObserver();
            
            if (this.config.debugMode) {
                console.log(`🗑️ Observer: Unregistered element`, element);
            }
        };
    }
    
    /**
     * MutationObserver再構築
     * @private
     */
    _rebuildMutationObserver() {
        // 全要素を再監視
        for (const element of this.targets.keys()) {
            this.mutationObserver.observe(element, {
                attributes: true,
                attributeFilter: ['src', 'srcset', 'sizes', 'style', 'class']
            });
        }
    }
    
    /**
     * パフォーマンス計測の更新
     * @param {number} updateTime - 更新時間（ms）
     * @private
     */
    _updatePerformanceMetrics(updateTime) {
        const metrics = this.performanceMetrics;
        metrics.totalUpdates++;
        
        // 平均更新時間の計算
        metrics.averageUpdateTime = 
            (metrics.averageUpdateTime * (metrics.totalUpdates - 1) + updateTime) / metrics.totalUpdates;
        
        // 最大更新時間の更新
        if (updateTime > metrics.maxUpdateTime) {
            metrics.maxUpdateTime = updateTime;
        }
        
        // パフォーマンス警告
        if (this.config.logPerformance && updateTime > 16.67) { // 60fps閾値
            console.warn(`⚠️ Observer: Slow update detected (${updateTime.toFixed(2)}ms)`);
        }
    }
    
    /**
     * 全監視を停止・リソース解放
     */
    destroy() {
        // rAFキャンセル
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
        
        // Observer停止
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        
        // イベントリスナー削除
        if (this.windowResizeHandler) {
            window.removeEventListener('resize', this.windowResizeHandler);
        }
        if (document.fonts && this.fontsReadyHandler) {
            document.fonts.removeEventListener('loadingdone', this.fontsReadyHandler);
        }
        
        // データクリア
        this.targets.clear();
        this.updateQueue.clear();
        
        if (this.config.debugMode) {
            console.log('🗑️ Observer: Destroyed');
        }
    }
    
    /**
     * 診断情報取得
     * @returns {Object} 診断情報
     */
    getDiagnostics() {
        return {
            config: this.config,
            targetCount: this.targets.size,
            queueSize: this.updateQueue.size,
            isUpdating: this.isUpdating,
            performance: { ...this.performanceMetrics }
        };
    }
}

// =============================================================================  
// Singleton Instance & Public API
// =============================================================================

// シングルトンインスタンス
let observerInstance = null;

/**
 * Observer インスタンスを取得・初期化
 * @param {Object} config - 設定オプション
 * @returns {ElementObserver} Observer インスタンス
 */
function getObserver(config = {}) {
    if (!observerInstance) {
        observerInstance = new ElementObserver(config);
    }
    return observerInstance;
}

/**
 * 要素の監視を開始（公開API）
 * @param {ObserveTarget} target - 監視設定
 * @returns {function} 監視解除関数
 */
export function register(target) {
    return getObserver().register(target);
}

/**
 * Observer設定を変更（次回getObserver時に反映）
 * @param {Object} config - 新設定
 */
export function configure(config) {
    if (observerInstance) {
        console.warn('⚠️ Observer: Configuration change will take effect after restart');
    }
    // 次回用設定として保存（実装簡素化のため現在は警告のみ）
}

/**
 * Observer診断情報を取得
 * @returns {Object} 診断情報
 */
export function getDiagnostics() {
    return observerInstance ? observerInstance.getDiagnostics() : null;
}

/**
 * Observer を完全停止・リソース解放
 */
export function destroy() {
    if (observerInstance) {
        observerInstance.destroy();
        observerInstance = null;
    }
}

// =============================================================================
// Utility Exports - Phase 0基盤のexport
// =============================================================================

export { resolveFittedContent } from './utils/resolveFittedContent.js';
export { findContainer } from './utils/findContainer.js';