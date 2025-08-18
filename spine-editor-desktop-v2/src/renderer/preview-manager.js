/**
 * プレビュー管理モジュール
 * HTMLプレビュー表示、アウトライナー表示、ファイル選択を担当
 */

import { Utils } from './utils.js';
import { AbsoluteUrlResolver } from './utils/AssetUrlUtils.js';
import { ImageDecodeWaiter } from './utils/ImageDecodeUtils.js';
import { ContextRecoveryManager } from './utils/ContextRecoveryUtils.js';

export class PreviewManager {
    constructor() {
        this.currentPage = null;
        this.previewIframe = null;
        this.previewPlaceholder = null;
        this.pageListElement = null;
        
        // 🚀 AssetRegistry実装
        this.assetRegistry = new AssetRegistry();
        
        // グローバル参照設定（下位互換性）
        if (typeof window !== 'undefined') {
            window.assetRegistry = this.assetRegistry;
        }
    }

    /** プレビュー要素を初期化 */
    initialize(iframe, placeholder, pageList) {
        this.previewIframe = iframe;
        this.previewPlaceholder = placeholder;
        this.pageListElement = pageList;
    }

    /** アウトライナー表示 */
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

    /** ファイル階層整理 */
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

    /** ファイルセクション作成 */
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

    /** ファイル選択とプレビュー表示 */
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

    /** HTMLプレビュー読み込み */
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

    /** プレビュー表示切り替え */
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

    /** プレビューエラー表示 */
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

    /** シンプルファイル一覧表示 */
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

    /** インラインプレビュー表示 */
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

    /** 現在選択ファイル取得 */
    getCurrentPage() {
        return this.currentPage;
    }

    /** プレビュークリア */
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

    /** ファイルリストクリア */
    clearFileList() {
        if (this.pageListElement) {
            this.pageListElement.innerHTML = '<div class="loading">HTMLファイルがありません</div>';
        }
        this.currentPage = null;
    }

    /** プレビューステータス設定 */
    setPreviewStatus(message) {
        if (this.previewPlaceholder) {
            this.previewPlaceholder.textContent = message;
            this.hidePreview();
        }
    }

    /** ドロップゾーン設定 */
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
                // 軽量化ドロップデータ解析
                const assetId = e.dataTransfer.getData('application/x-spine-asset-id') || 
                               e.dataTransfer.getData('text/plain');
                const sourceUI = e.dataTransfer.getData('application/x-source-ui');
                
                if (!assetId) {
                    // レガシーフォーマットのフォールバック
                    const legacyData = e.dataTransfer.getData('application/json');
                    if (legacyData) {
                        const parsed = JSON.parse(legacyData);
                        const legacyAssetId = parsed.character?.id || parsed.id;
                        if (legacyAssetId && onDrop) {
                            console.log('📋 レガシードロップ処理 (preview-manager):', legacyAssetId);
                            const rect = dropZoneElement.getBoundingClientRect();
                            const dropX = e.clientX - rect.left;
                            const dropY = e.clientY - rect.top;
                            onDrop(parsed.character || parsed, dropX, dropY);
                            return;
                        }
                    }
                    console.warn('⚠️ 有効なドロップデータが見つかりません');
                    return;
                }
                
                console.log('💧 軽量ドロップ受信 (preview-manager):', { assetId, sourceUI });
                
                // アセットレジストリからキャラクターデータを取得
                const characterData = this.getCharacterDataByAssetId(assetId);
                if (!characterData) {
                    console.error('❌ アセットIDに対応するデータが見つかりません:', assetId);
                    return;
                }
                
                // ドロップ位置を計算（プレビューエリア内の相対位置）
                const rect = dropZoneElement.getBoundingClientRect();
                const dropX = e.clientX - rect.left;
                const dropY = e.clientY - rect.top;
                
                // コールバック実行
                if (onDrop) {
                    onDrop(characterData, dropX, dropY);
                }
                
            } catch (error) {
                console.error('❌ 軽量ドロップ処理エラー:', error);
            }
        });
        
        console.log('✅ ドロップゾーン設定完了');
    }

    /** アセットIDでキャラクターデータ取得 */
    getCharacterDataByAssetId(assetId) {
        console.log('🔍 アセットID解決要求:', assetId);
        
        // 新AssetRegistryから取得
        const assetData = this.assetRegistry.getAssetById(assetId);
        if (assetData) {
            console.log('✅ AssetRegistryから取得成功:', assetId);
            return assetData;
        }
        
        // app.jsのプロジェクトデータから検索（フォールバック）
        if (window.appInstance && window.appInstance.currentProject) {
            const characters = window.appInstance.currentProject.spineCharacters || [];
            console.log('🔍 プロジェクトデータから検索:', { assetId, availableCharacters: characters.map(c => ({ id: c.id, name: c.name })) });
            
            const found = characters.find(char => char.id === assetId || char.name === assetId);
            if (found) {
                console.log('✅ プロジェクトデータから取得成功、AssetRegistryに登録:', assetId);
                // AssetRegistryに自動登録
                this.assetRegistry.registerAsset(assetId, found);
                return found;
            }
        }
        
        console.warn('⚠️ アセットIDが見つかりません (preview-manager):', {
            assetId,
            assetRegistryConnected: !!this.assetRegistry,
            projectConnected: !!(window.appInstance && window.appInstance.currentProject),
            availableAssets: this.assetRegistry ? this.assetRegistry.getAllAssetIds() : 'none'
        });
        return null;
    }
    
    /** AssetRegistryインスタンス取得 */
    getAssetRegistry() {
        return this.assetRegistry;
    }
}

/** AssetRegistry - Spineアセット管理システム */
class AssetRegistry {
    constructor() {
        this.assets = new Map();
        this.urlResolver = new AbsoluteUrlResolver();
        this.decodeWaiter = new ImageDecodeWaiter();
        this.contextRecovery = new ContextRecoveryManager();
        
        console.log('🚀 AssetRegistry初期化完了');
    }
    
    /** アセット登録 */
    registerAsset(assetId, assetData) {
        try {
            // 絶対URL化処理
            const processedData = this.urlResolver.processAssetUrls(assetData);
            
            // decode待ち処理（画像系アセット）
            this.decodeWaiter.queueAssetDecoding(assetId, processedData);
            
            // Context復旧用データ準備
            this.contextRecovery.prepareRecoveryData(assetId, processedData);
            
            // アセット保存
            this.assets.set(assetId, processedData);
            
            console.log('✅ アセット登録完了:', assetId);
        } catch (error) {
            console.error('❌ アセット登録エラー:', assetId, error);
        }
    }
    
    /** アセットIDでデータ取得 */
    getAssetById(assetId) {
        return this.assets.get(assetId) || null;
    }
    
    /** 描画準備（spine-preview-layer連携用） */
    async prepareAssetForRender(assetId) {
        try {
            const assetData = this.assets.get(assetId);
            if (!assetData) {
                throw new Error(`Asset not found: ${assetId}`);
            }
            
            // decode待ち完了確認
            await this.decodeWaiter.waitForAssetReady(assetId);
            
            return assetData;
        } catch (error) {
            console.error('❌ 描画準備エラー:', assetId, error);
            throw error;
        }
    }
    
    /** 全アセット一覧取得 */
    getAllAssets() {
        return Array.from(this.assets.entries()).map(([id, data]) => ({ id, data }));
    }
    
    /** 全アセットID一覧取得 */
    getAllAssetIds() {
        return Array.from(this.assets.keys());
    }
    
    /** アセット存在確認 */
    has(assetId) {
        return this.assets.has(assetId);
    }
    
    /** Context復旧実行 */
    async performContextRecovery(gl) {
        return this.contextRecovery.recoverAllAssets(gl);
    }
}