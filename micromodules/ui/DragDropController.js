/**
 * DragDropController.js - ドラッグ&ドロップコントローラー
 * 機能: パネルD&D・視覚フィードバック・位置入れ替え
 */
export class DragDropController {
    constructor(panelManager) {
        this.panelManager = panelManager;
        this.isDraggingPanel = false;
        this.draggedPanel = null;
        this.dropZone = null;
        this.state = 'initializing';
    }

    /**
     * D&D機能初期化
     */
    initializeDragDrop() {
        console.log('🔄 D&D機能初期化開始');
        
        this.dropZone = document.getElementById('drop-zone');
        if (!this.dropZone) {
            console.warn('⚠️ drop-zone要素が見つかりません');
            return 0;
        }
        
        // 各パネルヘッダーにドラッグ機能追加
        let initializedCount = 0;
        this.panelManager.getAllPanels().forEach(panelId => {
            const panel = this.panelManager.findPanel(panelId);
            if (panel) {
                const header = panel.element.querySelector('.panel-header');
                if (header) {
                    header.addEventListener('mousedown', (e) => this.startPanelDrag(e, panelId));
                    console.log(`✅ D&D設定: ${panelId}`);
                    initializedCount++;
                }
            }
        });
        
        // グローバルD&Dイベント
        document.addEventListener('mousemove', (e) => this.handlePanelDrag(e));
        document.addEventListener('mouseup', () => this.endPanelDrag());
        
        console.log(`🔄 D&D機能初期化完了: ${initializedCount}個`);
        this.state = 'ready';
        return initializedCount;
    }

    /**
     * パネルドラッグ開始
     */
    startPanelDrag(event, panelId) {
        event.preventDefault();
        this.isDraggingPanel = true;
        this.draggedPanel = panelId;
        this.state = 'dragging';
        
        const header = event.currentTarget;
        header.classList.add('dragging');
        
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        
        console.log(`🖱️ パネルドラッグ開始: ${panelId}`);
    }

    /**
     * パネルドラッグ処理
     */
    handlePanelDrag(event) {
        if (!this.isDraggingPanel || !this.draggedPanel) return;
        
        // ドロップ可能エリアの検出
        const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
        const targetPanel = elementBelow?.closest('.panel[data-panel]');
        
        if (targetPanel && targetPanel.dataset.panel !== this.draggedPanel) {
            this.showDropZone(targetPanel);
        } else {
            this.hideDropZone();
        }
    }

    /**
     * パネルドラッグ終了
     */
    endPanelDrag() {
        if (!this.isDraggingPanel) return;
        
        const draggedElement = this.panelManager.findPanel(this.draggedPanel)?.element;
        const draggedHeader = draggedElement?.querySelector('.panel-header');
        
        if (draggedHeader) {
            draggedHeader.classList.remove('dragging');
        }
        
        // ドロップ処理
        const dropZone = document.querySelector('.drop-zone.active');
        if (dropZone && dropZone.targetPanel) {
            const targetPanelId = dropZone.targetPanel.dataset.panel;
            if (targetPanelId !== this.draggedPanel) {
                this.swapPanels(this.draggedPanel, targetPanelId);
            }
        }
        
        this.hideDropZone();
        this.isDraggingPanel = false;
        this.draggedPanel = null;
        this.state = 'ready';
        
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        console.log('✅ パネルドラッグ完了');
    }

    /**
     * ドロップゾーン表示
     */
    showDropZone(targetPanel) {
        if (!this.dropZone) return;
        
        const rect = targetPanel.getBoundingClientRect();
        
        this.dropZone.style.left = rect.left + 'px';
        this.dropZone.style.top = rect.top + 'px';
        this.dropZone.style.width = rect.width + 'px';
        this.dropZone.style.height = rect.height + 'px';
        this.dropZone.classList.add('active');
        this.dropZone.targetPanel = targetPanel;
    }

    /**
     * ドロップゾーン非表示
     */
    hideDropZone() {
        if (this.dropZone) {
            this.dropZone.classList.remove('active');
            this.dropZone.targetPanel = null;
        }
    }

    /**
     * パネル入れ替え
     */
    swapPanels(panelId1, panelId2) {
        console.log(`🔄 パネル入れ替え: ${panelId1} ↔ ${panelId2}`);
        
        const panel1 = this.panelManager.findPanel(panelId1);
        const panel2 = this.panelManager.findPanel(panelId2);
        
        if (!panel1 || !panel2) {
            console.warn('⚠️ パネルが見つかりません');
            return false;
        }
        
        try {
            // CSS Grid Areaを入れ替え
            const gridArea1 = getComputedStyle(panel1.element).gridArea;
            const gridArea2 = getComputedStyle(panel2.element).gridArea;
            
            panel1.element.style.gridArea = gridArea2;
            panel2.element.style.gridArea = gridArea1;
            
            console.log(`✅ パネル入れ替え完了: ${panelId1} ↔ ${panelId2}`);
            
            // 入れ替え完了をイベントで通知
            this.dispatchSwapEvent(panelId1, panelId2);
            
            return true;
        } catch (error) {
            console.error('❌ パネル入れ替え失敗:', error);
            return false;
        }
    }

    /**
     * 入れ替えイベント発火
     */
    dispatchSwapEvent(panelId1, panelId2) {
        const event = new CustomEvent('panelSwap', {
            detail: {
                panel1: panelId1,
                panel2: panelId2,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * D&D状態取得
     */
    getDragDropStatus() {
        return {
            state: this.state,
            isDragging: this.isDraggingPanel,
            draggedPanel: this.draggedPanel,
            hasDropZone: !!this.dropZone
        };
    }

    /**
     * D&D無効化
     */
    disable() {
        if (this.isDraggingPanel) {
            this.endPanelDrag();
        }
        this.state = 'disabled';
        console.log('🚫 D&D機能無効化');
    }

    /**
     * D&D有効化
     */
    enable() {
        this.state = 'ready';
        console.log('✅ D&D機能有効化');
    }

    /**
     * クリーンアップ
     */
    cleanup() {
        if (this.isDraggingPanel) {
            this.endPanelDrag();
        }
        this.hideDropZone();
        this.state = 'cleanup';
        console.log('🧹 D&Dコントローラークリーンアップ完了');
    }
}

export default DragDropController;