// 🎯 Spine編集システム - ドラッグ操作・イベント処理モジュール v1.0
// 役割：ドラッグ開始・移動・終了処理、座標計算、タッチ・マウス統一対応

console.log('🖱️ ドラッグシステムモジュール読み込み開始');

// ========== ドラッグ状態管理変数 ========== //
let isDragging = false;
let startMousePos = { x: 0, y: 0 };
let startElementPos = { left: 0, top: 0 };

// ========== ドラッグ処理システム ========== //

/**
 * 統一的な座標取得関数（マウス・タッチ対応）
 */
function getEventCoordinates(e) {
    if (e.touches && e.touches.length > 0) {
        // タッチイベントの場合
        return {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    } else {
        // マウスイベントの場合
        return {
            x: e.clientX,
            y: e.clientY
        };
    }
}

/**
 * ドラッグ開始処理
 * 依存関数: updateHighlightPosition, updateRealtimePreview, markAsChanged
 */
function startDrag(e) {
    if (!window.isEditMode) return;
    
    e.preventDefault();
    
    // タッチ操作時のスクロール防止
    if (e.touches) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    }
    
    isDragging = true;
    window.isDragging = isDragging; // グローバル同期
    
    const character = window.character;
    const currentScale = window.currentScale || 1.0;
    
    // ドラッグ開始時の視覚効果
    if (character) {
        character.style.opacity = '0.7';
        character.style.transform = `translate(-50%, -50%) scale(${currentScale}) rotate(2deg)`;
        character.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        character.style.zIndex = '9999'; // 最前面に移動
    }
    
    // ハイライトコンテナの強調
    if (character && character._highlightContainer) {
        const borderElement = character._highlightContainer.querySelector('.character-highlight-border');
        if (borderElement) {
            borderElement.style.borderWidth = '4px';
            borderElement.style.borderColor = '#ff3333';
            borderElement.style.animation = 'highlightPulse 0.5s ease-in-out infinite';
        }
    }
    
    // 開始位置を記録（タッチ・マウス統一対応）
    const coords = getEventCoordinates(e);
    startMousePos = { x: coords.x, y: coords.y };
    
    // 要素の現在位置を取得（親要素基準の%に変換）
    if (character) {
        const rect = character.getBoundingClientRect();
        const parentRect = character.parentElement.getBoundingClientRect();
        
        // 現在のスタイルから単位を確認
        const currentLeft = character.style.left;
        const currentTop = character.style.top;
        
        if (currentLeft.includes('%') && currentTop.includes('%')) {
            // すでに%単位の場合はそのまま使用
            startElementPos = {
                left: parseFloat(currentLeft),
                top: parseFloat(currentTop)
            };
        } else {
            // px座標から%単位に変換（親要素基準）
            startElementPos = {
                left: ((rect.left - parentRect.left) / parentRect.width) * 100,
                top: ((rect.top - parentRect.top) / parentRect.height) * 100
            };
        }
    }
    
    // グローバルイベントを設定（マウス・タッチ両対応）
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', handleDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
    
    // リアルタイムプレビュー更新（タッチ・マウス統一対応）
    if (typeof window.updateRealtimePreview === 'function') {
        window.updateRealtimePreview(coords.x + 'px', coords.y + 'px', currentScale);
    }
    
    console.log('🎯 ドラッグ開始 (親要素基準%):', startElementPos);
}

/**
 * ドラッグ移動処理
 * 依存関数: updateHighlightPosition, updateRealtimePreview
 */
function handleDrag(e) {
    if (!isDragging) return;
    
    // タッチ操作時のスクロール防止
    if (e.touches) {
        e.preventDefault();
    }
    
    const character = window.character;
    const currentScale = window.currentScale || 1.0;
    
    if (!character) return;
    
    // マウス・タッチの移動量を計算（統一座標取得）
    const coords = getEventCoordinates(e);
    const deltaX = coords.x - startMousePos.x;
    const deltaY = coords.y - startMousePos.y;
    
    // 親要素のサイズを取得（解決策1に準拠）
    const parentRect = character.parentElement.getBoundingClientRect();
    
    // 移動量を%に変換（親要素基準）
    const deltaXPercent = (deltaX / parentRect.width) * 100;
    const deltaYPercent = (deltaY / parentRect.height) * 100;
    
    // 新しい位置を計算
    const newLeft = startElementPos.left + deltaXPercent;
    const newTop = startElementPos.top + deltaYPercent;
    
    // 位置を適用（%単位で親要素基準）
    character.style.position = 'absolute';
    character.style.left = newLeft + '%';
    character.style.top = newTop + '%';
    // ドラッグ中の視覚効果を維持
    character.style.transform = `translate(-50%, -50%) scale(${currentScale}) rotate(2deg)`;
    
    // ハイライトコンテナの位置も同期更新
    if (character._highlightContainer && typeof window.updateHighlightPosition === 'function') {
        window.updateHighlightPosition(character, character._highlightContainer);
    }
    
    // リアルタイムプレビュー更新（ドラッグ中、タッチ・マウス統一対応）
    if (typeof window.updateRealtimePreview === 'function') {
        window.updateRealtimePreview(newLeft.toFixed(1) + '%', newTop.toFixed(1) + '%', currentScale);
    }
}

/**
 * ドラッグ終了処理
 * 依存関数: updateRealtimePreview, updateCharacterSelectPanel, markAsChanged
 */
function endDrag() {
    if (!isDragging) return;
    
    isDragging = false;
    window.isDragging = isDragging; // グローバル同期
    
    // タッチ操作時のスクロール制限を解除
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    
    const character = window.character;
    const currentScale = window.currentScale || 1.0;
    const characters = window.characters || [];
    const activeCharacterIndex = window.activeCharacterIndex || 0;
    
    // ドラッグ終了時の視覚効果リセット
    if (character) {
        character.style.opacity = '1';
        character.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
        character.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        // z-indexを元に戻す
        const activeChar = characters[activeCharacterIndex];
        if (activeChar) {
            character.style.zIndex = activeChar.zIndex;
        }
    }
    
    // ハイライトコンテナの強調を元に戻す
    if (character && character._highlightContainer) {
        const borderElement = character._highlightContainer.querySelector('.character-highlight-border');
        if (borderElement) {
            borderElement.style.borderWidth = '3px';
            borderElement.style.borderColor = '#ff6b6b';
            borderElement.style.animation = 'highlightPulse 2s ease-in-out infinite';
        }
    }
    
    // イベントリスナー削除（マウス・タッチ両対応）
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', handleDrag);
    document.removeEventListener('touchend', endDrag);
    
    // リアルタイムプレビュー最終更新
    if (typeof window.updateRealtimePreview === 'function') {
        window.updateRealtimePreview();
    }
    
    // アクティブキャラクターのscale値を更新
    if (characters[activeCharacterIndex]) {
        characters[activeCharacterIndex].scale = currentScale;
        if (typeof window.updateCharacterSelectPanel === 'function') {
            window.updateCharacterSelectPanel(); // UI反映
        }
    }
    
    // ドラッグによる位置変更を記録
    if (typeof window.markAsChanged === 'function') {
        window.markAsChanged();
    }
    
    console.log('✅ ドラッグ終了 - 視覚効果リセット完了');
}

// ========== 編集モード制御 ========== //

/**
 * 編集モード切り替え（統合版）
 * 依存関数: captureEditStartState, detectChanges, showEditEndConfirmDialog, 各UI更新関数
 */
function toggleEditMode() {
    const isEditMode = window.isEditMode || false;
    const characters = window.characters || [];
    
    if (!isEditMode) {
        // 編集モード開始
        console.log('🎬 編集モード開始');
        
        window.isEditMode = true;
        
        // 編集開始時の状態をキャプチャ
        if (typeof window.captureEditStartState === 'function') {
            window.captureEditStartState();
        }
        
        // アクティブキャラクターのみを編集可能にする（マウス・タッチ対応）
        if (window.character && typeof window.startDrag === 'function') {
            window.character.style.cursor = 'move';
            window.character.addEventListener('mousedown', window.startDrag);
            window.character.addEventListener('touchstart', window.startDrag, { passive: false });
            console.log('🎯 ドラッグイベントを設定 (統合版)');
        }
        
        // 全キャラクターにハイライト適用
        characters.forEach(char => {
            if (typeof window.addCharacterHighlight === 'function') {
                window.addCharacterHighlight(char.element);
            }
        });
        
        // パネル表示
        const characterPanel = document.getElementById('character-select-panel');
        const scalePanel = document.getElementById('scale-adjust-panel');
        if (characterPanel) characterPanel.style.display = 'block';
        if (scalePanel) scalePanel.style.display = 'block';
        
        // リアルタイムプレビューパネル表示
        const previewPanel = document.getElementById('realtime-preview-panel');
        if (previewPanel) {
            previewPanel.style.display = 'block';
            if (typeof window.updateRealtimePreview === 'function') {
                window.updateRealtimePreview();
            }
        }
        
        // 一時保存ボタン表示
        const tempSaveButton = document.getElementById('temp-save-button');
        if (tempSaveButton) {
            tempSaveButton.style.display = 'block';
        }
        
        console.log('✅ 編集モード有効化完了');
        
    } else {
        // 編集モード終了の処理
        console.log('🎬 編集モード終了開始');
        
        // 変更検知
        const hasChanges = typeof window.detectChanges === 'function' ? window.detectChanges() : false;
        
        if (hasChanges) {
            // 変更がある場合：確認ダイアログを表示
            if (typeof window.showEditEndConfirmDialog === 'function') {
                window.showEditEndConfirmDialog().then(result => {
                    switch (result) {
                        case 'save':
                            // 保存して終了
                            console.log('💾 保存して編集モードを終了');
                            endEditModeCommon(true);
                            break;
                        case 'discard':
                            // 破棄して終了（ロールバック）
                            console.log('🔄 変更を破棄して編集モードを終了');
                            if (typeof window.rollbackToEditStart === 'function') {
                                window.rollbackToEditStart();
                            }
                            endEditModeCommon(false);
                            break;
                        case 'exit':
                            // 変更なしで終了
                            console.log('❌ 変更なしで編集モードを終了');
                            endEditModeCommon(false);
                            break;
                        case 'continue':
                            // 編集を継続（何もしない）
                            console.log('✏️ 編集を継続');
                            break;
                    }
                }).catch(error => {
                    // エラー時は編集を継続
                    console.error('❌ ダイアログエラー:', error);
                });
            } else {
                // ダイアログ関数がない場合は直接終了
                endEditModeCommon(true);
            }
        } else {
            // 変更がない場合：そのまま終了
            console.log('✅ 変更なし - 編集モードを終了');
            endEditModeCommon(false);
        }
    }
}

/**
 * 編集モード終了の共通処理
 * 依存関数: removeCharacterHighlight, startDrag関数の削除
 */
function endEditModeCommon(shouldSave = false) {
    const characters = window.characters || [];
    
    // ボタンの状態を戻す
    const editButton = document.getElementById('minimal-edit-button');
    if (editButton) editButton.textContent = '位置編集';
    window.isEditMode = false;
    
    // 全キャラクターの編集機能を無効化（マウス・タッチ対応）
    characters.forEach(char => {
        if (typeof window.removeCharacterHighlight === 'function') {
            window.removeCharacterHighlight(char.element);
        }
        if (typeof window.startDrag === 'function') {
            char.element.removeEventListener('mousedown', window.startDrag);
            char.element.removeEventListener('touchstart', window.startDrag);
        }
        char.element.style.cursor = 'default';
    });
    
    // 後方互換性：従来のcharacter変数も処理（マウス・タッチ対応）
    if (window.character && typeof window.startDrag === 'function') {
        window.character.removeEventListener('mousedown', window.startDrag);
        window.character.removeEventListener('touchstart', window.startDrag);
        window.character.style.cursor = 'default';
    }
    
    // パネル非表示
    const characterPanel = document.getElementById('character-select-panel');
    const scalePanel = document.getElementById('scale-adjust-panel');
    if (characterPanel) characterPanel.style.display = 'none';
    if (scalePanel) scalePanel.style.display = 'none';
    
    // リアルタイムプレビューパネル非表示
    const previewPanel = document.getElementById('realtime-preview-panel');
    if (previewPanel) previewPanel.style.display = 'none';
    
    // 一時保存ボタン非表示
    const tempSaveButton = document.getElementById('temp-save-button');
    if (tempSaveButton) tempSaveButton.style.display = 'none';
    
    // 保存処理（必要な場合のみ）
    if (shouldSave && typeof window.savePositionV2 === 'function') {
        window.savePositionV2();
        console.log('💾 編集内容を保存しました');
    }
    
    // 編集状態をリセット
    if (typeof window.captureEditStartState === 'function') {
        window.editStartState = null;
    }
    if (typeof window.markAsChanged === 'function') {
        window.hasUnsavedChanges = false;
    }
    
    console.log('✅ 編集モード終了処理完了');
}

// ========== エクスポート ========== //

// グローバルアクセス用の関数をwindowオブジェクトに登録
if (typeof window !== 'undefined') {
    // ドラッグ機能
    window.getEventCoordinates = getEventCoordinates;
    window.startDrag = startDrag;
    window.handleDrag = handleDrag;
    window.endDrag = endDrag;
    
    // 編集モード制御
    window.toggleEditMode = toggleEditMode;
    window.endEditModeCommon = endEditModeCommon;
    
    // ドラッグ状態変数へのアクセス
    Object.defineProperty(window, 'isDragging', {
        get: () => isDragging,
        set: (value) => { isDragging = value; }
    });
    Object.defineProperty(window, 'startMousePos', {
        get: () => startMousePos,
        set: (value) => { startMousePos = value; }
    });
    Object.defineProperty(window, 'startElementPos', {
        get: () => startElementPos,
        set: (value) => { startElementPos = value; }
    });
}

console.log('✅ ドラッグシステムモジュール読み込み完了');