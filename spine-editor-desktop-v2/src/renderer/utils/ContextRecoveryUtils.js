/**
 * ContextRecoveryManager - WebGL Context復旧管理
 */
export class ContextRecoveryManager {
    constructor() {
        this.recoveryData = new Map();
    }
    
    /**
     * 復旧用データを準備
     * @param {string} assetId - アセットID
     * @param {object} assetData - アセットデータ
     */
    prepareRecoveryData(assetId, assetData) {
        this.recoveryData.set(assetId, {
            originalData: assetData,
            timestamp: Date.now()
        });
    }
    
    /**
     * 全アセットのContext復旧を実行
     * @param {WebGLRenderingContext} gl - WebGLコンテキスト
     * @returns {Promise<void>}
     */
    async recoverAllAssets(gl) {
        console.log('🔄 Context復旧開始:', this.recoveryData.size, 'アセット');
        
        for (const [assetId, data] of this.recoveryData) {
            try {
                await this.recoverSingleAsset(gl, assetId, data.originalData);
            } catch (error) {
                console.error('❌ アセット復旧失敗:', assetId, error);
            }
        }
        
        console.log('✅ Context復旧完了');
    }
    
    /**
     * 単一アセットの復旧
     * @param {WebGLRenderingContext} gl - WebGLコンテキスト
     * @param {string} assetId - アセットID
     * @param {object} assetData - アセットデータ
     * @returns {Promise<void>}
     */
    async recoverSingleAsset(gl, assetId, assetData) {
        // spine-preview-layer.jsとの連携
        if (window.spinePreviewLayer && window.spinePreviewLayer.recoverCharacterAsset) {
            await window.spinePreviewLayer.recoverCharacterAsset(assetId, assetData);
        }
    }
}
