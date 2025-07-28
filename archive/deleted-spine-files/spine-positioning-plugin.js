/**
 * Spine Positioning Plugin
 * 既存のページにSpineキャラクターの配置機能を追加するプラグイン
 * 
 * 使用方法:
 * 1. このファイルを読み込む
 * 2. SpinePositioningPlugin.init() を呼び出す
 * 3. 自動的にSpineキャラクターを検出して配置システムを適用
 */

class SpinePositioningPlugin {
    constructor() {
        this.initialized = false;
        this.characters = new Map(); // キャラクター管理
        this.ui = null; // UI要素
        this.settings = {
            enableUI: true,           // UI表示
            enableDragDrop: true,     // ドラッグ&ドロップ
            enablePresets: true,      // プリセット機能
            autoDetect: true,         // 自動検出
            savePosition: true,       // 位置保存
            storageKey: 'spine-positioning-data'
        };
        
        // デフォルトプリセット
        this.presets = {
            center: { x: 50, y: 50, scale: 1.0, name: '中央' },
            road: { x: 25, y: 65, scale: 0.8, name: '道路側' },
            shop: { x: 18, y: 49, scale: 0.55, name: 'お店前' },
            right: { x: 75, y: 60, scale: 0.7, name: '右寄り' }
        };
    }

    /**
     * プラグインを初期化
     * @param {Object} options - 設定オプション
     */
    init(options = {}) {
        if (this.initialized) return;

        // 設定をマージ
        Object.assign(this.settings, options);

        console.log('🎮 Spine Positioning Plugin 初期化中...');

        // DOM読み込み完了を待つ
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }

        this.initialized = true;
    }

    /**
     * セットアップ実行
     */
    setup() {
        try {
            // 既存のSpineキャラクターを検出
            this.detectSpineCharacters();

            // UIを作成
            if (this.settings.enableUI) {
                this.createUI();
            }

            // 保存済み位置を復元
            if (this.settings.savePosition) {
                this.restorePositions();
            }

            console.log('✅ Spine Positioning Plugin 初期化完了');
            console.log(`検出されたキャラクター: ${this.characters.size}個`);

        } catch (error) {
            console.error('❌ Spine Positioning Plugin 初期化エラー:', error);
        }
    }

    /**
     * Spineキャラクターを自動検出
     */
    detectSpineCharacters() {
        // Canvas要素を検索（Spine用）
        const canvases = document.querySelectorAll('canvas[id*="purattokun"], canvas[data-spine-character]');
        
        // フォールバック画像を検索
        const fallbacks = document.querySelectorAll('img[id*="purattokun"], img[alt*="ぷらっとくん"], img[data-spine-fallback]');

        // 検出されたキャラクターを登録
        canvases.forEach((canvas, index) => {
            const id = canvas.id || `spine-character-${index}`;
            this.registerCharacter(id, canvas, 'canvas');
        });

        fallbacks.forEach((img, index) => {
            const id = img.id || `spine-fallback-${index}`;
            if (!this.characters.has(id)) {
                this.registerCharacter(id, img, 'image');
            }
        });

        console.log(`🔍 キャラクター検出完了: ${this.characters.size}個`);
    }

    /**
     * キャラクターを登録
     * @param {string} id - キャラクターID
     * @param {HTMLElement} element - DOM要素
     * @param {string} type - タイプ（canvas/image）
     */
    registerCharacter(id, element, type) {
        const character = {
            id: id,
            element: element,
            type: type,
            position: { x: 50, y: 50, scale: 1.0 },
            isDragging: false
        };

        this.characters.set(id, character);

        // ドラッグ&ドロップを有効化
        if (this.settings.enableDragDrop) {
            this.enableDragAndDrop(character);
        }

        // 位置スタイルを確保
        this.ensurePositionStyles(element);

        console.log(`📍 キャラクター登録: ${id} (${type})`);
    }

    /**
     * 位置スタイルを確保
     * @param {HTMLElement} element - DOM要素
     */
    ensurePositionStyles(element) {
        const style = element.style;
        if (!style.position || style.position === 'static') {
            style.position = 'absolute';
        }
        if (!style.cursor) {
            style.cursor = 'pointer';
        }
    }

    /**
     * UIを作成
     */
    createUI() {
        // 既存のUIを削除
        const existingUI = document.getElementById('spine-positioning-ui');
        if (existingUI) {
            existingUI.remove();
        }

        // UIコンテナを作成
        this.ui = document.createElement('div');
        this.ui.id = 'spine-positioning-ui';
        this.ui.innerHTML = this.getUIHTML();
        
        // スタイルを追加
        this.addUIStyles();
        
        // UIを挿入
        document.body.appendChild(this.ui);

        // イベントリスナーを設定
        this.bindUIEvents();

        console.log('🎨 UI作成完了');
    }

    /**
     * UI HTMLを生成
     */
    getUIHTML() {
        const characterOptions = Array.from(this.characters.keys())
            .map(id => `<option value="${id}">${id}</option>`)
            .join('');

        const presetButtons = Object.entries(this.presets)
            .map(([key, preset]) => 
                `<button class="preset-btn" onclick="SpinePositioning.applyPreset('${key}')">${preset.name}</button>`
            ).join('');

        return `
            <div class="sp-header">
                <h3>🎮 Spine Positioning</h3>
                <button class="sp-toggle" onclick="SpinePositioning.toggleUI()">×</button>
            </div>
            
            <div class="sp-content">
                <div class="sp-character-select">
                    <label>キャラクター:</label>
                    <select id="sp-character-select" onchange="SpinePositioning.selectCharacter(this.value)">
                        ${characterOptions}
                    </select>
                </div>

                <div class="sp-controls">
                    <div class="sp-control-group">
                        <label>位置 X:</label>
                        <input type="range" id="sp-pos-x" min="0" max="100" value="50" 
                               oninput="SpinePositioning.updatePosition()">
                        <span id="sp-pos-x-value">50%</span>
                    </div>

                    <div class="sp-control-group">
                        <label>位置 Y:</label>
                        <input type="range" id="sp-pos-y" min="0" max="100" value="50" 
                               oninput="SpinePositioning.updatePosition()">
                        <span id="sp-pos-y-value">50%</span>
                    </div>

                    <div class="sp-control-group">
                        <label>サイズ:</label>
                        <input type="range" id="sp-scale" min="0.1" max="2.0" step="0.1" value="1.0" 
                               oninput="SpinePositioning.updatePosition()">
                        <span id="sp-scale-value">1.0x</span>
                    </div>
                </div>

                <div class="sp-presets">
                    ${presetButtons}
                </div>

                <div class="sp-actions">
                    <button onclick="SpinePositioning.savePosition()">保存</button>
                    <button onclick="SpinePositioning.resetPosition()">リセット</button>
                </div>
            </div>
        `;
    }

    /**
     * UIスタイルを追加
     */
    addUIStyles() {
        const existingStyles = document.getElementById('spine-positioning-styles');
        if (existingStyles) return;

        const styles = document.createElement('style');
        styles.id = 'spine-positioning-styles';
        styles.textContent = `
            #spine-positioning-ui {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 280px;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 10px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 14px;
                backdrop-filter: blur(10px);
            }

            .sp-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 10px 10px 0 0;
                margin: 0;
            }

            .sp-header h3 {
                margin: 0;
                font-size: 16px;
            }

            .sp-toggle {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
            }

            .sp-content {
                padding: 20px;
            }

            .sp-character-select {
                margin-bottom: 15px;
            }

            .sp-character-select label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
                color: #333;
            }

            .sp-character-select select {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 5px;
                background: white;
            }

            .sp-control-group {
                margin-bottom: 15px;
            }

            .sp-control-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
                color: #333;
            }

            .sp-control-group input[type="range"] {
                width: calc(100% - 60px);
                margin-right: 10px;
            }

            .sp-control-group span {
                display: inline-block;
                width: 50px;
                text-align: right;
                color: #666;
                font-weight: bold;
            }

            .sp-presets {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-bottom: 15px;
            }

            .preset-btn, .sp-actions button {
                padding: 8px 12px;
                background: #ff6b6b;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.3s ease;
            }

            .preset-btn:hover, .sp-actions button:hover {
                background: #ff5252;
            }

            .sp-actions {
                display: flex;
                gap: 10px;
            }

            .sp-actions button {
                flex: 1;
            }

            /* ドラッグ中のスタイル */
            .sp-dragging {
                border: 2px dashed #ff6b6b !important;
                z-index: 9999 !important;
            }

            /* 非表示状態 */
            #spine-positioning-ui.hidden {
                transform: translateX(100%);
                transition: transform 0.3s ease;
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * UIイベントを設定
     */
    bindUIEvents() {
        // 最初のキャラクターを選択
        const firstCharacter = this.characters.keys().next().value;
        if (firstCharacter) {
            this.selectCharacter(firstCharacter);
        }
    }

    /**
     * キャラクターを選択
     * @param {string} characterId - キャラクターID
     */
    selectCharacter(characterId) {
        const character = this.characters.get(characterId);
        if (!character) return;

        this.currentCharacter = character;

        // UIを現在の位置に合わせて更新
        this.updateUIFromCharacter(character);

        console.log(`🎯 キャラクター選択: ${characterId}`);
    }

    /**
     * キャラクターの位置からUIを更新
     * @param {Object} character - キャラクターオブジェクト
     */
    updateUIFromCharacter(character) {
        const { position } = character;
        
        document.getElementById('sp-pos-x').value = position.x;
        document.getElementById('sp-pos-y').value = position.y;
        document.getElementById('sp-scale').value = position.scale;
        
        document.getElementById('sp-pos-x-value').textContent = `${Math.round(position.x)}%`;
        document.getElementById('sp-pos-y-value').textContent = `${Math.round(position.y)}%`;
        document.getElementById('sp-scale-value').textContent = `${position.scale}x`;
    }

    /**
     * 位置を更新
     */
    updatePosition() {
        if (!this.currentCharacter) return;

        const x = document.getElementById('sp-pos-x').value;
        const y = document.getElementById('sp-pos-y').value;
        const scale = document.getElementById('sp-scale').value;

        // 表示値を更新
        document.getElementById('sp-pos-x-value').textContent = `${Math.round(x)}%`;
        document.getElementById('sp-pos-y-value').textContent = `${Math.round(y)}%`;
        document.getElementById('sp-scale-value').textContent = `${scale}x`;

        // キャラクターに適用
        this.applyPositionToCharacter(this.currentCharacter, x, y, scale);
    }

    /**
     * キャラクターに位置を適用
     * @param {Object} character - キャラクターオブジェクト
     * @param {number} x - X位置（%）
     * @param {number} y - Y位置（%）
     * @param {number} scale - スケール
     */
    applyPositionToCharacter(character, x, y, scale) {
        const { element } = character;
        const size = 200 * scale; // ベースサイズ

        // 位置を保存
        character.position = { x: parseFloat(x), y: parseFloat(y), scale: parseFloat(scale) };

        // スタイルを適用
        element.style.left = x + '%';
        element.style.top = y + '%';
        element.style.transform = 'translate(-50%, -50%)';
        element.style.width = size + 'px';
        element.style.height = size + 'px';
    }

    /**
     * プリセットを適用
     * @param {string} presetKey - プリセットキー
     */
    applyPreset(presetKey) {
        if (!this.currentCharacter) return;

        const preset = this.presets[presetKey];
        if (!preset) return;

        // UIを更新
        document.getElementById('sp-pos-x').value = preset.x;
        document.getElementById('sp-pos-y').value = preset.y;
        document.getElementById('sp-scale').value = preset.scale;

        // 位置を適用
        this.updatePosition();

        console.log(`📍 プリセット適用: ${preset.name}`, preset);
    }

    /**
     * ドラッグ&ドロップを有効化
     * @param {Object} character - キャラクターオブジェクト
     */
    enableDragAndDrop(character) {
        const { element } = character;

        let dragOffset = { x: 0, y: 0 };

        const startDrag = (e) => {
            e.preventDefault();
            character.isDragging = true;
            element.classList.add('sp-dragging');

            const rect = element.getBoundingClientRect();
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;

            dragOffset.x = clientX - (rect.left + rect.width / 2);
            dragOffset.y = clientY - (rect.top + rect.height / 2);

            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchmove', drag);
            document.addEventListener('touchend', stopDrag);
        };

        const drag = (e) => {
            if (!character.isDragging) return;
            e.preventDefault();

            const container = document.documentElement;
            const containerRect = container.getBoundingClientRect();
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;

            const newX = ((clientX - dragOffset.x - containerRect.left) / containerRect.width) * 100;
            const newY = ((clientY - dragOffset.y - containerRect.top) / containerRect.height) * 100;

            // 範囲制限
            const clampedX = Math.max(0, Math.min(100, newX));
            const clampedY = Math.max(0, Math.min(100, newY));

            // 位置を適用
            this.applyPositionToCharacter(character, clampedX, clampedY, character.position.scale);

            // UIを更新（現在選択中のキャラクターの場合）
            if (this.currentCharacter === character) {
                this.updateUIFromCharacter(character);
            }
        };

        const stopDrag = () => {
            if (!character.isDragging) return;

            character.isDragging = false;
            element.classList.remove('sp-dragging');

            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('touchend', stopDrag);

            // 位置を保存
            if (this.settings.savePosition) {
                this.savePosition();
            }
        };

        element.addEventListener('mousedown', startDrag);
        element.addEventListener('touchstart', startDrag);
    }

    /**
     * 位置を保存
     */
    savePosition() {
        if (!this.settings.savePosition) return;

        const data = {};
        this.characters.forEach((character, id) => {
            data[id] = character.position;
        });

        localStorage.setItem(this.settings.storageKey, JSON.stringify(data));
        console.log('💾 位置保存完了');
    }

    /**
     * 位置を復元
     */
    restorePositions() {
        if (!this.settings.savePosition) return;

        try {
            const data = localStorage.getItem(this.settings.storageKey);
            if (!data) return;

            const positions = JSON.parse(data);
            
            this.characters.forEach((character, id) => {
                if (positions[id]) {
                    const { x, y, scale } = positions[id];
                    this.applyPositionToCharacter(character, x, y, scale);
                }
            });

            console.log('📥 位置復元完了');
        } catch (error) {
            console.error('位置復元エラー:', error);
        }
    }

    /**
     * 位置をリセット
     */
    resetPosition() {
        this.applyPreset('center');
    }

    /**
     * UIの表示/非表示を切り替え
     */
    toggleUI() {
        if (this.ui) {
            this.ui.classList.toggle('hidden');
        }
    }

    /**
     * プラグインを破棄
     */
    destroy() {
        if (this.ui) {
            this.ui.remove();
        }

        const styles = document.getElementById('spine-positioning-styles');
        if (styles) {
            styles.remove();
        }

        this.characters.clear();
        this.initialized = false;

        console.log('🗑️ Spine Positioning Plugin 破棄完了');
    }
}

// グローバルインスタンスを作成
window.SpinePositioning = new SpinePositioningPlugin();

// 自動初期化（オプション）
if (document.currentScript && document.currentScript.hasAttribute('data-auto-init')) {
    window.SpinePositioning.init();
}

// エクスポート（ES6モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpinePositioningPlugin;
}