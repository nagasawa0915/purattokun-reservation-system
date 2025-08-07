// 🎯 Spine編集システム - レイヤー編集モジュール
// 役割: 表示制御（レイヤー順序・z-index管理・ドラッグ&ドロップ）
// 複雑度: 高（レイヤー管理・ドラッグ処理・UI制御）

console.log('🎭 Spine Layer Editor モジュール読み込み開始');

// ========== ドラッグ可能タイトルバーモジュール ========== //

function createDraggableTitleBarModule() {
    console.log('🚚 ドラッグ可能タイトルバーモジュール作成開始');
    
    const module = {
        isDragging: false,
        startPos: { x: 0, y: 0 },
        elementStartPos: { x: 0, y: 0 },
        targetElement: null,
        
        // モジュール初期化
        initialize: function(element) {
            if (!element) {
                console.error('❌ ターゲット要素が指定されていません');
                return false;
            }
            
            console.log('🚚 タイトルバーモジュール初期化:', element.id);
            this.targetElement = element;
            this.setupDragHandle();
            return true;
        },
        
        // ドラッグハンドル設定
        setupDragHandle: function() {
            // ヘッダー要素を探す（複数パターンに対応）
            const headerSelectors = [
                '.layer-panel-header',
                '.panel-header',
                'div[style*="background"]'
            ];
            
            let header = null;
            for (const selector of headerSelectors) {
                header = this.targetElement.querySelector(selector);
                if (header) break;
            }
            
            if (!header) {
                console.warn('⚠️ ヘッダー要素が見つかりません - 全体をドラッグ可能にします');
                header = this.targetElement;
            }
            
            // ドラッグ可能スタイルを追加
            header.style.cursor = 'move';
            header.style.userSelect = 'none';
            
            // イベントリスナー設定
            header.addEventListener('mousedown', this.handleMouseDown.bind(this));
            document.addEventListener('mousemove', this.handleMouseMove.bind(this));
            document.addEventListener('mouseup', this.handleMouseUp.bind(this));
            
            console.log('✅ ドラッグハンドル設定完了');
        },
        
        // マウスダウンハンドラー
        handleMouseDown: function(event) {
            // クローズボタンなどの子要素クリックを除外
            if (event.target.id === 'layer-close-btn' || 
                event.target.tagName === 'BUTTON' ||
                event.target.tagName === 'INPUT') {
                return;
            }
            
            this.isDragging = true;
            this.startPos = {
                x: event.clientX,
                y: event.clientY
            };
            
            const rect = this.targetElement.getBoundingClientRect();
            this.elementStartPos = {
                x: rect.left,
                y: rect.top
            };
            
            event.preventDefault();
        },
        
        // マウス移動ハンドラー
        handleMouseMove: function(event) {
            if (!this.isDragging) return;
            
            const deltaX = event.clientX - this.startPos.x;
            const deltaY = event.clientY - this.startPos.y;
            
            const newX = this.elementStartPos.x + deltaX;
            const newY = this.elementStartPos.y + deltaY;
            
            this.targetElement.style.left = newX + 'px';
            this.targetElement.style.top = newY + 'px';
            this.targetElement.style.right = 'auto'; // rightプロパティをリセット
        },
        
        // マウスアップハンドラー
        handleMouseUp: function(event) {
            this.isDragging = false;
        },
        
        // クリーンアップ
        cleanup: function() {
            this.isDragging = false;
            this.targetElement = null;
        }
    };
    
    console.log('✅ ドラッグ可能タイトルバーモジュール作成完了');
    return module;
}

// ========== レイヤー編集モジュール ========== //

function createLayerEditModule() {
    console.log('🎭 レイヤー編集モジュール作成開始');
    
    const module = {
        characters: [],
        activeCharacterIndex: 0,
        layerPanel: null,
        draggedIndex: null,
        
        // モジュール初期化
        initialize: function(targetElement) {
            console.log('🎭 レイヤー編集モジュール初期化開始');
            
            // キャラクター検出
            this.detectCharacters();
            
            // 初期レイヤー設定
            this.updateCharacterLayers();
            
            // UI作成
            this.createLayerUI();
            
            console.log('✅ レイヤー編集モジュール初期化完了');
            return true;
        },
        
        // モジュール終了処理
        cleanup: function() {
            console.log('🗑️ レイヤー編集モジュール終了処理');
            
            // キャラクター選択状態をリセット
            this.characters.forEach(char => {
                if (char.element) {
                    char.element.classList.remove('character-selected');
                    this.removeCharacterHighlight(char.element);
                }
            });
            
            // UI削除
            if (this.layerPanel && this.layerPanel.parentNode) {
                this.layerPanel.parentNode.removeChild(this.layerPanel);
                this.layerPanel = null;
            }
            
            // データリセット
            this.characters = [];
            this.activeCharacterIndex = 0;
            this.draggedIndex = null;
            
            console.log('✅ レイヤー編集モジュール終了処理完了');
        },
        
        // キャラクター検出システム
        detectCharacters: function() {
            console.log('🔍 キャラクター検出開始');
            
            const selectors = [
                '#purattokun-canvas',
                '#purattokun-fallback', 
                'canvas[data-spine-character]',
                '.spine-character',
                '[data-character-name]'
            ];
            
            this.characters = [];
            
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    // より厳密な重複チェック
                    if (!this.isElementAlreadyRegistered(element)) {
                        const characterName = this.getCharacterName(element);
                        
                        this.characters.push({
                            element: element,
                            id: element.id || this.generateCharacterId(),
                            name: characterName,
                            selector: selector,
                            scale: 1.0,
                            isActive: false
                        });
                        
                        console.log(`  ➕ 新規登録: ${characterName} (${selector})`);
                    } else {
                        console.log(`  ⚠️ 重複回避: ${element.id || element.tagName} (${selector})`);
                    }
                });
            });
            
            console.log(`🎯 検出されたキャラクター数: ${this.characters.length}`);
            this.characters.forEach((char, index) => {
                console.log(`  ${index + 1}. ${char.name} (${char.selector})`);
            });
            
            return this.characters.length > 0;
        },
        
        // 要素の重複登録チェック
        isElementAlreadyRegistered: function(element) {
            // 同じ要素のポインタが既に存在するかチェック
            const alreadyExists = this.characters.some(char => char.element === element);
            
            if (alreadyExists) {
                return true;
            }
            
            // フォールバック画像とCanvas要素の重複を特別処理
            if (element.id === 'purattokun-fallback') {
                const canvasExists = this.characters.some(char => char.element.id === 'purattokun-canvas');
                if (canvasExists) {
                    console.log('  🔄 Canvas優先: フォールバック画像をスキップ');
                    return true;
                }
            }
            
            if (element.id === 'purattokun-canvas') {
                // Canvas要素が登録される場合、フォールバック画像を削除
                const fallbackIndex = this.characters.findIndex(char => char.element.id === 'purattokun-fallback');
                if (fallbackIndex !== -1) {
                    console.log('  🔄 Canvas発見: フォールバック画像を削除');
                    this.characters.splice(fallbackIndex, 1);
                }
            }
            
            return false;
        },

        // キャラクターID生成
        generateCharacterId: function() {
            return 'char-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        },
        
        // キャラクター名取得
        getCharacterName: function(element) {
            // data-character-name属性から取得
            if (element.dataset.characterName) {
                return element.dataset.characterName;
            }
            
            // id属性から推測
            if (element.id) {
                if (element.id.includes('purattokun')) return 'ぷらっとくん';
                return element.id.replace(/[-_]canvas$|[-_]fallback$/, '');
            }
            
            // class属性から推測
            if (element.className) {
                const classes = element.className.split(' ');
                for (const cls of classes) {
                    if (cls.includes('character') || cls.includes('spine')) {
                        return cls;
                    }
                }
            }
            
            return 'キャラクター' + (this.characters.length + 1);
        },
        
        // z-index動的管理システム
        updateCharacterLayers: function() {
            console.log('🎭 レイヤー順序更新');
            
            this.characters.forEach((char, index) => {
                if (char.element) {
                    const zIndex = 1000 + index; // 配列の後方ほど前面
                    char.element.style.zIndex = zIndex;
                    console.log(`  ${char.name}: z-index ${zIndex}`);
                }
            });
        },
        
        // アクティブキャラクター設定
        setActiveCharacter: function(index) {
            if (index < 0 || index >= this.characters.length) return;
            
            console.log(`🎯 アクティブキャラクター変更: ${this.characters[index].name}`);
            
            // 全キャラクターのハイライトを解除
            this.characters.forEach(char => {
                if (char.element) {
                    char.element.classList.remove('character-selected');
                    this.removeCharacterHighlight(char.element);
                    char.isActive = false;
                }
            });
            
            // 新しいアクティブキャラクターを設定
            this.activeCharacterIndex = index;
            const activeChar = this.characters[index];
            
            if (activeChar && activeChar.element) {
                activeChar.element.classList.add('character-selected');
                this.addCharacterHighlight(activeChar.element);
                activeChar.isActive = true;
                
                // 既存システムとの互換性のため、グローバル変数を更新
                if (window.SpineEditAPI && window.SpineEditAPI.setTargetElement) {
                    window.SpineEditAPI.setTargetElement(activeChar.element);
                }
            }
            
            // UIを更新
            this.updateLayerUI();
        },
        
        // ハイライト表示
        addCharacterHighlight: function(element) {
            element.style.outline = '3px solid #ff6b6b';
            element.style.boxShadow = '0 0 10px rgba(255, 107, 107, 0.6)';
        },
        
        // ハイライト非表示
        removeCharacterHighlight: function(element) {
            element.style.outline = '';
            element.style.boxShadow = '';
        },
        
        // レイヤー制御UI作成
        createLayerUI: function() {
            console.log('🎨 レイヤー制御UI作成');
            
            // 既存のパネルを削除
            if (this.layerPanel && this.layerPanel.parentNode) {
                this.layerPanel.parentNode.removeChild(this.layerPanel);
            }
            
            // レイヤーパネル作成
            this.layerPanel = document.createElement('div');
            this.layerPanel.id = 'layer-management-panel';
            this.layerPanel.style.cssText = `
                position: fixed;
                right: 10px;
                top: 120px;
                width: 280px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10001;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 12px;
            `;
            
            this.layerPanel.innerHTML = `
                <div class="layer-panel-header" style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 10px;
                    border-radius: 8px 8px 0 0;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <span>🎭</span>
                    <span>レイヤー管理</span>
                    <button id="layer-close-btn" style="
                        background: none;
                        border: none;
                        color: white;
                        margin-left: auto;
                        cursor: pointer;
                        font-size: 16px;
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">✕</button>
                </div>
                <div class="layer-panel-content" style="padding: 12px;">
                    <div class="instruction" style="
                        color: #666;
                        font-size: 11px;
                        margin-bottom: 10px;
                        padding: 8px;
                        background: #f8f9fa;
                        border-radius: 4px;
                    ">
                        ドラッグで並び替え：下ほど前面に表示
                    </div>
                    <div id="character-list" style="
                        max-height: 300px;
                        overflow-y: auto;
                    ">
                        <!-- 動的生成 -->
                    </div>
                    <div class="character-stats" style="
                        margin-top: 10px;
                        padding-top: 8px;
                        border-top: 1px solid #eee;
                        font-size: 11px;
                        color: #666;
                    ">
                        検出したキャラクター: ${this.characters.length}個
                    </div>
                </div>
            `;
            
            document.body.appendChild(this.layerPanel);
            
            // イベントリスナー設定
            this.setupEventListeners();
            
            // キャラクターリストを更新
            this.updateLayerUI();
            
            // ドラッグ可能タイトルバーを追加
            const titleBarModule = createDraggableTitleBarModule();
            titleBarModule.initialize(this.layerPanel);
            
            console.log('✅ レイヤー制御UI作成完了');
        },
        
        // イベントリスナー設定
        setupEventListeners: function() {
            // クローズボタン
            const closeBtn = document.getElementById('layer-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.cleanup();
                });
            }
        },
        
        // レイヤーUI更新
        updateLayerUI: function() {
            const characterList = document.getElementById('character-list');
            if (!characterList) return;
            
            characterList.innerHTML = '';
            
            // キャラクターリストを逆順で表示（最前面が上に来る）
            const reversedChars = [...this.characters].reverse();
            
            reversedChars.forEach((char, displayIndex) => {
                const actualIndex = this.characters.length - 1 - displayIndex;
                const isActive = char.isActive || actualIndex === this.activeCharacterIndex;
                
                const charItem = document.createElement('div');
                charItem.className = 'character-item';
                charItem.draggable = true;
                charItem.dataset.index = actualIndex;
                
                charItem.style.cssText = `
                    padding: 8px;
                    margin-bottom: 4px;
                    border: 1px solid ${isActive ? '#667eea' : '#ddd'};
                    border-radius: 4px;
                    background: ${isActive ? 'rgba(102, 126, 234, 0.1)' : '#fff'};
                    cursor: grab;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                `;
                
                charItem.innerHTML = `
                    <div class="drag-handle" style="
                        color: #999;
                        font-size: 14px;
                    ">⋮⋮</div>
                    <div class="character-info" style="
                        flex: 1;
                        font-size: 12px;
                    ">
                        <div style="font-weight: bold; color: ${isActive ? '#667eea' : '#333'};">
                            ${char.name}
                        </div>
                        <div style="font-size: 10px; color: #666;">
                            z-index: ${1000 + actualIndex}
                        </div>
                    </div>
                    <div class="layer-controls">
                        <button class="select-btn" style="
                            background: ${isActive ? '#667eea' : '#f0f0f0'};
                            color: ${isActive ? 'white' : '#666'};
                            border: none;
                            padding: 4px 8px;
                            border-radius: 3px;
                            font-size: 10px;
                            cursor: pointer;
                        ">
                            ${isActive ? '選択中' : '選択'}
                        </button>
                    </div>
                `;
                
                // クリックイベント
                charItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.setActiveCharacter(actualIndex);
                });
                
                // ドラッグ&ドロップイベント
                charItem.addEventListener('dragstart', (e) => {
                    this.draggedIndex = actualIndex;
                    charItem.style.opacity = '0.5';
                });
                
                charItem.addEventListener('dragend', (e) => {
                    charItem.style.opacity = '1';
                });
                
                charItem.addEventListener('dragover', (e) => {
                    e.preventDefault();
                });
                
                charItem.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const targetIndex = parseInt(charItem.dataset.index);
                    this.reorderCharacters(this.draggedIndex, targetIndex);
                });
                
                characterList.appendChild(charItem);
            });
        },
        
        // キャラクター順序変更
        reorderCharacters: function(fromIndex, toIndex) {
            if (fromIndex === toIndex) return;
            
            console.log(`🔄 キャラクター順序変更: ${fromIndex} → ${toIndex}`);
            
            // 配列内で要素を移動
            const [movedChar] = this.characters.splice(fromIndex, 1);
            this.characters.splice(toIndex, 0, movedChar);
            
            // z-index更新
            this.updateCharacterLayers();
            
            // UI更新
            this.updateLayerUI();
            
            console.log('✅ キャラクター順序変更完了');
        }
    };
    
    console.log('✅ レイヤー編集モジュール作成完了');
    return module;
}

console.log('✅ Spine Layer Editor モジュール読み込み完了');

// Global exports
window.createLayerEditModule = createLayerEditModule;
window.createDraggableTitleBarModule = createDraggableTitleBarModule;