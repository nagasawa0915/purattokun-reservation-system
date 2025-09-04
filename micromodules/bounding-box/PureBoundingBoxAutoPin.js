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
        console.log('🔍 AutoPin-Constructor-1: 初期化開始', {
            core_exists: !!core,
            observer_exists: !!observer,
            observer_null: observer === null,
            observer_undefined: observer === undefined
        });
        
        this.core = core;
        this.observer = observer; // ElementObserver Phase 1 instance
        this.activePins = new Map(); // nodeId -> pinConfig
        
        console.log('🔍 AutoPin-Constructor-2: observer代入後確認', {
            this_observer_exists: !!this.observer,
            this_observer_null: this.observer === null,
            this_observer_undefined: this.observer === undefined,
            same_reference: this.observer === observer,
            observer_type: typeof this.observer,
            observer_constructor: this.observer ? this.observer.constructor.name : 'null/undefined'
        });
        
        // ElementObserver Phase 1 の基本機能確認
        if (!this.observer || typeof this.observer.observe !== 'function') {
            console.warn('⚠️ AutoPin-Constructor-3: ElementObserver Phase 1 初期化時判定失敗', {
                observer_exists: !!this.observer,
                observe_type: this.observer ? typeof this.observer.observe : 'undefined',
                observe_exists: this.observer ? 'observe' in this.observer : false
            });
        } else {
            console.log('✅ AutoPin-Constructor-4: ElementObserver Phase 1 初期化時判定成功', {
                observe_type: typeof this.observer.observe,
                observer_methods: Object.getOwnPropertyNames(Object.getPrototypeOf(this.observer)).filter(name => typeof this.observer[name] === 'function')
            });
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
            console.log('🚀 createAutoPin呼び出し開始:', {
                backgroundElement: backgroundElement ? this.getElementInfo(backgroundElement) : 'null',
                spineElement: saveData.targetElement ? this.getElementInfo(saveData.targetElement) : 'null',
                anchor: optimalAnchor,
                bounds: saveData.bounds
            });
            
            const pinConfig = await this.createAutoPin({
                targetElement: backgroundElement,
                spineElement: saveData.targetElement,
                anchor: optimalAnchor,
                bounds: saveData.bounds
            });
            
            console.log('📋 createAutoPin結果:', {
                success: pinConfig?.success !== false,
                fallbackMode: pinConfig?.fallbackMode,
                hasId: !!pinConfig?.id,
                pinConfig: pinConfig
            });
            
            // 5. ピン情報の記録
            console.log('📝 ピン情報記録処理:', {
                nodeId: this.core.config.nodeId,
                pinConfig: pinConfig,
                pinConfigValid: !!pinConfig,
                pinConfigKeys: pinConfig ? Object.keys(pinConfig) : 'null/undefined'
            });
            
            if (pinConfig && pinConfig.id) {
                this.activePins.set(this.core.config.nodeId, pinConfig);
                console.log('✅ アクティブピン登録完了:', this.core.config.nodeId);
                console.log('📊 現在のアクティブピン数:', this.activePins.size);
            } else {
                console.error('❌ 無効なpinConfigのため登録スキップ:', pinConfig);
            }
            
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
        
        console.log('🔍 Phase 1-1: createAutoPin実行開始');
        console.log('🔍 Phase 1-2: config検証', {
            hasTargetElement: !!config.targetElement,
            hasSpineElement: !!config.spineElement,
            hasAnchor: !!config.anchor,
            hasBounds: !!config.bounds,
            configKeys: Object.keys(config)
        });
        
        try {
            console.log('🔍 Phase 1-3: ElementObserver取得開始');
            
            // this.observer参照一貫性の詳細確認
            console.log('🔍 Phase 1-3.1: this.observer詳細状況', {
                this_observer_exists: !!this.observer,
                this_observer_null: this.observer === null,
                this_observer_undefined: this.observer === undefined,
                this_observer_type: typeof this.observer,
                this_observer_constructor: this.observer ? this.observer.constructor.name : 'null/undefined',
                this_observer_id: this.observer ? this.observer.toString() : 'null/undefined'
            });
            
            // ElementObserver Phase 1 の基本チェック
            const observer = this.observer;
            
            console.log('🔍 Phase 1-3.2: observer代入後参照確認', {
                observer_same_reference: observer === this.observer,
                observer_exists: !!observer,
                observer_null: observer === null,
                observer_undefined: observer === undefined
            });
            
            console.log('🔍 Phase 1-4: observer基本情報', {
                observer_exists: !!observer,
                observer_null: observer === null,
                observer_undefined: observer === undefined,
                observe_exists: observer ? 'observe' in observer : 'no-observer',
                observe_type: observer ? typeof observer.observe : 'undefined'
            });
            
            if (!observer || typeof observer.observe !== 'function') {
                console.warn('🚨 Phase 1-5: ElementObserver判定失敗 - 基本モードに切り替え', {
                    observer_exists: !!observer,
                    observe_type: observer ? typeof observer.observe : 'undefined',
                    observer_methods: observer ? Object.getOwnPropertyNames(Object.getPrototypeOf(observer)) : [],
                    observer_constructor: observer ? observer.constructor.name : 'null/undefined'
                });
                
                const fallbackResult = {
                    success: false,
                    fallbackMode: true,
                    message: 'ElementObserver Phase 1が利用できないため、自動ピンは無効です',
                    config: config
                };
                
                console.log('🔍 Phase 1-6: フォールバック結果返却', fallbackResult);
                return fallbackResult;
            }
            
            console.log('✅ Phase 1-7: ElementObserver判定成功 - 通常処理継続');
            
            // ElementObserverCore依存関係の詳細確認
            console.log('🔍 Phase 2-1: ElementObserverCore依存関係確認開始');
            console.log('🔍 Phase 2-2: ElementObserverCore状況', {
                ElementObserverCore_exists: typeof window.ElementObserverCore !== 'undefined',
                ElementObserverCore_type: typeof window.ElementObserverCore,
                ElementObserverCore_constructor: window.ElementObserverCore ? window.ElementObserverCore.name : 'undefined'
            });
            
            if (observer.core) {
                console.log('🔍 Phase 2-3: observer.core詳細', {
                    core_exists: !!observer.core,
                    core_constructor: observer.core.constructor.name,
                    core_observe_exists: 'observe' in observer.core,
                    core_observe_type: typeof observer.core.observe
                });
            } else {
                console.log('⚠️ Phase 2-4: observer.core が存在しません');
            }
            
            // Phase 1の基本observe機能を使用した自動ピン実装
            console.log('🎯 ElementObserver Phase 1 基本監視開始');
            console.log('🔍 ElementObserver詳細確認:', {
                observer_exists: !!observer,
                observe_function: typeof observer.observe,
                observer_constructor: observer.constructor.name,
                observer_methods: Object.getOwnPropertyNames(Object.getPrototypeOf(observer)).filter(name => typeof observer[name] === 'function')
            });
            
            // 背景要素の監視設定
            const backgroundElement = config.targetElement;
            const spineElement = config.spineElement;
            
            // 内部アンカーポイント計算システム
            const anchorCalculations = this.createAnchorCalculationSystem(config.anchor);
            
            console.log('🔍 Phase 1-8: observer.observe呼び出し開始', {
                backgroundElement: this.getElementInfo(backgroundElement),
                spineElement: this.getElementInfo(spineElement)
            });
            
            // Phase 1のobserve機能でバックグラウンド要素を監視
            let unobservePin = null;
            try {
                unobservePin = observer.observe(backgroundElement, (rect, changeType) => {
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
                
                console.log('✅ Phase 1-9: observer.observe呼び出し成功', {
                    unobserveFunction: typeof unobservePin,
                    isFunction: typeof unobservePin === 'function'
                });
                
            } catch (observeError) {
                console.error('❌ Phase 1-10: observer.observe呼び出し失敗', {
                    error: observeError.message,
                    stack: observeError.stack
                });
                throw observeError;
            }
            
            const processingTime = performance.now() - startTime;
            
            console.log(`⚡ Phase 1-11: 処理時間計算完了: ${processingTime.toFixed(4)}ms`);
            
            const pinConfig = {
                id: `auto-pin-phase1-${Date.now()}`,
                anchor: config.anchor,
                targetElement: config.targetElement,
                spineElement: config.spineElement,
                unobserve: unobservePin,
                processingTime,
                createdAt: new Date().toISOString(),
                phase: 'Phase 1'
            };
            
            console.log('✅ Phase 1-12: pinConfig作成完了', {
                hasId: !!pinConfig.id,
                hasUnobserve: !!pinConfig.unobserve,
                unobserveType: typeof pinConfig.unobserve,
                phase: pinConfig.phase,
                processingTime: pinConfig.processingTime,
                allKeys: Object.keys(pinConfig)
            });
            
            console.log('🔍 Phase 1-13: pinConfig返却直前', pinConfig);
            
            return pinConfig;
            
        } catch (error) {
            console.error('❌ Phase 1-14: createAutoPin実行中エラー発生', {
                errorMessage: error.message,
                errorStack: error.stack,
                errorName: error.name,
                processingTime: performance.now() - startTime
            });
            
            // パフォーマンス統計更新（失敗）
            this.performanceMetrics.failureCount++;
            
            const errorResult = {
                success: false,
                fallbackMode: true,
                message: 'Phase 1 ElementObserver統合でエラーが発生しました',
                error: error.message,
                config: config
            };
            
            console.log('🔍 Phase 1-15: エラー結果返却', errorResult);
            
            return errorResult;
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
        let initialAnchorPosition = null;
        
        return {
            calculate: (rect) => {
                const currentAnchorPosition = {
                    x: rect.left + (rect.width * anchorCoords.x),
                    y: rect.top + (rect.height * anchorCoords.y)
                };
                
                // 初回時は基準位置として記録
                if (!initialAnchorPosition) {
                    initialAnchorPosition = { ...currentAnchorPosition };
                    console.log('🎯 初期アンカー位置を記録:', initialAnchorPosition);
                    return {
                        x: 0, // 初回は移動なし
                        y: 0,
                        anchor: anchor,
                        rect: rect,
                        isInitial: true
                    };
                }
                
                // 相対移動量を計算
                const deltaX = currentAnchorPosition.x - initialAnchorPosition.x;
                const deltaY = currentAnchorPosition.y - initialAnchorPosition.y;
                
                console.log('🔄 相対移動計算:', {
                    initial: initialAnchorPosition,
                    current: currentAnchorPosition,
                    delta: { x: deltaX, y: deltaY }
                });
                
                return {
                    x: deltaX,
                    y: deltaY,
                    anchor: anchor,
                    rect: rect,
                    isInitial: false
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
        
        // 初回時は位置変更なし
        if (anchorPosition.isInitial) {
            console.log('🎯 初回AutoPin設定 - 位置変更スキップ');
            return;
        }
        
        try {
            // 相対移動が微小な場合はスキップ（ノイズ除去）
            const threshold = 1.0;
            if (Math.abs(anchorPosition.x) < threshold && Math.abs(anchorPosition.y) < threshold) {
                return;
            }
            
            console.log('🔄 相対移動適用開始:', {
                deltaX: anchorPosition.x.toFixed(1),
                deltaY: anchorPosition.y.toFixed(1),
                anchor: anchorPosition.anchor
            });
            
            // 🎯 既存の位置システムとの連携を優先
            // CSS Transformを直接変更せず、既存システム経由で位置調整
            
            // CanvasResizeUI経由での位置調整を試行
            if (typeof window.postMessage === 'function') {
                window.postMessage({
                    type: 'AUTOPIN_POSITION_ADJUSTMENT',
                    deltaX: anchorPosition.x,
                    deltaY: anchorPosition.y,
                    elementId: spineElement.id,
                    anchor: anchorPosition.anchor
                }, '*');
                
                console.log('📡 AutoPin位置調整メッセージ送信完了');
            }
            
            // フォールバック: 最小限のCSS Transform調整
            const currentTransform = spineElement.style.transform || '';
            if (currentTransform.includes('translate')) {
                // 既存のtranslate値を取得して相対調整
                const translateMatch = currentTransform.match(/translate\(([^)]+)\)/);
                if (translateMatch) {
                    const [currentX, currentY] = translateMatch[1].split(',').map(v => parseFloat(v) || 0);
                    const newX = currentX + anchorPosition.x;
                    const newY = currentY + anchorPosition.y;
                    
                    const newTransform = currentTransform.replace(
                        /translate\([^)]+\)/, 
                        `translate(${newX}px, ${newY}px)`
                    );
                    spineElement.style.transform = newTransform;
                    
                    console.log('🎯 CSS Transform相対調整適用:', {
                        from: `${currentX}, ${currentY}`,
                        to: `${newX}, ${newY}`
                    });
                }
            }
            
        } catch (error) {
            console.error('❌ Spine相対位置適用エラー:', error);
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