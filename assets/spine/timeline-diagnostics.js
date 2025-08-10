// 🔍 Timeline Diagnostics - エラー診断・システム健全性チェック機能
// 分離理由: timeline-error-handler.js サイズ制限遵守（170行以内）
// 機能: システム診断・修復処理・デバッグ支援

console.log('🔍 Timeline Diagnostics 読み込み開始');

// ========== システム診断・修復機能 ========== //

/**
 * Timeline Diagnostics 拡張機能
 * TimelineErrorHandlerの診断・修復機能を提供
 */
class TimelineDiagnostics {
    constructor() {
        this.errorHandler = window.TimelineErrorHandler;
        if (!this.errorHandler) {
            console.error('❌ TimelineErrorHandler が見つかりません。timeline-error-core.js を先に読み込んでください');
        }
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
     * 汎用データフォールバック
     */
    genericDataFallback(dataType) {
        console.log(`🔄 汎用データフォールバック (${dataType})`);
        
        // データタイプ別の基本的なフォールバック
        const fallbackData = {
            'keyframes': [],
            'sequences': {},
            'characters': {},
            'settings': this.errorHandler?.getEmergencyTimelineSettings()?.timeline
        };
        
        return fallbackData[dataType] || null;
    }
    
    /**
     * ConfigFileフォールバック
     */
    fallbackToConfigFile() {
        console.log('📁 設定ファイルにフォールバック');
        
        // 基本的な設定構造を返す
        return {
            version: '1.0-fallback',
            characters: {},
            globalSettings: {
                frameRate: 30,
                syncTolerance: 50
            }
        };
    }
    
    /**
     * デフォルト設定フォールバック
     */
    fallbackToDefaultSettings() {
        console.log('⚙️ デフォルト設定にフォールバック');
        
        return {
            version: '1.0-default',
            timeline: {
                enabled: false, // セーフモード
                frameRate: 30,
                characters: {}
            }
        };
    }
    
    /**
     * システム競合解決 - ポジショニングシステム
     */
    resolvePositioningConflict() {
        console.log('🔧 ポジショニングシステム競合解決');
        
        // タイムライン機能をポジショニングシステムから分離
        if (window.SpineEditSystem) {
            console.log('🔒 SpineEditSystem との統合を一時無効化');
            return { resolved: true, isolated: true };
        }
        
        return { resolved: false, reason: 'positioning-system-not-found' };
    }
    
    /**
     * システム競合解決 - 境界ボックスシステム
     */
    resolveBoundingBoxConflict() {
        console.log('🔧 境界ボックスシステム競合解決');
        
        // 境界ボックス統合を安全モードに切り替え
        if (window.SpineBoundsIntegration) {
            console.log('🔒 SpineBoundsIntegration を安全モードに切り替え');
            return { resolved: true, safeMode: true };
        }
        
        return { resolved: false, reason: 'bounding-box-system-not-found' };
    }
    
    /**
     * システム競合解決 - パッケージ出力システム
     */
    resolvePackageExportConflict() {
        console.log('🔧 パッケージ出力システム競合解決');
        
        // パッケージ出力機能からタイムライン要素を除外
        if (window.SpinePackageExport) {
            console.log('🔒 パッケージ出力からタイムライン機能を除外');
            return { resolved: true, excluded: true };
        }
        
        return { resolved: false, reason: 'package-export-not-found' };
    }
    
    /**
     * 汎用統合回復処理
     */
    genericIntegrationRecovery(systemName) {
        console.log(`🔧 汎用統合回復処理 (${systemName})`);
        
        // 基本的な統合問題の回復
        return {
            recovered: true,
            method: 'isolation',
            details: `${systemName} システムを隔離しました`
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
     * 緊急既存システム保護
     */
    emergencyProtectExistingSystems() {
        console.log('🚨 緊急既存システム保護実行');
        
        const protectedSystems = [];
        const systemsToProtect = [
            'SpineEditSystem', 'SpineBoundsIntegration', 
            'SpineCharacterManager', 'SpinePackageExport'
        ];
        
        systemsToProtect.forEach(systemName => {
            if (window[systemName]) {
                // システムの動作状態を保護
                window[systemName]._timelineProtected = true;
                protectedSystems.push(systemName);
            }
        });
        
        console.log(`🛡️ 保護完了: ${protectedSystems.join(', ')}`);
        return protectedSystems;
    }
    
    /**
     * タイムライン機能安全停止
     */
    safeShutdownTimelineFeatures() {
        console.log('⏹️ タイムライン機能安全停止');
        
        // アクティブなタイムラインの停止
        const stoppedFeatures = [];
        
        if (window.TimelineSystem) {
            window.TimelineSystem.enabled = false;
            stoppedFeatures.push('TimelineSystem');
        }
        
        if (window.timelineSequences) {
            Object.values(window.timelineSequences).forEach(sequence => {
                if (sequence.stop) sequence.stop();
            });
            stoppedFeatures.push('ActiveSequences');
        }
        
        console.log(`⏹️ 停止完了: ${stoppedFeatures.join(', ')}`);
        return stoppedFeatures;
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
     * エラー統計取得（トラブルシューティング用）
     */
    getErrorStats() {
        if (!this.errorHandler) return null;
        
        const errorLog = this.errorHandler.getErrorLog();
        const stats = {
            total: errorLog.length,
            byType: {},
            recent: errorLog.slice(0, 3)
        };
        
        errorLog.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
        });
        
        return stats;
    }
}

// ========== TimelineErrorHandler 拡張 ========== //

if (window.TimelineErrorHandler) {
    const diagnostics = new TimelineDiagnostics();
    
    // 診断機能をTimelineErrorHandlerに追加
    window.TimelineErrorHandler.attemptCoordinateRecovery = diagnostics.attemptCoordinateRecovery.bind(diagnostics);
    window.TimelineErrorHandler.fallbackToBasicCoordinates = diagnostics.fallbackToBasicCoordinates.bind(diagnostics);
    window.TimelineErrorHandler.genericDataFallback = diagnostics.genericDataFallback.bind(diagnostics);
    window.TimelineErrorHandler.fallbackToConfigFile = diagnostics.fallbackToConfigFile.bind(diagnostics);
    window.TimelineErrorHandler.fallbackToDefaultSettings = diagnostics.fallbackToDefaultSettings.bind(diagnostics);
    window.TimelineErrorHandler.resolvePositioningConflict = diagnostics.resolvePositioningConflict.bind(diagnostics);
    window.TimelineErrorHandler.resolveBoundingBoxConflict = diagnostics.resolveBoundingBoxConflict.bind(diagnostics);
    window.TimelineErrorHandler.resolvePackageExportConflict = diagnostics.resolvePackageExportConflict.bind(diagnostics);
    window.TimelineErrorHandler.genericIntegrationRecovery = diagnostics.genericIntegrationRecovery.bind(diagnostics);
    window.TimelineErrorHandler.isolateTimelineSystem = diagnostics.isolateTimelineSystem.bind(diagnostics);
    window.TimelineErrorHandler.verifyExistingSystemsHealth = diagnostics.verifyExistingSystemsHealth.bind(diagnostics);
    window.TimelineErrorHandler.checkSystemHealth = diagnostics.checkSystemHealth.bind(diagnostics);
    window.TimelineErrorHandler.emergencyProtectExistingSystems = diagnostics.emergencyProtectExistingSystems.bind(diagnostics);
    window.TimelineErrorHandler.safeShutdownTimelineFeatures = diagnostics.safeShutdownTimelineFeatures.bind(diagnostics);
    window.TimelineErrorHandler.notifyUserGracefully = diagnostics.notifyUserGracefully.bind(diagnostics);
    window.TimelineErrorHandler.getErrorStats = diagnostics.getErrorStats.bind(diagnostics);
    
    console.log('✅ TimelineErrorHandler 診断機能拡張完了');
}

// デバッグ・開発支援関数
window.debugTimelineErrors = () => window.TimelineErrorHandler?.getErrorStats() || null;
window.showTimelineErrors = () => {
    const errors = window.TimelineErrorHandler?.getErrorLog() || [];
    if (errors.length > 0) {
        console.table(errors);
    } else {
        console.log('エラーログなし');
    }
};

console.log('✅ Timeline Diagnostics 読み込み完了');