// 🎯 Spine編集システム - UI要素管理モジュール
// 役割: 座標表示、確認パネル、UI更新・表示制御

console.log('🚀 UI要素管理モジュール読み込み開始');

// ========== UI要素作成・管理 ========== //

function createCoordinateDisplay() {
    let coordinateDisplay = document.getElementById('coordinate-display');
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
    
    // グローバル参照を更新
    if (window.coordinateDisplay !== coordinateDisplay) {
        window.coordinateDisplay = coordinateDisplay;
    }
    
    console.log('✅ 座標表示作成完了');
    return coordinateDisplay;
}

function createConfirmPanel() {
    let editConfirmPanel = document.getElementById('edit-confirm-panel');
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
                
                
                <div style="display: flex; gap: 6px; justify-content: center; margin-top: 8px;">
                    <button class="save-btn" onclick="confirmEdit()" style="padding: 4px 8px; background: #4caf50; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 9px;">保存</button>
                    <button class="cancel-btn" onclick="cancelEdit()" style="padding: 4px 8px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 9px;">キャンセル</button>
                </div>
            </div>
        `;
        
        // 🔧 修正: スタイル設定を完全にリセット
        // 画面中央への配置を強制し、bottom/right/transformを明示的に無効化
        const centerX = (window.innerWidth - 160) / 2;
        const centerY = (window.innerHeight - 180) / 2;
        
        editConfirmPanel.style.cssText = `
            position: fixed !important;
            left: ${centerX}px !important;
            top: ${centerY}px !important;
            bottom: unset !important;
            right: unset !important;
            transform: none !important;
            background: white;
            border: 1px solid #ddd;
            border-radius: 6px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            z-index: 2000;
            cursor: move;
            min-width: 160px;
            display: none;
        `;
        document.body.appendChild(editConfirmPanel);
        
        console.log('🔧 確認パネル作成時に画面中央へ強制配置:', { x: centerX, y: centerY });
        
        // 確認パネルのドラッグ機能を設定
        setupConfirmPanelDragging(editConfirmPanel);
    }
    
    // グローバル参照を更新
    if (window.editConfirmPanel !== editConfirmPanel) {
        window.editConfirmPanel = editConfirmPanel;
    }
    
    console.log('✅ 確定パネル作成完了');
    return editConfirmPanel;
}

// 確認パネルドラッグ機能設定
function setupConfirmPanelDragging(editConfirmPanel) {
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
    
    // 🔧 修正：ドラッグ設定時にも強制的に位置をリセット
    // 問題: 何らかの理由でbottomプロパティが設定されている可能性
    setTimeout(() => {
        const screenCenterX = (window.innerWidth - 160) / 2;
        const screenCenterY = (window.innerHeight - 180) / 2;
        
        // すべての位置関連プロパティを強制リセット
        editConfirmPanel.style.position = 'fixed';
        editConfirmPanel.style.left = screenCenterX + 'px';
        editConfirmPanel.style.top = screenCenterY + 'px';
        editConfirmPanel.style.bottom = '';
        editConfirmPanel.style.right = '';
        editConfirmPanel.style.transform = '';
        editConfirmPanel.style.margin = '0';
        
        // CSSクラスによる影響を除去するためにクラスを再設定
        editConfirmPanel.className = 'confirm-panel';
        
        console.log('🔧 確認パネル位置を強制リセット:', { 
            x: screenCenterX, 
            y: screenCenterY,
            appliedStyles: {
                position: editConfirmPanel.style.position,
                left: editConfirmPanel.style.left,
                top: editConfirmPanel.style.top,
                bottom: editConfirmPanel.style.bottom || '(空)',
                right: editConfirmPanel.style.right || '(空)',
                transform: editConfirmPanel.style.transform || '(空)'
            }
        });
    }, 0);
}

// 確認パネル位置リセット（デバッグ用）
function resetConfirmPanelPosition() {
    localStorage.removeItem('confirmPanelPosition');
    const editConfirmPanel = document.getElementById('edit-confirm-panel');
    if (editConfirmPanel) {
        // **🆕 修正：画面中央への確実なリセット**
        const screenCenterX = (window.innerWidth - 160) / 2;
        const screenCenterY = (window.innerHeight - 180) / 2;
        
        editConfirmPanel.style.left = screenCenterX + 'px';
        editConfirmPanel.style.top = screenCenterY + 'px';
        editConfirmPanel.style.bottom = ''; // bottom固定を完全に削除
        editConfirmPanel.style.transform = 'none';
        
        console.log('🔄 確認パネル位置を画面中央にリセット:', { 
            x: screenCenterX, 
            y: screenCenterY 
        });
    }
}

// 確認パネル位置デバッグ情報表示（デバッグ用）
function debugConfirmPanelPosition() {
    const editConfirmPanel = document.getElementById('edit-confirm-panel');
    if (!editConfirmPanel) {
        console.log('❌ 確認パネルが存在しません');
        return;
    }
    
    const rect = editConfirmPanel.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(editConfirmPanel);
    const savedPosition = localStorage.getItem('confirmPanelPosition');
    
    console.log('🔍 確認パネル位置デバッグ情報:', {
        dom_rect: {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
        },
        inline_style: {
            left: editConfirmPanel.style.left,
            top: editConfirmPanel.style.top,
            bottom: editConfirmPanel.style.bottom,
            transform: editConfirmPanel.style.transform
        },
        computed_style: {
            left: computedStyle.left,
            top: computedStyle.top,
            bottom: computedStyle.bottom,
            transform: computedStyle.transform
        },
        saved_position: savedPosition ? JSON.parse(savedPosition) : 'なし',
        display: computedStyle.display
    });
    
    // 🆕 問題診断用の追加情報
    const problems = [];
    if (computedStyle.bottom !== 'auto' && computedStyle.bottom !== '') {
        problems.push(`⚠️ bottom値が設定されています: ${computedStyle.bottom}`);
    }
    if (rect.bottom > window.innerHeight - 50) {
        problems.push(`⚠️ パネルが画面下部に寄っています (bottom: ${rect.bottom}, 画面高さ: ${window.innerHeight})`);
    }
    if (computedStyle.transform !== 'none') {
        problems.push(`⚠️ transform値が設定されています: ${computedStyle.transform}`);
    }
    
    if (problems.length > 0) {
        console.warn('🚨 検出された問題:', problems);
    } else {
        console.log('✅ 位置設定に問題はありません');
    }
}

// ========== UI表示・更新機能 ========== //

function showConfirmPanel() {
    const editConfirmPanel = document.getElementById('edit-confirm-panel') || window.editConfirmPanel;
    if (editConfirmPanel) {
        // 🔧 修正：表示前にすべてのスタイルを完全リセット
        const screenCenterX = (window.innerWidth - 160) / 2;
        const screenCenterY = (window.innerHeight - 180) / 2;
        
        // displayを変更する前にスタイルを完全に設定
        editConfirmPanel.style.cssText = `
            position: fixed !important;
            left: ${screenCenterX}px !important;
            top: ${screenCenterY}px !important;
            bottom: unset !important;
            right: unset !important;
            transform: none !important;
            margin: 0 !important;
            background: white;
            border: 1px solid #ddd;
            border-radius: 6px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            z-index: 2000;
            cursor: move;
            min-width: 160px;
            display: block;
        `;
        
        console.log('🔧 確認パネル表示時に完全なスタイルリセット実行:', { 
            x: screenCenterX, 
            y: screenCenterY,
            cssText: editConfirmPanel.style.cssText
        });
        
        // 遅延実行でも確実に位置を固定
        setTimeout(() => {
            if (editConfirmPanel && editConfirmPanel.style.display === 'block') {
                const computedStyle = window.getComputedStyle(editConfirmPanel);
                if (computedStyle.bottom !== 'auto' && computedStyle.bottom !== '') {
                    console.warn('⚠️ bottomプロパティが再設定されています。強制的に削除します。');
                    editConfirmPanel.style.bottom = '';
                    editConfirmPanel.style.top = screenCenterY + 'px';
                }
            }
        }, 100);
        
        console.log('✅ 確認パネル表示');
    }
}

function hideConfirmPanel() {
    const editConfirmPanel = document.getElementById('edit-confirm-panel') || window.editConfirmPanel;
    if (editConfirmPanel) {
        editConfirmPanel.style.display = 'none';
        console.log('✅ 確認パネル非表示');
    }
}

function updateCoordinateDisplay() {
    const coordinateDisplay = document.getElementById('coordinate-display') || window.coordinateDisplay;
    if (!coordinateDisplay) return;
    
    coordinateDisplay.style.display = 'block';
    
    const isCharacterEditMode = window.isCharacterEditMode;
    const character = window.character || document.querySelector('#purattokun-canvas') || 
                     document.querySelector('canvas[data-spine-character]') ||
                     document.querySelector('#purattokun-fallback');
    
    if (isCharacterEditMode && character) {
        // 動的取得を使用（固定値に依存しない）
        const currentState = character.style.left ? 
            { left: character.style.left, top: character.style.top, width: character.style.width } :
            (window.getDynamicCharacterState ? window.getDynamicCharacterState(character) : {});
            
        coordinateDisplay.textContent = `キャラクター: ${currentState.left || 'N/A'}, ${currentState.top || 'N/A'}, W=${currentState.width || 'N/A'}`;
    }
}

function updateUI() {
    // ボタンの状態更新（キャラクター編集のみ）
    const charBtn = document.getElementById('edit-character-btn');
    const isCharacterEditMode = window.isCharacterEditMode;
    
    if (charBtn) {
        charBtn.textContent = isCharacterEditMode ? 'キャラクター編集中...' : 'キャラクター編集';
        charBtn.style.background = isCharacterEditMode ? '#4caf50' : '#ff6b6b';
    }
}

// ========== グローバル関数エクスポート（互換性維持） ========== //

// 関数をwindowオブジェクトに追加（互換性維持）
window.createCoordinateDisplay = createCoordinateDisplay;
window.createConfirmPanel = createConfirmPanel;
window.setupConfirmPanelDragging = setupConfirmPanelDragging;
window.resetConfirmPanelPosition = resetConfirmPanelPosition;
window.debugConfirmPanelPosition = debugConfirmPanelPosition;
window.showConfirmPanel = showConfirmPanel;
window.hideConfirmPanel = hideConfirmPanel;
window.updateCoordinateDisplay = updateCoordinateDisplay;
window.updateUI = updateUI;

console.log('✅ UI要素管理モジュール読み込み完了');