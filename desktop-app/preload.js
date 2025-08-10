// 🎯 Spine Character Position Editor - Preload Script
// セキュアAPI公開 - レンダラープロセスとメインプロセス間の安全な通信
// 作成日: 2025-08-10

const { contextBridge, ipcRenderer } = require('electron');

// セキュリティチェック
if (!contextBridge || !ipcRenderer) {
  throw new Error('セキュリティエラー: contextBridgeまたはipcRendererが利用できません');
}

console.log('🔗 Spine Editor Preload - セキュアAPI初期化開始');

/**
 * レンダラープロセスにElectron APIを公開
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // =========================
  // プロジェクト管理API
  // =========================
  
  project: {
    /**
     * 新規プロジェクト作成
     * @param {string} name - プロジェクト名
     * @param {string} template - テンプレート名
     */
    create: (name, template = 'default') => 
      ipcRenderer.invoke('project:create', name, template),
    
    /**
     * プロジェクト読み込み
     * @param {string} filePath - ファイルパス（省略時はダイアログ表示）
     */
    load: (filePath = null) => 
      ipcRenderer.invoke('project:load', filePath),
    
    /**
     * プロジェクト保存
     * @param {object} projectData - プロジェクトデータ
     * @param {string} filePath - 保存先パス（省略時はダイアログ表示）
     */
    save: (projectData, filePath = null) => 
      ipcRenderer.invoke('project:save', projectData, filePath),
    
    /**
     * プロジェクトエクスポート
     * @param {object} projectData - プロジェクトデータ
     * @param {string} format - 出力形式
     * @param {object} options - オプション
     */
    export: (projectData, format, options = {}) => 
      ipcRenderer.invoke('project:export', projectData, format, options)
  },

  // =========================
  // ダイアログAPI
  // =========================
  
  dialog: {
    /**
     * ファイルオープンダイアログ表示
     * @param {object} options - ダイアログオプション
     */
    openFile: (options = {}) => 
      ipcRenderer.invoke('dialog:openFile', options),
    
    /**
     * ファイル保存ダイアログ表示
     * @param {object} options - ダイアログオプション
     */
    saveFile: (options = {}) => 
      ipcRenderer.invoke('dialog:saveFile', options),
    
    /**
     * フォルダー選択ダイアログ表示
     * @param {object} options - ダイアログオプション
     */
    selectFolder: (options = {}) => 
      ipcRenderer.invoke('dialog:selectFolder', options)
  },

  // =========================
  // システム統合API
  // =========================
  
  system: {
    /**
     * 外部アプリケーション/URLを開く
     * @param {string} url - URLまたはファイルパス
     */
    openExternal: (url) => 
      ipcRenderer.invoke('system:openExternal', url),
    
    /**
     * システム通知表示
     * @param {object} options - 通知オプション
     */
    showNotification: (options) => 
      ipcRenderer.invoke('system:showNotification', options)
  },

  // =========================
  // HTMLビュー管理API
  // =========================
  
  htmlView: {
    /**
     * HTMLページ読み込み
     * @param {string} pageUrl - ページURL（ローカル/リモート）
     */
    loadPage: (pageUrl) => 
      ipcRenderer.invoke('htmlview:loadPage', pageUrl),
    
    /**
     * ローカルHTMLファイル一覧取得
     * @param {string} directory - 検索ディレクトリ
     */
    getLocalFiles: (directory = null) => 
      ipcRenderer.invoke('htmlview:getLocalFiles', directory),
    
    /**
     * サーバーステータス確認
     */
    checkServerStatus: () => 
      ipcRenderer.invoke('htmlview:checkServerStatus'),
    
    /**
     * サーバー起動
     */
    startServer: () => 
      ipcRenderer.invoke('htmlview:startServer')
  },

  // =========================
  // メニューイベントAPI
  // =========================
  
  menu: {
    /**
     * メニューイベントリスナー登録
     * @param {string} eventName - イベント名
     * @param {function} callback - コールバック関数
     */
    on: (eventName, callback) => {
      const validEvents = [
        'menu:new-project',
        'menu:open-project', 
        'menu:save-project',
        'menu:save-as-project'
      ];
      
      if (validEvents.includes(eventName)) {
        ipcRenderer.on(eventName, callback);
      } else {
        console.warn(`無効なメニューイベント: ${eventName}`);
      }
    },
    
    /**
     * メニューイベントリスナー削除
     * @param {string} eventName - イベント名
     * @param {function} callback - コールバック関数
     */
    off: (eventName, callback) => {
      ipcRenderer.removeListener(eventName, callback);
    },
    
    /**
     * 全メニューイベントリスナー削除
     */
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('menu:new-project');
      ipcRenderer.removeAllListeners('menu:open-project');
      ipcRenderer.removeAllListeners('menu:save-project');
      ipcRenderer.removeAllListeners('menu:save-as-project');
    }
  },

  // =========================
  // 🚀 アプリケーション管理API
  // =========================
  
  app: {
    /**
     * ハードリロード（キャッシュクリア + ページリロード）
     */
    hardReload: () => 
      ipcRenderer.invoke('app:hardReload'),
    
    /**
     * キャッシュクリア（リロードなし）
     */
    clearCache: () => 
      ipcRenderer.invoke('app:clearCache'),
    
    /**
     * 強制リフレッシュ（ファイル再読み込み）
     */
    forceRefresh: () => 
      ipcRenderer.invoke('app:forceRefresh')
  },

  // =========================
  // 🧹 キャッシュ管理API
  // =========================
  
  cache: {
    /**
     * キャッシュクリア
     */
    clear: () => 
      ipcRenderer.invoke('cache:clear'),
    
    /**
     * ハードリロード
     */
    reload: () => 
      ipcRenderer.invoke('cache:reload')
  },

  // =========================
  // 🔍 開発者ツール制御API
  // =========================
  
  devtools: {
    /**
     * 開発者ツール切り替え
     */
    toggle: () => 
      ipcRenderer.invoke('devtools:toggle'),
    
    /**
     * 開発者ツールを開く
     */
    open: () => 
      ipcRenderer.invoke('devtools:open'),
    
    /**
     * 開発者ツールを閉じる
     */
    close: () => 
      ipcRenderer.invoke('devtools:close')
  },

  // =========================
  // ユーティリティAPI
  // =========================
  
  utils: {
    /**
     * プラットフォーム情報取得
     */
    getPlatform: () => process.platform,
    
    /**
     * 環境情報取得
     */
    getEnvironment: () => ({
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome
    }),
    
    /**
     * 開発モード判定
     */
    isDevelopment: () => {
      return process.env.NODE_ENV === 'development' || 
             process.argv.includes('--development');
    },
    
    /**
     * ログ出力（開発時のみ）
     * @param {string} level - ログレベル
     * @param {any} message - メッセージ
     */
    log: (level, message) => {
      const isDev = process.env.NODE_ENV === 'development' || 
                   process.argv.includes('--development');
      
      if (isDev) {
        console[level] && console[level](message);
      }
    }
  }
});

// =========================
// グローバルエラーハンドリング
// =========================

// レンダラープロセスでの未処理エラーをキャッチ
window.addEventListener('error', (event) => {
  console.error('レンダラープロセスエラー:', event.error);
  
  // メインプロセスにエラーを通知（ログ目的）
  ipcRenderer.send('renderer-error', {
    message: event.error.message,
    stack: event.error.stack,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('未処理のPromise拒否:', event.reason);
  
  // メインプロセスにエラーを通知
  ipcRenderer.send('renderer-promise-rejection', {
    reason: event.reason
  });
});

// =========================
// 初期化完了通知
// =========================

// DOM読み込み完了時にAPI準備完了を通知
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ Spine Editor API 準備完了');
  console.log('📊 API利用可能状況:', {
    project: !!window.electronAPI?.project,
    dialog: !!window.electronAPI?.dialog,
    system: !!window.electronAPI?.system,
    menu: !!window.electronAPI?.menu,
    utils: !!window.electronAPI?.utils
  });
  
  // レンダラープロセスにAPI準備完了を通知
  window.dispatchEvent(new CustomEvent('electron-api-ready', {
    detail: {
      api: window.electronAPI,
      timestamp: new Date().toISOString()
    }
  }));
  
  console.log('🚀 electron-api-ready イベント送信完了');
});

// 初期化情報ログ
console.log('✅ Spine Editor Preload - セキュアAPI公開完了');
console.log(`   プラットフォーム: ${process.platform}`);
console.log(`   Node.js: ${process.version}`);
console.log(`   Electron: ${process.versions.electron}`);
console.log(`   Chrome: ${process.versions.chrome}`);

// preloadスクリプト読み込み完了マーカー
window.__SPINE_EDITOR_PRELOAD_LOADED__ = true;
window.__SPINE_EDITOR_PRELOAD_VERSION__ = '1.0.0';
window.__SPINE_EDITOR_PRELOAD_TIMESTAMP__ = new Date().toISOString();