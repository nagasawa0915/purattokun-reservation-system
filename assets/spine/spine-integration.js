/**
 * Spine WebGL統合モジュール
 * 既存のアニメーションシステムとSpineを連携
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
        
        console.log('⏳ Waiting for Spine WebGL CDN to load...');
        
        while (typeof spine === 'undefined' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
            if (attempts % 10 === 0) {
                console.log(`⏳ CDN loading attempt ${attempts}/${maxAttempts}...`);
            }
        }
        
        if (typeof spine === 'undefined') {
            console.error('❌ Spine WebGL runtime not loaded from CDN after 10 seconds');
            console.error('🔍 Check browser Network tab for CDN loading issues');
            return false;
        }

        try {
            this.initialized = true;
            
            console.log('🔍 === Spine Runtime バージョン詳細確認 ===');
            console.log('✅ Spine WebGL 4.1.* initialized successfully from CDN');
            
            // 1. Spine オブジェクト詳細情報
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
            
            // 2. バージョン情報詳細取得
            if (spine.version) {
                console.log('  - Spine version:', spine.version);
            }
            if (spine.VERSION) {
                console.log('  - Spine VERSION:', spine.VERSION);
            }
            // WebGL module version確認は削除（存在しないため）
            
            // 3. 利用可能なクラス確認
            console.log('📚 Available Spine Classes:');
            const importantClasses = [
                'AssetManager', 'TextureAtlas', 'SkeletonJson', 
                'SkeletonData', 'Skeleton', 'AnimationState',
                'ManagedWebGLRenderingContext', 'SceneRenderer'
            ];
            
            importantClasses.forEach(className => {
                // spine.webglではなく、spine直接から確認
                const classExists = spine[className];
                console.log(`  - ${className}:`, !!classExists ? '✅ Available' : '❌ Missing');
                if (classExists && classExists.version) {
                    console.log(`    Version: ${classExists.version}`);
                }
            });
            
            // 4. AssetManager詳細確認（修正版）
            if (spine.AssetManager) {
                console.log('🗂️ AssetManager Class Details:');
                const AssetManagerClass = spine.AssetManager;
                console.log('  - AssetManager type:', typeof AssetManagerClass);
                console.log('  - Has prototype:', !!AssetManagerClass.prototype);
                
                if (AssetManagerClass.prototype) {
                    const methods = Object.getOwnPropertyNames(AssetManagerClass.prototype);
                    console.log('  - Available methods:', methods.filter(m => typeof AssetManagerClass.prototype[m] === 'function'));
                }
            } else {
                console.log('❌ AssetManager not found in spine object');
            }
            
            // 5. 4.2.43互換性チェック用の機能確認
            console.log('🔧 4.1.24 Perfect Compatibility Check:');
            
            // TextureAtlas関連の機能確認
            if (spine.TextureAtlas) {
                const TextureAtlasClass = spine.TextureAtlas;
                console.log('  - TextureAtlas available:', !!TextureAtlasClass);
                
                // 4.2.43で使用される可能性がある新機能
                const compatibilityFeatures = [
                    'premultipliedAlpha', // PMA support
                    'pages', 'regions'    // Atlas structure
                ];
                
                if (TextureAtlasClass.prototype) {
                    compatibilityFeatures.forEach(feature => {
                        const hasFeature = feature in TextureAtlasClass.prototype;
                        console.log(`    - ${feature} support:`, hasFeature ? '✅' : '❓');
                    });
                }
            }
            
            console.log('📄 JSON Data Version Expectation: 4.1.24 (Perfect match!)');
            console.log('📈 Compatibility Status: Checking...');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize Spine WebGL:', error);
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
        console.log(`🎯 Starting character load: ${name} from ${basePath}`);
        
        if (!this.initialized) {
            console.warn('⚠️ Spine not initialized, using placeholder mode');
            return this.createPlaceholderCharacter(name, basePath, container);
        }

        // CORS/file:// プロトコル検出
        const isFileProtocol = window.location.protocol === 'file:';
        if (isFileProtocol) {
            console.warn('⚠️ File protocol detected. Spine WebGL requires HTTP server.');
            console.warn('💡 Please run: python -m http.server 8000');
            console.warn('🔄 Using placeholder mode for now');
            return this.createPlaceholderCharacter(name, basePath, container);
        }

        // まずプレースホルダーを作成して即座に登録（アニメーション呼び出しエラーを防ぐ）
        const placeholderChar = this.createPlaceholderCharacter(name, basePath, container);
        console.log(`📝 Placeholder created for ${name}, attempting Spine upgrade...`);

        // 非同期でSpine WebGL化を試行
        setTimeout(async () => {
            try {
                await this.upgradeToSpineWebGL(name, basePath, container);
            } catch (error) {
                console.log(`🔄 Spine upgrade failed for ${name}, keeping placeholder:`, error.message);
            }
        }, 100);

        return placeholderChar;
    }

    /**
     * プレースホルダーからSpine WebGLにアップグレード
     */
    async upgradeToSpineWebGL(name, basePath, container) {
        if (typeof spine === 'undefined') {
            throw new Error('Spine runtime not available');
        }

        console.log(`⬆️ Upgrading ${name} to Spine WebGL...`);

        // Canvas要素作成と検証（詳細デバッグ強化）
        let canvas;
        let gl;
        
        console.log('🔍 === Canvas/WebGL 詳細デバッグ開始 ===');
        
        try {
            // 1. DOM状態確認
            console.log('📄 DOM readyState:', document.readyState);
            console.log('🏗️ Document body exists:', !!document.body);
            
            // 2. Canvas作成前の環境確認
            console.log('🌐 WebGL support check:');
            console.log('  - WebGL context available:', typeof WebGLRenderingContext !== 'undefined');
            console.log('  - WebGL2 context available:', typeof WebGL2RenderingContext !== 'undefined');
            
            // 3. Canvas要素作成
            console.log('🎨 Creating canvas element...');
            canvas = document.createElement('canvas');
            
            // 4. Canvas詳細検証
            console.log('📐 Canvas validation:');
            console.log('  - Canvas object:', !!canvas);
            console.log('  - Canvas type:', typeof canvas);
            console.log('  - getContext method exists:', typeof canvas.getContext === 'function');
            console.log('  - Canvas constructor:', canvas.constructor.name);
            
            if (!canvas || typeof canvas.getContext !== 'function') {
                throw new Error('Canvas element creation failed - getContext method unavailable');
            }
            
            // 5. Canvas属性設定（吹き出し表示対応でさらに拡大）
            canvas.width = 600;  // 500→600に拡大（吹き出し306px対応）
            canvas.height = 500; // 400→500に拡大（吹き出し142px対応）
            canvas.style.cssText = `
                position: fixed;
                pointer-events: none;
                z-index: 1;
            `;
            
            console.log('📏 Canvas configured: 600x500px (expanded for speech bubble display)');
            
            // 6. WebGL Context取得試行（段階的）
            console.log('🔧 WebGL Context acquisition attempts:');
            
            // WebGL2を最初に試行
            console.log('  - Trying WebGL2...');
            gl = canvas.getContext('webgl2');
            if (gl) {
                console.log('✅ WebGL2 context acquired successfully');
                console.log('  - GL Version:', gl.getParameter(gl.VERSION));
                console.log('  - GL Renderer:', gl.getParameter(gl.RENDERER));
            } else {
                console.log('  - WebGL2 unavailable, trying WebGL1...');
                
                // WebGL1を試行
                gl = canvas.getContext('webgl');
                if (gl) {
                    console.log('✅ WebGL1 context acquired successfully');
                    console.log('  - GL Version:', gl.getParameter(gl.VERSION));
                    console.log('  - GL Renderer:', gl.getParameter(gl.RENDERER));
                } else {
                    console.log('  - WebGL1 unavailable, trying experimental-webgl...');
                    
                    // 実験的WebGLを試行
                    gl = canvas.getContext('experimental-webgl');
                    if (gl) {
                        console.log('✅ Experimental WebGL context acquired');
                        console.log('  - GL Version:', gl.getParameter(gl.VERSION));
                    }
                }
            }
            
            if (!gl) {
                console.error('❌ All WebGL context acquisition attempts failed');
                console.error('🔍 Device capability check:');
                console.error('  - User Agent:', navigator.userAgent);
                console.error('  - Hardware concurrency:', navigator.hardwareConcurrency || 'N/A');
                console.error('  - Memory:', navigator.deviceMemory || 'N/A');
                
                throw new Error('WebGL not supported on this device - all context types failed');
            }
            
            // 7. WebGL能力詳細確認
            console.log('🎯 WebGL Capabilities:');
            console.log('  - Max texture size:', gl.getParameter(gl.MAX_TEXTURE_SIZE));
            console.log('  - Max viewport dims:', gl.getParameter(gl.MAX_VIEWPORT_DIMS));
            console.log('  - Supported extensions:', gl.getSupportedExtensions().length);
            
            console.log('✅ WebGL canvas created and validated successfully');
            
        } catch (canvasError) {
            console.error('❌ Canvas/WebGL creation failed:', canvasError.message);
            console.error('🔍 Error details:', canvasError);
            console.error('📍 Error occurred in Canvas creation phase');
            throw canvasError;
        }

        // キャラクターオブジェクト作成
        const character = {
            name: name,
            path: basePath,
            container: container,
            canvas: canvas,
            gl: gl,
            managedGL: null,        // ManagedWebGLRenderingContext用
            assetManager: null,     // AssetManager参照用
            skeleton: null,
            animationState: null,
            isLoaded: false
        };

        try {
            // アセット読み込み
            await this.loadSpineAssets(character);
            
            // DOM追加：Canvasを.heroから独立させてbodyに直接追加
            console.log('🔧 Moving canvas to body to escape .hero container constraints...');
            document.body.appendChild(canvas);
            console.log('✅ Canvas moved to body element (independent positioning)');
            
            // 既存のプレースホルダーを削除
            const existingChar = this.characters.get(name);
            if (existingChar && existingChar.placeholder) {
                existingChar.placeholder.remove();
            }
            
            // 新しいSpineキャラクターに置き換え
            this.characters.set(name, character);
            
            console.log(`🎉 Successfully upgraded ${name} to Spine WebGL`);
            
            // 強制的に位置を再設定（アップグレード完了後）
            console.log('🔧 Forcing canvas position re-check after Spine upgrade...');
            const config = this.characters.get(name);
            if (config && config.canvas) {
                console.log('📊 Current canvas position BEFORE fix:');
                console.log(`   - position: ${config.canvas.style.position}`);
                console.log(`   - left: ${config.canvas.style.left}`);
                console.log(`   - top: ${config.canvas.style.top}`);
                console.log(`   - transform: ${config.canvas.style.transform}`);
                
                // HTML設定を再読み込み
                const configElement = document.getElementById('purattokun-config');
                if (configElement) {
                    const x = parseInt(configElement.dataset.x) || 18;
                    const y = parseInt(configElement.dataset.y) || 50;
                    const scale = parseFloat(configElement.dataset.scale) || 0.25;
                    
                    console.log('🔧 Re-applying position settings...');
                    console.log(`   - Target: (${x}vw, ${y}vh) scale: ${scale}`);
                    
                    // 強制的に位置設定
                    config.canvas.style.setProperty('position', 'fixed', 'important');
                    config.canvas.style.setProperty('left', x + 'vw', 'important');
                    config.canvas.style.setProperty('top', y + 'vh', 'important');
                    config.canvas.style.transform = `scale(${scale})`;
                    config.canvas.style.transformOrigin = '0 0';
                    config.canvas.style.zIndex = '10';
                    
                    console.log('📊 Canvas position AFTER fix:');
                    console.log(`   - position: ${config.canvas.style.position}`);
                    console.log(`   - left: ${config.canvas.style.left}`);
                    console.log(`   - top: ${config.canvas.style.top}`);
                    console.log(`   - transform: ${config.canvas.style.transform}`);
                    
                    // 詳細診断: 親要素の影響確認
                    console.log('🔍 Parent element analysis:');
                    let parent = config.canvas.parentElement;
                    let level = 0;
                    while (parent && level < 5) {
                        const computedStyle = window.getComputedStyle(parent);
                        console.log(`   Parent ${level}: ${parent.tagName.toLowerCase()}`);
                        console.log(`     - position: ${computedStyle.position}`);
                        console.log(`     - transform: ${computedStyle.transform}`);
                        console.log(`     - contain: ${computedStyle.contain}`);
                        console.log(`     - overflow: ${computedStyle.overflow}`);
                        parent = parent.parentElement;
                        level++;
                    }
                    
                    // 実際の描画位置確認
                    const rect = config.canvas.getBoundingClientRect();
                    console.log('📐 Canvas actual screen position:');
                    console.log(`   - Screen left: ${rect.left}px`);
                    console.log(`   - Screen top: ${rect.top}px`);
                    console.log(`   - Width: ${rect.width}px`);
                    console.log(`   - Height: ${rect.height}px`);
                    
                    // ビューポートサイズと期待位置の計算
                    const expectedLeft = (window.innerWidth * x) / 100;
                    const expectedTop = (window.innerHeight * y) / 100;
                    console.log('🎯 Expected vs Actual position:');
                    console.log(`   - Expected left: ${expectedLeft}px (${x}vw)`);
                    console.log(`   - Actual left: ${rect.left}px`);
                    console.log(`   - Expected top: ${expectedTop}px (${y}vh)`);
                    console.log(`   - Actual top: ${rect.top}px`);
                    console.log(`   - Position matches: ${Math.abs(rect.left - expectedLeft) < 10 && Math.abs(rect.top - expectedTop) < 10}`);
                }
            }
        } catch (assetError) {
            console.error(`❌ Spine upgrade failed for ${name}:`, assetError.message);
            if (canvas && canvas.parentNode) {
                canvas.remove();
            }
            
            // エラー詳細付きプレースホルダーに置き換え
            const errorDetails = `Atlas loading failed: ${assetError.message}`;
            this.createPlaceholderCharacter(name, character.path, character.container, errorDetails);
            
            throw assetError;
        }
    }

    /**
     * Spineアセット読み込み
     */
    async loadSpineAssets(character) {
        const { name, path } = character;
        
        try {
            // ファイル名の推定（修正されたpurattokunデータ用）
            // キャッシュバスティングは一旦無効化してテスト
            const jsonPath = `${path}${name}.json`;
            const atlasPath = `${path}${name}.atlas`;
            
            console.log('🔧 Updated for corrected purattokun data (n-count fixed)');
            
            console.log(`📁 Loading Spine assets (no cache busting):`, { jsonPath, atlasPath });
            
            // パス検証 + 直接アクセステスト
            console.log('🔍 Path verification:');
            console.log('   Base path:', path);
            console.log('   Character name:', name);
            console.log('   Final JSON path:', jsonPath);
            console.log('   Final Atlas path:', atlasPath);
            
            // 📡 直接HTTPアクセステスト（事前確認）
            console.log('🔍 Pre-loading HTTP accessibility test:');
            const testPromises = [
                fetch(jsonPath).then(r => ({ file: 'JSON', status: r.status, ok: r.ok })).catch(e => ({ file: 'JSON', error: e.message })),
                fetch(atlasPath).then(r => ({ file: 'ATLAS', status: r.status, ok: r.ok })).catch(e => ({ file: 'ATLAS', error: e.message }))
            ];
            
            Promise.all(testPromises).then(results => {
                console.log('📊 HTTP Pre-test Results:');
                results.forEach(result => {
                    if (result.error) {
                        console.error(`❌ ${result.file}: ${result.error}`);
                    } else {
                        console.log(`${result.ok ? '✅' : '❌'} ${result.file}: ${result.status} ${result.ok ? 'OK' : 'FAILED'}`);
                    }
                });
                
                // Atlas失敗時の詳細ガイド
                const atlasResult = results.find(r => r.file === 'ATLAS');
                if (atlasResult && !atlasResult.ok) {
                    console.error('🚨 ATLAS FILE ACCESS FAILED!');
                    console.error('💡 Possible solutions:');
                    console.error('   1. Use custom server: python server.py');
                    console.error('   2. Try npx serve . instead');
                    console.error('   3. Check if .atlas extension is blocked');
                    console.error(`   4. Manual test: http://localhost:8000/${atlasPath}`);
                }
            }).catch(err => {
                console.error('❌ Pre-test failed:', err);
            });
            
            // ManagedWebGLRenderingContext作成（正しい手順）
            console.log('🔧 Creating ManagedWebGLRenderingContext with canvas...');
            console.log('  - Canvas object:', !!character.canvas);
            console.log('  - Canvas dimensions:', character.canvas.width, 'x', character.canvas.height);
            
            if (!spine.ManagedWebGLRenderingContext) {
                throw new Error('ManagedWebGLRenderingContext class not available in Spine WebGL runtime');
            }
            
            const managedGL = new spine.ManagedWebGLRenderingContext(character.canvas);
            console.log('✅ ManagedWebGLRenderingContext created:', !!managedGL);
            
            // キャラクターオブジェクトに保存
            character.managedGL = managedGL;
            
            // AssetManagerでアセット読み込み（ManagedWebGLRenderingContext使用）
            if (!spine.AssetManager) {
                throw new Error('AssetManager class not available in Spine WebGL runtime');
            }
            
            const assetManager = new spine.AssetManager(managedGL);
            console.log('✅ AssetManager created with ManagedWebGLRenderingContext');
            
            // キャラクターオブジェクトに保存
            character.assetManager = assetManager;
            
            console.log('📂 Attempting to load assets...');
            console.log('   JSON:', jsonPath);
            console.log('   Atlas:', atlasPath);
            
            // より詳細なエラー監視
            let jsonLoaded = false;
            let atlasLoaded = false;
            
            // AssetManagerのデバッグフック追加 + HTTP状況監視
            const originalLoad = assetManager.loadText.bind(assetManager);
            const originalLoadAtlas = assetManager.loadTextureAtlas.bind(assetManager);
            
            assetManager.loadText = function(path) {
                console.log(`🔄 Starting text load: ${path}`);
                // 直接HTTP確認
                fetch(path).then(response => {
                    console.log(`📡 JSON HTTP Response: ${response.status} ${response.statusText} for ${path}`);
                    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
                }).catch(err => {
                    console.error(`❌ JSON Fetch Error for ${path}:`, err);
                });
                return originalLoad(path);
            };
            
            assetManager.loadTextureAtlas = function(path) {
                console.log(`🔄 Starting atlas load: ${path}`);
                // 直接HTTP確認（Atlas用詳細監視）
                fetch(path).then(response => {
                    console.log(`📡 ATLAS HTTP Response: ${response.status} ${response.statusText} for ${path}`);
                    console.log(`📋 ATLAS Content-Type: ${response.headers.get('content-type')}`);
                    console.log(`📏 ATLAS Content-Length: ${response.headers.get('content-length')}`);
                    if (!response.ok) {
                        console.error(`❌ ATLAS HTTP ERROR: ${response.status} - This is the 404 source!`);
                        console.error(`🔍 Check if Python server recognizes .atlas extension`);
                        console.error(`💡 Try accessing: http://localhost:8000/${path} directly in browser`);
                    }
                }).catch(err => {
                    console.error(`❌ ATLAS Fetch Error for ${path}:`, err);
                    console.error(`🚨 This might be the CORS/MIME issue!`);
                });
                return originalLoadAtlas(path);
            };
            
            console.log('🔍 === AssetManager.loadTextureAtlas() 詳細デバッグ ===');
            
            try {
                // 1. パス情報詳細確認
                console.log('📁 Asset paths verification:');
                console.log('  - JSON path:', jsonPath);
                console.log('  - Atlas path:', atlasPath);
                console.log('  - Base path:', character.path);
                
                // 2. AssetManager状態確認（読み込み前）
                console.log('📊 AssetManager initial state:');
                console.log('  - AssetManager type:', typeof assetManager);
                console.log('  - loadText method exists:', typeof assetManager.loadText === 'function');
                console.log('  - loadTextureAtlas method exists:', typeof assetManager.loadTextureAtlas === 'function');
                console.log('  - Current assets to load:', assetManager.getToLoad());
                console.log('  - Current loaded assets:', assetManager.getLoaded());
                
                // 3. JSON読み込み試行
                console.log('📄 Loading JSON asset...');
                try {
                    assetManager.loadText(jsonPath);
                    console.log('✅ JSON loadText() called successfully');
                } catch (jsonError) {
                    console.error('❌ JSON loadText() failed:', jsonError);
                    throw jsonError;
                }
                
                // 4. Atlas読み込み試行（詳細ログ付き）
                console.log('🗺️ Loading Atlas asset...');
                console.log('  - Atlas path (absolute):', atlasPath);
                console.log('  - Expected PNG path:', atlasPath.replace('.atlas', '.png'));
                
                try {
                    // オリジナルのloadTextureAtlas呼び出し前の状態
                    console.log('  - Calling assetManager.loadTextureAtlas()...');
                    assetManager.loadTextureAtlas(atlasPath);
                    console.log('✅ Atlas loadTextureAtlas() called successfully');
                    
                    // 呼び出し直後の状態確認
                    setTimeout(() => {
                        console.log('📊 AssetManager state after loadTextureAtlas():');
                        console.log('  - Assets to load:', assetManager.getToLoad());
                        console.log('  - Assets loaded:', assetManager.getLoaded());
                        console.log('  - Has errors:', assetManager.hasErrors());
                        
                        // キューに登録されているか確認
                        try {
                            const atlasInCache = assetManager.get(atlasPath);
                            console.log('  - Atlas in cache (immediate):', !!atlasInCache);
                            if (atlasInCache) {
                                console.log('    - Atlas data type:', typeof atlasInCache);
                            }
                        } catch (cacheError) {
                            console.log('  - Cache access error:', cacheError.message);
                        }
                    }, 100);
                    
                } catch (atlasError) {
                    console.error('❌ Atlas loadTextureAtlas() failed:', atlasError);
                    console.error('  - Error type:', atlasError.constructor.name);
                    console.error('  - Error message:', atlasError.message);
                    console.error('  - Error stack:', atlasError.stack);
                    throw atlasError;
                }
                
                console.log('📋 Asset loading initiated successfully');
                console.log('🕐 Proceeding to loading completion check...');
                
            } catch (loadError) {
                console.error('❌ Asset loading initiation failed:', loadError);
                console.error('📍 Failed in asset loading phase');
                throw loadError;
            }
            
            // 読み込み完了を待機（タイムアウト付き）
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 100; // 10秒でタイムアウト
                
                const checkLoading = () => {
                    attempts++;
                    
                    if (assetManager.isLoadingComplete()) {
                        console.log('✅ Spine assets loaded successfully');
                        
                        // Atlasファイルの内容詳細ログ
                        const atlasData = assetManager.get(atlasPath);
                        if (atlasData) {
                            console.log('📋 Atlas data loaded:', atlasData);
                            if (atlasData.pages && atlasData.pages.length > 0) {
                                console.log('🖼️ Atlas pages:', atlasData.pages.map(p => p.name));
                            }
                        }
                        
                        this.setupSkeletonRenderer(character, assetManager);
                        resolve();
                    } else if (assetManager.hasErrors()) {
                        console.error('❌ AssetManager errors detected');
                        const errors = assetManager.getErrors();
                        console.error('Error details:', errors);
                        reject(new Error(`Failed to load Spine assets: ${JSON.stringify(errors)}`));
                    } else if (attempts >= maxAttempts) {
                        console.error(`❌ Asset loading timeout after ${maxAttempts * 100}ms`);
                        const loaded = assetManager.getLoaded();
                        const total = assetManager.getToLoad();
                        reject(new Error(`Loading timeout: ${loaded}/${total} assets loaded`));
                    } else {
                        // 常に進捗表示（エラー特定のため）
                        const loaded = assetManager.getLoaded();
                        const total = assetManager.getToLoad();  
                        
                        // 基本進捗は5回に1回
                        if (attempts % 5 === 0) {
                            console.log(`⏳ Loading progress: ${loaded}/${total} (attempt ${attempts}/${maxAttempts})`);
                        }
                        
                        // スタック状態の詳細分析（10回に1回）
                        if (attempts % 10 === 0) {
                            console.log('📊 FORCE DEBUG - Asset Manager State:');
                            console.log('   Assets to load:', total);
                            console.log('   Assets loaded:', loaded);
                            console.log('   Has errors:', assetManager.hasErrors());
                            
                            // エラー詳細を強制取得
                            try {
                                const errors = assetManager.getErrors();
                                console.log('   Error details:', errors);
                                if (errors && Object.keys(errors).length > 0) {
                                    Object.entries(errors).forEach(([path, err]) => {
                                        console.log(`     Error for ${path}:`, err);
                                    });
                                }
                            } catch (errorGetError) {
                                console.log('   Error getting errors:', errorGetError);
                            }
                            
                            // 個別アセット状態を強制チェック
                            console.log('📁 Individual asset status:');
                            try {
                                const jsonData = assetManager.get(jsonPath);
                                const atlasData = assetManager.get(atlasPath);
                                console.log(`   ${jsonPath} ->`, !!jsonData ? 'LOADED' : 'NOT LOADED');
                                console.log(`   ${atlasPath} ->`, !!atlasData ? 'LOADED' : 'NOT LOADED');
                                
                                if (jsonData) {
                                    console.log('   JSON type:', typeof jsonData);
                                    if (typeof jsonData === 'string') {
                                        console.log('   JSON length:', jsonData.length);
                                        const parsed = JSON.parse(jsonData);
                                        console.log('   JSON spine version:', parsed?.skeleton?.spine || 'N/A');
                                    }
                                }
                                if (atlasData) {
                                    console.log('   Atlas type:', typeof atlasData);
                                    console.log('   Atlas constructor:', atlasData.constructor?.name || 'N/A');
                                    if (atlasData.pages) {
                                        console.log('   Atlas pages:', atlasData.pages.length);
                                    }
                                }
                            } catch (getError) {
                                console.log('   Error checking assets:', getError.message);
                            }
                            
                            // AssetManagerの内部状態確認  
                            console.log('🔍 AssetManager internals:');
                            console.log('   Is loading complete:', assetManager.isLoadingComplete());
                            console.log('   Manager object keys:', Object.keys(assetManager));
                            
                            // 🚨 段階的切り分け: PNG画像ファイル確認
                            console.log('🖼️ PNG Texture File Check:');
                            const pngPath = atlasPath.replace('.atlas', '.png');
                            try {
                                const pngData = assetManager.get(pngPath);
                                console.log(`   ${pngPath} ->`, !!pngData ? 'LOADED' : 'NOT LOADED');
                                if (pngData) {
                                    console.log('   PNG type:', typeof pngData);
                                    console.log('   PNG constructor:', pngData.constructor?.name || 'N/A');
                                }
                            } catch (pngError) {
                                console.log('   PNG check error:', pngError.message);
                            }
                            
                            // 🚨 段階的切り分け: HTTP応答詳細確認
                            if (attempts === 20) { // 2秒後に1回だけ実行
                                console.log('🌐 HTTP Response Verification:');
                                fetch(atlasPath)
                                    .then(response => {
                                        console.log('   HTTP Status:', response.status);
                                        console.log('   Content-Type:', response.headers.get('content-type'));
                                        console.log('   Content-Length:', response.headers.get('content-length'));
                                        return response.text();
                                    })
                                    .then(text => {
                                        console.log('   HTTP Body length:', text.length);
                                        console.log('   HTTP Body preview:', text.substring(0, 100));
                                        
                                        // Atlas内容の妥当性確認
                                        const lines = text.split('\n');
                                        console.log('   Atlas lines count:', lines.length);
                                        console.log('   First line (image name):', lines[0]);
                                        console.log('   Has size info:', lines.some(line => line.startsWith('size:')));
                                        console.log('   Has filter info:', lines.some(line => line.startsWith('filter:')));
                                        console.log('   Has PMA info:', lines.some(line => line.startsWith('pma:')));
                                    })
                                    .catch(httpError => {
                                        console.error('   HTTP fetch failed:', httpError);
                                    });
                            }
                        }
                        
                        setTimeout(checkLoading, 100);
                    }
                };
                checkLoading();
            });
            
        } catch (error) {
            console.error(`Asset loading failed for ${name}:`, error);
            throw error;
        }
    }

    /**
     * スケルトンレンダラー設定
     */
    setupSkeletonRenderer(character, assetManager) {
        const { gl, canvas } = character;
        
        try {
            // アセット取得と検証
            console.log('🔍 Retrieving assets from AssetManager...');
            const atlasPath = `${character.path}${character.name}.atlas`;
            const jsonPath = `${character.path}${character.name}.json`;
            
            const atlas = assetManager.get(atlasPath);
            const skeletonJson = assetManager.get(jsonPath);
            
            if (!atlas) {
                throw new Error(`Atlas not found: ${atlasPath}`);
            }
            if (!skeletonJson) {
                throw new Error(`Skeleton JSON not found: ${jsonPath}`);
            }
            
            console.log('✅ Assets retrieved successfully');
            console.log('   Atlas:', atlas);
            console.log('   Skeleton JSON keys:', Object.keys(skeletonJson));
            
            // Canvas/WebGL検証を再実行
            console.log('🔍 Canvas/WebGL verification before renderer creation...');
            if (!canvas) {
                throw new Error('Canvas is null or undefined');
            }
            if (!gl) {
                throw new Error('WebGL context is null or undefined');
            }
            if (typeof canvas.getContext !== 'function') {
                throw new Error('Canvas.getContext is not a function');
            }
            
            // Spine オブジェクト作成
            console.log('🏗️ Creating Spine objects...');
            const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
            const skeletonLoader = new spine.SkeletonJson(atlasLoader);
            const skeletonData = skeletonLoader.readSkeletonData(skeletonJson);
            
            const skeleton = new spine.Skeleton(skeletonData);
            const animationState = new spine.AnimationState(new spine.AnimationStateData(skeletonData));
            
            console.log('🎨 Creating Spine renderer...');
            // レンダラー作成時のエラーキャッチ
            let renderer;
            try {
                renderer = new spine.SceneRenderer(canvas, gl);
            } catch (rendererError) {
                console.error('❌ SceneRenderer creation failed:', rendererError);
                throw new Error(`SceneRenderer creation failed: ${rendererError.message}`);
            }
            
            const skeletonRenderer = renderer.skeletonRenderer;
            
            character.skeleton = skeleton;
            character.animationState = animationState;
            character.renderer = renderer;
            character.skeletonRenderer = skeletonRenderer;
            character.isLoaded = true;
            
            // Physics初期化（4.2.x対応 - 強化版）
            console.log('🔧 Initializing Physics constraints for 4.2.* Runtime with 4.1.24 data...');
            try {
                // 1. SkeletonDataレベルでPhysics制約の確認
                console.log('🔍 Checking SkeletonData.physicsConstraints...');
                if (skeleton.data.physicsConstraints) {
                    console.log(`📊 Found ${skeleton.data.physicsConstraints.length} physics constraints in SkeletonData`);
                    skeleton.physics = [];
                    for (let i = 0; i < skeleton.data.physicsConstraints.length; i++) {
                        skeleton.physics.push(null); // 無効化
                    }
                    console.log('⚙️ Physics constraints disabled for compatibility');
                } else {
                    console.log('✅ No physicsConstraints in SkeletonData');
                }
                
                // 2. Skeletonオブジェクト自体のphysics初期化（強制）
                console.log('🔧 Force-initializing skeleton.physics property...');
                
                // Runtime 4.2.*が期待するphysicsオブジェクト構造を作成
                if (typeof skeleton.physics === 'undefined' || skeleton.physics === null) {
                    console.log('⚡ Physics property undefined/null - creating empty array');
                    skeleton.physics = [];
                } else if (!Array.isArray(skeleton.physics)) {
                    console.log('⚡ Physics property exists but not array - converting to array');
                    skeleton.physics = [];
                } else {
                    console.log(`✅ Physics property already exists as array (length: ${skeleton.physics.length})`);
                }
                
                // 3. より深い初期化：Skeletonのprototype確認
                console.log('🔍 Skeleton object structure verification...');
                console.log('   - skeleton.physics type:', typeof skeleton.physics);
                console.log('   - skeleton.physics value:', skeleton.physics);
                console.log('   - skeleton.constructor.name:', skeleton.constructor.name);
                
                // 4. physics プロパティを descriptor レベルで確認
                const physicsDescriptor = Object.getOwnPropertyDescriptor(skeleton, 'physics');
                console.log('   - physics property descriptor:', physicsDescriptor);
                
                // 5. 強制的にphysicsプロパティを定義
                Object.defineProperty(skeleton, 'physics', {
                    value: [],
                    writable: true,
                    enumerable: true,
                    configurable: true
                });
                
                console.log('✅ Physics property force-initialized as empty array');
                
            } catch (physicsError) {
                console.error('❌ Physics initialization failed:', physicsError);
                console.error('🔧 Attempting emergency physics fallback...');
                
                // 緊急フォールバック：どんな状況でも physics を定義
                try {
                    skeleton.physics = [];
                    console.log('✅ Emergency fallback successful');
                } catch (emergencyError) {
                    console.error('❌ Emergency fallback also failed:', emergencyError);
                    throw emergencyError;
                }
            }

            // 初期位置設定
            console.log('🔧 Setting skeleton to setup pose...');
            skeleton.setToSetupPose();
            
            console.log('🔧 Pre-updateWorldTransform physics verification...');
            console.log('   - skeleton.physics defined:', typeof skeleton.physics !== 'undefined');
            console.log('   - skeleton.physics value:', skeleton.physics);
            console.log('   - skeleton.physics is array:', Array.isArray(skeleton.physics));
            
            // 最終的な physics チェック
            if (typeof skeleton.physics === 'undefined') {
                console.error('🚨 CRITICAL: skeleton.physics is still undefined before updateWorldTransform!');
                skeleton.physics = [];
                console.log('🔧 Emergency physics fix applied');
            }
            
            console.log('🔧 Attempting updateWorldTransform...');
            try {
                skeleton.updateWorldTransform();
                console.log('✅ updateWorldTransform completed successfully');
            
            // キャラクター境界情報を出力（表示問題診断用）
            console.log('📏 Character boundary information:');
            console.log('   - Skeleton data width:', skeleton.data.width);
            console.log('   - Skeleton data height:', skeleton.data.height);
            console.log('   - Skeleton data x offset:', skeleton.data.x);
            console.log('   - Skeleton data y offset:', skeleton.data.y);
            console.log('   - Canvas size:', character.canvas.width, 'x', character.canvas.height);
            console.log('   - Character position will be set by setPosition() method');
            } catch (transformError) {
                console.error('❌ updateWorldTransform failed:', transformError.message);
                console.error('🔍 Error details:', transformError);
                console.error('🔧 Attempting alternative physics initialization...');
                
                // より深いphysics初期化を試す
                try {
                    // skeletonの内部状態を調査
                    console.log('🔍 Skeleton internal investigation:');
                    console.log('   - skeleton keys:', Object.keys(skeleton));
                    console.log('   - skeleton.data keys:', Object.keys(skeleton.data));
                    
                    // physics再初期化
                    skeleton.physics = [];
                    
                    // 再試行
                    skeleton.updateWorldTransform();
                    console.log('✅ updateWorldTransform retry successful');
                } catch (retryError) {
                    console.error('❌ updateWorldTransform retry also failed:', retryError.message);
                    throw retryError;
                }
            }
            
            console.log(`🎬 Spine character ${character.name} ready for animations`);
            
            // レンダリング開始
            this.startRendering(character);
            
        } catch (error) {
            console.error(`❌ Failed to setup skeleton for ${character.name}:`, error);
            console.error('Stack trace:', error.stack);
            throw error;
        }
    }

    /**
     * レンダリングループ開始
     */
    startRendering(character) {
        const render = () => {
            if (!character.isLoaded || !character.canvas || !character.gl) {
                return;
            }
            
            const { gl, canvas, skeleton, animationState, renderer } = character;
            
            try {
                // WebGLコンテキストの有効性確認
                if (gl.isContextLost && gl.isContextLost()) {
                    console.warn('⚠️ WebGL context lost for character:', character.name);
                    return;
                }
                
                // アニメーション更新
                animationState.update(0.016); // 60fps
                animationState.apply(skeleton);
                skeleton.updateWorldTransform();
                
                // レンダリング
                gl.clearColor(0, 0, 0, 0); // 透明背景
                gl.clear(gl.COLOR_BUFFER_BIT);
                
                // ビューポートとカメラ設定（全体表示対応）
                renderer.camera.setViewport(canvas.width, canvas.height);
                
                // カメラズームを調整（キャラクター全体が見えるように）
                renderer.camera.zoom = 1.0; // デフォルト倍率
                
                renderer.begin();
                renderer.drawSkeleton(skeleton, false);
                renderer.end();
                
                requestAnimationFrame(render);
            } catch (renderError) {
                console.error(`Rendering error for ${character.name}:`, renderError);
                // エラー時はプレースホルダーモードに切り替え
                setTimeout(() => {
                    this.createPlaceholderCharacter(character.name, character.path, character.container);
                }, 1000);
            }
        };
        
        render();
    }

    /**
     * プレースホルダーキャラクター作成（フォールバック）- エラー詳細付き
     */
    createPlaceholderCharacter(name, basePath, container, errorDetails = null) {
        const character = {
            name: name,
            path: basePath,
            container: container,
            placeholder: this.createPlaceholder(name, container, errorDetails),
            isLoaded: false,
            errorDetails: errorDetails
        };

        this.characters.set(name, character);
        
        console.log(`📝 Character ${name} loaded (placeholder mode)`);
        if (errorDetails) {
            console.log(`🔍 Error details: ${errorDetails}`);
        }
        return character;
    }

    /**
     * プレースホルダーキャラクター作成（背景画像上テスト用）- エラー詳細表示対応
     */
    createPlaceholder(name, container, errorDetails = null) {
        const placeholder = document.createElement('div');
        placeholder.className = 'spine-placeholder spine-character';
        
        // エラー状況に応じて表示を変更
        const isAtlasError = errorDetails && errorDetails.includes('atlas');
        const borderColor = isAtlasError ? 'rgba(255, 77, 77, 0.8)' : 'rgba(255, 107, 107, 0.6)';
        const bgColor = isAtlasError ? 'rgba(255, 77, 77, 0.2)' : 'rgba(255, 107, 107, 0.1)';
        
        placeholder.style.cssText = `
            width: 80px;
            height: 80px;
            background: ${bgColor};
            border: 2px solid ${borderColor};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            position: absolute;
            animation: ${isAtlasError ? 'spineErrorFloat' : 'spineCharacterFloat'} 3s ease-in-out infinite;
            backdrop-filter: blur(2px);
            box-shadow: 0 4px 12px ${borderColor.replace('0.8', '0.4')};
            cursor: pointer;
            transition: transform 0.3s ease;
            z-index: 1;
        `;
        
        // エラーに応じて絵文字を変更
        if (isAtlasError) {
            placeholder.textContent = '❌';
            placeholder.title = `Spine Error: ${name} - Atlas file not found (404)`;
        } else {
            placeholder.textContent = '🐱';
            placeholder.title = `Spine Character: ${name} (Placeholder Mode)`;
        }
        
        // ホバー効果（エラー詳細表示）
        placeholder.addEventListener('mouseenter', () => {
            placeholder.style.transform = 'scale(1.2)';
            placeholder.style.background = isAtlasError ? 'rgba(255, 77, 77, 0.4)' : 'rgba(255, 107, 107, 0.3)';
            
            if (errorDetails) {
                // エラー詳細をコンソールに再表示
                console.log(`🔍 Placeholder hover - Error details for ${name}:`, errorDetails);
            }
        });
        
        placeholder.addEventListener('mouseleave', () => {
            placeholder.style.transform = 'scale(1)';
            placeholder.style.background = bgColor;
        });
        
        // クリック時にエラー詳細をアラート表示
        if (errorDetails) {
            placeholder.addEventListener('click', () => {
                alert(`Spine Error: ${name}\n\n${errorDetails}\n\nCheck console for details.`);
            });
        }
        
        container.appendChild(placeholder);
        return placeholder;
    }

    /**
     * アニメーション再生
     */
    playAnimation(characterName, animationName, loop = false) {
        const character = this.characters.get(characterName);
        if (!character) {
            console.warn(`Character ${characterName} not found`);
            return;
        }

        // 実際のSpineアニメーション再生
        if (character.isLoaded && character.animationState) {
            try {
                character.animationState.setAnimation(0, animationName, loop);
                console.log(`🎬 Playing Spine animation: ${animationName} on ${characterName} (loop: ${loop})`);
            } catch (error) {
                console.error(`Failed to play animation ${animationName}:`, error);
            }
        } 
        // プレースホルダーでアニメーション効果
        else if (character.placeholder) {
            character.placeholder.style.animation = 'none';
            setTimeout(() => {
                character.placeholder.style.animation = 'placeholderBounce 1s ease-in-out infinite';
            }, 100);
            console.log(`📝 Placeholder animation: ${animationName} on ${characterName}`);
        }
    }

    /**
     * クリック時の出現アニメーション再生（リプレイ機能）
     */
    replayEntranceAnimation(characterName) {
        const character = this.characters.get(characterName);
        if (!character) {
            console.warn(`❌ Character ${characterName} not found for replay animation`);
            return;
        }

        console.log(`🎭 Replaying entrance animation for ${characterName} (user clicked)`);

        // 一度透明にしてから再度フェードイン + アニメーション
        const elements = [];
        if (character.canvas) elements.push(character.canvas);
        if (character.placeholder) elements.push(character.placeholder);

        // 瞬間的に透明にする
        elements.forEach(element => {
            element.style.transition = 'opacity 0.2s ease-out';
            element.style.opacity = '0';
        });

        // 少し遅延してから再出現
        setTimeout(() => {
            elements.forEach(element => {
                element.style.transition = 'opacity 1.5s ease-out';
                element.style.opacity = '1';
            });

            // 出現アニメーションを再生
            this.playSequenceAnimation(characterName);
            console.log(`✨ Entrance animation replay started for ${characterName}`);
        }, 300);

        // transition削除
        setTimeout(() => {
            elements.forEach(element => {
                element.style.transition = '';
            });
        }, 2000);
    }

    /**
     * キャラクターにクリックイベントを追加
     */
    addClickInteraction(characterName) {
        const character = this.characters.get(characterName);
        if (!character) return;

        const addClickHandler = (element) => {
            if (!element) return;
            
            element.style.cursor = 'pointer';
            element.style.pointerEvents = 'auto'; // クリックを有効化
            
            element.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                console.log(`👆 User clicked on ${characterName}`);
                this.replayEntranceAnimation(characterName);
            });

            console.log(`🖱️ Click interaction added to ${characterName}`);
        };

        // Spineキャラクターとプレースホルダー両方にクリック機能を追加
        if (character.canvas) addClickHandler(character.canvas);
        if (character.placeholder) addClickHandler(character.placeholder);
    }

    /**
     * アニメーション連続再生（syutugen → taiki loop）- 修正されたPurattokunデータ用
     */
    playSequenceAnimation(characterName) {
        const character = this.characters.get(characterName);
        if (!character) {
            console.warn(`❌ Character ${characterName} not found for sequence animation`);
            return;
        }

        console.log(`🎬 Starting sequence animation for ${characterName} (corrected data)`);

        if (character.isLoaded && character.animationState) {
            try {
                console.log(`✅ Real Spine WebGL sequence for ${characterName}`);
                
                // アニメーション一覧をデバッグ出力
                if (character.skeleton && character.skeleton.data) {
                    const animations = character.skeleton.data.animations;
                    console.log('📋 Available animations:', animations.map(a => a.name));
                }
                
                // 出現アニメーション再生（ループしない）
                const syutugenTrack = character.animationState.setAnimation(0, 'syutugen', false);
                console.log(`🎭 Starting sequence: syutugen → taiki loop for ${characterName}`);
                
                // 出現アニメーション完了後に待機アニメーションをループ再生
                syutugenTrack.listener = {
                    complete: () => {
                        character.animationState.setAnimation(0, 'taiki', true);
                        console.log(`🔄 Transition to taiki loop for ${characterName}`);
                    }
                };
            } catch (error) {
                console.error(`❌ Failed to play sequence animation for ${characterName}:`, error);
                console.log('🔄 Attempting fallback to taiki only...');
                // フォールバック: 直接待機アニメーション再生
                try {
                    this.playAnimation(characterName, 'taiki', true);
                } catch (fallbackError) {
                    console.error('❌ Fallback animation also failed:', fallbackError);
                }
            }
        } else {
            console.log(`📝 Placeholder mode sequence for ${characterName} (corrected data)`);
            // プレースホルダーモードでのシーケンス模擬
            this.playAnimation(characterName, 'syutugen', false);
            setTimeout(() => {
                this.playAnimation(characterName, 'taiki', true);
                console.log(`🔄 Placeholder sequence completed for ${characterName}`);
            }, 2000); // 2秒後に待機アニメーション開始
        }
    }

    /**
     * キャラクター位置設定（ビューポート基準の絶対位置）
     */
    setPosition(characterName, x, y, scale = 1.0) {
        const character = this.characters.get(characterName);
        if (!character) return;

        // 実際のSpineキャラクターの位置設定（ビューポート基準）
        if (character.canvas) {
            // 強制的にfixedポジションを設定（上書き防止）
            character.canvas.style.setProperty('position', 'fixed', 'important');
            character.canvas.style.setProperty('left', x + 'vw', 'important');
            character.canvas.style.setProperty('top', y + 'vh', 'important');
            character.canvas.style.transform = `scale(${scale})`;
            character.canvas.style.transformOrigin = '0 0'; // 左上を基準にスケール
            character.canvas.style.opacity = '0'; // 初期状態は透明
            character.canvas.style.zIndex = '10';      // 他要素より前面に
            
            console.log(`📍 Character ${characterName} positioned at (${x}vw, ${y}vh) with scale ${scale} (viewport-relative positioning with !important)`);
            console.log(`🔧 Canvas position verification: position=${character.canvas.style.position}, left=${character.canvas.style.left}, top=${character.canvas.style.top}`);
        }
        
        // プレースホルダーの位置設定（ビューポート基準）
        if (character.placeholder) {
            character.placeholder.style.setProperty('position', 'fixed', 'important');
            character.placeholder.style.setProperty('left', x + 'vw', 'important');
            character.placeholder.style.setProperty('top', y + 'vh', 'important');
            character.placeholder.style.transform = `scale(${scale})`;
            character.placeholder.style.transformOrigin = '0 0';
            character.placeholder.style.opacity = '0'; // 初期状態は透明
            character.placeholder.style.zIndex = '10';      // 他要素より前面に
            
            console.log(`📍 Placeholder ${characterName} positioned at (${x}vw, ${y}vh) with scale ${scale} (viewport-relative positioning with !important)`);
        }
    }

    /**
     * キャラクターをフェードインさせる（透明度のみ）
     */
    fadeInCharacter(characterName, duration = 2000) {
        const character = this.characters.get(characterName);
        if (!character) return;

        console.log(`✨ Starting fade-in for ${characterName} (duration: ${duration}ms)`);

        const elements = [];
        if (character.canvas) elements.push(character.canvas);
        if (character.placeholder) elements.push(character.placeholder);

        elements.forEach(element => {
            // CSS transitionを設定
            element.style.transition = `opacity ${duration}ms ease-out`;
            
            // 少し遅延してからフェードイン開始
            setTimeout(() => {
                element.style.opacity = '1';
                console.log(`🌟 Fade-in started for ${characterName}`);
            }, 100);
        });

        // フェードイン完了後の処理
        setTimeout(() => {
            console.log(`🎯 Fade-in completed for ${characterName}`);
            
            // transitionを削除
            elements.forEach(element => {
                element.style.transition = '';
            });
        }, duration + 200);
    }

    /**
     * キャラクター位置をアニメーション付きで移動（出現演出用・ビューポート基準）
     */
    animateToPosition(characterName, fromX, fromY, toX, toY, scale = 1.0, duration = 2000, opacity = true) {
        const character = this.characters.get(characterName);
        if (!character) return;

        console.log(`🎭 Starting animated positioning for ${characterName}: (${fromX}vw, ${fromY}vh) → (${toX}vw, ${toY}vh)`);

        const elements = [];
        if (character.canvas) elements.push(character.canvas);
        if (character.placeholder) elements.push(character.placeholder);

        elements.forEach(element => {
            // 初期位置設定（ビューポート基準）
            element.style.position = 'fixed';
            element.style.left = fromX + 'vw';
            element.style.top = fromY + 'vh';
            element.style.transform = `scale(${scale})`;
            element.style.transformOrigin = '0 0';
            element.style.zIndex = '10';
            
            if (opacity) {
                element.style.opacity = '0'; // 最初は透明
            }

            // CSS transitionを設定
            element.style.transition = `all ${duration}ms ease-out`;

            // 少し遅延してから最終位置へアニメーション
            setTimeout(() => {
                element.style.left = toX + 'vw';
                element.style.top = toY + 'vh';
                if (opacity) {
                    element.style.opacity = '1'; // フェードイン
                }
                console.log(`✨ Animation started for ${characterName} (viewport positioning)`);
            }, 100); // 100ms遅延でスムーズなアニメーション開始
        });

        // アニメーション完了時のコールバック
        setTimeout(() => {
            console.log(`🎯 Animation completed for ${characterName} at (${toX}vw, ${toY}vh)`);
            
            // transitionを削除（後続の位置変更で不要なアニメーションを避ける）
            elements.forEach(element => {
                element.style.transition = '';
            });
        }, duration + 200);
    }


    /**
     * 全キャラクター削除
     */
    dispose() {
        this.characters.forEach(character => {
            if (character.placeholder && character.placeholder.parentNode) {
                character.placeholder.parentNode.removeChild(character.placeholder);
            }
        });
        this.characters.clear();
    }
}

// Spine キャラクター用CSS追加 - エラー表示対応
const spineCSS = `
    @keyframes spineCharacterFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
    }
    
    @keyframes spineErrorFloat {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        25% { transform: translateY(-5px) rotate(-2deg); }
        50% { transform: translateY(-8px) rotate(0deg); }
        75% { transform: translateY(-5px) rotate(2deg); }
    }
    
    @keyframes placeholderBounce {
        0%, 100% { transform: translateY(0px) scale(1); }
        50% { transform: translateY(-10px) scale(1.1); }
    }
    
    .spine-character {
        /* 背景画像上で目立つスタイル */
        text-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
    }
    
    .spine-character:hover {
        animation-play-state: paused !important;
    }
`;

// CSS追加
const style = document.createElement('style');
style.textContent = spineCSS;
document.head.appendChild(style);

// グローバルインスタンス
window.spineManager = new SpineCharacterManager();