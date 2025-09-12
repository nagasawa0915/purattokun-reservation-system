/**
 * PureCanvasControllerBounds.js
 * 
 * 🎯 Canvas専用座標計算マイクロモジュール（従来版直接連携システム実装）
 * - 外部依存: PureCanvasControllerCore（同フォルダ内）
 * - 責務: Canvas座標・WebGL viewport・Skeleton位置計算のみ
 * - 基盤: PureBoundingBoxBoundsから座標計算ロジック流用・改良
 * - 連携: 従来版の階層構造による自動連携システムを復活実装
 */

class PureCanvasControllerBounds {
    constructor(core) {
        this.core = core;
    }
    
    /**
     * Canvas移動計算（PureBoundingBox calculateMoveから応用）
     */
    calculateCanvasMove(deltaX, deltaY) {
        const dragState = this.core.dragState;
        
        // 新しいCanvas位置計算（CSS座標系）
        const newCanvasState = {
            cssLeft: dragState.startCanvasX + deltaX,
            cssTop: dragState.startCanvasY + deltaY,
            width: dragState.startCanvasWidth,
            height: dragState.startCanvasHeight
        };
        
        return newCanvasState;
    }
    
    /**
     * 🎯 Canvas リサイズ計算（PureBoundingBox calculateResizeから応用）
     */
    calculateCanvasResize(deltaX, deltaY, handleType) {
        const dragState = this.core.dragState;
        
        const newCanvasState = {
            width: dragState.startCanvasWidth,
            height: dragState.startCanvasHeight,
            cssLeft: this.core.canvasState.cssWidth,
            cssTop: this.core.canvasState.cssHeight
        };
        
        // Canvas専用のリサイズ計算（描画バッファサイズ変更）
        switch (handleType) {
            case 'nw':
                newCanvasState.width = dragState.startCanvasWidth - deltaX;
                newCanvasState.height = dragState.startCanvasHeight - deltaY;
                break;
            case 'ne':
                newCanvasState.width = dragState.startCanvasWidth + deltaX;
                newCanvasState.height = dragState.startCanvasHeight - deltaY;
                break;
            case 'se':
                newCanvasState.width = dragState.startCanvasWidth + deltaX;
                newCanvasState.height = dragState.startCanvasHeight + deltaY;
                break;
            case 'sw':
                newCanvasState.width = dragState.startCanvasWidth - deltaX;
                newCanvasState.height = dragState.startCanvasHeight + deltaY;
                break;
            case 'n':
                newCanvasState.height = dragState.startCanvasHeight - deltaY;
                break;
            case 's':
                newCanvasState.height = dragState.startCanvasHeight + deltaY;
                break;
            case 'w':
                newCanvasState.width = dragState.startCanvasWidth - deltaX;
                break;
            case 'e':
                newCanvasState.width = dragState.startCanvasWidth + deltaX;
                break;
        }
        
        // Canvas専用制約適用
        newCanvasState = this.applyCanvasConstraints(newCanvasState, handleType);
        
        // 修飾キー対応
        newCanvasState = this.applyModifierKeys(newCanvasState, handleType);
        
        return newCanvasState;
    }
    
    /**
     * Canvas専用制約適用（最小・最大サイズ）
     */
    applyCanvasConstraints(canvasState, handleType) {
        const config = this.core.config;
        
        // 最小サイズ制限
        if (canvasState.width < config.minWidth) {
            canvasState.width = config.minWidth;
        }
        if (canvasState.height < config.minHeight) {
            canvasState.height = config.minHeight;
        }
        
        // 最大サイズ制限
        if (canvasState.width > config.maxWidth) {
            canvasState.width = config.maxWidth;
        }
        if (canvasState.height > config.maxHeight) {
            canvasState.height = config.maxHeight;
        }
        
        return canvasState;
    }
    
    /**
     * 修飾キー対応（Shift: 等比、Alt: 中心基準）
     */
    applyModifierKeys(canvasState, handleType) {
        const dragState = this.core.dragState;
        
        // Shift: 等比スケール（アスペクト比保持）
        if (dragState.modifierKeys.shift) {
            const aspectRatio = this.core.canvasState.aspectRatio;
            
            if (handleType === 'n' || handleType === 's') {
                // 縦方向変更時: 横幅を自動調整
                canvasState.width = canvasState.height * aspectRatio;
                // Canvas中央配置調整
                canvasState.cssLeft = this.core.canvasState.cssWidth + 
                    (dragState.startCanvasWidth - canvasState.width) / 2;
            } else if (handleType === 'w' || handleType === 'e') {
                // 横方向変更時: 縦幅を自動調整
                canvasState.height = canvasState.width / aspectRatio;
                // Canvas中央配置調整
                canvasState.cssTop = this.core.canvasState.cssHeight + 
                    (dragState.startCanvasHeight - canvasState.height) / 2;
            } else {
                // 角ハンドル: 主要変更方向に基づく等比調整
                const widthChange = Math.abs(canvasState.width - dragState.startCanvasWidth);
                const heightChange = Math.abs(canvasState.height - dragState.startCanvasHeight);
                
                if (widthChange > heightChange) {
                    canvasState.height = canvasState.width / aspectRatio;
                } else {
                    canvasState.width = canvasState.height * aspectRatio;
                }
            }
        }
        
        // Alt: 中心基準スケール（Canvas中央固定）
        if (dragState.modifierKeys.alt) {
            const centerX = dragState.startCanvasX + dragState.startCanvasWidth / 2;
            const centerY = dragState.startCanvasY + dragState.startCanvasHeight / 2;
            
            canvasState.cssLeft = centerX - canvasState.width / 2;
            canvasState.cssTop = centerY - canvasState.height / 2;
        }
        
        return canvasState;
    }
    
    /**
     * 🎯 Canvas状態を実際の要素に適用（従来版直接連携システム）
     */
    applyCanvasStateToElement(canvasState) {
        const canvas = this.core.config.targetCanvas;
        if (!canvas) {
            console.warn('⚠️ Canvas要素が見つかりません - 連携システム実行できません');
            return;
        }
        
        // ドラッグ終了時のみログ出力（ドラッグ中の大量ログ防止）
        if (!this.core.dragState.isDragging) {
            console.log(`🎯 従来版直接連携システム実行: ${canvasState.width}x${canvasState.height}`);
        }
        
        // 1. CSS表示サイズ更新
        if (canvasState.width !== undefined) {
            canvas.style.width = canvasState.width + 'px';
        }
        if (canvasState.height !== undefined) {
            canvas.style.height = canvasState.height + 'px';
        }
        
        // CSS表示位置更新（必要に応じて）
        if (canvasState.cssLeft !== undefined) {
            canvas.style.left = canvasState.cssLeft + 'px';
        }
        if (canvasState.cssTop !== undefined) {
            canvas.style.top = canvasState.cssTop + 'px';
        }
        
        // 2. WebGL内部解像度更新（従来版の正しい動作を復活）
        if (canvasState.width !== undefined && canvasState.height !== undefined) {
            try {
                canvas.width = canvasState.width;
                canvas.height = canvasState.height;
                
                // 3. WebGL Viewport更新
                this.updateWebGLViewport(canvasState.width, canvasState.height);
                
            } catch (error) {
                console.error('❌ Canvas描画バッファ更新エラー:', error);
            }
        }
        
        // Core状態同期
        if (this.core.updateCanvasStateCSS) {
            this.core.updateCanvasStateCSS(canvasState);
        }
    }
    
    /**
     * 🎯 WebGL viewport更新（従来版直接連携システム復活）
     */
    updateWebGLViewport(width, height) {
        try {
            const canvas = this.core.config.targetCanvas;
            if (!canvas) {
                console.warn('⚠️ Canvas要素が見つかりません - WebGL viewport更新できません');
                return;
            }
            
            // WebGLコンテキスト取得
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                // WebGLコンテキストなし - 通常のCanvasとして処理
                if (!this.core.dragState.isDragging) {
                    console.log(`🎯 WebGLコンテキストなし - 標準Canvas処理のみ実行`);
                }
                return;
            }
            
            // WebGL viewport設定
            gl.viewport(0, 0, width, height);
            
            // Spineレンダラーのカメラ設定更新（存在する場合）
            const renderer = this.core.config.renderer;
            if (renderer && renderer.camera) {
                renderer.camera.viewportWidth = width;
                renderer.camera.viewportHeight = height;
                
                // カメラ更新実行
                if (renderer.camera.update) {
                    renderer.camera.update();
                }
                
                if (!this.core.dragState.isDragging) {
                    console.log(`🎯 WebGL viewport + Spineカメラ更新完了: ${width}x${height}`);
                }
            } else {
                if (!this.core.dragState.isDragging) {
                    console.log(`🎯 WebGL viewport更新完了: ${width}x${height}（Spineレンダラーなし）`);
                }
            }
            
        } catch (error) {
            console.error('❌ WebGL viewport更新エラー:', error);
            
            // エラーハンドリング: WebGL処理失敗時でも処理を継続
            if (!this.core.dragState.isDragging) {
                console.log(`⚠️ WebGL処理失敗 - 標準Canvas処理で継続`);
            }
        }
    }
    
    /**
     * 🎯 Skeleton位置自動調整（Canvas中央配置）
     */
    adjustSkeletonPosition() {
        if (!this.core.config.skeleton) return;
        
        const skeleton = this.core.config.skeleton;
        const canvasState = this.core.canvasState;
        
        // Canvas中央に配置
        skeleton.x = canvasState.width / 2;
        skeleton.y = canvasState.height / 2;
        
        // Transform更新
        if (skeleton.updateWorldTransform) {
            skeleton.updateWorldTransform();
        }
        
        // Core状態同期
        this.core.skeletonState.x = skeleton.x;
        this.core.skeletonState.y = skeleton.y;
        
        // ドラッグ終了時のみログ出力
        if (!this.core.dragState.isDragging) {
            console.log(`🎯 Skeleton位置調整: (${skeleton.x}, ${skeleton.y}) - Canvas中央配置`);
        }
    }
    
    /**
     * 🎯 はみ出し検出・自動フィット
     */
    detectAndAutoFit() {
        if (!this.core.config.skeleton) return null;
        
        const skeleton = this.core.config.skeleton;
        const canvasState = this.core.canvasState;
        
        // Skeletonのバウンディングボックス取得（概算）
        const skeletonBounds = this.getSkeletonBounds(skeleton);
        
        // はみ出し検出
        const overflow = {
            left: skeletonBounds.x < 0,
            right: skeletonBounds.x + skeletonBounds.width > canvasState.width,
            top: skeletonBounds.y < 0,
            bottom: skeletonBounds.y + skeletonBounds.height > canvasState.height
        };
        
        const hasOverflow = overflow.left || overflow.right || overflow.top || overflow.bottom;
        
        if (hasOverflow) {
            // 自動フィット計算
            const fitSize = this.calculateAutoFitSize(skeletonBounds);
            console.log(`🔍 はみ出し検出 → 推奨Canvas サイズ: ${fitSize.width}x${fitSize.height}`);
            
            return {
                hasOverflow: true,
                overflow: overflow,
                skeletonBounds: skeletonBounds,
                recommendedSize: fitSize
            };
        }
        
        return {
            hasOverflow: false,
            skeletonBounds: skeletonBounds
        };
    }
    
    /**
     * Skeletonバウンディングボックス取得（概算）
     */
    getSkeletonBounds(skeleton) {
        // 簡易実装: スケールベースの概算
        const baseSize = 200; // ベースサイズ（実際のアセットに応じて調整）
        const width = baseSize * Math.abs(skeleton.scaleX);
        const height = baseSize * Math.abs(skeleton.scaleY);
        
        return {
            x: skeleton.x - width / 2,
            y: skeleton.y - height / 2,
            width: width,
            height: height
        };
    }
    
    /**
     * 自動フィットサイズ計算
     */
    calculateAutoFitSize(skeletonBounds) {
        const margin = 50; // 余白
        
        const fitWidth = Math.max(
            skeletonBounds.width + margin * 2,
            this.core.config.minWidth
        );
        const fitHeight = Math.max(
            skeletonBounds.height + margin * 2,
            this.core.config.minHeight
        );
        
        return {
            width: Math.min(fitWidth, this.core.config.maxWidth),
            height: Math.min(fitHeight, this.core.config.maxHeight)
        };
    }
    
    /**
     * 単独テスト（従来版直接連携システム）
     */
    static test() {
        console.log('🧪 PureCanvasControllerBounds 従来版直接連携システム テスト開始');
        
        // モックCore作成（従来版連携システム対応）
        const mockCore = {
            config: { 
                minWidth: 50, minHeight: 50, maxWidth: 1000, maxHeight: 1000, 
                targetCanvas: { 
                    width: 200, height: 200, style: {},
                    getContext: () => null // WebGL未対応を想定
                },
                renderer: null // Spineレンダラー未接続を想定
            },
            canvasState: { width: 200, height: 200, aspectRatio: 1, cssWidth: 200, cssHeight: 200 },
            skeletonState: { x: 100, y: 100 },
            dragState: { 
                startCanvasWidth: 200, startCanvasHeight: 200, startCanvasX: 0, startCanvasY: 0,
                modifierKeys: { shift: false, alt: false },
                isDragging: false
            },
            updateCanvasStateCSS: (state) => console.log('Canvas状態同期:', state)
        };
        
        try {
            const bounds = new PureCanvasControllerBounds(mockCore);
            
            // 基本機能テスト
            const moveResult = bounds.calculateCanvasMove(10, 20);
            console.log('📐 移動計算結果:', moveResult);
            
            const resizeResult = bounds.calculateCanvasResize(50, 30, 'se');
            console.log('📏 リサイズ計算結果:', resizeResult);
            
            // 制約テスト
            const constrainedResult = bounds.applyCanvasConstraints({ width: 10, height: 10 }, 'se');
            console.log('🔒 制約適用結果:', constrainedResult);
            
            // 従来版直接連携システムテスト
            bounds.applyCanvasStateToElement({ width: 300, height: 250 });
            console.log('🎯 従来版直接連携システム実行テスト完了');
            
            bounds.updateWebGLViewport(300, 250);
            console.log('🎯 WebGL viewport更新テスト完了');
            
            console.log('✅ PureCanvasControllerBounds 従来版直接連携システム テスト成功');
            return { success: true, result: 'All tests passed with legacy integration', error: null };
            
        } catch (error) {
            console.error('❌ PureCanvasControllerBounds テスト失敗:', error);
            return { success: false, result: null, error: error.message };
        }
    }
}

// Node.js環境対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PureCanvasControllerBounds;
}