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
    listDirectory: (dirPath) => ipcRenderer.invoke('list-directory', dirPath),

    // プロジェクト管理
    onProjectNew: (callback) => ipcRenderer.on('project-new', callback),
    onProjectOpen: (callback) => ipcRenderer.on('project-open', callback),
    onProjectSave: (callback) => ipcRenderer.on('project-save', callback),

    // フォルダ選択イベント
    onHomepageFolderSelected: (callback) => ipcRenderer.on('homepage-folder-selected', callback),
    onSpineFolderSelected: (callback) => ipcRenderer.on('spine-folder-selected', callback),

    // エクスポート
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

// デバッグ情報
console.log('✅ Spine Editor Desktop - Preload Script 設定完了');
console.log('🔍 利用可能API:', {
    electronAPI: Object.keys(electronAPI),
    vfsAPI: Object.keys(vfsAPI),
    spineAPI: Object.keys(spineAPI)
});