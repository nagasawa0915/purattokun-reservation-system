// 🎯 Spine編集システム v4.0 - メインエントリーポイント (モジュール統合版)
// 既存互換性を保ちながら、モジュール化された高機能編集システム

console.log('🚀 Spine編集システム v4.0 (モジュール統合版) 読み込み開始');

// ========== グローバル変数（互換性維持） ========== //
let isEditMode = false;
let character = null; // メインキャラクター（後方互換性のため）
let currentScale = 1.0; // Spineスケール値を保持

// ========== 初期化システム ========== //

/**
 * 最小限編集システム初期化（統合版）
 */
function initializeMinimalEditSystem() {
    console.log('🔄 統合版編集システム初期化開始');
    
    try {
        // 複数キャラクター検出
        if (typeof window.detectCharacters === 'function') {
            window.detectCharacters();
        } else {
            console.warn('⚠️ detectCharacters関数が見つかりません（キャラクター管理モジュール未読み込み）');
        }
        
        // 後方互換性：従来のcharacter変数設定
        if (window.characters && window.characters.length > 0) {
            character = window.characters[0].element;
            currentScale = window.characters[0].scale;
            window.character = character; // グローバル同期
            window.currentScale = currentScale;
        } else {
            // フォールバック: 従来の方法でキャラクター取得
            console.log('🔄 フォールバック: 従来方式でキャラクター検出');
            
            const CHARACTER_SELECTORS = [
                '#purattokun-canvas',
                '#purattokun-fallback',
                'canvas[data-spine-character]',
                '.spine-character',
                '[data-character-name]'
            ];
            
            for (const selector of CHARACTER_SELECTORS) {
                const element = document.querySelector(selector);
                if (element) {
                    character = element;
                    window.character = character;
                    console.log('✅ フォールバック検出成功:', selector);
                    
                    // 手動でcharacters配列に追加
                    if (typeof window.characters !== 'undefined') {
                        window.characters = [{
                            element: element,
                            id: element.id || 'fallback-character',
                            name: element.id || 'フォールバックキャラクター',
                            selector: selector,
                            scale: 1.0,
                            isActive: true,
                            zIndex: 1000,
                            originalOrder: 0
                        }];
                        window.activeCharacterIndex = 0;
                    }
                    break;
                }
            }
        }
        
        if (character) {
            console.log('✅ キャラクター初期化成功:', character.id || character.tagName);
        } else {
            console.warn('⚠️ キャラクターが見つかりませんでした');
        }
        
        // CSSサイズ設定を削除（Spine側でサイズ制御）
        
        // UIが存在しない場合は作成
        if (!document.getElementById('minimal-edit-button')) {
            console.log('🔧 編集UIが存在しないため作成します');
            // 編集ボタンの作成
            if (typeof window.createEditButton === 'function') {
                window.createEditButton();
            } else {
                console.warn('⚠️ createEditButton関数が見つかりません（UIパネルモジュール未読み込み）');
                createFallbackEditButton();
            }
        }
        
        // 初期化成功確認
        console.log('✅ 統合版編集システム初期化完了');
        console.log('📊 システム状態:', {
            character: !!character,
            characters: window.characters ? window.characters.length : 0,
            modules: {
                stateManager: typeof window.savePositionV2 === 'function',
                characterManager: typeof window.detectCharacters === 'function',
                uiPanels: typeof window.createEditButton === 'function',
                dragSystem: typeof window.startDrag === 'function',
                diagnostics: typeof window.diagnoseDragHandles === 'function'
            }
        });
        
    } catch (error) {
        console.error('❌ 統合版編集システム初期化エラー:', error);
        console.error('エラー詳細:', {
            message: error.message,
            stack: error.stack,
            character: !!character,
            domReady: document.readyState
        });
        
        // フォールバック: 最小限のUIを作成
        createFallbackEditButton();
    }
}

/**
 * フォールバック用の簡易編集ボタン
 */
function createFallbackEditButton() {
    if (document.getElementById('minimal-edit-button')) return;
    
    const button = document.createElement('button');
    button.id = 'minimal-edit-button';
    button.textContent = '位置編集 (简化版)';
    button.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 10px 20px;
        background: #ff9800;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        z-index: 10000;
        font-size: 14px;
    `;
    
    button.addEventListener('click', () => {
        console.warn('⚠️ 簡化版編集ボタン：完全機能はモジュール読み込み後に利用可能');
        if (typeof window.toggleEditMode === 'function') {
            window.toggleEditMode();
        } else {
            alert('編集機能を利用するには、必要なモジュールを読み込んでください。');
        }
    });
    
    document.body.appendChild(button);
    console.log('⚠️ フォールバック編集ボタンを作成しました');
}

/**
 * システム実行・初期化
 */
function executeInitialization() {
    console.log('📄 統合版システム開始');
    console.log('DOM状態確認:', {
        readyState: document.readyState,
        bodyExists: !!document.body,
        title: document.title,
        url: window.location.href
    });
    
    try {
        // 即座に編集システム初期化（遅延なし）
        initializeMinimalEditSystem();
        
        // 最速で位置復元
        let positionRestored = false;
        const waitForSpineInit = () => {
            if (positionRestored) return; // 重複実行防止
            
            // Canvas作成時に既に位置復元済みかチェック
            if (window.spinePositionAlreadyRestored) {
                console.log('✅ Canvas作成時に位置復元済み、スキップ');
                positionRestored = true;
                return;
            }
            
            const canvas = document.getElementById('purattokun-canvas');
            if (canvas && canvas.getBoundingClientRect().width > 0) {
                // Canvas要素が実際にレンダリングされた時点で位置復元
                positionRestored = true;
                
                // v2.0優先で復元
                if (typeof window.restorePositionV2 === 'function') {
                    if (!window.restorePositionV2()) {
                        // v2.0が失敗した場合は既存方式
                        if (typeof window.restorePosition === 'function') {
                            window.restorePosition();
                        }
                    }
                } else if (typeof window.restorePosition === 'function') {
                    window.restorePosition();
                } else {
                    console.warn('⚠️ 位置復元関数が見つかりません（状態管理モジュール未読み込み）');
                }
                
                console.log('⚡ 最速：Spine初期化完了を検出、即座に位置復元を実行');
            } else {
                // 50ms間隔で高速監視
                setTimeout(waitForSpineInit, 50);
            }
        };
        
        // 初期化監視を即座に開始
        waitForSpineInit();
        
        // フォールバック：2秒後に必ず実行
        setTimeout(() => {
            if (!positionRestored) {
                positionRestored = true;
                if (typeof window.restorePositionV2 === 'function') {
                    window.restorePositionV2();
                } else if (typeof window.restorePosition === 'function') {
                    window.restorePosition();
                }
                console.log('🔄 フォールバック：位置復元を実行');
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ 統合版初期化エラー:', error);
        console.error('詳細:', {
            message: error.message,
            stack: error.stack,
            dom: document.readyState,
            body: !!document.body
        });
    }
}

// ========== モジュール読み込み状況確認 ========== //

/**
 * モジュール読み込み状況を確認
 */
function checkModuleStatus() {
    const modules = {
        '状態管理': {
            loaded: typeof window.savePositionV2 === 'function',
            functions: ['savePositionV2', 'restorePositionV2', 'detectChanges', 'showEditEndConfirmDialog']
        },
        'キャラクター管理': {
            loaded: typeof window.detectCharacters === 'function',
            functions: ['detectCharacters', 'setActiveCharacter', 'moveCharacterInLayer']
        },
        'UIパネル': {
            loaded: typeof window.createEditButton === 'function',
            functions: ['createEditButton', 'updateCharacterSelectPanel', 'applyMobileStyles']
        },
        'ドラッグシステム': {
            loaded: typeof window.startDrag === 'function',
            functions: ['startDrag', 'handleDrag', 'endDrag', 'toggleEditMode']
        },
        '診断機能': {
            loaded: typeof window.diagnoseDragHandles === 'function',
            functions: ['diagnoseDragHandles', 'testDragFunctionality', 'debugCharacterInfo']
        }
    };
    
    console.log('📊 モジュール読み込み状況:');
    Object.entries(modules).forEach(([name, info]) => {
        const status = info.loaded ? '✅' : '❌';
        console.log(`  ${status} ${name}: ${info.loaded ? '読み込み済み' : '未読み込み'}`);
        
        if (!info.loaded) {
            const missing = info.functions.filter(fn => typeof window[fn] !== 'function');
            if (missing.length > 0) {
                console.log(`    未定義関数: ${missing.join(', ')}`);
            }
        }
    });
    
    const loadedCount = Object.values(modules).filter(m => m.loaded).length;
    const totalCount = Object.keys(modules).length;
    
    console.log(`📈 総合状況: ${loadedCount}/${totalCount} モジュール読み込み済み`);
    
    return { modules, loadedCount, totalCount };
}

// ========== デバッグ関数群 ========== //

/**
 * システム全体のデバッグ情報
 */
function debugSystemInfo() {
    console.log('🔍 === システム全体デバッグ情報 ===');
    
    // モジュール状況
    const moduleStatus = checkModuleStatus();
    
    // キャラクター情報
    console.log('🎭 キャラクター情報:');
    if (window.characters && window.characters.length > 0) {
        console.log(`  複数キャラクター: ${window.characters.length}個`);
        console.log(`  アクティブ: ${window.activeCharacterIndex} (${window.characters[window.activeCharacterIndex]?.name})`);
    } else if (character) {
        console.log('  従来キャラクター: 1個 (後方互換性モード)');
    } else {
        console.log('  キャラクター: 未検出');
    }
    
    // 編集状態
    console.log('🔧 編集状態:');
    console.log(`  編集モード: ${isEditMode}`);
    console.log(`  ドラッグ中: ${window.isDragging || false}`);
    console.log(`  現在のスケール: ${currentScale}`);
    
    // UI状態
    console.log('🎨 UI状態:');
    const panels = ['character-select-panel', 'scale-adjust-panel', 'realtime-preview-panel'];
    panels.forEach(id => {
        const element = document.getElementById(id);
        console.log(`  ${id}: ${element ? (element.style.display === 'none' ? '非表示' : '表示') : '未作成'}`);
    });
    
    // ストレージ状況
    console.log('💾 ストレージ状況:');
    const storageKeys = ['spine-positioning-state-v2', 'spine-positioning-state', 'spine-minimal-position'];
    storageKeys.forEach(key => {
        const data = localStorage.getItem(key);
        console.log(`  ${key}: ${data ? `${data.length}文字` : '未保存'}`);
    });
    
    return {
        modules: moduleStatus,
        character: !!character,
        characters: window.characters?.length || 0,
        editMode: isEditMode,
        scale: currentScale
    };
}

/**
 * クリア系デバッグ関数
 */
function clearAllPositionData() {
    localStorage.removeItem('spine-positioning-state-v2');
    localStorage.removeItem('spine-positioning-state');
    localStorage.removeItem('spine-minimal-position');
    console.log('🗑️ 全ての保存データをクリアしました');
}

function clearMinimalPosition() {
    localStorage.removeItem('spine-positioning-state');
    localStorage.removeItem('spine-minimal-position');
    console.log('🗑️ 従来保存データをクリアしました');
}

// ========== DOMContentLoaded処理 ========== //

// DOMContentLoadedイベント または 即座実行
if (document.readyState === 'loading') {
    // まだ読み込み中の場合はDOMContentLoadedを待つ
    document.addEventListener('DOMContentLoaded', executeInitialization);
} else {
    // 既に読み込み完了している場合は即座に実行
    console.log('🚀 DOM既に完了 - 即座に初期化実行');
    executeInitialization();
}

// ========== グローバル関数エクスポート ========== //

// 既存互換性を保つためのグローバル関数
if (typeof window !== 'undefined') {
    // システム初期化
    window.initializeMinimalEditSystem = initializeMinimalEditSystem;
    window.executeInitialization = executeInitialization;
    
    // デバッグ機能
    window.debugSystemInfo = debugSystemInfo;
    window.checkModuleStatus = checkModuleStatus;
    window.clearAllPositionData = clearAllPositionData;
    window.clearMinimalPosition = clearMinimalPosition;
    
    // 互換性維持のための変数
    Object.defineProperty(window, 'isEditMode', {
        get: () => isEditMode,
        set: (value) => { isEditMode = value; }
    });
    Object.defineProperty(window, 'character', {
        get: () => character,
        set: (value) => { character = value; }
    });
    Object.defineProperty(window, 'currentScale', {
        get: () => currentScale,
        set: (value) => { currentScale = value; }
    });
    
    // v2.0関数の委譲
    if (typeof window.savePositionV2 !== 'function') {
        window.savePositionV2 = () => {
            console.warn('⚠️ savePositionV2: 状態管理モジュール未読み込み');
            return false;
        };
    }
    
    if (typeof window.restorePositionV2 !== 'function') {
        window.restorePositionV2 = () => {
            console.warn('⚠️ restorePositionV2: 状態管理モジュール未読み込み');
            return false;
        };
    }
    
    // 後方互換性：従来関数も提供
    window.savePosition = () => {
        if (typeof window.savePositionV2 === 'function') {
            return window.savePositionV2();
        }
        console.warn('⚠️ savePosition: 状態管理モジュール未読み込み');
        return false;
    };
    
    window.restorePosition = () => {
        if (typeof window.restorePositionV2 === 'function') {
            return window.restorePositionV2();
        }
        console.warn('⚠️ restorePosition: 状態管理モジュール未読み込み');
        return false;
    };
}

console.log('✅ Spine編集システム v4.0 (モジュール統合版) 読み込み完了');

// 読み込み完了時にモジュール状況を表示
setTimeout(() => {
    if (typeof window !== 'undefined') {
        console.log('📊 初期化完了時のモジュール状況:');
        checkModuleStatus();
        
        console.log(`
🎯 Spine編集システム v4.0 使用方法:
  • システム情報: debugSystemInfo()
  • 診断実行: diagnoseDragHandles() (診断モジュール読み込み後)
  • 編集開始: 右上の「位置編集」ボタンをクリック
  • データクリア: clearAllPositionData()
        `);
    }
}, 1000);