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
        
        // 🆕 BB外クリック監視用
        this.documentClickHandler = this.onDocumentClick.bind(this);
        this.isListeningForOutsideClicks = false;
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
        
        // 🆕 BB外クリック監視開始
        this.startListeningForOutsideClicks();
        
        console.log('📡 Phase 4イベント登録完了 - 統合Pointer対応 + 中断処理強化 + BB外クリック監視');
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
        
        // 🆕 BB外クリック監視停止
        this.stopListeningForOutsideClicks();
        
        // Phase 4: ポインターキャプチャ解放
        this.releasePointerCapture();
    }
    
    /**
     * 🆕 Phase 4: 統合Pointerダウンイベント
     * マウス・タッチ・ペン統一処理 + Pointer Capture強化 + 🎯 クリック/ドラッグ区別
     */
    onPointerDown(event) {
        event.preventDefault();
        
        if (!this.ui.isHandle(event.target)) return;
        
        const handleType = this.ui.getHandleType(event.target);
        const timestamp = new Date().toISOString();
        
        console.log('📱 [EVENT] onPointerDown: BB操作開始', {
            timestamp: timestamp,
            nodeId: this.core.config.nodeId,
            handleType: handleType,
            dragType: handleType === 'move' ? 'move' : `resize-${handleType}`,
            eventCoords: {x: event.clientX, y: event.clientY},
            pointerId: event.pointerId || 'legacy'
        });
        
        // 🎯 瞬間移動問題修正: 編集モード開始を遅延（実際のドラッグ検出まで）
        // this.core.enterEditingMode(); // ← ここでは実行せず、onPointerMove初回で実行
        
        // ドラッグ開始準備（ただし、実際のドラッグはまだ開始しない）
        this.core.startDrag(event, handleType === 'move' ? 'move' : `resize-${handleType}`);
        
        // 🎯 実際のドラッグ開始フラグを追加
        this.actualDragStarted = false;
        
        // 🆕 Phase 2: 累積オフセット方式の初期化
        this.initCumulativeOffset(event);
        
        // 🆕 Phase 4: 強化Pointer Capture（必須実行）
        this.setPointerCaptureWithErrorHandling(event);
        
        // Phase 4: 統合ドキュメントイベント監視
        this.attachDocumentEvents();
        
        // Phase 4: アクティブポインター記録
        this.activePointerId = event.pointerId || null;
        
        console.log('✅ [EVENT] onPointerDown完了 - ドラッグ準備整了（編集モード遅延）', {
            timestamp: timestamp,
            dragStateInitialized: this.core.dragState.isDragging,
            editingModeActive: this.core.swapState.currentMode, // まだ'idle'のはず
            actualDragStarted: this.actualDragStarted,
            cumulativeOffsetBase: {
                baseTx: this.core.dragState.baseTx,
                baseTy: this.core.dragState.baseTy
            },
            pointerCaptureActive: !!this.pointerCaptureElement
        });
    }
    
    /**
     * 🆕 Phase 4: 統合Pointerムーブイベント
     * マウス・タッチ・ペン統一処理 + 🎯 実際のドラッグ検出
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
        
        // 🎯 実際のドラッグ検出（3px以上の移動で実ドラッグと判定）
        if (!this.actualDragStarted) {
            const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            if (dragDistance >= 3) { // 3px以上で実際のドラッグと判定
                console.log('🎯 [DRAG-DETECT] 実際のドラッグ開始を検出 - 編集モード開始', {
                    dragDistance: dragDistance,
                    threshold: 3
                });
                
                // 実際のドラッグ開始時に編集モード開始
                this.core.enterEditingMode();
                this.actualDragStarted = true;
            } else {
                // まだ移動量が小さい場合は何もしない（クリックの可能性）
                return;
            }
        }
        
        let newBounds;
        
        if (this.core.dragState.dragType === 'move') {
            // 🔧 Phase 1緊急修正: 従来方式のみ使用（安定動作優先）
            // 累積オフセット方式は無効化して従来の安定した方式を使用
            // this.applyCumulativeOffset(event);  // 無効化
            
            newBounds = this.bounds.calculateMove(deltaX, deltaY);
            
        } else if (this.core.dragState.dragType.startsWith('resize-')) {
            // 🎯 v2互換: リサイズ計算（リサイズ時は従来方式維持）
            const handleType = this.core.dragState.dragType.replace('resize-', '');
            newBounds = this.bounds.calculateResize(deltaX, deltaY, handleType);
            
            // 修飾キー適用
            newBounds = this.bounds.applyModifierKeys(newBounds);
        }
        
        if (newBounds) {
            // boundsを要素に適用（リサイズ時のみ）
            this.bounds.applyBoundsToElement(newBounds);
            
            // UI位置同期
            this.ui.syncPosition();
        }
    }
    
    /**
     * 🆕 Phase 4: 統合Pointerアップイベント
     * マウス・タッチ・ペン統一処理 + 正常終了処理 + 🎯 クリック/ドラッグ区別
     */
    onPointerUp(event) {
        // Phase 4: アクティブポインターチェック
        if (this.activePointerId !== null && event.pointerId !== this.activePointerId) {
            return; // 別のポインターは無視
        }
        if (!this.core.dragState.isDragging) return;
        
        const timestamp = new Date().toISOString();
        
        console.log('🔴 [EVENT] onPointerUp: ドラッグ終了処理開始', {
            timestamp: timestamp,
            nodeId: this.core.config.nodeId,
            eventCoords: {x: event.clientX, y: event.clientY},
            pointerId: event.pointerId || 'legacy',
            activePointerId: this.activePointerId,
            actualDragStarted: this.actualDragStarted
        });
        
        let commitSuccess = true; // デフォルトは成功とする
        
        // 🎯 瞬間移動問題修正: 実際にドラッグが発生した場合のみcommitToPercent実行
        if (this.actualDragStarted) {
            console.log('🎯 [COMMIT] 実際のドラッグが発生 - commitToPercent実行');
            
            // 🆕 Phase 3: 見た目の中心基準でのコミット処理
            commitSuccess = this.core.commitToPercent();
            if (!commitSuccess) {
                console.warn('⚠️ Phase 3コミット処理が失敗しました - 従来処理続行');
            }
            
            // 🎯 localStorage統合: 位置データ保存
            this.savePositionToStorage();
            
            // 🎯 BB座標系スワップ: 編集モード終了（commitToPercentで既に座標変換済み）
            this.exitEditingModeSimplified(); // 二重変換防止
            
        } else {
            console.log('🎯 [SKIP] 単純クリック検出 - commitToPercent・座標変換をスキップ');
            // 単純クリックの場合は座標変換を行わない（瞬間移動防止）
            
            // ただし、編集モードに入っている場合は終了させる必要がある
            if (this.core.swapState.currentMode === 'editing') {
                this.exitEditingModeSimplified();
            }
        }
        
        // ドラッグ終了
        this.core.endDrag();
        
        // 実際のドラッグフラグをリセット
        this.actualDragStarted = false;
        
        // Phase 4: 統合イベント削除とクリーンアップ
        this.cleanupAfterDrag(event, 'normal');
        
        console.log('✅ [EVENT] onPointerUp完了 - 正常終了', {
            timestamp: timestamp,
            commitSuccess: commitSuccess,
            localStorageSaved: this.actualDragStarted, // 実際のドラッグ時のみ保存
            editingModeExited: this.core.swapState.currentMode === 'idle',
            finalCleanupCompleted: true,
            wasActualDrag: this.actualDragStarted
        });
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
     * 🎯 レイアウトタイミング問題解決: 初回BB編集開始時にレイアウト確定待機
     */
    initCumulativeOffset(event) {
        const timestamp = new Date().toISOString();
        const element = this.core.config.targetElement;
        const interactive = element.closest('.interactive') || 
                           element.parentElement?.closest('.interactive') ||
                           element.querySelector('.interactive');
        
        console.log('📍 [OFFSET] initCumulativeOffset: CSS変数初期化開始 - レイアウト確定待機', {
            timestamp: timestamp,
            nodeId: this.core.config.nodeId,
            hasInteractive: !!interactive,
            eventCoords: {x: event.clientX, y: event.clientY}
        });
        
        if (interactive) {
            // 🎯 レイアウト確定待機: ダブルrequestAnimationFrame（安全策）
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.performCSSVariableInitialization(interactive, timestamp, event);
                });
            });
        } else {
            // .interactiveが見つからない場合は0で初期化
            this.core.dragState.baseTx = 0;
            this.core.dragState.baseTy = 0;
            console.log('⚠️ [OFFSET] .interactive要素未発見 - 基準値を0で初期化', {
                timestamp: timestamp,
                fallbackBase: {baseTx: 0, baseTy: 0}
            });
            
            // 開始位置保存（既存処理と同じ）
            this.core.dragState.startX = event.clientX;
            this.core.dragState.startY = event.clientY;
        }
    }

    /**
     * 🆕 レイアウト確定後のCSS変数初期化処理
     */
    performCSSVariableInitialization(interactive, timestamp, event) {
        // 🎯 レイアウト強制確定: getBoundingClientRect()実行
        interactive.getBoundingClientRect();
        
        const cs = getComputedStyle(interactive);
        
        // 🚨 修正：CSS変数値を取得（NaN対応強化）
        let baseTx = parseFloat(cs.getPropertyValue('--tx'));
        let baseTy = parseFloat(cs.getPropertyValue('--ty'));
        
        const txRaw = cs.getPropertyValue('--tx') || 'undefined';
        const tyRaw = cs.getPropertyValue('--ty') || 'undefined';
        
        const originalCssVars = {
            tx: txRaw,
            ty: tyRaw,
            txParsed: parseFloat(txRaw),
            tyParsed: parseFloat(tyRaw),
            bothNaN: isNaN(baseTx) && isNaN(baseTy)
        };
        
        // CSS変数が未定義（NaN）の場合は現在のtransform値から取得
        if (isNaN(baseTx) || isNaN(baseTy)) {
            console.log('⚠️ [OFFSET] CSS変数未定義を検出 - transform解析開始（レイアウト確定後）', originalCssVars);
            
            // 現在のtransform: translate(Xpx, Ypx)から値を抽出
            const transform = cs.transform;
            
            if (transform && transform !== 'none') {
                const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                
                if (match) {
                    const extractedTx = parseFloat(match[1]);
                    const extractedTy = parseFloat(match[2]);
                    
                    baseTx = isNaN(baseTx) ? (isNaN(extractedTx) ? 0 : extractedTx) : baseTx;
                    baseTy = isNaN(baseTy) ? (isNaN(extractedTy) ? 0 : extractedTy) : baseTy;
                    
                    console.log('✅ [OFFSET] transform解析成功（レイアウト確定後）', {
                        transform: transform,
                        extracted: {tx: extractedTx, ty: extractedTy},
                        final: {baseTx, baseTy}
                    });
                } else {
                    // transform解析失敗の場合は0で初期化
                    baseTx = isNaN(baseTx) ? 0 : baseTx;
                    baseTy = isNaN(baseTy) ? 0 : baseTy;
                    console.log('⚠️ [OFFSET] transform解析失敗 - 0で初期化（レイアウト確定後）', {
                        transform: transform,
                        fallback: {baseTx, baseTy}
                    });
                }
            } else {
                // transform未定義の場合は0で初期化
                baseTx = isNaN(baseTx) ? 0 : baseTx;
                baseTy = isNaN(baseTy) ? 0 : baseTy;
                console.log('⚠️ [OFFSET] transform未定義 - 0で初期化（レイアウト確定後）', {baseTx, baseTy});
            }
        }
        
        this.core.dragState.baseTx = baseTx;
        this.core.dragState.baseTy = baseTy;
        
        console.log('✅ [OFFSET] 累積オフセット基準値保存完了 - レイアウト確定待機版', {
            timestamp: timestamp,
            originalCssVars: originalCssVars,
            finalBase: {
                baseTx: this.core.dragState.baseTx,
                baseTy: this.core.dragState.baseTy
            },
            initializationMethod: originalCssVars.bothNaN ? 'transform-parsing' : 'css-variables',
            layoutWaitFrames: 2 // ダブルrequestAnimationFrame実行済み
        });
        
        // 開始位置保存（既存処理と同じ）
        this.core.dragState.startX = event.clientX;
        this.core.dragState.startY = event.clientY;
    }
    applyCumulativeOffset(event) {
        const element = this.core.config.targetElement;
        const interactive = element.closest('.interactive') || 
                           element.parentElement?.closest('.interactive') ||
                           element.querySelector('.interactive');
        
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
        document.addEventListener('pointermove', this.boundHandlers.pointerMove, { passive: false });
        document.addEventListener('pointerup', this.boundHandlers.pointerUp);
        document.addEventListener('pointercancel', this.boundHandlers.pointerCancel);
        document.addEventListener('keydown', this.boundHandlers.keyDown);
        document.addEventListener('keyup', this.boundHandlers.keyUp);
        
        // レガシーフォールバック
        if (!window.PointerEvent) {
            document.addEventListener('mousemove', this.boundHandlers.mouseMove, { passive: false });
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
        
        // 編集モード終了（状態リセットのみ - 他で座標変換済み）
        this.exitEditingModeSimplified(); // 二重変換防止
        
        console.log(`🧹 Phase 4クリーンアップ完了 - 終了タイプ: ${endType}`);
    }
    
    /**
     * 🆕 BB外クリック監視開始
     */
    startListeningForOutsideClicks() {
        if (!this.isListeningForOutsideClicks) {
            // 少し遅延させてdocumentに登録（イベントバブリングを避ける）
            setTimeout(() => {
                document.addEventListener('click', this.documentClickHandler, true);
                this.isListeningForOutsideClicks = true;
                console.log('👁️ [CLICK-MONITOR] BB外クリック監視開始', {
                    timestamp: new Date().toISOString(),
                    nodeId: this.core.config.nodeId,
                    delay: '50ms'
                });
            }, 50);
        }
    }
    
    /**
     * 🆕 BB外クリック監視停止
     */
    stopListeningForOutsideClicks() {
        if (this.isListeningForOutsideClicks) {
            document.removeEventListener('click', this.documentClickHandler, true);
            this.isListeningForOutsideClicks = false;
            console.log('👁️ BB外クリック監視停止');
        }
    }
    
    /**
     * 🆕 document全体のクリック処理（BB外判定）
     */
    onDocumentClick(event) {
        // BB表示中でない場合は何もしない
        if (!this.core.uiState.visible || !this.core.uiState.container) {
            return;
        }
        
        // ドラッグ中は無視
        if (this.core.dragState.isDragging) {
            return;
        }
        
        // クリック位置がBB要素内かチェック
        const isClickInsideBB = this.isClickInsideBoundingBox(event.target, event.clientX, event.clientY);
        
        if (!isClickInsideBB) {
            console.log('🎯 BB外クリック検出 - 選択解除処理開始');
            this.deselectBoundingBox();
        }
    }
    
    /**
     * 🆕 クリック位置がBB内かどうか判定
     */
    isClickInsideBoundingBox(target, clientX, clientY) {
        // 1. BB要素内のクリックかチェック
        if (this.core.uiState.container.contains(target)) {
            return true;
        }
        
        // 2. 対象要素自体のクリックかチェック
        if (this.core.config.targetElement.contains(target)) {
            return true;
        }
        
        // 3. 座標による判定（より正確）
        const bbRect = this.core.uiState.container.getBoundingClientRect();
        const isInsideRect = (
            clientX >= bbRect.left && 
            clientX <= bbRect.right && 
            clientY >= bbRect.top && 
            clientY <= bbRect.bottom
        );
        
        return isInsideRect;
    }
    
    /**
     * 🆕 BB選択解除処理（本番環境互換）
     */
    deselectBoundingBox() {
        const timestamp = new Date().toISOString();
        
        console.log('🔄 [DESELECT] BB選択解除開始 - px→%スワップ実行', {
            timestamp: timestamp,
            nodeId: this.core.config.nodeId,
            currentMode: this.core.swapState.currentMode,
            isDragging: this.core.dragState.isDragging
        });
        
        // 1. Phase 3座標スワップ実行（px→%変換）
        const commitSuccess = this.core.commitToPercent();
        if (commitSuccess) {
            console.log('✅ [DESELECT] 座標コミット完了 - px→%変換成功');
            
            // 2. localStorage統合：位置データ保存
            this.savePositionToStorage();
            
        } else {
            console.warn('⚠️ [DESELECT] 座標コミット失敗 - 選択解除継続');
        }
        
        // 3. 編集モード終了（状態リセットのみ - commitToPercentで既に座標変換済み）
        this.exitEditingModeSimplified(); // 二重変換防止
        
        // 4. BB表示制御
        this.core.uiState.container.style.display = 'none';
        this.core.uiState.visible = false;
        
        // 5. BB外クリック監視停止
        this.stopListeningForOutsideClicks();
        
        console.log('✅ [DESELECT] BB選択解除完了 - 本番環境互換動作', {
            timestamp: timestamp,
            commitSuccess: commitSuccess,
            editingModeExited: this.core.swapState.currentMode === 'idle',
            bbHidden: !this.core.uiState.visible,
            clickMonitorStopped: !this.isListeningForOutsideClicks
        });
        
        // 6. カスタムイベント発火（外部システム連携用）
        this.dispatchDeselectEvent();
    }
    
    /**
     * 🆕 選択解除イベント発火（外部システム連携用）
     */
    dispatchDeselectEvent() {
        const event = new CustomEvent('boundingBoxDeselected', {
            detail: {
                nodeId: this.core.config.nodeId,
                targetElement: this.core.config.targetElement,
                finalPosition: {
                    left: this.core.config.targetElement.style.left,
                    top: this.core.config.targetElement.style.top,
                    width: this.core.config.targetElement.style.width,
                    height: this.core.config.targetElement.style.height
                },
                timestamp: Date.now()
            }
        });
        
        document.dispatchEvent(event);
        console.log('📡 boundingBoxDeselectedイベント発火', event.detail);
    }
    
    /**
     * タッチイベント対応（Phase 4統合版）
     */
    attachTouchEvents() {
        if (!this.core.uiState.container) return;
        
        this.core.uiState.container.addEventListener('touchstart', (event) => {
            const touch = event.touches[0];
            this.onPointerDown({
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
            this.onPointerMove({
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => event.preventDefault(),
                pointerId: touch.identifier
            });
        }, { passive: false });
        
        document.addEventListener('touchend', (event) => {
            if (!this.core.dragState.isDragging) return;
            this.onPointerUp({
                pointerId: event.changedTouches[0]?.identifier
            });
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
    const interactive = element?.closest('.interactive') || 
                       element?.parentElement?.closest('.interactive') ||
                       element?.querySelector('.interactive');
    
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
    const interactive = element?.closest('.interactive') || 
                       element?.parentElement?.closest('.interactive') ||
                       element?.querySelector('.interactive');
    
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