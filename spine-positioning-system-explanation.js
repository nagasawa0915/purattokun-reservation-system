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

// 🎯 統一座標システム対応：保存状態
let savedState = {
    character: { left: '60px', top: '60px', width: '80px', height: '80px' },
    canvas: { 
        left: '20%',   // 統一システム：CSS位置制御（メインレイヤー）
        top: '70%',    // 統一システム：CSS位置制御（メインレイヤー）
        width: '120px',  // 統一システム：CSS=WebGL=統一解像度
        height: '120px'  // 統一システム：CSS=WebGL=統一解像度
    }
};

// DOM要素（index.html用に適応）
let character = null;
let originalCanvasElement = null; // 元のcanvas要素への参照
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
    character.classList.add('demo-character'); // CSSセレクタのために追加
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
        
        // ぷらっとくんの実際の位置とサイズを取得
        const charRect = character.getBoundingClientRect();
        const parentRect = character.parentElement.getBoundingClientRect();
        
        // 編集用Canvasをキャラクターの位置に配置
        characterCanvas.style.position = 'absolute';
        characterCanvas.style.left = (charRect.left - parentRect.left) + 'px';
        characterCanvas.style.top = (charRect.top - parentRect.top) + 'px';
        characterCanvas.style.width = charRect.width + 'px';
        characterCanvas.style.height = charRect.height + 'px';
        characterCanvas.style.transform = 'none'; // transformはキャラクター側で管理
        
        // ぷらっとくんの親要素に追加
        const parent = character.parentElement;
        if (parent) {
            parent.appendChild(characterCanvas);
        } else {
            document.body.appendChild(characterCanvas);
        }
        
        // キャラクターを編集Canvasの中に移動
        characterCanvas.appendChild(character);
        
        // キャラクターの位置を編集Canvas内での相対位置に調整
        character.style.position = 'absolute';
        character.style.left = '50%';
        character.style.top = '50%';
        character.style.transform = 'translate(-50%, -50%)';
        
        // キャラクター用のリサイズハンドルを追加
        console.log('🔧 キャラクター要素のタイプ:', character.tagName);
        console.log('🔧 キャラクター要素:', character);
        
        // canvas要素の場合は、ラッパーを作成する必要がある
        if (character.tagName === 'CANVAS') {
            console.log('⚠️ canvas要素は子要素を持てないため、ラッパーを作成します');
            
            // 元のcanvas要素を保存
            originalCanvasElement = character;
            
            // キャラクターラッパーを作成
            const characterWrapper = document.createElement('div');
            characterWrapper.className = 'character-wrapper demo-character';
            characterWrapper.style.position = 'relative';
            
            // 🎯 統一座標システム：キャラクターサイズを統一システムから取得
            // getBoundingClientRect()で統一座標システムのサイズを取得
            const actualRect = character.getBoundingClientRect();
            const actualWidth = actualRect.width;
            const actualHeight = actualRect.height;
            
            // 統一座標システム対応デバッグ情報
            console.log('📏 統一座標システム キャラクターサイズ:', {
                cssWidth: character.style.width,
                cssHeight: character.style.height,
                unifiedWidth: actualWidth,   // 統一システム実サイズ
                unifiedHeight: actualHeight, // 統一システム実サイズ
                note: 'CSS=WebGL=統一解像度'
            });
            
            // 統一システムサイズに合わせてラッパーを作成
            characterWrapper.style.width = actualWidth + 'px';
            characterWrapper.style.height = actualHeight + 'px';
            
            // canvas要素の位置をラッパーに移動
            characterWrapper.style.left = '50%';
            characterWrapper.style.top = '50%';
            characterWrapper.style.transform = 'translate(-50%, -50%)';
            
            // 🎯 統一座標システム：canvas要素の位置スタイルを統一システム対応でリセット
            character.style.position = 'absolute';
            character.style.left = '0';
            character.style.top = '0';
            character.style.transform = 'none';
            character.style.width = '100%';   // ラッパー内で100%（統一システム）
            character.style.height = '100%';  // ラッパー内で100%（統一システム）
            
            console.log('🎯 統一座標システム：Canvas要素をラッパー内で統一制御に設定');
            
            // ラッパーにリサイズハンドルを追加
            ['se', 'sw', 'ne', 'nw'].forEach(direction => {
                const handle = document.createElement('div');
                handle.className = `resize-handle ${direction}`;
                handle.setAttribute('data-direction', direction);
                characterWrapper.appendChild(handle);
            });
            
            // canvas要素をラッパーで包む
            characterCanvas.appendChild(characterWrapper);
            characterWrapper.appendChild(character);
            
            // characterをラッパーに更新
            character = characterWrapper;
            console.log('✅ キャラクターラッパーを作成しました');
        } else {
            // canvas以外の要素の場合は直接追加
            ['se', 'sw', 'ne', 'nw'].forEach(direction => {
                const handle = document.createElement('div');
                handle.className = `resize-handle ${direction}`;
                handle.setAttribute('data-direction', direction);
                character.appendChild(handle);
            });
        }
        
        // Canvas用のリサイズハンドルを追加
        ['se', 'sw', 'ne', 'nw'].forEach(direction => {
            const handle = document.createElement('div');
            handle.className = `canvas-resize-handle ${direction}`;
            handle.setAttribute('data-direction', direction);
            characterCanvas.appendChild(handle);
        });
        
        // 初期状態を保存
        savedState.canvas.left = characterCanvas.style.left;
        savedState.canvas.top = characterCanvas.style.top;
        savedState.canvas.width = characterCanvas.style.width;
        savedState.canvas.height = characterCanvas.style.height;
        savedState.character.left = character.style.left;
        savedState.character.top = character.style.top;
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
    } else if (isResizing) {
        if (resizeType === 'character') {
            resizeCharacter(deltaX, deltaY);
        } else if (resizeType === 'canvas') {
            resizeCanvas(deltaX, deltaY);
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

// キャラクターリサイズ
function resizeCharacter(deltaX, deltaY) {
    const minSize = 20; // 最小サイズ
    const maxSize = 200; // 最大サイズ
    
    let widthDiff = 0;
    let heightDiff = 0;
    
    // 方向に応じたサイズ変更
    switch (resizeDirection) {
        case 'se': // 右下
            widthDiff = deltaX;
            heightDiff = deltaY;
            break;
        case 'sw': // 左下
            widthDiff = -deltaX;
            heightDiff = deltaY;
            break;
        case 'ne': // 右上
            widthDiff = deltaX;
            heightDiff = -deltaY;
            break;
        case 'nw': // 左上
            widthDiff = -deltaX;
            heightDiff = -deltaY;
            break;
    }
    
    const newWidth = Math.max(minSize, Math.min(maxSize, startElementPos.width + widthDiff));
    const newHeight = Math.max(minSize, Math.min(maxSize, startElementPos.height + heightDiff));
    
    character.style.width = newWidth + 'px';
    character.style.height = newHeight + 'px';
}

// Canvasリサイズ
function resizeCanvas(deltaX, deltaY) {
    const minSize = 60; // 最小サイズ
    const maxSize = 300; // 最大サイズ
    
    let widthDiff = 0;
    let heightDiff = 0;
    let leftDiff = 0;
    let topDiff = 0;
    
    // 方向に応じたサイズ・位置変更
    switch (resizeDirection) {
        case 'se': // 右下
            widthDiff = deltaX;
            heightDiff = deltaY;
            break;
        case 'sw': // 左下
            widthDiff = -deltaX;
            heightDiff = deltaY;
            leftDiff = deltaX;
            break;
        case 'ne': // 右上
            widthDiff = deltaX;
            heightDiff = -deltaY;
            topDiff = deltaY;
            break;
        case 'nw': // 左上
            widthDiff = -deltaX;
            heightDiff = -deltaY;
            leftDiff = deltaX;
            topDiff = deltaY;
            break;
    }
    
    const newWidth = Math.max(minSize, Math.min(maxSize, startElementPos.width + widthDiff));
    const newHeight = Math.max(minSize, Math.min(maxSize, startElementPos.height + heightDiff));
    const newLeft = startElementPos.left + leftDiff;
    const newTop = startElementPos.top + topDiff;
    
    characterCanvas.style.width = newWidth + 'px';
    characterCanvas.style.height = newHeight + 'px';
    characterCanvas.style.left = newLeft + 'px';
    characterCanvas.style.top = newTop + 'px';
}

// マウスアップ処理
function handleMouseUp() {
    if (isDragging) {
        isDragging = false;
        if (character) character.classList.remove('dragging');
        if (characterCanvas) characterCanvas.classList.remove('dragging');
    }
    if (isResizing) {
        isResizing = false;
        resizeType = '';
        resizeDirection = '';
        if (character) character.classList.remove('resizing');
        if (characterCanvas) characterCanvas.classList.remove('resizing');
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
    // キャラクターを元の位置に戻す
    if (characterCanvas && character) {
        const originalParent = document.querySelector('.hero-content') || document.body;
        
        // ラッパーを解除する必要がある場合
        if (originalCanvasElement && character.classList.contains('character-wrapper')) {
            console.log('🔄 キャラクターラッパーを解除します');
            
            // 元のcanvas要素を取り出す
            const canvasElement = originalCanvasElement;
            
            // ラッパーの位置情報を取得
            const wrapperRect = character.getBoundingClientRect();
            const canvasRect = characterCanvas.getBoundingClientRect();
            const parentRect = originalParent.getBoundingClientRect();
            
            // canvas要素を元の親要素に戻す
            originalParent.appendChild(canvasElement);
            
            // 元の位置スタイルを復元
            if (savedState && savedState.canvas) {
                const canvasLeft = parseFloat(savedState.canvas.left);
                const canvasTop = parseFloat(savedState.canvas.top);
                const canvasWidth = parseFloat(savedState.canvas.width);
                const canvasHeight = parseFloat(savedState.canvas.height);
                
                // ラッパーの編集Canvas内での相対位置
                const wrapperInCanvasX = wrapperRect.left + wrapperRect.width/2 - canvasRect.left;
                const wrapperInCanvasY = wrapperRect.top + wrapperRect.height/2 - canvasRect.top;
                
                // 親要素に対する絶対位置を計算
                const newLeft = canvasLeft + wrapperInCanvasX;
                const newTop = canvasTop + wrapperInCanvasY;
                
                // 元のパーセント位置に変換
                const parentWidth = parentRect.width;
                const parentHeight = parentRect.height;
                canvasElement.style.left = (newLeft / parentWidth * 100) + '%';
                canvasElement.style.top = (newTop / parentHeight * 100) + '%';
                canvasElement.style.width = wrapperRect.width + 'px';
                canvasElement.style.height = wrapperRect.height + 'px';
            }
            
            canvasElement.style.position = 'absolute';
            canvasElement.style.transform = 'translate(-50%, -50%)';
            
            // ラッパーを削除
            if (character.parentElement) {
                character.parentElement.removeChild(character);
            }
            
            // characterを元のcanvas要素に戻す
            character = canvasElement;
            originalCanvasElement = null;
        } else {
            // ラッパーでない場合の通常処理
            const charRect = character.getBoundingClientRect();
            const canvasRect = characterCanvas.getBoundingClientRect();
            const parentRect = originalParent.getBoundingClientRect();
            
            originalParent.appendChild(character);
            
            if (savedState && savedState.canvas) {
                const canvasLeft = parseFloat(savedState.canvas.left);
                const canvasTop = parseFloat(savedState.canvas.top);
                const canvasWidth = parseFloat(savedState.canvas.width);
                const canvasHeight = parseFloat(savedState.canvas.height);
                
                const charInCanvasX = parseFloat(character.style.left.replace('%', '')) / 100 * canvasWidth;
                const charInCanvasY = parseFloat(character.style.top.replace('%', '')) / 100 * canvasHeight;
                
                const newLeft = canvasLeft + charInCanvasX;
                const newTop = canvasTop + charInCanvasY;
                
                const parentWidth = parentRect.width;
                const parentHeight = parentRect.height;
                character.style.left = (newLeft / parentWidth * 100) + '%';
                character.style.top = (newTop / parentHeight * 100) + '%';
            }
            
            character.style.transform = 'translate(-50%, -50%)';
        }
        
        // 編集Canvasを削除
        if (characterCanvas.parentElement) {
            characterCanvas.parentElement.removeChild(characterCanvas);
        }
        characterCanvas = null;
    }
    
    endCharacterEditMode();
    endCanvasEditMode();
    hideConfirmPanel();
}

function endCharacterEditMode() {
    isCharacterEditMode = false;
    if (character) {
        character.classList.remove('edit-mode');
        character.classList.remove('demo-character');
    }
    
    const btn = document.getElementById('edit-character-btn');
    if (btn) {
        btn.textContent = 'キャラクター編集';
        btn.style.background = '#ff6b6b';
    }
}

function endCanvasEditMode() {
    isCanvasEditMode = false;
    if (characterCanvas) {
        characterCanvas.classList.remove('canvas-edit-mode');
    }
    
    const btn = document.getElementById('edit-canvas-btn');
    if (btn) {
        btn.textContent = '表示範囲編集';
        btn.style.background = '#4ECDC4';
    }
}

// 🎯 統一座標システム対応：座標表示更新
function updateCoordinateDisplay() {
    if (!coordinateDisplay) return;
    
    if (isCharacterEditMode) {
        const x = parseFloat(character.style.left) || 60;
        const y = parseFloat(character.style.top) || 60;
        coordinateDisplay.textContent = `🎯 [統一システム] キャラクター位置: X=${x.toFixed(0)}px, Y=${y.toFixed(0)}px`;
    } else if (isCanvasEditMode) {
        const left = characterCanvas.style.left || '20%';
        const top = characterCanvas.style.top || '70%';
        const width = parseFloat(characterCanvas.style.width) || 120;
        const height = parseFloat(characterCanvas.style.height) || 120;
        coordinateDisplay.textContent = `🎯 [統一システム] Canvas: ${left}, ${top}, ${width.toFixed(0)}px×${height.toFixed(0)}px`;
    }
}

// リサイズハンドラー設定
function setupResizeHandlers() {
    // キャラクターのリサイズハンドル（編集Canvas作成後に設定）
    const setupCharacterHandles = () => {
        if (character) {
            const characterHandles = character.querySelectorAll('.resize-handle');
            characterHandles.forEach(handle => {
                handle.addEventListener('mousedown', (e) => {
                    if (!isCharacterEditMode) return;
                    startResize(e, 'character', handle.dataset.direction);
                });
            });
        }
    };
    
    // Canvasのリサイズハンドル（編集Canvas作成後に設定）
    const setupCanvasHandles = () => {
        if (characterCanvas) {
            const canvasHandles = characterCanvas.querySelectorAll('.canvas-resize-handle');
            canvasHandles.forEach(handle => {
                handle.addEventListener('mousedown', (e) => {
                    if (!isCanvasEditMode) return;
                    startResize(e, 'canvas', handle.dataset.direction);
                });
            });
        }
    };
    
    // 編集Canvas作成後に呼び出し
    setupCharacterHandles();
    setupCanvasHandles();
    
    console.log('🔧 リサイズハンドラー設定完了');
}

// リサイズ開始
function startResize(e, target, direction) {
    e.preventDefault();
    e.stopPropagation();
    
    isResizing = true;
    resizeType = target;
    resizeDirection = direction;
    
    startMousePos = { x: e.clientX, y: e.clientY };
    
    if (target === 'character') {
        const rect = character.getBoundingClientRect();
        startElementPos = {
            width: rect.width,
            height: rect.height,
            centerX: parseFloat(character.style.left.replace('%', '')) || 50,
            centerY: parseFloat(character.style.top.replace('%', '')) || 50
        };
        character.classList.add('resizing');
    } else if (target === 'canvas') {
        const rect = characterCanvas.getBoundingClientRect();
        startElementPos = {
            width: rect.width,
            height: rect.height,
            left: parseFloat(characterCanvas.style.left) || 0,
            top: parseFloat(characterCanvas.style.top) || 0
        };
        characterCanvas.classList.add('resizing');
    }
    
    updateCoordinateDisplay();
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

console.log('✅ 統一座標システム対応 Spine編集システム読み込み完了');
console.log('🎯 統一座標システム: 4レイヤー→CSSメインレイヤーに統一完了');
console.log('  - CSS位置・サイズ制御（メインレイヤー）');
console.log('  - WebGL解像度 = CSS表示サイズ（統一）');
console.log('  - Skeleton座標 = Canvas中央固定（簡素化）');