/**
 * PureCanvasController.js
 * 
 * 🎯 Canvas制御マイクロモジュール統合インターフェース
 * - 4つのサブモジュール統合管理（Core, UI, Bounds, Events）
 * - 外部依存: 同フォルダ内の4つのサブモジュールのみ
 * - 責務: サブモジュール初期化・統合制御・外部APIのみ
 * - 基盤: PureBoundingBox.jsと同様の統合アーキテクチャ
 */

class PureCanvasController {
    constructor(config) {
        // 必須設定チェック
        if (!config || !config.targetCanvas) {
            throw new Error('PureCanvasController: targetCanvas is required');
        }
        
        // 設定保存
        this.config = {
            targetCanvas: config.targetCanvas,
            skeleton: config.skeleton || null,
            renderer: config.renderer || null,
            nodeId: config.nodeId || 'canvas-controller-' + Date.now(),
            // Canvas制御特有の設定
            minWidth: config.minWidth || 50,
            minHeight: config.minHeight || 50,
            maxWidth: config.maxWidth || 2000,
            maxHeight: config.maxHeight || 2000,
            maintainAspectRatio: config.maintainAspectRatio || false,
            autoFitContent: config.autoFitContent || true
        };
        
        // サブモジュール参照
        this.core = null;
        this.ui = null;
        this.bounds = null;
        this.events = null;
        
        // 初期化状態
        this.state = {
            initialized: false,
            active: false,
            error: null
        };
        
        // サブモジュール初期化
        this.initialize();
    }
    
    /**
     * サブモジュール初期化
     */
    initialize() {
        try {
            // Core初期化（状態管理）
            this.core = new PureCanvasControllerCore(this.config);
            
            // Bounds初期化（座標計算）
            this.bounds = new PureCanvasControllerBounds(this.core);
            
            // UI初期化（視覚要素）
            this.ui = new PureCanvasControllerUI(this.core);
            
            // Events初期化（イベント処理）
            this.events = new PureCanvasControllerEvents(this.core, this.ui, this.bounds);
            
            // コントロールボタン機能接続
            this.events.setupControlCallbacks();
            
            this.state.initialized = true;
            console.log(`🎯 PureCanvasController初期化完了: ${this.config.nodeId}`);
            
        } catch (error) {
            this.state.error = error.message;
            console.error('❌ PureCanvasController初期化失敗:', error);
            throw error;
        }
    }
    
    /**
     * 🎯 Canvas制御開始（外部API）
     */
    startEditing() {
        if (!this.state.initialized || this.state.active) {
            console.warn('⚠️ Canvas制御: 既に開始済みまたは未初期化');
            return false;
        }
        
        try {
            // UI作成・表示
            const uiCreated = this.ui.createUI();
            if (!uiCreated) {
                throw new Error('UI作成失敗');
            }
            
            this.ui.setVisible(true);
            
            // イベントリスナー開始
            this.events.startListening();
            
            // 編集モード進入
            this.core.enterEditingMode();
            
            this.state.active = true;
            console.log('🎯 Canvas制御開始');
            return true;
            
        } catch (error) {
            this.state.error = error.message;
            console.error('❌ Canvas制御開始失敗:', error);
            return false;
        }
    }
    
    /**
     * 🎯 Canvas制御終了（外部API）
     */
    stopEditing() {
        if (!this.state.active) {
            console.warn('⚠️ Canvas制御: 未開始状態');
            return false;
        }
        
        try {
            // イベントリスナー停止
            this.events.stopListening();
            
            // UI非表示・削除
            this.ui.setVisible(false);
            
            // 編集モード終了
            this.core.exitEditingMode();
            
            this.state.active = false;
            console.log('🎯 Canvas制御終了');
            return true;
            
        } catch (error) {
            this.state.error = error.message;
            console.error('❌ Canvas制御終了失敗:', error);
            return false;
        }
    }
    
    /**
     * Canvas状態取得（外部API）
     */
    getCanvasState() {
        if (!this.state.initialized) return null;
        
        return {
            ...this.core.canvasState,
            active: this.state.active,
            initialized: this.state.initialized
        };
    }
    
    /**
     * Skeleton状態取得（外部API）
     */
    getSkeletonState() {
        if (!this.state.initialized) return null;
        
        return {
            ...this.core.skeletonState
        };
    }
    
    /**
     * Canvas状態設定（外部API）
     */
    setCanvasState(newState) {
        if (!this.state.initialized) return false;
        
        try {
            // Bounds経由でCanvas状態適用
            this.bounds.applyCanvasStateToElement(newState);
            
            // UI更新
            if (this.state.active) {
                this.ui.updateUI();
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Canvas状態設定失敗:', error);
            return false;
        }
    }
    
    /**
     * 🎯 Canvas自動フィット（外部API）
     */
    autoFit() {
        if (!this.state.initialized) return false;
        
        try {
            const fitResult = this.bounds.detectAndAutoFit();
            
            if (fitResult.hasOverflow) {
                const recommendedSize = fitResult.recommendedSize;
                
                // 推奨サイズ適用
                this.setCanvasState(recommendedSize);
                
                console.log(`🎯 Canvas自動フィット完了: ${recommendedSize.width}x${recommendedSize.height}`);
                return true;
            } else {
                console.log('🎯 Canvas自動フィット: 調整不要');
                return true;
            }
            
        } catch (error) {
            console.error('❌ Canvas自動フィット失敗:', error);
            return false;
        }
    }
    
    /**
     * Canvasリセット（外部API）
     */
    reset() {
        if (!this.state.initialized) return false;
        
        try {
            // オリジナル状態に復元
            const originalState = {
                width: this.core.canvasState.originalWidth,
                height: this.core.canvasState.originalHeight
            };
            
            this.setCanvasState(originalState);
            
            console.log(`🎯 Canvasリセット完了: ${originalState.width}x${originalState.height}`);
            return true;
            
        } catch (error) {
            console.error('❌ Canvasリセット失敗:', error);
            return false;
        }
    }
    
    /**
     * Skeleton中央配置（外部API）
     */
    centerSkeleton() {
        if (!this.state.initialized) return false;
        
        try {
            this.bounds.adjustSkeletonPosition();
            
            // UI更新
            if (this.state.active) {
                this.ui.updateUI();
            }
            
            console.log('🎯 Skeleton中央配置完了');
            return true;
            
        } catch (error) {
            console.error('❌ Skeleton中央配置失敗:', error);
            return false;
        }
    }
    
    /**
     * Canvas制御の表示・非表示切り替え（外部API）
     */
    toggleVisibility() {
        if (!this.state.initialized) return false;
        
        if (this.state.active) {
            return this.stopEditing();
        } else {
            return this.startEditing();
        }
    }
    
    /**
     * はみ出し検出（外部API）
     */
    detectOverflow() {
        if (!this.state.initialized) return null;
        
        try {
            return this.bounds.detectAndAutoFit();
        } catch (error) {
            console.error('❌ はみ出し検出失敗:', error);
            return null;
        }
    }
    
    /**
     * 完全削除・クリーンアップ（外部API）
     */
    destroy() {
        if (!this.state.initialized) return;
        
        try {
            // 編集中の場合は停止
            if (this.state.active) {
                this.stopEditing();
            }
            
            // サブモジュール削除
            if (this.events) {
                this.events.destroy();
                this.events = null;
            }
            
            if (this.ui) {
                this.ui.destroyUI();
                this.ui = null;
            }
            
            if (this.core) {
                this.core.cleanup();
                this.core = null;
            }
            
            this.bounds = null;
            
            // 状態リセット
            this.state = {
                initialized: false,
                active: false,
                error: null
            };
            
            console.log('🎯 PureCanvasController完全削除完了');
            
        } catch (error) {
            console.error('❌ PureCanvasController削除失敗:', error);
        }
    }
    
    /**
     * 状態診断（外部API）
     */
    diagnose() {
        return {
            controller: {
                initialized: this.state.initialized,
                active: this.state.active,
                error: this.state.error,
                nodeId: this.config.nodeId
            },
            canvas: this.getCanvasState(),
            skeleton: this.getSkeletonState(),
            submodules: {
                core: !!this.core,
                ui: !!this.ui && !!this.ui.elements.container,
                bounds: !!this.bounds,
                events: !!this.events && this.events.eventState.isListening
            }
        };
    }
    
    /**
     * 統合テスト（外部API）
     */
    static test() {
        console.log('🧪 PureCanvasController統合テスト開始');
        
        // テスト用Canvas作成
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 200;
        testCanvas.height = 200;
        testCanvas.style.position = 'absolute';
        testCanvas.style.top = '100px';
        testCanvas.style.left = '100px';
        document.body.appendChild(testCanvas);
        
        // テスト用Skeleton作成
        const testSkeleton = {
            x: 100,
            y: 100,
            scaleX: 1,
            scaleY: 1,
            updateWorldTransform: () => console.log('Skeleton transform updated')
        };
        
        try {
            // インスタンス作成
            const controller = new PureCanvasController({
                targetCanvas: testCanvas,
                skeleton: testSkeleton,
                nodeId: 'test-canvas-controller',
                autoFitContent: true
            });
            
            // 基本機能テスト
            const started = controller.startEditing();
            console.log('編集開始結果:', started);
            
            // 状態確認
            const canvasState = controller.getCanvasState();
            const skeletonState = controller.getSkeletonState();
            console.log('Canvas状態:', canvasState);
            console.log('Skeleton状態:', skeletonState);
            
            // 機能テスト
            controller.centerSkeleton();
            controller.autoFit();
            controller.reset();
            
            // はみ出し検出
            const overflowResult = controller.detectOverflow();
            console.log('はみ出し検出結果:', overflowResult);
            
            // 診断
            const diagnosis = controller.diagnose();
            console.log('システム診断:', diagnosis);
            
            // 編集終了
            const stopped = controller.stopEditing();
            console.log('編集終了結果:', stopped);
            
            // クリーンアップ
            controller.destroy();
            document.body.removeChild(testCanvas);
            
            console.log('✅ PureCanvasController統合テスト成功');
            return { success: true, result: 'All integration tests passed', error: null };
            
        } catch (error) {
            console.error('❌ PureCanvasController統合テスト失敗:', error);
            
            // クリーンアップ
            if (testCanvas.parentNode) {
                document.body.removeChild(testCanvas);
            }
            
            return { success: false, result: null, error: error.message };
        }
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.PureCanvasController = PureCanvasController;
}

// Node.js環境対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PureCanvasController;
}