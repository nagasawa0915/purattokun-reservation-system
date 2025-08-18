/**
 * Phase 2 レンダリングモジュール分離テスト
 * spine-preview-render.js分離の動作確認とパフォーマンス検証
 */

console.log('🧪 Phase 2 レンダリングモジュール分離テスト開始');

// 1. モジュール分離の確認
function testModuleSeparation() {
    console.log('\n📦 1. モジュール分離確認:');
    
    try {
        // SpinePreviewLayerの確認
        if (typeof window.spinePreviewLayer !== 'undefined') {
            const layer = window.spinePreviewLayer;
            
            console.log('✅ SpinePreviewLayer:', {
                hasRenderModule: !!layer.renderModule,
                hasContextManager: !!layer.contextManager,
                isInitialized: layer.isInitialized
            });
            
            // レンダリングモジュールの確認
            if (layer.renderModule) {
                console.log('✅ SpinePreviewRender:', {
                    hasCanvas: !!layer.renderModule.canvas,
                    hasGL: !!layer.renderModule.gl,
                    hasSpine: !!layer.renderModule.spine,
                    isRendering: layer.renderModule.isRendering,
                    running: layer.renderModule._running
                });
                
                // メソッド存在確認
                const renderMethods = [
                    'createCanvas',
                    'initializeWebGL', 
                    'initializeSpine',
                    'startRenderLoop',
                    'stopRenderLoop',
                    'renderAllCharacters',
                    'renderAllCharactersOptimized',
                    'recoverRenderer',
                    'updateAssetRegistryCache',
                    'isRenderingReady'
                ];
                
                renderMethods.forEach(method => {
                    const exists = typeof layer.renderModule[method] === 'function';
                    console.log(`  ${exists ? '✅' : '❌'} ${method}: ${exists ? '存在' : '未実装'}`);
                });
            }
            
            return true;
        } else {
            console.warn('⚠️ SpinePreviewLayer未初期化');
            return false;
        }
    } catch (error) {
        console.error('❌ モジュール分離確認エラー:', error);
        return false;
    }
}

// 2. パフォーマンス測定
function testPerformance() {
    console.log('\n⚡ 2. パフォーマンス測定:');
    
    if (!window.spinePreviewLayer || !window.spinePreviewLayer.renderModule) {
        console.warn('⚠️ レンダリングモジュール未初期化');
        return;
    }
    
    const renderModule = window.spinePreviewLayer.renderModule;
    
    // レンダリング状態確認
    console.log('📊 レンダリング状態:', {
        isRendering: renderModule.isRendering,
        running: renderModule._running,
        frameCount: renderModule._frameCount,
        rafId: renderModule._rafId
    });
    
    // FPS測定（10秒間）
    if (renderModule.isRendering) {
        const startTime = Date.now();
        const startFrameCount = renderModule._frameCount;
        
        setTimeout(() => {
            const endTime = Date.now();
            const endFrameCount = renderModule._frameCount;
            
            const duration = (endTime - startTime) / 1000;
            const frames = endFrameCount - startFrameCount;
            const fps = frames / duration;
            
            console.log('📈 10秒間FPS測定結果:', {
                frames: frames,
                duration: duration.toFixed(2) + 's',
                fps: fps.toFixed(1) + 'FPS',
                status: fps >= 50 ? '✅ 良好' : fps >= 30 ? '⚠️ 普通' : '❌ 低下'
            });
        }, 10000);
    }
}

// 3. Context復旧テスト
function testContextRecovery() {
    console.log('\n🔄 3. Context復旧機能確認:');
    
    if (!window.spinePreviewLayer) {
        console.warn('⚠️ SpinePreviewLayer未初期化');
        return;
    }
    
    const layer = window.spinePreviewLayer;
    
    // Context管理状態確認
    if (layer.contextManager) {
        console.log('✅ Context管理:', {
            isContextLost: layer.contextManager.isContextLost(),
            isWebGLReady: layer.contextManager.isWebGLReady(),
            hasCanvas: !!layer.contextManager.canvas,
            hasGL: !!layer.contextManager.gl
        });
    }
    
    // レンダリング復旧メソッド確認
    if (layer.renderModule && typeof layer.renderModule.recoverRenderer === 'function') {
        console.log('✅ レンダリング復旧メソッド実装済み');
    } else {
        console.warn('⚠️ レンダリング復旧メソッド未実装');
    }
}

// 4. AssetRegistry連携確認
function testAssetRegistryIntegration() {
    console.log('\n🚀 4. AssetRegistry連携確認:');
    
    if (!window.spinePreviewLayer) {
        console.warn('⚠️ SpinePreviewLayer未初期化');
        return;
    }
    
    const layer = window.spinePreviewLayer;
    
    // AssetRegistry状態確認
    console.log('📦 AssetRegistry状態:', {
        hasAssetRegistry: !!layer._assetRegistry,
        assetReadyCacheSize: layer._assetReadyCache ? layer._assetReadyCache.size : 0,
        renderModuleCacheSize: layer.renderModule ? layer.renderModule._assetReadyCache.size : 0
    });
    
    // キャラクター状態確認
    console.log('🎭 キャラクター状態:', {
        charactersCount: layer.characters ? layer.characters.size : 0,
        characterNames: layer.characters ? Array.from(layer.characters.keys()) : []
    });
}

// 5. 統合動作確認
function testIntegratedOperation() {
    console.log('\n🔄 5. 統合動作確認:');
    
    if (!window.spinePreviewLayer) {
        console.warn('⚠️ SpinePreviewLayer未初期化');
        return;
    }
    
    const layer = window.spinePreviewLayer;
    
    // レンダリング準備状態確認
    const isReady = layer.isReadyForCharacters();
    console.log('🎯 レンダリング準備状態:', isReady ? '✅ 準備完了' : '❌ 準備未完了');
    
    // プロキシメソッド動作確認
    const proxyMethods = [
        'createCanvas',
        'initializeWebGL',
        'initializeSpine',
        'startRenderLoop',
        'stopRenderLoop',
        'renderAllCharacters',
        'renderAllCharactersOptimized'
    ];
    
    proxyMethods.forEach(method => {
        const exists = typeof layer[method] === 'function';
        console.log(`  ${exists ? '✅' : '❌'} ${method}: ${exists ? 'プロキシ実装済み' : '未実装'}`);
    });
}

// テスト実行
function runAllTests() {
    console.log('🧪======================================');
    console.log('🧪 Phase 2 レンダリングモジュール分離テスト');
    console.log('🧪======================================');
    
    const results = {
        moduleSeparation: testModuleSeparation(),
        performance: testPerformance(),
        contextRecovery: testContextRecovery(),
        assetRegistry: testAssetRegistryIntegration(),
        integrated: testIntegratedOperation()
    };
    
    console.log('\n📋 テスト結果サマリー:');
    Object.entries(results).forEach(([test, result]) => {
        if (typeof result === 'boolean') {
            console.log(`  ${result ? '✅' : '❌'} ${test}: ${result ? 'PASS' : 'FAIL'}`);
        } else {
            console.log(`  ℹ️ ${test}: 実行完了`);
        }
    });
    
    return results;
}

// グローバル関数として公開
window.testRenderSeparation = runAllTests;
window.testModuleSeparation = testModuleSeparation;
window.testPerformance = testPerformance;
window.testContextRecovery = testContextRecovery;
window.testAssetRegistryIntegration = testAssetRegistryIntegration;
window.testIntegratedOperation = testIntegratedOperation;

console.log('✅ テスト関数準備完了');
console.log('📋 使用方法:');
console.log('  - testRenderSeparation() : 全テスト実行');
console.log('  - testModuleSeparation() : モジュール分離確認');
console.log('  - testPerformance() : パフォーマンス測定');
console.log('  - testContextRecovery() : Context復旧確認');
console.log('  - testAssetRegistryIntegration() : AssetRegistry連携確認');
console.log('  - testIntegratedOperation() : 統合動作確認');

// 自動実行（3秒後）
setTimeout(() => {
    console.log('\n🚀 自動テスト実行開始（3秒経過）');
    runAllTests();
}, 3000);