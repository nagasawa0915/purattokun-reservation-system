/**
 * Canvas配置システム v1.0
 * 
 * Canvas要素の配置をJSON設定で管理するモジュール化システム
 * 既存システムとの並行稼働対応、段階的移行を想定
 */

class CanvasPositioningSystem {
    constructor() {
        this.placements = new Map();
        this.config = null;
        this.debugMode = false;
        this.version = '1.0.0';
        
        // デバッグログ用
        this.log('🎯 Canvas配置システム v' + this.version + ' 初期化完了');
    }

    /**
     * JSON設定の読み込み
     * @param {Object|string} configData - 設定オブジェクトまたはJSONパス
     */
    async loadConfig(configData) {
        try {
            if (typeof configData === 'string') {
                // JSONファイルパスの場合
                const response = await fetch(configData);
                this.config = await response.json();
            } else {
                // オブジェクトの場合
                this.config = configData;
            }
            
            this.debugMode = this.config.global?.debugMode || false;
            this.log('✅ 配置設定読み込み完了:', this.config);
            
            return true;
        } catch (error) {
            console.error('❌ 配置設定読み込みエラー:', error);
            return false;
        }
    }

    /**
     * Canvas配置の実行
     * @param {HTMLCanvasElement} canvas - 配置するCanvas要素
     * @param {string} placementId - 配置設定ID
     */
    placeCanvas(canvas, placementId) {
        if (!this.config) {
            console.error('❌ 配置設定が未読み込み: loadConfig()を先に実行してください');
            return false;
        }

        const placement = this.config.placements[placementId];
        if (!placement) {
            console.error(`❌ 配置設定が見つかりません: ${placementId}`);
            return false;
        }

        this.log(`📍 Canvas配置実行: ${placementId}`);
        
        try {
            // DOM配置
            this._positionCanvas(canvas, placement);
            
            // スタイル適用
            this._applyStyles(canvas, placement);
            
            // レスポンシブ対応
            this._setupResponsive(canvas, placement);
            
            // 配置情報を記録
            this.placements.set(placementId, {
                canvas: canvas,
                placement: placement,
                applied: new Date()
            });
            
            this.log(`✅ Canvas配置完了: ${placementId}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Canvas配置エラー (${placementId}):`, error);
            return false;
        }
    }

    /**
     * Canvas要素のDOM配置
     */
    _positionCanvas(canvas, placement) {
        // コンテナの検索と配置
        const containerSelector = placement.container || 'body';
        const container = document.querySelector(containerSelector);
        
        if (!container) {
            throw new Error(`配置先コンテナが見つかりません: ${containerSelector}`);
        }

        // 既存の親から切り離し
        if (canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }

        // 新しいコンテナに配置
        container.appendChild(canvas);
        
        this.log(`📦 DOM配置: ${containerSelector} 内に配置完了`);
    }

    /**
     * CSSスタイルの適用
     */
    _applyStyles(canvas, placement) {
        const { positioning, styling } = placement;
        
        // 基本配置スタイル
        canvas.style.position = 'absolute';
        
        // 座標設定（デスクトップ）
        if (positioning.desktop) {
            canvas.style.left = positioning.desktop.left || '50%';
            canvas.style.top = positioning.desktop.top || '50%';
        }
        
        // 変形設定
        if (styling?.transform) {
            canvas.style.transform = styling.transform;
        } else {
            canvas.style.transform = 'translate(-50%, -50%)'; // デフォルト
        }
        
        // z-index設定
        if (styling?.zIndex) {
            canvas.style.zIndex = styling.zIndex;
        }
        
        // その他のスタイル
        if (styling?.additional) {
            Object.assign(canvas.style, styling.additional);
        }
        
        this.log('🎨 スタイル適用完了:', {
            left: canvas.style.left,
            top: canvas.style.top,
            transform: canvas.style.transform,
            zIndex: canvas.style.zIndex
        });
    }

    /**
     * レスポンシブ対応の設定（背景画像完全同期モード）
     */
    _setupResponsive(canvas, placement) {
        if (!placement.responsive || !placement.responsive.enabled) {
            this.log('📱 レスポンシブ機能無効：背景画像完全同期モード');
            return;
        }

        // レスポンシブが有効な場合の従来処理（現在は無効化済み）
        this.log('📱 レスポンシブ対応設定完了（背景画像同期優先）');
    }

    /**
     * アニメーション演出の適用（Phase 3で拡張予定）
     */
    _applyAnimations(canvas, placement) {
        if (!placement.animations) return;
        
        // Phase 3で実装予定
        this.log('🎬 アニメーション機能は Phase 3 で実装予定');
    }

    /**
     * 配置されたCanvasの情報取得
     */
    getPlacementInfo(placementId) {
        return this.placements.get(placementId);
    }

    /**
     * 全配置情報の取得
     */
    getAllPlacements() {
        return Array.from(this.placements.entries()).map(([id, info]) => ({
            id,
            ...info
        }));
    }

    /**
     * 配置の削除
     */
    removePlacement(placementId) {
        const placement = this.placements.get(placementId);
        if (placement && placement.canvas) {
            if (placement.canvas.parentNode) {
                placement.canvas.parentNode.removeChild(placement.canvas);
            }
            this.placements.delete(placementId);
            this.log(`🗑️ 配置削除完了: ${placementId}`);
            return true;
        }
        return false;
    }

    /**
     * デバッグ用位置調整機能
     */
    adjustPosition(placementId, newLeft, newTop) {
        const info = this.placements.get(placementId);
        if (!info) {
            console.error(`❌ 配置が見つかりません: ${placementId}`);
            return false;
        }

        info.canvas.style.left = newLeft;
        info.canvas.style.top = newTop;
        
        this.log(`🔧 位置調整: ${placementId} → (${newLeft}, ${newTop})`);
        console.log('💡 設定を保存するには placement-config.json を更新してください');
        
        return true;
    }

    /**
     * デバッグログ出力
     */
    log(message, data = null) {
        if (this.debugMode || window.location.hostname === 'localhost') {
            console.log(`[Canvas配置システム] ${message}`, data || '');
        }
    }

    /**
     * グローバル関数として調整機能を公開
     */
    exposeGlobalFunctions() {
        // 位置調整用グローバル関数
        window.adjustCanvasPosition = (placementId, left, top) => {
            return this.adjustPosition(placementId, left, top);
        };

        // 配置情報確認用グローバル関数  
        window.getCanvasPlacement = (placementId) => {
            return this.getPlacementInfo(placementId);
        };

        // 全配置情報確認用グローバル関数
        window.getAllCanvasPlacements = () => {
            return this.getAllPlacements();
        };

        this.log('🛠️ グローバル調整機能を公開:');
        this.log('  adjustCanvasPosition(id, left, top) - 位置調整');
        this.log('  getCanvasPlacement(id) - 配置情報確認');  
        this.log('  getAllCanvasPlacements() - 全配置情報確認');
    }
}

// モジュールとしてエクスポート（グローバルも併用）
window.CanvasPositioningSystem = CanvasPositioningSystem;

// デフォルトインスタンスをグローバルに公開
window.canvasPositioning = new CanvasPositioningSystem();