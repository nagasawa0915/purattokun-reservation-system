/**
 * プレビュー管理モジュール
 * HTMLプレビュー表示、アウトライナー表示、ファイル選択を担当
 */

import { Utils } from './utils.js';

export class PreviewManager {
    constructor() {
        this.currentPage = null;
        this.previewIframe = null;
        this.previewPlaceholder = null;
        this.pageListElement = null;
    }

    /**
     * プレビュー要素を初期化
     * @param {Element} iframe - プレビューiframe要素
     * @param {Element} placeholder - プレビュープレースホルダー要素
     * @param {Element} pageList - ページリスト要素
     */
    initialize(iframe, placeholder, pageList) {
        this.previewIframe = iframe;
        this.previewPlaceholder = placeholder;
        this.pageListElement = pageList;
    }

    /**
     * プロジェクトファイルをアウトライナー方式で表示
     * @param {Array} files - ファイルリスト
     * @param {Function} onFileSelect - ファイル選択時のコールバック
     */
    renderOutlinerView(files, onFileSelect) {
        if (!this.pageListElement) {
            console.error('❌ ページリスト要素が初期化されていません');
            return;
        }
        
        // ファイルを階層別に分類
        const hierarchy = this.organizeFilesHierarchy(files);
        
        // アウトライナーUIを作成
        this.pageListElement.innerHTML = '';
        
        // ルート直下ファイル（優先表示）
        if (hierarchy.root.length > 0) {
            const rootSection = this.createFileSection('📄 ルートファイル', hierarchy.root, true, onFileSelect);
            this.pageListElement.appendChild(rootSection);
        }
        
        // サブフォルダ（折りたたみ表示）
        Object.keys(hierarchy.folders).forEach(folderName => {
            const folderFiles = hierarchy.folders[folderName];
            const folderSection = this.createFileSection(`📁 ${folderName}`, folderFiles, false, onFileSelect);
            this.pageListElement.appendChild(folderSection);
        });
        
    }

    /**
     * ファイルを階層別に整理
     * @private
     * @param {Array} files - ファイルリスト
     * @returns {object} 階層化されたファイル構造
     */
    organizeFilesHierarchy(files) {
        const hierarchy = {
            root: [],
            folders: {}
        };
        
        files.forEach(file => {
            const path = file.path || file.name || '';
            const pathParts = path.split(/[\/\\]/);
            
            if (pathParts.length === 1) {
                // ルート直下のファイル
                hierarchy.root.push(file);
            } else {
                // サブフォルダ内のファイル
                const topLevelFolder = pathParts[0];
                if (!hierarchy.folders[topLevelFolder]) {
                    hierarchy.folders[topLevelFolder] = [];
                }
                hierarchy.folders[topLevelFolder].push(file);
            }
        });
        
        return hierarchy;
    }

    /**
     * ファイルセクション作成（ルート用・フォルダ用）
     * @private
     * @param {string} title - セクションタイトル
     * @param {Array} files - ファイルリスト
     * @param {boolean} expanded - 初期展開状態
     * @param {Function} onFileSelect - ファイル選択コールバック
     * @returns {Element} セクション要素
     */
    createFileSection(title, files, expanded = false, onFileSelect) {
        const section = document.createElement('div');
        section.className = 'file-section';
        
        // セクションヘッダー
        const header = document.createElement('div');
        header.className = 'file-section-header';
        header.innerHTML = `
            <span class="section-toggle ${expanded ? 'expanded' : 'collapsed'}">${expanded ? '▼' : '▶'}</span>
            <span class="section-title">${title}</span>
            <span class="section-count">(${files.length})</span>
        `;
        
        // セクション内容
        const content = document.createElement('div');
        content.className = `file-section-content ${expanded ? 'expanded' : 'collapsed'}`;
        
        // ファイルリスト作成
        files.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.textContent = file.name || file.path.split(/[\/\\]/).pop() || `File ${index + 1}`;
            item.dataset.index = index;
            
            // クリックイベント
            item.addEventListener('click', () => {
                this.selectFileWithPreview(file, item, onFileSelect);
            });
            
            content.appendChild(item);
        });
        
        // トグル機能
        header.addEventListener('click', () => {
            const toggle = header.querySelector('.section-toggle');
            const isExpanded = content.classList.contains('expanded');
            
            if (isExpanded) {
                content.classList.remove('expanded');
                content.classList.add('collapsed');
                toggle.textContent = '▶';
                toggle.classList.remove('expanded');
                toggle.classList.add('collapsed');
            } else {
                content.classList.remove('collapsed');
                content.classList.add('expanded');
                toggle.textContent = '▼';
                toggle.classList.remove('collapsed');
                toggle.classList.add('expanded');
            }
        });
        
        section.appendChild(header);
        section.appendChild(content);
        
        return section;
    }

    /**
     * ファイル選択とプレビュー表示
     * @param {object} file - ファイルオブジェクト
     * @param {Element} element - 選択されたDOM要素
     * @param {Function} onFileSelect - ファイル選択コールバック
     */
    selectFileWithPreview(file, element, onFileSelect) {
        // アウトライナー内の全ファイルアイテムから選択状態を削除
        if (this.pageListElement) {
            this.pageListElement.querySelectorAll('.file-item').forEach(item => {
                item.classList.remove('selected');
            });
        }
        element.classList.add('selected');
        
        this.currentPage = file;
        
        // HTMLプレビュー表示
        this.loadHTMLPreview(file);
        
        // コールバック実行
        if (onFileSelect) {
            onFileSelect(file);
        }
    }

    /**
     * HTMLプレビューを読み込み
     * @param {object} file - ファイルオブジェクト
     */
    async loadHTMLPreview(file) {
        try {
            // 内蔵HTTPサーバー経由でのプレビュー（Spineアセット対応）
            const currentPort = window.location.port || '8082';
            const serverUrl = `http://localhost:${currentPort}`;
            
            // プロジェクトフォルダからの相対パスでHTTPアクセス（Windows区切り文字正規化）
            if (file.path) {
                const normalizedPath = Utils.normalizePath(file.path);
                const httpUrl = `${serverUrl}/${normalizedPath}`;
                this.previewIframe.src = httpUrl;
            } else if (file.name) {
                const httpUrl = `${serverUrl}/${file.name}`;
                this.previewIframe.src = httpUrl;
            } else {
                throw new Error('File path not available');
            }
            
            this.showPreview();
            
        } catch (error) {
            console.error('🚨 プレビュー読み込みエラー:', error);
            this.showPreviewError(file.name || file.path, error.message);
        }
    }

    /**
     * プレビュー表示を切り替え
     */
    showPreview() {
        if (this.previewPlaceholder) {
            this.previewPlaceholder.style.display = 'none';
        }
        if (this.previewIframe) {
            this.previewIframe.style.display = 'block';
        }
    }

    hidePreview() {
        if (this.previewPlaceholder) {
            this.previewPlaceholder.style.display = 'block';
        }
        if (this.previewIframe) {
            this.previewIframe.style.display = 'none';
        }
    }

    /**
     * プレビューエラー表示
     * @param {string} fileName - ファイル名
     * @param {string} errorMessage - エラーメッセージ
     */
    showPreviewError(fileName, errorMessage) {
        if (this.previewPlaceholder) {
            this.previewPlaceholder.innerHTML = `
                <div style="color: #666; text-align: center; padding: 20px;">
                    <p>HTMLプレビューの読み込みに失敗しました</p>
                    <p style="font-size: 12px; color: #999;">ファイル: ${fileName}</p>
                    <p style="font-size: 12px; color: #999;">エラー: ${errorMessage}</p>
                </div>
            `;
        }
        this.hidePreview();
    }

    /**
     * フォールバック: シンプルなファイル一覧表示
     * @param {Array} files - ファイルリスト
     * @param {Function} onFileSelect - ファイル選択コールバック
     */
    renderFileListWithPreview(files, onFileSelect) {
        if (!this.pageListElement) {
            console.error('❌ ページリスト要素が初期化されていません');
            return;
        }
        
        this.pageListElement.innerHTML = '';
        
        files.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.textContent = file.name || file.path || `File ${index + 1}`;
            item.dataset.index = index;
            
            item.addEventListener('click', () => {
                this.selectFileWithPreview(file, item, onFileSelect);
            });
            
            this.pageListElement.appendChild(item);
        });
        
        // 最初のファイルを自動選択
        if (files.length > 0) {
            const firstItem = this.pageListElement.firstChild;
            this.selectFileWithPreview(files[0], firstItem, onFileSelect);
        }
    }

    /**
     * インラインプレビュー表示（新しいウィンドウを開く代替）
     * @param {string} html - HTML内容
     */
    showInlinePreview(html) {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // プレビューエリアに表示
        if (this.previewIframe) {
            this.previewIframe.src = url;
            this.showPreview();
        }
        
        // メモリクリーンアップ
        setTimeout(() => URL.revokeObjectURL(url), 30000);
    }

    /**
     * 現在選択されているファイルを取得
     * @returns {object|null} 現在のファイル
     */
    getCurrentPage() {
        return this.currentPage;
    }

    /**
     * プレビューをクリア
     */
    clearPreview() {
        this.currentPage = null;
        if (this.previewIframe) {
            this.previewIframe.src = '';
        }
        this.hidePreview();
        
        // プレースホルダーをリセット
        if (this.previewPlaceholder) {
            this.previewPlaceholder.innerHTML = `
                HTMLファイルを選択すると<br>プレビューが表示されます<br><br>
                <small style="color: #888;">💡 左からSpineキャラクターをドラッグ&ドロップして追加できます</small>
            `;
        }
    }

    /**
     * ファイルリストをクリア
     */
    clearFileList() {
        if (this.pageListElement) {
            this.pageListElement.innerHTML = '<div class="loading">HTMLファイルがありません</div>';
        }
        this.currentPage = null;
    }

    /**
     * プレビューステータスを設定
     * @param {string} message - ステータスメッセージ
     */
    setPreviewStatus(message) {
        if (this.previewPlaceholder) {
            this.previewPlaceholder.textContent = message;
            this.hidePreview();
        }
    }

    /**
     * ドロップゾーンを設定
     * @param {Element} dropZoneElement - ドロップゾーン要素
     * @param {Function} onDrop - ドロップ時のコールバック
     */
    setupDropZone(dropZoneElement, onDrop) {
        if (!dropZoneElement) {
            console.warn('⚠️ ドロップゾーン要素が見つかりません');
            return;
        }
        
        // ドラッグオーバー（ドロップ可能領域の視覚的フィードバック）
        dropZoneElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            dropZoneElement.classList.add('drag-over');
        });
        
        // ドラッグリーブ（ドロップ可能領域を離れた時）
        dropZoneElement.addEventListener('dragleave', (e) => {
            // 子要素への移動は無視（バブリング対策）
            if (!dropZoneElement.contains(e.relatedTarget)) {
                dropZoneElement.classList.remove('drag-over');
            }
        });
        
        // ドロップ（実際にSpineキャラクターを配置）
        dropZoneElement.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZoneElement.classList.remove('drag-over');
            
            try {
                // ドラッグされたキャラクターデータを取得
                const characterDataStr = e.dataTransfer.getData('application/json');
                if (!characterDataStr) {
                    console.warn('⚠️ ドロップデータが見つかりません');
                    return;
                }
                
                const characterData = JSON.parse(characterDataStr);
                console.log('🎭 Dropped character data:', characterData);
                
                // データ整合性チェック
                if (!characterData || !characterData.character) {
                    console.error('❌ 無効なキャラクターデータ:', characterData);
                    return;
                }
                
                // ドロップ位置を計算（プレビューエリア内の相対位置）
                const rect = dropZoneElement.getBoundingClientRect();
                const dropX = e.clientX - rect.left;
                const dropY = e.clientY - rect.top;
                
                // コールバック実行
                if (onDrop) {
                    onDrop(characterData.character, dropX, dropY);
                }
                
            } catch (error) {
                console.error('❌ ドロップ処理エラー:', error);
            }
        });
        
        console.log('✅ ドロップゾーン設定完了');
    }
}