/**
 * UltraSimplePanelSwap.js - 究極にシンプルなパネル入れ替え
 * 設計思想: 最小限・確実・複雑化禁止
 */
export class UltraSimplePanelSwap {
    constructor() {
        this.state = 'ready';
        console.log('⚡ UltraSimplePanelSwap起動');
    }

    /**
     * 初期化
     */
    initialize() {
        console.log('⚡ 初期化開始');
        
        // ボタンで入れ替える方式（シンプル）
        this.addSwapButtons();
        
        console.log('✅ 初期化完了');
        return 4; // パネル数を返す
    }

    /**
     * 入れ替えボタンを追加
     */
    addSwapButtons() {
        // 既存のボタンがあれば削除
        const existingContainer = document.getElementById('ultra-simple-swap-buttons');
        if (existingContainer) {
            existingContainer.remove();
        }

        // ModularPanelSystem使用中はボタン非表示
        const useModularPanels = localStorage.getItem('spine-editor-use-modular-panels') === 'true';
        if (useModularPanels && typeof window.ModularPanelSystem !== 'undefined') {
            console.log('🚨 ModularPanelSystem有効 - UltraSimplePanelSwapボタン非表示');
            return;
        }

        // ボタンコンテナを作成
        const container = document.createElement('div');
        container.id = 'ultra-simple-swap-buttons';
        container.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            padding: 10px;
            border-radius: 5px;
            z-index: 9999;
        `;

        // 1↔2ボタン
        const button12 = document.createElement('button');
        button12.textContent = '1↔2';
        button12.style.cssText = 'margin: 2px; padding: 5px; background: #007acc; color: white; border: none; border-radius: 3px; cursor: pointer;';
        button12.onclick = () => this.swap12();

        // 1↔3ボタン
        const button13 = document.createElement('button');
        button13.textContent = '1↔3';
        button13.style.cssText = 'margin: 2px; padding: 5px; background: #007acc; color: white; border: none; border-radius: 3px; cursor: pointer;';
        button13.onclick = () => this.swap13();

        // リセットボタン
        const resetButton = document.createElement('button');
        resetButton.textContent = 'リセット';
        resetButton.style.cssText = 'margin: 2px; padding: 5px; background: #ff4757; color: white; border: none; border-radius: 3px; cursor: pointer;';
        resetButton.onclick = () => this.reset();

        container.appendChild(button12);
        container.appendChild(button13);
        container.appendChild(resetButton);
        document.body.appendChild(container);

        console.log('✅ 入れ替えボタン追加完了');
    }

    /**
     * 1↔2入れ替え
     */
    swap12() {
        console.log('🔄 1↔2入れ替え開始');
        this.swapPanelClasses('outliner', 'preview');
        console.log('✅ 1↔2入れ替え完了');
    }

    /**
     * 1↔3入れ替え
     */
    swap13() {
        console.log('🔄 1↔3入れ替え開始');
        this.swapPanelClasses('outliner', 'properties');
        console.log('✅ 1↔3入れ替え完了');
    }

    /**
     * パネルCSSクラスを入れ替える（核心機能）
     */
    swapPanelClasses(panelType1, panelType2) {
        const panel1 = document.querySelector(`.panel-${panelType1}`);
        const panel2 = document.querySelector(`.panel-${panelType2}`);

        if (!panel1 || !panel2) {
            console.error('❌ パネルが見つかりません:', panelType1, panelType2);
            return;
        }

        // CSSクラスを交換
        panel1.classList.remove(`panel-${panelType1}`);
        panel1.classList.add(`panel-${panelType2}`);
        
        panel2.classList.remove(`panel-${panelType2}`);
        panel2.classList.add(`panel-${panelType1}`);

        console.log(`🔄 ${panelType1} ↔ ${panelType2}`);
    }

    /**
     * リセット
     */
    reset() {
        console.log('🔄 リセット開始');
        
        const outliner = document.querySelector('[data-panel="outliner"]');
        const preview = document.querySelector('[data-panel="preview"]');
        const properties = document.querySelector('[data-panel="properties"]');
        const timeline = document.querySelector('[data-panel="timeline"]');

        if (outliner) {
            outliner.className = 'panel panel-outliner';
        }
        if (preview) {
            preview.className = 'panel panel-preview';
        }
        if (properties) {
            properties.className = 'panel panel-properties';
        }
        if (timeline) {
            timeline.className = 'panel panel-timeline';
        }

        console.log('✅ リセット完了');
    }

    /**
     * NewPanelSwapController互換メソッド
     */
    initializePanelGridAreas() {
        return this.reset();
    }

    /**
     * 状態取得
     */
    getDebugInfo() {
        return {
            state: this.state,
            method: 'ultra-simple-button'
        };
    }

    /**
     * クリーンアップ
     */
    cleanup() {
        const container = document.getElementById('ultra-simple-swap-buttons');
        if (container) {
            container.remove();
        }
        console.log('🧹 クリーンアップ完了');
    }
}

export default UltraSimplePanelSwap;