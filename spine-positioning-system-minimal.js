// 🎯 Spine編集システム v3.0 - 最小限実装版
// 完全リセット・シンプル設計・確実動作

console.log('🚀 Spine編集システム v3.0 (最小限実装版) 読み込み開始');

// ========== グローバル変数 ========== //
let isEditMode = false;
let isDragging = false;
let character = null;
let startMousePos = { x: 0, y: 0 };
let startElementPos = { left: 0, top: 0 };

// ========== 初期化 ========== //
function initializeMinimalEditSystem() {
    console.log('🔧 最小限編集システム初期化開始');
    
    // キャラクター要素を取得
    character = document.querySelector('#purattokun-canvas');
    if (!character) {
        console.error('❌ キャラクター要素が見つかりません');
        return;
    }
    
    // 元のサイズを保存
    const computedStyle = window.getComputedStyle(character);
    const originalWidth = computedStyle.width;
    const originalHeight = computedStyle.height;
    console.log('📐 元のサイズ:', { width: originalWidth, height: originalHeight });
    
    // サイズが設定されていない場合はデフォルト値を設定
    if (!character.style.width) {
        character.style.width = originalWidth || '120px';
    }
    if (!character.style.height) {
        character.style.height = originalHeight || '120px';
    }
    
    // 編集ボタンの作成
    createEditButton();
    
    console.log('✅ 最小限編集システム初期化完了');
}

// ========== UI作成 ========== //
function createEditButton() {
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
}

// ========== 編集モード切り替え ========== //
function toggleEditMode() {
    isEditMode = !isEditMode;
    const button = document.getElementById('minimal-edit-button');
    
    if (isEditMode) {
        console.log('📝 編集モード開始');
        button.textContent = '編集終了';
        button.style.background = '#4CAF50';
        
        // キャラクターを編集可能にする
        character.style.cursor = 'move';
        character.addEventListener('mousedown', startDrag);
    } else {
        console.log('✅ 編集モード終了');
        button.textContent = '位置編集';
        button.style.background = '#ff6b6b';
        
        // 編集機能を無効化
        character.style.cursor = 'default';
        character.removeEventListener('mousedown', startDrag);
        
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
    
    // 要素の現在位置を取得（%単位）
    const rect = character.getBoundingClientRect();
    const parentRect = character.parentElement.getBoundingClientRect();
    
    startElementPos = {
        left: ((rect.left - parentRect.left) / parentRect.width) * 100,
        top: ((rect.top - parentRect.top) / parentRect.height) * 100
    };
    
    // グローバルイベントを設定
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', endDrag);
    
    console.log('🎯 ドラッグ開始:', startElementPos);
}

function handleDrag(e) {
    if (!isDragging) return;
    
    // マウスの移動量を計算
    const deltaX = e.clientX - startMousePos.x;
    const deltaY = e.clientY - startMousePos.y;
    
    // 親要素のサイズを取得
    const parentRect = character.parentElement.getBoundingClientRect();
    
    // 移動量を%に変換
    const deltaXPercent = (deltaX / parentRect.width) * 100;
    const deltaYPercent = (deltaY / parentRect.height) * 100;
    
    // 新しい位置を計算
    const newLeft = startElementPos.left + deltaXPercent;
    const newTop = startElementPos.top + deltaYPercent;
    
    // 位置を適用
    character.style.position = 'absolute';
    character.style.left = newLeft + '%';
    character.style.top = newTop + '%';
    character.style.transform = 'translate(-50%, -50%)';
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
    const position = {
        left: character.style.left,
        top: character.style.top,
        width: character.style.width || '120px',  // 既存システムとの互換性
        height: character.style.height || '120px'  // 高さも保存
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
        character.style.left = position.left;
        character.style.top = position.top;
        character.style.transform = 'translate(-50%, -50%)';
        if (position.width) {
            character.style.width = position.width;
        }
        if (position.height) {
            character.style.height = position.height;
        }
        console.log('✅ 位置を復元:', position);
    }
}

// ========== 初期化実行 ========== //
document.addEventListener('DOMContentLoaded', () => {
    // Spine初期化完了を待つ（既存システムの後に実行）
    setTimeout(() => {
        initializeMinimalEditSystem();
        // emergencyDiagnosis の後に実行されるように遅延を増やす
        setTimeout(() => {
            restorePosition();
            console.log('🔄 最小限編集システムによる位置復元を実行');
        }, 3000);
    }, 1000);
});

// デバッグ用グローバル関数
window.clearMinimalPosition = function() {
    localStorage.removeItem('spine-positioning-state');
    localStorage.removeItem('spine-minimal-position');
    console.log('🗑️ 保存データをクリアしました');
};

console.log('✅ Spine編集システム v3.0 (最小限実装版) 読み込み完了');