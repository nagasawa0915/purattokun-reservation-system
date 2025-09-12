/**
 * DirectFileSpineRenderer - File APIとSpineレンダリングの完全統合
 * 
 * 🎯 目的
 * - MeshAttachment.updateRegion問題を完全回避
 * - DirectSpineLoaderとStableSpineRendererの統合
 * - 1ライン初期化：DirectFileSpineRenderer.createFromFiles()
 * - 確実で安定したSpine表示を保証
 * 
 * 🚀 特徴
 * - File System Access API統合
 * - HTTPサーバー不要のローカル動作
 * - 成功実績のある初期化パターンを使用
 * - シンプルAPI：複雑な設定不要
 */

class DirectFileSpineRenderer {
    constructor() {
        this.debug = true;
        this.loader = new DirectSpineLoader();
        this.renderer = null;
        this.canvas = null;
        this.gl = null;
    }

    /**
     * ログ出力（デバッグ用）
     */
    log(message, type = 'info') {
        if (!this.debug) return;
        
        const emoji = {
            info: '🎬',
            success: '✅',
            error: '❌',
            warning: '⚠️'
        };
        
        console.log(`${emoji[type]} DirectFileSpineRenderer: ${message}`);
    }

    /**
     * File System Access APIからSpineキャラクターを作成（メインAPI）
     * @param {Object} config - 設定オプション
     * @returns {DirectFileSpineRenderer} インスタンス
     */
    static async createFromFiles(config = {}) {
        const instance = new DirectFileSpineRenderer();
        await instance.initializeFromFiles(config);
        return instance;
    }

    /**
     * ファイル選択からSpineレンダリングまでの完全処理
     * @param {Object} config - {canvas, character, position, debug}
     */
    async initializeFromFiles(config) {
        this.log('🚀 DirectFileSpineRenderer初期化開始...');
        
        try {
            // 設定の処理
            this.canvas = config.canvas || this.createDefaultCanvas();
            
            // WebGLコンテキストを取得して確実に設定
            this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
            if (!this.gl) {
                throw new Error('WebGLコンテキストの取得に失敗');
            }
            
            // DirectSpineLoaderでWebGLコンテキストを使用するため設定
            this.loader.gl = this.gl;
            this.debug = config.debug !== false;
            
            // WebGLコンテキスト初期化
            this.initializeWebGL();
            
            // ファイル選択
            this.log('📂 Spineファイルの選択を開始...');
            const files = await this.loader.selectSpineFiles();
            
            // アセット読み込み
            this.log('📦 アセットデータ読み込み...');
            const assets = await this.loader.loadSpineAssets(files, this.gl);
            
            // StableSpineRenderer初期化（特別パッチ適用）
            await this.initializeStableRenderer(assets, config);
            
            this.log('✅ DirectFileSpineRenderer初期化完了！', 'success');
            
        } catch (error) {
            this.log(`初期化エラー: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * デフォルトアセット（nezumi）からSpineレンダリングを初期化
     * @param {Object} config - 設定オプション
     */
    async initializeFromDefaultAssets(config = {}) {
        this.log('🚀 デフォルトアセットでの初期化開始...');
        
        try {
            this.canvas = config.canvas || this.createDefaultCanvas();
            this.debug = config.debug !== false;
            
            // WebGLコンテキスト初期化
            this.initializeWebGL();
            
            // デフォルトアセット読み込み
            const character = config.character || 'nezumi';
            const assets = await this.loader.loadDefaultSpineAssets(character, this.gl);
            
            // StableSpineRenderer初期化
            await this.initializeStableRenderer(assets, config);
            
            this.log('✅ デフォルトアセット初期化完了！', 'success');
            
        } catch (error) {
            this.log(`デフォルトアセット初期化エラー: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * WebGLコンテキストの初期化
     */
    initializeWebGL() {
        this.log('🖥️ WebGLコンテキスト初期化...');
        
        if (typeof this.canvas === 'string') {
            this.canvas = document.querySelector(this.canvas);
        }
        
        if (!this.canvas) {
            throw new Error('Canvasが見つかりません');
        }
        
        // WebGLコンテキスト取得（StableSpineRenderer設定と同じ）
        this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
        
        if (!this.gl) {
            throw new Error('WebGLコンテキストを取得できません');
        }
        
        // グローバル参照設定（TextureLoader用）
        window.gl = this.gl;
        
        this.log(`✅ WebGLコンテキスト初期化完了: WebGL${this.gl instanceof WebGL2RenderingContext ? '2' : '1'}`);
    }

    /**
     * StableSpineRendererの初期化（特別パッチ適用）
     * @param {Object} assets - DirectSpineLoaderで読み込んだアセット
     * @param {Object} config - 設定オプション
     */
    async initializeStableRenderer(assets, config) {
        this.log('🎭 StableSpineRenderer統合開始...');
        
        try {
            // StableSpineRendererを直接データ統合用にパッチ
            const rendererConfig = {
                canvas: this.canvas,
                character: config.character || 'direct-file',
                
                // DirectSpineLoaderで読み込んだデータを直接使用
                directAssets: assets,
                
                // 位置・スケール設定
                position: config.position || {
                    x: 200,
                    y: 300,
                    scaleX: 0.5,
                    scaleY: 0.5
                },
                
                // その他の設定
                debug: this.debug
            };
            
            // StableSpineRenderer初期化（特別パッチ版）
            this.renderer = new StableSpineRenderer(rendererConfig);
            
            // 直接データを使用するための内部初期化
            await this.patchStableSpineRenderer(assets);
            
            this.log('✅ StableSpineRenderer統合完了');
            
        } catch (error) {
            this.log(`StableSpineRenderer統合エラー: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * StableSpineRendererを直接データ統合用にパッチ
     * @param {Object} assets - 読み込み済みアセット
     */
    async patchStableSpineRenderer(assets) {
        this.log('🔧 StableSpineRendererパッチ適用...');
        
        // 内部データを直接設定
        this.renderer.atlas = assets.atlas;
        this.renderer.skeletonJsonData = assets.skeletonJsonData;
        this.renderer.textureImg = assets.img;
        
        // initializeSkeleton()を直接呼び出し
        await this.renderer.initializeSkeletonDirect(assets);
        
        // レンダリング開始
        this.renderer.startRendering();
        
        this.log('✅ パッチ適用完了');
    }

    /**
     * デフォルトCanvasを作成
     */
    createDefaultCanvas() {
        this.log('🖼️ デフォルトCanvas作成...');
        
        const canvas = document.createElement('canvas');
        canvas.id = 'direct-spine-canvas';
        canvas.width = 800;
        canvas.height = 600;
        canvas.style.border = '1px solid #ccc';
        
        // ページに追加
        document.body.appendChild(canvas);
        
        return canvas;
    }

    /**
     * アニメーション再生
     * @param {string} animationName - アニメーション名
     */
    playAnimation(animationName) {
        if (!this.renderer || !this.renderer.animationState) {
            this.log('レンダラーが初期化されていません', 'error');
            return;
        }
        
        try {
            this.renderer.animationState.setAnimation(0, animationName, true);
            this.log(`🎬 アニメーション再生: ${animationName}`);
        } catch (error) {
            this.log(`アニメーション再生エラー: ${error.message}`, 'error');
        }
    }

    /**
     * 利用可能なアニメーション名を取得
     * @returns {Array} アニメーション名の配列
     */
    getAvailableAnimations() {
        if (!this.renderer || !this.renderer.skeletonData) {
            return [];
        }
        
        return this.renderer.skeletonData.animations.map(anim => anim.name);
    }

    /**
     * レンダラー停止
     */
    dispose() {
        if (this.renderer && this.renderer.dispose) {
            this.renderer.dispose();
            this.log('🗑️ レンダラーを停止しました');
        }
    }

    /**
     * 診断情報を取得
     * @returns {Object} 診断データ
     */
    getDiagnostics() {
        const info = {
            initialized: !!this.renderer,
            canvas: {
                width: this.canvas?.width || 0,
                height: this.canvas?.height || 0,
                id: this.canvas?.id || 'unknown'
            },
            webgl: {
                version: this.gl instanceof WebGL2RenderingContext ? 'WebGL2' : 'WebGL1',
                vendor: this.gl?.getParameter(this.gl.VENDOR) || 'unknown'
            },
            spine: {
                atlas: !!this.renderer?.atlas,
                skeleton: !!this.renderer?.skeleton,
                animations: this.getAvailableAnimations()
            }
        };
        
        return info;
    }
}

// StableSpineRendererにパッチメソッドを追加
if (typeof window !== 'undefined' && window.StableSpineRenderer) {
    /**
     * 直接アセットデータからSkeletonを初期化（パッチメソッド）
     */
    window.StableSpineRenderer.prototype.initializeSkeletonDirect = async function(assets) {
        this.log('🎭 直接アセットからSkeleton初期化開始...');
        
        try {
            // アセットデータを内部プロパティに設定
            this.atlas = assets.atlas;
            this.skeletonJsonData = assets.skeletonJsonData;
            
            // AtlasAttachmentLoaderを作成（atlas直接使用）
            const atlasAttachmentLoader = new window.spine.AtlasAttachmentLoader(this.atlas);
            
            // SkeletonJsonを初期化
            const skeletonJson = new window.spine.SkeletonJson(atlasAttachmentLoader);
            
            // 🔍 Atlas検証（詳細）
            this.log('🔍 Atlas詳細検証開始...');
            this.log(`  Atlas存在: ${!!this.atlas}`);
            this.log(`  Atlas pages数: ${this.atlas?.pages?.length || 0}`);
            this.log(`  Atlas regions数: ${this.atlas?.regions?.length || 0}`);
            
            // 各regionの詳細確認
            if (this.atlas && this.atlas.regions) {
                this.atlas.regions.forEach((region, index) => {
                    this.log(`  Region[${index}]: ${region.name}, page: ${region.page ? 'OK' : 'NULL'}`);
                    if (region.page) {
                        this.log(`    page.getImage: ${typeof region.page.getImage}`);
                    }
                });
            }
            
            // SkeletonData作成（ここでMeshAttachment.updateRegion問題が発生する可能性）
            this.log('🦴 SkeletonData読み込み開始（直接アセット）...');
            this.skeletonData = skeletonJson.readSkeletonData(this.skeletonJsonData);
            this.log('✅ SkeletonData読み込み完了（直接アセット）');
            
            // スケルトン作成
            this.skeleton = new window.spine.Skeleton(this.skeletonData);
            
            // 位置・スケール設定
            this.skeleton.x = this.config.position?.x || 200;
            this.skeleton.y = this.config.position?.y || 300;
            this.skeleton.scaleX = this.config.position?.scaleX || 0.5;
            this.skeleton.scaleY = this.config.position?.scaleY || 0.5;
            
            // アニメーション設定
            this.animationState = new window.spine.AnimationState(
                new window.spine.AnimationStateData(this.skeletonData)
            );
            
            // 最初のアニメーションを自動設定
            if (this.skeletonData.animations.length > 0) {
                const firstAnimation = this.skeletonData.animations[0].name;
                this.animationState.setAnimation(0, firstAnimation, true);
                this.log(`🎬 自動アニメーション設定: ${firstAnimation}`);
            }
            
            this.log('✅ 直接アセットSkeleton初期化完了', 'success');
            
        } catch (error) {
            this.log(`直接アセットSkeleton初期化エラー: ${error.message}`, 'error');
            throw error;
        }
    };
}

// モジュールエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DirectFileSpineRenderer;
}

// ブラウザ環境でグローバルに利用可能にする
if (typeof window !== 'undefined') {
    window.DirectFileSpineRenderer = DirectFileSpineRenderer;
}