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
     * 新配置システムとの統合
     */
    async integrateWithPositioningSystem(canvas, name) {
        try {
            // 配置システムが利用可能かチェック
            if (typeof window.canvasPositioning === 'undefined') {
                console.log('⚠️ 新配置システム未利用可能、従来方式で配置');
                return this.fallbackPositioning(canvas, name);
            }

            // JSON設定の読み込み
            const configLoaded = await window.canvasPositioning.loadConfig('./assets/spine/positioning/placement-config.json');
            if (!configLoaded) {
                console.log('⚠️ JSON設定読み込み失敗、従来方式で配置');
                return this.fallbackPositioning(canvas, name);
            }

            // 配置IDの決定（キャラクター名に基づく）
            const placementId = this.getPlacementId(name);
            
            // 新配置システムで配置実行
            const success = window.canvasPositioning.placeCanvas(canvas, placementId);
            if (success) {
                console.log('✅ 新配置システムで配置完了:', placementId);
                
                // グローバル調整機能の公開
                window.canvasPositioning.exposeGlobalFunctions();
                
                return true;
            } else {
                console.log('⚠️ 新配置システムで配置失敗、従来方式で配置');
                return this.fallbackPositioning(canvas, name);
            }

        } catch (error) {
            console.error('❌ 新配置システム統合エラー:', error);
            console.log('⚠️ 従来方式で配置');
            return this.fallbackPositioning(canvas, name);
        }
    }

    /**
     * 配置IDの決定ロジック
     */
    getPlacementId(characterName) {
        // キャラクター名とシーンに基づいて配置IDを決定
        const scene = 'hero'; // 現在はヒーローセクションのみ
        return `${scene}-${characterName}`;
    }

    /**
     * 従来方式での配置（フォールバック）
     */
    fallbackPositioning(canvas, name) {
        console.log('🔄 従来配置システムを使用...');
        
        // .background-containerに配置（シンプル構造適用）
        const backgroundContainer = document.querySelector('.background-container');
        if (backgroundContainer) {
            backgroundContainer.appendChild(canvas);
            console.log('📍 Canvas配置: .background-container内に配置（成功パターン適用）');
        } else {
            // フォールバック: .hero内に配置
            const heroSection = document.querySelector('.hero');
            if (heroSection) {
                heroSection.appendChild(canvas);
                console.log('⚠️ .background-containerが見つからないため、.hero内に配置');
            } else {
                document.body.appendChild(canvas);
                console.log('⚠️ コンテナが見つからないため、bodyに配置');
            }
        }
        
        // CSS制御による位置設定
        canvas.style.position = 'absolute';
        canvas.style.left = '20%';
        canvas.style.top = '70%';
        canvas.style.transform = 'translate(-50%, -50%)';
        canvas.style.zIndex = '10';
        
        console.log('📍 従来CSS設定適用: left: 20%, top: 70%');
        return true;
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
            canvas.width = 400;  // 適切なサイズに調整
            canvas.height = 400;
            // CSS基準配置用のdata属性を追加
            canvas.setAttribute('data-spine-character', name);
            // CSS制御モード：JavaScript側はstyleを一切設定しない
            console.log('🎨 CSS制御モード：Canvas styleはCSS側で完全制御');

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
            
            // Matrix4は直接spineから取得（Y軸反転対応）
            const mvp = new spine.Matrix4();
            mvp.ortho2d(0, 0, canvas.width, canvas.height);
            console.log('✅ DEBUG: Matrix4 created');
            console.log('📐 DEBUG: Projection matrix setup:');
            console.log('  - Canvas size:', canvas.width, 'x', canvas.height);
            console.log('  - Ortho2D bounds: (0,0) to (', canvas.width, ',', canvas.height, ')');
            console.log('  - Matrix values:', mvp.values);
            
            // 追加：もしY軸が問題なら、異なる座標も試してみる準備
            console.log('🧪 DEBUG: Testing different coordinate systems...');
            
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
            
            // テクスチャ詳細確認
            if (atlas.pages && atlas.pages.length > 0) {
                console.log('🖼️ DEBUG: Atlas page details:');
                atlas.pages.forEach((page, index) => {
                    console.log(`  Page ${index}:`, page);
                    console.log(`  - Name: ${page.name}`);
                    console.log(`  - Texture: ${page.texture}`);
                    console.log(`  - Width: ${page.width}, Height: ${page.height}`);
                });
            }
            
            if (atlas.regions && atlas.regions.length > 0) {
                console.log('🗂️ DEBUG: Atlas regions:');
                atlas.regions.forEach((region, index) => {
                    if (index < 3) { // 最初の3つのみ表示
                        console.log(`  Region ${index}: ${region.name}`);
                    }
                });
            }
            
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
            
            // スロットとアタッチメントの詳細確認
            console.log('🎪 DEBUG: Skeleton slot details:');
            if (skeleton.slots && skeleton.slots.length > 0) {
                skeleton.slots.forEach((slot, index) => {
                    console.log(`  Slot ${index}: ${slot.data.name}`);
                    console.log(`    - Attachment: ${slot.attachment?.name || 'none'}`);
                    console.log(`    - Color: r=${slot.color?.r || 'N/A'}, g=${slot.color?.g || 'N/A'}, b=${slot.color?.b || 'N/A'}, a=${slot.color?.a || 'N/A'}`);
                });
            }
            
            const animationState = new spine.AnimationState(new spine.AnimationStateData(skeleton.data));
            console.log('🎭 DEBUG: AnimationState created');

            // レスポンシブ座標システムによる位置設定
            // 座標変換ユーティリティを使用して適切な位置を計算
            console.log('📍 レスポンシブ座標システムによる位置設定を適用...');
            
            // 一時的に最適化された位置を設定（後でレスポンシブシステムが上書き）
            skeleton.x = 100;   // お店の上に配置
            skeleton.y = -120;  // 適切な高さ
            skeleton.scaleX = skeleton.scaleY = 0.8; // 適切なサイズ
            console.log('📍 一時的な位置設定:');
            console.log('  - Skeleton x:', skeleton.x);
            console.log('  - Skeleton y:', skeleton.y); 
            console.log('  - Scale:', skeleton.scaleX);
            
            // Skeletonの初期状態を設定
            skeleton.setToSetupPose();
            skeleton.updateWorldTransform();
            console.log('⚙️ DEBUG: Skeleton setup pose applied and world transform updated');

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
            
            // Spineアップグレード完了をマネージャーに通知
            console.log('🔄 Spineアップグレード完了、レスポンシブハンドラーを更新...');
            
            // 新配置システムの統合実行
            console.log('🎯 新配置システム統合開始...');
            await this.integrateWithPositioningSystem(canvas, name);
            
            console.log('🎯 CSS基準配置: 背景画像と同じ.hero基準で位置固定');
            
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

            // リアルタイム調整機能をグローバルに登録
            window.adjustPurattokun = function(x, y, scale) {
                if (skeleton) {
                    skeleton.x = x;
                    skeleton.y = y;
                    if (scale !== undefined) {
                        skeleton.scaleX = skeleton.scaleY = scale;
                    }
                    console.log(`🎯 位置調整: (${x}, ${y})${scale !== undefined ? `, スケール: ${scale}` : ''}`);
                    console.log('💡 良い位置が見つかったら座標をメモしてください');
                } else {
                    console.log('❌ スケルトンが見つかりません');
                }
            };
            
            window.getPurattokunsettings = function() {
                if (skeleton) {
                    console.log('📍 現在の設定:');
                    console.log(`  位置: (${skeleton.x}, ${skeleton.y})`);
                    console.log(`  スケール: ${skeleton.scaleX}`);
                    return {
                        x: skeleton.x,
                        y: skeleton.y,
                        scale: skeleton.scaleX
                    };
                }
            };
            
            // Canvas位置調整機能（.hero基準%対応版）
            window.adjustCanvas = function(xPercent, yPercent) {
                if (canvas) {
                    canvas.style.left = `${xPercent}%`;
                    canvas.style.top = `${yPercent}%`;
                    console.log(`🖼️ Canvas位置調整: ${xPercent}%, ${yPercent}% (.hero基準)`);
                    console.log('💡 良い位置が見つかったらCSS styles.css を更新:');
                    console.log(`   left: ${xPercent}%; top: ${yPercent}%;`);
                } else {
                    console.error('❌ Canvas要素が見つかりません');
                }
            };
            
            // 背景画像との位置確認用
            window.testBackgroundAlignment = function() {
                const heroRect = document.querySelector('.hero').getBoundingClientRect();
                const canvasRect = canvas.getBoundingClientRect();
                console.log('📐 背景画像と位置関係:');
                console.log('  Hero section:', { 
                    width: heroRect.width, 
                    height: heroRect.height, 
                    top: heroRect.top, 
                    left: heroRect.left 
                });
                console.log('  Canvas:', { 
                    width: canvasRect.width, 
                    height: canvasRect.height, 
                    top: canvasRect.top, 
                    left: canvasRect.left 
                });
                console.log('  相対位置:', {
                    xPercent: ((canvasRect.left - heroRect.left) / heroRect.width * 100).toFixed(1) + '%',
                    yPercent: ((canvasRect.top - heroRect.top) / heroRect.height * 100).toFixed(1) + '%'
                });
            };
            
            console.log('🛠️ 調整機能が利用可能になりました:');
            console.log('【新配置システム】');
            console.log('  adjustCanvasPosition("hero-purattokun", "25%", "65%") - 新システムで位置調整');
            console.log('  getCanvasPlacement("hero-purattokun") - 配置情報確認');
            console.log('  getAllCanvasPlacements() - 全配置情報確認');
            console.log('【従来システム（互換性）】');
            console.log('  adjustPurattokun(x, y, scale) - Spine内の位置とサイズを調整');
            console.log('  adjustCanvas(xPercent, yPercent) - Canvas位置を直接調整');
            console.log('  testBackgroundAlignment() - 背景画像との位置関係を確認');
            console.log('  getPurattokunsettings() - 現在の設定を確認');
            
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

                // 透明背景で自然な表示
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);

                // カメラ設定の詳細ログ
                renderer.camera.position.x = 0;
                renderer.camera.position.y = 0;
                renderer.camera.viewportWidth = canvas.width;
                renderer.camera.viewportHeight = canvas.height;
                renderer.camera.update();
                
                if (frameCount === 1) {
                    console.log('📹 DEBUG: Camera settings:');
                    console.log('  - Position:', renderer.camera.position.x, renderer.camera.position.y);
                    console.log('  - Viewport:', renderer.camera.viewportWidth, 'x', renderer.camera.viewportHeight);
                    console.log('  - Projection matrix:', renderer.camera.projectionView?.values || 'N/A');
                }

                renderer.begin();
                renderer.drawSkeleton(skeleton);
                renderer.end();
                
                // デバッグ用赤い点は削除（最適化完了）

                // WebGLエラーチェック
                const glError = gl.getError();
                if (glError !== gl.NO_ERROR && frameCount <= 5) {
                    console.error(`❌ DEBUG: WebGL error in frame ${frameCount}:`, glError);
                }

                if (frameCount === 5) {
                    console.log('✅ DEBUG: First 5 frames rendered successfully');
                    console.log('🎨 DEBUG: Checking Skeleton render state:');
                    skeleton.slots.forEach((slot, index) => {
                        if (slot.attachment) {
                            console.log(`  Slot ${index} (${slot.data.name}): ${slot.attachment.name} - visible`);
                        } else {
                            console.log(`  Slot ${index} (${slot.data.name}): no attachment`);
                        }
                    });
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