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
    console.log('🔧 Starting Spine Server...');
    
    // サーバー起動
    spineServer = new SpineServer(PORT);
    const serverUrl = await spineServer.start();
    
    console.log(`✅ Server started successfully at ${serverUrl}`);
    
    // サーバーの正常動作確認と待機処理（より厳格に）
    await waitForServerReady(serverUrl, 15); // 15回まで試行
    console.log('✅ Server health confirmed, proceeding to window creation...');
    
    // 追加の安全確認：index.htmlの存在確認
    try {
      const http = require('http');
      const testReq = http.request(`${serverUrl}/index.html`, { method: 'HEAD' }, (res) => {
        console.log(`✅ index.html response: ${res.statusCode}`);
      });
      testReq.on('error', (err) => {
        console.warn('⚠️ index.html test failed:', err.message);
      });
      testReq.end();
    } catch (testError) {
      console.warn('⚠️ index.html test error:', testError.message);
    }
    
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
        webSecurity: false, // Spine WebGL対応
        enableRemoteModule: false,
        devTools: true, // DevTools有効化
        // キャッシュ無効化設定
        cache: false,
        partition: isDev ? 'dev-session' : 'default'
      },
      show: false
    });

    // 準備完了時に表示
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      if (isDev) {
        mainWindow.webContents.openDevTools();
        // 開発時は強制リロード
        mainWindow.webContents.reloadIgnoringCache();
      }
    });

    // 読み込みエラーハンドリング設定（loadURL前に設定）
    mainWindow.webContents.on('did-fail-load', async (event, errorCode, errorDescription, validatedURL) => {
      console.error('❌ Failed to load page:', errorCode, errorDescription, validatedURL);
      
      // ERR_ABORTED エラーの場合、より慎重に処理
      if (errorCode === -3 || errorDescription.includes('ERR_ABORTED')) {
        console.log('🔄 ERR_ABORTED detected, checking server status...');
        
        // サーバーの正常性を再確認
        try {
          await waitForServerReady(serverUrl, 3); // 3回まで
          console.log('✅ Server confirmed ready, retrying load...');
          
          // 1秒待機してリトライ
          setTimeout(async () => {
            try {
              console.log(`🔄 Retrying direct index.html load...`);
              await mainWindow.loadURL(`${serverUrl}/index.html`);
            } catch (retryError) {
              console.error('❌ Direct retry failed, trying root fallback:', retryError);
              try {
                await mainWindow.loadURL(serverUrl);
              } catch (fallbackError) {
                console.error('❌ All retry attempts failed:', fallbackError);
                dialog.showErrorBox('Load Failed', `Cannot load application page.\nServer: ${serverUrl}\nPlease restart the application.`);
              }
            }
          }, 1000);
        } catch (serverError) {
          console.error('❌ Server not ready for retry:', serverError);
          dialog.showErrorBox('Server Error', `Server is not responding.\nPlease restart the application.`);
        }
      } else {
        dialog.showErrorBox('Failed to Load', `Cannot load ${validatedURL}\nError: ${errorDescription} (${errorCode})`);
      }
    });

    // ページ読み込み成功確認
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('✅ Page loaded successfully');
    });
    
    // DOM準備完了確認
    mainWindow.webContents.on('dom-ready', () => {
      console.log('✅ DOM ready');
    });
    
    // ナビゲーション設定（セキュリティ対応）
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
      console.log('🌐 Navigation to:', navigationUrl);
      // 同一オリジン内のナビゲーションのみ許可
      if (!navigationUrl.startsWith(serverUrl)) {
        console.log('🚫 External navigation blocked');
        event.preventDefault();
      }
    });
    
    // URLロード - より安全な読み込み手順
    const startUrl = `${serverUrl}/index.html`;
    
    console.log(`🌐 Loading URL: ${startUrl}`);
    
    // ウィンドウが準備完了してから読み込み開始
    const loadWithRetry = async (url, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`🔄 Load attempt ${i + 1}/${retries}: ${url}`);
          await mainWindow.loadURL(url);
          console.log('✅ Load successful');
          return true;
        } catch (error) {
          console.warn(`⚠️ Load attempt ${i + 1} failed:`, error.message);
          if (i < retries - 1) {
            // 次の試行前に少し待機
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      return false;
    };
    
    try {
      // 最初にindex.htmlを試行
      const success = await loadWithRetry(startUrl, 2);
      if (!success) {
        console.log('🔄 index.html failed, trying root URL...');
        const rootSuccess = await loadWithRetry(serverUrl, 2);
        if (!rootSuccess) {
          throw new Error('All load attempts failed');
        }
      }
      console.log('✅ Initial URL load completed');
    } catch (loadError) {
      console.error('❌ All load attempts failed:', loadError);
      throw loadError;
    }
    
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
    
    // サーバーが起動している場合は停止
    if (spineServer) {
      try {
        await spineServer.stop();
        console.log('✅ Server stopped after window creation failure');
      } catch (stopError) {
        console.error('❌ Failed to stop server:', stopError);
      }
    }
    
    // エラーダイアログ表示後にアプリ終了
    dialog.showErrorBox('Startup Failed', `Failed to start Spine Editor:\n${error.message}`);
    app.quit();
  }
}

/**
 * 新しい編集用ウィンドウ作成
 */
async function createNewEditorWindow() {
  try {
    // サーバーURLを取得（既存のspineServerを使用）
    const serverUrl = `http://localhost:${PORT}`;
    
    // 新しいBrowserWindowを作成
    const editorWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../renderer/preload.js'),
        webSecurity: false, // Spine WebGL対応
        enableRemoteModule: false,
        devTools: true,
        // キャッシュ無効化設定
        cache: false,
        partition: isDev ? 'dev-session' : 'default'
      },
      show: false,
      title: 'Spine Editor - New Project'
    });

    // 準備完了時に表示
    editorWindow.once('ready-to-show', () => {
      editorWindow.show();
      if (isDev) {
        editorWindow.webContents.openDevTools();
        // 開発時は強制リロード
        editorWindow.webContents.reloadIgnoringCache();
      }
    });

    // 編集専用画面をロード（editor.html）
    const editorUrl = `${serverUrl}/editor.html`;
    
    await editorWindow.loadURL(editorUrl);
    
    console.log('✅ New editor window created successfully');
    
  } catch (error) {
    console.error('❌ Failed to create new editor window:', error);
    dialog.showErrorBox('Error', `Failed to create new editor window: ${error.message}`);
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
          label: 'Start New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => createNewEditorWindow()
        },
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
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.webContents.reload() },
        { label: 'Hard Reload', accelerator: 'CmdOrCtrl+Shift+R', click: () => mainWindow.webContents.reloadIgnoringCache() }
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
    // Uint8Array（バイナリ）またはstring（テキスト）を自動判定して書き込み
    await fs.promises.writeFile(filePath, data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('shell-open-item', async (event, path) => shell.openPath(path));

// プロジェクトパス設定
ipcMain.handle('server-set-project-path', async (event, projectPath) => {
  if (spineServer) {
    spineServer.setProjectPath(projectPath);
    return { success: true };
  }
  return { success: false, error: 'Server not available' };
});

// ProjectLoader用の追加IPC機能
ipcMain.handle('fs-path-exists', async (event, filePath) => {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle('fs-path-readable', async (event, filePath) => {
  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle('fs-get-file-stats', async (event, filePath) => {
  try {
    const stats = await fs.promises.stat(filePath);
    return {
      success: true,
      size: stats.size,
      mtime: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});


// URL開くためのIPC処理
ipcMain.handle('open-url', async (event, url) => {
  try {
    console.log('🔗 Opening URL:', url);
    
    // 新しいウィンドウでURLを開く
    const editorWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../renderer/preload.js'),
        webSecurity: false,
        enableRemoteModule: false,
        devTools: isDev
      },
      show: false,
      title: 'Spine Editor'
    });
    
    editorWindow.once('ready-to-show', () => {
      editorWindow.show();
      console.log('✅ Editor window opened for URL:', url);
    });
    
    await editorWindow.loadURL(url);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to open URL:', error);
    return { success: false, error: error.message };
  }
});// プロジェクト関連IPC処理
ipcMain.on('menu-new-project', async (event) => {
  console.log('📁 New project requested - creating new editor window');
  await createNewEditorWindow();
});

ipcMain.on('menu-open-project', async (event) => {
  console.log('📂 Open project requested');
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Spine Project Folder',
      properties: ['openDirectory'],
      buttonLabel: 'Select Project'
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const projectPath = result.filePaths[0];
      console.log('📁 Project selected:', projectPath);
      
      // プロジェクトフォルダをスキャンしてSpineファイルを探す
      const scanResult = await scanDirectoryRecursive(projectPath, ['.json', '.atlas']);
      
      if (scanResult.json.length > 0 || scanResult.atlas.length > 0) {
        // Spineファイルが見つかった場合、新しいエディタウィンドウを開く
        const editorWindow = new BrowserWindow({
          width: 1400,
          height: 900,
          minWidth: 1200,
          minHeight: 800,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, '../renderer/preload.js'),
            webSecurity: false,
            enableRemoteModule: false,
            devTools: true,
            // キャッシュ無効化設定
            cache: false,
            partition: isDev ? 'dev-session' : 'default'
          },
          show: false,
          title: `Spine Editor - ${path.basename(projectPath)}`
        });

        editorWindow.once('ready-to-show', () => {
          editorWindow.show();
          if (isDev) {
            editorWindow.webContents.openDevTools();
            // 開発時は強制リロード
            editorWindow.webContents.reloadIgnoringCache();
          }
        });

        const editorUrl = `http://localhost:${PORT}/editor.html?project=${encodeURIComponent(projectPath)}`;
        await editorWindow.loadURL(editorUrl);
      } else {
        // Spineファイルが見つからない場合、警告表示
        dialog.showMessageBox(mainWindow, {
          type: 'warning',
          title: 'No Spine Files Found',
          message: 'The selected folder does not contain Spine files (.json or .atlas).',
          detail: 'Please select a folder containing Spine project files.',
          buttons: ['OK']
        });
      }
    }
  } catch (error) {
    console.error('❌ Failed to open project:', error);
    dialog.showErrorBox('Error', `Failed to open project: ${error.message}`);
  }
});

// ファイルシステムスキャン - 再帰的フォルダ検索
ipcMain.handle('fs-scan-directory', async (event, folderPath, extensions = ['.json', '.atlas']) => {
  try {
    const result = await scanDirectoryRecursive(folderPath, extensions);
    return { success: true, files: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * フォルダを再帰的にスキャンして指定拡張子のファイルを検索
 */
async function scanDirectoryRecursive(dirPath, extensions) {
  const foundFiles = { json: [], atlas: [], png: [], html: [] };
  
  async function scanDir(currentPath) {
    try {
      const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          // サブディレクトリを再帰的にスキャン
          await scanDir(fullPath);
        } else if (entry.isFile()) {
          // ファイル拡張子をチェック
          const ext = path.extname(entry.name).toLowerCase();
          
          if (ext === '.json') {
            foundFiles.json.push(fullPath);
          } else if (ext === '.atlas') {
            foundFiles.atlas.push(fullPath);
          } else if (ext === '.png') {
            foundFiles.png.push(fullPath);
          } else if (ext === '.html') {
            foundFiles.html.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn('Directory scan warning:', currentPath, error.message);
    }
  }
  
  await scanDir(dirPath);
  return foundFiles;
}

// アプリケーションライフサイクル
app.whenReady().then(() => {
  console.log('🚀 Spine Editor v2.0 starting...');
  console.log('📁 Renderer path:', path.join(__dirname, '../renderer'));
  console.log('⚙️ Development mode:', isDev);
  console.log('🔧 Target port:', PORT);
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

/**
 * サーバー正常動作確認関数
 */
function waitForServerReady(serverUrl, maxRetries = 10) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    
    const checkServer = () => {
      const http = require('http');
      const url = require('url');
      const parsedUrl = url.parse(serverUrl);
      
      const options = {
        hostname: '127.0.0.1', // IPv4で明示的に指定
        port: parsedUrl.port,
        path: '/health',
        method: 'GET',
        timeout: 2000
      };
      
      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          console.log('✅ Server health check passed');
          resolve();
        } else {
          console.warn(`⚠️ Server health check failed: ${res.statusCode}`);
          retryCheck();
        }
      });
      
      req.on('error', (err) => {
        console.warn(`⚠️ Server not ready (${retries + 1}/${maxRetries}):`, err.message);
        retryCheck();
      });
      
      req.on('timeout', () => {
        console.warn(`⚠️ Server health check timeout (${retries + 1}/${maxRetries})`);
        req.destroy();
        retryCheck();
      });
      
      req.end();
    };
    
    const retryCheck = () => {
      retries++;
      if (retries >= maxRetries) {
        reject(new Error(`Server not ready after ${maxRetries} attempts`));
      } else {
        setTimeout(checkServer, 300); // 300ms待機してリトライ
      }
    };
    
    checkServer();
  });
}