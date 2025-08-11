// 🎯 Spine Editor Desktop - Electron Main Process
// Phase 1: 最短MVP実装 - インポート→表示→編集→保存→エクスポート基本フロー

const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;

console.log('🚀 Spine Editor Desktop - Main Process 起動');

// アプリケーション状態管理
class SpineEditorApp {
    constructor() {
        this.mainWindow = null;
        this.isDev = process.argv.includes('--dev');
        this.projectData = {
            homePageFolder: null,
            spineCharactersFolder: null,
            currentProject: null
        };
        
        console.log(`📊 起動モード: ${this.isDev ? 'Development' : 'Production'}`);
    }

    // メインウィンドウ作成
    createMainWindow() {
        console.log('🖼️ メインウィンドウ作成開始');
        
        this.mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            minWidth: 1000,
            minHeight: 700,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, '../renderer/preload.js'),
                webSecurity: false  // Phase 1: ローカルファイル読み込み用（後で改善）
            },
            titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
            show: false // 準備完了まで非表示
        });

        // レンダラープロセス読み込み
        const indexPath = path.join(__dirname, '../renderer/index.html');
        this.mainWindow.loadFile(indexPath);

        // 準備完了時に表示
        this.mainWindow.once('ready-to-show', () => {
            console.log('✅ メインウィンドウ準備完了');
            this.mainWindow.show();
            
            // 開発モード時は開発者ツールを開く
            if (this.isDev) {
                this.mainWindow.webContents.openDevTools();
            }
        });

        // ウィンドウクローズイベント
        this.mainWindow.on('closed', () => {
            console.log('🔒 メインウィンドウクローズ');
            this.mainWindow = null;
        });

        console.log('✅ メインウィンドウ設定完了');
    }

    // アプリケーションメニュー設定
    createMenu() {
        const template = [
            {
                label: 'ファイル',
                submenu: [
                    {
                        label: '新規プロジェクト',
                        accelerator: 'CmdOrCtrl+N',
                        click: () => this.newProject()
                    },
                    {
                        label: 'プロジェクトを開く',
                        accelerator: 'CmdOrCtrl+O',
                        click: () => this.openProject()
                    },
                    { type: 'separator' },
                    {
                        label: 'ホームページフォルダ選択',
                        click: () => this.selectHomePageFolder()
                    },
                    {
                        label: 'Spineキャラクターフォルダ選択',
                        click: () => this.selectSpineFolder()
                    },
                    { type: 'separator' },
                    {
                        label: '保存',
                        accelerator: 'CmdOrCtrl+S',
                        click: () => this.saveProject()
                    },
                    {
                        label: 'エクスポート',
                        accelerator: 'CmdOrCtrl+E',
                        click: () => this.exportPackage()
                    }
                ]
            },
            {
                label: '編集',
                submenu: [
                    { role: 'undo', label: '元に戻す' },
                    { role: 'redo', label: 'やり直し' },
                    { type: 'separator' },
                    { role: 'cut', label: '切り取り' },
                    { role: 'copy', label: 'コピー' },
                    { role: 'paste', label: '貼り付け' }
                ]
            },
            {
                label: '表示',
                submenu: [
                    { role: 'reload', label: '再読み込み' },
                    { role: 'forceReload', label: '強制再読み込み' },
                    { role: 'toggleDevTools', label: '開発者ツール' },
                    { type: 'separator' },
                    { role: 'resetZoom', label: 'ズームリセット' },
                    { role: 'zoomIn', label: 'ズームイン' },
                    { role: 'zoomOut', label: 'ズームアウト' },
                    { type: 'separator' },
                    { role: 'togglefullscreen', label: 'フルスクリーン' }
                ]
            },
            {
                label: 'ウィンドウ',
                submenu: [
                    { role: 'minimize', label: '最小化' },
                    { role: 'close', label: '閉じる' }
                ]
            }
        ];

        // macOSの場合の調整
        if (process.platform === 'darwin') {
            template.unshift({
                label: app.getName(),
                submenu: [
                    { role: 'about', label: 'Spine Editor Desktopについて' },
                    { type: 'separator' },
                    { role: 'services', label: 'サービス', submenu: [] },
                    { type: 'separator' },
                    { role: 'hide', label: 'Spine Editor Desktopを隠す' },
                    { role: 'hideothers', label: '他を隠す' },
                    { role: 'unhide', label: 'すべて表示' },
                    { type: 'separator' },
                    { role: 'quit', label: 'Spine Editor Desktopを終了' }
                ]
            });

            // WindowメニューをmacOS用に調整
            template[4].submenu = [
                { role: 'close', label: '閉じる' },
                { role: 'minimize', label: '最小化' },
                { role: 'zoom', label: 'ズーム' },
                { type: 'separator' },
                { role: 'front', label: '手前に移動' }
            ];
        }

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
        
        console.log('✅ アプリケーションメニュー設定完了');
    }

    // IPC通信ハンドラー設定
    setupIPC() {
        console.log('🔗 IPC通信ハンドラー設定開始');

        // フォルダ選択ダイアログ
        ipcMain.handle('select-folder', async (event, options = {}) => {
            const result = await dialog.showOpenDialog(this.mainWindow, {
                properties: ['openDirectory'],
                title: options.title || 'フォルダを選択',
                buttonLabel: '選択'
            });
            
            return result.canceled ? null : result.filePaths[0];
        });

        // ファイル読み込み
        ipcMain.handle('read-file', async (event, filePath) => {
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                return { success: true, content };
            } catch (error) {
                console.error('ファイル読み込みエラー:', error);
                return { success: false, error: error.message };
            }
        });

        // ファイル保存
        ipcMain.handle('save-file', async (event, filePath, content) => {
            try {
                await fs.writeFile(filePath, content, 'utf-8');
                return { success: true };
            } catch (error) {
                console.error('ファイル保存エラー:', error);
                return { success: false, error: error.message };
            }
        });

        // ディレクトリ一覧取得
        ipcMain.handle('list-directory', async (event, dirPath) => {
            try {
                const items = await fs.readdir(dirPath, { withFileTypes: true });
                return items.map(item => ({
                    name: item.name,
                    isDirectory: item.isDirectory(),
                    path: path.join(dirPath, item.name)
                }));
            } catch (error) {
                console.error('ディレクトリ読み込みエラー:', error);
                return [];
            }
        });

        console.log('✅ IPC通信ハンドラー設定完了');
    }

    // 新規プロジェクト
    async newProject() {
        console.log('📝 新規プロジェクト作成');
        this.projectData.currentProject = null;
        this.mainWindow?.webContents.send('project-new');
    }

    // プロジェクト読み込み
    async openProject() {
        console.log('📂 プロジェクト読み込み');
        const result = await dialog.showOpenDialog(this.mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'Spine Editor Project', extensions: ['sep'] }
            ]
        });

        if (!result.canceled) {
            // プロジェクトファイル読み込み処理
            this.mainWindow?.webContents.send('project-open', result.filePaths[0]);
        }
    }

    // ホームページフォルダ選択
    async selectHomePageFolder() {
        console.log('🏠 ホームページフォルダ選択');
        const folder = await this.selectFolder('ホームページフォルダを選択');
        if (folder) {
            this.projectData.homePageFolder = folder;
            this.mainWindow?.webContents.send('homepage-folder-selected', folder);
        }
    }

    // Spineフォルダ選択
    async selectSpineFolder() {
        console.log('🎯 Spineキャラクターフォルダ選択');
        const folder = await this.selectFolder('Spineキャラクターフォルダを選択');
        if (folder) {
            this.projectData.spineCharactersFolder = folder;
            this.mainWindow?.webContents.send('spine-folder-selected', folder);
        }
    }

    // フォルダ選択共通処理
    async selectFolder(title) {
        const result = await dialog.showOpenDialog(this.mainWindow, {
            properties: ['openDirectory'],
            title: title,
            buttonLabel: '選択'
        });
        
        return result.canceled ? null : result.filePaths[0];
    }

    // プロジェクト保存
    async saveProject() {
        console.log('💾 プロジェクト保存');
        this.mainWindow?.webContents.send('project-save');
    }

    // パッケージエクスポート
    async exportPackage() {
        console.log('📦 パッケージエクスポート');
        this.mainWindow?.webContents.send('package-export');
    }

    // アプリケーション初期化
    async initialize() {
        console.log('🔄 Spine Editor Desktop 初期化開始');
        
        this.createMainWindow();
        this.createMenu();
        this.setupIPC();
        
        console.log('✅ Spine Editor Desktop 初期化完了');
    }
}

// アプリケーションインスタンス
const spineEditorApp = new SpineEditorApp();

// Electronアプリケーションイベント
app.whenReady().then(() => {
    console.log('🎬 Electron Ready - アプリケーション初期化開始');
    spineEditorApp.initialize();
});

app.on('window-all-closed', () => {
    console.log('📱 全ウィンドウクローズ');
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    console.log('🔄 アプリケーション再アクティブ化');
    if (BrowserWindow.getAllWindows().length === 0) {
        spineEditorApp.createMainWindow();
    }
});

// セキュリティ設定
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
    });
});

console.log('📋 Spine Editor Desktop Main Process 設定完了');