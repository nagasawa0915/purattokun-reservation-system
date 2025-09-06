/**
 * coordinator-simple.js - シンプル司令塔システム
 * 外部依存なし・軽量・確実動作を目指した司令塔システム
 */

class SimpleSystemCoordinator {
    constructor() {
        this.state = 'initializing';
        this.panels = new Map();
        this.resizeHandles = new Map();
        this.isDragging = false;
        this.dragData = null;
        
        // D&D関連
        this.isDraggingPanel = false;
        this.draggedPanel = null;
        this.dropZone = null;
        
        this.init();
    }
    
    init() {
        console.log('🎯 シンプル司令塔システム開始');
        
        // DOM読み込み完了後に初期化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startCoordination());
        } else {
            this.startCoordination();
        }
    }
    
    startCoordination() {
        console.log('🚀 司令塔システム協調開始');
        
        try {
            // Phase 1: パネル登録
            this.registerPanels();
            
            // Phase 2: リサイズハンドル初期化
            this.initializeResizeHandles();
            
            // Phase 3: D&D機能初期化  
            this.initializeDragDrop();
            
            // Phase 4: デバッグ機能初期化
            this.initializeDebug();
            
            // 初期化完了
            this.state = 'ready';
            this.updateStatus('ready', '司令塔システム準備完了');
            this.updateDebugInfo();
            
            console.log('✅ シンプル司令塔システム初期化完了');
            
        } catch (error) {
            this.state = 'error';
            this.updateStatus('error', 'システムエラー');
            console.error('❌ 司令塔システム初期化失敗:', error);
        }
    }
    
    registerPanels() {
        console.log('📋 パネル登録開始');
        
        const panelElements = document.querySelectorAll('.panel[data-panel]');
        panelElements.forEach(panel => {
            const panelId = panel.dataset.panel;
            this.panels.set(panelId, {
                element: panel,
                id: panelId,
                status: 'registered'
            });
            console.log(`✅ パネル登録: ${panelId}`);
        });
        
        console.log(`📝 パネル登録完了: ${this.panels.size}個`);
    }
    
    initializeResizeHandles() {
        console.log('📏 リサイズハンドル初期化開始');
        
        const handles = [
            { element: '.resize-handle-left', direction: 'left', cssVar: '--outliner-width', axis: 'x' },
            { element: '.resize-handle-right', direction: 'right', cssVar: '--properties-width', axis: 'x' },
            { element: '.resize-handle-timeline', direction: 'timeline', cssVar: '--timeline-height', axis: 'y' }
        ];
        
        handles.forEach(config => {
            const element = document.querySelector(config.element);
            if (element) {
                this.resizeHandles.set(config.direction, {
                    element: element,
                    cssVar: config.cssVar,
                    axis: config.axis,
                    direction: config.direction
                });
                
                // ドラッグイベント設定
                element.addEventListener('mousedown', (e) => this.startResize(e, config.direction));
                
                console.log(`✅ リサイズハンドル設定: ${config.direction}`);
            }
        });
        
        // グローバルドラッグイベント
        document.addEventListener('mousemove', (e) => this.handleResize(e));
        document.addEventListener('mouseup', () => this.endResize());
        
        console.log(`📏 リサイズハンドル初期化完了: ${this.resizeHandles.size}個`);
    }
    
    startResize(event, direction) {
        event.preventDefault();
        this.isDragging = true;
        
        const handle = this.resizeHandles.get(direction);
        if (!handle) return;
        
        this.dragData = {
            direction: direction,
            startX: event.clientX,
            startY: event.clientY,
            handle: handle
        };
        
        document.body.style.cursor = handle.axis === 'x' ? 'ew-resize' : 'ns-resize';
        document.body.style.userSelect = 'none';
        
        this.updateDebugInfo(`ドラッグ開始: ${direction}`);
        console.log(`🖱️ リサイズ開始: ${direction}`);
    }
    
    handleResize(event) {
        if (!this.isDragging || !this.dragData) return;
        
        const { direction, startX, startY, handle } = this.dragData;
        let newValue;
        
        if (handle.axis === 'x') {
            const deltaX = event.clientX - startX;
            const currentWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue(handle.cssVar)) || 300;
            
            if (direction === 'left') {
                newValue = Math.max(200, Math.min(500, currentWidth + deltaX));
            } else if (direction === 'right') {
                newValue = Math.max(200, Math.min(500, currentWidth - deltaX));
            }
        } else if (handle.axis === 'y') {
            const deltaY = startY - event.clientY;
            const currentHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue(handle.cssVar)) || 200;
            newValue = Math.max(100, Math.min(400, currentHeight + deltaY));
        }
        
        if (newValue) {
            document.documentElement.style.setProperty(handle.cssVar, `${newValue}px`);
        }
        
        // ドラッグデータ更新（連続ドラッグ対応）
        this.dragData.startX = event.clientX;
        this.dragData.startY = event.clientY;
    }
    
    endResize() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.dragData = null;
        
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        this.updateDebugInfo('待機中');
        console.log('✅ リサイズ完了');
    }
    
    initializeDragDrop() {
        console.log('🔄 D&D機能初期化開始');
        
        this.dropZone = document.getElementById('drop-zone');
        
        // 各パネルヘッダーにドラッグ機能追加
        this.panels.forEach((panel, panelId) => {
            const header = panel.element.querySelector('.panel-header');
            if (header) {
                header.addEventListener('mousedown', (e) => this.startPanelDrag(e, panelId));
                console.log(`✅ D&D設定: ${panelId}`);
            }
        });
        
        // グローバルD&Dイベント
        document.addEventListener('mousemove', (e) => this.handlePanelDrag(e));
        document.addEventListener('mouseup', () => this.endPanelDrag());
        
        console.log(`🔄 D&D機能初期化完了: ${this.panels.size}個`);
    }
    
    startPanelDrag(event, panelId) {
        // リサイズ中はD&Dを無効化
        if (this.isDragging) return;
        
        event.preventDefault();
        this.isDraggingPanel = true;
        this.draggedPanel = panelId;
        
        const header = event.currentTarget;
        header.classList.add('dragging');
        
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        
        this.updateDebugInfo(`パネルドラッグ: ${panelId}`);
        console.log(`🖱️ パネルドラッグ開始: ${panelId}`);
    }
    
    handlePanelDrag(event) {
        if (!this.isDraggingPanel || !this.draggedPanel) return;
        
        // ドロップ可能エリアの検出（シンプル版：他のパネル上）
        const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
        const targetPanel = elementBelow?.closest('.panel[data-panel]');
        
        if (targetPanel && targetPanel.dataset.panel !== this.draggedPanel) {
            this.showDropZone(targetPanel);
        } else {
            this.hideDropZone();
        }
    }
    
    endPanelDrag() {
        if (!this.isDraggingPanel) return;
        
        const draggedElement = this.panels.get(this.draggedPanel)?.element;
        const draggedHeader = draggedElement?.querySelector('.panel-header');
        
        if (draggedHeader) {
            draggedHeader.classList.remove('dragging');
        }
        
        // ドロップ処理（シンプル版：位置入れ替え）
        const dropZone = document.querySelector('.drop-zone.active');
        if (dropZone) {
            const targetPanel = dropZone.targetPanel;
            if (targetPanel && targetPanel.dataset.panel !== this.draggedPanel) {
                this.swapPanels(this.draggedPanel, targetPanel.dataset.panel);
            }
        }
        
        this.hideDropZone();
        this.isDraggingPanel = false;
        this.draggedPanel = null;
        
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        this.updateDebugInfo('待機中');
        console.log('✅ パネルドラッグ完了');
    }
    
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
    
    hideDropZone() {
        if (this.dropZone) {
            this.dropZone.classList.remove('active');
            this.dropZone.targetPanel = null;
        }
    }
    
    swapPanels(panelId1, panelId2) {
        console.log(`🔄 パネル入れ替え: ${panelId1} ↔ ${panelId2}`);
        
        const panel1 = this.panels.get(panelId1);
        const panel2 = this.panels.get(panelId2);
        
        if (!panel1 || !panel2) return;
        
        // CSS Grid Areaを入れ替え（シンプル版）
        const gridArea1 = getComputedStyle(panel1.element).gridArea;
        const gridArea2 = getComputedStyle(panel2.element).gridArea;
        
        panel1.element.style.gridArea = gridArea2;
        panel2.element.style.gridArea = gridArea1;
        
        console.log(`✅ パネル入れ替え完了: ${panelId1} ↔ ${panelId2}`);
        this.updateDebugInfo(`入れ替え完了: ${panelId1}↔${panelId2}`);
        
        // 少し後にリセット
        setTimeout(() => this.updateDebugInfo('待機中'), 2000);
    }
    
    initializeDebug() {
        console.log('🔍 デバッグ機能初期化');
        
        // デバッグコマンドをグローバルに設定
        window.debugCoordinator = () => this.getSystemStatus();
        window.coordinatorSimple = this;
        
        console.log('💡 利用可能なデバッグコマンド:');
        console.log('  debugCoordinator() - システム状態確認');
        console.log('  coordinatorSimple - 司令塔インスタンス');
    }
    
    updateStatus(statusClass, message) {
        const statusElement = document.getElementById('coordinator-status');
        if (statusElement) {
            statusElement.className = `coordinator-status ${statusClass}`;
            statusElement.textContent = message;
        }
    }
    
    updateDebugInfo(dragState = null) {
        const elements = {
            coordinatorState: document.getElementById('coordinator-state'),
            panelCount: document.getElementById('panel-count'),
            dragState: document.getElementById('drag-state')
        };
        
        if (elements.coordinatorState) {
            elements.coordinatorState.textContent = this.state;
        }
        if (elements.panelCount) {
            elements.panelCount.textContent = this.panels.size;
        }
        if (elements.dragState && dragState) {
            elements.dragState.textContent = dragState;
        }
    }
    
    getSystemStatus() {
        const status = {
            state: this.state,
            panels: Array.from(this.panels.keys()),
            resizeHandles: Array.from(this.resizeHandles.keys()),
            isDragging: this.isDragging,
            cssVariables: {
                outlinerWidth: getComputedStyle(document.documentElement).getPropertyValue('--outliner-width'),
                propertiesWidth: getComputedStyle(document.documentElement).getPropertyValue('--properties-width'),
                timelineHeight: getComputedStyle(document.documentElement).getPropertyValue('--timeline-height')
            }
        };
        
        console.log('🎯 シンプル司令塔システム状態:', status);
        return status;
    }
    
    // パネル表示制御
    togglePanel(panelId) {
        const panel = this.panels.get(panelId);
        if (panel) {
            const isVisible = panel.element.style.display !== 'none';
            panel.element.style.display = isVisible ? 'none' : 'flex';
            console.log(`👁️ パネル表示切替: ${panelId} → ${!isVisible ? '表示' : '非表示'}`);
        }
    }
    
    // レイアウトリセット
    resetLayout() {
        document.documentElement.style.setProperty('--outliner-width', '300px');
        document.documentElement.style.setProperty('--properties-width', '300px');
        document.documentElement.style.setProperty('--timeline-height', '200px');
        
        console.log('🔄 レイアウトリセット完了');
        this.updateDebugInfo();
    }
}

// 司令塔システム自動初期化
document.addEventListener('DOMContentLoaded', () => {
    window.simpleCoordinator = new SimpleSystemCoordinator();
});

// 緊急時用のグローバル関数
window.resetLayout = () => window.simpleCoordinator?.resetLayout();
window.toggleDebug = () => {
    const debugPanel = document.getElementById('debug-panel');
    if (debugPanel) {
        debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
    }
};

console.log('⌨️ 利用可能なコマンド:');
console.log('  debugCoordinator() - システム状態確認');
console.log('  resetLayout() - レイアウトリセット');
console.log('  toggleDebug() - デバッグパネル表示切替');