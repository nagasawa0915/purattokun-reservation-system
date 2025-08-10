// 🎯 Spine Character Position Editor - Main Process
// Electronメインプロセス - Mac・Windows両対応
// 作成日: 2025-08-10

const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const LocalServerManager = require('./start-server.js');

// 開発モード判定（デフォルトで開発者ツールを有効化）
const isDevelopment = process.env.NODE_ENV === 'development' || process.argv.includes('--development') || process.env.ENABLE_DEVTOOLS !== 'false';

class SpineEditorMain {
  constructor() {
    this.mainWindow = null;
    this.serverManager = new LocalServerManager();
    this.setupEventHandlers();
    this.setupMenu();
  }

  /**
   * メインウィンドウ作成
   */
  createMainWindow() {
    // ウィンドウ設定（Mac・Windows両対応）
    const windowOptions = {
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      webPreferences: {
        // セキュリティ設定
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        webSecurity: true,
        webviewTag: true,
        preload: path.join(__dirname, 'preload.js'),
        // 🚀 キャッシュ無効化設定（開発時）
        cache: !isDevelopment,
        devTools: true  // 常に開発者ツールを有効化
      },
      show: false, // 最適化のため初期は非表示
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
    };

    this.mainWindow = new BrowserWindow(windowOptions);

    // レンダラープロセス読み込み
    // テストモードの場合は最小テストページを読み込み
    const rendererFile = process.argv.includes('--test') ? 'test-minimal.html' : 'index.html';
    const rendererPath = path.join(__dirname, 'renderer', rendererFile);
    
    console.log(`🔄 レンダラープロセス読み込み: ${rendererFile}`);
    
    // 🚀 キャッシュ無効化のためのURLパラメータ追加
    const timestamp = new Date().getTime();
    const fileUrl = `file://${rendererPath.replace(/\\/g, '/')}?nocache=${timestamp}`;
    
    if (isDevelopment || process.argv.includes('--nocache')) {
      console.log('🔄 キャッシュ無効化モードでファイルを読み込み:', fileUrl);
      this.mainWindow.loadURL(fileUrl);
    } else {
      this.mainWindow.loadFile(rendererPath);
    }

    // 表示最適化
    this.mainWindow.once('ready-to-show', () => {
      console.log('📺 メインウィンドウ表示準備完了');
      this.mainWindow.show();
      
      // 🚀 開発モードでのキャッシュクリア
      if (isDevelopment || process.argv.includes('--nocache')) {
        console.log('🔄 開発モード: Session キャッシュをクリア中...');
        this.mainWindow.webContents.session.clearCache(() => {
          console.log('✅ Session キャッシュクリア完了');
        });
        
        // ストレージデータもクリア
        this.mainWindow.webContents.session.clearStorageData({
          storages: ['appcache', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'websql', 'serviceworkers', 'cachestorage']
        }, () => {
          console.log('✅ ストレージデータクリア完了');
        });
      }
      
      // 🔍 自動で開発者ツールを開く（常時有効）
      console.log('🔍 開発者ツールを自動で開いています（F12でも切り替え可能）');
      this.mainWindow.webContents.openDevTools();
    });

    // レンダラープロセスのエラーをキャッチ
    this.mainWindow.webContents.on('crashed', () => {
      console.error('🚨 レンダラープロセスがクラッシュしました');
    });

    // レンダラープロセスからのログを受信
    ipcMain.on('renderer-error', (event, errorData) => {
      console.error('🚨 レンダラーエラー:', errorData);
    });

    ipcMain.on('renderer-promise-rejection', (event, errorData) => {
      console.error('🚨 レンダラーPromise拒否:', errorData);
    });

    // ウィンドウ閉じる処理
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    console.log('✅ メインウィンドウ作成完了');
  }

  /**
   * イベントハンドラーセットアップ
   */
  setupEventHandlers() {
    // アプリケーション準備完了
    app.whenReady().then(async () => {
      // ローカルサーバー自動起動
      console.log('🔄 ローカルサーバー起動チェック...');
      const serverResult = await this.serverManager.startServer();
      if (serverResult.success) {
        console.log('✅ ローカルサーバー準備完了:', serverResult.message);
      } else {
        console.warn('⚠️ ローカルサーバー起動失敗:', serverResult.error);
        console.log('💡 フォールバック情報:', serverResult.fallbackMessage);
      }
      
      this.createMainWindow();
      console.log('🚀 Spine Character Position Editor 起動完了');
    });

    // 全ウィンドウが閉じられた時
    app.on('window-all-closed', () => {
      // ローカルサーバー停止
      if (this.serverManager) {
        this.serverManager.stopServer();
      }
      
      // macOSでは通常アプリを終了しない
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // アプリがアクティブになった時（macOS）
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    // 🚀 ハードリロード機能の追加
    ipcMain.handle('app:hardReload', this.handleHardReload.bind(this));
    ipcMain.handle('app:clearCache', this.handleClearCache.bind(this));
    ipcMain.handle('app:forceRefresh', this.handleForceRefresh.bind(this));
    
    // 🔍 開発者ツール制御機能の追加
    ipcMain.handle('devtools:toggle', this.handleToggleDevTools.bind(this));
    ipcMain.handle('devtools:open', this.handleOpenDevTools.bind(this));
    ipcMain.handle('devtools:close', this.handleCloseDevTools.bind(this));

    // IPC通信ハンドラーセットアップ
    this.setupIpcHandlers();
  }

  /**
   * IPC通信ハンドラーセットアップ
   */
  setupIpcHandlers() {
    // プロジェクト管理
    ipcMain.handle('project:create', this.handleProjectCreate.bind(this));
    ipcMain.handle('project:load', this.handleProjectLoad.bind(this));
    ipcMain.handle('project:save', this.handleProjectSave.bind(this));
    ipcMain.handle('project:export', this.handleProjectExport.bind(this));
    
    // ファイルダイアログ
    ipcMain.handle('dialog:openFile', this.handleOpenFileDialog.bind(this));
    ipcMain.handle('dialog:saveFile', this.handleSaveFileDialog.bind(this));
    ipcMain.handle('dialog:selectFolder', this.handleSelectFolderDialog.bind(this));
    
    // システム統合
    ipcMain.handle('system:openExternal', this.handleOpenExternal.bind(this));
    ipcMain.handle('system:showNotification', this.handleShowNotification.bind(this));
    
    // HTMLビュー管理
    ipcMain.handle('htmlview:loadPage', this.handleLoadHtmlPage.bind(this));
    ipcMain.handle('htmlview:getLocalFiles', this.handleGetLocalFiles.bind(this));
    ipcMain.handle('htmlview:checkServerStatus', this.handleCheckServerStatus.bind(this));
    ipcMain.handle('htmlview:startServer', this.handleStartServer.bind(this));
    
    // 🚀 キャッシュ管理
    ipcMain.handle('cache:clear', this.handleClearCache.bind(this));
    ipcMain.handle('cache:reload', this.handleHardReload.bind(this));

    console.log('🔗 IPC通信ハンドラーセットアップ完了（キャッシュ管理機能含む）');
  }

  /**
   * メニューバーセットアップ
   */
  setupMenu() {
    const template = this.createMenuTemplate();
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  /**
   * メニューテンプレート作成
   */
  createMenuTemplate() {
    const isMac = process.platform === 'darwin';
    
    const template = [
      // macOSの場合、アプリメニューを追加
      ...(isMac ? [{
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideothers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }] : []),
      
      // Fileメニュー
      {
        label: 'File',
        submenu: [
          {
            label: 'New Project...',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.handleMenuNewProject()
          },
          {
            label: 'Open Project...',
            accelerator: 'CmdOrCtrl+O',
            click: () => this.handleMenuOpenProject()
          },
          { type: 'separator' },
          {
            label: 'Save',
            accelerator: 'CmdOrCtrl+S',
            click: () => this.handleMenuSaveProject()
          },
          {
            label: 'Save As...',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => this.handleMenuSaveAsProject()
          },
          { type: 'separator' },
          ...(isMac ? [] : [{ role: 'quit' }])
        ]
      },
      
      // Editメニュー
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectall' }
        ]
      },
      
      // Viewメニュー
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          {
            label: '🚀 ハードリロード（キャッシュクリア）',
            accelerator: 'CmdOrCtrl+Shift+R',
            click: () => this.handleHardReload()
          },
          {
            label: '🧹 全キャッシュクリア',
            click: () => this.handleClearCache()
          },
          { type: 'separator' },
          { 
            role: 'toggleDevTools',
            label: '🔍 開発者ツールを切り替え',
            accelerator: 'F12'
          },
          {
            label: '🔍 開発者ツールを開く',
            accelerator: 'CmdOrCtrl+Shift+I',
            click: () => {
              if (this.mainWindow) {
                console.log('🔍 開発者ツール強制オープン');
                this.mainWindow.webContents.openDevTools();
              }
            }
          },
          {
            label: '🔍 開発者ツールを閉じる',
            click: () => {
              if (this.mainWindow) {
                console.log('🔍 開発者ツール閉じる');
                this.mainWindow.webContents.closeDevTools();
              }
            }
          },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      
      // Windowメニュー
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' },
          ...(isMac ? [
            { type: 'separator' },
            { role: 'front' }
          ] : [])
        ]
      }
    ];

    return template;
  }

  // =========================
  // 🚀 キャッシュ管理機能
  // =========================
  
  /**
   * ハードリロード（キャッシュクリア + ページリロード）
   */
  async handleHardReload(event) {
    try {
      console.log('🚀 ハードリロード実行開始...');
      
      if (!this.mainWindow) {
        console.warn('⚠️ メインウィンドウが存在しません');
        return { success: false, error: 'メインウィンドウが存在しません' };
      }
      
      // 1. セッションキャッシュをクリア
      await new Promise((resolve) => {
        this.mainWindow.webContents.session.clearCache(() => {
          console.log('✅ Session キャッシュクリア完了');
          resolve();
        });
      });
      
      // 2. ストレージデータをクリア
      await new Promise((resolve) => {
        this.mainWindow.webContents.session.clearStorageData({
          storages: ['appcache', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'websql', 'serviceworkers', 'cachestorage']
        }, () => {
          console.log('✅ ストレージデータクリア完了');
          resolve();
        });
      });
      
      // 3. ページを再読み込み（タイムスタンプ付きURL）
      const rendererFile = process.argv.includes('--test') ? 'test-minimal.html' : 'index.html';
      const rendererPath = path.join(__dirname, 'renderer', rendererFile);
      const timestamp = new Date().getTime();
      const fileUrl = `file://${rendererPath.replace(/\\/g, '/')}?nocache=${timestamp}`;
      
      console.log('🔄 キャッシュ無効化URL:', fileUrl);
      await this.mainWindow.loadURL(fileUrl);
      
      console.log('✅ ハードリロード完了');
      return { success: true, message: 'ハードリロードが完了しました' };
      
    } catch (error) {
      console.error('❌ ハードリロードエラー:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * キャッシュクリア（リロードなし）
   */
  async handleClearCache(event) {
    try {
      console.log('🧹 キャッシュクリア実行開始...');
      
      if (!this.mainWindow) {
        console.warn('⚠️ メインウィンドウが存在しません');
        return { success: false, error: 'メインウィンドウが存在しません' };
      }
      
      // セッションキャッシュをクリア
      await new Promise((resolve) => {
        this.mainWindow.webContents.session.clearCache(() => {
          console.log('✅ Session キャッシュクリア完了');
          resolve();
        });
      });
      
      // ストレージデータをクリア
      await new Promise((resolve) => {
        this.mainWindow.webContents.session.clearStorageData({
          storages: ['appcache', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'websql', 'serviceworkers', 'cachestorage']
        }, () => {
          console.log('✅ ストレージデータクリア完了');
          resolve();
        });
      });
      
      console.log('✅ キャッシュクリア完了');
      return { success: true, message: 'キャッシュクリアが完了しました' };
      
    } catch (error) {
      console.error('❌ キャッシュクリアエラー:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 強制リフレッシュ（ファイル再読み込み）
   */
  async handleForceRefresh(event) {
    try {
      console.log('🔄 強制リフレッシュ実行開始...');
      
      if (!this.mainWindow) {
        console.warn('⚠️ メインウィンドウが存在しません');
        return { success: false, error: 'メインウィンドウが存在しません' };
      }
      
      // タイムスタンプ付きでファイルを再読み込み
      const rendererFile = process.argv.includes('--test') ? 'test-minimal.html' : 'index.html';
      const rendererPath = path.join(__dirname, 'renderer', rendererFile);
      const timestamp = new Date().getTime();
      const fileUrl = `file://${rendererPath.replace(/\\/g, '/')}?nocache=${timestamp}&refresh=${timestamp}`;
      
      console.log('🔄 強制リフレッシュURL:', fileUrl);
      await this.mainWindow.loadURL(fileUrl);
      
      console.log('✅ 強制リフレッシュ完了');
      return { success: true, message: '強制リフレッシュが完了しました' };
      
    } catch (error) {
      console.error('❌ 強制リフレッシュエラー:', error);
      return { success: false, error: error.message };
    }
  }
  
  // =========================
  // 🔍 開発者ツール制御機能
  // =========================
  
  /**
   * 開発者ツール切り替え
   */
  async handleToggleDevTools(event) {
    try {
      if (!this.mainWindow) {
        console.warn('⚠️ メインウィンドウが存在しません');
        return { success: false, error: 'メインウィンドウが存在しません' };
      }
      
      const isOpen = this.mainWindow.webContents.isDevToolsOpened();
      
      if (isOpen) {
        console.log('🔍 開発者ツール: 閉じています...');
        this.mainWindow.webContents.closeDevTools();
      } else {
        console.log('🔍 開発者ツール: 開いています...');
        this.mainWindow.webContents.openDevTools();
      }
      
      return { success: true, action: isOpen ? 'closed' : 'opened' };
      
    } catch (error) {
      console.error('❌ 開発者ツール切り替えエラー:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 開発者ツールを開く
   */
  async handleOpenDevTools(event) {
    try {
      if (!this.mainWindow) {
        console.warn('⚠️ メインウィンドウが存在しません');
        return { success: false, error: 'メインウィンドウが存在しません' };
      }
      
      console.log('🔍 開発者ツール強制オープン');
      this.mainWindow.webContents.openDevTools();
      
      return { success: true, action: 'opened' };
      
    } catch (error) {
      console.error('❌ 開発者ツールオープンエラー:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 開発者ツールを閉じる
   */
  async handleCloseDevTools(event) {
    try {
      if (!this.mainWindow) {
        console.warn('⚠️ メインウィンドウが存在しません');
        return { success: false, error: 'メインウィンドウが存在しません' };
      }
      
      console.log('🔍 開発者ツールを閉じます');
      this.mainWindow.webContents.closeDevTools();
      
      return { success: true, action: 'closed' };
      
    } catch (error) {
      console.error('❌ 開発者ツール閉じるエラー:', error);
      return { success: false, error: error.message };
    }
  }
  
  // =========================
  // IPC通信ハンドラー実装
  // =========================

  /**
   * プロジェクト作成
   */
  async handleProjectCreate(event, name, template = 'default') {
    try {
      const projectData = {
        meta: {
          name,
          version: '1.0.0',
          created: new Date().toISOString(),
          lastModified: new Date().toISOString()
        },
        characters: template === 'purattokun' ? this.getDefaultCharacters() : {},
        settings: this.getDefaultSettings()
      };

      return { success: true, data: projectData };
    } catch (error) {
      console.error('プロジェクト作成エラー:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * プロジェクト読み込み
   */
  async handleProjectLoad(event, filePath) {
    try {
      if (!filePath) {
        const result = await dialog.showOpenDialog(this.mainWindow, {
          title: 'プロジェクトファイルを選択',
          defaultPath: app.getPath('documents'),
          filters: [
            { name: 'Spine Project', extensions: ['spine-project', 'json'] },
            { name: 'All Files', extensions: ['*'] }
          ],
          properties: ['openFile']
        });

        if (result.canceled) {
          return { success: false, error: 'キャンセルされました' };
        }

        filePath = result.filePaths[0];
      }

      const fileContent = await fs.readFile(filePath, 'utf8');
      const projectData = JSON.parse(fileContent);

      // バリデーション
      this.validateProject(projectData);

      return { success: true, data: projectData, path: filePath };
    } catch (error) {
      console.error('プロジェクト読み込みエラー:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * プロジェクト保存
   */
  async handleProjectSave(event, projectData, filePath) {
    try {
      if (!filePath) {
        const result = await dialog.showSaveDialog(this.mainWindow, {
          title: 'プロジェクトを保存',
          defaultPath: path.join(app.getPath('documents'), `${projectData.meta.name || 'untitled'}.spine-project`),
          filters: [
            { name: 'Spine Project', extensions: ['spine-project'] },
            { name: 'JSON', extensions: ['json'] }
          ]
        });

        if (result.canceled) {
          return { success: false, error: 'キャンセルされました' };
        }

        filePath = result.filePath;
      }

      // メタデータ更新
      projectData.meta.lastModified = new Date().toISOString();

      const jsonString = JSON.stringify(projectData, null, 2);
      await fs.writeFile(filePath, jsonString, 'utf8');

      return { success: true, path: filePath };
    } catch (error) {
      console.error('プロジェクト保存エラー:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * プロジェクトエクスポート
   */
  async handleProjectExport(event, projectData, format, options) {
    try {
      // 後で実装予定
      return { success: false, error: '未実装機能です' };
    } catch (error) {
      console.error('プロジェクトエクスポートエラー:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ファイルオープンダイアログ
   */
  async handleOpenFileDialog(event, options = {}) {
    try {
      const result = await dialog.showOpenDialog(this.mainWindow, {
        title: options.title || 'ファイルを選択',
        defaultPath: options.defaultPath || app.getPath('documents'),
        filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
        properties: options.properties || ['openFile']
      });

      return { success: !result.canceled, filePaths: result.filePaths };
    } catch (error) {
      console.error('ファイルオープンダイアログエラー:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ファイル保存ダイアログ
   */
  async handleSaveFileDialog(event, options = {}) {
    try {
      const result = await dialog.showSaveDialog(this.mainWindow, {
        title: options.title || 'ファイルを保存',
        defaultPath: options.defaultPath || app.getPath('documents'),
        filters: options.filters || [{ name: 'All Files', extensions: ['*'] }]
      });

      return { success: !result.canceled, filePath: result.filePath };
    } catch (error) {
      console.error('ファイル保存ダイアログエラー:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * フォルダー選択ダイアログ
   */
  async handleSelectFolderDialog(event, options = {}) {
    try {
      const result = await dialog.showOpenDialog(this.mainWindow, {
        title: options.title || 'フォルダーを選択',
        defaultPath: options.defaultPath || app.getPath('documents'),
        properties: ['openDirectory']
      });

      return { success: !result.canceled, folderPaths: result.filePaths };
    } catch (error) {
      console.error('フォルダー選択ダイアログエラー:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 外部アプリケーション/URLを開く
   */
  async handleOpenExternal(event, url) {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      console.error('外部アプリケーション起動エラー:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * システム通知表示
   */
  async handleShowNotification(event, options) {
    try {
      // 後で実装予定
      return { success: false, error: '未実装機能です' };
    } catch (error) {
      console.error('通知表示エラー:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * HTMLページ読み込み
   */
  async handleLoadHtmlPage(event, pageUrl) {
    try {
      console.log('🔍 HTMLページ読み込みリクエスト:', pageUrl);
      
      // ローカルファイルの場合は絶対パスに変換
      if (!pageUrl.startsWith('http')) {
        let resolvedPath;
        
        if (pageUrl.startsWith('./') || pageUrl.startsWith('../')) {
          resolvedPath = path.resolve(__dirname, pageUrl);
          console.log('  相対パス(現在ディレクトリ基準)解決:', resolvedPath);
        } else if (!path.isAbsolute(pageUrl)) {
          // 相対パスをプロジェクトルートから解決
          resolvedPath = path.resolve(__dirname, '..', pageUrl);
          console.log('  相対パス(プロジェクトルート基準)解決:', resolvedPath);
        } else {
          resolvedPath = pageUrl;
          console.log('  絶対パスをそのまま使用:', resolvedPath);
        }
        
        // ファイル存在確認
        const exists = await fs.pathExists(resolvedPath);
        console.log('  ファイル存在確認:', exists, '->', resolvedPath);
        
        if (!exists) {
          // フォールバック: プロジェクトルートの最上位で検索
          const fallbackPath = path.resolve(__dirname, '..', '..', pageUrl);
          const fallbackExists = await fs.pathExists(fallbackPath);
          console.log('  フォールバックパス確認:', fallbackExists, '->', fallbackPath);
          
          if (fallbackExists) {
            resolvedPath = fallbackPath;
          } else {
            console.error('  ❌ ファイルが見つかりません:', pageUrl);
            return { success: false, error: `ファイルが見つかりません: ${pageUrl}` };
          }
        }
        
        // file:// プロトコルを追加 (Windowsパス対応)
        pageUrl = 'file:///' + resolvedPath.replace(/\\/g, '/').replace(/^[A-Z]:/, (match) => match.toLowerCase());
        console.log('  最終URL:', pageUrl);
      }
      
      console.log('✅ HTMLページ読み込み準備完了:', pageUrl);
      return { success: true, url: pageUrl };
    } catch (error) {
      console.error('❌ HTMLページ読み込みエラー:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ローカルHTMLファイル一覧取得
   */
  async handleGetLocalFiles(event, directory = null) {
    try {
      const searchDir = directory || path.resolve(__dirname, '..');
      const htmlFiles = [];
      
      console.log('🔍 HTMLファイル検索開始:');
      console.log('  検索ディレクトリ:', searchDir);
      console.log('  __dirname:', __dirname);
      console.log('  検索ディレクトリ存在確認:', await fs.pathExists(searchDir));
      
      // HTMLファイルを再帰的に検索
      const findHtmlFiles = async (dir, level = 0) => {
        const indent = '  '.repeat(level + 1);
        console.log(`${indent}📁 検索中: ${dir}`);
        
        try {
          const items = await fs.readdir(dir, { withFileTypes: true });
          console.log(`${indent}  項目数: ${items.length}`);
          
          for (const item of items) {
            const fullPath = path.join(dir, item.name);
            
            if (item.isDirectory() && !item.name.startsWith('.') && 
                item.name !== 'node_modules' && level < 2) { // 深さ制限
              await findHtmlFiles(fullPath, level + 1);
            } else if (item.isFile() && item.name.endsWith('.html')) {
              const relativePath = path.relative(searchDir, fullPath);
              const fileInfo = {
                name: item.name,
                path: fullPath,
                relativePath: relativePath,
                directory: path.dirname(relativePath) || '.',
                size: (await fs.stat(fullPath)).size
              };
              htmlFiles.push(fileInfo);
              console.log(`${indent}  ✅ 発見: ${item.name} (${fileInfo.size} bytes)`);
            }
          }
        } catch (dirError) {
          console.warn(`${indent}  ⚠️ ディレクトリ読み込みエラー (${dir}):`, dirError.message);
        }
      };
      
      await findHtmlFiles(searchDir);
      
      // 特殊ページを先頭に追加（存在確認付き）
      const specialPages = [];
      const specialCandidates = [
        {
          name: '🌟 メインサイト',
          file: 'index.html',
          description: 'ぷらっとくん予約システム（推奨）'
        },
        {
          name: '🔧 Web版編集システム',
          file: 'index.html?edit=true',
          description: 'Spine編集モード'
        },
        {
          name: '🎬 タイムライン実験',
          file: 'timeline-experiment.html',
          description: 'タイムライン制作システム'
        },
        {
          name: '🎯 Spine位置調整システム',
          file: 'spine-positioning-system-explanation.html',
          description: 'Spine編集デモ'
        },
        {
          name: '🐭 Nezumi機能テスト',
          file: 'test-nezumi-functionality.html',
          description: 'Nezumiキャラクターテスト'
        }
      ];
      
      console.log('🌟 特殊ページ存在確認:');
      for (const candidate of specialCandidates) {
        const filePath = path.join(searchDir, candidate.file.split('?')[0]); // クエリパラメータ除去
        const exists = await fs.pathExists(filePath);
        console.log(`  ${candidate.name}: ${exists ? '✅' : '❌'} (${candidate.file})`);
        
        if (exists) {
          specialPages.push({
            name: candidate.name,
            path: filePath,
            relativePath: candidate.file,
            directory: '.',
            isSpecial: true,
            description: candidate.description
          });
        }
      }
      
      const allFiles = [...specialPages, ...htmlFiles];
      
      console.log('📊 HTMLファイル検索結果:');
      console.log(`  特殊ページ: ${specialPages.length}件`);
      console.log(`  通常ファイル: ${htmlFiles.length}件`);
      console.log(`  合計: ${allFiles.length}件`);
      
      // 詳細リスト出力
      allFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name} (${file.isSpecial ? '特殊' : '通常'})`);
        console.log(`     パス: ${file.relativePath}`);
      });
      
      return { success: true, files: allFiles, debug: { searchDir, totalFiles: allFiles.length } };
    } catch (error) {
      console.error('ローカルファイル一覧取得エラー:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * サーバーステータス確認
   */
  async handleCheckServerStatus(event) {
    try {
      const status = await this.serverManager.checkServerStatus();
      console.log('📊 サーバーステータス確認:', status);
      return { success: true, status };
    } catch (error) {
      console.error('サーバーステータス確認エラー:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * サーバー起動
   */
  async handleStartServer(event) {
    try {
      console.log('🚀 手動サーバー起動リクエスト');
      const result = await this.serverManager.startServer();
      console.log('📊 サーバー起動結果:', result);
      return result;
    } catch (error) {
      console.error('サーバー起動エラー:', error);
      return { success: false, error: error.message };
    }
  }

  // =========================
  // メニューハンドラー実装
  // =========================

  handleMenuNewProject() {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('menu:new-project');
    }
  }

  handleMenuOpenProject() {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('menu:open-project');
    }
  }

  handleMenuSaveProject() {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('menu:save-project');
    }
  }

  handleMenuSaveAsProject() {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('menu:save-as-project');
    }
  }

  // =========================
  // ユーティリティメソッド
  // =========================

  /**
   * デフォルトキャラクター設定取得
   */
  getDefaultCharacters() {
    return {
      purattokun: {
        id: 'purattokun',
        name: 'ぷらっとくん',
        position: { left: '35%', top: '75%' },
        scale: { x: 0.55, y: 0.55 },
        rotation: 0,
        zIndex: 1000,
        assets: {
          atlas: 'purattokun.atlas',
          json: 'purattokun.json',
          textures: ['purattokun.png']
        },
        animations: {
          idle: 'taiki',
          click: 'yarare'
        },
        visible: true
      }
    };
  }

  /**
   * デフォルト設定取得
   */
  getDefaultSettings() {
    return {
      canvas: {
        width: '100%',
        height: 'auto'
      },
      export: {
        format: 'css',
        precision: 4,
        minify: false
      },
      grid: {
        enabled: false,
        size: 10,
        snap: false
      }
    };
  }

  /**
   * プロジェクトデータバリデーション
   */
  validateProject(projectData) {
    if (!projectData || typeof projectData !== 'object') {
      throw new Error('無効なプロジェクトデータです');
    }

    if (!projectData.meta || !projectData.meta.name) {
      throw new Error('プロジェクトメタデータが不正です');
    }

    if (!projectData.characters || typeof projectData.characters !== 'object') {
      throw new Error('キャラクターデータが不正です');
    }

    return true;
  }
}

// アプリケーション起動
const spineEditor = new SpineEditorMain();

// 未処理の例外をキャッチ
process.on('uncaughtException', (error) => {
  console.error('未処理の例外:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未処理のPromise拒否:', reason);
});

console.log('🎯 Spine Character Position Editor - Main Process 初期化完了');