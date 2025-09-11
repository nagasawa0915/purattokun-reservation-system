/**
 * DropDetector.js - ドロップエリア検出マイクロモジュール
 * 
 * 🎯 責務：ドロップエリアの検出のみに専念
 * - マウス座標からドロップタイプを判定
 * - シンプルなデータ構造で結果を返す
 * - 複雑な処理は行わず、純粋関数として動作
 */
export class DropDetector {
    constructor(config = {}) {
        this.config = {
            edgeThreshold: config.edgeThreshold || 0.2,
            centerThreshold: config.centerThreshold || 0.6,
            borderTolerance: config.borderTolerance || 4,
            ...config
        };
    }

    /**
     * 🎯 ドロップエリア検出メイン関数
     */
    detectDropArea(mouseEvent, targetElement) {
        if (!targetElement) return null;

        const rect = targetElement.getBoundingClientRect();
        const x = mouseEvent.clientX - rect.left;
        const y = mouseEvent.clientY - rect.top;

        // 基本検出データ
        const dropData = {
            mouse: { x: mouseEvent.clientX, y: mouseEvent.clientY },
            target: {
                element: targetElement,
                rect: rect,
                id: targetElement.dataset.panel
            },
            relative: { x, y }
        };

        // ドロップタイプ判定
        const dropType = this.calculateDropType(x, y, rect.width, rect.height);
        
        return {
            ...dropData,
            type: dropType,
            timestamp: Date.now()
        };
    }

    /**
     * 📐 ドロップタイプ計算
     */
    calculateDropType(x, y, width, height) {
        const edgeW = width * this.config.edgeThreshold;
        const edgeH = height * this.config.edgeThreshold;
        const centerW = width * this.config.centerThreshold;
        const centerH = height * this.config.centerThreshold;
        const centerStartX = (width - centerW) / 2;
        const centerStartY = (height - centerH) / 2;

        // 辺エリア判定（優先度高）
        if (y <= edgeH) return 'top';
        if (x >= width - edgeW) return 'right';
        if (y >= height - edgeH) return 'bottom';
        if (x <= edgeW) return 'left';
        
        // 中央エリア判定
        if (x >= centerStartX && x <= centerStartX + centerW && 
            y >= centerStartY && y <= centerStartY + centerH) {
            return 'center';
        }

        return null;
    }

    /**
     * 🔍 境界線検出
     */
    detectBoundaryZone(mouseEvent, panelElements) {
        const mouseX = mouseEvent.clientX;
        const mouseY = mouseEvent.clientY;

        for (let i = 0; i < panelElements.length; i++) {
            for (let j = i + 1; j < panelElements.length; j++) {
                const panel1 = panelElements[i];
                const panel2 = panelElements[j];
                
                const boundary = this.calculateBoundaryLine(panel1, panel2);
                if (boundary && this.isMouseOnBoundary(mouseX, mouseY, boundary)) {
                    return boundary;
                }
            }
        }

        return null;
    }

    /**
     * 📏 境界線計算
     */
    calculateBoundaryLine(panel1, panel2) {
        const rect1 = panel1.getBoundingClientRect();
        const rect2 = panel2.getBoundingClientRect();
        const tolerance = this.config.borderTolerance;

        // 縦境界線検出（左右隣接）
        if (Math.abs(rect1.right - rect2.left) <= tolerance || 
            Math.abs(rect1.left - rect2.right) <= tolerance) {
            const borderX = Math.abs(rect1.right - rect2.left) <= tolerance ? 
                           (rect1.right + rect2.left) / 2 : 
                           (rect1.left + rect2.right) / 2;
            const topY = Math.max(rect1.top, rect2.top);
            const bottomY = Math.min(rect1.bottom, rect2.bottom);

            if (bottomY > topY) {
                return {
                    type: 'vertical',
                    x: borderX,
                    y1: topY,
                    y2: bottomY,
                    panels: [panel1, panel2]
                };
            }
        }

        // 横境界線検出（上下隣接）
        if (Math.abs(rect1.bottom - rect2.top) <= tolerance || 
            Math.abs(rect1.top - rect2.bottom) <= tolerance) {
            const borderY = Math.abs(rect1.bottom - rect2.top) <= tolerance ? 
                           (rect1.bottom + rect2.top) / 2 : 
                           (rect1.top + rect2.bottom) / 2;
            const leftX = Math.max(rect1.left, rect2.left);
            const rightX = Math.min(rect1.right, rect2.right);

            if (rightX > leftX) {
                return {
                    type: 'horizontal',
                    y: borderY,
                    x1: leftX,
                    x2: rightX,
                    panels: [panel1, panel2]
                };
            }
        }

        return null;
    }

    /**
     * 🎯 マウスが境界線上にあるかチェック
     */
    isMouseOnBoundary(mouseX, mouseY, boundary) {
        const tolerance = this.config.borderTolerance;

        if (boundary.type === 'vertical') {
            return Math.abs(mouseX - boundary.x) <= tolerance &&
                   mouseY >= boundary.y1 && mouseY <= boundary.y2;
        } else {
            return Math.abs(mouseY - boundary.y) <= tolerance &&
                   mouseX >= boundary.x1 && mouseX <= boundary.x2;
        }
    }
}

export default DropDetector;