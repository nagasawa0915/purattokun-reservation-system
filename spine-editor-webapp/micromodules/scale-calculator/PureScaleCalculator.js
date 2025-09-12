/**
 * PureScaleCalculator - ElementObserver Phase 3-B Micromodule
 * 
 * 責務: スケール値計算のみ
 * 依存: なし（純粋な数値計算のみ）
 * 禁止: DOM操作、環境監視、UI機能、外部ライブラリ
 * 
 * @version 1.0.0
 * @author Claude Code
 * @date 2025-08-29
 */

class PureScaleCalculator {
    /**
     * コンストラクタ - 基準値設定・計算パラメータ初期化
     * @param {Object} options - 設定オプション
     * @param {number} options.defaultBaseScale - デフォルトベーススケール値（デフォルト: 1.0）
     * @param {number} options.minScale - 最小スケール制限（デフォルト: 0.1）
     * @param {number} options.maxScale - 最大スケール制限（デフォルト: 10.0）
     * @param {number} options.epsilon - 数値誤差許容範囲（デフォルト: 1e-6）
     */
    constructor(options = {}) {
        // 基本設定
        this.defaultBaseScale = options.defaultBaseScale || 1.0;
        this.minScale = options.minScale || 0.1;
        this.maxScale = options.maxScale || 10.0;
        this.epsilon = options.epsilon || 1e-6;
        
        // 基準値保存（初回計算用）
        this.referenceData = {
            size: null,           // 基準サイズ（width または height）
            fontSize: null,       // 基準フォントサイズ
            imageArea: null,      // 基準画像面積
            timestamp: Date.now() // 基準値設定タイムスタンプ
        };
        
        // 計算精度保証フラグ
        this.initialized = true;
        
        // サポートモード定義
        this.supportedModes = ['fixed', 'proportional', 'fontSize', 'imageSize', 'custom'];
    }
    
    /**
     * スケール値計算 - メイン計算処理
     * @param {Object} rect - 矩形データ {x, y, width, height}
     * @param {string} mode - スケールモード
     * @param {Object} options - 計算オプション
     * @returns {Object} {scale: number, ratio: number, mode: string}
     */
    calculate(rect, mode, options = {}) {
        // 入力バリデーション
        if (!this._validateRect(rect)) {
            throw new Error('PureScaleCalculator: Invalid rect data');
        }
        
        if (!this.supportedModes.includes(mode)) {
            throw new Error(`PureScaleCalculator: Unsupported mode '${mode}'. Supported: ${this.supportedModes.join(', ')}`);
        }
        
        // デフォルトオプション設定
        const calcOptions = {
            baseScale: options.baseScale || this.defaultBaseScale,
            scaleRatio: options.scaleRatio || 1.0,
            referenceSize: options.referenceSize || null,
            referenceFontSize: options.referenceFontSize || null,
            referenceArea: options.referenceArea || null,
            customFunction: options.customFunction || null,
            minScale: options.minScale || this.minScale,
            maxScale: options.maxScale || this.maxScale,
            ...options
        };
        
        // モード別計算実行
        let scale, ratio;
        
        switch (mode) {
            case 'fixed':
                ({ scale, ratio } = this._calculateFixed(rect, calcOptions));
                break;
            case 'proportional':
                ({ scale, ratio } = this._calculateProportional(rect, calcOptions));
                break;
            case 'fontSize':
                ({ scale, ratio } = this._calculateFontSize(rect, calcOptions));
                break;
            case 'imageSize':
                ({ scale, ratio } = this._calculateImageSize(rect, calcOptions));
                break;
            case 'custom':
                ({ scale, ratio } = this._calculateCustom(rect, calcOptions));
                break;
            default:
                throw new Error(`PureScaleCalculator: Mode '${mode}' not implemented`);
        }
        
        // スケール制限適用
        scale = this._clampScale(scale, calcOptions.minScale, calcOptions.maxScale);
        
        // 結果検証
        if (!this._isValidNumber(scale) || !this._isValidNumber(ratio)) {
            throw new Error('PureScaleCalculator: Invalid calculation result');
        }
        
        return {
            scale: scale,
            ratio: ratio,
            mode: mode,
            timestamp: Date.now(),
            clipped: scale !== this._clampScale(scale, -Infinity, Infinity) // 制限適用されたかどうか
        };
    }
    
    /**
     * 基準値設定（初回計算用）
     * @param {Object} referenceData - 基準値データ
     */
    setReference(referenceData) {
        if (referenceData.size !== undefined) {
            this.referenceData.size = referenceData.size;
        }
        if (referenceData.fontSize !== undefined) {
            this.referenceData.fontSize = referenceData.fontSize;
        }
        if (referenceData.imageArea !== undefined) {
            this.referenceData.imageArea = referenceData.imageArea;
        }
        this.referenceData.timestamp = Date.now();
    }
    
    /**
     * 利用可能モード一覧
     * @returns {Array<string>} サポートされるスケールモード
     */
    getSupportedModes() {
        return [...this.supportedModes]; // 配列のコピーを返す
    }
    
    // ========================================
    // モード別計算処理（private）
    // ========================================
    
    /**
     * fixed（固定スケール）計算
     * @param {Object} rect - 矩形データ
     * @param {Object} options - 計算オプション
     * @returns {Object} {scale, ratio}
     */
    _calculateFixed(rect, options) {
        const scale = options.baseScale;
        const ratio = 1.0; // 固定スケールは比率1.0
        
        return { scale, ratio };
    }
    
    /**
     * proportional（比例スケール）計算
     * @param {Object} rect - 矩形データ
     * @param {Object} options - 計算オプション
     * @returns {Object} {scale, ratio}
     */
    _calculateProportional(rect, options) {
        let currentSize;
        let referenceSize;
        
        // 基準サイズ決定（width優先、なければheight）
        if (options.sizeDimension === 'height') {
            currentSize = rect.height;
            referenceSize = options.referenceSize !== undefined ? options.referenceSize : (this.referenceData.size || rect.height);
        } else {
            currentSize = rect.width;
            referenceSize = options.referenceSize !== undefined ? options.referenceSize : (this.referenceData.size || rect.width);
        }
        
        // ゼロ割り防止
        if (Math.abs(referenceSize) < this.epsilon) {
            throw new Error('PureScaleCalculator: Reference size is zero or too small');
        }
        
        // 比例計算
        const ratio = currentSize / referenceSize;
        const scale = options.baseScale * ratio * options.scaleRatio;
        
        return { scale, ratio };
    }
    
    /**
     * fontSize（フォントサイズ連動）計算
     * @param {Object} rect - 矩形データ
     * @param {Object} options - 計算オプション
     * @returns {Object} {scale, ratio}
     */
    _calculateFontSize(rect, options) {
        const currentFontSize = options.currentFontSize;
        const referenceFontSize = options.referenceFontSize || this.referenceData.fontSize;
        
        // フォントサイズ情報の検証
        if (!this._isValidNumber(currentFontSize) || currentFontSize <= 0) {
            throw new Error('PureScaleCalculator: Invalid or missing currentFontSize');
        }
        
        if (!this._isValidNumber(referenceFontSize) || referenceFontSize <= 0) {
            throw new Error('PureScaleCalculator: Invalid or missing referenceFontSize');
        }
        
        // フォントサイズ比例計算
        const ratio = currentFontSize / referenceFontSize;
        const scale = options.baseScale * ratio * options.scaleRatio;
        
        return { scale, ratio };
    }
    
    /**
     * imageSize（画像サイズ連動）計算
     * @param {Object} rect - 矩形データ
     * @param {Object} options - 計算オプション
     * @returns {Object} {scale, ratio}
     */
    _calculateImageSize(rect, options) {
        const currentArea = rect.width * rect.height;
        const referenceArea = options.referenceArea || this.referenceData.imageArea;
        
        // 面積の検証
        if (currentArea <= 0) {
            throw new Error('PureScaleCalculator: Invalid image area (zero or negative)');
        }
        
        if (!this._isValidNumber(referenceArea) || referenceArea <= 0) {
            throw new Error('PureScaleCalculator: Invalid or missing referenceArea');
        }
        
        // 面積比例計算（平方根を使用してアスペクト比を考慮）
        const areaRatio = currentArea / referenceArea;
        const ratio = Math.sqrt(areaRatio); // 面積の平方根で線形スケール換算
        const scale = options.baseScale * ratio * options.scaleRatio;
        
        return { scale, ratio };
    }
    
    /**
     * custom（カスタム関数）計算
     * @param {Object} rect - 矩形データ
     * @param {Object} options - 計算オプション
     * @returns {Object} {scale, ratio}
     */
    _calculateCustom(rect, options) {
        if (typeof options.customFunction !== 'function') {
            throw new Error('PureScaleCalculator: customFunction is required for custom mode');
        }
        
        try {
            // カスタム関数実行（純粋な数値計算のみ許可）
            const result = options.customFunction(rect, options);
            
            // カスタム関数の戻り値検証
            if (typeof result === 'number') {
                // 数値のみ返される場合
                return {
                    scale: result,
                    ratio: result / options.baseScale
                };
            } else if (result && typeof result === 'object') {
                // オブジェクト形式で返される場合
                const scale = result.scale || result.value || options.baseScale;
                const ratio = result.ratio || (scale / options.baseScale);
                return { scale, ratio };
            } else {
                throw new Error('PureScaleCalculator: Invalid custom function return type');
            }
        } catch (error) {
            throw new Error(`PureScaleCalculator: Custom function error: ${error.message}`);
        }
    }
    
    // ========================================
    // ユーティリティ・バリデーション（private）
    // ========================================
    
    /**
     * 矩形データ検証
     * @param {Object} rect - 矩形データ
     * @returns {boolean} 有効性
     */
    _validateRect(rect) {
        if (!rect || typeof rect !== 'object') return false;
        
        const requiredProps = ['x', 'y', 'width', 'height'];
        for (const prop of requiredProps) {
            if (!this._isValidNumber(rect[prop])) return false;
        }
        
        // サイズは正の値である必要がある
        if (rect.width <= 0 || rect.height <= 0) return false;
        
        return true;
    }
    
    /**
     * 有効な数値チェック - 強化版
     * @param {*} value - チェック対象値
     * @returns {boolean} 有効性
     */
    _isValidNumber(value) {
        if (typeof value !== 'number') return false;
        if (isNaN(value)) return false;
        if (!isFinite(value)) return false;
        // 追加チェック: -0は0として扱う
        if (Object.is(value, -0)) return true;
        return true;
    }
    
    /**
     * スケール値制限適用
     * @param {number} scale - スケール値
     * @param {number} min - 最小値
     * @param {number} max - 最大値
     * @returns {number} 制限適用後の値
     */
    _clampScale(scale, min, max) {
        return Math.max(min, Math.min(max, scale));
    }
    
    // ========================================
    // テスト・品質保証メソッド（static）
    // ========================================
    
    /**
     * 計算精度テスト・境界値テスト
     * @returns {Object} テスト結果
     */
    static test() {
        console.log('🧪 PureScaleCalculator 単独テスト開始');
        
        const testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
        
        const calculator = new PureScaleCalculator({
            defaultBaseScale: 1.0,
            minScale: 0.1,
            maxScale: 10.0
        });
        
        // テストヘルパー
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
                console.error(`❌ Stack trace:`, error.stack);
            }
        };
        
        // 基本矩形データ
        const testRect = { x: 10, y: 20, width: 100, height: 200 };
        
        // 1. fixed モードテスト
        runTest('Fixed mode basic', () => {
            const result = calculator.calculate(testRect, 'fixed', { baseScale: 2.0 });
            if (Math.abs(result.scale - 2.0) > calculator.epsilon) {
                throw new Error(`Expected scale 2.0, got ${result.scale}`);
            }
            if (Math.abs(result.ratio - 1.0) > calculator.epsilon) {
                throw new Error(`Expected ratio 1.0, got ${result.ratio}`);
            }
        });
        
        // 2. proportional モードテスト
        runTest('Proportional mode basic', () => {
            const result = calculator.calculate(testRect, 'proportional', {
                baseScale: 1.0,
                referenceSize: 50, // testRect.width(100) / referenceSize(50) = ratio 2.0
                scaleRatio: 1.0
            });
            if (Math.abs(result.scale - 2.0) > calculator.epsilon) {
                throw new Error(`Expected scale 2.0, got ${result.scale}`);
            }
            if (Math.abs(result.ratio - 2.0) > calculator.epsilon) {
                throw new Error(`Expected ratio 2.0, got ${result.ratio}`);
            }
        });
        
        // 3. fontSize モードテスト
        runTest('FontSize mode basic', () => {
            const result = calculator.calculate(testRect, 'fontSize', {
                baseScale: 1.0,
                currentFontSize: 24,
                referenceFontSize: 16, // 24/16 = 1.5倍
                scaleRatio: 1.0
            });
            if (Math.abs(result.scale - 1.5) > calculator.epsilon) {
                throw new Error(`Expected scale 1.5, got ${result.scale}`);
            }
        });
        
        // 4. imageSize モードテスト
        runTest('ImageSize mode basic', () => {
            // testRect面積: 100*200 = 20000, 基準面積: 10000
            // 面積比: 20000/10000 = 2.0, sqrt(2.0) ≈ 1.414
            const result = calculator.calculate(testRect, 'imageSize', {
                baseScale: 1.0,
                referenceArea: 10000,
                scaleRatio: 1.0
            });
            const expectedScale = Math.sqrt(2.0);
            if (Math.abs(result.scale - expectedScale) > calculator.epsilon) {
                throw new Error(`Expected scale ${expectedScale}, got ${result.scale}`);
            }
        });
        
        // 5. custom モードテスト
        runTest('Custom mode basic', () => {
            const customFunction = (rect, options) => {
                return rect.width / 100; // width/100の簡単な計算
            };
            const result = calculator.calculate(testRect, 'custom', {
                baseScale: 1.0,
                customFunction: customFunction
            });
            if (Math.abs(result.scale - 1.0) > calculator.epsilon) {
                throw new Error(`Expected scale 1.0, got ${result.scale}`);
            }
        });
        
        // 6. スケール制限テスト
        runTest('Scale clamping', () => {
            // 最大値制限
            const result1 = calculator.calculate(testRect, 'fixed', {
                baseScale: 20.0, // maxScale(10.0)を超える
                maxScale: 10.0
            });
            if (Math.abs(result1.scale - 10.0) > calculator.epsilon) {
                throw new Error(`Expected clamped scale 10.0, got ${result1.scale}`);
            }
            
            // 最小値制限
            const result2 = calculator.calculate(testRect, 'fixed', {
                baseScale: 0.05, // minScale(0.1)を下回る
                minScale: 0.1
            });
            if (Math.abs(result2.scale - 0.1) > calculator.epsilon) {
                throw new Error(`Expected clamped scale 0.1, got ${result2.scale}`);
            }
        });
        
        // 7. エラーハンドリングテスト
        runTest('Invalid rect error', () => {
            try {
                calculator.calculate(null, 'fixed');
                throw new Error('Should have thrown error for null rect');
            } catch (error) {
                if (!error.message.includes('Invalid rect data')) {
                    throw new Error(`Unexpected error message: ${error.message}`);
                }
                // エラーが正しく投げられた = テスト成功
                return;
            }
        });
        
        runTest('Unsupported mode error', () => {
            try {
                calculator.calculate(testRect, 'unsupported');
                throw new Error('Should have thrown error for unsupported mode');
            } catch (error) {
                if (!error.message.includes('Unsupported mode')) {
                    throw new Error(`Unexpected error message: ${error.message}`);
                }
                // エラーが正しく投げられた = テスト成功
                return;
            }
        });
        
        // 8. 境界値テスト
        runTest('Zero reference size error', () => {
            try {
                calculator.calculate(testRect, 'proportional', {
                    referenceSize: 0
                });
                throw new Error('Should have thrown error for zero reference size');
            } catch (error) {
                if (error.message === 'Should have thrown error for zero reference size') {
                    throw error; // Re-throw if it's our test failure message
                }
                if (!error.message.includes('Reference size is zero or too small')) {
                    throw new Error(`Unexpected error message: ${error.message}`);
                }
                // エラーが正しく投げられた = テスト成功
                return;
            }
        });
        
        // 8.5. NaN値テスト
        runTest('NaN input handling', () => {
            try {
                const nanRect = { x: NaN, y: 20, width: 100, height: 200 };
                calculator.calculate(nanRect, 'fixed');
                throw new Error('Should have thrown error for NaN input');
            } catch (error) {
                if (!error.message.includes('Invalid rect data')) {
                    throw new Error(`Unexpected error message: ${error.message}`);
                }
                // エラーが正しく投げられた = テスト成功
                return;
            }
        });
        
        // 8.6. Infinity値テスト
        runTest('Infinity input handling', () => {
            try {
                const infinityRect = { x: 10, y: 20, width: Infinity, height: 200 };
                calculator.calculate(infinityRect, 'fixed');
                throw new Error('Should have thrown error for Infinity input');
            } catch (error) {
                if (!error.message.includes('Invalid rect data')) {
                    throw new Error(`Unexpected error message: ${error.message}`);
                }
                // エラーが正しく投げられた = テスト成功
                return;
            }
        });
        
        // 8.7. 負のサイズテスト
        runTest('Negative size handling', () => {
            try {
                const negativeRect = { x: 10, y: 20, width: -100, height: 200 };
                calculator.calculate(negativeRect, 'fixed');
                throw new Error('Should have thrown error for negative width');
            } catch (error) {
                if (!error.message.includes('Invalid rect data')) {
                    throw new Error(`Unexpected error message: ${error.message}`);
                }
                // エラーが正しく投げられた = テスト成功
                return;
            }
        });
        
        // 9. 基準値設定テスト
        runTest('Reference data setting', () => {
            const testCalc = new PureScaleCalculator(); // 別インスタンスでテスト
            testCalc.setReference({
                size: 150,
                fontSize: 18,
                imageArea: 15000
            });
            
            if (testCalc.referenceData.size !== 150) {
                throw new Error('Reference size not set correctly');
            }
            if (testCalc.referenceData.fontSize !== 18) {
                throw new Error('Reference fontSize not set correctly');
            }
            if (testCalc.referenceData.imageArea !== 15000) {
                throw new Error('Reference imageArea not set correctly');
            }
        });
        
        // 10. サポートモード一覧テスト
        runTest('Supported modes list', () => {
            const modes = calculator.getSupportedModes();
            const expectedModes = ['fixed', 'proportional', 'fontSize', 'imageSize', 'custom'];
            
            if (modes.length !== expectedModes.length) {
                throw new Error(`Expected ${expectedModes.length} modes, got ${modes.length}`);
            }
            
            for (const mode of expectedModes) {
                if (!modes.includes(mode)) {
                    throw new Error(`Missing mode: ${mode}`);
                }
            }
        });
        
        // 11. エッジケーステスト - ゼロスケール
        runTest('Zero scale result handling', () => {
            const result = calculator.calculate(testRect, 'fixed', {
                baseScale: 0,
                minScale: 0,
                maxScale: 10
            });
            if (result.scale !== 0) {
                throw new Error(`Expected zero scale, got ${result.scale}`);
            }
        });
        
        // 12. customモードオブジェクト返値テスト
        runTest('Custom mode object return', () => {
            const customFunction = (rect, options) => {
                console.log('Debug - Custom function called with options:', options);
                return { scale: 2.5, ratio: 1.5 };
            };
            
            // 専用のcalculatorインスタンスを作成して制限値を確実に設定
            const testCalc = new PureScaleCalculator({
                defaultBaseScale: 1.0,
                minScale: 0.0,    // より低い制限
                maxScale: 100.0,  // より高い制限
                epsilon: 1e-6
            });
            
            const result = testCalc.calculate(testRect, 'custom', {
                baseScale: 1.0,
                customFunction: customFunction
            });
            
            console.log('Debug - Custom mode result:', result);
            console.log('Debug - Expected scale: 2.5, Got:', result.scale);
            console.log('Debug - Expected ratio: 1.5, Got:', result.ratio);
            console.log('Debug - Calculator limits:', { min: testCalc.minScale, max: testCalc.maxScale });
            
            if (Math.abs(result.scale - 2.5) > testCalc.epsilon) {
                throw new Error(`Expected scale 2.5, got ${result.scale}, diff: ${Math.abs(result.scale - 2.5)}`);
            }
            if (Math.abs(result.ratio - 1.5) > testCalc.epsilon) {
                throw new Error(`Expected ratio 1.5, got ${result.ratio}, diff: ${Math.abs(result.ratio - 1.5)}`);
            }
        });
        
        // テスト結果まとめ
        console.log('\n📊 PureScaleCalculator テスト結果:');
        console.log(`   成功: ${testResults.passed}/${testResults.total}`);
        console.log(`   失敗: ${testResults.failed}/${testResults.total}`);
        
        if (testResults.failed > 0) {
            console.log('❌ 失敗したテストの詳細:');
            testResults.details.forEach(detail => {
                if (detail.startsWith('❌')) {
                    console.log(`   ${detail}`);
                }
            });
        }
        
        if (testResults.failed === 0) {
            console.log('🎉 全テスト成功！PureScaleCalculator は正常に動作しています。');
        } else {
            console.log('❌ テスト失敗があります。詳細を確認してください。');
        }
        
        return testResults;
    }
    
    /**
     * パフォーマンステスト
     * @param {number} iterations - テスト回数（デフォルト: 10000）
     * @returns {Object} パフォーマンス結果
     */
    static performanceTest(iterations = 10000) {
        console.log(`⚡ PureScaleCalculator パフォーマンステスト開始 (${iterations}回実行)`);
        
        const calculator = new PureScaleCalculator();
        const testRect = { x: 10, y: 20, width: 100, height: 200 };
        
        const modes = ['fixed', 'proportional', 'fontSize', 'imageSize'];
        const results = {};
        
        for (const mode of modes) {
            const startTime = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                let options = { baseScale: 1.0 };
                
                if (mode === 'proportional') {
                    options.referenceSize = 50;
                } else if (mode === 'fontSize') {
                    options.currentFontSize = 16;
                    options.referenceFontSize = 16;
                } else if (mode === 'imageSize') {
                    options.referenceArea = 10000;
                }
                
                calculator.calculate(testRect, mode, options);
            }
            
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / iterations;
            
            results[mode] = {
                totalTime: totalTime,
                avgTime: avgTime,
                opsPerSecond: Math.round(1000 / avgTime)
            };
            
            console.log(`   ${mode}: ${avgTime.toFixed(4)}ms/回, ${results[mode].opsPerSecond} ops/sec`);
        }
        
        console.log('⚡ パフォーマンステスト完了\n');
        
        return results;
    }
}

// モジュールエクスポート（環境対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PureScaleCalculator;
}
if (typeof window !== 'undefined') {
    window.PureScaleCalculator = PureScaleCalculator;
}

// 即座自己テスト実行（開発時）
if (typeof window !== 'undefined' && window.location && window.location.search.includes('test=scale')) {
    console.log('🚀 PureScaleCalculator 自動テスト実行中...');
    PureScaleCalculator.test();
    PureScaleCalculator.performanceTest(1000);
}

/**
 * ==========================================
 * 使用例・実装サンプル
 * ==========================================
 * 
 * // 基本的な使用方法
 * const calculator = new PureScaleCalculator({
 *     defaultBaseScale: 1.0,
 *     minScale: 0.1,
 *     maxScale: 5.0
 * });
 * 
 * // 矩形データ
 * const rect = { x: 0, y: 0, width: 200, height: 100 };
 * 
 * // 固定スケール
 * const fixedResult = calculator.calculate(rect, 'fixed', {
 *     baseScale: 1.5
 * });
 * 
 * // 比例スケール
 * const propResult = calculator.calculate(rect, 'proportional', {
 *     baseScale: 1.0,
 *     referenceSize: 100,  // 基準サイズ
 *     scaleRatio: 1.2      // 比例倍率
 * });
 * 
 * // フォントサイズ連動
 * const fontResult = calculator.calculate(rect, 'fontSize', {
 *     baseScale: 1.0,
 *     currentFontSize: 18,
 *     referenceFontSize: 16
 * });
 * 
 * // 画像サイズ連動
 * const imageResult = calculator.calculate(rect, 'imageSize', {
 *     baseScale: 1.0,
 *     referenceArea: 10000
 * });
 * 
 * // カスタム計算
 * const customResult = calculator.calculate(rect, 'custom', {
 *     baseScale: 1.0,
 *     customFunction: (rect, options) => {
 *         return Math.sqrt(rect.width * rect.height) / 100;
 *     }
 * });
 * 
 * // 基準値設定
 * calculator.setReference({
 *     size: 150,
 *     fontSize: 16,
 *     imageArea: 20000
 * });
 * 
 * // テスト実行
 * const testResults = PureScaleCalculator.test();
 * const perfResults = PureScaleCalculator.performanceTest(5000);
 * 
 ==========================================
 */