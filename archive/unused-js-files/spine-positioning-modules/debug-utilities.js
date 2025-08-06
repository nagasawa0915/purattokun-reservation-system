// 🎯 Spine編集システム - デバッグ・診断ユーティリティモジュール
// 役割: 緊急診断、多重復元システム、継続監視、デバッグ機能

console.log('🚀 デバッグ・診断ユーティリティモジュール読み込み開始');

// ========== 緊急診断システム ========== //

// 🚨 緊急診断：リロード後位置保存失敗の完全調査
function emergencyDiagnostic() {
    console.log('🚨 === 緊急診断開始：リロード後位置保存失敗 ===');
    
    // Step 1: localStorage完全診断
    diagnosisLocalStorage();
    
    // Step 2: DOM要素検出診断
    diagnosisDOMElements();
    
    // Step 3: 復元処理実行状況診断
    diagnosisRestoreProcess();
    
    // Step 4: CSS競合診断
    diagnosisCSSConflicts();
    
    console.log('🚨 === 緊急診断完了 ===');
}

// localStorage完全診断
function diagnosisLocalStorage() {
    console.log('📦 === localStorage完全診断 ===');
    
    const saved = localStorage.getItem('spine-positioning-state');
    console.log('Step 1 - 存在確認:', !!saved);
    
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            console.log('Step 2 - 生データ:', saved);
            console.log('Step 3 - パース結果:', parsed);
            
            // データ整合性チェック
            const integrity = {
                has_character_section: !!(parsed && parsed.character),
                has_left: !!(parsed.character && parsed.character.left),
                has_top: !!(parsed.character && parsed.character.top),
                has_width: !!(parsed.character && parsed.character.width),
                left_is_percent: !!(parsed.character && parsed.character.left && parsed.character.left.includes('%')),
                top_is_percent: !!(parsed.character && parsed.character.top && parsed.character.top.includes('%')),
                width_is_percent: !!(parsed.character && parsed.character.width && parsed.character.width.includes('%'))
            };
            
            console.log('Step 4 - データ整合性:', integrity);
            
            const isValid = integrity.has_character_section && 
                           integrity.has_left && integrity.has_top && integrity.has_width &&
                           integrity.left_is_percent && integrity.top_is_percent && integrity.width_is_percent;
            
            console.log('Step 5 - 有効性判定:', isValid ? '✅ 有効' : '❌ 無効');
            
            if (!isValid) {
                console.warn('⚠️ localStorage データが無効です:', {
                    expected: '{ character: { left: "XX%", top: "YY%", width: "ZZ%" } }',
                    actual: parsed
                });
            }
            
        } catch (e) {
            console.error('❌ localStorage パースエラー:', e);
        }
    } else {
        console.log('📝 localStorage は空です');
    }
}

// DOM要素検出診断
function diagnosisDOMElements() {
    console.log('🎯 === DOM要素検出診断 ===');
    
    // 複数のセレクターで要素検出を試行
    const selectors = [
        '[data-spine-character="purattokun"]',
        '#purattokun-canvas',
        '#purattokun-fallback',
        'canvas[data-spine-character]',
        '.character-wrapper'
    ];
    
    console.log('Step 1 - 複数セレクター検出テスト:');
    selectors.forEach((selector, index) => {
        const element = document.querySelector(selector);
        console.log(`  ${index + 1}. ${selector}:`, element ? '✅ 発見' : '❌ なし');
        if (element) {
            console.log(`     要素詳細:`, {
                tagName: element.tagName,
                id: element.id,
                className: element.className,
                style_left: element.style.left,
                style_top: element.style.top,
                style_width: element.style.width
            });
        }
    });
    
    // 現在のcharacter変数の状態
    const character = window.character;
    console.log('Step 2 - character変数状態:', {
        exists: !!character,
        element: character ? character.tagName + (character.id ? '#' + character.id : '') : 'null',
        current_style: character ? {
            left: character.style.left,
            top: character.style.top,
            width: character.style.width,
            position: character.style.position
        } : 'null'
    });
}

// 復元処理実行状況診断
function diagnosisRestoreProcess() {
    console.log('🔄 === 復元処理実行状況診断 ===');
    
    // setupCharacterInitialState が呼ばれているか確認
    console.log('Step 1 - 復元関数チェック:');
    console.log('  loadSavedState:', typeof window.loadSavedState);
    console.log('  setupCharacterInitialState:', typeof window.setupCharacterInitialState);
    console.log('  initializeDOMElements:', typeof window.initializeDOMElements);
    
    // savedState変数の状態
    console.log('Step 2 - savedState変数:', window.savedState);
    
    // DOMContentLoaded イベントの確認
    console.log('Step 3 - DOM状態:');
    console.log('  readyState:', document.readyState);
    console.log('  body exists:', !!document.body);
    
    // 復元処理のタイミング問題チェック
    console.log('Step 4 - タイミング分析:');
    const character = window.character;
    if (character) {
        const computedStyle = window.getComputedStyle(character);
        console.log('  computedStyle transform:', computedStyle.transform);
        console.log('  inline style:', character.style.cssText);
        console.log('  parent element:', character.parentElement ? character.parentElement.tagName : 'null');
    }
}

// CSS競合診断
function diagnosisCSSConflicts() {
    console.log('🎨 === CSS競合診断 ===');
    
    const character = window.character;
    if (!character) {
        console.warn('❌ character要素がないため、CSS診断をスキップ');
        return;
    }
    
    const computedStyle = window.getComputedStyle(character);
    const conflicts = [];
    
    // 1. position プロパティ
    if (computedStyle.position !== 'absolute') {
        conflicts.push(`position: ${computedStyle.position} (expected: absolute)`);
    }
    
    // 2. transform プロパティの競合
    if (computedStyle.transform !== 'none' && !computedStyle.transform.includes('translate(-50%, -50%)')) {
        conflicts.push(`unexpected transform: ${computedStyle.transform}`);
    }
    
    // 3. left/top プロパティの設定状況
    if (!character.style.left || !character.style.left.includes('%')) {
        conflicts.push(`left not set as percentage: ${character.style.left}`);
    }
    if (!character.style.top || !character.style.top.includes('%')) {
        conflicts.push(`top not set as percentage: ${character.style.top}`);
    }
    
    // 4. 外部CSSの影響チェック
    const stylesheets = Array.from(document.styleSheets);
    console.log('Step 1 - 外部CSS影響分析:');
    console.log('  適用中のスタイルシート数:', stylesheets.length);
    
    console.log('Step 2 - CSS競合検出結果:');
    if (conflicts.length > 0) {
        console.warn('⚠️ CSS競合を検出:', conflicts);
    } else {
        console.log('✅ CSS競合は検出されませんでした');
    }
    
    // 5. 計算値 vs インライン値の比較
    console.log('Step 3 - スタイル値比較:');
    console.log('  inline vs computed:', {
        left: { inline: character.style.left, computed: computedStyle.left },
        top: { inline: character.style.top, computed: computedStyle.top },
        width: { inline: character.style.width, computed: computedStyle.width }
    });
}

// ========== 多重復元システム ========== //

// 🆕 多重復元システム：複数の方法で確実に復元実行（HTML設定制御システム競合対策版）
function multiRestoreSystem() {
    console.log('🔄 === 多重復元システム開始（競合対策版） ===');
    
    const savedData = localStorage.getItem('spine-positioning-state');
    if (!savedData) {
        console.warn('⚠️ localStorage に保存データがありません');
        return false;
    }
    
    let loadedState;
    try {
        loadedState = JSON.parse(savedData);
    } catch (e) {
        console.error('❌ localStorage データの解析に失敗:', e);
        return false;
    }
    
    if (!loadedState.character) {
        console.warn('⚠️ 保存データに character セクションがありません');
        return false;
    }
    
    console.log('📊 復元データ確認:', loadedState.character);
    
    // 🚨 **競合対策**: HTML設定制御システムを無効化
    if (typeof window.disableHTMLConfigSystem === 'function') {
        window.disableHTMLConfigSystem();
    }
    
    // Method 1: 複数セレクターでの要素検出・復元
    const selectors = [
        '[data-spine-character="purattokun"]',
        '#purattokun-canvas',
        '#purattokun-fallback',
        'canvas[data-spine-character]',
        '.character-wrapper'
    ];
    
    let restoredCount = 0;
    
    // 各セレクターで要素を発見して復元を試行
    selectors.forEach((selector, index) => {
        const element = document.querySelector(selector);
        if (element) {
            console.log(`🎯 Method ${index + 1} - ${selector} で要素発見`);
            const success = attemptRestore(element, loadedState.character, `Method${index + 1}`);
            if (success) {
                restoredCount++;
            }
        }
    });
    
    // Method 2: 定期的なリトライ復元（タイミング問題対策）
    let retryCount = 0;
    const maxRetries = 10;
    const retryInterval = setInterval(() => {
        retryCount++;
        console.log(`🔄 リトライ復元 ${retryCount}/${maxRetries}`);
        
        const element = document.querySelector('#purattokun-canvas') || 
                       document.querySelector('[data-spine-character="purattokun"]') ||
                       document.querySelector('#purattokun-fallback');
        
        if (element && (!element.style.left || !element.style.left.includes('%'))) {
            const success = attemptRestore(element, loadedState.character, `Retry${retryCount}`);
            if (success) {
                console.log('✅ リトライ復元成功');
                clearInterval(retryInterval);
            }
        }
        
        if (retryCount >= maxRetries) {
            console.warn('⚠️ リトライ復元が最大回数に達しました');
            clearInterval(retryInterval);
        }
    }, 500);
    
    // Method 3: 遅延復元（CSS読み込み完了後）
    setTimeout(() => {
        console.log('🕐 遅延復元実行');
        const element = document.querySelector('#purattokun-canvas') || 
                       document.querySelector('[data-spine-character="purattokun"]');
        if (element) {
            attemptRestore(element, loadedState.character, 'DelayedRestore');
        }
    }, 2000);
    
    // Method 4: 🚨 継続監視システム（最強の復元保証）
    startContinuousRestoreMonitoring(loadedState.character);
    
    console.log(`✅ 多重復元システム初期化完了 - ${restoredCount}個の要素で復元試行 + 継続監視開始`);
    return restoredCount > 0;
}

// 復元実行ヘルパー関数
function attemptRestore(element, restoreData, methodName) {
    if (!element || !restoreData) {
        console.warn(`❌ ${methodName}: 要素またはデータが無効`);
        return false;
    }
    
    try {
        console.log(`🔧 ${methodName} 復元実行:`, {
            element: element.tagName + (element.id ? '#' + element.id : ''),
            data: restoreData
        });
        
        // !important 相当の強制適用
        const forceWidth = parseFloat(restoreData.width);
        const forceHeight = forceWidth / (1/1); // 1:1縦横比維持（正方形）
        
        element.style.cssText += `
            position: absolute !important;
            left: ${restoreData.left} !important;
            top: ${restoreData.top} !important;
            width: ${restoreData.width} !important;
            height: ${forceHeight}% !important;
        `;
        
        // 復元確認
        setTimeout(() => {
            const verification = {
                left: element.style.left,
                top: element.style.top,
                width: element.style.width,
                success: element.style.left === restoreData.left && 
                        element.style.top === restoreData.top && 
                        element.style.width === restoreData.width
            };
            
            console.log(`📊 ${methodName} 復元結果:`, verification);
            
            if (!verification.success) {
                console.warn(`⚠️ ${methodName} 復元後に値が変更されました。再適用します。`);
                // 再適用
                element.style.left = restoreData.left;
                element.style.top = restoreData.top;
                element.style.width = restoreData.width;
                element.style.height = forceHeight + '%';
            }
        }, 100);
        
        return true;
        
    } catch (e) {
        console.error(`❌ ${methodName} 復元エラー:`, e);
        return false;
    }
}

// ========== 継続監視システム ========== //

// 🚨 継続監視システム：位置が変更されたら即座に復元
let continuousMonitoringInterval = null;

function startContinuousRestoreMonitoring(restoreData) {
    console.log('👁️ 継続監視システム開始（位置変更を監視）');
    
    // 既存の監視を停止
    if (continuousMonitoringInterval) {
        clearInterval(continuousMonitoringInterval);
    }
    
    continuousMonitoringInterval = setInterval(() => {
        const element = document.querySelector('#purattokun-canvas') || 
                       document.querySelector('[data-spine-character="purattokun"]') ||
                       document.querySelector('#purattokun-fallback');
        
        if (element && restoreData) {
            const currentLeft = element.style.left;
            const currentTop = element.style.top;
            const currentWidth = element.style.width;
            
            // 位置が保存データと異なる場合は即座に復元
            if (currentLeft !== restoreData.left || 
                currentTop !== restoreData.top || 
                currentWidth !== restoreData.width) {
                
                console.log('🚨 位置変更検出！即座に復元実行:', {
                    expected: restoreData,
                    actual: { left: currentLeft, top: currentTop, width: currentWidth }
                });
                
                // 強制復元実行
                attemptRestore(element, restoreData, 'ContinuousMonitor');
            }
        }
    }, 1000); // 1秒ごとに監視
    
    console.log('✅ 継続監視システム起動完了（1秒間隔）');
}

// 継続監視システム停止
function stopContinuousRestoreMonitoring() {
    if (continuousMonitoringInterval) {
        clearInterval(continuousMonitoringInterval);
        continuousMonitoringInterval = null;
        console.log('🛑 継続監視システム停止');
        return true;
    }
    return false;
}

// ========== 従来のデバッグ機能 ========== //

// 位置保存・復元システムの詳細診断（従来版も保持）
function debugPositioningSystem() {
    console.log('🔍 位置保存・復元システム詳細診断:');
    
    // 1. localStorage状態確認
    const savedData = localStorage.getItem('spine-positioning-state');
    console.log('📦 localStorage状態:', {
        exists: !!savedData,
        raw_data: savedData,
        parsed_data: savedData ? JSON.parse(savedData) : null
    });
    
    // 2. character要素状態確認
    const character = window.character;
    if (character) {
        const computedStyle = window.getComputedStyle(character);
        console.log('🎯 character要素状態:', {
            element: character.tagName + (character.id ? '#' + character.id : ''),
            inline_style: {
                left: character.style.left,
                top: character.style.top,
                width: character.style.width,
                position: character.style.position
            },
            computed_style: {
                left: computedStyle.left,
                top: computedStyle.top,
                width: computedStyle.width,
                position: computedStyle.position
            },
            bounding_rect: character.getBoundingClientRect()
        });
    } else {
        console.warn('❌ character要素がnullです');
    }
    
    // 3. savedState変数状態確認
    console.log('💾 savedState変数状態:', window.savedState);
    
    // 4. 動的取得テスト
    if (character && typeof window.getDynamicCharacterState === 'function') {
        const dynamicResult = window.getDynamicCharacterState(character);
        console.log('🔄 動的取得テスト結果:', dynamicResult);
    }
}

// localStorage完全クリア（デバッグ用）
function clearAllPositionData() {
    localStorage.removeItem('spine-positioning-state');
    console.log('🗑️ localStorage位置データを完全削除しました');
    console.log('🔄 リロードして動作確認してください');
}

// 強制的に保存状態を復元（デバッグ用・従来版も保持）
function forceRestoreState() {
    const character = window.character;
    if (!character) {
        console.error('❌ character要素がnullです');
        return;
    }
    
    const savedData = localStorage.getItem('spine-positioning-state');
    if (savedData) {
        const loadedState = JSON.parse(savedData);
        if (loadedState.character) {
            const forceWidth = parseFloat(loadedState.character.width);
            const forceHeight = forceWidth / (1/1); // 1:1縦横比維持（正方形）
            character.style.left = loadedState.character.left;
            character.style.top = loadedState.character.top;
            character.style.width = loadedState.character.width;
            character.style.height = forceHeight + '%'; // 縦横比維持
            character.style.position = 'absolute';
            
            console.log('🔧 強制復元完了:', {
                applied: loadedState.character,
                result: {
                    left: character.style.left,
                    top: character.style.top,
                    width: character.style.width,
                    height: character.style.height // 縦横比維持確認用
                }
            });
        } else {
            console.warn('❌ 保存データが無効です');
        }
    } else {
        console.warn('❌ 保存データが存在しません');
    }
}

// 🔍 ハンドル表示診断機能
function debugHandleVisibility() {
    console.log('🔍 === ハンドル表示診断開始 ===');
    
    // Step 1: character要素の確認
    const character = window.character;
    if (!character) {
        console.error('❌ character要素がnull');
        return false;
    }
    
    console.log('✅ character要素確認:', {
        element: character.tagName + (character.id ? '#' + character.id : ''),
        classes: character.className,
        hasEditMode: character.classList.contains('edit-mode')
    });
    
    // Step 2: ハンドル要素の確認
    const handles = character.querySelectorAll('.handle');
    console.log('🎯 ハンドル要素確認:', {
        count: handles.length,
        expected: 9
    });
    
    handles.forEach((handle, index) => {
        const computedStyle = window.getComputedStyle(handle);
        console.log(`Handle ${index + 1}:`, {
            classes: handle.className,
            position: handle.dataset.position,
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            zIndex: computedStyle.zIndex,
            background: computedStyle.backgroundColor,
            rect: handle.getBoundingClientRect()
        });
    });
    
    // Step 3: 編集モード状態確認
    console.log('📊 編集モード状態:', {
        isCharacterEditMode: window.isCharacterEditMode,
        isDragging: window.isDragging,
        isResizing: window.isResizing
    });
    
    console.log('🔍 === ハンドル表示診断完了 ===');
    return handles.length === 9;
}

// 🚨 総合デバッグコマンド：一括診断・修正機能
function ultimatePositionFix() {
    console.log('🚨 === 総合位置修正システム開始 ===');
    console.log('🔧 Step 1: 緊急診断を実行');
    emergencyDiagnostic();
    
    setTimeout(() => {
        console.log('🔧 Step 2: HTML設定制御システムを無効化');
        if (typeof window.disableHTMLConfigSystem === 'function') {
            window.disableHTMLConfigSystem();
        }
        
        setTimeout(() => {
            console.log('🔧 Step 3: 多重復元システムを実行');
            multiRestoreSystem();
            
            setTimeout(() => {
                console.log('🔧 Step 4: 状態強制復元を実行');
                forceRestoreState();
                
                setTimeout(() => {
                    console.log('✅ === 総合位置修正システム完了 ===');
                    console.log('🔍 位置が正しく復元されているか確認してください');
                    console.log('💡 継続監視システムが動作中です（1秒間隔）');
                }, 1000);
            }, 1000);
        }, 500);
    }, 1000);
}

// ========== グローバル関数エクスポート（互換性維持） ========== //

// === 🚨 緊急デバッグ関数（リロード後位置保存失敗対応・HTML設定制御システム競合対策版） ===
window.emergencyDiagnostic = emergencyDiagnostic;                      // 🚨 完全診断
window.multiRestoreSystem = multiRestoreSystem;                        // 🔄 多重復元システム（競合対策版）
window.diagnosisLocalStorage = diagnosisLocalStorage;                  // 📦 localStorage診断
window.diagnosisDOMElements = diagnosisDOMElements;                     // 🎯 DOM要素診断
window.diagnosisRestoreProcess = diagnosisRestoreProcess;              // 🔄 復元処理診断
window.diagnosisCSSConflicts = diagnosisCSSConflicts;                 // 🎨 CSS競合診断
window.startContinuousRestoreMonitoring = startContinuousRestoreMonitoring; // 👁️ 継続監視開始
window.stopContinuousRestoreMonitoring = stopContinuousRestoreMonitoring;   // 🛑 継続監視停止
window.attemptRestore = attemptRestore;                                // 🔧 復元実行ヘルパー

// === 従来のデバッグ関数（互換性保持） ===
window.debugPositioningSystem = debugPositioningSystem;
window.clearAllPositionData = clearAllPositionData;
window.forceRestoreState = forceRestoreState;
window.debugHandleVisibility = debugHandleVisibility;
window.ultimatePositionFix = ultimatePositionFix;

console.log('✅ デバッグ・診断ユーティリティモジュール読み込み完了');
console.log('💡 緊急コマンド: ultimatePositionFix() - 一括診断・修正を実行');
console.log('💡 個別デバッグ: emergencyDiagnostic(), multiRestoreSystem(), debugPositioningSystem()');