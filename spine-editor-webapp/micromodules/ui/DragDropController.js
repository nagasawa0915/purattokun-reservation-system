/**
 * DragDropController.js - ドラッグ&ドロップコントローラー
 * 機能: パネルD&D・視覚フィードバック・位置入れ替え・縦積み対応
 */
export class DragDropController {
    constructor(panelManager, layoutManager = null) {
        this.panelManager = panelManager;
        this.layoutManager = layoutManager;
        this.isDraggingPanel = false;
        this.draggedPanel = null;
        this.dropZone = null;
        this.stackDropZones = new Map(); // 縦積み用ドロップゾーン
        this.state = 'initializing';
        
        console.log('🔄 DragDropController初期化（縦積み対応版）');
    }

    /**
     * D&D機能初期化
     */
    initializeDragDrop() {
        console.log('🔄 D&D機能初期化開始（縦積み対応）');
        
        this.dropZone = document.getElementById('drop-zone');
        if (!this.dropZone) {
            console.warn('⚠️ drop-zone要素が見つかりません');
            return 0;
        }
        
        // 縦積み用ドロップゾーン作成
        this.createStackDropZones();
        
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
     * 縦積み用ドロップゾーン作成
     */
    createStackDropZones() {
        const stackAreas = [
            { id: 'left-stack', area: 'left', title: '左サイドに縦積み' },
            { id: 'right-stack', area: 'right', title: '右サイドに縦積み' }
        ];
        
        stackAreas.forEach(config => {
            const stackZone = document.createElement('div');
            stackZone.className = 'stack-drop-zone';
            stackZone.id = config.id;
            stackZone.dataset.stackArea = config.area;
            stackZone.title = config.title;
            
            stackZone.style.cssText = `
                position: fixed;
                background: rgba(0, 255, 136, 0.2);
                border: 3px dashed #00ff88;
                border-radius: 8px;
                pointer-events: none;
                opacity: 0;
                transition: all 0.3s ease;
                z-index: 1500;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #00ff88;
                font-weight: bold;
                font-size: 14px;
                text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
            `;
            
            stackZone.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 24px; margin-bottom: 5px;">📚</div>
                    <div>${config.title}</div>
                </div>
            `;
            
            document.body.appendChild(stackZone);
            this.stackDropZones.set(config.area, stackZone);
            
            console.log(`📚 縦積みドロップゾーン作成: ${config.area}`);
        });
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
     * パネルドラッグ処理（縦積み対応）
     */
    handlePanelDrag(event) {
        if (!this.isDraggingPanel || !this.draggedPanel) return;
        
        // 画面端での縦積みゾーン表示判定
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const edgeThreshold = 100; // 画面端から100px以内
        
        // 左端検出
        if (event.clientX <= edgeThreshold) {
            this.showStackDropZone('left', event);
            this.hideStackDropZone('right');
            this.hideDropZone();
            return;
        }
        
        // 右端検出  
        if (event.clientX >= screenWidth - edgeThreshold) {
            this.showStackDropZone('right', event);
            this.hideStackDropZone('left');
            this.hideDropZone();
            return;
        }
        
        // 縦積みゾーン非表示
        this.hideStackDropZone('left');
        this.hideStackDropZone('right');
        
        // 通常のパネル入れ替えドロップ検出
        const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
        const targetPanel = elementBelow?.closest('.panel[data-panel]');
        
        if (targetPanel && targetPanel.dataset.panel !== this.draggedPanel) {
            this.showDropZone(targetPanel);
        } else {
            this.hideDropZone();
        }
    }

    /**
     * 縦積みドロップゾーン表示
     * @param {string} area - left/right
     * @param {MouseEvent} event - マウスイベント
     */
    showStackDropZone(area, event) {
        const stackZone = this.stackDropZones.get(area);
        if (!stackZone) return;
        
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const zoneWidth = 200;
        const zoneHeight = 150;
        
        if (area === 'left') {
            stackZone.style.left = '20px';
        } else {
            stackZone.style.left = `${screenWidth - zoneWidth - 20}px`;
        }
        
        stackZone.style.top = `${Math.max(80, event.clientY - zoneHeight / 2)}px`;
        stackZone.style.width = `${zoneWidth}px`;
        stackZone.style.height = `${zoneHeight}px`;
        stackZone.style.opacity = '1';
        stackZone.style.transform = 'scale(1.05)';
        
        // アクティブ状態設定
        stackZone.classList.add('active');
        stackZone.currentArea = area;
    }

    /**
     * 縦積みドロップゾーン非表示
     * @param {string} area - left/right
     */
    hideStackDropZone(area) {
        const stackZone = this.stackDropZones.get(area);
        if (!stackZone) return;
        
        stackZone.style.opacity = '0';
        stackZone.style.transform = 'scale(1)';
        stackZone.classList.remove('active');
        stackZone.currentArea = null;
    }

    /**
     * パネルドラッグ終了（縦積み対応）
     */
    endPanelDrag() {
        if (!this.isDraggingPanel) return;
        
        const draggedElement = this.panelManager.findPanel(this.draggedPanel)?.element;
        const draggedHeader = draggedElement?.querySelector('.panel-header');
        
        if (draggedHeader) {
            draggedHeader.classList.remove('dragging');
        }
        
        // 縦積みドロップ処理
        const activeStackZone = Array.from(this.stackDropZones.values())
            .find(zone => zone.classList.contains('active'));
        
        if (activeStackZone && activeStackZone.currentArea) {
            this.handleStackDrop(activeStackZone.currentArea, this.draggedPanel);
        } else {
            // 通常のパネル入れ替え処理
            const dropZone = document.querySelector('.drop-zone.active');
            if (dropZone && dropZone.targetPanel) {
                const targetPanelId = dropZone.targetPanel.dataset.panel;
                if (targetPanelId !== this.draggedPanel) {
                    this.swapPanels(this.draggedPanel, targetPanelId);
                }
            }
        }
        
        // クリーンアップ
        this.hideDropZone();
        this.hideStackDropZone('left');
        this.hideStackDropZone('right');
        this.isDraggingPanel = false;
        this.draggedPanel = null;
        this.state = 'ready';
        
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        console.log('✅ パネルドラッグ完了（縦積み対応）');
    }

    /**
     * 縦積みドロップ処理
     * @param {string} area - left/right
     * @param {string} panelId - ドロップされたパネルID
     */
    handleStackDrop(area, panelId) {
        console.log(`📚 縦積みドロップ実行: ${panelId} → ${area}サイド`);
        
        if (!this.layoutManager) {
            console.warn('⚠️ LayoutManagerが設定されていません');
            return;
        }
        
        // 現在の縦積み状態を取得
        const currentStacks = this.getCurrentStacks();
        
        // 新しい縦積み配置作成
        if (!currentStacks[area]) {
            currentStacks[area] = [];
        }
        
        // パネルを追加（重複チェック）
        if (!currentStacks[area].includes(panelId)) {
            currentStacks[area].push(panelId);
        }
        
        // 他の場所から移動（重複削除）
        Object.keys(currentStacks).forEach(otherArea => {
            if (otherArea !== area) {
                const index = currentStacks[otherArea].indexOf(panelId);
                if (index !== -1) {
                    currentStacks[otherArea].splice(index, 1);
                }
            }
        });
        
        // レイアウト更新
        this.applyStackedLayout(currentStacks);
        
        console.log(`✅ 縦積み完了: ${area}サイド`, currentStacks[area]);
    }

    /**
     * 現在の縦積み状態取得
     */
    getCurrentStacks() {
        const saved = localStorage.getItem('spine-editor-stacks');
        return saved ? JSON.parse(saved) : { left: [], right: [] };
    }

    /**
     * 縦積みレイアウト適用
     * @param {Object} stacks - 縦積み状態
     */
    applyStackedLayout(stacks) {
        // 状態保存
        localStorage.setItem('spine-editor-stacks', JSON.stringify(stacks));
        
        // LayoutManagerで動的レイアウト適用
        if (stacks.left.length > 0 && stacks.right.length > 0) {
            this.layoutManager.switchLayout('both-stacked');
        } else if (stacks.left.length > 0) {
            this.layoutManager.switchLayout('left-stacked');
        } else if (stacks.right.length > 0) {
            this.layoutManager.switchLayout('right-stacked');
        } else {
            this.layoutManager.switchLayout('default');
        }
        
        // カスタム縦積み適用
        this.applyCustomStacking(stacks);
    }

    /**
     * カスタム縦積み適用
     * @param {Object} stacks - 縦積み状態
     */
    applyCustomStacking(stacks) {
        Object.entries(stacks).forEach(([area, panelIds]) => {
            if (panelIds.length > 1) {
                // 複数パネルがある場合は動的グリッド生成
                this.layoutManager.stackPanelsVertically(area, panelIds);
            }
        });
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