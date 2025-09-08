/**
 * PanelManager.js - パネル管理システム
 * 機能: パネル自動検出・登録・表示制御・状態管理
 */
export class PanelManager {
    constructor() {
        this.panels = new Map();
        this.state = 'initializing';
    }

    /**
     * パネル自動検出・登録
     */
    registerPanels() {
        console.log('📋 パネル登録開始');
        
        const panelElements = document.querySelectorAll('.panel[data-panel]');
        panelElements.forEach(panel => {
            const panelId = panel.dataset.panel;
            this.panels.set(panelId, {
                element: panel,
                id: panelId,
                status: 'registered',
                visible: panel.style.display !== 'none'
            });
            console.log(`✅ パネル登録: ${panelId}`);
        });
        
        console.log(`📝 パネル登録完了: ${this.panels.size}個`);
        this.state = 'ready';
        return this.panels.size;
    }

    /**
     * パネル表示制御
     */
    togglePanel(panelId) {
        const panel = this.panels.get(panelId);
        if (!panel) {
            console.warn(`⚠️ パネルが見つかりません: ${panelId}`);
            return false;
        }

        const isVisible = panel.element.style.display !== 'none';
        panel.element.style.display = isVisible ? 'none' : 'flex';
        panel.visible = !isVisible;
        
        console.log(`👁️ パネル表示切替: ${panelId} → ${!isVisible ? '表示' : '非表示'}`);
        return !isVisible;
    }

    /**
     * パネル状態取得
     */
    getPanelStatus(panelId) {
        const panel = this.panels.get(panelId);
        return panel ? {
            id: panel.id,
            status: panel.status,
            visible: panel.visible,
            element: panel.element
        } : null;
    }

    /**
     * 全パネル状態取得
     */
    getAllPanelsStatus() {
        const status = {
            state: this.state,
            panelCount: this.panels.size,
            panels: {}
        };

        this.panels.forEach((panel, panelId) => {
            status.panels[panelId] = {
                status: panel.status,
                visible: panel.visible
            };
        });

        return status;
    }

    /**
     * パネル検索
     */
    findPanel(panelId) {
        return this.panels.get(panelId);
    }

    /**
     * 全パネル取得
     */
    getAllPanels() {
        return Array.from(this.panels.keys());
    }

    /**
     * パネルクリーンアップ
     */
    cleanup() {
        this.panels.clear();
        this.state = 'cleanup';
        console.log('🧹 パネル管理システムクリーンアップ完了');
    }
}

export default PanelManager;