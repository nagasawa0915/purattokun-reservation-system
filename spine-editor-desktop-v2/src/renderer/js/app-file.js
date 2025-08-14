/**
 * Spine Editor Desktop v2.0 - File Manager Module
 * ファイル操作・プロジェクト管理・Spineデータ読み込み
 */

export class AppFileManager {
  constructor(app) {
    this.app = app;
    this.homepageFolder = null;
  }

  /**
   * プロジェクトフォルダ選択（Spineファイル自動検索）
   */
  async selectHomepageFolder() {
    const result = await window.electronAPI.openFileDialog({
      title: 'フォルダを選択してください (Spineファイル自動検索)',
      message: 'プロジェクト本体フォルダまたはキャラクターフォルダを選択すると、自動的に.json/.atlasファイルを検索します',
      properties: ['openDirectory']
    });

    if (result.canceled || !result.filePaths.length) {
      throw new Error('No project folder selected');
    }

    this.homepageFolder = result.filePaths[0];
    this.app.homepageFolder = this.homepageFolder;
    this.app.utils.setStatus(`Project folder: ${this.homepageFolder}`);
    console.log('📁 Project folder selected:', this.homepageFolder);

    // フォルダ内のSpineファイルを自動検索
    await this.autoDetectSpineFiles(this.homepageFolder);
  }

  /**
   * フォルダ内Spineファイル自動検索
   */
  async autoDetectSpineFiles(folderPath) {
    try {
      this.app.utils.setStatus('Searching for Spine files in folder...');
      
      // Node.jsファイルシステムアクセスが必要なため、サーバー経由でファイルリスト取得
      const spineFiles = await this.scanFolderForSpineFiles(folderPath);
      
      if (!spineFiles.json || !spineFiles.atlas) {
        throw new Error('Spine files (.json and .atlas) not found in the selected folder');
      }
      
      this.app.utils.setStatus(`Found Spine files: ${spineFiles.json}, ${spineFiles.atlas}`);
      
      // 自動読み込み
      await this.loadSpineData(spineFiles);
      this.app.utils.setStatus('Spine character auto-imported successfully');
      
    } catch (error) {
      console.error('Auto-detection failed:', error);
      this.app.utils.setStatus('Auto-detection failed, manual selection required', 'warning');
      
      // フォールバック: 手動選択
      await this.importSpineCharacterManual();
    }
  }

  /**
   * フォルダ内Spineファイルスキャン（完全実装）
   */
  async scanFolderForSpineFiles(folderPath) {
    try {
      this.app.utils.setStatus('📁 フォルダを再帰的にスキャン中...');
      
      // ElectronのIPC経由でファイルシステム再帰スキャン
      const scanResult = await window.electronAPI.scanDirectory(folderPath);
      
      if (!scanResult.success) {
        throw new Error(scanResult.error);
      }
      
      const foundFiles = scanResult.files;
      console.log('🔍 スキャン結果:', foundFiles);
      
      // 最適なファイルペアを選択
      const bestPair = this.selectBestSpineFilesPair(foundFiles);
      
      if (!bestPair.json || !bestPair.atlas) {
        throw new Error(`Spine files not found. Found: ${foundFiles.json.length} JSON, ${foundFiles.atlas.length} Atlas files`);
      }
      
      this.app.utils.setStatus(`✅ Spineファイルペア発見: ${this.getBasename(bestPair.json)}, ${this.getBasename(bestPair.atlas)}`);
      return bestPair;
      
    } catch (error) {
      console.error('完全スキャン失敗:', error);
      
      // フォールバック: 簡易推測方式
      this.app.utils.setStatus('⚠️ 完全スキャン失敗、簡易推測を試行...');
      return await this.fallbackSimpleScan(folderPath);
    }
  }

  /**
   * 最適なSpineファイルペアを選択
   */
  selectBestSpineFilesPair(foundFiles) {
    const jsonFiles = foundFiles.json || [];
    const atlasFiles = foundFiles.atlas || [];
    const pngFiles = foundFiles.png || [];
    
    // 同じベース名のペアを検索
    for (const jsonPath of jsonFiles) {
      const jsonBasename = this.getBasename(jsonPath, '.json');
      
      for (const atlasPath of atlasFiles) {
        const atlasBasename = this.getBasename(atlasPath, '.atlas');
        
        if (jsonBasename === atlasBasename) {
          // 対応するPNGファイルを検索
          const pngPath = pngFiles.find(p => 
            this.getBasename(p, '.png') === jsonBasename
          ) || atlasPath.replace('.atlas', '.png');
          
          return {
            json: jsonPath,
            atlas: atlasPath,
            image: pngPath
          };
        }
      }
    }
    
    // 完全一致がない場合、最初のペアを返す
    if (jsonFiles.length > 0 && atlasFiles.length > 0) {
      const pngPath = pngFiles[0] || atlasFiles[0].replace('.atlas', '.png');
      
      return {
        json: jsonFiles[0],
        atlas: atlasFiles[0],
        image: pngPath
      };
    }
    
    return { json: null, atlas: null, image: null };
  }

  /**
   * フォールバック：簡易推測方式
   */
  async fallbackSimpleScan(folderPath) {
    const commonNames = ['character', 'spine', 'animation', 'main', 'purattokun', 'nezumi'];
    const files = { json: null, atlas: null, image: null };
    
    for (const name of commonNames) {
      const jsonPath = `${folderPath}/${name}.json`;
      const atlasPath = `${folderPath}/${name}.atlas`;
      const imagePath = `${folderPath}/${name}.png`;
      
      try {
        const jsonExists = await this.checkFileExists(jsonPath);
        const atlasExists = await this.checkFileExists(atlasPath);
        
        if (jsonExists && atlasExists) {
          files.json = jsonPath;
          files.atlas = atlasPath;
          files.image = imagePath;
          this.app.utils.setStatus(`📝 簡易推測成功: ${name}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    return files;
  }

  /**
   * ファイル存在チェック
   */
  async checkFileExists(filePath) {
    try {
      const result = await window.electronAPI.readFile(filePath);
      return result.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * 手動Spineファイル選択（フォールバック）
   */
  async importSpineCharacterManual() {
    const result = await window.electronAPI.openFileDialog({
      title: 'Select Spine Character Files (.json and .atlas required)',
      filters: [
        { name: 'Spine Files', extensions: ['json', 'atlas'] },
        { name: 'Spine JSON', extensions: ['json'] },
        { name: 'Spine Atlas', extensions: ['atlas'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile', 'multiSelections']
    });

    if (result.canceled || !result.filePaths.length) {
      throw new Error('No Spine character files selected');
    }

    // ファイル種別判定
    const files = this.categorizeSpineFiles(result.filePaths);
    
    // より柔軟なファイル検証
    if (!files.json && !files.atlas) {
      throw new Error('At least one .json or .atlas file is required');
    }
    
    // 不足ファイルの自動推測
    if (!files.json && files.atlas) {
      files.json = files.atlas.replace('.atlas', '.json');
      this.app.utils.setStatus('JSON file inferred from atlas file path');
    }
    if (!files.atlas && files.json) {
      files.atlas = files.json.replace('.json', '.atlas');
      this.app.utils.setStatus('Atlas file inferred from JSON file path');
    }

    // Spine データ読み込み
    await this.loadSpineData(files);
    this.app.utils.setStatus('Spine character imported successfully');
  }

  /**
   * Spine ファイル種別判定
   */
  categorizeSpineFiles(filePaths) {
    const files = { json: null, atlas: null, image: null };
    
    filePaths.forEach(path => {
      if (path.endsWith('.json')) files.json = path;
      else if (path.endsWith('.atlas')) files.atlas = path;
      else if (path.match(/\.(png|jpg|jpeg)$/i)) files.image = path;
    });
    
    return files;
  }

  /**
   * Spine データ読み込み
   */
  async loadSpineData(files) {
    if (!this.app.spine) {
      throw new Error('Spine Manager not initialized');
    }

    // キャラクターデータ構築
    const characterData = {
      id: 'imported-character',
      name: 'Imported Character',
      jsonPath: files.json,
      atlasPath: files.atlas,
      imagePath: files.image || files.atlas.replace('.atlas', '.png'),
      x: 400,
      y: 300,
      scaleX: 0.5,
      scaleY: 0.5
    };

    // Spine Manager にキャラクター読み込み
    await this.app.spine.loadCharacter(characterData.atlasPath, characterData.jsonPath);
    
    // プロジェクトデータ更新
    this.app.currentProject = {
      name: 'New Spine Project',
      created: new Date().toISOString(),
      spineData: {
        characters: [characterData]
      }
    };

    this.app.isProjectModified = true;
    
    // SpineOutlinerUI更新
    await this.updateSpineOutlinerAfterLoad(characterData);
    
    // UI状態更新
    this.app.utils.updateProjectInfo();
    this.app.utils.updateOutlinerUI();
  }

  /**
   * SpineOutlinerUI更新（キャラクター読み込み後）
   */
  async updateSpineOutlinerAfterLoad(characterData) {
    if (!this.app.spineOutliner) {
      console.warn('⚠️ SpineOutlinerUI not initialized');
      return;
    }
    
    try {
      // キャラクターをアウトライナーに追加
      const outlineData = {
        id: characterData.id,
        name: characterData.name || this.getBasename(characterData.jsonPath, '.json'),
        type: 'spine-character',
        jsonPath: characterData.jsonPath,
        atlasPath: characterData.atlasPath,
        imagePath: characterData.imagePath,
        position: { x: characterData.x, y: characterData.y },
        scale: { x: characterData.scaleX, y: characterData.scaleY }
      };
      
      // フォルダーベースでキャラクター一覧を表示
      if (this.homepageFolder) {
        await this.app.spineOutliner.loadFolder(this.homepageFolder);
      }
      
      console.log('✅ SpineOutlinerUI updated with character data');
      
    } catch (error) {
      console.error('❌ Failed to update SpineOutlinerUI:', error);
    }
  }

  /**
   * プロジェクト保存
   */
  async saveProject() {
    let filePath = this.app.currentProject.filePath;
    
    // 新規プロジェクトの場合は保存先選択
    if (!filePath) {
      const result = await window.electronAPI.saveFileDialog({
        title: 'Save Spine Project',
        defaultPath: 'spine-project.json',
        filters: [
          { name: 'Spine JSON', extensions: ['json'] }
        ]
      });
      
      if (result.canceled) {
        return;
      }
      
      filePath = result.filePath;
    }

    await this.saveProjectFile(filePath);
  }

  /**
   * プロジェクトファイル保存 (改良版)
   */
  async saveProjectFile(filePath) {
    this.app.utils.setStatus('Saving project...', 'loading');
    
    try {
      // 現在のSpine状態を取得
      const spineData = this.app.spine ? this.app.spine.exportProject() : null;
      
      // プロジェクトデータ構築
      const projectData = {
        version: '2.0.0',
        name: this.app.currentProject.name || 'Untitled Project',
        created: this.app.currentProject.created || new Date().toISOString(),
        lastModified: new Date().toISOString(),
        homepageFolder: this.homepageFolder || null,
        spineData: spineData,
        settings: {
          viewport: this.app.ui ? {
            zoom: this.app.ui.zoomLevel,
            tool: this.app.ui.currentTool
          } : null
        }
      };

      const jsonData = JSON.stringify(projectData, null, 2);
      const saveResult = await window.electronAPI.writeFile(filePath, jsonData);
      
      if (!saveResult.success) {
        throw new Error(saveResult.error);
      }

      this.app.currentProject.filePath = filePath;
      this.app.currentProject.lastModified = projectData.lastModified;
      this.app.isProjectModified = false;
      
      this.app.utils.updateProjectInfo();
      this.app.utils.setStatus('Project saved successfully');
      console.log('💾 Project saved:', filePath);
      
    } catch (error) {
      console.error('Error saving project file:', error);
      this.app.utils.setStatus('Failed to save project', 'error');
      throw error;
    }
  }

  /**
   * プロジェクトファイル読み込み
   */
  async loadProjectFile(filePath) {
    this.app.utils.setStatus('Loading project...', 'loading');
    
    try {
      const fileResult = await window.electronAPI.readFile(filePath);
      
      if (!fileResult.success) {
        throw new Error(fileResult.error);
      }

      const projectData = JSON.parse(fileResult.data);
      await this.app.loadProject(projectData, filePath);
      
      this.app.utils.setStatus('Project loaded successfully');
      
    } catch (error) {
      console.error('Error loading project file:', error);
      this.app.utils.setStatus('Failed to load project', 'error');
      throw error;
    }
  }

  /**
   * 最終パッケージ生成
   */
  async generateFinalPackage() {
    if (!this.app.currentProject || !this.homepageFolder) {
      this.app.utils.setStatus('Project and homepage folder required', 'warning');
      return;
    }
    
    try {
      // Export Manager でパッケージ生成
      await this.app.exporter.exportPackage(this.app.currentProject);
      
      // Homepage統合処理
      await this.integrateWithHomepage();
      
      this.app.utils.setStatus('Final package generated successfully');
      
    } catch (error) {
      console.error('❌ Final package generation failed:', error);
      this.app.utils.setStatus('Package generation failed', 'error');
      throw error;
    }
  }

  /**
   * Homepage統合処理
   */
  async integrateWithHomepage() {
    // Homepage の index.html を更新
    const indexPath = `${this.homepageFolder}/index.html`;
    
    // Spine設定をHTMLに埋め込み
    const spineConfig = this.generateSpineConfig();
    
    console.log('🏠 Homepage integration:', { indexPath, spineConfig });
    
    try {
      // HTMLファイル読み込み
      const htmlResult = await window.electronAPI.readFile(indexPath);
      if (!htmlResult.success) {
        throw new Error(`Cannot read homepage file: ${htmlResult.error}`);
      }
      
      // Spine設定を埋め込んだHTMLを生成
      const updatedHTML = this.embedSpineConfigToHTML(htmlResult.data, spineConfig);
      
      // HTMLファイル書き込み
      const writeResult = await window.electronAPI.writeFile(indexPath, updatedHTML);
      if (!writeResult.success) {
        throw new Error(`Cannot write homepage file: ${writeResult.error}`);
      }
      
      console.log('✅ Homepage integration completed');
      
    } catch (error) {
      console.warn('Homepage integration failed:', error);
      // 統合失敗は警告レベルで続行
    }
  }

  /**
   * Spine設定生成
   */
  generateSpineConfig() {
    if (!this.app.spine?.skeleton) return null;
    
    return {
      x: this.app.spine.skeleton.x,
      y: this.app.spine.skeleton.y,
      scaleX: this.app.spine.skeleton.scaleX,
      scaleY: this.app.spine.skeleton.scaleY
    };
  }

  /**
   * HTMLにSpine設定埋め込み
   */
  embedSpineConfigToHTML(htmlContent, spineConfig) {
    if (!spineConfig) return htmlContent;
    
    // 既存の設定ブロックを検索
    const configPattern = /<div[^>]*id=["']purattokun-config["'][^>]*>.*?<\/div>/s;
    
    const configDiv = `<div id="purattokun-config" style="display: none;"
     data-x="${spineConfig.x || 18}"
     data-y="${spineConfig.y || 49}"
     data-scale-x="${spineConfig.scaleX || 0.55}"
     data-scale-y="${spineConfig.scaleY || 0.55}"
     data-fade-delay="1500"
     data-fade-duration="2000">
</div>`;

    // 既存設定を置き換えまたは追加
    if (configPattern.test(htmlContent)) {
      return htmlContent.replace(configPattern, configDiv);
    } else {
      // <body>タグ直後に追加
      return htmlContent.replace(/<body[^>]*>/i, '$&\n' + configDiv);
    }
  }

  /**
   * ブラウザ対応パスヘルパー
   */
  getBasename(filePath, ext = '') {
    const filename = filePath.split('/').pop() || filePath;
    if (ext) {
      return filename.endsWith(ext) ? filename.slice(0, -ext.length) : filename;
    }
    return filename;
  }

  /**
   * ファイルパス正規化
   */
  normalizePath(filePath) {
    return filePath.replace(/\\/g, '/');
  }

  /**
   * 相対パス生成
   */
  getRelativePath(basePath, targetPath) {
    const base = this.normalizePath(basePath).split('/');
    const target = this.normalizePath(targetPath).split('/');
    
    // 共通部分を削除
    while (base.length && target.length && base[0] === target[0]) {
      base.shift();
      target.shift();
    }
    
    // 相対パス構築
    const upLevels = base.length - 1;
    const relativeParts = new Array(upLevels).fill('..').concat(target);
    
    return relativeParts.join('/');
  }
}