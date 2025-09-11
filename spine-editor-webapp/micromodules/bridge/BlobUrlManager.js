/**
 * BlobUrlManager - Blob URL管理ユーティリティクラス
 * 
 * 🎯 責務
 * - File APIデータからBlob URL作成
 * - Blob URLのライフサイクル管理 
 * - メモリリーク防止のクリーンアップ機能
 * - 統計情報・デバッグ支援
 *
 * 🔄 使用例
 * ```javascript
 * const manager = new BlobUrlManager();
 * const url = manager.createBlobUrl(file, 'text/plain');
 * // ... URL使用
 * manager.revokeBlobUrl(url); // クリーンアップ
 * ```
 */

class BlobUrlManager {
    constructor(options = {}) {
        // Blob URL管理マップ (URL -> メタ情報)
        this.urlMap = new Map();
        
        // 設定
        this.debug = options.debug || false;
        
        // 統計情報
        this.stats = {
            totalCreated: 0,
            totalRevoked: 0,
            activeCount: 0,
            estimatedSize: 0
        };
        
        this.log('🗂️ BlobUrlManager 初期化完了');
    }

    /**
     * File APIオブジェクトからBlob URLを作成
     * 
     * @param {File} file - File APIオブジェクト
     * @param {string} mimeType - MIMEタイプ（省略時はfile.typeを使用）
     * @param {object} metadata - 追加メタ情報
     * @returns {string} 作成されたBlob URL
     */
    createBlobUrl(file, mimeType = null, metadata = {}) {
        try {
            // File APIオブジェクト検証
            if (!file || typeof file.size !== 'number') {
                throw new Error('有効なFileオブジェクトが必要です');
            }

            // MIMEタイプ決定
            const finalMimeType = mimeType || file.type || 'application/octet-stream';
            
            // Blob作成
            const blob = new Blob([file], { type: finalMimeType });
            
            // Blob URL作成
            const url = URL.createObjectURL(blob);
            
            // メタ情報保存
            const urlMetadata = {
                fileName: file.name,
                originalSize: file.size,
                mimeType: finalMimeType,
                createdAt: new Date(),
                blob: blob,
                ...metadata
            };
            
            this.urlMap.set(url, urlMetadata);
            
            // 統計情報更新
            this.stats.totalCreated++;
            this.stats.activeCount++;
            this.stats.estimatedSize += file.size;
            
            this.log(`📎 Blob URL作成: ${file.name} (${this.formatSize(file.size)}) -> ${url.substring(0, 50)}...`);
            
            return url;
            
        } catch (error) {
            this.log(`❌ Blob URL作成エラー: ${error.message}`, 'error');
            throw new Error(`Blob URL作成失敗: ${error.message}`);
        }
    }

    /**
     * 指定されたBlob URLを解放
     * 
     * @param {string} url - 解放するBlob URL
     * @returns {boolean} 成功時true
     */
    revokeBlobUrl(url) {
        try {
            if (!url || typeof url !== 'string') {
                this.log('⚠️ 無効なURL指定', 'warning');
                return false;
            }

            const metadata = this.urlMap.get(url);
            
            if (!metadata) {
                this.log(`⚠️ URL未登録: ${url.substring(0, 50)}...`, 'warning');
                return false;
            }

            // Blob URL解放
            URL.revokeObjectURL(url);
            
            // マップから削除
            this.urlMap.delete(url);
            
            // 統計情報更新
            this.stats.totalRevoked++;
            this.stats.activeCount--;
            this.stats.estimatedSize -= metadata.originalSize;
            
            this.log(`🗑️ Blob URL解放: ${metadata.fileName} (${this.formatSize(metadata.originalSize)})`);
            
            return true;
            
        } catch (error) {
            this.log(`❌ Blob URL解放エラー: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * 全てのBlob URLを解放
     * 
     * @returns {number} 解放されたURL数
     */
    revokeAllUrls() {
        this.log('🧹 全Blob URL解放開始');
        
        const urlsToRevoke = Array.from(this.urlMap.keys());
        let revokedCount = 0;
        
        for (const url of urlsToRevoke) {
            if (this.revokeBlobUrl(url)) {
                revokedCount++;
            }
        }
        
        this.log(`✅ 全Blob URL解放完了: ${revokedCount}件`);
        return revokedCount;
    }

    /**
     * 特定のファイル名パターンのURLを解放
     * 
     * @param {RegExp|string} pattern - マッチパターン
     * @returns {number} 解放されたURL数
     */
    revokeByFileNamePattern(pattern) {
        const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
        const urlsToRevoke = [];
        
        for (const [url, metadata] of this.urlMap.entries()) {
            if (regex.test(metadata.fileName)) {
                urlsToRevoke.push(url);
            }
        }
        
        let revokedCount = 0;
        for (const url of urlsToRevoke) {
            if (this.revokeBlobUrl(url)) {
                revokedCount++;
            }
        }
        
        this.log(`🎯 パターンマッチ解放: ${revokedCount}件 (パターン: ${pattern})`);
        return revokedCount;
    }

    /**
     * URL存在確認
     * 
     * @param {string} url - 確認するURL
     * @returns {boolean} 存在時true
     */
    hasUrl(url) {
        return this.urlMap.has(url);
    }

    /**
     * URLのメタ情報取得
     * 
     * @param {string} url - 情報取得するURL
     * @returns {object|null} メタ情報オブジェクト
     */
    getMetadata(url) {
        return this.urlMap.get(url) || null;
    }

    /**
     * 全ての管理中URLリスト取得
     * 
     * @returns {string[]} URL配列
     */
    getAllUrls() {
        return Array.from(this.urlMap.keys());
    }

    /**
     * 統計情報取得
     * 
     * @returns {object} 統計情報オブジェクト
     */
    getStats() {
        return {
            ...this.stats,
            details: Array.from(this.urlMap.entries()).map(([url, metadata]) => ({
                url: url.substring(0, 50) + '...',
                fileName: metadata.fileName,
                size: metadata.originalSize,
                mimeType: metadata.mimeType,
                createdAt: metadata.createdAt
            }))
        };
    }

    /**
     * ファイルサイズの人間に読みやすい形式変換
     * 
     * @param {number} bytes - バイト数
     * @returns {string} フォーマット済み文字列
     */
    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const units = ['B', 'KB', 'MB', 'GB'];
        const base = 1024;
        const index = Math.floor(Math.log(bytes) / Math.log(base));
        
        return (bytes / Math.pow(base, index)).toFixed(1) + ' ' + units[index];
    }

    /**
     * デバッグログ出力
     * 
     * @param {string} message - ログメッセージ
     * @param {string} type - ログタイプ ('info', 'warning', 'error')
     */
    log(message, type = 'info') {
        if (this.debug) {
            const timestamp = new Date().toLocaleTimeString();
            const prefix = type === 'error' ? '❌' : 
                          type === 'warning' ? '⚠️' : 'ℹ️';
                          
            console.log(`[${timestamp}] ${prefix} BlobUrlManager: ${message}`);
        }
    }

    /**
     * デストラクタ（手動クリーンアップ）
     */
    destroy() {
        this.log('🔥 BlobUrlManager破棄開始');
        const revokedCount = this.revokeAllUrls();
        this.log(`✅ BlobUrlManager破棄完了 (${revokedCount}件クリーンアップ)`);
    }
}

// モジュールエクスポート（Node.js環境対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlobUrlManager;
}

// ES6モジュールエクスポート
if (typeof window !== 'undefined') {
    window.BlobUrlManager = BlobUrlManager;
}