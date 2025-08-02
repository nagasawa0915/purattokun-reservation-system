// 🎯 Spine Positioning System v2.0 - 軽量・確実・シンプル版
// 作成日: 2025-01-31
// 目標: 1,000行以内・50KB以下・動作確認済み機能のみ

console.log('🚀 Spine Positioning System v2.0 読み込み開始');

// ========== 📦 コア機能モジュール ========== //

// グローバル状態管理（最小限）
const SpinePositioningV2 = {
    // 基本状態
    initialized: false,
    editMode: false,
    characters: [],
    activeIndex: 0,
    
    // 設定
    config: {
        moveStep: 0.1,     // 通常移動量（%）
        moveStepFast: 1.0, // 高速移動量（%）
        scaleMin: 0.1,     // 最小スケール
        scaleMax: 3.0,     // 最大スケール
        storageKey: 'spine-positioning-v2'
    },
    
    // イベントハンドラー参照
    handlers: {
        keyboard: null,
        click: [],
        resize: null,
        drag: []
    },
    
    // ドラッグ状態管理
    dragState: {
        isDragging: false,
        dragTarget: null,
        startX: 0,
        startY: 0,
        elementStartLeft: 0,
        elementStartTop: 0
    }
};

// キャラクター検出セレクター（実証済み）
const CHARACTER_SELECTORS = [
    '#purattokun-canvas',           // メインキャラクター
    '#purattokun-fallback',         // フォールバック要素  
    'canvas[data-spine-character]', // Spineキャラクター全般
    '.spine-character',             // クラス指定キャラクター
    '[data-character-name]'         // data属性キャラクター
];

// ========== 🔍 キャラクター検出システム ========== //
function detectCharacters() {
    console.log('🔍 v2.0: キャラクター検出開始');
    SpinePositioningV2.characters = [];
    
    CHARACTER_SELECTORS.forEach((selector, selectorIndex) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            // 重複チェック
            if (!SpinePositioningV2.characters.some(char => char.element === element)) {
                const characterData = {
                    element: element,
                    id: element.id || `character-${SpinePositioningV2.characters.length}`,
                    name: element.dataset.characterName || 
                          element.id || 
                          `キャラクター${SpinePositioningV2.characters.length + 1}`,
                    selector: selector,
                    scale: 1.0,
                    isActive: false,
                    zIndex: 1000 + SpinePositioningV2.characters.length,
                    originalOrder: SpinePositioningV2.characters.length
                };
                
                SpinePositioningV2.characters.push(characterData);
                console.log(`✅ 検出: ${characterData.name} (${selector})`);
            }
        });
    });
    
    console.log(`🎯 v2.0: ${SpinePositioningV2.characters.length}個のキャラクターを検出`);
    
    // 初期アクティブキャラクター設定
    if (SpinePositioningV2.characters.length > 0) {
        SpinePositioningV2.activeIndex = 0;
        SpinePositioningV2.characters[0].isActive = true;
        return true;
    }
    
    return false;
}

// ========== 💡 視覚的ハイライト機能 ========== //
function addCharacterHighlight(element) {
    if (!element) return;
    
    // 既存ハイライト除去
    removeCharacterHighlight(element);
    
    // 🚨 重要修正: ハイライト適用前にCSS位置を明示的に保存
    // 初回選択時にstyle.leftとstyle.topが未設定の場合、CSS位置を取得して設定
    if (!element.style.left || !element.style.top) {
        const computedStyle = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const parentRect = element.parentElement.getBoundingClientRect();
        
        // 現在の表示位置をパーセンテージで計算
        const leftPercent = ((rect.left + rect.width/2 - parentRect.left) / parentRect.width) * 100;
        const topPercent = ((rect.top + rect.height/2 - parentRect.top) / parentRect.height) * 100;
        
        // 明示的にstyle属性として設定（CSS位置の保護）
        element.style.position = 'absolute';
        element.style.left = leftPercent.toFixed(2) + '%';
        element.style.top = topPercent.toFixed(2) + '%';
        
        console.log(`🔧 v2.0: CSS位置保護 (${element.id}): left=${element.style.left}, top=${element.style.top}`);
    }
    
    // ハイライト境界線スタイル
    const highlightStyle = `
        border: 2px solid #ff6b6b !important;
        box-shadow: 0 0 10px rgba(255, 107, 107, 0.5) !important;
        transition: all 0.3s ease !important;
    `;
    
    // スタイル適用
    element.style.cssText += highlightStyle;
    element.dataset.v2Highlighted = 'true';
    
    console.log('🎨 v2.0: ハイライト追加:', element.id || element.tagName);
}

function removeCharacterHighlight(element) {
    if (!element) return;
    
    // ハイライト境界線とボックスシャドウを除去
    element.style.border = '';
    element.style.boxShadow = '';
    element.style.transition = '';
    
    // ハイライト状態フラグ除去
    delete element.dataset.v2Highlighted;
    
    console.log('🧹 v2.0: ハイライト除去:', element.id || element.tagName);
}

// ========== 🎯 キャラクター選択システム ========== //
function selectCharacter(index) {
    if (index < 0 || index >= SpinePositioningV2.characters.length) {
        console.error('❌ v2.0: 無効なキャラクターインデックス:', index);
        return false;
    }
    
    // 全キャラクターを非アクティブ化
    SpinePositioningV2.characters.forEach(char => {
        char.isActive = false;
        removeCharacterHighlight(char.element);
    });
    
    // 新しいアクティブキャラクターを設定
    SpinePositioningV2.activeIndex = index;
    const activeChar = SpinePositioningV2.characters[index];
    activeChar.isActive = true;
    
    // 視覚的フィードバック
    if (SpinePositioningV2.editMode) {
        addCharacterHighlight(activeChar.element);
        updateUI();
    }
    
    console.log('✅ v2.0: キャラクター選択:', activeChar.name);
    return true;
}

// ========== 🖱️ マウス/タッチドラッグ移動システム ========== //
function initializeMouseDragMovement() {
    console.log('🖱️ v2.0: マウス/タッチドラッグ移動機能を初期化中...');
    
    // 既存ドラッグハンドラークリーンアップ
    SpinePositioningV2.handlers.drag.forEach(handler => {
        if (handler.element && handler.listeners) {
            // マウスイベント除去
            if (handler.listeners.mousedown) {
                handler.element.removeEventListener('mousedown', handler.listeners.mousedown);
            }
            // タッチイベント除去
            if (handler.listeners.touchstart) {
                handler.element.removeEventListener('touchstart', handler.listeners.touchstart);
            }
        }
    });
    SpinePositioningV2.handlers.drag = [];
    
    // 各キャラクターにドラッグイベント設定
    SpinePositioningV2.characters.forEach((char, index) => {
        const element = char.element;
        
        // マウスイベント
        const mousedownHandler = (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            startDragOperation(event, char, index, event.clientX, event.clientY);
        };
        
        // タッチイベント
        const touchstartHandler = (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            if (event.touches.length === 1) {
                const touch = event.touches[0];
                startDragOperation(event, char, index, touch.clientX, touch.clientY);
            }
        };
        
        // イベントリスナー設定
        element.addEventListener('mousedown', mousedownHandler);
        element.addEventListener('touchstart', touchstartHandler, { passive: false });
        
        // ドラッグ可能であることを示すカーソル
        element.style.cursor = 'move';
        
        // ハンドラー参照保存
        SpinePositioningV2.handlers.drag.push({
            element: element,
            listeners: {
                mousedown: mousedownHandler,
                touchstart: touchstartHandler
            }
        });
    });
    
    // グローバルドラッグ終了イベント
    const mousemoveHandler = (event) => {
        if (SpinePositioningV2.dragState.isDragging) {
            event.preventDefault();
            updateDragPosition(event.clientX, event.clientY);
        }
    };
    
    const mouseupHandler = (event) => {
        if (SpinePositioningV2.dragState.isDragging) {
            event.preventDefault();
            endDragOperation();
        }
    };
    
    const touchmoveHandler = (event) => {
        if (SpinePositioningV2.dragState.isDragging && event.touches.length === 1) {
            event.preventDefault();
            const touch = event.touches[0];
            updateDragPosition(touch.clientX, touch.clientY);
        }
    };
    
    const touchendHandler = (event) => {
        if (SpinePositioningV2.dragState.isDragging) {
            event.preventDefault();
            endDragOperation();
        }
    };
    
    // グローバルイベントリスナー設定
    document.addEventListener('mousemove', mousemoveHandler);
    document.addEventListener('mouseup', mouseupHandler);
    document.addEventListener('touchmove', touchmoveHandler, { passive: false });
    document.addEventListener('touchend', touchendHandler);
    
    // グローバルハンドラー参照保存（クリーンアップ用）
    SpinePositioningV2.handlers.drag.push({
        element: document,
        listeners: {
            mousemove: mousemoveHandler,
            mouseup: mouseupHandler,
            touchmove: touchmoveHandler,
            touchend: touchendHandler
        }
    });
    
    console.log(`✅ v2.0: ${SpinePositioningV2.characters.length}個のキャラクターにドラッグ移動を設定`);
}

function startDragOperation(event, char, index, clientX, clientY) {
    console.log(`🖱️ v2.0: ドラッグ開始: ${char.name}`);
    
    // キャラクター選択
    selectCharacter(index);
    
    // ドラッグ状態設定
    SpinePositioningV2.dragState.isDragging = true;
    SpinePositioningV2.dragState.dragTarget = char;
    SpinePositioningV2.dragState.startX = clientX;
    SpinePositioningV2.dragState.startY = clientY;
    
    // 現在の要素位置を取得
    const element = char.element;
    SpinePositioningV2.dragState.elementStartLeft = parseFloat(element.style.left) || 0;
    SpinePositioningV2.dragState.elementStartTop = parseFloat(element.style.top) || 0;
    
    // 視覚的フィードバック
    element.style.opacity = '0.8';
    element.style.filter = 'brightness(1.1)';
    document.body.style.cursor = 'grabbing';
    
    // 選択不可にしてドラッグ体験向上
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
}

function updateDragPosition(clientX, clientY) {
    if (!SpinePositioningV2.dragState.isDragging || !SpinePositioningV2.dragState.dragTarget) {
        return;
    }
    
    const dragState = SpinePositioningV2.dragState;
    const element = dragState.dragTarget.element;
    
    // マウス移動量を計算
    const deltaX = clientX - dragState.startX;
    const deltaY = clientY - dragState.startY;
    
    // 画面サイズに対する移動量の%を計算
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const deltaXPercent = (deltaX / screenWidth) * 100;
    const deltaYPercent = (deltaY / screenHeight) * 100;
    
    // 新しい位置を計算
    let newLeft = dragState.elementStartLeft + deltaXPercent;
    let newTop = dragState.elementStartTop + deltaYPercent;
    
    // 境界制限（0-100%の範囲内）
    newLeft = Math.max(0, Math.min(100, newLeft));
    newTop = Math.max(0, Math.min(100, newTop));
    
    // 位置を適用
    element.style.left = newLeft + '%';
    element.style.top = newTop + '%';
    
    // UI更新（シンプル化版）
}

function endDragOperation() {
    if (!SpinePositioningV2.dragState.isDragging) {
        return;
    }
    
    console.log('🖱️ v2.0: ドラッグ終了');
    
    const element = SpinePositioningV2.dragState.dragTarget.element;
    
    // 視覚的フィードバック復元
    element.style.opacity = '';
    element.style.filter = '';
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    
    // ドラッグ状態リセット
    SpinePositioningV2.dragState.isDragging = false;
    SpinePositioningV2.dragState.dragTarget = null;
    SpinePositioningV2.dragState.startX = 0;
    SpinePositioningV2.dragState.startY = 0;
    SpinePositioningV2.dragState.elementStartLeft = 0;
    SpinePositioningV2.dragState.elementStartTop = 0;
    
    // 位置保存
    saveToStorage();
}

function disableMouseDragMovement() {
    console.log('🖱️ v2.0: マウス/タッチドラッグ移動機能を無効化');
    
    // すべてのドラッグハンドラー除去
    SpinePositioningV2.handlers.drag.forEach(handler => {
        if (handler.element && handler.listeners) {
            Object.values(handler.listeners).forEach(listener => {
                if (typeof listener === 'function') {
                    handler.element.removeEventListener('mousedown', listener);
                    handler.element.removeEventListener('mouseup', listener);
                    handler.element.removeEventListener('mousemove', listener);
                    handler.element.removeEventListener('touchstart', listener);
                    handler.element.removeEventListener('touchend', listener);
                    handler.element.removeEventListener('touchmove', listener);
                }
            });
        }
        
        // キャラクター要素のカーソルスタイルリセット
        if (handler.element && handler.element !== document) {
            handler.element.style.cursor = '';
        }
    });
    
    SpinePositioningV2.handlers.drag = [];
    
    // ドラッグ状態強制リセット
    SpinePositioningV2.dragState.isDragging = false;
    SpinePositioningV2.dragState.dragTarget = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
}

// ========== ⌨️ キーボード移動システム ========== //
function initializeKeyboardMovement() {
    // 既存ハンドラー除去
    if (SpinePositioningV2.handlers.keyboard) {
        document.removeEventListener('keydown', SpinePositioningV2.handlers.keyboard);
    }
    
    // 新しいハンドラー作成
    SpinePositioningV2.handlers.keyboard = function(e) {
        // 編集モード中のみ有効
        if (!SpinePositioningV2.editMode) return;
        
        // アクティブキャラクター確認
        const activeChar = SpinePositioningV2.characters[SpinePositioningV2.activeIndex];
        if (!activeChar) return;
        
        // 入力フィールドでの操作時は無効化
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        // 矢印キーのみ処理
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
        
        e.preventDefault(); // デフォルトのスクロール動作を防止
        
        // 移動量決定（Shiftキーで高速移動）
        const moveStep = e.shiftKey ? 
            SpinePositioningV2.config.moveStepFast : 
            SpinePositioningV2.config.moveStep;
        
        // 現在位置取得
        const element = activeChar.element;
        const currentLeft = parseFloat(element.style.left) || 0;
        const currentTop = parseFloat(element.style.top) || 0;
        
        let newLeft = currentLeft;
        let newTop = currentTop;
        
        // キー応じて位置更新
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
        
        // 位置適用
        element.style.left = newLeft + '%';
        element.style.top = newTop + '%';
        
        // UI更新
        updateRealtimeDisplay();
        
        // ログ出力
        const keyName = e.key.replace('Arrow', '');
        const speedText = e.shiftKey ? '（高速）' : '';
        console.log(`⌨️ v2.0: ${keyName}${speedText} → (${newLeft.toFixed(1)}%, ${newTop.toFixed(1)}%)`);
    };
    
    // イベントリスナー追加
    document.addEventListener('keydown', SpinePositioningV2.handlers.keyboard);
    console.log('⌨️ v2.0: キーボード移動機能を初期化');
}

function disableKeyboardMovement() {
    if (SpinePositioningV2.handlers.keyboard) {
        document.removeEventListener('keydown', SpinePositioningV2.handlers.keyboard);
        SpinePositioningV2.handlers.keyboard = null;
        console.log('⌨️ v2.0: キーボード移動機能を無効化');
    }
}

// ========== 📏 スケール調整システム ========== //
function updateScale(newScale) {
    // 範囲チェック
    if (newScale < SpinePositioningV2.config.scaleMin || 
        newScale > SpinePositioningV2.config.scaleMax) {
        console.warn('⚠️ v2.0: スケール範囲外:', newScale);
        return false;
    }
    
    // アクティブキャラクター取得
    const activeChar = SpinePositioningV2.characters[SpinePositioningV2.activeIndex];
    if (!activeChar) {
        console.error('❌ v2.0: アクティブキャラクターなし');
        return false;
    }
    
    // スケール適用
    activeChar.scale = newScale;
    const element = activeChar.element;
    const baseTransform = 'translate(-50%, -50%)';
    element.style.transform = `${baseTransform} scale(${newScale})`;
    
    // UI更新
    updateScaleUI(newScale);
    
    console.log(`📏 v2.0: スケール更新: ${activeChar.name} → ${newScale.toFixed(2)}`);
    return true;
}

function resetScale() {
    return updateScale(1.0);
}

// ========== 🔄 z-index レイヤー管理システム ========== //
function moveLayer(index, direction) {
    if (index < 0 || index >= SpinePositioningV2.characters.length) {
        console.error('❌ v2.0: 無効なレイヤー移動:', index);
        return false;
    }
    
    const characters = SpinePositioningV2.characters;
    const targetChar = characters[index];
    
    if (direction === 'up') {
        // 前面に移動（z-index増加）
        const maxZIndex = Math.max(...characters.map(char => char.zIndex));
        targetChar.zIndex = maxZIndex + 1;
    } else if (direction === 'down') {
        // 背面に移動（z-index減少）
        const minZIndex = Math.min(...characters.map(char => char.zIndex));
        targetChar.zIndex = minZIndex - 1;
    } else {
        console.error('❌ v2.0: 無効な移動方向:', direction);
        return false;
    }
    
    // DOM適用
    targetChar.element.style.zIndex = targetChar.zIndex;
    
    // UI更新
    updateCharacterSelectUI();
    
    console.log(`🔄 v2.0: レイヤー移動: ${targetChar.name} → ${direction} (z-index: ${targetChar.zIndex})`);
    return true;
}

// ========== 🎯 ドラッグ&ドロップ レイヤー管理システム ========== //
// 🚨 2キャラクター限定対応 - HTML5 Drag and Drop API使用

let dragDropState = {
    isDragging: false,
    draggedIndex: -1,
    targetIndex: -1,
    dragOverElement: null
};

function initializeDragDropLayerSystem() {
    console.log('🎯 v2.0: ドラッグ&ドロップレイヤー機能を初期化中...');
    
    // 2キャラクター限定チェック
    if (SpinePositioningV2.characters.length !== 2) {
        console.warn('⚠️ v2.0: ドラッグ&ドロップレイヤー機能は2キャラクター限定です');
        console.log(`   現在のキャラクター数: ${SpinePositioningV2.characters.length}`);
        return false;
    }
    
    // キャラクター選択パネル内のアイテムを取得
    const characterList = document.getElementById('v2-character-list');
    if (!characterList) {
        console.error('❌ v2.0: キャラクター選択パネルが見つかりません');
        return false;
    }
    
    // ドラッグイベントを設定
    setupDragDropEvents(characterList);
    
    console.log('✅ v2.0: ドラッグ&ドロップレイヤー機能を初期化完了');
    return true;
}

function setupDragDropEvents(characterList) {
    // 全ての子要素にドラッグイベントを設定
    const items = characterList.querySelectorAll('[data-character-index]');
    
    items.forEach((item, index) => {
        const characterIndex = parseInt(item.dataset.characterIndex);
        
        // ドラッグ開始
        item.addEventListener('dragstart', (e) => {
            console.log(`🎯 v2.0: ドラッグ開始: ${SpinePositioningV2.characters[characterIndex].name}`);
            
            dragDropState.isDragging = true;
            dragDropState.draggedIndex = characterIndex;
            
            // ドラッグ中の視覚効果
            item.style.opacity = '0.5';
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', characterIndex.toString());
        });
        
        // ドラッグ終了
        item.addEventListener('dragend', (e) => {
            console.log('🎯 v2.0: ドラッグ終了');
            
            // 視覚効果リセット
            item.style.opacity = '1';
            if (dragDropState.dragOverElement) {
                dragDropState.dragOverElement.style.backgroundColor = '';
                dragDropState.dragOverElement.style.borderColor = '';
            }
            
            // 状態リセット
            dragDropState.isDragging = false;
            dragDropState.draggedIndex = -1;
            dragDropState.targetIndex = -1;
            dragDropState.dragOverElement = null;
        });
        
        // ドラッグオーバー（ドロップ可能領域）
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const targetIndex = parseInt(item.dataset.characterIndex);
            
            // 自分自身への無効ドロップを防止
            if (targetIndex !== dragDropState.draggedIndex) {
                // 視覚フィードバック
                item.style.backgroundColor = '#fff3cd';
                item.style.borderColor = '#ffc107';
                
                dragDropState.targetIndex = targetIndex;
                dragDropState.dragOverElement = item;
            }
        });
        
        // ドラッグリーブ（ドロップ領域から離れる）
        item.addEventListener('dragleave', (e) => {
            // 視覚フィードバック除去
            item.style.backgroundColor = '';
            item.style.borderColor = '';
        });
        
        // ドロップ（実際の並び替え処理）
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            
            const draggedIndex = dragDropState.draggedIndex;
            const targetIndex = parseInt(item.dataset.characterIndex);
            
            console.log(`🎯 v2.0: ドロップ実行: ${draggedIndex} → ${targetIndex}`);
            
            // 自分自身へのドロップは無効
            if (draggedIndex === targetIndex) {
                console.log('ℹ️ v2.0: 同じ位置へのドロップ - 無効');
                return;
            }
            
            // 2キャラクター限定の並び替え実行
            swapCharacterLayers(draggedIndex, targetIndex);
            
            // UI更新
            updateCharacterSelectUI();
            
            // 視覚フィードバック除去
            item.style.backgroundColor = '';
            item.style.borderColor = '';
        });
    });
}

function swapCharacterLayers(index1, index2) {
    if (index1 < 0 || index1 >= SpinePositioningV2.characters.length ||
        index2 < 0 || index2 >= SpinePositioningV2.characters.length) {
        console.error('❌ v2.0: 無効なキャラクターインデックス:', index1, index2);
        return false;
    }
    
    const char1 = SpinePositioningV2.characters[index1];
    const char2 = SpinePositioningV2.characters[index2];
    
    console.log(`🔄 v2.0: レイヤー交換: ${char1.name} ↔ ${char2.name}`);
    
    // z-indexを交換
    const temp = char1.zIndex;
    char1.zIndex = char2.zIndex;
    char2.zIndex = temp;
    
    // DOM要素に適用
    char1.element.style.zIndex = char1.zIndex;
    char2.element.style.zIndex = char2.zIndex;
    
    // 内部配列も並び替え（アクティブインデックスの調整が必要）
    const activeChar = SpinePositioningV2.characters[SpinePositioningV2.activeIndex];
    
    // 配列要素を交換
    [SpinePositioningV2.characters[index1], SpinePositioningV2.characters[index2]] = 
    [SpinePositioningV2.characters[index2], SpinePositioningV2.characters[index1]];
    
    // アクティブインデックスを再計算
    SpinePositioningV2.activeIndex = SpinePositioningV2.characters.findIndex(char => char === activeChar);
    
    // 設定保存
    saveToStorage();
    
    console.log(`✅ v2.0: レイヤー交換完了 (${char1.name}: z-index ${char1.zIndex}, ${char2.name}: z-index ${char2.zIndex})`);
    return true;
}

function disableDragDropLayerSystem() {
    console.log('🎯 v2.0: ドラッグ&ドロップレイヤー機能を無効化');
    
    // 状態リセット
    dragDropState.isDragging = false;
    dragDropState.draggedIndex = -1;
    dragDropState.targetIndex = -1;
    dragDropState.dragOverElement = null;
    
    // ドラッグ可能属性を無効化
    const characterList = document.getElementById('v2-character-list');
    if (characterList) {
        const items = characterList.querySelectorAll('[data-character-index]');
        items.forEach(item => {
            item.draggable = false;
            item.style.opacity = '1';
            item.style.backgroundColor = '';
            item.style.borderColor = '';
        });
    }
    
    console.log('✅ v2.0: ドラッグ&ドロップレイヤー機能を無効化完了');
}

// ========== 💾 localStorage 永続化システム ========== //
function saveToStorage() {
    try {
        const saveData = {
            version: '2.0',
            timestamp: new Date().toISOString(),
            activeIndex: SpinePositioningV2.activeIndex,
            characters: SpinePositioningV2.characters.map(char => ({
                id: char.id,
                name: char.name,
                selector: char.selector,
                position: {
                    left: char.element.style.left || '0%',
                    top: char.element.style.top || '0%',
                    scale: char.scale
                },
                layer: {
                    zIndex: char.zIndex
                },
                isActive: char.isActive
            }))
        };
        
        localStorage.setItem(SpinePositioningV2.config.storageKey, JSON.stringify(saveData));
        console.log('💾 v2.0: 保存完了:', Object.keys(saveData.characters).length + '個のキャラクター');
        return true;
        
    } catch (error) {
        console.error('❌ v2.0: 保存エラー:', error);
        return false;
    }
}

function restoreFromStorage() {
    try {
        const savedData = localStorage.getItem(SpinePositioningV2.config.storageKey);
        if (!savedData) {
            console.log('ℹ️ v2.0: 保存データなし');
            return false;
        }
        
        const data = JSON.parse(savedData);
        if (data.version !== '2.0') {
            console.warn('⚠️ v2.0: バージョン不一致:', data.version);
            return false;
        }
        
        // キャラクターデータ復元
        let restoredCount = 0;
        data.characters.forEach(savedChar => {
            const char = SpinePositioningV2.characters.find(c => c.id === savedChar.id);
            if (char && savedChar.position) {
                // 位置復元
                char.element.style.position = 'absolute';
                char.element.style.left = savedChar.position.left;
                char.element.style.top = savedChar.position.top;
                
                // スケール復元
                char.scale = savedChar.position.scale || 1.0;
                const baseTransform = 'translate(-50%, -50%)';
                char.element.style.transform = `${baseTransform} scale(${char.scale})`;
                
                // z-index復元
                if (savedChar.layer) {
                    char.zIndex = savedChar.layer.zIndex;
                    char.element.style.zIndex = char.zIndex;
                }
                
                restoredCount++;
            }
        });
        
        // アクティブキャラクター復元
        if (data.activeIndex >= 0 && data.activeIndex < SpinePositioningV2.characters.length) {
            selectCharacter(data.activeIndex);
        }
        
        console.log(`📍 v2.0: 復元完了: ${restoredCount}個のキャラクター`);
        return true;
        
    } catch (error) {
        console.error('❌ v2.0: 復元エラー:', error);
        return false;
    }
}

// ========== 🎨 UI管理モジュール ========== //

let v2UI = {
    panels: {},
    created: false
};

// シンプルパネル生成
function createPanels() {
    if (v2UI.created) {
        console.log('ℹ️ v2.0: UI既に作成済み');
        return true;
    }
    
    // キャラクター選択パネル
    createCharacterSelectPanel();
    
    // 操作パネル
    createControlPanel();
    
    
    // モバイル対応
    applyResponsiveStyles();
    
    v2UI.created = true;
    console.log('🎨 v2.0: UI作成完了');
    return true;
}

function createCharacterSelectPanel() {
    const panel = document.createElement('div');
    panel.id = 'v2-character-select-panel';
    panel.innerHTML = `
        <div id="v2-character-select-container" style="background: white; border: 1px solid #ddd; border-radius: 8px; 
                    padding: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #333;">
                🎭 キャラクター選択
            </div>
            <div id="v2-character-list">
                <!-- 動的生成 -->
            </div>
        </div>
    `;
    
    // 配置
    panel.style.cssText = `
        position: fixed;
        top: 60px;
        right: 10px;
        z-index: 10000;
        min-width: 200px;
    `;
    
    document.body.appendChild(panel);
    v2UI.panels.characterSelect = panel;
    
    // 🚨 重要追加: 初期状態では無効表示
    setCharacterSelectPanelState(false);
    
    updateCharacterSelectUI();
}

// ========== 🎭 キャラクター選択パネル状態制御 ========== //
function setCharacterSelectPanelState(enabled) {
    const panel = v2UI.panels.characterSelect;
    const container = document.getElementById('v2-character-select-container');
    const characterList = document.getElementById('v2-character-list');
    
    if (!panel || !container) {
        console.warn('⚠️ v2.0: キャラクター選択パネルが見つかりません');
        return;
    }
    
    if (enabled) {
        // 有効状態: 通常表示・クリック有効
        container.style.opacity = '1';
        container.style.filter = 'none';
        container.style.pointerEvents = 'auto';
        container.style.background = 'white';
        container.style.borderColor = '#ddd';
        
        console.log('✅ v2.0: キャラクター選択パネルを有効化');
    } else {
        // 無効状態: 灰色・半透明・クリック無効
        container.style.opacity = '0.6';
        container.style.filter = 'grayscale(50%)';
        container.style.pointerEvents = 'none';
        container.style.background = '#f5f5f5';
        container.style.borderColor = '#ccc';
        
        console.log('🔒 v2.0: キャラクター選択パネルを無効化');
    }
    
    // キャラクター項目にも状態を適用
    if (characterList) {
        const items = characterList.querySelectorAll('[data-character-index]');
        items.forEach(item => {
            if (enabled) {
                item.style.cursor = 'pointer';
                item.style.opacity = '1';
            } else {
                item.style.cursor = 'not-allowed';
                item.style.opacity = '0.7';
            }
        });
    }
}

function createControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'v2-control-panel';
    panel.innerHTML = `
        <div style="background: white; border: 1px solid #ddd; border-radius: 8px; 
                    padding: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); min-width: 250px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #333;">
                ⚡ 操作パネル
            </div>
            
            <!-- 編集制御ボタン -->
            <div style="margin-bottom: 10px;">
                <div style="display: flex; gap: 3px; margin-bottom: 5px;">
                    <button id="v2-start-edit" style="flex: 1; padding: 4px; font-size: 11px; 
                                                     background: #2196F3; color: white; border: none; border-radius: 3px; cursor: pointer;">
                        🎨 編集開始
                    </button>
                    <button id="v2-end-edit" style="flex: 1; padding: 4px; font-size: 11px; 
                                                   background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer;">
                        🔚 編集終了
                    </button>
                    <button id="v2-save" style="flex: 1; padding: 4px; font-size: 11px; 
                                               background: #ff9800; color: white; border: none; border-radius: 3px; cursor: pointer;">
                        💾 保存
                    </button>
                </div>
            </div>
            
            <!-- 移動操作案内 -->
            <div style="margin-bottom: 10px; font-size: 12px; color: #666;">
                🖱️ ドラッグ: キャラクター移動<br>
                ⌨️ 矢印キー: 微調整 (🚀Shiftで高速)
            </div>
            
            <!-- スケール調整 -->
            <div style="margin-bottom: 10px;">
                <label style="font-size: 12px; color: #666;">📏 スケール:</label>
                <div style="display: flex; align-items: center; gap: 5px; margin-top: 3px;">
                    <input type="range" id="v2-scale-slider" 
                           min="0.1" max="3.0" step="0.01" value="1.0"
                           style="flex: 1;">
                    <input type="number" id="v2-scale-input" 
                           min="0.1" max="3.0" step="0.01" value="1.0"
                           style="width: 60px; font-size: 12px;">
                    <button id="v2-scale-reset" style="padding: 2px 6px; font-size: 11px;">⟲</button>
                </div>
            </div>
            
            <!-- レイヤー移動（ドラッグ&ドロップ） -->
            <div style="margin-bottom: 10px;">
                <label style="font-size: 12px; color: #666;">📚 レイヤー:</label>
                <div style="font-size: 11px; color: #888; margin-top: 2px;">
                    キャラクター行の「≡」をドラッグ&ドロップで並び替え
                </div>
            </div>
            
            <!-- 🎬 アニメーション制御セクション -->
            <div id="v2-animation-section" style="margin-bottom: 10px; border-top: 1px solid #eee; padding-top: 8px;">
                <label style="font-size: 12px; color: #666; font-weight: bold;">🎬 アニメーション:</label>
                <div id="v2-animation-controls" style="margin-top: 5px;">
                    <!-- アニメーション制御UI（動的生成） -->
                </div>
            </div>
            
            <!-- 🔄 複製機能セクション -->
            <div id="v2-clone-section" style="margin-bottom: 10px; border-top: 1px solid #eee; padding-top: 8px;">
                <label style="font-size: 12px; color: #666; font-weight: bold;">🔄 複製:</label>
                <div style="display: flex; gap: 5px; margin-top: 3px;">
                    <button id="v2-clone-character" style="flex: 1; padding: 4px; font-size: 11px; background: #17a2b8; color: white; border: none; border-radius: 3px; cursor: pointer;">🔄 複製</button>
                    <button id="v2-delete-clones" style="flex: 1; padding: 4px; font-size: 11px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer;">🗑️ 削除</button>
                </div>
                <div id="v2-clone-info" style="font-size: 10px; color: #666; margin-top: 3px; text-align: center;">
                    複製: 0個
                </div>
            </div>
            
            <!-- 💾 保存機能セクション -->
            <div id="v2-save-section" style="margin-bottom: 10px; border-top: 1px solid #eee; padding-top: 8px;">
                <label style="font-size: 12px; color: #666; font-weight: bold;">💾 保存:</label>
                <div style="display: flex; gap: 3px; margin-top: 3px;">
                    <button id="v2-manual-save" style="flex: 1; padding: 4px; font-size: 11px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer;">💾 保存</button>
                    <button id="v2-auto-save-toggle" style="padding: 4px 6px; font-size: 11px; background: #ffc107; color: #333; border: none; border-radius: 3px; cursor: pointer;">⚡</button>
                    <button id="v2-backup" style="padding: 4px 6px; font-size: 11px; background: #6c757d; color: white; border: none; border-radius: 3px; cursor: pointer;">📦</button>
                </div>
                <div id="v2-save-status" style="font-size: 10px; color: #666; margin-top: 3px; text-align: center;">
                    <!-- 保存状態表示 -->
                </div>
            </div>
            
            <!-- CSS出力 -->
            <div style="margin-bottom: 8px;">
                <button id="v2-css-export" style="width: 100%; padding: 6px; font-size: 12px; 
                                                   background: #4CAF50; color: white; border: none; border-radius: 4px;
                                                   cursor: pointer; transition: background-color 0.2s;">
                    📋 CSS出力
                </button>
            </div>
            
            <!-- 完全パッケージ出力 -->
            <div>
                <button id="v2-package-export" style="width: 100%; padding: 8px; font-size: 12px; 
                                                       background: #ff6b6b; color: white; border: none; border-radius: 4px;
                                                       cursor: pointer; transition: background-color 0.2s; font-weight: bold;">
                    📦 完全パッケージ出力
                </button>
            </div>
        </div>
    `;
    
    // 配置（拡張UI対応でサイズ調整）
    panel.style.cssText = `
        position: fixed;
        top: 280px;
        right: 10px;
        z-index: 10000;
        min-width: 250px;
        max-height: 80vh;
        overflow-y: auto;
    `;
    
    document.body.appendChild(panel);
    v2UI.panels.control = panel;
    
    // 🚨 重要追加: 初期状態では編集モード外なので、編集開始ボタンのみ有効化
    setTimeout(() => {
        const startEditBtn = document.getElementById('v2-start-edit');
        const endEditBtn = document.getElementById('v2-end-edit');
        const saveBtn = document.getElementById('v2-save');
        const scaleSlider = document.getElementById('v2-scale-slider');
        const scaleInput = document.getElementById('v2-scale-input');
        const scaleReset = document.getElementById('v2-scale-reset');
        // 🚨 削除: レイヤー移動ボタンはドラッグ&ドロップに変更
        // const layerUpBtn = document.getElementById('v2-layer-up');
        // const layerDownBtn = document.getElementById('v2-layer-down');
        
        // 初期状態: 編集開始ボタンのみ有効
        if (startEditBtn) {
            startEditBtn.disabled = false;
            startEditBtn.style.opacity = '1';
            startEditBtn.style.cursor = 'pointer';
        }
        
        // その他のボタンは無効状態
        [endEditBtn, saveBtn, scaleReset].forEach(btn => {
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            }
        });
        
        // スライダー・入力欄も無効状態
        [scaleSlider, scaleInput].forEach(element => {
            if (element) {
                element.disabled = true;
                element.style.opacity = '0.5';
            }
        });
        
        console.log('🎨 v2.0: 初期UI状態設定完了（編集開始ボタンのみ有効）');
    }, 100);
    
    // イベントハンドラー設定
    setupControlPanelEvents();
}

function createStatusPanel() {
    const panel = document.createElement('div');
    panel.id = 'v2-status-panel';
    panel.innerHTML = `
        <div style="background: white; border: 1px solid #ddd; border-radius: 8px; 
                    padding: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-weight: bold; font-size: 14px; color: #333;">📊 状況</span>
                <button id="v2-status-toggle" style="padding: 2px 6px; font-size: 11px; border: none; background: #f0f0f0;">_</button>
            </div>
            <div id="v2-status-content" style="font-size: 12px; color: #666;">
                <!-- 動的更新 -->
            </div>
        </div>
    `;
    
    // 配置
    panel.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        z-index: 10000;
        min-width: 180px;
    `;
    
    document.body.appendChild(panel);
    v2UI.panels.status = panel;
    
    // 最小化ボタンイベント
    const toggleBtn = panel.querySelector('#v2-status-toggle');
    const content = panel.querySelector('#v2-status-content');
    let minimized = false;
    
    toggleBtn.addEventListener('click', () => {
        minimized = !minimized;
        content.style.display = minimized ? 'none' : 'block';
        toggleBtn.textContent = minimized ? '+' : '_';
    });
    
    updateRealtimeDisplay();
}

// ========== 🎮 イベントハンドリング統合 ========== //
function setupControlPanelEvents() {
    // 編集制御ボタン
    const startEditBtn = document.getElementById('v2-start-edit');
    const endEditBtn = document.getElementById('v2-end-edit');
    const saveBtn = document.getElementById('v2-save');
    
    if (startEditBtn) {
        startEditBtn.addEventListener('click', () => {
            console.log('🎨 v2.0: 編集開始ボタンクリック');
            SpinePositioningV2.startEditMode();
        });
    }
    
    if (endEditBtn) {
        endEditBtn.addEventListener('click', () => {
            console.log('🔚 v2.0: 編集終了ボタンクリック');
            SpinePositioningV2.endEditMode();
        });
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            console.log('💾 v2.0: 保存ボタンクリック');
            if (saveToStorage()) {
                // 成功時の視覚的フィードバック
                const originalText = saveBtn.textContent;
                const originalBg = saveBtn.style.backgroundColor;
                saveBtn.textContent = '✅ 保存完了!';
                saveBtn.style.backgroundColor = '#4CAF50';
                setTimeout(() => {
                    saveBtn.textContent = originalText;
                    saveBtn.style.backgroundColor = originalBg;
                }, 1500);
            }
        });
    }
    
    // スケールスライダー
    const slider = document.getElementById('v2-scale-slider');
    const input = document.getElementById('v2-scale-input');
    const resetBtn = document.getElementById('v2-scale-reset');
    
    if (slider && input) {
        slider.addEventListener('input', (e) => {
            const newScale = parseFloat(e.target.value);
            input.value = newScale.toFixed(2);
            updateScale(newScale);
        });
        
        input.addEventListener('input', (e) => {
            const newScale = parseFloat(e.target.value);
            if (newScale >= SpinePositioningV2.config.scaleMin && 
                newScale <= SpinePositioningV2.config.scaleMax) {
                slider.value = newScale;
                updateScale(newScale);
            }
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetScale();
        });
    }
    
    // 🚨 削除: レイヤー移動ボタンはドラッグ&ドロップに変更
    // レイヤー移動はキャラクター選択パネル内のドラッグ&ドロップで実装
    
    // CSS出力ボタン
    const cssExportBtn = document.getElementById('v2-css-export');
    if (cssExportBtn) {
        cssExportBtn.addEventListener('click', () => {
            exportCSS();
        });
        
        // ホバー効果
        cssExportBtn.addEventListener('mouseenter', () => {
            cssExportBtn.style.backgroundColor = '#45a049';
        });
        cssExportBtn.addEventListener('mouseleave', () => {
            cssExportBtn.style.backgroundColor = '#4CAF50';
        });
    }
    
    // 完全パッケージ出力ボタン
    const packageExportBtn = document.getElementById('v2-package-export');
    if (packageExportBtn) {
        packageExportBtn.addEventListener('click', async () => {
            console.log('📦 v2.0: 完全パッケージ出力開始');
            
            // パッケージ出力システムの存在確認
            if (typeof window.PackageExportPhase1 === 'undefined') {
                // パッケージ出力システムを動的読み込み
                await loadPackageExportSystem();
            }
            
            if (window.PackageExportPhase1) {
                try {
                    await PackageExportPhase1.init();
                    await PackageExportPhase1.generatePackage();
                } catch (error) {
                    console.error('❌ v2.0: パッケージ出力エラー:', error);
                    alert('パッケージ出力中にエラーが発生しました。コンソールを確認してください。');
                }
            } else {
                alert('パッケージ出力システムの読み込みに失敗しました。ページを再読み込みしてお試しください。');
            }
        });
        
        // ホバー効果
        packageExportBtn.addEventListener('mouseenter', () => {
            packageExportBtn.style.backgroundColor = '#e55555';
        });
        packageExportBtn.addEventListener('mouseleave', () => {
            packageExportBtn.style.backgroundColor = '#ff6b6b';
        });
    }
    
    // 🔄 複製機能ボタン
    const cloneBtn = document.getElementById('v2-clone-character');
    const deleteClonesBtn = document.getElementById('v2-delete-clones');
    
    if (cloneBtn) {
        cloneBtn.addEventListener('click', () => {
            if (integratedModules.cloneManager) {
                const result = integratedModules.cloneManager.cloneActiveCharacter(50, 50);
                if (result) {
                    updateCloneUI();
                    updateCharacterSelectUI(); // キャラクター選択UIも更新
                    console.log('✅ v2.0: キャラクター複製完了');
                } else {
                    console.error('❌ v2.0: キャラクター複製失敗');
                }
            }
        });
    }
    
    if (deleteClonesBtn) {
        deleteClonesBtn.addEventListener('click', () => {
            if (integratedModules.cloneManager) {
                const count = integratedModules.cloneManager.deleteAllClones();
                updateCloneUI();
                updateCharacterSelectUI(); // キャラクター選択UIも更新
                console.log(`✅ v2.0: ${count}個の複製を削除`);
            }
        });
    }
    
    // 💾 保存機能ボタン
    const manualSaveBtn = document.getElementById('v2-manual-save');
    const autoSaveToggleBtn = document.getElementById('v2-auto-save-toggle');
    const backupBtn = document.getElementById('v2-backup');
    
    if (manualSaveBtn) {
        manualSaveBtn.addEventListener('click', async () => {
            if (integratedModules.enhancedSaveSystem) {
                const result = await integratedModules.enhancedSaveSystem.manualSave(false); // 確認なしで即座保存
                updateSaveUI();
                console.log('💾 v2.0: 手動保存完了:', result);
            }
        });
    }
    
    if (autoSaveToggleBtn) {
        autoSaveToggleBtn.addEventListener('click', () => {
            if (integratedModules.enhancedSaveSystem) {
                const currentState = integratedModules.enhancedSaveSystem.autoSaveEnabled;
                integratedModules.enhancedSaveSystem.setAutoSaveEnabled(!currentState);
                updateSaveUI();
                console.log('⚡ v2.0: 自動保存切り替え:', !currentState);
            }
        });
    }
    
    if (backupBtn) {
        backupBtn.addEventListener('click', async () => {
            if (integratedModules.enhancedSaveSystem) {
                await integratedModules.enhancedSaveSystem.createBackup();
                console.log('📦 v2.0: バックアップ作成完了');
            }
        });
    }
}

function setupCharacterClickSelection() {
    console.log('🎯 v2.0: キャラクター直接クリック選択を設定中...');
    
    // 既存イベントリスナークリーンアップ
    SpinePositioningV2.handlers.click.forEach(handler => {
        if (handler.element && handler.listener) {
            handler.element.removeEventListener('click', handler.listener);
        }
    });
    SpinePositioningV2.handlers.click = [];
    
    // 各キャラクターにクリックイベント設定
    SpinePositioningV2.characters.forEach((char, index) => {
        const clickHandler = (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            console.log(`🎯 v2.0: キャラクタークリック: ${char.name}`);
            selectCharacter(index);
        };
        
        char.element.addEventListener('click', clickHandler);
        
        // ハンドラー参照保存（クリーンアップ用）
        SpinePositioningV2.handlers.click.push({
            element: char.element,
            listener: clickHandler
        });
        
        // モバイル対応
        char.element.addEventListener('touchend', (event) => {
            if (event.touches.length === 0) {
                clickHandler(event);
            }
        });
    });
    
    console.log(`✅ v2.0: ${SpinePositioningV2.characters.length}個のキャラクターにクリック選択を設定`);
}

// ========== 📱 レスポンシブ対応 ========== //
function applyResponsiveStyles() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        console.log('📱 v2.0: モバイルスタイル適用');
        
        // パネルを縦積み配置
        if (v2UI.panels.characterSelect) {
            Object.assign(v2UI.panels.characterSelect.style, {
                top: 'auto',
                right: 'auto',
                bottom: '150px',
                left: '50%',
                transform: 'translateX(-50%)',
                minWidth: '280px',
                maxWidth: 'calc(100vw - 20px)'
            });
        }
        
        if (v2UI.panels.control) {
            Object.assign(v2UI.panels.control.style, {
                top: 'auto',
                right: 'auto',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                minWidth: '280px',
                maxWidth: 'calc(100vw - 20px)'
            });
        }
        
        
    } else {
        console.log('🖥️ v2.0: デスクトップスタイル適用');
        
        // デスクトップ配置復元
        if (v2UI.panels.characterSelect) {
            Object.assign(v2UI.panels.characterSelect.style, {
                top: '60px',
                right: '10px',
                bottom: 'auto',
                left: 'auto',
                transform: 'none',
                minWidth: '200px',
                maxWidth: 'none'
            });
        }
        
        if (v2UI.panels.control) {
            Object.assign(v2UI.panels.control.style, {
                top: '280px',
                right: '10px',
                bottom: 'auto',
                left: 'auto',
                transform: 'none',
                minWidth: '200px',
                maxWidth: 'none'
            });
        }
        
    }
}

// リサイズイベント処理
function initializeResponsiveHandler() {
    if (SpinePositioningV2.handlers.resize) {
        window.removeEventListener('resize', SpinePositioningV2.handlers.resize);
    }
    
    SpinePositioningV2.handlers.resize = () => {
        console.log('📐 v2.0: ウィンドウリサイズ検出');
        applyResponsiveStyles();
    };
    
    window.addEventListener('resize', SpinePositioningV2.handlers.resize);
}

// ========== 🔄 UI更新システム ========== //
function updateUI() {
    updateCharacterSelectUI();
    updateScaleUI();
}

function updateCharacterSelectUI() {
    const characterList = document.getElementById('v2-character-list');
    if (!characterList) return;
    
    characterList.innerHTML = '';
    
    SpinePositioningV2.characters.forEach((char, index) => {
        const isActive = index === SpinePositioningV2.activeIndex;
        const item = document.createElement('div');
        
        item.innerHTML = `
            <div style="padding: 6px 8px; margin: 2px 0; border-radius: 4px; cursor: pointer;
                        background: ${isActive ? '#e3f2fd' : 'transparent'};
                        border: ${isActive ? '2px solid #ff6b6b' : '1px solid #ddd'};
                        display: flex; align-items: center; gap: 8px;
                        transition: all 0.2s ease;"
                 data-character-index="${index}" draggable="true">
                <span class="drag-handle" style="font-size: 14px; color: #888; cursor: move; user-select: none;" 
                      title="ドラッグしてレイヤー順序を変更">≡</span>
                <span style="font-size: 16px;">${isActive ? '🎯' : '⚪'}</span>
                <div style="flex: 1;">
                    <div style="font-weight: ${isActive ? 'bold' : 'normal'}; 
                                color: ${isActive ? '#1976D2' : '#333'}; font-size: 13px;">
                        ${char.name}
                    </div>
                    <div style="font-size: 11px; color: #666;">
                        z-index: ${char.zIndex} • Scale: ${char.scale.toFixed(2)}
                    </div>
                </div>
            </div>
        `;
        
        item.addEventListener('click', (e) => {
            // ドラッグハンドルクリック時はキャラクター選択を無効化
            if (e.target.classList.contains('drag-handle')) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            selectCharacter(index);
        });
        
        characterList.appendChild(item);
    });
    
    // 🎯 編集モード中はドラッグ&ドロップイベントを再設定
    if (SpinePositioningV2.editMode && SpinePositioningV2.characters.length === 2) {
        setTimeout(() => {
            setupDragDropEvents(characterList);
        }, 100); // DOM更新後に実行
    }
    
    // 🚨 重要追加: UI更新時に現在の編集状態に応じてパネル状態を同期
    setTimeout(() => {
        setCharacterSelectPanelState(SpinePositioningV2.editMode);
    }, 150); // DOM更新完了後に実行
}

function updateScaleUI(scale) {
    const slider = document.getElementById('v2-scale-slider');
    const input = document.getElementById('v2-scale-input');
    
    if (scale !== undefined) {
        if (slider) slider.value = scale;
        if (input) input.value = scale.toFixed(2);
    } else {
        // アクティブキャラクターのスケールで更新
        const activeChar = SpinePositioningV2.characters[SpinePositioningV2.activeIndex];
        if (activeChar) {
            if (slider) slider.value = activeChar.scale;
            if (input) input.value = activeChar.scale.toFixed(2);
        }
    }
}

function updateRealtimeDisplay() {
    // リアルタイム表示はシンプル化のため削除
    // 必要に応じて他のUI更新処理を追加
    console.log('🔄 v2.0: UI更新スキップ（シンプル化済み）');
}

// ========== 🔗 新機能モジュール統合システム ========== //

// 統合されたモジュール参照
let integratedModules = {
    cloneManager: null,
    animationSelector: null,
    enhancedSaveSystem: null
};

// モジュール動的読み込み・統合システム
async function loadAndIntegrateModules() {
    console.log('🔗 v2.0: 新機能モジュール統合開始...');
    
    const moduleList = [
        { name: 'cloneManager', path: 'assets/spine/modules/character-clone-manager.js' },
        { name: 'animationSelector', path: 'assets/spine/modules/animation-selector.js' },
        { name: 'enhancedSaveSystem', path: 'assets/spine/modules/enhanced-save-system.js' }
    ];
    
    let loadedCount = 0;
    const totalModules = moduleList.length;
    
    for (const module of moduleList) {
        try {
            await loadSingleModule(module.path);
            loadedCount++;
            console.log(`✅ v2.0: ${module.name} 読み込み完了 (${loadedCount}/${totalModules})`);
        } catch (error) {
            console.error(`❌ v2.0: ${module.name} 読み込み失敗:`, error);
        }
    }
    
    // モジュール統合初期化
    if (loadedCount > 0) {
        await initializeIntegratedModules();
        updateIntegratedUI();
        console.log(`✅ v2.0: ${loadedCount}/${totalModules}個のモジュール統合完了`);
    }
    
    return loadedCount;
}

// 単一モジュール読み込み
function loadSingleModule(path) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = path;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 統合モジュール初期化
async function initializeIntegratedModules() {
    console.log('🔧 v2.0: 統合モジュール初期化中...');
    
    // キャラクター複製マネージャー初期化
    if (typeof window.CharacterCloneManager !== 'undefined') {
        integratedModules.cloneManager = new window.CharacterCloneManager(SpinePositioningV2);
        integratedModules.cloneManager.init(SpinePositioningV2);
        console.log('✅ v2.0: CloneManager 統合完了');
    }
    
    // アニメーション選択システム初期化
    if (typeof window.createAnimationSelector !== 'undefined') {
        integratedModules.animationSelector = window.createAnimationSelector({
            debugMode: true,
            autoIntegrate: false // 手動統合
        });
        
        // v2.0システムとの統合
        if (window.spineManager?.animationController) {
            integratedModules.animationSelector.integrateWithExistingSystems(
                window.spineManager.animationController,
                window.spineManager.characterManager,
                SpinePositioningV2
            );
        }
        console.log('✅ v2.0: AnimationSelector 統合完了');
    }
    
    // 拡張保存システム初期化
    if (typeof window.initializeEnhancedSaveSystem !== 'undefined') {
        integratedModules.enhancedSaveSystem = window.initializeEnhancedSaveSystem(SpinePositioningV2);
        console.log('✅ v2.0: EnhancedSaveSystem 統合完了');
    }
}

// 統合UI更新
function updateIntegratedUI() {
    console.log('🎨 v2.0: 統合UI更新中...');
    
    // アニメーション制御UI更新
    updateAnimationUI();
    
    // 複製機能UI更新
    updateCloneUI();
    
    // 保存機能UI更新
    updateSaveUI();
}

// アニメーション制御UI更新
function updateAnimationUI() {
    const container = document.getElementById('v2-animation-controls');
    if (!container || !integratedModules.animationSelector) return;
    
    // シンプルなアニメーション制御UI
    container.innerHTML = `
        <div style="display: flex; gap: 3px; margin-bottom: 3px;">
            <select id="v2-animation-select" style="flex: 1; font-size: 10px; padding: 2px;">
                <option value="taiki">待機</option>
                <option value="syutugen">出現</option>
                <option value="yarare">やられ</option>
                <option value="click">クリック</option>
            </select>
            <button id="v2-animation-play" style="padding: 2px 6px; font-size: 10px; background: #007bff; color: white; border: none; border-radius: 2px; cursor: pointer;">▶</button>
        </div>
        <div style="font-size: 10px;">
            <label style="display: flex; align-items: center; gap: 3px;">
                <input type="checkbox" id="v2-animation-loop" style="margin: 0;"> ループ
            </label>
        </div>
    `;
    
    // イベントリスナー設定
    setupAnimationEvents();
}

// 複製機能UI更新
function updateCloneUI() {
    const infoElement = document.getElementById('v2-clone-info');
    if (!infoElement || !integratedModules.cloneManager) return;
    
    const cloneCount = integratedModules.cloneManager.getCloneCount();
    infoElement.textContent = `複製: ${cloneCount}個`;
}

// 保存機能UI更新
function updateSaveUI() {
    const statusElement = document.getElementById('v2-save-status');
    if (!statusElement || !integratedModules.enhancedSaveSystem) return;
    
    const status = integratedModules.enhancedSaveSystem.getStatus();
    const statusText = status.hasUnsavedChanges ? '未保存の変更あり' : '保存済み';
    const autoSaveText = status.autoSaveEnabled ? '自動保存: ON' : '自動保存: OFF';
    
    statusElement.innerHTML = `
        <div style="color: ${status.hasUnsavedChanges ? '#ffc107' : '#28a745'};">${statusText}</div>
        <div>${autoSaveText}</div>
    `;
}

// アニメーションイベント設定
function setupAnimationEvents() {
    const selectElement = document.getElementById('v2-animation-select');
    const playButton = document.getElementById('v2-animation-play');
    const loopCheckbox = document.getElementById('v2-animation-loop');
    
    if (playButton && integratedModules.animationSelector) {
        playButton.addEventListener('click', () => {
            const animation = selectElement.value;
            const loop = loopCheckbox.checked;
            
            // アクティブキャラクターのアニメーション再生
            const activeChar = SpinePositioningV2.characters[SpinePositioningV2.activeIndex];
            if (activeChar) {
                integratedModules.animationSelector.playPreview(activeChar.id, animation, loop);
            }
        });
    }
}

// ========== 📦 パッケージ出力システム動的読み込み ========== //
async function loadPackageExportSystem() {
    console.log('📦 v2.0: パッケージ出力システム読み込み開始...');
    
    try {
        const script = document.createElement('script');
        script.src = './package-export-phase1.js';
        
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
        
        console.log('✅ v2.0: パッケージ出力システム読み込み完了');
        return true;
        
    } catch (error) {
        console.error('❌ v2.0: パッケージ出力システム読み込みエラー:', error);
        return false;
    }
}

// ========== 📋 CSS出力システム ========== //
function exportCSS() {
    console.log('📋 v2.0: CSS出力開始');
    
    try {
        const cssRules = [];
        let exportedCount = 0;
        
        // 各キャラクターのCSS生成
        SpinePositioningV2.characters.forEach((char, index) => {
            const element = char.element;
            const id = char.id;
            const name = char.name;
            
            // 現在の配置データ取得
            const left = element.style.left || '0%';
            const top = element.style.top || '0%';
            const scale = char.scale || 1.0;
            const zIndex = char.zIndex || 1000;
            const isActive = char.isActive;
            
            // CSS規則生成
            const cssRule = `
/* ${name} ${isActive ? '(アクティブ)' : ''} */
#${id} {
    position: absolute;
    left: ${left};
    top: ${top};
    transform: translate(-50%, -50%) scale(${scale.toFixed(3)});
    z-index: ${zIndex};
}`;
            
            cssRules.push(cssRule);
            exportedCount++;
        });
        
        // CSS出力内容作成
        const timestamp = new Date().toLocaleString('ja-JP');
        const cssContent = `/* Spine Positioning System v2.0 - CSS出力 */
/* 出力日時: ${timestamp} */
/* キャラクター数: ${exportedCount}個 */

${cssRules.join('\n')}

/* 使用方法:
   1. 上記CSSをスタイルシートに追加
   2. 編集モードを無効化
   3. 位置が固定されて表示されます
*/`;
        
        // ダイアログで表示
        showCSSExportDialog(cssContent, exportedCount);
        
        console.log(`✅ v2.0: CSS出力完了 (${exportedCount}個のキャラクター)`);
        
    } catch (error) {
        console.error('❌ v2.0: CSS出力エラー:', error);
        alert('CSS出力中にエラーが発生しました。コンソールを確認してください。');
    }
}

function showCSSExportDialog(cssContent, count) {
    // モーダルダイアログ作成
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 20000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    `;
    
    dialog.innerHTML = `
        <div style="background: white; border-radius: 8px; padding: 20px; 
                    max-width: 800px; max-height: 80vh; overflow: hidden;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #333;">📋 CSS出力結果 (${count}個)</h3>
                <button id="css-dialog-close" style="padding: 5px 10px; border: none; 
                                                     background: #f44336; color: white; border-radius: 4px; cursor: pointer;">
                    ✕ 閉じる
                </button>
            </div>
            
            <textarea id="css-output-content" readonly 
                      style="width: 100%; height: 400px; font-family: monospace; font-size: 12px;
                             border: 1px solid #ddd; border-radius: 4px; padding: 10px;
                             resize: vertical; box-sizing: border-box;">${cssContent}</textarea>
            
            <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                <button id="css-copy-btn" style="padding: 8px 16px; background: #4CAF50; color: white; 
                                                 border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                    📋 クリップボードにコピー
                </button>
                <button id="css-select-all" style="padding: 8px 16px; background: #2196F3; color: white; 
                                                   border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                    🔍 全選択
                </button>
                <div style="flex: 1; text-align: right; color: #666; font-size: 12px; line-height: 2.5;">
                    Spine Positioning System v2.0
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // イベントハンドラー設定
    const closeBtn = dialog.querySelector('#css-dialog-close');
    const copyBtn = dialog.querySelector('#css-copy-btn');
    const selectAllBtn = dialog.querySelector('#css-select-all');
    const textarea = dialog.querySelector('#css-output-content');
    
    // 閉じる
    const closeDialog = () => {
        document.body.removeChild(dialog);
    };
    
    closeBtn.addEventListener('click', closeDialog);
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) closeDialog(); // 背景クリックで閉じる
    });
    
    // 全選択
    selectAllBtn.addEventListener('click', () => {
        textarea.select();
        textarea.setSelectionRange(0, 99999); // モバイル対応
        console.log('🔍 v2.0: CSS内容を全選択');
    });
    
    // クリップボードコピー
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(cssContent);
            copyBtn.textContent = '✅ コピー完了!';
            copyBtn.style.backgroundColor = '#45a049';
            
            setTimeout(() => {
                copyBtn.textContent = '📋 クリップボードにコピー';
                copyBtn.style.backgroundColor = '#4CAF50';
            }, 2000);
            
            console.log('📋 v2.0: CSS内容をクリップボードにコピー完了');
            
        } catch (error) {
            console.warn('⚠️ v2.0: クリップボードコピー失敗（手動選択してください）:', error);
            
            // フォールバック: 全選択
            textarea.select();
            textarea.setSelectionRange(0, 99999);
            
            copyBtn.textContent = '⚠️ 手動でコピーしてください';
            copyBtn.style.backgroundColor = '#ff9800';
            
            setTimeout(() => {
                copyBtn.textContent = '📋 クリップボードにコピー';
                copyBtn.style.backgroundColor = '#4CAF50';
            }, 3000);
        }
    });
    
    // ESCキーで閉じる
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeDialog();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    console.log('📋 v2.0: CSS出力ダイアログを表示');
}

// ========== 🎯 初期化・メイン API ========== //
SpinePositioningV2.init = function() {
    if (SpinePositioningV2.initialized) {
        console.log('ℹ️ v2.0: 既に初期化済み');
        return true;
    }
    
    console.log('🚀 v2.0: システム初期化開始');
    
    // 1. キャラクター検出
    if (!detectCharacters()) {
        console.error('❌ v2.0: キャラクター検出失敗');
        return false;
    }
    
    // 2. 保存データ復元試行
    restoreFromStorage();
    
    // 3. UI作成
    createPanels();
    
    // 4. レスポンシブ対応
    initializeResponsiveHandler();
    
    SpinePositioningV2.initialized = true;
    console.log('✅ v2.0: システム初期化完了');
    return true;
};

SpinePositioningV2.startEditMode = function() {
    console.log('🎨 v2.0: 編集モード開始処理を実行中...');
    console.log('  - 現在の editMode:', SpinePositioningV2.editMode);
    console.log('  - 初期化状態:', SpinePositioningV2.initialized);
    console.log('  - キャラクター数:', SpinePositioningV2.characters.length);
    
    if (SpinePositioningV2.editMode) {
        console.log('ℹ️ v2.0: 既に編集モード中');
        return true;
    }
    
    if (!SpinePositioningV2.initialized) {
        console.error('❌ v2.0: 初期化されていません。先に init() を実行してください');
        return false;
    }
    
    console.log('🎨 v2.0: 編集モード開始');
    
    SpinePositioningV2.editMode = true;
    
    // キーボード移動機能有効化
    console.log('⌨️ v2.0: キーボード機能初期化中...');
    initializeKeyboardMovement();
    
    // マウス/タッチドラッグ移動機能有効化
    console.log('🖱️ v2.0: ドラッグ機能初期化中...');
    initializeMouseDragMovement();
    
    // キャラクタークリック選択有効化
    console.log('🎯 v2.0: クリック選択機能初期化中...');
    setupCharacterClickSelection();
    
    // 初期アクティブキャラクターハイライト
    if (SpinePositioningV2.characters[SpinePositioningV2.activeIndex]) {
        const activeChar = SpinePositioningV2.characters[SpinePositioningV2.activeIndex];
        console.log('🎨 v2.0: アクティブキャラクターハイライト追加:', activeChar.name);
        addCharacterHighlight(activeChar.element);
    } else {
        console.warn('⚠️ v2.0: アクティブキャラクターが見つかりません');
    }
    
    // UI表示
    console.log('🎨 v2.0: UI表示設定中...');
    if (v2UI.panels.characterSelect) {
        v2UI.panels.characterSelect.style.display = 'block';
        // 🚨 重要追加: 編集開始時にキャラクター選択パネルを有効化
        setCharacterSelectPanelState(true);
        console.log('  ✓ キャラクター選択パネル表示・有効化');
    } else {
        console.warn('  ⚠️ キャラクター選択パネルが見つかりません');
    }
    
    if (v2UI.panels.control) {
        v2UI.panels.control.style.display = 'block';
        console.log('  ✓ 操作パネル表示');
        
        // 🚨 重要追加: 編集開始時に全ボタンを有効化
        const startEditBtn = document.getElementById('v2-start-edit');
        const endEditBtn = document.getElementById('v2-end-edit');
        const saveBtn = document.getElementById('v2-save');
        const scaleSlider = document.getElementById('v2-scale-slider');
        const scaleInput = document.getElementById('v2-scale-input');
        const scaleReset = document.getElementById('v2-scale-reset');
        // 🚨 削除: レイヤー移動ボタンはドラッグ&ドロップに変更
        // const layerUpBtn = document.getElementById('v2-layer-up');
        // const layerDownBtn = document.getElementById('v2-layer-down');
        
        // 編集開始ボタンは無効化
        if (startEditBtn) {
            startEditBtn.disabled = true;
            startEditBtn.style.opacity = '0.5';
            startEditBtn.style.cursor = 'not-allowed';
        }
        
        // 編集終了・保存ボタンは有効化
        if (endEditBtn) {
            endEditBtn.disabled = false;
            endEditBtn.style.opacity = '1';
            endEditBtn.style.cursor = 'pointer';
        }
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
        }
        
        // スケール調整機能は有効化
        if (scaleSlider) {
            scaleSlider.disabled = false;
            scaleSlider.style.opacity = '1';
        }
        if (scaleInput) {
            scaleInput.disabled = false;
            scaleInput.style.opacity = '1';
        }
        if (scaleReset) {
            scaleReset.disabled = false;
            scaleReset.style.opacity = '1';
            scaleReset.style.cursor = 'pointer';
        }
        
        // 🎯 ドラッグ&ドロップレイヤー機能を初期化
        initializeDragDropLayerSystem();
        
        console.log('  ✓ 編集モード用UIボタンを有効化');
    } else {
        console.warn('  ⚠️ 操作パネルが見つかりません');
    }
    
    console.log('🔄 v2.0: UI更新中...');
    updateUI();
    
    // 🔗 新機能モジュール統合の遅延実行
    setTimeout(async () => {
        try {
            await loadAndIntegrateModules();
            console.log('🔗 v2.0: 新機能モジュール統合完了');
        } catch (error) {
            console.warn('⚠️ v2.0: 新機能モジュール統合で一部失敗:', error);
        }
    }, 500); // UI作成後に実行
    
    console.log('✅ v2.0: 編集モード開始完了');
    console.log('  - editMode:', SpinePositioningV2.editMode);
    console.log('  - アクティブキャラクター:', SpinePositioningV2.characters[SpinePositioningV2.activeIndex]?.name || 'なし');
    return true;
};

SpinePositioningV2.endEditMode = function() {
    if (!SpinePositioningV2.editMode) {
        console.log('ℹ️ v2.0: 既に編集モード終了済み');
        return true;
    }
    
    console.log('🎨 v2.0: 編集モード終了');
    
    SpinePositioningV2.editMode = false;
    
    // キーボード移動機能無効化
    disableKeyboardMovement();
    
    // マウス/タッチドラッグ移動機能無効化
    disableMouseDragMovement();
    
    // ハイライト除去
    SpinePositioningV2.characters.forEach(char => {
        removeCharacterHighlight(char.element);
    });
    
    // 🚨 重要修正: 編集終了時はキャラクター選択パネルを無効表示に変更
    // キャラクター選択パネルは表示維持し、無効状態にする
    if (v2UI.panels.characterSelect) {
        v2UI.panels.characterSelect.style.display = 'block';
        // 🚨 重要追加: 編集終了時にキャラクター選択パネルを無効化
        setCharacterSelectPanelState(false);
        console.log('  ✓ キャラクター選択パネルを無効表示に変更');
    }
    
    // 操作パネルは表示維持し、編集開始ボタンを有効化
    if (v2UI.panels.control) {
        // パネル自体は表示を維持
        v2UI.panels.control.style.display = 'block';
        
        // 編集開始ボタンのみ有効化、他は無効化
        const startEditBtn = document.getElementById('v2-start-edit');
        const endEditBtn = document.getElementById('v2-end-edit');
        const saveBtn = document.getElementById('v2-save');
        const scaleSlider = document.getElementById('v2-scale-slider');
        const scaleInput = document.getElementById('v2-scale-input');
        const scaleReset = document.getElementById('v2-scale-reset');
        // 🚨 削除: レイヤー移動ボタンはドラッグ&ドロップに変更
        // const layerUpBtn = document.getElementById('v2-layer-up');
        // const layerDownBtn = document.getElementById('v2-layer-down');
        
        // 編集開始ボタンは有効化
        if (startEditBtn) {
            startEditBtn.disabled = false;
            startEditBtn.style.opacity = '1';
            startEditBtn.style.cursor = 'pointer';
        }
        
        // 編集終了・保存ボタンは無効化
        if (endEditBtn) {
            endEditBtn.disabled = true;
            endEditBtn.style.opacity = '0.5';
            endEditBtn.style.cursor = 'not-allowed';
        }
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.5';
            saveBtn.style.cursor = 'not-allowed';
        }
        
        // スケール調整機能は無効化
        if (scaleSlider) {
            scaleSlider.disabled = true;
            scaleSlider.style.opacity = '0.5';
        }
        if (scaleInput) {
            scaleInput.disabled = true;
            scaleInput.style.opacity = '0.5';
        }
        if (scaleReset) {
            scaleReset.disabled = true;
            scaleReset.style.opacity = '0.5';
            scaleReset.style.cursor = 'not-allowed';
        }
        
        // 🎯 ドラッグ&ドロップレイヤー機能を無効化
        disableDragDropLayerSystem();
    }
    
    // 最終保存
    saveToStorage();
    
    console.log('✅ v2.0: 編集モード終了完了 - メニューパネルは表示維持');
    return true;
};

// 外部API
SpinePositioningV2.selectCharacter = selectCharacter;
SpinePositioningV2.moveCharacter = function(deltaX, deltaY) {
    const activeChar = SpinePositioningV2.characters[SpinePositioningV2.activeIndex];
    if (!activeChar) return false;
    
    const element = activeChar.element;
    const currentLeft = parseFloat(element.style.left) || 0;
    const currentTop = parseFloat(element.style.top) || 0;
    
    const newLeft = Math.max(0, Math.min(100, currentLeft + deltaX));
    const newTop = Math.max(0, Math.min(100, currentTop + deltaY));
    
    element.style.left = newLeft + '%';
    element.style.top = newTop + '%';
    
    return true;
};

SpinePositioningV2.scaleCharacter = updateScale;
SpinePositioningV2.moveLayer = moveLayer;
SpinePositioningV2.save = saveToStorage;
SpinePositioningV2.restore = restoreFromStorage;
SpinePositioningV2.exportCSS = exportCSS;
SpinePositioningV2.getStatus = function() {
    return {
        initialized: SpinePositioningV2.initialized,
        editMode: SpinePositioningV2.editMode,
        charactersCount: SpinePositioningV2.characters.length,
        activeIndex: SpinePositioningV2.activeIndex,
        activeCharacter: SpinePositioningV2.characters[SpinePositioningV2.activeIndex]?.name || null
    };
};

// 📦 完全パッケージ出力用の位置データ取得機能
SpinePositioningV2.getCurrentPositions = function() {
    console.log('📦 v2.0: 現在の位置データを取得中...');
    
    const positionData = {
        version: '2.0',
        timestamp: new Date().toISOString(),
        characters: {}
    };
    
    SpinePositioningV2.characters.forEach(char => {
        const element = char.element;
        const id = char.id;
        
        positionData.characters[id] = {
            name: char.name,
            selector: char.selector,
            position: {
                left: element.style.left || '0%',
                top: element.style.top || '0%',
                transform: element.style.transform || 'translate(-50%, -50%)',
                scale: char.scale || 1.0
            },
            layer: {
                zIndex: char.zIndex || 1000
            },
            isActive: char.isActive,
            // 🚨 重要修正: data-*属性は無効化し、編集システム座標系を直接使用
            // HTML設定システム（data-*属性）は位置不整合の原因となるため削除
            coordinateSystem: {
                type: 'percentage-with-center-transform',
                left: element.style.left || '0%',
                top: element.style.top || '0%', 
                transform: element.style.transform || 'translate(-50%, -50%)',
                note: 'HTML設定システム無効化により100%の位置一致を保証'
            }
        };
    });
    
    console.log(`📦 v2.0: ${Object.keys(positionData.characters).length}個のキャラクター位置データを取得`);
    return positionData;
};

// ========== 🔗 既存システムとの統合 ========== //

// URLパラメータ解析
function checkURLParams() {
    const url = window.location.href;
    const search = window.location.search;
    const urlParams = new URLSearchParams(search);
    const editParam = urlParams.get('edit');
    const versionParam = urlParams.get('version');
    
    console.log('🔍 v2.0: URL詳細確認:');
    console.log('  - 完全URL:', url);
    console.log('  - search部分:', search);
    console.log('  - editParam:', editParam);
    console.log('  - versionParam:', versionParam);
    
    // ?edit=true&version=v2 の場合のみv2.0を使用
    if (editParam === 'true' && versionParam === 'v2') {
        console.log('🎯 v2.0: v2.0システム起動が指定されました');
        return 'v2';
    }
    
    // ?edit=true&version=test の場合はテストモード
    if (editParam === 'true' && versionParam === 'test') {
        console.log('🧪 v2.0: テストモード（両システム読み込み）');
        return 'test';
    }
    
    // デフォルトは既存システム
    console.log('ℹ️ v2.0: 既存システムまたはv2.0対象外');
    return 'legacy';
}

// DOMContentLoaded時の自動初期化
document.addEventListener('DOMContentLoaded', () => {
    const mode = checkURLParams();
    
    console.log('🔍 v2.0: 検出モード:', mode);
    
    if (mode === 'v2' || mode === 'test') {
        console.log('🚀 v2.0: 自動初期化開始');
        
        // 短い遅延後に初期化（Spine読み込み待ち）
        setTimeout(() => {
            console.log('🚀 v2.0: 初期化実行中...');
            if (SpinePositioningV2.init()) {
                console.log('✅ v2.0: 初期化成功');
                if (mode === 'v2') {
                    console.log('🎯 v2.0: 編集モード自動開始');
                    // v2.0単独モード - 自動的に編集モード開始
                    setTimeout(() => {
                        SpinePositioningV2.startEditMode();
                        console.log('✅ v2.0: 編集モード開始完了');
                    }, 500); // 追加の遅延で確実に開始
                } else {
                    // テストモード - 手動開始待ち
                    console.log('🧪 v2.0: テストモード準備完了。SpinePositioningV2.startEditMode() で開始してください');
                }
            } else {
                console.error('❌ v2.0: 初期化失敗');
            }
        }, 1000);
    } else {
        console.log('ℹ️ v2.0: v2.0システムは起動しません（モード: ' + mode + '）');
    }
});

// デバッグ用グローバル関数
window.SpinePositioningV2 = SpinePositioningV2;
window.v2Debug = function() {
    console.log('=== 🔍 v2.0: 詳細デバッグ情報 ===');
    console.log('📊 システム状態:', SpinePositioningV2.getStatus());
    console.log('🎭 キャラクター一覧:', SpinePositioningV2.characters.map(char => ({
        name: char.name,
        id: char.id,
        scale: char.scale,
        zIndex: char.zIndex,
        isActive: char.isActive,
        elementExists: !!char.element,
        position: {
            left: char.element?.style.left || 'unset',
            top: char.element?.style.top || 'unset'
        }
    })));
    console.log('🎨 UI状態:', {
        created: v2UI.created,
        panels: Object.keys(v2UI.panels).map(key => ({
            name: key,
            exists: !!v2UI.panels[key],
            visible: v2UI.panels[key]?.style.display !== 'none'
        }))
    });
    console.log('🌐 URL状態:', {
        url: window.location.href,
        search: window.location.search,
        mode: checkURLParams()
    });
    console.log('===============================');
};

console.log('✅ Spine Positioning System v2.0 読み込み完了');
console.log('💡 使用方法:');
console.log('  URL: ?edit=true&version=v2 (v2.0使用)');
console.log('  URL: ?edit=true&version=test (テストモード)');
console.log('  URL: ?edit=true (既存システム使用)');
console.log('  コンソール: SpinePositioningV2.* または v2Debug()');