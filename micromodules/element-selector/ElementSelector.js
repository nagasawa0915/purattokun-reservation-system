/**
 * ElementSelector.js
 * 
 * 🎯 2段階ピン設定UI - Stage 2: 位置調整インターフェース
 * - 責務: 選択された要素に対する相対位置調整UI
 * - 戦略: 直感的ドラッグ&ドロップ + 精密数値調整
 * - 目標: プロフェッショナル位置調整体験
 */

class ElementSelector {
    constructor() {
        console.log('🎯 ElementSelector 初期化開始');
        
        // 基本状態管理
        this.isSelecting = false;
        this.selectedElement = null;
        this.currentPin = null;
        this.onPinPositioned = null;
        
        // UI要素
        this.selectionPanel = null;
        this.positionPreview = null;
        this.dragHandle = null;
        
        // 位置調整管理
        this.positionData = {
            anchorPoint: 'MC', // デフォルト中央
            offsetX: 0,        // 相対オフセット
            offsetY: 0,
            ratioX: 0.5,       // アンカー比率
            ratioY: 0.5
        };
        
        // ドラッグ状態
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.initialOffsetX = 0;
        this.initialOffsetY = 0;
        
        // イベントハンドラー
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        
        // アンカーポイント定義
        this.anchorPoints = [
            { id: 'TL', label: '左上', ratioX: 0, ratioY: 0 },
            { id: 'TC', label: '上中央', ratioX: 0.5, ratioY: 0 },
            { id: 'TR', label: '右上', ratioX: 1, ratioY: 0 },
            { id: 'ML', label: '左中央', ratioX: 0, ratioY: 0.5 },
            { id: 'MC', label: '中央', ratioX: 0.5, ratioY: 0.5 },
            { id: 'MR', label: '右中央', ratioX: 1, ratioY: 0.5 },
            { id: 'BL', label: '左下', ratioX: 0, ratioY: 1 },
            { id: 'BC', label: '下中央', ratioX: 0.5, ratioY: 1 },
            { id: 'BR', label: '右下', ratioX: 1, ratioY: 1 }
        ];
        
        this.initializeStyles();
        console.log('✅ ElementSelector 初期化完了');
    }
    
    /**
     * 🎨 スタイル初期化
     */
    initializeStyles() {
        if (document.getElementById('element-selector-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'element-selector-styles';
        styles.textContent = `
            .element-selection-panel {
                position: fixed;
                top: 50%;
                right: 20px;
                transform: translateY(-50%);
                background: rgba(0, 0, 0, 0.95);
                color: white;
                padding: 20px;
                border-radius: 12px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 14px;
                z-index: 10010;
                min-width: 280px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                backdrop-filter: blur(10px);
            }
            
            .selection-panel-header {
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                padding-bottom: 12px;
                margin-bottom: 16px;
            }
            
            .selection-panel-title {
                font-size: 16px;
                font-weight: 600;
                color: #00d4ff;
                margin: 0 0 4px 0;
            }
            
            .selection-panel-subtitle {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.7);
                margin: 0;
            }
            
            .anchor-selection {
                margin-bottom: 16px;
            }
            
            .anchor-selection-label {
                display: block;
                margin-bottom: 8px;
                color: #fff;
                font-weight: 500;
            }
            
            .anchor-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 4px;
                margin-bottom: 12px;
            }
            
            .anchor-button {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 8px 4px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
                text-align: center;
                transition: all 0.2s ease;
            }
            
            .anchor-button:hover {
                background: rgba(255, 255, 255, 0.2);
                border-color: #00d4ff;
            }
            
            .anchor-button.active {
                background: #00d4ff;
                border-color: #00d4ff;
                color: #000;
                font-weight: 600;
            }
            
            .position-adjustment {
                margin-bottom: 16px;
            }
            
            .position-controls {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-bottom: 12px;
            }
            
            .position-input-group {
                display: flex;
                flex-direction: column;
            }
            
            .position-input-label {
                font-size: 11px;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 4px;
            }
            
            .position-input {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 6px 8px;
                border-radius: 4px;
                font-size: 12px;
            }
            
            .position-input:focus {
                outline: none;
                border-color: #00d4ff;
                background: rgba(255, 255, 255, 0.15);
            }
            
            .drag-handle {
                position: fixed;
                width: 20px;
                height: 20px;
                background: #ff6b35;
                border: 3px solid white;
                border-radius: 50%;
                cursor: grab;
                z-index: 10011;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                transition: all 0.2s ease;
            }
            
            .drag-handle:hover {
                transform: scale(1.2);
                background: #ff8c35;
            }
            
            .drag-handle.dragging {
                cursor: grabbing;
                transform: scale(1.3);
                background: #ff4500;
                box-shadow: 0 4px 16px rgba(255, 107, 53, 0.4);
            }
            
            .position-preview {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                padding: 8px;
                font-size: 11px;
                color: rgba(255, 255, 255, 0.8);
                margin-bottom: 12px;
            }
            
            .action-buttons {
                display: flex;
                gap: 8px;
                justify-content: flex-end;
            }
            
            .action-button {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }
            
            .action-button:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .action-button.primary {
                background: #00d4ff;
                border-color: #00d4ff;
                color: #000;
                font-weight: 600;
            }
            
            .action-button.primary:hover {
                background: #00a8cc;
                border-color: #00a8cc;
            }
            
            .action-button.secondary {
                background: rgba(255, 193, 7, 0.2);
                border-color: #ffc107;
                color: #ffc107;
            }
            
            .action-button.secondary:hover {
                background: rgba(255, 193, 7, 0.3);
            }
            
            @keyframes pinPlacement {
                0% { 
                    transform: scale(0.5); 
                    opacity: 0; 
                }
                50% { 
                    transform: scale(1.2); 
                    opacity: 0.8; 
                }
                100% { 
                    transform: scale(1); 
                    opacity: 1; 
                }
            }
            
            .pin-placement-animation {
                animation: pinPlacement 0.4s ease-out;
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    /**
     * 🎯 位置調整モード開始
     * @param {Element} targetElement - 対象要素
     * @param {Function} callback - 位置確定時のコールバック
     */
    startPositionAdjustment(targetElement, callback) {
        if (this.isSelecting) {
            console.warn('⚠️ 位置調整モードは既に開始されています');
            return;
        }
        
        console.log('🎯 位置調整モード開始', {
            element: targetElement.tagName,
            id: targetElement.id,
            className: targetElement.className
        });
        
        this.isSelecting = true;
        this.selectedElement = targetElement;
        this.onPinPositioned = callback;
        
        // 初期位置データ設定
        this.resetPositionData();
        
        // UI構築
        this.createSelectionPanel();
        this.createDragHandle();
        
        // イベントリスナー追加
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        document.addEventListener('keydown', this.handleKeydown);
        
        // 初期プレビュー更新
        this.updatePositionPreview();
        this.updateDragHandle();
        
        console.log('✅ 位置調整モード開始完了');
    }
    
    /**
     * 🛑 位置調整モード停止
     */
    stopPositionAdjustment() {
        if (!this.isSelecting) {
            return;
        }
        
        console.log('🛑 位置調整モード停止');
        
        this.isSelecting = false;
        this.selectedElement = null;
        this.onPinPositioned = null;
        
        // UI削除
        this.removeSelectionPanel();
        this.removeDragHandle();
        
        // イベントリスナー削除
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('keydown', this.handleKeydown);
        
        console.log('✅ 位置調整モード停止完了');
    }
    
    /**
     * 🏗️ 選択パネル作成
     */
    createSelectionPanel() {
        this.selectionPanel = document.createElement('div');
        this.selectionPanel.className = 'element-selection-panel';
        
        const elementInfo = this.getElementInfo(this.selectedElement);
        
        this.selectionPanel.innerHTML = `
            <div class="selection-panel-header">
                <h3 class="selection-panel-title">ピン位置調整</h3>
                <p class="selection-panel-subtitle">${elementInfo.tagName}${elementInfo.id ? `#${elementInfo.id}` : ''}${elementInfo.className ? `.${elementInfo.className.split(' ').join('.')}` : ''}</p>
            </div>
            
            <div class="anchor-selection">
                <label class="anchor-selection-label">アンカーポイント</label>
                <div class="anchor-grid">
                    ${this.anchorPoints.map(anchor => `
                        <button class="anchor-button ${anchor.id === this.positionData.anchorPoint ? 'active' : ''}" 
                                data-anchor="${anchor.id}" 
                                title="${anchor.label}">
                            ${anchor.id}
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <div class="position-adjustment">
                <label class="anchor-selection-label">位置微調整</label>
                <div class="position-controls">
                    <div class="position-input-group">
                        <label class="position-input-label">横オフセット (px)</label>
                        <input type="number" class="position-input" id="offset-x" value="${this.positionData.offsetX}" step="1">
                    </div>
                    <div class="position-input-group">
                        <label class="position-input-label">縦オフセット (px)</label>
                        <input type="number" class="position-input" id="offset-y" value="${this.positionData.offsetY}" step="1">
                    </div>
                </div>
                
                <div class="position-preview" id="position-preview">
                    位置: ${this.positionData.anchorPoint} + (${this.positionData.offsetX}, ${this.positionData.offsetY})
                </div>
            </div>
            
            <div class="action-buttons">
                <button class="action-button secondary" id="cancel-selection">キャンセル</button>
                <button class="action-button primary" id="confirm-selection">ピン配置確定</button>
            </div>
        `;
        
        document.body.appendChild(this.selectionPanel);
        
        // イベントリスナー設定
        this.setupPanelEventListeners();
        
        console.log('✅ 選択パネル作成完了');
    }
    
    /**
     * ⚙️ パネルイベントリスナー設定
     */
    setupPanelEventListeners() {
        // アンカーポイント選択
        this.selectionPanel.querySelectorAll('.anchor-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const anchorId = e.target.dataset.anchor;
                this.selectAnchorPoint(anchorId);
            });
        });
        
        // 位置入力
        const offsetXInput = this.selectionPanel.querySelector('#offset-x');
        const offsetYInput = this.selectionPanel.querySelector('#offset-y');
        
        offsetXInput.addEventListener('input', (e) => {
            this.positionData.offsetX = parseInt(e.target.value) || 0;
            this.updatePositionPreview();
            this.updateDragHandle();
        });
        
        offsetYInput.addEventListener('input', (e) => {
            this.positionData.offsetY = parseInt(e.target.value) || 0;
            this.updatePositionPreview();
            this.updateDragHandle();
        });
        
        // アクションボタン
        this.selectionPanel.querySelector('#confirm-selection').addEventListener('click', () => {
            this.confirmSelection();
        });
        
        this.selectionPanel.querySelector('#cancel-selection').addEventListener('click', () => {
            this.cancelSelection();
        });
    }
    
    /**
     * 🎯 アンカーポイント選択
     */
    selectAnchorPoint(anchorId) {
        const anchorData = this.anchorPoints.find(anchor => anchor.id === anchorId);
        if (!anchorData) return;
        
        // アクティブ状態更新
        this.selectionPanel.querySelectorAll('.anchor-button').forEach(button => {
            button.classList.toggle('active', button.dataset.anchor === anchorId);
        });
        
        // 位置データ更新
        this.positionData.anchorPoint = anchorId;
        this.positionData.ratioX = anchorData.ratioX;
        this.positionData.ratioY = anchorData.ratioY;
        
        // プレビュー更新
        this.updatePositionPreview();
        this.updateDragHandle();
        
        console.log('✅ アンカーポイント選択:', anchorData);
    }
    
    /**
     * 🖱️ ドラッグハンドル作成
     */
    createDragHandle() {
        this.dragHandle = document.createElement('div');
        this.dragHandle.className = 'drag-handle';
        this.dragHandle.title = 'ドラッグして位置調整';
        
        // ドラッグイベント
        this.dragHandle.addEventListener('mousedown', (e) => {
            this.startDrag(e);
        });
        
        document.body.appendChild(this.dragHandle);
        
        console.log('✅ ドラッグハンドル作成完了');
    }
    
    /**
     * 🖱️ ドラッグ開始
     */
    startDrag(event) {
        event.preventDefault();
        
        this.isDragging = true;
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
        this.initialOffsetX = this.positionData.offsetX;
        this.initialOffsetY = this.positionData.offsetY;
        
        this.dragHandle.classList.add('dragging');
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        
        console.log('🖱️ ドラッグ開始', { startX: this.dragStartX, startY: this.dragStartY });
    }
    
    /**
     * 🖱️ マウス移動ハンドラー
     */
    handleMouseMove(event) {
        if (!this.isDragging) return;
        
        const deltaX = event.clientX - this.dragStartX;
        const deltaY = event.clientY - this.dragStartY;
        
        this.positionData.offsetX = this.initialOffsetX + deltaX;
        this.positionData.offsetY = this.initialOffsetY + deltaY;
        
        // UI更新
        this.updatePositionInputs();
        this.updatePositionPreview();
        this.updateDragHandle();
    }
    
    /**
     * 🖱️ マウスアップハンドラー
     */
    handleMouseUp(event) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.dragHandle.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        console.log('🖱️ ドラッグ終了', { 
            offsetX: this.positionData.offsetX, 
            offsetY: this.positionData.offsetY 
        });
    }
    
    /**
     * ⌨️ キーボードハンドラー
     */
    handleKeydown(event) {
        if (!this.isSelecting) return;
        
        switch (event.key) {
            case 'Escape':
                event.preventDefault();
                this.cancelSelection();
                break;
                
            case 'Enter':
                event.preventDefault();
                this.confirmSelection();
                break;
                
            // 矢印キーでの微調整
            case 'ArrowLeft':
                event.preventDefault();
                this.adjustOffset(-1, 0);
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.adjustOffset(1, 0);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.adjustOffset(0, -1);
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.adjustOffset(0, 1);
                break;
        }
    }
    
    /**
     * ↗️ オフセット調整
     */
    adjustOffset(deltaX, deltaY) {
        const step = event.shiftKey ? 10 : 1; // Shiftキーで10px刻み
        
        this.positionData.offsetX += deltaX * step;
        this.positionData.offsetY += deltaY * step;
        
        this.updatePositionInputs();
        this.updatePositionPreview();
        this.updateDragHandle();
    }
    
    /**
     * 🔄 位置入力値更新
     */
    updatePositionInputs() {
        if (!this.selectionPanel) return;
        
        const offsetXInput = this.selectionPanel.querySelector('#offset-x');
        const offsetYInput = this.selectionPanel.querySelector('#offset-y');
        
        if (offsetXInput) offsetXInput.value = this.positionData.offsetX;
        if (offsetYInput) offsetYInput.value = this.positionData.offsetY;
    }
    
    /**
     * 🔄 位置プレビュー更新
     */
    updatePositionPreview() {
        if (!this.selectionPanel) return;
        
        const preview = this.selectionPanel.querySelector('#position-preview');
        if (preview) {
            preview.textContent = `位置: ${this.positionData.anchorPoint} + (${this.positionData.offsetX}, ${this.positionData.offsetY})`;
        }
    }
    
    /**
     * 🔄 ドラッグハンドル位置更新
     */
    updateDragHandle() {
        if (!this.dragHandle || !this.selectedElement) return;
        
        const rect = this.selectedElement.getBoundingClientRect();
        const scrollX = window.pageXOffset;
        const scrollY = window.pageYOffset;
        
        // アンカーポイントに基づく基準位置計算
        const baseX = rect.left + scrollX + (rect.width * this.positionData.ratioX);
        const baseY = rect.top + scrollY + (rect.height * this.positionData.ratioY);
        
        // オフセット適用
        const finalX = baseX + this.positionData.offsetX;
        const finalY = baseY + this.positionData.offsetY;
        
        this.dragHandle.style.left = `${finalX - 10}px`; // ハンドル中心調整
        this.dragHandle.style.top = `${finalY - 10}px`;
    }
    
    /**
     * ✅ 選択確定
     */
    confirmSelection() {
        console.log('✅ ピン位置確定', this.positionData);
        
        if (this.onPinPositioned) {
            // 効率的ピンシステム用の計算リクエスト構築
            const pinRequest = {
                element: this.selectedElement,
                anchorPoints: [{
                    id: this.positionData.anchorPoint,
                    ratioX: this.positionData.ratioX,
                    ratioY: this.positionData.ratioY,
                    offsetX: this.positionData.offsetX,
                    offsetY: this.positionData.offsetY
                }],
                elementType: this.detectElementType(this.selectedElement)
            };
            
            this.onPinPositioned(pinRequest);
        }
        
        this.stopPositionAdjustment();
    }
    
    /**
     * ❌ 選択キャンセル
     */
    cancelSelection() {
        console.log('❌ ピン位置選択キャンセル');
        this.stopPositionAdjustment();
    }
    
    /**
     * 🔧 位置データリセット
     */
    resetPositionData() {
        this.positionData = {
            anchorPoint: 'MC',
            offsetX: 0,
            offsetY: 0,
            ratioX: 0.5,
            ratioY: 0.5
        };
    }
    
    /**
     * 🔍 要素情報取得
     */
    getElementInfo(element) {
        return {
            tagName: element.tagName,
            id: element.id || '',
            className: element.className || ''
        };
    }
    
    /**
     * 🔍 要素タイプ検出
     */
    detectElementType(element) {
        const tagName = element.tagName.toLowerCase();
        const computedStyle = window.getComputedStyle(element);
        
        if (tagName === 'img') {
            return 'image';
        } else if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
            return 'background';
        } else if (['div', 'section', 'main', 'article'].includes(tagName)) {
            return 'container';
        } else {
            return 'text';
        }
    }
    
    /**
     * 🗑️ UI要素削除
     */
    removeSelectionPanel() {
        if (this.selectionPanel && this.selectionPanel.parentNode) {
            this.selectionPanel.parentNode.removeChild(this.selectionPanel);
            this.selectionPanel = null;
        }
    }
    
    removeDragHandle() {
        if (this.dragHandle && this.dragHandle.parentNode) {
            this.dragHandle.parentNode.removeChild(this.dragHandle);
            this.dragHandle = null;
        }
    }
    
    /**
     * 🧹 クリーンアップ
     */
    destroy() {
        this.stopPositionAdjustment();
        
        // スタイル削除
        const styles = document.getElementById('element-selector-styles');
        if (styles) {
            styles.remove();
        }
        
        console.log('🧹 ElementSelector クリーンアップ完了');
    }
}

// グローバル公開
if (typeof window !== 'undefined') {
    window.ElementSelector = ElementSelector;
    console.log('✅ ElementSelector グローバル公開完了');
}

// AMD/CommonJS対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElementSelector;
}