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
        this.elements.btnSimpleScene = document.getElementById('btn-simple-scene');
        
        // v3統合: 組み込みキャラクターボタン
        this.elements.btnAddPurattokun = document.getElementById('btn-add-purattokun');
        this.elements.btnAddNezumi = document.getElementById('btn-add-nezumi');
        this.elements.btnClearCharacters = document.getElementById('btn-clear-characters');
        
        // 入力要素
        this.elements.spineXInput = document.getElementById('spine-x');
        this.elements.spineYInput = document.getElementById('spine-y');

        console.log('✅ UI要素初期化完了');
        return this.elements;
    }

    /**
     * Spineキャラクターリストを表示
     */
    showSpineCharacterList() {
        this.elements.spineCharacterStatus.style.display = 'none';
        this.elements.spineCharacterList.style.display = 'block';
    }

    /**
     * Spineキャラクターリストを非表示
     */
    hideSpineCharacterList() {
        this.elements.spineCharacterStatus.style.display = 'block';
        this.elements.spineCharacterList.style.display = 'none';
    }

    /**
     * Spineキャラクターステータスを設定
     */
    setSpineCharacterStatus(message) {
        this.elements.spineCharacterStatus.textContent = message;
    }

    /**
     * イベントリスナーを設定
     * @param {object} handlers - イベントハンドラーオブジェクト
     */
    bindEvents(handlers) {
        console.log('🔧 Setting up event handlers...');
        
        // ボタンイベント
        this.elements.btnOpenFolder.addEventListener('click', handlers.openFolder);
        if (this.elements.btnLoadSpineFolder && handlers.loadSpineFolder) {
            this.elements.btnLoadSpineFolder.addEventListener('click', handlers.loadSpineFolder);
        }
        this.elements.btnExportPackage.addEventListener('click', handlers.exportPackage);
        this.elements.btnPreviewPackage.addEventListener('click', handlers.previewPackage);
        if (this.elements.btnAddSpine && handlers.addSpineCharacter) {
            this.elements.btnAddSpine.addEventListener('click', handlers.addSpineCharacter);
        }
        if (this.elements.btnSavePosition && handlers.savePosition) {
            this.elements.btnSavePosition.addEventListener('click', handlers.savePosition);
        }
        
        // v3統合: 組み込みキャラクターボタンイベント
        if (this.elements.btnAddPurattokun && handlers.addPurattokun) {
            this.elements.btnAddPurattokun.addEventListener('click', handlers.addPurattokun);
        }
        if (this.elements.btnAddNezumi && handlers.addNezumi) {
            this.elements.btnAddNezumi.addEventListener('click', handlers.addNezumi);
        }
        if (this.elements.btnClearCharacters && handlers.clearCharacters) {
            this.elements.btnClearCharacters.addEventListener('click', handlers.clearCharacters);
        }
        
        // バウンディングボックス編集ボタン（マニュアル準拠: onclick属性使用）
        const btnStartBboxEdit = document.getElementById('btn-start-bbox-edit');
        
        console.log('🔍 バウンディングボックスボタン確認:');
        console.log('  btnStartBboxEdit:', !!btnStartBboxEdit);
        console.log('  グローバル関数確認:');
        console.log('    window.startBoundingBoxEdit:', typeof window.startBoundingBoxEdit);
        console.log('    window.saveBoundingBoxState:', typeof window.saveBoundingBoxState);
        console.log('    window.cancelBoundingBoxEdit:', typeof window.cancelBoundingBoxEdit);
        console.log('    window.endBoundingBoxEdit:', typeof window.endBoundingBoxEdit);
        
        // マニュアル準拠: onclick属性を使用するため、addEventListenerは削除
        // ボタンの存在確認のみ行う
        
        // シンプルシーンボタン
        if (this.elements.btnSimpleScene) {
            this.elements.btnSimpleScene.addEventListener('click', handlers.openSimpleScene || this.openSimpleScene);
        }
        
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
     * D&D軽量化: キャラクターデータからassetIdを抽出
     * @param {object} characterData - キャラクターデータ
     * @returns {string} assetId
     */
    extractAssetId(characterData) {
        if (!characterData) {
            console.warn('⚠️ 無効なキャラクターデータ');
            return null;
        }
        
        // characterData.character.id または characterData.id を取得
        const assetId = characterData.character?.id || characterData.id || null;
        
        if (!assetId) {
            console.warn('⚠️ assetIdが見つかりません:', characterData);
        }
        
        return assetId;
    }

    /**
     * D&D軽量化: ドラッグ開始時の軽量データ作成
     * @param {object} characterData - キャラクターデータ
     * @param {string} sourceUI - ソースUI識別子
     * @returns {object} 軽量ドラッグデータ
     */
    createLightweightDragData(characterData, sourceUI = 'unknown') {
        const assetId = this.extractAssetId(characterData);
        
        if (!assetId) {
            console.error('❌ assetIdの抽出に失敗しました');
            return null;
        }
        
        const lightweightData = {
            assetId: assetId,
            sourceUI: sourceUI,
            timestamp: Date.now()
        };
        
        console.log('🎯 軽量ドラッグデータ作成:', lightweightData);
        return lightweightData;
    }

    /**
     * D&D軽量化: ドラッグ開始イベントの設定（軽量版）
     * @param {HTMLElement} element - ドラッグ可能要素
     * @param {object} characterData - キャラクターデータ
     * @param {string} sourceUI - ソースUI識別子
     */
    setupLightweightDragStart(element, characterData, sourceUI = 'ui-manager') {
        if (!element || !characterData) {
            console.warn('⚠️ 無効な要素またはキャラクターデータ');
            return;
        }
        
        element.addEventListener('dragstart', (e) => {
            const lightweightData = this.createLightweightDragData(characterData, sourceUI);
            
            if (!lightweightData) {
                e.preventDefault();
                return;
            }
            
            // 軽量データのみを転送
            e.dataTransfer.setData('text/plain', lightweightData.assetId);
            e.dataTransfer.setData('application/x-spine-asset-id', lightweightData.assetId);
            e.dataTransfer.setData('application/x-source-ui', lightweightData.sourceUI);
            e.dataTransfer.effectAllowed = 'copy';
            
            console.log('🚀 軽量ドラッグ開始:', {
                assetId: lightweightData.assetId,
                sourceUI: lightweightData.sourceUI
            });
        });
    }

    /**
     * D&D軽量化: ドロップデータの軽量解析
     * @param {DataTransfer} dataTransfer - ドロップイベントのdataTransfer
     * @returns {object} 解析されたドロップデータ
     */
    parseLightweightDropData(dataTransfer) {
        try {
            // 新しい軽量形式を優先
            const assetId = dataTransfer.getData('application/x-spine-asset-id') || 
                           dataTransfer.getData('text/plain');
            const sourceUI = dataTransfer.getData('application/x-source-ui');
            
            if (assetId) {
                console.log('📋 軽量ドロップデータ受信:', { assetId, sourceUI });
                return {
                    isLightweight: true,
                    assetId: assetId,
                    sourceUI: sourceUI || 'unknown'
                };
            }
            
            // レガシー形式のフォールバック
            const legacyData = dataTransfer.getData('application/json');
            if (legacyData) {
                const parsed = JSON.parse(legacyData);
                const assetId = this.extractAssetId(parsed);
                
                if (assetId) {
                    console.log('📋 レガシードロップデータ変換:', { assetId });
                    return {
                        isLightweight: false,
                        assetId: assetId,
                        sourceUI: parsed.sourceUI || 'legacy',
                        legacyData: parsed
                    };
                }
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ ドロップデータ解析エラー:', error);
            return null;
        }
    }

    /**
     * D&D軽量化: ドロップゾーンの設定（軽量版）
     * @param {HTMLElement} dropZone - ドロップゾーン要素
     * @param {function} onDrop - ドロップ時のコールバック(assetId, dropX, dropY, sourceUI)
     */
    setupLightweightDropZone(dropZone, onDrop) {
        if (!dropZone || typeof onDrop !== 'function') {
            console.warn('⚠️ 無効なドロップゾーンまたはコールバック');
            return;
        }
        
        // ドラッグオーバー処理
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            dropZone.classList.add('drag-over');
        });
        
        // ドラッグリーブ処理
        dropZone.addEventListener('dragleave', (e) => {
            // 子要素へのドラッグリーブを無視
            if (!dropZone.contains(e.relatedTarget)) {
                dropZone.classList.remove('drag-over');
            }
        });
        
        // ドロップ処理
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const dropData = this.parseLightweightDropData(e.dataTransfer);
            
            if (!dropData) {
                console.warn('⚠️ 有効なドロップデータが見つかりません');
                return;
            }
            
            // ドロップ位置計算
            const rect = dropZone.getBoundingClientRect();
            const dropX = e.clientX - rect.left;
            const dropY = e.clientY - rect.top;
            
            console.log('💧 軽量ドロップ処理:', {
                assetId: dropData.assetId,
                sourceUI: dropData.sourceUI,
                position: { x: dropX, y: dropY },
                isLightweight: dropData.isLightweight
            });
            
            // コールバック実行
            onDrop(dropData.assetId, dropX, dropY, dropData.sourceUI);
        });
        
        console.log('✅ 軽量ドロップゾーン設定完了');
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
     * D&D軽量化: アセット管理システムとの連携
     * @param {string} assetId - アセットID
     * @returns {object|null} アセットデータ
     */
    getAssetDataById(assetId) {
        // preview-managerやapp.jsのアセットレジストリから取得
        // この実装は呼び出し側で提供されるアセット取得関数に依存
        
        console.log('🔍 アセットデータ取得要求:', assetId);
        
        // グローバルアセットレジストリが存在する場合
        if (window.assetRegistry && typeof window.assetRegistry.getAssetById === 'function') {
            const assetData = window.assetRegistry.getAssetById(assetId);
            if (assetData) return assetData;
        }
        
        // app.jsのプロジェクトデータから検索
        if (window.appInstance && window.appInstance.currentProject) {
            const characters = window.appInstance.currentProject.spineCharacters || [];
            return characters.find(char => char.id === assetId);
        }
        
        console.warn('⚠️ アセットレジストリが見つかりません');
        return null;
    }

    /**
     * D&D軽量化: レガシーシステムとの互換性確保
     * @param {string} assetId - アセットID
     * @returns {object} レガシー形式のキャラクターデータ
     */
    convertToLegacyFormat(assetId) {
        const assetData = this.getAssetDataById(assetId);
        
        if (!assetData) {
            console.error('❌ アセットデータが見つかりません:', assetId);
            return null;
        }
        
        // レガシーシステム互換形式に変換
        return {
            character: assetData,
            sourceUI: 'lightweight-converted'
        };
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
    
    /**
     * シンプルSpineシーンを新しいウィンドウで開く
     */
    openSimpleScene() {
        console.log('🎭 シンプルSpineシーン起動中...');
        
        try {
            // 新しいウィンドウでシンプルシーンを開く
            const simpleSceneWindow = window.open(
                'simple-scene.html',
                'SimpleSpineScene',
                'width=1200,height=800,resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no'
            );
            
            if (simpleSceneWindow) {
                simpleSceneWindow.focus();
                console.log('✅ シンプルSpineシーン起動成功');
            } else {
                throw new Error('ウィンドウを開くことができませんでした');
            }
            
        } catch (error) {
            console.error('❌ シンプルSpineシーン起動失敗:', error);
            
            // フォールバック: 現在のタブで開く
            try {
                window.location.href = 'simple-scene.html';
            } catch (fallbackError) {
                console.error('❌ フォールバック起動も失敗:', fallbackError);
                alert('シンプルSpineシーンを開くことができませんでした。\n\nエラー: ' + error.message);
            }
        }
    }
}