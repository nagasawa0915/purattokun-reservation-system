// Spine Editor Desktop v2.0 - Demo Modules Integration
// 最小統合版：project-loader, page-selector, html-previewerの統合

/**
 * プロジェクトローダー（最小版）
 */
window.projectLoader = {
    currentProject: null,
    htmlFiles: [],
    
    async selectFolder(defaultPath = null) {
        try {
            console.log('📁 フォルダ選択ダイアログを開きます');
            console.log('🔧 受信したdefaultPath:', defaultPath, 'タイプ:', typeof defaultPath, '真偽値:', !!defaultPath);
            if (defaultPath) {
                console.log('💾 初期パス使用:', defaultPath);
            }
            
            // Electronのダイアログを使用
            if (window.electronAPI && window.electronAPI.fs) {
                const dialogOptions = {
                    title: 'プロジェクトフォルダを選択',
                    properties: ['openDirectory'],
                    buttonLabel: 'フォルダを選択'
                };
                
                // 初期パスがある場合は設定
                if (defaultPath) {
                    dialogOptions.defaultPath = defaultPath;
                    console.log('💾 ダイアログに初期パス設定:', defaultPath);
                }
                
                console.log('🔧 ダイアログオプション:', dialogOptions);
                const result = await window.electronAPI.fs.selectFolder(dialogOptions);
                
                // console.log('🔧 Dialog result:', result);
                
                if (result.canceled || !result.filePaths?.length) {
                    console.log('📁 フォルダ選択がキャンセルされました');
                    return { success: false, canceled: true };
                }
                
                const folderPath = result.filePaths[0];
                console.log('📁 選択されたフォルダ:', folderPath);
                
                // フォルダ内のHTMLファイルをスキャン
                const htmlFiles = await this.scanFolder(folderPath);
                this.currentProject = folderPath;
                this.htmlFiles = htmlFiles;
                
                console.log('📋 HTMLファイル検出:', htmlFiles.length, '個');
                
                return {
                    success: true,
                    path: folderPath,
                    files: htmlFiles,
                    allFiles: htmlFiles
                };
            } else {
                // フォールバック: モックデータ
                console.warn('Electron API not available, using mock data');
                return this.mockFolderSelect();
            }
        } catch (error) {
            console.error('フォルダ選択エラー:', error);
            return { success: false, error: error.message };
        }
    },
    
    async scanFolder(folderPath) {
        try {
            // console.log('🔧 スキャン開始:', folderPath);
            const result = await window.electronAPI.fs.scanDirectory(folderPath, ['.html', '.htm']);
            // console.log('🔧 scanDirectory結果:', result);
            
            if (!result.success) {
                console.error('スキャンエラー:', result.error);
                return [];
            }
            
            // resultの構造を確認
            const files = result.files;
            // console.log('🔧 files構造:', files);
            // console.log('🔧 files.html存在:', !!files.html);
            // console.log('🔧 files.html配列:', Array.isArray(files.html));
            // console.log('🔧 files.html最初の要素:', files.html?.[0]);
            // console.log('🔧 files.html最初の要素JSON:', JSON.stringify(files.html?.[0] || {}, null, 2));
            
            // HTMLファイルを抽出
            const htmlFiles = [];
            if (files.html && Array.isArray(files.html)) {
                files.html.forEach(filePath => {
                    // main.jsから文字列パスが返されるので、適切なオブジェクトに変換
                    const fileName = filePath.split('\\').pop() || filePath.split('/').pop();
                    const relativePath = filePath.replace(folderPath + '\\', '').replace(folderPath + '/', '');
                    
                    htmlFiles.push({
                        name: fileName,
                        path: relativePath,
                        fullPath: filePath,
                        isHTML: true
                    });
                });
            }
            
            // console.log('🔧 HTMLファイル一覧:', htmlFiles);
            // console.log('🔧 最初のファイル構造サンプル:', htmlFiles[0]);
            
            // if (htmlFiles[0]) {
            //     console.log('🔧 最初のファイルJSON:', JSON.stringify(htmlFiles[0], null, 2));
            //     console.log('🔧 最初のファイルのキー:', Object.keys(htmlFiles[0]));
            //     console.log('🔧 name値:', htmlFiles[0].name);
            //     console.log('🔧 path値:', htmlFiles[0].path);
            // }
            
            return htmlFiles;
            
        } catch (error) {
            console.error('フォルダスキャンエラー:', error);
            return [];
        }
    },
    
    // テスト用モックデータ
    mockFolderSelect() {
        const mockFiles = [
            { name: 'index.html', path: 'index.html', isHTML: true },
            { name: 'about.html', path: 'about.html', isHTML: true },
            { name: 'contact.html', path: 'contact.html', isHTML: true },
            { name: 'style.css', path: 'style.css', isHTML: false },
            { name: 'script.js', path: 'script.js', isHTML: false }
        ];
        
        this.currentProject = '/mock/project';
        this.htmlFiles = mockFiles.filter(f => f.isHTML);
        
        return {
            success: true,
            path: '/mock/project',
            files: this.htmlFiles,
            allFiles: mockFiles
        };
    }
};

/**
 * ページセレクター（最小版）
 */
window.pageSelector = {
    container: null,
    fileList: [],
    selectedFile: null,
    onPageSelect: null,
    
    initialize(container) {
        this.container = container;
        console.log('📋 ページセレクター初期化完了');
    },
    
    loadFiles(files) {
        this.fileList = files;
        this.render();
    },
    
    render() {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        
        if (this.fileList.length === 0) {
            this.container.innerHTML = '<div class="loading">HTMLファイルがありません</div>';
            return;
        }
        
        this.fileList.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.textContent = file.name;
            item.dataset.index = index;
            
            item.addEventListener('click', () => {
                this.selectFile(file, item);
            });
            
            this.container.appendChild(item);
        });
        
        // 最初のファイルを自動選択
        if (this.fileList.length > 0) {
            const firstItem = this.container.firstChild;
            this.selectFile(this.fileList[0], firstItem);
        }
    },
    
    selectFile(file, element) {
        // 選択状態の更新
        this.container.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('selected');
        });
        element.classList.add('selected');
        
        this.selectedFile = file;
        
        // コールバック実行
        if (this.onPageSelect) {
            this.onPageSelect(file);
        }
        
        // console.log('📋 ページ選択:', file.name);
    },
    
    setOnPageSelect(callback) {
        this.onPageSelect = callback;
    }
};

/**
 * HTMLプレビューア（最小版）
 */
window.htmlPreviewer = {
    container: null,
    iframe: null,
    placeholder: null,
    currentFile: null,
    
    initialize(previewContainer, placeholderElement) {
        this.container = previewContainer;
        this.placeholder = placeholderElement;
        
        // iframeを作成
        this.iframe = document.createElement('iframe');
        this.iframe.className = 'preview-iframe';
        this.iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            background-color: white;
            display: none;
        `;
        
        this.container.appendChild(this.iframe);
        console.log('🖼️ HTMLプレビューア初期化完了');
    },
    
    async loadFile(projectPath, filePath) {
        try {
            // console.log('🖼️ HTMLファイル読み込み開始:', filePath);
            
            if (window.electronAPI && window.electronAPI.fs) {
                // Electronでファイル読み込み
                const fullPath = `${projectPath}/${filePath}`;
                const content = await window.electronAPI.fs.readFile(fullPath);
                
                // Blob URLでiframeに表示
                const blob = new Blob([content], { type: 'text/html' });
                const blobURL = URL.createObjectURL(blob);
                
                this.iframe.src = blobURL;
                this.showPreview();
                
                // メモリリーク防止
                setTimeout(() => URL.revokeObjectURL(blobURL), 5000);
                
            } else {
                // フォールバック: 直接パス指定
                console.warn('Electron API not available, trying direct file access');
                this.iframe.src = `file://${projectPath}/${filePath}`;
                this.showPreview();
            }
            
            this.currentFile = filePath;
            // console.log('🖼️ プレビュー表示完了:', filePath);
            
        } catch (error) {
            console.error('HTMLファイル読み込みエラー:', error);
            this.showError(`ファイル読み込みエラー: ${error.message}`);
        }
    },
    
    showPreview() {
        if (this.placeholder) {
            this.placeholder.style.display = 'none';
        }
        this.iframe.style.display = 'block';
    },
    
    hidePreview() {
        if (this.placeholder) {
            this.placeholder.style.display = 'block';
        }
        this.iframe.style.display = 'none';
    },
    
    showError(message) {
        if (this.placeholder) {
            this.placeholder.textContent = message;
            this.placeholder.style.display = 'block';
        }
        this.iframe.style.display = 'none';
        console.error('HTMLプレビューエラー:', message);
    }
};

/**
 * デモ統合管理
 */
window.demoIntegration = {
    initialized: false,
    
    async initialize() {
        if (this.initialized) return;
        
        try {
            // 各モジュールの初期化
            const pageListContainer = document.getElementById('page-list');
            const previewContainer = document.querySelector('.preview-content');
            const placeholderElement = document.getElementById('preview-placeholder');
            const iframeElement = document.getElementById('preview-iframe');
            
            if (pageListContainer) {
                window.pageSelector.initialize(pageListContainer);
            }
            
            if (previewContainer && placeholderElement) {
                window.htmlPreviewer.initialize(previewContainer, placeholderElement);
            }
            
            // イベント連携
            window.pageSelector.setOnPageSelect((file) => {
                if (window.projectLoader.currentProject) {
                    window.htmlPreviewer.loadFile(
                        window.projectLoader.currentProject, 
                        file.path
                    );
                }
            });
            
            this.initialized = true;
            console.log('🎯 デモ統合初期化完了');
            
        } catch (error) {
            console.error('デモ統合初期化エラー:', error);
        }
    }
};

// DOMContentLoaded時に自動初期化
document.addEventListener('DOMContentLoaded', () => {
    window.demoIntegration.initialize();
});

console.log('🔧 Demo Modules loaded');