// 🎯 Spine編集システム - キャラクター管理モジュール
// 意味単位: 機能グループ（複数キャラクター検出・選択・管理）
// 役割: キャラクター間切り替え、プレビューボックス、選択状態管理

console.log('🎯 Spine Multi Character Manager モジュール読み込み開始');

// ========== 複数キャラクター管理システム ========== //

// 重複宣言チェック
if (typeof window.MultiCharacterManager === 'undefined') {
    const MultiCharacterManager = {
    characters: [],
    activeCharacter: null,
    previewBoxes: [],
    
    // 初期化
    initialize: function() {
        console.log('🎯 複数キャラクターマネージャー初期化');
        this.detectAllCharacters();
        this.setupEventListeners();
        this.showPreviewBoxes();
    },
    
    // 全キャラクター検出
    detectAllCharacters: function() {
        // LayerControlエラー修正: 直接的なキャラクター検出に変更
        this.characters = [];
        
        // 🎯 汎用的なSpineキャラクター検出（完全自動・固有名詞不要）
        const selectors = [
            'canvas[id$="-canvas"]',     // 最優先：標準命名規則（purattokun-canvas, nezumi-canvas等）
            'canvas[id*="spine"]',       // spine含む名前
            'canvas[id*="character"]',   // character含む名前
            'canvas.spine-canvas',       // クラス指定
            'div[id*="spine"] canvas',   // 親要素がspine
            'canvas[data-spine-character="true"]'  // データ属性対応
        ];
        
        selectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    if (element && element.id && !this.characters.find(c => c.id === element.id)) {
                        this.characters.push({
                            id: element.id,
                            element: element,
                            name: element.id.replace(/[^a-zA-Z]/g, '') || 'character'
                        });
                    }
                });
            } catch (error) {
                console.warn(`キャラクター検出エラー (${selector}):`, error);
            }
        });
        
        console.log(`🔍 検出されたキャラクター数: ${this.characters.length}`);
    },
    
    // キャラクター選択（nezumi対応・座標系管理強化版）
    selectCharacter: function(character) {
        console.log(`🎯 キャラクター選択開始: ${character.name || character.id}`);
        
        // 複数キャラクター間切り替えの安全性確保
        try {
            // Step 1: 前の選択の完全解除
            if (this.activeCharacter && this.activeCharacter.id !== character.id) {
                console.log(`🔄 前選択解除: ${this.activeCharacter.name || this.activeCharacter.id}`);
                this.exitEditMode(); // 座標系復元含む
                this.activeCharacter.isActive = false;
            }
            
            // Step 2: 新しいキャラクター状態設定
            this.activeCharacter = character;
            character.isActive = true;
            
            // Step 3: SpineEditSystemターゲット安全切り替え
            const prevTarget = SpineEditSystem.baseLayer.targetElement;
            SpineEditSystem.baseLayer.targetElement = character.element;
            
            console.log(`🎯 ターゲット切り替え: ${prevTarget?.id || 'none'} → ${character.element.id}`);
            
            // Step 4: キャラクター固有の編集モード開始
            this.enterEditMode(character);
            
            // Step 5: UI更新（座標系確定後）
            this.updatePreviewBoxes();
            this.showEditBoundingBox();
            
            console.log(`✅ キャラクター選択完了: ${character.name || character.id}`);
            
        } catch (error) {
            console.error(`❌ キャラクター選択エラー (${character.id}):`, error);
            
            // エラー時の安全な復旧
            if (SpineEditSystem.coordinateSwap.isSwapped) {
                SpineEditSystem.coordinateSwap.forceRestore();
            }
            this.activeCharacter = null;
            character.isActive = false;
        }
    },
    
    // 選択解除
    deselectCharacter: function() {
        if (this.activeCharacter) {
            console.log(`🚫 選択解除: ${this.activeCharacter.name}`);
            this.activeCharacter.isActive = false;
            this.exitEditMode();
            this.activeCharacter = null;
            
            // PureBoundingBox v5.0クリーンアップ
            if (window.currentBoundingBox && typeof window.currentBoundingBox.cleanup === 'function') {
                window.currentBoundingBox.cleanup();
                window.currentBoundingBox = null;
                console.log('🧹 PureBoundingBox v5.0クリーンアップ完了');
            }
            
            // 旧システムバウンディングボックス削除
            if (window.ModuleManager) ModuleManager.removeModule('boundingBox');
            
            // プレビューボックスを更新
            this.updatePreviewBoxes();
        }
    },
    
    // 編集モードに入る（nezumi対応・座標系管理強化版）
    enterEditMode: function(character) {
        console.log(`🔄 編集モード開始: ${character.name || character.id}`);
        
        try {
            // キャラクター固有の座標系スワップ前チェック
            const element = character.element;
            // 🎯 汎用的なキャラクタータイプ判定（固有名詞不要）
            const characterType = element.id.replace('-canvas', '') || 'unknown';
            
            console.log(`📍 キャラクタータイプ: ${characterType}, 要素: ${element.id}`);
            
            // 座標系スワップ実行（要素の現在状態を保存）
            if (!SpineEditSystem.coordinateSwap.isSwapped) {
                SpineEditSystem.coordinateSwap.enterEditMode(element);
                console.log(`✅ 座標系スワップ完了: ${characterType}`);
            } else {
                console.log(`⚠️ 既にスワップ済み - スキップ`);
            }
            
        } catch (error) {
            console.error(`❌ 編集モード開始エラー (${character.id}):`, error);
            throw error;
        }
    },
    
    // 編集モードを出る（nezumi対応・安全な復元版）
    exitEditMode: function() {
        const character = this.activeCharacter;
        if (!character) return;
        
        console.log(`🔙 編集モード終了: ${character.name || character.id}`);
        
        try {
            if (SpineEditSystem.coordinateSwap.isSwapped) {
                const targetElement = character.element || SpineEditSystem.baseLayer.targetElement;
                
                if (targetElement) {
                    SpineEditSystem.coordinateSwap.exitEditMode(targetElement);
                    console.log(`✅ 座標系復元完了: ${targetElement.id}`);
                } else {
                    console.warn('⚠️ ターゲット要素未定義 - 強制復元実行');
                    SpineEditSystem.coordinateSwap.forceRestore();
                }
            } else {
                console.log('📝 座標系未スワップ - 復元スキップ');
            }
            
        } catch (error) {
            console.error(`❌ 編集モード終了エラー (${character.id}):`, error);
            // エラー時は強制復元
            if (SpineEditSystem.coordinateSwap.forceRestore) {
                SpineEditSystem.coordinateSwap.forceRestore();
            }
        }
    },
    
    // プレビューボックス表示
    showPreviewBoxes: function() {
        this.clearPreviewBoxes();
        
        this.characters.forEach(character => {
            if (!character.isActive) {
                this.createPreviewBox(character);
            }
        });
    },
    
    // プレビューボックス作成（nezumi選択状態対応強化版）
    createPreviewBox: function(character) {
        const element = character.element;
        const rect = element.getBoundingClientRect();
        const parentRect = element.parentElement.getBoundingClientRect();
        
        // 選択状態チェック
        const isSelected = character.isActive || (this.activeCharacter && this.activeCharacter.id === character.id);
        
        const previewBox = document.createElement('div');
        previewBox.className = 'spine-character-preview-box';
        previewBox.dataset.characterId = character.id;
        
        // 選択状態による視覚的変更（点線→実線、背景色強化）
        const borderStyle = isSelected ? '2px solid #007acc' : '1px dotted #999';
        const backgroundColor = isSelected ? 'rgba(0, 122, 204, 0.1)' : 'rgba(153, 153, 153, 0.05)';
        const zIndex = isSelected ? 9999 : 8888;
        
        previewBox.style.cssText = `
            position: absolute;
            border: ${borderStyle};
            background: ${backgroundColor};
            pointer-events: auto;
            z-index: ${zIndex};
            left: ${rect.left - parentRect.left}px;
            top: ${rect.top - parentRect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
        `;
        
        // キャラクター名表示ラベル追加（nezumi対応）
        if (isSelected) {
            const label = document.createElement('div');
            // 🎯 汎用的な表示名生成（絵文字マップ方式）
            const characterName = character.id.replace('-canvas', '');
            const emojiMap = { 'purattokun': '🐱', 'nezumi': '🐭' };
            const displayName = emojiMap[characterName] || '🎯';
            label.textContent = displayName;
            label.style.cssText = `
                position: absolute;
                top: -20px;
                left: 50%;
                transform: translateX(-50%);
                background: ${isSelected ? '#007acc' : '#666'};
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 12px;
                font-weight: bold;
                white-space: nowrap;
                pointer-events: none;
            `;
            previewBox.appendChild(label);
        }
        
        // クリックイベント（nezumi選択対応）
        previewBox.addEventListener('click', (event) => {
            if (!SpineEditSystem.controlLayer.isEditMode) return;
            event.preventDefault();
            event.stopPropagation();
            
            console.log(`🎯 プレビューボックスクリック: ${character.id}`);
            this.selectCharacter(character);
        });
        
        // ホバーエフェクト追加
        previewBox.addEventListener('mouseenter', () => {
            if (!isSelected) {
                previewBox.style.border = '1px solid #007acc';
                previewBox.style.background = 'rgba(0, 122, 204, 0.08)';
            }
        });
        
        previewBox.addEventListener('mouseleave', () => {
            if (!isSelected) {
                previewBox.style.border = borderStyle;
                previewBox.style.background = backgroundColor;
            }
        });
        
        element.parentElement.appendChild(previewBox);
        this.previewBoxes.push(previewBox);
        
        console.log(`📦 プレビューボックス作成: ${character.id} (選択: ${isSelected})`);
    },
    
    // プレビューボックス更新
    updatePreviewBoxes: function() {
        this.showPreviewBoxes();
    },
    
    // プレビューボックス削除
    clearPreviewBoxes: function() {
        this.previewBoxes.forEach(box => {
            if (box.parentElement) {
                box.parentElement.removeChild(box);
            }
        });
        this.previewBoxes = [];
    },
    
    // 編集バウンディングボックス表示（PureBoundingBox v5.0）
    showEditBoundingBox: function() {
        if (this.activeCharacter) {
            try {
                // PureBoundingBox v5.0マイクロモジュール使用
                if (typeof PureBoundingBox !== 'undefined') {
                    const boundingBox = new PureBoundingBox({
                        targetElement: this.activeCharacter.element,
                        minWidth: 50,
                        minHeight: 50,
                        syncTransform: false // 🔧 スケール時移動問題回避のため無効化
                    });
                    
                    // バウンディングボックス実行
                    boundingBox.execute({visible: true});
                    
                    // グローバル参照保存（クリーンアップ用）
                    window.currentBoundingBox = boundingBox;
                    
                    console.log('📦 PureBoundingBox v5.0編集バウンディングボックス表示');
                } else {
                    // フォールバック: 旧システム使用
                    console.warn('⚠️ PureBoundingBox v5.0未読み込み - 旧システム使用');
                    const boundingBoxModule = createBoundingBoxModule();
                    const success = window.ModuleManager ? ModuleManager.addModule('boundingBox', boundingBoxModule) : false;
                    
                    if (success) {
                        console.log('📦 編集バウンディングボックス表示（旧システム）');
                    } else {
                        console.error('❌ 編集バウンディングボックス表示失敗');
                    }
                }
            } catch (error) {
                console.error('❌ バウンディングボックス初期化エラー:', error);
                // エラー時はフォールバック
                const boundingBoxModule = createBoundingBoxModule();
                const success = window.ModuleManager ? ModuleManager.addModule('boundingBox', boundingBoxModule) : false;
                console.log('📦 フォールバックシステムでバウンディングボックス表示:', success ? '成功' : '失敗');
            }
        }
    },
    
    // イベントリスナー設定
    setupEventListeners: function() {
        // 空白クリックで選択解除
        document.addEventListener('click', (event) => {
            if (!SpineEditSystem.controlLayer.isEditMode) return;
            
            // キャラクターやプレビューボックス、バウンディングボックス以外をクリック
            const isCharacterClick = this.characters.some(char => 
                char.element.contains(event.target)
            );
            const isPreviewClick = event.target.classList.contains('spine-character-preview-box');
            const isBoundingBoxClick = event.target.closest('#spine-bounding-box') || 
                                     event.target.closest('.spine-handle') || 
                                     event.target.closest('.spine-center-area');
            
            if (!isCharacterClick && !isPreviewClick && !isBoundingBoxClick) {
                this.deselectCharacter();
            }
        });
        
        console.log('✅ 複数キャラクター イベントリスナー設定完了');
    },
    
    // クリーンアップ
    cleanup: function() {
        this.clearPreviewBoxes();
        this.deselectCharacter();
        this.characters = [];
        console.log('🧹 複数キャラクターマネージャー クリーンアップ完了');
    }
    };

    // Global export
    window.MultiCharacterManager = MultiCharacterManager;
}

// ========== 外部インターフェース ========== //

/**
 * キャラクタークリック用バウンディングボックス設定
 */
function setupCharacterClickForBoundingBox() {
    // 複数キャラクター対応の初期化
    MultiCharacterManager.initialize();
    
    console.log('✅ 複数キャラクター対応バウンディングボックス設定完了');
}

console.log('✅ Spine Multi Character Manager モジュール読み込み完了');

// 外部インターフェースの重複チェック
if (typeof window.setupCharacterClickForBoundingBox === 'undefined') {
    window.setupCharacterClickForBoundingBox = setupCharacterClickForBoundingBox;
}