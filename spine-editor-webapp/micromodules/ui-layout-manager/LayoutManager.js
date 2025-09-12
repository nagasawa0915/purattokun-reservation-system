/**
 * LayoutManager.js - レイアウト管理マイクロモジュール
 * 
 * 責務:
 * - レイアウトプリセットの管理
 * - カスタムレイアウトの保存・復元
 * - デフォルト配置への復元
 * - レイアウト切り替えUI
 * 
 * 依存: EventBusのみ
 */

import ResizeHandleController from './ResizeHandleController.js';

export default class LayoutManager {
    constructor(options = {}) {
        this.container = options.container;
        this.eventBus = options.eventBus;
        this.panelManager = options.panelManager; // PanelManagerとの連携用
        
        // レイアウト管理
        this.layouts = new Map();
        this.currentLayout = 'default';
        this.customLayouts = new Map();
        
        // UI要素
        this.dropdown = null;
        this.saveDialog = null;
        
        // リサイズハンドル制御
        this.resizeHandleController = null;
        
        this.init();
    }
    
    init() {
        this.initializePresetLayouts();
        this.loadCustomLayouts();
        this.createLayoutUI();
        this.initializeResizeHandleController();
        this.bindEvents();
        
        this.emit('layoutManager:initialized');
        console.log('✅ LayoutManager 初期化完了');
    }
    
    /**
     * リサイズハンドル制御の初期化
     */
    initializeResizeHandleController() {
        try {
            this.resizeHandleController = new ResizeHandleController({
                eventBus: this.eventBus
            });
            
            console.log('✅ ResizeHandleController 初期化完了');
        } catch (error) {
            console.warn('ResizeHandleController初期化失敗:', error);
        }
    }
    
    /**
     * プリセットレイアウトの初期化
     */
    initializePresetLayouts() {
        // デフォルトレイアウト
        this.layouts.set('default', {
            name: 'デフォルト',
            description: 'アウトライナー・プレビュー・プロパティの標準3パネル構成',
            config: {
                panels: {
                    'outliner': { 
                        visible: true, 
                        width: 200, 
                        position: 'left',
                        order: 1
                    },
                    'preview': { 
                        visible: true, 
                        width: 'flex',
                        position: 'center',
                        order: 2
                    },
                    'properties': { 
                        visible: true, 
                        width: 280,
                        position: 'right', 
                        order: 3
                    },
                    'timeline': {
                        visible: true,
                        height: 200,
                        position: 'bottom',
                        order: 4
                    }
                },
                gridTemplate: {
                    columns: '200px 1fr 280px',
                    rows: '1fr 200px'
                }
            }
        });
        
        // フォーカスレイアウト（プレビュー重視）
        this.layouts.set('focus', {
            name: 'フォーカス',
            description: 'プレビューエリアを最大化、サイドパネルを最小化',
            config: {
                panels: {
                    'outliner': { 
                        visible: true, 
                        width: 150,
                        position: 'left',
                        order: 1
                    },
                    'preview': { 
                        visible: true, 
                        width: 'flex',
                        position: 'center',
                        order: 2
                    },
                    'properties': { 
                        visible: true, 
                        width: 200,
                        position: 'right',
                        order: 3
                    },
                    'timeline': {
                        visible: true,
                        height: 150,
                        position: 'bottom',
                        order: 4
                    }
                },
                gridTemplate: {
                    columns: '150px 1fr 200px',
                    rows: '1fr 150px'
                }
            }
        });
        
        // デバッグレイアウト（すべて表示）
        this.layouts.set('debug', {
            name: 'デバッグ',
            description: 'すべてのパネルを表示、デバッグ作業に最適',
            config: {
                panels: {
                    'outliner': { 
                        visible: true, 
                        width: 220,
                        position: 'left',
                        order: 1
                    },
                    'preview': { 
                        visible: true, 
                        width: 'flex',
                        position: 'center',
                        order: 2
                    },
                    'properties': { 
                        visible: true, 
                        width: 320,
                        position: 'right',
                        order: 3
                    },
                    'timeline': {
                        visible: true,
                        height: 250,
                        position: 'bottom',
                        order: 4
                    }
                },
                gridTemplate: {
                    columns: '220px 1fr 320px',
                    rows: '1fr 250px'
                }
            }
        });
        
        // ミニマルレイアウト（プレビューのみ）
        this.layouts.set('minimal', {
            name: 'ミニマル',
            description: 'プレビューとタイムラインのみ表示',
            config: {
                panels: {
                    'outliner': { 
                        visible: false, 
                        width: 0,
                        position: 'left',
                        order: 1
                    },
                    'preview': { 
                        visible: true, 
                        width: 'flex',
                        position: 'center',
                        order: 2
                    },
                    'properties': { 
                        visible: false, 
                        width: 0,
                        position: 'right',
                        order: 3
                    },
                    'timeline': {
                        visible: true,
                        height: 200,
                        position: 'bottom',
                        order: 4
                    }
                },
                gridTemplate: {
                    columns: '0px 1fr 0px',
                    rows: '1fr 200px'
                }
            }
        });
        
        console.log('📐 プリセットレイアウト初期化完了:', this.layouts.size, '個');
    }
    
    /**
     * レイアウト管理UIの作成
     */
    createLayoutUI() {
        // レイアウトドロップダウンをトップバーに追加
        const topBarRight = document.querySelector('.top-bar-right');
        if (topBarRight) {
            const layoutControls = document.createElement('div');
            layoutControls.className = 'layout-controls';
            layoutControls.innerHTML = `
                <div class="layout-dropdown">
                    <button class="btn btn-layout-menu" title="レイアウト管理">
                        <span class="icon">📐</span>
                        <span class="layout-name">デフォルト</span>
                        <span class="dropdown-arrow">▼</span>
                    </button>
                    <div class="layout-menu" style="display: none;">
                        <div class="menu-section">
                            <div class="menu-title">プリセット</div>
                            <div class="preset-layouts"></div>
                        </div>
                        <div class="menu-section">
                            <div class="menu-title">カスタム</div>
                            <div class="custom-layouts"></div>
                            <button class="menu-item save-layout" title="現在のレイアウトを保存">
                                <span class="icon">💾</span>
                                現在のレイアウトを保存...
                            </button>
                        </div>
                        <div class="menu-section">
                            <div class="menu-title">管理</div>
                            <button class="menu-item reset-layout" title="デフォルトに戻す">
                                <span class="icon">🔄</span>
                                デフォルトに戻す
                            </button>
                            <button class="menu-item export-layouts" title="レイアウト設定をエクスポート">
                                <span class="icon">📤</span>
                                エクスポート
                            </button>
                            <button class="menu-item import-layouts" title="レイアウト設定をインポート">
                                <span class="icon">📥</span>
                                インポート
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            topBarRight.insertBefore(layoutControls, topBarRight.firstChild);
            this.dropdown = layoutControls.querySelector('.layout-dropdown');
            this.updateLayoutMenu();
        }
        
        // レイアウト保存ダイアログ
        this.createSaveDialog();
    }
    
    /**
     * レイアウトメニューの更新
     */
    updateLayoutMenu() {
        const presetContainer = this.dropdown?.querySelector('.preset-layouts');
        const customContainer = this.dropdown?.querySelector('.custom-layouts');
        
        if (presetContainer) {
            presetContainer.innerHTML = '';
            this.layouts.forEach((layout, key) => {
                const item = document.createElement('button');
                item.className = `menu-item preset-item ${key === this.currentLayout ? 'active' : ''}`;
                item.dataset.layoutKey = key;
                item.innerHTML = `
                    <span class="icon">${this.getLayoutIcon(key)}</span>
                    <div class="layout-info">
                        <div class="layout-name">${layout.name}</div>
                        <div class="layout-desc">${layout.description}</div>
                    </div>
                `;
                presetContainer.appendChild(item);
            });
        }
        
        if (customContainer) {
            // カスタムレイアウトの前に既存のカスタムレイアウト一覧を表示
            const existingCustoms = customContainer.querySelectorAll('.custom-item');
            existingCustoms.forEach(item => item.remove());
            
            this.customLayouts.forEach((layout, key) => {
                const item = document.createElement('button');
                item.className = `menu-item custom-item ${key === this.currentLayout ? 'active' : ''}`;
                item.dataset.layoutKey = key;
                item.innerHTML = `
                    <span class="icon">⭐</span>
                    <div class="layout-info">
                        <div class="layout-name">${layout.name}</div>
                        <div class="layout-desc">カスタムレイアウト</div>
                    </div>
                    <button class="delete-btn" title="削除">×</button>
                `;
                customContainer.insertBefore(item, customContainer.querySelector('.save-layout'));
            });
        }
    }
    
    /**
     * レイアウト保存ダイアログの作成
     */
    createSaveDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'layout-save-dialog';
        dialog.style.display = 'none';
        dialog.innerHTML = `
            <div class="dialog-overlay">
                <div class="dialog-content">
                    <div class="dialog-header">
                        <h3>レイアウトを保存</h3>
                        <button class="dialog-close">×</button>
                    </div>
                    <div class="dialog-body">
                        <div class="form-group">
                            <label for="layout-name">レイアウト名</label>
                            <input type="text" id="layout-name" placeholder="例: マイレイアウト" maxlength="20">
                        </div>
                        <div class="form-group">
                            <label for="layout-description">説明（任意）</label>
                            <textarea id="layout-description" placeholder="このレイアウトの特徴を記述..." maxlength="100"></textarea>
                        </div>
                    </div>
                    <div class="dialog-footer">
                        <button class="btn btn-cancel">キャンセル</button>
                        <button class="btn btn-save">保存</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        this.saveDialog = dialog;
    }
    
    /**
     * イベントバインディング
     */
    bindEvents() {
        if (!this.dropdown) return;
        
        // ドロップダウンメニューの表示/非表示
        const menuButton = this.dropdown.querySelector('.btn-layout-menu');
        const menu = this.dropdown.querySelector('.layout-menu');
        
        menuButton?.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = menu.style.display !== 'none';
            menu.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                this.updateLayoutMenu();
            }
        });
        
        // 外側クリックでメニューを閉じる
        document.addEventListener('click', (e) => {
            if (!this.dropdown.contains(e.target)) {
                menu.style.display = 'none';
            }
        });
        
        // プリセットレイアウト選択
        menu?.addEventListener('click', (e) => {
            const presetItem = e.target.closest('.preset-item');
            const customItem = e.target.closest('.custom-item');
            
            if (presetItem) {
                const layoutKey = presetItem.dataset.layoutKey;
                this.applyLayout(layoutKey);
                menu.style.display = 'none';
            } else if (customItem && !e.target.classList.contains('delete-btn')) {
                const layoutKey = customItem.dataset.layoutKey;
                this.applyLayout(layoutKey, true);
                menu.style.display = 'none';
            }
        });
        
        // カスタムレイアウト削除
        menu?.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const customItem = e.target.closest('.custom-item');
                if (customItem) {
                    const layoutKey = customItem.dataset.layoutKey;
                    this.deleteCustomLayout(layoutKey);
                }
            }
        });
        
        // レイアウト管理ボタン
        menu?.addEventListener('click', (e) => {
            const target = e.target.closest('.menu-item');
            if (!target) return;
            
            if (target.classList.contains('save-layout')) {
                this.showSaveDialog();
                menu.style.display = 'none';
            } else if (target.classList.contains('reset-layout')) {
                this.applyLayout('default');
                menu.style.display = 'none';
            } else if (target.classList.contains('export-layouts')) {
                this.exportLayouts();
                menu.style.display = 'none';
            } else if (target.classList.contains('import-layouts')) {
                this.showImportDialog();
                menu.style.display = 'none';
            }
        });
        
        // 保存ダイアログイベント
        this.bindSaveDialogEvents();
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+R: デフォルトレイアウトに戻す
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                this.applyLayout('default');
            }
            
            // Ctrl+Shift+S: レイアウト保存ダイアログ
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.showSaveDialog();
            }
        });
        
        // EventBusリスナー
        if (this.eventBus) {
            this.eventBus.on('panel:resized', (data) => {
                // パネルリサイズ時に現在のレイアウトを記録
                this.captureCurrentLayout();
            });
            
            this.eventBus.on('panel:moved', (data) => {
                // パネル移動時に現在のレイアウトを記録
                this.captureCurrentLayout();
            });
        }
    }
    
    bindSaveDialogEvents() {
        if (!this.saveDialog) return;
        
        const closeBtn = this.saveDialog.querySelector('.dialog-close');
        const cancelBtn = this.saveDialog.querySelector('.btn-cancel');
        const saveBtn = this.saveDialog.querySelector('.btn-save');
        const nameInput = this.saveDialog.querySelector('#layout-name');
        
        const closeDialog = () => {
            this.saveDialog.style.display = 'none';
            nameInput.value = '';
            this.saveDialog.querySelector('#layout-description').value = '';
        };
        
        closeBtn?.addEventListener('click', closeDialog);
        cancelBtn?.addEventListener('click', closeDialog);
        
        // オーバーレイクリックで閉じる
        this.saveDialog.querySelector('.dialog-overlay')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('dialog-overlay')) {
                closeDialog();
            }
        });
        
        // 保存処理
        saveBtn?.addEventListener('click', () => {
            const name = nameInput.value.trim();
            const description = this.saveDialog.querySelector('#layout-description').value.trim();
            
            if (!name) {
                nameInput.focus();
                nameInput.style.borderColor = 'var(--accent-yellow)';
                setTimeout(() => {
                    nameInput.style.borderColor = '';
                }, 2000);
                return;
            }
            
            this.saveCustomLayout(name, description);
            closeDialog();
        });
        
        // Enterキーで保存
        nameInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            }
        });
    }
    
    /**
     * レイアウト適用
     */
    applyLayout(layoutKey, isCustom = false) {
        const layout = isCustom ? 
            this.customLayouts.get(layoutKey) : 
            this.layouts.get(layoutKey);
            
        if (!layout) {
            console.warn('レイアウトが見つかりません:', layoutKey);
            return;
        }
        
        console.log('📐 レイアウト適用中:', layout.name);
        
        // CSS Grid テンプレート更新
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer && layout.config.gridTemplate) {
            mainContainer.style.gridTemplateColumns = layout.config.gridTemplate.columns;
            if (layout.config.gridTemplate.rows) {
                // タイムライン高さの調整
                const timelineHeight = layout.config.panels.timeline?.height || 200;
                document.documentElement.style.setProperty('--timeline-height', `${timelineHeight}px`);
            }
        }
        
        // パネル表示/非表示の切り替え
        Object.entries(layout.config.panels).forEach(([panelType, panelConfig]) => {
            const panel = document.querySelector(`[data-panel-type="${panelType}"]`);
            if (panel) {
                panel.style.display = panelConfig.visible ? 'flex' : 'none';
                
                // 幅の調整（CSS Variables更新）
                if (panelConfig.width && panelConfig.width !== 'flex') {
                    if (panelType === 'outliner') {
                        document.documentElement.style.setProperty('--outliner-width', `${panelConfig.width}px`);
                    } else if (panelType === 'properties') {
                        document.documentElement.style.setProperty('--properties-width', `${panelConfig.width}px`);
                    }
                }
            }
        });
        
        // 現在のレイアウト更新
        this.currentLayout = layoutKey;
        
        // UI更新
        const layoutNameSpan = this.dropdown?.querySelector('.layout-name');
        if (layoutNameSpan) {
            layoutNameSpan.textContent = layout.name;
        }
        
        // リサイズハンドルの更新
        if (this.resizeHandleController) {
            setTimeout(() => {
                this.resizeHandleController.refreshAllHandles();
            }, 150);
        }
        
        // レイアウト状態を保存
        this.saveCurrentLayoutState();
        
        // イベント発火
        this.emit('layout:applied', {
            layoutKey,
            layout,
            isCustom
        });
        
        console.log('✅ レイアウト適用完了:', layout.name);
    }
    
    /**
     * 現在のレイアウト状態をキャプチャ
     */
    captureCurrentLayout() {
        const mainContainer = document.querySelector('.main-container');
        if (!mainContainer) return null;
        
        const computedStyle = getComputedStyle(mainContainer);
        const currentState = {
            panels: {},
            gridTemplate: {
                columns: computedStyle.gridTemplateColumns,
                rows: computedStyle.gridTemplateRows
            }
        };
        
        // 各パネルの状態を記録
        ['outliner', 'preview', 'properties', 'timeline'].forEach(panelType => {
            const panel = document.querySelector(`[data-panel-type="${panelType}"]`);
            if (panel) {
                const panelStyle = getComputedStyle(panel);
                currentState.panels[panelType] = {
                    visible: panel.style.display !== 'none',
                    width: panel.offsetWidth,
                    height: panel.offsetHeight,
                    position: panelType === 'timeline' ? 'bottom' : 
                             panelType === 'outliner' ? 'left' :
                             panelType === 'properties' ? 'right' : 'center'
                };
            }
        });
        
        return currentState;
    }
    
    /**
     * カスタムレイアウト保存
     */
    saveCustomLayout(name, description = '') {
        const currentState = this.captureCurrentLayout();
        if (!currentState) {
            console.warn('現在のレイアウト状態を取得できません');
            return;
        }
        
        const customKey = `custom_${Date.now()}`;
        const customLayout = {
            name,
            description: description || 'カスタムレイアウト',
            createdAt: new Date().toISOString(),
            config: currentState
        };
        
        this.customLayouts.set(customKey, customLayout);
        this.saveCustomLayouts();
        this.updateLayoutMenu();
        
        this.emit('layout:saved', {
            key: customKey,
            layout: customLayout
        });
        
        console.log('💾 カスタムレイアウト保存完了:', name);
    }
    
    /**
     * カスタムレイアウト削除
     */
    deleteCustomLayout(layoutKey) {
        const layout = this.customLayouts.get(layoutKey);
        if (!layout) return;
        
        if (confirm(`カスタムレイアウト "${layout.name}" を削除しますか？`)) {
            this.customLayouts.delete(layoutKey);
            this.saveCustomLayouts();
            this.updateLayoutMenu();
            
            // 削除したレイアウトが現在適用中の場合、デフォルトに戻す
            if (this.currentLayout === layoutKey) {
                this.applyLayout('default');
            }
            
            this.emit('layout:deleted', { key: layoutKey, layout });
            console.log('🗑️ カスタムレイアウト削除完了:', layout.name);
        }
    }
    
    /**
     * 保存ダイアログ表示
     */
    showSaveDialog() {
        if (this.saveDialog) {
            this.saveDialog.style.display = 'block';
            setTimeout(() => {
                this.saveDialog.querySelector('#layout-name')?.focus();
            }, 100);
        }
    }
    
    /**
     * レイアウトエクスポート
     */
    exportLayouts() {
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            customLayouts: Object.fromEntries(this.customLayouts)
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spine-editor-layouts-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('📤 レイアウト設定エクスポート完了');
    }
    
    /**
     * レイアウトインポートダイアログ表示
     */
    showImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const importData = JSON.parse(text);
                
                if (importData.customLayouts) {
                    Object.entries(importData.customLayouts).forEach(([key, layout]) => {
                        this.customLayouts.set(key, layout);
                    });
                    
                    this.saveCustomLayouts();
                    this.updateLayoutMenu();
                    
                    console.log('📥 レイアウト設定インポート完了:', Object.keys(importData.customLayouts).length, '個');
                }
            } catch (error) {
                console.error('レイアウトインポートエラー:', error);
                alert('レイアウトファイルの読み込みに失敗しました。');
            }
        });
        
        input.click();
    }
    
    /**
     * ローカルストレージ操作
     */
    loadCustomLayouts() {
        try {
            const saved = localStorage.getItem('spine-editor-custom-layouts');
            if (saved) {
                const layouts = JSON.parse(saved);
                Object.entries(layouts).forEach(([key, layout]) => {
                    this.customLayouts.set(key, layout);
                });
                console.log('📂 カスタムレイアウト読み込み完了:', this.customLayouts.size, '個');
            }
        } catch (error) {
            console.warn('カスタムレイアウトの読み込みに失敗:', error);
        }
    }
    
    saveCustomLayouts() {
        try {
            const layouts = Object.fromEntries(this.customLayouts);
            localStorage.setItem('spine-editor-custom-layouts', JSON.stringify(layouts));
        } catch (error) {
            console.warn('カスタムレイアウトの保存に失敗:', error);
        }
    }
    
    saveCurrentLayoutState() {
        localStorage.setItem('spine-editor-current-layout', this.currentLayout);
    }
    
    loadCurrentLayoutState() {
        const saved = localStorage.getItem('spine-editor-current-layout');
        if (saved && (this.layouts.has(saved) || this.customLayouts.has(saved))) {
            setTimeout(() => {
                const isCustom = this.customLayouts.has(saved);
                this.applyLayout(saved, isCustom);
            }, 500); // 他のシステム初期化後に実行
        }
    }
    
    /**
     * ユーティリティメソッド
     */
    getLayoutIcon(layoutKey) {
        const icons = {
            'default': '🏠',
            'focus': '🎯', 
            'debug': '🔧',
            'minimal': '📱'
        };
        return icons[layoutKey] || '📐';
    }
    
    // 外部API
    getCurrentLayout() {
        return this.currentLayout;
    }
    
    getAvailableLayouts() {
        return {
            presets: Array.from(this.layouts.keys()),
            custom: Array.from(this.customLayouts.keys())
        };
    }
    
    // EventBus ヘルパー
    emit(eventType, data = {}) {
        if (this.eventBus) {
            this.eventBus.emit(eventType, data);
        }
    }
    
    destroy() {
        // UI要素削除
        if (this.dropdown) {
            this.dropdown.remove();
        }
        
        if (this.saveDialog) {
            this.saveDialog.remove();
        }
        
        // ResizeHandleController終了
        if (this.resizeHandleController) {
            this.resizeHandleController.destroy();
        }
        
        // 状態保存
        this.saveCurrentLayoutState();
        this.saveCustomLayouts();
        
        console.log('✅ LayoutManager 終了');
    }
}