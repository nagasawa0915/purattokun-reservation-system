// Spine Editor Desktop v2.0 - Project Loader (HTML-first Workflow)
// Phase 0 基盤機能: フォルダ選択・HTMLスキャン・プロジェクト管理
// 設計目標: 150行以内の軽量実装

/**
 * プロジェクトローダー - HTML-firstワークフローの中核
 * 
 * 責任範囲:
 * 1. フォルダ選択とバリデーション
 * 2. HTMLファイルの自動検出とスキャン
 * 3. プロジェクト状態の管理
 * 4. ファイル一覧の生成と整理
 */
export class ProjectLoader {
  constructor() {
    this.currentProject = null;
    this.htmlFiles = [];
    this.isLoading = false;
    this.errors = [];
    
    console.log('🔧 ProjectLoader initialized');
  }

  /**
   * フォルダ選択ダイアログを表示
   * @returns {Promise<Object|null>} プロジェクト情報またはnull
   */
  async selectFolder() {
    try {
      this.isLoading = true;
      this.clearErrors();
      
      const result = await window.electronAPI.fs.selectFolder({
        title: 'Select Project Folder',
        properties: ['openDirectory'],
        buttonLabel: 'Select Folder'
      });
      
      if (result.canceled || !result.filePaths?.length) {
        console.log('📁 Folder selection canceled');
        return null;
      }
      
      const folderPath = result.filePaths[0];
      console.log('📁 Selected folder:', folderPath);
      
      // フォルダのバリデーション
      if (!await this.validateFolder(folderPath)) {
        this.addError('Selected folder is not accessible or invalid');
        return null;
      }
      
      // プロジェクト分析
      const project = await this.analyzeFolder(folderPath);
      
      if (project) {
        this.currentProject = project;
        console.log(`✅ Project loaded: ${project.name} (${project.htmlFiles.length} HTML files)`);
      }
      
      return project;
      
    } catch (error) {
      this.addError(`Failed to select folder: ${error.message}`);
      console.error('❌ Folder selection error:', error);
      return null;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * フォルダを分析してプロジェクト情報を生成
   * @param {string} folderPath - 分析対象のフォルダパス
   * @returns {Promise<Object>} プロジェクト情報
   */
  async analyzeFolder(folderPath) {
    try {
      console.log('🔍 Analyzing folder:', folderPath);
      
      // HTMLファイルをスキャン
      const htmlFiles = await this.scanHTMLFiles(folderPath);
      
      if (htmlFiles.length === 0) {
        this.addError('No HTML files found in selected folder');
        return null;
      }
      
      // プロジェクト名を決定（フォルダ名から）
      const projectName = this.getProjectName(folderPath);
      
      // デフォルトHTMLファイルを決定
      const defaultHTML = this.findDefaultHTML(htmlFiles);
      
      return {
        path: folderPath,
        name: projectName,
        htmlFiles: htmlFiles,
        defaultHTML: defaultHTML,
        createdAt: new Date(),
        fileCount: htmlFiles.length
      };
      
    } catch (error) {
      this.addError(`Failed to analyze folder: ${error.message}`);
      console.error('❌ Folder analysis error:', error);
      return null;
    }
  }

  /**
   * フォルダ内のHTMLファイルを再帰的にスキャン
   * @param {string} folderPath - スキャン対象のフォルダパス
   * @returns {Promise<Array>} HTMLファイル一覧
   */
  async scanHTMLFiles(folderPath) {
    try {
      const htmlFiles = [];
      
      // Electronのファイルシステム機能を使用
      const scanResult = await window.electronAPI.fs.scanDirectory(folderPath, ['.html']);
      
      if (!scanResult.success) {
        throw new Error(scanResult.error);
      }
      
      // HTMLファイルの情報を構造化
      for (const htmlPath of scanResult.files.html || []) {
        const fileInfo = await this.createFileInfo(htmlPath);
        if (fileInfo) {
          htmlFiles.push(fileInfo);
        }
      }
      
      // ファイルを更新日時の降順でソート（最新ファイルが上に）
      htmlFiles.sort((a, b) => b.lastModified - a.lastModified);
      
      console.log(`📋 Found ${htmlFiles.length} HTML files`);
      return htmlFiles;
      
    } catch (error) {
      console.error('❌ HTML scan error:', error);
      throw error;
    }
  }

  /**
   * HTMLファイルの詳細情報を作成
   * @param {string} filePath - ファイルパス
   * @returns {Promise<Object>} ファイル情報オブジェクト
   */
  async createFileInfo(filePath) {
    try {
      // ファイル統計情報を取得
      const stats = await window.electronAPI.fs.getFileStats(filePath);
      if (!stats.success) {
        console.warn('⚠️ Could not get file stats:', filePath);
        return null;
      }
      
      const fileName = this.getFileName(filePath);
      const displayName = this.getDisplayName(fileName);
      
      return {
        name: fileName,
        path: filePath,
        displayName: displayName,
        lastModified: new Date(stats.mtime),
        size: stats.size,
        isIndex: false  // 無効化: index.html特殊処理によるSpine Editor自動起動を防止
      };
      
    } catch (error) {
      console.warn('⚠️ Error creating file info:', filePath, error.message);
      return null;
    }
  }

  /**
   * デフォルトHTMLファイルを決定
   * @param {Array} htmlFiles - HTMLファイル一覧
   * @returns {Object|null} デフォルトファイルまたはnull
   */
  findDefaultHTML(htmlFiles) {
    if (!htmlFiles.length) return null;
    
    // 優先順位: index.html > home.html > main.html > start.html > 最新ファイル
    const priorities = ['index.html', 'home.html', 'main.html', 'start.html'];
    
    for (const priority of priorities) {
      const found = htmlFiles.find(f => f.name.toLowerCase() === priority);
      if (found) {
        console.log(`🎯 Default HTML selected: ${found.name} (priority match)`);
        return found;
      }
    }
    
    // 優先ファイルが見つからない場合は最新ファイルを選択
    const latest = htmlFiles[0]; // 既にソート済み
    console.log(`🎯 Default HTML selected: ${latest.name} (latest file)`);
    return latest;
  }

  /**
   * フォルダのバリデーション
   * @param {string} folderPath - 検証対象のフォルダパス
   * @returns {Promise<boolean>} 有効かどうか
   */
  async validateFolder(folderPath) {
    try {
      // フォルダの存在確認
      const exists = await window.electronAPI.fs.pathExists(folderPath);
      if (!exists) {
        console.warn('⚠️ Folder does not exist:', folderPath);
        return false;
      }
      
      // 読み取り権限確認
      const readable = await window.electronAPI.fs.pathReadable(folderPath);
      if (!readable) {
        console.warn('⚠️ Folder is not readable:', folderPath);
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.warn('⚠️ Folder validation error:', error.message);
      return false;
    }
  }

  // ======================
  // ゲッター・ユーティリティ
  // ======================

  /**
   * 現在のプロジェクト情報を取得
   */
  getCurrentProject() {
    return this.currentProject;
  }

  /**
   * HTMLファイル一覧を取得
   */
  getFileList() {
    return this.currentProject?.htmlFiles || [];
  }

  /**
   * 現在のフォルダパスを取得
   */
  getCurrentFolder() {
    return this.currentProject?.path || null;
  }

  /**
   * エラー一覧を取得
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * 読み込み状態を取得
   */
  getLoadingState() {
    return this.isLoading;
  }

  // ======================
  // 内部ヘルパー関数
  // ======================

  getProjectName(folderPath) {
    return folderPath.split('/').pop() || folderPath.split('\\').pop() || 'Untitled Project';
  }

  getFileName(filePath) {
    return filePath.split('/').pop() || filePath.split('\\').pop();
  }

  getDisplayName(fileName) {
    // ファイル名から表示用の名前を生成
    return fileName
      .replace('.html', '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  addError(message) {
    this.errors.push({
      message,
      timestamp: new Date()
    });
    console.error('❌ ProjectLoader error:', message);
  }

  clearErrors() {
    this.errors = [];
  }

  /**
   * プロジェクトをクリア
   */
  clearProject() {
    this.currentProject = null;
    this.htmlFiles = [];
    this.clearErrors();
    console.log('🗑️ Project cleared');
  }

  /**
   * プロジェクト統計情報を取得
   */
  getProjectStats() {
    if (!this.currentProject) return null;
    
    return {
      name: this.currentProject.name,
      path: this.currentProject.path,
      htmlFileCount: this.currentProject.htmlFiles.length,
      defaultFile: this.currentProject.defaultHTML?.name || 'None',
      createdAt: this.currentProject.createdAt,
      hasErrors: this.errors.length > 0,
      errorCount: this.errors.length
    };
  }
}

// デフォルトエクスポート
export default ProjectLoader;