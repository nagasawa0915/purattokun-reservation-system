// 🎮 Spine Editor Desktop v2.0 - シンプルSpine統合システム (v3ベース)
// v3の正常動作機能をベースに、シンプルで確実に動作するSpine表示機能

console.log('🎮 シンプルSpine統合システム (v3ベース) 初期化開始');
console.log('🔍 現在のspine状態:', typeof spine !== 'undefined' ? 'loaded' : 'not loaded');

// ========== シンプルSpineキャラクター管理 ========== //

class SimpleSpineManagerV3 {
    constructor() {
        this.characters = new Map();
        this.loadedAssets = new Map();
        this.isSpineReady = false;
        
        this.checkSpineAvailability();
    }

    // Spine WebGL利用可能性確認（v3同様）
    checkSpineAvailability() {
        if (typeof spine !== 'undefined') {
            this.isSpineReady = true;
            console.log('✅ Spine WebGL利用可能');
        } else {
            console.warn('⚠️ Spine WebGL未読み込み - フォールバック表示');
            this.waitForSpine();
        }
    }

    // Spine読み込み待機（v3同様）
    async waitForSpine(maxRetries = 50) {
        for (let i = 0; i < maxRetries; i++) {
            if (typeof spine !== 'undefined' && spine.TextureAtlas && spine.AssetManager) {
                this.isSpineReady = true;
                console.log('✅ Spine WebGL読み込み完了');
                return true;
            }
            if (i % 10 === 0) {
                console.log(`🔄 Spine読み込み待機中... (${i}/${maxRetries})`);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.error('❌ Spine WebGL読み込みタイムアウト');
        return false;
    }

    // 組み込みキャラクター作成（シンプル版）
    async createBuiltInCharacter(characterName) {
        try {
            console.log(`🎭 組み込みキャラクター作成開始: ${characterName}`);
            
            const characterData = {
                name: characterName,
                position: { x: 50, y: 60 }, // 画面中央やや下
                scale: characterName === 'nezumi' ? 0.8 : 1.0
            };
            
            // Canvas要素作成
            const canvas = this.createCanvasElement(characterData);
            
            // フォールバック画像作成
            const fallback = this.createFallbackElement(characterData);
            
            // v2のspine-stageに追加
            const spineStage = document.getElementById('spine-stage');
            if (spineStage) {
                spineStage.appendChild(canvas);
                spineStage.appendChild(fallback);
                console.log('✅ v2 spine-stageに追加完了');
            } else {
                console.warn('⚠️ spine-stage要素が見つかりません');
                return false;
            }
            
            // Spine WebGL初期化
            if (this.isSpineReady) {
                try {
                    await this.initializeSpineCharacter(characterData, canvas, fallback);
                } catch (error) {
                    console.warn(`⚠️ Spine初期化失敗、フォールバックに切り替え: ${characterData.name}`, error);
                    this.showFallbackCharacter(canvas, fallback);
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
                isLoaded: this.isSpineReady
            });
            
            console.log(`✅ 組み込みキャラクター作成完了: ${characterData.name}`);
            return true;
            
        } catch (error) {
            console.error(`❌ 組み込みキャラクター作成エラー: ${characterName}`, error);
            return false;
        }
    }

    // Canvas要素作成（v3ベース、v2対応）
    createCanvasElement(characterData) {
        const canvas = document.createElement('canvas');
        canvas.id = `${characterData.name}-canvas`;
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

    // フォールバック画像要素作成（v3ベース、v2対応）
    createFallbackElement(characterData) {
        const fallback = document.createElement('img');
        fallback.id = `${characterData.name}-fallback`;
        fallback.src = `assets/images/${characterData.name === 'purattokun' ? 'purattokunn' : characterData.name}.png`;
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

    // Spineキャラクター初期化（v3移植、組み込みアセット用）
    async initializeSpineCharacter(characterData, canvas, fallback) {
        try {
            console.log(`🎮 v3移植パターンでSpine初期化: ${characterData.name}`);
            
            // WebGLコンテキスト取得
            const gl = canvas.getContext('webgl', { 
                alpha: true, 
                premultipliedAlpha: false 
            });
            
            if (!gl) {
                throw new Error('WebGL context creation failed');
            }

            // AssetManagerを使用
            const assetManager = new spine.AssetManager(gl);
            
            // 組み込みアセット読み込み（デスクトップアプリ用）
            const basePath = `assets/spine/characters/${characterData.name}/`;
            const atlasPath = `${basePath}${characterData.name}.atlas`;
            const jsonPath = `${basePath}${characterData.name}.json`;
            const imagePath = `${basePath}${characterData.name}.png`;
            
            console.log('📁 組み込みアセット読み込み:', { atlasPath, jsonPath, imagePath });
            
            // 標準読み込み
            assetManager.loadTextureAtlas(atlasPath);
            assetManager.loadText(jsonPath);
            assetManager.loadTexture(imagePath);
            
            // 読み込み完了待機
            await this.waitForAssetLoading(assetManager);
            
            // Skeleton作成
            const atlas = assetManager.require(atlasPath);
            const skeletonJson = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(atlas));
            const skeletonData = skeletonJson.readSkeletonData(assetManager.require(jsonPath));
            const skeleton = new spine.Skeleton(skeletonData);
            
            // キャラクター別座標調整
            if (characterData.name === 'nezumi') {
                skeleton.x = 0;
                skeleton.y = -25;
                skeleton.scaleX = skeleton.scaleY = (characterData.scale || 1) * 0.8;
            } else {
                skeleton.x = 0;
                skeleton.y = 0;
                skeleton.scaleX = skeleton.scaleY = 1.0;
            }
            
            console.log(`🚀 座標設定: ${characterData.name} → skeleton(${skeleton.x}, ${skeleton.y}, ${skeleton.scaleX})`);
            
            // アニメーション設定
            const animationStateData = new spine.AnimationStateData(skeleton.data);
            const animationState = new spine.AnimationState(animationStateData);
            
            // デフォルトアニメーション
            this.setDefaultAnimation(skeleton, animationState);
            
            // レンダラー作成
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
            
            console.log(`✅ v3移植パターンでSpine初期化完了: ${characterData.name}`);
            
        } catch (error) {
            console.error(`❌ v3移植パターンSpine初期化エラー: ${characterData.name}`, error);
            this.showFallbackCharacter(canvas, fallback);
            throw error;
        }
    }

    // アセット読み込み完了待機（v3同様）
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

    // デフォルトアニメーション設定（v3同様）
    setDefaultAnimation(skeleton, animationState) {
        const animationPriority = ['taiki', 'idle', 'syutugen', 'appear'];
        
        for (const animName of animationPriority) {
            if (skeleton.data.findAnimation(animName)) {
                if (animName === 'syutugen' || animName === 'appear') {
                    animationState.setAnimation(0, animName, false);
                    animationState.addAnimation(0, 'taiki', true, 0);
                } else {
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

    // 描画ループ開始（v3同様）
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

    // キャラクターイベント設定（v3ベース）
    setupCharacterEvents(canvas, characterData) {
        canvas.addEventListener('click', (event) => {
            console.log(`🎯 キャラクタークリック: ${characterData.name}`);
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

    // クリックアニメーション再生（v3同様）
    playClickAnimation(characterName) {
        const assetData = this.loadedAssets.get(characterName);
        if (!assetData) return;
        
        const { skeleton, animationState } = assetData;
        
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

    // フォールバック表示（v3同様）
    showFallbackCharacter(canvas, fallback) {
        canvas.style.opacity = '0';
        fallback.style.opacity = '1';
        console.log('📷 フォールバック画像表示');
    }

    // キャラクター削除
    removeCharacter(characterName) {
        const character = this.characters.get(characterName);
        if (character) {
            character.canvas.remove();
            character.fallback.remove();
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
        console.log('🗑️ 全キャラクター削除完了');
    }

    // キャラクター位置設定
    async setCharacterPosition(characterName, x, y) {
        try {
            const character = this.characters.get(characterName);
            if (!character) {
                console.warn(`⚠️ キャラクター '${characterName}' が見つかりません`);
                return false;
            }

            console.log(`🎯 ${characterName}の位置を (${x}, ${y}) に設定中...`);

            // Canvas要素の位置をパーセンテージで設定
            if (character.canvas) {
                character.canvas.style.left = `${x}%`;
                character.canvas.style.top = `${y}%`;
                
                // キャラクターデータ更新
                character.position = { x: x, y: y };
                
                console.log(`✅ ${characterName}の位置設定完了: (${x}%, ${y}%)`);
                return true;
            } else {
                console.warn(`⚠️ ${characterName}のCanvas要素が見つかりません`);
                return false;
            }
        } catch (error) {
            console.error(`❌ ${characterName}の位置設定エラー:`, error);
            return false;
        }
    }

    // キャラクター取得
    getCharacter(characterName) {
        return this.characters.get(characterName);
    }

    // 全キャラクター取得
    getAllCharacters() {
        return Array.from(this.characters.values());
    }
}

// ========== グローバル初期化 ========== //

// シンプルSpineマネージャーインスタンス作成
const simpleSpineManagerV3 = new SimpleSpineManagerV3();

// グローバル関数公開
window.simpleSpineManagerV3 = simpleSpineManagerV3;

// v2アプリ統合用関数
window.createPurattokun = async () => {
    return await simpleSpineManagerV3.createBuiltInCharacter('purattokun');
};

window.createNezumi = async () => {
    return await simpleSpineManagerV3.createBuiltInCharacter('nezumi');
};

window.clearAllSpineCharacters = () => {
    simpleSpineManagerV3.clearAllCharacters();
};

// デバッグ用テスト関数
window.testSimpleSpineV3 = function() {
    console.log('🔍 シンプルSpine統合システム (v3ベース) テスト開始');
    console.log('🔍 Spine WebGL状態:', typeof spine !== 'undefined' ? '利用可能' : '未読み込み');
    console.log('🔍 spine-stage要素:', document.getElementById('spine-stage') ? '発見' : '未発見');
    console.log('🔍 シンプルマネージャー:', !!window.simpleSpineManagerV3);
    
    // テストキャラクター作成
    console.log('🎭 テストキャラクター作成開始...');
    window.createPurattokun().then(result => {
        if (result) {
            console.log('✅ テストキャラクター作成成功');
        } else {
            console.error('❌ テストキャラクター作成失敗');
        }
    });
};

console.log('✅ シンプルSpine統合システム (v3ベース) 初期化完了');
console.log('🔍 window.simpleSpineManagerV3:', !!window.simpleSpineManagerV3);
console.log('🔍 利用可能な関数:', {
    simpleSpineManagerV3: !!window.simpleSpineManagerV3,
    createPurattokun: !!window.createPurattokun,
    createNezumi: !!window.createNezumi,
    clearAllSpineCharacters: !!window.clearAllSpineCharacters,
    testSimpleSpineV3: !!window.testSimpleSpineV3
});