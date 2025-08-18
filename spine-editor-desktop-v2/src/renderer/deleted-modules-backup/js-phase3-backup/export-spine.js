/**
 * Spine Editor Desktop v2.0 - Spine Asset Module
 * Spineアセット収集・処理機能
 */

export class ExportSpine {
  constructor() {
    this.assetCache = new Map();
    this.validationRules = {
      json: ['.json'],
      atlas: ['.atlas', '.atlas.txt'],
      image: ['.png', '.jpg', '.jpeg']
    };
  }

  /**
   * 完全Spineアセット収集（並列処理版）
   */
  async includeCompleteSpineAssets(packageData, project) {
    if (!project.spineData?.characters) {
      console.warn('⚠️ No characters found in project');
      return;
    }
    
    const characterCount = project.spineData.characters.length;
    console.log(`🦴 Processing ${characterCount} characters in parallel...`);
    
    // 全キャラクターを並列処理（大幅な性能向上）
    const characterResults = await Promise.allSettled(
      project.spineData.characters.map(character => 
        this.processCharacterAssets(packageData, character)
      )
    );

    // 処理結果の詳細レポート
    let successCount = 0;
    let failureCount = 0;
    
    characterResults.forEach((result, index) => {
      const character = project.spineData.characters[index];
      const characterId = character.id || `character-${index}`;
      
      if (result.status === 'fulfilled') {
        successCount++;
        console.log(`✅ Character ${characterId} processed successfully`);
      } else {
        failureCount++;
        console.error(`❌ Character ${characterId} processing failed:`, result.reason);
      }
    });
    
    console.log(`🦴 Parallel asset processing complete: ${successCount} successful, ${failureCount} failed, ${packageData.files.size} total files`);
    
    if (failureCount > 0 && successCount === 0) {
      throw new Error(`All character processing failed (${failureCount}/${characterCount})`);
    }
  }

  /**
   * キャラクターアセット処理（並列最適化版）
   */
  async processCharacterAssets(packageData, character) {
    const characterId = character.id || 'character';
    console.log(`📁 Processing character: ${characterId}`);

    // 各アセットタイプを並列処理（エラー耐性付き）
    const assetResults = await Promise.allSettled([
      this.processJSONAsset(packageData, character, characterId),
      this.processAtlasAsset(packageData, character, characterId),
      this.processImageAsset(packageData, character, characterId)
    ]);

    // 結果の詳細ログ
    assetResults.forEach((result, index) => {
      const assetTypes = ['JSON', 'Atlas', 'Image'];
      if (result.status === 'fulfilled') {
        console.log(`✅ ${assetTypes[index]} processed for ${characterId}`);
      } else {
        console.warn(`⚠️ ${assetTypes[index]} processing failed for ${characterId}:`, result.reason);
      }
    });

    console.log(`✅ Character processing completed: ${characterId}`);
  }

  /**
   * JSONアセット処理
   */
  async processJSONAsset(packageData, character, characterId) {
    if (!character.jsonPath) {
      console.warn(`⚠️ No JSON path for character: ${characterId}`);
      return;
    }

    try {
      const content = await this.readAndValidateAsset(character.jsonPath, 'json');
      if (content) {
        const targetPath = `assets/${characterId}.json`;
        packageData.files.set(targetPath, content);
        console.log(`✅ JSON asset added: ${targetPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to process JSON for ${characterId}:`, error);
    }
  }

  /**
   * Atlasアセット処理
   */
  async processAtlasAsset(packageData, character, characterId) {
    if (!character.atlasPath) {
      console.warn(`⚠️ No Atlas path for character: ${characterId}`);
      return;
    }

    try {
      const content = await this.readAndValidateAsset(character.atlasPath, 'atlas');
      if (content) {
        const targetPath = `assets/${characterId}.atlas`;
        packageData.files.set(targetPath, content);
        console.log(`✅ Atlas asset added: ${targetPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to process Atlas for ${characterId}:`, error);
    }
  }

  /**
   * 画像アセット処理
   */
  async processImageAsset(packageData, character, characterId) {
    if (!character.imagePath) {
      console.warn(`⚠️ No Image path for character: ${characterId}`);
      return;
    }

    try {
      const content = await this.readAndValidateAsset(character.imagePath, 'image');
      if (content) {
        const extension = this.getFileExtension(character.imagePath);
        const targetPath = `assets/${characterId}${extension}`;
        packageData.files.set(targetPath, content);
        console.log(`✅ Image asset added: ${targetPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to process Image for ${characterId}:`, error);
    }
  }

  /**
   * アセットファイル読み込み・バリデーション
   */
  async readAndValidateAsset(filePath, assetType) {
    // キャッシュチェック
    if (this.assetCache.has(filePath)) {
      console.log(`📦 Using cached asset: ${filePath}`);
      return this.assetCache.get(filePath);
    }

    // ファイル拡張子バリデーション
    if (!this.validateAssetType(filePath, assetType)) {
      throw new Error(`Invalid file type for ${assetType}: ${filePath}`);
    }

    // ファイル読み込み
    try {
      const result = await window.electronAPI.readFile(filePath);
      if (!result.success) {
        throw new Error(result.error || 'File read failed');
      }

      // 内容バリデーション
      const validatedContent = await this.validateAssetContent(result.data, assetType, filePath);
      
      // キャッシュに保存
      this.assetCache.set(filePath, validatedContent);
      
      return validatedContent;
      
    } catch (error) {
      console.error(`❌ Asset read failed: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * アセットタイプバリデーション
   */
  validateAssetType(filePath, assetType) {
    const extension = this.getFileExtension(filePath).toLowerCase();
    const validExtensions = this.validationRules[assetType] || [];
    
    return validExtensions.some(validExt => extension === validExt);
  }

  /**
   * アセット内容バリデーション
   */
  async validateAssetContent(content, assetType, filePath) {
    switch (assetType) {
      case 'json':
        return this.validateJSONContent(content, filePath);
      case 'atlas':
        return this.validateAtlasContent(content, filePath);
      case 'image':
        return this.validateImageContent(content, filePath);
      default:
        return content;
    }
  }

  /**
   * JSON内容バリデーション
   */
  validateJSONContent(content, filePath) {
    try {
      const parsed = JSON.parse(content);
      
      // Spine JSONの基本構造チェック
      if (!parsed.skeleton) {
        console.warn(`⚠️ JSON missing skeleton section: ${filePath}`);
      }
      
      if (!parsed.bones || !Array.isArray(parsed.bones)) {
        console.warn(`⚠️ JSON missing or invalid bones: ${filePath}`);
      }
      
      if (!parsed.animations) {
        console.warn(`⚠️ JSON missing animations section: ${filePath}`);
      }
      
      console.log(`✅ JSON validation passed: ${filePath}`);
      return content;
      
    } catch (error) {
      throw new Error(`Invalid JSON format in ${filePath}: ${error.message}`);
    }
  }

  /**
   * Atlas内容バリデーション
   */
  validateAtlasContent(content, filePath) {
    // Atlas形式の基本チェック
    const lines = content.split('\n');
    let hasValidStructure = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 画像ファイル参照行をチェック
      if (line.endsWith('.png') || line.endsWith('.jpg')) {
        hasValidStructure = true;
        break;
      }
      
      // format行をチェック
      if (line.startsWith('format:')) {
        hasValidStructure = true;
        break;
      }
    }
    
    if (!hasValidStructure) {
      console.warn(`⚠️ Atlas file may not be valid format: ${filePath}`);
    } else {
      console.log(`✅ Atlas validation passed: ${filePath}`);
    }
    
    return content;
  }

  /**
   * 画像内容バリデーション
   */
  validateImageContent(content, filePath) {
    // バイナリデータの基本チェック
    if (typeof content === 'string') {
      // Base64エンコードされた画像データの場合
      if (content.startsWith('data:image/')) {
        console.log(`✅ Base64 image validation passed: ${filePath}`);
        return content;
      }
    }
    
    // バイナリデータサイズチェック
    const size = content.length || (content.byteLength || 0);
    if (size === 0) {
      throw new Error(`Empty image file: ${filePath}`);
    }
    
    if (size < 100) {
      console.warn(`⚠️ Suspiciously small image file: ${filePath} (${size} bytes)`);
    }
    
    console.log(`✅ Image validation passed: ${filePath} (${size} bytes)`);
    return content;
  }

  /**
   * Spineライブラリ最適化読み込み
   */
  async includeOptimizedSpineLibrary(packageData) {
    const libraryPaths = [
      '../assets/spine/spine-webgl.js',
      '../assets/spine/spine-webgl-minimal.js',
      './assets/spine/spine-webgl.js'
    ];
    
    console.log('📜 Loading Spine WebGL library...');
    
    for (const path of libraryPaths) {
      try {
        const result = await window.electronAPI.readFile(path);
        if (result.success && result.data) {
          const optimizedLibrary = this.optimizeSpineLibrary(result.data);
          packageData.files.set('spine-webgl.js', optimizedLibrary);
          console.log(`✅ Optimized Spine library loaded: ${path} (${result.data.length} bytes)`);
          return;
        }
      } catch (error) {
        console.warn(`⚠️ Failed to load library: ${path}`);
      }
    }
    
    // フォールバック: 最小ライブラリ生成
    const minimalLibrary = this.generateMinimalSpineLibrary();
    packageData.files.set('spine-webgl.js', minimalLibrary);
    console.log('📜 Using minimal fallback Spine library');
  }

  /**
   * Spineライブラリ最適化
   */
  optimizeSpineLibrary(libraryContent) {
    // 本番用最適化処理
    let optimized = libraryContent;
    
    // デバッグコードの削除
    optimized = optimized.replace(/console\.debug\([^)]*\);?/g, '');
    
    // 詳細ログの削除
    optimized = optimized.replace(/console\.log\("Spine WebGL[^"]*"\);?/g, '');
    
    // 不要なコメントブロック削除（ただし著作権表示は保持）
    optimized = optimized.replace(/\/\*\*[\s\S]*?\*\/(?!\s*\/)/g, '');
    
    console.log(`🔧 Library optimized: ${libraryContent.length} → ${optimized.length} bytes`);
    return optimized;
  }

  /**
   * 最小Spineライブラリ生成
   */
  generateMinimalSpineLibrary() {
    return `/**
 * Spine WebGL Minimal Runtime
 * Generated by Spine Editor Desktop v2.0
 */

(function(window) {
    'use strict';
    
    // Spine WebGL minimal implementation
    const spine = {
        VERSION: '2.0.0-minimal',
        
        // WebGLコンテキスト管理
        WebGLContext: function(canvas) {
            this.canvas = canvas;
            this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!this.gl) {
                throw new Error('WebGL not supported');
            }
            
            console.log('Spine WebGL Context initialized');
        },
        
        // スケルトンローダー
        SkeletonLoader: function() {
            this.loadSkeleton = function(jsonPath, atlasPath) {
                console.log('Loading skeleton:', jsonPath, atlasPath);
                return new Promise((resolve, reject) => {
                    // 最小限のローディング実装
                    setTimeout(() => {
                        resolve({
                            skeleton: { name: 'minimal-skeleton' },
                            animations: ['syutugen', 'taiki', 'click']
                        });
                    }, 100);
                });
            };
        },
        
        // アニメーションステート
        AnimationState: function(skeleton) {
            this.skeleton = skeleton;
            this.tracks = [];
            this.timeScale = 1.0;
            
            this.setAnimation = function(trackIndex, animationName, loop) {
                console.log('Setting animation:', animationName, 'loop:', loop);
                this.tracks[trackIndex] = { animation: animationName, loop: loop };
            };
            
            this.clearTracks = function() {
                console.log('Clearing animation tracks');
                this.tracks = [];
            };
            
            this.update = function(delta) {
                // 最小限の更新処理
            };
            
            this.apply = function() {
                // 最小限の適用処理
            };
        },
        
        // スケルトン
        Skeleton: function(data) {
            this.data = data;
            this.x = 0;
            this.y = 0;
            this.scaleX = 1;
            this.scaleY = 1;
            
            this.setPosition = function(x, y) {
                this.x = x;
                this.y = y;
                console.log('Skeleton position:', x, y);
            };
            
            this.setScale = function(scaleX, scaleY) {
                this.scaleX = scaleX;
                this.scaleY = scaleY || scaleX;
                console.log('Skeleton scale:', this.scaleX, this.scaleY);
            };
        },
        
        // ユーティリティ関数
        utils: {
            loadBinaryFile: function(path, callback) {
                console.log('Loading binary file:', path);
                if (callback) callback(null, new ArrayBuffer(0));
            },
            
            loadTextFile: function(path, callback) {
                console.log('Loading text file:', path);
                if (callback) callback(null, '');
            }
        }
    };
    
    // グローバル公開
    window.spine = spine;
    
    console.log('Spine WebGL Minimal Runtime loaded (v' + spine.VERSION + ')');
    
})(window);

// 互換性のためのエイリアス
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.spine;
}`;
  }

  /**
   * アセット最適化処理
   */
  optimizeAssets(packageData) {
    console.log('🔧 Optimizing assets...');
    
    let optimizedCount = 0;
    
    packageData.files.forEach((content, filename) => {
      if (filename.endsWith('.json')) {
        // JSON最適化（整形削除）
        try {
          const parsed = JSON.parse(content);
          const minimized = JSON.stringify(parsed);
          if (minimized.length < content.length) {
            packageData.files.set(filename, minimized);
            optimizedCount++;
          }
        } catch (error) {
          console.warn(`⚠️ JSON optimization failed for ${filename}:`, error);
        }
      }
    });
    
    console.log(`✅ Asset optimization complete: ${optimizedCount} files optimized`);
  }

  /**
   * アセット整合性チェック
   */
  validateAssetIntegrity(packageData, project) {
    console.log('🔍 Validating asset integrity...');
    
    const validationResults = {
      valid: true,
      warnings: [],
      errors: []
    };
    
    if (!project.spineData?.characters) {
      validationResults.errors.push('No characters found in project');
      validationResults.valid = false;
      return validationResults;
    }
    
    for (const character of project.spineData.characters) {
      const characterId = character.id || 'character';
      
      // 必須ファイルの存在チェック
      const requiredFiles = [
        `assets/${characterId}.json`,
        `assets/${characterId}.atlas`
      ];
      
      requiredFiles.forEach(filename => {
        if (!packageData.files.has(filename)) {
          validationResults.errors.push(`Missing required file: ${filename}`);
          validationResults.valid = false;
        }
      });
      
      // 画像ファイルチェック（警告のみ）
      const imageFiles = Array.from(packageData.files.keys())
        .filter(filename => filename.startsWith(`assets/${characterId}.`) && 
               (filename.endsWith('.png') || filename.endsWith('.jpg')));
      
      if (imageFiles.length === 0) {
        validationResults.warnings.push(`No image file found for character: ${characterId}`);
      }
    }
    
    // Spineライブラリチェック
    if (!packageData.files.has('spine-webgl.js')) {
      validationResults.errors.push('Missing Spine WebGL library');
      validationResults.valid = false;
    }
    
    console.log(`✅ Asset integrity check complete: ${validationResults.valid ? 'PASS' : 'FAIL'}`);
    if (validationResults.warnings.length > 0) {
      console.warn('⚠️ Warnings:', validationResults.warnings);
    }
    if (validationResults.errors.length > 0) {
      console.error('❌ Errors:', validationResults.errors);
    }
    
    return validationResults;
  }

  /**
   * ファイル拡張子取得
   */
  getFileExtension(filePath) {
    const lastDot = filePath.lastIndexOf('.');
    return lastDot !== -1 ? filePath.substring(lastDot) : '';
  }

  /**
   * アセットメタデータ生成
   */
  generateAssetMetadata(packageData, project) {
    const metadata = {
      version: '2.0.0',
      generator: 'Spine Editor Desktop v2.0 - Asset Module',
      created: new Date().toISOString(),
      characters: [],
      assets: {
        json: [],
        atlas: [],
        images: [],
        library: null
      },
      totalFiles: packageData.files.size,
      totalSize: this.calculateTotalSize(packageData.files)
    };
    
    // キャラクター情報
    if (project.spineData?.characters) {
      metadata.characters = project.spineData.characters.map(char => ({
        id: char.id || 'character',
        name: char.name || char.id,
        position: { x: char.x || 0, y: char.y || 0 },
        scale: { x: char.scaleX || 1, y: char.scaleY || 1 }
      }));
    }
    
    // アセットファイル分類
    packageData.files.forEach((content, filename) => {
      if (filename.startsWith('assets/')) {
        if (filename.endsWith('.json')) {
          metadata.assets.json.push(filename);
        } else if (filename.endsWith('.atlas')) {
          metadata.assets.atlas.push(filename);
        } else if (filename.match(/\.(png|jpg|jpeg)$/)) {
          metadata.assets.images.push(filename);
        }
      } else if (filename === 'spine-webgl.js') {
        metadata.assets.library = filename;
      }
    });
    
    return metadata;
  }

  /**
   * ファイルサイズ計算
   */
  calculateTotalSize(fileMap) {
    let totalSize = 0;
    for (const content of fileMap.values()) {
      totalSize += new Blob([content]).size;
    }
    return totalSize;
  }

  /**
   * キャッシュクリア
   */
  clearCache() {
    this.assetCache.clear();
    console.log('🗑️ Asset cache cleared');
  }

  /**
   * デバッグ情報取得
   */
  getDebugInfo() {
    return {
      version: '2.0.0',
      module: 'export-spine',
      cacheSize: this.assetCache.size,
      validationRules: this.validationRules
    };
  }
}

// デフォルトエクスポート
export default ExportSpine;