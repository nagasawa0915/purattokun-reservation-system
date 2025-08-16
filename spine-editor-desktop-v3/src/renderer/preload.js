// 🔒 Spine Editor Desktop v3.0 - Preload Script
// セキュアなAPI Bridge：レンダラープロセスとメインプロセス間の通信

const { contextBridge, ipcRenderer } = require('electron');

// 🎯 セキュアなAPI公開
contextBridge.exposeInMainWorld('electronAPI', {
  // ========== ファイル・フォルダ操作 ========== //
  
  // フォルダ選択ダイアログ
  selectFolder: () => {
    console.log('📁 フォルダ選択ダイアログを開く');
    return ipcRenderer.invoke('select-folder');
  },

  // Spineプロジェクト読み込み
  loadSpineProject: (folderPath) => {
    console.log('📦 Spineプロジェクト読み込み:', folderPath);
    return ipcRenderer.invoke('load-spine-project', folderPath);
  },

  // ファイル保存
  saveFile: (options) => {
    console.log('💾 ファイル保存:', options.defaultPath);
    return ipcRenderer.invoke('save-file', options);
  },

  // プロジェクトデータ保存
  saveProjectData: (projectData) => {
    console.log('💾 プロジェクトデータ保存');
    return ipcRenderer.invoke('save-project-data', projectData);
  },

  // Spineアセットファイル読み込み
  loadSpineAsset: (filePath, assetType) => {
    console.log(`📁 Spineアセット読み込み要求: ${assetType}`);
    return ipcRenderer.invoke('load-spine-asset', filePath, assetType);
  },

  // ========== メニューアクション受信 ========== //
  
  // メニューからのアクション受信
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (event, action) => {
      console.log('📱 メニューアクション受信:', action);
      callback(action);
    });
  },

  // メニューアクションリスナー削除
  removeMenuActionListener: () => {
    ipcRenderer.removeAllListeners('menu-action');
  },

  // ========== 通知・イベント ========== //
  
  // Spineフォルダ選択通知受信
  onSpineFolderSelected: (callback) => {
    ipcRenderer.on('spine-folder-selected', (event, folderPath) => {
      console.log('📁 Spineフォルダ選択通知:', folderPath);
      callback(folderPath);
    });
  },

  // ========== アプリケーション情報 ========== //
  
  // アプリケーション情報取得
  getAppInfo: () => {
    return {
      name: 'Spine Editor Desktop v3.0',
      version: '3.0.0',
      platform: process.platform,
      electron: process.versions.electron,
      node: process.versions.node
    };
  },

  // 開発モード判定
  isDev: () => {
    try {
      return process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
    } catch (error) {
      // サンドボックス環境でのアクセスエラーをキャッチ
      return false;
    }
  },

  // ========== ログ出力 ========== //
  
  // メインプロセスにログ送信
  log: (level, message, data = null) => {
    console.log(`[${level.toUpperCase()}] ${message}`, data || '');
    // 必要に応じてメインプロセスにも送信
    // ipcRenderer.send('log', { level, message, data });
  }
});

// ========== セキュリティ強化 ========== //

// 危険な操作の無効化
window.addEventListener('DOMContentLoaded', () => {
  // eval()の無効化
  window.eval = () => {
    throw new Error('eval() is disabled for security reasons');
  };

  // console.log開発環境での有効化
  try {
    if (!window.electronAPI.isDev()) {
      // 本番環境ではconsole.logを制限（必要に応じて）
      // console.log = () => {};
    }
  } catch (error) {
    // isDev関数アクセスエラーをキャッチ
    console.log('🔧 開発モード判定をスキップ');
  }
});

// ========== デバッグ用ヘルパー ========== //

// 開発モードでのみ有効な機能
try {
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    contextBridge.exposeInMainWorld('devAPI', {
      // 開発者向けデバッグ機能
      dumpSpineData: () => {
        console.log('🔍 Spine データダンプ機能（開発モード）');
        // デバッグ用の詳細情報出力
      },
      
      // パフォーマンス測定
      measurePerformance: (label, fn) => {
        console.time(label);
        const result = fn();
        console.timeEnd(label);
        return result;
      }
    });
  }
} catch (error) {
  console.log('🔧 開発モード機能の初期化をスキップ');
}

console.log('🔒 Preload Script 初期化完了 - Secure API Bridge Ready');