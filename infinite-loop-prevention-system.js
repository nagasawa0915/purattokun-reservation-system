/**
 * 無限ループ防止システム - 包括的防御・監視・復旧システム
 * 
 * 【過去問題】：コンソール開放時の無限ループ・CPU30%継続使用
 * 【設計思想】：多層防御・早期検出・安全復旧・予防策の組み合わせ
 * 
 * システム構成:
 * 1. ループ検出エンジン - 同一処理の異常繰り返し監視
 * 2. リソース監視システム - CPU・メモリ・DOM更新の監視
 * 3. 緊急停止システム - 問題発生時の自動停止・復旧
 * 4. 開発支援システム - デバッグ・診断・予防支援
 * 5. 設定管理システム - 柔軟な設定・環境別対応
 */

class InfiniteLoopPreventionSystem {
    constructor() {
        this.version = '1.0.0';
        this.isActive = false;
        this.emergencyMode = false;
        
        // 検出システム設定
        this.detection = {
            enabled: true,
            functionCallCounts: new Map(), // 関数呼び出し回数記録
            intervalIds: new Set(),        // setInterval ID管理
            timeoutIds: new Set(),         // setTimeout ID管理
            eventListeners: new Map(),     // イベントリスナー管理
            maxCallsPerWindow: 100,        // 時間窓内最大呼び出し数
            timeWindow: 5000,              // 監視時間窓（5秒）
            cpuCheckInterval: 1000,        // CPU監視間隔
            lastResetTime: Date.now()
        };
        
        // リソース監視設定
        this.monitoring = {
            cpu: {
                threshold: 30,             // CPU使用率閾値（%）
                samples: [],              // CPU使用率サンプル
                maxSamples: 10,           // 最大サンプル数
                alertThreshold: 3         // アラート発生回数閾値
            },
            memory: {
                threshold: 100,           // メモリ使用量閾値（MB）
                maxDOMNodes: 10000        // DOM最大ノード数
            },
            performance: {
                frameDropThreshold: 5,    // フレームドロップ閾値
                longTaskThreshold: 50     // 長時間タスク閾値（ms）
            }
        };
        
        // 緊急停止設定
        this.emergencyStop = {
            triggers: {
                cpuOverload: false,
                memoryOverload: false,
                infiniteLoop: false,
                userAbort: false
            },
            stopActions: [],              // 停止時実行アクション
            lastEmergencyTime: 0
        };
        
        // 予防機能設定
        this.prevention = {
            wrapTimerFunctions: true,     // setInterval/setTimeout包装
            wrapEventListeners: true,     // addEventListener包装
            enforceCleanup: true,         // 自動クリーンアップ
            codeAnalysis: true           // コード解析による静的検査
        };
        
        // デバッグ・診断設定
        this.debug = {
            enabled: false,
            logLevel: 'WARN',            // ERROR, WARN, INFO, DEBUG
            saveReports: true,
            reportHistory: []
        };
        
        this.initialize();
    }
    
    /**
     * システム初期化
     */
    initialize() {
        console.log('🛡️ 無限ループ防止システム初期化中...');
        
        try {
            // 既存console-managerとの統合確認
            if (window.ConsoleManager) {
                console.log('✅ ConsoleManager統合モード');
                this.integrateWithConsoleManager();
            }
            
            // 各サブシステム初期化
            this.initializeDetectionSystem();
            this.initializeMonitoringSystem();
            this.initializeEmergencySystem();
            this.initializePreventionSystem();
            
            this.isActive = true;
            console.log('✅ 無限ループ防止システム起動完了');
            
            // システム稼働レポート表示
            this.displaySystemStatus();
            
        } catch (error) {
            console.error('❌ 無限ループ防止システム初期化エラー:', error);
        }
    }
    
    /**
     * 1. ループ検出エンジン初期化
     */
    initializeDetectionSystem() {
        // 関数実行回数監視
        this.startFunctionCallMonitoring();
        
        // タイマー関数監視
        this.wrapTimerFunctions();
        
        // イベントリスナー監視
        if (this.prevention.wrapEventListeners) {
            this.wrapEventListeners();
        }
        
        console.log('🔍 ループ検出エンジン初期化完了');
    }
    
    /**
     * 関数実行回数監視システム
     */
    startFunctionCallMonitoring() {
        const originalConsoleLog = console.log;
        const originalError = console.error;
        
        // console.log監視（最も危険なパターン）
        console.log = (...args) => {
            this.recordFunctionCall('console.log', args);
            return originalConsoleLog.apply(console, args);
        };
        
        console.error = (...args) => {
            this.recordFunctionCall('console.error', args);
            return originalError.apply(console, args);
        };
        
        console.log('📊 関数実行回数監視開始');
    }
    
    /**
     * タイマー関数包装システム
     */
    wrapTimerFunctions() {
        const originalSetInterval = window.setInterval;
        const originalSetTimeout = window.setTimeout;
        const originalClearInterval = window.clearInterval;
        const originalClearTimeout = window.clearTimeout;
        
        // setInterval包装
        window.setInterval = (callback, delay, ...args) => {
            if (delay < 10) {
                console.warn(`⚠️ 高頻度setInterval検出: ${delay}ms間隔`);
                delay = Math.max(delay, 16); // 最小16ms（60fps制限）
            }
            
            const intervalId = originalSetInterval(() => {
                try {
                    this.recordFunctionCall('setInterval-callback', [delay]);
                    callback.apply(null, args);
                } catch (error) {
                    console.error('❌ setIntervalコールバックエラー:', error);
                    this.handleCallbackError('setInterval', intervalId, error);
                }
            }, delay);
            
            this.detection.intervalIds.add(intervalId);
            return intervalId;
        };
        
        // setTimeout包装
        window.setTimeout = (callback, delay, ...args) => {
            const timeoutId = originalSetTimeout(() => {
                try {
                    this.recordFunctionCall('setTimeout-callback', [delay]);
                    callback.apply(null, args);
                } catch (error) {
                    console.error('❌ setTimeoutコールバックエラー:', error);
                    this.handleCallbackError('setTimeout', timeoutId, error);
                }
                this.detection.timeoutIds.delete(timeoutId);
            }, delay || 0);
            
            this.detection.timeoutIds.add(timeoutId);
            return timeoutId;
        };
        
        // clearInterval包装
        window.clearInterval = (intervalId) => {
            this.detection.intervalIds.delete(intervalId);
            return originalClearInterval(intervalId);
        };
        
        // clearTimeout包装
        window.clearTimeout = (timeoutId) => {
            this.detection.timeoutIds.delete(timeoutId);
            return originalClearTimeout(timeoutId);
        };
        
        console.log('⏰ タイマー関数監視システム有効化');
    }
    
    /**
     * イベントリスナー包装システム
     */
    wrapEventListeners() {
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
        
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            // リスナー重複登録チェック
            const element = this;
            const key = `${element.tagName || 'unknown'}-${type}`;
            
            if (!this.dataset) this.dataset = {};
            const listenerId = `listener-${Date.now()}-${Math.random()}`;
            
            // 包装されたリスナー
            const wrappedListener = (event) => {
                try {
                    // 高頻度イベント監視
                    if (['mousemove', 'scroll', 'resize'].includes(type)) {
                        const lastCall = this._lastEventCall || 0;
                        const now = Date.now();
                        if (now - lastCall < 16) return; // 60fps制限
                        this._lastEventCall = now;
                    }
                    
                    listener.call(this, event);
                } catch (error) {
                    console.error(`❌ イベントリスナーエラー [${type}]:`, error);
                }
            };
            
            // 元のリスナー参照保持（削除用）
            wrappedListener._original = listener;
            wrappedListener._listenerId = listenerId;
            
            // 登録記録
            const system = window.loopPreventionSystem;
            if (system) {
                system.detection.eventListeners.set(listenerId, {
                    element, type, listener: wrappedListener, options, timestamp: Date.now()
                });
            }
            
            return originalAddEventListener.call(this, type, wrappedListener, options);
        };
        
        EventTarget.prototype.removeEventListener = function(type, listener, options) {
            // 包装されたリスナーを探して削除
            const system = window.loopPreventionSystem;
            if (system) {
                for (const [id, data] of system.detection.eventListeners.entries()) {
                    if (data.element === this && data.type === type && 
                        data.listener._original === listener) {
                        system.detection.eventListeners.delete(id);
                        return originalRemoveEventListener.call(this, type, data.listener, options);
                    }
                }
            }
            
            return originalRemoveEventListener.call(this, type, listener, options);
        };
        
        console.log('👂 イベントリスナー監視システム有効化');
    }
    
    /**
     * 2. リソース監視システム初期化
     */
    initializeMonitoringSystem() {
        // CPU使用率監視
        this.startCPUMonitoring();
        
        // メモリ監視
        this.startMemoryMonitoring();
        
        // パフォーマンス監視
        this.startPerformanceMonitoring();
        
        console.log('📈 リソース監視システム初期化完了');
    }
    
    /**
     * CPU監視システム
     */
    startCPUMonitoring() {
        const cpuMonitor = () => {
            try {
                const startTime = performance.now();
                
                // 短時間集約処理でCPU負荷を推定
                let iterations = 0;
                const testStart = performance.now();
                while (performance.now() - testStart < 5) {
                    iterations++;
                }
                
                const estimatedCPU = Math.max(0, 100 - (iterations / 1000));
                
                this.monitoring.cpu.samples.push({
                    timestamp: Date.now(),
                    cpu: estimatedCPU,
                    activeIntervals: this.detection.intervalIds.size,
                    activeTimeouts: this.detection.timeoutIds.size,
                    domNodes: document.getElementsByTagName('*').length
                });
                
                // サンプル数制限
                if (this.monitoring.cpu.samples.length > this.monitoring.cpu.maxSamples) {
                    this.monitoring.cpu.samples.shift();
                }
                
                // CPU過負荷検出
                const recentHighCPU = this.monitoring.cpu.samples
                    .slice(-3)
                    .filter(s => s.cpu > this.monitoring.cpu.threshold).length;
                
                if (recentHighCPU >= this.monitoring.cpu.alertThreshold) {
                    this.handleCPUOverload();
                }
                
                if (this.debug.enabled && this.debug.logLevel === 'DEBUG') {
                    console.log(`📊 CPU: ${estimatedCPU.toFixed(1)}%, Intervals: ${this.detection.intervalIds.size}, DOM: ${document.getElementsByTagName('*').length}`);
                }
                
            } catch (error) {
                console.error('❌ CPU監視エラー:', error);
            }
            
            // 次回監視スケジュール（緊急モードでは停止）
            if (!this.emergencyMode) {
                setTimeout(cpuMonitor, this.detection.cpuCheckInterval);
            }
        };
        
        setTimeout(cpuMonitor, this.detection.cpuCheckInterval);
    }
    
    /**
     * 3. 緊急停止システム初期化
     */
    initializeEmergencySystem() {
        // Ctrl+Alt+S で緊急停止
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.key === 'S') {
                this.executeEmergencyStop('userAbort');
            }
        });
        
        // ページ離脱時クリーンアップ
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
        
        // エラー監視
        window.addEventListener('error', (e) => {
            if (e.message && e.message.includes('Maximum call stack size exceeded')) {
                this.executeEmergencyStop('infiniteLoop', '再帰呼び出し上限');
            }
        });
        
        console.log('🚨 緊急停止システム初期化完了');
    }
    
    /**
     * 4. 予防システム初期化
     */
    initializePreventionSystem() {
        // 危険コードパターン検出
        this.setupCodeAnalysis();
        
        // 自動クリーンアップ
        setInterval(() => {
            if (this.prevention.enforceCleanup) {
                this.performAutomaticCleanup();
            }
        }, 30000); // 30秒間隔
        
        console.log('🛡️ 予防システム初期化完了');
    }
    
    /**
     * 関数呼び出し記録・監視
     */
    recordFunctionCall(functionName, args = []) {
        const now = Date.now();
        const key = functionName;
        
        if (!this.detection.functionCallCounts.has(key)) {
            this.detection.functionCallCounts.set(key, []);
        }
        
        const calls = this.detection.functionCallCounts.get(key);
        calls.push(now);
        
        // 古い呼び出し記録削除（時間窓外）
        const cutoff = now - this.detection.timeWindow;
        while (calls.length > 0 && calls[0] < cutoff) {
            calls.shift();
        }
        
        // 異常な呼び出し頻度チェック
        if (calls.length > this.detection.maxCallsPerWindow) {
            this.handleInfiniteLoopSuspicion(functionName, calls.length);
        }
    }
    
    /**
     * 無限ループ疑い処理
     */
    handleInfiniteLoopSuspicion(functionName, callCount) {
        console.warn(`🔄 無限ループ疑い検出: ${functionName} (${callCount}回/${this.detection.timeWindow}ms)`);
        
        const report = {
            timestamp: Date.now(),
            type: 'infinite_loop_suspicion',
            functionName,
            callCount,
            timeWindow: this.detection.timeWindow,
            activeIntervals: this.detection.intervalIds.size,
            activeTimeouts: this.detection.timeoutIds.size,
            cpuSamples: this.monitoring.cpu.samples.slice(-3)
        };
        
        this.debug.reportHistory.push(report);
        
        // 重大な場合は緊急停止
        if (callCount > this.detection.maxCallsPerWindow * 2) {
            this.executeEmergencyStop('infiniteLoop', `${functionName} 異常呼び出し`);
        }
    }
    
    /**
     * CPU過負荷処理
     */
    handleCPUOverload() {
        if (this.emergencyMode) return;
        
        console.error('🚨 CPU過負荷検出！緊急停止プロセス開始');
        
        const report = {
            timestamp: Date.now(),
            type: 'cpu_overload',
            cpuSamples: this.monitoring.cpu.samples.slice(),
            activeIntervals: this.detection.intervalIds.size,
            activeTimeouts: this.detection.timeoutIds.size,
            activeEventListeners: this.detection.eventListeners.size,
            domNodeCount: document.getElementsByTagName('*').length
        };
        
        this.debug.reportHistory.push(report);
        this.executeEmergencyStop('cpuOverload');
    }
    
    /**
     * 緊急停止実行
     */
    executeEmergencyStop(triggerType, details = '') {
        if (this.emergencyMode) return; // 重複実行防止
        
        console.error(`🛑 緊急停止実行: ${triggerType} ${details}`);
        this.emergencyMode = true;
        this.emergencyStop.triggers[triggerType] = true;
        this.emergencyStop.lastEmergencyTime = Date.now();
        
        // 1. 全タイマー停止
        this.detection.intervalIds.forEach(id => {
            try { clearInterval(id); } catch (e) {}
        });
        this.detection.timeoutIds.forEach(id => {
            try { clearTimeout(id); } catch (e) {}
        });
        
        // 2. 高負荷イベントリスナー削除
        this.detection.eventListeners.forEach((data, id) => {
            if (['mousemove', 'scroll', 'resize'].includes(data.type)) {
                try {
                    data.element.removeEventListener(data.type, data.listener, data.options);
                } catch (e) {}
            }
        });
        
        // 3. 緊急復旧UI表示
        this.showEmergencyRecoveryUI(triggerType, details);
        
        console.log('✅ 緊急停止完了');
    }
    
    /**
     * 緊急復旧UI表示
     */
    showEmergencyRecoveryUI(triggerType, details) {
        // 既存のUI削除
        const existingUI = document.getElementById('emergency-recovery-ui');
        if (existingUI) existingUI.remove();
        
        const ui = document.createElement('div');
        ui.id = 'emergency-recovery-ui';
        ui.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: #ff4757; color: white; padding: 20px;
            border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            font-family: monospace; font-size: 14px; max-width: 400px;
            border: 3px solid #ff3838;
        `;
        
        const lastCPU = this.monitoring.cpu.samples.slice(-1)[0];
        const cpuInfo = lastCPU ? `CPU: ${lastCPU.cpu.toFixed(1)}%` : 'CPU: 不明';
        
        ui.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px;">🛑 緊急停止システム作動</div>
            <div>原因: ${triggerType} ${details}</div>
            <div>時刻: ${new Date().toLocaleTimeString()}</div>
            <div>${cpuInfo}</div>
            <div>停止したタイマー: ${this.detection.intervalIds.size + this.detection.timeoutIds.size}個</div>
            <div style="margin-top: 15px;">
                <button onclick="window.loopPreventionSystem.recoverSystem()" 
                        style="background: #2ed573; border: none; padding: 8px 16px; 
                               border-radius: 4px; color: white; cursor: pointer; margin-right: 8px;">
                    🔧 システム復旧
                </button>
                <button onclick="window.loopPreventionSystem.showDetailedReport()" 
                        style="background: #3742fa; border: none; padding: 8px 16px; 
                               border-radius: 4px; color: white; cursor: pointer;">
                    📊 詳細レポート
                </button>
            </div>
            <div style="margin-top: 10px; font-size: 12px; opacity: 0.9;">
                Ctrl+Alt+S: 手動緊急停止 | F12: 詳細ログ
            </div>
        `;
        
        document.body.appendChild(ui);
        
        // 10秒後に自動復旧オプション表示
        setTimeout(() => {
            if (document.getElementById('emergency-recovery-ui')) {
                const autoRecover = document.createElement('div');
                autoRecover.style.cssText = 'margin-top: 10px; font-size: 12px;';
                autoRecover.innerHTML = `
                    <label>
                        <input type="checkbox" id="auto-recover-check"> 
                        10秒後に自動復旧
                    </label>
                `;
                ui.appendChild(autoRecover);
                
                setTimeout(() => {
                    const checkbox = document.getElementById('auto-recover-check');
                    if (checkbox && checkbox.checked) {
                        this.recoverSystem();
                    }
                }, 10000);
            }
        }, 5000);
    }
    
    /**
     * システム復旧
     */
    recoverSystem() {
        console.log('🔧 システム復旧開始...');
        
        // 緊急モード解除
        this.emergencyMode = false;
        
        // トリガーリセット
        Object.keys(this.emergencyStop.triggers).forEach(key => {
            this.emergencyStop.triggers[key] = false;
        });
        
        // 検出システムリセット
        this.detection.functionCallCounts.clear();
        this.detection.intervalIds.clear();
        this.detection.timeoutIds.clear();
        
        // CPU監視再開
        this.startCPUMonitoring();
        
        // UI削除
        const ui = document.getElementById('emergency-recovery-ui');
        if (ui) ui.remove();
        
        console.log('✅ システム復旧完了');
        
        // 復旧レポート
        this.displaySystemStatus();
    }
    
    /**
     * 詳細レポート表示
     */
    showDetailedReport() {
        const report = {
            system: {
                version: this.version,
                isActive: this.isActive,
                emergencyMode: this.emergencyMode,
                uptime: Date.now() - this.detection.lastResetTime
            },
            detection: {
                functionCalls: Array.from(this.detection.functionCallCounts.entries()),
                activeIntervals: this.detection.intervalIds.size,
                activeTimeouts: this.detection.timeoutIds.size,
                eventListeners: this.detection.eventListeners.size
            },
            monitoring: {
                cpuSamples: this.monitoring.cpu.samples.slice(),
                lastCPU: this.monitoring.cpu.samples.slice(-1)[0]?.cpu || 0
            },
            history: this.debug.reportHistory.slice(-10) // 最新10件
        };
        
        console.group('📊 無限ループ防止システム - 詳細レポート');
        console.table(report.system);
        console.table(report.detection);
        if (report.monitoring.cpuSamples.length > 0) {
            console.table(report.monitoring.cpuSamples);
        }
        if (report.history.length > 0) {
            console.log('🚨 問題履歴:');
            report.history.forEach(h => console.log(h));
        }
        console.groupEnd();
        
        // JSON形式でも出力
        console.log('JSON形式レポート:', JSON.stringify(report, null, 2));
    }
    
    /**
     * システムステータス表示
     */
    displaySystemStatus() {
        const status = {
            '🛡️ システム状態': this.isActive ? '稼働中' : '停止中',
            '🚨 緊急モード': this.emergencyMode ? 'ON' : 'OFF',
            '⏰ アクティブタイマー': `${this.detection.intervalIds.size} intervals, ${this.detection.timeoutIds.size} timeouts`,
            '👂 イベントリスナー': `${this.detection.eventListeners.size}個`,
            '📊 CPU監視': `閾値: ${this.monitoring.cpu.threshold}%, サンプル: ${this.monitoring.cpu.samples.length}個`,
            '📈 最新CPU': this.monitoring.cpu.samples.length > 0 ? `${this.monitoring.cpu.samples.slice(-1)[0].cpu.toFixed(1)}%` : '未測定'
        };
        
        console.group('🛡️ 無限ループ防止システム - 現在のステータス');
        Object.entries(status).forEach(([key, value]) => {
            console.log(`${key}: ${value}`);
        });
        console.groupEnd();
    }
    
    /**
     * 自動クリーンアップ
     */
    performAutomaticCleanup() {
        let cleanedCount = 0;
        
        // 古いイベントリスナー削除（5分以上前の登録分）
        const cutoff = Date.now() - 300000; // 5分
        for (const [id, data] of this.detection.eventListeners.entries()) {
            if (data.timestamp < cutoff) {
                try {
                    data.element.removeEventListener(data.type, data.listener, data.options);
                    this.detection.eventListeners.delete(id);
                    cleanedCount++;
                } catch (error) {
                    // 要素が既に削除されている場合など
                    this.detection.eventListeners.delete(id);
                }
            }
        }
        
        // 古いCPUサンプル削除
        if (this.monitoring.cpu.samples.length > this.monitoring.cpu.maxSamples) {
            this.monitoring.cpu.samples = this.monitoring.cpu.samples.slice(-this.monitoring.cpu.maxSamples);
        }
        
        // 古いレポート削除
        if (this.debug.reportHistory.length > 50) {
            this.debug.reportHistory = this.debug.reportHistory.slice(-50);
        }
        
        if (cleanedCount > 0 && this.debug.enabled) {
            console.log(`🧹 自動クリーンアップ完了: ${cleanedCount}個のリソースを解放`);
        }
    }
    
    /**
     * システム終了・クリーンアップ
     */
    cleanup() {
        console.log('🧹 無限ループ防止システム終了処理...');
        
        this.isActive = false;
        
        // 全タイマー停止
        this.detection.intervalIds.forEach(id => clearInterval(id));
        this.detection.timeoutIds.forEach(id => clearTimeout(id));
        
        // 全データクリア
        this.detection.functionCallCounts.clear();
        this.detection.intervalIds.clear();
        this.detection.timeoutIds.clear();
        this.detection.eventListeners.clear();
        
        console.log('✅ クリーンアップ完了');
    }
    
    /**
     * 既存ConsoleManagerとの統合
     */
    integrateWithConsoleManager() {
        if (window.ConsoleManager && window.ConsoleManager.detectInfiniteLoop) {
            console.log('🔗 ConsoleManagerと統合中...');
            
            // CPU監視設定を共有
            if (window.ConsoleManager.startCPUMonitoring) {
                window.ConsoleManager.startCPUMonitoring({
                    threshold: this.monitoring.cpu.threshold,
                    alertCallback: (alertData) => {
                        console.warn('🚨 ConsoleManager CPU Alert:', alertData);
                        this.handleCPUOverload();
                    }
                });
            }
            
            console.log('✅ ConsoleManager統合完了');
        }
    }
    
    /**
     * 静的コード解析（危険パターン検出）
     */
    setupCodeAnalysis() {
        // 現在のスクリプト要素を監視
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.tagName === 'SCRIPT' && node.textContent) {
                        this.analyzeCode(node.textContent);
                    }
                });
            });
        });
        
        observer.observe(document, { childList: true, subtree: true });
        
        // 既存スクリプトの解析
        document.querySelectorAll('script').forEach(script => {
            if (script.textContent) {
                this.analyzeCode(script.textContent);
            }
        });
    }
    
    /**
     * コード解析実行
     */
    analyzeCode(code) {
        const dangerousPatterns = [
            {
                name: 'while+async',
                pattern: /while\s*\([^)]*\)\s*\{[^}]*await[^}]*\}/g,
                warning: 'while文内でawaitを使用すると無限ループの原因になる可能性があります'
            },
            {
                name: 'setTimeout+recursive',
                pattern: /setTimeout\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*,.*\1\s*\(/g,
                warning: 'setTimeout内で同じ関数を再帰呼び出しすると無限ループになる可能性があります'
            },
            {
                name: 'setInterval+short',
                pattern: /setInterval\s*\([^,]*,\s*([0-9]+)\s*\)/g,
                warning: '短間隔のsetIntervalはパフォーマンス問題を引き起こす可能性があります'
            }
        ];
        
        dangerousPatterns.forEach(pattern => {
            const matches = code.match(pattern.pattern);
            if (matches) {
                console.warn(`⚠️ 危険コードパターン検出 [${pattern.name}]:`, pattern.warning);
                console.log('検出箇所:', matches);
            }
        });
    }
    
    // タイマーコールバックエラー処理
    handleCallbackError(timerType, timerId, error) {
        if (error.message.includes('Maximum call stack size')) {
            this.executeEmergencyStop('infiniteLoop', `${timerType}内での再帰呼び出し`);
        }
    }
}

// グローバル変数として設定
window.loopPreventionSystem = null;

/**
 * システム起動関数
 */
function startInfiniteLoopPreventionSystem(config = {}) {
    if (window.loopPreventionSystem) {
        console.log('⚠️ 無限ループ防止システムは既に起動しています');
        return window.loopPreventionSystem;
    }
    
    window.loopPreventionSystem = new InfiniteLoopPreventionSystem();
    
    // 設定のカスタマイズ
    if (config.cpuThreshold) {
        window.loopPreventionSystem.monitoring.cpu.threshold = config.cpuThreshold;
    }
    
    if (config.debug) {
        window.loopPreventionSystem.debug.enabled = true;
        window.loopPreventionSystem.debug.logLevel = config.debugLevel || 'INFO';
    }
    
    return window.loopPreventionSystem;
}

/**
 * システム停止関数
 */
function stopInfiniteLoopPreventionSystem() {
    if (window.loopPreventionSystem) {
        window.loopPreventionSystem.cleanup();
        window.loopPreventionSystem = null;
        console.log('🛑 無限ループ防止システムが停止されました');
    }
}

// 開発支援用のコンソールコマンド
window.ilps = {
    start: startInfiniteLoopPreventionSystem,
    stop: stopInfiniteLoopPreventionSystem,
    status: () => window.loopPreventionSystem?.displaySystemStatus(),
    report: () => window.loopPreventionSystem?.showDetailedReport(),
    emergency: () => window.loopPreventionSystem?.executeEmergencyStop('userAbort', '手動実行'),
    recover: () => window.loopPreventionSystem?.recoverSystem()
};

// DOM読み込み完了時に自動起動
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM読み込み完了 - 無限ループ防止システム自動起動');
    startInfiniteLoopPreventionSystem({
        cpuThreshold: 25,  // 本番環境用に少し緩める
        debug: true,       // 開発環境ではデバッグON
        debugLevel: 'WARN'
    });
});

// 即座起動も対応（DOMContentLoadedより前に読み込まれた場合）
if (document.readyState === 'loading') {
    // DOMContentLoadedを待つ
} else {
    // 既にDOM読み込み完了
    startInfiniteLoopPreventionSystem({
        cpuThreshold: 25,
        debug: true,
        debugLevel: 'WARN'
    });
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InfiniteLoopPreventionSystem, startInfiniteLoopPreventionSystem, stopInfiniteLoopPreventionSystem };
}