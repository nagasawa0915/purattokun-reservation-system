// 🎬 タイムライン制御システム - 統合読み込みエンジン
// 役割: 分割されたモジュールの統合読み込み・既存インターフェース保持
// 依存: timeline-control-core.js, timeline-animation-integration.js, timeline-debug-utilities.js
// 目的: 既存システムの完全保護・500行制限対応

console.log('🎬 Timeline Control Engine 統合モジュール読み込み開始');

// ========== モジュール読み込み順序管理 ========== //

/**
 * 分割モジュール動的読み込みシステム
 * 依存関係を考慮した順次読み込み
 */
class TimelineModuleLoader {
    constructor() {
        this.modules = [
            {
                name: 'Timeline Control Core',
                path: 'assets/spine/timeline-control-core.js',
                required: true,
                loaded: false
            },
            {
                name: 'Timeline Sync Controller',
                path: 'assets/spine/timeline-sync-controller.js',
                required: false,
                loaded: false
            },
            {
                name: 'Timeline Animation Integration',
                path: 'assets/spine/timeline-animation-integration.js',
                required: true,
                loaded: false
            },
            {
                name: 'Timeline Debug Utilities',
                path: 'assets/spine/timeline-debug-utilities.js',
                required: false,
                loaded: false
            }
        ];
        
        this.loadedCount = 0;
        this.initializationCallbacks = [];
        
        console.log('✅ Timeline Module Loader 構築完了');
    }
    
    /**
     * 全モジュール読み込み開始
     */
    async loadAllModules() {
        console.log('🚀 タイムライン分割モジュール読み込み開始');
        
        try {
            // Core モジュール最優先読み込み
            await this.loadModule(this.modules[0]);
            
            // 残りのモジュールを並列読み込み
            const remainingModules = this.modules.slice(1);
            await Promise.all(remainingModules.map(module => this.loadModule(module)));
            
            console.log('✅ 全タイムラインモジュール読み込み完了');
            
            // 初期化コールバック実行
            this.executeInitializationCallbacks();
            
            return true;
            
        } catch (error) {
            console.error('❌ タイムラインモジュール読み込みエラー:', error);
            
            // フォールバック: 必須モジュールが読み込めない場合の処理
            this.handleLoadFailure(error);
            
            return false;
        }
    }
    
    /**
     * 個別モジュール読み込み
     */
    async loadModule(moduleConfig) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = moduleConfig.path;
            script.type = 'text/javascript';
            
            script.onload = () => {
                moduleConfig.loaded = true;
                this.loadedCount++;
                console.log(`✅ ${moduleConfig.name} 読み込み完了`);
                resolve();
            };
            
            script.onerror = (error) => {
                console.error(`❌ ${moduleConfig.name} 読み込み失敗:`, error);
                
                if (moduleConfig.required) {
                    reject(new Error(`必須モジュール読み込み失敗: ${moduleConfig.name}`));
                } else {
                    console.warn(`⚠️ オプションモジュール読み込み失敗 (継続): ${moduleConfig.name}`);
                    resolve(); // オプションモジュールは失敗しても続行
                }
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * 読み込み完了後コールバック登録
     */
    onModulesLoaded(callback) {
        if (this.isAllModulesLoaded()) {
            // 既に読み込み完了している場合は即座に実行
            callback();
        } else {
            // 読み込み完了を待ってから実行
            this.initializationCallbacks.push(callback);
        }
    }
    
    /**
     * 全モジュール読み込み状態確認
     */
    isAllModulesLoaded() {
        const requiredModules = this.modules.filter(m => m.required);
        return requiredModules.every(m => m.loaded);
    }
    
    /**
     * 初期化コールバック実行
     */
    executeInitializationCallbacks() {
        this.initializationCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('❌ 初期化コールバック実行エラー:', error);
            }
        });
        
        this.initializationCallbacks = [];
    }
    
    /**
     * 読み込み失敗時の処理
     */
    handleLoadFailure(error) {
        console.error('❌ 致命的モジュール読み込み失敗:', error);
        console.warn('⚠️ タイムライン機能が制限される可能性があります');
        
        // エラーハンドリング統合
        if (window.TimelineErrorHandler) {
            window.TimelineErrorHandler.handleCriticalError(error, 'module-loading-failure');
        }
    }
}

// ========== 既存インターフェース保護システム ========== //

// モジュールローダーインスタンス作成
const timelineModuleLoader = new TimelineModuleLoader();

// 既存インターフェース保持のための包括関数
window.createTimelineEngine = () => {
    return new Promise((resolve, reject) => {
        timelineModuleLoader.onModulesLoaded(() => {
            try {
                if (!window.timelineEngine && window.TimelineControlEngine) {
                    window.timelineEngine = new window.TimelineControlEngine();
                    console.log('✅ Timeline Engine インスタンス作成完了');
                }
                resolve(window.timelineEngine);
            } catch (error) {
                console.error('❌ Timeline Engine インスタンス作成エラー:', error);
                reject(error);
            }
        });
    });
};

window.getTimelineStatus = () => {
    if (window.timelineEngine && window.timelineEngine.getDiagnosisInfo) {
        return window.timelineEngine.getDiagnosisInfo();
    } else if (window.TimelineDebugUtilities && window.timelineEngine) {
        return window.TimelineDebugUtilities.getDiagnosisInfo(window.timelineEngine);
    } else {
        console.log('⚠️ Timeline Engine未作成 - createTimelineEngine()を実行してください');
        return null;
    }
};

// ========== 自動初期化システム ========== //

// DOM読み込み完了後の自動初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM読み込み完了 - タイムラインモジュール読み込み開始');
    
    // モジュール読み込み開始
    timelineModuleLoader.loadAllModules().then(success => {
        if (success) {
            console.log('✅ タイムライン統合システム初期化完了');
            
            // 実験環境自動初期化
            if (window.location.pathname.includes('timeline-experiment.html')) {
                console.log('🧪 実験環境検出 - Timeline Engine自動作成');
                setTimeout(() => {
                    window.createTimelineEngine().then(engine => {
                        console.log('🧪 実験環境用Timeline Engine準備完了');
                    }).catch(error => {
                        console.error('❌ 実験環境Timeline Engine作成失敗:', error);
                    });
                }, 1000);
            }
            
        } else {
            console.error('❌ タイムライン統合システム初期化失敗');
        }
    });
});

// ========== 後方互換性保護 ========== //

// 既存コードが直接クラスにアクセスできるように保護
setTimeout(() => {
    // TimelineControlEngineクラスのグローバル公開確認
    if (!window.TimelineControlEngine) {
        console.warn('⚠️ TimelineControlEngine クラス未公開 - 後方互換性のため待機中...');
        
        // 最大5秒間待機してクラス公開を確認
        const checkInterval = setInterval(() => {
            if (window.TimelineControlEngine) {
                console.log('✅ TimelineControlEngine クラス公開確認');
                clearInterval(checkInterval);
            }
        }, 500);
        
        setTimeout(() => {
            clearInterval(checkInterval);
            if (!window.TimelineControlEngine) {
                console.error('❌ TimelineControlEngine クラス公開失敗 - モジュール読み込み問題の可能性');
            }
        }, 5000);
    }
}, 100);

// ========== ステータス表示 ========== //

console.log('✅ Timeline Control Engine 統合モジュール読み込み完了');
console.log('🎯 利用可能な機能 (非同期):');
console.log('  - createTimelineEngine() : Promise<engine> - エンジンインスタンス作成');
console.log('  - getTimelineStatus() : システム状態診断');
console.log('  - window.timelineEngine : 作成されたエンジンインスタンス');
console.log('🔧 分割モジュール構成:');
console.log('  - timeline-control-core.js : 基本制御・フレーム管理');
console.log('  - timeline-animation-integration.js : Spine統合・アニメーション');
console.log('  - timeline-debug-utilities.js : デバッグ・開発支援');

// Export for module systems (後方互換性)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        TimelineModuleLoader,
        createTimelineEngine: window.createTimelineEngine,
        getTimelineStatus: window.getTimelineStatus
    };
}