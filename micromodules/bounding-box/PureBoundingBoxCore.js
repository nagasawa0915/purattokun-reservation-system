/**
 * PureBoundingBoxCore.js
 * 
 * 🎯 核心データ・状態管理マイクロモジュール
 * - 外部依存: なし
 * - 責務: データ構造・状態管理・基本計算のみ
 */

class PureBoundingBoxCore {
    constructor(config) {
        // 設定
        this.config = {
            targetElement: config.targetElement,
            nodeId: config.nodeId || 'bb-' + Date.now(),
            minWidth: config.minWidth || 20,
            minHeight: config.minHeight || 20
        };
        
        // 🎯 Transform座標系（通常時）
        this.transform = {
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            rotation: 0
        };
        
        // 🎯 Bounds座標系（編集時）
        this.bounds = {
            x: 0,
            y: 0,
            width: 100,
            height: 100
        };
        
        // スワップ状態
        this.swapState = {
            currentMode: 'idle', // 'idle' | 'editing'
            originalTransform: null
        };
        
        // ドラッグ状態
        this.dragState = {
            isDragging: false,
            dragType: null,
            startMouseX: 0,
            startMouseY: 0,
            startBoundsX: 0,
            startBoundsY: 0,
            startBoundsWidth: 0,
            startBoundsHeight: 0,
            modifierKeys: {shift: false, alt: false, ctrl: false},
            // 🆕 Phase 2: 累積オフセット方式の状態
            baseTx: 0,
            baseTy: 0,
            startX: 0,
            startY: 0
        };
        
        // UI状態
        this.uiState = {
            visible: false,
            container: null,
            handles: []
        };
    }
    
    /**
     * 🎯 BB座標系スワップ: Transform → Bounds
     */
    enterEditingMode() {
        if (this.swapState.currentMode === 'editing') return;
        
        console.log('🔄 座標系スワップ開始 - 瞬間移動防止版');
        
        const element = this.config.targetElement;
        
        // 🎯 瞬間移動完全防止：位置変更を行わない
        // 元の座標系を完全バックアップ（位置変更なし）
        this.swapState.originalTransform = {
            left: element.style.left,
            top: element.style.top,
            width: element.style.width,
            height: element.style.height,
            transform: element.style.transform
        };
        
        console.log('💾 元座標系をバックアップ（位置変更なし）:', this.swapState.originalTransform);
        console.log('✅ 瞬間移動防止：キャラクター位置はそのまま維持');
        
        // 🎯 位置変更なし：編集可能状態の設定のみ
        this.swapState.currentMode = 'editing';
        
        console.log('✅ 編集モード開始完了 - 瞬間移動なし');
    }
    
    /**
     * 🎯 BB座標系スワップ: Bounds → Transform
     */
    exitEditingMode() {
        if (this.swapState.currentMode === 'idle') return;
        
        console.log('🔄 座標系復元開始: px座標系 → %座標系');
        
        const element = this.config.targetElement;
        
        // 🎯 編集後の絶対座標を取得
        const editedRect = element.getBoundingClientRect();
        const parentRect = element.parentElement.getBoundingClientRect();
        
        // 🔧 従来システム互換: px座標を%座標+transformに変換
        const newLeftPercent = ((editedRect.left + editedRect.width/2 - parentRect.left) / parentRect.width) * 100;
        const newTopPercent = ((editedRect.top + editedRect.height/2 - parentRect.top) / parentRect.height) * 100;
        const newWidthPercent = (editedRect.width / parentRect.width) * 100;
        const newHeightPercent = (editedRect.height / parentRect.height) * 100;
        
        // 🎯 元の形式（%値 + transform）で適用
        element.style.left = newLeftPercent.toFixed(1) + '%';
        element.style.top = newTopPercent.toFixed(1) + '%';
        element.style.width = newWidthPercent.toFixed(1) + '%';
        element.style.height = newHeightPercent.toFixed(1) + '%';
        element.style.transform = 'translate(-50%, -50%)'; // transform復元
        
        console.log('✅ %座標系復元完了:', {
            left: newLeftPercent.toFixed(1) + '%',
            top: newTopPercent.toFixed(1) + '%',
            width: newWidthPercent.toFixed(1) + '%',
            height: newHeightPercent.toFixed(1) + '%',
            transform: 'translate(-50%, -50%)'
        });
        
        this.swapState.currentMode = 'idle';
        this.swapState.originalTransform = null;
    }
    
    /**
     * ドラッグ開始データ保存
     */
    startDrag(event, dragType) {
        const currentBounds = {...this.bounds};
        
        this.dragState = {
            isDragging: true,
            dragType: dragType,
            startMouseX: event.clientX,
            startMouseY: event.clientY,
            startBoundsX: currentBounds.x,
            startBoundsY: currentBounds.y,
            startBoundsWidth: currentBounds.width,
            startBoundsHeight: currentBounds.height,
            modifierKeys: {
                shift: event.shiftKey,
                alt: event.altKey,
                ctrl: event.ctrlKey
            }
        };
    }
    
    /**
     * ドラッグ終了
     */
    endDrag() {
        this.dragState.isDragging = false;
    }
    
    /**
     * 修飾キー更新
     */
    updateModifierKeys(event) {
        if (this.dragState.isDragging) {
            this.dragState.modifierKeys.shift = event.shiftKey;
            this.dragState.modifierKeys.alt = event.altKey;
            this.dragState.modifierKeys.ctrl = event.ctrlKey;
        }
    }
    
    /**
     * 🆕 Phase 3: 見た目の中心基準のコミット処理
     * transform(-50%, -50%)を考慮した正確な%値再計算
     */
    commitToPercent() {
        const element = this.config.targetElement;
        const interactive = element.querySelector('.interactive');
        
        if (!element || !element.parentElement) {
            console.warn('⚠️ コミット対象要素または親要素が見つかりません');
            return false;
        }
        
        // 親要素の条件チェック
        const parentRect = element.parentElement.getBoundingClientRect();
        if (parentRect.width === 0 || parentRect.height === 0) {
            console.warn('⚠️ 親要素のサイズが0のため、コミット処理をスキップ');
            return false;
        }
        
        try {
            // layout-anchorの現在の見た目の矩形（transform(-50%, -50%)反映後）
            const anchorRect = element.getBoundingClientRect();
            
            // CSS変数による追加オフセットを取得
            let tx = 0, ty = 0;
            if (interactive) {
                const cs = getComputedStyle(interactive);
                tx = parseFloat(cs.getPropertyValue('--tx')) || 0;
                ty = parseFloat(cs.getPropertyValue('--ty')) || 0;
            }
            
            // 見た目の中心を計算（transform + CSS変数オフセット）
            const visualCenterX = anchorRect.left + anchorRect.width/2 + tx;
            const visualCenterY = anchorRect.top + anchorRect.height/2 + ty;
            
            // 親要素基準での%値に変換
            const leftPct = ((visualCenterX - parentRect.left) / parentRect.width) * 100;
            const topPct = ((visualCenterY - parentRect.top) / parentRect.height) * 100;
            
            // layout-anchorに書き戻し
            element.style.left = leftPct.toFixed(2) + '%';
            element.style.top = topPct.toFixed(2) + '%';
            
            // CSS変数をリセット（ズレ蓄積防止）
            if (interactive) {
                interactive.style.setProperty('--tx', '0px');
                interactive.style.setProperty('--ty', '0px');
            }
            
            console.log('✅ Phase 3コミット完了 - 見た目の中心基準:', {
                visualCenter: {x: visualCenterX.toFixed(1), y: visualCenterY.toFixed(1)},
                percentValues: {left: leftPct.toFixed(2) + '%', top: topPct.toFixed(2) + '%'},
                offsetReset: {tx: '0px', ty: '0px'},
                cssVariables: !!interactive
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Phase 3コミット処理でエラー:', error);
            return false;
        }
    }
    
    /**
     * 状態情報取得
     */
    getState() {
        return {
            config: {...this.config},
            transform: {...this.transform},
            bounds: {...this.bounds},
            swapState: {...this.swapState},
            dragState: {...this.dragState},
            uiState: {
                visible: this.uiState.visible,
                hasContainer: !!this.uiState.container
            }
        };
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.PureBoundingBoxCore = PureBoundingBoxCore;
}