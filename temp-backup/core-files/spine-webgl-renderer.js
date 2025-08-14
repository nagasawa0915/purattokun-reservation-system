/**
 * Spine WebGL Renderer - v2.0
 * Spine WebGL 4.1.24を使用した統合レンダリングシステム
 * 
 * 機能:
 * - Spine WebGL 4.1.24の安全な初期化
 * - .json/.atlas/.pngアセットの読み込み
 * - アニメーション再生システム（デフォルト・idle・taiki対応）
 * - フォールバック機能（WebGL失敗時のプレースホルダー）
 * - メモリ管理・リソース解放
 * 
 * @author Claude Code
 * @version 2.0.0
 * @since 2025-08-13
 */

class SpineWebGLRenderer {
    constructor() {
        this.spineVersion = '4.1.24';  // 固定バージョン
        this.maxInitAttempts = 100;    // 10秒間待機
        this.initialized = false;
        this.activeRenderers = new Map(); // アクティブなレンダラー管理
        this.debugMode = false;
        
        // WebGLコンテキスト設定
        this.webglConfig = {
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            premultipliedAlpha: false
        };
        
        // アニメーション設定
        this.animationSettings = {
            defaultAnimation: 'idle',     // デフォルトアニメーション
            fallbackAnimations: ['taiki', 'default', 'animation'], // フォールバック順序
            loopDefault: true,
            transitionDuration: 0.2
        };
        
        console.log('🎭 SpineWebGLRenderer v2.0 initialized');
        console.log(`📋 Target Spine version: ${this.spineVersion}`);
    }

    /**
     * Spine WebGL 4.1.24の初期化
     * CDN読み込み待機とバージョン確認
     */
    async initialize() {
        console.log('🚀 SpineWebGLRenderer: Starting initialization...');
        
        try {
            // CDN読み込み待機
            await this.waitForSpineWebGL();
            
            // バージョン確認
            this.validateSpineVersion();
            
            // WebGL基本機能テスト
            await this.testWebGLSupport();
            
            this.initialized = true;
            console.log('✅ SpineWebGLRenderer: Initialization completed successfully');
            
            return true;
            
        } catch (error) {
            console.error('❌ SpineWebGLRenderer: Initialization failed:', error.message);
            this.initialized = false;
            return false;
        }
    }

    /**
     * Spine WebGL CDN読み込み待機
     */
    async waitForSpineWebGL() {
        console.log('⏳ Waiting for Spine WebGL CDN to load...');
        
        let attempts = 0;
        while (typeof spine === 'undefined' && attempts < this.maxInitAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
            
            if (attempts % 20 === 0) {
                console.log(`📡 CDN loading attempt ${attempts}/${this.maxInitAttempts}...`);
            }
        }
        
        if (typeof spine === 'undefined') {
            throw new Error(`Spine WebGL ${this.spineVersion} CDN loading failed after 10 seconds`);
        }
        
        console.log('✅ Spine WebGL CDN loaded successfully');
    }

    /**
     * Spineバージョン確認
     */
    validateSpineVersion() {
        console.log('🔍 Validating Spine WebGL version...');
        
        // Spine基本オブジェクト確認
        if (!spine) {
            throw new Error('Spine object not available');
        }
        
        if (!spine.webgl) {
            throw new Error('spine.webgl not available - incorrect Spine version');
        }
        
        // 必要なクラスの存在確認
        const requiredClasses = [
            'Matrix4', 'SceneRenderer', 'ManagedWebGLRenderingContext',
            'AssetManager', 'SkeletonJson', 'AtlasAttachmentLoader',
            'Skeleton', 'AnimationState', 'AnimationStateData'
        ];
        
        for (const className of requiredClasses) {
            if (!spine[className] && !spine.webgl[className]) {
                throw new Error(`Required class ${className} not found in Spine WebGL`);
            }
        }
        
        console.log('✅ Spine WebGL version validated');
        console.log('📋 Available classes:', requiredClasses.filter(cls => 
            spine[cls] || spine.webgl?.[cls]
        ));
    }

    /**
     * WebGL基本サポート確認
     */
    async testWebGLSupport() {
        console.log('🧪 Testing WebGL support...');
        
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 100;
        testCanvas.height = 100;
        
        const gl = testCanvas.getContext('webgl2', this.webglConfig) || 
                   testCanvas.getContext('webgl', this.webglConfig);
        
        if (!gl) {
            throw new Error('WebGL context creation failed - WebGL not supported');
        }
        
        // 基本機能テスト
        const version = gl.getParameter(gl.VERSION);
        const vendor = gl.getParameter(gl.VENDOR);
        const renderer = gl.getParameter(gl.RENDERER);
        
        console.log('✅ WebGL support confirmed');
        console.log(`📋 WebGL info: ${version}`);
        console.log(`📋 Vendor: ${vendor}`);
        console.log(`📋 Renderer: ${renderer}`);
        
        // テスト用リソース解放
        gl.getExtension('WEBGL_lose_context')?.loseContext();
    }

    /**
     * Spineキャラクターの読み込みと初期化
     * @param {Object} character - キャラクターデータ
     * @param {HTMLCanvasElement} canvas - レンダリング対象Canvas
     * @param {Object} options - オプション設定
     */
    async loadCharacter(character, canvas, options = {}) {
        console.log(`🎭 Loading Spine character: ${character.name}`);
        
        if (!this.initialized) {
            console.warn('⚠️ SpineWebGLRenderer not initialized, attempting fallback...');
            return this.createFallbackCharacter(character, canvas);
        }
        
        try {
            // WebGLコンテキスト作成
            const gl = this.createWebGLContext(canvas);
            
            // Spineレンダラー初期化
            const renderer = await this.createSpineRenderer(canvas, gl);
            
            // アセット読み込み
            const assets = await this.loadCharacterAssets(renderer, character);
            
            // スケルトン・アニメーション作成
            const spineData = this.createSpineComponents(assets, character);
            
            // キャラクター設定
            this.configureCharacter(spineData, canvas, options);
            
            // レンダラー登録
            const characterRenderer = {
                id: character.id,
                name: character.name,
                canvas: canvas,
                renderer: renderer,
                ...spineData,
                animationState: spineData.animationState,
                lastUpdateTime: Date.now()
            };
            
            this.activeRenderers.set(character.id, characterRenderer);
            
            // アニメーションループ開始
            this.startRenderLoop(character.id);
            
            // デフォルトアニメーション開始
            this.startDefaultAnimation(character.id);
            
            console.log(`✅ Spine character loaded successfully: ${character.name}`);
            return characterRenderer;
            
        } catch (error) {
            console.error(`❌ Failed to load Spine character ${character.name}:`, error.message);
            console.log('🔄 Falling back to placeholder mode...');
            return this.createFallbackCharacter(character, canvas);
        }
    }

    /**
     * WebGLコンテキスト作成
     */
    createWebGLContext(canvas) {
        console.log('🔧 Creating WebGL context...');
        
        const gl = canvas.getContext('webgl2', this.webglConfig) || 
                   canvas.getContext('webgl', this.webglConfig);
        
        if (!gl) {
            throw new Error('WebGL context creation failed');
        }
        
        // WebGL設定最適化
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        console.log('✅ WebGL context created');
        console.log(`📋 Context type: ${gl.constructor.name}`);
        console.log(`📋 Drawing buffer size: ${gl.drawingBufferWidth}x${gl.drawingBufferHeight}`);
        
        return gl;
    }

    /**
     * Spineレンダラー作成
     */
    async createSpineRenderer(canvas, gl) {
        console.log('🎨 Creating Spine renderer...');
        
        try {
            // ManagedWebGLRenderingContext作成
            const context = new spine.ManagedWebGLRenderingContext(gl);
            
            // SceneRenderer作成
            const renderer = new spine.SceneRenderer(canvas, context);
            
            // カメラ設定
            renderer.camera.position.x = 0;
            renderer.camera.position.y = 0;
            renderer.camera.viewportWidth = canvas.width;
            renderer.camera.viewportHeight = canvas.height;
            renderer.camera.update();
            
            console.log('✅ Spine renderer created');
            console.log('📋 Camera configuration:');
            console.log(`  - Position: (${renderer.camera.position.x}, ${renderer.camera.position.y})`);
            console.log(`  - Viewport: ${renderer.camera.viewportWidth}x${renderer.camera.viewportHeight}`);
            
            return renderer;
            
        } catch (error) {
            console.error('❌ Spine renderer creation failed:', error);
            throw error;
        }
    }

    /**
     * キャラクターアセットの読み込み
     */
    async loadCharacterAssets(renderer, character) {
        console.log(`📁 Loading assets for ${character.name}...`);
        
        const assetManager = new spine.AssetManager(renderer.context);
        
        // アセットファイルパス構築
        const assetPaths = this.buildAssetPaths(character);
        
        // アセット読み込み開始
        console.log('📦 Loading asset files:');
        console.log(`  - Atlas: ${assetPaths.atlas}`);
        console.log(`  - JSON: ${assetPaths.json}`);
        console.log(`  - Texture: ${assetPaths.texture}`);
        
        assetManager.loadTextureAtlas(assetPaths.atlas);
        assetManager.loadText(assetPaths.json);
        assetManager.loadTexture(assetPaths.texture);
        
        // 読み込み完了待機
        await this.waitForAssetLoading(assetManager);
        
        console.log('✅ All assets loaded successfully');
        
        return {
            assetManager,
            atlasPath: assetPaths.atlas,
            jsonPath: assetPaths.json,
            texturePath: assetPaths.texture
        };
    }

    /**
     * アセットファイルパス構築
     */
    buildAssetPaths(character) {
        const baseName = character.id || character.name;
        const basePath = character.folderPath || character.basePath || '';
        
        return {
            atlas: `${basePath}/${baseName}.atlas`,
            json: `${basePath}/${baseName}.json`,
            texture: `${basePath}/${baseName}.png`
        };
    }

    /**
     * Spineコンポーネント作成（スケルトン・アニメーション）
     */
    createSpineComponents(assets, character) {
        console.log(`🦴 Creating Spine components for ${character.name}...`);
        
        try {
            const { assetManager, atlasPath, jsonPath } = assets;
            
            // Atlas・SkeletonData作成
            const atlas = assetManager.require(atlasPath);
            const skeletonJson = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(atlas));
            const skeletonData = skeletonJson.readSkeletonData(assetManager.require(jsonPath));
            
            // Skeleton作成
            const skeleton = new spine.Skeleton(skeletonData);
            skeleton.setToSetupPose();
            
            // AnimationState作成
            const animationStateData = new spine.AnimationStateData(skeleton.data);
            const animationState = new spine.AnimationState(animationStateData);
            
            // アニメーション情報表示
            const animations = skeletonData.animations.map(a => a.name);
            console.log('✅ Spine components created');
            console.log(`📋 Skeleton info:`);
            console.log(`  - Bones: ${skeletonData.bones.length}`);
            console.log(`  - Slots: ${skeletonData.slots.length}`);
            console.log(`  - Animations: [${animations.join(', ')}]`);
            
            return {
                skeleton,
                animationState,
                animationStateData,
                skeletonData,
                atlas,
                availableAnimations: animations
            };
            
        } catch (error) {
            console.error('❌ Spine components creation failed:', error);
            throw error;
        }
    }

    /**
     * キャラクター設定（位置・スケール等）
     */
    configureCharacter(spineData, canvas, options) {
        const { skeleton } = spineData;
        
        // Canvas中央配置（統一座標システム）
        skeleton.x = canvas.width / 2;
        skeleton.y = canvas.height / 2;
        
        // スケール設定
        const scale = options.scale || 1.0;
        skeleton.scaleX = skeleton.scaleY = scale;
        
        // 初期姿勢更新
        skeleton.updateWorldTransform();
        
        console.log('⚙️ Character configuration applied:');
        console.log(`  - Position: (${skeleton.x}, ${skeleton.y}) - Canvas center`);
        console.log(`  - Scale: ${skeleton.scaleX}`);
    }

    /**
     * デフォルトアニメーション開始
     */
    startDefaultAnimation(characterId) {
        const character = this.activeRenderers.get(characterId);
        if (!character) return;
        
        const { animationState, availableAnimations } = character;
        
        // アニメーション選択ロジック
        let targetAnimation = null;
        for (const animName of this.animationSettings.fallbackAnimations) {
            if (availableAnimations.includes(animName)) {
                targetAnimation = animName;
                break;
            }
        }
        
        // 最初のアニメーションをフォールバック
        if (!targetAnimation && availableAnimations.length > 0) {
            targetAnimation = availableAnimations[0];
        }
        
        if (targetAnimation) {
            console.log(`🎭 Starting default animation: ${targetAnimation}`);
            animationState.setAnimation(0, targetAnimation, this.animationSettings.loopDefault);
        } else {
            console.warn('⚠️ No suitable animation found');
        }
    }

    /**
     * レンダリングループ開始
     */
    startRenderLoop(characterId) {
        const character = this.activeRenderers.get(characterId);
        if (!character) return;
        
        console.log(`🎬 Starting render loop for ${character.name}`);
        
        let frameCount = 0;
        const targetFPS = 60;
        const frameInterval = 1000 / targetFPS;
        
        const renderFrame = (timestamp) => {
            // キャラクターが削除されていたら停止
            if (!this.activeRenderers.has(characterId)) {
                console.log(`🛑 Render loop stopped for ${characterId}`);
                return;
            }
            
            const char = this.activeRenderers.get(characterId);
            if (!char.canvas.parentNode) {
                this.removeCharacter(characterId);
                return;
            }
            
            try {
                // フレーム時間計算
                const deltaTime = timestamp - char.lastUpdateTime;
                char.lastUpdateTime = timestamp;
                
                // 60FPS制限
                if (deltaTime < frameInterval) {
                    requestAnimationFrame(renderFrame);
                    return;
                }
                
                this.renderCharacter(characterId, deltaTime / 1000); // 秒単位
                frameCount++;
                
                // デバッグ情報（最初の5フレームのみ）
                if (frameCount <= 5) {
                    console.log(`🎬 Frame ${frameCount} rendered for ${char.name}`);
                }
                
            } catch (error) {
                console.error(`❌ Render error for ${characterId}:`, error);
                this.removeCharacter(characterId);
                return;
            }
            
            requestAnimationFrame(renderFrame);
        };
        
        character.lastUpdateTime = performance.now();
        requestAnimationFrame(renderFrame);
    }

    /**
     * キャラクターレンダリング実行
     */
    renderCharacter(characterId, deltaTime) {
        const character = this.activeRenderers.get(characterId);
        if (!character) return;
        
        const { canvas, renderer, skeleton, animationState } = character;
        const gl = canvas.getContext('webgl');
        
        if (!gl) return;
        
        try {
            // アニメーション更新
            animationState.update(deltaTime);
            animationState.apply(skeleton);
            skeleton.updateWorldTransform();
            
            // 画面クリア（透明背景）
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            // カメラ更新
            renderer.camera.viewportWidth = canvas.width;
            renderer.camera.viewportHeight = canvas.height;
            renderer.camera.update();
            
            // Spineレンダリング
            renderer.begin();
            renderer.drawSkeleton(skeleton);
            renderer.end();
            
        } catch (error) {
            console.error(`❌ Character render error:`, error);
            throw error;
        }
    }

    /**
     * アセット読み込み完了待機
     */
    async waitForAssetLoading(assetManager) {
        return new Promise((resolve, reject) => {
            const checkProgress = () => {
                if (assetManager.isLoadingComplete()) {
                    if (assetManager.hasErrors()) {
                        console.error('❌ Asset loading errors detected');
                        
                        // エラー詳細表示
                        const errors = assetManager.getErrors();
                        for (const error of Object.values(errors)) {
                            console.error('📁 Asset error:', error);
                        }
                        
                        reject(new Error('Asset loading failed'));
                    } else {
                        resolve();
                    }
                } else {
                    setTimeout(checkProgress, 100);
                }
            };
            checkProgress();
        });
    }

    /**
     * フォールバック（プレースホルダー）キャラクター作成
     */
    createFallbackCharacter(character, canvas) {
        console.log(`🔄 Creating fallback character for ${character.name}`);
        
        // Canvas要素を利用した簡易表示
        const ctx = canvas.getContext('2d');
        if (ctx) {
            this.drawPlaceholderOnCanvas(ctx, canvas, character.name);
        }
        
        const fallbackCharacter = {
            id: character.id,
            name: character.name,
            type: 'placeholder',
            canvas: canvas,
            element: canvas
        };
        
        console.log(`✅ Fallback character created: ${character.name}`);
        return fallbackCharacter;
    }

    /**
     * Canvas上にプレースホルダー描画
     */
    drawPlaceholderOnCanvas(ctx, canvas, characterName) {
        // 背景クリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // プレースホルダー描画
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 文字表示
        ctx.fillStyle = '#666';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎭', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.font = '12px Arial';
        ctx.fillText(characterName, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('(Placeholder)', canvas.width / 2, canvas.height / 2 + 35);
    }

    /**
     * アニメーション再生
     */
    playAnimation(characterId, animationName, loop = true) {
        const character = this.activeRenderers.get(characterId);
        if (!character || character.type === 'placeholder') {
            console.warn(`⚠️ Cannot play animation for ${characterId}: invalid character`);
            return false;
        }
        
        const { animationState, availableAnimations } = character;
        
        if (!availableAnimations.includes(animationName)) {
            console.warn(`⚠️ Animation '${animationName}' not found for ${characterId}`);
            console.log(`📋 Available animations: [${availableAnimations.join(', ')}]`);
            return false;
        }
        
        try {
            animationState.setAnimation(0, animationName, loop);
            console.log(`🎭 Playing animation: ${animationName} (loop: ${loop})`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to play animation ${animationName}:`, error);
            return false;
        }
    }

    /**
     * キャラクター削除・リソース解放
     */
    removeCharacter(characterId) {
        const character = this.activeRenderers.get(characterId);
        if (!character) return;
        
        console.log(`🗑️ Removing character: ${character.name}`);
        
        try {
            // WebGLリソース解放
            if (character.renderer && character.renderer.dispose) {
                character.renderer.dispose();
            }
            
            // Canvas削除
            if (character.canvas && character.canvas.parentNode) {
                character.canvas.parentNode.removeChild(character.canvas);
            }
            
            // 登録解除
            this.activeRenderers.delete(characterId);
            
            console.log(`✅ Character removed: ${character.name}`);
            
        } catch (error) {
            console.error(`❌ Error removing character ${characterId}:`, error);
        }
    }

    /**
     * 全キャラクター削除
     */
    dispose() {
        console.log('🧹 Disposing all characters...');
        
        const characterIds = Array.from(this.activeRenderers.keys());
        for (const id of characterIds) {
            this.removeCharacter(id);
        }
        
        this.activeRenderers.clear();
        this.initialized = false;
        
        console.log('✅ SpineWebGLRenderer disposed');
    }

    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            initialized: this.initialized,
            activeCharacters: this.activeRenderers.size,
            spineVersion: this.spineVersion,
            characters: Array.from(this.activeRenderers.entries()).map(([id, char]) => ({
                id: id,
                name: char.name,
                type: char.type || 'spine',
                animations: char.availableAnimations || []
            }))
        };
    }

    /**
     * グローバル関数として公開
     */
    exposeGlobalFunctions() {
        // デバッグ用グローバル関数
        window.spineWebGLRenderer = this;
        
        window.playSpineAnimation = (characterId, animationName, loop = true) => {
            return this.playAnimation(characterId, animationName, loop);
        };
        
        window.getSpineDebugInfo = () => {
            return this.getDebugInfo();
        };
        
        window.removeSpineCharacter = (characterId) => {
            this.removeCharacter(characterId);
        };
        
        console.log('🌐 Global functions exposed:');
        console.log('  - window.spineWebGLRenderer');
        console.log('  - window.playSpineAnimation(id, animName, loop)');
        console.log('  - window.getSpineDebugInfo()');
        console.log('  - window.removeSpineCharacter(id)');
    }
}

// モジュールエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpineWebGLRenderer;
}

// グローバル公開（ブラウザ環境）
if (typeof window !== 'undefined') {
    window.SpineWebGLRenderer = SpineWebGLRenderer;
    
    // 自動初期化（オプション）
    window.addEventListener('DOMContentLoaded', async () => {
        if (!window.spineWebGLRenderer) {
            window.spineWebGLRenderer = new SpineWebGLRenderer();
            await window.spineWebGLRenderer.initialize();
            window.spineWebGLRenderer.exposeGlobalFunctions();
        }
    });
}

console.log('📦 SpineWebGLRenderer module loaded');