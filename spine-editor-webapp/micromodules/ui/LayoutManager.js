/**
 * LayoutManager.js - 動的レイアウト管理システム
 * 機能: パネル縦積み・動的グリッド変更・レイアウト状態保存
 */
export class LayoutManager {
    constructor() {
        this.currentLayout = 'default';
        this.layoutConfigs = new Map();
        this.state = 'initializing';
        
        // デフォルトレイアウト設定
        this.initializeLayouts();
        
        console.log('📐 LayoutManager初期化完了');
    }

    /**
     * レイアウト設定初期化
     */
    initializeLayouts() {
        // デフォルト4パネル固定レイアウト
        this.layoutConfigs.set('default', {
            name: 'デフォルト',
            areas: [
                "header header header",
                "outliner preview properties", 
                "timeline timeline timeline"
            ],
            columns: "var(--outliner-width, 300px) 1fr var(--properties-width, 300px)",
            rows: "60px 1fr var(--timeline-height, 200px)"
        });

        // 左サイド縦積みレイアウト
        this.layoutConfigs.set('left-stacked', {
            name: '左サイド縦積み',
            areas: [
                "header header header",
                "outliner preview preview",
                "properties preview preview", 
                "timeline timeline timeline"
            ],
            columns: "var(--left-panels-width, 300px) 1fr auto",
            rows: "60px 1fr 1fr var(--timeline-height, 200px)"
        });

        // 右サイド縦積みレイアウト
        this.layoutConfigs.set('right-stacked', {
            name: '右サイド縦積み',
            areas: [
                "header header header",
                "outliner outliner properties",
                "outliner outliner preview", 
                "timeline timeline timeline"
            ],
            columns: "1fr auto var(--right-panels-width, 300px)",
            rows: "60px 1fr 1fr var(--timeline-height, 200px)"
        });

        // 両サイド縦積みレイアウト
        this.layoutConfigs.set('both-stacked', {
            name: '両サイド縦積み',
            areas: [
                "header header header header",
                "outliner preview preview properties",
                "timeline-left timeline-center timeline-center timeline-right"
            ],
            columns: "var(--left-width, 250px) 1fr 1fr var(--right-width, 250px)",
            rows: "60px 1fr var(--timeline-height, 200px)"
        });

        console.log(`📐 レイアウト設定初期化: ${this.layoutConfigs.size}種類`);
    }

    /**
     * レイアウト切り替え
     * @param {string} layoutId - レイアウトID
     */
    switchLayout(layoutId) {
        const config = this.layoutConfigs.get(layoutId);
        if (!config) {
            console.warn(`⚠️ 不明なレイアウト: ${layoutId}`);
            return false;
        }

        console.log(`🔄 レイアウト切替: ${this.currentLayout} → ${layoutId}`);
        
        // CSS Grid設定更新（!important でCSS優先度を上書き）
        document.body.style.setProperty('grid-template-areas', config.areas.map(area => `"${area}"`).join(' '), 'important');
        document.body.style.setProperty('grid-template-columns', config.columns, 'important');
        document.body.style.setProperty('grid-template-rows', config.rows, 'important');

        // パネル配置更新
        this.updatePanelGridAreas(layoutId);
        
        this.currentLayout = layoutId;
        
        // レイアウト状態保存
        localStorage.setItem('spine-editor-layout', layoutId);
        
        console.log(`✅ レイアウト切替完了: ${config.name}`);
        return true;
    }

    /**
     * パネルのgrid-area更新
     * @param {string} layoutId - レイアウトID
     */
    updatePanelGridAreas(layoutId) {
        const config = this.layoutConfigs.get(layoutId);
        if (!config) return;

        // レイアウト別のパネル配置設定
        const panelMappings = this.getPanelMappings(layoutId);
        
        Object.entries(panelMappings).forEach(([panelId, gridArea]) => {
            const panel = document.querySelector(`.panel[data-panel="${panelId}"]`);
            if (panel) {
                panel.style.gridArea = gridArea;
                console.log(`📍 パネル配置更新: ${panelId} → ${gridArea}`);
            }
        });
    }

    /**
     * レイアウト別パネル配置マッピング
     * @param {string} layoutId - レイアウトID
     * @returns {Object} パネルID → gridArea のマッピング
     */
    getPanelMappings(layoutId) {
        const mappings = {
            'default': {
                'outliner': 'outliner',
                'preview': 'preview', 
                'properties': 'properties',
                'timeline': 'timeline'
            },
            'left-stacked': {
                'outliner': 'outliner',
                'properties': 'properties',
                'preview': 'preview',
                'timeline': 'timeline'
            },
            'right-stacked': {
                'outliner': 'outliner',
                'properties': 'properties', 
                'preview': 'preview',
                'timeline': 'timeline'
            },
            'both-stacked': {
                'outliner': 'outliner',
                'preview': 'preview',
                'properties': 'properties',
                'timeline': 'timeline-center'
            }
        };

        return mappings[layoutId] || mappings['default'];
    }

    /**
     * カスタムレイアウト作成
     * @param {string} layoutId - 新しいレイアウトID
     * @param {Object} config - レイアウト設定
     */
    createCustomLayout(layoutId, config) {
        this.layoutConfigs.set(layoutId, config);
        console.log(`➕ カスタムレイアウト作成: ${layoutId}`);
        return true;
    }

    /**
     * パネル縦積み実行
     * @param {string} containerArea - 縦積みするエリア（left/right）
     * @param {Array} panelIds - 縦積みするパネルID配列
     */
    stackPanelsVertically(containerArea, panelIds) {
        console.log(`📚 パネル縦積み実行: ${containerArea}`, panelIds);
        
        // 動的グリッドエリア生成
        const stackedAreas = this.generateStackedAreas(containerArea, panelIds);
        
        // 一時的なレイアウト設定作成
        const tempLayoutId = `stacked-${containerArea}-${Date.now()}`;
        this.createCustomLayout(tempLayoutId, {
            name: `${containerArea}縦積み`,
            areas: stackedAreas.areas,
            columns: stackedAreas.columns,
            rows: stackedAreas.rows
        });
        
        // レイアウト適用
        this.switchLayout(tempLayoutId);
        
        return tempLayoutId;
    }

    /**
     * 縦積み用グリッドエリア生成
     * @param {string} containerArea - コンテナエリア
     * @param {Array} panelIds - パネルID配列
     * @returns {Object} 生成されたグリッド設定
     */
    generateStackedAreas(containerArea, panelIds) {
        const baseAreas = ["header header header"];
        const baseColumns = "var(--left-width, 300px) 1fr var(--right-width, 300px)";
        const baseRows = ["60px"];

        if (containerArea === 'left') {
            // 左サイド縦積み
            panelIds.forEach((panelId, index) => {
                const area = `${panelId} preview properties`;
                baseAreas.push(area);
                baseRows.push("1fr");
            });
        } else if (containerArea === 'right') {
            // 右サイド縦積み
            panelIds.forEach((panelId, index) => {
                const area = `outliner preview ${panelId}`;
                baseAreas.push(area);
                baseRows.push("1fr");
            });
        }

        // タイムライン追加
        baseAreas.push("timeline timeline timeline");
        baseRows.push("var(--timeline-height, 200px)");

        return {
            areas: baseAreas,
            columns: baseColumns,
            rows: baseRows.join(" ")
        };
    }

    /**
     * 現在のレイアウト情報取得
     */
    getCurrentLayout() {
        return {
            id: this.currentLayout,
            config: this.layoutConfigs.get(this.currentLayout),
            availableLayouts: Array.from(this.layoutConfigs.keys())
        };
    }

    /**
     * レイアウトリセット
     */
    resetLayout() {
        this.switchLayout('default');
        localStorage.removeItem('spine-editor-layout');
        console.log('🔄 レイアウトをデフォルトにリセット');
    }

    /**
     * 保存されたレイアウト復元
     */
    restoreLayout() {
        const savedLayout = localStorage.getItem('spine-editor-layout');
        if (savedLayout && this.layoutConfigs.has(savedLayout)) {
            this.switchLayout(savedLayout);
            console.log(`🔄 保存レイアウト復元: ${savedLayout}`);
        }
    }

    /**
     * デバッグ情報出力
     */
    getDebugInfo() {
        return {
            currentLayout: this.currentLayout,
            availableLayouts: this.layoutConfigs.size,
            state: this.state,
            gridTemplateAreas: getComputedStyle(document.body).gridTemplateAreas,
            gridTemplateColumns: getComputedStyle(document.body).gridTemplateColumns,
            gridTemplateRows: getComputedStyle(document.body).gridTemplateRows
        };
    }
}