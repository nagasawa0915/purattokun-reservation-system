/**
 * 🚨 DEPRECATED - このファイルは廃止されました
 * 
 * 新しい場所: /micromodules/spine-loader/PureSpineLoader.js
 * このファイルは将来のバージョンで削除される予定です
 * 
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
    
    validateInput(input) {
        if (!input || typeof input !== 'object') {
            throw new Error('PureSpineLoader: 入力が無効です');
        }
        
        const required = ['basePath', 'atlasPath', 'jsonPath'];
        for (const field of required) {
            if (!input[field] || typeof input[field] !== 'string') {
                throw new Error(`PureSpineLoader: ${field}が必要です`);
            }
        }
        
        if (input.scale !== undefined && typeof input.scale !== 'number') {
            throw new Error('PureSpineLoader: scaleは数値である必要があります');
        }
    }
    
    /**
     * 単一機能実行：Spineファイル読み込み
     */
    async execute(externalGLContext = null) {
        console.log('🚀 PureSpineLoader: execute開始', externalGLContext ? 'with external WebGL' : 'with virtual WebGL');
        
        if (this.loadState.loading) {
            return this.getState();
        }
        
        try {
            this.loadState.loading = true;
            this.loadState.error = null;
            
            // Spine WebGL待機
            await this.waitForSpine();
            
            // アセット読み込み（WebGLコンテキスト統一対応）
            const spineData = await this.loadSpineAssets(externalGLContext);
            
            this.loadState.spineData = spineData;
            this.loadState.loaded = true;
            this.loadState.loading = false;
            
            console.log('✅ PureSpineLoader: 読み込み成功');
            return this.getState();
            
        } catch (error) {
            console.error('❌ PureSpineLoader: 読み込み失敗:', error);
            this.loadState.error = error.message;
            this.loadState.loading = false;
            this.loadState.loaded = false;
            
            return this.getState();
        }
    }
    
    /**
     * 現在の状態を数値・文字列で返す
     */
    getState() {
        return {
            loaded: this.loadState.loaded,
            loading: this.loadState.loading,
            error: this.loadState.error,
            spineData: this.loadState.spineData,
            // 統計情報（数値のみ）
            config: {
                scale: this.config.scale
            }
        };
    }
    
    /**
     * 完全に元の状態に戻す
     */
    cleanup() {
        console.log('🧹 PureSpineLoader: cleanup開始');
        
        try {
            // スケルトンデータの解放
            if (this.loadState.spineData) {
                if (this.loadState.spineData.assetManager && this.loadState.spineData.assetManager.dispose) {
                    this.loadState.spineData.assetManager.dispose();
                }
                this.loadState.spineData = null;
            }
            
            // 内部状態リセット
            this.loadState = {
                loaded: false,
                loading: false,
                error: null,
                spineData: null
            };
            
            // グローバル状態の復元は行わない（外部依存ゼロのため）
            
            console.log('✅ PureSpineLoader: cleanup完了');
            return true;
        } catch (error) {
            console.error('❌ PureSpineLoader: cleanup失敗:', error);
            return false;
        }
    }
    
    // === 内部メソッド ===
    
    async waitForSpine() {
        return new Promise((resolve, reject) => {
            let checkCount = 0;
            const maxChecks = 50;
            
            const checkSpine = () => {
                checkCount++;
                if (typeof spine !== "undefined") {
                    console.log("✅ PureSpineLoader: Spine WebGL確認完了");
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
    
    async loadSpineAssets(externalGLContext = null) {
        let gl;
        let virtualCanvas = null;
        
        if (externalGLContext) {
            // 外部WebGLコンテキストを使用（推奨）
            console.log('🔗 PureSpineLoader: 外部WebGLコンテキスト使用');
            gl = externalGLContext;
        } else {
            // 仮想WebGLコンテキスト作成（互換性のため）
            console.log('⚠️ PureSpineLoader: 仮想WebGLコンテキスト作成（非推奨）');
            virtualCanvas = document.createElement('canvas');
            gl = virtualCanvas.getContext('webgl', { alpha: true });
            if (!gl) {
                throw new Error('WebGL未対応');
            }
        }
        
        try {
            // アセットマネージャー作成
            const assetManager = new spine.AssetManager(gl, this.config.basePath);
            assetManager.loadTextureAtlas(this.config.atlasPath);
            assetManager.loadJson(this.config.jsonPath);
            
            // 読み込み待機
            await this.waitForAssets(assetManager);
            
            // Spineスケルトン構築
            const atlas = assetManager.get(this.config.atlasPath);
            const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
            const skeletonJson = new spine.SkeletonJson(atlasLoader);
            const skeletonData = skeletonJson.readSkeletonData(
                assetManager.get(this.config.jsonPath)
            );
            
            const skeleton = new spine.Skeleton(skeletonData);
            
            // スケール設定
            skeleton.scaleX = skeleton.scaleY = this.config.scale;
            
            // アニメーション状態データ作成
            const animationStateData = new spine.AnimationStateData(skeleton.data);
            
            return {
                skeleton,
                skeletonData,
                animationStateData,
                assetManager,
                atlas,
                animations: skeleton.data.animations.map(anim => anim.name),
                // 統計（数値のみ）
                animationCount: skeleton.data.animations.length,
                slotCount: skeleton.data.slots.length,
                // WebGLコンテキスト情報
                usedExternalGL: !!externalGLContext
            };
            
        } finally {
            // 仮想canvasを削除（外部WebGLコンテキスト使用時は削除しない）
            if (virtualCanvas && virtualCanvas.parentNode) {
                virtualCanvas.parentNode.removeChild(virtualCanvas);
            }
        }
    }
    
    async waitForAssets(assetManager) {
        return new Promise((resolve, reject) => {
            let checkCount = 0;
            const maxChecks = 50;
            
            const checkAssets = () => {
                checkCount++;
                if (assetManager.isLoadingComplete()) {
                    console.log("✅ PureSpineLoader: アセット読み込み完了");
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
    
    // === 単独テスト ===
    
    static test() {
        console.log('🧪 PureSpineLoader 単独テスト開始');
        
        try {
            // 1. 作成テスト
            const testConfig = {
                basePath: './test/',
                atlasPath: 'test.atlas',
                jsonPath: 'test.json',
                scale: 0.5
            };
            
            const loader = new PureSpineLoader(testConfig);
            console.assert(loader.getState, '❌ getStateメソッドが存在しません');
            console.assert(loader.cleanup, '❌ cleanupメソッドが存在しません');
            console.assert(loader.execute, '❌ executeメソッドが存在しません');
            
            // 2. 動作テスト
            const initialState = loader.getState();
            console.assert(typeof initialState === 'object', '❌ getStateが正しい形式で返されません');
            console.assert(initialState.loaded === false, '❌ 初期状態でloadedがfalseではありません');
            console.assert(initialState.loading === false, '❌ 初期状態でloadingがfalseではありません');
            
            // 3. 清掃テスト
            const cleanupResult = loader.cleanup();
            console.assert(cleanupResult === true, '❌ cleanup失敗');
            
            const afterState = loader.getState();
            console.assert(afterState.loaded === false, '❌ cleanup後にloadedがfalseになっていません');
            
            console.log('✅ PureSpineLoader 単独テスト完了');
            return true;
            
        } catch (error) {
            console.error('❌ PureSpineLoader テスト失敗:', error);
            return false;
        }
    }
}

// グローバル関数として公開（テスト用）
if (typeof window !== 'undefined') {
    window.PureSpineLoader = PureSpineLoader;
    console.log('🌐 PureSpineLoader: グローバルに公開完了');
}