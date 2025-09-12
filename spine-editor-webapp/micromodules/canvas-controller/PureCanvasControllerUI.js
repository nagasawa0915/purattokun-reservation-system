/**
 * PureCanvasControllerUI.js
 * 
 * 🎯 Canvas制御UI生成・表示制御マイクロモジュール
 * - 外部依存: PureCanvasControllerCore（同フォルダ内）
 * - 責務: UI要素生成・ハンドル表示・Canvas操作UI管理のみ
 * - 基盤: PureBoundingBoxUIからUI生成システム流用・Canvas特化
 */

class PureCanvasControllerUI {
    constructor(core) {
        this.core = core;
        
        // UI要素参照
        this.elements = {
            container: null,
            handles: [],
            infoPanel: null,
            controlPanel: null
        };
    }
    
    /**
     * Canvas制御UI作成
     */
    createUI() {
        const canvas = this.core.config.targetCanvas;
        if (!canvas) return false;
        
        // メインコンテナ作成
        this.elements.container = this.createMainContainer(canvas);
        
        // リサイズハンドル作成（8方向）
        this.elements.handles = this.createResizeHandles();
        
        // 情報パネル作成
        this.elements.infoPanel = this.createInfoPanel();
        
        // コントロールパネル作成
        this.elements.controlPanel = this.createControlPanel();
        
        // コンテナに追加
        this.elements.handles.forEach(handle => {
            this.elements.container.appendChild(handle);
        });
        this.elements.container.appendChild(this.elements.infoPanel);
        this.elements.container.appendChild(this.elements.controlPanel);
        
        // DOM追加
        document.body.appendChild(this.elements.container);
        
        // Core状態更新
        this.core.uiState.container = this.elements.container;
        this.core.uiState.handles = this.elements.handles;
        
        console.log('🎨 Canvas制御UI作成完了');
        return true;
    }
    
    /**
     * メインコンテナ作成
     */
    createMainContainer(canvas) {
        const container = document.createElement('div');
        container.className = 'canvas-controller-container';
        
        // Canvas要素の実際の位置を正確に取得
        const rect = canvas.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        // ページ内での絶対位置を計算
        const absoluteTop = rect.top + scrollTop;
        const absoluteLeft = rect.left + scrollLeft;
        
        container.style.cssText = `
            position: absolute;
            top: ${absoluteTop}px;
            left: ${absoluteLeft}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            pointer-events: auto;
            z-index: 9999;
            border: 2px solid #00ff88;
            box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
            background: rgba(0, 255, 136, 0.05);
        `;
        
        return container;
    }
    
    /**
     * リサイズハンドル作成（8方向）
     */
    createResizeHandles() {
        const handles = [];
        const handleTypes = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
        const handleSize = 12;
        
        handleTypes.forEach(type => {
            const handle = document.createElement('div');
            handle.className = `canvas-handle canvas-handle-${type}`;
            handle.dataset.handleType = type;
            handle.style.cssText = `
                position: absolute;
                width: ${handleSize}px;
                height: ${handleSize}px;
                background: #00ff88;
                border: 2px solid #ffffff;
                border-radius: 50%;
                cursor: ${this.getHandleCursor(type)};
                pointer-events: auto;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                transition: transform 0.2s ease;
                z-index: 10001;
                ${this.getHandlePosition(type, handleSize)}
            `;
            
            // ホバー効果
            handle.addEventListener('mouseenter', () => {
                handle.style.transform = 'scale(1.3)';
                handle.style.background = '#66ffaa';
            });
            
            handle.addEventListener('mouseleave', () => {
                handle.style.transform = 'scale(1)';
                handle.style.background = '#00ff88';
            });
            
            handles.push(handle);
        });
        
        return handles;
    }
    
    /**
     * ハンドル位置取得
     */
    getHandlePosition(type, size) {
        const offset = -(size / 2);
        const positions = {
            'nw': `top: ${offset}px; left: ${offset}px;`,
            'n':  `top: ${offset}px; left: calc(50% - ${size/2}px);`,
            'ne': `top: ${offset}px; right: ${offset}px;`,
            'w':  `top: calc(50% - ${size/2}px); left: ${offset}px;`,
            'e':  `top: calc(50% - ${size/2}px); right: ${offset}px;`,
            'sw': `bottom: ${offset}px; left: ${offset}px;`,
            's':  `bottom: ${offset}px; left: calc(50% - ${size/2}px);`,
            'se': `bottom: ${offset}px; right: ${offset}px;`
        };
        return positions[type] || '';
    }
    
    /**
     * ハンドルカーソル取得
     */
    getHandleCursor(type) {
        const cursors = {
            'nw': 'nw-resize', 'n': 'n-resize', 'ne': 'ne-resize',
            'w': 'w-resize', 'e': 'e-resize',
            'sw': 'sw-resize', 's': 's-resize', 'se': 'se-resize'
        };
        return cursors[type] || 'default';
    }
    
    /**
     * 情報パネル作成
     */
    createInfoPanel() {
        const panel = document.createElement('div');
        panel.className = 'canvas-info-panel';
        panel.style.cssText = `
            position: absolute;
            top: -35px;
            left: 0;
            background: rgba(0, 0, 0, 0.8);
            color: #00ff88;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 12px;
            font-family: 'Courier New', monospace;
            pointer-events: none;
            white-space: nowrap;
            z-index: 10002;
        `;
        
        this.updateInfoPanel();
        return panel;
    }
    
    /**
     * コントロールパネル作成
     */
    createControlPanel() {
        const panel = document.createElement('div');
        panel.className = 'canvas-control-panel';
        panel.style.cssText = `
            position: absolute;
            top: -80px;
            right: 0;
            background: rgba(0, 0, 0, 0.9);
            border-radius: 8px;
            padding: 8px;
            display: flex;
            gap: 5px;
            pointer-events: auto;
            z-index: 10003;
        `;
        
        // 自動フィットボタン
        const autoFitBtn = this.createControlButton('🎯', 'Auto Fit', () => {
            this.triggerAutoFit();
        });
        
        // アスペクト比固定ボタン
        const aspectBtn = this.createControlButton('🔒', 'Lock Aspect', () => {
            this.toggleAspectRatio();
        });
        
        // 中央配置ボタン
        const centerBtn = this.createControlButton('⊹', 'Center', () => {
            this.triggerCenter();
        });
        
        // リセットボタン
        const resetBtn = this.createControlButton('↺', 'Reset', () => {
            this.triggerReset();
        });
        
        panel.appendChild(autoFitBtn);
        panel.appendChild(aspectBtn);
        panel.appendChild(centerBtn);
        panel.appendChild(resetBtn);
        
        return panel;
    }
    
    /**
     * コントロールボタン作成
     */
    createControlButton(icon, tooltip, onClick) {
        const button = document.createElement('button');
        button.textContent = icon;
        button.title = tooltip;
        button.style.cssText = `
            width: 28px;
            height: 28px;
            border: none;
            border-radius: 4px;
            background: rgba(0, 255, 136, 0.2);
            color: #00ff88;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.background = 'rgba(0, 255, 136, 0.4)';
            button.style.transform = 'scale(1.1)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = 'rgba(0, 255, 136, 0.2)';
            button.style.transform = 'scale(1)';
        });
        
        button.addEventListener('click', onClick);
        
        return button;
    }
    
    /**
     * UI位置・サイズ更新
     */
    updateUI() {
        if (!this.elements.container) return;
        
        const canvas = this.core.config.targetCanvas;
        const container = this.elements.container;
        
        // Canvas要素の実際の位置を正確に取得
        const rect = canvas.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        // ページ内での絶対位置を計算
        const absoluteTop = rect.top + scrollTop;
        const absoluteLeft = rect.left + scrollLeft;
        
        // コンテナ位置・サイズ更新
        container.style.top = absoluteTop + 'px';
        container.style.left = absoluteLeft + 'px';
        container.style.width = rect.width + 'px';
        container.style.height = rect.height + 'px';
        
        // 情報パネル更新
        this.updateInfoPanel();
    }
    
    /**
     * 情報パネル更新
     */
    updateInfoPanel() {
        if (!this.elements.infoPanel) return;
        
        const canvasState = this.core.canvasState;
        const skeletonState = this.core.skeletonState;
        
        this.elements.infoPanel.textContent = 
            `Canvas: ${canvasState.width}x${canvasState.height} | ` +
            `Skeleton: (${Math.round(skeletonState.x)}, ${Math.round(skeletonState.y)}) | ` +
            `Scale: ${skeletonState.scaleX.toFixed(2)}`;
    }
    
    /**
     * UI表示・非表示
     */
    setVisible(visible) {
        if (!this.elements.container) return;
        
        this.elements.container.style.display = visible ? 'block' : 'none';
        this.core.uiState.visible = visible;
        
        if (visible) {
            this.updateUI();
        }
    }
    
    /**
     * ハンドル判定
     */
    isHandle(element) {
        return element && element.classList.contains('canvas-handle');
    }
    
    /**
     * ハンドルタイプ取得
     */
    getHandleType(element) {
        if (!this.isHandle(element)) return null;
        return element.dataset.handleType;
    }
    
    /**
     * UI完全削除
     */
    destroyUI() {
        if (this.elements.container && this.elements.container.parentNode) {
            this.elements.container.parentNode.removeChild(this.elements.container);
        }
        
        this.elements = {
            container: null,
            handles: [],
            infoPanel: null,
            controlPanel: null
        };
        
        this.core.uiState.container = null;
        this.core.uiState.handles = [];
        this.core.uiState.visible = false;
    }
    
    /**
     * コントロールボタン機能
     */
    triggerAutoFit() {
        console.log('🎯 Canvas自動フィット実行');
        // Boundsモジュールの自動フィット機能を呼び出し
        // 実装は統合インターフェースで行う
        if (this.onAutoFit) this.onAutoFit();
    }
    
    toggleAspectRatio() {
        this.core.config.maintainAspectRatio = !this.core.config.maintainAspectRatio;
        console.log('🔒 アスペクト比固定:', this.core.config.maintainAspectRatio ? 'ON' : 'OFF');
    }
    
    triggerCenter() {
        console.log('⊹ Skeleton中央配置実行');
        if (this.onCenter) this.onCenter();
    }
    
    triggerReset() {
        console.log('↺ Canvas状態リセット実行');
        if (this.onReset) this.onReset();
    }
    
    /**
     * 単独テスト
     */
    static test() {
        console.log('🧪 PureCanvasControllerUI テスト開始');
        
        // モックCanvas作成
        const mockCanvas = {
            offsetTop: 100,
            offsetLeft: 200,
            offsetWidth: 300,
            offsetHeight: 400
        };
        
        // モックCore作成
        const mockCore = {
            config: { targetCanvas: mockCanvas },
            canvasState: { width: 300, height: 400 },
            skeletonState: { x: 150, y: 200, scaleX: 1, scaleY: 1 },
            uiState: { container: null, handles: [], visible: false }
        };
        
        try {
            const ui = new PureCanvasControllerUI(mockCore);
            
            // UI作成テスト
            const created = ui.createUI();
            console.log('UI作成結果:', created);
            
            // 表示テスト
            ui.setVisible(true);
            ui.updateUI();
            ui.setVisible(false);
            
            // クリーンアップ
            ui.destroyUI();
            
            console.log('✅ PureCanvasControllerUI テスト成功');
            return { success: true, result: 'All tests passed', error: null };
            
        } catch (error) {
            console.error('❌ PureCanvasControllerUI テスト失敗:', error);
            return { success: false, result: null, error: error.message };
        }
    }
}

// Node.js環境対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PureCanvasControllerUI;
}