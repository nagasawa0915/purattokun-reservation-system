// 🎯 Spine Editor Desktop v3.0 - Bounding Box Module（Web版完全準拠）
// Web版の動作パターンを完全再現：%値変換・skeleton座標保護
// 機能: ドラッグ・リサイズ・ハンドル操作（Canvas要素のみ変更）

console.log('📦 Spine Bounding Box Module v3.0 初期化開始（Web版準拠）');

// ========== SpineEditSystem移植（WebアプリからV3用に簡略化） ========== //

const SpineEditSystemV3 = {
    // ターゲット要素管理
    baseLayer: {
        targetElement: null,
        initialPosition: { left: null, top: null, width: null, height: null }
    },
    
    // 座標系スワップ機能（重要：transform競合回避）
    coordinateSwap: {
        backup: {
            left: null,
            top: null,
            width: null,
            height: null,
            transform: null
        },
        isSwapped: false,
        
        // 編集開始時：複雑座標系→シンプル絶対座標
        enterEditMode: function(element) {
            console.log('🔄 v3座標系スワップ開始 - 複雑座標→シンプル座標');
            
            // 🔧 重要：getBoundingClientRectは親要素基準の座標が必要
            const rect = element.getBoundingClientRect();
            const parentRect = element.parentElement.getBoundingClientRect();
            
            // 元の座標系を完全バックアップ
            this.backup = {
                left: element.style.left,
                top: element.style.top,
                width: element.style.width,
                height: element.style.height,
                transform: element.style.transform
            };
            
            console.log('💾 元座標系バックアップ:', this.backup);
            console.log('📐 変換前の実際の描画位置:', {
                'element rect': rect,
                'parent rect': parentRect,
                'relative left': rect.left - parentRect.left,
                'relative top': rect.top - parentRect.top
            });
            
            // 🔧 修正：親要素基準の相対座標に変換（より精密）
            // 絶対座標ではなく親要素基準の座標を使用してずれを最小化
            const relativeLeft = rect.left - parentRect.left;
            const relativeTop = rect.top - parentRect.top;
            
            element.style.left = relativeLeft + 'px';
            element.style.top = relativeTop + 'px';
            element.style.width = rect.width + 'px';
            element.style.height = rect.height + 'px';
            element.style.transform = 'none'; // 🔧 競合完全排除
            
            this.isSwapped = true;
            
            console.log('✅ シンプル座標変換完了（親要素基準）:', {
                left: relativeLeft + 'px',
                top: relativeTop + 'px',
                width: rect.width + 'px',
                height: rect.height + 'px',
                transform: 'none'
            });
        },
        
        // 編集終了時：シンプル絶対座標→元の複雑座標系
        exitEditMode: function(element) {
            if (!this.isSwapped) return;
            
            console.log('🔄 v3座標系復元開始 - シンプル座標→元座標系');
            
            if (!element) {
                console.log('⚠️ 要素undefined、座標系復元スキップ');
                this.isSwapped = false;
                return;
            }
            
            // 編集後の絶対座標を取得
            const editedRect = element.getBoundingClientRect();
            const parentRect = element.parentElement.getBoundingClientRect();
            
            // 元の座標系形式（%値 + transform）に変換
            // 重要：中央原点（transform: translate(-50%, -50%)）を考慮
            const newLeftPercent = ((editedRect.left + editedRect.width/2 - parentRect.left) / parentRect.width) * 100;
            const newTopPercent = ((editedRect.top + editedRect.height/2 - parentRect.top) / parentRect.height) * 100;
            const newWidthPercent = (editedRect.width / parentRect.width) * 100;
            const newHeightPercent = (editedRect.height / parentRect.height) * 100;
            
            // 元の形式で適用
            element.style.left = newLeftPercent.toFixed(1) + '%';
            element.style.top = newTopPercent.toFixed(1) + '%';
            element.style.width = newWidthPercent.toFixed(1) + '%';
            element.style.height = newHeightPercent.toFixed(1) + '%';
            element.style.transform = 'translate(-50%, -50%)'; // 🔧 元transform復元
            
            console.log('✅ 元座標系復元完了:', {
                left: newLeftPercent.toFixed(1) + '%',
                top: newTopPercent.toFixed(1) + '%',
                width: newWidthPercent.toFixed(1) + '%',
                height: newHeightPercent.toFixed(1) + '%',
                transform: 'translate(-50%, -50%)'
            });
            
            this.isSwapped = false;
        }
    },
    
    // 座標変換ヘルパー
    coords: {
        // px→%変換（親要素基準）
        pxToPercent: function(pxValue, parentSize) {
            return ((pxValue / parentSize) * 100).toFixed(1);
        },
        
        // %→px変換（親要素基準）
        percentToPx: function(percentValue, parentSize) {
            return (parseFloat(percentValue) / 100) * parentSize;
        }
    }
};

// ========== バウンディングボックスモジュール v3.0 ========== //

class SpineBoundingBox {
    constructor() {
        this.boundingBox = null;
        this.handles = [];
        this.isActive = false;
        this.targetElement = null;
        this.dragState = {
            isDragging: false,
            startPos: { x: 0, y: 0 },
            startElementRect: {},
            activeHandle: null,
            operation: null
        };
        
        console.log('📦 SpineBoundingBox v3.0 初期化完了（SpineEditSystemV3統合）');
    }

    // ========== 公開API ========== //
    
    // バウンディングボックス開始
    startEdit(targetElement) {
        if (!targetElement) {
            console.error('❌ 対象要素が指定されていません');
            return false;
        }
        
        this.targetElement = targetElement;
        
        // 🔧 重要：座標系スワップを実行（transform競合回避）
        SpineEditSystemV3.baseLayer.targetElement = targetElement;
        SpineEditSystemV3.coordinateSwap.enterEditMode(targetElement);
        
        this.createBoundingBox(targetElement);
        this.setupEventListeners();
        this.isActive = true;
        
        console.log('✅ バウンディングボックス編集開始（座標系スワップ適用済み）');
        return true;
    }
    
    // バウンディングボックス終了
    endEdit() {
        // 🔧 重要：座標系を元に復元（%値 + transform復元）
        if (this.targetElement && SpineEditSystemV3.coordinateSwap.isSwapped) {
            SpineEditSystemV3.coordinateSwap.exitEditMode(this.targetElement);
        }
        
        this.cleanup();
        console.log('✅ バウンディングボックス編集終了（座標系復元済み）');
    }
    
    // ========== バウンディングボックス作成 ========== //
    
    createBoundingBox(targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const parentElement = targetElement.parentElement;
        const parentRect = parentElement.getBoundingClientRect();
        
        // キャラクター名取得
        const characterName = targetElement.getAttribute('data-character-name') || 
                            targetElement.id.replace('-canvas', '') || 'Character';
        
        // バウンディングボックス本体作成
        this.boundingBox = document.createElement('div');
        this.boundingBox.id = 'spine-bounding-box-v3';
        this.boundingBox.style.cssText = `
            position: absolute;
            border: 2px solid #667eea;
            background: rgba(102, 126, 234, 0.1);
            pointer-events: none;
            z-index: 10000;
            left: ${rect.left - parentRect.left}px;
            top: ${rect.top - parentRect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            box-shadow: 0 0 12px rgba(102, 126, 234, 0.3);
            transition: all 0.1s ease;
        `;
        
        // キャラクター名ラベル
        const label = document.createElement('div');
        label.style.cssText = `
            position: absolute;
            top: -28px;
            left: 0;
            background: #667eea;
            color: white;
            padding: 4px 10px;
            font-size: 12px;
            font-weight: bold;
            border-radius: 4px;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        label.textContent = `📝 ${characterName} 編集中`;
        this.boundingBox.appendChild(label);
        
        parentElement.appendChild(this.boundingBox);
        
        // ハンドル作成
        this.createHandles();
        
        // 中央ドラッグエリア作成
        this.createCenterArea();
        
        console.log(`📦 ${characterName} バウンディングボックス作成完了`);
    }
    
    // ハンドル作成
    createHandles() {
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
            handle.className = `bbox-handle-v3 ${config.type}`;
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
    }
    
    // ハンドル位置設定
    positionHandle(handle, position, type) {
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
    }
    
    // 中央ドラッグエリア作成
    createCenterArea() {
        const centerArea = document.createElement('div');
        centerArea.className = 'bbox-center-area-v3';
        centerArea.style.cssText = `
            position: absolute;
            top: 20%;
            left: 20%;
            width: 60%;
            height: 60%;
            cursor: move;
            pointer-events: all;
            z-index: 9999;
            background: transparent;
        `;
        
        // 中央アイコン表示
        const icon = document.createElement('div');
        icon.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 16px;
            color: #667eea;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            pointer-events: none;
        `;
        icon.innerHTML = '⤺';
        centerArea.appendChild(icon);
        
        this.boundingBox.appendChild(centerArea);
    }
    
    // ========== イベント処理 ========== //
    
    setupEventListeners() {
        // ハンドルイベント
        this.handles.forEach(({ element, config }) => {
            element.addEventListener('mousedown', (e) => this.handleMouseDown(e, config));
        });
        
        // 中央エリアイベント
        const centerArea = this.boundingBox.querySelector('.bbox-center-area-v3');
        if (centerArea) {
            centerArea.addEventListener('mousedown', (e) => this.handleCenterMouseDown(e));
        }
        
        // グローバルイベント
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }
    
    removeEventListeners() {
        document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    }
    
    // ハンドルマウスダウン
    handleMouseDown(e, config) {
        e.preventDefault();
        e.stopPropagation();
        
        this.dragState.isDragging = true;
        this.dragState.startPos = { x: e.clientX, y: e.clientY };
        this.dragState.activeHandle = config;
        this.dragState.operation = config.type === 'corner' ? 'resize-corner' : 'resize-edge';
        
        // 🔧 修正：Webアプリと同じcomputedStyle方式を使用
        const targetElement = SpineEditSystemV3.baseLayer.targetElement;
        const computedStyle = window.getComputedStyle(targetElement);
        
        // Webアプリ準拠：座標系スワップ後のcomputedStyleから取得
        this.dragState.startElementRect = {
            left: parseFloat(computedStyle.left),
            top: parseFloat(computedStyle.top),
            width: parseFloat(computedStyle.width),
            height: parseFloat(computedStyle.height)
        };
        
        document.body.style.cursor = config.cursor;
        console.log(`🎯 ${config.type} ハンドル操作開始:`, config.position);
        console.log('📐 座標系スワップ後のcomputedStyle:', this.dragState.startElementRect);
    }
    
    // 中央エリアマウスダウン
    handleCenterMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this.dragState.isDragging = true;
        this.dragState.startPos = { x: e.clientX, y: e.clientY };
        this.dragState.operation = 'move';
        
        // 🔧 修正：Webアプリと同じcomputedStyle方式を使用
        const targetElement = SpineEditSystemV3.baseLayer.targetElement;
        const computedStyle = window.getComputedStyle(targetElement);
        
        // Webアプリ準拠：座標系スワップ後のcomputedStyleから取得
        this.dragState.startElementRect = {
            left: parseFloat(computedStyle.left),
            top: parseFloat(computedStyle.top)
        };
        
        document.body.style.cursor = 'move';
        console.log('🎯 移動操作開始');
        console.log('📐 座標系スワップ後のcomputedStyle:', this.dragState.startElementRect);
    }
    
    // マウス移動（Webアプリ完全準拠）
    handleMouseMove(e) {
        if (!this.dragState.isDragging) return;
        
        // 🔧 Webアプリ方式：開始位置からの累積差分（startPos更新なし）
        const deltaX = e.clientX - this.dragState.startPos.x;
        const deltaY = e.clientY - this.dragState.startPos.y;
        
        // 🔧 修飾キー情報を取得（Webアプリと同じ）
        const modifiers = {
            shift: e.shiftKey,    // 縦横比保持
            ctrl: e.ctrlKey,      // Windows: 中心から拡縮
            alt: e.altKey,        // Mac: 中心から拡縮
            meta: e.metaKey       // Mac Command
        };
        
        switch(this.dragState.operation) {
            case 'move':
                this.handleMove(deltaX, deltaY);
                break;
            case 'resize-corner':
            case 'resize-edge':
                this.handleResize(deltaX, deltaY, modifiers);
                break;
        }
        
        // バウンディングボックス位置更新
        this.updateBoundingBoxPosition();
    }
    
    // マウスアップ
    handleMouseUp(e) {
        if (!this.dragState.isDragging) return;
        
        this.dragState.isDragging = false;
        this.dragState.operation = null;
        this.dragState.activeHandle = null;
        
        document.body.style.cursor = '';
        console.log('✅ 操作完了');
    }
    
    // ========== 操作処理 ========== //
    
    // 移動処理（Web版準拠 - %値変換処理）
    handleMove(deltaX, deltaY) {
        const targetElement = SpineEditSystemV3.baseLayer.targetElement;
        const parentRect = targetElement.parentElement.getBoundingClientRect();
        
        // 🔧 Web版準拠：px座標で計算してから%値に変換
        const newLeft = this.dragState.startElementRect.left + deltaX;
        const newTop = this.dragState.startElementRect.top + deltaY;
        
        // 🔧 Web版準拠：px値から%値への変換
        const newLeftPercent = SpineEditSystemV3.coords.pxToPercent(newLeft, parentRect.width);
        const newTopPercent = SpineEditSystemV3.coords.pxToPercent(newTop, parentRect.height);
        
        // 🔧 Web版準拠：%値で設定（座標系スワップ中でも%値使用）
        targetElement.style.left = newLeftPercent + '%';
        targetElement.style.top = newTopPercent + '%';
        
        // 🔧 Web版準拠：skeleton座標は基本的に触らない
        // skeleton座標の強制リセットを削除
        
        // バウンディングボックス位置更新
        this.updateBoundingBoxPosition(targetElement);
        
        // 座標更新をログ出力
        console.log(`📐 移動処理（Web版準拠）: delta(${deltaX}, ${deltaY}) → (${newLeftPercent}%, ${newTopPercent}%)`);
    }
    
    // リサイズ処理（Webアプリ完全準拠 - 修飾キー対応）
    handleResize(deltaX, deltaY, modifiers = {}) {
        const handle = this.dragState.activeHandle;
        if (!handle) return;
        
        const targetElement = SpineEditSystemV3.baseLayer.targetElement;
        const position = handle.position;
        
        console.log('🔧 リサイズ開始（Webアプリ準拠）:', { deltaX, deltaY, position, modifiers });
        
        // 🔧 Webアプリ方式：getBoundingClientRectベースで現在状態取得
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
        
        // 🔧 Ctrl/Altキー: 中心固定拡縮（最優先処理）
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
        
        // 🔧 DOM更新を確実に反映させる（Webアプリと同じ）
        targetElement.offsetHeight; // 強制リフロー
        
        console.log('✅ 修飾キー対応リサイズ完了:', {
            modifiers,
            left: newLeft + 'px',
            top: newTop + 'px', 
            width: newWidth + 'px',
            height: newHeight + 'px'
        });
        
        // 🔧 Web版準拠：skeleton座標は基本的に触らない
        // skeleton座標の強制リセットを削除
    }
    
    // バウンディングボックス位置更新（Webアプリ準拠）
    updateBoundingBoxPosition(targetElement) {
        if (!this.boundingBox || !targetElement) return;
        
        // 🔧 Webアプリ準拠：getBoundingClientRectで実際の位置を取得
        const rect = targetElement.getBoundingClientRect();
        const parentRect = targetElement.parentElement.getBoundingClientRect();
        
        this.boundingBox.style.left = (rect.left - parentRect.left) + 'px';
        this.boundingBox.style.top = (rect.top - parentRect.top) + 'px';
        this.boundingBox.style.width = rect.width + 'px';
        this.boundingBox.style.height = rect.height + 'px';
        
        // デバッグ情報
        if (this.dragState.isDragging) {
            console.log('📐 バウンディングボックス位置更新（Webアプリ準拠）:', {
                left: rect.left - parentRect.left,
                top: rect.top - parentRect.top,
                width: rect.width,
                height: rect.height
            });
        }
    }
    
    // ========== Web版準拠アプリケーション状態管理 ========== //
    
    // Web版準拠：skeleton座標は基本的に変更しない
    // この関数は削除され、Canvas要素の位置のみ変更する方式に統一
    
    // アプリケーション状態更新
    updateApplicationState(x, y, scale = null) {
        if (!this.targetElement) return;
        
        const characterName = this.targetElement.getAttribute('data-character-name');
        if (!characterName) return;
        
        // SpineCharacterManagerの位置情報更新
        if (window.spineCharacterManager && window.spineCharacterManager.updateCharacterPosition) {
            window.spineCharacterManager.updateCharacterPosition(characterName, x, y);
        }
        
        // データパネル更新（存在する場合）
        if (window.updateDataPanel) {
            window.updateDataPanel({ x, y, scale });
        }
        
        console.log(`📊 アプリケーション状態更新: ${characterName} (${x.toFixed(1)}%, ${y.toFixed(1)}%)`);
    }

    // ========== クリーンアップ ========== //
    
    cleanup() {
        if (this.boundingBox) {
            this.boundingBox.remove();
            this.boundingBox = null;
        }
        
        this.handles = [];
        this.removeEventListeners();
        this.isActive = false;
        this.targetElement = null;
    }
}

// ========== グローバル初期化 ========== //

// v3バウンディングボックスインスタンス
window.SpineBoundingBoxV3 = new SpineBoundingBox();

// 🚀 v3バウンディングボックステスト（Web版完全準拠）
window.testBoundingBox = function() {
    const character = document.querySelector('[data-spine-character="true"]');
    if (character) {
        console.log('🔧 v3バウンディングボックステスト開始（Web版完全準拠）');
        console.log('📊 座標系スワップ機能: 有効');
        console.log('📊 %値座標操作: 有効（Web版準拠）');
        console.log('📊 transform競合回避: 有効');
        console.log('📊 skeleton座標保護: 有効（Web版準拠）');
        
        window.SpineBoundingBoxV3.startEdit(character);
        
        console.log('✅ バウンディングボックス有効化完了');
        console.log('🎯 操作方法:');
        console.log('  - 中央エリア: ドラッグ移動');
        console.log('  - 角ハンドル: 対角リサイズ');
        console.log('  - 辺ハンドル: 一方向リサイズ');
        console.log('🎯 Web版との違い:');
        console.log('  - skeleton座標は基本的に変更されません');
        console.log('  - Canvas要素の位置のみ変更します');
        
        // 現在のスケルトン状態確認
        const characterName = character.getAttribute('data-character-name');
        if (characterName && window.spineSkeletonDebug) {
            const skeleton = window.spineSkeletonDebug.get(characterName);
            if (skeleton) {
                console.log(`🔍 Skeleton座標（変更されません）: ${characterName} → (${skeleton.x}, ${skeleton.y}, ${skeleton.scaleX})`);
            }
        }
        
        // 座標系スワップ状態確認
        console.log('🔍 座標系スワップ状態:', SpineEditSystemV3.coordinateSwap.isSwapped ? '有効' : '無効');
    } else {
        console.error('❌ キャラクター要素が見つかりません');
    }
};

// Web版準拠診断関数
window.debugSpineCoordinates = function() {
    console.log('🔍 Web版準拠座標診断開始');
    
    if (window.spineSkeletonDebug) {
        for (const [name, skeleton] of window.spineSkeletonDebug) {
            console.log(`📊 ${name}: skeleton(${skeleton.x}, ${skeleton.y}) scale(${skeleton.scaleX}, ${skeleton.scaleY})`);
            
            // Web版方針：skeleton座標は基本的に変更しない
            console.log(`   📌 Web版方針: skeleton座標は保護され、Canvas要素のみ変更されます`);
            
            // Canvas要素の状態確認
            const canvasElement = document.querySelector(`[data-character-name="${name}"]`);
            if (canvasElement) {
                const style = canvasElement.style;
                console.log(`   📐 Canvas要素: left=${style.left}, top=${style.top}, width=${style.width}, height=${style.height}`);
            }
        }
    } else {
        console.log('⚠️ スケルトンデバッグ情報が見つかりません');
    }
};

// 🔍 瞬間移動問題デバッグ関数
window.debugPositionJump = function() {
    const character = document.querySelector('[data-spine-character="true"]');
    if (!character) {
        console.error('❌ キャラクター要素が見つかりません');
        return;
    }
    
    console.log('🔍 瞬間移動問題診断開始');
    
    // 変換前の状態を記録
    const beforeRect = character.getBoundingClientRect();
    const parentRect = character.parentElement.getBoundingClientRect();
    const beforeStyle = {
        left: character.style.left,
        top: character.style.top,
        transform: character.style.transform
    };
    
    console.log('📐 変換前の状態:', {
        'CSS値': beforeStyle,
        '実際の描画位置': beforeRect,
        '親要素位置': parentRect,
        '親要素基準': {
            left: beforeRect.left - parentRect.left,
            top: beforeRect.top - parentRect.top
        }
    });
    
    // 座標系スワップを実行
    SpineEditSystemV3.coordinateSwap.enterEditMode(character);
    
    // 変換後の状態を確認
    const afterRect = character.getBoundingClientRect();
    const afterStyle = {
        left: character.style.left,
        top: character.style.top,
        transform: character.style.transform
    };
    
    console.log('📐 変換後の状態:', {
        'CSS値': afterStyle,
        '実際の描画位置': afterRect,
        '位置変化': {
            deltaX: afterRect.left - beforeRect.left,
            deltaY: afterRect.top - beforeRect.top
        }
    });
    
    // 位置変化の分析
    const deltaX = afterRect.left - beforeRect.left;
    const deltaY = afterRect.top - beforeRect.top;
    
    if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
        console.error('🚨 瞬間移動検出！', { deltaX, deltaY });
        console.log('💡 原因分析:');
        console.log('  - transform除去による中央原点→左上原点の変換誤差');
        console.log('  - getBoundingClientRectの座標基準の不一致');
        console.log('  - 親要素基準座標の計算誤差');
    } else {
        console.log('✅ 位置変化は許容範囲内です');
    }
    
    // 元に戻す
    SpineEditSystemV3.coordinateSwap.exitEditMode(character);
};

// 🔍 バウンディングボックスクリック時のずれデバッグ関数
window.debugBoundingBoxClick = function() {
    console.log('🔍 バウンディングボックスクリック時のずれ診断開始');
    
    // まずバウンディングボックスを開始
    const character = document.querySelector('[data-spine-character="true"]');
    if (!character) {
        console.error('❌ キャラクター要素が見つかりません');
        return;
    }
    
    // 座標系スワップ前の位置を記録
    const beforeRect = character.getBoundingClientRect();
    
    window.SpineBoundingBoxV3.startEdit(character);
    
    // 座標系スワップ後の位置を記録  
    const afterSwapRect = character.getBoundingClientRect();
    const swapStyle = {
        left: character.style.left,
        top: character.style.top,
        transform: character.style.transform
    };
    
    console.log('📐 座標系スワップ後の状態:', {
        '変換前位置': beforeRect,
        '変換後位置': afterSwapRect,
        'CSS値': swapStyle,
        '位置変化': {
            deltaX: afterSwapRect.left - beforeRect.left,
            deltaY: afterSwapRect.top - beforeRect.top
        }
    });
    
    console.log('🎯 次のステップ: バウンディングボックスをクリックして、コンソールで位置変化を確認してください');
    console.log('📊 期待値: クリック時の位置変化は0であるべき');
};

console.log('📦 Spine Bounding Box Module v3.0 読み込み完了（Web版準拠）');
console.log('🎯 テスト方法: testBoundingBox() をコンソールで実行');
console.log('🎯 Web版準拠の変更点:');
console.log('  - %値変換処理を使用');
console.log('  - skeleton座標は基本的に変更しない');
console.log('  - Canvas要素の位置のみ変更');