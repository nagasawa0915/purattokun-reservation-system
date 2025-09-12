// このファイルは削除予定 - spine-integration/LogSystem.js に移行済み
 * ねずみ統合システム ログ管理マイクロモジュール
 * 
 * 責務:
 * - 多機能ログ出力・管理システム
 * - HTMLパネル + コンソール同時出力
 * - ログレベル管理・フィルタリング
 * - ログ検索・エクスポート・統計機能
 * - 高パフォーマンススクロール制御
 * 
 * 設計方針:
 * - 既存ログ機能100%互換性保持
 * - 高度な機能追加（レベル別・検索・エクスポート）
 * - UIControllerとの完全連携
 * - パフォーマンス最適化
 * 
 * 使用方法:
 * const logSystem = new NezumiLogSystem({
 *   logLevel: 'info',
 *   maxLogs: 1000,
 *   showTimestamp: true,
 *   enableConsole: true
 * });
 * 
 * logSystem.log('メッセージ');
 * logSystem.warn('警告メッセージ');
 * logSystem.error('エラーメッセージ');
 */

class NezumiLogSystem {
    constructor(options = {}) {
        // 設定オプション
        this.options = {
            logLevel: options.logLevel || 'debug', // debug, info, warn, error
            maxLogs: options.maxLogs || 1000,
            showTimestamp: options.showTimestamp !== false,
            enableConsole: options.enableConsole !== false,
            enableHtml: options.enableHtml !== false,
            prefix: options.prefix || '[NezumiStableSpineBB]',
            ...options
        };

        // ログデータ管理
        this.logHistory = [];
        this.filteredLogs = [];
        this.currentFilter = 'all';
        this.searchQuery = '';

        // DOM要素参照
        this.logPanel = null;
        this.searchInput = null;
        this.filterButtons = null;

        // ログレベル定義
        this.levels = {
            debug: { priority: 0, color: '#888', emoji: '🔧' },
            info: { priority: 1, color: '#007bff', emoji: '📝' },
            warn: { priority: 2, color: '#ffa500', emoji: '⚠️' },
            error: { priority: 3, color: '#dc3545', emoji: '❌' },
            success: { priority: 1, color: '#28a745', emoji: '✅' }
        };

        // 統計情報
        this.stats = {
            total: 0,
            debug: 0,
            info: 0,
            warn: 0,
            error: 0,
            success: 0
        };

        this.init();
    }

    /**
     * 初期化処理
     */
    init() {
        this.logPanel = document.getElementById('log-panel');
        if (!this.logPanel) {
            console.warn('LogSystem: log-panel要素が見つかりません');
        }
        this.setupSearchAndFilter();
    }

    /**
     * 検索・フィルタ機能のセットアップ
     */
    setupSearchAndFilter() {
        // 検索機能は必要に応じて後から追加可能
        // 現在はシンプルな実装を優先
    }

    /**
     * メインログメソッド - 既存互換性100%保持
     */
    log(message, level = 'info') {
        // レベルフィルタリング
        if (!this.shouldLog(level)) {
            return;
        }

        // ログエントリ作成
        const logEntry = this.createLogEntry(message, level);
        
        // 履歴に追加
        this.addToHistory(logEntry);
        
        // HTML表示
        if (this.options.enableHtml) {
            this.displayInHtml(logEntry);
        }
        
        // コンソール出力
        if (this.options.enableConsole) {
            this.outputToConsole(logEntry);
        }
        
        // 統計更新
        this.updateStats(level);
    }

    /**
     * 便利メソッド - 各ログレベル専用
     */
    debug(message) { this.log(message, 'debug'); }
    info(message) { this.log(message, 'info'); }
    warn(message) { this.log(message, 'warn'); }
    error(message) { this.log(message, 'error'); }
    success(message) { this.log(message, 'success'); }

    /**
     * ログエントリ作成
     */
    createLogEntry(message, level) {
        return {
            id: Date.now() + Math.random(),
            timestamp: new Date(),
            message: message,
            level: level,
            formattedTime: new Date().toLocaleTimeString()
        };
    }

    /**
     * ログレベルフィルタリング判定
     */
    shouldLog(level) {
        const currentPriority = this.levels[this.options.logLevel]?.priority || 0;
        const messagePriority = this.levels[level]?.priority || 0;
        return messagePriority >= currentPriority;
    }

    /**
     * 履歴に追加（最大数管理）
     */
    addToHistory(logEntry) {
        this.logHistory.push(logEntry);
        
        // 最大ログ数管理
        if (this.logHistory.length > this.options.maxLogs) {
            this.logHistory.shift();
        }
    }

    /**
     * HTML表示 - 既存の完全互換実装
     */
    displayInHtml(logEntry) {
        if (!this.logPanel) return;

        const logElement = document.createElement('div');
        logElement.style.marginBottom = '3px';
        
        // レベル別スタイリング
        const levelInfo = this.levels[logEntry.level] || this.levels.info;
        const timestampSpan = this.options.showTimestamp 
            ? `<span style="color: #666">[${logEntry.formattedTime}]</span> `
            : '';
        
        logElement.innerHTML = `${timestampSpan}<span style="color: ${levelInfo.color}">${levelInfo.emoji}</span> ${logEntry.message}`;
        
        this.logPanel.appendChild(logElement);
        
        // スクロール調整 - 既存実装保持
        this.logPanel.scrollTop = this.logPanel.scrollHeight;
    }

    /**
     * コンソール出力
     */
    outputToConsole(logEntry) {
        const consoleMessage = `${this.options.prefix} ${logEntry.message}`;
        
        switch (logEntry.level) {
            case 'error':
                console.error(consoleMessage);
                break;
            case 'warn':
                console.warn(consoleMessage);
                break;
            case 'debug':
                console.debug(consoleMessage);
                break;
            default:
                console.log(consoleMessage);
        }
    }

    /**
     * 統計情報更新
     */
    updateStats(level) {
        this.stats.total++;
        if (this.stats[level] !== undefined) {
            this.stats[level]++;
        }
    }

    /**
     * ログクリア - UIController.clearLog()との完全互換性
     */
    clearLog() {
        if (this.logPanel) {
            this.logPanel.innerHTML = '<div style="color: #ffd700; margin-bottom: 10px;">📝 システムログ</div>';
        }
        
        // 履歴・統計もクリア
        this.logHistory = [];
        this.stats = {
            total: 0,
            debug: 0,
            info: 0, 
            warn: 0,
            error: 0,
            success: 0
        };
        
        this.log('🧹 ログをクリアしました');
    }

    /**
     * 高度機能: ログ検索
     */
    searchLogs(query) {
        this.searchQuery = query.toLowerCase();
        return this.logHistory.filter(entry => 
            entry.message.toLowerCase().includes(this.searchQuery)
        );
    }

    /**
     * 高度機能: ログフィルタリング（レベル別）
     */
    filterByLevel(level) {
        if (level === 'all') {
            return this.logHistory;
        }
        return this.logHistory.filter(entry => entry.level === level);
    }

    /**
     * 高度機能: ログエクスポート（テキスト形式）
     */
    exportLogsAsText() {
        const lines = this.logHistory.map(entry => {
            const timestamp = this.options.showTimestamp ? `[${entry.formattedTime}] ` : '';
            const levelInfo = this.levels[entry.level] || this.levels.info;
            return `${timestamp}${levelInfo.emoji} ${entry.message}`;
        });
        
        return lines.join('\n');
    }

    /**
     * 高度機能: ログエクスポート（JSON形式）
     */
    exportLogsAsJson() {
        return JSON.stringify({
            exportTime: new Date().toISOString(),
            stats: this.stats,
            logs: this.logHistory
        }, null, 2);
    }

    /**
     * 高度機能: 統計情報取得
     */
    getStats() {
        return { ...this.stats };
    }

    // ===== test-nezumi-stable-spine-bb.html互換性メソッド =====
    
    /**
     * 互換性: getLogStats() - getStats()のエイリアス
     */
    getLogStats() {
        return this.getStats();
    }

    /**
     * 互換性: exportLogs() - テキスト形式でコンソール出力
     */
    exportLogs() {
        const textLogs = this.exportLogsAsText();
        console.log('📋 ログエクスポート（テキスト形式）:');
        console.log(textLogs);
        this.log('📋 ログをテキスト形式でコンソール出力しました');
        return textLogs;
    }

    /**
     * 互換性: exportLogsJson() - JSON形式でコンソール出力
     */
    exportLogsJson() {
        const jsonLogs = this.exportLogsAsJson();
        console.log('📋 ログエクスポート（JSON形式）:');
        console.log(jsonLogs);
        this.log('📋 ログをJSON形式でコンソール出力しました');
        return jsonLogs;
    }

    /**
     * 高度機能: ログレベル変更
     */
    setLogLevel(level) {
        if (this.levels[level]) {
            this.options.logLevel = level;
            this.info(`📊 ログレベルを ${level} に変更しました`);
        }
    }

    /**
     * 高度機能: 設定更新
     */
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
    }

    /**
     * デバッグ用: 現在の設定表示
     */
    showConfig() {
        this.info(`🔧 LogSystem設定: レベル=${this.options.logLevel}, 最大=${this.options.maxLogs}, HTML=${this.options.enableHtml}, Console=${this.options.enableConsole}`);
    }
}

// グローバル公開
if (typeof window !== 'undefined') {
    window.NezumiLogSystem = NezumiLogSystem;
}

// CommonJS対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NezumiLogSystem;
}

// AMD対応
if (typeof define === 'function' && define.amd) {
    define([], function() {
        return NezumiLogSystem;
    });
}