class PanelManager {
    constructor() {
        this.panels = new Map();
        this.isDragging = false;
        this.resizing = null;
        this.dragging = null;
        this.panelOrder = ['outliner', 'preview', 'properties'];
        this.layoutMode = 'horizontal'; // 'horizontal' or 'vertical'
        
        // 2次元レイアウト管理
        this.layoutStructure = {
            columns: [
                { panels: ['outliner'], width: 'var(--outliner-width)' },
                { panels: ['preview'], width: '1fr' },
                { panels: ['properties'], width: 'var(--properties-width)' }
            ]
        };
        
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
        const handle = event.target;
        
        if (handle.classList.contains('resize-handle-dynamic')) {
            // 動的ハンドル用の処理
            this.resizing = {
                handle: handle,
                position: parseInt(handle.dataset.position),
                leftPanel: handle.dataset.leftPanel,
                rightPanel: handle.dataset.rightPanel,
                startX: event.clientX,
                leftWidth: this.getCurrentWidth(handle.dataset.leftPanel),
                rightWidth: this.getCurrentWidth(handle.dataset.rightPanel)
            };
        } else {
            // 従来の固定ハンドル用の処理
            this.resizing = {
                handle: handle,
                direction: handle.dataset.direction,
                startX: event.clientX,
                startWidth: this.getCurrentWidth(handle.dataset.direction)
            };
        }
        
        document.body.classList.add('resizing');
        document.body.classList.add('dragging');
    }

    getCurrentWidth(panelTypeOrDirection) {
        const style = getComputedStyle(document.documentElement);
        
        // 従来の方向指定の場合
        if (panelTypeOrDirection === 'left') {
            return parseInt(style.getPropertyValue('--outliner-width'));
        } else if (panelTypeOrDirection === 'right') {
            return parseInt(style.getPropertyValue('--properties-width'));
        }
        
        // パネルタイプ指定の場合
        if (panelTypeOrDirection === 'outliner') {
            return parseInt(style.getPropertyValue('--outliner-width'));
        } else if (panelTypeOrDirection === 'properties') {
            return parseInt(style.getPropertyValue('--properties-width'));
        }
        
        return 200;
    }

    handleMouseMove(event) {
        if (this.resizing) {
            if (this.resizing.type === 'vertical') {
                // 縦方向のリサイズ処理
                this.handleVerticalResize(event);
            } else {
                // 横方向のリサイズ処理
                const deltaX = event.clientX - this.resizing.startX;
                
                if (this.resizing.handle.classList.contains('resize-handle-dynamic')) {
                // 動的ハンドル用のリサイズ処理
                const leftNewWidth = this.resizing.leftWidth + deltaX;
                const rightNewWidth = this.resizing.rightWidth - deltaX;
                
                const minWidth = 150;
                const maxWidth = 400;
                
                const leftClampedWidth = Math.max(minWidth, Math.min(maxWidth, leftNewWidth));
                const rightClampedWidth = Math.max(minWidth, Math.min(maxWidth, rightNewWidth));
                
                // 実際の調整（両パネルの制約を考慮）
                if (this.resizing.leftPanel === 'outliner') {
                    document.documentElement.style.setProperty('--outliner-width', `${leftClampedWidth}px`);
                } else if (this.resizing.leftPanel === 'properties') {
                    document.documentElement.style.setProperty('--properties-width', `${leftClampedWidth}px`);
                }
                
                if (this.resizing.rightPanel === 'outliner') {
                    document.documentElement.style.setProperty('--outliner-width', `${rightClampedWidth}px`);
                } else if (this.resizing.rightPanel === 'properties') {
                    document.documentElement.style.setProperty('--properties-width', `${rightClampedWidth}px`);
                }
                
                // ハンドル位置を再計算
                setTimeout(() => this.updateResizeHandlesForCurrentOrder(), 10);
                
            } else {
                // 従来の固定ハンドル用の処理
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
                }
            }
        } else if (this.dragging) {
            this.handlePanelDrag(event);
        }
    }

    handleVerticalResize(event) {
        const deltaY = event.clientY - this.resizing.startY;
        const topPanel = this.panels.get(this.resizing.topPanel).element;
        const bottomPanel = this.panels.get(this.resizing.bottomPanel).element;
        
        const minHeight = 150;
        const topStartHeight = this.resizing.startHeights[this.resizing.topPanel];
        const bottomStartHeight = this.resizing.startHeights[this.resizing.bottomPanel];
        
        const newTopHeight = Math.max(minHeight, topStartHeight + deltaY);
        const newBottomHeight = Math.max(minHeight, bottomStartHeight - deltaY);
        
        topPanel.style.height = newTopHeight + 'px';
        bottomPanel.style.height = newBottomHeight + 'px';
        
        // ハンドル位置を更新
        setTimeout(() => this.updateVerticalResizeHandlePositions(), 10);
    }

    updateVerticalResizeHandlePositions() {
        const handles = document.querySelectorAll('.resize-handle-vertical');
        handles.forEach(handle => {
            const topPanelType = handle.dataset.topPanel;
            const topPanel = this.panels.get(topPanelType).element;
            const rect = topPanel.getBoundingClientRect();
            handle.style.top = (rect.bottom - 2) + 'px';
        });
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
        
        leftHandle.style.left = outlinerWidth;
        rightHandle.style.right = propertiesWidth;
    }

    handlePanelControl(event) {
        const button = event.target;
        const panel = button.closest('.panel');
        const panelType = panel.dataset.panelType;
        const panelData = this.panels.get(panelType);

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

        if (event.key === 'Escape') {
            this.cancelResize();
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

        document.querySelector('.main-container').style.gridTemplateColumns = 
            'var(--outliner-width) 1fr var(--properties-width)';
        
        this.updateResizeHandlePositions();
    }

    cancelResize() {
        if (this.resizing) {
            this.handleMouseUp();
        }
    }

    handleWindowResize() {
        setTimeout(() => this.updateResizeHandlePositions(), 100);
    }

    getLayoutState() {
        const state = {};
        this.panels.forEach((data, type) => {
            state[type] = {
                isMinimized: data.isMinimized,
                isVisible: data.isVisible
            };
        });
        
        state.outlinerWidth = getComputedStyle(document.documentElement).getPropertyValue('--outliner-width');
        state.propertiesWidth = getComputedStyle(document.documentElement).getPropertyValue('--properties-width');
        
        return state;
    }

    loadLayoutState(state) {
        if (!state) return;

        if (state.outlinerWidth) {
            document.documentElement.style.setProperty('--outliner-width', state.outlinerWidth);
        }
        if (state.propertiesWidth) {
            document.documentElement.style.setProperty('--properties-width', state.propertiesWidth);
        }

        this.panels.forEach((data, type) => {
            if (state[type]) {
                if (state[type].isMinimized) {
                    this.toggleMinimize(type);
                }
                if (!state[type].isVisible) {
                    this.toggleVisibility(type);
                }
            }
        });

        this.updateResizeHandlePositions();
    }

    saveLayoutToStorage() {
        const state = this.getLayoutState();
        localStorage.setItem('spine-editor-layout', JSON.stringify(state));
    }

    loadLayoutFromStorage() {
        const saved = localStorage.getItem('spine-editor-layout');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.loadLayoutState(state);
            } catch (e) {
                console.warn('Failed to load layout from storage:', e);
            }
        }
    }

    startPanelDrag(event) {
        // パネルボタンのクリックは除外
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
            startY: event.clientY,
            originalOrder: [...this.panelOrder]
        };

        header.style.cursor = 'grabbing';
        document.body.classList.add('dragging');
        
        // ドラッグ中の視覚フィードバック
        panel.style.opacity = '0.8';
        panel.style.transform = 'scale(0.98)';
        panel.style.zIndex = '1000';
    }

    handlePanelDrag(event) {
        if (!this.dragging) return;

        const deltaX = event.clientX - this.dragging.startX;
        const deltaY = event.clientY - this.dragging.startY;

        // マウス位置でのドロップターゲット検出
        const dropTarget = this.getDropTarget(event.clientX, event.clientY);
        
        // 既存のドロップインジケーターをクリア
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
        
        // マウス位置でドロップ方向を判定
        const relativeX = (mouseX - rect.left) / rect.width;
        const relativeY = (mouseY - rect.top) / rect.height;
        
        // デバッグ用ログ
        console.log(`Mouse position: X=${relativeX.toFixed(2)}, Y=${relativeY.toFixed(2)}`);
        
        let dropDirection = 'left';
        let indicatorCSS = '';
        
        // 4方向の判定（上下左右） - 判定領域を拡大
        if (relativeY < 0.33) {
            // 上部
            dropDirection = 'top';
            indicatorCSS = `
                position: absolute;
                top: ${rect.top - 1.5}px;
                left: ${rect.left}px;
                width: ${rect.width}px;
                height: 3px;
                background: var(--accent-blue);
                z-index: 1001;
                pointer-events: none;
            `;
        } else if (relativeY > 0.67) {
            // 下部
            dropDirection = 'bottom';
            indicatorCSS = `
                position: absolute;
                top: ${rect.bottom - 1.5}px;
                left: ${rect.left}px;
                width: ${rect.width}px;
                height: 3px;
                background: var(--accent-blue);
                z-index: 1001;
                pointer-events: none;
            `;
        } else if (relativeX < 0.5) {
            // 左側
            dropDirection = 'left';
            indicatorCSS = `
                position: absolute;
                top: ${rect.top}px;
                height: ${rect.height}px;
                width: 3px;
                background: var(--accent-blue);
                z-index: 1001;
                pointer-events: none;
                left: ${rect.left - 1.5}px;
            `;
        } else {
            // 右側
            dropDirection = 'right';
            indicatorCSS = `
                position: absolute;
                top: ${rect.top}px;
                height: ${rect.height}px;
                width: 3px;
                background: var(--accent-blue);
                z-index: 1001;
                pointer-events: none;
                left: ${rect.right - 1.5}px;
            `;
        }
        
        indicator.dataset.direction = dropDirection;
        indicator.style.cssText = indicatorCSS;
        document.body.appendChild(indicator);
    }

    endPanelDrag() {
        if (!this.dragging) return;

        const dropTarget = this.getDropTarget(event.clientX, event.clientY);
        const dropIndicator = document.querySelector('.drop-indicator');

        if (dropTarget && dropIndicator) {
            const direction = dropIndicator.dataset.direction;
            this.reorderPanels(this.dragging.panelType, dropTarget.dataset.panelType, direction);
        }

        // リセット
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

    reorderPanels(draggedType, targetType, direction) {
        console.log(`Reordering: ${draggedType} ${direction} ${targetType}`);
        
        if (direction === 'top' || direction === 'bottom') {
            // 上下配置：同じ列内での縦並び
            this.adjustLayoutForVerticalDrop(draggedType, targetType, direction);
        } else {
            // 左右配置：従来の横並び処理
            const currentIndex = this.panelOrder.indexOf(draggedType);
            this.panelOrder.splice(currentIndex, 1);
            
            const targetIndex = this.panelOrder.indexOf(targetType);
            const insertIndex = direction === 'left' ? targetIndex : targetIndex + 1;
            this.panelOrder.splice(insertIndex, 0, draggedType);
            
            // 横並び配置を更新
            this.updateHorizontalLayout();
        }
    }

    adjustLayoutForVerticalDrop(draggedType, targetType, direction) {
        console.log(`Vertical drop detected: ${draggedType} ${direction} ${targetType}`);
        
        // どの列にターゲットが属するかを特定
        const targetColumnIndex = this.findColumnIndex(targetType);
        const draggedColumnIndex = this.findColumnIndex(draggedType);
        
        if (targetColumnIndex !== -1) {
            // ドラッグされたパネルを元の列から削除
            if (draggedColumnIndex !== -1) {
                const draggedColumn = this.layoutStructure.columns[draggedColumnIndex];
                const draggedPanelIndex = draggedColumn.panels.indexOf(draggedType);
                draggedColumn.panels.splice(draggedPanelIndex, 1);
            }
            
            // ターゲットの列に追加
            const targetColumn = this.layoutStructure.columns[targetColumnIndex];
            const targetPanelIndex = targetColumn.panels.indexOf(targetType);
            const insertIndex = direction === 'top' ? targetPanelIndex : targetPanelIndex + 1;
            targetColumn.panels.splice(insertIndex, 0, draggedType);
            
            // 2次元レイアウトを適用
            this.apply2DLayout();
        }
    }

    findColumnIndex(panelType) {
        for (let i = 0; i < this.layoutStructure.columns.length; i++) {
            if (this.layoutStructure.columns[i].panels.includes(panelType)) {
                return i;
            }
        }
        return -1;
    }

    apply2DLayout() {
        const container = document.querySelector('.main-container');
        
        // グリッド列の設定
        const columnWidths = this.layoutStructure.columns
            .filter(col => col.panels.some(panel => this.panels.get(panel).isVisible))
            .map(col => col.width);
        
        container.style.gridTemplateColumns = columnWidths.join(' ');
        container.style.gridTemplateRows = 'none';
        container.style.height = 'calc(100vh - var(--topbar-height))';
        container.style.overflowY = 'hidden';
        
        // 各列のパネル配置
        this.layoutStructure.columns.forEach((column, columnIndex) => {
            if (column.panels.length === 0) return;
            
            const visiblePanels = column.panels.filter(panelType => 
                this.panels.get(panelType).isVisible
            );
            
            if (visiblePanels.length === 0) return;
            
            if (visiblePanels.length === 1) {
                // 単一パネル：通常配置
                const panel = this.panels.get(visiblePanels[0]).element;
                panel.style.gridColumn = columnIndex + 1;
                panel.style.gridRow = '1';
                panel.style.minHeight = '';
                panel.style.maxHeight = '';
                panel.style.height = '';
            } else {
                // 複数パネル：縦分割コンテナ作成
                this.createVerticalColumn(columnIndex, visiblePanels);
            }
        });
        
        // リサイズハンドルの更新
        this.updateResizeHandlesFor2D();
    }

    updateResizeHandlesFor2D() {
        // 既存ハンドルをクリア
        document.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
        
        // 列間の横リサイズハンドル
        this.createHorizontalResizeHandles();
        
        // 各列内の縦リサイズハンドル
        this.createVerticalResizeHandlesFor2D();
    }

    createHorizontalResizeHandles() {
        const visibleColumns = this.layoutStructure.columns.filter(col => 
            col.panels.some(panel => this.panels.get(panel).isVisible)
        );
        
        for (let i = 0; i < visibleColumns.length - 1; i++) {
            const handle = document.createElement('div');
            handle.className = 'resize-handle resize-handle-horizontal';
            handle.dataset.columnIndex = i;
            
            // 位置計算（簡易版）
            const leftWidth = i === 0 ? 200 : 400; // 仮の値
            
            handle.style.cssText = `
                position: absolute;
                top: var(--topbar-height);
                bottom: 0;
                width: 4px;
                background: transparent;
                cursor: col-resize;
                z-index: 100;
                left: ${leftWidth}px;
                transition: background-color 0.2s ease;
            `;
            
            handle.addEventListener('mousedown', this.startResize.bind(this));
            handle.addEventListener('mouseenter', () => {
                handle.style.backgroundColor = 'var(--accent-blue)';
            });
            handle.addEventListener('mouseleave', () => {
                handle.style.backgroundColor = 'transparent';
            });
            
            document.body.appendChild(handle);
        }
    }

    createVerticalResizeHandlesFor2D() {
        this.layoutStructure.columns.forEach((column, columnIndex) => {
            const visiblePanels = column.panels.filter(panelType => 
                this.panels.get(panelType).isVisible
            );
            
            if (visiblePanels.length > 1) {
                // 複数パネルがある列には縦リサイズハンドルを作成
                for (let i = 0; i < visiblePanels.length - 1; i++) {
                    this.createVerticalResizeHandle(columnIndex * 10 + i, visiblePanels[i], visiblePanels[i + 1]);
                }
            }
        });
    }
    }

    createVerticalColumn(columnIndex, panelTypes) {
        // 縦分割用のコンテナを作成
        const columnContainer = document.createElement('div');
        columnContainer.className = 'vertical-column';
        columnContainer.style.cssText = `
            display: grid;
            grid-template-rows: repeat(${panelTypes.length}, minmax(200px, 1fr));
            grid-template-columns: 1fr;
            gap: 1px;
            grid-column: ${columnIndex + 1};
            grid-row: 1;
        `;
        
        // パネルを縦コンテナに移動
        panelTypes.forEach((panelType, index) => {
            const panel = this.panels.get(panelType).element;
            panel.style.gridColumn = '1';
            panel.style.gridRow = index + 1;
            panel.style.minHeight = '200px';
            panel.style.maxHeight = 'none';
            
            // パネルを縦コンテナに追加
            columnContainer.appendChild(panel);
        });
        
        // メインコンテナに縦コンテナを追加
        document.querySelector('.main-container').appendChild(columnContainer);
    }

    updateHorizontalLayout() {
        // 横並びレイアウトの更新
        this.panelOrder.forEach((panelType, index) => {
            const panel = this.panels.get(panelType).element;
            panel.style.order = index;
            panel.style.gridColumn = '';
            panel.style.gridRow = '';
            panel.style.minHeight = '';
            panel.style.maxHeight = '';
        });
        
        this.updatePanelOrder();
    }

    createVerticalResizeHandles() {
        // 既存のハンドルをクリア
        document.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
        
        const visiblePanels = this.panelOrder.filter(type => 
            this.panels.get(type).isVisible
        );

        // パネル間に縦方向のリサイズハンドルを作成
        for (let i = 0; i < visiblePanels.length - 1; i++) {
            this.createVerticalResizeHandle(i, visiblePanels[i], visiblePanels[i + 1]);
        }
    }

    createVerticalResizeHandle(position, topPanelType, bottomPanelType) {
        const handle = document.createElement('div');
        handle.className = 'resize-handle resize-handle-vertical';
        handle.dataset.position = position;
        handle.dataset.topPanel = topPanelType;
        handle.dataset.bottomPanel = bottomPanelType;
        
        const topPanel = this.panels.get(topPanelType).element;
        const rect = topPanel.getBoundingClientRect();
        
        handle.style.cssText = `
            position: absolute;
            left: 0;
            right: 0;
            height: 4px;
            background: transparent;
            cursor: row-resize;
            z-index: 100;
            transition: background-color 0.2s ease;
            top: ${rect.bottom - 2}px;
        `;
        
        handle.addEventListener('mousedown', this.startVerticalResize.bind(this));
        handle.addEventListener('mouseenter', () => {
            handle.style.backgroundColor = 'var(--accent-blue)';
        });
        handle.addEventListener('mouseleave', () => {
            handle.style.backgroundColor = 'transparent';
        });
        
        document.body.appendChild(handle);
    }

    startVerticalResize(event) {
        event.preventDefault();
        const handle = event.target;
        
        this.resizing = {
            handle: handle,
            type: 'vertical',
            position: parseInt(handle.dataset.position),
            topPanel: handle.dataset.topPanel,
            bottomPanel: handle.dataset.bottomPanel,
            startY: event.clientY,
            startHeights: this.getVerticalPanelHeights()
        };
        
        document.body.classList.add('resizing');
        document.body.classList.add('dragging');
    }

    getVerticalPanelHeights() {
        const heights = {};
        this.panels.forEach((data, type) => {
            if (data.isVisible) {
                heights[type] = data.element.getBoundingClientRect().height;
            }
        });
        return heights;
    }

    switchToHorizontalLayout() {
        // 横並びレイアウトに切り替え
        const container = document.querySelector('.main-container');
        
        console.log('Switching back to horizontal layout');
        
        this.layoutMode = 'horizontal';
        
        // パネルスタイルをリセット
        this.panels.forEach((data, type) => {
            const panel = data.element;
            panel.style.gridRow = '';
            panel.style.gridColumn = '';
            panel.style.minHeight = '';
            panel.style.maxHeight = '';
        });
        
        // 横並びレイアウトを適用
        this.updateLayoutMode();
    }

    shouldUseVerticalLayout() {
        // 上下配置が発生した場合は縦並びレイアウトを使用
        return true;
    }

    updatePanelOrder() {
        const container = document.querySelector('.main-container');
        
        // 新しい順序でパネルを配置
        this.panelOrder.forEach((panelType, index) => {
            const panel = this.panels.get(panelType).element;
            panel.style.order = index;
        });

        // CSS Grid の columns も動的に更新
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
        
        // リサイズハンドルの位置を動的に更新
        this.updateResizeHandlesForCurrentOrder();
    }

    updateResizeHandlesForCurrentOrder() {
        // 既存のハンドルを削除
        document.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
        
        const visiblePanels = this.panelOrder.filter(type => 
            this.panels.get(type).isVisible
        );

        // パネル間にリサイズハンドルを動的作成
        for (let i = 0; i < visiblePanels.length - 1; i++) {
            const leftPanelType = visiblePanels[i];
            const rightPanelType = visiblePanels[i + 1];
            
            // 固定幅パネルの間のみハンドル作成
            if ((leftPanelType === 'outliner' || leftPanelType === 'properties') ||
                (rightPanelType === 'outliner' || rightPanelType === 'properties')) {
                
                this.createResizeHandle(i, leftPanelType, rightPanelType);
            }
        }
    }

    createResizeHandle(position, leftType, rightType) {
        const handle = document.createElement('div');
        handle.className = 'resize-handle resize-handle-dynamic';
        handle.dataset.position = position;
        handle.dataset.leftPanel = leftType;
        handle.dataset.rightPanel = rightType;
        
        // 位置を計算
        const visiblePanels = this.panelOrder.filter(type => 
            this.panels.get(type).isVisible
        );
        
        let leftOffset = 0;
        for (let i = 0; i <= position; i++) {
            const panelType = visiblePanels[i];
            if (panelType === 'outliner') {
                leftOffset += parseInt(getComputedStyle(document.documentElement)
                    .getPropertyValue('--outliner-width'));
            } else if (panelType === 'properties') {
                leftOffset += parseInt(getComputedStyle(document.documentElement)
                    .getPropertyValue('--properties-width'));
            } else {
                // 1fr部分は計算が複雑なので、実際の要素幅を取得
                const panel = this.panels.get(panelType).element;
                leftOffset += panel.getBoundingClientRect().width;
            }
        }
        
        handle.style.cssText = `
            position: absolute;
            top: var(--topbar-height);
            bottom: 0;
            width: 4px;
            background: transparent;
            cursor: col-resize;
            z-index: 100;
            transition: background-color 0.2s ease;
            left: ${leftOffset - 2}px;
        `;
        
        handle.addEventListener('mousedown', this.startResize.bind(this));
        handle.addEventListener('mouseenter', () => {
            handle.style.backgroundColor = 'var(--accent-blue)';
        });
        handle.addEventListener('mouseleave', () => {
            handle.style.backgroundColor = 'transparent';
        });
        
        document.body.appendChild(handle);
    }

    initializeLayoutToggle() {
        const layoutButton = document.getElementById('layout-toggle');
        if (layoutButton) {
            layoutButton.addEventListener('click', this.toggleLayoutMode.bind(this));
        }
    }

    toggleLayoutMode() {
        this.layoutMode = this.layoutMode === 'horizontal' ? 'vertical' : 'horizontal';
        this.updateLayoutMode();
        
        const button = document.getElementById('layout-toggle');
        const icon = button.querySelector('.icon');
        const text = button.childNodes[2]; // テキストノード
        
        if (this.layoutMode === 'vertical') {
            icon.textContent = '⚏';
            text.textContent = '縦並び';
        } else {
            icon.textContent = '⚏';
            text.textContent = '横並び';
        }
    }

    updateLayoutMode() {
        const container = document.querySelector('.main-container');
        
        if (this.layoutMode === 'vertical') {
            // 縦並び設定
            container.style.gridTemplateColumns = '1fr';
            container.style.gridTemplateRows = 'auto auto auto';
            container.style.height = 'calc(100vh - var(--topbar-height))';
            container.style.overflowY = 'auto';
            
            // パネルの高さ設定
            this.panels.forEach((data, type) => {
                const panel = data.element;
                panel.style.minHeight = '200px';
                panel.style.maxHeight = '40vh';
                panel.style.order = this.panelOrder.indexOf(type);
            });
            
        } else {
            // 横並び設定（デフォルト）
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
            container.style.gridTemplateRows = '1fr';
            container.style.height = 'calc(100vh - var(--topbar-height))';
            container.style.overflowY = 'hidden';
            
            // パネルの高さリセット
            this.panels.forEach((data, type) => {
                const panel = data.element;
                panel.style.minHeight = '';
                panel.style.maxHeight = '';
                panel.style.order = this.panelOrder.indexOf(type);
            });
        }
        
        // リサイズハンドルの更新
        this.updateResizeHandlesForCurrentOrder();
    }
}

class FileTreeManager {
    constructor() {
        this.treeItems = document.querySelectorAll('.tree-item');
        this.init();
    }

    init() {
        this.bindTreeEvents();
        this.initializeTreeState();
    }

    bindTreeEvents() {
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
            this.toggleFolderExpansion(item);
        }
        
        this.setActiveTreeItem(item);
    }

    toggleFolderExpansion(item) {
        const isExpanded = item.classList.contains('expanded');
        
        if (isExpanded) {
            item.classList.remove('expanded');
        } else {
            item.classList.add('expanded');
        }
    }

    setActiveTreeItem(item) {
        this.treeItems.forEach(treeItem => {
            treeItem.classList.remove('selected');
        });
        
        item.classList.add('selected');
    }

    initializeTreeState() {
        const firstFolder = document.querySelector('.tree-folder');
        if (firstFolder) {
            firstFolder.classList.add('expanded');
        }
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
        this.bindPropertyEvents();
        this.initializeValues();
    }

    bindPropertyEvents() {
        this.propertyInputs.forEach(input => {
            input.addEventListener('change', this.handlePropertyChange.bind(this));
            input.addEventListener('input', this.handlePropertyInput.bind(this));
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
        
        this.validateInput(input, value);
        this.updatePreview(input.type || 'input', value);
    }

    handlePropertyInput(event) {
        const input = event.target;
        const value = input.value;
        
        if (input.type === 'number') {
            this.updatePreview('number', value);
        }
    }

    handleCheckboxChange(event) {
        const checkbox = event.target;
        this.updatePreview('checkbox', checkbox.checked);
    }

    validateInput(input, value) {
        if (input.type === 'number') {
            const num = parseFloat(value);
            if (isNaN(num)) {
                input.classList.add('error');
                return false;
            } else {
                input.classList.remove('error');
                return true;
            }
        }
        return true;
    }

    updatePreview(type, value) {
        console.log(`Preview update: ${type} = ${value}`);
    }

    initializeValues() {
        const scaleInputs = document.querySelectorAll('input[value="0.75"]');
        scaleInputs.forEach(input => {
            input.addEventListener('change', () => {
                console.log('Scale changed to:', input.value);
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const panelManager = new PanelManager();
    const fileTreeManager = new FileTreeManager();
    const propertyManager = new PropertyManager();

    panelManager.loadLayoutFromStorage();

    window.addEventListener('beforeunload', () => {
        panelManager.saveLayoutToStorage();
    });

    window.panelManager = panelManager;
    window.fileTreeManager = fileTreeManager;
    window.propertyManager = propertyManager;

    console.log('Spine Editor WebApp initialized successfully');
    console.log('Available keyboard shortcuts:');
    console.log('  Ctrl+1: Toggle Outliner panel');
    console.log('  Ctrl+2: Toggle Preview panel'); 
    console.log('  Ctrl+3: Toggle Properties panel');
    console.log('  Ctrl+R: Reset layout');
    console.log('  Escape: Cancel resize operation');
});