// 🎯 Spine Desktop Integration - Desktop版編集システム統合
// デスクトップアプリ版でのSpineキャラクター編集機能
// Web版の成功したパターンを移植・デスクトップ最適化
// 作成日: 2025-08-10

console.log('🚀 Spine Desktop Integration 読み込み開始');

// ========== グローバル変数定義 ========== //
let spineDesktopManager = null;
let currentProject = null;
let isInitialized = false;

/**
 * Spine Desktop統合システムのメインクラス
 */
class SpineDesktopIntegration {
    constructor() {
        this.characters = new Map();
        this.canvas = null;
        this.editMode = false;
        this.selectedCharacter = null;
        this.dragState = {
            isDragging: false,
            startX: 0,
            startY: 0,
            elementStartX: 0,
            elementStartY: 0
        };
        
        this.init();
    }
    
    /**
     * 初期化
     */
    async init() {
        console.log('📦 Spine Desktop統合システム初期化開始');
        
        try {
            // DOM読み込み完了を待機
            await this.waitForDOM();
            
            // 基本UI作成
            this.createUI();
            
            // イベントリスナー設定
            this.setupEventListeners();
            
            // デフォルトプロジェクト読み込み
            await this.loadDefaultProject();
            
            isInitialized = true;
            console.log('✅ Spine Desktop統合システム初期化完了');
            
        } catch (error) {
            console.error('❌ Spine Desktop統合システム初期化エラー:', error);
        }
    }
    
    /**
     * DOM読み込み完了待機
     */
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    /**
     * 基本UI作成
     */
    createUI() {
        console.log('🎨 基本UI作成開始');
        
        // メインコンテンツエリアを取得
        const contentArea = document.querySelector('.content-area');
        if (!contentArea) {
            throw new Error('コンテンツエリアが見つかりません');
        }
        
        // Spine編集用のメインコンテナを作成
        contentArea.innerHTML = `
            <div id="spine-editor-container">
                <!-- ツールバー -->
                <div id="spine-toolbar" class="spine-toolbar">
                    <div class="toolbar-section">
                        <button id="btn-new-character" class="btn btn-primary">
                            ➕ キャラクター追加
                        </button>
                        <button id="btn-edit-mode" class="btn btn-secondary">
                            ✏️ 編集モード
                        </button>
                        <button id="btn-save-project" class="btn btn-success">
                            💾 保存
                        </button>
                        <button id="btn-load-assets" class="btn btn-info">
                            📁 アセット読み込み
                        </button>
                    </div>
                    <div class="toolbar-section">
                        <span id="current-character-label" class="character-label">
                            選択中: なし
                        </span>
                    </div>
                </div>
                
                <!-- キャンバスエリア -->
                <div id="spine-canvas-area" class="canvas-area">
                    <div id="spine-workspace" class="workspace">
                        <!-- Spineキャラクターがここに配置される -->
                        <div class="workspace-info">
                            <h3>🎯 Spine Character Editor Desktop</h3>
                            <p>キャラクターを追加して編集を開始してください</p>
                            <div class="feature-info">
                                <h4>✨ 利用可能な機能:</h4>
                                <ul>
                                    <li>💫 ドラッグ&ドロップ編集</li>
                                    <li>🎛️ リアルタイムスケール調整</li>
                                    <li>🎯 精密位置制御</li>
                                    <li>💾 .spine-projectファイル保存</li>
                                    <li>📁 Spineアセット読み込み</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- サイドパネル -->
                <div id="spine-properties-panel" class="properties-panel">
                    <h4>🎛️ プロパティパネル</h4>
                    <div id="character-properties" class="property-group">
                        <p>キャラクターが選択されていません</p>
                    </div>
                    
                    <!-- デバッグ情報 -->
                    <div id="debug-info" class="debug-section">
                        <h5>🔍 システム情報</h5>
                        <div class="debug-item">
                            <span>編集モード:</span>
                            <span id="debug-edit-mode">OFF</span>
                        </div>
                        <div class="debug-item">
                            <span>キャラクター数:</span>
                            <span id="debug-character-count">0</span>
                        </div>
                        <div class="debug-item">
                            <span>選択中:</span>
                            <span id="debug-selected">なし</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 専用CSSを適用
        this.injectCSS();
        
        console.log('✅ 基本UI作成完了');
  }

    /**
     * 専用CSS注入
     */
    injectCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Spine Editor専用CSS */
            #spine-editor-container {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
            }
            
            .spine-toolbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background: #34495e;
                color: white;
                border-bottom: 1px solid #2c3e50;
                flex-shrink: 0;
            }
            
            .toolbar-section {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .btn {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            
            .btn-primary { background: #3498db; color: white; }
            .btn-primary:hover { background: #2980b9; }
            
            .btn-secondary { background: #95a5a6; color: white; }
            .btn-secondary:hover { background: #7f8c8d; }
            
            .btn-success { background: #27ae60; color: white; }
            .btn-success:hover { background: #229954; }
            
            .btn-warning { background: #f39c12; color: white; }
            .btn-warning:hover { background: #d68910; }
            
            .btn-info { background: #17a2b8; color: white; }
            .btn-info:hover { background: #138496; }
            
            .btn-danger { background: #e74c3c; color: white; }
            .btn-danger:hover { background: #c0392b; }
            
            .character-label {
                font-size: 14px;
                font-weight: 500;
                color: #ecf0f1;
            }
            
            .canvas-area {
                flex: 1;
                display: flex;
                background: #ecf0f1;
            }
            
            .workspace {
                flex: 1;
                position: relative;
                margin: 16px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            
            .workspace-info {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                color: #7f8c8d;
                z-index: 1;
            }
            
            .feature-info {
                margin-top: 20px;
                padding: 16px;
                background: #f8f9fa;
                border-radius: 6px;
                text-align: left;
            }
            
            .feature-info h4 {
                margin-bottom: 8px;
                color: #2c3e50;
            }
            
            .feature-info ul {
                list-style: none;
                padding: 0;
            }
            
            .feature-info li {
                margin: 4px 0;
                font-size: 14px;
            }
            
            .spine-character {
                user-select: none;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            
            .character-info {
                text-align: center;
                color: white;
                font-weight: 500;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            }
            
            .character-name {
                font-size: 16px;
                margin-bottom: 4px;
            }
            
            .character-id {
                font-size: 12px;
                opacity: 0.8;
            }
            
            .properties-panel {
                width: 280px;
                background: #f8f9fa;
                border-left: 1px solid #dee2e6;
                padding: 16px;
                overflow-y: auto;
                flex-shrink: 0;
            }
            
            .properties-panel h4 {
                margin-top: 0;
                color: #2c3e50;
                border-bottom: 2px solid #3498db;
                padding-bottom: 8px;
            }
            
            .property-group {
                margin-bottom: 24px;
            }
            
            .property-item {
                margin-bottom: 12px;
            }
            
            .property-item label {
                display: block;
                margin-bottom: 4px;
                font-size: 12px;
                font-weight: 500;
                color: #34495e;
            }
            
            .property-item input {
                width: 100%;
                padding: 6px 8px;
                border: 1px solid #bdc3c7;
                border-radius: 4px;
                font-size: 14px;
            }
            
            .property-actions {
                display: flex;
                gap: 8px;
                margin-top: 16px;
            }
            
            .btn-sm {
                padding: 6px 12px;
                font-size: 11px;
            }
            
            .debug-section {
                margin-top: 24px;
                padding: 12px;
                background: #e9ecef;
                border-radius: 6px;
            }
            
            .debug-section h5 {
                margin-top: 0;
                margin-bottom: 8px;
                color: #495057;
                font-size: 13px;
            }
            
            .debug-item {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                margin: 2px 0;
                color: #6c757d;
            }
            
            /* ドラッグ中のスタイル */
            .spine-character.dragging {
                z-index: 1000;
                opacity: 0.8;
                transform: scale(1.05) !important;
            }
            
            /* ホバー効果 */
            .spine-character:hover {
                filter: brightness(1.1);
            }
            
            /* 選択状態 */
            .spine-character.selected {
                outline: 3px solid #3498db;
                outline-offset: 2px;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * イベントリスナー設定
     */
    setupEventListeners() {
        console.log('🔗 イベントリスナー設定開始');
        
        // ツールバーボタンのイベント
        const btnNewCharacter = document.getElementById('btn-new-character');
        const btnEditMode = document.getElementById('btn-edit-mode');
        const btnSaveProject = document.getElementById('btn-save-project');
        const btnLoadAssets = document.getElementById('btn-load-assets');
        
        if (btnNewCharacter) {
            btnNewCharacter.addEventListener('click', () => this.showAddCharacterDialog());
        }
        
        if (btnEditMode) {
            btnEditMode.addEventListener('click', () => this.toggleEditMode());
        }
        
        if (btnSaveProject) {
            btnSaveProject.addEventListener('click', () => this.saveProject());
        }
        
        if (btnLoadAssets) {
            btnLoadAssets.addEventListener('click', () => this.loadSpineAssets());
        }
        
        console.log('✅ イベントリスナー設定完了');
    }
    
    /**
     * デフォルトプロジェクト読み込み
     */
    async loadDefaultProject() {
        console.log('📂 デフォルトプロジェクト読み込み開始');
        
        try {
            // プロジェクト管理システムと連携
            if (window.electronAPI) {
                const result = await window.electronAPI.project.create('新規プロジェクト', 'purattokun');
                if (result.success) {
                    currentProject = result.data;
                    await this.loadProjectData(currentProject);
                }
            } else {
                // フォールバック: 基本プロジェクト
                await this.createBasicProject();
            }
            
        } catch (error) {
            console.error('❌ デフォルトプロジェクト読み込みエラー:', error);
            await this.createBasicProject();
        }
    }
    
    /**
     * 基本プロジェクト作成
     */
    async createBasicProject() {
        console.log('🆕 基本プロジェクト作成');
        
        currentProject = {
            meta: {
                name: '新規プロジェクト',
                created: new Date().toISOString()
            },
            characters: {
                purattokun: {
                    id: 'purattokun',
                    name: 'ぷらっとくん',
                    position: { left: '25%', top: '60%' },
                    scale: { x: 0.7, y: 0.7 },
                    visible: true
                },
                nezumi: {
                    id: 'nezumi',
                    name: 'ねずみ',
                    position: { left: '65%', top: '70%' },
                    scale: { x: 0.5, y: 0.5 },
                    visible: true
                }
            },
            settings: {
                canvas: { width: '100%', height: 'auto' }
            }
        };
        
        await this.loadProjectData(currentProject);
    }

    /**
     * プロジェクトデータ読み込み
     */
    async loadProjectData(projectData) {
        console.log('📄 プロジェクトデータ読み込み:', projectData);
        
        // キャラクター一覧をクリア
        this.characters.clear();
        
        // キャラクターを追加
        for (const [id, characterData] of Object.entries(projectData.characters)) {
            await this.addCharacter(id, characterData);
        }
        
        // UIを更新
        this.updateUI();
    }
    
    /**
     * キャラクター追加
     */
    async addCharacter(id, characterData) {
        console.log('🎭 キャラクター追加:', id, characterData);
        
        const workspace = document.getElementById('spine-workspace');
        if (!workspace) return;
        
        // ワークスペース情報を非表示
        const workspaceInfo = workspace.querySelector('.workspace-info');
        if (workspaceInfo) {
            workspaceInfo.style.display = 'none';
        }
        
        // キャラクターの見た目を決定
        const characterStyles = {
            purattokun: {
                background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                emoji: '🐱'
            },
            nezumi: {
                background: 'linear-gradient(45deg, #a8a8a8, #2c3e50)',
                emoji: '🐭'
            }
        };
        
        const characterType = id.includes('purattokun') ? 'purattokun' : 
                             id.includes('nezumi') ? 'nezumi' : 'purattokun';
        const style = characterStyles[characterType] || characterStyles.purattokun;
        
        // キャラクター要素を作成
        const characterElement = document.createElement('div');
        characterElement.id = `character-${id}`;
        characterElement.className = 'spine-character';
        characterElement.style.cssText = `
            position: absolute;
            left: ${characterData.position.left};
            top: ${characterData.position.top};
            width: 180px;
            height: 180px;
            background: ${style.background};
            border: 2px solid #34495e;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transform: scale(${characterData.scale.x}, ${characterData.scale.y});
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10;
        `;
        
        characterElement.innerHTML = `
            <div class="character-info">
                <div class="character-emoji" style="font-size: 48px; margin-bottom: 8px;">
                    ${style.emoji}
                </div>
                <div class="character-name">${characterData.name}</div>
                <div class="character-id">${id}</div>
            </div>
        `;
        
        // キャラクタークリックイベント
        characterElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectCharacter(id);
        });
        
        // ワークスペースに追加
        workspace.appendChild(characterElement);
        
        // 内部管理に追加
        this.characters.set(id, {
            ...characterData,
            element: characterElement
        });
        
        // デバッグ情報更新
        this.updateDebugInfo();
        
        console.log('✅ キャラクター追加完了:', id);
    }
    
    /**
     * キャラクター選択
     */
    selectCharacter(id) {
        console.log('🎯 キャラクター選択:', id);
        
        // 前の選択を解除
        if (this.selectedCharacter) {
            const prevElement = this.characters.get(this.selectedCharacter)?.element;
            if (prevElement) {
                prevElement.classList.remove('selected');
            }
        }
        
        // 新しい選択
        this.selectedCharacter = id;
        const character = this.characters.get(id);
        if (character && character.element) {
            character.element.classList.add('selected');
            
            // ラベル更新
            const label = document.getElementById('current-character-label');
            if (label) {
                label.textContent = `選択中: ${character.name}`;
            }
            
            // プロパティパネル更新
            this.updatePropertiesPanel(id);
            
            // デバッグ情報更新
            this.updateDebugInfo();
        }
    }

    /**
     * プロパティパネル更新
     */
    updatePropertiesPanel(characterId) {
        const character = this.characters.get(characterId);
        if (!character) return;
        
        const propertiesDiv = document.getElementById('character-properties');
        if (!propertiesDiv) return;
        
        propertiesDiv.innerHTML = `
            <div class="property-item">
                <label>🏷️ 名前:</label>
                <input type="text" value="${character.name}" id="prop-name">
            </div>
            <div class="property-item">
                <label>↔️ X位置:</label>
                <input type="text" value="${character.position.left}" id="prop-left" placeholder="例: 50%">
            </div>
            <div class="property-item">
                <label>↕️ Y位置:</label>
                <input type="text" value="${character.position.top}" id="prop-top" placeholder="例: 60%">
            </div>
            <div class="property-item">
                <label>📏 スケール:</label>
                <input type="number" value="${character.scale.x}" step="0.1" min="0.1" max="3" id="prop-scale">
            </div>
            
            <div class="property-actions">
                <button class="btn btn-sm btn-primary" onclick="spineDesktopManager.applyProperties()">✅ 適用</button>
                <button class="btn btn-sm btn-warning" onclick="spineDesktopManager.resetCharacter('${characterId}')">🔄 リセット</button>
                <button class="btn btn-sm btn-danger" onclick="spineDesktopManager.deleteCharacter('${characterId}')">🗑️ 削除</button>
            </div>
        `;
    }
    
    /**
     * 編集モード切り替え
     */
    toggleEditMode() {
        this.editMode = !this.editMode;
        
        const btn = document.getElementById('btn-edit-mode');
        if (btn) {
            if (this.editMode) {
                btn.textContent = '❌ 編集終了';
                btn.classList.remove('btn-secondary');
                btn.classList.add('btn-warning');
                this.enableDragMode();
            } else {
                btn.textContent = '✏️ 編集モード';
                btn.classList.remove('btn-warning');
                btn.classList.add('btn-secondary');
                this.disableDragMode();
            }
        }
        
        // デバッグ情報更新
        this.updateDebugInfo();
        
        console.log('✏️ 編集モード:', this.editMode ? 'ON' : 'OFF');
    }
    
    /**
     * ドラッグモード有効化
     */
    enableDragMode() {
        console.log('🖱️ ドラッグモード有効化');
        
        for (const [id, character] of this.characters) {
            if (character.element) {
                character.element.addEventListener('mousedown', this.handleMouseDown.bind(this, id));
                character.element.style.cursor = 'move';
            }
        }
    }
    
    /**
     * ドラッグモード無効化
     */
    disableDragMode() {
        console.log('🚫 ドラッグモード無効化');
        
        for (const [id, character] of this.characters) {
            if (character.element) {
                character.element.style.cursor = 'pointer';
            }
        }
    }
    
    /**
     * マウスダウンハンドラ
     */
    handleMouseDown(characterId, e) {
        if (!this.editMode) return;
        
        e.preventDefault();
        this.selectCharacter(characterId);
        
        this.dragState.isDragging = true;
        this.dragState.startX = e.clientX;
        this.dragState.startY = e.clientY;
        
        const character = this.characters.get(characterId);
        if (character && character.element) {
            const rect = character.element.getBoundingClientRect();
            this.dragState.elementStartX = rect.left;
            this.dragState.elementStartY = rect.top;
            
            character.element.classList.add('dragging');
        }
        
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        console.log('🖱️ ドラッグ開始:', characterId);
    }
    
    /**
     * マウス移動ハンドラ
     */
    handleMouseMove(e) {
        if (!this.dragState.isDragging || !this.selectedCharacter) return;
        
        const deltaX = e.clientX - this.dragState.startX;
        const deltaY = e.clientY - this.dragState.startY;
        
        const newX = this.dragState.elementStartX + deltaX;
        const newY = this.dragState.elementStartY + deltaY;
        
        const character = this.characters.get(this.selectedCharacter);
        if (character && character.element) {
            character.element.style.left = newX + 'px';
            character.element.style.top = newY + 'px';
        }
    }
    
    /**
     * マウスアップハンドラ
     */
    handleMouseUp(e) {
        if (!this.dragState.isDragging) return;
        
        this.dragState.isDragging = false;
        
        // 最終位置を保存
        if (this.selectedCharacter) {
            const character = this.characters.get(this.selectedCharacter);
            if (character && character.element) {
                const rect = character.element.getBoundingClientRect();
                const workspace = document.getElementById('spine-workspace');
                const workspaceRect = workspace.getBoundingClientRect();
                
                // 相対位置に変換
                const leftPercent = ((rect.left - workspaceRect.left) / workspaceRect.width * 100).toFixed(1) + '%';
                const topPercent = ((rect.top - workspaceRect.top) / workspaceRect.height * 100).toFixed(1) + '%';
                
                character.position.left = leftPercent;
                character.position.top = topPercent;
                
                // プロパティパネル更新
                this.updatePropertiesPanel(this.selectedCharacter);
                
                // ドラッグ状態のスタイル削除
                character.element.classList.remove('dragging');
                
                console.log('📍 位置更新:', this.selectedCharacter, { left: leftPercent, top: topPercent });
            }
        }
        
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        
        console.log('🖱️ ドラッグ終了');
    }
    
    /**
     * プロパティ適用
     */
    applyProperties() {
        if (!this.selectedCharacter) return;
        
        const character = this.characters.get(this.selectedCharacter);
        if (!character) return;
        
        // 入力値を取得
        const nameInput = document.getElementById('prop-name');
        const leftInput = document.getElementById('prop-left');
        const topInput = document.getElementById('prop-top');
        const scaleInput = document.getElementById('prop-scale');
        
        if (nameInput) character.name = nameInput.value;
        if (leftInput) character.position.left = leftInput.value;
        if (topInput) character.position.top = topInput.value;
        if (scaleInput) {
            const scale = parseFloat(scaleInput.value);
            character.scale.x = scale;
            character.scale.y = scale;
        }
        
        // 要素に反映
        if (character.element) {
            character.element.style.left = character.position.left;
            character.element.style.top = character.position.top;
            character.element.style.transform = `scale(${character.scale.x}, ${character.scale.y})`;
            character.element.querySelector('.character-name').textContent = character.name;
        }
        
        // ラベル更新
        const label = document.getElementById('current-character-label');
        if (label) {
            label.textContent = `選択中: ${character.name}`;
        }
        
        console.log('✅ プロパティ適用完了:', this.selectedCharacter);
    }

    /**
     * キャラクターリセット
     */
    resetCharacter(characterId) {
        const character = this.characters.get(characterId);
        if (!character) return;
        
        character.position = { left: '50%', top: '50%' };
        character.scale = { x: 1.0, y: 1.0 };
        
        if (character.element) {
            character.element.style.left = character.position.left;
            character.element.style.top = character.position.top;
            character.element.style.transform = `scale(${character.scale.x}, ${character.scale.y})`;
        }
        
        this.updatePropertiesPanel(characterId);
        console.log('🔄 キャラクターリセット:', characterId);
    }
    
    /**
     * キャラクター削除
     */
    deleteCharacter(characterId) {
        const character = this.characters.get(characterId);
        if (!character) return;
        
        if (confirm(`${character.name}を削除しますか？`)) {
            if (character.element) {
                character.element.remove();
            }
            
            this.characters.delete(characterId);
            
            if (this.selectedCharacter === characterId) {
                this.selectedCharacter = null;
                const label = document.getElementById('current-character-label');
                if (label) label.textContent = '選択中: なし';
                
                const propertiesDiv = document.getElementById('character-properties');
                if (propertiesDiv) {
                    propertiesDiv.innerHTML = '<p>キャラクターが選択されていません</p>';
                }
            }
            
            this.updateDebugInfo();
            console.log('🗑️ キャラクター削除完了:', characterId);
        }
    }
    
    /**
     * キャラクター追加ダイアログ
     */
    showAddCharacterDialog() {
        const characterType = prompt('追加するキャラクターを選択してください:\n\n1. purattokun (ぷらっとくん)\n2. nezumi (ねずみ)\n\n番号を入力:');
        
        let characterId, characterName;
        
        switch(characterType) {
            case '1':
                characterId = 'purattokun-' + Date.now();
                characterName = 'ぷらっとくん';
                break;
            case '2':
                characterId = 'nezumi-' + Date.now();
                characterName = 'ねずみ';
                break;
            default:
                alert('無効な選択です');
                return;
        }
        
        const characterData = {
            id: characterId,
            name: characterName,
            position: { left: '50%', top: '50%' },
            scale: { x: 0.8, y: 0.8 },
            visible: true
        };
        
        this.addCharacter(characterId, characterData);
        
        if (currentProject) {
            currentProject.characters[characterId] = characterData;
        }
        
        console.log('➕ キャラクター追加:', characterId);
    }
    
    /**
     * アセット読み込み
     */
    async loadSpineAssets() {
        console.log('📁 Spineアセット読み込み開始');
        
        try {
            if (window.electronAPI) {
                const result = await window.electronAPI.dialog.openFile({
                    title: 'Spineアセットフォルダを選択',
                    properties: ['openDirectory']
                });
                
                if (result.success && result.folderPaths.length > 0) {
                    const folderPath = result.folderPaths[0];
                    alert(`Spineアセットフォルダを選択しました:\n${folderPath}\n\n※ 実装予定: アセット読み込み機能`);
                }
            } else {
                alert('デスクトップ環境でのみ利用可能な機能です');
            }
        } catch (error) {
            console.error('❌ Spineアセット読み込みエラー:', error);
            alert('アセット読み込み中にエラーが発生しました');
        }
    }
    
    /**
     * プロジェクト保存
     */
    async saveProject() {
        if (!currentProject) {
            alert('保存するプロジェクトがありません');
            return;
        }
        
        try {
            // キャラクターデータを更新
            currentProject.characters = {};
            for (const [id, character] of this.characters) {
                currentProject.characters[id] = {
                    id: character.id,
                    name: character.name,
                    position: character.position,
                    scale: character.scale,
                    visible: character.visible
                };
            }
            
            currentProject.meta.lastModified = new Date().toISOString();
            
            if (window.electronAPI) {
                const result = await window.electronAPI.project.save(currentProject);
                if (result.success) {
                    alert('プロジェクトを保存しました\n\nファイル: ' + result.path);
                } else {
                    alert('保存に失敗しました: ' + result.error);
                }
            } else {
                localStorage.setItem('spine-desktop-project', JSON.stringify(currentProject));
                alert('プロジェクトをローカルストレージに保存しました');
            }
            
            console.log('💾 プロジェクト保存完了');
            
        } catch (error) {
            console.error('❌ プロジェクト保存エラー:', error);
            alert('保存中にエラーが発生しました');
        }
    }
    
    /**
     * デバッグ情報更新
     */
    updateDebugInfo() {
        const editModeElement = document.getElementById('debug-edit-mode');
        const characterCountElement = document.getElementById('debug-character-count');
        const selectedElement = document.getElementById('debug-selected');
        
        if (editModeElement) {
            editModeElement.textContent = this.editMode ? 'ON' : 'OFF';
            editModeElement.style.color = this.editMode ? '#27ae60' : '#e74c3c';
        }
        
        if (characterCountElement) {
            characterCountElement.textContent = this.characters.size;
        }
        
        if (selectedElement) {
            const selectedName = this.selectedCharacter ? 
                this.characters.get(this.selectedCharacter)?.name || this.selectedCharacter : 'なし';
            selectedElement.textContent = selectedName;
        }
    }
    
    /**
     * UI更新
     */
    updateUI() {
        console.log('🔄 UI更新');
        this.updateDebugInfo();
    }
}

// ========== 初期化処理 ========== //

/**
 * システム初期化
 */
function initializeSpineDesktop() {
    console.log('🚀 Spine Desktop初期化開始');
    
    if (isInitialized) {
        console.log('⚠️ 既に初期化済みです');
        return;
    }
    
    try {
        spineDesktopManager = new SpineDesktopIntegration();
        window.spineDesktopManager = spineDesktopManager; // グローバルアクセス用
        
    } catch (error) {
        console.error('❌ Spine Desktop初期化エラー:', error);
    }
}

// DOM読み込み完了後に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSpineDesktop);
} else {
    // 既にDOMが読み込まれている場合は即座に初期化
    setTimeout(initializeSpineDesktop, 100);
}

// ========== エクスポート ========== //

// グローバルに公開（デバッグ用）
window.SpineDesktopIntegration = SpineDesktopIntegration;
window.initializeSpineDesktop = initializeSpineDesktop;

console.log('✅ Spine Desktop Integration 読み込み完了');