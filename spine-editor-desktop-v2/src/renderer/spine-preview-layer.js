/**
 * Spine Preview Layer Core - 統合制御・初期化・管理コアモジュール
 * Phase 2リファクタリング完成版: 4モジュール統合制御に特化（500行制限達成）
 * 
 * コア機能:
 * - 4モジュール統合初期化・ライフサイクル管理
 * - API委譲プロキシ・下位互換性維持
 * - 統合エラーハンドリング・デバッグ機能
 * - システム全体状態管理・監視
 */

import { Utils } from './utils.js';
import { SpinePreviewRender } from './spine-preview-render.js';
import { SpinePreviewContext } from './spine-preview-context.js';
import { SpinePreviewAssets } from './spine-preview-assets.js';

/**
 * Spine Preview Layer Core - 4モジュール統合制御コア（軽量版）
 * Phase 1成果保持: 85-90%点滅解決・WebGL安定性確立
 * Phase 2完成: モジュール分離・統合制御・AssetRegistry連携
 */
export class SpinePreviewLayer {
    constructor(container) {
        this.container = container;
        
        // 🚀 統合制御: システム状態管理
        this.isInitialized = false;
        this.characters = new Map();
        
        // 🚀 Phase 2: 4モジュール統合管理
        this.contextManager = new SpinePreviewContext(this);
        this.assetsManager = new SpinePreviewAssets(this);
        this.renderModule = null; // initialize()で設定
        
        // 🔧 下位互換性維持: レガシープロパティ（プロキシ経由）
        this._assetRegistry = null;
        this._assetReadyCache = new Set();
        this._textureAssets = new Map();
        
        console.log('🎯 Phase 2: SpinePreviewLayer統合制御コア初期化完了');
    }
    
    /**
     * 🚀 Phase 2: 4モジュール統合初期化システム（軽量版）
     */
    async initialize() {
        try {
            console.log('🔧 統合制御コア初期化開始');
            
            // 🚀 AssetRegistry統合（前処理）
            this.setupAssetRegistryIntegration();
            
            // 🚀 レンダリングモジュール作成・初期化
            this.renderModule = new SpinePreviewRender(this);
            await this.initializeModuleIntegration();
            
            // 🚀 重要: 初期化完了確認
            if (!this.renderModule || !this.canvas || !this.gl || !this.spine) {
                throw new Error('必須コンポーネントの初期化失敗');
            }
            
            // 🚀 初期化フラグ設定（確実な完了後に設定）
            this.isInitialized = true;
            this.syncCompatibilityProperties();
            
            console.log('✅ 4モジュール統合初期化完了 - isReadyForCharacters:', this.isReadyForCharacters());
            return true;
        } catch (error) {
            console.error('❌ 統合初期化失敗:', error);
            this.isInitialized = false;
            return false;
        }
    }
    
    /**
     * 🚀 モジュール間連携初期化（簡略版）
     */
    async initializeModuleIntegration() {
        await this.renderModule.createCanvas();
        await this.renderModule.initializeWebGL();
        await this.renderModule.initializeSpine();
        
        this.contextManager.linkToParentLayer(
            this.renderModule.canvas,
            this.renderModule.gl,
            this.renderModule.spine,
            this._assetRegistry
        );
        
        this.renderModule.startRenderLoop();
    }
    
    /**
     * 🚀 Phase 2: AssetRegistry連携確立・グローバル参照設定
     */
    setupAssetRegistryIntegration() {
        const connected = this.assetsManager.setupAssetRegistryIntegration();
        
        if (connected) {
            this._assetRegistry = this.assetsManager._assetRegistry;
            window.spinePreviewLayer = this;
            console.log('✅ AssetRegistry連携確立完了');
        } else {
            console.warn('⚠️ AssetRegistry未検出 - 基本機能で動作');
        }
    }
    
    /**
     * 🔧 下位互換性: レガシープロパティ同期
     */
    syncCompatibilityProperties() {
        if (this.assetsManager) {
            // アセット状態同期
            this._assetReadyCache.clear();
            this.assetsManager._assetReadyCache.forEach(id => {
                this._assetReadyCache.add(id);
            });
            
            // テクスチャ状態同期
            this._textureAssets.clear();
            this.assetsManager._textureAssets.forEach((value, key) => {
                this._textureAssets.set(key, value);
            });
        }
    }

    // 🚀 API委譲プロキシ: レンダリングモジュール経由
    createCanvas() { return this.renderModule.createCanvas(); }
    async initializeWebGL() { return await this.renderModule.initializeWebGL(); }
    async initializeSpine() { return await this.renderModule.initializeSpine(); }
    
    // 🚀 API委譲プロキシ: サイズ管理関連
    get canvas() { return this.renderModule?.canvas; }
    set canvas(value) { 
        if (this.renderModule) {
            this.renderModule.canvas = value;
        }
    }
    get gl() { return this.renderModule?.gl; }
    get spine() { return this.renderModule?.spine; }
    
    freezeCanvasSize() { return this.renderModule?.freezeCanvasSize?.(); }
    unfreezeCanvasSize() { return this.renderModule?.unfreezeCanvasSize?.(); }
    fallbackCanvasSize() { return this.renderModule?.fallbackCanvasSize?.(); }
    
    // 🚀 API委譲プロキシ: アセット管理関連
    async _reuploadAllTextures() { return await this.assetsManager._reuploadAllTextures(); }
    async recoverCharacterAsset(assetId, assetData) { return await this.assetsManager.recoverCharacterAsset(assetId, assetData); }
    convertToRelativePath(absolutePath) { return this.assetsManager.convertToRelativePath(absolutePath); }
    async waitForAssets(assetManager) { return await this.assetsManager.waitForAssets(assetManager); }
    async waitForAssetsSimple(assetManager) { return await this.assetsManager.waitForAssetsSimple(assetManager); }
    async addCharacter(characterData, x, y) { return await this.assetsManager.addCharacter(characterData, x, y); }
    removeCharacter(characterId) { return this.assetsManager.removeCharacter(characterId); }
    getAssetStatistics() { return this.assetsManager.getAssetStatistics(); }
    isAssetReady(characterId) { return this.assetsManager.isAssetReady(characterId); }
    
    // 🚀 API委譲プロキシ: Context管理関連
    isContextLost() { return this.contextManager?.isContextLost() || false; }
    
    // 🚀 API委譲プロキシ: Spine初期化関連
    async waitForSpine() { return await this.renderModule?.waitForSpine(); }
    
    /**
     * 🚀 統合制御: システム状態確認（Phase 3対応）
     */
    isReadyForCharacters() {
        // 🚀 基本初期化状態確認
        if (!this.isInitialized) {
            console.warn('⚠️ SpinePreviewLayer未初期化');
            return false;
        }
        
        // 🚀 必須コンポーネント確認
        if (!this.renderModule) {
            console.warn('⚠️ RenderModule未作成');
            return false;
        }
        
        // 🚀 Canvas・WebGL・Spine確認
        if (!this.canvas || !this.gl || !this.spine) {
            console.warn('⚠️ 基本コンポーネント不足:', {
                canvas: !!this.canvas,
                gl: !!this.gl,
                spine: !!this.spine
            });
            return false;
        }
        
        // 🚀 WebGLコンテキスト状態確認
        if (this.gl.isContextLost()) {
            console.warn('⚠️ WebGL Context Lost');
            return false;
        }
        
        console.log('✅ システム準備完了 - キャラクター追加可能');
        return true;
    }
    
    /**
     * 🚀 API委譲プロキシ: レンダリングループ管理
     */
    ensureRenderLoopStarted() {
        if (!this.isReadyForCharacters() || this.characters.size === 0) {
            console.warn('⚠️ レンダリング起動条件未達');
            return;
        }
        this.renderModule?.ensureRenderLoopStarted?.();
    }
    
    startRenderLoop() { this.renderModule?.startRenderLoop?.(); }
    stopRenderLoop() { this.renderModule?.stopRenderLoop?.(); }
    
    // 🚀 API委譲プロキシ: レンダリング処理関連
    renderAllCharacters(delta) { return this.renderModule?.renderAllCharacters?.(delta); }
    renderAllCharactersOptimized(delta) { return this.renderModule?.renderAllCharactersOptimized?.(delta); }
    
    /**
     * 🚀 Phase 2: リソース解放（AssetRegistry連携最適化版）
     */
    dispose() {
        console.log('🧹 Phase 2: AssetRegistry連携リソース解放開始');
        
        // レンダリング完全停止
        if (this.renderModule) {
            this.renderModule.stopRenderLoop();
        }
        
        // アセットモジュールクリーンアップ
        if (this.assetsManager) {
            this.assetsManager.dispose();
            this.assetsManager = null;
        }
        
        // 互換性維持 - AssetRegistry連携クリーンアップ
        if (this._assetReadyCache) {
            this._assetReadyCache.clear();
        }
        
        // キャラクターをクリア
        this.characters.clear();
        
        // テクスチャアセット記録クリア（フォールバック用・互換性維持）
        this._textureAssets.clear();
        
        // Context管理モジュールクリーンアップ
        if (this.contextManager) {
            this.contextManager.destroy();
            this.contextManager = null;
        }
        
        // グローバル参照クリア
        if (typeof window !== 'undefined' && window.spinePreviewLayer === this) {
            window.spinePreviewLayer = null;
        }
        
        // Canvasを削除
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        // 初期化状態リセット
        this.isInitialized = false;
        
        // AssetRegistry参照クリア
        this._assetRegistry = null;
        
        console.log('✅ Phase 2: AssetRegistry連携Spineプレビューレイヤー解放完了');
    }
    
    /**
     * 🔧 フリッカリング修正: Canvas表示状態デバッグ
     */
    debugCanvasVisibility() {
        if (!this.canvas) return;

        const computedStyle = window.getComputedStyle(this.canvas);
        console.log('🔍 Canvas表示状態デバッグ:', {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            zIndex: computedStyle.zIndex,
            position: computedStyle.position,
            width: computedStyle.width,
            height: computedStyle.height,
            isConnected: this.canvas.isConnected,
            parentElement: this.canvas.parentElement?.tagName,
            boundingClientRect: this.canvas.getBoundingClientRect()
        });

        // z-index競合チェック
        this.checkZIndexConflicts();
    }

    /**
     * 🔧 フリッカリング修正: z-index競合チェック
     */
    checkZIndexConflicts() {
        const allElements = document.querySelectorAll('*');
        const highZIndexElements = [];

        allElements.forEach(el => {
            const style = window.getComputedStyle(el);
            const zIndex = parseInt(style.zIndex);
            
            if (!isNaN(zIndex) && zIndex >= 40) {
                highZIndexElements.push({
                    element: el.tagName,
                    id: el.id,
                    className: el.className,
                    zIndex: zIndex,
                    position: style.position
                });
            }
        });

        if (highZIndexElements.length > 1) {
            console.warn('⚠️ z-index競合の可能性:', highZIndexElements);
        } else {
            console.log('✅ z-index競合なし');
        }
    }
}
