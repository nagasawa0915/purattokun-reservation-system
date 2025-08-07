// 🎯 Spine編集システム - 状態管理・永続化モジュール
// 役割: データ管理（localStorage・保存・復元・状態履歴）
// 意味単位: 独立機能（永続化・セッション管理）

console.log('💾 Spine State Manager モジュール読み込み開始');

// ========== 状態管理・永続化システム ========== //

// 状態管理オブジェクト（重複宣言チェック）
if (typeof window.savedState === 'undefined') {
    let savedState = {
    character: {
        left: null,
        top: null,
        width: null,
        height: null,
        transform: null
    },
    timestamp: null
    };
    
    // Global export
    window.savedState = savedState;
}

/**
 * 現在の状態を保存
 */
function saveCurrentState() {
    console.log('💾 現在の状態を保存開始');
    
    const targetElement = SpineEditSystem.baseLayer.targetElement;
    if (!targetElement) {
        console.error('❌ 対象要素が見つかりません');
        return false;
    }
    
    // 🔧 座標系を一時的に元に戻して正確な値を取得
    SpineEditSystem.coordinateSwap.exitEditMode(targetElement);
    
    // 現在の状態を記録
    savedState.character = {
        left: targetElement.style.left,
        top: targetElement.style.top,
        width: targetElement.style.width,
        height: targetElement.style.height,
        transform: targetElement.style.transform
    };
    savedState.timestamp = new Date().toISOString();
    
    // localStorageに保存
    try {
        localStorage.setItem('spine-positioning-state', JSON.stringify(savedState));
        console.log('✅ localStorage保存完了:', savedState);
        
        // 保存成功のフィードバック
        const coordDisplay = document.getElementById('coord-display');
        if (coordDisplay) {
            const originalText = coordDisplay.textContent;
            coordDisplay.textContent = '💾 保存完了！';
            coordDisplay.style.background = '#d4edda';
            coordDisplay.style.color = '#155724';
            
            setTimeout(() => {
                coordDisplay.textContent = originalText;
                coordDisplay.style.background = '#f5f5f5';
                coordDisplay.style.color = '';
            }, 2000);
        }
        
        // 🔧 座標系を編集モードに戻す
        SpineEditSystem.coordinateSwap.enterEditMode(targetElement);
        
        return true;
        
    } catch (error) {
        console.error('❌ localStorage保存失敗:', error);
        
        // 🔧 エラー時も座標系を編集モードに戻す
        SpineEditSystem.coordinateSwap.enterEditMode(targetElement);
        
        return false;
    }
}

/**
 * キャンセル（ページリロード方式）
 */
function cancelEdit() {
    console.log('↶ 編集をキャンセル（ページリロード方式）');
    
    const coordDisplay = document.getElementById('coord-display');
    if (coordDisplay) {
        coordDisplay.textContent = '🔄 前回保存した状態に戻しています...';
        coordDisplay.style.background = '#fff3cd';
        coordDisplay.style.color = '#856404';
    }
    
    // 500ms後にページリロード（ユーザーがメッセージを読めるように）
    setTimeout(() => {
        location.reload();
    }, 500);
}

/**
 * 初期化時の状態復元
 */
function restoreCharacterState() {
    console.log('🔄 保存された状態の復元開始');
    
    try {
        const saved = localStorage.getItem('spine-positioning-state');
        if (!saved) {
            console.log('💡 保存された状態なし - 初期状態を維持');
            return false;
        }
        
        const loadedState = JSON.parse(saved);
        console.log('📋 localStorage状態:', loadedState);
        
        // 対象要素を取得（複数の候補から検索）
        const selectors = [
            '#character-canvas',
            '#purattokun-canvas', 
            '.demo-character',
            '.spine-character'
        ];
        
        let targetElement = null;
        for (const selector of selectors) {
            targetElement = document.querySelector(selector);
            if (targetElement) {
                console.log(`✅ 対象要素見つかった: ${selector}`);
                break;
            }
        }
        
        if (!targetElement) {
            console.warn('⚠️ 対象要素が見つかりません - 状態復元をスキップ');
            return false;
        }
        
        // 保存された状態を適用
        if (loadedState.character) {
            if (loadedState.character.left) targetElement.style.left = loadedState.character.left;
            if (loadedState.character.top) targetElement.style.top = loadedState.character.top;
            if (loadedState.character.width) targetElement.style.width = loadedState.character.width;
            if (loadedState.character.height) targetElement.style.height = loadedState.character.height;
            if (loadedState.character.transform) targetElement.style.transform = loadedState.character.transform;
        }
        
        // savedStateも更新
        savedState = loadedState;
        
        console.log('✅ 状態復元完了');
        return true;
        
    } catch (error) {
        console.error('❌ 状態復元失敗:', error);
        return false;
    }
}

// ========== 追加の状態管理機能 ========== //

/**
 * 保存された状態の確認
 */
function getSavedState() {
    try {
        const saved = localStorage.getItem('spine-positioning-state');
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error('❌ 保存状態読み込み失敗:', error);
        return null;
    }
}

/**
 * 状態クリア
 */
function clearSavedState() {
    console.log('🗑️ 保存状態をクリア');
    
    try {
        localStorage.removeItem('spine-positioning-state');
        savedState = {
            character: {
                left: null,
                top: null,
                width: null,
                height: null,
                transform: null
            },
            timestamp: null
        };
        console.log('✅ 保存状態クリア完了');
        return true;
    } catch (error) {
        console.error('❌ 保存状態クリア失敗:', error);
        return false;
    }
}

/**
 * 状態の妥当性チェック
 */
function validateState(state) {
    if (!state || typeof state !== 'object') {
        return false;
    }
    
    if (!state.character || typeof state.character !== 'object') {
        return false;
    }
    
    // 必要最小限のプロパティが存在するかチェック
    const requiredProps = ['left', 'top', 'width', 'height'];
    for (const prop of requiredProps) {
        if (!(prop in state.character)) {
            return false;
        }
    }
    
    return true;
}

/**
 * 状態の自動バックアップ
 */
function createStateBackup() {
    console.log('📋 状態の自動バックアップ作成');
    
    const currentState = getSavedState();
    if (!currentState) {
        console.log('💡 バックアップする状態がありません');
        return false;
    }
    
    try {
        const backupKey = `spine-positioning-backup-${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(currentState));
        console.log(`✅ バックアップ作成完了: ${backupKey}`);
        
        // 古いバックアップをクリーンアップ（最新5個まで保持）
        cleanupOldBackups();
        
        return true;
    } catch (error) {
        console.error('❌ バックアップ作成失敗:', error);
        return false;
    }
}

/**
 * 古いバックアップのクリーンアップ
 */
function cleanupOldBackups() {
    try {
        const backupKeys = Object.keys(localStorage)
            .filter(key => key.startsWith('spine-positioning-backup-'))
            .sort()
            .reverse(); // 新しい順
        
        // 5個以上ある場合、古いものを削除
        if (backupKeys.length > 5) {
            const toDelete = backupKeys.slice(5);
            toDelete.forEach(key => {
                localStorage.removeItem(key);
                console.log(`🗑️ 古いバックアップ削除: ${key}`);
            });
        }
    } catch (error) {
        console.error('❌ バックアップクリーンアップ失敗:', error);
    }
}

console.log('✅ Spine State Manager モジュール読み込み完了');

// Global exports
window.SpineStateManager = {
    saveCurrentState,
    cancelEdit,
    restoreCharacterState,
    getSavedState,
    clearSavedState,
    validateState,
    createStateBackup,
    cleanupOldBackups,
    get savedState() { return savedState; }
};

// Backward compatibility
window.saveCurrentState = saveCurrentState;
window.cancelEdit = cancelEdit;
window.restoreCharacterState = restoreCharacterState;