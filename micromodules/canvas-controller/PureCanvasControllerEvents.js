/**
 * PureCanvasControllerEvents.js - 詳細診断版
 * 
 * 🎯 Canvas制御イベント管理マイクロモジュール
 * - 外部依存: PureCanvasControllerCore, PureCanvasControllerUI, PureCanvasControllerBounds
 * - 責務: マウス・キーボードイベント・Canvas操作のイベント処理のみ
 * - 基盤: PureBoundingBoxEventsからイベント処理システム流用・Canvas特化
 * - 🚨 診断機能: 詳細デバッグログによるイベント処理追跡
 */

class PureCanvasControllerEvents {
    constructor(core, ui, bounds) {
        this.core = core;
        this.ui = ui;
        this.bounds = bounds;
        
        // イベントリスナー参照（削除用）
        this.eventListeners = {
            mousedown: null,
            mousemove: null,
            mouseup: null,
            keydown: null,
            keyup: null
        };
        
        // イベント状態
        this.eventState = {
            isListening: false,
            currentTarget: null
        };
        
        // 🚨 診断用カウンター・ログ
        this.diagnostics = {
            mousedownCalls: 0,
            handleDetections: 0,
            successfulHandleEvents: 0,
            failedHandleEvents: 0,
            lastEventTime: 0,
            eventLog: []
        };
        
        // 診断モード有効化
        this.debugMode = true;
        
        this.log('🎯 PureCanvasControllerEvents初期化完了（診断モード有効）');
    }
    
    /**
     * 診断専用ログ
     */
    log(message, type = 'info') {
        if (!this.debugMode) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] 🎯Canvas Events: ${message}`;
        
        // コンソールに色付きで出力
        const colors = {
            info: 'color: #3498db',
            success: 'color: #2ecc71', 
            error: 'color: #e74c3c',
            warning: 'color: #f39c12',
            debug: 'color: #9b59b6'
        };
        
        console.log(`%c${logEntry}`, colors[type] || colors.info);
        
        // 診断ログに記録
        this.diagnostics.eventLog.push({
            timestamp,
            message,
            type
        });
        
        // ログが100件を超えたら古いものを削除
        if (this.diagnostics.eventLog.length > 100) {
            this.diagnostics.eventLog.shift();
        }
    }
    
    /**
     * Canvas制御イベント開始
     */
    startListening() {
        if (this.eventState.isListening) {
            this.log('既にイベントリスナーが開始済みです', 'warning');
            return;
        }
        
        this.log('🚀 イベントリスナー開始処理開始');
        
        // マウスイベント設定
        this.eventListeners.mousedown = this.handleMouseDown.bind(this);
        this.eventListeners.mousemove = this.handleMouseMove.bind(this);
        this.eventListeners.mouseup = this.handleMouseUp.bind(this);
        
        // キーボードイベント設定
        this.eventListeners.keydown = this.handleKeyDown.bind(this);
        this.eventListeners.keyup = this.handleKeyUp.bind(this);
        
        this.log('イベントハンドラー関数をバインド完了');
        
        // イベントリスナー登録
        document.addEventListener('mousedown', this.eventListeners.mousedown);
        document.addEventListener('mousemove', this.eventListeners.mousemove);
        document.addEventListener('mouseup', this.eventListeners.mouseup);
        document.addEventListener('keydown', this.eventListeners.keydown);
        document.addEventListener('keyup', this.eventListeners.keyup);
        
        this.eventState.isListening = true;
        
        this.log('✅ イベントリスナー登録完了', 'success');
        
        // 登録確認のテスト
        this.verifyEventListeners();
    }
    
    /**
     * イベントリスナー登録確認
     */
    verifyEventListeners() {
        this.log('🔍 イベントリスナー登録状況を確認中', 'debug');
        
        // getEventListenersがあれば確認（Chrome DevTools）
        if (typeof getEventListeners === 'function') {
            try {
                const listeners = getEventListeners(document);
                this.log(`📊 document上のmousedownリスナー数: ${listeners.mousedown ? listeners.mousedown.length : 0}`, 'debug');
                this.log(`📊 document上のmousemoveリスナー数: ${listeners.mousemove ? listeners.mousemove.length : 0}`, 'debug');
            } catch (e) {
                this.log('getEventListeners利用不可（正常）', 'debug');
            }
        }
        
        // 手動でテストイベント発火
        setTimeout(() => {
            this.testEventResponsiveness();
        }, 100);
    }
    
    /**
     * イベント応答性テスト
     */
    testEventResponsiveness() {
        this.log('🧪 イベント応答性テスト開始', 'debug');
        
        // 仮想マウスイベント作成
        const testEvent = new MouseEvent('mousedown', {
            clientX: 100,
            clientY: 100,
            bubbles: true,
            cancelable: true
        });
        
        // テスト用の一時的なターゲット
        const testDiv = document.createElement('div');
        testDiv.id = 'canvas-events-test-target';
        testDiv.style.cssText = 'position: absolute; left: -9999px; width: 1px; height: 1px;';
        document.body.appendChild(testDiv);
        
        // マウスダウン処理の呼び出し回数記録
        const beforeCount = this.diagnostics.mousedownCalls;
        
        // テストイベント発火
        testDiv.dispatchEvent(testEvent);
        
        // 結果確認
        setTimeout(() => {
            const afterCount = this.diagnostics.mousedownCalls;
            if (afterCount > beforeCount) {
                this.log('✅ イベント応答性テスト成功', 'success');
            } else {
                this.log('❌ イベント応答性テスト失敗', 'error');
            }
            
            // テスト要素削除
            document.body.removeChild(testDiv);
        }, 50);
    }
    
    /**
     * Canvas制御イベント停止
     */
    stopListening() {
        if (!this.eventState.isListening) return;
        
        this.log('🛑 イベントリスナー停止開始');
        
        // イベントリスナー削除
        document.removeEventListener('mousedown', this.eventListeners.mousedown);
        document.removeEventListener('mousemove', this.eventListeners.mousemove);
        document.removeEventListener('mouseup', this.eventListeners.mouseup);
        document.removeEventListener('keydown', this.eventListeners.keydown);
        document.removeEventListener('keyup', this.eventListeners.keyup);
        
        // 参照クリア
        Object.keys(this.eventListeners).forEach(key => {
            this.eventListeners[key] = null;
        });
        
        this.eventState.isListening = false;
        this.eventState.currentTarget = null;
        
        this.log('✅ イベントリスナー停止完了', 'success');
    }
    
    /**
     * マウスダウンイベント処理（詳細診断版）
     */
    handleMouseDown(event) {
        this.diagnostics.mousedownCalls++;
        this.diagnostics.lastEventTime = Date.now();
        
        this.log(`🖱️ mousedown発生 #${this.diagnostics.mousedownCalls}`, 'debug');
        this.log(`  target: ${event.target.tagName}.${event.target.className}`, 'debug');
        this.log(`  位置: (${event.clientX}, ${event.clientY})`, 'debug');
        
        if (!this.ui.elements.container) {
            this.log('❌ UI container未初期化', 'error');
            return;
        }
        
        const target = event.target;
        
        // Canvas制御UIのハンドル判定（詳細診断）
        this.log('🔍 ハンドル判定開始', 'debug');
        
        const isHandle = this.ui.isHandle(target);
        this.log(`  isHandle結果: ${isHandle}`, 'debug');
        
        if (isHandle) {
            this.diagnostics.handleDetections++;
            
            const handleType = this.ui.getHandleType(target);
            this.log(`  ハンドルタイプ: ${handleType}`, 'debug');
            
            if (handleType) {
                this.log(`✅ ハンドル検出成功 #${this.diagnostics.handleDetections}: ${handleType}`, 'success');
                
                try {
                    this.startCanvasResize(event, handleType);
                    this.diagnostics.successfulHandleEvents++;
                    this.log(`🎯 ハンドルイベント処理成功 #${this.diagnostics.successfulHandleEvents}`, 'success');
                } catch (error) {
                    this.diagnostics.failedHandleEvents++;
                    this.log(`❌ ハンドルイベント処理失敗 #${this.diagnostics.failedHandleEvents}: ${error.message}`, 'error');
                }
                
                return;
            } else {
                this.log('❌ ハンドルタイプ取得失敗', 'error');
                this.diagnostics.failedHandleEvents++;
            }
        } else {
            this.log('ハンドル以外の要素をクリック', 'debug');
        }
        
        // Canvas中央エリア判定（移動開始）
        const isMainArea = this.isCanvasMainArea(target);
        this.log(`  isMainArea結果: ${isMainArea}`, 'debug');
        
        if (isMainArea) {
            this.log('🎯 Canvas中央エリア検出', 'debug');
            this.startCanvasMove(event);
            return;
        }
        
        this.log('イベント対象外の要素', 'debug');
    }
    
    /**
     * マウス移動イベント処理
     */
    handleMouseMove(event) {
        if (!this.core.dragState.isDragging) return;
        
        const deltaX = event.clientX - this.core.dragState.startMouseX;
        const deltaY = event.clientY - this.core.dragState.startMouseY;
        
        if (this.core.dragState.dragType === 'move') {
            // Canvas移動処理
            const newCanvasState = this.bounds.calculateCanvasMove(deltaX, deltaY);
            this.bounds.applyCanvasStateToElement(newCanvasState);
            
        } else if (this.core.dragState.dragType.startsWith('resize-')) {
            // Canvasリサイズ処理
            const handleType = this.core.dragState.dragType.replace('resize-', '');
            const newCanvasState = this.bounds.calculateCanvasResize(deltaX, deltaY, handleType);
            this.bounds.applyCanvasStateToElement(newCanvasState);
        }
        
        // UI更新（情報パネル等）
        this.ui.updateUI();
        
        event.preventDefault();
    }
    
    /**
     * マウスアップイベント処理
     */
    handleMouseUp(event) {
        if (!this.core.dragState.isDragging) return;
        
        // ドラッグ終了処理
        this.core.endDrag();
        
        // 最終状態のログ出力（ドラッグ終了時のみ）
        const canvasState = this.core.canvasState;
        this.log(`🎯 Canvas編集完了: ${canvasState.width}x${canvasState.height}`, 'success');
        
        // Skeleton位置自動調整（必要に応じて）
        if (this.core.config.autoFitContent) {
            this.bounds.adjustSkeletonPosition();
        }
        
        event.preventDefault();
    }
    
    /**
     * キーダウンイベント処理
     */
    handleKeyDown(event) {
        // 修飾キー状態更新
        this.core.updateModifierKeys(event);
        
        // Canvas制御ショートカット
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case '0':
                    // Canvas リセット
                    event.preventDefault();
                    this.resetCanvas();
                    break;
                case '=':
                case '+':
                    // Canvas 自動フィット
                    event.preventDefault();
                    this.autoFitCanvas();
                    break;
            }
        }
        
        // ESCキー: 編集モード終了
        if (event.key === 'Escape' && this.core.swapState.currentMode === 'editing') {
            this.exitEditingMode();
        }
    }
    
    /**
     * キーアップイベント処理
     */
    handleKeyUp(event) {
        // 修飾キー状態更新
        this.core.updateModifierKeys(event);
    }
    
    /**
     * Canvas移動開始
     */
    startCanvasMove(event) {
        // 編集モード進入
        this.core.enterEditingMode();
        
        // ドラッグ状態開始
        this.core.startDrag(event, 'move');
        
        this.log('🎯 Canvas移動開始', 'success');
        event.preventDefault();
    }
    
    /**
     * Canvasリサイズ開始（詳細診断版）
     */
    startCanvasResize(event, handleType) {
        this.log(`🎯 Canvasリサイズ開始処理: ${handleType}`, 'debug');
        
        try {
            // 編集モード進入
            this.core.enterEditingMode();
            this.log('編集モード進入完了', 'debug');
            
            // ドラッグ状態開始
            this.core.startDrag(event, `resize-${handleType}`);
            this.log(`ドラッグ状態開始完了: resize-${handleType}`, 'debug');
            
            this.log(`✅ Canvasリサイズ開始成功: ${handleType}`, 'success');
            event.preventDefault();
            
        } catch (error) {
            this.log(`❌ Canvasリサイズ開始失敗: ${error.message}`, 'error');
            throw error;
        }
    }
    
    /**
     * Canvas中央エリア判定
     */
    isCanvasMainArea(element) {
        if (!this.ui.elements.container) return false;
        
        // Canvas制御コンテナの中央エリア判定
        return element === this.ui.elements.container ||
               element.closest('.canvas-controller-container') === this.ui.elements.container;
    }
    
    /**
     * Canvas自動フィット実行
     */
    autoFitCanvas() {
        const fitResult = this.bounds.detectAndAutoFit();
        
        if (fitResult.hasOverflow) {
            const recommendedSize = fitResult.recommendedSize;
            
            // 推奨サイズをCanvasに適用
            const newCanvasState = {
                width: recommendedSize.width,
                height: recommendedSize.height
            };
            
            this.bounds.applyCanvasStateToElement(newCanvasState);
            this.ui.updateUI();
            
            this.log(`🎯 Canvas自動フィット実行: ${recommendedSize.width}x${recommendedSize.height}`, 'success');
        } else {
            this.log('🎯 Canvas自動フィット: はみ出しなし');
        }
    }
    
    /**
     * Canvasリセット実行
     */
    resetCanvas() {
        if (!this.core.config.targetCanvas) return;
        
        // オリジナルサイズに復元
        const originalState = {
            width: this.core.canvasState.originalWidth,
            height: this.core.canvasState.originalHeight
        };
        
        this.bounds.applyCanvasStateToElement(originalState);
        this.ui.updateUI();
        
        this.log(`🎯 Canvasリセット実行: ${originalState.width}x${originalState.height}`, 'success');
    }
    
    /**
     * 編集モード終了
     */
    exitEditingMode() {
        // Core編集モード終了
        this.core.exitEditingMode();
        
        // UI非表示
        this.ui.setVisible(false);
        
        this.log('🎯 Canvas編集モード終了', 'success');
    }
    
    /**
     * コントロールボタンイベント設定
     */
    setupControlCallbacks() {
        this.log('🔧 コントロールボタン機能接続開始', 'debug');
        
        // UI側のコントロールボタン機能を接続
        if (this.ui.onAutoFit) {
            this.ui.onAutoFit = this.autoFitCanvas.bind(this);
        }
        
        if (this.ui.onCenter) {
            this.ui.onCenter = () => {
                this.bounds.adjustSkeletonPosition();
                this.ui.updateUI();
                this.log('⊹ Skeleton中央配置実行', 'success');
            };
        }
        
        if (this.ui.onReset) {
            this.ui.onReset = this.resetCanvas.bind(this);
        }
        
        this.log('✅ コントロールボタン機能接続完了', 'success');
    }
    
    /**
     * 診断レポート生成（外部API）
     */
    getDiagnosticReport() {
        return {
            eventState: this.eventState,
            diagnostics: this.diagnostics,
            ui: {
                containerExists: !!this.ui.elements.container,
                handlesCount: this.ui.elements.handles ? this.ui.elements.handles.length : 0,
                isVisible: this.ui.elements.container ? this.ui.elements.container.style.display !== 'none' : false
            },
            core: {
                initialized: !!this.core,
                canvasExists: !!(this.core && this.core.config && this.core.config.targetCanvas)
            },
            recentLogs: this.diagnostics.eventLog.slice(-10) // 最新10件のログ
        };
    }
    
    /**
     * ハンドル要素の詳細診断（外部API）
     */
    diagnoseHandles() {
        this.log('🔍 ハンドル要素の詳細診断開始', 'debug');
        
        if (!this.ui.elements.container) {
            this.log('❌ UI container未初期化', 'error');
            return { error: 'UI container not initialized' };
        }
        
        const handles = this.ui.elements.handles;
        if (!handles || handles.length === 0) {
            this.log('❌ ハンドル要素が見つかりません', 'error');
            return { error: 'No handles found' };
        }
        
        const handleInfo = handles.map((handle, index) => {
            const rect = handle.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(handle);
            
            return {
                index,
                type: handle.dataset.handleType,
                className: handle.className,
                visible: computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden',
                position: {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height
                },
                css: {
                    pointerEvents: computedStyle.pointerEvents,
                    zIndex: computedStyle.zIndex,
                    position: computedStyle.position,
                    cursor: computedStyle.cursor
                },
                inDocument: document.contains(handle)
            };
        });
        
        this.log(`📊 ハンドル診断結果: ${handles.length}個のハンドルを検出`, 'debug');
        handleInfo.forEach(info => {
            this.log(`  ハンドル${info.index} (${info.type}): visible=${info.visible}, pointerEvents=${info.css.pointerEvents}`, 'debug');
        });
        
        return {
            success: true,
            totalHandles: handles.length,
            handles: handleInfo
        };
    }
    
    /**
     * 完全クリーンアップ
     */
    destroy() {
        // イベント停止
        this.stopListening();
        
        // 編集モード終了
        this.exitEditingMode();
        
        // 状態クリア
        this.eventState.currentTarget = null;
        
        this.log('🎯 Canvas制御イベントシステム完全削除', 'success');
    }
    
    /**
     * 単独テスト
     */
    static test() {
        console.log('🧪 PureCanvasControllerEvents テスト開始');
        
        // モックCanvas作成
        const mockCanvas = {
            offsetTop: 100, offsetLeft: 200,
            offsetWidth: 300, offsetHeight: 400,
            width: 300, height: 400
        };
        
        // モック依存関係作成
        const mockCore = {
            config: { targetCanvas: mockCanvas },
            canvasState: { width: 300, height: 400, originalWidth: 300, originalHeight: 400 },
            skeletonState: { x: 150, y: 200 },
            dragState: { isDragging: false },
            swapState: { currentMode: 'idle' },
            enterEditingMode: () => console.log('編集モード進入'),
            exitEditingMode: () => console.log('編集モード終了'),
            startDrag: (event, type) => console.log('ドラッグ開始:', type),
            endDrag: () => console.log('ドラッグ終了'),
            updateModifierKeys: () => console.log('修飾キー更新')
        };
        
        const mockUI = {
            elements: { container: null },
            isHandle: () => false,
            getHandleType: () => null,
            updateUI: () => console.log('UI更新'),
            setVisible: (visible) => console.log('UI表示:', visible)
        };
        
        const mockBounds = {
            calculateCanvasMove: () => ({ width: 300, height: 400 }),
            calculateCanvasResize: () => ({ width: 350, height: 450 }),
            applyCanvasStateToElement: () => console.log('Canvas状態適用'),
            adjustSkeletonPosition: () => console.log('Skeleton位置調整'),
            detectAndAutoFit: () => ({ hasOverflow: false })
        };
        
        try {
            const events = new PureCanvasControllerEvents(mockCore, mockUI, mockBounds);
            
            // 基本機能テスト
            events.startListening();
            events.setupControlCallbacks();
            
            // 診断機能テスト
            const report = events.getDiagnosticReport();
            console.log('診断レポート:', report);
            
            events.autoFitCanvas();
            events.resetCanvas();
            events.stopListening();
            events.destroy();
            
            console.log('✅ PureCanvasControllerEvents テスト成功');
            return { success: true, result: 'All tests passed', error: null };
            
        } catch (error) {
            console.error('❌ PureCanvasControllerEvents テスト失敗:', error);
            return { success: false, result: null, error: error.message };
        }
    }
}

// Node.js環境対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PureCanvasControllerEvents;
}
