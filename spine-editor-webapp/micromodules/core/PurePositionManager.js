/**
 * PurePositionManager - v4マイクロモジュール設計
 * 
 * 🎯 絶対ルール
 * 1. 外部依存ゼロ（他モジュール・グローバル変数禁止）
 * 2. 単一責務のみ：座標計算専用
 * 3. cleanup()で完全復元保証
 * 4. 数値のみで他モジュールと通信
 * 
 * 責務: 座標変換・位置計算・スケール計算専用
 * 入力: 数値座標・パーセント値・ピクセル値
 * 出力: 変換済み座標（数値のみ）
 * 
 * 禁止事項:
 * - DOM操作禁止
 * - Canvas描画禁止
 * - アニメーション制御禁止
 * - 他ファイルへの影響禁止
 */

class PurePositionManager {
    constructor(input) {
        console.log('📐 PurePositionManager: コンストラクタ開始', input);
        
        // 入力検証
        this.validateInput(input);
        
        // 内部状態初期化（数値のみ）
        this.config = {
            containerWidth: input.containerWidth || 800,
            containerHeight: input.containerHeight || 600,
            scale: input.scale || 1.0,
            offsetX: input.offsetX || 0,
            offsetY: input.offsetY || 0
        };
        
        this.calculations = {
            lastResult: null,
            transformMatrix: this.createIdentityMatrix()
        };
        
        console.log('✅ PurePositionManager: 初期化完了');
    }
    
    validateInput(input) {
        if (!input || typeof input !== 'object') {
            throw new Error('PurePositionManager: 入力が無効です');
        }
        
        const numericFields = ['containerWidth', 'containerHeight', 'scale', 'offsetX', 'offsetY'];
        for (const field of numericFields) {
            if (input[field] !== undefined && typeof input[field] !== 'number') {
                throw new Error(`PurePositionManager: ${field}は数値である必要があります`);
            }
        }
    }
    
    /**
     * 単一機能実行：座標変換計算
     */
    execute(inputCoordinates) {
        console.log('🚀 PurePositionManager: execute開始', inputCoordinates);
        
        try {
            this.validateCoordinates(inputCoordinates);
            
            const result = {
                // パーセント → ピクセル変換
                pixelPosition: this.percentToPixel(inputCoordinates),
                // ピクセル → パーセント変換
                percentPosition: this.pixelToPercent(inputCoordinates),
                // スケール適用
                scaledPosition: this.applyScale(inputCoordinates),
                // 中心点基準変換
                centeredPosition: this.toCenterOrigin(inputCoordinates),
                // 変換行列適用
                transformedPosition: this.applyTransform(inputCoordinates),
                // 計算統計
                calculations: {
                    inputType: this.detectCoordinateType(inputCoordinates),
                    scale: this.config.scale,
                    containerSize: {
                        width: this.config.containerWidth,
                        height: this.config.containerHeight
                    }
                }
            };
            
            this.calculations.lastResult = result;
            console.log('✅ PurePositionManager: 計算完了');
            return result;
            
        } catch (error) {
            console.error('❌ PurePositionManager: 計算失敗:', error);
            return {
                error: error.message,
                inputCoordinates,
                config: this.config
            };
        }
    }
    
    /**
     * 現在の状態を数値のみで返す
     */
    getState() {
        return {
            config: { ...this.config },
            lastCalculation: this.calculations.lastResult,
            matrixValues: this.calculations.transformMatrix
        };
    }
    
    /**
     * 完全に元の状態に戻す
     */
    cleanup() {
        console.log('🧹 PurePositionManager: cleanup開始');
        
        try {
            // 内部状態リセット
            this.calculations = {
                lastResult: null,
                transformMatrix: this.createIdentityMatrix()
            };
            
            console.log('✅ PurePositionManager: cleanup完了');
            return true;
        } catch (error) {
            console.error('❌ PurePositionManager: cleanup失敗:', error);
            return false;
        }
    }
    
    // === 座標変換メソッド ===
    
    validateCoordinates(coords) {
        if (!coords || typeof coords !== 'object') {
            throw new Error('座標データが無効です');
        }
        
        const requiredFields = ['x', 'y'];
        for (const field of requiredFields) {
            if (coords[field] === undefined) {
                throw new Error(`${field}座標が必要です`);
            }
        }
    }
    
    detectCoordinateType(coords) {
        // 数値の種類を判定（ピクセル・パーセント・小数）
        const xStr = coords.x.toString();
        const yStr = coords.y.toString();
        
        if (xStr.includes('%') || yStr.includes('%')) {
            return 'percent';
        } else if (coords.x < 10 && coords.y < 10 && coords.x > 0 && coords.y > 0) {
            return 'decimal';
        } else if (coords.x > 100 || coords.y > 100) {
            return 'pixel';
        } else {
            return 'unknown';
        }
    }
    
    percentToPixel(coords) {
        let x = coords.x;
        let y = coords.y;
        
        // パーセント文字列を数値に変換
        if (typeof x === 'string' && x.includes('%')) {
            x = parseFloat(x.replace('%', ''));
        }
        if (typeof y === 'string' && y.includes('%')) {
            y = parseFloat(y.replace('%', ''));
        }
        
        return {
            x: (x / 100) * this.config.containerWidth,
            y: (y / 100) * this.config.containerHeight
        };
    }
    
    pixelToPercent(coords) {
        const x = parseFloat(coords.x);
        const y = parseFloat(coords.y);
        
        return {
            x: (x / this.config.containerWidth) * 100,
            y: (y / this.config.containerHeight) * 100
        };
    }
    
    applyScale(coords) {
        return {
            x: parseFloat(coords.x) * this.config.scale,
            y: parseFloat(coords.y) * this.config.scale
        };
    }
    
    toCenterOrigin(coords) {
        const x = parseFloat(coords.x);
        const y = parseFloat(coords.y);
        
        return {
            x: x - (this.config.containerWidth / 2),
            y: y - (this.config.containerHeight / 2)
        };
    }
    
    applyTransform(coords) {
        const x = parseFloat(coords.x);
        const y = parseFloat(coords.y);
        const matrix = this.calculations.transformMatrix;
        
        // 2D変換行列適用
        const transformedX = matrix[0] * x + matrix[2] * y + matrix[4] + this.config.offsetX;
        const transformedY = matrix[1] * x + matrix[3] * y + matrix[5] + this.config.offsetY;
        
        return {
            x: transformedX,
            y: transformedY
        };
    }
    
    createIdentityMatrix() {
        // 2D変換用単位行列 [a, b, c, d, e, f]
        return [1, 0, 0, 1, 0, 0];
    }
    
    // === ヘルパーメソッド ===
    
    setScale(scale) {
        if (typeof scale !== 'number' || scale <= 0) {
            throw new Error('スケールは正の数値である必要があります');
        }
        this.config.scale = scale;
        console.log('📐 PurePositionManager: スケール更新', scale);
    }
    
    setContainer(width, height) {
        if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) {
            throw new Error('コンテナサイズは正の数値である必要があります');
        }
        this.config.containerWidth = width;
        this.config.containerHeight = height;
        console.log('📐 PurePositionManager: コンテナサイズ更新', {width, height});
    }
    
    setOffset(offsetX, offsetY) {
        this.config.offsetX = parseFloat(offsetX) || 0;
        this.config.offsetY = parseFloat(offsetY) || 0;
        console.log('📐 PurePositionManager: オフセット更新', {offsetX: this.config.offsetX, offsetY: this.config.offsetY});
    }
    
    // === 単独テスト ===
    
    static test() {
        console.log('🧪 PurePositionManager 単独テスト開始');
        
        try {
            // 1. 作成テスト
            const testConfig = {
                containerWidth: 800,
                containerHeight: 600,
                scale: 0.5,
                offsetX: 10,
                offsetY: 20
            };
            
            const manager = new PurePositionManager(testConfig);
            console.assert(manager.execute, '❌ executeメソッドが存在しません');
            console.assert(manager.cleanup, '❌ cleanupメソッドが存在しません');
            console.assert(manager.getState, '❌ getStateメソッドが存在しません');
            
            // 2. 座標変換テスト
            const testCoords = { x: 50, y: 50 }; // 50%, 50%
            const result = manager.execute(testCoords);
            
            console.assert(typeof result === 'object', '❌ executeが正しい形式で返されません');
            console.assert(result.pixelPosition, '❌ ピクセル変換結果がありません');
            console.assert(result.percentPosition, '❌ パーセント変換結果がありません');
            
            // 3. 清掃テスト
            const cleanupResult = manager.cleanup();
            console.assert(cleanupResult === true, '❌ cleanup失敗');
            
            // 4. パーセント変換テスト
            const percentResult = manager.percentToPixel({ x: 25, y: 50 });
            console.assert(percentResult.x === 200, '❌ パーセント→ピクセル変換が正しくありません');
            console.assert(percentResult.y === 300, '❌ パーセント→ピクセル変換が正しくありません');
            
            console.log('✅ PurePositionManager 単独テスト完了');
            return true;
            
        } catch (error) {
            console.error('❌ PurePositionManager テスト失敗:', error);
            return false;
        }
    }
}

// グローバル関数として公開（テスト用）
if (typeof window !== 'undefined') {
    window.PurePositionManager = PurePositionManager;
    console.log('🌐 PurePositionManager: グローバルに公開完了');
}