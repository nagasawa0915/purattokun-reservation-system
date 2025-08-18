/**
 * 🚀 Spine Preview Context Manager
 * WebGL Context管理・復旧・イベントハンドリング独立モジュール
 * 
 * Phase 2技術基盤:
 * - Context Lost/Restored完全対応
 * - AssetRegistry統合復旧
 * - WebGL安定性保証システム
 * 
 * 分離方針:
 * - Context管理の完全独立化
 * - WebGL復旧処理の集約
 * - エラーハンドリング強化
 * - 初期化完了待機システム
 */

export class SpinePreviewContext {
    constructor(parentLayer) {
        this.parentLayer = parentLayer;
        this._lost = false;
        
        // 親レイヤーからのリファレンス確立
        this.canvas = null;
        this.gl = null;
        this.spine = null;
        this._assetRegistry = null;
        
        console.log('🔧 SpinePreviewContext初期化完了');
    }
    
    /**
     * 🔗 親レイヤーとの接続確立
     */
    linkToParentLayer(canvas, gl, spine, assetRegistry) {
        this.canvas = canvas;
        this.gl = gl;
        this.spine = spine;
        this._assetRegistry = assetRegistry;
        
        // Context Eventバインド実行
        this.setupContextHandlers();
        
        console.log('🔗 SpinePreviewContext リンク確立完了');
    }
    
    /**
     * 🚀 Phase 1: WebGL Context Lost/Restored イベントハンドリング
     */
    setupContextHandlers() {
        if (!this.canvas) {
            console.warn('⚠️ Canvas要素が見つからないため、Context Eventをバインドできません');
            return;
        }

        console.log('🔗 WebGL Context Lost/Restored イベントをバインド中...');

        // Context Lost イベント
        this.canvas.addEventListener('webglcontextlost', (e) => {
            console.warn('⚠️ WebGL Context Lost 検出');
            e.preventDefault();
            this._lost = true;
            
            // 🚀 Phase 2: レンダリングモジュール経由で安全停止
            if (this.parentLayer.renderModule) {
                this.parentLayer.renderModule.stopRenderLoop();
            } else {
                // フォールバック: 従来方式
                this.parentLayer._running = false;
                if (this.parentLayer._rafId) {
                    cancelAnimationFrame(this.parentLayer._rafId);
                    this.parentLayer._rafId = 0;
                }
            }
        }, false);

        // Context Restored イベント
        this.canvas.addEventListener('webglcontextrestored', async () => {
            console.log('🔄 WebGL Context Restored 検出 - Phase 2復旧開始');
            
            try {
                // 🚀 Phase 2: レンダリングモジュール経由でレンダラー復旧
                if (this.parentLayer.renderModule) {
                    await this.parentLayer.renderModule.recoverRenderer();
                } else {
                    // フォールバック: 従来の復旧方式
                    await this.initRenderer(true);
                }
                
                // 🚀 Phase 2: AssetRegistry統合復旧
                if (this._assetRegistry && this._assetRegistry.performContextRecovery) {
                    console.log('🔄 AssetRegistry統合復旧実行中...');
                    await this._assetRegistry.performContextRecovery(this.gl);
                } else {
                    // Phase 1フォールバック: 従来の復旧方式
                    console.log('🔄 Phase 1フォールバック復旧実行中...');
                    await this.parentLayer._reuploadAllTextures();
                }
                
                // Context Lost フラグを解除
                this._lost = false;
                
                // 🚀 Phase 2: レンダリングモジュール経由でrAFループ再開
                if (this.parentLayer.renderModule && !this.parentLayer.renderModule._running) {
                    this.parentLayer.renderModule.startRenderLoop();
                } else if (!this.parentLayer._running) {
                    // フォールバック: 従来方式
                    this.parentLayer.startRenderLoop();
                }
                
                console.log('✅ Phase 2: WebGL Context 復旧完了');
            } catch (error) {
                console.error('❌ Phase 2: WebGL Context 復旧失敗:', error);
            }
        }, false);

        console.log('✅ WebGL Context イベントバインド完了');
    }
    
    /**
     * 🚀 Phase 1: レンダラー初期化（復旧対応）
     */
    async initRenderer(isRestore = false) {
        if (isRestore) {
            console.log('🔄 レンダラー復旧初期化中...');
            
            // WebGLコンテキスト再取得
            const contextOptions = {
                preserveDrawingBuffer: true,
                alpha: true,
                antialias: true,
                premultipliedAlpha: true
            };
            
            this.gl = this.canvas.getContext('webgl', contextOptions) || 
                      this.canvas.getContext('experimental-webgl', contextOptions);
            
            if (!this.gl) {
                throw new Error('WebGL context restoration failed');
            }
            
            // 親レイヤーのgl参照更新
            this.parentLayer.gl = this.gl;
            
            // WebGL状態を再設定
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
            
            // Spine レンダラー再作成
            if (typeof spine !== 'undefined' && spine.SceneRenderer) {
                this.spine.renderer = new spine.SceneRenderer(this.canvas, this.gl);
                this.parentLayer.spine = this.spine; // 親レイヤー参照更新
                console.log('✅ Spine レンダラー復旧完了');
            }
        }
    }
    
    /**
     * 🔧 フリッカリング根本修正: キャラクター完全初期化待機
     * レンダリング開始前に全ての初期化処理の完了を確認
     */
    async waitForCompleteInitialization(characterName) {
        return new Promise((resolve) => {
            let checkCount = 0;
            const maxChecks = 10; // 1秒待機
            
            const checkInitialization = () => {
                checkCount++;
                console.log(`🔄 ${characterName} 初期化完了確認 ${checkCount}/${maxChecks}`);
                
                const character = this.parentLayer.characters.get(characterName);
                
                // キャラクター登録確認
                if (!character) {
                    console.log(`⏳ ${characterName} キャラクター登録待機中...`);
                    if (checkCount < maxChecks) {
                        setTimeout(checkInitialization, 100);
                        return;
                    }
                }
                
                // スケルトン・アニメーション状態確認
                const isSkeletonReady = character && 
                                      character.skeleton && 
                                      character.skeleton.data && 
                                      character.animationState;
                
                if (!isSkeletonReady) {
                    console.log(`⏳ ${characterName} スケルトン初期化待機中...`);
                    if (checkCount < maxChecks) {
                        setTimeout(checkInitialization, 100);
                        return;
                    }
                }
                
                // 描画可能状態確認
                const isRenderReady = this.spine && 
                                     this.spine.renderer && 
                                     this.gl && 
                                     !this.gl.isContextLost();
                
                if (!isRenderReady) {
                    console.log(`⏳ ${characterName} レンダリング環境待機中...`);
                    if (checkCount < maxChecks) {
                        setTimeout(checkInitialization, 100);
                        return;
                    }
                }
                
                console.log(`✅ ${characterName} 完全初期化確認完了`);
                console.log('  - キャラクター登録:', !!character);
                console.log('  - スケルトン準備:', !!isSkeletonReady);
                console.log('  - レンダリング準備:', !!isRenderReady);
                
                resolve();
            };
            
            // 少し待ってから確認開始（同期的な処理完了を待機）
            setTimeout(checkInitialization, 50);
        });
    }
    
    /**
     * Context状態確認
     */
    isContextLost() {
        return this._lost || (this.gl && this.gl.isContextLost());
    }
    
    /**
     * WebGL環境確認
     */
    isWebGLReady() {
        return this.gl && 
               !this.gl.isContextLost() && 
               this.spine && 
               this.spine.renderer;
    }
    
    /**
     * 🧹 クリーンアップ
     */
    destroy() {
        // イベントリスナー除去は自動的に実行されるが、参照をクリア
        this.canvas = null;
        this.gl = null;
        this.spine = null;
        this._assetRegistry = null;
        this.parentLayer = null;
        
        console.log('🧹 SpinePreviewContext クリーンアップ完了');
    }
}