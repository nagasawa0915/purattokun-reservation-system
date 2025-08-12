/**
 * Spine Editor Desktop v2.0 - Main Application
 * メインアプリケーション制御
 */

class SpineEditorApp {
  constructor() {
    this.currentProject = null;
    this.isProjectModified = false;
    this.selectedCharacter = null;
    
    // モジュール参照
    this.ui = null;
    this.spine = null;
    this.exporter = null;
    
    // デバッグ情報（軽量化）
    this.debug = { mousePos: { x: 0, y: 0 } };
    
    this.init();
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
      
      // イベントリスナー設定
      this.setupEventListeners();
      
      // 軽量ステータス更新開始
      this.startLightweightStatusUpdate();
      
      console.log('✅ Spine Editor v2.0 ready');
      this.setStatus('Ready - Open a project to start');
      
    } catch (error) {
      console.error('❌ Failed to initialize Spine Editor:', error);
      this.setStatus('Initialization failed', 'error');
      this.showErrorModal('Initialization Error', error.message);
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
   * イベントリスナー設定
   */
  setupEventListeners() {
    // ウィンドウイベント
    window.addEventListener('beforeunload', (e) => {
      if (this.isProjectModified) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });

    // マウス座標追跡（軽量化）
    document.addEventListener('mousemove', (e) => {
      this.debug.mousePos.x = e.clientX;
      this.debug.mousePos.y = e.clientY;
    }, { passive: true });

    // Electronメニューイベント
    if (window.electronAPI) {
      window.electronAPI.onMenuAction((event) => {
        switch (event.type) {
          case 'menu-open-project':
            this.openProject();
            break;
          case 'menu-save-project':
            this.saveProject();
            break;
          case 'menu-export-package':
            this.exportPackage();
            break;
        }
      });
    }

    console.log('✅ Event listeners set up');
  }

  /**
   * キーボードショートカット処理
   */
  handleKeyDown(e) {
    // モーダル表示中は無視
    if (this.ui && this.ui.isModalVisible()) {
      return;
    }

    const ctrl = e.ctrlKey || e.metaKey;

    // Ctrl+O: プロジェクトを開く
    if (ctrl && e.key === 'o') {
      e.preventDefault();
      this.openProject();
    }
    
    // Ctrl+S: プロジェクトを保存
    else if (ctrl && e.key === 's') {
      e.preventDefault();
      this.saveProject();
    }
    
    // Ctrl+E: パッケージ出力
    else if (ctrl && e.key === 'e') {
      e.preventDefault();
      this.exportPackage();
    }
    
    // V: 選択ツール
    else if (e.key === 'v' || e.key === 'V') {
      this.ui && this.ui.selectTool('select');
    }
    
    // M: 移動ツール
    else if (e.key === 'm' || e.key === 'M') {
      this.ui && this.ui.selectTool('move');
    }
    
    // S: スケールツール
    else if (e.key === 's' || e.key === 'S') {
      this.ui && this.ui.selectTool('scale');
    }
    
    // ESC: 選択解除
    else if (e.key === 'Escape') {
      this.spine && this.spine.clearSelection();
    }
  }

  /**
   * ワークフロー統合: プロジェクト・Spineファイル選択
   */
  async openProject() {
    if (!window.electronAPI) {
      this.setStatus('File operations not available in browser', 'warning');
      return;
    }

    try {
      // Phase 1: Homepage/Projectフォルダ選択
      await this.selectHomepageFolder();
      
      // Phase 2: Spineキャラクター選択・読み込み
      await this.importSpineCharacter();
      
      // Phase 3: ワークフロー開始
      await this.executeWorkflow();
      
    } catch (error) {
      console.error('Error in project workflow:', error);
      this.setStatus('Workflow failed', 'error');
      this.showErrorModal('Workflow Error', error.message);
    }
  }

  /**
   * Homepage フォルダ選択
   */
  async selectHomepageFolder() {
    const result = await window.electronAPI.openFileDialog({
      title: 'Select Homepage Folder',
      properties: ['openDirectory']
    });

    if (result.canceled || !result.filePaths.length) {
      throw new Error('No homepage folder selected');
    }

    this.homepageFolder = result.filePaths[0];
    this.setStatus(`Homepage folder: ${this.homepageFolder}`);
    console.log('📁 Homepage folder selected:', this.homepageFolder);
  }

  /**
   * Spine キャラクター選択・インポート
   */
  async importSpineCharacter() {
    const result = await window.electronAPI.openFileDialog({
      title: 'Select Spine Character Files',
      filters: [
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
    
    if (!files.json || !files.atlas) {
      throw new Error('Both .json and .atlas files are required');
    }

    // Spine データ読み込み
    await this.loadSpineData(files);
    this.setStatus('Spine character imported successfully');
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
    if (!this.spine) {
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
    await this.spine.loadCharacter(characterData.atlasPath, characterData.jsonPath);
    
    // プロジェクトデータ更新
    this.currentProject = {
      name: 'New Spine Project',
      created: new Date().toISOString(),
      spineData: {
        characters: [characterData]
      }
    };

    this.isProjectModified = true;
    this.updateProjectInfo();
  }

  /**
   * プロジェクトファイル読み込み
   */
  async loadProjectFile(filePath) {
    this.setStatus('Loading project...', 'loading');
    
    try {
      const fileResult = await window.electronAPI.readFile(filePath);
      
      if (!fileResult.success) {
        throw new Error(fileResult.error);
      }

      const projectData = JSON.parse(fileResult.data);
      await this.loadProject(projectData, filePath);
      
      this.setStatus('Project loaded successfully');
      
    } catch (error) {
      console.error('Error loading project file:', error);
      this.setStatus('Failed to load project', 'error');
      throw error;
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
      
      this.setStatus('Workflow ready - Edit your character!');
      
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
    this.updateOutlinerUI();
    
    console.log('✅ Display Phase completed');
  }

  /**
   * Edit Phase: 編集機能有効化
   */
  enableEditPhase() {
    // ドラッグ&ドロップ有効化
    this.enableDragDrop();
    
    // プロパティパネル有効化
    this.updateInspectorPanel();
    
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
    this.updateProjectInfo();
    
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
   * プロジェクト保存
   */
  async saveProject() {
    if (!this.currentProject) {
      this.setStatus('No project to save', 'warning');
      return;
    }

    if (!window.electronAPI) {
      this.setStatus('File operations not available in browser', 'warning');
      return;
    }

    try {
      let filePath = this.currentProject.filePath;
      
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
      
    } catch (error) {
      console.error('Error saving project:', error);
      this.setStatus('Failed to save project', 'error');
      this.showErrorModal('Save Project Error', error.message);
    }
  }

  /**
   * プロジェクトファイル保存 (改良版)
   */
  async saveProjectFile(filePath) {
    this.setStatus('Saving project...', 'loading');
    
    try {
      // 現在のSpine状態を取得
      const spineData = this.spine ? this.spine.exportProject() : null;
      
      // プロジェクトデータ構築
      const projectData = {
        version: '2.0.0',
        name: this.currentProject.name || 'Untitled Project',
        created: this.currentProject.created || new Date().toISOString(),
        lastModified: new Date().toISOString(),
        homepageFolder: this.homepageFolder || null,
        spineData: spineData,
        settings: {
          viewport: this.ui ? {
            zoom: this.ui.zoomLevel,
            tool: this.ui.currentTool
          } : null
        }
      };

      const jsonData = JSON.stringify(projectData, null, 2);
      const saveResult = await window.electronAPI.writeFile(filePath, jsonData);
      
      if (!saveResult.success) {
        throw new Error(saveResult.error);
      }

      this.currentProject.filePath = filePath;
      this.currentProject.lastModified = projectData.lastModified;
      this.isProjectModified = false;
      
      this.updateProjectInfo();
      this.setStatus('Project saved successfully');
      console.log('💾 Project saved:', filePath);
      
    } catch (error) {
      console.error('Error saving project file:', error);
      this.setStatus('Failed to save project', 'error');
      throw error;
    }
  }

  /**
   * パッケージ出力
   */
  async exportPackage() {
    if (!this.currentProject) {
      this.setStatus('No project to export', 'warning');
      return;
    }

    try {
      await this.exporter.exportPackage(this.currentProject);
      this.setStatus('Package exported successfully');
      
    } catch (error) {
      console.error('Error exporting package:', error);
      this.setStatus('Failed to export package', 'error');
      this.showErrorModal('Export Error', error.message);
    }
  }

  /**
   * プロジェクト情報更新
   */
  updateProjectInfo() {
    const nameEl = document.getElementById('project-name');
    const statusEl = document.getElementById('project-status');
    
    if (nameEl && statusEl) {
      if (this.currentProject) {
        nameEl.textContent = this.currentProject.name || 'Untitled Project';
        statusEl.className = 'status-indicator active';
        statusEl.title = `Modified: ${this.isProjectModified ? 'Yes' : 'No'}`;
      } else {
        nameEl.textContent = 'No Project';
        statusEl.className = 'status-indicator';
        statusEl.title = 'No project loaded';
      }
    }

    // ボタンの有効/無効切り替え
    const saveBtn = document.getElementById('btn-save-project');
    const exportBtn = document.getElementById('btn-export-package');
    
    if (saveBtn) saveBtn.disabled = !this.currentProject;
    if (exportBtn) exportBtn.disabled = !this.currentProject;
  }

  /**
   * ステータス更新
   */
  setStatus(message, type = 'info') {
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `status-${type}`;
    }
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  /**
   * エラーモーダル表示
   */
  showErrorModal(title, message) {
    if (this.ui) {
      this.ui.showModal(title, message, 'error');
    } else {
      alert(`${title}: ${message}`);
    }
  }

  /**
   * 軽量ステータス更新開始
   */
  startLightweightStatusUpdate() {
    // 3秒間隔で軽量更新
    setInterval(() => {
      this.updateEssentialStatus();
    }, 3000);
  }

  /**
   * 必要最小限のステータス更新
   */
  updateEssentialStatus() {
    const coordsEl = document.getElementById('mouse-coords');
    if (coordsEl) {
      coordsEl.textContent = `Mouse: (${this.debug.mousePos.x}, ${this.debug.mousePos.y})`;
    }

    // 簡易メモリ使用量（利用可能な場合のみ）
    if (performance.memory) {
      const memoryEl = document.getElementById('memory-usage');
      if (memoryEl) {
        const mb = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        memoryEl.textContent = `Memory: ${mb}MB`;
      }
    }
  }

  /**
   * アウトライナーUI更新
   */
  updateOutlinerUI() {
    const characterList = document.getElementById('character-list');
    if (!characterList || !this.currentProject?.spineData?.characters) return;
    
    characterList.innerHTML = '';
    
    this.currentProject.spineData.characters.forEach((char, index) => {
      const item = document.createElement('div');
      item.className = 'character-item';
      item.innerHTML = `
        <div class="character-icon">🦴</div>
        <div class="character-name">${char.name}</div>
        <div class="character-controls">
          <button onclick="app.selectCharacter(${index})">Select</button>
        </div>
      `;
      characterList.appendChild(item);
    });
  }

  /**
   * インスペクターパネル更新
   */
  updateInspectorPanel() {
    if (!this.spine || !this.spine.skeleton) return;
    
    const posX = document.getElementById('pos-x');
    const posY = document.getElementById('pos-y');
    const scaleX = document.getElementById('scale-x');
    const scaleY = document.getElementById('scale-y');
    
    if (posX) posX.value = this.spine.skeleton.x;
    if (posY) posY.value = this.spine.skeleton.y;
    if (scaleX) scaleX.value = this.spine.skeleton.scaleX;
    if (scaleY) scaleY.value = this.spine.skeleton.scaleY;
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
      this.updateInspectorPanel();
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
    this.updateInspectorPanel();
    
    console.log('🎯 Character selected:', this.selectedCharacter.name);
  }

  /**
   * プロジェクト変更マーク
   */
  markProjectModified() {
    if (this.currentProject && !this.isProjectModified) {
      this.isProjectModified = true;
      this.updateProjectInfo();
    }
  }

  /**
   * 最終パッケージ生成
   */
  async generateFinalPackage() {
    if (!this.currentProject || !this.homepageFolder) {
      this.setStatus('Project and homepage folder required', 'warning');
      return;
    }
    
    try {
      // Export Manager でパッケージ生成
      await this.exporter.exportPackage(this.currentProject);
      
      // Homepage統合処理
      await this.integrateWithHomepage();
      
      this.setStatus('Final package generated successfully');
      
    } catch (error) {
      console.error('❌ Final package generation failed:', error);
      this.setStatus('Package generation failed', 'error');
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
    // 実際の統合処理はここで実装
  }

  /**
   * Spine設定生成
   */
  generateSpineConfig() {
    if (!this.spine?.skeleton) return null;
    
    return {
      x: this.spine.skeleton.x,
      y: this.spine.skeleton.y,
      scaleX: this.spine.skeleton.scaleX,
      scaleY: this.spine.skeleton.scaleY
    };
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
    
    console.log('🔚 Spine Editor v2.0 destroyed');
  }
}

// アプリケーション起動
let app;

document.addEventListener('DOMContentLoaded', () => {
  app = new SpineEditorApp();
});

window.addEventListener('beforeunload', () => {
  if (app) {
    app.destroy();
  }
});