/**
 * ElementObserverWebGL.js - Phase 2 アーカイブ済み
 * 
 * このファイルは archive/element-observer-phase2-complete/modules/ に移動されました
 * AutoPin開発に集中するためPhase 1 BB特化版に戻します
 * 
 * 復元方法:
 * cp archive/element-observer-phase2-complete/modules/ElementObserverWebGL.js ./
 */

// Phase 2機能が必要な場合は、アーカイブから復元してください
console.warn('ElementObserverWebGL は Phase 2完全アーカイブ済みです。');
console.info('復元方法: archive/element-observer-phase2-complete/modules/ から復元');

// 軽量なダミークラス（エラー防止用）
class ElementObserverWebGL {
    constructor() {
        console.warn('ElementObserverWebGL: Phase 2機能はアーカイブ済みです。Phase 1のElementObserverまたはElementObserverCoreをご利用ください。');
    }

    // 基本的なAPI互換性（エラー回避用）
    domToWebGL() { return { x: 0, y: 0 }; }
    webGLToDOM() { return { x: 0, y: 0 }; }
    syncSkeletonPosition() { return false; }
    cleanup() {}
}
        
        // 座標変換パラメータ
        this.coordinateSystem = {
            canvas: {
                width: canvas.width,
                height: canvas.height,
                clientWidth: canvas.clientWidth,
                clientHeight: canvas.clientHeight
            },
            viewport: {
                x: 0,
                y: 0,
                width: canvas.width,
                height: canvas.height
            },
            camera: {
                x: canvas.width / 2,
                y: canvas.height / 2,
                zoom: 1.0
            }
        };
        
        // 座標変換キャッシュ
        this.conversionCache = {
            domToWebGL: new Map(),
            webGLToDOM: new Map(),
            lastUpdate: 0,
            cacheTimeout: 16  // 約60fps
        };
        
        // 監視状態
        this.isActive = false;
        this.changeCallbacks = new Set();
        
        // DPR対応
        this.devicePixelRatio = window.devicePixelRatio || 1;
        
        this.initialize();
    }
    
    /**
     * 初期化処理
     */
    initialize() {
        console.log('🌐 ElementObserverWebGL初期化開始', {
            canvas: this.getCanvasInfo(),
            skeleton: this.getSkeletonInfo(),
            renderer: this.getRendererInfo(),
            devicePixelRatio: this.devicePixelRatio
        });
        
        // 初期座標系情報を更新
        this.updateCoordinateSystem();
        
        // Canvas・ウィンドウリサイズ監視
        this.setupResizeObserver();
        
        console.log('✅ ElementObserverWebGL初期化完了', {
            coordinateSystem: this.coordinateSystem
        });
    }
    
    /**
     * 座標系情報更新
     */
    updateCoordinateSystem() {
        // Canvas情報更新
        this.coordinateSystem.canvas = {
            width: this.canvas.width,
            height: this.canvas.height,
            clientWidth: this.canvas.clientWidth,
            clientHeight: this.canvas.clientHeight,
            offsetWidth: this.canvas.offsetWidth,
            offsetHeight: this.canvas.offsetHeight
        };
        
        // Viewport情報更新
        this.coordinateSystem.viewport = {
            x: 0,
            y: 0,
            width: this.canvas.width,
            height: this.canvas.height
        };
        
        // Camera情報更新（Renderer依存）
        if (this.renderer && this.renderer.camera) {
            this.coordinateSystem.camera = {
                x: this.renderer.camera.position.x,
                y: this.renderer.camera.position.y,
                zoom: this.renderer.camera.zoom || 1.0
            };
        }
        
        // DPR更新
        this.devicePixelRatio = window.devicePixelRatio || 1;
        
        // 変換キャッシュクリア
        this.clearConversionCache();
        
        console.log('📐 座標系情報更新完了', {
            canvas: this.coordinateSystem.canvas,
            viewport: this.coordinateSystem.viewport,
            camera: this.coordinateSystem.camera,
            devicePixelRatio: this.devicePixelRatio
        });
    }
    
    /**
     * DOM座標 → WebGL座標変換
     */
    domToWebGL(domX, domY, options = {}) {
        const cacheKey = `${domX},${domY}`;
        const now = performance.now();
        
        // キャッシュチェック
        if (!options.forceUpdate && this.conversionCache.domToWebGL.has(cacheKey)) {
            const cached = this.conversionCache.domToWebGL.get(cacheKey);
            if (now - cached.timestamp < this.conversionCache.cacheTimeout) {
                return cached.result;
            }
        }
        
        try {
            // Canvas要素の矩形情報取得
            const canvasRect = this.canvas.getBoundingClientRect();
            
            // DOM座標をCanvas相対座標に変換
            let canvasX, canvasY;
            
            if (options.coordinateType === 'percent') {
                // %座標の場合
                const parentRect = this.canvas.parentElement?.getBoundingClientRect();
                if (parentRect) {
                    const absoluteX = parentRect.left + (domX / 100) * parentRect.width;
                    const absoluteY = parentRect.top + (domY / 100) * parentRect.height;
                    canvasX = absoluteX - canvasRect.left;
                    canvasY = absoluteY - canvasRect.top;
                } else {
                    canvasX = (domX / 100) * canvasRect.width;
                    canvasY = (domY / 100) * canvasRect.height;
                }
            } else {
                // px座標の場合
                canvasX = domX - canvasRect.left;
                canvasY = domY - canvasRect.top;
            }
            
            // Canvas表示サイズからWebGL描画サイズへスケーリング
            const scaleX = this.coordinateSystem.canvas.width / this.coordinateSystem.canvas.clientWidth;
            const scaleY = this.coordinateSystem.canvas.height / this.coordinateSystem.canvas.clientHeight;
            
            let webglX = canvasX * scaleX;
            let webglY = canvasY * scaleY;
            
            // WebGL座標系補正
            if (options.spineCoordinates !== false) {
                // Spine座標系：Y軸反転、中心原点
                webglX = webglX;
                webglY = this.coordinateSystem.canvas.height - webglY;
                
                // Camera offset適用
                webglX = webglX - this.coordinateSystem.camera.x + (this.coordinateSystem.canvas.width / 2);
                webglY = webglY - this.coordinateSystem.camera.y + (this.coordinateSystem.canvas.height / 2);
            }
            
            // DPR補正
            webglX *= this.devicePixelRatio;
            webglY *= this.devicePixelRatio;
            
            const result = { x: webglX, y: webglY };
            
            // キャッシュ保存
            this.conversionCache.domToWebGL.set(cacheKey, {
                result: result,
                timestamp: now
            });
            
            console.log('🔄 DOM→WebGL座標変換:', {
                input: { domX, domY, options },
                intermediate: { canvasX, canvasY, scaleX, scaleY },
                output: result,
                canvasRect: {
                    left: canvasRect.left,
                    top: canvasRect.top,
                    width: canvasRect.width,
                    height: canvasRect.height
                }
            });
            
            return result;
            
        } catch (error) {
            console.error('❌ DOM→WebGL座標変換エラー:', error);
            return { x: 0, y: 0 };
        }
    }
    
    /**
     * WebGL座標 → DOM座標変換
     */
    webGLToDOM(webglX, webglY, options = {}) {
        const cacheKey = `${webglX},${webglY}`;
        const now = performance.now();
        
        // キャッシュチェック
        if (!options.forceUpdate && this.conversionCache.webGLToDOM.has(cacheKey)) {
            const cached = this.conversionCache.webGLToDOM.get(cacheKey);
            if (now - cached.timestamp < this.conversionCache.cacheTimeout) {
                return cached.result;
            }
        }
        
        try {
            // DPR補正を逆適用
            let x = webglX / this.devicePixelRatio;
            let y = webglY / this.devicePixelRatio;
            
            // WebGL座標系補正を逆適用
            if (options.spineCoordinates !== false) {
                // Camera offset逆適用
                x = x + this.coordinateSystem.camera.x - (this.coordinateSystem.canvas.width / 2);
                y = y + this.coordinateSystem.camera.y - (this.coordinateSystem.canvas.height / 2);
                
                // Spine座標系：Y軸反転逆適用
                y = this.coordinateSystem.canvas.height - y;
            }
            
            // WebGL描画サイズからCanvas表示サイズへスケーリング
            const scaleX = this.coordinateSystem.canvas.clientWidth / this.coordinateSystem.canvas.width;
            const scaleY = this.coordinateSystem.canvas.clientHeight / this.coordinateSystem.canvas.height;
            
            const canvasX = x * scaleX;
            const canvasY = y * scaleY;
            
            // Canvas相対座標からDOM座標へ変換
            const canvasRect = this.canvas.getBoundingClientRect();
            let domX = canvasRect.left + canvasX;
            let domY = canvasRect.top + canvasY;
            
            // %座標要求の場合
            if (options.coordinateType === 'percent') {
                const parentRect = this.canvas.parentElement?.getBoundingClientRect();
                if (parentRect) {
                    domX = ((domX - parentRect.left) / parentRect.width) * 100;
                    domY = ((domY - parentRect.top) / parentRect.height) * 100;
                }
            }
            
            const result = { x: domX, y: domY };
            
            // キャッシュ保存
            this.conversionCache.webGLToDOM.set(cacheKey, {
                result: result,
                timestamp: now
            });
            
            console.log('🔄 WebGL→DOM座標変換:', {
                input: { webglX, webglY, options },
                intermediate: { x, y, canvasX, canvasY, scaleX, scaleY },
                output: result,
                canvasRect: {
                    left: canvasRect.left,
                    top: canvasRect.top,
                    width: canvasRect.width,
                    height: canvasRect.height
                }
            });
            
            return result;
            
        } catch (error) {
            console.error('❌ WebGL→DOM座標変換エラー:', error);
            return { x: 0, y: 0 };
        }
    }
    
    /**
     * Skeleton位置の自動同期（DOM座標から）
     */
    syncSkeletonPosition(domPosition, options = {}) {
        if (!this.skeleton) {
            console.warn('⚠️ Skeletonが見つかりません');
            return false;
        }
        
        try {
            // DOM座標をWebGL座標に変換
            const webglPos = this.domToWebGL(
                domPosition.x, 
                domPosition.y, 
                {
                    coordinateType: options.coordinateType || 'pixel',
                    spineCoordinates: true,
                    forceUpdate: options.forceUpdate
                }
            );
            
            // Skeleton位置更新
            const oldX = this.skeleton.x;
            const oldY = this.skeleton.y;
            
            this.skeleton.x = webglPos.x;
            this.skeleton.y = webglPos.y;
            
            // World Transform更新
            this.skeleton.updateWorldTransform();
            
            // 変化通知
            this.notifyChange('skeletonPosition', {
                oldPosition: { x: oldX, y: oldY },
                newPosition: { x: this.skeleton.x, y: this.skeleton.y },
                domPosition: domPosition,
                webglPosition: webglPos
            });
            
            console.log('🎯 Skeleton位置同期完了:', {
                domPosition,
                webglPosition: webglPos,
                skeletonPosition: { x: this.skeleton.x, y: this.skeleton.y },
                positionChange: {
                    deltaX: this.skeleton.x - oldX,
                    deltaY: this.skeleton.y - oldY
                }
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Skeleton位置同期エラー:', error);
            return false;
        }
    }
    
    /**
     * Canvas Matrix統合更新
     */
    updateCanvasMatrix(domTransformMatrix, options = {}) {
        if (!this.renderer || !this.renderer.camera) {
            console.warn('⚠️ Renderer/Cameraが見つかりません');
            return false;
        }
        
        try {
            // DOM Transform MatrixをWebGL座標系に適用
            const camera = this.renderer.camera;
            
            // Transform Matrixから平行移動・スケール・回転を抽出
            const transform = this.extractTransformComponents(domTransformMatrix);
            
            // Camera位置更新
            if (options.updateCameraPosition !== false) {
                // DOM平行移動をWebGL Camera座標に変換
                const cameraPos = this.domToWebGL(
                    transform.translateX, 
                    transform.translateY,
                    { 
                        coordinateType: 'pixel',
                        spineCoordinates: false  // Camera座標系
                    }
                );
                
                camera.position.x = cameraPos.x;
                camera.position.y = cameraPos.y;
            }
            
            // Camera zoom更新
            if (options.updateCameraZoom !== false && transform.scaleX > 0) {
                camera.zoom = transform.scaleX;  // uniform scaling想定
            }
            
            // Viewport設定
            camera.setViewport(
                this.coordinateSystem.canvas.width, 
                this.coordinateSystem.canvas.height
            );
            
            // 座標系情報更新
            this.coordinateSystem.camera = {
                x: camera.position.x,
                y: camera.position.y,
                zoom: camera.zoom || 1.0
            };
            
            // 変化通知
            this.notifyChange('canvasMatrix', {
                domTransformMatrix,
                extractedTransform: transform,
                cameraState: this.coordinateSystem.camera
            });
            
            console.log('📐 Canvas Matrix統合更新完了:', {
                domTransformMatrix,
                extractedTransform: transform,
                cameraState: this.coordinateSystem.camera
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Canvas Matrix統合更新エラー:', error);
            return false;
        }
    }
    
    /**
     * Transform Matrixから成分抽出
     */
    extractTransformComponents(matrix) {
        if (!matrix || matrix.length < 16) {
            return {
                translateX: 0,
                translateY: 0,
                scaleX: 1,
                scaleY: 1,
                rotation: 0
            };
        }
        
        // 4x4 Matrix → 2D Transform components
        const translateX = matrix[3];   // m14
        const translateY = matrix[7];   // m24
        const scaleX = Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1]);  // ||[m11, m12]||
        const scaleY = Math.sqrt(matrix[4] * matrix[4] + matrix[5] * matrix[5]);  // ||[m21, m22]||
        const rotation = Math.atan2(matrix[1], matrix[0]);  // atan2(m12, m11)
        
        return {
            translateX,
            translateY,
            scaleX,
            scaleY,
            rotation
        };
    }
    
    /**
     * リサイズ監視セットアップ
     */
    setupResizeObserver() {
        // Canvas要素のリサイズ監視
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    if (entry.target === this.canvas) {
                        this.onCanvasResize();
                    }
                }
            });
            
            this.resizeObserver.observe(this.canvas);
        }
        
        // ウィンドウリサイズ監視
        this.windowResizeHandler = this.onWindowResize.bind(this);
        window.addEventListener('resize', this.windowResizeHandler);
        
        console.log('👁️ WebGLリサイズ監視セットアップ完了');
    }
    
    /**
     * Canvasリサイズ処理
     */
    onCanvasResize() {
        console.log('📐 Canvasリサイズ検出');
        
        // 座標系情報更新
        this.updateCoordinateSystem();
        
        // 変化通知
        this.notifyChange('canvasResize', {
            canvasInfo: this.coordinateSystem.canvas
        });
    }
    
    /**
     * ウィンドウリサイズ処理
     */
    onWindowResize() {
        // DPR変化チェック
        const newDPR = window.devicePixelRatio || 1;
        if (newDPR !== this.devicePixelRatio) {
            console.log('📱 DevicePixelRatio変化検出:', {
                old: this.devicePixelRatio,
                new: newDPR
            });
            
            this.devicePixelRatio = newDPR;
            this.updateCoordinateSystem();
            
            // 変化通知
            this.notifyChange('devicePixelRatioChange', {
                oldDPR: this.devicePixelRatio,
                newDPR: newDPR
            });
        }
    }
    
    /**
     * 変換キャッシュクリア
     */
    clearConversionCache() {
        this.conversionCache.domToWebGL.clear();
        this.conversionCache.webGLToDOM.clear();
        this.conversionCache.lastUpdate = performance.now();
        
        console.log('🧹 座標変換キャッシュクリア完了');
    }
    
    /**
     * 変化通知
     */
    notifyChange(type, data) {
        const event = {
            type,
            data,
            timestamp: performance.now(),
            coordinateSystem: { ...this.coordinateSystem },
            devicePixelRatio: this.devicePixelRatio
        };
        
        this.changeCallbacks.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error('❌ WebGL変化コールバックエラー:', error);
            }
        });
    }
    
    /**
     * 変化監視コールバック登録
     */
    onChange(callback) {
        this.changeCallbacks.add(callback);
        return () => this.changeCallbacks.delete(callback);
    }
    
    /**
     * Canvas情報取得（デバッグ用）
     */
    getCanvasInfo() {
        return {
            element: `${this.canvas.tagName}#${this.canvas.id || 'none'}`,
            size: `${this.canvas.width}x${this.canvas.height}`,
            clientSize: `${this.canvas.clientWidth}x${this.canvas.clientHeight}`,
            style: {
                width: this.canvas.style.width,
                height: this.canvas.style.height,
                position: this.canvas.style.position
            }
        };
    }
    
    /**
     * Skeleton情報取得（デバッグ用）
     */
    getSkeletonInfo() {
        if (!this.skeleton) return null;
        
        return {
            position: { x: this.skeleton.x, y: this.skeleton.y },
            scale: { x: this.skeleton.scaleX, y: this.skeleton.scaleY },
            bounds: this.skeleton.getBounds ? this.skeleton.getBounds() : null
        };
    }
    
    /**
     * Renderer情報取得（デバッグ用）
     */
    getRendererInfo() {
        if (!this.renderer) return null;
        
        return {
            camera: this.renderer.camera ? {
                position: this.renderer.camera.position,
                zoom: this.renderer.camera.zoom
            } : null,
            canvas: this.renderer.canvas === this.canvas
        };
    }
    
    /**
     * 現在の状態取得
     */
    getState() {
        return {
            coordinateSystem: { ...this.coordinateSystem },
            devicePixelRatio: this.devicePixelRatio,
            isActive: this.isActive,
            cacheSize: {
                domToWebGL: this.conversionCache.domToWebGL.size,
                webGLToDOM: this.conversionCache.webGLToDOM.size
            }
        };
    }
    
    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            canvas: this.getCanvasInfo(),
            skeleton: this.getSkeletonInfo(),
            renderer: this.getRendererInfo(),
            state: this.getState(),
            changeCallbacks: this.changeCallbacks.size
        };
    }
    
    /**
     * クリーンアップ
     */
    cleanup() {
        // リサイズ監視停止
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        
        if (this.windowResizeHandler) {
            window.removeEventListener('resize', this.windowResizeHandler);
            this.windowResizeHandler = null;
        }
        
        // キャッシュクリア
        this.clearConversionCache();
        
        // コールバッククリア
        this.changeCallbacks.clear();
        
        this.isActive = false;
        
        console.log('🧹 ElementObserverWebGL クリーンアップ完了');
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.ElementObserverWebGL = ElementObserverWebGL;
}