/**
 * Spine Editor Desktop v2.0 - UI Manager (Main Controller)
 * UI統合管理・各マネージャーの制御
 */

class UIManager {
  constructor(app) {
    this.app = app;
    
    // 分割されたUIマネージャー
    this.panels = null;
    this.menus = null;
    this.dialogs = null;
    
    // 統合状態管理
    this.isInitialized = false;
    this.currentTool = 'select';
    this.zoomLevel = 100;
  }

  /**
   * UI統合システム初期化
   */
  async init() {
    console.log('🎨 Initializing UI Manager v2.0 (Integrated System)...');
    
    try {
      // 各UIマネージャー初期化
      await this.initManagers();
      
      // 統合イベント設定
      this.setupIntegratedEvents();
      
      // 初期状態設定
      this.setupInitialState();
      
      this.isInitialized = true;
      console.log('✅ UI Manager (Integrated) initialized');
      
    } catch (error) {
      console.error('❌ UI Manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * 各UIマネージャー初期化
   */
  async initManagers() {
    // パネルマネージャー初期化
    this.panels = new UIPanelsManager(this.app, this);
    await this.panels.init();
    
    // メニューマネージャー初期化
    this.menus = new UIMenusManager(this.app, this);
    await this.menus.init();
    
    // ダイアログマネージャー初期化
    this.dialogs = new UIDialogsManager(this.app, this);
    await this.dialogs.init();
    
    console.log('🎛️ All UI managers initialized');
  }

  /**
   * 統合イベント設定
   */
  setupIntegratedEvents() {
    // ビューポート相互作用イベント
    this.setupViewportIntegration();
    
    // マネージャー間通信イベント
    this.setupManagerCommunication();
    
    // グローバルキーボードショートカット
    this.setupGlobalShortcuts();
    
    console.log('🎯 Integrated UI events set up');
  }

  /**
   * ビューポート統合設定
   */
  setupViewportIntegration() {
    const viewport = document.getElementById('spine-viewport');
    if (!viewport) return;
    
    // マウスイベント統合処理
    viewport.addEventListener('click', (e) => this.handleViewportClick(e));
    viewport.addEventListener('mousedown', (e) => this.handleViewportMouseDown(e));
    viewport.addEventListener('mousemove', (e) => this.handleViewportMouseMove(e));
    viewport.addEventListener('mouseup', (e) => this.handleViewportMouseUp(e));
    viewport.addEventListener('wheel', (e) => {
      if (this.menus) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -10 : 10;
        this.menus.setZoom(this.menus.zoomLevel + delta);
      }
    });

    // タッチイベント（モバイル対応）
    viewport.addEventListener('touchstart', (e) => this.handleViewportTouchStart(e), { passive: false });
    viewport.addEventListener('touchmove', (e) => this.handleViewportTouchMove(e), { passive: false });
    viewport.addEventListener('touchend', (e) => this.handleViewportTouchEnd(e), { passive: true });
  }

  /**
   * 初期状態設定
   */
  setupInitialState() {
    // ツール選択（メニューマネージャー経由）
    if (this.menus) {
      this.menus.selectTool('select');
      this.menus.setZoom(100);
    }
    
    // パネル初期レイアウト
    if (this.panels) {
      this.panels.switchLayout('default');
    }
    
    console.log('🎯 Integrated UI initial state set');
  }

  /**
   * マネージャー間通信設定
   */
  setupManagerCommunication() {
    // パネル-メニュー連携
    if (this.panels && this.menus) {
      // キャラクター選択時のインスペクター更新
      this.app.on('character-selected', (character) => {
        this.panels.updateInspector(character);
      });
      
      // ツール変更時のパネル状態更新
      this.app.on('tool-changed', (tool) => {
        this.currentTool = tool;
      });
    }
    
    // エラー・成功時のダイアログ表示連携
    if (this.dialogs) {
      this.app.on('show-notification', (message, type) => {
        this.dialogs.showNotification(message, type);
      });
    }
  }

  /**
   * グローバルショートカット設定
   */
  setupGlobalShortcuts() {
    // F1: ヘルプ
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        if (this.dialogs) {
          this.dialogs.showShortcuts();
        }
      }
    });
  }

  /**
   * ツール選択（メニューマネージャー経由）
   */
  selectTool(tool) {
    if (this.menus) {
      this.menus.selectTool(tool);
      this.currentTool = tool;
    }
  }

  /**
   * ズーム設定（メニューマネージャー経由）
   */
  setZoom(level) {
    if (this.menus) {
      this.menus.setZoom(level);
      this.zoomLevel = level;
    }
  }

  /**
   * ビューリセット（メニューマネージャー経由）
   */
  resetView() {
    if (this.menus) {
      this.menus.resetView();
    }
  }

  /**
   * プレビュー切替（メニューマネージャー経由）
   */
  togglePreview() {
    if (this.menus) {
      this.menus.togglePreview();
    }
  }

  /**
   * 設定を開く（ダイアログマネージャー経由）
   */
  openSettings() {
    if (this.dialogs) {
      this.dialogs.showSettings();
    }
  }

  /**
   * キャラクターインポート（メニューマネージャー経由）
   */
  async importCharacter() {
    if (this.menus) {
      await this.menus.importCharacter();
    }
  }

  /**
   * パッケージ生成（メニューマネージャー経由）
   */
  async generatePackage() {
    if (this.menus) {
      await this.menus.generatePackage();
    }
  }

  /**
   * アウトライナー更新（パネルマネージャー経由）
   */
  updateOutliner() {
    if (this.panels) {
      this.panels.updateOutliner();
    }
  }

  /**
   * キャラクター位置更新（パネルマネージャー経由）
   */
  updateCharacterPosition(index, axis, value) {
    if (this.panels) {
      this.panels.updateCharacterProperty(index, axis, parseFloat(value));
    }
  }

  /**
   * キャラクタースケール更新（パネルマネージャー経由）
   */
  updateCharacterScale(index, axis, value) {
    if (this.panels) {
      const property = axis === 'x' ? 'scaleX' : 'scaleY';
      this.panels.updateCharacterProperty(index, property, parseFloat(value));
    }
  }

  /**
   * キャラクター削除（パネルマネージャー経由）
   */
  removeCharacter(index) {
    if (this.panels) {
      this.panels.removeCharacter(index);
    }
  }

  /**
   * ステータス設定（ダイアログマネージャー経由）
   */
  setStatus(message, type = 'info') {
    if (this.dialogs) {
      this.dialogs.showNotification(message, type);
    } else {
      this.app.setStatus(message, type);
    }
  }

  /**
   * プロパティ更新（統合処理）
   */
  updateProperty(property, value) {
    if (this.app.selectedCharacter && this.app.spine) {
      this.app.spine.updateCharacterProperty(this.app.selectedCharacter, property, value);
      this.app.markProjectModified();
      
      // アウトライナーも更新
      this.updateOutliner();
    }
  }

  /**
   * アニメーション選択（メニューマネージャー経由）
   */
  selectAnimation(animationName) {
    if (this.menus) {
      this.menus.selectAnimation(animationName);
    }
  }

  /**
   * アニメーション再生（メニューマネージャー経由）
   */
  playAnimation() {
    if (this.menus) {
      this.menus.playAnimation();
    }
  }

  /**
   * アニメーション一時停止（メニューマネージャー経由）
   */
  pauseAnimation() {
    if (this.menus) {
      this.menus.pauseAnimation();
    }
  }

  /**
   * アニメーション停止（メニューマネージャー経由）
   */
  stopAnimation() {
    if (this.menus) {
      this.menus.stopAnimation();
    }
  }

  /**
   * ビューポートクリック処理
   */
  handleViewportClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (this.app.spine) {
      const character = this.app.spine.getCharacterAt(x, y);
      if (character) {
        this.selectCharacter(character);
      } else {
        this.clearSelection();
      }
    }
  }

  /**
   * ビューポートマウスダウン処理
   */
  handleViewportMouseDown(e) {
    // 現在のツールに応じた処理
    if (this.currentTool === 'move') {
      // ドラッグ開始処理
    }
  }

  /**
   * ビューポートマウス移動処理
   */
  handleViewportMouseMove(e) {
    // ドラッグ中の処理
  }

  /**
   * ビューポートマウスアップ処理
   */
  handleViewportMouseUp(e) {
    // ドラッグ終了処理
  }

  /**
   * ビューポートタッチ開始処理（モバイル対応）
   */
  handleViewportTouchStart(e) {
    e.preventDefault();
    // タッチ開始処理
  }

  /**
   * ビューポートタッチ移動処理（モバイル対応）
   */
  handleViewportTouchMove(e) {
    e.preventDefault();
    // タッチ移動処理
  }

  /**
   * ビューポートタッチ終了処理（モバイル対応）
   */
  handleViewportTouchEnd(e) {
    // タッチ終了処理
  }

  /**
   * キャラクター選択
   */
  selectCharacter(character) {
    this.app.selectedCharacter = character;
    if (this.panels) {
      this.panels.updateInspector(character);
    }
    this.showSelectionHandles(character);
  }

  /**
   * 選択解除
   */
  clearSelection() {
    this.app.selectedCharacter = null;
    if (this.panels) {
      this.panels.updateInspector(null);
    }
    this.hideSelectionHandles();
  }

  /**
   * インスペクター更新（パネルマネージャー経由）
   */
  updateInspector(character) {
    if (this.panels) {
      this.panels.updateInspector(character);
    }
  }

  /**
   * 選択ハンドル表示
   */
  showSelectionHandles(character) {
    // 選択ハンドルの表示実装（統合処理）
  }

  /**
   * 選択ハンドル非表示
   */
  hideSelectionHandles() {
    // 選択ハンドルの非表示実装（統合処理）
  }

  /**
   * モーダル表示（ダイアログマネージャー経由）
   */
  showModal(title, content, type = 'info') {
    if (this.dialogs) {
      this.dialogs.showAlert(title, content);
    }
  }

  /**
   * モーダル非表示（ダイアログマネージャー経由）
   */
  hideModal() {
    if (this.dialogs) {
      this.dialogs.closeTopDialog();
    }
  }

  /**
   * モーダル確認（ダイアログマネージャー経由）
   */
  confirmModal() {
    this.hideModal();
  }

  /**
   * モーダル表示状態確認（ダイアログマネージャー経由）
   */
  isModalVisible() {
    return this.dialogs ? this.dialogs.isModalVisible() : false;
  }

  /**
   * フルスクリーンモード切替（メニューマネージャー経由）
   */
  toggleFullscreen() {
    if (this.menus) {
      this.menus.toggleFullscreen();
    }
  }

  /**
   * ワークフロー状態更新（メニューマネージャー経由）
   */
  updateWorkflowState(phase) {
    if (this.menus) {
      this.menus.updateWorkflowIndicators();
    }
  }

  /**
   * キーボードショートカットガイド表示（ダイアログマネージャー経由）
   */
  showShortcuts() {
    if (this.dialogs) {
      this.dialogs.showShortcuts();
    }
  }

  /**
   * プロジェクト統計表示（ダイアログマネージャー経由）
   */
  showProjectStats() {
    if (!this.app.currentProject) {
      this.setStatus('No project loaded', 'warning');
      return;
    }
    
    const project = this.app.currentProject;
    const stats = {
      'Project Name': project.name || 'Untitled',
      'Created': project.created ? new Date(project.created).toLocaleDateString() : 'Unknown',
      'Characters': project.spineData?.characters?.length || 0,
      'Last Modified': project.lastModified ? new Date(project.lastModified).toLocaleString() : 'Never',
      'File Path': project.filePath || 'Not saved'
    };
    
    const content = Object.entries(stats)
      .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
      .join('');
    
    if (this.dialogs) {
      this.dialogs.showAlert('Project Statistics', content);
    }
  }

  /**
   * 破棄処理
   */
  destroy() {
    // 各マネージャー破棄
    if (this.panels) {
      this.panels.destroy();
      this.panels = null;
    }
    
    if (this.menus) {
      this.menus.destroy();
      this.menus = null;
    }
    
    if (this.dialogs) {
      this.dialogs.destroy();
      this.dialogs = null;
    }
    
    this.isInitialized = false;
    console.log('🗑️ UI Manager (Integrated) destroyed');
  }

  /**
   * 初期化状態確認
   */
  isReady() {
    return this.isInitialized && this.panels && this.menus && this.dialogs;
  }
}

// グローバル公開（他のスクリプトから利用可能）
window.UIManager = UIManager;