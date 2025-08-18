/**
 * ApplicationCore.js
 * アプリケーション統合制御・初期化管理モジュール
 * 
 * Phase 2準拠設計:
 * - SpinePreviewLayer最優先初期化（フリッカ対策・点滅解決機構保持）
 * - モジュール間依存関係管理
 * - グローバル状態管理・ライフサイクル制御
 * - 初期化順序の厳格保持（47-59行パターン再現）
 */

import { UIManager } from './ui-manager.js';
import { ProjectLoader } from './project-loader.js';
import { SpineCharacterManager } from './spine-character-manager.js';
import { PreviewManager } from './preview-manager.js';
import { PackageExporter } from './package-exporter.js';
import { SpinePreviewLayer } from './spine-preview-layer.js';
import { Utils } from './utils.js';

export class ApplicationCore {
    constructor() {
        console.log('🚀 ApplicationCore初期化開始');
        
        // アプリケーション状態管理
        this.currentProject = null;
        this.currentPage = null;
        this.spinePosition = { x: 100, y: 100 };
        this.spineCharacter = null;
        
        // グローバルアクセス用に登録
        window.appInstance = this;
        
        // Phase 2成果保持: モジュール初期化順序
        this.uiManager = new UIManager();
        this.projectLoader = new ProjectLoader();
        this.spineCharacterManager = new SpineCharacterManager();
        this.previewManager = new PreviewManager();
        this.packageExporter = new PackageExporter();
        this.spinePreviewLayer = null; // 🚨 Phase 2準拠: 後で最優先初期化
        
        // v3 Spine統合システム
        this.spineCharacterManagerV3 = null; // 動的読み込み後に設定
        this.currentSpineProject = null;
        
        // Spine System状態管理
        this.spineCore = null;
        this.spineRenderer = null;
        this.v3InitRetryCount = 0;
        
        console.log('✅ ApplicationCore構築完了');
    }

    /**
     * 初期化メソッド（app.js互換性用）
     * this.applicationCore.init()から呼び出される
     */
    async init() {
        return await this.initialize();
    }

    /**
     * アプリケーション初期化
     * 🚨 Phase 2成果厳格保持:
     * - SpinePreviewLayer最優先初期化（47-59行パターン完全再現）
     * - 常時rAFレンダーループ早期開始（フリッカ対策）
     * - 初期化順序変更絶対禁止
     */
    async initialize() {
        try {
            console.log('🚀 ApplicationCore統合初期化開始...');
            
            // 🚨 Phase 2最優先保持: SpinePreviewLayer初期化（フリッカ対策）
            // UI要素確認前にpreview-contentだけ先行チェック
            const previewContent = document.getElementById('preview-content');
            if (previewContent) {
                await this.initializeSpinePreviewLayer();
                console.log('⚡ ApplicationCore: SpinePreviewLayer最優先初期化完了');
            } else {
                console.warn('⚠️ preview-content要素が見つかりません - SpinePreviewLayer初期化をスキップ');
            }
            
            // Phase 2準拠: UI要素初期化（DOM要素が必要なため次に実行）
            const elements = this.uiManager.initializeElements();
            
            // UI要素の存在確認
            if (!this.uiManager.validateAllElements()) {
                throw new Error('必要なUI要素が見つかりません');
            }
            
            // プレビュー管理初期化
            this.previewManager.initialize(
                elements.previewIframe,
                elements.previewPlaceholder,
                elements.pageList
            );
            
            // SpineCharacterManagerにプレビューiframeを設定
            this.spineCharacterManager.setPreviewIframe(elements.previewIframe);
            
            // イベントハンドラー設定
            this.bindEvents();
            
            // 保存されたパスを読み込み
            await this.projectLoader.loadSavedPaths();
            
            // Spineシステム初期化
            this.initializeSpineSystem();
            
            // ドロップゾーン設定
            this.setupDropZone();
            
            // レスポンシブ対応
            this.uiManager.setupResponsive();
            
            console.log('✅ ApplicationCore統合初期化完了');
            
        } catch (error) {
            console.error('❌ ApplicationCore初期化エラー:', error);
            this.uiManager.updateStatus('error', `初期化エラー: ${error.message}`);
            throw error;
        }
    }

    /**
     * SpinePreviewLayer初期化
     * 🚨 Phase 2成果厳格保持: 163-185行パターン完全再現
     */
    async initializeSpinePreviewLayer() {
        try {
            const previewContent = document.getElementById('preview-content');
            if (!previewContent) {
                console.warn('⚠️ プレビューコンテンツが見つかりません');
                return;
            }

            // SpinePreviewLayer インスタンス作成（containerを渡す）
            this.spinePreviewLayer = new SpinePreviewLayer(previewContent);

            // SpinePreviewLayer初期化（新しい実装に対応）
            const success = await this.spinePreviewLayer.initialize();
            if (success) {
                console.log('✅ ApplicationCore: SpinePreviewLayer初期化完了');
            } else {
                console.warn('⚠️ ApplicationCore: SpinePreviewLayer初期化失敗 - ダミー表示で継続');
            }

        } catch (error) {
            console.error('❌ ApplicationCore: SpinePreviewLayer初期化エラー:', error);
        }
    }

    /**
     * イベントハンドラー設定
     * Phase 2準拠: 108-128行パターン保持
     */
    bindEvents() {
        const handlers = {
            openFolder: () => this.openFolder(),
            loadSpineFolder: () => this.selectSpineFolder(),
            exportPackage: () => this.exportPackage(),
            previewPackage: () => this.previewPackage(),
            addSpineCharacter: () => this.addSpineCharacter(),
            savePosition: () => this.savePosition(),
            updateSpinePosition: (position) => this.updateSpinePosition(position),
            addPurattokun: () => this.addBuiltInCharacter('purattokun'),
            addNezumi: () => this.addBuiltInCharacter('nezumi'),
            clearCharacters: () => this.clearAllCharacters(),
            // バウンディングボックス編集
            startBoundingBoxEdit: () => this.startBoundingBoxEdit(),
            saveBoundingBox: () => this.saveBoundingBox(),
            cancelBoundingBox: () => this.cancelBoundingBox(),
            endBoundingBoxEdit: () => this.endBoundingBoxEdit()
        };
        
        this.uiManager.bindEvents(handlers);
    }

    /**
     * Spineシステム初期化
     * Phase 2準拠: 133-158行パターン保持
     */
    initializeSpineSystem() {
        try {
            // SpineCore初期化（外部モジュールから）
            if (window.SpineCore) {
                this.spineCore = new SpineCore();
                const success = this.spineCore.initialize();
                if (!success) {
                    console.error('❌ SpineCore初期化失敗');
                    return;
                }
            }
            
            // SpineRenderer初期化（外部モジュールから）
            if (window.SpineRenderer && this.spineCore) {
                this.spineRenderer = new SpineRenderer(this.spineCore);
            }
            
            // 保存された位置を復元
            this.restorePosition();
            
        } catch (error) {
            console.error('❌ Spineシステム初期化エラー:', error);
        }
    }

    /**
     * ドロップゾーン設定
     * Phase 2準拠: 189-202行パターン保持
     */
    setupDropZone() {
        const previewContent = document.getElementById('preview-content');
        const spineContainer = document.getElementById('spine-character-container');
        
        if (!previewContent || !spineContainer) {
            console.warn('⚠️ ドロップゾーン要素が見つかりません');
            return;
        }
        
        this.previewManager.setupDropZone(previewContent, (characterData, x, y) => {
            this.addSpineCharacterToPreview(characterData, x, y);
        });
    }

    /**
     * アプリケーション状態エクスポート
     * Phase 2準拠: 1059-1068行パターン保持
     */
    exportAppState() {
        return {
            currentProject: this.currentProject,
            currentPage: this.currentPage,
            spinePosition: { ...this.spinePosition },
            projectSettings: this.projectLoader.exportSettings(),
            packageSettings: this.packageExporter.exportSettings(),
            timestamp: Date.now()
        };
    }

    /**
     * アプリケーション状態インポート
     * Phase 2準拠: 1075-1101行パターン保持
     */
    importAppState(state) {
        try {
            if (state.currentProject) {
                this.currentProject = state.currentProject;
            }
            if (state.currentPage) {
                this.currentPage = state.currentPage;
            }
            if (state.spinePosition) {
                this.spinePosition = { ...state.spinePosition };
                this.uiManager.updateSpineInputs(this.spinePosition);
                this.packageExporter.setSpinePosition(this.spinePosition);
            }
            if (state.projectSettings) {
                this.projectLoader.importSettings(state.projectSettings);
            }
            if (state.packageSettings) {
                this.packageExporter.importSettings(state.packageSettings);
            }
            
            return true;
        } catch (error) {
            console.error('❌ ApplicationCore: アプリケーション状態インポートエラー:', error);
            return false;
        }
    }

    /**
     * アプリケーションリセット
     * Phase 2準拠: 1106-1129行パターン保持
     */
    reset() {
        // UI状態リセット
        this.uiManager.clearFileList();
        this.uiManager.clearSpineCharacterList();
        this.uiManager.disableButtons();
        
        // プレビューリセット
        this.previewManager.clearPreview();
        
        // Spineキャラクターリセット
        this.spineCharacterManager.clearAllCharacters();
        
        // 状態リセット
        this.currentProject = null;
        this.currentPage = null;
        this.spineCharacter = null;
        this.spinePosition = { x: 100, y: 100 };
        
        // UI更新
        this.uiManager.updateSpineInputs(this.spinePosition);
        this.uiManager.updateStatus('ready', 'アプリケーションがリセットされました');
    }

    /**
     * デバッグ情報取得
     * Phase 2準拠: 1135-1151行パターン保持
     */
    getDebugInfo() {
        return {
            currentProject: this.currentProject,
            currentPage: this.currentPage?.name || null,
            spinePosition: { ...this.spinePosition },
            placedCharacters: this.spineCharacterManager.getPlacedCharacters().length,
            moduleStatus: {
                uiManager: !!this.uiManager,
                projectLoader: !!this.projectLoader,
                spineCharacterManager: !!this.spineCharacterManager,
                previewManager: !!this.previewManager,
                packageExporter: !!this.packageExporter,
                spineCore: !!this.spineCore,
                spineRenderer: !!this.spineRenderer,
                spinePreviewLayer: !!this.spinePreviewLayer
            },
            spinePreviewLayerReady: this.spinePreviewLayer?.isReadyForCharacters() || false
        };
    }

    // ========== 委譲メソッド群 ========== //
    // Phase 2成果保持: DemoAppからの主要機能を委譲形式で継続提供

    async openFolder() {
        // ProjectLoader委譲 - 詳細実装は元のapp.jsから継承
        this.uiManager.updateStatus('loading', 'フォルダを選択中...');
        
        try {
            const result = await this.projectLoader.openFolder();
            
            if (result.success) {
                this.currentProject = result.path;
                
                const processedFiles = this.projectLoader.processProjectFiles(result.files);
                
                if (processedFiles.length === 0) {
                    this.previewManager.clearFileList();
                    this.uiManager.updateStatus('ready', 'HTMLファイルが見つかりませんでした');
                    return;
                }
                
                this.previewManager.renderOutlinerView(processedFiles, (file) => {
                    this.currentPage = file;
                });
                
                this.uiManager.enableButtons();
                this.uiManager.updateStatus('ready', `プロジェクト読み込み完了: ${processedFiles.length} ファイル`);
                
            } else if (result.canceled) {
                this.uiManager.updateStatus('ready', result.message);
            } else {
                this.uiManager.updateStatus('error', result.error || result.message);
            }
        } catch (error) {
            console.error('❌ フォルダ選択エラー:', error);
            this.uiManager.updateStatus('error', 'フォルダ選択に失敗しました');
        }
    }

    async addSpineCharacterToPreview(characterData, x, y) {
        // SpinePreviewLayer委譲 - Phase 2安定化修正保持
        try {
            console.log('🎭 ApplicationCore: addSpineCharacterToPreview呼び出し:', { characterData, x, y });
            this.uiManager.updateStatus('loading', 'Spineキャラクターを読み込み中...');
            
            if (!characterData) {
                throw new Error('キャラクターデータが空です');
            }
            
            // 🔧 Phase 2安定化修正: SpinePreviewLayer初期化完了を確認・待機
            if (this.spinePreviewLayer) {
                if (!this.spinePreviewLayer.isReadyForCharacters()) {
                    console.log('⏳ SpinePreviewLayer初期化完了を待機中...');
                    
                    let waitCount = 0;
                    while (!this.spinePreviewLayer.isReadyForCharacters() && waitCount < 30) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        waitCount++;
                    }
                    
                    if (!this.spinePreviewLayer.isReadyForCharacters()) {
                        console.warn('⚠️ SpinePreviewLayer初期化待機タイムアウト');
                    }
                }
                
                const spineResult = await this.spinePreviewLayer.addCharacter(
                    characterData, 
                    x, 
                    y
                );
                
                if (spineResult && spineResult.success) {
                    this.uiManager.updateStatus('ready', `🎭 Spineキャラクター「${characterData.name}」を表示しました (v3パターン)`);
                    console.log(`✅ v3パターンでSpineキャラクター「${characterData.name}」をプレビューに追加完了`);
                    return;
                } else {
                    console.warn('⚠️ v3パターンSpine表示失敗、ダミー表示にフォールバック:', spineResult?.error);
                }
            }
            
            // フォールバック: ダミー表示
            const spineContainer = document.getElementById('spine-character-container');
            if (!spineContainer) {
                throw new Error('Spineコンテナが見つかりません');
            }
            
            const result = this.spineCharacterManager.addSpineCharacterToPreview(
                characterData, x, y, spineContainer
            );
            
            if (result.success) {
                this.uiManager.updateStatus('ready', `📦 キャラクター「${characterData.name}」を追加しました (ダミー)`);
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('❌ ApplicationCore: Spineキャラクター追加エラー:', error);
            this.uiManager.updateStatus('error', `キャラクター追加失敗: ${error.message}`);
        }
    }

    // その他の委譲メソッドは必要に応じて実装
    // （Phase 2成果を損なわない形で段階的に移行）
    
    addSpineCharacter() {
        // 詳細実装は元app.jsから継承予定
        console.log('🎭 ApplicationCore: addSpineCharacter委譲 - 実装予定');
    }
    
    updateSpinePosition(position) {
        // 詳細実装は元app.jsから継承予定
        console.log('📍 ApplicationCore: updateSpinePosition委譲 - 実装予定');
    }
    
    savePosition() {
        // 詳細実装は元app.jsから継承予定
        console.log('💾 ApplicationCore: savePosition委譲 - 実装予定');
    }
    
    restorePosition() {
        // 詳細実装は元app.jsから継承予定
        console.log('📍 ApplicationCore: restorePosition委譲 - 実装予定');
    }
    
    async exportPackage() {
        // 詳細実装は元app.jsから継承予定
        console.log('📦 ApplicationCore: exportPackage委譲 - 実装予定');
    }
    
    async previewPackage() {
        // 詳細実装は元app.jsから継承予定
        console.log('👁️ ApplicationCore: previewPackage委譲 - 実装予定');
    }
    
    async selectSpineFolder() {
        // 詳細実装は元app.jsから継承予定
        console.log('📁 ApplicationCore: selectSpineFolder委譲 - 実装予定');
    }
    
    async addBuiltInCharacter(characterName) {
        // 詳細実装は元app.jsから継承予定
        console.log(`🎭 ApplicationCore: addBuiltInCharacter(${characterName})委譲 - 実装予定`);
    }
    
    clearAllCharacters() {
        // 詳細実装は元app.jsから継承予定
        console.log('🗑️ ApplicationCore: clearAllCharacters委譲 - 実装予定');
    }
    
    startBoundingBoxEdit() {
        // 詳細実装は元app.jsから継承予定
        console.log('📦 ApplicationCore: startBoundingBoxEdit委譲 - 実装予定');
    }
    
    saveBoundingBox() {
        // 詳細実装は元app.jsから継承予定
        console.log('💾 ApplicationCore: saveBoundingBox委譲 - 実装予定');
    }
    
    cancelBoundingBox() {
        // 詳細実装は元app.jsから継承予定
        console.log('↶ ApplicationCore: cancelBoundingBox委譲 - 実装予定');
    }
    
    endBoundingBoxEdit() {
        // 詳細実装は元app.jsから継承予定
        console.log('✅ ApplicationCore: endBoundingBoxEdit委譲 - 実装予定');
    }
}

// ApplicationCoreをグローバルに公開（デバッグ・互換性用）
window.ApplicationCore = ApplicationCore;

console.log('📦 ApplicationCore.js モジュール読み込み完了');
