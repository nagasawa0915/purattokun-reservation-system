/**
 * ElementObserverTransform.js
 * 
 * 🎯 CSS Transform統合監視システム - Phase 2
 * - CSS Transform解析・合成・Matrix計算
 * - CSS変数との完全同期
 * - 複数transform値の自動合成・分解
 */

class ElementObserverTransform {
    constructor(targetElement) {
        this.targetElement = targetElement;
        this.interactiveElement = targetElement.querySelector('.interactive');
        
        // Transform状態管理
        this.transforms = {
            static: 'translate(-50%, -50%)',     // 固定transform（layout-anchor）
            dynamic: 'translate(0px, 0px)',     // 動的transform（CSS変数由来）
            scale: 'scale(1, 1)',               // スケール変換
            rotate: 'rotate(0deg)',             // 回転変換
            combined: null                       // 合成結果
        };
        
        // CSS変数状態管理
        this.cssVariables = {
            tx: 0,      // --tx
            ty: 0,      // --ty
            scale: 1,   // --scale
            rotation: 0 // --rotation
        };
        
        // Transform Matrix管理 + キャッシュシステム
        this.matrices = {
            static: null,
            dynamic: null,
            combined: null,
            cache: {
                staticValid: false,
                dynamicValid: false,
                combinedValid: false,
                lastStaticTransform: null,
                lastDynamicTransform: null
            }
        };
        
        // 監視状態
        this.isActive = false;
        this.changeCallbacks = new Set();
        
        // パフォーマンス最適化設定
        this.optimizationSettings = {
            batchUpdates: true,
            cacheEnabled: true,
            skipRedundantCalculations: true,
            maxCacheAge: 16  // ms（約1フレーム）
        };
        
        // バッチ処理用
        this.pendingUpdates = {
            cssVariables: {},
            hasPending: false,
            batchTimeout: null
        };
        
        this.initialize();
    }
    
    /**
     * 初期化処理
     */
    initialize() {
        console.log('🎯 ElementObserverTransform初期化開始', {
            targetElement: this.getElementInfo(this.targetElement),
            interactiveElement: this.interactiveElement ? this.getElementInfo(this.interactiveElement) : null
        });
        
        // 現在の状態を読み込み
        this.loadCurrentState();
        
        // 初期Matrix計算
        this.updateMatrices();
        
        console.log('✅ ElementObserverTransform初期化完了', {
            transforms: this.transforms,
            cssVariables: this.cssVariables
        });
    }
    
    /**
     * 現在の状態を読み込み
     */
    loadCurrentState() {
        // layout-anchorの固定transformを読み込み
        const anchorStyle = getComputedStyle(this.targetElement);
        this.transforms.static = anchorStyle.transform || 'translate(-50%, -50%)';
        
        if (this.interactiveElement) {
            // interactiveのCSS変数を読み込み
            const interactiveStyle = getComputedStyle(this.interactiveElement);
            
            // CSS変数値を取得・パース
            this.cssVariables.tx = this.parseCSSValue(interactiveStyle.getPropertyValue('--tx'));
            this.cssVariables.ty = this.parseCSSValue(interactiveStyle.getPropertyValue('--ty'));
            this.cssVariables.scale = this.parseCSSValue(interactiveStyle.getPropertyValue('--scale'), 1);
            this.cssVariables.rotation = this.parseCSSValue(interactiveStyle.getPropertyValue('--rotation'));
            
            // dynamic transform構築
            this.updateDynamicTransform();
        }
        
        console.log('🔍 現在状態読み込み完了:', {
            staticTransform: this.transforms.static,
            cssVariables: this.cssVariables,
            dynamicTransform: this.transforms.dynamic
        });
    }
    
    /**
     * CSS値のパース
     */
    parseCSSValue(value, defaultValue = 0) {
        if (!value || value === '') return defaultValue;
        
        const numValue = parseFloat(value);
        return isNaN(numValue) ? defaultValue : numValue;
    }
    
    /**
     * dynamic transform更新
     */
    updateDynamicTransform() {
        // CSS変数から動的transformを構築
        this.transforms.dynamic = `translate(${this.cssVariables.tx}px, ${this.cssVariables.ty}px)`;
        this.transforms.scale = `scale(${this.cssVariables.scale}, ${this.cssVariables.scale})`;
        this.transforms.rotate = `rotate(${this.cssVariables.rotation}deg)`;
        
        // 合成transform更新
        this.updateCombinedTransform();
        
        // キャッシュ無効化
        this.matrices.cache.dynamicValid = false;
        this.matrices.cache.combinedValid = false;
    }
    
    /**
     * 合成transform更新
     */
    updateCombinedTransform() {
        // 4つのtransform値を順序よく合成
        this.transforms.combined = [
            this.transforms.static,      // 1. 固定（center anchor）
            this.transforms.dynamic,     // 2. 動的移動
            this.transforms.scale,       // 3. スケール
            this.transforms.rotate       // 4. 回転
        ].filter(t => t && t !== 'none').join(' ');
        
        console.log('🎯 Transform合成:', {
            static: this.transforms.static,
            dynamic: this.transforms.dynamic,
            scale: this.transforms.scale,
            rotate: this.transforms.rotate,
            combined: this.transforms.combined
        });
    }
    
    /**
     * CSS変数設定（メイン機能）
     */
    setCSSVariables(variables, options = {}) {
        console.log('🎯 CSS変数設定:', variables);
        
        if (this.optimizationSettings.batchUpdates && !options.immediate) {
            return this.setCSSVariablesBatched(variables, options);
        } else {
            return this.setCSSVariablesImmediate(variables, options);
        }
    }
    
    /**
     * バッチ処理版CSS変数設定
     */
    setCSSVariablesBatched(variables, options) {
        // 保留中の更新に追加
        Object.assign(this.pendingUpdates.cssVariables, variables);
        this.pendingUpdates.hasPending = true;
        
        // バッチタイマー設定
        if (this.pendingUpdates.batchTimeout) {
            clearTimeout(this.pendingUpdates.batchTimeout);
        }
        
        this.pendingUpdates.batchTimeout = setTimeout(() => {
            this.flushPendingCSSUpdates();
        }, 0);
        
        return true;
    }
    
    /**
     * 即座実行版CSS変数設定
     */
    setCSSVariablesImmediate(variables, options) {
        if (!this.interactiveElement) {
            console.warn('⚠️ interactiveElement not found');
            return false;
        }
        
        try {
            // 冗長計算スキップ
            if (this.optimizationSettings.skipRedundantCalculations) {
                variables = this.filterRedundantVariables(variables);
                if (Object.keys(variables).length === 0) {
                    console.log('🚀 冗長計算スキップ - 変更なし');
                    return true;
                }
            }
            
            const oldValues = { ...this.cssVariables };
            
            // CSS変数を実際に設定
            Object.entries(variables).forEach(([key, value]) => {
                if (key in this.cssVariables) {
                    this.cssVariables[key] = value;
                    this.interactiveElement.style.setProperty(`--${key}`, value);
                }
            });
            
            // Transform更新
            this.updateDynamicTransform();
            
            // Matrix更新
            this.updateMatrices();
            
            // 変化通知
            this.notifyChange('cssVariablesChange', {
                oldValues,
                newValues: this.cssVariables,
                changedKeys: Object.keys(variables)
            });
            
            console.log('✅ CSS変数設定完了:', this.cssVariables);
            return true;
            
        } catch (error) {
            console.error('❌ CSS変数設定エラー:', error);
            return false;
        }
    }
    
    /**
     * 冗長変数のフィルタリング
     */
    filterRedundantVariables(variables) {
        const filtered = {};
        
        Object.entries(variables).forEach(([key, value]) => {
            if (key in this.cssVariables && this.cssVariables[key] !== value) {
                filtered[key] = value;
            }
        });
        
        return filtered;
    }
    
    /**
     * 保留中CSS更新のフラッシュ
     */
    flushPendingCSSUpdates() {
        if (!this.pendingUpdates.hasPending) return;
        
        const variables = { ...this.pendingUpdates.cssVariables };
        
        // バッチクリア
        this.pendingUpdates.cssVariables = {};
        this.pendingUpdates.hasPending = false;
        this.pendingUpdates.batchTimeout = null;
        
        console.log('🚀 バッチCSS変数更新:', variables);
        
        // 即座実行
        this.setCSSVariablesImmediate(variables, { fromBatch: true });
    }
    
    /**
     * Matrix更新
     */
    updateMatrices() {
        if (!this.optimizationSettings.cacheEnabled) {
            // キャッシュ無効の場合は常に再計算
            this.calculateAllMatrices();
            return;
        }
        
        // キャッシュベースの最適化更新
        this.updateMatricesOptimized();
    }
    
    /**
     * 最適化Matrix更新
     */
    updateMatricesOptimized() {
        const now = performance.now();
        
        // Static Matrix更新チェック
        if (!this.matrices.cache.staticValid || 
            this.matrices.cache.lastStaticTransform !== this.transforms.static) {
            
            this.matrices.static = this.parseTransformToMatrix(this.transforms.static);
            this.matrices.cache.staticValid = true;
            this.matrices.cache.lastStaticTransform = this.transforms.static;
            this.matrices.cache.combinedValid = false;  // 合成も無効化
        }
        
        // Dynamic Matrix更新チェック
        if (!this.matrices.cache.dynamicValid || 
            this.matrices.cache.lastDynamicTransform !== this.transforms.dynamic) {
            
            this.matrices.dynamic = this.parseTransformToMatrix(this.transforms.dynamic);
            this.matrices.cache.dynamicValid = true;
            this.matrices.cache.lastDynamicTransform = this.transforms.dynamic;
            this.matrices.cache.combinedValid = false;  // 合成も無効化
        }
        
        // Combined Matrix更新
        if (!this.matrices.cache.combinedValid) {
            this.matrices.combined = this.combineMatrices(
                this.matrices.static,
                this.matrices.dynamic
            );
            this.matrices.cache.combinedValid = true;
        }
    }
    
    /**
     * 全Matrix計算（非最適化版）
     */
    calculateAllMatrices() {
        this.matrices.static = this.parseTransformToMatrix(this.transforms.static);
        this.matrices.dynamic = this.parseTransformToMatrix(this.transforms.dynamic);
        this.matrices.combined = this.combineMatrices(this.matrices.static, this.matrices.dynamic);
    }
    
    /**
     * Transform文字列をMatrixに変換
     */
    parseTransformToMatrix(transformString) {
        if (!transformString || transformString === 'none') {
            return [1, 0, 0, 1, 0, 0];  // 単位行列
        }
        
        try {
            // 簡易実装：translate値の抽出
            const translateMatch = transformString.match(/translate\(([^,]+),\s*([^)]+)\)/);
            if (translateMatch) {
                const tx = this.parseCSSValue(translateMatch[1]);
                const ty = this.parseCSSValue(translateMatch[2]);
                return [1, 0, 0, 1, tx, ty];
            }
            
            // translate%の処理
            const translatePercentMatch = transformString.match(/translate\(([^,]+)%,\s*([^)]+)%\)/);
            if (translatePercentMatch) {
                // %値は実際の計算時に解決する必要がある
                const txPercent = this.parseCSSValue(translatePercentMatch[1]);
                const tyPercent = this.parseCSSValue(translatePercentMatch[2]);
                
                // 要素サイズ取得
                const rect = this.targetElement.getBoundingClientRect();
                const tx = (txPercent / 100) * rect.width;
                const ty = (tyPercent / 100) * rect.height;
                
                return [1, 0, 0, 1, tx, ty];
            }
            
        } catch (error) {
            console.error('❌ Transform Matrix変換エラー:', error);
        }
        
        return [1, 0, 0, 1, 0, 0];  // エラー時は単位行列
    }
    
    /**
     * 複数Matrixの合成
     */
    combineMatrices(matrix1, matrix2) {
        if (!matrix1 || !matrix2) {
            return matrix1 || matrix2 || [1, 0, 0, 1, 0, 0];
        }
        
        // 2D Matrix乗算: [a, b, c, d, e, f]
        const [a1, b1, c1, d1, e1, f1] = matrix1;
        const [a2, b2, c2, d2, e2, f2] = matrix2;
        
        return [
            a1 * a2 + b1 * c2,
            a1 * b2 + b1 * d2,
            c1 * a2 + d1 * c2,
            c1 * b2 + d1 * d2,
            e1 * a2 + f1 * c2 + e2,
            e1 * b2 + f1 * d2 + f2
        ];
    }
    
    /**
     * 監視開始
     */
    startObserving() {
        if (this.isActive) return;
        
        this.isActive = true;
        
        // CSS変数監視（Mutation Observer）
        if (this.interactiveElement) {
            this.startCSSVariableObserver();
        }
        
        console.log('🎯 ElementObserverTransform監視開始');
    }
    
    /**
     * CSS変数監視開始
     */
    startCSSVariableObserver() {
        this.cssObserver = new MutationObserver((mutations) => {
            this.handleCSSMutations(mutations);
        });
        
        this.cssObserver.observe(this.interactiveElement, {
            attributes: true,
            attributeFilter: ['style']
        });
    }
    
    /**
     * CSS Mutation処理
     */
    handleCSSMutations(mutations) {
        let hasRelevantChange = false;
        
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                // style属性の変更をチェック
                hasRelevantChange = this.checkCSSVariableChanges();
                break;
            }
        }
        
        if (hasRelevantChange) {
            console.log('🎯 CSS変数変化検出');
            this.updateDynamicTransform();
            this.updateMatrices();
            
            this.notifyChange('cssVariablesMutation', {
                cssVariables: this.cssVariables,
                transforms: this.transforms
            });
        }
    }
    
    /**
     * CSS変数変化チェック
     */
    checkCSSVariableChanges() {
        const style = getComputedStyle(this.interactiveElement);
        const newValues = {
            tx: this.parseCSSValue(style.getPropertyValue('--tx')),
            ty: this.parseCSSValue(style.getPropertyValue('--ty')),
            scale: this.parseCSSValue(style.getPropertyValue('--scale'), 1),
            rotation: this.parseCSSValue(style.getPropertyValue('--rotation'))
        };
        
        // 変化チェック
        let hasChange = false;
        Object.entries(newValues).forEach(([key, value]) => {
            if (this.cssVariables[key] !== value) {
                this.cssVariables[key] = value;
                hasChange = true;
            }
        });
        
        return hasChange;
    }
    
    /**
     * 監視停止
     */
    stopObserving() {
        if (!this.isActive) return;
        
        this.isActive = false;
        
        if (this.cssObserver) {
            this.cssObserver.disconnect();
            this.cssObserver = null;
        }
        
        console.log('🎯 ElementObserverTransform監視停止');
    }
    
    /**
     * 変化コールバック登録
     */
    onChange(callback) {
        this.changeCallbacks.add(callback);
        return () => this.changeCallbacks.delete(callback);
    }
    
    /**
     * 変化通知
     */
    notifyChange(type, data) {
        const event = {
            type,
            data,
            timestamp: performance.now(),
            transforms: this.transforms,
            cssVariables: this.cssVariables,
            matrices: this.matrices
        };
        
        this.changeCallbacks.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error('❌ Transform変化コールバックエラー:', error);
            }
        });
    }
    
    /**
     * 状態取得
     */
    getState() {
        return {
            transforms: { ...this.transforms },
            cssVariables: { ...this.cssVariables },
            matrices: {
                static: this.matrices.static ? [...this.matrices.static] : null,
                dynamic: this.matrices.dynamic ? [...this.matrices.dynamic] : null,
                combined: this.matrices.combined ? [...this.matrices.combined] : null
            },
            isActive: this.isActive
        };
    }
    
    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            ...this.getState(),
            optimizationSettings: this.optimizationSettings,
            cacheInfo: {
                ...this.matrices.cache,
                age: performance.now() - (this.matrices.cache.lastUpdate || 0)
            },
            pendingUpdates: {
                hasPending: this.pendingUpdates.hasPending,
                variableCount: Object.keys(this.pendingUpdates.cssVariables).length
            },
            callbackCount: this.changeCallbacks.size
        };
    }
    
    /**
     * パフォーマンス統計取得
     */
    getPerformanceStats() {
        return {
            optimizationSettings: this.optimizationSettings,
            cacheStats: {
                staticCacheValid: this.matrices.cache.staticValid,
                dynamicCacheValid: this.matrices.cache.dynamicValid,
                combinedCacheValid: this.matrices.cache.combinedValid
            },
            batchingStats: {
                hasPendingUpdates: this.pendingUpdates.hasPending,
                pendingVariableCount: Object.keys(this.pendingUpdates.cssVariables).length
            }
        };
    }
    
    /**
     * 合成Transform取得
     */
    getCombinedTransform() {
        return this.transforms.combined;
    }
    
    /**
     * 合成Matrix取得
     */
    getCombinedMatrix() {
        return this.matrices.combined ? [...this.matrices.combined] : [1, 0, 0, 1, 0, 0];
    }
    
    /**
     * 最適化設定変更
     */
    setOptimizationSettings(settings) {
        this.optimizationSettings = { ...this.optimizationSettings, ...settings };
        console.log('⚡ ElementObserverTransform最適化設定更新:', this.optimizationSettings);
    }
    
    /**
     * 要素情報取得（デバッグ用）
     */
    getElementInfo(element) {
        if (!element) return null;
        
        return {
            tagName: element.tagName,
            id: element.id || '(no-id)',
            className: element.className || '(no-class)',
            hasStyle: !!element.style.cssText
        };
    }
    
    /**
     * クリーンアップ
     */
    cleanup() {
        // 監視停止
        this.stopObserving();
        
        // バッチタイマークリア
        if (this.pendingUpdates.batchTimeout) {
            clearTimeout(this.pendingUpdates.batchTimeout);
            this.pendingUpdates.batchTimeout = null;
        }
        
        // コールバッククリア
        this.changeCallbacks.clear();
        
        console.log('🧹 ElementObserverTransform クリーンアップ完了');
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.ElementObserverTransform = ElementObserverTransform;
}