/**
 * Spine Preview Layer Module - Clean Version
 * シンプルなSpineキャラクター表示のみ
 * 座標関連機能は完全削除
 */

import { Utils } from './utils.js';

/**
 * クリーンSpineプレビューレイヤークラス
 * 機能: Spineキャラクター表示のみ（編集・座標変換なし）
 */
export class SpinePreviewLayer {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.gl = null;
        this.spine = null;
        this.characters = new Map();
        this.spineLoaded = false;
        this.isRenderingActive = false;
        
        console.log('🎯 クリーンSpineプレビューレイヤー初期化開始');
    }

    /**
     * 初期化
     * @param {Element} container - コンテナ要素
     */
    async initialize(container) {
        try {
            this.container = container;
            
            // Canvas作成
            this.createCanvas();
            
            // WebGLコンテキスト初期化
            await this.initializeWebGL();
            
            // Spine WebGL初期化
            await this.initializeSpine();
            
            this.spineLoaded = true;
            console.log('✅ クリーンSpineプレビューレイヤー初期化完了');
            return true;
        } catch (error) {
            console.error('❌ 初期化失敗:', error);
            this.spineLoaded = false;
            return false;
        }
    }

    /**
     * Canvas要素を作成
     */
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'spine-preview-canvas';
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            pointer-events: none;
        `;
        
        this.container.appendChild(this.canvas);
        console.log('📐 Canvas作成完了: 800x600');
    }

    /**
     * WebGLコンテキスト初期化
     */
    async initializeWebGL() {
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }
        
        // WebGL設定
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0); // 透明背景
        
        console.log('🔧 WebGLコンテキスト初期化完了');
    }

    /**
     * Spine WebGL初期化（マニュアル通り）
     */
    async initializeSpine() {
        // Spineライブラリ読み込み待機（マニュアルパターン）
        await this.waitForSpine();
        
        // Spine WebGL初期化
        this.spine = {
            assetManager: new spine.webgl.AssetManager(this.gl),
            sceneRenderer: new spine.webgl.SceneRenderer(this.canvas, this.gl),
            skeletonRenderer: new spine.webgl.SkeletonRenderer(this.gl),
            shapeRenderer: new spine.webgl.ShapeRenderer(this.gl)
        };
        
        console.log('🦴 Spine WebGL初期化完了');
    }

    /**
     * Spine読み込み待ち（マニュアルパターン）
     */
    async waitForSpine() {
        return new Promise((resolve, reject) => {
            let checkCount = 0;
            const maxChecks = 50;
            
            const checkSpine = () => {
                checkCount++;
                
                if (typeof spine !== 'undefined' && spine.webgl && spine.webgl.AssetManager) {
                    console.log('✅ Spine WebGLライブラリ読み込み完了');
                    resolve();
                } else if (checkCount >= maxChecks) {
                    console.error('❌ Spine WebGLライブラリ読み込みタイムアウト');
                    reject(new Error('Spine WebGL library load timeout'));
                } else {
                    console.log(`⏳ Spine WebGLライブラリ読み込み待機中... (${checkCount}/${maxChecks})`);
                    setTimeout(checkSpine, 100);
                }
            };
            
            checkSpine();
        });
    }

    /**
     * キャラクター追加（シンプル版）
     * @param {Object} characterData - キャラクターデータ
     * @param {number} x - X座標（使用しない）
     * @param {number} y - Y座標（使用しない）
     */
    async addCharacter(characterData, x, y) {
        try {
            console.log(`🎭 キャラクター追加開始: ${characterData.name}`);
            
            // アセット読み込み
            this.spine.assetManager.loadTextureAtlas(characterData.atlasPath);
            this.spine.assetManager.loadText(characterData.jsonPath);
            
            // 読み込み完了待ち
            await this.waitForAssetLoading();
            
            // Spineデータ作成
            const atlas = this.spine.assetManager.get(characterData.atlasPath);
            const skeletonJson = this.spine.assetManager.get(characterData.jsonPath);
            const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
            const skeletonLoader = new spine.SkeletonJson(atlasLoader);
            const skeletonData = skeletonLoader.readSkeletonData(JSON.parse(skeletonJson));
            
            // キャラクター作成
            const skeleton = new spine.Skeleton(skeletonData);
            const animationState = new spine.AnimationState(new spine.AnimationStateData(skeletonData));
            
            // 固定位置（画面中央）
            skeleton.x = this.canvas.width / 2;
            skeleton.y = this.canvas.height / 2;
            skeleton.scaleX = skeleton.scaleY = 2.0;
            
            // アニメーション設定
            if (skeletonData.animations.length > 0) {
                const firstAnimation = skeletonData.animations[0].name;
                animationState.setAnimation(0, firstAnimation, true);
            }
            
            // キャラクター登録
            const characterId = `character-${Date.now()}`;
            this.characters.set(characterId, {
                skeleton,
                animationState,
                skeletonData
            });
            
            console.log(`✅ キャラクター追加完了: ${characterData.name}`);
            
            // 描画開始
            this.startRenderLoop();
            
            return { success: true };
        } catch (error) {
            console.error(`❌ キャラクター追加失敗: ${characterData.name}`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * アセット読み込み完了待ち
     */
    async waitForAssetLoading() {
        return new Promise((resolve) => {
            const checkLoading = () => {
                if (this.spine.assetManager.isLoadingComplete()) {
                    resolve();
                } else {
                    requestAnimationFrame(checkLoading);
                }
            };
            checkLoading();
        });
    }

    /**
     * シンプルな描画ループ
     */
    startRenderLoop() {
        if (this.isRenderingActive) return;
        
        this.isRenderingActive = true;
        console.log('🎬 描画ループ開始');
        
        const render = (time) => {
            if (!this.isRenderingActive) return;
            
            // 画面クリア
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            
            // キャラクター描画
            this.characters.forEach((character) => {
                // アニメーション更新
                character.animationState.update(0.016); // 60fps
                character.animationState.apply(character.skeleton);
                character.skeleton.updateWorldTransform();
                
                // 描画
                this.spine.skeletonRenderer.draw(character.skeleton);
            });
            
            requestAnimationFrame(render);
        };
        
        requestAnimationFrame(render);
    }

    /**
     * 描画停止
     */
    stopRenderLoop() {
        this.isRenderingActive = false;
        console.log('⏹️ 描画ループ停止');
    }

    /**
     * リソース解放
     */
    dispose() {
        this.stopRenderLoop();
        
        // キャラクターをクリア
        this.characters.clear();
        
        // Canvasを削除
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        console.log('🧹 クリーンSpineプレビューレイヤー解放完了');
    }
}