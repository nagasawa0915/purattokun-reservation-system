// 🎯 Desktop UI Manager - デスクトップUI管理システム
// パネル管理・レイアウト調整・レスポンシブ対応・テーマ管理
// 作成日: 2025-08-10

class DesktopUIManager {
  constructor() {
    this.panels = {
      left: { element: null, width: 280, minWidth: 200, maxWidth: 400, visible: true },
      right: { element: null, width: 320, minWidth: 250, maxWidth: 500, visible: true }
    };
    
    this.workspace = null;
    this.editorArea = null;
    this.isResizing = false;
    this.resizeData = null;
    
    // テーマ設定
    this.theme = 'light';
    this.autoTheme = true;
    
    this.initializeUI();
    
    console.log('🎨 Desktop UI Manager 初期化完了');
  }
  
  // 静的メソッド - ローディング制御
  static setLoading(isLoading) {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    
    if (isLoading) {
      if (loadingScreen) loadingScreen.style.display = 'flex';
      if (mainContent) mainContent.style.display = 'none';
    } else {
      if (loadingScreen) loadingScreen.style.display = 'none';
      if (mainContent) mainContent.style.display = 'flex';
    }
  }
  
  // インスタンスメソッド - ローディング制御
  setLoading(isLoading) {
    DesktopUIManager.setLoading(isLoading);
  }
  
  // 静的メソッド - ステータスメッセージ表示
  static showStatusMessage(message, type = 'info', duration = 3000) {
    console.log(`📢 ステータス [${type}]: ${message}`);
    
    const statusMessage = document.getElementById('status-message');
    if (statusMessage) {
      statusMessage.textContent = message;
      statusMessage.className = `status-${type}`;
      
      if (duration > 0) {
        setTimeout(() => {
          statusMessage.textContent = '準備完了';
          statusMessage.className = '';
        }, duration);
      }
    }
  }
  
  // インスタンスメソッド - ステータスメッセージ表示
  showStatusMessage(message, type = 'info', duration = 3000) {
    DesktopUIManager.showStatusMessage(message, type, duration);
  }
  
  // 座標情報表示
  showCoordinates(x, y) {
    const coordinatesInfo = document.getElementById('coordinates-info');
    if (coordinatesInfo) {
      coordinatesInfo.textContent = `座標: ${x}, ${y}`;
    }
  }

  /**
   * UI初期化
   */
  initializeUI() {
    // DOM要素取得（存在確認付き）
    this.workspace = document.getElementById('workspace');
    this.editorArea = document.getElementById('editor-area');
    this.panels.left.element = document.getElementById('left-panel');
    this.panels.right.element = document.getElementById('right-panel');
    
    console.log('📊 DesktopUIManager DOM要素確認:', {
      workspace: !!this.workspace,
      editorArea: !!this.editorArea,
      leftPanel: !!this.panels.left.element,
      rightPanel: !!this.panels.right.element
    });
    
    // イベントリスナーセットアップ
    this.setupEventListeners();
    
    // パネル要素が存在する場合のみリサイズ機能初期化
    if (this.panels.left.element && this.panels.right.element) {
      this.initializeResizableFeatures();
    } else {
      console.log('⚠️ パネル要素が見つからないため、リサイズ機能をスキップします');
    }
    
    // テーマ初期化
    this.initializeTheme();
    
    // 初期レイアウト適用
    this.applyLayout();
  }

  /**
   * イベントリスナーセットアップ
   */
  setupEventListeners() {
    // ウィンドウリサイズ対応
    window.addEventListener('resize', () => this.handleWindowResize());
    
    // キーボードショートカット
    document.addEventListener('keydown', (event) => this.handleKeyboardShortcuts(event));
    
    // メディアクエリ変更リスナー
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addEventListener('change', () => this.updateAutoTheme());
    }
    
    console.log('✅ Desktop UI Manager - イベントリスナーセットアップ完了');
  }

  /**
   * リサイズ機能初期化
   */
  initializeResizableFeatures() {
    // 左パネルリサイズハンドル追加
    this.addResizeHandle(this.panels.left.element, 'right');
    
    // 右パネルリサイズハンドル追加
    this.addResizeHandle(this.panels.right.element, 'left');
    
    console.log('✅ リサイズ機能初期化完了');
  }

  /**
   * リサイズハンドル追加
   */
  addResizeHandle(panel, direction) {
    const handle = document.createElement('div');
    handle.className = `resize-handle resize-handle-${direction}`;
    handle.style.cssText = `
      position: absolute;
      ${direction}: -3px;
      top: 0;
      width: 6px;
      height: 100%;
      cursor: col-resize;
      background: transparent;
      z-index: 10;
    `;
    
    handle.addEventListener('mousedown', (event) => {
      this.startResize(event, panel, direction);
    });
    
    panel.style.position = 'relative';
    panel.appendChild(handle);
  }

  /**
   * リサイズ開始
   */
  startResize(event, panel, direction) {
    event.preventDefault();
    
    this.isResizing = true;
    this.resizeData = {
      panel,
      direction,
      startX: event.clientX,
      startWidth: panel.offsetWidth
    };
    
    document.addEventListener('mousemove', this.handleResize.bind(this));
    document.addEventListener('mouseup', this.stopResize.bind(this));
    
    // カーソルを全体に適用
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  /**
   * リサイズ中
   */
  handleResize(event) {
    if (!this.isResizing || !this.resizeData) return;
    
    const { panel, direction, startX, startWidth } = this.resizeData;
    const deltaX = event.clientX - startX;
    
    let newWidth;
    if (direction === 'right') {
      newWidth = startWidth + deltaX;
    } else {
      newWidth = startWidth - deltaX;
    }
    
    // 最小・最大幅制限
    const panelConfig = panel === this.panels.left.element ? this.panels.left : this.panels.right;
    newWidth = Math.max(panelConfig.minWidth, Math.min(panelConfig.maxWidth, newWidth));
    
    // 幅適用
    panel.style.width = newWidth + 'px';
    panelConfig.width = newWidth;
    
    // レイアウト更新
    this.updateEditorAreaLayout();
  }

  /**
   * リサイズ終了
   */
  stopResize() {
    this.isResizing = false;
    this.resizeData = null;
    
    document.removeEventListener('mousemove', this.handleResize);
    document.removeEventListener('mouseup', this.stopResize);
    
    // カーソルを元に戻す
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    // レイアウト保存
    this.saveLayout();
  }

  /**
   * エディターエリアレイアウト更新
   */
  updateEditorAreaLayout() {
    if (!this.editorArea) return;
    
    const leftWidth = this.panels.left.visible ? this.panels.left.width : 0;
    const rightWidth = this.panels.right.visible ? this.panels.right.width : 0;
    
    this.editorArea.style.marginLeft = leftWidth + 'px';
    this.editorArea.style.marginRight = rightWidth + 'px';
  }

  // =========================
  // パネル管理
  // =========================

  /**
   * パネル表示/非表示切り替え
   */
  togglePanel(panelName) {
    const panelConfig = this.panels[panelName];
    if (!panelConfig) return;
    
    panelConfig.visible = !panelConfig.visible;
    
    if (panelConfig.element) {
      panelConfig.element.style.display = panelConfig.visible ? 'flex' : 'none';
    }
    
    this.updateEditorAreaLayout();
    this.saveLayout();
    
    console.log(`🔄 ${panelName}パネル: ${panelConfig.visible ? '表示' : '非表示'}`);
  }

  /**
   * パネルサイズ変更
   */
  setPanelWidth(panelName, width) {
    const panelConfig = this.panels[panelName];
    if (!panelConfig) return;
    
    width = Math.max(panelConfig.minWidth, Math.min(panelConfig.maxWidth, width));
    panelConfig.width = width;
    
    if (panelConfig.element) {
      panelConfig.element.style.width = width + 'px';
    }
    
    this.updateEditorAreaLayout();
    this.saveLayout();
  }

  /**
   * レイアウト適用
   */
  applyLayout() {
    // 保存されたレイアウト読み込み
    this.loadLayout();
    
    // パネルサイズ適用
    Object.keys(this.panels).forEach(panelName => {
      const panelConfig = this.panels[panelName];
      if (panelConfig.element) {
        panelConfig.element.style.width = panelConfig.width + 'px';
        panelConfig.element.style.display = panelConfig.visible ? 'flex' : 'none';
      }
    });
    
    // エディターエリアレイアウト更新
    this.updateEditorAreaLayout();
    
    console.log('✅ レイアウト適用完了');
  }

  /**
   * レイアウト保存
   */
  saveLayout() {
    try {
      const layoutData = {
        panels: {
          left: { width: this.panels.left.width, visible: this.panels.left.visible },
          right: { width: this.panels.right.width, visible: this.panels.right.visible }
        },
        theme: this.theme,
        autoTheme: this.autoTheme,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('spine-editor-layout', JSON.stringify(layoutData));
    } catch (error) {
      console.warn('レイアウト保存エラー:', error);
    }
  }

  /**
   * レイアウト読み込み
   */
  loadLayout() {
    try {
      const layoutData = JSON.parse(localStorage.getItem('spine-editor-layout') || '{}');
      
      if (layoutData.panels) {
        if (layoutData.panels.left) {
          this.panels.left.width = layoutData.panels.left.width || this.panels.left.width;
          this.panels.left.visible = layoutData.panels.left.visible !== false;
        }
        
        if (layoutData.panels.right) {
          this.panels.right.width = layoutData.panels.right.width || this.panels.right.width;
          this.panels.right.visible = layoutData.panels.right.visible !== false;
        }
      }
      
      if (layoutData.theme) {
        this.theme = layoutData.theme;
      }
      
      if (layoutData.autoTheme !== undefined) {
        this.autoTheme = layoutData.autoTheme;
      }
    } catch (error) {
      console.warn('レイアウト読み込みエラー:', error);
    }
  }

  // =========================
  // テーマ管理
  // =========================

  /**
   * テーマ初期化
   */
  initializeTheme() {
    // 自動テーマが有効な場合はシステム設定を取得
    if (this.autoTheme) {
      this.updateAutoTheme();
    } else {
      this.applyTheme(this.theme);
    }
  }

  /**
   * 自動テーマ更新
   */
  updateAutoTheme() {
    if (!this.autoTheme) return;
    
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const newTheme = prefersDark ? 'dark' : 'light';
    
    if (newTheme !== this.theme) {
      this.theme = newTheme;
      this.applyTheme(this.theme);
      this.saveLayout();
    }
  }

  /**
   * テーマ適用
   */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.theme = theme;
    
    console.log(`🎨 テーマ変更: ${theme}`);
  }

  /**
   * テーマ切り替え
   */
  toggleTheme() {
    const newTheme = this.theme === 'light' ? 'dark' : 'light';
    this.autoTheme = false;
    this.applyTheme(newTheme);
    this.saveLayout();
  }

  /**
   * 自動テーマ設定
   */
  setAutoTheme(enabled) {
    this.autoTheme = enabled;
    if (enabled) {
      this.updateAutoTheme();
    }
    this.saveLayout();
  }

  // =========================
  // イベントハンドラー
  // =========================

  /**
   * ウィンドウリサイズ処理
   */
  handleWindowResize() {
    // モバイルサイズでパネルを自動調整
    const isMobile = window.innerWidth <= 900;
    
    if (isMobile && (this.panels.left.visible || this.panels.right.visible)) {
      // モバイルモードではパネルを折り畳み
      this.workspace?.classList.add('mobile-layout');
    } else {
      this.workspace?.classList.remove('mobile-layout');
      this.updateEditorAreaLayout();
    }
    
    // Spineキャンバスのリサイズ処理
    this.handleCanvasResize();
  }

  /**
   * キャンバスリサイズ処理
   */
  handleCanvasResize() {
    // Spineキャンバスのリサイズ処理はここで実装
    const canvasArea = document.getElementById('spine-canvas-area');
    if (canvasArea && window.SpineEditSystem) {
      // Spine編集システムにリサイズイベントを通知
      if (typeof window.SpineEditSystem.handleResize === 'function') {
        window.SpineEditSystem.handleResize();
      }
    }
  }

  /**
   * キーボードショートカット処理
   */
  handleKeyboardShortcuts(event) {
    const { ctrlKey, metaKey, shiftKey, altKey, key } = event;
    const cmdOrCtrl = ctrlKey || metaKey;
    
    // Ctrl/Cmd + Shift + L: 左パネル表示/非表示
    if (cmdOrCtrl && shiftKey && key.toLowerCase() === 'l') {
      event.preventDefault();
      this.togglePanel('left');
    }
    
    // Ctrl/Cmd + Shift + R: 右パネル表示/非表示
    if (cmdOrCtrl && shiftKey && key.toLowerCase() === 'r') {
      event.preventDefault();
      this.togglePanel('right');
    }
    
    // Ctrl/Cmd + Shift + T: テーマ切り替え
    if (cmdOrCtrl && shiftKey && key.toLowerCase() === 't') {
      event.preventDefault();
      this.toggleTheme();
    }
    
    // F11: フルスクリーン切り替え
    if (key === 'F11') {
      event.preventDefault();
      this.toggleFullscreen();
    }
  }

  // =========================
  // ユーティリティメソッド
  // =========================

  /**
   * フルスクリーン切り替え
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('フルスクリーンエラー:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  // 重複メソッドを削除（上部に移動済み）

  /**
   * ズーム情報表示
   */
  showZoomInfo(zoom) {
    const zoomInfo = document.getElementById('zoom-info');
    if (zoomInfo) {
      zoomInfo.textContent = `${Math.round(zoom * 100)}%`;
    }
  }

  /**
   * モーダルダイアログ表示
   */
  showModal(content, title = null) {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    if (!modalOverlay || !modalContent) return;
    
    let html = '';
    if (title) {
      html += `<div class="modal-header"><h2 class="modal-title">${title}</h2></div>`;
    }
    html += `<div class="modal-body">${content}</div>`;
    html += `<div class="modal-footer">
      <button class="btn btn-secondary" onclick="window.DesktopUIManager.closeModal()">閉じる</button>
    </div>`;
    
    modalContent.innerHTML = html;
    modalOverlay.style.display = 'flex';
    modalOverlay.classList.add('fade-in');
  }

  /**
   * モーダルダイアログ閉じる
   */
  closeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
      modalOverlay.style.display = 'none';
      modalOverlay.classList.remove('fade-in');
    }
  }

  /**
   * ローディング状態設定
   */
  setLoading(isLoading, message = '読み込み中...') {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingMessage = document.getElementById('loading-message');
    
    if (loadingScreen) {
      loadingScreen.style.display = isLoading ? 'flex' : 'none';
    }
    
    if (loadingMessage) {
      loadingMessage.textContent = message;
    }
  }

  /**
   * アニメーションクラス追加
   */
  addAnimation(element, animationClass, duration = 300) {
    if (!element) return;
    
    element.classList.add(animationClass);
    
    setTimeout(() => {
      element.classList.remove(animationClass);
    }, duration);
  }
}

// HTMLビューアーマネージャー追加
class HtmlViewerManager {
  constructor() {
    this.webview = null;
    this.currentUrl = null;
    this.isLoading = false;
    
    this.init();
    console.log('🌐 HTML Viewer Manager 初期化完了');
  }
  
  showFileFallback() {
    if (!this.fileSelector) return;
    
    const fallbackGroup = document.createElement('optgroup');
    fallbackGroup.label = '💡 手動入力のヒント';
    
    const suggestions = [
      { name: '手動URL入力', value: '', text: '→ 下の「カスタムURL」欄に入力してください' },
      { name: 'localhost例', value: '', text: '例: http://localhost:8000/index.html' },
      { name: 'ファイル例', value: '', text: '例: file:///C:/path/to/file.html' }
    ];
    
    suggestions.forEach(suggestion => {
      const option = document.createElement('option');
      option.value = suggestion.value;
      option.textContent = suggestion.text;
      option.disabled = true;
      option.style.fontStyle = 'italic';
      fallbackGroup.appendChild(option);
    });
    
    this.fileSelector.appendChild(fallbackGroup);
    
    // URLプリセットを表示
    this.showUrlPresets();
  }
  
  addUrlPresets() {
    // URLプリセットコンテナが既に存在するか確認
    const existingContainer = document.getElementById('url-preset-container');
    if (existingContainer) {
      // 既存のコンテナを使用
      existingContainer.innerHTML = `
        <div style="padding: 10px; background: #f5f5f5; border-radius: 4px;">
          <strong>🔗 よく使うURL:</strong>
          <div id="url-preset-buttons" style="margin-top: 5px;"></div>
        </div>
      `;
    } else {
      // 新規作成（フォールバック）
      const presetContainer = document.createElement('div');
      presetContainer.id = 'url-preset-container';
      presetContainer.innerHTML = `
        <div style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 4px;">
          <strong>🔗 よく使うURL:</strong>
          <div id="url-preset-buttons" style="margin-top: 5px;"></div>
        </div>
      `;
      
      // カスタムURL入力の上に挿入
      const customUrlInput = document.getElementById('custom-url-input');
      if (customUrlInput && customUrlInput.parentNode) {
        customUrlInput.parentNode.insertBefore(presetContainer, customUrlInput.previousSibling);
      }
    }
    
    this.createPresetButtons();
  }
  
  showUrlPresets() {
    const container = document.getElementById('url-preset-container');
    if (container) {
      container.style.display = 'block';
    }
  }
  
  createPresetButtons() {
    const buttonContainer = document.getElementById('url-preset-buttons');
    if (!buttonContainer) return;
    
    // 🚀 修正: メインプロジェクトディレクトリとデスクトップ版を区別
    const presets = [
      { name: '🌟 メインサイト', url: 'http://localhost:8000/index.html', description: 'ぷらっとくん予約システム（メイン）' },
      { name: '🔧 編集モード', url: 'http://localhost:8000/index.html?edit=true', description: 'Spine編集システム（メイン）' },
      { name: '🎬 タイムラインシステム', url: 'http://localhost:8000/timeline-experiment.html', description: 'タイムライン制作システム' },
      { name: '🎯 Spine編集デモ', url: 'http://localhost:8000/spine-positioning-system-explanation.html', description: 'Spine位置調整デモ' },
      { name: '🆕 デスクトップ版テスト', url: 'http://localhost:8000/test-minimal.html', description: 'デスクトップ版最小テスト' }
    ];
    
    buttonContainer.innerHTML = '';
    
    presets.forEach(preset => {
      const button = document.createElement('button');
      button.textContent = preset.name;
      button.className = 'btn btn-sm btn-outline-primary';
      button.style.marginRight = '5px';
      button.style.marginBottom = '5px';
      button.onclick = () => {
        this.customUrlInput.value = preset.url;
        this.fileSelector.value = '';
        this.showStatus(`URL設定: ${preset.name}`, 'info');
      };
      buttonContainer.appendChild(button);
    });
    
    // ブレークラインを追加
    const breakDiv = document.createElement('div');
    breakDiv.style.width = '100%';
    breakDiv.style.marginTop = '10px';
    buttonContainer.appendChild(breakDiv);
    
    // ファイル選択ボタン
    const fileSelectButton = document.createElement('button');
    fileSelectButton.textContent = '📁 ファイル選択';
    fileSelectButton.className = 'btn btn-sm btn-outline-primary';
    fileSelectButton.style.marginRight = '5px';
    fileSelectButton.onclick = () => this.selectLocalFile();
    breakDiv.appendChild(fileSelectButton);
    
    // ポート変更ボタン
    const portButton = document.createElement('button');
    portButton.textContent = 'ポート変更';
    portButton.className = 'btn btn-sm btn-outline-secondary';
    portButton.style.marginRight = '5px';
    portButton.onclick = () => this.changePort();
    breakDiv.appendChild(portButton);
    
    // サーバーステータスボタン
    const statusButton = document.createElement('button');
    statusButton.textContent = '🔍 サーバー状況';
    statusButton.className = 'btn btn-sm btn-outline-info';
    statusButton.style.marginRight = '5px';
    statusButton.onclick = () => this.checkServerStatus();
    breakDiv.appendChild(statusButton);
    
    // サーバー起動ボタン
    const startServerButton = document.createElement('button');
    startServerButton.textContent = '🚀 サーバー起動';
    startServerButton.className = 'btn btn-sm btn-outline-success';
    startServerButton.onclick = () => this.startServer();
    breakDiv.appendChild(startServerButton);
  }
  
  changePort() {
    const newPort = prompt('ポート番号を入力してください (メイン:8000, デスクトップ:8080):', '8000');
    if (newPort && /^\d+$/.test(newPort)) {
      const currentUrl = this.customUrlInput.value || 'http://localhost:8000/index.html';
      const newUrl = currentUrl.replace(/:\d+/, `:${newPort}`);
      this.customUrlInput.value = newUrl;
      this.showStatus(`ポートを${newPort}に変更`, 'info');
      this.createPresetButtons(); // プリセットボタンも更新
    }
  }
  
  showStatus(message, type = 'info') {
    console.log(`📢 ステータス [${type}]: ${message}`);
    
    // グローバルUIマネージャーのステータス表示を利用
    if (window.DesktopUIManager && window.DesktopUIManager.showStatusMessage) {
      window.DesktopUIManager.showStatusMessage(message, type);
    }
  }
  
  init() {
    console.log('🌐 HtmlViewerManager初期化開始...');
    
    // DOM要素取得
    this.webview = document.getElementById('html-webview');
    this.fileSelector = document.getElementById('html-file-selector');
    this.customUrlInput = document.getElementById('custom-url-input');
    this.loadButton = document.getElementById('load-html-button');
    this.refreshButton = document.getElementById('refresh-html-button');
    
    console.log('📊 DOM要素確認:', {
      webview: !!this.webview,
      fileSelector: !!this.fileSelector, 
      customUrlInput: !!this.customUrlInput,
      loadButton: !!this.loadButton,
      refreshButton: !!this.refreshButton
    });
    
    // イベントリスナー設定
    this.setupEventListeners();
    
    // URLプリセットボタンを先に作成
    this.addUrlPresets();
    
    // ローカルHTMLファイル一覧を取得
    this.loadLocalFiles();
    
    console.log('✅ HtmlViewerManager初期化完了');
  }
  
  setupEventListeners() {
    // 読み込みボタン
    this.loadButton?.addEventListener('click', () => this.loadSelectedPage());
    
    // 更新ボタン
    this.refreshButton?.addEventListener('click', () => this.refreshCurrentPage());
    
    // ファイル選択変更
    this.fileSelector?.addEventListener('change', () => {
      if (this.fileSelector.value) {
        this.customUrlInput.value = '';
      }
    });
    
    // カスタムURL入力
    this.customUrlInput?.addEventListener('input', () => {
      if (this.customUrlInput.value) {
        this.fileSelector.value = '';
      }
    });
    
    // URLプリセットボタンを追加（既にinitで実行済みなのでコメントアウト）
    // this.addUrlPresets();
    
    // Enterキーで読み込み
    this.customUrlInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.loadSelectedPage();
      }
    });
    
    // webviewイベント
    if (this.webview) {
      this.webview.addEventListener('dom-ready', () => this.onWebviewReady());
      this.webview.addEventListener('did-start-loading', () => this.onLoadStart());
      this.webview.addEventListener('did-stop-loading', () => this.onLoadStop());
      this.webview.addEventListener('did-fail-load', (event) => this.onLoadFail(event));
    }
  }
  
  async loadLocalFiles() {
    try {
      console.log('🔍 ローカルHTMLファイル一覧取得開始...');
      
      if (!window.electronAPI?.htmlView?.getLocalFiles) {
        throw new Error('electronAPI.htmlView.getLocalFiles が利用できません');
      }
      
      const result = await window.electronAPI.htmlView.getLocalFiles();
      
      console.log('📊 API結果:', result);
      
      if (result?.success && result.files) {
        this.populateFileSelector(result.files);
        console.log(`✅ ローカルHTMLファイル ${result.files.length}件 取得完了`);
        
        // デバッグ情報を表示
        if (result.debug) {
          console.log('🔍 検索詳細:', result.debug);
        }
        
        // ファイルリストをステータスに表示
        this.showStatus(`HTMLファイル ${result.files.length}件 検出`, 'success');
      } else {
        const errorMsg = result?.error || 'ファイル取得に失敗';
        console.error('❌ ファイル取得失敗:', errorMsg);
        this.showStatus(`ファイル検出失敗: ${errorMsg}`, 'error');
        
        // フォールバック: 手動入力を促す
        this.showFileFallback();
      }
    } catch (error) {
      console.error('❌ ローカルファイル取得エラー:', error);
      this.showStatus(`API エラー: ${error.message}`, 'error');
      this.showFileFallback();
    }
  }
  
  populateFileSelector(files) {
    if (!this.fileSelector) {
      console.error('❌ fileSelector要素が見つかりません');
      return;
    }
    
    console.log(`📝 ファイルセレクター更新開始: ${files.length}件`);
    
    // 既存オプションをクリア（最初の選択オプションは保持）
    const firstOption = this.fileSelector.firstElementChild;
    this.fileSelector.innerHTML = '';
    if (firstOption && firstOption.textContent.includes('選択')) {
      this.fileSelector.appendChild(firstOption);
    } else {
      // デフォルトオプションを追加
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'HTMLページを選択してください';
      this.fileSelector.appendChild(defaultOption);
    }
    
    if (files.length === 0) {
      const noFilesOption = document.createElement('option');
      noFilesOption.value = '';
      noFilesOption.textContent = '❌ HTMLファイルが見つかりません';
      noFilesOption.disabled = true;
      this.fileSelector.appendChild(noFilesOption);
      return;
    }
    
    // ファイルをディレクトリ別にグループ化
    const grouped = files.reduce((acc, file) => {
      const dir = file.directory || '.';
      if (!acc[dir]) acc[dir] = [];
      acc[dir].push(file);
      return acc;
    }, {});
    
    console.log('📂 グループ化結果:', Object.keys(grouped));
    
    // 特別なファイルを先頭に追加
    const specialFiles = files.filter(f => f.isSpecial);
    if (specialFiles.length > 0) {
      const specialGroup = document.createElement('optgroup');
      specialGroup.label = `🌟 おすすめページ (${specialFiles.length}件)`;
      
      specialFiles.forEach(file => {
        const option = document.createElement('option');
        option.value = file.relativePath;
        option.textContent = `${file.name}${file.description ? ' - ' + file.description : ''}`;
        option.dataset.isSpecial = 'true';
        specialGroup.appendChild(option);
        console.log(`  ⭐ 特別: ${file.name} -> ${file.relativePath}`);
      });
      
      this.fileSelector.appendChild(specialGroup);
    }
    
    // 通常ファイルをディレクトリ別に追加
    Object.keys(grouped).sort().forEach(dir => {
      const regularFiles = grouped[dir].filter(f => !f.isSpecial);
      if (regularFiles.length === 0) return;
      
      const group = document.createElement('optgroup');
      group.label = dir === '.' ? `📁 ルート (${regularFiles.length}件)` : `📁 ${dir} (${regularFiles.length}件)`;
      
      regularFiles.sort((a, b) => a.name.localeCompare(b.name)).forEach(file => {
        const option = document.createElement('option');
        option.value = file.relativePath;
        option.textContent = file.name;
        if (file.size) {
          option.title = `サイズ: ${Math.round(file.size / 1024)}KB`;
        }
        group.appendChild(option);
        console.log(`  📄 通常: ${file.name} -> ${file.relativePath}`);
      });
      
      this.fileSelector.appendChild(group);
    });
    
    console.log(`✅ ファイルセレクター更新完了: ${this.fileSelector.children.length}グループ`);
  }
  
  async loadSelectedPage() {
    const selectedFile = this.fileSelector?.value;
    const customUrl = this.customUrlInput?.value?.trim();
    
    console.log('🔄 ページ読み込みリクエスト:');
    console.log('  選択されたファイル:', selectedFile);
    console.log('  カスタムURL:', customUrl);
    
    let urlToLoad = null;
    
    if (customUrl) {
      urlToLoad = customUrl;
      console.log('✅ カスタムURLを使用:', urlToLoad);
    } else if (selectedFile) {
      console.log('📄 ファイルパス解決中...');
      // ローカルファイルの場合はAPI経由でパス解決
      try {
        const result = await window.electronAPI?.htmlView?.loadPage(selectedFile);
        console.log('📊 パス解決結果:', result);
        
        if (result?.success) {
          urlToLoad = result.url;
          console.log('✅ パス解決成功:', urlToLoad);
        } else {
          const errorMsg = 'ファイルパスの解決に失敗しました: ' + (result?.error || '不明なエラー');
          console.error('❌', errorMsg);
          this.showError(errorMsg);
          return;
        }
      } catch (error) {
        const errorMsg = 'ファイル読み込みAPIエラー: ' + error.message;
        console.error('❌', errorMsg);
        this.showError(errorMsg);
        return;
      }
    } else {
      const errorMsg = 'HTMLファイルまたはURLを選択してください';
      console.warn('⚠️', errorMsg);
      this.showError(errorMsg);
      return;
    }
    
    this.loadUrl(urlToLoad);
  }
  
  loadUrl(url) {
    if (!this.webview || !url) return;
    
    console.log('🌐 HTMLページ読み込み開始:', url);
    this.currentUrl = url;
    this.hideError();
    
    try {
      this.webview.src = url;
    this.showStatus(`読み込み開始: ${url}`, 'info');
    } catch (error) {
      this.showError('URL読み込みエラー: ' + error.message);
    }
  }
  
  refreshCurrentPage() {
    if (!this.webview || !this.currentUrl) return;
    
    console.log('🔄 HTMLページ更新:', this.currentUrl);
    this.webview.reload();
  }
  
  onWebviewReady() {
    console.log('✅ Webview DOM準備完了');
    this.hideLoading();
  }
  
  onLoadStart() {
    console.log('🔄 Webview読み込み開始');
    this.isLoading = true;
    this.showLoading();
    this.hideError();
  }
  
  onLoadStop() {
    console.log('✅ Webview読み込み完了');
    this.isLoading = false;
    this.hideLoading();
  }
  
  onLoadFail(event) {
    console.error('❌ Webview読み込み失敗:', event.errorDescription);
    this.isLoading = false;
    this.hideLoading();
    this.showError(`読み込みに失敗しました: ${event.errorDescription || '不明なエラー'}`);
  }
  
  showLoading() {
    const loading = document.getElementById('webview-loading');
    if (loading) {
      loading.style.display = 'flex';
    }
  }
  
  hideLoading() {
    const loading = document.getElementById('webview-loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }
  
  showError(message) {
    const errorDiv = document.getElementById('webview-error');
    const errorMessage = document.getElementById('error-message');
    
    if (errorDiv && errorMessage) {
      errorMessage.textContent = message;
      errorDiv.style.display = 'flex';
    }
    
    // ステータスメッセージも更新
    this.showStatus(`エラー: ${message}`, 'error');
    
    console.error('❌ HTMLビューアーエラー:', message);
  }
  
  hideError() {
    const errorDiv = document.getElementById('webview-error');
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }
  
  retryLoad() {
    if (this.currentUrl) {
      this.hideError();
      this.loadUrl(this.currentUrl);
    }
  }
  
  // サーバーステータス確認
  async checkServerStatus() {
    try {
      if (!window.electronAPI?.htmlView?.checkServerStatus) {
        this.showStatus('サーバーステータス確認APIが利用できません', 'error');
        return;
      }
      
      this.showStatus('サーバーステータス確認中...', 'info');
      const result = await window.electronAPI.htmlView.checkServerStatus();
      
      if (result.success) {
        const status = result.status;
        const message = `${status.message} (ポート:${status.port})`;
        this.showStatus(message, status.isRunning ? 'success' : 'warning');
        
        // 詳細をアラートで表示 + HTMLファイル検証情報を追加
        let alertMessage = `📊 サーバーステータス詳細:\n\n`;
        alertMessage += `状態: ${status.message}\n`;
        alertMessage += `ポート: ${status.port}\n`;
        alertMessage += `URL: ${status.url}\n`;
        alertMessage += `稼働状況: ${status.isRunning ? '✅ 動作中' : '❌ 停止中'}\n`;
        
        // HTMLファイルアクセス確認
        if (status.isRunning) {
          alertMessage += `\n💡 推奨URL:\n`;
          alertMessage += `• メインサイト: ${status.url}/index.html\n`;
          alertMessage += `• 編集モード: ${status.url}/index.html?edit=true\n`;
          alertMessage += `• タイムライン: ${status.url}/timeline-experiment.html`;
        }
        
        alert(alertMessage);
      } else {
        this.showStatus(`ステータス確認エラー: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('サーバーステータス確認エラー:', error);
      this.showStatus('ステータス確認に失敗しました', 'error');
    }
  }
  
  // ローカルファイル選択
  async selectLocalFile() {
    try {
      if (!window.electronAPI?.dialog?.openFile) {
        // Electron APIが利用できない場合は、ファイルリストから選択
        this.showStatus('ファイル選択ダイアログを開いています...', 'info');
        const files = this.fileSelector?.querySelectorAll('option');
        if (files && files.length > 1) {
          this.showStatus('ドロップダウンリストからファイルを選択してください', 'info');
          this.fileSelector.focus();
        } else {
          this.showStatus('HTMLファイルリストを再読み込みしています...', 'info');
          await this.loadLocalFiles();
        }
        return;
      }
      
      // Electron APIでファイル選択ダイアログ表示
      const result = await window.electronAPI.dialog.openFile({
        title: 'HTMLファイルを選択',
        filters: [
          { name: 'HTML Files', extensions: ['html', 'htm'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });
      
      if (result.success && result.filePaths && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        this.customUrlInput.value = `file:///${filePath.replace(/\\/g, '/')}`;
        this.fileSelector.value = '';
        this.showStatus('ファイルを選択しました', 'success');
        
        // 自動的に読み込み
        setTimeout(() => this.loadSelectedPage(), 500);
      }
    } catch (error) {
      console.error('ファイル選択エラー:', error);
      this.showStatus('ファイル選択に失敗しました', 'error');
    }
  }
  
  // サーバー起動
  async startServer() {
    try {
      if (!window.electronAPI?.htmlView?.startServer) {
        this.showStatus('サーバー起動APIが利用できません', 'error');
        return;
      }
      
      this.showStatus('サーバーを起動しています...', 'info');
      const result = await window.electronAPI.htmlView.startServer();
      
      if (result.success) {
        this.showStatus('サーバーが正常に起動しました', 'success');
        
        // 起動成功を詳細表示
        alert(`🚀 サーバー起動成功!\n\n` +
              `メッセージ: ${result.message}\n` +
              `ポート: ${result.port}\n` +
              `URL: ${result.url || 'http://localhost:' + result.port}\n\n` +
              `これで HTMLビューアーでページを読み込めます。`);
        
        // ファイル一覧を再読み込み
        this.loadLocalFiles();
      } else {
        this.showStatus(`サーバー起動失敗: ${result.error}`, 'error');
        
        // エラー詳細とフォールバック情報を表示
        let errorMessage = `❌ サーバー起動に失敗しました\n\n`;
        errorMessage += `エラー: ${result.error}\n\n`;
        
        if (result.fallbackMessage) {
          errorMessage += `💡 解決方法:\n${result.fallbackMessage}`;
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('サーバー起動エラー:', error);
      this.showStatus('サーバー起動に失敗しました', 'error');
      alert(`🚨 予期しないエラー:\n${error.message}`);
    }
  }
}

// DOM読み込み後にインスタンス作成
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOMContentLoaded - Desktop UI Manager初期化開始');
  
  // グローバルインスタンス作成（エラーハンドリング付き）
  try {
    window.DesktopUIManager = new DesktopUIManager();
    console.log('✅ DesktopUIManager作成完了');
  } catch (error) {
    console.error('❌ DesktopUIManager作成エラー:', error);
  }
  
  // HTMLビューアー初期化を確実なタイミングで実行する関数（グローバルスコープで定義）
  window.initializeHtmlViewerManager = function() {
    console.log('🔍 HTMLビューアーマネージャー初期化試行中...');
    
    const htmlViewerElements = {
      container: document.getElementById('html-viewer-view'),
      fileSelector: document.getElementById('html-file-selector'),
      customUrlInput: document.getElementById('custom-url-input'),
      presetContainer: document.getElementById('url-preset-container')
    };

    console.log('🔍 HTMLビューアー要素確認:', htmlViewerElements);
    console.log('🔍 DOM readyState:', document.readyState);
    console.log('🔍 document.body存在確認:', !!document.body);
    console.log('🔍 実行タイミング:', new Date().toISOString());

    if (htmlViewerElements.container && htmlViewerElements.fileSelector) {
      try {
        window.htmlViewerManager = new HtmlViewerManager();
        console.log('✅ HtmlViewerManager作成完了');
        return true;
      } catch (error) {
        console.error('❌ HtmlViewerManager作成エラー:', error);
        return false;
      }
    } else {
      console.info('ℹ️ HTMLビューアー要素が見つかりません');
      
      // 要素が見つからない場合の詳細ログ
      Object.entries(htmlViewerElements).forEach(([name, element]) => {
        console.log(`  ${name}: ${element ? '✅存在' : '❌null'}`);
      });
      return false;
    }
  }

  // 初回試行
  if (!window.initializeHtmlViewerManager()) {
    console.log('⏳ HTMLビューアー要素が準備できていません - 再試行機能を設定...');
    
    // MutationObserverで要素の追加を監視
    const observer = new MutationObserver((mutations, obs) => {
      const container = document.getElementById('html-viewer-view');
      if (container) {
        console.log('🔄 HTMLビューアー要素が追加されました - 再初期化中...');
        if (window.initializeHtmlViewerManager()) {
          obs.disconnect();
        }
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // 最大10秒後に監視停止
    setTimeout(() => {
      observer.disconnect();
      console.log('⏰ HTMLビューアー要素監視タイムアウト');
    }, 10000);
    
    // 追加の定期リトライ（MutationObserverと並行）
    let retryCount = 0;
    const maxRetries = 5;
    const retryInterval = setInterval(() => {
      retryCount++;
      console.log(`🔄 HTMLビューアー定期リトライ ${retryCount}/${maxRetries}`);
      
      if (window.htmlViewerManager) {
        clearInterval(retryInterval);
        console.log('✅ HTMLビューアーマネージャー確認済み - 定期リトライ停止');
        return;
      }
      
      if (window.initializeHtmlViewerManager()) {
        clearInterval(retryInterval);
        observer.disconnect();
        console.log('✅ 定期リトライでHtmlViewerManager初期化成功');
      } else if (retryCount >= maxRetries) {
        clearInterval(retryInterval);
        console.log('❌ HTMLビューアー定期リトライ上限到達 - 諦めます');
      }
    }, 2000); // 2秒間隔
  }
  
  console.log('✅ Desktop UI Manager - モジュール初期化完了');
});

// HTMLビューアータブが確実に動作するよう、window.load でも初期化を試行
window.addEventListener('load', () => {
  console.log('🌐 Window Load - HTMLビューアー最終確認');
  
  if (!window.htmlViewerManager) {
    console.log('🔄 Window Load - HTMLビューアーマネージャーが未初期化 - 最終試行中...');
    
    // 最後の確実な試行
    setTimeout(() => {
      if (!window.htmlViewerManager) {
        console.log('🔄 Window Load - 遅延初期化試行中...');
        
        if (typeof window.initializeHtmlViewerManager === 'function') {
          window.initializeHtmlViewerManager();
        } else {
          // 関数が存在しない場合の直接実行
          const htmlViewerContainer = document.getElementById('html-viewer-view');
          if (htmlViewerContainer) {
            try {
              window.htmlViewerManager = new HtmlViewerManager();
              console.log('✅ Window Load - HtmlViewerManager作成完了（遅延初期化）');
            } catch (error) {
              console.error('❌ Window Load - HtmlViewerManager作成エラー:', error);
            }
          } else {
            console.warn('⚠️ Window Load - HTMLビューアー要素が見つかりません（デスクトップ環境でない可能性）');
          }
        }
      }
    }, 100); // 100ms遅延で確実性を向上
  } else {
    console.log('✅ HTMLビューアーマネージャーは既に初期化済みです');
  }
});