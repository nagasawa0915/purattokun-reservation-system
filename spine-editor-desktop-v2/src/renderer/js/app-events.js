/**
 * Spine Editor Desktop v2.0 - Event Handler Module
 * イベントハンドリング・キーボードショートカット・UI操作
 */

export class AppEventHandler {
  constructor(app) {
    this.app = app;
  }

  /**
   * イベントリスナー設定
   */
  setupEventListeners() {
    // ウィンドウイベント
    this.setupWindowEvents();
    
    // キーボードショートカット
    this.setupKeyboardEvents();
    
    // マウス座標追跡
    this.setupMouseTracking();
    
    // Electronメニューイベント
    this.setupElectronMenuEvents();

    console.log('✅ Event listeners set up');
  }

  /**
   * ウィンドウイベント設定
   */
  setupWindowEvents() {
    window.addEventListener('beforeunload', (e) => {
      if (this.app.isProjectModified) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    // ウィンドウリサイズ対応
    window.addEventListener('resize', () => {
      this.handleWindowResize();
    });

    // ウィンドウフォーカス
    window.addEventListener('focus', () => {
      this.handleWindowFocus();
    });

    window.addEventListener('blur', () => {
      this.handleWindowBlur();
    });
  }

  /**
   * キーボードイベント設定
   */
  setupKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });

    document.addEventListener('keyup', (e) => {
      this.handleKeyUp(e);
    });
  }

  /**
   * マウス座標追跡設定
   */
  setupMouseTracking() {
    // マウス座標追跡（軽量化）
    document.addEventListener('mousemove', (e) => {
      this.app.debug.mousePos.x = e.clientX;
      this.app.debug.mousePos.y = e.clientY;
    }, { passive: true });

    // マウスクリックイベント
    document.addEventListener('click', (e) => {
      this.handleGlobalClick(e);
    });

    // 右クリックコンテキストメニュー
    document.addEventListener('contextmenu', (e) => {
      this.handleContextMenu(e);
    });
  }

  /**
   * Electronメニューイベント設定
   */
  setupElectronMenuEvents() {
    if (window.electronAPI) {
      window.electronAPI.onMenuAction((event) => {
        this.handleMenuAction(event);
      });

      // ファイルドロップ対応
      document.addEventListener('drop', (e) => {
        e.preventDefault();
        this.handleFileDrop(e);
      });

      document.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
    }
  }

  /**
   * メニューアクション処理
   */
  handleMenuAction(event) {
    switch (event.type) {
      case 'menu-open-project':
        this.app.openProject();
        break;
      case 'menu-save-project':
        this.app.saveProject();
        break;
      case 'menu-export-package':
        this.app.exportPackage();
        break;
      case 'menu-new-project':
        this.handleNewProject();
        break;
      case 'menu-close-project':
        this.handleCloseProject();
        break;
      case 'menu-undo':
        this.handleUndo();
        break;
      case 'menu-redo':
        this.handleRedo();
        break;
      case 'menu-about':
        this.showAboutDialog();
        break;
      default:
        console.warn('Unknown menu action:', event.type);
    }
  }

  /**
   * キーボードショートカット処理
   */
  handleKeyDown(e) {
    // モーダル表示中は無視
    if (this.app.ui && this.app.ui.isModalVisible()) {
      return;
    }

    const ctrl = e.ctrlKey || e.metaKey;

    // ファイル操作
    if (this.handleFileShortcuts(e, ctrl)) return;
    
    // 編集操作
    if (this.handleEditShortcuts(e, ctrl)) return;
    
    // ツール選択
    if (this.handleToolShortcuts(e)) return;
    
    // ナビゲーション
    if (this.handleNavigationShortcuts(e, ctrl)) return;
  }

  /**
   * ファイル操作ショートカット
   */
  handleFileShortcuts(e, ctrl) {
    if (ctrl && e.key === 'n') {
      e.preventDefault();
      this.handleNewProject();
      return true;
    }
    
    if (ctrl && e.key === 'o') {
      e.preventDefault();
      this.app.openProject();
      return true;
    }
    
    if (ctrl && e.key === 's') {
      e.preventDefault();
      if (e.shiftKey) {
        this.handleSaveAs();
      } else {
        this.app.saveProject();
      }
      return true;
    }
    
    if (ctrl && e.key === 'e') {
      e.preventDefault();
      this.app.exportPackage();
      return true;
    }

    return false;
  }

  /**
   * 編集操作ショートカット
   */
  handleEditShortcuts(e, ctrl) {
    if (ctrl && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        this.handleRedo();
      } else {
        this.handleUndo();
      }
      return true;
    }
    
    if (ctrl && e.key === 'y') {
      e.preventDefault();
      this.handleRedo();
      return true;
    }
    
    if (ctrl && e.key === 'c') {
      e.preventDefault();
      this.handleCopy();
      return true;
    }
    
    if (ctrl && e.key === 'v') {
      e.preventDefault();
      this.handlePaste();
      return true;
    }
    
    if (ctrl && e.key === 'a') {
      e.preventDefault();
      this.handleSelectAll();
      return true;
    }

    return false;
  }

  /**
   * ツール選択ショートカット
   */
  handleToolShortcuts(e) {
    // V: 選択ツール
    if (e.key === 'v' || e.key === 'V') {
      this.app.ui && this.app.ui.selectTool('select');
      return true;
    }
    
    // M: 移動ツール
    if (e.key === 'm' || e.key === 'M') {
      this.app.ui && this.app.ui.selectTool('move');
      return true;
    }
    
    // S: スケールツール
    if (e.key === 's' || e.key === 'S') {
      this.app.ui && this.app.ui.selectTool('scale');
      return true;
    }
    
    // R: 回転ツール
    if (e.key === 'r' || e.key === 'R') {
      this.app.ui && this.app.ui.selectTool('rotate');
      return true;
    }

    return false;
  }

  /**
   * ナビゲーションショートカット
   */
  handleNavigationShortcuts(e, ctrl) {
    // ESC: 選択解除
    if (e.key === 'Escape') {
      this.app.spine && this.app.spine.clearSelection();
      return true;
    }
    
    // Delete: 削除
    if (e.key === 'Delete') {
      this.handleDelete();
      return true;
    }
    
    // F: フレーム表示
    if (e.key === 'f' || e.key === 'F') {
      this.handleFrameView();
      return true;
    }
    
    // Space: パン操作開始
    if (e.key === ' ') {
      e.preventDefault();
      this.startPanMode();
      return true;
    }

    return false;
  }

  /**
   * キーアップ処理
   */
  handleKeyUp(e) {
    // Space: パン操作終了
    if (e.key === ' ') {
      this.endPanMode();
    }
  }

  /**
   * ウィンドウリサイズ処理
   */
  handleWindowResize() {
    if (this.app.spine && this.app.spine.renderer) {
      // Spineレンダラーリサイズ
      this.app.spine.resizeRenderer();
    }

    // UI要素調整
    if (this.app.ui) {
      this.app.ui.handleResize();
    }
  }

  /**
   * ウィンドウフォーカス処理
   */
  handleWindowFocus() {
    // フォーカス時の自動リフレッシュ
    if (this.app.currentProject) {
      this.app.utils.updateProjectInfo();
    }
  }

  /**
   * ウィンドウブラー処理
   */
  handleWindowBlur() {
    // フォーカス外れ時の自動保存
    if (this.app.isProjectModified) {
      setTimeout(() => {
        this.app.saveProject();
      }, 500);
    }
  }

  /**
   * グローバルクリック処理
   */
  handleGlobalClick(e) {
    // モーダル外クリックでモーダル閉じる
    if (e.target.classList.contains('modal-overlay')) {
      if (this.app.ui) {
        this.app.ui.closeModal();
      }
    }
  }

  /**
   * コンテキストメニュー処理
   */
  handleContextMenu(e) {
    // Spine viewport内での右クリック
    if (e.target.closest('#spine-viewport')) {
      e.preventDefault();
      this.showSpineContextMenu(e);
    }
  }

  /**
   * ファイルドロップ処理
   */
  handleFileDrop(e) {
    const files = Array.from(e.dataTransfer.files);
    
    // Spineファイルの自動判定
    const spineFiles = files.filter(file => 
      file.name.endsWith('.json') || 
      file.name.endsWith('.atlas') || 
      file.name.endsWith('.skel')
    );

    if (spineFiles.length > 0) {
      this.handleSpineFileDrop(spineFiles);
    }
    
    // プロジェクトファイル
    const projectFiles = files.filter(file => 
      file.name.endsWith('.spine-project') ||
      file.name.endsWith('.json')
    );

    if (projectFiles.length > 0) {
      this.handleProjectFileDrop(projectFiles[0]);
    }
  }

  /**
   * 新規プロジェクト処理
   */
  handleNewProject() {
    if (this.app.isProjectModified) {
      // 保存確認ダイアログ
      this.showSaveConfirmation(() => {
        this.createNewProject();
      });
    } else {
      this.createNewProject();
    }
  }

  /**
   * プロジェクト終了処理
   */
  handleCloseProject() {
    if (this.app.isProjectModified) {
      this.showSaveConfirmation(() => {
        this.closeCurrentProject();
      });
    } else {
      this.closeCurrentProject();
    }
  }

  /**
   * 実装用プレースホルダーメソッド
   */
  handleSaveAs() {
    console.log('🔄 Save As - 実装待ち');
  }

  handleUndo() {
    console.log('🔄 Undo - 実装待ち');
  }

  handleRedo() {
    console.log('🔄 Redo - 実装待ち');
  }

  handleCopy() {
    console.log('🔄 Copy - 実装待ち');
  }

  handlePaste() {
    console.log('🔄 Paste - 実装待ち');
  }

  handleSelectAll() {
    console.log('🔄 Select All - 実装待ち');
  }

  handleDelete() {
    console.log('🔄 Delete - 実装待ち');
  }

  handleFrameView() {
    console.log('🔄 Frame View - 実装待ち');
  }

  startPanMode() {
    document.body.classList.add('pan-mode');
  }

  endPanMode() {
    document.body.classList.remove('pan-mode');
  }

  showSpineContextMenu(e) {
    console.log('🔄 Spine Context Menu - 実装待ち', e.clientX, e.clientY);
  }

  handleSpineFileDrop(files) {
    console.log('🔄 Spine File Drop - 実装待ち', files);
  }

  handleProjectFileDrop(file) {
    console.log('🔄 Project File Drop - 実装待ち', file);
  }

  showSaveConfirmation(callback) {
    if (this.app.ui) {
      this.app.ui.showConfirmModal(
        'Save Project',
        'Save changes before continuing?',
        callback
      );
    } else {
      if (confirm('Save changes before continuing?')) {
        callback();
      }
    }
  }

  createNewProject() {
    this.app.currentProject = null;
    this.app.isProjectModified = false;
    this.app.utils.updateProjectInfo();
    this.app.utils.setStatus('New project ready');
  }

  closeCurrentProject() {
    this.app.currentProject = null;
    this.app.isProjectModified = false;
    if (this.app.spine) {
      this.app.spine.clear();
    }
    this.app.utils.updateProjectInfo();
    this.app.utils.setStatus('Project closed');
  }

  showAboutDialog() {
    if (this.app.ui) {
      this.app.ui.showModal(
        'About Spine Editor Desktop',
        'Version 2.0.0\nA powerful Spine animation editor.',
        'info'
      );
    }
  }
}