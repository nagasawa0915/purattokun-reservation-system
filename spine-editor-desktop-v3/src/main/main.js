// 🚀 Spine Editor Desktop v3.0 - Main Process
// Electronメインプロセス：ウィンドウ管理・ファイル操作・システム連携

const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs-extra');

// 🎯 開発モード判定
const isDev = process.argv.includes('--dev');

// ========== ウィンドウ管理 ========== //

let mainWindow;

async function createWindow() {
  console.log('🚀 Spine Editor Desktop v3.0 起動中...');
  
  // メインウィンドウ作成
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'Spine Editor Desktop v3.0',
    icon: path.join(__dirname, '../renderer/assets/icon.png'), // アイコンファイルがあれば
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, '../renderer/preload.js')
    },
    show: false // 準備完了まで非表示
  });

  // HTMLファイル読み込み
  await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // 準備完了後に表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('✅ Spine Editor Desktop v3.0 起動完了');
    
    // 開発モードの場合はDevToolsを開く
    if (isDev) {
      mainWindow.webContents.openDevTools();
      console.log('🔧 開発モード: DevTools有効');
    }
  });

  // ウィンドウクローズ処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ========== アプリケーションライフサイクル ========== //

// アプリ準備完了
app.whenReady().then(async () => {
  await createWindow();
  createApplicationMenu();
  
  console.log('📋 IPC Handlers セットアップ中...');
  setupIPCHandlers();
});

// 全ウィンドウクローズ時
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// アプリアクティベート（macOS）
app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});

// ========== メニューバー ========== //

function createApplicationMenu() {
  const template = [
    {
      label: 'ファイル',
      submenu: [
        {
          label: '新規プロジェクト',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-action', 'new-project');
          }
        },
        {
          label: 'Spineフォルダを開く',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            await selectSpineFolder();
          }
        },
        { type: 'separator' },
        {
          label: 'プロジェクト保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-action', 'save-project');
          }
        },
        {
          label: 'エクスポート',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu-action', 'export-project');
          }
        },
        { type: 'separator' },
        {
          label: '終了',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '編集',
      submenu: [
        {
          label: '元に戻す',
          accelerator: 'CmdOrCtrl+Z',
          click: () => {
            mainWindow.webContents.send('menu-action', 'undo');
          }
        },
        {
          label: 'やり直し',
          accelerator: 'CmdOrCtrl+Y',
          click: () => {
            mainWindow.webContents.send('menu-action', 'redo');
          }
        },
        { type: 'separator' },
        {
          label: '編集モード切り替え',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu-action', 'toggle-edit-mode');
          }
        }
      ]
    },
    {
      label: '表示',
      submenu: [
        {
          label: 'リロード',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: '開発者ツール',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        {
          label: '実際のサイズ',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          }
        },
        {
          label: '拡大',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
          }
        },
        {
          label: '縮小',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
          }
        }
      ]
    },
    {
      label: 'ヘルプ',
      submenu: [
        {
          label: 'Spine Editor Desktop v3.0について',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About',
              message: 'Spine Editor Desktop v3.0',
              detail: 'Spine Character Positioning Editor\\nVersion 3.0.0\\n\\n© 2025 Spine Positioning System'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  
  console.log('📱 アプリケーションメニュー作成完了');
}

// ========== IPC通信ハンドラー ========== //

function setupIPCHandlers() {
  // フォルダ選択ダイアログ
  ipcMain.handle('select-folder', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Spineプロジェクトフォルダを選択',
        properties: ['openDirectory'],
        message: '.atlas, .json, .pngファイルが含まれるフォルダを選択してください'
      });

      if (result.canceled) {
        return null;
      }

      const folderPath = result.filePaths[0];
      console.log('📁 選択されたフォルダ:', folderPath);
      
      return folderPath;
    } catch (error) {
      console.error('❌ フォルダ選択エラー:', error);
      return null;
    }
  });

  // Spineプロジェクト読み込み
  ipcMain.handle('load-spine-project', async (event, folderPath) => {
    try {
      console.log('📦 Spineプロジェクト読み込み開始:', folderPath);
      
      // フォルダ内のファイル一覧取得
      const files = await fs.readdir(folderPath);
      
      // Spineファイルを検出
      const spineFiles = {
        atlas: files.filter(f => f.endsWith('.atlas')),
        json: files.filter(f => f.endsWith('.json')),
        png: files.filter(f => f.endsWith('.png'))
      };
      
      console.log('🔍 検出されたSpineファイル:', spineFiles);
      
      // キャラクター情報を構築
      const characters = [];
      
      for (const jsonFile of spineFiles.json) {
        const baseName = path.basename(jsonFile, '.json');
        const atlasFile = spineFiles.atlas.find(f => f.startsWith(baseName));
        const pngFile = spineFiles.png.find(f => f.startsWith(baseName));
        
        if (atlasFile && pngFile) {
          characters.push({
            name: baseName,
            files: {
              json: path.join(folderPath, jsonFile),
              atlas: path.join(folderPath, atlasFile),
              png: path.join(folderPath, pngFile)
            },
            position: { x: 50, y: 50 }, // デフォルト位置
            scale: 1.0 // デフォルトスケール
          });
        }
      }
      
      console.log(`✅ ${characters.length}個のキャラクターを検出`);
      
      return {
        folderPath,
        characters,
        projectName: path.basename(folderPath)
      };
      
    } catch (error) {
      console.error('❌ Spineプロジェクト読み込みエラー:', error);
      throw error;
    }
  });

  // ファイル保存
  ipcMain.handle('save-file', async (event, { content, defaultPath, filters }) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath,
        filters: filters || [
          { name: 'HTMLファイル', extensions: ['html'] },
          { name: 'すべてのファイル', extensions: ['*'] }
        ]
      });

      if (result.canceled) {
        return null;
      }

      await fs.writeFile(result.filePath, content, 'utf8');
      console.log('💾 ファイル保存完了:', result.filePath);
      
      return result.filePath;
    } catch (error) {
      console.error('❌ ファイル保存エラー:', error);
      throw error;
    }
  });

  // プロジェクトデータ保存
  ipcMain.handle('save-project-data', async (event, projectData) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'プロジェクトを保存',
        defaultPath: 'spine-project.json',
        filters: [
          { name: 'JSONファイル', extensions: ['json'] },
          { name: 'すべてのファイル', extensions: ['*'] }
        ]
      });

      if (result.canceled) {
        return null;
      }

      await fs.writeFile(result.filePath, JSON.stringify(projectData, null, 2), 'utf8');
      console.log('💾 プロジェクトデータ保存完了:', result.filePath);
      
      return result.filePath;
    } catch (error) {
      console.error('❌ プロジェクトデータ保存エラー:', error);
      throw error;
    }
  });

  // ========== ファイル読み込み機能 ========== //
  
  // Spineアセットファイル読み込み
  ipcMain.handle('load-spine-asset', async (event, filePath, assetType) => {
    try {
      console.log(`📁 Spineアセット読み込み: ${assetType} - ${filePath}`);
      
      // ファイル存在確認
      if (!await fs.access(filePath).then(() => true).catch(() => false)) {
        throw new Error(`ファイルが見つかりません: ${filePath}`);
      }
      
      if (assetType === 'atlas' || assetType === 'json') {
        // テキストファイル読み込み
        const content = await fs.readFile(filePath, 'utf8');
        console.log(`✅ ${assetType}ファイル読み込み完了: ${path.basename(filePath)}`);
        return {
          content,
          type: 'text',
          originalPath: filePath
        };
      } else if (assetType === 'png' || assetType === 'jpg' || assetType === 'jpeg') {
        // 画像ファイル読み込み（Base64変換）
        const buffer = await fs.readFile(filePath);
        const base64 = buffer.toString('base64');
        const mimeType = `image/${assetType === 'jpg' ? 'jpeg' : assetType}`;
        const dataUrl = `data:${mimeType};base64,${base64}`;
        
        console.log(`✅ 画像ファイル読み込み完了: ${path.basename(filePath)}`);
        return {
          content: dataUrl,
          type: 'image',
          originalPath: filePath
        };
      } else {
        throw new Error(`未対応のアセットタイプ: ${assetType}`);
      }
      
    } catch (error) {
      console.error(`❌ Spineアセット読み込みエラー (${assetType}):`, error);
      throw error;
    }
  });

  console.log('✅ IPC Handlers セットアップ完了');
}

// ========== ヘルパー関数 ========== //

async function selectSpineFolder() {
  const folderPath = await ipcMain.emit('select-folder');
  if (folderPath) {
    mainWindow.webContents.send('spine-folder-selected', folderPath);
  }
}

console.log('📋 Spine Editor Desktop v3.0 Main Process 初期化完了');