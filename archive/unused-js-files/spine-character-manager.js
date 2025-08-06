// 🎯 Spine編集システム - キャラクター検出・管理モジュール v1.0
// 役割：キャラクター検出・選択・レイヤー制御・ハイライト管理

console.log('🔍 キャラクター管理モジュール読み込み開始');

// ========== 管理変数 ========== //
let characters = []; // 全キャラクター配列
let activeCharacterIndex = 0; // 現在選択中のキャラクター

// キャラクター検出設定
const CHARACTER_SELECTORS = [
    '#purattokun-canvas',           // メインキャラクター
    '#purattokun-fallback',         // フォールバック要素
    'canvas[data-spine-character]', // Spineキャラクター全般
    '.spine-character',             // クラス指定キャラクター
    '[data-character-name]'         // data属性キャラクター
];

// ========== キャラクター検出システム ========== //

/**
 * キャラクター検出・登録
 */
function detectCharacters() {
    console.log('🔍 キャラクター検出開始');
    characters = [];
    
    CHARACTER_SELECTORS.forEach((selector, index) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            // 重複チェック
            if (!characters.some(char => char.element === element)) {
                const characterData = {
                    element: element,
                    id: element.id || `character-${characters.length}`,
                    name: element.dataset.characterName || 
                          element.id || 
                          `キャラクター${characters.length + 1}`,
                    selector: selector,
                    scale: 1.0,
                    isActive: false,
                    zIndex: 1000 + characters.length, // レイヤー管理用z-index
                    originalOrder: characters.length    // 元の検出順序を保持
                };
                characters.push(characterData);
                console.log('✅ キャラクター検出:', characterData.name, '(', selector, ')');
            }
        });
    });
    
    console.log(`🎯 検出完了: ${characters.length}個のキャラクター`);
    
    // 初期z-indexを適用
    applyZIndexToAllCharacters();
    
    // アクティブキャラクターを設定（最初のキャラクター）
    if (characters.length > 0) {
        setActiveCharacter(0);
    }
    
    return characters;
}

/**
 * アクティブキャラクター設定
 * 依存関数: endDrag, startDrag, removeCharacterHighlight, addCharacterHighlight, updateScalePanelForActiveCharacter, updateRealtimePreview
 */
function setActiveCharacter(index) {
    if (index < 0 || index >= characters.length) {
        console.error('❌ 無効なキャラクターインデックス:', index);
        return false;
    }
    
    // 現在のドラッグイベントを先にクリア
    if (window.character && window.isDragging && typeof window.endDrag === 'function') {
        window.endDrag(); // 強制的にドラッグ終了
    }
    
    // 現在のアクティブ状態をクリア
    characters.forEach(char => {
        char.isActive = false;
        removeCharacterHighlight(char.element);
        // 全てのキャラクターからドラッグイベントを削除（マウス・タッチ対応）
        if (typeof window.startDrag === 'function') {
            char.element.removeEventListener('mousedown', window.startDrag);
            char.element.removeEventListener('touchstart', window.startDrag);
        }
        char.element.style.cursor = window.isEditMode ? 'default' : 'default';
    });
    
    // 新しいアクティブキャラクターを設定
    activeCharacterIndex = index;
    const activeChar = characters[index];
    activeChar.isActive = true;
    
    // グローバル変数（後方互換性）を更新
    window.character = activeChar.element;
    window.currentScale = activeChar.scale;
    window.activeCharacterIndex = activeCharacterIndex;
    
    // アクティブキャラクターにのみドラッグイベントを追加（マウス・タッチ対応）
    if (window.isEditMode && typeof window.startDrag === 'function') {
        window.character.style.cursor = 'move';
        window.character.addEventListener('mousedown', window.startDrag);
        window.character.addEventListener('touchstart', window.startDrag, { passive: false });
        console.log('🎯 ドラッグイベントを設定:', activeChar.name);
    }
    
    // ハイライト表示
    addCharacterHighlight(activeChar.element);
    
    console.log('🎯 アクティブキャラクター変更:', activeChar.name);
    
    // スケールパネルのUI更新
    if (typeof window.updateScalePanelForActiveCharacter === 'function') {
        window.updateScalePanelForActiveCharacter();
    }
    
    // リアルタイムプレビュー更新
    if (typeof window.updateRealtimePreview === 'function') {
        window.updateRealtimePreview();
    }
    
    return true;
}

// ========== レイヤー順序制御システム ========== //

/**
 * 全キャラクターのz-indexを適用
 */
function applyZIndexToAllCharacters() {
    characters.forEach((char, index) => {
        // インデックス順に基づいてz-indexを設定（後のものが前面）
        char.zIndex = 1000 + index;
        char.element.style.zIndex = char.zIndex;
        console.log(`🔢 z-index設定: ${char.name} → ${char.zIndex}`);
    });
}

/**
 * キャラクターのレイヤー順序移動
 * 依存関数: updateCharacterSelectPanel, markAsChanged
 */
function moveCharacterInLayer(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= characters.length || 
        toIndex < 0 || toIndex >= characters.length || 
        fromIndex === toIndex) {
        console.error('❌ 無効なレイヤー移動:', { fromIndex, toIndex, total: characters.length });
        return false;
    }
    
    console.log(`🔄 レイヤー移動: ${characters[fromIndex].name} (${fromIndex} → ${toIndex})`);
    
    // 配列内での移動
    const movedCharacter = characters.splice(fromIndex, 1)[0];
    characters.splice(toIndex, 0, movedCharacter);
    
    // アクティブキャラクターインデックスを追跡
    if (activeCharacterIndex === fromIndex) {
        activeCharacterIndex = toIndex;
    } else if (fromIndex < activeCharacterIndex && toIndex >= activeCharacterIndex) {
        activeCharacterIndex--;
    } else if (fromIndex > activeCharacterIndex && toIndex <= activeCharacterIndex) {
        activeCharacterIndex++;
    }
    
    // 全キャラクターのz-indexを再計算・適用
    applyZIndexToAllCharacters();
    
    // UIを更新
    if (typeof window.updateCharacterSelectPanel === 'function') {
        window.updateCharacterSelectPanel();
    }
    
    // レイヤー順序変更を記録
    if (typeof window.markAsChanged === 'function') {
        window.markAsChanged();
    }
    
    console.log(`✅ レイヤー移動完了: 新しいアクティブインデックス ${activeCharacterIndex}`);
    return true;
}

/**
 * キャラクターを最前面に移動
 */
function bringCharacterToFront(index) {
    if (index < 0 || index >= characters.length) return false;
    
    const targetCharacter = characters[index];
    console.log(`⬆️ 最前面に移動: ${targetCharacter.name}`);
    
    return moveCharacterInLayer(index, characters.length - 1);
}

/**
 * キャラクターを最背面に移動
 */
function sendCharacterToBack(index) {
    if (index < 0 || index >= characters.length) return false;
    
    const targetCharacter = characters[index];
    console.log(`⬇️ 最背面に移動: ${targetCharacter.name}`);
    
    return moveCharacterInLayer(index, 0);
}

// ========== キャラクターハイライト管理 ========== //

/**
 * キャラクターにハイライト（編集境界線・ハンドル）を追加
 * 依存関数: startDrag
 */
function addCharacterHighlight(element) {
    if (!element) return;
    
    // 既存のハイライトを削除
    removeCharacterHighlight(element);
    
    // ハイライト用のクラスを追加
    element.classList.add('character-highlighted');
    
    // ハイライトコンテナ作成
    const highlightContainer = document.createElement('div');
    highlightContainer.className = 'character-highlight-container';
    highlightContainer.dataset.characterId = element.id || 'unknown';
    
    // 編集境界線の強化（アニメーション付き）
    const borderElement = document.createElement('div');
    borderElement.className = 'character-highlight-border';
    
    // ドラッグハンドル群の作成（9個：四隅+辺の中央+中心）
    const handlePositions = [
        { name: 'nw', x: 0, y: 0, cursor: 'nw-resize' },      // 北西
        { name: 'n', x: 50, y: 0, cursor: 'n-resize' },       // 北
        { name: 'ne', x: 100, y: 0, cursor: 'ne-resize' },    // 北東
        { name: 'w', x: 0, y: 50, cursor: 'w-resize' },       // 西
        { name: 'center', x: 50, y: 50, cursor: 'move' },     // 中央（ドラッグ用）
        { name: 'e', x: 100, y: 50, cursor: 'e-resize' },     // 東
        { name: 'sw', x: 0, y: 100, cursor: 'sw-resize' },    // 南西
        { name: 's', x: 50, y: 100, cursor: 's-resize' },     // 南
        { name: 'se', x: 100, y: 100, cursor: 'se-resize' }   // 南東
    ];
    
    handlePositions.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `character-drag-handle handle-${pos.name}`;
        handle.dataset.handleType = pos.name;
        handle.dataset.characterId = element.id || 'unknown';
        
        // ハンドルスタイル（CSS-in-JS）- 操作しやすいサイズに修正
        const handleStyle = `
            position: absolute;
            width: ${pos.name === 'center' ? '18px' : '14px'};
            height: ${pos.name === 'center' ? '18px' : '14px'};
            background: ${pos.name === 'center' ? '#ff6b6b' : '#ffffff'};
            border: 2px solid #ff6b6b;
            border-radius: 50%;
            cursor: ${pos.cursor};
            left: ${pos.x}%;
            top: ${pos.y}%;
            transform: translate(-50%, -50%);
            z-index: 10002;
            opacity: 0.9;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            pointer-events: auto;
            
            /* モバイル対応：タッチしやすいサイズに調整 */
            @media (max-width: 768px) {
                width: ${pos.name === 'center' ? '24px' : '18px'} !important;
                height: ${pos.name === 'center' ? '24px' : '18px'} !important;
            }
        `;
        handle.style.cssText = handleStyle;
        
        // ハンドルホバー効果
        handle.addEventListener('mouseenter', () => {
            handle.style.transform = 'translate(-50%, -50%) scale(1.2)';
            handle.style.opacity = '1';
            handle.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.6)';
        });
        
        handle.addEventListener('mouseleave', () => {
            handle.style.transform = 'translate(-50%, -50%) scale(1)';
            handle.style.opacity = '0.9';
            handle.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        });
        
        // 中央ハンドルのドラッグイベント設定（マウス・タッチ対応）
        if (pos.name === 'center' && typeof window.startDrag === 'function') {
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                window.startDrag(e);
            });
            handle.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                window.startDrag(e);
            }, { passive: false });
        }
        
        borderElement.appendChild(handle);
    });
    
    highlightContainer.appendChild(borderElement);
    
    // 境界線のスタイル設定（アニメーション付き）
    const borderStyle = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border: 3px solid #ff6b6b;
        border-radius: 4px;
        pointer-events: none;
        z-index: 10001;
        animation: highlightPulse 2s ease-in-out infinite;
        box-shadow: 
            0 0 20px rgba(255, 107, 107, 0.4),
            inset 0 0 20px rgba(255, 107, 107, 0.1);
    `;
    borderElement.style.cssText = borderStyle;
    
    // アニメーションCSSを動的追加
    if (!document.getElementById('character-highlight-styles')) {
        const style = document.createElement('style');
        style.id = 'character-highlight-styles';
        style.textContent = `
            @keyframes highlightPulse {
                0%, 100% { 
                    border-color: #ff6b6b; 
                    box-shadow: 
                        0 0 20px rgba(255, 107, 107, 0.4),
                        inset 0 0 20px rgba(255, 107, 107, 0.1);
                }
                50% { 
                    border-color: #ff8a8a; 
                    box-shadow: 
                        0 0 30px rgba(255, 107, 107, 0.6),
                        inset 0 0 30px rgba(255, 107, 107, 0.2);
                }
            }
            
            .character-highlighted {
                transition: all 0.3s ease !important;
            }
            
            .character-highlight-container {
                pointer-events: none;
            }
            
            .character-drag-handle {
                pointer-events: auto;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 要素の位置とサイズに合わせてハイライトコンテナを配置
    updateHighlightPosition(element, highlightContainer);
    
    // コンテナを要素の親に追加
    element.parentNode.appendChild(highlightContainer);
    
    // 要素にコンテナの参照を保存
    element._highlightContainer = highlightContainer;
    
    console.log('✅ ハイライト追加:', element.id || element.tagName);
}

/**
 * ハイライト位置更新関数
 */
function updateHighlightPosition(element, highlightContainer) {
    if (!element || !highlightContainer) return;
    
    const rect = element.getBoundingClientRect();
    const parentRect = element.parentNode.getBoundingClientRect();
    
    // 相対位置計算
    const relativeLeft = rect.left - parentRect.left;
    const relativeTop = rect.top - parentRect.top;
    
    highlightContainer.style.cssText = `
        position: absolute;
        left: ${relativeLeft}px;
        top: ${relativeTop}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        pointer-events: none;
        z-index: 10000;
    `;
}

/**
 * キャラクターのハイライトを削除
 */
function removeCharacterHighlight(element) {
    if (!element) return;
    
    // クラス削除
    element.classList.remove('character-highlighted');
    
    // 旧スタイルをクリア
    if (element.style.border) {
        element.style.border = '';
    }
    if (element.style.outline) {
        element.style.outline = '';
    }
    
    // 新しいハイライトコンテナを削除
    if (element._highlightContainer) {
        if (element._highlightContainer.parentNode) {
            element._highlightContainer.parentNode.removeChild(element._highlightContainer);
        }
        delete element._highlightContainer;
    }
    
    // 同じキャラクターIDのハイライトコンテナをすべて削除（念のため）
    const characterId = element.id || 'unknown';
    const existingContainers = document.querySelectorAll(`[data-character-id="${characterId}"]`);
    existingContainers.forEach(container => {
        if (container.classList.contains('character-highlight-container')) {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }
    });
}

/**
 * アクティブキャラクターのスケールパネル更新
 * 依存関数: updateRealtimePreview
 */
function updateScalePanelForActiveCharacter() {
    if (characters.length === 0 || activeCharacterIndex >= characters.length) return;
    
    const activeChar = characters[activeCharacterIndex];
    const slider = document.getElementById('scale-slider');
    const input = document.getElementById('scale-input');
    
    if (slider) slider.value = activeChar.scale;
    if (input) input.value = activeChar.scale.toFixed(2);
    
    console.log(`🎛️ スケールパネル更新: ${activeChar.name} → ${activeChar.scale}`);
    
    // リアルタイムプレビュー更新
    if (typeof window.updateRealtimePreview === 'function') {
        window.updateRealtimePreview();
    }
}

// ========== エクスポート ========== //

// グローバルアクセス用の関数をwindowオブジェクトに登録
if (typeof window !== 'undefined') {
    // キャラクター検出・管理
    window.detectCharacters = detectCharacters;
    window.setActiveCharacter = setActiveCharacter;
    
    // レイヤー制御
    window.applyZIndexToAllCharacters = applyZIndexToAllCharacters;
    window.moveCharacterInLayer = moveCharacterInLayer;
    window.bringCharacterToFront = bringCharacterToFront;
    window.sendCharacterToBack = sendCharacterToBack;
    
    // ハイライト管理
    window.addCharacterHighlight = addCharacterHighlight;
    window.updateHighlightPosition = updateHighlightPosition;
    window.removeCharacterHighlight = removeCharacterHighlight;
    
    // スケール管理
    window.updateScalePanelForActiveCharacter = updateScalePanelForActiveCharacter;
    
    // 配列・変数へのアクセス
    Object.defineProperty(window, 'characters', {
        get: () => characters,
        set: (value) => { characters = value; }
    });
    Object.defineProperty(window, 'activeCharacterIndex', {
        get: () => activeCharacterIndex,
        set: (value) => { activeCharacterIndex = value; }
    });
    
    // 設定の公開
    window.CHARACTER_SELECTORS = CHARACTER_SELECTORS;
}

console.log('✅ キャラクター管理モジュール読み込み完了');