/**
 * Spine Editor Desktop v2.0 - Export Utilities Module
 * ユーティリティ・共通処理機能
 */

export class ExportUtils {
  constructor() {
    this.fileTypeMap = {
      '.json': 'application/json',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.atlas': 'text/plain',
      '.txt': 'text/plain'
    };
  }

  /**
   * ファイルサイズフォーマット
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * ファイル総サイズ計算
   */
  calculateTotalSize(fileMap) {
    let totalSize = 0;
    for (const content of fileMap.values()) {
      totalSize += this.getContentSize(content);
    }
    return totalSize;
  }

  /**
   * コンテンツサイズ計算
   */
  getContentSize(content) {
    if (typeof content === 'string') {
      return new Blob([content]).size;
    } else if (content instanceof ArrayBuffer) {
      return content.byteLength;
    } else if (content instanceof Uint8Array) {
      return content.length;
    } else {
      return new Blob([content]).size;
    }
  }

  /**
   * バイナリファイル判定
   */
  isBinaryFile(filename) {
    const binaryExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp',  // 画像
      '.zip', '.rar', '.7z', '.tar', '.gz',              // アーカイブ
      '.atlas',                                          // Spineアトラス（バイナリ扱い）
      '.ttf', '.woff', '.woff2', '.eot',                // フォント
      '.exe', '.dll', '.so', '.dylib'                    // 実行ファイル
    ];
    
    const extension = this.getFileExtension(filename).toLowerCase();
    return binaryExtensions.includes(extension);
  }

  /**
   * ファイル拡張子取得
   */
  getFileExtension(filename) {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
  }

  /**
   * MIMEタイプ取得
   */
  getMimeType(filename) {
    const extension = this.getFileExtension(filename).toLowerCase();
    return this.fileTypeMap[extension] || 'application/octet-stream';
  }

  /**
   * ファイル名サニタイズ
   */
  sanitizeFilename(filename) {
    // 危険な文字を安全な文字に置換
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')  // Windows予約文字
      .replace(/[\x00-\x1f]/g, '_')   // 制御文字
      .replace(/^\.+/, '_')           // 先頭ピリオド
      .replace(/\s+/g, '_')           // 空白文字
      .substring(0, 255);             // 長さ制限
  }

  /**
   * 日時フォーマット
   */
  formatDateTime(date = new Date()) {
    return date.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  }

  /**
   * プロジェクト名サニタイズ
   */
  sanitizeProjectName(name) {
    if (!name || typeof name !== 'string') {
      return 'Untitled_Project';
    }
    
    return name
      .trim()
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')  // 英数字とハイフン、アンダースコアのみ
      .replace(/\s+/g, '_')               // 空白をアンダースコアに
      .substring(0, 50)                   // 長さ制限
      || 'Untitled_Project';              // 空の場合のフォールバック
  }

  /**
   * 成功通知データ生成
   */
  createSuccessNotification(filePath, packageData) {
    return {
      title: 'Export Complete!',
      message: `Package exported successfully`,
      details: {
        path: filePath,
        files: packageData.files.size,
        size: this.formatFileSize(packageData.totalSize || 0),
        timestamp: new Date().toLocaleString()
      },
      type: 'success'
    };
  }

  /**
   * エラー通知データ生成
   */
  createErrorNotification(error, context = '') {
    return {
      title: 'Export Failed',
      message: error.message || 'Unknown error occurred',
      details: {
        error: error.name || 'Error',
        context: context,
        timestamp: new Date().toLocaleString(),
        stack: error.stack ? error.stack.split('\n').slice(0, 3) : null
      },
      type: 'error'
    };
  }

  /**
   * プログレス計算
   */
  calculateProgress(completed, total) {
    if (total === 0) return 100;
    return Math.round((completed / total) * 100);
  }

  /**
   * JSON安全パース
   */
  safeJSONParse(jsonString, fallback = null) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('JSON parse failed:', error);
      return fallback;
    }
  }

  /**
   * JSON整形
   */
  formatJSON(obj, minify = false) {
    if (minify) {
      return JSON.stringify(obj);
    } else {
      return JSON.stringify(obj, null, 2);
    }
  }

  /**
   * 文字列省略
   */
  truncateString(str, maxLength = 50) {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }

  /**
   * パス正規化
   */
  normalizePath(path) {
    return path.replace(/\\/g, '/').replace(/\/+/g, '/');
  }

  /**
   * 相対パス変換
   */
  getRelativePath(fromPath, toPath) {
    const from = this.normalizePath(fromPath).split('/');
    const to = this.normalizePath(toPath).split('/');
    
    // 共通部分を探す
    let commonLength = 0;
    for (let i = 0; i < Math.min(from.length, to.length); i++) {
      if (from[i] === to[i]) {
        commonLength++;
      } else {
        break;
      }
    }
    
    // 相対パスを構築
    const upLevels = from.length - commonLength - 1;
    const relativeParts = Array(upLevels).fill('..').concat(to.slice(commonLength));
    
    return relativeParts.join('/') || './';
  }

  /**
   * 重複ファイル名解決
   */
  resolveFilenameConflict(filename, existingFiles) {
    if (!existingFiles.has(filename)) {
      return filename;
    }
    
    const extension = this.getFileExtension(filename);
    const baseName = filename.substring(0, filename.length - extension.length);
    
    let counter = 1;
    let newFilename;
    
    do {
      newFilename = `${baseName}_${counter}${extension}`;
      counter++;
    } while (existingFiles.has(newFilename));
    
    return newFilename;
  }

  /**
   * デバウンス関数
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * スロットル関数
   */
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * リトライ機能付き非同期処理
   */
  async retry(asyncFn, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await asyncFn();
      } catch (error) {
        console.warn(`Attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        // 指数バックオフ
        const waitTime = delay * Math.pow(2, attempt - 1);
        await this.sleep(waitTime);
      }
    }
  }

  /**
   * スリープ関数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * バッチ処理
   */
  async processBatch(items, batchSize, processor) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * ハッシュ生成（簡易版）
   */
  generateSimpleHash(input) {
    let hash = 0;
    if (input.length === 0) return hash.toString();
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit整数に変換
    }
    
    return hash.toString(36);
  }

  /**
   * UUID生成（簡易版）
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * オブジェクトのディープクローン
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item));
    }
    
    if (typeof obj === 'object') {
      const cloned = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }
    
    return obj;
  }

  /**
   * オブジェクトマージ（ディープ）
   */
  deepMerge(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();
    
    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.deepMerge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
    
    return this.deepMerge(target, ...sources);
  }

  /**
   * オブジェクト判定
   */
  isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }

  /**
   * 配列のチャンク分割
   */
  chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 配列の重複削除
   */
  unique(array) {
    return [...new Set(array)];
  }

  /**
   * パフォーマンス測定
   */
  createPerformanceTimer(name) {
    const startTime = performance.now();
    
    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
        return duration;
      },
      
      lap: (lapName) => {
        const lapTime = performance.now();
        const duration = lapTime - startTime;
        console.log(`⏱️ ${name} - ${lapName}: ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  }

  /**
   * メモリ使用量情報（利用可能な場合）
   */
  getMemoryInfo() {
    if (performance.memory) {
      return {
        used: this.formatFileSize(performance.memory.usedJSHeapSize),
        total: this.formatFileSize(performance.memory.totalJSHeapSize),
        limit: this.formatFileSize(performance.memory.jsHeapSizeLimit)
      };
    }
    return null;
  }

  /**
   * エラー情報抽出
   */
  extractErrorInfo(error) {
    return {
      name: error.name || 'Error',
      message: error.message || 'Unknown error',
      stack: error.stack ? error.stack.split('\n').slice(0, 5) : null,
      code: error.code || null,
      errno: error.errno || null,
      path: error.path || null
    };
  }

  /**
   * バージョン比較
   */
  compareVersions(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part < v2part) return -1;
      if (v1part > v2part) return 1;
    }
    
    return 0;
  }

  /**
   * デバッグ情報収集
   */
  collectDebugInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      memory: this.getMemoryInfo(),
      timestamp: new Date().toISOString(),
      url: window.location.href,
      module: 'export-utils',
      version: '2.0.0'
    };
  }
}

// デフォルトエクスポート
export default ExportUtils;