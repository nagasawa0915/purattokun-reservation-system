/**
 * Spine Editor Desktop v2.0 - UI Menus Manager
 * メニューシステム・ツールバー・ワークフロー統合
 */

class UIMenusManager {
  constructor(app, uiManager) {
    this.app = app;
    this.ui = uiManager;
    this.currentTool = 'select';
    this.zoomLevel = 100;
    
    // メニュー状態管理
    this.menuStates = {
      mainMenu: { active: false },
      contextMenu: { active: false, x: 0, y: 0 },
      toolbar: { compact: false }
    };
    
    // ショートカット管理
    this.shortcuts = new Map();
    this.setupShortcuts();
  }

  /**
   * メニューシステム初期化
   */
  init() {
    console.log('🎯 Initializing UI Menus Manager...');
    
    // メニューイベント設定
    this.setupMenuEvents();
    
    // ツールバーイベント設定
    this.setupToolbarEvents();
    
    // ワークフローイベント設定
    this.setupWorkflowEvents();
    
    // キーボードショートカット設定
    this.setupKeyboardShortcuts();
    
    // 初期ツール設定
    this.selectTool('select');
    
    console.log('✅ UI Menus Manager initialized');
  }

  /**
   * メニューイベント設定
   */
  setupMenuEvents() {
    // ヘッダーボタン
    this.addMenuHandler('btn-open-project', () => this.app.openProject());
    this.addMenuHandler('btn-save-project', () => this.app.saveProject());
    this.addMenuHandler('btn-export-package', () => this.app.exportPackage());
    this.addMenuHandler('btn-toggle-preview', () => this.togglePreview());
    this.addMenuHandler('btn-settings', () => this.openSettings());
    
    // SpineOutliner連携ボタン
    this.addMenuHandler('btn-load-spine-folder', () => this.loadSpineFolder());

    // メインメニュー
    this.setupMainMenu();
    
    // コンテキストメニュー
    this.setupContextMenu();
  }

  /**
   * ツールバーイベント設定
   */
  setupToolbarEvents() {
    // ツール選択
    this.addMenuHandler('tool-select', () => this.selectTool('select'));
    this.addMenuHandler('tool-move', () => this.selectTool('move'));
    this.addMenuHandler('tool-scale', () => this.selectTool('scale'));
    this.addMenuHandler('btn-reset-view', () => this.resetView());

    // ズーム制御
    const zoomSlider = document.getElementById('zoom-slider');
    if (zoomSlider) {
      zoomSlider.addEventListener('input', (e) => {
        this.setZoom(parseInt(e.target.value));
      });
    }

    // ズームボタン
    this.addMenuHandler('btn-zoom-in', () => this.setZoom(this.zoomLevel + 25));
    this.addMenuHandler('btn-zoom-out', () => this.setZoom(this.zoomLevel - 25));
    this.addMenuHandler('btn-zoom-fit', () => this.fitToView());
    this.addMenuHandler('btn-zoom-actual', () => this.setZoom(100));

    // 表示制御
    this.addMenuHandler('btn-toggle-grid', () => this.toggleGrid());
    this.addMenuHandler('btn-toggle-guides', () => this.toggleGuides());
    this.addMenuHandler('btn-toggle-rulers', () => this.toggleRulers());
  }

  /**
   * ワークフローイベント設定
   */
  setupWorkflowEvents() {
    // ワークフロー統合ボタン
    this.addMenuHandler('btn-import-character', () => this.importCharacter());
    this.addMenuHandler('btn-generate-package', () => this.generatePackage());
    
    // アニメーション制御
    this.addMenuHandler('btn-play', () => this.playAnimation());
    this.addMenuHandler('btn-pause', () => this.pauseAnimation());
    this.addMenuHandler('btn-stop', () => this.stopAnimation());
    this.addMenuHandler('btn-loop-toggle', () => this.toggleAnimationLoop());

    // アニメーション選択
    const animSelect = document.getElementById('animation-select');
    if (animSelect) {
      animSelect.addEventListener('change', (e) => {
        this.selectAnimation(e.target.value);
      });
    }

    // ワークフロー進行状況表示
    this.updateWorkflowIndicators();
  }

  /**
   * メニューハンドラー追加（最適化）
   */
  addMenuHandler(elementId, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener('click', handler, { passive: true });
    }
  }

  /**
   * メインメニュー設定
   */
  setupMainMenu() {
    const menuButton = document.getElementById('main-menu-button');
    const menu = document.getElementById('main-menu');
    
    if (menuButton && menu) {
      menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMainMenu();
      });

      // メニュー外クリックで閉じる
      document.addEventListener('click', () => {
        this.hideMainMenu();
      });

      menu.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  }

  /**
   * コンテキストメニュー設定
   */
  setupContextMenu() {
    const viewport = document.getElementById('spine-viewport');
    if (viewport) {
      viewport.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showContextMenu(e.clientX, e.clientY);
      });
    }

    // コンテキストメニュー項目イベント
    const contextMenu = document.getElementById('context-menu');
    if (contextMenu) {
      contextMenu.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (action) {
          this.handleContextMenuAction(action);
          this.hideContextMenu();
        }
      });
    }
  }

  /**
   * ショートカット設定
   */
  setupShortcuts() {
    this.shortcuts.set('ctrl+o', () => this.app.openProject());
    this.shortcuts.set('ctrl+s', () => this.app.saveProject());
    this.shortcuts.set('ctrl+e', () => this.app.exportPackage());
    this.shortcuts.set('v', () => this.selectTool('select'));
    this.shortcuts.set('m', () => this.selectTool('move'));
    this.shortcuts.set('s', () => this.selectTool('scale'));
    this.shortcuts.set('space', () => this.playAnimation());
    this.shortcuts.set('escape', () => this.clearSelection());
    this.shortcuts.set('f11', () => this.toggleFullscreen());
    this.shortcuts.set('ctrl+z', () => this.undo());
    this.shortcuts.set('ctrl+y', () => this.redo());
    this.shortcuts.set('ctrl+shift+z', () => this.redo());
    this.shortcuts.set('delete', () => this.deleteSelected());
    this.shortcuts.set('ctrl+d', () => this.duplicateSelected());
  }

  /**
   * キーボードショートカット設定
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const key = this.getShortcutKey(e);
      const handler = this.shortcuts.get(key);
      
      if (handler && !this.isInputFocused()) {
        e.preventDefault();
        handler();
      }
    });
  }

  /**
   * ショートカットキー取得
   */
  getShortcutKey(e) {
    let key = '';
    
    if (e.ctrlKey) key += 'ctrl+';
    if (e.shiftKey) key += 'shift+';
    if (e.altKey) key += 'alt+';
    
    key += e.key.toLowerCase();
    
    return key;
  }

  /**
   * 入力フィールドにフォーカスがあるかチェック
   */
  isInputFocused() {
    const active = document.activeElement;
    return active && (
      active.tagName === 'INPUT' || 
      active.tagName === 'TEXTAREA' ||
      active.contentEditable === 'true'
    );
  }

  /**
   * ツール選択
   */
  selectTool(tool) {
    const tools = ['select', 'move', 'scale'];
    
    if (!tools.includes(tool)) {
      console.warn(`⚠️ Invalid tool: ${tool}`);
      return;
    }

    this.currentTool = tool;

    // ツールボタンの状態更新
    tools.forEach(t => {
      const btn = document.getElementById(`tool-${t}`);
      if (btn) {
        btn.classList.toggle('active', t === tool);
      }
    });

    // カーソル変更
    const viewport = document.getElementById('spine-viewport');
    if (viewport) {
      viewport.className = `spine-viewport tool-${tool}`;
    }

    console.log(`🔧 Tool selected: ${tool}`);
  }

  /**
   * ズーム設定
   */
  setZoom(level) {
    this.zoomLevel = Math.max(25, Math.min(400, level));
    
    const slider = document.getElementById('zoom-slider');
    const valueDisplay = document.getElementById('zoom-value');
    
    if (slider) slider.value = this.zoomLevel;
    if (valueDisplay) valueDisplay.textContent = `${this.zoomLevel}%`;

    // Spineビューポートにズーム適用
    if (this.app.spine) {
      this.app.spine.setZoom(this.zoomLevel / 100);
    }

    console.log(`🔍 Zoom: ${this.zoomLevel}%`);
  }

  /**
   * ビューリセット
   */
  resetView() {
    this.setZoom(100);
    
    if (this.app.spine) {
      this.app.spine.resetView();
    }
    
    console.log('🎯 View reset');
  }

  /**
   * ビューに合わせる
   */
  fitToView() {
    if (this.app.spine) {
      this.app.spine.fitToView();
    }
    console.log('📐 Fit to view');
  }

  /**
   * グリッド切替
   */
  toggleGrid() {
    const viewport = document.getElementById('spine-viewport');
    if (viewport) {
      viewport.classList.toggle('show-grid');
    }
    console.log('🔲 Grid toggled');
  }

  /**
   * ガイド切替
   */
  toggleGuides() {
    const viewport = document.getElementById('spine-viewport');
    if (viewport) {
      viewport.classList.toggle('show-guides');
    }
    console.log('📏 Guides toggled');
  }

  /**
   * ルーラー切替
   */
  toggleRulers() {
    const viewport = document.getElementById('spine-viewport');
    if (viewport) {
      viewport.classList.toggle('show-rulers');
    }
    console.log('📐 Rulers toggled');
  }

  /**
   * プレビュー切替
   */
  togglePreview() {
    const previewMode = document.body.classList.toggle('preview-mode');
    console.log(`👁️ Preview mode: ${previewMode ? 'ON' : 'OFF'}`);
  }

  /**
   * 設定を開く
   */
  openSettings() {
    if (this.ui.dialogs) {
      this.ui.dialogs.showSettings();
    }
  }

  /**
   * メインメニュー切替
   */
  toggleMainMenu() {
    const menu = document.getElementById('main-menu');
    if (menu) {
      const isVisible = !menu.classList.contains('hidden');
      
      if (isVisible) {
        this.hideMainMenu();
      } else {
        this.showMainMenu();
      }
    }
  }

  /**
   * メインメニュー表示
   */
  showMainMenu() {
    const menu = document.getElementById('main-menu');
    if (menu) {
      menu.classList.remove('hidden');
      this.menuStates.mainMenu.active = true;
    }
  }

  /**
   * メインメニュー非表示
   */
  hideMainMenu() {
    const menu = document.getElementById('main-menu');
    if (menu) {
      menu.classList.add('hidden');
      this.menuStates.mainMenu.active = false;
    }
  }

  /**
   * コンテキストメニュー表示
   */
  showContextMenu(x, y) {
    const menu = document.getElementById('context-menu');
    if (menu) {
      menu.style.left = x + 'px';
      menu.style.top = y + 'px';
      menu.classList.remove('hidden');
      
      this.menuStates.contextMenu = { active: true, x, y };
    }
  }

  /**
   * コンテキストメニュー非表示
   */
  hideContextMenu() {
    const menu = document.getElementById('context-menu');
    if (menu) {
      menu.classList.add('hidden');
      this.menuStates.contextMenu.active = false;
    }
  }

  /**
   * コンテキストメニューアクション処理
   */
  handleContextMenuAction(action) {
    const actions = {
      'copy': () => this.copySelected(),
      'paste': () => this.pasteSelected(),
      'delete': () => this.deleteSelected(),
      'duplicate': () => this.duplicateSelected(),
      'reset-position': () => this.resetSelectedPosition(),
      'reset-scale': () => this.resetSelectedScale()
    };

    if (actions[action]) {
      actions[action]();
    }
  }

  /**
   * キャラクターインポート
   */
  async importCharacter() {
    try {
      await this.app.importSpineCharacter();
      if (this.ui.panels) {
        this.ui.panels.updateOutliner();
      }
      this.app.setStatus('Character imported successfully');
    } catch (error) {
      this.app.setStatus('Character import failed', 'error');
      console.error('Character import error:', error);
    }
  }

  /**
   * パッケージ生成
   */
  async generatePackage() {
    try {
      await this.app.generateFinalPackage();
      this.app.setStatus('Package generated successfully');
    } catch (error) {
      this.app.setStatus('Package generation failed', 'error');
      console.error('Package generation error:', error);
    }
  }

  /**
   * Spineフォルダ読み込み（SpineOutliner連携）
   */
  async loadSpineFolder() {
    try {
      this.app.utils.setStatus('Loading Spine folder...');
      
      // フォルダ選択ダイアログ
      const result = await window.electronAPI.openFileDialog({
        title: 'Select Spine Character Folder',
        message: 'Choose a folder containing Spine characters (.json, .atlas, .png files)',
        properties: ['openDirectory']
      });

      if (result.canceled || !result.filePaths.length) {
        this.app.utils.setStatus('Folder selection cancelled');
        return;
      }

      const folderPath = result.filePaths[0];
      
      // SpineOutlinerUIでフォルダ読み込み
      if (this.app.spineOutliner) {
        await this.app.spineOutliner.loadFolder(folderPath);
        this.app.utils.setStatus(`Spine folder loaded: ${folderPath}`);
        console.log('✅ Spine folder loaded via OutlinerUI:', folderPath);
      } else {
        // フォールバック: 従来の方法
        console.warn('⚠️ SpineOutlinerUI not available, using fallback');
        await this.app.fileManager.selectHomepageFolder();
      }
      
    } catch (error) {
      console.error('❌ Failed to load Spine folder:', error);
      this.app.utils.setStatus('Failed to load Spine folder', 'error');
      this.app.utils.showErrorModal('Spine Folder Error', error.message);
    }
  }

  /**
   * アニメーション選択
   */
  selectAnimation(animationName) {
    if (this.app.selectedCharacter && this.app.spine) {
      this.app.spine.selectAnimation(this.app.selectedCharacter, animationName);
    }
  }

  /**
   * アニメーション再生
   */
  playAnimation() {
    if (this.app.spine) {
      this.app.spine.playAnimationSequence();
      this.app.setStatus('Animation playing: syutugen → taiki');
    }
  }

  /**
   * アニメーション一時停止
   */
  pauseAnimation() {
    if (this.app.selectedCharacter && this.app.spine) {
      this.app.spine.pauseAnimation(this.app.selectedCharacter);
      this.app.setStatus('Animation paused');
    }
  }

  /**
   * アニメーション停止
   */
  stopAnimation() {
    if (this.app.selectedCharacter && this.app.spine) {
      this.app.spine.stopAnimation(this.app.selectedCharacter);
      this.app.setStatus('Animation stopped');
    }
  }

  /**
   * アニメーションループ切替
   */
  toggleAnimationLoop() {
    const loopButton = document.getElementById('btn-loop-toggle');
    if (loopButton && this.app.spine) {
      const isLooping = loopButton.classList.toggle('active');
      this.app.spine.setAnimationLoop(isLooping);
      console.log(`🔄 Animation loop: ${isLooping ? 'ON' : 'OFF'}`);
    }
  }

  /**
   * ワークフロー指示器更新
   */
  updateWorkflowIndicators() {
    const phases = ['import', 'display', 'edit', 'save', 'export'];
    const currentPhase = this.app.getCurrentWorkflowPhase();
    
    phases.forEach((phase, index) => {
      const indicator = document.querySelector(`[data-phase="${phase}"]`);
      if (indicator) {
        indicator.classList.remove('active', 'completed');
        
        const currentIndex = phases.indexOf(currentPhase);
        if (index < currentIndex) {
          indicator.classList.add('completed');
        } else if (index === currentIndex) {
          indicator.classList.add('active');
        }
      }
    });
  }

  /**
   * 選択解除
   */
  clearSelection() {
    this.app.selectedCharacter = null;
    if (this.ui.panels) {
      this.ui.panels.updateInspector(null);
    }
  }

  /**
   * フルスクリーン切替
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      this.app.setStatus('Fullscreen mode enabled');
    } else {
      document.exitFullscreen();
      this.app.setStatus('Fullscreen mode disabled');
    }
  }

  /**
   * 元に戻す
   */
  undo() {
    if (this.app.undoHistory && this.app.undoHistory.undo) {
      this.app.undoHistory.undo();
      console.log('↶ Undo');
    }
  }

  /**
   * やり直し
   */
  redo() {
    if (this.app.undoHistory && this.app.undoHistory.redo) {
      this.app.undoHistory.redo();
      console.log('↷ Redo');
    }
  }

  /**
   * 選択削除
   */
  deleteSelected() {
    if (this.app.selectedCharacter) {
      const index = this.app.getSelectedCharacterIndex();
      if (this.ui.panels) {
        this.ui.panels.removeCharacter(index);
      }
    }
  }

  /**
   * 選択複製
   */
  duplicateSelected() {
    if (this.app.selectedCharacter) {
      this.app.duplicateCharacter(this.app.selectedCharacter);
      console.log('📋 Character duplicated');
    }
  }

  /**
   * 選択コピー
   */
  copySelected() {
    if (this.app.selectedCharacter) {
      this.app.copyCharacterToClipboard(this.app.selectedCharacter);
      console.log('📋 Character copied');
    }
  }

  /**
   * 貼り付け
   */
  pasteSelected() {
    this.app.pasteCharacterFromClipboard();
    console.log('📋 Character pasted');
  }

  /**
   * 選択位置リセット
   */
  resetSelectedPosition() {
    if (this.app.selectedCharacter) {
      this.app.selectedCharacter.x = 0;
      this.app.selectedCharacter.y = 0;
      
      if (this.app.spine) {
        this.app.spine.updateCharacterPosition(0, 0);
      }
      
      if (this.ui.panels) {
        this.ui.panels.updateInspector(this.app.selectedCharacter);
      }
    }
  }

  /**
   * 選択スケールリセット
   */
  resetSelectedScale() {
    if (this.app.selectedCharacter) {
      this.app.selectedCharacter.scaleX = 1;
      this.app.selectedCharacter.scaleY = 1;
      
      if (this.app.spine) {
        this.app.spine.updateCharacterScale(1, 1);
      }
      
      if (this.ui.panels) {
        this.ui.panels.updateInspector(this.app.selectedCharacter);
      }
    }
  }

  /**
   * 破棄処理
   */
  destroy() {
    this.shortcuts.clear();
    this.menuStates = {
      mainMenu: { active: false },
      contextMenu: { active: false, x: 0, y: 0 },
      toolbar: { compact: false }
    };
    
    console.log('🗑️ UI Menus Manager destroyed');
  }
}

// エクスポート
window.UIMenusManager = UIMenusManager;