/**
 * HomepageIntegrationController.js - ホームページ機能統合コントローラー
 * 機能: FileSystem・Outliner・Preview の協調制御・統合ワークフロー
 * UI非侵襲性: 既存システムへの機能追加（影響ゼロ）
 */

import { FileSystemController } from '../filesystem/FileSystemController.js';
import { OutlinerEnhancer } from '../ui/OutlinerEnhancer.js';
import { PreviewController } from '../preview/PreviewController.js';

export class HomepageIntegrationController {
    constructor() {
        this.fileSystemController = null;
        this.outlinerEnhancer = null;
        this.previewController = null;
        this.isInitialized = false;
        this.integrationState = 'initializing';
        
        console.log('🔗 HomepageIntegrationController初期化開始');
        this.initialize();
    }

    /**
     * システム初期化
     */
    async initialize() {
        try {
            console.log('🚀 ホームページ統合システム初期化');
            
            // 各コントローラー初期化
            this.initializeControllers();
            
            // イベント連携設定
            this.setupEventIntegration();
            
            // 既存システムとの統合
            this.integrateWithExistingSystem();
            
            this.isInitialized = true;
            this.integrationState = 'ready';
            
            console.log('✅ ホームページ統合システム初期化完了');
            
        } catch (error) {
            console.error('❌ ホームページ統合システム初期化エラー:', error);
            this.integrationState = 'error';
        }
    }

    /**
     * 各コントローラー初期化
     */
    initializeControllers() {
        // FileSystemController初期化
        this.fileSystemController = new FileSystemController();
        console.log('✅ FileSystemController初期化完了');
        
        // OutlinerEnhancer初期化  
        this.outlinerEnhancer = new OutlinerEnhancer();
        console.log('✅ OutlinerEnhancer初期化完了');
        
        // PreviewController初期化
        this.previewController = new PreviewController();
        console.log('✅ PreviewController初期化完了');
    }

    /**
     * イベント連携設定
     */
    setupEventIntegration() {
        console.log('🔗 イベント連携設定開始');
        
        // フォルダ選択 → アウトライナー更新
        this.fileSystemController.addEventListener('folderSelected', (data) => {
            console.log('📁 フォルダ選択イベント受信:', data.folderName);
            this.outlinerEnhancer.displayFolderContents(data);
        });
        
        // フォルダ選択エラー → アウトライナーエラー表示
        this.fileSystemController.addEventListener('folderSelectionError', (data) => {
            console.log('❌ フォルダ選択エラーイベント受信:', data.message);
            this.outlinerEnhancer.displayError(data.message);
        });
        
        // ファイル選択 → プレビュー表示
        this.outlinerEnhancer.addFileSelectListener(async (fileData) => {
            console.log('📄 ファイル選択イベント受信:', fileData.name);
            await this.handleFileSelection(fileData);
        });
        
        console.log('✅ イベント連携設定完了');
    }

    /**
     * ファイル選択処理
     * @param {Object} fileData - 選択されたファイルデータ
     */
    async handleFileSelection(fileData) {
        try {
            console.log('📖 ファイル読み込み開始:', fileData.path);
            
            // プレビューローディング表示
            this.previewController.showLoading(fileData.name);
            
            // HTMLファイル読み込み
            const htmlContent = await this.fileSystemController.readHtmlFile(fileData.path);
            
            // プレビュー表示
            await this.previewController.displayHtmlFile(fileData, htmlContent);
            
            console.log('✅ ファイル表示完了');
            
        } catch (error) {
            console.error('❌ ファイル選択処理エラー:', error);
            this.previewController.displayError(`ファイル読み込みエラー: ${error.message}`);
        }
    }

    /**
     * 既存システムとの統合
     */
    integrateWithExistingSystem() {
        console.log('🔗 既存システム統合開始');
        
        // グローバルアクセス設定（デバッグ・管理用）
        window.homepageIntegration = this;
        window.previewController = this.previewController; // エラー表示ボタン用
        
        // 既存の selectHomeFolder 関数をオーバーライド
        if (window.selectHomeFolder) {
            // 元の関数を保存
            window.originalSelectHomeFolder = window.selectHomeFolder;
        }
        
        // 新しい実装で置き換え
        window.selectHomeFolder = () => {
            console.log('📁 統合版フォルダ選択実行');
            this.selectHomepageFolder();
        };
        
        console.log('✅ 既存システム統合完了');
    }

    /**
     * ホームページフォルダ選択（統合版）
     */
    async selectHomepageFolder() {
        console.log('🎯 統合版ホームページフォルダ選択開始');
        
        if (!this.isInitialized) {
            console.error('❌ システムが初期化されていません');
            alert('システムが初期化されていません。しばらく待ってから再度お試しください。');
            return;
        }
        
        try {
            // アウトライナーにローディング表示
            this.outlinerEnhancer.showLoading();
            
            // フォルダ選択実行
            const result = await this.fileSystemController.selectHomePageFolder();
            
            if (result.success) {
                console.log(`✅ フォルダ選択成功: ${result.folderName} (${result.htmlFiles.length}ファイル)`);
                
                // 成功通知（必要に応じて）
                if (result.htmlFiles.length === 0) {
                    alert(`フォルダ "${result.folderName}" を選択しましたが、HTMLファイルが見つかりませんでした。`);
                }
            } else {
                console.log('❌ フォルダ選択失敗:', result.error);
                // エラーはイベントで既に表示済み
            }
            
        } catch (error) {
            console.error('❌ 統合版フォルダ選択エラー:', error);
            this.outlinerEnhancer.displayError('フォルダ選択でエラーが発生しました');
        }
    }

    /**
     * システム状態リセット
     */
    resetSystem() {
        console.log('🔄 システム状態リセット');
        
        try {
            // プレビューリセット
            this.previewController?.resetToOriginal();
            
            // アウトライナーリセット
            this.outlinerEnhancer?.resetToOriginal();
            
            // ファイルシステム状態クリア（選択状態は保持）
            // this.fileSystemController はフォルダ選択状態を保持
            
            console.log('✅ システムリセット完了');
            
        } catch (error) {
            console.error('❌ システムリセットエラー:', error);
        }
    }

    /**
     * ブラウザサポート確認
     * @returns {Object} サポート状況
     */
    checkBrowserSupport() {
        const support = this.fileSystemController?.checkBrowserSupport() || false;
        
        return {
            fileSystemAPI: support,
            compatible: support,
            message: support 
                ? 'File System Access API対応ブラウザです' 
                : 'Chrome 86+ または Edge 86+ が必要です'
        };
    }

    /**
     * 統合システム状態取得
     * @returns {Object} システム状態
     */
    getSystemStatus() {
        return {
            integration: {
                isInitialized: this.isInitialized,
                state: this.integrationState
            },
            filesystem: this.fileSystemController?.getSystemStatus() || null,
            outliner: this.outlinerEnhancer?.getStatus() || null,
            preview: this.previewController?.getStatus() || null,
            browserSupport: this.checkBrowserSupport()
        };
    }

    /**
     * デバッグ情報出力
     */
    debugInfo() {
        const status = this.getSystemStatus();
        console.group('🔍 ホームページ統合システム デバッグ情報');
        console.log('システム状態:', status);
        console.log('FileSystemController:', this.fileSystemController);
        console.log('OutlinerEnhancer:', this.outlinerEnhancer);
        console.log('PreviewController:', this.previewController);
        console.groupEnd();
        return status;
    }

    /**
     * システムヘルスチェック
     * @returns {Object} ヘルスチェック結果
     */
    performHealthCheck() {
        console.log('🏥 システムヘルスチェック実行');
        
        const health = {
            overall: 'healthy',
            issues: [],
            warnings: []
        };

        // FileSystemController チェック
        if (!this.fileSystemController) {
            health.issues.push('FileSystemController が初期化されていません');
            health.overall = 'error';
        }

        // OutlinerEnhancer チェック
        if (!this.outlinerEnhancer?.getStatus().isInitialized) {
            health.issues.push('OutlinerEnhancer が正しく初期化されていません');
            health.overall = 'error';
        }

        // PreviewController チェック
        if (!this.previewController?.getStatus().isInitialized) {
            health.issues.push('PreviewController が正しく初期化されていません');
            health.overall = 'error';
        }

        // ブラウザサポートチェック
        if (!this.checkBrowserSupport().compatible) {
            health.warnings.push('ブラウザがFile System Access APIに対応していません');
            if (health.overall === 'healthy') health.overall = 'warning';
        }

        console.log('🏥 ヘルスチェック完了:', health.overall);
        return health;
    }

    /**
     * クリーンアップ
     */
    destroy() {
        console.log('🧹 HomepageIntegrationController クリーンアップ');
        
        // 各コントローラークリーンアップ
        this.fileSystemController?.destroy();
        this.outlinerEnhancer?.destroy();
        this.previewController?.destroy();
        
        // グローバル参照クリア
        if (window.homepageIntegration === this) {
            delete window.homepageIntegration;
        }
        if (window.previewController === this.previewController) {
            delete window.previewController;
        }
        
        // 元の関数を復元
        if (window.originalSelectHomeFolder) {
            window.selectHomeFolder = window.originalSelectHomeFolder;
            delete window.originalSelectHomeFolder;
        }
        
        this.isInitialized = false;
        this.integrationState = 'destroyed';
        
        console.log('✅ クリーンアップ完了');
    }
}