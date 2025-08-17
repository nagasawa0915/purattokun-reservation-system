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
export class SpinePreviewLayer {
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
        // Spine WebGLライブラリの読み込み待機（成功パターン）
        await this.waitForSpine();
        
        // Spine WebGLライブラリの確認
        if (typeof spine === 'undefined') {
            throw new Error('Spine WebGL library not loaded');
        }
        
        // Spine WebGL初期化（シンプルシーンパターン）
        this.spine = {
            renderer: new spine.SceneRenderer(this.canvas, this.gl)
        };
        
        console.log('🦴 Spine WebGL初期化完了');
    }

    /**
     * Spine WebGL待機（Webアプリ版成功パターン）
     */
    async waitForSpine() {
        return new Promise((resolve, reject) => {
            let spineWaitCount = 0;
            const maxSpineWaitCount = 50; // 5秒待機
            
            const checkSpineLoad = () => {
                spineWaitCount++;
                
                if (typeof spine !== 'undefined' && spine.AssetManager) {
                    console.log('✅ Spine WebGL読み込み完了');
                    console.log('  - spine定義:', typeof spine);
                    console.log('  - AssetManager存在:', !!spine?.AssetManager);
                    console.log('  - Shader存在:', !!spine?.Shader);
                    console.log('  - SceneRenderer存在:', !!spine?.SceneRenderer);
                    resolve();
                } else if (spineWaitCount > maxSpineWaitCount) {
                    console.error('❌ Spine WebGL読み込みタイムアウト');
                    reject(new Error('Spine WebGL読み込みタイムアウト'));
                } else {
                    console.log('⏳ Spine読み込み中... (spine:', typeof spine, ') 試行:', spineWaitCount);
                    setTimeout(checkSpineLoad, 100);
                }
            };
            
            checkSpineLoad();
        });
    }

    /**
     * Spineキャラクター追加（シンプルシーン成功パターン）
     * @param {Object} characterData - キャラクターデータ
     * @param {number} x - X座標
     * @param {number} y - Y座標
     */
    async addCharacter(characterData, x, y) {
        const characterName = characterData.name;
        
        try {
            console.log(`🎭 ${characterName} 読み込み中...`);
            
            const basePath = `assets/spine/characters/${characterName}/`;
            console.log(`🔧 ベースパス: ${basePath}`);
            
            // アセットマネージャー（シンプルシーンパターン）
            const assetManager = new spine.AssetManager(this.gl, basePath);
            
            // アセットファイル読み込み
            assetManager.loadTextureAtlas(`${characterName}.atlas`);
            assetManager.loadJson(`${characterName}.json`);
            
            console.log('📁 アセットファイル読み込み開始...');
            await this.waitForAssets(assetManager);
            
            // Spineスケルトン構築（シンプルシーンパターン）
            const atlas = assetManager.get(`${characterName}.atlas`);
            const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
            const skeletonJson = new spine.SkeletonJson(atlasLoader);
            const skeletonData = skeletonJson.readSkeletonData(
                assetManager.get(`${characterName}.json`)
            );
            
            console.log('🦴 スケルトンデータ構築完了');
            
            // スケルトン作成（シンプルシーン成功座標）
            const skeleton = new spine.Skeleton(skeletonData);
            skeleton.x = 0; // 🚀 シンプル化革命: v3成功パターン
            skeleton.y = 0; // 🚀 シンプル化革命: v3成功パターン  
            skeleton.scaleX = skeleton.scaleY = 1.0; // 🚀 シンプル化革命: v3成功パターン
            
            // アニメーション設定
            const animationStateData = new spine.AnimationStateData(skeletonData);
            const animationState = new spine.AnimationState(animationStateData);
            
            // 利用可能なアニメーション確認
            console.log('📋 利用可能なアニメーション:');
            for (let i = 0; i < skeletonData.animations.length; i++) {
                console.log(`  - ${skeletonData.animations[i].name}`);
            }
            
            // 最初のアニメーション設定（あれば）
            if (skeletonData.animations.length > 0) {
                const firstAnimation = skeletonData.animations[0].name;
                animationState.setAnimation(0, firstAnimation, true);
                console.log(`🎬 アニメーション設定: ${firstAnimation}`);
            }
            
            // キャラクター登録
            this.characters.set(characterName, {
                skeleton,
                animationState,
                skeletonData
            });
            
            console.log('🎭 キャラクター構築完了');
            
            // 描画開始
            this.startRenderLoop();
            
            console.log(`✅ ${characterName} 読み込み完了`);
            return { success: true, characterId: characterName };
            
        } catch (error) {
            console.error(`❌ ${characterName} 読み込み失敗: ${error.message}`);
            return { success: false, error: error.message };
        }
    }


    /**
     * アセット読み込み完了待ち（シンプルシーンパターン）
     */
    async waitForAssets(assetManager) {
        return new Promise((resolve, reject) => {
            let checkCount = 0;
            const maxChecks = 100;
            
            const checkAssets = () => {
                checkCount++;
                console.log(`🔄 アセット読み込み確認 ${checkCount}/${maxChecks}`);
                
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
     * シンプルな描画ループ（シンプルシーンパターン）
     */
    startRenderLoop() {
        if (this.isRenderingActive) return;
        
        this.isRenderingActive = true;
        console.log('🎬 描画ループ開始');
        
        let lastTime = Date.now() / 1000;
        
        const render = () => {
            if (!this.isRenderingActive || !this.spine.renderer) return;
            
            const now = Date.now() / 1000;
            const delta = now - lastTime;
            lastTime = now;
            
            // 画面クリア
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            
            // キャラクター描画
            this.characters.forEach((character) => {
                // アニメーション更新
                character.animationState.update(delta);
                character.animationState.apply(character.skeleton);
                character.skeleton.updateWorldTransform();
                
                // スケルトン描画
                this.spine.renderer.drawSkeleton(character.skeleton, false);
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