// 🎯 Spine編集システム - バウンディングボックスモジュール (Electron版)
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
        targetElement: null, // 🚀 v3機能移植: 対象要素の参照保持
        targetCharacterId: null, // 🚀 v3機能移植: 個別キャラクター特定用
        dragState: {
            isDragging: false,
            startPos: { x: 0, y: 0 },
            startElementRect: {},
            activeHandle: null,
            operation: null
        },
        
        // モジュール初期化（個別キャラクター対応強化）
        initialize: function(targetElement) {
            console.log('🔧 バウンディングボックス初期化（個別キャラクター制御）');
            
            // 🚀 v3機能移植: 個別キャラクター特定
            this.targetElement = targetElement;
            this.targetCharacterId = this.identifyCharacter(targetElement);
            console.log(`🎯 対象キャラクター特定: ${this.targetCharacterId}`);
            
            // 🔧 座標系スワップ機能：複雑座標系（%値+transform）→シンプル座標系（px値のみ）
            if (!SpineEditSystem.coordinateSwap.isSwapped) {
                console.log('🔄 座標系スワップ開始: 複雑座標系→シンプル座標系');
                SpineEditSystem.coordinateSwap.enterEditMode(targetElement);
            }
            
            this.createBoundingBox(targetElement);
            this.setupEventListeners();
            this.setupKeyboardShortcuts(); // 🚀 v3機能移植: ショートカットキー
            this.isActive = true;
        },
        
        // モジュールクリーンアップ（個別キャラクター対応強化）
        cleanup: function() {
            console.log(`🧹 バウンディングボックスクリーンアップ（${this.targetCharacterId}）`);
            this.removeBoundingBox();
            this.removeEventListeners();
            this.removeKeyboardShortcuts(); // 🚀 v3機能移植: ショートカットキー削除
            this.isActive = false;
            
            // 🔧 座標系復元機能：シンプル座標系（px値のみ）→元の複雑座標系（%値+transform）
            if (this.targetElement && SpineEditSystem.coordinateSwap.isSwapped) {
                console.log('🔄 座標系復元開始: シンプル座標系→元の複雑座標系');
                SpineEditSystem.coordinateSwap.exitEditMode(this.targetElement);
            }
        },
        
        // 🛡️ skeleton座標保護機能
        protectSkeletonCoordinates: function(characterId, targetElement) {
            try {
                // Spineキャラクターのskeleton情報を取得・保護
                if (window.spineSkeletonDebug) {
                    for (const [name, skeleton] of window.spineSkeletonDebug) {
                        if (name.includes(characterId) || characterId.includes(name)) {
                            SpineEditSystem.skeletonProtection.backupSkeletonCoords(characterId, skeleton);
                            break;
                        }
                    }
                }
            } catch (error) {
                console.warn('⚠️ skeleton座標保護でエラー（編集は継続）:', error);
            }
        },
        
        // バウンディングボックス作成（Electron版）
        createBoundingBox: function(targetElement) {
            const rect = targetElement.getBoundingClientRect();
            const parentRect = targetElement.parentElement.getBoundingClientRect();
            
            // Electron版用のキャラクター名取得
            const characterName = targetElement.id || 'Spine Canvas';
            
            // バウンディングボックス本体（選択中は実線、より目立つ色）
            this.boundingBox = document.createElement('div');
            this.boundingBox.id = 'spine-bounding-box';
            // 🔧 Electron用バウンディングボックスサイズ調整
            const boundingWidth = Math.min(rect.width, 300); // 最大300px
            const boundingHeight = Math.min(rect.height, 200); // 最大200px
            
            this.boundingBox.style.cssText = `
                position: absolute;
                border: 2px solid #007acc;
                background: rgba(0, 122, 204, 0.15);
                pointer-events: none;
                z-index: 9999;
                left: ${rect.left - parentRect.left}px;
                top: ${rect.top - parentRect.top}px;
                width: ${boundingWidth}px;
                height: ${boundingHeight}px;
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
                // 角ハンドル（リサイズ用）
                { position: 'nw', type: 'corner', cursor: 'nw-resize', opposite: 'se' },
                { position: 'ne', type: 'corner', cursor: 'ne-resize', opposite: 'sw' },
                { position: 'sw', type: 'corner', cursor: 'sw-resize', opposite: 'ne' },
                { position: 'se', type: 'corner', cursor: 'se-resize', opposite: 'nw' },
                // 辺ハンドル（一方向リサイズ用）
                { position: 'n', type: 'edge', cursor: 'n-resize', opposite: 's' },
                { position: 'e', type: 'edge', cursor: 'e-resize', opposite: 'w' },
                { position: 's', type: 'edge', cursor: 's-resize', opposite: 'n' },
                { position: 'w', type: 'edge', cursor: 'w-resize', opposite: 'e' }
            ];
            
            handleConfigs.forEach(config => {
                const handle = document.createElement('div');
                handle.className = `bbox-handle ${config.type}`;
                handle.dataset.position = config.position;
                handle.dataset.cursor = config.cursor;
                handle.dataset.opposite = config.opposite;
                handle.dataset.type = config.type;
                
                // ハンドルスタイル
                const isCorner = config.type === 'corner';
                handle.style.cssText = `
                    position: absolute;
                    background: #fff;
                    border: 2px solid #667eea;
                    pointer-events: all;
                    z-index: 10001;
                    cursor: ${config.cursor};
                    width: ${isCorner ? '12px' : '8px'};
                    height: ${isCorner ? '12px' : '8px'};
                    border-radius: ${isCorner ? '50%' : '2px'};
                    transition: all 0.1s ease;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                `;
                
                // ハンドル位置設定
                this.positionHandle(handle, config.position, config.type);
                
                // ホバー効果
                handle.addEventListener('mouseenter', () => {
                    handle.style.background = '#667eea';
                    handle.style.transform = 'scale(1.2)';
                });
                
                handle.addEventListener('mouseleave', () => {
                    handle.style.background = '#fff';
                    handle.style.transform = 'scale(1)';
                });
                
                this.boundingBox.appendChild(handle);
                this.handles.push({ element: handle, config });
            });
            
        },
        
        // ハンドル位置設定
        positionHandle: function(handle, position, type) {
            const offset = type === 'corner' ? -6 : -4;
            
            switch(position) {
                case 'nw':
                    handle.style.top = '0';
                    handle.style.left = '0';
                    handle.style.margin = `${offset}px 0 0 ${offset}px`;
                    break;
                case 'ne':
                    handle.style.top = '0';
                    handle.style.right = '0';
                    handle.style.margin = `${offset}px ${offset}px 0 0`;
                    break;
                case 'sw':
                    handle.style.bottom = '0';
                    handle.style.left = '0';
                    handle.style.margin = `0 0 ${offset}px ${offset}px`;
                    break;
                case 'se':
                    handle.style.bottom = '0';
                    handle.style.right = '0';
                    handle.style.margin = `0 ${offset}px ${offset}px 0`;
                    break;
                case 'n':
                    handle.style.top = '0';
                    handle.style.left = '50%';
                    handle.style.transform = `translateX(-50%) translateY(${offset}px)`;
                    break;
                case 'e':
                    handle.style.right = '0';
                    handle.style.top = '50%';
                    handle.style.transform = `translateY(-50%) translateX(${-offset}px)`;
                    break;
                case 's':
                    handle.style.bottom = '0';
                    handle.style.left = '50%';
                    handle.style.transform = `translateX(-50%) translateY(${-offset}px)`;
                    break;
                case 'w':
                    handle.style.left = '0';
                    handle.style.top = '50%';
                    handle.style.transform = `translateY(-50%) translateX(${offset}px)`;
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
                cursor: move;
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
            
            // ハンドルクリック判定（角ハンドル・辺ハンドル統合）
            if (target.classList.contains('bbox-handle')) {
                this.startHandleOperation(event, target);
            } 
            // 中央移動エリアクリック判定
            else if (target.classList.contains('bbox-center-area')) {
                this.startMoveOperation(event);
            }
        },
        
        // ハンドル操作開始（角・辺ハンドル統合）
        startHandleOperation: function(event, handle) {
            this.dragState.isDragging = true;
            
            // ハンドルタイプを取得して操作モードを決定
            const handleType = handle.dataset.type || 'corner'; // type未設定時は角ハンドルとみなす
            this.dragState.operation = handleType === 'corner' ? 'corner-resize' : 'edge-resize';
            
            this.dragState.activeHandle = handle;
            this.dragState.startPos = { x: event.clientX, y: event.clientY };
            
            const targetElement = this.targetElement;
            const computedStyle = window.getComputedStyle(targetElement);
            
            // CSS値での初期状態を記録（座標系統一）
            this.dragState.startElementRect = {
                left: parseFloat(computedStyle.left),
                top: parseFloat(computedStyle.top),
                width: parseFloat(computedStyle.width),
                height: parseFloat(computedStyle.height)
            };
            
            document.body.style.cursor = handle.dataset.cursor;
            console.log(`🎯 ${handleType} ハンドル操作開始:`, handle.dataset.position);
            
            event.preventDefault();
            event.stopPropagation();
        },
        
        // 移動操作開始
        startMoveOperation: function(event) {
            this.dragState.isDragging = true;
            this.dragState.operation = 'move';
            this.dragState.startPos = { x: event.clientX, y: event.clientY };
            
            const targetElement = this.targetElement;
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
            } else if (this.dragState.operation === 'corner-resize' || this.dragState.operation === 'edge-resize') {
                this.performCornerResize(deltaX, deltaY, modifiers);
            }
        },
        
        // 移動実行（%値変換の核心）
        performMove: function(deltaX, deltaY) {
            const targetElement = this.targetElement;
            const parentRect = targetElement.parentElement.getBoundingClientRect();
            
            // 🔧 重要：px座標で計算してから%値に変換
            const newLeft = this.dragState.startElementRect.left + deltaX;
            const newTop = this.dragState.startElementRect.top + deltaY;
            
            // 🔧 重要：px値から%値への変換
            const newLeftPercent = SpineEditSystem.coords.pxToPercent(newLeft, parentRect.width);
            const newTopPercent = SpineEditSystem.coords.pxToPercent(newTop, parentRect.height);
            
            // 🔧 重要：%値で設定（座標系スワップ中でも%値使用）
            targetElement.style.left = newLeftPercent + '%';
            targetElement.style.top = newTopPercent + '%';
            
            // 🔧 重要：skeleton座標は基本的に触らない
            // skeleton座標の強制リセットは絶対に禁止
            
            this.updateBoundingBoxPosition(targetElement);
            
            console.log(`📐 移動処理: delta(${deltaX}, ${deltaY}) → (${newLeftPercent}%, ${newTopPercent}%)`);
        },
        
        // 角リサイズ実行（完全な対角固定拡縮実装）
        performCornerResize: function(deltaX, deltaY, modifiers) {
            const targetElement = this.targetElement;
            const handle = this.dragState.activeHandle;
            const position = handle.dataset.position;
            
            console.log('🔧 対角固定リサイズ開始:', { deltaX, deltaY, position, modifiers });
            
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
            
            // Ctrl/Altキー: 中心固定拡縮（優先処理）
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
                // 🎯 対角固定拡縮
                
                // 対角固定点を取得
                let fixedX, fixedY;
                switch(position) {
                    case 'nw': fixedX = currentLeft + currentWidth; fixedY = currentTop + currentHeight; break;  // SE角固定
                    case 'ne': fixedX = currentLeft; fixedY = currentTop + currentHeight; break;                // SW角固定
                    case 'sw': fixedX = currentLeft + currentWidth; fixedY = currentTop; break;                 // NE角固定
                    case 'se': fixedX = currentLeft; fixedY = currentTop; break;                                // NW角固定
                    case 'n': fixedX = currentLeft + currentWidth / 2; fixedY = currentTop + currentHeight; break; // 下辺中央固定
                    case 'e': fixedX = currentLeft; fixedY = currentTop + currentHeight / 2; break;             // 左辺中央固定
                    case 's': fixedX = currentLeft + currentWidth / 2; fixedY = currentTop; break;             // 上辺中央固定
                    case 'w': fixedX = currentLeft + currentWidth; fixedY = currentTop + currentHeight / 2; break; // 右辺中央固定
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
                if (position.includes('corner') || ['nw', 'ne', 'sw', 'se'].includes(position)) {
                    newLeft = Math.min(currentMouseX, fixedX);
                    newTop = Math.min(currentMouseY, fixedY);
                    
                    // Shiftキー使用時の位置補正
                    if (modifiers.shift) {
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
                } else {
                    // 辺の場合は片側のみ変更
                    newLeft = currentLeft;
                    newTop = currentTop;
                    
                    if (position === 'n' || position === 's') {
                        newLeft = fixedX - newWidth / 2;
                        if (position === 'n') newTop = fixedY - newHeight;
                    } else {
                        newTop = fixedY - newHeight / 2;
                        if (position === 'w') newLeft = fixedX - newWidth;
                    }
                }
            }
            
            // 🔧 修正：境界チェックを緩和（対角固定を優先）
            const parentWidth = parentRect.width;
            const parentHeight = parentRect.height;
            const margin = 10; // 10pxのマージンを許可
            
            // 最小サイズとマージンを考慮した境界チェック
            if (newLeft < -margin || newTop < -margin || 
                newLeft + newWidth > parentWidth + margin || 
                newTop + newHeight > parentHeight + margin ||
                newWidth < 20 || newHeight < 20) {
                console.warn('🚨 境界制限により適用をスキップ（マージン考慮）');
                console.log('🚨 境界チェック詳細:', { 
                    newLeft, newTop, newWidth, newHeight,
                    parentWidth, parentHeight, margin,
                    checks: {
                        leftOK: newLeft >= -margin,
                        topOK: newTop >= -margin,
                        rightOK: newLeft + newWidth <= parentWidth + margin,
                        bottomOK: newTop + newHeight <= parentHeight + margin,
                        widthOK: newWidth >= 20,
                        heightOK: newHeight >= 20
                    }
                });
                return;
            }
            
            // 座標をpx値として直接適用
            targetElement.style.left = newLeft + 'px';
            targetElement.style.top = newTop + 'px';
            targetElement.style.width = newWidth + 'px';
            targetElement.style.height = newHeight + 'px';
            
            // DOM更新を確実に反映させる
            targetElement.offsetHeight; // 強制リフロー
            
            console.log('✅ 対角固定リサイズ完了:', {
                operation: modifiers.ctrl || modifiers.alt ? 'center-fixed' : 'diagonal-fixed',
                modifiers,
                position,
                result: {
                    left: newLeft + 'px',
                    top: newTop + 'px', 
                    width: newWidth + 'px',
                    height: newHeight + 'px'
                }
            });
            
            // バウンディングボックス位置更新
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
        },
        
        // 🚀 v3機能移植: キャラクター特定機能
        identifyCharacter: function(element) {
            // 要素のIDやクラスから特定
            if (element.id) {
                return element.id;
            }
            
            // canvasの場合、親要素から特定
            if (element.tagName === 'CANVAS') {
                const parent = element.parentElement;
                if (parent && parent.id) {
                    return parent.id;
                }
            }
            
            // キャラクタータイプの推定
            const classList = Array.from(element.classList || []);
            for (const cls of classList) {
                if (cls.includes('purattokun') || cls.includes('nezumi')) {
                    return cls;
                }
            }
            
            return 'unknown-character';
        },
        
        // 🚀 v3機能移植: ショートカットキー設定
        setupKeyboardShortcuts: function() {
            this.keydownHandler = this.handleKeyDown.bind(this);
            document.addEventListener('keydown', this.keydownHandler);
            console.log('⌨️ ショートカットキー設定完了（矢印キー移動）');
        },
        
        // 🚀 v3機能移植: ショートカットキー削除
        removeKeyboardShortcuts: function() {
            if (this.keydownHandler) {
                document.removeEventListener('keydown', this.keydownHandler);
                this.keydownHandler = null;
                console.log('⌨️ ショートカットキー削除完了');
            }
        },
        
        // 🚀 v3機能移植: キーボード操作ハンドラー（矢印キー移動）
        handleKeyDown: function(event) {
            if (!this.isActive || !this.targetElement) return;
            
            // 矢印キーのみ処理
            const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
            if (!arrowKeys.includes(event.code)) return;
            
            event.preventDefault();
            
            // 修飾キーによる移動量調整
            let stepSize = 1; // 基本移動量（1px）
            if (event.shiftKey) stepSize = 10; // Shift: 10px
            if (event.ctrlKey || event.metaKey) stepSize = 0.1; // Ctrl/Cmd: 0.1px（精密移動）
            
            const computedStyle = window.getComputedStyle(this.targetElement);
            const currentLeft = parseFloat(computedStyle.left) || 0;
            const currentTop = parseFloat(computedStyle.top) || 0;
            
            let newLeft = currentLeft;
            let newTop = currentTop;
            
            // 方向別の移動処理
            switch (event.code) {
                case 'ArrowLeft':
                    newLeft = currentLeft - stepSize;
                    break;
                case 'ArrowRight':
                    newLeft = currentLeft + stepSize;
                    break;
                case 'ArrowUp':
                    newTop = currentTop - stepSize;
                    break;
                case 'ArrowDown':
                    newTop = currentTop + stepSize;
                    break;
            }
            
            // 位置更新（px値で直接設定）
            this.targetElement.style.left = newLeft + 'px';
            this.targetElement.style.top = newTop + 'px';
            
            // バウンディングボックス位置も同期
            this.updateBoundingBoxPosition(this.targetElement);
            
            console.log(`⌨️ ${this.targetCharacterId}: 矢印キー移動 (${event.code}, ${stepSize}px)`);
        },
        
        // 🧪 テスト・デバッグ機能
        debugInfo: function() {
            if (!this.isActive || !this.targetElement) {
                console.log('❌ バウンディングボックス非アクティブ');
                return;
            }
            
            const targetElement = this.targetElement;
            const computedStyle = window.getComputedStyle(targetElement);
            const rect = targetElement.getBoundingClientRect();
            const parentRect = targetElement.parentElement.getBoundingClientRect();
            
            console.group('🔍 バウンディングボックス詳細情報');
            console.log('📋 基本情報:', {
                characterId: this.targetCharacterId,
                isActive: this.isActive,
                isDragging: this.dragState.isDragging
            });
            console.log('📐 CSS座標:', {
                left: computedStyle.left,
                top: computedStyle.top,
                width: computedStyle.width,
                height: computedStyle.height,
                transform: computedStyle.transform
            });
            console.log('📊 実際の描画位置:', {
                screenLeft: rect.left,
                screenTop: rect.top,
                parentRelativeLeft: rect.left - parentRect.left,
                parentRelativeTop: rect.top - parentRect.top,
                width: rect.width,
                height: rect.height
            });
            console.log('🔄 座標系状態:', {
                isSwapped: SpineEditSystem.coordinateSwap.isSwapped,
                hasBackup: !!SpineEditSystem.coordinateSwap.backup.left
            });
            
            // skeleton座標確認
            if (window.spineSkeletonDebug) {
                for (const [name, skeleton] of window.spineSkeletonDebug) {
                    if (name.includes(this.targetCharacterId)) {
                        console.log('🦴 Skeleton座標:', {
                            name: name,
                            x: skeleton.x,
                            y: skeleton.y,
                            scaleX: skeleton.scaleX,
                            scaleY: skeleton.scaleY
                        });
                        break;
                    }
                }
            }
            console.groupEnd();
        },
        
        // 🧪 修飾キーテスト機能
        testModifierKeys: function() {
            console.group('🎮 修飾キーテスト実行');
            console.log('📋 修飾キー対応一覧:');
            console.log('  - Shift: 縦横比保持リサイズ');
            console.log('  - Ctrl: 中心固定リサイズ (Windows)');
            console.log('  - Alt: 中心固定リサイズ (Mac)');
            console.log('  - Ctrl+Shift: 中心固定+縦横比保持');
            console.log('  - Alt+Shift: 中心固定+縦横比保持');
            console.log('');
            console.log('🎯 テスト手順:');
            console.log('  1. 角ハンドルを各修飾キーと組み合わせてドラッグ');
            console.log('  2. 辺ハンドルを各修飾キーと組み合わせてドラッグ');
            console.log('  3. コンソールで動作ログを確認');
            console.groupEnd();
        }
    };
    
    // グローバルアクセス（デバッグ用）
    window.SpineEditSystem = SpineEditSystem;
    
    console.log('✅ バウンディングボックスモジュール作成完了');
    return module;
}

console.log('✅ Spine Bounding Box Module モジュール読み込み完了');

// Global export
window.createBoundingBoxModule = createBoundingBoxModule;