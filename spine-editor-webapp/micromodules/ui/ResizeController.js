/**
 * ResizeController.js - リサイズコントローラー
 * 機能: リサイズハンドル管理・CSS変数操作・リアルタイムリサイズ
 */
export class ResizeController {
    constructor() {
        this.resizeHandles = new Map();
        this.isDragging = false;
        this.dragData = null;
        this.state = 'initializing';
    }

    /**
     * リサイズハンドル初期化
     */
    initializeResizeHandles() {
        console.log('📏 リサイズハンドル初期化開始');
        
        const handles = [
            { element: '.resize-handle-left', direction: 'left', cssVar: '--outliner-width', axis: 'x' },
            { element: '.resize-handle-right', direction: 'right', cssVar: '--properties-width', axis: 'x' },
            { element: '.resize-handle-timeline', direction: 'timeline', cssVar: '--timeline-height', axis: 'y' }
        ];
        
        handles.forEach(config => {
            const element = document.querySelector(config.element);
            if (element) {
                this.resizeHandles.set(config.direction, {
                    element: element,
                    cssVar: config.cssVar,
                    axis: config.axis,
                    direction: config.direction,
                    minValue: config.axis === 'x' ? 200 : 100,
                    maxValue: config.axis === 'x' ? 500 : 400
                });
                
                // ドラッグイベント設定
                element.addEventListener('mousedown', (e) => this.startResize(e, config.direction));
                
                console.log(`✅ リサイズハンドル設定: ${config.direction}`);
            }
        });
        
        // グローバルドラッグイベント
        document.addEventListener('mousemove', (e) => this.handleResize(e));
        document.addEventListener('mouseup', () => this.endResize());
        
        console.log(`📏 リサイズハンドル初期化完了: ${this.resizeHandles.size}個`);
        this.state = 'ready';
        return this.resizeHandles.size;
    }

    /**
     * リサイズ開始
     */
    startResize(event, direction) {
        event.preventDefault();
        this.isDragging = true;
        
        const handle = this.resizeHandles.get(direction);
        if (!handle) return;
        
        this.dragData = {
            direction: direction,
            startX: event.clientX,
            startY: event.clientY,
            handle: handle
        };
        
        document.body.style.cursor = handle.axis === 'x' ? 'ew-resize' : 'ns-resize';
        document.body.style.userSelect = 'none';
        
        console.log(`🖱️ リサイズ開始: ${direction}`);
        this.state = 'resizing';
    }

    /**
     * リサイズ処理
     */
    handleResize(event) {
        if (!this.isDragging || !this.dragData) return;
        
        const { direction, startX, startY, handle } = this.dragData;
        let newValue;
        
        if (handle.axis === 'x') {
            const deltaX = event.clientX - startX;
            const currentWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue(handle.cssVar)) || 300;
            
            if (direction === 'left') {
                newValue = Math.max(handle.minValue, Math.min(handle.maxValue, currentWidth + deltaX));
            } else if (direction === 'right') {
                newValue = Math.max(handle.minValue, Math.min(handle.maxValue, currentWidth - deltaX));
            }
        } else if (handle.axis === 'y') {
            const deltaY = startY - event.clientY;
            const currentHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue(handle.cssVar)) || 200;
            newValue = Math.max(handle.minValue, Math.min(handle.maxValue, currentHeight + deltaY));
        }
        
        if (newValue) {
            document.documentElement.style.setProperty(handle.cssVar, `${newValue}px`);
        }
        
        // ドラッグデータ更新（連続ドラッグ対応）
        this.dragData.startX = event.clientX;
        this.dragData.startY = event.clientY;
    }

    /**
     * リサイズ終了
     */
    endResize() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.dragData = null;
        this.state = 'ready';
        
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        console.log('✅ リサイズ完了');
    }

    /**
     * レイアウトリセット
     */
    resetLayout() {
        document.documentElement.style.setProperty('--outliner-width', '300px');
        document.documentElement.style.setProperty('--properties-width', '300px');
        document.documentElement.style.setProperty('--timeline-height', '200px');
        
        console.log('🔄 レイアウトリセット完了');
        return {
            outliner: '300px',
            properties: '300px',
            timeline: '200px'
        };
    }

    /**
     * 現在のCSS変数値取得
     */
    getCSSVariables() {
        return {
            outlinerWidth: getComputedStyle(document.documentElement).getPropertyValue('--outliner-width'),
            propertiesWidth: getComputedStyle(document.documentElement).getPropertyValue('--properties-width'),
            timelineHeight: getComputedStyle(document.documentElement).getPropertyValue('--timeline-height')
        };
    }

    /**
     * リサイズ状態取得
     */
    getResizeStatus() {
        return {
            state: this.state,
            isDragging: this.isDragging,
            handlesCount: this.resizeHandles.size,
            cssVariables: this.getCSSVariables()
        };
    }

    /**
     * クリーンアップ
     */
    cleanup() {
        if (this.isDragging) {
            this.endResize();
        }
        this.resizeHandles.clear();
        this.state = 'cleanup';
        console.log('🧹 リサイズコントローラークリーンアップ完了');
    }
}

export default ResizeController;