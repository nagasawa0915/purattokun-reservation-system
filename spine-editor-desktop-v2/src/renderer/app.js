/**
 * メインアプリケーション - 軽量起動制御システム
 * 起動順序・依存注入・イベント配線のみに特化
 */

import { UIManager } from './ui-manager.js';
import { ProjectLoader } from './project-loader.js';
import { PreviewManager } from './preview-manager.js';
import { PackageExporter } from './package-exporter.js';
import { SpinePreviewLayer } from './spine-preview-layer.js';
import { Utils } from './utils.js';

// 🚀 Phase 2統合モジュール
import { SpineActorManager } from './SpineActorManager.js';

// ApplicationCore統合制御モジュール（UI統合対象）
import { UIController } from './UIController.js';
import { ProjectFileManager } from './ProjectFileManager.js';

export class DemoApp {
    constructor() {
        // 最小限の状態管理
        this.spinePosition = { x: 100, y: 100 };
        
        // グローバルアクセス登録
        window.appInstance = this;
        
        // 依存注入: 基本モジュール
        this.initializeBasicModules();
        
        // ApplicationCore統合制御は後で初期化
        this.uiController = null;
        this.projectFileManager = null;
        // 🚀 Phase 2統合: SpineDisplayController → SpineActorManager統合済み
        
        // 初期化開始
        this.initialize();
    }

    /**
     * 基本モジュール依存注入
     */
    initializeBasicModules() {
        this.uiManager = new UIManager();
        this.projectLoader = new ProjectLoader();
        this.previewManager = new PreviewManager();
        this.packageExporter = new PackageExporter();
        this.spinePreviewLayer = null; // 後で初期化
        
        // 🚀 Phase 2統合: SpineActorManager（2つのクラスを統合）
        this.spineActorManager = new SpineActorManager(this);
    }

    /**
     * ApplicationCore統合制御依存注入
     */
    initializeApplicationCore() {
        this.uiController = new UIController(this);
        this.projectFileManager = new ProjectFileManager(this);
        
        console.log('⚡ ApplicationCore統合制御依存注入完了:', {
            uiController: !!this.uiController,
            projectFileManager: !!this.projectFileManager,
            spineActorManager: !!this.spineActorManager
        });
    }

    /**
     * ApplicationCore起動制御 - Phase 2仕様
     * 起動順序: SpinePreviewLayer → UI要素 → ApplicationCore → イベント配線
     */
    async initialize() {
        try {
            console.log('🚀 軽量起動制御開始');
            
            // Phase 2: SpinePreviewLayer先行初期化
            await this.initializeSpinePreviewLayer();
            
            // UI要素初期化・検証
            const elements = this.uiManager.initializeElements();
            if (!this.uiManager.validateAllElements()) {
                throw new Error('必要なUI要素が見つかりません');
            }
            
            // ApplicationCore統合制御初期化（イベント配線前に実行）
            this.initializeApplicationCore();
            
            // ApplicationCore統合制御非同期初期化
            await this.initializeApplicationCoreAsync();
            
            // イベント配線
            this.bindEvents();
            
            // 基本システム起動
            await this.startBasicSystems(elements);
            
            console.log('✅ 軽量起動制御完了');
            
        } catch (error) {
            console.error('❌ 起動制御エラー:', error);
            this.uiManager.updateStatus('error', `初期化エラー: ${error.message}`);
        }
    }

    /**
     * ApplicationCore統合制御非同期初期化
     */
    async initializeApplicationCoreAsync() {
        // 🚀 Phase 2統合: SpineActorManager初期化
        if (this.spineActorManager && typeof this.spineActorManager.init === 'function') {
            await this.spineActorManager.init();
            console.log('⚡ SpineActorManager統合制御非同期完了');
        } else {
            console.log('⚡ SpineActorManager初期化スキップ（未定義）');
        }
    }

    /**
     * 基本システム起動
     */
    async startBasicSystems(elements) {
        // プレビュー管理初期化
        this.previewManager.initialize(
            elements.previewIframe,
            elements.previewPlaceholder,
            elements.pageList
        );
        
        // 🚀 Phase 2統合: SpineActorManager設定
        this.spineActorManager.setPreviewIframe(elements.previewIframe);
        
        // 保存データ読み込み
        await this.projectLoader.loadSavedPaths();
        
        // Spine・ドロップゾーン設定
        this.initializeSpineSystem();
        this.setupDropZone();
        
        // レスポンシブ対応
        this.uiManager.setupResponsive();
    }

    /**
     * イベント配線 - UIControllerに委譲
     */
    bindEvents() {
        // UIController初期化確認
        if (!this.uiController) {
            console.error('❌ UIController未初期化');
            throw new Error('UIController未初期化');
        }
        
        // イベントハンドラーオブジェクトを定義
        const handlers = {
            openFolder: () => this.selectSpineFolder(),
            loadSpineFolder: (event) => this.loadSpineProject(event.target.dataset.path),
            exportPackage: () => this.exportPackage(),
            previewPackage: () => this.previewPackage(),
            addSpineCharacter: () => this.addBuiltInCharacter('dummy-character'),
            savePosition: () => this.savePosition()
        };
        
        this.uiController.bindEvents(handlers);
    }

    /**
     * Spineシステム初期化
     */
    initializeSpineSystem() {
        try {
            // 外部SpineCore初期化
            if (window.SpineCore) {
                this.spineCore = new SpineCore();
                if (!this.spineCore.initialize()) {
                    console.error('❌ SpineCore初期化失敗');
                    return;
                }
            }
            
            // 外部SpineRenderer初期化
            if (window.SpineRenderer && this.spineCore) {
                this.spineRenderer = new SpineRenderer(this.spineCore);
            }
            
            // 保存位置復元
            this.restorePosition();
            
        } catch (error) {
            console.error('❌ Spineシステム初期化エラー:', error);
        }
    }

    /**
     * SpinePreviewLayer初期化
     */
    async initializeSpinePreviewLayer() {
        try {
            const previewContent = document.getElementById('preview-content');
            if (!previewContent) {
                console.warn('⚠️ プレビューコンテンツが見つかりません');
                return;
            }

            this.spinePreviewLayer = new SpinePreviewLayer(previewContent);
            const success = await this.spinePreviewLayer.initialize();
            
            if (success) {
                console.log('✅ SpinePreviewLayer初期化完了');
            } else {
                console.warn('⚠️ SpinePreviewLayer初期化失敗 - ダミー表示で継続');
            }

        } catch (error) {
            console.error('❌ SpinePreviewLayer初期化エラー:', error);
        }
    }

    /**
     * ドロップゾーン設定 - SpineDisplayControllerに委譲
     */
    setupDropZone() {
        this.spineActorManager.setupDropZone();
    }

    // ========== ApplicationCore移譲メソッド（API境界） ========== //
    
    async openFolder() { return await this.projectFileManager.openFolder(); }
    async addSpineCharacterToPreview(characterData, x, y) { return await this.spineActorManager.addSpineCharacterToPreview(characterData, x, y); }
    addSpineCharacter() { return this.spineActorManager.addSpineCharacter(); }
    updateSpinePosition(position) { this.spineActorManager.updateSpinePosition(position); }

    /**
     * 位置保存・復元
     */
    savePosition() {
        if (!this.spineCharacter && this.spineActorManager.getAllActors().length === 0) {
            this.uiManager.updateStatus('error', 'Spineキャラクターがありません');
            return;
        }
        
        const position = this.uiManager.getSpinePosition();
        const result = Utils.savePosition('dummy-character', position);
        
        this.uiManager.updateStatus(result.success ? 'ready' : 'error', 
            result.success ? `位置保存完了: (${position.x}, ${position.y})` : '位置保存に失敗しました');
    }

    restorePosition() {
        const savedData = Utils.restorePosition();
        
        if (savedData && savedData.position) {
            this.spinePosition = savedData.position;
            this.uiManager.updateSpineInputs(this.spinePosition);
            this.packageExporter.setSpinePosition(this.spinePosition);
            return true;
        }
        
        return false;
    }

    /**
     * パッケージ操作
     */
    async exportPackage() {
        this.uiManager.updateStatus('loading', 'パッケージを出力中...');
        
        try {
            this.packageExporter.setSpinePosition(this.uiManager.getSpinePosition());
            const result = await this.packageExporter.exportPackage();
            
            const status = result.success ? 'ready' : result.canceled ? 'ready' : 'error';
            this.uiManager.updateStatus(status, result.message);
            
        } catch (error) {
            console.error('❌ パッケージ出力エラー:', error);
            this.uiManager.updateStatus('error', `パッケージ出力エラー: ${error.message}`);
        }
    }

    async previewPackage() {
        this.uiManager.updateStatus('loading', 'プレビューを準備中...');
        
        try {
            this.packageExporter.setSpinePosition(this.uiManager.getSpinePosition());
            const result = await this.packageExporter.previewPackage();
            
            if (result.success) {
                if (result.previewURL) {
                    this.previewManager.showInlinePreview(result.html);
                }
                this.uiManager.updateStatus('ready', result.message);
            } else {
                this.uiManager.updateStatus('error', result.message);
            }
            
        } catch (error) {
            console.error('❌ プレビューエラー:', error);
            this.uiManager.updateStatus('error', `プレビュー失敗: ${error.message}`);
        }
    }



    // ========== ProjectFileManager移譲メソッド（API境界） ========== //
    
    async selectSpineFolder() { return await this.projectFileManager.selectSpineFolder(); }
    async loadSpineProject(folderPath) { return await this.projectFileManager.loadSpineProject(folderPath); }
    displaySpineProjectInfo(projectData) { return this.projectFileManager.displaySpineProjectInfo(projectData); }
    setupCharacterDropZone() { return this.projectFileManager.setupCharacterDropZone(); }
    async handleLightweightDrop(assetId, sourceUI, e, dropZone) { return await this.projectFileManager.handleLightweightDrop(assetId, sourceUI, e, dropZone); }
    getCharacterDataByAssetId(assetId) { return this.projectFileManager.getCharacterDataByAssetId(assetId); }
    buildSpineProjectData(folderPath, scanResult) { return this.projectFileManager.buildSpineProjectData(folderPath, scanResult); }

    // ========== SpineDisplayController移譲メソッド（API境界） ========== //
    
    async createSpineCharacterFromProject(characterData, x, y) { return await this.spineActorManager.createSpineCharacterFromProject(characterData, x, y); }
    async positionCharacterAtDropLocation(characterName, x, y) { return await this.spineActorManager.positionCharacterAtDropLocation(characterName, x, y); }
    async addBuiltInCharacter(characterName) { return await this.spineActorManager.addBuiltInCharacter(characterName); }
    clearAllCharacters() { return this.spineActorManager.clearAllCharacters(); }

    // ========== 状態管理システム ========== //
    
    exportAppState() {
        return {
            spinePosition: { ...this.spinePosition },
            projectSettings: this.projectLoader.exportSettings(),
            packageSettings: this.packageExporter.exportSettings(),
            timestamp: Date.now()
        };
    }

    importAppState(state) {
        try {
            if (state.spinePosition) {
                this.spinePosition = { ...state.spinePosition };
                this.uiManager.updateSpineInputs(this.spinePosition);
                this.packageExporter.setSpinePosition(this.spinePosition);
            }
            if (state.projectSettings) this.projectLoader.importSettings(state.projectSettings);
            if (state.packageSettings) this.packageExporter.importSettings(state.packageSettings);
            
            return true;
        } catch (error) {
            console.error('❌ アプリケーション状態インポートエラー:', error);
            return false;
        }
    }

    reset() {
        // 基本モジュールリセット
        this.uiManager.clearFileList();
        this.uiManager.clearSpineCharacterList();
        this.uiManager.disableButtons();
        this.previewManager.clearPreview();
        // 🚀 Phase 2統合: 全アクター削除
        this.spineActorManager.getAllActors().forEach(actor => {
            this.spineActorManager.detach(actor.id);
        });
        
        // ApplicationCore統合制御リセット
        this.uiController.reset();
        this.projectFileManager.reset();
        this.spineActorManager.reset();
        
        // 状態リセット
        this.spinePosition = { x: 100, y: 100 };
        this.uiManager.updateSpineInputs(this.spinePosition);
        this.uiManager.updateStatus('ready', 'アプリケーションがリセットされました');
        
        console.log('🔄 軽量リセット完了');
    }

    getDebugInfo() {
        return {
            spinePosition: { ...this.spinePosition },
            placedCharacters: this.spineActorManager.getAllActors().length,
            moduleStatus: {
                basic: [this.uiManager, this.projectLoader, this.spineActorManager, this.previewManager, this.packageExporter].every(m => !!m),
                applicationCore: [this.uiController, this.projectFileManager, this.spineActorManager].every(m => !!m),
                spine: !!this.spineCore && !!this.spineRenderer
            }
        };
    }

    // ========== UIController移譲メソッド（API境界） ========== //
    
    startBoundingBoxEdit() { return this.uiController.startBoundingBoxEdit(); }
    saveBoundingBox() { return this.uiController.saveBoundingBox(); }
    cancelBoundingBox() { return this.uiController.cancelBoundingBox(); }
    endBoundingBoxEdit() { return this.uiController.endBoundingBoxEdit(); }
    toggleBoundingBoxEditUI(isEditing) { return this.uiController.toggleBoundingBoxEditUI(isEditing); }
    enableBoundingBoxEditButton() { return this.uiController.enableBoundingBoxEditButton(); }
}
