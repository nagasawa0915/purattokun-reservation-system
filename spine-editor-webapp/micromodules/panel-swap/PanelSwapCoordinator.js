/**
 * PanelSwapCoordinator.js - パネル入れ替え統合コーディネーター
 * 
 * 🎯 責務：各マイクロモジュールの統合・ドラッグイベント管理
 * - ドラッグイベントの制御
 * - モジュール間のデータ受け渡し
 * - レイアウト適用の実行
 * - シンプルな状態管理
 */
import { DropDetector } from './DropDetector.js';
import { HighlightRenderer } from './HighlightRenderer.js';
import { LayoutGenerator } from './LayoutGenerator.js';
import { BorderManager } from './BorderManager.js';

export class PanelSwapCoordinator {
    constructor(panelManager, layoutManager = null) {
        this.panelManager = panelManager;
        this.layoutManager = layoutManager;
        this.state = 'initializing';
        
        // ドラッグ状態
        this.dragState = {
            isDragging: false,
            draggedPanel: null,
            draggedElement: null,
            currentTarget: null,
            currentHighlight: null
        };

        // マイクロモジュール初期化
        this.dropDetector = new DropDetector();
        this.highlightRenderer = new HighlightRenderer();
        this.layoutGenerator = new LayoutGenerator();
        this.borderManager = new BorderManager();

        console.log('🎯 PanelSwapCoordinator初期化開始');
    }

    /**
     * 🚀 システム初期化
     */
    initialize() {
        console.log('🔧 パネル入れ替えシステム初期化開始');
        
        try {
            let initializedCount = 0;
            
            // 各パネルにドラッグ機能を設定
            this.panelManager.getAllPanels().forEach(panelId => {
                const panel = this.panelManager.findPanel(panelId);
                if (panel) {
                    const header = panel.element.querySelector('.panel-header');
                    if (header) {
                        this.setupPanelDrag(header, panelId);
                        initializedCount++;
                    }
                }
            });

            // グローバルイベントリスナー設定
            this.setupGlobalEvents();

            this.state = 'ready';
            console.log(`✅ パネル入れ替えシステム初期化完了: ${initializedCount}個`);
            return initializedCount;

        } catch (error) {
            console.error('❌ 初期化エラー:', error);
            this.state = 'error';
            return 0;
        }
    }

    /**
     * 🖱️ パネルドラッグ設定
     */
    setupPanelDrag(header, panelId) {
        header.addEventListener('mousedown', (e) => this.startDrag(e, panelId));
        header.style.cursor = 'grab';
        
        // ホバー効果
        header.addEventListener('mouseenter', () => {
            if (!this.dragState.isDragging) {
                header.style.background = '#4a4a4a';
                header.style.transform = 'scale(1.02)';
            }
        });
        
        header.addEventListener('mouseleave', () => {
            if (!this.dragState.isDragging) {
                header.style.background = '';
                header.style.transform = '';
            }
        });
    }

    /**
     * 🌐 グローバルイベント設定
     */
    setupGlobalEvents() {
        document.addEventListener('mousemove', (e) => this.handleDrag(e));
        document.addEventListener('mouseup', () => this.endDrag());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.dragState.isDragging) {
                this.cancelDrag();
            }
        });
    }

    /**
     * 🚀 ドラッグ開始
     */
    startDrag(event, panelId) {
        event.preventDefault();
        
        this.dragState.isDragging = true;
        this.dragState.draggedPanel = panelId;
        this.dragState.draggedElement = this.panelManager.findPanel(panelId)?.element;
        
        const header = event.currentTarget;
        header.classList.add('dragging');
        header.style.cursor = 'grabbing';
        
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        
        console.log(`🚀 ドラッグ開始: ${panelId}`);
    }

    /**
     * 🔄 ドラッグ処理
     */
    handleDrag(event) {
        if (!this.dragState.isDragging) return;

        // マウス下の要素を取得
        const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
        const targetPanel = elementBelow?.closest('.panel[data-panel]');
        
        if (!targetPanel || targetPanel.dataset.panel === this.dragState.draggedPanel) {
            this.highlightRenderer.hideAllHighlights();
            this.dragState.currentTarget = null;
            return;
        }

        this.dragState.currentTarget = targetPanel;
        
        // ドロップエリア検出
        const dropArea = this.dropDetector.detectDropArea(event, targetPanel);
        
        // 全パネル取得（境界線検出用）
        const allPanels = this.getAllPanelElements();
        const boundaryArea = this.dropDetector.detectBoundaryZone(event, allPanels);
        
        // 境界線管理による競合解決
        const resolvedArea = this.borderManager.resolveAreaConflict(dropArea, boundaryArea);
        
        // ハイライト表示
        this.updateHighlight(resolvedArea);
    }

    /**
     * 🎨 ハイライト更新
     */
    updateHighlight(resolvedArea) {
        if (!resolvedArea) {
            this.highlightRenderer.hideAllHighlights();
            this.dragState.currentHighlight = null;
            return;
        }

        const { type, area } = resolvedArea;
        
        if (type === 'boundary') {
            this.highlightRenderer.showBoundaryHighlight(area);
            this.dragState.currentHighlight = { type: 'boundary', data: area };
        } else {
            // ドロップエリアに draggedPanel 情報を追加
            area.draggedPanel = this.dragState.draggedPanel;
            this.highlightRenderer.showDropHighlight(area);
            this.dragState.currentHighlight = { type: 'drop', data: area };
        }
    }

    /**
     * ✅ ドラッグ終了
     */
    endDrag() {
        if (!this.dragState.isDragging) return;
        
        console.log('✅ ドラッグ終了処理開始');
        
        // ドロップ実行
        const dropResult = this.executeDrop();
        
        // クリーンアップ
        this.cleanupDragState();
        
        console.log('✅ ドラッグ完了', dropResult);
        
        // システム全体にイベント通知
        if (dropResult.success) {
            this.dispatchPanelSwapEvent(dropResult);
        }
    }

    /**
     * 🎯 ドロップ実行
     */
    executeDrop() {
        if (!this.dragState.currentHighlight) {
            return { success: false, reason: 'No valid drop area' };
        }

        const { type, data } = this.dragState.currentHighlight;
        
        try {
            if (type === 'boundary') {
                return this.executeBoundaryDrop(data);
            } else {
                return this.executeNormalDrop(data);
            }
        } catch (error) {
            console.error('❌ ドロップ実行エラー:', error);
            return { success: false, reason: error.message };
        }
    }

    /**
     * 🎯 通常ドロップ実行
     */
    executeNormalDrop(dropData) {
        const layout = this.layoutGenerator.generateLayout(dropData);
        
        if (!layout) {
            return { success: false, reason: 'No layout generated' };
        }

        return this.applyLayout(layout);
    }

    /**
     * 🎯 境界線ドロップ実行
     */
    executeBoundaryDrop(boundaryData) {
        // 境界線ドロップは隣接パネル間への挿入として処理
        // 簡略化：最初のパネルをターゲットとして通常の分割処理
        const targetPanel = boundaryData.panels[0];
        const targetId = targetPanel.dataset.panel;
        
        const dropData = {
            type: boundaryData.type === 'vertical' ? 'right' : 'bottom',
            draggedPanel: this.dragState.draggedPanel,
            target: {
                id: targetId,
                element: targetPanel,
                rect: targetPanel.getBoundingClientRect()
            }
        };

        return this.executeNormalDrop(dropData);
    }

    /**
     * 🎨 レイアウト適用
     */
    applyLayout(layout) {
        if (layout.type === 'swap') {
            return this.executeSwap(layout.panels[0], layout.panels[1]);
        }
        
        try {
            // CSS Grid設定更新
            if (layout.areas) {
                document.body.style.setProperty('grid-template-areas', layout.areas.join(' '), 'important');
            }
            if (layout.columns) {
                document.body.style.setProperty('grid-template-columns', layout.columns, 'important');
            }
            if (layout.rows) {
                document.body.style.setProperty('grid-template-rows', layout.rows, 'important');
            }

            // パネル要素のgrid-area更新
            this.updatePanelGridAreas();
            
            return { 
                success: true, 
                action: layout.action,
                layout: layout
            };
            
        } catch (error) {
            console.error('❌ レイアウト適用エラー:', error);
            return { success: false, reason: error.message };
        }
    }

    /**
     * 🔄 パネル入れ替え実行
     */
    executeSwap(draggedId, targetId) {
        const draggedPanel = this.panelManager.findPanel(draggedId);
        const targetPanel = this.panelManager.findPanel(targetId);
        
        if (!draggedPanel || !targetPanel) {
            return { success: false, reason: 'Panel not found' };
        }
        
        // CSS Grid Area を入れ替え
        const draggedArea = getComputedStyle(draggedPanel.element).gridArea;
        const targetArea = getComputedStyle(targetPanel.element).gridArea;
        
        draggedPanel.element.style.gridArea = targetArea;
        targetPanel.element.style.gridArea = draggedArea;
        
        return { 
            success: true, 
            action: 'swap', 
            panels: [draggedId, targetId] 
        };
    }

    /**
     * 📍 パネルgrid-area更新
     */
    updatePanelGridAreas() {
        this.panelManager.getAllPanels().forEach(panelId => {
            const panel = this.panelManager.findPanel(panelId);
            if (panel) {
                panel.element.style.gridArea = panelId;
            }
        });
    }

    /**
     * 🧹 ドラッグ状態クリーンアップ
     */
    cleanupDragState() {
        this.dragState.isDragging = false;
        this.dragState.draggedPanel = null;
        this.dragState.draggedElement = null;
        this.dragState.currentTarget = null;
        this.dragState.currentHighlight = null;
        
        // ハイライト非表示
        this.highlightRenderer.hideAllHighlights();
        
        // スタイルリセット
        const draggedHeader = document.querySelector('.panel-header.dragging');
        if (draggedHeader) {
            draggedHeader.classList.remove('dragging');
            draggedHeader.style.cursor = 'grab';
        }
        
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }

    /**
     * ❌ ドラッグキャンセル
     */
    cancelDrag() {
        console.log('❌ ドラッグキャンセル');
        this.cleanupDragState();
    }

    /**
     * 📡 パネル入れ替えイベント発行
     */
    dispatchPanelSwapEvent(result) {
        const event = new CustomEvent('panelSwap', {
            detail: {
                action: result.action,
                panels: result.panels || [this.dragState.draggedPanel],
                layout: result.layout,
                timestamp: Date.now()
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * 📋 全パネル要素取得
     */
    getAllPanelElements() {
        return this.panelManager.getAllPanels()
            .map(id => this.panelManager.findPanel(id)?.element)
            .filter(element => element && element !== this.dragState.draggedElement);
    }

    /**
     * 📊 デバッグ情報
     */
    getDebugInfo() {
        return {
            state: this.state,
            dragState: this.dragState,
            modules: {
                dropDetector: this.dropDetector.constructor.name,
                highlightRenderer: this.highlightRenderer.constructor.name,
                layoutGenerator: this.layoutGenerator.constructor.name,
                borderManager: this.borderManager.constructor.name
            }
        };
    }

    /**
     * 🧹 クリーンアップ
     */
    cleanup() {
        if (this.dragState.isDragging) {
            this.cancelDrag();
        }
        
        this.highlightRenderer.cleanup();
        this.state = 'cleanup';
        
        console.log('🧹 PanelSwapCoordinator クリーンアップ完了');
    }
}

export default PanelSwapCoordinator;