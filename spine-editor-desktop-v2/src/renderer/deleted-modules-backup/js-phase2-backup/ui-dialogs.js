/**
 * Spine Editor Desktop v2.0 - UI Dialogs Manager
 * ダイアログ・モーダル・通知システム
 */

class UIDialogsManager {
  constructor(app, uiManager) {
    this.app = app;
    this.ui = uiManager;
    
    // ダイアログ状態管理
    this.activeDialogs = new Map();
    this.modalStack = [];
    this.notificationQueue = [];
    
    // ダイアログテンプレート
    this.templates = new Map();
    this.initTemplates();
    
    // 設定
    this.config = {
      maxNotifications: 5,
      defaultNotificationDuration: 3000,
      backdropClickClose: true
    };
  }

  /**
   * ダイアログシステム初期化
   */
  init() {
    console.log('💬 Initializing UI Dialogs Manager...');
    
    // ダイアログコンテナ作成
    this.createDialogContainer();
    
    // ダイアログイベント設定
    this.setupDialogEvents();
    
    // 通知システム設定
    this.setupNotificationSystem();
    
    // ESCキーでダイアログ閉じる
    this.setupKeyboardEvents();
    
    console.log('✅ UI Dialogs Manager initialized');
  }

  /**
   * ダイアログテンプレート初期化
   */
  initTemplates() {
    this.templates.set('confirm', {
      title: 'Confirm',
      buttons: [
        { text: 'Cancel', class: 'btn-secondary', action: 'cancel' },
        { text: 'OK', class: 'btn-primary', action: 'confirm' }
      ]
    });

    this.templates.set('alert', {
      title: 'Alert',
      buttons: [
        { text: 'OK', class: 'btn-primary', action: 'confirm' }
      ]
    });

    this.templates.set('settings', {
      title: 'Settings',
      buttons: [
        { text: 'Cancel', class: 'btn-secondary', action: 'cancel' },
        { text: 'Apply', class: 'btn-primary', action: 'apply' }
      ],
      size: 'large'
    });

    this.templates.set('about', {
      title: 'About Spine Editor Desktop v2.0',
      buttons: [
        { text: 'Close', class: 'btn-primary', action: 'close' }
      ]
    });

    this.templates.set('shortcuts', {
      title: 'Keyboard Shortcuts',
      buttons: [
        { text: 'Close', class: 'btn-primary', action: 'close' }
      ],
      size: 'medium'
    });
  }

  /**
   * ダイアログコンテナ作成
   */
  createDialogContainer() {
    // モーダルオーバーレイ作成
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'modal-overlay hidden';
    
    // 通知コンテナ作成
    const notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.className = 'notification-container';
    
    document.body.appendChild(overlay);
    document.body.appendChild(notificationContainer);
  }

  /**
   * ダイアログイベント設定
   */
  setupDialogEvents() {
    // オーバーレイクリックで閉じる
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay && this.config.backdropClickClose) {
          this.closeTopDialog();
        }
      });
    }
  }

  /**
   * 通知システム設定
   */
  setupNotificationSystem() {
    // 通知クリックイベント
    const container = document.getElementById('notification-container');
    if (container) {
      container.addEventListener('click', (e) => {
        const notification = e.target.closest('.notification');
        if (notification) {
          this.dismissNotification(notification);
        }
      });
    }
  }

  /**
   * キーボードイベント設定
   */
  setupKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalStack.length > 0) {
        this.closeTopDialog();
      }
    });
  }

  /**
   * 確認ダイアログ表示
   */
  showConfirm(title, message, onConfirm, onCancel) {
    return new Promise((resolve) => {
      const dialog = this.createDialog('confirm', {
        title: title,
        content: `<p>${message}</p>`,
        onConfirm: () => {
          if (onConfirm) onConfirm();
          resolve(true);
          this.closeDialog(dialog);
        },
        onCancel: () => {
          if (onCancel) onCancel();
          resolve(false);
          this.closeDialog(dialog);
        }
      });
      
      this.showDialog(dialog);
    });
  }

  /**
   * アラートダイアログ表示
   */
  showAlert(title, message, onOk) {
    return new Promise((resolve) => {
      const dialog = this.createDialog('alert', {
        title: title,
        content: `<p>${message}</p>`,
        onConfirm: () => {
          if (onOk) onOk();
          resolve();
          this.closeDialog(dialog);
        }
      });
      
      this.showDialog(dialog);
    });
  }

  /**
   * 設定ダイアログ表示
   */
  showSettings() {
    const settingsContent = this.createSettingsContent();
    
    const dialog = this.createDialog('settings', {
      content: settingsContent,
      onApply: () => {
        this.applySettings(dialog);
      },
      onCancel: () => {
        this.closeDialog(dialog);
      }
    });
    
    this.showDialog(dialog);
  }

  /**
   * Aboutダイアログ表示
   */
  showAbout() {
    const aboutContent = `
      <div class="about-content">
        <h2>Spine Editor Desktop v2.0</h2>
        <p>A powerful Spine animation editor for desktop</p>
        <div class="about-info">
          <p><strong>Version:</strong> 2.0.0</p>
          <p><strong>Built with:</strong> Electron, Spine WebGL Runtime</p>
          <p><strong>Platform:</strong> ${process.platform}</p>
        </div>
        <div class="about-links">
          <a href="#" onclick="shell.openExternal('https://github.com/your-repo')">GitHub</a>
          <a href="#" onclick="shell.openExternal('https://your-website.com')">Website</a>
        </div>
      </div>
    `;
    
    const dialog = this.createDialog('about', {
      content: aboutContent,
      onClose: () => {
        this.closeDialog(dialog);
      }
    });
    
    this.showDialog(dialog);
  }

  /**
   * ショートカットダイアログ表示
   */
  showShortcuts() {
    const shortcuts = [
      { key: 'Ctrl+O', action: 'Open Project' },
      { key: 'Ctrl+S', action: 'Save Project' },
      { key: 'Ctrl+E', action: 'Export Package' },
      { key: 'V', action: 'Select Tool' },
      { key: 'M', action: 'Move Tool' },
      { key: 'S', action: 'Scale Tool' },
      { key: 'Space', action: 'Play Animation' },
      { key: 'ESC', action: 'Clear Selection' },
      { key: 'F11', action: 'Toggle Fullscreen' },
      { key: 'Ctrl+Z', action: 'Undo' },
      { key: 'Ctrl+Y', action: 'Redo' },
      { key: 'Delete', action: 'Delete Selected' },
      { key: 'Ctrl+D', action: 'Duplicate Selected' }
    ];

    const content = `
      <div class="shortcuts-content">
        <div class="shortcuts-list">
          ${shortcuts.map(s => `
            <div class="shortcut-item">
              <span class="shortcut-key">${s.key}</span>
              <span class="shortcut-action">${s.action}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const dialog = this.createDialog('shortcuts', {
      content: content,
      onClose: () => {
        this.closeDialog(dialog);
      }
    });
    
    this.showDialog(dialog);
  }

  /**
   * カスタムダイアログ表示
   */
  showCustomDialog(options) {
    const dialog = this.createDialog('custom', options);
    this.showDialog(dialog);
    return dialog;
  }

  /**
   * ダイアログ作成
   */
  createDialog(type, options = {}) {
    const template = this.templates.get(type) || {};
    const dialogId = `dialog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const dialog = document.createElement('div');
    dialog.id = dialogId;
    dialog.className = `modal-dialog ${template.size || 'medium'}`;
    
    // ダイアログヘッダー
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <h3 class="modal-title">${options.title || template.title || 'Dialog'}</h3>
      <button class="modal-close" data-action="close">×</button>
    `;

    // ダイアログボディ
    const body = document.createElement('div');
    body.className = 'modal-body';
    body.innerHTML = options.content || '';

    // ダイアログフッター
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    
    const buttons = options.buttons || template.buttons || [];
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.className = `btn ${btn.class}`;
      button.textContent = btn.text;
      button.dataset.action = btn.action;
      footer.appendChild(button);
    });

    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);

    // イベントハンドラー設定
    this.setupDialogHandlers(dialog, options);

    return dialog;
  }

  /**
   * ダイアログハンドラー設定
   */
  setupDialogHandlers(dialog, options) {
    dialog.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (!action) return;

      switch (action) {
        case 'close':
        case 'cancel':
          if (options.onCancel) options.onCancel();
          this.closeDialog(dialog);
          break;
        case 'confirm':
          if (options.onConfirm) options.onConfirm();
          break;
        case 'apply':
          if (options.onApply) options.onApply();
          break;
        default:
          if (options[`on${action.charAt(0).toUpperCase()}${action.slice(1)}`]) {
            options[`on${action.charAt(0).toUpperCase()}${action.slice(1)}`]();
          }
      }
    });
  }

  /**
   * ダイアログ表示
   */
  showDialog(dialog) {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    overlay.appendChild(dialog);
    overlay.classList.remove('hidden');
    
    this.modalStack.push(dialog);
    this.activeDialogs.set(dialog.id, dialog);
    
    // フォーカス設定
    const firstInput = dialog.querySelector('input, select, textarea, button');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }

    console.log(`💬 Dialog shown: ${dialog.id}`);
  }

  /**
   * ダイアログ閉じる
   */
  closeDialog(dialog) {
    if (!dialog || !dialog.parentNode) return;

    dialog.parentNode.removeChild(dialog);
    
    // スタックから削除
    const index = this.modalStack.indexOf(dialog);
    if (index > -1) {
      this.modalStack.splice(index, 1);
    }
    
    this.activeDialogs.delete(dialog.id);

    // オーバーレイ制御
    if (this.modalStack.length === 0) {
      const overlay = document.getElementById('modal-overlay');
      if (overlay) {
        overlay.classList.add('hidden');
      }
    }

    console.log(`💬 Dialog closed: ${dialog.id}`);
  }

  /**
   * 最上位ダイアログを閉じる
   */
  closeTopDialog() {
    if (this.modalStack.length > 0) {
      const topDialog = this.modalStack[this.modalStack.length - 1];
      this.closeDialog(topDialog);
    }
  }

  /**
   * 全てのダイアログを閉じる
   */
  closeAllDialogs() {
    [...this.modalStack].forEach(dialog => {
      this.closeDialog(dialog);
    });
  }

  /**
   * 通知表示
   */
  showNotification(message, type = 'info', duration = null) {
    const notification = this.createNotification(message, type, duration);
    this.displayNotification(notification);
    
    return notification;
  }

  /**
   * 通知作成
   */
  createNotification(message, type, duration) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = this.getNotificationIcon(type);
    notification.innerHTML = `
      <div class="notification-icon">${icon}</div>
      <div class="notification-message">${message}</div>
      <button class="notification-close">×</button>
    `;

    // 自動削除タイマー
    if (duration !== null) {
      const timer = setTimeout(() => {
        this.dismissNotification(notification);
      }, duration || this.config.defaultNotificationDuration);
      
      notification.dataset.timer = timer;
    }

    return notification;
  }

  /**
   * 通知アイコン取得
   */
  getNotificationIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    return icons[type] || icons.info;
  }

  /**
   * 通知表示
   */
  displayNotification(notification) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    // 最大通知数制限
    const existing = container.querySelectorAll('.notification');
    if (existing.length >= this.config.maxNotifications) {
      this.dismissNotification(existing[0]);
    }

    container.appendChild(notification);
    this.notificationQueue.push(notification);

    // アニメーション
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
  }

  /**
   * 通知削除
   */
  dismissNotification(notification) {
    if (!notification || !notification.parentNode) return;

    // タイマークリア
    if (notification.dataset.timer) {
      clearTimeout(parseInt(notification.dataset.timer));
    }

    // アニメーション
    notification.classList.add('dismissing');
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      
      const index = this.notificationQueue.indexOf(notification);
      if (index > -1) {
        this.notificationQueue.splice(index, 1);
      }
    }, 300);
  }

  /**
   * 設定コンテンツ作成
   */
  createSettingsContent() {
    return `
      <div class="settings-content">
        <div class="settings-section">
          <h4>General</h4>
          <label>
            <input type="checkbox" id="setting-auto-save" checked>
            Auto-save projects
          </label>
          <label>
            <input type="checkbox" id="setting-show-grid">
            Show grid by default
          </label>
        </div>
        <div class="settings-section">
          <h4>Viewport</h4>
          <label>
            Background Color:
            <input type="color" id="setting-bg-color" value="#2a2a2a">
          </label>
          <label>
            Zoom Speed:
            <input type="range" id="setting-zoom-speed" min="1" max="10" value="5">
          </label>
        </div>
        <div class="settings-section">
          <h4>Animation</h4>
          <label>
            Default FPS:
            <input type="number" id="setting-fps" min="15" max="60" value="30">
          </label>
          <label>
            <input type="checkbox" id="setting-loop-default">
            Loop animations by default
          </label>
        </div>
      </div>
    `;
  }

  /**
   * 設定適用
   */
  applySettings(dialog) {
    const settings = {
      autoSave: dialog.querySelector('#setting-auto-save')?.checked,
      showGrid: dialog.querySelector('#setting-show-grid')?.checked,
      backgroundColor: dialog.querySelector('#setting-bg-color')?.value,
      zoomSpeed: dialog.querySelector('#setting-zoom-speed')?.value,
      defaultFPS: dialog.querySelector('#setting-fps')?.value,
      loopDefault: dialog.querySelector('#setting-loop-default')?.checked
    };

    // 設定をアプリに適用
    this.app.applySettings(settings);
    
    this.showNotification('Settings applied successfully', 'success');
    this.closeDialog(dialog);
  }

  /**
   * モーダル状態確認
   */
  isModalVisible() {
    return this.modalStack.length > 0;
  }

  /**
   * アクティブなダイアログ取得
   */
  getActiveDialogs() {
    return Array.from(this.activeDialogs.values());
  }

  /**
   * 破棄処理
   */
  destroy() {
    // 全てのダイアログを閉じる
    this.closeAllDialogs();
    
    // 通知を全て削除
    this.notificationQueue.forEach(notification => {
      this.dismissNotification(notification);
    });
    
    // コンテナ削除
    const overlay = document.getElementById('modal-overlay');
    const notificationContainer = document.getElementById('notification-container');
    
    if (overlay) overlay.remove();
    if (notificationContainer) notificationContainer.remove();
    
    // 状態リセット
    this.activeDialogs.clear();
    this.modalStack = [];
    this.notificationQueue = [];
    
    console.log('🗑️ UI Dialogs Manager destroyed');
  }
}

// エクスポート
window.UIDialogsManager = UIDialogsManager;