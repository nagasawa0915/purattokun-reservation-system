/**
 * 🔌 Spine配置システム拡張プラグイン v2.0
 * 
 * 高度な数値入力・ビジュアル編集・拡張可能なアーキテクチャを実装
 * 既存システムに一切手を加えない、完全非侵襲的プラグイン
 * 
 * 主要機能:
 * - 数値入力による精密制御
 * - クリック範囲の可視化・編集
 * - リアルタイムプレビュー
 * - 拡張可能なプラグインシステム
 * 
 * @version 2.0.0
 * @author Claude Code Assistant
 * @created 2025-01-28
 */

(function() {
    'use strict';

    // =======================================
    // 🎯 システム設定・定数
    // =======================================
    
    const CONFIG = {
        // システム基本設定
        version: '2.0.0',
        debugMode: location.hostname === 'localhost',
        
        // UI設定
        ui: {
            panelWidth: 320,
            panelHeight: 'auto',
            position: 'top-right',
            theme: 'light', // light, dark
            language: 'ja'
        },
        
        // 編集設定
        editing: {
            gridSize: 10,
            snapThreshold: 5,
            minSize: 20,
            maxSize: 800,
            handleSize: 12
        },
        
        // クリック範囲設定
        clickRange: {
            defaultWidth: 0.4,
            defaultHeight: 0.5,
            defaultCenterX: 0.5,
            defaultCenterY: 0.6,
            color: 'rgba(255, 107, 107, 0.3)',
            borderColor: '#ff6b6b',
            borderWidth: 2
        },
        
        // アニメーション設定
        animation: {
            duration: 300,
            easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
        }
    };

    // =======================================
    // 🛠️ ユーティリティ関数
    // =======================================
    
    const Utils = {
        /**
         * ログ出力（デバッグモード時のみ）
         */
        log: function(level, category, message, ...args) {
            if (!CONFIG.debugMode) return;
            
            const prefix = {
                error: '❌',
                warn: '⚠️',
                info: 'ℹ️',
                debug: '🔍'
            }[level] || '📝';
            
            console.log(`${prefix} [SpinePosEnh:${category}] ${message}`, ...args);
        },
        
        /**
         * 要素作成ヘルパー
         */
        createElement: function(tag, className, attributes = {}) {
            const element = document.createElement(tag);
            if (className) element.className = className;
            
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'style' && typeof value === 'object') {
                    Object.assign(element.style, value);
                } else {
                    element.setAttribute(key, value);
                }
            });
            
            return element;
        },
        
        /**
         * 座標変換：相対座標(0-1) ↔ 絶対座標(px)
         */
        coordTransform: {
            relativeToPixel: function(relative, containerSize) {
                return relative * containerSize;
            },
            
            pixelToRelative: function(pixel, containerSize) {
                return pixel / containerSize;
            }
        },
        
        /**
         * 制約適用（値の範囲制限）
         */
        constrain: function(value, min, max) {
            return Math.max(min, Math.min(max, value));
        },
        
        /**
         * グリッドスナップ
         */
        snap: function(value, gridSize) {
            return Math.round(value / gridSize) * gridSize;
        }
    };

    // =======================================
    // 🎛️ 設定管理システム
    // =======================================
    
    class ConfigurationManager {
        constructor() {
            this.settings = { ...CONFIG };
            this.storageKey = 'spine-positioning-enhancement';
            this.hooks = new Map();
            
            this.loadSettings();
            Utils.log('info', 'ConfigManager', '設定管理システム初期化完了');
        }
        
        /**
         * 設定の読み込み（localStorage）
         */
        loadSettings() {
            try {
                const saved = localStorage.getItem(this.storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    this.settings = this.mergeDeep(this.settings, parsed);
                    Utils.log('info', 'ConfigManager', '保存済み設定を読み込み', this.settings);
                }
            } catch (error) {
                Utils.log('error', 'ConfigManager', '設定読み込みエラー', error);
            }
        }
        
        /**
         * 設定の保存（localStorage）
         */
        saveSettings() {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
                Utils.log('info', 'ConfigManager', '設定を保存');
                this.triggerHook('settingsSaved', this.settings);
            } catch (error) {
                Utils.log('error', 'ConfigManager', '設定保存エラー', error);
            }
        }
        
        /**
         * 設定値の取得
         */
        get(path) {
            return path.split('.').reduce((obj, key) => obj?.[key], this.settings);
        }
        
        /**
         * 設定値の更新
         */
        set(path, value) {
            const keys = path.split('.');
            const lastKey = keys.pop();
            const target = keys.reduce((obj, key) => {
                if (!obj[key]) obj[key] = {};
                return obj[key];
            }, this.settings);
            
            const oldValue = target[lastKey];
            target[lastKey] = value;
            
            this.triggerHook('settingChanged', { path, oldValue, newValue: value });
            this.saveSettings();
        }
        
        /**
         * フック登録
         */
        addHook(event, callback) {
            if (!this.hooks.has(event)) {
                this.hooks.set(event, []);
            }
            this.hooks.get(event).push(callback);
        }
        
        /**
         * フック実行
         */
        triggerHook(event, data) {
            const callbacks = this.hooks.get(event) || [];
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    Utils.log('error', 'ConfigManager', `フック実行エラー: ${event}`, error);
                }
            });
        }
        
        /**
         * オブジェクトの深いマージ
         */
        mergeDeep(target, source) {
            const result = { ...target };
            
            Object.keys(source).forEach(key => {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.mergeDeep(target[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            });
            
            return result;
        }
    }

    // =======================================
    // ⚡ イベントシステム（Pub/Sub）
    // =======================================
    
    class EventSystem {
        constructor() {
            this.listeners = new Map();
            Utils.log('info', 'EventSystem', 'イベントシステム初期化完了');
        }
        
        /**
         * イベントリスナー登録
         */
        on(event, callback, priority = 0) {
            if (!this.listeners.has(event)) {
                this.listeners.set(event, []);
            }
            
            this.listeners.get(event).push({ callback, priority });
            
            // 優先度順でソート
            this.listeners.get(event).sort((a, b) => b.priority - a.priority);
            
            Utils.log('debug', 'EventSystem', `イベントリスナー登録: ${event}`);
        }
        
        /**
         * イベント発火
         */
        emit(event, data = {}) {
            const eventListeners = this.listeners.get(event) || [];
            
            Utils.log('debug', 'EventSystem', `イベント発火: ${event}`, data);
            
            eventListeners.forEach(({ callback }) => {
                try {
                    callback(data);
                } catch (error) {
                    Utils.log('error', 'EventSystem', `イベント処理エラー: ${event}`, error);
                }
            });
        }
        
        /**
         * イベントリスナー削除
         */
        off(event, callback) {
            if (!this.listeners.has(event)) return;
            
            const listeners = this.listeners.get(event);
            const index = listeners.findIndex(listener => listener.callback === callback);
            
            if (index !== -1) {
                listeners.splice(index, 1);
                Utils.log('debug', 'EventSystem', `イベントリスナー削除: ${event}`);
            }
        }
    }

    // =======================================
    // 🎮 Canvas管理システム
    // =======================================
    
    class CanvasManager {
        constructor(eventSystem, config) {
            this.events = eventSystem;
            this.config = config;
            this.canvas = null;
            this.canvasRect = null;
            this.fallbackImage = null;
            this.currentPosition = { x: 0, y: 0 };
            this.currentSize = { width: 100, height: 100 };
            this.clickRange = { ...CONFIG.clickRange };
            
            this.init();
        }
        
        /**
         * Canvas要素の検出・初期化
         */
        init() {
            // 既存Canvas要素を検出
            this.canvas = document.getElementById('purattokun-canvas');
            if (!this.canvas) {
                Utils.log('error', 'CanvasManager', 'Canvas要素が見つかりません');
                return false;
            }
            
            // フォールバック画像を検出
            this.fallbackImage = document.getElementById('purattokun-fallback');
            
            this.updateCanvasInfo();
            this.setupEventListeners();
            
            Utils.log('info', 'CanvasManager', 'Canvas管理システム初期化完了', {
                canvas: this.canvas,
                fallback: this.fallbackImage
            });
            
            return true;
        }
        
        /**
         * Canvas情報の更新
         */
        updateCanvasInfo() {
            if (!this.canvas) return;
            
            this.canvasRect = this.canvas.getBoundingClientRect();
            
            // 現在の位置・サイズを計算
            const computedStyle = window.getComputedStyle(this.canvas);
            this.currentPosition = {
                x: parseFloat(computedStyle.left) || 0,
                y: parseFloat(computedStyle.top) || 0
            };
            
            this.currentSize = {
                width: this.canvasRect.width,
                height: this.canvasRect.height
            };
            
            this.events.emit('canvasInfoUpdated', {
                position: this.currentPosition,
                size: this.currentSize,
                rect: this.canvasRect
            });
        }
        
        /**
         * イベントリスナーの設定
         */
        setupEventListeners() {
            // ウィンドウリサイズ時の更新
            window.addEventListener('resize', () => {
                this.updateCanvasInfo();
            });
            
            // Canvas位置変更の監視
            if (window.ResizeObserver) {
                const observer = new ResizeObserver(() => {
                    this.updateCanvasInfo();
                });
                observer.observe(this.canvas);
            }
        }
        
        /**
         * Canvas位置の更新
         */
        updatePosition(x, y, unit = 'px') {
            if (!this.canvas) return;
            
            if (unit === '%') {
                this.canvas.style.left = x + '%';
                this.canvas.style.top = y + '%';
            } else {
                this.canvas.style.left = x + 'px';
                this.canvas.style.top = y + 'px';
            }
            
            this.updateCanvasInfo();
            
            this.events.emit('positionChanged', { x, y, unit });
            Utils.log('debug', 'CanvasManager', `位置更新: ${x}${unit}, ${y}${unit}`);
        }
        
        /**
         * Canvas サイズの更新
         */
        updateSize(width, height, unit = 'px') {
            if (!this.canvas) return;
            
            if (unit === '%') {
                this.canvas.style.width = width + '%';
                this.canvas.style.height = height + '%';
            } else {
                this.canvas.style.width = width + 'px';
                this.canvas.style.height = height + 'px';
            }
            
            this.updateCanvasInfo();
            
            this.events.emit('sizeChanged', { width, height, unit });
            Utils.log('debug', 'CanvasManager', `サイズ更新: ${width}${unit} x ${height}${unit}`);
        }
        
        /**
         * クリック範囲の更新
         */
        updateClickRange(centerX, centerY, width, height) {
            this.clickRange = { centerX, centerY, width, height };
            
            this.events.emit('clickRangeChanged', this.clickRange);
            Utils.log('debug', 'CanvasManager', 'クリック範囲更新', this.clickRange);
        }
        
        /**
         * 現在の状態を取得
         */
        getState() {
            return {
                position: this.currentPosition,
                size: this.currentSize,
                clickRange: this.clickRange,
                rect: this.canvasRect
            };
        }
    }

    // =======================================
    // 🔢 数値入力パネル
    // =======================================
    
    class NumericInputPanel {
        constructor(eventSystem, config, canvasManager) {
            this.events = eventSystem;
            this.config = config;
            this.canvasManager = canvasManager;
            this.panel = null;
            this.inputs = new Map();
            
            this.createPanel();
            this.setupEventListeners();
            
            Utils.log('info', 'NumericInputPanel', '数値入力パネル初期化完了');
        }
        
        /**
         * パネル作成
         */
        createPanel() {
            this.panel = Utils.createElement('div', 'spine-enhance-numeric-panel', {
                style: {
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    width: this.config.get('ui.panelWidth') + 'px',
                    backgroundColor: 'white',
                    border: '2px solid #ddd',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    zIndex: '10000',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '14px',
                    padding: '16px'
                }
            });
            
            // ヘッダー
            const header = Utils.createElement('div', 'panel-header', {
                style: {
                    borderBottom: '1px solid #eee',
                    paddingBottom: '12px',
                    marginBottom: '16px',
                    fontWeight: 'bold',
                    color: '#333',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }
            });
            
            const title = Utils.createElement('span', '', {});
            title.textContent = '🎯 Spine配置制御';
            
            const closeBtn = Utils.createElement('button', 'close-btn', {
                style: {
                    background: 'none',
                    border: 'none',
                    fontSize: '16px',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px'
                }
            });
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => this.hide());
            
            header.appendChild(title);
            header.appendChild(closeBtn);
            this.panel.appendChild(header);
            
            // 入力フィールド群の作成
            this.createInputGroups();
            
            document.body.appendChild(this.panel);
        }
        
        /**
         * 入力フィールド群の作成
         */
        createInputGroups() {
            const groups = [
                {
                    title: '📐 位置座標',
                    fields: [
                        { key: 'posX', label: 'X座標', value: 18, unit: '%', min: 0, max: 100, step: 0.1 },
                        { key: 'posY', label: 'Y座標', value: 49, unit: '%', min: 0, max: 100, step: 0.1 }
                    ]
                },
                {
                    title: '📏 サイズ',
                    fields: [
                        { key: 'width', label: '幅', value: 120, unit: 'px', min: 20, max: 800, step: 1 },
                        { key: 'height', label: '高さ', value: 120, unit: 'px', min: 20, max: 800, step: 1 },
                        { key: 'scale', label: 'スケール', value: 1.0, unit: '', min: 0.1, max: 3.0, step: 0.01 }
                    ]
                },
                {
                    title: '🎯 クリック範囲',
                    fields: [
                        { key: 'clickCenterX', label: '中心X', value: 0.5, unit: '', min: 0, max: 1, step: 0.01 },
                        { key: 'clickCenterY', label: '中心Y', value: 0.6, unit: '', min: 0, max: 1, step: 0.01 },
                        { key: 'clickWidth', label: '範囲幅', value: 0.4, unit: '', min: 0.1, max: 1, step: 0.01 },
                        { key: 'clickHeight', label: '範囲高', value: 0.5, unit: '', min: 0.1, max: 1, step: 0.01 }
                    ]
                }
            ];
            
            groups.forEach(group => {
                this.createInputGroup(group);
            });
        }
        
        /**
         * 入力グループの作成
         */
        createInputGroup(group) {
            const groupContainer = Utils.createElement('div', 'input-group', {
                style: {
                    marginBottom: '20px'
                }
            });
            
            const groupTitle = Utils.createElement('h4', 'group-title', {
                style: {
                    margin: '0 0 12px 0',
                    fontSize: '13px',
                    color: '#666',
                    fontWeight: '600'
                }
            });
            groupTitle.textContent = group.title;
            groupContainer.appendChild(groupTitle);
            
            group.fields.forEach(field => {
                const fieldContainer = this.createInputField(field);
                groupContainer.appendChild(fieldContainer);
            });
            
            this.panel.appendChild(groupContainer);
        }
        
        /**
         * 入力フィールドの作成
         */
        createInputField(field) {
            const container = Utils.createElement('div', 'input-field', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px',
                    gap: '8px'
                }
            });
            
            const label = Utils.createElement('label', 'field-label', {
                style: {
                    minWidth: '60px',
                    fontSize: '12px',
                    color: '#555'
                }
            });
            label.textContent = field.label;
            
            const input = Utils.createElement('input', 'field-input', {
                type: 'number',
                min: field.min,
                max: field.max,
                step: field.step,
                value: field.value,
                style: {
                    flex: '1',
                    padding: '6px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px'
                }
            });
            
            const unit = Utils.createElement('span', 'field-unit', {
                style: {
                    minWidth: '20px',
                    fontSize: '11px',
                    color: '#888'
                }
            });
            unit.textContent = field.unit;
            
            // 入力イベント
            input.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.handleInputChange(field.key, value, field.unit);
            });
            
            container.appendChild(label);
            container.appendChild(input);
            container.appendChild(unit);
            
            this.inputs.set(field.key, { input, field });
            
            return container;
        }
        
        /**
         * 入力値変更ハンドラ
         */
        handleInputChange(key, value, unit) {
            Utils.log('debug', 'NumericInputPanel', `入力変更: ${key} = ${value}${unit}`);
            
            switch (key) {
                case 'posX':
                case 'posY':
                    const x = key === 'posX' ? value : this.getInputValue('posX');
                    const y = key === 'posY' ? value : this.getInputValue('posY');
                    this.canvasManager.updatePosition(x, y, unit);
                    break;
                    
                case 'width':
                case 'height':
                    const width = key === 'width' ? value : this.getInputValue('width');
                    const height = key === 'height' ? value : this.getInputValue('height');
                    this.canvasManager.updateSize(width, height, unit);
                    break;
                    
                case 'clickCenterX':
                case 'clickCenterY':
                case 'clickWidth':
                case 'clickHeight':
                    this.updateClickRange();
                    break;
            }
            
            this.events.emit('numericInputChanged', { key, value, unit });
        }
        
        /**
         * クリック範囲の更新
         */
        updateClickRange() {
            const centerX = this.getInputValue('clickCenterX');
            const centerY = this.getInputValue('clickCenterY');
            const width = this.getInputValue('clickWidth');
            const height = this.getInputValue('clickHeight');
            
            this.canvasManager.updateClickRange(centerX, centerY, width, height);
        }
        
        /**
         * 入力値の取得
         */
        getInputValue(key) {
            const inputData = this.inputs.get(key);
            return inputData ? parseFloat(inputData.input.value) : 0;
        }
        
        /**
         * 入力値の設定
         */
        setInputValue(key, value) {
            const inputData = this.inputs.get(key);
            if (inputData) {
                inputData.input.value = value;
            }
        }
        
        /**
         * イベントリスナーの設定
         */
        setupEventListeners() {
            // Canvas情報更新時の入力値同期
            this.events.on('canvasInfoUpdated', (data) => {
                // 実装：Canvas情報と入力値の同期
            });
        }
        
        /**
         * パネル表示
         */
        show() {
            if (this.panel) {
                this.panel.style.display = 'block';
            }
        }
        
        /**
         * パネル非表示
         */
        hide() {
            if (this.panel) {
                this.panel.style.display = 'none';
            }
        }
    }

    // =======================================
    // 🎨 ビジュアル編集システム
    // =======================================
    
    class VisualEditor {
        constructor(eventSystem, config, canvasManager) {
            this.events = eventSystem;
            this.config = config;
            this.canvasManager = canvasManager;
            this.overlay = null;
            this.clickRangeIndicator = null;
            this.handles = [];
            this.isDragging = false;
            this.dragStart = { x: 0, y: 0 };
            
            this.createOverlay();
            this.setupEventListeners();
            
            Utils.log('info', 'VisualEditor', 'ビジュアル編集システム初期化完了');
        }
        
        /**
         * オーバーレイ作成
         */
        createOverlay() {
            this.overlay = Utils.createElement('div', 'spine-enhance-overlay', {
                style: {
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: '9999'
                }
            });
            
            this.createClickRangeIndicator();
            document.body.appendChild(this.overlay);
        }
        
        /**
         * クリック範囲インジケーター作成
         */
        createClickRangeIndicator() {
            this.clickRangeIndicator = Utils.createElement('div', 'click-range-indicator', {
                style: {
                    position: 'absolute',
                    border: `${CONFIG.clickRange.borderWidth}px solid ${CONFIG.clickRange.borderColor}`,
                    backgroundColor: CONFIG.clickRange.color,
                    pointerEvents: 'auto',
                    cursor: 'move',
                    display: 'none'
                }
            });
            
            // リサイズハンドルの作成
            this.createResizeHandles();
            
            this.overlay.appendChild(this.clickRangeIndicator);
        }
        
        /**
         * リサイズハンドル作成
         */
        createResizeHandles() {
            const handlePositions = [
                { position: 'nw', cursor: 'nw-resize', x: 0, y: 0 },
                { position: 'n',  cursor: 'n-resize',  x: 0.5, y: 0 },
                { position: 'ne', cursor: 'ne-resize', x: 1, y: 0 },
                { position: 'e',  cursor: 'e-resize',  x: 1, y: 0.5 },
                { position: 'se', cursor: 'se-resize', x: 1, y: 1 },
                { position: 's',  cursor: 's-resize',  x: 0.5, y: 1 },
                { position: 'sw', cursor: 'sw-resize', x: 0, y: 1 },
                { position: 'w',  cursor: 'w-resize',  x: 0, y: 0.5 }
            ];
            
            handlePositions.forEach(({ position, cursor, x, y }) => {
                const handle = Utils.createElement('div', `resize-handle-${position}`, {
                    style: {
                        position: 'absolute',
                        width: CONFIG.editing.handleSize + 'px',
                        height: CONFIG.editing.handleSize + 'px',
                        backgroundColor: CONFIG.clickRange.borderColor,
                        border: '2px solid white',
                        borderRadius: '50%',
                        cursor: cursor,
                        pointerEvents: 'auto',
                        transform: 'translate(-50%, -50%)'
                    }
                });
                
                // ハンドルの位置計算
                handle.style.left = (x * 100) + '%';
                handle.style.top = (y * 100) + '%';
                
                this.handles.push({ element: handle, position, x, y });
                this.clickRangeIndicator.appendChild(handle);
            });
        }
        
        /**
         * クリック範囲の表示更新
         */
        updateClickRangeDisplay() {
            const canvasState = this.canvasManager.getState();
            if (!canvasState.rect || !this.clickRangeIndicator) return;
            
            const { centerX, centerY, width, height } = canvasState.clickRange;
            const canvasRect = canvasState.rect;
            
            // クリック範囲の絶対座標計算
            const rangeWidth = canvasRect.width * width;
            const rangeHeight = canvasRect.height * height;
            const rangeLeft = canvasRect.left + (canvasRect.width * centerX) - (rangeWidth / 2);
            const rangeTop = canvasRect.top + (canvasRect.height * centerY) - (rangeHeight / 2);
            
            // インジケーターの位置・サイズ設定
            Object.assign(this.clickRangeIndicator.style, {
                left: rangeLeft + 'px',
                top: rangeTop + 'px',
                width: rangeWidth + 'px',
                height: rangeHeight + 'px',
                display: 'block'
            });
            
            Utils.log('debug', 'VisualEditor', 'クリック範囲表示更新', {
                left: rangeLeft,
                top: rangeTop,
                width: rangeWidth,
                height: rangeHeight
            });
        }
        
        /**
         * イベントリスナーの設定
         */
        setupEventListeners() {
            // Canvas情報更新時の表示更新
            this.events.on('canvasInfoUpdated', () => {
                this.updateClickRangeDisplay();
            });
            
            // クリック範囲変更時の表示更新
            this.events.on('clickRangeChanged', () => {
                this.updateClickRangeDisplay();
            });
            
            // ドラッグ操作の設定
            this.setupDragHandlers();
        }
        
        /**
         * ドラッグ操作の設定
         */
        setupDragHandlers() {
            // メイン範囲のドラッグ
            this.clickRangeIndicator.addEventListener('mousedown', (e) => {
                if (e.target === this.clickRangeIndicator) {
                    this.startDrag(e, 'move');
                }
            });
            
            // ハンドルのドラッグ
            this.handles.forEach(({ element, position }) => {
                element.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    this.startDrag(e, 'resize', position);
                });
            });
            
            // グローバルマウスイベント
            document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        }
        
        /**
         * ドラッグ開始
         */
        startDrag(e, mode, resizeDirection = null) {
            this.isDragging = true;
            this.dragMode = mode;
            this.resizeDirection = resizeDirection;
            this.dragStart = { x: e.clientX, y: e.clientY };
            
            document.body.style.cursor = mode === 'move' ? 'grabbing' : (resizeDirection ? `${resizeDirection}-resize` : 'default');
            
            Utils.log('debug', 'VisualEditor', `ドラッグ開始: ${mode}`, { resizeDirection });
        }
        
        /**
         * マウス移動処理
         */
        handleMouseMove(e) {
            if (!this.isDragging) return;
            
            const deltaX = e.clientX - this.dragStart.x;
            const deltaY = e.clientY - this.dragStart.y;
            
            if (this.dragMode === 'move') {
                this.handleMove(deltaX, deltaY);
            } else if (this.dragMode === 'resize') {
                this.handleResize(deltaX, deltaY);
            }
            
            this.dragStart = { x: e.clientX, y: e.clientY };
        }
        
        /**
         * 移動処理
         */
        handleMove(deltaX, deltaY) {
            const canvasState = this.canvasManager.getState();
            if (!canvasState.rect) return;
            
            const canvasRect = canvasState.rect;
            const { centerX, centerY, width, height } = canvasState.clickRange;
            
            // 相対座標での移動量計算
            const relativeDeltaX = deltaX / canvasRect.width;
            const relativeDeltaY = deltaY / canvasRect.height;
            
            const newCenterX = Utils.constrain(centerX + relativeDeltaX, width/2, 1 - width/2);
            const newCenterY = Utils.constrain(centerY + relativeDeltaY, height/2, 1 - height/2);
            
            this.canvasManager.updateClickRange(newCenterX, newCenterY, width, height);
        }
        
        /**
         * リサイズ処理
         */
        handleResize(deltaX, deltaY) {
            const canvasState = this.canvasManager.getState();
            if (!canvasState.rect) return;
            
            const canvasRect = canvasState.rect;
            const { centerX, centerY, width, height } = canvasState.clickRange;
            
            // 相対座標でのサイズ変更量計算
            const relativeDeltaX = deltaX / canvasRect.width;
            const relativeDeltaY = deltaY / canvasRect.height;
            
            let newWidth = width;
            let newHeight = height;
            let newCenterX = centerX;
            let newCenterY = centerY;
            
            // リサイズ方向に応じた処理
            switch (this.resizeDirection) {
                case 'se': // 右下
                    newWidth = Utils.constrain(width + relativeDeltaX, 0.1, 1);
                    newHeight = Utils.constrain(height + relativeDeltaY, 0.1, 1);
                    break;
                case 'nw': // 左上
                    newWidth = Utils.constrain(width - relativeDeltaX, 0.1, 1);
                    newHeight = Utils.constrain(height - relativeDeltaY, 0.1, 1);
                    break;
                case 'ne': // 右上
                    newWidth = Utils.constrain(width + relativeDeltaX, 0.1, 1);
                    newHeight = Utils.constrain(height - relativeDeltaY, 0.1, 1);
                    break;
                case 'sw': // 左下
                    newWidth = Utils.constrain(width - relativeDeltaX, 0.1, 1);
                    newHeight = Utils.constrain(height + relativeDeltaY, 0.1, 1);
                    break;
                case 'e': // 右
                    newWidth = Utils.constrain(width + relativeDeltaX, 0.1, 1);
                    break;
                case 'w': // 左
                    newWidth = Utils.constrain(width - relativeDeltaX, 0.1, 1);
                    break;
                case 'n': // 上
                    newHeight = Utils.constrain(height - relativeDeltaY, 0.1, 1);
                    break;
                case 's': // 下
                    newHeight = Utils.constrain(height + relativeDeltaY, 0.1, 1);
                    break;
            }
            
            this.canvasManager.updateClickRange(newCenterX, newCenterY, newWidth, newHeight);
        }
        
        /**
         * マウスアップ処理
         */
        handleMouseUp(e) {
            if (!this.isDragging) return;
            
            this.isDragging = false;
            this.dragMode = null;
            this.resizeDirection = null;
            document.body.style.cursor = 'default';
            
            Utils.log('debug', 'VisualEditor', 'ドラッグ終了');
        }
        
        /**
         * 表示切り替え
         */
        show() {
            if (this.overlay) {
                this.overlay.style.display = 'block';
                this.updateClickRangeDisplay();
            }
        }
        
        hide() {
            if (this.overlay) {
                this.overlay.style.display = 'none';
            }
        }
    }

    // =======================================
    // 🔧 プラグインシステム
    // =======================================
    
    class PluginSystem {
        constructor(eventSystem, config) {
            this.events = eventSystem;
            this.config = config;
            this.plugins = new Map();
            this.hooks = new Map();
            
            Utils.log('info', 'PluginSystem', 'プラグインシステム初期化完了');
        }
        
        /**
         * プラグイン登録
         */
        registerPlugin(name, plugin) {
            if (this.plugins.has(name)) {
                Utils.log('warn', 'PluginSystem', `プラグイン重複登録: ${name}`);
                return false;
            }
            
            this.plugins.set(name, plugin);
            
            // プラグイン初期化
            if (typeof plugin.init === 'function') {
                try {
                    plugin.init(this.getAPI());
                    Utils.log('info', 'PluginSystem', `プラグイン登録完了: ${name}`);
                } catch (error) {
                    Utils.log('error', 'PluginSystem', `プラグイン初期化エラー: ${name}`, error);
                    this.plugins.delete(name);
                    return false;
                }
            }
            
            return true;
        }
        
        /**
         * フック登録
         */
        addHook(hookName, callback, priority = 0) {
            if (!this.hooks.has(hookName)) {
                this.hooks.set(hookName, []);
            }
            
            this.hooks.get(hookName).push({ callback, priority });
            this.hooks.get(hookName).sort((a, b) => b.priority - a.priority);
            
            Utils.log('debug', 'PluginSystem', `フック登録: ${hookName}`);
        }
        
        /**
         * フック実行
         */
        executeHook(hookName, data = {}) {
            const hookCallbacks = this.hooks.get(hookName) || [];
            
            hookCallbacks.forEach(({ callback }) => {
                try {
                    callback(data);
                } catch (error) {
                    Utils.log('error', 'PluginSystem', `フック実行エラー: ${hookName}`, error);
                }
            });
        }
        
        /**
         * プラグインAPI取得
         */
        getAPI() {
            return {
                events: this.events,
                config: this.config,
                utils: Utils,
                addHook: this.addHook.bind(this),
                executeHook: this.executeHook.bind(this)
            };
        }
    }

    // =======================================
    // 🎯 メインシステム
    // =======================================
    
    class SpinePositioningEnhancer {
        constructor() {
            this.version = CONFIG.version;
            this.isInitialized = false;
            
            // コアシステムの初期化
            this.config = new ConfigurationManager();
            this.events = new EventSystem();
            this.canvasManager = new CanvasManager(this.events, this.config);
            this.pluginSystem = new PluginSystem(this.events, this.config);
            
            // UIシステムの初期化
            this.numericPanel = null;
            this.visualEditor = null;
            
            Utils.log('info', 'SpinePositioningEnhancer', `メインシステム初期化開始 v${this.version}`);
        }
        
        /**
         * システム初期化
         */
        async init() {
            try {
                // Canvas管理システムの初期化確認
                if (!this.canvasManager.init()) {
                    throw new Error('Canvas管理システムの初期化に失敗');
                }
                
                // UIシステムの初期化
                this.numericPanel = new NumericInputPanel(this.events, this.config, this.canvasManager);
                this.visualEditor = new VisualEditor(this.events, this.config, this.canvasManager);
                
                // グローバルAPIの登録
                this.registerGlobalAPI();
                
                // システムイベントの設定
                this.setupSystemEvents();
                
                this.isInitialized = true;
                
                Utils.log('info', 'SpinePositioningEnhancer', 'システム初期化完了');
                
                // 初期化完了イベント
                this.events.emit('systemInitialized', { version: this.version });
                
                return true;
                
            } catch (error) {
                Utils.log('error', 'SpinePositioningEnhancer', 'システム初期化エラー', error);
                return false;
            }
        }
        
        /**
         * グローバルAPI登録
         */
        registerGlobalAPI() {
            window.SpinePositioningEnhancer = {
                version: this.version,
                show: () => this.show(),
                hide: () => this.hide(),
                toggle: () => this.toggle(),
                getState: () => this.getState(),
                updatePosition: (x, y, unit) => this.canvasManager.updatePosition(x, y, unit),
                updateSize: (w, h, unit) => this.canvasManager.updateSize(w, h, unit),
                updateClickRange: (cx, cy, w, h) => this.canvasManager.updateClickRange(cx, cy, w, h),
                registerPlugin: (name, plugin) => this.pluginSystem.registerPlugin(name, plugin)
            };
            
            Utils.log('info', 'SpinePositioningEnhancer', 'グローバルAPI登録完了');
        }
        
        /**
         * システムイベントの設定
         */
        setupSystemEvents() {
            // キーボードショートカット
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                    e.preventDefault();
                    this.toggle();
                }
            });
            
            Utils.log('debug', 'SpinePositioningEnhancer', 'システムイベント設定完了');
        }
        
        /**
         * システム表示
         */
        show() {
            if (!this.isInitialized) return;
            
            this.numericPanel.show();
            this.visualEditor.show();
            
            this.events.emit('systemShown');
            Utils.log('info', 'SpinePositioningEnhancer', 'システム表示');
        }
        
        /**
         * システム非表示
         */
        hide() {
            if (!this.isInitialized) return;
            
            this.numericPanel.hide();
            this.visualEditor.hide();
            
            this.events.emit('systemHidden');
            Utils.log('info', 'SpinePositioningEnhancer', 'システム非表示');
        }
        
        /**
         * システム表示切り替え
         */
        toggle() {
            if (!this.isInitialized) return;
            
            const isVisible = this.numericPanel.panel.style.display !== 'none';
            
            if (isVisible) {
                this.hide();
            } else {
                this.show();
            }
        }
        
        /**
         * システム状態取得
         */
        getState() {
            return {
                version: this.version,
                initialized: this.isInitialized,
                canvas: this.canvasManager.getState(),
                config: this.config.settings
            };
        }
    }

    // =======================================
    // 🚀 自動初期化・起動
    // =======================================
    
    // システムの自動初期化
    let enhancerInstance = null;
    
    function initializeEnhancer() {
        Utils.log('info', 'AutoInit', 'Spine配置拡張システム自動初期化開始');
        
        enhancerInstance = new SpinePositioningEnhancer();
        
        enhancerInstance.init().then(success => {
            if (success) {
                Utils.log('info', 'AutoInit', '自動初期化完了 - Ctrl+Shift+P で表示切り替え');
                
                // 3秒後に自動表示（デモ用）
                if (CONFIG.debugMode) {
                    setTimeout(() => {
                        enhancerInstance.show();
                    }, 2000);
                }
            } else {
                Utils.log('error', 'AutoInit', '自動初期化失敗');
            }
        });
    }
    
    // DOM読み込み完了後に初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEnhancer);
    } else {
        // 既に読み込み完了している場合は即座に実行
        setTimeout(initializeEnhancer, 100);
    }
    
    Utils.log('info', 'SpinePositioningEnhancement', 'プラグインファイル読み込み完了');

})();