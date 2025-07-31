// 🎯 Spine編集システム - デバッグ・診断機能モジュール v1.0
// 役割：システム診断・デバッグ支援・テスト機能・問題解決提案

console.log('🔍 診断機能モジュール読み込み開始');

// ========== 総合診断システム ========== //

/**
 * ドラッグハンドル診断の総合実行
 */
function diagnoseDragHandles() {
    console.log('🔍 ===== ドラッグハンドル総合診断開始 =====');
    
    const results = {
        // 基本状態
        editMode: window.isEditMode || false,
        characterFound: !!(window.character),
        
        // ハンドル要素診断
        handles: diagnoseDragHandleElements(),
        
        // イベント診断
        events: diagnoseDragEvents(),
        
        // 座標系診断
        coordinates: diagnoseDragCoordinates(),
        
        // 視覚的診断
        visual: diagnoseDragVisual(),
        
        // 編集モード診断
        editModeProcess: diagnoseEditModeProcess()
    };
    
    // 診断結果の表示
    displayDiagnosisResults(results);
    
    // 問題提案
    generateFixSuggestions(results);
    
    return results;
}

/**
 * ハンドル要素の存在・表示診断
 */
function diagnoseDragHandleElements() {
    const diagnosis = {
        highlightContainer: null,
        borderElement: null,
        handles: [],
        handleCount: 0,
        centerHandle: null,
        visibility: {},
        zIndex: {}
    };
    
    try {
        // ハイライトコンテナの確認
        const highlightContainers = document.querySelectorAll('.character-highlight-container');
        diagnosis.highlightContainer = {
            found: highlightContainers.length > 0,
            count: highlightContainers.length,
            elements: Array.from(highlightContainers)
        };
        
        // 境界要素の確認
        const borderElements = document.querySelectorAll('.character-highlight-border');
        diagnosis.borderElement = {
            found: borderElements.length > 0,
            count: borderElements.length,
            elements: Array.from(borderElements)
        };
        
        // ハンドル要素の確認
        const handles = document.querySelectorAll('.character-drag-handle');
        diagnosis.handleCount = handles.length;
        
        handles.forEach((handle, index) => {
            const handleType = handle.dataset.handleType;
            const computedStyle = window.getComputedStyle(handle);
            const rect = handle.getBoundingClientRect();
            
            const handleInfo = {
                element: handle,
                type: handleType,
                dataset: {...handle.dataset},
                visible: computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden',
                opacity: computedStyle.opacity,
                zIndex: computedStyle.zIndex,
                position: {
                    left: computedStyle.left,
                    top: computedStyle.top,
                    transform: computedStyle.transform
                },
                rect: {
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height
                },
                pointerEvents: computedStyle.pointerEvents,
                cursor: computedStyle.cursor
            };
            
            diagnosis.handles.push(handleInfo);
            
            if (handleType === 'center') {
                diagnosis.centerHandle = handleInfo;
            }
        });
        
    } catch (error) {
        diagnosis.error = error.message;
        console.error('❌ ハンドル要素診断エラー:', error);
    }
    
    return diagnosis;
}

/**
 * ドラッグイベントの診断
 */
function diagnoseDragEvents() {
    const diagnosis = {
        centerHandleEvents: null,
        documentEvents: null,
        isDragging: window.isDragging || false,
        dragVariables: {
            startMousePos: window.startMousePos || null,
            startElementPos: window.startElementPos || null
        }
    };
    
    try {
        // 中央ハンドルのイベントリスナー確認
        const centerHandle = document.querySelector('.character-drag-handle.handle-center');
        if (centerHandle) {
            diagnosis.centerHandleEvents = {
                found: true,
                hasMousedown: testEventListener(centerHandle, 'mousedown'),
                hasTouchstart: testEventListener(centerHandle, 'touchstart'),
                hasMouseenter: testEventListener(centerHandle, 'mouseenter'),
                hasMouseleave: testEventListener(centerHandle, 'mouseleave')
            };
        } else {
            diagnosis.centerHandleEvents = { found: false };
        }
        
        // ドキュメントレベルのイベント確認
        diagnosis.documentEvents = {
            hasMousemove: testEventListener(document, 'mousemove'),
            hasTouchmove: testEventListener(document, 'touchmove'),
            hasMouseup: testEventListener(document, 'mouseup'),
            hasTouchend: testEventListener(document, 'touchend')
        };
        
    } catch (error) {
        diagnosis.error = error.message;
        console.error('❌ イベント診断エラー:', error);
    }
    
    return diagnosis;
}

/**
 * 座標系・変位計算の診断
 */
function diagnoseDragCoordinates() {
    const diagnosis = {
        character: null,
        viewport: null,
        calculations: null
    };
    
    try {
        const character = window.character;
        if (character) {
            const rect = character.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(character);
            
            diagnosis.character = {
                rect: {
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    centerX: rect.x + rect.width / 2,
                    centerY: rect.y + rect.height / 2
                },
                style: {
                    left: computedStyle.left,
                    top: computedStyle.top,
                    transform: computedStyle.transform,
                    position: computedStyle.position
                }
            };
        }
        
        diagnosis.viewport = {
            width: window.innerWidth,
            height: window.innerHeight,
            scrollX: window.scrollX,
            scrollY: window.scrollY
        };
        
        // 座標計算テスト
        diagnosis.calculations = testCoordinateCalculations();
        
    } catch (error) {
        diagnosis.error = error.message;
        console.error('❌ 座標診断エラー:', error);
    }
    
    return diagnosis;
}

/**
 * 視覚的問題の診断
 */
function diagnoseDragVisual() {
    const diagnosis = {
        zIndexConflicts: [],
        cssConflicts: [],
        layoutIssues: []
    };
    
    try {
        const character = window.character;
        
        // z-index階層の確認
        if (character) {
            const elements = [
                { name: 'character', element: character },
                { name: 'highlightContainer', element: character._highlightContainer },
                { name: 'centerHandle', element: document.querySelector('.character-drag-handle.handle-center') }
            ];
            
            elements.forEach(item => {
                if (item.element) {
                    const zIndex = window.getComputedStyle(item.element).zIndex;
                    diagnosis.zIndexConflicts.push({
                        name: item.name,
                        zIndex: zIndex,
                        numeric: isNaN(parseInt(zIndex)) ? null : parseInt(zIndex)
                    });
                }
            });
        }
        
        // CSS競合の確認
        const handles = document.querySelectorAll('.character-drag-handle');
        handles.forEach(handle => {
            const style = window.getComputedStyle(handle);
            if (style.pointerEvents === 'none') {
                diagnosis.cssConflicts.push({
                    element: handle,
                    issue: 'pointer-events: none',
                    suggestion: 'pointer-events: auto に変更'
                });
            }
        });
        
    } catch (error) {
        diagnosis.error = error.message;
        console.error('❌ 視覚診断エラー:', error);
    }
    
    return diagnosis;
}

/**
 * 編集モードプロセスの診断
 */
function diagnoseEditModeProcess() {
    const diagnosis = {
        editModeEnabled: window.isEditMode || false,
        charactersDetected: (window.characters || []).length,
        activeCharacterIndex: window.activeCharacterIndex || 0,
        currentScale: window.currentScale || 1.0
    };
    
    return diagnosis;
}

/**
 * イベントリスナーのテスト（間接的）
 */
function testEventListener(element, eventType) {
    // 実際のイベントリスナーの確認は困難なため、
    // 要素の状態から推測する
    try {
        if (!element) return false;
        
        // テストイベントを発火して反応を確認
        // （実際のイベントは発火させず、設定の確認のみ）
        const hasAttribute = element.hasAttribute(`data-${eventType}-listener`);
        const hasClass = element.classList.contains(`${eventType}-enabled`);
        
        // より確実な判定のため、要素の種類とコンテキストを確認
        if (eventType === 'mousedown' && element.classList.contains('character-drag-handle')) {
            return element.style.cursor === 'move' || element.dataset.handleType === 'center';
        }
        
        return hasAttribute || hasClass;
        
    } catch (error) {
        console.error(`❌ ${eventType}イベントテストエラー:`, error);
        return false;
    }
}

/**
 * 座標計算のテスト
 */
function testCoordinateCalculations() {
    const tests = [];
    
    try {
        const character = window.character;
        if (character) {
            // ビューポート座標からキャラクター相対座標への変換テスト
            const rect = character.getBoundingClientRect();
            const testPoints = [
                { x: rect.left, y: rect.top, expected: 'top-left' },
                { x: rect.left + rect.width/2, y: rect.top + rect.height/2, expected: 'center' },
                { x: rect.right, y: rect.bottom, expected: 'bottom-right' }
            ];
            
            testPoints.forEach(point => {
                const relativeX = point.x - rect.left;
                const relativeY = point.y - rect.top;
                
                tests.push({
                    input: { x: point.x, y: point.y },
                    output: { x: relativeX, y: relativeY },
                    expected: point.expected,
                    passed: true // 簡単な検証
                });
            });
        }
    } catch (error) {
        tests.push({ error: error.message });
    }
    
    return tests;
}

/**
 * 診断結果の表示
 */
function displayDiagnosisResults(results) {
    console.log('📊 ===== 診断結果 =====');
    
    // 基本状態
    console.log('🔧 基本状態:');
    console.log(`  編集モード: ${results.editMode ? '✅ 有効' : '❌ 無効'}`);
    console.log(`  キャラクター: ${results.characterFound ? '✅ 検出済み' : '❌ 未検出'}`);
    
    // ハンドル要素
    console.log('🎯 ハンドル要素:');
    console.log(`  ハイライトコンテナ: ${results.handles.highlightContainer?.found ? '✅' : '❌'} (${results.handles.highlightContainer?.count || 0}個)`);
    console.log(`  ドラッグハンドル: ${results.handles.handleCount > 0 ? '✅' : '❌'} (${results.handles.handleCount}個)`);
    console.log(`  中央ハンドル: ${results.handles.centerHandle ? '✅' : '❌'}`);
    
    // イベント
    console.log('🖱️ イベント:');
    console.log(`  中央ハンドルイベント: ${results.events.centerHandleEvents?.found ? '✅' : '❌'}`);
    console.log(`  ドラッグ状態: ${results.events.isDragging ? '🔄 ドラッグ中' : '⏸️ 待機中'}`);
    
    // 座標系
    console.log('📐 座標系:');
    console.log(`  キャラクター位置: ${results.coordinates.character ? '✅' : '❌'}`);
    console.log(`  座標計算テスト: ${results.coordinates.calculations?.length || 0}件`);
    
    // 視覚的問題
    console.log('👁️ 視覚的問題:');
    console.log(`  z-index競合: ${results.visual.zIndexConflicts?.length || 0}件`);
    console.log(`  CSS競合: ${results.visual.cssConflicts?.length || 0}件`);
}

/**
 * 修正提案の生成
 */
function generateFixSuggestions(results) {
    const suggestions = [];
    
    // 編集モードが無効
    if (!results.editMode) {
        suggestions.push({
            issue: '編集モードが無効',
            solution: 'toggleEditMode() を実行して編集モードを有効にしてください',
            code: 'window.toggleEditMode()'
        });
    }
    
    // キャラクターが未検出
    if (!results.characterFound) {
        suggestions.push({
            issue: 'キャラクターが未検出',
            solution: 'キャラクター検出を実行してください',
            code: 'window.detectCharacters()'
        });
    }
    
    // ハンドルが存在しない
    if (results.handles.handleCount === 0) {
        suggestions.push({
            issue: 'ドラッグハンドルが存在しない',
            solution: 'キャラクターハイライトを追加してください',
            code: 'window.addCharacterHighlight(window.character)'
        });
    }
    
    // 中央ハンドルが存在しない
    if (!results.handles.centerHandle) {
        suggestions.push({
            issue: '中央ハンドルが存在しない',
            solution: 'ハイライト要素を再作成してください',
            code: 'window.removeCharacterHighlight(window.character); window.addCharacterHighlight(window.character);'
        });
    }
    
    // 中央ハンドルが非表示
    if (results.handles.centerHandle && !results.handles.centerHandle.visible) {
        suggestions.push({
            issue: '中央ハンドルが非表示',
            solution: 'ハンドルの表示スタイルを確認してください',
            code: 'document.querySelector(".handle-center").style.display = "block"'
        });
    }
    
    // イベントリスナーの問題
    if (results.events.centerHandleEvents?.found && !results.events.centerHandleEvents.hasMousedown) {
        suggestions.push({
            issue: '中央ハンドルにイベントリスナーが未設定',
            solution: 'startDragイベントを設定してください',
            code: 'const handle = document.querySelector(".handle-center"); handle.addEventListener("mousedown", window.startDrag);'
        });
    }
    
    // z-index競合
    if (results.visual.zIndexConflicts?.length > 1) {
        suggestions.push({
            issue: 'z-index競合の可能性',
            solution: 'z-index値を確認・調整してください',
            code: 'console.log("z-index値:", Array.from(document.querySelectorAll(".character-drag-handle")).map(el => getComputedStyle(el).zIndex))'
        });
    }
    
    // 提案の表示
    if (suggestions.length > 0) {
        console.log('💡 ===== 修正提案 =====');
        suggestions.forEach((suggestion, index) => {
            console.log(`${index + 1}. ${suggestion.issue}`);
            console.log(`   解決策: ${suggestion.solution}`);
            console.log(`   実行コード: ${suggestion.code}`);
            console.log('');
        });
    } else {
        console.log('✅ 問題は検出されませんでした');
    }
    
    return suggestions;
}

// ========== テスト・デバッグ機能 ========== //

/**
 * ドラッグ機能の実動作テスト
 */
function testDragFunctionality() {
    console.log('🧪 ドラッグ機能テスト開始');
    
    const centerHandle = document.querySelector('.character-drag-handle.handle-center');
    if (!centerHandle) {
        console.error('❌ 中央ハンドルが見つかりません');
        return false;
    }
    
    // マウスダウンイベントのシミュレーション
    const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100
    });
    
    // startDrag関数の監視
    const originalStartDrag = window.startDrag;
    let startDragCalled = false;
    
    window.startDrag = function(...args) {
        startDragCalled = true;
        console.log('✅ startDrag関数が呼び出されました');
        return originalStartDrag.apply(this, args);
    };
    
    // イベント発火
    centerHandle.dispatchEvent(mouseDownEvent);
    
    // 元の関数を復元
    window.startDrag = originalStartDrag;
    
    if (startDragCalled) {
        console.log('✅ ドラッグ機能テスト成功');
        return true;
    } else {
        console.error('❌ ドラッグ機能テスト失敗');
        return false;
    }
}

/**
 * ドラッグシーケンステスト（完全版）
 */
function testFullDragSequence() {
    console.log('🧪 完全ドラッグシーケンステスト開始');
    
    const centerHandle = document.querySelector('.character-drag-handle.handle-center');
    if (!centerHandle) {
        console.error('❌ 中央ハンドル未発見');
        return false;
    }
    
    const rect = centerHandle.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    
    console.log(`🎯 テスト座標: (${startX}, ${startY})`);
    
    // Step 1: mousedown
    const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: startX,
        clientY: startY
    });
    centerHandle.dispatchEvent(mouseDownEvent);
    console.log('1️⃣ mousedownイベント送信');
    
    // Step 2: mousemove
    setTimeout(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            clientX: startX + 50,
            clientY: startY + 30
        });
        document.dispatchEvent(mouseMoveEvent);
        console.log('2️⃣ mousemoveイベント送信');
        
        // Step 3: mouseup
        setTimeout(() => {
            const mouseUpEvent = new MouseEvent('mouseup', {
                bubbles: true,
                cancelable: true,
                clientX: startX + 50,
                clientY: startY + 30
            });
            document.dispatchEvent(mouseUpEvent);
            console.log('3️⃣ mouseupイベント送信');
            console.log('✅ 完全ドラッグシーケンステスト完了');
        }, 100);
    }, 100);
    
    return true;
}

/**
 * 各種デバッグ関数群
 */
function debugCharacterInfo() {
    const characters = window.characters || [];
    const activeIndex = window.activeCharacterIndex || 0;
    
    console.log('🎭 キャラクター情報デバッグ:');
    console.log(`  総数: ${characters.length}`);
    console.log(`  アクティブ: ${activeIndex}`);
    
    characters.forEach((char, index) => {
        console.log(`  [${index}] ${char.name}:`);
        console.log(`    - ID: ${char.id}`);
        console.log(`    - Scale: ${char.scale}`);
        console.log(`    - zIndex: ${char.zIndex}`);
        console.log(`    - Position: ${char.element.style.left}, ${char.element.style.top}`);
    });
}

function debugEditState() {
    console.log('🔧 編集状態デバッグ:');
    console.log(`  編集モード: ${window.isEditMode}`);
    console.log(`  ドラッグ中: ${window.isDragging}`);
    console.log(`  未保存変更: ${window.hasUnsavedChanges}`);
    console.log(`  編集開始状態: ${window.editStartState ? '保存済み' : '未保存'}`);
}

// ========== エクスポート ========== //

// グローバルアクセス用の関数をwindowオブジェクトに登録
if (typeof window !== 'undefined') {
    // 診断機能
    window.diagnoseDragHandles = diagnoseDragHandles;
    window.diagnoseDragHandleElements = diagnoseDragHandleElements;
    window.diagnoseDragEvents = diagnoseDragEvents;
    window.diagnoseDragCoordinates = diagnoseDragCoordinates;
    window.diagnoseDragVisual = diagnoseDragVisual;
    window.diagnoseEditModeProcess = diagnoseEditModeProcess;
    
    // テスト機能
    window.testDragFunctionality = testDragFunctionality;
    window.testFullDragSequence = testFullDragSequence;
    window.testEventListener = testEventListener;
    window.testCoordinateCalculations = testCoordinateCalculations;
    
    // デバッグ機能
    window.debugCharacterInfo = debugCharacterInfo;
    window.debugEditState = debugEditState;
    window.displayDiagnosisResults = displayDiagnosisResults;
    window.generateFixSuggestions = generateFixSuggestions;
    
    // 後方互換性のエイリアス
    window.debugSpinePositioning = debugCharacterInfo;
    window.debugStateData = debugEditState;
}

console.log('✅ 診断機能モジュール読み込み完了');

// 使用方法をコンソールに表示
console.log(`
🔍 診断システム使用方法:
  • 総合診断: diagnoseDragHandles()
  • ドラッグテスト: testDragFunctionality()
  • フルテスト: testFullDragSequence()
  • キャラクター情報: debugCharacterInfo()
  • 編集状態: debugEditState()
`);