/**
 * SpineFolderController.js - Spineフォルダ選択・データ解析コントローラー
 * 機能: Spineフォルダ選択・キャラクターデータ検出・ファイル構成解析
 * StableSpineRenderer統合対応
 */

export class SpineFolderController {
    constructor() {
        this.selectedSpineDirectory = null;
        this.spineCharacters = new Map(); // キャラクター名 → データ
        this.supportedSpineFiles = new Set(['.atlas', '.json', '.skel', '.png']);
        this.eventListeners = new Map();
        
        // 除外フォルダ・ファイル設定
        this.excludedFolders = new Set(['バックアップ', 'backup', 'bak', '.git', 'node_modules', '.svn']);
        this.excludedFilePatterns = [/backup/i, /bak/i, /temp/i, /\.tmp$/i];
        
        console.log('🎯 SpineFolderController初期化');
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
     * Spineフォルダ選択ダイアログ表示
     * @returns {Promise<Object>} 選択結果
     */
    async selectSpineFolder() {
        console.log('🎯 Spineフォルダ選択開始');

        try {
            // ブラウザサポート確認
            if (!this.isSupported) {
                throw new Error('File System Access API非対応ブラウザです');
            }

            // フォルダ選択ダイアログ表示
            this.selectedSpineDirectory = await window.showDirectoryPicker({
                id: 'spine-folder',
                mode: 'read',
                startIn: 'documents'
            });

            console.log('✅ Spineフォルダ選択成功:', this.selectedSpineDirectory.name);

            // Spineキャラクター検索・解析
            const scanResult = await this.scanForSpineCharacters();
            
            // イベント通知
            this.dispatchEvent('spineFolderSelected', {
                directoryHandle: this.selectedSpineDirectory,
                folderName: this.selectedSpineDirectory.name,
                characters: scanResult.characters,
                totalFiles: scanResult.totalFiles,
                scanTime: scanResult.scanTime
            });

            return {
                success: true,
                folderName: this.selectedSpineDirectory.name,
                characters: scanResult.characters,
                totalFiles: scanResult.totalFiles
            };

        } catch (error) {
            console.error('❌ Spineフォルダ選択エラー:', error);
            
            // エラー種別判定
            let errorMessage;
            if (error.name === 'AbortError') {
                errorMessage = 'Spineフォルダ選択がキャンセルされました';
            } else if (error.name === 'NotAllowedError') {
                errorMessage = 'Spineフォルダアクセス許可が拒否されました';
            } else if (error.message.includes('非対応')) {
                errorMessage = error.message;
            } else {
                errorMessage = 'Spineフォルダ選択でエラーが発生しました';
            }

            // エラーイベント通知
            this.dispatchEvent('spineFolderSelectionError', {
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
     * Spineキャラクター検索・解析
     * @returns {Promise<Object>} 検索結果
     */
    async scanForSpineCharacters() {
        const startTime = Date.now();
        const characters = [];
        const allFiles = [];

        console.log('🔍 Spineキャラクター検索開始...');

        try {
            // ディレクトリ内のファイルを再帰的にスキャン
            await this.scanDirectory(this.selectedSpineDirectory, characters, allFiles);

            const scanTime = Date.now() - startTime;
            console.log(`✅ Spineスキャン完了: ${characters.length}キャラクター見つかりました (${scanTime}ms)`);

            // キャラクター情報を整理
            this.spineCharacters.clear();
            characters.forEach(character => {
                this.spineCharacters.set(character.name, character);
            });

            return {
                characters: characters,
                totalFiles: allFiles.length,
                scanTime: scanTime
            };

        } catch (error) {
            console.error('❌ Spineスキャンエラー:', error);
            throw error;
        }
    }

    /**
     * ディレクトリ再帰スキャン（Spineキャラクター検出）
     * @param {FileSystemDirectoryHandle} dirHandle - ディレクトリハンドル
     * @param {Array} characters - キャラクター配列
     * @param {Array} allFiles - 全ファイル配列
     * @param {string} currentPath - 現在のパス
     */
    async scanDirectory(dirHandle, characters, allFiles, currentPath = '') {
        try {
            const dirFiles = new Map(); // ファイル名 → ハンドル
            
            // ディレクトリ内のファイルを収集
            for await (const [name, handle] of dirHandle.entries()) {
                const fullPath = currentPath ? `${currentPath}/${name}` : name;

                if (handle.kind === 'file') {
                    allFiles.push({ name, path: fullPath, type: 'file' });
                    
                    // 除外ファイル判定
                    if (this.isExcludedFile(name)) {
                        console.log(`🚫 除外ファイル: ${fullPath}`);
                        continue;
                    }
                    
                    // Spineファイル判定
                    if (this.isSpineFile(name)) {
                        dirFiles.set(name, { handle, path: fullPath });
                    }
                } else if (handle.kind === 'directory') {
                    allFiles.push({ name, path: fullPath, type: 'directory' });
                    
                    // 除外フォルダ判定
                    if (this.isExcludedFolder(name)) {
                        console.log(`🚫 除外フォルダ: ${fullPath}`);
                        continue; // バックアップフォルダなどをスキップ
                    }
                    
                    // 再帰スキャン（深度制限あり）
                    const depth = fullPath.split('/').length;
                    if (depth < 5) { // 最大深度5に制限
                        await this.scanDirectory(handle, characters, allFiles, fullPath);
                    }
                }
            }

            // Spineキャラクター検出・構成解析
            const detectedCharacter = this.analyzeSpineCharacter(dirHandle.name, dirFiles, currentPath);
            if (detectedCharacter) {
                characters.push(detectedCharacter);
                console.log(`🎭 Spineキャラクター発見: ${detectedCharacter.name}`);
            }

        } catch (error) {
            console.error(`❌ ディレクトリスキャンエラー (${currentPath}):`, error);
        }
    }

    /**
     * Spineファイル判定
     * @param {string} fileName - ファイル名
     * @returns {boolean} Spineファイルかどうか
     */
    isSpineFile(fileName) {
        const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        return this.supportedSpineFiles.has(extension);
    }

    /**
     * 除外フォルダ判定
     * @param {string} folderName - フォルダ名
     * @returns {boolean} 除外対象かどうか
     */
    isExcludedFolder(folderName) {
        // 完全一致チェック
        if (this.excludedFolders.has(folderName)) {
            return true;
        }
        
        // パターンマッチングチェック
        const lowerName = folderName.toLowerCase();
        return this.excludedFilePatterns.some(pattern => pattern.test(lowerName));
    }

    /**
     * 除外ファイル判定
     * @param {string} fileName - ファイル名
     * @returns {boolean} 除外対象かどうか
     */
    isExcludedFile(fileName) {
        // パターンマッチングチェック
        const lowerName = fileName.toLowerCase();
        return this.excludedFilePatterns.some(pattern => pattern.test(lowerName));
    }

    /**
     * Spineキャラクター構成解析
     * @param {string} dirName - ディレクトリ名
     * @param {Map} files - ファイルマップ
     * @param {string} path - パス
     * @returns {Object|null} キャラクターデータ
     */
    analyzeSpineCharacter(dirName, files, path) {
        // 必須ファイル確認
        const atlasFile = Array.from(files.keys()).find(name => name.endsWith('.atlas'));
        const jsonFile = Array.from(files.keys()).find(name => name.endsWith('.json'));
        
        if (!atlasFile || !jsonFile) {
            return null; // Spineキャラクターではない
        }

        // キャラクター名推定（ディレクトリ名またはファイル名から）
        const characterName = this.extractCharacterName(dirName, atlasFile, jsonFile);
        
        // StableSpineRenderer対応データ構造
        const characterData = {
            name: characterName,
            displayName: this.toDisplayName(characterName),
            path: path,
            basePath: path ? `${path}/` : '',
            files: {
                atlas: atlasFile,
                json: jsonFile,
                texture: Array.from(files.keys()).find(name => name.endsWith('.png')) || null
            },
            fileHandles: {
                atlas: files.get(atlasFile)?.handle,
                json: files.get(jsonFile)?.handle,
                texture: files.get(Array.from(files.keys()).find(name => name.endsWith('.png')))?.handle
            },
            // StableSpineRenderer設定用
            spineConfig: {
                character: characterName,
                basePath: `/assets/spine/characters/${characterName}/`,
                // アニメーション名は後で自動検出
                animations: this.getKnownAnimations(characterName)
            },
            isComplete: !!(atlasFile && jsonFile),
            fileCount: files.size
        };

        return characterData;
    }

    /**
     * キャラクター名抽出
     * @param {string} dirName - ディレクトリ名
     * @param {string} atlasFile - atlasファイル名
     * @param {string} jsonFile - jsonファイル名
     * @returns {string} キャラクター名
     */
    extractCharacterName(dirName, atlasFile, jsonFile) {
        // ファイル名から拡張子を除去
        const atlasName = atlasFile.replace('.atlas', '');
        const jsonName = jsonFile.replace('.json', '');
        
        // 一致する場合はファイル名を使用
        if (atlasName === jsonName) {
            return atlasName;
        }
        
        // ディレクトリ名を使用
        return dirName;
    }

    /**
     * 表示名変換
     * @param {string} characterName - キャラクター名
     * @returns {string} 表示名
     */
    toDisplayName(characterName) {
        const displayNames = {
            'purattokun': 'ぷらっとくん',
            'nezumi': 'ねずみ'
        };
        return displayNames[characterName] || characterName;
    }

    /**
     * 既知のアニメーション名取得
     * @param {string} characterName - キャラクター名
     * @returns {Array} アニメーション配列
     */
    getKnownAnimations(characterName) {
        const animationMap = {
            'purattokun': ['taiki', 'yarare', 'syutugen'],
            'nezumi': ['search', 'kettei']
        };
        return animationMap[characterName] || [];
    }

    /**
     * 選択中のSpineフォルダ情報取得
     * @returns {Object} フォルダ情報
     */
    getCurrentSpineFolder() {
        if (!this.selectedSpineDirectory) {
            return null;
        }

        return {
            name: this.selectedSpineDirectory.name,
            characters: Array.from(this.spineCharacters.values()),
            characterCount: this.spineCharacters.size
        };
    }

    /**
     * キャラクターデータ取得
     * @param {string} characterName - キャラクター名
     * @returns {Object|null} キャラクターデータ
     */
    getCharacter(characterName) {
        return this.spineCharacters.get(characterName) || null;
    }

    /**
     * 全キャラクター一覧取得
     * @returns {Array} キャラクター配列
     */
    getAllCharacters() {
        return Array.from(this.spineCharacters.values());
    }

    /**
     * システム状態確認
     * @returns {Object} システム状態
     */
    getSystemStatus() {
        return {
            isSupported: this.isSupported,
            hasSelectedFolder: !!this.selectedSpineDirectory,
            folderName: this.selectedSpineDirectory?.name || null,
            characterCount: this.spineCharacters.size,
            characters: Array.from(this.spineCharacters.keys()),
            eventListeners: Object.fromEntries(
                Array.from(this.eventListeners.entries()).map(([key, handlers]) => [key, handlers.length])
            )
        };
    }

    /**
     * クリーンアップ
     */
    destroy() {
        console.log('🧹 SpineFolderController クリーンアップ');
        this.selectedSpineDirectory = null;
        this.spineCharacters.clear();
        this.eventListeners.clear();
    }
}