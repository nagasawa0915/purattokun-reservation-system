/**
 * PureBoundingBox v4.0 - BBスワップ仕様完全実装版
 * 
 * 🎯 BBスワップ仕様実装
 * - 選択時: originalTransform保存 → BB座標系へスワップ
 * - 操作中: BB座標系内で編集
 * - 解除時: BB座標→元座標系へ逆変換して確定
 * 
 * 状態遷移:
 * [*] → Idle → Editing(選択) → Editing(操作) → Idle(確定)
 */

class PureBoundingBox {
    constructor(input) {
        console.log('📦 PureBoundingBox v4.0 BBSwap: 初期化開始', input);
        
        this.validateInput(input);
        
        // 🗑️ 削除済み: 複雑な座標系設定
        // シンプルスワップでは単一座標系のみ使用
        
        // 初期状態バックアップ
        this.initialState = {
            documentEvents: [],
            targetElementStyle: null
        };
        
        // 設定
        this.config = {
            targetElement: input.targetElement,
            nodeId: input.nodeId || 'node-' + Date.now(),
            enableBBSwap: input.enableBBSwap !== false,
            minWidth: input.minWidth || 20,
            minHeight: input.minHeight || 20
        };
        
        // BBスワップ状態管理
        this.swapState = {
            // 状態: 'idle' | 'editing'
            currentState: 'idle',
            // 元のトランスフォーム（選択時に保存）
            originalTransform: null,
            // 編集開始時のBB座標での初期状態
            initialBBTransform: null,
            // 編集中フラグ
            isEditing: false
        };
        
        // Transform型定義に対応
        this.transform = {
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            zIndex: 1
        };
        
        // UI状態
        this.uiState = {
            visible: false,
            bounds: {x: 0, y: 0, width: 100, height: 100},
            dragState: {
                isDragging: false,
                dragType: null,
                startMouseX: 0,
                startMouseY: 0,
                startTransform: null,
                modifierKeys: {shift: false, alt: false, ctrl: false}
            },
            elements: {
                container: null,
                handles: []
            }
        };
        
        // イベントハンドラー
        this.boundHandlers = {
            mouseDown: this.onMouseDown.bind(this),
            mouseMove: this.onMouseMove.bind(this),
            mouseUp: this.onMouseUp.bind(this),
            keyDown: this.onKeyDown.bind(this),
            keyUp: this.onKeyUp.bind(this),
            documentClick: this.onDocumentClick.bind(this)
        };
        
        console.log('✅ PureBoundingBox v4.0 BBSwap: 初期化完了');
    }
    
    validateInput(input) {
        if (!input?.targetElement || !(input.targetElement instanceof HTMLElement)) {
            throw new Error('PureBoundingBox v4.0: 有効なtargetElementが必要です');
        }
    }
    
    /**
     * 🗑️ 削除済み: 複雑な状態管理機能
     * 
     * シンプルスワップでは複雑な状態遷移管理・スナップショット機能は不要
     * idle ↔ editing の単純な切り替えのみ
     */
    
    /**
     * 状態遷移: Idle → Editing （オブジェクト選択）
     * 🚨 瞬間移動防止: 座標レイヤーを統一し、シンプルな実装に変更
     */
    async onSelect(nodeId = null) {
        console.log('🎯 シンプルBB選択開始', nodeId || this.config.nodeId);
        
        // 既存編集終了
        if (this.swapState.currentState === 'editing') {
            await this.onDeselectOrClickOutside();
        }
        
        try {
            // 1. 現在のTransform保存（瞬間移動防止：変更しない）
            this.swapState.originalTransform = this.extractTransformFromElement();
            console.log('💾 現在Transform保存（変更なし）:', this.swapState.originalTransform);
            
            // 2. transformは一切変更しない（瞬間移動防止の核心）
            // 座標レイヤー切替は概念的なもので、実際の座標は維持
            this.transform = {...this.swapState.originalTransform};
            
            // 3. 状態変更のみ
            this.swapState.currentState = 'editing';
            this.swapState.isEditing = true;
            this.swapState.initialBBTransform = {...this.transform};
            
            // 4. UI表示（要素の現在位置に合わせて表示）
            await this.createBoundingBoxUI();
            this.show();
            this.syncBoundingBoxPosition();
            
            // 5. ドキュメントクリック監視
            document.addEventListener('mousedown', this.boundHandlers.documentClick, true);
            
            console.log('✅ シンプルBB選択完了 - 要素は移動していない');
            return {success: true, state: 'editing'};
            
        } catch (error) {
            console.error('❌ BB選択エラー:', error);
            this.swapState.currentState = 'idle';
            this.swapState.isEditing = false;
            throw error;
        }
    }
    
    /**
     * 🗑️ 削除済み: originalTransform検証
     * 
     * シンプルスワップでは座標は変更しないため、検証不要
     */
    
    /**
     * 状態遷移: Editing → Editing （BB操作）
     */
    onManipulate(delta) {
        if (!this.swapState.isEditing) {
            console.warn('⚠️ 編集モードではありません');
            return;
        }
        
        console.log('✏️ BB操作中:', delta);
        
        // 現在のBB座標でのトランスフォーム取得
        const currentTransform = this.getTransform();
        
        // デルタ適用（BB空間内で編集）
        const newTransform = this.applyDelta(currentTransform, delta);
        
        // BB座標でのトランスフォーム設定
        this.setTransform(null, newTransform);
        
        // UI更新削除: 重複処理排除
        
        return {success: true, transform: newTransform};
    }
    
    /**
     * 状態遷移: Editing → Idle （確定）
     * 🚨 シンプルスワップ: 複雑な逆変換処理を削除
     */
    async onDeselectOrClickOutside() {
        if (!this.swapState.isEditing) {
            return;
        }
        
        console.log('🎯 シンプルBB確定開始');
        
        try {
            // 1. 現在の状態を確認（変換は不要、既に正しい座標）
            const currentTransform = this.getTransform();
            console.log('📊 確定する最終状態:', currentTransform);
            
            // 2. 状態リセットのみ（座標変換なし）
            this.swapState.currentState = 'idle';
            this.swapState.isEditing = false;
            this.swapState.originalTransform = null;
            this.swapState.initialBBTransform = null;
            
            // 3. UI非表示・クリーンアップ
            this.hide();
            this.removeBoundingBoxUI();
            
            // 4. イベント監視停止
            document.removeEventListener('mousedown', this.boundHandlers.documentClick, true);
            
            console.log('✅ シンプルBB確定完了 - 座標変換なし');
            return {success: true, state: 'idle', finalTransform: currentTransform};
            
        } catch (error) {
            console.error('❌ BB確定エラー:', error);
            this.swapState.currentState = 'idle';
            this.swapState.isEditing = false;
            throw error;
        }
    }
    
    /**
     * 🗑️ 削除済み: 複雑な座標変換処理
     * 
     * シンプルスワップ実装では、座標変換は行わない
     * すべての操作を単一の座標レイヤーで実行
     */
    
    /**
     * 現在のトランスフォーム取得（高精度版）
     */
    getTransform(nodeId = null) {
        if (this.swapState.isEditing && this.swapState.initialBBTransform) {
            // 編集中はBB座標系での現在値を返す
            return {...this.transform};
        }
        
        // 通常時は要素から実際の値を高精度で取得
        return this.extractTransformFromElement();
    }
    
    /**
     * 要素からトランスフォーム情報を抽出（Position+Transform混合版）
     */
    extractTransformFromElement() {
        const element = this.config.targetElement;
        const style = window.getComputedStyle(element);
        
        // 🎯 現在の実装：Position値を基準位置として使用
        let baseX = parseFloat(style.left) || 0;
        let baseY = parseFloat(style.top) || 0;
        
        // Transform translate値を追加（存在する場合）
        let translateX = 0, translateY = 0, scaleX = 1, scaleY = 1, rotation = 0;
        
        const transformStyle = style.transform;
        if (transformStyle && transformStyle !== 'none') {
            // translate抽出
            const translateMatch = transformStyle.match(/translate\(([^)]+)\)/);
            if (translateMatch) {
                const values = translateMatch[1].split(',').map(v => parseFloat(v.trim()));
                translateX = values[0] || 0;
                translateY = values[1] || 0;
            }
            
            // その他のTransform解析
            const matrix = this.parseTransformMatrix(transformStyle);
            if (matrix) {
                scaleX = matrix.scaleX;
                scaleY = matrix.scaleY;
                rotation = matrix.rotation;
            }
        }
        
        const result = {
            x: translateX,  // Transform内のtranslate値のみ使用
            y: translateY,
            scaleX: scaleX,
            scaleY: scaleY,
            rotation: rotation,
            zIndex: parseFloat(style.zIndex) || 1,
            // デバッグ情報
            _debug: {
                basePosition: {x: baseX, y: baseY},
                translateOffset: {x: translateX, y: translateY}
            }
        };
        
        console.log('🔍 Position+Transform抽出:', result);
        return result;
    }
    
    /**
     * CSS transform matrixを解析
     */
    parseTransformMatrix(transform) {
        try {
            // matrix(a, b, c, d, e, f) または matrix3d解析
            const match = transform.match(/matrix\(([^)]+)\)/);
            if (!match) return null;
            
            const values = match[1].split(',').map(v => parseFloat(v.trim()));
            if (values.length >= 6) {
                const [a, b, c, d, e, f] = values;
                
                // スケールと回転を計算
                const scaleX = Math.sqrt(a * a + b * b);
                const scaleY = Math.sqrt(c * c + d * d);
                const rotation = Math.atan2(b, a) * (180 / Math.PI);
                
                return {scaleX, scaleY, rotation};
            }
        } catch (error) {
            console.warn('Transform matrix解析エラー:', error);
        }
        
        return null;
    }
    
    /**
     * トランスフォーム設定（座標系統一版）
     */
    setTransform(nodeId = null, transform) {
        this.transform = {...transform};
        
        const element = this.config.targetElement;
        
        // 🎯 座標系統一: CSS Transform のみ使用
        // Position（left/top）との混在を排除し、Transform translateで位置制御
        let transformStr = '';
        
        // 位置（translate）
        if (transform.x !== 0 || transform.y !== 0) {
            transformStr += `translate(${transform.x}px, ${transform.y}px) `;
        }
        
        // スケール
        if (transform.scaleX !== 1 || transform.scaleY !== 1) {
            transformStr += `scale(${transform.scaleX}, ${transform.scaleY}) `;
        }
        
        // 回転
        if (transform.rotation !== 0) {
            transformStr += `rotate(${transform.rotation}deg) `;
        }
        
        // CSS適用（Transform統一）
        element.style.position = 'absolute';
        element.style.transform = transformStr.trim() || 'none';
        element.style.zIndex = transform.zIndex.toString();
        
        // left/top初期位置保持（要素の現在位置を維持）
        if (!element.hasAttribute('data-initial-positioned')) {
            // 現在のPosition値を保持（リセットしない）
            const currentLeft = element.style.left || window.getComputedStyle(element).left;
            const currentTop = element.style.top || window.getComputedStyle(element).top;
            element.style.left = currentLeft;
            element.style.top = currentTop;
            element.setAttribute('data-initial-positioned', 'true');
        }
        
        console.log('🎯 Transform統一設定:', {transform: transformStr, zIndex: transform.zIndex});
    }
    
    /**
     * デルタ適用
     */
    applyDelta(currentTransform, delta) {
        return {
            x: currentTransform.x + (delta.x || 0),
            y: currentTransform.y + (delta.y || 0),
            scaleX: currentTransform.scaleX * (delta.scaleX || 1),
            scaleY: currentTransform.scaleY * (delta.scaleY || 1),
            rotation: currentTransform.rotation + (delta.rotation || 0),
            zIndex: delta.zIndex !== undefined ? delta.zIndex : currentTransform.zIndex
        };
    }
    
    /**
     * 🗑️ 削除済み: 複雑なcalculateNewBounds
     * 
     * シンプルスワップ実装では、複雑なBounds計算は不要
     * マウス移動を直接Transform値に反映する方式に変更
     */
    
    /**
     * バウンディングボックスUI作成
     */
    async createBoundingBoxUI() {
        const element = this.config.targetElement;
        const rect = element.getBoundingClientRect();
        const parent = element.offsetParent || document.body;
        
        // コンテナ作成
        const container = document.createElement('div');
        container.className = 'bb-swap-container';
        container.style.cssText = `
            position: absolute;
            left: ${rect.left}px;
            top: ${rect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            border: 2px solid #ff6b6b;
            background: rgba(255, 107, 107, 0.1);
            pointer-events: none;
            z-index: 10000;
            box-sizing: border-box;
            border-radius: 4px;
        `;
        
        // ハンドル作成
        const handles = this.createHandles(container);
        
        // コンテナにイベント追加
        container.style.pointerEvents = 'all';
        container.addEventListener('mousedown', this.boundHandlers.mouseDown);
        
        document.body.appendChild(container);
        
        this.uiState.elements.container = container;
        this.uiState.elements.handles = handles;
        
        console.log('🎨 BBスワップUI作成完了');
    }
    
    /**
     * ハンドル作成
     */
    createHandles(container) {
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
        
        const handles = [];
        
        handleConfigs.forEach(config => {
            const handle = document.createElement('div');
            handle.className = `bb-swap-handle bb-swap-handle-${config.type}`;
            handle.setAttribute('data-resize-type', config.type);
            
            let style = `
                position: absolute;
                width: 10px;
                height: 10px;
                background: #ff6b6b;
                border: 2px solid white;
                border-radius: 3px;
                cursor: ${config.cursor};
                pointer-events: all;
                z-index: 1;
            `;
            
            if (config.left !== undefined) style += `left: ${config.left}${typeof config.left === 'number' ? 'px' : ''};`;
            if (config.right !== undefined) style += `right: ${config.right}px;`;
            if (config.top !== undefined) style += `top: ${config.top}${typeof config.top === 'number' ? 'px' : ''};`;
            if (config.bottom !== undefined) style += `bottom: ${config.bottom}px;`;
            if (config.transform) style += `transform: ${config.transform};`;
            
            handle.style.cssText = style;
            handle.addEventListener('mousedown', this.boundHandlers.mouseDown);
            
            container.appendChild(handle);
            handles.push({element: handle, type: config.type});
        });
        
        return handles;
    }
    
    /**
     * ドキュメントクリック監視（BB外クリック検知）
     */
    onDocumentClick(event) {
        // BB要素内クリックの場合は無視
        if (event.target.closest('.bb-swap-container') || 
            event.target === this.config.targetElement ||
            this.config.targetElement.contains(event.target)) {
            return;
        }
        
        console.log('🖱️ BB外クリック検知 - 確定処理実行');
        this.onDeselectOrClickOutside();
    }
    
    /**
     * マウスイベント処理
     */
    onMouseDown(event) {
        if (!this.swapState.isEditing) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        const isHandle = event.target.classList.contains('bb-swap-handle');
        const dragType = isHandle ? 
            'resize-' + event.target.getAttribute('data-resize-type') : 'move';
        
        // 🚨 シンプルスワップ: Transform情報のみ使用（Boundsレイヤー削除）
        this.uiState.dragState = {
            isDragging: true,
            dragType: dragType,
            startMouseX: event.clientX,
            startMouseY: event.clientY,
            startTransform: {...this.transform},
            modifierKeys: {
                shift: event.shiftKey,
                alt: event.altKey,
                ctrl: event.ctrlKey
            }
        };
        
        document.addEventListener('mousemove', this.boundHandlers.mouseMove);
        document.addEventListener('mouseup', this.boundHandlers.mouseUp);
        document.addEventListener('keydown', this.boundHandlers.keyDown);
        document.addEventListener('keyup', this.boundHandlers.keyUp);
        
        console.log('🖱️ BBスワップドラッグ開始:', dragType);
    }
    
    onMouseMove(event) {
        const dragState = this.uiState.dragState;
        if (!dragState.isDragging) return;
        
        event.preventDefault();
        
        const deltaX = event.clientX - dragState.startMouseX;
        const deltaY = event.clientY - dragState.startMouseY;
        
        // v2成功パターン: 固定基準点システム
        // 累積ではなく、開始点からの相対計算
        let newTransform = {...dragState.startTransform};
        
        if (dragState.dragType === 'move') {
            // 移動: 開始位置から相対で計算（瞬間移動防止）
            newTransform.x = dragState.startTransform.x + deltaX;
            newTransform.y = dragState.startTransform.y + deltaY;
            
            console.log('🔄 移動計算:', {
                startTransform: dragState.startTransform,
                delta: {x: deltaX, y: deltaY},
                newTransform: newTransform
            });
            
        } else if (dragState.dragType.startsWith('resize-')) {
            // 🚨 シンプル&高速スケール: ハンドル基準の直感的操作
            
            const scaleSensitivity = 0.01; // 感度を10倍アップ（もっさり解消）
            
            const handleType = dragState.dragType.replace('resize-', '');
            
            // ハンドル別の位置・スケール計算（v2/v3パターン）
            switch (handleType) {
                case 'nw':
                    // 左上ハンドル: 右下固定でスケール
                    newTransform.x = dragState.startTransform.x + deltaX;
                    newTransform.y = dragState.startTransform.y + deltaY;
                    newTransform.scaleX = dragState.startTransform.scaleX * (1 - deltaX * scaleSensitivity);
                    newTransform.scaleY = dragState.startTransform.scaleY * (1 - deltaY * scaleSensitivity);
                    break;
                case 'ne':
                    // 右上ハンドル: 左下固定でスケール
                    newTransform.y = dragState.startTransform.y + deltaY;
                    newTransform.scaleX = dragState.startTransform.scaleX * (1 + deltaX * scaleSensitivity);
                    newTransform.scaleY = dragState.startTransform.scaleY * (1 - deltaY * scaleSensitivity);
                    break;
                case 'se':
                    // 右下ハンドル: 左上固定でスケール（最も直感的）
                    newTransform.scaleX = dragState.startTransform.scaleX * (1 + deltaX * scaleSensitivity);
                    newTransform.scaleY = dragState.startTransform.scaleY * (1 + deltaY * scaleSensitivity);
                    break;
                case 'sw':
                    // 左下ハンドル: 右上固定でスケール
                    newTransform.x = dragState.startTransform.x + deltaX;
                    newTransform.scaleX = dragState.startTransform.scaleX * (1 - deltaX * scaleSensitivity);
                    newTransform.scaleY = dragState.startTransform.scaleY * (1 + deltaY * scaleSensitivity);
                    break;
                case 'n':
                    // 上ハンドル: 下固定で縦スケール
                    newTransform.y = dragState.startTransform.y + deltaY;
                    newTransform.scaleY = dragState.startTransform.scaleY * (1 - deltaY * scaleSensitivity);
                    break;
                case 's':
                    // 下ハンドル: 上固定で縦スケール
                    newTransform.scaleY = dragState.startTransform.scaleY * (1 + deltaY * scaleSensitivity);
                    break;
                case 'w':
                    // 左ハンドル: 右固定で横スケール
                    newTransform.x = dragState.startTransform.x + deltaX;
                    newTransform.scaleX = dragState.startTransform.scaleX * (1 - deltaX * scaleSensitivity);
                    break;
                case 'e':
                    // 右ハンドル: 左固定で横スケール
                    newTransform.scaleX = dragState.startTransform.scaleX * (1 + deltaX * scaleSensitivity);
                    break;
            }
            
            // Shift: 等比スケール
            if (dragState.modifierKeys.shift) {
                const scaleRatio = Math.max(
                    newTransform.scaleX / dragState.startTransform.scaleX,
                    newTransform.scaleY / dragState.startTransform.scaleY
                );
                newTransform.scaleX = dragState.startTransform.scaleX * scaleRatio;
                newTransform.scaleY = dragState.startTransform.scaleY * scaleRatio;
            }
            
            // Alt: 中心基準（CSS transformは元々中心基準なので、位置補正削除）
            // →CSS transform scaleは元々中心基準なので、追加処理不要
            
            // 最小・最大スケール制限
            newTransform.scaleX = Math.max(0.1, Math.min(5.0, newTransform.scaleX));
            newTransform.scaleY = Math.max(0.1, Math.min(5.0, newTransform.scaleY));
            
            console.log('🔄 高速スケール:', {
                handleType: handleType,
                delta: {x: deltaX, y: deltaY},
                newScale: {x: newTransform.scaleX.toFixed(2), y: newTransform.scaleY.toFixed(2)},
                position: {x: Math.round(newTransform.x), y: Math.round(newTransform.y)},
                modifiers: dragState.modifierKeys
            });
        }
        
        // Transform設定 + バウンディングボックス追従
        this.setTransform(null, newTransform);
        this.syncBoundingBoxPosition();
    }
    
    onMouseUp(event) {
        this.uiState.dragState.isDragging = false;
        
        document.removeEventListener('mousemove', this.boundHandlers.mouseMove);
        document.removeEventListener('mouseup', this.boundHandlers.mouseUp);
        document.removeEventListener('keydown', this.boundHandlers.keyDown);
        document.removeEventListener('keyup', this.boundHandlers.keyUp);
        
        console.log('🖱️ BBスワップドラッグ終了');
    }
    
    onKeyDown(event) {
        if (this.uiState.dragState.isDragging) {
            this.uiState.dragState.modifierKeys.shift = event.shiftKey;
            this.uiState.dragState.modifierKeys.alt = event.altKey;
            this.uiState.dragState.modifierKeys.ctrl = event.ctrlKey;
        }
    }
    
    onKeyUp(event) {
        if (this.uiState.dragState.isDragging) {
            this.uiState.dragState.modifierKeys.shift = event.shiftKey;
            this.uiState.dragState.modifierKeys.alt = event.altKey;
            this.uiState.dragState.modifierKeys.ctrl = event.ctrlKey;
        }
    }
    
    /**
     * バウンディングボックス位置同期
     */
    syncBoundingBoxPosition() {
        if (!this.uiState.elements.container) return;
        
        const element = this.config.targetElement;
        const rect = element.getBoundingClientRect();
        
        // バウンディングボックスUIを要素の現在位置・サイズに同期
        this.uiState.elements.container.style.left = rect.left + 'px';
        this.uiState.elements.container.style.top = rect.top + 'px';
        this.uiState.elements.container.style.width = rect.width + 'px';
        this.uiState.elements.container.style.height = rect.height + 'px';
        
        console.log('🔄 BBボックス位置同期:', {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
        });
    }
    
    /**
     * UI表示制御
     */
    show() {
        if (this.uiState.elements.container) {
            this.uiState.elements.container.style.display = 'block';
            this.uiState.visible = true;
        }
    }
    
    hide() {
        if (this.uiState.elements.container) {
            this.uiState.elements.container.style.display = 'none';
            this.uiState.visible = false;
        }
    }
    
    removeBoundingBoxUI() {
        if (this.uiState.elements.container) {
            this.uiState.elements.container.remove();
            this.uiState.elements.container = null;
            this.uiState.elements.handles = [];
        }
    }
    
    /**
     * 完全クリーンアップ
     */
    cleanup() {
        console.log('🧹 BBスワップクリーンアップ開始');
        
        // 編集中の場合は確定
        if (this.swapState.isEditing) {
            this.onDeselectOrClickOutside();
        }
        
        // UI削除
        this.removeBoundingBoxUI();
        
        // イベントリスナー削除
        document.removeEventListener('mousedown', this.boundHandlers.documentClick, true);
        document.removeEventListener('mousemove', this.boundHandlers.mouseMove);
        document.removeEventListener('mouseup', this.boundHandlers.mouseUp);
        document.removeEventListener('keydown', this.boundHandlers.keyDown);
        document.removeEventListener('keyup', this.boundHandlers.keyUp);
        
        // 状態リセット
        this.swapState = {
            currentState: 'idle',
            originalTransform: null,
            initialBBTransform: null,
            isEditing: false
        };
        
        console.log('✅ BBスワップクリーンアップ完了');
    }
    
    /**
     * 状態取得
     */
    getState() {
        return {
            currentState: this.swapState.currentState,
            isEditing: this.swapState.isEditing,
            transform: {...this.transform},
            originalTransform: this.swapState.originalTransform ? 
                {...this.swapState.originalTransform} : null,
            visible: this.uiState.visible
        };
    }
    
    /**
     * D&D生成時の初期値設定
     */
    static createFromDrop(targetElement, dropX, dropY) {
        const instance = new PureBoundingBox({
            targetElement: targetElement,
            nodeId: 'dropped-' + Date.now()
        });
        
        // D&D仕様の初期値設定
        const initialTransform = {
            x: dropX,
            y: dropY,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            zIndex: 9999 // "front"
        };
        
        instance.setTransform(null, initialTransform);
        
        return instance;
    }
    
    /**
     * テスト用
     */
    static async test() {
        console.log('🧪 BBスワップテスト開始');
        
        try {
            // テスト要素作成
            const testElement = document.createElement('div');
            testElement.style.cssText = `
                position: absolute;
                left: 300px;
                top: 200px;
                width: 150px;
                height: 100px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            `;
            testElement.textContent = 'BBスワップテスト';
            document.body.appendChild(testElement);
            
            // BBスワップインスタンス作成
            const bbSwap = new PureBoundingBox({
                targetElement: testElement,
                nodeId: 'test-node',
                enableBBSwap: true,
                originalSpace: {origin: 'top-left', unit: 'px'},
                bbSpace: {origin: 'center', unit: 'px'}
            });
            
            // 選択開始
            await bbSwap.onSelect('test-node');
            
            console.log('📊 BBスワップ状態:', bbSwap.getState());
            console.log('🎮 操作してください: ドラッグで移動・リサイズ');
            console.log('🖱️ BB外をクリックで確定');
            
            // 10秒後に自動クリーンアップ
            setTimeout(() => {
                bbSwap.cleanup();
                testElement.remove();
                console.log('🧪 BBスワップテスト完了');
            }, 10000);
            
            return bbSwap;
            
        } catch (error) {
            console.error('❌ BBスワップテストエラー:', error);
            return null;
        }
    }
}

// グローバル公開
if (typeof window !== 'undefined') {
    window.PureBoundingBoxBBSwap = PureBoundingBox;
    window.testBBSwap = PureBoundingBox.test;
}