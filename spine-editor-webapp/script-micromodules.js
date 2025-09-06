/**
 * script-micromodules.js - マイクロモジュール版統合システム
 * 
 * 各UIマイクロモジュールを統合してSpine Editor WebAppを構築
 */

import PanelManager from '../micromodules/ui-panel-manager/PanelManager.js';
import { getGlobalEventBus } from '../micromodules/ui-panel-manager/EventBus.js';
import TimelineModule from '../micromodules/ui-timeline/TimelineModule.js';
import LayoutManager from '../micromodules/ui-layout-manager/LayoutManager.js';
import DragSplitManager from '../micromodules/ui-drag-split/DragSplitManager.js';

class SpineEditorApp {
    constructor() {
        this.eventBus = getGlobalEventBus();
        this.panelManager = null;
        this.timelineModule = null;
        this.layoutManager = null;
        this.dragSplitManager = null;
        this.modules = new Map();
        
        // デバッグモード
        this.eventBus.setDebug(true);
        
        this.init();
    }

    async init() {
        console.log('🚀 Spine Editor WebApp (Micromodules版) 初期化開始');
        
        try {
            // EventBus基本イベント設定
            this.setupEventBus();
            
            // PanelManager初期化
            await this.initializePanelManager();
            
            // TimelineModule初期化
            await this.initializeTimelineModule();
            
            // LayoutManager初期化
            await this.initializeLayoutManager();
            
            // DragSplitManager初期化
            await this.initializeDragSplitManager();
            
            // ダミーモジュール初期化（将来的に実モジュールに置き換え）
            this.initializeDummyModules();
            
            // レイアウト復元
            this.loadSavedLayout();
            
            console.log('✅ Spine Editor WebApp 初期化完了');
            
            this.eventBus.emit('app:initialized');
            
        } catch (error) {
            console.error('❌ Spine Editor WebApp 初期化失敗:', error);
        }
    }

    setupEventBus() {
        // アプリケーションレベルのイベント監視
        this.eventBus.on('app:shutdown', () => {
            this.shutdown();
        });

        // パネル関連イベントの監視（デバッグ用）
        this.eventBus.on('panel:dragStart', (data) => {
            console.log('🎯 Panel drag started:', data.panelId);
        });

        this.eventBus.on('panel:reordered', (data) => {
            console.log('🔄 Panel reordered:', data.draggedId, '→', data.targetId);
        });

        this.eventBus.on('layout:updated', (data) => {
            console.log('📐 Layout updated:', data.newOrder);
        });
        
        // D&D分割システムのイベント監視
        this.eventBus.on('panel:dragStart', (data) => {
            console.log('🎯 Panel drag started for splitting:', data.panel);
        });
        
        this.eventBus.on('split:created', (data) => {
            console.log('🔄 Panel split created:', data.draggedPanel, '→', data.position, 'of', data.targetPanel);
        });
    }

    async initializePanelManager() {
        console.log('🎛️ PanelManager 初期化中...');
        
        this.panelManager = new PanelManager({
            eventBus: this.eventBus,
            enableDrag: true,
            enableResize: true,
            enableKeyboardShortcuts: true,
            minWidth: 150,
            maxWidth: 400
        });

        // PanelManagerをグローバルに登録（デバッグ・操作用）
        window.panelManager = this.panelManager;
        
        console.log('✅ PanelManager 初期化完了');
    }

    async initializeTimelineModule() {
        console.log('⏰ TimelineModule 初期化中...');
        
        const timelineContainer = document.querySelector('.timeline-panel');
        if (!timelineContainer) {
            console.warn('タイムライン コンテナが見つかりません');
            return;
        }

        this.timelineModule = new TimelineModule({
            container: timelineContainer,
            eventBus: this.eventBus,
            config: {
                maxTime: 120,
                pixelsPerSecond: 10,
                trackHeight: 40,
                trackSpacing: 2
            }
        });

        // TimelineModuleをグローバルに登録（デバッグ用）
        window.timelineModule = this.timelineModule;
        
        console.log('✅ TimelineModule 初期化完了');
    }

    async initializeLayoutManager() {
        console.log('📐 LayoutManager 初期化中...');
        
        this.layoutManager = new LayoutManager({
            container: document.body,
            eventBus: this.eventBus,
            panelManager: this.panelManager
        });

        // LayoutManagerをグローバルに登録（デバッグ用）
        window.layoutManager = this.layoutManager;
        
        console.log('✅ LayoutManager 初期化完了');
    }
    
    async initializeDragSplitManager() {
        console.log('🔄 DragSplitManager 初期化中...');
        
        this.dragSplitManager = new DragSplitManager({
            container: document.querySelector('.main-container'),
            eventBus: this.eventBus,
            config: {
                dropZoneSize: 40,
                previewOpacity: 0.3,
                animationDuration: 300,
                minPanelSize: 150
            }
        });
        
        // DragSplitManagerをグローバルに登録（デバッグ用）
        window.dragSplitManager = this.dragSplitManager;
        
        console.log('✅ DragSplitManager 初期化完了');
    }

    initializeDummyModules() {
        console.log('📋 ダミーモジュール初期化中...');
        
        // Outliner ダミーモジュール
        this.modules.set('outliner', new DummyOutlinerModule({
            container: document.querySelector('.panel-outliner .panel-content'),
            eventBus: this.eventBus
        }));

        // Preview ダミーモジュール  
        this.modules.set('preview', new DummyPreviewModule({
            container: document.querySelector('.panel-preview .panel-content'),
            eventBus: this.eventBus
        }));

        // Properties ダミーモジュール
        this.modules.set('properties', new DummyPropertiesModule({
            container: document.querySelector('.panel-properties .panel-content'),
            eventBus: this.eventBus
        }));

        console.log('✅ ダミーモジュール初期化完了');
    }

    loadSavedLayout() {
        if (this.panelManager) {
            this.panelManager.loadLayoutState();
        }
        
        if (this.layoutManager) {
            this.layoutManager.loadCurrentLayoutState();
        }
    }

    shutdown() {
        console.log('🛑 Spine Editor WebApp シャットダウン中...');
        
        // レイアウト保存
        if (this.panelManager) {
            this.panelManager.saveLayoutState();
            this.panelManager.destroy();
        }

        // TimelineModule終了
        if (this.timelineModule) {
            this.timelineModule.destroy();
        }

        // LayoutManager終了
        if (this.layoutManager) {
            this.layoutManager.destroy();
        }
        
        // DragSplitManager終了
        if (this.dragSplitManager) {
            this.dragSplitManager.destroy();
        }

        // モジュール終了処理
        this.modules.forEach((module, name) => {
            if (module.destroy) {
                module.destroy();
            }
        });
        this.modules.clear();

        // EventBus クリア
        this.eventBus.removeAllListeners();
        
        console.log('✅ シャットダウン完了');
    }
}

// ダミーモジュールクラス群（将来的に実装されるまでの暫定）

class DummyOutlinerModule {
    constructor(options) {
        this.container = options.container;
        this.eventBus = options.eventBus;
        this.init();
    }

    init() {
        // 現在のツリーをそのまま利用
        const treeItems = this.container.querySelectorAll('.tree-item');
        treeItems.forEach(item => {
            if (item.classList.contains('tree-folder') || item.classList.contains('tree-character')) {
                item.addEventListener('click', this.handleTreeItemClick.bind(this));
            }
        });

        console.log('📁 DummyOutlinerModule 初期化完了');
    }

    handleTreeItemClick(event) {
        event.stopPropagation();
        const item = event.currentTarget;
        
        // 展開/折りたたみ
        if (item.classList.contains('tree-folder') || item.classList.contains('tree-character')) {
            item.classList.toggle('expanded');
        }
        
        // 選択状態
        this.container.querySelectorAll('.tree-item').forEach(treeItem => {
            treeItem.classList.remove('selected');
        });
        item.classList.add('selected');

        // イベント発火
        const itemData = {
            type: item.classList.contains('tree-folder') ? 'folder' :
                  item.classList.contains('tree-character') ? 'character' : 'animation',
            name: item.querySelector('.tree-label').textContent,
            element: item
        };
        
        this.eventBus.emit('outliner:itemSelected', itemData);
    }

    destroy() {
        // クリーンアップ処理
    }
}

class DummyPreviewModule {
    constructor(options) {
        this.container = options.container;
        this.eventBus = options.eventBus;
        this.init();
    }

    init() {
        // Outlinerの選択を監視
        this.eventBus.on('outliner:itemSelected', (data) => {
            this.handleOutlinerSelection(data);
        });

        console.log('🎬 DummyPreviewModule 初期化完了');
    }

    handleOutlinerSelection(data) {
        const placeholder = this.container.querySelector('.placeholder-content');
        if (placeholder) {
            placeholder.innerHTML = `
                <h3>🎬 Preview: ${data.name}</h3>
                <p>Selected ${data.type}: ${data.name}</p>
                <p><small>将来ここにSpineアニメーションが表示されます</small></p>
            `;
        }
        
        this.eventBus.emit('preview:contentChanged', data);
    }

    destroy() {
        // クリーンアップ処理
    }
}

class DummyPropertiesModule {
    constructor(options) {
        this.container = options.container;
        this.eventBus = options.eventBus;
        this.init();
    }

    init() {
        // 既存のプロパティ入力をリアクティブに
        const inputs = this.container.querySelectorAll('.property-input, .property-select, .property-checkbox');
        inputs.forEach(input => {
            input.addEventListener('change', this.handlePropertyChange.bind(this));
        });

        // Outliner/Previewの選択を監視
        this.eventBus.on('outliner:itemSelected', (data) => {
            this.handleSelectionChange(data);
        });

        console.log('⚙️ DummyPropertiesModule 初期化完了');
    }

    handlePropertyChange(event) {
        const input = event.target;
        const property = input.name || input.className;
        const value = input.type === 'checkbox' ? input.checked : input.value;
        
        const changeData = {
            property,
            value,
            element: input
        };

        this.eventBus.emit('properties:changed', changeData);
        
        console.log('⚙️ Property changed:', property, '=', value);
    }

    handleSelectionChange(data) {
        // パネルタイトルを更新
        const panelTitle = document.querySelector('.panel-properties .panel-title');
        if (panelTitle) {
            panelTitle.textContent = data.name;
        }
    }

    destroy() {
        // クリーンアップ処理
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    const app = new SpineEditorApp();
    
    // グローバルに公開（デバッグ用）
    window.spineEditorApp = app;
    
    // ページ離脱時の保存
    window.addEventListener('beforeunload', () => {
        app.shutdown();
    });
});

// キーボードショートカット情報表示
console.log('⌨️  Available keyboard shortcuts:');
console.log('  Ctrl+1: Toggle Outliner panel');
console.log('  Ctrl+2: Toggle Preview panel');
console.log('  Ctrl+3: Toggle Properties panel');
console.log('  Ctrl+R: Reset layout');
console.log('  Ctrl+Shift+R: Reset to default layout');
console.log('  Ctrl+Shift+S: Save custom layout');
console.log('🔧 Debug: window.panelManager, window.timelineModule, window.layoutManager, window.dragSplitManager, window.globalEventBus, window.spineEditorApp');

// デバッグ機能群
window.debugTimelineResize = function() {
    const timelineHandle = document.querySelector('.resize-handle-timeline');
    const timelinePanel = document.querySelector('.panel-timeline');
    
    console.log('🔍 タイムライン境界線デバッグ:');
    console.log('  境界線要素:', timelineHandle);
    console.log('  タイムラインパネル:', timelinePanel);
    console.log('  --timeline-height 値:', getComputedStyle(document.documentElement).getPropertyValue('--timeline-height'));
    
    if (timelineHandle) {
        const rect = timelineHandle.getBoundingClientRect();
        console.log('  境界線位置:', { 
            top: rect.top, 
            bottom: rect.bottom, 
            height: rect.height, 
            width: rect.width 
        });
        
        // 境界線を一時的に赤くして確認
        timelineHandle.style.backgroundColor = 'red';
        timelineHandle.style.height = '8px';
        setTimeout(() => {
            timelineHandle.style.backgroundColor = '';
            timelineHandle.style.height = '4px';
        }, 2000);
    }
};

// 全ドラッグ機能デバッグ
window.debugDragSystem = function() {
    console.log('🔍 ドラッグシステム診断:');
    
    // 1. リサイズハンドル確認
    const leftHandle = document.querySelector('.resize-handle-left');
    const rightHandle = document.querySelector('.resize-handle-right');
    const timelineHandle = document.querySelector('.resize-handle-timeline');
    
    console.log('📏 リサイズハンドル:');
    console.log('  左:', leftHandle, leftHandle?.getBoundingClientRect());
    console.log('  右:', rightHandle, rightHandle?.getBoundingClientRect());
    console.log('  タイムライン:', timelineHandle, timelineHandle?.getBoundingClientRect());
    
    // 2. パネルドラッグ確認
    const panels = document.querySelectorAll('.panel');
    console.log('📦 パネル状態:');
    panels.forEach(panel => {
        const header = panel.querySelector('.panel-header');
        console.log(`  ${panel.dataset.panelType}:`, {
            draggable: header?.getAttribute('draggable'),
            cursor: getComputedStyle(header).cursor,
            events: header?.getAttribute('data-drag-enabled')
        });
    });
    
    // 3. システム状態確認
    console.log('🏗️ システム状態:');
    console.log('  LayoutManager:', window.layoutManager);
    console.log('  DragSplitManager:', window.dragSplitManager);
    console.log('  ResizeHandleController:', window.layoutManager?.resizeHandleController);
    
    // 4. エラーテスト
    try {
        if (window.layoutManager?.resizeHandleController) {
            console.log('  リサイズコントローラー ハンドル数:', window.layoutManager.resizeHandleController.handles?.size);
        }
    } catch (error) {
        console.error('  リサイズコントローラー エラー:', error);
    }
};

// ドラッグ機能強制修復
window.fixDragSystem = function() {
    console.log('🔧 ドラッグシステム強制修復開始...');
    
    // 1. リサイズハンドルの強制再初期化
    try {
        if (window.layoutManager?.resizeHandleController) {
            console.log('  ResizeHandleController 強制再初期化...');
            window.layoutManager.resizeHandleController.findHandles();
            window.layoutManager.resizeHandleController.updateHandlePositions();
        }
    } catch (error) {
        console.error('  ResizeHandleController 修復失敗:', error);
    }
    
    // 2. パネルドラッグの強制設定
    try {
        console.log('  パネルドラッグ 強制設定...');
        const panels = document.querySelectorAll('.panel');
        panels.forEach(panel => {
            const header = panel.querySelector('.panel-header');
            if (header) {
                header.setAttribute('draggable', 'true');
                header.setAttribute('data-drag-enabled', 'true');
                header.style.cursor = 'grab';
                console.log(`    ✅ ${panel.dataset.panelType} パネル修復完了`);
            }
        });
    } catch (error) {
        console.error('  パネルドラッグ 修復失敗:', error);
    }
    
    // 3. DragSplitManager 強制再初期化
    try {
        if (window.dragSplitManager) {
            console.log('  DragSplitManager 強制再初期化...');
            window.dragSplitManager.findSplittablePanels();
        }
    } catch (error) {
        console.error('  DragSplitManager 修復失敗:', error);
    }
    
    // 4. イベントリスナーの強制追加（緊急措置）
    try {
        console.log('  緊急イベントリスナー追加...');
        
        // リサイズハンドルの緊急イベント
        const handles = [
            { selector: '.resize-handle-left', direction: 'left', cssVar: '--outliner-width' },
            { selector: '.resize-handle-right', direction: 'right', cssVar: '--properties-width' },
            { selector: '.resize-handle-timeline', direction: 'timeline', cssVar: '--timeline-height' }
        ];
        
        handles.forEach(handleInfo => {
            const handle = document.querySelector(handleInfo.selector);
            if (handle) {
                // 既存リスナーを削除
                handle.removeEventListener('mousedown', handle._emergency_mousedown);
                
                // 緊急リスナーを追加
                handle._emergency_mousedown = function(e) {
                    let isVertical = handleInfo.direction === 'timeline';
                    let startPos = isVertical ? e.clientY : e.clientX;
                    let startValue = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(handleInfo.cssVar)) || 200;
                    
                    const onMove = (e) => {
                        let currentPos = isVertical ? e.clientY : e.clientX;
                        let delta = startPos - currentPos;
                        
                        if (handleInfo.direction === 'right') {
                            delta = -delta;
                        }
                        
                        let newValue = Math.max(100, Math.min(400, startValue + delta));
                        document.documentElement.style.setProperty(handleInfo.cssVar, newValue + 'px');
                    };
                    
                    const onUp = () => {
                        document.removeEventListener('mousemove', onMove);
                        document.removeEventListener('mouseup', onUp);
                        document.body.style.cursor = '';
                        document.body.classList.remove('col-resizing', 'row-resizing');
                    };
                    
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                    document.body.style.cursor = isVertical ? 'row-resize' : 'col-resize';
                    document.body.classList.add(isVertical ? 'row-resizing' : 'col-resizing');
                    
                    e.preventDefault();
                };
                
                handle.addEventListener('mousedown', handle._emergency_mousedown);
                console.log(`    ✅ ${handleInfo.direction} ハンドル 緊急リスナー追加完了`);
            }
        });
        
    } catch (error) {
        console.error('  緊急イベントリスナー追加失敗:', error);
    }
    
    console.log('🎉 ドラッグシステム強制修復完了！');
    console.log('💡 今すぐテスト:');
    console.log('  - パネルヘッダーをドラッグしてみてください');
    console.log('  - 左右の境界線をドラッグしてみてください');
    console.log('  - タイムライン上端の境界線をドラッグしてみてください');
};