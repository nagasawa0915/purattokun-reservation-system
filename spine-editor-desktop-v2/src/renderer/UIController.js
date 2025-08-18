/**
 * UIController.js
 * UI制御・イベント管理・ユーザー操作専用モジュール
 * app.js から UI関連機能を分離
 */

export class UIController {
    constructor(appCore) {
        this.appCore = appCore;
        this.boundingBoxEditActive = false;
        
        // イベントハンドラーをバインド
        this.bindMethods();
    }

    /**
     * メソッドをバインド（thisコンテキスト保持）
     */
    bindMethods() {
        this.startBoundingBoxEdit = this.startBoundingBoxEdit.bind(this);
        this.saveBoundingBox = this.saveBoundingBox.bind(this);
        this.cancelBoundingBox = this.cancelBoundingBox.bind(this);
        this.endBoundingBoxEdit = this.endBoundingBoxEdit.bind(this);
    }

    /**
     * UIイベントハンドラーを設定
     * app.js の bindEvents() から移行
     */
    bindEvents() {
        const handlers = {
            openFolder: () => this.appCore.projectFileManager.openFolder(),
            loadSpineFolder: () => this.appCore.projectFileManager.selectSpineFolder(),
            exportPackage: () => this.appCore.exportPackage(),
            previewPackage: () => this.appCore.previewPackage(),
            addSpineCharacter: () => this.appCore.spineDisplayController.addSpineCharacter(),
            savePosition: () => this.appCore.savePosition(),
            updateSpinePosition: (position) => this.appCore.updateSpinePosition(position),
            // 🚀 Phase 2: SpineDisplayController API境界化
            addPurattokun: () => this.handleLoadCharacter('purattokun'),
            addNezumi: () => this.handleLoadCharacter('nezumi'),
            clearCharacters: () => this.appCore.spineDisplayController.clearAllCharacters(),
            // バウンディングボックス編集
            startBoundingBoxEdit: () => this.startBoundingBoxEdit(),
            saveBoundingBox: () => this.saveBoundingBox(),
            cancelBoundingBox: () => this.cancelBoundingBox(),
            endBoundingBoxEdit: () => this.endBoundingBoxEdit()
        };
        
        this.appCore.uiManager.bindEvents(handlers);
    }

    /**
     * 🚀 Phase 2: SpineDisplayController.loadCharacter APIを使用したキャラクター読み込み
     * @param {string} assetId - アセットID
     * @param {object} dropPos - ドロップ位置（オプション）
     */
    async handleLoadCharacter(assetId, dropPos = null) {
        try {
            console.log(`🎭 UIController: ${assetId}読み込み開始`);
            
            // 🚀 依存関係一方向化: UIController → SpineDisplayController
            await this.appCore.spineDisplayController.loadCharacter(assetId, dropPos);
            
            // バウンディングボックス編集ボタンを有効化
            this.enableBoundingBoxEditButton();
            
            console.log(`✅ UIController: ${assetId}読み込み完了`);
            
        } catch (error) {
            console.error(`❌ UIController: ${assetId}読み込み失敗`, error);
            this.appCore.uiManager.updateStatus('error', `${assetId}読み込み失敗: ${error.message}`);
        }
    }

    // ========== バウンディングボックス編集機能 ========== //

    /**
     * バウンディングボックス編集開始
     */
    startBoundingBoxEdit() {
        try {
            console.log('📦 バウンディングボックス編集開始 - 関数が呼ばれました');
            this.appCore.uiManager.updateStatus('loading', 'バウンディングボックス編集を開始しています...');

            console.log('🔍 window.simpleSpineManagerV3の状態:', !!window.simpleSpineManagerV3);
            
            if (window.simpleSpineManagerV3) {
                // 現在存在するキャラクターを取得
                const characters = window.simpleSpineManagerV3.getAllCharacters();
                console.log('🔍 取得したキャラクター数:', characters.length);
                console.log('🔍 キャラクター詳細:', characters);
                
                // charactersマップも確認
                console.log('🔍 characters.keys():', Array.from(window.simpleSpineManagerV3.characters.keys()));
                console.log('🔍 characters map:', window.simpleSpineManagerV3.characters);
                
                if (characters.length === 0) {
                    throw new Error('編集可能なキャラクターがありません。まずキャラクターを追加してください。');
                }

                // 最初のキャラクターに対してバウンディングボックス編集を開始
                const firstCharacter = Array.from(window.simpleSpineManagerV3.characters.keys())[0];
                console.log('🔍 選択されたキャラクター:', firstCharacter);
                
                const success = window.simpleSpineManagerV3.startBoundingBoxEdit(firstCharacter);
                console.log('🔍 startBoundingBoxEdit結果:', success);

                if (success) {
                    // UI状態更新
                    this.toggleBoundingBoxEditUI(true);
                    this.boundingBoxEditActive = true;
                    this.appCore.uiManager.updateStatus('ready', `📦 ${firstCharacter}のバウンディングボックス編集中`);
                    console.log(`✅ ${firstCharacter}のバウンディングボックス編集開始完了`);
                } else {
                    throw new Error('バウンディングボックス編集の開始に失敗しました');
                }
            } else {
                throw new Error('シンプルSpine統合システムが利用できません');
            }

        } catch (error) {
            console.error('❌ バウンディングボックス編集開始エラー:', error);
            this.appCore.uiManager.updateStatus('error', `編集開始失敗: ${error.message}`);
            alert('エラー: ' + error.message);
        }
    }

    /**
     * バウンディングボックス保存
     */
    saveBoundingBox() {
        try {
            console.log('💾 バウンディングボックス保存');
            this.appCore.uiManager.updateStatus('loading', '保存中...');

            if (window.simpleSpineManagerV3) {
                const success = window.simpleSpineManagerV3.saveBoundingBoxState();
                
                if (success) {
                    this.appCore.uiManager.updateStatus('ready', '💾 バウンディングボックスを保存しました');
                    console.log('✅ バウンディングボックス保存完了');
                } else {
                    throw new Error('保存に失敗しました');
                }
            } else {
                throw new Error('シンプルSpine統合システムが利用できません');
            }

        } catch (error) {
            console.error('❌ バウンディングボックス保存エラー:', error);
            this.appCore.uiManager.updateStatus('error', `保存失敗: ${error.message}`);
        }
    }

    /**
     * バウンディングボックス編集キャンセル
     */
    cancelBoundingBox() {
        try {
            console.log('↶ バウンディングボックス編集キャンセル');

            if (window.simpleSpineManagerV3) {
                window.simpleSpineManagerV3.cancelBoundingBoxEdit();
                // この後はページリロードが実行されるため、それ以降のコードは実行されない
            } else {
                throw new Error('シンプルSpine統合システムが利用できません');
            }

        } catch (error) {
            console.error('❌ バウンディングボックス編集キャンセルエラー:', error);
            this.appCore.uiManager.updateStatus('error', `キャンセル失敗: ${error.message}`);
        }
    }

    /**
     * バウンディングボックス編集終了
     */
    endBoundingBoxEdit() {
        try {
            console.log('✅ バウンディングボックス編集終了');
            this.appCore.uiManager.updateStatus('loading', '編集を終了しています...');

            if (window.simpleSpineManagerV3) {
                window.simpleSpineManagerV3.endBoundingBoxEdit();
                
                // UI状態更新
                this.toggleBoundingBoxEditUI(false);
                this.boundingBoxEditActive = false;
                this.appCore.uiManager.updateStatus('ready', '✅ バウンディングボックス編集を終了しました');
                console.log('✅ バウンディングボックス編集終了完了');
            } else {
                throw new Error('シンプルSpine統合システムが利用できません');
            }

        } catch (error) {
            console.error('❌ バウンディングボックス編集終了エラー:', error);
            this.appCore.uiManager.updateStatus('error', `編集終了失敗: ${error.message}`);
        }
    }

    /**
     * バウンディングボックス編集UI切り替え
     */
    toggleBoundingBoxEditUI(isEditing) {
        const startBtn = document.getElementById('btn-start-bbox-edit');
        const controls = document.getElementById('bbox-edit-controls');

        if (isEditing) {
            if (startBtn) startBtn.style.display = 'none';
            if (controls) controls.style.display = 'block';
        } else {
            if (startBtn) startBtn.style.display = 'block';
            if (controls) controls.style.display = 'none';
        }
    }

    /**
     * バウンディングボックス編集ボタン有効化（マニュアル準拠）
     */
    enableBoundingBoxEditButton() {
        console.log('🔍 enableBoundingBoxEditButton呼び出し（マニュアル準拠）');
        const startBtn = document.getElementById('btn-start-bbox-edit');
        console.log('🔍 ボタン要素:', startBtn);
        console.log('🔍 グローバル関数確認:', typeof window.startBoundingBoxEdit);
        
        if (startBtn) {
            console.log('🔍 ボタン有効化前の状態 - disabled:', startBtn.disabled);
            startBtn.disabled = false;
            console.log('🔍 ボタン有効化後の状態 - disabled:', startBtn.disabled);
            console.log('✅ バウンディングボックス編集ボタンを有効化（onclick方式）');
        } else {
            console.error('❌ btn-start-bbox-edit要素が見つかりません');
        }
    }

    /**
     * UI状態の取得
     */
    getUIState() {
        return {
            boundingBoxEditActive: this.boundingBoxEditActive,
            timestamp: Date.now()
        };
    }

    /**
     * UI状態のリセット
     */
    reset() {
        this.boundingBoxEditActive = false;
        this.toggleBoundingBoxEditUI(false);
        console.log('🔄 UIController状態リセット完了');
    }
}
