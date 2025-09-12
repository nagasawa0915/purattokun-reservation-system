/**
 * SystemCoordinator.js - システム統合コーディネーター
 * 機能: マイクロモジュール統合・システム全体の協調制御・ライフサイクル管理
 */
import { PanelManager } from './PanelManager.js';
import { ResizeController } from '../ui/ResizeController.js';
import { UltraSimplePanelSwap } from '../ui/UltraSimplePanelSwap.js';
import { LayoutManager } from '../ui/LayoutManager.js';
import { DebugManager } from '../debug/DebugManager.js';
import { HomepageIntegrationController } from '../integration/HomepageIntegrationController.js';

export class SystemCoordinator {
    constructor() {
        this.state = 'initializing';
        this.initializationPhases = [];
        this.errorHistory = [];
        
        // マイクロモジュール初期化
        this.panelManager = new PanelManager();
        
        // 🚨 LayoutManager競合問題対策: パネル入れ替え機能を優先する場合は無効化
        const enableLayoutManager = localStorage.getItem('spine-editor-enable-layout-manager') !== 'false';
        if (enableLayoutManager) {
            this.layoutManager = new LayoutManager();
            console.log('✅ LayoutManager初期化完了（通常モード）');
        } else {
            this.layoutManager = null;
            console.log('🚨 LayoutManager無効化（パネル入れ替え優先モード）');
        }
        
        this.resizeController = new ResizeController();
        this.debugManager = new DebugManager();
        this.panelSwapController = null; // PanelManager・LayoutManager初期化後に作成
        this.homepageIntegration = null; // ホームページ統合システム
        
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

            // Phase 3: パネル入れ替えシステム初期化（ModularPanelSystem対応版）
            await this.executePhase('panelswap-init', async () => {
                // localStorage設定でModularPanelSystemかUltraSimplePanelSwapを選択
                const useModularPanels = localStorage.getItem('spine-editor-use-modular-panels') === 'true';
                
                if (useModularPanels) {
                    // ModularPanelSystemの動的読み込み完了を待機
                    let attempts = 0;
                    while (typeof window.ModularPanelSystem === 'undefined' && attempts < 50) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        attempts++;
                    }
                    
                    if (typeof window.ModularPanelSystem !== 'undefined') {
                        this.panelSwapController = new window.ModularPanelSystem();
                        this.debugManager.addDebugMessage('ModularPanelSystem初期化完了', 'info');
                        
                        // UltraSimplePanelSwapのボタンを削除
                        const existingButtons = document.getElementById('ultra-simple-swap-buttons');
                        if (existingButtons) {
                            existingButtons.remove();
                            console.log('✅ UltraSimplePanelSwapボタン削除完了');
                        }
                    } else {
                        console.warn('⚠️ ModularPanelSystem読み込み失敗 - UltraSimplePanelSwapで継続');
                        this.panelSwapController = new UltraSimplePanelSwap();
                        this.debugManager.addDebugMessage('UltraSimplePanelSwap初期化完了（フォールバック）', 'info');
                    }
                } else {
                    this.panelSwapController = new UltraSimplePanelSwap();
                    this.debugManager.addDebugMessage('UltraSimplePanelSwap初期化完了（超シンプル版）', 'info');
                }
                
                const initCount = this.panelSwapController.initialize();
                return initCount;
            });

            // Phase 4: リサイズシステム初期化
            await this.executePhase('resize-init', () => {
                const resizeCount = this.resizeController.initializeResizeHandles();
                this.debugManager.addDebugMessage(`リサイズハンドル初期化完了: ${resizeCount}個`, 'info');
            });

            // Phase 5: ホームページ統合システム初期化
            await this.executePhase('homepage-integration', () => {
                this.homepageIntegration = new HomepageIntegrationController();
                this.debugManager.addDebugMessage('ホームページ統合システム初期化完了', 'info');
            });

            // Phase 6: グローバルコマンド・イベント統合
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
        
        // リサイズとD&Dの排他制御
        this.setupResizeDragDropMutex();
        
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
     * リサイズ・D&D排他制御
     */
    setupResizeDragDropMutex() {
        // シンプルな競合制御：リサイズとパネル入れ替えの基本的な分離
        document.addEventListener('mousedown', (event) => {
            if (event.target.classList.contains('resize-handle')) {
                console.log('🔧 リサイズ開始: パネル入れ替えは自動的に無効');
            }
        });

        // パネル入れ替え完了イベント監視
        document.addEventListener('panelSwapped', (event) => {
            console.log('🔄 パネル入れ替え完了:', event.detail.method);
            this.debugManager?.addDebugMessage('パネル入れ替え完了', 'info');
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
                debugManager: this.debugManager?.state || 'not-initialized',
                homepageIntegration: this.homepageIntegration?.integrationState || 'not-initialized'
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
        
        if (this.homepageIntegration) {
            healthCheck.modules.homepage = this.homepageIntegration.performHealthCheck();
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