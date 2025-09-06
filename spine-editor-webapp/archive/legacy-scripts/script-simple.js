class PanelManager {
    constructor() {
        this.panels = new Map();
        this.isDragging = false;
        this.resizing = null;
        this.dragging = null;
        this.panelOrder = ['outliner', 'preview', 'properties'];
        this.init();
    }

    init() {
        this.initializePanels();
        this.initializeResizeHandles();
        this.initializePanelControls();
        this.bindEvents();
    }

    initializePanels() {
        const panelElements = document.querySelectorAll('.panel');
        panelElements.forEach(panel => {
            const type = panel.dataset.panelType;
            this.panels.set(type, {
                element: panel,
                isMinimized: false,
                isVisible: true,
                originalWidth: null
            });
        });
    }

    initializeResizeHandles() {
        const resizeHandles = document.querySelectorAll('.resize-handle');
        resizeHandles.forEach(handle => {
            handle.addEventListener('mousedown', this.startResize.bind(this));
        });
    }

    initializePanelControls() {
        const panelButtons = document.querySelectorAll('.panel-btn');
        panelButtons.forEach(button => {
            button.addEventListener('click', this.handlePanelControl.bind(this));
        });

        // パネルヘッダーにドラッグ機能を追加
        const panelHeaders = document.querySelectorAll('.panel-header');
        panelHeaders.forEach(header => {
            header.style.cursor = 'grab';
            header.addEventListener('mousedown', this.startPanelDrag.bind(this));
        });
    }

    bindEvents() {
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
        window.addEventListener('resize', this.handleWindowResize.bind(this));
    }

    startResize(event) {
        event.preventDefault();
        this.resizing = {
            handle: event.target,
            direction: event.target.dataset.direction,
            startX: event.clientX,
            startWidth: this.getCurrentWidth(event.target.dataset.direction)
        };
        document.body.classList.add('resizing');
        document.body.classList.add('dragging');
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

    handleMouseMove(event) {
        if (this.resizing) {
            const deltaX = event.clientX - this.resizing.startX;
            const newWidth = this.resizing.startWidth + (this.resizing.direction === 'left' ? deltaX : -deltaX);
            
            const minWidth = 150;
            const maxWidth = 400;
            const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

            if (this.resizing.direction === 'left') {
                document.documentElement.style.setProperty('--outliner-width', `${clampedWidth}px`);
            } else if (this.resizing.direction === 'right') {
                document.documentElement.style.setProperty('--properties-width', `${clampedWidth}px`);
            }

            this.updateResizeHandlePositions();
        } else if (this.dragging) {
            this.handlePanelDrag(event);
        }
    }

    handleMouseUp() {
        if (this.resizing) {
            this.resizing = null;
            document.body.classList.remove('resizing');
            document.body.classList.remove('dragging');
        } else if (this.dragging) {
            this.endPanelDrag();
        }
    }

    updateResizeHandlePositions() {
        const leftHandle = document.querySelector('.resize-handle-left');
        const rightHandle = document.querySelector('.resize-handle-right');
        
        const outlinerWidth = getComputedStyle(document.documentElement).getPropertyValue('--outliner-width');
        const propertiesWidth = getComputedStyle(document.documentElement).getPropertyValue('--properties-width');
        
        if (leftHandle) leftHandle.style.left = outlinerWidth;
        if (rightHandle) rightHandle.style.right = propertiesWidth;
    }

    handlePanelControl(event) {
        const button = event.target;
        const panel = button.closest('.panel');
        const panelType = panel.dataset.panelType;

        if (button.textContent === '−') {
            this.toggleMinimize(panelType);
        } else if (button.textContent === '×') {
            this.toggleVisibility(panelType);
        }
    }

    toggleMinimize(panelType) {
        const panelData = this.panels.get(panelType);
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
    }

    toggleVisibility(panelType) {
        const panelData = this.panels.get(panelType);
        const panel = panelData.element;
        
        panelData.isVisible = !panelData.isVisible;
        
        if (panelData.isVisible) {
            panel.style.display = 'flex';
        } else {
            panel.style.display = 'none';
            this.adjustLayoutForHiddenPanel(panelType);
        }
    }

    adjustLayoutForHiddenPanel(hiddenPanelType) {
        const mainContainer = document.querySelector('.main-container');
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
        
        mainContainer.style.gridTemplateColumns = gridTemplate;
    }

    startPanelDrag(event) {
        if (event.target.classList.contains('panel-btn')) {
            return;
        }

        event.preventDefault();
        const header = event.currentTarget;
        const panel = header.closest('.panel');
        const panelType = panel.dataset.panelType;

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
    }

    handlePanelDrag(event) {
        if (!this.dragging) return;

        const dropTarget = this.getDropTarget(event.clientX, event.clientY);
        
        document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
        
        if (dropTarget && dropTarget !== this.dragging.panel) {
            this.showDropIndicator(dropTarget, event.clientX, event.clientY);
        }
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
        
        this.dragging = null;
    }

    reorderPanels(draggedType, targetType, insertBefore) {
        const currentIndex = this.panelOrder.indexOf(draggedType);
        this.panelOrder.splice(currentIndex, 1);
        
        const targetIndex = this.panelOrder.indexOf(targetType);
        const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
        this.panelOrder.splice(insertIndex, 0, draggedType);
        
        this.updatePanelOrder();
    }

    updatePanelOrder() {
        const container = document.querySelector('.main-container');
        
        this.panelOrder.forEach((panelType, index) => {
            const panel = this.panels.get(panelType).element;
            panel.style.order = index;
        });

        const visiblePanels = this.panelOrder.filter(type => 
            this.panels.get(type).isVisible
        );

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
    }

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
            data.element.querySelector('.panel-content').style.display = 'block';
        });

        this.panelOrder = ['outliner', 'preview', 'properties'];
        this.updatePanelOrder();
    }

    handleWindowResize() {
        setTimeout(() => this.updateResizeHandlePositions(), 100);
    }
}

// 他のクラスも簡略化
class FileTreeManager {
    constructor() {
        this.treeItems = document.querySelectorAll('.tree-item');
        this.init();
    }

    init() {
        this.treeItems.forEach(item => {
            if (item.classList.contains('tree-folder') || item.classList.contains('tree-character')) {
                item.addEventListener('click', this.handleTreeItemClick.bind(this));
            }
        });
    }

    handleTreeItemClick(event) {
        event.stopPropagation();
        const item = event.currentTarget;
        
        if (item.classList.contains('tree-folder') || item.classList.contains('tree-character')) {
            item.classList.toggle('expanded');
        }
        
        this.treeItems.forEach(treeItem => {
            treeItem.classList.remove('selected');
        });
        item.classList.add('selected');
    }
}

class PropertyManager {
    constructor() {
        this.propertyInputs = document.querySelectorAll('.property-input');
        this.propertySelects = document.querySelectorAll('.property-select');
        this.checkboxes = document.querySelectorAll('.property-checkbox');
        this.init();
    }

    init() {
        this.propertyInputs.forEach(input => {
            input.addEventListener('change', this.handlePropertyChange.bind(this));
        });

        this.propertySelects.forEach(select => {
            select.addEventListener('change', this.handlePropertyChange.bind(this));
        });

        this.checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', this.handleCheckboxChange.bind(this));
        });
    }

    handlePropertyChange(event) {
        const input = event.target;
        const value = input.value;
        console.log(`Property changed: ${input.type || 'input'} = ${value}`);
    }

    handleCheckboxChange(event) {
        const checkbox = event.target;
        console.log(`Checkbox changed: ${checkbox.checked}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const panelManager = new PanelManager();
    const fileTreeManager = new FileTreeManager();
    const propertyManager = new PropertyManager();

    window.panelManager = panelManager;
    window.fileTreeManager = fileTreeManager;
    window.propertyManager = propertyManager;

    console.log('Spine Editor WebApp (Simple Version) initialized successfully');
    console.log('Available keyboard shortcuts:');
    console.log('  Ctrl+1: Toggle Outliner panel');
    console.log('  Ctrl+2: Toggle Preview panel'); 
    console.log('  Ctrl+3: Toggle Properties panel');
    console.log('  Ctrl+R: Reset layout');
});