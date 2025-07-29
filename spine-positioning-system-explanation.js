// 🎯 Spine編集システム v2.0 - クリーンリビルド版
// シンプル・保守性・動作確実性を重視した設計

console.log('🚀 Spine編集システム v2.0 読み込み開始');

// ========== 基本設定・グローバル変数 ========== //

// 編集モード制御
let isCharacterEditMode = false;
// Canvas編集モード削除

// 操作状態
let isDragging = false;
let isResizing = false;
let activeHandle = null;

// マウス操作記録
let startMousePos = { x: 0, y: 0 };
let startElementState = {};

// DOM要素参照
let character = null;
// characterCanvas削除：不要
let editConfirmPanel = null;
let coordinateDisplay = null;

// 保存状態（localStorage用・%座標系統一・動的CSS値取得）
let savedState = {
    character: { left: null, top: null, width: null }
    // ☝️ 初期化時に実際のCSS値から動的に取得される
};

console.log('✅ v2.0 基本設定完了');

// ========== 汎用性システム：動的CSS値取得 ========== //

function getDynamicCharacterState(character) {
    console.log('🔍 動的CSS値取得開始');
    
    if (!character) {
        console.error('❌ character要素がnullです');
        // 🔧 汎用性フォールバック（シーンに依存しない中央配置）
        console.warn('⚠️ フォールバック値を使用: 中央配置の汎用値');
        return { left: '50%', top: '50%', width: '20%' }; // どのシーンでも安全な中央配置
    }
    
    // 🎯 getComputedStyleで実際のブラウザ計算値を取得
    const computedStyle = window.getComputedStyle(character);
    const parentRect = character.parentElement.getBoundingClientRect();
    
    // px値を%に変換
    const computedLeftPx = parseFloat(computedStyle.left);
    const computedTopPx = parseFloat(computedStyle.top);
    const computedWidthPx = parseFloat(computedStyle.width);
    
    const computedLeftPercent = ((computedLeftPx / parentRect.width) * 100).toFixed(1);
    const computedTopPercent = ((computedTopPx / parentRect.height) * 100).toFixed(1);
    const computedWidthPercent = ((computedWidthPx / parentRect.width) * 100).toFixed(1);
    
    const dynamicState = {
        left: computedLeftPercent + '%',
        top: computedTopPercent + '%',
        width: computedWidthPercent + '%'
    };
    
    console.log('✅ 動的CSS値取得完了:', {
        computed_px: {
            left: computedLeftPx + 'px',
            top: computedTopPx + 'px', 
            width: computedWidthPx + 'px'
        },
        computed_percent: dynamicState,
        element: character.tagName + (character.id ? '#' + character.id : '')
    });
    
    return dynamicState;
}

console.log('✅ v2.0 動的取得システム準備完了');

// ========== DOM初期化システム ========== //

function initializeDOMElements() {
    console.log('🔧 DOM初期化開始');
    
    // キャラクター要素を取得
    character = document.querySelector('#purattokun-canvas') || 
               document.querySelector('canvas[data-spine-character]') ||
               document.querySelector('#purattokun-fallback');
    
    if (!character) {
        console.error('❌ キャラクター要素が見つかりません');
        return false;
    }
    
    console.log('✅ キャラクター要素取得:', character.tagName);

    // Canvas要素の場合、ラッパーを作成
    if (character.tagName === 'CANVAS') {
        console.log('⚠️ Canvas要素検出: ラッパーを作成します');
        
        // 既存のラッパーがあるかチェック
        let existingWrapper = character.parentElement;
        if (existingWrapper && existingWrapper.classList.contains('character-wrapper')) {
            console.log('🔄 既存のラッパーを再利用します');
            character = existingWrapper;
        } else {
            // 🎯 修正: CSS位置値を直接取得（transform前の値）
            const computedStyle = window.getComputedStyle(character);
            const parentRect = character.parentElement.getBoundingClientRect();
            const canvasRect = character.getBoundingClientRect();
            
            console.log('🔍 Canvas要素の現在の状態:', {
                element: character.tagName + (character.id ? '#' + character.id : ''),
                style: {
                    left: character.style.left || 'not set',
                    top: character.style.top || 'not set',
                    transform: character.style.transform || 'not set',
                    width: character.style.width || 'not set'
                },
                computed: {
                    left: computedStyle.left,
                    top: computedStyle.top,
                    transform: computedStyle.transform,
                    width: computedStyle.width
                },
                rect: {
                    left: canvasRect.left,
                    top: canvasRect.top,
                    width: canvasRect.width,
                    height: canvasRect.height
                }
            });
            
            // CSS position値を取得（transform適用前の値）
            const cssLeftPx = parseFloat(computedStyle.left);
            const cssTopPx = parseFloat(computedStyle.top);
            const cssWidthPx = canvasRect.width;  // 実際の表示サイズ
            const cssHeightPx = canvasRect.height; // 実際の表示サイズ
            
            // transformの中心点補正を計算
            const hasTransform = computedStyle.transform !== 'none' && computedStyle.transform !== '';
            let adjustedLeftPx = cssLeftPx;
            let adjustedTopPx = cssTopPx;
            
            // transformの検出（matrix形式の値を解析）
            const transformStr = computedStyle.transform;
            let needsCenterCorrection = false;
            
            // style属性から元のtransform値を確認
            if (character.style.transform && character.style.transform.includes('translate(-50%, -50%)')) {
                needsCenterCorrection = true;
                console.log('✅ style.transformから translate(-50%, -50%) を検出');
            } else if (hasTransform && transformStr.includes('matrix')) {
                // matrix値から実際の変換を解析
                const matrixMatch = transformStr.match(/matrix\(([\d\s,.-]+)\)/);
                if (matrixMatch) {
                    const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()));
                    const translateX = values[4]; // matrix の5番目の値がX移動
                    const translateY = values[5]; // matrix の6番目の値がY移動
                    
                    // translateの値が要素サイズの約半分なら、translate(-50%, -50%)相当
                    if (Math.abs(translateX) > cssWidthPx * 0.4 && Math.abs(translateX) < cssWidthPx * 0.6 &&
                        Math.abs(translateY) > cssHeightPx * 0.4 && Math.abs(translateY) < cssHeightPx * 0.6) {
                        needsCenterCorrection = true;
                        console.log('✅ matrixから translate(-50%, -50%) 相当を検出', {
                            translateX, translateY,
                            halfWidth: cssWidthPx / 2,
                            halfHeight: cssHeightPx / 2
                        });
                    }
                }
            }
            
            if (needsCenterCorrection) {
                // translate(-50%, -50%)がある場合、左上基準の位置に変換
                // CSS位置は中心点なので、幅/高さの半分を引く
                adjustedLeftPx = cssLeftPx - (cssWidthPx / 2);
                adjustedTopPx = cssTopPx - (cssHeightPx / 2);
                console.log('🔄 Transform補正適用:', {
                    original: { left: cssLeftPx, top: cssTopPx },
                    adjusted: { left: adjustedLeftPx, top: adjustedTopPx },
                    size: { width: cssWidthPx, height: cssHeightPx },
                    transform: transformStr
                });
            } else {
                console.log('ℹ️ Transform補正なし:', {
                    hasTransform,
                    needsCenterCorrection,
                    transform: transformStr
                });
            }
            
            const wrapperLeftPercent = ((adjustedLeftPx / parentRect.width) * 100).toFixed(1);
            const wrapperTopPercent = ((adjustedTopPx / parentRect.height) * 100).toFixed(1);
            const wrapperWidthPercent = ((cssWidthPx / parentRect.width) * 100).toFixed(1);
            const wrapperHeightPercent = ((cssHeightPx / parentRect.height) * 100).toFixed(1);
            
            console.log("🔧 ラッパー位置計算（CSS基準・transform補正済み）:", {
                css_position: { 
                    left: computedStyle.left, 
                    top: computedStyle.top,
                    transform: computedStyle.transform
                },
                wrapper_position: {
                    left: wrapperLeftPercent + "%",
                    top: wrapperTopPercent + "%",
                    width: wrapperWidthPercent + "%",
                    height: wrapperHeightPercent + "%"
                }
            });
            
            const characterWrapper = document.createElement('div');
            characterWrapper.className = 'character-wrapper demo-character';
            characterWrapper.style.cssText = `
                position: absolute;
                left: ${wrapperLeftPercent}%;
                top: ${wrapperTopPercent}%;
                width: ${wrapperWidthPercent}%;
                height: ${wrapperHeightPercent}%;
                cursor: move;
                border: 2px dashed rgba(255, 107, 107, 0.3);
                border-radius: 8px;
                transition: border-color 0.3s;
            `;
            
            // Canvas要素をラッパーで包む
            const parent = character.parentElement;
            parent.insertBefore(characterWrapper, character);
            characterWrapper.appendChild(character);
            
            // Canvas要素の位置スタイルをリセット（ラッパー内で中央配置）
            character.style.position = 'absolute';
            character.style.left = '50%';
            character.style.top = '50%';
            character.style.transform = 'translate(-50%, -50%)';
            character.style.width = '100%';
            character.style.height = '100%';
            
            // characterをラッパーに更新
            character = characterWrapper;
            
            console.log('✅ Canvas要素ラッパー作成完了');
        }
    }
    
    // 保存状態読み込み
    loadSavedState();
    
    // UI要素作成
    createCoordinateDisplay();
    createConfirmPanel();
    
    // 初期状態設定（character要素が確実に取得された後に実行）
    if (character) {
        setupCharacterInitialState();
    } else {
        console.warn('⚠️ character要素がnullのため、初期状態設定をスキップ');
    }
    
    console.log('✅ DOM初期化完了');
    return true;
}

// 🗑️ Canvas作成削除：不要（直接character要素を編集）

function setupCharacterInitialState() {
    console.log('🔧 キャラクター初期状態設定開始（動的取得使用）');
    
    // character要素の存在確認
    if (!character) {
        console.error('❌ setupCharacterInitialState: character要素がnullです');
        return;
    }
    
    // 🎯 動的取得関数を使用
    const dynamicState = getDynamicCharacterState(character);
    
    console.log('📊 初期状態分析:', {
        dynamic_state: dynamicState,
        current_style: {
            left: character.style.left,
            top: character.style.top,
            width: character.style.width
        },
        saved_state: savedState.character
    });
    
    // savedStateが未設定の場合は動的取得結果を使用
    if (!savedState.character.left) {
        savedState.character = dynamicState;
        console.log('✅ savedState初期化完了:', savedState.character);
    }
    
    // インラインスタイルがない場合のみ、動的取得値で設定
    if (!character.style.left) {
        character.style.left = dynamicState.left;
        console.log('✅ left設定:', dynamicState.left);
    }
    if (!character.style.top) {
        character.style.top = dynamicState.top;
        console.log('✅ top設定:', dynamicState.top);
    }
    if (!character.style.width) {
        character.style.width = dynamicState.width;
        console.log('✅ width設定:', dynamicState.width);
    }
    
    // 基本設定は常に適用
    character.style.position = 'absolute';
    // 座標系統一: 左上基準に統一のためtransform削除
    
    console.log('✅ キャラクター初期状態設定完了（動的取得ベース）:', {
        left: character.style.left,
        top: character.style.top,
        width: character.style.width
    });
}

function createCoordinateDisplay() {
    coordinateDisplay = document.getElementById('coordinate-display');
    if (!coordinateDisplay) {
        coordinateDisplay = document.createElement('div');
        coordinateDisplay.id = 'coordinate-display';
        coordinateDisplay.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            z-index: 1000;
            display: none;
        `;
        document.body.appendChild(coordinateDisplay);
    }
    console.log('✅ 座標表示作成完了');
}

function createConfirmPanel() {
    editConfirmPanel = document.getElementById('edit-confirm-panel');
    if (!editConfirmPanel) {
        editConfirmPanel = document.createElement('div');
        editConfirmPanel.id = 'edit-confirm-panel';
        editConfirmPanel.className = 'confirm-panel';
        editConfirmPanel.innerHTML = `
            <div id="confirm-panel-header" style="background: #f8f9fa; padding: 4px 8px; border-bottom: 1px solid #eee; border-radius: 5px 5px 0 0; cursor: move; text-align: center;">
                <span style="font-size: 10px; font-weight: bold; color: #666;">📝 確認</span>
            </div>
            <div style="text-align: center; padding: 8px;">
                <p style="margin: 0 0 8px 0; font-size: 10px; color: #333;">編集を確定しますか？</p>
                <div style="display: flex; gap: 6px; justify-content: center;">
                    <button class="save-btn" onclick="confirmEdit()" style="padding: 4px 8px; background: #4caf50; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 9px;">保存</button>
                    <button class="cancel-btn" onclick="cancelEdit()" style="padding: 4px 8px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 9px;">キャンセル</button>
                </div>
            </div>
        `;
        editConfirmPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 1px solid #ddd;
            border-radius: 6px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            z-index: 2000;
            cursor: move;
            min-width: 140px;
            display: none;
        `;
        document.body.appendChild(editConfirmPanel);
        
        // 確認パネルのドラッグ機能を設定
        setupConfirmPanelDragging();
    }
    console.log('✅ 確定パネル作成完了');
}

// 確認パネルドラッグ機能設定
function setupConfirmPanelDragging() {
    const confirmHeader = document.getElementById('confirm-panel-header');
    
    if (!confirmHeader || !editConfirmPanel) return;
    
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    // ドラッグ開始
    confirmHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = editConfirmPanel.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        
        editConfirmPanel.style.transition = 'none';
        editConfirmPanel.style.transform = 'none'; // translateX(-50%)を無効化
        document.addEventListener('mousemove', handleConfirmDrag);
        document.addEventListener('mouseup', handleConfirmDragEnd);
        e.preventDefault();
    });
    
    // ドラッグ中
    function handleConfirmDrag(e) {
        if (!isDragging) return;
        
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // 画面端からはみ出さないよう制限
        const maxX = window.innerWidth - editConfirmPanel.offsetWidth;
        const maxY = window.innerHeight - editConfirmPanel.offsetHeight;
        
        const boundedX = Math.max(0, Math.min(newX, maxX));
        const boundedY = Math.max(0, Math.min(newY, maxY));
        
        editConfirmPanel.style.left = boundedX + 'px';
        editConfirmPanel.style.top = boundedY + 'px';
    }
    
    // ドラッグ終了
    function handleConfirmDragEnd() {
        isDragging = false;
        editConfirmPanel.style.transition = '';
        document.removeEventListener('mousemove', handleConfirmDrag);
        document.removeEventListener('mouseup', handleConfirmDragEnd);
        
        // 位置を記憶（localStorage）
        const rect = editConfirmPanel.getBoundingClientRect();
        localStorage.setItem('confirmPanelPosition', JSON.stringify({
            x: rect.left,
            y: rect.top
        }));
    }
    
    // 保存された位置を復元（画面内制限付き）
    const savedPosition = localStorage.getItem('confirmPanelPosition');
    if (savedPosition) {
        const pos = JSON.parse(savedPosition);
        
        // 画面内に収まるよう調整
        const maxX = window.innerWidth - 140; // パネル最小幅を考慮
        const maxY = window.innerHeight - 100; // パネル高さを考慮
        
        const boundedX = Math.max(0, Math.min(pos.x, maxX));
        const boundedY = Math.max(0, Math.min(pos.y, maxY));
        
        editConfirmPanel.style.left = boundedX + 'px';
        editConfirmPanel.style.top = boundedY + 'px';
        editConfirmPanel.style.transform = 'none';
        
        console.log('📍 確認パネル位置復元:', { saved: pos, adjusted: { x: boundedX, y: boundedY } });
    }
}

// 確認パネル位置リセット（デバッグ用）
function resetConfirmPanelPosition() {
    localStorage.removeItem('confirmPanelPosition');
    if (editConfirmPanel) {
        editConfirmPanel.style.left = '50%';
        editConfirmPanel.style.top = '50%';
        editConfirmPanel.style.bottom = '';
        editConfirmPanel.style.transform = 'translate(-50%, -50%)';
        console.log('🔄 確認パネル位置をリセットしました');
    }
}

// ========== 外部インターフェース ========== //

function startCharacterEdit() {
    console.log('🎯 キャラクター編集モード開始（計算値ベース位置保持）');
    
    // DOM初期化を先に実行
    if (!initializeDOMElements()) {
        console.error('❌ DOM初期化失敗');
        return;
    }
    
    // character要素の存在確認
    if (!character) {
        console.error('❌ character要素が見つかりません');
        return;
    }
    
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
        const dynamicState = getDynamicCharacterState(character);
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
    
    isCharacterEditMode = true;
    character.classList.add('edit-mode');
    
    // ハンドル作成
    createHandles();
    
    // イベントリスナー設定
    setupEventListeners();
    
    // UI更新
    updateUI();
    showConfirmPanel();
    
    console.log('✅ キャラクター編集モード有効化完了（計算値ベース保持）');
}

// 🗑️ Canvas編集機能削除：表示範囲編集は不要

// ========== コア機能：移動・保存・復元 ========== //

function setupEventListeners() {
    console.log('🔧 イベントリスナー設定開始');
    
    // キャラクター移動イベント
    if (isCharacterEditMode && character) {
        character.addEventListener('mousedown', startCharacterDrag);
    }
    
    // Canvas移動イベント削除：不要
    
    // グローバルイベント
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    console.log('✅ イベントリスナー設定完了');
}

function startCharacterDrag(e) {
    // ハンドル判定を厳密に行う
    if (!isCharacterEditMode || 
        e.target.classList.contains('handle') || 
        e.target.closest('.handle') ||
        isResizing) {
        console.log('🚫 character移動をスキップ:', {
            isCharacterEditMode,
            isHandle: e.target.classList.contains('handle'),
            isResizing
        });
        return;
    }
    
    console.log('🎯 character移動開始（%ベース）');
    e.preventDefault();
    isDragging = true;
    startMousePos = { x: e.clientX, y: e.clientY };
    
    // 現在の%位置を記録
    const currentState = character.style.left ? 
        { left: character.style.left, top: character.style.top } :
        getDynamicCharacterState(character);
    
    startElementState = {
        leftPercent: parseFloat(currentState.left),
        topPercent: parseFloat(currentState.top)
    };
    
    updateCoordinateDisplay();
    console.log('🎯 キャラクタードラッグ開始（%座標）:', startElementState);
}

// 🗑️ Canvas移動削除：不要

function handleMouseMove(e) {
    if (!isDragging && !isResizing) return;
    
    const deltaX = e.clientX - startMousePos.x;
    const deltaY = e.clientY - startMousePos.y;
    
    // リサイズを優先処理（ハンドル操作）
    if (isResizing) {
        console.log('🔧 リサイズ処理:', { deltaX, deltaY });
        performResize(deltaX, deltaY);
    } else if (isDragging) {
        console.log('🔧 移動処理:', { deltaX, deltaY });
        if (isCharacterEditMode) {
            moveCharacter(deltaX, deltaY);
        }
    }
    
    updateCoordinateDisplay();
}

function moveCharacter(deltaX, deltaY) {
    // マウス移動量をビューポート%に変換
    const parentRect = character.parentElement.getBoundingClientRect();
    const deltaXPercent = (deltaX / parentRect.width) * 100;
    const deltaYPercent = (deltaY / parentRect.height) * 100;
    
    let newLeftPercent = startElementState.leftPercent + deltaXPercent;
    let newTopPercent = startElementState.topPercent + deltaYPercent;
    
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

// 🗑️ Canvas移動削除：不要

function handleMouseUp() {
    if (isDragging || isResizing) {
        console.log('🔄 操作終了:', { isDragging, isResizing });
        
        // 状態リセット
        isDragging = false;
        isResizing = false;
        activeHandle = null;
        
        // CSS状態リセット
        if (character) {
            character.classList.remove('dragging', 'resize-mode');
        }
        // characterCanvas削除済み：不要
        
        console.log('✅ 状態リセット完了');
    }
}

function updateCoordinateDisplay() {
    if (!coordinateDisplay) return;
    
    coordinateDisplay.style.display = 'block';
    
    if (isCharacterEditMode && character) {
        // 🎯 動的取得を使用（固定値に依存しない）
        const currentState = character.style.left ? 
            { left: character.style.left, top: character.style.top, width: character.style.width } :
            getDynamicCharacterState(character);
            
        coordinateDisplay.textContent = `キャラクター: ${currentState.left}, ${currentState.top}, W=${currentState.width}`;
    }
}

function updateUI() {
    // ボタンの状態更新（キャラクター編集のみ）
    const charBtn = document.getElementById('edit-character-btn');
    
    if (charBtn) {
        charBtn.textContent = isCharacterEditMode ? 'キャラクター編集中...' : 'キャラクター編集';
        charBtn.style.background = isCharacterEditMode ? '#4caf50' : '#ff6b6b';
    }
}

function showConfirmPanel() {
    if (editConfirmPanel) {
        editConfirmPanel.style.display = 'block';
        
        // 表示時に画面内に収まっているか確認
        setTimeout(() => {
            const rect = editConfirmPanel.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;
            
            let needsAdjustment = false;
            let newX = rect.left;
            let newY = rect.top;
            
            // 画面外にはみ出している場合は画面内に移動
            if (rect.left < 0) {
                newX = 10;
                needsAdjustment = true;
            } else if (rect.left > maxX) {
                newX = maxX - 10;
                needsAdjustment = true;
            }
            
            if (rect.top < 0) {
                newY = 10;
                needsAdjustment = true;
            } else if (rect.top > maxY) {
                newY = maxY - 10;
                needsAdjustment = true;
            }
            
            if (needsAdjustment) {
                editConfirmPanel.style.left = newX + 'px';
                editConfirmPanel.style.top = newY + 'px';
                editConfirmPanel.style.transform = 'none';
                console.log('📍 確認パネル位置調整:', { from: { x: rect.left, y: rect.top }, to: { x: newX, y: newY } });
            }
        }, 10); // 少し遅延して位置確認
        
        console.log('✅ 確認パネル表示');
    }
}

function hideConfirmPanel() {
    if (editConfirmPanel) {
        editConfirmPanel.style.display = 'none';
        console.log('✅ 確認パネル非表示');
    }
}

// ========== 保存・復元システム ========== //

function loadSavedState() {
    try {
        const saved = localStorage.getItem('spine-positioning-state');
        if (saved) {
            const loadedState = JSON.parse(saved);
            
            console.log('📊 localStorage読み込み分析:', {
                loaded: loadedState,
                current_state: savedState
            });
            
            // 🔧 保存データの検証（px単位は%に統一）
            if (loadedState.character) {
                // px単位の場合は%に統一が必要（ただし具体的な変換は動的取得に委ねる）
                if (loadedState.character.width && loadedState.character.width.includes('px')) {
                    console.log('🔧 px単位検出・動的取得で再計算が必要:', loadedState.character.width);
                    // 動的取得を優先するため、px値はクリア
                    loadedState.character = null;
                }
            }
            
            if (loadedState.character) {
                savedState = { ...savedState, ...loadedState };
                console.log('✅ 保存状態読み込み完了:', savedState);
            } else {
                console.log('📝 保存データ無効・動的取得を実行');
                // character要素から動的取得
                if (character) {
                    savedState.character = getDynamicCharacterState(character);
                    console.log('✅ 動的取得完了:', savedState);
                }
            }
        } else {
            console.log('📝 localStorage未保存・動的取得を実行');
            // character要素から動的取得
            if (character) {
                savedState.character = getDynamicCharacterState(character);
                console.log('✅ 動的取得完了:', savedState);
            }
        }
    } catch (e) {
        console.warn('⚠️ localStorage読み込みエラー:', e);
    }
}

function confirmEdit() {
    console.log('💾 編集内容保存開始（%ベース）');
    
    // 現在の%状態を保存
    if (character) {
        savedState.character = {
            left: character.style.left,     // 例: "35%"
            top: character.style.top,       // 例: "75%"
            width: character.style.width    // 例: "25%"
        };
    }
    
    // localStorage保存
    try {
        localStorage.setItem('spine-positioning-state', JSON.stringify(savedState));
        console.log('✅ 保存完了（%座標）:', savedState);
        
        if (coordinateDisplay) {
            coordinateDisplay.textContent = '✅ 設定を保存しました（%座標）';
            setTimeout(() => {
                coordinateDisplay.style.display = 'none';
            }, 2000);
        }
    } catch (e) {
        console.error('❌ 保存エラー:', e);
    }
    
    endEditMode();
}

function cancelEdit() {
    console.log('🔄 編集キャンセル - リロード実行');
    
    if (coordinateDisplay) {
        coordinateDisplay.textContent = '🔄 前回保存した状態に戻しています...';
    }
    
    setTimeout(() => {
        location.reload();
    }, 500);
}

function endEditMode() {
    console.log('🔄 編集モード終了');
    
    endCharacterEditMode();
    hideConfirmPanel();
    
    if (coordinateDisplay) {
        coordinateDisplay.style.display = 'none';
    }
}

function endCharacterEditMode() {
    isCharacterEditMode = false;
    
    if (character) {
        character.classList.remove('edit-mode');
        
        // ハンドル削除
        const handles = character.querySelectorAll('.handle');
        handles.forEach(handle => handle.remove());
    }
    
    updateUI();
    console.log('✅ キャラクター編集モード終了');
}

// 🗑️ Canvas編集モード終了関数削除：不要

// ========== シンプル・ハンドルシステム ========== //

function createHandles() {
    console.log('🔧 キャラクターハンドル作成開始');
    
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
        
        // クリックイベント（対角固定点拡縮システム）
        handle.addEventListener('mousedown', (e) => {
            console.log('🎯 ハンドルmousedown:', handleDef.pos, handleDef.type);
            e.stopPropagation();
            e.preventDefault();
            // character要素のイベントを無効化
            isDragging = false;
            isResizing = false;
            startFixedPointResize(e, handleDef.pos, handleDef.type);
        }, true); // キャプチャフェーズで実行
        
        character.appendChild(handle);
    });
    
    console.log('✅ キャラクターハンドル作成完了');
}

// 🗑️ Canvasハンドル作成削除：不要

function startFixedPointResize(e, position, type) {
    console.log('🎯 対角固定点拡縮開始（%ベース）:', { position, type });
    
    e.preventDefault();
    e.stopPropagation();
    
    // 確実に状態設定
    isDragging = false; // 移動モードを無効化
    isResizing = true;  // リサイズモードを有効化
    activeHandle = { dataset: { position, type } };
    startMousePos = { x: e.clientX, y: e.clientY };
    
    // 現在の%状態を記録（動的取得使用）
    const currentState = character.style.left ? 
        { left: character.style.left, top: character.style.top, width: character.style.width } :
        getDynamicCharacterState(character);
    
    const currentLeftPercent = parseFloat(currentState.left);
    const currentTopPercent = parseFloat(currentState.top);
    const currentWidthPercent = parseFloat(currentState.width);
    
    startElementState = {
        leftPercent: currentLeftPercent,
        topPercent: currentTopPercent,
        widthPercent: currentWidthPercent,
        // 固定点%座標（対角固定点計算用）
        leftEdgePercent: currentLeftPercent - currentWidthPercent / 2,
        rightEdgePercent: currentLeftPercent + currentWidthPercent / 2,
        topEdgePercent: currentTopPercent - currentWidthPercent / 2,     // 正方形比率想定
        bottomEdgePercent: currentTopPercent + currentWidthPercent / 2
    };
    
    character.classList.add('resize-mode');
    console.log('✅ 対角固定点拡縮準備完了（%座標）:', startElementState);
}

// 🗑️ Canvas拡縮削除：不要

function performResize(deltaX, deltaY) {
    if (!activeHandle) return;
    
    const position = activeHandle.dataset.position;
    const type = activeHandle.dataset.type || 'character';
    
    console.log('🔧 リサイズ実行:', { position, type, deltaX, deltaY });
    
    // Canvas編集削除：キャラクター編集のみ対応
    if (type === 'character' || type === 'corner' || type === 'edge' || type === 'center') {
        performCharacterResize(deltaX, deltaY, position);
    }
}

function performCharacterResize(deltaX, deltaY, position) {
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
    
    // %座標でスタイル適用
    character.style.left = newLeftPercent + '%';
    character.style.top = newTopPercent + '%';
    character.style.width = newWidthPercent + '%';
    
    console.log('🎨 %ベースCSS適用:', {
        left: newLeftPercent.toFixed(1) + '%',
        top: newTopPercent.toFixed(1) + '%',
        width: newWidthPercent.toFixed(1) + '%'
    });
    
    updateCoordinateDisplay();
}

// 🗑️ Canvas拡縮削除：不要

console.log('🎯 Spine編集システム v2.0 読み込み完了 - 全機能実装済み');