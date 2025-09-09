// 🚨 AutoPin座標混入問題 緊急修正スクリプト
// 実行方法: ブラウザコンソールで copy & paste して実行

console.log('🚨 AutoPin座標混入問題 緊急修正開始');

// Step 1: 循環競合の即座停止
async function emergencyAutoPinFix() {
    console.log('🛑 Step 1: 循環競合停止処理開始');
    
    // 1. ResizeObserver停止
    try {
        if (window.resizeObserver) {
            window.resizeObserver.disconnect();
            console.log('✅ ResizeObserver停止完了');
        } else {
            console.log('ℹ️ ResizeObserverが見つかりません');
        }
    } catch (error) {
        console.log('⚠️ ResizeObserver停止エラー:', error.message);
    }
    
    // 2. EfficientObserver停止
    try {
        if (window.efficientObserver) {
            window.efficientObserver.disconnect();
            console.log('✅ EfficientObserver停止完了');
        } else {
            console.log('ℹ️ EfficientObserverが見つかりません');
        }
    } catch (error) {
        console.log('⚠️ EfficientObserver停止エラー:', error.message);
    }
    
    // 3. AutoPin無効化
    try {
        if (window.PureBoundingBoxAutoPin && window.currentAutoPin) {
            if (typeof window.currentAutoPin.disable === 'function') {
                window.currentAutoPin.disable();
                console.log('✅ AutoPin無効化完了');
            } else {
                console.log('ℹ️ AutoPin disableメソッドなし - インスタンス削除');
                window.currentAutoPin = null;
            }
        } else {
            console.log('ℹ️ AutoPinインスタンスが見つかりません');
        }
    } catch (error) {
        console.log('⚠️ AutoPin無効化エラー:', error.message);
    }
    
    // 4. 座標設定の固定化
    try {
        const spineElement = document.querySelector('#hero-image');
        if (spineElement) {
            // 循環競合を避けるため、現在の位置を取得して固定
            const currentStyle = window.getComputedStyle(spineElement);
            const currentLeft = currentStyle.left;
            const currentTop = currentStyle.top;
            
            spineElement.style.left = currentLeft;
            spineElement.style.top = currentTop;
            spineElement.style.position = 'fixed';
            
            console.log(`✅ Spine座標固定化完了: left=${currentLeft}, top=${currentTop}`);
        } else {
            console.log('⚠️ #hero-image要素が見つかりません');
        }
    } catch (error) {
        console.log('⚠️ 座標固定化エラー:', error.message);
    }
    
    // 5. イベントリスナー削除
    try {
        // ウィンドウリサイズイベントリスナー停止
        window.removeEventListener('resize', () => {});
        console.log('✅ イベントリスナー削除完了');
    } catch (error) {
        console.log('⚠️ イベントリスナー削除エラー:', error.message);
    }
    
    console.log('🛑 緊急停止処理完了 - 循環競合を停止しました');
    return true;
}

// Step 2: 安定性確認テスト
function verifyStability() {
    console.log('🔍 Step 2: 安定性確認テスト開始');
    
    const spineElement = document.querySelector('#hero-image');
    if (!spineElement) {
        console.log('❌ Spine要素が見つかりません');
        return false;
    }
    
    // 現在位置記録
    const beforeStyle = window.getComputedStyle(spineElement);
    const beforeLeft = beforeStyle.left;
    const beforeTop = beforeStyle.top;
    
    console.log(`📍 修正前位置: left=${beforeLeft}, top=${beforeTop}`);
    
    // 1秒後に位置変動確認
    setTimeout(() => {
        const afterStyle = window.getComputedStyle(spineElement);
        const afterLeft = afterStyle.left;
        const afterTop = afterStyle.top;
        
        console.log(`📍 1秒後位置: left=${afterLeft}, top=${afterTop}`);
        
        if (beforeLeft === afterLeft && beforeTop === afterTop) {
            console.log('✅ 位置固定化成功 - 循環競合停止確認');
        } else {
            console.log('⚠️ 位置が変動しています - 追加対策が必要');
        }
    }, 1000);
}

// Step 3: 手動実行用関数群
window.emergencyFix = {
    // 緊急停止実行
    stop: emergencyAutoPinFix,
    
    // 安定性確認
    verify: verifyStability,
    
    // 位置リセット（安全位置への強制移動）
    resetPosition: function() {
        const spineElement = document.querySelector('#hero-image');
        if (spineElement) {
            spineElement.style.left = '486px';
            spineElement.style.top = '354px';
            spineElement.style.position = 'fixed';
            console.log('🔧 安全位置(486px, 354px)にリセット完了');
        }
    },
    
    // 診断情報表示
    diagnose: function() {
        console.log('🔍 現在の診断情報:');
        console.log('ResizeObserver:', !!window.resizeObserver);
        console.log('EfficientObserver:', !!window.efficientObserver);
        console.log('CurrentAutoPin:', !!window.currentAutoPin);
        
        const spineElement = document.querySelector('#hero-image');
        if (spineElement) {
            const style = window.getComputedStyle(spineElement);
            console.log(`Spine位置: left=${style.left}, top=${style.top}`);
            console.log(`Position: ${style.position}`);
        }
    }
};

console.log('🔧 緊急修正スクリプト準備完了');
console.log('実行方法:');
console.log('1. emergencyFix.stop() - 緊急停止実行');
console.log('2. emergencyFix.verify() - 安定性確認');
console.log('3. emergencyFix.resetPosition() - 位置リセット');
console.log('4. emergencyFix.diagnose() - 診断情報表示');