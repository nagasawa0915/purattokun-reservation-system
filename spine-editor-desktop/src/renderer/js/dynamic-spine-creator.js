/**
 * 🎯 動的Spineキャラクター作成システム
 * 元環境（index-clean.html）で成功したロジックのElectron移植版
 */

class DynamicSpineCreator {
    constructor() {
        this.characters = {};
        this.nextCharacterId = 1;
        this.debugMode = false;
    }

    /**
     * 🎮 動的Spineキャラクター作成（成功実証済みロジック）
     */
    async createSpineCharacter(characterId, config) {
        console.log(`🎯 動的Spineキャラクター作成開始: ${characterId}`);

        try {
            // Canvas要素を動的作成
            console.log(`Canvas要素作成中... (${characterId})`);
            const canvas = document.createElement('canvas');
            canvas.id = `canvas_${characterId}`;
            canvas.width = 300;
            canvas.height = 200;
            canvas.className = 'dynamic-spine-canvas';
            
            // 位置設定
            canvas.style.position = 'absolute';
            canvas.style.left = `${config.position.x}%`;
            canvas.style.top = `${config.position.y}%`;
            canvas.style.width = `${config.size.width}%`;
            canvas.style.transform = 'translate(-50%, -50%)';
            canvas.style.aspectRatio = '3/2';
            canvas.style.cursor = 'pointer';
            canvas.style.zIndex = '10';

            // プレビューエリアに追加
            const previewCanvas = document.getElementById('preview-canvas');
            if (previewCanvas) {
                previewCanvas.appendChild(canvas);
                console.log(`Canvas要素追加完了 (${canvas.id})`);
            } else {
                throw new Error('プレビューエリアが見つかりません');
            }

            // Spine WebGL読み込み待ち
            await this.waitForSpine();
            console.log(`Spine WebGL利用可能確認済み`);

            // WebGLコンテキスト取得
            const gl = canvas.getContext("webgl", { alpha: true });
            if (!gl) {
                throw new Error("WebGL未対応 - GPU加速が無効化されている可能性があります");
            }
            console.log(`WebGLコンテキスト取得成功`);

            // アセットマネージャー作成
            console.log(`アセット読み込み開始: ${config.basePath}`);
            const assetManager = new spine.AssetManager(gl, config.basePath);
            assetManager.loadTextureAtlas(config.atlasFile);
            assetManager.loadJson(config.jsonFile);

            await this.waitForAssets(assetManager);
            console.log(`アセット読み込み完了 (atlas: ${config.atlasFile}, json: ${config.jsonFile})`);

            // Spineスケルトン構築
            const atlas = assetManager.get(config.atlasFile);
            const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
            const skeletonJson = new spine.SkeletonJson(atlasLoader);
            const skeletonData = skeletonJson.readSkeletonData(
                assetManager.get(config.jsonFile)
            );

            const skeleton = new spine.Skeleton(skeletonData);
            skeleton.x = 0;
            skeleton.y = -100; // キャラクターによる調整
            skeleton.scaleX = skeleton.scaleY = config.scale;

            console.log(`Spineスケルトン構築完了 (scale: ${config.scale})`);

            // アニメーション設定
            const animationStateData = new spine.AnimationStateData(skeleton.data);
            const animationState = new spine.AnimationState(animationStateData);

            // レンダラー作成
            const renderer = new spine.SceneRenderer(canvas, gl);
            console.log(`レンダラー作成完了`);

            // デフォルトアニメーション設定
            const animations = skeleton.data.animations.map(anim => anim.name);
            console.log(`利用可能アニメーション: ${animations.join(', ')}`);
            
            if (animations.includes('taiki')) {
                animationState.setAnimation(0, 'taiki', true);
                console.log(`デフォルトアニメーション設定: taiki (loop)`);
            } else if (animations.length > 0) {
                animationState.setAnimation(0, animations[0], true);
                console.log(`デフォルトアニメーション設定: ${animations[0]} (loop)`);
            }

            // 描画ループ開始
            let lastTime = Date.now() / 1000;
            const renderLoop = () => {
                const now = Date.now() / 1000;
                const delta = now - lastTime;
                lastTime = now;

                animationState.update(delta);
                animationState.apply(skeleton);
                skeleton.updateWorldTransform();

                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.viewport(0, 0, canvas.width, canvas.height);

                renderer.begin();
                renderer.drawSkeleton(skeleton, true);
                renderer.end();

                requestAnimationFrame(renderLoop);
            };
            renderLoop();
            console.log(`描画ループ開始`);

            // クリックハンドラー設定
            canvas.addEventListener('click', () => {
                console.log(`${characterId} クリックされました`);
                if (animations.includes('yarare')) {
                    animationState.setAnimation(0, 'yarare', false);
                    animationState.addAnimation(0, 'taiki', true, 0);
                }
            });

            // キャラクター情報保存
            this.characters[characterId] = {
                canvas, skeleton, animationState, renderer, config, animations
            };

            console.log(`✅ 動的キャラクター作成完了: ${characterId}`);
            return this.characters[characterId];

        } catch (error) {
            console.error(`❌ ${characterId} キャラクター作成失敗:`, error);
            throw error;
        }
    }

    /**
     * 🔧 ユーティリティ関数: Spine WebGL読み込み待ち
     */
    async waitForSpine() {
        return new Promise((resolve, reject) => {
            let checkCount = 0;
            const maxChecks = 50;

            const checkSpine = () => {
                checkCount++;
                if (typeof spine !== "undefined") {
                    console.log("✅ Spine WebGL読み込み完了");
                    resolve();
                } else if (checkCount >= maxChecks) {
                    reject(new Error("Spine WebGL読み込みタイムアウト"));
                } else {
                    setTimeout(checkSpine, 100);
                }
            };

            checkSpine();
        });
    }

    /**
     * 🔧 ユーティリティ関数: アセット読み込み待ち
     */
    async waitForAssets(assetManager) {
        return new Promise((resolve, reject) => {
            let checkCount = 0;
            const maxChecks = 50;

            const checkAssets = () => {
                checkCount++;
                if (assetManager.isLoadingComplete()) {
                    console.log("✅ アセット読み込み完了");
                    resolve();
                } else if (checkCount >= maxChecks) {
                    reject(new Error("アセット読み込みタイムアウト"));
                } else {
                    setTimeout(checkAssets, 100);
                }
            };

            checkAssets();
        });
    }

    /**
     * 🎮 テストキャラクター作成（デバッグ用）
     */
    async createTestCharacter(characterType, position = null) {
        const characterConfigs = {
            'purattokun': {
                basePath: './assets/spine/characters/purattokun/',
                atlasFile: 'purattokun.atlas',
                jsonFile: 'purattokun.json',
                scale: 0.55,
                position: position || { x: 35, y: 75 },
                size: { width: 25 }
            },
            'nezumi': {
                basePath: './assets/spine/characters/nezumi/',
                atlasFile: 'nezumi.atlas', 
                jsonFile: 'nezumi.json',
                scale: 0.45,
                position: position || { x: 60, y: 45 },
                size: { width: 20 }
            }
        };

        const config = characterConfigs[characterType];
        if (!config) {
            throw new Error(`未知のキャラクタータイプ: ${characterType}`);
        }

        const characterId = `dynamic_${characterType}_${this.nextCharacterId++}`;
        return await this.createSpineCharacter(characterId, config);
    }

    /**
     * 🧹 キャラクター削除
     */
    removeCharacter(characterId) {
        const character = this.characters[characterId];
        if (character && character.canvas) {
            character.canvas.remove();
            delete this.characters[characterId];
            console.log(`✅ キャラクター削除完了: ${characterId}`);
        }
    }

    /**
     * 🧹 全キャラクター削除
     */
    removeAllCharacters() {
        const characterIds = Object.keys(this.characters);
        console.log(`全キャラクター削除開始 (${characterIds.length}個)`);

        characterIds.forEach(characterId => {
            this.removeCharacter(characterId);
        });

        console.log(`✅ 全キャラクター削除完了`);
    }
}

// グローバルインスタンス作成
window.dynamicSpineCreator = new DynamicSpineCreator();

// デバッグ用関数をグローバルに登録
window.testSpineCreation = async function(characterType = 'purattokun') {
    try {
        console.log(`🎯 テストキャラクター作成開始: ${characterType}`);
        const character = await window.dynamicSpineCreator.createTestCharacter(characterType);
        console.log(`✅ テストキャラクター作成成功:`, character);
        return character;
    } catch (error) {
        console.error(`❌ テストキャラクター作成失敗:`, error);
        return null;
    }
};

console.log('🎯 DynamicSpineCreator システム初期化完了');
console.log('📖 テスト用関数: testSpineCreation("purattokun") または testSpineCreation("nezumi")');