/**
 * PureBoundingBoxBounds.js
 * 
 * 🎯 v2互換bounds座標系計算マイクロモジュール
 * - 外部依存: PureBoundingBoxCore（同フォルダ内）
 * - 責務: v2と同じbounds計算ロジックのみ
 */

class PureBoundingBoxBounds {
    constructor(core) {
        this.core = core;
    }
    
    /**
     * 🎯 v2完全互換: 移動計算
     */
    calculateMove(deltaX, deltaY) {
        const dragState = this.core.dragState;
        
        const newBounds = {
            x: dragState.startBoundsX + deltaX,
            y: dragState.startBoundsY + deltaY,
            width: dragState.startBoundsWidth,
            height: dragState.startBoundsHeight
        };
        
        return newBounds;
    }
    
    /**
     * 🎯 v2完全互換: リサイズ計算
     */
    calculateResize(deltaX, deltaY, handleType) {
        const dragState = this.core.dragState;
        
        let newBounds = {
            x: dragState.startBoundsX,
            y: dragState.startBoundsY,
            width: dragState.startBoundsWidth,
            height: dragState.startBoundsHeight
        };
        
        // v2完全互換の計算式
        switch (handleType) {
            case 'nw':
                newBounds.x = dragState.startBoundsX + deltaX;
                newBounds.y = dragState.startBoundsY + deltaY;
                newBounds.width = dragState.startBoundsWidth - deltaX;
                newBounds.height = dragState.startBoundsHeight - deltaY;
                break;
            case 'ne':
                newBounds.y = dragState.startBoundsY + deltaY;
                newBounds.width = dragState.startBoundsWidth + deltaX;
                newBounds.height = dragState.startBoundsHeight - deltaY;
                break;
            case 'se':
                newBounds.width = dragState.startBoundsWidth + deltaX;
                newBounds.height = dragState.startBoundsHeight + deltaY;
                break;
            case 'sw':
                newBounds.x = dragState.startBoundsX + deltaX;
                newBounds.width = dragState.startBoundsWidth - deltaX;
                newBounds.height = dragState.startBoundsHeight + deltaY;
                break;
            case 'n':
                newBounds.y = dragState.startBoundsY + deltaY;
                newBounds.height = dragState.startBoundsHeight - deltaY;
                break;
            case 's':
                newBounds.height = dragState.startBoundsHeight + deltaY;
                break;
            case 'w':
                newBounds.x = dragState.startBoundsX + deltaX;
                newBounds.width = dragState.startBoundsWidth - deltaX;
                break;
            case 'e':
                newBounds.width = dragState.startBoundsWidth + deltaX;
                break;
        }
        
        // v2互換: 最小サイズ制限
        newBounds = this.applyMinSizeConstraints(newBounds, handleType);
        
        return newBounds;
    }
    
    /**
     * v2互換: 最小サイズ制限適用
     */
    applyMinSizeConstraints(bounds, handleType) {
        const dragState = this.core.dragState;
        const config = this.core.config;
        
        if (bounds.width < config.minWidth) {
            if (handleType && handleType.includes('w')) {
                bounds.x = dragState.startBoundsX + dragState.startBoundsWidth - config.minWidth;
            }
            bounds.width = config.minWidth;
        }
        
        if (bounds.height < config.minHeight) {
            if (handleType && handleType.includes('n')) {
                bounds.y = dragState.startBoundsY + dragState.startBoundsHeight - config.minHeight;
            }
            bounds.height = config.minHeight;
        }
        
        return bounds;
    }
    
    /**
     * 修飾キー対応（Shift: 等比、Alt: 中心基準）
     */
    applyModifierKeys(bounds) {
        const dragState = this.core.dragState;
        
        // Shift: 等比スケール
        if (dragState.modifierKeys.shift) {
            const aspectRatio = dragState.startBoundsWidth / dragState.startBoundsHeight;
            
            // より大きな変化を基準とする
            const widthChange = Math.abs(bounds.width - dragState.startBoundsWidth);
            const heightChange = Math.abs(bounds.height - dragState.startBoundsHeight);
            
            if (widthChange > heightChange) {
                bounds.height = bounds.width / aspectRatio;
            } else {
                bounds.width = bounds.height * aspectRatio;
            }
        }
        
        // Alt: 中心基準スケール
        if (dragState.modifierKeys.alt) {
            const centerX = dragState.startBoundsX + dragState.startBoundsWidth / 2;
            const centerY = dragState.startBoundsY + dragState.startBoundsHeight / 2;
            
            bounds.x = centerX - bounds.width / 2;
            bounds.y = centerY - bounds.height / 2;
        }
        
        return bounds;
    }
    
    /**
     * boundsを要素に適用
     */
    applyBoundsToElement(bounds) {
        const element = this.core.config.targetElement;
        if (!element) return;
        
        element.style.position = 'absolute';
        element.style.left = bounds.x + 'px';
        element.style.top = bounds.y + 'px';
        element.style.width = bounds.width + 'px';
        element.style.height = bounds.height + 'px';
        
        // coreの状態更新
        this.core.bounds = bounds;
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.PureBoundingBoxBounds = PureBoundingBoxBounds;
}