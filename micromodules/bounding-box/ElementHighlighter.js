/**
 * ElementHighlighter.js
 * 
 * 🎯 F12風リアルタイム要素ハイライトシステム
 * - PureBoundingBox 2段階ピン設定システム Stage 1
 * - 責務: マウスホバーでの要素検出・ハイライト表示
 * - 外部依存: なし（純粋なDOM操作）
 */

class ElementHighlighter {
    constructor() {
        console.log('🎯 ElementHighlighter 初期化開始');
        
        // 状態管理
        this.isActive = false;
        this.currentTarget = null;
        this.onElementSelected = null;
        
        // UI要素
        this.highlightOverlay = null;
        this.infoTooltip = null;
        this.instructionPanel = null;
        
        // 設定
        this.config = {
            highlightColor: '#007bff',
            highlightOpacity: 0.15,
            borderWidth: 2,
            zIndex: 10001,
            excludeSelectors: [
                '.pure-bounding-box',
                '.bb-handle', 
                '.bb-container',
                '.bb-button',
                '[data-bb-exclude]'
            ]
        };
        
        // イベントハンドラーのバインド
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleElementClick = this.handleElementClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        
        console.log('✅ ElementHighlighter 初期化完了');
    }
    
    /**
     * 🎯 F12風ハイライトモード開始
     */
    startHighlightMode(callback) {
        console.log('🎯 F12風要素選択モード開始');
        
        if (this.isActive) {
            console.warn('⚠️ ハイライトモードは既にアクティブです');
            return false;
        }
        
        this.isActive = true;
        this.onElementSelected = callback;
        
        // UI要素作成
        this.createHighlightOverlay();
        this.createInfoTooltip();
        this.createInstructionPanel();
        
        // イベントリスナー登録
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('click', this.handleElementClick);
        document.addEventListener('keydown', this.handleKeyDown);
        
        // カーソルスタイル変更
        document.body.style.cursor = 'crosshair';
        
        console.log('✅ F12風要素選択モード アクティブ');
        return true;
    }
    
    /**
     * ハイライトモード終了
     */
    stopHighlightMode() {
        console.log('🔄 F12風要素選択モード終了');
        
        if (!this.isActive) {
            return false;
        }
        
        this.isActive = false;
        this.currentTarget = null;
        this.onElementSelected = null;
        
        // イベントリスナー削除
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('click', this.handleElementClick);
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // UI要素削除
        this.removeHighlightOverlay();
        this.removeInfoTooltip();
        this.removeInstructionPanel();
        
        // カーソル復元
        document.body.style.cursor = '';
        
        console.log('✅ F12風要素選択モード 非アクティブ');
        return true;
    }
    
    /**
     * マウス移動ハンドラー
     */
    handleMouseMove(event) {
        if (!this.isActive) return;
        
        const target = document.elementFromPoint(event.clientX, event.clientY);
        
        // 除外要素チェック
        if (this.shouldExcludeElement(target)) {
            this.hideHighlight();
            return;
        }
        
        // 同じ要素の場合はスキップ
        if (target === this.currentTarget) {
            return;
        }
        
        // 新しい要素のハイライト
        this.currentTarget = target;
        this.updateHighlight(target, event);
    }
    
    /**
     * 要素クリックハンドラー
     */
    handleElementClick(event) {
        if (!this.isActive) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        const target = this.currentTarget;
        
        if (!target || this.shouldExcludeElement(target)) {
            console.warn('⚠️ 無効な要素がクリックされました');
            return;
        }
        
        console.log('🎯 要素選択:', this.getElementInfo(target));
        
        // コールバック実行（確認ダイアログ処理）
        if (this.onElementSelected) {
            this.onElementSelected(target);
        }
        
        // 注意: ハイライトモード終了はElementSelectorの確認ダイアログ処理完了後に行われる
    }
    
    /**
     * キーボードハンドラー（Escapeで終了）
     */
    handleKeyDown(event) {
        if (!this.isActive) return;
        
        if (event.key === 'Escape') {
            console.log('🔄 Escapeキーで要素選択をキャンセル');
            this.stopHighlightMode();
        }
    }
    
    /**
     * ハイライト表示更新
     */
    updateHighlight(element, mouseEvent) {
        if (!element || !this.highlightOverlay) return;
        
        const rect = element.getBoundingClientRect();
        const scrollX = window.pageXOffset;
        const scrollY = window.pageYOffset;
        
        // ハイライト表示更新
        this.highlightOverlay.style.cssText = `
            position: fixed;
            left: ${rect.left}px;
            top: ${rect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            border: ${this.config.borderWidth}px solid ${this.config.highlightColor};
            background: ${this.config.highlightColor + Math.floor(this.config.highlightOpacity * 255).toString(16)};
            pointer-events: none;
            z-index: ${this.config.zIndex};
            transition: all 0.1s ease;
            display: block;
        `;
        
        // 要素情報ツールチップ更新
        this.updateInfoTooltip(element, mouseEvent);
    }
    
    /**
     * ハイライト非表示
     */
    hideHighlight() {
        if (this.highlightOverlay) {
            this.highlightOverlay.style.display = 'none';
        }
        if (this.infoTooltip) {
            this.infoTooltip.style.display = 'none';
        }
        this.currentTarget = null;
    }
    
    /**
     * 要素情報ツールチップ更新
     */
    updateInfoTooltip(element, mouseEvent) {
        if (!this.infoTooltip) return;
        
        const info = this.getElementInfo(element);
        
        this.infoTooltip.innerHTML = `
            <div class="element-info">
                <div class="tag-name">&lt;${info.tagName.toLowerCase()}&gt;</div>
                ${info.id ? `<div class="element-id">#${info.id}</div>` : ''}
                ${info.className ? `<div class="element-class">.${info.className}</div>` : ''}
                <div class="element-size">${info.width}×${info.height}</div>
            </div>
        `;
        
        // ツールチップ位置調整
        const tooltipX = mouseEvent.clientX + 10;
        const tooltipY = mouseEvent.clientY - 10;
        
        this.infoTooltip.style.cssText = `
            position: fixed;
            left: ${tooltipX}px;
            top: ${tooltipY}px;
            display: block;
            z-index: ${this.config.zIndex + 1};
            background: #333;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-family: monospace;
            pointer-events: none;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
    }
    
    /**
     * ハイライトオーバーレイ作成
     */
    createHighlightOverlay() {
        this.highlightOverlay = document.createElement('div');
        this.highlightOverlay.id = 'element-highlight-overlay';
        this.highlightOverlay.style.display = 'none';
        document.body.appendChild(this.highlightOverlay);
    }
    
    /**
     * 情報ツールチップ作成
     */
    createInfoTooltip() {
        this.infoTooltip = document.createElement('div');
        this.infoTooltip.id = 'element-info-tooltip';
        this.infoTooltip.style.display = 'none';
        document.body.appendChild(this.infoTooltip);
    }
    
    /**
     * 操作説明パネル作成
     */
    createInstructionPanel() {
        this.instructionPanel = document.createElement('div');
        this.instructionPanel.id = 'element-selection-instructions';
        this.instructionPanel.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #333;
                color: white;
                padding: 15px;
                border-radius: 8px;
                font-size: 14px;
                z-index: ${this.config.zIndex + 2};
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                max-width: 300px;
            ">
                <div style="font-weight: bold; margin-bottom: 8px;">🎯 要素選択モード</div>
                <div style="margin-bottom: 4px;">• マウスホバーで要素をハイライト</div>
                <div style="margin-bottom: 4px;">• クリックで要素を選択</div>
                <div style="color: #ffc107;">• Escapeキーでキャンセル</div>
            </div>
        `;
        document.body.appendChild(this.instructionPanel);
    }
    
    /**
     * ハイライトオーバーレイ削除
     */
    removeHighlightOverlay() {
        if (this.highlightOverlay) {
            this.highlightOverlay.remove();
            this.highlightOverlay = null;
        }
    }
    
    /**
     * 情報ツールチップ削除
     */
    removeInfoTooltip() {
        if (this.infoTooltip) {
            this.infoTooltip.remove();
            this.infoTooltip = null;
        }
    }
    
    /**
     * 操作説明パネル削除
     */
    removeInstructionPanel() {
        if (this.instructionPanel) {
            this.instructionPanel.remove();
            this.instructionPanel = null;
        }
    }
    
    /**
     * 除外要素チェック
     */
    shouldExcludeElement(element) {
        if (!element || element === document.body || element === document.documentElement) {
            return true;
        }
        
        // 除外セレクターチェック
        for (const selector of this.config.excludeSelectors) {
            if (element.matches && element.matches(selector)) {
                return true;
            }
            if (element.closest && element.closest(selector)) {
                return true;
            }
        }
        
        // 非表示要素チェック
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return true;
        }
        
        // サイズチェック（極小要素は除外）
        const rect = element.getBoundingClientRect();
        if (rect.width < 5 || rect.height < 5) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 要素情報取得
     */
    getElementInfo(element) {
        if (!element) return null;
        
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        
        return {
            tagName: element.tagName,
            id: element.id || null,
            className: element.className || null,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            hasBackground: computedStyle.backgroundImage !== 'none' || 
                          computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)',
            isVisible: rect.width > 0 && rect.height > 0,
            element: element
        };
    }
    
    /**
     * 現在の状態取得
     */
    getState() {
        return {
            isActive: this.isActive,
            currentTarget: this.currentTarget,
            hasCallback: !!this.onElementSelected
        };
    }
}

// グローバル公開
if (typeof window !== 'undefined') {
    window.ElementHighlighter = ElementHighlighter;
    console.log('✅ ElementHighlighter グローバル公開完了');
}

// AMD/CommonJS対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElementHighlighter;
}