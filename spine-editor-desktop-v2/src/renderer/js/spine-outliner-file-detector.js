/**
 * Spine Outliner File Detector v1.0.0
 * Spineファイル自動検出・バリデーション・アウトライナー機能
 * 
 * 📋 機能概要:
 * - assets/spine/characters/配下のSpineファイル自動検出
 * - .json/.atlas/.png の3ファイルセット検証
 * - 既存デスクトップアプリファイル選択機能との統合
 * - エラーハンドリング・バリデーション
 * 
 * 🔧 技術制約:
 * - ファイルサイズ: 150行以内（v3.0哲学準拠）
 * - Spine 4.1.24固定対応
 * - ElectronAPI活用（window.electronAPI.fs）
 * 
 * @author Spine Editor Desktop v2.0
 * @version 1.0.0
 * @date 2025-08-13
 */

export class SpineFileDetector {
  constructor() {
    this.supportedExtensions = ['.json', '.atlas', '.png'];
    this.requiredFiles = ['json', 'atlas', 'png'];  // 3ファイルセット必須
    this.maxScanDepth = 3;  // パフォーマンス制約
    this.spineVersion = '4.1.24';  // 固定バージョン
  }

  /**
   * Spineアセット自動スキャン（メイン機能）
   * @param {string} folderPath - スキャン対象フォルダパス
   * @return {Promise<Array>} 検出されたキャラクターデータ配列
   */
  async scanSpineAssets(folderPath) {
    try {
      // ElectronAPI経由でファイルシステムスキャン
      const allFiles = await this.getAllFilesRecursively(folderPath);
      
      // Spineファイルグループ化
      const spineGroups = this.groupSpineFiles(allFiles);
      
      // バリデーション実行
      const validCharacters = await this.validateCharacters(spineGroups);
      
      // キャラクターデータ作成
      return validCharacters.map(group => this.createCharacterData(group));
      
    } catch (error) {
      console.error('📋 Spine assets scan failed:', error);
      throw new Error(`Spine assets scan failed: ${error.message}`);
    }
  }

  /**
   * 再帰的ファイル取得（ElectronAPI統合）
   */
  async getAllFilesRecursively(folderPath) {
    try {
      const scanResult = await window.electronAPI.fs.scanDirectory(
        folderPath, 
        this.supportedExtensions
      );
      
      if (!scanResult.success) {
        throw new Error(scanResult.error);
      }
      
      return scanResult.files || { json: [], atlas: [], png: [] };
      
    } catch (error) {
      console.error('📂 File scan error:', error);
      throw new Error(`File system scan failed: ${error.message}`);
    }
  }

  /**
   * Spineファイルグループ化（同一ベース名検索）
   */
  groupSpineFiles(allFiles) {
    const jsonFiles = allFiles.json || [];
    const atlasFiles = allFiles.atlas || [];
    const pngFiles = allFiles.png || [];
    const groups = new Map();
    
    // JSONファイルを基準としたグループ化
    for (const jsonFile of jsonFiles) {
      const baseName = this.getBaseName(jsonFile);
      const baseDir = this.getDirectoryPath(jsonFile);
      
      // 対応する.atlas/.pngファイルを検索
      const atlasFile = this.findMatchingFile(atlasFiles, baseName, baseDir);
      const pngFile = this.findMatchingFile(pngFiles, baseName, baseDir);
      
      if (atlasFile && pngFile) {
        groups.set(baseName, {
          id: baseName,
          name: this.generateDisplayName(baseName),
          jsonPath: jsonFile,
          atlasPath: atlasFile,
          texturePath: pngFile,
          folderPath: baseDir
        });
      }
    }
    
    return Array.from(groups.values());
  }

  /**
   * マッチングファイル検索
   */
  findMatchingFile(fileList, baseName, baseDir) {
    return fileList.find(file => {
      const fileBaseName = this.getBaseName(file);
      const fileDir = this.getDirectoryPath(file);
      return fileBaseName === baseName && fileDir === baseDir;
    });
  }

  /**
   * キャラクターデータバリデーション
   */
  async validateCharacters(spineGroups) {
    const validCharacters = [];
    
    for (const group of spineGroups) {
      try {
        // ファイル存在確認
        const files = [group.jsonPath, group.atlasPath, group.texturePath];
        const existsChecks = await Promise.all(
          files.map(file => this.checkFileExists(file))
        );
        
        if (existsChecks.every(exists => exists)) {
          // Spine 4.1.24互換性チェック（簡易）
          if (await this.validateSpineVersion(group.jsonPath)) {
            validCharacters.push(group);
          } else {
            console.warn(`⚠️ Spine version compatibility issue: ${group.name}`);
          }
        } else {
          console.warn(`❌ Missing files for character: ${group.name}`);
        }
        
      } catch (error) {
        console.warn(`🚨 Validation error for ${group.name}:`, error);
      }
    }
    
    return validCharacters;
  }

  /**
   * ファイル存在確認（ElectronAPI）
   */
  async checkFileExists(filePath) {
    try {
      return await window.electronAPI.fs.pathExists(filePath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Spineバージョン簡易チェック
   */
  async validateSpineVersion(jsonPath) {
    try {
      const fileResult = await window.electronAPI.fs.readFile(jsonPath);
      if (!fileResult.success) return false;
      
      const spineData = JSON.parse(fileResult.data);
      const version = spineData.skeleton?.spine || '4.1.24';
      
      // 4.1.x系統を許可（4.1.24固定運用）
      return version.startsWith('4.1.');
      
    } catch (error) {
      console.warn('Version check failed:', error);
      return true;  // チェック失敗時は許可（フォールバック）
    }
  }

  /**
   * キャラクターデータ作成
   */
  createCharacterData(group) {
    return {
      id: group.id,
      name: group.name,
      jsonPath: group.jsonPath,
      atlasPath: group.atlasPath,
      texturePath: group.texturePath,
      folderPath: group.folderPath,
      type: 'spine-character',
      version: this.spineVersion,
      animations: [],  // 後でJSONから抽出
      thumbnailPath: group.texturePath,  // PNGをサムネイルとして使用
      createdAt: new Date().toISOString()
    };
  }

  /**
   * ユーティリティ: ベース名取得
   */
  getBaseName(filePath) {
    const fileName = filePath.split('/').pop() || filePath;
    return fileName.replace(/\.[^.]+$/, '');
  }

  /**
   * ユーティリティ: ディレクトリパス取得
   */
  getDirectoryPath(filePath) {
    const parts = filePath.split('/');
    parts.pop();
    return parts.join('/');
  }

  /**
   * ユーティリティ: 表示名生成
   */
  generateDisplayName(baseName) {
    // キャメルケース → スペース区切り
    const formatted = baseName
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^[a-z]/, char => char.toUpperCase());
    
    return formatted || baseName;
  }

  /**
   * 既存AppFileManagerとの統合ヘルパー
   */
  async integrateWithAppFileManager(appFileManager) {
    if (!appFileManager.homepageFolder) {
      throw new Error('Homepage folder not selected in AppFileManager');
    }
    
    // assets/spine/characters/配下を優先スキャン
    const spineCharactersPath = `${appFileManager.homepageFolder}/assets/spine/characters`;
    
    try {
      const characters = await this.scanSpineAssets(spineCharactersPath);
      console.log(`🎭 Detected ${characters.length} Spine characters`);
      return characters;
    } catch (error) {
      // フォールバック: プロジェクトルートをスキャン
      console.warn('Characters folder scan failed, trying project root...');
      return await this.scanSpineAssets(appFileManager.homepageFolder);
    }
  }
}

// モジュールエクスポート（ES6対応）
export default SpineFileDetector;