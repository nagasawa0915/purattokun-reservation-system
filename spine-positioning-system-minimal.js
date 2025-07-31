// 🎯 Spine編集システム v3.0 - 最小限実装版
// 完全リセット・シンプル設計・確実動作

console.log('🚀 Spine編集システム v3.0 (最小限実装版) 読み込み開始');

// ========== グローバル変数 ========== //
let isEditMode = false;
let isDragging = false;
let character = null; // メインキャラクター（後方互換性のため）
let startMousePos = { x: 0, y: 0 };
let startElementPos = { left: 0, top: 0 };
let currentScale = 1.0; // Spineスケール値を保持

// 複数キャラクター管理
let characters = []; // 全キャラクター配列
let activeCharacterIndex = 0; // 現在選択中のキャラクター

// 🆕 編集状態管理システム
let editStartState = null; // 編集開始時の状態スナップショット
let tempSaveData = null; // 一時保存データ
let hasUnsavedChanges = false; // 未保存の変更があるかのフラグ

// 🆕 モバイル検出
let isMobile = window.innerWidth <= 768;

// 🆕 モバイル用スタイル適用関数
function applyMobileStyles() {
    isMobile = window.innerWidth <= 768;
    console.log('📱 モバイル検出:', isMobile ? 'モバイル' : 'デスクトップ');
    
    // キャラクター選択パネル
    const characterPanel = document.getElementById('character-select-panel');
    if (characterPanel) {
        if (isMobile) {
            Object.assign(characterPanel.style, {
                top: 'auto',
                right: 'auto',
                bottom: '180px',
                left: '50%',
                transform: 'translateX(-50%)',
                minWidth: '280px',
                maxWidth: 'calc(100vw - 20px)',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: '10003'
            });
        } else {
            Object.assign(characterPanel.style, {
                top: '60px',
                right: '10px',
                bottom: 'auto',
                left: 'auto',
                transform: 'none',
                minWidth: '200px',
                maxWidth: 'none',
                maxHeight: 'none',
                overflowY: 'visible',
                zIndex: '10000'
            });
        }
    }
    
    // スケール調整パネル
    const scalePanel = document.getElementById('scale-adjust-panel');
    if (scalePanel) {
        if (isMobile) {
            Object.assign(scalePanel.style, {
                top: 'auto',
                right: 'auto',
                bottom: '100px',
                left: '50%',
                transform: 'translateX(-50%)',
                minWidth: '280px',
                maxWidth: 'calc(100vw - 20px)',
                zIndex: '10002'
            });
        } else {
            Object.assign(scalePanel.style, {
                top: '280px',
                right: '10px',
                bottom: 'auto',
                left: 'auto',
                transform: 'none',
                minWidth: 'auto',
                maxWidth: 'none',
                zIndex: '10000'
            });
        }
    }
    
    // リアルタイムプレビューパネル
    const previewPanel = document.getElementById('realtime-preview-panel');
    if (previewPanel) {
        if (isMobile) {
            Object.assign(previewPanel.style, {
                top: 'auto',
                right: 'auto',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                minWidth: '280px',
                maxWidth: 'calc(100vw - 20px)',
                zIndex: '10001',
                fontSize: '12px',
                padding: '10px'
            });
        } else {
            Object.assign(previewPanel.style, {
                top: 'auto',
                right: '10px',
                bottom: '10px',
                left: 'auto',
                transform: 'none',
                minWidth: '200px',
                maxWidth: 'none',
                zIndex: '10000',
                fontSize: '11px',
                padding: '12px'
            });
        }
    }
    
    // 🆕 独立リアルタイムプレビューパネル - 統合メニューとの連携
    const independentPreviewPanel = document.getElementById('independent-realtime-preview');
    if (independentPreviewPanel) {
        updateRealtimePreviewPosition(independentPreviewPanel);
    }
    
    // レイヤーボタンのサイズ調整
    const layerButtons = document.querySelectorAll('.layer-btn');
    layerButtons.forEach(button => {
        if (isMobile) {
            Object.assign(button.style, {
                width: '36px',
                height: '36px',
                fontSize: '14px',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            });
        } else {
            Object.assign(button.style, {
                width: '20px',
                height: '20px',
                fontSize: '10px',
                borderRadius: '0',
                boxShadow: 'none'
            });
        }
    });
}

// キャラクター検出設定
const CHARACTER_SELECTORS = [
    '#purattokun-canvas',           // メインキャラクター
    '#purattokun-fallback',         // フォールバック要素
    'canvas[data-spine-character]', // Spineキャラクター全般
    '.spine-character',             // クラス指定キャラクター
    '[data-character-name]'         // data属性キャラクター
];

// ========== キャラクター検出システム ========== //
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
                    zIndex: 1000, // 🆕 レイヤー管理用z-index（初期値・後でapplyZIndexToAllCharactersで調整）
                    originalOrder: characters.length    // 🆕 元の検出順序を保持
                };
                characters.push(characterData);
                console.log('✅ キャラクター検出:', characterData.name, '(', selector, ')');
            }
        });
    });
    
    console.log(`🎯 検出完了: ${characters.length}個のキャラクター`);
    
    // 🆕 初期z-indexを適用
    applyZIndexToAllCharacters();
    
    // 🎯 キャラクター直接クリック選択機能を設定
    setupCharacterClickSelection();
    
    // アクティブキャラクターを設定（最初のキャラクター）
    if (characters.length > 0) {
        setActiveCharacter(0);
    }
    
    return characters;
}

function setActiveCharacter(index) {
    if (index < 0 || index >= characters.length) {
        console.error('❌ 無効なキャラクターインデックス:', index);
        return false;
    }
    
    // 🚨 修正: 現在のドラッグイベントを先にクリア
    if (character && isDragging) {
        endDrag(); // 強制的にドラッグ終了
    }
    
    // 現在のアクティブ状態をクリア
    characters.forEach(char => {
        char.isActive = false;
        removeCharacterHighlight(char.element);
        // 🚨 修正: 全てのキャラクターからドラッグイベントを削除（マウス・タッチ対応）
        char.element.removeEventListener('mousedown', startDrag);
        char.element.removeEventListener('touchstart', startDrag);
        char.element.style.cursor = isEditMode ? 'default' : 'default';
    });
    
    // 新しいアクティブキャラクターを設定
    activeCharacterIndex = index;
    const activeChar = characters[index];
    activeChar.isActive = true;
    
    // グローバル変数（後方互換性）を更新
    character = activeChar.element;
    currentScale = activeChar.scale;
    
    // 🚨 修正: アクティブキャラクターにのみドラッグイベントを追加（マウス・タッチ対応）
    if (isEditMode) {
        character.style.cursor = 'move';
        character.addEventListener('mousedown', startDrag);
        character.addEventListener('touchstart', startDrag, { passive: false });
        console.log('🎯 ドラッグイベントを設定:', activeChar.name);
    }
    
    // ハイライト表示
    addCharacterHighlight(activeChar.element);
    
    console.log('🎯 アクティブキャラクター変更:', activeChar.name);
    
    // スケールパネルのUI更新
    updateScalePanelForActiveCharacter();
    
    // リアルタイムプレビュー更新
    updateRealtimePreview();
    
    return true;
}

// ========== 🆕 レイヤー順序制御システム ========== //
function applyZIndexToAllCharacters() {
    characters.forEach((char, index) => {
        // 直感的な順序：配列の先頭（リスト上部）が最前面になるよう逆転
        char.zIndex = 1000 + (characters.length - 1 - index);
        char.element.style.zIndex = char.zIndex;
        console.log(`🔢 z-index設定: ${char.name} (位置${index}) → z-index:${char.zIndex}`);
    });
}

// 🎯 キャラクター直接クリック選択機能
function setupCharacterClickSelection() {
    console.log('🎯 キャラクター直接クリック選択機能を設定中...');
    
    characters.forEach((char, index) => {
        // 既存のイベントリスナーを完全にクリーンアップ（重複防止・メモリリーク防止）
        if (char.clickHandler) {
            char.element.removeEventListener('click', char.clickHandler);
            char.element.removeEventListener('touchend', char.clickHandler);
        }
        if (char.mouseEnterHandler) {
            char.element.removeEventListener('mouseenter', char.mouseEnterHandler);
        }
        if (char.mouseLeaveHandler) {
            char.element.removeEventListener('mouseleave', char.mouseLeaveHandler);
        }
        
        // 新しいクリックハンドラーを作成
        char.clickHandler = (event) => handleCharacterClick(event, index);
        
        // クリックイベントリスナーを追加
        char.element.addEventListener('click', char.clickHandler);
        
        // 🎯 タッチイベントもサポート（モバイル対応）
        char.element.addEventListener('touchend', (event) => {
            // タッチ終了時にクリック処理実行（ドラッグと区別）
            if (!isDragging) {
                char.clickHandler(event);
            }
        });
        
        // マウスホバー効果（編集モード時のみ・デスクトップのみ）
        if (!isMobile) {
            char.mouseEnterHandler = () => {
                if (isEditMode && index !== activeCharacterIndex) {
                    char.element.style.filter = 'brightness(1.1) drop-shadow(0 0 5px rgba(255, 255, 255, 0.5))';
                    char.element.style.cursor = 'pointer';
                }
            };
            
            char.mouseLeaveHandler = () => {
                if (isEditMode && index !== activeCharacterIndex) {
                    char.element.style.filter = '';
                    char.element.style.cursor = 'default';
                }
            };
            
            char.element.addEventListener('mouseenter', char.mouseEnterHandler);
            char.element.addEventListener('mouseleave', char.mouseLeaveHandler);
        }
        
        console.log(`✅ クリック選択設定完了: ${char.name} (index: ${index})`);
    });
}

// 🎯 キャラクタークリック処理
function handleCharacterClick(event, characterIndex) {
    console.log(`🎯 キャラクタークリック検出: ${characters[characterIndex].name} (index: ${characterIndex})`);
    
    // 編集モードでない場合は通常のクリック動作
    if (!isEditMode) {
        console.log('📝 編集モードではないため、通常のクリック動作を実行');
        return;
    }
    
    // イベントの伝播を防止（ドラッグと競合しないように）
    event.preventDefault();
    event.stopPropagation();
    
    // すでに選択されているキャラクターの場合はスキップ
    if (characterIndex === activeCharacterIndex) {
        console.log('✨ すでに選択されているキャラクターです');
        return;
    }
    
    // レイヤー重複チェック（最上位レイヤーかどうか）
    const clickedChar = characters[characterIndex];
    const topMostChar = getTopMostCharacterAtPosition(event.clientX, event.clientY);
    
    if (topMostChar && topMostChar.index !== characterIndex) {
        console.log(`🔝 より上位のキャラクター "${topMostChar.name}" が検出されました`);
        characterIndex = topMostChar.index;
    }
    
    // キャラクター選択を実行
    console.log(`🎯 キャラクター選択実行: ${characters[characterIndex].name}`);
    setActiveCharacter(characterIndex);
    
    // 右パネルの選択状態を同期
    updateCharacterSelectionUI(characterIndex);
    
    // 視覚的フィードバック
    showCharacterSelectionFeedback(characterIndex);
}

// 🔝 指定座標で最上位のキャラクターを取得
function getTopMostCharacterAtPosition(clientX, clientY) {
    let topMostChar = null;
    let highestZIndex = -1;
    
    characters.forEach((char, index) => {
        const rect = char.element.getBoundingClientRect();
        
        // クリック座標がキャラクターの範囲内かチェック
        if (clientX >= rect.left && clientX <= rect.right &&
            clientY >= rect.top && clientY <= rect.bottom) {
            
            if (char.zIndex > highestZIndex) {
                highestZIndex = char.zIndex;
                topMostChar = {
                    index: index,
                    name: char.name,
                    zIndex: char.zIndex
                };
            }
        }
    });
    
    return topMostChar;
}

// 🎯 右パネルの選択状態を同期
function updateCharacterSelectionUI(selectedIndex) {
    console.log(`🔄 右パネル選択状態を同期: ${characters[selectedIndex].name} (index: ${selectedIndex})`);
    
    // 既存の updateCharacterSelectPanel() を利用してUI全体を更新
    updateCharacterSelectPanel();
}

// ✨ キャラクター選択の視覚的フィードバック
function showCharacterSelectionFeedback(selectedIndex) {
    const selectedChar = characters[selectedIndex];
    console.log(`✨ 選択フィードバック表示: ${selectedChar.name}`);
    
    // 一時的な選択フィードバック（光る効果）
    const originalFilter = selectedChar.element.style.filter;
    const originalTransition = selectedChar.element.style.transition;
    
    // アニメーション設定
    selectedChar.element.style.transition = 'filter 0.3s ease';
    selectedChar.element.style.filter = 'brightness(1.3) drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))';
    
    // 0.5秒後に元に戻す
    setTimeout(() => {
        selectedChar.element.style.filter = originalFilter;
        setTimeout(() => {
            selectedChar.element.style.transition = originalTransition;
        }, 300);
    }, 500);
    
    // コンソールにもフィードバック
    console.log(`🎯 "${selectedChar.name}" が選択されました`);
}

// 🔧 デバッグ用：クリック選択機能のテスト
function testCharacterClickSelection() {
    console.log('🧪 キャラクタークリック選択機能テスト開始');
    console.log(`📊 設定済みキャラクター数: ${characters.length}`);
    
    characters.forEach((char, index) => {
        const hasClickHandler = !!char.clickHandler;
        const hasMouseHandlers = !!char.mouseEnterHandler && !!char.mouseLeaveHandler;
        console.log(`${index + 1}. ${char.name}:`, {
            clickHandler: hasClickHandler,
            mouseHandlers: hasMouseHandlers || 'mobile',
            zIndex: char.zIndex,
            isActive: char.isActive
        });
    });
    
    console.log('💡 テスト方法: 編集モードでキャラクターを直接クリックしてください');
}

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
    updateCharacterSelectPanel();
    
    // 🆕 レイヤー順序変更を記録
    markAsChanged();
    
    console.log(`✅ レイヤー移動完了: 新しいアクティブインデックス ${activeCharacterIndex}`);
    return true;
}

function bringCharacterToFront(index) {
    if (index < 0 || index >= characters.length) return false;
    
    const targetCharacter = characters[index];
    console.log(`⬆️ 最前面に移動: ${targetCharacter.name}`);
    
    return moveCharacterInLayer(index, characters.length - 1);
}

function sendCharacterToBack(index) {
    if (index < 0 || index >= characters.length) return false;
    
    const targetCharacter = characters[index];
    console.log(`⬇️ 最背面に移動: ${targetCharacter.name}`);
    
    return moveCharacterInLayer(index, 0);
}

// 🆕 統合メニュー用レイヤー制御関数
function moveCharacterLayer(index, direction) {
    if (index < 0 || index >= characters.length) {
        console.error('❌ 無効なキャラクターインデックス:', index);
        return false;
    }
    
    const character = characters[index];
    console.log(`🔄 レイヤー移動: ${character.name} を ${direction === 'up' ? '上' : '下'} に移動`);
    
    let targetIndex;
    if (direction === 'up') {
        // 上に移動 = より前面に = インデックスを減らす（配列先頭が最前面のため）
        targetIndex = Math.max(index - 1, 0);
    } else if (direction === 'down') {
        // 下に移動 = より背面に = インデックスを増やす（配列後方が最背面のため）
        targetIndex = Math.min(index + 1, characters.length - 1);
    } else {
        console.error('❌ 無効な方向:', direction);
        return false;
    }
    
    // 移動不要の場合
    if (targetIndex === index) {
        console.log(`💡 ${character.name} は既に${direction === 'up' ? '最前面' : '最背面'}です`);
        return false;
    }
    
    // レイヤー移動実行
    const success = moveCharacterInLayer(index, targetIndex);
    if (success) {
        console.log(`✅ レイヤー移動完了: ${character.name} (${index} → ${targetIndex})`);
    }
    
    return success;
}

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
        if (pos.name === 'center') {
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                startDrag(e);
            });
            handle.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                startDrag(e);
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
                position: absolute;
                pointer-events: none;
                z-index: 10001;
            }
            
            .character-drag-handle {
                pointer-events: auto !important;
            }
            
            .character-highlight-border {
                width: 100%;
                height: 100%;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 要素の位置とサイズに合わせてハイライトコンテナを配置
    updateHighlightPosition(element, highlightContainer);
    
    // コンテナを要素の親に追加
    element.parentElement.appendChild(highlightContainer);
    
    // 要素にコンテナの参照を保存
    element._highlightContainer = highlightContainer;
    
    console.log('✨ 強化されたハイライト適用:', element.id || 'unknown', '(9個のハンドル付き)');
}

// ハイライト位置更新関数
function updateHighlightPosition(element, highlightContainer) {
    if (!element || !highlightContainer) return;
    
    const rect = element.getBoundingClientRect();
    const parentRect = element.parentElement.getBoundingClientRect();
    
    // 相対位置計算
    const left = rect.left - parentRect.left;
    const top = rect.top - parentRect.top;
    
    highlightContainer.style.cssText = `
        position: absolute;
        left: ${left}px;
        top: ${top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        pointer-events: none;
        z-index: 10001;
    `;
}

function removeCharacterHighlight(element) {
    if (!element) return;
    
    // クラス削除
    element.classList.remove('character-highlighted');
    
    // 旧スタイルをクリア
    element.style.outline = '';
    element.style.outlineOffset = '';
    element.style.boxShadow = '';
    
    // 新しいハイライトコンテナを削除
    if (element._highlightContainer) {
        element._highlightContainer.remove();
        element._highlightContainer = null;
        console.log('🗑️ ハイライトコンテナを削除:', element.id || 'unknown');
    }
    
    // 同じキャラクターIDのハイライトコンテナをすべて削除（念のため）
    const characterId = element.id || 'unknown';
    const existingContainers = document.querySelectorAll(`[data-character-id="${characterId}"]`);
    existingContainers.forEach(container => {
        if (container.classList.contains('character-highlight-container')) {
            container.remove();
        }
    });
}

function updateScalePanelForActiveCharacter() {
    const slider = document.getElementById('scale-slider');
    const numberInput = document.getElementById('scale-input');
    
    if (slider && numberInput && characters[activeCharacterIndex]) {
        const activeChar = characters[activeCharacterIndex];
        slider.value = activeChar.scale;
        numberInput.value = activeChar.scale.toFixed(2);
        currentScale = activeChar.scale; // グローバル変数も同期
    }
}

// ========== 初期化 ========== //
function initializeMinimalEditSystem() {
    console.log('🔧 最小限編集システム初期化開始');
    
    try {
        // 複数キャラクター検出
        detectCharacters();
    
    // 後方互換性：従来のcharacter変数設定
    if (characters.length === 0) {
        // フォールバック: 従来の方法でキャラクター取得
        character = document.querySelector('#purattokun-canvas');
        if (!character) {
            console.error('❌ キャラクター要素が見つかりません');
            character = document.querySelector('#purattokun-fallback') || 
                       document.querySelector('canvas[data-spine-character]');
            
            if (character) {
                console.log('✅ フォールバック要素を発見:', character.tagName + (character.id ? '#' + character.id : ''));
                // 手動でcharacters配列に追加
                characters.push({
                    element: character,
                    id: character.id || 'fallback-character',
                    name: character.id || 'フォールバックキャラクター',
                    selector: 'fallback',
                    scale: 1.0,
                    isActive: true
                });
                activeCharacterIndex = 0;
            } else {
                console.error('❌ すべてのキャラクター要素が見つかりません');
                return;
            }
        }
    }
    
    // CSSサイズ設定を削除（Spine側でサイズ制御）
    character.style.width = '';
    character.style.height = '';
    character.style.aspectRatio = '';
    
        // 編集ボタンの作成
        createEditButton();
        
        console.log('✅ 最小限編集システム初期化完了');
        
        // 初期化成功確認
        setTimeout(() => {
            const editButton = document.getElementById('minimal-edit-button');
            if (!editButton) {
                console.error('❌ 重大エラー: 編集ボタンが見つかりません！createEditButton()が失敗している可能性があります');
                console.error('DOM状態:', document.readyState);
                console.error('Body要素存在:', !!document.body);
            } else {
                console.log('✅ 編集ボタン確認OK:', editButton.textContent);
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ 編集システム初期化エラー:', error);
        console.error('エラー詳細:', {
            message: error.message,
            stack: error.stack,
            characters: characters.length,
            domReady: document.readyState,
            bodyExists: !!document.body
        });
    }
}

// ========== UI作成 ========== //
function createEditButton() {
    console.log('🔧 編集ボタン作成開始');
    
    try {
        if (!document.body) {
            throw new Error('document.bodyが存在しません');
        }
        
        // 編集ボタン
        const button = document.createElement('button');
    button.id = 'minimal-edit-button';
    button.textContent = '位置編集';
    button.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 10px 20px;
        background: #ff6b6b;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        z-index: 10000;
        font-size: 14px;
    `;
    
        button.addEventListener('click', toggleEditMode);
        document.body.appendChild(button);
        console.log('✅ 編集ボタンをDOMに追加しました');
        
        // 🆕 一時保存ボタン（編集モード時のみ表示）
    const tempSaveButton = document.createElement('button');
    tempSaveButton.id = 'temp-save-button';
    tempSaveButton.textContent = '💾 一時保存';
    tempSaveButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 120px;
        padding: 8px 16px;
        background: #2196F3;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        z-index: 10000;
        font-size: 12px;
        display: none;
        transition: all 0.2s ease;
    `;
    
    tempSaveButton.addEventListener('click', showTempSaveDialog);
    tempSaveButton.addEventListener('mouseenter', () => {
        tempSaveButton.style.background = '#1976D2';
        tempSaveButton.style.transform = 'translateY(-1px)';
    });
    tempSaveButton.addEventListener('mouseleave', () => {
        tempSaveButton.style.background = '#2196F3';
        tempSaveButton.style.transform = 'translateY(0)';
    });
    document.body.appendChild(tempSaveButton);
    
    // キャラクター選択パネル
    createCharacterSelectPanel();
    
    // スケール調整パネル
    createScalePanel();
    
    // 🆕 独立したリアルタイムプレビューパネル（統合メニューから分離）
    createIndependentRealtimePreviewPanel();
    
    // 独立プレビューパネルを即座に表示
    const independentPreview = document.getElementById('independent-realtime-preview');
    if (independentPreview) {
        independentPreview.style.display = 'block';
        updateIndependentRealtimePreview();
        console.log('✅ 独立リアルタイムプレビューパネル即座表示');
    }
        
        console.log('✅ 全ての編集UI作成完了');
        
    } catch (error) {
        console.error('❌ 編集ボタン作成エラー:', error);
        console.error('エラー詳細:', {
            message: error.message,
            stack: error.stack,
            bodyExists: !!document.body,
            domReady: document.readyState
        });
    }
}

function createCharacterSelectPanel() {
    const panel = document.createElement('div');
    panel.id = 'character-select-panel';
    panel.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        z-index: 10000;
        display: none;
        min-width: 200px;
        font-size: 14px;
        top: 60px;
        right: 10px;
    `;
    
    document.body.appendChild(panel);
    updateCharacterSelectPanel();
    
    // 🆕 モバイルスタイル適用
    applyMobileStyles();
}

function updateCharacterSelectPanel() {
    const panel = document.getElementById('character-select-panel');
    if (!panel) return;
    
    let html = '<div style="margin-bottom: 8px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 4px;">🎭 キャラクター & レイヤー管理</div>';
    
    if (characters.length === 0) {
        html += '<div style="color: #999; font-style: italic;">キャラクターが見つかりません</div>';
    } else {
        // 🆕 レイヤー制御説明
        html += '<div style="font-size: 11px; color: #666; margin-bottom: 8px; padding: 4px; background: #f9f9f9; border-radius: 3px;">ドラッグで並び替え：上ほど前面に表示</div>';
        
        characters.forEach((char, index) => {
            const isActive = index === activeCharacterIndex;
            const statusIcon = isActive ? '🎯' : '⚪';
            
            html += `
                <div class="character-select-item" 
                     data-index="${index}" 
                     draggable="true"
                     style="padding: 6px 8px; margin: 2px 0; border-radius: 3px; cursor: move; 
                            background: ${isActive ? '#e3f2fd' : 'transparent'}; 
                            border: ${isActive ? '2px solid #ff6b6b' : '1px solid #eee'};
                            display: flex; align-items: center; gap: 8px;
                            transition: all 0.2s ease;">
                    <span style="font-size: 12px; color: #999;">≡</span>
                    <span style="font-size: 16px;">${statusIcon}</span>
                    <div style="flex: 1;">
                        <div style="font-weight: ${isActive ? 'bold' : 'normal'}; color: ${isActive ? '#ff6b6b' : '#333'};">
                            ${char.name}
                        </div>
                        <div style="font-size: 11px; color: #666;">
                            z-index: ${char.zIndex} • Scale: ${char.scale.toFixed(2)}
                        </div>
                    </div>
                    <div style="display: flex; gap: 2px;">
                        <button class="layer-btn" data-action="front" data-index="${index}" 
                                style="width: 20px; height: 20px; font-size: 10px; padding: 0; border: 1px solid #ddd; background: white; cursor: pointer;
                                       /* モバイル最適化 */
                                       @media (max-width: 768px) {
                                           width: 36px; 
                                           height: 36px; 
                                           font-size: 14px;
                                           border-radius: 4px;
                                           box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                       }" title="最前面">⬆</button>
                        <button class="layer-btn" data-action="back" data-index="${index}" 
                                style="width: 20px; height: 20px; font-size: 10px; padding: 0; border: 1px solid #ddd; background: white; cursor: pointer;
                                       /* モバイル最適化 */
                                       @media (max-width: 768px) {
                                           width: 36px; 
                                           height: 36px; 
                                           font-size: 14px;
                                           border-radius: 4px;
                                           box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                       }" title="最背面">⬇</button>
                    </div>
                </div>
            `;
        });
        
        // 統計情報
        html += `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                検出: ${characters.length}個のキャラクター • レイヤー順序: 1000-${999 + characters.length}
            </div>
        `;
    }
    
    panel.innerHTML = html;
    
    // 🆕 ドラッグ&ドロップとイベントハンドラを追加
    setupCharacterPanelEvents(panel);
    
    // 🆕 モバイルスタイル適用（レイヤーボタン含む）
    applyMobileStyles();
}

// 🆕 キャラクターパネルのイベント設定（ドラッグ&ドロップ + ボタン + タッチ最適化）
function setupCharacterPanelEvents(panel) {
    let draggedItem = null;
    let draggedIndex = -1;
    
    // 🆕 タッチ専用変数
    let touchStartY = 0;
    let touchStartX = 0;
    let touchMoved = false;
    let touchStartTime = 0;
    
    panel.querySelectorAll('.character-select-item').forEach(item => {
        const index = parseInt(item.dataset.index);
        
        // 🎯 キャラクター選択（クリック + タッチ最適化）
        item.addEventListener('click', (e) => {
            // レイヤーボタンのクリックは除外
            if (e.target.classList.contains('layer-btn')) return;
            // タッチドラッグ後のクリックは除外
            if (touchMoved) return;
            
            if (setActiveCharacter(index)) {
                updateCharacterSelectPanel(); // UI更新
                console.log('👆 キャラクター選択:', characters[index].name);
            }
        });
        
        // 🆕 タッチ開始（タッチドラッグ用）
        item.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            touchStartY = touch.clientY;
            touchStartX = touch.clientX;
            touchStartTime = Date.now();
            touchMoved = false;
            
            // 長押し検出（300ms後にドラッグモード開始）
            setTimeout(() => {
                if (!touchMoved && Math.abs(Date.now() - touchStartTime - 300) < 50) {
                    draggedItem = item;
                    draggedIndex = index;
                    item.style.opacity = '0.7';
                    item.style.transform = 'scale(1.05)';
                    console.log('📱 タッチドラッグ開始:', characters[index].name);
                }
            }, 300);
        }, { passive: true });
        
        // 🆕 タッチ移動
        item.addEventListener('touchmove', (e) => {
            e.preventDefault(); // スクロール防止
            const touch = e.touches[0];
            const deltaY = Math.abs(touch.clientY - touchStartY);
            const deltaX = Math.abs(touch.clientX - touchStartX);
            
            if (deltaY > 10 || deltaX > 10) {
                touchMoved = true;
            }
            
            // ドラッグ中の視覚的フィードバック
            if (draggedItem === item) {
                const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
                const targetItem = elementUnderTouch?.closest('.character-select-item');
                
                // 全アイテムのハイライトをクリア
                panel.querySelectorAll('.character-select-item').forEach(otherItem => {
                    if (otherItem !== item) {
                        const otherIndex = parseInt(otherItem.dataset.index);
                        otherItem.style.background = otherIndex === activeCharacterIndex ? '#e3f2fd' : 'transparent';
                    }
                });
                
                // ターゲットアイテムをハイライト
                if (targetItem && targetItem !== item) {
                    targetItem.style.background = '#ffe0e0';
                }
            }
        }, { passive: false });
        
        // 🆕 タッチ終了
        item.addEventListener('touchend', (e) => {
            if (draggedItem === item) {
                const touch = e.changedTouches[0];
                const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
                const targetItem = elementUnderTouch?.closest('.character-select-item');
                
                if (targetItem && targetItem !== item) {
                    const targetIndex = parseInt(targetItem.dataset.index);
                    if (moveCharacterInLayer(draggedIndex, targetIndex)) {
                        console.log('📱 タッチドラッグ完了:', characters[draggedIndex].name, '→', characters[targetIndex].name);
                    }
                }
                
                // ドラッグ状態をリセット
                item.style.opacity = '1';
                item.style.transform = 'scale(1)';
                draggedItem = null;
                draggedIndex = -1;
            }
            
            // 300ms後にタッチ状態をリセット（クリックイベント処理後）
            setTimeout(() => {
                touchMoved = false;
            }, 300);
        }, { passive: true });
        
        // 🖱️ ホバー効果
        item.addEventListener('mouseenter', (e) => {
            if (index !== activeCharacterIndex) {
                e.currentTarget.style.background = '#f5f5f5';
            }
        });
        
        item.addEventListener('mouseleave', (e) => {
            if (index !== activeCharacterIndex) {
                e.currentTarget.style.background = 'transparent';
            }
        });
        
        // 🔄 ドラッグ開始
        item.addEventListener('dragstart', (e) => {
            draggedItem = e.currentTarget;
            draggedIndex = index;
            e.currentTarget.style.opacity = '0.5';
            console.log('🎯 ドラッグ開始:', characters[index].name);
        });
        
        // 🔄 ドラッグ終了
        item.addEventListener('dragend', (e) => {
            e.currentTarget.style.opacity = '1';
            draggedItem = null;
            draggedIndex = -1;
        });
        
        // 🎯 ドロップターゲット（他のアイテム上）
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedIndex !== -1 && draggedIndex !== index) {
                e.currentTarget.style.background = '#ffe0e0';
            }
        });
        
        item.addEventListener('dragleave', (e) => {
            if (index !== activeCharacterIndex) {
                e.currentTarget.style.background = 'transparent';
            } else {
                e.currentTarget.style.background = '#e3f2fd';
            }
        });
        
        // 🎯 ドロップ実行
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            
            if (draggedIndex !== -1 && draggedIndex !== index) {
                console.log(`🔄 レイヤー並び替え: ${characters[draggedIndex].name} → ${characters[index].name} の位置`);
                
                if (moveCharacterInLayer(draggedIndex, index)) {
                    console.log('✅ ドラッグ&ドロップによるレイヤー移動完了');
                } else {
                    console.error('❌ ドラッグ&ドロップ移動失敗');
                }
            }
        });
    });
    
    // 🔘 レイヤー制御ボタン
    panel.querySelectorAll('.layer-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // クリックイベントの伝播を停止
            
            const action = e.target.dataset.action;
            const index = parseInt(e.target.dataset.index);
            
            console.log(`🔘 レイヤーボタン押下: ${action} for ${characters[index].name}`);
            
            if (action === 'front') {
                bringCharacterToFront(index);
            } else if (action === 'back') {
                sendCharacterToBack(index);
            }
        });
        
        // ボタンホバー効果
        btn.addEventListener('mouseenter', (e) => {
            e.target.style.background = '#f0f0f0';
        });
        
        btn.addEventListener('mouseleave', (e) => {
            e.target.style.background = 'white';
        });
    });
}

// スケール調整パネル
function createScalePanel() {
    const panel = document.createElement('div');
    panel.id = 'scale-adjust-panel';
    panel.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        z-index: 10000;
        display: none;
        font-size: 14px;
        top: 280px;
        right: 10px;
    `;
    
    panel.innerHTML = `
        <div style="margin-bottom: 8px;">
            <label style="display: block; margin-bottom: 4px;">スケール:</label>
            <div style="display: flex; align-items: center; gap: 8px;">
                <input type="range" id="scale-slider" min="0.1" max="3" step="0.05" value="${currentScale}" style="width: 100px;">
                <input type="number" id="scale-input" min="0.1" max="3" step="0.05" value="${currentScale.toFixed(2)}" style="width: 60px; padding: 2px 4px; font-size: 12px;">
            </div>
        </div>
        <div style="text-align: center; margin-top: 8px;">
            <button id="scale-reset-btn" style="padding: 4px 12px; font-size: 12px;">リセット (1.0)</button>
            <button id="scale-test-btn" style="padding: 4px 12px; font-size: 12px; margin-left: 4px;">テスト</button>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // 🆕 モバイルスタイル適用
    applyMobileStyles();
    
    // スライダー・入力要素イベント
    const slider = document.getElementById('scale-slider');
    const numberInput = document.getElementById('scale-input');
    const resetBtn = document.getElementById('scale-reset-btn');
    const testBtn = document.getElementById('scale-test-btn');
    
    // スケール更新共通関数
    function updateScale(newScale) {
        currentScale = newScale;
        slider.value = newScale;
        numberInput.value = newScale.toFixed(2);
        
        // アクティブキャラクターのスケールを更新
        if (character && characters[activeCharacterIndex]) {
            // characters配列のスケール値も更新
            characters[activeCharacterIndex].scale = newScale;
            
            // 直接CSSでスケール調整
            const baseTransform = 'translate(-50%, -50%)';
            character.style.transform = `${baseTransform} scale(${newScale})`;
            console.log('🔧 スケール更新:', {
                character: characters[activeCharacterIndex].name,
                element: character.tagName + (character.id ? '#' + character.id : ''),
                newScale: newScale,
                appliedTransform: character.style.transform,
                characterExists: !!character,
                elementRect: character.getBoundingClientRect()
            });
            
            // キャラクター選択パネルのUI更新
            updateCharacterSelectPanel();
            
            // リアルタイムプレビュー更新
            updateRealtimePreview();
            
            // 🆕 スケール変更を記録
            markAsChanged();
        } else {
            console.error('❌ アクティブキャラクターまたはcharacter要素がnullです - スケール更新失敗');
        }
    }
    
    // スライダーイベント
    slider.addEventListener('input', (e) => {
        const newScale = parseFloat(e.target.value);
        updateScale(newScale);
    });
    
    // 数値入力イベント
    numberInput.addEventListener('input', (e) => {
        const newScale = parseFloat(e.target.value);
        if (newScale >= 0.1 && newScale <= 3) {
            updateScale(newScale);
        }
    });
    
    // リセットボタン
    resetBtn.addEventListener('click', () => {
        updateScale(1.0);
        console.log('🔄 スケールリセット: 1.0');
    });
    
    // テストボタン（診断機能）
    testBtn.addEventListener('click', () => {
        console.log('🧪 === スケールテスト開始 ===');
        
        if (!character) {
            console.error('❌ character要素がnull');
            alert('キャラクター要素が見つかりません');
            return;
        }
        
        const computedStyle = window.getComputedStyle(character);
        const rect = character.getBoundingClientRect();
        
        console.log('📊 現在の状態:', {
            element: character.tagName + (character.id ? '#' + character.id : ''),
            inlineTransform: character.style.transform,
            computedTransform: computedStyle.transform,
            boundingRect: { width: rect.width, height: rect.height },
            currentScale: currentScale
        });
        
        // 2倍スケールテスト
        const originalScale = currentScale;
        updateScale(2.0);
        
        setTimeout(() => {
            const newRect = character.getBoundingClientRect();
            console.log('📏 2倍スケール後:', { width: newRect.width, height: newRect.height });
            alert(`スケールテスト完了\n元サイズ: ${rect.width}x${rect.height}\n2倍後: ${newRect.width}x${newRect.height}`);
            
            // 元に戻す
            updateScale(originalScale);
        }, 2000);
    });
}

// リアルタイムプレビューパネル
function createRealtimePreviewPanel() {
    const panel = document.createElement('div');
    panel.id = 'realtime-preview-panel';
    panel.style.cssText = `
        position: fixed;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        border: 1px solid #555;
        border-radius: 6px;
        padding: 12px;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        z-index: 10000;
        display: none;
        min-width: 200px;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        
        /* デスクトップ配置 */
        bottom: 10px;
        right: 10px;
        
        /* モバイル配置 */
        @media (max-width: 768px) {
            top: auto;
            right: auto;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            min-width: 280px;
            max-width: calc(100vw - 20px);
            z-index: 10001; /* 最下位 */
            font-size: 12px;
            padding: 10px;
        }
    `;
    
    panel.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: bold; color: #ff6b6b; border-bottom: 1px solid #444; padding-bottom: 4px;">
            📍 リアルタイムプレビュー
        </div>
        <div id="preview-character-name" style="color: #4CAF50; margin-bottom: 6px;">
            キャラクター: 未選択
        </div>
        <div id="preview-position" style="margin-bottom: 4px;">
            位置: --%, --%
        </div>
        <div id="preview-scale" style="margin-bottom: 4px;">
            スケール: --
        </div>
        <div id="preview-size" style="margin-bottom: 4px;">
            サイズ: --x--px
        </div>
        <div id="preview-mouse" style="margin-bottom: 4px;">
            マウス: ---, ---
        </div>
        <div id="preview-status" style="color: #888;">
            待機中...
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // 🆕 モバイルスタイル適用
    applyMobileStyles();
}

// 🆕 独立したリアルタイムプレビューパネル（統合メニューから分離）
function createIndependentRealtimePreviewPanel() {
    // 既存のプレビューパネルがあれば削除
    const existingPanel = document.getElementById('independent-realtime-preview');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    const panel = document.createElement('div');
    panel.id = 'independent-realtime-preview';
    
    const isMobile = window.innerWidth <= 768;
    
    // キャラクター・スケールパネルの下に配置（改良版）
    panel.style.cssText = `
        position: fixed;
        ${isMobile ? `
            left: 10px;
            bottom: 120px;
            right: 10px;
            width: auto;
            max-width: 350px;
        ` : `
            right: 20px;
            bottom: 20px;
            width: 280px;
        `}
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #ddd;
        border-left: 3px solid #4CAF50;
        border-radius: 8px;
        backdrop-filter: blur(10px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        padding: ${isMobile ? '12px' : '15px'};
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: ${isMobile ? '12px' : '13px'};
        line-height: 1.5;
        color: #333;
        backdrop-filter: blur(10px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        z-index: 9998;
        display: block;
        transition: all 0.3s ease;
    `;
    
    panel.innerHTML = `
        <div style="
            margin-bottom: 10px; 
            font-weight: bold; 
            color: #4CAF50; 
            border-bottom: 2px solid #4CAF50; 
            padding-bottom: 6px;
            text-align: center;
            font-size: 14px;
        ">
            📊 リアルタイムプレビュー
        </div>
        <div id="independent-preview-character" style="
            color: #4CAF50; 
            margin-bottom: 6px;
            font-weight: 500;
        ">
            キャラクター: 未選択
        </div>
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px 8px; font-size: ${isMobile ? '10px' : '11px'};">
            <span style="color: #666;">📍 位置:</span>
            <span id="independent-preview-position">X: --, Y: --</span>
            
            <span style="color: #666;">📏 スケール:</span>
            <span id="independent-preview-scale">--</span>
            
            <span style="color: #666;">📐 サイズ:</span>
            <span id="independent-preview-size">-- x --</span>
            
            <span style="color: #666;">🏷️ Z-Index:</span>
            <span id="independent-preview-zindex">--</span>
        </div>
        <div style="
            font-size: ${isMobile ? '9px' : '10px'}; 
            color: #888; 
            border-top: 1px solid #ddd; 
            padding-top: 6px; 
            margin-top: 8px;
            text-align: center;
        ">
            💡 編集中の値をリアルタイム表示
        </div>
    `;
    
    document.body.appendChild(panel);
    console.log('✅ 独立リアルタイムプレビューパネル作成完了');
}

// 🆕 リアルタイムプレビューの位置を統合メニューの直下に正確に配置
function updateRealtimePreviewPosition(panel) {
    if (!panel) return;
    
    const isMobile = window.innerWidth <= 768;
    const slideMenu = document.getElementById('slide-menu-container');
    const slideMenuMain = document.getElementById('slide-menu-main');
    
    if (slideMenu && slideMenuMain) {
        // 統合メニューが存在する場合：メニューの直下にぴったり配置
        const menuRect = slideMenu.getBoundingClientRect();
        const mainRect = slideMenuMain.getBoundingClientRect();
        
        if (isMobile) {
            // モバイル：統合メニューの直下（底部の外側）に配置
            const bottomPosition = menuRect.bottom;
            Object.assign(panel.style, {
                position: 'fixed',
                top: `${bottomPosition}px`,
                left: `${menuRect.left}px`,
                width: `${menuRect.width}px`,
                height: 'auto',
                fontSize: '11px',
                padding: '8px',
                zIndex: '9999', // メニューより少し下に
                margin: '0',
                borderTop: '1px solid #4CAF50', // 統合メニューとの境界
                borderRadius: '0 0 8px 8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            });
        } else {
            // デスクトップ：統合メニューの直下（右端下部）に配置  
            const bottomPosition = menuRect.bottom;
            Object.assign(panel.style, {
                position: 'fixed',
                top: `${bottomPosition}px`,
                right: `${window.innerWidth - menuRect.right}px`,
                left: 'auto',
                width: `${menuRect.width}px`,
                height: 'auto',
                fontSize: '11px',
                padding: '8px',
                zIndex: '9999', // メニューより少し下に
                margin: '0',
                borderTop: '1px solid #4CAF50', // 統合メニューとの境界
                borderRadius: '0 0 15px 15px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
            });
        }
        
        console.log('📍 プレビューパネル位置更新:', {
            isMobile,
            menuRect: { bottom: menuRect.bottom, left: menuRect.left, width: menuRect.width },
            panelStyle: { top: panel.style.top, left: panel.style.left, width: panel.style.width }
        });
        
    } else {
        // 統合メニューが存在しない場合：従来の位置
        if (isMobile) {
            Object.assign(panel.style, {
                position: 'fixed',
                bottom: '10px',
                left: '10px',
                right: '10px',
                width: 'auto',
                fontSize: '11px',
                padding: '10px',
                zIndex: '10002'
            });
        } else {
            Object.assign(panel.style, {
                position: 'fixed',
                bottom: '10px',
                right: '10px',
                left: 'auto',
                width: '220px',
                fontSize: '11px',
                padding: '12px',
                zIndex: '10002'
            });
        }
    }
}

// 🆕 独立リアルタイムプレビュー更新関数
function updateIndependentRealtimePreview(data = {}) {
    const panel = document.getElementById('independent-realtime-preview');
    if (!panel || !isEditMode) return;
    
    const nameElement = document.getElementById('independent-preview-character');
    const positionElement = document.getElementById('independent-preview-position');
    const scaleElement = document.getElementById('independent-preview-scale');
    const sizeElement = document.getElementById('independent-preview-size');
    const zIndexElement = document.getElementById('independent-preview-zindex');
    
    if (!nameElement || !positionElement || !scaleElement || !sizeElement || !zIndexElement) {
        return;
    }
    
    // アクティブキャラクター取得
    const activeChar = characters[activeCharacterIndex];
    if (!activeChar) {
        nameElement.textContent = 'キャラクター: 未選択';
        positionElement.textContent = 'X: --, Y: --';
        scaleElement.textContent = '--';
        sizeElement.textContent = '-- x --';
        zIndexElement.textContent = '--';
        return;
    }
    
    const character = activeChar.element;
    if (!character) return;
    
    // キャラクター名
    nameElement.textContent = `キャラクター: ${activeChar.name}`;
    
    // 位置情報
    const rect = character.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(character);
    
    // カスタム座標があれば使用、なければ現在の位置
    const currentX = data.mouseX !== undefined ? data.mouseX : rect.left + rect.width / 2;
    const currentY = data.mouseY !== undefined ? data.mouseY : rect.top + rect.height / 2;
    
    positionElement.textContent = `X: ${Math.round(currentX)}, Y: ${Math.round(currentY)}`;
    
    // スケール情報
    const currentScale = activeChar.skeleton?.scaleX || parseFloat(computedStyle.transform.match(/scale\(([^)]+)\)/)?.[1]) || 1.0;
    scaleElement.textContent = `${currentScale.toFixed(2)}`;
    
    // サイズ情報
    const width = rect.width;
    const height = rect.height;
    sizeElement.textContent = `${Math.round(width)} x ${Math.round(height)}`;
    
    // Z-Index情報
    const zIndexValue = activeChar.zIndex || parseInt(computedStyle.zIndex) || 'auto';
    zIndexElement.textContent = `${zIndexValue}`;
}

// リアルタイムプレビュー更新（レガシー関数、互換性維持）
function updateRealtimePreview(data = {}) {
    // 🆕 独立プレビューを優先更新
    updateIndependentRealtimePreview(data);
    
    // 統合メニュー内の旧プレビューパネルは無効化（独立パネルに移行）
    const panel = document.getElementById('realtime-preview-panel');
    if (panel) {
        panel.style.display = 'none'; // 統合メニュー内のプレビューを非表示
    }
    if (!isEditMode) return;
    
    const nameElement = document.getElementById('preview-character-name');
    const positionElement = document.getElementById('preview-position');
    const scaleElement = document.getElementById('preview-scale');
    const sizeElement = document.getElementById('preview-size');
    const mouseElement = document.getElementById('preview-mouse');
    const statusElement = document.getElementById('preview-status');
    
    if (nameElement) {
        const activeChar = characters[activeCharacterIndex];
        nameElement.textContent = `キャラクター: ${activeChar ? activeChar.name : '未選択'}`;
    }
    
    if (character) {
        const rect = character.getBoundingClientRect();
        
        if (positionElement) {
            const left = character.style.left || '--';
            const top = character.style.top || '--';
            positionElement.textContent = `位置: ${left}, ${top}`;
        }
        
        if (scaleElement) {
            scaleElement.textContent = `スケール: ${currentScale.toFixed(2)}`;
        }
        
        if (sizeElement) {
            sizeElement.textContent = `サイズ: ${Math.round(rect.width)}x${Math.round(rect.height)}px`;
        }
    }
    
    if (mouseElement && data.mouseX !== undefined && data.mouseY !== undefined) {
        mouseElement.textContent = `マウス: ${Math.round(data.mouseX)}, ${Math.round(data.mouseY)}`;
    }
    
    if (statusElement) {
        if (isDragging) {
            statusElement.textContent = '🎯 ドラッグ中...';
            statusElement.style.color = '#ff6b6b';
        } else if (isEditMode) {
            statusElement.textContent = '✏️ 編集モード';
            statusElement.style.color = '#4CAF50';
        } else {
            statusElement.textContent = '待機中...';
            statusElement.style.color = '#888';
        }
    }
}

// ========== 🆕 編集状態管理システム ========== //

// 編集開始時の状態をスナップショット作成
function captureEditStartState() {
    console.log('📸 編集開始時の状態をキャプチャ');
    
    editStartState = {
        timestamp: Date.now(),
        activeCharacterIndex: activeCharacterIndex,
        characters: characters.map(char => ({
            id: char.id,
            name: char.name,
            scale: char.scale,
            zIndex: char.zIndex,
            position: {
                left: char.element.style.left,
                top: char.element.style.top,
                transform: char.element.style.transform
            }
        })),
        globalScale: currentScale
    };
    
    hasUnsavedChanges = false;
    console.log('✅ 編集開始状態をキャプチャ完了:', editStartState);
}

// 現在の状態をスナップショット作成
function captureCurrentState() {
    return {
        timestamp: Date.now(),
        activeCharacterIndex: activeCharacterIndex,
        characters: characters.map(char => ({
            id: char.id,
            name: char.name,
            scale: char.scale,
            zIndex: char.zIndex,
            position: {
                left: char.element.style.left,
                top: char.element.style.top,
                transform: char.element.style.transform
            }
        })),
        globalScale: currentScale
    };
}

// 変更検知：編集開始時と現在の状態を比較
function detectChanges() {
    if (!editStartState) {
        console.log('⚠️ 編集開始状態が記録されていません');
        return false;
    }
    
    const currentState = captureCurrentState();
    
    // 基本的な変更チェック
    if (editStartState.activeCharacterIndex !== currentState.activeCharacterIndex) {
        console.log('🔍 変更検知: アクティブキャラクター変更');
        return true;
    }
    
    if (editStartState.globalScale !== currentState.globalScale) {
        console.log('🔍 変更検知: グローバルスケール変更');
        return true;
    }
    
    // 各キャラクターの変更チェック
    for (let i = 0; i < Math.max(editStartState.characters.length, currentState.characters.length); i++) {
        const startChar = editStartState.characters[i];
        const currentChar = currentState.characters[i];
        
        if (!startChar || !currentChar) {
            console.log('🔍 変更検知: キャラクター数変更');
            return true;
        }
        
        // 位置変更チェック
        if (startChar.position.left !== currentChar.position.left || 
            startChar.position.top !== currentChar.position.top) {
            console.log(`🔍 変更検知: ${currentChar.name} の位置変更`);
            return true;
        }
        
        // スケール変更チェック
        if (startChar.scale !== currentChar.scale) {
            console.log(`🔍 変更検知: ${currentChar.name} のスケール変更`);
            return true;
        }
        
        // z-index変更チェック
        if (startChar.zIndex !== currentChar.zIndex) {
            console.log(`🔍 変更検知: ${currentChar.name} のレイヤー順序変更`);
            return true;
        }
    }
    
    console.log('🔍 変更検知: 変更なし');
    return false;
}

// 一時保存機能
function tempSave() {
    tempSaveData = captureCurrentState();
    console.log('💾 一時保存完了:', tempSaveData.timestamp);
    return tempSaveData;
}

// ロールバック機能：編集開始時の状態に戻す
function rollbackToEditStart() {
    if (!editStartState) {
        console.error('❌ ロールバック失敗: 編集開始状態が記録されていません');
        return false;
    }
    
    console.log('🔄 編集開始時の状態にロールバック開始');
    
    try {
        // アクティブキャラクターインデックスを復元
        if (editStartState.activeCharacterIndex !== activeCharacterIndex) {
            setActiveCharacter(editStartState.activeCharacterIndex);
        }
        
        // 各キャラクターの状態を復元
        editStartState.characters.forEach((startChar, index) => {
            if (characters[index] && characters[index].id === startChar.id) {
                const char = characters[index];
                
                // 位置復元
                char.element.style.left = startChar.position.left;
                char.element.style.top = startChar.position.top;
                char.element.style.transform = startChar.position.transform;
                
                // スケール復元
                char.scale = startChar.scale;
                
                // z-index復元
                char.zIndex = startChar.zIndex;
                char.element.style.zIndex = startChar.zIndex;
                
                console.log(`✅ ${char.name} の状態を復元`);
            }
        });
        
        // グローバルスケール復元
        currentScale = editStartState.globalScale;
        
        // UI要素を更新
        updateScalePanelForActiveCharacter();
        updateCharacterSelectPanel();
        updateRealtimePreview();
        
        hasUnsavedChanges = false;
        console.log('✅ ロールバック完了');
        return true;
        
    } catch (error) {
        console.error('❌ ロールバック中にエラーが発生:', error);
        return false;
    }
}

// 変更フラグの更新（ドラッグ・スケール変更時に呼び出し）
function markAsChanged() {
    hasUnsavedChanges = true;
    console.log('📝 変更フラグをON');
}

// ========== 🆕 改良された確認ダイアログシステム ========== //

// 編集終了確認ダイアログを表示
function showEditEndConfirmDialog() {
    return new Promise((resolve) => {
        // オーバーレイ作成
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            z-index: 10010;
            display: flex;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(3px);
            animation: fadeIn 0.3s ease;
        `;
        
        // ダイアログボックス作成
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 90%;
            padding: 0;
            animation: slideInUp 0.3s ease;
            font-family: system-ui, -apple-system, sans-serif;
        `;
        
        // 変更検知結果
        const hasChanges = detectChanges();
        const changesText = hasChanges ? 
            '<div style="color: #ff6b6b; font-weight: bold; margin-bottom: 8px;">📝 編集内容に変更があります</div>' :
            '<div style="color: #4CAF50; font-weight: bold; margin-bottom: 8px;">✅ 編集内容に変更はありません</div>';
        
        dialog.innerHTML = `
            <div style="padding: 24px 24px 16px 24px; border-bottom: 1px solid #eee;">
                <h3 style="margin: 0 0 12px 0; color: #333; font-size: 18px; font-weight: 600;">
                    🎯 編集モードを終了しますか？
                </h3>
                ${changesText}
                <div style="font-size: 14px; color: #666; line-height: 1.5;">
                    編集した内容を保存、破棄、または編集を継続できます。
                </div>
            </div>
            
            <div style="padding: 20px 24px;">
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <button id="dialog-save" style="
                        flex: 1;
                        min-width: 120px;
                        padding: 12px 16px;
                        background: #4CAF50;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                    ">
                        💾 保存して終了
                    </button>
                    
                    <button id="dialog-cancel" style="
                        flex: 1;
                        min-width: 120px;
                        padding: 12px 16px;
                        background: ${hasChanges ? '#ff6b6b' : '#999'};
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                    ">
                        ${hasChanges ? '🔄 破棄して終了' : '❌ そのまま終了'}
                    </button>
                    
                    <button id="dialog-continue" style="
                        flex: 1;
                        min-width: 120px;
                        padding: 12px 16px;
                        background: #2196F3;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                    ">
                        ✏️ 編集を継続
                    </button>
                </div>
                
                ${hasChanges ? `
                <div style="margin-top: 16px; padding: 12px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; font-size: 13px; color: #856404;">
                    <strong>💡 ヒント:</strong> 
                    「一時保存」機能で編集中の状態を保存し、後で復元することも可能です。
                </div>
                ` : ''}
            </div>
        `;
        
        // CSS アニメーション追加
        if (!document.getElementById('dialog-animations')) {
            const style = document.createElement('style');
            style.id = 'dialog-animations';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                @keyframes slideInUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(30px) scale(0.95); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0) scale(1); 
                    }
                }
                @keyframes slideOutDown {
                    from { 
                        opacity: 1; 
                        transform: translateY(0) scale(1); 
                    }
                    to { 
                        opacity: 0; 
                        transform: translateY(20px) scale(0.95); 
                    }
                }
                @keyframes slideInRight {
                    from { 
                        opacity: 0; 
                        transform: translateX(100%); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateX(0); 
                    }
                }
                @keyframes slideOutRight {
                    from { 
                        opacity: 1; 
                        transform: translateX(0); 
                    }
                    to { 
                        opacity: 0; 
                        transform: translateX(100%); 
                    }
                }
                .dialog-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
            `;
            document.head.appendChild(style);
        }
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // ボタンホバー効果
        const buttons = dialog.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'translateY(-1px)';
                btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = 'none';
            });
        });
        
        // イベントハンドラ設定
        const saveBtn = dialog.querySelector('#dialog-save');
        const cancelBtn = dialog.querySelector('#dialog-cancel');
        const continueBtn = dialog.querySelector('#dialog-continue');
        
        // ダイアログを閉じる共通処理
        const closeDialog = (result) => {
            overlay.style.animation = 'fadeOut 0.2s ease';
            dialog.style.animation = 'slideOutDown 0.2s ease';
            
            setTimeout(() => {
                document.body.removeChild(overlay);
                resolve(result);
            }, 200);
        };
        
        // 保存して終了
        saveBtn.addEventListener('click', () => {
            console.log('💾 ユーザー選択: 保存して終了');
            closeDialog('save');
        });
        
        // 破棄して終了（変更がある場合）/ そのまま終了（変更がない場合）
        cancelBtn.addEventListener('click', () => {
            if (hasChanges) {
                console.log('🔄 ユーザー選択: 破棄して終了');
                closeDialog('discard');
            } else {
                console.log('❌ ユーザー選択: そのまま終了');
                closeDialog('exit');
            }
        });
        
        // 編集を継続
        continueBtn.addEventListener('click', () => {
            console.log('✏️ ユーザー選択: 編集を継続');
            closeDialog('continue');
        });
        
        // ESCキーで編集継続
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                console.log('⌨️ ESCキー: 編集を継続');
                document.removeEventListener('keydown', handleEscape);
                closeDialog('continue');
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        // オーバーレイクリックで編集継続
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                console.log('🖱️ オーバーレイクリック: 編集を継続');
                closeDialog('continue');
            }
        });
    });
}

// 一時保存ダイアログ
function showTempSaveDialog() {
    const data = tempSave();
    
    // 簡単なトースト通知
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10020;
        font-size: 14px;
        font-weight: 600;
        animation: slideInRight 0.3s ease;
    `;
    toast.textContent = `💾 一時保存完了 (${new Date(data.timestamp).toLocaleTimeString()})`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
    
    return data;
}

// ========== 🆕 改良された編集モード切り替え ========== //
async function toggleEditMode() {
    const button = document.getElementById('minimal-edit-button');
    const scalePanel = document.getElementById('scale-adjust-panel');
    const characterPanel = document.getElementById('character-select-panel');
    
    if (!isEditMode) {
        // 編集モード開始
        console.log('📝 編集モード開始');
        isEditMode = true;
        
        // 編集開始時の状態をキャプチャ
        captureEditStartState();
        
        button.textContent = '編集終了';
        button.style.background = '#4CAF50';
        
        // アクティブキャラクターのみを編集可能にする（マウス・タッチ対応）
        if (character) {
            character.style.cursor = 'move';
            character.addEventListener('mousedown', startDrag);
            character.addEventListener('touchstart', startDrag, { passive: false });
            console.log('🎯 編集モード: ドラッグイベント設定完了 -', characters[activeCharacterIndex]?.name || 'unknown');
        }
        
        // 🆕 キーボード矢印キー移動機能を有効化
        initializeKeyboardMovement();
        
        // 全キャラクターにハイライト適用
        characters.forEach((char, index) => {
            if (index === activeCharacterIndex) {
                addCharacterHighlight(char.element);
            }
        });
        
        // 🎯 編集モード開始時にクリック選択機能を再設定
        setupCharacterClickSelection();
        
        // 🆕 統合スライド式メニューシステム開始
        const slideMenuSuccess = startSlideMenuSystem();
        if (!slideMenuSuccess) {
            // フォールバック: 既存パネル表示
            console.log('⚠️ 統合メニュー失敗 → 既存パネル表示');
            if (scalePanel) {
                scalePanel.style.display = 'block';
            }
            if (characterPanel) {
                characterPanel.style.display = 'block';
                updateCharacterSelectPanel();
            }
            
            // 🆕 独立リアルタイムプレビューパネル表示
            const independentRealtimePanel = document.getElementById('independent-realtime-preview');
            if (independentRealtimePanel) {
                independentRealtimePanel.style.display = 'block';
                updateIndependentRealtimePreview();
            }
            
            // 統合メニュー内のプレビューは独立パネルに移行したため非表示に変更
            const realtimePanel = document.getElementById('realtime-preview-panel');
            if (realtimePanel) {
                realtimePanel.style.display = 'none';
                console.log('📊 統合メニュー内プレビューパネルを非表示にしました');
            }
        }
        
        // 🆕 一時保存ボタン表示
        const tempSaveButton = document.getElementById('temp-save-button');
        if (tempSaveButton) {
            tempSaveButton.style.display = 'block';
        }
        
        console.log(`🎯 編集対象: ${characters.length}個のキャラクター（アクティブ: ${characters[activeCharacterIndex]?.name || '未選択'}）`);
        
    } else {
        // 編集モード終了の処理
        console.log('🔍 編集モード終了要求 - 変更検知開始');
        
        // 変更検知
        const hasChanges = detectChanges();
        
        if (hasChanges) {
            // 変更がある場合：確認ダイアログを表示
            console.log('📝 変更を検知 - 確認ダイアログを表示');
            
            try {
                const userChoice = await showEditEndConfirmDialog();
                console.log('✅ ユーザー選択結果:', userChoice);
                
                switch (userChoice) {
                    case 'save':
                        // 保存して終了
                        await finishEditMode(true);
                        console.log('💾 保存して編集モードを終了');
                        break;
                        
                    case 'discard':
                        // 破棄して終了（ロールバック）
                        console.log('🔄 変更を破棄して編集モードを終了');
                        rollbackToEditStart();
                        await finishEditMode(false);
                        break;
                        
                    case 'exit':
                        // 変更なしで終了
                        await finishEditMode(false);
                        console.log('❌ そのまま編集モードを終了');
                        break;
                        
                    case 'continue':
                    default:
                        // 編集を継続（何もしない）
                        console.log('✏️ 編集を継続');
                        return;
                }
            } catch (error) {
                console.error('❌ ダイアログでエラーが発生:', error);
                // エラー時は編集を継続
                return;
            }
            
        } else {
            // 変更がない場合：そのまま終了
            console.log('✅ 変更なし - そのまま編集モードを終了');
            await finishEditMode(false);
        }
    }
}

// 編集モード終了の共通処理
async function finishEditMode(shouldSave = false) {
    console.log('🏁 編集モード終了処理開始 - 保存:', shouldSave);
    
    isEditMode = false;
    const button = document.getElementById('minimal-edit-button');
    const scalePanel = document.getElementById('scale-adjust-panel');
    const characterPanel = document.getElementById('character-select-panel');
    const independentPreviewPanel = document.getElementById('independent-realtime-preview');
    
    // ボタンの状態を戻す
    button.textContent = '位置編集';
    button.style.background = '#ff6b6b';
    
    // 全キャラクターの編集機能を無効化（マウス・タッチ対応）
    characters.forEach(char => {
        char.element.style.cursor = 'default';
        char.element.removeEventListener('mousedown', startDrag);
        char.element.removeEventListener('touchstart', startDrag);
        removeCharacterHighlight(char.element);
    });
    
    // 後方互換性：従来のcharacter変数も処理（マウス・タッチ対応）
    if (character) {
        character.style.cursor = 'default';
        character.removeEventListener('mousedown', startDrag);
        character.removeEventListener('touchstart', startDrag);
    }
    
    // 🆕 統合スライド式メニューシステム終了
    stopSlideMenuSystem();
    
    // 🆕 一時保存ボタン非表示
    const tempSaveButton = document.getElementById('temp-save-button');
    if (tempSaveButton) {
        tempSaveButton.style.display = 'none';
    }
    
    // 保存処理（必要な場合のみ）
    if (shouldSave) {
        savePosition();
        console.log('💾 位置を保存しました');
    }
    
    // 編集状態をリセット
    editStartState = null;
    tempSaveData = null;
    hasUnsavedChanges = false;
    
    // 🆕 独立リアルタイムプレビューパネルを非表示
    if (independentPreviewPanel) {
        independentPreviewPanel.style.display = 'none';
        console.log('📊 独立リアルタイムプレビューパネルを非表示にしました');
    }
    
    // 🆕 キーボード移動機能を無効化
    disableKeyboardMovement();
    
    console.log('✅ 編集モード終了処理完了');
}

// ========== 🆕 キーボード矢印キー移動システム ========== //
let keyboardMoveHandler = null; // キーボードイベントハンドラー

// キーボード移動機能の初期化
function initializeKeyboardMovement() {
    if (keyboardMoveHandler) {
        document.removeEventListener('keydown', keyboardMoveHandler);
    }
    
    keyboardMoveHandler = function(e) {
        // 編集モード中のみ有効
        if (!isEditMode || !character) return;
        
        // 入力フィールドでの操作時は無効化
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        // 矢印キーのみ処理
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
        
        e.preventDefault(); // デフォルトのスクロール動作を防止
        
        // 移動量を決定（Shiftキーで高速移動）
        const moveStep = e.shiftKey ? 1.0 : 0.1; // %単位
        
        // 現在の位置を取得
        const currentLeft = parseFloat(character.style.left) || 0;
        const currentTop = parseFloat(character.style.top) || 0;
        
        let newLeft = currentLeft;
        let newTop = currentTop;
        
        // キーに応じて位置を更新
        switch (e.key) {
            case 'ArrowLeft':
                newLeft = Math.max(0, currentLeft - moveStep);
                break;
            case 'ArrowRight':
                newLeft = Math.min(100, currentLeft + moveStep);
                break;
            case 'ArrowUp':
                newTop = Math.max(0, currentTop - moveStep);
                break;
            case 'ArrowDown':
                newTop = Math.min(100, currentTop + moveStep);
                break;
        }
        
        // 位置を適用
        character.style.left = newLeft + '%';
        character.style.top = newTop + '%';
        
        // ハイライトコンテナの位置も同期更新
        if (character._highlightContainer) {
            updateHighlightPosition(character, character._highlightContainer);
        }
        
        // リアルタイムプレビュー更新
        updateRealtimePreview();
        
        // 変更を記録
        markAsChanged();
        
        // コンソールログ（デバッグ用）
        const keyName = e.key.replace('Arrow', '');
        const speedText = e.shiftKey ? '高速' : '通常';
        console.log(`⌨️ ${keyName}キー${speedText}移動: (${newLeft.toFixed(1)}%, ${newTop.toFixed(1)}%)`);
    };
    
    document.addEventListener('keydown', keyboardMoveHandler);
    console.log('⌨️ キーボード矢印キー移動機能を初期化');
}

// キーボード移動機能の無効化
function disableKeyboardMovement() {
    if (keyboardMoveHandler) {
        document.removeEventListener('keydown', keyboardMoveHandler);
        keyboardMoveHandler = null;
        console.log('⌨️ キーボード矢印キー移動機能を無効化');
    }
}

// ========== ドラッグ処理 ========== //
// 🎯 統一的な座標取得関数（マウス・タッチ対応）
function getEventCoordinates(e) {
    if (e.touches && e.touches.length > 0) {
        // タッチイベントの場合
        return {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    } else {
        // マウスイベントの場合
        return {
            x: e.clientX,
            y: e.clientY
        };
    }
}

function startDrag(e) {
    if (!isEditMode) return;
    
    e.preventDefault();
    
    // 🆕 ドラッグ開始時の統合メニュー自動最小化
    autoMinimizeOnDrag();
    
    // 🎯 タッチ操作時のスクロール防止
    if (e.touches) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    }
    
    isDragging = true;
    
    // ドラッグ開始時の視覚効果
    if (character) {
        character.style.opacity = '0.7';
        character.style.transform = `translate(-50%, -50%) scale(${currentScale}) rotate(2deg)`;
        character.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        character.style.zIndex = '9999'; // 最前面に移動
    }
    
    // ハイライトコンテナの強調
    if (character._highlightContainer) {
        const borderElement = character._highlightContainer.querySelector('.character-highlight-border');
        if (borderElement) {
            borderElement.style.borderWidth = '4px';
            borderElement.style.borderColor = '#ff3333';
            borderElement.style.animation = 'highlightPulse 0.5s ease-in-out infinite';
        }
    }
    
    // 開始位置を記録（タッチ・マウス統一対応）
    const coords = getEventCoordinates(e);
    startMousePos = { x: coords.x, y: coords.y };
    
    // 要素の現在位置を取得（親要素基準の%に変換）
    const rect = character.getBoundingClientRect();
    const parentRect = character.parentElement.getBoundingClientRect();
    
    // 現在のスタイルから単位を確認
    const currentLeft = character.style.left;
    const currentTop = character.style.top;
    
    if (currentLeft.includes('%') && currentTop.includes('%')) {
        // すでに%単位の場合はそのまま使用
        startElementPos = {
            left: parseFloat(currentLeft),
            top: parseFloat(currentTop)
        };
    } else {
        // px座標から%単位に変換（親要素基準）
        startElementPos = {
            left: ((rect.left - parentRect.left) / parentRect.width) * 100,
            top: ((rect.top - parentRect.top) / parentRect.height) * 100
        };
    }
    
    // グローバルイベントを設定（マウス・タッチ両対応）
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', handleDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
    
    // リアルタイムプレビュー更新（タッチ・マウス統一対応）
    updateRealtimePreview({
        mouseX: coords.x,
        mouseY: coords.y
    });
    
    console.log('🎯 ドラッグ開始 (親要素基準%):', startElementPos);
}

function handleDrag(e) {
    if (!isDragging) return;
    
    // 🎯 タッチ操作時のスクロール防止
    if (e.touches) {
        e.preventDefault();
    }
    
    // マウス・タッチの移動量を計算（統一座標取得）
    const coords = getEventCoordinates(e);
    const deltaX = coords.x - startMousePos.x;
    const deltaY = coords.y - startMousePos.y;
    
    // 親要素のサイズを取得（解決策1に準拠）
    const parentRect = character.parentElement.getBoundingClientRect();
    
    // 移動量を%に変換（親要素基準）
    const deltaXPercent = (deltaX / parentRect.width) * 100;
    const deltaYPercent = (deltaY / parentRect.height) * 100;
    
    // 新しい位置を計算
    const newLeft = startElementPos.left + deltaXPercent;
    const newTop = startElementPos.top + deltaYPercent;
    
    // 位置を適用（%単位で親要素基準）
    character.style.position = 'absolute';
    character.style.left = newLeft + '%';
    character.style.top = newTop + '%';
    // ドラッグ中の視覚効果を維持
    character.style.transform = `translate(-50%, -50%) scale(${currentScale}) rotate(2deg)`;
    
    // ハイライトコンテナの位置も同期更新
    if (character._highlightContainer) {
        updateHighlightPosition(character, character._highlightContainer);
    }
    
    // リアルタイムプレビュー更新（ドラッグ中、タッチ・マウス統一対応）
    updateRealtimePreview({
        mouseX: coords.x,
        mouseY: coords.y
    });
}

function endDrag() {
    if (!isDragging) return;
    
    isDragging = false;
    
    // 🎯 タッチ操作時のスクロール制限を解除
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    
    // ドラッグ終了時の視覚効果リセット
    if (character) {
        character.style.opacity = '1';
        character.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
        character.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        // z-indexを元に戻す
        const activeChar = characters[activeCharacterIndex];
        if (activeChar) {
            character.style.zIndex = activeChar.zIndex;
        }
    }
    
    // ハイライトコンテナの強調を元に戻す
    if (character._highlightContainer) {
        const borderElement = character._highlightContainer.querySelector('.character-highlight-border');
        if (borderElement) {
            borderElement.style.borderWidth = '3px';
            borderElement.style.borderColor = '#ff6b6b';
            borderElement.style.animation = 'highlightPulse 2s ease-in-out infinite';
        }
    }
    
    // イベントリスナー削除（マウス・タッチ両対応）
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', handleDrag);
    document.removeEventListener('touchend', endDrag);
    
    // リアルタイムプレビュー最終更新
    updateRealtimePreview();
    
    // アクティブキャラクターのscale値を更新
    if (characters[activeCharacterIndex]) {
        characters[activeCharacterIndex].scale = currentScale;
        updateCharacterSelectPanel(); // UI反映
    }
    
    // 🆕 ドラッグによる位置変更を記録
    markAsChanged();
    
    console.log('✅ ドラッグ終了 - 視覚効果リセット完了');
}

// ========== 位置保存・復元 ========== //

// 🆕 複数キャラクター対応localStorage v2.0システム

function savePositionV2() {
    console.log('💾 ===== 複数キャラクター保存 v2.0 開始 =====');
    
    // 全キャラクターの情報を収集
    const charactersData = {};
    
    characters.forEach((char, index) => {
        const element = char.element;
        const characterData = {
            // 基本情報
            id: char.id,
            name: char.name,
            selector: char.selector,
            isActive: char.isActive,
            
            // 位置・スケール情報
            position: {
                left: element.style.left || '0%',
                top: element.style.top || '0%',
                scale: char.scale || 1.0,
                unit: '%'
            },
            
            // レイヤー情報
            layer: {
                zIndex: char.zIndex,
                originalOrder: char.originalOrder,
                currentOrder: index
            },
            
            // 表示情報
            visibility: {
                display: element.style.display || '',
                opacity: element.style.opacity || '1'
            },
            
            // 変換情報
            transform: {
                cssTransform: element.style.transform || '',
                computed: window.getComputedStyle(element).transform || 'none'
            },
            
            // メタデータ
            metadata: {
                elementTag: element.tagName,
                hasId: !!element.id,
                classList: Array.from(element.classList),
                boundingRect: element.getBoundingClientRect()
            }
        };
        
        charactersData[char.id] = characterData;
        console.log(`📦 [${index}] ${char.name} データ収集完了:`, characterData);
    });
    
    // v2.0形式の保存データ作成
    const saveDataV2 = {
        // バージョン情報
        version: '2.0',
        timestamp: new Date().toISOString(),
        systemInfo: {
            totalCharacters: characters.length,
            activeCharacterIndex: activeCharacterIndex,
            activeCharacterId: characters[activeCharacterIndex]?.id || null,
            editMode: isEditMode,
            dragging: isDragging
        },
        
        // 全キャラクターデータ
        characters: charactersData,
        
        // 後方互換性用のメインキャラクター情報
        mainCharacter: charactersData[characters[activeCharacterIndex]?.id] || null,
        
        // セッション情報
        session: {
            userAgent: navigator.userAgent,
            screenSize: {
                width: window.screen.width,
                height: window.screen.height
            },
            viewportSize: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        }
    };
    
    // v2.0形式で保存
    try {
        localStorage.setItem('spine-positioning-state-v2', JSON.stringify(saveDataV2));
        console.log('✅ v2.0形式で保存完了:', {
            totalCharacters: Object.keys(charactersData).length,
            dataSize: JSON.stringify(saveDataV2).length + ' bytes',
            timestamp: saveDataV2.timestamp
        });
    } catch (error) {
        console.error('❌ v2.0保存エラー:', error);
        return false;
    }
    
    // 後方互換性：既存形式も保存（フォールバック用）
    if (characters[activeCharacterIndex]) {
        const activeChar = characters[activeCharacterIndex];
        const legacyPosition = {
            left: activeChar.element.style.left,
            top: activeChar.element.style.top,
            scale: activeChar.scale,
            unit: '%'
        };
        
        const legacySaveData = {
            character: legacyPosition
        };
        
        localStorage.setItem('spine-positioning-state', JSON.stringify(legacySaveData));
        console.log('🔄 後方互換性：既存形式でも保存完了');
    }
    
    console.log('💾 ===== 複数キャラクター保存 v2.0 完了 =====');
    return true;
}

function restorePositionV2() {
    console.log('📍 ===== 複数キャラクター復元 v2.0 開始 =====');
    
    // v2.0形式のデータを優先的に確認
    let savedV2 = localStorage.getItem('spine-positioning-state-v2');
    let restoredCount = 0;
    
    if (savedV2) {
        try {
            const dataV2 = JSON.parse(savedV2);
            console.log('📋 v2.0形式データ検出:', {
                version: dataV2.version,
                timestamp: dataV2.timestamp,
                totalCharacters: dataV2.systemInfo?.totalCharacters || 0,
                activeCharacter: dataV2.systemInfo?.activeCharacterId || 'unknown'
            });
            
            // キャラクターデータが存在する場合
            if (dataV2.characters && typeof dataV2.characters === 'object') {
                // 各キャラクターの位置・設定を復元
                characters.forEach((char, index) => {
                    const savedCharData = dataV2.characters[char.id];
                    if (savedCharData && savedCharData.position) {
                        const element = char.element;
                        const position = savedCharData.position;
                        
                        // 位置復元
                        element.style.position = 'absolute';
                        element.style.left = position.left;
                        element.style.top = position.top;
                        
                        // スケール復元
                        char.scale = position.scale || 1.0;
                        const baseTransform = 'translate(-50%, -50%)';
                        element.style.transform = `${baseTransform} scale(${char.scale})`;
                        
                        // レイヤー情報復元
                        if (savedCharData.layer) {
                            char.zIndex = savedCharData.layer.zIndex || (1000 + index);
                            element.style.zIndex = char.zIndex;
                        }
                        
                        // 表示情報復元
                        if (savedCharData.visibility) {
                            if (savedCharData.visibility.display) {
                                element.style.display = savedCharData.visibility.display;
                            }
                            if (savedCharData.visibility.opacity) {
                                element.style.opacity = savedCharData.visibility.opacity;
                            }
                        }
                        
                        restoredCount++;
                        console.log(`✅ [${index}] ${char.name} 復元完了:`, {
                            position: `${position.left}, ${position.top}`,
                            scale: char.scale,
                            zIndex: char.zIndex
                        });
                    } else {
                        console.log(`⚠️ [${index}] ${char.name}: 保存データなし`);
                    }
                });
                
                // アクティブキャラクターの復元
                if (dataV2.systemInfo?.activeCharacterIndex !== undefined && 
                    dataV2.systemInfo.activeCharacterIndex < characters.length) {
                    const savedActiveIndex = dataV2.systemInfo.activeCharacterIndex;
                    setActiveCharacter(savedActiveIndex);
                    console.log(`🎯 アクティブキャラクター復元: [${savedActiveIndex}] ${characters[savedActiveIndex].name}`);
                }
                
                // UI更新
                updateCharacterSelectPanel();
                updateScalePanelForActiveCharacter();
                updateRealtimePreview();
                
                console.log(`✅ v2.0復元完了: ${restoredCount}/${characters.length} キャラクター復元`);
                return true;
            }
        } catch (error) {
            console.error('❌ v2.0データ解析エラー:', error);
        }
    }
    
    // v2.0形式が失敗した場合、既存形式にフォールバック
    console.log('🔄 v2.0形式なし、既存形式をチェック...');
    
    let saved = localStorage.getItem('spine-positioning-state');
    let position = null;
    
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.character) {
                position = data.character;
                console.log('📍 既存形式データ検出:', position);
            }
        } catch (e) {
            console.error('❌ 既存形式解析エラー:', e);
        }
    }
    
    // さらにフォールバック：minimal形式もチェック
    if (!position) {
        saved = localStorage.getItem('spine-minimal-position');
        if (saved) {
            try {
                position = JSON.parse(saved);
                console.log('📍 minimal形式データ検出:', position);
            } catch (e) {
                console.error('❌ minimal形式解析エラー:', e);
            }
        }
    }
    
    // 既存形式で復元（アクティブキャラクターのみ）
    if (position && position.left && position.top && characters[activeCharacterIndex]) {
        const activeChar = characters[activeCharacterIndex];
        const element = activeChar.element;
        
        element.style.position = 'absolute';
        element.style.left = position.left;
        element.style.top = position.top;
        
        if (position.scale !== undefined) {
            activeChar.scale = position.scale;
            currentScale = position.scale;
            element.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
        }
        
        // UI同期
        updateScalePanelForActiveCharacter();
        updateRealtimePreview();
        
        console.log('✅ 既存形式で復元完了（アクティブキャラクターのみ）:', position);
        
        // 復元後にv2.0形式で保存（マイグレーション）
        console.log('🔄 自動マイグレーション実行...');
        savePositionV2();
        
        return true;
    }
    
    console.log('⚠️ 復元可能なデータがありません');
    console.log('📍 ===== 複数キャラクター復元 v2.0 完了 =====');
    return false;
}

function migrateStorageData() {
    console.log('🔄 ===== ストレージデータマイグレーション開始 =====');
    
    // 既にv2.0形式が存在するかチェック
    const existingV2 = localStorage.getItem('spine-positioning-state-v2');
    if (existingV2) {
        console.log('✅ v2.0形式データが既に存在します、マイグレーション不要');
        return { success: true, reason: 'v2_already_exists' };
    }
    
    // 既存形式のデータをチェック
    const legacyData = localStorage.getItem('spine-positioning-state');
    const minimalData = localStorage.getItem('spine-minimal-position');
    
    if (!legacyData && !minimalData) {
        console.log('⚠️ マイグレーション対象のデータがありません');
        return { success: false, reason: 'no_data_to_migrate' };
    }
    
    let migratedCount = 0;
    const migratedCharacters = {};
    
    // 既存形式データのマイグレーション
    if (legacyData) {
        try {
            const parsed = JSON.parse(legacyData);
            if (parsed.character && characters.length > 0) {
                const activeChar = characters[activeCharacterIndex] || characters[0];
                
                migratedCharacters[activeChar.id] = {
                    id: activeChar.id,
                    name: activeChar.name,
                    selector: activeChar.selector,
                    isActive: true,
                    position: {
                        left: parsed.character.left || '0%',
                        top: parsed.character.top || '0%',
                        scale: parsed.character.scale || 1.0,
                        unit: parsed.character.unit || '%'
                    },
                    layer: {
                        zIndex: activeChar.zIndex || 1000,
                        originalOrder: activeChar.originalOrder || 0,
                        currentOrder: activeCharacterIndex
                    },
                    visibility: {
                        display: '',
                        opacity: '1'
                    },
                    transform: {
                        cssTransform: activeChar.element.style.transform || '',
                        computed: 'none'
                    },
                    metadata: {
                        elementTag: activeChar.element.tagName,
                        hasId: !!activeChar.element.id,
                        classList: Array.from(activeChar.element.classList),
                        boundingRect: { width: 0, height: 0, x: 0, y: 0 }
                    }
                };
                
                migratedCount++;
                console.log('📦 既存形式データをマイグレーション:', activeChar.name);
            }
        } catch (error) {
            console.error('❌ 既存形式マイグレーションエラー:', error);
        }
    }
    
    // minimal形式データのマイグレーション
    if (minimalData) {
        try {
            const parsed = JSON.parse(minimalData);
            if (characters.length > 0) {
                const activeChar = characters[activeCharacterIndex] || characters[0];
                
                // 既存形式のデータがない場合、またはより新しい場合
                if (!migratedCharacters[activeChar.id]) {
                    migratedCharacters[activeChar.id] = {
                        id: activeChar.id,
                        name: activeChar.name,
                        selector: activeChar.selector,
                        isActive: true,
                        position: {
                            left: parsed.left || '0%',
                            top: parsed.top || '0%',
                            scale: parsed.scale || 1.0,
                            unit: parsed.unit || '%'
                        },
                        layer: {
                            zIndex: activeChar.zIndex || 1000,
                            originalOrder: activeChar.originalOrder || 0,
                            currentOrder: activeCharacterIndex
                        },
                        visibility: {
                            display: '',
                            opacity: '1'
                        },
                        transform: {
                            cssTransform: activeChar.element.style.transform || '',
                            computed: 'none'
                        },
                        metadata: {
                            elementTag: activeChar.element.tagName,
                            hasId: !!activeChar.element.id,
                            classList: Array.from(activeChar.element.classList),
                            boundingRect: { width: 0, height: 0, x: 0, y: 0 }
                        }
                    };
                    
                    migratedCount++;
                    console.log('📦 minimal形式データをマイグレーション:', activeChar.name);
                }
            }
        } catch (error) {
            console.error('❌ minimal形式マイグレーションエラー:', error);
        }
    }
    
    // v2.0形式データを作成・保存
    if (migratedCount > 0) {
        const migratedSaveData = {
            version: '2.0',
            timestamp: new Date().toISOString(),
            migrated: true,
            systemInfo: {
                totalCharacters: characters.length,
                activeCharacterIndex: activeCharacterIndex,
                activeCharacterId: characters[activeCharacterIndex]?.id || null,
                editMode: isEditMode,
                dragging: false
            },
            characters: migratedCharacters,
            mainCharacter: migratedCharacters[characters[activeCharacterIndex]?.id] || null,
            session: {
                userAgent: navigator.userAgent,
                screenSize: {
                    width: window.screen.width,
                    height: window.screen.height
                },
                viewportSize: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            }
        };
        
        try {
            localStorage.setItem('spine-positioning-state-v2', JSON.stringify(migratedSaveData));
            console.log('✅ マイグレーション完了:', {
                migratedCharacters: migratedCount,
                totalCharacters: characters.length,
                dataSize: JSON.stringify(migratedSaveData).length + ' bytes'
            });
            
            console.log('🔄 ===== ストレージデータマイグレーション完了 =====');
            return { 
                success: true, 
                reason: 'migration_completed',
                migratedCount: migratedCount,
                totalCharacters: characters.length
            };
        } catch (error) {
            console.error('❌ v2.0保存エラー:', error);
            return { success: false, reason: 'save_error', error: error.message };
        }
    }
    
    console.log('⚠️ マイグレーション対象データなし');
    console.log('🔄 ===== ストレージデータマイグレーション完了 =====');
    return { success: false, reason: 'no_valid_data' };
}

function debugStorageData() {
    console.log('🔍 ===== ストレージデータ診断開始 =====');
    
    // 利用可能なストレージキーを確認
    const storageKeys = [
        'spine-positioning-state-v2',
        'spine-positioning-state',
        'spine-minimal-position'
    ];
    
    const storageStatus = {};
    let totalSize = 0;
    
    storageKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
            const size = new Blob([data]).size;
            totalSize += size;
            
            try {
                const parsed = JSON.parse(data);
                storageStatus[key] = {
                    exists: true,
                    size: size + ' bytes',
                    dataType: typeof parsed,
                    version: parsed.version || 'legacy',
                    timestamp: parsed.timestamp || 'unknown',
                    characterCount: parsed.characters ? Object.keys(parsed.characters).length : (parsed.character ? 1 : 0),
                    preview: {
                        keys: Object.keys(parsed).slice(0, 5),
                        sampleData: JSON.stringify(parsed).substring(0, 100) + '...'
                    }
                };
            } catch (error) {
                storageStatus[key] = {
                    exists: true,
                    size: size + ' bytes',
                    error: 'JSON解析エラー: ' + error.message,
                    rawPreview: data.substring(0, 100) + '...'
                };
            }
        } else {
            storageStatus[key] = {
                exists: false,
                size: '0 bytes'
            };
        }
    });
    
    console.log('📊 ストレージ状況:');
    Object.entries(storageStatus).forEach(([key, status]) => {
        console.log(`  ${status.exists ? '✅' : '❌'} ${key}:`, status);
    });
    
    console.log(`💾 合計ストレージ使用量: ${totalSize} bytes`);
    
    // 現在のキャラクター状況も診断
    console.log('🎭 現在のキャラクター状況:');
    console.log(`  検出キャラクター数: ${characters.length}`);
    console.log(`  アクティブインデックス: ${activeCharacterIndex}`);
    if (characters[activeCharacterIndex]) {
        console.log(`  アクティブキャラクター: ${characters[activeCharacterIndex].name} (${characters[activeCharacterIndex].id})`);
    }
    
    // 推奨アクション
    console.log('💡 推奨アクション:');
    if (storageStatus['spine-positioning-state-v2'].exists) {
        console.log('  ✅ v2.0形式データ存在 → restorePositionV2() で復元可能');
    } else if (storageStatus['spine-positioning-state'].exists || storageStatus['spine-minimal-position'].exists) {
        console.log('  🔄 レガシーデータ存在 → migrateStorageData() でv2.0にマイグレーション推奨');
    } else {
        console.log('  ⚠️ 保存データなし → savePositionV2() で新規作成推奨');
    }
    
    console.log('🔍 ===== ストレージデータ診断完了 =====');
    return storageStatus;
}

// 既存関数：後方互換性のため保持
function savePosition() {
    console.log('💾 savePosition() 呼び出し → savePositionV2() に移譲');
    return savePositionV2();
}

function restorePosition() {
    console.log('📍 restorePosition() 呼び出し → restorePositionV2() に移譲');
    return restorePositionV2();
}

// ========== 初期化実行 ========== //
function executeInitialization() {
    console.log('📄 DOMContentLoaded: 最速位置復元システム開始');
    console.log('DOM状態確認:', {
        readyState: document.readyState,
        bodyExists: !!document.body,
        title: document.title
    });
    
    try {
        // 即座に編集システム初期化（遅延なし）
        initializeMinimalEditSystem();
    
    // 最速でSpine初期化完了を監視
    let positionRestored = false;
    const waitForSpineInit = () => {
        if (positionRestored) return; // 重複実行防止
        
        // Canvas作成時に既に位置復元済みかチェック
        if (window.spinePositionAlreadyRestored) {
            console.log('✅ Canvas作成時に位置復元済み、スキップ');
            positionRestored = true;
            return;
        }
        
        const canvas = document.getElementById('purattokun-canvas');
        if (canvas && canvas.getBoundingClientRect().width > 0) {
            // Canvas要素が実際にレンダリングされた時点で位置復元
            positionRestored = true;
            restorePosition();
            console.log('⚡ 最速：Spine初期化完了を検出、即座に位置復元を実行');
        } else {
            // 50ms間隔で高速監視（100ms→50msに短縮）
            setTimeout(waitForSpineInit, 50);
        }
    };
    
    // 初期化監視を即座に開始
    waitForSpineInit();
    
    // フォールバック：2秒後に必ず実行（3秒→2秒に短縮）
    setTimeout(() => {
        if (!positionRestored) {
            positionRestored = true;
            restorePosition();
            console.log('🔄 フォールバック：位置復元を実行');
        }
    }, 2000);
    
    } catch (error) {
        console.error('❌ DOMContentLoaded初期化エラー:', error);
        console.error('詳細:', {
            message: error.message,
            stack: error.stack,
            dom: document.readyState,
            body: !!document.body
        });
    }
}

// DOMContentLoadedイベント または 即座実行
if (document.readyState === 'loading') {
    // まだ読み込み中の場合はDOMContentLoadedを待つ
    document.addEventListener('DOMContentLoaded', executeInitialization);
} else {
    // 既に読み込み完了している場合は即座に実行
    console.log('🚀 DOM既に完了 - 即座に初期化実行');
    executeInitialization();
}

// デバッグ用グローバル関数
window.clearMinimalPosition = function() {
    localStorage.removeItem('spine-positioning-state');
    localStorage.removeItem('spine-minimal-position');
    console.log('🗑️ 保存データをクリアしました');
};

// 🆕 v2.0対応デバッグ関数群
window.savePositionV2 = savePositionV2;
window.restorePositionV2 = restorePositionV2;
window.migrateStorageData = migrateStorageData;
window.debugStorageData = debugStorageData;

window.clearAllPositionData = function() {
    localStorage.removeItem('spine-positioning-state-v2');
    localStorage.removeItem('spine-positioning-state');
    localStorage.removeItem('spine-minimal-position');
    console.log('🗑️ 全ての保存データ（v2.0含む）をクリアしました');
};

window.testV2Storage = function() {
    console.log('🧪 ===== v2.0ストレージテスト開始 =====');
    
    // 診断
    const beforeStatus = debugStorageData();
    console.log('📊 テスト前の状態:', beforeStatus);
    
    // 保存テスト
    console.log('💾 v2.0保存テスト...');
    const saveResult = savePositionV2();
    console.log('保存結果:', saveResult);
    
    // 診断（保存後）
    const afterSaveStatus = debugStorageData();
    console.log('📊 保存後の状態:', afterSaveStatus);
    
    // 復元テスト
    console.log('📍 v2.0復元テスト...');
    const restoreResult = restorePositionV2();
    console.log('復元結果:', restoreResult);
    
    // 最終診断
    const finalStatus = debugStorageData();
    console.log('📊 最終状態:', finalStatus);
    
    console.log('🧪 ===== v2.0ストレージテスト完了 =====');
    return {
        before: beforeStatus,
        saveResult: saveResult,
        afterSave: afterSaveStatus,
        restoreResult: restoreResult,
        final: finalStatus
    };
};

// 🆕 拡張されたデバッグ関数
window.debugMultipleCharacters = function() {
    console.log('🔍 === 複数キャラクター & レイヤー診断開始 ===');
    console.log('📊 キャラクター数:', characters.length);
    console.log('🎯 アクティブインデックス:', activeCharacterIndex);
    console.log('📝 編集モード:', isEditMode);
    console.log('🖱️ ドラッグ状態:', isDragging);
    
    characters.forEach((char, index) => {
        const rect = char.element.getBoundingClientRect();
        console.log(`${index === activeCharacterIndex ? '🎯' : '⚪'} [${index}] ${char.name}:`, {
            element: char.element.tagName + (char.element.id ? '#' + char.element.id : ''),
            id: char.id,
            scale: char.scale,
            zIndex: char.zIndex,
            computedZIndex: window.getComputedStyle(char.element).zIndex,
            isActive: char.isActive,
            selector: char.selector,
            position: {
                left: char.element.style.left,
                top: char.element.style.top,
                transform: char.element.style.transform
            },
            boundingRect: { 
                x: Math.round(rect.x), 
                y: Math.round(rect.y), 
                width: Math.round(rect.width), 
                height: Math.round(rect.height) 
            }
        });
    });
    
    if (characters[activeCharacterIndex]) {
        console.log('✅ 現在のアクティブキャラクター:', characters[activeCharacterIndex].name);
    } else {
        console.error('❌ アクティブキャラクターが無効です');
    }
    
    // レイヤー順序チェック（前面から背面の順で表示）
    console.log('🎭 レイヤー順序 (前面→背面):');
    const sortedByZIndex = [...characters].sort((a, b) => b.zIndex - a.zIndex); // 降順ソートで前面から表示
    sortedByZIndex.forEach((char, index) => {
        const position = index === 0 ? '最前面' : index === sortedByZIndex.length - 1 ? '最背面' : `${index + 1}番目`;
        console.log(`  ${position}: ${char.name} (z-index: ${char.zIndex})`);
    });
};

window.switchToCharacter = function(index) {
    if (setActiveCharacter(index)) {
        updateCharacterSelectPanel();
        console.log('✅ キャラクター切り替え完了:', characters[index].name);
        return true;
    } else {
        console.error('❌ キャラクター切り替え失敗');
        return false;
    }
};

window.addTestCharacter = function() {
    // テスト用キャラクター要素を動的作成
    const testDiv = document.createElement('div');
    testDiv.id = 'test-character-' + Date.now();
    testDiv.dataset.characterName = 'テストキャラクター';
    testDiv.className = 'spine-character';
    testDiv.style.cssText = `
        position: absolute;
        left: 30%;
        top: 30%;
        width: 100px;
        height: 100px;
        background: #4CAF50;
        border: 2px solid #333;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        z-index: 5000;
    `;
    testDiv.innerHTML = '<div style="text-align: center; line-height: 96px; color: white; font-weight: bold;">TEST</div>';
    
    document.body.appendChild(testDiv);
    
    // キャラクター再検出
    detectCharacters();
    updateCharacterSelectPanel();
    
    console.log('✅ テストキャラクターを追加しました:', testDiv.id);
    return testDiv;
};

// スケール診断関数
window.debugScale = function() {
    console.log('🔍 === スケール診断開始 ===');
    
    if (!character) {
        console.error('❌ character要素がnull');
        return;
    }
    
    const computedStyle = window.getComputedStyle(character);
    const rect = character.getBoundingClientRect();
    
    console.log('📊 キャラクター要素状態:', {
        element: character.tagName + (character.id ? '#' + character.id : ''),
        inlineTransform: character.style.transform,
        computedTransform: computedStyle.transform,
        inlineWidth: character.style.width,
        computedWidth: computedStyle.width,
        boundingRect: {
            width: rect.width,
            height: rect.height
        },
        currentScale: currentScale
    });
    
    // テストスケール適用
    const testScale = 2.0;
    character.style.transform = `translate(-50%, -50%) scale(${testScale})`;
    console.log('🧪 テストスケール適用:', testScale);
    
    setTimeout(() => {
        const newRect = character.getBoundingClientRect();
        console.log('📏 スケール後のサイズ:', {
            width: newRect.width,
            height: newRect.height,
            transform: character.style.transform
        });
        
        // 元に戻す
        character.style.transform = `translate(-50%, -50%) scale(1.0)`;
    }, 1000);
};

// 🆕 レイヤー制御デバッグ関数
window.testLayerControl = function() {
    console.log('🧪 === レイヤー制御テスト開始 ===');
    
    if (characters.length < 2) {
        console.log('⚠️ テスト用キャラクターを追加します...');
        addTestCharacter();
        addTestCharacter();
    }
    
    console.log('📊 テスト前の状態:');
    debugMultipleCharacters();
    
    // 最初のキャラクターを最前面に移動
    if (characters.length > 0) {
        console.log('🧪 テスト1: 最初のキャラクターを最前面に移動');
        bringCharacterToFront(0);
        
        setTimeout(() => {
            console.log('🧪 テスト2: 最後のキャラクターを最背面に移動');
            if (characters.length > 1) {
                sendCharacterToBack(characters.length - 1);
            }
            
            setTimeout(() => {
                console.log('📊 テスト完了後の状態:');
                debugMultipleCharacters();
            }, 1000);
        }, 2000);
    }
};

window.simulateDragDrop = function(fromIndex, toIndex) {
    console.log(`🎯 ドラッグ&ドロップ シミュレーション: ${fromIndex} → ${toIndex}`);
    
    if (moveCharacterInLayer(fromIndex, toIndex)) {
        console.log('✅ シミュレーション成功');
        debugMultipleCharacters();
        return true;
    } else {
        console.error('❌ シミュレーション失敗');
        return false;
    }
};

// ========== リアルタイムプレビュー機能 ========== //
function createRealtimePreviewPanel() {
    const panel = document.createElement('div');
    panel.id = 'realtime-preview-panel';
    panel.style.cssText = `
        position: fixed;
        top: 450px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border: 1px solid #333;
        border-radius: 6px;
        padding: 12px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        z-index: 10001;
        display: none;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 12px;
        min-width: 200px;
        backdrop-filter: blur(2px);
    `;
    
    panel.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: bold; color: #4CAF50; border-bottom: 1px solid #333; padding-bottom: 4px;">
            📊 リアルタイムプレビュー
        </div>
        <div id="preview-character-info" style="margin-bottom: 8px; font-size: 11px; color: #ccc;">
            キャラクター: 読み込み中...
        </div>
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 12px; align-items: center;">
            <span style="color: #ff6b6b;">🎯 X座標:</span>
            <span id="preview-x" style="font-weight: bold; color: #fff;">-</span>
            
            <span style="color: #4CAF50;">🎯 Y座標:</span>
            <span id="preview-y" style="font-weight: bold; color: #fff;">-</span>
            
            <span style="color: #2196F3;">📏 スケール:</span>
            <span id="preview-scale" style="font-weight: bold; color: #fff;">-</span>
            
            <span style="color: #FF9800;">📐 サイズ:</span>
            <span id="preview-size" style="font-weight: bold; color: #fff;">-</span>
            
            <span style="color: #9C27B0;">🏷️ z-index:</span>
            <span id="preview-zindex" style="font-weight: bold; color: #fff;">-</span>
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #333; font-size: 10px; color: #999;">
            💡 ドラッグ・スケール調整中にリアルタイム更新
        </div>
    `;
    
    document.body.appendChild(panel);
    console.log('✅ リアルタイムプレビューパネル作成完了');
}

function updateRealtimePreview(customX = null, customY = null, customScale = null) {
    const panel = document.getElementById('realtime-preview-panel');
    if (!panel || panel.style.display === 'none') return;
    
    if (!character || !characters[activeCharacterIndex]) {
        document.getElementById('preview-character-info').textContent = 'キャラクター: 未選択';
        return;
    }
    
    const activeChar = characters[activeCharacterIndex];
    const rect = character.getBoundingClientRect();
    
    // 座標値を取得（カスタム値またはCSSから取得）
    let xValue, yValue, scaleValue;
    
    if (customX !== null && customY !== null) {
        // ドラッグ中のリアルタイム値を使用
        xValue = customX;
        yValue = customY;
    } else {
        // CSSから現在値を取得
        const currentLeft = character.style.left;
        const currentTop = character.style.top;
        xValue = parseFloat(currentLeft) || 0;
        yValue = parseFloat(currentTop) || 0;
    }
    
    scaleValue = customScale !== null ? customScale : (activeChar.scale || currentScale || 1.0);
    
    // 要素情報更新
    document.getElementById('preview-character-info').textContent = 
        `キャラクター: ${activeChar.name} (${activeChar.id})`;
    
    // 座標・スケール情報更新
    document.getElementById('preview-x').textContent = `${xValue.toFixed(2)}%`;
    document.getElementById('preview-y').textContent = `${yValue.toFixed(2)}%`;
    document.getElementById('preview-scale').textContent = `${scaleValue.toFixed(3)}x`;
    
    // サイズ情報更新（実際の描画サイズ）
    const sizeText = `${Math.round(rect.width)}×${Math.round(rect.height)}px`;
    document.getElementById('preview-size').textContent = sizeText;
    
    // z-index情報更新
    const zIndexValue = activeChar.zIndex || parseInt(window.getComputedStyle(character).zIndex) || 'auto';
    document.getElementById('preview-zindex').textContent = zIndexValue;
    
    // デバッグログ（ドラッグ中のみ）
    if (isDragging) {
        console.log('🔄 リアルタイムプレビュー更新:', {
            character: activeChar.name,
            x: xValue,
            y: yValue,
            scale: scaleValue,
            size: sizeText,
            zIndex: zIndexValue
        });
    }
}

// 🆕 新機能のデバッグ関数
window.testEditStateManagement = function() {
    console.log('🧪 === 編集状態管理システムテスト ===');
    console.log('編集モード:', isEditMode);
    console.log('未保存変更フラグ:', hasUnsavedChanges);
    console.log('編集開始状態:', editStartState ? '記録済み' : '未記録');
    console.log('一時保存データ:', tempSaveData ? '存在' : 'なし');
    
    if (editStartState) {
        console.log('📸 編集開始時の状態:', {
            timestamp: new Date(editStartState.timestamp).toLocaleTimeString(),
            activeCharacterIndex: editStartState.activeCharacterIndex,
            charactersCount: editStartState.characters.length,
            globalScale: editStartState.globalScale
        });
    }
    
    // 変更検知テスト
    const hasChanges = detectChanges();
    console.log('🔍 変更検知結果:', hasChanges);
    
    return {
        isEditMode,
        hasUnsavedChanges,
        editStartState: !!editStartState,
        tempSaveData: !!tempSaveData,
        hasChanges
    };
};

window.testConfirmDialog = async function() {
    console.log('🧪 === 確認ダイアログテスト ===');
    
    if (!isEditMode) {
        console.log('⚠️ 編集モードではありません。先に編集モードを開始してください。');
        return;
    }
    
    try {
        const result = await showEditEndConfirmDialog();
        console.log('✅ ダイアログ結果:', result);
        return result;
    } catch (error) {
        console.error('❌ ダイアログエラー:', error);
        return null;
    }
};

// 🆕 キーボード移動機能テスト
window.testKeyboardMovement = function() {
    console.log('🧪 === キーボード矢印キー移動機能テスト ===');
    
    // 基本状態確認
    console.log('編集モード:', isEditMode);
    console.log('キーボードハンドラー:', keyboardMoveHandler ? '✅ 有効' : '❌ 無効');
    console.log('アクティブキャラクター:', character ? `✅ ${characters[activeCharacterIndex]?.name || 'unknown'}` : '❌ なし');
    
    if (!isEditMode) {
        console.log('⚠️ 編集モードではありません。先に編集モードを開始してください。');
        console.log('💡 実行方法: toggleEditMode()');
        return false;
    }
    
    if (!character) {
        console.log('❌ アクティブキャラクターがありません。');
        return false;
    }
    
    // 現在位置を確認
    const currentLeft = parseFloat(character.style.left) || 0;
    const currentTop = parseFloat(character.style.top) || 0;
    console.log(`📍 現在位置: (${currentLeft.toFixed(1)}%, ${currentTop.toFixed(1)}%)`);
    
    // テスト用の移動シミュレーション
    console.log('🎯 キーボード移動テスト実行中...');
    console.log('📝 操作方法:');
    console.log('  ↑↓←→: 0.1%ずつ移動');
    console.log('  Shift + ↑↓←→: 1%ずつ高速移動');
    console.log('  入力フィールド選択中は無効');
    
    // イベントハンドラーの動作確認
    if (keyboardMoveHandler) {
        console.log('✅ キーボードイベントハンドラーが正常に設定されています。');
        console.log('💡 実際に矢印キーを押してテストしてください。');
        
        // 画面境界テスト用の情報表示
        console.log('🚧 画面境界制限: 0% ≤ 位置 ≤ 100%');
        
        return true;
    } else {
        console.log('❌ キーボードイベントハンドラーが設定されていません。');
        console.log('💡 修正方法: initializeKeyboardMovement()');
        return false;
    }
};

// 🆕 キーボード移動のプログラム的テスト
window.simulateKeyboardMove = function(direction, shift = false) {
    console.log(`🎮 キーボード移動シミュレーション: ${direction}${shift ? ' (高速)' : ''}`);
    
    if (!isEditMode || !character) {
        console.log('❌ 編集モードまたはキャラクターが無効です。');
        return false;
    }
    
    const moveStep = shift ? 1.0 : 0.1;
    const currentLeft = parseFloat(character.style.left) || 0;
    const currentTop = parseFloat(character.style.top) || 0;
    
    let newLeft = currentLeft;
    let newTop = currentTop;
    
    switch (direction.toLowerCase()) {
        case 'left':
        case '←':
            newLeft = Math.max(0, currentLeft - moveStep);
            break;
        case 'right':
        case '→':
            newLeft = Math.min(100, currentLeft + moveStep);
            break;
        case 'up':
        case '↑':
            newTop = Math.max(0, currentTop - moveStep);
            break;
        case 'down':
        case '↓':
            newTop = Math.min(100, currentTop + moveStep);
            break;
        default:
            console.log('❌ 無効な方向:', direction);
            console.log('💡 使用可能: left, right, up, down, ←, →, ↑, ↓');
            return false;
    }
    
    // 位置を適用
    character.style.left = newLeft + '%';
    character.style.top = newTop + '%';
    
    // 関連機能更新
    if (character._highlightContainer) {
        updateHighlightPosition(character, character._highlightContainer);
    }
    updateRealtimePreview();
    markAsChanged();
    
    console.log(`✅ 移動完了: (${currentLeft.toFixed(1)}%, ${currentTop.toFixed(1)}%) → (${newLeft.toFixed(1)}%, ${newTop.toFixed(1)}%)`);
    return true;
};

window.testTempSave = function() {
    console.log('🧪 === 一時保存テスト ===');
    const result = showTempSaveDialog();
    console.log('💾 一時保存結果:', result);
    return result;
};

window.testRollback = function() {
    console.log('🧪 === ロールバックテスト ===');
    
    if (!editStartState) {
        console.log('⚠️ 編集開始状態が記録されていません');
        return false;
    }
    
    const result = rollbackToEditStart();
    console.log('🔄 ロールバック結果:', result);
    return result;
};

// 🆕 ウィンドウリサイズ時のモバイルスタイル再適用
window.addEventListener('resize', () => {
    // デバウンス処理（リサイズ終了後300ms後に実行）
    clearTimeout(window.mobileStylesTimeout);
    window.mobileStylesTimeout = setTimeout(() => {
        applyMobileStyles();
        
        // 🆕 統合メニューのレスポンシブ対応
        const slideMenuContainer = document.getElementById('slide-menu-container');
        if (slideMenuContainer && slideMenuState !== 'hidden') {
            // メニューコンテナを再作成してレスポンシブ対応
            createSlideMenuContainer();
            updateSlideMenuVisibility();
            console.log('📱 統合メニュー レスポンシブ更新');
        }
        
        // 🆕 リアルタイムプレビューの位置をレスポンシブ対応
        const independentPreviewPanel = document.getElementById('independent-realtime-preview');
        if (independentPreviewPanel) {
            updateRealtimePreviewPosition(independentPreviewPanel);
        }
        
        console.log('📱 ウィンドウリサイズ → モバイルスタイル再適用');
    }, 300);
});

// 🆕 ページ読み込み時の初期スタイル適用
document.addEventListener('DOMContentLoaded', () => {
    applyMobileStyles();
});

// ========== 🆕 統合スライド式メニューシステム ========== //

// メニューの状態管理
let slideMenuState = 'hidden'; // 'hidden', 'minimized', 'full'
let activeMenuTab = 'character'; // 'character', 'scale', 'preview'

// 統合スライド式メニューシステムの初期化
function initSlideMenuSystem() {
    console.log('🎯 統合スライド式メニューシステム初期化開始');
    
    try {
        // 既存の独立したパネルを非表示にする（後で統合）
        hideIndependentPanels();
        
        // 統合メニューコンテナを作成
        createSlideMenuContainer();
        
        // メニュー状態の初期化（初期状態を最小化に変更）
        slideMenuState = 'minimized';
        updateSlideMenuVisibility();
        
        console.log('✅ 統合スライド式メニューシステム初期化完了');
        return true;
    } catch (error) {
        console.error('❌ 統合メニューシステム初期化エラー:', error);
        // エラー時は既存パネルを復元
        restoreIndependentPanels();
        return false;
    }
}

// 既存の独立パネルを非表示にする
function hideIndependentPanels() {
    const panels = [
        'character-select-panel',
        'scale-adjust-panel', 
        'realtime-preview-panel'
    ];
    
    panels.forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.style.display = 'none';
            console.log(`📦 既存パネル非表示: ${panelId}`);
        }
    });
}

// 既存パネルを復元（エラー時のフォールバック）
function restoreIndependentPanels() {
    const panels = [
        'character-select-panel',
        'scale-adjust-panel', 
        'realtime-preview-panel'
    ];
    
    panels.forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.style.display = 'block';
            console.log(`🔄 既存パネル復元: ${panelId}`);
        }
    });
}

// 統合メニューコンテナの作成
function createSlideMenuContainer() {
    // 既存のメニューコンテナを削除（重複回避）
    const existingMenu = document.getElementById('slide-menu-container');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    const isMobile = window.innerWidth <= 768;
    
    const menuContainer = document.createElement('div');
    menuContainer.id = 'slide-menu-container';
    menuContainer.style.cssText = `
        position: fixed;
        ${isMobile ? 
            'bottom: 0; left: 0; right: 0; height: 60vh;' : 
            'top: 0; right: 0; width: 350px; height: 100vh;'
        }
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid #ddd;
        ${isMobile ? 
            'border-top: 2px solid #4CAF50; border-radius: 15px 15px 0 0;' :
            'border-left: 2px solid #4CAF50; border-radius: 15px 0 0 15px;'
        }
        box-shadow: ${isMobile ? 
            '0 -5px 20px rgba(0,0,0,0.15)' :
            '-5px 0 20px rgba(0,0,0,0.15)'
        };
        z-index: 10000;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform: ${isMobile ? 'translateY(100%)' : 'translateX(100%)'};
        display: flex;
        flex-direction: column;
    `;
    
    // メニューの構造を作成（ハンドル + メインコンテンツ）
    menuContainer.innerHTML = `
        <!-- 左端ハンドル領域 -->
        <div id="slide-menu-handle" style="
            position: absolute;
            ${isMobile ? 'left: 0; top: -20px; right: 0; height: 20px;' : 'left: -20px; top: 0; width: 20px; bottom: 0;'}
            background: linear-gradient(${isMobile ? 'to bottom' : 'to right'}, rgba(76, 175, 80, 0.6), rgba(76, 175, 80, 0.8));
            cursor: ${isMobile ? 'ns-resize' : 'ew-resize'};
            z-index: 10001;
            border-radius: ${isMobile ? '8px 8px 0 0' : '8px 0 0 8px'};
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(76, 175, 80, 0.3);
            ${isMobile ? 'touch-action: manipulation;' : ''}
        ">
            <div style="
                width: ${isMobile ? '40px' : '8px'};
                height: ${isMobile ? '4px' : '40px'};
                background: rgba(255, 255, 255, 0.9);
                border-radius: 2px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
            "></div>
        </div>
        
        <!-- メインメニューコンテンツ -->
        <div id="slide-menu-main" style="
            flex: 1;
            display: flex;
            flex-direction: column;
        ">
            ${createSlideMenuContent()}
        </div>
    `;
    
    document.body.appendChild(menuContainer);
    
    // イベントリスナーを設定
    setupSlideMenuEvents(menuContainer);
    
    console.log(`📱 統合メニューコンテナ作成: ${isMobile ? 'モバイル' : 'デスクトップ'}モード`);
}

// スライドメニューの内容を作成
function createSlideMenuContent() {
    const isMobile = window.innerWidth <= 768;
    
    return `
        <!-- メニューヘッダー & タブバー -->
        <div style="
            display: flex;
            ${isMobile ? 'flex-direction: column;' : 'flex-direction: row;'}
            ${isMobile ? 'padding: 15px;' : 'padding: 10px;'}
            border-bottom: 1px solid #eee;
            background: rgba(76, 175, 80, 0.1);
        ">
            <!-- タブバー -->
            <div style="
                display: flex;
                ${isMobile ? 'justify-content: center;' : 'flex: 1;'}
                gap: 5px;
            ">
                <button class="menu-tab" data-tab="character" style="
                    padding: 6px 12px;
                    border: 1px solid #ddd;
                    background: ${activeMenuTab === 'character' ? '#4CAF50' : 'white'};
                    color: ${activeMenuTab === 'character' ? 'white' : '#333'};
                    border-radius: 15px;
                    cursor: pointer;
                    font-size: ${isMobile ? '12px' : '11px'};
                    transition: all 0.2s ease;
                ">🎭 キャラ</button>
                
                <button class="menu-tab" data-tab="scale" style="
                    padding: 6px 12px;
                    border: 1px solid #ddd;
                    background: ${activeMenuTab === 'scale' ? '#4CAF50' : 'white'};
                    color: ${activeMenuTab === 'scale' ? 'white' : '#333'};
                    border-radius: 15px;
                    cursor: pointer;
                    font-size: ${isMobile ? '12px' : '11px'};
                    transition: all 0.2s ease;
                ">📏 スケール</button>
                
                <button class="menu-tab" data-tab="preview" style="
                    padding: 6px 12px;
                    border: 1px solid #ddd;
                    background: ${activeMenuTab === 'preview' ? '#4CAF50' : 'white'};
                    color: ${activeMenuTab === 'preview' ? 'white' : '#333'};
                    border-radius: 15px;
                    cursor: pointer;
                    font-size: ${isMobile ? '12px' : '11px'};
                    transition: all 0.2s ease;
                ">📊 プレビュー</button>
            </div>
        </div>
        
        <!-- メニューコンテンツエリア -->
        <div id="slide-menu-content" style="
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            max-height: ${isMobile ? 'calc(60vh - 80px)' : 'calc(100vh - 80px)'};
        ">
            <!-- 動的コンテンツがここに表示される -->
        </div>
    `;
}

// スライドメニューのイベント設定
function setupSlideMenuEvents(container) {
    // 左端ハンドル領域
    const handleArea = container.querySelector('#slide-menu-handle');
    if (handleArea) {
        handleArea.addEventListener('click', toggleSlideMenu);
        
        // タッチイベントも追加（モバイル対応）
        handleArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            toggleSlideMenu();
        });
        
        // ホバー効果（デスクトップのみ）
        if (!isMobile) {
            handleArea.addEventListener('mouseenter', () => {
                handleArea.style.background = 'linear-gradient(to right, rgba(76, 175, 80, 0.8), rgba(76, 175, 80, 1))';
                handleArea.style.transform = 'scaleX(1.1)';
            });
            
            handleArea.addEventListener('mouseleave', () => {
                handleArea.style.background = 'linear-gradient(to right, rgba(76, 175, 80, 0.6), rgba(76, 175, 80, 0.8))';
                handleArea.style.transform = 'scale(1)';
            });
        }
        
        // タッツフィードバック（モバイルのみ）
        if (isMobile) {
            handleArea.addEventListener('touchstart', () => {
                handleArea.style.background = 'linear-gradient(to bottom, rgba(76, 175, 80, 0.8), rgba(76, 175, 80, 1))';
                handleArea.style.transform = 'scaleY(1.1)';
            });
            
            handleArea.addEventListener('touchend', () => {
                setTimeout(() => {
                    handleArea.style.background = 'linear-gradient(to bottom, rgba(76, 175, 80, 0.6), rgba(76, 175, 80, 0.8))';
                    handleArea.style.transform = 'scale(1)';
                }, 100);
            });
        }
    }
    
    // タブボタン
    const tabButtons = container.querySelectorAll('.menu-tab');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchMenuTab(tabName);
        });
    });
    
    console.log('🎯 スライドメニューイベント設定完了');
}

// スライドメニューの表示状態を切り替え
function toggleSlideMenu() {
    switch (slideMenuState) {
        case 'hidden':
            slideMenuState = 'minimized';
            break;
        case 'minimized':
            slideMenuState = 'full';
            break;
        case 'full':
            slideMenuState = 'minimized';
            break;
    }
    
    updateSlideMenuVisibility();
    console.log(`🎯 メニュー状態変更: ${slideMenuState}`);
}

// メニュータブを切り替え
function switchMenuTab(tabName) {
    if (activeMenuTab === tabName) return;
    
    activeMenuTab = tabName;
    
    // タブボタンのスタイル更新
    updateTabButtonStyles();
    
    // コンテンツ更新
    updateSlideMenuContent();
    
    console.log(`🎯 タブ切り替え: ${tabName}`);
}

// タブボタンのスタイル更新
function updateTabButtonStyles() {
    const container = document.getElementById('slide-menu-container');
    if (!container) return;
    
    const tabButtons = container.querySelectorAll('.menu-tab');
    tabButtons.forEach(btn => {
        const isActive = btn.dataset.tab === activeMenuTab;
        btn.style.background = isActive ? '#4CAF50' : 'white';
        btn.style.color = isActive ? 'white' : '#333';
    });
}

// スライドメニューの表示状態を更新
function updateSlideMenuVisibility() {
    const container = document.getElementById('slide-menu-container');
    if (!container) return;
    
    const isMobile = window.innerWidth <= 768;
    const mainContent = container.querySelector('#slide-menu-main');
    const handleArea = container.querySelector('#slide-menu-handle');
    
    switch (slideMenuState) {
        case 'hidden':
            container.style.transform = isMobile ? 'translateY(100%)' : 'translateX(100%)';
            if (mainContent) mainContent.style.display = 'none';
            if (handleArea) handleArea.style.display = 'none';
            break;
        case 'minimized':
            // ハンドルのみ表示（メインコンテンツは非表示）
            container.style.transform = isMobile ? 
                'translateY(calc(100% - 20px))' : 
                'translateX(calc(100% - 20px))';
            if (mainContent) mainContent.style.display = 'none';
            if (handleArea) handleArea.style.display = 'flex';
            break;
        case 'full':
            container.style.transform = isMobile ? 'translateY(0)' : 'translateX(0)';
            if (mainContent) mainContent.style.display = 'flex';
            if (handleArea) handleArea.style.display = 'flex';
            updateSlideMenuContent(); // フル表示時にコンテンツ更新
            break;
    }
    
    // トグルボタンのアイコン更新
    if (toggleBtn) {
        toggleBtn.innerHTML = slideMenuState === 'full' ? 
            (isMobile ? '▼' : '◀') : 
            (isMobile ? '▲' : '▶');
    }
    
    // 🆕 リアルタイムプレビューの位置を統合メニューの状態に合わせて更新
    const independentPreviewPanel = document.getElementById('independent-realtime-preview');
    if (independentPreviewPanel) {
        // 即座更新と遅延更新の両方で位置を確実に更新
        updateRealtimePreviewPosition(independentPreviewPanel);
        setTimeout(() => {
            updateRealtimePreviewPosition(independentPreviewPanel);
            console.log('📍 プレビューパネル位置再更新完了（統合メニュー連携）');
        }, 350); // アニメーション時間(300ms) + 余裕
    }
}

// スライドメニューのコンテンツを更新
function updateSlideMenuContent() {
    const contentArea = document.getElementById('slide-menu-content');
    if (!contentArea || slideMenuState !== 'full') return;
    
    switch (activeMenuTab) {
        case 'character':
            contentArea.innerHTML = getCharacterTabContent();
            setupCharacterTabEvents();
            break;
        case 'scale':
            contentArea.innerHTML = getScaleTabContent();
            setupScaleTabEvents();
            break;
        case 'preview':
            contentArea.innerHTML = getPreviewTabContent();
            setupPreviewTabEvents();
            break;
    }
    
    console.log(`📋 メニューコンテンツ更新: ${activeMenuTab}タブ`);
}

// ドラッグ開始時の自動最小化
function autoMinimizeOnDrag() {
    if (slideMenuState === 'full') {
        slideMenuState = 'minimized';
        updateSlideMenuVisibility();
        console.log('🎯 ドラッグ開始 → メニュー自動最小化');
    }
}

// ========== 各タブのコンテンツ生成 ========== //

// キャラクタータブのコンテンツ
function getCharacterTabContent() {
    if (!characters || characters.length === 0) {
        return '<div style="text-align: center; color: #666; padding: 20px;">キャラクターが検出されていません</div>';
    }
    
    let html = '<div style="margin-bottom: 8px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 4px;">🎭 キャラクター & レイヤー管理</div>';
    
    characters.forEach((char, index) => {
        const isActive = index === activeCharacterIndex;
        const displayName = char.name || `キャラクター${index + 1}`;
        
        html += `
            <div class="character-select-item" data-index="${index}" style="
                display: flex;
                align-items: center;
                padding: 8px;
                margin: 4px 0;
                background: ${isActive ? '#e3f2fd' : 'transparent'};
                border: 1px solid ${isActive ? '#2196F3' : '#ddd'};
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
            ">
                <div style="flex: 1;">
                    <div style="font-weight: ${isActive ? 'bold' : 'normal'}; color: ${isActive ? '#1976D2' : '#333'};">
                        ${displayName}
                    </div>
                    <div style="font-size: 11px; color: #666;">
                        レイヤー: ${char.element?.style.zIndex || 'auto'}
                    </div>
                </div>
                <div style="display: flex; gap: 4px;">
                    <button class="layer-btn" data-action="up" data-index="${index}" style="
                        width: 24px; height: 24px;
                        border: 1px solid #ddd;
                        background: white;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">↑</button>
                    <button class="layer-btn" data-action="down" data-index="${index}" style="
                        width: 24px; height: 24px;
                        border: 1px solid #ddd;
                        background: white;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">↓</button>
                </div>
            </div>
        `;
    });
    
    return html;
}

// スケールタブのコンテンツ
function getScaleTabContent() {
    // アクティブキャラクターから現在のスケール値を取得
    let currentScale = 1.0;
    if (characters[activeCharacterIndex]) {
        currentScale = characters[activeCharacterIndex].scale || 1.0;
    } else if (character?.skeleton?.scaleX) {
        currentScale = character.skeleton.scaleX;
    }
    
    return `
        <div style="margin-bottom: 8px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 4px;">📏 スケール調整</div>
        
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 8px; font-weight: bold;">スケール値:</label>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <input type="range" id="scale-slider-slide" min="0.1" max="3.0" step="0.05" 
                       value="${currentScale}" style="flex: 1;">
                <input type="number" id="scale-input-slide" min="0.1" max="3.0" step="0.05" 
                       value="${currentScale.toFixed(2)}" style="width: 70px; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <button id="scale-reset-btn-slide" style="
                width: 100%;
                padding: 8px;
                background: #ff9800;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
            ">リセット (1.0)</button>
        </div>
        
        <div style="font-size: 12px; color: #666; background: #f5f5f5; padding: 8px; border-radius: 4px;">
            💡 スライダーまたは数値入力でリアルタイム調整が可能です
        </div>
    `;
}

// プレビュータブのコンテンツ（統合メニュー内のプレビューを無効化）
function getPreviewTabContent() {
    return `
        <div style="padding: 30px; text-align: center; color: #666;">
            <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
            <div style="font-weight: bold; margin-bottom: 12px; color: #4CAF50;">プレビュー機能</div>
            <div style="font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
                リアルタイムプレビューは<br>
                統合メニューの直下に<br>
                独立パネルとして表示されます
            </div>
            <div style="background: #e8f5e8; padding: 12px; border-radius: 6px; font-size: 12px; color: #2e7d32;">
                💡 ヒント: プレビューパネルは編集中に自動で表示され、<br>
                キャラクターの位置・スケール・サイズ情報を<br>
                リアルタイムで確認できます。
            </div>
        </div>
    `;
}

// ========== 各タブのイベント設定 ========== //

// キャラクタータブのイベント
function setupCharacterTabEvents() {
    const contentArea = document.getElementById('slide-menu-content');
    if (!contentArea) return;
    
    // 既存のsetupCharacterPanelEventsを利用して、統合メニューでもドラッグ&ドロップを有効化
    setupCharacterPanelEvents(contentArea);
    
    // 統合メニュー特有のレイヤーボタンイベントのみ設定
    contentArea.querySelectorAll('.layer-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const action = btn.dataset.action;
            const index = parseInt(btn.dataset.index);
            
            if (action === 'up') {
                moveCharacterLayer(index, 'up');
            } else if (action === 'down') {
                moveCharacterLayer(index, 'down');
            }
            
            updateSlideMenuContent(); // レイヤー変更後にコンテンツ更新
        });
    });
}

// スケール適用関数（統合メニュー用）
function applyScale(newScale) {
    currentScale = newScale;
    
    // アクティブキャラクターのスケールを更新
    if (character && characters[activeCharacterIndex]) {
        // characters配列のスケール値も更新
        characters[activeCharacterIndex].scale = newScale;
        
        // 直接CSSでスケール調整
        const baseTransform = 'translate(-50%, -50%)';
        character.style.transform = `${baseTransform} scale(${newScale})`;
        console.log('🔧 統合メニュー: スケール更新:', {
            character: characters[activeCharacterIndex].name,
            element: character.tagName + (character.id ? '#' + character.id : ''),
            newScale: newScale,
            appliedTransform: character.style.transform,
            characterExists: !!character,
            elementRect: character.getBoundingClientRect()
        });
        
        // キャラクター選択パネルのUI更新
        updateCharacterSelectPanel();
        
        // リアルタイムプレビュー更新
        updateRealtimePreview();
        
        // 🆕 スケール変更を記録
        markAsChanged();
    } else {
        console.error('❌ アクティブキャラクターまたはcharacter要素がnullです - スケール更新失敗');
    }
}

// スケールタブのイベント
function setupScaleTabEvents() {
    const slider = document.getElementById('scale-slider-slide');
    const input = document.getElementById('scale-input-slide');
    const resetBtn = document.getElementById('scale-reset-btn-slide');
    
    if (slider && input) {
        console.log('🎯 統合メニュー: スケールタブイベント設定中...');
        
        // スライダーイベント
        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            input.value = value.toFixed(2);
            applyScale(value);
            console.log('📏 スライダー操作: スケール =', value);
        });
        
        // 数値入力イベント
        input.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && value >= 0.1 && value <= 3.0) {
                slider.value = value;
                applyScale(value);
                console.log('🔢 数値入力操作: スケール =', value);
            }
        });
        
        console.log('✅ 統合メニュー: スケールタブイベント設定完了');
    } else {
        console.error('❌ 統合メニュー: スケールタブの要素が見つかりません');
        console.log('- slider:', slider);
        console.log('- input:', input);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (slider) slider.value = '1.0';
            if (input) input.value = '1.00';
            applyScale(1.0);
            console.log('🔄 スケールリセット: 1.0');
        });
    }
}

// プレビュータブのイベント（無効化）
function setupPreviewTabEvents() {
    // プレビュー機能は独立パネルに移行したため、タブ内では無効化
    console.log('📝 プレビュータブ: 独立パネルへの移行により無効化');
}

// 統合メニューシステムの開始（編集モード開始時に呼び出し）
function startSlideMenuSystem() {
    const success = initSlideMenuSystem();
    if (success) {
        slideMenuState = 'minimized';
        updateSlideMenuVisibility();
        console.log('🎯 統合スライド式メニューシステム開始');
        return true;
    }
    return false;
}

// 統合メニューシステムの終了（編集モード終了時に呼び出し）
function stopSlideMenuSystem() {
    const container = document.getElementById('slide-menu-container');
    if (container) {
        container.remove();
    }
    
    // 既存パネルを復元
    restoreIndependentPanels();
    
    slideMenuState = 'hidden';
    console.log('🎯 統合スライド式メニューシステム終了');
}

console.log('✅ Spine編集システム v3.3 (統合スライド式メニュー版) 読み込み完了');
console.log('🆕 新機能: 変更検知・確認ダイアログ・一時保存・ロールバック・savePosition()最適化');
console.log('📱 新機能: モバイル対応・タッチ最適化・パネル重複回避・レイヤーボタン拡大');
console.log('🎯 新機能: 統合スライド式メニューシステム・3段階表示・タブ切り替え・自動最小化');
console.log('🧪 テスト関数: testEditStateManagement(), testConfirmDialog(), testTempSave(), testRollback()');

// =============================================================================
// 🔍 ドラッグハンドル総合診断システム v1.0
// =============================================================================

/**
 * 🔍 ドラッグハンドル診断の総合実行
 */
window.diagnoseDragHandles = function() {
    console.log('🔍 ===== ドラッグハンドル総合診断開始 =====');
    
    const results = {
        // 基本状態
        editMode: isEditMode,
        characterFound: !!character,
        
        // ハンドル要素診断
        handles: diagnoseDragHandleElements(),
        
        // イベント診断
        events: diagnoseDragEvents(),
        
        // 座標系診断
        coordinates: diagnoseDragCoordinates(),
        
        // 視覚的診断
        visual: diagnoseDragVisual(),
        
        // 編集モード診断
        editModeProcess: diagnoseEditModeProcess()
    };
    
    // 診断結果の表示
    displayDiagnosisResults(results);
    
    // 問題提案
    generateFixSuggestions(results);
    
    return results;
};

/**
 * 🔍 ハンドル要素の存在・表示診断
 */
function diagnoseDragHandleElements() {
    const diagnosis = {
        highlightContainer: null,
        borderElement: null,
        handles: [],
        handleCount: 0,
        centerHandle: null,
        visibility: {},
        zIndex: {}
    };
    
    try {
        // ハイライトコンテナの確認
        const highlightContainers = document.querySelectorAll('.character-highlight-container');
        diagnosis.highlightContainer = {
            found: highlightContainers.length > 0,
            count: highlightContainers.length,
            elements: Array.from(highlightContainers)
        };
        
        // 境界要素の確認
        const borderElements = document.querySelectorAll('.character-border');
        diagnosis.borderElement = {
            found: borderElements.length > 0,
            count: borderElements.length,
            elements: Array.from(borderElements)
        };
        
        // ハンドル要素の確認
        const handles = document.querySelectorAll('.character-drag-handle');
        diagnosis.handleCount = handles.length;
        
        handles.forEach((handle, index) => {
            const handleType = handle.dataset.handleType;
            const computedStyle = window.getComputedStyle(handle);
            const rect = handle.getBoundingClientRect();
            
            const handleInfo = {
                element: handle,
                type: handleType,
                dataset: {...handle.dataset},
                visible: computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden',
                opacity: computedStyle.opacity,
                zIndex: computedStyle.zIndex,
                position: {
                    left: computedStyle.left,
                    top: computedStyle.top,
                    transform: computedStyle.transform
                },
                rect: {
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height
                },
                pointerEvents: computedStyle.pointerEvents,
                cursor: computedStyle.cursor
            };
            
            diagnosis.handles.push(handleInfo);
            
            if (handleType === 'center') {
                diagnosis.centerHandle = handleInfo;
            }
        });
        
    } catch (error) {
        diagnosis.error = error.message;
        console.error('❌ ハンドル要素診断エラー:', error);
    }
    
    return diagnosis;
}

/**
 * 🔍 ドラッグイベントの診断
 */
function diagnoseDragEvents() {
    const diagnosis = {
        centerHandleEvents: null,
        documentEvents: null,
        isDragging: isDragging,
        dragVariables: {
            initialX: typeof initialX !== 'undefined' ? initialX : null,
            initialY: typeof initialY !== 'undefined' ? initialY : null,
            currentX: typeof currentX !== 'undefined' ? currentX : null,
            currentY: typeof currentY !== 'undefined' ? currentY : null
        }
    };
    
    try {
        // 中央ハンドルのイベントリスナー確認
        const centerHandle = document.querySelector('.character-drag-handle.handle-center');
        if (centerHandle) {
            diagnosis.centerHandleEvents = {
                found: true,
                hasMousedown: testEventListener(centerHandle, 'mousedown'),
                hasTouchstart: testEventListener(centerHandle, 'touchstart'),
                hasMouseenter: testEventListener(centerHandle, 'mouseenter'),
                hasMouseleave: testEventListener(centerHandle, 'mouseleave')
            };
        } else {
            diagnosis.centerHandleEvents = { found: false };
        }
        
        // ドキュメントレベルのイベント確認
        diagnosis.documentEvents = {
            hasMousemove: testEventListener(document, 'mousemove'),
            hasTouchmove: testEventListener(document, 'touchmove'),
            hasMouseup: testEventListener(document, 'mouseup'),
            hasTouchend: testEventListener(document, 'touchend')
        };
        
    } catch (error) {
        diagnosis.error = error.message;
        console.error('❌ イベント診断エラー:', error);
    }
    
    return diagnosis;
}

/**
 * 🔍 座標系・変位計算の診断
 */
function diagnoseDragCoordinates() {
    const diagnosis = {
        character: null,
        viewport: null,
        calculations: null
    };
    
    try {
        if (character) {
            const rect = character.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(character);
            
            diagnosis.character = {
                rect: {
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    centerX: rect.x + rect.width / 2,
                    centerY: rect.y + rect.height / 2
                },
                style: {
                    left: computedStyle.left,
                    top: computedStyle.top,
                    transform: computedStyle.transform,
                    position: computedStyle.position
                }
            };
        }
        
        diagnosis.viewport = {
            width: window.innerWidth,
            height: window.innerHeight,
            scrollX: window.scrollX,
            scrollY: window.scrollY
        };
        
        // 座標計算テスト
        diagnosis.calculations = testCoordinateCalculations();
        
    } catch (error) {
        diagnosis.error = error.message;
        console.error('❌ 座標診断エラー:', error);
    }
    
    return diagnosis;
}

/**
 * 🔍 視覚的要素の診断
 */
function diagnoseDragVisual() {
    const diagnosis = {
        layering: null,
        styling: null,
        conflicts: []
    };
    
    try {
        // z-index階層の確認
        const allElements = document.querySelectorAll('*');
        const zIndexElements = [];
        
        allElements.forEach(el => {
            const style = window.getComputedStyle(el);
            const zIndex = parseInt(style.zIndex);
            if (!isNaN(zIndex) && zIndex > 0) {
                zIndexElements.push({
                    element: el,
                    zIndex: zIndex,
                    className: el.className,
                    id: el.id
                });
            }
        });
        
        diagnosis.layering = {
            maxZIndex: Math.max(...zIndexElements.map(el => el.zIndex)),
            handleZIndex: 10002,  // ハンドルの予定z-index
            conflicts: zIndexElements.filter(el => el.zIndex >= 10002)
        };
        
        // CSS競合の確認
        const handleElements = document.querySelectorAll('.character-drag-handle');
        diagnosis.styling = {
            handleCount: handleElements.length,
            styles: Array.from(handleElements).map(handle => ({
                type: handle.dataset.handleType,
                computedStyle: {
                    position: window.getComputedStyle(handle).position,
                    zIndex: window.getComputedStyle(handle).zIndex,
                    pointerEvents: window.getComputedStyle(handle).pointerEvents,
                    display: window.getComputedStyle(handle).display,
                    opacity: window.getComputedStyle(handle).opacity
                }
            }))
        };
        
    } catch (error) {
        diagnosis.error = error.message;
        console.error('❌ 視覚診断エラー:', error);
    }
    
    return diagnosis;
}

/**
 * 🔍 編集モード起動プロセスの診断
 */
function diagnoseEditModeProcess() {
    const diagnosis = {
        currentMode: isEditMode,
        toggleFunction: typeof toggleEditMode === 'function',
        initFunction: typeof initializeMinimalEditSystem === 'function',
        variables: {
            character: !!character,
            characters: Array.isArray(characters) ? characters.length : null,
            currentScale: currentScale,
            isEditMode: isEditMode,
            isDragging: isDragging
        }
    };
    
    return diagnosis;
}

/**
 * 🔧 イベントリスナーの存在テスト（簡易版）
 */
function testEventListener(element, eventType) {
    // 実際のイベントリスナーの確認は困難なため、
    // 要素の状態から推測する
    if (!element) return false;
    
    try {
        // テストイベントを発火して反応を確認
        const testEvent = new Event(eventType, { bubbles: true, cancelable: true });
        const originalPreventDefault = testEvent.preventDefault;
        let preventDefaultCalled = false;
        
        testEvent.preventDefault = function() {
            preventDefaultCalled = true;
            originalPreventDefault.call(this);
        };
        
        element.dispatchEvent(testEvent);
        return preventDefaultCalled || testEvent.defaultPrevented;
        
    } catch (error) {
        return false;
    }
}

/**
 * 🔧 座標計算のテスト
 */
function testCoordinateCalculations() {
    const results = {
        viewportToCharacter: null,
        characterToViewport: null,
        transformCalculation: null
    };
    
    try {
        if (character) {
            const rect = character.getBoundingClientRect();
            
            // ビューポート座標からキャラクター相対座標への変換テスト
            const testViewportX = window.innerWidth / 2;
            const testViewportY = window.innerHeight / 2;
            
            results.viewportToCharacter = {
                input: { x: testViewportX, y: testViewportY },
                characterRect: rect,
                relativeX: testViewportX - rect.left,
                relativeY: testViewportY - rect.top
            };
        }
        
    } catch (error) {
        results.error = error.message;
    }
    
    return results;
}

/**
 * 📊 診断結果の表示
 */
function displayDiagnosisResults(results) {
    console.log('📊 ===== 診断結果サマリー =====');
    
    // 基本状態
    console.log(`🔄 編集モード: ${results.editMode ? '✅ 有効' : '❌ 無効'}`);
    console.log(`👤 キャラクター: ${results.characterFound ? '✅ 検出' : '❌ 未検出'}`);
    
    // ハンドル要素
    const handles = results.handles;
    console.log(`🎯 ハンドル要素: ${handles.handleCount}個`);
    console.log(`🎯 中央ハンドル: ${handles.centerHandle ? '✅ 存在' : '❌ 不存在'}`);
    
    if (handles.centerHandle) {
        const center = handles.centerHandle;
        console.log(`   - 表示: ${center.visible ? '✅' : '❌'}`);
        console.log(`   - z-index: ${center.zIndex}`);
        console.log(`   - pointer-events: ${center.pointerEvents}`);
        console.log(`   - 位置: ${center.position.left}, ${center.position.top}`);
    }
    
    // イベント
    const events = results.events;
    if (events.centerHandleEvents && events.centerHandleEvents.found) {
        console.log(`🖱️ 中央ハンドルイベント:`);
        console.log(`   - mousedown: ${events.centerHandleEvents.hasMousedown ? '✅' : '❌'}`);
        console.log(`   - touchstart: ${events.centerHandleEvents.hasTouchstart ? '✅' : '❌'}`);
    }
    
    // 座標系
    const coords = results.coordinates;
    if (coords.character) {
        console.log(`📍 キャラクター座標:`);
        console.log(`   - 中心: (${Math.round(coords.character.rect.centerX)}, ${Math.round(coords.character.rect.centerY)})`);
        console.log(`   - サイズ: ${Math.round(coords.character.rect.width)}x${Math.round(coords.character.rect.height)}`);
    }
    
    // 視覚的問題
    const visual = results.visual;
    if (visual.layering && visual.layering.conflicts.length > 0) {
        console.warn(`⚠️ z-index競合: ${visual.layering.conflicts.length}個の要素`);
        visual.layering.conflicts.forEach(conflict => {
            console.warn(`   - ${conflict.className || conflict.id || 'unnamed'}: z-index ${conflict.zIndex}`);
        });
    }
}

/**
 * 🔧 修正提案の生成
 */
function generateFixSuggestions(results) {
    console.log('🔧 ===== 修正提案 =====');
    
    const suggestions = [];
    
    // 編集モードが無効
    if (!results.editMode) {
        suggestions.push({
            issue: '編集モードが無効',
            solution: 'toggleEditMode()を実行してください',
            command: 'toggleEditMode()'
        });
    }
    
    // キャラクターが未検出
    if (!results.characterFound) {
        suggestions.push({
            issue: 'キャラクターが検出されない',
            solution: 'キャラクター要素の存在確認とセレクター更新が必要',
            command: 'console.log(document.querySelectorAll("[id*=purattokun], [class*=character]"))'
        });
    }
    
    // ハンドルが存在しない
    if (results.handles.handleCount === 0) {
        suggestions.push({
            issue: 'ハンドル要素が存在しない',
            solution: '編集モードの初期化とハンドル生成が必要',
            command: 'initializeMinimalEditSystem()'
        });
    }
    
    // 中央ハンドルが存在しない
    if (!results.handles.centerHandle) {
        suggestions.push({
            issue: '中央ハンドル（ドラッグ用）が存在しない',
            solution: 'ハンドル生成プロセスの確認が必要',
            command: 'console.log(document.querySelectorAll(".handle-center"))'
        });
    }
    
    // 中央ハンドルが非表示
    if (results.handles.centerHandle && !results.handles.centerHandle.visible) {
        suggestions.push({
            issue: '中央ハンドルが非表示',
            solution: 'CSS display/visibility プロパティの確認',
            command: 'document.querySelector(".handle-center").style.cssText'
        });
    }
    
    // イベントリスナーの問題
    if (results.events.centerHandleEvents && results.events.centerHandleEvents.found && 
        (!results.events.centerHandleEvents.hasMousedown || !results.events.centerHandleEvents.hasTouchstart)) {
        suggestions.push({
            issue: '中央ハンドルのイベントリスナーが不完全',
            solution: 'イベント設定の再実行が必要',
            command: 'initializeMinimalEditSystem()'
        });
    }
    
    // z-index競合
    if (results.visual.layering && results.visual.layering.conflicts.length > 0) {
        suggestions.push({
            issue: 'z-index競合によりハンドルが隠れている可能性',
            solution: 'ハンドルのz-indexを競合要素より高く設定',
            command: `document.querySelectorAll('.character-drag-handle').forEach(h => h.style.zIndex = '${results.visual.layering.maxZIndex + 1}')`
        });
    }
    
    // 提案の表示
    if (suggestions.length === 0) {
        console.log('✅ 大きな問題は検出されませんでした');
    } else {
        suggestions.forEach((suggestion, index) => {
            console.log(`${index + 1}. ❌ ${suggestion.issue}`);
            console.log(`   🔧 ${suggestion.solution}`);
            console.log(`   💻 ${suggestion.command}`);
            console.log('');
        });
    }
    
    return suggestions;
}

/**
 * 🧪 ドラッグハンドルのクリックテスト
 */
window.testDragHandleClick = function() {
    console.log('🧪 ===== ドラッグハンドルクリックテスト =====');
    
    const centerHandle = document.querySelector('.character-drag-handle.handle-center');
    if (!centerHandle) {
        console.error('❌ 中央ハンドルが見つかりません');
        return false;
    }
    
    console.log('🎯 中央ハンドルを発見:', centerHandle);
    
    // マウスダウンイベントのシミュレーション
    const mouseEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: centerHandle.getBoundingClientRect().left + centerHandle.offsetWidth / 2,
        clientY: centerHandle.getBoundingClientRect().top + centerHandle.offsetHeight / 2
    });
    
    console.log('🖱️ mousedownイベントを送信:', mouseEvent);
    
    let eventHandled = false;
    const originalStartDrag = window.startDrag;
    
    // startDrag関数の監視
    window.startDrag = function(e) {
        console.log('✅ startDrag関数が呼び出されました!', e);
        eventHandled = true;
        return originalStartDrag.call(this, e);
    };
    
    // イベント発火
    centerHandle.dispatchEvent(mouseEvent);
    
    // 元の関数を復元
    window.startDrag = originalStartDrag;
    
    setTimeout(() => {
        if (eventHandled) {
            console.log('✅ テスト成功: ハンドルクリックが正常に処理されました');
        } else {
            console.error('❌ テスト失敗: ハンドルクリックが処理されませんでした');
        }
    }, 100);
    
    return eventHandled;
};

/**
 * 🎯 ドラッグ動作の段階的テスト 
 */
window.testDragSequence = function() {
    console.log('🎯 ===== ドラッグ動作段階的テスト =====');
    
    const centerHandle = document.querySelector('.character-drag-handle.handle-center');
    if (!centerHandle) {
        console.error('❌ 中央ハンドルが見つかりません');
        return false;
    }
    
    const rect = centerHandle.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    console.log('📍 ハンドル中心座標:', { x: centerX, y: centerY });
    
    // Step 1: mousedown
    setTimeout(() => {
        console.log('1️⃣ mousedown イベント送信');
        const mousedown = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: centerX,
            clientY: centerY
        });
        centerHandle.dispatchEvent(mousedown);
    }, 500);
    
    // Step 2: mousemove
    setTimeout(() => {
        console.log('2️⃣ mousemove イベント送信');
        const mousemove = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            clientX: centerX + 50,
            clientY: centerY + 30
        });
        document.dispatchEvent(mousemove);
    }, 1000);
    
    // Step 3: mouseup
    setTimeout(() => {
        console.log('3️⃣ mouseup イベント送信');
        const mouseup = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            clientX: centerX + 50,
            clientY: centerY + 30
        });
        document.dispatchEvent(mouseup);
        
        console.log('✅ ドラッグシーケンステスト完了');
    }, 1500);
    
    return true;
};

/**
 * 🔍 クイック診断（コンソール用簡易版）
 */
window.quickDragDiagnosis = function() {
    console.log('🔍 ===== クイック診断 =====');
    
    const editMode = isEditMode;
    const hasCharacter = !!character;
    const handles = document.querySelectorAll('.character-drag-handle');
    const centerHandle = document.querySelector('.character-drag-handle.handle-center');
    
    console.log(`編集モード: ${editMode ? '✅' : '❌'}`);
    console.log(`キャラクター: ${hasCharacter ? '✅' : '❌'}`);
    console.log(`ハンドル数: ${handles.length}個`);
    console.log(`中央ハンドル: ${centerHandle ? '✅' : '❌'}`);
    
    if (centerHandle) {
        const style = window.getComputedStyle(centerHandle);
        console.log(`中央ハンドル表示: ${style.display !== 'none' ? '✅' : '❌'}`);
        console.log(`中央ハンドルz-index: ${style.zIndex}`);
    }
    
    if (!editMode) console.log('💡 修正: toggleEditMode() を実行');
    if (!hasCharacter) console.log('💡 修正: キャラクター要素を確認');
    if (handles.length === 0) console.log('💡 修正: initializeMinimalEditSystem() を実行');
    
    return { editMode, hasCharacter, handleCount: handles.length, centerHandle: !!centerHandle };
};

// 診断システムの使用方法をコンソールに表示
console.log('🔍 ===== ドラッグハンドル診断システム利用可能 =====');
console.log('💻 使用可能なコマンド:');
console.log('   • diagnoseDragHandles() - 総合診断実行');
console.log('   • quickDragDiagnosis() - クイック診断');
console.log('   • testDragHandleClick() - ハンドルクリックテスト');
console.log('   • testDragSequence() - ドラッグ動作テスト');
console.log('========================================');
// 🔍 キャラクター選択パネル専用診断システム v1.0
/**
 * 🎭 キャラクター選択パネルのドラッグハンドル診断
 */
window.diagnoseCharacterPanel = function() {
    console.log('🎭 ===== キャラクター選択パネル診断開始 =====');
    
    const results = {
        panel: null,
        characterItems: [],
        dragHandles: [],
        issues: []
    };
    
    // 1. パネルの存在確認
    const panel = document.getElementById('character-select-panel');
    results.panel = {
        exists: !!panel,
        visible: panel ? window.getComputedStyle(panel).display !== 'none' : false,
        position: panel ? window.getComputedStyle(panel).position : null
    };
    
    if (!panel) {
        results.issues.push('❌ キャラクター選択パネルが存在しない');
        console.log('❌ キャラクター選択パネルが見つかりません');
        console.log('🔧 修正: 編集モードを開始してください → toggleEditMode()');
        return results;
    }
    
    console.log('✅ キャラクター選択パネル: 存在');
    console.log('   表示状態: ' + (results.panel.visible ? '✅ 表示中' : '❌ 非表示'));
    
    // 2. キャラクターアイテムの確認
    const characterItems = panel.querySelectorAll('.character-select-item');
    console.log('🎯 キャラクターアイテム数: ' + characterItems.length + '個');
    
    characterItems.forEach((item, index) => {
        const itemData = {
            index: index,
            element: item,
            innerHTML: item.innerHTML,
            draggable: item.getAttribute('draggable'),
            style: {
                display: window.getComputedStyle(item).display,
                cursor: window.getComputedStyle(item).cursor,
                pointerEvents: window.getComputedStyle(item).pointerEvents
            }
        };
        
        // ≡マークの存在確認
        const dragHandle = item.querySelector('span:first-child');
        if (dragHandle) {
            const handleText = dragHandle.textContent.trim();
            itemData.dragHandle = {
                exists: true,
                text: handleText,
                isCorrect: handleText === '≡',
                style: {
                    fontSize: window.getComputedStyle(dragHandle).fontSize,
                    color: window.getComputedStyle(dragHandle).color,
                    display: window.getComputedStyle(dragHandle).display
                }
            };
        } else {
            itemData.dragHandle = { exists: false };
        }
        
        results.characterItems.push(itemData);
        
        // 詳細ログ出力
        console.log('   📝 アイテム ' + (index + 1) + ':');
        console.log('      - draggable属性: ' + (itemData.draggable || '未設定'));
        console.log('      - ≡マーク: ' + (itemData.dragHandle.exists ? (itemData.dragHandle.isCorrect ? '✅ 正常' : '❌ 異常 (' + itemData.dragHandle.text + ')') : '❌ 不存在'));
        console.log('      - カーソル: ' + itemData.style.cursor);
    });
    
    // 3. ドラッグイベントの確認
    console.log('🎯 ドラッグイベントリスナー確認:');
    let hasEvents = 0;
    
    characterItems.forEach((item, index) => {
        const events = ['dragstart', 'dragend', 'dragover', 'dragleave', 'drop'];
        events.forEach(eventType => {
            // イベントリスナーの存在をテスト（間接的）
            try {
                const hasListener = item['on' + eventType] !== null || 
                                    item.getAttribute('on' + eventType) !== null;
                if (hasListener) hasEvents++;
            } catch (e) {
                // イベントリスナーの直接確認は困難なため、基本チェックのみ
            }
        });
    });
    
    console.log('   検出されたイベント数: ' + hasEvents);
    
    // 4. 問題の特定と修正提案
    const issues = [];
    if (characterItems.length === 0) {
        issues.push('❌ キャラクターアイテムが存在しない');
    }
    
    characterItems.forEach((item, index) => {
        const data = results.characterItems[index];
        if (data.draggable !== 'true') {
            issues.push('❌ アイテム' + (index + 1) + ': draggable属性が未設定');
        }
        if (!data.dragHandle.exists) {
            issues.push('❌ アイテム' + (index + 1) + ': ≡マークが不存在');
        } else if (!data.dragHandle.isCorrect) {
            issues.push('❌ アイテム' + (index + 1) + ': ≡マークが異常 (' + data.dragHandle.text + ')');
        }
        if (data.style.cursor !== 'move') {
            issues.push('❌ アイテム' + (index + 1) + ': カーソルがmoveでない (' + data.style.cursor + ')');
        }
    });
    
    results.issues = issues;
    
    // 5. 修正提案の表示
    console.log('🔧 ===== 修正提案 =====');
    if (issues.length === 0) {
        console.log('✅ 大きな問題は検出されませんでした');
        console.log('🧪 ドラッグ操作をテストしてみてください');
    } else {
        issues.forEach(issue => console.log(issue));
        
        // 具体的な修正コマンド提案
        console.log('💻 修正コマンド:');
        console.log('   // パネル再生成');
        console.log('   updateCharacterSelectPanel()');
        console.log('   // 編集モード再初期化');
        console.log('   initializeMinimalEditSystem()');
    }
    
    return results;
};

/**
 * 🧪 キャラクター選択パネルのドラッグテスト
 */
window.testCharacterPanelDrag = function() {
    console.log('🧪 ===== キャラクター選択パネル ドラッグテスト =====');
    
    const panel = document.getElementById('character-select-panel');
    if (!panel) {
        console.error('❌ キャラクター選択パネルが見つかりません');
        return false;
    }
    
    const items = panel.querySelectorAll('.character-select-item');
    if (items.length < 2) {
        console.error('❌ テスト用のキャラクターアイテムが不足 (2個以上必要)');
        return false;
    }
    
    const sourceItem = items[0];
    const targetItem = items[1];
    
    console.log('🎯 テスト: ' + sourceItem.textContent.trim() + ' → ' + targetItem.textContent.trim());
    
    // ドラッグ開始イベント
    const dragStartEvent = new Event('dragstart', { bubbles: true });
    dragStartEvent.dataTransfer = {
        effectAllowed: 'move',
        setData: function() {},
        getData: function() { return ''; }
    };
    
    console.log('📤 dragstart イベント送信...');
    sourceItem.dispatchEvent(dragStartEvent);
    
    // ドロップイベント（1秒後）
    setTimeout(function() {
        const dropEvent = new Event('drop', { bubbles: true });
        dropEvent.dataTransfer = dragStartEvent.dataTransfer;
        
        console.log('📥 drop イベント送信...');
        targetItem.dispatchEvent(dropEvent);
        
        // ドラッグ終了イベント
        const dragEndEvent = new Event('dragend', { bubbles: true });
        console.log('🏁 dragend イベント送信...');
        sourceItem.dispatchEvent(dragEndEvent);
        
        console.log('✅ ドラッグテスト完了');
        console.log('   結果を visually確認してください（レイヤー順序変更）');
    }, 1000);
    
    return true;
};

// 使用方法をコンソールに追加表示
console.log('🎭 ===== キャラクター選択パネル診断機能 追加 =====');
console.log('💻 追加コマンド:');
console.log('   • diagnoseCharacterPanel() - パネル専用診断');
console.log('   • testCharacterPanelDrag() - パネルドラッグテスト');
console.log('================================================');
// 🎯 改良されたドラッグハンドルシステム
// ユーザーの要求に応じて ⋮⋮ マークを使用し、視覚的に分かりやすくする

/**
 * 改良されたキャラクター選択パネル更新関数
 * - ⋮⋮ マークの使用
 * - 改善された視覚的フィードバック
 * - より分かりやすいドラッグハンドル
 */
function updateCharacterSelectPanelImproved() {
    const panel = document.getElementById('character-select-panel');
    if (!panel) return;
    
    let html = '<div style="margin-bottom: 8px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 4px;">🎭 キャラクター & レイヤー管理</div>';
    
    if (characters.length === 0) {
        html += '<div style="color: #999; font-style: italic;">キャラクターが見つかりません</div>';
    } else {
        // 🆕 改善されたレイヤー制御説明
        html += '<div style="font-size: 11px; color: #666; margin-bottom: 6px; padding: 4px; background: #f9f9f9; border-radius: 3px;">📖 左の⋮⋮をドラッグして並び替え（上が前面）</div>';
        
        characters.forEach((char, index) => {
            const isActive = index === activeCharacterIndex;
            const statusIcon = isActive ? '🎯' : '⚪';
            const scaleValue = char.scale ? char.scale.toFixed(2) : '1.00';
            
            html += `
                <div class="character-select-item" 
                     data-index="${index}" 
                     draggable="true"
                     style="padding: 6px 8px; margin: 2px 0; border-radius: 4px; cursor: move; 
                            background: ${isActive ? '#e3f2fd' : 'transparent'}; 
                            border: ${isActive ? '2px solid #ff6b6b' : '1px solid #ddd'};
                            display: flex; align-items: center; gap: 8px;
                            transition: all 0.2s ease;
                            position: relative;">
                    
                    <!-- 改良されたドラッグハンドル -->
                    <span class="drag-handle" 
                          style="font-size: 14px; 
                                 color: #666; 
                                 cursor: grab;
                                 padding: 2px 4px;
                                 border-radius: 3px;
                                 transition: all 0.2s ease;
                                 user-select: none;
                                 line-height: 1;
                                 display: inline-block;
                                 min-width: 16px;
                                 text-align: center;"
                          onmouseover="this.style.background='#f0f0f0'; this.style.color='#333'; this.style.cursor='grab';"
                          onmouseout="this.style.background='transparent'; this.style.color='#666';"
                          onmousedown="this.style.cursor='grabbing';"
                          onmouseup="this.style.cursor='grab';">⋮⋮</span>
                    
                    <span style="font-size: 16px;">${statusIcon}</span>
                    <div style="flex: 1;">
                        <div style="font-weight: ${isActive ? 'bold' : 'normal'}; color: ${isActive ? '#ff6b6b' : '#333'};">
                            ${char.name}
                        </div>
                        <div style="font-size: 11px; color: #666;">
                            z-index: ${char.zIndex} • Scale: ${scaleValue}
                        </div>
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <button class="layer-btn" data-action="up" style="
                            background: #4CAF50; color: white; border: none; 
                            border-radius: 3px; padding: 2px 6px; font-size: 10px; cursor: pointer;
                            transition: background 0.2s ease;" 
                            onmouseover="this.style.background='#45a049'" 
                            onmouseout="this.style.background='#4CAF50'">↑</button>
                        <button class="layer-btn" data-action="down" style="
                            background: #f44336; color: white; border: none; 
                            border-radius: 3px; padding: 2px 6px; font-size: 10px; cursor: pointer;
                            transition: background 0.2s ease;" 
                            onmouseover="this.style.background='#da190b'" 
                            onmouseout="this.style.background='#f44336'">↓</button>
                    </div>
                </div>`;
        });
    }
    
    panel.innerHTML = html;
    
    // 改良されたイベントリスナーの設定
    setupImprovedDragEventListeners();
}

// グローバル関数として登録
window.updateCharacterSelectPanelImproved = updateCharacterSelectPanelImproved;

console.log('🎯 ===== 改良されたドラッグハンドルシステム読み込み完了 =====');
console.log('💻 使用方法:');
console.log('   1. updateCharacterSelectPanelImproved() - 改良版パネル更新');
console.log('   2. 編集モードで⋮⋮ハンドルをドラッグして並び替え');
console.log('   3. diagnoseCharacterPanel() - 診断実行');
console.log('========================================');

// 🔄 既存システムを改良版で置き換えるパッチ関数
window.applyImprovedDragHandlePatch = function() {
    console.log('🔄 ===== ドラッグハンドル改良パッチ適用開始 =====');
    
    // 元の関数を改良版で置き換え
    if (typeof updateCharacterSelectPanel === 'function') {
        // バックアップ保存
        window.originalUpdateCharacterSelectPanel = updateCharacterSelectPanel;
        console.log('💾 元のupdateCharacterSelectPanel関数をバックアップ');
    }
    
    // 改良版を元の関数名で登録
    window.updateCharacterSelectPanel = updateCharacterSelectPanelImproved;
    console.log('✅ updateCharacterSelectPanel関数を改良版で置き換え');
    
    // パネルを即座に更新
    if (isEditMode && document.getElementById('character-select-panel')) {
        updateCharacterSelectPanel();
        console.log('🔄 キャラクター選択パネルを改良版で更新');
    }
    
    console.log('✅ ===== ドラッグハンドル改良パッチ適用完了 =====');
    console.log('   • ⋮⋮ ハンドルが表示されます');
    console.log('   • 改良されたホバー効果');
    console.log('   • より分かりやすいドラッグ&ドロップ');
    console.log('   • diagnoseCharacterPanel() で診断可能');
    
    return true;
};

// 🔄 元に戻すためのリストア関数
window.restoreOriginalDragHandle = function() {
    if (typeof originalUpdateCharacterSelectPanel === 'function') {
        window.updateCharacterSelectPanel = originalUpdateCharacterSelectPanel;
        console.log('🔄 元のupdateCharacterSelectPanel関数を復元');
        
        // パネルを元に戻す
        if (isEditMode && document.getElementById('character-select-panel')) {
            updateCharacterSelectPanel();
            console.log('🔄 キャラクター選択パネルを元の版で更新');
        }
        return true;
    } else {
        console.log('❌ 元の関数のバックアップが見つかりません');
        return false;
    }
};

// 自動でパッチを適用するかどうかの確認
console.log('🎯 ===== ドラッグハンドル改良システム準備完了 =====');
console.log('💻 使用方法:');
console.log('   • applyImprovedDragHandlePatch() - 改良パッチ適用');
console.log('   • restoreOriginalDragHandle() - 元に戻す');
console.log('   • diagnoseCharacterPanel() - 問題診断');
console.log('   • testCharacterPanelDrag() - ドラッグテスト');
console.log('=========================================');
