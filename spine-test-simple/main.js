const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // デバッグ用のウィンドウを作成
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false, // ローカルファイルアクセスのため
    },
    show: false
  });

  // index.htmlをロード
  mainWindow.loadFile('index.html');

  // 開発者ツールを自動で開く
  mainWindow.webContents.openDevTools();

  // ウィンドウの準備ができたら表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('✅ Electron window ready');
  });

  // Spine関連のログを監視
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message}`);
  });
}

// アプリの準備ができたらウィンドウを作成
app.whenReady().then(createWindow);

// すべてのウィンドウが閉じられた時の処理
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

console.log('✅ Electron app starting...');
