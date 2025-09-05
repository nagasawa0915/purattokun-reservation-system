/**
 * SpineSettingsPersistence エラーシミュレーションユーティリティ
 * Phase 3.3統合テスト用 - 様々なエラー状況を再現
 */

class ErrorSimulator {
    
    constructor(options = {}) {
        this.options = {
            debug: options.debug || true,
            restoreOriginals: options.restoreOriginals !== false
        };
        
        this.originalMethods = {};
        this.activeSimulations = new Set();
        
        this.log('🧪 ErrorSimulator initialized');
    }
    
    log(message, level = 'info') {
        if (!this.options.debug) return;
        
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const prefix = '[ErrorSimulator]';
        
        switch (level) {
            case 'error':
                console.error(`${prefix} ${timestamp} ❌ ${message}`);
                break;
            case 'warn':
                console.warn(`${prefix} ${timestamp} ⚠️ ${message}`);
                break;
            default:
                console.log(`${prefix} ${timestamp} 🧪 ${message}`);
        }
    }
    
    /**
     * localStorage容量不足シミュレーション
     * @param {Object} options シミュレーション設定
     * @returns {Function} 復元関数
     */
    simulateStorageQuotaExceeded(options = {}) {
        const {
            triggerOnKey = null, // 特定のキーでのみエラー
            errorMessage = 'QuotaExceededError: DOM Exception 22',
            probability = 1.0 // エラー発生確率
        } = options;
        
        this.log(`Starting localStorage quota exceeded simulation`);
        
        // 元のsetItemを保存
        if (!this.originalMethods.setItem) {
            this.originalMethods.setItem = localStorage.setItem.bind(localStorage);
        }
        
        let errorTriggered = false;
        
        localStorage.setItem = (key, value) => {
            // 条件判定
            const shouldTriggerError = 
                (!triggerOnKey || key.includes(triggerOnKey)) &&
                Math.random() <= probability &&
                !errorTriggered;
            
            if (shouldTriggerError) {
                errorTriggered = true;
                this.log(`Triggering quota exceeded error for key: ${key}`, 'warn');
                throw new Error(errorMessage);
            }
            
            return this.originalMethods.setItem(key, value);
        };
        
        this.activeSimulations.add('quotaExceeded');
        
        // 復元関数
        return () => {
            if (this.originalMethods.setItem) {
                localStorage.setItem = this.originalMethods.setItem;
                this.log('localStorage.setItem restored');
            }
            this.activeSimulations.delete('quotaExceeded');
        };
    }
    
    /**
     * localStorage無効化シミュレーション（プライベートモード等）
     * @returns {Function} 復元関数
     */
    simulateStorageDisabled() {
        this.log('Starting localStorage disabled simulation');
        
        // 元のメソッドを保存
        ['setItem', 'getItem', 'removeItem', 'clear'].forEach(method => {
            if (!this.originalMethods[method]) {
                this.originalMethods[method] = localStorage[method].bind(localStorage);
            }
        });
        
        // 無効化
        localStorage.setItem = (key, value) => {
            throw new Error('localStorage is not available');
        };
        
        localStorage.getItem = (key) => {
            throw new Error('localStorage is not available');
        };
        
        localStorage.removeItem = (key) => {
            throw new Error('localStorage is not available');
        };
        
        localStorage.clear = () => {
            throw new Error('localStorage is not available');
        };
        
        this.activeSimulations.add('storageDisabled');
        
        // 復元関数
        return () => {
            ['setItem', 'getItem', 'removeItem', 'clear'].forEach(method => {
                if (this.originalMethods[method]) {
                    localStorage[method] = this.originalMethods[method];
                }
            });
            this.log('localStorage methods restored');
            this.activeSimulations.delete('storageDisabled');
        };
    }
    
    /**
     * データ破損シミュレーション
     * @param {string} characterId 対象キャラクターID
     * @param {string} corruptionType 破損タイプ
     * @returns {Object} 破損情報
     */
    simulateDataCorruption(characterId, corruptionType = 'invalidJson') {
        this.log(`Starting data corruption simulation: ${corruptionType}`);
        
        // ページIDを取得（SpineSettingsPersistenceと同様の方法）
        let pageId = window.location.pathname;
        if (pageId === '/') pageId = 'index';
        const pathParts = pageId.split('/');
        const fileName = pathParts[pathParts.length - 1];
        pageId = fileName.replace(/\.[^/.]+$/, '') || 'default';
        
        const key = `spineSettings-${pageId}-${characterId}`;
        
        let corruptData;
        switch (corruptionType) {
            case 'invalidJson':
                corruptData = '{invalid-json-data}';
                break;
            case 'emptyString':
                corruptData = '';
                break;
            case 'wrongFormat':
                corruptData = JSON.stringify({ wrongFormat: true });
                break;
            case 'missingFields':
                corruptData = JSON.stringify({
                    version: '1.0',
                    timestamp: new Date().toISOString(),
                    characterId: characterId,
                    settings: {} // 必須フィールドなし
                });
                break;
            case 'nullData':
                corruptData = 'null';
                break;
            case 'arrayInsteadOfObject':
                corruptData = JSON.stringify([1, 2, 3]);
                break;
            default:
                corruptData = '{corrupt}';
        }
        
        // 破損データを設定
        localStorage.setItem(key, corruptData);
        
        const corruptionInfo = {
            characterId: characterId,
            key: key,
            corruptionType: corruptionType,
            corruptData: corruptData
        };
        
        this.log(`Data corruption applied: ${key} -> ${corruptionType}`);
        
        return corruptionInfo;
    }
    
    /**
     * JSON.parse/JSON.stringify エラーシミュレーション
     * @param {string} method 対象メソッド ('parse' or 'stringify')
     * @returns {Function} 復元関数
     */
    simulateJSONError(method = 'parse') {
        this.log(`Starting JSON.${method} error simulation`);
        
        const originalMethod = JSON[method];
        let errorTriggered = false;
        
        JSON[method] = (...args) => {
            // SpineSettingsPersistence関連のデータでのみエラーを発生
            if (method === 'parse' && args[0] && 
                typeof args[0] === 'string' && 
                args[0].includes('spineSettings') && 
                !errorTriggered) {
                errorTriggered = true;
                this.log(`Triggering JSON.${method} error`, 'warn');
                throw new SyntaxError(`Unexpected token in JSON at position 0`);
            }
            
            return originalMethod.apply(JSON, args);
        };
        
        this.activeSimulations.add(`json${method.charAt(0).toUpperCase() + method.slice(1)}`);
        
        // 復元関数
        return () => {
            JSON[method] = originalMethod;
            this.log(`JSON.${method} restored`);
            this.activeSimulations.delete(`json${method.charAt(0).toUpperCase() + method.slice(1)}`);
        };
    }
    
    /**
     * ランダムなネットワーク遅延シミュレーション
     * @param {Object} options 遅延設定
     * @returns {Function} 復元関数
     */
    simulateNetworkDelay(options = {}) {
        const {
            minDelay = 100,
            maxDelay = 2000,
            probability = 0.3
        } = options;
        
        this.log(`Starting network delay simulation (${minDelay}-${maxDelay}ms, ${probability * 100}% probability)`);
        
        // localStorage操作を非同期化（実際の遅延をシミュレート）
        if (!this.originalMethods.getItem) {
            this.originalMethods.getItem = localStorage.getItem.bind(localStorage);
        }
        
        localStorage.getItem = (key) => {
            if (Math.random() <= probability) {
                const delay = minDelay + Math.random() * (maxDelay - minDelay);
                this.log(`Simulating ${delay.toFixed(0)}ms delay for getItem: ${key}`);
                
                // 同期的な遅延（実際のテストでは非推奨だが、シミュレーション用）
                const start = performance.now();
                while (performance.now() - start < delay) {
                    // Busy wait
                }
            }
            
            return this.originalMethods.getItem(key);
        };
        
        this.activeSimulations.add('networkDelay');
        
        return () => {
            if (this.originalMethods.getItem) {
                localStorage.getItem = this.originalMethods.getItem;
                this.log('localStorage.getItem delay simulation restored');
            }
            this.activeSimulations.delete('networkDelay');
        };
    }
    
    /**
     * メモリ不足シミュレーション
     * @returns {Function} 復元関数
     */
    simulateMemoryError() {
        this.log('Starting memory error simulation');
        
        if (!this.originalMethods.setItem) {
            this.originalMethods.setItem = localStorage.setItem.bind(localStorage);
        }
        
        let errorTriggered = false;
        
        localStorage.setItem = (key, value) => {
            if (key.includes('spineSettings') && !errorTriggered) {
                errorTriggered = true;
                this.log('Triggering memory error', 'error');
                throw new Error('Cannot allocate memory');
            }
            
            return this.originalMethods.setItem(key, value);
        };
        
        this.activeSimulations.add('memoryError');
        
        return () => {
            if (this.originalMethods.setItem) {
                localStorage.setItem = this.originalMethods.setItem;
                this.log('Memory error simulation restored');
            }
            this.activeSimulations.delete('memoryError');
        };
    }
    
    /**
     * 複数の障害を同時にシミュレート
     * @param {string[]} errorTypes エラータイプ配列
     * @returns {Function} 全て復元する関数
     */
    simulateMultipleErrors(errorTypes = ['quotaExceeded', 'dataCorruption']) {
        this.log(`Starting multiple error simulation: ${errorTypes.join(', ')}`);
        
        const restoreFunctions = [];
        
        errorTypes.forEach(errorType => {
            switch (errorType) {
                case 'quotaExceeded':
                    restoreFunctions.push(this.simulateStorageQuotaExceeded());
                    break;
                case 'dataCorruption':
                    this.simulateDataCorruption('multi-error-test', 'invalidJson');
                    break;
                case 'jsonError':
                    restoreFunctions.push(this.simulateJSONError());
                    break;
                case 'networkDelay':
                    restoreFunctions.push(this.simulateNetworkDelay());
                    break;
                case 'memoryError':
                    restoreFunctions.push(this.simulateMemoryError());
                    break;
                default:
                    this.log(`Unknown error type: ${errorType}`, 'warn');
            }
        });
        
        // 全復元関数
        return () => {
            restoreFunctions.forEach((restoreFn, index) => {
                try {
                    restoreFn();
                } catch (error) {
                    this.log(`Error restoring simulation ${index}: ${error.message}`, 'error');
                }
            });
            this.log('Multiple error simulation restored');
        };
    }
    
    /**
     * ストレステスト用の連続エラー
     * @param {number} errorCount エラー発生回数
     * @param {string} errorType エラータイプ
     * @returns {Function} 復元関数
     */
    simulateStressErrors(errorCount = 10, errorType = 'quotaExceeded') {
        this.log(`Starting stress error simulation: ${errorCount} errors of type ${errorType}`);
        
        let currentErrorCount = 0;
        let restoreFunction = null;
        
        switch (errorType) {
            case 'quotaExceeded':
                if (!this.originalMethods.setItem) {
                    this.originalMethods.setItem = localStorage.setItem.bind(localStorage);
                }
                
                localStorage.setItem = (key, value) => {
                    if (key.includes('spineSettings') && currentErrorCount < errorCount) {
                        currentErrorCount++;
                        this.log(`Stress error ${currentErrorCount}/${errorCount}`, 'warn');
                        throw new Error('QuotaExceededError: Stress test');
                    }
                    
                    return this.originalMethods.setItem(key, value);
                };
                
                restoreFunction = () => {
                    if (this.originalMethods.setItem) {
                        localStorage.setItem = this.originalMethods.setItem;
                    }
                };
                break;
                
            default:
                this.log(`Unsupported stress error type: ${errorType}`, 'error');
                return () => {};
        }
        
        this.activeSimulations.add(`stress-${errorType}`);
        
        return () => {
            if (restoreFunction) {
                restoreFunction();
            }
            this.activeSimulations.delete(`stress-${errorType}`);
            this.log(`Stress error simulation completed: ${currentErrorCount}/${errorCount} errors triggered`);
        };
    }
    
    /**
     * 現在のシミュレーション状態を取得
     * @returns {Object} シミュレーション状態
     */
    getSimulationStatus() {
        return {
            activeSimulations: Array.from(this.activeSimulations),
            originalMethodsBackup: Object.keys(this.originalMethods),
            isSimulating: this.activeSimulations.size > 0
        };
    }
    
    /**
     * 全てのシミュレーションを停止・復元
     */
    restoreAll() {
        this.log('Restoring all simulations');
        
        // localStorage methods restore
        Object.entries(this.originalMethods).forEach(([method, original]) => {
            if (localStorage[method] !== original) {
                localStorage[method] = original;
                this.log(`Restored localStorage.${method}`);
            }
        });
        
        // JSON methods restore (if modified)
        if (this.activeSimulations.has('jsonParse')) {
            // JSON.parse would have been restored by individual restore functions
        }
        
        this.originalMethods = {};
        this.activeSimulations.clear();
        
        this.log('All simulations restored');
    }
    
    /**
     * テスト結果生成
     * @param {Function} testFunction テスト対象関数
     * @param {string} errorType エラータイプ
     * @returns {Object} テスト結果
     */
    async testErrorHandling(testFunction, errorType = 'quotaExceeded') {
        const testResult = {
            errorType: errorType,
            startTime: Date.now(),
            endTime: null,
            errors: [],
            gracefulHandling: false,
            resultData: null
        };
        
        let restoreFunction;
        
        try {
            // エラーシミュレーション開始
            switch (errorType) {
                case 'quotaExceeded':
                    restoreFunction = this.simulateStorageQuotaExceeded();
                    break;
                case 'dataCorruption':
                    this.simulateDataCorruption('test-error-handling', 'invalidJson');
                    break;
                default:
                    throw new Error(`Unsupported error type: ${errorType}`);
            }
            
            // テスト実行
            const result = testFunction();
            testResult.resultData = result;
            testResult.gracefulHandling = true; // エラーが発生しなかった、または適切に処理された
            
        } catch (error) {
            testResult.errors.push(error.message);
            testResult.gracefulHandling = false; // エラーが適切に処理されなかった
        } finally {
            // 復元
            if (restoreFunction) {
                restoreFunction();
            }
            
            testResult.endTime = Date.now();
        }
        
        return testResult;
    }
}

// グローバル利用可能
if (typeof window !== 'undefined') {
    window.ErrorSimulator = ErrorSimulator;
}

// Node.js環境対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorSimulator;
}