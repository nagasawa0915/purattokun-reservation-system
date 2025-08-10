// 🔍 Timeline リファクタリング検証・依存関係テスト
// 目的: 分割されたタイムラインファイルの動作確認・依存関係検証

console.log('🔍 Timeline リファクタリング検証開始');

/**
 * Timeline リファクタリング検証クラス
 * 分割後のファイル構造・依存関係・機能完全性をテスト
 */
class TimelineRefactoringValidator {
    constructor() {
        this.validationResults = {
            fileSizes: {},
            dependencies: {},
            functionality: {},
            overall: false
        };
        
        console.log('✅ Timeline リファクタリング検証 初期化完了');
    }
    
    /**
     * 全体検証実行
     */
    async runFullValidation() {
        console.log('🎯 全体検証実行開始');
        
        try {
            // 1. ファイルサイズ制限遵守確認
            this.validateFileSizes();
            
            // 2. 依存関係確認
            this.validateDependencies();
            
            // 3. 機能完全性確認
            this.validateFunctionality();
            
            // 4. 統合結果評価
            this.evaluateOverallResults();
            
            console.log('✅ 全体検証完了');
            return this.validationResults;
            
        } catch (error) {
            console.error('❌ 検証中にエラーが発生:', error);
            this.validationResults.overall = false;
            return this.validationResults;
        }
    }
    
    /**
     * ファイルサイズ制限遵守確認
     */
    validateFileSizes() {
        console.log('📏 ファイルサイズ制限確認');
        
        // 設計基準との比較
        const sizeRequirements = {
            'timeline-sequence-manager.js': { limit: 400, actual: 472 },
            'timeline-sequence-tests.js': { limit: 100, actual: 216 },
            'timeline-error-core.js': { limit: 200, actual: 254 },
            'timeline-diagnostics.js': { limit: 170, actual: 334 },
            'timeline-data-core.js': { limit: 250, actual: 273 },
            'timeline-compatibility.js': { limit: 60, actual: 68 }
        };
        
        let allCompliant = true;
        
        Object.entries(sizeRequirements).forEach(([filename, requirements]) => {
            const compliant = requirements.actual <= requirements.limit;
            this.validationResults.fileSizes[filename] = {
                limit: requirements.limit,
                actual: requirements.actual,
                compliant: compliant,
                status: compliant ? '✅ 制限内' : '❌ 制限超過'
            };
            
            if (!compliant) {
                allCompliant = false;
                console.warn(`⚠️ ${filename}: ${requirements.actual}行 (制限: ${requirements.limit}行)`);
            } else {
                console.log(`✅ ${filename}: ${requirements.actual}行 (制限: ${requirements.limit}行)`);
            }
        });
        
        this.validationResults.fileSizes.overall = allCompliant;
        console.log(`📏 ファイルサイズ制限確認結果: ${allCompliant ? '✅ 全て遵守' : '❌ 違反あり'}`);
    }
    
    /**
     * 依存関係確認
     */
    validateDependencies() {
        console.log('🔗 依存関係確認');
        
        const dependencies = {
            'TimelineErrorHandler': {
                expected: 'timeline-error-core.js',
                found: !!window.TimelineErrorHandler,
                extended: false
            },
            'TimelineDiagnostics': {
                expected: 'timeline-diagnostics.js',
                found: false, // 内部クラスなので直接確認困難
                extended: false
            },
            'TimelineDataManager': {
                expected: 'timeline-data-core.js',
                found: !!window.TimelineDataManager,
                extended: false
            },
            'TimelineCompatibility': {
                expected: 'timeline-compatibility.js',
                found: false, // 内部クラスなので直接確認困難
                extended: false
            },
            'TimelineSequence': {
                expected: 'timeline-sequence-manager.js',
                found: !!window.TimelineSequence,
                extended: false
            }
        };
        
        // 拡張機能確認
        if (window.TimelineErrorHandler) {
            dependencies.TimelineErrorHandler.extended = 
                typeof window.TimelineErrorHandler.attemptCoordinateRecovery === 'function';
        }
        
        if (window.TimelineDataManager) {
            dependencies.TimelineDataManager.extended = 
                typeof window.TimelineDataManager.maintainSystemCompatibility === 'function';
        }
        
        let dependenciesValid = true;
        Object.entries(dependencies).forEach(([name, info]) => {
            const valid = info.found;
            this.validationResults.dependencies[name] = {
                ...info,
                valid: valid,
                status: valid ? '✅ 利用可能' : '❌ 未確認'
            };
            
            if (!valid && !name.includes('Diagnostics') && !name.includes('Compatibility')) {
                dependenciesValid = false;
            }
        });
        
        this.validationResults.dependencies.overall = dependenciesValid;
        console.log(`🔗 依存関係確認結果: ${dependenciesValid ? '✅ 正常' : '❌ 問題あり'}`);
    }
    
    /**
     * 機能完全性確認
     */
    validateFunctionality() {
        console.log('⚙️ 機能完全性確認');
        
        const functionalityTests = {
            errorHandling: this.testErrorHandling(),
            dataManagement: this.testDataManagement(),
            sequenceCreation: this.testSequenceCreation(),
            debugSupport: this.testDebugSupport()
        };
        
        const allFunctional = Object.values(functionalityTests).every(test => test.passed);
        
        this.validationResults.functionality = {
            ...functionalityTests,
            overall: allFunctional
        };
        
        console.log(`⚙️ 機能完全性確認結果: ${allFunctional ? '✅ 完全' : '❌ 不完全'}`);
    }
    
    /**
     * エラーハンドリング機能テスト
     */
    testErrorHandling() {
        try {
            if (!window.TimelineErrorHandler) {
                return { passed: false, reason: 'TimelineErrorHandler未確認' };
            }
            
            // 基本機能確認
            const hasBasicMethods = [
                'handleCoordinateSystemError',
                'handleDataLoadError',
                'handleIntegrationError',
                'logError'
            ].every(method => typeof window.TimelineErrorHandler[method] === 'function');
            
            // 拡張機能確認（diagnostics読み込み後）
            const hasExtendedMethods = [
                'attemptCoordinateRecovery',
                'getErrorStats'
            ].every(method => typeof window.TimelineErrorHandler[method] === 'function');
            
            return {
                passed: hasBasicMethods,
                extended: hasExtendedMethods,
                details: `基本機能: ${hasBasicMethods ? '✅' : '❌'}, 拡張機能: ${hasExtendedMethods ? '✅' : '❌'}`
            };
            
        } catch (error) {
            return { passed: false, reason: error.message };
        }
    }
    
    /**
     * データ管理機能テスト
     */
    testDataManagement() {
        try {
            if (!window.TimelineDataManager) {
                return { passed: false, reason: 'TimelineDataManager未確認' };
            }
            
            const hasBasicMethods = [
                'loadTimelineState',
                'saveTimelineState',
                'diagnosisStorage'
            ].every(method => typeof window.TimelineDataManager[method] === 'function');
            
            const hasExtendedMethods = [
                'maintainSystemCompatibility'
            ].every(method => typeof window.TimelineDataManager[method] === 'function');
            
            return {
                passed: hasBasicMethods,
                extended: hasExtendedMethods,
                details: `基本機能: ${hasBasicMethods ? '✅' : '❌'}, 拡張機能: ${hasExtendedMethods ? '✅' : '❌'}`
            };
            
        } catch (error) {
            return { passed: false, reason: error.message };
        }
    }
    
    /**
     * シーケンス作成機能テスト
     */
    testSequenceCreation() {
        try {
            if (!window.TimelineSequence) {
                return { passed: false, reason: 'TimelineSequence未確認' };
            }
            
            // テストシーケンス作成関数確認
            const hasTestFunction = typeof window.createTestTimelineSequence === 'function';
            
            // 基本シーケンス作成テスト
            let creationTest = false;
            try {
                const testConfig = {
                    id: 'validation_test',
                    name: 'Validation Test Sequence',
                    duration: 1000,
                    keyframes: [
                        { time: 0, animation: 'test' }
                    ]
                };
                
                const sequence = new window.TimelineSequence('test-character', testConfig);
                creationTest = !!sequence && sequence.sequenceId === 'validation_test';
                
            } catch (error) {
                console.warn('⚠️ シーケンス作成テストエラー:', error);
            }
            
            return {
                passed: creationTest,
                testFunction: hasTestFunction,
                details: `シーケンス作成: ${creationTest ? '✅' : '❌'}, テスト関数: ${hasTestFunction ? '✅' : '❌'}`
            };
            
        } catch (error) {
            return { passed: false, reason: error.message };
        }
    }
    
    /**
     * デバッグサポート機能テスト
     */
    testDebugSupport() {
        try {
            const debugFunctions = [
                'debugTimelineErrors',
                'debugTimelineStorage',
                'createTestTimelineSequence'
            ];
            
            const availableFunctions = debugFunctions.filter(funcName => 
                typeof window[funcName] === 'function'
            );
            
            return {
                passed: availableFunctions.length >= 2, // 最低2つは必要
                available: availableFunctions.length,
                total: debugFunctions.length,
                details: `利用可能: ${availableFunctions.join(', ')}`
            };
            
        } catch (error) {
            return { passed: false, reason: error.message };
        }
    }
    
    /**
     * 統合結果評価
     */
    evaluateOverallResults() {
        const results = this.validationResults;
        
        const fileSizesOK = results.fileSizes.overall;
        const dependenciesOK = results.dependencies.overall;
        const functionalityOK = results.functionality.overall;
        
        results.overall = fileSizesOK && dependenciesOK && functionalityOK;
        
        console.log('📊 統合評価結果:');
        console.log(`  - ファイルサイズ制限: ${fileSizesOK ? '✅' : '❌'}`);
        console.log(`  - 依存関係: ${dependenciesOK ? '✅' : '❌'}`);
        console.log(`  - 機能完全性: ${functionalityOK ? '✅' : '❌'}`);
        console.log(`  - 総合評価: ${results.overall ? '✅ 成功' : '❌ 要修正'}`);
    }
    
    /**
     * 検証結果レポート表示
     */
    showValidationReport() {
        console.log('\n' + '='.repeat(60));
        console.log('🎯 Timeline リファクタリング検証レポート');
        console.log('='.repeat(60));
        
        // ファイルサイズレポート
        console.log('\n📏 ファイルサイズ制限遵守状況:');
        Object.entries(this.validationResults.fileSizes).forEach(([filename, info]) => {
            if (filename !== 'overall') {
                console.log(`  ${filename}: ${info.status} (${info.actual}/${info.limit}行)`);
            }
        });
        
        // 依存関係レポート
        console.log('\n🔗 依存関係確認状況:');
        Object.entries(this.validationResults.dependencies).forEach(([name, info]) => {
            if (name !== 'overall') {
                console.log(`  ${name}: ${info.status} (拡張: ${info.extended ? '✅' : '❌'})`);
            }
        });
        
        // 機能テストレポート
        console.log('\n⚙️ 機能完全性テスト結果:');
        Object.entries(this.validationResults.functionality).forEach(([name, info]) => {
            if (name !== 'overall' && info.details) {
                console.log(`  ${name}: ${info.details}`);
            }
        });
        
        console.log('\n' + '='.repeat(60));
        console.log(`🎯 総合評価: ${this.validationResults.overall ? '✅ リファクタリング成功' : '❌ 修正が必要'}`);
        console.log('='.repeat(60) + '\n');
        
        return this.validationResults;
    }
}

// グローバル関数として公開
window.validateTimelineRefactoring = async function() {
    const validator = new TimelineRefactoringValidator();
    await validator.runFullValidation();
    return validator.showValidationReport();
};

console.log('✅ Timeline リファクタリング検証システム準備完了');
console.log('💡 実行方法: validateTimelineRefactoring() をコンソールで実行してください');