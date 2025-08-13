// 🎯 Spine Editor Desktop v2.0 - Utils Module
// Asset読み込み・エラーハンドリングシステム
// 設計方針: 100行制限・シンプル・軽量・spine-core/spine-renderer完全連携

console.log('🔧 Spine Utils v2.0 Module 読み込み');

/**
 * Spine系Asset読み込み・エラーハンドリングシステム
 * 責任範囲:
 * - Asset読み込みシステム（Spineファイル・画像・JSON）（60行）
 * - エラーハンドリングシステム（統一エラー処理・デバッグ支援）（40行）
 * 
 * spine-core.js・spine-renderer.js統合:
 * - 3モジュール統合システム
 * - 統一インターフェース提供
 */
class SpineUtils {
    constructor() {
        this.assetCache = new Map(); // ファイルパス -> Asset data
        this.loadingPromises = new Map(); // ファイルパス -> Promise
        this.errorHistory = [];
        
        console.log('✅ SpineUtils v2.0 初期化完了');
    }

    // ========== Asset読み込みシステム（60行制限） ========== //

    /**
     * Spineファイル読み込み（.json, .atlas, .png）
     * @param {string} basePath - Spineファイルベースパス
     * @param {string} characterName - キャラクター名
     * @returns {Promise<Object>} Asset読み込み結果
     */
    async loadSpineAssets(basePath, characterName) {
        const assetKey = `spine-${characterName}`;
        
        // キャッシュ確認
        if (this.assetCache.has(assetKey)) {
            console.log('📦 キャッシュからSpineAsset取得:', characterName);
            return this.assetCache.get(assetKey);
        }
        
        // 重複読み込み防止
        if (this.loadingPromises.has(assetKey)) {
            console.log('⏳ Spine読み込み待機中:', characterName);
            return this.loadingPromises.get(assetKey);
        }
        
        // Asset読み込み実行
        const loadPromise = this.executeSpineAssetLoad(basePath, characterName);
        this.loadingPromises.set(assetKey, loadPromise);
        
        try {
            const result = await loadPromise;
            this.assetCache.set(assetKey, result);
            this.loadingPromises.delete(assetKey);
            return result;
        } catch (error) {
            this.loadingPromises.delete(assetKey);
            throw error;
        }
    }

    /**
     * Spine Asset読み込み実行
     * @param {string} basePath - ベースパス
     * @param {string} characterName - キャラクター名
     * @returns {Promise<Object>} Asset読み込み結果
     */
    async executeSpineAssetLoad(basePath, characterName) {
        console.log('📥 SpineAsset読み込み開始:', characterName);
        
        const assets = {
            json: null,
            atlas: null,
            png: null,
            characterName: characterName
        };
        
        try {
            // 並列Asset読み込み
            const [jsonData, atlasData, pngData] = await Promise.all([
                this.loadTextAsset(`${basePath}/${characterName}.json`),
                this.loadTextAsset(`${basePath}/${characterName}.atlas`),
                this.loadImageAsset(`${basePath}/${characterName}.png`)
            ]);
            
            assets.json = jsonData;
            assets.atlas = atlasData;
            assets.png = pngData;
            
            console.log('✅ SpineAsset読み込み完了:', characterName);
            return assets;
            
        } catch (error) {
            const errorInfo = this.handleAssetError(error, characterName, basePath);
            throw errorInfo;
        }
    }

    /**
     * テキストAsset読み込み（JSON/Atlas）
     * @param {string} filePath - ファイルパス
     * @returns {Promise<string>} テキストデータ
     */
    async loadTextAsset(filePath) {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Asset読み込み失敗: ${filePath} (${response.status})`);
        }
        return response.text();
    }

    /**
     * 画像Asset読み込み
     * @param {string} filePath - 画像ファイルパス
     * @returns {Promise<HTMLImageElement>} 画像要素
     */
    async loadImageAsset(filePath) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`画像読み込み失敗: ${filePath}`));
            img.src = filePath;
        });
    }

    // ========== エラーハンドリングシステム（40行制限） ========== //

    /**
     * Asset読み込みエラー処理
     * @param {Error} error - エラーオブジェクト
     * @param {string} characterName - キャラクター名
     * @param {string} basePath - ベースパス
     * @returns {Object} 処理済みエラー情報
     */
    handleAssetError(error, characterName, basePath) {
        const errorInfo = {
            type: 'asset-load-error',
            character: characterName,
            basePath: basePath,
            message: error.message,
            timestamp: new Date().toISOString(),
            solutions: this.suggestSolutions(error.message)
        };
        
        this.errorHistory.push(errorInfo);
        console.error('❌ SpineAsset読み込みエラー:', errorInfo);
        
        return errorInfo;
    }

    /**
     * エラー解決策提案
     * @param {string} errorMessage - エラーメッセージ
     * @returns {Array<string>} 解決策リスト
     */
    suggestSolutions(errorMessage) {
        const solutions = [];
        
        if (errorMessage.includes('404')) {
            solutions.push('ファイルパスの確認');
            solutions.push('Spineファイルの存在確認');
        }
        
        if (errorMessage.includes('CORS')) {
            solutions.push('HTTPサーバー経由でのアクセス');
            solutions.push('CORSヘッダーの設定確認');
        }
        
        if (errorMessage.includes('画像読み込み失敗')) {
            solutions.push('PNGファイルの破損確認');
            solutions.push('画像形式の確認');
        }
        
        return solutions.length > 0 ? solutions : ['ファイル・サーバー設定の確認'];
    }

    /**
     * システム診断・デバッグ情報
     * @returns {Object} 診断結果
     */
    debugSystemInfo() {
        const cacheStats = {
            cached: this.assetCache.size,
            loading: this.loadingPromises.size,
            errors: this.errorHistory.length
        };
        
        console.log('🔧 === SpineUtils v2.0 システム診断 ===');
        console.log('Asset状況:', cacheStats);
        
        if (this.errorHistory.length > 0) {
            console.log('最新エラー:', this.errorHistory[this.errorHistory.length - 1]);
        }
        
        return {
            stats: cacheStats,
            cache: Array.from(this.assetCache.keys()),
            recentErrors: this.errorHistory.slice(-3)
        };
    }

    /**
     * キャッシュクリア
     */
    clearCache() {
        this.assetCache.clear();
        this.loadingPromises.clear();
        console.log('✅ Asset キャッシュクリア完了');
    }
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpineUtils;
}

// Global registration
window.SpineUtils = SpineUtils;

console.log('✅ Spine Utils v2.0 Module 読み込み完了');