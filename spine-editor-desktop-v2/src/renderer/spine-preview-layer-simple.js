/**
 * Spine Preview Layer Module - シンプル版
 * 最小限のSpineキャラクター表示のみ
 * 座標関連機能は全て削除
 */

import { Utils } from './utils.js';

/**
 * シンプルSpineプレビューレイヤークラス
 * 機能: Spineキャラクター表示のみ
 */
export class SpinePreviewLayerSimple {
    constructor(container) {
        this.container = container;
        this.canvas = null;
        this.gl = null;
        this.spine = null;
        this.characters = new Map();
        
        console.log('🎯 シンプルSpineプレビューレイヤー初期化開始');
    }

    /**
     * 初期化
     */
    async initialize() {
        try {
            // Canvas作成
            this.createCanvas();
            
            // WebGLコンテキスト初期化
            await this.initializeWebGL();
            
            // Spine WebGL初期化
            await this.initializeSpine();
            
            console.log('✅ シンプルSpineプレビューレイヤー初期化完了');
            return true;
        } catch (error) {
            console.error('❌ 初期化失敗:', error);
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
     * Spine WebGL初期化
     */
    async initializeSpine() {
        // Spine WebGLライブラリの読み込み待機
        await this.waitForSpineLibrary();
        
        // Spine WebGLライブラリの確認
        if (typeof spine === 'undefined') {
            throw new Error('Spine WebGL library not loaded');
        }
        
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
     * シンプルなSpineキャラクター追加
     * @param {string} characterId - キャラクターID
     * @param {string} atlasPath - .atlasファイルパス
     * @param {string} jsonPath - .jsonファイルパス
     */
    async addSimpleCharacter(characterId, atlasPath, jsonPath) {
        try {
            console.log(`🎭 シンプルキャラクター追加開始: ${characterId}`);
            
            // アセット読み込み
            this.spine.assetManager.loadTextureAtlas(atlasPath);
            this.spine.assetManager.loadText(jsonPath);
            
            // 読み込み完了待ち
            await this.waitForAssetLoading();
            
            // Spineデータ作成
            const atlas = this.spine.assetManager.get(atlasPath);
            const skeletonJson = this.spine.assetManager.get(jsonPath);
            const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
            const skeletonLoader = new spine.SkeletonJson(atlasLoader);
            const skeletonData = skeletonLoader.readSkeletonData(JSON.parse(skeletonJson));
            
            // キャラクター作成
            const skeleton = new spine.Skeleton(skeletonData);
            const animationState = new spine.AnimationState(new spine.AnimationStateData(skeletonData));
            
            // 基本設定（座標変換なし）
            skeleton.x = this.canvas.width / 2;
            skeleton.y = this.canvas.height / 2;
            skeleton.scaleX = skeleton.scaleY = 2.0;
            
            // アニメーション設定
            if (skeletonData.animations.length > 0) {
                const firstAnimation = skeletonData.animations[0].name;
                animationState.setAnimation(0, firstAnimation, true);
            }
            
            // キャラクター登録
            this.characters.set(characterId, {
                skeleton,
                animationState,
                skeletonData
            });
            
            console.log(`✅ シンプルキャラクター追加完了: ${characterId}`);
            
            // 描画開始
            this.startRenderLoop();
            
            return true;
        } catch (error) {
            console.error(`❌ キャラクター追加失敗: ${characterId}`, error);
            return false;
        }
    }

    /**
     * Spineライブラリ読み込み待機（既存パターン使用）
     */
    async waitForSpineLibrary() {
        return new Promise((resolve, reject) => {
            let checkCount = 0;
            const maxChecks = 50; // 最大5秒待機
            
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
        console.log('🎬 シンプル描画ループ開始');
        
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
        
        console.log('🧹 シンプルSpineプレビューレイヤー解放完了');
    }
}