/**
 * Spine 座標計算ユーティリティ
 * ビューポート、Canvas、HTML要素間の座標変換を管理
 */

class SpineCoordinateUtils {
    constructor() {
        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;
        this.canvasWidth = 600;  // 標準Canvasサイズ
        this.canvasHeight = 500;
        
        // リサイズイベントリスナー
        window.addEventListener('resize', () => {
            this.updateViewportSize();
        });
    }

    /**
     * ビューポートサイズ更新
     */
    updateViewportSize() {
        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;
        log(LogLevel.DEBUG, 'position', `Viewport updated: ${this.viewportWidth}x${this.viewportHeight}`);
    }

    /**
     * vw/vh単位からピクセル座標に変換
     * @param {number} vwValue - ビューポート幅の%値
     * @param {number} vhValue - ビューポート高さの%値
     * @returns {object} {x, y} ピクセル座標
     */
    vwvhToPixels(vwValue, vhValue) {
        const x = (vwValue / 100) * this.viewportWidth;
        const y = (vhValue / 100) * this.viewportHeight;
        
        log(LogLevel.DEBUG, 'position', `VW/VH conversion: ${vwValue}vw,${vhValue}vh → ${x}px,${y}px`);
        return { x, y };
    }

    /**
     * HTML data-*属性から座標を取得
     * @param {string} elementId - 設定要素のID
     * @returns {object} 座標設定オブジェクト
     */
    getConfigFromHTML(elementId) {
        const configElement = document.getElementById(elementId);
        if (!configElement) {
            log(LogLevel.WARN, 'position', `Config element ${elementId} not found`);
            return this.getDefaultConfig();
        }

        const config = {
            x: parseFloat(configElement.dataset.x) || 220,
            y: parseFloat(configElement.dataset.y) || 180,
            scale: parseFloat(configElement.dataset.scale) || 0.75,
            fadeDelay: parseInt(configElement.dataset.fadeDelay) || 1500,
            fadeDuration: parseInt(configElement.dataset.fadeDuration) || 2000
        };

        log(LogLevel.DEBUG, 'position', `Config loaded from HTML:`, config);
        return config;
    }

    /**
     * デフォルト設定値
     */
    getDefaultConfig() {
        return {
            x: 220,
            y: 180,
            scale: 0.75,
            fadeDelay: 1500,
            fadeDuration: 2000
        };
    }

    /**
     * Canvas内座標からビューポート座標に変換
     * @param {number} canvasX - Canvas内X座標
     * @param {number} canvasY - Canvas内Y座標
     * @param {object} canvasElement - Canvas要素
     * @returns {object} {x, y} ビューポート座標
     */
    canvasToViewport(canvasX, canvasY, canvasElement) {
        if (!canvasElement) {
            log(LogLevel.WARN, 'position', 'Canvas element not provided for coordinate conversion');
            return { x: canvasX, y: canvasY };
        }

        const rect = canvasElement.getBoundingClientRect();
        const scaleX = rect.width / this.canvasWidth;
        const scaleY = rect.height / this.canvasHeight;

        const viewportX = rect.left + (canvasX * scaleX);
        const viewportY = rect.top + (canvasY * scaleY);

        log(LogLevel.DEBUG, 'position', `Canvas to viewport: (${canvasX},${canvasY}) → (${viewportX},${viewportY})`);
        return { x: viewportX, y: viewportY };
    }

    /**
     * ビューポート座標からCanvas座標に変換
     * @param {number} viewportX - ビューポートX座標
     * @param {number} viewportY - ビューポートY座標
     * @param {object} canvasElement - Canvas要素
     * @returns {object} {x, y} Canvas座標
     */
    viewportToCanvas(viewportX, viewportY, canvasElement) {
        if (!canvasElement) {
            log(LogLevel.WARN, 'position', 'Canvas element not provided for coordinate conversion');
            return { x: viewportX, y: viewportY };
        }

        const rect = canvasElement.getBoundingClientRect();
        const scaleX = this.canvasWidth / rect.width;
        const scaleY = this.canvasHeight / rect.height;

        const canvasX = (viewportX - rect.left) * scaleX;
        const canvasY = (viewportY - rect.top) * scaleY;

        log(LogLevel.DEBUG, 'position', `Viewport to canvas: (${viewportX},${viewportY}) → (${canvasX},${canvasY})`);
        return { x: canvasX, y: canvasY };
    }

    /**
     * レスポンシブ座標計算
     * 画面サイズに応じた適切な座標を計算
     * @param {object} baseConfig - 基本設定
     * @returns {object} 調整された座標設定
     */
    calculateResponsivePosition(baseConfig) {
        const isMobile = this.viewportWidth <= 768;
        const isTablet = this.viewportWidth <= 1024 && this.viewportWidth > 768;

        let adjustedConfig = { ...baseConfig };

        if (isMobile) {
            // モバイル端末での調整
            adjustedConfig.scale *= 0.8;  // サイズを20%縮小
            adjustedConfig.x = Math.max(50, adjustedConfig.x * 0.7);  // 左寄りに調整
            adjustedConfig.y += 50;  // 少し下に移動
        } else if (isTablet) {
            // タブレット端末での調整
            adjustedConfig.scale *= 0.9;  // サイズを10%縮小
            adjustedConfig.x *= 0.85;  // 若干左寄りに
        }

        log(LogLevel.DEBUG, 'position', `Responsive adjustment applied:`, {
            original: baseConfig,
            adjusted: adjustedConfig,
            viewport: `${this.viewportWidth}x${this.viewportHeight}`,
            device: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
        });

        return adjustedConfig;
    }

    /**
     * 安全な配置座標計算
     * キャラクターが画面外に出ないよう制限
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} scale - スケール
     * @returns {object} {x, y} 安全な座標
     */
    constrainToViewport(x, y, scale = 1.0) {
        const characterWidth = 200 * scale;  // 推定キャラクター幅
        const characterHeight = 300 * scale; // 推定キャラクター高さ

        const minX = 0;
        const maxX = this.viewportWidth - characterWidth;
        const minY = 0;
        const maxY = this.viewportHeight - characterHeight;

        const constrainedX = Math.max(minX, Math.min(maxX, x));
        const constrainedY = Math.max(minY, Math.min(maxY, y));

        if (constrainedX !== x || constrainedY !== y) {
            log(LogLevel.DEBUG, 'position', `Position constrained: (${x},${y}) → (${constrainedX},${constrainedY})`);
        }

        return { x: constrainedX, y: constrainedY };
    }
}