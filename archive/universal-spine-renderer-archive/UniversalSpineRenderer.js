/**
 * UniversalSpineRenderer - PureSpineLoader統合型汎用モジュール
 * 
 * 🎯 設計方針
 * 1. 完全汎用性：任意のSpineプロジェクトで利用可能
 * 2. PureSpineLoader統合：読み込み→描画の一貫制御
 * 3. 自動エラー回復：WebGL Context Lost/Restored自動対応
 * 4. フレームワーク非依存：Vanilla JavaScript、どこでも利用可能
 * 
 * 🚀 使用例：
 * ```javascript
 * const renderer = new UniversalSpineRenderer({
 *     canvas: document.getElementById('spine-canvas')
 * });
 * 
 * await renderer.initialize();
 * 
 * const character = await renderer.loadCharacter({
 *     name: 'purattokun',
 *     atlasPath: 'characters/purattokun/purattokun.atlas',
 *     jsonPath: 'characters/purattokun/purattokun.json',
 *     position: { x: 300, y: 400 },
 *     scale: 0.6
 * });
 * 
 * renderer.startRenderLoop();
 * ```
 */

class UniversalSpineRenderer {
    constructor(options = {}) {
        console.log('🚀 UniversalSpineRenderer: 初期化開始', options);
        
        // 必須パラメータ検証
        if (!options.canvas) {
            throw new Error('❌ UniversalSpineRenderer: canvas要素が必要です');
        }
        
        this.canvas = options.canvas;
        this.gl = null;
        
        // デフォルト設定（汎用性重視）
        this.config = {
            renderMode: 'auto',          // auto/stable/performance
            frameRate: 60,
            errorRecovery: true,         // 自動エラー回復
            debugMode: false,
            autoResize: true,
            
            // WebGL設定（成功パターンに基づく黒枠対策設定）
            webglOptions: {
                alpha: true,
                premultipliedAlpha: false,  // 黒枠対策: false に変更
                antialias: true,
                depth: false,
                stencil: false,
                preserveDrawingBuffer: false
            },
            
            // カメラ設定（自動調整）
            camera: {
                position: { x: 0, y: 0 },
                viewport: { width: 800, height: 600 },
                autoFit: true
            },
            
            // パフォーマンス設定
            performance: {
                maxCharacters: 10,
                memoryLimit: 256, // MB
                autoCleanup: true,
                backgroundPause: false
            },
            
            ...options.config
        };
        
        // 内部状態
        this.state = {
            initialized: false,
            rendering: false,
            characters: new Map(),
            lastFrameTime: 0,
            frameCount: 0,
            errors: [],
            events: new Map()
        };
        
        // SpineWebGL関連
        this.spine = null;
        this.assetManager = null;
        this.shader = null;
        this.batcher = null;
        this.skeletonRenderer = null;
        
        // レンダリングループ
        this.renderLoop = null;
        this.animationFrameId = null;
        
        // イベントシステム
        this.eventHandlers = new Map();
        
        console.log('✅ UniversalSpineRenderer: 初期化完了');
    }
    
    /**
     * 初期化（WebGL + Spine統合）
     */
    async initialize() {
        if (this.state.initialized) {
            console.log('⚠️ UniversalSpineRenderer: 既に初期化済み');
            return true;
        }
        
        try {
            console.log('🔧 UniversalSpineRenderer: 初期化処理開始');
            
            // キャンバスサイズ事前設定（WebGL初期化前に必須）
            this._updateCanvasSize();
            
            // WebGL Context作成
            await this._initializeWebGL();
            
            // Spine WebGL初期化
            await this._initializeSpine();
            
            // レンダリングシステム初期化
            this._initializeRendering();
            
            // 自動リサイズ設定
            if (this.config.autoResize) {
                this._setupAutoResize();
            }
            
            // エラー回復システム設定
            if (this.config.errorRecovery) {
                this._setupErrorRecovery();
            }
            
            this.state.initialized = true;
            console.log('✅ UniversalSpineRenderer: 初期化成功');
            
            this.emit('initialized');
            return true;
            
        } catch (error) {
            console.error('❌ UniversalSpineRenderer: 初期化失敗:', error);
            this.state.errors.push({
                type: 'initialization',
                message: error.message,
                timestamp: Date.now()
            });
            
            this.emit('error', error);
            return false;
        }
    }
    
    /**
     * WebGL初期化（PureSpineLoaderの最適化設定統合）
     */
    async _initializeWebGL() {
        console.log('🔧 WebGL初期化開始');
        console.log('  - Canvas:', this.canvas);
        console.log('  - Canvas size:', this.canvas.width, 'x', this.canvas.height);
        
        const webglOptions = this.config.webglOptions;
        console.log('  - WebGL options:', webglOptions);
        
        this.gl = this.canvas.getContext('webgl', webglOptions) || 
                  this.canvas.getContext('experimental-webgl', webglOptions);
        
        if (!this.gl) {
            console.error('❌ WebGLコンテキスト作成失敗');
            console.error('  - WebGL対応確認:', 'webgl' in document.createElement('canvas').getContext);
            console.error('  - Canvas state:', {
                width: this.canvas.width,
                height: this.canvas.height,
                clientWidth: this.canvas.clientWidth,
                clientHeight: this.canvas.clientHeight
            });
            throw new Error('WebGLコンテキストの作成に失敗しました');
        }
        
        // 成功パターンに基づくブレンド設定（黒枠問題解決）
        this.gl.enable(this.gl.BLEND);
        
        // 標準的なアルファブレンド設定（成功実績のある設定）
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        
        console.log('✅ 黒枠対策ブレンド設定適用 (SRC_ALPHA, ONE_MINUS_SRC_ALPHA)');
        
        // テクスチャフィルタリング最適化
        this._setupTextureFiltering();
        
        console.log('✅ WebGL初期化完了', {
            vendor: this.gl.getParameter(this.gl.VENDOR),
            renderer: this.gl.getParameter(this.gl.RENDERER)
        });
    }
    
    /**
     * テクスチャフィルタリング設定（PureSpineLoader統合・黒枠対策）
     */
    _setupTextureFiltering() {
        console.log('🎨 テクスチャフィルタリング最適化設定適用（黒枠対策）');
        
        // WebGLコンテキスト確認
        if (!this.gl) {
            console.error('❌ WebGLコンテキストが未初期化');
            return;
        }
        
        const originalBindTexture = this.gl.bindTexture.bind(this.gl);
        this.gl.bindTexture = (target, texture) => {
            // WebGL エラーハンドリング強化
            if (!this.gl) {
                console.error('❌ WebGL context lost in bindTexture');
                return originalBindTexture(target, texture);
            }
            
            const result = originalBindTexture(target, texture);
            
            if (target === this.gl.TEXTURE_2D && texture && this.gl.TEXTURE_2D) {
                try {
                    // ピクセルパーフェクト設定（境界にじみ防止）
                    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
                    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
                    
                    // テクスチャ境界処理（境界をクランプ・黒枠防止）
                    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
                    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
                    
                    console.log('🎯 テクスチャフィルタリング設定適用 - 黒枠対策完了');
                } catch (error) {
                    console.error('❌ テクスチャフィルタリング設定エラー:', error);
                }
            }
            
            return result;
        };
        
        console.log('✅ テクスチャフィルタリング最適化完了');
    }
    
    /**
     * Spine WebGL初期化
     */
    async _initializeSpine() {
        console.log('🦴 Spine WebGL初期化開始');
        
        // Spine WebGLライブラリ確認（詳細デバッグ）
        console.log('🔍 Spine WebGLライブラリ確認:');
        console.log('  - typeof window:', typeof window);
        console.log('  - window.spine:', window.spine);
        console.log('  - spine keys:', window.spine ? Object.keys(window.spine) : 'none');
        
        if (typeof window === 'undefined' || !window.spine) {
            console.error('❌ Spine WebGLライブラリ確認失敗');
            console.error('  - window定義:', typeof window !== 'undefined');
            console.error('  - window.spine定義:', !!window.spine);
            
            if (typeof window !== 'undefined') {
                console.error('  - 利用可能なグローバル変数:', Object.keys(window).filter(key => key.includes('spine') || key.includes('Spine')));
            }
            
            throw new Error('Spine WebGLライブラリが読み込まれていません');
        }
        
        this.spine = window.spine;
        
        // 必要なクラス確認
        const requiredClasses = [
            'AssetManager', 'SkeletonJson', 'AtlasAttachmentLoader',
            'PolygonBatcher', 'SkeletonRenderer', 'Skeleton', 'AnimationState'
        ];
        
        const missingClasses = requiredClasses.filter(className => !this.spine[className]);
        if (missingClasses.length > 0) {
            throw new Error(`Spine WebGLクラス不足: ${missingClasses.join(', ')}`);
        }
        
        // AssetManager作成
        this.assetManager = new this.spine.AssetManager(this.gl);
        
        // レンダリングシステム作成
        this.shader = this.spine.Shader.newTwoColoredTextured(this.gl);
        this.batcher = new this.spine.PolygonBatcher(this.gl);
        this.skeletonRenderer = new this.spine.SkeletonRenderer(this.gl);
        
        // SkeletonRendererの黒枠対策設定
        this.skeletonRenderer.premultipliedAlpha = false;
        console.log('✅ SkeletonRenderer premultipliedAlpha設定: false');
        
        console.log('✅ Spine WebGL初期化完了');
    }
    
    /**
     * レンダリングシステム初期化
     */
    _initializeRendering() {
        console.log('🎨 レンダリングシステム初期化');
        
        // キャンバスサイズ設定
        this._updateCanvasSize();
        
        // クリア色設定
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        
        console.log('✅ レンダリングシステム初期化完了');
    }
    
    /**
     * キャラクター読み込み（PureSpineLoader統合）
     */
    async loadCharacter(config) {
        console.log('📦 キャラクター読み込み開始:', config.name);
        
        if (!this.state.initialized) {
            throw new Error('UniversalSpineRendererが初期化されていません');
        }
        
        // デフォルト設定適用
        const characterConfig = {
            position: { x: 0, y: 0 },
            scale: 1.0,
            rotation: 0,
            alpha: 1.0,
            visible: true,
            defaultAnimation: null,
            ...config
        };
        
        try {
            // アセット読み込み（PureSpineLoaderロジック統合）
            const spineData = await this._loadSpineAssets(characterConfig);
            
            // キャラクター作成
            const character = await this._createCharacter(characterConfig, spineData);
            
            // キャラクター登録
            this.state.characters.set(characterConfig.name, character);
            
            console.log('✅ キャラクター読み込み完了:', characterConfig.name);
            
            this.emit('characterLoaded', character);
            return character;
            
        } catch (error) {
            console.error('❌ キャラクター読み込み失敗:', error);
            this.state.errors.push({
                type: 'character_loading',
                character: characterConfig.name,
                message: error.message,
                timestamp: Date.now()
            });
            
            this.emit('error', error);
            throw error;
        }
    }
    
    /**
     * Spineアセット読み込み（PureSpineLoaderロジック統合）
     */
    async _loadSpineAssets(config) {
        console.log('📋 Spineアセット読み込み:', {
            atlas: config.atlasPath,
            json: config.jsonPath
        });
        
        // アセット読み込み予約
        this.assetManager.loadJson(config.jsonPath);
        this.assetManager.loadTextureAtlas(config.atlasPath);
        
        // 読み込み完了待ち
        await this._waitForAssets();
        
        // Atlas取得
        const atlas = this.assetManager.require(config.atlasPath);
        if (!atlas) {
            throw new Error(`Atlasファイルの読み込みに失敗: ${config.atlasPath}`);
        }
        
        // JSON取得
        const jsonData = this.assetManager.require(config.jsonPath);
        if (!jsonData) {
            throw new Error(`JSONファイルの読み込みに失敗: ${config.jsonPath}`);
        }
        
        // SkeletonData作成
        const skeletonJson = new this.spine.SkeletonJson(new this.spine.AtlasAttachmentLoader(atlas));
        const skeletonData = skeletonJson.readSkeletonData(jsonData);
        
        if (!skeletonData) {
            throw new Error('SkeletonDataの作成に失敗');
        }
        
        console.log('✅ Spineアセット読み込み完了');
        
        return {
            skeletonData,
            atlas,
            scale: config.scale || 1.0
        };
    }
    
    /**
     * アセット読み込み完了待ち
     */
    async _waitForAssets() {
        return new Promise((resolve, reject) => {
            const checkLoading = () => {
                if (this.assetManager.isLoadingComplete()) {
                    if (this.assetManager.hasErrors()) {
                        const errors = this.assetManager.getErrors();
                        reject(new Error(`アセット読み込みエラー: ${Object.entries(errors).map(([path, error]) => `${path}: ${error}`).join(', ')}`));
                    } else {
                        resolve();
                    }
                } else {
                    setTimeout(checkLoading, 50);
                }
            };
            checkLoading();
        });
    }
    
    /**
     * キャラクター作成
     */
    async _createCharacter(config, spineData) {
        console.log('🎭 キャラクター作成:', config.name);
        
        // Skeleton作成
        const skeleton = new this.spine.Skeleton(spineData.skeletonData);
        skeleton.scaleX = config.scale;
        skeleton.scaleY = config.scale;
        skeleton.x = config.position.x;
        skeleton.y = config.position.y;
        
        // AnimationState作成
        const animationStateData = new this.spine.AnimationStateData(spineData.skeletonData);
        const animationState = new this.spine.AnimationState(animationStateData);
        
        // デフォルトアニメーション設定
        if (config.defaultAnimation) {
            const animation = spineData.skeletonData.findAnimation(config.defaultAnimation);
            if (animation) {
                animationState.setAnimation(0, config.defaultAnimation, true);
            }
        }
        
        // キャラクターオブジェクト作成
        const character = {
            name: config.name,
            config: config,
            skeleton: skeleton,
            animationState: animationState,
            spineData: spineData,
            isLoaded: true,
            isVisible: config.visible,
            currentAnimation: config.defaultAnimation,
            lastUpdateTime: Date.now(),
            
            // キャラクター操作メソッド
            setPosition: (x, y) => {
                skeleton.x = x;
                skeleton.y = y;
                config.position = { x, y };
            },
            
            setScale: (scale) => {
                skeleton.scaleX = scale;
                skeleton.scaleY = scale;
                config.scale = scale;
            },
            
            setAnimation: (animationName, loop = true) => {
                const animation = spineData.skeletonData.findAnimation(animationName);
                if (animation) {
                    animationState.setAnimation(0, animationName, loop);
                    character.currentAnimation = animationName;
                }
            },
            
            show: () => {
                character.isVisible = true;
            },
            
            hide: () => {
                character.isVisible = false;
            }
        };
        
        console.log('✅ キャラクター作成完了:', config.name);
        
        return character;
    }
    
    /**
     * レンダリングループ開始
     */
    startRenderLoop() {
        if (this.state.rendering) {
            console.log('⚠️ レンダリングループは既に開始されています');
            return;
        }
        
        if (!this.state.initialized) {
            console.error('❌ UniversalSpineRendererが初期化されていません');
            return;
        }
        
        console.log('🎬 レンダリングループ開始');
        
        this.state.rendering = true;
        this.state.lastFrameTime = Date.now();
        
        const renderFrame = (timestamp) => {
            if (!this.state.rendering) return;
            
            try {
                this._renderFrame(timestamp);
                this.animationFrameId = requestAnimationFrame(renderFrame);
            } catch (error) {
                console.error('❌ レンダリングエラー:', error);
                this.emit('error', error);
                
                if (this.config.errorRecovery) {
                    this._attemptRenderingRecovery(error);
                }
            }
        };
        
        this.animationFrameId = requestAnimationFrame(renderFrame);
        this.emit('renderingStarted');
    }
    
    /**
     * フレーム描画
     */
    _renderFrame(timestamp) {
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.state.lastFrameTime) / 1000;
        this.state.lastFrameTime = currentTime;
        this.state.frameCount++;
        
        // キャンバスクリア
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        // ビューポート設定
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // ブレンド設定確実適用（黒枠問題対策・成功パターン）
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        
        // シェーダー有効化
        this.shader.bind();
        this.shader.setUniform4x4f(this.spine.Shader.MVP_MATRIX, this._getProjectionMatrix());
        
        // バッチャー開始
        this.batcher.begin(this.shader);
        
        // 各キャラクター描画
        this.state.characters.forEach((character) => {
            if (character.isVisible && character.isLoaded) {
                this._renderCharacter(character, deltaTime);
            }
        });
        
        // バッチャー終了
        this.batcher.end();
        this.shader.unbind();
    }
    
    /**
     * キャラクター描画
     */
    _renderCharacter(character, deltaTime) {
        // アニメーション更新
        character.animationState.update(deltaTime);
        character.animationState.apply(character.skeleton);
        character.skeleton.updateWorldTransform();
        
        // 描画
        this.skeletonRenderer.draw(this.batcher, character.skeleton);
    }
    
    /**
     * プロジェクション行列取得
     */
    _getProjectionMatrix() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        return [
            2 / width, 0, 0, 0,
            0, 2 / height, 0, 0,
            0, 0, -1, 0,
            -1, -1, 0, 1
        ];
    }
    
    /**
     * レンダリングループ停止
     */
    stopRenderLoop() {
        if (!this.state.rendering) return;
        
        console.log('🛑 レンダリングループ停止');
        
        this.state.rendering = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        this.emit('renderingStopped');
    }
    
    /**
     * 自動リサイズ設定
     */
    _setupAutoResize() {
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === this.canvas) {
                    this._updateCanvasSize();
                }
            }
        });
        
        resizeObserver.observe(this.canvas);
        
        // 初回サイズ更新
        this._updateCanvasSize();
    }
    
    /**
     * キャンバスサイズ更新
     */
    _updateCanvasSize() {
        const rect = this.canvas.getBoundingClientRect();
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        // 最小サイズ保証（WebGLコンテキスト作成のため）
        const width = Math.max(rect.width, 1);
        const height = Math.max(rect.height, 1);
        
        this.canvas.width = width * devicePixelRatio;
        this.canvas.height = height * devicePixelRatio;
        
        console.log('🖼️ Canvas サイズ更新:', {
            rect: { width: rect.width, height: rect.height },
            canvas: { width: this.canvas.width, height: this.canvas.height },
            devicePixelRatio: devicePixelRatio
        });
        
        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    /**
     * エラー回復システム設定
     */
    _setupErrorRecovery() {
        // WebGL Context Lost処理
        this.canvas.addEventListener('webglcontextlost', (event) => {
            console.warn('⚠️ WebGL Context Lost');
            event.preventDefault();
            this.stopRenderLoop();
            this.emit('webglcontextlost');
        });
        
        // WebGL Context Restored処理
        this.canvas.addEventListener('webglcontextrestored', async (event) => {
            console.log('🔄 WebGL Context Restored');
            
            try {
                // 再初期化
                await this._initializeWebGL();
                await this._initializeSpine();
                this._initializeRendering();
                
                // キャラクター再読み込み
                const characterConfigs = Array.from(this.state.characters.values()).map(char => char.config);
                this.state.characters.clear();
                
                for (const config of characterConfigs) {
                    await this.loadCharacter(config);
                }
                
                // レンダリング再開
                this.startRenderLoop();
                
                console.log('✅ WebGL Context復旧完了');
                this.emit('webglcontextrestored');
                
            } catch (error) {
                console.error('❌ WebGL Context復旧失敗:', error);
                this.emit('error', error);
            }
        });
    }
    
    /**
     * レンダリング回復試行
     */
    _attemptRenderingRecovery(error) {
        console.log('🔄 レンダリング回復試行');
        
        setTimeout(() => {
            if (!this.state.rendering) {
                this.startRenderLoop();
            }
        }, 1000);
    }
    
    /**
     * キャラクター取得
     */
    getCharacter(name) {
        return this.state.characters.get(name) || null;
    }
    
    /**
     * 全キャラクター取得
     */
    getAllCharacters() {
        return Array.from(this.state.characters.values());
    }
    
    /**
     * キャラクター削除
     */
    removeCharacter(name) {
        const character = this.state.characters.get(name);
        if (character) {
            this.state.characters.delete(name);
            this.emit('characterRemoved', character);
            return true;
        }
        return false;
    }
    
    /**
     * ステータス取得
     */
    getStatus() {
        return {
            initialized: this.state.initialized,
            rendering: this.state.rendering,
            charactersLoaded: this.state.characters.size,
            frameCount: this.state.frameCount,
            errors: this.state.errors.length,
            webglSupported: !!this.gl
        };
    }
    
    /**
     * リソース解放
     */
    dispose() {
        console.log('🧹 UniversalSpineRenderer: リソース解放開始');
        
        // レンダリング停止
        this.stopRenderLoop();
        
        // キャラクターリソース解放
        this.state.characters.forEach((character) => {
            if (character.spineData.atlas) {
                character.spineData.atlas.dispose();
            }
        });
        this.state.characters.clear();
        
        // AssetManager解放
        if (this.assetManager) {
            this.assetManager.dispose();
        }
        
        // WebGLリソース解放
        if (this.shader) {
            this.shader.dispose();
        }
        
        // 状態リセット
        this.state.initialized = false;
        this.gl = null;
        
        console.log('✅ UniversalSpineRenderer: リソース解放完了');
    }
    
    /**
     * イベント処理
     */
    on(eventName, callback) {
        if (!this.eventHandlers.has(eventName)) {
            this.eventHandlers.set(eventName, []);
        }
        this.eventHandlers.get(eventName).push(callback);
    }
    
    off(eventName, callback) {
        const handlers = this.eventHandlers.get(eventName);
        if (handlers) {
            const index = handlers.indexOf(callback);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }
    
    emit(eventName, ...args) {
        const handlers = this.eventHandlers.get(eventName);
        if (handlers) {
            handlers.forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error('❌ イベントハンドラーエラー:', error);
                }
            });
        }
    }
    
    /**
     * 静的テストメソッド
     */
    static async test(canvasId = 'test-canvas') {
        console.log('🧪 UniversalSpineRenderer: テスト開始');
        
        try {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw new Error(`Canvas要素が見つかりません: ${canvasId}`);
            }
            
            const renderer = new UniversalSpineRenderer({ canvas });
            
            const initialized = await renderer.initialize();
            if (!initialized) {
                throw new Error('初期化に失敗しました');
            }
            
            console.log('✅ UniversalSpineRenderer テスト成功');
            
            return {
                success: true,
                renderer: renderer
            };
            
        } catch (error) {
            console.error('❌ UniversalSpineRenderer テスト失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// グローバル公開
if (typeof window !== 'undefined') {
    window.UniversalSpineRenderer = UniversalSpineRenderer;
    
    // テスト関数もグローバルに
    window.testUniversalSpineRenderer = UniversalSpineRenderer.test;
}

// CommonJS/ES6 Modules対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UniversalSpineRenderer;
}