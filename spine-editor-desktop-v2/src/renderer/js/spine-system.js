// 🎯 Spine Editor Desktop v2.0 - Integrated System
// 軽量Spine WebGLシステム統合 - 3モジュール統合メインシステム
// 設計方針: spine-core + spine-renderer + spine-utils の完全統合

console.log('🚀 Spine System v2.0 統合システム 読み込み');

/**
 * 軽量Spine WebGLシステム統合クラス
 * 3モジュール統合:
 * - SpineCore: WebGL初期化・Canvas管理・基本レンダリング
 * - SpineRenderer: キャラクター描画・Animation制御
 * - SpineUtils: Asset読み込み・エラーハンドリング
 */
class SpineSystem {
    constructor() {
        this.core = null;
        this.renderer = null;
        this.utils = null;
        this.initialized = false;
        
        console.log('✅ SpineSystem v2.0 統合システム初期化完了');
    }

    /**
     * システム初期化（3モジュール統合）
     * @returns {Promise<boolean>} 初期化成功かどうか
     */
    async initialize() {
        try {
            console.log('🚀 Spine v2.0 統合システム初期化開始');
            
            // 3モジュール初期化
            this.core = new SpineCore();
            this.utils = new SpineUtils();
            this.renderer = new SpineRenderer(this.core);
            
            // Core初期化
            if (!this.core.initialize()) {
                throw new Error('SpineCore初期化失敗');
            }
            
            this.initialized = true;
            console.log('✅ Spine v2.0 統合システム初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ 統合システム初期化エラー:', error);
            return false;
        }
    }

    /**
     * キャラクター配置（統合メソッド）
     * @param {string} characterId - キャラクターID
     * @param {string} basePath - Spineファイルベースパス
     * @param {string} characterName - キャラクター名
     * @param {Object} position - 配置位置 {x, y}
     * @param {HTMLElement} parent - 親要素
     * @returns {Promise<boolean>} 配置成功かどうか
     */
    async addCharacter(characterId, basePath, characterName, position, parent) {
        if (!this.initialized) {
            console.error('❌ システム未初期化');
            return false;
        }

        try {
            console.log('🎭 統合キャラクター配置開始:', characterId);
            
            // Asset読み込み（Utils）
            const assets = await this.utils.loadSpineAssets(basePath, characterName);
            
            // キャラクター描画（Renderer + Core連携）
            const success = this.renderer.renderSpineCharacter(
                characterId, 
                { name: characterName, assets: assets }, 
                position, 
                parent
            );
            
            if (success) {
                // アニメーション初期化（Renderer）
                this.renderer.initializeAnimation(characterId, {
                    idle: 'taiki',
                    click: 'yarare'
                });
                
                console.log('✅ 統合キャラクター配置完了:', characterId);
            }
            
            return success;
            
        } catch (error) {
            console.error('❌ 統合キャラクター配置エラー:', error);
            
            // エラー時はフォールバック表示
            return this.renderer.createFallbackDisplay(
                characterId,
                { name: characterName },
                position,
                parent
            );
        }
    }

    /**
     * システム状態取得
     * @returns {Object} 統合システム状態
     */
    getSystemStatus() {
        if (!this.initialized) {
            return { initialized: false };
        }

        return {
            initialized: this.initialized,
            core: this.core.getSystemStatus(),
            renderer: this.renderer.getSystemStatus(),
            utils: this.utils.debugSystemInfo()
        };
    }

    /**
     * システムクリーンアップ
     */
    cleanup() {
        console.log('🧹 Spine v2.0 統合システム クリーンアップ開始');
        
        if (this.renderer) {
            this.renderer.stopAllAnimations();
        }
        
        if (this.core) {
            this.core.cleanup();
        }
        
        if (this.utils) {
            this.utils.clearCache();
        }
        
        this.initialized = false;
        console.log('✅ Spine v2.0 統合システム クリーンアップ完了');
    }

    /**
     * デバッグ情報出力
     */
    debugSystemInfo() {
        console.log('🔍 === Spine v2.0 統合システム デバッグ情報 ===');
        
        if (this.initialized) {
            this.core.debugSystemInfo();
            this.renderer.debugSystemInfo();
            this.utils.debugSystemInfo();
        } else {
            console.log('❌ システム未初期化');
        }
        
        console.log('🔍 === デバッグ情報終了 ===');
    }
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpineSystem;
}

// Global registration
window.SpineSystem = SpineSystem;

console.log('✅ Spine System v2.0 統合システム 読み込み完了');