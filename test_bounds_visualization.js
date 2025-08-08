/**
 * spine-skeleton-bounds.js 境界視覚化機能の動作テスト
 * ブラウザのコンソールで実行
 */

console.log('🔧 境界視覚化機能テスト開始');

async function testBoundsVisualization() {
    console.group('🔧 spine-skeleton-bounds.js 境界視覚化機能テスト');
    
    try {
        // 1. システム基本状態確認
        console.log('📊 1. システム基本状態確認');
        const hasSpineBounds = \!\!window.spineSkeletonBounds;
        console.log('   window.spineSkeletonBounds:', hasSpineBounds);
        
        if (\!hasSpineBounds) {
            console.error('❌ spineSkeletonBounds が存在しません');
            return;
        }
        
        const characterCount = window.spineSkeletonBounds.characters.size;
        console.log('   登録キャラクター数:', characterCount);
        
        // 2. デバッグモード有効化テスト
        console.log('📊 2. デバッグモード有効化テスト');
        console.log('   修正前のデバッグモード:', window.spineSkeletonBounds.debugMode);
        
        // デバッグモード有効化
        window.spineSkeletonBounds.setDebugMode(true);
        console.log('   修正後のデバッグモード:', window.spineSkeletonBounds.debugMode);
        console.log('   デバッグCanvas存在:', \!\!window.spineSkeletonBounds.debugCanvas);
        
        // 3. キャラクター別境界描画テスト
        console.log('📊 3. キャラクター別境界描画テスト');
        
        const charactersToTest = ['purattokun', 'nezumi'];
        
        for (const characterName of charactersToTest) {
            console.log(`🎯 ${characterName} 境界描画テスト`);
            
            // キャラクター登録状況確認
            const hasCharacter = window.spineSkeletonBounds.characters.has(characterName);
            console.log(`   ${characterName} 登録状況:`, hasCharacter);
            
            if (\!hasCharacter) {
                console.warn(`   ⚠️ ${characterName} は登録されていません`);
                continue;
            }
            
            // 境界ボックス数確認
            const charInfo = window.spineSkeletonBounds.characters.get(characterName);
            const boundingBoxCount = charInfo?.boundingBoxes?.length || 0;
            console.log(`   ${characterName} 境界ボックス数:`, boundingBoxCount);
            
            if (boundingBoxCount === 0) {
                console.warn(`   ⚠️ ${characterName} に境界ボックスがありません`);
                continue;
            }
            
            // 境界描画実行
            try {
                console.log(`   ${characterName} 境界描画実行中...`);
                window.spineSkeletonBounds.debugDrawBounds(characterName);
                console.log(`   ✅ ${characterName} 境界描画完了`);
            } catch (drawError) {
                console.error(`   ❌ ${characterName} 境界描画でエラー:`, drawError);
            }
        }
        
        // 4. デバッグCanvas状態確認
        console.log('📊 4. デバッグCanvas最終状態');
        const debugCanvas = window.spineSkeletonBounds.debugCanvas;
        if (debugCanvas) {
            console.log('   Canvas要素:', {
                width: debugCanvas.width,
                height: debugCanvas.height,
                position: debugCanvas.getBoundingClientRect(),
                style: {
                    position: debugCanvas.style.position,
                    zIndex: debugCanvas.style.zIndex,
                    pointerEvents: debugCanvas.style.pointerEvents,
                    border: debugCanvas.style.border
                }
            });
        } else {
            console.error('   ❌ デバッグCanvasが作成されていません');
        }
        
        console.log('✅ 境界視覚化機能テスト完了');
        console.log('💡 画面上に境界ボックスが表示されているか確認してください');
        
    } catch (error) {
        console.error('❌ テスト実行中にエラーが発生:', error);
    }
    
    console.groupEnd();
}

// テスト実行
testBoundsVisualization();

console.log('💡 手動でテストを再実行する場合は testBoundsVisualization() を実行してください');
EOF < /dev/null