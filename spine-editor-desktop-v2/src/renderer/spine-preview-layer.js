/**
 * Spine Preview Layer Module
 * プレビューエリアに重なるSpine専用レイヤーを管理
 * 実際のSpine WebGLキャラクターを表示・編集
 */

import { Utils } from './utils.js';

export class SpinePreviewLayer {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.context = null;
        this.renderer = null;
        this.characters = new Map();
        this.spineLoaded = false;
        this.isRenderingActive = false;
        
        console.log('🎭 SpinePreviewLayer initialized');
    }

    /**
     * Spine専用レイヤーを初期化
     * @param {Element} previewContainer - プレビューコンテナ要素
     */
    async initialize(previewContainer) {
        if (!previewContainer) {
            console.error('❌ Preview container not found');
            return false;
        }

        this.container = previewContainer;
        
        try {
            // Spine WebGL読み込み
            await this.loadSpineWebGL();
            
            // Canvasレイヤー作成
            this.createCanvasLayer();
            
            // Spine初期化
            this.initializeSpineRenderer();
            
            this.spineLoaded = true;
            console.log('✅ SpinePreviewLayer初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ SpinePreviewLayer初期化失敗:', error);
            return false;
        }
    }

    /**
     * Spine WebGLライブラリを読み込み
     */
    async loadSpineWebGL() {
        if (window.spine) {
            console.log('✅ Spine WebGL already loaded');
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@esotericsoftware/spine-webgl@4.1.24/dist/iife/spine-webgl.js';
            script.onload = () => {
                console.log('✅ Spine WebGL CDN loaded');
                this.waitForSpine().then(resolve).catch(reject);
            };
            script.onerror = () => {
                reject(new Error('Spine WebGL CDN読み込み失敗'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Spine WebGL読み込み待ち
     */
    async waitForSpine() {
        return new Promise((resolve, reject) => {
            let checkCount = 0;
            const maxChecks = 50;

            const checkSpine = () => {
                checkCount++;
                if (typeof spine !== "undefined" && spine.AssetManager) {
                    console.log('✅ Spine WebGL読み込み完了');
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
     * Canvasレイヤーを作成
     */
    createCanvasLayer() {
        // Canvas要素作成
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'spine-preview-canvas';
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Canvas スタイル設定
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: auto;
            z-index: 10;
            background: transparent;
        `;

        // コンテナに追加
        this.container.style.position = 'relative';
        this.container.appendChild(this.canvas);

        // WebGLコンテキスト取得
        this.context = this.canvas.getContext("webgl", { 
            alpha: true, 
            premultipliedAlpha: false 
        });

        if (!this.context) {
            throw new Error("WebGL未対応");
        }

        console.log('✅ Spine Canvas layer created');
    }

    /**
     * Spineレンダラー初期化
     */
    initializeSpineRenderer() {
        if (!this.context) {
            throw new Error("WebGLコンテキストが未初期化");
        }

        this.renderer = new spine.SceneRenderer(this.canvas, this.context);
        console.log('✅ Spine renderer initialized');
    }

    /**
     * Spineキャラクターを追加
     * @param {object} characterData - キャラクターデータ
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {Promise<object>} 追加結果
     */
    async addCharacter(characterData, x, y) {
        if (!this.spineLoaded) {
            throw new Error("Spine not loaded");
        }

        try {
            const characterId = Utils.generateId('spine-character');
            
            console.log('🎭 Spineキャラクター読み込み開始:', characterData.name);
            
            // アセット読み込み
            const spineData = await this.loadSpineAssets(characterData);
            
            // スケルトン作成
            const skeleton = new spine.Skeleton(spineData.skeletonData);
            skeleton.x = x;
            skeleton.y = y;
            skeleton.scaleX = skeleton.scaleY = 0.5;
            
            // アニメーション設定
            const animationStateData = new spine.AnimationStateData(spineData.skeletonData);
            const animationState = new spine.AnimationState(animationStateData);
            
            // 最初のアニメーション設定
            if (spineData.skeletonData.animations.length > 0) {
                const firstAnimation = spineData.skeletonData.animations[0].name;
                animationState.setAnimation(0, firstAnimation, true);
                console.log(`🎬 アニメーション設定: ${firstAnimation}`);
            }

            // キャラクター登録
            const character = {
                id: characterId,
                name: characterData.name,
                skeleton: skeleton,
                animationState: animationState,
                data: characterData,
                position: { x, y },
                scale: 0.5
            };

            this.characters.set(characterId, character);

            // レンダリング開始
            this.startRenderLoop();

            console.log('✅ Spineキャラクター追加完了:', characterData.name);
            
            return {
                success: true,
                characterId: characterId,
                character: character
            };

        } catch (error) {
            console.error('❌ Spineキャラクター追加失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Spineアセットを読み込み
     * @param {object} characterData - キャラクターデータ
     * @returns {Promise<object>} スケルトンデータ
     */
    async loadSpineAssets(characterData) {
        const basePath = `./assets/spine/characters/${characterData.name}/`;
        const assetManager = new spine.AssetManager(this.context, basePath);
        
        // アセットファイル読み込み
        assetManager.loadTextureAtlas(`${characterData.name}.atlas`);
        assetManager.loadJson(`${characterData.name}.json`);
        
        // 読み込み完了待ち
        await this.waitForAssets(assetManager);
        
        // スケルトンデータ構築
        const atlas = assetManager.get(`${characterData.name}.atlas`);
        const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
        const skeletonJson = new spine.SkeletonJson(atlasLoader);
        const skeletonData = skeletonJson.readSkeletonData(
            assetManager.get(`${characterData.name}.json`)
        );
        
        return { skeletonData, assetManager };
    }

    /**
     * アセット読み込み待ち
     * @param {spine.AssetManager} assetManager - アセットマネージャー
     */
    async waitForAssets(assetManager) {
        return new Promise((resolve, reject) => {
            let checkCount = 0;
            const maxChecks = 100;

            const checkAssets = () => {
                checkCount++;
                if (assetManager.isLoadingComplete()) {
                    console.log('✅ アセット読み込み完了');
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
     * レンダリングループを開始
     */
    startRenderLoop() {
        if (this.isRenderingActive || this.characters.size === 0) {
            return;
        }

        this.isRenderingActive = true;
        let lastTime = Date.now() / 1000;

        const render = () => {
            if (this.characters.size === 0) {
                this.isRenderingActive = false;
                return;
            }

            const now = Date.now() / 1000;
            const delta = now - lastTime;
            lastTime = now;

            // Canvas クリア
            this.context.clearColor(0, 0, 0, 0);
            this.context.clear(this.context.COLOR_BUFFER_BIT);
            this.context.viewport(0, 0, this.canvas.width, this.canvas.height);

            this.renderer.begin();

            // 全キャラクターを描画
            this.characters.forEach(character => {
                // アニメーション更新
                character.animationState.update(delta);
                character.animationState.apply(character.skeleton);
                character.skeleton.updateWorldTransform();

                // 描画
                this.renderer.drawSkeleton(character.skeleton, true);
            });

            this.renderer.end();

            requestAnimationFrame(render);
        };

        render();
        console.log('🔄 Spine レンダリングループ開始');
    }

    /**
     * キャラクター位置更新
     * @param {string} characterId - キャラクターID
     * @param {number} x - 新しいX座標
     * @param {number} y - 新しいY座標
     */
    updateCharacterPosition(characterId, x, y) {
        const character = this.characters.get(characterId);
        if (character) {
            character.skeleton.x = x;
            character.skeleton.y = y;
            character.position.x = x;
            character.position.y = y;
        }
    }

    /**
     * キャラクタースケール更新
     * @param {string} characterId - キャラクターID
     * @param {number} scale - 新しいスケール
     */
    updateCharacterScale(characterId, scale) {
        const character = this.characters.get(characterId);
        if (character) {
            character.skeleton.scaleX = character.skeleton.scaleY = scale;
            character.scale = scale;
        }
    }

    /**
     * キャラクター削除
     * @param {string} characterId - キャラクターID
     */
    removeCharacter(characterId) {
        if (this.characters.has(characterId)) {
            this.characters.delete(characterId);
            console.log('🗑️ Spineキャラクター削除:', characterId);
            
            if (this.characters.size === 0) {
                this.clearCanvas();
            }
        }
    }

    /**
     * Canvas クリア
     */
    clearCanvas() {
        if (this.context) {
            this.context.clearColor(0, 0, 0, 0);
            this.context.clear(this.context.COLOR_BUFFER_BIT);
        }
        this.isRenderingActive = false;
    }

    /**
     * 全キャラクター削除
     */
    clearAllCharacters() {
        this.characters.clear();
        this.clearCanvas();
        console.log('🧹 全Spineキャラクター削除');
    }

    /**
     * マウス座標をCanvas座標に変換
     * @param {number} clientX - マウスのクライアントX座標
     * @param {number} clientY - マウスのクライアントY座標
     * @returns {object} Canvas座標 {x, y}
     */
    clientToCanvasCoordinates(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = (clientX - rect.left) * (this.canvas.width / rect.width);
        const canvasY = (clientY - rect.top) * (this.canvas.height / rect.height);
        
        return { x: canvasX, y: canvasY };
    }

    /**
     * リサイズ対応
     */
    handleResize() {
        if (this.canvas && this.container) {
            const rect = this.container.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            
            if (this.context) {
                this.context.viewport(0, 0, this.canvas.width, this.canvas.height);
            }
        }
    }

    /**
     * レイヤーを破棄
     */
    destroy() {
        this.clearAllCharacters();
        
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        this.canvas = null;
        this.context = null;
        this.renderer = null;
        this.container = null;
        this.spineLoaded = false;
        
        console.log('🗑️ SpinePreviewLayer destroyed');
    }
}