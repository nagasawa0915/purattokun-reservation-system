/**
 * SimplePanelSwapController.js - シンプルなパネル入れ替えシステム
 * 
 * 🎯 設計原則
 * - ファイルサイズ: < 300行
 * - 他モジュール干渉: 最小限
 * - 状態管理: 必要最小限
 * - 段階的実装: 基本機能優先
 * 
 * 🚨 失敗要因の回避
 * - ResizeController直接操作禁止
 * - 複雑な最適化コード禁止
 * - 巨大化防止
 */
export class SimplePanelSwapController {
    constructor(panelManager) {
        console.log('🎯 SimplePanelSwapController 初期化開始');
        
        this.panelManager = panelManager;
        this.state = 'initializing';
        
        // 最小限の状態管理
        this.isDragging = false;
        this.draggedPanel = null;
        this.currentTargetPanel = null;
        
        // ドロップエリア色分け設定
        this.dropAreaColors = {
            top: 'rgba(0, 255, 136, 0.6)',      // 緑
            right: 'rgba(0, 122, 204, 0.6)',    // 青  
            bottom: 'rgba(255, 187, 0, 0.6)',   // 黄
            left: 'rgba(255, 107, 107, 0.6)',   // 赤
            center: 'rgba(138, 43, 226, 0.6)'   // 紫
        };
        
        this.dropHighlights = [];
        
        console.log('✅ SimplePanelSwapController 初期化完了');
    }

    /**
     * パネル入れ替えシステム初期化
     */
    initialize() {
        console.log('🚀 パネル入れ替えシステム初期化開始');
        
        try {
            // 各パネルにドラッグイベントを設定
            this.setupDragEvents();
            
            this.state = 'ready';
            console.log('✅ パネル入れ替えシステム初期化完了');
            return this.panelManager.getAllPanels().length;
            
        } catch (error) {
            console.error('❌ パネル入れ替えシステム初期化エラー:', error);
            this.state = 'error';
            throw error;
        }
    }

    /**
     * ドラッグイベント設定
     */
    setupDragEvents() {
        const panelIds = this.panelManager.getAllPanels();
        console.log(`📌 ドラッグイベント設定: ${panelIds.length}個のパネル`);
        
        panelIds.forEach(panelId => {
            const panel = this.panelManager.findPanel(panelId);
            if (panel && panel.element) {
                const header = panel.element.querySelector('.panel-header');
                if (header) {
                    header.addEventListener('mousedown', (e) => this.handleMouseDown(e, panelId));
                }
            }
        });

        // グローバルマウスイベント
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }

    /**
     * マウスダウン処理
     */
    handleMouseDown(event, panelId) {
        console.log(`🖱️ ドラッグ開始: ${panelId}`);
        
        this.isDragging = true;
        this.draggedPanel = panelId;
        
        // ドラッグ中の視覚フィードバック
        const header = event.target;
        header.classList.add('dragging');
        
        // マウス移動中のドロップエリア表示準備
        event.preventDefault();
    }

    /**
     * マウス移動処理
     */
    handleMouseMove(event) {
        if (!this.isDragging) return;
        
        // マウス下にある要素を取得
        const element = document.elementFromPoint(event.clientX, event.clientY);
        if (!element) return;
        
        // パネル要素を探す
        const panelElement = element.closest('.panel');
        if (!panelElement) {
            this.clearDropHighlights();
            this.currentTargetPanel = null;
            return;
        }
        
        const targetPanelId = panelElement.getAttribute('data-panel');
        if (!targetPanelId || targetPanelId === this.draggedPanel) return;
        
        // 現在のターゲットパネルが変わった場合
        if (this.currentTargetPanel !== targetPanelId) {
            this.clearDropHighlights();
            this.currentTargetPanel = targetPanelId;
            this.showDropAreas(targetPanelId, event);
        }
    }

    /**
     * ドロップエリア表示
     */
    showDropAreas(targetPanelId, event) {
        const panel = this.panelManager.findPanel(targetPanelId);
        if (!panel || !panel.element) return;
        
        const rect = panel.element.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // 5つのドロップエリアを判定・表示
        const dropArea = this.calculateDropArea(rect.width, rect.height, mouseX, mouseY);
        this.highlightDropArea(panel.element, dropArea);
    }

    /**
     * ドロップエリア計算
     */
    calculateDropArea(width, height, mouseX, mouseY) {
        const edgeThreshold = 0.2; // 20%
        
        // 中央エリア判定
        const centerLeft = width * edgeThreshold;
        const centerRight = width * (1 - edgeThreshold);
        const centerTop = height * edgeThreshold;
        const centerBottom = height * (1 - edgeThreshold);
        
        if (mouseX >= centerLeft && mouseX <= centerRight && 
            mouseY >= centerTop && mouseY <= centerBottom) {
            return 'center';
        }
        
        // 辺エリア判定
        if (mouseY < centerTop) return 'top';
        if (mouseY > centerBottom) return 'bottom';
        if (mouseX < centerLeft) return 'left';
        if (mouseX > centerRight) return 'right';
        
        return 'center'; // フォールバック
    }

    /**
     * ドロップエリアハイライト
     */
    highlightDropArea(panelElement, area) {
        this.clearDropHighlights();
        
        const highlight = document.createElement('div');
        highlight.className = 'drop-area-highlight';
        highlight.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: ${this.dropAreaColors[area]};
            border: 2px dashed rgba(255, 255, 255, 0.8);
            border-radius: 4px;
            pointer-events: none;
            z-index: 1000;
            animation: dropPulse 1s infinite;
        `;
        
        panelElement.style.position = 'relative';
        panelElement.appendChild(highlight);
        this.dropHighlights.push(highlight);
    }

    /**
     * マウスアップ処理（ドロップ）
     */
    handleMouseUp(event) {
        if (!this.isDragging) return;
        
        // ドロップターゲットが設定されている場合
        if (this.currentTargetPanel && this.currentTargetPanel !== this.draggedPanel) {
            console.log(`🎯 ドロップ: ${this.draggedPanel} → ${this.currentTargetPanel}`);
            
            try {
                // パネル入れ替え実行
                this.executeSwap(this.draggedPanel, this.currentTargetPanel);
            } catch (error) {
                console.error('❌ パネル入れ替えエラー:', error);
            }
        }
        
        this.endDrag();
    }

    /**
     * パネル入れ替え実行
     */
    executeSwap(draggedId, targetId) {
        console.log(`🔄 パネル入れ替え実行: ${draggedId} ⇄ ${targetId}`);
        
        const draggedPanel = this.panelManager.findPanel(draggedId);
        const targetPanel = this.panelManager.findPanel(targetId);
        
        if (!draggedPanel || !targetPanel) {
            throw new Error('パネルが見つかりません');
        }
        
        // 現在のgrid-areaを正確に取得（CSS + inline styleの両方を考慮）
        const draggedCurrentArea = this.getCurrentGridArea(draggedPanel.element);
        const targetCurrentArea = this.getCurrentGridArea(targetPanel.element);
        
        console.log(`📍 入れ替え前: ${draggedId}=${draggedCurrentArea}, ${targetId}=${targetCurrentArea}`);
        
        // grid-area を交換
        draggedPanel.element.style.gridArea = targetCurrentArea;
        targetPanel.element.style.gridArea = draggedCurrentArea;
        
        // 確認用ログ
        const draggedNewArea = this.getCurrentGridArea(draggedPanel.element);
        const targetNewArea = this.getCurrentGridArea(targetPanel.element);
        
        console.log(`✅ パネル入れ替え完了: ${draggedId}→${draggedNewArea}, ${targetId}→${targetNewArea}`);
    }

    /**
     * 現在のgrid-areaを取得（CSS + inline styleの両方を考慮）
     */
    getCurrentGridArea(element) {
        // 1. inline styleを優先
        if (element.style.gridArea) {
            return element.style.gridArea;
        }
        
        // 2. computedStyleから取得
        const computedStyle = getComputedStyle(element);
        const gridArea = computedStyle.getPropertyValue('grid-area');
        
        if (gridArea && gridArea !== 'auto') {
            return gridArea;
        }
        
        // 3. data-panel属性をフォールバック
        return element.getAttribute('data-panel');
    }

    /**
     * ドラッグ終了処理
     */
    endDrag() {
        console.log('🏁 ドラッグ終了');
        
        // ドラッグ状態リセット
        this.isDragging = false;
        this.draggedPanel = null;
        this.currentTargetPanel = null;
        
        // 視覚効果クリア
        this.clearDropHighlights();
        
        // dragging クラス削除
        document.querySelectorAll('.panel-header.dragging').forEach(header => {
            header.classList.remove('dragging');
        });
    }

    /**
     * ドロップハイライトクリア
     */
    clearDropHighlights() {
        this.dropHighlights.forEach(highlight => {
            if (highlight.parentNode) {
                highlight.parentNode.removeChild(highlight);
            }
        });
        this.dropHighlights = [];
    }

    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            state: this.state,
            isDragging: this.isDragging,
            draggedPanel: this.draggedPanel,
            currentTargetPanel: this.currentTargetPanel,
            highlightCount: this.dropHighlights.length
        };
    }

    /**
     * クリーンアップ
     */
    cleanup() {
        console.log('🧹 SimplePanelSwapController クリーンアップ');
        
        this.endDrag();
        this.state = 'cleanup';
        
        // イベントリスナーの削除は必要に応じて実装
    }
}

// CSS アニメーション定義（一度だけ追加）
if (!document.querySelector('#simple-panel-swap-styles')) {
    const style = document.createElement('style');
    style.id = 'simple-panel-swap-styles';
    style.textContent = `
        @keyframes dropPulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.02); }
        }
        
        .panel-header.dragging {
            background: #007acc !important;
            transform: scale(1.05);
            z-index: 2000;
            box-shadow: 0 4px 20px rgba(0, 122, 204, 0.4);
        }
    `;
    document.head.appendChild(style);
}

export default SimplePanelSwapController;