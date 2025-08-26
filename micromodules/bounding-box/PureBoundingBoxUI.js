/**
 * PureBoundingBoxUI.js
 * 
 * 🎯 UI生成・表示制御マイクロモジュール  
 * - 外部依存: PureBoundingBoxCore（同フォルダ内）
 * - 責務: DOM操作・UI生成・表示制御のみ
 */

class PureBoundingBoxUI {
    constructor(core) {
        this.core = core;
    }
    
    /**
     * バウンディングボックスUI作成
     */
    createBoundingBoxUI() {
        // コンテナ作成
        const container = document.createElement('div');
        container.id = `bb-container-${this.core.config.nodeId}`;
        container.style.cssText = `
            position: fixed;
            border: 2px solid #007cff;
            pointer-events: none;
            z-index: 10000;
            box-sizing: content-box;
        `;
        
        // ハンドル設定
        const handleConfigs = [
            {type: 'nw', cursor: 'nw-resize', left: -4, top: -4},
            {type: 'n',  cursor: 'n-resize',  left: '50%', top: -4, transform: 'translateX(-50%)'},
            {type: 'ne', cursor: 'ne-resize', right: -4, top: -4},
            {type: 'e',  cursor: 'e-resize',  right: -4, top: '50%', transform: 'translateY(-50%)'},
            {type: 'se', cursor: 'se-resize', right: -4, bottom: -4},
            {type: 's',  cursor: 's-resize',  left: '50%', bottom: -4, transform: 'translateX(-50%)'},
            {type: 'sw', cursor: 'sw-resize', left: -4, bottom: -4},
            {type: 'w',  cursor: 'w-resize',  left: -4, top: '50%', transform: 'translateY(-50%)'}
        ];
        
        // ハンドル作成
        const handles = [];
        handleConfigs.forEach(config => {
            const handle = document.createElement('div');
            handle.setAttribute('data-handle-type', config.type);
            
            let handleStyle = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: #007cff;
                border: 1px solid white;
                cursor: ${config.cursor};
                pointer-events: all;
                box-sizing: border-box;
            `;
            
            // 位置設定
            if (config.left !== undefined) handleStyle += `left: ${config.left}${typeof config.left === 'number' ? 'px' : ''};`;
            if (config.right !== undefined) handleStyle += `right: ${config.right}px;`;
            if (config.top !== undefined) handleStyle += `top: ${config.top}${typeof config.top === 'number' ? 'px' : ''};`;
            if (config.bottom !== undefined) handleStyle += `bottom: ${config.bottom}px;`;
            if (config.transform) handleStyle += `transform: ${config.transform};`;
            
            handle.style.cssText = handleStyle;
            container.appendChild(handle);
            handles.push(handle);
        });
        
        // 移動ハンドル（中央部分）
        const moveHandle = document.createElement('div');
        moveHandle.setAttribute('data-handle-type', 'move');
        moveHandle.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            cursor: move;
            pointer-events: all;
            background: transparent;
        `;
        container.appendChild(moveHandle);
        handles.push(moveHandle);
        
        document.body.appendChild(container);
        
        // UI状態保存
        this.core.uiState.container = container;
        this.core.uiState.handles = handles;
        
        console.log('🎨 BB UI作成完了');
        return container;
    }
    
    /**
     * UI位置同期
     */
    syncPosition() {
        if (!this.core.uiState.container) return;
        
        const element = this.core.config.targetElement;
        if (!element) return;
        
        const rect = element.getBoundingClientRect();
        
        this.core.uiState.container.style.left = rect.left + 'px';
        this.core.uiState.container.style.top = rect.top + 'px';
        this.core.uiState.container.style.width = rect.width + 'px';
        this.core.uiState.container.style.height = rect.height + 'px';
    }
    
    /**
     * 表示制御
     */
    show() {
        if (this.core.uiState.container) {
            this.core.uiState.container.style.display = 'block';
            this.core.uiState.visible = true;
            this.syncPosition();
        }
    }
    
    hide() {
        if (this.core.uiState.container) {
            this.core.uiState.container.style.display = 'none';
            this.core.uiState.visible = false;
        }
    }
    
    /**
     * UI削除
     */
    remove() {
        if (this.core.uiState.container) {
            this.core.uiState.container.remove();
            this.core.uiState.container = null;
            this.core.uiState.handles = [];
            this.core.uiState.visible = false;
        }
    }
    
    /**
     * ハンドルタイプ取得
     */
    getHandleType(element) {
        return element.getAttribute('data-handle-type');
    }
    
    /**
     * 要素がハンドルかチェック
     */
    isHandle(element) {
        return element.hasAttribute('data-handle-type');
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.PureBoundingBoxUI = PureBoundingBoxUI;
}