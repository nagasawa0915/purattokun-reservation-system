/**
 * SpineDisplayController.js
 * Spine表示・プレビュー・キャラクター制御専用モジュール
 * app.js から Spine表示関連機能を分離
 */

export class SpineDisplayController {
    constructor(appCore) {
        this.appCore = appCore;
        
        // 🚀 Phase 2: API境界明確化
        this.assetManager = null; // spine-preview-assets参照
        this.renderManager = null; // spine-preview-render参照
        
        console.log('🎯 SpineDisplayController初期化完了（API境界明確化）');
    }

    /**
     * 🚀 Phase 2: 初期化システム（依存関係確立）
     */
    async init() {
        try {
            console.log('🔧 SpineDisplayController初期化開始');
            
            // spine-preview-assets参照確立
            if (this.appCore.spinePreviewLayer && this.appCore.spinePreviewLayer.assetsManager) {
                this.assetManager = this.appCore.spinePreviewLayer.assetsManager;
                console.log('✅ spine-preview-assets参照確立');
            }
            
            // spine-preview-render参照確立
            if (this.appCore.spinePreviewLayer && this.appCore.spinePreviewLayer.renderModule) {
                this.renderManager = this.appCore.spinePreviewLayer.renderModule;
                console.log('✅ spine-preview-render参照確立');
            }
            
            console.log('✅ SpineDisplayController初期化完了');
            
        } catch (error) {
            console.error('❌ SpineDisplayController初期化エラー:', error);
        }
    }

    /**
     * 🚀 Phase 2: APIの境界明確化 - loadCharacter
     * @param {string} assetId - アセットID
     * @param {object} dropPos - ドロップ位置 {x: number, y: number}
     */
    async loadCharacter(assetId, dropPos = null) {
        if (!assetId) {
            throw new Error('assetIdが必要です');
        }
        
        try {
            console.log(`🎭 loadCharacter: ${assetId}`, dropPos);
            this.appCore.uiManager.updateStatus('loading', `${assetId}を読み込み中...`);
            
            // 🚀 AssetRegistry連携: 絶対URL化済みデータ取得
            let assetData = null;
            if (this.assetManager && this.assetManager.get) {
                assetData = this.assetManager.get(assetId);
                console.log(`📦 AssetRegistry取得: ${assetId}`, assetData);
            }
            
            if (!assetData) {
                // フォールバック: 基本的なアセットデータ作成
                console.warn(`⚠️ アセット未登録、基本データで作成: ${assetId}`);
                assetData = {
                    id: assetId,
                    name: assetId,
                    atlas: `assets/spine/characters/${assetId}/${assetId}.atlas`,
                    json: `assets/spine/characters/${assetId}/${assetId}.json`,
                    pngs: [`assets/spine/characters/${assetId}/${assetId}.png`],
                    texturePath: `assets/spine/characters/${assetId}/${assetId}.png`
                };
                
                // AssetRegistryに登録（存在する場合）
                if (this.assetManager && this.assetManager._assetRegistry) {
                    this.assetManager._assetRegistry.registerAsset(assetId, assetData);
                    console.log(`📦 基本アセットデータをAssetRegistryに登録: ${assetId}`);
                }
            }
            
            // 🚀 spine-preview-render: attach処理（decode→次フレ投入内包）
            const result = await this.attachCharacterToRender(assetData, dropPos);
            
            if (result.success) {
                this.appCore.uiManager.updateStatus('ready', `✅ ${assetId}読み込み完了`);
                console.log(`✅ loadCharacter完了: ${assetId}`);
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error(`❌ loadCharacter失敗: ${assetId}`, error);
            this.appCore.uiManager.updateStatus('error', `${assetId}読み込み失敗: ${error.message}`);
            throw error;
        }
    }

    /**
     * 🚀 Phase 2: spine-preview-render連携 - attach処理
     * @param {object} assetData - アセットデータ（絶対URLのみ）
     * @param {object} options - 配置オプション
     */
    async attachCharacterToRender(assetData, options = {}) {
        if (!this.renderManager) {
            throw new Error('spine-preview-render未初期化');
        }
        
        try {
            console.log('🔧 attachCharacterToRender開始');
            
            // 🚀 画像decode→requestAnimationFrame投入をrender側に集約
            const result = await this.renderManager.attachCharacterWithDecode(assetData, options);
            
            console.log('✅ attachCharacterToRender完了');
            return result;
            
        } catch (error) {
            console.error('❌ attachCharacterToRender失敗:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * プレビューエリアにSpineキャラクターを追加（レガシー対応）
     * @param {object} characterData - キャラクターデータ
     * @param {number} x - X座標
     * @param {number} y - Y座標
     */
    async addSpineCharacterToPreview(characterData, x, y) {
        // 🚀 Phase 2: 新APIに移譲
        const assetId = characterData.name || characterData.id;
        return await this.loadCharacter(assetId, { x, y });
    }

    /**
     * Spineキャラクターを追加（従来のボタン方式）
     */
    addSpineCharacter() {
        this.appCore.uiManager.updateStatus('loading', 'Spineキャラクターを追加中...');
        
        try {
            // プレビューエリアを取得
            const previewContent = document.querySelector('.preview-content');
            if (!previewContent) {
                throw new Error('プレビューエリアが見つかりません');
            }
            
            // 既存のキャラクターがあれば削除
            if (this.appCore.spineCharacter && this.appCore.spineRenderer) {
                this.appCore.spineRenderer.removeCharacter('dummy-character');
                this.appCore.spineCharacter = null;
            }
            
            // ダミーキャラクターデータ
            const characterData = {
                name: 'Dummy Character',
                type: 'demo',
                version: 'v2.0'
            };
            
            // 現在の位置で追加
            const position = this.appCore.uiManager.getSpinePosition();
            this.addSpineCharacterToPreview(characterData, position.x, position.y);
            
            // UI更新
            this.appCore.uiManager.enableSavePosition();
            this.appCore.uiController.enableBoundingBoxEditButton();
            
            this.appCore.uiManager.updateStatus('ready', 'Spineキャラクター追加完了');
            
        } catch (error) {
            console.error('❌ Spineキャラクター追加エラー:', error);
            this.appCore.uiManager.updateStatus('error', `Spineキャラクター追加失敗: ${error.message}`);
        }
    }

    /**
     * プロジェクトキャラクター作成（v3移植）
     */
    async createSpineCharacterFromProject(characterData, x, y) {
        try {
            console.log('🎭 プロジェクトキャラクター作成:', characterData.name);
            console.log('🎭 キャラクターデータ詳細:', characterData);
            console.log('🎭 ドロップ位置:', { x, y });
            this.appCore.uiManager.updateStatus('loading', `${characterData.name}を作成中...`);
            
            // まずは組み込みキャラクターで動作確認（将来的にはファイルベース）
            if (window.simpleSpineManagerV3) {
                console.log('✅ SimpleSpineManagerV3利用可能');
                console.log('🔍 利用可能な関数:', Object.getOwnPropertyNames(window.simpleSpineManagerV3));
                
                // 現時点では組み込みキャラクターとして処理
                // TODO: 実際のSpineファイル（characterData.files）を使用する機能を実装
                let characterName = characterData.name;
                console.log(`🎭 処理対象キャラクター: ${characterName}`);
                
                // 既知のキャラクター名の場合は組み込みキャラクターとして作成
                if (characterName === 'purattokun' || characterName === 'nezumi') {
                    const result = await window.simpleSpineManagerV3.createBuiltInCharacter(characterName);
                    
                    if (result) {
                        // 🎯 重要: ドロップ位置にキャラクターを配置
                        await this.positionCharacterAtDropLocation(characterName, x, y);
                        
                        // バウンディングボックス編集ボタンを有効化
                        this.appCore.uiController.enableBoundingBoxEditButton();
                        
                        this.appCore.uiManager.updateStatus('ready', `🎭 ${characterData.name}を位置 (${x.toFixed(1)}%, ${y.toFixed(1)}%) に作成しました`);
                        console.log(`✅ プロジェクトキャラクター作成完了: ${characterData.name} at (${x}, ${y})`);
                    } else {
                        throw new Error('キャラクター作成に失敗しました');
                    }
                } else {
                    // 未知のキャラクターの場合はダミー表示
                    console.warn(`⚠️ 未知のキャラクター: ${characterName} - ダミー表示`);
                    this.appCore.uiManager.updateStatus('ready', `📦 ${characterData.name}をダミー表示しました`);
                    
                    // TODO: 実際のSpineファイルロード機能を実装
                    // const result = await this.loadCustomSpineCharacter(characterData, x, y);
                }
            } else {
                throw new Error('シンプルSpine統合システムが利用できません');
            }
            
        } catch (error) {
            console.error(`❌ プロジェクトキャラクター作成エラー: ${characterData.name}`, error);
            this.appCore.uiManager.updateStatus('error', `${characterData.name}作成失敗: ${error.message}`);
        }
    }

    /**
     * ドロップ位置にキャラクターを配置
     */
    async positionCharacterAtDropLocation(characterName, x, y) {
        try {
            console.log(`🎯 ${characterName}を位置 (${x}%, ${y}%) に配置中...`);
            
            // spinePreviewLayerが利用可能かチェック
            if (window.spinePreviewLayer && window.spinePreviewLayer.setCharacterPosition) {
                // 座標系変換: パーセンテージ -> ピクセル座標 -> Spine座標
                const canvas = window.spinePreviewLayer.canvas;
                if (canvas) {
                    const pixelX = (x / 100) * canvas.width;
                    const pixelY = (y / 100) * canvas.height;
                    
                    // Spine座標系への変換（中央原点、Y軸反転）
                    const spineX = pixelX - (canvas.width / 2);
                    const spineY = (canvas.height / 2) - pixelY;
                    
                    console.log(`📐 座標変換: (${x}%, ${y}%) -> pixel(${pixelX}, ${pixelY}) -> spine(${spineX}, ${spineY})`);
                    
                    // キャラクター位置設定
                    await window.spinePreviewLayer.setCharacterPosition(characterName, spineX, spineY);
                    console.log(`✅ ${characterName}の位置設定完了`);
                } else {
                    console.warn('⚠️ Canvas要素が見つかりません');
                }
            } else if (window.simpleSpineManagerV3 && window.simpleSpineManagerV3.setCharacterPosition) {
                // SimpleSpineManagerV3経由で位置設定
                await window.simpleSpineManagerV3.setCharacterPosition(characterName, x, y);
                console.log(`✅ SimpleSpineManagerV3で${characterName}の位置設定完了`);
            } else {
                console.warn('⚠️ 位置設定機能が利用できません - 位置設定をスキップ');
            }
            
        } catch (error) {
            console.error(`❌ ${characterName}の位置設定エラー:`, error);
            // 位置設定エラーでもキャラクター作成は継続
        }
    }

    /**
     * 組み込みキャラクター追加
     */
    async addBuiltInCharacter(characterName) {
        try {
            console.log(`🎭 組み込みキャラクター追加: ${characterName}`);
            this.appCore.uiManager.updateStatus('loading', `${characterName}を追加中...`);
            
            // シンプルSpineマネージャーV3を使用
            if (window.simpleSpineManagerV3) {
                const result = await window.simpleSpineManagerV3.createBuiltInCharacter(characterName);
                
                if (result) {
                    // バウンディングボックス編集ボタンを有効化
                    this.appCore.uiController.enableBoundingBoxEditButton();
                    
                    this.appCore.uiManager.updateStatus('ready', `🎭 ${characterName}を追加しました`);
                    console.log(`✅ 組み込みキャラクター追加完了: ${characterName}`);
                } else {
                    throw new Error('キャラクター作成に失敗しました');
                }
            } else {
                throw new Error('シンプルSpine統合システムが利用できません');
            }
            
        } catch (error) {
            console.error(`❌ 組み込みキャラクター追加エラー: ${characterName}`, error);
            this.appCore.uiManager.updateStatus('error', `${characterName}追加失敗: ${error.message}`);
        }
    }

    /**
     * 全キャラクター削除
     */
    clearAllCharacters() {
        try {
            console.log('🗑️ 全キャラクター削除開始');
            
            // シンプルSpineマネージャーV3を使用
            if (window.simpleSpineManagerV3 && window.simpleSpineManagerV3.clearAllCharacters) {
                window.simpleSpineManagerV3.clearAllCharacters();
                this.appCore.uiManager.updateStatus('ready', '🗑️ 全キャラクターを削除しました');
                console.log('✅ 全キャラクター削除完了');
            } else {
                throw new Error('シンプルSpine統合システムが利用できません');
            }
            
        } catch (error) {
            console.error('❌ 全キャラクター削除エラー:', error);
            this.appCore.uiManager.updateStatus('error', `削除失敗: ${error.message}`);
        }
    }

    /**
     * Spine位置更新（数値入力から）
     * @param {object} position - 位置情報 {x, y}
     */
    updateSpinePosition(position) {
        this.appCore.spinePosition = { ...position };
        
        // パッケージエクスポーターに位置を設定
        this.appCore.packageExporter.setSpinePosition(this.appCore.spinePosition);
        
        // 実際のSpineキャラクターの位置も更新（実装されている場合）
        if (this.appCore.spineCharacter && this.appCore.spineCore) {
            const canvasElement = this.appCore.spineCore.canvasElements?.get('spine-dummy-character');
            if (canvasElement) {
                canvasElement.style.left = this.appCore.spinePosition.x + 'px';
                canvasElement.style.top = this.appCore.spinePosition.y + 'px';
            }
        }
        
        this.appCore.uiManager.updateStatus('ready', `位置更新: (${this.appCore.spinePosition.x}, ${this.appCore.spinePosition.y})`);
    }

    /**
     * ドロップゾーン設定
     */
    setupDropZone() {
        const previewContent = document.getElementById('preview-content');
        const spineContainer = document.getElementById('spine-character-container');
        
        if (!previewContent || !spineContainer) {
            console.warn('⚠️ ドロップゾーン要素が見つかりません');
            return;
        }
        
        this.appCore.previewManager.setupDropZone(previewContent, (characterData, x, y) => {
            this.addSpineCharacterToPreview(characterData, x, y);
        });
    }

    /**
     * 表示コントローラーの状態取得
     */
    getDisplayState() {
        return {
            currentCharacters: window.simpleSpineManagerV3 ? 
                Array.from(window.simpleSpineManagerV3.characters.keys()) : [],
            timestamp: Date.now()
        };
    }

    /**
     * 表示コントローラーのリセット
     */
    reset() {
        // 全キャラクター削除
        this.clearAllCharacters();
        console.log('🔄 SpineDisplayController状態リセット完了');
    }
}
