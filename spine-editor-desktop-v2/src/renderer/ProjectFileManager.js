/**
 * ProjectFileManager.js
 * ファイル・フォルダ・プロジェクト管理専用モジュール
 * app.js から ファイル操作関連機能を分離
 */

export class ProjectFileManager {
    constructor(appCore) {
        this.appCore = appCore;
        this.currentSpineProject = null;
    }

    /**
     * プロジェクトフォルダを開く
     * app.js の openFolder() から移行
     */
    async openFolder() {
        this.appCore.uiManager.updateStatus('loading', 'フォルダを選択中...');
        
        try {
            const result = await this.appCore.projectLoader.openFolder();
            
            if (result.success) {
                this.appCore.currentProject = result.path;
                
                // プロジェクトファイルを処理
                const processedFiles = this.appCore.projectLoader.processProjectFiles(result.files);
                
                if (processedFiles.length === 0) {
                    this.appCore.previewManager.clearFileList();
                    this.appCore.uiManager.updateStatus('ready', 'HTMLファイルが見つかりませんでした');
                    return;
                }
                
                // アウトライナー方式で表示
                this.appCore.previewManager.renderOutlinerView(processedFiles, (file) => {
                    this.appCore.currentPage = file;
                });
                
                // ボタンを有効化
                this.appCore.uiManager.enableButtons();
                
                this.appCore.uiManager.updateStatus('ready', `プロジェクト読み込み完了: ${processedFiles.length} ファイル`);
                
            } else if (result.canceled) {
                this.appCore.uiManager.updateStatus('ready', result.message);
            } else {
                this.appCore.uiManager.updateStatus('error', result.error || result.message);
            }
        } catch (error) {
            console.error('❌ フォルダ選択エラー:', error);
            this.appCore.uiManager.updateStatus('error', 'フォルダ選択に失敗しました');
        }
    }

    /**
     * Spineフォルツ選択（v3移植）
     */
    async selectSpineFolder() {
        if (!window.electronAPI) {
            alert('Electron環境でのみ利用可能です');
            return;
        }
        
        try {
            this.appCore.uiManager.updateStatus('loading', 'フォルダ選択中...');
            
            const result = await window.electronAPI.fs.selectFolder();
            const folderPath = result?.canceled ? null : result?.filePaths?.[0];
            
            if (folderPath) {
                console.log('📁 選択されたフォルダ:', folderPath);
                await this.loadSpineProject(folderPath);
            } else {
                this.appCore.uiManager.updateStatus('ready', 'フォルダ選択がキャンセルされました');
            }
        } catch (error) {
            console.error('❌ フォルダ選択エラー:', error);
            this.appCore.uiManager.updateStatus('error', 'フォルダ選択エラー');
            alert('フォルダ選択に失敗しました: ' + error.message);
        }
    }

    /**
     * Spineプロジェクト読み込み（v3移植）
     */
    async loadSpineProject(folderPath) {
        try {
            console.log('📦 プロジェクト読み込み開始:', folderPath);
            
            this.appCore.uiManager.updateStatus('loading', 'プロジェクトを読み込み中...');
            
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
            
            this.appCore.uiManager.updateStatus('ready', `プロジェクト読み込み完了: ${projectData.characters.length}個のキャラクター`);
            console.log('✅ プロジェクト読み込み完了');
            
        } catch (error) {
            console.error('❌ プロジェクト読み込みエラー:', error);
            this.appCore.uiManager.updateStatus('error', 'プロジェクト読み込みエラー');
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
            this.appCore.uiManager.showSpineCharacterList();
            
            // キャラクターリストを動的生成
            const characterList = this.appCore.uiManager.elements.spineCharacterList;
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
                
                // ドラッグ開始イベント（軽量化版）
                characterItem.addEventListener('dragstart', (e) => {
                    // 軽量化: assetIdのみを転送
                    const assetId = character.id || character.name || `character-${Date.now()}`;
                    
                    e.dataTransfer.setData('text/plain', assetId);
                    e.dataTransfer.setData('application/x-spine-asset-id', assetId);
                    e.dataTransfer.setData('application/x-source-ui', 'spine-folder');
                    e.dataTransfer.effectAllowed = 'copy';
                    
                    console.log('🚀 軽量ドラッグ開始:', {
                        characterName: character.name,
                        assetId: assetId,
                        sourceUI: 'spine-folder'
                    });
                    
                    // アセットレジストリに登録（参照用）
                    if (window.assetRegistry && typeof window.assetRegistry.registerAsset === 'function') {
                        window.assetRegistry.registerAsset(assetId, character);
                        console.log('✅ AssetRegistry登録完了:', assetId);
                    } else {
                        console.warn('⚠️ AssetRegistryが利用できません:', assetId);
                    }
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
                // 軽量化ドロップデータ解析
                const assetId = e.dataTransfer.getData('application/x-spine-asset-id') || 
                               e.dataTransfer.getData('text/plain');
                const sourceUI = e.dataTransfer.getData('application/x-source-ui');
                
                if (!assetId) {
                    // レガシーフォーマットのフォールバック
                    const legacyData = e.dataTransfer.getData('application/json');
                    if (legacyData) {
                        const parsed = JSON.parse(legacyData);
                        const legacyAssetId = parsed.character?.id || parsed.id;
                        if (legacyAssetId) {
                            console.log('📋 レガシードロップデータ変換:', legacyAssetId);
                            return this.handleLightweightDrop(legacyAssetId, 'legacy', e, dropZone);
                        }
                    }
                    throw new Error('有効なドラッグデータが見つかりません');
                }
                
                console.log('💧 軽量ドロップ受信:', {
                    assetId: assetId,
                    sourceUI: sourceUI || 'unknown'
                });
                
                return this.handleLightweightDrop(assetId, sourceUI, e, dropZone);
                
            } catch (error) {
                console.error('❌ キャラクタードロップエラー:', error);
                alert('ドロップエラー: ' + error.message);
            }
        });
        
        console.log('✅ ドロップゾーン設定完了');
    }

    /**
     * 軽量化ドロップ処理
     * @param {string} assetId - アセットID
     * @param {string} sourceUI - ソースUI
     * @param {Event} e - ドロップイベント
     * @param {HTMLElement} dropZone - ドロップゾーン
     */
    async handleLightweightDrop(assetId, sourceUI, e, dropZone) {
        try {
            // アセットレジストリからキャラクターデータを取得
            const characterData = this.getCharacterDataByAssetId(assetId);
            
            if (!characterData) {
                throw new Error(`アセットID '${assetId}' に対応するキャラクターデータが見つかりません`);
            }
            
            // ドロップ位置計算
            const rect = dropZone.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            console.log('📜 軽量ドロップ位置:', { 
                assetId, 
                sourceUI, 
                position: { x, y }, 
                clientX: e.clientX, 
                clientY: e.clientY 
            });
            
            // キャラクター作成
            console.log('🎭 軽量キャラクター作成開始...');
            await this.appCore.spineDisplayController.createSpineCharacterFromProject(characterData, x, y);
            console.log('✅ 軽量キャラクター作成完了');
            
        } catch (error) {
            console.error('❌ 軽量ドロップエラー:', error);
            alert('軽量ドロップエラー: ' + error.message);
        }
    }

    /**
     * アセットIDでキャラクターデータを取得
     * @param {string} assetId - アセットID
     * @returns {object|null} キャラクターデータ
     */
    getCharacterDataByAssetId(assetId) {
        // アセットレジストリから取得
        if (window.assetRegistry && typeof window.assetRegistry.getAssetById === 'function') {
            const assetData = window.assetRegistry.getAssetById(assetId);
            if (assetData) return assetData;
        }
        
        // 現在のプロジェクトから検索
        if (this.appCore.currentProject && this.appCore.currentProject.spineCharacters) {
            return this.appCore.currentProject.spineCharacters.find(char => 
                char.id === assetId || char.name === assetId
            );
        }
        
        console.warn('⚠️ アセットIDが見つかりません:', assetId);
        return null;
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
     * プロジェクト状態の取得
     */
    getProjectState() {
        return {
            currentSpineProject: this.currentSpineProject,
            timestamp: Date.now()
        };
    }

    /**
     * プロジェクト状態のリセット
     */
    reset() {
        this.currentSpineProject = null;
        console.log('🔄 ProjectFileManager状態リセット完了');
    }
}
