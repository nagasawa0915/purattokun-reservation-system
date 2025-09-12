
/**
 * 🎯 CSS Grid Area問題の確実な解決策
 */
function swapPanelsCorrectly(panel1, panel2) {
    console.log('🚨 CSS Grid Area + クラス同時交換開始');
    
    // 1. 現在のクラス名を取得
    const class1 = panel1.className.match(/panel-(\w+)/)?.[1];
    const class2 = panel2.className.match(/panel-(\w+)/)?.[1];
    
    console.log('現在のクラス:', { panel1: class1, panel2: class2 });
    
    // 2. CSSクラスを交換
    if (class1 && class2) {
        panel1.classList.remove(`panel-${class1}`);
        panel1.classList.add(`panel-${class2}`);
        
        panel2.classList.remove(`panel-${class2}`);  
        panel2.classList.add(`panel-${class1}`);
        
        console.log('✅ CSSクラス交換完了');
    }
    
    // 3. CSS Grid Areaも明示的に設定（保険）
    panel1.style.gridArea = class2;
    panel2.style.gridArea = class1;
    
    // 4. 強制再描画
    panel1.offsetHeight;
    panel2.offsetHeight;
    
    console.log('✅ パネル交換完了');
}

// 🧪 テスト用関数
function testPanelSwap() {
    const outliner = document.querySelector('.panel-outliner');
    const preview = document.querySelector('.panel-preview');
    
    if (outliner && preview) {
        swapPanelsCorrectly(outliner, preview);
        console.log('🧪 テスト実行完了 - 視覚的変化を確認してください');
    } else {
        console.error('❌ パネル要素が見つかりません');
    }
}
