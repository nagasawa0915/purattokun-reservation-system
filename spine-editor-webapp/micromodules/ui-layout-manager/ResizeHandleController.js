/**
 * ResizeHandleController.js - リサイズハンドル位置制御マイクロモジュール
 * 
 * 責務:
 * - リサイズハンドルの位置を動的に更新
 * - レイアウト変更時のハンドル位置同期
 * - ドラッグ操作の正確性確保
 * 
 * 依存: EventBusのみ
 */

export default class ResizeHandleController {
    constructor(options = {}) {
        this.eventBus = options.eventBus;
        this.handles = new Map();
        this.isUpdating = false;
        
        this.init();
    }
    
    init() {
        this.findHandles();
        this.bindEvents();
        this.updateHandlePositions();
        
        this.emit('resizeHandleController:initialized');
        console.log('✅ ResizeHandleController 初期化完了');
    }
    
    /**
     * リサイズハンドル要素を検出・登録
     */
    findHandles() {
        const leftHandle = document.querySelector('.resize-handle-left');
        const rightHandle = document.querySelector('.resize-handle-right');
        const timelineHandle = document.querySelector('.resize-handle-timeline');
        
        if (leftHandle) {
            this.handles.set('left', {
                element: leftHandle,
                side: 'left',
                cssVar: '--outliner-width',
                position: 'left'
            });
        }
        
        if (rightHandle) {
            this.handles.set('right', {
                element: rightHandle,
                side: 'right', 
                cssVar: '--properties-width',
                position: 'right'
            });
        }
        
        if (timelineHandle) {
            this.handles.set('timeline', {
                element: timelineHandle,
                side: 'timeline',
                cssVar: '--timeline-height',
                position: 'bottom'
            });
        }
        
        console.log('🔍 リサイズハンドル検出完了:', this.handles.size, '個');
        
        // デバッグ用: タイムライン境界線の検出確認
        if (this.handles.has('timeline')) {
            console.log('✅ タイムライン境界線検出成功');
        } else {
            console.warn('❌ タイムライン境界線が見つかりません');
        }
    }
    
    /**
     * イベントバインディング
     */
    bindEvents() {
        // レイアウト変更時のハンドル位置更新
        if (this.eventBus) {
            this.eventBus.on('layout:applied', () => {
                // 少し遅延させてCSS変数の更新を待つ
                setTimeout(() => this.updateHandlePositions(), 100);
            });
            
            this.eventBus.on('panel:resized', () => {
                this.updateHandlePositions();
            });
        }
        
        // ウィンドウリサイズ時の更新
        window.addEventListener('resize', () => {
            this.debounceUpdate();
        });
        
        // CSS変数の変更を監視
        this.observeCSSVariableChanges();
        
        // 各ハンドルのドラッグイベント
        this.handles.forEach((handle, key) => {
            this.bindHandleDragEvents(handle);
        });
    }
    
    /**
     * CSS変数変更の監視
     */
    observeCSSVariableChanges() {
        // MutationObserverでstyle属性の変更を監視
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'style') {
                    this.debounceUpdate();
                }
            });
        });
        
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style']
        });
        
        this.cssObserver = observer;
    }
    
    /**
     * ハンドル位置の更新（メイン処理）
     */
    updateHandlePositions() {
        if (this.isUpdating) return;
        this.isUpdating = true;
        
        const computedStyle = getComputedStyle(document.documentElement);
        const topbarHeight = computedStyle.getPropertyValue('--topbar-height') || '40px';
        const timelineHeight = computedStyle.getPropertyValue('--timeline-height') || '200px';
        
        this.handles.forEach((handle, key) => {
            try {
                const cssValue = computedStyle.getPropertyValue(handle.cssVar);
                let position;
                
                if (handle.side === 'left') {
                    // 左側ハンドル: アウトライナーの右端
                    position = this.parseCSSValue(cssValue);
                    handle.element.style.left = `${position}px`;
                    handle.element.style.right = 'auto';
                    
                    // 高さの調整（タイムライン分を考慮）
                    const timelineHeightValue = this.parseCSSValue(timelineHeight);
                    handle.element.style.top = topbarHeight;
                    handle.element.style.bottom = `${timelineHeightValue}px`;
                } else if (handle.side === 'right') {
                    // 右側ハンドル: プロパティパネルの左端
                    position = this.parseCSSValue(cssValue);
                    handle.element.style.right = `${position}px`;
                    handle.element.style.left = 'auto';
                    
                    // 高さの調整（タイムライン分を考慮）
                    const timelineHeightValue = this.parseCSSValue(timelineHeight);
                    handle.element.style.top = topbarHeight;
                    handle.element.style.bottom = `${timelineHeightValue}px`;
                } else if (handle.side === 'timeline') {
                    // タイムラインハンドル: タイムラインの上端
                    position = this.parseCSSValue(cssValue);
                    handle.element.style.bottom = `${position}px`;
                    handle.element.style.left = '0';
                    handle.element.style.right = '0';
                    handle.element.style.top = 'auto';
                }
                
                // ハンドル情報更新
                handle.currentPosition = position;
                
            } catch (error) {
                console.warn(`ハンドル位置更新エラー (${key}):`, error);
            }
        });
        
        this.isUpdating = false;
        this.emit('resizeHandles:updated', {
            handles: Array.from(this.handles.keys())
        });
    }
    
    /**
     * CSS値をピクセル数に変換
     */
    parseCSSValue(value) {
        if (typeof value !== 'string') return 0;
        
        // px値の場合
        if (value.endsWith('px')) {
            return parseFloat(value);
        }
        
        // %値の場合
        if (value.endsWith('%')) {
            const percentage = parseFloat(value);
            const containerWidth = window.innerWidth;
            return (percentage / 100) * containerWidth;
        }
        
        // vw値の場合
        if (value.endsWith('vw')) {
            const vw = parseFloat(value);
            return (vw / 100) * window.innerWidth;
        }
        
        // 数値のみの場合（pxとして扱う）
        const numValue = parseFloat(value);
        return isNaN(numValue) ? 0 : numValue;
    }
    
    /**
     * ハンドルドラッグイベントのバインド
     */
    bindHandleDragEvents(handle) {
        const element = handle.element;
        let isDragging = false;
        let startX = 0;
        let startPosition = 0;
        
        const onMouseDown = (e) => {
            isDragging = true;
            if (handle.side === 'timeline') {
                startX = e.clientY; // タイムラインは縦方向
            } else {
                startX = e.clientX;
            }
            startPosition = handle.currentPosition || 0;
            
            element.classList.add('dragging');
            
            if (handle.side === 'timeline') {
                document.body.classList.add('row-resizing');
            } else {
                document.body.classList.add('col-resizing');
            }
            
            e.preventDefault();
            
            this.emit('resizeHandle:dragStart', {
                handle: handle.side,
                startX,
                startPosition
            });
        };
        
        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            let delta, newPosition;
            
            if (handle.side === 'timeline') {
                // タイムライン: 縦方向のドラッグ
                delta = startX - e.clientY; // 上に移動すると値が増加（逆転）
                newPosition = Math.max(100, Math.min(400, startPosition + delta));
            } else {
                // 左右ハンドル: 横方向のドラッグ
                delta = e.clientX - startX;
                if (handle.side === 'left') {
                    // 左ハンドル: 右に移動すると値が増加
                    newPosition = Math.max(150, Math.min(400, startPosition + delta));
                } else {
                    // 右ハンドル: 左に移動すると値が増加
                    newPosition = Math.max(180, Math.min(400, startPosition - delta));
                }
            }
            
            // CSS変数を即座に更新
            document.documentElement.style.setProperty(handle.cssVar, `${newPosition}px`);
            
            // ハンドル位置も即座に更新
            this.updateHandlePosition(handle, newPosition);
            
            this.emit('resizeHandle:drag', {
                handle: handle.side,
                position: newPosition,
                delta: handle.side === 'timeline' ? delta : delta
            });
            
            e.preventDefault();
        };
        
        const onMouseUp = (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            element.classList.remove('dragging');
            
            if (handle.side === 'timeline') {
                document.body.classList.remove('row-resizing');
            } else {
                document.body.classList.remove('col-resizing');
            }
            
            // 最終位置を記録
            const finalPosition = handle.currentPosition;
            
            this.emit('resizeHandle:dragEnd', {
                handle: handle.side,
                finalPosition
            });
            
            // レイアウト状態の保存を通知
            this.emit('layout:changed', {
                source: 'resize',
                handle: handle.side,
                newValue: finalPosition
            });
        };
        
        element.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        
        // タッチイベント対応
        element.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            onMouseDown({ clientX: touch.clientX, preventDefault: () => e.preventDefault() });
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const touch = e.touches[0];
            onMouseMove({ clientX: touch.clientX, preventDefault: () => e.preventDefault() });
        });
        
        document.addEventListener('touchend', onMouseUp);
    }
    
    /**
     * 単一ハンドルの位置更新
     */
    updateHandlePosition(handle, position) {
        if (handle.side === 'left') {
            handle.element.style.left = `${position}px`;
        } else if (handle.side === 'right') {
            handle.element.style.right = `${position}px`;
        } else if (handle.side === 'timeline') {
            handle.element.style.bottom = `${position}px`;
        }
        handle.currentPosition = position;
    }
    
    /**
     * デバウンス機能付き更新
     */
    debounceUpdate() {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        
        this.updateTimeout = setTimeout(() => {
            this.updateHandlePositions();
        }, 16); // 60FPS
    }
    
    /**
     * ハンドル可視性の制御
     */
    setHandleVisibility(side, visible) {
        const handle = this.handles.get(side);
        if (handle) {
            handle.element.style.display = visible ? 'block' : 'none';
        }
    }
    
    /**
     * 現在のハンドル位置取得
     */
    getHandlePositions() {
        const positions = {};
        this.handles.forEach((handle, key) => {
            positions[key] = handle.currentPosition || 0;
        });
        return positions;
    }
    
    /**
     * ハンドル位置の強制設定
     */
    setHandlePositions(positions) {
        Object.entries(positions).forEach(([side, position]) => {
            const handle = this.handles.get(side);
            if (handle) {
                document.documentElement.style.setProperty(handle.cssVar, `${position}px`);
                this.updateHandlePosition(handle, position);
            }
        });
    }
    
    // 外部API
    refreshAllHandles() {
        this.updateHandlePositions();
    }
    
    addCustomHandle(side, options) {
        // 将来的な拡張用
        const handle = {
            element: options.element,
            side,
            cssVar: options.cssVar,
            position: options.position || 'left'
        };
        
        this.handles.set(side, handle);
        this.bindHandleDragEvents(handle);
        this.updateHandlePositions();
    }
    
    // EventBus ヘルパー
    emit(eventType, data = {}) {
        if (this.eventBus) {
            this.eventBus.emit(eventType, data);
        }
    }
    
    destroy() {
        // CSS Observer削除
        if (this.cssObserver) {
            this.cssObserver.disconnect();
        }
        
        // タイムアウトクリア
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        
        // ハンドルのイベントリスナー削除
        this.handles.forEach((handle) => {
            // 実際の削除処理は複雑なので、クラス削除で対応
            handle.element.classList.remove('dragging');
        });
        
        document.body.classList.remove('col-resizing');
        
        console.log('✅ ResizeHandleController 終了');
    }
}