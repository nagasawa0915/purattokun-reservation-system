// 🎯 Spine配置システム編集モード (index.html統合用)

// グローバル変数
let isCharacterEditMode = false;
let isCanvasEditMode = false;
let isDragging = false;
let isResizing = false;
let resizeType = '';
let resizeDirection = '';
let startMousePos = { x: 0, y: 0 };
let startElementPos = { x: 0, y: 0, width: 0, height: 0 };

// 保存状態
let savedState = {
    character: { left: '60px', top: '60px', width: '80px', height: '80px' },
    canvas: { left: '25%', top: '65%', width: '120px', height: '120px' }
};

// DOM要素（index.html用に適応）
let character = null;
let characterCanvas = null;
let demoScreen = null;
let coordinateDisplay = null;
let editConfirmPanel = null;

// 🎯 外部からの呼び出し用関数
function startCharacterEdit() {
    if (!initializeDOMElements()) return;
    
    if (isCanvasEditMode) {
        endCanvasEditMode();
    }
    
    isCharacterEditMode = true;
    character.classList.add('edit-mode');
    
    const btn = document.getElementById('edit-character-btn');
    if (btn) {
        btn.textContent = 'キャラクター編集中...';
        btn.style.background = '#4caf50';
    }
    
    showConfirmPanel();
    updateCoordinateDisplay();
    console.log('🎯 キャラクター編集モード開始');
}

function startCanvasEdit() {
    if (!initializeDOMElements()) return;
    
    if (isCharacterEditMode) {
        endCharacterEditMode();
    }
    
    isCanvasEditMode = true;
    characterCanvas.classList.add('canvas-edit-mode');
    
    const btn = document.getElementById('edit-canvas-btn');
    if (btn) {
        btn.textContent = '表示範囲編集中...';
        btn.style.background = '#4caf50';
    }
    
    showConfirmPanel();
    updateCoordinateDisplay();
    console.log('🎯 Canvas編集モード開始');
}

// DOM要素の初期化（index.html用）
function initializeDOMElements() {
    // キャラクター要素を探す（複数の可能性を考慮）
    character = document.querySelector('#purattokun-canvas') || 
               document.querySelector('canvas[data-spine-character]') ||
               document.querySelector('#purattokun-fallback');
               
    if (!character) {
        console.error('❌ キャラクター要素が見つかりません');
        return false;
    }
    
    // 編集用のCanvas枠を作成
    createCharacterCanvas();
    
    // 座標表示要素を見つけるか作成
    coordinateDisplay = document.getElementById('coordinate-display');
    if (!coordinateDisplay) {
        console.warn('座標表示要素が見つかりません');
    }
    
    // 編集確定パネルを作成
    createConfirmPanel();
    
    // イベントリスナーを設定
    setupEventListeners();
    
    return true;
}

// キャラクター表示範囲（Canvas）を作成
function createCharacterCanvas() {
    characterCanvas = document.querySelector('.character-canvas');
    if (!characterCanvas) {
        characterCanvas = document.createElement('div');
        characterCanvas.className = 'character-canvas';
        characterCanvas.id = 'character-canvas-edit';
        
        // ぷらっとくんの親要素に追加
        const parent = character.parentElement;
        if (parent) {
            parent.appendChild(characterCanvas);
        } else {
            document.body.appendChild(characterCanvas);
        }
        
        // Canvas用のリサイズハンドルを追加
        ['se', 'sw', 'ne', 'nw'].forEach(direction => {
            const handle = document.createElement('div');
            handle.className = `canvas-resize-handle ${direction}`;
            characterCanvas.appendChild(handle);
        });
    }
    
    // demoScreenは背景要素
    demoScreen = document.querySelector('.background-container') || document.body;
}

// 確定パネルを作成
function createConfirmPanel() {
    editConfirmPanel = document.getElementById('edit-confirm-panel');
    if (!editConfirmPanel) {
        editConfirmPanel = document.createElement('div');
        editConfirmPanel.id = 'edit-confirm-panel';
        editConfirmPanel.className = 'confirm-panel';
        editConfirmPanel.innerHTML = `
            <div style="text-align: center;">
                <p style="margin-bottom: 15px; font-weight: bold;">編集を確定しますか？</p>
                <button class="save-btn" onclick="confirmEdit()">保存</button>
                <button class="cancel-btn" onclick="cancelEdit()">キャンセル</button>
            </div>
        `;
        document.body.appendChild(editConfirmPanel);
    }
}

// イベントリスナー設定
function setupEventListeners() {
    // キャラクターのドラッグイベント
    character.addEventListener('mousedown', startCharacterDrag);
    
    // Canvasのドラッグイベント
    characterCanvas.addEventListener('mousedown', startCanvasDrag);
    
    // リサイズハンドルのイベント（後で設定）
    setupResizeHandlers();
    
    // グローバルイベント
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

// キャラクタードラッグ開始
function startCharacterDrag(e) {
    if (!isCharacterEditMode) return;
    if (e.target.classList.contains('resize-handle')) return;
    
    e.preventDefault();
    isDragging = true;
    character.classList.add('dragging');
    
    // 現在の実際の位置を取得
    const rect = character.getBoundingClientRect();
    const canvasRect = characterCanvas.getBoundingClientRect();
    
    const currentX = rect.left + rect.width/2 - canvasRect.left;
    const currentY = rect.top + rect.height/2 - canvasRect.top;
    
    // パーセント指定をピクセルに変換
    character.style.left = currentX + 'px';
    character.style.top = currentY + 'px';
    
    startMousePos = { x: e.clientX, y: e.clientY };
    updateCoordinateDisplay();
}

// Canvasドラッグ開始
function startCanvasDrag(e) {
    if (!isCanvasEditMode) return;
    if (e.target.classList.contains('canvas-resize-handle')) return;
    
    e.preventDefault();
    isDragging = true;
    characterCanvas.classList.add('dragging');
    
    startMousePos = { x: e.clientX, y: e.clientY };
    
    const rect = characterCanvas.getBoundingClientRect();
    const parentRect = demoScreen.getBoundingClientRect();
    
    startElementPos = {
        x: rect.left - parentRect.left,
        y: rect.top - parentRect.top
    };
}

// マウス移動処理
function handleMouseMove(e) {
    if (!isDragging && !isResizing) return;
    
    const deltaX = e.clientX - startMousePos.x;
    const deltaY = e.clientY - startMousePos.y;
    
    if (isDragging) {
        if (isCharacterEditMode) {
            moveCharacter(deltaX, deltaY);
        } else if (isCanvasEditMode) {
            moveCanvas(deltaX, deltaY);
        }
    }
    
    updateCoordinateDisplay();
}

// キャラクター移動
function moveCharacter(deltaX, deltaY) {
    const canvasRect = characterCanvas.getBoundingClientRect();
    const charRect = character.getBoundingClientRect();
    
    const currentX = parseFloat(character.style.left) || 60;
    const currentY = parseFloat(character.style.top) || 60;
    
    let newX = currentX + deltaX;
    let newY = currentY + deltaY;
    
    // 境界制限（中心点基準）
    const charWidth = charRect.width;
    const charHeight = charRect.height;
    const minX = charWidth / 2;
    const maxX = canvasRect.width - charWidth / 2;
    const minY = charHeight / 2;
    const maxY = canvasRect.height - charHeight / 2;
    
    newX = Math.max(minX, Math.min(maxX, newX));
    newY = Math.max(minY, Math.min(maxY, newY));
    
    character.style.left = newX + 'px';
    character.style.top = newY + 'px';
    
    startMousePos.x = e.clientX;
    startMousePos.y = e.clientY;
}

// Canvas移動
function moveCanvas(deltaX, deltaY) {
    const newX = startElementPos.x + deltaX;
    const newY = startElementPos.y + deltaY;
    
    characterCanvas.style.left = newX + 'px';
    characterCanvas.style.top = newY + 'px';
}

// マウスアップ処理
function handleMouseUp() {
    if (isDragging) {
        isDragging = false;
        character.classList.remove('dragging');
        characterCanvas.classList.remove('dragging');
    }
    if (isResizing) {
        isResizing = false;
    }
}

// 確定パネル表示
function showConfirmPanel() {
    if (editConfirmPanel) {
        editConfirmPanel.classList.add('show');
    }
}

// 確定パネル非表示
function hideConfirmPanel() {
    if (editConfirmPanel) {
        editConfirmPanel.classList.remove('show');
    }
}

// 編集確定
function confirmEdit() {
    // 現在の状態をsavedStateに保存
    savedState.character.left = character.style.left;
    savedState.character.top = character.style.top;
    savedState.character.width = character.style.width;
    savedState.character.height = character.style.height;
    
    savedState.canvas.left = characterCanvas.style.left;
    savedState.canvas.top = characterCanvas.style.top;
    savedState.canvas.width = characterCanvas.style.width;
    savedState.canvas.height = characterCanvas.style.height;
    
    // localStorageに永続保存
    localStorage.setItem('spine-positioning-state', JSON.stringify(savedState));
    
    endEditMode();
    
    if (coordinateDisplay) {
        coordinateDisplay.textContent = '✅ 設定を保存しました';
        setTimeout(() => {
            coordinateDisplay.textContent = '';
        }, 2000);
    }
    
    console.log('✅ 編集内容を保存しました');
}

// 編集キャンセル
function cancelEdit() {
    if (coordinateDisplay) {
        coordinateDisplay.textContent = '🔄 前回保存した状態に戻しています...';
    }
    
    setTimeout(() => {
        location.reload(); // 確実なロールバック
    }, 500);
}

// 編集モード終了
function endEditMode() {
    endCharacterEditMode();
    endCanvasEditMode();
    hideConfirmPanel();
}

function endCharacterEditMode() {
    isCharacterEditMode = false;
    character.classList.remove('edit-mode');
    
    const btn = document.getElementById('edit-character-btn');
    if (btn) {
        btn.textContent = 'キャラクター編集';
        btn.style.background = '#ff6b6b';
    }
}

function endCanvasEditMode() {
    isCanvasEditMode = false;
    characterCanvas.classList.remove('canvas-edit-mode');
    
    const btn = document.getElementById('edit-canvas-btn');
    if (btn) {
        btn.textContent = '表示範囲編集';
        btn.style.background = '#4ECDC4';
    }
}

// 座標表示更新
function updateCoordinateDisplay() {
    if (!coordinateDisplay) return;
    
    if (isCharacterEditMode) {
        const x = parseFloat(character.style.left) || 60;
        const y = parseFloat(character.style.top) || 60;
        coordinateDisplay.textContent = `🎯 キャラクター位置: X=${x.toFixed(0)}px, Y=${y.toFixed(0)}px`;
    } else if (isCanvasEditMode) {
        const width = parseFloat(characterCanvas.style.width) || 120;
        const height = parseFloat(characterCanvas.style.height) || 120;
        coordinateDisplay.textContent = `📐 表示範囲: W=${width.toFixed(0)}px, H=${height.toFixed(0)}px`;
    }
}

// リサイズハンドラー設定（簡略版）
function setupResizeHandlers() {
    // 実装は必要に応じて追加
    console.log('🔧 リサイズハンドラー設定完了');
}

// 初期化時にローカルストレージから復元
function loadSavedState() {
    try {
        const saved = localStorage.getItem('spine-positioning-state');
        if (saved) {
            const loadedState = JSON.parse(saved);
            savedState = loadedState;
            console.log('✅ 保存された状態を読み込みました');
            return true;
        }
    } catch (e) {
        console.error('❌ localStorage読み込みエラー:', e);
    }
    return false;
}

console.log('✅ Spine編集システム読み込み完了');