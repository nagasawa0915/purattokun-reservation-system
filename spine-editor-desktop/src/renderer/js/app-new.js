// 🎯 Spine Editor Desktop - Temporary Backup File
// This file can be deleted after the refactoring is complete

// ========== メインアプリケーション統合クラス ========== //
class SpineEditorApp {
    constructor() {
        this.state = {
            // プロジェクト情報
            project: {
                homePageFolder: null,
                spineCharactersFolder: null,
                name: null,
                filePath: null
            },
            
            // キャラクター情報
            characters: new Map(), // characterId -> characterData
            selectedCharacter: null,
            
            // UI状態
            ui: {
                isPlaying: false,
                currentTime: 0,
                totalTime: 10000, // 10秒
                zoomLevel: 1.0
            },
            
            // VFS (Virtual File System)
            vfs: {
                blobCache: new Map(),
                characterAssets: new Map()
            }
        };
        
        // Spine統合マネージャー初期化
        this.spineIntegration = null;
        
        // モジュール初期化
        this.initializeModules();
        
        // イベントリスナー設定
        this.initializeEventListeners();
        
        console.log('✅ SpineEditorApp 初期化完了');
    }

    // モジュール初期化
    initializeModules() {
        console.log('🔗 モジュール初期化開始');
        
        try {
            // 各モジュールを初期化（依存関係順）
            this.projectManager = new ProjectManager(this);
            this.characterManager = new CharacterManager(this);
            this.characterRenderer = new CharacterRenderer(this);
            this.dragDropHandler = new DragDropHandler(this);
            this.uiManager = new UIManager(this);
            
            console.log('✅ 全モジュール初期化完了');
            
        } catch (error) {
            console.error('❌ モジュール初期化エラー:', error);
            throw error;
        }
    }

    // ========== イベントリスナー管理 ========== //

    // イベントリスナー初期化
    initializeEventListeners() {
        console.log('🔗 イベントリスナー設定開始');
        
        // ツールバーボタン
        this.bindToolbarEvents();
        
        // Electronメニューイベント
        this.bindElectronEvents();
        
        // パネル操作イベント
        this.bindPanelEvents();
        
        // キーボードショートカット
        this.bindKeyboardEvents();
        
        console.log('✅ イベントリスナー設定完了');
    }

    // ツールバーイベント
    bindToolbarEvents() {
        // プロジェクト操作
        document.getElementById('new-project')?.addEventListener('click', () => this.projectManager.newProject());
        document.getElementById('open-project')?.addEventListener('click', () => this.projectManager.openProject());
        document.getElementById('save-project')?.addEventListener('click', () => this.projectManager.saveProject());
        
        // フォルダ選択
        document.getElementById('select-homepage')?.addEventListener('click', () => this.projectManager.selectHomepageFolder());
        document.getElementById('select-spine')?.addEventListener('click', () => this.projectManager.selectSpineFolder());
        
        // タイムライン制御
        document.getElementById('play-timeline')?.addEventListener('click', () => this.uiManager.playTimeline());
        document.getElementById('stop-timeline')?.addEventListener('click', () => this.uiManager.stopTimeline());
        
        // エクスポート
        document.getElementById('export-package')?.addEventListener('click', () => this.projectManager.exportPackage());
        
        // プレビューコントロール
        document.getElementById('fit-view')?.addEventListener('click', () => this.dragDropHandler.fitView());
        document.getElementById('reset-view')?.addEventListener('click', () => this.dragDropHandler.resetView());
    }

    // Electronイベント
    bindElectronEvents() {
        if (typeof electronAPI !== 'undefined') {
            electronAPI.onProjectNew(() => this.projectManager.newProject());
            electronAPI.onProjectOpen((event, filePath) => this.projectManager.openProject(filePath));
            electronAPI.onProjectSave(() => this.projectManager.saveProject());
            
            // プロフェッショナルダイアログイベント
            electronAPI.onShowOpenProjectDialog(() => this.projectManager.showOpenProjectDialog());
            electronAPI.onShowSaveProjectDialog(() => this.projectManager.showSaveProjectDialog());
            electronAPI.onShowExportDialog(() => this.projectManager.showExportPackageDialog());
            
            electronAPI.onHomepageFolderSelected((event, folder) => this.projectManager.setHomepageFolder(folder));
            electronAPI.onSpineFolderSelected((event, folder) => this.projectManager.setSpineFolder(folder));
            electronAPI.onPackageExport(() => this.projectManager.exportPackage());
        }
    }

    // パネルイベント
    bindPanelEvents() {
        // プロパティパネル
        this.uiManager.bindPropertyEvents();
        
        // レイヤーパネル
        this.uiManager.bindLayerEvents();
        
        // アウトライナー
        this.uiManager.bindOutlinerEvents();
        
        // プレビューエリアのドロップゾーン設定
        this.dragDropHandler.bindPreviewDropEvents();
    }

    // キーボードショートカット
    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + キー の組み合わせ
            if (e.ctrlKey || e.metaKey) {
                switch (e.code) {
                    case 'KeyN': // 新規
                        e.preventDefault();
                        this.projectManager.newProject();
                        break;
                    case 'KeyO': // 開く
                        e.preventDefault();
                        this.projectManager.openProject();
                        break;
                    case 'KeyS': // 保存
                        e.preventDefault();
                        this.projectManager.saveProject();
                        break;
                    case 'KeyE': // エクスポート
                        e.preventDefault();
                        this.projectManager.exportPackage();
                        break;
                }
            }
            
            // 単体キー
            switch (e.code) {
                case 'Space': // 再生/停止
                    e.preventDefault();
                    this.uiManager.togglePlayback();
                    break;
                case 'KeyF': // フィット表示
                    e.preventDefault();
                    this.dragDropHandler.fitView();
                    break;
                case 'Delete': // 削除
                case 'Backspace':
                    if (this.state.selectedCharacter) {
                        e.preventDefault();
                        this.characterManager.deleteSelectedCharacter();
                    }
                    break;
            }
        });
    }

    // ========== Spine統合システム ========== //

    // Spine統合システム初期化
    async initializeSpineIntegration() {
        console.log('🔗 Spine統合システム初期化開始');
        
        try {
            // SpineIntegrationManagerが利用可能かチェック
            if (typeof SpineIntegrationManager === 'undefined') {
                console.warn('⚠️ SpineIntegrationManagerが利用できません');
                return false;
            }
            
            // Spine統合マネージャー作成
            this.spineIntegration = new SpineIntegrationManager(this);
            
            // 全キャラクターのSpineインスタンス作成
            const success = await this.spineIntegration.initializeAllCharacters();
            
            if (success) {
                console.log('✅ Spine統合システム初期化完了');
                
                // プレビューエリアの状態を更新
                this.uiManager.updatePreviewDisplay();
                
                return true;
            } else {
                console.error('❌ Spine統合システム初期化失敗');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Spine統合システム初期化エラー:', error);
            return false;
        }
    }

    // ========== プレビュー・UI統合管理 ========== //

    // プレビュー更新（統合管理）
    updatePreview() {
        console.log('🖼️ プレビュー更新');
        
        // UIマネージャーを通じてプレビュー表示を更新
        this.uiManager.updatePreviewDisplay();
        
        // Phase 2で詳細実装予定
        // - リアルタイムプロパティ反映
        // - Spineアニメーション更新
        // - キャラクター位置・スケール同期
    }

    // ========== 通知・ダイアログ管理 ========== //

    // 通知表示（UIマネージャーに委譲）
    showNotification(message, type = 'info') {
        this.uiManager.showNotification(message, type);
    }

    // 確認ダイアログ表示（UIマネージャーに委譲）
    showConfirmDialog(message, title = '確認') {
        return this.uiManager.showConfirmDialog(message, title);
    }

    // 情報ダイアログ表示（UIマネージャーに委譲）
    showInfoDialog(message, title = '情報') {
        this.uiManager.showInfoDialog(message, title);
    }

    // ========== デバッグ・統計 ========== //

    // アプリケーション状態をデバッグ出力
    debugAppState() {
        console.log('🎯 === アプリケーション状態デバッグ ===');
        
        // プロジェクト状態
        console.log('📁 プロジェクト:', {
            name: this.state.project.name,
            homePageFolder: this.state.project.homePageFolder,
            spineCharactersFolder: this.state.project.spineCharactersFolder,
            filePath: this.state.project.filePath
        });
        
        // キャラクター状態
        console.log('🎭 キャラクター:', {
            total: this.state.characters.size,
            selected: this.state.selectedCharacter,
            list: Array.from(this.state.characters.keys())
        });
        
        // UI状態
        console.log('🖥️ UI:', {
            isPlaying: this.state.ui.isPlaying,
            currentTime: this.state.ui.currentTime,
            totalTime: this.state.ui.totalTime,
            zoomLevel: this.state.ui.zoomLevel
        });
        
        // モジュール状態
        console.log('🔧 モジュール:', {
            projectManager: !!this.projectManager,
            characterManager: !!this.characterManager,
            characterRenderer: !!this.characterRenderer,
            dragDropHandler: !!this.dragDropHandler,
            uiManager: !!this.uiManager,
            spineIntegration: !!this.spineIntegration
        });
        
        console.log('🎯 === デバッグ情報終了 ===');
    }

    // モジュール別詳細デバッグ
    debugModuleDetails() {
        console.log('🔧 === モジュール別詳細デバッグ ===');
        
        // 各モジュールのデバッグメソッドを実行
        if (this.characterManager && typeof this.characterManager.debugCharacterInfo === 'function') {
            this.characterManager.debugCharacterInfo();
        }
        
        if (this.characterRenderer && typeof this.characterRenderer.debugDisplayInfo === 'function') {
            this.characterRenderer.debugDisplayInfo();
        }
        
        if (this.dragDropHandler && typeof this.dragDropHandler.debugDropZoneStatus === 'function') {
            this.dragDropHandler.debugDropZoneStatus();
        }
        
        if (this.uiManager && typeof this.uiManager.debugUIState === 'function') {
            this.uiManager.debugUIState();
        }
        
        console.log('🔧 === モジュール詳細デバッグ終了 ===');
    }

    // パフォーマンス統計を取得
    getPerformanceStats() {
        const stats = {
            memoryUsage: {
                characters: this.state.characters.size,
                blobCache: this.state.vfs.blobCache.size,
                characterAssets: this.state.vfs.characterAssets.size
            },
            displayStats: null,
            characterStats: null
        };
        
        // キャラクターレンダラーから統計取得
        if (this.characterRenderer && typeof this.characterRenderer.getDisplayStatistics === 'function') {
            stats.displayStats = this.characterRenderer.getDisplayStatistics();
        }
        
        // キャラクターマネージャーから統計取得
        if (this.characterManager && typeof this.characterManager.getCharacterStatistics === 'function') {
            stats.characterStats = this.characterManager.getCharacterStatistics();
        }
        
        return stats;
    }

    // ========== ライフサイクル管理 ========== //

    // アプリケーション終了処理
    async shutdown() {
        console.log('🔄 アプリケーション終了処理開始');
        
        try {
            // Spine統合システムのクリーンアップ
            if (this.spineIntegration && typeof this.spineIntegration.cleanup === 'function') {
                await this.spineIntegration.cleanup();
            }
            
            // キャラクター表示をクリア
            if (this.characterRenderer && typeof this.characterRenderer.clearAllCharacterDisplays === 'function') {
                this.characterRenderer.clearAllCharacterDisplays();
            }
            
            // キャラクターデータをクリア
            if (this.characterManager && typeof this.characterManager.clearAllCharacters === 'function') {
                this.characterManager.clearAllCharacters();
            }
            
            // VFSキャッシュをクリア
            this.state.vfs.blobCache.clear();
            this.state.vfs.characterAssets.clear();
            
            console.log('✅ アプリケーション終了処理完了');
            
        } catch (error) {
            console.error('❌ アプリケーション終了処理エラー:', error);
        }
    }

    // 状態リセット
    resetApplicationState() {
        console.log('🔄 アプリケーション状態リセット');
        
        // プロジェクト状態リセット
        this.state.project = {
            homePageFolder: null,
            spineCharactersFolder: null,
            name: null,
            filePath: null
        };
        
        // キャラクター状態リセット
        this.state.characters.clear();
        this.state.selectedCharacter = null;
        
        // UI状態リセット
        this.state.ui = {
            isPlaying: false,
            currentTime: 0,
            totalTime: 10000,
            zoomLevel: 1.0
        };
        
        // VFSリセット
        this.state.vfs.blobCache.clear();
        this.state.vfs.characterAssets.clear();
        
        // UI更新
        if (this.uiManager) {
            this.uiManager.updateAllUIOptimized();
        }
        
        console.log('✅ アプリケーション状態リセット完了');
    }
}

// ========== アプリケーション起動 ========== //
let spineEditorApp;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM読み込み完了');
    
    try {
        spineEditorApp = new SpineEditorApp();
        
        // グローバル参照（デバッグ用）
        window.spineEditorApp = spineEditorApp;
        
        console.log('🎉 Spine Editor Desktop 起動完了');
        
    } catch (error) {
        console.error('❌ アプリケーション起動エラー:', error);
        
        // エラーハンドリング - ユーザーに分かりやすいメッセージを表示
        const errorMessage = `
            アプリケーションの起動に失敗しました。
            
            エラー: ${error.message}
            
            以下を確認してください:
            1. 必要なモジュールファイルが読み込まれているか
            2. ブラウザのコンソールでエラー詳細を確認
            3. アプリケーションの再起動を試行
        `;
        
        alert(errorMessage);
    }
});

// ウィンドウ終了時のクリーンアップ
window.addEventListener('beforeunload', (e) => {
    if (spineEditorApp && typeof spineEditorApp.shutdown === 'function') {
        spineEditorApp.shutdown();
    }
});

console.log('✅ Spine Editor Desktop - Application Script 読み込み完了');