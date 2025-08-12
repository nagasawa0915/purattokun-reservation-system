const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload Script for Spine Editor v2.0
 * セキュアなIPC通信のブリッジ
 */

contextBridge.exposeInMainWorld('electronAPI', {
  // ファイルダイアログ
  openFileDialog: (options) => ipcRenderer.invoke('dialog-open-file', options),
  saveFileDialog: (options) => ipcRenderer.invoke('dialog-save-file', options),
  
  // ファイルシステム操作
  readFile: (filePath) => ipcRenderer.invoke('fs-read-file', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('fs-write-file', filePath, data),
  
  // システム操作
  openPath: (path) => ipcRenderer.invoke('shell-open-item', path),
  
  // メニューイベント受信
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-open-project', callback);
    ipcRenderer.on('menu-save-project', callback);
    ipcRenderer.on('menu-export-package', callback);
  },
  
  // メニューイベント削除
  removeMenuListeners: () => {
    ipcRenderer.removeAllListeners('menu-open-project');
    ipcRenderer.removeAllListeners('menu-save-project'); 
    ipcRenderer.removeAllListeners('menu-export-package');
  }
});

// v2.0デバッグ用（開発時のみ）
if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
  contextBridge.exposeInMainWorld('debugAPI', {
    log: (...args) => console.log('[Preload Debug]', ...args),
    getProcessInfo: () => ({
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      versions: process.versions
    })
  });
}