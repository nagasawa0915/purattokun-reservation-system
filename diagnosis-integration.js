/**
 * 🎯 PureSpineEditor診断統合システム
 * 座標書き込み監視をPureSpineEditorに直接統合
 */

// PureSpineEditorに監視機能を統合
if (typeof PureSpineEditor !== 'undefined') {
    console.log('🔧 PureSpineEditor診断機能統合開始');
    
    // showBoundingBoxメソッドを監視付きに拡張
    const originalShowBoundingBox = PureSpineEditor.prototype.showBoundingBox;
    
    PureSpineEditor.prototype.showBoundingBox = function() {
        console.log('🔍 監視付きshowBoundingBox実行開始');
        
        // 監視開始
        if (typeof window !== 'undefined' && window.startCoordinateMonitoring) {
            window.startCoordinateMonitoring(this);
            console.log('📊 座標書き込み監視開始（showBoundingBox内）');
        }
        
        // 元のメソッド実行
        const result = originalShowBoundingBox.call(this);
        
        // 3秒後に分析レポート生成
        setTimeout(() => {
            if (typeof window !== 'undefined' && window.getCoordinateReport) {
                console.log('📊 showBoundingBox実行後の診断レポート:');
                const report = window.getCoordinateReport();
                
                if (report && report.conflicts > 0) {
                    console.error(`🚨 瞬間移動問題確認: ${report.conflicts}件の座標競合を検出`);
                    console.error('🔧 問題箇所:', report.logs.filter(log => 
                        log.property.includes('skeleton') || log.property.includes('canvas')
                    ));
                } else {
                    console.log('✅ 座標競合なし - 瞬間移動問題は解決済み');
                }
                
                // 監視停止
                if (window.stopCoordinateMonitoring) {
                    window.stopCoordinateMonitoring();
                }
            }
        }, 3000);
        
        return result;
    };
    
    // syncBoundingToSpineメソッドを監視付きに拡張
    const originalSyncBoundingToSpine = PureSpineEditor.prototype.syncBoundingToSpine;
    
    PureSpineEditor.prototype.syncBoundingToSpine = function() {
        console.log('🔄 監視付きsyncBoundingToSpine実行');
        
        // 実行前の状態記録
        const beforeState = {
            skeletonX: this.state.spine.skeleton?.x,
            skeletonY: this.state.spine.skeleton?.y,
            canvasLeft: this.config.canvasElement?.style.left,
            canvasTop: this.config.canvasElement?.style.top
        };
        
        console.log('📋 syncBoundingToSpine実行前の状態:', beforeState);
        
        // 元のメソッド実行
        const result = originalSyncBoundingToSpine.call(this);
        
        // 実行後の状態記録
        const afterState = {
            skeletonX: this.state.spine.skeleton?.x,
            skeletonY: this.state.spine.skeleton?.y,
            canvasLeft: this.config.canvasElement?.style.left,
            canvasTop: this.config.canvasElement?.style.top
        };
        
        console.log('📋 syncBoundingToSpine実行後の状態:', afterState);
        
        // 変更検出
        const changes = {};
        if (beforeState.skeletonX !== afterState.skeletonX) changes.skeletonX = {before: beforeState.skeletonX, after: afterState.skeletonX};
        if (beforeState.skeletonY !== afterState.skeletonY) changes.skeletonY = {before: beforeState.skeletonY, after: afterState.skeletonY};
        if (beforeState.canvasLeft !== afterState.canvasLeft) changes.canvasLeft = {before: beforeState.canvasLeft, after: afterState.canvasLeft};
        if (beforeState.canvasTop !== afterState.canvasTop) changes.canvasTop = {before: beforeState.canvasTop, after: afterState.canvasTop};
        
        if (Object.keys(changes).length > 0) {
            console.warn('🚨 syncBoundingToSpineによる座標変更を検出:', changes);
        }
        
        return result;
    };
    
    console.log('✅ PureSpineEditor診断機能統合完了');
}

// ワンクリック診断機能
if (typeof window !== 'undefined') {
    window.runInstantDiagnosis = function(editor) {
        console.log('⚡ 瞬間診断開始');
        
        if (!editor) {
            console.error('❌ PureSpineEditorインスタンスが必要です');
            return;
        }
        
        console.log('🔍 Step 1: 監視開始');
        if (window.startCoordinateMonitoring) {
            window.startCoordinateMonitoring(editor);
        }
        
        console.log('📦 Step 2: バウンディングボックス表示（監視付き）');
        editor.showBoundingBox(); // 監視付きバージョンが実行される
        
        console.log('⏱️ Step 3: 3秒後に結果表示...');
    };
    
    window.checkCoordinateWrites = function(editor) {
        if (!editor || !editor.state || !editor.state.spine || !editor.state.spine.skeleton) {
            console.error('❌ 有効なPureSpineEditorインスタンスが必要です');
            return;
        }
        
        const skeleton = editor.state.spine.skeleton;
        const canvas = editor.config.canvasElement;
        
        console.log('📊 現在の座標状態:');
        console.log('  Skeleton座標:', {x: skeleton.x, y: skeleton.y, scaleX: skeleton.scaleX, scaleY: skeleton.scaleY});
        console.log('  Canvas位置:', {left: canvas.style.left, top: canvas.style.top, transform: canvas.style.transform});
        console.log('  バウンディングボックス表示中:', editor.state.editor.boundingBox.visible);
    };
    
    console.log('🎯 瞬間診断システム準備完了');
    console.log('📖 使用方法:');
    console.log('  - runInstantDiagnosis(editor) - 瞬間診断実行');
    console.log('  - checkCoordinateWrites(editor) - 座標状態確認');
}
