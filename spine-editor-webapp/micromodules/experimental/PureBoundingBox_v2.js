/**
 * PureBoundingBox v2.0 - 瞬間移動問題解決版
 * 
 * 🎯 主な改良点
 * 1. 座標系の統一（相対座標で一貫計算）
 * 2. ドラッグ基準点の固定（startX/Yを更新しない）
 * 3. バウンディングボックスの初期位置計算改良
 * 4. より安全なイベント処理
 * 
 * 責務: Spineキャラクターのバウンディングボックス表示・ドラッグ操作専用
 * 入力: {targetElement: HTMLElement, initialBounds?: object}
 * 出力: {bounds: {x, y, width, height}, visible: boolean, dragState: object}
 */

class PureBoundingBox {
    constructor(input) {
        console.log('📦 PureBoundingBox v2.0: 初期化開始', input);
        
        // 入力検証
        this.validateInput(input);
        
        // 初期状態バックアップ
        this.initialState = {
            documentEvents: [],
            targetElementStyle: null
        };
        
        // 設定保存
        this.config = {
            targetElement: input.targetElement,
            initialBounds: input.initialBounds || null,
            minWidth: input.minWidth || 20,
            minHeight: input.minHeight || 20
        };
        
        // 内部状態初期化
        this.state = {
            visible: false,
            bounds: {x: 0, y: 0, width: 100, height: 100},
            originalBounds: null, // ドラッグ開始時の元の境界
            dragState: {
                isDragging: false,
                dragType: null, // 'move', 'resize-nw', etc.
                startMouseX: 0, // マウス開始位置（固定）
                startMouseY: 0,
                startBoundsX: 0, // バウンディングボックス開始位置（固定）
                startBoundsY: 0,
                startBoundsWidth: 0,
                startBoundsHeight: 0
            },
            elements: {
                container: null,
                handles: []
            }
        };
        
        // バインドしたイベントハンドラー
        this.boundHandlers = {
            mouseDown: this.onMouseDown.bind(this),
            mouseMove: this.onMouseMove.bind(this),
            mouseUp: this.onMouseUp.bind(this),
            touchStart: this.onTouchStart.bind(this),
            touchMove: this.onTouchMove.bind(this),
            touchEnd: this.onTouchEnd.bind(this)
        };
        
        console.log('✅ PureBoundingBox v2.0: 初期化完了');
    }
    
    validateInput(input) {
        if (!input?.targetElement || !(input.targetElement instanceof HTMLElement)) {
            throw new Error('PureBoundingBox: 有効なtargetElementが必要です');
        }
    }
    
    /**
     * バウンディングボックス実行
     */
    async execute(options = {}) {
        console.log('🎯 PureBoundingBox v2.0: 実行開始', options);
        
        try {
            // 初期状態バックアップ
            this.backupInitialState();
            
            // 初期バウンディングボックス計算
            this.calculateInitialBounds();
            
            // UI要素作成
            this.createBoundingElements();
            
            // イベントリスナー設定
            this.setupEventListeners();
            
            // 表示
            if (options.visible !== false) {
                this.show();
            }
            
            const result = this.getState();
            console.log('✅ PureBoundingBox v2.0: 実行完了', result);
            return result;
            
        } catch (error) {
            console.error('❌ PureBoundingBox v2.0: 実行エラー', error);
            this.cleanup();
            throw error;
        }
    }
    
    /**
     * 初期状態バックアップ
     */
    backupInitialState() {
        const element = this.config.targetElement;
        this.initialState.targetElementStyle = {
            userSelect: element.style.userSelect,
            cursor: element.style.cursor
        };
    }
    
    /**
     * 初期バウンディングボックス計算
     */
    calculateInitialBounds() {
        const element = this.config.targetElement;
        const rect = element.getBoundingClientRect();
        const parentRect = element.offsetParent?.getBoundingClientRect() || {left: 0, top: 0};
        
        // 設定値があればそれを使用、なければ要素の位置を使用
        if (this.config.initialBounds) {
            this.state.bounds = {...this.config.initialBounds};
        } else {
            // 親要素基準での相対位置を計算
            this.state.bounds = {
                x: rect.left - parentRect.left,
                y: rect.top - parentRect.top,
                width: rect.width,
                height: rect.height
            };
        }
        
        console.log('📏 初期バウンディングボックス計算完了', this.state.bounds);
    }
    
    /**
     * バウンディングボックス要素作成
     */
    createBoundingElements() {
        const bounds = this.state.bounds;
        const parentElement = this.config.targetElement.offsetParent || document.body;
        
        // コンテナ作成
        const container = document.createElement('div');
        container.className = 'pure-bounding-box-container';
        container.style.cssText = `
            position: absolute;
            left: ${bounds.x}px;
            top: ${bounds.y}px;
            width: ${bounds.width}px;
            height: ${bounds.height}px;
            border: 2px solid #ff6b6b;
            background: rgba(255, 107, 107, 0.1);
            pointer-events: none;
            z-index: 1000;
            display: none;
            box-sizing: border-box;
        `;
        
        // ハンドル情報
        const handleConfigs = [
            {type: 'nw', cursor: 'nw-resize', left: -4, top: -4},
            {type: 'n',  cursor: 'n-resize',  left: '50%', top: -4, transform: 'translateX(-50%)'},
            {type: 'ne', cursor: 'ne-resize', right: -4, top: -4},
            {type: 'e',  cursor: 'e-resize',  right: -4, top: '50%', transform: 'translateY(-50%)'},
            {type: 'se', cursor: 'se-resize', right: -4, bottom: -4},
            {type: 's',  cursor: 's-resize',  left: '50%', bottom: -4, transform: 'translateX(-50%)'},
            {type: 'sw', cursor: 'sw-resize', left: -4, bottom: -4},
            {type: 'w',  cursor: 'w-resize',  left: -4, top: '50%', transform: 'translateY(-50%)'}
        ];
        
        // ハンドル作成
        const handles = [];
        handleConfigs.forEach(config => {
            const handle = document.createElement('div');
            handle.className = `pure-handle pure-handle-${config.type}`;
            handle.setAttribute('data-resize-type', config.type);
            
            let handleStyle = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: #ff6b6b;
                border: 1px solid #fff;
                border-radius: 2px;
                cursor: ${config.cursor};
                pointer-events: all;
                z-index: 1;
            `;
            
            // 位置設定
            if (config.left !== undefined) handleStyle += `left: ${config.left}${typeof config.left === 'number' ? 'px' : ''};`;
            if (config.right !== undefined) handleStyle += `right: ${config.right}px;`;
            if (config.top !== undefined) handleStyle += `top: ${config.top}${typeof config.top === 'number' ? 'px' : ''};`;
            if (config.bottom !== undefined) handleStyle += `bottom: ${config.bottom}px;`;
            if (config.transform) handleStyle += `transform: ${config.transform};`;
            
            handle.style.cssText = handleStyle;
            container.appendChild(handle);
            
            handles.push({
                element: handle,
                type: config.type,
                cursor: config.cursor
            });
        });
        
        // 移動用領域（コンテナ全体）
        container.style.pointerEvents = 'all';
        container.style.cursor = 'move';
        
        // DOMに追加
        parentElement.appendChild(container);
        
        // 状態保存
        this.state.elements.container = container;
        this.state.elements.handles = handles;
        
        console.log('🎨 バウンディングボックス要素作成完了');
    }
    
    /**
     * イベントリスナー設定
     */
    setupEventListeners() {
        const container = this.state.elements.container;
        if (!container) return;
        
        // コンテナイベント（移動用）
        container.addEventListener('mousedown', this.boundHandlers.mouseDown);
        container.addEventListener('touchstart', this.boundHandlers.touchStart);
        
        // ドキュメントイベント（ドラッグ中の処理用）
        document.addEventListener('mousemove', this.boundHandlers.mouseMove);
        document.addEventListener('mouseup', this.boundHandlers.mouseUp);
        document.addEventListener('touchmove', this.boundHandlers.touchMove);
        document.addEventListener('touchend', this.boundHandlers.touchEnd);
        
        // ハンドル個別イベント
        this.state.elements.handles.forEach(handle => {
            handle.element.addEventListener('mousedown', this.boundHandlers.mouseDown);
            handle.element.addEventListener('touchstart', this.boundHandlers.touchStart);
        });
        
        console.log('🎮 イベントリスナー設定完了');
    }
    
    /**
     * マウスダウン処理
     */
    onMouseDown(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // ドラッグタイプ判定
        let dragType = 'move';
        if (event.target.classList.contains('pure-handle')) {
            dragType = 'resize-' + event.target.getAttribute('data-resize-type');
        }
        
        // マウス位置取得（ドキュメント基準）
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        
        // 現在のバウンディングボックス位置保存（ドラッグ開始時固定）
        const currentBounds = {...this.state.bounds};
        
        // ドラッグ状態設定
        this.state.dragState = {
            isDragging: true,
            dragType: dragType,
            startMouseX: mouseX,
            startMouseY: mouseY,
            startBoundsX: currentBounds.x,
            startBoundsY: currentBounds.y,
            startBoundsWidth: currentBounds.width,
            startBoundsHeight: currentBounds.height
        };
        
        console.log('🖱️ ドラッグ開始:', {
            type: dragType,
            mouse: {x: mouseX, y: mouseY},
            bounds: currentBounds
        });
    }
    
    /**
     * マウス移動処理
     */
    onMouseMove(event) {
        const dragState = this.state.dragState;
        if (!dragState.isDragging) return;
        
        event.preventDefault();
        
        // マウス移動量計算
        const deltaX = event.clientX - dragState.startMouseX;
        const deltaY = event.clientY - dragState.startMouseY;
        
        // 新しいバウンディングボックス計算
        let newBounds = {
            x: dragState.startBoundsX,
            y: dragState.startBoundsY,
            width: dragState.startBoundsWidth,
            height: dragState.startBoundsHeight
        };
        
        // ドラッグタイプに応じた計算
        switch (dragState.dragType) {
            case 'move':
                newBounds.x = dragState.startBoundsX + deltaX;
                newBounds.y = dragState.startBoundsY + deltaY;
                break;
                
            case 'resize-nw':
                newBounds.x = dragState.startBoundsX + deltaX;
                newBounds.y = dragState.startBoundsY + deltaY;
                newBounds.width = dragState.startBoundsWidth - deltaX;
                newBounds.height = dragState.startBoundsHeight - deltaY;
                break;
                
            case 'resize-n':
                newBounds.y = dragState.startBoundsY + deltaY;
                newBounds.height = dragState.startBoundsHeight - deltaY;
                break;
                
            case 'resize-ne':
                newBounds.y = dragState.startBoundsY + deltaY;
                newBounds.width = dragState.startBoundsWidth + deltaX;
                newBounds.height = dragState.startBoundsHeight - deltaY;
                break;
                
            case 'resize-e':
                newBounds.width = dragState.startBoundsWidth + deltaX;
                break;
                
            case 'resize-se':
                newBounds.width = dragState.startBoundsWidth + deltaX;
                newBounds.height = dragState.startBoundsHeight + deltaY;
                break;
                
            case 'resize-s':
                newBounds.height = dragState.startBoundsHeight + deltaY;
                break;
                
            case 'resize-sw':
                newBounds.x = dragState.startBoundsX + deltaX;
                newBounds.width = dragState.startBoundsWidth - deltaX;
                newBounds.height = dragState.startBoundsHeight + deltaY;
                break;
                
            case 'resize-w':
                newBounds.x = dragState.startBoundsX + deltaX;
                newBounds.width = dragState.startBoundsWidth - deltaX;
                break;
        }
        
        // 最小サイズ制限
        if (newBounds.width < this.config.minWidth) {
            if (dragState.dragType.includes('w')) {
                newBounds.x = dragState.startBoundsX + dragState.startBoundsWidth - this.config.minWidth;
            }
            newBounds.width = this.config.minWidth;
        }
        
        if (newBounds.height < this.config.minHeight) {
            if (dragState.dragType.includes('n')) {
                newBounds.y = dragState.startBoundsY + dragState.startBoundsHeight - this.config.minHeight;
            }
            newBounds.height = this.config.minHeight;
        }
        
        // バウンディングボックス更新
        this.updateBounds(newBounds);
    }
    
    /**
     * マウスアップ処理
     */
    onMouseUp(event) {
        const dragState = this.state.dragState;
        if (!dragState.isDragging) return;
        
        // ドラッグ終了
        this.state.dragState.isDragging = false;
        
        console.log('🖱️ ドラッグ終了:', {
            finalBounds: this.state.bounds
        });
    }
    
    /**
     * タッチイベント処理
     */
    onTouchStart(event) {
        if (event.touches.length !== 1) return;
        const touch = event.touches[0];
        this.onMouseDown({
            preventDefault: () => event.preventDefault(),
            stopPropagation: () => event.stopPropagation(),
            target: event.target,
            clientX: touch.clientX,
            clientY: touch.clientY
        });
    }
    
    onTouchMove(event) {
        if (event.touches.length !== 1) return;
        const touch = event.touches[0];
        this.onMouseMove({
            preventDefault: () => event.preventDefault(),
            clientX: touch.clientX,
            clientY: touch.clientY
        });
    }
    
    onTouchEnd(event) {
        this.onMouseUp({});
    }
    
    /**
     * バウンディングボックス更新
     */
    updateBounds(newBounds) {
        this.state.bounds = {...newBounds};
        
        const container = this.state.elements.container;
        if (container) {
            container.style.left = newBounds.x + 'px';
            container.style.top = newBounds.y + 'px';
            container.style.width = newBounds.width + 'px';
            container.style.height = newBounds.height + 'px';
        }
    }
    
    /**
     * 表示
     */
    show() {
        if (this.state.elements.container) {
            this.state.elements.container.style.display = 'block';
            this.state.visible = true;
            console.log('👁️ バウンディングボックス表示');
        }
    }
    
    /**
     * 非表示
     */
    hide() {
        if (this.state.elements.container) {
            this.state.elements.container.style.display = 'none';
            this.state.visible = false;
            console.log('🙈 バウンディングボックス非表示');
        }
    }
    
    /**
     * 状態取得
     */
    getState() {
        return {
            success: true,
            bounds: {...this.state.bounds},
            visible: this.state.visible,
            dragState: {
                isDragging: this.state.dragState.isDragging,
                dragType: this.state.dragState.dragType
            }
        };
    }
    
    /**
     * 完全クリーンアップ
     */
    cleanup() {
        console.log('🧹 PureBoundingBox v2.0: クリーンアップ開始');
        
        try {
            // DOM要素削除
            if (this.state.elements.container) {
                this.state.elements.container.remove();
            }
            
            // イベントリスナー削除
            document.removeEventListener('mousemove', this.boundHandlers.mouseMove);
            document.removeEventListener('mouseup', this.boundHandlers.mouseUp);
            document.removeEventListener('touchmove', this.boundHandlers.touchMove);
            document.removeEventListener('touchend', this.boundHandlers.touchEnd);
            
            // スタイル復元
            if (this.initialState.targetElementStyle && this.config.targetElement) {
                Object.assign(this.config.targetElement.style, this.initialState.targetElementStyle);
            }
            
            // 状態リセット
            this.state = {
                visible: false,
                bounds: {x: 0, y: 0, width: 100, height: 100},
                dragState: {isDragging: false, dragType: null, startMouseX: 0, startMouseY: 0},
                elements: {container: null, handles: []}
            };
            
            console.log('✅ PureBoundingBox v2.0: クリーンアップ完了');
            
        } catch (error) {
            console.error('❌ PureBoundingBox v2.0: クリーンアップエラー', error);
        }
    }
    
    /**
     * 単独テスト
     */
    static async test() {
        console.log('🧪 PureBoundingBox v2.0: テスト開始');
        
        try {
            // テスト用要素作成
            const testElement = document.createElement('div');
            testElement.style.cssText = `
                position: absolute;
                left: 200px;
                top: 150px;
                width: 150px;
                height: 100px;
                background: rgba(0, 150, 255, 0.3);
                border: 1px solid #0096ff;
            `;
            document.body.appendChild(testElement);
            
            // バウンディングボックス作成
            const boundingBox = new PureBoundingBox({
                targetElement: testElement,
                initialBounds: {x: 180, y: 130, width: 190, height: 140}
            });
            
            // 実行
            const result = await boundingBox.execute({visible: true});
            
            console.log('📊 テスト結果:', result);
            
            // 3秒後にクリーンアップ
            setTimeout(() => {
                boundingBox.cleanup();
                testElement.remove();
                console.log('🧪 テスト完了・要素削除');
            }, 3000);
            
            return {
                success: true,
                result: result,
                message: 'PureBoundingBox v2.0 テスト成功'
            };
            
        } catch (error) {
            console.error('❌ テストエラー:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// グローバルテスト用
if (typeof window !== 'undefined') {
    window.testPureBoundingBoxV2 = PureBoundingBox.test;
    window.PureBoundingBox = PureBoundingBox;
}