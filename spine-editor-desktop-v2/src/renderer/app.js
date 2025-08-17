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
        
        // v3 Spine統合システム
        this.spineCharacterManagerV3 = null; // 動的読み込み後に設定
        
        
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
            
            // v3 Spine統合システム初期化（実行不要 - start.htmlで既に確認済み）
            // SimpleSpineManagerV3は start.html で読み込み確認済み
            
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
            loadSpineFolder: () => this.selectSpineFolder(),
            exportPackage: () => this.exportPackage(),
            previewPackage: () => this.previewPackage(),
            addSpineCharacter: () => this.addSpineCharacter(),
            savePosition: () => this.savePosition(),
            updateSpinePosition: (position) => this.updateSpinePosition(position),
            addPurattokun: () => this.addBuiltInCharacter('purattokun'),
            addNezumi: () => this.addBuiltInCharacter('nezumi'),
            clearCharacters: () => this.clearAllCharacters()
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
     * プレビューエリアにSpineキャラクターを追加
     * @param {object} characterData - キャラクターデータ
     * @param {number} x - X座標
     * @param {number} y - Y座標
     */
    async addSpineCharacterToPreview(characterData, x, y) {
        try {
            console.log('🎭 addSpineCharacterToPreview呼び出し:', { characterData, x, y });
            this.uiManager.updateStatus('loading', 'Spineキャラクターを読み込み中...');
            
            // データ整合性チェック
            if (!characterData) {
                throw new Error('キャラクターデータが空です');
            }
            
            // 🔧 安定化修正: SpinePreviewLayer初期化完了を確認・待機
            if (this.spinePreviewLayer) {
                // 初期化完了チェック
                if (!this.spinePreviewLayer.isReadyForCharacters()) {
                    console.log('⏳ SpinePreviewLayer初期化完了を待機中...');
                    
                    // 短時間待機後に再チェック（最大3秒）
                    let waitCount = 0;
                    while (!this.spinePreviewLayer.isReadyForCharacters() && waitCount < 30) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        waitCount++;
                    }
                    
                    if (!this.spinePreviewLayer.isReadyForCharacters()) {
                        console.warn('⚠️ SpinePreviewLayer初期化待機タイムアウト');
                    }
                }
                console.log('🎭 v3パターンで直接Spine表示を試行中...');
                
                // 🔧 安定化修正: 初期化完了後にキャラクター追加
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
     * v3 Spine統合システム初期化
     */
    initializeV3SpineSystem() {
        try {
            console.log('🎮 シンプルSpine統合システム (v3ベース) 初期化開始');
            
            // シンプルSpineマネージャーV3が利用可能か確認
            if (window.simpleSpineManagerV3) {
                console.log('✅ SimpleSpineManagerV3統合完了');
                return;
            }
            
            // 最大5回まで再試行（無限ループ防止）
            if (!this.v3InitRetryCount) {
                this.v3InitRetryCount = 0;
            }
            
            if (this.v3InitRetryCount < 5) {
                this.v3InitRetryCount++;
                console.warn(`⚠️ SimpleSpineManagerV3未読み込み - 再試行 ${this.v3InitRetryCount}/5`);
                setTimeout(() => {
                    this.initializeV3SpineSystem();
                }, 1000);
            } else {
                console.error('❌ SimpleSpineManagerV3読み込み失敗 - 最大試行回数に達しました');
                // フォールバック: ダミーのマネージャーを作成
                this.createFallbackSpineManager();
            }
            
        } catch (error) {
            console.error('❌ シンプルSpine統合システム初期化エラー:', error);
        }
    }

    /**
     * フォールバックSpineマネージャー作成
     */
    createFallbackSpineManager() {
        console.log('📦 フォールバックシンプルSpineマネージャー作成中...');
        
        // グローバルにフォールバック関数を設定
        window.simpleSpineManagerV3 = {
            createBuiltInCharacter: async (characterName) => {
                console.warn(`⚠️ フォールバック: ${characterName}のダミー表示`);
                
                // ダミー要素作成
                const dummyElement = document.createElement('div');
                dummyElement.textContent = `🎭 ${characterName} (Dummy)`;
                dummyElement.style.cssText = `
                    position: absolute;
                    left: 50%;
                    top: 60%;
                    transform: translate(-50%, -50%);
                    background: rgba(255, 165, 0, 0.7);
                    padding: 15px;
                    border-radius: 8px;
                    color: white;
                    font-weight: bold;
                    z-index: 100;
                    border: 2px solid orange;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                `;
                
                // spine-stageに追加
                const spineStage = document.getElementById('spine-stage');
                if (spineStage) {
                    spineStage.appendChild(dummyElement);
                }
                
                return true;
            },
            clearAllCharacters: () => {
                const spineStage = document.getElementById('spine-stage');
                if (spineStage) {
                    spineStage.innerHTML = '';
                }
            }
        };
        
        console.log('✅ フォールバックシンプルSpineマネージャー作成完了');
    }

    /**
     * Spineフォルダ選択（v3移植）
     */
    async selectSpineFolder() {
        if (!window.electronAPI) {
            alert('Electron環境でのみ利用可能です');
            return;
        }
        
        try {
            this.uiManager.updateStatus('loading', 'フォルダ選択中...');
            
            const result = await window.electronAPI.fs.selectFolder();
            const folderPath = result?.canceled ? null : result?.filePaths?.[0];
            
            if (folderPath) {
                console.log('📁 選択されたフォルダ:', folderPath);
                await this.loadSpineProject(folderPath);
            } else {
                this.uiManager.updateStatus('ready', 'フォルダ選択がキャンセルされました');
            }
        } catch (error) {
            console.error('❌ フォルダ選択エラー:', error);
            this.uiManager.updateStatus('error', 'フォルダ選択エラー');
            alert('フォルダ選択に失敗しました: ' + error.message);
        }
    }

    /**
     * Spineプロジェクト読み込み（v3移植）
     */
    async loadSpineProject(folderPath) {
        try {
            console.log('📦 プロジェクト読み込み開始:', folderPath);
            
            this.uiManager.updateStatus('loading', 'プロジェクトを読み込み中...');
            
            // Spineファイルをスキャン
            const scanResult = await window.electronAPI.fs.scanDirectory(folderPath, ['.json', '.atlas', '.png']);
            
            console.log('🔍 scanResult:', scanResult);
            
            if (!scanResult.success) {
                throw new Error('フォルダの読み込みに失敗しました: ' + scanResult.error);
            }
            
            // Spineプロジェクトデータを構築  
            const projectData = this.buildSpineProjectData(folderPath, scanResult.files);
            
            if (!projectData || projectData.characters.length === 0) {
                throw new Error('有効なSpineファイルが見つかりませんでした');
            }
            
            // プロジェクト状態更新
            this.currentSpineProject = projectData;
            
            // UI更新
            this.displaySpineProjectInfo(projectData);
            
            this.uiManager.updateStatus('ready', `プロジェクト読み込み完了: ${projectData.characters.length}個のキャラクター`);
            console.log('✅ プロジェクト読み込み完了');
            
        } catch (error) {
            console.error('❌ プロジェクト読み込みエラー:', error);
            this.uiManager.updateStatus('error', 'プロジェクト読み込みエラー');
            alert('プロジェクトの読み込みに失敗しました: ' + error.message);
        }
    }

    /**
     * Spineプロジェクト情報表示（v3移植）
     */
    displaySpineProjectInfo(projectData) {
        try {
            console.log('📋 プロジェクト情報表示:', projectData);
            
            // Spineキャラクターリスト表示
            this.uiManager.showSpineCharacterList();
            
            // キャラクターリストを動的生成
            const characterList = this.uiManager.elements.spineCharacterList;
            characterList.innerHTML = '';
            
            projectData.characters.forEach((character, index) => {
                const characterItem = document.createElement('div');
                characterItem.className = 'character-item';
                characterItem.draggable = true;
                characterItem.innerHTML = `
                    <div class="character-info">
                        <span class="character-name">🎭 ${character.name}</span>
                        <span class="character-files">${character.files.length} files</span>
                    </div>
                `;
                
                // ドラッグ開始イベント
                characterItem.addEventListener('dragstart', (e) => {
                    const dragData = {
                        character: character,
                        sourceUI: 'spine-folder'
                    };
                    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
                    e.dataTransfer.effectAllowed = 'copy';
                    console.log('🎯 ドラッグ開始:', character.name);
                    console.log('🎯 ドラッグデータ:', dragData);
                });
                
                // デバッグ: クリックイベントも追加
                characterItem.addEventListener('click', () => {
                    console.log('🖱️ キャラクターアイテムクリック:', character.name);
                });
                
                characterList.appendChild(characterItem);
            });
            
            // ドロップゾーン設定
            console.log('🎯 ドロップゾーン設定開始...');
            this.setupCharacterDropZone();
            
            console.log('✅ プロジェクト情報表示完了');
            
        } catch (error) {
            console.error('❌ プロジェクト情報表示エラー:', error);
        }
    }

    /**
     * キャラクタードロップゾーン設定（v3移植）
     */
    setupCharacterDropZone() {
        const dropZone = document.getElementById('spine-character-container') || 
                         document.getElementById('spine-stage') ||
                         document.querySelector('.preview-content');
        
        if (!dropZone) {
            console.warn('⚠️ ドロップゾーンが見つかりません');
            console.log('🔍 利用可能な要素:', {
                spineCharacterContainer: !!document.getElementById('spine-character-container'),
                spineStage: !!document.getElementById('spine-stage'),
                previewContent: !!document.querySelector('.preview-content')
            });
            return;
        }
        
        console.log('✅ ドロップゾーン設定:', dropZone.id || dropZone.className);
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            console.log('💧 ドロップイベント発生!');
            
            try {
                const transferData = e.dataTransfer.getData('application/json');
                console.log('📋 転送データ:', transferData);
                
                if (!transferData) {
                    throw new Error('ドラッグデータが見つかりません');
                }
                
                const characterData = JSON.parse(transferData);
                console.log('🎯 キャラクタードロップ:', characterData);
                console.log('🔍 ドロップデータ詳細:', {
                    hasCharacter: !!characterData.character,
                    characterName: characterData.character?.name,
                    sourceUI: characterData.sourceUI,
                    rawData: characterData
                });
                
                // ドロップ位置計算
                const rect = dropZone.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                
                console.log('📐 ドロップ位置:', { x, y, clientX: e.clientX, clientY: e.clientY, rect });
                
                // キャラクター作成
                console.log('🎭 キャラクター作成開始...');
                await this.createSpineCharacterFromProject(characterData.character, x, y);
                console.log('🎭 キャラクター作成完了');
                
            } catch (error) {
                console.error('❌ キャラクタードロップエラー:', error);
                alert('ドロップエラー: ' + error.message);
            }
        });
        
        console.log('✅ ドロップゾーン設定完了');
    }

    /**
     * Spineプロジェクトデータ構築
     */
    buildSpineProjectData(folderPath, scanResult) {
        try {
            console.log('📋 Spineプロジェクトデータ構築開始:', { folderPath, scanResult });
            
            // キャラクター辞書を作成
            const characterMap = new Map();
            
            // scanResultの構造: { json: [], atlas: [], png: [], html: [] }
            const allFiles = [
                ...(scanResult.json || []),
                ...(scanResult.atlas || []),
                ...(scanResult.png || [])
            ];
            
            console.log('🔍 検出されたファイル:', allFiles);
            
            allFiles.forEach(filePath => {
                const fileName = filePath.split(/[/\\]/).pop();
                const baseName = fileName.replace(/\.(json|atlas|png)$/, '');
                const extension = fileName.split('.').pop();
                
                if (!characterMap.has(baseName)) {
                    characterMap.set(baseName, {
                        name: baseName,
                        files: [],
                        hasJson: false,
                        hasAtlas: false,
                        hasPng: false
                    });
                }
                
                const character = characterMap.get(baseName);
                character.files.push(filePath);
                
                if (extension === 'json') character.hasJson = true;
                if (extension === 'atlas') character.hasAtlas = true;
                if (extension === 'png') character.hasPng = true;
            });
            
            // 有効なSpineキャラクターのみ抽出（.json と .atlas が必要）
            const validCharacters = Array.from(characterMap.values())
                .filter(char => char.hasJson && char.hasAtlas)
                .map(char => ({
                    name: char.name,
                    files: char.files,
                    position: { x: 50, y: 50 },
                    scale: 1.0
                }));
            
            const projectData = {
                name: folderPath.split(/[/\\]/).pop(),
                path: folderPath,
                characters: validCharacters,
                timestamp: Date.now()
            };
            
            console.log('✅ Spineプロジェクトデータ構築完了:', projectData);
            return projectData;
            
        } catch (error) {
            console.error('❌ Spineプロジェクトデータ構築エラー:', error);
            throw error;
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
            this.uiManager.updateStatus('loading', `${characterData.name}を作成中...`);
            
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
                        
                        this.uiManager.updateStatus('ready', `🎭 ${characterData.name}を位置 (${x.toFixed(1)}%, ${y.toFixed(1)}%) に作成しました`);
                        console.log(`✅ プロジェクトキャラクター作成完了: ${characterData.name} at (${x}, ${y})`);
                    } else {
                        throw new Error('キャラクター作成に失敗しました');
                    }
                } else {
                    // 未知のキャラクターの場合はダミー表示
                    console.warn(`⚠️ 未知のキャラクター: ${characterName} - ダミー表示`);
                    this.uiManager.updateStatus('ready', `📦 ${characterData.name}をダミー表示しました`);
                    
                    // TODO: 実際のSpineファイルロード機能を実装
                    // const result = await this.loadCustomSpineCharacter(characterData, x, y);
                }
            } else {
                throw new Error('シンプルSpine統合システムが利用できません');
            }
            
        } catch (error) {
            console.error(`❌ プロジェクトキャラクター作成エラー: ${characterData.name}`, error);
            this.uiManager.updateStatus('error', `${characterData.name}作成失敗: ${error.message}`);
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
            this.uiManager.updateStatus('loading', `${characterName}を追加中...`);
            
            // シンプルSpineマネージャーV3を使用
            if (window.simpleSpineManagerV3) {
                const result = await window.simpleSpineManagerV3.createBuiltInCharacter(characterName);
                
                if (result) {
                    this.uiManager.updateStatus('ready', `🎭 ${characterName}を追加しました`);
                    console.log(`✅ 組み込みキャラクター追加完了: ${characterName}`);
                } else {
                    throw new Error('キャラクター作成に失敗しました');
                }
            } else {
                throw new Error('シンプルSpine統合システムが利用できません');
            }
            
        } catch (error) {
            console.error(`❌ 組み込みキャラクター追加エラー: ${characterName}`, error);
            this.uiManager.updateStatus('error', `${characterName}追加失敗: ${error.message}`);
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
                this.uiManager.updateStatus('ready', '🗑️ 全キャラクターを削除しました');
                console.log('✅ 全キャラクター削除完了');
            } else {
                throw new Error('シンプルSpine統合システムが利用できません');
            }
            
        } catch (error) {
            console.error('❌ 全キャラクター削除エラー:', error);
            this.uiManager.updateStatus('error', `削除失敗: ${error.message}`);
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
