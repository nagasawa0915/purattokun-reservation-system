/**
 * 無限ループデバッグ・診断支援ツール
 * 
 * 過去問題の再発防止とデバッグ効率化を目的とした支援ツール集
 * 無限ループ防止システムと連携して動作
 */

class InfiniteLoopDebugTools {
    constructor() {
        this.version = '1.0.0';
        this.isActive = false;
        
        // 診断データ
        this.diagnostics = {
            codePatterns: new Map(),      // 危険コードパターン記録
            performanceMetrics: [],       // パフォーマンス測定値
            callStacks: new Map(),        // 関数呼び出しスタック記録
            eventMetrics: new Map(),      // イベント発生回数記録
            resourceUsage: []             // リソース使用履歴
        };
        
        // デバッグ設定
        this.debug = {
            traceEnabled: false,          // 詳細トレース
            profileEnabled: false,        // パフォーマンスプロファイリング
            breakOnSuspicious: false,     // 疑わしい処理でブレーク
            logThreshold: 'WARN'         // ログレベル閾値
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log('🔧 無限ループデバッグツール初期化中...');
        
        try {
            this.setupAdvancedLogging();
            this.setupPerformanceProfiling();
            this.setupCallStackTracking();
            this.setupResourceMonitoring();
            this.setupInteractiveDebugger();
            
            this.isActive = true;
            console.log('✅ デバッグツール起動完了');
            
        } catch (error) {
            console.error('❌ デバッグツール初期化エラー:', error);
        }
    }
    
    /**
     * 高度ログシステム
     */
    setupAdvancedLogging() {
        // ログレベル別出力
        window.debugLog = (level, message, data = null) => {
            const levels = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3, TRACE: 4 };
            const threshold = levels[this.debug.logThreshold] || 1;
            
            if (levels[level] <= threshold) {
                const timestamp = new Date().toISOString();
                const prefix = {
                    ERROR: '❌',
                    WARN: '⚠️',
                    INFO: 'ℹ️',
                    DEBUG: '🔍',
                    TRACE: '📍'
                }[level] || '📝';
                
                console.log(`${prefix} [${timestamp}] ${message}`);
                if (data) console.log(data);
                
                // 重要ログの保存
                if (level === 'ERROR' || level === 'WARN') {
                    this.diagnostics.resourceUsage.push({
                        timestamp: Date.now(),
                        level,
                        message,
                        data: data ? JSON.stringify(data) : null
                    });
                }
            }
        };
        
        console.log('📝 高度ログシステム有効化');
    }
    
    /**
     * パフォーマンスプロファイリング
     */
    setupPerformanceProfiling() {
        // 関数実行時間測定ユーティリティ
        window.measureExecution = (name, fn) => {
            return (...args) => {
                const start = performance.now();
                let result;
                
                try {
                    result = fn.apply(this, args);
                    
                    // Promise対応
                    if (result && typeof result.then === 'function') {
                        return result.then(res => {
                            const end = performance.now();
                            this.recordPerformanceMetric(name, end - start, 'async');
                            return res;
                        });
                    } else {
                        const end = performance.now();
                        this.recordPerformanceMetric(name, end - start, 'sync');
                        return result;
                    }
                } catch (error) {
                    const end = performance.now();
                    this.recordPerformanceMetric(name, end - start, 'error');
                    throw error;
                }
            };
        };
        
        // 自動パフォーマンス測定（既存関数の包装）
        this.wrapSuspiciousFunctions();
        
        console.log('⏱️ パフォーマンスプロファイリング有効化');
    }
    
    /**
     * 疑わしい関数の自動包装
     */
    wrapSuspiciousFunctions() {
        const suspiciousFunctions = [
            'setInterval',
            'setTimeout', 
            'requestAnimationFrame',
            'addEventListener',
            'querySelector',
            'getElementById'
        ];
        
        suspiciousFunctions.forEach(funcName => {
            if (window[funcName] && !window[funcName]._wrapped) {
                const original = window[funcName];
                
                window[funcName] = window.measureExecution(funcName, (...args) => {
                    // 特別な警告チェック
                    if (funcName === 'setInterval' && args[1] < 16) {
                        window.debugLog('WARN', `高頻度${funcName}検出: ${args[1]}ms間隔`);
                    }
                    
                    return original.apply(window, args);
                });
                
                window[funcName]._wrapped = true;
                window[funcName]._original = original;
            }
        });
    }
    
    /**
     * 呼び出しスタック追跡
     */
    setupCallStackTracking() {
        // 関数呼び出しスタックの記録
        window.traceCallStack = (functionName) => {
            if (!this.debug.traceEnabled) return;
            
            const stack = new Error().stack;
            const key = functionName || 'unknown';
            
            if (!this.diagnostics.callStacks.has(key)) {
                this.diagnostics.callStacks.set(key, []);
            }
            
            this.diagnostics.callStacks.get(key).push({
                timestamp: Date.now(),
                stack: stack
            });
            
            // スタック記録数制限
            const stacks = this.diagnostics.callStacks.get(key);
            if (stacks.length > 100) {
                stacks.splice(0, 50); // 古い50件削除
            }
        };
        
        // 再帰呼び出し検出
        window.detectRecursion = (functionName, maxDepth = 50) => {
            const stack = new Error().stack;
            const occurrences = (stack.match(new RegExp(functionName, 'g')) || []).length;
            
            if (occurrences > maxDepth) {
                window.debugLog('ERROR', `再帰呼び出し上限検出: ${functionName} (${occurrences}回)`);
                
                if (this.debug.breakOnSuspicious) {
                    debugger; // ブレークポイント
                }
                
                return true;
            }
            
            return false;
        };
        
        console.log('📚 呼び出しスタック追跡有効化');
    }
    
    /**
     * リソース監視
     */
    setupResourceMonitoring() {
        // DOM監視
        const domObserver = new MutationObserver((mutations) => {
            const addedNodes = mutations.reduce((count, m) => count + m.addedNodes.length, 0);
            const removedNodes = mutations.reduce((count, m) => count + m.removedNodes.length, 0);
            
            if (addedNodes > 100 || removedNodes > 100) {
                window.debugLog('WARN', `大量DOM変更検出: +${addedNodes}, -${removedNodes}`);
            }
        });
        
        domObserver.observe(document, {
            childList: true,
            subtree: true,
            attributes: false
        });
        
        // メモリ使用量監視
        setInterval(() => {
            if (performance.memory) {
                const memory = performance.memory;
                const usage = {
                    timestamp: Date.now(),
                    used: memory.usedJSHeapSize,
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit
                };
                
                this.diagnostics.resourceUsage.push(usage);
                
                // メモリリーク疑い検出
                if (usage.used / usage.total > 0.9) {
                    window.debugLog('WARN', 'メモリ使用量高い', usage);
                }
                
                // 履歴サイズ制限
                if (this.diagnostics.resourceUsage.length > 1000) {
                    this.diagnostics.resourceUsage.splice(0, 500);
                }
            }
        }, 5000);
        
        console.log('📊 リソース監視有効化');
    }
    
    /**
     * インタラクティブデバッガー
     */
    setupInteractiveDebugger() {
        // デバッグコマンド登録
        window.debugCommands = {
            // パフォーマンス分析
            perf: () => this.showPerformanceReport(),
            
            // 呼び出しスタック分析
            stack: (functionName) => this.showCallStackReport(functionName),
            
            // リソース使用レポート
            resource: () => this.showResourceReport(),
            
            // 危険パターン検出
            patterns: () => this.detectDangerousPatterns(),
            
            // システム診断
            diagnose: () => this.runFullDiagnostics(),
            
            // 設定変更
            config: (key, value) => this.updateConfig(key, value),
            
            // ヘルプ
            help: () => this.showHelp()
        };
        
        // グローバルアクセス
        window.debug = window.debugCommands;
        
        console.log('🎮 インタラクティブデバッガー有効化');
        console.log('使用法: debug.help() でヘルプ表示');
    }
    
    /**
     * パフォーマンス測定値記録
     */
    recordPerformanceMetric(name, duration, type) {
        this.diagnostics.performanceMetrics.push({
            timestamp: Date.now(),
            name,
            duration,
            type
        });
        
        // 長時間実行警告
        if (duration > 100) {
            window.debugLog('WARN', `長時間実行検出: ${name} (${duration.toFixed(2)}ms)`);
        }
        
        // 履歴制限
        if (this.diagnostics.performanceMetrics.length > 1000) {
            this.diagnostics.performanceMetrics.splice(0, 500);
        }
    }
    
    /**
     * パフォーマンスレポート表示
     */
    showPerformanceReport() {
        const metrics = this.diagnostics.performanceMetrics.slice(-100);
        
        if (metrics.length === 0) {
            console.log('📊 パフォーマンス測定データなし');
            return;
        }
        
        // 関数別統計
        const stats = {};
        metrics.forEach(m => {
            if (!stats[m.name]) {
                stats[m.name] = { count: 0, totalTime: 0, avgTime: 0, maxTime: 0 };
            }
            
            stats[m.name].count++;
            stats[m.name].totalTime += m.duration;
            stats[m.name].maxTime = Math.max(stats[m.name].maxTime, m.duration);
        });
        
        // 平均時間計算
        Object.keys(stats).forEach(name => {
            stats[name].avgTime = stats[name].totalTime / stats[name].count;
        });
        
        console.group('📊 パフォーマンスレポート（最新100件）');
        console.table(stats);
        
        // 問題のある関数特定
        const slowFunctions = Object.entries(stats)
            .filter(([_, stat]) => stat.avgTime > 50)
            .sort((a, b) => b[1].avgTime - a[1].avgTime);
        
        if (slowFunctions.length > 0) {
            console.warn('⚠️ 低速関数:');
            slowFunctions.forEach(([name, stat]) => {
                console.log(`  ${name}: 平均${stat.avgTime.toFixed(2)}ms, 最大${stat.maxTime.toFixed(2)}ms`);
            });
        }
        
        console.groupEnd();
    }
    
    /**
     * 呼び出しスタックレポート表示
     */
    showCallStackReport(functionName = null) {
        if (functionName) {
            const stacks = this.diagnostics.callStacks.get(functionName);
            if (stacks) {
                console.group(`📚 ${functionName} 呼び出しスタック`);
                stacks.slice(-10).forEach((entry, index) => {
                    console.log(`[${index + 1}] ${new Date(entry.timestamp).toLocaleTimeString()}`);
                    console.log(entry.stack);
                });
                console.groupEnd();
            } else {
                console.log(`📚 ${functionName} のスタック記録なし`);
            }
        } else {
            console.group('📚 全スタック記録概要');
            const summary = {};
            this.diagnostics.callStacks.forEach((stacks, name) => {
                summary[name] = stacks.length;
            });
            console.table(summary);
            console.log('詳細: debug.stack("関数名") で確認');
            console.groupEnd();
        }
    }
    
    /**
     * リソースレポート表示
     */
    showResourceReport() {
        const usage = this.diagnostics.resourceUsage.slice(-50);
        
        if (usage.length === 0) {
            console.log('📊 リソース使用データなし');
            return;
        }
        
        console.group('📊 リソース使用レポート');
        
        // メモリ使用量グラフ（簡易版）
        const memoryData = usage.filter(u => u.used !== undefined);
        if (memoryData.length > 0) {
            console.log('💾 メモリ使用量推移:');
            memoryData.forEach(m => {
                const used = Math.round(m.used / 1024 / 1024);
                const total = Math.round(m.total / 1024 / 1024);
                const ratio = (m.used / m.total * 100).toFixed(1);
                console.log(`  ${new Date(m.timestamp).toLocaleTimeString()}: ${used}MB/${total}MB (${ratio}%)`);
            });
        }
        
        // エラー・警告サマリー
        const logs = usage.filter(u => u.level);
        if (logs.length > 0) {
            const logSummary = {};
            logs.forEach(log => {
                logSummary[log.level] = (logSummary[log.level] || 0) + 1;
            });
            console.log('📝 ログサマリー:', logSummary);
        }
        
        console.groupEnd();
    }
    
    /**
     * 危険パターン検出
     */
    detectDangerousPatterns() {
        const patterns = [];
        
        // スクリプト要素のコード解析
        document.querySelectorAll('script').forEach((script, index) => {
            if (script.textContent) {
                const dangerousPatterns = [
                    {
                        name: 'while+async/await',
                        regex: /while\s*\([^)]*\)\s*\{[^}]*await[^}]*\}/g,
                        severity: 'HIGH'
                    },
                    {
                        name: 'setInterval短間隔',
                        regex: /setInterval\s*\([^,]*,\s*([0-9]{1,2})\s*\)/g,
                        severity: 'MEDIUM'
                    },
                    {
                        name: 'setTimeout再帰',
                        regex: /setTimeout\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*,.*\1\s*\(/g,
                        severity: 'HIGH'
                    },
                    {
                        name: '無制限for文',
                        regex: /for\s*\(\s*;[^;]*;[^)]*\)\s*\{/g,
                        severity: 'MEDIUM'
                    }
                ];
                
                dangerousPatterns.forEach(pattern => {
                    const matches = script.textContent.match(pattern.regex);
                    if (matches) {
                        patterns.push({
                            script: `script[${index}]`,
                            pattern: pattern.name,
                            severity: pattern.severity,
                            matches: matches.length,
                            samples: matches.slice(0, 3)
                        });
                    }
                });
            }
        });
        
        if (patterns.length > 0) {
            console.group('🚨 危険パターン検出結果');
            patterns.forEach(p => {
                console.warn(`${p.severity} - ${p.pattern} in ${p.script} (${p.matches}件)`);
                p.samples.forEach(sample => console.log(`  例: ${sample}`));
            });
            console.groupEnd();
        } else {
            console.log('✅ 危険パターンは検出されませんでした');
        }
        
        return patterns;
    }
    
    /**
     * 総合診断実行
     */
    runFullDiagnostics() {
        console.group('🔍 総合システム診断実行中...');
        
        // 1. パフォーマンス診断
        console.log('1️⃣ パフォーマンス診断...');
        this.showPerformanceReport();
        
        // 2. リソース診断
        console.log('2️⃣ リソース診断...');
        this.showResourceReport();
        
        // 3. 危険パターン診断
        console.log('3️⃣ 危険パターン診断...');
        const patterns = this.detectDangerousPatterns();
        
        // 4. システム状態診断
        console.log('4️⃣ システム状態診断...');
        const systemStatus = {
            '無限ループ防止システム': !!window.loopPreventionSystem,
            'ConsoleManager': !!window.ConsoleManager,
            'デバッグツール': this.isActive,
            'アクティブタイマー': window.loopPreventionSystem ? 
                window.loopPreventionSystem.detection.intervalIds.size + 
                window.loopPreventionSystem.detection.timeoutIds.size : 'N/A',
            'イベントリスナー': window.loopPreventionSystem ? 
                window.loopPreventionSystem.detection.eventListeners.size : 'N/A'
        };
        console.table(systemStatus);
        
        // 5. 推奨事項
        console.log('5️⃣ 推奨事項:');
        const recommendations = [];
        
        if (!window.loopPreventionSystem) {
            recommendations.push('⚠️ 無限ループ防止システムを起動してください');
        }
        
        if (patterns.some(p => p.severity === 'HIGH')) {
            recommendations.push('🚨 高リスクパターンが検出されました。コードレビューを実施してください');
        }
        
        const slowFunctions = this.diagnostics.performanceMetrics
            .filter(m => m.duration > 100).length;
        if (slowFunctions > 10) {
            recommendations.push('⚡ 低速関数が多数検出されました。パフォーマンス改善を検討してください');
        }
        
        if (recommendations.length > 0) {
            recommendations.forEach(rec => console.log(rec));
        } else {
            console.log('✅ 特に問題は見つかりませんでした');
        }
        
        console.groupEnd();
    }
    
    /**
     * 設定更新
     */
    updateConfig(key, value) {
        if (this.debug.hasOwnProperty(key)) {
            const oldValue = this.debug[key];
            this.debug[key] = value;
            console.log(`⚙️ 設定更新: ${key} ${oldValue} → ${value}`);
        } else {
            console.error(`❌ 不明な設定項目: ${key}`);
        }
    }
    
    /**
     * ヘルプ表示
     */
    showHelp() {
        console.group('🆘 デバッグツール ヘルプ');
        console.log('利用可能コマンド:');
        console.log('  debug.perf()           - パフォーマンス分析');
        console.log('  debug.stack(関数名)    - 呼び出しスタック分析');
        console.log('  debug.resource()       - リソース使用レポート');
        console.log('  debug.patterns()       - 危険パターン検出');
        console.log('  debug.diagnose()       - 総合診断実行');
        console.log('  debug.config(key, val) - 設定変更');
        console.log('');
        console.log('設定項目:');
        console.log('  traceEnabled       - 詳細トレース ON/OFF');
        console.log('  profileEnabled     - プロファイリング ON/OFF');
        console.log('  breakOnSuspicious  - 疑わしい処理でブレーク ON/OFF');
        console.log('  logThreshold       - ログレベル (ERROR/WARN/INFO/DEBUG/TRACE)');
        console.log('');
        console.log('例:');
        console.log('  debug.config("traceEnabled", true)');
        console.log('  debug.stack("setInterval")');
        console.log('  debugLog("WARN", "テストメッセージ", {data: "example"})');
        console.groupEnd();
    }
    
    /**
     * システム終了
     */
    cleanup() {
        console.log('🧹 デバッグツール終了処理...');
        
        this.isActive = false;
        
        // データクリア
        this.diagnostics.codePatterns.clear();
        this.diagnostics.performanceMetrics = [];
        this.diagnostics.callStacks.clear();
        this.diagnostics.eventMetrics.clear();
        this.diagnostics.resourceUsage = [];
        
        console.log('✅ デバッグツール終了完了');
    }
}

// グローバル変数として設定
window.loopDebugTools = null;

/**
 * デバッグツール起動関数
 */
function startInfiniteLoopDebugTools(config = {}) {
    if (window.loopDebugTools) {
        console.log('⚠️ デバッグツールは既に起動しています');
        return window.loopDebugTools;
    }
    
    window.loopDebugTools = new InfiniteLoopDebugTools();
    
    // 設定のカスタマイズ
    if (config.traceEnabled !== undefined) {
        window.loopDebugTools.debug.traceEnabled = config.traceEnabled;
    }
    
    if (config.logThreshold) {
        window.loopDebugTools.debug.logThreshold = config.logThreshold;
    }
    
    return window.loopDebugTools;
}

/**
 * デバッグツール停止関数
 */
function stopInfiniteLoopDebugTools() {
    if (window.loopDebugTools) {
        window.loopDebugTools.cleanup();
        window.loopDebugTools = null;
        console.log('🛑 デバッグツールが停止されました');
    }
}

// DOM読み込み完了時に自動起動
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 DOM読み込み完了 - デバッグツール自動起動');
    startInfiniteLoopDebugTools({
        traceEnabled: false,    // デフォルトは無効
        logThreshold: 'WARN'    // 警告レベル以上
    });
});

// 即座起動も対応
if (document.readyState === 'loading') {
    // DOMContentLoadedを待つ
} else {
    // 既にDOM読み込み完了
    startInfiniteLoopDebugTools({
        traceEnabled: false,
        logThreshold: 'WARN'
    });
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InfiniteLoopDebugTools, startInfiniteLoopDebugTools, stopInfiniteLoopDebugTools };
}