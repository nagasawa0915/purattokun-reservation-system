/**
 * UI管理モジュール
 * DOM要素の取得、イベント設定、状態管理を担当
 */

export class UIManager {
    constructor() {
        this.elements = {};
        this.statusIndicator = null;
        this.currentSpinePosition = { x: 100, y: 100 };
    }

    /**
     * UI要素を初期化
     */
    initializeElements() {
        // ステータス関連
        this.statusIndicator = document.getElementById('status-indicator');
        this.elements.projectStatus = document.getElementById('project-status');
        
        // パネル要素
        this.elements.fileList = document.getElementById('file-list');
        this.elements.pageList = document.getElementById('page-list');
        this.elements.previewPlaceholder = document.getElementById('preview-placeholder');
        this.elements.previewIframe = document.getElementById('preview-iframe');
        
        // Spine関連要素
        this.elements.spineCharacterStatus = document.getElementById('spine-character-status');
        this.elements.spineCharacterList = document.getElementById('spine-character-list');
        
        // ボタン要素
        this.elements.btnOpenFolder = document.getElementById('btn-open-folder');
        this.elements.btnLoadSpineFolder = document.getElementById('btn-load-spine-folder');
        this.elements.btnExportPackage = document.getElementById('btn-export-package');
        this.elements.btnPreviewPackage = document.getElementById('btn-preview-package');
        this.elements.btnAddSpine = document.getElementById('btn-add-spine');
        this.elements.btnSavePosition = document.getElementById('btn-save-position');
        
        // 入力要素
        this.elements.spineXInput = document.getElementById('spine-x');
        this.elements.spineYInput = document.getElementById('spine-y');

        console.log('✅ UI要素初期化完了');
        return this.elements;
    }

    /**
     * イベントリスナーを設定
     * @param {object} handlers - イベントハンドラーオブジェクト
     */
    bindEvents(handlers) {
        console.log('🔧 Setting up event handlers...');
        
        // ボタンイベント
        this.elements.btnOpenFolder.addEventListener('click', handlers.openFolder);
        this.elements.btnLoadSpineFolder.addEventListener('click', handlers.loadSpineFolder);
        this.elements.btnExportPackage.addEventListener('click', handlers.exportPackage);
        this.elements.btnPreviewPackage.addEventListener('click', handlers.previewPackage);
        this.elements.btnAddSpine.addEventListener('click', handlers.addSpineCharacter);
        this.elements.btnSavePosition.addEventListener('click', handlers.savePosition);
        
        // 位置入力イベント
        this.elements.spineXInput.addEventListener('change', (e) => {
            this.currentSpinePosition.x = parseInt(e.target.value) || 0;
            if (handlers.updateSpinePosition) {
                handlers.updateSpinePosition(this.currentSpinePosition);
            }
        });
        
        this.elements.spineYInput.addEventListener('change', (e) => {
            this.currentSpinePosition.y = parseInt(e.target.value) || 0;
            if (handlers.updateSpinePosition) {
                handlers.updateSpinePosition(this.currentSpinePosition);
            }
        });

        console.log('✅ イベントハンドラー設定完了');
    }

    /**
     * ステータス表示を更新
     * @param {string} status - ステータス（ready/loading/error）
     * @param {string} message - メッセージ
     */
    updateStatus(status, message) {
        if (this.statusIndicator) {
            this.statusIndicator.className = `status-indicator status-${status}`;
        }
        if (this.elements.projectStatus) {
            this.elements.projectStatus.textContent = message;
        }
    }

    /**
     * ボタンの有効/無効状態を管理
     */
    enableButtons() {
        this.elements.btnAddSpine.disabled = false;
        this.elements.btnExportPackage.disabled = false;
        this.elements.btnPreviewPackage.disabled = false;
    }

    disableButtons() {
        this.elements.btnAddSpine.disabled = true;
        this.elements.btnExportPackage.disabled = true;
        this.elements.btnPreviewPackage.disabled = true;
        this.elements.btnSavePosition.disabled = true;
    }

    enableSavePosition() {
        this.elements.btnSavePosition.disabled = false;
    }

    /**
     * Spine位置入力値を更新
     * @param {object} position - 位置情報 {x, y}
     */
    updateSpineInputs(position) {
        this.elements.spineXInput.value = position.x;
        this.elements.spineYInput.value = position.y;
        this.currentSpinePosition = { ...position };
    }

    /**
     * 現在のSpine位置を取得
     */
    getSpinePosition() {
        return { ...this.currentSpinePosition };
    }

    /**
     * プレビューエリアを表示/非表示
     */
    showPreview() {
        this.elements.previewPlaceholder.style.display = 'none';
        this.elements.previewIframe.style.display = 'block';
    }

    hidePreview() {
        this.elements.previewPlaceholder.style.display = 'block';
        this.elements.previewIframe.style.display = 'none';
    }

    /**
     * プレビューエラー表示
     * @param {string} fileName - ファイル名
     * @param {string} errorMessage - エラーメッセージ
     */
    showPreviewError(fileName, errorMessage) {
        this.elements.previewPlaceholder.innerHTML = `
            <div style="color: #666; text-align: center; padding: 20px;">
                <p>HTMLプレビューの読み込みに失敗しました</p>
                <p style="font-size: 12px; color: #999;">ファイル: ${fileName}</p>
                <p style="font-size: 12px; color: #999;">エラー: ${errorMessage}</p>
            </div>
        `;
        this.hidePreview();
    }

    /**
     * Spineキャラクター表示状態を管理
     */
    showSpineCharacterList() {
        this.elements.spineCharacterStatus.style.display = 'none';
        this.elements.spineCharacterList.style.display = 'block';
    }

    hideSpineCharacterList() {
        this.elements.spineCharacterStatus.style.display = 'block';
        this.elements.spineCharacterList.style.display = 'none';
    }

    /**
     * Spineキャラクターステータスメッセージを設定
     * @param {string} message - メッセージ
     */
    setSpineCharacterStatus(message) {
        this.elements.spineCharacterStatus.textContent = message;
    }

    /**
     * プロジェクトファイルリストをクリア
     */
    clearFileList() {
        this.elements.fileList.innerHTML = '';
        this.elements.pageList.innerHTML = '';
    }

    /**
     * Spineキャラクターリストをクリア
     */
    clearSpineCharacterList() {
        this.elements.spineCharacterList.innerHTML = '';
    }

    /**
     * ファイルアイテムの選択状態を管理
     * @param {Element} selectedElement - 選択された要素
     */
    selectFileItem(selectedElement) {
        // すべての選択状態をクリア
        this.elements.pageList.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // 指定要素を選択状態に
        if (selectedElement) {
            selectedElement.classList.add('selected');
        }
    }

    /**
     * ドロップゾーンの視覚的フィードバック
     */
    showDropZone() {
        const previewContent = document.getElementById('preview-content');
        if (previewContent) {
            previewContent.classList.add('drag-over');
        }
    }

    hideDropZone() {
        const previewContent = document.getElementById('preview-content');
        if (previewContent) {
            previewContent.classList.remove('drag-over');
        }
    }

    /**
     * 要素の存在チェック
     * @param {string} elementId - 要素ID
     * @returns {boolean} 要素が存在するかどうか
     */
    checkElement(elementId) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`⚠️ 要素が見つかりません: ${elementId}`);
            return false;
        }
        return true;
    }

    /**
     * 全要素の存在チェック
     * @returns {boolean} すべての要素が存在するかどうか
     */
    validateAllElements() {
        const requiredElements = [
            'status-indicator',
            'project-status', 
            'file-list',
            'page-list',
            'preview-placeholder',
            'preview-iframe',
            'spine-character-status',
            'spine-character-list',
            'btn-open-folder',
            'btn-load-spine-folder',
            'btn-export-package',
            'btn-preview-package',
            'btn-add-spine',
            'btn-save-position',
            'spine-x',
            'spine-y'
        ];

        let allValid = true;
        for (const elementId of requiredElements) {
            if (!this.checkElement(elementId)) {
                allValid = false;
            }
        }

        if (allValid) {
            console.log('✅ すべてのUI要素が正常に検出されました');
        } else {
            console.error('❌ 一部のUI要素が見つかりません');
        }

        return allValid;
    }

    /**
     * レスポンシブ対応の確認
     */
    setupResponsive() {
        // ウィンドウリサイズイベント
        window.addEventListener('resize', () => {
            // レスポンシブ調整が必要な場合のロジック
            console.log('📱 ウィンドウリサイズ検出');
        });

        // モバイル検出
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            document.body.classList.add('mobile-view');
            console.log('📱 モバイルビュー有効化');
        }
    }
}