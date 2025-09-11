/**
 * BorderManager.js - 境界線管理マイクロモジュール
 * 
 * 🎯 責務：境界線ドロップゾーンの統合処理のみに専念
 * - 重複エリアの検出と統合
 * - 境界線優先度の判定
 * - シンプルな競合解決ロジック
 */
export class BorderManager {
    constructor(config = {}) {
        this.config = {
            borderPriority: config.borderPriority || true, // 境界線を通常エリアより優先
            conflictResolution: config.conflictResolution || 'boundary_first',
            ...config
        };
    }

    /**
     * 🔍 エリア競合の解決
     */
    resolveAreaConflict(dropArea, boundaryArea) {
        if (!dropArea && !boundaryArea) return null;
        
        // 境界線エリアが存在する場合は境界線を優先
        if (boundaryArea && this.config.borderPriority) {
            console.log(`🎯 境界線優先: ${boundaryArea.type} (通常エリア ${dropArea?.type || 'なし'} を無視)`);
            return {
                type: 'boundary',
                area: boundaryArea,
                reason: 'boundary_priority'
            };
        }

        // 通常のドロップエリアを返却
        if (dropArea) {
            console.log(`🎯 通常エリア: ${dropArea.type}`);
            return {
                type: 'drop',
                area: dropArea,
                reason: 'no_boundary_conflict'
            };
        }

        return null;
    }

    /**
     * 🔍 隣接判定による重複フィルタリング
     */
    filterAdjacentDuplicates(dropArea, adjacencyData) {
        if (!dropArea || !adjacencyData) return dropArea;

        const { type } = dropArea;
        const { draggedId, targetId, adjacentSides } = adjacencyData;

        // 隣接している辺のドロップエリアは境界線として扱うべき
        const isAdjacentSide = adjacentSides.includes(type);
        
        if (isAdjacentSide) {
            console.log(`🔍 隣接重複検出: ${draggedId} → ${targetId} の ${type} 辺は既に隣接済み`);
            return null; // 境界線として処理されるべきなので通常エリアは無効
        }

        return dropArea;
    }

    /**
     * 🎯 統合ハイライトデータ生成
     */
    createUnifiedHighlight(conflictResult) {
        if (!conflictResult) return null;

        const { type, area } = conflictResult;

        if (type === 'boundary') {
            return {
                type: 'boundary',
                highlightType: area.type, // 'vertical' or 'horizontal'
                position: area,
                style: 'boundary',
                unified: true
            };
        } else {
            return {
                type: 'drop',
                highlightType: area.type, // 'top', 'right', 'bottom', 'left', 'center'
                position: area,
                style: 'normal',
                unified: false
            };
        }
    }

    /**
     * 📏 隣接チェック（シンプル版）
     */
    checkAdjacency(draggedElement, targetElement) {
        if (!draggedElement || !targetElement) {
            return { adjacent: false, sides: [] };
        }

        const draggedRect = draggedElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const tolerance = 2; // ピクセル許容誤差

        const adjacentSides = [];

        // 各方向での隣接チェック
        if (Math.abs(draggedRect.bottom - targetRect.top) <= tolerance) {
            adjacentSides.push('bottom'); // draggedの下 = targetの上
        }
        if (Math.abs(draggedRect.right - targetRect.left) <= tolerance) {
            adjacentSides.push('right'); // draggedの右 = targetの左
        }
        if (Math.abs(draggedRect.top - targetRect.bottom) <= tolerance) {
            adjacentSides.push('top'); // draggedの上 = targetの下
        }
        if (Math.abs(draggedRect.left - targetRect.right) <= tolerance) {
            adjacentSides.push('left'); // draggedの左 = targetの右
        }

        return {
            adjacent: adjacentSides.length > 0,
            sides: adjacentSides,
            tolerance: tolerance
        };
    }

    /**
     * 🎨 境界線位置計算
     */
    calculateBoundaryPosition(boundary) {
        if (!boundary) return null;

        const { type, panels } = boundary;
        const [panel1, panel2] = panels;

        if (!panel1 || !panel2) return null;

        const rect1 = panel1.getBoundingClientRect();
        const rect2 = panel2.getBoundingClientRect();

        if (type === 'vertical') {
            // 縦境界線（左右隣接）
            const centerX = (rect1.right + rect2.left) / 2;
            const topY = Math.max(rect1.top, rect2.top);
            const bottomY = Math.min(rect1.bottom, rect2.bottom);

            return {
                type: 'vertical',
                x: centerX,
                y1: topY,
                y2: bottomY,
                width: 60, // 境界線の太さ
                height: bottomY - topY
            };
        } else {
            // 横境界線（上下隣接）
            const centerY = (rect1.bottom + rect2.top) / 2;
            const leftX = Math.max(rect1.left, rect2.left);
            const rightX = Math.min(rect1.right, rect2.right);

            return {
                type: 'horizontal',
                y: centerY,
                x1: leftX,
                x2: rightX,
                width: rightX - leftX,
                height: 60 // 境界線の太さ
            };
        }
    }

    /**
     * 📊 デバッグ情報
     */
    getDebugInfo() {
        return {
            config: this.config,
            conflictResolutionStrategy: this.config.conflictResolution,
            borderPriority: this.config.borderPriority
        };
    }
}

export default BorderManager;