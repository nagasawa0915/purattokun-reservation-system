// 🎯 Spine編集システム v2.0 - クリーンリビルド版
// シンプル・保守性・動作確実性を重視した設計

console.log('🚀 Spine編集システム v2.0 読み込み開始');

// ========== 基本設定・グローバル変数 ========== //

// 編集モード制御
let isCharacterEditMode = false;
// Canvas編集モード削除

// 操作状態
let isDragging = false;
let isResizing = false;
let activeHandle = null;

// マウス操作記録
let startMousePos = { x: 0, y: 0 };
let startElementState = {};

// DOM要素参照
let character = null;
// characterCanvas削除：不要
let editConfirmPanel = null;
let coordinateDisplay = null;

// 保存状態（localStorage用・%座標系統一・動的CSS値取得）
let savedState = {
    character: { left: null, top: null, width: null }
    // ☝️ 初期化時に実際のCSS値から動的に取得される
};

console.log('✅ v2.0 基本設定完了');

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

console.log('✅ v2.0 動的取得システム準備完了');

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
    }
    
    // 🔧 **緊急修正**: 処理順序の最適化（多重復元システム統合）
    // 1. まずlocalStorageから保存状態を読み込む
    loadSavedState();
    
    // 2. UI要素作成
    createCoordinateDisplay();
    createConfirmPanel();
    
    // 3. 初期状態設定（character要素が確実に取得された後に実行）
    if (character) {
        // 🎯 **最重要**: setupCharacterInitialState()が保存状態復元を担当
        setupCharacterInitialState();
        
        // 🆕 **緊急追加**: 多重復元システムを並行実行（確実な復元のため）
        setTimeout(() => {
            console.log('🚨 多重復元システム起動（通常ページ読み込み時）');
            multiRestoreSystem();
        }, 100);
        
        // 4. 復元結果の最終確認（デバッグ用）
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
                    emergencyDiagnostic();
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

// 🗑️ Canvas作成削除：不要（直接character要素を編集）

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

function createCoordinateDisplay() {
    coordinateDisplay = document.getElementById('coordinate-display');
    if (!coordinateDisplay) {
        coordinateDisplay = document.createElement('div');
        coordinateDisplay.id = 'coordinate-display';
        coordinateDisplay.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            z-index: 1000;
            display: none;
        `;
        document.body.appendChild(coordinateDisplay);
    }
    console.log('✅ 座標表示作成完了');
}

function createConfirmPanel() {
    editConfirmPanel = document.getElementById('edit-confirm-panel');
    if (!editConfirmPanel) {
        editConfirmPanel = document.createElement('div');
        editConfirmPanel.id = 'edit-confirm-panel';
        editConfirmPanel.className = 'confirm-panel';
        editConfirmPanel.innerHTML = `
            <div id="confirm-panel-header" style="background: #f8f9fa; padding: 4px 8px; border-bottom: 1px solid #eee; border-radius: 5px 5px 0 0; cursor: move; text-align: center;">
                <span style="font-size: 10px; font-weight: bold; color: #666;">📝 確認</span>
            </div>
            <div style="text-align: center; padding: 8px;">
                <p style="margin: 0 0 8px 0; font-size: 10px; color: #333;">編集を確定しますか？</p>
                
                
                <div style="display: flex; gap: 6px; justify-content: center; margin-top: 8px;">
                    <button class="save-btn" onclick="confirmEdit()" style="padding: 4px 8px; background: #4caf50; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 9px;">保存</button>
                    <button class="cancel-btn" onclick="cancelEdit()" style="padding: 4px 8px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 9px;">キャンセル</button>
                </div>
            </div>
        `;
        
        // 🔧 修正: スタイル設定を完全にリセット
        // 画面中央への配置を強制し、bottom/right/transformを明示的に無効化
        const centerX = (window.innerWidth - 160) / 2;
        const centerY = (window.innerHeight - 180) / 2;
        
        editConfirmPanel.style.cssText = `
            position: fixed !important;
            left: ${centerX}px !important;
            top: ${centerY}px !important;
            bottom: unset !important;
            right: unset !important;
            transform: none !important;
            background: white;
            border: 1px solid #ddd;
            border-radius: 6px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            z-index: 2000;
            cursor: move;
            min-width: 160px;
            display: none;
        `;
        document.body.appendChild(editConfirmPanel);
        
        console.log('🔧 確認パネル作成時に画面中央へ強制配置:', { x: centerX, y: centerY });
        
        // 確認パネルのドラッグ機能を設定
        setupConfirmPanelDragging();
    }
    console.log('✅ 確定パネル作成完了');
}

// 確認パネルドラッグ機能設定
function setupConfirmPanelDragging() {
    const confirmHeader = document.getElementById('confirm-panel-header');
    
    if (!confirmHeader || !editConfirmPanel) return;
    
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    // ドラッグ開始
    confirmHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = editConfirmPanel.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        
        editConfirmPanel.style.transition = 'none';
        editConfirmPanel.style.transform = 'none'; // translateX(-50%)を無効化
        document.addEventListener('mousemove', handleConfirmDrag);
        document.addEventListener('mouseup', handleConfirmDragEnd);
        e.preventDefault();
    });
    
    // ドラッグ中
    function handleConfirmDrag(e) {
        if (!isDragging) return;
        
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // 画面端からはみ出さないよう制限
        const maxX = window.innerWidth - editConfirmPanel.offsetWidth;
        const maxY = window.innerHeight - editConfirmPanel.offsetHeight;
        
        const boundedX = Math.max(0, Math.min(newX, maxX));
        const boundedY = Math.max(0, Math.min(newY, maxY));
        
        editConfirmPanel.style.left = boundedX + 'px';
        editConfirmPanel.style.top = boundedY + 'px';
    }
    
    // ドラッグ終了
    function handleConfirmDragEnd() {
        isDragging = false;
        editConfirmPanel.style.transition = '';
        document.removeEventListener('mousemove', handleConfirmDrag);
        document.removeEventListener('mouseup', handleConfirmDragEnd);
        
        // 位置を記憶（localStorage）
        const rect = editConfirmPanel.getBoundingClientRect();
        localStorage.setItem('confirmPanelPosition', JSON.stringify({
            x: rect.left,
            y: rect.top
        }));
    }
    
    // 🔧 修正：ドラッグ設定時にも強制的に位置をリセット
    // 問題: 何らかの理由でbottomプロパティが設定されている可能性
    setTimeout(() => {
        const screenCenterX = (window.innerWidth - 160) / 2;
        const screenCenterY = (window.innerHeight - 180) / 2;
        
        // すべての位置関連プロパティを強制リセット
        editConfirmPanel.style.position = 'fixed';
        editConfirmPanel.style.left = screenCenterX + 'px';
        editConfirmPanel.style.top = screenCenterY + 'px';
        editConfirmPanel.style.bottom = '';
        editConfirmPanel.style.right = '';
        editConfirmPanel.style.transform = '';
        editConfirmPanel.style.margin = '0';
        
        // CSSクラスによる影響を除去するためにクラスを再設定
        editConfirmPanel.className = 'confirm-panel';
        
        console.log('🔧 確認パネル位置を強制リセット:', { 
            x: screenCenterX, 
            y: screenCenterY,
            appliedStyles: {
                position: editConfirmPanel.style.position,
                left: editConfirmPanel.style.left,
                top: editConfirmPanel.style.top,
                bottom: editConfirmPanel.style.bottom || '(空)',
                right: editConfirmPanel.style.right || '(空)',
                transform: editConfirmPanel.style.transform || '(空)'
            }
        });
    }, 0);
    
    // 🚫 localStorage復元処理を無効化（問題の原因のため）
    /*
    const savedPosition = localStorage.getItem('confirmPanelPosition');
    if (savedPosition) {
        const pos = JSON.parse(savedPosition);
        
        // 画面内に収まるよう調整
        const maxX = window.innerWidth - 140; // パネル最小幅を考慮
        const maxY = window.innerHeight - 100; // パネル高さを考慮
        
        const boundedX = Math.max(0, Math.min(pos.x, maxX));
        const boundedY = Math.max(0, Math.min(pos.y, maxY));
        
        editConfirmPanel.style.left = boundedX + 'px';
        editConfirmPanel.style.top = boundedY + 'px';
        editConfirmPanel.style.transform = 'none';
        
        console.log('📍 確認パネル位置復元:', { saved: pos, adjusted: { x: boundedX, y: boundedY } });
    } else {
        // 初期位置：画面中央（保存された位置がない場合のみ）
        console.log('📍 確認パネル初期位置設定: 画面中央');
    }
    */
}

// 確認パネル位置リセット（デバッグ用）
function resetConfirmPanelPosition() {
    localStorage.removeItem('confirmPanelPosition');
    if (editConfirmPanel) {
        // **🆕 修正：画面中央への確実なリセット**
        const screenCenterX = (window.innerWidth - 160) / 2;
        const screenCenterY = (window.innerHeight - 180) / 2;
        
        editConfirmPanel.style.left = screenCenterX + 'px';
        editConfirmPanel.style.top = screenCenterY + 'px';
        editConfirmPanel.style.bottom = ''; // bottom固定を完全に削除
        editConfirmPanel.style.transform = 'none';
        
        console.log('🔄 確認パネル位置を画面中央にリセット:', { 
            x: screenCenterX, 
            y: screenCenterY 
        });
    }
}

// 確認パネル位置デバッグ情報表示（デバッグ用）
function debugConfirmPanelPosition() {
    if (!editConfirmPanel) {
        console.log('❌ 確認パネルが存在しません');
        return;
    }
    
    const rect = editConfirmPanel.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(editConfirmPanel);
    const savedPosition = localStorage.getItem('confirmPanelPosition');
    
    console.log('🔍 確認パネル位置デバッグ情報:', {
        dom_rect: {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
        },
        inline_style: {
            left: editConfirmPanel.style.left,
            top: editConfirmPanel.style.top,
            bottom: editConfirmPanel.style.bottom,
            transform: editConfirmPanel.style.transform
        },
        computed_style: {
            left: computedStyle.left,
            top: computedStyle.top,
            bottom: computedStyle.bottom,
            transform: computedStyle.transform
        },
        saved_position: savedPosition ? JSON.parse(savedPosition) : 'なし',
        display: computedStyle.display
    });
    
    // 🆕 問題診断用の追加情報
    const problems = [];
    if (computedStyle.bottom !== 'auto' && computedStyle.bottom !== '') {
        problems.push(`⚠️ bottom値が設定されています: ${computedStyle.bottom}`);
    }
    if (rect.bottom > window.innerHeight - 50) {
        problems.push(`⚠️ パネルが画面下部に寄っています (bottom: ${rect.bottom}, 画面高さ: ${window.innerHeight})`);
    }
    if (computedStyle.transform !== 'none') {
        problems.push(`⚠️ transform値が設定されています: ${computedStyle.transform}`);
    }
    
    if (problems.length > 0) {
        console.warn('🚨 検出された問題:', problems);
    } else {
        console.log('✅ 位置設定に問題はありません');
    }
}

// ========== 外部インターフェース ========== //

function startCharacterEdit() {
    console.log('🎯 キャラクター編集モード開始（計算値ベース位置保持）');
    
    // DOM初期化を先に実行
    if (!initializeDOMElements()) {
        console.error('❌ DOM初期化失敗');
        return;
    }
    
    // character要素の存在確認
    if (!character) {
        console.error('❌ character要素が見つかりません');
        return;
    }
    
    // 🎯 スタイル値を優先的に使用（transform影響を避ける）
    let currentStyles = {
        left: character.style.left,
        top: character.style.top,
        width: character.style.width
    };
    
    // スタイル値が空の場合は動的取得を使用
    if (!currentStyles.left || !currentStyles.top || !currentStyles.width) {
        console.log('⚠️ スタイル値が未設定。動的取得を実行');
        // 🎯 汎用性：動的取得を使用（固定値に依存しない）
        const dynamicState = getDynamicCharacterState(character);
        currentStyles.left = currentStyles.left || dynamicState.left;
        currentStyles.top = currentStyles.top || dynamicState.top;
        currentStyles.width = currentStyles.width || dynamicState.width;
        
        // デフォルト値を実際に設定
        character.style.left = currentStyles.left;
        character.style.top = currentStyles.top;
        character.style.width = currentStyles.width;
    }
    
    const preEditState = {
        style_left: currentStyles.left,
        style_top: currentStyles.top,
        style_width: currentStyles.width,
        has_transform: window.getComputedStyle(character).transform !== 'none'
    };
    
    console.log('📍 編集開始前の位置記録（スタイル値優先）:', preEditState);
    
    // 🔧 位置の再設定は基本的に不要（既にスタイル値が設定されているため）
    // ただし、ラッパーが作成されている場合は念のため再設定
    if (character.classList.contains('character-wrapper')) {
        console.log('🔧 ラッパー検出 - 位置を再設定');
        character.style.left = preEditState.style_left;
        character.style.top = preEditState.style_top;
        character.style.width = preEditState.style_width;
    } else {
        console.log('✅ 既存のスタイル値を維持');
    }
    
    
    console.log('✅ 位置復元完了:', {
        復元後_left: character.style.left,
        復元後_top: character.style.top,
        復元後_width: character.style.width
    });
    
    isCharacterEditMode = true;
    character.classList.add('edit-mode');
    
    // ハンドル作成
    createHandles();
    
    // イベントリスナー設定
    setupEventListeners();
    
    // UI更新
    updateUI();
    showConfirmPanel();
    
    
    console.log('✅ キャラクター編集モード有効化完了（計算値ベース保持・数値入力システム統合）');
}

// 🗑️ Canvas編集機能削除：表示範囲編集は不要

// ========== コア機能：移動・保存・復元 ========== //

function setupEventListeners() {
    console.log('🔧 イベントリスナー設定開始（マウス・タッチ対応）');
    
    // キャラクター移動イベント（マウス・タッチ両対応）
    if (isCharacterEditMode && character) {
        // マウスイベント
        character.addEventListener('mousedown', startCharacterDrag);
        // タッチイベント
        character.addEventListener('touchstart', handleTouchStart, { passive: false });
    }
    
    // Canvas移動イベント削除：不要
    
    // グローバルイベント（マウス・タッチ両対応）
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    console.log('✅ イベントリスナー設定完了（マウス・タッチ対応）');
}

function startCharacterDrag(e) {
    // ハンドル判定を厳密に行う
    if (!isCharacterEditMode || 
        e.target.classList.contains('handle') || 
        e.target.closest('.handle') ||
        isResizing) {
        console.log('🚫 character移動をスキップ:', {
            isCharacterEditMode,
            isHandle: e.target.classList.contains('handle'),
            isResizing
        });
        return;
    }
    
    console.log('🎯 character移動開始（%ベース）');
    e.preventDefault();
    isDragging = true;
    startMousePos = { x: e.clientX, y: e.clientY };
    
    // 現在の%位置を記録
    const currentState = character.style.left ? 
        { left: character.style.left, top: character.style.top } :
        getDynamicCharacterState(character);
    
    startElementState = {
        leftPercent: parseFloat(currentState.left),
        topPercent: parseFloat(currentState.top)
    };
    
    updateCoordinateDisplay();
    console.log('🎯 キャラクタードラッグ開始（%座標）:', startElementState);
}

// 🗑️ Canvas移動削除：不要

// ========== タッチイベント対応（モバイル操作実現） ========== //

function handleTouchStart(e) {
    console.log('📱 タッチ開始（キャラクター）');
    
    // ハンドル判定を厳密に行う（マウスイベントと同様）
    if (!isCharacterEditMode || 
        e.target.classList.contains('handle') || 
        e.target.closest('.handle') ||
        isResizing) {
        console.log('🚫 キャラクタータッチをスキップ:', {
            isCharacterEditMode,
            isHandle: e.target.classList.contains('handle'),
            isResizing
        });
        return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    // タッチ座標を取得（最初のタッチポイント）
    const touch = e.touches[0];
    
    // マウスイベントと同じロジックでドラッグ開始
    console.log('🎯 キャラクタータッチ移動開始（%ベース）');
    isDragging = true;
    startMousePos = { x: touch.clientX, y: touch.clientY };
    
    // 現在の%位置を記録
    const currentState = character.style.left ? 
        { left: character.style.left, top: character.style.top } :
        getDynamicCharacterState(character);
    
    startElementState = {
        leftPercent: parseFloat(currentState.left),
        topPercent: parseFloat(currentState.top)
    };
    
    updateCoordinateDisplay();
    console.log('🎯 キャラクタータッチドラッグ開始（%座標）:', startElementState);
}

function handleTouchMove(e) {
    if (!isDragging && !isResizing) return;
    
    e.preventDefault(); // スクロール防止
    
    // タッチ座標を取得（最初のタッチポイント）
    const touch = e.touches[0];
    
    const deltaX = touch.clientX - startMousePos.x;
    const deltaY = touch.clientY - startMousePos.y;
    
    // リサイズを優先処理（ハンドル操作）
    if (isResizing) {
        console.log('🔧 タッチリサイズ処理:', { deltaX, deltaY });
        performResize(deltaX, deltaY);
    } else if (isDragging) {
        console.log('🔧 タッチ移動処理:', { deltaX, deltaY });
        if (isCharacterEditMode) {
            moveCharacter(deltaX, deltaY);
        }
    }
    
    updateCoordinateDisplay();
}

function handleTouchEnd(e) {
    if (isDragging || isResizing) {
        console.log('🔄 タッチ操作終了:', { isDragging, isResizing });
        
        // 状態リセット（マウスイベントと同じ）
        isDragging = false;
        isResizing = false;
        activeHandle = null;
        
        // CSS状態リセット
        if (character) {
            character.classList.remove('dragging', 'resize-mode');
        }
        
        console.log('✅ タッチ状態リセット完了');
    }
}

function handleMouseMove(e) {
    if (!isDragging && !isResizing) return;
    
    const deltaX = e.clientX - startMousePos.x;
    const deltaY = e.clientY - startMousePos.y;
    
    // リサイズを優先処理（ハンドル操作）
    if (isResizing) {
        console.log('🔧 リサイズ処理:', { deltaX, deltaY });
        performResize(deltaX, deltaY);
    } else if (isDragging) {
        console.log('🔧 移動処理:', { deltaX, deltaY });
        if (isCharacterEditMode) {
            moveCharacter(deltaX, deltaY);
        }
    }
    
    updateCoordinateDisplay();
}

function moveCharacter(deltaX, deltaY) {
    // マウス移動量をビューポート%に変換
    const parentRect = character.parentElement.getBoundingClientRect();
    const deltaXPercent = (deltaX / parentRect.width) * 100;
    const deltaYPercent = (deltaY / parentRect.height) * 100;
    
    let newLeftPercent = startElementState.leftPercent + deltaXPercent;
    let newTopPercent = startElementState.topPercent + deltaYPercent;
    
    // 境界制限（%ベース）
    newLeftPercent = Math.max(5, Math.min(95, newLeftPercent));
    newTopPercent = Math.max(5, Math.min(95, newTopPercent));
    
    // %座標でスタイル適用
    character.style.left = newLeftPercent + '%';
    character.style.top = newTopPercent + '%';
    
    console.log('🔧 移動更新（%）:', {
        left: newLeftPercent.toFixed(1) + '%',
        top: newTopPercent.toFixed(1) + '%'
    });
}

// 🗑️ Canvas移動削除：不要

function handleMouseUp() {
    if (isDragging || isResizing) {
        console.log('🔄 操作終了:', { isDragging, isResizing });
        
        // 状態リセット
        isDragging = false;
        isResizing = false;
        activeHandle = null;
        
        // CSS状態リセット
        if (character) {
            character.classList.remove('dragging', 'resize-mode');
        }
        // characterCanvas削除済み：不要
        
        console.log('✅ 状態リセット完了');
    }
}

function updateCoordinateDisplay() {
    if (!coordinateDisplay) return;
    
    coordinateDisplay.style.display = 'block';
    
    if (isCharacterEditMode && character) {
        // 🎯 動的取得を使用（固定値に依存しない）
        const currentState = character.style.left ? 
            { left: character.style.left, top: character.style.top, width: character.style.width } :
            getDynamicCharacterState(character);
            
        coordinateDisplay.textContent = `キャラクター: ${currentState.left}, ${currentState.top}, W=${currentState.width}`;
    }
}

function updateUI() {
    // ボタンの状態更新（キャラクター編集のみ）
    const charBtn = document.getElementById('edit-character-btn');
    
    if (charBtn) {
        charBtn.textContent = isCharacterEditMode ? 'キャラクター編集中...' : 'キャラクター編集';
        charBtn.style.background = isCharacterEditMode ? '#4caf50' : '#ff6b6b';
    }
}

function showConfirmPanel() {
    if (editConfirmPanel) {
        // 🔧 修正：表示前にすべてのスタイルを完全リセット
        const screenCenterX = (window.innerWidth - 160) / 2;
        const screenCenterY = (window.innerHeight - 180) / 2;
        
        // displayを変更する前にスタイルを完全に設定
        editConfirmPanel.style.cssText = `
            position: fixed !important;
            left: ${screenCenterX}px !important;
            top: ${screenCenterY}px !important;
            bottom: unset !important;
            right: unset !important;
            transform: none !important;
            margin: 0 !important;
            background: white;
            border: 1px solid #ddd;
            border-radius: 6px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            z-index: 2000;
            cursor: move;
            min-width: 160px;
            display: block;
        `;
        
        console.log('🔧 確認パネル表示時に完全なスタイルリセット実行:', { 
            x: screenCenterX, 
            y: screenCenterY,
            cssText: editConfirmPanel.style.cssText
        });
        
        // 遅延実行でも確実に位置を固定
        setTimeout(() => {
            if (editConfirmPanel && editConfirmPanel.style.display === 'block') {
                const computedStyle = window.getComputedStyle(editConfirmPanel);
                if (computedStyle.bottom !== 'auto' && computedStyle.bottom !== '') {
                    console.warn('⚠️ bottomプロパティが再設定されています。強制的に削除します。');
                    editConfirmPanel.style.bottom = '';
                    editConfirmPanel.style.top = screenCenterY + 'px';
                }
            }
        }, 100);
        
        // 🚫 元の画面内調整処理を無効化（問題の原因のため）
        /*
        setTimeout(() => {
            const rect = editConfirmPanel.getBoundingClientRect();
            const margin = 10; // 画面端からのマージン
            const maxX = window.innerWidth - rect.width - margin;
            const maxY = window.innerHeight - rect.height - margin;
            
            let needsAdjustment = false;
            let newX = rect.left;
            let newY = rect.top;
            
            // 完全に画面外にはみ出している場合のみ調整
            if (rect.left < 0) {
                newX = margin;  
                needsAdjustment = true;
            } else if (rect.right > window.innerWidth) {
                newX = maxX;
                needsAdjustment = true;
            }
            
            if (rect.top < 0) {
                newY = margin;
                needsAdjustment = true;
            } else if (rect.bottom > window.innerHeight) {
                newY = maxY;
                needsAdjustment = true;
            }
            
            if (needsAdjustment) {
                editConfirmPanel.style.left = newX + 'px';
                editConfirmPanel.style.top = newY + 'px';
                editConfirmPanel.style.transform = 'none';
                console.log('📍 確認パネル画面内調整:', { 
                    reason: '画面外はみ出し防止',
                    from: { x: rect.left, y: rect.top }, 
                    to: { x: newX, y: newY } 
                });
            } else {
                console.log('📍 確認パネル位置調整不要:', { 
                    position: { x: rect.left, y: rect.top },
                    screen: { width: window.innerWidth, height: window.innerHeight }
                });
            }
        }, 10); // 少し遅延して位置確認
        */
        
        console.log('✅ 確認パネル表示');
    }
}

function hideConfirmPanel() {
    if (editConfirmPanel) {
        editConfirmPanel.style.display = 'none';
        console.log('✅ 確認パネル非表示');
    }
}

// ========== 保存・復元システム ========== //

function loadSavedState() {
    try {
        const saved = localStorage.getItem('spine-positioning-state');
        console.log('🔍 localStorage読み込み開始:', saved ? '保存データあり' : '保存データなし');
        
        if (saved) {
            const loadedState = JSON.parse(saved);
            
            console.log('📊 localStorage読み込み詳細分析:', {
                raw_data: saved,
                parsed_data: loadedState,
                current_state: savedState
            });
            
            // 🔧 **重要修正**: 保存データの厳密な検証
            if (loadedState.character && 
                loadedState.character.left && 
                loadedState.character.top && 
                loadedState.character.width) {
                
                // %単位のデータのみ有効とする
                const hasValidData = 
                    loadedState.character.left.includes('%') &&
                    loadedState.character.top.includes('%') &&
                    loadedState.character.width.includes('%');
                
                if (hasValidData) {
                    // 有効な保存データを適用
                    savedState.character = {
                        left: loadedState.character.left,
                        top: loadedState.character.top,
                        width: loadedState.character.width
                    };
                    console.log('✅ 有効な保存状態を読み込み完了:', savedState.character);
                } else {
                    console.warn('⚠️ 保存データの形式が無効（px単位またはデータ不正）:', loadedState.character);
                    savedState.character = null;
                }
            } else {
                console.warn('⚠️ 保存データが不完全:', loadedState.character);
                savedState.character = null;
            }
        } else {
            console.log('📝 localStorage未保存');
            savedState.character = null;
        }
        
        // 🔧 **重要**: character要素の準備ができるまで動的取得は行わない
        // setupCharacterInitialState()で適切なタイミングで動的取得を実行
        
    } catch (e) {
        console.error('❌ localStorage読み込みエラー:', e);
        savedState.character = null;
    }
}

function confirmEdit() {
    console.log('💾 編集内容保存開始（%ベース・詳細検証付き）');
    
    // 現在の%状態を保存
    if (character) {
        const currentState = {
            left: character.style.left,     // 例: "35%"
            top: character.style.top,       // 例: "75%"
            width: character.style.width    // 例: "25%"
        };
        
        // 🔧 **重要修正**: 保存データの詳細検証
        console.log('🔍 保存前データ検証:', {
            current_character_style: currentState,
            all_properties_valid: !!(currentState.left && currentState.top && currentState.width),
            contains_percent: !!(
                currentState.left && currentState.left.includes('%') &&
                currentState.top && currentState.top.includes('%') &&
                currentState.width && currentState.width.includes('%')
            )
        });
        
        if (currentState.left && currentState.top && currentState.width &&
            currentState.left.includes('%') && currentState.top.includes('%') && currentState.width.includes('%')) {
            
            savedState.character = currentState;
            console.log('✅ 有効なデータを保存対象に設定:', savedState.character);
        } else {
            console.error('❌ 保存データが無効です。動的取得を実行します。');
            savedState.character = getDynamicCharacterState(character);
            console.log('🔄 動的取得結果を保存:', savedState.character);
        }
    } else {
        console.error('❌ character要素がnullです');
        return;
    }
    
    // localStorage保存
    try {
        const saveData = JSON.stringify(savedState);
        localStorage.setItem('spine-positioning-state', saveData);
        
        // 保存直後の検証
        const verification = localStorage.getItem('spine-positioning-state');
        const verificationData = JSON.parse(verification);
        
        console.log('✅ 保存完了（%座標）・検証結果:', {
            saved_data: savedState,
            verification_data: verificationData,
            storage_success: !!(verification && verificationData.character),
            data_integrity: JSON.stringify(savedState) === verification
        });
        
        if (coordinateDisplay) {
            coordinateDisplay.textContent = '✅ 設定を保存しました（%座標・検証済み）';
            setTimeout(() => {
                coordinateDisplay.style.display = 'none';
            }, 2000);
        }
    } catch (e) {
        console.error('❌ 保存エラー:', e);
        if (coordinateDisplay) {
            coordinateDisplay.textContent = '❌ 保存に失敗しました';
        }
    }
    
    endEditMode();
}

function cancelEdit() {
    console.log('🔄 編集キャンセル - リロード実行');
    
    if (coordinateDisplay) {
        coordinateDisplay.textContent = '🔄 前回保存した状態に戻しています...';
    }
    
    setTimeout(() => {
        location.reload();
    }, 500);
}

function endEditMode() {
    console.log('🔄 編集モード終了');
    
    endCharacterEditMode();
    hideConfirmPanel();
    
    if (coordinateDisplay) {
        coordinateDisplay.style.display = 'none';
    }
}

function endCharacterEditMode() {
    isCharacterEditMode = false;
    
    if (character) {
        character.classList.remove('edit-mode');
        
        // ハンドル削除
        const handles = character.querySelectorAll('.handle');
        handles.forEach(handle => handle.remove());
    }
    
    updateUI();
    console.log('✅ キャラクター編集モード終了');
}

// 🗑️ Canvas編集モード終了関数削除：不要

// ========== シンプル・ハンドルシステム ========== //

function createHandles() {
    console.log('🔧 キャラクターハンドル作成開始');
    
    // 既存ハンドル削除
    const existingHandles = character.querySelectorAll('.handle');
    existingHandles.forEach(handle => handle.remove());
    
    // ハンドル定義（対角固定点拡縮システム）
    const handlePositions = [
        // 4隅の緑ハンドル（対角固定点拡縮）
        { pos: 'nw', title: '対角拡縮（右下を固定点として拡縮）', type: 'corner' },
        { pos: 'ne', title: '対角拡縮（左下を固定点として拡縮）', type: 'corner' },
        { pos: 'sw', title: '対角拡縮（右上を固定点として拡縮）', type: 'corner' },
        { pos: 'se', title: '対角拡縮（左上を固定点として拡縮）', type: 'corner' },
        // 辺の中央の青ハンドル（反対側固定点拡縮）
        { pos: 'n', title: '上辺：下辺を固定点として拡縮', type: 'edge' },
        { pos: 's', title: '下辺：上辺を固定点として拡縮', type: 'edge' },
        { pos: 'w', title: '左辺：右辺を固定点として拡縮', type: 'edge' },
        { pos: 'e', title: '右辺：左辺を固定点として拡縮', type: 'edge' },
        // 中央の橙ハンドル（中心拡縮）
        { pos: 'center', title: '中心拡縮（位置固定でサイズ変更）', type: 'center' }
    ];
    
    // ハンドル要素作成
    handlePositions.forEach(handleDef => {
        const handle = document.createElement('div');
        handle.className = `handle ${handleDef.pos}`;
        handle.title = handleDef.title;
        handle.dataset.position = handleDef.pos;
        
        // ハンドルスタイル
        handle.style.cssText = `
            position: absolute;
            width: 12px;
            height: 12px;
            border: 2px solid #333;
            border-radius: 50%;
            cursor: pointer;
            z-index: 100;
            transition: all 0.2s;
        `;
        
        // 位置設定とカラー設定
        switch (handleDef.pos) {
            // 🟢 4隅の緑ハンドル（対角固定点拡縮）
            case 'nw':
                handle.style.top = '-6px';
                handle.style.left = '-6px';
                handle.style.background = '#4caf50';
                break;
            case 'ne':
                handle.style.top = '-6px';
                handle.style.right = '-6px';
                handle.style.background = '#4caf50';
                break;
            case 'sw':
                handle.style.bottom = '-6px';
                handle.style.left = '-6px';
                handle.style.background = '#4caf50';
                break;
            case 'se':
                handle.style.bottom = '-6px';
                handle.style.right = '-6px';
                handle.style.background = '#4caf50';
                break;
            // 🔵 辺の中央の青ハンドル（反対側固定点拡縮）
            case 'n':
                handle.style.top = '-6px';
                handle.style.left = '50%';
                handle.style.transform = 'translateX(-50%)';
                handle.style.background = '#2196f3';
                break;
            case 's':
                handle.style.bottom = '-6px';
                handle.style.left = '50%';
                handle.style.transform = 'translateX(-50%)';
                handle.style.background = '#2196f3';
                break;
            case 'w':
                handle.style.left = '-6px';
                handle.style.top = '50%';
                handle.style.transform = 'translateY(-50%)';
                handle.style.background = '#2196f3';
                break;
            case 'e':
                handle.style.right = '-6px';
                handle.style.top = '50%';
                handle.style.transform = 'translateY(-50%)';
                handle.style.background = '#2196f3';
                break;
            // 🟠 中央の橙ハンドル（中心拡縮）
            case 'center':
                handle.style.top = '50%';
                handle.style.left = '50%';
                handle.style.transform = 'translate(-50%, -50%)';
                handle.style.background = '#ff9800';
                handle.style.width = '16px';
                handle.style.height = '16px';
                break;
        }
        
        // イベント（対角固定点拡縮システム・マウス・タッチ両対応）
        handle.addEventListener('mousedown', (e) => {
            console.log('🎯 ハンドルmousedown:', handleDef.pos, handleDef.type);
            e.stopPropagation();
            e.preventDefault();
            // character要素のイベントを無効化
            isDragging = false;
            isResizing = false;
            startFixedPointResize(e, handleDef.pos, handleDef.type);
        }, true); // キャプチャフェーズで実行
        
        // タッチイベント
        handle.addEventListener('touchstart', (e) => {
            console.log('📱 ハンドルtouchstart:', handleDef.pos, handleDef.type);
            e.stopPropagation();
            e.preventDefault();
            // character要素のイベントを無効化
            isDragging = false;
            isResizing = false;
            startFixedPointResizeTouch(e, handleDef.pos, handleDef.type);
        }, true); // キャプチャフェーズで実行
        
        character.appendChild(handle);
    });
    
    console.log('✅ キャラクターハンドル作成完了');
}

// 🗑️ Canvasハンドル作成削除：不要

function startFixedPointResizeTouch(e, position, type) {
    console.log('📱 対角固定点拡縮開始（タッチ・%ベース）:', { position, type });
    
    e.preventDefault();
    e.stopPropagation();
    
    // タッチ座標を取得（最初のタッチポイント）
    const touch = e.touches[0];
    
    // 確実に状態設定
    isDragging = false; // 移動モードを無効化
    isResizing = true;  // リサイズモードを有効化
    activeHandle = { dataset: { position, type } };
    startMousePos = { x: touch.clientX, y: touch.clientY };
    
    // 現在の%状態を記録（動的取得使用）
    const currentState = character.style.left ? 
        { left: character.style.left, top: character.style.top, width: character.style.width } :
        getDynamicCharacterState(character);
    
    const currentLeftPercent = parseFloat(currentState.left);
    const currentTopPercent = parseFloat(currentState.top);
    const currentWidthPercent = parseFloat(currentState.width);
    
    startElementState = {
        leftPercent: currentLeftPercent,
        topPercent: currentTopPercent,
        widthPercent: currentWidthPercent,
        // 固定点%座標（対角固定点計算用）
        leftEdgePercent: currentLeftPercent - currentWidthPercent / 2,
        rightEdgePercent: currentLeftPercent + currentWidthPercent / 2,
        topEdgePercent: currentTopPercent - currentWidthPercent / 2,     // 1:1正方形比率
        bottomEdgePercent: currentTopPercent + currentWidthPercent / 2
    };
    
    character.classList.add('resize-mode');
    console.log('✅ タッチ対角固定点拡縮準備完了（%座標）:', startElementState);
}

function startFixedPointResize(e, position, type) {
    console.log('🎯 対角固定点拡縮開始（%ベース）:', { position, type });
    
    e.preventDefault();
    e.stopPropagation();
    
    // 確実に状態設定
    isDragging = false; // 移動モードを無効化
    isResizing = true;  // リサイズモードを有効化
    activeHandle = { dataset: { position, type } };
    startMousePos = { x: e.clientX, y: e.clientY };
    
    // 現在の%状態を記録（動的取得使用）
    const currentState = character.style.left ? 
        { left: character.style.left, top: character.style.top, width: character.style.width } :
        getDynamicCharacterState(character);
    
    const currentLeftPercent = parseFloat(currentState.left);
    const currentTopPercent = parseFloat(currentState.top);
    const currentWidthPercent = parseFloat(currentState.width);
    
    startElementState = {
        leftPercent: currentLeftPercent,
        topPercent: currentTopPercent,
        widthPercent: currentWidthPercent,
        // 固定点%座標（対角固定点計算用）
        leftEdgePercent: currentLeftPercent - currentWidthPercent / 2,
        rightEdgePercent: currentLeftPercent + currentWidthPercent / 2,
        topEdgePercent: currentTopPercent - currentWidthPercent / 2,     // 1:1正方形比率
        bottomEdgePercent: currentTopPercent + currentWidthPercent / 2
    };
    
    character.classList.add('resize-mode');
    console.log('✅ 対角固定点拡縮準備完了（%座標）:', startElementState);
}

// 🗑️ Canvas拡縮削除：不要

function performResize(deltaX, deltaY) {
    if (!activeHandle) return;
    
    const position = activeHandle.dataset.position;
    const type = activeHandle.dataset.type || 'character';
    
    console.log('🔧 リサイズ実行:', { position, type, deltaX, deltaY });
    
    // Canvas編集削除：キャラクター編集のみ対応
    if (type === 'character' || type === 'corner' || type === 'edge' || type === 'center') {
        performCharacterResize(deltaX, deltaY, position);
    }
}

function performCharacterResize(deltaX, deltaY, position) {
    const type = activeHandle.dataset.type;
    let newLeftPercent = startElementState.leftPercent;
    let newTopPercent = startElementState.topPercent;
    let newWidthPercent = startElementState.widthPercent;
    
    // マウス移動量を%スケールに変換（感度調整）
    const parentRect = character.parentElement.getBoundingClientRect();
    const scaleFactorX = (deltaX / parentRect.width) * 100;
    const scaleFactorY = (deltaY / parentRect.height) * 100;
    const combinedScaleFactor = (scaleFactorX + scaleFactorY) / 2; // 平均値
    
    // %ベースでのサイズ変更
    const sizeChange = combinedScaleFactor * 0.5; // 感度調整
    newWidthPercent = Math.max(5, Math.min(50, startElementState.widthPercent + sizeChange));
    
    console.log('📊 %ベーススケール計算:', {
        deltaX, deltaY, scaleFactorX, scaleFactorY, combinedScaleFactor,
        sizeChange, newWidthPercent, type, position
    });
    
    if (type === 'center') {
        // 🟠 中心拡縮：位置固定でサイズのみ変更
        // newLeftPercent, newTopPercentはそのまま（位置維持）
        
    } else if (type === 'corner') {
        // 🟢 角ハンドル：対角の角を固定点として拡縮
        const halfSizeChange = (newWidthPercent - startElementState.widthPercent) / 2;
        
        switch (position) {
            case 'nw': // 左上 → 右下を固定点として拡縮
                newLeftPercent = startElementState.rightEdgePercent - newWidthPercent / 2;
                newTopPercent = startElementState.bottomEdgePercent - newWidthPercent / 2;
                break;
            case 'ne': // 右上 → 左下を固定点として拡縮
                newLeftPercent = startElementState.leftEdgePercent + newWidthPercent / 2;
                newTopPercent = startElementState.bottomEdgePercent - newWidthPercent / 2;
                break;
            case 'sw': // 左下 → 右上を固定点として拡縮
                newLeftPercent = startElementState.rightEdgePercent - newWidthPercent / 2;
                newTopPercent = startElementState.topEdgePercent + newWidthPercent / 2;
                break;
            case 'se': // 右下 → 左上を固定点として拡縮
                newLeftPercent = startElementState.leftEdgePercent + newWidthPercent / 2;
                newTopPercent = startElementState.topEdgePercent + newWidthPercent / 2;
                break;
        }
        
    } else if (type === 'edge') {
        // 🔵 辺ハンドル：反対側の辺を固定点として拡縮
        switch (position) {
            case 'n': // 上辺 → 下辺を固定として拡縮
                newTopPercent = startElementState.bottomEdgePercent - newWidthPercent / 2;
                break;
            case 's': // 下辺 → 上辺を固定として拡縮
                newTopPercent = startElementState.topEdgePercent + newWidthPercent / 2;
                break;
            case 'w': // 左辺 → 右辺を固定として拡縮
                newLeftPercent = startElementState.rightEdgePercent - newWidthPercent / 2;
                break;
            case 'e': // 右辺 → 左辺を固定として拡縮
                newLeftPercent = startElementState.leftEdgePercent + newWidthPercent / 2;
                break;
        }
    }
    
    // 🔧 修正: 縦横比維持で%座標スタイル適用
    const newHeightPercent = newWidthPercent / (1/1); // 1:1アスペクト比維持（正方形）
    character.style.left = newLeftPercent + '%';
    character.style.top = newTopPercent + '%';
    character.style.width = newWidthPercent + '%';
    character.style.height = newHeightPercent + '%'; // 縦横比維持
    
    console.log('🎨 縦横比維持%ベースCSS適用:', {
        left: newLeftPercent.toFixed(1) + '%',
        top: newTopPercent.toFixed(1) + '%',
        width: newWidthPercent.toFixed(1) + '%',
        height: newHeightPercent.toFixed(1) + '%',
        aspect_ratio: '1:1 (正方形)',
        calculated_ratio: (newWidthPercent / newHeightPercent).toFixed(2)
    });
    
    updateCoordinateDisplay();
}

// 🗑️ Canvas拡縮削除：不要

// ========== 🔍 デバッグ・診断システム（大幅強化版） ========== //





// ========== 🔍 デバッグ・診断システム（大幅強化版） ========== //

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
    console.log('  loadSavedState:', typeof loadSavedState);
    console.log('  setupCharacterInitialState:', typeof setupCharacterInitialState);
    console.log('  initializeDOMElements:', typeof initializeDOMElements);
    
    // savedState変数の状態
    console.log('Step 2 - savedState変数:', savedState);
    
    // DOMContentLoaded イベントの確認
    console.log('Step 3 - DOM状態:');
    console.log('  readyState:', document.readyState);
    console.log('  body exists:', !!document.body);
    
    // 復元処理のタイミング問題チェック
    console.log('Step 4 - タイミング分析:');
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
    console.log('💾 savedState変数状態:', savedState);
    
    // 4. 動的取得テスト
    if (character) {
        const dynamicResult = getDynamicCharacterState(character);
        console.log('🔄 動的取得テスト結果:', dynamicResult);
    }
}

// localStorage完全クリア（デバッグ用）
function clearAllPositionData() {
    localStorage.removeItem('spine-positioning-state');
    console.log('🗑️ localStorage位置データを完全削除しました');
    console.log('🔄 リロードして動作確認してください');
}

// 🚨 HTML設定制御システム無効化（localStorage復元時のみ）
function disableHTMLConfigSystem() {
    console.log('🔧 HTML設定制御システム無効化開始');
    
    const config = document.querySelector('#purattokun-config');
    if (config) {
        // data属性を一時的に退避・削除
        const originalData = {
            x: config.getAttribute('data-x'),
            y: config.getAttribute('data-y'),
            scale: config.getAttribute('data-scale')
        };
        
        // data属性を削除してHTML設定制御システムを無効化
        config.removeAttribute('data-x');
        config.removeAttribute('data-y');
        config.removeAttribute('data-scale');
        
        // 無効化情報をマーク
        config.setAttribute('data-disabled-for-restore', 'true');
        config.setAttribute('data-original-x', originalData.x || '18');
        config.setAttribute('data-original-y', originalData.y || '49');
        config.setAttribute('data-original-scale', originalData.scale || '0.55');
        
        console.log('✅ HTML設定制御システム無効化完了:', originalData);
        return true;
    } else {
        console.warn('⚠️ #purattokun-config 要素が見つかりません');
        return false;
    }
}

// 🔄 HTML設定制御システム復活（必要に応じて）
function restoreHTMLConfigSystem() {
    console.log('🔄 HTML設定制御システム復活開始');
    
    const config = document.querySelector('#purattokun-config');
    if (config && config.getAttribute('data-disabled-for-restore') === 'true') {
        // 退避されたdata属性を復活
        const originalX = config.getAttribute('data-original-x');
        const originalY = config.getAttribute('data-original-y');
        const originalScale = config.getAttribute('data-original-scale');
        
        if (originalX) config.setAttribute('data-x', originalX);
        if (originalY) config.setAttribute('data-y', originalY);
        if (originalScale) config.setAttribute('data-scale', originalScale);
        
        // 無効化マークを削除
        config.removeAttribute('data-disabled-for-restore');
        config.removeAttribute('data-original-x');
        config.removeAttribute('data-original-y');
        config.removeAttribute('data-original-scale');
        
        console.log('✅ HTML設定制御システム復活完了');
        return true;
    } else {
        console.log('💡 HTML設定制御システムは既に有効です');
        return false;
    }
}

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
    disableHTMLConfigSystem();
    
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
        const forceHeight = forceWidth / (3/2); // 縦横比維持
        
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

// 強制的に保存状態を復元（デバッグ用・従来版も保持）
function forceRestoreState() {
    if (!character) {
        console.error('❌ character要素がnullです');
        return;
    }
    
    const savedData = localStorage.getItem('spine-positioning-state');
    if (savedData) {
        const loadedState = JSON.parse(savedData);
        if (loadedState.character) {
            const forceWidth = parseFloat(loadedState.character.width);
            const forceHeight = forceWidth / (3/2); // 縦横比維持
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

// 🆕 グローバル関数として公開（デバッグ用・大幅強化版）
window.resetConfirmPanelPosition = resetConfirmPanelPosition;
window.debugConfirmPanelPosition = debugConfirmPanelPosition;
window.showConfirmPanel = showConfirmPanel;

// === 🚨 緊急デバッグ関数（リロード後位置保存失敗対応・HTML設定制御システム競合対策版） ===
window.emergencyDiagnostic = emergencyDiagnostic;                      // 🚨 完全診断
window.multiRestoreSystem = multiRestoreSystem;                        // 🔄 多重復元システム（競合対策版）
window.diagnosisLocalStorage = diagnosisLocalStorage;                  // 📦 localStorage診断
window.diagnosisDOMElements = diagnosisDOMElements;                     // 🎯 DOM要素診断
window.diagnosisRestoreProcess = diagnosisRestoreProcess;              // 🔄 復元処理診断
window.diagnosisCSSConflicts = diagnosisCSSConflicts;                 // 🎨 CSS競合診断
window.disableHTMLConfigSystem = disableHTMLConfigSystem;              // 🚨 HTML設定制御システム無効化
window.restoreHTMLConfigSystem = restoreHTMLConfigSystem;              // 🔄 HTML設定制御システム復活
window.startContinuousRestoreMonitoring = startContinuousRestoreMonitoring; // 👁️ 継続監視開始
window.stopContinuousRestoreMonitoring = stopContinuousRestoreMonitoring;   // 🛑 継続監視停止

// === 従来のデバッグ関数（互換性保持） ===
window.debugPositioningSystem = debugPositioningSystem;
window.clearAllPositionData = clearAllPositionData;
window.forceRestoreState = forceRestoreState;

// 🔍 ハンドル表示診断機能
function debugHandleVisibility() {
    console.log('🔍 === ハンドル表示診断開始 ===');
    
    // Step 1: character要素の確認
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
        isCharacterEditMode,
        isDragging,
        isResizing
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
        disableHTMLConfigSystem();
        
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

// グローバル関数として追加
window.ultimatePositionFix = ultimatePositionFix;
window.debugHandleVisibility = debugHandleVisibility;

console.log('🚨 Spine編集システム v2.3 読み込み完了 - HTML設定制御システム競合対策版');
console.log('🔧 新機能: HTML設定制御システム競合対策・継続監視システム・総合修正コマンド');
console.log('💡 緊急コマンド: ultimatePositionFix() - 一括診断・修正を実行');
console.log('💡 個別デバッグ: emergencyDiagnostic(), multiRestoreSystem(), disableHTMLConfigSystem()');
console.log('📝 詳細: localStorage復元時に自動的にHTML設定制御システムを無効化し、継続監視を開始します');