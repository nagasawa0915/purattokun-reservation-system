// 🖱️ Interaction Handler - ユーザーインタラクション管理マイクロモジュール
// 設計原則: 完全独立・外部依存ゼロ・数値のみ入出力

console.log('🚀 Interaction Handler マイクロモジュール読み込み');

/**
 * ユーザーインタラクション管理モジュール
 * v3.0のマウス・キーボード・タッチ操作機能を完全移植
 * 
 * 入力仕様:
 * {
 *   interactionType: "drag",             // インタラクションタイプ（drag/click/keyboard/touch）
 *   targetId: "hero_001",                // 対象ID
 *   eventData: {
 *     clientX: 150,                      // マウス座標
 *     clientY: 200,
 *     key: "ArrowLeft",                  // キー名
 *     deltaX: 10,                        // 移動量
 *     deltaY: 5
 *   },
 *   config: {
 *     sensitivity: 1.0,                  // 感度
 *     boundaries: { minX: 0, maxX: 1200, minY: 0, maxY: 800 }
 *   }
 * }
 * 
 * 出力仕様:
 * {
 *   interactionId: "int_001",
 *   targetId: "hero_001", 
 *   result: {
 *     deltaX: 10,                        // 計算された移動量
 *     deltaY: 5,
 *     newPosition: { x: 160, y: 205 },   // 新しい位置
 *     isValid: true                      // 境界チェック結果
 *   }
 * }
 */
class InteractionHandler {
    constructor() {
        // 完全独立：外部依存ゼロ
        this.interactions = new Map();
        this.activeInteractions = new Map();
        this.interactionHistory = [];
        this.interactionCounter = 0;
        this.isInitialized = false;
        
        // インタラクション設定（v3.0移植）
        this.interactionTypes = {
            'drag': { sensitivity: 1.0, threshold: 3, type: 'continuous' },
            'click': { sensitivity: 1.0, threshold: 5, type: 'discrete' },
            'keyboard': { sensitivity: 1.0, repeatDelay: 100, type: 'discrete' },
            'touch': { sensitivity: 1.2, threshold: 5, type: 'continuous' },
            'wheel': { sensitivity: 0.1, threshold: 1, type: 'discrete' }
        };
        
        // キーボードマッピング（v3.0移植）
        this.keyboardMapping = {
            'ArrowLeft': { deltaX: -1, deltaY: 0, type: 'movement' },
            'ArrowRight': { deltaX: 1, deltaY: 0, type: 'movement' },
            'ArrowUp': { deltaX: 0, deltaY: -1, type: 'movement' },
            'ArrowDown': { deltaX: 0, deltaY: 1, type: 'movement' },
            'Escape': { action: 'cancel', type: 'control' },
            'Enter': { action: 'confirm', type: 'control' },
            'Space': { action: 'toggle', type: 'control' }
        };
        
        // タッチジェスチャー設定
        this.gestureConfig = {
            swipeThreshold: 50,
            pinchThreshold: 10,
            tapTimeout: 300,
            doubleTapInterval: 500
        };
    }

    /**
     * インタラクション処理メイン関数
     * @param {Object} input - インタラクション設定
     * @returns {Object} 処理結果データ
     */
    processInteraction(input) {
        console.log('🖱️ インタラクション処理開始', input);

        // 入力検証
        const validatedInput = this.validateInput(input);
        if (!validatedInput) {
            return null;
        }

        // インタラクションIDを生成
        const interactionId = `int_${++this.interactionCounter}`;

        // インタラクションタイプに応じた処理
        const result = this.processInteractionType(interactionId, validatedInput);

        // インタラクション履歴に記録
        this.recordInteraction(interactionId, validatedInput, result);

        console.log('✅ インタラクション処理完了', result);
        return result;
    }

    /**
     * ドラッグ操作処理（v3.0移植）
     * @param {Object} input - ドラッグ設定
     * @returns {Object} ドラッグ結果
     */
    processDragInteraction(input) {
        console.log('🖱️ ドラッグ操作処理', input);

        const dragData = this.extractDragData(input);
        
        // 感度調整
        const sensitivity = input.config?.sensitivity || this.interactionTypes.drag.sensitivity;
        const adjustedDeltaX = dragData.deltaX * sensitivity;
        const adjustedDeltaY = dragData.deltaY * sensitivity;

        // 境界チェック
        const boundaries = input.config?.boundaries;
        const newPosition = this.calculateNewPosition(dragData.startPosition, adjustedDeltaX, adjustedDeltaY);
        const clampedPosition = boundaries ? this.clampToBoundaries(newPosition, boundaries) : newPosition;

        // ドラッグ状態更新
        const dragState = this.updateDragState(input.targetId, {
            startPosition: dragData.startPosition,
            currentPosition: clampedPosition,
            deltaX: adjustedDeltaX,
            deltaY: adjustedDeltaY,
            isValid: this.isValidPosition(clampedPosition, boundaries)
        });

        const result = {
            interactionId: input.interactionId,
            targetId: input.targetId,
            type: 'drag',
            result: {
                deltaX: clampedPosition.x - dragData.startPosition.x,
                deltaY: clampedPosition.y - dragData.startPosition.y,
                newPosition: clampedPosition,
                isValid: dragState.isValid,
                dragState: dragState
            },
            processedAt: Date.now()
        };

        return result;
    }

    /**
     * クリック操作処理
     * @param {Object} input - クリック設定
     * @returns {Object} クリック結果
     */
    processClickInteraction(input) {
        console.log('👆 クリック操作処理', input);

        const clickData = this.extractClickData(input);
        
        // クリック位置の正規化
        const normalizedPosition = this.normalizePosition(clickData.position, input.config?.containerSize);

        // クリック種別判定
        const clickType = this.determineClickType(input.targetId, clickData);

        // クリック効果計算
        const clickEffect = this.calculateClickEffect(clickType, input.config);

        const result = {
            interactionId: input.interactionId,
            targetId: input.targetId,
            type: 'click',
            result: {
                position: normalizedPosition,
                clickType: clickType,
                effect: clickEffect,
                timestamp: Date.now(),
                isValid: true
            },
            processedAt: Date.now()
        };

        return result;
    }

    /**
     * キーボード操作処理（v3.0移植）
     * @param {Object} input - キーボード設定
     * @returns {Object} キーボード結果
     */
    processKeyboardInteraction(input) {
        console.log('⌨️ キーボード操作処理', input);

        const keyData = input.eventData;
        const keyMapping = this.keyboardMapping[keyData.key];

        if (!keyMapping) {
            console.warn('⚠️ 未対応のキー:', keyData.key);
            return null;
        }

        // 移動系キーの処理
        if (keyMapping.type === 'movement') {
            return this.processKeyboardMovement(input, keyMapping);
        }

        // 制御系キーの処理
        if (keyMapping.type === 'control') {
            return this.processKeyboardControl(input, keyMapping);
        }

        return null;
    }

    /**
     * キーボード移動処理
     * @param {Object} input - 入力データ
     * @param {Object} keyMapping - キーマッピング
     * @returns {Object} 移動結果
     */
    processKeyboardMovement(input, keyMapping) {
        const config = input.config || {};
        const sensitivity = config.sensitivity || this.interactionTypes.keyboard.sensitivity;
        
        // 移動量計算（Shift押下で大きな移動）
        const isShiftPressed = input.eventData.shiftKey;
        const baseMoveAmount = config.moveAmount || (isShiftPressed ? 10 : 1);
        const moveAmountX = keyMapping.deltaX * baseMoveAmount * sensitivity;
        const moveAmountY = keyMapping.deltaY * baseMoveAmount * sensitivity;

        // 境界チェック
        const currentPosition = input.eventData.currentPosition || { x: 0, y: 0 };
        const newPosition = {
            x: currentPosition.x + moveAmountX,
            y: currentPosition.y + moveAmountY
        };

        const boundaries = config.boundaries;
        const clampedPosition = boundaries ? this.clampToBoundaries(newPosition, boundaries) : newPosition;

        return {
            interactionId: input.interactionId,
            targetId: input.targetId,
            type: 'keyboard',
            result: {
                key: input.eventData.key,
                deltaX: moveAmountX,
                deltaY: moveAmountY,
                newPosition: clampedPosition,
                moveAmount: baseMoveAmount,
                isShiftPressed: isShiftPressed,
                isValid: this.isValidPosition(clampedPosition, boundaries)
            },
            processedAt: Date.now()
        };
    }

    /**
     * キーボード制御処理
     * @param {Object} input - 入力データ
     * @param {Object} keyMapping - キーマッピング
     * @returns {Object} 制御結果
     */
    processKeyboardControl(input, keyMapping) {
        return {
            interactionId: input.interactionId,
            targetId: input.targetId,
            type: 'keyboard_control',
            result: {
                key: input.eventData.key,
                action: keyMapping.action,
                controlType: keyMapping.type,
                timestamp: Date.now(),
                isValid: true
            },
            processedAt: Date.now()
        };
    }

    /**
     * タッチ操作処理
     * @param {Object} input - タッチ設定
     * @returns {Object} タッチ結果
     */
    processTouchInteraction(input) {
        console.log('👆 タッチ操作処理', input);

        const touchData = this.extractTouchData(input);
        
        // タッチタイプ判定（tap/swipe/pinch）
        const touchType = this.determineTouchType(touchData);

        // タッチタイプ別処理
        switch (touchType) {
            case 'tap':
                return this.processTapGesture(input, touchData);
            case 'swipe':
                return this.processSwipeGesture(input, touchData);
            case 'pinch':
                return this.processPinchGesture(input, touchData);
            default:
                return this.processGenericTouch(input, touchData);
        }
    }

    /**
     * タップジェスチャー処理
     * @param {Object} input - 入力データ
     * @param {Object} touchData - タッチデータ
     * @returns {Object} タップ結果
     */
    processTapGesture(input, touchData) {
        const isDoubleTap = this.checkDoubleTap(input.targetId, touchData.timestamp);
        
        return {
            interactionId: input.interactionId,
            targetId: input.targetId,
            type: 'tap',
            result: {
                position: touchData.position,
                isDoubleTap: isDoubleTap,
                timestamp: touchData.timestamp,
                pressure: touchData.pressure || 1.0,
                isValid: true
            },
            processedAt: Date.now()
        };
    }

    /**
     * スワイプジェスチャー処理
     * @param {Object} input - 入力データ
     * @param {Object} touchData - タッチデータ
     * @returns {Object} スワイプ結果
     */
    processSwipeGesture(input, touchData) {
        const swipeDirection = this.calculateSwipeDirection(touchData.deltaX, touchData.deltaY);
        const swipeVelocity = this.calculateSwipeVelocity(touchData);

        return {
            interactionId: input.interactionId,
            targetId: input.targetId,
            type: 'swipe',
            result: {
                direction: swipeDirection,
                velocity: swipeVelocity,
                deltaX: touchData.deltaX,
                deltaY: touchData.deltaY,
                distance: Math.sqrt(touchData.deltaX * touchData.deltaX + touchData.deltaY * touchData.deltaY),
                isValid: swipeVelocity > this.gestureConfig.swipeThreshold
            },
            processedAt: Date.now()
        };
    }

    /**
     * インタラクションタイプ別処理振り分け
     * @param {string} interactionId - インタラクションID
     * @param {Object} input - 入力データ
     * @returns {Object} 処理結果
     */
    processInteractionType(interactionId, input) {
        const inputWithId = { ...input, interactionId };

        switch (input.interactionType) {
            case 'drag':
                return this.processDragInteraction(inputWithId);
            case 'click':
                return this.processClickInteraction(inputWithId);
            case 'keyboard':
                return this.processKeyboardInteraction(inputWithId);
            case 'touch':
                return this.processTouchInteraction(inputWithId);
            default:
                console.warn('⚠️ 未対応のインタラクションタイプ:', input.interactionType);
                return null;
        }
    }

    /**
     * 境界チェック・位置クランプ
     * @param {Object} position - 位置
     * @param {Object} boundaries - 境界
     * @returns {Object} クランプされた位置
     */
    clampToBoundaries(position, boundaries) {
        if (!boundaries) return position;

        return {
            x: Math.max(boundaries.minX || 0, Math.min(position.x, boundaries.maxX || Infinity)),
            y: Math.max(boundaries.minY || 0, Math.min(position.y, boundaries.maxY || Infinity))
        };
    }

    /**
     * 位置の有効性チェック
     * @param {Object} position - 位置
     * @param {Object} boundaries - 境界
     * @returns {boolean} 有効性
     */
    isValidPosition(position, boundaries) {
        if (!boundaries) return true;

        return position.x >= (boundaries.minX || 0) &&
               position.x <= (boundaries.maxX || Infinity) &&
               position.y >= (boundaries.minY || 0) &&
               position.y <= (boundaries.maxY || Infinity);
    }

    /**
     * ドラッグデータ抽出
     * @param {Object} input - 入力データ
     * @returns {Object} ドラッグデータ
     */
    extractDragData(input) {
        const eventData = input.eventData;
        return {
            startPosition: eventData.startPosition || { x: 0, y: 0 },
            currentPosition: { x: eventData.clientX || 0, y: eventData.clientY || 0 },
            deltaX: eventData.deltaX || 0,
            deltaY: eventData.deltaY || 0
        };
    }

    /**
     * クリックデータ抽出
     * @param {Object} input - 入力データ
     * @returns {Object} クリックデータ
     */
    extractClickData(input) {
        const eventData = input.eventData;
        return {
            position: { x: eventData.clientX || 0, y: eventData.clientY || 0 },
            button: eventData.button || 0,
            timestamp: Date.now()
        };
    }

    /**
     * タッチデータ抽出
     * @param {Object} input - 入力データ
     * @returns {Object} タッチデータ
     */
    extractTouchData(input) {
        const eventData = input.eventData;
        return {
            position: { x: eventData.clientX || 0, y: eventData.clientY || 0 },
            deltaX: eventData.deltaX || 0,
            deltaY: eventData.deltaY || 0,
            pressure: eventData.pressure || 1.0,
            timestamp: Date.now()
        };
    }

    /**
     * 新しい位置計算
     * @param {Object} startPosition - 開始位置
     * @param {number} deltaX - X移動量
     * @param {number} deltaY - Y移動量
     * @returns {Object} 新しい位置
     */
    calculateNewPosition(startPosition, deltaX, deltaY) {
        return {
            x: startPosition.x + deltaX,
            y: startPosition.y + deltaY
        };
    }

    /**
     * ドラッグ状態更新
     * @param {string} targetId - 対象ID
     * @param {Object} dragInfo - ドラッグ情報
     * @returns {Object} ドラッグ状態
     */
    updateDragState(targetId, dragInfo) {
        const dragState = {
            ...dragInfo,
            isDragging: true,
            updatedAt: Date.now()
        };

        this.activeInteractions.set(targetId, dragState);
        return dragState;
    }

    /**
     * 位置の正規化
     * @param {Object} position - 位置
     * @param {Object} containerSize - コンテナサイズ
     * @returns {Object} 正規化された位置
     */
    normalizePosition(position, containerSize) {
        if (!containerSize) return position;

        return {
            x: position.x / containerSize.width,
            y: position.y / containerSize.height,
            absoluteX: position.x,
            absoluteY: position.y
        };
    }

    /**
     * クリック種別判定
     * @param {string} targetId - 対象ID
     * @param {Object} clickData - クリックデータ
     * @returns {string} クリック種別
     */
    determineClickType(targetId, clickData) {
        const lastClick = this.getLastInteraction(targetId, 'click');
        
        if (lastClick && (clickData.timestamp - lastClick.timestamp) < this.gestureConfig.doubleTapInterval) {
            return 'double_click';
        }
        
        return 'single_click';
    }

    /**
     * クリック効果計算
     * @param {string} clickType - クリック種別
     * @param {Object} config - 設定
     * @returns {Object} 効果データ
     */
    calculateClickEffect(clickType, config) {
        const effects = {
            'single_click': { action: 'select', intensity: 1.0 },
            'double_click': { action: 'activate', intensity: 2.0 }
        };

        const baseEffect = effects[clickType] || effects['single_click'];
        const intensity = (config?.intensity || 1.0) * baseEffect.intensity;

        return {
            ...baseEffect,
            intensity: intensity,
            duration: config?.effectDuration || 500
        };
    }

    /**
     * タッチタイプ判定
     * @param {Object} touchData - タッチデータ
     * @returns {string} タッチタイプ
     */
    determineTouchType(touchData) {
        const distance = Math.sqrt(touchData.deltaX * touchData.deltaX + touchData.deltaY * touchData.deltaY);
        
        if (distance < this.gestureConfig.swipeThreshold) {
            return 'tap';
        } else {
            return 'swipe';
        }
    }

    /**
     * スワイプ方向計算
     * @param {number} deltaX - X移動量
     * @param {number} deltaY - Y移動量
     * @returns {string} スワイプ方向
     */
    calculateSwipeDirection(deltaX, deltaY) {
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        if (angle >= -45 && angle < 45) return 'right';
        if (angle >= 45 && angle < 135) return 'down';
        if (angle >= 135 || angle < -135) return 'left';
        return 'up';
    }

    /**
     * スワイプ速度計算
     * @param {Object} touchData - タッチデータ
     * @returns {number} スワイプ速度
     */
    calculateSwipeVelocity(touchData) {
        const distance = Math.sqrt(touchData.deltaX * touchData.deltaX + touchData.deltaY * touchData.deltaY);
        const timeElapsed = touchData.timestamp - (touchData.startTime || touchData.timestamp);
        
        return timeElapsed > 0 ? distance / timeElapsed : 0;
    }

    /**
     * ダブルタップチェック
     * @param {string} targetId - 対象ID
     * @param {number} timestamp - タイムスタンプ
     * @returns {boolean} ダブルタップかどうか
     */
    checkDoubleTap(targetId, timestamp) {
        const lastTap = this.getLastInteraction(targetId, 'tap');
        
        if (lastTap && (timestamp - lastTap.timestamp) < this.gestureConfig.doubleTapInterval) {
            return true;
        }
        
        return false;
    }

    /**
     * 最後のインタラクション取得
     * @param {string} targetId - 対象ID
     * @param {string} type - インタラクションタイプ
     * @returns {Object|null} 最後のインタラクション
     */
    getLastInteraction(targetId, type) {
        const filtered = this.interactionHistory.filter(
            interaction => interaction.targetId === targetId && interaction.type === type
        );
        
        return filtered.length > 0 ? filtered[filtered.length - 1] : null;
    }

    /**
     * インタラクション履歴記録
     * @param {string} interactionId - インタラクションID
     * @param {Object} input - 入力データ
     * @param {Object} result - 結果データ
     */
    recordInteraction(interactionId, input, result) {
        const record = {
            interactionId: interactionId,
            targetId: input.targetId,
            type: input.interactionType,
            timestamp: Date.now(),
            input: input,
            result: result
        };

        this.interactionHistory.push(record);
        this.interactions.set(interactionId, record);

        // 履歴サイズ制限（最新1000件まで）
        if (this.interactionHistory.length > 1000) {
            this.interactionHistory.shift();
        }
    }

    /**
     * アクティブインタラクション終了
     * @param {string} targetId - 対象ID
     */
    endActiveInteraction(targetId) {
        this.activeInteractions.delete(targetId);
        console.log('✅ アクティブインタラクション終了:', targetId);
    }

    /**
     * 入力検証
     * @param {Object} input - 入力データ
     * @returns {Object|null} 検証済み入力またはnull
     */
    validateInput(input) {
        if (!input || typeof input !== 'object') {
            console.error('❌ 無効な入力: オブジェクトが必要');
            return null;
        }

        return {
            interactionType: input.interactionType || 'click',
            targetId: input.targetId || 'unknown',
            eventData: input.eventData || {},
            config: input.config || {}
        };
    }

    /**
     * モジュール状態取得
     * @returns {Object} 現在の状態
     */
    getState() {
        return {
            totalInteractions: this.interactions.size,
            activeInteractions: this.activeInteractions.size,
            historyLength: this.interactionHistory.length,
            isInitialized: this.isInitialized
        };
    }

    /**
     * 完全クリーンアップ
     * マイクロモジュール設計の必須メソッド
     */
    cleanup() {
        console.log('🧹 Interaction Handler クリーンアップ実行');
        
        this.interactions.clear();
        this.activeInteractions.clear();
        this.interactionHistory = [];
        this.interactionCounter = 0;
        this.isInitialized = false;
        
        console.log('✅ Interaction Handler クリーンアップ完了');
    }

    /**
     * 単独テスト（マイクロモジュール設計の必須メソッド）
     * @returns {boolean} テスト結果
     */
    static test() {
        console.log('🧪 Interaction Handler 単独テスト開始');
        
        try {
            const handler = new InteractionHandler();

            // テスト1: ドラッグインタラクション
            const dragResult = handler.processInteraction({
                interactionType: "drag",
                targetId: "test_001",
                eventData: {
                    startPosition: { x: 100, y: 100 },
                    clientX: 150,
                    clientY: 120,
                    deltaX: 50,
                    deltaY: 20
                },
                config: {
                    sensitivity: 1.0,
                    boundaries: { minX: 0, maxX: 1200, minY: 0, maxY: 800 }
                }
            });

            if (!dragResult || dragResult.type !== 'drag') {
                throw new Error('ドラッグインタラクションテスト失敗');
            }

            // テスト2: キーボードインタラクション
            const keyboardResult = handler.processInteraction({
                interactionType: "keyboard",
                targetId: "test_002",
                eventData: {
                    key: "ArrowLeft",
                    shiftKey: true,
                    currentPosition: { x: 200, y: 150 }
                },
                config: {
                    sensitivity: 1.0,
                    moveAmount: 5
                }
            });

            if (!keyboardResult || keyboardResult.type !== 'keyboard') {
                throw new Error('キーボードインタラクションテスト失敗');
            }

            // テスト3: クリックインタラクション
            const clickResult = handler.processInteraction({
                interactionType: "click",
                targetId: "test_003",
                eventData: {
                    clientX: 300,
                    clientY: 250,
                    button: 0
                },
                config: {
                    containerSize: { width: 1200, height: 800 }
                }
            });

            if (!clickResult || clickResult.type !== 'click') {
                throw new Error('クリックインタラクションテスト失敗');
            }

            // テスト4: クリーンアップ
            handler.cleanup();
            const state = handler.getState();
            
            if (state.totalInteractions !== 0 || state.historyLength !== 0) {
                throw new Error('クリーンアップテスト失敗');
            }

            console.log('✅ Interaction Handler 単独テスト成功');
            return true;

        } catch (error) {
            console.error('❌ Interaction Handler 単独テスト失敗:', error);
            return false;
        }
    }
}

// モジュールエクスポート（環境非依存）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InteractionHandler;
} else {
    window.InteractionHandler = InteractionHandler;
}

console.log('✅ Interaction Handler マイクロモジュール読み込み完了');