// 🎯 Spine Editor Desktop - Electron Main Process
// Phase 1: 最短MVP実装 - インポート→表示→編集→保存→エクスポート基本フロー

const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

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

console.log('📋 Spine Editor Desktop Main Process 設定完了（Phase 2強化版）');