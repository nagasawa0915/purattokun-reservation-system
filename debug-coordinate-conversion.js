/**
 * 座標変換での ElementObserver 使用状況調査スクリプト
 * PureBoundingBoxAutoPin の convertDOMToSpineCoordinates で実際に使われる値を確認
 */

function debugCoordinateConversion() {
    console.log('🔍 座標変換でのElementObserver使用状況調査開始');
    
    // 1. PureBoundingBoxAutoPinの存在確認
    if (!window.currentAutoPin) {
        console.log('❌ currentAutoPin インスタンスが見つかりません');
        return;
    }
    
    const autoPin = window.currentAutoPin;
    console.log('✅ PureBoundingBoxAutoPin インスタンス確認');
    console.log('Observer exists:', !!autoPin.observer);
    console.log('Observer type:', autoPin.observer?.constructor.name);
    
    // 2. テスト用のSpine要素を探す
    const spineElements = [
        document.getElementById('spine-canvas'),
        document.getElementById('purattokun-canvas'),
        document.querySelector('canvas[id*="spine"]'),
        document.querySelector('canvas[id*="purattokun"]')
    ].filter(Boolean);
    
    if (spineElements.length === 0) {
        console.log('❌ Spine要素が見つかりません');
        return;
    }
    
    const spineElement = spineElements[0];
    console.log('✅ テスト対象Spine要素:', spineElement.id || 'no-id', spineElement.tagName);
    
    // 3. convertDOMToSpineCoordinates の実行テスト
    if (typeof autoPin.convertDOMToSpineCoordinates === 'function') {
        console.log('=== convertDOMToSpineCoordinates テスト ===');
        
        // テスト座標（画面中央付近）
        const testX = 400;
        const testY = 300;
        
        console.log(`テスト座標: DOM(${testX}, ${testY})`);
        
        try {
            const result = autoPin.convertDOMToSpineCoordinates(testX, testY, spineElement);
            console.log('変換結果:', result);
            console.log('結果タイプ:', typeof result);
            console.log('結果キー:', result ? Object.keys(result) : 'null');
            
            if (result) {
                console.log('  x:', result.x, typeof result.x);
                console.log('  y:', result.y, typeof result.y);
                console.log('  transform:', result.transform);
                console.log('  method:', result.method);
                console.log('  success:', result.success);
            }
        } catch (error) {
            console.error('❌ convertDOMToSpineCoordinates エラー:', error);
        }
    } else {
        console.log('❌ convertDOMToSpineCoordinates メソッドが見つかりません');
    }
    
    // 4. ElementObserver の直接使用テスト
    if (autoPin.observer) {
        console.log('=== ElementObserver 直接使用テスト ===');
        
        // getElementRect のテスト
        if (typeof autoPin.observer.getElementRect === 'function') {
            const spineRect = autoPin.observer.getElementRect(spineElement);
            console.log('spineRect:', spineRect);
            console.log('spineRect keys:', spineRect ? Object.keys(spineRect) : 'null');
        }
        
        // getStableParentRect のテスト
        if (typeof autoPin.observer.getStableParentRect === 'function') {
            const parentRect = autoPin.observer.getStableParentRect(spineElement);
            console.log('parentRect:', parentRect);
            console.log('parentRect keys:', parentRect ? Object.keys(parentRect) : 'null');
        }
    }
    
    // 5. calculatePinCoordinatesSafely の実行テスト
    if (typeof autoPin.calculatePinCoordinatesSafely === 'function') {
        console.log('=== calculatePinCoordinatesSafely テスト ===');
        
        // テスト用のピンデータを作成
        const testPinData = {
            anchor: 'MC', // Middle Center
            backgroundElement: 'background-element',
            spineElement: spineElement.id
        };
        
        try {
            const result = autoPin.calculatePinCoordinatesSafely(testPinData, spineElement);
            console.log('計算結果:', result);
            console.log('結果タイプ:', typeof result);
            console.log('結果キー:', result ? Object.keys(result) : 'null');
            
            if (result) {
                console.log('  success:', result.success);
                console.log('  pinX:', result.pinX, typeof result.pinX);
                console.log('  pinY:', result.pinY, typeof result.pinY);
                console.log('  method:', result.method);
                console.log('  reason:', result.reason);
            }
        } catch (error) {
            console.error('❌ calculatePinCoordinatesSafely エラー:', error);
        }
    }
    
    // 6. 背景要素の矩形情報も確認
    const backgroundElement = document.getElementById('background-element') || document.querySelector('.hero-section');
    if (backgroundElement) {
        console.log('=== 背景要素の矩形情報 ===');
        
        // 標準のgetBoundingClientRect
        const standardRect = backgroundElement.getBoundingClientRect();
        console.log('標準rect:', standardRect);
        console.log('標準rect DOMRect keys:', Object.getOwnPropertyNames(standardRect));
        
        // ElementObserver経由
        if (autoPin.observer && typeof autoPin.observer.getElementRect === 'function') {
            const observerRect = autoPin.observer.getElementRect(backgroundElement);
            console.log('observer rect:', observerRect);
            console.log('observer rect keys:', observerRect ? Object.keys(observerRect) : 'null');
            
            // 値の比較
            if (standardRect && observerRect) {
                console.log('=== 値の比較 ===');
                console.log('left - 標準:', standardRect.left, 'observer:', observerRect.left);
                console.log('top - 標準:', standardRect.top, 'observer:', observerRect.top);
                console.log('width - 標準:', standardRect.width, 'observer:', observerRect.width);
                console.log('height - 標準:', standardRect.height, 'observer:', observerRect.height);
            }
        }
    }
}

// ページ読み込み後に実行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // AutoPinインスタンスが作成されるまで少し待つ
        setTimeout(debugCoordinateConversion, 1000);
    });
} else {
    setTimeout(debugCoordinateConversion, 1000);
}

// グローバル関数として登録
window.debugCoordinateConversion = debugCoordinateConversion;