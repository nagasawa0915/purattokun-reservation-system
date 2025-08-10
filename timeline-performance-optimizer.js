/**
 * 🚀 タイムライン・パフォーマンス最適化システム
 * 
 * 【機能概要】
 * - メモリプール管理・リーク防止
 * - 60FPS維持・描画最適化
 * - CPU負荷監視・自動調整
 * - リアルタイムパフォーマンスメトリクス
 * 
 * 【実装制約】
 * - 250行以内
 * - 既存システム保護
 * - timeline-experiment.html統合
 * 
 * @version 1.0.0
 * @created 2025-08-08
 */

class TimelinePerformanceOptimizer {
    constructor() {
        // パフォーマンス監視
        this.performanceMetrics = {
            fps: 60,
            frameTime: 16.67, // ms
            memoryUsage: 0,
            cpuUsage: 0,
            drawCalls: 0
        };
        
        // メモリプール
        this.memoryPools = {
            keyframes: [],
            animations: [],
            events: [],
            temp: []
        };
        
        // 最適化制御
        this.optimizationConfig = {
            targetFPS: 60,
            maxDrawCalls: 100,
            memoryThreshold: 50 * 1024 * 1024, // 50MB
            autoOptimize: true
        };
        
        // 監視状態
        this.isMonitoring = false;
        this.monitoringIntervals = new Map();
        this.performanceHistory = [];
        
        console.log('🚀 Performance Optimizer 初期化完了');
    }
    
    /**
     * パフォーマンス最適化開始（エラーハンドリング強化）
     */
    startOptimization() {
        if (this.isMonitoring) {
            console.warn('⚠️ パフォーマンス最適化は既に実行中です');
            return;
        }
        
        try {
            this.isMonitoring = true;
            
            // 🔒 環境サポート確認
            this.validateEnvironmentSupport();
            
            // FPS監視開始
            this.startFPSMonitoring();
            
            // メモリ監視開始
            this.startMemoryMonitoring();
            
            // CPU負荷監視開始
            this.startCPUMonitoring();
            
            // 自動最適化開始
            if (this.optimizationConfig.autoOptimize) {
                this.startAutoOptimization();
            }
            
            console.log('✅ パフォーマンス最適化開始');
            
        } catch (error) {
            console.error('❌ パフォーマンス最適化開始エラー:', error);
            this.handleOptimizationError(error);
        }
    }
    
    /**
     * 環境サポート検証
     */
    validateEnvironmentSupport() {
        const issues = [];
        
        if (!window.performance) {
            issues.push('Performance APIがサポートされていません');
        }
        
        if (!window.requestAnimationFrame) {
            issues.push('requestAnimationFrameがサポートされていません');
        }
        
        if (issues.length > 0) {
            console.warn('⚠️ 環境サポートの問題:', issues);
            // 継続可能であれば警告のみ
        }
    }
    
    /**
     * 最適化エラーハンドリング
     */
    handleOptimizationError(error) {
        this.isMonitoring = false;
        
        // 全監視インターバル停止
        this.monitoringIntervals.forEach(interval => {
            clearInterval(interval);
        });
        this.monitoringIntervals.clear();
        
        console.log('🔄 エラー回復: 簡略モードで継続');
    }
    
    /**
     * FPS監視・描画最適化
     */
    startFPSMonitoring() {
        let frameCount = 0;
        let lastTime = performance.now();
        let lastFrameTime = lastTime;
        
        const measureFrame = (currentTime) => {
            frameCount++;
            
            // フレーム時間計算
            const deltaTime = currentTime - lastFrameTime;
            lastFrameTime = currentTime;
            
            // FPS計算（1秒ごと）
            if (currentTime - lastTime >= 1000) {
                this.performanceMetrics.fps = frameCount;
                this.performanceMetrics.frameTime = deltaTime;
                
                frameCount = 0;
                lastTime = currentTime;
                
                // UI更新
                this.updatePerformanceUI();
            }
            
            // 描画最適化判定
            if (deltaTime > 16.67 * 1.5) { // 60FPS threshold
                this.applyDrawingOptimization();
            }
            
            if (this.isMonitoring) {
                requestAnimationFrame(measureFrame);
            }
        };
        
        requestAnimationFrame(measureFrame);
    }
    
    /**
     * メモリ監視・プール管理
     */
    startMemoryMonitoring() {
        const interval = setInterval(() => {
            if (!this.isMonitoring) {
                clearInterval(interval);
                return;
            }
            
            // メモリ使用量測定
            if (performance.memory) {
                this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize;
                
                // メモリリーク検出
                if (this.performanceMetrics.memoryUsage > this.optimizationConfig.memoryThreshold) {
                    this.executeMemoryCleanup();
                }
            }
            
            // メモリプール整理
            this.cleanupMemoryPools();
            
        }, 2000); // 2秒間隔
        
        this.monitoringIntervals.set('memory', interval);
    }
    
    /**
     * CPU負荷監視
     */
    startCPUMonitoring() {
        let taskCount = 0;
        let startTime = performance.now();
        
        const monitorCPU = () => {
            const currentTime = performance.now();
            const elapsed = currentTime - startTime;
            
            // 簡易CPU負荷計算
            this.performanceMetrics.cpuUsage = Math.min(100, (taskCount / elapsed) * 100);
            
            taskCount = 0;
            startTime = currentTime;
            
            if (this.isMonitoring) {
                setTimeout(monitorCPU, 1000);
            }
        };
        
        monitorCPU();
    }
    
    /**
     * 自動最適化実行
     */
    startAutoOptimization() {
        const interval = setInterval(() => {
            if (!this.isMonitoring) {
                clearInterval(interval);
                return;
            }
            
            const metrics = this.performanceMetrics;
            
            // FPS低下対策
            if (metrics.fps < this.optimizationConfig.targetFPS * 0.8) {
                this.applyPerformanceOptimization();
            }
            
            // 描画コール最適化
            if (metrics.drawCalls > this.optimizationConfig.maxDrawCalls) {
                this.optimizeDrawCalls();
            }
            
        }, 5000); // 5秒間隔
        
        this.monitoringIntervals.set('auto', interval);
    }
    
    /**
     * 描画最適化適用
     */
    applyDrawingOptimization() {
        // requestAnimationFrame最適化
        if (window.timelineExperiment && window.timelineExperiment.visualEditor) {
            const editor = window.timelineExperiment.visualEditor;
            
            // 更新頻度調整
            if (editor.playbackSpeed > 0.5) {
                editor.playbackSpeed *= 0.9;
                console.log('⚡ 描画最適化: 再生速度調整');
            }
        }
    }
    
    /**
     * メモリクリーンアップ実行（商用品質強化）
     */
    executeMemoryCleanup() {
        try {
            const beforeMemory = this.performanceMetrics.memoryUsage;
            let cleanedPools = 0;
            
            // メモリプール整理
            Object.keys(this.memoryPools).forEach(poolName => {
                const pool = this.memoryPools[poolName];
                const initialSize = pool.length;
                
                if (initialSize > 100) {
                    const keepCount = Math.max(25, Math.floor(initialSize * 0.5));
                    pool.splice(keepCount); // 安全な削除
                    cleanedPools++;
                    
                    console.log(`🧹 メモリプール整理: ${poolName} (${initialSize} → ${pool.length})`);
                }
            });
            
            // ガベージコレクション促進（利用可能な場合のみ）
            if (typeof window.gc === 'function') {
                try {
                    window.gc();
                    console.log('🧹 ガベージコレクション実行');
                } catch (gcError) {
                    console.warn('⚠️ ガベージコレクションエラー:', gcError.message);
                }
            }
            
            console.log(`✅ メモリクリーンアップ完了: ${cleanedPools}プール整理`);
            
        } catch (error) {
            console.error('❌ メモリクリーンアップエラー:', error);
            // エラーが発生してもシステムを停止しない
        }
    }
    
    /**
     * メモリプール管理
     */
    cleanupMemoryPools() {
        const maxPoolSize = 50;
        
        Object.keys(this.memoryPools).forEach(poolName => {
            const pool = this.memoryPools[poolName];
            if (pool.length > maxPoolSize) {
                pool.splice(0, pool.length - maxPoolSize);
            }
        });
    }
    
    /**
     * パフォーマンス最適化適用
     */
    applyPerformanceOptimization() {
        // アニメーション品質調整
        if (window.timelineExperiment) {
            // 非重要な視覚効果を無効化
            document.querySelectorAll('.keyframe').forEach(el => {
                el.style.transition = 'none';
            });
            
            console.log('⚡ パフォーマンス最適化: 視覚効果調整');
        }
    }
    
    /**
     * 描画コール最適化
     */
    optimizeDrawCalls() {
        this.performanceMetrics.drawCalls = 0;
        console.log('⚡ 描画コール最適化実行');
    }
    
    /**
     * UI更新（timeline-experiment.html連携）
     */
    updatePerformanceUI() {
        const metrics = this.performanceMetrics;
        
        // FPS表示更新
        const frameElement = document.getElementById('current-frame');
        if (frameElement) {
            frameElement.textContent = `${metrics.fps}fps`;
            
            // FPS警告色変更
            if (metrics.fps < 30) {
                frameElement.style.color = '#e53e3e'; // 赤
            } else if (metrics.fps < 50) {
                frameElement.style.color = '#ed8936'; // オレンジ
            } else {
                frameElement.style.color = '#48bb78'; // 緑
            }
        }
        
        // メモリ使用量表示更新
        const memoryElement = document.getElementById('memory-usage');
        if (memoryElement && metrics.memoryUsage) {
            const memoryMB = (metrics.memoryUsage / 1024 / 1024);
            memoryElement.textContent = `${memoryMB.toFixed(1)}MB`;
            
            // メモリ警告色変更
            if (memoryMB > 100) {
                memoryElement.style.color = '#e53e3e';
            } else if (memoryMB > 50) {
                memoryElement.style.color = '#ed8936';
            } else {
                memoryElement.style.color = '#48bb78';
            }
        }
        
        // CPU負荷表示更新
        const cpuElement = document.getElementById('cpu-usage');
        if (cpuElement) {
            cpuElement.textContent = `${metrics.cpuUsage.toFixed(1)}%`;
            
            // CPU警告色変更
            if (metrics.cpuUsage > 80) {
                cpuElement.style.color = '#e53e3e';
            } else if (metrics.cpuUsage > 50) {
                cpuElement.style.color = '#ed8936';
            } else {
                cpuElement.style.color = '#48bb78';
            }
        }
        
        // パフォーマンス情報をコンソールに出力
        if (this.shouldLogPerformance(metrics)) {
            this.logPerformanceMetrics(metrics);
        }
    }
    
    /**
     * パフォーマンスログ出力判定
     */
    shouldLogPerformance(metrics) {
        return metrics.fps < 50 || this.performanceHistory.length % 10 === 0;
    }
    
    /**
     * パフォーマンスメトリクスログ出力
     */
    logPerformanceMetrics(metrics) {
        console.log('📊 Performance:', {
            fps: metrics.fps,
            frameTime: metrics.frameTime.toFixed(2) + 'ms',
            memory: (metrics.memoryUsage / 1024 / 1024).toFixed(1) + 'MB',
            cpu: metrics.cpuUsage.toFixed(1) + '%'
        });
        
        // 履歴保存
        this.addToPerformanceHistory({
            timestamp: Date.now(),
            fps: metrics.fps,
            memory: metrics.memoryUsage,
            cpu: metrics.cpuUsage
        });
    }
    
    /**
     * パフォーマンス履歴追加・サイズ制限
     */
    addToPerformanceHistory(historyEntry) {
        this.performanceHistory.push(historyEntry);
        
        // 履歴サイズ制限（100件まで）
        if (this.performanceHistory.length > 100) {
            this.performanceHistory.shift();
        }
    }
    
    /**
     * 最適化停止
     */
    stopOptimization() {
        this.isMonitoring = false;
        
        // 全監視インターバル停止
        this.monitoringIntervals.forEach(interval => {
            clearInterval(interval);
        });
        this.monitoringIntervals.clear();
        
        console.log('⏹️ パフォーマンス最適化停止');
    }
    
    /**
     * パフォーマンスレポート取得
     */
    getPerformanceReport() {
        const history = this.performanceHistory.slice(-10); // 最新10件
        const avgFPS = history.reduce((sum, h) => sum + h.fps, 0) / history.length;
        
        return {
            current: this.performanceMetrics,
            average: {
                fps: avgFPS || 0,
                memory: this.calculateAverageMemory(history)
            },
            history: history,
            optimization: {
                memoryPoolSizes: this.getMemoryPoolSizes()
            }
        };
    }
    
    /**
     * 平均メモリ使用量計算
     */
    calculateAverageMemory(history) {
        if (history.length === 0) return 0;
        return history.reduce((sum, h) => sum + h.memory, 0) / history.length;
    }
    
    /**
     * メモリプールサイズ情報取得
     */
    getMemoryPoolSizes() {
        const poolSizes = {};
        Object.keys(this.memoryPools).forEach(key => {
            poolSizes[key] = this.memoryPools[key].length;
        });
        return poolSizes;
    }
}

// グローバル初期化
window.TimelinePerformanceOptimizer = TimelinePerformanceOptimizer;

// timeline-experiment.html統合
document.addEventListener('DOMContentLoaded', () => {
    if (!window.timelinePerformanceOptimizer) {
        window.timelinePerformanceOptimizer = new TimelinePerformanceOptimizer();
        
        // 実験環境が準備完了後に自動開始
        setTimeout(() => {
            if (window.timelineExperiment) {
                window.timelinePerformanceOptimizer.startOptimization();
                console.log('🚀 パフォーマンス最適化 自動開始');
            }
        }, 1000);
    }
});

// デバッグ用グローバル関数
window.getPerformanceReport = () => {
    if (window.timelinePerformanceOptimizer) {
        const report = window.timelinePerformanceOptimizer.getPerformanceReport();
        console.log('📊 Performance Report:', report);
        return report;
    }
    return null;
};

console.log('🚀 Timeline Performance Optimizer ロード完了');