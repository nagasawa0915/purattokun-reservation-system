// 🎯 Spine編集システム - デバッグ・診断ツール
// 抽象度: 低（システム状態確認・テスト・診断機能）
// 用途: 開発・デバッグ・トラブルシューティング

console.log('🔍 Spine Debug Tools モジュール読み込み開始');

// ========== 診断機能システム ========== //

/**
 * 🔍 ドラッグハンドル診断機能
 * ユーザーが実行できる診断コマンド群
 */

// ドラッグハンドルの状態診断
function diagnoseDragHandles() {
    console.log('🔍 ドラッグハンドル診断開始');
    
    // 編集モード確認
    if (!SpineEditSystem || !SpineEditSystem.controlLayer.isEditMode) {
        console.log('❌ 編集モードが起動していません');
        console.log('💡 解決策: 編集モードでこのコマンドを実行してください');
        return false;
    }
    
    // ハンドル要素の存在確認
    const handles = document.querySelectorAll('.spine-edit-handle');
    console.log('📍 ハンドル数: ' + handles.length);
    
    if (handles.length === 0) {
        console.log('❌ ドラッグハンドルが見つかりません');
        return false;
    }
    
    // 各ハンドルの状態確認
    handles.forEach((handle, index) => {
        const rect = handle.getBoundingClientRect();
        const style = window.getComputedStyle(handle);
        
        console.log('🎯 ハンドル ' + (index + 1) + ':', {
            position: handle.dataset.position,
            visible: style.display !== 'none',
            size: rect.width + 'x' + rect.height,
            location: rect.left.toFixed(1) + ', ' + rect.top.toFixed(1),
            zIndex: style.zIndex,
            cursor: style.cursor
        });
    });
    
    // ドラッグ状態確認
    const dragModule = SpineEditSystem.controlLayer.dragHandler;
    if (dragModule && dragModule.dragState) {
        console.log('🖱️ ドラッグ状態:', {
            isDragging: dragModule.dragState.isDragging,
            operation: dragModule.dragState.operation,
            activeHandle: dragModule.dragState.activeHandle ? 'あり' : 'なし'
        });
    }
    
    console.log('✅ ドラッグハンドル診断完了');
    return true;
}

// 編集モード状態確認
function isEditMode() {
    const editMode = SpineEditSystem && SpineEditSystem.controlLayer.isEditMode;
    console.log('🎮 編集モード状態:', editMode ? '起動中' : '停止中');
    
    if (!editMode) {
        console.log('💡 編集モードを起動するには:');
        console.log('   1. URL末尾に?edit=trueを追加');
        console.log('   2. ページをリロード');
        console.log('   3. 編集開始ボタンをクリック');
    }
    
    return editMode;
}

// ドラッグハンドルクリックテスト
function testDragHandleClick(position = 'center') {
    console.log('🧪 ハンドルクリックテスト開始 (' + position + ')');
    
    if (!isEditMode()) {
        console.log('❌ 編集モードが必要です');
        return false;
    }
    
    const handle = document.querySelector('[data-position="' + position + '"]');
    if (!handle) {
        console.log('❌ ' + position + 'ハンドルが見つかりません');
        return false;
    }
    
    // クリックイベントをシミュレート
    const rect = handle.getBoundingClientRect();
    const clickEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
    });
    
    console.log('🖱️ ' + position + 'ハンドルをクリック');
    handle.dispatchEvent(clickEvent);
    
    // 状態確認
    setTimeout(() => {
        const dragModule = SpineEditSystem.controlLayer.dragHandler;
        if (dragModule && dragModule.dragState && dragModule.dragState.isDragging) {
            console.log('✅ ドラッグ開始が検出されました');
        } else {
            console.log('❌ ドラッグが開始されませんでした');
        }
    }, 100);
    
    return true;
}

// 編集システム全体診断
function diagnoseEditSystem() {
    console.log('🔍 編集システム全体診断開始');
    console.log('=====================================');
    
    // 基本システム確認
    console.log('📋 基本システム状態:');
    console.log('   - SpineEditSystem: ' + (typeof SpineEditSystem !== 'undefined' ? '✅' : '❌'));
    console.log('   - 編集モード: ' + (isEditMode() ? '✅' : '❌'));
    
    // UI要素確認
    console.log('🎨 UI要素状態:');
    const editingPanel = document.querySelector('.spine-editing-panel');
    console.log('   - 編集パネル: ' + (editingPanel ? '✅' : '❌'));
    
    const titleBar = document.querySelector('.draggable-titlebar');
    console.log('   - ドラッグタイトルバー: ' + (titleBar ? '✅' : '❌'));
    
    // ハンドル診断実行
    console.log('🎯 ハンドル診断:');
    diagnoseDragHandles();
    
    // 対象要素確認
    if (SpineEditSystem && SpineEditSystem.baseLayer) {
        const target = SpineEditSystem.baseLayer.targetElement;
        console.log('🎯 対象要素:', target ? target.id : '未設定');
    }
    
    console.log('=====================================');
    console.log('✅ 編集システム全体診断完了');
}

// ========== システム診断機能（デバッグ用） ========== //

/**
 * システム状況の包括診断
 */
function diagnoseSystemStatus() {
    console.group('🔍 v3.0 Phase 2 システム診断');
    
    console.log('📋 コアシステム状況:');
    console.log(`  - spineEditCoreLoaded: ${spineEditCoreLoaded}`);
    console.log(`  - systemInitialized: ${systemInitialized}`);
    console.log(`  - globalClickHandler: ${globalClickHandler !== null ? '設定済み' : '未設定'}`);
    
    console.log('📋 SpineEditSystem状況:');
    console.log(`  - SpineEditSystem存在: ${!!window.SpineEditSystem}`);
    if (window.SpineEditSystem) {
        console.log(`  - baseLayer: ${!!window.SpineEditSystem.baseLayer}`);
        console.log(`  - controlLayer: ${!!window.SpineEditSystem.controlLayer}`);
        console.log(`  - coordinateSwap: ${!!window.SpineEditSystem.coordinateSwap}`);
        console.log(`  - coords: ${!!window.SpineEditSystem.coords}`);
        console.log(`  - 編集モード: ${window.SpineEditSystem.controlLayer?.isEditMode || false}`);
    }
    
    console.log('📋 モジュール管理状況:');
    console.log(`  - ModuleManager存在: ${!!window.ModuleManager}`);
    if (window.SpineEditSystem?.modules) {
        console.log(`  - 登録モジュール数: ${window.SpineEditSystem.modules.size}`);
    }
    
    console.groupEnd();
}

// ========== 🧪 Phase 3 nezumi統合テスト・デバッグ関数群 ========== //

// 重複宣言チェック
if (typeof window.Phase3DebugTools === 'undefined') {
    const Phase3DebugTools = {
    
    // nezumi検出テスト
    testNezumiDetection: function() {
        console.log('🧪 nezumi検出テスト開始');
        
        const nezumiElements = document.querySelectorAll('[id*="nezumi"]');
        console.log(`🔍 nezumi要素数: ${nezumiElements.length}`);
        
        nezumiElements.forEach(element => {
            console.log(`📍 nezumi要素: ${element.id}, タグ: ${element.tagName}`);
        });
        
        if (typeof MultiCharacterManager !== 'undefined') {
            MultiCharacterManager.detectAllCharacters();
            const nezumiCharacter = MultiCharacterManager.characters.find(c => c.id.includes('nezumi'));
            
            if (nezumiCharacter) {
                console.log('✅ nezumi検出成功:', nezumiCharacter);
            } else {
                console.log('❌ nezumi検出失敗');
            }
            
            return nezumiCharacter;
        } else {
            console.log('❌ MultiCharacterManagerが見つかりません');
            return null;
        }
    },
    
    // キャラクター選択テスト
    testCharacterSelection: function() {
        console.log('🧪 キャラクター選択テスト開始');
        
        if (typeof MultiCharacterManager === 'undefined') {
            console.log('❌ MultiCharacterManagerが見つかりません');
            return [];
        }
        
        const characters = MultiCharacterManager.characters;
        console.log(`🎯 利用可能キャラクター: ${characters.length}個`);
        
        characters.forEach(character => {
            console.log(`📝 ${character.id}: ${character.name} (active: ${character.isActive})`);
        });
        
        return characters;
    },
    
    // 座標系スワップテスト
    testCoordinateSwap: function(characterId) {
        console.log(`🧪 座標系スワップテスト: ${characterId}`);
        
        if (typeof MultiCharacterManager === 'undefined') {
            console.log('❌ MultiCharacterManagerが見つかりません');
            return false;
        }
        
        const character = MultiCharacterManager.characters.find(c => c.id === characterId || c.id.includes(characterId));
        if (!character) {
            console.log('❌ キャラクターが見つかりません');
            return false;
        }
        
        console.log('🔄 選択前の座標系:', SpineEditSystem.coordinateSwap.isSwapped);
        
        try {
            MultiCharacterManager.selectCharacter(character);
            console.log('✅ 選択完了 - 座標系状態:', SpineEditSystem.coordinateSwap.isSwapped);
            return true;
        } catch (error) {
            console.error('❌ 選択テストエラー:', error);
            return false;
        }
    },
    
    // 全機能統合テスト
    runFullTest: function() {
        console.log('🚀 Phase 3 完全統合テスト開始');
        
        const testResults = {
            detection: false,
            ui: false,
            selection: false,
            coordinate: false
        };
        
        try {
            // 検出テスト
            const nezumiChar = this.testNezumiDetection();
            testResults.detection = !!nezumiChar;
            
            // UIテスト
            console.log('🧪 UI機能テスト');
            const editPanel = document.querySelector('.spine-edit-panel-v3');
            testResults.ui = !!editPanel;
            console.log(`UI状態: ${testResults.ui ? '✅' : '❌'}`);
            
            // 選択テスト
            if (nezumiChar) {
                testResults.selection = this.testCoordinateSwap('nezumi');
            }
            
            // 座標系テスト
            if (window.SpineEditSystem && window.SpineEditSystem.coordinateSwap) {
                testResults.coordinate = typeof window.SpineEditSystem.coordinateSwap.enterEditMode === 'function';
                console.log(`座標系機能: ${testResults.coordinate ? '✅' : '❌'}`);
            }
            
            console.log('📊 統合テスト結果:', testResults);
            
            const successCount = Object.values(testResults).filter(Boolean).length;
            const totalCount = Object.keys(testResults).length;
            
            console.log(`🎯 統合成功率: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
            
            if (successCount === totalCount) {
                console.log('🎉 Phase 3 統合テスト完全成功！');
            } else {
                console.log('⚠️ 一部の機能に問題があります');
            }
            
            return testResults;
            
        } catch (error) {
            console.error('❌ 統合テスト実行エラー:', error);
            return testResults;
        }
    }
    };

    // Global export for Phase3DebugTools
    window.Phase3DebugTools = Phase3DebugTools;
}

// ========== グローバルクリックハンドラー管理 ========== //

/**
 * グローバルクリックハンドラーのセットアップ
 * バウンディングボックス外クリックで選択解除する機能
 */
function setupGlobalClickHandler() {
    // 既存のハンドラーがある場合は削除
    cleanupGlobalClickHandler();
    
    globalClickHandler = function(event) {
        // 編集モードでない場合は何もしない
        if (!SpineEditSystem.controlLayer.isEditMode) {
            return;
        }
        
        // 編集UIクリックは無視
        if (event.target.closest('.spine-editing-panel') || 
            event.target.closest('.editing-ui') ||
            event.target.closest('.character-selected')) {
            return;
        }
        
        // 各キャラクターのバウンディングボックス判定
        let hitCharacter = false;
        
        // spineSkeletonBoundsが利用可能な場合の判定
        if (window.spineSkeletonBounds) {
            const characters = ['purattokun', 'nezumi'];
            
            for (const characterName of characters) {
                const hitResult = window.spineSkeletonBounds.checkBoundsHit(characterName, event.clientX, event.clientY);
                if (hitResult && hitResult.hit) {
                    hitCharacter = true;
                    console.log(`🎯 ${characterName}のバウンディングボックス内クリック検出`);
                    break;
                }
            }
        }
        
        // DOM要素ベースの判定（フォールバック）
        if (!hitCharacter) {
            const targetElement = event.target;
            if (targetElement && (
                targetElement.id.includes('spine') || 
                targetElement.id.includes('character') ||
                targetElement.classList.contains('spine-character'))) {
                hitCharacter = true;
            }
        }
        
        // バウンディングボックス外クリック時は選択解除
        if (!hitCharacter) {
            console.log('🚫 バウンディングボックス外クリック - 選択解除');
            if (typeof clearCharacterSelection === 'function') {
                clearCharacterSelection();
            }
        }
    };
    
    document.addEventListener('click', globalClickHandler, true);
    console.log('✅ グローバルクリックハンドラー設定完了');
}

/**
 * グローバルクリックハンドラーのクリーンアップ
 */
function cleanupGlobalClickHandler() {
    if (globalClickHandler) {
        document.removeEventListener('click', globalClickHandler, true);
        globalClickHandler = null;
        console.log('🧹 グローバルクリックハンドラークリーンアップ完了');
    }
}

/**
 * キャラクター選択解除
 */
function clearCharacterSelection() {
    if (typeof MultiCharacterManager !== 'undefined' && MultiCharacterManager.deselectCharacter) {
        MultiCharacterManager.deselectCharacter();
        console.log('✅ キャラクター選択解除完了');
    } else {
        console.log('⚠️ キャラクター選択解除機能が利用できません');
    }
}

console.log('✅ Spine Debug Tools モジュール読み込み完了');

// Global exports
window.SpineDebugTools = {
    diagnoseDragHandles,
    isEditMode,
    testDragHandleClick,
    diagnoseEditSystem,
    diagnoseSystemStatus,
    Phase3DebugTools,
    setupGlobalClickHandler,
    cleanupGlobalClickHandler,
    clearCharacterSelection
};

// Backward compatibility - individual exports
window.diagnoseDragHandles = diagnoseDragHandles;
window.isEditMode = isEditMode;
window.testDragHandleClick = testDragHandleClick;
window.diagnoseEditSystem = diagnoseEditSystem;
window.diagnoseSystemStatus = diagnoseSystemStatus;
window.Phase3DebugTools = Phase3DebugTools;
window.setupGlobalClickHandler = setupGlobalClickHandler;
window.cleanupGlobalClickHandler = cleanupGlobalClickHandler;
window.clearCharacterSelection = clearCharacterSelection;

// デバッグ用のグローバル診断関数
window.diagnoseV3System = diagnoseSystemStatus;

console.log('🔍 診断機能システム追加完了');
console.log('💡 利用可能な診断コマンド:');
console.log('   - diagnoseDragHandles() - ハンドル状態診断');
console.log('   - isEditMode() - 編集モード確認');
console.log('   - testDragHandleClick() - ハンドルクリックテスト');
console.log('   - diagnoseEditSystem() - 全体診断');
console.log('   - Phase3DebugTools.runFullTest() - 統合テスト');