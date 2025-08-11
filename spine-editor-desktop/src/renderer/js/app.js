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
        
        if (!filePath && typeof electronAPI !== 'undefined') {
            // ファイル選択ダイアログを表示（後で実装）
            console.log('⚠️ ファイル選択ダイアログは未実装');
            return;
        }
        
        // プロジェクトファイル読み込み処理（後で実装）
        console.log('⚠️ プロジェクト読み込み処理は後で実装');
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
            
            // ファイル保存処理
            if (typeof electronAPI !== 'undefined') {
                // ファイル保存ダイアログ
                const result = await this.showSaveDialog('.sep', 'Spine Editor Project');
                
                if (result) {
                    const jsonContent = JSON.stringify(projectData, null, 2);
                    const saveResult = await electronAPI.saveFile(result, jsonContent);
                    
                    if (saveResult.success) {
                        this.state.project.filePath = result;
                        this.state.project.name = this.extractProjectName(result);
                        
                        console.log('✅ プロジェクト保存成功:', result);
                        this.updateProjectStatus();
                        this.showNotification('プロジェクトを保存しました', 'success');
                        
                        return true;
                    } else {
                        console.error('❌ プロジェクト保存失敗:', saveResult.error);
                        this.showNotification('プロジェクトの保存に失敗しました', 'error');
                        return false;
                    }
                }
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
        
        try {
            // パッケージエクスポートマネージャー確認
            if (typeof DesktopPackageExportManager === 'undefined') {
                console.error('❌ DesktopPackageExportManager が利用できません');
                this.showNotification('エクスポート機能が利用できません', 'error');
                return false;
            }
            
            // パッケージエクスポートマネージャー作成・実行
            const exportManager = new DesktopPackageExportManager(this);
            const success = await exportManager.exportPackage();
            
            if (success) {
                console.log('✅ パッケージエクスポート完了');
                return true;
            } else {
                console.error('❌ パッケージエクスポート失敗');
                return false;
            }
            
        } catch (error) {
            console.error('❌ パッケージエクスポートエラー:', error);
            this.showNotification(`エクスポートエラー: ${error.message}`, 'error');
            return false;
        }
    }

    // ========== ヘルパー関数 ========== //

    // ファイル保存ダイアログ表示
    async showSaveDialog(extension, description) {
        if (typeof electronAPI === 'undefined') return null;
        
        try {
            // Electronのダイアログを直接使用（後で適切なAPIに変更予定）
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const defaultName = `${this.state.project.name || 'spine-project'}-${timestamp}${extension}`;
            
            // 簡易実装: デフォルトファイル名で保存
            // TODO: 実際のファイルダイアログ実装
            const projectsFolder = this.state.project.homePageFolder || 'C:/Users/Desktop';
            const filePath = `${projectsFolder}/${defaultName}`;
            
            console.log('📄 保存ファイルパス:', filePath);
            return filePath;
            
        } catch (error) {
            console.error('❌ 保存ダイアログエラー:', error);
            return null;
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