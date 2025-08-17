/**
 * Spine Preview Layer Module - シンプル版（安定化修正）
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
        
        // 🔧 安定化修正: 初期化とレンダリング状態の分離
        this.isInitialized = false;
        this.isRenderingActive = false;
        this.renderLoopId = null;
        
        // 🔧 メソッドバインディング確保（エラー回避）
        this.freezeCanvasSize = this.freezeCanvasSize.bind(this);
        this.unfreezeCanvasSize = this.unfreezeCanvasSize.bind(this);
        this.fallbackCanvasSize = this.fallbackCanvasSize.bind(this);
        
        console.log('🎯 シンプルSpineプレビューレイヤー初期化開始');
    }

    /**
     * 初期化
     */
    async initialize() {
        try {
            console.log('🔧 初期化開始 - メソッド存在確認:', {
                freezeCanvasSize: typeof this.freezeCanvasSize,
                unfreezeCanvasSize: typeof this.unfreezeCanvasSize,
                fallbackCanvasSize: typeof this.fallbackCanvasSize
            });
            
            // Canvas作成
            this.createCanvas();
            
            // WebGLコンテキスト初期化
            await this.initializeWebGL();
            
            // Spine WebGL初期化
            await this.initializeSpine();
            
            // 🔧 安定化修正: 初期化完了フラグを設定
            this.isInitialized = true;
            
            // 🚀 フリッカリング根本修正: レンダリングループを事前起動（常時稼働）
            this.startRenderLoop();
            
            console.log('✅ シンプルSpineプレビューレイヤー初期化完了');
            return true;
        } catch (error) {
            console.error('❌ 初期化失敗:', error);
            console.error('❌ エラースタック:', error.stack);
            this.isInitialized = false;
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
            z-index: 50;
            pointer-events: auto;
            display: block;
            visibility: visible;
        `;
        
        this.container.appendChild(this.canvas);
        console.log('📐 Canvas作成完了: 800x600');
    }

    /**
     * WebGLコンテキスト初期化
     */
    async initializeWebGL() {
        // 🚀 A. preserveDrawingBuffer:true でコンテキスト生成
        const contextOptions = {
            preserveDrawingBuffer: true,
            alpha: true,
            antialias: true,
            premultipliedAlpha: true
        };
        
        this.gl = this.canvas.getContext('webgl', contextOptions) || 
                  this.canvas.getContext('experimental-webgl', contextOptions);
        
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }
        
        // 🚀 B. 初回だけサイズ凍結（エラーハンドリング付き）
        try {
            if (typeof this.freezeCanvasSize === 'function') {
                this.freezeCanvasSize();
            } else {
                console.warn('⚠️ freezeCanvasSize メソッドが見つかりません、フォールバック処理を実行');
                this.fallbackCanvasSize();
            }
        } catch (error) {
            console.error('❌ freezeCanvasSize 実行エラー:', error);
            this.fallbackCanvasSize();
        }
        
        // 🚀 WebGL状態を毎フレーム明示設定
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0); // 透明背景
        
        console.log('🔧 WebGLコンテキスト初期化完了（preserveDrawingBuffer + サイズ凍結）');
    }

    /**
     * フォールバック処理: freezeCanvasSize メソッドが利用できない場合の代替処理
     */
    fallbackCanvasSize() {
        if (!this.canvas) return;
        
        // 基本的なサイズ設定
        const dpr = window.devicePixelRatio || 1;
        const width = Math.round(800 * dpr);
        const height = Math.round(600 * dpr);
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        console.log(`🔄 フォールバック Canvas サイズ設定: ${width}x${height} (DPR: ${dpr})`);
    }

    /**
     * 🚀 恒久対策2: 初回サイズ凍結（リサイズ確定後に解凍）
     */
    freezeCanvasSize() {
        if (!this.canvas) return;
        
        // DPR適用
        const dpr = window.devicePixelRatio || 1;
        const frozenWidth = Math.round(800 * dpr);
        const frozenHeight = Math.round(600 * dpr);
        
        this.canvas.width = frozenWidth;
        this.canvas.height = frozenHeight;
        
        console.log(`🔒 Canvas サイズ凍結: ${this.canvas.id} → ${frozenWidth}x${frozenHeight} (DPR: ${dpr})`);
        
        // 500ms後に凍結解除（初回のResizeObserver混乱を回避）
        setTimeout(() => {
            try {
                if (typeof this.unfreezeCanvasSize === 'function') {
                    this.unfreezeCanvasSize();
                } else {
                    console.warn('⚠️ unfreezeCanvasSize メソッドが見つかりません');
                }
            } catch (error) {
                console.error('❌ unfreezeCanvasSize 実行エラー:', error);
            }
        }, 500);
    }

    /**
     * Canvasサイズ凍結解除
     */
    unfreezeCanvasSize() {
        if (!this.canvas || !this.canvas.parentElement) return; // 既に削除済み
        
        console.log(`🔓 Canvas サイズ凍結解除: ${this.canvas.id}`);
        
        // 必要に応じてResizeObserverやサイズ調整ロジックを再開
        // 現在はサイズ固定なので特に処理なし
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
     * 🔧 安定化修正: 初期化完了確認
     */
    isReadyForCharacters() {
        const ready = this.isInitialized && 
                     this.canvas && 
                     this.gl && 
                     this.spine && 
                     this.spine.renderer;
        
        if (!ready) {
            console.warn('⚠️ SpinePreviewLayer未初期化またはコンポーネント不足:', {
                isInitialized: this.isInitialized,
                hasCanvas: !!this.canvas,
                hasGL: !!this.gl,
                hasSpine: !!this.spine,
                hasRenderer: !!(this.spine && this.spine.renderer)
            });
        }
        
        return ready;
    }

    /**
     * Spineキャラクター追加（シンプルシーン成功パターン + 安定化修正）
     * @param {Object} characterData - キャラクターデータ
     * @param {number} x - X座標
     * @param {number} y - Y座標
     */
    async addCharacter(characterData, x, y) {
        // 🔧 安定化修正: 初期化完了確認
        if (!this.isReadyForCharacters()) {
            console.error('❌ SpinePreviewLayer初期化未完了');
            return { success: false, error: 'SpinePreviewLayer初期化未完了' };
        }
        
        // データ整合性チェック
        if (!characterData) {
            console.error('❌ キャラクターデータが空です');
            return { success: false, error: 'キャラクターデータが空です' };
        }
        
        const characterName = characterData.name || characterData.id;
        if (!characterName) {
            console.error('❌ キャラクター名が空です:', characterData);
            return { success: false, error: 'キャラクター名が空です' };
        }
        
        try {
            console.log(`🎭 ${characterName} 読み込み中...（データ:`, characterData, '）');
            
            // 実際のファイルパスを使用（絶対パスから相対パスへ変換）
            let basePath, atlasPath, jsonPath, imagePath;
            
            if (characterData.atlasPath && characterData.jsonPath && characterData.texturePath) {
                // 絶対パスから相対パスへ変換
                atlasPath = this.convertToRelativePath(characterData.atlasPath);
                jsonPath = this.convertToRelativePath(characterData.jsonPath);
                imagePath = this.convertToRelativePath(characterData.texturePath);
                
                console.log('📁 絶対パスから相対パスへ変換:', { atlasPath, jsonPath, imagePath });
            } else {
                // フォールバック: 標準的なパス構成
                basePath = `assets/spine/characters/${characterName}/`;
                atlasPath = `${basePath}${characterName}.atlas`;
                jsonPath = `${basePath}${characterName}.json`;
                imagePath = `${basePath}${characterName}.png`;
                
                console.log('📁 標準パスでフォールバック:', { atlasPath, jsonPath, imagePath });
            }
            
            // v3成功パターン移植: AssetManager使用方法
            const assetManager = new spine.AssetManager(this.gl);
            
            console.log('📁 アセット読み込み開始:', { atlasPath, jsonPath, imagePath });
            
            // v3成功パターン移植: 標準読み込み
            assetManager.loadTextureAtlas(atlasPath);
            assetManager.loadText(jsonPath);
            assetManager.loadTexture(imagePath);
            
            console.log('📁 アセットファイル読み込み開始...');
            // 🚀 v3シンプル化: 複雑な待機を削除、基本待機のみ
            await this.waitForAssetsSimple(assetManager);
            
            // v3成功パターン移植: Skeleton作成
            const atlas = assetManager.require(atlasPath);
            const skeletonJson = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(atlas));
            const skeletonData = skeletonJson.readSkeletonData(assetManager.require(jsonPath));
            
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
            
            // スケルトン初期化（レンダリング準備完了まで確実に待機）
            skeleton.updateWorldTransform();
            
            // キャラクター登録
            this.characters.set(characterName, {
                skeleton,
                animationState,
                skeletonData
            });
            
            console.log('🎭 キャラクター構築完了');
            
            // 🔧 フリッカリング修正: Canvas表示状態デバッグ
            this.debugCanvasVisibility();
            
            // 🚀 v3シンプル化: 複雑な初期化待機を削除、即座完了
            // await this.waitForCompleteInitialization(characterName); // ← 削除
            
            // 注意: レンダリングループは既にinitialize()で事前起動済み
            
            console.log(`✅ ${characterName} 即座読み込み完了`);
            return { success: true, characterId: characterName };
            
        } catch (error) {
            console.error(`❌ ${characterName} 読み込み失敗: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 絶対パスを相対パスへ変換
     * @param {string} absolutePath - 絶対パス
     * @returns {string} 相対パス
     */
    convertToRelativePath(absolutePath) {
        if (!absolutePath) return '';
        
        // WindowsパスをUnixパスへ正規化
        const normalizedPath = absolutePath.replace(/\\/g, '/');
        
        // プロジェクトルートからの相対パスを生成
        // 例: "C:/project/assets/spine/characters/nezumi/nezumi.atlas" → "assets/spine/characters/nezumi/nezumi.atlas"
        const assetsIndex = normalizedPath.indexOf('assets/');
        if (assetsIndex !== -1) {
            return normalizedPath.substring(assetsIndex);
        }
        
        // フォールバック: ファイル名のみを使用
        const fileName = normalizedPath.split('/').pop();
        return fileName || normalizedPath;
    }


    /**
     * 🚀 フリッカリング根本修正: テクスチャロード完了の確実な待機
     * assetManager.isLoadingComplete()だけでなく個別テクスチャの完了状態も確認
     */
    async waitForAssets(assetManager) {
        return new Promise((resolve, reject) => {
            let checkCount = 0;
            const maxChecks = 100;
            
            const checkAssets = () => {
                checkCount++;
                console.log(`🔄 アセット読み込み確認 ${checkCount}/${maxChecks}`);
                
                // 基本的な読み込み完了確認
                if (!assetManager.isLoadingComplete()) {
                    if (checkCount >= maxChecks) {
                        reject(new Error("アセット読み込みタイムアウト"));
                    } else {
                        setTimeout(checkAssets, 100);
                    }
                    return;
                }
                
                // 🚀 追加確認: 個別テクスチャの完了状態を確認
                let allTexturesReady = true;
                const textureChecks = [];
                
                try {
                    // AssetManagerに登録されたテクスチャを確認
                    const assetPaths = Object.keys(assetManager.assets || {});
                    
                    assetPaths.forEach(path => {
                        const asset = assetManager.assets[path];
                        
                        // テクスチャアセットの確認
                        if (asset && asset.constructor && asset.constructor.name === 'GLTexture') {
                            const textureComplete = asset.texture && asset.texture.image && 
                                                  (asset.texture.image.complete === true || 
                                                   asset.texture.image.naturalWidth > 0);
                            
                            textureChecks.push({
                                path: path,
                                complete: textureComplete,
                                hasImage: !!(asset.texture && asset.texture.image),
                                imageComplete: asset.texture?.image?.complete,
                                naturalWidth: asset.texture?.image?.naturalWidth
                            });
                            
                            if (!textureComplete) {
                                allTexturesReady = false;
                            }
                        }
                        
                        // 画像アセットの確認
                        if (asset && asset.complete !== undefined) {
                            const imageComplete = asset.complete === true || asset.naturalWidth > 0;
                            
                            textureChecks.push({
                                path: path,
                                complete: imageComplete,
                                imageComplete: asset.complete,
                                naturalWidth: asset.naturalWidth
                            });
                            
                            if (!imageComplete) {
                                allTexturesReady = false;
                            }
                        }
                    });
                    
                    console.log('🔍 テクスチャ完了状態:', textureChecks);
                    
                } catch (error) {
                    console.warn('⚠️ テクスチャ確認エラー:', error);
                    // エラー時は基本確認のみ実行
                }
                
                if (allTexturesReady) {
                    console.log('✅ アセット＋テクスチャ読み込み完全完了');
                    resolve();
                } else if (checkCount >= maxChecks) {
                    console.warn('⚠️ テクスチャ完了タイムアウト、基本読み込み完了で続行');
                    resolve(); // 基本読み込み完了なら続行
                } else {
                    console.log('⏳ テクスチャ完了待機中...');
                    setTimeout(checkAssets, 100);
                }
            };
            
            checkAssets();
        });
    }

    /**
     * 🚀 v3シンプル化: 基本的なアセット読み込み待機のみ
     */
    async waitForAssetsSimple(assetManager) {
        return new Promise((resolve, reject) => {
            const maxWaitTime = 10000; // 10秒
            const startTime = Date.now();
            
            const checkAssets = () => {
                if (assetManager.isLoadingComplete()) {
                    console.log('✅ 基本アセット読み込み完了');
                    resolve();
                } else if (Date.now() - startTime > maxWaitTime) {
                    reject(new Error('アセット読み込みタイムアウト'));
                } else {
                    setTimeout(checkAssets, 100);
                }
            };
            
            checkAssets();
        });
    }

    /**
     * 🔧 フリッカリング根本修正: キャラクター完全初期化待機
     * レンダリング開始前に全ての初期化処理の完了を確認
     */
    async waitForCompleteInitialization(characterName) {
        return new Promise((resolve) => {
            let checkCount = 0;
            const maxChecks = 10; // 1秒待機
            
            const checkInitialization = () => {
                checkCount++;
                console.log(`🔄 ${characterName} 初期化完了確認 ${checkCount}/${maxChecks}`);
                
                const character = this.characters.get(characterName);
                
                // キャラクター登録確認
                if (!character) {
                    console.log(`⏳ ${characterName} キャラクター登録待機中...`);
                    if (checkCount < maxChecks) {
                        setTimeout(checkInitialization, 100);
                        return;
                    }
                }
                
                // スケルトン・アニメーション状態確認
                const isSkeletonReady = character && 
                                      character.skeleton && 
                                      character.skeleton.data && 
                                      character.animationState;
                
                if (!isSkeletonReady) {
                    console.log(`⏳ ${characterName} スケルトン初期化待機中...`);
                    if (checkCount < maxChecks) {
                        setTimeout(checkInitialization, 100);
                        return;
                    }
                }
                
                // 描画可能状態確認
                const isRenderReady = this.spine && 
                                     this.spine.renderer && 
                                     this.gl && 
                                     !this.gl.isContextLost();
                
                if (!isRenderReady) {
                    console.log(`⏳ ${characterName} レンダリング環境待機中...`);
                    if (checkCount < maxChecks) {
                        setTimeout(checkInitialization, 100);
                        return;
                    }
                }
                
                console.log(`✅ ${characterName} 完全初期化確認完了`);
                console.log('  - キャラクター登録:', !!character);
                console.log('  - スケルトン準備:', !!isSkeletonReady);
                console.log('  - レンダリング準備:', !!isRenderReady);
                
                resolve();
            };
            
            // 少し待ってから確認開始（同期的な処理完了を待機）
            setTimeout(checkInitialization, 50);
        });
    }

    /**
     * 🔧 安定化修正: レンダリングループ安全起動
     */
    ensureRenderLoopStarted() {
        if (this.isRenderingActive) {
            console.log('🎬 レンダリングループ既に動作中');
            return;
        }
        
        if (!this.isReadyForCharacters()) {
            console.warn('⚠️ レンダリングループ起動条件未達（基本コンポーネント）');
            return;
        }
        
        // 🔧 フリッカリング根本修正: キャラクター存在確認
        if (this.characters.size === 0) {
            console.warn('⚠️ レンダリングループ起動条件未達（キャラクター未登録）');
            return;
        }
        
        // キャラクターの準備状態確認
        let allCharactersReady = true;
        this.characters.forEach((character, name) => {
            if (!character.skeleton || !character.animationState) {
                console.warn(`⚠️ ${name} 準備未完了:`, {
                    hasSkeleton: !!character.skeleton,
                    hasAnimationState: !!character.animationState
                });
                allCharactersReady = false;
            }
        });
        
        if (!allCharactersReady) {
            console.warn('⚠️ レンダリングループ起動条件未達（キャラクター準備不完全）');
            return;
        }
        
        console.log('🎬 レンダリングループ起動条件確認完了、開始します');
        this.startRenderLoop();
    }

    /**
     * 🚀 フリッカリング根本修正: 描画ループの常時稼働
     * アプリ起動時から常時動いている状態にする
     */
    startRenderLoop() {
        if (this.isRenderingActive) {
            console.log('🎬 レンダリングループ重複起動防止');
            return;
        }
        
        this.isRenderingActive = true;
        console.log('🎬 描画ループ開始（常時稼働モード）');
        
        let lastTime = Date.now() / 1000;
        
        const render = () => {
            // 🚀 フリッカリング修正: 描画継続性の保証
            if (!this.isRenderingActive) {
                console.log('🔴 レンダリング停止要求');
                return;
            }
            
            // 🚀 最小限の停止条件のみ（WebGLコンテキスト喪失時のみ）
            if (this.gl && this.gl.isContextLost()) {
                console.error('❌ WebGLコンテキスト喪失・停止');
                this.isRenderingActive = false;
                return;
            }
            
            const now = Date.now() / 1000;
            const delta = now - lastTime;
            lastTime = now;
            
            try {
                // 🚀 基本コンポーネントが存在する場合のみ描画実行
                if (this.gl && this.spine && this.spine.renderer) {
                    // 画面クリア
                    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
                    
                    // 🚀 キャラクターが存在する場合のみ描画
                    if (this.characters.size > 0) {
                        this.characters.forEach((character) => {
                            // キャラクターの準備状態確認
                            if (character.skeleton && character.animationState) {
                                // アニメーション更新
                                character.animationState.update(delta);
                                character.animationState.apply(character.skeleton);
                                character.skeleton.updateWorldTransform();
                                
                                // スケルトン描画
                                this.spine.renderer.drawSkeleton(character.skeleton, false);
                            }
                        });
                    }
                }
                
            } catch (error) {
                console.error('❌ レンダリングエラー:', error);
                // 🚀 フリッカリング修正: エラー時も必ず継続
            }
            
            // 🚀 フリッカリング修正: 条件に関係なく必ず次フレームを予約
            this.renderLoopId = requestAnimationFrame(render);
        };
        
        // 初回フレーム開始
        this.renderLoopId = requestAnimationFrame(render);
    }

    /**
     * 描画停止（安定化修正）
     */
    stopRenderLoop() {
        this.isRenderingActive = false;
        
        if (this.renderLoopId) {
            cancelAnimationFrame(this.renderLoopId);
            this.renderLoopId = null;
        }
        
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
        
        // 🔧 安定化修正: 初期化状態リセット
        this.isInitialized = false;
        
        console.log('🧹 シンプルSpineプレビューレイヤー解放完了');
    }

    /**
     * 🔧 フリッカリング修正: Canvas表示状態デバッグ
     */
    debugCanvasVisibility() {
        if (!this.canvas) return;

        const computedStyle = window.getComputedStyle(this.canvas);
        console.log('🔍 Canvas表示状態デバッグ:', {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            zIndex: computedStyle.zIndex,
            position: computedStyle.position,
            width: computedStyle.width,
            height: computedStyle.height,
            isConnected: this.canvas.isConnected,
            parentElement: this.canvas.parentElement?.tagName,
            boundingClientRect: this.canvas.getBoundingClientRect()
        });

        // z-index競合チェック
        this.checkZIndexConflicts();
    }

    /**
     * 🔧 フリッカリング修正: z-index競合チェック
     */
    checkZIndexConflicts() {
        const allElements = document.querySelectorAll('*');
        const highZIndexElements = [];

        allElements.forEach(el => {
            const style = window.getComputedStyle(el);
            const zIndex = parseInt(style.zIndex);
            
            if (!isNaN(zIndex) && zIndex >= 40) {
                highZIndexElements.push({
                    element: el.tagName,
                    id: el.id,
                    className: el.className,
                    zIndex: zIndex,
                    position: style.position
                });
            }
        });

        if (highZIndexElements.length > 1) {
            console.warn('⚠️ z-index競合の可能性:', highZIndexElements);
        } else {
            console.log('✅ z-index競合なし');
        }
    }
}
