/**
 * PinRenderer.js
 * 
 * 🎯 効率的ピンシステム v2.0 - 表示制御層
 * - 責務: 座標数値を受け取って表示のみ
 * - 特徴: DOM操作最適化・アニメーション・視覚効果
 * - 設計: シンプルな座標値のみ受信・複雑な計算は一切しない
 */

class PinRenderer {
    constructor(options = {}) {
        console.log('🎯 PinRenderer 初期化開始');
        
        // 設定
        this.config = {
            zIndex: 10000,
            defaultSize: 12,
            defaultColor: '#ff4757',
            animationDuration: 300,
            showLabels: true,
            enableAnimation: true,
            ...options
        };
        
        // 状態管理
        this.activePins = new Map(); // Map<pinId, pinElement>
        this.container = null;
        this.isInitialized = false;
        
        // スタイル定義
        this.cssRules = {
            pinMarker: `
                position: fixed;
                width: var(--pin-size, ${this.config.defaultSize}px);
                height: var(--pin-size, ${this.config.defaultSize}px);
                background: var(--pin-color, ${this.config.defaultColor});
                border: 2px solid white;
                border-radius: 50%;
                z-index: var(--pin-z-index, ${this.config.zIndex});
                pointer-events: none;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                transform: translate(-50%, -50%);
                transition: all ${this.config.animationDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1);
            `,
            pinLabel: `
                position: absolute;
                top: -25px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-family: Arial, sans-serif;
                white-space: nowrap;
                user-select: none;
            `,
            pinContainer: `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: ${this.config.zIndex - 1};
            `,
            pinAnimation: `
                @keyframes pin-appear {
                    0% { 
                        opacity: 0; 
                        transform: translate(-50%, -50%) scale(0.5); 
                    }
                    70% { 
                        transform: translate(-50%, -50%) scale(1.1); 
                    }
                    100% { 
                        opacity: 1; 
                        transform: translate(-50%, -50%) scale(1); 
                    }
                }
                
                @keyframes pin-pulse {
                    0%, 100% { 
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    }
                    50% { 
                        box-shadow: 0 2px 16px rgba(255, 71, 87, 0.6);
                    }
                }
                
                .pin-marker-appear {
                    animation: pin-appear ${this.config.animationDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                
                .pin-marker-pulse {
                    animation: pin-pulse 2s infinite;
                }
            `
        };
        
        this.initialize();
        console.log('✅ PinRenderer 初期化完了');
    }
    
    /**
     * 🏗️ 初期化処理
     */
    initialize() {
        // コンテナ要素作成
        this.container = document.createElement('div');
        this.container.id = 'pin-renderer-container';
        this.container.style.cssText = this.cssRules.pinContainer;
        
        // CSSスタイル注入
        this.injectStyles();
        
        // コンテナをDOMに追加
        document.body.appendChild(this.container);
        
        this.isInitialized = true;
        console.log('🏗️ PinRenderer DOM初期化完了');
    }
    
    /**
     * 🎨 CSSスタイル注入
     */
    injectStyles() {
        const styleId = 'pin-renderer-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .pin-marker {
                ${this.cssRules.pinMarker}
            }
            
            .pin-label {
                ${this.cssRules.pinLabel}
            }
            
            ${this.cssRules.pinAnimation}
        `;
        
        document.head.appendChild(style);
        console.log('🎨 PinRenderer CSS注入完了');
    }
    
    /**
     * 🎯 メイン描画実行
     * @param {RenderRequest} request - 描画リクエスト
     */
    render(request) {
        if (!this.isInitialized) {
            console.warn('⚠️ PinRenderer未初期化');
            this.initialize();
        }
        
        try {
            const { pins, options = {} } = request;
            
            // 設定マージ
            const renderConfig = { ...this.config, ...options };
            
            // 既存ピンをクリア
            this.clearPins();
            
            // 新しいピンを描画
            pins.forEach(pin => {
                if (pin.isValid) {
                    this.renderSinglePin(pin, renderConfig);
                } else {
                    console.log(`⚠️ 無効なピンをスキップ: ${pin.anchorId} (画面外)`);
                }
            });
            
            console.log(`🎯 ピン描画完了: ${pins.filter(p => p.isValid).length}/${pins.length}個`);
            
        } catch (error) {
            console.error('❌ PinRenderer描画エラー:', error);
            throw error;
        }
    }
    
    /**
     * 📍 単一ピン描画
     */
    renderSinglePin(pin, config) {
        // ピン要素作成
        const pinElement = document.createElement('div');
        pinElement.className = 'pin-marker';
        pinElement.setAttribute('data-anchor', pin.anchorId);
        
        // CSS変数で設定適用
        pinElement.style.setProperty('--pin-size', `${config.defaultSize}px`);
        pinElement.style.setProperty('--pin-color', config.defaultColor);
        pinElement.style.setProperty('--pin-z-index', config.zIndex);
        
        // 位置設定
        pinElement.style.left = `${pin.x}px`;
        pinElement.style.top = `${pin.y}px`;
        
        // ラベル追加
        if (config.showLabels) {
            const label = document.createElement('div');
            label.className = 'pin-label';
            label.textContent = pin.anchorId;
            pinElement.appendChild(label);
        }
        
        // アニメーション適用
        if (config.enableAnimation) {
            pinElement.classList.add('pin-marker-appear');
            
            // 後でパルスアニメーション追加
            setTimeout(() => {
                if (pinElement.parentNode) {
                    pinElement.classList.add('pin-marker-pulse');
                }
            }, config.animationDuration);
        }
        
        // コンテナに追加
        this.container.appendChild(pinElement);
        
        // アクティブピンとして記録
        this.activePins.set(pin.anchorId, pinElement);
        
        console.log(`📍 ピン描画: ${pin.anchorId} @ (${pin.x}, ${pin.y})`);
    }
    
    /**
     * 🗑️ 全ピンクリア
     */
    clearPins() {
        // DOM要素削除
        this.activePins.forEach((element, anchorId) => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
        // マップクリア
        this.activePins.clear();
        
        console.log('🗑️ 全ピンクリア完了');
    }
    
    /**
     * 🎨 ピン更新（位置のみ変更）
     * @param {string} anchorId - アンカーID
     * @param {number} x - 新しいX座標
     * @param {number} y - 新しいY座標
     */
    updatePinPosition(anchorId, x, y) {
        const pinElement = this.activePins.get(anchorId);
        if (!pinElement) {
            console.warn(`⚠️ ピンが見つかりません: ${anchorId}`);
            return;
        }
        
        // アニメーション付きで位置更新
        pinElement.style.left = `${x}px`;
        pinElement.style.top = `${y}px`;
        
        console.log(`🎨 ピン位置更新: ${anchorId} → (${x}, ${y})`);
    }
    
    /**
     * 🎪 ピンハイライト
     * @param {string} anchorId - ハイライトするアンカーID
     * @param {boolean} highlight - ハイライト状態
     */
    highlightPin(anchorId, highlight = true) {
        const pinElement = this.activePins.get(anchorId);
        if (!pinElement) {
            console.warn(`⚠️ ピンが見つかりません: ${anchorId}`);
            return;
        }
        
        if (highlight) {
            pinElement.style.setProperty('--pin-color', '#ffa502');
            pinElement.style.setProperty('--pin-size', `${this.config.defaultSize * 1.2}px`);
            pinElement.classList.add('pin-marker-pulse');
        } else {
            pinElement.style.setProperty('--pin-color', this.config.defaultColor);
            pinElement.style.setProperty('--pin-size', `${this.config.defaultSize}px`);
            pinElement.classList.remove('pin-marker-pulse');
        }
        
        console.log(`🎪 ピンハイライト: ${anchorId} = ${highlight}`);
    }
    
    /**
     * 👁️ ピン表示/非表示切り替え
     * @param {boolean} visible - 表示状態
     */
    setVisible(visible = true) {
        if (!this.container) return;
        
        this.container.style.display = visible ? 'block' : 'none';
        console.log(`👁️ ピン表示切り替え: ${visible ? '表示' : '非表示'}`);
    }
    
    /**
     * 🎨 テーマ変更
     * @param {object} theme - テーマ設定
     */
    applyTheme(theme) {
        const validProperties = ['defaultColor', 'defaultSize', 'zIndex'];
        
        validProperties.forEach(prop => {
            if (theme[prop] !== undefined) {
                this.config[prop] = theme[prop];
            }
        });
        
        // 既存ピンにテーマ適用
        this.activePins.forEach((element, anchorId) => {
            element.style.setProperty('--pin-color', this.config.defaultColor);
            element.style.setProperty('--pin-size', `${this.config.defaultSize}px`);
            element.style.setProperty('--pin-z-index', this.config.zIndex);
        });
        
        console.log('🎨 PinRendererテーマ適用:', theme);
    }
    
    /**
     * 🎯 特定ピンのスタイル変更
     * @param {string} anchorId - アンカーID
     * @param {object} style - スタイル設定
     */
    setPinStyle(anchorId, style) {
        const pinElement = this.activePins.get(anchorId);
        if (!pinElement) {
            console.warn(`⚠️ ピンが見つかりません: ${anchorId}`);
            return;
        }
        
        // サポートされているスタイルプロパティのみ適用
        if (style.color) {
            pinElement.style.setProperty('--pin-color', style.color);
        }
        
        if (style.size) {
            pinElement.style.setProperty('--pin-size', `${style.size}px`);
        }
        
        if (style.opacity !== undefined) {
            pinElement.style.opacity = style.opacity;
        }
        
        console.log(`🎯 ピンスタイル変更: ${anchorId}`, style);
    }
    
    /**
     * 📊 現在の状態取得
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            activePinCount: this.activePins.size,
            activePinIds: Array.from(this.activePins.keys()),
            config: { ...this.config },
            visible: this.container ? this.container.style.display !== 'none' : false
        };
    }
    
    /**
     * 🔧 設定更新
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔧 PinRenderer設定更新:', this.config);
    }
    
    /**
     * 🧹 リソースクリーンアップ
     */
    destroy() {
        // 全ピンクリア
        this.clearPins();
        
        // コンテナ削除
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        // スタイル削除
        const style = document.getElementById('pin-renderer-styles');
        if (style) {
            style.parentNode.removeChild(style);
        }
        
        // 状態リセット
        this.container = null;
        this.isInitialized = false;
        this.activePins.clear();
        
        console.log('🧹 PinRenderer完全クリーンアップ完了');
    }
    
    /**
     * 🎪 デモ表示（デバッグ用）
     * @param {HTMLElement} element - 対象要素
     */
    showDemo(element) {
        const rect = element.getBoundingClientRect();
        
        // 9アンカーポイントのデモピン
        const demoAnchors = [
            { id: 'TL', ratioX: 0, ratioY: 0 },
            { id: 'TC', ratioX: 0.5, ratioY: 0 },
            { id: 'TR', ratioX: 1, ratioY: 0 },
            { id: 'ML', ratioX: 0, ratioY: 0.5 },
            { id: 'MC', ratioX: 0.5, ratioY: 0.5 },
            { id: 'MR', ratioX: 1, ratioY: 0.5 },
            { id: 'BL', ratioX: 0, ratioY: 1 },
            { id: 'BC', ratioX: 0.5, ratioY: 1 },
            { id: 'BR', ratioX: 1, ratioY: 1 }
        ];
        
        const demoPins = demoAnchors.map(anchor => ({
            anchorId: anchor.id,
            x: rect.left + (rect.width * anchor.ratioX),
            y: rect.top + (rect.height * anchor.ratioY),
            isValid: true
        }));
        
        this.render({
            pins: demoPins,
            options: {
                defaultColor: '#2ed573',
                showLabels: true,
                enableAnimation: true
            }
        });
        
        console.log('🎪 PinRendererデモ表示完了');
    }
}

// グローバル公開
if (typeof window !== 'undefined') {
    window.PinRenderer = PinRenderer;
    console.log('✅ PinRenderer グローバル公開完了');
}

// AMD/CommonJS対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PinRenderer;
}