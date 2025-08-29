// 🎮 Spine Editor Desktop v3.0 - Spine Integration
// Spine WebGLとの統合・キャラクター管理・動的読み込み

console.log('🎮 Spine Integration 初期化開始');

// ========== Spineキャラクター管理 ========== //

class SpineCharacterManager {
    constructor() {
        this.characters = new Map();
        this.loadedAssets = new Map();
        this.isSpineReady = false;
        
        this.checkSpineAvailability();
    }

    // Spine WebGL利用可能性確認
    checkSpineAvailability() {
        if (typeof spine !== 'undefined') {
            this.isSpineReady = true;
            console.log('✅ Spine WebGL利用可能');
        } else {
            console.warn('⚠️ Spine WebGL未読み込み - フォールバック表示');
            // Spine読み込み待機
            this.waitForSpine();
        }
    }

    // Spine読み込み待機
    async waitForSpine(maxRetries = 100) {
        for (let i = 0; i < maxRetries; i++) {
            if (typeof spine !== 'undefined' && spine.TextureAtlas && spine.AssetManager) {
                this.isSpineReady = true;
                console.log('✅ Spine WebGL読み込み完了');
                console.log('🔍 Spine version:', spine.version || 'unknown');
                console.log('🔍 Available classes:', Object.keys(spine).filter(key => typeof spine[key] === 'function'));
                
                // デバッグ用コンポーネントテスト
                this.testSpineComponents();
                return true;
            }
            if (i % 10 === 0) {
                console.log(`🔄 Spine読み込み待機中... (${i}/${maxRetries})`);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.error('❌ Spine WebGL読み込みタイムアウト');
        console.error('🔍 spine object:', typeof spine);
        return false;
    }

    // デバッグ用コンポーネントテスト
    testSpineComponents() {
        console.log('🔍 Spine WebGL コンポーネントテスト開始');
        
        // 1. Spine WebGL利用可能性
        console.log('1. Spine WebGL:', typeof spine !== 'undefined' ? '✅' : '❌');
        
        // 2. 必要なクラスの存在確認
        const requiredClasses = ['AssetManager', 'SceneRenderer', 'Skeleton', 'AnimationState', 'TextureAtlas'];
        requiredClasses.forEach(className => {
            console.log(`2. ${className}:`, spine[className] ? '✅' : '❌');
        });
        
        // 3. WebGLコンテキスト作成テスト
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl');
        console.log('3. WebGL Context:', gl ? '✅' : '❌');
        
        // 4. AssetManager作成テスト
        if (gl) {
            try {
                const assetManager = new spine.AssetManager(gl);
                console.log('4. AssetManager作成: ✅');
            } catch (error) {
                console.log('4. AssetManager作成: ❌', error);
            }
        }
    }

    // キャラクター動的作成
    async createCharacter(characterData) {
        try {
            console.log(`🎭 キャラクター作成開始: ${characterData.name}`);
            
            // Canvas要素作成
            const canvas = this.createCanvasElement(characterData);
            
            // フォールバック画像作成
            const fallback = this.createFallbackElement(characterData);
            
            // 設定要素作成
            const config = this.createConfigElement(characterData);
            
            // シーンコンテナに追加
            const sceneContainer = document.getElementById('scene-container');
            if (sceneContainer) {
                // プレースホルダーを非表示
                const placeholder = document.getElementById('background-placeholder');
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
                
                sceneContainer.appendChild(canvas);
                sceneContainer.appendChild(fallback);
                sceneContainer.appendChild(config);
            }
            
            // Spine WebGL初期化
            if (this.isSpineReady) {
                try {
                    await this.initializeSpineCharacter(characterData, canvas, fallback);
                } catch (error) {
                    console.warn(`⚠️ Spine初期化失敗、フォールバックに切り替え: ${characterData.name}`, error);
                    // Spine初期化失敗時はフォールバック使用
                    if (window.spineFallbackManager) {
                        // 既存要素を削除してフォールバック作成
                        canvas.remove();
                        fallback.remove();
                        config.remove();
                        return window.spineFallbackManager.createFallbackCharacter(characterData);
                    } else {
                        this.showFallbackCharacter(canvas, fallback);
                    }
                }
            } else {
                // Spine WebGL利用不可時はフォールバック表示
                this.showFallbackCharacter(canvas, fallback);
            }
            
            // キャラクター登録
            this.characters.set(characterData.name, {
                data: characterData,
                canvas,
                fallback,
                config,
                isLoaded: this.isSpineReady
            });
            
            console.log(`✅ キャラクター作成完了: ${characterData.name}`);
            return true;
            
        } catch (error) {
            console.error(`❌ キャラクター作成エラー: ${characterData.name}`, error);
            return false;
        }
    }

    // Canvas要素作成
    createCanvasElement(characterData) {
        const canvas = document.createElement('canvas');
        canvas.id = `${characterData.name}-canvas`;
        // nezumi対応: 十分な表示領域確保
        canvas.width = characterData.name === 'nezumi' ? 150 : 300;
        canvas.height = characterData.name === 'nezumi' ? 180 : 200;
        canvas.setAttribute('data-character-name', characterData.name);
        canvas.setAttribute('data-spine-character', 'true');
        
        // スタイル設定
        Object.assign(canvas.style, {
            position: 'absolute',
            left: `${characterData.position.x}%`,
            top: `${characterData.position.y}%`,
            transform: 'translate(-50%, -50%)',
            width: `${(characterData.scale || 1) * (characterData.name === 'nezumi' ? 20 : 30)}%`,
            aspectRatio: characterData.name === 'nezumi' ? '5/6' : '3/2',
            zIndex: '10',
            cursor: 'pointer',
            opacity: '0', // 初期は非表示
            transition: 'opacity 0.3s ease'
        });
        
        return canvas;
    }

    // フォールバック画像要素作成
    createFallbackElement(characterData) {
        const fallback = document.createElement('img');
        fallback.id = `${characterData.name}-fallback`;
        fallback.src = `assets/images/${characterData.name}.png`;
        fallback.alt = characterData.name;
        fallback.setAttribute('data-character-name', characterData.name);
        fallback.setAttribute('data-spine-character', 'true');
        
        // スタイル設定
        Object.assign(fallback.style, {
            position: 'absolute',
            left: `${characterData.position.x}%`,
            top: `${characterData.position.y}%`,
            transform: 'translate(-50%, -50%)',
            width: `${(characterData.scale || 1) * 10}%`,
            aspectRatio: '1/1',
            objectFit: 'contain',
            zIndex: '10',
            opacity: '1', // 初期表示
            transition: 'opacity 0.3s ease'
        });
        
        return fallback;
    }

    // 設定要素作成
    createConfigElement(characterData) {
        const config = document.createElement('div');
        config.id = `${characterData.name}-config`;
        config.style.display = 'none';
        
        config.setAttribute('data-x', characterData.position.x);
        config.setAttribute('data-y', characterData.position.y);
        config.setAttribute('data-scale', characterData.scale || 1);
        config.setAttribute('data-fade-delay', '1500');
        config.setAttribute('data-fade-duration', '2000');
        
        return config;
    }

    // Spineキャラクター初期化（Web版成功パターン移植）
    async initializeSpineCharacter(characterData, canvas, fallback) {
        try {
            console.log(`🎮 Web版パターンでSpine初期化: ${characterData.name}`);
            
            // WebGLコンテキスト取得（Web版と同じ設定）
            const gl = canvas.getContext('webgl', { 
                alpha: true, 
                premultipliedAlpha: false 
            });
            
            if (!gl) {
                throw new Error('WebGL context creation failed');
            }

            // AssetManagerを使用（Web版と同じ方法）
            const assetManager = new spine.AssetManager(gl);
            
            // 標準的なアセット読み込み（Web版と同じ）
            const basePath = `assets/spine/characters/${characterData.name}/`;
            const atlasPath = `${basePath}${characterData.name}.atlas`;
            const jsonPath = `${basePath}${characterData.name}.json`;
            const imagePath = `${basePath}${characterData.name}.png`;
            
            console.log('📁 Web版パターンでアセット読み込み:', { atlasPath, jsonPath, imagePath });
            
            // 標準読み込み（手動処理を削除）
            assetManager.loadTextureAtlas(atlasPath);
            assetManager.loadText(jsonPath);
            assetManager.loadTexture(imagePath);
            
            // 読み込み完了待機
            await this.waitForAssetLoading(assetManager);
            
            // Skeleton作成（Web版と同じ手順）
            const atlas = assetManager.require(atlasPath);
            const skeletonJson = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(atlas));
            const skeletonData = skeletonJson.readSkeletonData(assetManager.require(jsonPath));
            const skeleton = new spine.Skeleton(skeletonData);
            
            // nezumi専用座標・スケール調整（表示切れ問題解決）
            if (characterData.name === 'nezumi') {
                skeleton.x = 0;
                skeleton.y = -25; // nezumi用: さらに上げて完全表示確保
                skeleton.scaleX = skeleton.scaleY = (characterData.scale || 1) * 0.8; // nezumi用: スケール縮小
            } else {
                // 🚀 シンプル化革命: v2.0で証明されたシンプル座標設定（座標問題完全解決済み）
                skeleton.x = 0;  // 画面中央原点
                skeleton.y = 0;  // 画面中央原点
                skeleton.scaleX = skeleton.scaleY = 1.0; // スケールも1.0で固定
            }
            
            // 🚀 シンプル化革命: バウンディングボックス連携のため座標再確認
            console.log(`🚀 シンプル化革命確認: ${characterData.name} → skeleton(${skeleton.x}, ${skeleton.y}, ${skeleton.scaleX})`);
            
            // デバッグ用: スケルトン情報を外部からアクセス可能に
            if (!window.spineSkeletonDebug) window.spineSkeletonDebug = new Map();
            window.spineSkeletonDebug.set(characterData.name, skeleton);
            
            // アニメーション設定（Web版と同じ）
            const animationStateData = new spine.AnimationStateData(skeleton.data);
            const animationState = new spine.AnimationState(animationStateData);
            
            // デフォルトアニメーション
            this.setDefaultAnimation(skeleton, animationState);
            
            // Web版と同じレンダラー作成
            const renderer = new spine.SceneRenderer(canvas, gl);
            
            // 描画ループ開始
            this.startRenderLoop(canvas, gl, renderer, skeleton, animationState);
            
            // キャラクタークリックイベント
            this.setupCharacterEvents(canvas, characterData);
            
            // 表示切り替え
            canvas.style.opacity = '1';
            fallback.style.opacity = '0';
            
            // アセット情報保存
            this.loadedAssets.set(characterData.name, {
                assetManager,
                skeleton,
                animationState,
                renderer
            });
            
            console.log(`✅ Web版パターンでSpine初期化完了: ${characterData.name}`);
            console.log(`🔍 座標設定確認: skeleton.x=${skeleton.x}, skeleton.y=${skeleton.y}`);
            console.log(`🔍 Canvas情報: ${canvas.width}x${canvas.height}, DPR=${window.devicePixelRatio || 1}`);
            
        } catch (error) {
            console.error(`❌ Web版パターンSpine初期化エラー: ${characterData.name}`, error);
            console.error('🔍 エラー詳細:', {
                name: characterData.name,
                error: error.message,
                stack: error.stack,
                spineAvailable: typeof spine !== 'undefined',
                webglAvailable: !!canvas.getContext('webgl'),
                files: characterData.files
            });
            this.showFallbackCharacter(canvas, fallback);
            throw error;
        }
    }

    // アセット読み込み完了待機
    async waitForAssetLoading(assetManager, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkAssets = () => {
                if (assetManager.isLoadingComplete()) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Asset loading timeout'));
                } else {
                    setTimeout(checkAssets, 100);
                }
            };
            
            checkAssets();
        });
    }

    // デフォルトアニメーション設定
    setDefaultAnimation(skeleton, animationState) {
        // 推奨順序でアニメーション検索
        const animationPriority = ['taiki', 'idle', 'syutugen', 'appear'];
        
        for (const animName of animationPriority) {
            if (skeleton.data.findAnimation(animName)) {
                if (animName === 'syutugen' || animName === 'appear') {
                    // 登場アニメーション → 待機ループ
                    animationState.setAnimation(0, animName, false);
                    animationState.addAnimation(0, 'taiki', true, 0);
                } else {
                    // 直接ループアニメーション
                    animationState.setAnimation(0, animName, true);
                }
                console.log(`🎬 アニメーション設定: ${animName}`);
                return;
            }
        }
        
        // フォールバック：最初のアニメーション
        if (skeleton.data.animations.length > 0) {
            const firstAnim = skeleton.data.animations[0].name;
            animationState.setAnimation(0, firstAnim, true);
            console.log(`🎬 フォールバックアニメーション: ${firstAnim}`);
        }
    }

    // 描画ループ開始
    startRenderLoop(canvas, gl, renderer, skeleton, animationState) {
        let lastTime = Date.now() / 1000;
        
        const render = () => {
            const now = Date.now() / 1000;
            const delta = now - lastTime;
            lastTime = now;

            // アニメーション更新
            animationState.update(delta);
            animationState.apply(skeleton);
            skeleton.updateWorldTransform();

            // レンダリング
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.viewport(0, 0, canvas.width, canvas.height);

            renderer.begin();
            renderer.drawSkeleton(skeleton, true);
            renderer.end();

            requestAnimationFrame(render);
        };
        
        render();
    }

    // キャラクターイベント設定
    setupCharacterEvents(canvas, characterData) {
        canvas.addEventListener('click', (event) => {
            console.log(`🎯 キャラクタークリック: ${characterData.name}`);
            
            // アプリケーション状態更新
            if (window.selectCharacter) {
                // キャラクターインデックスを取得
                const characterIndex = Array.from(this.characters.keys()).indexOf(characterData.name);
                window.selectCharacter(characterIndex);
            }
            
            // クリックアニメーション再生
            this.playClickAnimation(characterData.name);
        });
        
        // マウスオーバーエフェクト
        canvas.addEventListener('mouseenter', () => {
            canvas.style.filter = 'brightness(1.1)';
        });
        
        canvas.addEventListener('mouseleave', () => {
            canvas.style.filter = 'none';
        });
    }

    // クリックアニメーション再生
    playClickAnimation(characterName) {
        const assetData = this.loadedAssets.get(characterName);
        if (!assetData) return;
        
        const { skeleton, animationState } = assetData;
        
        // やられアニメーション → 待機復帰
        if (skeleton.data.findAnimation('yarare')) {
            animationState.setAnimation(0, 'yarare', false);
            animationState.addAnimation(0, 'taiki', true, 0);
            console.log(`🎬 クリックアニメーション: yarare → taiki`);
        } else if (skeleton.data.findAnimation('click')) {
            animationState.setAnimation(0, 'click', false);
            animationState.addAnimation(0, 'taiki', true, 0);
            console.log(`🎬 クリックアニメーション: click → taiki`);
        }
    }

    // フォールバック表示
    showFallbackCharacter(canvas, fallback) {
        canvas.style.opacity = '0';
        fallback.style.opacity = '1';
        console.log('📷 フォールバック画像表示');
    }

    // キャラクター削除
    removeCharacter(characterName) {
        const character = this.characters.get(characterName);
        if (character) {
            // DOM要素削除
            character.canvas.remove();
            character.fallback.remove();
            character.config.remove();
            
            // アセット削除
            this.loadedAssets.delete(characterName);
            this.characters.delete(characterName);
            
            console.log(`🗑️ キャラクター削除: ${characterName}`);
        }
    }

    // 全キャラクター削除
    clearAllCharacters() {
        for (const characterName of this.characters.keys()) {
            this.removeCharacter(characterName);
        }
        
        // プレースホルダー表示
        const placeholder = document.getElementById('background-placeholder');
        if (placeholder) {
            placeholder.style.display = 'flex';
        }
        
        console.log('🗑️ 全キャラクター削除完了');
    }

    // キャラクター位置更新
    updateCharacterPosition(characterName, x, y) {
        const character = this.characters.get(characterName);
        if (character) {
            character.canvas.style.left = `${x}%`;
            character.canvas.style.top = `${y}%`;
            character.fallback.style.left = `${x}%`;
            character.fallback.style.top = `${y}%`;
            
            // 設定も更新
            character.config.setAttribute('data-x', x);
            character.config.setAttribute('data-y', y);
            
            // データ更新
            character.data.position.x = x;
            character.data.position.y = y;
            
            console.log(`📐 位置更新: ${characterName} (${x}%, ${y}%)`);
        }
    }
}

// ========== プロジェクト読み込み統合 ========== //

async function loadProjectCharacters(projectData) {
    try {
        console.log('📦 プロジェクトキャラクター読み込み開始');
        
        if (!projectData.characters || projectData.characters.length === 0) {
            throw new Error('キャラクターデータが見つかりません');
        }
        
        // 既存キャラクター削除
        spineCharacterManager.clearAllCharacters();
        
        // 各キャラクター作成
        for (const characterData of projectData.characters) {
            await spineCharacterManager.createCharacter(characterData);
        }
        
        console.log(`✅ ${projectData.characters.length}個のキャラクター読み込み完了`);
        
    } catch (error) {
        console.error('❌ プロジェクトキャラクター読み込みエラー:', error);
        throw error;
    }
}

// ========== グローバル初期化 ========== //

// SpineCharacterManagerインスタンス作成
const spineCharacterManager = new SpineCharacterManager();

// グローバル関数公開
window.spineCharacterManager = spineCharacterManager;
window.loadProjectCharacters = loadProjectCharacters;
window.clearAllCharacters = () => {
    spineCharacterManager.clearAllCharacters();
    if (window.spineFallbackManager) {
        window.spineFallbackManager.clearAllCharacters();
    }
};

console.log('✅ Spine Integration 初期化完了');