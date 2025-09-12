/**
 * PathGenerator - パス生成ユーティリティクラス
 * 
 * 🎯 責務
 * - StableSpineRenderer互換のHTTPパス構造生成
 * - キャラクター名ベースの仮想ディレクトリ構造
 * - ファイルタイプ別パス生成・正規化
 * - 拡張子・MIMEタイプ自動判定
 *
 * 🔄 StableSpineRenderer期待形式
 * ```
 * basePath: '/temp/spine/nezumi/'
 * files: {
 *   atlas: '/temp/spine/nezumi/nezumi.atlas',
 *   json: '/temp/spine/nezumi/nezumi.json', 
 *   texture: '/temp/spine/nezumi/nezumi.png'
 * }
 * ```
 */

class PathGenerator {
    constructor() {
        // このクラスは静的メソッド中心のため、状態は持たない
    }

    /**
     * StableSpineRenderer互換ベースパス生成
     * 
     * @param {string} characterName - キャラクター名 ('nezumi', 'purattokun')
     * @param {string} tempRoot - 一時ルートパス (デフォルト: '/temp/spine/')
     * @returns {string} ベースパス ('/temp/spine/nezumi/')
     */
    static generateBasePath(characterName, tempRoot = '/temp/spine/') {
        if (!characterName || typeof characterName !== 'string') {
            throw new Error('有効なキャラクター名が必要です');
        }

        // キャラクター名の正規化（安全な文字のみ）
        const normalizedName = this.normalizeCharacterName(characterName);
        
        // ルートパス正規化
        const normalizedRoot = this.normalizePath(tempRoot);
        
        // ベースパス構築（末尾スラッシュ保証）
        const basePath = `${normalizedRoot}${normalizedName}/`;
        
        return basePath;
    }

    /**
     * ファイル別パス生成
     * 
     * @param {string} basePath - ベースパス
     * @param {string} fileName - ファイル名
     * @param {string} fileType - ファイルタイプ ('atlas', 'json', 'texture')
     * @returns {string} 完全ファイルパス
     */
    static generateFilePath(basePath, fileName, fileType) {
        if (!basePath || !fileName) {
            throw new Error('ベースパスとファイル名が必要です');
        }

        // ベースパス正規化（末尾スラッシュ保証）
        const normalizedBase = basePath.endsWith('/') ? basePath : basePath + '/';
        
        // ファイル名から拡張子推測・検証
        const extension = this.extractExtension(fileName);
        const expectedExtension = this.getExpectedExtension(fileType);
        
        // ファイル名正規化
        let normalizedFileName = fileName;
        
        // 拡張子が期待値と異なる場合は警告してから使用
        if (extension && expectedExtension && extension !== expectedExtension) {
            console.warn(`PathGenerator: ファイル拡張子不一致 - ${fileName} (期待: ${expectedExtension}, 実際: ${extension})`);
        }
        
        // 拡張子がない場合は自動補完
        if (!extension && expectedExtension) {
            normalizedFileName = this.changeExtension(fileName, expectedExtension);
        }
        
        return `${normalizedBase}${normalizedFileName}`;
    }

    /**
     * パス正規化（スラッシュ統一・重複削除）
     * 
     * @param {string} path - 正規化するパス
     * @returns {string} 正規化されたパス
     */
    static normalizePath(path) {
        if (!path || typeof path !== 'string') {
            return '/';
        }

        // バックスラッシュをスラッシュに統一
        let normalized = path.replace(/\\/g, '/');
        
        // 重複スラッシュを単一化
        normalized = normalized.replace(/\/+/g, '/');
        
        // 先頭スラッシュ保証
        if (!normalized.startsWith('/')) {
            normalized = '/' + normalized;
        }
        
        return normalized;
    }

    /**
     * キャラクター名正規化（URLセーフ化）
     * 
     * @param {string} characterName - 正規化するキャラクター名
     * @returns {string} 正規化されたキャラクター名
     */
    static normalizeCharacterName(characterName) {
        return characterName
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, '') // 安全な文字のみ
            .substring(0, 50); // 長さ制限
    }

    /**
     * ファイル拡張子抽出
     * 
     * @param {string} fileName - ファイル名
     * @returns {string|null} 拡張子（ピリオドなし）
     */
    static extractExtension(fileName) {
        if (!fileName || typeof fileName !== 'string') {
            return null;
        }

        const lastDotIndex = fileName.lastIndexOf('.');
        
        if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
            return null;
        }

        return fileName.substring(lastDotIndex + 1).toLowerCase();
    }

    /**
     * ファイルタイプに対応する期待拡張子取得
     * 
     * @param {string} fileType - ファイルタイプ ('atlas', 'json', 'texture')
     * @returns {string} 期待される拡張子
     */
    static getExpectedExtension(fileType) {
        const extensionMap = {
            'atlas': 'atlas',
            'json': 'json',
            'texture': 'png',  // デフォルトはPNG（JPEG/WebPも対応）
            'png': 'png',
            'jpg': 'jpg',
            'jpeg': 'jpg',
            'webp': 'webp'
        };

        return extensionMap[fileType?.toLowerCase()] || null;
    }

    /**
     * ファイル名の拡張子変更
     * 
     * @param {string} fileName - 元ファイル名
     * @param {string} newExtension - 新しい拡張子（ピリオドなし）
     * @returns {string} 拡張子変更後のファイル名
     */
    static changeExtension(fileName, newExtension) {
        if (!fileName) {
            return '';
        }

        const lastDotIndex = fileName.lastIndexOf('.');
        const baseName = lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex);
        
        return `${baseName}.${newExtension}`;
    }

    /**
     * MIMEタイプ自動判定
     * 
     * @param {string} fileName - ファイル名
     * @returns {string} MIMEタイプ
     */
    static getMimeType(fileName) {
        const extension = this.extractExtension(fileName);
        
        const mimeTypeMap = {
            'atlas': 'text/plain',
            'json': 'application/json',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'webp': 'image/webp'
        };

        return mimeTypeMap[extension] || 'application/octet-stream';
    }

    /**
     * StableSpineRenderer互換の完全パスセット生成
     * 
     * @param {string} characterName - キャラクター名
     * @param {object} fileNames - ファイル名セット {atlas, json, texture}
     * @param {string} tempRoot - 一時ルートパス
     * @returns {object} 完全パスセット
     */
    static generateCompletePathSet(characterName, fileNames, tempRoot = '/temp/spine/') {
        const basePath = this.generateBasePath(characterName, tempRoot);
        
        const pathSet = {
            basePath: basePath,
            files: {}
        };

        // 必須ファイルタイプ
        const requiredTypes = ['atlas', 'json', 'texture'];
        
        for (const fileType of requiredTypes) {
            const fileName = fileNames[fileType];
            
            if (!fileName) {
                throw new Error(`${fileType}ファイル名が指定されていません`);
            }

            pathSet.files[fileType] = this.generateFilePath(basePath, fileName, fileType);
        }

        return pathSet;
    }

    /**
     * Blob URLマッピング形式生成（FileToHttpBridge内部用）
     * 
     * @param {object} pathSet - generateCompletePathSetの出力
     * @param {object} blobUrls - Blob URLセット {atlas, json, texture}
     * @returns {object} マッピング情報
     */
    static generateBlobMapping(pathSet, blobUrls) {
        const mapping = {
            basePath: pathSet.basePath,
            virtualToBlob: new Map(),
            blobToVirtual: new Map()
        };

        // 仮想パス <-> Blob URL の双方向マッピング
        for (const [fileType, virtualPath] of Object.entries(pathSet.files)) {
            const blobUrl = blobUrls[fileType];
            
            if (blobUrl) {
                mapping.virtualToBlob.set(virtualPath, blobUrl);
                mapping.blobToVirtual.set(blobUrl, virtualPath);
                
                // 🔧 AssetManager用: 相対パス形式も追加
                // AssetManagerはbasePath + 相対パスでアクセスするため
                const relativePath = virtualPath.replace(pathSet.basePath, '');
                if (relativePath && relativePath !== virtualPath) {
                    mapping.virtualToBlob.set(relativePath, blobUrl);
                    console.log(`📋 相対パスマッピング追加: ${relativePath} -> ${blobUrl.substring(0, 50)}...`);
                }
                
                // 🔧 ファイル名のみでもアクセス可能にする（AssetManager互換性）
                const fileName = virtualPath.split('/').pop();
                if (fileName) {
                    mapping.virtualToBlob.set(fileName, blobUrl);
                    console.log(`📋 ファイル名マッピング追加: ${fileName} -> ${blobUrl.substring(0, 50)}...`);
                }
            }
        }

        return mapping;
    }

    /**
     * パス検証（StableSpineRenderer要求仕様チェック）
     * 
     * @param {object} pathSet - 検証するパスセット
     * @returns {object} 検証結果 {valid, errors}
     */
    static validatePathSet(pathSet) {
        const errors = [];
        
        // ベースパス検証
        if (!pathSet.basePath || typeof pathSet.basePath !== 'string') {
            errors.push('basePathが無効です');
        } else if (!pathSet.basePath.startsWith('/')) {
            errors.push('basePathは絶対パスである必要があります');
        } else if (!pathSet.basePath.endsWith('/')) {
            errors.push('basePathは末尾スラッシュが必要です');
        }

        // ファイルパス検証
        const requiredFiles = ['atlas', 'json', 'texture'];
        
        for (const fileType of requiredFiles) {
            const filePath = pathSet.files?.[fileType];
            
            if (!filePath) {
                errors.push(`${fileType}ファイルパスが未定義です`);
            } else if (!filePath.startsWith('/')) {
                errors.push(`${fileType}ファイルパスは絶対パスである必要があります`);
            } else if (!filePath.startsWith(pathSet.basePath)) {
                errors.push(`${fileType}ファイルパスがbasePathと不整合です`);
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

// モジュールエクスポート（Node.js環境対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PathGenerator;
}

// ES6モジュールエクスポート
if (typeof window !== 'undefined') {
    window.PathGenerator = PathGenerator;
}