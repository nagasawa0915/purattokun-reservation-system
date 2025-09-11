/**
 * Spine ドラッグ&ドロップ診断スクリプト
 * F12コンソールで実行してください
 */

console.log('🔍 Spine D&D診断開始');

// PreviewController確認
if (window.previewController) {
    console.log('✅ PreviewController存在:', window.previewController);
    console.log('📍 contentArea:', window.previewController.contentArea);
    
    if (window.previewController.contentArea) {
        console.log('✅ contentArea存在 - 要素確認:');
        console.log('- tagName:', window.previewController.contentArea.tagName);
        console.log('- className:', window.previewController.contentArea.className);
        console.log('- innerHTML長さ:', window.previewController.contentArea.innerHTML.length);
        
        // ドロップイベントテスト
        console.log('🧪 ドロップイベントテスト実行...');
        
        const testDropEvent = new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            dataTransfer: new DataTransfer()
        });
        
        testDropEvent.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'spine-character',
            name: 'test-character',
            displayName: 'テストキャラクター'
        }));
        
        window.previewController.contentArea.dispatchEvent(testDropEvent);
        console.log('✅ テストドロップイベント送信完了');
        
    } else {
        console.error('❌ contentAreaが見つかりません');
        
        // プレビューパネル直接検索
        const previewPanel = document.querySelector('.panel-preview');
        if (previewPanel) {
            console.log('🔍 .panel-preview発見:', previewPanel);
            const panelContent = previewPanel.querySelector('.panel-content');
            console.log('🔍 .panel-content発見:', panelContent);
        } else {
            console.error('❌ .panel-previewも見つかりません');
        }
    }
} else {
    console.error('❌ PreviewControllerが存在しません');
}

// HomepageIntegrationController確認
if (window.homepageIntegration) {
    console.log('✅ HomepageIntegrationController存在:', window.homepageIntegration);
    console.log('📍 previewController:', window.homepageIntegration.previewController);
} else {
    console.error('❌ HomepageIntegrationControllerが存在しません');
}

console.log('🔍 診断完了');