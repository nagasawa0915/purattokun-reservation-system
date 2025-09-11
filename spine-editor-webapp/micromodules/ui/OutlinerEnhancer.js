/**
 * OutlinerEnhancer.js - アウトライナー機能拡張
 * 機能: フォルダツリー表示・HTMLファイル一覧・選択管理
 * UI非侵襲性: 既存アウトライナーの内容を置き換え（構造は維持）
 */

export class OutlinerEnhancer {
    constructor() {
        this.outlinerPanel = null;
        this.contentArea = null;
        this.selectedFile = null;
        this.fileSelectHandlers = [];
        this.originalContent = null;
        this.folderStates = new Map(); // フォルダの展開・折り畳み状態管理
        this.defaultExpanded = true; // デフォルトで展開状態
        
        console.log('📋 OutlinerEnhancer初期化');
        this.initializeOutliner();
    }

    /**
     * アウトライナー初期化
     */
    initializeOutliner() {
        // アウトライナーパネル取得
        this.outlinerPanel = document.querySelector('.panel-outliner');
        if (!this.outlinerPanel) {
            console.error('❌ アウトライナーパネルが見つかりません');
            return;
        }

        // コンテンツエリア取得
        this.contentArea = this.outlinerPanel.querySelector('.panel-content');
        if (!this.contentArea) {
            console.error('❌ アウトライナーコンテンツエリアが見つかりません');
            return;
        }

        // 元のコンテンツを保存
        this.originalContent = this.contentArea.innerHTML;

        console.log('✅ アウトライナー初期化完了');
    }

    /**
     * ファイル選択イベントリスナー追加
     * @param {Function} handler - 選択ハンドラー
     */
    addFileSelectListener(handler) {
        this.fileSelectHandlers.push(handler);
    }

    /**
     * ファイル選択イベント発火
     * @param {Object} fileData - ファイルデータ
     */
    notifyFileSelected(fileData) {
        this.selectedFile = fileData;
        this.fileSelectHandlers.forEach(handler => {
            try {
                handler(fileData);
            } catch (error) {
                console.error('❌ ファイル選択ハンドラーエラー:', error);
            }
        });
    }

    /**
     * フォルダ内容表示
     * @param {Object} folderData - フォルダデータ
     */
    displayFolderContents(folderData) {
        console.log('📁 フォルダ内容表示:', folderData.folderName);

        if (!this.contentArea) {
            console.error('❌ コンテンツエリアが利用できません');
            return;
        }

        // HTMLファイルをフォルダ構造で整理
        const fileTree = this.buildFileTree(folderData.htmlFiles);
        
        // アウトライナーコンテンツを生成
        const treeHtml = this.generateTreeHtml(folderData.folderName, fileTree);
        
        // コンテンツ更新
        this.contentArea.innerHTML = treeHtml;
        
        // イベントリスナー追加
        this.attachFileClickListeners();
        
        console.log(`✅ ${folderData.htmlFiles.length}個のHTMLファイルを表示`);
    }

    /**
     * ファイルツリー構築
     * @param {Array} htmlFiles - HTMLファイル配列
     * @returns {Object} ファイルツリー
     */
    buildFileTree(htmlFiles) {
        const tree = {};
        
        htmlFiles.forEach(file => {
            const pathParts = file.path.split('/');
            let currentLevel = tree;
            
            // フォルダ階層を構築
            for (let i = 0; i < pathParts.length - 1; i++) {
                const folderName = pathParts[i];
                if (!currentLevel[folderName]) {
                    currentLevel[folderName] = {
                        type: 'folder',
                        children: {}
                    };
                }
                currentLevel = currentLevel[folderName].children;
            }
            
            // ファイルを追加
            const fileName = pathParts[pathParts.length - 1];
            currentLevel[fileName] = {
                type: 'file',
                data: file
            };
        });
        
        return tree;
    }

    /**
     * ツリーHTML生成
     * @param {string} rootName - ルートフォルダ名
     * @param {Object} tree - ファイルツリー
     * @returns {string} HTML文字列
     */
    generateTreeHtml(rootName, tree) {
        const fileCount = this.countHtmlFiles(tree);
        
        let html = `
            <div style="color: #999; font-size: 13px;">
                <div style="margin-bottom: 15px; padding: 10px; background: rgba(0, 255, 136, 0.1); border-radius: 4px; border: 1px solid rgba(0, 255, 136, 0.3);">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <span style="color: #00ff88; font-size: 16px;">📁</span>
                        <span style="color: #00ff88; font-weight: bold; flex: 1;">${this.escapeHtml(rootName)}</span>
                        <div style="display: flex; gap: 4px;">
                            <button class="folder-control-btn" data-action="expand-all" 
                                    style="background: #3a3a3a; border: 1px solid #555; color: #ccc; padding: 2px 6px; border-radius: 3px; font-size: 10px; cursor: pointer; transition: all 0.2s;"
                                    onmouseover="this.style.backgroundColor='#4a4a4a'; this.style.borderColor='#666';"
                                    onmouseout="this.style.backgroundColor='#3a3a3a'; this.style.borderColor='#555';"
                                    title="すべて展開">📂</button>
                            <button class="folder-control-btn" data-action="collapse-all"
                                    style="background: #3a3a3a; border: 1px solid #555; color: #ccc; padding: 2px 6px; border-radius: 3px; font-size: 10px; cursor: pointer; transition: all 0.2s;"
                                    onmouseover="this.style.backgroundColor='#4a4a4a'; this.style.borderColor='#666';"
                                    onmouseout="this.style.backgroundColor='#3a3a3a'; this.style.borderColor='#555';"
                                    title="すべて折り畳み">📁</button>
                        </div>
                    </div>
                    <div style="font-size: 11px; color: #666;">
                        ${fileCount}個のHTMLファイル
                    </div>
                </div>
                <ul style="list-style: none; padding-left: 10px;">
        `;
        
        // ツリー内容を生成
        html += this.generateTreeLevel(tree, 0);
        
        html += `
                </ul>
            </div>
        `;
        
        return html;
    }

    /**
     * ツリーレベル生成（再帰）
     * @param {Object} level - ツリーレベル
     * @param {number} depth - 現在の深度
     * @param {string} parentPath - 親フォルダパス（状態管理用）
     * @returns {string} HTML文字列
     */
    generateTreeLevel(level, depth, parentPath = '') {
        let html = '';
        const indent = depth * 20;
        
        // エントリをソート（フォルダ→ファイル）
        const entries = Object.entries(level).sort(([,a], [,b]) => {
            if (a.type === 'folder' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'folder') return 1;
            return 0;
        });
        
        entries.forEach(([name, item]) => {
            if (item.type === 'folder') {
                // フォルダパスを構築
                const folderPath = parentPath ? `${parentPath}/${name}` : name;
                
                // フォルダの展開状態を取得
                const isExpanded = this.getFolderState(folderPath);
                const toggleIcon = isExpanded ? '🔽' : '▶️';
                const childrenVisibility = isExpanded ? 'block' : 'none';
                
                // フォルダ表示（折り畳み対応）
                html += `
                    <li style="margin: 6px 0; margin-left: ${indent}px;">
                        <div class="folder-header" 
                             data-folder-path="${this.escapeHtml(folderPath)}"
                             style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 2px 4px; border-radius: 3px; transition: all 0.2s ease; min-width: 0;" 
                             onmouseover="this.style.backgroundColor='rgba(255,255,255,0.05)'" 
                             onmouseout="this.style.backgroundColor='transparent'">
                            <span class="folder-toggle" style="color: #007acc; font-size: 12px; width: 16px; text-align: center; user-select: none; flex-shrink: 0;">${toggleIcon}</span>
                            <span style="color: #007acc; font-size: 14px; flex-shrink: 0;">📁</span>
                            <span style="color: #ccc; font-size: 13px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(name)}</span>
                            <span style="color: #666; font-size: 10px; flex-shrink: 0; margin-left: 4px;">${this.countHtmlFiles(item.children)}</span>
                        </div>
                        <ul class="folder-children" 
                            style="list-style: none; margin-left: 20px; display: ${childrenVisibility}; transition: all 0.3s ease; overflow: hidden;">
                            ${this.generateTreeLevel(item.children, depth + 1, folderPath)}
                        </ul>
                    </li>
                `;
            } else {
                // ファイル表示
                const filePath = item.data.path;
                html += `
                    <li style="margin: 4px 0; margin-left: ${indent}px;">
                        <div class="html-file-item" 
                             data-file-path="${this.escapeHtml(filePath)}"
                             style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 4px 6px; border-radius: 3px; transition: all 0.2s;" 
                             onmouseover="this.style.backgroundColor='rgba(0, 122, 204, 0.2)'; this.style.transform='translateX(2px)'" 
                             onmouseout="this.style.backgroundColor='transparent'; this.style.transform='translateX(0)'">
                            <span style="color: #ffdd00; font-size: 12px;">📄</span>
                            <span style="color: #ddd; font-size: 12px;">${this.escapeHtml(name)}</span>
                        </div>
                    </li>
                `;
            }
        });
        
        return html;
    }

    /**
     * HTMLファイル数カウント（再帰）
     * @param {Object} tree - ファイルツリー
     * @returns {number} ファイル数
     */
    countHtmlFiles(tree) {
        let count = 0;
        
        Object.values(tree).forEach(item => {
            if (item.type === 'file') {
                count++;
            } else if (item.type === 'folder') {
                count += this.countHtmlFiles(item.children);
            }
        });
        
        return count;
    }

    /**
     * フォルダ状態取得
     * @param {string} folderPath - フォルダパス
     * @returns {boolean} 展開状態
     */
    getFolderState(folderPath) {
        return this.folderStates.has(folderPath) 
            ? this.folderStates.get(folderPath) 
            : this.defaultExpanded;
    }

    /**
     * フォルダ状態設定
     * @param {string} folderPath - フォルダパス
     * @param {boolean} isExpanded - 展開状態
     */
    setFolderState(folderPath, isExpanded) {
        this.folderStates.set(folderPath, isExpanded);
        console.log(`📁 フォルダ状態更新: ${folderPath} = ${isExpanded ? '展開' : '折り畳み'}`);
    }

    /**
     * フォルダ切り替え処理
     * @param {string} folderPath - フォルダパス
     */
    toggleFolder(folderPath) {
        const currentState = this.getFolderState(folderPath);
        const newState = !currentState;
        
        this.setFolderState(folderPath, newState);
        
        // DOM要素を更新
        const folderHeader = this.contentArea.querySelector(`[data-folder-path="${folderPath}"]`);
        const folderChildren = folderHeader?.nextElementSibling;
        const toggleIcon = folderHeader?.querySelector('.folder-toggle');
        
        if (folderHeader && folderChildren && toggleIcon) {
            // アニメーション付きで切り替え
            toggleIcon.textContent = newState ? '🔽' : '▶️';
            
            if (newState) {
                // 展開アニメーション
                folderChildren.style.display = 'block';
                folderChildren.style.maxHeight = '0px';
                folderChildren.style.opacity = '0';
                
                // アニメーション実行
                setTimeout(() => {
                    folderChildren.style.maxHeight = '1000px';
                    folderChildren.style.opacity = '1';
                }, 10);
            } else {
                // 折り畳みアニメーション
                folderChildren.style.maxHeight = '0px';
                folderChildren.style.opacity = '0';
                
                setTimeout(() => {
                    folderChildren.style.display = 'none';
                }, 300);
            }
        }
    }

    /**
     * ファイルクリックイベント設定
     */
    attachFileClickListeners() {
        const fileItems = this.contentArea.querySelectorAll('.html-file-item');
        
        fileItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // 既存の選択状態をクリア
                this.clearFileSelection();
                
                // 新しい選択状態を設定
                item.style.backgroundColor = 'rgba(0, 255, 136, 0.3)';
                item.style.borderLeft = '3px solid #00ff88';
                
                // ファイルパス取得
                const filePath = item.dataset.filePath;
                console.log('📄 HTMLファイル選択:', filePath);
                
                // ファイル選択イベント発火
                this.notifyFileSelected({
                    path: filePath,
                    name: filePath.split('/').pop(),
                    element: item
                });
            });
        });
        
        console.log(`✅ ${fileItems.length}個のファイルにクリックリスナーを設定`);
        
        // フォルダクリックイベント設定
        this.attachFolderClickListeners();
        
        // フォルダ操作ボタンのイベント設定
        this.attachFolderControlListeners();
    }

    /**
     * フォルダクリックイベント設定
     */
    attachFolderClickListeners() {
        const folderHeaders = this.contentArea.querySelectorAll('.folder-header');
        
        folderHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const folderPath = header.dataset.folderPath;
                if (folderPath) {
                    // フォルダ折り畳み切り替え
                    this.toggleFolder(folderPath);
                    
                    // ホバー効果を一時的にリセット
                    header.style.backgroundColor = 'rgba(0, 122, 204, 0.2)';
                    setTimeout(() => {
                        header.style.backgroundColor = 'transparent';
                    }, 150);
                }
            });
        });
        
        console.log(`✅ ${folderHeaders.length}個のフォルダにクリックリスナーを設定`);
    }

    /**
     * フォルダ操作ボタンのイベントリスナー設定
     */
    attachFolderControlListeners() {
        const controlButtons = this.contentArea.querySelectorAll('.folder-control-btn');
        
        controlButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const action = button.dataset.action;
                
                // ボタンのクリックエフェクト
                button.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    button.style.transform = 'scale(1)';
                }, 100);
                
                if (action === 'expand-all') {
                    console.log('📂 全フォルダ展開実行');
                    this.expandAllFolders();
                } else if (action === 'collapse-all') {
                    console.log('📁 全フォルダ折り畳み実行');
                    this.collapseAllFolders();
                }
            });
        });
        
        console.log(`✅ ${controlButtons.length}個のフォルダ操作ボタンにリスナーを設定`);
    }

    /**
     * ファイル選択状態クリア
     */
    clearFileSelection() {
        const fileItems = this.contentArea.querySelectorAll('.html-file-item');
        fileItems.forEach(item => {
            item.style.backgroundColor = 'transparent';
            item.style.borderLeft = 'none';
        });
        this.selectedFile = null;
    }

    /**
     * エラー表示
     * @param {string} message - エラーメッセージ
     */
    displayError(message) {
        if (!this.contentArea) return;
        
        this.contentArea.innerHTML = `
            <div style="color: #ff6b6b; font-size: 13px; text-align: center; padding: 20px;">
                <div style="font-size: 32px; margin-bottom: 15px;">⚠️</div>
                <p style="margin-bottom: 10px;">エラーが発生しました</p>
                <p style="font-size: 11px; color: #999;">${this.escapeHtml(message)}</p>
            </div>
        `;
    }

    /**
     * ローディング表示
     */
    showLoading() {
        if (!this.contentArea) return;
        
        this.contentArea.innerHTML = `
            <div style="color: #999; font-size: 13px; text-align: center; padding: 20px;">
                <div style="font-size: 32px; margin-bottom: 15px; animation: spin 2s linear infinite;">⏳</div>
                <p style="margin-bottom: 10px;">フォルダをスキャンしています...</p>
                <p style="font-size: 11px; color: #666;">HTMLファイルを検索中</p>
            </div>
            <style>
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            </style>
        `;
    }

    /**
     * 元のコンテンツに復元
     */
    resetToOriginal() {
        if (this.contentArea && this.originalContent) {
            this.contentArea.innerHTML = this.originalContent;
            this.clearFileSelection();
            this.folderStates.clear(); // フォルダ状態もクリア
            console.log('🔄 アウトライナーを元の状態に復元');
        }
    }

    /**
     * 全フォルダ展開
     */
    expandAllFolders() {
        const folderHeaders = this.contentArea.querySelectorAll('.folder-header');
        folderHeaders.forEach(header => {
            const folderPath = header.dataset.folderPath;
            if (folderPath && !this.getFolderState(folderPath)) {
                this.toggleFolder(folderPath);
            }
        });
        console.log('📂 全フォルダを展開しました');
    }

    /**
     * 全フォルダ折り畳み
     */
    collapseAllFolders() {
        const folderHeaders = this.contentArea.querySelectorAll('.folder-header');
        folderHeaders.forEach(header => {
            const folderPath = header.dataset.folderPath;
            if (folderPath && this.getFolderState(folderPath)) {
                this.toggleFolder(folderPath);
            }
        });
        console.log('📁 全フォルダを折り畳みました');
    }

    /**
     * HTML エスケープ
     * @param {string} text - エスケープする文字列
     * @returns {string} エスケープ済み文字列
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 選択中のファイル取得
     * @returns {Object|null} 選択中のファイル
     */
    getSelectedFile() {
        return this.selectedFile;
    }

    /**
     * システム状態取得
     * @returns {Object} システム状態
     */
    getStatus() {
        return {
            isInitialized: !!this.outlinerPanel,
            hasContent: !!this.contentArea,
            selectedFile: this.selectedFile?.path || null,
            listenerCount: this.fileSelectHandlers.length,
            folderCount: this.folderStates.size,
            defaultExpanded: this.defaultExpanded,
            expandedFolders: Array.from(this.folderStates.entries())
                .filter(([,expanded]) => expanded)
                .map(([path]) => path)
        };
    }

    /**
     * クリーンアップ
     */
    destroy() {
        console.log('🧹 OutlinerEnhancer クリーンアップ');
        this.resetToOriginal();
        this.fileSelectHandlers = [];
        this.selectedFile = null;
        this.folderStates.clear();
    }
}