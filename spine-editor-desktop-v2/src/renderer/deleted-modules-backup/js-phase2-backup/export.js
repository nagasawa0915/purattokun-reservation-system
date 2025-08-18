/**
 * Spine Editor Desktop v2.0 - Export Manager (Main Controller)
 * エクスポートシステム統合・制御
 */

import ExportCSS from './export-css.js';
import ExportPackage from './export-package.js';
import ExportHTML from './export-html.js';
import ExportSpine from './export-spine.js';
import ExportUtils from './export-utils.js';

class ExportManager {
  constructor(app) {
    this.app = app;
    this.exportFormats = ['html', 'json', 'css'];
    this.currentFormat = 'html';
    
    // モジュール初期化
    this.utils = new ExportUtils();
    this.cssExporter = new ExportCSS();
    this.packageExporter = new ExportPackage(app);
    this.htmlExporter = new ExportHTML();
    this.spineExporter = new ExportSpine();
    
    // 設定初期化
    this.initExportSettings();
  }

  /**
   * エクスポート初期化
   */
  async init() {
    console.log('📦 Initializing Export Manager v2.0...');
    
    try {
      // 各モジュールの設定を統合
      this.syncModuleConfigs();
      
      console.log('✅ Export Manager initialized');
      
    } catch (error) {
      console.error('❌ Export Manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * エクスポート設定初期化
   */
  initExportSettings() {
    this.exportConfig = {
      html: {
        includeLibrary: true,
        embedAssets: true,
        minify: false,
        responsive: true
      },
      json: {
        prettyPrint: true,
        includeMetadata: true
      },
      css: {
        prefix: 'spine-',
        units: 'px',
        precision: 4,
        responsive: true
      },
      package: {
        compression: 6,
        includeManifest: true,
        validateAssets: true
      }
    };
  }

  /**
   * モジュール設定同期
   */
  syncModuleConfigs() {
    // CSS エクスポーター設定更新
    this.cssExporter.updateConfig(this.exportConfig.css);
    
    // HTML エクスポーター設定更新
    this.htmlExporter.updateConfig(this.exportConfig.html);
  }

  /**
   * 完全パッケージ出力 (統合版)
   */
  async exportPackage(project) {
    if (!project) {
      throw new Error('No project to export');
    }

    if (!window.electronAPI) {
      throw new Error('Export requires Electron environment');
    }

    const timer = this.utils.createPerformanceTimer('Complete Package Export');

    try {
      // 出力先選択
      const result = await this.selectOutputPath(project);
      if (result.canceled) {
        return;
      }

      this.app.setStatus('Generating complete package...', 'loading');
      
      // 完全パッケージ生成（統合処理）
      const packageData = await this.generateCompletePackage(project);
      timer.lap('Package Generation');
      
      // 実際ZIPファイル作成
      await this.packageExporter.createActualZipFile(packageData, result.filePath);
      timer.lap('ZIP Creation');
      
      this.app.setStatus('Complete package exported successfully');
      
      // 成功処理
      await this.handleExportSuccess(result.filePath, packageData);
      timer.end();
      
    } catch (error) {
      console.error('❌ Complete package export failed:', error);
      this.app.setStatus('Package export failed', 'error');
      
      // エラー通知
      const errorNotification = this.utils.createErrorNotification(error, 'Package Export');
      this.showNotification(errorNotification);
      
      throw error;
    }
  }

  /**
   * 出力先選択
   */
  async selectOutputPath(project) {
    const projectName = this.utils.sanitizeProjectName(project.name);
    const timestamp = this.utils.formatDateTime();
    const defaultName = `${projectName}-complete-package-${timestamp}.zip`;

    return await window.electronAPI.saveFileDialog({
      title: 'Export Complete Package',
      defaultPath: defaultName,
      filters: [
        { name: 'Complete ZIP Package', extensions: ['zip'] }
      ]
    });
  }

  /**
   * 完全パッケージデータ生成 (統合版 - 並列処理最適化)
   */
  async generateCompletePackage(project) {
    const packageData = {
      files: new Map(),
      totalSize: 0,
      metadata: {
        name: project.name || 'Spine Project',
        version: '2.0.0',
        created: new Date().toISOString(),
        generator: 'Spine Editor Desktop v2.0',
        homepage: project.homepageFolder || null,
        workflow: 'complete'
      }
    };

    try {
      console.log('📦 Starting integrated package generation with parallel processing...');

      // 🚀 Phase 1: 独立タスクを並列実行（パフォーマンス最適化）
      const [htmlContent, cssContent, spineLibraryResult] = await Promise.all([
        // HTML生成 (独立タスク)
        this.htmlExporter.generateHomepageIntegration(project)
          .catch(error => {
            console.warn('⚠️ HTML generation failed:', error);
            return null;
          }),
        
        // CSS生成 (独立タスク)  
        this.cssExporter.generateOptimizedCSS(project)
          .catch(error => {
            console.warn('⚠️ CSS generation failed:', error);
            return '/* CSS generation failed */';
          }),
        
        // Spineライブラリ読み込み (独立タスク)
        this.loadSpineLibraryAsync(packageData)
          .catch(error => {
            console.warn('⚠️ Spine library loading failed:', error);
            return false;
          })
      ]);

      // Phase 1結果を統合
      if (htmlContent) {
        packageData.files.set('index.html', htmlContent);
        console.log('✅ HTML content added');
      }
      
      packageData.files.set('spine-styles.css', cssContent);
      console.log('✅ CSS content added');

      // 🚀 Phase 2: Spineアセット収集とプロジェクト文書を並列実行
      const [spineAssetsResult, documentationResult] = await Promise.all([
        // Spineアセット収集
        this.spineExporter.includeCompleteSpineAssets(packageData, project)
          .catch(error => {
            console.warn('⚠️ Spine assets collection failed:', error);
            return false;
          }),
        
        // プロジェクト文書生成
        this.packageExporter.addProjectDocumentation(packageData, project)
          .catch(error => {
            console.warn('⚠️ Documentation generation failed:', error);
            return false;
          })
      ]);

      // 🚀 Phase 3: 最適化とバリデーションを並列実行（設定により）
      if (this.exportConfig.package.validateAssets) {
        const [optimizationResult, validationResult] = await Promise.all([
          // アセット最適化
          Promise.resolve().then(() => {
            this.spineExporter.optimizeAssets(packageData);
            return true;
          }).catch(error => {
            console.warn('⚠️ Asset optimization failed:', error);
            return false;
          }),
          
          // 整合性チェック
          Promise.resolve().then(() => {
            const validation = this.spineExporter.validateAssetIntegrity(packageData, project);
            if (!validation.valid) {
              console.warn('⚠️ Asset validation warnings:', validation.errors);
            }
            return validation;
          }).catch(error => {
            console.warn('⚠️ Asset validation failed:', error);
            return { valid: false, errors: [error.message] };
          })
        ]);
      }

      // ファイルサイズ計算（最後に実行）
      packageData.totalSize = this.utils.calculateTotalSize(packageData.files);

      console.log(`📦 Parallel package generation complete: ${packageData.files.size} files (${this.utils.formatFileSize(packageData.totalSize)})`);
      return packageData;

    } catch (error) {
      console.error('❌ Parallel package generation failed:', error);
      throw error;
    }
  }

  /**
   * Spineライブラリ非同期読み込み（並列処理用）
   */
  async loadSpineLibraryAsync(packageData) {
    try {
      await this.spineExporter.includeOptimizedSpineLibrary(packageData);
      console.log('✅ Spine library loaded');
      return true;
    } catch (error) {
      console.warn('⚠️ Spine library loading failed:', error);
      return false;
    }
  }

  /**
   * HTML生成 (HTML Module統合)
   */
  async generateHTML(project) {
    return await this.htmlExporter.generateHTML(project);
  }

  /**
   * CSS生成 (CSS Module統合)
   */
  async generateCSS(project) {
    return await this.cssExporter.generateCSS(project);
  }

  /**
   * JSON生成
   */
  async generateJSON(project) {
    const config = this.exportConfig.json;
    
    const exportData = {
      metadata: {
        name: project.name,
        version: project.version || '2.0.0',
        created: project.created,
        exported: new Date().toISOString(),
        generator: 'Spine Editor Desktop v2.0'
      },
      project: {
        settings: project.settings || {},
        spineData: project.spineData || {},
        viewport: {
          zoom: this.app.spine ? this.app.spine.currentZoom : 1.0,
          offset: this.app.spine ? this.app.spine.viewOffset : { x: 0, y: 0 }
        }
      }
    };

    return this.utils.formatJSON(exportData, !config.prettyPrint);
  }

  /**
   * エクスポート成功処理
   */
  async handleExportSuccess(filePath, packageData) {
    // 成功通知データ生成
    const notification = this.utils.createSuccessNotification(filePath, packageData);
    this.showNotification(notification);
    
    // 出力フォルダを開く
    if (window.electronAPI.openPath) {
      try {
        const pathModule = window.require('path');
        const dir = pathModule.dirname(filePath);
        await window.electronAPI.openPath(dir);
      } catch (error) {
        console.warn('⚠️ Failed to open output directory:', error);
      }
    }
  }

  /**
   * 通知表示
   */
  showNotification(notification) {
    console.log(`📢 ${notification.title}:`, notification.message);
    
    if (this.app.ui) {
      const icon = notification.type === 'success' ? '🎆' : '❌';
      const details = notification.details;
      
      let detailsHTML = '';
      if (details) {
        if (notification.type === 'success') {
          detailsHTML = `
            <p><strong>Files:</strong> ${details.files}</p>
            <p><strong>Size:</strong> ${details.size}</p>
            <p><strong>Time:</strong> ${details.timestamp}</p>
          `;
        } else {
          detailsHTML = `
            <p><strong>Error:</strong> ${details.error}</p>
            <p><strong>Context:</strong> ${details.context}</p>
            <p><strong>Time:</strong> ${details.timestamp}</p>
          `;
        }
      }

      this.app.ui.showModal(notification.title, `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">${icon}</div>
          <h3>${notification.title}</h3>
          <p>${notification.message}</p>
          ${detailsHTML}
        </div>
      `, notification.type);
    }
  }

  /**
   * プレビュー生成
   */
  async generatePreview(project) {
    const html = await this.htmlExporter.generateStandaloneHTML(project);
    return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  }

  /**
   * エクスポート形式設定
   */
  setExportFormats(formats) {
    this.exportFormats = formats.filter(f => 
      ['html', 'json', 'css'].includes(f)
    );
  }

  /**
   * エクスポート設定更新
   */
  updateExportConfig(format, config) {
    if (this.exportConfig[format]) {
      Object.assign(this.exportConfig[format], config);
      this.syncModuleConfigs(); // 設定を各モジュールに反映
    }
  }

  /**
   * 現在の設定取得
   */
  getExportConfig() {
    return this.utils.deepClone(this.exportConfig);
  }

  /**
   * デバッグ情報取得
   */
  getDebugInfo() {
    return {
      version: '2.0.0',
      module: 'export-manager',
      formats: this.exportFormats,
      config: this.exportConfig,
      modules: {
        css: this.cssExporter.getDebugInfo(),
        html: this.htmlExporter.getDebugInfo(),
        spine: this.spineExporter.getDebugInfo(),
        utils: this.utils.collectDebugInfo()
      },
      memory: this.utils.getMemoryInfo(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 統計情報取得
   */
  getStatistics() {
    return {
      moduleCount: 5,
      totalMethods: this.countMethods(),
      cacheSize: this.spineExporter.assetCache?.size || 0,
      lastExport: this.lastExportTime || null
    };
  }

  /**
   * メソッド数カウント（デバッグ用）
   */
  countMethods() {
    const modules = [this.cssExporter, this.packageExporter, this.htmlExporter, this.spineExporter, this.utils];
    return modules.reduce((count, module) => {
      return count + Object.getOwnPropertyNames(Object.getPrototypeOf(module)).length - 1;
    }, Object.getOwnPropertyNames(Object.getPrototypeOf(this)).length - 1);
  }

  /**
   * キャッシュクリア
   */
  clearCache() {
    this.spineExporter.clearCache();
    console.log('🗑️ Export Manager cache cleared');
  }

  /**
   * 破棄処理
   */
  destroy() {
    this.clearCache();
    console.log('🗑️ Export Manager destroyed');
  }
}

// グローバル公開
window.ExportManager = ExportManager;

// デフォルトエクスポート
export default ExportManager;