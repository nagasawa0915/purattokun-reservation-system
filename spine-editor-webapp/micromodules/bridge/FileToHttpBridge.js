/**
 * FileToHttpBridge - File API → StableSpineRenderer 変換ブリッジ
 * 
 * 🎯 目的
 * File System Access API経由で取得したSpineアセット（Atlas/JSON/テクスチャ）を
 * StableSpineRendererが理解できるHTTP形式に変換し、シームレスな統合を実現
 * 
 * 🔄 変換フロー
 * File API選択 → FileToHttpBridge → StableSpineRenderer → Spine描画
 *     ↓              ↓                  ↓
 * ローカルファイル  → HTTP形式変換 → 標準的な描画処理 → 成功
 * 
 * 🚀 Phase 1 MVP機能
 * - 単一キャラクター変換 (convertCharacterFiles)
 * - 基本クリーンアップ (cleanup)  
 * - StableSpineRenderer基本統合
 * - エラーハンドリング・詳細ログ
 * 
 * 📋 使用例
 * ```javascript
 * const bridge = new FileToHttpBridge({ debug: true });
 * const httpData = await bridge.convertCharacterFiles('nezumi', fileHandles);
 * 
 * const renderer = new StableSpineRenderer({
 *     character: 'nezumi',
 *     basePath: httpData.basePath
 * });
 * 
 * await renderer.initialize();
 * httpData.cleanup(); // 使用後クリーンアップ
 * ```
 */

class FileToHttpBridge {
    constructor(options = {}) {
        // 設定
        this.config = {
            tempBasePath: options.tempBasePath || '/temp/spine/',
            debug: options.debug || false,
            logCallback: options.logCallback || null,
            autoCleanup: options.autoCleanup !== false // デフォルトtrue
        };

        // 内部コンポーネント初期化
        this.blobManager = new BlobUrlManager({
            debug: this.config.debug
        });

        // アクティブなキャラクターデータ管理
        this.activeCharacters = new Map();

        // HTTPリクエストインターセプト用マッピング
        this.pathToBlobMapping = new Map();

        // 元のfetch関数を保存
        this.originalFetch = window.fetch;
        
        // 元のXMLHttpRequest関数を保存
        this.originalXMLHttpRequest = window.XMLHttpRequest;

        // 統計情報
        this.stats = {
            totalConversions: 0,
            successfulConversions: 0,
            failedConversions: 0,
            startTime: Date.now()
        };

        this.log('🌉 FileToHttpBridge 初期化完了', 'info');
        this.log(`📁 一時ベースパス: ${this.config.tempBasePath}`, 'info');
    }

    /**
     * HTTPリクエストインターセプトを開始
     * 仮想パスへのリクエストをBlob URLにリダイレクト
     */
    enableRequestInterceptor() {
        const self = this;
        
        // fetch APIをオーバーライド
        window.fetch = async function(url, options = {}) {
            // URLが文字列の場合のみ処理（Requestオブジェクトは除外）
            if (typeof url === 'string') {
                // デバッグ: 全てのリクエストをログ出力
                self.log(`📡 HTTP Request: ${url}`, 'debug');
                
                // 仮想パスかチェック
                const blobUrl = self.pathToBlobMapping.get(url);
                if (blobUrl) {
                    self.log(`🔄 HTTPリクエストインターセプト: ${url} → Blob URL`, 'bridge');
                    return await self.originalFetch(blobUrl, options);
                } else {
                    // マッピングにない場合はデバッグ情報を出力
                    if (url.includes('/temp/spine/')) {
                        self.log(`⚠️ 仮想パスがマッピングに存在しません: ${url}`, 'warning');
                        self.log(`📋 現在のマッピング:`, 'debug');
                        for (const [virtualPath, blobUrl] of self.pathToBlobMapping.entries()) {
                            self.log(`   ${virtualPath} → ${blobUrl.substring(0, 50)}...`, 'debug');
                        }
                    }
                }
            }
            
            // 通常のリクエストはそのまま処理
            return await self.originalFetch(url, options);
        };
        
        // XMLHttpRequestもオーバーライド
        window.XMLHttpRequest = function() {
            const xhr = new self.originalXMLHttpRequest();
            const originalOpen = xhr.open;
            
            // XMLHttpRequestインスタンス作成をログ出力
            self.log(`🔧 XMLHttpRequest インスタンス作成`, 'debug');
            
            xhr.open = function(method, url, async, user, password) {
                if (typeof url === 'string') {
                    self.log(`📡 XMLHttpRequest: ${method} ${url}`, 'debug');
                    
                    // 仮想パスかチェック
                    const blobUrl = self.pathToBlobMapping.get(url);
                    if (blobUrl) {
                        self.log(`🔄 XMLHttpRequestインターセプト: ${url} → Blob URL`, 'bridge');
                        url = blobUrl;
                    } else if (url.includes('/temp/spine/')) {
                        self.log(`⚠️ 仮想パス(XHR)がマッピングに存在しません: ${url}`, 'warning');
                        self.log(`📋 現在のXHRマッピング:`, 'debug');
                        for (const [virtualPath, blobUrl] of self.pathToBlobMapping.entries()) {
                            self.log(`   ${virtualPath} → ${blobUrl.substring(0, 50)}...`, 'debug');
                        }
                    }
                }
                
                return originalOpen.call(this, method, url, async, user, password);
            };
            
            return xhr;
        };
        
        // XMLHttpRequestオーバーライド確認
        self.log(`🔍 XMLHttpRequest オーバーライド確認: ${window.XMLHttpRequest !== self.originalXMLHttpRequest}`, 'debug');
        
        this.log('🔧 HTTPリクエストインターセプト有効化 (fetch + XMLHttpRequest)', 'info');
    }

    /**
     * HTTPリクエストインターセプトを停止
     */
    disableRequestInterceptor() {
        window.fetch = this.originalFetch;
        window.XMLHttpRequest = this.originalXMLHttpRequest;
        this.log('🔧 HTTPリクエストインターセプト無効化 (fetch + XMLHttpRequest)', 'info');
    }

    /**
     * 特定のキャラクター用HTTPリクエストインターセプト設定
     * 
     * @param {object} pathSet - PathGeneratorの出力（仮想パス情報）
     * @param {object} blobUrls - 実際のBlob URLセット
     */
    setupRequestInterceptor(pathSet, blobUrls, characterName) {
        // 仮想パス → Blob URLマッピングを作成
        for (const [fileType, virtualPath] of Object.entries(pathSet.files)) {
            const blobUrl = blobUrls[fileType];
            if (blobUrl) {
                this.pathToBlobMapping.set(virtualPath, blobUrl);
                this.log(`🗺️ パスマッピング追加: ${virtualPath} → ${blobUrl.substring(0, 50)}...`, 'bridge');
            }
        }

        // 🔥 重要：テクスチャファイル名の直接マッピングを追加
        // Spine WebGLがAtlas内で参照するテクスチャファイル名を直接マッピング
        if (blobUrls.texture) {
            const textureFileName = `${characterName}.png`;
            this.pathToBlobMapping.set(textureFileName, blobUrls.texture);
            this.log(`🗺️ テクスチャファイル名マッピング追加: ${textureFileName} → ${blobUrls.texture.substring(0, 50)}...`, 'bridge');
            
            // JPEGの場合も対応
            const textureFileNameJpg = `${characterName}.jpg`;
            this.pathToBlobMapping.set(textureFileNameJpg, blobUrls.texture);
            this.log(`🗺️ テクスチャファイル名マッピング追加: ${textureFileNameJpg} → ${blobUrls.texture.substring(0, 50)}...`, 'bridge');
        }

        // 初回設定時のみインターセプト有効化
        if (this.pathToBlobMapping.size > 0 && window.fetch === this.originalFetch) {
            this.enableRequestInterceptor();
        }

        this.log(`📊 パスマッピング数: ${this.pathToBlobMapping.size}`, 'info');
    }

    /**
     * 単一キャラクターのFile APIデータをHTTP形式に変換（Phase 1 MVP）
     * 
     * @param {string} characterName - キャラクター名 ('nezumi', 'purattokun')
     * @param {object} fileHandles - FileSystemFileHandleセット
     * @param {object} options - オプション設定
     * @returns {Promise<HttpConversionResult>} 変換結果
     */
    async convertCharacterFiles(characterName, fileHandles, options = {}) {
        const conversionStartTime = Date.now();
        this.stats.totalConversions++;

        try {
            this.log(`🚀 変換開始: ${characterName}`, 'info');

            // Step 1: 入力検証
            this.validateInput(characterName, fileHandles);

            // Step 2: 既存データクリーンアップ（必要時）
            if (this.activeCharacters.has(characterName)) {
                this.log(`⚠️ 既存データを検出 - クリーンアップ中: ${characterName}`, 'warning');
                this.cleanup(characterName);
            }

            // Step 3: ファイル内容読み込み
            const fileData = await this.readFiles(fileHandles);

            // Step 4: Blob URL生成
            const blobUrls = this.createBlobUrls(characterName, fileData);

            // Step 5: HTTP形式パス生成
            const pathSet = this.generatePaths(characterName, fileData);

            // Step 6: 仮想HTTPマッピング構築
            const mapping = PathGenerator.generateBlobMapping(pathSet, blobUrls);

            // Step 7: 結果データ構築
            const conversionResult = this.buildConversionResult(
                characterName, 
                pathSet, 
                blobUrls, 
                mapping,
                conversionStartTime
            );

            // Step 8: アクティブデータ登録
            this.activeCharacters.set(characterName, {
                conversionResult,
                blobUrls,
                mapping,
                createdAt: new Date()
            });

            // Step 9: HTTPリクエストインターセプト設定
            this.setupRequestInterceptor(pathSet, blobUrls, characterName);

            this.stats.successfulConversions++;
            this.log(`✅ 変換完了: ${characterName} (${Date.now() - conversionStartTime}ms)`, 'success');

            return conversionResult;

        } catch (error) {
            this.stats.failedConversions++;
            this.log(`❌ 変換失敗: ${characterName} - ${error.message}`, 'error');
            console.error('FileToHttpBridge変換エラー:', error);
            throw new ConversionError(error.message, 'CONVERSION_FAILED', {
                characterName,
                originalError: error
            });
        }
    }

    /**
     * 入力パラメータ検証
     * 
     * @param {string} characterName - キャラクター名
     * @param {object} fileHandles - FileHandleセット
     */
    validateInput(characterName, fileHandles) {
        // キャラクター名検証
        if (!characterName || typeof characterName !== 'string') {
            throw new Error('有効なキャラクター名が必要です');
        }

        if (characterName.trim() === '') {
            throw new Error('キャラクター名が空です');
        }

        // FileHandles検証
        if (!fileHandles || typeof fileHandles !== 'object') {
            throw new Error('有効なfileHandlesオブジェクトが必要です');
        }

        const requiredFiles = ['atlas', 'json', 'texture'];
        for (const fileType of requiredFiles) {
            if (!fileHandles[fileType]) {
                throw new Error(`${fileType}ファイルハンドルが未指定です`);
            }

            // FileSystemFileHandle基本チェック
            const handle = fileHandles[fileType];
            if (!handle || typeof handle.getFile !== 'function') {
                throw new Error(`${fileType}ハンドルが無効なFileSystemFileHandleです`);
            }
        }

        this.log(`✅ 入力検証完了: ${characterName}`, 'info');
    }

    /**
     * ファイル内容読み込み
     * 
     * @param {object} fileHandles - FileHandleセット
     * @returns {Promise<object>} ファイルデータセット
     */
    async readFiles(fileHandles) {
        this.log('📖 ファイル読み込み開始', 'info');

        const fileData = {};
        const readPromises = [];

        for (const [fileType, handle] of Object.entries(fileHandles)) {
            const readPromise = this.readSingleFile(fileType, handle)
                .then(data => {
                    fileData[fileType] = data;
                    this.log(`📄 ${fileType}読み込み完了: ${data.name} (${this.formatSize(data.size)})`, 'info');
                });
            
            readPromises.push(readPromise);
        }

        // 並行読み込み実行
        await Promise.all(readPromises);

        this.log('✅ 全ファイル読み込み完了', 'success');
        return fileData;
    }

    /**
     * 単一ファイル読み込み
     * 
     * @param {string} fileType - ファイルタイプ
     * @param {FileSystemFileHandle} handle - ファイルハンドル
     * @returns {Promise<File>} ファイルオブジェクト
     */
    async readSingleFile(fileType, handle) {
        try {
            const file = await handle.getFile();
            
            // ファイルサイズ・タイプ検証
            if (file.size === 0) {
                throw new Error(`${fileType}ファイルが空です`);
            }

            if (file.size > 50 * 1024 * 1024) { // 50MB制限
                throw new Error(`${fileType}ファイルサイズが大きすぎます (${this.formatSize(file.size)})`);
            }

            return file;

        } catch (error) {
            throw new Error(`${fileType}ファイル読み込みエラー: ${error.message}`);
        }
    }

    /**
     * Blob URL生成
     * 
     * @param {string} characterName - キャラクター名  
     * @param {object} fileData - ファイルデータセット
     * @returns {object} Blob URLセット
     */
    createBlobUrls(characterName, fileData) {
        this.log('🔗 Blob URL生成開始', 'info');

        const blobUrls = {};

        for (const [fileType, file] of Object.entries(fileData)) {
            // MIMEタイプ自動判定
            const mimeType = PathGenerator.getMimeType(file.name);
            
            // Blob URL生成（BlobUrlManagerを使用）
            const blobUrl = this.blobManager.createBlobUrl(file, mimeType, {
                characterName,
                fileType
            });

            blobUrls[fileType] = blobUrl;
        }

        this.log(`✅ Blob URL生成完了: ${Object.keys(blobUrls).length}件`, 'success');
        return blobUrls;
    }

    /**
     * HTTP形式パス生成
     * 
     * @param {string} characterName - キャラクター名
     * @param {object} fileData - ファイルデータセット  
     * @returns {object} パスセット
     */
    generatePaths(characterName, fileData) {
        this.log('🗂️ パス生成開始', 'info');

        // ファイル名セット構築
        const fileNames = {};
        for (const [fileType, file] of Object.entries(fileData)) {
            fileNames[fileType] = file.name;
        }

        // PathGeneratorでパス生成
        const pathSet = PathGenerator.generateCompletePathSet(
            characterName,
            fileNames,
            this.config.tempBasePath
        );

        // パス検証
        const validation = PathGenerator.validatePathSet(pathSet);
        if (!validation.valid) {
            throw new Error(`パス生成エラー: ${validation.errors.join(', ')}`);
        }

        this.log(`✅ パス生成完了: ${pathSet.basePath}`, 'success');
        return pathSet;
    }

    /**
     * 変換結果データ構築
     * 
     * @param {string} characterName - キャラクター名
     * @param {object} pathSet - パスセット
     * @param {object} blobUrls - Blob URLセット
     * @param {object} mapping - マッピング情報
     * @param {number} startTime - 開始時刻
     * @returns {object} HttpConversionResult
     */
    buildConversionResult(characterName, pathSet, blobUrls, mapping, startTime) {
        const conversionTime = Date.now() - startTime;
        
        // 総ファイルサイズ計算
        let totalSize = 0;
        for (const url of Object.values(blobUrls)) {
            const metadata = this.blobManager.getMetadata(url);
            if (metadata) {
                totalSize += metadata.originalSize;
            }
        }

        return {
            success: true,
            characterName: characterName,
            basePath: pathSet.basePath,
            files: pathSet.files,
            blobUrls: blobUrls,
            stats: {
                conversionTime: conversionTime,
                totalSize: totalSize,
                fileCount: Object.keys(blobUrls).length
            },
            cleanup: () => this.cleanup(characterName) // クリーンアップ関数
        };
    }

    /**
     * リソースクリーンアップ（Phase 1 MVP）
     * 
     * @param {string|null} characterName - 特定キャラクター名（null=全体）
     * @returns {number} クリーンアップされたリソース数
     */
    cleanup(characterName = null) {
        try {
            if (characterName) {
                return this.cleanupCharacter(characterName);
            } else {
                return this.cleanupAll();
            }
        } catch (error) {
            this.log(`❌ クリーンアップエラー: ${error.message}`, 'error');
            return 0;
        }
    }

    /**
     * 特定キャラクターのクリーンアップ
     * 
     * @param {string} characterName - キャラクター名
     * @returns {number} クリーンアップされたリソース数
     */
    cleanupCharacter(characterName) {
        this.log(`🧹 キャラクタークリーンアップ開始: ${characterName}`, 'info');

        const characterData = this.activeCharacters.get(characterName);
        
        if (!characterData) {
            this.log(`⚠️ キャラクターデータが見つかりません: ${characterName}`, 'warning');
            return 0;
        }

        // Blob URL解放
        let cleanedCount = 0;
        for (const blobUrl of Object.values(characterData.blobUrls)) {
            if (this.blobManager.revokeBlobUrl(blobUrl)) {
                cleanedCount++;
            }
        }

        // HTTPリクエストインターセプトマッピング削除
        if (characterData.conversionResult && characterData.conversionResult.files) {
            for (const virtualPath of Object.values(characterData.conversionResult.files)) {
                this.pathToBlobMapping.delete(virtualPath);
                this.log(`🗺️ パスマッピング削除: ${virtualPath}`, 'bridge');
            }
        }

        // アクティブリストから削除
        this.activeCharacters.delete(characterName);

        this.log(`✅ キャラクタークリーンアップ完了: ${characterName} (${cleanedCount}件)`, 'success');
        return cleanedCount;
    }

    /**
     * 全リソースクリーンアップ
     * 
     * @returns {number} クリーンアップされたリソース数
     */
    cleanupAll() {
        this.log('🧹 全リソースクリーンアップ開始', 'info');

        // 全Blob URL解放
        const cleanedCount = this.blobManager.revokeAllUrls();

        // HTTPリクエストインターセプトマッピング全削除
        this.pathToBlobMapping.clear();
        this.disableRequestInterceptor();
        this.log('🗺️ 全パスマッピング削除・インターセプト無効化', 'bridge');

        // アクティブリスト全削除
        this.activeCharacters.clear();

        this.log(`✅ 全リソースクリーンアップ完了: ${cleanedCount}件`, 'success');
        return cleanedCount;
    }

    /**
     * 統計情報取得
     * 
     * @returns {object} 統計情報
     */
    getStats() {
        const currentTime = Date.now();
        const uptime = currentTime - this.stats.startTime;
        
        return {
            ...this.stats,
            activeCharacters: Array.from(this.activeCharacters.keys()),
            uptime: uptime,
            memoryUsage: {
                blobUrls: this.blobManager.getStats().activeCount,
                estimatedSize: this.blobManager.getStats().estimatedSize
            },
            performance: {
                averageConversionTime: this.stats.successfulConversions > 0 
                    ? uptime / this.stats.successfulConversions : 0,
                successRate: this.stats.totalConversions > 0 
                    ? (this.stats.successfulConversions / this.stats.totalConversions * 100).toFixed(1) + '%' : '0%'
            }
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
     * @param {string} type - ログタイプ
     */
    log(message, type = 'info') {
        if (this.config.debug) {
            const timestamp = new Date().toLocaleTimeString();
            const prefix = type === 'error' ? '❌' : 
                          type === 'success' ? '✅' :
                          type === 'warning' ? '⚠️' : 'ℹ️';
                          
            const logMessage = `[${timestamp}] ${prefix} FileToHttpBridge: ${message}`;

            if (this.config.logCallback) {
                this.config.logCallback(logMessage);
            } else {
                console.log(logMessage);
            }
        }
    }

    /**
     * デストラクタ（手動クリーンアップ）
     */
    destroy() {
        this.log('🔥 FileToHttpBridge破棄開始', 'info');
        const cleanedCount = this.cleanup();
        this.blobManager.destroy();
        this.log(`✅ FileToHttpBridge破棄完了 (${cleanedCount}件クリーンアップ)`, 'success');
    }
}

/**
 * ConversionError - 変換エラー専用クラス
 */
class ConversionError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR', details = {}) {
        super(message);
        this.name = 'ConversionError';
        this.code = code;
        this.details = details;
    }
}

// モジュールエクスポート（Node.js環境対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FileToHttpBridge, ConversionError };
}

// ES6モジュールエクスポート
if (typeof window !== 'undefined') {
    window.FileToHttpBridge = FileToHttpBridge;
    window.ConversionError = ConversionError;
}