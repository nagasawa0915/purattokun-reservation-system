/**
 * Spine ドラッグ&ドロップ配置システム
 * リアルタイムでキャラクターを移動し、座標を自動取得・保存
 */

class SpineDragPositioning {
    constructor(coordinateUtils) {
        this.coordinateUtils = coordinateUtils;
        this.isDragging = false;
        this.currentCharacter = null;
        this.currentConfig = null;
        this.dragStartPosition = { x: 0, y: 0 };
        this.isPositioningMode = false;
        
        console.log('🖱️ SpineDragPositioning システム初期化');
    }

    /**
     * 配置モードの有効化/無効化
     */
    togglePositioningMode() {
        this.isPositioningMode = !this.isPositioningMode;
        
        if (this.isPositioningMode) {
            this.enablePositioningMode();
        } else {
            this.disablePositioningMode();
        }
        
        console.log(`🎯 配置モード: ${this.isPositioningMode ? '有効' : '無効'}`);
        return this.isPositioningMode;
    }

    /**
     * 配置モード有効化
     */
    enablePositioningMode() {
        // 全Canvasにドラッグイベントを追加
        this.setupCanvasDragEvents();
        
        // 配置モードUI表示
        this.showPositioningUI();
        
        // カーソル変更
        document.body.style.cursor = 'crosshair';
        
        console.log('✅ 配置モード有効化：キャラクターをドラッグして移動できます');
        console.log('💡 ヒント：ドラッグ完了時にHTML設定コードが生成されます');
    }

    /**
     * 配置モード無効化
     */
    disablePositioningMode() {
        // イベントリスナー削除
        this.removeCanvasDragEvents();
        
        // UI非表示
        this.hidePositioningUI();
        
        // カーソル復元
        document.body.style.cursor = '';
        
        console.log('❌ 配置モード無効化');
    }

    /**
     * Canvasドラッグイベントセットアップ
     */
    setupCanvasDragEvents() {
        // 全Spineキャラクターのキャンバスを検索
        const characters = window.spineManager?.characterManager?.characters;
        if (!characters) return;

        characters.forEach((character, name) => {
            if (character.canvas && character.type === 'spine') {
                this.addDragEventsToCanvas(character.canvas, character, name);
            }
        });
    }

    /**
     * 個別CanvasにドラッグイベントA追加
     */
    addDragEventsToCanvas(canvas, character, characterName) {
        // マウスダウンイベント
        const mouseDownHandler = (event) => {
            this.startDrag(event, character, characterName);
        };

        // マウス移動イベント
        const mouseMoveHandler = (event) => {
            this.onDrag(event);
        };

        // マウスアップイベント
        const mouseUpHandler = (event) => {
            this.endDrag(event);
        };

        // イベントリスナー追加
        canvas.addEventListener('mousedown', mouseDownHandler);
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);

        // 削除用にキャンバスに保存
        canvas._dragEventHandlers = {
            mousedown: mouseDownHandler,
            mousemove: mouseMoveHandler,
            mouseup: mouseUpHandler
        };

        console.log(`🖱️ ドラッグイベント追加: ${characterName}`);
    }

    /**
     * ドラッグ開始
     */
    startDrag(event, character, characterName) {
        if (!this.isPositioningMode) return;

        this.isDragging = true;
        this.currentCharacter = character;
        this.currentCharacterName = characterName;

        // 開始位置を記録
        this.dragStartPosition = {
            x: event.clientX,
            y: event.clientY
        };

        // 現在の設定を取得
        this.currentConfig = this.coordinateUtils.loadConfigFromHTML('purattokun-config');

        console.log(`🎯 ドラッグ開始: ${characterName}`, this.dragStartPosition);
        
        // カーソル変更
        document.body.style.cursor = 'grabbing';
        
        // ドラッグ中のvisual feedback
        if (character.canvas) {
            character.canvas.style.opacity = '0.8';
            character.canvas.style.filter = 'drop-shadow(0 4px 8px rgba(255, 107, 107, 0.5))';
        }

        // イベントを停止（他のクリックイベントの実行を防ぐ）
        event.preventDefault();
        event.stopPropagation();
    }

    /**
     * ドラッグ中の処理
     */
    onDrag(event) {
        if (!this.isDragging || !this.currentCharacter) return;

        // マウス移動量を計算
        const deltaX = event.clientX - this.dragStartPosition.x;
        const deltaY = event.clientY - this.dragStartPosition.y;

        // 現在のビューポート座標を計算
        const currentViewport = this.coordinateUtils.mouseEventToViewport(event);
        
        // リアルタイムでキャラクター位置を更新
        this.updateCharacterPosition(currentViewport.x, currentViewport.y);
        
        // デバッグ情報をリアルタイム表示
        this.updatePositioningUI(currentViewport.x, currentViewport.y);

        event.preventDefault();
    }

    /**
     * ドラッグ終了
     */
    endDrag(event) {
        if (!this.isDragging) return;

        const finalViewport = this.coordinateUtils.mouseEventToViewport(event);
        
        console.log(`🎯 ドラッグ終了: ${this.currentCharacterName}`, finalViewport);

        // 最終位置でHTML設定を更新
        this.savePositionToHTML(finalViewport.x, finalViewport.y);

        // Visual feedbackをリセット
        if (this.currentCharacter.canvas) {
            this.currentCharacter.canvas.style.opacity = '1';
            this.currentCharacter.canvas.style.filter = '';
        }

        // カーソル復元
        document.body.style.cursor = 'crosshair';

        // ドラッグ状態をリセット
        this.isDragging = false;
        this.currentCharacter = null;
        this.currentCharacterName = null;

        event.preventDefault();
    }

    /**
     * キャラクター位置をリアルタイム更新
     */
    updateCharacterPosition(vpX, vpY) {
        const config = { 
            ...this.currentConfig, 
            x: vpX, 
            y: vpY 
        };

        const placement = this.coordinateUtils.calculateCharacterPlacement(config);

        // CSS基準配置モード：Canvas位置更新は無効化
        if (this.currentCharacter.canvas) {
            console.log('🎨 ドラッグ機能：CSS制御モードのため位置更新スキップ');
            // this.currentCharacter.canvas.style.left = placement.canvas.x + 'px'; // 無効化
            // this.currentCharacter.canvas.style.top = placement.canvas.y + 'px';  // 無効化
        }

        // Spine座標更新
        if (this.currentCharacter.skeleton) {
            this.currentCharacter.skeleton.x = placement.character.x;
            this.currentCharacter.skeleton.y = placement.character.y;
        }

        // プレースホルダー更新
        if (this.currentCharacter.element) {
            const pixel = this.coordinateUtils.viewportToPixel(vpX, vpY);
            this.currentCharacter.element.style.left = pixel.x + 'px';
            this.currentCharacter.element.style.top = pixel.y + 'px';
        }
    }

    /**
     * HTML設定を新しい位置に保存
     */
    savePositionToHTML(vpX, vpY) {
        const newConfig = {
            ...this.currentConfig,
            x: parseFloat(vpX.toFixed(1)),
            y: parseFloat(vpY.toFixed(1))
        };

        // HTML設定を更新
        this.coordinateUtils.updateHTMLConfig('purattokun-config', newConfig);

        // コピペ用HTMLコードを生成
        const htmlCode = this.coordinateUtils.generateConfigCode(newConfig);
        
        console.group('💾 位置保存完了');
        console.log('📍 新しい座標:', { x: newConfig.x + 'vw', y: newConfig.y + 'vh' });
        console.log('📋 HTML設定コード（コピペ用）:');
        console.log(htmlCode);
        console.groupEnd();

        // 設定コードをクリップボードにコピー（可能な場合）
        this.copyToClipboard(htmlCode);
    }

    /**
     * クリップボードにコピー
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            console.log('📋 HTML設定コードをクリップボードにコピーしました');
            this.showCopyNotification('設定コードをクリップボードにコピーしました！');
        } catch (err) {
            console.log('⚠️ クリップボードへのコピーに失敗（手動でコピーしてください）');
        }
    }

    /**
     * 配置モードUI表示
     */
    showPositioningUI() {
        // 既存UIがあれば削除
        this.hidePositioningUI();

        const ui = document.createElement('div');
        ui.id = 'spine-positioning-ui';
        ui.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 107, 107, 0.95);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            min-width: 200px;
        `;

        ui.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px;">🎯 配置モード有効</div>
            <div id="position-display">座標: --, --</div>
            <div style="margin-top: 10px; font-size: 10px;">
                ・キャラクターをドラッグで移動<br>
                ・ドラッグ完了で設定保存
            </div>
            <button id="exit-positioning" style="
                margin-top: 10px;
                background: white;
                border: none;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 10px;
            ">配置モード終了</button>
        `;

        document.body.appendChild(ui);

        // 終了ボタンイベント
        document.getElementById('exit-positioning').addEventListener('click', () => {
            this.disablePositioningMode();
        });
    }

    /**
     * 配置モードUI更新
     */
    updatePositioningUI(vpX, vpY) {
        const display = document.getElementById('position-display');
        if (display) {
            display.textContent = `座標: ${vpX.toFixed(1)}vw, ${vpY.toFixed(1)}vh`;
        }
    }

    /**
     * 配置モードUI非表示
     */
    hidePositioningUI() {
        const ui = document.getElementById('spine-positioning-ui');
        if (ui) {
            ui.remove();
        }
    }

    /**
     * コピー通知表示
     */
    showCopyNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 150, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-family: sans-serif;
            z-index: 10001;
            text-align: center;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * イベントリスナー削除
     */
    removeCanvasDragEvents() {
        const characters = window.spineManager?.characterManager?.characters;
        if (!characters) return;

        characters.forEach((character) => {
            if (character.canvas && character.canvas._dragEventHandlers) {
                const handlers = character.canvas._dragEventHandlers;
                
                character.canvas.removeEventListener('mousedown', handlers.mousedown);
                document.removeEventListener('mousemove', handlers.mousemove);
                document.removeEventListener('mouseup', handlers.mouseup);
                
                delete character.canvas._dragEventHandlers;
            }
        });
    }

    /**
     * グローバル配置モード切り替え関数をセットアップ
     */
    setupGlobalToggle() {
        window.toggleSpinePositioning = () => {
            return this.togglePositioningMode();
        };

        console.log('🎯 配置モード切り替え：window.toggleSpinePositioning() で有効化');
    }
}