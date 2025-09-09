/**
 * ElementObserver出力調査スクリプト
 * test-bounding-box-autopin.html で実行してElementObserverの出力形式を確認
 */

function debugElementObserverOutput() {
    console.log('🔍 ElementObserver出力調査開始');
    
    // 1. グローバルオブジェクトの確認
    console.log('=== グローバルオブジェクト確認 ===');
    console.log('ElementObserver exist:', typeof window.ElementObserver !== 'undefined');
    console.log('ElementObserverCore exist:', typeof window.ElementObserverCore !== 'undefined');
    console.log('ElementObserverAdapter exist:', typeof window.ElementObserverAdapter !== 'undefined');
    
    // 2. ElementObserverのインスタンス作成とメソッド確認
    if (typeof window.ElementObserver !== 'undefined') {
        try {
            const observer = new ElementObserver();
            console.log('=== ElementObserver インスタンス詳細 ===');
            console.log('Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(observer)));
            console.log('Constructor name:', observer.constructor.name);
            
            // 3. 特定要素での出力テスト
            const testElement = document.getElementById('background-element') || document.querySelector('.hero-section');
            if (testElement) {
                console.log('=== テスト要素での出力確認 ===');
                console.log('Test element:', testElement.tagName, testElement.id || testElement.className);
                
                // getElementRectの出力確認
                if (typeof observer.getElementRect === 'function') {
                    const rect = observer.getElementRect(testElement);
                    console.log('getElementRect output:', rect);
                    console.log('getElementRect type:', typeof rect);
                    console.log('getElementRect keys:', rect ? Object.keys(rect) : 'null');
                } else {
                    console.log('⚠️ getElementRect method not found');
                }
                
                // getStableParentRectの出力確認
                if (typeof observer.getStableParentRect === 'function') {
                    const parentRect = observer.getStableParentRect(testElement);
                    console.log('getStableParentRect output:', parentRect);
                    console.log('getStableParentRect type:', typeof parentRect);
                    console.log('getStableParentRect keys:', parentRect ? Object.keys(parentRect) : 'null');
                } else {
                    console.log('⚠️ getStableParentRect method not found');
                }
                
                // observe メソッドのテスト
                if (typeof observer.observe === 'function') {
                    console.log('=== observe メソッドのテスト ===');
                    
                    let callCount = 0;
                    const unobserve = observer.observe(testElement, (rect, changeType) => {
                        callCount++;
                        console.log(`📡 observe callback #${callCount}:`);
                        console.log('  rect:', rect);
                        console.log('  rect type:', typeof rect);
                        console.log('  rect keys:', rect ? Object.keys(rect) : 'null');
                        console.log('  changeType:', changeType);
                        console.log('  changeType type:', typeof changeType);
                        
                        // 詳細な値のログ
                        if (rect) {
                            console.log('  rect.left:', rect.left, typeof rect.left);
                            console.log('  rect.top:', rect.top, typeof rect.top);
                            console.log('  rect.width:', rect.width, typeof rect.width);
                            console.log('  rect.height:', rect.height, typeof rect.height);
                            console.log('  rect.right:', rect.right, typeof rect.right);
                            console.log('  rect.bottom:', rect.bottom, typeof rect.bottom);
                            
                            // 追加プロパティの確認
                            if ('scrollLeft' in rect) console.log('  rect.scrollLeft:', rect.scrollLeft);
                            if ('scrollTop' in rect) console.log('  rect.scrollTop:', rect.scrollTop);
                            if ('transform' in rect) console.log('  rect.transform:', rect.transform);
                            if ('scale' in rect) console.log('  rect.scale:', rect.scale);
                        }
                    });
                    
                    // 3秒後に監視停止
                    setTimeout(() => {
                        if (typeof unobserve === 'function') {
                            unobserve();
                            console.log('✅ observe監視停止');
                        }
                    }, 3000);
                } else {
                    console.log('⚠️ observe method not found');
                }
            } else {
                console.log('❌ テスト要素が見つかりません');
            }
            
        } catch (error) {
            console.error('❌ ElementObserver インスタンス作成エラー:', error);
        }
    } else {
        console.log('❌ ElementObserver が利用できません');
    }
    
    // 4. ElementObserverAdapterの確認（効率的システム）
    if (typeof window.ElementObserverAdapter !== 'undefined') {
        try {
            console.log('=== ElementObserverAdapter 確認 ===');
            const adapter = new ElementObserverAdapter();
            
            const testElement = document.getElementById('background-element') || document.querySelector('.hero-section');
            if (testElement) {
                let adapterCallCount = 0;
                const unobserveAdapter = adapter.observe(testElement, (rect, changeType) => {
                    adapterCallCount++;
                    console.log(`📡 adapter callback #${adapterCallCount}:`);
                    console.log('  adapter rect:', rect);
                    console.log('  adapter rect type:', typeof rect);
                    console.log('  adapter changeType:', changeType);
                });
                
                setTimeout(() => {
                    if (typeof unobserveAdapter === 'function') {
                        unobserveAdapter();
                        console.log('✅ adapter監視停止');
                    }
                }, 2000);
            }
        } catch (error) {
            console.error('❌ ElementObserverAdapter エラー:', error);
        }
    }
    
    // 5. PureBoundingBoxAutoPinでの使用状況確認
    if (window.currentAutoPin && window.currentAutoPin.observer) {
        console.log('=== PureBoundingBoxAutoPin内のElementObserver ===');
        const autoPinObserver = window.currentAutoPin.observer;
        console.log('AutoPin observer type:', autoPinObserver.constructor.name);
        console.log('AutoPin observer methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(autoPinObserver)));
    }
}

// ページ読み込み後に自動実行（テストページ用）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', debugElementObserverOutput);
} else {
    debugElementObserverOutput();
}

// グローバル関数として登録
window.debugElementObserverOutput = debugElementObserverOutput;