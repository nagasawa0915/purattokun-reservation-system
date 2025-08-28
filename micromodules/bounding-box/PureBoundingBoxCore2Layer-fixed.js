/**
 * PureBoundingBoxCore.js
 * 
 * 🎯 核心データ・状態管理マイクロモジュール
 * - 外部依存: なし
 * - 責務: データ構造・状態管理・基本計算のみ
 */

class PureBoundingBoxCore {
    constructor(config) {
        // 設定
        this.config = {
            targetElement: config.targetElement,
            nodeId: config.nodeId || 'bb-' + Date.now(),
            minWidth: config.minWidth || 20,
            minHeight: config.minHeight || 20
        };
        
        // 🎯 Transform座標系（通常時）
        this.transform = {
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            rotation: 0
        };
        
        // 🎯 Bounds座標系（編集時）
        this.bounds = {
            x: 0,
            y: 0,
            width: 100,
            height: 100
        };
        
        // スワップ状態
        this.swapState = {
            currentMode: 'idle', // 'idle' | 'editing'
            originalTransform: null
        };
        
        // ドラッグ状態
        this.dragState = {
            isDragging: false,
            dragType: null,
            startMouseX: 0,
            startMouseY: 0,
            startBoundsX: 0,
            startBoundsY: 0,
            startBoundsWidth: 0,
            startBoundsHeight: 0,
            modifierKeys: {shift: false, alt: false, ctrl: false},
            // 🆕 Phase 2: 累積オフセット方式の状態
            baseTx: 0,
            baseTy: 0,
            startX: 0,
            startY: 0
        };
        
        // UI状態
        this.uiState = {
            visible: false,
            container: null,
            handles: []
        };
    }
    
    /**
     * 🎯 BB座標系スワップ: Transform → Bounds
     * 🔧 CSS Transform中心基準補正の競合解決
     */
    enterEditingMode() {
        if (this.swapState.currentMode === 'editing') return;
        
        const timestamp = new Date().toISOString();
        const element = this.config.targetElement;
        const interactive = element.querySelector('.interactive');
        
        // スワップ前の状態を詳細に記録
        const beforeState = this.captureDetailedState('BEFORE_ENTER_EDITING', timestamp);
        
        console.log('🔄 [SWAP] enterEditingMode: CSS Transform競合解決開始', {
            timestamp: timestamp,
            nodeId: this.config.nodeId,
            attempt: this.getSwapAttemptCount(),
            beforeState: beforeState
        });
        
        // 🎯 CSS Transform中心基準補正のバックアップと一時無効化
        this.swapState.originalTransform = {
            left: element.style.left,
            top: element.style.top,
            width: element.style.width,
            height: element.style.height,
            transform: element.style.transform
        };
        
        // 🔧 CSS Transform中心基準補正を一時的に無効化
        // transform(-50%, -50%)による座標競合を回避
        const currentRect = element.getBoundingClientRect();
        const parentRect = element.parentElement.getBoundingClientRect();
        
        // 現在の視覚的位置を保持したままtransformを無効化
        const absoluteLeft = currentRect.left - parentRect.left;
        const absoluteTop = currentRect.top - parentRect.top;
        
        // 絶対座標でtransformなし状態に設定
        element.style.left = absoluteLeft + 'px';
        element.style.top = absoluteTop + 'px';
        element.style.transform = 'none'; // 中心基準補正を一時無効化
        
        // 編集モード開始
        this.swapState.currentMode = 'editing';
        
        // スワップ後の状態を詳細に記録
        const afterState = this.captureDetailedState('AFTER_ENTER_EDITING', timestamp);
        
        console.log('✅ [SWAP] enterEditingMode完了 - CSS Transform競合解決', {
            timestamp: timestamp,
            beforeAfterComparison: this.compareStates(beforeState, afterState),
            editingModeActive: this.swapState.currentMode === 'editing',
            transformConflictSolution: 'temp-disable-center-offset'
        });
        
        // 初回/2回目以降の判定ログ
        this.logSwapAttemptType();
    }
    
    /**
     * 🎯 BB座標系スワップ: Bounds → Transform
     * 🔧 CSS Transform中心基準補正の復元
     */
    exitEditingMode() {
        if (this.swapState.currentMode === 'idle') return;
        
        const timestamp = new Date().toISOString();
        const element = this.config.targetElement;
        const interactive = element.querySelector('.interactive');
        
        // スワップ前の状態を詳細に記録
        const beforeState = this.captureDetailedState('BEFORE_EXIT_EDITING', timestamp);
        
        console.log('🔄 [SWAP] exitEditingMode: CSS Transform中心基準復元開始', {
            timestamp: timestamp,
            nodeId: this.config.nodeId,
            beforeState: beforeState
        });
        
        // 🎯 編集後の絶対座標を取得（transformなし状態）
        const editedRect = element.getBoundingClientRect();
        const parentRect = element.parentElement.getBoundingClientRect();
        
        // 🔧 中心基準（transform(-50%, -50%)）での%座標に変換
        // 編集後の左上座標を中心基準の%座標に変換
        const centerX = editedRect.left + editedRect.width/2;
        const centerY = editedRect.top + editedRect.height/2;
        
        const newLeftPercent = ((centerX - parentRect.left) / parentRect.width) * 100;
        const newTopPercent = ((centerY - parentRect.top) / parentRect.height) * 100;
        const newWidthPercent = (editedRect.width / parentRect.width) * 100;
        const newHeightPercent = (editedRect.height / parentRect.height) * 100;
        
        // 🎯 元の形式（%値 + transform(-50%, -50%)中心基準補正）で適用
        element.style.left = newLeftPercent.toFixed(1) + '%';
        element.style.top = newTopPercent.toFixed(1) + '%';
        element.style.width = newWidthPercent.toFixed(1) + '%';
        element.style.height = newHeightPercent.toFixed(1) + '%';
        element.style.transform = 'translate(-50%, -50%)'; // 中心基準補正を復元
        
        // 状態をリセット
        this.swapState.currentMode = 'idle';
        this.swapState.originalTransform = null;
        
        // スワップ後の状態を詳細に記録
        const afterState = this.captureDetailedState('AFTER_EXIT_EDITING', timestamp);
        
        console.log('✅ [SWAP] exitEditingMode完了 - CSS Transform中心基準復元', {
            timestamp: timestamp,
            coordinateConversion: {
                from: 'px-absolute-no-transform',
                to: 'percent-center-based-transform',
                newValues: {
                    left: newLeftPercent.toFixed(1) + '%',
                    top: newTopPercent.toFixed(1) + '%',
                    width: newWidthPercent.toFixed(1) + '%',
                    height: newHeightPercent.toFixed(1) + '%',
                    transform: 'translate(-50%, -50%)'
                }
            },
            beforeAfterComparison: this.compareStates(beforeState, afterState),
            editingModeActive: this.swapState.currentMode === 'idle'
        });
    }
    
    /**
     * ドラッグ開始データ保存
     */
    startDrag(event, dragType) {
        const currentBounds = {...this.bounds};
        
        this.dragState = {
            isDragging: true,
            dragType: dragType,
            startMouseX: event.clientX,
            startMouseY: event.clientY,
            startBoundsX: currentBounds.x,
            startBoundsY: currentBounds.y,
            startBoundsWidth: currentBounds.width,
            startBoundsHeight: currentBounds.height,
            modifierKeys: {
                shift: event.shiftKey,
                alt: event.altKey,
                ctrl: event.ctrlKey
            }
        };
    }
    
    /**
     * ドラッグ終了
     */
    endDrag() {
        this.dragState.isDragging = false;
    }
    
    /**
     * 修飾キー更新
     */
    updateModifierKeys(event) {
        if (this.dragState.isDragging) {
            this.dragState.modifierKeys.shift = event.shiftKey;
            this.dragState.modifierKeys.alt = event.altKey;
            this.dragState.modifierKeys.ctrl = event.ctrlKey;
        }
    }
    
    /**
     * 🆕 Phase 3: 見た目の中心基準のコミット処理
     * transform(-50%, -50%)を考慮した正確な%値再計算
     */
    commitToPercent() {
        const timestamp = new Date().toISOString();
        const element = this.config.targetElement;
        const interactive = element.querySelector('.interactive');
        
        if (!element || !element.parentElement) {
            console.warn('⚠️ コミット対象要素または親要素が見つかりません');
            return false;
        }
        
        // 親要素の条件チェック
        let parentRect = element.parentElement.getBoundingClientRect();
        
        // 🔍 親要素の詳細状態デバッグ情報（詳細版）
        console.log('🔍 [DEBUG] 親要素詳細状態:', {
            parentElement: element.parentElement?.tagName,
            parentClass: element.parentElement?.className,
            parentId: element.parentElement?.id,
            parentRect: {
                width: parentRect.width,
                height: parentRect.height,
                left: parentRect.left,
                top: parentRect.top
            },
            parentStyles: {
                display: getComputedStyle(element.parentElement).display,
                visibility: getComputedStyle(element.parentElement).visibility,
                width: getComputedStyle(element.parentElement).width,
                height: getComputedStyle(element.parentElement).height,
                minWidth: getComputedStyle(element.parentElement).minWidth,
                minHeight: getComputedStyle(element.parentElement).minHeight,
                position: getComputedStyle(element.parentElement).position
            },
            anchorElement: element.tagName,
            anchorClass: element.className,
            anchorId: element.id,
            anchorRect: {
                width: element.getBoundingClientRect().width,
                height: element.getBoundingClientRect().height
            },
            // DOM階層確認
            domPath: [
                element.tagName + (element.id ? '#' + element.id : '') + (element.className ? '.' + element.className.split(' ').join('.') : ''),
                element.parentElement?.tagName + (element.parentElement?.id ? '#' + element.parentElement.id : '') + (element.parentElement?.className ? '.' + element.parentElement.className.split(' ').join('.') : ''),
                element.parentElement?.parentElement?.tagName + (element.parentElement?.parentElement?.id ? '#' + element.parentElement?.parentElement?.id : '') + (element.parentElement?.parentElement?.className ? '.' + element.parentElement?.parentElement?.className.split(' ').join('.') : '')
            ]
        });
        
        if (parentRect.width === 0 || parentRect.height === 0) {
            console.warn('⚠️ 親要素のサイズが0のため、コミット処理をスキップ - 通常動作を保護');
            return false;
        }
        
        // コミット前の状態を詳細に記録
        const beforeCommitState = this.captureDetailedState('BEFORE_COMMIT', timestamp);
        
        console.log('🔄 [SWAP] commitToPercent: 見た目の中心基準変換開始', {
            timestamp: timestamp,
            nodeId: this.config.nodeId,
            attempt: this.getCommitAttemptCount(),
            beforeCommitState: beforeCommitState
        });
        
        try {
            // layout-anchorの現在の見た目の矩形（transform(-50%, -50%)反映後）
            const anchorRect = element.getBoundingClientRect();
            
            // 🎯 修正：CSS変数による追加オフセットを取得（堅牢版）
            let tx = 0, ty = 0;
            if (interactive) {
                const cs = getComputedStyle(interactive);
                const txRaw = cs.getPropertyValue('--tx');
                const tyRaw = cs.getPropertyValue('--ty');
                
                // 🎯 修正：より堅牢なCSS変数解析（NaN・空文字・undefined対策）
                tx = (txRaw && txRaw !== '' && txRaw !== 'undefined') ? parseFloat(txRaw) : 0;
                ty = (tyRaw && tyRaw !== '' && tyRaw !== 'undefined') ? parseFloat(tyRaw) : 0;
                
                // 二重チェック：NaN対策
                if (isNaN(tx)) tx = 0;
                if (isNaN(ty)) ty = 0;
                
                // 🔍 CSS変数の詳細状態デバッグ情報（修正版）
                console.log('🔍 [DEBUG] CSS変数詳細状態:', {
                    interactiveElement: interactive,
                    computedStyle: cs,
                    txRaw: txRaw,
                    tyRaw: tyRaw,
                    txParsed: tx,
                    tyParsed: ty,
                    robustParsing: {
                        txValid: txRaw && txRaw !== '' && txRaw !== 'undefined',
                        tyValid: tyRaw && tyRaw !== '' && tyRaw !== 'undefined'
                    },
                    allCustomProps: Object.fromEntries([...cs].filter(prop => prop.startsWith('--')).map(prop => [prop, cs.getPropertyValue(prop)]))
                });
            }
            
            // 見た目の中心を計算（transform + CSS変数オフセット）
            const visualCenterX = anchorRect.left + anchorRect.width/2 + tx;
            const visualCenterY = anchorRect.top + anchorRect.height/2 + ty;
            
            // 🔍 transform解析の詳細デバッグ情報
            if (interactive) {
                const cs = getComputedStyle(interactive);
                console.log('🔍 [DEBUG] transform解析詳細:', {
                    element: interactive,
                    transform: cs.transform,
                    matrix: cs.transform,
                    getAllTransforms: {
                        transform: cs.transform,
                        webkitTransform: cs.webkitTransform,
                        mozTransform: cs.mozTransform
                    }
                });
            }
            
            // 親要素基準での%値に変換
            const leftPct = ((visualCenterX - parentRect.left) / parentRect.width) * 100;
            const topPct = ((visualCenterY - parentRect.top) / parentRect.height) * 100;
            
            // layout-anchorに書き戻し
            element.style.left = leftPct.toFixed(2) + '%';
            element.style.top = topPct.toFixed(2) + '%';
            
            // CSS変数をリセット（ズレ蓄積防止）
            if (interactive) {
                interactive.style.setProperty('--tx', '0px');
                interactive.style.setProperty('--ty', '0px');
            }
            
            // コミット後の状態を詳細に記録
            const afterCommitState = this.captureDetailedState('AFTER_COMMIT', timestamp);
            
            console.log('✅ [SWAP] commitToPercent完了 - 見た目の中心基準', {
                timestamp: timestamp,
                conversionDetails: {
                    visualCenter: {x: visualCenterX.toFixed(1), y: visualCenterY.toFixed(1)},
                    cssOffsetsBefore: {tx: tx, ty: ty},
                    cssOffsetsAfter: {tx: '0px', ty: '0px'},
                    percentValues: {left: leftPct.toFixed(2) + '%', top: topPct.toFixed(2) + '%'},
                    hasInteractive: !!interactive
                },
                beforeAfterComparison: this.compareStates(beforeCommitState, afterCommitState),
                success: true
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ [SWAP] commitToPercent処理でエラー:', {
                timestamp: timestamp,
                error: error.message,
                stack: error.stack,
                beforeCommitState: beforeCommitState
            });
            return false;
        }
    }
    
    /**
     * 状態情報取得
     */
    getState() {
        return {
            config: {...this.config},
            transform: {...this.transform},
            bounds: {...this.bounds},
            swapState: {...this.swapState},
            dragState: {...this.dragState},
            uiState: {
                visible: this.uiState.visible,
                hasContainer: !!this.uiState.container
            }
        };
    }
    
    /**
     * 🆕 詳細状態キャプチャ - デバッグ用包括的情報収集
     */
    captureDetailedState(phase, timestamp) {
        const element = this.config.targetElement;
        const interactive = element?.querySelector('.interactive');
        const parent = element?.parentElement;
        
        // 基本DOM情報
        const domInfo = {
            elementExists: !!element,
            interactiveExists: !!interactive,
            parentExists: !!parent,
            nodeId: this.config.nodeId
        };
        
        // CSS位置情報
        let cssInfo = null;
        if (element) {
            cssInfo = {
                elementStyles: {
                    left: element.style.left,
                    top: element.style.top,
                    width: element.style.width,
                    height: element.style.height,
                    transform: element.style.transform
                },
                computedStyles: {
                    left: getComputedStyle(element).left,
                    top: getComputedStyle(element).top,
                    width: getComputedStyle(element).width,
                    height: getComputedStyle(element).height,
                    transform: getComputedStyle(element).transform
                }
            };
        }
        
        // CSS変数情報
        let cssVarsInfo = null;
        if (interactive) {
            const cs = getComputedStyle(interactive);
            cssVarsInfo = {
                tx: cs.getPropertyValue('--tx') || '0px',
                ty: cs.getPropertyValue('--ty') || '0px',
                txParsed: parseFloat(cs.getPropertyValue('--tx')) || 0,
                tyParsed: parseFloat(cs.getPropertyValue('--ty')) || 0
            };
        }
        
        // 矩形情報
        let rectInfo = null;
        if (element && parent) {
            const elementRect = element.getBoundingClientRect();
            const parentRect = parent.getBoundingClientRect();
            
            rectInfo = {
                element: {
                    left: elementRect.left,
                    top: elementRect.top,
                    width: elementRect.width,
                    height: elementRect.height,
                    centerX: elementRect.left + elementRect.width/2,
                    centerY: elementRect.top + elementRect.height/2
                },
                parent: {
                    left: parentRect.left,
                    top: parentRect.top,
                    width: parentRect.width,
                    height: parentRect.height
                },
                relativePosition: {
                    leftPct: ((elementRect.left + elementRect.width/2 - parentRect.left) / parentRect.width) * 100,
                    topPct: ((elementRect.top + elementRect.height/2 - parentRect.top) / parentRect.height) * 100
                }
            };
        }
        
        return {
            phase: phase,
            timestamp: timestamp,
            swapMode: this.swapState.currentMode,
            isDragging: this.dragState.isDragging,
            domInfo: domInfo,
            cssInfo: cssInfo,
            cssVarsInfo: cssVarsInfo,
            rectInfo: rectInfo
        };
    }
    
    /**
     * 🆕 状態比較 - Before/Afterの差分を分析
     */
    compareStates(beforeState, afterState) {
        const comparison = {
            swapModeChanged: beforeState.swapMode !== afterState.swapMode,
            draggingStateChanged: beforeState.isDragging !== afterState.isDragging
        };
        
        // CSS変数の変化を比較
        if (beforeState.cssVarsInfo && afterState.cssVarsInfo) {
            comparison.cssVarsChanged = {
                txChanged: beforeState.cssVarsInfo.tx !== afterState.cssVarsInfo.tx,
                tyChanged: beforeState.cssVarsInfo.ty !== afterState.cssVarsInfo.ty,
                before: {tx: beforeState.cssVarsInfo.tx, ty: beforeState.cssVarsInfo.ty},
                after: {tx: afterState.cssVarsInfo.tx, ty: afterState.cssVarsInfo.ty}
            };
        }
        
        // CSS位置の変化を比較
        if (beforeState.cssInfo && afterState.cssInfo) {
            comparison.cssPositionChanged = {
                leftChanged: beforeState.cssInfo.elementStyles.left !== afterState.cssInfo.elementStyles.left,
                topChanged: beforeState.cssInfo.elementStyles.top !== afterState.cssInfo.elementStyles.top,
                transformChanged: beforeState.cssInfo.elementStyles.transform !== afterState.cssInfo.elementStyles.transform,
                before: beforeState.cssInfo.elementStyles,
                after: afterState.cssInfo.elementStyles
            };
        }
        
        return comparison;
    }
    
    /**
     * 🆕 スワップ試行回数カウント（初回/2回目以降の判定用）
     */
    getSwapAttemptCount() {
        if (!this.swapAttemptCount) this.swapAttemptCount = 0;
        this.swapAttemptCount++;
        return this.swapAttemptCount;
    }
    
    /**
     * 🆕 コミット試行回数カウント
     */
    getCommitAttemptCount() {
        if (!this.commitAttemptCount) this.commitAttemptCount = 0;
        this.commitAttemptCount++;
        return this.commitAttemptCount;
    }
    
    /**
     * 🆕 初回/2回目以降の判定ログ
     */
    logSwapAttemptType() {
        const attemptCount = this.swapAttemptCount || 0;
        const attemptType = attemptCount <= 1 ? '初回' : `${attemptCount}回目`;
        
        console.log(`🎯 [SWAP-ANALYSIS] ${attemptType}の座標系スワップ`, {
            attemptCount: attemptCount,
            isFirstTime: attemptCount <= 1,
            nodeId: this.config.nodeId,
            previousAttempts: attemptCount - 1
        });
        
        // 初回と2回目以降で異なる動作パターンがある場合のフラグ
        if (attemptCount === 1) {
            console.log('🆕 初回座標系スワップ - 特別な初期化処理の可能性');
        } else {
            console.log('🔄 継続座標系スワップ - 既に初期化済みの状態');
        }
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.PureBoundingBoxCore = PureBoundingBoxCore;
}