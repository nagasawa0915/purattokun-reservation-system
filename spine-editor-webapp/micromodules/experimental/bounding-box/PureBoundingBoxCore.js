/**
 * PureBoundingBoxCore.js
 * 
 * 🎯 核心データ・状態管理マイクロモジュール
 * - 外部依存: なし
 * - 責務: データ構造・状態管理・基本計算のみ
 */

class PureBoundingBoxCore {
    constructor(config) {
        // 設定
        this.config = {
            targetElement: config.targetElement,
            nodeId: config.nodeId || 'bb-' + Date.now(),
            minWidth: config.minWidth || 20,
            minHeight: config.minHeight || 20
        };
        
        // 🎯 Transform座標系（通常時）
        this.transform = {
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            rotation: 0
        };
        
        // 🎯 Bounds座標系（編集時）
        this.bounds = {
            x: 0,
            y: 0,
            width: 100,
            height: 100
        };
        
        // スワップ状態
        this.swapState = {
            currentMode: 'idle', // 'idle' | 'editing'
            originalTransform: null
        };
        
        // ドラッグ状態
        this.dragState = {
            isDragging: false,
            dragType: null,
            startMouseX: 0,
            startMouseY: 0,
            startBoundsX: 0,
            startBoundsY: 0,
            startBoundsWidth: 0,
            startBoundsHeight: 0,
            modifierKeys: {shift: false, alt: false, ctrl: false}
        };
        
        // UI状態
        this.uiState = {
            visible: false,
            container: null,
            handles: []
        };
    }
    
    /**
     * 🎯 BB座標系スワップ: Transform → Bounds
     */
    enterEditingMode() {
        if (this.swapState.currentMode === 'editing') return;
        
        // 現在のTransformを保存
        this.swapState.originalTransform = {...this.transform};
        
        // v2正確パターン: 要素の現在のスタイル値からboundsを取得
        const element = this.config.targetElement;
        const computedStyle = window.getComputedStyle(element);
        
        this.bounds = {
            x: parseInt(computedStyle.left) || 0,
            y: parseInt(computedStyle.top) || 0,
            width: parseInt(computedStyle.width) || 100,
            height: parseInt(computedStyle.height) || 100
        };
        
        this.swapState.currentMode = 'editing';
        console.log('🔄 編集モード進入: Transform → Bounds');
    }
    
    /**
     * 🎯 BB座標系スワップ: Bounds → Transform
     */
    exitEditingMode() {
        if (this.swapState.currentMode === 'idle') return;
        
        // v2互換: boundsの結果をtransformに反映
        this.transform.x = this.bounds.x;
        this.transform.y = this.bounds.y;
        
        // 要素のスタイルを最終的な位置に更新
        const element = this.config.targetElement;
        element.style.left = this.bounds.x + 'px';
        element.style.top = this.bounds.y + 'px';
        element.style.width = this.bounds.width + 'px';
        element.style.height = this.bounds.height + 'px';
        
        this.swapState.currentMode = 'idle';
        this.swapState.originalTransform = null;
        console.log('🔄 編集モード終了: Bounds → Transform');
    }
    
    /**
     * ドラッグ開始データ保存
     */
    startDrag(event, dragType) {
        const currentBounds = {...this.bounds};
        
        this.dragState = {
            isDragging: true,
            dragType: dragType,
            startMouseX: event.clientX,
            startMouseY: event.clientY,
            startBoundsX: currentBounds.x,
            startBoundsY: currentBounds.y,
            startBoundsWidth: currentBounds.width,
            startBoundsHeight: currentBounds.height,
            modifierKeys: {
                shift: event.shiftKey,
                alt: event.altKey,
                ctrl: event.ctrlKey
            }
        };
    }
    
    /**
     * ドラッグ終了
     */
    endDrag() {
        this.dragState.isDragging = false;
    }
    
    /**
     * 修飾キー更新
     */
    updateModifierKeys(event) {
        if (this.dragState.isDragging) {
            this.dragState.modifierKeys.shift = event.shiftKey;
            this.dragState.modifierKeys.alt = event.altKey;
            this.dragState.modifierKeys.ctrl = event.ctrlKey;
        }
    }
    
    /**
     * 状態情報取得
     */
    getState() {
        return {
            config: {...this.config},
            transform: {...this.transform},
            bounds: {...this.bounds},
            swapState: {...this.swapState},
            dragState: {...this.dragState},
            uiState: {
                visible: this.uiState.visible,
                hasContainer: !!this.uiState.container
            }
        };
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.PureBoundingBoxCore = PureBoundingBoxCore;
}