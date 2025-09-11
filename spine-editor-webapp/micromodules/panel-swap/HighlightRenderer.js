/**
 * HighlightRenderer.js - ハイライト表示マイクロモジュール
 * 
 * 🎯 責務：ドロップエリアのビジュアル表示のみに専念
 * - ハイライト要素の生成・管理
 * - 位置・スタイルの更新
 * - 表示・非表示の制御
 */
export class HighlightRenderer {
    constructor(config = {}) {
        this.config = {
            animationDuration: config.animationDuration || 200,
            highlightOpacity: config.highlightOpacity || 0.8,
            borderThickness: config.borderThickness || 40,
            boundaryThickness: config.boundaryThickness || 60,
            ...config
        };

        this.highlights = new Map();
        this.boundaryHighlights = new Map();
        
        this.initializeHighlights();
    }

    /**
     * 🎨 ハイライト要素初期化
     */
    initializeHighlights() {
        // 標準ドロップエリア用ハイライト
        const dropTypes = ['top', 'right', 'bottom', 'left', 'center'];
        dropTypes.forEach(type => {
            const element = this.createElement(type, this.getDropHighlightStyle(type));
            this.highlights.set(type, element);
        });

        // 境界線用ハイライト
        const boundaryTypes = ['vertical', 'horizontal'];
        boundaryTypes.forEach(type => {
            const element = this.createElement(`boundary-${type}`, this.getBoundaryHighlightStyle(type));
            this.boundaryHighlights.set(type, element);
        });

        console.log('🎨 ハイライト要素初期化完了');
    }

    /**
     * 🎨 ハイライト要素作成
     */
    createElement(type, style) {
        const element = document.createElement('div');
        element.className = `panel-highlight panel-highlight-${type}`;
        element.style.cssText = style;
        document.body.appendChild(element);
        return element;
    }

    /**
     * 🎨 ドロップハイライトスタイル
     */
    getDropHighlightStyle(type) {
        const baseStyle = `
            position: fixed;
            pointer-events: none;
            opacity: 0;
            transition: all ${this.config.animationDuration}ms ease;
            z-index: 1600;
            border-radius: 4px;
        `;

        const typeStyles = {
            'top': `
                background: rgba(0, 255, 136, 0.3);
                border: 2px solid #00ff88;
                border-bottom: 3px solid #00ff88;
            `,
            'right': `
                background: rgba(0, 122, 204, 0.3);
                border: 2px solid #007acc;
                border-left: 3px solid #007acc;
            `,
            'bottom': `
                background: rgba(255, 187, 0, 0.3);
                border: 2px solid #ffbb00;
                border-top: 3px solid #ffbb00;
            `,
            'left': `
                background: rgba(255, 107, 107, 0.3);
                border: 2px solid #ff6b6b;
                border-right: 3px solid #ff6b6b;
            `,
            'center': `
                background: rgba(138, 43, 226, 0.3);
                border: 2px solid #8a2be2;
            `
        };

        return baseStyle + typeStyles[type];
    }

    /**
     * 🎨 境界線ハイライトスタイル
     */
    getBoundaryHighlightStyle(type) {
        const baseStyle = `
            position: fixed;
            pointer-events: none;
            opacity: 0;
            transition: all ${this.config.animationDuration}ms ease;
            z-index: 1700;
            border-radius: 4px;
            animation: borderPulse 1.5s ease-in-out infinite;
        `;

        const boundaryStyles = {
            'vertical': `
                background: linear-gradient(180deg, 
                    rgba(0, 122, 204, 0.2) 0%, 
                    rgba(0, 122, 204, 0.8) 50%, 
                    rgba(0, 122, 204, 0.2) 100%);
                border: 3px solid #007acc;
                box-shadow: 0 0 15px rgba(0, 122, 204, 0.8);
            `,
            'horizontal': `
                background: linear-gradient(90deg, 
                    rgba(0, 122, 204, 0.2) 0%, 
                    rgba(0, 122, 204, 0.8) 50%, 
                    rgba(0, 122, 204, 0.2) 100%);
                border: 3px solid #007acc;
                box-shadow: 0 0 15px rgba(0, 122, 204, 0.8);
            `
        };

        return baseStyle + boundaryStyles[type];
    }

    /**
     * 🎯 ドロップエリアハイライト表示
     */
    showDropHighlight(dropArea) {
        this.hideAllHighlights();

        if (!dropArea || !dropArea.type) return;

        const highlight = this.highlights.get(dropArea.type);
        if (!highlight) return;

        this.positionDropHighlight(highlight, dropArea);
        highlight.style.opacity = this.config.highlightOpacity;

        console.log(`🎯 ドロップハイライト表示: ${dropArea.type}`);
    }

    /**
     * 🎯 境界線ハイライト表示
     */
    showBoundaryHighlight(boundary) {
        this.hideAllHighlights();

        if (!boundary || !boundary.type) return;

        const highlight = this.boundaryHighlights.get(boundary.type);
        if (!highlight) return;

        this.positionBoundaryHighlight(highlight, boundary);
        highlight.style.opacity = this.config.highlightOpacity;

        console.log(`🎯 境界線ハイライト表示: ${boundary.type}`);
    }

    /**
     * 📐 ドロップハイライト位置設定
     */
    positionDropHighlight(highlight, dropArea) {
        const rect = dropArea.target.rect;
        const thickness = this.config.borderThickness;

        switch (dropArea.type) {
            case 'top':
                highlight.style.left = `${rect.left}px`;
                highlight.style.top = `${rect.top}px`;
                highlight.style.width = `${rect.width}px`;
                highlight.style.height = `${thickness}px`;
                break;
                
            case 'right':
                highlight.style.left = `${rect.right - thickness}px`;
                highlight.style.top = `${rect.top}px`;
                highlight.style.width = `${thickness}px`;
                highlight.style.height = `${rect.height}px`;
                break;
                
            case 'bottom':
                highlight.style.left = `${rect.left}px`;
                highlight.style.top = `${rect.bottom - thickness}px`;
                highlight.style.width = `${rect.width}px`;
                highlight.style.height = `${thickness}px`;
                break;
                
            case 'left':
                highlight.style.left = `${rect.left}px`;
                highlight.style.top = `${rect.top}px`;
                highlight.style.width = `${thickness}px`;
                highlight.style.height = `${rect.height}px`;
                break;
                
            case 'center':
                const centerSize = 0.6;
                const centerWidth = rect.width * centerSize;
                const centerHeight = rect.height * centerSize;
                highlight.style.left = `${rect.left + (rect.width - centerWidth) / 2}px`;
                highlight.style.top = `${rect.top + (rect.height - centerHeight) / 2}px`;
                highlight.style.width = `${centerWidth}px`;
                highlight.style.height = `${centerHeight}px`;
                break;
        }
    }

    /**
     * 📐 境界線ハイライト位置設定
     */
    positionBoundaryHighlight(highlight, boundary) {
        const thickness = this.config.boundaryThickness;

        if (boundary.type === 'vertical') {
            highlight.style.left = `${boundary.x - thickness / 2}px`;
            highlight.style.top = `${boundary.y1}px`;
            highlight.style.width = `${thickness}px`;
            highlight.style.height = `${boundary.y2 - boundary.y1}px`;
        } else {
            highlight.style.left = `${boundary.x1}px`;
            highlight.style.top = `${boundary.y - thickness / 2}px`;
            highlight.style.width = `${boundary.x2 - boundary.x1}px`;
            highlight.style.height = `${thickness}px`;
        }
    }

    /**
     * 🚫 全ハイライト非表示
     */
    hideAllHighlights() {
        this.highlights.forEach(highlight => {
            highlight.style.opacity = '0';
        });
        
        this.boundaryHighlights.forEach(highlight => {
            highlight.style.opacity = '0';
        });
    }

    /**
     * 🧹 クリーンアップ
     */
    cleanup() {
        this.highlights.forEach(highlight => {
            if (highlight.parentNode) {
                highlight.parentNode.removeChild(highlight);
            }
        });

        this.boundaryHighlights.forEach(highlight => {
            if (highlight.parentNode) {
                highlight.parentNode.removeChild(highlight);
            }
        });

        this.highlights.clear();
        this.boundaryHighlights.clear();
        
        console.log('🧹 HighlightRenderer クリーンアップ完了');
    }
}

export default HighlightRenderer;