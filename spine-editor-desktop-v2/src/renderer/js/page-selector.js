// Spine Editor Desktop v2.0 - Page Selector (Phase 0 基盤機能)
// 設計目標: 100行以内の軽量実装 - ページ選択ドロップダウン・ページ切り替え制御

/**
 * ページセレクター - HTML-firstワークフローの重要コンポーネント
 * 
 * 責任範囲:
 * 1. HTMLファイル一覧のドロップダウンUI
 * 2. ページ選択時の切り替え制御
 * 3. project-loader・html-previewerとの連携
 * 4. 選択状態の管理と視覚的フィードバック
 */
export class PageSelector {
  constructor(container) {
    this.container = container;
    this.dropdown = null;
    this.currentFile = null;
    this.fileList = [];
    this.callbacks = new Map();
    
    this.initializeContainer();
    console.log('📋 PageSelector initialized');
  }

  /**
   * コンテナの初期化
   */
  initializeContainer() {
    if (!this.container) {
      throw new Error('Container element is required');
    }
    
    this.container.className = 'page-selector-container';
    this.container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      background: #f8f9fa;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    `;
    
    this.showPlaceholder();
  }

  /**
   * ファイル一覧を設定してドロップダウンを描画
   * @param {Array} htmlFiles - project-loader.jsから提供されるファイル一覧
   * @param {Object} defaultFile - デフォルト選択ファイル
   */
  loadFileList(htmlFiles, defaultFile = null) {
    this.fileList = htmlFiles || [];
    
    if (this.fileList.length === 0) {
      this.showPlaceholder();
      return;
    }
    
    this.createDropdown();
    
    // デフォルト選択
    const targetFile = defaultFile || this.fileList[0];
    this.setSelection(targetFile);
    
    console.log(`📋 Loaded ${this.fileList.length} HTML files`);
  }

  /**
   * ドロップダウンUI作成
   */
  createDropdown() {
    // 既存要素をクリア
    this.container.innerHTML = '';
    
    // ラベル
    const label = document.createElement('label');
    label.textContent = 'Page:';
    label.style.cssText = 'font-weight: 600; color: #333; font-size: 14px;';
    
    // ドロップダウン
    this.dropdown = document.createElement('select');
    this.dropdown.className = 'page-selector-dropdown';
    this.dropdown.style.cssText = `
      padding: 6px 10px;
      font-size: 14px;
      border: 1px solid #ccc;
      border-radius: 3px;
      background: white;
      min-width: 200px;
      cursor: pointer;
    `;

    // オプション追加
    this.fileList.forEach(file => {
      const option = document.createElement('option');
      option.value = file.path;
      option.textContent = this.formatDisplayName(file);
      this.dropdown.appendChild(option);
    });

    // 変更イベント
    this.dropdown.addEventListener('change', (e) => {
      const selectedFile = this.fileList.find(f => f.path === e.target.value);
      this.handleSelection(selectedFile);
    });

    this.container.appendChild(label);
    this.container.appendChild(this.dropdown);
  }

  /**
   * ファイル選択処理
   * @param {Object} file - 選択されたファイル
   */
  handleSelection(file) {
    if (!file || file === this.currentFile) return;
    
    this.currentFile = file;
    console.log(`📋 Page selected: ${file.name}`);
    
    // コールバック実行
    this.emit('page-selected', file);
  }

  /**
   * 選択状態を設定
   * @param {Object} file - 選択するファイル
   */
  setSelection(file) {
    if (!file || !this.dropdown) return;
    
    this.dropdown.value = file.path;
    this.currentFile = file;
    
    // 初回選択時はイベント発火
    this.emit('page-selected', file);
  }

  /**
   * 表示名フォーマット
   * @param {Object} file - ファイル情報
   * @returns {string} 表示用文字列
   */
  formatDisplayName(file) {
    const displayName = file.displayName || file.name;
    const suffix = file.isIndex ? ' (Index)' : '';
    return `${displayName}${suffix}`;
  }

  /**
   * プレースホルダー表示
   */
  showPlaceholder() {
    this.container.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        gap: 8px;
        color: #666;
        font-size: 14px;
      ">
        <span>📁</span>
        <span>No project loaded</span>
      </div>
    `;
  }

  // ======================
  // API・ゲッター
  // ======================

  getCurrentFile() {
    return this.currentFile;
  }

  getFileList() {
    return [...this.fileList];
  }

  hasFiles() {
    return this.fileList.length > 0;
  }

  /**
   * イベントリスナー登録
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック関数
   */
  onSelectionChange(callback) {
    this.on('page-selected', callback);
  }

  on(event, callback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event).push(callback);
  }

  off(event, callback) {
    if (this.callbacks.has(event)) {
      const callbacks = this.callbacks.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * イベント発火
   */
  emit(event, data) {
    if (this.callbacks.has(event)) {
      this.callbacks.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ PageSelector event error (${event}):`, error);
        }
      });
    }
  }

  /**
   * クリーンアップ
   */
  destroy() {
    this.dropdown = null;
    this.currentFile = null;
    this.fileList = [];
    this.callbacks.clear();
    
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    console.log('🗑️ PageSelector destroyed');
  }
}

// デフォルトエクスポート
export default PageSelector;