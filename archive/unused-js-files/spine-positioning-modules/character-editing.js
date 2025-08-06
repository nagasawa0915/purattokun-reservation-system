// 🎯 Spine編集システム - キャラクター編集機能モジュール
// 役割: キャラクター編集開始、ハンドル作成、リサイズ処理

console.log('🚀 キャラクター編集機能モジュール読み込み開始');

// ========== キャラクター編集開始 ========== //

function startCharacterEdit() {
    console.log('🎯 キャラクター編集モード開始（計算値ベース位置保持）');
    
    // DOM初期化を先に実行
    if (typeof window.initializeDOMElements === 'function') {
        if (!window.initializeDOMElements()) {
            console.error('❌ DOM初期化失敗');
            return;
        }
    }
    
    // character要素の存在確認
    const character = window.character || document.querySelector('#purattokun-canvas') || 
                     document.querySelector('canvas[data-spine-character]') ||
                     document.querySelector('#purattokun-fallback');
    
    if (!character) {
        console.error('❌ character要素が見つかりません');
        return;
    }
    
    // characterをグローバル参照に設定
    window.character = character;
    
    // 🎯 スタイル値を優先的に使用（transform影響を避ける）
    let currentStyles = {
        left: character.style.left,
        top: character.style.top,
        width: character.style.width
    };
    
    // スタイル値が空の場合は動的取得を使用
    if (!currentStyles.left || !currentStyles.top || !currentStyles.width) {
        console.log('⚠️ スタイル値が未設定。動的取得を実行');
        // 🎯 汎用性：動的取得を使用（固定値に依存しない）
        const dynamicState = window.getDynamicCharacterState ? 
                             window.getDynamicCharacterState(character) : 
                             { left: '50%', top: '50%', width: '20%' };
        currentStyles.left = currentStyles.left || dynamicState.left;
        currentStyles.top = currentStyles.top || dynamicState.top;
        currentStyles.width = currentStyles.width || dynamicState.width;
        
        // デフォルト値を実際に設定
        character.style.left = currentStyles.left;
        character.style.top = currentStyles.top;
        character.style.width = currentStyles.width;
    }
    
    const preEditState = {
        style_left: currentStyles.left,
        style_top: currentStyles.top,
        style_width: currentStyles.width,
        has_transform: window.getComputedStyle(character).transform !== 'none'
    };
    
    console.log('📍 編集開始前の位置記録（スタイル値優先）:', preEditState);
    
    // 🔧 位置の再設定は基本的に不要（既にスタイル値が設定されているため）
    // ただし、ラッパーが作成されている場合は念のため再設定
    if (character.classList.contains('character-wrapper')) {
        console.log('🔧 ラッパー検出 - 位置を再設定');
        character.style.left = preEditState.style_left;
        character.style.top = preEditState.style_top;
        character.style.width = preEditState.style_width;
    } else {
        console.log('✅ 既存のスタイル値を維持');
    }
    
    
    console.log('✅ 位置復元完了:', {
        復元後_left: character.style.left,
        復元後_top: character.style.top,
        復元後_width: character.style.width
    });
    
    // 編集モード状態を設定
    window.isCharacterEditMode = true;
    character.classList.add('edit-mode');
    
    // ハンドル作成
    createHandles();
    
    // イベントリスナー設定
    if (typeof window.setupEventListeners === 'function') {
        window.setupEventListeners();
    }
    
    // UI更新
    if (typeof window.updateUI === 'function') {
        window.updateUI();
    }
    if (typeof window.showConfirmPanel === 'function') {
        window.showConfirmPanel();
    }
    
    
    console.log('✅ キャラクター編集モード有効化完了（計算値ベース保持・数値入力システム統合）');
}

// ========== ハンドルシステム ========== //

function createHandles() {
    console.log('🔧 キャラクターハンドル作成開始');
    
    const character = window.character;
    if (!character) {
        console.error('❌ character要素がnullです');
        return;
    }
    
    // 既存ハンドル削除
    const existingHandles = character.querySelectorAll('.handle');
    existingHandles.forEach(handle => handle.remove());
    
    // ハンドル定義（対角固定点拡縮システム）
    const handlePositions = [
        // 4隅の緑ハンドル（対角固定点拡縮）
        { pos: 'nw', title: '対角拡縮（右下を固定点として拡縮）', type: 'corner' },
        { pos: 'ne', title: '対角拡縮（左下を固定点として拡縮）', type: 'corner' },
        { pos: 'sw', title: '対角拡縮（右上を固定点として拡縮）', type: 'corner' },
        { pos: 'se', title: '対角拡縮（左上を固定点として拡縮）', type: 'corner' },
        // 辺の中央の青ハンドル（反対側固定点拡縮）
        { pos: 'n', title: '上辺：下辺を固定点として拡縮', type: 'edge' },
        { pos: 's', title: '下辺：上辺を固定点として拡縮', type: 'edge' },
        { pos: 'w', title: '左辺：右辺を固定点として拡縮', type: 'edge' },
        { pos: 'e', title: '右辺：左辺を固定点として拡縮', type: 'edge' },
        // 中央の橙ハンドル（中心拡縮）
        { pos: 'center', title: '中心拡縮（位置固定でサイズ変更）', type: 'center' }
    ];
    
    // ハンドル要素作成
    handlePositions.forEach(handleDef => {
        const handle = document.createElement('div');
        handle.className = `handle ${handleDef.pos}`;
        handle.title = handleDef.title;
        handle.dataset.position = handleDef.pos;
        
        // ハンドルスタイル
        handle.style.cssText = `
            position: absolute;
            width: 12px;
            height: 12px;
            border: 2px solid #333;
            border-radius: 50%;
            cursor: pointer;
            z-index: 100;
            transition: all 0.2s;
        `;
        
        // 位置設定とカラー設定
        switch (handleDef.pos) {
            // 🟢 4隅の緑ハンドル（対角固定点拡縮）
            case 'nw':
                handle.style.top = '-6px';
                handle.style.left = '-6px';
                handle.style.background = '#4caf50';
                break;
            case 'ne':
                handle.style.top = '-6px';
                handle.style.right = '-6px';
                handle.style.background = '#4caf50';
                break;
            case 'sw':
                handle.style.bottom = '-6px';
                handle.style.left = '-6px';
                handle.style.background = '#4caf50';
                break;
            case 'se':
                handle.style.bottom = '-6px';
                handle.style.right = '-6px';
                handle.style.background = '#4caf50';
                break;
            // 🔵 辺の中央の青ハンドル（反対側固定点拡縮）
            case 'n':
                handle.style.top = '-6px';
                handle.style.left = '50%';
                handle.style.transform = 'translateX(-50%)';
                handle.style.background = '#2196f3';
                break;
            case 's':
                handle.style.bottom = '-6px';
                handle.style.left = '50%';
                handle.style.transform = 'translateX(-50%)';
                handle.style.background = '#2196f3';
                break;
            case 'w':
                handle.style.left = '-6px';
                handle.style.top = '50%';
                handle.style.transform = 'translateY(-50%)';
                handle.style.background = '#2196f3';
                break;
            case 'e':
                handle.style.right = '-6px';
                handle.style.top = '50%';
                handle.style.transform = 'translateY(-50%)';
                handle.style.background = '#2196f3';
                break;
            // 🟠 中央の橙ハンドル（中心拡縮）
            case 'center':
                handle.style.top = '50%';
                handle.style.left = '50%';
                handle.style.transform = 'translate(-50%, -50%)';
                handle.style.background = '#ff9800';
                handle.style.width = '16px';
                handle.style.height = '16px';
                break;
        }
        
        // イベント（対角固定点拡縮システム・マウス・タッチ両対応）
        handle.addEventListener('mousedown', (e) => {
            console.log('🎯 ハンドルmousedown:', handleDef.pos, handleDef.type);
            e.stopPropagation();
            e.preventDefault();
            // character要素のイベントを無効化
            window.isDragging = false;
            window.isResizing = false;
            startFixedPointResize(e, handleDef.pos, handleDef.type);
        }, true); // キャプチャフェーズで実行
        
        // タッチイベント
        handle.addEventListener('touchstart', (e) => {
            console.log('📱 ハンドルtouchstart:', handleDef.pos, handleDef.type);
            e.stopPropagation();
            e.preventDefault();
            // character要素のイベントを無効化
            window.isDragging = false;
            window.isResizing = false;
            startFixedPointResizeTouch(e, handleDef.pos, handleDef.type);
        }, true); // キャプチャフェーズで実行
        
        character.appendChild(handle);
    });
    
    console.log('✅ キャラクターハンドル作成完了');
}

// ========== リサイズ処理 ========== //

function startFixedPointResizeTouch(e, position, type) {
    console.log('📱 対角固定点拡縮開始（タッチ・%ベース）:', { position, type });
    
    e.preventDefault();
    e.stopPropagation();
    
    // タッチ座標を取得（最初のタッチポイント）
    const touch = e.touches[0];
    
    // 確実に状態設定
    window.isDragging = false; // 移動モードを無効化
    window.isResizing = true;  // リサイズモードを有効化
    window.activeHandle = { dataset: { position, type } };
    window.startMousePos = { x: touch.clientX, y: touch.clientY };
    
    // 現在の%状態を記録（動的取得使用）
    const character = window.character;
    const currentState = character.style.left ? 
        { left: character.style.left, top: character.style.top, width: character.style.width } :
        (window.getDynamicCharacterState ? window.getDynamicCharacterState(character) : {});
    
    const currentLeftPercent = parseFloat(currentState.left);
    const currentTopPercent = parseFloat(currentState.top);
    const currentWidthPercent = parseFloat(currentState.width);
    
    window.startElementState = {
        leftPercent: currentLeftPercent,
        topPercent: currentTopPercent,
        widthPercent: currentWidthPercent,
        // 固定点%座標（対角固定点計算用）
        leftEdgePercent: currentLeftPercent - currentWidthPercent / 2,
        rightEdgePercent: currentLeftPercent + currentWidthPercent / 2,
        topEdgePercent: currentTopPercent - currentWidthPercent / 2,     // 1:1正方形比率
        bottomEdgePercent: currentTopPercent + currentWidthPercent / 2
    };
    
    character.classList.add('resize-mode');
    console.log('✅ タッチ対角固定点拡縮準備完了（%座標）:', window.startElementState);
}

function startFixedPointResize(e, position, type) {
    console.log('🎯 対角固定点拡縮開始（%ベース）:', { position, type });
    
    e.preventDefault();
    e.stopPropagation();
    
    // 確実に状態設定
    window.isDragging = false; // 移動モードを無効化
    window.isResizing = true;  // リサイズモードを有効化
    window.activeHandle = { dataset: { position, type } };
    window.startMousePos = { x: e.clientX, y: e.clientY };
    
    // 現在の%状態を記録（動的取得使用）
    const character = window.character;
    const currentState = character.style.left ? 
        { left: character.style.left, top: character.style.top, width: character.style.width } :
        (window.getDynamicCharacterState ? window.getDynamicCharacterState(character) : {});
    
    const currentLeftPercent = parseFloat(currentState.left);
    const currentTopPercent = parseFloat(currentState.top);
    const currentWidthPercent = parseFloat(currentState.width);
    
    window.startElementState = {
        leftPercent: currentLeftPercent,
        topPercent: currentTopPercent,
        widthPercent: currentWidthPercent,
        // 固定点%座標（対角固定点計算用）
        leftEdgePercent: currentLeftPercent - currentWidthPercent / 2,
        rightEdgePercent: currentLeftPercent + currentWidthPercent / 2,
        topEdgePercent: currentTopPercent - currentWidthPercent / 2,     // 1:1正方形比率
        bottomEdgePercent: currentTopPercent + currentWidthPercent / 2
    };
    
    character.classList.add('resize-mode');
    console.log('✅ 対角固定点拡縮準備完了（%座標）:', window.startElementState);
}

function performResize(deltaX, deltaY) {
    if (!window.activeHandle) return;
    
    const position = window.activeHandle.dataset.position;
    const type = window.activeHandle.dataset.type || 'character';
    
    console.log('🔧 リサイズ実行:', { position, type, deltaX, deltaY });
    
    // Canvas編集削除：キャラクター編集のみ対応
    if (type === 'character' || type === 'corner' || type === 'edge' || type === 'center') {
        performCharacterResize(deltaX, deltaY, position);
    }
}

function performCharacterResize(deltaX, deltaY, position) {
    const character = window.character;
    const activeHandle = window.activeHandle;
    const startElementState = window.startElementState;
    
    if (!character || !activeHandle || !startElementState) return;
    
    const type = activeHandle.dataset.type;
    let newLeftPercent = startElementState.leftPercent;
    let newTopPercent = startElementState.topPercent;
    let newWidthPercent = startElementState.widthPercent;
    
    // マウス移動量を%スケールに変換（感度調整）
    const parentRect = character.parentElement.getBoundingClientRect();
    const scaleFactorX = (deltaX / parentRect.width) * 100;
    const scaleFactorY = (deltaY / parentRect.height) * 100;
    const combinedScaleFactor = (scaleFactorX + scaleFactorY) / 2; // 平均値
    
    // %ベースでのサイズ変更
    const sizeChange = combinedScaleFactor * 0.5; // 感度調整
    newWidthPercent = Math.max(5, Math.min(50, startElementState.widthPercent + sizeChange));
    
    console.log('📊 %ベーススケール計算:', {
        deltaX, deltaY, scaleFactorX, scaleFactorY, combinedScaleFactor,
        sizeChange, newWidthPercent, type, position
    });
    
    if (type === 'center') {
        // 🟠 中心拡縮：位置固定でサイズのみ変更
        // newLeftPercent, newTopPercentはそのまま（位置維持）
        
    } else if (type === 'corner') {
        // 🟢 角ハンドル：対角の角を固定点として拡縮
        const halfSizeChange = (newWidthPercent - startElementState.widthPercent) / 2;
        
        switch (position) {
            case 'nw': // 左上 → 右下を固定点として拡縮
                newLeftPercent = startElementState.rightEdgePercent - newWidthPercent / 2;
                newTopPercent = startElementState.bottomEdgePercent - newWidthPercent / 2;
                break;
            case 'ne': // 右上 → 左下を固定点として拡縮
                newLeftPercent = startElementState.leftEdgePercent + newWidthPercent / 2;
                newTopPercent = startElementState.bottomEdgePercent - newWidthPercent / 2;
                break;
            case 'sw': // 左下 → 右上を固定点として拡縮
                newLeftPercent = startElementState.rightEdgePercent - newWidthPercent / 2;
                newTopPercent = startElementState.topEdgePercent + newWidthPercent / 2;
                break;
            case 'se': // 右下 → 左上を固定点として拡縮
                newLeftPercent = startElementState.leftEdgePercent + newWidthPercent / 2;
                newTopPercent = startElementState.topEdgePercent + newWidthPercent / 2;
                break;
        }
        
    } else if (type === 'edge') {
        // 🔵 辺ハンドル：反対側の辺を固定点として拡縮
        switch (position) {
            case 'n': // 上辺 → 下辺を固定として拡縮
                newTopPercent = startElementState.bottomEdgePercent - newWidthPercent / 2;
                break;
            case 's': // 下辺 → 上辺を固定として拡縮
                newTopPercent = startElementState.topEdgePercent + newWidthPercent / 2;
                break;
            case 'w': // 左辺 → 右辺を固定として拡縮
                newLeftPercent = startElementState.rightEdgePercent - newWidthPercent / 2;
                break;
            case 'e': // 右辺 → 左辺を固定として拡縮
                newLeftPercent = startElementState.leftEdgePercent + newWidthPercent / 2;
                break;
        }
    }
    
    // 🔧 修正: 縦横比維持で%座標スタイル適用
    const newHeightPercent = newWidthPercent / (1/1); // 1:1アスペクト比維持（正方形）
    character.style.left = newLeftPercent + '%';
    character.style.top = newTopPercent + '%';
    character.style.width = newWidthPercent + '%';
    character.style.height = newHeightPercent + '%'; // 縦横比維持
    
    console.log('🎨 縦横比維持%ベースCSS適用:', {
        left: newLeftPercent.toFixed(1) + '%',
        top: newTopPercent.toFixed(1) + '%',
        width: newWidthPercent.toFixed(1) + '%',
        height: newHeightPercent.toFixed(1) + '%',
        aspect_ratio: '1:1 (正方形)',
        calculated_ratio: (newWidthPercent / newHeightPercent).toFixed(2)
    });
    
    if (typeof window.updateCoordinateDisplay === 'function') {
        window.updateCoordinateDisplay();
    }
}

// ========== キャラクター移動処理 ========== //

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

function moveCharacter(deltaX, deltaY) {
    const character = window.character;
    if (!character || !window.startElementState) return;
    
    // マウス移動量をビューポート%に変換
    const parentRect = character.parentElement.getBoundingClientRect();
    const deltaXPercent = (deltaX / parentRect.width) * 100;
    const deltaYPercent = (deltaY / parentRect.height) * 100;
    
    let newLeftPercent = window.startElementState.leftPercent + deltaXPercent;
    let newTopPercent = window.startElementState.topPercent + deltaYPercent;
    
    // 境界制限（%ベース）
    newLeftPercent = Math.max(5, Math.min(95, newLeftPercent));
    newTopPercent = Math.max(5, Math.min(95, newTopPercent));
    
    // %座標でスタイル適用
    character.style.left = newLeftPercent + '%';
    character.style.top = newTopPercent + '%';
    
    console.log('🔧 移動更新（%）:', {
        left: newLeftPercent.toFixed(1) + '%',
        top: newTopPercent.toFixed(1) + '%'
    });
}

// ========== タッチイベント処理 ========== //

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
        performResize(deltaX, deltaY);
    } else if (window.isDragging) {
        console.log('🔧 タッチ移動処理:', { deltaX, deltaY });
        if (window.isCharacterEditMode) {
            moveCharacter(deltaX, deltaY);
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
window.startCharacterEdit = startCharacterEdit;
window.createHandles = createHandles;
window.startFixedPointResize = startFixedPointResize;
window.startFixedPointResizeTouch = startFixedPointResizeTouch;
window.performResize = performResize;
window.performCharacterResize = performCharacterResize;
window.startCharacterDrag = startCharacterDrag;
window.moveCharacter = moveCharacter;
window.handleTouchStart = handleTouchStart;
window.handleTouchMove = handleTouchMove;
window.handleTouchEnd = handleTouchEnd;

console.log('✅ キャラクター編集機能モジュール読み込み完了');