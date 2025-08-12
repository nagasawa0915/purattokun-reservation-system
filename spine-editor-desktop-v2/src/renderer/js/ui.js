/**
 * Spine Editor Desktop v2.0 - UI Manager
 * ユーザーインターフェース制御
 */

class UIManager {
  constructor(app) {
    this.app = app;
    this.currentTool = 'select';
    this.zoomLevel = 100;
    this.modalVisible = false;
    
    // UI要素参照
    this.elements = {};
    
    // イベントハンドラーマップ（最適化）
    this.handlers = new Map();
    this.cachedElements = new Map();
  }

  /**
   * UI初期化
   */
  async init() {
    console.log('🎨 Initializing UI Manager v2.0...');
    
    try {
      // DOM要素参照取得
      this.initElements();
      
      // イベントリスナー設定
      this.setupEventListeners();
      
      // 初期状態設定
      this.setupInitialState();
      
      console.log('✅ UI Manager initialized');
      
    } catch (error) {
      console.error('❌ UI Manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * DOM要素参照初期化（キャッシュ最適化）
   */
  initElements() {
    const criticalIds = [
      'btn-open-project', 'btn-save-project', 'btn-export-package',
      'spine-viewport', 'zoom-slider', 'zoom-value',
      'pos-x', 'pos-y', 'scale-x', 'scale-y',
      'modal-overlay', 'character-list'
    ];

    // 重要な要素のみ事前キャッシュ
    criticalIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        this.elements[id] = element;
        this.cachedElements.set(id, element);
      }
    });

    console.log(`⚙️ UI Elements cached: ${criticalIds.length} critical elements`);
  }

  /**
   * イベントリスナー設定
   */
  setupEventListeners() {
    // Header buttons
    this.addClickHandler('btn-open-project', () => this.app.openProject());
    this.addClickHandler('btn-save-project', () => this.app.saveProject());
    this.addClickHandler('btn-export-package', () => this.app.exportPackage());
    this.addClickHandler('btn-toggle-preview', () => this.togglePreview());
    this.addClickHandler('btn-settings', () => this.openSettings());

    // Toolbar
    this.addClickHandler('tool-select', () => this.selectTool('select'));
    this.addClickHandler('tool-move', () => this.selectTool('move'));
    this.addClickHandler('tool-scale', () => this.selectTool('scale'));
    this.addClickHandler('btn-reset-view', () => this.resetView());

    // Zoom slider
    if (this.elements['zoom-slider']) {
      this.elements['zoom-slider'].addEventListener('input', (e) => {
        this.setZoom(parseInt(e.target.value));
      });
    }

    // Inspector controls
    this.addChangeHandler('pos-x', (value) => this.updateProperty('posX', parseFloat(value)));
    this.addChangeHandler('pos-y', (value) => this.updateProperty('posY', parseFloat(value)));
    this.addChangeHandler('scale-x', (value) => this.updateProperty('scaleX', parseFloat(value)));
    this.addChangeHandler('scale-y', (value) => this.updateProperty('scaleY', parseFloat(value)));

    // Workflow integration controls
    this.addClickHandler('btn-import-character', () => this.importCharacter());
    this.addClickHandler('btn-generate-package', () => this.generatePackage());

    // Animation controls
    this.addChangeHandler('animation-select', (value) => this.selectAnimation(value));
    this.addClickHandler('btn-play', () => this.playAnimation());
    this.addClickHandler('btn-pause', () => this.pauseAnimation());
    this.addClickHandler('btn-stop', () => this.stopAnimation());

    // Modal controls
    this.addClickHandler('modal-close', () => this.hideModal());
    this.addClickHandler('modal-cancel', () => this.hideModal());
    this.addClickHandler('modal-confirm', () => this.confirmModal());

    // Viewport interactions
    if (this.elements['spine-viewport']) {
      this.setupViewportEvents();
    }

    console.log('🎯 UI event listeners set up');
  }

  /**
   * ビューポートイベント設定
   */
  setupViewportEvents() {
    const viewport = this.elements['spine-viewport'];
    
    // マウスイベント
    viewport.addEventListener('click', (e) => this.handleViewportClick(e));
    viewport.addEventListener('mousedown', (e) => this.handleViewportMouseDown(e));
    viewport.addEventListener('mousemove', (e) => this.handleViewportMouseMove(e));
    viewport.addEventListener('mouseup', (e) => this.handleViewportMouseUp(e));
    viewport.addEventListener('wheel', (e) => this.handleViewportWheel(e));

    // タッチイベント（モバイル対応・最適化）
    viewport.addEventListener('touchstart', (e) => this.handleViewportTouchStart(e), { passive: false });
    viewport.addEventListener('touchmove', (e) => this.handleViewportTouchMove(e), { passive: false });
    viewport.addEventListener('touchend', (e) => this.handleViewportTouchEnd(e), { passive: true });
  }

  /**
   * 初期状態設定
   */
  setupInitialState() {
    // ツール選択
    this.selectTool('select');
    
    // ズーム設定
    this.setZoom(100);
    
    // モーダル非表示
    this.hideModal();
    
    console.log('🎯 Initial UI state set');
  }

  /**
   * 最適化クリックハンドラー追加
   */
  addClickHandler(elementId, handler) {
    const element = this.getElementEfficiently(elementId);
    if (element) {
      element.addEventListener('click', handler, { passive: true });
      this.handlers.set(`${elementId}-click`, handler);
    }
  }

  /**
   * 最適化変更ハンドラー追加
   */
  addChangeHandler(elementId, handler) {
    const element = this.getElementEfficiently(elementId);
    if (element) {
      const wrappedHandler = (e) => handler(e.target.value);
      element.addEventListener('change', wrappedHandler, { passive: true });
      this.handlers.set(`${elementId}-change`, wrappedHandler);
    }
  }

  /**
   * 効率的な要素取得（キャッシュ活用）
   */
  getElementEfficiently(elementId) {
    if (this.cachedElements.has(elementId)) {
      return this.cachedElements.get(elementId);
    }
    
    const element = document.getElementById(elementId);
    if (element) {
      this.cachedElements.set(elementId, element);
      this.elements[elementId] = element;
    }
    return element;
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
      const btn = this.elements[`tool-${t}`];
      if (btn) {
        btn.classList.toggle('active', t === tool);
      }
    });

    // カーソル変更
    const viewport = this.elements['spine-viewport'];
    if (viewport) {
      viewport.className = `spine-viewport tool-${tool}`;
    }

    console.log(`🔧 Tool selected: ${tool}`);
  }

  /**
   * ズーム設定
   */
  setZoom(level) {
    this.zoomLevel = Math.max(25, Math.min(200, level));
    
    const slider = this.elements['zoom-slider'];
    const valueDisplay = this.elements['zoom-value'];
    
    if (slider) slider.value = this.zoomLevel;
    if (valueDisplay) valueDisplay.textContent = `${this.zoomLevel}%`;

    // Spineビューポートにズーム適用
    if (this.app.spine) {
      this.app.spine.setZoom(this.zoomLevel / 100);
    }
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
   * プレビュー切替
   */
  togglePreview() {
    // プレビューモードの実装
    console.log('👁️ Preview toggle (TODO: implement)');
  }

  /**
   * 設定を開く
   */
  openSettings() {
    this.showModal('Settings', 'Settings panel (TODO: implement)', 'info');
  }

  /**
   * キャラクターインポート (ワークフロー統合)
   */
  async importCharacter() {
    try {
      await this.app.importSpineCharacter();
      this.updateOutliner();
      this.setStatus('Character imported successfully');
    } catch (error) {
      this.setStatus('Character import failed', 'error');
      console.error('Character import error:', error);
    }
  }

  /**
   * パッケージ生成 (ワークフロー統合)
   */
  async generatePackage() {
    try {
      await this.app.generateFinalPackage();
      this.setStatus('Package generated successfully');
    } catch (error) {
      this.setStatus('Package generation failed', 'error');
      console.error('Package generation error:', error);
    }
  }

  /**
   * アウトライナーUI更新
   */
  updateOutliner() {
    const characterList = this.elements['character-list'];
    if (!characterList) return;
    
    characterList.innerHTML = '';
    
    if (!this.app.currentProject?.spineData?.characters) {
      characterList.innerHTML = '<div class="empty-state">🗂️ No characters loaded</div>';
      return;
    }
    
    this.app.currentProject.spineData.characters.forEach((char, index) => {
      const item = this.createCharacterItem(char, index);
      characterList.appendChild(item);
    });
  }

  /**
   * キャラクターアイテム作成
   */
  createCharacterItem(character, index) {
    const item = document.createElement('div');
    item.className = 'character-item';
    item.innerHTML = `
      <div class="character-header">
        <div class="character-icon">🦴</div>
        <div class="character-info">
          <div class="character-name">${character.name || 'Unnamed Character'}</div>
          <div class="character-details">Scale: ${(character.scaleX || 0.5).toFixed(2)}</div>
        </div>
        <div class="character-controls">
          <button class="btn btn-sm" onclick="app.selectCharacter(${index})">Select</button>
          <button class="btn btn-sm btn-danger" onclick="ui.removeCharacter(${index})">Remove</button>
        </div>
      </div>
      <div class="character-properties ${index === 0 ? 'expanded' : ''}">
        <div class="property-row">
          <label>Position</label>
          <input type="number" value="${character.x || 0}" 
                 onchange="ui.updateCharacterPosition(${index}, 'x', this.value)" step="0.1">
          <input type="number" value="${character.y || 0}" 
                 onchange="ui.updateCharacterPosition(${index}, 'y', this.value)" step="0.1">
        </div>
        <div class="property-row">
          <label>Scale</label>
          <input type="number" value="${character.scaleX || 0.5}" 
                 onchange="ui.updateCharacterScale(${index}, 'x', this.value)" 
                 min="0.1" max="2.0" step="0.1">
          <input type="number" value="${character.scaleY || 0.5}" 
                 onchange="ui.updateCharacterScale(${index}, 'y', this.value)" 
                 min="0.1" max="2.0" step="0.1">
        </div>
      </div>
    `;
    
    // Click to expand/collapse
    const header = item.querySelector('.character-header');
    header.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') {
        const properties = item.querySelector('.character-properties');
        properties.classList.toggle('expanded');
      }
    });
    
    return item;
  }

  /**
   * キャラクター位置更新
   */
  updateCharacterPosition(index, axis, value) {
    const character = this.app.currentProject?.spineData?.characters[index];
    if (!character) return;
    
    const numValue = parseFloat(value);
    if (axis === 'x') {
      character.x = numValue;
      if (this.app.spine) this.app.spine.updateCharacterPosition(numValue, character.y || 0);
    } else if (axis === 'y') {
      character.y = numValue;
      if (this.app.spine) this.app.spine.updateCharacterPosition(character.x || 0, numValue);
    }
    
    this.app.markProjectModified();
  }

  /**
   * キャラクタースケール更新
   */
  updateCharacterScale(index, axis, value) {
    const character = this.app.currentProject?.spineData?.characters[index];
    if (!character) return;
    
    const numValue = parseFloat(value);
    if (axis === 'x') {
      character.scaleX = numValue;
      if (this.app.spine) this.app.spine.updateCharacterScale(numValue, character.scaleY || 0.5);
    } else if (axis === 'y') {
      character.scaleY = numValue;
      if (this.app.spine) this.app.spine.updateCharacterScale(character.scaleX || 0.5, numValue);
    }
    
    this.app.markProjectModified();
    this.updateOutliner(); // UI更新
  }

  /**
   * キャラクター削除
   */
  removeCharacter(index) {
    if (!this.app.currentProject?.spineData?.characters) return;
    
    if (confirm('Remove this character?')) {
      this.app.currentProject.spineData.characters.splice(index, 1);
      this.app.markProjectModified();
      this.updateOutliner();
    }
  }

  /**
   * ステータス設定
   */
  setStatus(message, type = 'info') {
    this.app.setStatus(message, type);
  }

  /**
   * プロパティ更新 (改良版)
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
      this.app.spine.playAnimationSequence(); // v2.0 シーケンス再生
      this.setStatus('Animation playing: syutugen → taiki');
    }
  }

  /**
   * アニメーション一時停止
   */
  pauseAnimation() {
    if (this.app.selectedCharacter && this.app.spine) {
      this.app.spine.pauseAnimation(this.app.selectedCharacter);
      this.setStatus('Animation paused');
    }
  }

  /**
   * アニメーション停止
   */
  stopAnimation() {
    if (this.app.selectedCharacter && this.app.spine) {
      this.app.spine.stopAnimation(this.app.selectedCharacter);
      this.setStatus('Animation stopped');
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
    // ドラッグ開始処理
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
   * ビューポートホイール処理
   */
  handleViewportWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -10 : 10;
    this.setZoom(this.zoomLevel + delta);
  }

  /**
   * ビューポートタッチ開始処理
   */
  handleViewportTouchStart(e) {
    e.preventDefault();
    // タッチ開始処理
  }

  /**
   * ビューポートタッチ移動処理
   */
  handleViewportTouchMove(e) {
    e.preventDefault();
    // タッチ移動処理
  }

  /**
   * ビューポートタッチ終了処理
   */
  handleViewportTouchEnd(e) {
    // タッチ終了処理
  }

  /**
   * キャラクター選択
   */
  selectCharacter(character) {
    this.app.selectedCharacter = character;
    this.updateInspector(character);
    this.showSelectionHandles(character);
  }

  /**
   * 選択解除
   */
  clearSelection() {
    this.app.selectedCharacter = null;
    this.updateInspector(null);
    this.hideSelectionHandles();
  }

  /**
   * インスペクター更新
   */
  updateInspector(character) {
    const posX = this.elements['pos-x'];
    const posY = this.elements['pos-y'];
    const scaleX = this.elements['scale-x'];
    const scaleY = this.elements['scale-y'];
    const animSelect = this.elements['animation-select'];

    if (character) {
      if (posX) posX.value = character.x || 0;
      if (posY) posY.value = character.y || 0;
      if (scaleX) scaleX.value = character.scaleX || 1;
      if (scaleY) scaleY.value = character.scaleY || 1;
      
      // アニメーションリスト更新
      if (animSelect && character.animations) {
        animSelect.innerHTML = '<option value="">Select Animation</option>';
        character.animations.forEach(anim => {
          const option = document.createElement('option');
          option.value = anim.name;
          option.textContent = anim.name;
          animSelect.appendChild(option);
        });
      }
    } else {
      if (posX) posX.value = 0;
      if (posY) posY.value = 0;
      if (scaleX) scaleX.value = 1;
      if (scaleY) scaleY.value = 1;
      if (animSelect) animSelect.innerHTML = '<option value="">No character selected</option>';
    }
  }

  /**
   * 選択ハンドル表示
   */
  showSelectionHandles(character) {
    // 選択ハンドルの表示実装
  }

  /**
   * 選択ハンドル非表示
   */
  hideSelectionHandles() {
    const handles = this.elements['selection-handles'];
    if (handles) {
      handles.innerHTML = '';
    }
  }

  /**
   * モーダル表示
   */
  showModal(title, content, type = 'info') {
    const overlay = this.elements['modal-overlay'];
    const titleEl = this.elements['modal-title'];
    const bodyEl = this.elements['modal-body'];
    
    if (overlay && titleEl && bodyEl) {
      titleEl.textContent = title;
      bodyEl.innerHTML = content;
      overlay.classList.remove('hidden');
      this.modalVisible = true;
    }
  }

  /**
   * モーダル非表示
   */
  hideModal() {
    const overlay = this.elements['modal-overlay'];
    if (overlay) {
      overlay.classList.add('hidden');
      this.modalVisible = false;
    }
  }

  /**
   * モーダル確認
   */
  confirmModal() {
    // モーダル確認処理
    this.hideModal();
  }

  /**
   * モーダル表示状態確認
   */
  isModalVisible() {
    return this.modalVisible;
  }

  /**
   * フルスクリーンモード切替
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      this.setStatus('Fullscreen mode enabled');
    } else {
      document.exitFullscreen();
      this.setStatus('Fullscreen mode disabled');
    }
  }

  /**
   * ワークフロー状態更新
   */
  updateWorkflowState(phase) {
    const phases = ['import', 'display', 'edit', 'save', 'export'];
    
    phases.forEach((p, index) => {
      const indicator = document.querySelector(`[data-phase="${p}"]`);
      if (indicator) {
        indicator.classList.remove('active', 'completed');
        
        const currentIndex = phases.indexOf(phase);
        if (index < currentIndex) {
          indicator.classList.add('completed');
        } else if (index === currentIndex) {
          indicator.classList.add('active');
        }
      }
    });
  }

  /**
   * キーボードショートカットガイド表示
   */
  showShortcuts() {
    const shortcuts = [
      'Ctrl+O: Open Project',
      'Ctrl+S: Save Project', 
      'Ctrl+E: Export Package',
      'V: Select Tool',
      'M: Move Tool',
      'S: Scale Tool',
      'Space: Play Animation',
      'ESC: Clear Selection',
      'F11: Toggle Fullscreen'
    ];
    
    this.showModal('Keyboard Shortcuts', 
      '<ul>' + shortcuts.map(s => `<li>${s}</li>`).join('') + '</ul>',
      'info');
  }

  /**
   * プロジェクト統計表示
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
    
    this.showModal('Project Statistics', content, 'info');
  }

  /**
   * 破棄処理
   */
  destroy() {
    // イベントリスナー削除
    this.handlers.clear();
    
    // アウトライナークリア
    if (this.elements['character-list']) {
      this.elements['character-list'].innerHTML = '';
    }
    
    console.log('🗑️ UI Manager destroyed');
  }
}

// グローバル公開（他のスクリプトから利用可能）
window.UIManager = UIManager;