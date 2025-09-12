/**
 * DragSplitManager.js - D&Dウィンドウ分割システム
 * 
 * 責務:
 * - パネルのドラッグ&ドロップによる分割
 * - 動的グリッドレイアウト管理
 * - ドロップゾーンとプレビュー表示
 * - 分割境界線のリサイズ
 * 
 * 依存: EventBusのみ
 */

export default class DragSplitManager {
    constructor(options = {}) {
        this.eventBus = options.eventBus;
        this.container = options.container || document.querySelector('.main-container');
        
        // 分割状態管理
        this.splitAreas = new Map(); // 分割エリア
        this.draggedPanel = null;
        this.dropZones = [];
        this.splitBorders = [];
        
        // ドラッグ状態
        this.isDragging = false;
        this.dragStartPos = { x: 0, y: 0 };
        this.currentDropZone = null;
        
        // 設定
        this.config = {
            dropZoneSize: 40, // ドロップゾーンの幅/高さ
            previewOpacity: 0.3,
            animationDuration: 300,
            minPanelSize: 150,
            ...options.config
        };
        
        this.init();
    }
    
    init() {
        this.createInitialLayout();
        this.createDropZones();
        this.bindEvents();
        
        this.emit('dragSplitManager:initialized');
        console.log('✅ DragSplitManager 初期化完了');
    }
    
    /**
     * 初期レイアウトの作成
     */
    createInitialLayout() {
        // 初期分割エリア設定
        this.splitAreas.set('main', {
            element: this.container,
            orientation: 'horizontal', // horizontal or vertical
            children: ['outliner', 'preview', 'properties'],
            ratios: [0.2, 0.6, 0.2] // 各子要素の比率
        });
        
        // 既存のパネルをドラッグ可能にする
        this.findSplittablePanels();
    }
    
    /**
     * 分割可能パネルの検出
     */
    findSplittablePanels() {
        const panels = document.querySelectorAll('.panel');
        panels.forEach(panel => {
            const header = panel.querySelector('.panel-header');
            if (header && !header.hasAttribute('data-drag-enabled')) {
                this.makePanelDraggable(panel, header);
            }
        });
        
        console.log('🔍 分割可能パネル検出完了:', panels.length, '個');
    }
    
    /**
     * パネルをドラッグ可能にする
     */
    makePanelDraggable(panel, header = null) {
        if (!header) {
            header = panel.querySelector('.panel-header');
        }
        if (!header) return;
        
        header.style.cursor = 'grab';
        header.setAttribute('draggable', 'true');
        header.setAttribute('data-drag-enabled', 'true');
        
        // ドラッグイベント
        header.addEventListener('dragstart', (e) => this.onPanelDragStart(e, panel));
        header.addEventListener('dragend', (e) => this.onPanelDragEnd(e, panel));
        
        // マウスドラッグも対応
        header.addEventListener('mousedown', (e) => this.onPanelMouseDown(e, panel));
        
        panel.classList.add('draggable-panel');
        
        console.log('✅ パネルをドラッグ可能に設定:', panel.dataset.panelType);
    }
    
    /**
     * ドロップゾーンの作成
     */
    createDropZones() {
        // 各パネルの周囲にドロップゾーンを作成
        const panels = document.querySelectorAll('.panel');
        
        panels.forEach(panel => {
            this.createDropZonesForPanel(panel);
        });
        
        // 中央のメインドロップゾーン
        this.createCenterDropZone();
    }
    
    /**
     * パネル周辺のドロップゾーンを作成
     */
    createDropZonesForPanel(panel) {
        const zones = ['top', 'bottom', 'left', 'right'];
        
        zones.forEach(position => {
            const dropZone = document.createElement('div');
            dropZone.className = `drop-zone drop-zone-${position}`;
            dropZone.dataset.position = position;
            dropZone.dataset.targetPanel = panel.dataset.panelType;
            
            // スタイル設定
            this.styleDropZone(dropZone, position);
            
            // イベント
            dropZone.addEventListener('dragover', (e) => this.onDropZoneDragOver(e, dropZone));
            dropZone.addEventListener('dragleave', (e) => this.onDropZoneDragLeave(e, dropZone));
            dropZone.addEventListener('drop', (e) => this.onDropZoneDrop(e, dropZone));
            
            panel.appendChild(dropZone);
            this.dropZones.push(dropZone);
        });
    }
    
    /**
     * ドロップゾーンのスタイル設定
     */
    styleDropZone(dropZone, position) {
        const baseStyle = `
            position: absolute;
            background: rgba(0, 122, 204, 0.2);
            border: 2px solid var(--accent-blue);
            border-radius: 4px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
            z-index: 1000;
        `;
        
        let positionStyle = '';
        const size = this.config.dropZoneSize;
        
        switch (position) {
            case 'top':
                positionStyle = `top: 0; left: 0; right: 0; height: ${size}px;`;
                break;
            case 'bottom':
                positionStyle = `bottom: 0; left: 0; right: 0; height: ${size}px;`;
                break;
            case 'left':
                positionStyle = `top: 0; bottom: 0; left: 0; width: ${size}px;`;
                break;
            case 'right':
                positionStyle = `top: 0; bottom: 0; right: 0; width: ${size}px;`;
                break;
        }
        
        dropZone.style.cssText = baseStyle + positionStyle;
    }
    
    /**
     * 中央ドロップゾーンの作成
     */
    createCenterDropZone() {
        const centerZone = document.createElement('div');
        centerZone.className = 'drop-zone drop-zone-center';
        centerZone.dataset.position = 'center';
        
        centerZone.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100px;
            height: 100px;
            background: rgba(0, 212, 255, 0.2);
            border: 2px solid var(--accent-cyan);
            border-radius: 8px;
            opacity: 0;
            pointer-events: none;
            z-index: 1001;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: var(--accent-cyan);
        `;
        
        centerZone.innerHTML = '⊞';
        
        centerZone.addEventListener('dragover', (e) => this.onDropZoneDragOver(e, centerZone));
        centerZone.addEventListener('drop', (e) => this.onDropZoneDrop(e, centerZone));
        
        this.container.appendChild(centerZone);
        this.dropZones.push(centerZone);
    }
    
    /**
     * パネルドラッグ開始
     */
    onPanelDragStart(e, panel) {
        this.isDragging = true;
        this.draggedPanel = panel;
        this.dragStartPos = { x: e.clientX, y: e.clientY };
        
        // ドラッグ中のスタイル
        panel.style.opacity = '0.5';
        panel.classList.add('being-dragged');
        
        // ドロップゾーンを表示
        this.showDropZones();
        
        // データ転送設定
        if (e.dataTransfer) {
            e.dataTransfer.setData('text/plain', panel.dataset.panelType);
            e.dataTransfer.effectAllowed = 'move';
        }
        
        this.emit('panel:dragStart', {
            panel: panel.dataset.panelType,
            startPos: this.dragStartPos
        });
    }
    
    /**
     * パネルドラッグ終了
     */
    onPanelDragEnd(e, panel) {
        this.isDragging = false;
        
        // スタイル復元
        panel.style.opacity = '';
        panel.classList.remove('being-dragged');
        
        // ドロップゾーンを非表示
        this.hideDropZones();
        
        // 状態リセット
        this.draggedPanel = null;
        this.currentDropZone = null;
        
        this.emit('panel:dragEnd', {
            panel: panel.dataset.panelType
        });
    }
    
    /**
     * マウスドラッグ開始（HTML5 Drag APIの補助）
     */
    onPanelMouseDown(e, panel) {
        if (e.button !== 0) return; // 左クリックのみ
        
        const header = e.target.closest('.panel-header');
        if (!header) return;
        
        let isDragging = false;
        const startX = e.clientX;
        const startY = e.clientY;
        
        const onMouseMove = (e) => {
            const deltaX = Math.abs(e.clientX - startX);
            const deltaY = Math.abs(e.clientY - startY);
            
            if (!isDragging && (deltaX > 5 || deltaY > 5)) {
                isDragging = true;
                this.startManualDrag(panel, e);
            }
            
            if (isDragging) {
                this.updateManualDrag(panel, e);
            }
        };
        
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            if (isDragging) {
                this.endManualDrag(panel);
            }
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
    
    /**
     * 手動ドラッグ開始
     */
    startManualDrag(panel, e) {
        this.isDragging = true;
        this.draggedPanel = panel;
        
        panel.style.opacity = '0.5';
        panel.classList.add('being-dragged');
        
        this.showDropZones();
        
        this.emit('panel:manualDragStart', {
            panel: panel.dataset.panelType,
            pos: { x: e.clientX, y: e.clientY }
        });
    }
    
    /**
     * 手動ドラッグ更新
     */
    updateManualDrag(panel, e) {
        // ドロップゾーンのハイライト更新
        const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
        const dropZone = elementUnderCursor?.closest('.drop-zone');
        
        if (dropZone !== this.currentDropZone) {
            if (this.currentDropZone) {
                this.currentDropZone.style.opacity = '0';
            }
            
            if (dropZone) {
                dropZone.style.opacity = '1';
                this.showSplitPreview(dropZone);
            }
            
            this.currentDropZone = dropZone;
        }
    }
    
    /**
     * 手動ドラッグ終了
     */
    endManualDrag(panel) {
        if (this.currentDropZone) {
            this.performSplit(this.draggedPanel, this.currentDropZone);
        }
        
        this.onPanelDragEnd(null, panel);
    }
    
    /**
     * ドロップゾーンへのドラッグオーバー
     */
    onDropZoneDragOver(e, dropZone) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        dropZone.style.opacity = '1';
        this.currentDropZone = dropZone;
        
        this.showSplitPreview(dropZone);
    }
    
    /**
     * ドロップゾーンからのドラッグ離脱
     */
    onDropZoneDragLeave(e, dropZone) {
        // 実際にエリアから離れた場合のみ
        if (!dropZone.contains(e.relatedTarget)) {
            dropZone.style.opacity = '0';
            this.hideSplitPreview();
            
            if (this.currentDropZone === dropZone) {
                this.currentDropZone = null;
            }
        }
    }
    
    /**
     * ドロップゾーンへのドロップ
     */
    onDropZoneDrop(e, dropZone) {
        e.preventDefault();
        
        if (!this.draggedPanel) return;
        
        this.performSplit(this.draggedPanel, dropZone);
        this.hideSplitPreview();
    }
    
    /**
     * 実際の分割実行
     */
    performSplit(draggedPanel, dropZone) {
        const position = dropZone.dataset.position;
        const targetPanel = dropZone.dataset.targetPanel;
        
        console.log('🔄 分割実行:', {
            dragged: draggedPanel.dataset.panelType,
            target: targetPanel,
            position
        });
        
        if (position === 'center') {
            this.createTabGroup(draggedPanel);
        } else {
            this.createSplitLayout(draggedPanel, dropZone, position);
        }
        
        this.emit('split:created', {
            draggedPanel: draggedPanel.dataset.panelType,
            targetPanel,
            position
        });
    }
    
    /**
     * 分割レイアウトの作成
     */
    createSplitLayout(draggedPanel, dropZone, position) {
        const targetPanel = document.querySelector(`[data-panel-type="${dropZone.dataset.targetPanel}"]`);
        if (!targetPanel) return;
        
        // 新しい分割コンテナを作成
        const splitContainer = document.createElement('div');
        splitContainer.className = 'split-container';
        
        const isVertical = position === 'left' || position === 'right';
        const isFirst = position === 'top' || position === 'left';
        
        splitContainer.style.cssText = `
            display: flex;
            flex-direction: ${isVertical ? 'row' : 'column'};
            width: 100%;
            height: 100%;
            gap: 4px;
        `;
        
        // 分割境界線を作成
        const splitter = this.createSplitter(isVertical);
        
        // パネルの順序を決定
        const firstPanel = isFirst ? draggedPanel : targetPanel;
        const secondPanel = isFirst ? targetPanel : draggedPanel;
        
        // DOM操作
        const targetParent = targetPanel.parentElement;
        targetParent.insertBefore(splitContainer, targetPanel);
        
        if (isFirst) {
            splitContainer.appendChild(firstPanel);
            splitContainer.appendChild(splitter);
            splitContainer.appendChild(secondPanel);
        } else {
            splitContainer.appendChild(secondPanel);
            splitContainer.appendChild(splitter);
            splitContainer.appendChild(firstPanel);
        }
        
        // パネルサイズ調整
        firstPanel.style.flex = '1';
        secondPanel.style.flex = '1';
        
        // 分割情報を記録
        this.splitBorders.push({
            element: splitter,
            container: splitContainer,
            orientation: isVertical ? 'vertical' : 'horizontal'
        });
        
        console.log('✅ 分割レイアウト作成完了:', position);
    }
    
    /**
     * 分割境界線の作成
     */
    createSplitter(isVertical) {
        const splitter = document.createElement('div');
        splitter.className = `splitter ${isVertical ? 'splitter-vertical' : 'splitter-horizontal'}`;
        
        splitter.style.cssText = `
            background: var(--border-color);
            cursor: ${isVertical ? 'col-resize' : 'row-resize'};
            flex-shrink: 0;
            ${isVertical ? 'width: 4px;' : 'height: 4px;'}
            transition: background-color 0.2s ease;
        `;
        
        // ホバー効果
        splitter.addEventListener('mouseenter', () => {
            splitter.style.backgroundColor = 'var(--accent-blue)';
        });
        
        splitter.addEventListener('mouseleave', () => {
            splitter.style.backgroundColor = 'var(--border-color)';
        });
        
        // リサイズイベント
        this.bindSplitterResize(splitter, isVertical);
        
        return splitter;
    }
    
    /**
     * 分割境界線のリサイズ機能
     */
    bindSplitterResize(splitter, isVertical) {
        let isResizing = false;
        let startPos = 0;
        let startSizes = [];
        
        const onMouseDown = (e) => {
            isResizing = true;
            startPos = isVertical ? e.clientX : e.clientY;
            
            const container = splitter.parentElement;
            const siblings = Array.from(container.children).filter(child => 
                child !== splitter && child.classList.contains('panel')
            );
            
            startSizes = siblings.map(sibling => {
                const rect = sibling.getBoundingClientRect();
                return isVertical ? rect.width : rect.height;
            });
            
            document.body.style.cursor = isVertical ? 'col-resize' : 'row-resize';
            document.body.classList.add('resizing');
            
            e.preventDefault();
        };
        
        const onMouseMove = (e) => {
            if (!isResizing) return;
            
            const currentPos = isVertical ? e.clientX : e.clientY;
            const delta = currentPos - startPos;
            
            const container = splitter.parentElement;
            const siblings = Array.from(container.children).filter(child => 
                child !== splitter && child.classList.contains('panel')
            );
            
            if (siblings.length === 2) {
                const [first, second] = siblings;
                const [firstSize, secondSize] = startSizes;
                
                const newFirstSize = Math.max(this.config.minPanelSize, firstSize + delta);
                const newSecondSize = Math.max(this.config.minPanelSize, secondSize - delta);
                
                if (isVertical) {
                    first.style.width = `${newFirstSize}px`;
                    second.style.width = `${newSecondSize}px`;
                } else {
                    first.style.height = `${newFirstSize}px`;
                    second.style.height = `${newSecondSize}px`;
                }
            }
            
            e.preventDefault();
        };
        
        const onMouseUp = () => {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.classList.remove('resizing');
        };
        
        splitter.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
    
    /**
     * タブグループの作成
     */
    createTabGroup(draggedPanel) {
        // 将来の拡張用
        console.log('📑 タブグループ作成:', draggedPanel.dataset.panelType);
    }
    
    /**
     * 分割プレビューの表示
     */
    showSplitPreview(dropZone) {
        const position = dropZone.dataset.position;
        const targetPanel = dropZone.dataset.targetPanel;
        
        // プレビューオーバーレイを作成
        let preview = document.querySelector('.split-preview');
        if (!preview) {
            preview = document.createElement('div');
            preview.className = 'split-preview';
            document.body.appendChild(preview);
        }
        
        // プレビュー位置とスタイル設定
        const targetElement = document.querySelector(`[data-panel-type="${targetPanel}"]`);
        if (!targetElement) return;
        
        const rect = targetElement.getBoundingClientRect();
        let previewRect = { ...rect };
        
        switch (position) {
            case 'top':
                previewRect.height = rect.height / 2;
                break;
            case 'bottom':
                previewRect.top = rect.top + rect.height / 2;
                previewRect.height = rect.height / 2;
                break;
            case 'left':
                previewRect.width = rect.width / 2;
                break;
            case 'right':
                previewRect.left = rect.left + rect.width / 2;
                previewRect.width = rect.width / 2;
                break;
        }
        
        preview.style.cssText = `
            position: fixed;
            top: ${previewRect.top}px;
            left: ${previewRect.left}px;
            width: ${previewRect.width}px;
            height: ${previewRect.height}px;
            background: rgba(0, 122, 204, 0.3);
            border: 2px solid var(--accent-blue);
            border-radius: 4px;
            pointer-events: none;
            z-index: 999;
            opacity: 1;
            transition: opacity 0.2s ease;
        `;
    }
    
    /**
     * 分割プレビューの非表示
     */
    hideSplitPreview() {
        const preview = document.querySelector('.split-preview');
        if (preview) {
            preview.remove();
        }
    }
    
    /**
     * ドロップゾーンの表示
     */
    showDropZones() {
        this.dropZones.forEach(zone => {
            zone.style.pointerEvents = 'auto';
        });
    }
    
    /**
     * ドロップゾーンの非表示
     */
    hideDropZones() {
        this.dropZones.forEach(zone => {
            zone.style.opacity = '0';
            zone.style.pointerEvents = 'none';
        });
        
        this.hideSplitPreview();
    }
    
    /**
     * イベントバインディング
     */
    bindEvents() {
        // ウィンドウリサイズ時の調整
        window.addEventListener('resize', () => {
            // 分割レイアウトの調整処理
            this.updateSplitLayouts();
        });
        
        // EventBusリスナー
        if (this.eventBus) {
            this.eventBus.on('layout:applied', () => {
                this.updateDropZones();
            });
        }
    }
    
    /**
     * 分割レイアウトの更新
     */
    updateSplitLayouts() {
        // 実装後に追加
    }
    
    /**
     * ドロップゾーンの更新
     */
    updateDropZones() {
        // レイアウト変更後のドロップゾーン更新
        setTimeout(() => {
            this.dropZones.forEach(zone => {
                const targetPanel = document.querySelector(`[data-panel-type="${zone.dataset.targetPanel}"]`);
                if (targetPanel && !targetPanel.contains(zone)) {
                    targetPanel.appendChild(zone);
                }
            });
        }, 100);
    }
    
    // 外部API
    enableDragSplit() {
        this.showDropZones();
    }
    
    disableDragSplit() {
        this.hideDropZones();
    }
    
    getSplitLayout() {
        return {
            areas: Array.from(this.splitAreas.entries()),
            borders: this.splitBorders.length
        };
    }
    
    // EventBus ヘルパー
    emit(eventType, data = {}) {
        if (this.eventBus) {
            this.eventBus.emit(eventType, data);
        }
    }
    
    destroy() {
        // ドロップゾーン削除
        this.dropZones.forEach(zone => zone.remove());
        this.dropZones = [];
        
        // プレビュー削除
        this.hideSplitPreview();
        
        // 分割境界線削除
        this.splitBorders.forEach(border => {
            if (border.element && border.element.parentElement) {
                border.element.remove();
            }
        });
        this.splitBorders = [];
        
        console.log('✅ DragSplitManager 終了');
    }
}