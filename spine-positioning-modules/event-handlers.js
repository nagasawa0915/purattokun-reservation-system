// 🎯 Spine編集システム - イベント処理モジュール
// 役割: イベントリスナー設定、マウス・タッチイベント処理

console.log('🚀 イベント処理モジュール読み込み開始');

// ========== イベントリスナー設定 ========== //

function setupEventListeners() {
    console.log('🔧 イベントリスナー設定開始（マウス・タッチ対応）');
    
    // キャラクター移動イベント（マウス・タッチ両対応）
    if (window.isCharacterEditMode && window.character) {
        // マウスイベント
        window.character.addEventListener('mousedown', window.startCharacterDrag || startCharacterDrag);
        // タッチイベント
        window.character.addEventListener('touchstart', window.handleTouchStart || handleTouchStart, { passive: false });
    }
    
    // Canvas移動イベント削除：不要
    
    // グローバルイベント（マウス・タッチ両対応）
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', window.handleTouchMove || handleTouchMove, { passive: false });
    document.addEventListener('touchend', window.handleTouchEnd || handleTouchEnd);
    
    console.log('✅ イベントリスナー設定完了（マウス・タッチ対応）');
}

// ========== マウスイベント処理 ========== //

function handleMouseMove(e) {
    if (!window.isDragging && !window.isResizing) return;
    
    const deltaX = e.clientX - window.startMousePos.x;
    const deltaY = e.clientY - window.startMousePos.y;
    
    // リサイズを優先処理（ハンドル操作）
    if (window.isResizing) {
        console.log('🔧 リサイズ処理:', { deltaX, deltaY });
        if (typeof window.performResize === 'function') {
            window.performResize(deltaX, deltaY);
        }
    } else if (window.isDragging) {
        console.log('🔧 移動処理:', { deltaX, deltaY });
        if (window.isCharacterEditMode && typeof window.moveCharacter === 'function') {
            window.moveCharacter(deltaX, deltaY);
        }
    }
    
    if (typeof window.updateCoordinateDisplay === 'function') {
        window.updateCoordinateDisplay();
    }
}

function handleMouseUp() {
    if (window.isDragging || window.isResizing) {
        console.log('🔄 操作終了:', { isDragging: window.isDragging, isResizing: window.isResizing });
        
        // 状態リセット
        window.isDragging = false;
        window.isResizing = false;
        window.activeHandle = null;
        
        // CSS状態リセット
        if (window.character) {
            window.character.classList.remove('dragging', 'resize-mode');
        }
        // characterCanvas削除済み：不要
        
        console.log('✅ 状態リセット完了');
    }
}

// ========== タッチイベント処理（フォールバック） ========== //

function startCharacterDrag(e) {
    // ハンドル判定を厳密に行う
    if (!window.isCharacterEditMode || 
        e.target.classList.contains('handle') || 
        e.target.closest('.handle') ||
        window.isResizing) {
        console.log('🚫 character移動をスキップ:', {
            isCharacterEditMode: window.isCharacterEditMode,
            isHandle: e.target.classList.contains('handle'),
            isResizing: window.isResizing
        });
        return;
    }
    
    console.log('🎯 character移動開始（%ベース）');
    e.preventDefault();
    window.isDragging = true;
    window.startMousePos = { x: e.clientX, y: e.clientY };
    
    // 現在の%位置を記録
    const character = window.character;
    const currentState = character.style.left ? 
        { left: character.style.left, top: character.style.top } :
        (window.getDynamicCharacterState ? window.getDynamicCharacterState(character) : {});
    
    window.startElementState = {
        leftPercent: parseFloat(currentState.left),
        topPercent: parseFloat(currentState.top)
    };
    
    if (typeof window.updateCoordinateDisplay === 'function') {
        window.updateCoordinateDisplay();
    }
    console.log('🎯 キャラクタードラッグ開始（%座標）:', window.startElementState);
}

function handleTouchStart(e) {
    console.log('📱 タッチ開始（キャラクター）');
    
    // ハンドル判定を厳密に行う（マウスイベントと同様）
    if (!window.isCharacterEditMode || 
        e.target.classList.contains('handle') || 
        e.target.closest('.handle') ||
        window.isResizing) {
        console.log('🚫 キャラクタータッチをスキップ:', {
            isCharacterEditMode: window.isCharacterEditMode,
            isHandle: e.target.classList.contains('handle'),
            isResizing: window.isResizing
        });
        return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    // タッチ座標を取得（最初のタッチポイント）
    const touch = e.touches[0];
    
    // マウスイベントと同じロジックでドラッグ開始
    console.log('🎯 キャラクタータッチ移動開始（%ベース）');
    window.isDragging = true;
    window.startMousePos = { x: touch.clientX, y: touch.clientY };
    
    // 現在の%位置を記録
    const character = window.character;
    const currentState = character.style.left ? 
        { left: character.style.left, top: character.style.top } :
        (window.getDynamicCharacterState ? window.getDynamicCharacterState(character) : {});
    
    window.startElementState = {
        leftPercent: parseFloat(currentState.left),
        topPercent: parseFloat(currentState.top)
    };
    
    if (typeof window.updateCoordinateDisplay === 'function') {
        window.updateCoordinateDisplay();
    }
    console.log('🎯 キャラクタータッチドラッグ開始（%座標）:', window.startElementState);
}

function handleTouchMove(e) {
    if (!window.isDragging && !window.isResizing) return;
    
    e.preventDefault(); // スクロール防止
    
    // タッチ座標を取得（最初のタッチポイント）
    const touch = e.touches[0];
    
    const deltaX = touch.clientX - window.startMousePos.x;
    const deltaY = touch.clientY - window.startMousePos.y;
    
    // リサイズを優先処理（ハンドル操作）
    if (window.isResizing) {
        console.log('🔧 タッチリサイズ処理:', { deltaX, deltaY });
        if (typeof window.performResize === 'function') {
            window.performResize(deltaX, deltaY);
        }
    } else if (window.isDragging) {
        console.log('🔧 タッチ移動処理:', { deltaX, deltaY });
        if (window.isCharacterEditMode && typeof window.moveCharacter === 'function') {
            window.moveCharacter(deltaX, deltaY);
        }
    }
    
    if (typeof window.updateCoordinateDisplay === 'function') {
        window.updateCoordinateDisplay();
    }
}

function handleTouchEnd(e) {
    if (window.isDragging || window.isResizing) {
        console.log('🔄 タッチ操作終了:', { isDragging: window.isDragging, isResizing: window.isResizing });
        
        // 状態リセット（マウスイベントと同じ）
        window.isDragging = false;
        window.isResizing = false;
        window.activeHandle = null;
        
        // CSS状態リセット
        const character = window.character;
        if (character) {
            character.classList.remove('dragging', 'resize-mode');
        }
        
        console.log('✅ タッチ状態リセット完了');
    }
}

// ========== グローバル関数エクスポート（互換性維持） ========== //

// 関数をwindowオブジェクトに追加（互換性維持）
window.setupEventListeners = setupEventListeners;
window.handleMouseMove = handleMouseMove;
window.handleMouseUp = handleMouseUp;

// タッチイベント処理関数（フォールバック）
if (!window.startCharacterDrag) {
    window.startCharacterDrag = startCharacterDrag;
}
if (!window.handleTouchStart) {
    window.handleTouchStart = handleTouchStart;
}
if (!window.handleTouchMove) {
    window.handleTouchMove = handleTouchMove;
}
if (!window.handleTouchEnd) {
    window.handleTouchEnd = handleTouchEnd;
}

console.log('✅ イベント処理モジュール読み込み完了');