// 🎯 Spine Editor Desktop - Electron Main Process
// Phase 1: 最短MVP実装 - インポート→表示→編集→保存→エクスポート基本フロー

const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const express = require('express');
const cors = require('cors');
const net = require('net');

console.log('🚀 Spine Editor Desktop - Main Process 起動');

// Express.js統合HTTPサーバークラス（WebGL問題解決用）
class ElectronHTTPServer {
    constructor() {
        this.app = express();
        this.server = null;
        this.port = 3000;
    }

    async startServer() {
        console.log('🔧 HTTP環境構築開始 - WebGL問題解決対応');
        
        // CORS設定（セキュリティ確保）
        this.app.use(cors({
            origin: true,
            credentials: true
        }));
        
        // 静的ファイル配信設定
        const rendererPath = path.join(__dirname, '../renderer');
        const assetsPath = path.join(__dirname, '../../assets');
        
        console.log('📁 静的ファイル配信パス:');
        console.log('  - renderer:', rendererPath);
        console.log('  - assets:', assetsPath);
        
        // レンダラーファイル（HTML, JS, CSS）配信
        this.app.use(express.static(rendererPath));
        
        // アセットファイル（Spine, images等）配信
        this.app.use('/assets', express.static(assetsPath));
        
        // メインルート設定
        this.app.get('/', (req, res) => {
            const indexPath = path.join(rendererPath, 'index.html');
            console.log('🏠 メインページ配信:', indexPath);
            res.sendFile(indexPath);
        });
        
        // 健康チェックエンドポイント
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                purpose: 'WebGL問題解決用HTTP環境'
            });
        });

        // ポート自動検出（競合回避）
        this.port = await this.findAvailablePort(3000);
        
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, 'localhost', () => {
                const serverUrl = `http://localhost:${this.port}`;
                console.log(`✅ HTTP環境起動成功: ${serverUrl}`);
                console.log('🎯 目的: Electron WebGL問題解決のためのHTTP環境提供');
                resolve(serverUrl);
            });
            
            this.server.on('error', (error) => {
                console.error('❌ HTTPサーバー起動エラー:', error);
                reject(error);
            });
        });
    }

    async findAvailablePort(startPort) {
        console.log(`🔍 利用可能ポート検索開始: ${startPort}から`);
        
        for (let port = startPort; port < startPort + 100; port++) {
            const available = await new Promise((resolve) => {
                const testServer = net.createServer();
                testServer.listen(port, 'localhost', () => {
                    testServer.close();
                    resolve(true);
                });
                testServer.on('error', () => {
                    resolve(false);
                });
            });
            
            if (available) {
                console.log(`✅ 利用可能ポート発見: ${port}`);
                return port;
            }
        }
        
        console.warn(`⚠️ 利用可能ポート未発見、デフォルト使用: ${startPort}`);
        return startPort;
    }

    stopServer() {
        if (this.server) {
            this.server.close(() => {
                console.log('🔒 HTTPサーバー停止完了');
            });
            this.server = null;
        }
    }
}

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
        
        // HTTP環境統合（WebGL問題解決用）
        this.httpServer = new ElectronHTTPServer();
        this.httpServerUrl = null;
        this.useHttpEnvironment = true; // WebGL問題解決のためHTTP環境をデフォルト有効
        
        // ファイル履歴管理
        this.fileHistory = {
            recentProjects: [],
            recentExports: [],
            maxHistorySize: 10
        };
        
        // 設定ファイルパス
        this.configPath = path.join(os.homedir(), '.spine-editor-desktop', 'config.json');
        
        // 初期化時に設定を読み込み
        this.loadSettings();
        
        console.log(`📊 起動モード: ${this.isDev ? 'Development' : 'Production'}`);
    }

    // メインウィンドウ作成（HTTP環境統合版）
    async createMainWindow() {
        console.log('🖼️ メインウィンドウ作成開始（HTTP環境統合版）');
        
        try {
            this.mainWindow = new BrowserWindow({
                width: 1400,
                height: 900,
                minWidth: 1000,
                minHeight: 700,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    enableRemoteModule: false,
                    preload: path.join(__dirname, '../renderer/preload.js')
                    // 🔧 緊急修正: レンダリング障害修正のため危険設定を全て削除
                    // webSecurity, experimentalFeatures, offscreen等がレンダリングプロセスを破壊
                },
                titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
                show: false // 準備完了まで非表示
            });
            
            console.log('✅ BrowserWindow インスタンス作成成功');
            
        } catch (error) {
            console.error('❌ BrowserWindow 作成エラー:', error);
            throw error;
        }

        // 読み込み状況監視のためのWebContentsイベントハンドラー
        this.mainWindow.webContents.on('did-start-loading', () => {
            console.log('🔄 ページ読み込み開始');
        });

        this.mainWindow.webContents.on('did-finish-load', () => {
            console.log('✅ ページ読み込み完了');
        });

        this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
            console.error('❌ ページ読み込み失敗:', errorCode, errorDescription, validatedURL);
        });

        this.mainWindow.webContents.on('dom-ready', () => {
            console.log('📋 DOM準備完了');
        });

        // ready-to-show イベントハンドラーを先に設定
        this.mainWindow.once('ready-to-show', () => {
            console.log('✅ メインウィンドウ準備完了 - 表示開始');
            this.mainWindow.show();
            
            // 開発モード時は開発者ツールを開く
            if (this.isDev) {
                this.mainWindow.webContents.openDevTools();
            }
        });

        // F12キーで開発者ツールを開く
        this.mainWindow.webContents.on('before-input-event', (event, input) => {
            if (input.key === 'F12') {
                if (this.mainWindow.webContents.isDevToolsOpened()) {
                    this.mainWindow.webContents.closeDevTools();
                } else {
                    this.mainWindow.webContents.openDevTools();
                }
            }
        });

        // ウィンドウクローズイベント（HTTPサーバー停止処理追加）
        this.mainWindow.on('closed', () => {
            console.log('🔒 メインウィンドウクローズ');
            this.mainWindow = null;
            
            // HTTPサーバー停止
            if (this.httpServer) {
                this.httpServer.stopServer();
            }
        });

        // WebGL問題解決: HTTP環境またはfile://環境の動的選択
        if (this.useHttpEnvironment && this.httpServerUrl) {
            // HTTP環境でのアプリケーション読み込み（WebGL問題解決）
            const httpAppUrl = this.httpServerUrl + '/';
            console.log('🌐 HTTP環境読み込み:', httpAppUrl);
            console.log('🎯 目的: WebGL問題解決のためのHTTP環境使用');
            
            try {
                await this.mainWindow.loadURL(httpAppUrl);
                console.log('✅ HTTP環境読み込み成功');
                
                // HTTP読み込み成功後、強制的にウィンドウを表示（ready-to-showが発火しない場合の保険）
                setTimeout(() => {
                    if (this.mainWindow && !this.mainWindow.isVisible()) {
                        console.log('⚠️ ready-to-show未発火 - 強制表示実行');
                        this.mainWindow.show();
                    }
                }, 3000);
                
            } catch (error) {
                console.error('❌ HTTP環境読み込み失敗:', error);
                console.log('🔄 フォールバック: file://環境に切り替え');
                await this.loadFileEnvironment();
            }
        } else {
            // 従来のfile://環境
            await this.loadFileEnvironment();
        }
    }
    
    // file://環境での読み込み（フォールバック用）
    async loadFileEnvironment() {
        const indexPath = path.join(__dirname, '../renderer/index.html');
        console.log('📁 file://環境読み込み:', indexPath);
        try {
            await this.mainWindow.loadFile(indexPath);
            console.log('✅ file://環境読み込み成功');
            
            // file://読み込み成功後、強制的にウィンドウを表示（ready-to-showが発火しない場合の保険）
            setTimeout(() => {
                if (this.mainWindow && !this.mainWindow.isVisible()) {
                    console.log('⚠️ ready-to-show未発火 - 強制表示実行');
                    this.mainWindow.show();
                }
            }, 2000);
            
        } catch (error) {
            console.error('❌ file://環境読み込み失敗:', error);
            
            // 読み込み完全失敗時も最低限ウィンドウを表示
            console.log('🚨 緊急表示 - 空ウィンドウ表示');
            this.mainWindow.show();
        }

        console.log('✅ メインウィンドウ設定完了（フォールバック対応）');
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
                    {
                        label: '🔍 Canvas診断プローブ',
                        click: () => this.openCanvasProbe()
                    },
                    {
                        label: '🔍 HTTP読み込みテスト',
                        click: () => this.testHttpLoad()
                    },
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

    // 設定ファイル管理
    async loadSettings() {
        try {
            // 設定ディレクトリ作成
            const configDir = path.dirname(this.configPath);
            await fs.mkdir(configDir, { recursive: true });
            
            // 設定ファイル読み込み
            const configContent = await fs.readFile(this.configPath, 'utf-8');
            const config = JSON.parse(configContent);
            
            this.fileHistory = {
                recentProjects: config.recentProjects || [],
                recentExports: config.recentExports || [],
                maxHistorySize: config.maxHistorySize || 10
            };
            
            console.log('✅ 設定ファイル読み込み完了');
        } catch (error) {
            // 設定ファイルが存在しない場合は初期値を使用
            console.log('📋 設定ファイル初期化');
        }
    }
    
    // Phase 2強化：設定ファイル保存（拡張情報付き）
    async saveSettings() {
        try {
            const config = {
                // 基本設定
                recentProjects: this.fileHistory.recentProjects,
                recentExports: this.fileHistory.recentExports,
                maxHistorySize: this.fileHistory.maxHistorySize,
                
                // Phase 2: 追加設定
                version: '2.0',
                lastSaved: new Date().toISOString(),
                
                // Phase 2: ダイアログ設定
                dialogPreferences: {
                    showHiddenFiles: false,
                    defaultProjectDirectory: path.join(os.homedir(), 'Documents', 'Spine Editor Projects'),
                    autoValidateProjects: true,
                    showFilePreview: true,
                    maxPreviewSize: 1024 * 1024 // 1MB
                },
                
                // Phase 2: UI設定
                ui: {
                    theme: 'system',
                    fileListSortBy: 'modified',
                    showFileDetails: true
                }
            };
            
            await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
            console.log('💾 Phase 2設定ファイル保存完了');
        } catch (error) {
            console.error('❌ 設定ファイル保存エラー:', error);
        }
    }
    
    // ファイル履歴管理
    addToHistory(type, filePath) {
        const historyArray = type === 'project' ? this.fileHistory.recentProjects : this.fileHistory.recentExports;
        
        // 既存のエントリを削除
        const existingIndex = historyArray.findIndex(item => item.path === filePath);
        if (existingIndex !== -1) {
            historyArray.splice(existingIndex, 1);
        }
        
        // 先頭に追加
        historyArray.unshift({
            path: filePath,
            name: path.basename(filePath),
            timestamp: new Date().toISOString()
        });
        
        // 最大サイズを超えた場合は古いものを削除
        if (historyArray.length > this.fileHistory.maxHistorySize) {
            historyArray.splice(this.fileHistory.maxHistorySize);
        }
        
        // 設定を保存
        this.saveSettings();
    }

    // IPC通信ハンドラー設定
    setupIPC() {
        console.log('🔗 IPC通信ハンドラー設定開始');

        // プロフェッショナル保存ダイアログ（Phase 2強化版）
        ipcMain.handle('show-save-dialog', async (event, options = {}) => {
            const dialogOptions = {
                title: options.title || 'ファイルを保存',
                buttonLabel: '保存',
                filters: options.filters || [
                    { name: 'Spine Editor Project', extensions: ['sep'] },
                    { name: 'JSON Project', extensions: ['json'] },
                    { name: 'All Files', extensions: ['*'] }
                ],
                defaultPath: options.defaultPath || path.join(os.homedir(), 'Desktop', 'untitled.sep'),
                properties: ['createDirectory'] // ディレクトリ作成許可
            };
            
            // Phase 2強化：智能初期パス選択
            if (this.fileHistory.recentProjects.length > 0) {
                const recentDir = path.dirname(this.fileHistory.recentProjects[0].path);
                dialogOptions.defaultPath = path.join(recentDir, path.basename(dialogOptions.defaultPath));
            } else if (options.suggestedName) {
                // プロジェクト名からファイル名を推定
                const timestamp = new Date().toISOString().split('T')[0];
                const fileName = `${options.suggestedName}-${timestamp}.sep`;
                dialogOptions.defaultPath = path.join(os.homedir(), 'Documents', fileName);
            }
            
            // Phase 2: 拡張オプション処理
            if (options.message) {
                dialogOptions.message = options.message;
            }
            if (options.nameFieldLabel) {
                dialogOptions.nameFieldLabel = options.nameFieldLabel;
            }
            if (options.showsTagField !== undefined) {
                dialogOptions.showsTagField = options.showsTagField;
            }
            
            console.log('💾 プロフェッショナル保存ダイアログ表示:', dialogOptions.title);
            const result = await dialog.showSaveDialog(this.mainWindow, dialogOptions);
            
            if (!result.canceled) {
                // 履歴に追加（詳細情報付き）
                this.addToHistory('project', result.filePath);
                
                // Phase 2: 保存メタデータ
                const saveMetadata = {
                    originalOptions: options,
                    timestamp: new Date().toISOString(),
                    fileSize: 0 // 実際の保存後に更新予定
                };
                
                console.log('✅ ファイル保存パス決定:', result.filePath);
                return { 
                    success: true, 
                    filePath: result.filePath,
                    metadata: saveMetadata
                };
            }
            
            console.log('❌ ファイル保存ダイアログキャンセル');
            return { success: false, canceled: true };
        });
        
        // プロフェッショナル開くダイアログ（Phase 2強化版）
        ipcMain.handle('show-open-dialog', async (event, options = {}) => {
            const dialogOptions = {
                title: options.title || 'プロジェクトを開く',
                buttonLabel: '開く',
                properties: ['openFile'],
                filters: options.filters || [
                    { name: 'Spine Editor Project', extensions: ['sep'] },
                    { name: 'JSON Project', extensions: ['json'] },
                    { name: 'Legacy Project', extensions: ['spx', 'proj'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            };
            
            // Phase 2強化：智能初期パス選択
            if (this.fileHistory.recentProjects.length > 0) {
                dialogOptions.defaultPath = path.dirname(this.fileHistory.recentProjects[0].path);
            } else {
                // デフォルトプロジェクトディレクトリ
                const defaultProjectDir = path.join(os.homedir(), 'Documents', 'Spine Editor Projects');
                dialogOptions.defaultPath = defaultProjectDir;
            }
            
            // Phase 2: 拡張オプション処理
            if (options.message) {
                dialogOptions.message = options.message;
            }
            if (options.multiSelections) {
                dialogOptions.properties.push('multiSelections');
            }
            
            console.log('📂 プロフェッショナル開くダイアログ表示:', dialogOptions.title);
            const result = await dialog.showOpenDialog(this.mainWindow, dialogOptions);
            
            if (!result.canceled && result.filePaths.length > 0) {
                const selectedFiles = result.filePaths;
                const primaryFile = selectedFiles[0];
                
                // Phase 2: すべての選択ファイルを履歴に追加
                for (const filePath of selectedFiles) {
                    this.addToHistory('project', filePath);
                }
                
                // Phase 2: ファイル詳細情報を取得
                const fileDetails = [];
                for (const filePath of selectedFiles) {
                    try {
                        const stats = await fs.stat(filePath);
                        const fileInfo = {
                            path: filePath,
                            name: path.basename(filePath),
                            size: stats.size,
                            modified: stats.mtime,
                            extension: path.extname(filePath)
                        };
                        fileDetails.push(fileInfo);
                    } catch (error) {
                        console.warn('⚠️ ファイル詳細取得失敗:', filePath, error);
                    }
                }
                
                console.log('✅ ファイル選択完了:', selectedFiles.length, '件');
                return { 
                    success: true, 
                    filePath: primaryFile,
                    filePaths: selectedFiles,
                    fileDetails: fileDetails
                };
            }
            
            console.log('❌ ファイル開くダイアログキャンセル');
            return { success: false, canceled: true };
        });
        
        // エクスポート保存ダイアログ
        ipcMain.handle('show-export-dialog', async (event, options = {}) => {
            const dialogOptions = {
                title: options.title || 'パッケージをエクスポート',
                buttonLabel: 'エクスポート',
                filters: options.filters || [
                    { name: 'ZIP Archive', extensions: ['zip'] },
                    { name: 'All Files', extensions: ['*'] }
                ],
                defaultPath: options.defaultPath || path.join(os.homedir(), 'Desktop', 'spine-package.zip')
            };
            
            // 最近使用したディレクトリを初期パスとして使用
            if (this.fileHistory.recentExports.length > 0) {
                const recentDir = path.dirname(this.fileHistory.recentExports[0].path);
                dialogOptions.defaultPath = path.join(recentDir, path.basename(dialogOptions.defaultPath));
            }
            
            const result = await dialog.showSaveDialog(this.mainWindow, dialogOptions);
            
            if (!result.canceled) {
                this.addToHistory('export', result.filePath);
                return { success: true, filePath: result.filePath };
            }
            
            return { success: false, canceled: true };
        });
        
        // Phase 2強化：ファイル履歴取得（詳細情報付き）
        ipcMain.handle('get-file-history', async (event, type = 'project') => {
            const historyArray = type === 'project' ? this.fileHistory.recentProjects : this.fileHistory.recentExports;
            
            // Phase 2: 詳細情報付きファイル存在確認
            const validHistory = [];
            for (const item of historyArray) {
                try {
                    await fs.access(item.path);
                    
                    // Phase 2: ファイル詳細情報を取得
                    const stats = await fs.stat(item.path);
                    const enrichedItem = {
                        ...item,
                        // 基本情報
                        size: stats.size,
                        sizeFormatted: this.formatFileSize(stats.size),
                        modified: stats.mtime,
                        modifiedFormatted: this.formatDate(stats.mtime),
                        created: stats.ctime,
                        extension: path.extname(item.path),
                        directory: path.dirname(item.path),
                        
                        // Phase 2: プロジェクト特化情報
                        type: this.getFileType(path.extname(item.path)),
                        isRecent: (Date.now() - stats.mtime.getTime()) < (7 * 24 * 60 * 60 * 1000), // 7日以内
                        
                        // Phase 2: 追加メタデータ
                        accessible: true,
                        lastAccessed: new Date().toISOString()
                    };
                    
                    // Phase 2: プロジェクトファイルの場合、内容プレビューを追加
                    if (type === 'project' && path.extname(item.path) === '.sep') {
                        try {
                            const content = await fs.readFile(item.path, 'utf-8');
                            const projectData = JSON.parse(content);
                            enrichedItem.preview = {
                                version: projectData.version || 'unknown',
                                characterCount: projectData.characters ? Object.keys(projectData.characters).length : 0,
                                projectName: projectData.project?.name || 'Untitled',
                                lastModified: projectData.project?.updatedAt || stats.mtime.toISOString()
                            };
                        } catch (previewError) {
                            console.warn('⚠️ プロジェクトプレビュー取得失敗:', item.path);
                            enrichedItem.preview = { error: 'プレビュー不可' };
                        }
                    }
                    
                    validHistory.push(enrichedItem);
                } catch {
                    // ファイルが存在しない場合はマークして残す
                    const inaccessibleItem = {
                        ...item,
                        accessible: false,
                        error: 'ファイルが見つかりません'
                    };
                    validHistory.push(inaccessibleItem);
                }
            }
            
            // Phase 2: 履歴をソート（最近のアクセス順 + 利用可能性）
            validHistory.sort((a, b) => {
                // 利用可能なファイルを優先
                if (a.accessible && !b.accessible) return -1;
                if (!a.accessible && b.accessible) return 1;
                
                // 同じ利用可能性の場合、最新のアクセス順
                const aTime = new Date(a.timestamp).getTime();
                const bTime = new Date(b.timestamp).getTime();
                return bTime - aTime;
            });
            
            console.log(`📋 ${type}履歴取得完了:`, validHistory.length, '件 (利用可能:', validHistory.filter(i => i.accessible).length, '件)');
            return validHistory;
        });
        
        // ファイル履歴クリア
        ipcMain.handle('clear-file-history', async (event, type = 'project') => {
            if (type === 'project') {
                this.fileHistory.recentProjects = [];
            } else {
                this.fileHistory.recentExports = [];
            }
            
            await this.saveSettings();
            return { success: true };
        });

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

        // Phase 2強化：ディレクトリ一覧取得（詳細情報付き）
        ipcMain.handle('list-directory', async (event, dirPath, options = {}) => {
            try {
                const items = await fs.readdir(dirPath, { withFileTypes: true });
                const detailedItems = [];
                
                for (const item of items) {
                    const itemPath = path.join(dirPath, item.name);
                    
                    try {
                        const stats = await fs.stat(itemPath);
                        const detailedItem = {
                            name: item.name,
                            isDirectory: item.isDirectory(),
                            path: itemPath,
                            
                            // Phase 2: 詳細情報
                            size: stats.size,
                            sizeFormatted: this.formatFileSize(stats.size),
                            modified: stats.mtime,
                            modifiedFormatted: this.formatDate(stats.mtime),
                            created: stats.ctime,
                            extension: item.isDirectory() ? null : path.extname(item.name),
                            type: item.isDirectory() ? 'directory' : this.getFileType(path.extname(item.name)),
                            
                            // Phase 2: プロジェクト関連フラグ
                            isProjectFile: !item.isDirectory() && path.extname(item.name) === '.sep',
                            isSpineFile: !item.isDirectory() && ['.json', '.atlas', '.png'].includes(path.extname(item.name)),
                            isHidden: item.name.startsWith('.'),
                            
                            // Phase 2: アクセス権限
                            readable: true,
                            writable: true
                        };
                        
                        // Phase 2: プロジェクトファイルの場合、プレビュー情報を追加
                        if (detailedItem.isProjectFile) {
                            try {
                                const content = await fs.readFile(itemPath, 'utf-8');
                                const projectData = JSON.parse(content);
                                detailedItem.projectPreview = {
                                    name: projectData.project?.name || item.name,
                                    version: projectData.version || 'unknown',
                                    characterCount: projectData.characters ? Object.keys(projectData.characters).length : 0
                                };
                            } catch (previewError) {
                                detailedItem.projectPreview = { error: 'プレビュー不可' };
                            }
                        }
                        
                        detailedItems.push(detailedItem);
                        
                    } catch (statError) {
                        // stat取得失敗時は基本情報のみ
                        console.warn('⚠️ アイテム詳細取得失敗:', itemPath);
                        detailedItems.push({
                            name: item.name,
                            isDirectory: item.isDirectory(),
                            path: itemPath,
                            error: 'アクセス不可'
                        });
                    }
                }
                
                // Phase 2: フィルター・ソート処理
                let filteredItems = detailedItems;
                
                // 隠しファイルフィルター
                if (options.hideHidden) {
                    filteredItems = filteredItems.filter(item => !item.isHidden);
                }
                
                // 種類フィルター
                if (options.fileTypes) {
                    filteredItems = filteredItems.filter(item => 
                        item.isDirectory || options.fileTypes.includes(item.type)
                    );
                }
                
                // ソート処理
                const sortBy = options.sortBy || 'name';
                filteredItems.sort((a, b) => {
                    // ディレクトリを最初に
                    if (a.isDirectory && !b.isDirectory) return -1;
                    if (!a.isDirectory && b.isDirectory) return 1;
                    
                    // 指定されたフィールドでソート
                    switch (sortBy) {
                        case 'name':
                            return a.name.localeCompare(b.name, 'ja', { numeric: true });
                        case 'modified':
                            return (b.modified?.getTime() || 0) - (a.modified?.getTime() || 0);
                        case 'size':
                            return (b.size || 0) - (a.size || 0);
                        case 'type':
                            return (a.type || '').localeCompare(b.type || '');
                        default:
                            return 0;
                    }
                });
                
                console.log(`📁 ディレクトリ読み込み完了: ${dirPath} (${filteredItems.length}件)`);
                return filteredItems;
                
            } catch (error) {
                console.error('❌ ディレクトリ読み込みエラー:', error);
                return {
                    error: error.message,
                    items: []
                };
            }
        });
        
        // ファイル情報取得（プレビュー用）
        ipcMain.handle('get-file-info', async (event, filePath) => {
            try {
                const stats = await fs.stat(filePath);
                const ext = path.extname(filePath).toLowerCase();
                
                const info = {
                    path: filePath,
                    name: path.basename(filePath),
                    size: stats.size,
                    modified: stats.mtime,
                    created: stats.ctime,
                    extension: ext,
                    type: this.getFileType(ext)
                };
                
                // プロジェクトファイルの場合は内容の一部を読み込み
                if (ext === '.sep') {
                    try {
                        const content = await fs.readFile(filePath, 'utf-8');
                        const projectData = JSON.parse(content);
                        info.preview = {
                            version: projectData.version || 'unknown',
                            characters: projectData.characters ? Object.keys(projectData.characters).length : 0,
                            lastModified: projectData.lastModified || stats.mtime
                        };
                    } catch {
                        // プレビュー取得失敗時は基本情報のみ
                    }
                }
                
                return { success: true, info };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        console.log('✅ IPC通信ハンドラー設定完了');
    }
    
    // ファイル種別判定
    getFileType(extension) {
        const types = {
            '.sep': 'spine-project',
            '.json': 'json',
            '.zip': 'archive',
            '.png': 'image',
            '.jpg': 'image',
            '.jpeg': 'image',
            '.atlas': 'spine-atlas',
            '.skel': 'spine-skeleton'
        };
        return types[extension] || 'unknown';
    }
    
    // Phase 2追加：ファイルサイズフォーマット
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const digitGroups = Math.floor(Math.log(bytes) / Math.log(1024));
        const size = bytes / Math.pow(1024, digitGroups);
        
        return `${size.toFixed(digitGroups > 0 ? 1 : 0)} ${units[digitGroups]}`;
    }
    
    // Phase 2追加：日付フォーマット
    formatDate(date) {
        if (!date) return 'Unknown';
        
        const now = new Date();
        const target = new Date(date);
        const diffMs = now.getTime() - target.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            // 今日の場合は時間を表示
            return target.toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (diffDays === 1) {
            return '昨日';
        } else if (diffDays < 7) {
            return `${diffDays}日前`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks}週間前`;
        } else {
            // 1ヶ月以上前は日付を表示
            return target.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }
    
    // Phase 2追加：プロジェクトファイル検証
    async validateProjectFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(content);
            
            const validation = {
                valid: true,
                version: data.version || 'unknown',
                errors: [],
                warnings: [],
                info: {
                    projectName: data.project?.name || path.basename(filePath, '.sep'),
                    characterCount: data.characters ? Object.keys(data.characters).length : 0,
                    hasTimeline: !!data.timeline,
                    fileSize: (await fs.stat(filePath)).size
                }
            };
            
            // バージョンチェック
            const version = parseFloat(data.version || '0');
            if (isNaN(version)) {
                validation.errors.push('バージョン情報が不正です');
                validation.valid = false;
            } else if (version < 3.0) {
                validation.warnings.push('古いバージョンのプロジェクトファイルです');
            } else if (version > 5.0) {
                validation.warnings.push('新しいバージョンのプロジェクトファイルです。互換性に問題がある可能性があります');
            }
            
            // 必須フィールドチェック
            if (!data.project) {
                validation.errors.push('プロジェクト情報が見つかりません');
                validation.valid = false;
            }
            
            return validation;
            
        } catch (error) {
            return {
                valid: false,
                errors: [`ファイル検証エラー: ${error.message}`],
                warnings: [],
                info: null
            };
        }
    }
    
    // Phase 2追加：関連ファイル検出ユーティリティ
    async findRelatedFiles(filePath) {
        try {
            const directory = path.dirname(filePath);
            const baseName = path.basename(filePath, path.extname(filePath));
            const items = await fs.readdir(directory, { withFileTypes: true });
            
            const relatedFiles = [];
            
            for (const item of items) {
                if (!item.isDirectory() && item.name !== path.basename(filePath)) {
                    const itemBaseName = path.basename(item.name, path.extname(item.name));
                    
                    // 同名の異なる拡張子ファイルを検出
                    if (itemBaseName === baseName) {
                        relatedFiles.push({
                            path: path.join(directory, item.name),
                            name: item.name,
                            extension: path.extname(item.name),
                            type: this.getFileType(path.extname(item.name)),
                            relationship: 'same_name'
                        });
                    }
                    
                    // Spineファイル関連の検出
                    if (path.extname(filePath) === '.json' && 
                        (item.name.endsWith('.atlas') || item.name.endsWith('.png'))) {
                        if (item.name.startsWith(baseName)) {
                            relatedFiles.push({
                                path: path.join(directory, item.name),
                                name: item.name,
                                extension: path.extname(item.name),
                                type: this.getFileType(path.extname(item.name)),
                                relationship: 'spine_asset'
                            });
                        }
                    }
                }
            }
            
            return relatedFiles;
            
        } catch (error) {
            console.error('❌ 関連ファイル検出エラー:', error);
            return [];
        }
    }

    // 新規プロジェクト
    async newProject() {
        console.log('📝 新規プロジェクト作成');
        this.projectData.currentProject = null;
        this.mainWindow?.webContents.send('project-new');
    }

    // プロジェクト読み込み（改良版）
    async openProject() {
        console.log('📂 プロジェクト読み込み');
        
        // レンダラープロセスにファイル選択イベントを送信
        // 実際のダイアログ表示はレンダラー側で行う（履歴表示のため）
        this.mainWindow?.webContents.send('show-open-project-dialog');
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

    // プロジェクト保存（改良版）
    async saveProject() {
        console.log('💾 プロジェクト保存');
        
        // レンダラープロセスにファイル保存イベントを送信
        // 実際のダイアログ表示はレンダラー側で行う（履歴表示のため）
        this.mainWindow?.webContents.send('show-save-project-dialog');
    }

    // パッケージエクスポート（改良版）
    async exportPackage() {
        console.log('📦 パッケージエクスポート');
        
        // レンダラープロセスにエクスポートダイアログイベントを送信
        this.mainWindow?.webContents.send('show-export-dialog');
    }

    // 🔍 Canvas診断プローブウィンドウ
    openCanvasProbe() {
        console.log('🔍 Canvas診断プローブウィンドウ起動');
        
        const probeWindow = new BrowserWindow({
            width: 800,
            height: 600,
            title: 'Canvas/WebGL 診断プローブ',
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false
                // 診断用なので最小構成
            },
            show: true
        });

        // プローブページ読み込み
        const probePath = path.join(__dirname, '../renderer/tests/canvas-probe.html');
        probeWindow.loadFile(probePath);

        // 開発者ツールを開く（診断結果確認用）
        probeWindow.webContents.openDevTools();

        console.log('✅ Canvas診断プローブウィンドウ起動完了');
    }

    // 🔍 HTTP読み込みテスト
    testHttpLoad() {
        console.log('🔍 HTTP読み込みテスト起動');
        
        const httpWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            title: 'HTTP読み込みテスト - index-clean.html',
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false
            },
            show: true
        });

        // HTTP読み込み（成功実証済み環境）
        const httpUrl = 'http://127.0.0.1:8001/index-clean.html';
        console.log('🔍 HTTP読み込み実行:', httpUrl);
        
        httpWindow.loadURL(httpUrl).then(() => {
            console.log('✅ HTTP読み込み成功');
        }).catch((error) => {
            console.error('❌ HTTP読み込み失敗:', error);
            // フォールバック: HTTPサーバー未起動の可能性
            dialog.showErrorBox(
                'HTTP読み込みテスト失敗', 
                `URL: ${httpUrl}\n\nPython HTTPサーバーが起動しているか確認してください：\ncd /mnt/d/クラウドパートナーHP && python3 -m http.server 8001`
            );
        });

        // 開発者ツールを開く
        httpWindow.webContents.openDevTools();

        console.log('✅ HTTP読み込みテストウィンドウ起動完了');
    }

    // アプリケーション初期化（HTTP環境統合版）
    async initialize() {
        console.log('🔄 Spine Editor Desktop 初期化開始（HTTP環境統合版）');
        
        try {
            // HTTP環境が有効な場合は先にサーバーを起動
            if (this.useHttpEnvironment) {
                console.log('🌐 HTTP環境初期化開始');
                try {
                    this.httpServerUrl = await this.httpServer.startServer();
                    console.log(`✅ HTTP環境初期化完了: ${this.httpServerUrl}`);
                } catch (httpError) {
                    console.error('❌ HTTP環境初期化失敗:', httpError);
                    console.log('🔄 HTTP環境無効化 - file://環境に切り替え');
                    this.useHttpEnvironment = false;
                    this.httpServerUrl = null;
                }
            }
            
            // メインウィンドウ作成（HTTP環境準備後）
            console.log('🖼️ メインウィンドウ作成を開始...');
            await this.createMainWindow();
            console.log('✅ メインウィンドウ作成完了');
            
            console.log('🔧 メニュー作成を開始...');
            this.createMenu();
            console.log('✅ メニュー作成完了');
            
            console.log('🔗 IPC設定を開始...');
            this.setupIPC();
            console.log('✅ IPC設定完了');
            
            console.log('✅ Spine Editor Desktop 初期化完了（HTTP環境統合版）');
            
        } catch (error) {
            console.error('❌ アプリケーション初期化エラー:', error);
            console.error('❌ エラースタック:', error.stack);
            
            // 最後の手段：最小限のウィンドウ作成を試行
            try {
                console.log('🚨 緊急モード：最小限ウィンドウ作成試行');
                if (!this.mainWindow) {
                    this.mainWindow = new BrowserWindow({
                        width: 800,
                        height: 600,
                        show: true, // 緊急時は即座に表示
                        webPreferences: {
                            nodeIntegration: false,
                            contextIsolation: true
                        }
                    });
                    console.log('✅ 緊急ウィンドウ作成成功');
                }
            } catch (emergencyError) {
                console.error('❌ 緊急ウィンドウ作成も失敗:', emergencyError);
                throw error; // 元のエラーを再スロー
            }
        }
    }
}

// アプリケーションインスタンス
const spineEditorApp = new SpineEditorApp();

// 🔧 GPU診断・強制有効化スイッチ（Canvas/WebGL問題切り分け用）
console.log('🔍 GPU診断用スイッチ設定開始');

// 🚨 WebGL強制有効化フラグ（診断結果: webgl: disabled_off 対策）
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
app.commandLine.appendSwitch('disable-gpu-sandbox');                    // GPU サンドボックス無効化
app.commandLine.appendSwitch('enable-gpu-rasterization');              // GPU ラスタライゼーション強制
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');       // ネイティブGPUメモリ使用
app.commandLine.appendSwitch('enable-gpu-memory-buffer-video-frames');  // GPUメモリバッファ強制
app.commandLine.appendSwitch('disable-software-rasterizer');            // ソフトウェアレンダリング禁止
app.commandLine.appendSwitch('disable-gpu-driver-bug-workarounds');     // GPUドライバ制限回避
app.commandLine.appendSwitch('enable-webgl');                          // WebGL明示的有効化
app.commandLine.appendSwitch('enable-webgl2');                         // WebGL2明示的有効化

// Windows用ANGLE設定強化
if (process.platform === 'win32') {
    app.commandLine.appendSwitch('use-angle', 'd3d11');  // Windows: ANGLEをD3D11に
    app.commandLine.appendSwitch('enable-d3d11');        // Direct3D 11強制
}

// 🔍 設定したスイッチの確認
const setCommandLineSwitches = [
    'ignore-gpu-blacklist',
    'enable-accelerated-2d-canvas',
    'disable-gpu-sandbox',
    'enable-gpu-rasterization', 
    'enable-native-gpu-memory-buffers',
    'enable-gpu-memory-buffer-video-frames',
    'disable-software-rasterizer',
    'disable-gpu-driver-bug-workarounds',
    'enable-webgl',
    'enable-webgl2'
];

if (process.platform === 'win32') {
    setCommandLineSwitches.push('use-angle', 'enable-d3d11');
}

console.log('✅ GPU診断用スイッチ設定完了 - WebGL強制有効化対応');
console.log('🎯 設定されたスイッチ:', setCommandLineSwitches.length, '個');
console.log('📋 詳細:', setCommandLineSwitches.join(', '));

// Electronアプリケーションイベント
// 🎯 Spine WebGL対応: GPU加速有効化（WebGLレンダリング許可）
// app.disableHardwareAcceleration(); // ← WebGL阻害のため無効化

app.whenReady().then(async () => {
    console.log('🎬 Electron Ready - アプリケーション初期化開始');
    
    // 🔍 GPU状態診断（強化版）
    try {
        const gpuStatus = await app.getGPUFeatureStatus();
        console.log('🔍 =====[ GPU診断結果 ]=====');
        console.log('🎯 WebGL関連（修正対象）:');
        console.log('  - webgl:', gpuStatus['webgl'] || 'undefined');
        console.log('  - webgl2:', gpuStatus['webgl2'] || 'undefined');
        console.log('📊 その他GPU機能:');
        console.log('  - 2d_canvas:', gpuStatus['2d_canvas'] || 'undefined');
        console.log('  - gpu_compositing:', gpuStatus['gpu_compositing'] || 'undefined');
        console.log('  - multiple_raster_threads:', gpuStatus['multiple_raster_threads'] || 'undefined');
        console.log('  - rasterization:', gpuStatus['rasterization'] || 'undefined');
        console.log('  - video_decode:', gpuStatus['video_decode'] || 'undefined');
        console.log('🔍 完全なGPU状態:', JSON.stringify(gpuStatus, null, 2));
        
        // 🚨 WebGL状態判定
        const webglEnabled = gpuStatus['webgl'] === 'enabled';
        const webgl2Enabled = gpuStatus['webgl2'] === 'enabled';
        
        if (webglEnabled && webgl2Enabled) {
            console.log('✅ WebGL強制有効化成功 - Spine動作可能');
        } else if (webglEnabled) {
            console.log('⚠️ WebGL1のみ有効 - WebGL2無効、Spine動作制限あり');
        } else {
            console.log('❌ WebGL無効 - 追加設定が必要、Spine動作不可');
        }
        
    } catch (error) {
        console.error('❌ GPU状態取得エラー:', error);
    }
    
    await spineEditorApp.initialize();
    
    // 🔍 Canvas診断プローブウィンドウ（別ウィンドウで診断）
    setTimeout(() => {
        spineEditorApp.openCanvasProbe();
    }, 2000); // メインウィンドウ表示から2秒後
});

app.on('window-all-closed', () => {
    console.log('📱 全ウィンドウクローズ');
    
    // HTTPサーバー停止処理
    if (spineEditorApp.httpServer) {
        spineEditorApp.httpServer.stopServer();
    }
    
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

console.log('📋 Spine Editor Desktop Main Process 設定完了（Phase 2強化版）');