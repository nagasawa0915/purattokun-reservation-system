/**
 * PureBoundingBoxAutoPin.js
 * 
 * 🎯 自動ピン適用マイクロモジュール
 * - 外部依存: ElementObserver Phase 1, PureBoundingBoxCore
 * - 責務: 保存時の自動ピン設定のみ
 * - バージョン: 1.1 (Phase 1統合版)
 * - 作成日: 2025-08-30
 * - 更新日: 2025-09-04
 */

class PureBoundingBoxAutoPin {
    constructor(core, observer) {
        this.core = core;
        this.observer = observer; // ElementObserver Phase 1 instance
        this.activePins = new Map(); // nodeId -> pinConfig
        
        // ElementObserver Phase 1 の基本機能確認
        if (!this.observer || !this.observer.observe) {
            console.warn('⚠️ ElementObserver Phase 1 が正しく初期化されていません');
        }
        
        // 背景検出設定
        this.detectionConfig = {
            minWidth: 200,
            minHeight: 200,
            maxSearchDepth: 5,
            fallbackToBody: true
        };
        
        // アンカーポイント設定
        this.anchorConfig = {
            gridX: [0.33, 0.67], // 3分割の境界線
            gridY: [0.33, 0.67],
            defaultAnchor: 'MC'
        };
        
        // パフォーマンス監視
        this.performanceMetrics = {
            totalProcessingTime: 0,
            successCount: 0,
            failureCount: 0,
            averageTime: 0
        };
        
        // 永続化されたピン状態を復元
        this.restoreActivePins();
        this.restorePerformanceMetrics();
        
        console.log('🎯 PureBoundingBoxAutoPin v1.0 初期化完了');
    }
    
    // ==========================================
    // 🎯 メイン機能: 保存時自動ピン適用
    // ==========================================
    
    /**
     * 🎯 保存時自動ピン適用（メイン機能）
     */
    async applyAutoPinOnSave(saveData) {
        const startTime = performance.now();
        
        try {
            console.log('🎯 保存時自動ピン適用開始', {
                nodeId: this.core.config.nodeId,
                targetElement: this.getElementInfo(saveData.targetElement),
                bounds: saveData.bounds
            });
            
            // 1. 背景要素の自動検出
            const backgroundElement = this.detectBackgroundElement(saveData.targetElement);
            if (!backgroundElement) {
                throw new Error('適切な背景要素が見つかりませんでした');
            }
            
            // 2. 最適アンカーポイントの計算
            const optimalAnchor = this.calculateOptimalAnchor(saveData.bounds, backgroundElement);
            console.log('📍 最適アンカー計算結果:', optimalAnchor);
            
            // 3. 既存ピンのクリーンアップ
            this.cleanupExistingPin(this.core.config.nodeId);
            
            // 4. 新しいピンの設定
            const pinConfig = await this.createAutoPin({
                targetElement: backgroundElement,
                spineElement: saveData.targetElement,
                anchor: optimalAnchor,
                bounds: saveData.bounds
            });
            
            // 5. ピン情報の記録
            this.activePins.set(this.core.config.nodeId, pinConfig);
            
            // 6. 永続化
            this.saveActivePins();
            
            // パフォーマンス記録
            const processingTime = performance.now() - startTime;
            this.updatePerformanceMetrics(processingTime, true);
            
            console.log('✅ 自動ピン適用完了:', {
                pinConfig: pinConfig,
                processingTime: `${processingTime.toFixed(2)}ms`
            });
            
            return {
                success: true,
                pinConfig: pinConfig,
                message: `自動追従機能が有効になりました (${optimalAnchor})`,
                processingTime
            };
            
        } catch (error) {
            const processingTime = performance.now() - startTime;
            this.updatePerformanceMetrics(processingTime, false);
            
            console.error('❌ 自動ピン適用エラー:', error.message);
            
            return {
                success: false,
                error: error.message,
                fallback: 'ピン機能なしで保存完了',
                processingTime
            };
        }
    }
    
    // ==========================================
    // 🔍 背景要素自動検出システム
    // ==========================================
    
    /**
     * 背景要素の自動検出
     */
    detectBackgroundElement(targetElement) {
        console.log('🔍 背景要素検出開始', {
            target: this.getElementInfo(targetElement)
        });
        
        // 検出優先度順リスト
        const detectionStrategies = [
            () => this.findParentWithBackground(targetElement),
            () => this.findNearbyImageElement(targetElement),
            () => this.findSectionContainer(targetElement),
            () => this.findMainContainer(targetElement)
        ];
        
        for (let i = 0; i < detectionStrategies.length; i++) {
            const strategy = detectionStrategies[i];
            const result = strategy();
            
            if (result && this.validateBackgroundElement(result)) {
                console.log(`✅ 背景要素検出成功 (戦略${i + 1}):`, this.getElementInfo(result));
                return result;
            }
        }
        
        // 最終フォールバック
        if (this.detectionConfig.fallbackToBody) {
            console.log('⚠️ フォールバック: document.body を使用');
            return document.body;
        }
        
        return null;
    }
    
    /**
     * 背景画像付き親要素の検出
     */
    findParentWithBackground(element) {
        let current = element.parentElement;
        let depth = 0;
        
        while (current && current !== document.body && depth < this.detectionConfig.maxSearchDepth) {
            const style = getComputedStyle(current);
            
            if (style.backgroundImage !== 'none' || 
                style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                return current;
            }
            
            current = current.parentElement;
            depth++;
        }
        
        return null;
    }
    
    /**
     * 近接画像要素の検出
     */
    findNearbyImageElement(element) {
        const parent = element.parentElement;
        if (!parent) return null;
        
        const siblings = Array.from(parent.children);
        const images = siblings.filter(el => 
            el.tagName === 'IMG' && 
            el.offsetWidth > this.detectionConfig.minWidth && 
            el.offsetHeight > this.detectionConfig.minHeight
        );
        
        // 最大の画像を選択
        return images.sort((a, b) => 
            (b.offsetWidth * b.offsetHeight) - (a.offsetWidth * a.offsetHeight)
        )[0] || null;
    }
    
    /**
     * セクションコンテナの検出
     */
    findSectionContainer(element) {
        const containers = [
            element.closest('section'),
            element.closest('.hero'),
            element.closest('.container'),
            element.closest('main')
        ];
        
        return containers.find(el => 
            el && 
            el.offsetWidth > this.detectionConfig.minWidth && 
            el.offsetHeight > this.detectionConfig.minHeight
        ) || null;
    }
    
    /**
     * メインコンテナの検出
     */
    findMainContainer(element) {
        const mainSelectors = [
            '#main-content',
            '.main-content',
            '[role="main"]',
            '.page-wrapper',
            '.content-wrapper'
        ];
        
        for (const selector of mainSelectors) {
            const container = document.querySelector(selector);
            if (container && this.validateBackgroundElement(container)) {
                return container;
            }
        }
        
        return null;
    }
    
    /**
     * 背景要素の妥当性検証
     */
    validateBackgroundElement(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        
        // サイズ確認
        if (rect.width < this.detectionConfig.minWidth || 
            rect.height < this.detectionConfig.minHeight) {
            return false;
        }
        
        // 表示確認
        if (rect.width === 0 || rect.height === 0) {
            return false;
        }
        
        // スタイル確認
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') {
            return false;
        }
        
        return true;
    }
    
    // ==========================================
    // 📍 最適アンカーポイント計算システム
    // ==========================================
    
    /**
     * 最適アンカーポイント計算
     */
    calculateOptimalAnchor(bounds, backgroundElement) {
        console.log('📍 最適アンカー計算開始', {
            bounds,
            background: this.getElementInfo(backgroundElement)
        });
        
        // 背景要素内での相対位置を計算
        const bgRect = backgroundElement.getBoundingClientRect();
        const spineRect = {
            x: bounds.left || bounds.x || 0,
            y: bounds.top || bounds.y || 0,
            width: bounds.width || 100,
            height: bounds.height || 100,
            centerX: (bounds.left || bounds.x || 0) + (bounds.width || 100) / 2,
            centerY: (bounds.top || bounds.y || 0) + (bounds.height || 100) / 2
        };
        
        // 正規化座標（0.0-1.0）
        const normalizedX = Math.max(0, Math.min(1, (spineRect.centerX - bgRect.left) / bgRect.width));
        const normalizedY = Math.max(0, Math.min(1, (spineRect.centerY - bgRect.top) / bgRect.height));
        
        console.log('📊 正規化座標:', { x: normalizedX, y: normalizedY });
        
        // 特殊ケース対応
        const specialCaseAnchor = this.checkSpecialCases(bgRect, spineRect, normalizedX, normalizedY);
        if (specialCaseAnchor) {
            return specialCaseAnchor;
        }
        
        // アンカーポイントマッピング
        return this.mapToAnchorPoint(normalizedX, normalizedY);
    }
    
    /**
     * アンカーポイントマッピング
     */
    mapToAnchorPoint(x, y) {
        // 9分割グリッドでアンカー決定
        const xZone = x < this.anchorConfig.gridX[0] ? 'L' : 
                      x > this.anchorConfig.gridX[1] ? 'R' : 'C';
        const yZone = y < this.anchorConfig.gridY[0] ? 'T' : 
                      y > this.anchorConfig.gridY[1] ? 'B' : 'M';
        
        const anchorMap = {
            'TL': 'TL', 'TC': 'TC', 'TR': 'TR',
            'ML': 'ML', 'MC': 'MC', 'MR': 'MR', 
            'BL': 'BL', 'BC': 'BC', 'BR': 'BR'
        };
        
        const anchor = anchorMap[yZone + xZone] || this.anchorConfig.defaultAnchor;
        console.log('🎯 アンカー決定:', { x, y, xZone, yZone, anchor });
        
        return anchor;
    }
    
    /**
     * 特殊ケースの確認
     */
    checkSpecialCases(bgRect, spineRect, normalizedX, normalizedY) {
        // レスポンシブ考慮
        if (this.isResponsiveLayout(bgRect)) {
            return this.adjustAnchorForResponsive(normalizedX, normalizedY);
        }
        
        // 小さな要素の場合
        if (bgRect.width < 400 || bgRect.height < 300) {
            console.log('📐 小さな背景要素 → 中央固定');
            return 'MC';
        }
        
        // 縦長レイアウト
        if (bgRect.height / bgRect.width > 1.5) {
            const anchor = normalizedY < 0.5 ? 'TC' : 'BC';
            console.log('📐 縦長レイアウト →', anchor);
            return anchor;
        }
        
        // 横長レイアウト
        if (bgRect.width / bgRect.height > 2.0) {
            const anchor = normalizedX < 0.5 ? 'ML' : 'MR';
            console.log('📐 横長レイアウト →', anchor);
            return anchor;
        }
        
        return null;
    }
    
    /**
     * レスポンシブレイアウトの確認
     */
    isResponsiveLayout(rect) {
        // ビューポートの相当部分を占める場合
        const viewportRatio = (rect.width * rect.height) / (window.innerWidth * window.innerHeight);
        return viewportRatio > 0.7;
    }
    
    /**
     * レスポンシブ用アンカー調整
     */
    adjustAnchorForResponsive(normalizedX, normalizedY) {
        // レスポンシブでは中央系のアンカーを推奨
        if (normalizedX > 0.3 && normalizedX < 0.7) {
            if (normalizedY < 0.4) return 'TC';
            if (normalizedY > 0.6) return 'BC';
            return 'MC';
        }
        
        // サイドアンカー
        return normalizedX < 0.5 ? 'ML' : 'MR';
    }
    
    // ==========================================
    // 🔗 ElementObserver Phase 1統合
    // ==========================================
    
    /**
     * 自動ピンの作成（Phase 1対応版）
     */
    async createAutoPin(config) {
        console.log('🔗 自動ピン作成開始 (Phase 1)', {
            anchor: config.anchor,
            target: this.getElementInfo(config.targetElement),
            spine: this.getElementInfo(config.spineElement)
        });
        
        const startTime = performance.now();
        
        try {
            // ElementObserver Phase 1 の基本チェック
            const observer = this.observer;
            
            if (!observer || !observer.observe) {
                console.warn('🚨 ElementObserver Phase 1 が利用できません。基本モードで動作します。');
                return {
                    success: false,
                    fallbackMode: true,
                    message: 'ElementObserver Phase 1が利用できないため、自動ピンは無効です',
                    config: config
                };
            }
            
            // Phase 1の基本observe機能を使用した自動ピン実装
            console.log('🎯 ElementObserver Phase 1 基本監視開始');
            
            // 背景要素の監視設定
            const backgroundElement = config.targetElement;
            const spineElement = config.spineElement;
            
            // 内部アンカーポイント計算システム
            const anchorCalculations = this.createAnchorCalculationSystem(config.anchor);
            
            // Phase 1のobserve機能でバックグラウンド要素を監視
            const unobservePin = observer.observe(backgroundElement, (rect, changeType) => {
                try {
                    console.log('📐 背景要素変化検出:', {
                        changeType,
                        size: `${rect.width}x${rect.height}`,
                        anchor: config.anchor
                    });
                    
                    // アンカーベース位置計算
                    const anchorPosition = anchorCalculations.calculate(rect);
                    
                    // Spine要素位置の更新
                    this.applyAnchorPosition(spineElement, anchorPosition, config.bounds);
                    
                } catch (error) {
                    console.error('❌ ピン位置更新エラー:', error);
                }
            }, {
                throttle: true,
                precision: 0.1
            });
            
            const processingTime = performance.now() - startTime;
            
            console.log(`⚡ Phase 1自動ピン作成完了: ${processingTime.toFixed(4)}ms`);
            
            return {
                id: `auto-pin-phase1-${Date.now()}`,
                anchor: config.anchor,
                targetElement: config.targetElement,
                spineElement: config.spineElement,
                unobserve: unobservePin,
                processingTime,
                createdAt: new Date().toISOString(),
                phase: 'Phase 1'
            };
            
        } catch (error) {
            console.error('❌ Phase 1自動ピン作成エラー:', error);
            
            // パフォーマンス統計更新（失敗）
            this.performanceMetrics.failureCount++;
            
            return {
                success: false,
                fallbackMode: true,
                message: 'Phase 1 ElementObserver統合でエラーが発生しました',
                error: error.message,
                config: config
            };
        }
    }
    
    /**
     * 内部アンカーポイント計算システム作成
     */
    createAnchorCalculationSystem(anchor) {
        const anchorMap = {
            'TL': { x: 0, y: 0 },     // Top Left
            'TC': { x: 0.5, y: 0 },   // Top Center
            'TR': { x: 1, y: 0 },     // Top Right
            'ML': { x: 0, y: 0.5 },   // Middle Left
            'MC': { x: 0.5, y: 0.5 }, // Middle Center
            'MR': { x: 1, y: 0.5 },   // Middle Right
            'BL': { x: 0, y: 1 },     // Bottom Left
            'BC': { x: 0.5, y: 1 },   // Bottom Center
            'BR': { x: 1, y: 1 }      // Bottom Right
        };
        
        const anchorCoords = anchorMap[anchor] || anchorMap['MC'];
        
        return {
            calculate: (rect) => {
                return {
                    x: rect.left + (rect.width * anchorCoords.x),
                    y: rect.top + (rect.height * anchorCoords.y),
                    anchor: anchor,
                    rect: rect
                };
            }
        };
    }
    
    /**
     * Spine要素へのアンカー位置適用
     */
    applyAnchorPosition(spineElement, anchorPosition, bounds) {
        if (!spineElement) {
            console.warn('⚠️ Spine要素が見つかりません');
            return;
        }
        
        try {
            // スケール情報の取得
            const scaleX = bounds?.scaleX ? parseFloat(bounds.scaleX) : 1.0;
            const scaleY = bounds?.scaleY ? parseFloat(bounds.scaleY) : 1.0;
            
            // CSS Transform による位置・スケール適用
            const transformStyle = `translate(${anchorPosition.x}px, ${anchorPosition.y}px) scale(${scaleX}, ${scaleY})`;
            spineElement.style.transform = transformStyle;
            spineElement.style.transformOrigin = 'center center';
            
            console.log('🎯 Spine要素位置更新:', {
                position: `${anchorPosition.x.toFixed(1)}, ${anchorPosition.y.toFixed(1)}`,
                scale: `${scaleX}, ${scaleY}`,
                anchor: anchorPosition.anchor
            });
            
        } catch (error) {
            console.error('❌ Spine位置適用エラー:', error);
        }
    }
    
    /**
     * 既存ピンのクリーンアップ
     */
    cleanupExistingPin(nodeId) {
        const existingPin = this.activePins.get(nodeId);
        
        if (existingPin) {
            console.log('🧹 既存ピンクリーンアップ:', existingPin.id);
            
            try {
                if (existingPin.unobserve) {
                    existingPin.unobserve();
                }
                
                this.activePins.delete(nodeId);
                console.log('✅ 既存ピンクリーンアップ完了');
                
            } catch (error) {
                console.warn('⚠️ ピンクリーンアップエラー:', error.message);
            }
        }
    }
    
    // ==========================================
    // 📊 ユーティリティ・ヘルパー
    // ==========================================
    
    /**
     * パフォーマンス指標更新
     */
    updatePerformanceMetrics(processingTime, success) {
        this.performanceMetrics.totalProcessingTime += processingTime;
        
        if (success) {
            this.performanceMetrics.successCount++;
        } else {
            this.performanceMetrics.failureCount++;
        }
        
        const totalCount = this.performanceMetrics.successCount + this.performanceMetrics.failureCount;
        this.performanceMetrics.averageTime = this.performanceMetrics.totalProcessingTime / totalCount;
        
        // パフォーマンス指標も永続化
        this.savePerformanceMetrics();
    }
    
    /**
     * 要素情報取得
     */
    getElementInfo(element) {
        if (!element) return 'null';
        
        return {
            tagName: element.tagName,
            id: element.id || '(no id)',
            className: element.className || '(no class)',
            size: `${element.offsetWidth}×${element.offsetHeight}`
        };
    }
    
    /**
     * 状態取得
     */
    getState() {
        return {
            activePinsCount: this.activePins.size,
            activePins: Array.from(this.activePins.keys()),
            performanceMetrics: {...this.performanceMetrics},
            config: {
                detection: {...this.detectionConfig},
                anchor: {...this.anchorConfig}
            }
        };
    }
    
    /**
     * 設定更新
     */
    updateConfig(newConfig) {
        if (newConfig.detection) {
            Object.assign(this.detectionConfig, newConfig.detection);
        }
        
        if (newConfig.anchor) {
            Object.assign(this.anchorConfig, newConfig.anchor);
        }
        
        console.log('⚙️ AutoPin設定更新完了:', {
            detection: this.detectionConfig,
            anchor: this.anchorConfig
        });
    }
    
    /**
     * 完全クリーンアップ
     */
    cleanup() {
        console.log('🧹 AutoPin完全クリーンアップ開始');
        
        // 全てのアクティブピンをクリーンアップ
        for (const [nodeId, pinConfig] of this.activePins) {
            this.cleanupExistingPin(nodeId);
        }
        
        // 状態リセット
        this.activePins.clear();
        this.performanceMetrics = {
            totalProcessingTime: 0,
            successCount: 0,
            failureCount: 0,
            averageTime: 0
        };
        
        console.log('✅ AutoPin完全クリーンアップ完了');
    }
    
    // ==========================================
    // 💾 永続化システム
    // ==========================================
    
    /**
     * アクティブピン状態を永続化
     */
    saveActivePins() {
        try {
            const pinsData = {};
            for (const [nodeId, pinConfig] of this.activePins) {
                pinsData[nodeId] = {
                    anchor: pinConfig.anchor,
                    targetElement: pinConfig.targetElement?.id || null,
                    spineElement: pinConfig.spineElement?.id || null,
                    timestamp: Date.now()
                };
            }
            
            localStorage.setItem('autopin-active-pins', JSON.stringify({
                pins: pinsData,
                version: '1.0',
                timestamp: Date.now()
            }));
            
            console.log('💾 アクティブピン状態保存完了:', Object.keys(pinsData));
            
        } catch (error) {
            console.warn('⚠️ アクティブピン保存失敗:', error.message);
        }
    }
    
    /**
     * アクティブピン状態を復元
     */
    restoreActivePins() {
        try {
            const storedData = localStorage.getItem('autopin-active-pins');
            if (!storedData) {
                console.log('💾 復元するピン状態が見つかりません（初回起動）');
                return;
            }
            
            const { pins, timestamp } = JSON.parse(storedData);
            
            // 1時間以上古いデータは無視
            if (Date.now() - timestamp > 3600000) {
                console.log('💾 ピン状態が古すぎるため破棄しました');
                localStorage.removeItem('autopin-active-pins');
                return;
            }
            
            let restoredCount = 0;
            for (const [nodeId, pinData] of Object.entries(pins)) {
                // 要素が存在するかチェック
                const targetElement = pinData.targetElement ? document.getElementById(pinData.targetElement) : null;
                const spineElement = pinData.spineElement ? document.getElementById(pinData.spineElement) : null;
                
                if (targetElement && spineElement) {
                    // 簡易的なピン情報を復元
                    this.activePins.set(nodeId, {
                        anchor: pinData.anchor,
                        targetElement: targetElement,
                        spineElement: spineElement,
                        restored: true
                    });
                    restoredCount++;
                }
            }
            
            console.log(`💾 アクティブピン状態復元完了: ${restoredCount}件`);
            
        } catch (error) {
            console.warn('⚠️ アクティブピン復元失敗:', error.message);
        }
    }
    
    /**
     * パフォーマンス指標を永続化
     */
    savePerformanceMetrics() {
        try {
            localStorage.setItem('autopin-performance-metrics', JSON.stringify({
                ...this.performanceMetrics,
                version: '1.0',
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn('⚠️ パフォーマンス指標保存失敗:', error.message);
        }
    }
    
    /**
     * パフォーマンス指標を復元
     */
    restorePerformanceMetrics() {
        try {
            const storedData = localStorage.getItem('autopin-performance-metrics');
            if (!storedData) {
                console.log('💾 復元するパフォーマンス指標が見つかりません（初回起動）');
                return;
            }
            
            const data = JSON.parse(storedData);
            
            // 1時間以上古いデータは無視
            if (Date.now() - data.timestamp > 3600000) {
                console.log('💾 パフォーマンス指標が古すぎるため破棄しました');
                localStorage.removeItem('autopin-performance-metrics');
                return;
            }
            
            this.performanceMetrics = {
                totalProcessingTime: data.totalProcessingTime || 0,
                successCount: data.successCount || 0,
                failureCount: data.failureCount || 0,
                averageTime: data.averageTime || 0
            };
            
            console.log('💾 パフォーマンス指標復元完了:', this.performanceMetrics);
            
        } catch (error) {
            console.warn('⚠️ パフォーマンス指標復元失敗:', error.message);
        }
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.PureBoundingBoxAutoPin = PureBoundingBoxAutoPin;
}