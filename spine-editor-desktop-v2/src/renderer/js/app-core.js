/**
 * Spine Editor Desktop v2.0 - Core Application Module
 * コアアプリケーション制御・初期化・ワークフロー
 */

import { AppEventHandler } from './app-events.js';
import { AppFileManager } from './app-file.js';
import { AppUtils } from './app-utils.js';

export class SpineEditorCore {
  constructor() {
    this.currentProject = null;
    this.isProjectModified = false;
    this.selectedCharacter = null;
    
    // モジュール参照
    this.ui = null;
    this.spine = null;
    this.exporter = null;
    
    // 内部モジュール
    this.eventHandler = new AppEventHandler(this);
    this.fileManager = new AppFileManager(this);
    this.utils = new AppUtils(this);
    
    // デバッグ情報（軽量化）
    this.debug = { mousePos: { x: 0, y: 0 } };
    
    // 自動保存インターバル
    this.autoSaveInterval = null;
  }

  /**
   * アプリケーション初期化
   */
  async init() {
    console.log('🚀 Spine Editor v2.0 initializing...');
    
    try {
      // UI初期化
      await this.initUI();
      
      // Spineシステム初期化
      await this.initSpine();
      
      // エクスポートシステム初期化
      await this.initExport();
      
      // イベントリスナー設定（EventHandlerに移譲）
      this.eventHandler.setupEventListeners();
      
      // 軽量ステータス更新開始
      this.utils.startLightweightStatusUpdate();
      
      console.log('✅ Spine Editor v2.0 ready');
      this.utils.setStatus('Ready - Open a project to start');
      
    } catch (error) {
      console.error('❌ Failed to initialize Spine Editor:', error);
      this.utils.setStatus('Initialization failed', 'error');
      this.utils.showErrorModal('Initialization Error', error.message);
    }
  }

  /**
   * UI初期化
   */
  async initUI() {
    if (typeof UIManager === 'undefined') {
      throw new Error('UIManager not found');
    }
    
    this.ui = new UIManager(this);
    await this.ui.init();
    console.log('✅ UI Manager initialized');
  }

  /**
   * Spine初期化
   */
  async initSpine() {
    if (typeof SpineManager === 'undefined') {
      throw new Error('SpineManager not found');
    }
    
    this.spine = new SpineManager(this);
    await this.spine.init();
    console.log('✅ Spine Manager initialized');
  }

  /**
   * エクスポート初期化
   */
  async initExport() {
    if (typeof ExportManager === 'undefined') {
      throw new Error('ExportManager not found');
    }
    
    this.exporter = new ExportManager(this);
    await this.exporter.init();
    console.log('✅ Export Manager initialized');
  }

  /**
   * ワークフロー統合: プロジェクト・Spineファイル選択
   */
  async openProject() {
    if (!window.electronAPI) {
      this.utils.setStatus('File operations not available in browser', 'warning');
      return;
    }

    try {
      // Phase 1: Homepage/Projectフォルダ選択
      await this.fileManager.selectHomepageFolder();
      
      // Phase 2: Spineキャラクターは自動検索済み（selectHomepageFolder内で実行）
      // await this.importSpineCharacter(); // 自動検索により不要
      
      // Phase 3: ワークフロー開始
      await this.executeWorkflow();
      
    } catch (error) {
      console.error('Error in project workflow:', error);
      this.utils.setStatus('Workflow failed', 'error');
      this.utils.showErrorModal('Workflow Error', error.message);
    }
  }

  /**
   * プロジェクト保存
   */
  async saveProject() {
    if (!this.currentProject) {
      this.utils.setStatus('No project to save', 'warning');
      return;
    }

    if (!window.electronAPI) {
      this.utils.setStatus('File operations not available in browser', 'warning');
      return;
    }

    try {
      await this.fileManager.saveProject();
    } catch (error) {
      console.error('Error saving project:', error);
      this.utils.setStatus('Failed to save project', 'error');
      this.utils.showErrorModal('Save Project Error', error.message);
    }
  }

  /**
   * パッケージ出力
   */
  async exportPackage() {
    if (!this.currentProject) {
      this.utils.setStatus('No project to export', 'warning');
      return;
    }

    try {
      await this.exporter.exportPackage(this.currentProject);
      this.utils.setStatus('Package exported successfully');
      
    } catch (error) {
      console.error('Error exporting package:', error);
      this.utils.setStatus('Failed to export package', 'error');
      this.utils.showErrorModal('Export Error', error.message);
    }
  }

  /**
   * 完全ワークフロー実行: Import→Display→Edit→Save→Export
   */
  async executeWorkflow() {
    try {
      // Display Phase: キャラクター表示
      await this.displayPhase();
      
      // Edit Phase: 編集機能有効化
      this.enableEditPhase();
      
      // Auto Save Phase: 自動保存有効化
      this.enableAutoSave();
      
      this.utils.setStatus('Workflow ready - Edit your character!');
      
    } catch (error) {
      console.error('❌ Workflow execution failed:', error);
      throw error;
    }
  }

  /**
   * Display Phase: Spine キャラクター表示
   */
  async displayPhase() {
    const viewport = document.getElementById('spine-viewport');
    if (!viewport) {
      throw new Error('Viewport element not found');
    }

    // Canvas をビューポートに追加
    this.spine.attachToViewport(viewport);
    
    // アニメーションシーケンス開始
    this.spine.playAnimationSequence(); // syutugen → taiki
    
    // アウトライナーUI更新
    this.utils.updateOutlinerUI();
    
    console.log('✅ Display Phase completed');
  }

  /**
   * Edit Phase: 編集機能有効化
   */
  enableEditPhase() {
    // ドラッグ&ドロップ有効化
    this.enableDragDrop();
    
    // プロパティパネル有効化
    this.utils.updateInspectorPanel();
    
    // 編集ツール有効化
    if (this.ui) {
      this.ui.selectTool('move');
    }
    
    console.log('✅ Edit Phase enabled');
  }

  /**
   * Auto Save Phase: 自動保存有効化
   */
  enableAutoSave() {
    // 30秒ごとの自動保存
    this.autoSaveInterval = setInterval(() => {
      if (this.isProjectModified) {
        this.saveProject();
      }
    }, 30000);
    
    console.log('✅ Auto Save enabled (30s interval)');
  }

  /**
   * ドラッグ&ドロップ有効化
   */
  enableDragDrop() {
    const viewport = document.getElementById('spine-viewport');
    if (!viewport) return;
    
    let isDragging = false;
    let startPos = { x: 0, y: 0 };
    
    viewport.addEventListener('mousedown', (e) => {
      isDragging = true;
      startPos.x = e.clientX;
      startPos.y = e.clientY;
    });
    
    viewport.addEventListener('mousemove', (e) => {
      if (!isDragging || !this.spine) return;
      
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;
      
      this.spine.updateCharacterPosition(
        this.spine.skeleton.x + deltaX * 0.5,
        this.spine.skeleton.y + deltaY * 0.5
      );
      
      startPos.x = e.clientX;
      startPos.y = e.clientY;
      
      this.markProjectModified();
      this.utils.updateInspectorPanel();
    });
    
    viewport.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    console.log('✅ Drag & Drop enabled');
  }

  /**
   * キャラクター選択
   */
  selectCharacter(index) {
    if (!this.currentProject?.spineData?.characters[index]) return;
    
    this.selectedCharacter = this.currentProject.spineData.characters[index];
    this.utils.updateInspectorPanel();
    
    console.log('🎯 Character selected:', this.selectedCharacter.name);
  }

  /**
   * プロジェクト変更マーク
   */
  markProjectModified() {
    if (this.currentProject && !this.isProjectModified) {
      this.isProjectModified = true;
      this.utils.updateProjectInfo();
    }
  }

  /**
   * プロジェクト読み込み (改良版)
   */
  async loadProject(projectData, filePath = null) {
    this.currentProject = {
      ...projectData,
      filePath,
      lastModified: new Date().toISOString()
    };
    
    this.isProjectModified = false;
    
    // UI更新
    this.utils.updateProjectInfo();
    
    // Spine データ読み込み
    if (this.spine && projectData.spineData) {
      await this.spine.loadProject(projectData.spineData);
      
      // Display Phase実行
      await this.displayPhase();
      
      // Edit Phase有効化
      this.enableEditPhase();
    }
    
    console.log('📁 Project loaded:', this.currentProject);
  }

  /**
   * 破棄処理
   */
  destroy() {
    // Auto Save停止
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    if (window.electronAPI) {
      window.electronAPI.removeMenuListeners();
    }
    
    if (this.spine) {
      this.spine.dispose();
    }
    
    if (this.ui) {
      this.ui.destroy();
    }
    
    console.log('🔚 Spine Editor v2.0 Core destroyed');
  }
}