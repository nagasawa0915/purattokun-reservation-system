/**
 * PureBoundingBoxEvents.js
 * 
 * 🎯 マウス・キーボードイベント処理マイクロモジュール
 * - 外部依存: PureBoundingBoxCore, PureBoundingBoxBounds, PureBoundingBoxUI（同フォルダ内）
 * - 責務: イベントハンドリング・ユーザー操作処理のみ
 */

class PureBoundingBoxEvents {
    constructor(core, bounds, ui) {
        this.core = core;
        this.bounds = bounds;
        this.ui = ui;
        
        // イベントハンドラをバインド
        this.boundHandlers = {
            mouseDown: this.onMouseDown.bind(this),
            mouseMove: this.onMouseMove.bind(this),
            mouseUp: this.onMouseUp.bind(this),
            keyDown: this.onKeyDown.bind(this),
            keyUp: this.onKeyUp.bind(this)
        };
    }
    
    /**
     * イベントリスナー登録
     */
    attachEvents() {
        if (!this.core.uiState.container) return;
        
        this.core.uiState.container.addEventListener('mousedown', this.boundHandlers.mouseDown);
        console.log('📡 イベント登録完了');
    }
    
    /**
     * イベントリスナー削除
     */
    detachEvents() {
        if (this.core.uiState.container) {
            this.core.uiState.container.removeEventListener('mousedown', this.boundHandlers.mouseDown);
        }
        
        // ドキュメントレベルのイベントも削除
        document.removeEventListener('mousemove', this.boundHandlers.mouseMove);
        document.removeEventListener('mouseup', this.boundHandlers.mouseUp);
        document.removeEventListener('keydown', this.boundHandlers.keyDown);
        document.removeEventListener('keyup', this.boundHandlers.keyUp);
    }
    
    /**
     * マウスダウン
     */
    onMouseDown(event) {
        event.preventDefault();
        
        if (!this.ui.isHandle(event.target)) return;
        
        const handleType = this.ui.getHandleType(event.target);
        
        // 🎯 BB座標系スワップ: 編集モード進入
        this.core.enterEditingMode();
        
        // ドラッグ開始
        this.core.startDrag(event, handleType === 'move' ? 'move' : `resize-${handleType}`);
        
        // ドキュメントレベルでイベント監視
        document.addEventListener('mousemove', this.boundHandlers.mouseMove);
        document.addEventListener('mouseup', this.boundHandlers.mouseUp);
        document.addEventListener('keydown', this.boundHandlers.keyDown);
        document.addEventListener('keyup', this.boundHandlers.keyUp);
        
        console.log('📡 イベント登録完了');
    }
    
    /**
     * マウス移動
     */
    onMouseMove(event) {
        if (!this.core.dragState.isDragging) return;
        
        event.preventDefault();
        
        const deltaX = event.clientX - this.core.dragState.startMouseX;
        const deltaY = event.clientY - this.core.dragState.startMouseY;
        
        let newBounds;
        
        if (this.core.dragState.dragType === 'move') {
            // 🎯 v2互換: 移動計算
            newBounds = this.bounds.calculateMove(deltaX, deltaY);
        } else if (this.core.dragState.dragType.startsWith('resize-')) {
            // 🎯 v2互換: リサイズ計算
            const handleType = this.core.dragState.dragType.replace('resize-', '');
            newBounds = this.bounds.calculateResize(deltaX, deltaY, handleType);
            
            // 修飾キー適用
            newBounds = this.bounds.applyModifierKeys(newBounds);
        }
        
        if (newBounds) {
            // boundsを要素に適用
            this.bounds.applyBoundsToElement(newBounds);
            
            // UI位置同期
            this.ui.syncPosition();
        }
    }
    
    /**
     * マウスアップ
     */
    onMouseUp(event) {
        if (!this.core.dragState.isDragging) return;
        
        // ドラッグ終了
        this.core.endDrag();
        
        // 🎯 BB座標系スワップ: 編集モード終了
        this.core.exitEditingMode();
        
        // ドキュメントレベルのイベント削除
        document.removeEventListener('mousemove', this.boundHandlers.mouseMove);
        document.removeEventListener('mouseup', this.boundHandlers.mouseUp);
        document.removeEventListener('keydown', this.boundHandlers.keyDown);
        document.removeEventListener('keyup', this.boundHandlers.keyUp);
        
        console.log('🖱️ ドラッグ終了');
    }
    
    /**
     * キーダウン
     */
    onKeyDown(event) {
        this.core.updateModifierKeys(event);
    }
    
    /**
     * キーアップ  
     */
    onKeyUp(event) {
        this.core.updateModifierKeys(event);
    }
    
    /**
     * タッチイベント対応
     */
    attachTouchEvents() {
        if (!this.core.uiState.container) return;
        
        this.core.uiState.container.addEventListener('touchstart', (event) => {
            const touch = event.touches[0];
            this.onMouseDown({
                target: event.target,
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => event.preventDefault()
            });
        });
        
        document.addEventListener('touchmove', (event) => {
            if (!this.core.dragState.isDragging) return;
            const touch = event.touches[0];
            this.onMouseMove({
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => event.preventDefault()
            });
        });
        
        document.addEventListener('touchend', (event) => {
            if (!this.core.dragState.isDragging) return;
            this.onMouseUp({});
        });
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.PureBoundingBoxEvents = PureBoundingBoxEvents;
}