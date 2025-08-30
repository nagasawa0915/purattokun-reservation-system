/**
 * ResponsiveSpineFitIntegration.js
 * 
 * 🎯 背景画像完全フィット・レスポンシブシステム統合モジュール
 * - 既存のPureBoundingBoxUIに統合するアドオンモジュール
 * - ElementObserver Phase 3-B との完全統合
 * - 背景要素自動検出・レスポンシブ追従機能
 */

class ResponsiveSpineFitIntegration {
    constructor(pureBoundingBoxUI) {
        this.ui = pureBoundingBoxUI;
        this.core = pureBoundingBoxUI.core;
        
        // レスポンシブシステム設定
        this.isEnabled = false;
        this.backgroundElement = null;
        this.targetRegionConfig = null;
        this.observers = new Map();
        
        // パフォーマンス制御
        this.throttleDelay = 16; // 60fps制限
        this.lastUpdateTime = 0;
        
        // 基準メトリクス
        this.baseMetrics = {
            bgWidth: 0,
            bgHeight: 0,
            spineWidth: 0,
            spineHeight: 0,
            regionConfig: null
        };
        
        console.log('🎯 ResponsiveSpineFitIntegration初期化開始');
        this.init();
    }
    
    /**
     * システム初期化
     */
    init() {
        // 背景要素自動検出
        this.detectBackgroundElement();
        
        // 既存UIへのレスポンシブ制御追加
        this.enhanceExistingUI();
        
        // ElementObserver統合確認
        this.setupElementObserverIntegration();
        
        console.log('✅ ResponsiveSpineFitIntegration初期化完了');
    }
    
    /**
     * 背景要素自動検出
     */
    detectBackgroundElement() {
        console.log('🔍 背景要素自動検出開始');
        
        // 候補要素の優先順位リスト
        const backgroundSelectors = [
            // 具体的な背景要素セレクター
            '.background-area',
            '.hero-background', 
            '.main-background',
            '#background',
            
            // 一般的な背景要素パターン
            '[style*="background-image"]',
            '.bg-image',
            '.background',
            
            // コンテナ要素（フォールバック）
            '.hero-content',
            '.main-container',
            'main',
            'body'
        ];
        
        for (const selector of backgroundSelectors) {
            try {
                const element = document.querySelector(selector);
                if (element) {
                    // 背景画像があるかチェック
                    const computedStyle = window.getComputedStyle(element);
                    const hasBackgroundImage = computedStyle.backgroundImage && 
                                             computedStyle.backgroundImage !== 'none';
                    
                    if (hasBackgroundImage || selector === 'body') {
                        this.backgroundElement = element;
                        console.log(`✅ 背景要素検出成功: ${selector}`, {
                            element: element,
                            hasBackgroundImage: hasBackgroundImage,
                            size: `${element.offsetWidth}×${element.offsetHeight}`
                        });
                        break;
                    }
                }
            } catch (error) {
                console.warn(`⚠️ セレクター検索失敗: ${selector}`, error.message);
            }
        }
        
        if (!this.backgroundElement) {
            console.warn('⚠️ 背景要素が検出できませんでした');
            return;
        }
        
        // 背景領域設定の自動生成
        this.generateRegionConfig();
    }
    
    /**
     * 背景領域設定の自動生成
     */
    generateRegionConfig() {
        if (!this.backgroundElement) return;
        
        // 背景要素のサイズ取得
        const rect = this.backgroundElement.getBoundingClientRect();
        
        // デフォルト領域設定（背景の中央20%×30%エリア）
        this.targetRegionConfig = {
            'center-auto': {
                x: 40, // 中央 - 10% = 40%位置から
                y: 35, // 中央 - 15% = 35%位置から  
                width: 20, // 幅20%
                height: 30, // 高さ30%
                fitMode: 'contain'
            },
            'shop-front': {
                x: 15,
                y: 35,
                width: 20,
                height: 30,
                fitMode: 'contain'
            },
            'road-area': {
                x: 65,
                y: 35,
                width: 15,
                height: 25,
                fitMode: 'contain'
            }
        };
        
        console.log('🎯 背景領域設定自動生成完了', {
            backgroundSize: `${rect.width}×${rect.height}`,
            regions: Object.keys(this.targetRegionConfig)
        });
    }
    
    /**
     * 既存UIへのレスポンシブ制御追加
     */
    enhanceExistingUI() {
        // 既存の保存処理をオーバーライド
        const originalHandleSave = this.ui.handleSave.bind(this.ui);
        this.ui.handleSave = async () => {
            console.log('🎯 レスポンシブ統合版保存処理開始');
            
            // レスポンシブ設定を保存データに追加
            const responsiveData = this.generateResponsiveData();
            
            // オリジナルの保存処理実行
            await originalHandleSave();
            
            // レスポンシブ機能が有効な場合は追加設定
            if (this.isEnabled && responsiveData) {
                this.saveResponsiveSettings(responsiveData);
                this.startResponsiveTracking();
            }
            
            console.log('✅ レスポンシブ統合版保存処理完了');
        };
        
        // 右クリックメニューにレスポンシブ制御追加
        this.addResponsiveMenuItems();
    }
    
    /**
     * レスポンシブメニュー項目追加
     */
    addResponsiveMenuItems() {
        // 既存のcontextMenu作成をフック
        const originalCreateContextMenu = this.ui.createContextMenu.bind(this.ui);
        this.ui.createContextMenu = () => {
            const menu = originalCreateContextMenu();
            
            // レスポンシブ制御項目を追加
            const responsiveItem = document.createElement('div');
            responsiveItem.className = 'bb-menu-item';
            responsiveItem.style.cssText = `
                padding: 8px 16px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: background-color 0.15s ease;
                user-select: none;
                border-top: 1px solid #eee;
                margin-top: 4px;
            `;
            
            const isEnabled = this.isEnabled;
            responsiveItem.innerHTML = `
                <div>
                    <div style="font-weight: 500;">${isEnabled ? '📱 レスポンシブ OFF' : '📱 レスポンシブ ON'}</div>
                    <div style="font-size: 11px; color: #666; margin-top: 2px;">${isEnabled ? '固定位置に切り替え' : '背景追従を有効化'}</div>
                </div>
                <span style="color: ${isEnabled ? '#28a745' : '#6c757d'}; font-size: 11px;">${isEnabled ? 'ON' : 'OFF'}</span>
            `;
            
            // ホバーエフェクト
            responsiveItem.addEventListener('mouseenter', () => {
                responsiveItem.style.background = '#f8f9fa';
            });
            
            responsiveItem.addEventListener('mouseleave', () => {
                responsiveItem.style.background = 'transparent';
            });
            
            // クリックイベント
            responsiveItem.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleResponsiveMode();
                this.ui.hideContextMenu();
            });
            
            menu.appendChild(responsiveItem);
            return menu;
        };
    }
    
    /**
     * ElementObserver統合設定
     */
    setupElementObserverIntegration() {
        // ElementObserver Phase 3-B 確認
        if (!window.ElementObserverAdvanced) {
            console.warn('⚠️ ElementObserverAdvanced未検出 - 基本レスポンシブ機能のみ');
            return;
        }
        
        console.log('✅ ElementObserver Phase 3-B統合準備完了');
    }
    
    /**
     * レスポンシブモード切り替え
     */
    toggleResponsiveMode() {
        this.isEnabled = !this.isEnabled;
        
        if (this.isEnabled) {
            this.startResponsiveTracking();
            this.ui.showNotification('📱 レスポンシブ追従を有効にしました', 'success');
            console.log('🚀 レスポンシブモード開始');
        } else {
            this.stopResponsiveTracking();
            this.ui.showNotification('📌 固定位置モードに切り替えました', 'info');
            console.log('⏸️ レスポンシブモード停止');
        }
    }
    
    /**
     * レスポンシブ追従開始
     */
    startResponsiveTracking() {
        if (!this.backgroundElement) {
            console.warn('⚠️ 背景要素が見つかりません');
            return;
        }
        
        // ResizeObserverで背景要素監視
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                this.throttledResponsiveUpdate(entry);
            }
        });
        
        resizeObserver.observe(this.backgroundElement);
        this.observers.set('background', resizeObserver);
        
        // ウィンドウリサイズも監視
        const windowResizeHandler = () => {
            this.throttledResponsiveUpdate();
        };
        window.addEventListener('resize', windowResizeHandler);
        this.observers.set('window', windowResizeHandler);
        
        // 初期計算実行
        this.calculateBaseMetrics();
        this.updateResponsivePosition();
        
        console.log('📊 レスポンシブ追従開始完了');
    }
    
    /**
     * レスポンシブ追従停止
     */
    stopResponsiveTracking() {
        // 全Observer停止
        this.observers.forEach((observer, key) => {
            if (key === 'background' && observer.disconnect) {
                observer.disconnect();
            } else if (key === 'window') {
                window.removeEventListener('resize', observer);
            }
        });
        this.observers.clear();
        
        console.log('⏹️ レスポンシブ追従停止完了');
    }
    
    /**
     * スロットル制御付きレスポンシブ更新
     */
    throttledResponsiveUpdate(entry = null) {
        const now = Date.now();
        if (now - this.lastUpdateTime < this.throttleDelay) {
            return; // スロットル制限
        }
        
        this.lastUpdateTime = now;
        this.updateResponsivePosition(entry);
    }
    
    /**
     * 基準メトリクス計算
     */
    calculateBaseMetrics() {
        if (!this.backgroundElement || !this.core.config.targetElement) return;
        
        const bgRect = this.backgroundElement.getBoundingClientRect();
        const targetRect = this.core.config.targetElement.getBoundingClientRect();
        
        this.baseMetrics = {
            bgWidth: bgRect.width,
            bgHeight: bgRect.height,
            spineWidth: targetRect.width,
            spineHeight: targetRect.height,
            regionConfig: this.targetRegionConfig['center-auto'] // デフォルト地域
        };
        
        console.log('📏 基準メトリクス計算完了', this.baseMetrics);
    }
    
    /**
     * レスポンシブ位置更新
     */
    updateResponsivePosition(entry = null) {
        if (!this.isEnabled || !this.backgroundElement || !this.core.config.targetElement) return;
        
        const bgRect = this.backgroundElement.getBoundingClientRect();
        const region = this.baseMetrics.regionConfig;
        
        if (!region) return;
        
        // 背景内の◯領域計算
        const regionData = {
            x: bgRect.width * (region.x / 100),
            y: bgRect.height * (region.y / 100),
            width: bgRect.width * (region.width / 100),
            height: bgRect.height * (region.height / 100)
        };
        
        // フィット縮尺計算
        const scaleX = regionData.width / this.baseMetrics.spineWidth;
        const scaleY = regionData.height / this.baseMetrics.spineHeight;
        let fitScale = Math.min(scaleX, scaleY);
        
        // フィットモード適用
        if (region.fitMode === 'cover') {
            fitScale = Math.max(scaleX, scaleY);
        } else if (region.fitMode === 'exact') {
            fitScale = 1.0;
        }
        
        // 中央配置位置計算
        const centerX = bgRect.left + regionData.x + (regionData.width / 2);
        const centerY = bgRect.top + regionData.y + (regionData.height / 2);
        
        // ElementObserver Phase 3-B統合適用
        if (window.ElementObserverAdvanced && this.ui.autoPin?.observer) {
            try {
                // 統合API使用
                this.ui.autoPin.observer.setUnifiedPosition(
                    centerX,
                    centerY,
                    fitScale,
                    0 // rotation
                );
                
                console.log('🎯 ElementObserver統合レスポンシブ更新:', {
                    position: `(${Math.round(centerX)}, ${Math.round(centerY)})`,
                    scale: fitScale.toFixed(3),
                    bgSize: `${Math.round(bgRect.width)}×${Math.round(bgRect.height)}`,
                    regionSize: `${Math.round(regionData.width)}×${Math.round(regionData.height)}`
                });
                
            } catch (error) {
                console.warn('⚠️ ElementObserver統合更新失敗:', error.message);
                this.fallbackPositionUpdate(centerX, centerY, fitScale);
            }
        } else {
            // フォールバック更新
            this.fallbackPositionUpdate(centerX, centerY, fitScale);
        }
        
        // UIバウンディングボックスも同期
        if (this.ui.core.uiState.visible) {
            setTimeout(() => this.ui.syncPosition(), 10);
        }
    }
    
    /**
     * フォールバック位置更新
     */
    fallbackPositionUpdate(x, y, scale) {
        const element = this.core.config.targetElement;
        if (!element) return;
        
        // CSS Transform適用
        element.style.transformOrigin = 'center center';
        element.style.transform = `translate(${x - element.offsetWidth/2}px, ${y - element.offsetHeight/2}px) scale(${scale})`;
        
        console.log('🔧 フォールバック位置更新:', {
            position: `(${Math.round(x)}, ${Math.round(y)})`,
            scale: scale.toFixed(3)
        });
    }
    
    /**
     * レスポンシブデータ生成
     */
    generateResponsiveData() {
        if (!this.isEnabled || !this.backgroundElement) return null;
        
        return {
            enabled: this.isEnabled,
            backgroundSelector: this.getElementSelector(this.backgroundElement),
            regionConfig: this.baseMetrics.regionConfig,
            baseMetrics: { ...this.baseMetrics },
            timestamp: Date.now()
        };
    }
    
    /**
     * 要素セレクター取得
     */
    getElementSelector(element) {
        // ID優先
        if (element.id) {
            return `#${element.id}`;
        }
        
        // クラス名
        if (element.className) {
            const classes = element.className.trim().split(/\s+/);
            return `.${classes[0]}`;
        }
        
        // タグ名
        return element.tagName.toLowerCase();
    }
    
    /**
     * レスポンシブ設定保存
     */
    saveResponsiveSettings(responsiveData) {
        try {
            const storageKey = `responsive-settings-${this.core.config.nodeId}`;
            localStorage.setItem(storageKey, JSON.stringify(responsiveData));
            console.log('💾 レスポンシブ設定保存完了:', storageKey);
        } catch (error) {
            console.error('❌ レスポンシブ設定保存エラー:', error);
        }
    }
    
    /**
     * レスポンシブ設定読み込み
     */
    loadResponsiveSettings() {
        try {
            const storageKey = `responsive-settings-${this.core.config.nodeId}`;
            const stored = localStorage.getItem(storageKey);
            
            if (stored) {
                const data = JSON.parse(stored);
                
                // 設定復元
                this.isEnabled = data.enabled || false;
                if (data.regionConfig) {
                    this.baseMetrics.regionConfig = data.regionConfig;
                }
                
                console.log('📂 レスポンシブ設定読み込み完了:', data);
                return data;
            }
        } catch (error) {
            console.warn('⚠️ レスポンシブ設定読み込み失敗:', error.message);
        }
        
        return null;
    }
    
    /**
     * 破棄処理
     */
    destroy() {
        this.stopResponsiveTracking();
        console.log('🗑️ ResponsiveSpineFitIntegration破棄完了');
    }
    
    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            enabled: this.isEnabled,
            backgroundElement: !!this.backgroundElement,
            backgroundSize: this.backgroundElement ? {
                width: this.backgroundElement.offsetWidth,
                height: this.backgroundElement.offsetHeight
            } : null,
            targetRegions: Object.keys(this.targetRegionConfig || {}),
            baseMetrics: { ...this.baseMetrics },
            observersActive: this.observers.size,
            lastUpdateTime: this.lastUpdateTime
        };
    }
}

/**
 * PureBoundingBoxUI統合ヘルパー
 */
class ResponsiveSpineFitHelper {
    /**
     * 既存のPureBoundingBoxUIにレスポンシブ機能を統合
     */
    static integrate(pureBoundingBoxUI) {
        if (!pureBoundingBoxUI) {
            console.error('❌ PureBoundingBoxUIが提供されていません');
            return null;
        }
        
        // ResponsiveSpineFitIntegration作成
        const integration = new ResponsiveSpineFitIntegration(pureBoundingBoxUI);
        
        // UI にレスポンシブシステムの参照追加
        pureBoundingBoxUI.responsiveSystem = integration;
        
        console.log('🔗 PureBoundingBoxUI レスポンシブ統合完了');
        return integration;
    }
    
    /**
     * 自動統合（既存PureBoundingBoxインスタンスを検索）
     */
    static autoIntegrate() {
        // グローバルインスタンス検索
        const candidates = [
            window.pureBoundingBox?.ui,
            window.PureBoundingBoxUI,
            // DOM要素から検索
            ...Array.from(document.querySelectorAll('[data-bounding-box]')).map(el => el._boundingBoxUI)
        ].filter(Boolean);
        
        if (candidates.length === 0) {
            console.warn('⚠️ 統合対象のPureBoundingBoxUIが見つかりません');
            return null;
        }
        
        const results = candidates.map(ui => this.integrate(ui));
        console.log(`✅ ${results.length}個のPureBoundingBoxUIにレスポンシブ機能を統合しました`);
        
        return results;
    }
}

// エクスポート
if (typeof window !== 'undefined') {
    window.ResponsiveSpineFitIntegration = ResponsiveSpineFitIntegration;
    window.ResponsiveSpineFitHelper = ResponsiveSpineFitHelper;
    
    // 自動統合オプション（DOMContentLoaded後）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // ResponsiveSpineFitHelper.autoIntegrate();
        });
    }
}

console.log('📦 ResponsiveSpineFitIntegration モジュール読み込み完了');