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
            minHeight: config.minHeight || 20,
            // 🆕 許容範囲内誤差設定
            tolerancePx: config.tolerancePx || 5,
            gentleCorrectionRatio: config.gentleCorrectionRatio || 0.5,
            
            // 🎯 論理座標系設定（椅子テスト成功パターン統合）
            enableLogicalCoordinate: config.enableLogicalCoordinate || false,
            logicalBaseSize: config.logicalBaseSize || 120,
            groundBasedPositioning: config.groundBasedPositioning || false,
            chairTestCompatible: config.chairTestCompatible || false
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
        
        // 🎯 論理座標系状態（椅子テスト成功パターン準拠）
        this.logicalCoordinate = {
            enabled: this.config.enableLogicalCoordinate,
            baseSize: this.config.logicalBaseSize,
            aspectRatio: '1 / 1',
            unit: 'logical-px',
            coordinateOrigin: 'ground-center',
            groundLevel: 62, // 椅子テスト成功値
            
            // 椅子テスト統合設定（変更禁止）
            chairTestSettings: {
                fixedSize: this.config.logicalBaseSize + 'px',
                forceAspectRatio: true,
                groundBasedPositioning: this.config.groundBasedPositioning,
                unifiedScaling: this.config.chairTestCompatible
            }
        };
    }
    
    /**
     * 🎯 BB座標系スワップ: Transform → Bounds
     * 🔧 CSS Transform中心基準補正の競合解決 + Canvas歪み解決
     * 🪑 椅子テスト成功パターン統合版: 単純固定サイズ制御
     * 🎯 Transform精度修正: 0.5px単位での精密計算実装
     * 🆕 論理座標系統合: 椅子テスト成功パターンによる確実性向上
     */
    enterEditingMode() {
        if (this.swapState.currentMode === 'editing') return;
        
        // 🎯 論理座標系適用判定（椅子テスト成功パターン優先）
        if (this.logicalCoordinate.enabled) {
            return this.enterLogicalCoordinateEditingMode();
        } else {
            return this.enterLegacyEditingMode();
        }
    }
    
    /**
     * 🎯 論理座標系編集モード（椅子テスト成功パターン準拠）
     * 確実にズレない座標系での編集開始
     */
    enterLogicalCoordinateEditingMode() {
        const timestamp = new Date().toISOString();
        const element = this.config.targetElement;
        const interactive = element.querySelector('.interactive');
        
        console.log('🎯 [LOGICAL] 論理座標系編集モード開始 - 椅子テスト成功パターン適用', {
            timestamp: timestamp,
            nodeId: this.config.nodeId,
            椅子テスト準拠: '✅ 120px固定 + aspect-ratio: 1/1',
            確実性保証: '✅ リサイズ時も位置関係維持'
        });
        
        // 編集前状態の記録
        const beforeState = this.captureDetailedState('BEFORE_LOGICAL_EDITING', timestamp);
        
        // 🎯 椅子テスト成功パターン適用
        this.applyChairTestPattern(element);
        
        // 🪑 足元基準配置（設定により有効化）
        if (this.logicalCoordinate.chairTestSettings.groundBasedPositioning) {
            this.alignToGroundLevel(element);
        }
        
        // 編集モード開始
        this.swapState.currentMode = 'editing';
        
        // 編集後状態の記録
        const afterState = this.captureDetailedState('AFTER_LOGICAL_EDITING', timestamp);
        
        console.log('✅ [LOGICAL] 論理座標系編集モード完了', {
            timestamp: timestamp,
            椅子テスト適用: '✅ 固定サイズ・縦横比固定・歪み防止',
            座標安定性: '✅ ウィンドウリサイズ対応',
            beforeAfterComparison: this.compareStates(beforeState, afterState)
        });
    }
    
    /**
     * 🪑 椅子テスト成功パターン適用
     * 確実にズレない設定の強制適用
     */
    applyChairTestPattern(element) {
        console.log('🪑 椅子テスト成功パターン適用開始', {
            baseSize: this.logicalCoordinate.baseSize + 'px',
            aspectRatio: this.logicalCoordinate.aspectRatio,
            参照元: 'test-chair-character-positioning.html'
        });
        
        // 椅子テスト統合: 固定サイズ設定
        element.style.width = this.logicalCoordinate.chairTestSettings.fixedSize;
        element.style.height = this.logicalCoordinate.chairTestSettings.fixedSize;
        element.style.aspectRatio = this.logicalCoordinate.aspectRatio;
        element.style.objectFit = 'contain';
        
        // Canvas内部解像度統一（椅子テストと同じ計算式）
        if (element.tagName === 'CANVAS') {
            const dpr = window.devicePixelRatio || 1;
            const internalRes = Math.round(this.logicalCoordinate.baseSize * dpr);
            element.width = internalRes;
            element.height = internalRes;
            
            console.log('🪑 Canvas内部解像度設定', {
                displaySize: this.logicalCoordinate.chairTestSettings.fixedSize,
                internalRes: `${element.width} × ${element.height}`,
                dpr: dpr,
                椅子テスト方式: '✅ 同じ解像度計算'
            });
        }
        
        console.log('✅ 椅子テスト成功パターン適用完了', {
            固定サイズ: this.logicalCoordinate.chairTestSettings.fixedSize,
            縦横比固定: this.logicalCoordinate.aspectRatio,
            歪み防止: '✅ aspect-ratio + object-fit',
            椅子テスト互換: '✅ 完全準拠'
        });
    }
    
    /**
     * 🪑 足元基準配置（椅子テスト成功パターン準拠）
     * 接地レベル統一による確実な位置関係
     */
    alignToGroundLevel(element) {
        const groundLevel = this.logicalCoordinate.groundLevel; // 62% 椅子テスト成功値
        const elementHeight = this.logicalCoordinate.baseSize;
        
        console.log('🪑 足元基準配置開始', {
            groundLevel: groundLevel + '%',
            elementHeight: elementHeight + 'px',
            椅子テスト基準: '✅ 62%接地レベル'
        });
        
        // 足元基準の配置計算（椅子テストと同じ）
        element.style.top = groundLevel + '%';
        element.style.left = '50%';
        element.style.transform = 'translate(-50%, -50%)';
        
        console.log('✅ 足元基準配置完了', {
            groundLevel: groundLevel + '%',
            centerPosition: '50%',
            transform: 'translate(-50%, -50%)',
            椅子テスト準拠: '✅ 同じ接地レベル統一'
        });
    }
    
    /**
     * 🔄 従来システム編集モード（後方互換性保持）
     */
    enterLegacyEditingMode() {
        const timestamp = new Date().toISOString();
        const element = this.config.targetElement;
        const interactive = element.querySelector('.interactive');
        
        // スワップ前の状態を詳細に記録
        const beforeState = this.captureDetailedState('BEFORE_ENTER_EDITING', timestamp);
        
        console.log('🔄 [SWAP] enterEditingMode: CSS Transform競合解決+Canvas歪み解決+精度修正開始', {
            timestamp: timestamp,
            nodeId: this.config.nodeId,
            attempt: this.getSwapAttemptCount(),
            beforeState: beforeState
        });
        
        // 🎯 Transform精度補正: 編集開始前に微妙な誤差を修正
        this.correctTransformPrecision(element);
        
        // 🎯 CSS Transform中心基準補正のバックアップと一時無効化
        this.swapState.originalTransform = {
            left: element.style.left,
            top: element.style.top,
            width: element.style.width,
            height: element.style.height,
            transform: element.style.transform
        };
        
        // 🎯 初回ドラッグ瞬間移動修正: CSS変数リセットしてから位置計算
        // 初回時は.interactiveにCSS変数が残っている可能性があるため事前にリセット
        if (interactive) {
            console.log('🎯 [INIT-FIX] 初回用CSS変数事前リセット');
            interactive.style.setProperty('--tx', '0px');
            interactive.style.setProperty('--ty', '0px');
        }
        
        // 🔧 CSS Transform中心基準補正を一時的に無効化
        // transform(-50%, -50%)による座標競合を回避
        const currentRect = element.getBoundingClientRect();
        const parentRect = element.parentElement.getBoundingClientRect();
        
        // 🎯 座標継承: 現在の視覚的位置を完全に保持
        const absoluteLeft = currentRect.left - parentRect.left;
        const absoluteTop = currentRect.top - parentRect.top;
        
        console.log('🎯 座標継承:', {
            currentVisual: `${Math.round(currentRect.left)}, ${Math.round(currentRect.top)}`,
            parentPosition: `${Math.round(parentRect.left)}, ${Math.round(parentRect.top)}`,
            calculatedAbsolute: `${Math.round(absoluteLeft)}, ${Math.round(absoluteTop)}`
        });
        
        // 絶対座標でtransformなし状態に設定
        element.style.left = absoluteLeft + 'px';
        element.style.top = absoluteTop + 'px';
        
        // 🔧 修正: レイアウト用transformを保持し、編集用のみクリア
        element.style.setProperty('--pbx-edit', 'none'); // 編集用transform無効化
        
        // 🎯 サイズ・Canvas解像度の固定化（歪み防止） + 🔧 Canvas強制正方形化
        const computedStyle = window.getComputedStyle(element);
        let fixedWidth = computedStyle.width;
        let fixedHeight = computedStyle.height;
        
        // 🚨🪑 椅子テスト統合: Canvas要素の場合、椅子テスト成功パターン適用
        if (element.tagName === 'CANVAS') {
            console.log('🪑 椅子テスト成功パターン適用 - Canvas強制正方形化:', {
                適用方針: '椅子テストと同じ固定サイズ + aspect-ratio制御',
                参考システム: 'test-chair-character-positioning.html'
            });
            
            // 椅子テスト成功パターン: 固定サイズ設定
            fixedWidth = '120px';  // 椅子テストと同じ固定サイズ
            fixedHeight = '120px'; // 椅子テストと同じ固定サイズ
            
            console.log('🔧 椅子テスト方式適用完了:', {
                固定サイズ: '120px × 120px',
                縦横比制御: 'aspect-ratio: 1/1',
                参照元: '椅子テスト成功パターン'
            });
            
            // 椅子テストと同じCSS強制設定
            element.style.aspectRatio = '1 / 1';
            element.style.objectFit = 'contain';
        }
        
        // 固定サイズを適用
        element.style.width = fixedWidth;
        element.style.height = fixedHeight;
        
        // 🪑 椅子テストCanvas内部解像度設定（論理解像度統一）
        if (element.tagName === 'CANVAS') {
            // 椅子テスト成功パターン: 固定120px基準の内部解像度
            const chairTestSize = 120; // 椅子テストの成功サイズ
            const dpr = window.devicePixelRatio || 1;
            const internalRes = Math.round(chairTestSize * dpr);
            
            element.width = internalRes;
            element.height = internalRes; // 椅子テストと同じ正方形内部バッファ
            
            console.log('🪑 椅子テスト方式内部解像度設定:', {
                椅子テスト基準サイズ: `${chairTestSize}px`,
                displaySize: `${fixedWidth} × ${fixedHeight}`,
                internalRes: `${element.width} × ${element.height}`,
                dpr: dpr,
                椅子テスト互換: '✅ 椅子テストと同じ論理解像度'
            });
        }
        
        // 編集モード開始
        this.swapState.currentMode = 'editing';
        
        // スワップ後の状態を詳細に記録
        const afterState = this.captureDetailedState('AFTER_ENTER_EDITING', timestamp);
        
        console.log('✅ [SWAP] enterEditingMode完了 - CSS Transform競合解決+Canvas歪み解決', {
            timestamp: timestamp,
            beforeAfterComparison: this.compareStates(beforeState, afterState),
            editingModeActive: this.swapState.currentMode === 'editing',
            transformConflictSolution: 'temp-disable-center-offset',
            canvasDistortionSolution: 'force-square-aspect-ratio'
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
        
        // 🔧 修正: CSS変数で編集用transformをクリア（レイアウト用は保持）
        element.style.setProperty('--pbx-edit', 'none');
        
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
     * 🆕 Phase 2改良版: Toleranceシステム統合コミット処理
     * 許容範囲内誤差を考慮したシンプルな%値再計算
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
        
        console.log('🔄 [SWAP] commitToPercent: Toleranceシステム統合変換開始', {
            timestamp: timestamp,
            nodeId: this.config.nodeId,
            attempt: this.getCommitAttemptCount(),
            beforeCommitState: beforeCommitState,
            toleranceSettings: {
                tolerancePx: this.config.tolerancePx,
                gentleCorrectionRatio: this.config.gentleCorrectionRatio
            }
        });
        
        try {
            // layout-anchorの現在の見た目の矩形（transform(-50%, -50%)反映後）
            const anchorRect = element.getBoundingClientRect();
            
            // CSS変数による追加オフセットを取得
            let tx = 0, ty = 0;
            if (interactive) {
                const cs = getComputedStyle(interactive);
                tx = parseFloat(cs.getPropertyValue('--tx')) || 0;
                ty = parseFloat(cs.getPropertyValue('--ty')) || 0;
                
                // 🔍 CSS変数の詳細状態デバッグ情報
                console.log('🔍 [DEBUG] CSS変数詳細状態:', {
                    interactiveElement: interactive,
                    computedStyle: cs,
                    txRaw: cs.getPropertyValue('--tx'),
                    tyRaw: cs.getPropertyValue('--ty'),
                    txParsed: parseFloat(cs.getPropertyValue('--tx')),
                    tyParsed: parseFloat(cs.getPropertyValue('--ty')),
                    allCustomProps: Object.fromEntries([...cs].filter(prop => prop.startsWith('--')).map(prop => [prop, cs.getPropertyValue(prop)]))
                });
            }
            
            // 🎯🪑 椅子テスト統合Toleranceシステム: 単純比例変換で精密な位置計算
            console.log('🪑 [椅子テスト統合] 単純比例変換方式で精密座標計算 - 椅子テスト成功パターン統合');
            
            // 🪑 椅子テスト成功パターン: 固定サイズ基準の単純計算
            // 椅子テストでは固定サイズ(120px)で成功しているため、同じアプローチを採用
            const currentLeft = parseFloat(getComputedStyle(element).left) || 0;
            const currentTop = parseFloat(getComputedStyle(element).top) || 0;
            
            // %値かpx値かを判定
            const leftIsPercent = getComputedStyle(element).left.includes('%');
            const topIsPercent = getComputedStyle(element).top.includes('%');
            
            console.log('🪑 椅子テスト座標計算方式:', {
                '椅子テスト成功要因': '固定サイズ(120px) + aspect-ratio(1/1) + 中央基準',
                '現在の座標': { left: currentLeft, top: currentTop },
                '座標形式': { leftIsPercent, topIsPercent }
            });
            
            // 🆕 Toleranceチェック: CSS変数による微小なずれを許容範囲内誤差として扱う
            const txTolerant = Math.abs(tx) <= this.config.tolerancePx ? 0 : tx * this.config.gentleCorrectionRatio;
            const tyTolerant = Math.abs(ty) <= this.config.tolerancePx ? 0 : ty * this.config.gentleCorrectionRatio;
            
            console.log('🔍 [TOLERANCE] 許容範囲チェック結果:', {
                originalOffset: { tx: tx.toFixed(1), ty: ty.toFixed(1) },
                tolerancePx: this.config.tolerancePx,
                tolerantOffset: { tx: txTolerant.toFixed(1), ty: tyTolerant.toFixed(1) },
                withinToleranceX: Math.abs(tx) <= this.config.tolerancePx,
                withinToleranceY: Math.abs(ty) <= this.config.tolerancePx
            });
            
            let leftPct, topPct;
            
            if (leftIsPercent) {
                // 既に%の場合はTolerance適用済みオフセットを使用
                leftPct = currentLeft + (txTolerant / parentRect.width * 100);
            } else {
                // px値の場合は%に変換
                leftPct = (currentLeft / parentRect.width) * 100 + (txTolerant / parentRect.width * 100);
            }
            
            if (topIsPercent) {
                // 既に%の場合はTolerance適用済みオフセットを使用
                topPct = currentTop + (tyTolerant / parentRect.height * 100);
            } else {
                // px値の場合は%に変換
                topPct = (currentTop / parentRect.height) * 100 + (tyTolerant / parentRect.height * 100);
            }
            
            console.log('🔍 [DEBUG] Tolerance適用後座標計算詳細:', {
                currentStyles: {
                    left: getComputedStyle(element).left,
                    top: getComputedStyle(element).top,
                    leftIsPercent: leftIsPercent,
                    topIsPercent: topIsPercent
                },
                cssVariables: {
                    original: {tx: tx, ty: ty},
                    tolerant: {tx: txTolerant, ty: tyTolerant}
                },
                parentSize: {width: parentRect.width, height: parentRect.height},
                calculatedPercent: {left: leftPct.toFixed(2), top: topPct.toFixed(2)}
            });
            
            // layout-anchorに書き戻し（位置・サイズ両方を%変換）
            element.style.left = leftPct.toFixed(2) + '%';
            element.style.top = topPct.toFixed(2) + '%';
            
            // 🎯 サイズも%で設定（レスポンシブ対応）- 編集結果を優先
            const boundsWidth = this.bounds ? this.bounds.width : element.getBoundingClientRect().width;
            const boundsHeight = this.bounds ? this.bounds.height : element.getBoundingClientRect().height;
            
            const widthPct = (boundsWidth / parentRect.width) * 100;
            const heightPct = (boundsHeight / parentRect.height) * 100;
            element.style.width = widthPct.toFixed(2) + '%';
            element.style.height = heightPct.toFixed(2) + '%';
            
            console.log('🎯 [SIZE] サイズも%変換適用（編集結果優先）:', {
                'bounds→%': `${boundsWidth.toFixed(1)}px×${boundsHeight.toFixed(1)}px → ${widthPct.toFixed(2)}%×${heightPct.toFixed(2)}%`,
                'parentSize': `${parentRect.width}×${parentRect.height}`,
                'boundsSource': this.bounds ? 'core.bounds' : 'getBoundingClientRect'
            });
            
            // CSS変数をリセット（ズレ蓄積防止）
            if (interactive) {
                interactive.style.setProperty('--tx', '0px');
                interactive.style.setProperty('--ty', '0px');
            }
            
            // コミット後の状態を詳細に記録
            const afterCommitState = this.captureDetailedState('AFTER_COMMIT', timestamp);
            
            console.log('✅ [SWAP] commitToPercent完了 - Toleranceシステム統合版', {
                timestamp: timestamp,
                conversionDetails: {
                    originalPosition: {left: currentLeft.toFixed(1), top: currentTop.toFixed(1)},
                    cssOffsetsBefore: {tx: tx, ty: ty},
                    cssOffsetsAfter: {tx: '0px', ty: '0px'},
                    toleranceApplied: {
                        beforeTolerance: {tx: tx, ty: ty},
                        afterTolerance: {tx: txTolerant, ty: tyTolerant},
                        withinToleranceX: Math.abs(tx) <= this.config.tolerancePx,
                        withinToleranceY: Math.abs(ty) <= this.config.tolerancePx
                    },
                    percentValues: {left: leftPct.toFixed(2) + '%', top: topPct.toFixed(2) + '%'},
                    hasInteractive: !!interactive,
                    coordinateType: {leftIsPercent: leftIsPercent, topIsPercent: topIsPercent}
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
    
    /**
     * 🎯 Transform精度補正: 0.5px単位での精密計算
     * 微妙な誤差（0.021px, 0.005px等）を強制的に補正
     */
    correctTransformPrecision(element) {
        if (!element) return;
        
        const rect = element.getBoundingClientRect();
        const computedStyle = getComputedStyle(element);
        
        console.log('🎯 [PRECISION] Transform精度補正開始', {
            nodeId: this.config.nodeId,
            currentRect: {
                width: rect.width.toFixed(3),
                height: rect.height.toFixed(3)
            },
            currentTransform: computedStyle.transform
        });
        
        // 🎯 精密な中心座標計算: 0.5px単位での強制丸め
        const preciseWidth = Math.round(rect.width * 2) / 2;
        const preciseHeight = Math.round(rect.height * 2) / 2;
        const preciseCenterX = Math.round(preciseWidth / 2 * 2) / 2;
        const preciseCenterY = Math.round(preciseHeight / 2 * 2) / 2;
        
        // 🔧 Transform値を強制的に0.5px精度に修正
        const correctedTransform = `translate(-${preciseCenterX}px, -${preciseCenterY}px)`;
        
        // 元のtransformから他の値（rotate, scale等）を抽出
        const originalTransform = element.style.transform || '';
        let preservedTransformParts = '';
        
        // rotate, scale等の他のtransform値を保持
        const transformMatch = originalTransform.match(/(?!translate\([^)]+\))(rotate\([^)]+\)|scale\([^)]+\)|skew\([^)]+\))/g);
        if (transformMatch) {
            preservedTransformParts = ' ' + transformMatch.join(' ');
        }
        
        const finalTransform = correctedTransform + preservedTransformParts;
        
        // 精度修正を適用
        element.style.transform = finalTransform;
        
        console.log('✅ [PRECISION] Transform精度補正完了', {
            nodeId: this.config.nodeId,
            precisionCorrection: {
                originalWidth: rect.width.toFixed(3),
                originalHeight: rect.height.toFixed(3),
                preciseWidth: preciseWidth.toFixed(1),
                preciseHeight: preciseHeight.toFixed(1),
                originalTransform: originalTransform,
                correctedTransform: finalTransform,
                centerCorrection: {
                    x: `${rect.width / 2} → ${preciseCenterX}`,
                    y: `${rect.height / 2} → ${preciseCenterY}`
                }
            }
        });
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.PureBoundingBoxCore = PureBoundingBoxCore;
}