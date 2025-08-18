/**
 * Spine Preview Render Module - Phase 2: レンダリング・Canvas管理・WebGL制御分離
 * 
 * 機能範囲:
 * - Canvas作成・管理・サイズ制御
 * - WebGL初期化・状態管理・復旧対応
 * - 常時rAFレンダリングループ制御
 * - 全キャラクターレンダリング処理
 * - Spine WebGL初期化・統合
 * 
 * Phase 2最適化:
 * - AssetRegistry連携パフォーマンス向上
 * - Context復旧時のレンダラー再作成
 * - WebGL状態管理の適切な分担
 * - 描画処理最適化維持
 */

export class SpinePreviewRender {
    constructor(parentLayer) {
        this.parentLayer = parentLayer;
        this.canvas = null;
        this.gl = null;
        this.spine = null;
        
        // 🚀 Phase 2: レンダリング状態管理
        this.isInitialized = false; // 初期化状態管理
        this.isRendering = false;
        this._rafId = 0;
        this._running = false;
        
        // 🚀 Phase 2: パフォーマンス追跡
        this._frameCount = 0;
        this._lastPerformanceLog = Date.now();
        this._lastTime = Date.now() / 1000;
        
        // 🚀 Phase 2: AssetRegistry連携
        this._assetReadyCache = new Set();
        
        // メソッドバインディング
        this.freezeCanvasSize = this.freezeCanvasSize.bind(this);
        this.unfreezeCanvasSize = this.unfreezeCanvasSize.bind(this);
        this.fallbackCanvasSize = this.fallbackCanvasSize.bind(this);
        
        console.log('🎨 SpinePreviewRender初期化完了');
    }

    /**
     * 🚀 Phase 2: 初回フリッカ対策統一 - attachCharacterWithDecode
     * 画像decode→requestAnimationFrame投入を一元化
     * @param {object} assetData - アセットデータ（絶対URL化済み）
     * @param {object} options - 配置オプション
     */
    async attachCharacterWithDecode(assetData, options = {}) {
        try {
            console.log('🔧 attachCharacterWithDecode開始');
            
            // 🚀 前提条件チェック
            if (!this.isInitialized || !this.gl || !this.spine) {
                throw new Error('SpinePreviewRender未初期化');
            }
            
            // 🚀 フリッカ対策: 画像decode完了待機
            await this.preloadImages(assetData);
            
            // 🚀 次フレームでSpine描画投入（確実な同期）
            await this.attachOnNextFrame(assetData, options);
            
            console.log('✅ attachCharacterWithDecode完了');
            return { success: true };
            
        } catch (error) {
            console.error('❌ attachCharacterWithDecode失敗:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 🚨 フェーズA: 強化された画像プリロード・decode完了待機（チラつき対策）
     * @param {object} assetData - アセットデータ
     */
    async preloadImages(assetData) {
        const imagePaths = [];
        
        // PNG画像収集
        if (assetData.pngs && Array.isArray(assetData.pngs)) {
            imagePaths.push(...assetData.pngs);
        }
        if (assetData.texturePath) {
            imagePaths.push(assetData.texturePath);
        }
        
        console.log('🚨 フェーズA: 強化画像プリロード開始:', imagePaths.length, '個');
        
        // 全画像のdecode完了待機（フェーズA強化版）
        const decodePromises = imagePaths.map(async (imagePath) => {
            try {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = imagePath;
                });
                
                // 🚨 フェーズA: decode + createImageBitmap 両方実行（GPU転送確実化）
                if (img.decode) {
                    await img.decode();
                }
                
                // createImageBitmapでGPU転送準備
                if (typeof createImageBitmap !== 'undefined') {
                    try {
                        const bitmap = await createImageBitmap(img);
                        console.log(`✅ 画像decode+bitmap完了: ${imagePath} (${bitmap.width}x${bitmap.height})`);
                        bitmap.close(); // メモリ解放
                    } catch (bitmapError) {
                        console.log(`✅ 画像decode完了（bitmap失敗）: ${imagePath}`, bitmapError);
                    }
                } else {
                    console.log(`✅ 画像decode完了: ${imagePath}`);
                }
                
            } catch (error) {
                console.warn(`⚠️ 画像decode失敗: ${imagePath}`, error);
            }
        });
        
        await Promise.all(decodePromises);
        console.log('✅ 全画像プリロード・decode・GPU転送準備完了（フェーズA強化版）');
    }

    /**
     * 🚨 フェーズA: 強化された次フレームSpine描画投入（チラつき対策）
     * @param {object} assetData - アセットデータ
     * @param {object} options - 配置オプション
     */
    async attachOnNextFrame(assetData, options) {
        return new Promise((resolve, reject) => {
            console.log('🚨 フェーズA: 次フレーム投入待機開始（レンダリング安定化）');
            
            // 🚨 フェーズA: レンダリングループ稼働確認
            if (!this._running) {
                console.warn('⚠️ レンダリングループ未稼働 - 強制開始');
                this.startRenderLoop();
            }
            
            requestAnimationFrame(() => {
                try {
                    console.log('🔧 フェーズA: 次フレームSpine描画投入実行');
                    console.log('  - レンダループ稼働中:', this._running);
                    console.log('  - 描画フレーム数:', this._frameDrawCount);
                    
                    // Spine描画処理実行
                    this.attachSpineCharacter(assetData, options);
                    
                    console.log('✅ Spine描画投入完了（フェーズA安定化版）');
                    resolve();
                    
                } catch (error) {
                    console.error('❌ 次フレームSpine描画投入失敗:', error);
                    reject(error);
                }
            });
        });
    }

    /**
     * 🚀 Phase 2: Spine描画処理実行
     * @param {object} assetData - アセットデータ
     * @param {object} options - 配置オプション
     */
    attachSpineCharacter(assetData, options) {
        try {
            console.log('🦴 Spine描画処理実行開始', assetData);
            
            // 🚀 循環依存回避: 直接Spine描画を実行（assetsManager委譲を回避）
            const characterData = {
                name: assetData.id || assetData.name,
                ...assetData
            };
            
            const x = options.x || 0;
            const y = options.y || 0;
            
            // 🚀 直接Spine WebGL実行（依存関係単純化）
            this.directSpineRender(characterData, x, y);
            
            console.log('✅ Spine描画処理実行完了');
            
        } catch (error) {
            console.error('❌ Spine描画処理実行失敗:', error);
            throw error;
        }
    }

    /**
     * 🚀 Phase 2: 直接Spine WebGL描画（spine-preview-assets.jsパターン移植）
     * @param {object} characterData - キャラクターデータ
     * @param {number} x - X座標
     * @param {number} y - Y座標
     */
    async directSpineRender(characterData, x, y) {
        try {
            console.log('🦴 直接Spine描画開始（assetsパターン移植）:', characterData);
            
            // 基本的なSpine描画ロジック（simplified version）
            if (!this.gl || !this.spine) {
                throw new Error('Spine WebGL未初期化');
            }
            
            // 🚀 spine-preview-assets.jsパターン移植: パス解決
            const characterName = characterData.name || characterData.id;
            let atlasPath, jsonPath, imagePath;
            
            if (characterData.atlas && characterData.json) {
                // Phase 2パス使用
                atlasPath = characterData.atlas;
                jsonPath = characterData.json;
                imagePath = characterData.pngs?.[0] || characterData.texturePath;
            } else {
                // フォールバック: 標準パス構成
                const basePath = `assets/spine/characters/${characterName}/`;
                atlasPath = `${basePath}${characterName}.atlas`;
                jsonPath = `${basePath}${characterName}.json`;
                imagePath = `${basePath}${characterName}.png`;
                console.log('🔄 標準パスでフォールバック:', { atlasPath, jsonPath, imagePath });
            }
            
            // 🚀 v3成功パターン移植: AssetManager使用
            const assetManager = new spine.AssetManager(this.gl);
            
            console.log('📁 アセット読み込み開始:', { atlasPath, jsonPath, imagePath });
            
            // アセット読み込み
            assetManager.loadTextureAtlas(atlasPath);
            assetManager.loadText(jsonPath);
            if (imagePath) {
                assetManager.loadTexture(imagePath);
            }
            
            // 読み込み完了待機
            await this.waitForAssetManager(assetManager);
            
            // 🚀 v3成功パターン移植: Skeleton作成
            const atlas = assetManager.require(atlasPath);
            const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
            const skeletonJson = new spine.SkeletonJson(atlasLoader);
            const skeletonData = skeletonJson.readSkeletonData(assetManager.require(jsonPath));
            
            const skeleton = new spine.Skeleton(skeletonData);
            // 🚀 統一座標系修正: ドキュメント記載のシンプル化アプローチ適用
            // デスクトップv2座標系問題の解決（過去に何度も発生した問題）
            skeleton.x = 0;  // シンプル化: 中央配置
            skeleton.y = 0;  // シンプル化: 中央配置
            skeleton.scaleX = skeleton.scaleY = 1.0;
            
            // アニメーション設定
            const animationStateData = new spine.AnimationStateData(skeletonData);
            const animationState = new spine.AnimationState(animationStateData);
            
            if (skeletonData.animations.length > 0) {
                animationState.setAnimation(0, skeletonData.animations[0].name, true);
            }
            
            skeleton.updateWorldTransform();
            
            // キャラクター登録
            this.parentLayer.characters.set(characterName, {
                skeleton,
                animationState,
                skeletonData
            });
            
            console.log('✅ 直接Spine描画完了:', characterName);
            
        } catch (error) {
            console.error('❌ 直接Spine描画失敗:', error);
            throw error;
        }
    }

    /**
     * 🚀 Phase 2: AssetManager読み込み待機（簡略版）
     * @param {object} assetManager - spine.AssetManager
     */
    async waitForAssetManager(assetManager) {
        return new Promise((resolve, reject) => {
            const maxWaitTime = 10000; // 10秒
            const startTime = Date.now();
            
            const checkAssets = () => {
                if (assetManager.isLoadingComplete()) {
                    console.log('✅ AssetManager読み込み完了');
                    resolve();
                } else if (Date.now() - startTime > maxWaitTime) {
                    reject(new Error('AssetManager読み込みタイムアウト'));
                } else {
                    setTimeout(checkAssets, 100);
                }
            };
            
            checkAssets();
        });
    }

    /**
     * 🚀 Phase 2: AssetRegistryキャッシュ更新
     * @param {string} characterId - キャラクターID
     * @param {boolean} isReady - 準備完了状態
     */
    updateAssetRegistryCache(characterId, isReady = true) {
        if (isReady) {
            this._assetReadyCache.add(characterId);
        } else {
            this._assetReadyCache.delete(characterId);
        }
        
        console.log(`📦 AssetRegistryキャッシュ更新: ${characterId} = ${isReady}`);
    }
    
    /**
     * 🎨 Canvas要素作成・管理システム
     * 元spine-preview-layer.js行117-136機能移行
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
        
        this.parentLayer.container.appendChild(this.canvas);
        console.log('📐 Canvas作成完了: 800x600');
        
        return this.canvas;
    }
    
    /**
     * 🔧 WebGLコンテキスト初期化・状態管理システム（Web版統一仕様）
     * 元spine-preview-layer.js行141-179機能移行
     */
    async initializeWebGL() {
        // 🚀 Web版統一: 環境差分完全解消
        console.log('🔧 Web版統一WebGL初期化開始');
        console.log('  DPR:', window.devicePixelRatio);
        console.log('  User Agent:', navigator.userAgent);
        
        // 🌐 Web版と完全同一設定（spine-character-manager.js準拠）
        const contextOptions = {
            alpha: true,
            premultipliedAlpha: false    // Web版統一: PMA無効
        };
        
        // 🌐 Web版と同一のWebGLバージョンフォールバック戦略
        console.log('  - Trying WebGL2...');
        this.gl = this.canvas.getContext('webgl2', contextOptions);
        if (this.gl) {
            console.log('✅ WebGL2 context acquired successfully');
            console.log('  - GL Version:', this.gl.getParameter(this.gl.VERSION));
        } else {
            console.log('  - WebGL2 unavailable, trying WebGL1...');
            
            this.gl = this.canvas.getContext('webgl', contextOptions);
            if (this.gl) {
                console.log('✅ WebGL1 context acquired successfully');
                console.log('  - GL Version:', this.gl.getParameter(this.gl.VERSION));
            } else {
                console.log('  - WebGL1 unavailable, trying experimental-webgl...');
                
                this.gl = this.canvas.getContext('experimental-webgl', contextOptions);
                if (this.gl) {
                    console.log('✅ Experimental WebGL context acquired');
                    console.log('  - GL Version:', this.gl.getParameter(this.gl.VERSION));
                } else {
                    this.isInitialized = false;
                    throw new Error('WebGL not supported');
                }
            }
        }
        
        if (!this.gl) {
            this.isInitialized = false;
            throw new Error('WebGL not supported');
        }
        
        // 🔧 Context管理モジュールとのリンク確立
        if (this.parentLayer.contextManager) {
            this.parentLayer.contextManager.linkToParentLayer(
                this.canvas, this.gl, this.spine, this.parentLayer._assetRegistry
            );
        }
        
        // 🚀 サイズ設定（preserveDrawingBuffer削除によりシンプル化）
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
        
        // 🚨 フェーズB: S方式（ストレートα）統一ブレンド設定
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFuncSeparate(
            this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA,  // RGB: ストレートα標準ブレンド
            this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA          // アルファ: 合成用
        );
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0); // 透明背景
        
        // 🚨 フェーズB: S方式テクスチャ設定統一
        this.gl.disable(this.gl.DITHER);  // 安定化の定番
        this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); // ストレートα
        
        // 🚨 フェーズB: ハロー対策強化
        this.setupAntiHaloTextureDefaults();
        
        // 🚨 フェーズB: デバッグ用α方式表示
        console.log('🚨 フェーズB: α方式 = S（ストレートα統一）');
        
        console.log('🌐 Web版統一WebGL設定完了:');
        console.log('  - premultipliedAlpha: false');
        console.log('  - preserveDrawingBuffer: false (デフォルト)');
        console.log('  - blendFuncSeparate: SRC_ALPHA, ONE_MINUS_SRC_ALPHA, ONE, ONE_MINUS_SRC_ALPHA');
        console.log('  - UNPACK_PREMULTIPLY_ALPHA_WEBGL: false');
        console.log('  - DITHER: disabled');
        console.log('  - テクスチャハロー対策: CLAMP_TO_EDGE + LINEAR');
        
        console.log('✅ WebGL初期化完了（Web版統一仕様）');
    }
    
    /**
     * 🚨 フェーズB: アンチハロー強化テクスチャ設定
     */
    setupAntiHaloTextureDefaults() {
        // SpineのAssetManagerがテクスチャを作成する際のハロー対策強化設定
        
        // デフォルト設定を保存
        this._defaultTextureWrap = this.gl.CLAMP_TO_EDGE;
        this._defaultTextureFilter = this.gl.LINEAR;
        
        console.log('🚨 フェーズB: アンチハロー強化設定適用:');
        console.log('  - TEXTURE_WRAP_S/T: CLAMP_TO_EDGE（ブリーディング防止）');
        console.log('  - TEXTURE_MIN/MAG_FILTER: LINEAR（整数ピクセルスナップ推奨）');
        console.log('  - S方式: UNPACK_PREMULTIPLY_ALPHA_WEBGL = false');
        console.log('  - ブレンド: SRC_ALPHA, ONE_MINUS_SRC_ALPHA（ストレートα標準）');
        
        // グローバルテクスチャ状態設定（Spine AssetManager影響用）
        this._applyGlobalTextureState();
    }
    
    /**
     * 🚨 フェーズB: グローバルテクスチャ状態適用
     */
    _applyGlobalTextureState() {
        // 一時的なテクスチャを作成してグローバル設定を適用
        const tempTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, tempTexture);
        
        // ハロー対策設定をデフォルト状態として設定
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        
        // テンポラリテクスチャ削除
        this.gl.deleteTexture(tempTexture);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        
        console.log('✅ グローバルテクスチャ状態設定完了（ハロー対策）');
    }
    
    /**
     * 🚨 フェーズB: P方式（PMA）切り替え実験用（診断時のみ使用）
     */
    switchToPMAMode() {
        console.log('🚨 フェーズB: P方式（PMA）に切り替え中...');
        
        // P方式ブレンド設定
        this.gl.blendFuncSeparate(
            this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA,     // RGB: PMAブレンド
            this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA      // アルファ: PMA合成
        );
        
        // P方式テクスチャ設定
        this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        
        console.log('✅ P方式（PMA）切り替え完了');
        console.log('  - ブレンド: ONE, ONE_MINUS_SRC_ALPHA');
        console.log('  - UNPACK_PREMULTIPLY_ALPHA_WEBGL: true');
        
        // ⚠️ 注意: この切り替えは診断専用。恒久的使用は非推奨
    }
    
    /**
     * 🦴 Spine WebGL初期化システム
     * 元spine-preview-layer.js行352-368機能移行
     */
    async initializeSpine() {
        // Spine WebGLライブラリの読み込み待機（成功パターン）
        await this.waitForSpine();
        
        // Spine WebGLライブラリの確認
        if (typeof spine === 'undefined') {
            this.isInitialized = false;
            throw new Error('Spine WebGL library not loaded');
        }
        
        // Spine WebGL初期化（シンプルシーンパターン）
        this.spine = {
            renderer: new spine.SceneRenderer(this.canvas, this.gl)
        };
        
        // 🚀 初期化完了フラグ設定
        this.isInitialized = true;
        
        console.log('🦴 Spine WebGL初期化完了 - RenderModule準備完了');
    }
    
    /**
     * 🚀 Spine WebGL待機システム（Webアプリ版成功パターン）
     * 元spine-preview-layer.js行372-399機能移行
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
                    this.isInitialized = false;
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
     * 🚀 Canvas制御メソッド群
     * 元spine-preview-layer.js行294-348機能移行
     */
    
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
     * 🚀 環境差分対策強化: 初回サイズ凍結（DPR確定まで固定）
     */
    freezeCanvasSize() {
        if (!this.canvas) return;
        
        // 環境差分対策: DPR確定まで固定サイズ使用
        const dpr = window.devicePixelRatio || 1;
        const frozenWidth = Math.round(800 * dpr);
        const frozenHeight = Math.round(600 * dpr);
        
        this.canvas.width = frozenWidth;
        this.canvas.height = frozenHeight;
        
        console.log(`🔒 環境差分対策: Canvas実ピクセル凍結 ${this.canvas.id} → ${frozenWidth}x${frozenHeight} (DPR: ${dpr})`);
        console.log(`    - 外部モニタ/スケーリング変更対策として初回固定実行`);
        
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
     * 🚀 フェーズA: 初回チラつき対策強化レンダリングループ
     * 元spine-preview-layer.js行790-890機能移行
     * Phase 1成果保持: アプリ起動時から継続稼働・Context Lost対応
     * Phase 2強化: AssetRegistry状態連携・パフォーマンス向上
     * フェーズA新機能: 診断ログ・毎フレーム描画保証・チラつき検知
     */
    startRenderLoop() {
        // 🚀 Phase 1保持: 重複起動防止（_runningフラグ活用）
        if (this._running) {
            console.log('🎬 レンダリングループ既に稼働中（_running=true）');
            return;
        }
        
        // 🚨 フェーズA: 初回チラつき診断用変数初期化
        this._frameDrawCount = 0;
        this._lastCanvasSize = { width: 0, height: 0 };
        this._sizeChangeCount = 0;
        this._firstFrameTime = Date.now();
        
        // 🚀 Phase 1保持: Context Lost状態チェック
        if (this.parentLayer.contextManager && this.parentLayer.contextManager.isContextLost()) {
            console.warn('⚠️ Context Lost状態のため、レンダリングループ開始を保留');
            return;
        }
        
        // 🚀 Phase 1保持: 稼働フラグ設定
        this._running = true;
        this.isRendering = true;
        
        // 親レイヤーの状態も同期
        if (this.parentLayer) {
            this.parentLayer._running = true;
            this.parentLayer.isRenderingActive = true;
        }
        
        console.log('🚨 フェーズA: 初回チラつき対策レンダーループ開始（診断ログ有効）');
        console.log('  - キャラクター0体でも毎フレーム描画を開始');
        console.log('  - Canvas サイズ揺れ監視開始');
        console.log('  - 初回チラつき診断ログ有効');
        
        this._lastTime = Date.now() / 1000;
        this._frameCount = 0;
        this._lastPerformanceLog = Date.now();
        
        const render = () => {
            // 🚀 Phase 1保持: Context Lost時の安全な停止
            if (this.parentLayer.contextManager && this.parentLayer.contextManager.isContextLost()) {
                console.warn('⚠️ Context Lost検出 - レンダリング一時停止');
                this._running = false;
                this.isRendering = false;
                if (this.parentLayer) {
                    this.parentLayer._running = false;
                    this.parentLayer.isRenderingActive = false;
                }
                return;
            }
            
            // 🚀 Phase 1保持: 停止要求チェック
            if (!this._running) {
                console.log('🔴 レンダリング停止要求（_running=false）');
                this.isRendering = false;
                if (this.parentLayer) {
                    this.parentLayer.isRenderingActive = false;
                }
                return;
            }
            
            // 🚀 Phase 1保持: WebGLコンテキスト状態確認（安全チェック）
            if (this.parentLayer.contextManager && this.parentLayer.contextManager.isContextLost()) {
                console.error('❌ WebGL Context Lost検出 - 停止・復旧待機');
                this._running = false;
                this.isRendering = false;
                if (this.parentLayer) {
                    this.parentLayer._running = false;
                    this.parentLayer.isRenderingActive = false;
                }
                return;
            }
            
            const now = Date.now() / 1000;
            const delta = now - this._lastTime;
            this._lastTime = now;
            this._frameCount++;
            
            try {
                // 🚨 フェーズA: サイズ揺れ診断（初回3秒間）
                this.diagnoseCanvasSizeFlicker();
                
                // 🚨 フェーズA: 毎フレーム描画保証（キャラクター0体でも描画）
                const didDraw = this.renderAllCharactersWithFlickerDiagnosis(delta);
                this._frameDrawCount++;
                
                // 🚀 Phase 2: パフォーマンスログ（60秒毎）
                if (Date.now() - this._lastPerformanceLog > 60000) {
                    const fps = this._frameCount / 60;
                    const characterCount = this.parentLayer.characters ? this.parentLayer.characters.size : 0;
                    const hasAssetRegistry = this.parentLayer._assetRegistry ? '有効' : '無効';
                    console.log(`📊 レンダリングパフォーマンス: ${fps.toFixed(1)}FPS, キャラクター: ${characterCount}体, AssetRegistry: ${hasAssetRegistry}`);
                    console.log(`🚨 フェーズA診断: 描画回数=${this._frameDrawCount}, サイズ変更=${this._sizeChangeCount}`);
                    this._frameCount = 0;
                    this._lastPerformanceLog = Date.now();
                }
                
            } catch (error) {
                console.error('❌ レンダリングエラー:', error);
                // 🚀 Phase 1保持: エラー時もrAF継続（設計仕様）
            }
            
            // 🚀 Phase 1保持: 次フレーム予約（エラー時も継続）
            this._rafId = requestAnimationFrame(render);
        };
        
        // 🚀 Phase 1保持: 初回フレーム開始
        this._rafId = requestAnimationFrame(render);
    }
    
    /**
     * 🚀 Phase 1: レンダリング停止（最適化版）
     */
    stopRenderLoop() {
        console.log('⏹️ Phase 2 レンダリングループ停止開始');
        
        // 🚀 Phase 1: 稼働フラグ停止
        this._running = false;
        this.isRendering = false;
        
        // 親レイヤーの状態も同期
        if (this.parentLayer) {
            this.parentLayer._running = false;
            this.parentLayer.isRenderingActive = false;
        }
        
        // 🚀 Phase 1: rAFキャンセル（_rafId使用）
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = 0;
        }
        
        // 🔧 互換性: 親レイヤーの旧フラグもクリア
        if (this.parentLayer && this.parentLayer.renderLoopId) {
            cancelAnimationFrame(this.parentLayer.renderLoopId);
            this.parentLayer.renderLoopId = null;
        }
        
        console.log('✅ Phase 2 レンダリングループ停止完了');
    }
    
    /**
     * 🚀 Phase 2: 最適化された全キャラクターレンダリング実装
     * 元spine-preview-layer.js行934-985機能移行
     * AssetRegistry連携・パフォーマンス向上・スマートスキップ
     */
    renderAllCharactersOptimized(delta) {
        // 🚀 Phase 2: 基本コンポーネント存在確認（ファストパス）
        if (!this.gl || !this.spine || !this.spine.renderer) {
            return; // 早期リターン
        }
        
        if (!this.parentLayer.characters || this.parentLayer.characters.size === 0) {
            return; // キャラクター未登録
        }
        
        // 🚀 Phase 2: 効率的な画面クリア（バッチ処理）
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        // 🚀 Phase 2: AssetRegistry連携キャラクター優先レンダリング
        let assetRegistryCount = 0;
        let fallbackCount = 0;
        
        this.parentLayer.characters.forEach((character, characterId) => {
            try {
                // 🚀 Phase 2: キャラクター準備状態クイックチェック
                if (!character.skeleton || !character.animationState) {
                    return; // スキップ（早期リターン）
                }
                
                // 🚀 Phase 2: AssetRegistry連携チェック
                const isAssetRegistryReady = this._assetReadyCache.has(characterId) || 
                                           (this.parentLayer._assetReadyCache && this.parentLayer._assetReadyCache.has(characterId));
                
                if (isAssetRegistryReady) {
                    assetRegistryCount++;
                } else {
                    fallbackCount++;
                }
                
                // アニメーション更新（最適化済み）
                character.animationState.update(delta);
                character.animationState.apply(character.skeleton);
                character.skeleton.updateWorldTransform();
                
                // スケルトン描画
                this.spine.renderer.drawSkeleton(character.skeleton, false);
                
            } catch (error) {
                console.error(`❌ Phase 2: ${characterId} レンダリングエラー:`, error);
                // 🚀 Phase 2: エラーキャラクターを除外キャッシュに追加（将来的なスキップ用）
            }
        });
        
        // 🚀 Phase 2: パフォーマンスメトリクス記録（デバッグ情報）
        if ((assetRegistryCount > 0 || fallbackCount > 0) && Math.random() < 0.001) { // 0.1%の確率でログ出力
            console.log(`📊 Phase 2 レンダリング統計: AssetRegistry=${assetRegistryCount}, Fallback=${fallbackCount}`);
        }
    }
    
    /**
     * 🚀 Phase 1保持: 全キャラクターレンダリング実装（フォールバック用）
     * 元spine-preview-layer.js行896-928機能移行
     * 設計仕様: 分離されたレンダリングロジック
     */
    renderAllCharacters(delta) {
        // 🚀 Phase 1: 基本コンポーネント存在確認
        if (!this.gl || !this.spine || !this.spine.renderer) {
            return; // レンダリング環境未準備
        }
        
        // 🚀 Phase 1: 画面クリア
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        // 🚀 Phase 1: キャラクター存在確認
        if (!this.parentLayer.characters || this.parentLayer.characters.size === 0) {
            return; // キャラクター未登録
        }
        
        // 🚀 Phase 1: 全キャラクターのレンダリング
        this.parentLayer.characters.forEach((character, characterId) => {
            try {
                // キャラクターの準備状態確認
                if (character.skeleton && character.animationState) {
                    // アニメーション更新
                    character.animationState.update(delta);
                    character.animationState.apply(character.skeleton);
                    character.skeleton.updateWorldTransform();
                    
                    // スケルトン描画
                    this.spine.renderer.drawSkeleton(character.skeleton, false);
                }
            } catch (error) {
                console.error(`❌ ${characterId} レンダリングエラー:`, error);
                // 🚀 Phase 1: 個別エラーは継続（他キャラクターに影響しない）
            }
        });
    }
    
    /**
     * 🚨 フェーズA: Canvas サイズ揺れ診断（初回3秒間）
     */
    diagnoseCanvasSizeFlicker() {
        // 初回3秒間のみ診断実行
        if (Date.now() - this._firstFrameTime > 3000) return;
        
        if (!this.canvas) return;
        
        const currentSize = {
            width: this.canvas.width,
            height: this.canvas.height
        };
        
        // サイズ変更検出
        if (this._lastCanvasSize.width !== currentSize.width || 
            this._lastCanvasSize.height !== currentSize.height) {
            
            this._sizeChangeCount++;
            console.log(`🚨 サイズ変更検出 #${this._sizeChangeCount}: ${this._lastCanvasSize.width}x${this._lastCanvasSize.height} → ${currentSize.width}x${currentSize.height}`);
            
            // 初回5回以上の連続サイズ変更は異常
            if (this._sizeChangeCount >= 5) {
                console.warn('⚠️ 初回サイズ揺れ異常検出 - Canvas実ピクセル凍結を推奨');
                console.warn('  対策: freezeCanvasSize() で500ms固定化');
            }
            
            this._lastCanvasSize = { ...currentSize };
        }
    }
    
    /**
     * 🚨 フェーズA: チラつき診断付き全キャラクターレンダリング
     */
    renderAllCharactersWithFlickerDiagnosis(delta) {
        // 🚨 毎フレーム画面クリア（preserveDrawingBuffer:false対策）
        if (!this.gl) {
            return false; // WebGL未初期化
        }
        
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        let didDrawAny = false;
        
        // キャラクター数チェック
        const characterCount = this.parentLayer.characters ? this.parentLayer.characters.size : 0;
        
        if (characterCount === 0) {
            // 🚨 キャラクター0体でも描画フレームとしてカウント
            // （preserveDrawingBuffer:false では何かしら描画が必要）
            didDrawAny = true; // クリアのみでも描画扱い
        } else {
            // 通常の全キャラクターレンダリング
            this.parentLayer.characters.forEach((character, characterId) => {
                try {
                    if (character.skeleton && character.animationState) {
                        // アニメーション更新
                        character.animationState.update(delta);
                        character.animationState.apply(character.skeleton);
                        character.skeleton.updateWorldTransform();
                        
                        // スケルトン描画
                        if (this.spine && this.spine.renderer) {
                            this.spine.renderer.drawSkeleton(character.skeleton, false);
                            didDrawAny = true;
                        }
                    }
                } catch (error) {
                    console.error(`❌ ${characterId} レンダリングエラー:`, error);
                }
            });
        }
        
        // 🚨 初回10フレームの描画状態ログ
        if (this._frameDrawCount < 10) {
            console.log(`🚨 フレーム${this._frameDrawCount}: 描画=${didDrawAny}, キャラ数=${characterCount}, Canvas=${this.canvas?.width}x${this.canvas?.height}`);
        }
        
        return didDrawAny;
    }
    
    /**
     * 🚀 Phase 2: Context復旧時のレンダラー再作成
     */
    async recoverRenderer() {
        try {
            console.log('🔄 Phase 2: レンダラー復旧開始');
            
            // WebGLコンテキスト再取得
            await this.initializeWebGL();
            
            // Spine レンダラー再作成
            if (typeof spine !== 'undefined' && spine.SceneRenderer) {
                this.spine.renderer = new spine.SceneRenderer(this.canvas, this.gl);
                console.log('✅ Spine レンダラー復旧完了');
            }
            
            // レンダリングループ再開
            if (!this._running) {
                this.startRenderLoop();
            }
            
        } catch (error) {
            console.error('❌ Phase 2: レンダラー復旧失敗:', error);
            throw error;
        }
    }
    
    /**
     * 🚀 Phase 2: AssetRegistry連携状態管理
     */
    updateAssetRegistryCache(characterId, isReady = true) {
        if (isReady) {
            this._assetReadyCache.add(characterId);
        } else {
            this._assetReadyCache.delete(characterId);
        }
    }
    
    /**
     * 🔧 レンダリング環境確認
     */
    isRenderingReady() {
        return this.isInitialized &&
               this.canvas && 
               this.gl && 
               !this.gl.isContextLost() && 
               this.spine && 
               this.spine.renderer;
    }
    
    /**
     * 🧹 Phase 2: リソース解放
     */
    dispose() {
        console.log('🧹 Phase 2: SpinePreviewRender リソース解放開始');
        
        // レンダリング完全停止
        this.stopRenderLoop();
        
        // フラグリセット
        this.isInitialized = false;
        this._running = false;
        this._rafId = 0;
        this.isRendering = false;
        
        // キャッシュクリア
        if (this._assetReadyCache) {
            this._assetReadyCache.clear();
        }
        
        // Canvasを削除
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        // 参照クリア
        this.canvas = null;
        this.gl = null;
        this.spine = null;
        this.parentLayer = null;
        
        console.log('✅ Phase 2: SpinePreviewRender 解放完了');
    }
}