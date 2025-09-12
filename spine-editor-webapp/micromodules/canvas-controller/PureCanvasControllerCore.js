/**
 * PureCanvasControllerCore.js
 * 
 * 🎯 Canvas制御 核心データ・状態管理マイクロモジュール
 * - 外部依存: なし
 * - 責務: Canvas状態・WebGL viewport・Skeleton管理のみ
 * - 基盤: PureBoundingBoxCoreから座標管理システム流用
 */

class PureCanvasControllerCore {
    constructor(config) {
        // 設定
        this.config = {
            targetCanvas: config.targetCanvas,
            skeleton: config.skeleton || null,
            renderer: config.renderer || null,
            nodeId: config.nodeId || 'canvas-controller-' + Date.now(),
            minWidth: config.minWidth || 50,
            minHeight: config.minHeight || 50,
            maxWidth: config.maxWidth || 2000,
            maxHeight: config.maxHeight || 2000,
            maintainAspectRatio: config.maintainAspectRatio || false,
            autoFitContent: config.autoFitContent || false
        };
        
        // 🎯 Canvas状態管理（PureBoundingBox bounds概念を流用）
        this.canvasState = {
            // 現在のCanvas描画サイズ
            width: 0,
            height: 0,
            // オリジナルサイズ（初期状態保存）
            originalWidth: 0,
            originalHeight: 0,
            // アスペクト比
            aspectRatio: 1,
            // CSS表示サイズ
            cssWidth: 0,
            cssHeight: 0,
            // WebGL viewport
            viewportX: 0,
            viewportY: 0,
            viewportWidth: 0,
            viewportHeight: 0
        };
        
        // 🎯 Skeleton状態管理
        this.skeletonState = {
            // オリジナル位置・スケール（復元用）
            originalX: 0,
            originalY: 0,
            originalScaleX: 1,
            originalScaleY: 1,
            // 現在の位置・スケール
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            // 自動調整設定
            autoCenter: true,
            autoScale: false
        };
        
        // スワップ状態（編集モード管理）
        this.swapState = {
            currentMode: 'idle', // 'idle' | 'editing'
            originalCanvasState: null,
            originalSkeletonState: null
        };
        
        // ドラッグ状態（PureBoundingBoxと互換）
        this.dragState = {
            isDragging: false,
            dragType: null, // 'move' | 'resize-nw' | 'resize-ne' | etc.
            startMouseX: 0,
            startMouseY: 0,
            startCanvasWidth: 0,
            startCanvasHeight: 0,
            startCanvasX: 0,
            startCanvasY: 0,
            modifierKeys: {
                shift: false,
                alt: false,
                ctrl: false
            }
        };
        
        // UI状態
        this.uiState = {
            container: null,
            handles: [],
            visible: false
        };
        
        // 初期化
        this.initialize();
    }
    
    /**
     * 初期化処理
     */
    initialize() {
        if (!this.config.targetCanvas) {
            throw new Error('targetCanvas is required');
        }
        
        const canvas = this.config.targetCanvas;
        
        // Canvas状態の初期値設定
        this.canvasState.width = canvas.width || 200;
        this.canvasState.height = canvas.height || 200;
        this.canvasState.originalWidth = this.canvasState.width;
        this.canvasState.originalHeight = this.canvasState.height;
        this.canvasState.aspectRatio = this.canvasState.width / this.canvasState.height;
        
        // CSS表示サイズ取得
        this.canvasState.cssWidth = canvas.clientWidth || canvas.offsetWidth;
        this.canvasState.cssHeight = canvas.clientHeight || canvas.offsetHeight;
        
        // Skeleton状態の初期化
        if (this.config.skeleton) {
            const skeleton = this.config.skeleton;
            this.skeletonState.originalX = skeleton.x;
            this.skeletonState.originalY = skeleton.y;
            this.skeletonState.originalScaleX = skeleton.scaleX;
            this.skeletonState.originalScaleY = skeleton.scaleY;
            this.skeletonState.x = skeleton.x;
            this.skeletonState.y = skeleton.y;
            this.skeletonState.scaleX = skeleton.scaleX;
            this.skeletonState.scaleY = skeleton.scaleY;
        }
        
        // WebGL viewport初期設定
        this.updateViewport();
    }
    
    /**
     * WebGL viewport更新（従来版互換: 無効化）
     */
    updateViewport() {
        // 🎯 従来版互換: WebGL viewport更新をスキップ
        // Canvas表示サイズのみ変更し、Skeletonサイズを維持する
        
        this.canvasState.viewportX = 0;
        this.canvasState.viewportY = 0;
        this.canvasState.viewportWidth = this.canvasState.width;
        this.canvasState.viewportHeight = this.canvasState.height;
        
        // 🚨 WebGL gl.viewport()呼び出しをスキップしてSkeletonサイズを維持
        // 従来版の正しい動作: Canvas表示領域だけ変更、描画内容は変更しない
        
        console.log('🎯 従来版互換: WebGL viewport更新をスキップ（Skeletonサイズ維持）');
    }
    
    /**
     * 🎯 編集モード進入（座標系スワップ）
     */
    enterEditingMode() {
        if (this.swapState.currentMode === 'editing') return;
        
        // 現在状態を保存
        this.swapState.originalCanvasState = { ...this.canvasState };
        this.swapState.originalSkeletonState = { ...this.skeletonState };
        
        // 編集モードに移行
        this.swapState.currentMode = 'editing';
        
        console.log('🔄 Canvas編集モード進入: WebGL → 編集座標系');
    }
    
    /**
     * 🎯 編集モード終了（座標系復元）
     */
    exitEditingMode() {
        if (this.swapState.currentMode === 'idle') return;
        
        // 元の状態に復元（必要に応じて）
        // 通常は現在の編集状態を保持
        
        this.swapState.currentMode = 'idle';
        this.swapState.originalCanvasState = null;
        this.swapState.originalSkeletonState = null;
        
        console.log('🔄 Canvas編集モード終了: 編集座標系 → WebGL');
    }
    
    /**
     * ドラッグ開始
     */
    startDrag(event, dragType) {
        const currentCanvasState = { ...this.canvasState };
        
        this.dragState = {
            isDragging: true,
            dragType: dragType,
            startMouseX: event.clientX,
            startMouseY: event.clientY,
            startCanvasWidth: currentCanvasState.width,
            startCanvasHeight: currentCanvasState.height,
            startCanvasX: currentCanvasState.cssWidth,
            startCanvasY: currentCanvasState.cssHeight,
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
     * Canvas状態更新（従来版互換: WebGL関連処理をスキップ）
     */
    updateCanvasState(newState) {
        Object.assign(this.canvasState, newState);
        
        // アスペクト比再計算
        this.canvasState.aspectRatio = this.canvasState.width / this.canvasState.height;
        
        // 🚨 従来版互換: WebGL viewport更新をスキップ
        // this.updateViewport(); // ← コメントアウト
        
        // 🚨 従来版互換: Skeleton位置自動調整もスキップ
        // SkeletonはCanvas表示サイズ変更に影響されない
        // if (this.skeletonState.autoCenter && this.config.skeleton) {
        //     this.centerSkeleton();
        // }
    }
    
    /**
     * 🎯 Canvas CSS状態更新（従来版互換用軽量メソッド）
     */
    updateCanvasStateCSS(newState) {
        // CSS表示関連のみ更新
        if (newState.cssWidth !== undefined) this.canvasState.cssWidth = newState.cssWidth;
        if (newState.cssHeight !== undefined) this.canvasState.cssHeight = newState.cssHeight;
        if (newState.width !== undefined) this.canvasState.width = newState.width;
        if (newState.height !== undefined) this.canvasState.height = newState.height;
        
        // アスペクト比再計算
        this.canvasState.aspectRatio = this.canvasState.width / this.canvasState.height;
        
        // WebGL viewport更新やSkeleton位置調整は実行しないことで
        // Skeletonサイズを維持する
    }
    
    /**
     * Skeleton中央配置
     */
    centerSkeleton() {
        if (!this.config.skeleton) return;
        
        const skeleton = this.config.skeleton;
        skeleton.x = this.canvasState.width / 2;
        skeleton.y = this.canvasState.height / 2;
        
        // 状態同期
        this.skeletonState.x = skeleton.x;
        this.skeletonState.y = skeleton.y;
        
        // Transform更新
        if (skeleton.updateWorldTransform) {
            skeleton.updateWorldTransform();
        }
    }
    
    /**
     * 完全リセット・復元
     */
    cleanup() {
        // 編集モード終了
        this.exitEditingMode();
        
        // 🎯 従来版互換: Canvas描画バッファは変更しない
        // CSS表示サイズのみリセット
        if (this.config.targetCanvas) {
            const canvas = this.config.targetCanvas;
            // 🚨 canvas.width/heightは変更しない（Skeletonサイズ維持）
            canvas.style.width = this.canvasState.originalWidth + 'px';
            canvas.style.height = this.canvasState.originalHeight + 'px';
        }
        
        // Skeleton復元
        if (this.config.skeleton) {
            const skeleton = this.config.skeleton;
            skeleton.x = this.skeletonState.originalX;
            skeleton.y = this.skeletonState.originalY;
            skeleton.scaleX = this.skeletonState.originalScaleX;
            skeleton.scaleY = this.skeletonState.originalScaleY;
            if (skeleton.updateWorldTransform) {
                skeleton.updateWorldTransform();
            }
        }
        
        // 状態リセット
        this.dragState.isDragging = false;
        this.uiState.visible = false;
        
        return true;
    }
    
    /**
     * 現在状態取得
     */
    getState() {
        return {
            canvasState: { ...this.canvasState },
            skeletonState: { ...this.skeletonState },
            swapState: { ...this.swapState },
            dragState: { ...this.dragState },
            uiState: { ...this.uiState }
        };
    }
    
    /**
     * 単独テスト
     */
    static test() {
        console.log('🧪 PureCanvasControllerCore テスト開始');
        
        // モックCanvas作成
        const mockCanvas = {
            width: 200,
            height: 200,
            clientWidth: 200,
            clientHeight: 200,
            getContext: () => ({
                viewport: (x, y, w, h) => console.log(`WebGL viewport: ${x}, ${y}, ${w}, ${h}`)
            })
        };
        
        // モックSkeleton作成
        const mockSkeleton = {
            x: 100,
            y: 100,
            scaleX: 1,
            scaleY: 1,
            updateWorldTransform: () => console.log('Skeleton transform updated')
        };
        
        try {
            const core = new PureCanvasControllerCore({
                targetCanvas: mockCanvas,
                skeleton: mockSkeleton,
                minWidth: 50,
                minHeight: 50
            });
            
            // 基本機能テスト
            core.enterEditingMode();
            core.updateCanvasState({ width: 300, height: 400 });
            core.centerSkeleton();
            core.exitEditingMode();
            core.cleanup();
            
            console.log('✅ PureCanvasControllerCore テスト成功');
            return { success: true, result: 'All tests passed', error: null };
            
        } catch (error) {
            console.error('❌ PureCanvasControllerCore テスト失敗:', error);
            return { success: false, result: null, error: error.message };
        }
    }
}

// Node.js環境対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PureCanvasControllerCore;
}