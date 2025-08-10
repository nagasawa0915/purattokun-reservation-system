// 🔄 Timeline Compatibility - 互換性維持機能
// 分離理由: timeline-data-manager.js サイズ制限遵守（60行以内）
// 機能: システム間互換性保証・レガシーサポート

console.log('🔄 Timeline Compatibility 読み込み開始');

// ========== システム互換性維持機能 ========== //

/**
 * Timeline Compatibility 拡張機能
 * TimelineDataManagerの互換性維持機能を提供
 */
class TimelineCompatibility {
    constructor() {
        this.dataManager = window.TimelineDataManager;
        if (!this.dataManager) {
            console.error('❌ TimelineDataManager が見つかりません。timeline-data-core.js を先に読み込んでください');
        }
    }
    
    /**
     * システム互換性維持
     * 各システムが独立して動作できるよう個別保存も維持
     */
    maintainSystemCompatibility(unifiedState) {
        try {
            // 編集システム互換性
            if (unifiedState.positioning) {
                localStorage.setItem(this.dataManager.compatibilityKeys.positioning, 
                                   JSON.stringify(unifiedState.positioning));
            }
            
            // 境界ボックス互換性
            if (unifiedState.boundingBox) {
                localStorage.setItem(this.dataManager.compatibilityKeys.boundingBox, 
                                   JSON.stringify(unifiedState.boundingBox));
            }
            
            // キャラクター管理互換性
            if (unifiedState.characters) {
                localStorage.setItem(this.dataManager.compatibilityKeys.characters, 
                                   JSON.stringify(unifiedState.characters));
            }
            
            console.log('✅ システム互換性維持保存完了');
            
        } catch (error) {
            console.warn('⚠️ システム互換性維持に失敗:', error);
            // 非致命的エラーなので続行
        }
    }
}

// ========== TimelineDataManager 拡張 ========== //

if (window.TimelineDataManager) {
    const compatibility = new TimelineCompatibility();
    
    // 互換性機能をTimelineDataManagerに追加
    window.TimelineDataManager.maintainSystemCompatibility = compatibility.maintainSystemCompatibility.bind(compatibility);
    
    console.log('✅ TimelineDataManager 互換性機能拡張完了');
}

// デバッグ・開発支援関数
window.debugTimelineStorage = () => window.TimelineDataManager?.diagnosisStorage() || null;

console.log('✅ Timeline Compatibility 読み込み完了');