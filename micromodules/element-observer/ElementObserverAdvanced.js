/**
 * ElementObserverAdvanced.js
 * 
 * 🚀 Phase 2統合制御システム - 高度座標系統合
 * - 5座標系の完全統合・統一API提供
 * - Transform・WebGL・Responsive機能の統合制御
 * - PureBoundingBox高度統合・次世代座標制御
 */

class ElementObserverAdvanced extends ElementObserver {
    constructor() {
        super();  // Phase 1基本機能継承
        
        // Phase 2専用モジュール
        this.transform = null;      // ElementObserverTransform
        this.webgl = null;          // ElementObserverWebGL  
        this.responsive = null;     // ElementObserverResponsive
        
        // 統合制御状態
        this.integrationState = {
            initialized: false,
            activeModules: [],
            coordinateSystemsActive: 0,
            lastSyncTimestamp: 0
        };
        
        // 5つの座標系管理
        this.coordinateSystems = {
            // 1. DOM座標系（%基準）
            dom: {
                x: 0, y: 0, unit: '%',
                transform: 'translate(-50%, -50%)'
            },
            
            // 2. CSS Transform座標系
            transform: {
                tx: 0, ty: 0, scale: 1, rotation: 0,
                static: 'translate(-50%, -50%)',
                dynamic: 'translate(0px, 0px)',
                combined: null
            },
            
            // 3. WebGL Canvas座標系
            webgl: {
                x: 0, y: 0, scale: 1,
                camera: { x: 0, y: 0, zoom: 1 }
            },
            
            // 4. Skeleton座標系（Spine）
            skeleton: {
                x: 0, y: 0, scaleX: 1, scaleY: 1,
                bounds: null
            },
            
            // 5. Canvas描画座標系
            canvas: {
                displayWidth: 0, displayHeight: 0,
                bufferWidth: 0, bufferHeight: 0,
                scaleRatio: { x: 1, y: 1 }
            }
        };
        
        // 統合コールバック
        this.integrationCallbacks = new Set();
        
        console.log('🚀 ElementObserverAdvanced作成完了');
    }
    
    /**
     * Phase 2高度初期化（WebGL対応要素用）
     */
    async initializeAdvanced(targetElement, canvas, skeleton, renderer, options = {}) {
        console.log('🚀 ElementObserverAdvanced高度初期化開始', {
            targetElement: this.getElementInfo(targetElement),
            canvas: canvas ? `${canvas.tagName}#${canvas.id}` : null,
            skeleton: skeleton ? 'Spine Skeleton' : null,
            renderer: renderer ? 'Spine Renderer' : null,
            options
        });
        
        try {
            // Phase 1基本機能初期化
            await this.initializePhase1(targetElement, options);
            
            // Phase 2専用モジュール初期化
            await this.initializePhase2Modules(targetElement, canvas, skeleton, renderer, options);
            
            // 統合システム初期化
            await this.initializeIntegrationSystem();
            
            // 初期座標同期
            await this.performInitialCoordinateSync();
            
            this.integrationState.initialized = true;
            
            console.log('✅ ElementObserverAdvanced高度初期化完了', {
                integrationState: this.integrationState,
                coordinateSystems: this.coordinateSystems,
                activeModules: this.integrationState.activeModules
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ ElementObserverAdvanced高度初期化エラー:', error);
            return false;
        }
    }
    
    /**
     * Phase 1基本機能初期化
     */
    async initializePhase1(targetElement, options) {
        // 親要素サイズ監視開始
        const unobserve = this.observeParentSize(targetElement, (parentRect, isValid) => {
            this.onParentSizeChange(parentRect, isValid);
        });
        
        this.integrationState.activeModules.push('phase1-core');
        console.log('✅ Phase 1基本機能初期化完了');
    }
    
    /**
     * Phase 2専用モジュール初期化
     */
    async initializePhase2Modules(targetElement, canvas, skeleton, renderer, options) {
        // Transform統合監視初期化
        if (targetElement) {
            this.transform = new ElementObserverTransform(targetElement);
            this.setupTransformIntegration();
            this.integrationState.activeModules.push('transform');
            console.log('🎯 ElementObserverTransform初期化完了');
        }
        
        // WebGL統合初期化
        if (canvas && skeleton && renderer) {
            this.webgl = new ElementObserverWebGL(canvas, skeleton, renderer);
            this.setupWebGLIntegration();
            this.integrationState.activeModules.push('webgl');
            console.log('🌐 ElementObserverWebGL初期化完了');
        }
        
        // Responsive管理初期化
        if (canvas) {
            this.responsive = new ElementObserverResponsive(canvas, {
                cssWidth: options.cssWidth || '25%',
                cssHeight: options.cssHeight || '25%',
                bufferWidth: options.bufferWidth || 512,
                bufferHeight: options.bufferHeight || 512,
                quality: options.quality || 'high',
                ...options.responsive
            });
            this.setupResponsiveIntegration();
            this.integrationState.activeModules.push('responsive');
            console.log('📱 ElementObserverResponsive初期化完了');
        }
        
        this.integrationState.coordinateSystemsActive = this.integrationState.activeModules.length;
    }
    
    /**
     * Transform統合セットアップ
     */
    setupTransformIntegration() {
        this.transform.onChange((event) => {
            this.onTransformChange(event);
        });
        
        // 現在の状態を座標系に反映
        const transformState = this.transform.getState();
        this.coordinateSystems.transform = {
            tx: transformState.cssVariables.tx,
            ty: transformState.cssVariables.ty,
            scale: transformState.cssVariables.scale,
            rotation: transformState.cssVariables.rotation,
            static: transformState.transforms.static,
            dynamic: transformState.transforms.dynamic,
            combined: transformState.transforms.combined
        };
    }
    
    /**
     * WebGL統合セットアップ
     */
    setupWebGLIntegration() {
        this.webgl.onChange((event) => {
            this.onWebGLChange(event);
        });
        
        // 現在の状態を座標系に反映
        const webglState = this.webgl.getState();
        this.coordinateSystems.webgl = {
            x: webglState.coordinateSystem.camera.x,
            y: webglState.coordinateSystem.camera.y,
            scale: 1,
            camera: webglState.coordinateSystem.camera
        };
        
        // Skeleton情報取得
        if (this.webgl.skeleton) {
            this.coordinateSystems.skeleton = {
                x: this.webgl.skeleton.x,
                y: this.webgl.skeleton.y,
                scaleX: this.webgl.skeleton.scaleX,
                scaleY: this.webgl.skeleton.scaleY,
                bounds: this.webgl.skeleton.getBounds ? this.webgl.skeleton.getBounds() : null
            };
        }
    }
    
    /**
     * Responsive統合セットアップ
     */
    setupResponsiveIntegration() {
        this.responsive.onChange((event) => {
            this.onResponsiveChange(event);
        });
        
        // 現在の状態を座標系に反映
        const responsiveState = this.responsive.getState();
        this.coordinateSystems.canvas = {
            displayWidth: responsiveState.actualSizes.css.width,
            displayHeight: responsiveState.actualSizes.css.height,
            bufferWidth: responsiveState.actualSizes.buffer.width,
            bufferHeight: responsiveState.actualSizes.buffer.height,
            scaleRatio: responsiveState.actualSizes.scaleRatio
        };
    }
    
    /**
     * 統合システム初期化
     */
    async initializeIntegrationSystem() {
        // 座標同期システム開始
        this.syncInterval = setInterval(() => {
            this.performCoordinateSync();
        }, 16);  // 60fps同期
        
        console.log('🔄 統合座標同期システム開始');
    }
    
    /**
     * 初期座標同期
     */
    async performInitialCoordinateSync() {
        console.log('🔄 初期座標同期実行');
        
        // 各モジュールの現在状態を取得・統合
        this.updateAllCoordinateSystems();
        
        // 初期同期実行
        this.performCoordinateSync();
        
        this.integrationState.lastSyncTimestamp = performance.now();
    }
    
    /**
     * 🎯 統一座標設定API（メイン機能）
     */
    setUnifiedPosition(x, y, unit = '%', options = {}) {
        console.log('🎯 統一座標設定開始:', { x, y, unit, options });
        
        if (!this.integrationState.initialized) {
            console.warn('⚠️ Advanced未初期化');
            return false;
        }
        
        try {
            const oldCoordinates = JSON.parse(JSON.stringify(this.coordinateSystems));
            
            // 1. DOM座標更新
            this.updateDOMCoordinates(x, y, unit, options);
            
            // 2. Transform更新（CSS変数）
            this.updateTransformCoordinates(x, y, unit, options);
            
            // 3. WebGL座標同期
            this.updateWebGLCoordinates(x, y, unit, options);
            
            // 4. Skeleton位置同期
            this.updateSkeletonCoordinates(x, y, unit, options);
            
            // 5. Canvas Matrix更新
            this.updateCanvasMatrix(options);
            
            // 統合通知
            this.notifyIntegrationChange('unifiedPositionUpdate', {
                input: { x, y, unit, options },
                oldCoordinates,
                newCoordinates: this.coordinateSystems,
                timestamp: performance.now()
            });
            
            console.log('✅ 統一座標設定完了:', {
                input: { x, y, unit },
                coordinateSystems: this.coordinateSystems
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ 統一座標設定エラー:', error);
            return false;
        }
    }
    
    /**
     * DOM座標更新
     */
    updateDOMCoordinates(x, y, unit, options) {
        this.coordinateSystems.dom = { x, y, unit };
        
        // 実際のDOM要素に適用
        if (this.transform && this.transform.targetElement) {
            const element = this.transform.targetElement;
            element.style.left = x + unit;
            element.style.top = y + unit;
        }
        
        console.log('📐 DOM座標更新:', this.coordinateSystems.dom);
    }
    
    /**
     * Transform座標更新
     */
    updateTransformCoordinates(x, y, unit, options) {
        if (!this.transform) return;
        
        // DOM座標からTransform オフセットを計算
        const transformOffset = this.calculateTransformOffset(x, y, unit);
        
        // CSS変数更新
        this.transform.setCSSVariables({
            tx: transformOffset.tx,
            ty: transformOffset.ty
        });
        
        // 座標系状態更新
        this.coordinateSystems.transform.tx = transformOffset.tx;
        this.coordinateSystems.transform.ty = transformOffset.ty;
        this.coordinateSystems.transform.combined = this.transform.getCombinedTransform();
        
        console.log('🎯 Transform座標更新:', this.coordinateSystems.transform);
    }
    
    /**
     * WebGL座標更新
     */
    updateWebGLCoordinates(x, y, unit, options) {
        if (!this.webgl) return;
        
        // DOM座標をWebGL座標に変換
        const webglCoords = this.webgl.domToWebGL(x, y, {
            coordinateType: unit === '%' ? 'percent' : 'pixel',
            spineCoordinates: true
        });
        
        // 座標系状態更新
        this.coordinateSystems.webgl.x = webglCoords.x;
        this.coordinateSystems.webgl.y = webglCoords.y;
        
        console.log('🌐 WebGL座標更新:', this.coordinateSystems.webgl);
    }
    
    /**
     * Skeleton座標更新
     */
    updateSkeletonCoordinates(x, y, unit, options) {
        if (!this.webgl || !this.webgl.skeleton) return;
        
        // WebGL座標でSkeleton位置同期
        this.webgl.syncSkeletonPosition({ x, y }, {
            coordinateType: unit === '%' ? 'percent' : 'pixel'
        });
        
        // 座標系状態更新
        this.coordinateSystems.skeleton.x = this.webgl.skeleton.x;
        this.coordinateSystems.skeleton.y = this.webgl.skeleton.y;
        
        console.log('🎮 Skeleton座標更新:', this.coordinateSystems.skeleton);
    }
    
    /**
     * Canvas Matrix更新
     */
    updateCanvasMatrix(options) {
        if (!this.webgl || !this.transform) return;
        
        // Transform MatrixをCanvas Matrixに適用
        const transformMatrix = this.transform.getCombinedMatrix();
        this.webgl.updateCanvasMatrix(transformMatrix, options);
        
        // Camera状態を座標系に反映
        const webglState = this.webgl.getState();
        this.coordinateSystems.webgl.camera = webglState.coordinateSystem.camera;
        
        console.log('📐 Canvas Matrix更新完了');
    }
    
    /**
     * Transform オフセット計算
     */
    calculateTransformOffset(x, y, unit) {
        // 簡易実装：基本的にはDOM座標変化を直接反映
        // 実際の用途では、より複雑な座標変換が必要になる場合がある
        
        if (unit === '%') {
            // %座標の場合は、親要素サイズ基準でpx変換
            const parentRect = this.getStableParentRect(this.transform?.targetElement);
            if (parentRect) {
                return {
                    tx: (x / 100) * parentRect.width - this.coordinateSystems.dom.x,
                    ty: (y / 100) * parentRect.height - this.coordinateSystems.dom.y
                };
            }
        }
        
        // px座標の場合は直接差分
        return {
            tx: x - this.coordinateSystems.dom.x,
            ty: y - this.coordinateSystems.dom.y
        };
    }
    
    /**
     * 🔄 座標系間変換API
     */
    convertBetweenCoordinateSystems(fromSystem, toSystem, coordinates) {
        console.log('🔄 座標系間変換:', { fromSystem, toSystem, coordinates });
        
        const converters = {
            'dom->webgl': (coords) => {
                if (!this.webgl) return coords;
                return this.webgl.domToWebGL(coords.x, coords.y, {
                    coordinateType: coords.unit === '%' ? 'percent' : 'pixel'
                });
            },
            
            'webgl->dom': (coords) => {
                if (!this.webgl) return coords;
                return this.webgl.webGLToDOM(coords.x, coords.y, {
                    coordinateType: 'percent'  // 通常は%で返す
                });
            },
            
            'percent->pixel': (coords) => {
                const parentRect = this.getStableParentRect(this.transform?.targetElement);
                if (!parentRect) return coords;
                
                return {
                    x: (coords.x / 100) * parentRect.width,
                    y: (coords.y / 100) * parentRect.height,
                    unit: 'px'
                };
            },
            
            'pixel->percent': (coords) => {
                const parentRect = this.getStableParentRect(this.transform?.targetElement);
                if (!parentRect) return coords;
                
                return {
                    x: (coords.x / parentRect.width) * 100,
                    y: (coords.y / parentRect.height) * 100,
                    unit: '%'
                };
            }
        };
        
        const converterKey = `${fromSystem}->${toSystem}`;
        const converter = converters[converterKey];
        
        if (converter) {
            const result = converter(coordinates);
            console.log('✅ 座標系変換完了:', { input: coordinates, output: result });
            return result;
        } else {
            console.warn('⚠️ 座標系変換未対応:', converterKey);
            return coordinates;
        }
    }
    
    /**
     * 🎮 PureBoundingBox高度統合
     */
    integratePureBoundingBox(boundingBox) {
        console.log('🎮 PureBoundingBox高度統合開始');
        
        if (!this.integrationState.initialized) {
            console.warn('⚠️ Advanced未初期化 - PureBoundingBox統合をスキップ');
            return false;
        }
        
        try {
            // commitToPercent高度版に置き換え
            boundingBox.core._originalCommitToPercent = boundingBox.core.commitToPercent;
            boundingBox.core.commitToPercent = this.advancedCommitToPercent.bind(this, boundingBox);
            
            // enterEditingMode高度版に置き換え  
            boundingBox.core._originalEnterEditingMode = boundingBox.core.enterEditingMode;
            boundingBox.core.enterEditingMode = this.advancedEnterEditingMode.bind(this, boundingBox);
            
            console.log('✅ PureBoundingBox高度統合完了');
            return true;
            
        } catch (error) {
            console.error('❌ PureBoundingBox高度統合エラー:', error);
            return false;
        }
    }
    
    /**
     * 🌊 Phase 2高度版commitToPercent
     */
    advancedCommitToPercent(boundingBox) {
        console.log('🌊 ElementObserver Phase 2高度版commitToPercent開始');
        
        // Phase 1安全性チェック
        const safetyCheck = this.isSafeForCoordinateSwap(boundingBox.config.targetElement);
        if (!safetyCheck.safe) {
            console.warn('⚠️ Phase 2座標スワップ不安全:', safetyCheck.reason);
            return false;
        }
        
        try {
            // Phase 2統合座標計算
            const currentTransform = this.transform?.getCombinedTransform();
            const currentWebGL = this.coordinateSystems.webgl;
            const currentSkeleton = this.coordinateSystems.skeleton;
            
            // 最適な%位置を計算
            const targetPercent = this.calculateOptimalPercentPosition(
                currentTransform, 
                currentWebGL, 
                currentSkeleton
            );
            
            if (targetPercent) {
                // 統一座標更新実行
                this.setUnifiedPosition(targetPercent.x, targetPercent.y, '%');
                
                console.log('✅ Phase 2高度版commitToPercent完了:', targetPercent);
                return true;
            } else {
                // フォールバック：Phase 1処理
                console.log('🔄 Phase 2計算失敗 - Phase 1フォールバック実行');
                return boundingBox.core._originalCommitToPercent.call(boundingBox.core);
            }
            
        } catch (error) {
            console.error('❌ Phase 2高度版commitToPercentエラー:', error);
            
            // フォールバック：Phase 1処理
            return boundingBox.core._originalCommitToPercent.call(boundingBox.core);
        }
    }
    
    /**
     * 🎯 Phase 2高度版enterEditingMode
     */
    advancedEnterEditingMode(boundingBox) {
        console.log('🎯 ElementObserver Phase 2高度版enterEditingMode開始');
        
        try {
            // Phase 2統合処理：全座標系のスワップ準備
            this.prepareAdvancedEditingMode();
            
            // Phase 1処理実行
            const result = boundingBox.core._originalEnterEditingMode.call(boundingBox.core);
            
            // Phase 2追加処理：座標系統合状態更新
            this.enterAdvancedEditingState();
            
            console.log('✅ Phase 2高度版enterEditingMode完了');
            return result;
            
        } catch (error) {
            console.error('❌ Phase 2高度版enterEditingModeエラー:', error);
            
            // フォールバック：Phase 1処理
            return boundingBox.core._originalEnterEditingMode.call(boundingBox.core);
        }
    }
    
    /**
     * 最適な%位置計算
     */
    calculateOptimalPercentPosition(transformMatrix, webglCoords, skeletonCoords) {
        try {
            // 現在のSkeleton位置をDOM%座標に変換
            if (this.webgl && skeletonCoords) {
                const domCoords = this.webgl.webGLToDOM(skeletonCoords.x, skeletonCoords.y, {
                    coordinateType: 'percent'
                });
                
                return {
                    x: domCoords.x,
                    y: domCoords.y
                };
            }
            
            // フォールバック：現在のDOM座標を使用
            return {
                x: this.coordinateSystems.dom.x,
                y: this.coordinateSystems.dom.y
            };
            
        } catch (error) {
            console.error('❌ 最適%位置計算エラー:', error);
            return null;
        }
    }
    
    /**
     * 高度編集モード準備
     */
    prepareAdvancedEditingMode() {
        console.log('🎯 高度編集モード準備');
        
        // 全座標系の現在状態をバックアップ
        this.coordinateBackup = JSON.parse(JSON.stringify(this.coordinateSystems));
        
        // Transform・WebGL・Responsive の編集モード準備
        if (this.transform) {
            // Transform編集モード設定
        }
        
        if (this.webgl) {
            // WebGL編集モード設定
        }
        
        if (this.responsive) {
            // Responsive編集モード設定
        }
    }
    
    /**
     * 高度編集状態開始
     */
    enterAdvancedEditingState() {
        console.log('🎯 高度編集状態開始');
        
        // 編集中の座標同期頻度を上げる
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = setInterval(() => {
                this.performCoordinateSync();
            }, 8);  // 120fps同期（編集中）
        }
    }
    
    /**
     * 座標同期実行
     */
    performCoordinateSync() {
        if (!this.integrationState.initialized) return;
        
        // 全モジュールの状態を取得・同期
        this.updateAllCoordinateSystems();
        
        this.integrationState.lastSyncTimestamp = performance.now();
    }
    
    /**
     * 全座標系状態更新
     */
    updateAllCoordinateSystems() {
        // Transform状態更新
        if (this.transform) {
            const transformState = this.transform.getState();
            this.coordinateSystems.transform = {
                tx: transformState.cssVariables.tx,
                ty: transformState.cssVariables.ty,
                scale: transformState.cssVariables.scale,
                rotation: transformState.cssVariables.rotation,
                static: transformState.transforms.static,
                dynamic: transformState.transforms.dynamic,
                combined: transformState.transforms.combined
            };
        }
        
        // WebGL状態更新
        if (this.webgl) {
            const webglState = this.webgl.getState();
            this.coordinateSystems.webgl = {
                x: webglState.coordinateSystem.camera.x,
                y: webglState.coordinateSystem.camera.y,
                scale: 1,
                camera: webglState.coordinateSystem.camera
            };
            
            // Skeleton状態更新
            if (this.webgl.skeleton) {
                this.coordinateSystems.skeleton = {
                    x: this.webgl.skeleton.x,
                    y: this.webgl.skeleton.y,
                    scaleX: this.webgl.skeleton.scaleX,
                    scaleY: this.webgl.skeleton.scaleY,
                    bounds: this.webgl.skeleton.getBounds ? this.webgl.skeleton.getBounds() : null
                };
            }
        }
        
        // Responsive状態更新
        if (this.responsive) {
            const responsiveState = this.responsive.getState();
            this.coordinateSystems.canvas = {
                displayWidth: responsiveState.actualSizes.css.width,
                displayHeight: responsiveState.actualSizes.css.height,
                bufferWidth: responsiveState.actualSizes.buffer.width,
                bufferHeight: responsiveState.actualSizes.buffer.height,
                scaleRatio: responsiveState.actualSizes.scaleRatio
            };
        }
    }
    
    /**
     * Transform変化イベント処理
     */
    onTransformChange(event) {
        console.log('🎯 Transform変化検出:', event.type);
        this.updateAllCoordinateSystems();
        this.notifyIntegrationChange('transformChange', event);
    }
    
    /**
     * WebGL変化イベント処理
     */
    onWebGLChange(event) {
        console.log('🌐 WebGL変化検出:', event.type);
        this.updateAllCoordinateSystems();
        this.notifyIntegrationChange('webglChange', event);
    }
    
    /**
     * Responsive変化イベント処理
     */
    onResponsiveChange(event) {
        console.log('📱 Responsive変化検出:', event.type);
        this.updateAllCoordinateSystems();
        this.notifyIntegrationChange('responsiveChange', event);
    }
    
    /**
     * Phase 1親要素サイズ変化処理
     */
    onParentSizeChange(parentRect, isValid) {
        console.log('📐 親要素サイズ変化（Phase 2統合版）:', {
            size: parentRect ? `${parentRect.width}x${parentRect.height}` : 'invalid',
            isValid
        });
        
        if (isValid) {
            // Phase 2統合処理：全座標系への影響を確認・調整
            this.handleParentSizeChangeIntegration(parentRect);
        }
    }
    
    /**
     * 親要素サイズ変化の統合処理
     */
    handleParentSizeChangeIntegration(parentRect) {
        // レスポンシブ再計算
        if (this.responsive) {
            this.responsive.updateCanvasSize();
        }
        
        // 座標系再同期
        this.performCoordinateSync();
    }
    
    /**
     * 統合変化通知
     */
    notifyIntegrationChange(type, data) {
        const event = {
            type,
            data,
            timestamp: performance.now(),
            integrationState: this.integrationState,
            coordinateSystems: this.coordinateSystems
        };
        
        this.integrationCallbacks.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error('❌ 統合変化コールバックエラー:', error);
            }
        });
    }
    
    /**
     * 統合変化監視コールバック登録
     */
    onIntegrationChange(callback) {
        this.integrationCallbacks.add(callback);
        return () => this.integrationCallbacks.delete(callback);
    }
    
    /**
     * 🔧 静的メソッド: PureBoundingBox高度統合（簡易作成）
     */
    static async createForAdvancedBoundingBox(targetElement, canvas, skeleton, renderer, options = {}) {
        const observer = new ElementObserverAdvanced();
        
        // Phase 2高度初期化
        const initialized = await observer.initializeAdvanced(
            targetElement, canvas, skeleton, renderer, options
        );
        
        if (!initialized) {
            console.error('❌ ElementObserverAdvanced初期化失敗');
            return null;
        }
        
        // PureBoundingBox専用API追加
        observer.boundingBoxAPI = {
            setUnifiedPosition: observer.setUnifiedPosition.bind(observer),
            convertCoordinates: observer.convertBetweenCoordinateSystems.bind(observer),
            integrate: observer.integratePureBoundingBox.bind(observer),
            getCoordinateSystems: () => observer.coordinateSystems,
            getDebugStatus: () => observer.getAdvancedDebugInfo()
        };
        
        console.log('✅ ElementObserverAdvanced PureBoundingBox統合版作成完了');
        return observer;
    }
    
    /**
     * 高度デバッグ情報取得
     */
    getAdvancedDebugInfo() {
        const baseDebugInfo = this.getDebugInfo();
        
        return {
            ...baseDebugInfo,
            phase2Integration: {
                initialized: this.integrationState.initialized,
                activeModules: this.integrationState.activeModules,
                coordinateSystemsActive: this.integrationState.coordinateSystemsActive,
                lastSyncTimestamp: this.integrationState.lastSyncTimestamp,
                syncAge: performance.now() - this.integrationState.lastSyncTimestamp
            },
            coordinateSystems: this.coordinateSystems,
            modules: {
                transform: this.transform ? this.transform.getDebugInfo() : null,
                webgl: this.webgl ? this.webgl.getDebugInfo() : null,
                responsive: this.responsive ? this.responsive.getDebugInfo() : null
            },
            integrationCallbacks: this.integrationCallbacks.size
        };
    }
    
    /**
     * クリーンアップ
     */
    cleanup() {
        // 座標同期停止
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        
        // Phase 2モジュールクリーンアップ
        if (this.transform) {
            this.transform.cleanup();
            this.transform = null;
        }
        
        if (this.webgl) {
            this.webgl.cleanup();
            this.webgl = null;
        }
        
        if (this.responsive) {
            this.responsive.cleanup();
            this.responsive = null;
        }
        
        // 統合コールバッククリア
        this.integrationCallbacks.clear();
        
        // Phase 1クリーンアップ
        super.cleanup();
        
        this.integrationState.initialized = false;
        
        console.log('🧹 ElementObserverAdvanced 完全クリーンアップ完了');
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.ElementObserverAdvanced = ElementObserverAdvanced;
}