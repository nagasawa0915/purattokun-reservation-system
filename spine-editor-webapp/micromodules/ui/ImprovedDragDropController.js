/**
 * ImprovedDragDropController.js - 改善された縦積みドラッグ&ドロップシステム
 * 
 * 🌟 改善ポイント:
 * - 直感的なドラッグ&ドロップ体験
 * - 段階的ドロップゾーン表示
 * - リアルタイムプレビュー機能
 * - 現代的なUIライブラリの設計パターンを採用
 */
export class ImprovedDragDropController {
    constructor(panelManager, layoutManager = null) {
        this.panelManager = panelManager;
        this.layoutManager = layoutManager;
        this.isDraggingPanel = false;
        this.draggedPanel = null;
        this.state = 'initializing';
        
        // 🎯 改善された設定
        this.config = {
            edgeThreshold: 100,           // 画面端検出を100pxに縮小（より自然）
            previewEnabled: true,         // リアルタイムプレビュー有効
            animationDuration: 200,       // アニメーション時間
            dropZoneOpacity: 0.8,         // ドロップゾーン透明度
            hoverDelay: 150              // ホバー反応遅延
        };
        
        // ドロップゾーン管理
        this.dropZones = {
            main: null,           // メインドロップゾーン
            leftStack: null,      // 左サイド縦積みゾーン  
            rightStack: null,     // 右サイド縦積みゾーン
            panelSwap: null       // パネル入れ替えゾーン
        };
        
        this.dragState = {
            startPosition: null,
            currentZone: null,
            previewElement: null,
            isPreviewActive: false
        };
        
        console.log('🚀 ImprovedDragDropController初期化開始');
    }

    /**
     * 🎯 改善されたD&D初期化
     */
    async initializeDragDrop() {
        console.log('🔧 改善されたD&D機能初期化開始');
        
        try {
            // ドロップゾーン要素作成
            await this.createImprovedDropZones();
            
            // パネルヘッダーにドラッグ機能追加
            let initializedCount = 0;
            this.panelManager.getAllPanels().forEach(panelId => {
                const panel = this.panelManager.findPanel(panelId);
                if (panel) {
                    const header = panel.element.querySelector('.panel-header');
                    if (header) {
                        this.setupPanelDragEvents(header, panelId);
                        initializedCount++;
                    }
                }
            });
            
            // グローバルイベントリスナー設定
            this.setupGlobalEventListeners();
            
            this.state = 'ready';
            console.log(`✅ 改善されたD&D初期化完了: ${initializedCount}個のパネル`);
            return initializedCount;
            
        } catch (error) {
            console.error('❌ D&D初期化エラー:', error);
            this.state = 'error';
            return 0;
        }
    }

    /**
     * 🎨 改善されたドロップゾーン作成
     */
    async createImprovedDropZones() {
        // メインドロップゾーン（汎用）
        this.dropZones.main = this.createDropZone({
            id: 'improved-drop-zone-main',
            className: 'improved-drop-zone main-drop-zone',
            styles: this.getMainDropZoneStyles()
        });

        // 左サイド縦積みゾーン  
        this.dropZones.leftStack = this.createDropZone({
            id: 'improved-drop-zone-left-stack',
            className: 'improved-drop-zone left-stack-zone',
            content: this.getStackZoneContent('左サイドに縦積み', '📚'),
            styles: this.getStackZoneStyles('left')
        });

        // 右サイド縦積みゾーン
        this.dropZones.rightStack = this.createDropZone({
            id: 'improved-drop-zone-right-stack', 
            className: 'improved-drop-zone right-stack-zone',
            content: this.getStackZoneContent('右サイドに縦積み', '📚'),
            styles: this.getStackZoneStyles('right')
        });

        // パネル入れ替えゾーン
        this.dropZones.panelSwap = this.createDropZone({
            id: 'improved-drop-zone-panel-swap',
            className: 'improved-drop-zone panel-swap-zone',
            styles: this.getPanelSwapZoneStyles()
        });

        console.log('🎨 改善されたドロップゾーン作成完了');
    }

    /**
     * ドロップゾーン要素作成ヘルパー
     */
    createDropZone({ id, className, content = '', styles }) {
        const zone = document.createElement('div');
        zone.id = id;
        zone.className = className;
        zone.innerHTML = content;
        
        // スタイル適用
        Object.assign(zone.style, styles);
        
        // DOM に追加
        document.body.appendChild(zone);
        
        return zone;
    }

    /**
     * 🎨 メインドロップゾーンスタイル
     */
    getMainDropZoneStyles() {
        return {
            position: 'fixed',
            background: 'rgba(0, 122, 204, 0.3)',
            border: '2px dashed #007acc',
            borderRadius: '8px',
            pointerEvents: 'none',
            opacity: '0',
            transition: `all ${this.config.animationDuration}ms ease`,
            zIndex: '1400',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#007acc'
        };
    }

    /**
     * 🎨 縦積みゾーンスタイル
     */
    getStackZoneStyles(side) {
        return {
            position: 'fixed',
            background: 'rgba(0, 255, 136, 0.25)',
            border: '3px dashed #00ff88',
            borderRadius: '12px',
            pointerEvents: 'none',
            opacity: '0',
            transition: `all ${this.config.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            zIndex: '1500',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00ff88',
            fontWeight: 'bold',
            fontSize: '14px',
            textShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
            width: '180px',
            height: '120px',
            [side]: '20px',
            transform: 'scale(0.9)'
        };
    }

    /**
     * 🎨 パネル入れ替えゾーンスタイル
     */
    getPanelSwapZoneStyles() {
        return {
            position: 'fixed',
            background: 'rgba(255, 107, 107, 0.3)',
            border: '2px solid #ff6b6b',
            borderRadius: '6px',
            pointerEvents: 'none',
            opacity: '0',
            transition: `all ${this.config.animationDuration}ms ease`,
            zIndex: '1450',
            backdropFilter: 'blur(2px)'
        };
    }

    /**
     * 縦積みゾーンコンテンツ生成
     */
    getStackZoneContent(title, icon) {
        return `
            <div style="text-align: center;">
                <div style="font-size: 32px; margin-bottom: 8px;">${icon}</div>
                <div style="font-size: 13px; line-height: 1.3;">${title}</div>
            </div>
        `;
    }

    /**
     * 🖱️ パネルドラッグイベント設定
     */
    setupPanelDragEvents(header, panelId) {
        header.addEventListener('mousedown', (e) => this.startImprovedPanelDrag(e, panelId));
        header.style.cursor = 'grab';
        
        // ホバー効果追加
        header.addEventListener('mouseenter', () => {
            if (!this.isDraggingPanel) {
                header.style.background = '#4a4a4a';
                header.style.transform = 'scale(1.01)';
            }
        });
        
        header.addEventListener('mouseleave', () => {
            if (!this.isDraggingPanel) {
                header.style.background = '';
                header.style.transform = '';
            }
        });
    }

    /**
     * 🌐 グローバルイベントリスナー設定
     */
    setupGlobalEventListeners() {
        document.addEventListener('mousemove', (e) => this.handleImprovedPanelDrag(e));
        document.addEventListener('mouseup', () => this.endImprovedPanelDrag());
        
        // キーボードショートカット（ESC でドラッグキャンセル）
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDraggingPanel) {
                this.cancelDrag();
            }
        });
    }

    /**
     * 🚀 改善されたパネルドラッグ開始
     */
    startImprovedPanelDrag(event, panelId) {
        event.preventDefault();
        
        this.isDraggingPanel = true;
        this.draggedPanel = panelId;
        this.state = 'dragging';
        
        this.dragState.startPosition = {
            x: event.clientX,
            y: event.clientY
        };
        
        const header = event.currentTarget;
        header.classList.add('dragging');
        header.style.cursor = 'grabbing';
        
        // ボディのカーソル設定
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        
        // 🎯 Stage 1: 全体的なドロップヒント表示
        this.showGlobalDropHints();
        
        console.log(`🚀 改善されたパネルドラッグ開始: ${panelId}`, this.dragState.startPosition);
    }

    /**
     * 🔄 改善されたパネルドラッグ処理（段階的ドロップゾーン）
     */
    handleImprovedPanelDrag(event) {
        if (!this.isDraggingPanel || !this.draggedPanel) return;
        
        const { clientX: x, clientY: y } = event;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // 🎯 段階的ドロップゾーン判定
        const dropZoneResult = this.detectDropZone(x, y, screenWidth, screenHeight);
        
        // 現在のゾーンが変更された場合のみ更新
        if (dropZoneResult.zone !== this.dragState.currentZone) {
            this.updateDropZoneDisplay(dropZoneResult);
            this.dragState.currentZone = dropZoneResult.zone;
        }
    }

    /**
     * 🎯 改善されたドロップゾーン検出
     */
    detectDropZone(x, y, screenWidth, screenHeight) {
        const threshold = this.config.edgeThreshold;
        
        // Stage 2: サイド縦積みゾーン検出
        if (x <= threshold) {
            return {
                zone: 'leftStack',
                area: 'left',
                position: { x, y },
                priority: 'high'
            };
        }
        
        if (x >= screenWidth - threshold) {
            return {
                zone: 'rightStack', 
                area: 'right',
                position: { x, y },
                priority: 'high'
            };
        }
        
        // Stage 3: パネル入れ替えゾーン検出
        const elementBelow = document.elementFromPoint(x, y);
        const targetPanel = elementBelow?.closest('.panel[data-panel]');
        
        if (targetPanel && targetPanel.dataset.panel !== this.draggedPanel) {
            return {
                zone: 'panelSwap',
                targetPanel,
                targetPanelId: targetPanel.dataset.panel,
                position: targetPanel.getBoundingClientRect(),
                priority: 'medium'
            };
        }
        
        // デフォルト（ドロップ無効エリア）
        return {
            zone: 'none',
            priority: 'low'
        };
    }

    /**
     * 🎨 ドロップゾーン表示更新
     */
    updateDropZoneDisplay(dropZoneResult) {
        // 全てのドロップゾーンを非表示
        this.hideAllDropZones();
        
        switch (dropZoneResult.zone) {
            case 'leftStack':
                this.showStackDropZone('left', dropZoneResult.position);
                break;
                
            case 'rightStack':
                this.showStackDropZone('right', dropZoneResult.position);
                break;
                
            case 'panelSwap':
                this.showPanelSwapZone(dropZoneResult.targetPanel);
                break;
                
            case 'none':
            default:
                // ドロップゾーン非表示（既に hideAllDropZones() で処理済み）
                break;
        }
    }

    /**
     * 📚 改善された縦積みドロップゾーン表示
     */
    showStackDropZone(side, position) {
        const zone = this.dropZones[`${side}Stack`];
        if (!zone) return;
        
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // 位置計算
        if (side === 'left') {
            zone.style.left = '20px';
        } else {
            zone.style.left = `${screenWidth - 180 - 20}px`;
        }
        
        zone.style.top = `${Math.max(80, Math.min(screenHeight - 120 - 20, position.y - 60))}px`;
        
        // 表示アニメーション
        zone.style.opacity = this.config.dropZoneOpacity;
        zone.style.transform = 'scale(1.05)';
        zone.classList.add('active');
        
        console.log(`📚 改善された縦積みゾーン表示: ${side}`);
    }

    /**
     * 🔄 パネル入れ替えゾーン表示
     */
    showPanelSwapZone(targetPanel) {
        const zone = this.dropZones.panelSwap;
        if (!zone || !targetPanel) return;
        
        const rect = targetPanel.getBoundingClientRect();
        
        zone.style.left = `${rect.left - 2}px`;
        zone.style.top = `${rect.top - 2}px`;
        zone.style.width = `${rect.width + 4}px`;
        zone.style.height = `${rect.height + 4}px`;
        zone.style.opacity = this.config.dropZoneOpacity;
        zone.classList.add('active');
        
        zone.targetPanel = targetPanel;
        
        console.log('🔄 パネル入れ替えゾーン表示', targetPanel.dataset.panel);
    }

    /**
     * 🎨 全体的なドロップヒント表示
     */
    showGlobalDropHints() {
        // 全パネルヘッダーにホバー効果追加
        document.querySelectorAll('.panel-header').forEach(header => {
            if (header.closest('.panel').dataset.panel !== this.draggedPanel) {
                header.style.background = 'rgba(0, 122, 204, 0.2)';
                header.style.transition = `background ${this.config.animationDuration}ms ease`;
            }
        });
        
        console.log('🌐 グローバルドロップヒント表示');
    }

    /**
     * 🚫 全ドロップゾーン非表示
     */
    hideAllDropZones() {
        Object.values(this.dropZones).forEach(zone => {
            if (zone) {
                zone.style.opacity = '0';
                zone.style.transform = 'scale(0.9)';
                zone.classList.remove('active');
                zone.targetPanel = null;
            }
        });
        
        // パネルヘッダーの効果もリセット
        document.querySelectorAll('.panel-header').forEach(header => {
            header.style.background = '';
            header.style.transition = '';
        });
    }

    /**
     * ✅ 改善されたパネルドラッグ終了
     */
    endImprovedPanelDrag() {
        if (!this.isDraggingPanel) return;
        
        console.log('✅ 改善されたパネルドラッグ終了処理開始');
        
        // ドロップ処理実行
        const dropResult = this.executeImprovedDrop();
        
        // クリーンアップ
        this.cleanupDragState();
        
        console.log('✅ 改善されたパネルドラッグ完了', dropResult);
    }

    /**
     * 🎯 改善されたドロップ実行
     */
    executeImprovedDrop() {
        const currentZone = this.dragState.currentZone;
        
        switch (currentZone) {
            case 'leftStack':
                return this.executeStackDrop('left');
                
            case 'rightStack':
                return this.executeStackDrop('right');
                
            case 'panelSwap':
                return this.executePanelSwap();
                
            default:
                return { success: false, reason: 'No valid drop zone' };
        }
    }

    /**
     * 📚 縦積みドロップ実行
     */
    executeStackDrop(area) {
        console.log(`📚 改善された縦積みドロップ実行: ${this.draggedPanel} → ${area}`);
        
        if (!this.layoutManager) {
            console.warn('⚠️ LayoutManagerが設定されていません');
            return { success: false, reason: 'No LayoutManager' };
        }
        
        try {
            // 現在の縦積み状態取得
            const currentStacks = this.getCurrentStacks();
            
            // パネルを指定されたサイドに追加
            if (!currentStacks[area]) {
                currentStacks[area] = [];
            }
            
            // 重複回避で追加
            if (!currentStacks[area].includes(this.draggedPanel)) {
                currentStacks[area].push(this.draggedPanel);
            }
            
            // 他のサイドから削除
            Object.keys(currentStacks).forEach(otherArea => {
                if (otherArea !== area) {
                    const index = currentStacks[otherArea].indexOf(this.draggedPanel);
                    if (index !== -1) {
                        currentStacks[otherArea].splice(index, 1);
                    }
                }
            });
            
            // レイアウト適用
            this.applyImprovedStackedLayout(currentStacks);
            
            return { 
                success: true, 
                action: 'stack', 
                area, 
                panelId: this.draggedPanel,
                newStacks: currentStacks 
            };
            
        } catch (error) {
            console.error('❌ 縦積みドロップエラー:', error);
            return { success: false, reason: error.message };
        }
    }

    /**
     * 🔄 パネル入れ替え実行
     */
    executePanelSwap() {
        const swapZone = this.dropZones.panelSwap;
        const targetPanel = swapZone?.targetPanel;
        
        if (!targetPanel) {
            return { success: false, reason: 'No target panel' };
        }
        
        const targetPanelId = targetPanel.dataset.panel;
        
        console.log(`🔄 改善されたパネル入れ替え実行: ${this.draggedPanel} ↔ ${targetPanelId}`);
        
        try {
            const panel1 = this.panelManager.findPanel(this.draggedPanel);
            const panel2 = this.panelManager.findPanel(targetPanelId);
            
            if (!panel1 || !panel2) {
                return { success: false, reason: 'Panel not found' };
            }
            
            // CSS Grid Area を入れ替え
            const gridArea1 = getComputedStyle(panel1.element).gridArea;
            const gridArea2 = getComputedStyle(panel2.element).gridArea;
            
            panel1.element.style.gridArea = gridArea2;
            panel2.element.style.gridArea = gridArea1;
            
            // イベント発火
            this.dispatchImprovedSwapEvent(this.draggedPanel, targetPanelId);
            
            return { 
                success: true, 
                action: 'swap', 
                panel1: this.draggedPanel, 
                panel2: targetPanelId 
            };
            
        } catch (error) {
            console.error('❌ パネル入れ替えエラー:', error);
            return { success: false, reason: error.message };
        }
    }

    /**
     * 🧹 ドラッグ状態クリーンアップ
     */
    cleanupDragState() {
        // ドラッグ状態リセット
        this.isDraggingPanel = false;
        this.draggedPanel = null;
        this.state = 'ready';
        this.dragState.currentZone = null;
        
        // ドロップゾーン非表示
        this.hideAllDropZones();
        
        // ドラッグ中のスタイルリセット
        const draggedHeader = document.querySelector('.panel-header.dragging');
        if (draggedHeader) {
            draggedHeader.classList.remove('dragging');
            draggedHeader.style.cursor = 'grab';
        }
        
        // ボディスタイルリセット
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
     * 📚 改善された縦積みレイアウト適用
     */
    applyImprovedStackedLayout(stacks) {
        // 状態保存
        localStorage.setItem('spine-editor-stacks', JSON.stringify(stacks));
        
        // LayoutManagerでレイアウト切り替え
        if (stacks.left.length > 0 && stacks.right.length > 0) {
            this.layoutManager.switchLayout('both-stacked');
        } else if (stacks.left.length > 0) {
            this.layoutManager.switchLayout('left-stacked');
        } else if (stacks.right.length > 0) {
            this.layoutManager.switchLayout('right-stacked');
        } else {
            this.layoutManager.switchLayout('default');
        }
        
        console.log('📐 改善された縦積みレイアウト適用完了', stacks);
    }

    /**
     * 🔄 改善されたスワップイベント発火
     */
    dispatchImprovedSwapEvent(panel1Id, panel2Id) {
        const event = new CustomEvent('improvedPanelSwap', {
            detail: {
                panel1: panel1Id,
                panel2: panel2Id,
                timestamp: Date.now(),
                version: 'improved'
            }
        });
        document.dispatchEvent(event);
        
        console.log('🔄 改善されたスワップイベント発火', { panel1Id, panel2Id });
    }

    /**
     * 📊 現在の縦積み状態取得
     */
    getCurrentStacks() {
        const saved = localStorage.getItem('spine-editor-stacks');
        return saved ? JSON.parse(saved) : { left: [], right: [] };
    }

    /**
     * 📋 デバッグ情報取得
     */
    getImprovedDebugInfo() {
        return {
            state: this.state,
            isDragging: this.isDraggingPanel,
            draggedPanel: this.draggedPanel,
            currentZone: this.dragState.currentZone,
            config: this.config,
            dropZonesCount: Object.keys(this.dropZones).length,
            stacks: this.getCurrentStacks()
        };
    }

    /**
     * 🧹 クリーンアップ
     */
    cleanup() {
        if (this.isDraggingPanel) {
            this.cancelDrag();
        }
        
        // ドロップゾーン削除
        Object.values(this.dropZones).forEach(zone => {
            if (zone && zone.parentNode) {
                zone.parentNode.removeChild(zone);
            }
        });
        
        this.state = 'cleanup';
        console.log('🧹 ImprovedDragDropController クリーンアップ完了');
    }
}

export default ImprovedDragDropController;