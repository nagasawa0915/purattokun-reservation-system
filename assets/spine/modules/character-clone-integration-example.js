// 🔗 Character Clone Integration Example
// SpinePositioningV2システムへの統合例
// 作成日: 2025-01-31

// このファイルは統合例のサンプルコードです
// 実際の統合時には必要な部分のみを適用してください

console.log('🔗 Character Clone Integration Example 読み込み');

// ========== 🎨 UI統合サンプル ========== //

/**
 * v2.0システムのキャラクターパネルに複製ボタンを追加
 */
function addCloneButtonToV2Panel() {
    // v2.0システムの準備待ち
    if (!window.SpinePositioningV2 || !window.SpinePositioningV2.initialized) {
        console.log('⏳ v2.0システム待機中...');
        setTimeout(addCloneButtonToV2Panel, 1000);
        return;
    }
    
    // 複製マネージャーの準備待ち
    if (!window.characterCloneManager) {
        console.log('⏳ 複製マネージャー待機中...');
        setTimeout(addCloneButtonToV2Panel, 1000);
        return;
    }
    
    // 既存のキャラクター選択パネルを探す
    const characterPanel = document.querySelector('[data-v2-panel="character-select"]') ||
                          document.getElementById('character-controls') ||
                          document.querySelector('.character-controls');
    
    if (!characterPanel) {
        console.log('❌ キャラクターパネルが見つかりません');
        return;
    }
    
    // 複製ボタンが既に存在する場合はスキップ
    if (document.getElementById('clone-character-btn')) {
        console.log('⚠️ 複製ボタンは既に存在します');
        return;
    }
    
    // 複製ボタン作成
    const cloneButton = document.createElement('button');
    cloneButton.id = 'clone-character-btn';
    cloneButton.innerHTML = '🔄 複製';
    cloneButton.style.cssText = `
        background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        margin: 4px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;
    
    // ホバー効果
    cloneButton.addEventListener('mouseenter', () => {
        cloneButton.style.transform = 'scale(1.05)';
        cloneButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    });
    
    cloneButton.addEventListener('mouseleave', () => {
        cloneButton.style.transform = 'scale(1)';
        cloneButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });
    
    // クリックイベント
    cloneButton.addEventListener('click', () => {
        const activeChar = SpinePositioningV2.characters[SpinePositioningV2.activeIndex];
        if (!activeChar) {
            alert('アクティブキャラクターが選択されていません');
            return;
        }
        
        // 複製実行
        const cloneData = window.characterCloneManager.cloneActiveCharacter(60, 60);
        if (cloneData) {
            // 成功メッセージ
            showCloneSuccess(cloneData.cloneId);
            
            // v2.0システムのUI更新が必要な場合
            if (typeof updateCharacterList === 'function') {
                updateCharacterList();
            }
        } else {
            alert('複製に失敗しました');
        }
    });
    
    // パネルに追加
    characterPanel.appendChild(cloneButton);
    console.log('✅ 複製ボタンをv2.0パネルに追加完了');
}

/**
 * 複製成功時の視覚的フィードバック
 */
function showCloneSuccess(cloneId) {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: cloneNotification 3s ease-out forwards;
    `;
    
    message.innerHTML = `✅ キャラクター複製完了<br><small>${cloneId}</small>`;
    
    // アニメーション定義
    if (!document.getElementById('clone-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'clone-notification-styles';
        style.textContent = `
            @keyframes cloneNotification {
                0% { opacity: 0; transform: translateX(100%); }
                10% { opacity: 1; transform: translateX(0); }
                90% { opacity: 1; transform: translateX(0); }
                100% { opacity: 0; transform: translateX(100%); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(message);
    
    // 3秒後に自動削除
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 3000);
}

// ========== 🔄 複製キャラクター管理UI ========== //

/**
 * 複製キャラクター一覧パネル作成
 */
function createCloneManagementPanel() {
    if (document.getElementById('clone-management-panel')) {
        return; // 既に存在する場合はスキップ
    }
    
    const panel = document.createElement('div');
    panel.id = 'clone-management-panel';
    panel.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        width: 250px;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        display: none;
        max-height: 300px;
        overflow-y: auto;
    `;
    
    // ヘッダー
    const header = document.createElement('div');
    header.innerHTML = `
        <h4 style="margin: 0 0 8px 0; color: #333; font-size: 14px;">🔄 複製管理</h4>
        <button id="close-clone-panel" style="float: right; margin-top: -20px; background: none; border: none; font-size: 16px; cursor: pointer;">×</button>
    `;
    panel.appendChild(header);
    
    // 複製リスト
    const list = document.createElement('div');
    list.id = 'clone-list';
    panel.appendChild(list);
    
    // 全削除ボタン
    const deleteAllBtn = document.createElement('button');
    deleteAllBtn.innerHTML = '🗑️ 全削除';
    deleteAllBtn.style.cssText = `
        width: 100%;
        background: #ff4444;
        color: white;
        border: none;
        padding: 6px;
        border-radius: 4px;
        margin-top: 8px;
        cursor: pointer;
    `;
    deleteAllBtn.onclick = () => {
        if (confirm('全ての複製を削除しますか？')) {
            const count = window.characterCloneManager.deleteAllClones();
            alert(`${count}個の複製を削除しました`);
            updateCloneList();
        }
    };
    panel.appendChild(deleteAllBtn);
    
    // 閉じるボタン
    document.addEventListener('click', (e) => {
        if (e.target.id === 'close-clone-panel') {
            panel.style.display = 'none';
        }
    });
    
    document.body.appendChild(panel);
    return panel;
}

/**
 * 複製リストの更新
 */
function updateCloneList() {
    const listElement = document.getElementById('clone-list');
    if (!listElement) return;
    
    const clones = window.characterCloneManager.getCloneList();
    
    if (clones.length === 0) {
        listElement.innerHTML = '<p style="color: #666; font-size: 12px; text-align: center;">複製はありません</p>';
        return;
    }
    
    listElement.innerHTML = clones.map(clone => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid #eee;">
            <span style="font-size: 12px; color: #333;">${clone.name}</span>
            <button onclick="deleteClone('${clone.cloneId}')" style="background: #ff6b6b; color: white; border: none; padding: 2px 6px; border-radius: 3px; font-size: 10px; cursor: pointer;">削除</button>
        </div>
    `).join('');
}

/**
 * 個別複製削除
 */
window.deleteClone = function(cloneId) {
    if (window.characterCloneManager.deleteClone(cloneId)) {
        updateCloneList();
        showCloneSuccess('削除完了: ' + cloneId);
    }
};

/**
 * 複製管理パネルの表示切り替え
 */
function toggleCloneManagementPanel() {
    let panel = document.getElementById('clone-management-panel');
    if (!panel) {
        panel = createCloneManagementPanel();
    }
    
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        updateCloneList();
    } else {
        panel.style.display = 'none';
    }
}

// ========== 🚀 自動統合システム ========== //

/**
 * ページ読み込み後の自動統合
 */
function autoIntegration() {
    // DOM準備待ち
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoIntegration);
        return;
    }
    
    // 統合実行（遅延）
    setTimeout(() => {
        addCloneButtonToV2Panel();
        
        // 管理パネル表示ボタンも追加（オプション）
        const controlPanel = document.querySelector('[data-v2-panel="character-select"]');
        if (controlPanel && !document.getElementById('show-clone-management')) {
            const managementBtn = document.createElement('button');
            managementBtn.id = 'show-clone-management';
            managementBtn.innerHTML = '📋 複製管理';
            managementBtn.style.cssText = `
                background: #4CAF50;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
                margin: 2px;
            `;
            managementBtn.onclick = toggleCloneManagementPanel;
            controlPanel.appendChild(managementBtn);
        }
        
    }, 2000); // v2.0システム初期化待ち
}

// ========== 🔗 統合実行 ========== //

// 自動統合開始
autoIntegration();

// グローバル関数として公開
window.addCloneButtonToV2Panel = addCloneButtonToV2Panel;
window.toggleCloneManagementPanel = toggleCloneManagementPanel;

console.log('✅ Character Clone Integration Example 読み込み完了');

// ========== 📚 使用例コメント ========== //
/*
統合後の使用方法:

1. 自動統合（推奨）:
   - このファイルを読み込むだけで自動的にUI統合
   - v2.0システムに複製ボタンが自動追加

2. 手動統合:
   addCloneButtonToV2Panel(); // 複製ボタン追加
   toggleCloneManagementPanel(); // 管理パネル表示

3. 複製操作:
   - UI: 複製ボタンクリック
   - コード: window.characterCloneManager.cloneActiveCharacter()

4. 複製管理:
   - UI: 複製管理ボタンクリック
   - コード: window.characterCloneManager.getCloneList()

5. デバッグ:
   window.debugCloneManager(); // 詳細状態確認
*/