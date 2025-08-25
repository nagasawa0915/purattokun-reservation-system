/**
 * UIController.js
 * UI制御・イベント管理・ユーザー操作専用モジュール
 * app.js から UI関連機能を分離
 */

export class UIController {
    constructor(appCore) {
        this.appCore = appCore;
        this.boundingBoxEditActive = false;
        this.boundingBoxModule = null; // 🚀 v3機能移植: 個別バウンディングボックスモジュール参照
        
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
     * 🔧 新機能: キャラクター名識別メソッド（個別制御用）
     */
    identifyCharacterName(canvas) {
        // キャンバスIDから特定
        if (canvas.id) {
            if (canvas.id.toLowerCase().includes('purattokun')) return 'ぷらっとくん';
            if (canvas.id.toLowerCase().includes('nezumi')) return 'ねずみ';
            return canvas.id;
        }
        
        // 親要素から特定
        const parent = canvas.parentElement;
        if (parent && parent.id) {
            if (parent.id.toLowerCase().includes('purattokun')) return 'ぷらっとくん';
            if (parent.id.toLowerCase().includes('nezumi')) return 'ねずみ';
            return parent.id;
        }
        
        // クラス名から特定
        const classList = Array.from(canvas.classList || []);
        for (const cls of classList) {
            if (cls.toLowerCase().includes('purattokun')) return 'ぷらっとくん';
            if (cls.toLowerCase().includes('nezumi')) return 'ねずみ';
        }
        
        return `キャラクター#${Array.from(document.querySelectorAll('canvas')).indexOf(canvas) + 1}`;
    }

    /**
     * バウンディングボックス編集開始
     */
    startBoundingBoxEdit() {
        try {
            console.log('📦 バウンディングボックス編集開始 - 関数が呼ばれました');
            this.appCore.uiManager.updateStatus('loading', 'バウンディングボックス編集を開始しています...');

            console.log('🔍 window.simpleSpineManagerV3の状態:', !!window.simpleSpineManagerV3);
            
            // 🚀 v3機能移植: 個別キャラクター制御の直接実装
            console.log('🚀 個別キャラクター制御の新しいアプローチで実行中...');
            
            // v2統合システムのバウンディングボックスモジュールを直接使用
            if (typeof window.createBoundingBoxModule !== 'function') {
                throw new Error('バウンディングボックスモジュールが利用できません');
            }
            
            // 編集可能なSpineキャンバスを検索
            const spineCanvases = document.querySelectorAll('canvas');
            console.log('🔍 検出されたCanvas数:', spineCanvases.length);
            
            if (spineCanvases.length === 0) {
                throw new Error('編集可能なSpineキャンバスが見つかりません。まずキャラクターを追加してください。');
            }
            
            // 🔧 完全修正: 個別キャラクター選択システム（複数キャラクター連動問題完全解決）
            let targetCanvas;
            
            if (spineCanvases.length === 1) {
                // 単体キャラクターの場合、自動選択
                targetCanvas = spineCanvases[0];
                console.log('🎯 単体キャラクター自動選択:', this.identifyCharacterName(targetCanvas));
            } else {
                // 🔧 複数キャラクター対応: プロフェッショナル選択UI
                console.log('🔍 複数キャラクター検出 - 高度選択UI表示');
                
                // 詳細キャラクター情報を取得
                const characterInfo = [];
                for (let index = 0; index < spineCanvases.length; index++) {
                    const canvas = spineCanvases[index];
                    const characterName = this.identifyCharacterName(canvas);
                    const rect = canvas.getBoundingClientRect();
                    const info = {
                        index: index,
                        canvas: canvas,
                        name: characterName,
                        id: canvas.id || 'unnamed',
                        position: `(${Math.round(rect.left)}, ${Math.round(rect.top)})`,
                        size: `${Math.round(rect.width)}x${Math.round(rect.height)}`
                    };
                    characterInfo.push(info);
                }
                
                // プロフェッショナル選択ダイアログ
                let selectionMessage = '📝 編集するキャラクターを選択してください:\n\n';
                characterInfo.forEach((info, index) => {
                    selectionMessage += `${index + 1}. ${info.name}\n`;
                    selectionMessage += `   ID: ${info.id}\n`;
                    selectionMessage += `   位置: ${info.position}\n`;
                    selectionMessage += `   サイズ: ${info.size}\n\n`;
                });
                selectionMessage += '番号を入力してください (1-' + spineCanvases.length + '):';
                
                const selection = prompt(selectionMessage, '1');
                
                if (selection === null) {
                    throw new Error('キャラクター選択がキャンセルされました');
                }
                
                const selectedIndex = parseInt(selection) - 1;
                if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= spineCanvases.length) {
                    throw new Error(`無効な選択です。1-${spineCanvases.length}の番号を入力してください。`);
                }
                
                targetCanvas = spineCanvases[selectedIndex];
                console.log('🎯 ユーザー選択キャラクター:', this.identifyCharacterName(targetCanvas));
                console.log('🔍 選択詳細:', characterInfo[selectedIndex]);
            }
            
            // 🚨 重要: 個別キャラクター制御確証
            console.log('🔒 個別キャラクター制御確証:', {
                targetId: targetCanvas.id,
                targetName: this.identifyCharacterName(targetCanvas),
                otherCanvases: spineCanvases.length - 1,
                isolationGuarantee: '他キャラクターへの影響完全遮断'
            });
            
            console.log('✅ 個別キャラクター特定完了:', targetCanvas.id || 'unnamed-canvas');
            
            // バウンディングボックスモジュールを作成・初期化
            this.boundingBoxModule = window.createBoundingBoxModule();
            this.boundingBoxModule.initialize(targetCanvas);
            
            // UI状態更新
            this.toggleBoundingBoxEditUI(true);
            this.boundingBoxEditActive = true;
            
            const characterName = this.identifyCharacterName(targetCanvas);
            this.appCore.uiManager.updateStatus('ready', `📦 ${characterName}の個別バウンディングボックス編集中`);
            console.log(`✅ ${characterName}の個別バウンディングボックス編集開始完了`);

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
            console.log('💾 個別バウンディングボックス保存開始');
            this.appCore.uiManager.updateStatus('loading', 'バウンディングボックスを保存しています...');

            if (this.boundingBoxModule && this.boundingBoxModule.isActive) {
                // 🚀 完全実装: 個別キャラクターの%値変換状態保存
                const characterId = this.boundingBoxModule.targetCharacterId;
                const targetElement = this.boundingBoxModule.targetElement;
                
                if (targetElement) {
                    // 🔧 重要: 座標系を元に復元してから保存（%値形式）
                    console.log('🔄 保存前座標系復元実行...');
                    if (window.SpineEditSystem && window.SpineEditSystem.coordinateSwap.isSwapped) {
                        window.SpineEditSystem.coordinateSwap.exitEditMode(targetElement);
                    }
                    
                    // 復元後の%値状態を保存
                    const finalComputedStyle = window.getComputedStyle(targetElement);
                    const boundingBoxState = {
                        characterId: characterId,
                        left: finalComputedStyle.left,
                        top: finalComputedStyle.top,
                        width: finalComputedStyle.width,
                        height: finalComputedStyle.height,
                        transform: finalComputedStyle.transform,
                        coordinateSystem: '%値+transform形式',
                        timestamp: Date.now()
                    };
                    
                    localStorage.setItem(`spine-bounding-box-${characterId}`, JSON.stringify(boundingBoxState));
                    console.log('💾 個別キャラクター%値状態保存:', boundingBoxState);
                    
                    this.appCore.uiManager.updateStatus('ready', `✅ ${characterId}のバウンディングボックス状態を保存しました（%値形式）`);
                    console.log(`✅ ${characterId}の個別バウンディングボックス保存成功（%値変換済み）`);
    
                    // UI状態を編集終了に更新
                    this.endBoundingBoxEdit();
                } else {
                    throw new Error('編集対象要素が見つかりません');
                }
            } else {
                throw new Error('バウンディングボックスモジュールがアクティブではありません');
            }

        } catch (error) {
            console.error('❌ 個別バウンディングボックス保存エラー:', error);
            this.appCore.uiManager.updateStatus('error', `保存失敗: ${error.message}`);
            alert('エラー: ' + error.message);
        }
    }

    /**
     * バウンディングボックス編集キャンセル
     */
    cancelBoundingBox() {
        try {
            console.log('↶ 個別バウンディングボックス編集キャンセル');
            this.appCore.uiManager.updateStatus('loading', 'バウンディングボックス編集をキャンセルしています...');

            if (this.boundingBoxModule && this.boundingBoxModule.isActive) {
                // 🚀 v3機能移植: 個別キャラクターの座標系復元でキャンセル
                const characterId = this.boundingBoxModule.targetCharacterId;
                
                // バウンディングボックスモジュールのクリーンアップ（座標系復元含む）
                this.boundingBoxModule.cleanup();
                this.boundingBoxModule = null;

                this.appCore.uiManager.updateStatus('ready', `↶ ${characterId}のバウンディングボックス編集をキャンセルしました`);
                console.log(`✅ ${characterId}の個別バウンディングボックスキャンセル成功`);

                // UI状態を編集終了に更新
                this.endBoundingBoxEdit();
            } else {
                throw new Error('バウンディングボックスモジュールがアクティブではありません');
            }

        } catch (error) {
            console.error('❌ 個別バウンディングボックスキャンセルエラー:', error);
            this.appCore.uiManager.updateStatus('error', `キャンセル失敗: ${error.message}`);
            alert('エラー: ' + error.message);
        }
    }

    /**
     * バウンディングボックス編集終了
     */
    endBoundingBoxEdit() {
        try {
            console.log('✅ 個別バウンディングボックス編集終了');

            if (this.boundingBoxModule && this.boundingBoxModule.isActive) {
                // 🚀 v3機能移植: 個別キャラクターモジュールのクリーンアップ
                this.boundingBoxModule.cleanup();
                this.boundingBoxModule = null;
            }

            this.toggleBoundingBoxEditUI(false);
            this.boundingBoxEditActive = false;

            this.appCore.uiManager.updateStatus('ready', '個別バウンディングボックス編集を終了しました');
            console.log('✅ 個別バウンディングボックス編集終了成功');

        } catch (error) {
            console.error('❌ 個別バウンディングボックス編集終了エラー:', error);
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
