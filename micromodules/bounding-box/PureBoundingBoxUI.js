/**
 * PureBoundingBoxUI.js
 * 
 * 🎯 UI生成・表示制御マイクロモジュール  
 * - 外部依存: PureBoundingBoxCore（同フォルダ内）
 * - 責務: DOM操作・UI生成・表示制御のみ
 */

class PureBoundingBoxUI {
    constructor(core) {
        this.core = core;
        
        // 🎯 自動ピンシステム統合
        this.autoPin = null;
        this.autoPinInitialized = false;
        this.contextMenu = null;
        
        // 🎯 レスポンシブシステム統合
        this.responsiveSystem = null;
        this.responsiveInitialized = false;
        
        this.initializeAutoPin();
        this.initializeResponsiveSystem();
    }
    
    /**
     * バウンディングボックスUI作成
     */
    createBoundingBoxUI() {
        // コンテナ作成
        const container = document.createElement('div');
        container.id = `bb-container-${this.core.config.nodeId}`;
        container.style.cssText = `
            position: fixed;
            border: 2px solid #007cff;
            pointer-events: none;
            z-index: 10000;
            box-sizing: content-box;
        `;
        
        // ハンドル設定
        const handleConfigs = [
            {type: 'nw', cursor: 'nw-resize', left: -4, top: -4},
            {type: 'n',  cursor: 'n-resize',  left: '50%', top: -4, transform: 'translateX(-50%)'},
            {type: 'ne', cursor: 'ne-resize', right: -4, top: -4},
            {type: 'e',  cursor: 'e-resize',  right: -4, top: '50%', transform: 'translateY(-50%)'},
            {type: 'se', cursor: 'se-resize', right: -4, bottom: -4},
            {type: 's',  cursor: 's-resize',  left: '50%', bottom: -4, transform: 'translateX(-50%)'},
            {type: 'sw', cursor: 'sw-resize', left: -4, bottom: -4},
            {type: 'w',  cursor: 'w-resize',  left: -4, top: '50%', transform: 'translateY(-50%)'}
        ];
        
        // ハンドル作成
        const handles = [];
        handleConfigs.forEach(config => {
            const handle = document.createElement('div');
            handle.setAttribute('data-handle-type', config.type);
            
            let handleStyle = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: #007cff;
                border: 1px solid white;
                cursor: ${config.cursor};
                pointer-events: all;
                box-sizing: border-box;
            `;
            
            // 位置設定
            if (config.left !== undefined) handleStyle += `left: ${config.left}${typeof config.left === 'number' ? 'px' : ''};`;
            if (config.right !== undefined) handleStyle += `right: ${config.right}px;`;
            if (config.top !== undefined) handleStyle += `top: ${config.top}${typeof config.top === 'number' ? 'px' : ''};`;
            if (config.bottom !== undefined) handleStyle += `bottom: ${config.bottom}px;`;
            if (config.transform) handleStyle += `transform: ${config.transform};`;
            
            handle.style.cssText = handleStyle;
            container.appendChild(handle);
            handles.push(handle);
        });
        
        // 移動ハンドル（中央部分）
        const moveHandle = document.createElement('div');
        moveHandle.setAttribute('data-handle-type', 'move');
        moveHandle.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            cursor: move;
            pointer-events: all;
            background: transparent;
        `;
        container.appendChild(moveHandle);
        handles.push(moveHandle);
        
        document.body.appendChild(container);
        
        // UI状態保存
        this.core.uiState.container = container;
        this.core.uiState.handles = handles;
        
        // 🖱️ 右クリックメニューシステム初期化（container設定後）
        this.setupContextMenu();
        
        console.log('🎨 BB UI作成完了（右クリックメニュー版）');
        return container;
    }
    
    /**
     * UI位置同期
     */
    syncPosition() {
        if (!this.core.uiState.container) return;
        
        const element = this.core.config.targetElement;
        if (!element) return;
        
        const rect = element.getBoundingClientRect();
        
        this.core.uiState.container.style.left = rect.left + 'px';
        this.core.uiState.container.style.top = rect.top + 'px';
        this.core.uiState.container.style.width = rect.width + 'px';
        this.core.uiState.container.style.height = rect.height + 'px';
    }
    
    /**
     * 表示制御
     */
    show() {
        if (this.core.uiState.container) {
            this.core.uiState.container.style.display = 'block';
            this.core.uiState.visible = true;
            this.syncPosition();
        }
    }
    
    hide() {
        if (this.core.uiState.container) {
            this.core.uiState.container.style.display = 'none';
            this.core.uiState.visible = false;
        }
    }
    
    /**
     * UI削除
     */
    remove() {
        if (this.core.uiState.container) {
            this.core.uiState.container.remove();
            this.core.uiState.container = null;
            this.core.uiState.handles = [];
            this.core.uiState.visible = false;
        }
        
        // 右クリックメニューも削除
        if (this.contextMenu) {
            this.contextMenu.remove();
            this.contextMenu = null;
        }
    }
    
    /**
     * ハンドルタイプ取得
     */
    getHandleType(element) {
        return element.getAttribute('data-handle-type');
    }
    
    /**
     * 要素がハンドルかチェック
     */
    isHandle(element) {
        return element.hasAttribute('data-handle-type');
    }
    
    // ==========================================
    // 🎯 自動ピンシステム統合
    // ==========================================
    
    /**
     * 自動ピンシステム初期化
     */
    async initializeAutoPin() {
        try {
            // PureBoundingBoxAutoPin 確認
            if (!window.PureBoundingBoxAutoPin) {
                console.warn('⚠️ PureBoundingBoxAutoPin未検出 - 基本機能のみ利用');
                return;
            }
            
            // 🎯 修正: PureBoundingBoxで作成されるautoPinを待機
            // UIでは独立してAutoPin作成せず、親から参照を受け取る
            console.log('🔄 AutoPin初期化はPureBoundingBoxで実行されます');
            this.autoPinInitialized = true;
            
        } catch (error) {
            console.warn('⚠️ 自動ピンシステム無効 - 基本機能のみ利用:', error.message);
            this.autoPin = null;
            this.autoPinInitialized = false;
        }
    }
    
    /**
     * 🎯 AutoPin参照の設定（PureBoundingBoxから呼び出される）
     */
    setAutoPinReference(autoPinInstance) {
        this.autoPin = autoPinInstance;
        console.log('✅ AutoPin参照をUIに設定完了:', !!autoPinInstance);
    }
    
    /**
     * レスポンシブシステム初期化
     */
    async initializeResponsiveSystem() {
        try {
            // ResponsiveSpineFitIntegration 確認
            if (!window.ResponsiveSpineFitIntegration) {
                console.warn('⚠️ ResponsiveSpineFitIntegration未検出 - 基本機能のみ利用');
                return;
            }
            
            // レスポンシブシステム初期化
            this.responsiveSystem = new window.ResponsiveSpineFitIntegration(this);
            this.responsiveInitialized = true;
            
            console.log('✅ レスポンシブシステム統合完了');
            
        } catch (error) {
            console.warn('⚠️ レスポンシブシステム無効 - 基本機能のみ利用:', error.message);
            this.responsiveSystem = null;
            this.responsiveInitialized = false;
        }
    }
    
    // ==========================================
    // 🖱️ 右クリックメニューシステム
    // ==========================================
    
    /**
     * 右クリックメニューシステム初期化
     */
    setupContextMenu() {
        // メニュー作成
        this.contextMenu = this.createContextMenu();
        
        // 右クリックイベント設定（バウンディングボックス上）
        this.core.uiState.container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showContextMenu(e.clientX, e.clientY);
        });
        
        // キーボードショートカット設定
        this.setupKeyboardShortcuts();
        
        // ドキュメントクリックで非表示
        document.addEventListener('click', (e) => {
            if (this.contextMenu && !this.contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });
        
        console.log('🖱️ 右クリックメニューシステム初期化完了');
    }
    
    /**
     * 右クリックメニュー作成
     */
    createContextMenu() {
        const menu = document.createElement('div');
        menu.className = 'bb-context-menu';
        menu.style.cssText = `
            position: fixed;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            padding: 6px 0;
            z-index: 10002;
            display: none;
            min-width: 140px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(0,0,0,0.1);
        `;
        
        // メニュー項目定義
        const menuItems = [
            { 
                text: '💾 保存', 
                action: () => this.handleSave(), 
                shortcut: 'Enter',
                description: '自動ピン適用'
            },
            { 
                text: '❌ キャンセル', 
                action: () => this.handleCancel(), 
                shortcut: 'Esc',
                description: '編集終了'
            },
            { divider: true },
            { 
                text: '📍 ピン設定', 
                action: () => this.startPinSetting(), 
                shortcut: 'P',
                description: 'F12風要素選択でピン設定'
            },
            { divider: true },
            { 
                text: this.responsiveSystem?.config.enabled ? '📱 レスポンシブ OFF' : '📱 レスポンシブ ON', 
                action: () => this.toggleResponsiveSystem(),
                shortcut: 'R',
                description: this.responsiveSystem?.config.enabled ? '自動追従を無効化' : '背景自動追従を有効化'
            },
            { divider: true },
            { 
                text: '📍 ピン状態', 
                action: () => this.showPinStatus(),
                description: 'アクティブピン確認'
            },
            { 
                text: '📊 統計情報', 
                action: () => this.showStats(),
                description: 'パフォーマンス情報'
            },
            { divider: true },
            { 
                text: '⚙️ 設定', 
                action: () => this.showSettings(),
                description: '詳細設定'
            }
        ];
        
        // メニュー項目を作成
        menuItems.forEach(item => {
            if (item.divider) {
                const divider = document.createElement('div');
                divider.style.cssText = `
                    height: 1px; 
                    background: #eee; 
                    margin: 4px 8px;
                `;
                menu.appendChild(divider);
                return;
            }
            
            const menuItem = document.createElement('div');
            menuItem.className = 'bb-menu-item';
            menuItem.style.cssText = `
                padding: 8px 16px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: background-color 0.15s ease;
                user-select: none;
            `;
            
            menuItem.innerHTML = `
                <div>
                    <div style="font-weight: 500;">${item.text}</div>
                    <div style="font-size: 11px; color: #666; margin-top: 2px;">${item.description || ''}</div>
                </div>
                ${item.shortcut ? `<span style="color: #999; font-size: 11px; font-family: monospace; background: #f5f5f5; padding: 2px 6px; border-radius: 3px;">${item.shortcut}</span>` : ''}
            `;
            
            // ホバーエフェクト
            menuItem.addEventListener('mouseenter', () => {
                menuItem.style.background = '#f8f9fa';
            });
            
            menuItem.addEventListener('mouseleave', () => {
                menuItem.style.background = 'transparent';
            });
            
            // クリックイベント
            menuItem.addEventListener('click', (e) => {
                e.stopPropagation();
                item.action();
                this.hideContextMenu();
            });
            
            menu.appendChild(menuItem);
        });
        
        // 自動ピン状態インジケーター追加
        if (this.autoPinInitialized || this.responsiveInitialized) {
            const indicator = document.createElement('div');
            indicator.style.cssText = `
                padding: 6px 16px;
                background: #e8f5e8;
                border-top: 1px solid #eee;
                font-size: 11px;
                color: #28a745;
                display: flex;
                flex-direction: column;
                gap: 2px;
            `;
            
            let indicatorText = '';
            if (this.autoPinInitialized) {
                indicatorText += '📍 <span>自動追従機能 有効</span>';
            }
            if (this.responsiveInitialized) {
                if (indicatorText) indicatorText += '<br>';
                indicatorText += `📱 <span>レスポンシブ ${this.responsiveSystem?.config.enabled ? '有効' : '無効'}</span>`;
            }
            
            indicator.innerHTML = indicatorText;
            menu.appendChild(indicator);
        }
        
        document.body.appendChild(menu);
        return menu;
    }
    
    /**
     * 右クリックメニュー表示
     */
    showContextMenu(x, y) {
        if (!this.contextMenu) return;
        
        // 表示位置設定
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
        this.contextMenu.style.display = 'block';
        
        // 画面外に出ないよう調整
        requestAnimationFrame(() => {
            const rect = this.contextMenu.getBoundingClientRect();
            
            // 右端チェック
            if (rect.right > window.innerWidth - 10) {
                this.contextMenu.style.left = (x - rect.width) + 'px';
            }
            
            // 下端チェック
            if (rect.bottom > window.innerHeight - 10) {
                this.contextMenu.style.top = (y - rect.height) + 'px';
            }
            
            // フェードイン効果
            this.contextMenu.style.opacity = '0';
            this.contextMenu.style.transform = 'scale(0.95)';
            this.contextMenu.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
            
            requestAnimationFrame(() => {
                this.contextMenu.style.opacity = '1';
                this.contextMenu.style.transform = 'scale(1)';
            });
        });
        
        console.log('🖱️ 右クリックメニュー表示');
    }
    
    /**
     * 右クリックメニュー非表示
     */
    hideContextMenu() {
        if (!this.contextMenu) return;
        
        this.contextMenu.style.opacity = '0';
        this.contextMenu.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            this.contextMenu.style.display = 'none';
        }, 150);
    }
    
    /**
     * キーボードショートカット設定
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // バウンディングボックスが表示されている時のみ
            if (!this.core.uiState.visible) return;
            
            switch (e.key) {
                case 'Enter':
                    e.preventDefault();
                    this.handleSave();
                    break;
                    
                case 'Escape':
                    e.preventDefault();
                    this.handleCancel();
                    break;
                    
                case 's':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.handleSave();
                    }
                    break;
                    
                case 'r':
                case 'R':
                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                        e.preventDefault();
                        this.toggleResponsiveSystem();
                    }
                    break;
            }
        });
        
        console.log('⌨️ キーボードショートカット設定完了');
    }
    
    /**
     * 保存処理（自動ピン統合版）
     */
    async handleSave() {
        console.log('💾 保存処理開始（自動ピン統合版）');
        
        try {
            // 保存データ準備
            const saveData = {
                targetElement: this.core.config.targetElement,
                bounds: this.getCurrentBounds(),
                timestamp: Date.now(),
                nodeId: this.core.config.nodeId,
                responsiveEnabled: this.responsiveSystem?.config.enabled || false
            };
            
            // 基本保存（localStorage）
            this.saveToLocalStorage(saveData);
            
            // 🎯 自動ピン適用
            let autoPinResult = null;
            if (this.autoPin) {
                console.log('🎯 自動ピン適用開始');
                autoPinResult = await this.autoPin.applyAutoPinOnSave(saveData);
                
                if (autoPinResult.success) {
                    // 成功時の視覚フィードバック
                    this.showAutoPinFeedback(autoPinResult);
                    console.log('✅ 自動追従機能が有効になりました:', autoPinResult.pinConfig.anchor);
                } else {
                    // 失敗時は通常の保存のみ
                    console.log('📝 基本保存完了 (自動追従なし):', autoPinResult.fallback);
                }
            } else {
                console.log('📝 基本保存のみ (自動ピンシステム無効)');
            }
            
            // UI非表示
            this.hide();
            
            // 保存完了イベント発火（他のモジュールに通知）
            this.triggerSaveCompleted({
                saveData,
                autoPinResult,
                autoPinEnabled: !!this.autoPin
            });
            
            console.log('✅ 保存処理完了');
            
        } catch (error) {
            console.error('❌ 保存処理エラー:', error);
            this.showErrorFeedback(error.message);
        }
    }
    
    /**
     * キャンセル処理
     */
    handleCancel() {
        console.log('❌ キャンセル処理');
        
        // UI非表示
        this.hide();
        
        // 元の状態に復元（必要に応じて）
        this.restoreOriginalState();
        
        console.log('✅ キャンセル処理完了');
    }
    
    /**
     * 現在のbounds取得
     */
    getCurrentBounds() {
        console.log('🚀 === getCurrentBounds() 診断開始 ===');
        
        // ⭐ 1. UIコンテナ確認
        console.log('🔍 1. UIコンテナ確認:', {
            'this.core.uiState.container': !!this.core.uiState.container,
            'this.core.bounds': this.core.bounds
        });
        
        if (!this.core.uiState.container) {
            console.log('⚠️ UIコンテナなし - core.boundsを返す:', this.core.bounds);
            return {...this.core.bounds};
        }
        
        const container = this.core.uiState.container;
        const rect = container.getBoundingClientRect();
        
        // ⭐ 2. コンテナサイズ確認
        console.log('🔍 2. コンテナサイズ確認:', {
            'container.id': container.id,
            'rect.width': rect.width,
            'rect.height': rect.height,
            'rect': { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
            'container.style.display': container.style.display,
            'container.style.visibility': container.style.visibility,
            'container.offsetWidth': container.offsetWidth,
            'container.offsetHeight': container.offsetHeight
        });
        
        // 🎯 UIコンテナが隠されている場合の対処
        if (rect.width === 0 || rect.height === 0) {
            console.log('🔧 UIコンテナサイズが0 - targetElementから直接取得');
            const targetElement = this.core.config.targetElement;
            if (targetElement) {
                const targetRect = targetElement.getBoundingClientRect();
                console.log('🎯 targetElement直接取得:', {
                    'targetRect.width': targetRect.width,
                    'targetRect.height': targetRect.height,
                    'core.bounds': this.core.bounds
                });
                
                // targetElementのサイズを使用してスケール計算付きのboundsを作成
                if (targetRect.width > 0 && targetRect.height > 0) {
                    console.log('🔧 targetElementベースでスケール計算付きbounds作成');
                    
                    // スケール計算
                    const originalBounds = this.getOriginalBounds();
                    let scaleX = 1.0, scaleY = 1.0;
                    
                    if (originalBounds && originalBounds.width && originalBounds.height) {
                        scaleX = targetRect.width / originalBounds.width;
                        scaleY = targetRect.height / originalBounds.height;
                        console.log('🔍 targetElementベーススケール計算:', {
                            'targetSize': `${targetRect.width}×${targetRect.height}`,
                            'originalSize': `${originalBounds.width}×${originalBounds.height}`,
                            'scaleX': scaleX,
                            'scaleY': scaleY
                        });
                    }
                    
                    return {
                        x: targetRect.left,
                        y: targetRect.top,
                        width: targetRect.width,
                        height: targetRect.height,
                        scaleX: scaleX,
                        scaleY: scaleY
                    };
                }
            }
            
            // 最後の手段: core.boundsを使用
            console.log('🔧 最終フォールバック: core.boundsを使用');
            return {...this.core.bounds};
        }
        
        // スケール情報を含む現在の変換状態を取得
        const transform = this.core.transform || {};
        const element = this.core.config.targetElement;
        let scaleX = 1.0, scaleY = 1.0;
        
        // ⭐ 3. 初期状態確認
        console.log('🔍 3. 初期状態確認:', {
            'transform': transform,
            'element': !!element,
            'element.tagName': element?.tagName,
            'element.id': element?.id || 'no-id',
            '初期scaleX/Y': { x: scaleX, y: scaleY }
        });
        
        // バウンディングボックスのサイズ変更によるスケール計算
        // 真の初期サイズ（最初にsetされたサイズ）を使用
        const originalBounds = this.getOriginalBounds();
        
        // ⭐ 4. originalBounds詳細確認
        console.log('🔍 4. originalBounds詳細確認:', {
            'originalBounds': originalBounds,
            'originalBounds存在': !!originalBounds,
            'width存在': !!originalBounds?.width,
            'height存在': !!originalBounds?.height,
            'width値': originalBounds?.width,
            'height値': originalBounds?.height
        });
        
        if (originalBounds && originalBounds.width && originalBounds.height) {
            const initialWidth = originalBounds.width;
            const initialHeight = originalBounds.height;
            const currentWidth = rect.width;
            const currentHeight = rect.height;
            
            // ⭐ 5. スケール計算準備確認
            console.log('🔍 5. スケール計算準備確認:', {
                'initialWidth': initialWidth,
                'initialHeight': initialHeight,
                'currentWidth': currentWidth,
                'currentHeight': currentHeight,
                '初期サイズ有効': initialWidth > 0 && initialHeight > 0,
                '現在サイズ有効': currentWidth > 0 && currentHeight > 0
            });
            
            // 初期サイズがゼロでない場合のみスケール計算
            if (initialWidth > 0 && initialHeight > 0) {
                scaleX = currentWidth / initialWidth;
                scaleY = currentHeight / initialHeight;
                
                // ⭐ 6. スケール計算結果確認
                console.log('🔍 6. スケール計算結果確認:', {
                    '計算式X': `${currentWidth} / ${initialWidth} = ${scaleX}`,
                    '計算式Y': `${currentHeight} / ${initialHeight} = ${scaleY}`,
                    'scaleX': scaleX,
                    'scaleY': scaleY,
                    'scaleX有効': !isNaN(scaleX) && isFinite(scaleX),
                    'scaleY有効': !isNaN(scaleY) && isFinite(scaleY)
                });
                
                console.log('✅ スケール計算成功:', {
                    initial: { width: initialWidth, height: initialHeight },
                    current: { width: currentWidth, height: currentHeight },
                    scale: { x: scaleX, y: scaleY }
                });
            } else {
                console.warn('⚠️ 初期サイズが無効 - スケール計算スキップ:', {
                    'initialWidth > 0': initialWidth > 0,
                    'initialHeight > 0': initialHeight > 0
                });
            }
        } else {
            console.warn('⚠️ 初期boundsが取得できない - スケール1.0でフォールバック:', {
                originalBounds,
                coreConfig: this.core?.config,
                nodeId: this.core?.config?.nodeId
            });
            
            // ⭐ 7. フォールバック計算確認
            console.log('🔍 7. フォールバック計算確認:', {
                'this.core?.bounds存在': !!this.core?.bounds,
                'this.core.bounds': this.core?.bounds,
                'core.bounds.width存在': !!this.core?.bounds?.width,
                'core.bounds.height存在': !!this.core?.bounds?.height
            });
            
            // コアのboundsをフォールバックとして使用
            if (this.core?.bounds?.width && this.core.bounds.height) {
                const coreWidth = this.core.bounds.width;
                const coreHeight = this.core.bounds.height;
                const currentWidth = rect.width;
                const currentHeight = rect.height;
                
                // ⭐ 8. フォールバック詳細計算
                console.log('🔍 8. フォールバック詳細計算:', {
                    'coreWidth': coreWidth,
                    'coreHeight': coreHeight,
                    'currentWidth': currentWidth,
                    'currentHeight': currentHeight,
                    'core有効': coreWidth > 0 && coreHeight > 0
                });
                
                if (coreWidth > 0 && coreHeight > 0) {
                    scaleX = currentWidth / coreWidth;
                    scaleY = currentHeight / coreHeight;
                    
                    console.log('🔍 フォールバックスケール計算結果:', {
                        '計算式X': `${currentWidth} / ${coreWidth} = ${scaleX}`,
                        '計算式Y': `${currentHeight} / ${coreHeight} = ${scaleY}`,
                        'scaleX': scaleX,
                        'scaleY': scaleY
                    });
                    
                    console.log('✅ コアboundsフォールバックスケール計算完了:', {
                        core: { width: coreWidth, height: coreHeight },
                        current: { width: currentWidth, height: currentHeight },
                        scale: { x: scaleX, y: scaleY }
                    });
                } else {
                    console.warn('⚠️ コアboundsも無効:', { coreWidth, coreHeight });
                }
            } else {
                console.warn('⚠️ コアboundsが利用できない');
            }
        }
        
        // CSS transformからのスケール取得（フォールバック）
        if (element) {
            const computedStyle = window.getComputedStyle(element);
            const transformValue = computedStyle.transform;
            
            // ⭐ 9. CSS Transform確認
            console.log('🔍 9. CSS Transform確認:', {
                'transformValue': transformValue,
                'transform有効': transformValue && transformValue !== 'none'
            });
            
            if (transformValue && transformValue !== 'none') {
                try {
                    const matrix = new DOMMatrix(transformValue);
                    const cssScaleX = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b);
                    const cssScaleY = Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d);
                    
                    // ⭐ 10. CSS Transform計算結果
                    console.log('🔍 10. CSS Transform計算結果:', {
                        'matrix.a': matrix.a,
                        'matrix.b': matrix.b,
                        'matrix.c': matrix.c,
                        'matrix.d': matrix.d,
                        'cssScaleX': cssScaleX,
                        'cssScaleY': cssScaleY,
                        'CSS Scale有効': cssScaleX !== 1.0 || cssScaleY !== 1.0
                    });
                    
                    // CSS transformが有効な場合は優先
                    if (cssScaleX !== 1.0 || cssScaleY !== 1.0) {
                        scaleX = cssScaleX;
                        scaleY = cssScaleY;
                        console.log('✅ CSS Transformスケールを採用:', { x: scaleX, y: scaleY });
                    }
                } catch (error) {
                    console.warn('⚠️ CSS Transform解析エラー:', error.message);
                }
            }
        } else {
            console.warn('⚠️ 対象要素なし - CSS Transform確認スキップ');
        }
        
        // スケール値の最終的な決定（フォールバックあり）
        const finalScaleX = transform.scaleX || scaleX || 1.0;
        const finalScaleY = transform.scaleY || scaleY || 1.0;
        
        // ⭐ 11. 最終スケール値決定
        console.log('🔍 11. 最終スケール値決定:', {
            'transform.scaleX': transform.scaleX,
            'transform.scaleY': transform.scaleY,
            '計算されたscaleX': scaleX,
            '計算されたscaleY': scaleY,
            'finalScaleX': finalScaleX,
            'finalScaleY': finalScaleY
        });
        
        const bounds = {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            x: rect.left,
            y: rect.top,
            scaleX: finalScaleX,
            scaleY: finalScaleY
        };
        
        // ⭐ 12. 最終bounds確認
        console.log('🔍 12. 最終bounds確認:', {
            '最終bounds': bounds,
            'サイズ問題': bounds.width === 0 || bounds.height === 0,
            'スケール問題': bounds.scaleX === 1.0 && bounds.scaleY === 1.0
        });
        
        console.log('🔍 getCurrentBounds 完全診断情報:', {
            transform,
            coreBounds: this.core.bounds,
            rectSize: { width: rect.width, height: rect.height },
            sizeRatio: this.core.bounds ? {
                x: rect.width / this.core.bounds.width,
                y: rect.height / this.core.bounds.height
            } : null,
            calculatedScale: { x: scaleX, y: scaleY },
            finalScale: { x: finalScaleX, y: finalScaleY },
            finalBounds: bounds
        });
        
        console.log('🏁 === getCurrentBounds() 診断終了 ===');
        return bounds;
    }
    
    /**
     * 真の初期bounds取得（最初に設定されたサイズ）
     */
    getOriginalBounds() {
        console.log('🔍 === getOriginalBounds() 診断開始 ===');
        
        // ⭐ 1. Storage Key確認
        const storageKey = `original-bounds-${this.core.config.nodeId}`;
        console.log('🔍 1. Storage Key確認:', {
            'nodeId': this.core.config.nodeId,
            'storageKey': storageKey
        });
        
        // ⭐ 2. localStorage確認
        const stored = localStorage.getItem(storageKey);
        console.log('🔍 2. localStorage確認:', {
            'stored存在': !!stored,
            'stored内容': stored,
            'stored長さ': stored?.length || 0
        });
        
        if (stored) {
            try {
                const bounds = JSON.parse(stored);
                
                // ⭐ 3. 復元データ詳細確認
                console.log('🔍 3. 復元データ詳細確認:', {
                    'bounds': bounds,
                    'width': bounds.width,
                    'height': bounds.height,
                    'timestamp': bounds.timestamp,
                    'width有効': typeof bounds.width === 'number' && bounds.width > 0,
                    'height有効': typeof bounds.height === 'number' && bounds.height > 0
                });
                
                console.log('📏 真の初期bounds復元成功（PureBoundingBoxで保存済み）:', bounds);
                return bounds;
            } catch (error) {
                console.warn('⚠️ 初期bounds復元失敗:', {
                    'error': error.message,
                    'stored内容': stored
                });
            }
        }
        
        // ⭐ 4. フォールバック確認
        console.log('🔍 4. フォールバック確認:', {
            'localStorage無効': !stored,
            'PureBoundingBox初期化': '確認が必要'
        });
        
        // PureBoundingBox.initializeBounds()で保存されるはずだが、念のためフォールバック
        console.warn('⚠️ 初期boundsが見つからない - PureBoundingBox初期化確認が必要');
        console.log('🏁 === getOriginalBounds() 診断終了（null返却） ===');
        return null;
    }
    
    /**
     * localStorage保存
     */
    saveToLocalStorage(saveData) {
        try {
            const storageKey = `bounding-box-${saveData.nodeId}`;
            const dataToStore = {
                bounds: saveData.bounds,
                timestamp: saveData.timestamp,
                version: '5.1-autopin-responsive',
                responsiveEnabled: saveData.responsiveEnabled || false
            };
            
            localStorage.setItem(storageKey, JSON.stringify(dataToStore));
            console.log('💾 localStorage保存完了:', storageKey);
            
        } catch (error) {
            console.error('❌ localStorage保存エラー:', error);
        }
    }
    
    /**
     * 自動ピンフィードバック表示
     */
    showAutoPinFeedback(autoPinResult) {
        // ピンアイコンの一時表示
        const pinIndicator = document.createElement('div');
        pinIndicator.innerHTML = '📍';
        pinIndicator.style.cssText = `
            position: fixed;
            z-index: 10002;
            font-size: 24px;
            pointer-events: none;
            animation: pin-success 2s ease-out forwards;
            color: #28a745;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        `;
        
        // CSS アニメーション追加
        if (!document.getElementById('pin-animation-style')) {
            const style = document.createElement('style');
            style.id = 'pin-animation-style';
            style.textContent = `
                @keyframes pin-success {
                    0% { 
                        opacity: 1; 
                        transform: scale(1); 
                    }
                    50% { 
                        opacity: 1; 
                        transform: scale(1.5); 
                    }
                    100% { 
                        opacity: 0; 
                        transform: scale(1.2); 
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 安全チェック: pinConfigとtargetElementの存在を確認
        if (!autoPinResult?.pinConfig?.targetElement) {
            console.warn('⚠️ AutoPin フィードバック: targetElementが見つからないため、画面中央に表示');
            // 画面中央にフォールバック表示
            pinIndicator.style.left = '50%';
            pinIndicator.style.top = '50%';
            pinIndicator.style.transform = 'translate(-50%, -50%)';
        } else {
            // 背景要素の中央に表示
            const targetRect = autoPinResult.pinConfig.targetElement.getBoundingClientRect();
            pinIndicator.style.left = (targetRect.left + targetRect.width / 2 - 12) + 'px';
            pinIndicator.style.top = (targetRect.top + targetRect.height / 2 - 12) + 'px';
        }
        
        document.body.appendChild(pinIndicator);
        
        // 2秒後に自動削除
        setTimeout(() => {
            if (pinIndicator.parentElement) {
                pinIndicator.remove();
            }
        }, 2000);
    }
    
    /**
     * エラーフィードバック表示
     */
    showErrorFeedback(message) {
        const errorIndicator = document.createElement('div');
        errorIndicator.textContent = `⚠️ ${message}`;
        errorIndicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10003;
            background: #dc3545;
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            font-size: 14px;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(errorIndicator);
        
        // 3秒後に自動削除
        setTimeout(() => {
            if (errorIndicator.parentElement) {
                errorIndicator.remove();
            }
        }, 3000);
    }
    
    /**
     * 保存完了イベント発火
     */
    triggerSaveCompleted(eventData) {
        // カスタムイベント作成
        const event = new CustomEvent('boundingBoxSaveCompleted', {
            detail: eventData
        });
        
        // ドキュメントに発火
        document.dispatchEvent(event);
        
        // core.events があれば利用
        if (this.core.events && typeof this.core.events.trigger === 'function') {
            this.core.events.trigger('save-completed', eventData);
        }
    }
    
    /**
     * 元の状態に復元
     */
    restoreOriginalState() {
        // 必要に応じて実装
        console.log('🔄 状態復元（現在は何もしません）');
    }
    
    // ==========================================
    // 🖱️ 右クリックメニューアクション
    // ==========================================
    
    /**
     * レスポンシブシステム切り替え
     */
    toggleResponsiveSystem() {
        console.log('📱 レスポンシブシステム切り替え');
        
        if (!this.responsiveInitialized || !this.responsiveSystem) {
            this.showNotification('レスポンシブシステムが無効です', 'warning');
            return;
        }
        
        if (this.responsiveSystem.config.enabled) {
            // 無効化
            this.responsiveSystem.disable();
            this.showNotification('📱 レスポンシブ自動追従を無効化しました', 'info');
        } else {
            // 有効化
            const success = this.responsiveSystem.enable({
                debugMode: false,
                fitStrategy: 'contain',
                anchor: 'MC'
            });
            
            if (success) {
                this.showNotification('📱 レスポンシブ自動追従を有効化しました\n背景に対して自動フィットします', 'success', 4000);
            } else {
                this.showNotification('⚠️ 背景要素が見つからないため、レスポンシブ機能を有効化できませんでした', 'warning', 4000);
            }
        }
        
        // 右クリックメニューを再作成（状態表示更新のため）
        this.refreshContextMenu();
    }
    
    /**
     * 右クリックメニューリフレッシュ
     */
    refreshContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.remove();
            this.contextMenu = this.createContextMenu();
        }
    }
    
    /**
     * 🎯 2段階ピン設定開始
     */
    async startPinSetting() {
        console.log('🎯 2段階ピン設定システム開始 - TwoStageSelector版');
        
        try {
            // 右クリックメニュー非表示
            this.hideContextMenu();
            
            // TwoStageSelector利用可能性チェック
            if (!window.TwoStageSelector) {
                console.warn('⚠️ TwoStageSelector未利用 - 基本ElementSelectorにフォールバック');
                return await this.startBasicPinSetting();
            }
            
            // TwoStageSelector 初期化
            const twoStageSelector = new window.TwoStageSelector();
            console.log('✅ TwoStageSelector初期化完了');
            
            // 2段階プロセス開始 - 高機能画面表示付き
            twoStageSelector.startTwoStageProcess(
                // 完了コールバック
                (pinRequest, selectedElement) => {
                    console.log('✅ 2段階ピン設定完了 - 高機能版!', pinRequest);
                    console.log('📍 対象要素:', selectedElement);
                    this.handleTwoStageCompleted(pinRequest, selectedElement);
                },
                // エラーコールバック  
                (error) => {
                    console.error('❌ 2段階ピン設定エラー:', error);
                    this.showNotification('❌ ピン設定に失敗しました', 'error', 3000);
                }
            );
            
            console.log('✅ 高機能2段階ピン設定プロセス開始完了');
            
        } catch (error) {
            console.error('❌ ピン設定エラー:', error);
            this.showNotification('❌ ピン設定に失敗しました', 'error', 3000);
        }
    }
    
    /**
     * 🎯 基本ElementSelectorフォールバック版
     */
    async startBasicPinSetting() {
        console.log('🎯 基本ピン設定システム開始 - ElementSelector版');
        
        try {
            // Stage 1: F12風要素選択
            this.showNotification('🎯 Stage 1: 要素選択モード開始\nピンを設定する要素を選択してください', 'info', 5000);
            
            // ElementSelector 初期化
            if (!window.ElementSelector) {
                throw new Error('ElementSelector が見つかりません');
            }
            
            const selector = new window.ElementSelector();
            
            // 要素選択開始
            const selectedElement = await selector.selectElement((element) => {
                console.log('🎯 選択要素確定:', element);
                this.handleElementSelected(element);
            });
            
            console.log('✅ Stage 1 完了: 要素選択成功');
            
        } catch (error) {
            console.error('❌ 基本ピン設定エラー:', error);
            this.showNotification('❌ ピン設定に失敗しました', 'error', 3000);
        }
    }
    
    /**
     * 🎯 TwoStageSelector完了処理
     */
    handleTwoStageCompleted(pinRequest, selectedElement) {
        console.log('✅ TwoStageSelector完了処理開始');
        console.log('📍 ピン設定要求:', pinRequest);
        console.log('🎯 選択要素:', selectedElement);
        
        // AutoPinとの統合処理
        if (this.autoPin) {
            // TwoStageSelectorの結果をAutoPinシステムに適用
            this.integrateTwoStageResult(pinRequest, selectedElement);
        } else {
            console.warn('⚠️ AutoPinシステムが利用できません');
        }
        
        this.showNotification('✅ 高機能ピン設定完了！', 'success', 3000);
    }
    
    /**
     * 🎯 TwoStageSelector結果のAutoPin統合
     */
    integrateTwoStageResult(pinRequest, selectedElement) {
        console.log('🔗 TwoStageSelector → AutoPin統合処理');
        console.log('📍 ピンリクエストデータ:', pinRequest);
        
        try {
            // ユーザーピン位置データを保存
            const nodeId = this.core.config.nodeId || 'spine-canvas';
            const userPinStorageKey = `user-pin-${nodeId}`;
            
            // TwoStageSelectorのpinRequest形式で保存
            const userPinData = {
                element: {
                    id: selectedElement.id,
                    tagName: selectedElement.tagName,
                    selector: this.generateElementSelector(selectedElement)
                },
                anchorPoints: pinRequest.anchorPoints || [pinRequest],
                timestamp: Date.now(),
                nodeId: nodeId
            };
            
            localStorage.setItem(userPinStorageKey, JSON.stringify(userPinData));
            console.log('💾 ユーザーピンデータ保存完了:', userPinStorageKey, userPinData);
            
            // AutoPinデータにも統合（新規作成対応）
            const autoPinKey = `autopin-${nodeId}`;
            let autoPinData = localStorage.getItem(autoPinKey);
            
            if (autoPinData) {
                // 既存データに統合
                const parsed = JSON.parse(autoPinData);
                parsed.userPinPosition = userPinData;
                localStorage.setItem(autoPinKey, JSON.stringify(parsed));
                console.log('💾 AutoPinデータに統合完了（更新）');
            } else {
                // 新規AutoPinデータを作成
                const newAutoPinData = {
                    // TwoStageSelectorデータから基本情報を作成
                    anchor: this.determineAnchorFromUserPin(userPinData),
                    targetElement: userPinData.element.id || userPinData.element.selector,
                    spineElement: 'spine-canvas', // 固定（Spineキャンバス）
                    backgroundElement: {
                        id: userPinData.element.id,
                        tagName: userPinData.element.tagName || 'DIV',
                        className: userPinData.element.className || '',
                        selector: userPinData.element.selector || `#${userPinData.element.id}`
                    },
                    userPinPosition: userPinData,
                    timestamp: Date.now(),
                    version: '1.0'
                };
                
                localStorage.setItem(autoPinKey, JSON.stringify(newAutoPinData));
                console.log('💾 AutoPinデータ新規作成完了:', autoPinKey, newAutoPinData);
            }
            
            console.log('✅ AutoPin統合完了');
            
        } catch (error) {
            console.error('❌ TwoStageSelector結果統合エラー:', error);
        }
    }
    
    /**
     * UserPinデータからアンカーポイントを決定
     */
    determineAnchorFromUserPin(userPinData) {
        if (!userPinData.anchorPoints || userPinData.anchorPoints.length === 0) {
            return 'MC'; // デフォルト：中央
        }
        
        const anchor = userPinData.anchorPoints[0];
        const { ratioX, ratioY } = anchor;
        
        // 比率からアンカーポイントを決定
        if (ratioY < 0.33) {
            // 上部
            if (ratioX < 0.33) return 'TL';
            if (ratioX > 0.67) return 'TR';
            return 'TC';
        } else if (ratioY > 0.67) {
            // 下部
            if (ratioX < 0.33) return 'BL';
            if (ratioX > 0.67) return 'BR';
            return 'BC';
        } else {
            // 中央
            if (ratioX < 0.33) return 'ML';
            if (ratioX > 0.67) return 'MR';
            return 'MC';
        }
    }
    
    /**
     * 🎯 要素セレクター生成
     */
    generateElementSelector(element) {
        if (element.id) return `#${element.id}`;
        if (element.className) return `.${element.className.split(' ')[0]}`;
        return element.tagName.toLowerCase();
    }
    
    /**
     * 🎯 選択要素の処理（Stage 1 → Stage 2 橋渡し）
     */
    handleElementSelected(element) {
        console.log('🎯 Stage 1 → Stage 2 移行: 選択要素処理開始', element);
        
        // 選択要素の情報表示
        const info = this.getElementInfo(element);
        this.showNotification(
            `✅ 要素選択完了: ${info.tagName}\n🎯 Stage 2: 位置微調整モードに移行します`, 
            'success', 
            4000
        );
        
        // TODO: Stage 2 相対座標システムとの統合
        // RelativeCoordinator 実装後に実装予定
        console.log('📋 TODO: RelativeCoordinator との統合（Stage 2）');
        
        // 暫定：選択要素の基本情報保存
        this.selectedTargetElement = element;
        
        // 現在のBB位置を取得
        const currentBounds = this.core.bounds;
        console.log('📐 現在のBB位置:', currentBounds);
        
        // Stage 2 UI表示の準備
        this.showStage2Preview(element);
    }
    
    /**
     * 🎯 Stage 2 プレビュー表示（暫定実装）
     */
    showStage2Preview(selectedElement) {
        console.log('🎯 Stage 2 プレビュー表示（暫定）');
        
        // 選択要素に薄い枠線表示
        const rect = selectedElement.getBoundingClientRect();
        
        const referenceFrame = document.createElement('div');
        referenceFrame.id = 'pin-reference-frame';
        referenceFrame.style.cssText = `
            position: fixed;
            left: ${rect.left}px;
            top: ${rect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            border: 2px dashed #28a745;
            background: rgba(40, 167, 69, 0.1);
            pointer-events: none;
            z-index: 9999;
        `;
        
        document.body.appendChild(referenceFrame);
        
        // 5秒後に自動削除
        setTimeout(() => {
            referenceFrame.remove();
        }, 5000);
        
        this.showNotification(
            '🎯 基準要素表示中（5秒間）\n緑の枠線が選択した要素です',
            'info',
            3000
        );
    }
    
    /**
     * 要素情報取得ヘルパー
     */
    getElementInfo(element) {
        if (!element) return null;
        
        const rect = element.getBoundingClientRect();
        
        return {
            tagName: element.tagName,
            id: element.id || null,
            className: element.className || null,
            width: Math.round(rect.width),
            height: Math.round(rect.height)
        };
    }
    
    /**
     * ピン状態表示
     */
    showPinStatus() {
        console.log('📍 ピン状態表示');
        
        if (!this.autoPin) {
            this.showNotification('自動ピンシステムが無効です', 'warning');
            return;
        }
        
        const state = this.autoPin.getState();
        const message = `
🔍 アクティブピン数: ${state.activePinsCount}
⚡ 平均処理時間: ${state.performanceMetrics.averageTime.toFixed(2)}ms
✅ 成功率: ${state.performanceMetrics.successCount}/${state.performanceMetrics.successCount + state.performanceMetrics.failureCount}
        `.trim();
        
        this.showNotification(message, 'info', 4000);
    }
    
    /**
     * 統計情報表示
     */
    showStats() {
        console.log('📊 統計情報表示');
        
        const bounds = this.getCurrentBounds();
        const elementInfo = this.core.config.targetElement ? {
            tag: this.core.config.targetElement.tagName,
            id: this.core.config.targetElement.id || '(no id)',
            className: this.core.config.targetElement.className || '(no class)'
        } : null;
        
        // パーセンテージ情報を取得
        const element = this.core.config.targetElement;
        let percentageInfo = 'N/A';
        if (element) {
            const leftPct = element.style.left;
            const topPct = element.style.top;
            const widthPct = element.style.width;
            const heightPct = element.style.height;
            
            if (leftPct && topPct && widthPct && heightPct) {
                percentageInfo = `位置: ${leftPct}, ${topPct} | サイズ: ${widthPct} × ${heightPct}`;
            }
        }
        
        const stats = `
📊 バウンディングボックス統計
━━━━━━━━━━━━━━━━━━━━━━━
🎯 対象要素: ${elementInfo ? `${elementInfo.tag}#${elementInfo.id}` : 'なし'}
📐 位置(px): ${(bounds.left || bounds.x || 0).toFixed(0)}, ${(bounds.top || bounds.y || 0).toFixed(0)}
📏 サイズ(px): ${(bounds.width || 0).toFixed(0)} × ${(bounds.height || 0).toFixed(0)}
📊 パーセンテージ: ${percentageInfo}
🔍 スケール: ${bounds.scaleX ? bounds.scaleX.toFixed(3) : 'N/A'} × ${bounds.scaleY ? bounds.scaleY.toFixed(3) : 'N/A'}
📍 自動ピン: ${this.autoPinInitialized ? '有効' : '無効'}
📱 レスポンシブ: ${this.responsiveInitialized ? (this.responsiveSystem?.config.enabled ? '有効' : '無効') : '無効'}
🔧 デバッグ: scaleX=${bounds.scaleX}, scaleY=${bounds.scaleY}
        `.trim();
        
        this.showNotification(stats, 'info', 5000);
    }
    
    /**
     * 設定画面表示
     */
    showSettings() {
        console.log('⚙️ 設定画面表示');
        
        // 簡易設定パネル作成
        const settingsPanel = document.createElement('div');
        settingsPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 12px 48px rgba(0,0,0,0.3);
            padding: 20px;
            z-index: 10003;
            min-width: 300px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        settingsPanel.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #333;">⚙️ バウンディングボックス設定</h3>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">背景検出感度</label>
                <select id="detection-sensitivity" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="strict">厳格（推奨）</option>
                    <option value="normal" selected>標準</option>
                    <option value="loose">緩和</option>
                </select>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">アンカーポイント精度</label>
                <select id="anchor-precision" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="9">9ポイント（標準）</option>
                    <option value="16">16ポイント（高精度）</option>
                    <option value="4">4ポイント（シンプル）</option>
                </select>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="auto-pin-enabled" ${this.autoPinInitialized ? 'checked' : ''}>
                    <span>自動ピン機能を有効化</span>
                </label>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="responsive-enabled" ${this.responsiveSystem?.config.enabled ? 'checked' : ''} ${!this.responsiveInitialized ? 'disabled' : ''}>
                    <span>レスポンシブ自動フィット</span>
                </label>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">フィット戦略</label>
                <select id="fit-strategy" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;" ${!this.responsiveInitialized ? 'disabled' : ''}>
                    <option value="contain" ${this.responsiveSystem?.config.fitStrategy === 'contain' ? 'selected' : ''}>Contain（完全収納）</option>
                    <option value="cover" ${this.responsiveSystem?.config.fitStrategy === 'cover' ? 'selected' : ''}>Cover（背景カバー）</option>
                    <option value="fit" ${this.responsiveSystem?.config.fitStrategy === 'fit' ? 'selected' : ''}>Fit（元サイズ）</option>
                </select>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="settings-cancel" style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">キャンセル</button>
                <button id="settings-save" style="padding: 8px 16px; border: none; background: #28a745; color: white; border-radius: 4px; cursor: pointer;">保存</button>
            </div>
        `;
        
        // イベントリスナー追加
        settingsPanel.querySelector('#settings-cancel').addEventListener('click', () => {
            settingsPanel.remove();
        });
        
        settingsPanel.querySelector('#settings-save').addEventListener('click', () => {
            // 設定の保存処理
            const responsiveEnabled = settingsPanel.querySelector('#responsive-enabled').checked;
            const fitStrategy = settingsPanel.querySelector('#fit-strategy').value;
            
            // レスポンシブ設定保存
            if (this.responsiveInitialized) {
                if (responsiveEnabled && !this.responsiveSystem.config.enabled) {
                    // 有効化
                    const success = this.responsiveSystem.enable({
                        fitStrategy: fitStrategy,
                        debugMode: false
                    });
                    if (!success) {
                        this.showNotification('⚠️ 背景要素が見つからないため、レスポンシブ機能を有効化できませんでした', 'warning');
                    }
                } else if (!responsiveEnabled && this.responsiveSystem.config.enabled) {
                    // 無効化
                    this.responsiveSystem.disable();
                } else if (responsiveEnabled && this.responsiveSystem.config.enabled) {
                    // 戦略変更
                    this.responsiveSystem.setFitStrategy(fitStrategy);
                }
            }
            
            this.showNotification('設定を保存しました', 'success');
            settingsPanel.remove();
        });
        
        // オーバーレイ追加
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10002;
        `;
        
        overlay.addEventListener('click', () => {
            overlay.remove();
            settingsPanel.remove();
        });
        
        document.body.appendChild(overlay);
        document.body.appendChild(settingsPanel);
    }
    
    /**
     * 通知表示
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        const colors = {
            info: { bg: '#17a2b8', icon: 'ℹ️' },
            success: { bg: '#28a745', icon: '✅' },
            warning: { bg: '#ffc107', icon: '⚠️', color: '#000' },
            error: { bg: '#dc3545', icon: '❌' }
        };
        
        const config = colors[type] || colors.info;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${config.bg};
            color: ${config.color || 'white'};
            padding: 12px 16px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10004;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            max-width: 350px;
            word-wrap: break-word;
            white-space: pre-line;
            animation: slideInRight 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 8px;">
                <span style="font-size: 16px;">${config.icon}</span>
                <div>${message}</div>
            </div>
        `;
        
        // アニメーション CSS追加
        if (!document.getElementById('notification-animation-style')) {
            const style = document.createElement('style');
            style.id = 'notification-animation-style';
            style.textContent = `
                @keyframes slideInRight {
                    from { 
                        transform: translateX(100%); 
                        opacity: 0; 
                    }
                    to { 
                        transform: translateX(0); 
                        opacity: 1; 
                    }
                }
                @keyframes slideOutRight {
                    from { 
                        transform: translateX(0); 
                        opacity: 1; 
                    }
                    to { 
                        transform: translateX(100%); 
                        opacity: 0; 
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // 自動削除
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, duration);
        
        // クリックで即座に削除
        notification.addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        });
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.PureBoundingBoxUI = PureBoundingBoxUI;
}