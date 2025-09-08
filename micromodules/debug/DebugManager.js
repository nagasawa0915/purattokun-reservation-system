/**
 * DebugManager.js - デバッグマネージャー
 * 機能: 状態監視・デバッグ情報表示・コンソール統合・システム診断
 */
export class DebugManager {
    constructor() {
        this.debugElements = {};
        this.systemStatus = {};
        this.state = 'initializing';
        this.debugHistory = [];
    }

    /**
     * デバッグシステム初期化
     */
    initializeDebug() {
        console.log('🔍 デバッグシステム初期化開始');
        
        // デバッグ要素を取得
        this.debugElements = {
            coordinatorState: document.getElementById('coordinator-state'),
            panelCount: document.getElementById('panel-count'),
            dragState: document.getElementById('drag-state'),
            debugPanel: document.getElementById('debug-panel')
        };
        
        // グローバルデバッグコマンドを設定
        this.setupGlobalCommands();
        
        // デバッグパネル表示制御イベント
        this.setupDebugPanelControls();
        
        console.log('🔍 デバッグシステム初期化完了');
        console.log('💡 利用可能なデバッグコマンド:');
        console.log('  debugSystem() - システム状態確認');
        console.log('  resetLayout() - レイアウトリセット');
        console.log('  toggleDebugPanel() - デバッグパネル表示切替');
        
        this.state = 'ready';
    }

    /**
     * グローバルデバッグコマンド設定
     */
    setupGlobalCommands() {
        window.debugSystem = () => this.getSystemStatus();
        window.debugManager = this;
        window.toggleDebugPanel = () => this.toggleDebugPanel();
        window.clearDebugHistory = () => this.clearDebugHistory();
        window.getDebugHistory = () => this.debugHistory;
    }

    /**
     * デバッグパネル制御設定
     */
    setupDebugPanelControls() {
        // キーボードショートカット: Ctrl+D でデバッグパネル切替
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.toggleDebugPanel();
            }
        });
    }

    /**
     * システム状態更新
     */
    updateSystemStatus(systemCoordinator) {
        this.systemStatus = {
            coordinator: systemCoordinator.getCoordinatorStatus(),
            panels: systemCoordinator.panelManager?.getAllPanelsStatus(),
            resize: systemCoordinator.resizeController?.getResizeStatus(),
            dragDrop: systemCoordinator.dragDropController?.getDragDropStatus(),
            timestamp: Date.now()
        };
        
        // デバッグ情報表示更新
        this.updateDebugDisplay();
        
        return this.systemStatus;
    }

    /**
     * デバッグ情報表示更新
     */
    updateDebugDisplay(customMessage = null) {
        const { coordinatorState, panelCount, dragState } = this.debugElements;
        
        if (coordinatorState && this.systemStatus.coordinator) {
            coordinatorState.textContent = this.systemStatus.coordinator.state || 'unknown';
        }
        
        if (panelCount && this.systemStatus.panels) {
            panelCount.textContent = this.systemStatus.panels.panelCount || '0';
        }
        
        if (dragState) {
            if (customMessage) {
                dragState.textContent = customMessage;
            } else if (this.systemStatus.resize?.isDragging) {
                dragState.textContent = 'リサイズ中';
            } else if (this.systemStatus.dragDrop?.isDragging) {
                dragState.textContent = `パネルドラッグ: ${this.systemStatus.dragDrop.draggedPanel}`;
            } else {
                dragState.textContent = '待機中';
            }
        }
    }

    /**
     * デバッグメッセージ追加
     */
    addDebugMessage(message, type = 'info') {
        const debugEntry = {
            message,
            type,
            timestamp: Date.now(),
            time: new Date().toLocaleTimeString()
        };
        
        this.debugHistory.push(debugEntry);
        
        // 履歴が100件を超えたら古いものを削除
        if (this.debugHistory.length > 100) {
            this.debugHistory.shift();
        }
        
        // コンソールにも出力
        const logFunc = console[type] || console.log;
        logFunc(`[${debugEntry.time}] ${message}`);
        
        return debugEntry;
    }

    /**
     * システム状態取得
     */
    getSystemStatus() {
        const status = {
            ...this.systemStatus,
            debugManager: {
                state: this.state,
                historyCount: this.debugHistory.length,
                debugPanelVisible: this.debugElements.debugPanel?.style.display !== 'none'
            }
        };
        
        console.log('🔍 システム状態:', status);
        return status;
    }

    /**
     * デバッグパネル表示切替
     */
    toggleDebugPanel() {
        const debugPanel = this.debugElements.debugPanel;
        if (debugPanel) {
            const isVisible = debugPanel.style.display !== 'none';
            debugPanel.style.display = isVisible ? 'none' : 'block';
            
            const action = isVisible ? '非表示' : '表示';
            console.log(`👁️ デバッグパネル${action}切替`);
            this.addDebugMessage(`デバッグパネル${action}`, 'info');
            
            return !isVisible;
        }
        return false;
    }

    /**
     * デバッグ履歴クリア
     */
    clearDebugHistory() {
        this.debugHistory = [];
        console.log('🧹 デバッグ履歴クリア完了');
        return true;
    }

    /**
     * パフォーマンス測定開始
     */
    startPerformanceMeasure(name) {
        performance.mark(`${name}-start`);
        this.addDebugMessage(`パフォーマンス測定開始: ${name}`, 'info');
    }

    /**
     * パフォーマンス測定終了
     */
    endPerformanceMeasure(name) {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        
        const measure = performance.getEntriesByName(name)[0];
        const duration = measure ? Math.round(measure.duration * 100) / 100 : 0;
        
        this.addDebugMessage(`パフォーマンス測定完了: ${name} - ${duration}ms`, 'info');
        return duration;
    }

    /**
     * システムヘルスチェック
     */
    performHealthCheck() {
        const healthCheck = {
            timestamp: Date.now(),
            results: {}
        };
        
        // DOM要素チェック
        healthCheck.results.domElements = {
            debugPanel: !!this.debugElements.debugPanel,
            coordinatorState: !!this.debugElements.coordinatorState,
            panelCount: !!this.debugElements.panelCount,
            dragState: !!this.debugElements.dragState
        };
        
        // システム状態チェック
        healthCheck.results.systemState = {
            debugManagerReady: this.state === 'ready',
            historySize: this.debugHistory.length,
            globalCommandsAvailable: typeof window.debugSystem === 'function'
        };
        
        console.log('🏥 システムヘルスチェック結果:', healthCheck);
        this.addDebugMessage('システムヘルスチェック実行', 'info');
        
        return healthCheck;
    }

    /**
     * エラーハンドリング
     */
    handleError(error, context = '') {
        const errorEntry = {
            error: error.message || error,
            stack: error.stack,
            context,
            timestamp: Date.now()
        };
        
        this.addDebugMessage(`エラー発生: ${context} - ${error.message}`, 'error');
        console.error('❌ システムエラー:', errorEntry);
        
        return errorEntry;
    }

    /**
     * クリーンアップ
     */
    cleanup() {
        // グローバルコマンドクリーンアップ
        delete window.debugSystem;
        delete window.debugManager;
        delete window.toggleDebugPanel;
        delete window.clearDebugHistory;
        delete window.getDebugHistory;
        
        this.debugElements = {};
        this.debugHistory = [];
        this.state = 'cleanup';
        
        console.log('🧹 デバッグマネージャークリーンアップ完了');
    }
}

export default DebugManager;