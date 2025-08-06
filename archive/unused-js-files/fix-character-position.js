// 🔧 キャラクター位置修正スクリプト
// このスクリプトをブラウザのF12コンソールで実行してください

function fixCharacterPosition() {
    console.log('🔧 キャラクター位置修正開始...');
    
    // 1. Canvas要素を探す
    const canvas = document.querySelector('#purattokun-canvas');
    if (!canvas) {
        console.error('❌ Canvas要素が見つかりません');
        return;
    }
    
    // 2. ラッパーがある場合は削除（リセット）
    const wrapper = canvas.closest('.character-wrapper');
    if (wrapper) {
        console.log('🔄 既存のラッパーを削除します');
        const parent = wrapper.parentElement;
        parent.insertBefore(canvas, wrapper);
        wrapper.remove();
    }
    
    // 3. Canvas要素を中央に配置（歪みを修正）
    canvas.style.cssText = `
        position: absolute !important;
        left: 50% !important;
        top: 50% !important;
        transform: translate(-50%, -50%) !important;
        width: 30% !important;
        aspect-ratio: 3/2 !important;
        z-index: 10 !important;
        display: block !important;
        cursor: pointer !important;
    `;
    
    console.log('✅ キャラクターを中央に配置しました');
    
    // 4. localStorage をクリア（リセット）
    localStorage.removeItem('spine-positioning-state');
    console.log('🗑️ 保存データをクリアしました');
    
    // 5. 編集モードを終了（もし有効な場合）
    if (typeof endEditMode === 'function') {
        endEditMode();
        console.log('🔚 編集モードを終了しました');
    }
    
    console.log('✅ 修正完了！ページをリロードしてください');
}

// 緊急修正関数
function emergencyReset() {
    console.log('🚨 緊急リセット実行...');
    
    // すべてのキャラクター関連要素をリセット
    const elements = document.querySelectorAll('#purattokun-canvas, #purattokun-fallback, .character-wrapper');
    elements.forEach(el => {
        if (el.classList.contains('character-wrapper')) {
            el.remove();
        } else {
            el.style.cssText = '';
        }
    });
    
    // localStorage完全クリア
    localStorage.clear();
    
    console.log('✅ 緊急リセット完了。ページをリロードしてください');
}

// 使い方を表示
console.log(`
🔧 キャラクター位置修正ツール
================================

以下のコマンドを実行してください：

1. 通常修正（推奨）:
   fixCharacterPosition()

2. 緊急リセット（問題が解決しない場合）:
   emergencyReset()

3. 修正後は必ずページをリロード（F5）してください
`);

// グローバルに公開
window.fixCharacterPosition = fixCharacterPosition;
window.emergencyReset = emergencyReset;