/**
 * PureBoundingBoxBounds.js
 * 
 * 🎯 v2互換bounds座標系計算マイクロモジュール
 * - 外部依存: PureBoundingBoxCore（同フォルダ内）
 * - 責務: v2と同bounds計算ロジックのみ
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
        // handleTypeをクラスプロパティとして保存
        this.currentHandleType = handleType;
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
        
        // Shift: 等比スケール（辺ハンドル対応）
        if (dragState.modifierKeys.shift) {
            const aspectRatio = dragState.startBoundsWidth / dragState.startBoundsHeight;
            
            // ハンドルタイプを取得（クラスプロパティまたはdragTypeから）
            const currentHandle = this.currentHandleType || dragState.dragType.replace('resize-', '');
            
            if (currentHandle === 'n') {
                // 上辺ハンドル: 下辺を固定点として等比スケール
                const heightChange = dragState.startBoundsHeight - bounds.height;
                const newWidth = (dragState.startBoundsHeight - heightChange) * aspectRatio;
                const widthDiff = newWidth - dragState.startBoundsWidth;
                
                bounds.width = newWidth;
                bounds.x = dragState.startBoundsX - widthDiff / 2; // 中央揃え
                // yは既に計算済み（上辺ハンドルの動作）
                
            } else if (currentHandle === 's') {
                // 下辺ハンドル: 上辺を固定点として等比スケール
                const newWidth = bounds.height * aspectRatio;
                const widthDiff = newWidth - dragState.startBoundsWidth;
                
                bounds.width = newWidth;
                bounds.x = dragState.startBoundsX - widthDiff / 2; // 中央揃え
                // yは固定（上辺が固定点）
                bounds.y = dragState.startBoundsY;
                
            } else if (currentHandle === 'w') {
                // 左辺ハンドル: 右辺を固定点として等比スケール
                const widthChange = dragState.startBoundsWidth - bounds.width;
                const newHeight = (dragState.startBoundsWidth - widthChange) / aspectRatio;
                const heightDiff = newHeight - dragState.startBoundsHeight;
                
                bounds.height = newHeight;
                bounds.y = dragState.startBoundsY - heightDiff / 2; // 中央揃え
                // xは既に計算済み（左辺ハンドルの動作）
                
            } else if (currentHandle === 'e') {
                // 右辺ハンドル: 左辺を固定点として等比スケール
                const newHeight = bounds.width / aspectRatio;
                const heightDiff = newHeight - dragState.startBoundsHeight;
                
                bounds.height = newHeight;
                bounds.y = dragState.startBoundsY - heightDiff / 2; // 中央揃え
                // xは固定（左辺が固定点）
                bounds.x = dragState.startBoundsX;
                
            } else {
                // 角ハンドル: 従来通りの等比スケール
                const widthChange = Math.abs(bounds.width - dragState.startBoundsWidth);
                const heightChange = Math.abs(bounds.height - dragState.startBoundsHeight);
                
                if (widthChange > heightChange) {
                    const newHeight = bounds.width / aspectRatio;
                    if (bounds.y !== dragState.startBoundsY) {
                        bounds.y = dragState.startBoundsY + dragState.startBoundsHeight - newHeight;
                    }
                    bounds.height = newHeight;
                } else {
                    const newWidth = bounds.height * aspectRatio;
                    if (bounds.x !== dragState.startBoundsX) {
                        bounds.x = dragState.startBoundsX + dragState.startBoundsWidth - newWidth;
                    }
                    bounds.width = newWidth;
                }
            }
        }
        
        // Alt: 中心基準スケール
        if (dragState.modifierKeys.alt) {
            const centerX = dragState.startBoundsX + dragState.startBoundsWidth / 2;
            const centerY = dragState.startBoundsY + dragState.startBoundsHeight / 2;
            
            bounds.x = centerX - bounds.width / 2;
            bounds.y = centerY - bounds.height / 2;
        }
        
        // Ctrl: 精密調整モード（グリッドスナップ）
        if (dragState.modifierKeys.ctrl) {
            const gridSize = 10; // 10pxグリッド
            
            bounds.x = Math.round(bounds.x / gridSize) * gridSize;
            bounds.y = Math.round(bounds.y / gridSize) * gridSize;
            bounds.width = Math.round(bounds.width / gridSize) * gridSize;
            bounds.height = Math.round(bounds.height / gridSize) * gridSize;
        }
        
        // 🎯 併用処理: Shift + Alt（等比 + 中心固定）
        if (dragState.modifierKeys.shift && dragState.modifierKeys.alt) {
            // 既に両方の処理が適用されているため、追加処理は不要
            // ログで併用モードを記録
            console.log('🔧 併用モード: 等比 + 中心固定');
        }
        
        // 🎯 併用処理: Shift + Ctrl（等比 + グリッドスナップ）
        if (dragState.modifierKeys.shift && dragState.modifierKeys.ctrl) {
            console.log('🔧 併用モード: 等比 + グリッドスナップ');
        }
        
        // 🎯 併用処理: Alt + Ctrl（中心固定 + グリッドスナップ）
        if (dragState.modifierKeys.alt && dragState.modifierKeys.ctrl) {
            console.log('🔧 併用モード: 中心固定 + グリッドスナップ');
        }
        
        // 🎯 三重併用: Shift + Alt + Ctrl
        if (dragState.modifierKeys.shift && dragState.modifierKeys.alt && dragState.modifierKeys.ctrl) {
            console.log('🔧 三重併用モード: 等比 + 中心固定 + グリッドスナップ');
        }
        
        return bounds;
    }
    
    /**
     * boundsを要素に適用（従来システム完全互換版）
     */
    applyBoundsToElement(bounds) {
        const element = this.core.config.targetElement;
        if (!element) return;
        
        // 🎯 従来システム完全互換: 編集中は純粋px座標系で処理
        if (this.core.dragState.isDragging) {
            element.style.position = 'absolute';
            element.style.left = bounds.x + 'px';
            element.style.top = bounds.y + 'px';
            element.style.width = bounds.width + 'px';
            element.style.height = bounds.height + 'px';
            // transform は enterEditingMode() で元のまま維持
        }
        
        // coreの状態更新
        this.core.bounds = bounds;
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.PureBoundingBoxBounds = PureBoundingBoxBounds;
}