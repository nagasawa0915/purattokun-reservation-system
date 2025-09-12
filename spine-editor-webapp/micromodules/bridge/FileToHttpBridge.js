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
     * fetch, XMLHttpRequest, Image要素の全てをインターセプト
     */
    enableRequestInterceptor() {
        const self = this;
        
        // fetch APIをオーバーライド（contextを保持）
        window.fetch = async function(url, options = {}) {
            // URLが文字列の場合のみ処理（Requestオブジェクトは除外）
            if (typeof url === 'string') {
                // デバッグ: 全てのリクエストをログ出力
                self.log(`📡 HTTP Request: ${url}`, 'debug');
                
                // 仮想パスかチェック
                const blobUrl = self.pathToBlobMapping.get(url);
                if (blobUrl) {
                    self.log(`🔄 HTTPリクエストインターセプト: ${url} → Blob URL`, 'bridge');
                    return await self.originalFetch.call(window, blobUrl, options);
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
            
            // 通常のリクエストはそのまま処理（contextを保持）
            return await self.originalFetch.call(window, url, options);
        };
        
        // XMLHttpRequestもオーバーライド
        window.XMLHttpRequest = function() {
            const xhr = new self.originalXMLHttpRequest();
            const originalOpen = xhr.open;
            
            // XMLHttpRequestインスタンス作成をログ出力
            console.log('🔧 XMLHttpRequest インスタンス作成');
            self.log(`🔧 XMLHttpRequest インスタンス作成`, 'debug');
            
            xhr.open = function(method, url, async, user, password) {
                if (typeof url === 'string') {
                    console.log(`📡 XMLHttpRequest: ${method} ${url}`);
                    self.log(`📡 XMLHttpRequest: ${method} ${url}`, 'debug');
                    
                    // 仮想パスかチェック
                    const blobUrl = self.pathToBlobMapping.get(url);
                    if (blobUrl) {
                        console.log(`🔄 XMLHttpRequestインターセプト: ${url} → Blob URL`);
                        self.log(`🔄 XMLHttpRequestインターセプト: ${url} → Blob URL`, 'bridge');
                        url = blobUrl;
                    } else {
                        console.log(`⚠️ マッピングなし: ${url}`, self.pathToBlobMapping);
                        if (url.includes('/temp/spine/') || url.includes('nezumi')) {
                            self.log(`⚠️ 仮想パス(XHR)がマッピングに存在しません: ${url}`, 'warning');
                            self.log(`📋 現在のXHRマッピング:`, 'debug');
                            for (const [virtualPath, blobUrl] of self.pathToBlobMapping.entries()) {
                                self.log(`   ${virtualPath} → ${blobUrl.substring(0, 50)}...`, 'debug');
                            }
                        }
                    }
                }
                
                return originalOpen.call(this, method, url, async, user, password);
            };
            
            return xhr;
        };
        
        // XMLHttpRequestオーバーライド確認
        self.log(`🔍 XMLHttpRequest オーバーライド確認: ${window.XMLHttpRequest !== self.originalXMLHttpRequest}`, 'debug');
        
        // 🔥 Image要素のsrcプロパティをインターセプト（Spine WebGL MeshAttachment.updateRegion問題根本解決）
        const originalImage = window.Image;
        window.Image = function() {
            const img = new originalImage();
            const originalSetSrc = Object.getOwnPropertyDescriptor(Image.prototype, 'src').set;
            
            console.log('🖼️ [FileToHttpBridge] Image インスタンス作成 - MeshAttachment対策有効');
            
            Object.defineProperty(img, 'src', {
                set: function(url) {
                    if (typeof url === 'string') {
                        console.log(`🖼️ [MeshAttachment対策] Image.src設定要求: "${url}"`);
                        
                        // Blob URLの場合はそのまま使用
                        if (url.startsWith('blob:')) {
                            console.log(`🔗 既にBlob URL - そのまま使用: ${url.substring(0, 50)}...`);
                            originalSetSrc.call(this, url);
                            return;
                        }
                        
                        // 🔥 完全一致マッピング検索（大文字小文字区別なし）
                        let blobUrl = self.pathToBlobMapping.get(url);
                        
                        // 🔥 フォールバック検索1: 大文字小文字無視
                        if (!blobUrl) {
                            const lowerUrl = url.toLowerCase();
                            for (const [mappingKey, mappingValue] of self.pathToBlobMapping.entries()) {
                                if (mappingKey.toLowerCase() === lowerUrl) {
                                    blobUrl = mappingValue;
                                    console.log(`🔍 [フォールバック1] 大文字小文字無視マッチ: ${mappingKey}`);
                                    break;
                                }
                            }
                        }
                        
                        // 🔥 フォールバック検索2: ファイル名のみでマッチ
                        if (!blobUrl) {
                            const fileName = url.split('/').pop(); // パスからファイル名だけ抽出
                            blobUrl = self.pathToBlobMapping.get(fileName);
                            if (blobUrl) {
                                console.log(`🔍 [フォールバック2] ファイル名マッチ: ${fileName}`);
                            }
                        }
                        
                        // 🔥 フォールバック検索3: 部分文字列マッチ（nezumi.png等）
                        if (!blobUrl) {
                            for (const [mappingKey, mappingValue] of self.pathToBlobMapping.entries()) {
                                if (url.includes(mappingKey) || mappingKey.includes(url)) {
                                    blobUrl = mappingValue;
                                    console.log(`🔍 [フォールバック3] 部分文字列マッチ: ${url} ⟷ ${mappingKey}`);
                                    break;
                                }
                            }
                        }
                        
                        if (blobUrl) {
                            console.log(`🔄 [SUCCESS] Image srcインターセプト成功: ${url} → ${blobUrl.substring(0, 50)}...`);
                            url = blobUrl;
                        } else {
                            console.warn(`⚠️ [WARNING] Image マッピング検索失敗: "${url}"`);
                            console.log(`📋 利用可能なマッピング (${self.pathToBlobMapping.size}件):`);
                            for (const [key, value] of self.pathToBlobMapping.entries()) {
                                console.log(`   🗂️ "${key}" → ${value.substring(0, 30)}...`);
                            }
                            
                            // 🔥 緊急フォールバック: テクスチャがある場合は最初のテクスチャを使用
                            const firstTextureUrl = Array.from(self.pathToBlobMapping.values()).find(v => 
                                v.includes('blob:') && (v.includes('image') || self.pathToBlobMapping.size === 3)
                            );
                            
                            if (firstTextureUrl) {
                                console.log(`🆘 [緊急フォールバック] 最初のテクスチャを使用: ${firstTextureUrl.substring(0, 50)}...`);
                                url = firstTextureUrl;
                            }
                        }
                    }
                    originalSetSrc.call(this, url);
                },
                get: function() {
                    return this.getAttribute('src');
                },
                configurable: true
            });
            
            return img;
        };
        
        // Image要素コンストラクタのプロトタイプ継承
        window.Image.prototype = originalImage.prototype;
        
        self.log(`🔍 Image MeshAttachment対策オーバーライド確認完了`, 'debug');
        
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
     * 🔥 特定のキャラクター用HTTPリクエストインターセプト設定（Phase 1統合強化版）
     * StableSpineRenderer完全対応 + MeshAttachment.updateRegion問題根本解決
     * 
     * @param {object} pathSet - PathGeneratorの出力（仮想パス情報）
     * @param {object} blobUrls - 実際のBlob URLセット
     * @param {string} characterName - キャラクター名
     */
    setupRequestInterceptor(pathSet, blobUrls, characterName) {
        console.log('🔥 FileToHttpBridge Phase 1統合: HTTPリクエストインターセプト設定開始');
        console.log('📋 入力データ確認:', {
            pathSet: !!pathSet,
            pathSetKeys: pathSet ? Object.keys(pathSet) : [],
            blobUrls: !!blobUrls,
            blobUrlsKeys: blobUrls ? Object.keys(blobUrls) : [],
            characterName
        });

        // 🔥 Phase 1: 基本パスマッピング（仮想パス → Blob URL）
        if (pathSet && pathSet.files) {
            for (const [fileType, virtualPath] of Object.entries(pathSet.files)) {
                const blobUrl = blobUrls[fileType];
                if (blobUrl) {
                    this.pathToBlobMapping.set(virtualPath, blobUrl);
                    this.log(`🗺️ [Phase 1] 仮想パスマッピング: ${virtualPath} → ${blobUrl.substring(0, 50)}...`, 'bridge');
                }
            }
        }

        // 🔥 Phase 2: StableSpineRenderer AssetManager対応マッピング
        // AssetManagerはbasePath + 相対パスでリクエストするため
        if (pathSet && pathSet.basePath && blobUrls) {
            const characterPath = `${pathSet.basePath}${characterName}/`;
            
            // 相対パス形式でのマッピング
            const relativeAtlas = `${characterName}.atlas`;
            const relativeJson = `${characterName}.json`;
            const relativeTexture = `${characterName}.png`;
            
            if (blobUrls.atlas) {
                this.pathToBlobMapping.set(relativeAtlas, blobUrls.atlas);
                this.pathToBlobMapping.set(`${characterPath}${relativeAtlas}`, blobUrls.atlas);
                this.log(`🗺️ [Phase 2] Atlas相対パス: ${relativeAtlas} → ${blobUrls.atlas.substring(0, 50)}...`, 'bridge');
            }
            
            if (blobUrls.json) {
                this.pathToBlobMapping.set(relativeJson, blobUrls.json);
                this.pathToBlobMapping.set(`${characterPath}${relativeJson}`, blobUrls.json);
                this.log(`🗺️ [Phase 2] JSON相対パス: ${relativeJson} → ${blobUrls.json.substring(0, 50)}...`, 'bridge');
            }
            
            if (blobUrls.texture) {
                this.pathToBlobMapping.set(relativeTexture, blobUrls.texture);
                this.pathToBlobMapping.set(`${characterPath}${relativeTexture}`, blobUrls.texture);
                this.log(`🗺️ [Phase 2] テクスチャ相対パス: ${relativeTexture} → ${blobUrls.texture.substring(0, 50)}...`, 'bridge');
            }
            
            // 🔥 Phase 2.5: StableSpineRendererのassetsパス対応
            const assetsBasePath = `/assets/spine/characters/${characterName}/`;
            if (blobUrls.atlas) {
                this.pathToBlobMapping.set(`${assetsBasePath}${relativeAtlas}`, blobUrls.atlas);
                this.log(`🗺️ [Phase 2.5] Assets Atlas: ${assetsBasePath}${relativeAtlas} → ${blobUrls.atlas.substring(0, 50)}...`, 'bridge');
            }
            if (blobUrls.json) {
                this.pathToBlobMapping.set(`${assetsBasePath}${relativeJson}`, blobUrls.json);
                this.log(`🗺️ [Phase 2.5] Assets JSON: ${assetsBasePath}${relativeJson} → ${blobUrls.json.substring(0, 50)}...`, 'bridge');
            }
            if (blobUrls.texture) {
                this.pathToBlobMapping.set(`${assetsBasePath}${relativeTexture}`, blobUrls.texture);
                this.log(`🗺️ [Phase 2.5] Assets Texture: ${assetsBasePath}${relativeTexture} → ${blobUrls.texture.substring(0, 50)}...`, 'bridge');
            }
        }

        // 🔥 Phase 3: MeshAttachment.updateRegion問題対策
        // Atlas内で参照される全ての可能なテクスチャファイル名パターンをマッピング
        if (blobUrls.texture) {
            const texturePatterns = [
                `${characterName}.png`,
                `${characterName}.jpg`,
                `${characterName}.jpeg`,
                `${characterName}.webp`,
                `${characterName.toLowerCase()}.png`,
                `${characterName.toLowerCase()}.jpg`,
                `${characterName.toUpperCase()}.png`,
                `${characterName.toUpperCase()}.jpg`,
                // さらに、Atlas内で実際に参照される可能性のあるパス
                `nezumi.png`,  // nezumiキャラクター専用
                `purattokun.png`,  // purattokuんキャラクター専用
                // パスなしファイル名のみ
                'nezumi.png',
                'purattokun.png'
            ];
            
            texturePatterns.forEach(pattern => {
                this.pathToBlobMapping.set(pattern, blobUrls.texture);
                this.log(`🗺️ [Phase 3] テクスチャパターン: ${pattern} → Blob URL`, 'bridge');
            });
        }

        // 🔥 Phase 4: デバッグ用完全マッピング表示
        console.log('📊 HTTPインターセプト完全マッピング一覧:');
        for (const [virtualPath, blobUrl] of this.pathToBlobMapping.entries()) {
            console.log(`   📎 ${virtualPath} → ${blobUrl.substring(0, 50)}...`);
        }

        // 初回設定時のみインターセプト有効化
        if (this.pathToBlobMapping.size > 0 && window.fetch === this.originalFetch) {
            this.enableRequestInterceptor();
        }

        this.log(`📊 Phase 1統合完了: パスマッピング数 ${this.pathToBlobMapping.size}`, 'success');
        console.log('✅ FileToHttpBridge Phase 1統合: HTTPリクエストインターセプト設定完了');
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

        // 🚨 undefined URL問題対策: fileDataの詳細チェック
        console.log("🚨 createBlobUrls - fileData詳細チェック:");
        const requiredTypes = ['atlas', 'json', 'texture'];
        const missingTypes = [];
        
        for (const type of requiredTypes) {
            if (!fileData[type]) {
                missingTypes.push(type);
                console.error(`❌ fileData.${type} が存在しません`);
            } else {
                console.log(`✅ fileData.${type} 存在確認: ${fileData[type].name}`);
            }
        }
        
        if (missingTypes.length > 0) {
            const errorMessage = `必須ファイルが不足しています: ${missingTypes.join(', ')}`;
            console.error(`🚨 ${errorMessage}`);
            throw new Error(errorMessage);
        }

        for (const [fileType, file] of Object.entries(fileData)) {
            // ファイルオブジェクト検証
            if (!file || typeof file.name !== 'string' || typeof file.size !== 'number') {
                const errorMessage = `${fileType}のファイルオブジェクトが無効です`;
                console.error(`❌ ${errorMessage}:`, file);
                throw new Error(errorMessage);
            }
            
            // MIMEタイプ自動判定
            const mimeType = PathGenerator.getMimeType(file.name);
            
            // Blob URL生成（BlobUrlManagerを使用）
            const blobUrl = this.blobManager.createBlobUrl(file, mimeType, {
                characterName,
                fileType
            });

            if (!blobUrl || !blobUrl.startsWith('blob:')) {
                const errorMessage = `${fileType}のBlob URL生成に失敗しました`;
                console.error(`❌ ${errorMessage}: ${blobUrl}`);
                throw new Error(errorMessage);
            }

            blobUrls[fileType] = blobUrl;
            this.log(`🔗 Blob URL生成: ${fileType} (${file.name}) → ${blobUrl.substring(0, 50)}...`, 'info');
        }

        // 🚨 生成結果の最終検証
        console.log("🚨 createBlobUrls - 生成結果最終検証:");
        for (const type of requiredTypes) {
            if (!blobUrls[type]) {
                console.error(`❌ blobUrls.${type} が生成されませんでした`);
            } else {
                console.log(`✅ blobUrls.${type} 生成成功: ${blobUrls[type].substring(0, 50)}...`);
            }
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