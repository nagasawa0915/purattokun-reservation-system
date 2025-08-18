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
    
    // SpineOutlinerUI初期化
    await this.initSpineOutlinerUI();
  }

  /**
   * SpineOutlinerUI初期化
   */
  async initSpineOutlinerUI() {
    if (typeof SpineOutlinerUI === 'undefined') {
      console.warn('⚠️ SpineOutlinerUI not found, skipping initialization');
      return;
    }
    
    try {
      const container = document.getElementById('spine-outliner-container');
      if (!container) {
        throw new Error('spine-outliner-container element not found');
      }
      
      // SpineOutlinerUI インスタンス作成
      this.spineOutliner = new SpineOutlinerUI(container);
      
      // ドラッグ&ドロップイベントリスナー設定
      this.setupSpineOutlinerEvents();
      
      console.log('✅ SpineOutlinerUI initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize SpineOutlinerUI:', error);
      // 初期化失敗時は従来のアウトライナーを維持
    }
  }

  /**
   * SpineOutlinerUIイベント設定
   */
  setupSpineOutlinerEvents() {
    if (!this.spineOutliner) return;
    
    const spineStage = document.getElementById('spine-stage');
    if (!spineStage) {
      console.warn('⚠️ spine-stage element not found');
      return;
    }
    
    // ドラッグ&ドロップイベント設定
    spineStage.addEventListener('dragover', (e) => {
      e.preventDefault();
      spineStage.classList.add('drag-over');
    });
    
    spineStage.addEventListener('dragleave', (e) => {
      e.preventDefault();
      spineStage.classList.remove('drag-over');
    });
    
    spineStage.addEventListener('drop', (e) => {
      e.preventDefault();
      spineStage.classList.remove('drag-over');
      
      try {
        const spineData = JSON.parse(e.dataTransfer.getData('application/spine-character'));
        this.handleSpineCharacterDrop(spineData, e);
      } catch (error) {
        console.error('❌ Failed to handle Spine character drop:', error);
      }
    });
    
    console.log('✅ SpineOutlinerUI events configured');
  }

  /**
   * Spineキャラクタードロップ処理
   */
  async handleSpineCharacterDrop(spineData, dropEvent) {
    // SpinePreviewLayerを優先使用
    if (this.spinePreviewLayer) {
      try {
        // ドロップ位置計算
        const rect = dropEvent.currentTarget.getBoundingClientRect();
        const x = dropEvent.clientX - rect.left;
        const y = dropEvent.clientY - rect.top;
        
        console.log(`🎭 Adding character "${spineData.name}" at position (${x}, ${y})`);
        
        // SpinePreviewLayerでキャラクターを追加
        const result = await this.spinePreviewLayer.addCharacter(spineData, x, y);
        
        if (result.success) {
          // プロジェクト状態更新
          this.markProjectModified();
          this.utils.updateInspectorPanel();
          
          console.log('✅ Spine character dropped successfully:', spineData.name);
          this.utils.setStatus(`🎭 Character "${spineData.name}" added to scene (LIVE)`);
          return;
        } else {
          console.warn('⚠️ SpinePreviewLayer failed, trying fallback');
        }
        
      } catch (error) {
        console.error('❌ SpinePreviewLayer error:', error);
      }
    }
    
    // フォールバック: 従来システム
    if (!this.spine) {
      console.warn('⚠️ No Spine system available');
      this.utils.setStatus('Spine system not available', 'error');
      return;
    }
    
    try {
      // ドロップ位置計算
      const rect = dropEvent.currentTarget.getBoundingClientRect();
      const x = dropEvent.clientX - rect.left;
      const y = dropEvent.clientY - rect.top;
      
      // 従来システムでSpineキャラクターを配置
      await this.spine.loadCharacterAtPosition(spineData, x, y);
      
      // プロジェクト状態更新
      this.markProjectModified();
      this.utils.updateInspectorPanel();
      
      console.log('✅ Spine character dropped successfully (fallback):', spineData.name);
      this.utils.setStatus(`Character "${spineData.name}" added to scene`);
      
    } catch (error) {
      console.error('❌ Failed to drop Spine character:', error);
      this.utils.setStatus('Failed to add character to scene', 'error');
    }
  }

  /**
   * Spine初期化
   */
  async initSpine() {
    // SpinePreviewLayer初期化（シンプル版）
    await this.initSpinePreviewLayer();
    
    if (typeof SpineManager === 'undefined') {
      console.warn('⚠️ SpineManager not found, using SpinePreviewLayer only');
      return;
    }
    
    this.spine = new SpineManager(this);
    await this.spine.init();
    
    // v3移植: グローバル参照設定
    this.spine.setAsGlobalInstance();
    
    console.log('✅ Spine Manager (v3パターン) initialized');
  }

  /**
   * SpinePreviewLayer初期化（シンプル版）
   */
  async initSpinePreviewLayer() {
    // SpinePreviewLayerモジュールを動的インポート
    try {
      const { SpinePreviewLayer } = await import('../spine-preview-layer.js');
      
      const viewport = document.getElementById('spine-viewport');
      if (!viewport) {
        throw new Error('spine-viewport element not found');
      }
      
      // SpinePreviewLayer インスタンス作成（container渡し）
      this.spinePreviewLayer = new SpinePreviewLayer(viewport);
      
      // 初期化実行
      const success = await this.spinePreviewLayer.initialize();
      
      if (success) {
        console.log('✅ SpinePreviewLayer initialized');
        this.utils.setStatus('Spine preview layer ready');
      } else {
        throw new Error('SpinePreviewLayer initialization failed');
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize SpinePreviewLayer:', error);
      this.spinePreviewLayer = null;
      // 注記: SpineWebGLRenderer機能はspine-preview-layer.jsに統合済み
      console.log('✅ Spine機能は spine-preview-layer.js で提供されます');
    }
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