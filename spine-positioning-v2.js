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

// ========== 💡 視覚的ハイライト機能 ========== //
function addCharacterHighlight(element) {
    if (!element) return;
    
    // 既存ハイライト除去
    removeCharacterHighlight(element);
    
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
    if (!element || !element.dataset.v2Highlighted) return;
    
    // ハイライト関連スタイルを除去
    element.style.border = '';
    element.style.boxShadow = '';
    element.style.transition = '';
    delete element.dataset.v2Highlighted;
    
    console.log('🎨 v2.0: ハイライト除去:', element.id || element.tagName);
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
        <div style="background: white; border: 1px solid #ddd; border-radius: 8px; 
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
    
    updateCharacterSelectUI();
}

function createControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'v2-control-panel';
    panel.innerHTML = `
        <div style="background: white; border: 1px solid #ddd; border-radius: 8px; 
                    padding: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #333;">
                ⚡ 操作パネル
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
            
            <!-- レイヤー移動 -->
            <div style="margin-bottom: 10px;">
                <label style="font-size: 12px; color: #666;">📚 レイヤー:</label>
                <div style="display: flex; gap: 5px; margin-top: 3px;">
                    <button id="v2-layer-up" style="flex: 1; padding: 4px; font-size: 12px;">↑ 前面</button>
                    <button id="v2-layer-down" style="flex: 1; padding: 4px; font-size: 12px;">↓ 背面</button>
                </div>
            </div>
            
            <!-- CSS出力機能 -->
            <div>
                <button id="v2-css-export" 
                        style="width: 100%; padding: 8px; font-size: 12px; 
                               background: #4CAF50; color: white; border: none; border-radius: 4px;
                               cursor: pointer; font-weight: bold;">
                    📋 CSS出力
                </button>
            </div>
        </div>
    `;
    
    // 配置
    panel.style.cssText = `
        position: fixed;
        top: 280px;
        right: 10px;
        z-index: 10000;
        min-width: 200px;
    `;
    
    document.body.appendChild(panel);
    v2UI.panels.control = panel;
    
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
    
    // レイヤー移動ボタン
    const layerUpBtn = document.getElementById('v2-layer-up');
    const layerDownBtn = document.getElementById('v2-layer-down');
    
    if (layerUpBtn) {
        layerUpBtn.addEventListener('click', () => {
            moveLayer(SpinePositioningV2.activeIndex, 'up');
        });
    }
    
    if (layerDownBtn) {
        layerDownBtn.addEventListener('click', () => {
            moveLayer(SpinePositioningV2.activeIndex, 'down');
        });
    }
    
    // CSS出力ボタン
    const cssExportBtn = document.getElementById('v2-css-export');
    if (cssExportBtn) {
        cssExportBtn.addEventListener('click', () => {
            exportCSS();
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
                        transition: all 0.2s ease;">
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
        
        item.addEventListener('click', () => {
            selectCharacter(index);
        });
        
        characterList.appendChild(item);
    });
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
    if (SpinePositioningV2.editMode) {
        console.log('ℹ️ v2.0: 既に編集モード中');
        return true;
    }
    
    console.log('🎨 v2.0: 編集モード開始');
    
    SpinePositioningV2.editMode = true;
    
    // キーボード移動機能有効化
    initializeKeyboardMovement();
    
    // マウス/タッチドラッグ移動機能有効化
    initializeMouseDragMovement();
    
    // キャラクタークリック選択有効化
    setupCharacterClickSelection();
    
    // 初期アクティブキャラクターハイライト
    if (SpinePositioningV2.characters[SpinePositioningV2.activeIndex]) {
        addCharacterHighlight(SpinePositioningV2.characters[SpinePositioningV2.activeIndex].element);
    }
    
    // UI表示
    if (v2UI.panels.characterSelect) v2UI.panels.characterSelect.style.display = 'block';
    if (v2UI.panels.control) v2UI.panels.control.style.display = 'block';
    
    updateUI();
    
    console.log('✅ v2.0: 編集モード開始完了');
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
    
    // UI非表示
    if (v2UI.panels.characterSelect) v2UI.panels.characterSelect.style.display = 'none';
    if (v2UI.panels.control) v2UI.panels.control.style.display = 'none';
    
    // 最終保存
    saveToStorage();
    
    console.log('✅ v2.0: 編集モード終了完了');
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
SpinePositioningV2.getStatus = function() {
    return {
        initialized: SpinePositioningV2.initialized,
        editMode: SpinePositioningV2.editMode,
        charactersCount: SpinePositioningV2.characters.length,
        activeIndex: SpinePositioningV2.activeIndex,
        activeCharacter: SpinePositioningV2.characters[SpinePositioningV2.activeIndex]?.name || null
    };
};

// ========== 🔗 既存システムとの統合 ========== //

// URLパラメータ解析
function checkURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const editParam = urlParams.get('edit');
    const versionParam = urlParams.get('version');
    
    console.log('🔍 v2.0: URLパラメータ確認:', { edit: editParam, version: versionParam });
    
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
    return 'legacy';
}

// DOMContentLoaded時の自動初期化
document.addEventListener('DOMContentLoaded', () => {
    const mode = checkURLParams();
    
    if (mode === 'v2' || mode === 'test') {
        console.log('🚀 v2.0: 自動初期化開始');
        
        // 短い遅延後に初期化（Spine読み込み待ち）
        setTimeout(() => {
            if (SpinePositioningV2.init()) {
                if (mode === 'v2') {
                    // v2.0単独モード - 自動的に編集モード開始
                    SpinePositioningV2.startEditMode();
                } else {
                    // テストモード - 手動開始待ち
                    console.log('🧪 v2.0: テストモード準備完了。SpinePositioningV2.startEditMode() で開始してください');
                }
            }
        }, 1000);
    }
});

// デバッグ用グローバル関数
window.SpinePositioningV2 = SpinePositioningV2;
window.v2Debug = function() {
    console.log('🔍 v2.0: デバッグ情報:', SpinePositioningV2.getStatus());
    console.log('🎭 キャラクター一覧:', SpinePositioningV2.characters.map(char => ({
        name: char.name,
        id: char.id,
        scale: char.scale,
        zIndex: char.zIndex,
        isActive: char.isActive
    })));
};

// ========== 📋 CSS出力機能モジュール（独立実装） ========== //

/**
 * 現在の配置データからCSS形式の文字列を生成
 * 既存の位置計算ロジックは一切変更せず、読み取り専用でデータを取得
 */
function generateCSS() {
    console.log('📋 v2.0: CSS出力処理開始');
    
    try {
        const activeChar = SpinePositioningV2.characters[SpinePositioningV2.activeIndex];
        if (!activeChar) {
            throw new Error('アクティブキャラクターが見つかりません');
        }
        
        const element = activeChar.element;
        if (!element) {
            throw new Error('キャラクター要素が見つかりません');
        }
        
        // 現在の位置・スケール・z-index情報を安全に取得
        const currentLeft = element.style.left || '0%';
        const currentTop = element.style.top || '0%';
        const currentScale = activeChar.scale || 1.0;
        const currentZIndex = activeChar.zIndex || 1000;
        
        // CSS形式で出力
        const cssContent = `/* Spine Positioning System v2.0 - CSS出力 */
/* 生成日時: ${new Date().toLocaleString('ja-JP')} */
/* キャラクター: ${activeChar.name} */

#${element.id || 'purattokun-canvas'} {
    position: absolute;
    left: ${currentLeft};
    top: ${currentTop};
    transform: translate(-50%, -50%) scale(${currentScale.toFixed(3)});
    z-index: ${currentZIndex};
}

/* 📊 設定値詳細 */
/*
  位置: X=${currentLeft}, Y=${currentTop}
  スケール: ${currentScale.toFixed(3)}倍
  レイヤー順序: z-index ${currentZIndex}
  
  使用方法:
  1. このCSSをお客様サイトのスタイルシートにコピー
  2. キャラクター要素のidが上記と一致することを確認
  3. position: relative のコンテナ内に配置
*/`;
        
        console.log('✅ v2.0: CSS生成完了');
        return cssContent;
        
    } catch (error) {
        console.error('❌ v2.0: CSS生成エラー:', error);
        return `/* CSS生成エラー: ${error.message} */`;
    }
}

/**
 * CSS出力ダイアログを表示
 * モーダル形式でCSS内容を表示し、コピー機能を提供
 */
function showCSSDialog(cssContent) {
    console.log('📋 v2.0: CSS出力ダイアログ表示');
    
    // 既存ダイアログがある場合は除去
    const existingDialog = document.getElementById('v2-css-dialog');
    if (existingDialog) {
        existingDialog.remove();
    }
    
    // ダイアログ要素作成
    const dialog = document.createElement('div');
    dialog.id = 'v2-css-dialog';
    dialog.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                    background: rgba(0,0,0,0.5); z-index: 99999; display: flex; 
                    align-items: center; justify-content: center;">
            <div style="background: white; border-radius: 8px; padding: 20px; 
                        max-width: 80%; max-height: 80%; overflow: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <div style="display: flex; align-items: center; justify-content: space-between; 
                            margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
                    <h3 style="margin: 0; color: #333; font-size: 18px;">📋 CSS出力結果</h3>
                    <button id="v2-css-dialog-close" 
                            style="background: none; border: none; font-size: 20px; cursor: pointer; 
                                   color: #666; padding: 0; width: 30px; height: 30px;">×</button>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                        以下のCSSをお客様サイトに適用してください：
                    </p>
                    <textarea id="v2-css-content" readonly
                              style="width: 100%; height: 300px; font-family: monospace; 
                                     border: 1px solid #ddd; border-radius: 4px; padding: 10px; 
                                     background: #f9f9f9; resize: vertical; font-size: 13px;">${cssContent}</textarea>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="v2-css-copy" 
                            style="padding: 8px 16px; background: #4CAF50; color: white; 
                                   border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                        📋 コピー
                    </button>
                    <button id="v2-css-download" 
                            style="padding: 8px 16px; background: #2196F3; color: white; 
                                   border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                        💾 ダウンロード
                    </button>
                    <button id="v2-css-close" 
                            style="padding: 8px 16px; background: #666; color: white; 
                                   border: none; border-radius: 4px; cursor: pointer;">
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // イベントハンドラー設定
    const closeDialog = () => {
        dialog.remove();
        console.log('📋 v2.0: CSS出力ダイアログ閉じました');
    };
    
    // 閉じるボタン
    document.getElementById('v2-css-dialog-close').addEventListener('click', closeDialog);
    document.getElementById('v2-css-close').addEventListener('click', closeDialog);
    
    // 背景クリックで閉じる
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            closeDialog();
        }
    });
    
    // ESCキーで閉じる
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeDialog();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // コピーボタン
    document.getElementById('v2-css-copy').addEventListener('click', async () => {
        const textarea = document.getElementById('v2-css-content');
        try {
            await navigator.clipboard.writeText(textarea.value);
            
            // 成功フィードバック
            const button = document.getElementById('v2-css-copy');
            const originalText = button.textContent;
            button.textContent = '✅ コピー完了!';
            button.style.background = '#4CAF50';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '#4CAF50';
            }, 2000);
            
            console.log('📋 v2.0: CSS内容をクリップボードにコピーしました');
            
        } catch (error) {
            console.error('❌ v2.0: クリップボードコピーエラー:', error);
            
            // フォールバック: テキストエリア選択
            textarea.select();
            document.execCommand('copy');
            
            alert('CSSをコピーしました（フォールバック方式）');
        }
    });
    
    // ダウンロードボタン
    document.getElementById('v2-css-download').addEventListener('click', () => {
        try {
            const activeChar = SpinePositioningV2.characters[SpinePositioningV2.activeIndex];
            const filename = `spine-positioning-${activeChar?.name || 'character'}-${new Date().toISOString().split('T')[0]}.css`;
            
            const blob = new Blob([cssContent], { type: 'text/css' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            
            URL.revokeObjectURL(url);
            
            console.log('💾 v2.0: CSSファイルをダウンロードしました:', filename);
            
        } catch (error) {
            console.error('❌ v2.0: CSSダウンロードエラー:', error);
            alert('ダウンロードエラーが発生しました。コピー機能をご利用ください。');
        }
    });
}

/**
 * CSS出力メイン機能
 * 安全なエラーハンドリングを含む統合関数
 */
function exportCSS() {
    console.log('📋 v2.0: CSS出力機能実行');
    
    try {
        // 基本チェック
        if (!SpinePositioningV2.initialized) {
            throw new Error('システムが初期化されていません');
        }
        
        if (!SpinePositioningV2.editMode) {
            throw new Error('編集モードではありません');
        }
        
        if (SpinePositioningV2.characters.length === 0) {
            throw new Error('キャラクターが検出されていません');
        }
        
        // CSS生成
        const cssContent = generateCSS();
        
        // ダイアログ表示
        showCSSDialog(cssContent);
        
        console.log('✅ v2.0: CSS出力機能完了');
        
    } catch (error) {
        console.error('❌ v2.0: CSS出力機能エラー:', error);
        alert(`CSS出力エラー: ${error.message}`);
    }
}

// 外部API追加
SpinePositioningV2.exportCSS = exportCSS;

console.log('✅ Spine Positioning System v2.0 読み込み完了');
console.log('💡 使用方法:');
console.log('  URL: ?edit=true&version=v2 (v2.0使用)');
console.log('  URL: ?edit=true&version=test (テストモード)');
console.log('  URL: ?edit=true (既存システム使用)');
console.log('  コンソール: SpinePositioningV2.* または v2Debug()');
console.log('📋 新機能: CSS出力機能（📋 CSS出力ボタン または SpinePositioningV2.exportCSS()）');