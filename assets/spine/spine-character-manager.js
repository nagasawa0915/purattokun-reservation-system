/**
 * Spine キャラクター管理システム
 * キャラクターの読み込み、管理、アニメーション制御を担当
 */

class SpineCharacterManager {
    constructor() {
        this.characters = new Map();
        this.initialized = false;
    }

    /**
     * Spineランタイムの初期化
     */
    async init() {
        // CDNからの読み込み待機（待機時間を延長）
        let attempts = 0;
        const maxAttempts = 100; // 10秒間待機（延長）
        
        log(LogLevel.INFO, 'initialization', 'Waiting for Spine WebGL CDN to load...');
        
        while (typeof spine === 'undefined' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
            if (attempts % 10 === 0) {
                log(LogLevel.DEBUG, 'initialization', `CDN loading attempt ${attempts}/${maxAttempts}...`);
            }
        }
        
        if (typeof spine === 'undefined') {
            log(LogLevel.ERROR, 'initialization', 'Spine WebGL runtime not loaded from CDN after 10 seconds');
            log(LogLevel.ERROR, 'initialization', 'Check browser Network tab for CDN loading issues');
            return false;
        }

        try {
            this.initialized = true;
            
            log(LogLevel.INFO, 'initialization', '=== Spine Runtime バージョン詳細確認 ===');
            log(LogLevel.INFO, 'initialization', 'Spine WebGL 4.1.* initialized successfully from CDN');
            
            // Runtime情報の詳細ログ（新しいログシステムに移行予定）
            console.log('📋 Spine Runtime Information:');
            console.log('  - Spine object type:', typeof spine);
            console.log('  - Spine constructor:', spine.constructor?.name || 'N/A');
            console.log('  - Spine object keys:', Object.keys(spine));
            console.log('  - Spine webgl exists:', !!spine.webgl);
            
            if (spine.webgl) {
                console.log('  - WebGL object keys:', Object.keys(spine.webgl));
            } else {
                console.log('  - ❌ spine.webgl is missing - this is the root problem!');
            }
            
            return true;
        } catch (error) {
            log(LogLevel.ERROR, 'initialization', 'Failed to initialize Spine WebGL:', error);
            return false;
        }
    }

    /**
     * キャラクターを読み込み
     * @param {string} name - キャラクター名
     * @param {string} basePath - ファイルパス
     * @param {HTMLElement} container - 配置先コンテナ
     */
    async loadCharacter(name, basePath, container) {
        console.log('📥 DEBUG: loadCharacter called for', name, 'from', basePath);
        console.log('📥 DEBUG: this.initialized =', this.initialized);
        
        log(LogLevel.INFO, 'animation', `Starting character load: ${name} from ${basePath}`);
        
        if (!this.initialized) {
            console.log('⚠️ DEBUG: Spine not initialized, using placeholder mode');
            log(LogLevel.WARN, 'animation', 'Spine not initialized, using placeholder mode');
            return this.createPlaceholderCharacter(name, basePath, container);
        }

        // CORS/file:// プロトコル検出
        const isFileProtocol = window.location.protocol === 'file:';
        if (isFileProtocol) {
            log(LogLevel.WARN, 'initialization', 'File protocol detected. Spine WebGL requires HTTP server.');
            log(LogLevel.INFO, 'initialization', 'Please run: python -m http.server 8000');
            log(LogLevel.INFO, 'initialization', 'Using placeholder mode for now');
            return this.createPlaceholderCharacter(name, basePath, container);
        }

        // まずプレースホルダーを作成して即座に登録（アニメーション呼び出しエラーを防ぐ）
        const placeholderChar = this.createPlaceholderCharacter(name, basePath, container);
        log(LogLevel.DEBUG, 'animation', `Placeholder created for ${name}, attempting Spine upgrade...`);

        // 非同期でSpine WebGL化を試行
        console.log('🔄 DEBUG: Starting upgrade timer for', name);
        setTimeout(async () => {
            console.log('🔄 DEBUG: Upgrade timer triggered for', name);
            try {
                console.log('🔄 DEBUG: Calling upgradeToSpineWebGL for', name);
                await this.upgradeToSpineWebGL(name, basePath, container);
                console.log('✅ DEBUG: upgradeToSpineWebGL completed for', name);
            } catch (error) {
                console.error('❌ DEBUG: Spine upgrade failed for', name, ':', error.message);
                log(LogLevel.DEBUG, 'animation', `Spine upgrade failed for ${name}, keeping placeholder: ${error.message}`);
            }
        }, 100);

        return placeholderChar;
    }

    /**
     * プレースホルダーキャラクター作成
     */
    createPlaceholderCharacter(name, basePath, container) {
        log(LogLevel.DEBUG, 'animation', `Creating placeholder for ${name}`);
        
        const character = {
            name: name,
            type: 'placeholder',
            element: this.createPlaceholderElement(name)
        };
        
        // コンテナに追加
        if (container) {
            container.appendChild(character.element);
        } else {
            document.body.appendChild(character.element);
        }
        
        this.characters.set(name, character);
        return character;
    }

    /**
     * プレースホルダーDOM要素作成
     */
    createPlaceholderElement(name) {
        const element = document.createElement('div');
        element.innerHTML = '🐱';
        element.setAttribute('data-character', name);
        element.style.cssText = `
            position: absolute;
            font-size: 40px;
            opacity: 0.7;
            animation: placeholderFloat 3s ease-in-out infinite;
            pointer-events: none;
            z-index: 10;
        `;
        
        return element;
    }

    /**
     * プレースホルダーからSpine WebGLにアップグレード
     */
    async upgradeToSpineWebGL(name, basePath, container) {
        console.log('🚀 DEBUG: upgradeToSpineWebGL called for', name, 'from', basePath);
        console.log('🚀 DEBUG: spine object available:', typeof spine !== 'undefined');
        console.log('🚀 DEBUG: spine object:', spine);
        
        if (typeof spine === 'undefined') {
            console.error('❌ DEBUG: Spine runtime not available!');
            throw new Error('Spine runtime not available');
        }

        console.log('✅ DEBUG: Spine runtime is available, proceeding...');
        console.log('🔍 DEBUG: spine object structure:', Object.keys(spine));
        console.log('🔍 DEBUG: spine.webgl exists:', !!spine.webgl);
        if (spine.webgl) {
            console.log('🔍 DEBUG: spine.webgl keys:', Object.keys(spine.webgl));
        }
        console.log('🔍 DEBUG: Matrix4 available at:', typeof spine.Matrix4, typeof spine.webgl?.Matrix4);
        
        log(LogLevel.INFO, 'animation', `Upgrading ${name} to Spine WebGL...`);

        try {
            // Canvas要素作成
            const canvas = document.createElement('canvas');
            canvas.width = 600;
            canvas.height = 500;
            canvas.style.cssText = `
                position: absolute;
                pointer-events: auto;
                z-index: 1;
            `;

            // WebGL Context取得
            const gl = canvas.getContext('webgl', { 
                alpha: true, 
                premultipliedAlpha: false 
            });
            
            if (!gl) {
                throw new Error('WebGL context creation failed');
            }

            log(LogLevel.DEBUG, 'animation', 'WebGL context created successfully');

            // Spine WebGL初期化 (4.1.*正しいAPI)
            console.log('🔧 DEBUG: Creating Spine WebGL components...');
            
            // Matrix4は直接spineから取得
            const mvp = new spine.Matrix4();
            mvp.ortho2d(0, 0, canvas.width, canvas.height);
            console.log('✅ DEBUG: Matrix4 created');
            console.log('📐 DEBUG: Projection matrix setup:');
            console.log('  - Canvas size:', canvas.width, 'x', canvas.height);
            console.log('  - Ortho2D bounds: (0,0) to (', canvas.width, ',', canvas.height, ')');
            console.log('  - Matrix values:', mvp.values);
            
            const context = new spine.ManagedWebGLRenderingContext(gl);
            console.log('✅ DEBUG: ManagedWebGLRenderingContext created');
            
            const renderer = new spine.SceneRenderer(canvas, context);
            console.log('✅ DEBUG: SceneRenderer created');
            
            const assetManager = new spine.AssetManager(context);
            console.log('✅ DEBUG: AssetManager created');

            // アセット読み込み
            const atlasPath = `${basePath}${name}.atlas`;
            const jsonPath = `${basePath}${name}.json`;
            const imagePath = `${basePath}${name}.png`;

            console.log('📁 DEBUG: Loading assets:');
            console.log('  - Atlas:', atlasPath);
            console.log('  - JSON:', jsonPath);
            console.log('  - Image:', imagePath);

            assetManager.loadTextureAtlas(atlasPath);
            assetManager.loadText(jsonPath);
            assetManager.loadTexture(imagePath);

            console.log('⏳ DEBUG: Waiting for asset loading...');
            // 読み込み完了まで待機
            await this.waitForAssetLoading(assetManager);
            console.log('✅ DEBUG: All assets loaded successfully');

            // Skeleton作成
            console.log('🦴 DEBUG: Creating Skeleton...');
            const atlas = assetManager.require(atlasPath);
            console.log('📖 DEBUG: Atlas loaded:', atlas);
            console.log('📖 DEBUG: Atlas pages:', atlas.pages?.length || 'unknown');
            console.log('📖 DEBUG: Atlas regions:', atlas.regions?.length || 'unknown');
            
            const skeletonJson = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(atlas));
            console.log('🔧 DEBUG: SkeletonJson created');
            
            const skeletonData = skeletonJson.readSkeletonData(assetManager.require(jsonPath));
            console.log('📊 DEBUG: SkeletonData created');
            console.log('📊 DEBUG: Bones count:', skeletonData.bones?.length || 'unknown');
            console.log('📊 DEBUG: Slots count:', skeletonData.slots?.length || 'unknown');
            console.log('📊 DEBUG: Animations:', skeletonData.animations?.map(a => a.name) || 'unknown');
            
            const skeleton = new spine.Skeleton(skeletonData);
            console.log('🦴 DEBUG: Skeleton instance created');
            console.log('🦴 DEBUG: Skeleton bones:', skeleton.bones?.length || 'unknown');
            console.log('🦴 DEBUG: Skeleton slots:', skeleton.slots?.length || 'unknown');
            
            const animationState = new spine.AnimationState(new spine.AnimationStateData(skeleton.data));
            console.log('🎭 DEBUG: AnimationState created');

            // 位置設定
            skeleton.x = canvas.width / 2;
            skeleton.y = canvas.height - 50;
            skeleton.scaleX = skeleton.scaleY = 0.5;
            console.log('📍 DEBUG: Skeleton position set:');
            console.log('  - x:', skeleton.x);
            console.log('  - y:', skeleton.y);
            console.log('  - scaleX:', skeleton.scaleX);
            console.log('  - scaleY:', skeleton.scaleY);

            // キャラクター登録
            const character = {
                name: name,
                type: 'spine',
                canvas: canvas,
                skeleton: skeleton,
                animationState: animationState,
                renderer: renderer,
                mvp: mvp
            };

            this.characters.set(name, character);

            // DOM配置 - 位置を明示的に設定
            canvas.style.left = '100px';
            canvas.style.top = '100px';
            canvas.style.border = '2px solid red'; // デバッグ用の境界線
            document.body.appendChild(canvas);
            console.log('✅ DEBUG: Canvas added to DOM with red border for visibility');
            
            // Canvas配置の詳細確認
            setTimeout(() => {
                console.log('🖼️ DEBUG: Canvas position verification:');
                console.log('  - Canvas width:', canvas.width, 'height:', canvas.height);
                console.log('  - Canvas style width:', canvas.style.width, 'height:', canvas.style.height);
                console.log('  - Canvas offset:', { left: canvas.offsetLeft, top: canvas.offsetTop });
                console.log('  - Canvas client size:', { width: canvas.clientWidth, height: canvas.clientHeight });
                console.log('  - Canvas in DOM:', document.body.contains(canvas));
                console.log('  - WebGL context size:', gl.drawingBufferWidth, 'x', gl.drawingBufferHeight);
            }, 100);

            // 既存プレースホルダーを削除
            const placeholder = document.querySelector(`[data-character="${name}"]`);
            if (placeholder) {
                console.log('🗑️ DEBUG: Removing placeholder:', placeholder);
                placeholder.remove();
            } else {
                console.log('⚠️ DEBUG: Placeholder not found for removal');
            }

            // アニメーションループ開始
            this.startRenderLoop(name);

            log(LogLevel.INFO, 'animation', `${name} successfully upgraded to Spine WebGL`);
            return character;

        } catch (error) {
            log(LogLevel.ERROR, 'animation', `Spine WebGL upgrade failed for ${name}:`, error.message);
            throw error;
        }
    }

    /**
     * アセット読み込み完了待機
     */
    async waitForAssetLoading(assetManager) {
        return new Promise((resolve, reject) => {
            const checkLoading = () => {
                if (assetManager.isLoadingComplete()) {
                    if (assetManager.hasErrors()) {
                        reject(new Error('Asset loading errors occurred'));
                    } else {
                        resolve();
                    }
                } else {
                    setTimeout(checkLoading, 100);
                }
            };
            checkLoading();
        });
    }

    /**
     * Spineレンダリングループ開始
     */
    startRenderLoop(name) {
        const character = this.characters.get(name);
        if (!character || character.type !== 'spine') return;

        console.log('🎬 DEBUG: Starting render loop for', name);
        console.log('🎬 DEBUG: Character type:', character.type);
        console.log('🎬 DEBUG: Canvas exists:', !!character.canvas);
        console.log('🎬 DEBUG: Skeleton exists:', !!character.skeleton);
        console.log('🎬 DEBUG: AnimationState exists:', !!character.animationState);
        console.log('🎬 DEBUG: Renderer exists:', !!character.renderer);

        let frameCount = 0;
        const render = () => {
            if (!character.canvas.parentNode) {
                console.log('❌ DEBUG: Canvas not in DOM, stopping render loop');
                return; // DOM削除時は停止
            }

            frameCount++;
            if (frameCount <= 5 || frameCount % 60 === 0) {
                console.log(`🎬 DEBUG: Rendering frame ${frameCount} for ${name}`);
            }

            const { skeleton, animationState, renderer, mvp, canvas } = character;
            const gl = canvas.getContext('webgl');
            
            if (!gl) {
                console.error('❌ DEBUG: No WebGL context in render loop');
                return;
            }

            try {
                animationState.update(0.016); // 60fps
                animationState.apply(skeleton);
                skeleton.updateWorldTransform();

                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);

                renderer.camera.position.x = 0;
                renderer.camera.position.y = 0;
                renderer.camera.viewportWidth = canvas.width;
                renderer.camera.viewportHeight = canvas.height;
                renderer.camera.update();

                renderer.begin();
                renderer.drawSkeleton(skeleton);
                renderer.end();

                if (frameCount === 5) {
                    console.log('✅ DEBUG: First 5 frames rendered successfully');
                }

            } catch (error) {
                console.error('❌ DEBUG: Render loop error:', error);
                return;
            }

            requestAnimationFrame(render);
        };

        // 初期アニメーション設定
        if (character.skeleton.data.animations.length > 0) {
            const animName = character.skeleton.data.animations[0].name;
            console.log(`🎭 DEBUG: Setting initial animation: ${animName}`);
            character.animationState.setAnimation(0, animName, true);
        } else {
            console.log('⚠️ DEBUG: No animations found in skeleton data');
        }

        console.log('🚀 DEBUG: Starting animation frame requests');
        render();
    }

    /**
     * キャラクターの位置設定
     */
    setPosition(name, x, y) {
        const character = this.characters.get(name);
        if (!character) {
            log(LogLevel.WARN, 'position', `Character ${name} not found for position setting`);
            return;
        }

        log(LogLevel.DEBUG, 'position', `Setting position for ${name}: (${x}, ${y})`);
        
        if (character.type === 'placeholder') {
            character.element.style.left = x + 'px';
            character.element.style.top = y + 'px';
        } else {
            // Spine WebGL character position setting
            // Implementation pending
        }
    }

    /**
     * アニメーション再生
     */
    playSequenceAnimation(name, animationName = 'default') {
        const character = this.characters.get(name);
        if (!character) {
            log(LogLevel.WARN, 'animation', `Character ${name} not found for animation`);
            return;
        }

        log(LogLevel.DEBUG, 'animation', `Playing animation ${animationName} for ${name}`);
        
        if (character.type === 'placeholder') {
            // プレースホルダーアニメーション
            character.element.style.animation = 'placeholderFloat 2s ease-in-out infinite';
        } else {
            // Spine WebGL animation
            // Implementation pending
        }
    }

}