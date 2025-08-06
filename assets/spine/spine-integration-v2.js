/**
 * Spine WebGL統合モジュール v2.0 (リファクタリング版)
 * モジュラー設計による保守性とパフォーマンスの向上
 */

// =======================================
// ログレベル管理システム
// =======================================

const LogLevel = {
    ERROR: 0,   // エラー・重要な問題
    WARN: 1,    // 警告・注意事項
    INFO: 2,    // 一般的な情報・ステータス
    DEBUG: 3    // 詳細デバッグ情報
};

// デバッグモード設定（本番では ERROR のみ有効）
const DEBUG_CONFIG = {
    // 本番モード: localhost 以外では ERROR レベルのみ
    level: window.location.hostname === 'localhost' ? LogLevel.DEBUG : LogLevel.ERROR,
    
    // 各カテゴリーの有効/無効切り替え
    categories: {
        initialization: true,    // 初期化ログ
        animation: true,        // アニメーション関連
        physics: true,          // Physics処理
        performance: true,      // パフォーマンス監視
        position: true,         // 位置計算
        cache: true,           // キャッシュ処理
        bounds: true,          // SkeletonBounds境界ボックス
        debug_ui: false        // デバッグUI（本番では無効）
    }
};

// ログ出力関数
function log(level, category, message, ...args) {
    if (level > DEBUG_CONFIG.level) return;
    if (category && !DEBUG_CONFIG.categories[category]) return;
    
    const prefix = {
        [LogLevel.ERROR]: '❌',
        [LogLevel.WARN]: '⚠️',
        [LogLevel.INFO]: 'ℹ️',
        [LogLevel.DEBUG]: '🔍'
    }[level] || '📝';
    
    console.log(`${prefix} [${category || 'GENERAL'}] ${message}`, ...args);
}

// =======================================
// メインSpine統合マネージャー
// =======================================

class SpineIntegrationManager {
    constructor() {
        this.characterManager = null;
        this.debugWindow = null;
        this.coordinateUtils = null;
        this.animationController = null;
        this.initialized = false;
    }

    /**
     * 統合システム初期化
     */
    async init() {
        log(LogLevel.INFO, 'initialization', 'Initializing Spine Integration v2.0...');

        try {
            // 依存モジュールの初期化
            this.coordinateUtils = new SpineCoordinateUtils();
            this.animationController = new SpineAnimationController();
            this.characterManager = new SpineCharacterManager();
            
            // ドラッグ配置システム初期化（レスポンシブ座標システムに依存）
            this.dragPositioning = new SpineDragPositioning(this.coordinateUtils);
            this.dragPositioning.setupGlobalToggle();
            
            // デバッグ関数の設定
            this.coordinateUtils.setupDebugFunctions();
            
            // デバッグUIは開発モードのみ
            if (DEBUG_CONFIG.categories.debug_ui) {
                this.debugWindow = new SpineDebugWindow();
            }

            // Spine WebGL初期化
            const spineInitialized = await this.characterManager.init();
            if (!spineInitialized) {
                log(LogLevel.WARN, 'initialization', 'Spine WebGL initialization failed, using placeholder mode');
            }

            // プレースホルダーアニメーション定義追加
            this.animationController.addPlaceholderAnimations();

            this.initialized = true;
            log(LogLevel.INFO, 'initialization', 'Spine Integration v2.0 initialized successfully');

            return true;

        } catch (error) {
            log(LogLevel.ERROR, 'initialization', 'Failed to initialize Spine Integration:', error);
            return false;
        }
    }

    /**
     * キャラクター読み込み（簡略化インターフェース）
     */
    async loadCharacter(name, basePath, container) {
        if (!this.initialized) {
            log(LogLevel.WARN, 'animation', 'Integration manager not initialized');
            return null;
        }

        return await this.characterManager.loadCharacter(name, basePath, container);
    }

    /**
     * HTML設定を使用したキャラクター配置（レスポンシブ対応版）
     */
    async setupCharacterFromHTML(name, basePath, container, configElementId) {
        console.log('🎯 レスポンシブ対応のキャラクター配置開始:', name);
        
        // レスポンシブ座標システムからHTML設定読み込み
        const config = this.coordinateUtils.loadConfigFromHTML(configElementId);
        
        // デバッグ情報表示
        this.coordinateUtils.debugCoordinateTransformation(config);

        // キャラクター読み込み
        const character = await this.loadCharacter(name, basePath, container);
        if (!character) return null;

        // CSS基準配置: Canvasは.heroを基準に％で配置される
        console.log('🎯 CSS基準配置: Canvasは背景画像と同じ.hero基準で自動配置');
        console.log('📍 位置設定: left=' + config.x + '%, top=' + config.y + '%');
        console.log('📏 スケール設定: ' + config.scale);

        // CSS基準配置により、リサイズハンドラーは不要
        console.log('📱 CSS基準配置: リサイズ時も背景画像と自動同期');

        // フェードイン効果
        await this.animationController.executeHtmlFadeIn(
            name, 
            character.element || character.canvas, 
            {
                fadeDelay: config.fadeDelay,
                fadeDuration: config.fadeDuration
            }
        );

        // アニメーションシーケンス開始
        this.animationController.playSequence(name, ['syutugen', 'taiki']);

        return character;
    }

    /**
     * キャラクター位置設定
     */
    setCharacterPosition(name, x, y, scale = 1.0) {
        if (!this.coordinateUtils) return;

        // 安全な位置に制限
        const safePosition = this.coordinateUtils.constrainToViewport(x, y, scale);
        
        // キャラクターマネージャーに位置設定を委任
        this.characterManager.setPosition(name, safePosition.x, safePosition.y);
        
        // スケール設定（実装はキャラクターマネージャー側で）
        if (scale !== 1.0) {
            this.setCharacterScale(name, scale);
        }
    }

    /**
     * キャラクタースケール設定
     */
    setCharacterScale(name, scale) {
        const character = this.characterManager.characters.get(name);
        if (!character) return;

        if (character.type === 'placeholder' && character.element) {
            character.element.style.transform = `scale(${scale})`;
        } else if (character.type === 'spine' && character.skeleton) {
            character.skeleton.scaleX = scale;
            character.skeleton.scaleY = scale;
        }

        log(LogLevel.DEBUG, 'position', `Scale set for ${name}: ${scale}`);
    }

    /**
     * アニメーション再生
     */
    playAnimation(name, animationName, loop = true) {
        if (!this.animationController) return;
        this.animationController.playAnimation(name, animationName, loop);
    }

    /**
     * クリックイベント処理（やられアニメーション対応）
     */
    handleCharacterClick(name) {
        log(LogLevel.DEBUG, 'animation', `Character ${name} clicked - playing yarare sequence`);
        
        // クリック時はやられ→待機のアニメーションシーケンスを再生
        this.animationController.playSequence(name, ['yarare', 'taiki']);
        
        log(LogLevel.INFO, 'animation', `Yarare animation sequence triggered for ${name}`);
    }

    /**
     * デバッグウィンドウ表示切り替え
     */
    toggleDebugWindow() {
        if (this.debugWindow) {
            this.debugWindow.toggle();
        } else {
            log(LogLevel.INFO, 'debug_ui', 'Debug window not available in production mode');
        }
    }

    /**
     * SkeletonBounds デバッグモード切り替え
     */
    toggleBoundsDebug() {
        if (window.spineSkeletonBounds) {
            const currentMode = window.spineSkeletonBounds.debugMode;
            window.spineSkeletonBounds.setDebugMode(!currentMode);
            log(LogLevel.INFO, 'bounds', `SkeletonBounds debug mode: ${!currentMode ? 'enabled' : 'disabled'}`);
            return !currentMode;
        } else {
            log(LogLevel.WARN, 'bounds', 'SkeletonBounds not available');
            return false;
        }
    }

    /**
     * 指定キャラクターの境界ボックス情報を表示
     */
    showBoundsInfo(characterName) {
        if (window.spineSkeletonBounds) {
            window.spineSkeletonBounds.debugInfo(characterName);
        } else {
            console.log('❌ SkeletonBounds not available');
        }
    }

    /**
     * パフォーマンス情報取得
     */
    getPerformanceInfo() {
        return {
            charactersLoaded: this.characterManager ? this.characterManager.characters.size : 0,
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
            } : null,
            debugLevel: DEBUG_CONFIG.level,
            isInitialized: this.initialized
        };
    }

    /**
     * 全体のクリーンアップ
     */
    cleanup() {
        log(LogLevel.INFO, 'initialization', 'Cleaning up Spine Integration...');

        if (this.debugWindow) {
            this.debugWindow.hide();
        }

        if (this.characterManager) {
            // 全キャラクターのクリーンアップ
            this.characterManager.characters.forEach((character, name) => {
                this.animationController.stopAllAnimations(name);
            });
        }

        this.initialized = false;
        log(LogLevel.INFO, 'initialization', 'Spine Integration cleanup completed');
    }
}

// =======================================
// グローバル初期化
// =======================================

// グローバルマネージャーインスタンス
window.spineManager = null;
window.spineDebug = null;

// DOM読み込み完了後の初期化
document.addEventListener('DOMContentLoaded', async function() {
    log(LogLevel.INFO, 'initialization', 'DOM loaded, starting Spine Integration initialization...');

    try {
        // メインマネージャー初期化
        window.spineManager = new SpineIntegrationManager();
        const initialized = await window.spineManager.init();

        if (initialized) {
            log(LogLevel.INFO, 'initialization', 'Spine Integration ready for use');
            
            // デバッグアクセス用のグローバル参照
            if (window.spineManager.debugWindow) {
                window.spineDebug = window.spineManager.debugWindow;
            }
            
            // SkeletonBounds グローバル関数設定
            window.toggleBoundsDebug = () => window.spineManager.toggleBoundsDebug();
            window.showBoundsInfo = (name) => window.spineManager.showBoundsInfo(name);
            window.updateAllBounds = () => {
                if (window.spineSkeletonBounds) {
                    window.spineSkeletonBounds.updateAllBounds();
                    log(LogLevel.INFO, 'bounds', 'All bounds updated');
                }
            };

            // パフォーマンス情報をコンソールに出力
            const perfInfo = window.spineManager.getPerformanceInfo();
            log(LogLevel.INFO, 'performance', 'System ready:', perfInfo);

        } else {
            log(LogLevel.WARN, 'initialization', 'Spine Integration initialized with limitations');
        }

    } catch (error) {
        log(LogLevel.ERROR, 'initialization', 'Critical error during initialization:', error);
    }
});

// ページアンロード時のクリーンアップ
window.addEventListener('beforeunload', function() {
    if (window.spineManager) {
        window.spineManager.cleanup();
    }
});

log(LogLevel.INFO, 'initialization', 'Spine Integration v2.0 module loaded');