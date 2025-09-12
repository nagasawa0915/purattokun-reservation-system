/**
 * ElementObserverTransform.js - Phase 2 アーカイブ済み
 * 
 * このファイルは archive/element-observer-phase2-complete/modules/ に移動されました
 * AutoPin開発に集中するためPhase 1 BB特化版に戻します
 * 
 * 復元方法:
 * cp archive/element-observer-phase2-complete/modules/ElementObserverTransform.js ./
 */

// Phase 2機能が必要な場合は、アーカイブから復元してください
console.warn('ElementObserverTransform は Phase 2完全アーカイブ済みです。');
console.info('復元方法: archive/element-observer-phase2-complete/modules/ から復元');

// 軽量なダミークラス（エラー防止用）
class ElementObserverTransform {
    constructor() {
        console.warn('ElementObserverTransform: Phase 2機能はアーカイブ済みです。Phase 1のElementObserverまたはElementObserverCoreをご利用ください。');
    }

    // 基本的なAPI互換性（エラー回避用）
    setCSSVariables() { return false; }
    getCombinedTransform() { return 'translate(-50%, -50%)'; }
    getCombinedMatrix() { return [1, 0, 0, 1, 0, 0]; }
    cleanup() {}
}

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
            
            this.cssVariables.tx = parseFloat(interactiveStyle.getPropertyValue('--tx')) || 0;
            this.cssVariables.ty = parseFloat(interactiveStyle.getPropertyValue('--ty')) || 0;
            this.cssVariables.scale = parseFloat(interactiveStyle.getPropertyValue('--scale')) || 1;
            this.cssVariables.rotation = parseFloat(interactiveStyle.getPropertyValue('--rotation')) || 0;
            
            // 動的transformを構築
            this.updateDynamicTransform();
            
            console.log('📐 現在のCSS変数状態読み込み完了', {
                tx: this.cssVariables.tx,
                ty: this.cssVariables.ty,
                scale: this.cssVariables.scale,
                rotation: this.cssVariables.rotation
            });
        }
    }
    
    /**
     * 動的Transform更新
     */
    updateDynamicTransform() {
        if (!this.interactiveElement) return;
        
        const transforms = [];
        
        // 平行移動
        if (this.cssVariables.tx !== 0 || this.cssVariables.ty !== 0) {
            transforms.push(`translate(${this.cssVariables.tx}px, ${this.cssVariables.ty}px)`);
        }
        
        // スケール
        if (this.cssVariables.scale !== 1) {
            transforms.push(`scale(${this.cssVariables.scale})`);
        }
        
        // 回転
        if (this.cssVariables.rotation !== 0) {
            transforms.push(`rotate(${this.cssVariables.rotation}deg)`);
        }
        
        this.transforms.dynamic = transforms.length > 0 ? transforms.join(' ') : 'translate(0px, 0px)';
        
        console.log('🔄 動的Transform更新:', this.transforms.dynamic);
    }
    
    /**
     * CSS変数設定
     */
    setCSSVariable(name, value) {
        if (!this.interactiveElement) {
            console.warn('⚠️ interactiveElementが見つかりません');
            return false;
        }
        
        const oldValue = this.cssVariables[name];
        this.cssVariables[name] = value;
        
        // CSS変数をDOM要素に適用
        let cssValue;
        switch (name) {
            case 'tx':
            case 'ty':
                cssValue = value + 'px';
                break;
            case 'scale':
                cssValue = value.toString();
                break;
            case 'rotation':
                cssValue = value + 'deg';
                break;
            default:
                cssValue = value.toString();
        }
        
        this.interactiveElement.style.setProperty(`--${name}`, cssValue);
        
        // 動的Transform更新
        this.updateDynamicTransform();
        
        // Matrix再計算
        this.updateMatrices();
        
        // 変化通知
        this.notifyChange('cssVariable', { name, oldValue, newValue: value });
        
        console.log(`🔧 CSS変数設定: --${name} = ${cssValue}`, {
            oldValue,
            newValue: value,
            dynamicTransform: this.transforms.dynamic
        });
        
        return true;
    }
    
    /**
     * 複数のCSS変数を一括設定（バッチ最適化版）
     */
    setCSSVariables(variables) {
        if (!this.interactiveElement) {
            console.warn('⚠️ interactiveElementが見つかりません');
            return false;
        }
        
        if (this.optimizationSettings.batchUpdates) {
            return this.setCSSVariablesBatch(variables);
        }
        
        return this.setCSSVariablesImmediate(variables);
    }
    
    /**
     * バッチ処理版CSS変数設定
     */
    setCSSVariablesBatch(variables) {
        const oldValues = { ...this.cssVariables };
        
        // ペンディング更新にマージ
        Object.entries(variables).forEach(([name, value]) => {
            this.pendingUpdates.cssVariables[name] = value;
            this.cssVariables[name] = value;  // 内部状態は即座に更新
        });
        
        this.pendingUpdates.hasPending = true;
        
        // バッチ処理をスケジュール
        if (this.pendingUpdates.batchTimeout) {
            clearTimeout(this.pendingUpdates.batchTimeout);
        }
        
        this.pendingUpdates.batchTimeout = setTimeout(() => {
            this.flushBatchedUpdates(oldValues);
        }, 0);  // 次のイベントループで実行
        
        return true;
    }
    
    /**
     * 即座処理版CSS変数設定（フォールバック）
     */
    setCSSVariablesImmediate(variables) {
        const oldValues = { ...this.cssVariables };
        
        // DocumentFragment使用でDOM操作を最適化
        const style = this.interactiveElement.style;
        
        // 値を更新
        Object.entries(variables).forEach(([name, value]) => {
            this.cssVariables[name] = value;
        });
        
        // CSS変数をまとめてDOM適用
        Object.entries(variables).forEach(([name, value]) => {
            const cssValue = this.formatCSSValue(name, value);
            style.setProperty(`--${name}`, cssValue);
        });
        
        // 一括更新
        this.updateDynamicTransform();
        this.updateMatrices();
        this.notifyChange('cssVariables', { oldValues, newValues: { ...this.cssVariables } });
        
        return true;
    }
    
    /**
     * バッチ更新のフラッシュ
     */
    flushBatchedUpdates(oldValues) {
        if (!this.pendingUpdates.hasPending) return;
        
        const startTime = performance.now();
        
        // DOM更新をバッチで実行
        Object.entries(this.pendingUpdates.cssVariables).forEach(([name, value]) => {
            const cssValue = this.formatCSSValue(name, value);
            this.interactiveElement.style.setProperty(`--${name}`, cssValue);
        });
        
        // Transform・Matrix一括更新
        this.updateDynamicTransform();
        this.updateMatrices();
        
        // 変化通知
        this.notifyChange('cssVariables', { 
            oldValues, 
            newValues: { ...this.cssVariables },
            batchInfo: {
                itemCount: Object.keys(this.pendingUpdates.cssVariables).length,
                duration: performance.now() - startTime
            }
        });
        
        // バッチクリア
        this.pendingUpdates.cssVariables = {};
        this.pendingUpdates.hasPending = false;
        this.pendingUpdates.batchTimeout = null;
        
        console.log(`🚀 バッチ更新完了 (${(performance.now() - startTime).toFixed(3)}ms)`);
    }
    
    /**
     * CSS値フォーマット（共通化）
     */
    formatCSSValue(name, value) {
        switch (name) {
            case 'tx':
            case 'ty':
                return value + 'px';
            case 'scale':
                return value.toString();
            case 'rotation':
                return value + 'deg';
            default:
                return value.toString();
        }
    }
    
    /**
     * Transform Matrix計算・更新（最適化版）
     */
    updateMatrices() {
        const startTime = this.optimizationSettings.cacheEnabled ? performance.now() : 0;
        
        try {
            let matricesChanged = false;
            
            // 静的Matrix（キャッシュチェック）
            if (!this.matrices.cache.staticValid || 
                this.transforms.static !== this.matrices.cache.lastStaticTransform) {
                
                this.matrices.static = this.parseTransformToMatrix(this.transforms.static);
                this.matrices.cache.staticValid = true;
                this.matrices.cache.lastStaticTransform = this.transforms.static;
                this.matrices.cache.combinedValid = false;  // 合成無効化
                matricesChanged = true;
            }
            
            // 動的Matrix（キャッシュチェック）
            if (!this.matrices.cache.dynamicValid || 
                this.transforms.dynamic !== this.matrices.cache.lastDynamicTransform) {
                
                this.matrices.dynamic = this.parseTransformToMatrix(this.transforms.dynamic);
                this.matrices.cache.dynamicValid = true;
                this.matrices.cache.lastDynamicTransform = this.transforms.dynamic;
                this.matrices.cache.combinedValid = false;  // 合成無効化
                matricesChanged = true;
            }
            
            // 合成Matrix（必要な場合のみ計算）
            if (!this.matrices.cache.combinedValid || matricesChanged) {
                this.matrices.combined = this.multiplyMatrices(this.matrices.static, this.matrices.dynamic);
                this.transforms.combined = this.matrixToTransformString(this.matrices.combined);
                this.matrices.cache.combinedValid = true;
                matricesChanged = true;
            }
            
            if (matricesChanged && this.optimizationSettings.cacheEnabled) {
                const duration = performance.now() - startTime;
                console.log(`📐 Transform Matrix更新完了 (${duration.toFixed(3)}ms)`, {
                    cacheHits: {
                        static: this.matrices.cache.staticValid && !matricesChanged,
                        dynamic: this.matrices.cache.dynamicValid && !matricesChanged,
                        combined: this.matrices.cache.combinedValid && !matricesChanged
                    }
                });
            }
            
        } catch (error) {
            console.error('❌ Transform Matrix計算エラー:', error);
            // キャッシュクリア
            this.clearMatrixCache();
        }
    }
    
    /**
     * Transform文字列をMatrixに変換（最適化版）
     */
    parseTransformToMatrix(transformString) {
        // デフォルトは単位行列
        if (!transformString || transformString === 'none') {
            return this.createIdentityMatrix();
        }
        
        // matrix()関数の直接解析（最適化）
        if (transformString.startsWith('matrix(')) {
            return this.parseMatrixFunction(transformString);
        }
        
        // transform関数を解析（既存方式）
        const transforms = this.parseTransformFunctions(transformString);
        
        if (transforms.length === 0) {
            return this.createIdentityMatrix();
        }
        
        // 単一transform関数の最適化パス
        if (transforms.length === 1) {
            return this.createTransformMatrix(transforms[0]);
        }
        
        // 複数transform関数の合成
        let matrix = this.createIdentityMatrix();
        transforms.forEach(transform => {
            const transformMatrix = this.createTransformMatrix(transform);
            matrix = this.multiplyMatrices(matrix, transformMatrix);
        });
        
        return matrix;
    }
    
    /**
     * matrix()関数の直接解析（高速化）
     */
    parseMatrixFunction(matrixString) {
        const match = matrixString.match(/matrix\(([^)]+)\)/);
        if (!match) {
            console.warn('⚠️ matrix()関数解析失敗:', matrixString);
            return this.createIdentityMatrix();
        }
        
        const values = match[1].split(',').map(v => parseFloat(v.trim()));
        if (values.length !== 6) {
            console.warn('⚠️ matrix()値の数が不正:', values.length);
            return this.createIdentityMatrix();
        }
        
        // 2D matrix → 4x4 matrix変換
        const [a, b, c, d, tx, ty] = values;
        return [
            a, b, 0, tx,
            c, d, 0, ty,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }
    
    /**
     * Transform関数文字列を解析
     */
    parseTransformFunctions(transformString) {
        const functions = [];
        const regex = /(\w+)\(([^)]+)\)/g;
        let match;
        
        while ((match = regex.exec(transformString)) !== null) {
            const [, name, argsString] = match;
            const args = argsString.split(',').map(arg => arg.trim());
            
            functions.push({
                name: name,
                args: args
            });
        }
        
        return functions;
    }
    
    /**
     * Transform関数からMatrix生成
     */
    createTransformMatrix(transform) {
        const { name, args } = transform;
        
        switch (name) {
            case 'translate':
                return this.createTranslateMatrix(
                    this.parseUnit(args[0] || '0'),
                    this.parseUnit(args[1] || '0')
                );
                
            case 'translateX':
                return this.createTranslateMatrix(this.parseUnit(args[0] || '0'), 0);
                
            case 'translateY':
                return this.createTranslateMatrix(0, this.parseUnit(args[0] || '0'));
                
            case 'scale':
                const scaleX = parseFloat(args[0] || '1');
                const scaleY = parseFloat(args[1] || args[0] || '1');
                return this.createScaleMatrix(scaleX, scaleY);
                
            case 'scaleX':
                return this.createScaleMatrix(parseFloat(args[0] || '1'), 1);
                
            case 'scaleY':
                return this.createScaleMatrix(1, parseFloat(args[0] || '1'));
                
            case 'rotate':
                return this.createRotateMatrix(this.parseAngle(args[0] || '0deg'));
                
            case 'matrix':
                // matrix(a, b, c, d, tx, ty)の6値形式
                if (args.length === 6) {
                    const [a, b, c, d, tx, ty] = args.map(v => parseFloat(v) || 0);
                    return [
                        a, b, 0, tx,
                        c, d, 0, ty,
                        0, 0, 1, 0,
                        0, 0, 0, 1
                    ];
                }
                break;
                
            case 'matrix3d':
                // matrix3d()の16値形式
                if (args.length === 16) {
                    return args.map(v => parseFloat(v) || 0);
                }
                break;
                
            default:
                console.warn('⚠️ 未対応のTransform関数:', name, args);
                return this.createIdentityMatrix();
        }
    }
    
    /**
     * 単位付き値を解析（px, %, em, rem対応）
     */
    parseUnit(value) {
        if (typeof value === 'number') return value;
        
        const match = value.match(/^(-?[\d.]+)(px|%|em|rem)?$/);
        if (!match) return 0;
        
        const number = parseFloat(match[1]);
        const unit = match[2] || 'px';
        
        // %の場合は親要素基準で計算（簡易実装）
        if (unit === '%') {
            // 親要素サイズ取得
            const parentRect = this.targetElement.parentElement?.getBoundingClientRect();
            if (parentRect) {
                return (number / 100) * Math.max(parentRect.width, parentRect.height);
            }
        }
        
        return number;
    }
    
    /**
     * 角度を解析（deg, rad対応）
     */
    parseAngle(value) {
        const match = value.match(/^(-?[\d.]+)(deg|rad)?$/);
        if (!match) return 0;
        
        const number = parseFloat(match[1]);
        const unit = match[2] || 'deg';
        
        return unit === 'rad' ? number : (number * Math.PI / 180);
    }
    
    /**
     * 4x4単位行列作成
     */
    createIdentityMatrix() {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }
    
    /**
     * 平行移動行列作成
     */
    createTranslateMatrix(tx, ty) {
        return [
            1, 0, 0, tx,
            0, 1, 0, ty,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }
    
    /**
     * スケール行列作成
     */
    createScaleMatrix(sx, sy) {
        return [
            sx, 0, 0, 0,
            0, sy, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }
    
    /**
     * 回転行列作成
     */
    createRotateMatrix(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        return [
            cos, -sin, 0, 0,
            sin, cos, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }
    
    /**
     * 4x4行列の乗算
     */
    multiplyMatrices(a, b) {
        const result = new Array(16);
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result[i * 4 + j] = 
                    a[i * 4 + 0] * b[0 * 4 + j] +
                    a[i * 4 + 1] * b[1 * 4 + j] +
                    a[i * 4 + 2] * b[2 * 4 + j] +
                    a[i * 4 + 3] * b[3 * 4 + j];
            }
        }
        
        return result;
    }
    
    /**
     * MatrixをTransform文字列に変換
     */
    matrixToTransformString(matrix) {
        // 2D Transformの場合は matrix() 関数を使用
        // matrix(a, b, c, d, tx, ty) = matrix3d(a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, tx, ty, 0, 1)
        
        const a = matrix[0];   // scaleX
        const b = matrix[1];   // skewY
        const c = matrix[4];   // skewX
        const d = matrix[5];   // scaleY
        const tx = matrix[3];  // translateX
        const ty = matrix[7];  // translateY
        
        // 小数点以下の精度制限（表示用）
        const precision = 6;
        const values = [a, b, c, d, tx, ty].map(val => 
            Math.round(val * Math.pow(10, precision)) / Math.pow(10, precision)
        );
        
        return `matrix(${values.join(', ')})`;
    }
    
    /**
     * 変化通知
     */
    notifyChange(type, data) {
        const event = {
            type,
            data,
            timestamp: performance.now(),
            transforms: { ...this.transforms },
            cssVariables: { ...this.cssVariables },
            matrices: {
                static: [...this.matrices.static],
                dynamic: [...this.matrices.dynamic],
                combined: [...this.matrices.combined]
            }
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
     * 変化監視コールバック登録
     */
    onChange(callback) {
        this.changeCallbacks.add(callback);
        return () => this.changeCallbacks.delete(callback);
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
        return [...this.matrices.combined];
    }
    
    /**
     * 現在の状態取得
     */
    getState() {
        return {
            transforms: { ...this.transforms },
            cssVariables: { ...this.cssVariables },
            matrices: {
                static: [...this.matrices.static],
                dynamic: [...this.matrices.dynamic],
                combined: [...this.matrices.combined]
            },
            isActive: this.isActive
        };
    }
    
    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            targetElement: this.getElementInfo(this.targetElement),
            interactiveElement: this.interactiveElement ? this.getElementInfo(this.interactiveElement) : null,
            state: this.getState(),
            changeCallbacks: this.changeCallbacks.size
        };
    }
    
    /**
     * 要素情報取得（デバッグ用）
     */
    getElementInfo(element) {
        if (!element) return null;
        
        return {
            tag: element.tagName,
            id: element.id || 'none',
            class: element.className || 'none',
            computedTransform: getComputedStyle(element).transform
        };
    }
    
    /**
     * Matrix キャッシュクリア
     */
    clearMatrixCache() {
        this.matrices.cache.staticValid = false;
        this.matrices.cache.dynamicValid = false;
        this.matrices.cache.combinedValid = false;
        this.matrices.cache.lastStaticTransform = null;
        this.matrices.cache.lastDynamicTransform = null;
        
        console.log('🗑️ Matrix キャッシュクリア完了');
    }
    
    /**
     * 最適化設定変更
     */
    setOptimizationSettings(settings) {
        this.optimizationSettings = { ...this.optimizationSettings, ...settings };
        
        console.log('⚙️ 最適化設定更新:', this.optimizationSettings);
        
        // バッチ処理無効時は保留中の更新をフラッシュ
        if (!settings.batchUpdates && this.pendingUpdates.hasPending) {
            this.flushBatchedUpdates({});
        }
    }
    
    /**
     * パフォーマンス統計取得
     */
    getPerformanceStats() {
        return {
            optimizationSettings: this.optimizationSettings,
            cache: {
                staticValid: this.matrices.cache.staticValid,
                dynamicValid: this.matrices.cache.dynamicValid,
                combinedValid: this.matrices.cache.combinedValid,
                age: performance.now() - (this.matrices.cache.lastUpdate || 0)
            },
            pendingUpdates: {
                count: Object.keys(this.pendingUpdates.cssVariables).length,
                hasPending: this.pendingUpdates.hasPending
            }
        };
    }
    
    /**
     * クリーンアップ
     */
    cleanup() {
        // 保留中のバッチ更新をクリア
        if (this.pendingUpdates.batchTimeout) {
            clearTimeout(this.pendingUpdates.batchTimeout);
            this.pendingUpdates.batchTimeout = null;
        }
        
        // キャッシュクリア
        this.clearMatrixCache();
        
        this.changeCallbacks.clear();
        this.isActive = false;
        
        console.log('🧹 ElementObserverTransform クリーンアップ完了');
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.ElementObserverTransform = ElementObserverTransform;
}