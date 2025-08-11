// 🎯 Spine Editor Desktop - Preload Script (Secure API)
// レンダラープロセスとメインプロセス間のセキュアな通信インターフェース

const { contextBridge, ipcRenderer } = require('electron');

console.log('🔗 Spine Editor Desktop - Preload Script 読み込み');

// セキュアAPI定義
const electronAPI = {
    // ファイル・フォルダ操作
    selectFolder: (options) => ipcRenderer.invoke('select-folder', options),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    saveFile: (filePath, content) => ipcRenderer.invoke('save-file', filePath, content),
    // Phase 2強化：ディレクトリ一覧取得（フィルター・ソート対応）
    listDirectory: (dirPath, options) => ipcRenderer.invoke('list-directory', dirPath, options),
    
    // プロフェッショナルファイルダイアログ
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    showExportDialog: (options) => ipcRenderer.invoke('show-export-dialog', options),
    
    // Phase 2強化：ファイル履歴管理（詳細情報付き）
    getFileHistory: (type) => ipcRenderer.invoke('get-file-history', type),
    clearFileHistory: (type) => ipcRenderer.invoke('clear-file-history', type),
    
    // Phase 2強化：ファイル情報・プレビュー（プロフェッショナル版）
    getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),
    findRelatedFiles: (filePath) => ipcRenderer.invoke('find-related-files', filePath),
    validateProjectFile: (filePath) => ipcRenderer.invoke('validate-project-file', filePath),

    // プロジェクト管理
    onProjectNew: (callback) => ipcRenderer.on('project-new', callback),
    onProjectOpen: (callback) => ipcRenderer.on('project-open', callback),
    onProjectSave: (callback) => ipcRenderer.on('project-save', callback),
    
    // プロフェッショナルダイアログイベント
    onShowOpenProjectDialog: (callback) => ipcRenderer.on('show-open-project-dialog', callback),
    onShowSaveProjectDialog: (callback) => ipcRenderer.on('show-save-project-dialog', callback),
    onShowExportDialog: (callback) => ipcRenderer.on('show-export-dialog', callback),

    // フォルダ選択イベント
    onHomepageFolderSelected: (callback) => ipcRenderer.on('homepage-folder-selected', callback),
    onSpineFolderSelected: (callback) => ipcRenderer.on('spine-folder-selected', callback),

    // エクスポート（既存の後方互換性のために保持）
    onPackageExport: (callback) => ipcRenderer.on('package-export', callback),

    // イベントリスナー削除
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

    // 開発者向け情報
    versions: process.versions,
    platform: process.platform
};

// レンダラープロセスにAPIを公開
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// VFS（Virtual File System）API - Blob URL管理
const vfsAPI = {
    // Blob URL作成・管理
    blobCache: new Map(),
    
    createBlobURL: (data, type = 'application/octet-stream') => {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        return url;
    },
    
    revokeBlobURL: (url) => {
        URL.revokeObjectURL(url);
    },
    
    // ファイル読み込み→Blob URL変換
    loadFileAsBlob: async (filePath) => {
        try {
            const result = await electronAPI.readFile(filePath);
            if (!result.success) {
                throw new Error(result.error);
            }
            
            // ファイル拡張子からMIMEタイプ判定
            const ext = filePath.toLowerCase().split('.').pop();
            const mimeTypes = {
                'json': 'application/json',
                'atlas': 'text/plain',
                'png': 'image/png',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'css': 'text/css',
                'js': 'application/javascript',
                'html': 'text/html'
            };
            
            const mimeType = mimeTypes[ext] || 'application/octet-stream';
            const blobURL = vfsAPI.createBlobURL(result.content, mimeType);
            
            return { success: true, blobURL, filePath };
        } catch (error) {
            console.error('Blob URL変換エラー:', error);
            return { success: false, error: error.message };
        }
    },
    
    // キャッシュクリア
    clearCache: () => {
        for (const url of vfsAPI.blobCache.values()) {
            URL.revokeObjectURL(url);
        }
        vfsAPI.blobCache.clear();
    }
};

// VFS APIを公開
contextBridge.exposeInMainWorld('vfsAPI', vfsAPI);

// Spine操作用ヘルパーAPI
const spineAPI = {
    // Spineファイル構造解析
    analyzeSpineStructure: async (characterFolder) => {
        try {
            const items = await electronAPI.listDirectory(characterFolder);
            const spineFiles = {
                json: null,
                atlas: null,
                images: []
            };
            
            for (const item of items) {
                if (!item.isDirectory) {
                    const ext = item.name.toLowerCase().split('.').pop();
                    switch (ext) {
                        case 'json':
                            spineFiles.json = item.path;
                            break;
                        case 'atlas':
                            spineFiles.atlas = item.path;
                            break;
                        case 'png':
                        case 'jpg':
                        case 'jpeg':
                            spineFiles.images.push(item.path);
                            break;
                    }
                }
            }
            
            return { success: true, spineFiles };
        } catch (error) {
            console.error('Spine構造解析エラー:', error);
            return { success: false, error: error.message };
        }
    },
    
    // .atlasファイル解析→画像参照抽出
    parseAtlasFile: async (atlasFilePath) => {
        try {
            const result = await electronAPI.readFile(atlasFilePath);
            if (!result.success) {
                throw new Error(result.error);
            }
            
            // .atlasファイルから画像ファイル名抽出
            const lines = result.content.split('\n');
            const imageFiles = [];
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('size:') && !trimmed.startsWith('format:') && 
                    !trimmed.startsWith('filter:') && !trimmed.startsWith('repeat:') &&
                    !trimmed.includes(':') && trimmed.match(/\.(png|jpg|jpeg)$/i)) {
                    imageFiles.push(trimmed);
                }
            }
            
            return { success: true, imageFiles };
        } catch (error) {
            console.error('Atlas解析エラー:', error);
            return { success: false, error: error.message };
        }
    }
};

// Spine APIを公開
contextBridge.exposeInMainWorld('spineAPI', spineAPI);

// Phase 2追加：プロフェッショナルダイアログユーティリティ
const dialogUtilsAPI = {
    // ダイアログヘルパー関数
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const digitGroups = Math.floor(Math.log(bytes) / Math.log(1024));
        const size = bytes / Math.pow(1024, digitGroups);
        return `${size.toFixed(digitGroups > 0 ? 1 : 0)} ${units[digitGroups]}`;
    },
    
    formatDate: (date) => {
        if (!date) return 'Unknown';
        const target = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - target.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
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
            return target.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    },
    
    getFileTypeIcon: (extension, type) => {
        const icons = {
            // プロジェクトファイル
            'spine-project': '🎨',
            'spine-project-legacy': '📄',
            
            // データファイル
            'json': '🗎️',
            'xml': '🗎️',
            'yaml': '🗎️',
            
            // 画像ファイル
            'image': '🏞️',
            'image-vector': '🎨',
            
            // Spineファイル
            'spine-atlas': '🗺️',
            'spine-skeleton': '🦴',
            'spine-binary': '📦',
            
            // アーカイブ
            'archive': '🗜️',
            
            // ドキュメント
            'document': '📄',
            'markdown': '📝',
            'text': '📄',
            
            // コード
            'javascript': '📦',
            'typescript': '📦',
            'html': '🌐',
            'css': '🎨',
            
            // メディア
            'audio': '🎧',
            'video': '🎥'
        };
        
        return icons[type] || '📄';
    },
    
    // ファイルステータスバッジを生成
    generateStatusBadge: (fileInfo) => {
        const badges = [];
        
        if (fileInfo.isRecent) {
            badges.push('🆕 新規');
        }
        
        if (fileInfo.projectInfo && fileInfo.projectInfo.warnings?.length > 0) {
            badges.push('⚠️ 警告');
        }
        
        if (fileInfo.projectInfo && !fileInfo.projectInfo.valid) {
            badges.push('❌ エラー');
        }
        
        if (!fileInfo.accessible) {
            badges.push('🚫 不可');
        }
        
        return badges.join(' ');
    },
    
    // プロジェクト情報の要約文字列を生成
    generateProjectSummary: (projectPreview) => {
        if (!projectPreview) return '詳細不明';
        
        const parts = [];
        
        if (projectPreview.version && projectPreview.version !== 'unknown') {
            parts.push(`v${projectPreview.version}`);
        }
        
        if (projectPreview.characterCount !== undefined) {
            parts.push(`${projectPreview.characterCount}体のキャラクター`);
        }
        
        if (projectPreview.hasTimeline) {
            parts.push('タイムライン付き');
        }
        
        return parts.length > 0 ? parts.join(' • ') : '基本プロジェクト';
    }
};

// Dialog Utils APIを公開
contextBridge.exposeInMainWorld('dialogUtilsAPI', dialogUtilsAPI);

// デバッグ情報
console.log('✅ Spine Editor Desktop - Preload Script 設定完了（Phase 2強化版）');
console.log('🔍 利用可能API:', {
    electronAPI: Object.keys(electronAPI),
    vfsAPI: Object.keys(vfsAPI),
    spineAPI: Object.keys(spineAPI),
    dialogUtilsAPI: Object.keys(dialogUtilsAPI)
});