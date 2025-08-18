/**
 * ImageDecodeWaiter - 画像decode待ちシステム
 */
export class ImageDecodeWaiter {
    constructor() {
        this.decodeQueue = new Map();
        this.readyAssets = new Set();
    }
    
    /**
     * アセットのdecode処理をキューに追加
     * @param {string} assetId - アセットID
     * @param {object} assetData - アセットデータ
     */
    queueAssetDecoding(assetId, assetData) {
        if (assetData.pngs && Array.isArray(assetData.pngs)) {
            const decodePromises = assetData.pngs.map(pngUrl => this.decodeImage(pngUrl));
            this.decodeQueue.set(assetId, Promise.all(decodePromises));
        } else {
            // 画像なしの場合は即座に完了
            this.readyAssets.add(assetId);
        }
    }
    
    /**
     * 画像をdecode
     * @param {string} imageUrl - 画像URL
     * @returns {Promise<void>}
     */
    async decodeImage(imageUrl) {
        try {
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imageUrl;
            });
            
            // decode実行（次フレーム表示制御）
            if (img.decode) {
                await img.decode();
            }
        } catch (error) {
            console.warn('⚠️ 画像decode失敗:', imageUrl, error);
        }
    }
    
    /**
     * アセットの準備完了を待機
     * @param {string} assetId - アセットID
     * @returns {Promise<void>}
     */
    async waitForAssetReady(assetId) {
        if (this.readyAssets.has(assetId)) {
            return;
        }
        
        const decodePromise = this.decodeQueue.get(assetId);
        if (decodePromise) {
            await decodePromise;
            this.readyAssets.add(assetId);
        }
    }
}
