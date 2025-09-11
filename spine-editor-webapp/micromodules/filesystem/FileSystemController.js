/**
 * FileSystemController.js - フォルダ選択・ファイル操作制御
 * 機能: File System Access API統合・HTMLファイル検出・エラーハンドリング
 * UI非侵襲性: 既存システムへの影響ゼロ
 */

export class FileSystemController {
    constructor() {
        this.selectedDirectoryHandle = null;
        this.currentFiles = new Map();
        this.supportedFileTypes = new Set(['.html', '.htm']);
        this.eventListeners = new Map();
        
        console.log('🗂️ FileSystemController初期化');
        this.checkBrowserSupport();
    }

    /**
     * ブラウザサポート確認
     */
    checkBrowserSupport() {
        this.isSupported = 'showDirectoryPicker' in window;
        if (!this.isSupported) {
            console.warn('⚠️ File System Access API非対応ブラウザ');
            console.log('💡 Chrome 86+ または Edge 86+ が必要です');
        } else {
            console.log('✅ File System Access API対応確認');
        }
        return this.isSupported;
    }

    /**
     * イベントリスナー登録
     * @param {string} eventType - イベント種別
     * @param {Function} handler - ハンドラー関数
     */
    addEventListener(eventType, handler) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType).push(handler);
    }

    /**
     * イベント発火
     * @param {string} eventType - イベント種別
     * @param {Object} data - イベントデータ
     */
    dispatchEvent(eventType, data) {
        const handlers = this.eventListeners.get(eventType) || [];
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`❌ イベントハンドラーエラー (${eventType}):`, error);
            }
        });
    }

    /**
     * フォルダ選択ダイアログ表示
     * @returns {Promise<Object>} 選択結果
     */
    async selectHomePageFolder() {
        console.log('📁 ホームページフォルダ選択開始');

        try {
            // ブラウザサポート確認
            if (!this.isSupported) {
                throw new Error('File System Access API非対応ブラウザです');
            }

            // フォルダ選択ダイアログ表示
            this.selectedDirectoryHandle = await window.showDirectoryPicker({
                id: 'homepage-folder',
                mode: 'read',
                startIn: 'documents'
            });

            console.log('✅ フォルダ選択成功:', this.selectedDirectoryHandle.name);

            // HTMLファイル検索
            const scanResult = await this.scanForHtmlFiles();
            
            // イベント通知
            this.dispatchEvent('folderSelected', {
                directoryHandle: this.selectedDirectoryHandle,
                folderName: this.selectedDirectoryHandle.name,
                htmlFiles: scanResult.htmlFiles,
                totalFiles: scanResult.totalFiles,
                scanTime: scanResult.scanTime
            });

            return {
                success: true,
                folderName: this.selectedDirectoryHandle.name,
                htmlFiles: scanResult.htmlFiles,
                totalFiles: scanResult.totalFiles
            };

        } catch (error) {
            console.error('❌ フォルダ選択エラー:', error);
            
            // エラー種別判定
            let errorMessage;
            if (error.name === 'AbortError') {
                errorMessage = 'フォルダ選択がキャンセルされました';
            } else if (error.name === 'NotAllowedError') {
                errorMessage = 'フォルダアクセス許可が拒否されました';
            } else if (error.message.includes('非対応')) {
                errorMessage = error.message;
            } else {
                errorMessage = 'フォルダ選択でエラーが発生しました';
            }

            // エラーイベント通知
            this.dispatchEvent('folderSelectionError', {
                error: error,
                message: errorMessage,
                code: error.name || 'UnknownError'
            });

            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * HTMLファイル検索
     * @returns {Promise<Object>} 検索結果
     */
    async scanForHtmlFiles() {
        const startTime = Date.now();
        const htmlFiles = [];
        const allFiles = [];

        console.log('🔍 HTMLファイル検索開始...');

        try {
            // ディレクトリ内のファイルを再帰的にスキャン
            await this.scanDirectory(this.selectedDirectoryHandle, htmlFiles, allFiles);

            const scanTime = Date.now() - startTime;
            console.log(`✅ スキャン完了: ${htmlFiles.length}個のHTMLファイル見つかりました (${scanTime}ms)`);

            // ファイル情報を整理
            this.currentFiles.clear();
            htmlFiles.forEach(file => {
                this.currentFiles.set(file.path, file);
            });

            return {
                htmlFiles: htmlFiles,
                totalFiles: allFiles.length,
                scanTime: scanTime
            };

        } catch (error) {
            console.error('❌ ファイルスキャンエラー:', error);
            throw error;
        }
    }

    /**
     * ディレクトリ再帰スキャン
     * @param {FileSystemDirectoryHandle} dirHandle - ディレクトリハンドル
     * @param {Array} htmlFiles - HTMLファイル配列
     * @param {Array} allFiles - 全ファイル配列
     * @param {string} currentPath - 現在のパス
     */
    async scanDirectory(dirHandle, htmlFiles, allFiles, currentPath = '') {
        try {
            for await (const [name, handle] of dirHandle.entries()) {
                const fullPath = currentPath ? `${currentPath}/${name}` : name;

                if (handle.kind === 'file') {
                    allFiles.push({ name, path: fullPath, type: 'file' });
                    
                    // HTMLファイル判定
                    if (this.isHtmlFile(name)) {
                        const fileData = {
                            name: name,
                            path: fullPath,
                            handle: handle,
                            size: null, // 必要に応じて取得
                            lastModified: null // 必要に応じて取得
                        };
                        
                        htmlFiles.push(fileData);
                        console.log(`📄 HTMLファイル発見: ${fullPath}`);
                    }
                } else if (handle.kind === 'directory') {
                    allFiles.push({ name, path: fullPath, type: 'directory' });
                    
                    // 再帰スキャン（深度制限あり）
                    const depth = fullPath.split('/').length;
                    if (depth < 5) { // 最大深度5に制限
                        await this.scanDirectory(handle, htmlFiles, allFiles, fullPath);
                    }
                }
            }
        } catch (error) {
            console.error(`❌ ディレクトリスキャンエラー (${currentPath}):`, error);
            // 単一ディレクトリのエラーは継続
        }
    }

    /**
     * HTMLファイル判定
     * @param {string} fileName - ファイル名
     * @returns {boolean} HTMLファイルかどうか
     */
    isHtmlFile(fileName) {
        const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        return this.supportedFileTypes.has(extension);
    }

    /**
     * HTMLファイル読み込み
     * @param {string} filePath - ファイルパス
     * @returns {Promise<string>} ファイル内容
     */
    async readHtmlFile(filePath) {
        try {
            const fileData = this.currentFiles.get(filePath);
            if (!fileData) {
                throw new Error(`ファイルが見つかりません: ${filePath}`);
            }

            console.log(`📖 HTMLファイル読み込み: ${filePath}`);
            
            const file = await fileData.handle.getFile();
            const content = await file.text();
            
            console.log(`✅ ファイル読み込み成功 (${content.length} bytes)`);
            return content;

        } catch (error) {
            console.error(`❌ ファイル読み込みエラー (${filePath}):`, error);
            throw error;
        }
    }

    /**
     * 選択中のフォルダ情報取得
     * @returns {Object} フォルダ情報
     */
    getCurrentFolder() {
        if (!this.selectedDirectoryHandle) {
            return null;
        }

        return {
            name: this.selectedDirectoryHandle.name,
            htmlFiles: Array.from(this.currentFiles.values()),
            fileCount: this.currentFiles.size
        };
    }

    /**
     * システム状態確認
     * @returns {Object} システム状態
     */
    getSystemStatus() {
        return {
            isSupported: this.isSupported,
            hasSelectedFolder: !!this.selectedDirectoryHandle,
            folderName: this.selectedDirectoryHandle?.name || null,
            fileCount: this.currentFiles.size,
            eventListeners: Object.fromEntries(
                Array.from(this.eventListeners.entries()).map(([key, handlers]) => [key, handlers.length])
            )
        };
    }

    /**
     * クリーンアップ
     */
    destroy() {
        console.log('🧹 FileSystemController クリーンアップ');
        this.selectedDirectoryHandle = null;
        this.currentFiles.clear();
        this.eventListeners.clear();
    }
}