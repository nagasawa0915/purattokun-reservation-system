/**
 * DragDetector.js
 * HTML5 Drag & Drop API を使用したパネル操作検出システム
 * 
 * 機能:
 * - パネル境界での挿入位置検出（before/after判定）
 * - ドラッグ元・ドラッグ先の特定
 * - 挿入可能位置の視覚的フィードバック
 * - 水平方向のみ対応（timeline除く）
 */

class DragDetector {
    constructor(options = {}) {
        this.onDragStart = options.onDragStart || (() => {});
        this.onDragOver = options.onDragOver || (() => {});
        this.onDrop = options.onDrop || (() => {});
        this.onDragEnd = options.onDragEnd || (() => {});
        
        // 水平挿入対象パネル（timelineは除外）
        this.horizontalPanels = ['outliner', 'preview', 'properties'];
        
        this.dragSource = null;
        this.dropTarget = null;
        this.insertPosition = null;
        this.insertIndicator = null;
        
        this.init();
    }
    
    init() {
        this.createInsertIndicator();
        this.bindEvents();
    }
    
    createInsertIndicator() {
        this.insertIndicator = document.createElement('div');
        this.insertIndicator.className = 'drag-insert-indicator';
        this.insertIndicator.style.cssText = `
            position: fixed;
            width: 3px;
            background: #007acc;
            z-index: 9999;
            display: none;
            border-radius: 2px;
            box-shadow: 0 0 4px rgba(0, 122, 204, 0.5);
        `;
        document.body.appendChild(this.insertIndicator);
    }
    
    bindEvents() {
        // ドラッグ可能要素の設定
        document.addEventListener('dragstart', (e) => {
            if (e.target.draggable) {
                // パネルタイプを特定してtimelineを除外
                const panel = this.findDropZone(e.target);
                if (panel && this.horizontalPanels.includes(panel.dataset.panel)) {
                    this.dragSource = e.target;
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/html', e.target.outerHTML);
                    this.onDragStart(e, this.dragSource);
                } else {
                    // timelineパネルのドラッグは禁止
                    e.preventDefault();
                    console.log('⚠️ タイムラインパネルはドラッグ不可');
                }
            }
        });
        
        // ドラッグオーバー
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            
            const dropZone = this.findDropZone(e.target);
            if (dropZone && this.dragSource) {
                this.updateDropTarget(e, dropZone);
                this.showInsertIndicator(e, dropZone);
                this.onDragOver(e, dropZone, this.insertPosition);
            }
        });
        
        // ドロップ
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            this.hideInsertIndicator();
            
            if (this.dragSource && this.dropTarget) {
                const operation = this.detectOperationType(e, this.dropTarget);
                this.onDrop(e, this.dragSource, this.dropTarget, operation);
            }
            
            this.reset();
        });
        
        // ドラッグ終了
        document.addEventListener('dragend', (e) => {
            this.hideInsertIndicator();
            this.onDragEnd(e);
            this.reset();
        });
    }
    
    findDropZone(element) {
        // パネル要素を探す（data-panel属性を持つ要素）
        let current = element;
        while (current && current !== document.body) {
            if (current.dataset && current.dataset.panel) {
                const panelType = current.dataset.panel;
                // 水平挿入対象パネルのみ許可
                if (this.horizontalPanels.includes(panelType)) {
                    return current;
                }
            }
            current = current.parentElement;
        }
        return null;
    }
    
    updateDropTarget(event, dropZone) {
        this.dropTarget = dropZone;
        
        // 境界検出（水平方向）
        const bounds = dropZone.getBoundingClientRect();
        const relativeX = (event.clientX - bounds.left) / bounds.width;
        
        // 左半分=before, 右半分=after
        this.insertPosition = relativeX < 0.5 ? 'before' : 'after';
    }
    
    showInsertIndicator(event, dropZone) {
        const bounds = dropZone.getBoundingClientRect();
        const x = this.insertPosition === 'before' ? bounds.left : bounds.right;
        
        this.insertIndicator.style.display = 'block';
        this.insertIndicator.style.left = `${x - 1.5}px`;
        this.insertIndicator.style.top = `${bounds.top}px`;
        this.insertIndicator.style.height = `${bounds.height}px`;
    }
    
    hideInsertIndicator() {
        this.insertIndicator.style.display = 'none';
    }
    
    detectOperationType(event, targetElement) {
        // ドラッグソースのパネル情報を取得
        let sourcePanel = null;
        if (this.dragSource) {
            // ドラッグソース要素またはその親要素からdata-panel属性を探す
            const sourceContainer = this.findDropZone(this.dragSource);
            sourcePanel = sourceContainer?.dataset?.panel;
        }
        
        console.log('🔍 ドラッグソース解析:', {
            dragSource: this.dragSource,
            sourcePanel: sourcePanel,
            targetPanel: targetElement?.dataset?.panel
        });
        
        return {
            type: 'insert',
            direction: 'horizontal',
            position: this.insertPosition,
            source: sourcePanel,
            target: targetElement?.dataset?.panel
        };
    }
    
    reset() {
        this.dragSource = null;
        this.dropTarget = null;
        this.insertPosition = null;
    }
    
    destroy() {
        if (this.insertIndicator) {
            document.body.removeChild(this.insertIndicator);
            this.insertIndicator = null;
        }
    }
}

// 基本的な動作確認用のサンプルコード
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DragDetector;
} else if (typeof window !== 'undefined') {
    window.DragDetector = DragDetector;
    
    // デバッグ用の簡単な初期化関数
    window.initDragDetector = function() {
        const detector = new DragDetector({
            onDragStart: (e, source) => {
                console.log('Drag started:', source.dataset.panel);
            },
            onDragOver: (e, target, position) => {
                console.log(`Drag over ${target.dataset.panel} (${position})`);
            },
            onDrop: (e, source, target, operation) => {
                console.log('Drop operation:', operation);
            }
        });
        
        // パネル要素をドラッグ可能にする
        document.querySelectorAll('[data-panel]').forEach(panel => {
            panel.draggable = true;
            panel.style.cursor = 'grab';
        });
        
        return detector;
    };
}

// ES6モジュールエクスポート
export { DragDetector };