/**
 * SystemCoordinator.js - システム統合コーディネーター
 * 機能: マイクロモジュール統合・システム全体の協調制御・ライフサイクル管理
 */
import { PanelManager } from './PanelManager.js';
import { ResizeController } from '../ui/ResizeController.js';
import { NewPanelSwapController } from '../ui/NewPanelSwapController.js';
import { DebugManager } from '../debug/DebugManager.js';

export class SystemCoordinator {
    constructor() {
        this.state = 'initializing';
        this.initializationPhases = [];
        this.errorHistory = [];
        
        // マイクロモジュール初期化
        this.panelManager = new PanelManager();
        this.resizeController = new ResizeController();
        this.debugManager = new DebugManager();
        this.panelSwapController = null; // PanelManager初期化後に作成
        
        console.log('🎯 SystemCoordinator初期化開始');
        this.init();
    }

    /**
     * システム初期化
     */
    init() {
        // DOM読み込み完了後に初期化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startCoordination());
        } else {
            this.startCoordination();
        }
    }

    /**
     * 協調システム開始
     */
    async startCoordination() {
        console.log('🚀 SystemCoordinator協調システム開始');
        
        try {
            // Phase 1: デバッグシステム初期化（最優先）
            await this.executePhase('debug-init', () => {
                this.debugManager.initializeDebug();
                this.debugManager.addDebugMessage('デバッグシステム初期化完了', 'info');
            });

            // Phase 2: パネル管理システム初期化
            await this.executePhase('panel-init', () => {
                const panelCount = this.panelManager.registerPanels();
                this.debugManager.addDebugMessage(`パネル登録完了: ${panelCount}個`, 'info');
            });

            // Phase 3: パネル入れ替えシステム初期化（パネル管理後）
            await this.executePhase('panel-swap-init', async () => {
                this.panelSwapController = new NewPanelSwapController(this.panelManager);
                const swapCount = await this.panelSwapController.initialize();
                this.debugManager.addDebugMessage(`パネル入れ替え機能初期化完了: ${swapCount}個`, 'info');
            });

            // Phase 4: リサイズシステム初期化
            await this.executePhase('resize-init', () => {
                const resizeCount = this.resizeController.initializeResizeHandles();
                this.debugManager.addDebugMessage(`リサイズハンドル初期化完了: ${resizeCount}個`, 'info');
            });

            // Phase 5: グローバルコマンド・イベント統合
            await this.executePhase('global-integration', () => {
                this.setupGlobalIntegration();
                this.debugManager.addDebugMessage('グローバル統合完了', 'info');
            });

            // 初期化完了
            this.state = 'ready';
            this.updateStatus('ready', 'SystemCoordinator準備完了');
            this.debugManager.updateSystemStatus(this);
            
            console.log('✅ SystemCoordinator初期化完了');
            this.debugManager.addDebugMessage('SystemCoordinator初期化完了', 'success');

        } catch (error) {
            this.handleSystemError(error, 'システム初期化中');
        }
    }

    /**
     * 初期化フェーズ実行
     */
    async executePhase(phaseName, phaseFunction) {
        console.log(`📋 Phase開始: ${phaseName}`);
        this.debugManager?.startPerformanceMeasure(phaseName);
        
        try {
            await phaseFunction();
            
            this.initializationPhases.push({
                name: phaseName,
                status: 'completed',
                timestamp: Date.now()
            });
            
            const duration = this.debugManager?.endPerformanceMeasure(phaseName);
            console.log(`✅ Phase完了: ${phaseName} (${duration}ms)`);
            
        } catch (error) {
            this.initializationPhases.push({
                name: phaseName,
                status: 'failed',
                error: error.message,
                timestamp: Date.now()
            });
            
            console.error(`❌ Phase失敗: ${phaseName}`, error);
            throw error;
        }
    }

    /**
     * グローバル統合設定
     */
    setupGlobalIntegration() {
        // グローバル関数設定
        window.systemCoordinator = this;
        window.resetLayout = () => this.resetLayout();
        
        // リサイズとパネル入れ替えの排他制御
        this.setupResizePanelSwapMutex();
        
        // パネル入れ替えイベント監視
        document.addEventListener('panelSwap', (event) => {
            this.debugManager.addDebugMessage(
                `パネル入れ替え: ${event.detail.panel1} ↔ ${event.detail.panel2}`, 
                'info'
            );
            this.debugManager.updateSystemStatus(this);
        });

        // キーボードショートカット統合
        this.setupKeyboardShortcuts();
        
        console.log('🔗 グローバル統合設定完了');
    }

    /**
     * リサイズ・パネル入れ替え排他制御
     */
    setupResizePanelSwapMutex() {
        // リサイズ開始時はパネル入れ替え無効
        document.addEventListener('mousedown', (event) => {
            if (event.target.classList.contains('resize-handle')) {
                this.panelSwapController?.state = 'disabled';
            }
        });

        // リサイズ終了時はパネル入れ替え有効
        document.addEventListener('mouseup', () => {
            if (!this.resizeController.isDragging && this.panelSwapController?.state === 'disabled') {
                this.panelSwapController.state = 'ready';
            }
        });
    }

    /**
     * キーボードショートカット設定
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl + R: レイアウトリセット
            if (event.ctrlKey && event.key === 'r') {
                event.preventDefault();
                this.resetLayout();
            }
            
            // Ctrl + Shift + D: システム状態デバッグ
            if (event.ctrlKey && event.shiftKey && event.key === 'D') {
                event.preventDefault();
                this.debugManager.getSystemStatus();
            }
        });
    }

    /**
     * システムエラーハンドリング
     */
    handleSystemError(error, context) {
        this.state = 'error';
        this.updateStatus('error', `システムエラー: ${context}`);
        
        const errorInfo = this.debugManager?.handleError(error, context);
        this.errorHistory.push(errorInfo);
        
        console.error('❌ SystemCoordinatorエラー:', { error, context });
    }

    /**
     * 状態表示更新
     */
    updateStatus(statusClass, message) {
        const statusElement = document.getElementById('coordinator-status');
        if (statusElement) {
            statusElement.className = `coordinator-status ${statusClass}`;
            statusElement.textContent = message;
        }
    }

    /**
     * レイアウトリセット（統合版）
     */
    resetLayout() {
        try {
            const resetResult = this.resizeController.resetLayout();
            this.debugManager.addDebugMessage('レイアウトリセット実行', 'info');
            this.debugManager.updateSystemStatus(this);
            
            console.log('🔄 レイアウトリセット完了:', resetResult);
            return resetResult;
            
        } catch (error) {
            this.handleSystemError(error, 'レイアウトリセット中');
            return null;
        }
    }

    /**
     * システム状態取得
     */
    getCoordinatorStatus() {
        return {
            state: this.state,
            initializationPhases: this.initializationPhases,
            errorCount: this.errorHistory.length,
            modules: {
                panelManager: this.panelManager?.state || 'not-initialized',
                resizeController: this.resizeController?.state || 'not-initialized',
                panelSwapController: this.panelSwapController?.state || 'not-initialized',
                debugManager: this.debugManager?.state || 'not-initialized'
            },
            timestamp: Date.now()
        };
    }

    /**
     * システムヘルスチェック
     */
    performSystemHealthCheck() {
        const healthCheck = {
            coordinator: this.getCoordinatorStatus(),
            modules: {}
        };

        // 各モジュールのヘルスチェック
        if (this.panelManager) {
            healthCheck.modules.panels = this.panelManager.getAllPanelsStatus();
        }
        
        if (this.resizeController) {
            healthCheck.modules.resize = this.resizeController.getResizeStatus();
        }
        
        if (this.panelSwapController) {
            healthCheck.modules.panelSwap = this.panelSwapController.getDebugInfo();
        }
        
        if (this.debugManager) {
            healthCheck.modules.debug = this.debugManager.performHealthCheck();
        }

        console.log('🏥 SystemCoordinatorヘルスチェック:', healthCheck);
        return healthCheck;
    }

    /**
     * 緊急停止
     */
    emergencyStop() {
        console.warn('🚨 SystemCoordinator緊急停止開始');
        
        try {
            // すべてのドラッグ操作を停止
            this.resizeController?.endResize();
            this.panelSwapController?.cancelDrag();
            
            // 状態をリセット
            this.state = 'emergency-stopped';
            this.updateStatus('error', '緊急停止');
            
            this.debugManager?.addDebugMessage('システム緊急停止実行', 'warning');
            console.log('✅ SystemCoordinator緊急停止完了');
            
        } catch (error) {
            console.error('❌ 緊急停止中にエラー:', error);
        }
    }

    /**
     * システムクリーンアップ
     */
    cleanup() {
        console.log('🧹 SystemCoordinatorクリーンアップ開始');
        
        try {
            // 各モジュールのクリーンアップ
            this.panelManager?.cleanup();
            this.resizeController?.cleanup();
            this.panelSwapController?.cleanup();
            this.debugManager?.cleanup();
            
            // グローバル関数クリーンアップ
            delete window.systemCoordinator;
            delete window.resetLayout;
            
            this.state = 'cleanup';
            console.log('✅ SystemCoordinatorクリーンアップ完了');
            
        } catch (error) {
            console.error('❌ クリーンアップ中にエラー:', error);
        }
    }
}

/**
 * 自動初期化（レガシー互換性）
 */
document.addEventListener('DOMContentLoaded', () => {
    window.systemCoordinator = new SystemCoordinator();
});

export default SystemCoordinator;