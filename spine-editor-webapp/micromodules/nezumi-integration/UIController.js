// このファイルは削除予定 - spine-integration/UIController.js に移行済み
 * ねずみ統合システム UI制御マイクロモジュール
 * 
 * 責務:
 * - DOM イベントリスナー初期化
 * - UI状態更新・表示制御
 * - ユーザーインタラクション処理
 * - デバッグUI制御
 * 
 * 設計方針:
 * - 既存機能100%保持
 * - LogSystemとの連携インターフェース
 * - 他システムとの疎結合
 */

class NezumiUIController {
    constructor(parent, logSystem) {
        this.parent = parent;  // NezumiStableSpineBBインスタンス
        this.logSystem = logSystem;
    }

    /**
     * UI初期化 - 全イベントリスナー設定
     * 既存のinitUI()メソッドの完全移植
     */
    initUI() {
        this.logSystem.log("🎨 UI初期化中...");

        // StableSpineRenderer制御
        this.addEventListenerSafe("init-renderer", "click", () => this.parent.initRenderer());
        this.addEventListenerSafe("load-nezumi", "click", () => this.parent.loadNezumi());
        this.addEventListenerSafe("play-search", "click", () => this.parent.playAnimation("taiki"));
        this.addEventListenerSafe("play-kettei", "click", () => this.parent.playAnimation("yarare"));

        // バウンディングボックス制御
        this.addEventListenerSafe("create-bbox", "click", () => this.parent.createBoundingBox());
        this.addEventListenerSafe("toggle-bbox", "click", () => this.parent.toggleBoundingBox());
        this.addEventListenerSafe("test-resize", "click", () => this.parent.testResize());
        this.addEventListenerSafe("cleanup-bbox", "click", () => this.parent.cleanupBoundingBox());

        // 統合テスト
        this.addEventListenerSafe("full-test", "click", () => this.parent.fullIntegrationTest());
        this.addEventListenerSafe("performance-test", "click", () => this.parent.performanceTest());
        this.addEventListenerSafe("reset-all", "click", () => this.parent.resetAll());

        // Canvas サイズ制御
        this.addEventListenerSafe("resize-canvas", "click", () => this.parent.resizeCanvas());
        this.addEventListenerSafe("reset-canvas", "click", () => this.parent.resetCanvasSize());

        // 自動最適化制御
        this.addEventListenerSafe("detect-bounds", "click", () => this.parent.calculateOptimalCanvasSize());
        this.addEventListenerSafe("apply-optimal", "click", () => this.parent.applyOptimalCanvasSize());

        // 手動テスト制御
        this.addEventListenerSafe("test-small", "click", () => this.parent.changeCanvasDisplaySize(300, 200));
        this.addEventListenerSafe("test-medium", "click", () => this.parent.changeCanvasDisplaySize(500, 400));
        this.addEventListenerSafe("test-large", "click", () => this.parent.changeCanvasDisplaySize(800, 600));

        // キャラクターサイズ保持テスト制御
        this.addEventListenerSafe("test-preserve-small", "click", () => 
            this.parent.testCanvasSizeWithCharacterPreservation(300, 200));
        this.addEventListenerSafe("test-preserve-medium", "click", () => 
            this.parent.testCanvasSizeWithCharacterPreservation(500, 400));
        this.addEventListenerSafe("test-preserve-large", "click", () => 
            this.parent.testCanvasSizeWithCharacterPreservation(800, 600));

        // スケール調整
        this.addEventListenerSafe("character-scale-x", "input", (e) => this.updateScaleDisplay('x', e.target.value));
        this.addEventListenerSafe("character-scale-y", "input", (e) => this.updateScaleDisplay('y', e.target.value));
        this.addEventListenerSafe("apply-scale", "click", () => this.parent.applyCharacterScale());
        this.addEventListenerSafe("reset-scale", "click", () => this.parent.resetCharacterScale());
        this.addEventListenerSafe("auto-ratio", "click", () => this.parent.detectNaturalRatio());

        // 位置調整
        this.addEventListenerSafe("character-x", "input", (e) => this.updatePositionDisplay('x', e.target.value));
        this.addEventListenerSafe("character-y", "input", (e) => this.updatePositionDisplay('y', e.target.value));
        this.addEventListenerSafe("apply-position", "click", () => this.parent.applyCharacterPosition());
        this.addEventListenerSafe("center-character", "click", () => this.parent.centerCharacter());
        this.addEventListenerSafe("reset-position", "click", () => this.parent.resetCharacterPosition());

        // デバッグ
        this.addEventListenerSafe("debug-info", "click", () => this.showDebugInfo());
        this.addEventListenerSafe("clear-log", "click", () => this.clearLog());

        this.logSystem.log("✅ UI初期化完了");
    }

    /**
     * 安全なイベントリスナー追加
     * 要素が存在しない場合のエラーハンドリング
     */
    addEventListenerSafe(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            this.logSystem.log(`⚠️ UI要素が見つかりません: ${elementId}`);
        }
    }

    /**
     * ステータス表示更新
     */
    updateStatus(elementId, status) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = status;
        }
    }

    /**
     * ローディング画面非表示
     */
    hideLoading() {
        const loadingScreen = document.getElementById("loading-screen");
        if (loadingScreen) {
            loadingScreen.style.display = "none";
        }
    }

    /**
     * スケール表示更新
     * 入力フィールドと表示フィールドの同期
     */
    updateScaleDisplay(axis, value) {
        const displayElement = document.getElementById(`scale-${axis}-value`);
        if (displayElement) {
            displayElement.textContent = value;
        }
    }

    /**
     * 位置表示更新
     * 入力フィールドと表示フィールドの同期
     */
    updatePositionDisplay(axis, value) {
        const displayElement = document.getElementById(`${axis}-value`);
        if (displayElement) {
            displayElement.textContent = value;
        }
    }

    /**
     * デバッグ情報表示
     */
    showDebugInfo() {
        if (!this.parent.spineRenderer) {
            this.logSystem.log("❌ SpineRendererが初期化されていません");
            return;
        }

        this.logSystem.log("🔍 === デバッグ情報 ===");
        
        // Canvas情報
        const canvas = this.parent.canvas;
        if (canvas) {
            this.logSystem.log(`📐 Canvas: ${canvas.width}x${canvas.height}`);
            this.logSystem.log(`🎨 CSS Style: ${canvas.style.width} x ${canvas.style.height}`);
        }

        // WebGL コンテキスト情報
        try {
            const gl = this.parent.spineRenderer.gl;
            if (gl) {
                this.logSystem.log(`🎮 WebGL Viewport: ${gl.getParameter(gl.VIEWPORT)}`);
                this.logSystem.log(`🔧 WebGL Version: ${gl.getParameter(gl.VERSION)}`);
            }
        } catch (error) {
            this.logSystem.log(`❌ WebGL情報取得エラー: ${error.message}`);
        }

        // キャラクター情報
        if (this.parent.nezumiLoaded && this.parent.spineRenderer.skeleton) {
            const skeleton = this.parent.spineRenderer.skeleton;
            this.logSystem.log(`🐭 Character Scale: ${skeleton.scaleX}, ${skeleton.scaleY}`);
            this.logSystem.log(`📍 Character Position: ${skeleton.x}, ${skeleton.y}`);
        }

        this.logSystem.log("🔍 === デバッグ情報終了 ===");
    }

    /**
     * ログクリア - LogSystem経由で統一処理
     */
    clearLog() {
        this.logSystem.clearLog();
    }
}

// グローバル公開
if (typeof window !== 'undefined') {
    window.NezumiUIController = NezumiUIController;
}

// CommonJS対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NezumiUIController;
}