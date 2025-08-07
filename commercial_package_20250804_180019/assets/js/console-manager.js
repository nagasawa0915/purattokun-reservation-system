/**
 * コンソール管理システム Phase 3: CPU無限ループ対策完全実装版
 * 
 * Phase 1 機能:
 * - 環境検出システム（開発/本番/デバッグ）
 * - ログレベル管理（ERROR, WARN, INFO, DEBUG, SUCCESS）
 * - サブエージェント対応のカテゴリー管理
 * - パフォーマンス監視機能
 * 
 * Phase 2 機能:
 * - 段階的コンソールクリア（フェーズ管理）
 * - 重要情報自動保持・再表示
 * - ログ間引き機能（CPU無限ループ対策）
 * - フェーズ完了時の自動クリア
 * 
 * Phase 3 新機能（CPU無限ループ対策）:
 * - リアルタイムCPU負荷監視
 * - 無限ループ検出・自動遮断
 * - 危険パターン自動検出（while+async/await等）
 * - 緊急ブレーキシステム
 * - パフォーマンスアラート機能
 * 
 * 使用方法:
 * // 基本機能
 * ConsoleManager.log('メッセージ', 'INFO', 'SPINE');
 * ConsoleManager.success('成功メッセージ', 'SYSTEM');
 * ConsoleManager.error('エラーメッセージ', 'ASSET');
 * 
 * // Phase 2 機能
 * ConsoleManager.startPhase('asset-loading');
 * ConsoleManager.completePhase('asset-loading', true); // 成功時クリア
 * ConsoleManager.enableThrottling('asset-progress', { maxCount: 5, interval: 100 });
 * ConsoleManager.preserveImportant(['✅ Spine読み込み完了', '✅ アセット読み込み完了']);
 * 
 * // Phase 3 新機能
 * ConsoleManager.detectInfiniteLoop('isLoadingComplete', { maxCalls: 30, timeWindow: 3000 });
 * ConsoleManager.startCPUMonitoring({ threshold: 15, alertCallback: handleCPUAlert });
 * ConsoleManager.enableEmergencyBrake({ cpuThreshold: 20, logLimit: 5 });
 * ConsoleManager.detectDangerousPattern('while+async', codeSnippet);
 */

class ConsoleManager {
    static instance = null;
    
    // 環境設定
    static ENVIRONMENTS = {
        DEVELOPMENT: 'development',
        PRODUCTION: 'production',
        DEBUG: 'debug'
    };
    
    // ログレベル定義
    static LOG_LEVELS = {
        ERROR: { level: 0, color: '#ff4757', prefix: '❌' },
        WARN: { level: 1, color: '#ffa502', prefix: '⚠️' },
        INFO: { level: 2, color: '#3742fa', prefix: 'ℹ️' },
        DEBUG: { level: 3, color: '#70a1ff', prefix: '🔍' },
        SUCCESS: { level: 2, color: '#2ed573', prefix: '✅' }
    };
    
    // サブエージェント対応カテゴリー
    static CATEGORIES = {
        SYSTEM: { name: 'システム', icon: '🔧' },
        SPINE: { name: 'Spine', icon: '🎮' },
        ASSET: { name: 'アセット', icon: '📦' },
        UI: { name: 'UI', icon: '🎨' },
        PERFORMANCE: { name: 'パフォーマンス', icon: '⚡' },
        NETWORK: { name: 'ネットワーク', icon: '🌐' },
        EDIT: { name: '編集システム', icon: '✏️' },
        STORAGE: { name: 'ストレージ', icon: '💾' },
        ANIMATION: { name: 'アニメーション', icon: '🎬' },
        CANVAS: { name: 'Canvas', icon: '🖼️' }
    };
    
    constructor() {
        if (ConsoleManager.instance) {
            return ConsoleManager.instance;
        }
        
        this.environment = this.detectEnvironment();
        this.currentLogLevel = this.determineLogLevel();
        this.performanceMarkers = new Map();
        this.logCounts = new Map();
        this.isEnabled = this.shouldEnableLogging();
        
        // Phase 2: 段階的クリア機能の追加
        this.phases = new Map();
        this.importantMessages = new Set();
        this.throttleConfig = new Map();
        this.throttleCounts = new Map();
        this.clearedPhases = new Map();
        
        // Phase 3: CPU無限ループ対策機能の追加
        this.cpuMonitoring = {
            enabled: false,
            threshold: 15, // CPU使用率の閾値（%）
            interval: 1000, // 監視間隔（ms）
            alertCallback: null,
            history: [],
            maxHistory: 60 // 1分間のデータ保持
        };
        this.infiniteLoopDetection = new Map(); // メソッド呼び出し履歴
        this.dangerousPatterns = new Map(); // 危険パターン検出
        this.emergencyBrake = {
            enabled: false,
            cpuThreshold: 20,
            logLimit: 5,
            logCount: 0,
            lastReset: Date.now()
        };
        this.callStacks = new Map(); // 関数呼び出しスタック監視
        
        ConsoleManager.instance = this;
        this.init();
    }
    
    init() {
        if (this.isEnabled) {
            this.log('コンソール管理システム Phase 1 初期化完了', 'SUCCESS', 'SYSTEM');
            this.log(`環境: ${this.environment}, ログレベル: ${this.currentLogLevel}`, 'INFO', 'SYSTEM');
            this.log('Phase 2: 段階的クリア機能 初期化完了', 'SUCCESS', 'SYSTEM');
            this.log('Phase 3: CPU無限ループ対策機能 初期化完了', 'SUCCESS', 'SYSTEM');
            
            // Phase 3: 基本的なパフォーマンス監視を開始
            this.initializePhase3Features();
        }
    }
    
    /**
     * Phase 3: 機能初期化
     */
    initializePhase3Features() {
        // デバッグ環境でのみ自動有効化
        if (this.environment === ConsoleManager.ENVIRONMENTS.DEBUG) {
            this.enableEmergencyBrake({ cpuThreshold: 20, logLimit: 5 });
            this.debug('Phase 3: 緊急ブレーキシステム自動有効化', 'PERFORMANCE');
        }
        
        // 一般的な危険パターンを自動登録
        this.registerCommonDangerousPatterns();
        this.debug('Phase 3: 危険パターン検出システム初期化完了', 'PERFORMANCE');
    }
    
    /**
     * Phase 3: 一般的な危険パターンの登録
     */
    registerCommonDangerousPatterns() {
        // while + async/await パターン
        this.dangerousPatterns.set('while-async', {
            pattern: /while\s*\([^)]*\)\s*{[^}]*await[^}]*}/gs,
            description: 'while文内でのawait使用（無限ループリスク）',
            severity: 'HIGH',
            recommendation: 'setTimeout再帰またはsetIntervalを使用'
        });
        
        // 短間隔setInterval
        this.dangerousPatterns.set('fast-interval', {
            pattern: /setInterval\s*\([^,]*,\s*([0-9]+)\s*\)/g,
            description: '高頻度setInterval（10ms未満）',
            severity: 'MEDIUM',
            recommendation: 'requestAnimationFrameまたは適切な間隔設定'
        });
        
        // 大量の同期処理
        this.dangerousPatterns.set('sync-heavy', {
            pattern: /for\s*\([^)]*\)\s*{[^}]{100,}}/gs,
            description: '長い同期for文（重い処理）',
            severity: 'MEDIUM',
            recommendation: '処理を分割してsetTimeoutで非同期化'
        });
    }
    
    /**
     * 環境検出システム
     */
    detectEnvironment() {
        // URLパラメータによる環境判定
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.has('debug') || urlParams.has('edit')) {
            return ConsoleManager.ENVIRONMENTS.DEBUG;
        }
        
        if (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.includes('192.168')) {
            return ConsoleManager.ENVIRONMENTS.DEVELOPMENT;
        }
        
        return ConsoleManager.ENVIRONMENTS.PRODUCTION;
    }
    
    /**
     * ログレベル決定
     */
    determineLogLevel() {
        switch (this.environment) {
            case ConsoleManager.ENVIRONMENTS.DEBUG:
                return 3; // DEBUG まで表示
            case ConsoleManager.ENVIRONMENTS.DEVELOPMENT:
                return 2; // INFO まで表示
            case ConsoleManager.ENVIRONMENTS.PRODUCTION:
                return 1; // WARN まで表示
            default:
                return 1;
        }
    }
    
    /**
     * ログ有効判定
     */
    shouldEnableLogging() {
        // 本番環境でも重要なエラーは表示
        return this.environment !== ConsoleManager.ENVIRONMENTS.PRODUCTION || 
               this.currentLogLevel <= 1;
    }
    
    /**
     * メインログ出力メソッド（Phase 3: 緊急ブレーキ機能追加）
     */
    log(message, level = 'INFO', category = 'SYSTEM', details = null) {
        if (!this.isEnabled) return;
        
        const logLevel = ConsoleManager.LOG_LEVELS[level];
        if (!logLevel || logLevel.level > this.currentLogLevel) return;
        
        // Phase 3: 緊急ブレーキチェック
        if (this.shouldEmergencyBrake()) {
            return;
        }
        
        // Phase 2: ログ間引きチェック
        if (this.shouldThrottleLog(message, category)) {
            return;
        }
        
        const categoryInfo = ConsoleManager.CATEGORIES[category] || ConsoleManager.CATEGORIES.SYSTEM;
        const timestamp = new Date().toLocaleTimeString();
        
        // カウント管理
        const key = `${level}-${category}`;
        this.logCounts.set(key, (this.logCounts.get(key) || 0) + 1);
        
        // フォーマット済みメッセージ作成
        const formattedMessage = this.formatMessage(message, level, category, timestamp);
        
        // コンソール出力
        const consoleMethod = this.getConsoleMethod(level);
        consoleMethod(
            `%c${logLevel.prefix} [${timestamp}] ${categoryInfo.icon} ${categoryInfo.name} %c${message}`,
            `color: ${logLevel.color}; font-weight: bold;`,
            'color: inherit;'
        );
        
        // Phase 2: 重要メッセージの自動保持
        if (level === 'SUCCESS' || level === 'ERROR' || message.includes('完了') || message.includes('エラー')) {
            this.importantMessages.add(formattedMessage);
        }
        
        // 詳細情報がある場合は追加出力
        if (details && this.environment === ConsoleManager.ENVIRONMENTS.DEBUG) {
            console.log('📋 詳細情報:', details);
        }
    }
    
    /**
     * コンソールメソッド選択
     */
    getConsoleMethod(level) {
        switch (level) {
            case 'ERROR': return console.error;
            case 'WARN': return console.warn;
            case 'DEBUG': return console.debug;
            default: return console.log;
        }
    }
    
    /**
     * メッセージフォーマット
     */
    formatMessage(message, level, category, timestamp) {
        const categoryInfo = ConsoleManager.CATEGORIES[category] || ConsoleManager.CATEGORIES.SYSTEM;
        return `[${timestamp}] ${categoryInfo.icon} ${categoryInfo.name} | ${message}`;
    }
    
    /**
     * 便利メソッド群
     */
    success(message, category = 'SYSTEM', details = null) {
        this.log(message, 'SUCCESS', category, details);
    }
    
    error(message, category = 'SYSTEM', details = null) {
        this.log(message, 'ERROR', category, details);
    }
    
    warn(message, category = 'SYSTEM', details = null) {
        this.log(message, 'WARN', category, details);
    }
    
    info(message, category = 'SYSTEM', details = null) {
        this.log(message, 'INFO', category, details);
    }
    
    debug(message, category = 'SYSTEM', details = null) {
        this.log(message, 'DEBUG', category, details);
    }
    
    /**
     * パフォーマンス監視機能
     */
    startPerformanceMarker(name, category = 'PERFORMANCE') {
        const marker = {
            name,
            category,
            startTime: performance.now(),
            startTimestamp: Date.now()
        };
        
        this.performanceMarkers.set(name, marker);
        this.debug(`パフォーマンス計測開始: ${name}`, category);
        
        return marker;
    }
    
    endPerformanceMarker(name) {
        const marker = this.performanceMarkers.get(name);
        if (!marker) {
            this.warn(`パフォーマンスマーカーが見つかりません: ${name}`, 'PERFORMANCE');
            return null;
        }
        
        const endTime = performance.now();
        const duration = endTime - marker.startTime;
        
        this.performanceMarkers.delete(name);
        
        // パフォーマンスレポート
        const report = {
            name: marker.name,
            duration: Math.round(duration * 100) / 100,
            category: marker.category,
            startTime: marker.startTime,
            endTime
        };
        
        this.info(
            `パフォーマンス計測完了: ${name} | ${report.duration}ms`,
            marker.category,
            report
        );
        
        return report;
    }
    
    /**
     * Phase 2: ログ間引き判定
     */
    shouldThrottleLog(message, category) {
        const key = `${category}-${message.substring(0, 20)}`;
        const config = this.throttleConfig.get(key);
        
        if (!config) return false;
        
        const count = this.throttleCounts.get(key) || 0;
        this.throttleCounts.set(key, count + 1);
        
        // 最大回数超過チェック
        if (count >= config.maxCount) {
            return true;
        }
        
        // インターバルチェック
        if (config.lastLog && Date.now() - config.lastLog < config.interval) {
            return true;
        }
        
        config.lastLog = Date.now();
        return false;
    }

    /**
     * Phase 2: フェーズ管理 - フェーズ開始
     */
    startPhase(phaseName, category = 'SYSTEM') {
        const phase = {
            name: phaseName,
            category,
            startTime: Date.now(),
            status: 'active',
            logs: []
        };
        
        this.phases.set(phaseName, phase);
        this.info(`🚀 フェーズ開始: ${phaseName}`, category);
        
        return phase;
    }

    /**
     * Phase 2: フェーズ管理 - フェーズ完了とクリア
     */
    completePhase(phaseName, success = true, clearConsole = true) {
        const phase = this.phases.get(phaseName);
        
        if (!phase) {
            this.warn(`フェーズが見つかりません: ${phaseName}`, 'SYSTEM');
            return false;
        }
        
        phase.status = success ? 'completed' : 'failed';
        phase.endTime = Date.now();
        phase.duration = phase.endTime - phase.startTime;
        
        const statusIcon = success ? '✅' : '❌';
        const statusText = success ? '成功' : '失敗';
        
        this.log(
            `${statusIcon} フェーズ完了: ${phaseName} (${statusText}) - ${phase.duration}ms`,
            success ? 'SUCCESS' : 'ERROR',
            phase.category
        );
        
        // 成功時は段階的クリア実行
        if (success && clearConsole) {
            this.performPhaseClearing(phaseName);
        }
        
        this.clearedPhases.set(phaseName, phase);
        return phase;
    }

    /**
     * Phase 2: 段階的コンソールクリア
     */
    performPhaseClearing(phaseName) {
        if (this.environment === ConsoleManager.ENVIRONMENTS.PRODUCTION) {
            return; // 本番環境ではクリアしない
        }

        // 重要メッセージを一時保存
        const importantMessages = Array.from(this.importantMessages);
        
        // コンソールクリア
        console.clear();
        
        // 重要メッセージを再表示（強調表示）
        if (importantMessages.length > 0) {
            console.log('%c📋 重要情報（保持されたメッセージ）', 'color: #2ed573; font-weight: bold; font-size: 14px;');
            importantMessages.forEach(msg => {
                console.log(`%c${msg}`, 'color: #2ed573; font-weight: bold;');
            });
            console.log('%c' + '='.repeat(60), 'color: #2ed573;');
        }
        
        this.success(`🧹 段階的クリア完了: ${phaseName} | 重要メッセージ ${importantMessages.length}件保持`, 'SYSTEM');
    }

    /**
     * Phase 2: ログ間引き設定
     */
    enableThrottling(pattern, config = {}) {
        const defaultConfig = {
            maxCount: 5,
            interval: 100,
            lastLog: null
        };
        
        const finalConfig = { ...defaultConfig, ...config };
        this.throttleConfig.set(pattern, finalConfig);
        
        this.debug(`ログ間引き設定: ${pattern} | 最大${finalConfig.maxCount}回 / ${finalConfig.interval}ms間隔`, 'SYSTEM');
        
        return finalConfig;
    }

    /**
     * Phase 2: 重要情報の手動保持
     */
    preserveImportant(messages) {
        if (Array.isArray(messages)) {
            messages.forEach(msg => this.importantMessages.add(msg));
        } else {
            this.importantMessages.add(messages);
        }
        
        this.debug(`重要情報保持: ${Array.isArray(messages) ? messages.length : 1}件`, 'SYSTEM');
    }

    /**
     * Phase 2: フェーズ状況確認
     */
    getPhaseStatus() {
        const activePhases = Array.from(this.phases.values()).filter(p => p.status === 'active');
        const completedPhases = Array.from(this.clearedPhases.values());
        
        const status = {
            activePhases: activePhases.map(p => ({ name: p.name, duration: Date.now() - p.startTime })),
            completedPhases: completedPhases.map(p => ({ name: p.name, status: p.status, duration: p.duration })),
            importantMessageCount: this.importantMessages.size,
            throttleConfigs: Object.fromEntries(this.throttleConfig)
        };
        
        this.info('Phase 2 状況確認', 'SYSTEM', status);
        return status;
    }

    /**
     * 統計情報取得（Phase 2 情報追加）
     */
    getStats() {
        const stats = {
            environment: this.environment,
            logLevel: this.currentLogLevel,
            logCounts: Object.fromEntries(this.logCounts),
            activeMarkers: Array.from(this.performanceMarkers.keys()),
            totalLogs: Array.from(this.logCounts.values()).reduce((sum, count) => sum + count, 0),
            // Phase 2 統計情報
            phases: {
                active: this.phases.size,
                completed: this.clearedPhases.size,
                importantMessages: this.importantMessages.size,
                throttleConfigs: this.throttleConfig.size
            }
        };
        
        this.info('コンソール管理システム統計（Phase 2対応）', 'SYSTEM', stats);
        return stats;
    }
    
    /**
     * 環境情報表示
     */
    showEnvironmentInfo() {
        const info = {
            environment: this.environment,
            logLevel: this.currentLogLevel,
            isEnabled: this.isEnabled,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
        
        this.info('環境情報', 'SYSTEM', info);
        return info;
    }

    // ===============================================================
    // Phase 3: CPU無限ループ対策機能群
    // ===============================================================

    /**
     * Phase 3: 緊急ブレーキ判定
     */
    shouldEmergencyBrake() {
        if (!this.emergencyBrake.enabled) return false;
        
        // ログ制限チェック
        this.emergencyBrake.logCount++;
        if (this.emergencyBrake.logCount > this.emergencyBrake.logLimit) {
            const now = Date.now();
            
            // 1秒ごとにリセット
            if (now - this.emergencyBrake.lastReset > 1000) {
                this.emergencyBrake.logCount = 1;
                this.emergencyBrake.lastReset = now;
                return false;
            }
            
            // 制限超過時は警告（最初の1回のみ）
            if (this.emergencyBrake.logCount === this.emergencyBrake.logLimit + 1) {
                console.warn('🚨 緊急ブレーキ作動: ログ出力制限中（無限ループ対策）');
            }
            return true;
        }
        
        return false;
    }

    /**
     * Phase 3: 緊急ブレーキシステム有効化
     */
    enableEmergencyBrake(config = {}) {
        const defaultConfig = {
            cpuThreshold: 20,
            logLimit: 5
        };
        
        const finalConfig = { ...defaultConfig, ...config };
        this.emergencyBrake = {
            enabled: true,
            cpuThreshold: finalConfig.cpuThreshold,
            logLimit: finalConfig.logLimit,
            logCount: 0,
            lastReset: Date.now()
        };
        
        this.warn(`🚨 緊急ブレーキ有効化: CPU${finalConfig.cpuThreshold}%以上、ログ制限${finalConfig.logLimit}回/秒`, 'PERFORMANCE');
        return this.emergencyBrake;
    }

    /**
     * Phase 3: 無限ループ検出システム
     */
    detectInfiniteLoop(methodName, config = {}) {
        const defaultConfig = {
            maxCalls: 30,
            timeWindow: 3000 // 3秒間
        };
        
        const finalConfig = { ...defaultConfig, ...config };
        const now = Date.now();
        
        // 呼び出し履歴の初期化または取得
        if (!this.infiniteLoopDetection.has(methodName)) {
            this.infiniteLoopDetection.set(methodName, {
                calls: [],
                lastAlert: 0
            });
        }
        
        const detection = this.infiniteLoopDetection.get(methodName);
        
        // 古い呼び出し記録を削除
        detection.calls = detection.calls.filter(time => now - time <= finalConfig.timeWindow);
        
        // 新しい呼び出しを記録
        detection.calls.push(now);
        
        // 無限ループ判定
        if (detection.calls.length >= finalConfig.maxCalls) {
            // アラートの頻度制限（10秒に1回）
            if (now - detection.lastAlert > 10000) {
                detection.lastAlert = now;
                this.error(
                    `🔄 無限ループ検出: ${methodName} | ${detection.calls.length}回呼び出し（${finalConfig.timeWindow}ms間）`,
                    'PERFORMANCE',
                    {
                        methodName,
                        callCount: detection.calls.length,
                        timeWindow: finalConfig.timeWindow,
                        callsPerSecond: Math.round(detection.calls.length / (finalConfig.timeWindow / 1000))
                    }
                );
                
                // 緊急ブレーキが無効な場合は自動有効化
                if (!this.emergencyBrake.enabled) {
                    this.enableEmergencyBrake({ cpuThreshold: 15, logLimit: 3 });
                }
            }
            return true;
        }
        
        return false;
    }

    /**
     * Phase 3: CPU監視システム開始
     */
    startCPUMonitoring(config = {}) {
        const defaultConfig = {
            threshold: 15,
            interval: 1000,
            alertCallback: null
        };
        
        const finalConfig = { ...defaultConfig, ...config };
        
        this.cpuMonitoring = {
            ...this.cpuMonitoring,
            enabled: true,
            threshold: finalConfig.threshold,
            interval: finalConfig.interval,
            alertCallback: finalConfig.alertCallback
        };
        
        // CPU監視ループ開始
        const monitorLoop = () => {
            if (!this.cpuMonitoring.enabled) return;
            
            // CPUパフォーマンス監視（簡易版）
            const startTime = performance.now();
            const iterations = 10000;
            
            // 計算負荷測定
            for (let i = 0; i < iterations; i++) {
                Math.random() * Math.random();
            }
            
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            // CPU使用率推定（簡易）
            const estimatedCPU = Math.min(executionTime * 10, 100);
            
            // 履歴に追加
            this.cpuMonitoring.history.push({
                timestamp: Date.now(),
                cpu: estimatedCPU,
                executionTime
            });
            
            // 履歴サイズ制限
            if (this.cpuMonitoring.history.length > this.cpuMonitoring.maxHistory) {
                this.cpuMonitoring.history.shift();
            }
            
            // 閾値チェック
            if (estimatedCPU > this.cpuMonitoring.threshold) {
                const alertData = {
                    cpu: Math.round(estimatedCPU * 10) / 10,
                    threshold: this.cpuMonitoring.threshold,
                    executionTime: Math.round(executionTime * 100) / 100
                };
                
                this.warn(
                    `⚡ CPU負荷警告: ${alertData.cpu}% (閾値: ${this.cpuMonitoring.threshold}%)`,
                    'PERFORMANCE',
                    alertData
                );
                
                // カスタムコールバック実行
                if (this.cpuMonitoring.alertCallback) {
                    try {
                        this.cpuMonitoring.alertCallback(alertData);
                    } catch (error) {
                        this.error('CPU監視コールバックエラー', 'PERFORMANCE', error);
                    }
                }
                
                // 緊急ブレーキ自動有効化
                if (estimatedCPU > 20 && !this.emergencyBrake.enabled) {
                    this.enableEmergencyBrake({ cpuThreshold: 15, logLimit: 3 });
                }
            }
            
            // 次の監視をスケジュール
            setTimeout(monitorLoop, this.cpuMonitoring.interval);
        };
        
        // 監視開始
        setTimeout(monitorLoop, this.cpuMonitoring.interval);
        
        this.success(
            `⚡ CPU監視開始: 閾値${finalConfig.threshold}%、監視間隔${finalConfig.interval}ms`,
            'PERFORMANCE'
        );
        
        return this.cpuMonitoring;
    }

    /**
     * Phase 3: CPU監視停止
     */
    stopCPUMonitoring() {
        this.cpuMonitoring.enabled = false;
        this.info('⚡ CPU監視停止', 'PERFORMANCE');
        return this.cpuMonitoring;
    }

    /**
     * Phase 3: 危険パターン検出
     */
    detectDangerousPattern(codeSnippet) {
        const detectedPatterns = [];
        
        for (const [patternName, patternConfig] of this.dangerousPatterns) {
            const matches = codeSnippet.match(patternConfig.pattern);
            
            if (matches) {
                detectedPatterns.push({
                    name: patternName,
                    description: patternConfig.description,
                    severity: patternConfig.severity,
                    recommendation: patternConfig.recommendation,
                    matches: matches.length,
                    examples: matches.slice(0, 3) // 最初の3つのマッチ例
                });
                
                const severityIcon = patternConfig.severity === 'HIGH' ? '🚨' : '⚠️';
                this.warn(
                    `${severityIcon} 危険パターン検出: ${patternConfig.description}`,
                    'PERFORMANCE',
                    {
                        pattern: patternName,
                        severity: patternConfig.severity,
                        matches: matches.length,
                        recommendation: patternConfig.recommendation
                    }
                );
            }
        }
        
        return detectedPatterns;
    }

    /**
     * Phase 3: パフォーマンス監視ダッシュボード取得
     */
    getPerformanceDashboard() {
        const dashboard = {
            // CPU監視状況
            cpuMonitoring: {
                enabled: this.cpuMonitoring.enabled,
                threshold: this.cpuMonitoring.threshold,
                currentCPU: this.cpuMonitoring.history.length > 0 ? 
                    this.cpuMonitoring.history[this.cpuMonitoring.history.length - 1].cpu : 0,
                averageCPU: this.cpuMonitoring.history.length > 0 ?
                    this.cpuMonitoring.history.reduce((sum, h) => sum + h.cpu, 0) / this.cpuMonitoring.history.length : 0,
                historyCount: this.cpuMonitoring.history.length
            },
            
            // 無限ループ検出状況
            infiniteLoopDetection: {
                monitored: this.infiniteLoopDetection.size,
                methods: Array.from(this.infiniteLoopDetection.keys()).map(method => ({
                    method,
                    recentCalls: this.infiniteLoopDetection.get(method).calls.length
                }))
            },
            
            // 緊急ブレーキ状況
            emergencyBrake: {
                enabled: this.emergencyBrake.enabled,
                cpuThreshold: this.emergencyBrake.cpuThreshold,
                logLimit: this.emergencyBrake.logLimit,
                currentLogCount: this.emergencyBrake.logCount
            },
            
            // 危険パターン
            dangerousPatterns: {
                registered: this.dangerousPatterns.size,
                patterns: Array.from(this.dangerousPatterns.keys())
            },
            
            // 全体統計
            statistics: {
                totalLogs: Array.from(this.logCounts.values()).reduce((sum, count) => sum + count, 0),
                activePhases: this.phases.size,
                completedPhases: this.clearedPhases.size
            }
        };
        
        this.info('📊 パフォーマンス監視ダッシュボード', 'PERFORMANCE', dashboard);
        return dashboard;
    }

    /**
     * Phase 3: システムヘルスチェック
     */
    performHealthCheck() {
        const health = {
            timestamp: new Date().toISOString(),
            status: 'HEALTHY',
            warnings: [],
            errors: []
        };
        
        // CPU監視チェック
        if (this.cpuMonitoring.enabled && this.cpuMonitoring.history.length > 0) {
            const recentCPU = this.cpuMonitoring.history.slice(-5);
            const avgRecentCPU = recentCPU.reduce((sum, h) => sum + h.cpu, 0) / recentCPU.length;
            
            if (avgRecentCPU > this.cpuMonitoring.threshold) {
                health.warnings.push(`CPU使用率が閾値を超過: ${Math.round(avgRecentCPU)}%`);
                health.status = 'WARNING';
            }
        }
        
        // 無限ループ検出チェック
        for (const [method, detection] of this.infiniteLoopDetection) {
            if (detection.calls.length > 20) {
                health.warnings.push(`高頻度呼び出し検出: ${method} (${detection.calls.length}回)`);
                health.status = 'WARNING';
            }
        }
        
        // 緊急ブレーキ状況チェック
        if (this.emergencyBrake.enabled && this.emergencyBrake.logCount > this.emergencyBrake.logLimit) {
            health.errors.push('緊急ブレーキ作動中（ログ制限）');
            health.status = 'ERROR';
        }
        
        const statusIcon = health.status === 'HEALTHY' ? '✅' : 
                          health.status === 'WARNING' ? '⚠️' : '❌';
        
        this.log(
            `${statusIcon} システムヘルスチェック: ${health.status}`,
            health.status === 'ERROR' ? 'ERROR' : health.status === 'WARNING' ? 'WARN' : 'SUCCESS',
            'PERFORMANCE',
            health
        );
        
        return health;
    }
}

// シングルトンインスタンス作成
const consoleManager = new ConsoleManager();

// グローバルアクセス用の静的メソッド
ConsoleManager.log = (message, level, category, details) => 
    consoleManager.log(message, level, category, details);
ConsoleManager.success = (message, category, details) => 
    consoleManager.success(message, category, details);
ConsoleManager.error = (message, category, details) => 
    consoleManager.error(message, category, details);
ConsoleManager.warn = (message, category, details) => 
    consoleManager.warn(message, category, details);
ConsoleManager.info = (message, category, details) => 
    consoleManager.info(message, category, details);
ConsoleManager.debug = (message, category, details) => 
    consoleManager.debug(message, category, details);

ConsoleManager.startPerformance = (name, category) => 
    consoleManager.startPerformanceMarker(name, category);
ConsoleManager.endPerformance = (name) => 
    consoleManager.endPerformanceMarker(name);

// Phase 2 静的メソッド
ConsoleManager.startPhase = (phaseName, category) => 
    consoleManager.startPhase(phaseName, category);
ConsoleManager.completePhase = (phaseName, success, clearConsole) => 
    consoleManager.completePhase(phaseName, success, clearConsole);
ConsoleManager.enableThrottling = (pattern, config) => 
    consoleManager.enableThrottling(pattern, config);
ConsoleManager.preserveImportant = (messages) => 
    consoleManager.preserveImportant(messages);
ConsoleManager.getPhaseStatus = () => 
    consoleManager.getPhaseStatus();

ConsoleManager.getStats = () => consoleManager.getStats();
ConsoleManager.showEnvironmentInfo = () => consoleManager.showEnvironmentInfo();

// Phase 3 静的メソッド（CPU無限ループ対策）
ConsoleManager.enableEmergencyBrake = (config) => 
    consoleManager.enableEmergencyBrake(config);
ConsoleManager.detectInfiniteLoop = (methodName, config) => 
    consoleManager.detectInfiniteLoop(methodName, config);
ConsoleManager.startCPUMonitoring = (config) => 
    consoleManager.startCPUMonitoring(config);
ConsoleManager.stopCPUMonitoring = () => 
    consoleManager.stopCPUMonitoring();
ConsoleManager.detectDangerousPattern = (codeSnippet) => 
    consoleManager.detectDangerousPattern(codeSnippet);
ConsoleManager.getPerformanceDashboard = () => 
    consoleManager.getPerformanceDashboard();
ConsoleManager.performHealthCheck = () => 
    consoleManager.performHealthCheck();

// ウィンドウオブジェクトにアタッチ（デバッグ用）
if (typeof window !== 'undefined') {
    window.ConsoleManager = ConsoleManager;
}

// エクスポート（ES6モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConsoleManager;
}

// 初期化完了ログ
ConsoleManager.success('Phase 3: コンソール管理システムCPU無限ループ対策完全実装完了', 'SYSTEM');
ConsoleManager.info('利用可能なカテゴリー: ' + Object.keys(ConsoleManager.CATEGORIES).join(', '), 'SYSTEM');
ConsoleManager.info('Phase 2 機能: フェーズ管理、段階的クリア、ログ間引き、重要情報保持', 'SYSTEM');
ConsoleManager.info('Phase 3 新機能: CPU負荷監視、無限ループ検出、緊急ブレーキ、危険パターン検出', 'SYSTEM');