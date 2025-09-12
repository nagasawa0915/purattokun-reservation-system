/**
 * ResponsiveSpineFitIntegration.js
 * 
 * 🎯 背景画像完全フィット・レスポンシブシステム
 * - PureBoundingBoxUIへの統合アドオン
 * - 背景要素自動検出・ResizeObserver監視
 * - 完全フィット計算アルゴリズム（はみ出し防止）
 * - ElementObserver Phase 3-B統合API使用
 */

class ResponsiveSpineFitIntegration {
    constructor(pureBoundingBoxUI) {
        this.ui = pureBoundingBoxUI;
        this.core = pureBoundingBoxUI.core;
        
        // レスポンシブシステム設定
        this.config = {
            enabled: false,
            backgroundElement: null,
            resizeThrottleMs: 16, // 60fps制限
            debugMode: false,
            fitStrategy: 'contain', // contain | cover | fit
            anchor: 'MC' // デフォルトアンカー
        };
        
        // システム状態
        this.state = {
            isActive: false,
            lastBackgroundRect: null,
            lastTargetRect: null,
            observingElements: new Set(),
            performanceMetrics: {
                resizeCount: 0,
                updateTime: [],
                lastUpdate: null
            }
        };
        
        // ResizeObserver
        this.resizeObserver = null;
        this.throttledUpdate = this.throttle(this.updatePosition.bind(this), this.config.resizeThrottleMs);
        
        // ElementObserver Phase 3-B 統合
        this.elementObserver = null;
        this.initializeElementObserver();
        
        console.log('🎯 ResponsiveSpineFitIntegration 初期化完了');
    }
    
    /**
     * ElementObserver Phase 3-B 初期化
     */
    async initializeElementObserver() {
        try {
            if (window.ElementObserverAdvanced) {
                this.elementObserver = new window.ElementObserverAdvanced();
                console.log('✅ ElementObserver Phase 3-B 統合完了');
            } else {
                console.warn('⚠️ ElementObserverAdvanced未検出 - 基本機能のみ利用');
            }
        } catch (error) {
            console.error('❌ ElementObserver初期化エラー:', error.message);
        }
    }
    
    /**
     * レスポンシブシステム有効化
     */
    enable(options = {}) {
        console.log('🎯 レスポンシブシステム有効化開始');
        
        // オプション設定
        Object.assign(this.config, options);
        
        // 背景要素自動検出
        if (!this.config.backgroundElement) {
            this.config.backgroundElement = this.detectBackgroundElement();
        }
        
        if (!this.config.backgroundElement) {
            console.warn('⚠️ 背景要素が見つかりません - レスポンシブ機能を無効化');
            return false;
        }
        
        // ResizeObserver開始
        this.startResizeObserver();
        
        // 初期位置計算
        this.updatePosition();
        
        this.config.enabled = true;
        this.state.isActive = true;
        
        console.log('✅ レスポンシブシステム有効化完了', {
            backgroundElement: this.config.backgroundElement.tagName + (this.config.backgroundElement.id ? `#${this.config.backgroundElement.id}` : ''),
            fitStrategy: this.config.fitStrategy,
            anchor: this.config.anchor
        });
        
        return true;
    }
    
    /**
     * レスポンシブシステム無効化
     */
    disable() {
        console.log('🔄 レスポンシブシステム無効化');
        
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        
        this.config.enabled = false;
        this.state.isActive = false;
        this.state.observingElements.clear();
        
        console.log('✅ レスポンシブシステム無効化完了');
    }
    
    /**
     * 背景要素自動検出
     */
    detectBackgroundElement() {
        console.log('🔍 背景要素自動検出開始');
        
        const targetElement = this.core.config.targetElement;
        if (!targetElement) {
            console.warn('⚠️ ターゲット要素なし');
            return null;
        }
        
        // 検出戦略リスト
        const detectionStrategies = [
            this.detectByBackgroundImage.bind(this),
            this.detectByNearbyImage.bind(this),
            this.detectBySectionContainer.bind(this),
            this.detectByMainContainer.bind(this)
        ];
        
        for (const strategy of detectionStrategies) {
            const element = strategy(targetElement);
            if (element) {
                console.log('✅ 背景要素検出成功:', {
                    strategy: strategy.name,
                    element: element.tagName + (element.id ? `#${element.id}` : ''),
                    rect: element.getBoundingClientRect()
                });
                return element;
            }
        }
        
        console.warn('⚠️ 適切な背景要素が見つかりません');
        return null;
    }
    
    /**
     * 背景画像付き親要素を検出
     */
    detectByBackgroundImage(targetElement) {
        let current = targetElement.parentElement;
        
        while (current && current !== document.body) {
            const style = window.getComputedStyle(current);
            const backgroundImage = style.backgroundImage;
            
            // 背景画像があり、かつ適切なサイズを持つ要素
            if (backgroundImage && backgroundImage !== 'none') {
                const rect = current.getBoundingClientRect();
                if (rect.width > 200 && rect.height > 100) {
                    return current;
                }
            }
            
            current = current.parentElement;
        }
        
        return null;
    }
    
    /**
     * 近接大型画像要素を検出
     */
    detectByNearbyImage(targetElement) {
        const targetRect = targetElement.getBoundingClientRect();
        const images = document.querySelectorAll('img, [style*="background-image"], .background-image, .hero-section');
        
        for (const img of images) {
            const imgRect = img.getBoundingClientRect();
            
            // 大きさの条件
            if (imgRect.width > 300 && imgRect.height > 200) {
                // 距離の条件（ターゲット要素が画像要素内または近接）
                const distance = Math.sqrt(
                    Math.pow(targetRect.x - imgRect.x, 2) + 
                    Math.pow(targetRect.y - imgRect.y, 2)
                );
                
                if (distance < Math.max(imgRect.width, imgRect.height)) {
                    return img;
                }
            }
        }
        
        return null;
    }
    
    /**
     * セクションコンテナを検出
     */
    detectBySectionContainer(targetElement) {
        const selectors = [
            '.hero-section', '.banner-section', '.main-visual',
            'section', 'main', '.container'
        ];
        
        let current = targetElement.parentElement;
        
        while (current && current !== document.body) {
            for (const selector of selectors) {
                if (current.matches && current.matches(selector)) {
                    const rect = current.getBoundingClientRect();
                    if (rect.width > 300 && rect.height > 200) {
                        return current;
                    }
                }
            }
            current = current.parentElement;
        }
        
        return null;
    }
    
    /**
     * メインコンテナを検出（フォールバック）
     */
    detectByMainContainer(targetElement) {
        let current = targetElement.parentElement;
        
        // 親要素を辿りながら、適切なサイズのコンテナを探す
        while (current && current !== document.body) {
            const rect = current.getBoundingClientRect();
            
            // 十分に大きく、ビューポートの大部分を占める要素
            if (rect.width > window.innerWidth * 0.5 && rect.height > window.innerHeight * 0.3) {
                return current;
            }
            
            current = current.parentElement;
        }
        
        // 最後の手段: body
        return document.body;
    }
    
    /**
     * ResizeObserver開始
     */
    startResizeObserver() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        this.resizeObserver = new ResizeObserver(entries => {
            this.throttledUpdate();
        });
        
        // 監視要素追加
        this.resizeObserver.observe(this.config.backgroundElement);
        this.state.observingElements.add(this.config.backgroundElement);
        
        // ターゲット要素も監視
        if (this.core.config.targetElement) {
            this.resizeObserver.observe(this.core.config.targetElement);
            this.state.observingElements.add(this.core.config.targetElement);
        }
        
        // ウィンドウリサイズも監視
        window.addEventListener('resize', this.throttledUpdate);
        
        // console.log('👀 ResizeObserver開始 - 監視要素数:', this.state.observingElements.size); // リサイズログ無効化
    }
    
    /**
     * 位置更新（メイン処理）
     */
    updatePosition() {
        if (!this.config.enabled || !this.config.backgroundElement) {
            return;
        }
        
        const startTime = performance.now();
        
        try {
            // 現在の要素位置
            const backgroundRect = this.config.backgroundElement.getBoundingClientRect();
            const targetRect = this.core.config.targetElement.getBoundingClientRect();
            
            // 変更検出（最適化）
            if (this.hasNoChanges(backgroundRect, targetRect)) {
                return;
            }
            
            // 完全フィット計算
            const fitPosition = this.calculateFitPosition(backgroundRect, targetRect);
            
            // ElementObserver Phase 3-B を使用して位置設定
            if (this.elementObserver && this.elementObserver.setUnifiedPosition) {
                this.elementObserver.setUnifiedPosition(
                    this.core.config.targetElement,
                    fitPosition.x,
                    fitPosition.y,
                    {
                        scaleX: fitPosition.scaleX,
                        scaleY: fitPosition.scaleY,
                        anchor: this.config.anchor,
                        debug: this.config.debugMode
                    }
                );
            } else {
                // フォールバック: 基本的な位置設定
                this.applyBasicPosition(fitPosition);
            }
            
            // 状態更新
            this.state.lastBackgroundRect = backgroundRect;
            this.state.lastTargetRect = targetRect;
            
            // パフォーマンス記録
            const endTime = performance.now();
            this.recordPerformance(endTime - startTime);
            
            if (this.config.debugMode) {
                console.log('📐 位置更新完了:', {
                    backgroundRect: {
                        width: backgroundRect.width.toFixed(0),
                        height: backgroundRect.height.toFixed(0)
                    },
                    fitPosition: {
                        x: fitPosition.x.toFixed(2),
                        y: fitPosition.y.toFixed(2),
                        scaleX: fitPosition.scaleX.toFixed(3),
                        scaleY: fitPosition.scaleY.toFixed(3)
                    },
                    updateTime: (endTime - startTime).toFixed(2) + 'ms'
                });
            }
            
        } catch (error) {
            console.error('❌ 位置更新エラー:', error.message);
        }
    }
    
    /**
     * 変更検出（最適化用）
     */
    hasNoChanges(backgroundRect, targetRect) {
        if (!this.state.lastBackgroundRect || !this.state.lastTargetRect) {
            return false;
        }
        
        const threshold = 0.5; // 0.5px以下の変更は無視
        
        return (
            Math.abs(backgroundRect.width - this.state.lastBackgroundRect.width) < threshold &&
            Math.abs(backgroundRect.height - this.state.lastBackgroundRect.height) < threshold &&
            Math.abs(targetRect.width - this.state.lastTargetRect.width) < threshold &&
            Math.abs(targetRect.height - this.state.lastTargetRect.height) < threshold
        );
    }
    
    /**
     * 完全フィット位置計算
     */
    calculateFitPosition(backgroundRect, targetRect) {
        // 基本的な相対位置（背景要素内での位置）
        const relativeX = (targetRect.left + targetRect.width / 2) - backgroundRect.left;
        const relativeY = (targetRect.top + targetRect.height / 2) - backgroundRect.top;
        
        // 背景要素サイズでの正規化された位置（0-1）
        const normalizedX = relativeX / backgroundRect.width;
        const normalizedY = relativeY / backgroundRect.height;
        
        // はみ出し防止
        const safeNormalizedX = Math.max(0.05, Math.min(0.95, normalizedX));
        const safeNormalizedY = Math.max(0.05, Math.min(0.95, normalizedY));
        
        // フィット戦略による調整
        let scaleX = 1.0;
        let scaleY = 1.0;
        
        if (this.config.fitStrategy === 'contain') {
            // 背景に完全に収まるように調整
            const maxTargetWidth = backgroundRect.width * 0.8;
            const maxTargetHeight = backgroundRect.height * 0.8;
            
            if (targetRect.width > maxTargetWidth) {
                scaleX = maxTargetWidth / targetRect.width;
            }
            
            if (targetRect.height > maxTargetHeight) {
                scaleY = maxTargetHeight / targetRect.height;
            }
            
            // アスペクト比保持
            const scale = Math.min(scaleX, scaleY);
            scaleX = scaleY = scale;
            
        } else if (this.config.fitStrategy === 'cover') {
            // 背景をカバーするように調整
            const minScale = Math.max(
                backgroundRect.width * 0.1 / targetRect.width,
                backgroundRect.height * 0.1 / targetRect.height
            );
            scaleX = scaleY = Math.max(1.0, minScale);
        }
        // 'fit' の場合は scaleX = scaleY = 1.0 のまま
        
        // 最終位置計算（絶対座標）
        const finalX = backgroundRect.left + (safeNormalizedX * backgroundRect.width);
        const finalY = backgroundRect.top + (safeNormalizedY * backgroundRect.height);
        
        return {
            x: finalX,
            y: finalY,
            scaleX: scaleX,
            scaleY: scaleY,
            normalizedX: safeNormalizedX,
            normalizedY: safeNormalizedY,
            backgroundRect: backgroundRect
        };
    }
    
    /**
     * 基本位置設定（フォールバック）
     */
    applyBasicPosition(fitPosition) {
        const targetElement = this.core.config.targetElement;
        if (!targetElement) return;
        
        // CSS Transform を使用
        const transform = `translate(${fitPosition.x}px, ${fitPosition.y}px) scale(${fitPosition.scaleX}, ${fitPosition.scaleY})`;
        
        targetElement.style.transform = transform;
        targetElement.style.position = 'fixed';
        
        // CSS カスタムプロパティも更新
        targetElement.style.setProperty('--responsive-x', fitPosition.x + 'px');
        targetElement.style.setProperty('--responsive-y', fitPosition.y + 'px');
        targetElement.style.setProperty('--responsive-scale-x', fitPosition.scaleX);
        targetElement.style.setProperty('--responsive-scale-y', fitPosition.scaleY);
    }
    
    /**
     * パフォーマンス記録
     */
    recordPerformance(updateTime) {
        this.state.performanceMetrics.resizeCount++;
        this.state.performanceMetrics.updateTime.push(updateTime);
        this.state.performanceMetrics.lastUpdate = Date.now();
        
        // 履歴は最大50件のみ保持
        if (this.state.performanceMetrics.updateTime.length > 50) {
            this.state.performanceMetrics.updateTime.shift();
        }
    }
    
    /**
     * システム状態取得
     */
    getState() {
        const avgUpdateTime = this.state.performanceMetrics.updateTime.length > 0 ?
            this.state.performanceMetrics.updateTime.reduce((a, b) => a + b, 0) / this.state.performanceMetrics.updateTime.length :
            0;
        
        return {
            enabled: this.config.enabled,
            active: this.state.isActive,
            backgroundElement: this.config.backgroundElement ? {
                tagName: this.config.backgroundElement.tagName,
                id: this.config.backgroundElement.id,
                className: this.config.backgroundElement.className
            } : null,
            resizeCount: this.state.performanceMetrics.resizeCount,
            averageUpdateTime: avgUpdateTime,
            lastUpdate: this.state.performanceMetrics.lastUpdate
        };
    }
    
    /**
     * デバッグモード切り替え
     */
    setDebugMode(enabled) {
        this.config.debugMode = !!enabled;
        console.log(`🔧 デバッグモード: ${this.config.debugMode ? 'ON' : 'OFF'}`);
    }
    
    /**
     * フィット戦略変更
     */
    setFitStrategy(strategy) {
        const validStrategies = ['contain', 'cover', 'fit'];
        if (validStrategies.includes(strategy)) {
            this.config.fitStrategy = strategy;
            if (this.config.enabled) {
                this.updatePosition();
            }
            console.log(`📐 フィット戦略変更: ${strategy}`);
        } else {
            console.warn('⚠️ 無効なフィット戦略:', strategy);
        }
    }
    
    /**
     * アンカーポイント変更
     */
    setAnchor(anchor) {
        this.config.anchor = anchor;
        if (this.config.enabled) {
            this.updatePosition();
        }
        console.log(`📍 アンカー変更: ${anchor}`);
    }
    
    /**
     * スロットル関数
     */
    throttle(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        
        return function (...args) {
            const currentTime = Date.now();
            
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        }.bind(this);
    }
    
    /**
     * クリーンアップ
     */
    cleanup() {
        this.disable();
        
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        
        window.removeEventListener('resize', this.throttledUpdate);
        
        console.log('🔄 ResponsiveSpineFitIntegration クリーンアップ完了');
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.ResponsiveSpineFitIntegration = ResponsiveSpineFitIntegration;
    console.log('✅ ResponsiveSpineFitIntegration モジュール読み込み完了');
}