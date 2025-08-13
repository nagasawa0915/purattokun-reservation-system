// 🎯 Spine Editor Desktop v2.0 - Core WebGL System
// 軽量Spine WebGL初期化・Canvas管理・基本レンダリングシステム
// 設計方針: 300行制限・シンプル・軽量・複雑化回避の完全実現

console.log('🚀 Spine Core v2.0 Module 読み込み');

/**
 * Spine WebGLコアシステムクラス
 * 責任範囲:
 * - WebGL初期化・フォールバック管理
 * - Canvas作成・サイズ管理・レスポンシブ対応
 * - 基本Spine WebGLレンダリング
 * - ライフサイクル管理（init/start/stop/cleanup）
 */
class SpineCore {
    constructor() {
        this.initialized = false;
        this.webglSupported = false;
        this.canvasElements = new Map(); // ID -> Canvas要素
        this.spineInstances = new Map(); // ID -> Spineインスタンス
        this.activeRenderLoops = new Set(); // 実行中のレンダーループ管理
        
        console.log('✅ SpineCore v2.0 初期化完了');
    }

    // ========== WebGL初期化システム ========== //

    /**
     * WebGL対応チェック
     * @returns {boolean} WebGL使用可能かどうか
     */
    checkWebGLSupport() {
        try {
            const testCanvas = document.createElement('canvas');
            const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
            const supported = !!gl;
            
            console.log(supported ? '✅ WebGL対応確認' : '❌ WebGL非対応');
            this.webglSupported = supported;
            return supported;
        } catch (error) {
            console.error('❌ WebGL対応チェックエラー:', error);
            this.webglSupported = false;
            return false;
        }
    }

    /**
     * システム初期化
     * @returns {boolean} 初期化成功かどうか
     */
    initialize() {
        if (this.initialized) {
            console.log('⚠️ SpineCore既に初期化済み');
            return true;
        }

        console.log('🚀 SpineCore v2.0 システム初期化開始');
        
        try {
            // WebGL対応チェック
            this.checkWebGLSupport();
            
            // 基本設定
            this.setupBasicConfiguration();
            
            this.initialized = true;
            console.log('✅ SpineCore v2.0 システム初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ SpineCore初期化エラー:', error);
            return false;
        }
    }

    /**
     * 基本設定セットアップ
     */
    setupBasicConfiguration() {
        // レスポンシブ対応
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
        
        // ページ終了時クリーンアップ
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
        
        console.log('✅ 基本設定完了');
    }

    // ========== Canvas管理システム ========== //

    /**
     * Spineキャンバス作成
     * @param {string} canvasId - キャンバスID
     * @param {Object} options - 作成オプション
     * @returns {HTMLCanvasElement|null} 作成されたCanvas要素
     */
    createSpineCanvas(canvasId, options = {}) {
        try {
            console.log('🎮 Spineキャンバス作成:', canvasId);
            
            // デフォルトオプション
            const config = {
                width: options.width || 400,
                height: options.height || 400,
                position: options.position || { x: 100, y: 100 },
                parent: options.parent || document.body,
                ...options
            };
            
            // Canvas要素作成
            const canvas = document.createElement('canvas');
            canvas.id = canvasId;
            canvas.className = 'spine-canvas-v2';
            canvas.width = config.width;
            canvas.height = config.height;
            
            // スタイル適用
            this.applyCanvasStyles(canvas, config);
            
            // 親要素に追加
            config.parent.appendChild(canvas);
            
            // 管理マップに登録
            this.canvasElements.set(canvasId, canvas);
            
            console.log('✅ Spineキャンバス作成完了:', canvasId);
            return canvas;
            
        } catch (error) {
            console.error('❌ Spineキャンバス作成エラー:', error);
            return null;
        }
    }

    /**
     * Canvasスタイル適用
     * @param {HTMLCanvasElement} canvas - Canvas要素
     * @param {Object} config - 設定オプション
     */
    applyCanvasStyles(canvas, config) {
        canvas.style.cssText = `
            position: absolute;
            left: ${config.position.x}px;
            top: ${config.position.y}px;
            width: ${Math.floor(config.width / 2)}px;
            height: ${Math.floor(config.height * 0.75)}px;
            cursor: move;
            z-index: 1000;
            border: 2px solid #00ff00;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 255, 0, 0.3);
            background: rgba(0, 0, 0, 0.8);
        `;
    }

    /**
     * Canvas WebGLコンテキスト初期化
     * @param {string} canvasId - キャンバスID
     * @returns {WebGLRenderingContext|null} WebGLコンテキスト
     */
    initializeWebGLContext(canvasId) {
        const canvas = this.canvasElements.get(canvasId);
        if (!canvas) {
            console.error('❌ Canvas要素が見つかりません:', canvasId);
            return null;
        }

        try {
            // WebGLコンテキスト取得（段階的フォールバック）
            const gl = canvas.getContext('webgl2', { alpha: true, antialias: true }) ||
                      canvas.getContext('webgl', { alpha: true, antialias: true }) ||
                      canvas.getContext('experimental-webgl', { alpha: true });

            if (!gl) {
                console.error('❌ WebGLコンテキスト取得失敗:', canvasId);
                return null;
            }

            // 基本WebGL設定
            this.setupWebGLContext(gl, canvas);
            
            console.log('✅ WebGLコンテキスト初期化完了:', canvasId);
            return gl;
            
        } catch (error) {
            console.error('❌ WebGL初期化エラー:', error);
            return null;
        }
    }

    /**
     * WebGLコンテキスト基本設定
     * @param {WebGLRenderingContext} gl - WebGLコンテキスト
     * @param {HTMLCanvasElement} canvas - Canvas要素
     */
    setupWebGLContext(gl, canvas) {
        // ビューポート設定
        gl.viewport(0, 0, canvas.width, canvas.height);
        
        // 背景色設定（透明）
        gl.clearColor(0, 0, 0, 0);
        
        // 深度テスト有効化
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        
        // ブレンド設定（透明度対応）
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // 初期クリア
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    /**
     * Canvasサイズ更新
     * @param {string} canvasId - キャンバスID
     * @param {number} width - 新しい幅
     * @param {number} height - 新しい高さ
     */
    resizeCanvas(canvasId, width, height) {
        const canvas = this.canvasElements.get(canvasId);
        if (!canvas) return;

        try {
            // Canvas内部サイズ更新
            canvas.width = width;
            canvas.height = height;
            
            // CSS表示サイズ更新
            canvas.style.width = `${Math.floor(width / 2)}px`;
            canvas.style.height = `${Math.floor(height * 0.75)}px`;
            
            // WebGLビューポート更新
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            if (gl) {
                gl.viewport(0, 0, width, height);
            }
            
            console.log('✅ Canvasサイズ更新:', canvasId, `${width}x${height}`);
            
        } catch (error) {
            console.error('❌ Canvasサイズ更新エラー:', error);
        }
    }

    // ========== 基本レンダリングシステム ========== //

    /**
     * 基本レンダリング開始
     * @param {string} canvasId - キャンバスID
     * @param {Object} renderOptions - レンダリングオプション
     * @returns {boolean} 開始成功かどうか
     */
    startBasicRender(canvasId, renderOptions = {}) {
        const canvas = this.canvasElements.get(canvasId);
        if (!canvas) {
            console.error('❌ Canvas要素が見つかりません:', canvasId);
            return false;
        }

        try {
            const gl = this.initializeWebGLContext(canvasId);
            
            if (gl) {
                // WebGLレンダリング
                this.startWebGLRender(canvasId, gl, renderOptions);
            } else {
                // 2Dフォールバック
                this.start2DFallback(canvasId, renderOptions);
            }
            
            console.log('✅ 基本レンダリング開始:', canvasId);
            return true;
            
        } catch (error) {
            console.error('❌ 基本レンダリング開始エラー:', error);
            return false;
        }
    }

    /**
     * WebGLレンダリング開始
     * @param {string} canvasId - キャンバスID
     * @param {WebGLRenderingContext} gl - WebGLコンテキスト
     * @param {Object} options - レンダリングオプション
     */
    startWebGLRender(canvasId, gl, options) {
        // WebGL成功表示
        this.drawWebGLSuccess(gl, canvasId);
        
        // デバッグ情報表示
        if (options.showDebugInfo !== false) {
            this.addDebugOverlay(canvasId);
        }
    }

    /**
     * WebGL成功表示描画
     * @param {WebGLRenderingContext} gl - WebGLコンテキスト
     * @param {string} canvasId - キャンバスID
     */
    drawWebGLSuccess(gl, canvasId) {
        // 緑色背景で成功表示
        gl.clearColor(0.0, 0.5, 0.0, 0.8);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    /**
     * 2Dフォールバック開始
     * @param {string} canvasId - キャンバスID
     * @param {Object} options - レンダリングオプション
     */
    start2DFallback(canvasId, options) {
        const canvas = this.canvasElements.get(canvasId);
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
            this.draw2DFallback(ctx, canvasId);
        }
    }

    /**
     * 2Dフォールバック描画
     * @param {CanvasRenderingContext2D} ctx - 2Dコンテキスト
     * @param {string} canvasId - キャンバスID
     */
    draw2DFallback(ctx, canvasId) {
        const canvas = ctx.canvas;
        
        // 背景グラデーション
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#4a90e2');
        gradient.addColorStop(1, '#357abd');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // テキスト描画
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎭', canvas.width / 2, canvas.height / 2 - 30);
        ctx.fillText(canvasId, canvas.width / 2, canvas.height / 2);
        ctx.font = '12px Arial';
        ctx.fillText('2D Mode', canvas.width / 2, canvas.height / 2 + 30);
    }

    /**
     * デバッグオーバーレイ追加
     * @param {string} canvasId - キャンバスID
     */
    addDebugOverlay(canvasId) {
        const canvas = this.canvasElements.get(canvasId);
        
        setTimeout(() => {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#00ff00';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('WebGL OK', canvas.width / 2, canvas.height / 2 - 20);
                ctx.fillText(canvasId, canvas.width / 2, canvas.height / 2 + 10);
                ctx.fillStyle = '#ffffff';
                ctx.font = '10px Arial';
                ctx.fillText('✅ Core v2.0', canvas.width / 2, canvas.height / 2 + 40);
            }
        }, 100);
    }

    // ========== ライフサイクル管理 ========== //

    /**
     * ウィンドウリサイズ処理
     */
    handleWindowResize() {
        console.log('🔄 ウィンドウリサイズ処理');
        
        // 全てのCanvasをリサイズ
        for (const [canvasId, canvas] of this.canvasElements) {
            // レスポンシブサイズ計算
            const newWidth = Math.min(400, window.innerWidth * 0.3);
            const newHeight = Math.min(400, window.innerHeight * 0.4);
            
            this.resizeCanvas(canvasId, newWidth, newHeight);
        }
    }

    /**
     * Canvas削除
     * @param {string} canvasId - キャンバスID
     */
    removeCanvas(canvasId) {
        const canvas = this.canvasElements.get(canvasId);
        if (canvas) {
            // DOM要素削除
            canvas.remove();
            
            // 管理マップから削除
            this.canvasElements.delete(canvasId);
            this.spineInstances.delete(canvasId);
            
            console.log('✅ Canvas削除完了:', canvasId);
        }
    }

    /**
     * 全Canvas削除
     */
    removeAllCanvases() {
        for (const canvasId of this.canvasElements.keys()) {
            this.removeCanvas(canvasId);
        }
        console.log('✅ 全Canvas削除完了');
    }

    /**
     * システムクリーンアップ
     */
    cleanup() {
        console.log('🧹 SpineCore v2.0 クリーンアップ開始');
        
        try {
            // 全てのレンダーループ停止
            this.activeRenderLoops.clear();
            
            // 全Canvas削除
            this.removeAllCanvases();
            
            // 状態リセット
            this.initialized = false;
            
            console.log('✅ SpineCore v2.0 クリーンアップ完了');
            
        } catch (error) {
            console.error('❌ クリーンアップエラー:', error);
        }
    }

    // ========== 状態管理・ユーティリティ ========== //

    /**
     * システム状態取得
     * @returns {Object} システム状態
     */
    getSystemStatus() {
        return {
            initialized: this.initialized,
            webglSupported: this.webglSupported,
            canvasCount: this.canvasElements.size,
            activeRenderLoops: this.activeRenderLoops.size,
            canvasIds: Array.from(this.canvasElements.keys())
        };
    }

    /**
     * デバッグ情報出力
     */
    debugSystemInfo() {
        console.log('🔍 === SpineCore v2.0 システム情報 ===');
        console.log('状態:', this.getSystemStatus());
        
        for (const [canvasId, canvas] of this.canvasElements) {
            console.log(`Canvas [${canvasId}]:`, {
                size: `${canvas.width}x${canvas.height}`,
                position: `${canvas.style.left}, ${canvas.style.top}`,
                webgl: !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
            });
        }
        
        console.log('🔍 === システム情報終了 ===');
    }
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpineCore;
}

// Global registration
window.SpineCore = SpineCore;

console.log('✅ Spine Core v2.0 Module 読み込み完了');