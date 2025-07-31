// 🎯 Spine編集システム - 状態管理・データ永続化モジュール v1.0
// 役割：データ保存・復元・変更検知・確認ダイアログ

console.log('🔄 状態管理モジュール読み込み開始');

// ========== 状態管理変数 ========== //
let editStartState = null; // 編集開始時の状態スナップショット
let tempSaveData = null; // 一時保存データ
let hasUnsavedChanges = false; // 未保存の変更があるかのフラグ

// ========== 編集状態管理システム ========== //

/**
 * 編集開始時の状態をスナップショット作成
 * 依存関数: setActiveCharacter, characters, activeCharacterIndex, currentScale
 */
function captureEditStartState() {
    console.log('📸 編集開始時の状態をキャプチャ');
    
    editStartState = {
        timestamp: Date.now(),
        activeCharacterIndex: window.activeCharacterIndex || 0,
        characters: (window.characters || []).map(char => ({
            id: char.id,
            name: char.name,
            scale: char.scale,
            zIndex: char.zIndex,
            position: {
                left: char.element.style.left,
                top: char.element.style.top,
                transform: char.element.style.transform
            }
        })),
        globalScale: window.currentScale || 1.0
    };
    
    hasUnsavedChanges = false;
    console.log('✅ 編集開始状態をキャプチャ完了:', editStartState);
}

/**
 * 現在の状態をスナップショット作成
 */
function captureCurrentState() {
    return {
        timestamp: Date.now(),
        activeCharacterIndex: window.activeCharacterIndex || 0,
        characters: (window.characters || []).map(char => ({
            id: char.id,
            name: char.name,
            scale: char.scale,
            zIndex: char.zIndex,
            position: {
                left: char.element.style.left,
                top: char.element.style.top,
                transform: char.element.style.transform
            }
        })),
        globalScale: window.currentScale || 1.0
    };
}

/**
 * 変更検知：編集開始時と現在の状態を比較
 */
function detectChanges() {
    if (!editStartState) {
        console.log('⚠️ 編集開始状態が記録されていません');
        return false;
    }
    
    const currentState = captureCurrentState();
    
    // 基本的な変更チェック
    if (editStartState.activeCharacterIndex !== currentState.activeCharacterIndex) {
        console.log('🔍 変更検知: アクティブキャラクター変更');
        return true;
    }
    
    if (editStartState.globalScale !== currentState.globalScale) {
        console.log('🔍 変更検知: グローバルスケール変更');
        return true;
    }
    
    // 各キャラクターの変更チェック
    for (let i = 0; i < Math.max(editStartState.characters.length, currentState.characters.length); i++) {
        const startChar = editStartState.characters[i];
        const currentChar = currentState.characters[i];
        
        if (!startChar || !currentChar) {
            console.log('🔍 変更検知: キャラクター数変更');
            return true;
        }
        
        // 位置変更チェック
        if (startChar.position.left !== currentChar.position.left || 
            startChar.position.top !== currentChar.position.top) {
            console.log(`🔍 変更検知: ${currentChar.name} の位置変更`);
            return true;
        }
        
        // スケール変更チェック
        if (startChar.scale !== currentChar.scale) {
            console.log(`🔍 変更検知: ${currentChar.name} のスケール変更`);
            return true;
        }
        
        // z-index変更チェック
        if (startChar.zIndex !== currentChar.zIndex) {
            console.log(`🔍 変更検知: ${currentChar.name} のレイヤー順序変更`);
            return true;
        }
    }
    
    console.log('🔍 変更検知: 変更なし');
    return false;
}

/**
 * 一時保存機能
 */
function tempSave() {
    tempSaveData = captureCurrentState();
    console.log('💾 一時保存完了:', tempSaveData.timestamp);
    return tempSaveData;
}

/**
 * ロールバック機能：編集開始時の状態に戻す
 * 依存関数: setActiveCharacter, updateScalePanelForActiveCharacter, updateCharacterSelectPanel, updateRealtimePreview
 */
function rollbackToEditStart() {
    if (!editStartState) {
        console.error('❌ ロールバック失敗: 編集開始状態が記録されていません');
        return false;
    }
    
    console.log('🔄 編集開始時の状態にロールバック開始');
    
    try {
        // アクティブキャラクターインデックスを復元
        if (editStartState.activeCharacterIndex !== window.activeCharacterIndex) {
            if (typeof window.setActiveCharacter === 'function') {
                window.setActiveCharacter(editStartState.activeCharacterIndex);
            }
        }
        
        // 各キャラクターの状態を復元
        editStartState.characters.forEach((startChar, index) => {
            if (window.characters && window.characters[index] && window.characters[index].id === startChar.id) {
                const char = window.characters[index];
                
                // 位置復元
                char.element.style.left = startChar.position.left;
                char.element.style.top = startChar.position.top;
                char.element.style.transform = startChar.position.transform;
                
                // スケール復元
                char.scale = startChar.scale;
                
                // z-index復元
                char.zIndex = startChar.zIndex;
                char.element.style.zIndex = startChar.zIndex;
                
                console.log(`✅ ${char.name} の状態を復元`);
            }
        });
        
        // グローバルスケール復元
        window.currentScale = editStartState.globalScale;
        
        // UI要素を更新
        if (typeof window.updateScalePanelForActiveCharacter === 'function') {
            window.updateScalePanelForActiveCharacter();
        }
        if (typeof window.updateCharacterSelectPanel === 'function') {
            window.updateCharacterSelectPanel();
        }
        if (typeof window.updateRealtimePreview === 'function') {
            window.updateRealtimePreview();
        }
        
        hasUnsavedChanges = false;
        console.log('✅ ロールバック完了');
        return true;
        
    } catch (error) {
        console.error('❌ ロールバック中にエラーが発生:', error);
        return false;
    }
}

/**
 * 変更フラグの更新（ドラッグ・スケール変更時に呼び出し）
 */
function markAsChanged() {
    hasUnsavedChanges = true;
    console.log('📝 変更フラグをON');
}

// ========== 改良された確認ダイアログシステム ========== //

/**
 * 編集終了確認ダイアログを表示
 */
function showEditEndConfirmDialog() {
    return new Promise((resolve) => {
        // オーバーレイ作成
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            z-index: 10010;
            display: flex;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(3px);
            animation: fadeIn 0.3s ease;
        `;
        
        // ダイアログボックス作成
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 90%;
            padding: 0;
            animation: slideInUp 0.3s ease;
            font-family: system-ui, -apple-system, sans-serif;
        `;
        
        // 変更検知結果
        const hasChanges = detectChanges();
        const changesText = hasChanges ? 
            '<div style="color: #ff6b6b; font-weight: bold; margin-bottom: 8px;">📝 編集内容に変更があります</div>' :
            '<div style="color: #4CAF50; font-weight: bold; margin-bottom: 8px;">✅ 編集内容に変更はありません</div>';
        
        dialog.innerHTML = `
            <div style="padding: 24px 24px 16px 24px; border-bottom: 1px solid #eee;">
                <h3 style="margin: 0 0 12px 0; color: #333; font-size: 18px; font-weight: 600;">
                    🎯 編集モードを終了しますか？
                </h3>
                ${changesText}
                <div style="font-size: 14px; color: #666; line-height: 1.5;">
                    編集した内容を保存、破棄、または編集を継続できます。
                </div>
            </div>
            
            <div style="padding: 20px 24px;">
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <button id="dialog-save" style="
                        flex: 1;
                        min-width: 120px;
                        padding: 12px 16px;
                        background: #4CAF50;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                    ">
                        💾 保存して終了
                    </button>
                    
                    <button id="dialog-cancel" style="
                        flex: 1;
                        min-width: 120px;
                        padding: 12px 16px;
                        background: ${hasChanges ? '#ff6b6b' : '#999'};
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                    ">
                        ${hasChanges ? '🔄 破棄して終了' : '❌ そのまま終了'}
                    </button>
                    
                    <button id="dialog-continue" style="
                        flex: 1;
                        min-width: 120px;
                        padding: 12px 16px;
                        background: #2196F3;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                    ">
                        ✏️ 編集を継続
                    </button>
                </div>
                
                ${hasChanges ? `
                <div style="margin-top: 16px; padding: 12px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; font-size: 13px; color: #856404;">
                    <strong>💡 ヒント:</strong> 
                    「一時保存」機能で編集中の状態を保存し、後で復元することも可能です。
                </div>
                ` : ''}
            </div>
        `;
        
        // CSS アニメーション追加
        if (!document.getElementById('dialog-animations')) {
            const style = document.createElement('style');
            style.id = 'dialog-animations';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                @keyframes slideInUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(30px) scale(0.95); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0) scale(1); 
                    }
                }
                @keyframes slideOutDown {
                    from { 
                        opacity: 1; 
                        transform: translateY(0) scale(1); 
                    }
                    to { 
                        opacity: 0; 
                        transform: translateY(20px) scale(0.95); 
                    }
                }
                @keyframes slideInRight {
                    from { 
                        opacity: 0; 
                        transform: translateX(100%); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateX(0); 
                    }
                }
                @keyframes slideOutRight {
                    from { 
                        opacity: 1; 
                        transform: translateX(0); 
                    }
                    to { 
                        opacity: 0; 
                        transform: translateX(100%); 
                    }
                }
                .dialog-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
            `;
            document.head.appendChild(style);
        }
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // ボタンホバー効果
        const buttons = dialog.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'translateY(-1px)';
                btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = 'none';
            });
        });
        
        // イベントハンドラ設定
        const saveBtn = dialog.querySelector('#dialog-save');
        const cancelBtn = dialog.querySelector('#dialog-cancel');
        const continueBtn = dialog.querySelector('#dialog-continue');
        
        // ダイアログを閉じる共通処理
        const closeDialog = (result) => {
            overlay.style.animation = 'fadeOut 0.2s ease';
            dialog.style.animation = 'slideOutDown 0.2s ease';
            
            setTimeout(() => {
                document.body.removeChild(overlay);
                resolve(result);
            }, 200);
        };
        
        // 保存して終了
        saveBtn.addEventListener('click', () => {
            console.log('💾 ユーザー選択: 保存して終了');
            closeDialog('save');
        });
        
        // 破棄して終了（変更がある場合）/ そのまま終了（変更がない場合）
        cancelBtn.addEventListener('click', () => {
            if (hasChanges) {
                console.log('🔄 ユーザー選択: 破棄して終了');
                closeDialog('discard');
            } else {
                console.log('❌ ユーザー選択: そのまま終了');
                closeDialog('exit');
            }
        });
        
        // 編集を継続
        continueBtn.addEventListener('click', () => {
            console.log('✏️ ユーザー選択: 編集を継続');
            closeDialog('continue');
        });
        
        // ESCキーで編集継続
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                console.log('⌨️ ESCキー: 編集を継続');
                document.removeEventListener('keydown', handleKeyPress);
                closeDialog('continue');
            }
        };
        document.addEventListener('keydown', handleKeyPress);
        
        // オーバーレイクリックで編集継続
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                console.log('🖱️ オーバーレイクリック: 編集を継続');
                closeDialog('continue');
            }
        });
    });
}

/**
 * 一時保存ダイアログ
 */
function showTempSaveDialog() {
    const currentData = tempSave();
    
    // 簡単なトースト通知
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        z-index: 10020;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        font-weight: 600;
        animation: slideInRight 0.3s ease;
        cursor: pointer;
        max-width: 300px;
    `;
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span>💾</span>
            <div>
                <div>一時保存完了</div>
                <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">
                    ${new Date(currentData.timestamp).toLocaleTimeString()}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // 3秒後に自動削除、またはクリックで削除
    const removeToast = () => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    };
    
    toast.addEventListener('click', removeToast);
    setTimeout(removeToast, 3000);
}

// ========== localStorage v2.0システム ========== //

/**
 * 複数キャラクター対応localStorage v2.0保存
 */
function savePositionV2() {
    console.log('💾 v2.0形式で位置情報を保存中...');
    
    // 全キャラクターの情報を収集
    const charactersData = (window.characters || []).map((char, index) => {
        if (!char || !char.element) return null;
        
        return {
            // 基本情報
            id: char.id,
            name: char.name,
            selector: char.selector,
            
            // 位置・スケール情報
            position: {
                left: char.element.style.left || '50%',
                top: char.element.style.top || '50%',
                transform: char.element.style.transform || 'translate(-50%, -50%)'
            },
            scale: char.scale || 1.0,
            
            // レイヤー情報
            zIndex: char.zIndex || (1000 + index),
            originalOrder: char.originalOrder !== undefined ? char.originalOrder : index,
            
            // 表示情報
            isActive: char.isActive || false,
            isVisible: char.element.style.display !== 'none',
            
            // 変換情報
            computed: {
                width: char.element.offsetWidth,
                height: char.element.offsetHeight,
                left: char.element.offsetLeft,
                top: char.element.offsetTop
            },
            
            // メタデータ
            lastModified: Date.now(),
            version: '2.0'
        };
    }).filter(data => data !== null);
    
    // v2.0形式の保存データ作成
    const saveData = {
        // バージョン情報
        version: '2.0',
        formatVersion: 'spine-positioning-v2.0',
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        
        // システム情報
        activeCharacterIndex: window.activeCharacterIndex || 0,
        currentScale: window.currentScale || 1.0,
        
        // 全キャラクターデータ
        characters: charactersData,
        
        // 後方互換性用のメインキャラクター情報
        mainCharacter: charactersData[window.activeCharacterIndex || 0] || null,
        
        // セッション情報
        session: {
            editStartTime: editStartState ? editStartState.timestamp : null,
            hasUnsavedChanges: hasUnsavedChanges,
            tempSaveTime: tempSaveData ? tempSaveData.timestamp : null
        },
        
        // 統計情報
        stats: {
            totalCharacters: charactersData.length,
            visibleCharacters: charactersData.filter(char => char.isVisible).length,
            modifiedCharacters: charactersData.filter(char => 
                char.position.left !== '50%' || 
                char.position.top !== '50%' || 
                char.scale !== 1.0
            ).length
        }
    };
    
    // v2.0形式で保存
    try {
        localStorage.setItem('spine-positioning-state-v2', JSON.stringify(saveData));
        console.log(`✅ v2.0形式で保存完了: ${charactersData.length}キャラクター`);
        
        // デバッグ情報出力
        console.log('📊 保存データ統計:', saveData.stats);
        
        return true;
        
    } catch (error) {
        console.error('❌ v2.0形式保存エラー:', error);
        return false;
    }
    
    // 後方互換性：既存形式も保存（フォールバック用）
    if (window.characters && window.characters.length > 0) {
        const activeChar = window.characters[window.activeCharacterIndex || 0];
        if (activeChar && activeChar.element) {
            const legacyData = {
                left: activeChar.element.style.left || '50%',
                top: activeChar.element.style.top || '50%',  
                scale: activeChar.scale || 1.0,
                transform: activeChar.element.style.transform || 'translate(-50%, -50%)',
                zIndex: activeChar.zIndex || 1000,
                timestamp: Date.now(),
                character: activeChar.name,
                id: activeChar.id
            };
            
            try {
                localStorage.setItem('spine-positioning-state', JSON.stringify(legacyData));
                console.log('✅ 後方互換性用データも保存完了');
            } catch (error) {
                console.error('❌ 後方互換性データ保存エラー:', error);
            }
        }
    }
}

/**
 * 複数キャラクター対応localStorage v2.0復元
 */
function restorePositionV2() {
    console.log('🔄 v2.0形式で位置情報を復元中...');
    
    try {
        // v2.0形式のデータを優先的に確認
        const v2Data = localStorage.getItem('spine-positioning-state-v2');
        
        if (v2Data) {
            const saveData = JSON.parse(v2Data);
            console.log('📊 v2.0データ発見:', saveData.version, saveData.stats);
            
            if (saveData.version === '2.0' && saveData.characters) {
                // アクティブキャラクターインデックス復元
                if (saveData.activeCharacterIndex !== undefined) {
                    window.activeCharacterIndex = saveData.activeCharacterIndex;
                }
                
                // グローバルスケール復元
                if (saveData.currentScale !== undefined) {
                    window.currentScale = saveData.currentScale;
                }
                
                let restoredCount = 0;
                
                // キャラクターデータが存在する場合
                if (saveData.characters && saveData.characters.length > 0) {
                    // 各キャラクターの位置・設定を復元
                    saveData.characters.forEach((savedChar, index) => {
                        if (window.characters && window.characters[index] && savedChar) {
                            const char = window.characters[index];
                            
                            // IDが一致する場合のみ復元
                            if (char.id === savedChar.id || char.name === savedChar.name) {
                                // 位置復元
                                if (savedChar.position) {
                                    char.element.style.left = savedChar.position.left;
                                    char.element.style.top = savedChar.position.top;
                                    char.element.style.transform = savedChar.position.transform;
                                }
                                
                                // スケール復元
                                if (savedChar.scale !== undefined) {
                                    char.scale = savedChar.scale;
                                }
                                
                                // レイヤー情報復元
                                if (savedChar.zIndex !== undefined) {
                                    char.zIndex = savedChar.zIndex;
                                    char.element.style.zIndex = savedChar.zIndex;
                                }
                                
                                // 表示情報復元
                                if (savedChar.isActive !== undefined) {
                                    char.isActive = savedChar.isActive;
                                }
                                
                                restoredCount++;
                                console.log(`✅ ${char.name} をv2.0形式で復元`);
                            }
                        }
                    });
                }
                
                // アクティブキャラクターの復元
                if (window.setActiveCharacter && typeof window.setActiveCharacter === 'function') {
                    window.setActiveCharacter(window.activeCharacterIndex);
                }
                
                // セッション情報復元
                if (saveData.session) {
                    hasUnsavedChanges = saveData.session.hasUnsavedChanges || false;
                    if (saveData.session.tempSaveTime) {
                        console.log('💾 一時保存データも復元:', new Date(saveData.session.tempSaveTime));
                    }
                }
                
                // UI更新
                if (window.updateScalePanelForActiveCharacter && typeof window.updateScalePanelForActiveCharacter === 'function') {
                    window.updateScalePanelForActiveCharacter();
                }
                if (window.updateCharacterSelectPanel && typeof window.updateCharacterSelectPanel === 'function') {
                    window.updateCharacterSelectPanel();
                }
                if (window.updateRealtimePreview && typeof window.updateRealtimePreview === 'function') {
                    window.updateRealtimePreview();
                }
                
                console.log(`✅ v2.0形式復元完了: ${restoredCount}/${saveData.characters.length}キャラクター`);
                return true;
            }
        }
        
    } catch (error) {
        console.error('❌ v2.0形式復元エラー:', error);
    }
    
    // v2.0形式が失敗した場合、既存形式にフォールバック
    console.log('🔄 既存形式へフォールバック');
    
    try {
        const legacyData = localStorage.getItem('spine-positioning-state');
        if (legacyData) {
            const data = JSON.parse(legacyData);
            console.log('📊 既存形式データ発見:', data);
            
            // アクティブキャラクターに適用
            if (window.characters && window.characters[window.activeCharacterIndex || 0]) {
                const activeChar = window.characters[window.activeCharacterIndex || 0];
                // 既存システムで復元処理を実行
                console.log('⚠️ 既存形式で復元処理が必要');
                return false; // 既存システムに委譲
            }
        }
        
    } catch (error) {
        console.error('❌ 既存形式復元エラー:', error);
    }
    
    // さらにフォールバック：minimal形式もチェック
    try {
        const minimalData = localStorage.getItem('spine-positioning-state-minimal');
        if (minimalData) {
            console.log('📊 minimal形式データ発見、既存システムに委譲');
            return false; // 既存システムに委譲
        }
    } catch (error) {
        console.error('❌ minimal形式確認エラー:', error);
    }
    
    console.log('⚠️ 復元可能なデータが見つかりませんでした');
    return false;
}

/**
 * ストレージデータマイグレーション
 */
function migrateStorageData() {
    console.log('🔄 ストレージデータのマイグレーション開始');
    
    // 既にv2.0形式が存在するかチェック
    const v2Data = localStorage.getItem('spine-positioning-state-v2');
    if (v2Data) {
        console.log('✅ v2.0形式データが既に存在します');
        return true;
    }
    
    // 既存形式のデータをチェック
    const legacyData = localStorage.getItem('spine-positioning-state');
    const minimalData = localStorage.getItem('spine-positioning-state-minimal');
    
    let migrationSource = null;
    let sourceType = '';
    
    // より新しいデータを優先
    if (legacyData) {
        try {
            const data = JSON.parse(legacyData);
            migrationSource = data;
            sourceType = 'legacy';
        } catch (error) {
            console.error('❌ 既存形式データパースエラー:', error);
        }
    }
    
    if (minimalData) {
        try {
            const data = JSON.parse(minimalData);
            // タイムスタンプで比較
            if (!migrationSource || (data.timestamp && migrationSource.timestamp && data.timestamp > migrationSource.timestamp)) {
                migrationSource = data;
                sourceType = 'minimal';
            }
        } catch (error) {
            console.error('❌ minimal形式データパースエラー:', error);
        }
    }
    
    if (!migrationSource) {
        console.log('⚠️ マイグレーション可能なデータが見つかりません');
        return false;
    }
    
    console.log(`🔄 ${sourceType}形式からv2.0形式へマイグレーション開始`);
    
    // 既存形式データのマイグレーション
    try {
        const migratedData = {
            version: '2.0',
            formatVersion: 'spine-positioning-v2.0',
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            
            activeCharacterIndex: 0, // 既存形式は単一キャラクターのため
            currentScale: migrationSource.scale || 1.0,
            
            characters: [{
                id: migrationSource.id || 'migrated-character-0',
                name: migrationSource.character || 'メインキャラクター',
                selector: '#purattokun-canvas', // デフォルト推定
                
                position: {
                    left: migrationSource.left || '50%',
                    top: migrationSource.top || '50%',
                    transform: migrationSource.transform || 'translate(-50%, -50%)'
                },
                scale: migrationSource.scale || 1.0,
                
                zIndex: migrationSource.zIndex || 1000,
                originalOrder: 0,
                
                isActive: true, // マイグレーション時は最初のキャラクターをアクティブに
                isVisible: true,
                
                computed: {
                    width: 0,
                    height: 0,
                    left: 0,
                    top: 0
                },
                
                lastModified: migrationSource.timestamp || Date.now(),
                version: '2.0',
                migrated: true,
                migrationSource: sourceType
            }],
            
            session: {
                editStartTime: null,
                hasUnsavedChanges: false,
                tempSaveTime: null
            },
            
            stats: {
                totalCharacters: 1,
                visibleCharacters: 1,
                modifiedCharacters: (migrationSource.left !== '50%' || migrationSource.top !== '50%' || migrationSource.scale !== 1.0) ? 1 : 0
            },
            
            migration: {
                from: sourceType,
                timestamp: Date.now(),
                originalData: migrationSource
            }
        };
        
        localStorage.setItem('spine-positioning-state-v2', JSON.stringify(migratedData));
        console.log(`✅ ${sourceType}形式からv2.0形式へマイグレーション完了`);
        return true;
        
    } catch (error) {
        console.error('❌ マイグレーション中にエラーが発生:', error);
        return false;
    }
    
    // minimal形式データのマイグレーション
    if (minimalData) {
        try {
            const data = JSON.parse(minimalData);
            // 既存形式のデータがない場合、またはより新しい場合
            if (!migrationSource || (data.timestamp > migrationSource.timestamp)) {
                console.log('🔄 minimal形式を優先してマイグレーション');
                // minimal形式に特化したマイグレーションロジック
                // ...
            }
        } catch (error) {
            console.error('❌ minimal形式マイグレーションエラー:', error);
        }
    }
    
    // v2.0形式データを作成・保存
    if (window.characters && window.characters.length > 0) {
        console.log('🔄 現在のキャラクターデータからv2.0形式を作成');
        return savePositionV2();
    }
    
    return false;
}

/**
 * ストレージデータのデバッグ診断
 */
function debugStorageData() {
    console.log('🔍 ストレージデータ診断開始');
    
    // 利用可能なストレージキーを確認
    const keys = [
        'spine-positioning-state-v2',
        'spine-positioning-state',
        'spine-positioning-state-minimal'
    ];
    
    const results = {};
    
    keys.forEach(key => {
        try {
            const data = localStorage.getItem(key);
            if (data) {
                const parsed = JSON.parse(data);
                results[key] = {
                    exists: true,
                    size: data.length,
                    timestamp: parsed.timestamp || 'N/A',
                    version: parsed.version || 'N/A',
                    characterCount: parsed.characters ? parsed.characters.length : (parsed.character ? 1 : 0),
                    data: parsed
                };
                console.log(`✅ ${key}:`, results[key]);
            } else {
                results[key] = { exists: false };
                console.log(`❌ ${key}: データなし`);
            }
        } catch (error) {
            results[key] = { exists: true, error: error.message };
            console.error(`❌ ${key} パースエラー:`, error);
        }
    });
    
    // 現在のキャラクター状況も診断
    if (window.characters) {
        console.log('🎯 現在のキャラクター状況:');
        console.log(`  - 総数: ${window.characters.length}`);
        console.log(`  - アクティブ: ${window.activeCharacterIndex}`);
        console.log(`  - スケール: ${window.currentScale}`);
        
        window.characters.forEach((char, index) => {
            console.log(`  - [${index}] ${char.name}: ${char.element.style.left}, ${char.element.style.top}, scale:${char.scale}`);
        });
    }
    
    // 推奨アクション
    console.log('💡 推奨アクション:');
    if (!results['spine-positioning-state-v2'].exists) {
        console.log('  - v2.0形式への移行を推奨: migrateStorageData()');
    }
    if (results['spine-positioning-state-v2'].exists && results['spine-positioning-state'].exists) {
        console.log('  - 古い形式の削除を検討: localStorage.removeItem("spine-positioning-state")');
    }
    
    return results;
}

// ========== 後方互換性関数 ========== //

/**
 * 既存関数：後方互換性のため保持
 */
function savePosition() {
    return savePositionV2();
}

function restorePosition() {
    return restorePositionV2();
}

// ========== エクスポート ========== //

// グローバルアクセス用の関数をwindowオブジェクトに登録
if (typeof window !== 'undefined') {
    // 状態管理機能
    window.captureEditStartState = captureEditStartState;
    window.captureCurrentState = captureCurrentState;
    window.detectChanges = detectChanges;
    window.tempSave = tempSave;
    window.rollbackToEditStart = rollbackToEditStart;
    window.markAsChanged = markAsChanged;
    
    // ダイアログ機能
    window.showEditEndConfirmDialog = showEditEndConfirmDialog;
    window.showTempSaveDialog = showTempSaveDialog;
    
    // データ永続化機能
    window.savePositionV2 = savePositionV2;
    window.restorePositionV2 = restorePositionV2;
    window.migrateStorageData = migrateStorageData;
    window.debugStorageData = debugStorageData;
    
    // 後方互換性
    window.savePosition = savePosition;
    window.restorePosition = restorePosition;
    
    // 状態変数へのアクセス
    Object.defineProperty(window, 'editStartState', {
        get: () => editStartState,
        set: (value) => { editStartState = value; }
    });
    Object.defineProperty(window, 'tempSaveData', {
        get: () => tempSaveData,
        set: (value) => { tempSaveData = value; }
    });
    Object.defineProperty(window, 'hasUnsavedChanges', {
        get: () => hasUnsavedChanges,
        set: (value) => { hasUnsavedChanges = value; }
    });
}

console.log('✅ 状態管理モジュール読み込み完了');