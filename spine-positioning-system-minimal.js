// 🎯 Spine編集システム v3.0 - 最小限実装版
// 完全リセット・シンプル設計・確実動作

console.log('🚀 Spine編集システム v3.0 (最小限実装版) 読み込み開始');

// ========== グローバル変数 ========== //
let isEditMode = false;
let isDragging = false;
let character = null; // メインキャラクター（後方互換性のため）
let startMousePos = { x: 0, y: 0 };
let startElementPos = { left: 0, top: 0 };
let currentScale = 1.0; // Spineスケール値を保持

// 複数キャラクター管理
let characters = []; // 全キャラクター配列
let activeCharacterIndex = 0; // 現在選択中のキャラクター

// ========== 初期化 ========== //
function initializeMinimalEditSystem() {
    console.log('🔧 最小限編集システム初期化開始');
    
    // キャラクター要素を取得
    character = document.querySelector('#purattokun-canvas');
    if (!character) {
        console.error('❌ キャラクター要素が見つかりません');
        // フォールバック: 他のキャラクター要素も検索
        character = document.querySelector('#purattokun-fallback') || 
                   document.querySelector('canvas[data-spine-character]');
        
        if (character) {
            console.log('✅ フォールバック要素を発見:', character.tagName + (character.id ? '#' + character.id : ''));
        } else {
            console.error('❌ すべてのキャラクター要素が見つかりません');
            return;
        }
    } else {
        console.log('✅ キャラクター要素取得成功:', character.tagName + (character.id ? '#' + character.id : ''));
    }
    
    // CSSサイズ設定を削除（Spine側でサイズ制御）
    character.style.width = '';
    character.style.height = '';
    character.style.aspectRatio = '';
    
    // 編集ボタンの作成
    createEditButton();
    
    console.log('✅ 最小限編集システム初期化完了');
}

// ========== UI作成 ========== //
function createEditButton() {
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
    
    button.addEventListener('click', toggleEditMode);
    document.body.appendChild(button);
    
    // スケール調整パネル
    createScalePanel();
}

// スケール調整パネル
function createScalePanel() {
    const panel = document.createElement('div');
    panel.id = 'scale-adjust-panel';
    panel.style.cssText = `
        position: fixed;
        top: 60px;
        right: 10px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        z-index: 10000;
        display: none;
        font-size: 14px;
    `;
    
    panel.innerHTML = `
        <div style="margin-bottom: 8px;">
            <label style="display: block; margin-bottom: 4px;">スケール:</label>
            <div style="display: flex; align-items: center; gap: 8px;">
                <input type="range" id="scale-slider" min="0.1" max="3" step="0.05" value="${currentScale}" style="width: 100px;">
                <input type="number" id="scale-input" min="0.1" max="3" step="0.05" value="${currentScale.toFixed(2)}" style="width: 60px; padding: 2px 4px; font-size: 12px;">
            </div>
        </div>
        <div style="text-align: center; margin-top: 8px;">
            <button id="scale-reset-btn" style="padding: 4px 12px; font-size: 12px;">リセット (1.0)</button>
            <button id="scale-test-btn" style="padding: 4px 12px; font-size: 12px; margin-left: 4px;">テスト</button>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // スライダー・入力要素イベント
    const slider = document.getElementById('scale-slider');
    const numberInput = document.getElementById('scale-input');
    const resetBtn = document.getElementById('scale-reset-btn');
    const testBtn = document.getElementById('scale-test-btn');
    
    // スケール更新共通関数
    function updateScale(newScale) {
        currentScale = newScale;
        slider.value = newScale;
        numberInput.value = newScale.toFixed(2);
        
        // 直接CSSでスケール調整
        if (character) {
            // transformの既存値を保持しつつscaleを更新
            const baseTransform = 'translate(-50%, -50%)';
            character.style.transform = `${baseTransform} scale(${newScale})`;
            console.log('🔧 スケール更新:', {
                element: character.tagName + (character.id ? '#' + character.id : ''),
                newScale: newScale,
                appliedTransform: character.style.transform,
                characterExists: !!character,
                elementRect: character.getBoundingClientRect()
            });
        } else {
            console.error('❌ character要素がnullです - スケール更新失敗');
        }
    }
    
    // スライダーイベント
    slider.addEventListener('input', (e) => {
        const newScale = parseFloat(e.target.value);
        updateScale(newScale);
    });
    
    // 数値入力イベント
    numberInput.addEventListener('input', (e) => {
        const newScale = parseFloat(e.target.value);
        if (newScale >= 0.1 && newScale <= 3) {
            updateScale(newScale);
        }
    });
    
    // リセットボタン
    resetBtn.addEventListener('click', () => {
        updateScale(1.0);
        console.log('🔄 スケールリセット: 1.0');
    });
    
    // テストボタン（診断機能）
    testBtn.addEventListener('click', () => {
        console.log('🧪 === スケールテスト開始 ===');
        
        if (!character) {
            console.error('❌ character要素がnull');
            alert('キャラクター要素が見つかりません');
            return;
        }
        
        const computedStyle = window.getComputedStyle(character);
        const rect = character.getBoundingClientRect();
        
        console.log('📊 現在の状態:', {
            element: character.tagName + (character.id ? '#' + character.id : ''),
            inlineTransform: character.style.transform,
            computedTransform: computedStyle.transform,
            boundingRect: { width: rect.width, height: rect.height },
            currentScale: currentScale
        });
        
        // 2倍スケールテスト
        const originalScale = currentScale;
        updateScale(2.0);
        
        setTimeout(() => {
            const newRect = character.getBoundingClientRect();
            console.log('📏 2倍スケール後:', { width: newRect.width, height: newRect.height });
            alert(`スケールテスト完了\n元サイズ: ${rect.width}x${rect.height}\n2倍後: ${newRect.width}x${newRect.height}`);
            
            // 元に戻す
            updateScale(originalScale);
        }, 2000);
    });
}

// ========== 編集モード切り替え ========== //
function toggleEditMode() {
    isEditMode = !isEditMode;
    const button = document.getElementById('minimal-edit-button');
    const scalePanel = document.getElementById('scale-adjust-panel');
    
    if (isEditMode) {
        console.log('📝 編集モード開始');
        button.textContent = '編集終了';
        button.style.background = '#4CAF50';
        
        // キャラクターを編集可能にする
        character.style.cursor = 'move';
        character.addEventListener('mousedown', startDrag);
        
        // スケールパネル表示
        if (scalePanel) {
            scalePanel.style.display = 'block';
        }
    } else {
        console.log('✅ 編集モード終了');
        button.textContent = '位置編集';
        button.style.background = '#ff6b6b';
        
        // 編集機能を無効化
        character.style.cursor = 'default';
        character.removeEventListener('mousedown', startDrag);
        
        // スケールパネル非表示
        if (scalePanel) {
            scalePanel.style.display = 'none';
        }
        
        // 現在位置を保存
        savePosition();
    }
}

// ========== ドラッグ処理 ========== //
function startDrag(e) {
    if (!isEditMode) return;
    
    e.preventDefault();
    isDragging = true;
    
    // 開始位置を記録
    startMousePos = { x: e.clientX, y: e.clientY };
    
    // 要素の現在位置を取得（親要素基準の%に変換）
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
    
    // グローバルイベントを設定
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', endDrag);
    
    console.log('🎯 ドラッグ開始 (親要素基準%):', startElementPos);
}

function handleDrag(e) {
    if (!isDragging) return;
    
    // マウスの移動量を計算
    const deltaX = e.clientX - startMousePos.x;
    const deltaY = e.clientY - startMousePos.y;
    
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
    // スケール値を保持したtransformを適用
    character.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
}

function endDrag() {
    if (!isDragging) return;
    
    isDragging = false;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', endDrag);
    
    console.log('✅ ドラッグ終了');
}

// ========== 位置保存・復元 ========== //
function savePosition() {
    // 現在の位置を取得（単位も含めて保存）
    const currentLeft = character.style.left;
    const currentTop = character.style.top;
    
    // Spineのスケール値を取得
    if (window.getCurrentPosition && typeof window.getCurrentPosition === 'function') {
        const spineSettings = window.getCurrentPosition();
        if (spineSettings && spineSettings.scale !== undefined) {
            currentScale = spineSettings.scale;
        }
    }
    
    // %単位での位置とスケールを保存
    const position = {
        left: currentLeft,
        top: currentTop,
        scale: currentScale,  // Spineスケールを保存
        unit: '%'  // 単位情報を追加
    };
    
    // 既存システムと同じ形式で保存
    const saveData = {
        character: position
    };
    
    localStorage.setItem('spine-positioning-state', JSON.stringify(saveData));
    console.log('💾 位置を保存（既存形式）:', saveData);
    
    // 互換性のため両方のキーで保存
    localStorage.setItem('spine-minimal-position', JSON.stringify(position));
}

function restorePosition() {
    // まず既存システムのデータを確認
    let saved = localStorage.getItem('spine-positioning-state');
    let position = null;
    
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.character) {
                position = data.character;
                console.log('📍 既存形式のデータを検出:', position);
            }
        } catch (e) {
            console.error('❌ 既存形式の解析エラー:', e);
        }
    }
    
    // 既存形式がなければ新形式を確認
    if (!position) {
        saved = localStorage.getItem('spine-minimal-position');
        if (saved) {
            try {
                position = JSON.parse(saved);
                console.log('📍 新形式のデータを検出:', position);
            } catch (e) {
                console.error('❌ 新形式の解析エラー:', e);
            }
        }
    }
    
    // 位置を復元
    if (position && position.left && position.top) {
        character.style.position = 'absolute';
        
        // 単位を確認して適切に復元
        if (position.left && position.top) {
            // 基本的にそのまま適用（%単位を維持）
            character.style.left = position.left;
            character.style.top = position.top;
        }
        
        // Spineスケールを復元
        if (position.scale !== undefined) {
            currentScale = position.scale;
            console.log('🔄 保存されたスケール値を復元:', currentScale);
        }
        
        // スケール値を反映したtransformを適用
        character.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
        
        // スケールパネルのUI要素も同期
        const slider = document.getElementById('scale-slider');
        const numberInput = document.getElementById('scale-input');
        if (slider && numberInput) {
            slider.value = currentScale;
            numberInput.value = currentScale.toFixed(2);
            console.log('🎛️ スケールパネルUIを同期:', currentScale);
        }
        
        // 外部APIとの連携（存在する場合）
        if (position.scale !== undefined && window.adjustCanvasUnified) {
            window.adjustCanvasUnified(undefined, undefined, position.scale);
        }
        
        console.log('✅ 位置とスケールを復元:', position);
    }
}

// ========== 初期化実行 ========== //
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOMContentLoaded: 最速位置復元システム開始');
    
    // 即座に編集システム初期化（遅延なし）
    initializeMinimalEditSystem();
    
    // 最速でSpine初期化完了を監視
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
            restorePosition();
            console.log('⚡ 最速：Spine初期化完了を検出、即座に位置復元を実行');
        } else {
            // 50ms間隔で高速監視（100ms→50msに短縮）
            setTimeout(waitForSpineInit, 50);
        }
    };
    
    // 初期化監視を即座に開始
    waitForSpineInit();
    
    // フォールバック：2秒後に必ず実行（3秒→2秒に短縮）
    setTimeout(() => {
        if (!positionRestored) {
            positionRestored = true;
            restorePosition();
            console.log('🔄 フォールバック：位置復元を実行');
        }
    }, 2000);
});

// デバッグ用グローバル関数
window.clearMinimalPosition = function() {
    localStorage.removeItem('spine-positioning-state');
    localStorage.removeItem('spine-minimal-position');
    console.log('🗑️ 保存データをクリアしました');
};

// スケール診断関数
window.debugScale = function() {
    console.log('🔍 === スケール診断開始 ===');
    
    if (!character) {
        console.error('❌ character要素がnull');
        return;
    }
    
    const computedStyle = window.getComputedStyle(character);
    const rect = character.getBoundingClientRect();
    
    console.log('📊 キャラクター要素状態:', {
        element: character.tagName + (character.id ? '#' + character.id : ''),
        inlineTransform: character.style.transform,
        computedTransform: computedStyle.transform,
        inlineWidth: character.style.width,
        computedWidth: computedStyle.width,
        boundingRect: {
            width: rect.width,
            height: rect.height
        },
        currentScale: currentScale
    });
    
    // テストスケール適用
    const testScale = 2.0;
    character.style.transform = `translate(-50%, -50%) scale(${testScale})`;
    console.log('🧪 テストスケール適用:', testScale);
    
    setTimeout(() => {
        const newRect = character.getBoundingClientRect();
        console.log('📏 スケール後のサイズ:', {
            width: newRect.width,
            height: newRect.height,
            transform: character.style.transform
        });
        
        // 元に戻す
        character.style.transform = `translate(-50%, -50%) scale(1.0)`;
    }, 1000);
};

console.log('✅ Spine編集システム v3.0 (最小限実装版) 読み込み完了');