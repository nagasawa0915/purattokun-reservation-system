// 🔄 タイムライン編集システム - 互換性保証（150行以内）
// 役割: 既存システム互換性・後方互換性保証・自動初期化
// 分割元: timeline-edit-integration.js の互換性機能のみ抽出

console.log('🔄 Timeline Edit Compatibility モジュール読み込み開始');

/**
 * タイムライン編集システム - 互換性管理クラス
 * 既存システムとの互換性・後方互換性を保証
 */
class TimelineEditCompatibility {
    constructor() {
        this.coreInstance = null;
        this.legacySupport = true;
        this.autoInitEnabled = true;
        
        console.log('🔄 Timeline Edit Compatibility 初期化');
    }
    
    /**
     * 互換性システムを初期化
     */
    init() {
        this.setupLegacySupport();
        this.setupAutoInitialization();
        
        console.log('✅ Timeline Edit Compatibility 初期化完了');
        return true;
    }
    
    /**
     * 従来版互換性サポート設定
     */
    setupLegacySupport() {
        // 従来のTimelineEditIntegrationクラスへの互換性エイリアス
        if (!window.TimelineEditIntegration) {
            window.TimelineEditIntegration = class LegacyTimelineEditIntegration {
                constructor() {
                    console.warn('⚠️ 従来のTimelineEditIntegrationは非推奨です。新しいTimelineEditCoreを使用してください。');
                    
                    // 新しいシステムに委譲
                    this.core = new TimelineEditCore();
                    
                    // 従来メソッドの互換性マッピング
                    this.isTimelineMode = false;
                    this.timelineEditor = null;
                }
                
                // 従来メソッド互換
                init() { return this.core.init(); }
                toggleTimelineEditMode() { this.core.toggleTimelineEditMode(); }
                enterTimelineEditMode() { this.core.enterTimelineEditMode(); }
                exitTimelineEditMode() { this.core.exitTimelineEditMode(); }
                destroy() { this.core.destroy(); }
                
                // ゲッター・セッター互換
                get isTimelineMode() { return this.core.isTimelineMode; }
                set isTimelineMode(value) { this.core.isTimelineMode = value; }
            };
        }
        
        // 古いAPIメソッド互換性
        if (!window.initTimelineEdit) {
            window.initTimelineEdit = (options = {}) => {
                console.warn('⚠️ initTimelineEdit()は非推奨です。TimelineEditCore.init()を使用してください。');
                const core = new TimelineEditCore();
                return core.init();
            };
        }
        
        // 古いコールバック互換性
        this.setupLegacyCallbacks();
        
        console.log('🔄 従来版互換性サポート設定完了');
    }
    
    /**
     * 従来のコールバック互換性設定
     */
    setupLegacyCallbacks() {
        // 旧式のイベントハンドラー対応
        const legacyEvents = [
            'onTimelineEditStart',
            'onTimelineEditEnd', 
            'onTimelinePlay',
            'onTimelineStop'
        ];
        
        legacyEvents.forEach(eventName => {
            if (window[eventName] && typeof window[eventName] === 'function') {
                // 新しいイベントシステムに変換
                document.addEventListener('timelineEditModeChange', (e) => {
                    const { mode, isTimelineMode } = e.detail;
                    
                    if (eventName === 'onTimelineEditStart' && isTimelineMode) {
                        window[eventName](mode);
                    } else if (eventName === 'onTimelineEditEnd' && !isTimelineMode) {
                        window[eventName](mode);
                    }
                });
                
                console.log(`🔄 従来コールバック ${eventName} を新システムに統合`);
            }
        });
    }
    
    /**
     * 自動初期化システム設定
     */
    setupAutoInitialization() {
        // DOMContentLoaded時の自動初期化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.performAutoInitialization();
            });
        } else {
            // 既にDOM読み込み完了の場合は即座に実行
            this.performAutoInitialization();
        }
        
        // 編集システム読み込み完了の監視
        this.watchForEditSystemLoad();
    }
    
    /**
     * 自動初期化実行
     */
    performAutoInitialization() {
        if (!this.autoInitEnabled) return;
        
        // URLパラメータで編集モードかチェック
        const urlParams = new URLSearchParams(window.location.search);
        const isEditMode = urlParams.get('edit') === 'true';
        
        if (isEditMode) {
            // 既存システムの読み込み完了を待つ
            setTimeout(() => {
                this.initializeTimelineEditSystem();
            }, 1000); // 1秒後に初期化
        }
    }
    
    /**
     * タイムライン編集システム初期化実行
     */
    initializeTimelineEditSystem() {
        try {
            // 新しいコアシステムを使用
            this.coreInstance = new TimelineEditCore();
            
            if (this.coreInstance.init()) {
                // グローバルアクセス用
                window.timelineEditCore = this.coreInstance;
                
                // 従来版互換性のため
                window.timelineEditIntegration = this.coreInstance;
                
                console.log('🎬 タイムライン編集統合システム自動起動完了 (新版)');
            } else {
                console.warn('⚠️ タイムライン編集システムの初期化に失敗しました');
            }
        } catch (error) {
            console.error('❌ タイムライン編集システム初期化エラー:', error);
            
            // フォールバック: 従来版による初期化試行
            this.fallbackToLegacySystem();
        }
    }
    
    /**
     * 編集システム読み込み監視
     */
    watchForEditSystemLoad() {
        let checkCount = 0;
        const maxChecks = 50; // 最大5秒間監視
        
        const checkInterval = setInterval(() => {
            checkCount++;
            
            // 編集システム関数の存在確認
            const editSystemLoaded = (
                typeof window.startCharacterEdit === 'function' ||
                typeof window.startCanvasEdit === 'function' ||
                document.querySelector('.edit-panel') !== null
            );
            
            if (editSystemLoaded || checkCount >= maxChecks) {
                clearInterval(checkInterval);
                
                if (editSystemLoaded) {
                    console.log('✅ 既存編集システム読み込み確認');
                    
                    // まだ初期化されていない場合は初期化実行
                    if (!this.coreInstance && this.autoInitEnabled) {
                        this.performAutoInitialization();
                    }
                } else {
                    console.warn('⚠️ 編集システムの読み込みを確認できませんでした');
                }
            }
        }, 100);
    }
    
    /**
     * 従来システムへのフォールバック
     */
    fallbackToLegacySystem() {
        console.warn('🔄 新システム初期化失敗 - 従来システムにフォールバック');
        
        try {
            // 元のtimeline-edit-integration.jsの動作を模倣
            const legacyIntegration = new window.TimelineEditIntegration();
            if (legacyIntegration.init()) {
                window.timelineEditIntegration = legacyIntegration;
                console.log('✅ 従来システムでの初期化完了');
            }
        } catch (error) {
            console.error('❌ 従来システムでの初期化も失敗:', error);
        }
    }
    
    /**
     * バージョン情報取得
     */
    getVersionInfo() {
        return {
            version: '2.5',
            apiVersion: 'v2',
            legacySupport: this.legacySupport,
            autoInit: this.autoInitEnabled,
            coreLoaded: this.coreInstance !== null
        };
    }
    
    /**
     * 設定変更
     */
    configure(options = {}) {
        if (typeof options.legacySupport !== 'undefined') {
            this.legacySupport = options.legacySupport;
        }
        
        if (typeof options.autoInit !== 'undefined') {
            this.autoInitEnabled = options.autoInit;
        }
        
        console.log('🔧 互換性設定更新:', options);
    }
    
    /**
     * システム健全性チェック
     */
    healthCheck() {
        const status = {
            coreSystem: this.coreInstance !== null,
            editSystemDetected: (
                typeof window.startCharacterEdit === 'function' ||
                typeof window.startCanvasEdit === 'function' ||
                document.querySelector('.edit-panel') !== null
            ),
            legacyCompatibility: this.legacySupport,
            autoInitialization: this.autoInitEnabled
        };
        
        console.log('🏥 タイムライン編集システム健全性:', status);
        return status;
    }
    
    /**
     * 互換性システムを破棄
     */
    destroy() {
        if (this.coreInstance) {
            this.coreInstance.destroy();
            this.coreInstance = null;
        }
        
        // グローバル参照をクリア
        if (window.timelineEditCore) {
            delete window.timelineEditCore;
        }
        if (window.timelineEditIntegration) {
            delete window.timelineEditIntegration;
        }
        
        console.log('🗑️ Timeline Edit Compatibility 破棄完了');
    }
}

// 自動初期化インスタンス作成
const timelineCompatibility = new TimelineEditCompatibility();
timelineCompatibility.init();

// グローバルに公開
window.TimelineEditCompatibility = TimelineEditCompatibility;
window.timelineEditCompatibility = timelineCompatibility;

console.log('✅ Timeline Edit Compatibility モジュール読み込み完了');