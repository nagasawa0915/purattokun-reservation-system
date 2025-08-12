// Spine Editor Desktop v2.0 - Lightweight Main Process
const { app, BrowserWindow, dialog, ipcMain, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const SpineServer = require('./server');

// アプリケーション状態
let mainWindow = null;
let spineServer = null;
const isDev = process.argv.includes('--dev');
const PORT = 8081;

/**
 * メインウィンドウ作成
 */
async function createMainWindow() {
  try {
    // サーバー起動
    spineServer = new SpineServer(PORT);
    const serverUrl = await spineServer.start();
    
    // ウィンドウ作成
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../renderer/preload.js'),
        webSecurity: false // Spine WebGL対応
      },
      show: false
    });

    // 準備完了時に表示
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      if (isDev) mainWindow.webContents.openDevTools();
    });

    // URLロード
    await mainWindow.loadURL(serverUrl);
    
    // クローズ処理
    mainWindow.on('closed', async () => {
      mainWindow = null;
      if (spineServer) {
        await spineServer.stop();
        spineServer = null;
      }
    });

    // メニュー設定
    createMenu();
    
  } catch (error) {
    console.error('❌ Failed to create main window:', error);
    app.quit();
  }
}

/**
 * シンプルメニュー作成
 */
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Project...',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow.webContents.send('menu-open-project')
        },
        {
          label: 'Save Project',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('menu-save-project')
        },
        { type: 'separator' },
        {
          label: 'Export Package...',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow.webContents.send('menu-export-package')
        },
        { type: 'separator' },
        { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'DevTools', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() },
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.webContents.reload() }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// 軽量IPC通信
ipcMain.handle('dialog-open-file', async (event, options) => 
  await dialog.showOpenDialog(mainWindow, options)
);

ipcMain.handle('dialog-save-file', async (event, options) => 
  await dialog.showSaveDialog(mainWindow, options)
);

ipcMain.handle('fs-read-file', async (event, filePath) => {
  try {
    return { success: true, data: await fs.promises.readFile(filePath, 'utf8') };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs-write-file', async (event, filePath, data) => {
  try {
    await fs.promises.writeFile(filePath, data, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('shell-open-item', async (event, path) => shell.openPath(path));

// アプリケーションライフサイクル
app.whenReady().then(() => {
  console.log('🚀 Spine Editor v2.0 starting...');
  createMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

app.on('before-quit', async () => {
  if (spineServer) {
    await spineServer.stop();
  }
});