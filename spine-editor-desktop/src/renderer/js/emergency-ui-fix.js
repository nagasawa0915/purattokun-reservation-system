// 🚨 緊急JavaScript表示修正 - Electron対応強化版
console.log("🔧 緊急JavaScript UI表示修正開始");

// 即座にスタイル適用（DOMContentLoaded前）
function forceUIDisplay() {
    console.log("🔧 強制UI表示処理開始");
    
    // 画面スクロールリセット（最重要）
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    window.scrollTo(0, 0);
    
    // ツールバー強制表示
    const toolbar = document.getElementById("toolbar");
    if (toolbar) {
        toolbar.style.cssText = `
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            height: 40px !important;
            background: #3c3c3c !important;
            z-index: 9999 !important;
            align-items: center !important;
            padding: 0 12px !important;
            box-sizing: border-box !important;
        `;
        console.log("✅ ツールバー強制表示完了", toolbar.getBoundingClientRect());
    }
    
    // ツールバーボタン強制表示
    document.querySelectorAll(".toolbar-btn").forEach((btn, index) => {
        btn.style.cssText = `
            display: inline-flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            align-items: center !important;
            padding: 6px 12px !important;
            margin-right: 8px !important;
            background: #4a4a4a !important;
            border: 1px solid #2a2a2a !important;
            border-radius: 3px !important;
            color: #cccccc !important;
            cursor: pointer !important;
            font-size: 12px !important;
            white-space: nowrap !important;
        `;
        console.log(`✅ ボタン${index + 1}表示完了:`, btn.textContent, btn.getBoundingClientRect());
    });
    
    // メインコンテンツ強制表示
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
        mainContent.style.cssText = `
            display: block !important;
            visibility: visible !important;
            position: fixed !important;
            top: 40px !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 224px !important;
            background: #2b2b2b !important;
            width: 100% !important;
        `;
        console.log("✅ メインコンテンツ強制表示完了", mainContent.getBoundingClientRect());
    }
    
    // パネル強制表示
    document.querySelectorAll(".panel").forEach((panel, index) => {
        panel.style.cssText = `
            display: block !important;
            visibility: visible !important;
            background: #2b2b2b !important;
            border: 1px solid #1a1a1a !important;
            color: #cccccc !important;
        `;
        console.log(`✅ パネル${index + 1}表示完了:`, panel.id);
    });
    
    // ステータスバー強制表示
    const statusbar = document.getElementById("statusbar");
    if (statusbar) {
        statusbar.style.cssText = `
            display: flex !important;
            visibility: visible !important;
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            height: 24px !important;
            background: #2a2a2a !important;
            align-items: center !important;
            padding: 0 12px !important;
            z-index: 9998 !important;
        `;
        console.log("✅ ステータスバー強制表示完了", statusbar.getBoundingClientRect());
    }
    
    console.log("🎉 緊急JavaScript UI表示修正完了");
}

// DOMContentLoaded時とload時の両方で実行
document.addEventListener("DOMContentLoaded", function() {
    setTimeout(forceUIDisplay, 50);
    setTimeout(forceUIDisplay, 200);
    setTimeout(forceUIDisplay, 500);
});

window.addEventListener("load", function() {
    setTimeout(forceUIDisplay, 50);
});

// 即座実行（HTMLパース中でも適用可能な部分）
if (document.readyState !== 'loading') {
    forceUIDisplay();
} else {
    document.addEventListener('DOMContentLoaded', forceUIDisplay);
}

console.log("✅ 緊急JavaScript表示修正スクリプト読み込み完了");
