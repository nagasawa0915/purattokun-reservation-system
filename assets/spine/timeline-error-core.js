// 🛡️ Timeline Error Handler コア機能 - 200行制限遵守
// 分離理由: timeline-error-handler.js サイズ制限遵守
// 機能: 基本エラー処理・フォールバック・既存システム保護

console.log('🛡️ Timeline Error Core 読み込み開始');

// ========== エラーハンドリング・graceful degradation ========== //

/**
 * タイムライン制御エラーハンドリングクラス（コア機能）
 * 仕様: 既存システム保護・graceful degradation・境界ボックス統合の教訓適用
 */
class TimelineErrorHandler {
    constructor() {
        this.version = '1.0';
        this.errorLog = [];
        this.fallbackEnabled = true;
        this.maxErrors = 10; // エラーログ最大保持数
        
        // 既存システム保護フラグ
        this.protectionFlags = {
            positioningSystem: true,
            boundingBoxSystem: true,
            characterManager: true,
            packageExport: true
        };
        
        console.log('✅ Timeline Error Handler 初期化完了');
    }
    
    /**
     * 統一座標システム失敗時のフォールバック
     * 境界ボックス統合での教訓: 統一座標システム必須適用
     */
    handleCoordinateSystemError(error, context = {}) {
        console.error('❌ 統一座標システムエラー検出:', error);
        
        const errorRecord = this.logError('coordinate-system', error, context);
        
        try {
            // 1. 既存システム保護チェック
            if (this.isExistingSystemAffected(error)) {
                console.log('🛡️ 既存システム影響検出 - 保護モード起動');
                this.activateProtectionMode();
            }
            
            // 2. 座標システム自動修復試行
            const recovered = this.attemptCoordinateRecovery(context);
            if (recovered) {
                console.log('✅ 座標システム自動修復成功');
                return { success: true, fallback: false, recovery: true };
            }
            
            // 3. 基本座標システムフォールバック
            console.log('🔄 基本座標システムにフォールバック');
            this.fallbackToBasicCoordinates(context);
            
            return { success: true, fallback: true, recovery: false };
            
        } catch (fallbackError) {
            console.error('❌ 座標システムフォールバック失敗:', fallbackError);
            return this.handleCriticalError(fallbackError, 'coordinate-fallback');
        }
    }
    
    /**
     * データ読み込みエラーのグレースフル処理
     */
    handleDataLoadError(error, dataType = 'unknown') {
        console.error(`❌ データ読み込みエラー (${dataType}):`, error);
        this.logError('data-load', error, { dataType });
        
        try {
            // データタイプ別フォールバック
            if (dataType === 'timeline-settings') return this.getEmergencyTimelineSettings();
            return null; // diagnosticsモジュールで詳細処理
        } catch (fallbackError) {
            console.error('❌ データフォールバック失敗:', fallbackError);
            return null;
        }
    }
    
    /**
     * 既存システム統合エラーの処理
     */
    handleIntegrationError(error, systemName = 'unknown') {
        console.error(`❌ システム統合エラー (${systemName}):`, error);
        this.logError('integration', error, { systemName });
        
        try {
            // 基本的な隔離処理（詳細はdiagnosticsモジュール）
            return { isolated: true, systemName };
        } catch (recoveryError) {
            console.error('❌ 統合エラー回復失敗:', recoveryError);
            return { success: false, emergency: true };
        }
    }
    
    /**
     * 致命的エラーの処理
     * 最終的な安全確保・既存システム完全保護
     */
    handleCriticalError(error, context = '') {
        console.error('🚨 致命的エラー検出:', error);
        
        this.logError('critical', error, { context, timestamp: Date.now() });
        
        try {
            // 1. 既存システム完全保護
            this.emergencyProtectExistingSystems();
            
            // 2. タイムライン機能安全停止
            this.safeShutdownTimelineFeatures();
            
            // 3. ユーザーへの通知（非侵入的）
            this.notifyUserGracefully('タイムライン機能は一時的に無効です');
            
            return { 
                success: false, 
                shutdown: true, 
                existingSystemsProtected: true 
            };
            
        } catch (emergencyError) {
            console.error('🚨 緊急処理失敗:', emergencyError);
            // これ以上何もできない - ブラウザログに記録のみ
            return { success: false, emergency: true };
        }
    }
    
    /**
     * 既存システム影響チェック
     */
    isExistingSystemAffected(error) {
        const errorString = error.toString().toLowerCase();
        const affectedKeywords = [
            'positioning', 'character', 'spine', 'canvas',
            'bounding', 'export', 'package', 'edit'
        ];
        
        return affectedKeywords.some(keyword => errorString.includes(keyword));
    }
    
    /**
     * 保護モード起動
     */
    activateProtectionMode() {
        console.log('🛡️ 保護モード起動');
        // 詳細処理はdiagnosticsモジュールに委譲
    }
    
    /**
     * 緊急タイムライン設定取得
     */
    getEmergencyTimelineSettings() {
        return {
            version: '1.0-emergency',
            timeline: {
                globalSettings: {
                    frameRate: 30, // 軽量化
                    syncTolerance: 50,
                    defaultDuration: 1000
                },
                characters: {},
                emergencyMode: true
            },
            metadata: {
                isEmergency: true,
                created: new Date().toISOString(),
                reason: 'data-load-failure'
            }
        };
    }
    
    /**
     * エラーログ記録
     */
    logError(type, error, context = {}) {
        const errorRecord = {
            id: Date.now(),
            type,
            error: error.toString(),
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        };
        
        this.errorLog.unshift(errorRecord);
        
        // 最大保持数を超えた場合の古いエラー削除
        if (this.errorLog.length > this.maxErrors) {
            this.errorLog = this.errorLog.slice(0, this.maxErrors);
        }
        
        return errorRecord;
    }
    
    /**
     * エラーログ取得（デバッグ用）
     */
    getErrorLog() {
        return this.errorLog;
    }
}

// ========== グローバル公開・初期化 ========== //

// グローバルインスタンス作成
if (!window.TimelineErrorHandler) {
    window.TimelineErrorHandler = new TimelineErrorHandler();
    console.log('✅ Timeline Error Handler グローバル初期化完了');
}

console.log('✅ Timeline Error Core モジュール読み込み完了');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimelineErrorHandler;
}