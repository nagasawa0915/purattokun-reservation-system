/**
 * ModularPanelSystem.js - DragDetector + PanelInserter 統合管理
 * 機能: ドラッグ操作 → パネル挿入処理の橋渡し
 * 設計: 薄い連携レイヤー（50-70行）・SystemCoordinator互換API
 */
import { PanelInserter } from './PanelInserter.js';

export class ModularPanelSystem {
    constructor() {
        this.state = 'initializing';
        this.dragDetector = null;
        this.panelInserter = new PanelInserter();
        this.eventListeners = [];
        
        console.log('⚡ ModularPanelSystem初期化開始');
        this.init();
    }
    
    /**
     * システム初期化
     */
    init() {
        try {
            // DragDetectorを動的インポートで初期化
            this.initializeDragDetector();
            this.state = 'ready';
            console.log('✅ ModularPanelSystem初期化完了');
        } catch (error) {
            this.state = 'error';
            console.error('❌ ModularPanelSystem初期化エラー:', error);
        }
    }
    
    /**
     * DragDetector初期化とイベント連携設定
     */
    initializeDragDetector() {
        // DragDetectorクラスが利用可能な場合のみ初期化
        if (typeof DragDetector === 'undefined' && typeof window.DragDetector === 'undefined') {
            console.warn('⚠️ DragDetector未読み込み');
            console.warn('  - typeof DragDetector:', typeof DragDetector);
            console.warn('  - typeof window.DragDetector:', typeof window.DragDetector);
            console.warn('  - スクリプト読み込み後に再初期化が必要');
            return;
        }
        
        // グローバルDragDetectorを使用
        const DragDetectorClass = window.DragDetector || DragDetector;
        
        this.dragDetector = new DragDetectorClass({
            onDrop: (event, source, target, operation) => {
                this.handleDrop(event, source, target, operation);
            },
            onDragStart: (event, source) => {
                console.log('🎯 ドラッグ開始:', source?.dataset?.panel);
            }
        });
        
        // パネル要素をドラッグ可能に設定
        this.enablePanelDragging();
        
        console.log('✅ DragDetector統合完了');
    }
    
    /**
     * ドロップイベント処理 - PanelInserterへの橋渡し
     */
    handleDrop(event, source, target, operation) {
        console.log('🔄 ドロップ操作検出:', operation);
        
        // 必要な情報の検証
        if (!operation.source) {
            console.error('❌ ドラッグソースが特定できません:', { source, target, operation });
            return;
        }
        
        if (!operation.target) {
            console.error('❌ ドロップターゲットが特定できません:', { source, target, operation });
            return;
        }
        
        if (operation.source === operation.target) {
            console.log('⚠️ 同じパネルへのドロップは無視します');
            return;
        }
        
        try {
            console.log('🎯 パネル挿入実行:', `${operation.source} → ${operation.target} (${operation.position})`);
            const result = this.panelInserter.insertHorizontally(
                operation.source,
                operation.target, 
                operation.position
            );
            
            if (result.success) {
                this.dispatchPanelEvent('panelInserted', {
                    success: true,
                    operation: result.operation,
                    newOrder: result.newOrder
                });
                console.log('✅ パネル挿入成功:', result.operation);
            } else {
                this.dispatchPanelEvent('panelInsertFailed', {
                    success: false,
                    error: result.error,
                    operation: operation
                });
                console.error('❌ パネル挿入失敗:', result.error);
            }
        } catch (error) {
            console.error('❌ ドロップ処理エラー:', error);
        }
    }
    
    /**
     * パネル要素のドラッグ機能有効化
     */
    enablePanelDragging() {
        document.querySelectorAll('[data-panel]').forEach(panel => {
            panel.draggable = true;
            panel.style.cursor = 'grab';
        });
        console.log('🎯 パネルドラッグ機能有効化完了');
    }
    
    /**
     * カスタムイベント配信
     */
    dispatchPanelEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }
    
    // SystemCoordinator互換API
    
    /**
     * 初期化カウント（SystemCoordinator互換）
     */
    initialize() {
        this.enablePanelDragging();
        return 3; // 水平パネル数
    }
    
    /**
     * パネルグリッドエリア初期化（SystemCoordinator互換）
     */
    initializePanelGridAreas() {
        return this.panelInserter.initializePanelGridAreas();
    }
    
    /**
     * ドラッグ操作キャンセル（SystemCoordinator互換）
     */
    cancelDrag() {
        if (this.dragDetector && this.dragDetector.reset) {
            this.dragDetector.reset();
        }
        console.log('🛑 ドラッグ操作キャンセル');
    }
    
    /**
     * デバッグ情報取得（UltraSimplePanelSwap互換）
     */
    getDebugInfo() {
        return {
            state: this.state,
            dragDetector: this.dragDetector ? 'initialized' : 'pending',
            panelInserter: this.panelInserter.getDebugInfo(),
            method: 'modular-panel-system'
        };
    }
    
    /**
     * システムクリーンアップ
     */
    cleanup() {
        if (this.dragDetector && this.dragDetector.destroy) {
            this.dragDetector.destroy();
        }
        this.panelInserter.cleanup();
        this.state = 'cleanup';
        console.log('🧹 ModularPanelSystemクリーンアップ完了');
    }
}

// SystemCoordinator統合時の使用方法：
//
// 1. localStorage設定でモジュラーシステム有効化
//    localStorage.setItem('spine-editor-use-modular-panels', 'true');
//
// 2. DragDetector.jsの読み込み確保（HTML内で）
//    <script src="micromodules/ui/modular-panel-system/DragDetector.js"></script>
//
// 3. SystemCoordinator が自動的にModularPanelSystemを初期化
//
// 4. デバッグ情報確認
//    console.log(window.systemCoordinator.panelSwapController.getDebugInfo());

export default ModularPanelSystem;