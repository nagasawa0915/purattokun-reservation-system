// Spine Editor Desktop v2.0 - HTML Previewer (Phase 0 基盤機能)
// 設計目標: 200行以内の軽量実装 - HTMLファイルプレビュー・ズーム機能

/**
 * HTMLプレビューア - project-loader.jsと連携したプレビュー表示システム
 * 
 * 責任範囲:
 * 1. iframe要素による安全なHTMLファイル表示
 * 2. Blob URLによるローカルファイル読み込み
 * 3. ズーム・パン・フィット機能
 * 4. 4パネル統合・レスポンシブ対応
 */
export class HTMLPreviewer {
  constructor(container) {
    this.container = container;
    this.iframe = null;
    this.zoom = 1.0;
    this.currentURL = null;
    this.currentFile = null;
    this.isLoading = false;
    
    // ズーム制限
    this.minZoom = 0.25;
    this.maxZoom = 4.0;
    this.zoomStep = 0.25;
    
    this.initializeContainer();
    console.log('🖼️ HTMLPreviewer initialized');
  }

  /**
   * コンテナの初期化
   */
  initializeContainer() {
    if (!this.container) {
      throw new Error('Container element is required');
    }
    
    this.container.className = 'html-preview-container';
    this.container.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      background: #f5f5f5;
      border-radius: 4px;
      overflow: hidden;
    `;
    
    this.showWelcomeMessage();
  }

  /**
   * HTMLファイルを表示
   * @param {Object} htmlFile - project-loader.jsから渡されるファイル情報
   */
  async displayHTML(htmlFile) {
    if (!htmlFile || !htmlFile.path) {
      throw new Error('Invalid HTML file provided');
    }

    try {
      this.isLoading = true;
      this.currentFile = htmlFile;
      this.showLoadingState();
      
      console.log('🖼️ Loading HTML file:', htmlFile.name);
      
      // iframe作成（まだ存在しない場合）
      if (!this.iframe) {
        this.createIframe();
      }
      
      // HTMLファイルの内容を読み込み
      const content = await this.loadHTMLContent(htmlFile.path);
      const processedContent = this.processHTMLContent(content, htmlFile.path);
      
      // Blob URLとして安全に表示
      await this.displayContent(processedContent);
      
      this.showContent();
      console.log(`✅ HTML file displayed: ${htmlFile.name}`);
      
      // イベント発火
      this.emit('html-loaded', htmlFile);
      
    } catch (error) {
      console.error('❌ HTML display error:', error);
      this.showError(`Failed to display HTML file: ${error.message}`);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * HTMLファイルの内容を読み込み
   * @param {string} filePath - HTMLファイルパス
   * @returns {Promise<string>} HTMLファイルの内容
   */
  async loadHTMLContent(filePath) {
    try {
      const result = await window.electronAPI.fs.readTextFile(filePath);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to read HTML file');
      }
      
      return result.content;
      
    } catch (error) {
      console.error('❌ HTML content loading error:', error);
      throw error;
    }
  }

  /**
   * HTML内容の前処理（相対パス解決等）
   * @param {string} content - 元のHTML内容
   * @param {string} htmlPath - HTMLファイルのパス
   * @returns {string} 処理済みHTML内容
   */
  processHTMLContent(content, htmlPath) {
    try {
      // ベースディレクトリを取得
      const baseDir = htmlPath.substring(0, htmlPath.lastIndexOf('/')) || htmlPath.substring(0, htmlPath.lastIndexOf('\\'));
      
      // 相対パスを絶対パスに変換（CSS、JS、画像など）
      const processedContent = content.replace(
        /(href|src)=["'](?!http|https|\/\/|data:)([^"']+)["']/g,
        (match, attr, relativePath) => {
          // 相対パスを絶対パスに変換
          const absolutePath = this.resolvePath(baseDir, relativePath);
          const fileUrl = `file://${absolutePath}`;
          return `${attr}="${fileUrl}"`;
        }
      );
      
      return processedContent;
      
    } catch (error) {
      console.warn('⚠️ HTML processing warning:', error.message);
      return content; // 処理失敗時は元の内容を返す
    }
  }

  /**
   * Blob URLとして内容を表示
   * @param {string} processedContent - 処理済みHTML内容
   */
  async displayContent(processedContent) {
    // 既存のBlob URLをクリーンアップ
    if (this.currentURL) {
      URL.revokeObjectURL(this.currentURL);
    }
    
    // 新しいBlob URLを作成
    const blob = new Blob([processedContent], { type: 'text/html;charset=utf-8' });
    this.currentURL = URL.createObjectURL(blob);
    
    // iframeに読み込み
    this.iframe.src = this.currentURL;
    
    // 読み込み完了を待つ
    await this.waitForLoad();
  }

  /**
   * iframe作成
   */
  createIframe() {
    this.iframe = document.createElement('iframe');
    this.iframe.className = 'html-preview-iframe';
    this.iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      background: white;
      transform: scale(${this.zoom});
      transform-origin: top left;
      transition: transform 0.2s ease;
    `;
    
    // セキュリティ属性
    this.iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');
    
    this.container.appendChild(this.iframe);
  }

  /**
   * iframe読み込み完了を待つ
   */
  waitForLoad() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('HTML load timeout'));
      }, 10000); // 10秒タイムアウト
      
      this.iframe.onload = () => {
        clearTimeout(timeout);
        resolve();
      };
      
      this.iframe.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
    });
  }

  // ======================
  // ズーム・ビュー制御
  // ======================

  /**
   * ズームレベル設定
   * @param {number} zoomLevel - ズームレベル（0.25-4.0）
   */
  setZoom(zoomLevel) {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoomLevel));
    
    if (this.iframe) {
      this.iframe.style.transform = `scale(${this.zoom})`;
    }
    
    console.log(`🔍 Zoom set to: ${(this.zoom * 100).toFixed(0)}%`);
  }

  /**
   * ズームイン
   */
  zoomIn() {
    this.setZoom(this.zoom + this.zoomStep);
  }

  /**
   * ズームアウト
   */
  zoomOut() {
    this.setZoom(this.zoom - this.zoomStep);
  }

  /**
   * フィット表示（画面サイズに合わせる）
   */
  fitToView() {
    // 簡単な実装：100%ズーム
    this.setZoom(1.0);
  }

  /**
   * ビューリセット
   */
  resetView() {
    this.setZoom(1.0);
  }

  /**
   * ビューポート情報取得
   */
  getViewportInfo() {
    return {
      zoom: this.zoom,
      containerSize: {
        width: this.container.clientWidth,
        height: this.container.clientHeight
      },
      currentFile: this.currentFile,
      isLoading: this.isLoading
    };
  }

  // ======================
  // UI状態管理
  // ======================

  showWelcomeMessage() {
    this.container.innerHTML = `
      <div class="welcome-message" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #666;
        text-align: center;
        padding: 40px;
      ">
        <div style="font-size: 48px; margin-bottom: 20px;">🖼️</div>
        <h3 style="margin: 0 0 10px 0;">HTML Preview</h3>
        <p style="margin: 0;">Select a project folder to preview HTML files</p>
      </div>
    `;
  }

  showLoadingState() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255,255,255,0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;
    overlay.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 24px; margin-bottom: 10px;">⏳</div>
        <div>Loading HTML...</div>
      </div>
    `;
    
    this.container.appendChild(overlay);
  }

  showContent() {
    // ローディングオーバーレイを削除
    const overlay = this.container.querySelector('.loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="error-display" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #d32f2f;
        text-align: center;
        padding: 40px;
      ">
        <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
        <h3 style="margin: 0 0 10px 0;">Preview Error</h3>
        <p style="margin: 0; word-wrap: break-word;">${message}</p>
        <button onclick="location.reload()" style="
          margin-top: 20px;
          padding: 8px 16px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">Retry</button>
      </div>
    `;
  }

  // ======================
  // ユーティリティ
  // ======================

  /**
   * パス解決
   */
  resolvePath(baseDir, relativePath) {
    // 簡単な実装：基本的な相対パス解決
    if (relativePath.startsWith('./')) {
      return `${baseDir}/${relativePath.substring(2)}`;
    } else if (relativePath.startsWith('../')) {
      // 一つ上のディレクトリ
      const parentDir = baseDir.substring(0, baseDir.lastIndexOf('/')) || baseDir.substring(0, baseDir.lastIndexOf('\\'));
      return `${parentDir}/${relativePath.substring(3)}`;
    } else {
      return `${baseDir}/${relativePath}`;
    }
  }

  /**
   * イベント発火
   */
  emit(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data });
    this.container.dispatchEvent(event);
  }

  /**
   * クリーンアップ・破棄
   */
  destroy() {
    // Blob URLクリーンアップ
    if (this.currentURL) {
      URL.revokeObjectURL(this.currentURL);
    }
    
    // DOM要素クリーンアップ
    if (this.iframe) {
      this.iframe.remove();
    }
    
    // 状態リセット
    this.iframe = null;
    this.currentURL = null;
    this.currentFile = null;
    this.isLoading = false;
    
    console.log('🗑️ HTMLPreviewer destroyed');
  }
}

// デフォルトエクスポート
export default HTMLPreviewer;