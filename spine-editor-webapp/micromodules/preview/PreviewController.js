/**
 * PreviewController.js - プレビューエリア制御
 * 機能: HTMLファイル表示・Spineファイルドロップ受信・シンプル表示
 * 設計: 基本的な表示とファイルドロップのみ、安定性重視
 */

export class PreviewController {
    constructor() {
        this.previewPanel = null;
        this.contentArea = null;
        this.currentIframe = null;
        this.originalContent = null;
        this.loadingTimeout = null;
        this.currentFileData = null;
        this.currentSpineData = null;
        
        console.log('🎬 PreviewController初期化（シンプル版）');
        this.initializePreview();
        this.setupDragAndDrop();
    }

    /**
     * プレビューエリア初期化
     */
    initializePreview() {
        this.previewPanel = document.querySelector('.panel-preview');
        if (!this.previewPanel) {
            console.error('❌ プレビューパネルが見つかりません');
            return;
        }

        this.contentArea = this.previewPanel.querySelector('.panel-content');
        if (!this.contentArea) {
            console.error('❌ プレビューコンテンツエリアが見つかりません');
            return;
        }

        this.originalContent = this.contentArea.innerHTML;
        console.log('✅ プレビューエリア初期化完了');
    }

    /**
     * ドラッグ&ドロップイベント設定（シンプル版）
     */
    setupDragAndDrop() {
        if (!this.contentArea) return;

        // プレビューエリアでのドロップを設定
        this.contentArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            this.contentArea.style.backgroundColor = 'rgba(0, 122, 204, 0.1)';
            this.contentArea.style.border = '2px dashed #007acc';
        });

        this.contentArea.addEventListener('dragleave', () => {
            this.contentArea.style.backgroundColor = '';
            this.contentArea.style.border = '';
        });

        this.contentArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            this.contentArea.style.backgroundColor = '';
            this.contentArea.style.border = '';
            
            try {
                const dragData = e.dataTransfer.getData('text/plain');
                if (!dragData) {
                    this.displayError('ドラッグデータが見つかりませんでした');
                    return;
                }

                const data = JSON.parse(dragData);
                console.log('📥 ドロップデータ受信:', data.type);
                
                if (data.type === 'spine-character') {
                    await this.displaySpineCharacter(data);
                } else {
                    this.displayError(`未対応のドラッグデータ: ${data.type}`);
                }
            } catch (error) {
                console.error('❌ ドロップエラー:', error);
                this.displayError(`ドロップ処理エラー: ${error.message}`);
            }
        });
        
        console.log('✅ ドラッグ&ドロップ設定完了');
    }

    /**
     * Spineキャラクター表示（シンプル版）
     * @param {Object} characterData - Spineキャラクターデータ
     */
    async displaySpineCharacter(characterData) {
        console.log('🎭 Spineキャラクター表示:', characterData.name);

        try {
            this.cleanupIframe();
            this.showLoading(`Spine: ${characterData.displayName || characterData.name}`);

            // グローバル一時保存からFileHandlesを取得
            if (characterData.hasFileHandles && window.__draggedSpineFileHandles) {
                characterData.fileHandles = window.__draggedSpineFileHandles;
            }

            // ファイルハンドルからアセット情報を読み込み
            const assets = await this.loadSpineAssets(characterData);
            
            // シンプルな情報表示
            this.displaySpineInfo(characterData, assets);
            this.currentSpineData = characterData;

        } catch (error) {
            console.error('❌ Spine表示エラー:', error);
            this.displayError(`Spine表示エラー: ${error.message}`);
        }
    }

    /**
     * Spineアセット読み込み（シンプル版）
     * @param {Object} characterData - キャラクターデータ
     * @returns {Object} アセットデータ
     */
    async loadSpineAssets(characterData) {
        const assets = {
            atlasText: null,
            jsonText: null,
            textureUrl: null,
            fileInfo: {}
        };
        
        try {
            // ファイルハンドルからの読み込み
            if (characterData.fileHandles) {
                // Atlasファイル読み込み
                if (characterData.fileHandles.atlas) {
                    const atlasFile = await characterData.fileHandles.atlas.getFile();
                    assets.atlasText = await atlasFile.text();
                    assets.fileInfo.atlas = { name: atlasFile.name, size: atlasFile.size };
                }
                
                // JSONファイル読み込み
                if (characterData.fileHandles.json) {
                    const jsonFile = await characterData.fileHandles.json.getFile();
                    assets.jsonText = await jsonFile.text();
                    assets.fileInfo.json = { name: jsonFile.name, size: jsonFile.size };
                }
                
                // テクスチャファイル読み込み
                if (characterData.fileHandles.texture) {
                    const textureFile = await characterData.fileHandles.texture.getFile();
                    assets.textureUrl = URL.createObjectURL(textureFile);
                    assets.fileInfo.texture = { name: textureFile.name, size: textureFile.size };
                }
            }
            
            // ファイル名情報フォールバック
            if (characterData.files) {
                assets.fileInfo = { ...assets.fileInfo, ...characterData.files };
            }
            
        } catch (error) {
            console.error('❌ アセット読み込みエラー:', error);
            assets.error = error.message;
        }
        
        return assets;
    }

    /**
     * Spine情報表示（シンプル版）
     * @param {Object} characterData - キャラクターデータ  
     * @param {Object} assets - アセットデータ
     */
    displaySpineInfo(characterData, assets) {
        const fileInfoHtml = Object.entries(assets.fileInfo).map(([type, info]) => {
            if (typeof info === 'object' && info.name) {
                return `<p>📄 ${type.toUpperCase()}: ${info.name} (${this.formatFileSize(info.size)})</p>`;
            }
            return `<p>📄 ${type.toUpperCase()}: ${info}</p>`;
        }).join('');

        this.contentArea.innerHTML = `
            <div style="padding: 20px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                <h3 style="margin: 0 0 20px 0; color: #333;">🎭 ${this.escapeHtml(characterData.displayName || characterData.name)}</h3>
                
                <div style="background: #f5f5f5; border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: left;">
                    <h4 style="margin: 0 0 10px 0; color: #666;">📁 ファイル情報</h4>
                    ${fileInfoHtml || '<p style="color: #999;">ファイル情報がありません</p>'}
                </div>
                
                ${assets.textureUrl ? `
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #666;">🖼️ テクスチャプレビュー</h4>
                        <img src="${assets.textureUrl}" style="max-width: 300px; max-height: 300px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
                    </div>
                ` : ''}
                
                <div style="background: #e3f2fd; border: 1px solid #2196f3; border-radius: 8px; padding: 15px; color: #1976d2;">
                    <p style="margin: 0; font-size: 14px;">
                        ✅ Spineファイル読み込み完了<br>
                        🚧 WebGL描画機能は次のフェーズで実装予定
                    </p>
                </div>
                
                ${assets.error ? `
                    <div style="background: #ffebee; border: 1px solid #f44336; border-radius: 8px; padding: 15px; color: #c62828; margin-top: 15px;">
                        <p style="margin: 0; font-size: 14px;">⚠️ ${this.escapeHtml(assets.error)}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * ファイルサイズをフォーマット
     * @param {number} bytes - バイト数
     * @returns {string} フォーマット済みサイズ
     */
    formatFileSize(bytes) {
        if (!bytes) return 'Unknown size';
        const units = ['B', 'KB', 'MB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }


    /**
     * HTMLファイル表示（シンプル版）
     * @param {Object} fileData - ファイルデータ
     * @param {string} htmlContent - HTMLコンテンツ
     */
    async displayHtmlFile(fileData, htmlContent) {
        console.log('🎬 HTMLファイル表示:', fileData.name);

        try {
            this.currentFileData = fileData;
            this.showLoading(fileData.name);

            const iframe = this.createSimpleIframe(htmlContent, fileData);
            this.updatePreviewContent(iframe, fileData);

        } catch (error) {
            console.error('❌ HTMLファイル表示エラー:', error);
            this.displayError(`ファイル表示エラー: ${error.message}`);
        }
    }

    /**
     * シンプルiframe作成
     * @param {string} htmlContent - HTMLコンテンツ
     * @param {Object} fileData - ファイルデータ
     * @returns {HTMLElement} iframe要素
     */
    createSimpleIframe(htmlContent, fileData) {
        this.cleanupIframe();

        const iframe = document.createElement('iframe');
        iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
        iframe.style.cssText = 'width: 100%; height: 100%; border: none; border-radius: 4px;';

        // Data URL使用（シンプル）
        const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
        iframe.src = dataUrl;

        iframe.onload = () => this.clearLoadingTimeout();
        iframe.onerror = () => this.displayError('HTMLファイルの読み込みに失敗しました');

        this.currentIframe = iframe;
        return iframe;
    }


    /**
     * プレビューコンテンツ更新（シンプル版）
     * @param {HTMLElement} iframe - iframe要素
     * @param {Object} fileData - ファイルデータ
     */
    updatePreviewContent(iframe, fileData) {
        this.contentArea.innerHTML = `
            <div style="height: 100%; display: flex; flex-direction: column;">
                <div style="background: #f5f5f5; padding: 8px; border-radius: 4px; margin-bottom: 8px; font-size: 12px;">
                    📄 ${this.escapeHtml(fileData.name)}
                    <button onclick="window.previewController?.resetToOriginal()" 
                            style="float: right; background: #007acc; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer;">
                        ✕
                    </button>
                </div>
                <div style="flex: 1; background: white; border-radius: 4px;"></div>
            </div>
        `;
        
        const iframeContainer = this.contentArea.querySelector('div:last-child');
        iframeContainer.appendChild(iframe);
        this.setLoadingTimeout();
    }

    /**
     * ローディング表示（シンプル版）
     * @param {string} fileName - ファイル名
     */
    showLoading(fileName = '') {
        if (!this.contentArea) return;
        
        this.contentArea.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #666;">
                <div style="text-align: center;">
                    <div style="font-size: 24px; margin-bottom: 10px;">⏳</div>
                    <div>読み込み中...</div>
                    ${fileName ? `<div style="font-size: 12px; margin-top: 5px;">${this.escapeHtml(fileName)}</div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * エラー表示（シンプル版）
     * @param {string} message - エラーメッセージ
     */
    displayError(message) {
        if (!this.contentArea) return;
        
        this.contentArea.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #e74c3c;">
                <div style="text-align: center;">
                    <div style="font-size: 32px; margin-bottom: 10px;">⚠️</div>
                    <div style="margin-bottom: 10px;">エラーが発生しました</div>
                    <div style="font-size: 12px; color: #666; max-width: 300px;">${this.escapeHtml(message)}</div>
                    <button onclick="window.previewController?.resetToOriginal()" 
                            style="margin-top: 15px; background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                        元に戻す
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 元のコンテンツに復元
     */
    resetToOriginal() {
        this.cleanupIframe();
        
        if (this.contentArea && this.originalContent) {
            this.contentArea.innerHTML = this.originalContent;
            console.log('🔄 プレビューエリアを元の状態に復元');
        }
        
        this.currentFileData = null;
        this.currentSpineData = null;
    }

    /**
     * iframe クリーンアップ
     */
    cleanupIframe() {
        if (this.currentIframe) {
            this.currentIframe.onload = null;
            this.currentIframe.onerror = null;
            
            if (this.currentIframe.parentNode) {
                this.currentIframe.parentNode.removeChild(this.currentIframe);
            }
            
            this.currentIframe = null;
        }
    }

    /**
     * ロードタイムアウト設定
     */
    setLoadingTimeout() {
        this.clearLoadingTimeout();
        this.loadingTimeout = setTimeout(() => {
            this.displayError('読み込みがタイムアウトしました');
        }, 8000);
    }

    /**
     * ロードタイムアウトクリア
     */
    clearLoadingTimeout() {
        if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
            this.loadingTimeout = null;
        }
    }

    /**
     * HTML エスケープ
     * @param {string} text - エスケープする文字列
     * @returns {string} エスケープ済み文字列
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 現在のファイル/データ取得
     * @returns {Object} 現在の状態
     */
    getCurrentState() {
        return {
            file: this.currentFileData,
            spine: this.currentSpineData,
            hasIframe: !!this.currentIframe
        };
    }

    /**
     * クリーンアップ
     */
    destroy() {
        console.log('🧹 PreviewController クリーンアップ（シンプル版）');
        this.clearLoadingTimeout();
        this.cleanupIframe();
        this.resetToOriginal();
    }
}