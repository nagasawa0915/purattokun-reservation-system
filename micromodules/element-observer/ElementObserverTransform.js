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
        
        // Transform Matrix管理
        this.matrices = {
            static: null,
            dynamic: null,
            combined: null
        };
        
        // 監視状態
        this.isActive = false;
        this.changeCallbacks = new Set();
        
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
     * 複数のCSS変数を一括設定
     */
    setCSSVariables(variables) {
        if (!this.interactiveElement) {
            console.warn('⚠️ interactiveElementが見つかりません');
            return false;
        }
        
        const oldValues = { ...this.cssVariables };
        
        // 値を更新（DOM適用は後でまとめて実行）
        Object.entries(variables).forEach(([name, value]) => {
            this.cssVariables[name] = value;
        });
        
        // CSS変数をまとめてDOM適用
        Object.entries(variables).forEach(([name, value]) => {
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
        });
        
        // 動的Transform更新
        this.updateDynamicTransform();
        
        // Matrix再計算
        this.updateMatrices();
        
        // 変化通知
        this.notifyChange('cssVariables', { oldValues, newValues: { ...this.cssVariables } });
        
        console.log('🔧 CSS変数一括設定完了:', {
            oldValues,
            newValues: { ...this.cssVariables },
            dynamicTransform: this.transforms.dynamic
        });
        
        return true;
    }
    
    /**
     * Transform Matrix計算・更新
     */
    updateMatrices() {
        try {
            // 静的Matrix（layout-anchor）
            this.matrices.static = this.parseTransformToMatrix(this.transforms.static);
            
            // 動的Matrix（interactive）
            this.matrices.dynamic = this.parseTransformToMatrix(this.transforms.dynamic);
            
            // 合成Matrix
            this.matrices.combined = this.multiplyMatrices(this.matrices.static, this.matrices.dynamic);
            
            // 合成Transform文字列更新
            this.transforms.combined = this.matrixToTransformString(this.matrices.combined);
            
            console.log('📐 Transform Matrix更新完了', {
                static: this.transforms.static,
                dynamic: this.transforms.dynamic,
                combined: this.transforms.combined
            });
            
        } catch (error) {
            console.error('❌ Transform Matrix計算エラー:', error);
        }
    }
    
    /**
     * Transform文字列をMatrixに変換
     */
    parseTransformToMatrix(transformString) {
        // デフォルトは単位行列
        let matrix = this.createIdentityMatrix();
        
        if (!transformString || transformString === 'none') {
            return matrix;
        }
        
        // transform関数を解析
        const transforms = this.parseTransformFunctions(transformString);
        
        transforms.forEach(transform => {
            const transformMatrix = this.createTransformMatrix(transform);
            matrix = this.multiplyMatrices(matrix, transformMatrix);
        });
        
        return matrix;
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
                
            default:
                console.warn('⚠️ 未対応のTransform関数:', name);
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
     * クリーンアップ
     */
    cleanup() {
        this.changeCallbacks.clear();
        this.isActive = false;
        
        console.log('🧹 ElementObserverTransform クリーンアップ完了');
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.ElementObserverTransform = ElementObserverTransform;
}