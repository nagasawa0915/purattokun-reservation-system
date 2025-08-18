/**
 * AbsoluteUrlResolver - 相対パス→絶対パス変換
 */
export class AbsoluteUrlResolver {
    constructor() {
        this.baseUrl = this.detectBaseUrl();
    }
    
    /**
     * ベースURLを検出
     * @returns {string} ベースURL
     */
    detectBaseUrl() {
        if (typeof window !== 'undefined') {
            const port = window.location.port || '8082';
            return `http://localhost:${port}`;
        }
        return 'http://localhost:8082';
    }
    
    /**
     * アセットURLを絶対パスに変換
     * @param {object} assetData - アセットデータ
     * @returns {object} 処理済みアセットデータ
     */
    processAssetUrls(assetData) {
        const processed = JSON.parse(JSON.stringify(assetData));
        
        // Spineアセットの各URLを絶対パス化
        if (processed.atlas && !processed.atlas.startsWith('http')) {
            processed.atlas = `${this.baseUrl}/${processed.atlas.replace(/^[\/\\]+/, '')}`;
        }
        
        if (processed.json && !processed.json.startsWith('http')) {
            processed.json = `${this.baseUrl}/${processed.json.replace(/^[\/\\]+/, '')}`;
        }
        
        if (processed.pngs && Array.isArray(processed.pngs)) {
            processed.pngs = processed.pngs.map(png => {
                return png.startsWith('http') ? png : `${this.baseUrl}/${png.replace(/^[\/\\]+/, '')}`;
            });
        }
        
        return processed;
    }
}
