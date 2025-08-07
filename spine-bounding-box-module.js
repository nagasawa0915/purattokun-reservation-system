// 🎯 Spine編集システム - バウンディングボックスモジュール
// 役割: 編集機能（ドラッグ・リサイズ・バウンディングボックス操作）
// 複雑度: 高（ハンドル管理・ドラッグ処理・座標計算）

console.log('📦 Spine Bounding Box Module モジュール読み込み開始');

// ========== バウンディングボックスモジュール ========== //

function createBoundingBoxModule() {
    console.log('📦 バウンディングボックスモジュール作成開始');
    
    const module = {
        boundingBox: null,
        handles: [],
        isActive: false,
        dragState: {
            isDragging: false,
            startPos: { x: 0, y: 0 },
            startElementRect: {},
            activeHandle: null,
            operation: null
        },
        
        // モジュール初期化
        initialize: function(targetElement) {
            console.log('🔧 バウンディングボックス初期化');
            
            // 🔧 NEW: 座標系が確実にスワップされていることを確認
            if (!SpineEditSystem.coordinateSwap.isSwapped) {
                console.warn('⚠️ 座標系未スワップ検出 - 強制スワップ実行');
                SpineEditSystem.coordinateSwap.enterEditMode(targetElement);
            }
            
            this.createBoundingBox(targetElement);
            this.setupEventListeners();
            this.isActive = true;
        },
        
        // モジュールクリーンアップ
        cleanup: function() {
            console.log('🧹 バウンディングボックスクリーンアップ');
            this.removeBoundingBox();
            this.removeEventListeners();
            this.isActive = false;
            
            // プレビューボックス再表示
            if (MultiCharacterManager && MultiCharacterManager.updatePreviewBoxes) {
                MultiCharacterManager.updatePreviewBoxes();
            }
        },
        
        // バウンディングボックス作成（複数キャラクター対応）
        createBoundingBox: function(targetElement) {
            const rect = targetElement.getBoundingClientRect();
            const parentRect = targetElement.parentElement.getBoundingClientRect();
            
            // 選択中キャラクターの名前を取得
            const characterName = MultiCharacterManager.activeCharacter ? 
                MultiCharacterManager.activeCharacter.name : 'Unknown';
            
            // バウンディングボックス本体（選択中は実線、より目立つ色）
            this.boundingBox = document.createElement('div');
            this.boundingBox.id = 'spine-bounding-box';
            this.boundingBox.style.cssText = `
                position: absolute;
                border: 2px solid #007acc;
                background: rgba(0, 122, 204, 0.15);
                pointer-events: none;
                z-index: 9999;
                left: ${rect.left - parentRect.left}px;
                top: ${rect.top - parentRect.top}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
                box-shadow: 0 0 8px rgba(0, 122, 204, 0.3);
            `;
            
            // キャラクター名表示ラベル追加
            const label = document.createElement('div');
            label.style.cssText = `
                position: absolute;
                top: -25px;
                left: 0;
                background: #007acc;
                color: white;
                padding: 2px 8px;
                font-size: 12px;
                border-radius: 3px;
                white-space: nowrap;
            `;
            label.textContent = characterName;
            this.boundingBox.appendChild(label);
            
            targetElement.parentElement.appendChild(this.boundingBox);
            
            // ハンドル作成
            this.createHandles();
            
            // 中央移動エリア作成
            this.createCenterArea();
            
            console.log(`📦 ${characterName} 用バウンディングボックス作成完了`);
        },
        
        // ハンドル作成
        createHandles: function() {
            const handleConfigs = [
                // 角ハンドル（○印）- 対角中心拡縮
                { position: 'nw', type: 'corner', cursor: 'nw-resize', opposite: 'se' },
                { position: 'ne', type: 'corner', cursor: 'ne-resize', opposite: 'sw' },
                { position: 'sw', type: 'corner', cursor: 'sw-resize', opposite: 'ne' },
                { position: 'se', type: 'corner', cursor: 'se-resize', opposite: 'nw' }
                // エッジハンドル削除：辺は直接クリック可能にする
            ];
            
            handleConfigs.forEach(config => {
                const handle = document.createElement('div');
                handle.className = `bbox-handle ${config.type}`;
                handle.dataset.position = config.position;
                handle.dataset.cursor = config.cursor;
                handle.dataset.opposite = config.opposite;
                
                // 角ハンドルスタイル（○印）
                handle.style.cssText = `
                    position: absolute;
                    background: #fff;
                    border: 2px solid #007acc;
                    pointer-events: all;
                    z-index: 10000;
                    cursor: ${config.cursor};
                    width: 12px; 
                    height: 12px; 
                    border-radius: 50%; 
                    margin: -6px 0 0 -6px;
                `;
                
                // ハンドル位置設定
                this.positionHandle(handle, config.position);
                
                this.boundingBox.appendChild(handle);
                this.handles.push({ element: handle, config });
            });
            
            // 辺のクリック領域作成（見えない・クリック可能）
            this.createEdgeClickAreas();
        },
        
        // 【修正1】ハンドル位置設定: transform重複を避けた安全な位置指定
        positionHandle: function(handle, position) {
            // シンプルな配置でtransform重複を回避
            switch(position) {
                case 'nw': 
                    handle.style.top = '0'; 
                    handle.style.left = '0'; 
                    break;
                case 'ne': 
                    handle.style.top = '0'; 
                    handle.style.right = '0'; 
                    handle.style.marginRight = '-6px';
                    break;
                case 'sw': 
                    handle.style.bottom = '0'; 
                    handle.style.left = '0'; 
                    handle.style.marginBottom = '-6px';
                    break;
                case 'se': 
                    handle.style.bottom = '0'; 
                    handle.style.right = '0'; 
                    handle.style.margin = '0 -6px -6px 0';
                    break;
            }
        },
        
        // 辺のクリック領域作成
        createEdgeClickAreas: function() {
            const edgeConfigs = [
                { position: 'n', cursor: 'n-resize', opposite: 's' },
                { position: 'e', cursor: 'e-resize', opposite: 'w' },
                { position: 's', cursor: 's-resize', opposite: 'n' },
                { position: 'w', cursor: 'w-resize', opposite: 'e' }
            ];
            
            edgeConfigs.forEach(config => {
                const edgeArea = document.createElement('div');
                edgeArea.className = 'bbox-edge-area';
                edgeArea.dataset.position = config.position;
                edgeArea.dataset.cursor = config.cursor;
                edgeArea.dataset.opposite = config.opposite;
                edgeArea.dataset.type = 'edge';
                
                // 辺のクリック領域スタイル（見えない・クリック可能）
                edgeArea.style.cssText = `
                    position: absolute;
                    background: transparent;
                    pointer-events: all;
                    z-index: 9999;
                    cursor: ${config.cursor};
                `;
                
                // 辺領域の位置とサイズ設定
                this.positionEdgeArea(edgeArea, config.position);
                
                this.boundingBox.appendChild(edgeArea);
            });
        },
        
        // 辺領域の位置設定
        positionEdgeArea: function(edgeArea, position) {
            const edgeWidth = 8; // クリック領域の幅
            
            switch(position) {
                case 'n': // 上辺
                    edgeArea.style.top = `-${edgeWidth/2}px`;
                    edgeArea.style.left = '0';
                    edgeArea.style.width = '100%';
                    edgeArea.style.height = `${edgeWidth}px`;
                    break;
                case 'e': // 右辺
                    edgeArea.style.top = '0';
                    edgeArea.style.right = `-${edgeWidth/2}px`;
                    edgeArea.style.width = `${edgeWidth}px`;
                    edgeArea.style.height = '100%';
                    break;
                case 's': // 下辺
                    edgeArea.style.bottom = `-${edgeWidth/2}px`;
                    edgeArea.style.left = '0';
                    edgeArea.style.width = '100%';
                    edgeArea.style.height = `${edgeWidth}px`;
                    break;
                case 'w': // 左辺
                    edgeArea.style.top = '0';
                    edgeArea.style.left = `-${edgeWidth/2}px`;
                    edgeArea.style.width = `${edgeWidth}px`;
                    edgeArea.style.height = '100%';
                    break;
            }
        },
        
        // 中央移動エリア作成
        createCenterArea: function() {
            const centerArea = document.createElement('div');
            centerArea.className = 'bbox-center-area';
            centerArea.style.cssText = `
                position: absolute;
                top: 20%;
                left: 20%;
                width: 60%;
                height: 60%;
                cursor: crosshair;
                background: transparent;
                pointer-events: all;
                z-index: 9998;
            `;
            
            this.boundingBox.appendChild(centerArea);
        },
        
        // イベントリスナー設定
        setupEventListeners: function() {
            this.mouseDownHandler = this.handleMouseDown.bind(this);
            this.mouseMoveHandler = this.handleMouseMove.bind(this);
            this.mouseUpHandler = this.handleMouseUp.bind(this);
            
            document.addEventListener('mousedown', this.mouseDownHandler);
            document.addEventListener('mousemove', this.mouseMoveHandler);
            document.addEventListener('mouseup', this.mouseUpHandler);
        },
        
        // イベントリスナー削除
        removeEventListeners: function() {
            document.removeEventListener('mousedown', this.mouseDownHandler);
            document.removeEventListener('mousemove', this.mouseMoveHandler);
            document.removeEventListener('mouseup', this.mouseUpHandler);
        },
        
        // マウスダウン処理
        handleMouseDown: function(event) {
            const target = event.target;
            
            // 角ハンドルクリック判定
            if (target.classList.contains('bbox-handle')) {
                this.startHandleOperation(event, target);
            } 
            // 辺エリアクリック判定
            else if (target.classList.contains('bbox-edge-area')) {
                this.startEdgeOperation(event, target);
            }
            // 中央移動エリアクリック判定
            else if (target.classList.contains('bbox-center-area')) {
                this.startMoveOperation(event);
            }
        },
        
        // 角ハンドル操作開始（対角中心拡縮）
        startHandleOperation: function(event, handle) {
            this.dragState.isDragging = true;
            this.dragState.operation = 'corner-resize';
            this.dragState.activeHandle = handle;
            this.dragState.startPos = { x: event.clientX, y: event.clientY };
            
            const targetElement = SpineEditSystem.baseLayer.targetElement;
            const computedStyle = window.getComputedStyle(targetElement);
            
            // CSS値での初期状態を記録（座標系統一）
            this.dragState.startElementRect = {
                left: parseFloat(computedStyle.left),
                top: parseFloat(computedStyle.top),
                width: parseFloat(computedStyle.width),
                height: parseFloat(computedStyle.height)
            };
            
            // 対角点を固定点として記録
            const position = handle.dataset.position;
            this.dragState.fixedPoint = this.getOppositeCornerPoint(position);
            
            event.preventDefault();
            event.stopPropagation();
        },
        
        // 辺操作開始（反対側中心拡縮）
        startEdgeOperation: function(event, edgeArea) {
            this.dragState.isDragging = true;
            this.dragState.operation = 'edge-resize';
            this.dragState.activeHandle = edgeArea;
            this.dragState.startPos = { x: event.clientX, y: event.clientY };
            
            const targetElement = SpineEditSystem.baseLayer.targetElement;
            const computedStyle = window.getComputedStyle(targetElement);
            
            // CSS値での初期状態を記録（座標系統一）
            this.dragState.startElementRect = {
                left: parseFloat(computedStyle.left),
                top: parseFloat(computedStyle.top),
                width: parseFloat(computedStyle.width),
                height: parseFloat(computedStyle.height)
            };
            
            // 反対側の辺を固定点として記録
            const position = edgeArea.dataset.position;
            this.dragState.fixedEdge = this.getOppositeEdge(position);
            
            event.preventDefault();
            event.stopPropagation();
        },
        
        // 【修正2】固定点計算の改善: getBoundingClientRect()で正確な位置取得
        getOppositeCornerPoint: function(position) {
            const targetElement = SpineEditSystem.baseLayer.targetElement;
            const rect = targetElement.getBoundingClientRect();
            const parentRect = targetElement.parentElement.getBoundingClientRect();
            
            // transform: translate(-50%, -50%)を考慮した実際の要素境界を取得
            let fixedPoint;
            switch(position) {
                case 'nw': fixedPoint = { x: rect.right - parentRect.left, y: rect.bottom - parentRect.top }; break; // SE角
                case 'ne': fixedPoint = { x: rect.left - parentRect.left, y: rect.bottom - parentRect.top }; break; // SW角
                case 'sw': fixedPoint = { x: rect.right - parentRect.left, y: rect.top - parentRect.top }; break; // NE角
                case 'se': fixedPoint = { x: rect.left - parentRect.left, y: rect.top - parentRect.top }; break; // NW角
            }
            
            console.log('🔧 修正済み固定点:', { position, fixedPoint, rect, parentRect });
            return fixedPoint;
        },
        
        // 【修正3】反対側の辺座標取得: 親要素基準統一、transform考慮
        getOppositeEdge: function(position) {
            const rect = this.dragState.startElementRect;
            const targetElement = SpineEditSystem.baseLayer.targetElement;
            
            // CSS座標系とJavaScript座標系の整合性を確保
            let oppositeEdge;
            switch(position) {
                case 'n': oppositeEdge = { type: 'horizontal', value: rect.top + rect.height }; break; // 下辺
                case 'e': oppositeEdge = { type: 'vertical', value: rect.left }; break; // 左辺
                case 's': oppositeEdge = { type: 'horizontal', value: rect.top }; break; // 上辺
                case 'w': oppositeEdge = { type: 'vertical', value: rect.left + rect.width }; break; // 右辺
                default: oppositeEdge = { type: 'horizontal', value: rect.top };
            }
            
            console.log('🔧 反対辺計算:', { position, oppositeEdge, rect });
            return oppositeEdge;
        },
        
        // 移動操作開始
        startMoveOperation: function(event) {
            this.dragState.isDragging = true;
            this.dragState.operation = 'move';
            this.dragState.startPos = { x: event.clientX, y: event.clientY };
            
            const targetElement = SpineEditSystem.baseLayer.targetElement;
            const computedStyle = window.getComputedStyle(targetElement);
            this.dragState.startElementRect = {
                left: parseFloat(computedStyle.left),
                top: parseFloat(computedStyle.top)
            };
            
            event.preventDefault();
            event.stopPropagation();
        },
        
        // マウス移動処理
        handleMouseMove: function(event) {
            if (!this.dragState.isDragging) return;
            
            const deltaX = event.clientX - this.dragState.startPos.x;
            const deltaY = event.clientY - this.dragState.startPos.y;
            
            const modifiers = {
                shift: event.shiftKey,    // 縦横比保持
                ctrl: event.ctrlKey,      // Windows: 中心から拡縮
                alt: event.altKey,        // Mac: 中心から拡縮
                meta: event.metaKey       // Mac Command
            };
            
            if (this.dragState.operation === 'move') {
                this.performMove(deltaX, deltaY);
            } else if (this.dragState.operation === 'corner-resize') {
                this.performCornerResize(deltaX, deltaY, modifiers);
            } else if (this.dragState.operation === 'edge-resize') {
                this.performEdgeResize(deltaX, deltaY, modifiers);
            }
        },
        
        // 移動実行
        performMove: function(deltaX, deltaY) {
            const targetElement = SpineEditSystem.baseLayer.targetElement;
            const parentRect = targetElement.parentElement.getBoundingClientRect();
            
            const newLeft = this.dragState.startElementRect.left + deltaX;
            const newTop = this.dragState.startElementRect.top + deltaY;
            
            const newLeftPercent = SpineEditSystem.coords.pxToPercent(newLeft, parentRect.width);
            const newTopPercent = SpineEditSystem.coords.pxToPercent(newTop, parentRect.height);
            
            targetElement.style.left = newLeftPercent + '%';
            targetElement.style.top = newTopPercent + '%';
            
            this.updateBoundingBoxPosition(targetElement);
        },
        
        // 角リサイズ実行（修飾キー対応）
        performCornerResize: function(deltaX, deltaY, modifiers) {
            const targetElement = SpineEditSystem.baseLayer.targetElement;
            const handle = this.dragState.activeHandle;
            const position = handle.dataset.position;
            
            console.log('🔧 シンプル座標系でのリサイズ開始:', { deltaX, deltaY, position, modifiers });
            
            // 座標系完全統一: 全てgetBoundingClientRectベースで統一
            const rect = targetElement.getBoundingClientRect();
            const parentRect = targetElement.parentElement.getBoundingClientRect();
            
            // 全ての座標を親要素基準で統一
            const currentMouseX = (this.dragState.startPos.x + deltaX) - parentRect.left;
            const currentMouseY = (this.dragState.startPos.y + deltaY) - parentRect.top;
            
            // 現在の要素位置も親要素基準で統一
            const currentLeft = rect.left - parentRect.left;
            const currentTop = rect.top - parentRect.top;
            const currentWidth = rect.width;
            const currentHeight = rect.height;
            
            console.log('🔧 統一座標系確認:', { currentMouseX, currentMouseY, currentLeft, currentTop, currentWidth, currentHeight });
            
            let newWidth, newHeight, newLeft, newTop;
            
            // 🔧 Ctrl/Altキー: 中心固定拡縮（優先処理）
            if (modifiers.ctrl || modifiers.alt) {
                console.log('🔧 Ctrl/Altキー中心固定拡縮');
                
                const centerX = currentLeft + currentWidth / 2;
                const centerY = currentTop + currentHeight / 2;
                
                // 中心からマウス位置までの距離を2倍したものが新しいサイズ
                const deltaFromCenterX = Math.abs(currentMouseX - centerX);
                const deltaFromCenterY = Math.abs(currentMouseY - centerY);
                
                newWidth = Math.max(20, deltaFromCenterX * 2);
                newHeight = Math.max(20, deltaFromCenterY * 2);
                
                // Shiftキー併用時: 縦横比保持
                if (modifiers.shift) {
                    const aspectRatio = currentWidth / currentHeight;
                    console.log('🔧 Ctrl+Shift: 中心固定+縦横比保持');
                    
                    // より大きな変化に合わせる
                    if (deltaFromCenterX / currentWidth > deltaFromCenterY / currentHeight) {
                        newHeight = newWidth / aspectRatio;
                    } else {
                        newWidth = newHeight * aspectRatio;
                    }
                }
                
                // 中心固定なので位置は中心から計算
                newLeft = centerX - newWidth / 2;
                newTop = centerY - newHeight / 2;
                
            } else {
                // 🔧 通常の対角固定拡縮
                
                // 対角固定点を取得
                let fixedX, fixedY;
                switch(position) {
                    case 'nw': fixedX = currentLeft + currentWidth; fixedY = currentTop + currentHeight; break;  // SE角固定
                    case 'ne': fixedX = currentLeft; fixedY = currentTop + currentHeight; break;                // SW角固定
                    case 'sw': fixedX = currentLeft + currentWidth; fixedY = currentTop; break;                 // NE角固定
                    case 'se': fixedX = currentLeft; fixedY = currentTop; break;                                // NW角固定
                }
                
                // 基本的なサイズ計算
                newWidth = Math.max(20, Math.abs(currentMouseX - fixedX));
                newHeight = Math.max(20, Math.abs(currentMouseY - fixedY));
                
                // Shiftキー: 縦横比保持
                if (modifiers.shift) {
                    const aspectRatio = currentWidth / currentHeight;
                    console.log('🔧 Shiftキー縦横比保持:', { aspectRatio });
                    
                    // マウス移動量の大きい方向に合わせる
                    const deltaXRatio = Math.abs(currentMouseX - fixedX) / currentWidth;
                    const deltaYRatio = Math.abs(currentMouseY - fixedY) / currentHeight;
                    
                    if (deltaXRatio > deltaYRatio) {
                        // 横方向の変化が大きい場合、幅基準で高さを調整
                        newHeight = newWidth / aspectRatio;
                    } else {
                        // 縦方向の変化が大きい場合、高さ基準で幅を調整
                        newWidth = newHeight * aspectRatio;
                    }
                    
                    console.log('🔧 縦横比保持結果:', { newWidth, newHeight });
                }
                
                // 対角固定での位置計算
                newLeft = Math.min(currentMouseX, fixedX);
                newTop = Math.min(currentMouseY, fixedY);
                
                // Shiftキー使用時の位置補正
                if (modifiers.shift) {
                    // 縦横比調整後のサイズを反映した位置補正
                    switch(position) {
                        case 'nw':
                            newLeft = fixedX - newWidth;
                            newTop = fixedY - newHeight;
                            break;
                        case 'ne':
                            newLeft = fixedX;
                            newTop = fixedY - newHeight;
                            break;
                        case 'sw':
                            newLeft = fixedX - newWidth;
                            newTop = fixedY;
                            break;
                        case 'se':
                            newLeft = fixedX;
                            newTop = fixedY;
                            break;
                    }
                }
            }
            
            // 画面内チェック（親要素基準）
            const parentWidth = parentRect.width;
            const parentHeight = parentRect.height;
            
            if (newLeft < 0 || newTop < 0 || newLeft + newWidth > parentWidth || newTop + newHeight > parentHeight) {
                console.warn('🚨 親要素外配置検出、適用をスキップ');
                return;
            }
            
            // 座標をpx値として直接適用
            targetElement.style.left = newLeft + 'px';
            targetElement.style.top = newTop + 'px';
            targetElement.style.width = newWidth + 'px';
            targetElement.style.height = newHeight + 'px';
            
            // DOM更新を確実に反映させる
            targetElement.offsetHeight; // 強制リフロー
            
            console.log('✅ 修飾キー対応リサイズ完了:', {
                modifiers,
                left: newLeft + 'px',
                top: newTop + 'px', 
                width: newWidth + 'px',
                height: newHeight + 'px'
            });
            
            // バウンディングボックス位置更新
            this.updateBoundingBoxPosition(targetElement);
        },
        
        // 辺拡縮実行（反対側中心）
        performEdgeResize: function(deltaX, deltaY, modifiers) {
            const targetElement = SpineEditSystem.baseLayer.targetElement;
            const parentRect = targetElement.parentElement.getBoundingClientRect();
            const edgeArea = this.dragState.activeHandle;
            const position = edgeArea.dataset.position;
            const fixedEdge = this.dragState.fixedEdge;
            
            // 初期値
            let newWidth = this.dragState.startElementRect.width;
            let newHeight = this.dragState.startElementRect.height;
            let newLeft = this.dragState.startElementRect.left;
            let newTop = this.dragState.startElementRect.top;
            
            // 辺に応じた拡縮計算（反対側固定）
            if (position === 'n') {
                // 上辺：下辺を固定
                newHeight = fixedEdge.value - (this.dragState.startElementRect.top + deltaY);
                newTop = fixedEdge.value - newHeight;
            } else if (position === 's') {
                // 下辺：上辺を固定
                newHeight = (this.dragState.startElementRect.top + this.dragState.startElementRect.height + deltaY) - fixedEdge.value;
            } else if (position === 'w') {
                // 左辺：右辺を固定
                newWidth = fixedEdge.value - (this.dragState.startElementRect.left + deltaX);
                newLeft = fixedEdge.value - newWidth;
            } else if (position === 'e') {
                // 右辺：左辺を固定
                newWidth = (this.dragState.startElementRect.left + this.dragState.startElementRect.width + deltaX) - fixedEdge.value;
            }
            
            // 最小サイズ制限
            newWidth = Math.max(20, newWidth);
            newHeight = Math.max(20, newHeight);
            
            // 【修正2】Shiftキー処理: 辺操作時の縦横比保持機能追加
            if (modifiers.shift) {
                const aspectRatio = this.dragState.startElementRect.width / this.dragState.startElementRect.height;
                
                if (position === 'n' || position === 's') {
                    // 縦方向の変更時、横幅を調整
                    newWidth = newHeight * aspectRatio;
                    newLeft = this.dragState.startElementRect.left + (this.dragState.startElementRect.width - newWidth) / 2;
                } else if (position === 'w' || position === 'e') {
                    // 横方向の変更時、高さを調整
                    newHeight = newWidth / aspectRatio;
                    newTop = this.dragState.startElementRect.top + (this.dragState.startElementRect.height - newHeight) / 2;
                }
                
                console.log('🔧 Shiftキー縦横比保持:', { aspectRatio, newWidth, newHeight, newLeft, newTop });
            }
            
            console.log('🔧 辺拡縮最終計算:', { position, newLeft, newTop, newWidth, newHeight });
            
            // %に変換して適用
            const newLeftPercent = SpineEditSystem.coords.pxToPercent(newLeft, parentRect.width);
            const newTopPercent = SpineEditSystem.coords.pxToPercent(newTop, parentRect.height);
            const newWidthPercent = SpineEditSystem.coords.pxToPercent(newWidth, parentRect.width);
            const newHeightPercent = SpineEditSystem.coords.pxToPercent(newHeight, parentRect.height);
            
            targetElement.style.left = newLeftPercent + '%';
            targetElement.style.top = newTopPercent + '%';
            targetElement.style.width = newWidthPercent + '%';
            targetElement.style.height = newHeightPercent + '%';
            
            this.updateBoundingBoxPosition(targetElement);
        },
        
        // マウスアップ処理
        handleMouseUp: function(event) {
            if (!this.dragState.isDragging) return;
            
            this.dragState.isDragging = false;
            this.dragState.operation = null;
            this.dragState.activeHandle = null;
        },
        
        // バウンディングボックス位置更新
        updateBoundingBoxPosition: function(targetElement) {
            const rect = targetElement.getBoundingClientRect();
            const parentRect = targetElement.parentElement.getBoundingClientRect();
            
            this.boundingBox.style.left = (rect.left - parentRect.left) + 'px';
            this.boundingBox.style.top = (rect.top - parentRect.top) + 'px';
            this.boundingBox.style.width = rect.width + 'px';
            this.boundingBox.style.height = rect.height + 'px';
        },
        
        // バウンディングボックス削除
        removeBoundingBox: function() {
            if (this.boundingBox) {
                this.boundingBox.remove();
                this.boundingBox = null;
                this.handles = [];
            }
        }
    };
    
    console.log('✅ バウンディングボックスモジュール作成完了');
    return module;
}

console.log('✅ Spine Bounding Box Module モジュール読み込み完了');

// Global export
window.createBoundingBoxModule = createBoundingBoxModule;