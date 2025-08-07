// 🚨 緊急修復スクリプト - 編集システム機能復旧
// モジュール競合・依存関係問題の解決

console.log('🚨 緊急修復システム開始');

// 1. グローバル変数の衝突解決
window.boundingBoxModule = null;
window.editMenuActive = false;
window.characterManagers = {};

// 2. 重複登録モジュールのクリーンアップ
function cleanupModules() {
    if (window.SpineEditSystem && window.SpineEditSystem.modules) {
        console.log('🧹 モジュールクリーンアップ開始');
        
        // boundingBoxモジュール重複問題解決
        if (window.SpineEditSystem.modules.has('boundingBox')) {
            const existingModule = window.SpineEditSystem.modules.get('boundingBox');
            if (existingModule && typeof existingModule.cleanup === 'function') {
                existingModule.cleanup();
            }
            window.SpineEditSystem.modules.delete('boundingBox');
            console.log('✅ boundingBoxモジュール重複解決');
        }
        
        // 他のモジュールもクリーンアップ
        ['ui', 'layerEditor', 'stateManager'].forEach(moduleName => {
            if (window.SpineEditSystem.modules.has(moduleName)) {
                const module = window.SpineEditSystem.modules.get(moduleName);
                if (module && typeof module.cleanup === 'function') {
                    module.cleanup();
                }
                window.SpineEditSystem.modules.delete(moduleName);
            }
        });
    }
}

// 3. 編集開始機能の緊急修復
function emergencyEditStart() {
    console.log('🚑 編集開始緊急修復');
    
    // MultiCharacterManagerの強制初期化
    if (window.MultiCharacterManager) {
        try {
            window.MultiCharacterManager.initialize();
            console.log('✅ MultiCharacterManager初期化成功');
        } catch (error) {
            console.error('❌ MultiCharacterManager初期化失敗:', error);
        }
    }
    
    // 編集メニュー強制表示
    const editButton = document.querySelector('.edit-btn');
    if (editButton) {
        editButton.style.display = 'block';
        editButton.disabled = false;
        console.log('✅ 編集ボタン復活');
    }
    
    // 編集パネル直接生成
    createEmergencyEditPanel();
}

// 4. 緊急編集パネル作成
function createEmergencyEditPanel() {
    // 既存パネル削除
    const existingPanel = document.getElementById('emergency-edit-panel');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    const panel = document.createElement('div');
    panel.id = 'emergency-edit-panel';
    panel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 2px solid #007bff;
        border-radius: 8px;
        padding: 15px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        min-width: 200px;
    `;
    
    panel.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: #007bff;">🚑 緊急編集パネル</h4>
        <button onclick="selectCharacter('purattokun')" style="display: block; width: 100%; margin: 5px 0; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">🐱 ぷらっとくん選択</button>
        <button onclick="selectCharacter('nezumi')" style="display: block; width: 100%; margin: 5px 0; padding: 8px; background: #ffc107; color: black; border: none; border-radius: 4px; cursor: pointer;">🐭 ねずみ選択</button>
        <hr>
        <button onclick="startCharacterEdit()" style="display: block; width: 100%; margin: 5px 0; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">📝 編集開始</button>
        <button onclick="cleanupModules()" style="display: block; width: 100%; margin: 5px 0; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">🧹 モジュール修復</button>
        <button onclick="closeEmergencyPanel()" style="display: block; width: 100%; margin: 5px 0; padding: 8px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">❌ 閉じる</button>
    `;
    
    document.body.appendChild(panel);
    console.log('✅ 緊急編集パネル作成完了');
}

// 5. キャラクター選択機能
function selectCharacter(characterName) {
    console.log(`🎯 ${characterName}選択開始`);
    
    const canvas = document.getElementById(`${characterName}-canvas`);
    if (canvas) {
        // 既存選択をクリア
        document.querySelectorAll('canvas').forEach(c => {
            c.style.border = '';
            c.classList.remove('selected');
        });
        
        // 新しい選択をハイライト
        canvas.style.border = '3px solid #007bff';
        canvas.classList.add('selected');
        
        // MultiCharacterManagerに通知
        if (window.MultiCharacterManager) {
            window.MultiCharacterManager.activeCharacter = {
                id: `${characterName}-canvas`,
                name: characterName,
                element: canvas
            };
        }
        
        console.log(`✅ ${characterName}選択完了`);
        alert(`${characterName}を選択しました。「編集開始」ボタンで編集を開始できます。`);
    } else {
        console.error(`❌ ${characterName}-canvas要素が見つかりません`);
        alert(`${characterName}が見つかりません`);
    }
}

// 6. パネル閉じる機能
function closeEmergencyPanel() {
    const panel = document.getElementById('emergency-edit-panel');
    if (panel) {
        panel.remove();
    }
}

// 7. nezumi座標修正
function fixNezumiPosition() {
    console.log('🐭 nezumi座標修正開始');
    
    const nezumiCanvas = document.getElementById('nezumi-canvas');
    if (nezumiCanvas) {
        // nezumiの元々の位置に修正
        nezumiCanvas.style.left = '75%';
        nezumiCanvas.style.top = '75%';
        nezumiCanvas.style.transform = 'translate(-50%, -50%)';
        
        console.log('✅ nezumi座標修正完了');
    }
}

// グローバル関数として公開
window.cleanupModules = cleanupModules;
window.emergencyEditStart = emergencyEditStart;
window.selectCharacter = selectCharacter;
window.closeEmergencyPanel = closeEmergencyPanel;
window.fixNezumiPosition = fixNezumiPosition;

// 自動実行
cleanupModules();
emergencyEditStart();
fixNezumiPosition();

console.log('🎯 緊急修復完了 - 緊急編集パネルから操作してください');
EOF < /dev/null