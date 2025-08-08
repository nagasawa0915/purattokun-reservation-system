/**
 * spine-skeleton-bounds.js のデバッグ診断用スクリプト
 * ブラウザのコンソールで実行して問題を特定する
 */

console.log('🔍 spine-skeleton-bounds.js 診断スクリプト開始');

function diagnoseSkeletonBounds() {
    console.group('📊 SpineSkeletonBounds システム診断');
    
    // 1. グローバルオブジェクトの存在確認
    console.log('🔍 1. グローバルオブジェクトの状態');
    console.log('   window.spineSkeletonBounds:', \!\!window.spineSkeletonBounds);
    console.log('   window.spineSkeletonBounds.debugMode:', window.spineSkeletonBounds?.debugMode);
    console.log('   window.spineSkeletonBounds.debugCanvas:', \!\!window.spineSkeletonBounds?.debugCanvas);
    
    // 2. キャラクター登録状況
    console.log('🔍 2. キャラクター登録状況');
    if (window.spineSkeletonBounds) {
        console.log('   登録キャラクター数:', window.spineSkeletonBounds.characters.size);
        window.spineSkeletonBounds.characters.forEach((info, name) => {
            console.log(`   - ${name}:`, {
                存在: \!\!info,
                boundingBoxes数: info?.boundingBoxes?.length || 0,
                skeletonBounds: \!\!info?.skeletonBounds
            });
        });
    }
    
    // 3. デバッグCanvasの状態
    console.log('🔍 3. デバッグCanvas状態');
    const debugCanvas = window.spineSkeletonBounds?.debugCanvas;
    if (debugCanvas) {
        console.log('   Canvas存在:', \!\!debugCanvas);
        console.log('   Canvas親要素:', debugCanvas.parentElement?.tagName);
        console.log('   Canvasサイズ:', debugCanvas.width, 'x', debugCanvas.height);
        console.log('   Canvas位置:', debugCanvas.getBoundingClientRect());
        console.log('   CanvasのCSS visibility:', debugCanvas.style.visibility);
        console.log('   CanvasのCSS display:', debugCanvas.style.display);
        console.log('   CanvasのCSS z-index:', debugCanvas.style.zIndex);
    } else {
        console.log('   ❌ デバッグCanvasが存在しません');
    }
    
    // 4. 境界ボックスデータの確認
    console.log('🔍 4. 境界ボックスデータ確認');
    if (window.spineSkeletonBounds) {
        ['purattokun', 'nezumi'].forEach(name => {
            const info = window.spineSkeletonBounds.characters.get(name);
            if (info) {
                console.log(`   ${name}:`, {
                    boundingBoxes数: info.boundingBoxes.length,
                    boundingBox名一覧: info.boundingBoxes.map(bb => bb.name),
                    最初のboundingBox: info.boundingBoxes[0]
                });
            }
        });
    }
    
    // 5. DOM内のキャラクターCanvas確認
    console.log('🔍 5. DOM内のキャラクターCanvas確認');
    ['purattokun', 'nezumi'].forEach(name => {
        const canvas = document.querySelector(`#${name}-canvas, [id*="${name}"]`);
        if (canvas) {
            console.log(`   ${name} Canvas:`, {
                要素: canvas.tagName,
                表示状態: canvas.style.display,
                位置: canvas.getBoundingClientRect()
            });
        }
    });
    
    console.groupEnd();
}

// 診断スクリプト実行
diagnoseSkeletonBounds();

// 手動デバッグモード有効化テスト
function testDebugMode() {
    console.group('🔧 デバッグモード手動テスト');
    
    if (window.spineSkeletonBounds) {
        console.log('現在のデバッグモード:', window.spineSkeletonBounds.debugMode);
        
        // デバッグモード有効化
        window.spineSkeletonBounds.setDebugMode(true);
        console.log('デバッグモード有効化後:', window.spineSkeletonBounds.debugMode);
        console.log('デバッグCanvas作成:', \!\!window.spineSkeletonBounds.debugCanvas);
        
        // purattokun の境界描画テスト
        if (window.spineSkeletonBounds.characters.has('purattokun')) {
            console.log('purattokun 境界描画テスト開始...');
            window.spineSkeletonBounds.debugDrawBounds('purattokun');
            console.log('purattokun 境界描画完了');
        }
        
        // nezumi の境界描画テスト
        if (window.spineSkeletonBounds.characters.has('nezumi')) {
            console.log('nezumi 境界描画テスト開始...');
            window.spineSkeletonBounds.debugDrawBounds('nezumi');
            console.log('nezumi 境界描画完了');
        }
    }
    
    console.groupEnd();
}

console.log('💡 診断完了。手動テストを実行する場合は testDebugMode() を実行してください');
EOF < /dev/null