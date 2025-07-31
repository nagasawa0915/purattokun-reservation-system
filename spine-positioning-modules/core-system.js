// 🎯 Spine編集システム - コアシステム・状態管理モジュール
// 役割: DOM初期化、状態管理、保存・復元処理

console.log('🚀 コアシステムモジュール読み込み開始');

// ========== エクスポート対象の変数・状態 ========== //

// 編集モード制御
let isCharacterEditMode = false;

// 操作状態
let isDragging = false;
let isResizing = false;
let activeHandle = null;

// マウス操作記録
let startMousePos = { x: 0, y: 0 };
let startElementState = {};

// DOM要素参照
let character = null;
let editConfirmPanel = null;
let coordinateDisplay = null;

// 保存状態（localStorage用・%座標系統一・動的CSS値取得）
let savedState = {
    character: { left: null, top: null, width: null }
    // ☝️ 初期化時に実際のCSS値から動的に取得される
};

// 継続監視用のinterval ID
let restoreMonitoringInterval = null;

console.log('✅ コアシステム基本設定完了');

// ========== 汎用性システム：動的CSS値取得 ========== //

function getDynamicCharacterState(character) {
    console.log('🔍 動的CSS値取得開始');
    
    if (!character) {
        console.error('❌ character要素がnullです');
        // 🔧 汎用性フォールバック（シーンに依存しない中央配置・縦横比維持）
        console.warn('⚠️ フォールバック値を使用: 中央配置の汎用値（縦横比維持）');
        const fallbackWidth = 20; // 20%
        const fallbackHeight = fallbackWidth / (1/1); // 1:1縦横比維持（正方形）
        return { 
            left: '50%', 
            top: '50%', 
            width: fallbackWidth + '%',
            height: fallbackHeight + '%' // 縦横比維持
        }; // どのシーンでも安全な中央配置
    }
    
    // 🎯 getComputedStyleで実際のブラウザ計算値を取得
    const computedStyle = window.getComputedStyle(character);
    const parentRect = character.parentElement.getBoundingClientRect();
    
    // px値を%に変換
    const computedLeftPx = parseFloat(computedStyle.left);
    const computedTopPx = parseFloat(computedStyle.top);
    const computedWidthPx = parseFloat(computedStyle.width);
    
    const computedLeftPercent = ((computedLeftPx / parentRect.width) * 100).toFixed(1);
    const computedTopPercent = ((computedTopPx / parentRect.height) * 100).toFixed(1);
    const computedWidthPercent = ((computedWidthPx / parentRect.width) * 100).toFixed(1);
    
    // 🔧 修正: 縦横比維持のheightも追加
    const dynamicHeightPercent = (computedWidthPercent / (1/1)).toFixed(1); // 1:1縦横比維持（正方形）
    const dynamicState = {
        left: computedLeftPercent + '%',
        top: computedTopPercent + '%',
        width: computedWidthPercent + '%',
        height: dynamicHeightPercent + '%' // 縦横比維持
    };
    
    console.log('✅ 動的CSS値取得完了:', {
        computed_px: {
            left: computedLeftPx + 'px',
            top: computedTopPx + 'px', 
            width: computedWidthPx + 'px'
        },
        computed_percent: dynamicState,
        aspect_ratio_maintained: '1:1 (width:height)',
        正方形_aspect_ratio: '1:1',
        element: character.tagName + (character.id ? '#' + character.id : '')
    });
    
    return dynamicState;
}

// ========== DOM初期化システム ========== //

function initializeDOMElements() {
    console.log('🔧 DOM初期化開始');
    
    // キャラクター要素を取得
    character = document.querySelector('#purattokun-canvas') || 
               document.querySelector('canvas[data-spine-character]') ||
               document.querySelector('#purattokun-fallback');
    
    if (!character) {
        console.error('❌ キャラクター要素が見つかりません');
        return false;
    }
    
    console.log('✅ キャラクター要素取得:', character.tagName);

    // Canvas要素の場合、ラッパーを作成
    if (character.tagName === 'CANVAS') {
        console.log('⚠️ Canvas要素検出: ラッパーを作成します');
        
        // 既存のラッパーがあるかチェック
        let existingWrapper = character.parentElement;
        if (existingWrapper && existingWrapper.classList.contains('character-wrapper')) {
            console.log('🔄 既存のラッパーを再利用します');
            character = existingWrapper;
        } else {
            // Canvas要素のラッパー作成処理
            createCanvasWrapper();
        }
    }
    
    // 🔧 **緊急修正**: 処理順序の最適化（多重復元システム統合）
    // 1. まずlocalStorageから保存状態を読み込む
    loadSavedState();
    
    // 2. 初期状態設定（character要素が確実に取得された後に実行）
    if (character) {
        // 🎯 **最重要**: setupCharacterInitialState()が保存状態復元を担当
        setupCharacterInitialState();
        
        // 🆕 **緊急追加**: 多重復元システムを並行実行（確実な復元のため）
        setTimeout(() => {
            console.log('🚨 多重復元システム起動（通常ページ読み込み時）');
            multiRestoreSystem();
        }, 100);
        
        // 復元結果の最終確認（デバッグ用）
        setTimeout(() => {
            console.log('🔍 最終状態確認:', {
                character_style: {
                    left: character.style.left,
                    top: character.style.top,
                    width: character.style.width,
                    height: character.style.height // 縦横比維持確認用
                },
                saved_state: savedState.character
            });
            
            // 🚨 **緊急診断**: 復元失敗の場合は詳細診断を実行
            if (!character.style.left || !character.style.left.includes('%')) {
                console.warn('⚠️ 復元が失敗している可能性があります。緊急診断を実行します。');
                setTimeout(() => {
                    if (typeof emergencyDiagnostic === 'function') {
                        emergencyDiagnostic();
                    }
                }, 500);
            }
        }, 300);
    } else {
        console.warn('⚠️ character要素がnullのため、初期状態設定をスキップ');
        
        // 🆕 **緊急対策**: character要素がnullでも多重復元システムを実行
        setTimeout(() => {
            console.log('🚨 character要素null - 多重復元システムで要素検出を試行');
            multiRestoreSystem();
        }, 500);
    }
    
    console.log('✅ DOM初期化完了');
    return true;
}

// Canvas要素のラッパー作成処理（内部関数）
function createCanvasWrapper() {
    // 🎯 修正: CSS位置値を直接取得（transform前の値）
    const computedStyle = window.getComputedStyle(character);
    const parentRect = character.parentElement.getBoundingClientRect();
    const canvasRect = character.getBoundingClientRect();
    
    console.log('🔍 Canvas要素の現在の状態:', {
        element: character.tagName + (character.id ? '#' + character.id : ''),
        style: {
            left: character.style.left || 'not set',
            top: character.style.top || 'not set',
            transform: character.style.transform || 'not set',
            width: character.style.width || 'not set'
        },
        computed: {
            left: computedStyle.left,
            top: computedStyle.top,
            transform: computedStyle.transform,
            width: computedStyle.width
        },
        rect: {
            left: canvasRect.left,
            top: canvasRect.top,
            width: canvasRect.width,
            height: canvasRect.height
        }
    });
    
    // CSS position値を取得（transform適用前の値）
    const cssLeftPx = parseFloat(computedStyle.left);
    const cssTopPx = parseFloat(computedStyle.top);
    const cssWidthPx = canvasRect.width;  // 実際の表示サイズ
    const cssHeightPx = canvasRect.height; // 実際の表示サイズ
    
    // transformの中心点補正を計算
    const hasTransform = computedStyle.transform !== 'none' && computedStyle.transform !== '';
    let adjustedLeftPx = cssLeftPx;
    let adjustedTopPx = cssTopPx;
    
    // transformの検出（matrix形式の値を解析）
    const transformStr = computedStyle.transform;
    let needsCenterCorrection = false;
    
    // style属性から元のtransform値を確認
    if (character.style.transform && character.style.transform.includes('translate(-50%, -50%)')) {
        needsCenterCorrection = true;
        console.log('✅ style.transformから translate(-50%, -50%) を検出');
    } else if (hasTransform && transformStr.includes('matrix')) {
        // matrix値から実際の変換を解析
        const matrixMatch = transformStr.match(/matrix\(([\d\s,.-]+)\)/);
        if (matrixMatch) {
            const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()));
            const translateX = values[4]; // matrix の5番目の値がX移動
            const translateY = values[5]; // matrix の6番目の値がY移動
            
            // translateの値が要素サイズの約半分なら、translate(-50%, -50%)相当
            if (Math.abs(translateX) > cssWidthPx * 0.4 && Math.abs(translateX) < cssWidthPx * 0.6 &&
                Math.abs(translateY) > cssHeightPx * 0.4 && Math.abs(translateY) < cssHeightPx * 0.6) {
                needsCenterCorrection = true;
                console.log('✅ matrixから translate(-50%, -50%) 相当を検出', {
                    translateX, translateY,
                    halfWidth: cssWidthPx / 2,
                    halfHeight: cssHeightPx / 2
                });
            }
        }
    }
    
    if (needsCenterCorrection) {
        // translate(-50%, -50%)がある場合、左上基準の位置に変換
        // CSS位置は中心点なので、幅/高さの半分を引く
        adjustedLeftPx = cssLeftPx - (cssWidthPx / 2);
        adjustedTopPx = cssTopPx - (cssHeightPx / 2);
        console.log('🔄 Transform補正適用:', {
            original: { left: cssLeftPx, top: cssTopPx },
            adjusted: { left: adjustedLeftPx, top: adjustedTopPx },
            size: { width: cssWidthPx, height: cssHeightPx },
            transform: transformStr
        });
    } else {
        console.log('ℹ️ Transform補正なし:', {
            hasTransform,
            needsCenterCorrection,
            transform: transformStr
        });
    }
    
    const wrapperLeftPercent = ((adjustedLeftPx / parentRect.width) * 100).toFixed(1);
    const wrapperTopPercent = ((adjustedTopPx / parentRect.height) * 100).toFixed(1);
    const wrapperWidthPercent = ((cssWidthPx / parentRect.width) * 100).toFixed(1);
    const wrapperHeightPercent = ((cssHeightPx / parentRect.height) * 100).toFixed(1);
    
    console.log("🔧 ラッパー位置計算（CSS基準・transform補正済み）:", {
        css_position: { 
            left: computedStyle.left, 
            top: computedStyle.top,
            transform: computedStyle.transform
        },
        wrapper_position: {
            left: wrapperLeftPercent + "%",
            top: wrapperTopPercent + "%",
            width: wrapperWidthPercent + "%",
            height: wrapperHeightPercent + "%"
        }
    });
    
    const characterWrapper = document.createElement('div');
    characterWrapper.className = 'character-wrapper demo-character';
    // 🔧 修正: width/heightをパーセンテージで設定（保存値との互換性）
    characterWrapper.style.cssText = `
        position: absolute;
        left: ${wrapperLeftPercent}%;
        top: ${wrapperTopPercent}%;
        width: ${wrapperWidthPercent}%;
        height: ${wrapperHeightPercent}%;
        cursor: move;
        border: 2px dashed rgba(255, 107, 107, 0.3);
        border-radius: 8px;
        transition: border-color 0.3s;
    `;
    
    // Canvas要素をラッパーで包む
    const parent = character.parentElement;
    parent.insertBefore(characterWrapper, character);
    characterWrapper.appendChild(character);
    
    // 🔧 修正: Canvas要素の位置スタイルをリセット（ラッパー内で中央配置）
    character.style.position = 'absolute';
    character.style.left = '50%';
    character.style.top = '50%';
    character.style.transform = 'translate(-50%, -50%)';
    // 🔧 重要修正: Canvas要素はラッパー内で100%サイズ（ラッパーのサイズに従う）
    character.style.width = '100%';
    character.style.height = '100%';
    // 🔧 修正: 元のアスペクト比を維持（spine-sample-simple.htmlは3/2）
    const originalAspectRatio = character.style.aspectRatio || '3/2';
    character.style.aspectRatio = originalAspectRatio;
    
    // characterをラッパーに更新
    character = characterWrapper;
    
    console.log('✅ Canvas要素ラッパー作成完了');
}

function setupCharacterInitialState() {
    console.log('🔧 キャラクター初期状態設定開始（復元優先処理）');
    
    // character要素の存在確認
    if (!character) {
        console.error('❌ setupCharacterInitialState: character要素がnullです');
        return;
    }
    
    console.log('📊 初期状態分析:', {
        current_style: {
            left: character.style.left,
            top: character.style.top,
            width: character.style.width,
            height: character.style.height // 縦横比維持確認用
        },
        saved_state: savedState.character
    });
    
    // 🔧 **重要修正**: 保存状態が存在する場合は保存状態を最優先で復元
    if (savedState.character && savedState.character.left) {
        console.log('💾 保存状态を復元します（最優先処理・HTML設定制御システム競合対策）:', savedState.character);
        
        // 🚨 HTML設定制御システムを一時無効化
        disableHTMLConfigSystem();
        
        // 🔧 修正: 保存された位置とサイズを適用（アスペクト比は自動維持）
        // 強制スタイル適用（CSS競合対策）
        character.style.cssText += `
            position: absolute !important;
            left: ${savedState.character.left} !important;
            top: ${savedState.character.top} !important;
            width: ${savedState.character.width} !important;
        `;
        
        // 復元後の確認
        const afterRestore = {
            left: character.style.left,
            top: character.style.top,
            width: character.style.width
        };
        
        console.log('✅ 保存状態復元完了:', afterRestore);
        
        // 復元処理後の遅延確認（CSSとの競合対策・継続監視開始）
        setTimeout(() => {
            if (character.style.left !== savedState.character.left) {
                console.warn('⚠️ 復元後にスタイルが変更されました。強制再適用します。');
                
                // 再度強制適用
                character.style.cssText += `
                    position: absolute !important;
                    left: ${savedState.character.left} !important;
                    top: ${savedState.character.top} !important;
                    width: ${savedState.character.width} !important;
                `;
                
                console.log('🔧 強制再適用完了:', {
                    left: character.style.left,
                    top: character.style.top,
                    width: character.style.width
                });
            } else {
                console.log('✅ 復元状態が維持されています');
            }
            
            // 🚨 継続監視システムを開始（最重要）
            startContinuousRestoreMonitoring(savedState.character);
        }, 100);
        
    } else {
        // 保存状態がない場合のみ動的取得を実行
        console.log('📝 保存状態が存在しません。動的取得を実行します。');
        const dynamicState = getDynamicCharacterState(character);
        
        // savedStateを初期化
        savedState.character = dynamicState;
        console.log('✅ savedState初期化（動的取得）:', savedState.character);
        
        // インラインスタイルがない場合のみ、動的取得値で設定
        if (!character.style.left) {
            character.style.left = dynamicState.left;
            console.log('✅ left設定:', dynamicState.left);
        }
        if (!character.style.top) {
            character.style.top = dynamicState.top;
            console.log('✅ top設定:', dynamicState.top);
        }
        if (!character.style.width) {
            character.style.width = dynamicState.width;
            console.log('✅ width設定:', dynamicState.width);
        }
    }
    
    // 基本設定は常に適用
    character.style.position = 'absolute';
    
    console.log('✅ キャラクター初期状態設定完了（復元優先処理）:', {
        left: character.style.left,
        top: character.style.top,
        width: character.style.width
    });
}

// ========== ローカルストレージ管理 ========== //

function loadSavedState() {
    console.log('💾 保存状態読み込み開始');
    
    try {
        const saved = localStorage.getItem('spine-positioning-state');
        if (saved) {
            const parsedState = JSON.parse(saved);
            console.log('✅ localStorage読み込み成功:', parsedState);
            
            // savedStateに反映
            if (parsedState.character) {
                savedState.character = parsedState.character;
                console.log('✅ character状態復元:', savedState.character);
            }
        } else {
            console.log('ℹ️ 保存状態が存在しません（初回起動）');
        }
    } catch (e) {
        console.warn('⚠️ localStorage読み込みエラー:', e);
        savedState = { character: { left: null, top: null, width: null } };
    }
    
    console.log('✅ 保存状態読み込み完了:', savedState);
}

function saveState() {
    console.log('💾 状態保存開始');
    
    if (!character) {
        console.warn('⚠️ character要素がnullのため保存をスキップ');
        return;
    }
    
    // 現在の状態を取得
    const currentState = {
        character: {
            left: character.style.left,
            top: character.style.top,
            width: character.style.width
        }
    };
    
    try {
        localStorage.setItem('spine-positioning-state', JSON.stringify(currentState));
        console.log('✅ 状態保存完了:', currentState);
        
        // savedStateも更新
        savedState = currentState;
    } catch (e) {
        console.error('❌ 状態保存エラー:', e);
    }
}

// ========== 編集モード制御 ========== //

function confirmEdit() {
    console.log('✅ 編集確定');
    
    // 現在の状態を保存
    saveState();
    
    // 編集モード終了
    endEditMode();
}

function cancelEdit() {
    console.log('❌ 編集キャンセル');
    
    // 保存状態に復元
    if (savedState.character && savedState.character.left && character) {
        character.style.left = savedState.character.left;
        character.style.top = savedState.character.top;
        character.style.width = savedState.character.width;
        console.log('🔄 編集前の状態に復元:', savedState.character);
    }
    
    // 編集モード終了
    endEditMode();
}

function endEditMode() {
    console.log('🔚 編集モード終了');
    
    isCharacterEditMode = false;
    isDragging = false;
    isResizing = false;
    activeHandle = null;
    
    // UI要素を非表示
    if (typeof hideConfirmPanel === 'function') {
        hideConfirmPanel();
    }
    if (coordinateDisplay) {
        coordinateDisplay.style.display = 'none';
    }
    
    // ハンドルを削除
    const handles = document.querySelectorAll('.resize-handle');
    handles.forEach(handle => handle.remove());
    
    // ボーダーを非表示
    if (character) {
        character.style.border = 'none';
    }
    
    console.log('✅ 編集モード終了完了');
}

function endCharacterEditMode() {
    endEditMode();
}

// ========== HTML設定制御システム制御 ========== //

function disableHTMLConfigSystem() {
    console.log('🚨 HTML設定制御システムを無効化します');
    
    // #purattokun-config 要素を無効化
    const configElement = document.getElementById('purattokun-config');
    if (configElement) {
        configElement.setAttribute('data-disabled', 'true');
        console.log('✅ #purattokun-config を無効化しました');
    }
    
    // Spine統合システムの設定読み込みを無効化
    if (window.spineCharacterManager && window.spineCharacterManager.disableConfigReload) {
        window.spineCharacterManager.disableConfigReload();
        console.log('✅ Spine統合システムの設定読み込みを無効化しました');
    }
}

function restoreHTMLConfigSystem() {
    console.log('🔄 HTML設定制御システムを復元します');
    
    // #purattokun-config 要素を有効化
    const configElement = document.getElementById('purattokun-config');
    if (configElement) {
        configElement.removeAttribute('data-disabled');
        console.log('✅ #purattokun-config を有効化しました');
    }
    
    // Spine統合システムの設定読み込みを有効化
    if (window.spineCharacterManager && window.spineCharacterManager.enableConfigReload) {
        window.spineCharacterManager.enableConfigReload();
        console.log('✅ Spine統合システムの設定読み込みを有効化しました');
    }
}

// ========== 多重復元システム ========== //

function multiRestoreSystem() {
    console.log('🚨 多重復元システム開始');
    
    // 1. 要素再検出
    if (!character) {
        console.log('🔍 Step 1: 要素再検出を実行');
        character = document.querySelector('#purattokun-canvas') || 
                   document.querySelector('canvas[data-spine-character]') ||
                   document.querySelector('#purattokun-fallback');
        
        if (character) {
            console.log('✅ 要素再検出成功:', character.tagName);
        } else {
            console.warn('⚠️ 要素再検出に失敗しました');
            return;
        }
    }
    
    // 2. localStorage再読み込み
    console.log('🔍 Step 2: localStorage再読み込み');
    loadSavedState();
    
    // 3. 復元実行
    if (savedState.character && savedState.character.left) {
        console.log('🔍 Step 3: 復元実行');
        attemptRestore(character, savedState.character, 'multiRestoreSystem');
    }
    
    // 4. 継続監視開始
    if (savedState.character && savedState.character.left) {
        console.log('🔍 Step 4: 継続監視開始');
        startContinuousRestoreMonitoring(savedState.character);
    }
    
    console.log('✅ 多重復元システム完了');
}

function startContinuousRestoreMonitoring(restoreData) {
    console.log('👀 継続監視システム開始:', restoreData);
    
    // 既存の監視を停止
    stopContinuousRestoreMonitoring();
    
    restoreMonitoringInterval = setInterval(() => {
        if (!character) {
            console.log('⚠️ 継続監視: character要素がnullです');
            return;
        }
        
        // 現在の状態をチェック
        const currentLeft = character.style.left;
        const currentTop = character.style.top;
        const currentWidth = character.style.width;
        
        // 復元データと一致しているかチェック
        if (currentLeft !== restoreData.left || 
            currentTop !== restoreData.top || 
            currentWidth !== restoreData.width) {
            
            console.log('🚨 継続監視: 位置ズレを検出。復元を実行します。', {
                expected: restoreData,
                actual: { left: currentLeft, top: currentTop, width: currentWidth }
            });
            
            // 復元実行
            attemptRestore(character, restoreData, 'continuousMonitoring');
        }
    }, 1000); // 1秒間隔でチェック
    
    console.log('✅ 継続監視システム開始完了（1秒間隔）');
}

function stopContinuousRestoreMonitoring() {
    if (restoreMonitoringInterval) {
        clearInterval(restoreMonitoringInterval);
        restoreMonitoringInterval = null;
        console.log('⏹️ 継続監視システム停止');
    }
}

function attemptRestore(element, restoreData, methodName) {
    console.log(`🔧 復元試行開始 (${methodName}):`, restoreData);
    
    if (!element || !restoreData) {
        console.warn('⚠️ 復元試行: 要素またはデータがnullです');
        return false;
    }
    
    try {
        // 強制スタイル適用
        element.style.cssText += `
            position: absolute !important;
            left: ${restoreData.left} !important;
            top: ${restoreData.top} !important;
            width: ${restoreData.width} !important;
        `;
        
        console.log(`✅ 復元試行完了 (${methodName}):`, {
            left: element.style.left,
            top: element.style.top,
            width: element.style.width
        });
        
        return true;
    } catch (e) {
        console.error(`❌ 復元試行エラー (${methodName}):`, e);
        return false;
    }
}

function forceRestoreState() {
    console.log('🚨 状態強制復元開始');
    
    if (!character) {
        console.warn('⚠️ character要素がnullのため強制復元をスキップ');
        return;
    }
    
    if (!savedState.character || !savedState.character.left) {
        console.warn('⚠️ 保存状態が存在しないため強制復元をスキップ');
        return;
    }
    
    // HTML設定制御システムを無効化
    disableHTMLConfigSystem();
    
    // 強制復元実行
    const success = attemptRestore(character, savedState.character, 'forceRestoreState');
    
    if (success) {
        console.log('✅ 状態強制復元成功');
        
        // 継続監視も開始
        startContinuousRestoreMonitoring(savedState.character);
    } else {
        console.error('❌ 状態強制復元失敗');
    }
}

// ========== エクスポート ========== //

// グローバル変数をwindowオブジェクトに追加（互換性維持）
window.isCharacterEditMode = isCharacterEditMode;
window.isDragging = isDragging;
window.isResizing = isResizing;
window.activeHandle = activeHandle;
window.startMousePos = startMousePos;
window.startElementState = startElementState;
window.character = character;
window.editConfirmPanel = editConfirmPanel;
window.coordinateDisplay = coordinateDisplay;
window.savedState = savedState;

// 関数をwindowオブジェクトに追加（互換性維持）
window.getDynamicCharacterState = getDynamicCharacterState;
window.initializeDOMElements = initializeDOMElements;
window.setupCharacterInitialState = setupCharacterInitialState;
window.loadSavedState = loadSavedState;
window.saveState = saveState;
window.confirmEdit = confirmEdit;
window.cancelEdit = cancelEdit;
window.endEditMode = endEditMode;
window.endCharacterEditMode = endCharacterEditMode;
window.disableHTMLConfigSystem = disableHTMLConfigSystem;
window.restoreHTMLConfigSystem = restoreHTMLConfigSystem;
window.multiRestoreSystem = multiRestoreSystem;
window.startContinuousRestoreMonitoring = startContinuousRestoreMonitoring;
window.stopContinuousRestoreMonitoring = stopContinuousRestoreMonitoring;
window.attemptRestore = attemptRestore;
window.forceRestoreState = forceRestoreState;

console.log('✅ コアシステムモジュール読み込み完了');