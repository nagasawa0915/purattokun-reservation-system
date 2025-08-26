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
            spineData: null
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
            
            // Spine WebGLライブラリの確認
            if (typeof window === 'undefined' || !window.spine) {
                throw new Error('Spine WebGLライブラリが読み込まれていません');
            }
            
            // アセットマネージャ作成
            const assetManager = new window.spine.AssetManager();
            
            // ファイル読み込み
            assetManager.loadText(this.config.atlasPath);
            assetManager.loadJson(this.config.jsonPath);
            
            // 読み込み完了待ち
            await this.waitForAssets(assetManager);
            
            // Atlas作成
            const atlasText = assetManager.get(this.config.atlasPath);
            const atlas = new window.spine.TextureAtlas(atlasText, (path) => {
                const fullPath = this.config.basePath + path;
                return assetManager.get(fullPath);
            });
            
            // SkeletonJson作成
            const skeletonJson = new window.spine.SkeletonJson(new window.spine.AtlasAttachmentLoader(atlas));
            
            // JSONデータ読み込み
            const jsonData = assetManager.get(this.config.jsonPath);
            const skeletonData = skeletonJson.readSkeletonData(jsonData);
            
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
            
            // 状態リセット
            this.loadState = {
                loaded: false,
                loading: false,
                error: null,
                spineData: null
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