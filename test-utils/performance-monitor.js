/**
 * SpineSettingsPersistence パフォーマンス監視ユーティリティ
 * Phase 3.3統合テスト用
 */

class PerformanceMonitor {
    
    constructor(options = {}) {
        this.options = {
            enableMemoryMonitoring: options.enableMemoryMonitoring || true,
            sampleInterval: options.sampleInterval || 1000,
            maxSamples: options.maxSamples || 100,
            thresholds: {
                responseTime: options.thresholds?.responseTime || 100, // ms
                memoryIncrease: options.thresholds?.memoryIncrease || 10 // %
            }
        };
        
        this.metrics = {
            responseTimes: [],
            memoryUsage: [],
            operationCounts: {
                save: 0,
                restore: 0,
                clear: 0
            }
        };
        
        this.isMonitoring = false;
        this.monitoringInterval = null;
        
        this.log('🔧 PerformanceMonitor initialized');
    }
    
    log(message, level = 'info') {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const prefix = '[PerformanceMonitor]';
        
        switch (level) {
            case 'error':
                console.error(`${prefix} ${timestamp} ❌ ${message}`);
                break;
            case 'warn':
                console.warn(`${prefix} ${timestamp} ⚠️ ${message}`);
                break;
            default:
                console.log(`${prefix} ${timestamp} 📊 ${message}`);
        }
    }
    
    /**
     * 応答時間測定
     * @param {Function} operation 測定対象の操作
     * @param {string} operationType 操作タイプ
     * @returns {Object} 実行結果と測定データ
     */
    measureResponseTime(operation, operationType = 'unknown') {
        const startTime = performance.now();
        
        let result, error = null;
        try {
            result = operation();
        } catch (e) {
            error = e;
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // メトリクス記録
        this.metrics.responseTimes.push({
            timestamp: Date.now(),
            operationType: operationType,
            duration: duration,
            success: !error
        });
        
        // 操作カウント更新
        if (this.metrics.operationCounts[operationType] !== undefined) {
            this.metrics.operationCounts[operationType]++;
        }
        
        const withinThreshold = duration <= this.options.thresholds.responseTime;
        
        this.log(`${operationType} 応答時間: ${duration.toFixed(2)}ms ${withinThreshold ? '✅' : '⚠️'}`);
        
        if (error) {
            throw error;
        }
        
        return {
            result: result,
            duration: duration,
            withinThreshold: withinThreshold,
            operationType: operationType
        };
    }
    
    /**
     * メモリ使用量監視開始
     */
    startMemoryMonitoring() {
        if (!performance.memory) {
            this.log('performance.memory not supported', 'warn');
            return false;
        }
        
        if (this.isMonitoring) {
            this.log('Memory monitoring already started', 'warn');
            return true;
        }
        
        this.isMonitoring = true;
        this.initialMemory = performance.memory.usedJSHeapSize;
        this.metrics.memoryUsage = [];
        
        this.log(`Memory monitoring started (initial: ${(this.initialMemory / 1024 / 1024).toFixed(2)}MB)`);
        
        this.monitoringInterval = setInterval(() => {
            this.recordMemorySample();
        }, this.options.sampleInterval);
        
        return true;
    }
    
    /**
     * メモリ使用量監視停止
     */
    stopMemoryMonitoring() {
        if (!this.isMonitoring) {
            this.log('Memory monitoring not running', 'warn');
            return null;
        }
        
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        return this.analyzeMemoryUsage();
    }
    
    /**
     * メモリサンプル記録
     */
    recordMemorySample() {
        if (!performance.memory) return;
        
        const sample = {
            timestamp: Date.now(),
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
        
        this.metrics.memoryUsage.push(sample);
        
        // サンプル数制限
        if (this.metrics.memoryUsage.length > this.options.maxSamples) {
            this.metrics.memoryUsage.shift();
        }
    }
    
    /**
     * メモリ使用量分析
     * @returns {Object} メモリ分析結果
     */
    analyzeMemoryUsage() {
        if (this.metrics.memoryUsage.length < 2) {
            return {
                hasData: false,
                message: 'Insufficient memory samples'
            };
        }
        
        const firstSample = this.metrics.memoryUsage[0];
        const lastSample = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
        
        const initialMemory = firstSample.usedJSHeapSize;
        const finalMemory = lastSample.usedJSHeapSize;
        const memoryDiff = finalMemory - initialMemory;
        const memoryIncreasePercent = (memoryDiff / initialMemory) * 100;
        
        // ピークメモリ計算
        const peakMemory = Math.max(...this.metrics.memoryUsage.map(s => s.usedJSHeapSize));
        const peakIncrease = ((peakMemory - initialMemory) / initialMemory) * 100;
        
        const withinThreshold = memoryIncreasePercent <= this.options.thresholds.memoryIncrease;
        
        const analysis = {
            hasData: true,
            initialMemory: initialMemory,
            finalMemory: finalMemory,
            peakMemory: peakMemory,
            memoryDiff: memoryDiff,
            increasePercent: memoryIncreasePercent,
            peakIncreasePercent: peakIncrease,
            withinThreshold: withinThreshold,
            samples: this.metrics.memoryUsage.length,
            duration: lastSample.timestamp - firstSample.timestamp
        };
        
        this.log(`Memory analysis: ${memoryIncreasePercent.toFixed(2)}% increase ${withinThreshold ? '✅' : '⚠️'}`);
        
        return analysis;
    }
    
    /**
     * 連続操作テスト
     * @param {Function} operation 測定対象操作
     * @param {number} iterations 繰り返し回数
     * @param {string} operationType 操作タイプ
     * @returns {Promise<Object>} テスト結果
     */
    async testContinuousOperations(operation, iterations = 1000, operationType = 'continuous') {
        this.log(`Starting continuous operations test: ${iterations} iterations`);
        
        const results = {
            iterations: iterations,
            operationType: operationType,
            startTime: Date.now(),
            endTime: null,
            successCount: 0,
            failureCount: 0,
            responseTimes: [],
            errors: []
        };
        
        // メモリ監視開始
        this.startMemoryMonitoring();
        
        for (let i = 0; i < iterations; i++) {
            try {
                const measurement = this.measureResponseTime(operation, operationType);
                results.responseTimes.push(measurement.duration);
                results.successCount++;
            } catch (error) {
                results.failureCount++;
                results.errors.push({
                    iteration: i,
                    error: error.message
                });
            }
            
            // UI更新のための小休憩（10回毎）
            if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }
        
        results.endTime = Date.now();
        results.duration = results.endTime - results.startTime;
        results.memoryAnalysis = this.stopMemoryMonitoring();
        
        // 統計計算
        if (results.responseTimes.length > 0) {
            results.statistics = {
                min: Math.min(...results.responseTimes),
                max: Math.max(...results.responseTimes),
                avg: results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length,
                median: this.calculateMedian(results.responseTimes)
            };
        }
        
        results.successRate = (results.successCount / iterations) * 100;
        
        this.log(`Continuous test completed: ${results.successRate.toFixed(2)}% success rate`);
        
        return results;
    }
    
    /**
     * 中央値計算
     * @param {number[]} values 数値配列
     * @returns {number} 中央値
     */
    calculateMedian(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        
        return sorted.length % 2 === 0 
            ? (sorted[mid - 1] + sorted[mid]) / 2 
            : sorted[mid];
    }
    
    /**
     * パフォーマンス統計取得
     * @returns {Object} 統計情報
     */
    getStatistics() {
        const stats = {
            operationCounts: { ...this.metrics.operationCounts },
            responseTimes: {
                total: this.metrics.responseTimes.length,
                byType: {}
            }
        };
        
        // 操作タイプ別の統計
        const timesByType = {};
        this.metrics.responseTimes.forEach(measurement => {
            const type = measurement.operationType;
            if (!timesByType[type]) {
                timesByType[type] = [];
            }
            timesByType[type].push(measurement.duration);
        });
        
        Object.entries(timesByType).forEach(([type, times]) => {
            stats.responseTimes.byType[type] = {
                count: times.length,
                min: Math.min(...times),
                max: Math.max(...times),
                avg: times.reduce((a, b) => a + b, 0) / times.length,
                median: this.calculateMedian(times)
            };
        });
        
        return stats;
    }
    
    /**
     * レポート生成
     * @returns {Object} パフォーマンスレポート
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            configuration: this.options,
            statistics: this.getStatistics(),
            thresholdCompliance: this.checkThresholdCompliance(),
            recommendations: this.generateRecommendations()
        };
        
        return report;
    }
    
    /**
     * 閾値コンプライアンス確認
     * @returns {Object} 閾値チェック結果
     */
    checkThresholdCompliance() {
        const compliance = {
            responseTime: {
                threshold: this.options.thresholds.responseTime,
                violations: [],
                complianceRate: 0
            }
        };
        
        // 応答時間チェック
        const totalMeasurements = this.metrics.responseTimes.length;
        const violations = this.metrics.responseTimes.filter(
            m => m.duration > this.options.thresholds.responseTime
        );
        
        compliance.responseTime.violations = violations;
        compliance.responseTime.complianceRate = totalMeasurements > 0 
            ? ((totalMeasurements - violations.length) / totalMeasurements) * 100
            : 100;
        
        return compliance;
    }
    
    /**
     * 推奨事項生成
     * @returns {string[]} 推奨事項リスト
     */
    generateRecommendations() {
        const recommendations = [];
        const compliance = this.checkThresholdCompliance();
        
        if (compliance.responseTime.complianceRate < 95) {
            recommendations.push(
                `応答時間が基準(${this.options.thresholds.responseTime}ms)を超える操作があります。実装の最適化を検討してください。`
            );
        }
        
        if (this.metrics.memoryUsage.length > 0) {
            const memoryAnalysis = this.analyzeMemoryUsage();
            if (memoryAnalysis.hasData && !memoryAnalysis.withinThreshold) {
                recommendations.push(
                    `メモリ使用量が増加しています(${memoryAnalysis.increasePercent.toFixed(2)}%)。メモリリークの可能性があります。`
                );
            }
        }
        
        if (recommendations.length === 0) {
            recommendations.push('パフォーマンスは良好です。');
        }
        
        return recommendations;
    }
    
    /**
     * メトリクスリセット
     */
    reset() {
        this.metrics = {
            responseTimes: [],
            memoryUsage: [],
            operationCounts: {
                save: 0,
                restore: 0,
                clear: 0
            }
        };
        
        if (this.isMonitoring) {
            this.stopMemoryMonitoring();
        }
        
        this.log('Metrics reset');
    }
}

// グローバル利用可能
if (typeof window !== 'undefined') {
    window.PerformanceMonitor = PerformanceMonitor;
}

// Node.js環境対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}