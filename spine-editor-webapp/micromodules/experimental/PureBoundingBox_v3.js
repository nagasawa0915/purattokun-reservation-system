/**
 * PureBoundingBox v3.0 - 中身連動・修飾キー対応版
 * 
 * 🎯 v3.0 新機能
 * 1. バウンディングボックスと中身（targetElement）の完全連動
 * 2. Shift キー: 等比率リサイズ（アスペクト比固定）
 * 3. Alt キー: 中心基準リサイズ（中心点固定）
 * 4. より滑らかな変形アニメーション
 * 
 * 責務: バウンディングボックス操作による要素の変形・移動制御
 * 入力: {targetElement: HTMLElement, initialBounds?: object}
 * 出力: {bounds: object, visible: boolean, transform: object}
 */

class PureBoundingBox {
    constructor(input) {
        console.log('📦 PureBoundingBox v3.0: 初期化開始', input);
        
        // 入力検証
        this.validateInput(input);
        
        // 初期状態バックアップ
        this.initialState = {
            targetElementStyle: {
                position: null,
                left: null,
                top: null,
                width: null,
                height: null,
                transform: null
            },
            documentEvents: []
        };
        
        // 設定保存
        this.config = {
            targetElement: input.targetElement,
            initialBounds: input.initialBounds || null,
            minWidth: input.minWidth || 20,
            minHeight: input.minHeight || 20,
            syncTransform: input.syncTransform !== false, // デフォルトtrue
            enableAspectRatio: input.enableAspectRatio !== false, // Shift機能
            enableCenterResize: input.enableCenterResize !== false // Alt機能
        };
        
        // 内部状態初期化
        this.state = {
            visible: false,
            bounds: {x: 0, y: 0, width: 100, height: 100},
            transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 0,
                translateY: 0
            },
            aspectRatio: 1, // 初期アスペクト比
            dragState: {
                isDragging: false,
                dragType: null,
                startMouseX: 0,
                startMouseY: 0,
                startBoundsX: 0,
                startBoundsY: 0,
                startBoundsWidth: 0,
                startBoundsHeight: 0,
                modifierKeys: {
                    shift: false,
                    alt: false,
                    ctrl: false
                }
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
            keyDown: this.onKeyDown.bind(this),
            keyUp: this.onKeyUp.bind(this),
            touchStart: this.onTouchStart.bind(this),
            touchMove: this.onTouchMove.bind(this),
            touchEnd: this.onTouchEnd.bind(this)
        };
        
        console.log('✅ PureBoundingBox v3.0: 初期化完了');
    }
    
    validateInput(input) {
        if (!input?.targetElement || !(input.targetElement instanceof HTMLElement)) {
            throw new Error('PureBoundingBox v3.0: 有効なtargetElementが必要です');
        }
    }
    
    /**
     * バウンディングボックス実行
     */
    async execute(options = {}) {
        console.log('🎯 PureBoundingBox v3.0: 実行開始', options);
        
        try {
            // 初期状態バックアップ
            this.backupInitialState();
            
            // 初期バウンディングボックス計算
            this.calculateInitialBounds();
            
            // アスペクト比計算
            this.calculateAspectRatio();
            
            // UI要素作成
            this.createBoundingElements();
            
            // イベントリスナー設定
            this.setupEventListeners();
            
            // 表示
            if (options.visible !== false) {
                this.show();
            }
            
            const result = this.getState();
            console.log('✅ PureBoundingBox v3.0: 実行完了', result);
            return result;
            
        } catch (error) {
            console.error('❌ PureBoundingBox v3.0: 実行エラー', error);
            this.cleanup();
            throw error;
        }
    }
    
    /**
     * 初期状態バックアップ
     */
    backupInitialState() {
        const element = this.config.targetElement;
        const style = window.getComputedStyle(element);
        
        this.initialState.targetElementStyle = {
            position: element.style.position || style.position,
            left: element.style.left || style.left,
            top: element.style.top || style.top,
            width: element.style.width || style.width,
            height: element.style.height || style.height,
            transform: element.style.transform || style.transform,
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
        
        if (this.config.initialBounds) {
            this.state.bounds = {...this.config.initialBounds};
        } else {
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
     * アスペクト比計算
     */
    calculateAspectRatio() {
        const bounds = this.state.bounds;
        this.state.aspectRatio = bounds.width / bounds.height;
        console.log('📐 アスペクト比計算:', this.state.aspectRatio);
    }
    
    /**
     * バウンディングボックス要素作成
     */
    createBoundingElements() {
        const bounds = this.state.bounds;
        const parentElement = this.config.targetElement.offsetParent || document.body;
        
        // コンテナ作成
        const container = document.createElement('div');
        container.className = 'pure-bounding-box-container-v3';
        container.style.cssText = `
            position: absolute;
            left: ${bounds.x}px;
            top: ${bounds.y}px;
            width: ${bounds.width}px;
            height: ${bounds.height}px;
            border: 2px solid #ff6b6b;
            background: rgba(255, 107, 107, 0.08);
            pointer-events: none;
            z-index: 1000;
            display: none;
            box-sizing: border-box;
            transition: border-color 0.2s ease;
        `;
        
        // ハンドル設定（AfterEffects風）
        const handleConfigs = [
            {type: 'nw', cursor: 'nw-resize', left: -5, top: -5},
            {type: 'n',  cursor: 'n-resize',  left: '50%', top: -5, transform: 'translateX(-50%)'},
            {type: 'ne', cursor: 'ne-resize', right: -5, top: -5},
            {type: 'e',  cursor: 'e-resize',  right: -5, top: '50%', transform: 'translateY(-50%)'},
            {type: 'se', cursor: 'se-resize', right: -5, bottom: -5},
            {type: 's',  cursor: 's-resize',  left: '50%', bottom: -5, transform: 'translateX(-50%)'},
            {type: 'sw', cursor: 'sw-resize', left: -5, bottom: -5},
            {type: 'w',  cursor: 'w-resize',  left: -5, top: '50%', transform: 'translateY(-50%)'}
        ];
        
        // ハンドル作成
        const handles = [];
        handleConfigs.forEach(config => {
            const handle = document.createElement('div');
            handle.className = `pure-handle-v3 pure-handle-${config.type}`;
            handle.setAttribute('data-resize-type', config.type);
            
            let handleStyle = `
                position: absolute;
                width: 10px;
                height: 10px;
                background: #ff6b6b;
                border: 2px solid #fff;
                border-radius: 3px;
                cursor: ${config.cursor};
                pointer-events: all;
                z-index: 1;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            `;
            
            // 位置設定
            if (config.left !== undefined) handleStyle += `left: ${config.left}${typeof config.left === 'number' ? 'px' : ''};`;
            if (config.right !== undefined) handleStyle += `right: ${config.right}px;`;
            if (config.top !== undefined) handleStyle += `top: ${config.top}${typeof config.top === 'number' ? 'px' : ''};`;
            if (config.bottom !== undefined) handleStyle += `bottom: ${config.bottom}px;`;
            if (config.transform) handleStyle += `transform: ${config.transform};`;
            
            handle.style.cssText = handleStyle;
            
            // ハンドルホバー効果
            handle.addEventListener('mouseenter', () => {
                handle.style.background = '#ff4757';
                handle.style.transform = (config.transform || '') + ' scale(1.2)';
            });
            handle.addEventListener('mouseleave', () => {
                handle.style.background = '#ff6b6b';
                handle.style.transform = config.transform || '';
            });
            
            container.appendChild(handle);
            handles.push({element: handle, type: config.type, cursor: config.cursor});
        });
        
        // 移動用領域（コンテナ全体）
        container.style.pointerEvents = 'all';
        container.style.cursor = 'move';
        
        // 中央の十字アイコン（移動表示用）
        const moveIcon = document.createElement('div');
        moveIcon.style.cssText = `
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            pointer-events: none;
            opacity: 0.6;
        `;
        moveIcon.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2">
                <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <line x1="12" y1="2" x2="12" y2="22"/>
            </svg>
        `;
        container.appendChild(moveIcon);
        
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
        
        // コンテナイベント
        container.addEventListener('mousedown', this.boundHandlers.mouseDown);
        container.addEventListener('touchstart', this.boundHandlers.touchStart);
        
        // ドキュメントイベント
        document.addEventListener('mousemove', this.boundHandlers.mouseMove);
        document.addEventListener('mouseup', this.boundHandlers.mouseUp);
        document.addEventListener('keydown', this.boundHandlers.keyDown);
        document.addEventListener('keyup', this.boundHandlers.keyUp);
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
     * キーボードイベント処理
     */
    onKeyDown(event) {
        const dragState = this.state.dragState;
        if (!dragState.isDragging) return;
        
        // 修飾キー状態更新
        dragState.modifierKeys.shift = event.shiftKey;
        dragState.modifierKeys.alt = event.altKey;
        dragState.modifierKeys.ctrl = event.ctrlKey;
        
        // UI表示更新
        this.updateModifierKeyUI();
    }
    
    onKeyUp(event) {
        const dragState = this.state.dragState;
        
        // 修飾キー状態更新
        dragState.modifierKeys.shift = event.shiftKey;
        dragState.modifierKeys.alt = event.altKey;
        dragState.modifierKeys.ctrl = event.ctrlKey;
        
        // UI表示更新
        this.updateModifierKeyUI();
    }
    
    /**
     * 修飾キーUI表示更新
     */
    updateModifierKeyUI() {
        const container = this.state.elements.container;
        const modifiers = this.state.dragState.modifierKeys;
        
        if (container) {
            // Shift: 黄色ボーダー（等比）
            if (modifiers.shift) {
                container.style.borderColor = '#feca57';
                container.style.boxShadow = '0 0 10px rgba(254, 202, 87, 0.5)';
            }
            // Alt: 青色ボーダー（中心基準）
            else if (modifiers.alt) {
                container.style.borderColor = '#3742fa';
                container.style.boxShadow = '0 0 10px rgba(55, 66, 250, 0.5)';
            }
            // 通常
            else {
                container.style.borderColor = '#ff6b6b';
                container.style.boxShadow = 'none';
            }
        }
    }
    
    /**
     * マウスダウン処理
     */
    onMouseDown(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // ドラッグタイプ判定
        let dragType = 'move';
        if (event.target.classList.contains('pure-handle-v3')) {
            dragType = 'resize-' + event.target.getAttribute('data-resize-type');
        }
        
        const mouseX = event.clientX;
        const mouseY = event.clientY;
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
            startBoundsHeight: currentBounds.height,
            modifierKeys: {
                shift: event.shiftKey,
                alt: event.altKey,
                ctrl: event.ctrlKey
            }
        };
        
        // UI表示更新
        this.updateModifierKeyUI();
        
        console.log('🖱️ ドラッグ開始:', {
            type: dragType,
            modifiers: this.state.dragState.modifierKeys
        });
    }
    
    /**
     * マウス移動処理
     */
    onMouseMove(event) {
        const dragState = this.state.dragState;
        if (!dragState.isDragging) return;
        
        event.preventDefault();
        
        // 修飾キー状態更新
        dragState.modifierKeys.shift = event.shiftKey;
        dragState.modifierKeys.alt = event.altKey;
        dragState.modifierKeys.ctrl = event.ctrlKey;
        
        const deltaX = event.clientX - dragState.startMouseX;
        const deltaY = event.clientY - dragState.startMouseY;
        
        // 新しいバウンディングボックス計算
        const newBounds = this.calculateNewBounds(deltaX, deltaY, dragState);
        
        // バウンディングボックス・ターゲット要素更新
        this.updateBounds(newBounds);
        this.updateTargetElement(newBounds);
        
        // UI表示更新
        this.updateModifierKeyUI();
    }
    
    /**
     * 新しいバウンディングボックス計算
     */
    calculateNewBounds(deltaX, deltaY, dragState) {
        let newBounds = {
            x: dragState.startBoundsX,
            y: dragState.startBoundsY,
            width: dragState.startBoundsWidth,
            height: dragState.startBoundsHeight
        };
        
        const modifiers = dragState.modifierKeys;
        
        // 移動の場合
        if (dragState.dragType === 'move') {
            newBounds.x = dragState.startBoundsX + deltaX;
            newBounds.y = dragState.startBoundsY + deltaY;
            return newBounds;
        }
        
        // リサイズの場合
        const centerX = dragState.startBoundsX + dragState.startBoundsWidth / 2;
        const centerY = dragState.startBoundsY + dragState.startBoundsHeight / 2;
        
        // 基本リサイズ計算
        switch (dragState.dragType) {
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
        
        // Shift: 等比率リサイズ
        if (modifiers.shift && this.config.enableAspectRatio) {
            const aspectRatio = this.state.aspectRatio;
            
            // 幅に基づいて高さを調整
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                const newHeight = newBounds.width / aspectRatio;
                const heightDiff = newHeight - newBounds.height;
                
                newBounds.height = newHeight;
                
                // 上側のハンドルの場合、Y座標も調整
                if (dragState.dragType.includes('n')) {
                    newBounds.y -= heightDiff;
                }
            } else {
                // 高さに基づいて幅を調整
                const newWidth = newBounds.height * aspectRatio;
                const widthDiff = newWidth - newBounds.width;
                
                newBounds.width = newWidth;
                
                // 左側のハンドルの場合、X座標も調整
                if (dragState.dragType.includes('w')) {
                    newBounds.x -= widthDiff;
                }
            }
        }
        
        // Alt: 中心基準リサイズ
        if (modifiers.alt && this.config.enableCenterResize) {
            const widthChange = newBounds.width - dragState.startBoundsWidth;
            const heightChange = newBounds.height - dragState.startBoundsHeight;
            
            newBounds.x = centerX - newBounds.width / 2;
            newBounds.y = centerY - newBounds.height / 2;
        }
        
        // 最小サイズ制限
        if (newBounds.width < this.config.minWidth) {
            const diff = this.config.minWidth - newBounds.width;
            newBounds.width = this.config.minWidth;
            if (dragState.dragType.includes('w') && !modifiers.alt) {
                newBounds.x -= diff;
            }
        }
        
        if (newBounds.height < this.config.minHeight) {
            const diff = this.config.minHeight - newBounds.height;
            newBounds.height = this.config.minHeight;
            if (dragState.dragType.includes('n') && !modifiers.alt) {
                newBounds.y -= diff;
            }
        }
        
        return newBounds;
    }
    
    /**
     * マウスアップ処理
     */
    onMouseUp(event) {
        if (!this.state.dragState.isDragging) return;
        
        this.state.dragState.isDragging = false;
        
        // UI表示をデフォルトに戻す
        const container = this.state.elements.container;
        if (container) {
            container.style.borderColor = '#ff6b6b';
            container.style.boxShadow = 'none';
        }
        
        console.log('🖱️ ドラッグ終了:', this.state.bounds);
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
            clientY: touch.clientY,
            shiftKey: false,
            altKey: false,
            ctrlKey: false
        });
    }
    
    onTouchMove(event) {
        if (event.touches.length !== 1) return;
        const touch = event.touches[0];
        this.onMouseMove({
            preventDefault: () => event.preventDefault(),
            clientX: touch.clientX,
            clientY: touch.clientY,
            shiftKey: false,
            altKey: false,
            ctrlKey: false
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
     * ターゲット要素更新（中身と連動）
     */
    updateTargetElement(bounds) {
        if (!this.config.syncTransform) return;
        
        const element = this.config.targetElement;
        
        // 位置・サイズ同期
        element.style.position = 'absolute';
        element.style.left = bounds.x + 'px';
        element.style.top = bounds.y + 'px';
        element.style.width = bounds.width + 'px';
        element.style.height = bounds.height + 'px';
        
        // トランスフォーム情報更新
        const initialBounds = this.config.initialBounds || this.state.bounds;
        this.state.transform = {
            scaleX: bounds.width / initialBounds.width,
            scaleY: bounds.height / initialBounds.height,
            translateX: bounds.x - initialBounds.x,
            translateY: bounds.y - initialBounds.y
        };
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
            transform: {...this.state.transform},
            visible: this.state.visible,
            dragState: {
                isDragging: this.state.dragState.isDragging,
                dragType: this.state.dragState.dragType,
                modifierKeys: {...this.state.dragState.modifierKeys}
            }
        };
    }
    
    /**
     * 完全クリーンアップ
     */
    cleanup() {
        console.log('🧹 PureBoundingBox v3.0: クリーンアップ開始');
        
        try {
            // DOM要素削除
            if (this.state.elements.container) {
                this.state.elements.container.remove();
            }
            
            // イベントリスナー削除
            document.removeEventListener('mousemove', this.boundHandlers.mouseMove);
            document.removeEventListener('mouseup', this.boundHandlers.mouseUp);
            document.removeEventListener('keydown', this.boundHandlers.keyDown);
            document.removeEventListener('keyup', this.boundHandlers.keyUp);
            document.removeEventListener('touchmove', this.boundHandlers.touchMove);
            document.removeEventListener('touchend', this.boundHandlers.touchEnd);
            
            // ターゲット要素スタイル復元
            if (this.config.syncTransform && this.config.targetElement) {
                const element = this.config.targetElement;
                const initialStyle = this.initialState.targetElementStyle;
                
                Object.keys(initialStyle).forEach(key => {
                    if (initialStyle[key]) {
                        element.style[key] = initialStyle[key];
                    } else {
                        element.style.removeProperty(key);
                    }
                });
            }
            
            // 状態リセット
            this.state = {
                visible: false,
                bounds: {x: 0, y: 0, width: 100, height: 100},
                transform: {scaleX: 1, scaleY: 1, translateX: 0, translateY: 0},
                dragState: {isDragging: false, dragType: null, modifierKeys: {}},
                elements: {container: null, handles: []}
            };
            
            console.log('✅ PureBoundingBox v3.0: クリーンアップ完了');
            
        } catch (error) {
            console.error('❌ PureBoundingBox v3.0: クリーンアップエラー', error);
        }
    }
    
    /**
     * 単独テスト
     */
    static async test() {
        console.log('🧪 PureBoundingBox v3.0: テスト開始');
        
        try {
            // テスト用要素作成
            const testElement = document.createElement('div');
            testElement.style.cssText = `
                position: absolute;
                left: 200px;
                top: 150px;
                width: 150px;
                height: 100px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 14px;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            `;
            testElement.textContent = 'v3.0 テスト要素';
            document.body.appendChild(testElement);
            
            // バウンディングボックス作成
            const boundingBox = new PureBoundingBox({
                targetElement: testElement,
                initialBounds: {x: 180, y: 130, width: 190, height: 140},
                syncTransform: true,
                enableAspectRatio: true,
                enableCenterResize: true
            });
            
            // 実行
            const result = await boundingBox.execute({visible: true});
            
            console.log('📊 v3.0 テスト結果:', result);
            console.log('🎮 操作方法:');
            console.log('  - ドラッグ: 移動');
            console.log('  - ハンドルドラッグ: リサイズ');
            console.log('  - Shift + リサイズ: 等比率');
            console.log('  - Alt + リサイズ: 中心基準');
            
            // 5秒後にクリーンアップ
            setTimeout(() => {
                boundingBox.cleanup();
                testElement.remove();
                console.log('🧪 v3.0 テスト完了・要素削除');
            }, 5000);
            
            return {
                success: true,
                result: result,
                message: 'PureBoundingBox v3.0 テスト成功'
            };
            
        } catch (error) {
            console.error('❌ v3.0 テストエラー:', error);
            return {success: false, error: error.message};
        }
    }
}

// グローバルテスト用
if (typeof window !== 'undefined') {
    window.testPureBoundingBoxV3 = PureBoundingBox.test;
    window.PureBoundingBoxV3 = PureBoundingBox;
}