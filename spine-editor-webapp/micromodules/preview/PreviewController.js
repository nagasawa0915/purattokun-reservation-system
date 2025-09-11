/**
 * PreviewController.js - プレビューエリア制御
 * 機能: HTMLファイル表示・iframe管理・セキュリティサンドボックス
 * UI非侵襲性: 既存プレビューエリアの内容を置き換え（構造は維持）
 */

export class PreviewController {
    constructor() {
        this.previewPanel = null;
        this.contentArea = null;
        this.currentIframe = null;
        this.originalContent = null;
        this.loadingTimeout = null;
        this.currentFileData = null;
        
        console.log('🎬 PreviewController初期化');
        this.initializePreview();
    }

    /**
     * プレビューエリア初期化
     */
    initializePreview() {
        // プレビューパネル取得
        this.previewPanel = document.querySelector('.panel-preview');
        if (!this.previewPanel) {
            console.error('❌ プレビューパネルが見つかりません');
            return;
        }

        // コンテンツエリア取得
        this.contentArea = this.previewPanel.querySelector('.panel-content');
        if (!this.contentArea) {
            console.error('❌ プレビューコンテンツエリアが見つかりません');
            return;
        }

        // 元のコンテンツを保存
        this.originalContent = this.contentArea.innerHTML;

        console.log('✅ プレビューエリア初期化完了');
    }

    /**
     * HTMLファイル表示
     * @param {Object} fileData - ファイルデータ
     * @param {string} htmlContent - HTMLコンテンツ
     */
    async displayHtmlFile(fileData, htmlContent) {
        console.log('🎬 HTMLファイル表示:', fileData.name);

        if (!this.contentArea) {
            console.error('❌ プレビューエリアが利用できません');
            return;
        }

        try {
            // 現在のファイル情報を保存
            this.currentFileData = fileData;

            // ローディング表示
            this.showLoading(fileData.name);

            // iframe作成・設定
            const iframe = await this.createSecureIframe(htmlContent, fileData);
            
            // プレビューエリア更新
            this.updatePreviewContent(iframe, fileData);

            console.log('✅ HTMLファイル表示完了');

        } catch (error) {
            console.error('❌ HTMLファイル表示エラー:', error);
            this.displayError(`ファイル表示エラー: ${error.message}`);
        }
    }

    /**
     * セキュアiframe作成
     * @param {string} htmlContent - HTMLコンテンツ
     * @param {Object} fileData - ファイルデータ
     * @returns {Promise<HTMLElement>} iframe要素
     */
    async createSecureIframe(htmlContent, fileData) {
        // 既存のiframeをクリーンアップ
        if (this.currentIframe) {
            this.cleanupIframe();
        }

        // iframe要素作成
        const iframe = document.createElement('iframe');
        
        // セキュリティ設定
        iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms');
        iframe.setAttribute('loading', 'lazy');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '4px';
        iframe.style.background = 'white';

        // HTMLファイルをサーバー経由で読み込み（相対パス対応）
        const serverUrl = this.buildServerUrl(fileData);
        if (serverUrl) {
            console.log('🌐 サーバーベースURL使用:', serverUrl);
            iframe.src = serverUrl;
        } else {
            // フォールバック: HTML Content処理
            const processedHtml = this.processHtmlContent(htmlContent, fileData);
            const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(processedHtml)}`;
            iframe.src = dataUrl;
            console.log('📄 Data URL フォールバック使用');
        }

        // 読み込み完了イベント
        iframe.onload = () => {
            console.log('✅ iframe読み込み完了');
            this.clearLoadingTimeout();
        };

        // エラーハンドリング
        iframe.onerror = (error) => {
            console.error('❌ iframe読み込みエラー:', error);
            this.displayError('HTMLファイルの読み込みに失敗しました');
        };

        this.currentIframe = iframe;
        return iframe;
    }

    /**
     * サーバーベースURL構築
     * @param {Object} fileData - ファイルデータ
     * @returns {string|null} サーバーURL
     */
    buildServerUrl(fileData) {
        try {
            // 現在のサーバーのベースURLを取得
            const currentUrl = window.location.href;
            const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
            
            // ファイルパスをサーバーパスに変換
            // 例: "D:\クラウドパートナーHP\index.html" → "http://localhost:8001/index.html"
            let serverPath = fileData.path;
            
            // WindowsパスをUnixパスに変換
            if (serverPath.includes('\\')) {
                serverPath = serverPath.replace(/\\/g, '/');
            }
            
            // 絶対パスをサーバー相対パスに変換
            // 様々なプロジェクトルートパターンに対応
            const rootPatterns = [
                'クラウドパートナーHP/',
                'クラウドパートナーHP\\',
                'spine-editor-webapp/',
                'spine-editor-webapp\\'
            ];
            
            for (const pattern of rootPatterns) {
                if (serverPath.includes(pattern)) {
                    const rootIndex = serverPath.indexOf(pattern);
                    serverPath = serverPath.substring(rootIndex + pattern.length);
                    break;
                }
            }
            
            // さらに上位のディレクトリがある場合の処理
            // 例: "/mnt/d/クラウドパートナーHP/index.html" の場合
            if (serverPath.startsWith('/mnt/') || serverPath.startsWith('C:/') || serverPath.startsWith('D:/')) {
                // ドライブレター・マウントポイントから始まる場合、最後のディレクトリ区切りを見つける
                const lastSlash = serverPath.lastIndexOf('/');
                const pathParts = serverPath.split('/');
                
                // プロジェクトルートらしきディレクトリを探す
                for (let i = pathParts.length - 1; i >= 0; i--) {
                    const part = pathParts[i];
                    if (part.includes('クラウドパートナー') || part.includes('HP') || part.includes('index')) {
                        // そのディレクトリから相対パスを構築
                        serverPath = pathParts.slice(i).join('/');
                        break;
                    }
                }
            }
            
            // 先頭の/を削除
            if (serverPath.startsWith('/')) {
                serverPath = serverPath.substring(1);
            }
            
            // 完全なサーバーURLを構築
            const fullServerUrl = `${baseUrl}/../${serverPath}`;
            
            console.log('🔗 URL変換:', {
                original: fileData.path,
                serverPath: serverPath,
                fullUrl: fullServerUrl,
                currentUrl: currentUrl,
                baseUrl: baseUrl
            });
            
            // URL有効性をテスト
            return this.validateServerUrl(fullServerUrl) ? fullServerUrl : null;
            
        } catch (error) {
            console.error('❌ サーバーURL構築エラー:', error);
            return null;
        }
    }

    /**
     * サーバーURL有効性確認
     * @param {string} url - 確認するURL
     * @returns {boolean} 有効かどうか
     */
    validateServerUrl(url) {
        try {
            // 基本的なURL形式チェック
            const urlObj = new URL(url);
            
            // HTTPサーバーかどうかチェック
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                console.warn('⚠️ 非HTTPプロトコル:', urlObj.protocol);
                return false;
            }
            
            // ローカルホスト系のチェック
            if (urlObj.hostname === 'localhost' || urlObj.hostname.startsWith('127.') || urlObj.hostname.startsWith('192.168.')) {
                console.log('✅ ローカルサーバーURL検証OK:', url);
                return true;
            }
            
            console.log('✅ サーバーURL検証OK:', url);
            return true;
            
        } catch (error) {
            console.error('❌ URL検証エラー:', error);
            return false;
        }
    }

    /**
     * HTMLコンテンツ処理
     * @param {string} htmlContent - 元のHTMLコンテンツ
     * @param {Object} fileData - ファイルデータ
     * @returns {string} 処理済みHTMLコンテンツ
     */
    processHtmlContent(htmlContent, fileData) {
        // 相対パス調整（簡易版）
        let processedHtml = htmlContent;

        // base要素追加（相対パス解決用）
        const baseTag = `<base href="file:///${fileData.path.replace(/[^/]*$/, '')}" target="_blank">`;
        
        // head要素内に base タグを挿入
        if (processedHtml.includes('<head>')) {
            processedHtml = processedHtml.replace('<head>', `<head>${baseTag}`);
        } else if (processedHtml.includes('<html>')) {
            processedHtml = processedHtml.replace('<html>', `<html><head>${baseTag}</head>`);
        } else {
            processedHtml = `<head>${baseTag}</head>${processedHtml}`;
        }

        // プレビュー表示向けCSS追加
        const previewStyles = `
            <style>
                /* プレビュー表示調整 */
                body {
                    margin: 0;
                    padding: 10px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                /* レスポンシブ調整 */
                * {
                    max-width: 100% !important;
                }
                
                /* スクロールバー調整 */
                ::-webkit-scrollbar {
                    width: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }
                ::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 4px;
                }
            </style>
        `;

        // head内にスタイルを追加
        if (processedHtml.includes('</head>')) {
            processedHtml = processedHtml.replace('</head>', `${previewStyles}</head>`);
        } else {
            processedHtml = previewStyles + processedHtml;
        }

        return processedHtml;
    }

    /**
     * プレビューコンテンツ更新
     * @param {HTMLElement} iframe - iframe要素
     * @param {Object} fileData - ファイルデータ
     */
    updatePreviewContent(iframe, fileData) {
        const previewHtml = `
            <div style="height: 100%; display: flex; flex-direction: column;">
                <!-- ファイル情報ヘッダー -->
                <div style="background: rgba(0, 255, 136, 0.1); border: 1px solid rgba(0, 255, 136, 0.3); border-radius: 4px; padding: 8px 12px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                    <span style="color: #00ff88; font-size: 14px;">📄</span>
                    <span style="color: #00ff88; font-weight: bold; font-size: 13px;">${this.escapeHtml(fileData.name)}</span>
                    <span style="color: #666; font-size: 11px; margin-left: auto;">${this.escapeHtml(fileData.path)}</span>
                </div>
                
                <!-- iframe コンテンツエリア -->
                <div style="flex: 1; background: white; border-radius: 4px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                </div>
            </div>
        `;

        // コンテンツ更新
        this.contentArea.innerHTML = previewHtml;
        
        // iframe をコンテンツエリアに追加
        const iframeContainer = this.contentArea.querySelector('div:last-child');
        iframeContainer.appendChild(iframe);

        // ロードタイムアウト設定
        this.setLoadingTimeout();
    }

    /**
     * ローディング表示
     * @param {string} fileName - ファイル名
     */
    showLoading(fileName = '') {
        if (!this.contentArea) return;
        
        this.contentArea.innerHTML = `
            <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #999;">
                <div style="font-size: 48px; margin-bottom: 20px; animation: spin 2s linear infinite;">⏳</div>
                <p style="margin-bottom: 10px; font-size: 14px;">HTMLファイルを読み込んでいます...</p>
                ${fileName ? `<p style="font-size: 11px; color: #666;">${this.escapeHtml(fileName)}</p>` : ''}
            </div>
            <style>
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            </style>
        `;
    }

    /**
     * エラー表示
     * @param {string} message - エラーメッセージ
     */
    displayError(message) {
        if (!this.contentArea) return;
        
        this.contentArea.innerHTML = `
            <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #ff6b6b;">
                <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
                <p style="margin-bottom: 10px; font-size: 14px; text-align: center;">プレビューエラー</p>
                <p style="font-size: 11px; color: #999; text-align: center; max-width: 80%;">${this.escapeHtml(message)}</p>
                <button onclick="window.previewController?.resetToOriginal()" 
                        style="margin-top: 15px; background: #3a3a3a; color: white; border: 1px solid #555; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                    元に戻す
                </button>
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
    }

    /**
     * iframe クリーンアップ
     */
    cleanupIframe() {
        if (this.currentIframe) {
            // イベントリスナー削除
            this.currentIframe.onload = null;
            this.currentIframe.onerror = null;
            
            // iframe削除
            if (this.currentIframe.parentNode) {
                this.currentIframe.parentNode.removeChild(this.currentIframe);
            }
            
            this.currentIframe = null;
            console.log('🧹 iframe クリーンアップ完了');
        }
    }

    /**
     * ロードタイムアウト設定
     */
    setLoadingTimeout() {
        this.clearLoadingTimeout();
        
        this.loadingTimeout = setTimeout(() => {
            console.warn('⚠️ iframe読み込みタイムアウト');
            this.displayError('HTMLファイルの読み込みがタイムアウトしました');
        }, 10000); // 10秒タイムアウト
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
     * 現在表示中のファイル取得
     * @returns {Object|null} 現在のファイルデータ
     */
    getCurrentFile() {
        return this.currentFileData;
    }

    /**
     * プレビュー状態確認
     * @returns {Object} プレビュー状態
     */
    getStatus() {
        return {
            isInitialized: !!this.previewPanel,
            hasContent: !!this.contentArea,
            currentFile: this.currentFileData?.name || null,
            hasActiveIframe: !!this.currentIframe,
            isLoading: !!this.loadingTimeout
        };
    }

    /**
     * クリーンアップ
     */
    destroy() {
        console.log('🧹 PreviewController クリーンアップ');
        this.clearLoadingTimeout();
        this.cleanupIframe();
        this.resetToOriginal();
        this.currentFileData = null;
    }
}