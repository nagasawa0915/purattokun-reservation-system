// 🎯 Spine編集システム - UI生成・パネル管理モジュール v1.0
// 役割：編集ボタン・キャラクター選択・スケール調整・プレビューパネル・モバイル対応

console.log('🎨 UIパネル管理モジュール読み込み開始');

// ========== モバイル検出・スタイル管理 ========== //
let isMobile = window.innerWidth <= 768;

/**
 * モバイル用スタイル適用関数
 */
function applyMobileStyles() {
    isMobile = window.innerWidth <= 768;
    console.log('📱 モバイル検出:', isMobile ? 'モバイル' : 'デスクトップ');
    
    // キャラクター選択パネル
    const characterPanel = document.getElementById('character-select-panel');
    if (characterPanel) {
        if (isMobile) {
            Object.assign(characterPanel.style, {
                top: 'auto',
                right: 'auto',
                bottom: '180px',
                left: '50%',
                transform: 'translateX(-50%)',
                minWidth: '280px',
                maxWidth: 'calc(100vw - 20px)',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: '10003'
            });
        } else {
            Object.assign(characterPanel.style, {
                top: '60px',
                right: '10px',
                bottom: 'auto',
                left: 'auto',
                transform: 'none',
                minWidth: '200px',
                maxWidth: 'none',
                maxHeight: 'none',
                overflowY: 'visible',
                zIndex: '10000'
            });
        }
    }
    
    // スケール調整パネル
    const scalePanel = document.getElementById('scale-adjust-panel');
    if (scalePanel) {
        if (isMobile) {
            Object.assign(scalePanel.style, {
                top: 'auto',
                right: 'auto',
                bottom: '100px',
                left: '50%',
                transform: 'translateX(-50%)',
                minWidth: '280px',
                maxWidth: 'calc(100vw - 20px)',
                zIndex: '10002'
            });
        } else {
            Object.assign(scalePanel.style, {
                top: '280px',
                right: '10px',
                bottom: 'auto',
                left: 'auto',
                transform: 'none',
                minWidth: 'auto',
                maxWidth: 'none',
                zIndex: '10000'
            });
        }
    }
    
    // リアルタイムプレビューパネル
    const previewPanel = document.getElementById('realtime-preview-panel');
    if (previewPanel) {
        if (isMobile) {
            Object.assign(previewPanel.style, {
                top: 'auto',
                right: 'auto',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                minWidth: '280px',
                maxWidth: 'calc(100vw - 20px)',
                zIndex: '10001',
                fontSize: '12px',
                padding: '10px'
            });
        } else {
            Object.assign(previewPanel.style, {
                top: 'auto',
                right: '10px',
                bottom: '10px',
                left: 'auto',
                transform: 'none',
                minWidth: '200px',
                maxWidth: 'none',
                zIndex: '10000',
                fontSize: '11px',
                padding: '12px'
            });
        }
    }
    
    // レイヤーボタンのサイズ調整
    const layerButtons = document.querySelectorAll('.layer-btn');
    layerButtons.forEach(button => {
        if (isMobile) {
            Object.assign(button.style, {
                width: '36px',
                height: '36px',
                fontSize: '14px',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            });
        } else {
            Object.assign(button.style, {
                width: '20px',
                height: '20px',
                fontSize: '10px',
                borderRadius: '0',
                boxShadow: 'none'
            });
        }
    });
    
    // ドラッグハンドルのサイズ調整
    const dragHandles = document.querySelectorAll('.drag-handle');
    dragHandles.forEach(handle => {
        if (isMobile) {
            Object.assign(handle.style, {
                width: '28px',
                height: '32px',
                fontSize: '16px',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            });
        } else {
            Object.assign(handle.style, {
                width: '20px',
                height: '24px',
                fontSize: '14px',
                borderRadius: '2px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            });
        }
    });
}

// ========== 編集UI作成 ========== //

/**
 * 編集ボタンと基本UI作成
 * 依存関数: toggleEditMode, showTempSaveDialog
 */
function createEditButton() {
    console.log('🔧 編集ボタン作成開始');
    
    try {
        if (!document.body) {
            throw new Error('document.bodyが存在しません');
        }
        
        // 編集ボタン
        const button = document.createElement('button');
        button.id = 'minimal-edit-button';
        button.textContent = '位置編集';
        button.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 10px 20px;
            background: #ff6b6b;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            z-index: 10000;
            font-size: 14px;
        `;
        
        button.addEventListener('click', () => {
            if (typeof window.toggleEditMode === 'function') {
                window.toggleEditMode();
            } else {
                console.error('❌ toggleEditMode関数が見つかりません');
            }
        });
        document.body.appendChild(button);
        console.log('✅ 編集ボタンをDOMに追加しました');
        
        // 一時保存ボタン（編集モード時のみ表示）
        const tempSaveButton = document.createElement('button');
        tempSaveButton.id = 'temp-save-button';
        tempSaveButton.textContent = '💾 一時保存';
        tempSaveButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 120px;
            padding: 8px 16px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            z-index: 10000;
            font-size: 12px;
            display: none;
            transition: all 0.2s ease;
        `;
        
        tempSaveButton.addEventListener('click', () => {
            if (typeof window.showTempSaveDialog === 'function') {
                window.showTempSaveDialog();
            } else {
                console.error('❌ showTempSaveDialog関数が見つかりません');
            }
        });
        tempSaveButton.addEventListener('mouseenter', () => {
            tempSaveButton.style.background = '#1976D2';
            tempSaveButton.style.transform = 'translateY(-1px)';
        });
        tempSaveButton.addEventListener('mouseleave', () => {
            tempSaveButton.style.background = '#2196F3';
            tempSaveButton.style.transform = 'translateY(0)';
        });
        document.body.appendChild(tempSaveButton);
        
        // CSS出力ボタン（編集モード時のみ表示）
        const cssExportButton = document.createElement('button');
        cssExportButton.id = 'css-export-button';
        cssExportButton.textContent = '📋 CSS出力';
        cssExportButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 240px;
            padding: 8px 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            z-index: 10000;
            font-size: 12px;
            font-weight: 600;
            display: none;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        
        cssExportButton.addEventListener('click', () => {
            if (typeof window.showCSSExportDialog === 'function') {
                window.showCSSExportDialog();
            } else {
                console.error('❌ showCSSExportDialog関数が見つかりません（CSS出力モジュール未読み込み）');
                alert('CSS出力機能を利用するには、CSS出力モジュールを読み込んでください。');
            }
        });
        cssExportButton.addEventListener('mouseenter', () => {
            cssExportButton.style.background = 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)';
            cssExportButton.style.transform = 'translateY(-1px)';
            cssExportButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        });
        cssExportButton.addEventListener('mouseleave', () => {
            cssExportButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            cssExportButton.style.transform = 'translateY(0)';
            cssExportButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });
        document.body.appendChild(cssExportButton);
        
        // キャラクター選択パネル
        createCharacterSelectPanel();
        
        // スケール調整パネル
        createScalePanel();
        
        // リアルタイムプレビューパネル
        createRealtimePreviewPanel();
        
        console.log('✅ 全ての編集UI作成完了');
        
    } catch (error) {
        console.error('❌ 編集ボタン作成エラー:', error);
        console.error('エラー詳細:', {
            message: error.message,
            stack: error.stack,
            bodyExists: !!document.body,
            domReady: document.readyState
        });
    }
}

// ========== キャラクター選択パネル ========== //

/**
 * キャラクター選択パネル作成
 */
function createCharacterSelectPanel() {
    const panel = document.createElement('div');
    panel.id = 'character-select-panel';
    panel.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        z-index: 10000;
        display: none;
        min-width: 200px;
        font-size: 14px;
        top: 60px;
        right: 10px;
    `;
    
    document.body.appendChild(panel);
    updateCharacterSelectPanel();
    
    // モバイルスタイル適用
    applyMobileStyles();
}

/**
 * キャラクター選択パネル更新
 * 依存関数: setActiveCharacter, characters, activeCharacterIndex
 */
function updateCharacterSelectPanel() {
    const panel = document.getElementById('character-select-panel');
    if (!panel) return;
    
    const characters = window.characters || [];
    const activeCharacterIndex = window.activeCharacterIndex || 0;
    
    let html = '<div style="margin-bottom: 8px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 4px;">🎭 キャラクター & レイヤー管理</div>';
    
    if (characters.length === 0) {
        html += '<div style="color: #999; font-style: italic;">キャラクターが見つかりません</div>';
    } else {
        // レイヤー制御説明
        html += '<div style="font-size: 11px; color: #666; margin-bottom: 8px; padding: 4px; background: #f9f9f9; border-radius: 3px;">左のハンドル（⋮⋮）をドラッグして並び替え：下ほど前面に表示</div>';
        
        characters.forEach((char, index) => {
            const isActive = index === activeCharacterIndex;
            const statusIcon = isActive ? '🎯' : '⚪';
            
            html += `
                <div class="character-select-item" 
                     data-index="${index}" 
                     style="padding: 6px 8px; margin: 2px 0; border-radius: 3px; cursor: default; 
                            background: ${isActive ? '#e3f2fd' : 'transparent'}; 
                            border: ${isActive ? '2px solid #ff6b6b' : '1px solid #eee'};
                            display: flex; align-items: center; gap: 8px;
                            transition: all 0.2s ease;">
                    <div class="drag-handle" 
                         data-index="${index}"
                         draggable="true"
                         style="width: 20px; height: 24px; display: flex; align-items: center; justify-content: center; 
                                cursor: grab; border-radius: 2px; background: ${isActive ? '#ffebee' : '#f5f5f5'}; 
                                border: 1px solid ${isActive ? '#ff6b6b' : '#ddd'}; font-size: 14px; color: #666;
                                transition: all 0.2s ease; user-select: none; flex-shrink: 0;
                                box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                        ⋮⋮
                    </div>
                    <span style="font-size: 16px;">${statusIcon}</span>
                    <div style="flex: 1; cursor: pointer;">
                        <div style="font-weight: ${isActive ? 'bold' : 'normal'}; color: ${isActive ? '#ff6b6b' : '#333'};">
                            ${char.name}
                        </div>
                        <div style="font-size: 11px; color: #666;">
                            z-index: ${char.zIndex} • Scale: ${char.scale.toFixed(2)}
                        </div>
                    </div>
                    <div style="display: flex; gap: 2px;">
                        <button class="layer-btn" data-action="front" data-index="${index}" 
                                style="width: 20px; height: 20px; font-size: 10px; padding: 0; border: 1px solid #ddd; background: white; cursor: pointer;" title="最前面">⬆</button>
                        <button class="layer-btn" data-action="back" data-index="${index}" 
                                style="width: 20px; height: 20px; font-size: 10px; padding: 0; border: 1px solid #ddd; background: white; cursor: pointer;" title="最背面">⬇</button>
                    </div>
                </div>
            `;
        });
        
        // 統計情報
        html += `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                検出: ${characters.length}個のキャラクター • レイヤー順序: 1000-${999 + characters.length}
            </div>
        `;
    }
    
    panel.innerHTML = html;
    
    // ドラッグ&ドロップとイベントハンドラを追加
    setupCharacterPanelEvents(panel);
    
    // モバイルスタイル適用（レイヤーボタン含む）
    applyMobileStyles();
}

/**
 * キャラクターパネルのイベント設定（ドラッグ&ドロップ + ボタン + タッチ最適化）
 * 依存関数: setActiveCharacter, moveCharacterInLayer, bringCharacterToFront, sendCharacterToBack
 */
function setupCharacterPanelEvents(panel) {
    let draggedItem = null;
    let draggedIndex = -1;
    
    // タッチ専用変数
    let touchStartY = 0;
    let touchStartX = 0;
    let touchMoved = false;
    let touchStartTime = 0;
    
    const characters = window.characters || [];
    const activeCharacterIndex = window.activeCharacterIndex || 0;
    
    panel.querySelectorAll('.character-select-item').forEach(item => {
        const index = parseInt(item.dataset.index);
        const dragHandle = item.querySelector('.drag-handle');
        const contentArea = item.querySelector('div[style*="flex: 1"]');
        
        // キャラクター選択（クリック + タッチ最適化）- コンテンツエリアのみ
        contentArea.addEventListener('click', (e) => {
            // レイヤーボタンのクリックは除外
            if (e.target.classList.contains('layer-btn')) return;
            // タッチドラッグ後のクリックは除外
            if (touchMoved) return;
            
            if (typeof window.setActiveCharacter === 'function' && window.setActiveCharacter(index)) {
                updateCharacterSelectPanel(); // UI更新
                console.log('👆 キャラクター選択:', characters[index].name);
            }
        });
        
        // ドラッグハンドル専用のホバー効果
        dragHandle.addEventListener('mouseenter', () => {
            dragHandle.style.background = '#e3f2fd';
            dragHandle.style.borderColor = '#ff6b6b';
            dragHandle.style.cursor = 'grab';
            dragHandle.style.transform = 'scale(1.05)';
        });
        
        dragHandle.addEventListener('mouseleave', () => {
            const isActive = index === activeCharacterIndex;
            dragHandle.style.background = isActive ? '#ffebee' : '#f5f5f5';
            dragHandle.style.borderColor = isActive ? '#ff6b6b' : '#ddd';
            dragHandle.style.cursor = 'grab';
            dragHandle.style.transform = 'scale(1)';
        });
        
        // ドラッグハンドル専用のマウスダウンで grabbing カーソル
        dragHandle.addEventListener('mousedown', () => {
            dragHandle.style.cursor = 'grabbing';
        });
        
        // ドラッグハンドル専用イベント
        dragHandle.addEventListener('dragstart', (e) => {
            draggedItem = item;
            draggedIndex = index;
            e.dataTransfer.effectAllowed = 'move';
            dragHandle.style.cursor = 'grabbing';
            item.style.opacity = '0.7';
            console.log('🖱️ ハンドルドラッグ開始:', characters[index].name);
        });
        
        dragHandle.addEventListener('dragend', (e) => {
            draggedItem = null;
            draggedIndex = -1;
            dragHandle.style.cursor = 'grab';
            item.style.opacity = '1';
            console.log('🖱️ ハンドルドラッグ終了');
        });
        
        // ハンドル専用のタッチ開始（タッチドラッグ用）
        dragHandle.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            touchStartY = touch.clientY;
            touchStartX = touch.clientX;
            touchStartTime = Date.now();
            touchMoved = false;
            
            // ハンドルの視覚的フィードバック
            dragHandle.style.background = '#ffcdd2';
            dragHandle.style.transform = 'scale(1.1)';
            
            // 長押し検出（200ms後にドラッグモード開始 - ハンドルは短縮）
            setTimeout(() => {
                if (!touchMoved && Math.abs(Date.now() - touchStartTime - 200) < 50) {
                    draggedItem = item;
                    draggedIndex = index;
                    item.style.opacity = '0.7';
                    dragHandle.style.background = '#f44336';
                    dragHandle.style.color = 'white';
                    console.log('📱 ハンドルタッチドラッグ開始:', characters[index].name);
                }
            }, 200);
        }, { passive: true });
        
        // タッチ移動
        item.addEventListener('touchmove', (e) => {
            e.preventDefault(); // スクロール防止
            const touch = e.touches[0];
            const deltaY = Math.abs(touch.clientY - touchStartY);
            const deltaX = Math.abs(touch.clientX - touchStartX);
            
            if (deltaY > 10 || deltaX > 10) {
                touchMoved = true;
            }
            
            // ドラッグ中の視覚的フィードバック
            if (draggedItem === item) {
                const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
                const targetItem = elementUnderTouch?.closest('.character-select-item');
                
                // 全アイテムのハイライトをクリア
                panel.querySelectorAll('.character-select-item').forEach(otherItem => {
                    if (otherItem !== item) {
                        const otherIndex = parseInt(otherItem.dataset.index);
                        otherItem.style.background = otherIndex === activeCharacterIndex ? '#e3f2fd' : 'transparent';
                    }
                });
                
                // ターゲットアイテムをハイライト
                if (targetItem && targetItem !== item) {
                    targetItem.style.background = '#ffe0e0';
                }
            }
        }, { passive: false });
        
        // ハンドル専用のタッチ終了
        dragHandle.addEventListener('touchend', (e) => {
            // ハンドルの視覚的フィードバックをリセット
            const isActive = index === activeCharacterIndex;
            dragHandle.style.background = isActive ? '#ffebee' : '#f5f5f5';
            dragHandle.style.borderColor = isActive ? '#ff6b6b' : '#ddd';
            dragHandle.style.color = '#666';
            dragHandle.style.transform = 'scale(1)';
            
            if (draggedItem === item) {
                const touch = e.changedTouches[0];
                const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
                const targetItem = elementUnderTouch?.closest('.character-select-item');
                
                if (targetItem && targetItem !== item) {
                    const targetIndex = parseInt(targetItem.dataset.index);
                    if (typeof window.moveCharacterInLayer === 'function' && window.moveCharacterInLayer(draggedIndex, targetIndex)) {
                        console.log('📱 ハンドルタッチドラッグ完了:', characters[draggedIndex].name, '→', characters[targetIndex].name);
                    }
                }
                
                // ドラッグ状態をリセット
                item.style.opacity = '1';
                draggedItem = null;
                draggedIndex = -1;
            }
            
            // 300ms後にタッチ状態をリセット（クリックイベント処理後）
            setTimeout(() => {
                touchMoved = false;
            }, 300);
        }, { passive: true });
        
        // ホバー効果
        item.addEventListener('mouseenter', (e) => {
            if (index !== activeCharacterIndex) {
                e.currentTarget.style.background = '#f5f5f5';
            }
        });
        
        item.addEventListener('mouseleave', (e) => {
            if (index !== activeCharacterIndex) {
                e.currentTarget.style.background = 'transparent';
            }
        });
        
        
        // ドロップターゲット（他のアイテム上）
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            // 視覚的フィードバック
            if (draggedItem && draggedItem !== item) {
                item.style.background = '#ffe0e0';
            }
        });
        
        item.addEventListener('dragleave', (e) => {
            if (index !== activeCharacterIndex) {
                item.style.background = 'transparent';
            } else {
                item.style.background = '#e3f2fd';
            }
        });
        
        // ドロップ実行
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            
            if (draggedItem && draggedIndex !== -1 && draggedIndex !== index) {
                if (typeof window.moveCharacterInLayer === 'function' && window.moveCharacterInLayer(draggedIndex, index)) {
                    console.log('🖱️ ドロップ完了:', characters[draggedIndex].name, '→', characters[index].name);
                }
            }
            
            // スタイルをリセット
            if (index !== activeCharacterIndex) {
                item.style.background = 'transparent';
            } else {
                item.style.background = '#e3f2fd';
            }
        });
    });
    
    // レイヤー制御ボタン
    panel.querySelectorAll('.layer-btn').forEach(btn => {
        const action = btn.dataset.action;
        const index = parseInt(btn.dataset.index);
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // 親のクリックイベントを防ぐ
            
            if (action === 'front' && typeof window.bringCharacterToFront === 'function') {
                window.bringCharacterToFront(index);
            } else if (action === 'back' && typeof window.sendCharacterToBack === 'function') {
                window.sendCharacterToBack(index);
            }
        });
        
        // ボタンホバー効果
        btn.addEventListener('mouseenter', () => {
            btn.style.background = '#e3f2fd';
            btn.style.borderColor = '#ff6b6b';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'white';
            btn.style.borderColor = '#ddd';
        });
    });
}

// ========== スケール調整パネル ========== //

/**
 * スケール調整パネル作成
 * 依存関数: updateScalePanelForActiveCharacter, markAsChanged, updateRealtimePreview
 */
function createScalePanel() {
    const panel = document.createElement('div');
    panel.id = 'scale-adjust-panel';
    panel.style.cssText = `
        position: fixed;
        top: 280px;
        right: 10px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        z-index: 10000;
        display: none;
        min-width: 200px;
        font-size: 14px;
    `;
    
    panel.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 4px;">
            🔧 スケール調整
        </div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
            <label style="font-size: 12px; color: #666;">スケール:</label>
            <input type="range" id="scale-slider" min="0.1" max="3.0" step="0.01" value="1.0" 
                   style="flex: 1; margin: 0 4px;">
            <input type="number" id="scale-input" min="0.1" max="3.0" step="0.01" value="1.00" 
                   style="width: 60px; padding: 2px 4px; border: 1px solid #ddd; border-radius: 2px; font-size: 12px;">
        </div>
        <div style="display: flex; gap: 4px; margin-bottom: 8px;">
            <button id="scale-reset" style="flex: 1; padding: 4px 8px; font-size: 11px; border: 1px solid #ddd; background: white; border-radius: 2px; cursor: pointer;">
                リセット (1.0)
            </button>
            <button id="scale-test" style="flex: 1; padding: 4px 8px; font-size: 11px; border: 1px solid #ddd; background: white; border-radius: 2px; cursor: pointer;">
                テスト (2.0)
            </button>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // モバイルスタイル適用
    applyMobileStyles();
    
    // スライダー・入力要素イベント
    const slider = panel.querySelector('#scale-slider');
    const input = panel.querySelector('#scale-input');
    const resetBtn = panel.querySelector('#scale-reset');
    const testBtn = panel.querySelector('#scale-test');
    
    // スケール更新共通関数
    const updateScale = (newScale) => {
        const scale = Math.max(0.1, Math.min(3.0, parseFloat(newScale)));
        
        // アクティブキャラクターのスケールを更新
        if (window.characters && window.characters[window.activeCharacterIndex || 0]) {
            const activeChar = window.characters[window.activeCharacterIndex || 0];
            // characters配列のスケール値も更新
            activeChar.scale = scale;
            
            // 直接CSSでスケール調整
            const currentTransform = activeChar.element.style.transform || 'translate(-50%, -50%)';
            // 既存のscaleを除去してから新しいscaleを追加
            const transformWithoutScale = currentTransform.replace(/\s*scale\([^)]*\)/g, '');
            activeChar.element.style.transform = `${transformWithoutScale} scale(${scale})`;
            
            // グローバル変数も更新（後方互換性）
            window.currentScale = scale;
            
            // UI同期
            slider.value = scale;
            input.value = scale.toFixed(2);
            
            // キャラクター選択パネルのUI更新
            if (typeof window.updateCharacterSelectPanel === 'function') {
                window.updateCharacterSelectPanel();
            }
            
            // リアルタイムプレビュー更新
            if (typeof window.updateRealtimePreview === 'function') {
                window.updateRealtimePreview();
            }
            
            // スケール変更を記録
            if (typeof window.markAsChanged === 'function') {
                window.markAsChanged();
            }
            
            console.log(`🎛️ スケール更新: ${activeChar.name} → ${scale}`);
        }
    };
    
    // スライダーイベント
    slider.addEventListener('input', (e) => {
        updateScale(e.target.value);
    });
    
    // 数値入力イベント
    input.addEventListener('input', (e) => {
        updateScale(e.target.value);
    });
    
    // リセットボタン
    resetBtn.addEventListener('click', () => {
        updateScale(1.0);
    });
    
    // テストボタン（診断機能）
    let testScale = 2.0;
    let isTestActive = false;
    testBtn.addEventListener('click', () => {
        if (!isTestActive) {
            // 2倍スケールテスト
            const originalScale = window.characters && window.characters[window.activeCharacterIndex || 0] ? 
                window.characters[window.activeCharacterIndex || 0].scale : 1.0;
            
            updateScale(testScale);
            testBtn.textContent = `戻す (${originalScale.toFixed(2)})`;
            testBtn.style.background = '#ffe0e0';
            isTestActive = true;
            
            // 3秒後に自動で元に戻す
            setTimeout(() => {
                if (isTestActive) {
                    // 元に戻す
                    updateScale(originalScale);
                    testBtn.textContent = 'テスト (2.0)';
                    testBtn.style.background = 'white';
                    isTestActive = false;
                }
            }, 3000);
        } else {
            // 元に戻す
            const originalScale = parseFloat(testBtn.textContent.match(/\\((\\d+\\.\\d+)\\)/)?.[1] || 1.0);
            updateScale(originalScale);
            testBtn.textContent = 'テスト (2.0)';
            testBtn.style.background = 'white';
            isTestActive = false;
        }
    });
}

// ========== リアルタイムプレビューパネル ========== //

/**
 * リアルタイムプレビューパネル作成
 */
function createRealtimePreviewPanel() {
    const panel = document.createElement('div');
    panel.id = 'realtime-preview-panel';
    panel.style.cssText = `
        position: fixed;
        right: 10px;
        bottom: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border-radius: 6px;
        padding: 12px;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        line-height: 1.4;
        z-index: 10000;
        display: none;
        min-width: 200px;
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        
        /* デスクトップ配置 */
        @media (min-width: 769px) {
            max-width: 280px;
        }
        
        /* モバイル配置 */
        @media (max-width: 768px) {
            position: fixed;
            left: 50%;
            bottom: 10px;
            right: auto;
            transform: translateX(-50%);
            min-width: 280px;
            max-width: calc(100vw - 20px);
            font-size: 12px;
            padding: 10px;
            z-index: 10001;
        }
    `;
    
    panel.innerHTML = `
        <div id="preview-header" style="font-weight: bold; margin-bottom: 8px; color: #ff6b6b; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 4px;">
            📊 リアルタイムプレビュー
        </div>
        <div id="preview-element">要素: -</div>
        <div id="preview-position">位置: -, -</div>
        <div id="preview-scale">スケール: -</div>
        <div id="preview-size">サイズ: - × -</div>
        <div id="preview-zindex">z-index: -</div>
        <div id="preview-status" style="margin-top: 8px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 10px; color: #ccc;">
            待機中...
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // モバイルスタイル適用
    applyMobileStyles();
}

/**
 * リアルタイムプレビュー更新
 */
function updateRealtimePreview(customX = null, customY = null, customScale = null) {
    const panel = document.getElementById('realtime-preview-panel');
    if (!panel) return;
    
    const characters = window.characters || [];
    const activeCharacterIndex = window.activeCharacterIndex || 0;
    
    if (characters.length === 0 || !characters[activeCharacterIndex]) {
        // キャラクターが存在しない場合
        document.getElementById('preview-element').textContent = '要素: なし';
        document.getElementById('preview-position').textContent = '位置: -, -';
        document.getElementById('preview-scale').textContent = 'スケール: -';
        document.getElementById('preview-size').textContent = 'サイズ: - × -';
        document.getElementById('preview-zindex').textContent = 'z-index: -';
        document.getElementById('preview-status').textContent = 'キャラクターが見つかりません';
        document.getElementById('preview-status').style.color = '#ff6b6b';
        return;
    }
    
    const activeChar = characters[activeCharacterIndex];
    
    // 座標値を取得（カスタム値またはCSSから取得）
    let posX, posY, scale;
    
    if (customX !== null && customY !== null) {
        // ドラッグ中のリアルタイム値を使用
        posX = customX;
        posY = customY;
        scale = customScale || activeChar.scale;
    } else {
        // CSSから現在値を取得
        const computedStyle = getComputedStyle(activeChar.element);
        posX = activeChar.element.style.left || computedStyle.left || 'auto';
        posY = activeChar.element.style.top || computedStyle.top || 'auto';
        scale = activeChar.scale;
    }
    
    // 要素情報更新
    document.getElementById('preview-element').textContent = `要素: ${activeChar.name}`;
    
    // 座標・スケール情報更新
    document.getElementById('preview-position').textContent = `位置: ${posX}, ${posY}`;
    document.getElementById('preview-scale').textContent = `スケール: ${scale.toFixed(2)}`;
    
    // サイズ情報更新（実際の描画サイズ）
    const rect = activeChar.element.getBoundingClientRect();
    document.getElementById('preview-size').textContent = `サイズ: ${Math.round(rect.width)} × ${Math.round(rect.height)}px`;
    
    // z-index情報更新
    document.getElementById('preview-zindex').textContent = `z-index: ${activeChar.zIndex}`;
    
    // デバッグログ（ドラッグ中のみ）
    if (customX !== null) {
        console.log(`📊 プレビュー更新 (ドラッグ中): ${activeChar.name} → ${posX}, ${posY}, scale:${scale.toFixed(2)}`);
        document.getElementById('preview-status').textContent = `ドラッグ中... (${new Date().toLocaleTimeString()})`;
        document.getElementById('preview-status').style.color = '#4CAF50';
    } else {
        document.getElementById('preview-status').textContent = `最終更新: ${new Date().toLocaleTimeString()}`;
        document.getElementById('preview-status').style.color = '#ccc';
    }
}

// ========== ウィンドウリサイズ対応 ========== //

/**
 * ウィンドウリサイズ時のモバイルスタイル再適用
 */
let resizeTimeout;
window.addEventListener('resize', () => {
    // デバウンス処理（リサイズ終了後300ms後に実行）
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        applyMobileStyles();
    }, 300);
});

/**
 * ページ読み込み時の初期スタイル適用
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyMobileStyles);
} else {
    applyMobileStyles();
}

// ========== エクスポート ========== //

// グローバルアクセス用の関数をwindowオブジェクトに登録
if (typeof window !== 'undefined') {
    // UI作成関数
    window.createEditButton = createEditButton;
    window.createCharacterSelectPanel = createCharacterSelectPanel;
    window.updateCharacterSelectPanel = updateCharacterSelectPanel;
    window.setupCharacterPanelEvents = setupCharacterPanelEvents;
    window.createScalePanel = createScalePanel;
    window.createRealtimePreviewPanel = createRealtimePreviewPanel;
    window.updateRealtimePreview = updateRealtimePreview;
    
    // モバイル対応
    window.applyMobileStyles = applyMobileStyles;
    
    // モバイル検出状態へのアクセス
    Object.defineProperty(window, 'isMobile', {
        get: () => isMobile,
        set: (value) => { isMobile = value; }
    });
}

console.log('✅ UIパネル管理モジュール読み込み完了');