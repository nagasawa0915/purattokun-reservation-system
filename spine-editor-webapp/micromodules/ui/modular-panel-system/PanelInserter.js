/**
 * PanelInserter.js - パネル挿入専門モジュール
 * 機能: 横方向・縦方向のパネル挿入処理
 * 設計思想: 単一責任・空白なし・確実な再配置
 */
export class PanelInserter {
    constructor() {
        this.state = 'ready';
        
        // パネルタイプの定義
        this.panelTypes = ['outliner', 'preview', 'properties', 'timeline'];
        this.horizontalPanels = ['outliner', 'preview', 'properties']; // timeline は横挿入対象外
        
        console.log('⚡ PanelInserter初期化完了');
    }

    /**
     * 横方向挿入（核心機能）
     * @param {string} panelToMove - 移動するパネル（例: 'properties'）
     * @param {string} targetPanel - 挿入先基準パネル（例: 'outliner'）  
     * @param {string} position - 挿入位置（'before' | 'after'）
     */
    insertHorizontally(panelToMove, targetPanel, position) {
        console.log(`🔄 横挿入開始: ${panelToMove} を ${targetPanel} の ${position} に挿入`);
        
        try {
            // 1. 現在の横配置順序を取得
            const currentOrder = this.getCurrentHorizontalOrder();
            console.log('📋 現在の順序:', currentOrder);
            
            // 2. 新しい順序を計算
            const newOrder = this.calculateNewHorizontalOrder(
                currentOrder, panelToMove, targetPanel, position
            );
            console.log('🎯 新しい順序:', newOrder);
            
            // 3. Grid Template Areas を更新
            const result = this.applyHorizontalOrder(newOrder);
            
            if (result.success) {
                console.log('✅ 横挿入完了:', newOrder.join(' → '));
                return { 
                    success: true, 
                    newOrder: newOrder,
                    operation: `${panelToMove} inserted ${position} ${targetPanel}`
                };
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('❌ 横挿入エラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 現在の横配置順序を取得
     */
    getCurrentHorizontalOrder() {
        // Grid Template Areas から現在の順序を解析
        const gridContainer = this.getGridContainer();
        const computedStyle = getComputedStyle(gridContainer);
        const areas = computedStyle.getPropertyValue('grid-template-areas');
        
        console.log('🔍 [修正版] Grid Areas解析開始:', areas);
        
        // CSSのgrid-template-areasは以下の形式：
        // "header header header" "outliner preview properties" "timeline timeline timeline"
        // または
        // "header header header"
        // "outliner preview properties"
        // "timeline timeline timeline"
        
        // すべてのクォート内容を抽出
        const quotedSections = [];
        let match;
        const quoteRegex = /"([^"]*)"/g;
        while ((match = quoteRegex.exec(areas)) !== null) {
            quotedSections.push(match[1]);
        }
        
        console.log('🔍 [修正版] 抽出されたクォートセクション:', quotedSections);
        
        // 2番目のセクションがパネルエリア（1番目はheader、2番目がパネル、3番目がtimeline）
        let panelSection = '';
        if (quotedSections.length >= 2) {
            panelSection = quotedSections[1];
        } else if (quotedSections.length === 1) {
            // 改行なしの場合、1つのクォート内にすべてが含まれる可能性
            const parts = quotedSections[0].split(/\s+/);
            // headerでもtimelineでもない部分を抽出
            const panelParts = parts.filter(part => this.horizontalPanels.includes(part));
            console.log('🔍 [修正版] 1つのクォートから抽出:', panelParts);
            return panelParts.length > 0 ? panelParts : this.horizontalPanels.slice(); // デフォルト順序を返す
        } else {
            console.warn('⚠️ [修正版] Grid Areas解析失敗 - デフォルト順序を使用');
            return this.horizontalPanels.slice(); // デフォルト順序: ['outliner', 'preview', 'properties']
        }
        
        // パネルセクションをスペースで分割してフィルタリング
        const order = panelSection.split(/\s+/).filter(item => item && this.horizontalPanels.includes(item));
        
        console.log('🔍 [修正版] パネルセクション:', panelSection, '→ 最終順序:', order);
        
        // 順序が空の場合はデフォルトを返す
        return order.length > 0 ? order : this.horizontalPanels.slice();
    }

    /**
     * 新しい横順序を計算（空白なし保証）
     */
    calculateNewHorizontalOrder(currentOrder, panelToMove, targetPanel, position) {
        // 1. 移動パネルを現在位置から除去
        const withoutMoved = currentOrder.filter(panel => panel !== panelToMove);
        
        // 2. 挿入位置を特定
        const targetIndex = withoutMoved.indexOf(targetPanel);
        if (targetIndex === -1) {
            throw new Error(`挿入先パネルが見つかりません: ${targetPanel}`);
        }
        
        // 3. 指定位置に挿入
        const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
        const newOrder = [...withoutMoved];
        newOrder.splice(insertIndex, 0, panelToMove);
        
        // 4. 空白チェック（安全確認）
        if (newOrder.length !== this.horizontalPanels.length) {
            throw new Error(`パネル数が一致しません: 期待${this.horizontalPanels.length}、実際${newOrder.length}`);
        }
        
        // 5. 重複チェック
        const uniquePanels = [...new Set(newOrder)];
        if (uniquePanels.length !== newOrder.length) {
            throw new Error('重複パネルが検出されました');
        }
        
        return newOrder;
    }

    /**
     * 横順序をGrid Layoutに適用
     */
    applyHorizontalOrder(newOrder) {
        try {
            const gridContainer = this.getGridContainer();
            
            // Grid Template Areas を生成（timelineは固定）
            const newAreas = `
                "${newOrder.join(' ')}"
                "timeline timeline timeline"
            `;
            
            console.log('🎨 新しいGrid Template Areas適用:', newAreas);
            
            // CSSに適用
            gridContainer.style.setProperty('grid-template-areas', newAreas.trim(), 'important');
            
            // 確認のため、設定後の値をチェック
            setTimeout(() => {
                const applied = getComputedStyle(gridContainer).getPropertyValue('grid-template-areas');
                console.log('✅ 適用確認:', applied);
            }, 50);
            
            return { success: true };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 縦方向挿入（Phase 2で実装予定）
     */
    insertVertically(panelToMove, targetPanel, position) {
        console.log('⚠️ 縦挿入機能はPhase 2で実装予定');
        return { 
            success: false, 
            error: 'Vertical insertion not implemented yet (Phase 2)' 
        };
    }

    /**
     * Grid Containerを取得
     */
    getGridContainer() {
        // body要素がGrid Containerになっている
        return document.body;
    }

    /**
     * 現在のパネル要素を取得
     */
    getPanelElement(panelType) {
        return document.querySelector(`.panel-${panelType}`);
    }

    /**
     * 全パネルを初期配置に復元
     */
    resetToDefaultLayout() {
        console.log('🔄 デフォルトレイアウトに復元');
        
        const defaultOrder = ['outliner', 'preview', 'properties'];
        const result = this.applyHorizontalOrder(defaultOrder);
        
        if (result.success) {
            console.log('✅ デフォルトレイアウト復元完了');
            return { success: true, layout: 'default' };
        } else {
            console.error('❌ デフォルトレイアウト復元失敗:', result.error);
            return { success: false, error: result.error };
        }
    }

    /**
     * NewPanelSwapController互換メソッド（リセット機能用）
     */
    initializePanelGridAreas() {
        return this.resetToDefaultLayout();
    }

    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            state: this.state,
            currentOrder: this.getCurrentHorizontalOrder(),
            supportedOperations: ['horizontal-insert', 'reset'],
            method: 'panel-insertion'
        };
    }

    /**
     * クリーンアップ
     */
    cleanup() {
        this.state = 'cleanup';
        console.log('🧹 PanelInserterクリーンアップ完了');
    }
}

export default PanelInserter;