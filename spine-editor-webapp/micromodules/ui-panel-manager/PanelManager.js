/**
 * PanelManager.js - パネル管理・ドラッグ&ドロップ・レイアウト制御
 * 
 * 責務:
 * - パネルのドラッグ&ドロップ
 * - パネルのリサイズ
 * - パネルの表示/非表示・最小化
 * - レイアウト管理
 * 
 * 非責務:
 * - パネルの中身（各モジュールが担当）
 */

class PanelManager {
    constructor(options = {}) {
        this.panels = new Map();
        this.isDragging = false;
        this.resizing = null;
        this.dragging = null;
        this.panelOrder = [];
        
        // 設定
        this.config = {
            minWidth: options.minWidth || 150,
            maxWidth: options.maxWidth || 400,
            enableDrag: options.enableDrag !== false,
            enableResize: options.enableResize !== false,
            enableKeyboardShortcuts: options.enableKeyboardShortcuts !== false,
            ...options
        };
        
        this.eventBus = options.eventBus || null;
        
        this.init();
    }

    init() {
        this.initializeExistingPanels();
        this.initializeResizeHandles();
        this.initializePanelControls();
        this.bindEvents();
        
        this.emit('panelManager:initialized');
    }

    /**
     * 既存のパネル要素を自動検出・登録
     */
    initializeExistingPanels() {
        const panelElements = document.querySelectorAll('.panel[data-panel-type]');
        panelElements.forEach(element => {
            const type = element.dataset.panelType;
            this.registerPanel(type, element);
        });
        
        console.log(`PanelManager: ${this.panels.size} panels auto-registered`);
    }

    /**
     * パネルを登録
     * @param {string} id - パネルID
     * @param {HTMLElement} element - パネルのHTML要素
     * @param {Object} module - 実際の機能モジュール（オプション）
     */
    registerPanel(id, element, module = null) {
        if (!element || !element.nodeType) {
            throw new Error(`Invalid element for panel: ${id}`);
        }

        const panelData = {
            id,
            element,
            module,
            isMinimized: false,
            isVisible: true,
            originalWidth: null,
            config: {
                resizable: element.dataset.resizable !== 'false',
                draggable: element.dataset.draggable !== 'false',
                closable: element.dataset.closable !== 'false'
            }
        };

        this.panels.set(id, panelData);
        
        // パネル順序に追加
        if (!this.panelOrder.includes(id)) {
            this.panelOrder.push(id);
        }

        this.emit('panel:registered', { id, element, module });
        
        console.log(`Panel registered: ${id}`);
        return panelData;
    }

    /**
     * パネルの登録解除
     */
    unregisterPanel(id) {
        if (this.panels.has(id)) {
            const panelData = this.panels.get(id);
            this.panels.delete(id);
            
            // パネル順序からも削除
            const index = this.panelOrder.indexOf(id);
            if (index > -1) {
                this.panelOrder.splice(index, 1);
            }
            
            this.emit('panel:unregistered', { id, panelData });
            this.updatePanelOrder();
        }
    }

    initializeResizeHandles() {
        const resizeHandles = document.querySelectorAll('.resize-handle');
        resizeHandles.forEach(handle => {
            handle.addEventListener('mousedown', this.startResize.bind(this));
        });
    }

    initializePanelControls() {
        // パネルボタン（最小化・閉じる）
        const panelButtons = document.querySelectorAll('.panel-btn');
        panelButtons.forEach(button => {
            button.addEventListener('click', this.handlePanelControl.bind(this));
        });

        // ドラッグ機能（有効な場合）
        if (this.config.enableDrag) {
            const panelHeaders = document.querySelectorAll('.panel-header');
            panelHeaders.forEach(header => {
                const panel = header.closest('.panel');
                const panelId = panel?.dataset.panelType;
                
                if (panelId && this.panels.has(panelId)) {
                    const panelData = this.panels.get(panelId);
                    if (panelData.config.draggable) {
                        header.style.cursor = 'grab';
                        header.addEventListener('mousedown', this.startPanelDrag.bind(this));
                    }
                }
            });
        }
    }

    bindEvents() {
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        if (this.config.enableKeyboardShortcuts) {
            document.addEventListener('keydown', this.handleKeyboard.bind(this));
        }
        
        window.addEventListener('resize', this.handleWindowResize.bind(this));
    }

    // === ドラッグ&ドロップ機能 ===

    startPanelDrag(event) {
        if (event.target.classList.contains('panel-btn')) {
            return;
        }

        event.preventDefault();
        const header = event.currentTarget;
        const panel = header.closest('.panel');
        const panelType = panel.dataset.panelType;

        if (!this.panels.has(panelType)) return;

        this.dragging = {
            panel: panel,
            panelType: panelType,
            startX: event.clientX,
            startY: event.clientY
        };

        header.style.cursor = 'grabbing';
        document.body.classList.add('dragging');
        
        panel.style.opacity = '0.8';
        panel.style.transform = 'scale(0.98)';
        panel.style.zIndex = '1000';

        this.emit('panel:dragStart', { panelId: panelType, event });
    }

    handlePanelDrag(event) {
        if (!this.dragging) return;

        const dropTarget = this.getDropTarget(event.clientX, event.clientY);
        
        document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
        
        if (dropTarget && dropTarget !== this.dragging.panel) {
            this.showDropIndicator(dropTarget, event.clientX, event.clientY);
        }

        this.emit('panel:dragging', { 
            panelId: this.dragging.panelType, 
            dropTarget: dropTarget?.dataset.panelType,
            event 
        });
    }

    getDropTarget(x, y) {
        const elements = document.elementsFromPoint(x, y);
        for (let el of elements) {
            if (el.classList.contains('panel') && el !== this.dragging.panel) {
                return el;
            }
        }
        return null;
    }

    showDropIndicator(targetPanel, mouseX, mouseY) {
        const rect = targetPanel.getBoundingClientRect();
        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';
        
        const relativeX = (mouseX - rect.left) / rect.width;
        const isLeftSide = relativeX < 0.5;
        
        indicator.style.cssText = `
            position: absolute;
            top: ${rect.top}px;
            height: ${rect.height}px;
            width: 3px;
            background: var(--accent-blue);
            z-index: 1001;
            pointer-events: none;
            left: ${isLeftSide ? rect.left - 1.5 : rect.right - 1.5}px;
            box-shadow: 0 0 8px var(--accent-blue);
            animation: dropIndicatorPulse 1s ease-in-out infinite alternate;
        `;
        
        document.body.appendChild(indicator);
    }

    endPanelDrag() {
        if (!this.dragging) return;

        const dropTarget = this.getDropTarget(event.clientX, event.clientY);

        if (dropTarget) {
            const rect = dropTarget.getBoundingClientRect();
            const relativeX = (event.clientX - rect.left) / rect.width;
            const isLeftSide = relativeX < 0.5;
            
            this.reorderPanels(this.dragging.panelType, dropTarget.dataset.panelType, isLeftSide);
        }

        const panel = this.dragging.panel;
        const header = panel.querySelector('.panel-header');
        
        header.style.cursor = 'grab';
        panel.style.opacity = '';
        panel.style.transform = '';
        panel.style.zIndex = '';
        
        document.body.classList.remove('dragging');
        document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
        
        this.emit('panel:dragEnd', { 
            panelId: this.dragging.panelType,
            targetId: dropTarget?.dataset.panelType 
        });
        
        this.dragging = null;
    }

    reorderPanels(draggedType, targetType, insertBefore) {
        const currentIndex = this.panelOrder.indexOf(draggedType);
        this.panelOrder.splice(currentIndex, 1);
        
        const targetIndex = this.panelOrder.indexOf(targetType);
        const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
        this.panelOrder.splice(insertIndex, 0, draggedType);
        
        this.updatePanelOrder();
        
        this.emit('panel:reordered', { 
            draggedId: draggedType, 
            targetId: targetType, 
            newOrder: [...this.panelOrder] 
        });
    }

    // === リサイズ機能 ===

    startResize(event) {
        if (!this.config.enableResize) return;
        
        event.preventDefault();
        this.resizing = {
            handle: event.target,
            direction: event.target.dataset.direction,
            startX: event.clientX,
            startWidth: this.getCurrentWidth(event.target.dataset.direction)
        };
        document.body.classList.add('resizing');
        document.body.classList.add('dragging');

        this.emit('panel:resizeStart', { direction: this.resizing.direction });
    }

    getCurrentWidth(direction) {
        const style = getComputedStyle(document.documentElement);
        if (direction === 'left') {
            return parseInt(style.getPropertyValue('--outliner-width'));
        } else if (direction === 'right') {
            return parseInt(style.getPropertyValue('--properties-width'));
        }
        return 200;
    }

    // === パネル制御機能 ===

    handlePanelControl(event) {
        const button = event.target;
        const panel = button.closest('.panel');
        const panelType = panel.dataset.panelType;

        if (!this.panels.has(panelType)) return;

        if (button.textContent === '−') {
            this.toggleMinimize(panelType);
        } else if (button.textContent === '×') {
            this.toggleVisibility(panelType);
        }
    }

    toggleMinimize(panelId) {
        const panelData = this.panels.get(panelId);
        if (!panelData) return;

        const panel = panelData.element;
        const content = panel.querySelector('.panel-content');
        
        panelData.isMinimized = !panelData.isMinimized;
        
        if (panelData.isMinimized) {
            content.style.display = 'none';
            panel.classList.add('minimized');
        } else {
            content.style.display = 'block';
            panel.classList.remove('minimized');
        }

        this.emit('panel:minimized', { panelId, isMinimized: panelData.isMinimized });
    }

    toggleVisibility(panelId) {
        const panelData = this.panels.get(panelId);
        if (!panelData || !panelData.config.closable) return;

        const panel = panelData.element;
        
        panelData.isVisible = !panelData.isVisible;
        
        if (panelData.isVisible) {
            panel.style.display = 'flex';
        } else {
            panel.style.display = 'none';
            this.adjustLayoutForHiddenPanel(panelId);
        }

        this.emit('panel:visibilityChanged', { panelId, isVisible: panelData.isVisible });
    }

    // === レイアウト管理 ===

    updatePanelOrder() {
        const container = document.querySelector('.main-container');
        
        this.panelOrder.forEach((panelType, index) => {
            const panelData = this.panels.get(panelType);
            if (panelData) {
                panelData.element.style.order = index;
            }
        });

        const visiblePanels = this.panelOrder.filter(type => {
            const panelData = this.panels.get(type);
            return panelData && panelData.isVisible;
        });

        let gridTemplate = '';
        visiblePanels.forEach(type => {
            if (type === 'outliner') {
                gridTemplate += 'var(--outliner-width) ';
            } else if (type === 'properties') {
                gridTemplate += 'var(--properties-width) ';
            } else {
                gridTemplate += '1fr ';
            }
        });

        container.style.gridTemplateColumns = gridTemplate.trim();
        
        setTimeout(() => this.updateResizeHandlePositions(), 100);

        this.emit('layout:updated', { newOrder: [...this.panelOrder], visiblePanels });
    }

    adjustLayoutForHiddenPanel(hiddenPanelType) {
        const visiblePanels = Array.from(this.panels.entries())
            .filter(([type, data]) => data.isVisible)
            .map(([type]) => type);

        let gridTemplate;
        if (visiblePanels.length === 3) {
            gridTemplate = 'var(--outliner-width) 1fr var(--properties-width)';
        } else if (visiblePanels.length === 2) {
            if (!visiblePanels.includes('outliner')) {
                gridTemplate = '1fr var(--properties-width)';
            } else if (!visiblePanels.includes('properties')) {
                gridTemplate = 'var(--outliner-width) 1fr';
            } else {
                gridTemplate = 'var(--outliner-width) 1fr';
            }
        } else {
            gridTemplate = '1fr';
        }
        
        document.querySelector('.main-container').style.gridTemplateColumns = gridTemplate;
    }

    updateResizeHandlePositions() {
        const leftHandle = document.querySelector('.resize-handle-left');
        const rightHandle = document.querySelector('.resize-handle-right');
        
        const outlinerWidth = getComputedStyle(document.documentElement).getPropertyValue('--outliner-width');
        const propertiesWidth = getComputedStyle(document.documentElement).getPropertyValue('--properties-width');
        
        if (leftHandle) leftHandle.style.left = outlinerWidth;
        if (rightHandle) rightHandle.style.right = propertiesWidth;
    }

    // === マウスイベント処理 ===

    handleMouseMove(event) {
        if (this.resizing) {
            this.handleResize(event);
        } else if (this.dragging) {
            this.handlePanelDrag(event);
        }
    }

    handleResize(event) {
        const deltaX = event.clientX - this.resizing.startX;
        const newWidth = this.resizing.startWidth + (this.resizing.direction === 'left' ? deltaX : -deltaX);
        
        const clampedWidth = Math.max(this.config.minWidth, Math.min(this.config.maxWidth, newWidth));

        if (this.resizing.direction === 'left') {
            document.documentElement.style.setProperty('--outliner-width', `${clampedWidth}px`);
        } else if (this.resizing.direction === 'right') {
            document.documentElement.style.setProperty('--properties-width', `${clampedWidth}px`);
        }

        this.updateResizeHandlePositions();
        this.emit('panel:resizing', { direction: this.resizing.direction, width: clampedWidth });
    }

    handleMouseUp() {
        if (this.resizing) {
            this.emit('panel:resizeEnd', { direction: this.resizing.direction });
            this.resizing = null;
            document.body.classList.remove('resizing');
            document.body.classList.remove('dragging');
        } else if (this.dragging) {
            this.endPanelDrag();
        }
    }

    // === キーボードショートカット ===

    handleKeyboard(event) {
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case '1':
                    event.preventDefault();
                    this.toggleVisibility('outliner');
                    break;
                case '2':
                    event.preventDefault();
                    this.toggleVisibility('preview');
                    break;
                case '3':
                    event.preventDefault();
                    this.toggleVisibility('properties');
                    break;
                case 'r':
                    event.preventDefault();
                    this.resetLayout();
                    break;
            }
        }
    }

    resetLayout() {
        document.documentElement.style.setProperty('--outliner-width', '200px');
        document.documentElement.style.setProperty('--properties-width', '280px');
        
        this.panels.forEach((data, type) => {
            data.isMinimized = false;
            data.isVisible = true;
            data.element.style.display = 'flex';
            data.element.classList.remove('minimized');
            const content = data.element.querySelector('.panel-content');
            if (content) content.style.display = 'block';
        });

        this.panelOrder = ['outliner', 'preview', 'properties'];
        this.updatePanelOrder();

        this.emit('layout:reset');
    }

    handleWindowResize() {
        setTimeout(() => this.updateResizeHandlePositions(), 100);
        this.emit('window:resized');
    }

    // === 公開API ===

    /**
     * パネルの状態を取得
     */
    getPanelState(panelId) {
        const panelData = this.panels.get(panelId);
        if (!panelData) return null;

        return {
            id: panelId,
            isVisible: panelData.isVisible,
            isMinimized: panelData.isMinimized,
            order: this.panelOrder.indexOf(panelId)
        };
    }

    /**
     * 全パネルの状態を取得
     */
    getAllPanelStates() {
        const states = {};
        this.panels.forEach((data, id) => {
            states[id] = this.getPanelState(id);
        });
        return states;
    }

    /**
     * レイアウト状態の保存
     */
    saveLayoutState() {
        const state = {
            panelOrder: [...this.panelOrder],
            panels: this.getAllPanelStates(),
            cssVariables: {
                outlinerWidth: getComputedStyle(document.documentElement).getPropertyValue('--outliner-width'),
                propertiesWidth: getComputedStyle(document.documentElement).getPropertyValue('--properties-width')
            }
        };

        localStorage.setItem('spine-editor-layout', JSON.stringify(state));
        this.emit('layout:saved', state);
        return state;
    }

    /**
     * レイアウト状態の復元
     */
    loadLayoutState() {
        const saved = localStorage.getItem('spine-editor-layout');
        if (!saved) return;

        try {
            const state = JSON.parse(saved);
            
            // CSS変数の復元
            if (state.cssVariables) {
                if (state.cssVariables.outlinerWidth) {
                    document.documentElement.style.setProperty('--outliner-width', state.cssVariables.outlinerWidth);
                }
                if (state.cssVariables.propertiesWidth) {
                    document.documentElement.style.setProperty('--properties-width', state.cssVariables.propertiesWidth);
                }
            }

            // パネル状態の復元
            if (state.panels) {
                Object.entries(state.panels).forEach(([id, panelState]) => {
                    if (panelState.isMinimized) {
                        this.toggleMinimize(id);
                    }
                    if (!panelState.isVisible) {
                        this.toggleVisibility(id);
                    }
                });
            }

            // パネル順序の復元
            if (state.panelOrder) {
                this.panelOrder = [...state.panelOrder];
                this.updatePanelOrder();
            }

            this.updateResizeHandlePositions();
            this.emit('layout:loaded', state);

        } catch (e) {
            console.warn('Failed to load layout from storage:', e);
        }
    }

    // === EventBus統合 ===

    emit(eventType, data = {}) {
        if (this.eventBus && typeof this.eventBus.emit === 'function') {
            this.eventBus.emit(eventType, data);
        }
        
        // カスタムイベントとしても発火
        const customEvent = new CustomEvent(eventType, { detail: data });
        document.dispatchEvent(customEvent);
    }

    /**
     * 破棄処理
     */
    destroy() {
        // イベントリスナーの削除
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('keydown', this.handleKeyboard);
        window.removeEventListener('resize', this.handleWindowResize);

        // パネルデータのクリア
        this.panels.clear();
        this.panelOrder = [];

        this.emit('panelManager:destroyed');
    }
}

// ES6モジュールとして公開
export default PanelManager;