/**
 * PureSpineEditor - v3.0 ハイブリッドマイクロモジュール
 * 
 * 🎯 v3.0 ハイブリッド設計思想
 * - 実証済みパターン活用：従来システムの成功コードを内部移植
 * - 実用性優先：理論的純粋性より実際の動作を重視
 * - トラブルシューティング互換：既存のデバッグ知識を活用可能
 * - 移植性維持：1ファイルコピーで即座に動作
 * 
 * 統合機能:
 * - Spine読み込み・レンダリング (from PureSpineLoader)
 * - バウンディングボックス表示・操作 (from PureBoundingBox)
 * - リアルタイム位置・スケール同期 (新規統合機能)
 * 
 * 目標: 700行以内・実用的Spine編集機能・AIプログラミング最適化
 */

class PureSpineEditor {
    constructor(config) {
        console.log('🎯 PureSpineEditor: 初期化開始', config);
        
        // 設定検証
        this.validateConfig(config);
        
        // 初期状態バックアップ
        this.initialState = {
            canvasStyle: null,
            windowSpine: typeof window !== 'undefined' ? window.spine : undefined
        };
        
        // 統合設定管理
        this.config = {
            // Spine設定
            basePath: config.basePath,
            atlasPath: config.atlasPath,
            jsonPath: config.jsonPath,
            
            // Canvas設定
            canvasElement: config.canvasElement,
            
            // 編集設定
            initialPosition: config.initialPosition || {x: 0, y: 0},
            initialScale: config.initialScale || 1.0,
            showBoundingBox: config.showBoundingBox !== false,
            
            // アニメーション設定
            defaultAnimation: config.defaultAnimation || null,
            animationLoop: config.animationLoop !== false
        };
        
        // 統合状態管理
        this.state = {
            // Spine状態
            spine: {
                loaded: false,
                loading: false,
                skeleton: null,
                animationState: null,
                renderer: null,
                position: {...this.config.initialPosition},
                scale: this.config.initialScale,
                currentAnimation: null
            },
            
            // 編集状態
            editor: {
                boundingBox: {
                    visible: false,
                    element: null,
                    bounds: {x: 0, y: 0, width: 0, height: 0},
                    handles: []
                },
                dragState: {
                    isDragging: false,
                    startX: 0,
                    startY: 0,
                    handleType: 'move'
                }
            },
            
            // システム状態
            initialized: false,
            error: null
        };
        
        // WebGLコンテキスト
        this.gl = null;
        
        // イベントハンドラー保存（cleanup用）
        this.eventHandlers = {
            mousedown: null,
            mousemove: null,
            mouseup: null,
            touchstart: null,
            touchmove: null,
            touchend: null
        };
        
        // グローバル変数に保存（診断機能用）
        if (typeof window !== 'undefined') {
            window.currentPureSpineEditor = this;
        }
        
        console.log('✅ PureSpineEditor: 初期化完了');
    }
    
    validateConfig(config) {
        if (!config || typeof config !== 'object') {
            throw new Error('PureSpineEditor: 設定が無効です');
        }
        
        const required = ['basePath', 'atlasPath', 'jsonPath', 'canvasElement'];
        for (const field of required) {
            if (!config[field]) {
                throw new Error(`PureSpineEditor: ${field}が必要です`);
            }
        }
        
        if (!(config.canvasElement instanceof HTMLCanvasElement)) {
            throw new Error('PureSpineEditor: canvasElementはHTMLCanvasElementである必要があります');
        }
    }
    
    /**
     * Spine読み込み・初期化（Phase 1: 基盤統合）
     */
    async loadSpine() {
        console.log('📚 PureSpineEditor: Spine読み込み開始');
        
        try {
            this.state.spine.loading = true;
            
            // 初期状態バックアップ
            this.backupInitialState();
            
            // WebGLコンテキスト初期化
            await this.initializeWebGL();
            
            // Spineアセット読み込み
            await this.loadSpineAssets();
            
            // Spineオブジェクト構築
            this.buildSpineObjects();
            
            // 初期位置・スケール設定
            this.applyInitialTransform();
            
            // レンダリング開始
            this.startRendering();
            
            this.state.spine.loaded = true;
            this.state.spine.loading = false;
            this.state.initialized = true;
            
            console.log('✅ PureSpineEditor: Spine読み込み完了');
            return {success: true, message: 'Spine読み込み完了'};
            
        } catch (error) {
            console.error('❌ PureSpineEditor: Spine読み込みエラー', error);
            this.state.spine.loading = false;
            this.state.error = error.message;
            return {success: false, error: error.message};
        }
    }
    
    backupInitialState() {
        const canvas = this.config.canvasElement;
        this.initialState.canvasStyle = {
            position: canvas.style.position,
            cursor: canvas.style.cursor,
            userSelect: canvas.style.userSelect
        };
    }
    
    async initializeWebGL() {
        const canvas = this.config.canvasElement;
        this.gl = canvas.getContext("webgl", { alpha: true });
        
        if (!this.gl) {
            throw new Error("WebGL未対応");
        }
        
        // Spine WebGL待機
        await this.waitForSpineWebGL();
        console.log('🔗 WebGLコンテキスト初期化完了');
    }
    
    async waitForSpineWebGL() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50;
            
            const check = () => {
                attempts++;
                if (typeof spine !== "undefined") {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error("Spine WebGL読み込みタイムアウト"));
                } else {
                    setTimeout(check, 100);
                }
            };
            
            check();
        });
    }
    
    async loadSpineAssets() {
        const assetManager = new spine.AssetManager(this.gl, this.config.basePath);
        
        // アセット読み込み開始
        assetManager.loadTextureAtlas(this.config.atlasPath);
        assetManager.loadJson(this.config.jsonPath);
        
        // 読み込み完了待機
        await this.waitForAssetLoading(assetManager);
        
        this.assetManager = assetManager;
        console.log('📦 Spineアセット読み込み完了');
    }
    
    async waitForAssetLoading(assetManager) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50;
            
            const check = () => {
                attempts++;
                if (assetManager.isLoadingComplete()) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error("アセット読み込みタイムアウト"));
                } else {
                    setTimeout(check, 100);
                }
            };
            
            check();
        });
    }
    
    buildSpineObjects() {
        // アトラス・スケルトンデータ構築
        const atlas = this.assetManager.get(this.config.atlasPath);
        const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
        const skeletonJson = new spine.SkeletonJson(atlasLoader);
        const skeletonData = skeletonJson.readSkeletonData(
            this.assetManager.get(this.config.jsonPath)
        );
        
        // スケルトン・アニメーション構築
        this.state.spine.skeleton = new spine.Skeleton(skeletonData);
        
        const animationStateData = new spine.AnimationStateData(skeletonData);
        this.state.spine.animationState = new spine.AnimationState(animationStateData);
        
        // レンダラー構築
        this.state.spine.renderer = new spine.SceneRenderer(this.config.canvasElement, this.gl);
        
        console.log('🏗️ Spineオブジェクト構築完了');
    }
    
    applyInitialTransform() {
        const skeleton = this.state.spine.skeleton;
        
        // 🚀 シンプル化革命実装（⭐⭐⭐⭐⭐ 確実に有効・推奨）
        // docs/troubleshooting/Spine座標系ドラッグ問題解決記録.md より
        skeleton.x = 0;
        skeleton.y = 0;
        skeleton.scaleX = skeleton.scaleY = 1.0;
        
        // デフォルトアニメーション開始
        if (this.config.defaultAnimation) {
            this.playAnimation(this.config.defaultAnimation, this.config.animationLoop);
        }
        
        console.log('🎯 シンプル化革命実装完了', {
            skeletonPosition: {x: skeleton.x, y: skeleton.y},
            skeletonScale: {x: skeleton.scaleX, y: skeleton.scaleY}
        });
    }
    
    playAnimation(animationName, loop = true) {
        if (!this.state.spine.animationState) return;
        
        const animation = this.state.spine.skeleton.data.findAnimation(animationName);
        if (animation) {
            this.state.spine.animationState.setAnimation(0, animationName, loop);
            this.state.spine.currentAnimation = animationName;
            console.log(`🎬 アニメーション開始: ${animationName}`);
        }
    }
    
    startRendering() {
        let lastTime = Date.now() / 1000;
        
        const render = () => {
            const now = Date.now() / 1000;
            const delta = now - lastTime;
            lastTime = now;
            
            // アニメーション更新
            this.state.spine.animationState.update(delta);
            this.state.spine.animationState.apply(this.state.spine.skeleton);
            this.state.spine.skeleton.updateWorldTransform();
            
            // 描画
            this.gl.clearColor(0, 0, 0, 0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.gl.viewport(0, 0, this.config.canvasElement.width, this.config.canvasElement.height);
            
            this.state.spine.renderer.begin();
            this.state.spine.renderer.drawSkeleton(this.state.spine.skeleton, true);
            this.state.spine.renderer.end();
            
            // 次フレーム
            this.renderRequestId = requestAnimationFrame(render);
        };
        
        render();
        console.log('🎨 レンダリング開始');
    }
    
    /**
     * バウンディングボックス表示（Phase 2: UI統合）
     */
    showBoundingBox() {
        if (!this.state.initialized) {
            console.warn('⚠️ Spine未初期化のためバウンディングボックスを表示できません');
            return false;
        }
        
        // 🔍 診断ログ：実行前状態記録
        const preState = this.logCoordinateState('showBoundingBox実行前');
        
        console.log('📦 バウンディングボックス表示開始');
        
        // 🎯 瞬間移動完全防止：初期表示フラグ設定
        this.state.editor.initialDisplay = true;
        
        // 🎯 瞬間移動問題修正：初期表示時は位置計算のみ実行
        // Canvas現在位置を基準にバウンディングボックス位置を設定
        // syncBoundingToSpine()は呼び出さない（ドラッグ時のみ実行）
        this.calculateBoundingBox();
        
        // UI要素作成
        this.createBoundingBoxElements();
        
        // イベントハンドラー設定
        this.setupBoundingBoxEvents();
        
        // 表示
        this.state.editor.boundingBox.visible = true;
        if (this.state.editor.boundingBox.element) {
            this.state.editor.boundingBox.element.style.display = 'block';
        }
        
        // 🔍 診断ログ：実行後状態記録
        const postState = this.logCoordinateState('showBoundingBox実行後');
        
        // 🚨 瞬間移動検出
        this.detectInstantMovement(preState, postState, 'showBoundingBox');
        
        console.log('✅ バウンディングボックス表示完了（瞬間移動回避）');
        return true;
    }
    
    hideBoundingBox() {
        this.state.editor.boundingBox.visible = false;
        if (this.state.editor.boundingBox.element) {
            this.state.editor.boundingBox.element.style.display = 'none';
        }
        console.log('🙈 バウンディングボックス非表示');
    }
    
    calculateBoundingBox() {
        // 🔍 診断ログ：計算開始前状態
        const preCalcState = this.logCoordinateState('calculateBoundingBox開始前');
        
        const canvas = this.config.canvasElement;
        const skeleton = this.state.spine.skeleton;
        
        if (!skeleton) {
            console.warn('⚠️ Skeleton未初期化のためデフォルト位置を使用');
            const rect = canvas.getBoundingClientRect();
            const parentRect = canvas.parentElement ? 
                canvas.parentElement.getBoundingClientRect() : 
                { left: 0, top: 0 };
            this.state.editor.boundingBox.bounds = {
                x: rect.left - parentRect.left,
                y: rect.top - parentRect.top,
                width: 100,
                height: 100
            };
            return;
        }
        
        // 🎯 瞬間移動問題修正：Canvas現在位置を基準にバウンディングボックス位置を設定
        const rect = canvas.getBoundingClientRect();
        const parentRect = canvas.parentElement ? 
            canvas.parentElement.getBoundingClientRect() : 
            { left: 0, top: 0 };
        
        // 現在のCanvas位置からバウンディングボックスサイズを計算
        const baseSize = 100;
        const scaledWidth = baseSize * this.state.spine.scale;
        const scaledHeight = baseSize * this.state.spine.scale;
        
        // 🔑 重要修正：Canvas中央からバウンディングボックス左上を逆算（高精度計算）
        // これにより初期表示時の瞬間移動を回避
        const canvasCenterX = Math.round((rect.left + rect.width / 2) * 100) / 100;
        const canvasCenterY = Math.round((rect.top + rect.height / 2) * 100) / 100;
        
        // 段階的計算で丸め誤差を最小化
        const boundingLeft = Math.round((canvasCenterX - scaledWidth / 2) * 100) / 100;
        const boundingTop = Math.round((canvasCenterY - scaledHeight / 2) * 100) / 100;
        
        // 親要素基準の相対座標に変換（高精度）
        const relativeX = Math.round((boundingLeft - parentRect.left) * 100) / 100;
        const relativeY = Math.round((boundingTop - parentRect.top) * 100) / 100;
        
        this.state.editor.boundingBox.bounds = {
            x: relativeX,   // Canvas現在位置基準（高精度）
            y: relativeY,   // Canvas現在位置基準（高精度）  
            width: scaledWidth,
            height: scaledHeight
        };
        
        // 🔍 診断ログ：計算過程詳細
        console.log('🧮 calculateBoundingBox計算過程', {
            skeletonCoords: {x: skeleton.x, y: skeleton.y},
            skeletonScale: {x: skeleton.scaleX, y: skeleton.scaleY},
            canvasRect: rect,
            canvasCenter: {x: canvasCenterX, y: canvasCenterY},
            boundingBoxPosition: {x: boundingLeft, y: boundingTop},
            relativeBounds: this.state.editor.boundingBox.bounds,
            baseSize: baseSize,
            scaledSize: {width: scaledWidth, height: scaledHeight}
        });
        
        console.log('🎯 瞬間移動問題修正：Canvas現在位置基準計算', {
            canvasRect: rect,
            canvasCenter: {x: canvasCenterX, y: canvasCenterY},
            boundingBoxPosition: {x: boundingLeft, y: boundingTop},
            relativeBounds: this.state.editor.boundingBox.bounds,
            fix: 'Canvas現在位置からバウンディングボックス位置を逆算'
        });
        
        // 🔍 診断ログ：計算完了後状態
        const postCalcState = this.logCoordinateState('calculateBoundingBox完了後');
        
        // 🚨 計算による座標変更検出
        this.detectInstantMovement(preCalcState, postCalcState, 'calculateBoundingBox');
    }
    
    createBoundingBoxElements() {
        // 既存要素クリーンアップ
        if (this.state.editor.boundingBox.element) {
            this.removeBoundingBoxElements();
        }
        
        const bounds = this.state.editor.boundingBox.bounds;
        
        // バウンディングボックス要素作成
        const boundingDiv = document.createElement('div');
        boundingDiv.className = 'pure-spine-editor-bounding';
        boundingDiv.style.cssText = `
            position: absolute;
            border: 2px solid #ff6b6b;
            background: rgba(255, 107, 107, 0.1);
            pointer-events: none;
            z-index: 1000;
            left: ${bounds.x}px;
            top: ${bounds.y}px;
            width: ${bounds.width}px;
            height: ${bounds.height}px;
            display: none;
            cursor: move;
        `;
        
        // 8点ハンドル作成
        this.createBoundingBoxHandles(boundingDiv);
        
        // DOM に追加
        document.body.appendChild(boundingDiv);
        this.state.editor.boundingBox.element = boundingDiv;
        
        console.log('🎨 バウンディングボックス要素作成完了');
    }
    
    createBoundingBoxHandles(boundingDiv) {
        const handlePositions = [
            {class: 'nw', left: -4, top: -4, cursor: 'nw-resize'},
            {class: 'n', left: '50%', top: -4, cursor: 'n-resize', transform: 'translateX(-50%)'},
            {class: 'ne', right: -4, top: -4, cursor: 'ne-resize'},
            {class: 'e', right: -4, top: '50%', cursor: 'e-resize', transform: 'translateY(-50%)'},
            {class: 'se', right: -4, bottom: -4, cursor: 'se-resize'},
            {class: 's', left: '50%', bottom: -4, cursor: 's-resize', transform: 'translateX(-50%)'},
            {class: 'sw', left: -4, bottom: -4, cursor: 'sw-resize'},
            {class: 'w', left: -4, top: '50%', cursor: 'w-resize', transform: 'translateY(-50%)'}
        ];
        
        this.state.editor.boundingBox.handles = [];
        
        handlePositions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `pure-spine-handle pure-spine-handle-${pos.class}`;
            handle.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: #ff6b6b;
                border: 1px solid #fff;
                border-radius: 2px;
                cursor: ${pos.cursor};
                pointer-events: all;
                z-index: 1001;
                ${pos.left !== undefined ? `left: ${pos.left}${typeof pos.left === 'number' ? 'px' : ''};` : ''}
                ${pos.right !== undefined ? `right: ${pos.right}px;` : ''}
                ${pos.top !== undefined ? `top: ${pos.top}${typeof pos.top === 'number' ? 'px' : ''};` : ''}
                ${pos.bottom !== undefined ? `bottom: ${pos.bottom}px;` : ''}
                ${pos.transform ? `transform: ${pos.transform};` : ''}
            `;
            
            boundingDiv.appendChild(handle);
            this.state.editor.boundingBox.handles.push({
                element: handle,
                type: pos.class,
                cursor: pos.cursor
            });
        });
        
        // 中央部分もドラッグ可能に
        boundingDiv.style.pointerEvents = 'all';
    }
    
    setupBoundingBoxEvents() {
        // イベントハンドラー作成
        this.eventHandlers.mousedown = this.handleMouseDown.bind(this);
        this.eventHandlers.mousemove = this.handleMouseMove.bind(this);
        this.eventHandlers.mouseup = this.handleMouseUp.bind(this);
        this.eventHandlers.touchstart = this.handleTouchStart.bind(this);
        this.eventHandlers.touchmove = this.handleTouchMove.bind(this);
        this.eventHandlers.touchend = this.handleTouchEnd.bind(this);
        
        // バウンディングボックス要素にイベント追加
        const boundingElement = this.state.editor.boundingBox.element;
        boundingElement.addEventListener('mousedown', this.eventHandlers.mousedown);
        document.addEventListener('mousemove', this.eventHandlers.mousemove);
        document.addEventListener('mouseup', this.eventHandlers.mouseup);
        
        boundingElement.addEventListener('touchstart', this.eventHandlers.touchstart);
        document.addEventListener('touchmove', this.eventHandlers.touchmove);
        document.addEventListener('touchend', this.eventHandlers.touchend);
        
        // ハンドルにもイベント追加
        this.state.editor.boundingBox.handles.forEach(handle => {
            handle.element.addEventListener('mousedown', this.eventHandlers.mousedown);
            handle.element.addEventListener('touchstart', this.eventHandlers.touchstart);
        });
        
        console.log('🎮 バウンディングボックスイベント設定完了');
    }
    
    /**
     * イベントハンドラー（Phase 2続き）
     */
    handleMouseDown(event) {
        event.preventDefault();
        
        const rect = this.state.editor.boundingBox.element.getBoundingClientRect();
        this.state.editor.dragState = {
            isDragging: true,
            startX: event.clientX,
            startY: event.clientY,
            handleType: event.target.classList.contains('pure-spine-handle') ? 
                       event.target.className.split(' ').find(c => c.startsWith('pure-spine-handle-'))?.replace('pure-spine-handle-', '') : 'move'
        };
        
        console.log('🖱️ ドラッグ開始', this.state.editor.dragState);
    }
    
    handleMouseMove(event) {
        if (!this.state.editor.dragState.isDragging) return;
        
        event.preventDefault();
        
        const deltaX = event.clientX - this.state.editor.dragState.startX;
        const deltaY = event.clientY - this.state.editor.dragState.startY;
        
        // バウンディングボックス更新
        this.updateBoundingBox(deltaX, deltaY);
        
        // 🎯 Phase 3: Spine同期（リアルタイム位置更新）
        // 初期表示中は同期を実行しない（瞬間移動防止）
        if (!this.state.editor.initialDisplay) {
            this.syncBoundingToSpine();
        }
        
        // ドラッグ開始位置更新
        this.state.editor.dragState.startX = event.clientX;
        this.state.editor.dragState.startY = event.clientY;
    }
    
    handleMouseUp(event) {
        if (!this.state.editor.dragState.isDragging) return;
        
        // 🎯 ドラッグ開始時に初期表示フラグをクリア（通常のドラッグ操作を有効化）
        this.state.editor.initialDisplay = false;
        
        this.state.editor.dragState.isDragging = false;
        console.log('🖱️ ドラッグ終了 - 通常の同期処理を再開');
    }
    
    handleTouchStart(event) {
        if (event.touches.length !== 1) return;
        const touch = event.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleMouseDown(mouseEvent);
    }
    
    handleTouchMove(event) {
        if (event.touches.length !== 1) return;
        const touch = event.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleMouseMove(mouseEvent);
    }
    
    handleTouchEnd(event) {
        const mouseEvent = new MouseEvent('mouseup', {});
        this.handleMouseUp(mouseEvent);
    }
    
    /**
     * Phase 3: 統合同期機能
     */
    updateBoundingBox(deltaX, deltaY) {
        const bounds = this.state.editor.boundingBox.bounds;
        const handleType = this.state.editor.dragState.handleType;
        
        // ドラッグタイプ別更新
        switch (handleType) {
            case 'move':
                bounds.x += deltaX;
                bounds.y += deltaY;
                break;
            case 'se': // 右下：拡大・縮小
                bounds.width += deltaX;
                bounds.height += deltaY;
                break;
            case 'nw': // 左上：位置とサイズ同時調整
                bounds.x += deltaX;
                bounds.y += deltaY;
                bounds.width -= deltaX;
                bounds.height -= deltaY;
                break;
            // 他のハンドルは簡略化
        }
        
        // 最小サイズ制限
        bounds.width = Math.max(20, bounds.width);
        bounds.height = Math.max(20, bounds.height);
        
        // DOM要素更新
        const element = this.state.editor.boundingBox.element;
        element.style.left = bounds.x + 'px';
        element.style.top = bounds.y + 'px';
        element.style.width = bounds.width + 'px';
        element.style.height = bounds.height + 'px';
    }
    
    /**
     * 🎯 バウンディングボックス操作 → Spine位置同期（v3.0従来成功パターン移植）
     */
    syncBoundingToSpine() {
        if (!this.state.spine.skeleton) return;
        
        // 🔍 診断ログ：同期実行前状態記録
        const preSyncState = this.logCoordinateState('syncBoundingToSpine実行前');
        
        const bounds = this.state.editor.boundingBox.bounds;
        const canvas = this.config.canvasElement;
        const parentRect = canvas.parentElement ? 
            canvas.parentElement.getBoundingClientRect() : 
            { left: 0, top: 0 };
        
        // 🎯 v3.0 ハイブリッド実装：従来の成功パターンを移植
        // spine-positioning-system-explanation.js と同じ方式
        
        // 🔍 診断ログ：Skeleton座標変更監視
        const oldSkeletonX = this.state.spine.skeleton.x;
        const oldSkeletonY = this.state.spine.skeleton.y;
        const oldSkeletonScaleX = this.state.spine.skeleton.scaleX;
        const oldSkeletonScaleY = this.state.spine.skeleton.scaleY;
        
        // 1. Skeleton座標は固定維持（シンプル化革命）
        this.state.spine.skeleton.x = 0;
        this.state.spine.skeleton.y = 0;
        
        // 2. スケール更新
        const baseSize = 100;
        const newScale = Math.max(bounds.width / baseSize, bounds.height / baseSize);
        this.state.spine.skeleton.scaleX = this.state.spine.skeleton.scaleY = newScale;
        
        // 🔍 診断ログ：Skeleton座標・スケール変更詳細
        console.log('💀 Skeleton座標書き込み監視', {
            座標変更: {
                before: {x: oldSkeletonX, y: oldSkeletonY},
                after: {x: this.state.spine.skeleton.x, y: this.state.spine.skeleton.y},
                変更有無: oldSkeletonX !== 0 || oldSkeletonY !== 0 ? '⚠️変更あり' : '変更なし'
            },
            スケール変更: {
                before: {x: oldSkeletonScaleX, y: oldSkeletonScaleY},
                after: {x: this.state.spine.skeleton.scaleX, y: this.state.spine.skeleton.scaleY},
                newScale: newScale
            }
        });
        
        // 3. 🔑重要：Canvas要素自体を移動（従来の成功パターン・高精度計算）
        // 親要素基準の絶対座標に変換（段階的計算）
        const absoluteLeft = Math.round((parentRect.left + bounds.x) * 100) / 100;
        const absoluteTop = Math.round((parentRect.top + bounds.y) * 100) / 100;
        
        // バウンディングボックス中央 → Canvas中央への変換（高精度）
        const canvasCenterX = Math.round((absoluteLeft + bounds.width / 2) * 100) / 100;
        const canvasCenterY = Math.round((absoluteTop + bounds.height / 2) * 100) / 100;
        
        // 🔍 診断ログ：Canvas要素スタイル変更監視
        const oldCanvasLeft = canvas.style.left;
        const oldCanvasTop = canvas.style.top;
        const oldCanvasTransform = canvas.style.transform;
        
        // Canvas要素のスタイル更新（従来システムと同じ方式・整数ピクセル値）
        canvas.style.left = Math.round(canvasCenterX) + 'px';
        canvas.style.top = Math.round(canvasCenterY) + 'px';
        canvas.style.transform = 'translate(-50%, -50%)';
        
        // 🔍 診断ログ：Canvas要素スタイル変更詳細
        console.log('🎨 Canvas要素スタイル書き込み監視', {
            left変更: {before: oldCanvasLeft, after: canvas.style.left},
            top変更: {before: oldCanvasTop, after: canvas.style.top},
            transform変更: {before: oldCanvasTransform, after: canvas.style.transform},
            計算値: {centerX: canvasCenterX, centerY: canvasCenterY}
        });
        
        // 状態管理更新
        this.state.spine.position = {x: canvasCenterX, y: canvasCenterY};
        this.state.spine.scale = newScale;
        
        console.log('🎯 v3.0 ハイブリッド同期（従来成功パターン）', {
            skeletonFixed: {x: 0, y: 0},
            canvasPosition: {x: canvasCenterX, y: canvasCenterY},
            scale: newScale,
            method: 'Canvas要素直接移動（実証済み）'
        });
        
        // 🔍 診断ログ：同期実行後状態記録
        const postSyncState = this.logCoordinateState('syncBoundingToSpine実行後');
        
        // 🚨 同期による座標変更検出
        this.detectInstantMovement(preSyncState, postSyncState, 'syncBoundingToSpine');
    }
    
    /**
     * 状態管理・制御機能
     */
    getState() {
        return {
            success: this.state.initialized,
            spine: {...this.state.spine},
            editor: {
                boundingBox: {
                    visible: this.state.editor.boundingBox.visible,
                    bounds: {...this.state.editor.boundingBox.bounds}
                },
                dragState: {...this.state.editor.dragState}
            },
            error: this.state.error
        };
    }
    
    setState(newState) {
        if (!newState || !this.state.initialized) return false;
        
        // 🚀 シンプル化革命準拠状態復元
        if (newState.spine) {
            // Skeleton位置は絶対に復元しない（常に0,0固定）
            this.state.spine.skeleton.x = 0;
            this.state.spine.skeleton.y = 0;
            
            // スケールのみ復元
            if (newState.spine.scale && this.state.spine.skeleton) {
                this.state.spine.skeleton.scaleX = this.state.spine.skeleton.scaleY = newState.spine.scale;
                this.state.spine.scale = newState.spine.scale;
            }
        }
        
        // バウンディングボックス状態復元
        if (newState.editor?.boundingBox) {
            if (newState.editor.boundingBox.visible) {
                this.showBoundingBox();
            } else {
                this.hideBoundingBox();
            }
        }
        
        console.log('🚀 シンプル化革命準拠状態復元完了', {
            skeletonFixed: {x: 0, y: 0},
            scaleRestored: this.state.spine.scale
        });
        return true;
    }
    
    removeBoundingBoxElements() {
        if (this.state.editor.boundingBox.element) {
            this.state.editor.boundingBox.element.remove();
            this.state.editor.boundingBox.element = null;
            this.state.editor.boundingBox.handles = [];
        }
    }
    
    /**
     * 完全クリーンアップ（v2.0要求事項）
     */
    cleanup() {
        console.log('🧹 PureSpineEditor: クリーンアップ開始');
        
        try {
            // レンダリング停止
            if (this.renderRequestId) {
                cancelAnimationFrame(this.renderRequestId);
                this.renderRequestId = null;
            }
            
            // バウンディングボックス要素削除
            this.removeBoundingBoxElements();
            
            // イベントハンドラー削除
            if (this.eventHandlers.mousedown) {
                document.removeEventListener('mousemove', this.eventHandlers.mousemove);
                document.removeEventListener('mouseup', this.eventHandlers.mouseup);
                document.removeEventListener('touchmove', this.eventHandlers.touchmove);
                document.removeEventListener('touchend', this.eventHandlers.touchend);
            }
            
            // Canvas初期状態復元
            if (this.initialState.canvasStyle && this.config.canvasElement) {
                Object.assign(this.config.canvasElement.style, this.initialState.canvasStyle);
            }
            
            // WebGLリソースクリーンアップ
            if (this.state.spine.renderer) {
                try {
                    this.state.spine.renderer.dispose?.();
                } catch (e) {
                    console.warn('レンダラークリーンアップ警告:', e);
                }
            }
            
            // 状態初期化
            this.state.initialized = false;
            this.state.spine.loaded = false;
            this.state.spine.skeleton = null;
            this.state.spine.animationState = null;
            this.state.spine.renderer = null;
            
            this.gl = null;
            this.assetManager = null;
            
            console.log('✅ PureSpineEditor: クリーンアップ完了');
            return true;
            
        } catch (error) {
            console.error('❌ PureSpineEditor: クリーンアップエラー', error);
            return false;
        }
    }
    
    /**
     * 🔍 座標書き込み監視・診断機能（F12コンソール用）
     */
    logCoordinateState(context) {
        const canvas = this.config.canvasElement;
        const skeleton = this.state.spine.skeleton;
        
        const state = {
            context: context,
            timestamp: Date.now(),
            skeleton: skeleton ? {
                x: skeleton.x,
                y: skeleton.y,
                scaleX: skeleton.scaleX,
                scaleY: skeleton.scaleY
            } : null,
            canvas: {
                style: {
                    left: canvas.style.left,
                    top: canvas.style.top,
                    transform: canvas.style.transform,
                    position: canvas.style.position
                },
                rect: canvas.getBoundingClientRect()
            },
            boundingBox: this.state.editor.boundingBox.bounds ? {
                ...this.state.editor.boundingBox.bounds
            } : null,
            parentRect: canvas.parentElement ? 
                canvas.parentElement.getBoundingClientRect() : null
        };
        
        console.log(`🔍 座標状態記録 [${context}]`, state);
        return state;
    }
    
    detectInstantMovement(preState, postState, methodName) {
        if (!preState || !postState) return;
        
        const threshold = 5; // 5px以上の移動で瞬間移動とみなす
        
        // Canvas位置変更の検出
        const canvasMovementX = Math.abs(postState.canvas.rect.left - preState.canvas.rect.left);
        const canvasMovementY = Math.abs(postState.canvas.rect.top - preState.canvas.rect.top);
        
        // Skeleton座標変更の検出
        let skeletonMovement = 0;
        if (preState.skeleton && postState.skeleton) {
            const skeletonMovementX = Math.abs(postState.skeleton.x - preState.skeleton.x);
            const skeletonMovementY = Math.abs(postState.skeleton.y - preState.skeleton.y);
            skeletonMovement = Math.max(skeletonMovementX, skeletonMovementY);
        }
        
        // 瞬間移動検出
        const isInstantMovement = canvasMovementX > threshold || canvasMovementY > threshold;
        const isSkeletonChange = skeletonMovement > 0;
        
        if (isInstantMovement || isSkeletonChange) {
            console.warn(`🚨 瞬間移動検出 [${methodName}]`, {
                Canvas移動: {
                    x: canvasMovementX.toFixed(2) + 'px',
                    y: canvasMovementY.toFixed(2) + 'px',
                    閾値超過: isInstantMovement ? '⚠️あり' : 'なし'
                },
                Skeleton変更: {
                    移動量: skeletonMovement,
                    変更有無: isSkeletonChange ? '⚠️あり' : 'なし'
                },
                実行前Canvas位置: {
                    left: preState.canvas.rect.left.toFixed(2),
                    top: preState.canvas.rect.top.toFixed(2)
                },
                実行後Canvas位置: {
                    left: postState.canvas.rect.left.toFixed(2),
                    top: postState.canvas.rect.top.toFixed(2)
                },
                method: methodName
            });
        } else {
            console.log(`✅ 瞬間移動なし [${methodName}]`, {
                Canvas移動: {x: canvasMovementX.toFixed(2) + 'px', y: canvasMovementY.toFixed(2) + 'px'},
                method: methodName
            });
        }
    }
    
    // F12コンソール用診断機能
    getDiagnosticInfo() {
        return {
            initialized: this.state.initialized,
            skeleton: this.state.spine.skeleton ? {
                x: this.state.spine.skeleton.x,
                y: this.state.spine.skeleton.y,
                scaleX: this.state.spine.skeleton.scaleX,
                scaleY: this.state.spine.skeleton.scaleY
            } : null,
            canvas: {
                style: {
                    left: this.config.canvasElement.style.left,
                    top: this.config.canvasElement.style.top,
                    transform: this.config.canvasElement.style.transform
                },
                rect: this.config.canvasElement.getBoundingClientRect()
            },
            boundingBox: {
                visible: this.state.editor.boundingBox.visible,
                bounds: this.state.editor.boundingBox.bounds
            },
            internalState: this.state.spine.position
        };
    }
    
    // 座標リセット機能（診断・テスト用）
    resetCoordinates() {
        if (!this.state.spine.skeleton) {
            console.warn('⚠️ Skeleton未初期化のためリセットできません');
            return false;
        }
        
        console.log('🔄 座標リセット実行');
        const preResetState = this.logCoordinateState('リセット実行前');
        
        // Skeletonを原点に戻す
        this.state.spine.skeleton.x = 0;
        this.state.spine.skeleton.y = 0;
        this.state.spine.skeleton.scaleX = this.state.spine.skeleton.scaleY = 1.0;
        
        // Canvas位置もリセット（デフォルト位置に戻す）
        const canvas = this.config.canvasElement;
        canvas.style.left = '50%';
        canvas.style.top = '50%';
        canvas.style.transform = 'translate(-50%, -50%)';
        
        // 状態管理更新
        this.state.spine.position = {x: 0, y: 0};
        this.state.spine.scale = 1.0;
        
        const postResetState = this.logCoordinateState('リセット実行後');
        
        console.log('✅ 座標リセット完了');
        return true;
    }

    /**
     * 単独テスト用静的メソッド
     */
    static async test() {
        console.log('🧪 PureSpineEditor: 単独テスト開始');
        
        try {
            // テスト用Canvas作成
            const testCanvas = document.createElement('canvas');
            testCanvas.width = 400;
            testCanvas.height = 300;
            testCanvas.style.cssText = 'position: absolute; left: 100px; top: 100px; border: 1px solid #ccc;';
            document.body.appendChild(testCanvas);
            
            // テスト設定
            const testConfig = {
                basePath: "assets/spine/characters/purattokun/",
                atlasPath: "purattokun.atlas", 
                jsonPath: "purattokun.json",
                canvasElement: testCanvas,
                initialPosition: {x: 200, y: 150},
                initialScale: 0.8,
                showBoundingBox: true,
                defaultAnimation: "taiki"
            };
            
            // PureSpineEditor作成・実行
            const editor = new PureSpineEditor(testConfig);
            
            // Spine読み込み
            const loadResult = await editor.loadSpine();
            if (!loadResult.success) {
                throw new Error(loadResult.error);
            }
            
            // バウンディングボックス表示
            setTimeout(() => {
                editor.showBoundingBox();
                console.log('📦 テスト: バウンディングボックス表示');
            }, 1000);
            
            // 10秒間実行後クリーンアップ
            setTimeout(() => {
                editor.cleanup();
                testCanvas.remove();
                console.log('🧹 テスト: クリーンアップ完了');
            }, 10000);
            
            console.log('✅ PureSpineEditor: 単独テスト完了');
            return {
                success: true,
                message: 'PureSpineEditor単独テスト成功',
                editor: editor
            };
            
        } catch (error) {
            console.error('❌ PureSpineEditor: 単独テストエラー', error);
            return {
                success: false,
                error: error.message,
                message: 'PureSpineEditor単独テスト失敗'
            };
        }
    }
}

// グローバル関数（F12コンソール用）
if (typeof window !== 'undefined') {
    window.testPureSpineEditor = PureSpineEditor.test;
    
    // 診断機能をグローバル関数として公開
    window.diagnoseSpineEditor = function() {
        if (window.currentPureSpineEditor) {
            return window.currentPureSpineEditor.getDiagnosticInfo();
        } else {
            console.warn('⚠️ PureSpineEditorインスタンスが見つかりません');
            return null;
        }
    };
    
    window.logSpineCoordinates = function() {
        if (window.currentPureSpineEditor) {
            return window.currentPureSpineEditor.logCoordinateState('手動実行');
        } else {
            console.warn('⚠️ PureSpineEditorインスタンスが見つかりません');
            return null;
        }
    };
    
    window.resetSpineCoordinates = function() {
        if (window.currentPureSpineEditor) {
            return window.currentPureSpineEditor.resetCoordinates();
        } else {
            console.warn('⚠️ PureSpineEditorインスタンスが見つかりません');
            return false;
        }
    };
}