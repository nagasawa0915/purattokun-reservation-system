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
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                        <span style="color: #00ff88; font-size: 16px;">📁</span>
                        <span style="color: #00ff88; font-weight: bold;">${this.escapeHtml(rootName)}</span>
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
     * @returns {string} HTML文字列
     */
    generateTreeLevel(level, depth) {
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
                // フォルダ表示
                html += `
                    <li style="margin: 6px 0; margin-left: ${indent}px;">
                        <div style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 2px 4px; border-radius: 3px; transition: background-color 0.2s;" 
                             onmouseover="this.style.backgroundColor='rgba(255,255,255,0.05)'" 
                             onmouseout="this.style.backgroundColor='transparent'">
                            <span style="color: #007acc; font-size: 14px;">📁</span>
                            <span style="color: #ccc;">${this.escapeHtml(name)}</span>
                        </div>
                        <ul style="list-style: none; margin-left: 16px;">
                            ${this.generateTreeLevel(item.children, depth + 1)}
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
            console.log('🔄 アウトライナーを元の状態に復元');
        }
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
            listenerCount: this.fileSelectHandlers.length
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
    }
}