/**
 * Spine Editor Desktop v2.0 - UI Panels Manager
 * パネル管理・レイアウト制御・アウトライナー機能
 */

class UIPanelsManager {
  constructor(app, uiManager) {
    this.app = app;
    this.ui = uiManager;
    
    // パネル状態管理
    this.panelStates = {
      outliner: { visible: true, expanded: true },
      inspector: { visible: true, expanded: true },
      layers: { visible: true, expanded: true },
      preview: { visible: true, expanded: true }
    };
    
    // 要素キャッシュ
    this.elements = new Map();
    
    // ドラッグ＆ドロップ状態
    this.dragState = {
      active: false,
      element: null,
      startX: 0,
      startY: 0
    };
  }

  /**
   * パネルシステム初期化
   */
  init() {
    console.log('🎛️ Initializing UI Panels Manager...');
    
    // パネル要素取得
    this.initPanelElements();
    
    // パネルイベント設定
    this.setupPanelEvents();
    
    // 初期レイアウト設定
    this.setupInitialLayout();
    
    console.log('✅ UI Panels Manager initialized');
  }

  /**
   * パネル要素初期化
   */
  initPanelElements() {
    const panelIds = [
      'outliner-panel', 'inspector-panel', 'layers-panel', 'preview-panel',
      'character-list', 'pos-x', 'pos-y', 'scale-x', 'scale-y',
      'animation-select', 'layer-list', 'spine-viewport'
    ];

    panelIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        this.elements.set(id, element);
      }
    });
  }

  /**
   * パネルイベント設定
   */
  setupPanelEvents() {
    // パネルの折りたたみ/展開
    this.setupToggleEvents();
    
    // パネルリサイズ
    this.setupResizeEvents();
    
    // ドラッグ&ドロップ
    this.setupDragDropEvents();
    
    // レイアウト切替
    this.setupLayoutEvents();
  }

  /**
   * パネル折りたたみイベント設定
   */
  setupToggleEvents() {
    Object.keys(this.panelStates).forEach(panelName => {
      const toggleButton = document.querySelector(`[data-panel-toggle="${panelName}"]`);
      const panel = this.elements.get(`${panelName}-panel`);
      
      if (toggleButton && panel) {
        toggleButton.addEventListener('click', () => {
          this.togglePanel(panelName);
        });
      }
    });
  }

  /**
   * パネルリサイズイベント設定
   */
  setupResizeEvents() {
    const resizeHandles = document.querySelectorAll('.panel-resize-handle');
    
    resizeHandles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        this.startPanelResize(e, handle);
      });
    });
  }

  /**
   * ドラッグ&ドロップイベント設定
   */
  setupDragDropEvents() {
    // パネルヘッダーのドラッグ
    const panelHeaders = document.querySelectorAll('.panel-header');
    
    panelHeaders.forEach(header => {
      header.addEventListener('mousedown', (e) => {
        if (!e.target.classList.contains('panel-toggle')) {
          this.startPanelDrag(e, header);
        }
      });
    });

    // レイヤーリストのドラッグ&ドロップ
    this.setupLayerDragDrop();
  }

  /**
   * レイアウト切替イベント設定
   */
  setupLayoutEvents() {
    const layoutButtons = document.querySelectorAll('[data-layout]');
    
    layoutButtons.forEach(button => {
      button.addEventListener('click', () => {
        const layoutName = button.dataset.layout;
        this.switchLayout(layoutName);
      });
    });
  }

  /**
   * 初期レイアウト設定
   */
  setupInitialLayout() {
    // デフォルトの4パネルレイアウト
    this.switchLayout('default');
    
    // パネル初期状態設定
    Object.keys(this.panelStates).forEach(panelName => {
      const state = this.panelStates[panelName];
      this.setPanelVisibility(panelName, state.visible);
      this.setPanelExpanded(panelName, state.expanded);
    });
  }

  /**
   * パネル切替
   */
  togglePanel(panelName) {
    const state = this.panelStates[panelName];
    if (!state) return;

    state.expanded = !state.expanded;
    this.setPanelExpanded(panelName, state.expanded);
    
    console.log(`🎛️ Panel ${panelName}: ${state.expanded ? 'expanded' : 'collapsed'}`);
  }

  /**
   * パネル表示/非表示設定
   */
  setPanelVisibility(panelName, visible) {
    const panel = this.elements.get(`${panelName}-panel`);
    if (!panel) return;

    panel.style.display = visible ? 'block' : 'none';
    this.panelStates[panelName].visible = visible;
  }

  /**
   * パネル展開/折りたたみ設定
   */
  setPanelExpanded(panelName, expanded) {
    const panel = this.elements.get(`${panelName}-panel`);
    if (!panel) return;

    panel.classList.toggle('collapsed', !expanded);
    this.panelStates[panelName].expanded = expanded;
  }

  /**
   * レイアウト切替
   */
  switchLayout(layoutName) {
    const layouts = {
      default: this.getDefaultLayout(),
      minimal: this.getMinimalLayout(),
      fullscreen: this.getFullscreenLayout(),
      mobile: this.getMobileLayout()
    };

    const layout = layouts[layoutName];
    if (!layout) {
      console.warn(`⚠️ Unknown layout: ${layoutName}`);
      return;
    }

    this.applyLayout(layout);
    console.log(`🎛️ Layout switched to: ${layoutName}`);
  }

  /**
   * デフォルトレイアウト設定
   */
  getDefaultLayout() {
    return {
      'outliner-panel': { visible: true, width: '250px', position: 'left' },
      'inspector-panel': { visible: true, width: '250px', position: 'right' },
      'layers-panel': { visible: true, height: '200px', position: 'bottom-right' },
      'preview-panel': { visible: true, position: 'center' }
    };
  }

  /**
   * 最小レイアウト設定
   */
  getMinimalLayout() {
    return {
      'outliner-panel': { visible: false },
      'inspector-panel': { visible: true, width: '200px', position: 'right' },
      'layers-panel': { visible: false },
      'preview-panel': { visible: true, position: 'center' }
    };
  }

  /**
   * フルスクリーンレイアウト設定
   */
  getFullscreenLayout() {
    return {
      'outliner-panel': { visible: false },
      'inspector-panel': { visible: false },
      'layers-panel': { visible: false },
      'preview-panel': { visible: true, position: 'fullscreen' }
    };
  }

  /**
   * モバイルレイアウト設定
   */
  getMobileLayout() {
    return {
      'outliner-panel': { visible: true, position: 'overlay-left' },
      'inspector-panel': { visible: true, position: 'overlay-right' },
      'layers-panel': { visible: true, position: 'overlay-bottom' },
      'preview-panel': { visible: true, position: 'center' }
    };
  }

  /**
   * レイアウト適用
   */
  applyLayout(layout) {
    Object.entries(layout).forEach(([panelId, config]) => {
      const panel = this.elements.get(panelId);
      if (!panel) return;

      // 表示/非表示
      if (typeof config.visible === 'boolean') {
        this.setPanelVisibility(panelId.replace('-panel', ''), config.visible);
      }

      // サイズ設定
      if (config.width) panel.style.width = config.width;
      if (config.height) panel.style.height = config.height;

      // 位置設定
      if (config.position) {
        panel.classList.remove('left', 'right', 'center', 'overlay-left', 'overlay-right', 'overlay-bottom', 'fullscreen');
        panel.classList.add(config.position);
      }
    });
  }

  /**
   * アウトライナー更新
   */
  updateOutliner() {
    const characterList = this.elements.get('character-list');
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
    
    console.log('🗂️ Outliner updated');
  }

  /**
   * キャラクターアイテム作成
   */
  createCharacterItem(character, index) {
    const item = document.createElement('div');
    item.className = 'character-item';
    item.innerHTML = `
      <div class="character-header" data-index="${index}">
        <div class="character-icon">🦴</div>
        <div class="character-info">
          <div class="character-name">${character.name || 'Unnamed Character'}</div>
          <div class="character-details">Scale: ${(character.scaleX || 0.5).toFixed(2)}</div>
        </div>
        <div class="character-controls">
          <button class="btn btn-sm" data-action="select" data-index="${index}">Select</button>
          <button class="btn btn-sm btn-danger" data-action="remove" data-index="${index}">Remove</button>
        </div>
      </div>
      <div class="character-properties ${index === 0 ? 'expanded' : ''}" data-index="${index}">
        <div class="property-row">
          <label>Position</label>
          <input type="number" value="${character.x || 0}" 
                 data-property="x" data-index="${index}" step="0.1">
          <input type="number" value="${character.y || 0}" 
                 data-property="y" data-index="${index}" step="0.1">
        </div>
        <div class="property-row">
          <label>Scale</label>
          <input type="number" value="${character.scaleX || 0.5}" 
                 data-property="scaleX" data-index="${index}" 
                 min="0.1" max="2.0" step="0.1">
          <input type="number" value="${character.scaleY || 0.5}" 
                 data-property="scaleY" data-index="${index}" 
                 min="0.1" max="2.0" step="0.1">
        </div>
      </div>
    `;
    
    // イベントハンドラー設定
    this.setupCharacterItemEvents(item, index);
    
    return item;
  }

  /**
   * キャラクターアイテムイベント設定
   */
  setupCharacterItemEvents(item, index) {
    // ヘッダークリックで展開/折りたたみ
    const header = item.querySelector('.character-header');
    header.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') {
        const properties = item.querySelector('.character-properties');
        properties.classList.toggle('expanded');
      }
    });

    // ボタンイベント
    const buttons = item.querySelectorAll('button[data-action]');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = button.dataset.action;
        const index = parseInt(button.dataset.index);
        
        if (action === 'select') {
          this.app.selectCharacter(index);
        } else if (action === 'remove') {
          this.removeCharacter(index);
        }
      });
    });

    // プロパティ入力イベント
    const inputs = item.querySelectorAll('input[data-property]');
    inputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const property = input.dataset.property;
        const index = parseInt(input.dataset.index);
        const value = parseFloat(input.value);
        
        this.updateCharacterProperty(index, property, value);
      });
    });
  }

  /**
   * キャラクタープロパティ更新
   */
  updateCharacterProperty(index, property, value) {
    const character = this.app.currentProject?.spineData?.characters[index];
    if (!character) return;
    
    character[property] = value;
    
    // Spine表示更新
    if (this.app.spine) {
      if (property === 'x' || property === 'y') {
        this.app.spine.updateCharacterPosition(character.x || 0, character.y || 0);
      } else if (property === 'scaleX' || property === 'scaleY') {
        this.app.spine.updateCharacterScale(character.scaleX || 0.5, character.scaleY || 0.5);
      }
    }
    
    this.app.markProjectModified();
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
   * インスペクター更新
   */
  updateInspector(character) {
    const posX = this.elements.get('pos-x');
    const posY = this.elements.get('pos-y');
    const scaleX = this.elements.get('scale-x');
    const scaleY = this.elements.get('scale-y');
    const animSelect = this.elements.get('animation-select');

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
   * レイヤーリストドラッグ&ドロップ設定
   */
  setupLayerDragDrop() {
    const layerList = this.elements.get('layer-list');
    if (!layerList) return;

    // Sortable.jsまたは独自実装でドラッグ&ドロップを実装
    // 簡略化のため基本的なイベントのみ設定
    layerList.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('layer-item')) {
        e.dataTransfer.setData('text/plain', e.target.dataset.layerId);
      }
    });

    layerList.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    layerList.addEventListener('drop', (e) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData('text/plain');
      const targetElement = e.target.closest('.layer-item');
      
      if (targetElement && draggedId !== targetElement.dataset.layerId) {
        this.reorderLayers(draggedId, targetElement.dataset.layerId);
      }
    });
  }

  /**
   * レイヤー順序変更
   */
  reorderLayers(draggedId, targetId) {
    // レイヤー順序変更ロジック
    console.log(`🔄 Reordering layers: ${draggedId} -> ${targetId}`);
  }

  /**
   * パネルドラッグ開始
   */
  startPanelDrag(e, header) {
    this.dragState = {
      active: true,
      element: header.closest('.panel'),
      startX: e.clientX,
      startY: e.clientY
    };

    document.addEventListener('mousemove', this.handlePanelDrag.bind(this));
    document.addEventListener('mouseup', this.endPanelDrag.bind(this));
  }

  /**
   * パネルドラッグ処理
   */
  handlePanelDrag(e) {
    if (!this.dragState.active) return;

    const deltaX = e.clientX - this.dragState.startX;
    const deltaY = e.clientY - this.dragState.startY;

    this.dragState.element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  }

  /**
   * パネルドラッグ終了
   */
  endPanelDrag(e) {
    if (this.dragState.active) {
      this.dragState.active = false;
      this.dragState.element = null;

      document.removeEventListener('mousemove', this.handlePanelDrag);
      document.removeEventListener('mouseup', this.endPanelDrag);
    }
  }

  /**
   * パネルリサイズ開始
   */
  startPanelResize(e, handle) {
    const panel = handle.closest('.panel');
    const resizeData = {
      panel: panel,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: parseInt(getComputedStyle(panel).width),
      startHeight: parseInt(getComputedStyle(panel).height),
      direction: handle.dataset.direction || 'se'
    };

    const handleResize = (e) => {
      const deltaX = e.clientX - resizeData.startX;
      const deltaY = e.clientY - resizeData.startY;

      if (resizeData.direction.includes('e')) {
        panel.style.width = (resizeData.startWidth + deltaX) + 'px';
      }
      if (resizeData.direction.includes('s')) {
        panel.style.height = (resizeData.startHeight + deltaY) + 'px';
      }
    };

    const endResize = () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', endResize);
    };

    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', endResize);
  }

  /**
   * パネル状態取得
   */
  getPanelStates() {
    return { ...this.panelStates };
  }

  /**
   * パネル状態復元
   */
  restorePanelStates(states) {
    if (!states) return;

    Object.entries(states).forEach(([panelName, state]) => {
      if (this.panelStates[panelName]) {
        this.panelStates[panelName] = { ...state };
        this.setPanelVisibility(panelName, state.visible);
        this.setPanelExpanded(panelName, state.expanded);
      }
    });

    console.log('🎛️ Panel states restored');
  }

  /**
   * 破棄処理
   */
  destroy() {
    // ドラッグ状態リセット
    this.dragState = { active: false, element: null, startX: 0, startY: 0 };
    
    // 要素キャッシュクリア
    this.elements.clear();
    
    console.log('🗑️ UI Panels Manager destroyed');
  }
}

// エクスポート
window.UIPanelsManager = UIPanelsManager;