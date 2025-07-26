/**
 * Spine Positioning System - Drag Positioning System v2
 * ドラッグ&ドロップ配置システム
 * 
 * 作成日: 2024年7月25日
 * 目的: Canvas内でのリアルタイムドラッグ配置機能
 */

class DragPositioningSystem {
    constructor(config = {}) {
        this.config = {
            debugMode: config.debugMode || false,
            snapToGrid: config.snapToGrid || false,
            gridSize: config.gridSize || 10,
            containWithinCanvas: config.containWithinCanvas !== false,
            showCoordinates: config.showCoordinates !== false,
            ...config
        };
        
        this.isDragging = false;
        this.currentCharacter = null;
        this.dragStartPos = null;
        this.dragOffset = null;
        this.coordinateDisplay = null;
        
        // レスポンシブ座標システムへの参照
        this.coordinateSystem = null;
        
        // ログ用
        this.log = this.config.debugMode ? console.log : () => {};
        
        this.log('🖱️ DragPositioningSystem 初期化開始', this.config);
    }
    
    /**
     * システム初期化
     */
    initialize(coordinateSystem) {
        this.coordinateSystem = coordinateSystem;
        
        // 座標表示UI作成
        if (this.config.showCoordinates) {
            this.createCoordinateDisplay();
        }
        
        this.log('✅ DragPositioningSystem 初期化完了');
    }
    
    /**
     * Canvas要素にドラッグ機能を追加
     */
    enableDragOnCanvas(canvasElement, characterName) {
        if (!canvasElement) {
            console.warn('⚠️ Canvas要素が指定されていません');
            return false;
        }
        
        // イベントリスナー追加
        canvasElement.addEventListener('mousedown', (e) => this.startDrag(e, canvasElement, characterName));
        canvasElement.addEventListener('mousemove', (e) => this.onDrag(e, canvasElement));
        canvasElement.addEventListener('mouseup', (e) => this.endDrag(e, canvasElement));
        canvasElement.addEventListener('mouseleave', (e) => this.endDrag(e, canvasElement));
        
        // CSS設定でドラッグ可能であることを明示
        canvasElement.style.cursor = 'grab';
        canvasElement.style.userSelect = 'none';
        
        this.log(`🖱️ ドラッグ機能有効化: ${characterName}`, canvasElement);
        
        return true;
    }
    
    /**
     * ドラッグ開始
     */
    startDrag(event, canvasElement, characterName) {
        // ポジショニングモードが有効でない場合は通常のクリック処理
        if (!this.isPositioningModeActive()) {
            return true; // イベントを継続（既存のクリック処理を実行）
        }
        
        event.preventDefault();
        event.stopPropagation();
        
        this.isDragging = true;
        this.currentCharacter = characterName;
        
        // ドラッグ開始位置を記録
        const rect = canvasElement.getBoundingClientRect();
        this.dragStartPos = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
        
        // Canvas中央からのオフセット計算
        this.dragOffset = {
            x: this.dragStartPos.x - (rect.width / 2),
            y: this.dragStartPos.y - (rect.height / 2)
        };
        
        // カーソル変更
        canvasElement.style.cursor = 'grabbing';
        
        // 座標表示更新
        this.updateCoordinateDisplay(event.clientX, event.clientY);
        
        this.log(`🖱️ ドラッグ開始: ${characterName}`, {
            startPos: this.dragStartPos,
            offset: this.dragOffset
        });
    }
    
    /**
     * ドラッグ中
     */
    onDrag(event, canvasElement) {
        if (!this.isDragging || !this.coordinateSystem) {
            return;
        }
        
        event.preventDefault();
        
        // 現在のマウス位置（Canvas内）
        const rect = canvasElement.getBoundingClientRect();
        const currentPos = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
        
        // 境界チェック
        if (this.config.containWithinCanvas) {
            currentPos.x = Math.max(0, Math.min(rect.width, currentPos.x));
            currentPos.y = Math.max(0, Math.min(rect.height, currentPos.y));
        }
        
        // グリッドスナップ
        if (this.config.snapToGrid) {
            currentPos.x = Math.round(currentPos.x / this.config.gridSize) * this.config.gridSize;
            currentPos.y = Math.round(currentPos.y / this.config.gridSize) * this.config.gridSize;
        }
        
        // Canvas座標をビューポート座標に変換
        const globalPos = {
            x: event.clientX,
            y: event.clientY
        };
        
        const viewportPos = this.coordinateSystem.pixelToViewport(globalPos.x, globalPos.y);
        
        // キャラクター位置を更新
        this.coordinateSystem.updateCharacterPosition(
            this.currentCharacter,
            viewportPos.x,
            viewportPos.y
        );
        
        // 座標表示更新
        this.updateCoordinateDisplay(globalPos.x, globalPos.y, viewportPos);
        
        this.log(`🖱️ ドラッグ中: ${this.currentCharacter}`, {
            canvas: currentPos,
            viewport: viewportPos
        });
    }
    
    /**
     * ドラッグ終了
     */
    endDrag(event, canvasElement) {
        if (!this.isDragging) {
            return;
        }
        
        // カーソルを戻す
        canvasElement.style.cursor = 'grab';
        
        // 最終位置を保存
        if (this.coordinateSystem && this.currentCharacter) {
            const settings = this.coordinateSystem.exportSettings();
            this.log(`💾 位置保存完了: ${this.currentCharacter}`, settings.characters[this.currentCharacter]);
            
            // HTML設定コード生成
            this.generateConfigCode();
        }
        
        // 状態リセット
        this.isDragging = false;
        this.currentCharacter = null;
        this.dragStartPos = null;
        this.dragOffset = null;
        
        // 座標表示を隠す
        this.hideCoordinateDisplay();
        
        this.log('🖱️ ドラッグ終了');
    }
    
    /**
     * ポジショニングモードの状態確認
     */
    isPositioningModeActive() {
        // グローバル変数またはフラグをチェック
        return window.spinePositioningModeActive || false;
    }
    
    /**
     * 座標表示UI作成
     */
    createCoordinateDisplay() {
        this.coordinateDisplay = document.createElement('div');
        this.coordinateDisplay.id = 'spine-coordinate-display';
        this.coordinateDisplay.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            display: none;
            pointer-events: none;
        `;
        
        document.body.appendChild(this.coordinateDisplay);
        this.log('📊 座標表示UI作成完了');
    }
    
    /**
     * 座標表示更新
     */
    updateCoordinateDisplay(mouseX, mouseY, viewportPos = null) {
        if (!this.coordinateDisplay) return;
        
        if (!viewportPos && this.coordinateSystem) {
            viewportPos = this.coordinateSystem.pixelToViewport(mouseX, mouseY);
        }
        
        const content = `
            <div><strong>🖱️ マウス位置</strong></div>
            <div>X: ${mouseX.toFixed(0)}px</div>
            <div>Y: ${mouseY.toFixed(0)}px</div>
            ${viewportPos ? `
            <div style="margin-top: 8px;"><strong>📐 ビューポート座標</strong></div>
            <div>X: ${viewportPos.x.toFixed(1)}%</div>
            <div>Y: ${viewportPos.y.toFixed(1)}%</div>
            ` : ''}
            ${this.currentCharacter ? `
            <div style="margin-top: 8px;"><strong>👤 ${this.currentCharacter}</strong></div>
            <div>ドラッグ中...</div>
            ` : ''}
        `;
        
        this.coordinateDisplay.innerHTML = content;
        this.coordinateDisplay.style.display = 'block';
    }
    
    /**
     * 座標表示を隠す
     */
    hideCoordinateDisplay() {
        if (this.coordinateDisplay) {
            this.coordinateDisplay.style.display = 'none';
        }
    }
    
    /**
     * HTML設定コード生成
     */
    generateConfigCode() {
        if (!this.coordinateSystem || !this.currentCharacter) {
            return null;
        }
        
        const settings = this.coordinateSystem.exportSettings();
        const charSettings = settings.characters[this.currentCharacter];
        
        if (!charSettings) {
            return null;
        }
        
        const htmlCode = `
<!-- ぷらっとくん設定（自動生成） -->
<div id="purattokun-config" style="display: none;"
     data-x="${charSettings.position.x.toFixed(1)}"
     data-y="${charSettings.position.y.toFixed(1)}"
     data-scale="${charSettings.scale}"
     data-fade-delay="1500"
     data-fade-duration="2000">
</div>`;
        
        // コンソールに出力（コピペ用）
        console.log('📋 HTML設定コード（コピペ用）:');
        console.log(htmlCode);
        
        // クリップボードにコピー（可能であれば）
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(htmlCode).then(() => {
                console.log('📋 HTML設定コードをクリップボードにコピーしました');
            }).catch(err => {
                console.log('📋 クリップボードコピー失敗:', err);
            });
        }
        
        return htmlCode;
    }
    
    /**
     * ポジショニングモード切り替え
     */
    togglePositioningMode() {
        window.spinePositioningModeActive = !window.spinePositioningModeActive;
        
        const status = window.spinePositioningModeActive ? '有効' : '無効';
        console.log(`🔧 ポジショニングモード: ${status}`);
        
        // モード表示UI更新
        this.updateModeDisplay();
        
        return window.spinePositioningModeActive;
    }
    
    /**
     * モード表示UI更新
     */
    updateModeDisplay() {
        let modeDisplay = document.getElementById('spine-positioning-mode-display');
        
        if (!modeDisplay) {
            modeDisplay = document.createElement('div');
            modeDisplay.id = 'spine-positioning-mode-display';
            modeDisplay.style.cssText = `
                position: fixed;
                top: 10px;
                left: 10px;
                background: rgba(255, 107, 107, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 5px;
                font-weight: bold;
                font-size: 14px;
                z-index: 9998;
                display: none;
            `;
            document.body.appendChild(modeDisplay);
        }
        
        if (window.spinePositioningModeActive) {
            modeDisplay.textContent = '🔧 ポジショニングモード有効';
            modeDisplay.style.display = 'block';
        } else {
            modeDisplay.style.display = 'none';
        }
    }
    
    /**
     * デバッグ情報
     */
    debugInfo() {
        return {
            isDragging: this.isDragging,
            currentCharacter: this.currentCharacter,
            dragStartPos: this.dragStartPos,
            dragOffset: this.dragOffset,
            positioningMode: window.spinePositioningModeActive,
            config: this.config
        };
    }
}

// グローバルアクセス用
window.DragPositioningSystem = DragPositioningSystem;

// デバッグ用ヘルパー関数
window.debugDragSystem = function() {
    if (window.spineDragSystem) {
        console.log('🔍 ドラッグシステム デバッグ情報:', window.spineDragSystem.debugInfo());
    } else {
        console.log('⚠️ ドラッグシステムが初期化されていません');
    }
};

// ポジショニングモード切り替え用ヘルパー
window.toggleSpinePositioning = function() {
    if (window.spineDragSystem) {
        const isActive = window.spineDragSystem.togglePositioningMode();
        console.log(`🔧 ポジショニングモード: ${isActive ? '有効' : '無効'}`);
        console.log('💡 ドラッグでキャラクターを移動できます');
        return isActive;
    } else {
        console.log('⚠️ ドラッグシステムが初期化されていません');
        return false;
    }
};

console.log('✅ Spine Drag Positioning System v2 ロード完了');