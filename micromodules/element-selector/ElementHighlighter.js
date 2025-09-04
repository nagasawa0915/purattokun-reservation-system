/**
 * ElementHighlighter.js
 * 
 * 🎯 2段階ピン設定UI - Stage 1: F12風要素選択システム
 * - 責務: リアルタイム要素ハイライト・選択UI
 * - 戦略: Chrome DevToolsライクな直感的操作
 * - 目標: ユーザーフレンドリーな要素選択体験
 */

class ElementHighlighter {
    constructor() {
        console.log('🎯 ElementHighlighter 初期化開始');
        
        // ハイライト状態管理
        this.isHighlighting = false;
        this.currentHighlightedElement = null;
        this.highlightOverlay = null;
        
        // F12風スタイル設定
        this.highlightStyle = {
            border: '2px solid #007acc',
            backgroundColor: 'rgba(0, 122, 204, 0.1)',
            zIndex: 10000,
            pointerEvents: 'none',
            position: 'absolute',
            boxShadow: '0 0 10px rgba(0, 122, 204, 0.5)',
            borderRadius: '2px'
        };
        
        // 除外要素（ハイライト対象外）
        this.excludedElements = [
            'html', 'body', 'head', 'script', 'style', 'meta', 'link'
        ];
        
        // イベントハンドラー
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        
        // コールバック
        this.onElementSelected = null;
        
        this.initializeOverlay();
        console.log('✅ ElementHighlighter 初期化完了');
    }
    
    /**
     * 🏗️ ハイライトオーバーレイ初期化
     */
    initializeOverlay() {
        this.highlightOverlay = document.createElement('div');
        this.highlightOverlay.id = 'element-highlight-overlay';
        this.highlightOverlay.style.cssText = `
            position: absolute;
            pointer-events: none;
            z-index: 10000;
            border: 2px solid #007acc;
            background-color: rgba(0, 122, 204, 0.1);
            box-shadow: 0 0 10px rgba(0, 122, 204, 0.5);
            border-radius: 2px;
            transition: all 0.1s ease-out;
            display: none;
        `;
        
        document.body.appendChild(this.highlightOverlay);
        
        // 情報表示ツールチップ
        this.createInfoTooltip();
    }
    
    /**
     * 🏷️ 情報表示ツールチップ作成
     */
    createInfoTooltip() {
        this.infoTooltip = document.createElement('div');
        this.infoTooltip.id = 'element-info-tooltip';
        this.infoTooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 12px;
            line-height: 1.4;
            z-index: 10001;
            pointer-events: none;
            white-space: nowrap;
            display: none;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(this.infoTooltip);
    }
    
    /**
     * 🎯 ハイライトモード開始
     */
    startHighlighting(callback) {
        if (this.isHighlighting) {
            console.warn('⚠️ ハイライトモードは既に開始されています');
            return;
        }
        
        console.log('🎯 F12風要素選択モード開始');
        
        this.isHighlighting = true;
        this.onElementSelected = callback;
        
        // イベントリスナー追加
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('click', this.handleClick, true);
        document.addEventListener('keydown', this.handleKeydown);
        
        // カーソル変更
        document.body.style.cursor = 'crosshair';
        
        // 操作ガイド表示
        this.showOperationGuide();
    }
    
    /**
     * 🛑 ハイライトモード停止
     */
    stopHighlighting() {
        if (!this.isHighlighting) {
            return;
        }
        
        console.log('🛑 F12風要素選択モード停止');
        
        this.isHighlighting = false;
        this.onElementSelected = null;
        
        // イベントリスナー削除
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('click', this.handleClick, true);
        document.removeEventListener('keydown', this.handleKeydown);
        
        // ハイライト解除
        this.hideHighlight();
        
        // カーソル復元
        document.body.style.cursor = '';
        
        // 操作ガイド非表示
        this.hideOperationGuide();
    }
    
    /**
     * 🖱️ マウス移動ハンドラー
     */
    handleMouseMove(event) {
        if (!this.isHighlighting) return;
        
        const element = document.elementFromPoint(event.clientX, event.clientY);
        
        if (element && this.isValidTarget(element)) {
            this.highlightElement(element, event.clientX, event.clientY);
        }
    }
    
    /**
     * 🖱️ クリックハンドラー
     */
    handleClick(event) {
        if (!this.isHighlighting) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        const element = document.elementFromPoint(event.clientX, event.clientY);
        
        if (element && this.isValidTarget(element)) {
            console.log('✅ 要素選択:', this.getElementInfo(element));
            
            // 選択エフェクト
            this.showSelectionEffect(element);
            
            // コールバック実行
            if (this.onElementSelected) {
                this.onElementSelected(element);
            }
            
            // ハイライトモード停止
            this.stopHighlighting();
        }
    }
    
    /**
     * ⌨️ キーボードハンドラー
     */
    handleKeydown(event) {
        if (!this.isHighlighting) return;
        
        // Escapeキーで終了
        if (event.key === 'Escape') {
            event.preventDefault();
            console.log('🔄 要素選択をキャンセル');
            this.stopHighlighting();
        }
    }
    
    /**
     * ✨ 要素ハイライト表示
     */
    highlightElement(element, mouseX, mouseY) {
        if (this.currentHighlightedElement === element) return;
        
        this.currentHighlightedElement = element;
        
        const rect = element.getBoundingClientRect();
        const scrollX = window.pageXOffset;
        const scrollY = window.pageYOffset;
        
        // ハイライトオーバーレイ位置調整
        this.highlightOverlay.style.cssText = `
            position: absolute;
            left: ${rect.left + scrollX}px;
            top: ${rect.top + scrollY}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            border: 2px solid #007acc;
            background-color: rgba(0, 122, 204, 0.1);
            box-shadow: 0 0 10px rgba(0, 122, 204, 0.5);
            border-radius: 2px;
            pointer-events: none;
            z-index: 10000;
            display: block;
            transition: all 0.1s ease-out;
        `;
        
        // 情報ツールチップ表示
        this.showElementInfo(element, mouseX, mouseY);
    }
    
    /**
     * 🏷️ 要素情報表示
     */
    showElementInfo(element, mouseX, mouseY) {
        const info = this.getElementInfo(element);
        const rect = element.getBoundingClientRect();
        
        this.infoTooltip.innerHTML = `
            <div><strong>${info.tagName}</strong>${info.id ? `#${info.id}` : ''}${info.className ? `.${info.className.split(' ').join('.')}` : ''}</div>
            <div>サイズ: ${Math.round(rect.width)}×${Math.round(rect.height)}px</div>
            <div>位置: (${Math.round(rect.left)}, ${Math.round(rect.top)})</div>
        `;
        
        // ツールチップ位置調整（画面外に出ないように）
        let tooltipX = mouseX + 10;
        let tooltipY = mouseY - 40;
        
        if (tooltipX + 200 > window.innerWidth) {
            tooltipX = mouseX - 210;
        }
        if (tooltipY < 0) {
            tooltipY = mouseY + 20;
        }
        
        this.infoTooltip.style.left = `${tooltipX}px`;
        this.infoTooltip.style.top = `${tooltipY}px`;
        this.infoTooltip.style.display = 'block';
    }
    
    /**
     * 🎨 選択エフェクト表示
     */
    showSelectionEffect(element) {
        const rect = element.getBoundingClientRect();
        const scrollX = window.pageXOffset;
        const scrollY = window.pageYOffset;
        
        // 選択エフェクト要素作成
        const selectionEffect = document.createElement('div');
        selectionEffect.style.cssText = `
            position: absolute;
            left: ${rect.left + scrollX}px;
            top: ${rect.top + scrollY}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            border: 3px solid #00ff00;
            background-color: rgba(0, 255, 0, 0.2);
            pointer-events: none;
            z-index: 10002;
            animation: selectionPulse 0.6s ease-out;
            border-radius: 4px;
        `;
        
        // アニメーション用CSS追加
        if (!document.getElementById('selection-animation-styles')) {
            const styles = document.createElement('style');
            styles.id = 'selection-animation-styles';
            styles.textContent = `
                @keyframes selectionPulse {
                    0% { 
                        transform: scale(1); 
                        opacity: 1; 
                        border-width: 3px; 
                    }
                    50% { 
                        transform: scale(1.05); 
                        opacity: 0.8; 
                        border-width: 5px; 
                    }
                    100% { 
                        transform: scale(1); 
                        opacity: 0; 
                        border-width: 2px; 
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(selectionEffect);
        
        // アニメーション後に削除
        setTimeout(() => {
            if (selectionEffect.parentNode) {
                selectionEffect.parentNode.removeChild(selectionEffect);
            }
        }, 600);
    }
    
    /**
     * 🚫 ハイライト非表示
     */
    hideHighlight() {
        this.highlightOverlay.style.display = 'none';
        this.infoTooltip.style.display = 'none';
        this.currentHighlightedElement = null;
    }
    
    /**
     * ✅ 有効な選択対象かチェック
     */
    isValidTarget(element) {
        if (!element) return false;
        
        const tagName = element.tagName.toLowerCase();
        
        // 除外要素チェック
        if (this.excludedElements.includes(tagName)) {
            return false;
        }
        
        // ハイライト関連要素を除外
        if (element.id === 'element-highlight-overlay' || 
            element.id === 'element-info-tooltip' ||
            element.id === 'operation-guide') {
            return false;
        }
        
        // 非表示要素を除外
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') {
            return false;
        }
        
        return true;
    }
    
    /**
     * 🔍 要素情報取得
     */
    getElementInfo(element) {
        return {
            tagName: element.tagName,
            id: element.id || '',
            className: element.className || '',
            textContent: element.textContent ? element.textContent.substring(0, 50) : '',
            hasBackground: this.hasBackgroundImage(element)
        };
    }
    
    /**
     * 🖼️ 背景画像有無チェック
     */
    hasBackgroundImage(element) {
        const style = window.getComputedStyle(element);
        return style.backgroundImage && style.backgroundImage !== 'none';
    }
    
    /**
     * 📋 操作ガイド表示
     */
    showOperationGuide() {
        if (document.getElementById('operation-guide')) return;
        
        const guide = document.createElement('div');
        guide.id = 'operation-guide';
        guide.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 13px;
            line-height: 1.5;
            z-index: 10003;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        guide.innerHTML = `
            <div><strong>🎯 要素選択モード</strong></div>
            <div>• マウス移動でハイライト</div>
            <div>• クリックで要素選択</div>
            <div>• <kbd>Esc</kbd>キーで終了</div>
        `;
        
        document.body.appendChild(guide);
    }
    
    /**
     * 🚫 操作ガイド非表示
     */
    hideOperationGuide() {
        const guide = document.getElementById('operation-guide');
        if (guide) {
            guide.remove();
        }
    }
    
    /**
     * 🧹 クリーンアップ
     */
    destroy() {
        this.stopHighlighting();
        
        // DOM要素削除
        if (this.highlightOverlay && this.highlightOverlay.parentNode) {
            this.highlightOverlay.parentNode.removeChild(this.highlightOverlay);
        }
        if (this.infoTooltip && this.infoTooltip.parentNode) {
            this.infoTooltip.parentNode.removeChild(this.infoTooltip);
        }
        
        // スタイル削除
        const styles = document.getElementById('selection-animation-styles');
        if (styles) {
            styles.remove();
        }
        
        console.log('🧹 ElementHighlighter クリーンアップ完了');
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