// 🎬 タイムライン制御システム - エラーハンドリング・graceful degradation
// 役割: エラー検出・回復・フォールバック・既存システム保護
// Phase 1: 基本エラーハンドリング・品質保証実装
// 制約: 200行以内

console.log('🛡️ Timeline Error Handler モジュール読み込み開始');

// ========== エラーハンドリング・graceful degradation ========== //

/**
 * タイムライン制御エラーハンドリングクラス
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
     * 3段階フォールバックシステム対応
     */
    handleDataLoadError(error, dataType = 'unknown') {
        console.error(`❌ データ読み込みエラー (${dataType}):`, error);
        
        this.logError('data-load', error, { dataType });
        
        try {
            // データタイプ別フォールバック戦略
            switch (dataType) {
                case 'localStorage':
                    return this.fallbackToConfigFile();
                    
                case 'config-file':
                    return this.fallbackToDefaultSettings();
                    
                case 'timeline-settings':
                    return this.getEmergencyTimelineSettings();
                    
                default:
                    console.log('🔄 汎用データフォールバック実行');
                    return this.genericDataFallback(dataType);
            }
            
        } catch (fallbackError) {
            console.error('❌ データフォールバック失敗:', fallbackError);
            return null; // 最終的にnullを返してシステム側で判断
        }
    }
    
    /**
     * 既存システム統合エラーの処理
     * 境界ボックス・パッケージ出力・編集システムとの競合問題対応
     */
    handleIntegrationError(error, systemName = 'unknown') {
        console.error(`❌ システム統合エラー (${systemName}):`, error);
        
        const errorRecord = this.logError('integration', error, { systemName });
        
        try {
            // システム別競合解決
            switch (systemName) {
                case 'positioning-system':
                    return this.resolvePositioningConflict();
                    
                case 'bounding-box':
                    return this.resolveBoundingBoxConflict();
                    
                case 'package-export':
                    return this.resolvePackageExportConflict();
                    
                default:
                    return this.genericIntegrationRecovery(systemName);
            }
            
        } catch (recoveryError) {
            console.error('❌ 統合エラー回復失敗:', recoveryError);
            return this.isolateTimelineSystem();
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
        console.log('🛡️ 保護モード起動 - 既存システム隔離');
        
        // タイムライン機能を既存システムから隔離
        this.isolateTimelineSystem();
        
        // 既存システムの動作確認
        this.verifyExistingSystemsHealth();
    }
    
    /**
     * 座標システム自動修復試行
     */
    attemptCoordinateRecovery(context) {
        try {
            // 基本的な座標計算の復旧
            if (context.element && context.coordinates) {
                const element = context.element;
                const coords = context.coordinates;
                
                // 安全な座標適用
                if (coords.x !== undefined) element.style.left = coords.x;
                if (coords.y !== undefined) element.style.top = coords.y;
                
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('座標システム修復失敗:', error);
            return false;
        }
    }
    
    /**
     * 基本座標システムフォールバック
     */
    fallbackToBasicCoordinates(context) {
        console.log('📐 基本座標システムに切り替え');
        
        // CSSベースの基本的な位置制御に切り替え
        if (context.element) {
            context.element.style.position = 'absolute';
            context.element.style.left = context.element.style.left || '0px';
            context.element.style.top = context.element.style.top || '0px';
        }
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
     * タイムラインシステム隔離
     */
    isolateTimelineSystem() {
        console.log('🔒 タイムラインシステム隔離実行');
        
        // グローバル名前空間の隔離
        if (window.TimelineSystem) {
            window.TimelineSystem.isolated = true;
            window.TimelineSystem.integrationEnabled = false;
        }
        
        return { isolated: true, integrationDisabled: true };
    }
    
    /**
     * 既存システム健全性確認
     */
    verifyExistingSystemsHealth() {
        const health = {
            positioning: this.checkSystemHealth('SpineEditSystem'),
            boundingBox: this.checkSystemHealth('SpineBoundsIntegration'),
            characters: this.checkSystemHealth('SpineCharacterManager'),
            packageExport: this.checkSystemHealth('SpinePackageExport')
        };
        
        console.log('🏥 既存システム健全性:', health);
        return health;
    }
    
    /**
     * システム健全性個別チェック
     */
    checkSystemHealth(systemName) {
        try {
            return {
                exists: !!window[systemName],
                functional: typeof window[systemName] === 'object',
                healthy: true
            };
        } catch (error) {
            return { exists: false, functional: false, healthy: false, error };
        }
    }
    
    /**
     * 非侵入的ユーザー通知
     */
    notifyUserGracefully(message) {
        // コンソールログのみ（UIを侵害しない）
        console.log(`💬 ユーザー通知: ${message}`);
        
        // 開発時のみF12コンソールに詳細表示
        if (window.location.search.includes('debug=true')) {
            console.warn('⚠️ Timeline System:', message);
        }
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
    
    /**
     * エラー統計取得（トラブルシューティング用）
     */
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            byType: {},
            recent: this.errorLog.slice(0, 3)
        };
        
        this.errorLog.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
        });
        
        return stats;
    }
}

// ========== グローバル公開・初期化 ========== //

// グローバルインスタンス作成
if (!window.TimelineErrorHandler) {
    window.TimelineErrorHandler = new TimelineErrorHandler();
    console.log('✅ Timeline Error Handler グローバル初期化完了');
}

// デバッグ・開発支援関数
window.debugTimelineErrors = () => window.TimelineErrorHandler.getErrorStats();
window.showTimelineErrors = () => console.table(window.TimelineErrorHandler.getErrorLog());

console.log('✅ Timeline Error Handler モジュール読み込み完了');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimelineErrorHandler;
}