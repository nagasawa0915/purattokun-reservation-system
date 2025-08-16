/**
 * メインアプリケーション
 * 全モジュールを統合して DemoApp 機能を提供
 */

import { UIManager } from './ui-manager.js';
import { ProjectLoader } from './project-loader.js';
import { SpineCharacterManager } from './spine-character-manager.js';
import { PreviewManager } from './preview-manager.js';
import { PackageExporter } from './package-exporter.js';
import { SpinePreviewLayer } from './spine-preview-layer.js';
import { Utils } from './utils.js';

export class DemoApp {
    constructor() {
        this.currentProject = null;
        this.currentPage = null;
        this.spinePosition = { x: 100, y: 100 };
        this.spineCharacter = null;
        
        // モジュール初期化
        this.uiManager = new UIManager();
        this.projectLoader = new ProjectLoader();
        this.spineCharacterManager = new SpineCharacterManager();
        this.previewManager = new PreviewManager();
        this.packageExporter = new PackageExporter();
        this.spinePreviewLayer = null; // 後で初期化
        
        // Spine System初期化
        this.spineCore = null;
        this.spineRenderer = null;
        
        this.initialize();
    }

    /**
     * アプリケーション初期化
     */
    async initialize() {
        try {
            // console.log('🚀 Demo App initializing...');
            
            // UI要素初期化
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
            
            // SpinePreviewLayer初期化
            await this.initializeSpinePreviewLayer();
            
            // ドロップゾーン設定
            this.setupDropZone();
            
            // レスポンシブ対応
            this.uiManager.setupResponsive();
            
            console.log('✅ Demo App初期化完了');
            
        } catch (error) {
            console.error('❌ Demo App初期化エラー:', error);
            this.uiManager.updateStatus('error', `初期化エラー: ${error.message}`);
        }
    }

    /**
     * イベントハンドラーを設定
     */
    bindEvents() {
        const handlers = {
            openFolder: () => this.openFolder(),
            loadSpineFolder: () => this.loadSpineFolder(),
            exportPackage: () => this.exportPackage(),
            previewPackage: () => this.previewPackage(),
            addSpineCharacter: () => this.addSpineCharacter(),
            savePosition: () => this.savePosition(),
            updateSpinePosition: (position) => this.updateSpinePosition(position)
        };
        
        this.uiManager.bindEvents(handlers);
    }

    /**
     * Spineシステム初期化
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
            
            // console.log('✅ Spine System初期化完了');
            
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

            // SpinePreviewLayer インスタンス作成（containerを渡す）
            this.spinePreviewLayer = new SpinePreviewLayer(previewContent);

            // SpinePreviewLayer初期化（新しい実装に対応）
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
     * ドロップゾーン設定
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
     * プロジェクトフォルダを開く
     */
    async openFolder() {
        this.uiManager.updateStatus('loading', 'フォルダを選択中...');
        
        try {
            const result = await this.projectLoader.openFolder();
            
            if (result.success) {
                this.currentProject = result.path;
                
                // プロジェクトファイルを処理
                const processedFiles = this.projectLoader.processProjectFiles(result.files);
                
                if (processedFiles.length === 0) {
                    this.previewManager.clearFileList();
                    this.uiManager.updateStatus('ready', 'HTMLファイルが見つかりませんでした');
                    return;
                }
                
                // アウトライナー方式で表示
                this.previewManager.renderOutlinerView(processedFiles, (file) => {
                    this.currentPage = file;
                });
                
                // ボタンを有効化
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

    /**
     * Spineフォルダを読み込み
     */
    async loadSpineFolder() {
        // console.log('🎭 loadSpineFolder() method called!');
        this.uiManager.updateStatus('loading', 'Spineフォルダを選択中...');
        
        try {
            const result = await this.spineCharacterManager.loadSpineFolder();
            
            if (result.success) {
                if (result.spineFiles.length > 0) {
                    // Spineキャラクター一覧表示
                    const spineCharacterList = this.uiManager.elements.spineCharacterList;
                    this.spineCharacterManager.displaySpineCharacters(result.spineFiles, spineCharacterList);
                    this.uiManager.showSpineCharacterList();
                } else {
                    this.uiManager.setSpineCharacterStatus('Spineファイルが見つかりませんでした');
                    this.uiManager.hideSpineCharacterList();
                }
                
                this.uiManager.updateStatus('ready', result.message);
                
            } else if (result.canceled) {
                this.uiManager.updateStatus('ready', result.message);
            } else {
                this.uiManager.updateStatus('error', result.message);
            }
        } catch (error) {
            console.error('🚨 Spineフォルダ選択エラー:', error);
            this.uiManager.updateStatus('error', 'Spineフォルダ選択に失敗しました');
        }
    }

    /**
     * プレビューエリアにSpineキャラクターを追加
     * @param {object} characterData - キャラクターデータ
     * @param {number} x - X座標
     * @param {number} y - Y座標
     */
    async addSpineCharacterToPreview(characterData, x, y) {
        try {
            this.uiManager.updateStatus('loading', 'Spineキャラクターを読み込み中...');
            
            // 実際のSpine表示を優先で試行
            if (this.spinePreviewLayer && this.spinePreviewLayer.spineLoaded) {
                console.log('🎭 実際のSpine表示を試行中...');
                
                // マウス座標を直接SpinePreviewLayerに渡す（内部で適切な座標変換を行う）
                const spineResult = await this.spinePreviewLayer.addCharacter(
                    characterData, 
                    x, 
                    y
                );
                
                if (spineResult.success) {
                    this.uiManager.updateStatus('ready', `🎭 Spineキャラクター「${characterData.name}」を表示しました (LIVE)`);
                    console.log(`✅ 実際のSpineキャラクター「${characterData.name}」をプレビューに追加完了`);
                    return;
                } else {
                    console.warn('⚠️ Spine表示失敗、ダミー表示にフォールバック:', spineResult.error);
                }
            }
            
            // フォールバック: ダミー表示
            // console.log('📦 ダミー表示でキャラクター追加...');
            const spineContainer = document.getElementById('spine-character-container');
            if (!spineContainer) {
                throw new Error('Spineコンテナが見つかりません');
            }
            
            const result = this.spineCharacterManager.addSpineCharacterToPreview(
                characterData, x, y, spineContainer
            );
            
            if (result.success) {
                this.uiManager.updateStatus('ready', `📦 キャラクター「${characterData.name}」を追加しました (ダミー)`);
                // console.log(`✅ ダミーSpineキャラクター「${characterData.name}」をプレビューに追加完了`);
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('❌ Spineキャラクター追加エラー:', error);
            this.uiManager.updateStatus('error', `キャラクター追加失敗: ${error.message}`);
        }
    }

    /**
     * Spineキャラクターを追加（従来のボタン方式）
     */
    addSpineCharacter() {
        this.uiManager.updateStatus('loading', 'Spineキャラクターを追加中...');
        
        try {
            // プレビューエリアを取得
            const previewContent = document.querySelector('.preview-content');
            if (!previewContent) {
                throw new Error('プレビューエリアが見つかりません');
            }
            
            // 既存のキャラクターがあれば削除
            if (this.spineCharacter && this.spineRenderer) {
                this.spineRenderer.removeCharacter('dummy-character');
                this.spineCharacter = null;
            }
            
            // ダミーキャラクターデータ
            const characterData = {
                name: 'Dummy Character',
                type: 'demo',
                version: 'v2.0'
            };
            
            // 現在の位置で追加
            const position = this.uiManager.getSpinePosition();
            this.addSpineCharacterToPreview(characterData, position.x, position.y);
            
            // UI更新
            this.uiManager.enableSavePosition();
            
            this.uiManager.updateStatus('ready', 'Spineキャラクター追加完了');
            // console.log('✅ Spineダミーキャラクター追加完了');
            
        } catch (error) {
            console.error('❌ Spineキャラクター追加エラー:', error);
            this.uiManager.updateStatus('error', `Spineキャラクター追加失敗: ${error.message}`);
        }
    }

    /**
     * Spine位置更新（数値入力から）
     * @param {object} position - 位置情報 {x, y}
     */
    updateSpinePosition(position) {
        this.spinePosition = { ...position };
        
        // パッケージエクスポーターに位置を設定
        this.packageExporter.setSpinePosition(this.spinePosition);
        
        // 実際のSpineキャラクターの位置も更新（実装されている場合）
        if (this.spineCharacter && this.spineCore) {
            const canvasElement = this.spineCore.canvasElements?.get('spine-dummy-character');
            if (canvasElement) {
                canvasElement.style.left = this.spinePosition.x + 'px';
                canvasElement.style.top = this.spinePosition.y + 'px';
            }
        }
        
        this.uiManager.updateStatus('ready', `位置更新: (${this.spinePosition.x}, ${this.spinePosition.y})`);
        // console.log('📍 位置数値更新:', this.spinePosition);
    }

    /**
     * 位置を保存
     */
    savePosition() {
        if (!this.spineCharacter && this.spineCharacterManager.getPlacedCharacters().length === 0) {
            this.uiManager.updateStatus('error', 'Spineキャラクターがありません');
            return;
        }
        
        const position = this.uiManager.getSpinePosition();
        const result = Utils.savePosition('dummy-character', position);
        
        if (result.success) {
            this.uiManager.updateStatus('ready', `位置保存完了: (${position.x}, ${position.y})`);
        } else {
            this.uiManager.updateStatus('error', '位置保存に失敗しました');
        }
    }

    /**
     * 保存された位置を復元
     */
    restorePosition() {
        const savedData = Utils.restorePosition();
        
        if (savedData && savedData.position) {
            this.spinePosition = savedData.position;
            this.uiManager.updateSpineInputs(this.spinePosition);
            this.packageExporter.setSpinePosition(this.spinePosition);
            
            // console.log('📍 位置復元:', this.spinePosition);
            return true;
        }
        
        return false;
    }

    /**
     * パッケージを出力
     */
    async exportPackage() {
        this.uiManager.updateStatus('loading', 'パッケージを出力中...');
        
        try {
            // 現在の位置をパッケージエクスポーターに設定
            const currentPosition = this.uiManager.getSpinePosition();
            this.packageExporter.setSpinePosition(currentPosition);
            
            const result = await this.packageExporter.exportPackage();
            
            if (result.success) {
                this.uiManager.updateStatus('ready', result.message);
            } else if (result.canceled) {
                this.uiManager.updateStatus('ready', result.message);
            } else {
                this.uiManager.updateStatus('error', result.message);
            }
            
        } catch (error) {
            console.error('❌ パッケージ出力エラー:', error);
            this.uiManager.updateStatus('error', `パッケージ出力エラー: ${error.message}`);
        }
    }

    /**
     * パッケージプレビュー
     */
    async previewPackage() {
        this.uiManager.updateStatus('loading', 'プレビューを準備中...');
        
        try {
            // 現在の位置をパッケージエクスポーターに設定
            const currentPosition = this.uiManager.getSpinePosition();
            this.packageExporter.setSpinePosition(currentPosition);
            
            const result = await this.packageExporter.previewPackage();
            
            if (result.success) {
                if (result.previewURL) {
                    // フォールバック: インラインプレビュー
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

    /**
     * アプリケーション状態をエクスポート
     * @returns {object} アプリケーション状態
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
     * アプリケーション状態をインポート
     * @param {object} state - アプリケーション状態
     * @returns {boolean} インポート成功可否
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
            
            // console.log('✅ アプリケーション状態インポート完了');
            return true;
        } catch (error) {
            console.error('❌ アプリケーション状態インポートエラー:', error);
            return false;
        }
    }

    /**
     * アプリケーションをリセット
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
        
        // console.log('🔄 アプリケーションリセット完了');
    }

    /**
     * デバッグ情報を取得
     * @returns {object} デバッグ情報
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
                spineRenderer: !!this.spineRenderer
            }
        };
    }
}

// グローバルエクスポート（後方互換性）
window.DemoApp = DemoApp;