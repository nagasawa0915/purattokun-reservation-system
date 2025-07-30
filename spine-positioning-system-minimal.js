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
                    zIndex: 1000 + characters.length, // 🆕 レイヤー管理用z-index
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
        // 🚨 修正: 全てのキャラクターからドラッグイベントを削除
        char.element.removeEventListener('mousedown', startDrag);
        char.element.style.cursor = isEditMode ? 'default' : 'default';
    });
    
    // 新しいアクティブキャラクターを設定
    activeCharacterIndex = index;
    const activeChar = characters[index];
    activeChar.isActive = true;
    
    // グローバル変数（後方互換性）を更新
    character = activeChar.element;
    currentScale = activeChar.scale;
    
    // 🚨 修正: アクティブキャラクターにのみドラッグイベントを追加
    if (isEditMode) {
        character.style.cursor = 'move';
        character.addEventListener('mousedown', startDrag);
        console.log('🎯 ドラッグイベントを設定:', activeChar.name);
    }
    
    // ハイライト表示
    addCharacterHighlight(activeChar.element);
    
    console.log('🎯 アクティブキャラクター変更:', activeChar.name);
    
    // スケールパネルのUI更新
    updateScalePanelForActiveCharacter();
    
    return true;
}

// ========== 🆕 レイヤー順序制御システム ========== //
function applyZIndexToAllCharacters() {
    characters.forEach((char, index) => {
        // インデックス順に基づいてz-indexを設定（後のものが前面）
        char.zIndex = 1000 + index;
        char.element.style.zIndex = char.zIndex;
        console.log(`🔢 z-index設定: ${char.name} → ${char.zIndex}`);
    });
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

function addCharacterHighlight(element) {
    if (!element) return;
    
    // ハイライト用のクラスを追加
    element.classList.add('character-highlighted');
    
    // 動的スタイル適用
    element.style.outline = '3px solid #ff6b6b';
    element.style.outlineOffset = '2px';
    element.style.boxShadow = '0 0 15px rgba(255, 107, 107, 0.5)';
    element.style.transition = 'all 0.3s ease';
}

function removeCharacterHighlight(element) {
    if (!element) return;
    
    element.classList.remove('character-highlighted');
    element.style.outline = '';
    element.style.outlineOffset = '';
    element.style.boxShadow = '';
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
}

// ========== UI作成 ========== //
function createEditButton() {
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
    
    // キャラクター選択パネル
    createCharacterSelectPanel();
    
    // スケール調整パネル
    createScalePanel();
}

function createCharacterSelectPanel() {
    const panel = document.createElement('div');
    panel.id = 'character-select-panel';
    panel.style.cssText = `
        position: fixed;
        top: 60px;
        right: 10px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        z-index: 10000;
        display: none;
        min-width: 200px;
        font-size: 14px;
    `;
    
    document.body.appendChild(panel);
    updateCharacterSelectPanel();
}

function updateCharacterSelectPanel() {
    const panel = document.getElementById('character-select-panel');
    if (!panel) return;
    
    let html = '<div style="margin-bottom: 8px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 4px;">🎭 キャラクター & レイヤー管理</div>';
    
    if (characters.length === 0) {
        html += '<div style="color: #999; font-style: italic;">キャラクターが見つかりません</div>';
    } else {
        // 🆕 レイヤー制御説明
        html += '<div style="font-size: 11px; color: #666; margin-bottom: 8px; padding: 4px; background: #f9f9f9; border-radius: 3px;">ドラッグで並び替え：下ほど前面に表示</div>';
        
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
                                style="width: 20px; height: 20px; font-size: 10px; padding: 0; border: 1px solid #ddd; background: white; cursor: pointer;" title="最前面">⬆</button>
                        <button class="layer-btn" data-action="back" data-index="${index}" 
                                style="width: 20px; height: 20px; font-size: 10px; padding: 0; border: 1px solid #ddd; background: white; cursor: pointer;" title="最背面">⬇</button>
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
}

// 🆕 キャラクターパネルのイベント設定（ドラッグ&ドロップ + ボタン）
function setupCharacterPanelEvents(panel) {
    let draggedItem = null;
    let draggedIndex = -1;
    
    panel.querySelectorAll('.character-select-item').forEach(item => {
        const index = parseInt(item.dataset.index);
        
        // 🎯 キャラクター選択（クリック）
        item.addEventListener('click', (e) => {
            // レイヤーボタンのクリックは除外
            if (e.target.classList.contains('layer-btn')) return;
            
            if (setActiveCharacter(index)) {
                updateCharacterSelectPanel(); // UI更新
                console.log('👆 キャラクター選択:', characters[index].name);
            }
        });
        
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
        top: 280px;
        right: 10px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        z-index: 10000;
        display: none;
        font-size: 14px;
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

// ========== 編集モード切り替え ========== //
function toggleEditMode() {
    isEditMode = !isEditMode;
    const button = document.getElementById('minimal-edit-button');
    const scalePanel = document.getElementById('scale-adjust-panel');
    const characterPanel = document.getElementById('character-select-panel');
    
    if (isEditMode) {
        console.log('📝 編集モード開始');
        button.textContent = '編集終了';
        button.style.background = '#4CAF50';
        
        // 🚨 修正: アクティブキャラクターのみを編集可能にする
        if (character) {
            character.style.cursor = 'move';
            character.addEventListener('mousedown', startDrag);
            console.log('🎯 編集モード: ドラッグイベント設定完了 -', characters[activeCharacterIndex]?.name || 'unknown');
        }
        
        // 全キャラクターにハイライト適用
        characters.forEach((char, index) => {
            if (index === activeCharacterIndex) {
                addCharacterHighlight(char.element);
            }
        });
        
        // パネル表示
        if (scalePanel) {
            scalePanel.style.display = 'block';
        }
        if (characterPanel) {
            characterPanel.style.display = 'block';
            updateCharacterSelectPanel(); // データ更新
        }
        
        console.log(`🎯 編集対象: ${characters.length}個のキャラクター（アクティブ: ${characters[activeCharacterIndex]?.name || '未選択'}）`);
        
    } else {
        console.log('✅ 編集モード終了');
        button.textContent = '位置編集';
        button.style.background = '#ff6b6b';
        
        // 全キャラクターの編集機能を無効化
        characters.forEach(char => {
            char.element.style.cursor = 'default';
            char.element.removeEventListener('mousedown', startDrag);
            removeCharacterHighlight(char.element);
        });
        
        // 後方互換性：従来のcharacter変数も処理
        if (character) {
            character.style.cursor = 'default';
            character.removeEventListener('mousedown', startDrag);
        }
        
        // パネル非表示
        if (scalePanel) {
            scalePanel.style.display = 'none';
        }
        if (characterPanel) {
            characterPanel.style.display = 'none';
        }
        
        // 現在位置を保存
        savePosition();
    }
}

// ========== ドラッグ処理 ========== //
function startDrag(e) {
    if (!isEditMode) return;
    
    e.preventDefault();
    isDragging = true;
    
    // 開始位置を記録
    startMousePos = { x: e.clientX, y: e.clientY };
    
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
    
    // グローバルイベントを設定
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', endDrag);
    
    console.log('🎯 ドラッグ開始 (親要素基準%):', startElementPos);
}

function handleDrag(e) {
    if (!isDragging) return;
    
    // マウスの移動量を計算
    const deltaX = e.clientX - startMousePos.x;
    const deltaY = e.clientY - startMousePos.y;
    
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
    // スケール値を保持したtransformを適用
    character.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
}

function endDrag() {
    if (!isDragging) return;
    
    isDragging = false;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', endDrag);
    
    console.log('✅ ドラッグ終了');
}

// ========== 位置保存・復元 ========== //
function savePosition() {
    // 現在の位置を取得（単位も含めて保存）
    const currentLeft = character.style.left;
    const currentTop = character.style.top;
    
    // Spineのスケール値を取得
    if (window.getCurrentPosition && typeof window.getCurrentPosition === 'function') {
        const spineSettings = window.getCurrentPosition();
        if (spineSettings && spineSettings.scale !== undefined) {
            currentScale = spineSettings.scale;
        }
    }
    
    // %単位での位置とスケールを保存
    const position = {
        left: currentLeft,
        top: currentTop,
        scale: currentScale,  // Spineスケールを保存
        unit: '%'  // 単位情報を追加
    };
    
    // 既存システムと同じ形式で保存
    const saveData = {
        character: position
    };
    
    localStorage.setItem('spine-positioning-state', JSON.stringify(saveData));
    console.log('💾 位置を保存（既存形式）:', saveData);
    
    // 互換性のため両方のキーで保存
    localStorage.setItem('spine-minimal-position', JSON.stringify(position));
}

function restorePosition() {
    // まず既存システムのデータを確認
    let saved = localStorage.getItem('spine-positioning-state');
    let position = null;
    
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.character) {
                position = data.character;
                console.log('📍 既存形式のデータを検出:', position);
            }
        } catch (e) {
            console.error('❌ 既存形式の解析エラー:', e);
        }
    }
    
    // 既存形式がなければ新形式を確認
    if (!position) {
        saved = localStorage.getItem('spine-minimal-position');
        if (saved) {
            try {
                position = JSON.parse(saved);
                console.log('📍 新形式のデータを検出:', position);
            } catch (e) {
                console.error('❌ 新形式の解析エラー:', e);
            }
        }
    }
    
    // 位置を復元
    if (position && position.left && position.top) {
        character.style.position = 'absolute';
        
        // 単位を確認して適切に復元
        if (position.left && position.top) {
            // 基本的にそのまま適用（%単位を維持）
            character.style.left = position.left;
            character.style.top = position.top;
        }
        
        // Spineスケールを復元
        if (position.scale !== undefined) {
            currentScale = position.scale;
            console.log('🔄 保存されたスケール値を復元:', currentScale);
        }
        
        // スケール値を反映したtransformを適用
        character.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
        
        // スケールパネルのUI要素も同期
        const slider = document.getElementById('scale-slider');
        const numberInput = document.getElementById('scale-input');
        if (slider && numberInput) {
            slider.value = currentScale;
            numberInput.value = currentScale.toFixed(2);
            console.log('🎛️ スケールパネルUIを同期:', currentScale);
        }
        
        // 外部APIとの連携（存在する場合）
        if (position.scale !== undefined && window.adjustCanvasUnified) {
            window.adjustCanvasUnified(undefined, undefined, position.scale);
        }
        
        console.log('✅ 位置とスケールを復元:', position);
    }
}

// ========== 初期化実行 ========== //
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOMContentLoaded: 最速位置復元システム開始');
    
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
});

// デバッグ用グローバル関数
window.clearMinimalPosition = function() {
    localStorage.removeItem('spine-positioning-state');
    localStorage.removeItem('spine-minimal-position');
    console.log('🗑️ 保存データをクリアしました');
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
    
    // レイヤー順序チェック
    console.log('🎭 レイヤー順序 (z-index順):');
    const sortedByZIndex = [...characters].sort((a, b) => a.zIndex - b.zIndex);
    sortedByZIndex.forEach((char, index) => {
        console.log(`  ${index + 1}. ${char.name} (z-index: ${char.zIndex})`);
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

console.log('✅ Spine編集システム v3.0 (最小限実装版) + レイヤー制御機能 読み込み完了');