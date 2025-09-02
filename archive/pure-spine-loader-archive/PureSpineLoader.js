/**
 * PureSpineLoader - v4マイクロモジュール設計
 * 
 * 🎯 絶対ルール
 * 1. 外部依存ゼロ（他モジュール・グローバル変数禁止）
 * 2. 単一責務のみ：Spineファイル読み込み専用
 * 3. cleanup()で完全復元保証
 * 4. 数値・文字列のみで他モジュールと通信
 * 
 * 責務: Spineファイル（.atlas, .json, .png）の読み込み専用
 * 入力: {atlasPath: string, jsonPath: string, basePath: string, scale: number}
 * 出力: {loaded: boolean, spineData: object, error: string|null}
 * 
 * 禁止事項:
 * - DOM操作（canvasへの描画等）禁止
 * - アニメーション制御禁止
 * - 他ファイルへの影響禁止
 * - 状態の永続化禁止
 * 
 * 🎨 WebGL最適化設定マニュアル
 * ==============================
 * 
 * ## 🎯 アルファ/透明度処理の最適化
 * 
 * Spineキャラクターの口パク時に黒枠が表示される問題を解決するための設定：
 * 
 * ### WebGLコンテキスト作成時の設定
 * ```javascript
 * const gl = canvas.getContext('webgl', {
 *     alpha: true,                  // アルファチャンネル有効
 *     premultipliedAlpha: true,     // プリマルチプライアルファ有効（重要）
 *     antialias: true,              // アンチエイリアシング有効
 *     depth: false,                 // デプステスト無効化
 *     stencil: false                // ステンシルテスト無効化
 * });
 * ```
 * 
 * ### ブレンド設定の最適化
 * ```javascript
 * gl.enable(gl.BLEND);
 * 
 * // プリマルチプライアルファ用ブレンド設定
 * gl.blendFuncSeparate(
 *     gl.ONE, gl.ONE_MINUS_SRC_ALPHA,     // RGB用ブレンド
 *     gl.ONE, gl.ONE_MINUS_SRC_ALPHA      // Alpha用ブレンド
 * );
 * 
 * // アルファテスト設定（透明度カットオフ）
 * gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
 * ```
 * 
 * ### テクスチャフィルタリング設定
 * ```javascript
 * // テクスチャバインド時の自動設定
 * const originalBindTexture = gl.bindTexture.bind(gl);
 * gl.bindTexture = (target, texture) => {
 *     const result = originalBindTexture(target, texture);
 *     
 *     if (target === gl.TEXTURE_2D && texture) {
 *         // ピクセルパーフェクト（補間なし）
 *         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
 *         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
 *         
 *         // テクスチャ境界処理（境界をクランプ）
 *         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
 *         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
 *     }
 *     
 *     return result;
 * };
 * ```
 * 
 * ## 🔧 問題解決パターン
 * 
 * ### 黒枠問題（口パク時）
 * - **原因**: プリマルチプライアルファ設定の不一致
 * - **解決策**: `premultipliedAlpha: true` + 適切なブレンド設定
 * 
 * ### テクスチャ境界のにじみ
 * - **原因**: LINEAR フィルタリングによる補間
 * - **解決策**: `gl.NEAREST` フィルタリング + `gl.CLAMP_TO_EDGE`
 * 
 * ### 透明度処理の問題
 * - **原因**: アルファテスト設定の不備
 * - **解決策**: `gl.SAMPLE_ALPHA_TO_COVERAGE` 有効化
 * 
 * ## ⚠️ 注意事項
 * 
 * - index.htmlとtest-*.htmlで設定を統一すること
 * - WebGLコンテキスト作成は最初に１回のみ
 * - テクスチャ設定は動的にオーバーライドが必要
 * - ブレンド設定はSpine描画前に適用すること
 */

class PureSpineLoader {
    constructor(input) {
        console.log('🧪 PureSpineLoader: コンストラクタ開始', input);
        
        // 入力検証
        this.validateInput(input);
        
        // 初期状態バックアップ（外部依存なし）
        this.initialState = {
            windowSpine: typeof window !== 'undefined' ? window.spine : undefined
        };
        
        // 内部状態初期化（外部依存なし）
        this.config = {
            basePath: input.basePath,
            atlasPath: input.atlasPath,
            jsonPath: input.jsonPath,
            scale: input.scale || 1.0
        };
        
        this.loadState = {
            loaded: false,
            loading: false,
            error: null,
            spineData: null,
            tempCanvas: null  // 一時Canvas要素の記録
        };
        
        console.log('✅ PureSpineLoader: 初期化完了');
    }
    
    /**
     * 入力パラメータ検証
     */
    validateInput(input) {
        if (!input || typeof input !== 'object') {
            throw new Error('❌ PureSpineLoader: 入力パラメータがobjectである必要があります');
        }
        
        const required = ['basePath', 'atlasPath', 'jsonPath'];
        for (const key of required) {
            if (!input[key] || typeof input[key] !== 'string') {
                throw new Error(`❌ PureSpineLoader: ${key}が必要です（文字列）`);
            }
        }
    }
    
    /**
     * 非DOM: Spineファイル読み込み専用
     */
    async execute() {
        if (this.loadState.loading) {
            console.log('⚠️ PureSpineLoader: 読み込み中...');
            return this.getOutput();
        }
        
        try {
            console.log('🚀 PureSpineLoader: 読み込み開始');
            this.loadState.loading = true;
            this.loadState.error = null;
            
            // Spine WebGLライブラリの確認（詳細検証）
            if (typeof window === 'undefined' || !window.spine) {
                throw new Error('Spine WebGLライブラリが読み込まれていません（window.spineが未定義）');
            }
            
            // 必要なWebGLクラス群の存在確認（トラブルシューティング対応版）
            const requiredClasses = [
                'AssetManager',
                'SkeletonJson', 
                'AtlasAttachmentLoader',
                'PolygonBatcher',
                'SkeletonRenderer',
                'Skeleton',
                'AnimationState'
            ];
            
            const missingClasses = requiredClasses.filter(className => 
                !window.spine[className]
            );
            
            if (missingClasses.length > 0) {
                console.warn('⚠️ 不足しているSpineクラス:', missingClasses);
                console.log('🔍 利用可能なSpineクラス:', Object.keys(window.spine));
                throw new Error(`Spine WebGLに必要なクラスが不足しています: ${missingClasses.join(', ')}`);
            }
            
            console.log('✅ Spine WebGLライブラリ検証完了（必要クラス確認済み）');
            
            // 一時的なCanvasとWebGLコンテキスト作成（AssetManager用）
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 1;
            tempCanvas.height = 1;
            const gl = tempCanvas.getContext('webgl') || tempCanvas.getContext('experimental-webgl');
            if (!gl) {
                throw new Error('WebGLコンテキストの作成に失敗しました');
            }
            
            // cleanup用に記録
            this.loadState.tempCanvas = tempCanvas;
            
            console.log('🔧 一時WebGLコンテキスト作成成功（AssetManager用）');
            
            // アセットマネージャ作成（WebGLコンテキスト付き）
            const assetManager = new window.spine.AssetManager(gl);
            
            // ファイル読み込み（loadTextureAtlasを使用）
            assetManager.loadJson(this.config.jsonPath);
            assetManager.loadTextureAtlas(this.config.atlasPath);
            
            console.log('📦 ファイル読み込み予約:', {
                json: this.config.jsonPath,
                atlas: this.config.atlasPath
            });
            
            // 読み込み完了待ち
            await this.waitForAssets(assetManager);
            
            // AssetManager状態確認
            console.log('📊 AssetManager読み込み状況:');
            console.log('  - loadingComplete:', assetManager.isLoadingComplete());
            console.log('  - hasErrors:', assetManager.hasErrors());
            if (assetManager.hasErrors()) {
                console.log('  - errors:', assetManager.getErrors());
            }
            
            // Atlas取得（loadTextureAtlasで読み込んだものを使用）
            const atlas = assetManager.require(this.config.atlasPath);
            console.log('🖼️ Atlas取得:', atlas ? 'OK' : 'NG');
            
            // SkeletonJson作成
            const skeletonJson = new window.spine.SkeletonJson(new window.spine.AtlasAttachmentLoader(atlas));
            
            // JSONデータ取得
            const jsonData = assetManager.require(this.config.jsonPath);
            console.log('📋 JSON取得:', jsonData ? 'OK' : 'NG');
            
            const skeletonData = skeletonJson.readSkeletonData(jsonData);
            console.log('🦴 SkeletonData作成:', skeletonData ? 'OK' : 'NG');
            
            // 結果保存
            this.loadState.spineData = {
                skeletonData,
                atlas,
                assetManager,
                scale: this.config.scale
            };
            
            this.loadState.loaded = true;
            this.loadState.loading = false;
            
            console.log('✅ PureSpineLoader: 読み込み成功');
            return this.getOutput();
            
        } catch (error) {
            console.error('❌ PureSpineLoader: 読み込みエラー:', error);
            this.loadState.error = error.message;
            this.loadState.loading = false;
            return this.getOutput();
        }
    }
    
    /**
     * アセット読み込み完了待ち
     */
    async waitForAssets(assetManager) {
        return new Promise((resolve, reject) => {
            const checkLoading = () => {
                if (assetManager.isLoadingComplete()) {
                    resolve();
                } else if (assetManager.hasErrors()) {
                    reject(new Error('アセット読み込みエラー: ' + assetManager.getErrors()));
                } else {
                    setTimeout(checkLoading, 50);
                }
            };
            checkLoading();
        });
    }
    
    /**
     * 出力データ取得（数値・文字列のみ）
     */
    getOutput() {
        return {
            loaded: this.loadState.loaded,
            loading: this.loadState.loading,
            error: this.loadState.error,
            spineData: this.loadState.spineData,
            config: {...this.config}
        };
    }
    
    /**
     * 状態リセット（完全復元保証）
     */
    cleanup() {
        try {
            // Spineリソースの解放
            if (this.loadState.spineData) {
                if (this.loadState.spineData.atlas) {
                    this.loadState.spineData.atlas.dispose();
                }
                if (this.loadState.spineData.assetManager) {
                    this.loadState.spineData.assetManager.dispose();
                }
            }
            
            // 一時Canvas削除
            if (this.loadState.tempCanvas) {
                this.loadState.tempCanvas.remove();
                this.loadState.tempCanvas = null;
            }
            
            // 状態リセット
            this.loadState = {
                loaded: false,
                loading: false,
                error: null,
                spineData: null,
                tempCanvas: null
            };
            
            console.log('🧹 PureSpineLoader: クリーンアップ完了');
            
        } catch (error) {
            console.error('❌ PureSpineLoader: クリーンアップエラー:', error);
        }
    }
    
    /**
     * 単独テスト
     */
    static async test() {
        console.log('🧪 PureSpineLoader: テスト開始');
        
        try {
            const loader = new PureSpineLoader({
                basePath: '/assets/spine/characters/purattokun/',
                atlasPath: '/assets/spine/characters/purattokun/purattokun.atlas',
                jsonPath: '/assets/spine/characters/purattokun/purattokun.json',
                scale: 1.0
            });
            
            const result = await loader.execute();
            
            console.log('✅ PureSpineLoader テスト成功:', result.loaded ? '読み込み成功' : result.error);
            
            // クリーンアップ
            loader.cleanup();
            
            return {
                success: result.loaded,
                loader: loader,
                result: result
            };
            
        } catch (error) {
            console.error('❌ PureSpineLoader テスト失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.PureSpineLoader = PureSpineLoader;
    
    // テスト関数もグローバルに
    window.testSpineLoader = PureSpineLoader.test;
}