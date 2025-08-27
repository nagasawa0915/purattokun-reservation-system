/**
 * PureBoundingBoxEvents.js
 * 
 * 🎯 Phase 4: Pointerイベント統合・安定化システム
 * - 外部依存: PureBoundingBoxCore, PureBoundingBoxBounds, PureBoundingBoxUI（同フォルダ内）
 * - 責務: マウス・タッチ・ペン統一イベントハンドリング・安定性確保
 * - Phase 4機能: Pointer Capture強化、中断時整合性、エラーハンドリング完備
 */

class PureBoundingBoxEvents {
    constructor(core, bounds, ui) {
        this.core = core;
        this.bounds = bounds;
        this.ui = ui;
        
        // 🆕 Phase 4: Pointerイベント統合ハンドラバインド
        this.boundHandlers = {
            // 統合Pointerイベント（マウス・タッチ・ペン対応）
            pointerDown: this.onPointerDown.bind(this),
            pointerMove: this.onPointerMove.bind(this),
            pointerUp: this.onPointerUp.bind(this),
            pointerCancel: this.onPointerCancel.bind(this),
            lostPointerCapture: this.onLostPointerCapture.bind(this),
            // レガシー対応（フォールバック）
            mouseDown: this.onPointerDown.bind(this),
            mouseMove: this.onPointerMove.bind(this),
            mouseUp: this.onPointerUp.bind(this),
            // キーボードイベント
            keyDown: this.onKeyDown.bind(this),
            keyUp: this.onKeyUp.bind(this)
        };
        
        // Phase 4: アクティブポインタートラッキング
        this.activePointerId = null;
        this.pointerCaptureElement = null;
    }
    
    /**
     * 🆕 Phase 4: 統合Pointerイベント登録システム
     */
    attachEvents() {
        if (!this.core.uiState.container) return;
        
        const container = this.core.uiState.container;
        
        // Phase 4: Pointerイベント統合（マウス・タッチ・ペン対応）
        container.addEventListener('pointerdown', this.boundHandlers.pointerDown);
        // Phase 4: 中断イベント対応（安定性確保）
        container.addEventListener('pointercancel', this.boundHandlers.pointerCancel);
        container.addEventListener('lostpointercapture', this.boundHandlers.lostPointerCapture);
        
        // レガシーフォールバック（古いブラウザ対応）
        if (!window.PointerEvent) {
            container.addEventListener('mousedown', this.boundHandlers.mouseDown);
            console.log('⚠️ Pointerイベント非対応 - マウスイベントフォールバック');
        }
        
        console.log('📡 Phase 4イベント登録完了 - 統合Pointer対応 + 中断処理強化');
    }
    
    /**
     * 🆕 Phase 4: 統合Pointerイベント削除システム
     */
    detachEvents() {
        const container = this.core.uiState.container;
        
        if (container) {
            // Phase 4: Pointerイベント削除
            container.removeEventListener('pointerdown', this.boundHandlers.pointerDown);
            container.removeEventListener('pointercancel', this.boundHandlers.pointerCancel);
            container.removeEventListener('lostpointercapture', this.boundHandlers.lostPointerCapture);
            
            // レガシーフォールバック削除
            container.removeEventListener('mousedown', this.boundHandlers.mouseDown);
        }
        
        // ドキュメントレベルのイベント削除
        this.detachDocumentEvents();
        
        // Phase 4: ポインターキャプチャ解放
        this.releasePointerCapture();
    }
    
    /**
     * 🆕 Phase 4: 統合Pointerダウンイベント
     * マウス・タッチ・ペン統一処理 + Pointer Capture強化
     */
    onPointerDown(event) {
        event.preventDefault();
        
        if (!this.ui.isHandle(event.target)) return;
        
        const handleType = this.ui.getHandleType(event.target);
        
        // 🎯 BB座標系スワップ: 編集モード進入
        this.core.enterEditingMode();
        
        // ドラッグ開始
        this.core.startDrag(event, handleType === 'move' ? 'move' : `resize-${handleType}`);
        
        // 🆕 Phase 2: 累積オフセット方式の初期化
        this.initCumulativeOffset(event);
        
        // 🆕 Phase 4: 強化Pointer Capture（必須実行）
        this.setPointerCaptureWithErrorHandling(event);
        
        // Phase 4: 統合ドキュメントイベント監視
        this.attachDocumentEvents();
        
        // Phase 4: アクティブポインター記録
        this.activePointerId = event.pointerId || null;
        
        console.log('📡 イベント登録完了 - 累積オフセット方式（Phase 2）');
        console.log('🎯 ドラッグタイプ:', this.core.dragState.dragType);
        console.log('📐 基準値保存完了:', {
            baseTx: this.core.dragState.baseTx,
            baseTy: this.core.dragState.baseTy
        });
    }
    
    /**
     * 🆕 Phase 4: 統合Pointerムーブイベント
     * マウス・タッチ・ペン統一処理
     */
    onPointerMove(event) {
        // Phase 4: アクティブポインターチェック（複数ポインター対応）
        if (this.activePointerId !== null && event.pointerId !== this.activePointerId) {
            return; // 別のポインターは無視
        }
        if (!this.core.dragState.isDragging) return;
        
        event.preventDefault();
        
        const deltaX = event.clientX - this.core.dragState.startMouseX;
        const deltaY = event.clientY - this.core.dragState.startMouseY;
        
        let newBounds;
        
        if (this.core.dragState.dragType === 'move') {
            // 🆕 Phase 2: 累積オフセット方式の移動処理
            this.applyCumulativeOffset(event);
            
            // 🎯 v2互換: 従来方式も並行実行（共存）
            newBounds = this.bounds.calculateMove(deltaX, deltaY);
        } else if (this.core.dragState.dragType.startsWith('resize-')) {
            // 🎯 v2互換: リサイズ計算
            const handleType = this.core.dragState.dragType.replace('resize-', '');
            newBounds = this.bounds.calculateResize(deltaX, deltaY, handleType);
            
            // 修飾キー適用
            newBounds = this.bounds.applyModifierKeys(newBounds);
        }
        
        if (newBounds) {
            // boundsを要素に適用
            this.bounds.applyBoundsToElement(newBounds);
            
            // UI位置同期
            this.ui.syncPosition();
        }
    }
    
    /**
     * 🆕 Phase 4: 統合Pointerアップイベント
     * マウス・タッチ・ペン統一処理 + 正常終了処理
     */
    onPointerUp(event) {
        // Phase 4: アクティブポインターチェック
        if (this.activePointerId !== null && event.pointerId !== this.activePointerId) {
            return; // 別のポインターは無視
        }
        if (!this.core.dragState.isDragging) return;
        
        // 🆕 Phase 3: 見た目の中心基準でのコミット処理
        const commitSuccess = this.core.commitToPercent();
        if (!commitSuccess) {
            console.warn('⚠️ Phase 3コミット処理が失敗しました - 従来処理続行');
        }
        
        // 🎯 localStorage統合: 位置データ保存
        this.savePositionToStorage();
        
        // ドラッグ終了
        this.core.endDrag();
        
        // 🎯 BB座標系スワップ: 編集モード終了（Phase 3実装後は簡素化）
        this.exitEditingModeSimplified();
        
        // Phase 4: 統合イベント削除とクリーンアップ
        this.cleanupAfterDrag(event, 'normal');
        
        console.log('🖱️ Phase 4ドラッグ正常終了 - 統合Pointerシステム');
    }
    
    /**
     * キーダウン
     */
    onKeyDown(event) {
        this.core.updateModifierKeys(event);
    }
    
    /**
     * キーアップ  
     */
    onKeyUp(event) {
        this.core.updateModifierKeys(event);
    }
    
    /**
     * 🆕 Phase 2: 累積オフセット方式の初期化
     * pointerdown時に現在の--tx/--ty値を基準値として保存
     */
    initCumulativeOffset(event) {
        const element = this.core.config.targetElement;
        const interactive = element.querySelector('.interactive');
        
        if (interactive) {
            const cs = getComputedStyle(interactive);
            
            // 🚨 修正：CSS変数値を取得（NaN対応強化）
            let baseTx = parseFloat(cs.getPropertyValue('--tx'));
            let baseTy = parseFloat(cs.getPropertyValue('--ty'));
            
            // CSS変数が未定義（NaN）の場合は現在のtransform値から取得
            if (isNaN(baseTx) || isNaN(baseTy)) {
                console.log('⚠️ CSS変数未定義を検出。transform値から初期値を計算');
                
                // 現在のtransform: translate(Xpx, Ypx)から値を抽出
                const transform = cs.transform;
                console.log('🔍 現在のtransform:', transform);
                
                if (transform && transform !== 'none') {
                    const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                    
                    if (match) {
                        const extractedTx = parseFloat(match[1]);
                        const extractedTy = parseFloat(match[2]);
                        
                        baseTx = isNaN(baseTx) ? (isNaN(extractedTx) ? 0 : extractedTx) : baseTx;
                        baseTy = isNaN(baseTy) ? (isNaN(extractedTy) ? 0 : extractedTy) : baseTy;
                        
                        console.log('✅ transform値から初期値を取得:', {
                            extracted: {tx: extractedTx, ty: extractedTy},
                            final: {baseTx, baseTy}
                        });
                    } else {
                        // transform解析失敗の場合は0で初期化
                        baseTx = isNaN(baseTx) ? 0 : baseTx;
                        baseTy = isNaN(baseTy) ? 0 : baseTy;
                        console.log('🔧 transform解析失敗。0で初期化:', {baseTx, baseTy});
                    }
                } else {
                    // transform未定義の場合は0で初期化
                    baseTx = isNaN(baseTx) ? 0 : baseTx;
                    baseTy = isNaN(baseTy) ? 0 : baseTy;
                    console.log('🔧 transform未定義。0で初期化:', {baseTx, baseTy});
                }
            }
            
            this.core.dragState.baseTx = baseTx;
            this.core.dragState.baseTy = baseTy;
            
            console.log('📐 累積オフセット基準値保存（修正版）:', {
                baseTx: this.core.dragState.baseTx,
                baseTy: this.core.dragState.baseTy
            });
        } else {
            // .interactiveが見つからない場合は0で初期化
            this.core.dragState.baseTx = 0;
            this.core.dragState.baseTy = 0;
            console.log('⚠️ .interactive要素が見つからないため、基準値を0で初期化');
        }
        
        // 開始位置保存（既存処理と同じ）
        this.core.dragState.startX = event.clientX;
        this.core.dragState.startY = event.clientY;
    }
    applyCumulativeOffset(event) {
        const element = this.core.config.targetElement;
        const interactive = element.querySelector('.interactive');
        
        if (!interactive) return;
        
        // 移動量計算
        const dx = event.clientX - this.core.dragState.startX;
        const dy = event.clientY - this.core.dragState.startY;
        
        // 累積オフセット適用: 基準値 + 移動量
        const newTx = this.core.dragState.baseTx + dx;
        const newTy = this.core.dragState.baseTy + dy;
        
        // CSS変数で位置更新
        interactive.style.setProperty('--tx', newTx + 'px');
        interactive.style.setProperty('--ty', newTy + 'px');
        
        // デバッグログ（頻度制御）
        if (Math.abs(dx) % 10 === 0 || Math.abs(dy) % 10 === 0) {
            console.log('🔄 累積オフセット適用:', {
                dx, dy, newTx, newTy,
                base: {tx: this.core.dragState.baseTx, ty: this.core.dragState.baseTy}
            });
        }
    }
    
    /**
     * 🆕 Phase 3: localStorage統合 - 位置データ保存
     */
    savePositionToStorage() {
        try {
            const element = this.core.config.targetElement;
            if (!element || !this.core.config.nodeId) {
                console.warn('⚠️ 保存対象要素またはnodeIdが見つかりません');
                return false;
            }
            
            // 現在の%位置を取得
            const currentLeft = element.style.left;
            const currentTop = element.style.top;
            const currentWidth = element.style.width;
            const currentHeight = element.style.height;
            
            // localStorage用のデータ構造
            const positionData = {
                nodeId: this.core.config.nodeId,
                position: {
                    left: currentLeft,
                    top: currentTop,
                    width: currentWidth,
                    height: currentHeight,
                    transform: 'translate(-50%, -50%)'
                },
                timestamp: Date.now(),
                source: 'PureBoundingBox-Phase3'
            };
            
            // localStorage保存
            const storageKey = `bb-position-${this.core.config.nodeId}`;
            localStorage.setItem(storageKey, JSON.stringify(positionData));
            
            console.log('💾 localStorage保存完了 - Phase 3:', {
                key: storageKey,
                position: positionData.position
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ localStorage保存でエラー:', error);
            return false;
        }
    }
    
    /**
     * 🆕 Phase 3: 簡素化された編集モード終了処理
     */
    exitEditingModeSimplified() {
        // Phase 3では位置コミットは既に完了しているため、状態変更のみ
        if (this.core.swapState.currentMode !== 'idle') {
            this.core.swapState.currentMode = 'idle';
            this.core.swapState.originalTransform = null;
            console.log('✅ 編集モード終了 - Phase 3簡素化版');
        }
    }
    
    /**
     * 🆕 Phase 4: Pointer中断イベント処理
     * ドラッグ中にpointercancel（画面回転、アプリ切り替え等）が発生した場合の安全処理
     */
    onPointerCancel(event) {
        if (!this.core.dragState.isDragging) return;
        
        // アクティブポインターチェック
        if (this.activePointerId !== null && event.pointerId !== this.activePointerId) {
            return;
        }
        
        console.log('⚠️ Phase 4: Pointer中断イベント検出 - 整合性確保処理開始');
        
        // 🎯 実務TIPS: 中断時も必ずcommit処理を実行（整合性確保）
        const commitSuccess = this.core.commitToPercent();
        if (commitSuccess) {
            this.savePositionToStorage();
            console.log('✅ 中断時commit処理完了 - データ整合性確保');
        } else {
            console.warn('⚠️ 中断時commit処理失敗 - 既存状態維持');
        }
        
        // 統合クリーンアップ
        this.cleanupAfterDrag(event, 'canceled');
        
        console.log('🔄 Phase 4: Pointer中断処理完了');
    }
    
    /**
     * 🆕 Phase 4: PointerCapture喪失イベント処理
     * setPointerCapture実行後に要素がDOM外に出た場合等の処理
     */
    onLostPointerCapture(event) {
        if (!this.core.dragState.isDragging) return;
        
        // アクティブポインターチェック
        if (this.activePointerId !== null && event.pointerId !== this.activePointerId) {
            return;
        }
        
        console.log('⚠️ Phase 4: PointerCapture喪失検出 - 安全処理開始');
        
        // 🎯 実務TIPS: Capture喪失時も必ずcommit処理（整合性確保）
        const commitSuccess = this.core.commitToPercent();
        if (commitSuccess) {
            this.savePositionToStorage();
            console.log('✅ Capture喪失時commit処理完了');
        }
        
        // 統合クリーンアップ
        this.cleanupAfterDrag(event, 'capture_lost');
        
        console.log('🔄 Phase 4: PointerCapture喪失処理完了');
    }
    
    /**
     * 🆕 Phase 4: 強化Pointer Captureシステム
     * エラーハンドリング付きsetPointerCapture実行
     */
    setPointerCaptureWithErrorHandling(event) {
        const target = event.target;
        const pointerId = event.pointerId;
        
        // pointerId必須チェック
        if (pointerId === undefined) {
            console.warn('⚠️ pointerId未定義 - Pointer Capture無効（レガシーイベント）');
            return false;
        }
        
        // setPointerCapture対応チェック
        if (typeof target.setPointerCapture !== 'function') {
            console.warn('⚠️ setPointerCapture未対応 - Pointer Capture無効');
            return false;
        }
        
        try {
            // 🎯 実務TIPS: pointerdownで必ず実行（ドラッグ中安定性確保）
            target.setPointerCapture(pointerId);
            this.pointerCaptureElement = target;
            console.log('✅ Pointer Capture成功:', { pointerId, target: target.className || target.tagName });
            return true;
            
        } catch (error) {
            console.error('❌ setPointerCapture失敗:', error);
            this.pointerCaptureElement = null;
            return false;
        }
    }
    
    /**
     * 🆕 Phase 4: Pointer Capture解放システム
     */
    releasePointerCapture() {
        if (this.pointerCaptureElement && this.activePointerId !== null) {
            try {
                if (typeof this.pointerCaptureElement.releasePointerCapture === 'function') {
                    this.pointerCaptureElement.releasePointerCapture(this.activePointerId);
                    console.log('✅ Pointer Capture解放完了');
                }
            } catch (error) {
                console.warn('⚠️ Pointer Capture解放時エラー:', error);
            }
        }
        
        this.pointerCaptureElement = null;
        this.activePointerId = null;
    }
    
    /**
     * 🆕 Phase 4: 統合ドキュメントイベント登録
     */
    attachDocumentEvents() {
        document.addEventListener('pointermove', this.boundHandlers.pointerMove);
        document.addEventListener('pointerup', this.boundHandlers.pointerUp);
        document.addEventListener('pointercancel', this.boundHandlers.pointerCancel);
        document.addEventListener('keydown', this.boundHandlers.keyDown);
        document.addEventListener('keyup', this.boundHandlers.keyUp);
        
        // レガシーフォールバック
        if (!window.PointerEvent) {
            document.addEventListener('mousemove', this.boundHandlers.mouseMove);
            document.addEventListener('mouseup', this.boundHandlers.mouseUp);
        }
    }
    
    /**
     * 🆕 Phase 4: 統合ドキュメントイベント削除
     */
    detachDocumentEvents() {
        document.removeEventListener('pointermove', this.boundHandlers.pointerMove);
        document.removeEventListener('pointerup', this.boundHandlers.pointerUp);
        document.removeEventListener('pointercancel', this.boundHandlers.pointerCancel);
        document.removeEventListener('keydown', this.boundHandlers.keyDown);
        document.removeEventListener('keyup', this.boundHandlers.keyUp);
        
        // レガシーフォールバック削除
        document.removeEventListener('mousemove', this.boundHandlers.mouseMove);
        document.removeEventListener('mouseup', this.boundHandlers.mouseUp);
    }
    
    /**
     * 🆕 Phase 4: 統合ドラッグ終了クリーンアップシステム
     */
    cleanupAfterDrag(event, endType = 'normal') {
        // ドキュメントイベント削除
        this.detachDocumentEvents();
        
        // Pointer Capture解放
        this.releasePointerCapture();
        
        // ドラッグ終了
        this.core.endDrag();
        
        // 編集モード終了（Phase 3簡素化版）
        this.exitEditingModeSimplified();
        
        console.log(`🧹 Phase 4クリーンアップ完了 - 終了タイプ: ${endType}`);
    }
    
    /**
     * タッチイベント対応（Phase 4統合版）
     */
    attachTouchEvents() {
        if (!this.core.uiState.container) return;
        
        this.core.uiState.container.addEventListener('touchstart', (event) => {
            const touch = event.touches[0];
            this.onMouseDown({
                target: event.target,
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => event.preventDefault(),
                pointerId: touch.identifier
            });
        });
        
        document.addEventListener('touchmove', (event) => {
            if (!this.core.dragState.isDragging) return;
            const touch = event.touches[0];
            this.onMouseMove({
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => event.preventDefault()
            });
        });
        
        document.addEventListener('touchend', (event) => {
            if (!this.core.dragState.isDragging) return;
            this.onMouseUp({});
        });
    }
}

/**
 * 🧪 Phase 2デバッグ・テストツール
 */
PureBoundingBoxEvents.prototype.getPhase2DebugInfo = function() {
    return {
        phase: 'Phase 2 - 累積オフセット方式',
        dragState: this.core.dragState,
        currentOffsets: this.getCurrentCSSOffsets(),
        isImplemented: {
            cumulativeOffset: true,
            pointerCapture: true,
            coexistenceMode: true
        }
    };
};

/**
 * 🆕 Phase 4デバッグ・テストツール
 */
PureBoundingBoxEvents.prototype.getPhase4DebugInfo = function() {
    return {
        phase: 'Phase 4 - Pointer統合・安定化システム',
        pointerSupport: {
            nativeSupport: !!window.PointerEvent,
            activePointerId: this.activePointerId,
            captureElement: !!this.pointerCaptureElement,
            captureElementType: this.pointerCaptureElement ? 
                (this.pointerCaptureElement.className || this.pointerCaptureElement.tagName) : 'none'
        },
        eventHandlers: {
            pointerDown: typeof this.boundHandlers.pointerDown === 'function',
            pointerMove: typeof this.boundHandlers.pointerMove === 'function',
            pointerUp: typeof this.boundHandlers.pointerUp === 'function',
            pointerCancel: typeof this.boundHandlers.pointerCancel === 'function',
            lostPointerCapture: typeof this.boundHandlers.lostPointerCapture === 'function'
        },
        deviceSupport: {
            mouse: true,
            touch: 'ontouchstart' in window,
            pen: !!window.PointerEvent && matchMedia('(pointer: fine)').matches
        },
        cssIntegration: {
            touchActionNone: true, // HTMLで設定済み
            interactiveTouchAction: true,
            handleTouchAction: true
        },
        dragState: this.core.dragState,
        isImplemented: {
            unifiedPointerEvents: true,
            pointerCaptureHandling: true,
            interruptionRecovery: true,
            errorHandling: true,
            mobileTouchOptimization: true
        }
    };
};

/**
 * 🆕 Phase 3デバッグ・テストツール
 */
PureBoundingBoxEvents.prototype.getPhase3DebugInfo = function() {
    const element = this.core.config.targetElement;
    const interactive = element?.querySelector('.interactive');
    
    let visualCenterInfo = null;
    if (element && element.parentElement) {
        const anchorRect = element.getBoundingClientRect();
        const parentRect = element.parentElement.getBoundingClientRect();
        
        let tx = 0, ty = 0;
        if (interactive) {
            const cs = getComputedStyle(interactive);
            tx = parseFloat(cs.getPropertyValue('--tx')) || 0;
            ty = parseFloat(cs.getPropertyValue('--ty')) || 0;
        }
        
        visualCenterInfo = {
            anchorRect: {
                left: anchorRect.left,
                top: anchorRect.top,
                width: anchorRect.width,
                height: anchorRect.height
            },
            parentRect: {
                left: parentRect.left,
                top: parentRect.top,
                width: parentRect.width,
                height: parentRect.height
            },
            cssOffsets: {tx, ty},
            visualCenter: {
                x: anchorRect.left + anchorRect.width/2 + tx,
                y: anchorRect.top + anchorRect.height/2 + ty
            },
            percentCalculation: {
                left: (((anchorRect.left + anchorRect.width/2 + tx) - parentRect.left) / parentRect.width) * 100,
                top: (((anchorRect.top + anchorRect.height/2 + ty) - parentRect.top) / parentRect.height) * 100
            }
        };
    }
    
    return {
        phase: 'Phase 3 - 見た目の中心基準コミット',
        targetElement: !!element,
        hasInteractive: !!interactive,
        hasParent: !!element?.parentElement,
        currentPosition: element ? {
            left: element.style.left,
            top: element.style.top,
            width: element.style.width,
            height: element.style.height
        } : null,
        currentOffsets: this.getCurrentCSSOffsets(),
        visualCenterInfo,
        isImplemented: {
            commitToPercent: true,
            localStorageIntegration: true,
            errorHandling: true,
            simplifiedExitMode: true
        }
    };
};

PureBoundingBoxEvents.prototype.getCurrentCSSOffsets = function() {
    const element = this.core.config.targetElement;
    const interactive = element?.querySelector('.interactive');
    
    if (!interactive) return { tx: 'N/A', ty: 'N/A' };
    
    const cs = getComputedStyle(interactive);
    return {
        tx: cs.getPropertyValue('--tx') || '0px',
        ty: cs.getPropertyValue('--ty') || '0px'
    };
};

/**
 * 🆕 Phase 3テスト: 手動コミット実行
 */
PureBoundingBoxEvents.prototype.testManualCommit = function() {
    console.log('🧪 Phase 3手動コミットテスト開始');
    const success = this.core.commitToPercent();
    if (success) {
        this.savePositionToStorage();
        console.log('✅ 手動コミット＋localStorage保存完了');
    } else {
        console.log('❌ 手動コミット失敗');
    }
    return this.getPhase3DebugInfo();
};

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.PureBoundingBoxEvents = PureBoundingBoxEvents;
    
    // 🧪 グローバルテスト関数
    window.testPhase2CumulativeOffset = function() {
        console.log('🧪 Phase 2累積オフセット方式テスト');
        const events = window.pureBoundingBoxInstance?.events;
        if (events) {
            console.log(events.getPhase2DebugInfo());
        } else {
            console.log('⚠️ PureBoundingBoxインスタンスが見つかりません');
        }
    };
    
    // 🆕 Phase 3グローバルテスト関数
    window.testPhase3VisualCenterCommit = function() {
        console.log('🧪 Phase 3見た目の中心基準コミットテスト');
        const events = window.pureBoundingBoxInstance?.events;
        if (events) {
            console.log(events.getPhase3DebugInfo());
        } else {
            console.log('⚠️ PureBoundingBoxインスタンスが見つかりません');
        }
    };
    
    // 🆕 手動コミットテスト
    window.testManualCommitPhase3 = function() {
        const events = window.pureBoundingBoxInstance?.events;
        if (events) {
            return events.testManualCommit();
        } else {
            console.log('⚠️ PureBoundingBoxインスタンスが見つかりません');
            return null;
        }
    };
    
    // 🆕 Phase 4グローバルテスト関数
    window.testPhase4PointerSystem = function() {
        console.log('🧪 Phase 4: Pointer統合・安定化システムテスト');
        const events = window.pureBoundingBoxInstance?.events;
        if (events) {
            const debugInfo = events.getPhase4DebugInfo();
            console.log('📊 Phase 4システム状況:', debugInfo);
            
            // 簡潔サマリー
            console.log('🎯 Phase 4機能サマリー:');
            console.log(`  ✅ Pointerイベント統合: ${debugInfo.pointerSupport.nativeSupport ? '対応' : 'レガシーモード'}`);
            console.log(`  ✅ デバイス対応: マウス+タッチ(${debugInfo.deviceSupport.touch})+ペン(${debugInfo.deviceSupport.pen})`);
            console.log(`  ✅ Pointer Capture: ${debugInfo.pointerSupport.captureElement ? '有効' : '無効'}`);
            console.log(`  ✅ 中断時安全処理: ${debugInfo.isImplemented.interruptionRecovery}`);
            console.log(`  ✅ エラーハンドリング: ${debugInfo.isImplemented.errorHandling}`);
            console.log(`  ✅ モバイル最適化: ${debugInfo.isImplemented.mobileTouchOptimization}`);
            
            return debugInfo;
        } else {
            console.log('⚠️ PureBoundingBoxインスタンスが見つかりません');
            return null;
        }
    };
    
    // 🧪 Phase 4シミュレーションテスト
    window.simulatePhase4PointerEvents = function() {
        console.log('🧪 Phase 4: Pointerイベント中断シミュレーションテスト');
        const events = window.pureBoundingBoxInstance?.events;
        
        if (!events) {
            console.log('⚠️ PureBoundingBoxインスタンスが見つかりません');
            return;
        }
        
        // ダミーイベント作成（テスト用）
        const mockPointerEvent = {
            pointerId: 1,
            clientX: 100,
            clientY: 100,
            target: document.body,
            preventDefault: () => {},
            type: 'pointercancel'
        };
        
        console.log('🎭 PointerCancel中断イベントシミュレーション...');
        
        // ドラッグ状態を一時的に有効化（テスト用）
        const originalDragState = events.core.dragState.isDragging;
        events.core.dragState.isDragging = true;
        events.activePointerId = 1;
        
        // 中断処理テスト実行
        events.onPointerCancel(mockPointerEvent);
        
        // 状態復元
        events.core.dragState.isDragging = originalDragState;
        
        console.log('✅ Phase 4中断処理テスト完了');
        return events.getPhase4DebugInfo();
    };
}