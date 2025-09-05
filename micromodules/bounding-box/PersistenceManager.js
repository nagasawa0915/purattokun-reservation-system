/**
 * PersistenceManager.js
 * 
 * 💾 永続化管理マイクロモジュール
 * - 責務: localStorage永続化・復元・データ管理
 * - 外部依存: ConfigManager（パフォーマンス監視用）
 * - 行数: 約350行（500行制限遵守）
 * - 作成日: 2025-09-05
 */

class PersistenceManager {
    constructor(configManager) {
        this.configManager = configManager;
        this.activePins = new Map(); // nodeId -> pinConfig
        
        console.log('💾 PersistenceManager初期化完了');
    }
    
    // ==========================================
    // 💾 アクティブピン永続化システム
    // ==========================================
    
    /**
     * アクティブピン状態を永続化
     */
    saveActivePins(activePins) {
        try {
            const pinsData = {};
            
            // Map形式のactivePinsからデータを抽出
            if (activePins instanceof Map) {
                for (const [nodeId, pinConfig] of activePins) {
                    pinsData[nodeId] = this.serializePinConfig(pinConfig);
                }
            } else if (typeof activePins === 'object' && activePins !== null) {
                // オブジェクト形式の場合
                for (const [nodeId, pinConfig] of Object.entries(activePins)) {
                    pinsData[nodeId] = this.serializePinConfig(pinConfig);
                }
            }
            
            const saveData = {
                pins: pinsData,
                version: '1.0',
                timestamp: Date.now()
            };
            
            localStorage.setItem('autopin-active-pins', JSON.stringify(saveData));
            
            console.log('💾 アクティブピン状態保存完了:', Object.keys(pinsData));
            
            return { success: true, count: Object.keys(pinsData).length };
            
        } catch (error) {
            console.warn('⚠️ アクティブピン保存失敗:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * ピン設定をシリアライズ可能な形式に変換
     */
    serializePinConfig(pinConfig) {
        return {
            anchor: pinConfig.anchor,
            targetElement: pinConfig.targetElement?.id || null,
            spineElement: pinConfig.spineElement?.id || null,
            backgroundElement: pinConfig.backgroundElement ? {
                id: pinConfig.backgroundElement.id,
                tagName: pinConfig.backgroundElement.tagName,
                className: pinConfig.backgroundElement.className,
                selector: this.generateElementSelector(pinConfig.backgroundElement)
            } : null,
            timestamp: Date.now(),
            restored: pinConfig.restored || false
        };
    }
    
    /**
     * 要素のセレクターを生成
     */
    generateElementSelector(element) {
        if (!element) return null;
        
        // ID優先
        if (element.id) return `#${element.id}`;
        
        // クラス名によるセレクター
        if (element.className) {
            const classes = element.className.split(' ')
                .filter(cls => cls.trim())
                .map(cls => `.${cls}`)
                .join('');
            
            if (classes) {
                const selector = `${element.tagName.toLowerCase()}${classes}`;
                // セレクターの一意性を確認
                if (document.querySelectorAll(selector).length === 1) {
                    return selector;
                }
            }
        }
        
        // タグ名のみ（最後の手段）
        return element.tagName.toLowerCase();
    }
    
    /**
     * アクティブピン状態を復元
     */
    restoreActivePins() {
        try {
            const storedData = localStorage.getItem('autopin-active-pins');
            if (!storedData) {
                console.log('💾 復元するピン状態が見つかりません（初回起動）');
                return { success: true, count: 0, message: 'No stored data' };
            }
            
            const { pins, timestamp, version } = JSON.parse(storedData);
            
            // データの新鮮度チェック（1時間以上古いデータは無視）
            if (Date.now() - timestamp > 3600000) {
                console.log('💾 ピン状態が古すぎるため破棄しました');
                localStorage.removeItem('autopin-active-pins');
                return { success: true, count: 0, message: 'Data too old, removed' };
            }
            
            // バージョンチェック
            if (version !== '1.0') {
                console.warn('⚠️ 非対応バージョンのピン状態データ:', version);
                return { success: false, error: `Unsupported version: ${version}` };
            }
            
            let restoredCount = 0;
            const restoredPins = new Map();
            
            for (const [nodeId, pinData] of Object.entries(pins)) {
                const restoredPin = this.deserializePinConfig(pinData);
                
                if (restoredPin) {
                    restoredPins.set(nodeId, restoredPin);
                    restoredCount++;
                }
            }
            
            this.activePins = restoredPins;
            
            console.log(`💾 アクティブピン状態復元完了: ${restoredCount}件`);
            
            return { 
                success: true, 
                count: restoredCount, 
                pins: restoredPins 
            };
            
        } catch (error) {
            console.warn('⚠️ アクティブピン復元失敗:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * ピン設定をデシリアライズ
     */
    deserializePinConfig(pinData) {
        try {
            // 要素の存在確認と復元
            const targetElement = pinData.targetElement ? 
                document.getElementById(pinData.targetElement) : null;
            const spineElement = pinData.spineElement ? 
                document.getElementById(pinData.spineElement) : null;
            
            let backgroundElement = null;
            if (pinData.backgroundElement) {
                // ID優先で復元
                if (pinData.backgroundElement.id) {
                    backgroundElement = document.getElementById(pinData.backgroundElement.id);
                }
                
                // セレクターで復元
                if (!backgroundElement && pinData.backgroundElement.selector) {
                    backgroundElement = document.querySelector(pinData.backgroundElement.selector);
                }
                
                // ヒーロー画像要素の自動検出フォールバック
                if (!backgroundElement) {
                    const heroSelectors = ['.hero-section', '.hero-image', '[class*="hero"]'];
                    for (const selector of heroSelectors) {
                        backgroundElement = document.querySelector(selector);
                        if (backgroundElement) break;
                    }
                }
            }
            
            // 必要な要素が揃っている場合のみ復元
            if (targetElement && spineElement && backgroundElement) {
                return {
                    anchor: pinData.anchor,
                    targetElement: targetElement,
                    spineElement: spineElement,
                    backgroundElement: backgroundElement,
                    restored: true,
                    originalTimestamp: pinData.timestamp
                };
            } else {
                console.log('💾 ピン復元スキップ（要素不足）:', {
                    targetElement: !!targetElement,
                    spineElement: !!spineElement,
                    backgroundElement: !!backgroundElement
                });
                return null;
            }
            
        } catch (error) {
            console.warn('⚠️ ピン設定デシリアライズ失敗:', error.message);
            return null;
        }
    }
    
    // ==========================================
    // 📊 パフォーマンス指標永続化
    // ==========================================
    
    /**
     * パフォーマンス指標を永続化
     */
    savePerformanceMetrics(performanceMetrics) {
        try {
            const saveData = {
                ...performanceMetrics,
                version: '1.0',
                timestamp: Date.now()
            };
            
            localStorage.setItem('autopin-performance-metrics', JSON.stringify(saveData));
            
            console.log('💾 パフォーマンス指標保存完了');
            
            return { success: true };
            
        } catch (error) {
            console.warn('⚠️ パフォーマンス指標保存失敗:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * パフォーマンス指標を復元
     */
    restorePerformanceMetrics() {
        try {
            const storedData = localStorage.getItem('autopin-performance-metrics');
            if (!storedData) {
                console.log('💾 復元するパフォーマンス指標が見つかりません（初回起動）');
                return { 
                    success: true, 
                    metrics: this.getDefaultPerformanceMetrics(),
                    message: 'No stored data, using defaults'
                };
            }
            
            const data = JSON.parse(storedData);
            
            // データの新鮮度チェック（1時間以上古いデータは無視）
            if (Date.now() - data.timestamp > 3600000) {
                console.log('💾 パフォーマンス指標が古すぎるため破棄しました');
                localStorage.removeItem('autopin-performance-metrics');
                return { 
                    success: true, 
                    metrics: this.getDefaultPerformanceMetrics(),
                    message: 'Data too old, using defaults'
                };
            }
            
            const metrics = {
                totalProcessingTime: data.totalProcessingTime || 0,
                successCount: data.successCount || 0,
                failureCount: data.failureCount || 0,
                averageTime: data.averageTime || 0
            };
            
            console.log('💾 パフォーマンス指標復元完了:', metrics);
            
            return { success: true, metrics };
            
        } catch (error) {
            console.warn('⚠️ パフォーマンス指標復元失敗:', error.message);
            return { 
                success: false, 
                error: error.message,
                metrics: this.getDefaultPerformanceMetrics()
            };
        }
    }
    
    /**
     * デフォルトのパフォーマンス指標を取得
     */
    getDefaultPerformanceMetrics() {
        return {
            totalProcessingTime: 0,
            successCount: 0,
            failureCount: 0,
            averageTime: 0
        };
    }
    
    // ==========================================
    // 🗃️ データ管理ユーティリティ
    // ==========================================
    
    /**
     * 特定のピンデータを保存
     */
    savePinData(nodeId, pinConfig) {
        try {
            const storageKey = `autopin-${nodeId}`;
            const saveData = {
                ...this.serializePinConfig(pinConfig),
                version: '1.0',
                timestamp: Date.now()
            };
            
            localStorage.setItem(storageKey, JSON.stringify(saveData));
            
            console.log(`💾 ピンデータ保存完了: ${nodeId}`);
            
            return { success: true };
            
        } catch (error) {
            console.warn(`⚠️ ピンデータ保存失敗 (${nodeId}):`, error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 特定のピンデータを読み込み
     */
    loadPinData(nodeId) {
        try {
            const storageKey = `autopin-${nodeId}`;
            const storedData = localStorage.getItem(storageKey);
            
            if (!storedData) {
                return { success: false, message: 'No data found' };
            }
            
            const pinData = JSON.parse(storedData);
            
            // データの新鮮度チェック（24時間以上古いデータは無視）
            if (Date.now() - pinData.timestamp > 86400000) {
                localStorage.removeItem(storageKey);
                return { success: false, message: 'Data too old, removed' };
            }
            
            return { success: true, data: pinData };
            
        } catch (error) {
            console.warn(`⚠️ ピンデータ読み込み失敗 (${nodeId}):`, error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 全てのピンデータをクリア
     */
    clearAllPinData() {
        try {
            const keys = Object.keys(localStorage);
            const autoPinKeys = keys.filter(key => key.startsWith('autopin-'));
            
            autoPinKeys.forEach(key => {
                localStorage.removeItem(key);
            });
            
            this.activePins.clear();
            
            console.log(`💾 全ピンデータクリア完了: ${autoPinKeys.length}件`);
            
            return { success: true, count: autoPinKeys.length };
            
        } catch (error) {
            console.warn('⚠️ ピンデータクリア失敗:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * ストレージ使用量の取得
     */
    getStorageUsage() {
        try {
            const keys = Object.keys(localStorage);
            const autoPinKeys = keys.filter(key => key.startsWith('autopin-'));
            
            let totalSize = 0;
            const details = {};
            
            autoPinKeys.forEach(key => {
                const value = localStorage.getItem(key);
                const size = new Blob([value]).size;
                totalSize += size;
                details[key] = {
                    size: size,
                    sizeKB: (size / 1024).toFixed(2)
                };
            });
            
            return {
                success: true,
                totalKeys: autoPinKeys.length,
                totalSize: totalSize,
                totalSizeKB: (totalSize / 1024).toFixed(2),
                details: details
            };
            
        } catch (error) {
            console.warn('⚠️ ストレージ使用量取得失敗:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * データの整合性チェック
     */
    validateStoredData() {
        try {
            const keys = Object.keys(localStorage);
            const autoPinKeys = keys.filter(key => key.startsWith('autopin-'));
            
            let validCount = 0;
            let invalidCount = 0;
            const issues = [];
            
            autoPinKeys.forEach(key => {
                try {
                    const value = localStorage.getItem(key);
                    const data = JSON.parse(value);
                    
                    // 必須フィールドのチェック
                    if (!data.version || !data.timestamp) {
                        issues.push(`${key}: バージョンまたはタイムスタンプが不足`);
                        invalidCount++;
                    } else {
                        validCount++;
                    }
                    
                } catch (parseError) {
                    issues.push(`${key}: JSONパースエラー`);
                    invalidCount++;
                }
            });
            
            return {
                success: true,
                totalKeys: autoPinKeys.length,
                validCount: validCount,
                invalidCount: invalidCount,
                issues: issues
            };
            
        } catch (error) {
            console.warn('⚠️ データ整合性チェック失敗:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    // ==========================================
    // 🔧 ユーティリティメソッド
    // ==========================================
    
    /**
     * 現在のactivePinsを取得
     */
    getActivePins() {
        return this.activePins;
    }
    
    /**
     * activePinsを設定
     */
    setActivePins(activePins) {
        if (activePins instanceof Map) {
            this.activePins = new Map(activePins);
        } else {
            this.activePins.clear();
            for (const [key, value] of Object.entries(activePins)) {
                this.activePins.set(key, value);
            }
        }
    }
    
    /**
     * デバッグ情報の取得
     */
    getDebugInfo() {
        return {
            version: '1.0',
            className: 'PersistenceManager',
            activePinsCount: this.activePins.size,
            storageUsage: this.getStorageUsage(),
            dataValidation: this.validateStoredData(),
            timestamp: new Date().toISOString()
        };
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.PersistenceManager = PersistenceManager;
}