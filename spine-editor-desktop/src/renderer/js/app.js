// 🎯 Spine Editor Desktop - Main Application Logic
// Phase 1: 最短MVP実装 - インポート→表示→編集→保存→エクスポート基本フロー

console.log('🚀 Spine Editor Desktop - Application 起動');

// ========== アプリケーション状態管理 ========== //
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
        
        this.initializeEventListeners();
        console.log('✅ SpineEditorApp 初期化完了');
    }

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
        document.getElementById('new-project')?.addEventListener('click', () => this.newProject());
        document.getElementById('open-project')?.addEventListener('click', () => this.openProject());
        document.getElementById('save-project')?.addEventListener('click', () => this.saveProject());
        
        // フォルダ選択
        document.getElementById('select-homepage')?.addEventListener('click', () => this.selectHomepageFolder());
        document.getElementById('select-spine')?.addEventListener('click', () => this.selectSpineFolder());
        
        // タイムライン制御
        document.getElementById('play-timeline')?.addEventListener('click', () => this.playTimeline());
        document.getElementById('stop-timeline')?.addEventListener('click', () => this.stopTimeline());
        
        // エクスポート
        document.getElementById('export-package')?.addEventListener('click', () => this.exportPackage());
        
        // プレビューコントロール
        document.getElementById('fit-view')?.addEventListener('click', () => this.fitView());
        document.getElementById('reset-view')?.addEventListener('click', () => this.resetView());
    }

    // Electronイベント
    bindElectronEvents() {
        if (typeof electronAPI !== 'undefined') {
            electronAPI.onProjectNew(() => this.newProject());
            electronAPI.onProjectOpen((event, filePath) => this.openProject(filePath));
            electronAPI.onProjectSave(() => this.saveProject());
            
            // プロフェッショナルダイアログイベント
            electronAPI.onShowOpenProjectDialog(() => this.showOpenProjectDialog());
            electronAPI.onShowSaveProjectDialog(() => this.showSaveProjectDialog());
            electronAPI.onShowExportDialog(() => this.showExportPackageDialog());
            
            electronAPI.onHomepageFolderSelected((event, folder) => this.setHomepageFolder(folder));
            electronAPI.onSpineFolderSelected((event, folder) => this.setSpineFolder(folder));
            electronAPI.onPackageExport(() => this.exportPackage());
        }
    }

    // パネルイベント
    bindPanelEvents() {
        // プロパティパネル
        this.bindPropertyEvents();
        
        // レイヤーパネル
        this.bindLayerEvents();
        
        // アウトライナー
        this.bindOutlinerEvents();
    }

    // プロパティイベント
    bindPropertyEvents() {
        const posX = document.getElementById('pos-x');
        const posY = document.getElementById('pos-y');
        const scale = document.getElementById('scale');
        const rotation = document.getElementById('rotation');
        const opacity = document.getElementById('opacity');
        
        if (posX) posX.addEventListener('input', (e) => this.updateCharacterProperty('x', parseFloat(e.target.value)));
        if (posY) posY.addEventListener('input', (e) => this.updateCharacterProperty('y', parseFloat(e.target.value)));
        if (scale) scale.addEventListener('input', (e) => this.updateCharacterProperty('scale', parseFloat(e.target.value)));
        if (rotation) rotation.addEventListener('input', (e) => this.updateCharacterProperty('rotation', parseFloat(e.target.value)));
        if (opacity) {
            opacity.addEventListener('input', (e) => {
                this.updateCharacterProperty('opacity', parseFloat(e.target.value));
                document.getElementById('opacity-value').textContent = Math.round(e.target.value * 100) + '%';
            });
        }
        
        // アニメーション選択
        const animSelect = document.getElementById('animation-select');
        if (animSelect) {
            animSelect.addEventListener('change', (e) => this.updateCharacterProperty('animation', e.target.value));
        }
    }

    // レイヤーイベント
    bindLayerEvents() {
        document.getElementById('add-layer')?.addEventListener('click', () => this.addLayer());
        document.getElementById('delete-layer')?.addEventListener('click', () => this.deleteLayer());
    }

    // アウトライナーイベント
    bindOutlinerEvents() {
        // 動的に追加される要素用のイベント委任
        document.getElementById('project-tree')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('character-item')) {
                this.selectCharacter(e.target.dataset.characterId);
            } else if (e.target.classList.contains('animation-item')) {
                this.previewAnimation(e.target.dataset.characterId, e.target.dataset.animation);
            }
        });
    }

    // キーボードショートカット
    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + キー の組み合わせ
            if (e.ctrlKey || e.metaKey) {
                switch (e.code) {
                    case 'KeyN': // 新規
                        e.preventDefault();
                        this.newProject();
                        break;
                    case 'KeyO': // 開く
                        e.preventDefault();
                        this.openProject();
                        break;
                    case 'KeyS': // 保存
                        e.preventDefault();
                        this.saveProject();
                        break;
                    case 'KeyE': // エクスポート
                        e.preventDefault();
                        this.exportPackage();
                        break;
                }
            }
            
            // 単体キー
            switch (e.code) {
                case 'Space': // 再生/停止
                    e.preventDefault();
                    this.togglePlayback();
                    break;
                case 'KeyF': // フィット表示
                    e.preventDefault();
                    this.fitView();
                    break;
                case 'Delete': // 削除
                case 'Backspace':
                    if (this.state.selectedCharacter) {
                        e.preventDefault();
                        this.deleteSelectedCharacter();
                    }
                    break;
            }
        });
    }

    // ========== プロジェクト管理 ========== //
    
    async newProject() {
        console.log('📝 新規プロジェクト作成');
        
        // 現在の状態をクリア
        this.state.project = {
            homePageFolder: null,
            spineCharactersFolder: null,
            name: 'Untitled Project',
            filePath: null
        };
        
        this.state.characters.clear();
        this.state.selectedCharacter = null;
        
        // UIを更新
        this.updateProjectStatus();
        this.updateOutliner();
        this.updateProperties();
        this.updateLayers();
        
        console.log('✅ 新規プロジェクト作成完了');
    }

    async openProject(filePath) {
        console.log('📂 プロジェクト読み込み:', filePath);
        
        try {
            // ファイルパスが指定されていない場合は選択ダイアログを表示
            if (!filePath && typeof electronAPI !== 'undefined') {
                const result = await electronAPI.showOpenDialog({
                    title: 'Spine Editor Projectファイルを選択',
                    filters: [
                        { name: 'Spine Editor Project', extensions: ['sep'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });
                
                if (result.success && result.filePath) {
                    filePath = result.filePath;
                } else {
                    console.log('📂 プロジェクト読み込みがキャンセルされました');
                    return false;
                }
            }
            
            if (!filePath) {
                console.error('❌ ファイルパスが指定されていません');
                this.showNotification('プロジェクトファイルが選択されていません', 'error');
                return false;
            }
            
            console.log('📂 プロジェクトファイル読み込み開始:', filePath);
            
            // プロジェクトファイルを読み込み
            const result = await electronAPI.readFile(filePath);
            if (!result || !result.success) {
                console.error('❌ プロジェクトファイル読み込み失敗:', result?.error);
                this.showNotification('プロジェクトファイルの読み込みに失敗しました', 'error');
                return false;
            }
            
            // JSONデータを解析
            let projectData;
            try {
                projectData = JSON.parse(result.content);
            } catch (parseError) {
                console.error('❌ プロジェクトファイルの解析に失敗:', parseError);
                this.showNotification('プロジェクトファイルの形式が不正です', 'error');
                return false;
            }
            
            // データ形式をバリデーション
            const validationResult = this.validateProjectData(projectData);
            if (!validationResult.valid) {
                console.error('❌ プロジェクトデータ検証失敗:', validationResult.errors);
                this.showNotification(`プロジェクトデータが不正です: ${validationResult.errors.join(', ')}`, 'error');
                return false;
            }
            
            // 既存状態をクリア
            await this.clearCurrentProject();
            
            // プロジェクト情報を復元
            this.restoreProjectInfo(projectData, filePath);
            
            // キャラクターデータを復元
            await this.restoreCharactersData(projectData);
            
            // UI状態を復元
            await this.restoreUIState(projectData);
            
            // Spine統合システムを初期化（キャラクターが存在する場合）
            if (this.state.characters.size > 0) {
                await this.initializeSpineIntegration();
            }
            
            // UI全体を更新
            this.updateAllUI();
            
            console.log('✅ プロジェクト読み込み完了:', this.state.project.name);
            this.showNotification(`プロジェクト「${this.state.project.name}」を読み込みました`, 'success');
            
            return true;
            
        } catch (error) {
            console.error('❌ プロジェクト読み込みエラー:', error);
            this.showNotification(`プロジェクトの読み込み中にエラーが発生しました: ${error.message}`, 'error');
            return false;
        }
    }

    async saveProject() {
        console.log('💾 プロジェクト保存');
        
        try {
            // placements.json形式でデータ作成
            const projectData = {
                version: "4.0",
                project: {
                    name: this.state.project.name || 'Untitled Project',
                    homePageFolder: this.state.project.homePageFolder,
                    spineCharactersFolder: this.state.project.spineCharactersFolder,
                    createdAt: this.state.project.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                characters: {},
                timeline: {
                    version: "1.0",
                    duration: this.state.ui.totalTime,
                    tracks: []
                }
            };
            
            // キャラクターデータを変換
            for (const [id, character] of this.state.characters) {
                projectData.characters[id] = {
                    position: { x: character.x || 18, y: character.y || 49 },
                    scale: character.scale || 0.55,
                    rotation: character.rotation || 0,
                    opacity: character.opacity || 1.0,
                    animation: character.animation || 'taiki',
                    visible: character.visible !== false,
                    locked: character.locked || false,
                    // 追加情報
                    folderPath: character.folderPath,
                    animations: character.animations || []
                };
            }
            
            console.log('📋 プロジェクトデータ:', projectData);
            
            // 現在のファイルパスがある場合は直接保存、ない場合はダイアログ表示
            let targetFilePath = this.state.project.filePath;
            
            if (!targetFilePath && typeof electronAPI !== 'undefined') {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
                const defaultName = `${this.state.project.name || 'spine-project'}-${timestamp}.sep`;
                
                const result = await electronAPI.showSaveDialog({
                    title: 'プロジェクトを保存',
                    filters: [
                        { name: 'Spine Editor Project', extensions: ['sep'] },
                        { name: 'All Files', extensions: ['*'] }
                    ],
                    defaultPath: defaultName
                });
                
                if (result.success && result.filePath) {
                    targetFilePath = result.filePath;
                } else {
                    console.log('💾 プロジェクト保存がキャンセルされました');
                    return false;
                }
            }
            
            if (targetFilePath && typeof electronAPI !== 'undefined') {
                return await this.saveProjectToFile(targetFilePath, projectData);
            } else {
                console.warn('⚠️ Electron API が利用できません');
                this.showNotification('保存機能が利用できません', 'warning');
                return false;
            }
            
        } catch (error) {
            console.error('❌ プロジェクト保存エラー:', error);
            this.showNotification('プロジェクトの保存中にエラーが発生しました', 'error');
            return false;
        }
    }
    
    // プロジェクトファイル保存の実際の処理
    async saveProjectToFile(filePath, projectData = null) {
        try {
            if (!projectData) {
                // プロジェクトデータを生成
                projectData = {
                    version: "4.0",
                    project: {
                        name: this.state.project.name || 'Untitled Project',
                        homePageFolder: this.state.project.homePageFolder,
                        spineCharactersFolder: this.state.project.spineCharactersFolder,
                        createdAt: this.state.project.createdAt || new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    characters: {},
                    timeline: {
                        version: "1.0",
                        duration: this.state.ui.totalTime,
                        tracks: []
                    }
                };
                
                // キャラクターデータを変換
                for (const [id, character] of this.state.characters) {
                    projectData.characters[id] = {
                        position: { x: character.x || 18, y: character.y || 49 },
                        scale: character.scale || 0.55,
                        rotation: character.rotation || 0,
                        opacity: character.opacity || 1.0,
                        animation: character.animation || 'taiki',
                        visible: character.visible !== false,
                        locked: character.locked || false,
                        folderPath: character.folderPath,
                        animations: character.animations || []
                    };
                }
            }
            
            const jsonContent = JSON.stringify(projectData, null, 2);
            const saveResult = await electronAPI.saveFile(filePath, jsonContent);
            
            if (saveResult.success) {
                this.state.project.filePath = filePath;
                this.state.project.name = this.extractProjectName(filePath);
                
                console.log('✅ プロジェクト保存成功:', filePath);
                this.updateProjectStatus();
                this.showNotification('プロジェクトを保存しました', 'success');
                
                return true;
            } else {
                console.error('❌ プロジェクト保存失敗:', saveResult.error);
                this.showNotification('プロジェクトの保存に失敗しました', 'error');
                return false;
            }
            
        } catch (error) {
            console.error('❌ プロジェクトファイル保存エラー:', error);
            this.showNotification(`プロジェクト保存エラー: ${error.message}`, 'error');
            return false;
        }
    }
    
    // パッケージエクスポートの実際の処理
    async exportPackageToFile(filePath) {
        try {
            // パッケージエクスポートマネージャー確認
            if (typeof DesktopPackageExportManager === 'undefined') {
                console.error('❌ DesktopPackageExportManager が利用できません');
                this.showNotification('エクスポート機能が利用できません', 'error');
                return false;
            }
            
            // パッケージエクスポートマネージャー作成・実行
            const exportManager = new DesktopPackageExportManager(this);
            const success = await exportManager.exportPackageToPath(filePath);
            
            if (success) {
                console.log('✅ パッケージエクスポート完了:', filePath);
                this.showNotification('パッケージをエクスポートしました', 'success');
                return true;
            } else {
                console.error('❌ パッケージエクスポート失敗');
                this.showNotification('パッケージのエクスポートに失敗しました', 'error');
                return false;
            }
            
        } catch (error) {
            console.error('❌ パッケージエクスポートファイルエラー:', error);
            this.showNotification(`エクスポートエラー: ${error.message}`, 'error');
            return false;
        }
    }

    // ========== フォルダ選択・VFS ========== //
    
    async selectHomepageFolder() {
        console.log('🏠 ホームページフォルダ選択');
        
        if (typeof electronAPI === 'undefined') {
            console.error('❌ Electron API が利用できません');
            return;
        }
        
        try {
            const folder = await electronAPI.selectFolder({
                title: 'ホームページフォルダを選択'
            });
            
            if (folder) {
                this.setHomepageFolder(folder);
            }
        } catch (error) {
            console.error('❌ フォルダ選択エラー:', error);
        }
    }

    async selectSpineFolder() {
        console.log('🎯 Spineキャラクターフォルダ選択');
        
        if (typeof electronAPI === 'undefined') {
            console.error('❌ Electron API が利用できません');
            return;
        }
        
        try {
            const folder = await electronAPI.selectFolder({
                title: 'Spineキャラクターフォルダを選択'
            });
            
            if (folder) {
                this.setSpineFolder(folder);
            }
        } catch (error) {
            console.error('❌ フォルダ選択エラー:', error);
        }
    }

    async setHomepageFolder(folder) {
        console.log('🏠 ホームページフォルダ設定:', folder);
        this.state.project.homePageFolder = folder;
        this.updateProjectStatus();
    }

    async setSpineFolder(folder) {
        console.log('🎯 Spineフォルダ設定:', folder);
        this.state.project.spineCharactersFolder = folder;
        
        // Spineキャラクターを自動検出
        await this.detectSpineCharacters();
        
        // Spine統合システム初期化
        if (this.state.characters.size > 0) {
            await this.initializeSpineIntegration();
        }
        
        this.updateProjectStatus();
        this.updateOutliner();
    }

    // Spineキャラクター自動検出
    async detectSpineCharacters() {
        console.log('🔍 Spineキャラクター自動検出開始');
        
        if (!this.state.project.spineCharactersFolder || typeof spineAPI === 'undefined') {
            return;
        }
        
        try {
            const items = await electronAPI.listDirectory(this.state.project.spineCharactersFolder);
            
            for (const item of items) {
                if (item.isDirectory) {
                    // characters/<characterName>/ の構造をチェック
                    const characterPath = item.path;
                    const characterName = item.name;
                    
                    const analysis = await spineAPI.analyzeSpineStructure(characterPath);
                    if (analysis.success && analysis.spineFiles.json && analysis.spineFiles.atlas) {
                        console.log(`✅ 検出: ${characterName}`, analysis.spineFiles);
                        
                        // キャラクターデータを作成
                        const characterData = {
                            id: characterName,
                            name: characterName,
                            folderPath: characterPath,
                            spineFiles: analysis.spineFiles,
                            x: 18, y: 49, scale: 0.55, rotation: 0, opacity: 1.0,
                            animation: 'taiki',
                            visible: true,
                            locked: false,
                            animations: [] // JSONから取得予定
                        };
                        
                        this.state.characters.set(characterName, characterData);
                        
                        // Spine JSONからアニメーション一覧を取得
                        await this.loadCharacterAnimations(characterName);
                    }
                }
            }
            
            console.log(`✅ Spineキャラクター検出完了: ${this.state.characters.size}体`);
            
        } catch (error) {
            console.error('❌ Spineキャラクター検出エラー:', error);
        }
    }

    // キャラクターのアニメーション一覧を読み込み
    async loadCharacterAnimations(characterId) {
        const character = this.state.characters.get(characterId);
        if (!character || !character.spineFiles.json) return;
        
        try {
            const result = await electronAPI.readFile(character.spineFiles.json);
            if (result.success) {
                const spineData = JSON.parse(result.content);
                if (spineData.animations) {
                    character.animations = Object.keys(spineData.animations);
                    console.log(`📋 ${characterId} アニメーション:`, character.animations);
                }
            }
        } catch (error) {
            console.error(`❌ ${characterId} アニメーション読み込みエラー:`, error);
        }
    }

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
                this.updatePreviewDisplay();
                
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

    // プレビュー表示更新
    updatePreviewDisplay() {
        const previewCanvas = document.getElementById('preview-canvas');
        if (previewCanvas) {
            // プレースホルダーを非表示にしてSpineコンテンツを表示
            const placeholder = previewCanvas.querySelector('.canvas-placeholder');
            if (placeholder && this.state.characters.size > 0) {
                placeholder.style.display = 'none';
            }
        }
        
        // ズーム情報更新
        const zoomLevel = document.querySelector('.zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = Math.round(this.state.ui.zoomLevel * 100) + '%';
        }
    }

    // ========== UI更新 ========== //
    
    updateProjectStatus() {
        const statusEl = document.getElementById('project-status');
        if (!statusEl) return;
        
        const { project } = this.state;
        let status = 'プロジェクト未設定';
        
        if (project.name) {
            status = project.name;
            if (project.homePageFolder && project.spineCharactersFolder) {
                status += ' (設定完了)';
            } else if (project.homePageFolder || project.spineCharactersFolder) {
                status += ' (設定中...)';
            } else {
                status += ' (未設定)';
            }
        }
        
        statusEl.textContent = status;
    }

    updateOutliner() {
        const treeEl = document.getElementById('project-tree');
        if (!treeEl) return;
        
        // 既存コンテンツをクリア
        treeEl.innerHTML = '';
        
        if (this.state.characters.size === 0) {
            treeEl.innerHTML = `
                <div class="tree-item welcome-message">
                    <span>🎯 プロジェクトフォルダを選択してください</span>
                    <br><br>
                    <small>
                    1. 「🏠 ホームページ」ボタンでWebサイトのルートフォルダを選択<br>
                    2. 「🎯 Spine」ボタンでキャラクターフォルダを選択
                    </small>
                </div>
            `;
            return;
        }
        
        // プロジェクト階層を構築
        const projectRoot = document.createElement('div');
        projectRoot.className = 'tree-item project-root';
        projectRoot.innerHTML = `📁 ${this.state.project.name || 'Project'}`;
        treeEl.appendChild(projectRoot);
        
        // キャラクター一覧
        const charactersRoot = document.createElement('div');
        charactersRoot.className = 'tree-item characters-root';
        charactersRoot.innerHTML = `📚 Characters (${this.state.characters.size})`;
        treeEl.appendChild(charactersRoot);
        
        // 各キャラクター
        for (const [id, character] of this.state.characters) {
            const charEl = document.createElement('div');
            charEl.className = 'tree-item character-item';
            charEl.dataset.characterId = id;
            charEl.innerHTML = `🎭 ${character.name}`;
            
            if (this.state.selectedCharacter === id) {
                charEl.classList.add('selected');
            }
            
            treeEl.appendChild(charEl);
            
            // アニメーション一覧（展開時）
            if (character.animations.length > 0) {
                for (const anim of character.animations) {
                    const animEl = document.createElement('div');
                    animEl.className = 'tree-item animation-item';
                    animEl.dataset.characterId = id;
                    animEl.dataset.animation = anim;
                    animEl.innerHTML = `　🎬 ${anim}`;
                    animEl.style.marginLeft = '20px';
                    treeEl.appendChild(animEl);
                }
            }
        }
    }

    updateProperties() {
        const character = this.state.selectedCharacter ? 
            this.state.characters.get(this.state.selectedCharacter) : null;
        
        // トランスフォームセクション
        const transformSection = document.getElementById('transform-section');
        const animationSection = document.getElementById('animation-section');
        
        if (character) {
            // プロパティ値を設定
            this.setPropertyValue('pos-x', character.x);
            this.setPropertyValue('pos-y', character.y);
            this.setPropertyValue('scale', character.scale);
            this.setPropertyValue('rotation', character.rotation);
            this.setPropertyValue('opacity', character.opacity);
            
            // アニメーション選択肢を更新
            const animSelect = document.getElementById('animation-select');
            if (animSelect && character.animations) {
                animSelect.innerHTML = '<option value="">選択してください</option>';
                for (const anim of character.animations) {
                    const option = document.createElement('option');
                    option.value = anim;
                    option.textContent = anim;
                    option.selected = anim === character.animation;
                    animSelect.appendChild(option);
                }
            }
            
            // セクション表示
            if (transformSection) {
                transformSection.style.display = 'block';
                transformSection.querySelectorAll('input, select').forEach(el => el.disabled = false);
            }
            if (animationSection) {
                animationSection.style.display = 'block';
                animationSection.querySelectorAll('input, select').forEach(el => el.disabled = false);
            }
            
            // 選択情報表示
            const noSelection = document.querySelector('.no-selection');
            if (noSelection) {
                noSelection.textContent = `${character.name} が選択されています`;
            }
            
        } else {
            // 未選択状態
            if (transformSection) {
                transformSection.style.display = 'none';
            }
            if (animationSection) {
                animationSection.style.display = 'none';
            }
            
            const noSelection = document.querySelector('.no-selection');
            if (noSelection) {
                noSelection.textContent = 'キャラクターが選択されていません';
            }
        }
        
        // 不透明度表示更新
        const opacityValue = document.getElementById('opacity-value');
        if (opacityValue && character) {
            opacityValue.textContent = Math.round((character.opacity || 1.0) * 100) + '%';
        }
    }

    updateLayers() {
        const layersEl = document.getElementById('layers-list');
        if (!layersEl) return;
        
        layersEl.innerHTML = '';
        
        if (this.state.characters.size === 0) {
            layersEl.innerHTML = `
                <div class="layer-item placeholder">
                    <span>レイヤーがありません</span>
                    <small>キャラクターを追加するとレイヤーが作成されます</small>
                </div>
            `;
            return;
        }
        
        // キャラクター順序でレイヤー表示
        for (const [id, character] of this.state.characters) {
            const layerEl = document.createElement('div');
            layerEl.className = 'layer-item';
            layerEl.dataset.characterId = id;
            
            if (this.state.selectedCharacter === id) {
                layerEl.classList.add('selected');
            }
            
            layerEl.innerHTML = `
                <span class="layer-visibility" data-character="${id}">👁️</span>
                <span class="layer-lock" data-character="${id}">🔓</span>
                <span class="layer-name">${character.name}</span>
            `;
            
            layersEl.appendChild(layerEl);
        }
    }

    // ========== ユーティリティ関数 ========== //
    
    setPropertyValue(elementId, value) {
        const el = document.getElementById(elementId);
        if (el && value !== undefined) {
            el.value = value;
        }
    }

    updateCharacterProperty(property, value) {
        if (!this.state.selectedCharacter) return;
        
        const character = this.state.characters.get(this.state.selectedCharacter);
        if (character) {
            character[property] = value;
            console.log(`📐 ${this.state.selectedCharacter}.${property} = ${value}`);
            
            // プレビュー更新（後で実装）
            this.updatePreview();
        }
    }

    selectCharacter(characterId) {
        console.log('🎯 キャラクター選択:', characterId);
        this.state.selectedCharacter = characterId;
        
        // Spine統合マネージャーに通知
        if (this.spineIntegration) {
            this.spineIntegration.onCharacterSelected(characterId);
        }
        
        this.updateOutliner();
        this.updateProperties();
        this.updateLayers();
    }

    // その他の未実装関数（Phase 1では基本実装）
    previewAnimation(characterId, animation) {
        console.log('🎬 アニメーションプレビュー:', characterId, animation);
    }

    playTimeline() {
        console.log('▶️ タイムライン再生');
        this.state.ui.isPlaying = !this.state.ui.isPlaying;
        const btn = document.getElementById('play-timeline');
        if (btn) {
            btn.textContent = this.state.ui.isPlaying ? '⏸️ 一時停止' : '▶️ 再生';
        }
    }

    stopTimeline() {
        console.log('⏹️ タイムライン停止');
        this.state.ui.isPlaying = false;
        this.state.ui.currentTime = 0;
        const btn = document.getElementById('play-timeline');
        if (btn) {
            btn.textContent = '▶️ 再生';
        }
    }

    togglePlayback() {
        this.playTimeline();
    }

    fitView() {
        console.log('🔍 ビューフィット');
    }

    resetView() {
        console.log('🎯 ビューリセット');
    }

    updatePreview() {
        console.log('🖼️ プレビュー更新');
        // Phase 1では基本実装
    }

    addLayer() {
        console.log('➕ レイヤー追加');
    }

    deleteLayer() {
        console.log('🗑️ レイヤー削除');
    }

    deleteSelectedCharacter() {
        if (this.state.selectedCharacter) {
            console.log('🗑️ 選択キャラクター削除:', this.state.selectedCharacter);
        }
    }

    async exportPackage() {
        console.log('📦 パッケージエクスポート');
        
        // レンダラープロセスにエクスポートダイアログ表示イベントを送信
        // ダイアログ処理は showExportPackageDialog() で実行される
        return await this.showExportPackageDialog();
    }

    // ========== ヘルパー関数 ========== //

    // プロフェッショナル保存ダイアログ（プロジェクト専用）
    async showSaveProjectDialog() {
        if (typeof electronAPI === 'undefined') return null;
        
        try {
            console.log('💾 プロジェクト保存ダイアログ表示');
            
            // 履歴付きダイアログを表示
            const recentFiles = await this.getFileHistoryWithPreview('project');
            
            // 保存ダイアログオプション設定
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const defaultName = `${this.state.project.name || 'spine-project'}-${timestamp}.sep`;
            
            const result = await electronAPI.showSaveDialog({
                title: 'プロジェクトを保存',
                filters: [
                    { name: 'Spine Editor Project', extensions: ['sep'] },
                    { name: 'All Files', extensions: ['*'] }
                ],
                defaultPath: defaultName
            });
            
            if (result.success && result.filePath) {
                // 実際の保存処理を実行
                return await this.saveProjectToFile(result.filePath);
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ プロジェクト保存ダイアログエラー:', error);
            this.showNotification('プロジェクト保存ダイアログでエラーが発生しました', 'error');
            return false;
        }
    }
    
    // プロフェッショナル開くダイアログ（プロジェクト専用）
    async showOpenProjectDialog() {
        if (typeof electronAPI === 'undefined') return null;
        
        try {
            console.log('📂 プロジェクト開くダイアログ表示');
            
            // 履歴付きダイアログを表示
            const recentFiles = await this.getFileHistoryWithPreview('project');
            
            const result = await electronAPI.showOpenDialog({
                title: 'プロジェクトを開く',
                filters: [
                    { name: 'Spine Editor Project', extensions: ['sep'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });
            
            if (result.success && result.filePath) {
                return await this.openProject(result.filePath);
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ プロジェクト開くダイアログエラー:', error);
            this.showNotification('プロジェクト開くダイアログでエラーが発生しました', 'error');
            return false;
        }
    }
    
    // プロフェッショナルエクスポートダイアログ
    async showExportPackageDialog() {
        if (typeof electronAPI === 'undefined') return null;
        
        try {
            console.log('📦 パッケージエクスポートダイアログ表示');
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const defaultName = `${this.state.project.name || 'spine-package'}-${timestamp}.zip`;
            
            const result = await electronAPI.showExportDialog({
                title: 'パッケージをエクスポート',
                filters: [
                    { name: 'ZIP Archive', extensions: ['zip'] },
                    { name: 'All Files', extensions: ['*'] }
                ],
                defaultPath: defaultName
            });
            
            if (result.success && result.filePath) {
                return await this.exportPackageToFile(result.filePath);
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ パッケージエクスポートダイアログエラー:', error);
            this.showNotification('パッケージエクスポートダイアログでエラーが発生しました', 'error');
            return false;
        }
    }

    // Phase 2強化：履歴付きファイル情報取得（プロフェッショナル版）
    async getFileHistoryWithPreview(type = 'project') {
        if (typeof electronAPI === 'undefined') return [];
        
        try {
            console.log(`📋 Phase 2履歴取得開始: ${type}`);
            
            // Phase 2: Main processで強化された履歴情報を直接取得
            const enhancedHistory = await electronAPI.getFileHistory(type);
            
            // Phase 2: 既に詳細情報が含まれているため、追加処理は最小限
            const processedHistory = enhancedHistory.map(item => {
                // Phase 2: Dialog Utils APIを使用して表示用文字列を生成
                if (typeof dialogUtilsAPI !== 'undefined') {
                    return {
                        ...item,
                        displaySize: item.sizeFormatted || dialogUtilsAPI.formatFileSize(item.size || 0),
                        displayDate: item.modifiedFormatted || dialogUtilsAPI.formatDate(item.modified),
                        displayIcon: dialogUtilsAPI.getFileTypeIcon(item.extension, item.type),
                        displayStatus: dialogUtilsAPI.generateStatusBadge(item),
                        displaySummary: item.preview ? dialogUtilsAPI.generateProjectSummary(item.preview) : null
                    };
                }
                
                return item;
            });
            
            console.log(`✅ Phase 2履歴取得完了: ${processedHistory.length}件`);
            return processedHistory;
            
        } catch (error) {
            console.error('❌ Phase 2履歴取得エラー:', error);
            return [];
        }
    }
    
    // Phase 2追加：関連ファイル表示機能
    async showRelatedFiles(filePath) {
        if (typeof electronAPI === 'undefined') return;
        
        try {
            const relatedFiles = await electronAPI.findRelatedFiles(filePath);
            
            if (relatedFiles.length > 0) {
                console.log(`🔗 関連ファイル発見: ${relatedFiles.length}件`, relatedFiles);
                
                // 将来的にはUIに表示予定
                // Phase 3でリレーションシップビューを実装予定
            }
        } catch (error) {
            console.error('❌ 関連ファイル検索エラー:', error);
        }
    }

    // プロジェクトデータバリデーション
    validateProjectData(projectData) {
        const errors = [];
        
        try {
            // 基本構造チェック
            if (!projectData || typeof projectData !== 'object') {
                errors.push('プロジェクトデータが不正です');
                return { valid: false, errors };
            }
            
            // バージョンチェック
            if (!projectData.version) {
                errors.push('バージョン情報がありません');
            } else {
                const version = parseFloat(projectData.version);
                if (isNaN(version) || version < 1.0 || version > 5.0) {
                    errors.push(`サポートされていないバージョンです: ${projectData.version}`);
                }
            }
            
            // プロジェクト情報チェック
            if (!projectData.project || typeof projectData.project !== 'object') {
                errors.push('プロジェクト情報がありません');
            } else {
                const project = projectData.project;
                
                if (!project.name || typeof project.name !== 'string') {
                    errors.push('プロジェクト名が不正です');
                }
                
                // フォルダパスは省略可能だが、文字列である必要がある
                if (project.homePageFolder && typeof project.homePageFolder !== 'string') {
                    errors.push('ホームページフォルダパスが不正です');
                }
                
                if (project.spineCharactersFolder && typeof project.spineCharactersFolder !== 'string') {
                    errors.push('Spineキャラクターフォルダパスが不正です');
                }
                
                // 日付は省略可能
                if (project.createdAt && typeof project.createdAt !== 'string') {
                    errors.push('作成日時が不正です');
                }
                
                if (project.updatedAt && typeof project.updatedAt !== 'string') {
                    errors.push('更新日時が不正です');
                }
            }
            
            // キャラクターデータチェック
            if (!projectData.characters) {
                // キャラクターデータは省略可能
                projectData.characters = {};
            } else if (typeof projectData.characters !== 'object') {
                errors.push('キャラクターデータが不正です');
            } else {
                // 各キャラクターデータを検証
                for (const [characterId, characterData] of Object.entries(projectData.characters)) {
                    if (!characterData || typeof characterData !== 'object') {
                        errors.push(`キャラクター "${characterId}" のデータが不正です`);
                        continue;
                    }
                    
                    // 位置情報チェック
                    if (characterData.position) {
                        const pos = characterData.position;
                        if (typeof pos.x !== 'number' || typeof pos.y !== 'number') {
                            errors.push(`キャラクター "${characterId}" の位置データが不正です`);
                        }
                    }
                    
                    // 数値プロパティチェック
                    if (characterData.scale !== undefined && typeof characterData.scale !== 'number') {
                        errors.push(`キャラクター "${characterId}" のスケールが不正です`);
                    }
                    
                    if (characterData.rotation !== undefined && typeof characterData.rotation !== 'number') {
                        errors.push(`キャラクター "${characterId}" の回転が不正です`);
                    }
                    
                    if (characterData.opacity !== undefined && 
                        (typeof characterData.opacity !== 'number' || characterData.opacity < 0 || characterData.opacity > 1)) {
                        errors.push(`キャラクター "${characterId}" の透明度が不正です`);
                    }
                    
                    // 文字列プロパティチェック
                    if (characterData.animation && typeof characterData.animation !== 'string') {
                        errors.push(`キャラクター "${characterId}" のアニメーション名が不正です`);
                    }
                    
                    // ブール値プロパティチェック
                    if (characterData.visible !== undefined && typeof characterData.visible !== 'boolean') {
                        errors.push(`キャラクター "${characterId}" の表示フラグが不正です`);
                    }
                    
                    if (characterData.locked !== undefined && typeof characterData.locked !== 'boolean') {
                        errors.push(`キャラクター "${characterId}" のロックフラグが不正です`);
                    }
                    
                    // アニメーション配列チェック
                    if (characterData.animations && !Array.isArray(characterData.animations)) {
                        errors.push(`キャラクター "${characterId}" のアニメーション一覧が不正です`);
                    }
                }
            }
            
            // タイムラインデータチェック（省略可能）
            if (projectData.timeline) {
                if (typeof projectData.timeline !== 'object') {
                    errors.push('タイムラインデータが不正です');
                } else {
                    const timeline = projectData.timeline;
                    
                    if (timeline.duration !== undefined && typeof timeline.duration !== 'number') {
                        errors.push('タイムライン継続時間が不正です');
                    }
                    
                    if (timeline.tracks && !Array.isArray(timeline.tracks)) {
                        errors.push('タイムライントラックが不正です');
                    }
                }
            }
            
        } catch (validationError) {
            errors.push(`バリデーション処理エラー: ${validationError.message}`);
        }
        
        const valid = errors.length === 0;
        
        if (valid) {
            console.log('✅ プロジェクトデータバリデーション成功');
        } else {
            console.log('❌ プロジェクトデータバリデーション失敗:', errors);
        }
        
        return { valid, errors };
    }

    // 現在のプロジェクトをクリア
    async clearCurrentProject() {
        console.log('🧹 現在のプロジェクト状態をクリア');
        
        try {
            // Spine統合システムのクリーンアップ
            if (this.spineIntegration) {
                await this.spineIntegration.cleanup();
                this.spineIntegration = null;
            }
            
            // 状態をリセット
            this.state.project = {
                homePageFolder: null,
                spineCharactersFolder: null,
                name: null,
                filePath: null
            };
            
            this.state.characters.clear();
            this.state.selectedCharacter = null;
            
            this.state.ui = {
                isPlaying: false,
                currentTime: 0,
                totalTime: 10000,
                zoomLevel: 1.0
            };
            
            // VFSキャッシュをクリア
            this.state.vfs.blobCache.clear();
            this.state.vfs.characterAssets.clear();
            
            console.log('✅ プロジェクト状態クリア完了');
            
        } catch (error) {
            console.error('❌ プロジェクト状態クリア中にエラー:', error);
            throw error;
        }
    }

    // プロジェクト情報を復元
    restoreProjectInfo(projectData, filePath) {
        console.log('📋 プロジェクト情報復元開始');
        
        try {
            const project = projectData.project || {};
            
            this.state.project = {
                name: project.name || 'Untitled Project',
                homePageFolder: project.homePageFolder || null,
                spineCharactersFolder: project.spineCharactersFolder || null,
                filePath: filePath,
                createdAt: project.createdAt || null,
                updatedAt: project.updatedAt || null
            };
            
            // UI状態の一部を復元
            if (projectData.timeline && projectData.timeline.duration) {
                this.state.ui.totalTime = projectData.timeline.duration;
            }
            
            console.log('✅ プロジェクト情報復元完了:', this.state.project.name);
            
        } catch (error) {
            console.error('❌ プロジェクト情報復元エラー:', error);
            throw error;
        }
    }

    // キャラクターデータを復元
    async restoreCharactersData(projectData) {
        console.log('🎭 キャラクターデータ復元開始');
        
        try {
            const characters = projectData.characters || {};
            
            for (const [characterId, characterData] of Object.entries(characters)) {
                console.log(`📂 キャラクター復元: ${characterId}`);
                
                // キャラクターデータを正規化
                const restoredCharacter = {
                    id: characterId,
                    name: characterId,
                    // 位置情報
                    x: characterData.position ? characterData.position.x : 18,
                    y: characterData.position ? characterData.position.y : 49,
                    // トランスフォーム
                    scale: characterData.scale !== undefined ? characterData.scale : 0.55,
                    rotation: characterData.rotation !== undefined ? characterData.rotation : 0,
                    opacity: characterData.opacity !== undefined ? characterData.opacity : 1.0,
                    // アニメーション
                    animation: characterData.animation || 'taiki',
                    animations: characterData.animations || [],
                    // 状態フラグ
                    visible: characterData.visible !== false,
                    locked: characterData.locked || false,
                    // ファイルパス（保存されていた場合）
                    folderPath: characterData.folderPath || null,
                    spineFiles: characterData.spineFiles || null
                };
                
                // キャラクターをMapに登録
                this.state.characters.set(characterId, restoredCharacter);
                
                // Spineファイルが指定されていない場合、フォルダから自動検出を試行
                if (!restoredCharacter.spineFiles && this.state.project.spineCharactersFolder) {
                    await this.tryRestoreSpineFiles(characterId, restoredCharacter);
                }
                
                // アニメーション一覧が空の場合、Spineファイルから読み込み
                if (restoredCharacter.animations.length === 0 && restoredCharacter.spineFiles) {
                    await this.loadCharacterAnimations(characterId);
                }
            }
            
            console.log(`✅ キャラクターデータ復元完了: ${this.state.characters.size}体`);
            
        } catch (error) {
            console.error('❌ キャラクターデータ復元エラー:', error);
            throw error;
        }
    }

    // Spineファイル自動検出を試行
    async tryRestoreSpineFiles(characterId, character) {
        try {
            if (!this.state.project.spineCharactersFolder) {
                return;
            }
            
            // Electron APIを使用してファイル構造を確認
            if (typeof electronAPI !== 'undefined') {
                // characters/<characterName>/ の構造を仮定
                const characterPath = `${this.state.project.spineCharactersFolder}/${characterId}`;
                
                try {
                    const items = await electronAPI.listDirectory(characterPath);
                    
                    // Spineファイルを検出
                    let jsonFile = null, atlasFile = null;
                    for (const item of items) {
                        if (!item.isDirectory) {
                            if (item.name.endsWith('.json')) {
                                jsonFile = item.path;
                            } else if (item.name.endsWith('.atlas')) {
                                atlasFile = item.path;
                            }
                        }
                    }
                    
                    if (jsonFile && atlasFile) {
                        character.folderPath = characterPath;
                        character.spineFiles = {
                            json: jsonFile,
                            atlas: atlasFile
                        };
                        console.log(`✅ ${characterId} のSpineファイルを自動検出:`, character.spineFiles);
                    }
                } catch (dirError) {
                    console.warn(`⚠️ ${characterId} のディレクトリ確認に失敗:`, dirError);
                }
            }
            
            // spineAPI が利用可能な場合の高度な解析
            if (typeof spineAPI !== 'undefined' && character.folderPath) {
                const analysis = await spineAPI.analyzeSpineStructure(character.folderPath);
                if (analysis.success && analysis.spineFiles.json && analysis.spineFiles.atlas) {
                    character.spineFiles = analysis.spineFiles;
                    console.log(`✅ ${characterId} のSpineファイル詳細解析完了:`, analysis.spineFiles);
                }
            }
            
        } catch (error) {
            console.warn(`⚠️ ${characterId} のSpineファイル自動検出に失敗:`, error);
        }
    }

    // UI状態を復元
    async restoreUIState(projectData) {
        console.log('🖥️ UI状態復元開始');
        
        try {
            // 最初のキャラクターを選択状態にする（存在する場合）
            if (this.state.characters.size > 0) {
                const firstCharacterId = this.state.characters.keys().next().value;
                this.state.selectedCharacter = firstCharacterId;
                console.log('🎯 初期選択キャラクター:', firstCharacterId);
            }
            
            // タイムライン状態の復元
            if (projectData.timeline) {
                if (projectData.timeline.duration) {
                    this.state.ui.totalTime = projectData.timeline.duration;
                }
                // その他のタイムライン状態があれば復元
            }
            
            console.log('✅ UI状態復元完了');
            
        } catch (error) {
            console.error('❌ UI状態復元エラー:', error);
            // UI状態の復元エラーは致命的ではないので、エラーをログに記録するだけ
        }
    }

    // UI全体を更新
    updateAllUI() {
        console.log('🔄 UI全体更新開始');
        
        try {
            this.updateProjectStatus();
            this.updateOutliner();
            this.updateProperties();
            this.updateLayers();
            this.updatePreviewDisplay();
            
            console.log('✅ UI全体更新完了');
            
        } catch (error) {
            console.error('❌ UI更新エラー:', error);
            // UI更新エラーは致命的ではないが、ユーザーに通知
            this.showNotification('UI更新中にエラーが発生しました', 'warning');
        }
    }

    // プロジェクト名をファイルパスから抽出
    extractProjectName(filePath) {
        try {
            const fileName = filePath.split(/[/\\]/).pop();
            const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
            return nameWithoutExt;
        } catch (error) {
            return 'Unknown Project';
        }
    }

    // 通知表示
    showNotification(message, type = 'info') {
        console.log(`📢 [${type.toUpperCase()}] ${message}`);
        
        // 簡易通知実装（ステータスバーに表示）
        const statusElement = document.getElementById('selection-info');
        if (statusElement) {
            const originalText = statusElement.textContent;
            statusElement.textContent = `${message}`;
            
            // 3秒後に元に戻す
            setTimeout(() => {
                statusElement.textContent = originalText;
            }, 3000);
        }
        
        // Phase 2以降で本格的な通知システムを実装予定
        // - トースト通知
        // - ダイアログ表示
        // - アニメーション効果
    }
}

// ========== アプリケーション起動 ========== //
let spineEditorApp;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM読み込み完了');
    spineEditorApp = new SpineEditorApp();
    
    // グローバル参照（デバッグ用）
    window.spineEditorApp = spineEditorApp;
    
    console.log('🎉 Spine Editor Desktop 起動完了');
});

console.log('✅ Spine Editor Desktop - Application Script 読み込み完了');