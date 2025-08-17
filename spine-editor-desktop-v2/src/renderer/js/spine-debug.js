/**
 * Spine Debug Utilities
 * v2デスクトップアプリ用デバッグツール
 */

export class SpineDebug {
    /**
     * ドラッグ&ドロップ データフロー監視
     */
    static monitorDragDrop() {
        console.log('🔍 ドラッグ&ドロップ データフロー監視開始');
        
        // SimpleSpineManager のドラッグイベント監視
        const originalAddEventListener = Element.prototype.addEventListener;
        Element.prototype.addEventListener = function(type, listener, options) {
            if (type === 'dragstart' && this.classList?.contains('spine-character-item')) {
                const wrappedListener = function(e) {
                    console.log('🎮 dragstart イベント:', {
                        characterId: this.dataset.characterId,
                        dataTransfer: {
                            data: e.dataTransfer.getData('application/json'),
                            effectAllowed: e.dataTransfer.effectAllowed
                        }
                    });
                    return listener.apply(this, arguments);
                };
                return originalAddEventListener.call(this, type, wrappedListener, options);
            }
            return originalAddEventListener.call(this, type, listener, options);
        };
        
        // ドロップイベント監視
        document.addEventListener('drop', (e) => {
            const data = e.dataTransfer.getData('application/json');
            if (data) {
                try {
                    const parsedData = JSON.parse(data);
                    console.log('📦 drop イベント データ受信:', parsedData);
                } catch (error) {
                    console.error('❌ drop データ解析エラー:', error, 'データ:', data);
                }
            }
        }, true);
    }
    
    /**
     * キャラクターデータ構造を検証
     */
    static validateCharacterData(characterData) {
        const required = ['id', 'name', 'jsonPath', 'atlasPath', 'texturePath'];
        const missing = required.filter(field => !characterData[field]);
        
        if (missing.length > 0) {
            console.error('❌ キャラクターデータ不完全:', {
                characterData,
                missing
            });
            return false;
        }
        
        console.log('✅ キャラクターデータ検証OK:', characterData);
        return true;
    }
    
    /**
     * SpinePreviewLayer 状態確認
     */
    static checkSpinePreviewLayer(spinePreviewLayer) {
        if (!spinePreviewLayer) {
            console.error('❌ SpinePreviewLayer が初期化されていません');
            return false;
        }
        
        console.log('🎭 SpinePreviewLayer 状態:', {
            canvas: !!spinePreviewLayer.canvas,
            gl: !!spinePreviewLayer.gl,
            spine: !!spinePreviewLayer.spine,
            characters: spinePreviewLayer.characters?.size || 0,
            isRenderingActive: spinePreviewLayer.isRenderingActive
        });
        
        return true;
    }
    
    /**
     * ネットワークリクエスト監視（Spine アセット読み込み）
     */
    static monitorSpineAssetRequests() {
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const url = args[0];
            if (typeof url === 'string' && (url.includes('.atlas') || url.includes('.json') || url.includes('.png'))) {
                console.log('🌐 Spine アセット リクエスト:', url);
                return originalFetch.apply(this, args)
                    .then(response => {
                        console.log(response.ok ? '✅' : '❌', 'Spine アセット レスポンス:', url, response.status);
                        return response;
                    })
                    .catch(error => {
                        console.error('❌ Spine アセット エラー:', url, error);
                        throw error;
                    });
            }
            return originalFetch.apply(this, args);
        };
    }
    
    /**
     * デバッグ開始（全ての監視を開始）
     */
    static startDebugging() {
        console.log('🚀 Spine Debug 開始');
        this.monitorDragDrop();
        this.monitorSpineAssetRequests();
        
        // グローバル関数として公開
        window.spineDebug = {
            validateCharacterData: this.validateCharacterData,
            checkSpinePreviewLayer: this.checkSpinePreviewLayer
        };
        
        console.log('💡 デバッグ関数がwindow.spineDebugで利用可能');
    }
}

// 自動開始
if (typeof window !== 'undefined') {
    SpineDebug.startDebugging();
}