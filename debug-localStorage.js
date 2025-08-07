// localStorage デバッグ用ファイル

console.log('=== localStorage デバッグ開始 ===');

// 現在のlocalStorageの中身を表示
const saved = localStorage.getItem('spine-positioning-state');
if (saved) {
    console.log('📋 保存データ (raw):', saved);
    try {
        const parsed = JSON.parse(saved);
        console.log('📋 保存データ (parsed):', parsed);
        
        if (parsed.characters) {
            console.log('✅ 新形式データ発見:');
            Object.entries(parsed.characters).forEach(([id, data]) => {
                console.log(`  - ${id}:`, data);
            });
        }
        
        if (parsed.character) {
            console.log('⚠️ 旧形式データ発見:', parsed.character);
        }
        
    } catch (e) {
        console.error('❌ データ解析エラー:', e);
    }
} else {
    console.log('💡 localStorageにデータなし');
}

// 現在のDOM状態を表示
console.log('\n=== DOM要素の位置確認 ===');
const characters = document.querySelectorAll('[id$="-canvas"]');
characters.forEach(element => {
    console.log(`${element.id}:`, {
        left: element.style.left,
        top: element.style.top,
        computedLeft: getComputedStyle(element).left,
        computedTop: getComputedStyle(element).top
    });
});

// 清潔なテストのためのクリア機能
window.clearSpineData = function() {
    localStorage.removeItem('spine-positioning-state');
    console.log('🧹 localStorageクリア完了');
    location.reload();
};

console.log('\n=== デバッグ完了 ===');
console.log('💡 clearSpineData() でデータクリア可能');