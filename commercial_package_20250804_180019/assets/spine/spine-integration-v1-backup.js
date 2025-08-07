/**
 * Spine WebGL統合モジュール
 * 既存のアニメーションシステムとSpineを連携
 */

// デバッグログレベル管理システム
const LogLevel = {
    ERROR: 0,   // エラー・重要な問題
    WARN: 1,    // 警告・注意事項
    INFO: 2,    // 一般的な情報・ステータス
    DEBUG: 3    // 詳細デバッグ情報
};

// デバッグモード設定（本番では ERROR のみ有効）
const DEBUG_CONFIG = {
    // 本番モード: localhost 以外では ERROR レベルのみ
    level: window.location.hostname === 'localhost' ? LogLevel.DEBUG : LogLevel.ERROR,
    
    // 各カテゴリーの有効/無効切り替え
    categories: {
        initialization: true,    // 初期化ログ
        animation: true,        // アニメーション関連
        physics: true,          // Physics処理
        performance: true,      // パフォーマンス監視
        position: true,         // 位置計算
        cache: true,           // キャッシュ処理
        debug_ui: false        // デバッグUI（本番では無効）
    }
};

// ログ出力関数
function log(level, category, message, ...args) {
    if (level > DEBUG_CONFIG.level) return;
    if (category && !DEBUG_CONFIG.categories[category]) return;
    
    const prefix = {
        [LogLevel.ERROR]: '❌',
        [LogLevel.WARN]: '⚠️',
        [LogLevel.INFO]: 'ℹ️',
        [LogLevel.DEBUG]: '🔍'
    }[level] || '📝';
    
    console.log(`${prefix} [${category || 'GENERAL'}] ${message}`, ...args);
}

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
                position: absolute;
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
            
            // DOM追加：Canvasをheroセクション内に配置（背景画像と同期）
            console.log('🔧 Adding canvas to hero section for background synchronization...');
            const heroSection = document.querySelector('.hero');
            if (heroSection) {
                heroSection.appendChild(canvas);
                console.log('✅ Canvas added to hero section (background-synchronized positioning)');
            } else {
                console.warn('⚠️ Hero section not found, falling back to body');
                document.body.appendChild(canvas);
            }
            
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
                    console.log(`   - Target: (${x}%, ${y}%) scale: ${scale}`);
                    
                    console.log('✅ Applying position correction for scale-based system');
                    // ヒーローセクション基準の相対位置設定
                    config.canvas.style.setProperty('position', 'absolute', 'important');
                    config.canvas.style.setProperty('left', x + '%', 'important');
                    config.canvas.style.setProperty('top', y + '%', 'important');
                    config.canvas.style.setProperty('transform', `translate(-50%, -50%) scale(${scale})`, 'important');
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
            // 🔧 開発時キャッシュバスティング機能（localhost検出時のみ有効）
            const isDevelopment = window.location.hostname === 'localhost' || 
                                 window.location.hostname === '127.0.0.1' || 
                                 window.location.port === '8000';
            
            const cacheBuster = isDevelopment ? `?t=${Date.now()}` : '';
            const jsonPath = `${path}${name}.json${cacheBuster}`;
            const atlasPath = `${path}${name}.atlas${cacheBuster}`;
            
            console.log('🔧 Smart cache busting system activated');
            console.log(`   Development mode: ${isDevelopment}`);
            console.log(`   Cache buster: ${cacheBuster || 'disabled (production)'}`);
            
            console.log(`📁 Loading Spine assets:`, { jsonPath, atlasPath });
            
            // 読み込み時のパスをキャラクターオブジェクトに保存（後で取得時に使用）
            character.actualJsonPath = jsonPath;
            character.actualAtlasPath = atlasPath;
            
            if (isDevelopment && cacheBuster) {
                console.log('💡 Cache busting active - fresh Spine data will be loaded');
                console.log('🔄 If you updated Spine files, this prevents cache issues');
                console.log('');
                console.log('🔧 DEVELOPER TIP: If character parts are missing after Spine data update:');
                console.log('   1. Try hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)');
                console.log('   2. Clear browser cache: Shift+Ctrl+Delete');
                console.log('   3. Check browser Network tab for 304 responses (cached files)');
                console.log('');
            }
            
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
            
            // 🔍 読み込み時に保存された実際のパスを使用
            const actualAtlasPath = character.actualAtlasPath || atlasPath;
            const actualJsonPath = character.actualJsonPath || jsonPath;
            
            console.log('📋 AssetManager path resolution:');
            console.log('   Basic atlas path:', atlasPath);
            console.log('   Stored atlas path:', character.actualAtlasPath);
            console.log('   Using atlas path:', actualAtlasPath);
            console.log('   Basic JSON path:', jsonPath);
            console.log('   Stored JSON path:', character.actualJsonPath);
            console.log('   Using JSON path:', actualJsonPath);
            
            // AssetManager内の全アセットを確認
            console.log('🗂️ AssetManager loaded assets:');
            if (assetManager.assets) {
                const assetKeys = Object.keys(assetManager.assets);
                console.log(`   Total assets: ${assetKeys.length}`);
                assetKeys.forEach(key => {
                    console.log(`   - "${key}": ${typeof assetManager.assets[key]}`);
                });
            } else {
                console.log('   ❌ AssetManager.assets is undefined');
            }
            
            // キャッシュバスター対応: 実際に読み込まれたパスでアセット取得
            let atlas = assetManager.get(actualAtlasPath);
            let skeletonJson = assetManager.get(actualJsonPath);
            
            // フォールバック: キャッシュバスターなしでも試行
            if (!atlas) {
                console.log('🔄 Trying fallback without cache buster for atlas...');
                atlas = assetManager.get(atlasPath);
            }
            if (!skeletonJson) {
                console.log('🔄 Trying fallback without cache buster for JSON...');
                skeletonJson = assetManager.get(jsonPath);
            }
            
            console.log('🔍 Asset retrieval results:');
            console.log('   Atlas retrieved:', !!atlas, typeof atlas);
            console.log('   JSON retrieved:', !!skeletonJson, typeof skeletonJson);
            
            if (!atlas) {
                console.error(`❌ Atlas not found in AssetManager cache`);
                console.error(`   Tried paths: "${actualAtlasPath}" and "${atlasPath}"`);
                console.error(`   Available keys: [${Object.keys(assetManager.assets || {}).join(', ')}]`);
                throw new Error(`Atlas not found: ${actualAtlasPath}`);
            }
            if (!skeletonJson) {
                console.error(`❌ JSON not found in AssetManager cache`);
                console.error(`   Tried paths: "${actualJsonPath}" and "${jsonPath}"`);
                throw new Error(`Skeleton JSON not found: ${actualJsonPath}`);
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
            
            // Spine オブジェクト作成（詳細エラーハンドリング）
            console.log('🏗️ Creating Spine objects...');
            
            // 1. AtlasAttachmentLoader作成
            console.log('🔧 Creating AtlasAttachmentLoader...');
            const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
            console.log('✅ AtlasAttachmentLoader created:', !!atlasLoader);
            
            // 2. SkeletonJson作成
            console.log('🔧 Creating SkeletonJson...');
            const skeletonLoader = new spine.SkeletonJson(atlasLoader);
            console.log('✅ SkeletonJson created:', !!skeletonLoader);
            
            // 3. SkeletonData作成（エラーハンドリング強化）
            console.log('🔧 Creating SkeletonData from JSON...');
            console.log('📄 Skeleton JSON keys:', Object.keys(skeletonJson));
            console.log('📄 JSON skeleton property:', !!skeletonJson.skeleton);
            
            let skeletonData;
            try {
                skeletonData = skeletonLoader.readSkeletonData(skeletonJson);
                console.log('✅ SkeletonData created successfully:', !!skeletonData);
                
                if (skeletonData) {
                    console.log('📊 SkeletonData details:');
                    console.log('   - Name:', skeletonData.name || 'N/A');
                    console.log('   - Bones count:', skeletonData.bones?.length || 0);
                    console.log('   - Slots count:', skeletonData.slots?.length || 0);
                    console.log('   - Animations count:', skeletonData.animations?.length || 0);
                }
            } catch (error) {
                console.error('❌ SkeletonData creation failed:', error);
                console.error('📋 Error details:', {
                    message: error.message,
                    stack: error.stack?.substring(0, 200)
                });
                throw new Error(`SkeletonData creation failed: ${error.message}`);
            }
            
            // 4. Skeleton作成（エラーハンドリング）
            console.log('🔧 Creating Skeleton from SkeletonData...');
            let skeleton;
            try {
                skeleton = new spine.Skeleton(skeletonData);
                console.log('✅ Skeleton created successfully:', !!skeleton);
            } catch (error) {
                console.error('❌ Skeleton creation failed:', error);
                throw new Error(`Skeleton creation failed: ${error.message}`);
            }
            
            // 5. AnimationState作成（エラーハンドリング）
            console.log('🔧 Creating AnimationState...');
            let animationState;
            try {
                const animationStateData = new spine.AnimationStateData(skeletonData);
                animationState = new spine.AnimationState(animationStateData);
                console.log('✅ AnimationState created successfully:', !!animationState);
            } catch (error) {
                console.error('❌ AnimationState creation failed:', error);
                throw new Error(`AnimationState creation failed: ${error.message}`);
            }
            
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
            
            // 🔧 キャラクター位置をCanvas内の(0, 0)に設定
            let targetX = 0;  // Canvas内座標 (0, 0)
            let targetY = 0;  // Canvas内座標 (0, 0)
            
            console.log(`🔧 CHARACTER POSITION SET TO CANVAS (0, 0):`);
            console.log(`📍 Canvas size: ${canvas.width}x${canvas.height}px`);
            console.log(`📍 Character position: (${targetX}, ${targetY})`);
            console.log(`🔍 Character will be positioned at Canvas origin (0, 0)`);
            
            // スケルトンの初期状態設定（HTML設定座標、通常スケールで表示）
            skeleton.x = targetX;           // HTML設定に基づく座標
            skeleton.y = targetY;           // HTML設定に基づく座標
            skeleton.scaleX = 1.0;          // 初期スケール1.0（表示状態）
            skeleton.scaleY = 1.0;          // 初期スケール1.0（表示状態）
            
            // Canvas内(0, 0)座標をキャラクターオブジェクトに保存（レンダリングループとクリック判定で使用）
            character.targetX = targetX;  // Canvas内座標 (0)
            character.targetY = targetY;  // Canvas内座標 (0)
            
            // 🔍 プロパティ設定の確認ログ（数値0対応の検証）
            console.log('🔧 Character target coordinates saved:');
            console.log(`   character.targetX: ${character.targetX} (type: ${typeof character.targetX})`);
            console.log(`   character.targetY: ${character.targetY} (type: ${typeof character.targetY})`);
            console.log(`   Value 0 check: targetX === 0? ${targetX === 0}, targetY === 0? ${targetY === 0}`);
            console.log(`   Undefined check: targetX !== undefined? ${targetX !== undefined}, targetY !== undefined? ${targetY !== undefined}`);
            
            console.log(`🎯 Skeleton initialized: position=(${skeleton.x}, ${skeleton.y}), scale=(${skeleton.scaleX}, ${skeleton.scaleY})`);
            console.log(`📐 Skeleton scale verification: scaleX=${skeleton.scaleX}, scaleY=${skeleton.scaleY} (should be 1.0)`);
            
            // 🔍 詳細デバッグ: キャラクターの境界とCanvas情報
            console.log('🔍 CHARACTER VISIBILITY DEBUG:');
            console.log(`   Canvas dimensions: ${canvas.width}x${canvas.height}px`);
            console.log(`   Canvas screen position: ${canvas.getBoundingClientRect().left.toFixed(0)}, ${canvas.getBoundingClientRect().top.toFixed(0)}`);
            console.log(`   Skeleton data dimensions: ${skeleton.data.width}x${skeleton.data.height}`);
            console.log(`   Skeleton bounds: x=${skeleton.data.x}, y=${skeleton.data.y}`);
            console.log(`   Skeleton position: (${skeleton.x}, ${skeleton.y})`);
            console.log(`   Skeleton scale: (${skeleton.scaleX}, ${skeleton.scaleY})`);
            console.log(`   Canvas style opacity: ${canvas.style.opacity}`);
            console.log(`   Canvas style display: ${canvas.style.display}`);
            console.log(`   Canvas style visibility: ${canvas.style.visibility}`);
            console.log(`   Canvas parent: ${canvas.parentElement?.tagName || 'none'}`);
            
            // 🔍 スロット・アタッチメント詳細デバッグ（データ更新問題調査）
            console.log('🔍 SLOT ATTACHMENT DEBUG:');
            console.log(`   Total slots: ${skeleton.slots.length}`);
            skeleton.slots.forEach((slot, index) => {
                const attachment = slot.getAttachment();
                console.log(`   Slot ${index}: "${slot.data.name}"`);
                console.log(`     - Bone: ${slot.bone.data.name}`);
                console.log(`     - Attachment: ${attachment ? attachment.name : 'NULL'}`);
                console.log(`     - Attachment type: ${attachment ? attachment.constructor.name : 'N/A'}`);
                if (slot.data.name === 'karada') {
                    console.log(`     ⚠️ BODY SLOT FOUND: attachment=${attachment ? 'YES' : 'NO'}`);
                    if (!attachment) {
                        console.log(`     ❌ BODY SLOT HAS NO ATTACHMENT - This is the problem!`);
                    }
                }
            });
            
            // スケルトン骨の状態確認
            if (skeleton.bones && skeleton.bones.length > 0) {
                console.log(`   Skeleton bones count: ${skeleton.bones.length}`);
                console.log(`   Root bone: ${skeleton.bones[0].data.name}`);
            }
            
            // スロット（描画要素）の状態確認
            if (skeleton.slots && skeleton.slots.length > 0) {
                console.log(`   Skeleton slots count: ${skeleton.slots.length}`);
                skeleton.slots.forEach((slot, i) => {
                    if (slot.attachment) {
                        console.log(`   Slot ${i}: ${slot.data.name} → ${slot.attachment.name || 'unnamed'}`);
                    }
                });
            }
            
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
                
                // 座標固定処理（HTML設定座標で位置変化を防ぐ - 数値0対応修正）
                const fixedX = character.targetX !== undefined ? character.targetX : (canvas.width / 2);
                const fixedY = character.targetY !== undefined ? character.targetY : (canvas.height / 2);
                
                // デバッグ: 座標固定処理の詳細ログ（問題診断用）
                if (Math.random() < 0.001) { // 0.1%の確率でログ出力
                    console.log('🔍 座標固定処理デバッグ:');
                    console.log(`   character.targetX: ${character.targetX} (type: ${typeof character.targetX})`);
                    console.log(`   character.targetY: ${character.targetY} (type: ${typeof character.targetY})`);
                    console.log(`   fixedX: ${fixedX} (fallback used: ${character.targetX === undefined})`);
                    console.log(`   fixedY: ${fixedY} (fallback used: ${character.targetY === undefined})`);
                }
                
                skeleton.x = fixedX;
                skeleton.y = fixedY;
                
                // デバッグ: スケール値監視（5秒に1回）
                if (Math.floor(Date.now() / 5000) % 1 === 0 && Math.random() < 0.001) {
                    console.log(`📊 Scale monitoring for ${character.name}: scaleX=${skeleton.scaleX}, scaleY=${skeleton.scaleY}`);
                }
                
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

        // スケールを0にしてから再度syutugenアニメーション
        if (character.skeleton) {
            // スケルトンを一度スケール0に戻す
            character.skeleton.scaleX = 0;
            character.skeleton.scaleY = 0;
            console.log(`🔄 Skeleton scale reset to (0, 0) for replay`);
            
            // 少し遅延してからスケール復元＋syutugenアニメーション再生
            setTimeout(() => {
                // 手動でスケールを復元
                character.skeleton.scaleX = 1.0;
                character.skeleton.scaleY = 1.0;
                console.log(`🎯 Scale manually restored to (1.0, 1.0) for replay`);
                
                this.playSequenceAnimation(characterName);
                console.log(`⚡ Scale-based entrance animation replay started for ${characterName}`);
            }, 300); // 0.3秒後にアニメーション開始
        }

        // リプレイ処理完了
        console.log(`🎯 Scale-based replay setup complete for ${characterName}`);
    }

    /**
     * クリック時のやられアニメーション再生
     */
    playYarareAnimation(characterName) {
        const character = this.characters.get(characterName);
        if (!character) {
            console.warn(`❌ Character ${characterName} not found for yarare animation`);
            return;
        }

        console.log(`🎭 Playing yarare animation for ${characterName} (user clicked)`);

        // Spineキャラクターの場合
        if (character.skeleton && character.animationState) {
            // yarareアニメーション再生（ループしない）
            const yarareTrack = character.animationState.setAnimation(0, 'yarare', false);
            console.log(`🎭 Yarare animation started for ${characterName}`);
            
            // yarareアニメーション終了後にtaikiループを開始
            yarareTrack.listener = {
                complete: () => {
                    console.log(`🎭 Yarare animation completed for ${characterName}, starting taiki loop`);
                    character.animationState.setAnimation(0, 'taiki', true); // taikをループ再生
                    console.log(`🔄 Taiki loop animation started for ${characterName}`);
                }
            };
        } else {
            // プレースホルダーの場合は簡単なリアクション
            console.log(`📝 Placeholder ${characterName} clicked - showing yarare reaction`);
            if (character.element) {
                character.element.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    character.element.style.transform = 'scale(1)';
                }, 200);
            }
        }

        console.log(`🎯 Yarare animation setup complete for ${characterName}`);
    }

    /**
     * キャラクターにクリックイベントを追加
     */
    addClickInteraction(characterName) {
        const character = this.characters.get(characterName);
        if (!character) return;

        const addClickHandler = (element) => {
            if (!element) return;
            
            element.style.pointerEvents = 'auto'; // クリックを有効化
            
            element.addEventListener('click', (event) => {
                // キャラクターの境界内でのクリック判定
                if (this.isClickInsideCharacter(characterName, event, element)) {
                    event.preventDefault();
                    event.stopPropagation();
                    console.log(`👆 User clicked inside ${characterName} bounds`);
                    this.playYarareAnimation(characterName);
                    
                    // クリック時のカーソル変更（視覚的フィードバック）
                    element.style.cursor = 'pointer';
                } else {
                    // キャラクター外をクリックした場合
                    console.log(`📍 Click outside ${characterName} bounds - ignoring`);
                    element.style.cursor = 'default';
                }
            });
            
            // マウスオーバー時の判定とカーソル変更
            element.addEventListener('mousemove', (event) => {
                if (this.isClickInsideCharacter(characterName, event, element)) {
                    element.style.cursor = 'pointer';
                } else {
                    element.style.cursor = 'default';
                }
            });

            console.log(`🖱️ Character-bounded click interaction added to ${characterName}`);
        };

        // Spineキャラクターとプレースホルダー両方にクリック機能を追加
        if (character.canvas) addClickHandler(character.canvas);
        if (character.placeholder) addClickHandler(character.placeholder);
    }

    /**
     * クリック座標がキャラクターの境界内にあるかどうかを判定
     */
    isClickInsideCharacter(characterName, event, element) {
        const character = this.characters.get(characterName);
        if (!character) return false;

        // Canvas上でのクリック座標を取得（スケール補正付き）
        const rect = element.getBoundingClientRect();
        const rawX = event.clientX - rect.left;
        const rawY = event.clientY - rect.top;
        
        // Canvas のtransform解析（scale + translate を考慮）
        const computedStyle = window.getComputedStyle(element);
        const transform = computedStyle.transform;
        let scaleX = 1, scaleY = 1, translateX = 0, translateY = 0;
        
        if (transform && transform !== 'none') {
            const matrix = transform.match(/matrix.*\((.+)\)/);
            if (matrix) {
                const values = matrix[1].split(', ').map(v => parseFloat(v));
                scaleX = values[0];   // m11
                scaleY = values[3];   // m22
                translateX = values[4]; // m41 (translateX)
                translateY = values[5]; // m42 (translateY)
            }
        }
        
        // 修正された座標変換：translate(-50%, -50%)を考慮
        // transform: translate(-50%, -50%) により、実際の中心は(0,0)
        const centerOffsetX = element.width / 2;   // 300px (600/2)
        const centerOffsetY = element.height / 2;  // 250px (500/2)
        
        // 座標補正: 左上基準のクリック位置をCanvas中心基準に変換
        // 1. 中心基準に変換：クリック位置 - Canvas中心
        // 2. スケール補正：変換後の位置をスケールで割る
        const canvasX = (rawX - centerOffsetX) / scaleX;
        const canvasY = (rawY - centerOffsetY) / scaleY;

        console.log(`🎯 Click position analysis for ${characterName}:`);
        console.log(`   Element bounds: left=${rect.left.toFixed(1)}, top=${rect.top.toFixed(1)}, width=${rect.width.toFixed(1)}, height=${rect.height.toFixed(1)}`);
        console.log(`   Canvas size: ${element.width}x${element.height}px`);
        console.log(`   Raw click: (${rawX.toFixed(1)}, ${rawY.toFixed(1)})`);
        console.log(`   Transform: scale=(${scaleX.toFixed(2)}, ${scaleY.toFixed(2)}), translate=(${translateX.toFixed(1)}, ${translateY.toFixed(1)})`);
        console.log(`   Center offset: (${centerOffsetX}, ${centerOffsetY})`);
        console.log(`   Final Canvas coordinate: (${canvasX.toFixed(1)}, ${canvasY.toFixed(1)})`);

        // Spineキャラクターの場合
        if (character.skeleton) {
            return this.isClickInsideSpineCharacter(character, canvasX, canvasY);
        }
        
        // プレースホルダーの場合
        if (character.placeholder) {
            return this.isClickInsidePlaceholder(character, canvasX, canvasY, element);
        }

        // デフォルトは false
        return false;
    }

    /**
     * Spineキャラクターの境界内クリック判定（修正版）
     */
    isClickInsideSpineCharacter(character, canvasX, canvasY) {
        const skeleton = character.skeleton;
        if (!skeleton) return false;

        console.log(`🔍 === Click Detection Debug for ${character.name} ===`);
        
        // 修正：中心基準の座標系で統一
        // skeletonの位置はsetPosition()で設定された中心基準の座標
        const characterX = skeleton.x;  // 既に中心基準で設定済み
        const characterY = skeleton.y;  // 既に中心基準で設定済み
        const scaleX = skeleton.scaleX;
        const scaleY = skeleton.scaleY;
        
        console.log(`📍 Character coordinates (center-based):`);
        console.log(`   Skeleton position: (${characterX}, ${characterY}) [center-based]`);
        console.log(`   Scale: (${scaleX}, ${scaleY})`);
        
        // SkeletonDataの境界情報
        const dataWidth = skeleton.data.width;
        const dataHeight = skeleton.data.height;
        
        console.log(`📐 SkeletonData bounds:`);
        console.log(`   Size: ${dataWidth} x ${dataHeight}`);
        
        // スケール適用後のサイズ
        const scaledWidth = dataWidth * Math.abs(scaleX);
        const scaledHeight = dataHeight * Math.abs(scaleY);
        
        // 中心基準の境界計算：キャラクター中心から半分ずつ左右上下に広がる
        const boundsLeft = characterX - scaledWidth / 2;
        const boundsRight = characterX + scaledWidth / 2;
        const boundsTop = characterY - scaledHeight / 2;
        const boundsBottom = characterY + scaledHeight / 2;
        
        console.log(`🎯 Character bounds (center-based system):`);
        console.log(`   Character center: (${characterX}, ${characterY})`);
        console.log(`   Scaled size: ${scaledWidth.toFixed(1)} x ${scaledHeight.toFixed(1)}`);
        console.log(`   Left: ${boundsLeft.toFixed(1)}, Right: ${boundsRight.toFixed(1)}`);
        console.log(`   Top: ${boundsTop.toFixed(1)}, Bottom: ${boundsBottom.toFixed(1)}`);
        console.log(`   Bounds rect: (${boundsLeft.toFixed(1)}, ${boundsTop.toFixed(1)}) to (${boundsRight.toFixed(1)}, ${boundsBottom.toFixed(1)})`);
        
        // クリック判定
        const isInside = (canvasX >= boundsLeft && canvasX <= boundsRight && 
                         canvasY >= boundsTop && canvasY <= boundsBottom);
        
        console.log(`👆 Click analysis:`);
        console.log(`   Click position: (${canvasX.toFixed(1)}, ${canvasY.toFixed(1)})`);
        console.log(`   X in bounds: ${canvasX.toFixed(1)} >= ${boundsLeft.toFixed(1)} && ${canvasX.toFixed(1)} <= ${boundsRight.toFixed(1)} = ${canvasX >= boundsLeft && canvasX <= boundsRight}`);
        console.log(`   Y in bounds: ${canvasY.toFixed(1)} >= ${boundsTop.toFixed(1)} && ${canvasY.toFixed(1)} <= ${boundsBottom.toFixed(1)} = ${canvasY >= boundsTop && canvasY <= boundsBottom}`);
        console.log(`   Result: ${isInside ? '✅ INSIDE' : '❌ OUTSIDE'}`);
        console.log(`🔍 ===============================`);
        
        return isInside;
    }

    /**
     * プレースホルダーの境界内クリック判定
     */
    isClickInsidePlaceholder(character, canvasX, canvasY, element) {
        // プレースホルダーの場合は簡易的に中央の範囲で判定
        const centerX = element.offsetWidth / 2;
        const centerY = element.offsetHeight / 2;
        const radius = 60; // プレースホルダーのクリック範囲（半径）

        const distance = Math.sqrt(Math.pow(canvasX - centerX, 2) + Math.pow(canvasY - centerY, 2));
        const isInside = distance <= radius;

        console.log(`📝 Placeholder bounds for ${character.name}:`);
        console.log(`   Center: (${centerX}, ${centerY}), radius: ${radius}`);
        console.log(`   Click distance: ${distance.toFixed(1)}, is inside: ${isInside}`);

        return isInside;
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
                
                // スケールアニメーション: 0 → 1.0 (手動制御)
                console.log(`🎯 Manual scale animation: 0 → 1.0 for ${characterName}`);
                character.skeleton.scaleX = 1.0;
                character.skeleton.scaleY = 1.0;
                console.log(`📊 Scale manually set to: scaleX=${character.skeleton.scaleX}, scaleY=${character.skeleton.scaleY}`);
                
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

        // 実際のSpineキャラクターの位置設定（ヒーローセクション基準の相対位置）
        if (character.canvas) {
            // Canvas要素を目標位置に直接配置（スケールベース演出のため移動不要）
            character.canvas.style.setProperty('position', 'absolute', 'important');
            character.canvas.style.setProperty('left', x + '%', 'important'); // 目標位置に直接配置
            character.canvas.style.setProperty('top', y + '%', 'important');
            character.canvas.style.setProperty('transform', `translate(-50%, -50%) scale(${scale})`, 'important');
            character.canvas.style.transformOrigin = '0 0'; // 左上を基準にスケール
            character.canvas.style.opacity = '1'; // 初期状態は不透明
            character.canvas.style.zIndex = '10';      // 他要素より前面に
            
            console.log(`🎯 Canvas positioned directly at target: (${x}%, ${y}%) - no movement needed`);
            
            console.log(`📍 Character ${characterName} positioned at (${x}%, ${y}%) with scale ${scale} (hero-section relative positioning)`);
            console.log(`🔧 Canvas position verification: position=${character.canvas.style.position}, left=${character.canvas.style.left}, top=${character.canvas.style.top}`);
        }
        
        // プレースホルダーの位置設定（ヒーローセクション基準の相対位置）
        if (character.placeholder) {
            // プレースホルダーを目標位置に直接配置（スケールベース演出のため移動不要）
            character.placeholder.style.setProperty('position', 'absolute', 'important');
            character.placeholder.style.setProperty('left', x + '%', 'important'); // 目標位置に直接配置
            character.placeholder.style.setProperty('top', y + '%', 'important');
            character.placeholder.style.setProperty('transform', `translate(-50%, -50%) scale(${scale})`, 'important');
            character.placeholder.style.transformOrigin = '0 0';
            character.placeholder.style.opacity = '1'; // 初期状態は不透明
            character.placeholder.style.zIndex = '10';      // 他要素より前面に
            
            console.log(`🎯 Placeholder positioned directly at target: (${x}%, ${y}%) - no movement needed`);
            
            console.log(`📍 Placeholder ${characterName} positioned at (${x}vw, ${y}vh) with scale ${scale} (background-sync scroll-relative positioning)`);
        }
    }

    /**
     * キャラクターを2秒後にスケール0から出現させる（スケールベース演出）
     */
    startScaleAnimation(characterName, delay = 2000) {
        const character = this.characters.get(characterName);
        if (!character) return;

        console.log(`🎯 Starting scale-based animation for ${characterName} (delay: ${delay}ms)`);
        console.log(`   - Current skeleton scale: (${character.skeleton?.scaleX || 'N/A'}, ${character.skeleton?.scaleY || 'N/A'})`);
        console.log(`   - Position: fixed at canvas center`);

        // デバッグ: スケール変更前の状態
        if (character.skeleton) {
            console.log(`📊 BEFORE scale reset: scaleX=${character.skeleton.scaleX}, scaleY=${character.skeleton.scaleY}`);
            
            // 即座にスケルトンを0にして非表示にする
            character.skeleton.scaleX = 0;
            character.skeleton.scaleY = 0;
            console.log(`🔄 Skeleton scale immediately set to (0, 0) for hidden start`);
            console.log(`📊 AFTER scale reset: scaleX=${character.skeleton.scaleX}, scaleY=${character.skeleton.scaleY}`);
        }

        setTimeout(() => {
            // syutugenアニメーション開始（スケール0→通常サイズ）
            console.log(`🎬 Starting syutugen animation for scale-based appearance`);
            console.log(`📊 PRE-ANIMATION scale: scaleX=${character.skeleton?.scaleX}, scaleY=${character.skeleton?.scaleY}`);
            
            this.playSequenceAnimation(characterName);
            
            // アニメーション開始直後の状態確認
            setTimeout(() => {
                if (character.skeleton) {
                    console.log(`📊 POST-ANIMATION START scale: scaleX=${character.skeleton.scaleX}, scaleY=${character.skeleton.scaleY}`);
                }
            }, 100);
        }, delay);

        console.log(`⏰ Character ${characterName} will start scale animation in ${delay}ms`);
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

// デバッグウィンドウクラス
class SpineDebugWindow {
    constructor() {
        this.debugWindow = null;
        this.isVisible = false;
        this.updateInterval = null;
        this.createDebugWindow();
    }

    createDebugWindow() {
        // デバッグウィンドウ作成
        this.debugWindow = document.createElement('div');
        this.debugWindow.id = 'spine-debug-window';
        this.debugWindow.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 350px;
            max-height: 400px;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 15px;
            border-radius: 8px;
            border: 2px solid #00ff00;
            z-index: 9999;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3);
            backdrop-filter: blur(5px);
            display: none;
        `;

        // ヘッダー作成
        const header = document.createElement('div');
        header.style.cssText = `
            border-bottom: 1px solid #00ff00;
            padding-bottom: 8px;
            margin-bottom: 10px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        header.innerHTML = `
            <span>🔍 Spine Debug Monitor</span>
            <button id="debug-close" style="
                background: #ff4444;
                color: white;
                border: none;
                padding: 2px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 10px;
            ">✕</button>
        `;

        // コンテンツ領域
        const content = document.createElement('div');
        content.id = 'debug-content';
        content.style.cssText = `
            line-height: 1.4;
            white-space: pre-wrap;
        `;

        this.debugWindow.appendChild(header);
        this.debugWindow.appendChild(content);
        document.body.appendChild(this.debugWindow);

        // 閉じるボタンのイベント
        document.getElementById('debug-close').addEventListener('click', () => {
            this.hide();
        });

        console.log('🔍 Spine Debug Window created - Press F12 then type "spineDebug.show()" to display');
    }

    show() {
        this.debugWindow.style.display = 'block';
        this.isVisible = true;
        this.startMonitoring();
        console.log('👁️ Spine Debug Window shown');
    }

    hide() {
        this.debugWindow.style.display = 'none';
        this.isVisible = false;
        this.stopMonitoring();
        console.log('👁️ Spine Debug Window hidden');
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    startMonitoring() {
        this.stopMonitoring(); // 重複防止
        
        this.updateInterval = setInterval(() => {
            this.updateDebugInfo();
        }, 100); // 100ms間隔で更新
    }

    stopMonitoring() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    updateDebugInfo() {
        const content = document.getElementById('debug-content');
        if (!content) return;

        let debugInfo = '';
        const timestamp = new Date().toLocaleTimeString();
        
        debugInfo += `⏰ ${timestamp}\n\n`;

        // Spine Manager状態
        if (window.spineManager) {
            debugInfo += `🎮 Spine Manager Status:\n`;
            debugInfo += `   Initialized: ${window.spineManager.initialized}\n`;
            debugInfo += `   Characters: ${window.spineManager.characters.size}\n\n`;

            // 各キャラクターの詳細情報
            window.spineManager.characters.forEach((character, name) => {
                debugInfo += `🐱 Character: ${name}\n`;
                debugInfo += `   Type: ${character.isLoaded ? 'Spine WebGL' : 'Placeholder'}\n`;
                
                if (character.skeleton) {
                    debugInfo += `   📍 Skeleton Position:\n`;
                    debugInfo += `      X: ${character.skeleton.x.toFixed(2)}\n`;
                    debugInfo += `      Y: ${character.skeleton.y.toFixed(2)}\n`;
                    debugInfo += `   📏 Skeleton Scale:\n`;
                    debugInfo += `      ScaleX: ${character.skeleton.scaleX.toFixed(3)}\n`;
                    debugInfo += `      ScaleY: ${character.skeleton.scaleY.toFixed(3)}\n`;
                    
                    // アニメーション状態
                    if (character.animationState && character.animationState.tracks.length > 0) {
                        const track = character.animationState.tracks[0];
                        if (track && track.animation) {
                            debugInfo += `   🎬 Animation:\n`;
                            debugInfo += `      Name: ${track.animation.name}\n`;
                            debugInfo += `      Time: ${track.trackTime.toFixed(2)}s\n`;
                            debugInfo += `      Duration: ${track.animation.duration.toFixed(2)}s\n`;
                            debugInfo += `      Loop: ${track.loop}\n`;
                        }
                    } else {
                        debugInfo += `   🎬 Animation: None\n`;
                    }
                } else {
                    debugInfo += `   📍 No Skeleton Data\n`;
                }

                if (character.canvas) {
                    const rect = character.canvas.getBoundingClientRect();
                    debugInfo += `   🎨 Canvas Info:\n`;
                    debugInfo += `      Size: ${character.canvas.width}x${character.canvas.height}px\n`;
                    debugInfo += `      Screen Pos: (${rect.left.toFixed(0)}, ${rect.top.toFixed(0)})\n`;
                    debugInfo += `      CSS Position: ${character.canvas.style.position}\n`;
                    debugInfo += `      CSS Left: ${character.canvas.style.left}\n`;
                    debugInfo += `      CSS Top: ${character.canvas.style.top}\n`;
                    debugInfo += `      CSS Transform: ${character.canvas.style.transform || 'none'}\n`;
                    debugInfo += `      CSS Opacity: ${character.canvas.style.opacity || '1'}\n`;
                } else if (character.placeholder) {
                    const rect = character.placeholder.getBoundingClientRect();
                    debugInfo += `   📝 Placeholder Info:\n`;
                    debugInfo += `      Screen Pos: (${rect.left.toFixed(0)}, ${rect.top.toFixed(0)})\n`;
                    debugInfo += `      CSS Position: ${character.placeholder.style.position}\n`;
                    debugInfo += `      CSS Left: ${character.placeholder.style.left}\n`;
                    debugInfo += `      CSS Top: ${character.placeholder.style.top}\n`;
                    debugInfo += `      CSS Transform: ${character.placeholder.style.transform || 'none'}\n`;
                }

                debugInfo += `\n`;
            });
        } else {
            debugInfo += `❌ Spine Manager not available\n\n`;
        }

        // ビューポート情報
        debugInfo += `🖥️ Viewport Info:\n`;
        debugInfo += `   Size: ${window.innerWidth}x${window.innerHeight}px\n`;
        debugInfo += `   Scroll: ${window.scrollX}, ${window.scrollY}\n\n`;

        // HTML設定情報
        const configElement = document.getElementById('purattokun-config');
        if (configElement) {
            debugInfo += `⚙️ HTML Config:\n`;
            debugInfo += `   data-x: ${configElement.dataset.x}%\n`;
            debugInfo += `   data-y: ${configElement.dataset.y}%\n`;
            debugInfo += `   data-scale: ${configElement.dataset.scale}\n`;
            debugInfo += `   data-fade-delay: ${configElement.dataset.fadeDelay}ms\n`;
            debugInfo += `   data-fade-duration: ${configElement.dataset.fadeDuration}ms\n`;
        }

        content.textContent = debugInfo;
    }
}

// グローバルインスタンス
window.spineManager = new SpineCharacterManager();
window.spineDebug = new SpineDebugWindow();

// キーボードショートカット（Ctrl+D でデバッグウィンドウ切り替え）
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'd') {
        event.preventDefault();
        window.spineDebug.toggle();
        console.log('🔍 Debug window toggled via Ctrl+D');
    }
});