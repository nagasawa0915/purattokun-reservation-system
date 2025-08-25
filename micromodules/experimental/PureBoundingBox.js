/**
 * PureBoundingBox - v4マイクロモジュール設計
 * 
 * 🎯 絶対ルール
 * 1. 外部依存ゼロ（他モジュール・グローバル変数禁止）
 * 2. 単一責務のみ：バウンディングボックス表示・基本ドラッグ専用
 * 3. cleanup()で完全復元保証
 * 4. 数値・オブジェクトのみで他モジュールと通信
 * 
 * 責務: Spineキャラクターのバウンディングボックス表示・ドラッグ操作専用
 * 入力: {canvasElement: HTMLCanvasElement, spineData: object, position: object}
 * 出力: {bounds: {x, y, width, height}, visible: boolean, dragState: object}
 * 
 * 禁止事項:
 * - 他モジュールへの直接参照禁止
 * - グローバル変数への依存禁止
 * - Spineデータの直接操作禁止
 * - 状態の永続化禁止
 */

class PureBoundingBox {
    constructor(input) {
        console.log('📦 PureBoundingBox: コンストラクタ開始', input);
        
        // 入力検証
        this.validateInput(input);
        
        // 初期状態バックアップ（外部依存なし）
        this.initialState = {
            canvasStyle: null,
            documentEvents: []
        };
        
        // 内部状態初期化（数値・オブジェクトのみ）
        this.config = {
            canvasElement: input.canvasElement,
            spineData: input.spineData,
            position: input.position || {x: 0, y: 0, width: 100, height: 100}
        };
        
        this.boundingState = {
            visible: false,
            bounds: {x: 0, y: 0, width: 0, height: 0},
            dragState: {
                isDragging: false,
                startX: 0,
                startY: 0,
                currentX: 0,
                currentY: 0
            },
            handles: [],
            boundingElement: null
        };
        
        // イベントハンドラーを保存（cleanup用）
        this.eventHandlers = {
            mousedown: null,
            mousemove: null,
            mouseup: null,
            touchstart: null,
            touchmove: null,
            touchend: null
        };
        
        console.log('✅ PureBoundingBox: 初期化完了');
    }
    
    validateInput(input) {
        if (!input || typeof input !== 'object') {
            throw new Error('PureBoundingBox: 入力が無効です');
        }
        
        if (!input.canvasElement || !(input.canvasElement instanceof HTMLCanvasElement)) {
            throw new Error('PureBoundingBox: canvasElementが必要です');
        }
        
        if (!input.spineData || typeof input.spineData !== 'object') {
            throw new Error('PureBoundingBox: spineDataが必要です');
        }
    }
    
    /**
     * バウンディングボックス実行（メイン処理）
     * @param {object} options - 実行オプション
     * @returns {object} 実行結果
     */
    async execute(options = {}) {
        console.log('🎯 PureBoundingBox: 実行開始', options);
        
        try {
            // 初期状態バックアップ
            this.backupInitialState();
            
            // バウンディングボックス計算
            this.calculateBounds();
            
            // 表示要素作成
            this.createBoundingElements();
            
            // イベントハンドラー設定
            this.setupEventHandlers();
            
            // 表示
            if (options.visible !== false) {
                this.show();
            }
            
            const result = this.getState();
            console.log('✅ PureBoundingBox: 実行完了', result);
            return result;
            
        } catch (error) {
            console.error('❌ PureBoundingBox: 実行エラー', error);
            this.cleanup();
            return {
                success: false,
                error: error.message,
                bounds: null,
                visible: false,
                dragState: null
            };
        }
    }
    
    /**
     * 初期状態バックアップ
     */
    backupInitialState() {
        const canvas = this.config.canvasElement;
        this.initialState.canvasStyle = {
            position: canvas.style.position,
            cursor: canvas.style.cursor,
            userSelect: canvas.style.userSelect
        };
    }
    
    /**
     * バウンディングボックス計算
     */
    calculateBounds() {
        const canvas = this.config.canvasElement;
        const rect = canvas.getBoundingClientRect();
        const position = this.config.position;
        
        // キャンバス基準でのバウンディングボックス計算
        this.boundingState.bounds = {
            x: position.x || rect.left,
            y: position.y || rect.top,
            width: position.width || rect.width,
            height: position.height || rect.height
        };
        
        console.log('📏 バウンディングボックス計算完了', this.boundingState.bounds);
    }
    
    /**
     * バウンディングボックス表示要素作成
     */
    createBoundingElements() {
        // 既存要素のクリーンアップ
        if (this.boundingState.boundingElement) {
            this.removeBoundingElements();
        }
        
        const canvas = this.config.canvasElement;
        const bounds = this.boundingState.bounds;
        
        // バウンディングボックス要素作成
        const boundingDiv = document.createElement('div');
        boundingDiv.className = 'pure-bounding-box';
        boundingDiv.style.cssText = `
            position: absolute;
            border: 2px solid #ff6b6b;
            background: rgba(255, 107, 107, 0.1);
            pointer-events: none;
            z-index: 1000;
            left: ${bounds.x}px;
            top: ${bounds.y}px;
            width: ${bounds.width}px;
            height: ${bounds.height}px;
            display: none;
        `;
        
        // ハンドル作成（8個：四隅＋四辺中央）
        const handlePositions = [
            {class: 'nw', left: -4, top: -4, cursor: 'nw-resize'},
            {class: 'n', left: '50%', top: -4, cursor: 'n-resize', transform: 'translateX(-50%)'},
            {class: 'ne', right: -4, top: -4, cursor: 'ne-resize'},
            {class: 'e', right: -4, top: '50%', cursor: 'e-resize', transform: 'translateY(-50%)'},
            {class: 'se', right: -4, bottom: -4, cursor: 'se-resize'},
            {class: 's', left: '50%', bottom: -4, cursor: 's-resize', transform: 'translateX(-50%)'},
            {class: 'sw', left: -4, bottom: -4, cursor: 'sw-resize'},
            {class: 'w', left: -4, top: '50%', cursor: 'w-resize', transform: 'translateY(-50%)'}
        ];
        
        this.boundingState.handles = [];
        
        handlePositions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `pure-handle pure-handle-${pos.class}`;
            handle.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: #ff6b6b;
                border: 1px solid #fff;
                border-radius: 2px;
                cursor: ${pos.cursor};
                pointer-events: all;
                z-index: 1001;
                ${pos.left !== undefined ? `left: ${pos.left}${typeof pos.left === 'number' ? 'px' : ''};` : ''}
                ${pos.right !== undefined ? `right: ${pos.right}px;` : ''}
                ${pos.top !== undefined ? `top: ${pos.top}${typeof pos.top === 'number' ? 'px' : ''};` : ''}
                ${pos.bottom !== undefined ? `bottom: ${pos.bottom}px;` : ''}
                ${pos.transform ? `transform: ${pos.transform};` : ''}
            `;
            
            boundingDiv.appendChild(handle);
            this.boundingState.handles.push({
                element: handle,
                type: pos.class,
                cursor: pos.cursor
            });
        });
        
        // DOM に追加
        canvas.parentElement.appendChild(boundingDiv);
        this.boundingState.boundingElement = boundingDiv;
        
        console.log('🎨 バウンディングボックス要素作成完了');
    }
    
    /**
     * イベントハンドラー設定
     */
    setupEventHandlers() {
        const canvas = this.config.canvasElement;
        const boundingElement = this.boundingState.boundingElement;
        
        // マウスイベント
        this.eventHandlers.mousedown = this.handleMouseDown.bind(this);
        this.eventHandlers.mousemove = this.handleMouseMove.bind(this);
        this.eventHandlers.mouseup = this.handleMouseUp.bind(this);
        
        // タッチイベント
        this.eventHandlers.touchstart = this.handleTouchStart.bind(this);
        this.eventHandlers.touchmove = this.handleTouchMove.bind(this);
        this.eventHandlers.touchend = this.handleTouchEnd.bind(this);
        
        // キャンバスにイベント追加
        canvas.addEventListener('mousedown', this.eventHandlers.mousedown);
        document.addEventListener('mousemove', this.eventHandlers.mousemove);
        document.addEventListener('mouseup', this.eventHandlers.mouseup);
        
        canvas.addEventListener('touchstart', this.eventHandlers.touchstart);
        document.addEventListener('touchmove', this.eventHandlers.touchmove);
        document.addEventListener('touchend', this.eventHandlers.touchend);
        
        // ハンドルにイベント追加
        this.boundingState.handles.forEach(handle => {
            handle.element.addEventListener('mousedown', this.eventHandlers.mousedown);
            handle.element.addEventListener('touchstart', this.eventHandlers.touchstart);
        });
        
        console.log('🎮 イベントハンドラー設定完了');
    }
    
    /**
     * マウスダウン処理
     */
    handleMouseDown(event) {
        event.preventDefault();
        
        const rect = this.config.canvasElement.getBoundingClientRect();
        this.boundingState.dragState = {
            isDragging: true,
            startX: event.clientX - rect.left,
            startY: event.clientY - rect.top,
            currentX: event.clientX - rect.left,
            currentY: event.clientY - rect.top,
            handleType: event.target.classList.contains('pure-handle') ? 
                       event.target.className.split(' ').find(c => c.startsWith('pure-handle-'))?.replace('pure-handle-', '') : 'move'
        };
        
        console.log('🖱️ ドラッグ開始', this.boundingState.dragState);
    }
    
    /**
     * マウス移動処理
     */
    handleMouseMove(event) {
        if (!this.boundingState.dragState.isDragging) return;
        
        event.preventDefault();
        
        const rect = this.config.canvasElement.getBoundingClientRect();
        const currentX = event.clientX - rect.left;
        const currentY = event.clientY - rect.top;
        
        this.boundingState.dragState.currentX = currentX;
        this.boundingState.dragState.currentY = currentY;
        
        // バウンディングボックス更新
        this.updateBoundingBox();
    }
    
    /**
     * マウスアップ処理
     */
    handleMouseUp(event) {
        if (!this.boundingState.dragState.isDragging) return;
        
        this.boundingState.dragState.isDragging = false;
        console.log('🖱️ ドラッグ終了', this.boundingState.bounds);
    }
    
    /**
     * タッチ開始処理
     */
    handleTouchStart(event) {
        if (event.touches.length !== 1) return;
        
        const touch = event.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleMouseDown(mouseEvent);
    }
    
    /**
     * タッチ移動処理
     */
    handleTouchMove(event) {
        if (event.touches.length !== 1) return;
        
        const touch = event.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleMouseMove(mouseEvent);
    }
    
    /**
     * タッチ終了処理
     */
    handleTouchEnd(event) {
        const mouseEvent = new MouseEvent('mouseup', {});
        this.handleMouseUp(mouseEvent);
    }
    
    /**
     * バウンディングボックス更新
     */
    updateBoundingBox() {
        const dragState = this.boundingState.dragState;
        const bounds = this.boundingState.bounds;
        const deltaX = dragState.currentX - dragState.startX;
        const deltaY = dragState.currentY - dragState.startY;
        
        // ドラッグタイプに応じてバウンディングボックス更新
        switch (dragState.handleType) {
            case 'move':
                bounds.x += deltaX;
                bounds.y += deltaY;
                break;
            case 'nw':
                bounds.x += deltaX;
                bounds.y += deltaY;
                bounds.width -= deltaX;
                bounds.height -= deltaY;
                break;
            case 'ne':
                bounds.y += deltaY;
                bounds.width += deltaX;
                bounds.height -= deltaY;
                break;
            case 'sw':
                bounds.x += deltaX;
                bounds.width -= deltaX;
                bounds.height += deltaY;
                break;
            case 'se':
                bounds.width += deltaX;
                bounds.height += deltaY;
                break;
            case 'n':
                bounds.y += deltaY;
                bounds.height -= deltaY;
                break;
            case 's':
                bounds.height += deltaY;
                break;
            case 'w':
                bounds.x += deltaX;
                bounds.width -= deltaX;
                break;
            case 'e':
                bounds.width += deltaX;
                break;
        }
        
        // 最小サイズ制限
        bounds.width = Math.max(20, bounds.width);
        bounds.height = Math.max(20, bounds.height);
        
        // 表示要素更新
        if (this.boundingState.boundingElement) {
            const element = this.boundingState.boundingElement;
            element.style.left = bounds.x + 'px';
            element.style.top = bounds.y + 'px';
            element.style.width = bounds.width + 'px';
            element.style.height = bounds.height + 'px';
        }
        
        // ドラッグ開始位置更新
        dragState.startX = dragState.currentX;
        dragState.startY = dragState.currentY;
    }
    
    /**
     * バウンディングボックス表示
     */
    show() {
        if (this.boundingState.boundingElement) {
            this.boundingState.boundingElement.style.display = 'block';
            this.boundingState.visible = true;
            console.log('👁️ バウンディングボックス表示');
        }
    }
    
    /**
     * バウンディングボックス非表示
     */
    hide() {
        if (this.boundingState.boundingElement) {
            this.boundingState.boundingElement.style.display = 'none';
            this.boundingState.visible = false;
            console.log('🙈 バウンディングボックス非表示');
        }
    }
    
    /**
     * バウンディングボックス要素削除
     */
    removeBoundingElements() {
        if (this.boundingState.boundingElement) {
            this.boundingState.boundingElement.remove();
            this.boundingState.boundingElement = null;
            this.boundingState.handles = [];
            console.log('🗑️ バウンディングボックス要素削除');
        }
    }
    
    /**
     * 現在状態取得
     * @returns {object} 現在状態
     */
    getState() {
        return {
            success: true,
            bounds: {...this.boundingState.bounds},
            visible: this.boundingState.visible,
            dragState: {...this.boundingState.dragState},
            handleCount: this.boundingState.handles.length
        };
    }
    
    /**
     * 完全クリーンアップ（外部依存ゼロ保証）
     */
    cleanup() {
        console.log('🧹 PureBoundingBox: クリーンアップ開始');
        
        try {
            // バウンディングボックス要素削除
            this.removeBoundingElements();
            
            // イベントハンドラー削除
            const canvas = this.config.canvasElement;
            if (canvas && this.eventHandlers) {
                canvas.removeEventListener('mousedown', this.eventHandlers.mousedown);
                document.removeEventListener('mousemove', this.eventHandlers.mousemove);
                document.removeEventListener('mouseup', this.eventHandlers.mouseup);
                
                canvas.removeEventListener('touchstart', this.eventHandlers.touchstart);
                document.removeEventListener('touchmove', this.eventHandlers.touchmove);
                document.removeEventListener('touchend', this.eventHandlers.touchend);
            }
            
            // 初期状態復元
            if (this.initialState.canvasStyle && canvas) {
                Object.assign(canvas.style, this.initialState.canvasStyle);
            }
            
            // 内部状態クリア
            this.boundingState = {
                visible: false,
                bounds: {x: 0, y: 0, width: 0, height: 0},
                dragState: {isDragging: false, startX: 0, startY: 0, currentX: 0, currentY: 0},
                handles: [],
                boundingElement: null
            };
            
            this.eventHandlers = {
                mousedown: null,
                mousemove: null,
                mouseup: null,
                touchstart: null,
                touchmove: null,
                touchend: null
            };
            
            console.log('✅ PureBoundingBox: クリーンアップ完了');
            
        } catch (error) {
            console.error('❌ PureBoundingBox: クリーンアップエラー', error);
        }
    }
    
    /**
     * 単独テスト用静的メソッド
     * @returns {Promise<object>} テスト結果
     */
    static async test() {
        console.log('🧪 PureBoundingBox: 単独テスト開始');
        
        try {
            // テスト用Canvas作成
            const testCanvas = document.createElement('canvas');
            testCanvas.width = 200;
            testCanvas.height = 150;
            testCanvas.style.cssText = 'position: absolute; left: 100px; top: 100px;';
            document.body.appendChild(testCanvas);
            
            // テスト用SpineData
            const testSpineData = {
                skeleton: {name: 'test-character'},
                bounds: {x: 0, y: 0, width: 200, height: 150}
            };
            
            // テスト用Position
            const testPosition = {x: 100, y: 100, width: 200, height: 150};
            
            // PureBoundingBox作成・実行
            const boundingBox = new PureBoundingBox({
                canvasElement: testCanvas,
                spineData: testSpineData,
                position: testPosition
            });
            
            const result = await boundingBox.execute({visible: true});
            
            // 2秒間表示
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // クリーンアップ
            boundingBox.cleanup();
            testCanvas.remove();
            
            console.log('✅ PureBoundingBox: 単独テスト完了', result);
            return {
                success: true,
                result: result,
                message: 'PureBoundingBox単独テスト成功'
            };
            
        } catch (error) {
            console.error('❌ PureBoundingBox: 単独テストエラー', error);
            return {
                success: false,
                error: error.message,
                message: 'PureBoundingBox単独テスト失敗'
            };
        }
    }
}

// F12コンソール用グローバル関数
if (typeof window !== 'undefined') {
    window.testPureBoundingBox = PureBoundingBox.test;
}