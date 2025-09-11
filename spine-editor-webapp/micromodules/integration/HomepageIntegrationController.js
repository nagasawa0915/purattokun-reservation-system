/**
 * HomepageIntegrationController.js - ホームページ機能統合コントローラー
 * 機能: FileSystem・Outliner・Preview の協調制御・統合ワークフロー
 * UI非侵襲性: 既存システムへの機能追加（影響ゼロ）
 */

import { FileSystemController } from '../filesystem/FileSystemController.js';
import { OutlinerEnhancer } from '../ui/OutlinerEnhancer.js';
import { PreviewController } from '../preview/PreviewController.js';
import { SpineFolderController } from '../spine/SpineFolderController.js';

export class HomepageIntegrationController {
    constructor() {
        this.fileSystemController = null;
        this.outlinerEnhancer = null;
        this.previewController = null;
        this.spineFolderController = null;
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
            
            // 🚧 開発モード: 自動フォルダ読み込み
            if (this.fileSystemController.developmentMode) {
                console.log('🚧 開発モード: 自動フォルダ読み込み開始');
                setTimeout(() => {
                    this.selectHomepageFolder();
                }, 1000); // 1秒後に自動実行
            }
            
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
        
        // OutlinerEnhancer初期化（パネル入れ替え対応版）
        this.outlinerEnhancer = new OutlinerEnhancer();
        console.log('✅ OutlinerEnhancer初期化完了（パネル入れ替え対応版）');
        
        // PreviewController初期化
        this.previewController = new PreviewController();
        console.log('✅ PreviewController初期化完了');

        // SpineFolderController初期化
        this.spineFolderController = new SpineFolderController();
        console.log('✅ SpineFolderController初期化完了');
    }

    /**
     * イベント連携設定
     */
    setupEventIntegration() {
        console.log('🔗 イベント連携設定開始');
        
        // OutlinerEnhancer無効化時の代替イベント設定
        if (!this.outlinerEnhancer) {
            console.log('🔧 OutlinerEnhancer無効化 - 代替HTML表示機能を有効化');
            this.setupTemporaryHtmlDisplay();
        }
        
        // フォルダ選択 → アウトライナー更新（パネル入れ替え対応版）
        this.fileSystemController.addEventListener('folderSelected', (data) => {
            console.log('📁 フォルダ選択イベント受信:', data.folderName);
            this.outlinerEnhancer.displayFolderContents(data);
        });
        
        // フォルダ選択エラー → アウトライナーエラー表示（一時無効化）
        // this.fileSystemController.addEventListener('folderSelectionError', (data) => {
        //     console.log('❌ フォルダ選択エラーイベント受信:', data.message);
        //     this.outlinerEnhancer.displayError(data.message);
        // });
        
        // ファイル選択 → プレビュー表示（パネル入れ替え対応版）
        this.outlinerEnhancer.addFileSelectListener(async (fileData) => {
            console.log('📄 ファイル選択イベント受信:', fileData.name);
            await this.handleFileSelection(fileData);
        });

        // Spineフォルダ選択 → アウトライナーSpine表示（パネル入れ替え対応版）
        this.spineFolderController.addEventListener('spineFolderSelected', (data) => {
            console.log('🎭 Spineフォルダ選択イベント受信:', data.folderName);
            this.outlinerEnhancer.displaySpineCharacters(data);
        });

        // Spineフォルダ選択エラー → アウトライナーエラー表示（パネル入れ替え対応版）
        this.spineFolderController.addEventListener('spineFolderSelectionError', (data) => {
            console.log('❌ Spineフォルダ選択エラーイベント受信:', data.message);
            this.outlinerEnhancer.displayError(data.message);
        });

        // Spineキャラクター選択 → プレビュー表示（将来の機能・パネル入れ替え対応版）
        this.outlinerEnhancer.addSpineSelectListener(async (characterData) => {
            console.log('🎪 Spineキャラクター選択イベント受信:', characterData.name);
            await this.handleSpineSelection(characterData);
        });
        
        console.log('✅ イベント連携設定完了');
    }

    /**
     * 一時的なHTML表示機能（OutlinerEnhancer無効化時の代替）
     */
    setupTemporaryHtmlDisplay() {
        console.log('🔧 一時的なHTML表示機能をセットアップ');
        
        // フォルダ選択 → 簡易HTMLリスト表示
        this.fileSystemController.addEventListener('folderSelected', (data) => {
            console.log('📁 フォルダ選択イベント受信（代替処理）:', data.folderName);
            this.displayTemporaryHtmlList(data);
        });
        
        // フォルダ選択エラー → コンソール表示
        this.fileSystemController.addEventListener('folderSelectionError', (data) => {
            console.log('❌ フォルダ選択エラーイベント受信（代替処理）:', data.message);
            alert(`フォルダ選択エラー: ${data.message}`);
        });
        
        console.log('✅ 一時的なHTML表示機能セットアップ完了');
    }

    /**
     * 簡易HTMLファイルリスト表示（代替機能）
     * @param {Object} data - フォルダ選択データ
     */
    displayTemporaryHtmlList(data) {
        console.log('📋 簡易HTMLファイルリスト表示開始');
        
        try {
            // 既存の一時表示エリアを削除
            const existingTempArea = document.getElementById('temp-html-list');
            if (existingTempArea) {
                existingTempArea.remove();
            }
            
            // 一時表示エリア作成
            const tempArea = document.createElement('div');
            tempArea.id = 'temp-html-list';
            tempArea.style.cssText = `
                position: fixed;
                top: 100px;
                left: 20px;
                width: 300px;
                background: white;
                border: 2px solid #007acc;
                border-radius: 8px;
                padding: 15px;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 14px;
            `;
            
            // ヘッダー
            const header = document.createElement('div');
            header.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3 style="margin: 0; color: #007acc;">📁 ${data.folderName}</h3>
                    <button onclick="document.getElementById('temp-html-list').remove()" 
                            style="background: #ff6b6b; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer;">×</button>
                </div>
                <p style="margin: 5px 0; color: #666;">HTMLファイル: ${data.htmlFiles.length}個</p>
            `;
            tempArea.appendChild(header);
            
            // HTMLファイルリスト
            if (data.htmlFiles.length > 0) {
                const fileList = document.createElement('ul');
                fileList.style.cssText = 'list-style: none; padding: 0; margin: 10px 0;';
                
                data.htmlFiles.forEach(file => {
                    const listItem = document.createElement('li');
                    listItem.style.cssText = `
                        padding: 8px;
                        margin: 5px 0;
                        background: #f5f5f5;
                        border-radius: 4px;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    `;
                    listItem.innerHTML = `📄 ${file.name}`;
                    
                    // ホバー効果
                    listItem.addEventListener('mouseenter', () => {
                        listItem.style.backgroundColor = '#e8f4fd';
                    });
                    listItem.addEventListener('mouseleave', () => {
                        listItem.style.backgroundColor = '#f5f5f5';
                    });
                    
                    // クリックでファイル選択
                    listItem.addEventListener('click', async () => {
                        console.log('📄 HTMLファイル選択（代替処理）:', file.name);
                        await this.handleFileSelection(file);
                    });
                    
                    fileList.appendChild(listItem);
                });
                
                tempArea.appendChild(fileList);
            } else {
                const noFiles = document.createElement('p');
                noFiles.textContent = 'HTMLファイルが見つかりませんでした';
                noFiles.style.color = '#999';
                tempArea.appendChild(noFiles);
            }
            
            // 閉じるボタン
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '閉じる';
            closeBtn.style.cssText = `
                width: 100%;
                padding: 8px;
                background: #007acc;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
            `;
            closeBtn.addEventListener('click', () => {
                tempArea.remove();
            });
            tempArea.appendChild(closeBtn);
            
            // ドキュメントに追加
            document.body.appendChild(tempArea);
            
            console.log('✅ 簡易HTMLファイルリスト表示完了');
            
        } catch (error) {
            console.error('❌ 簡易HTMLファイルリスト表示エラー:', error);
        }
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
     * Spineキャラクター選択処理
     * @param {Object} characterData - 選択されたSpineキャラクターデータ
     */
    async handleSpineSelection(characterData) {
        try {
            console.log('🎪 Spineキャラクター処理開始:', characterData.name);
            
            // 将来: プレビューエリアでSpineキャラクターを表示
            // 現在はログ出力のみ
            console.log('🎭 Spineキャラクター情報:', {
                name: characterData.name,
                displayName: characterData.displayName,
                animations: characterData.animations || [],
                isComplete: characterData.isComplete
            });
            
            // TODO: PreviewControllerにSpine表示機能を統合
            console.log('📝 TODO: プレビューエリアでSpine表示');
            
        } catch (error) {
            console.error('❌ Spineキャラクター処理エラー:', error);
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

        // Spineフォルダ選択関数統合
        window.selectSpineFolder = () => {
            console.log('🎯 統合版Spineフォルダ選択実行');
            this.selectSpineFolder();
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
            // アウトライナーにローディング表示（存在する場合のみ）
            if (this.outlinerEnhancer) {
                this.outlinerEnhancer.showLoading();
            }
            
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
            if (this.outlinerEnhancer) {
                this.outlinerEnhancer.displayError('フォルダ選択でエラーが発生しました');
            }
        }
    }

    /**
     * Spineフォルダ選択（統合版）
     */
    async selectSpineFolder() {
        console.log('🎯 統合版Spineフォルダ選択開始');
        
        if (!this.isInitialized) {
            console.error('❌ システムが初期化されていません');
            alert('システムが初期化されていません。しばらく待ってから再度お試しください。');
            return;
        }
        
        try {
            // アウトライナーにローディング表示（存在する場合のみ）
            if (this.outlinerEnhancer) {
                this.outlinerEnhancer.showLoading('Spineキャラクター検索中...');
            }
            
            // Spineフォルダ選択実行
            const result = await this.spineFolderController.selectSpineFolder();
            
            if (result.success) {
                console.log(`✅ Spineフォルダ選択成功: ${result.folderName} (${result.characters.length}キャラクター)`);
                
                // 成功通知（必要に応じて）
                if (result.characters.length === 0) {
                    alert(`フォルダ "${result.folderName}" を選択しましたが、Spineキャラクターが見つかりませんでした。`);
                }
            } else {
                console.log('❌ Spineフォルダ選択失敗:', result.error);
                // エラーはイベントで既に表示済み
            }
            
        } catch (error) {
            console.error('❌ 統合版Spineフォルダ選択エラー:', error);
            if (this.outlinerEnhancer) {
                this.outlinerEnhancer.displayError('Spineフォルダ選択でエラーが発生しました');
            }
        }
    }

    /**
     * システム状態リセット
     */
    resetSystem() {
        console.log('🔄 システム状態リセット');
        
        try {
            // プレビューリセット
            if (this.previewController) {
                this.previewController.resetToOriginal();
            }
            
            // アウトライナーリセット
            if (this.outlinerEnhancer) {
                this.outlinerEnhancer.resetToOriginal();
            }
            
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
            filesystem: this.fileSystemController ? this.fileSystemController.getSystemStatus() : null,
            outliner: this.outlinerEnhancer ? this.outlinerEnhancer.getStatus() : null,
            preview: this.previewController ? this.previewController.getStatus() : null,
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
        if (this.outlinerEnhancer && !this.outlinerEnhancer.getStatus().isInitialized) {
            health.issues.push('OutlinerEnhancer が正しく初期化されていません');
            health.overall = 'error';
        } else if (!this.outlinerEnhancer) {
            health.warnings.push('OutlinerEnhancer が無効化されています');
            if (health.overall === 'healthy') health.overall = 'warning';
        }

        // PreviewController チェック
        if (this.previewController && !this.previewController.getStatus().isInitialized) {
            health.issues.push('PreviewController が正しく初期化されていません');
            health.overall = 'error';
        } else if (!this.previewController) {
            health.issues.push('PreviewController が初期化されていません');
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
        if (this.fileSystemController) {
            this.fileSystemController.destroy();
        }
        if (this.outlinerEnhancer) {
            this.outlinerEnhancer.destroy();
        }
        if (this.previewController) {
            this.previewController.destroy();
        }
        
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