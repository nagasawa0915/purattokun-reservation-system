// 🚀 Spine編集システム - 保存機能強化モジュール v1.0
// 完全モジュール化・既存システム非破壊拡張設計

console.log('📦 保存機能強化システム v1.0 読み込み開始');

// ========== 保存機能強化システム メインクラス ========== //

class EnhancedSaveSystem {
    constructor(spineSystem = null) {
        this.spineSystem = spineSystem;
        this.hasUnsavedChanges = false;
        this.autoSaveEnabled = true;
        this.autoSaveInterval = null;
        this.autoSaveIntervalMs = 30000; // 30秒間隔
        this.lastSavedState = null;
        this.currentState = null;
        this.saveInProgress = false;
        this.ui = null;
        
        // 既存システム互換性
        this.legacyStorageKey = 'spine-positioning-state';
        this.enhancedStorageKey = 'spine-enhanced-save-v1';
        
        // イベントリスナー管理
        this.changeListeners = new Set();
        this.beforeUnloadHandler = null;
        
        console.log('✅ EnhancedSaveSystem 初期化完了');
        this.initialize();
    }
    
    // ========== 初期化システム ========== //
    
    async initialize() {
        console.log('🔧 保存機能強化システム初期化中...');
        
        try {
            // 既存システムとの互換性確認
            await this.detectExistingSystem();
            
            // UI生成
            this.createUI();
            
            // 変更検知システム開始
            this.startChangeDetection();
            
            // 自動保存開始（有効な場合）
            if (this.autoSaveEnabled) {
                this.startAutoSave();
            }
            
            // ページ離脱時の未保存警告
            this.setupBeforeUnloadWarning();
            
            console.log('✅ 保存機能強化システム初期化完了');
        } catch (error) {
            console.error('❌ 保存機能強化システム初期化エラー:', error);
        }
    }
    
    async detectExistingSystem() {
        console.log('🔍 既存システム検出中...');
        
        // SpinePositioningV2システムの検出
        if (typeof window.spinePositioningV2 !== 'undefined') {
            this.spineSystem = window.spinePositioningV2;
            console.log('✅ SpinePositioningV2システム検出・連携開始');
        } else if (typeof window.spinePositioningSystem !== 'undefined') {
            this.spineSystem = window.spinePositioningSystem;
            console.log('✅ 従来SpinePositioningSystem検出・連携開始');
        } else {
            console.warn('⚠️ 既存のSpineシステムが検出されません（スタンドアロンモード）');
        }
        
        // 既存保存データの確認
        const legacyData = this.loadLegacyData();
        if (legacyData) {
            console.log('📦 既存保存データ検出:', Object.keys(legacyData));
            this.lastSavedState = legacyData;
        }
    }
    
    // ========== 保存・読み込み システム ========== //
    
    async manualSave(showConfirmation = true) {
        console.log('💾 手動保存開始...');
        
        if (this.saveInProgress) {
            console.warn('⚠️ 既に保存処理中です');
            return false;
        }
        
        try {
            this.saveInProgress = true;
            this.showSaveStatus('saving');
            
            // 現在の状態を取得
            const currentState = await this.getCurrentState();
            
            if (showConfirmation) {
                const confirmed = await this.showSaveConfirmation(currentState);
                if (!confirmed) {
                    this.showSaveStatus('cancelled');
                    return false;
                }
            }
            
            // 保存実行
            const success = await this.saveState(currentState);
            
            if (success) {
                this.lastSavedState = { ...currentState };
                this.hasUnsavedChanges = false;
                this.showSaveStatus('success');
                console.log('✅ 手動保存完了');
                return true;
            } else {
                this.showSaveStatus('error');
                console.error('❌ 手動保存失敗');
                return false;
            }
            
        } catch (error) {
            console.error('❌ 手動保存エラー:', error);
            this.showSaveStatus('error');
            return false;
        } finally {
            this.saveInProgress = false;
        }
    }
    
    async autoSave() {
        if (this.saveInProgress || !this.hasUnsavedChanges) {
            return false;
        }
        
        console.log('⚡ 自動保存実行...');
        
        try {
            this.saveInProgress = true;
            
            const currentState = await this.getCurrentState();
            const success = await this.saveState(currentState, true); // 自動保存フラグ
            
            if (success) {
                this.lastSavedState = { ...currentState };
                this.hasUnsavedChanges = false;
                this.showAutoSaveIndicator();
                console.log('✅ 自動保存完了');
                return true;
            }
            
        } catch (error) {
            console.error('❌ 自動保存エラー:', error);
        } finally {
            this.saveInProgress = false;
        }
        
        return false;
    }
    
    async getCurrentState() {
        console.log('🔍 現在の状態取得中...');
        
        const state = {
            timestamp: Date.now(),
            version: '1.0',
            systemType: 'enhanced-save-system',
            
            // 基本キャラクター情報
            character: await this.getCharacterState(),
            
            // 拡張情報
            clones: await this.getClonesState(),
            animations: await this.getAnimationState(),
            ui: await this.getUIState(),
            
            // システム設定
            settings: {
                autoSaveEnabled: this.autoSaveEnabled,
                autoSaveInterval: this.autoSaveIntervalMs
            }
        };
        
        console.log('✅ 状態取得完了:', {
            character: !!state.character,
            clones: Array.isArray(state.clones) ? state.clones.length : 0,
            animations: Object.keys(state.animations || {}).length,
            ui: Object.keys(state.ui || {}).length
        });
        
        return state;
    }
    
    async getCharacterState() {
        // 既存システムから状態取得
        if (this.spineSystem && typeof this.spineSystem.getCurrentState === 'function') {
            return this.spineSystem.getCurrentState();
        }
        
        // フォールバック: DOM から直接取得
        const character = document.querySelector('#purattokun-canvas') || 
                         document.querySelector('canvas[data-spine-character]') ||
                         document.querySelector('#purattokun-fallback');
        
        if (!character) {
            console.warn('⚠️ キャラクター要素が見つかりません');
            return null;
        }
        
        const computedStyle = window.getComputedStyle(character);
        const parentRect = character.parentElement?.getBoundingClientRect();
        
        if (!parentRect) {
            console.warn('⚠️ 親要素が見つかりません');
            return null;
        }
        
        return {
            id: character.id || 'unknown',
            left: computedStyle.left,
            top: computedStyle.top,
            width: computedStyle.width,
            height: computedStyle.height,
            transform: computedStyle.transform,
            zIndex: computedStyle.zIndex,
            display: computedStyle.display,
            visibility: computedStyle.visibility
        };
    }
    
    async getClonesState() {
        // 複製キャラクター管理システムとの連携
        if (typeof window.characterCloneManager !== 'undefined') {
            return window.characterCloneManager.getCloneList();
        }
        
        // フォールバック: DOM検索
        const clones = document.querySelectorAll('[id*="clone"], [data-clone-id]');
        return Array.from(clones).map(clone => ({
            id: clone.id,
            dataCloneId: clone.dataset.cloneId,
            style: {
                left: clone.style.left,
                top: clone.style.top,
                width: clone.style.width,
                height: clone.style.height,
                transform: clone.style.transform
            }
        }));
    }
    
    async getAnimationState() {
        // アニメーション選択システムとの連携
        if (typeof window.animationSelector !== 'undefined') {
            return {
                // 正しいAPIメソッドを使用
                characters: window.animationSelector.getAllCharacterAnimations(),
                availableAnimations: window.animationSelector.availableAnimations,
                // 設定情報（将来拡張用）
                systemSettings: {
                    debugMode: window.animationSelector.config?.debugMode || false,
                    defaultAnimation: window.animationSelector.config?.defaultAnimation || 'taiki'
                }
            };
        }
        
        return {};
    }
    
    async getUIState() {
        return {
            editMode: typeof window.isCharacterEditMode !== 'undefined' ? window.isCharacterEditMode : false,
            panelPositions: this.getPanelPositions(),
            userPreferences: this.getUserPreferences()
        };
    }
    
    getPanelPositions() {
        const panels = {};
        
        // 確認パネル位置
        const confirmPanel = document.querySelector('#edit-confirm-panel');
        if (confirmPanel) {
            const rect = confirmPanel.getBoundingClientRect();
            panels.confirmPanel = {
                left: confirmPanel.style.left,
                top: confirmPanel.style.top,
                width: rect.width,
                height: rect.height
            };
        }
        
        return panels;
    }
    
    getUserPreferences() {
        return {
            autoSaveEnabled: this.autoSaveEnabled,
            showSaveNotifications: true,
            confirmBeforeSave: true
        };
    }
    
    async saveState(state, isAutoSave = false) {
        console.log(`💾 状態保存中... (${isAutoSave ? '自動' : '手動'})`);
        
        try {
            // 拡張保存データ
            const enhancedData = {
                ...state,
                saveType: isAutoSave ? 'auto' : 'manual',
                timestamp: Date.now()
            };
            
            // 新システム用に保存
            localStorage.setItem(this.enhancedStorageKey, JSON.stringify(enhancedData));
            
            // 既存システム互換性のために従来形式でも保存
            if (state.character) {
                const legacyData = {
                    character: state.character,
                    timestamp: state.timestamp
                };
                localStorage.setItem(this.legacyStorageKey, JSON.stringify(legacyData));
            }
            
            console.log('✅ 状態保存完了:', {
                enhancedKey: this.enhancedStorageKey,
                legacyKey: this.legacyStorageKey,
                size: JSON.stringify(enhancedData).length + ' bytes'
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ 状態保存エラー:', error);
            return false;
        }
    }
    
    loadEnhancedData() {
        try {
            const data = localStorage.getItem(this.enhancedStorageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('❌ 拡張データ読み込みエラー:', error);
            return null;
        }
    }
    
    loadLegacyData() {
        try {
            const data = localStorage.getItem(this.legacyStorageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('❌ 従来データ読み込みエラー:', error);
            return null;
        }
    }
    
    // ========== 変更検知システム ========== //
    
    startChangeDetection() {
        console.log('🔍 変更検知システム開始');
        
        // DOM監視
        this.setupMutationObserver();
        
        // スタイル変更監視
        this.setupStyleChangeDetection();
        
        // カスタムイベント監視
        this.setupCustomEventListeners();
    }
    
    setupMutationObserver() {
        if (typeof MutationObserver === 'undefined') {
            console.warn('⚠️ MutationObserver未対応ブラウザ');
            return;
        }
        
        const observer = new MutationObserver((mutations) => {
            let hasSignificantChange = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes') {
                    const target = mutation.target;
                    
                    // Spineキャラクター要素の変更
                    if (target.id === 'purattokun-canvas' || 
                        target.classList.contains('spine-character') ||
                        target.dataset.spineCharacter) {
                        
                        // スタイル属性の変更
                        if (mutation.attributeName === 'style' ||
                            mutation.attributeName === 'data-position' ||
                            mutation.attributeName === 'data-scale') {
                            hasSignificantChange = true;
                        }
                    }
                }
            });
            
            if (hasSignificantChange) {
                this.onChangeDetected('dom-mutation');
            }
        });
        
        // 監視開始
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['style', 'data-position', 'data-scale', 'class'],
            subtree: true
        });
        
        console.log('✅ DOM変更監視開始');
    }
    
    setupStyleChangeDetection() {
        // 定期的なスタイル状態チェック（補完的手法）
        setInterval(() => {
            this.checkForStyleChanges();
        }, 5000); // 5秒間隔
    }
    
    async checkForStyleChanges() {
        if (this.saveInProgress) return;
        
        try {
            const currentState = await this.getCurrentState();
            
            if (this.lastSavedState && this.hasStateChanged(currentState, this.lastSavedState)) {
                this.onChangeDetected('style-check');
            }
            
        } catch (error) {
            console.error('❌ スタイル変更チェックエラー:', error);
        }
    }
    
    hasStateChanged(current, saved) {
        if (!current || !saved) return true;
        
        // 基本的な変更チェック
        const currentStr = JSON.stringify(current.character);
        const savedStr = JSON.stringify(saved.character);
        
        return currentStr !== savedStr;
    }
    
    setupCustomEventListeners() {
        // 既存システムのカスタムイベント監視
        document.addEventListener('spinePositionChanged', () => {
            this.onChangeDetected('spine-position-changed');
        });
        
        document.addEventListener('characterMoved', () => {
            this.onChangeDetected('character-moved');
        });
        
        document.addEventListener('characterResized', () => {
            this.onChangeDetected('character-resized');
        });
    }
    
    onChangeDetected(source) {
        console.log(`🔄 変更検出 (${source})`);
        
        this.hasUnsavedChanges = true;
        this.updateUI();
        
        // 変更リスナーに通知
        this.changeListeners.forEach(listener => {
            try {
                listener(source);
            } catch (error) {
                console.error('❌ 変更リスナーエラー:', error);
            }
        });
    }
    
    addChangeListener(listener) {
        this.changeListeners.add(listener);
    }
    
    removeChangeListener(listener) {
        this.changeListeners.delete(listener);
    }
    
    // ========== 自動保存システム ========== //
    
    startAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setInterval(() => {
            if (this.hasUnsavedChanges && !this.saveInProgress) {
                this.autoSave();
            }
        }, this.autoSaveIntervalMs);
        
        console.log(`⚡ 自動保存開始 (${this.autoSaveIntervalMs}ms間隔)`);
    }
    
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('🛑 自動保存停止');
        }
    }
    
    setAutoSaveEnabled(enabled) {
        this.autoSaveEnabled = enabled;
        
        if (enabled) {
            this.startAutoSave();
        } else {
            this.stopAutoSave();
        }
        
        this.updateUI();
    }
    
    setAutoSaveInterval(intervalMs) {
        this.autoSaveIntervalMs = Math.max(10000, intervalMs); // 最低10秒
        
        if (this.autoSaveEnabled) {
            this.startAutoSave(); // 再起動
        }
    }
    
    // ========== UI システム ========== //
    
    createUI() {
        console.log('🎨 保存UI生成中...');
        
        // 既存UIをチェック
        if (document.querySelector('#enhanced-save-ui')) {
            console.log('⚠️ 保存UIは既に存在します');
            return;
        }
        
        const ui = document.createElement('div');
        ui.id = 'enhanced-save-ui';
        ui.className = 'enhanced-save-panel';
        
        ui.innerHTML = `
            <div class="save-panel-header">
                <span class="save-panel-title">💾 保存システム</span>
                <span class="save-status-indicator" id="save-status">●</span>
            </div>
            
            <div class="save-controls">
                <button id="manual-save-btn" class="save-btn save-btn-primary">
                    💾 保存
                </button>
                
                <div class="auto-save-controls">
                    <label class="auto-save-toggle">
                        <input type="checkbox" id="auto-save-checkbox" ${this.autoSaveEnabled ? 'checked' : ''}>
                        <span class="auto-save-label">⚡ 自動保存</span>
                    </label>
                    
                    <select id="auto-save-interval" class="auto-save-interval">
                        <option value="10000" ${this.autoSaveIntervalMs === 10000 ? 'selected' : ''}>10秒</option>
                        <option value="30000" ${this.autoSaveIntervalMs === 30000 ? 'selected' : ''}>30秒</option>
                        <option value="60000" ${this.autoSaveIntervalMs === 60000 ? 'selected' : ''}>1分</option>
                        <option value="300000" ${this.autoSaveIntervalMs === 300000 ? 'selected' : ''}>5分</option>
                    </select>
                </div>
            </div>
            
            <div class="save-info">
                <div class="unsaved-indicator" id="unsaved-indicator" style="display: none;">
                    ⚠️ 未保存の変更があります
                </div>
                <div class="last-save-time" id="last-save-time"></div>
            </div>
            
            <div class="save-actions">
                <button id="backup-btn" class="save-btn save-btn-secondary">
                    📦 バックアップ作成
                </button>
                <button id="restore-btn" class="save-btn save-btn-secondary">
                    🔄 復元
                </button>
            </div>
        `;
        
        // スタイル追加
        this.addUIStyles();
        
        // イベントリスナー設定
        this.setupUIEventListeners(ui);
        
        // UIを配置
        document.body.appendChild(ui);
        this.ui = ui;
        
        console.log('✅ 保存UI生成完了');
    }
    
    addUIStyles() {
        if (document.querySelector('#enhanced-save-styles')) {
            return; // 既に追加済み
        }
        
        const styles = document.createElement('style');
        styles.id = 'enhanced-save-styles';
        styles.textContent = `
            .enhanced-save-panel {
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(255, 255, 255, 0.95);
                border: 2px solid #007bff;
                border-radius: 8px;
                padding: 12px;
                min-width: 220px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                z-index: 10000;
                backdrop-filter: blur(10px);
            }
            
            .save-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                font-weight: 600;
            }
            
            .save-panel-title {
                color: #007bff;
            }
            
            .save-status-indicator {
                font-size: 12px;
                transition: color 0.3s ease;
            }
            
            .save-status-indicator.saved {
                color: #28a745;
            }
            
            .save-status-indicator.unsaved {
                color: #ffc107;
            }
            
            .save-status-indicator.saving {
                color: #007bff;
                animation: pulse 1s infinite;
            }
            
            .save-status-indicator.error {
                color: #dc3545;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .save-controls {
                margin-bottom: 12px;
            }
            
            .save-btn {
                border: none;
                border-radius: 4px;
                padding: 6px 12px;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s ease;
                margin: 2px;
            }
            
            .save-btn-primary {
                background: #007bff;
                color: white;
            }
            
            .save-btn-primary:hover {
                background: #0056b3;
            }
            
            .save-btn-secondary {
                background: #6c757d;
                color: white;
                font-size: 12px;
            }
            
            .save-btn-secondary:hover {
                background: #545b62;
            }
            
            .auto-save-controls {
                margin-top: 8px;
            }
            
            .auto-save-toggle {
                display: flex;
                align-items: center;
                margin-bottom: 4px;
                cursor: pointer;
            }
            
            .auto-save-toggle input {
                margin-right: 6px;
            }
            
            .auto-save-label {
                font-size: 13px;
            }
            
            .auto-save-interval {
                width: 100%;
                padding: 4px;
                border: 1px solid #ccc;
                border-radius: 3px;
                font-size: 12px;
            }
            
            .save-info {
                border-top: 1px solid #e9ecef;
                padding-top: 8px;
                margin-bottom: 8px;
            }
            
            .unsaved-indicator {
                color: #ffc107;
                font-size: 12px;
                margin-bottom: 4px;
                animation: blink 2s infinite;
            }
            
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0.5; }
            }
            
            .last-save-time {
                font-size: 11px;
                color: #6c757d;
            }
            
            .save-actions {
                border-top: 1px solid #e9ecef;
                padding-top: 8px;
                display: flex;
                gap: 4px;
            }
            
            .save-actions .save-btn {
                flex: 1;
            }
            
            /* レスポンシブ対応 */
            @media (max-width: 768px) {
                .enhanced-save-panel {
                    top: 5px;
                    right: 5px;
                    min-width: 180px;
                    padding: 8px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    setupUIEventListeners(ui) {
        // 手動保存ボタン
        const manualSaveBtn = ui.querySelector('#manual-save-btn');
        manualSaveBtn.addEventListener('click', () => {
            this.manualSave();
        });
        
        // 自動保存チェックボックス
        const autoSaveCheckbox = ui.querySelector('#auto-save-checkbox');
        autoSaveCheckbox.addEventListener('change', (e) => {
            this.setAutoSaveEnabled(e.target.checked);
        });
        
        // 自動保存間隔セレクト
        const autoSaveInterval = ui.querySelector('#auto-save-interval');
        autoSaveInterval.addEventListener('change', (e) => {
            this.setAutoSaveInterval(parseInt(e.target.value));
        });
        
        // バックアップボタン
        const backupBtn = ui.querySelector('#backup-btn');
        backupBtn.addEventListener('click', () => {
            this.createBackup();
        });
        
        // 復元ボタン
        const restoreBtn = ui.querySelector('#restore-btn');
        restoreBtn.addEventListener('click', () => {
            this.showRestoreDialog();
        });
    }
    
    updateUI() {
        if (!this.ui) return;
        
        // 保存状態インジケーター更新
        const statusIndicator = this.ui.querySelector('#save-status');
        const unsavedIndicator = this.ui.querySelector('#unsaved-indicator');
        
        if (this.hasUnsavedChanges) {
            statusIndicator.className = 'save-status-indicator unsaved';
            unsavedIndicator.style.display = 'block';
        } else {
            statusIndicator.className = 'save-status-indicator saved';
            unsavedIndicator.style.display = 'none';
        }
        
        // 最後の保存時刻更新
        this.updateLastSaveTime();
    }
    
    updateLastSaveTime() {
        if (!this.ui) return;
        
        const lastSaveTime = this.ui.querySelector('#last-save-time');
        if (this.lastSavedState && this.lastSavedState.timestamp) {
            const time = new Date(this.lastSavedState.timestamp);
            lastSaveTime.textContent = `最終保存: ${time.toLocaleTimeString()}`;
        } else {
            lastSaveTime.textContent = '未保存';
        }
    }
    
    showSaveStatus(status) {
        if (!this.ui) return;
        
        const statusIndicator = this.ui.querySelector('#save-status');
        const manualSaveBtn = this.ui.querySelector('#manual-save-btn');
        
        switch (status) {
            case 'saving':
                statusIndicator.className = 'save-status-indicator saving';
                manualSaveBtn.disabled = true;
                manualSaveBtn.textContent = '💾 保存中...';
                break;
                
            case 'success':
                statusIndicator.className = 'save-status-indicator saved';
                manualSaveBtn.disabled = false;
                manualSaveBtn.textContent = '💾 保存';
                this.showTemporaryMessage('✅ 保存完了', 'success');
                break;
                
            case 'error':
                statusIndicator.className = 'save-status-indicator error';
                manualSaveBtn.disabled = false;
                manualSaveBtn.textContent = '💾 保存';
                this.showTemporaryMessage('❌ 保存失敗', 'error');
                break;
                
            case 'cancelled':
                statusIndicator.className = 'save-status-indicator unsaved';
                manualSaveBtn.disabled = false;
                manualSaveBtn.textContent = '💾 保存';
                this.showTemporaryMessage('⚠️ 保存キャンセル', 'warning');
                break;
        }
        
        this.updateLastSaveTime();
    }
    
    showAutoSaveIndicator() {
        this.showTemporaryMessage('⚡ 自動保存完了', 'success', 2000);
    }
    
    showTemporaryMessage(message, type = 'info', duration = 3000) {
        // 一時的なメッセージ表示
        const messageEl = document.createElement('div');
        messageEl.className = `save-message save-message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 60px;
            right: 10px;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#fff3cd'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#856404'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#ffeaa7'};
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 13px;
            z-index: 10001;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, duration);
    }
    
    async showSaveConfirmation(currentState) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'save-confirmation-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10002;
            `;
            
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: white;
                border-radius: 8px;
                padding: 20px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            `;
            
            dialog.innerHTML = `
                <h3 style="margin: 0 0 16px 0; color: #007bff;">💾 保存確認</h3>
                <p style="margin: 0 0 16px 0; color: #333;">現在の設定を保存しますか？</p>
                <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin-bottom: 16px; font-family: monospace; font-size: 12px;">
                    キャラクター: ${currentState.character ? '設定あり' : '設定なし'}<br>
                    複製: ${currentState.clones ? currentState.clones.length + '個' : '0個'}<br>
                    アニメーション: ${Object.keys(currentState.animations || {}).length + '項目'}
                </div>
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button id="save-cancel-btn" style="padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;">キャンセル</button>
                    <button id="save-confirm-btn" style="padding: 8px 16px; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">保存</button>
                </div>
            `;
            
            modal.appendChild(dialog);
            document.body.appendChild(modal);
            
            const confirmBtn = dialog.querySelector('#save-confirm-btn');
            const cancelBtn = dialog.querySelector('#save-cancel-btn');
            
            const cleanup = () => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            };
            
            confirmBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });
            
            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });
            
            // ESCキーでキャンセル
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', escHandler);
                    cleanup();
                    resolve(false);
                }
            };
            document.addEventListener('keydown', escHandler);
        });
    }
    
    // ========== バックアップ・復元システム ========== //
    
    async createBackup() {
        console.log('📦 バックアップ作成中...');
        
        try {
            const currentState = await this.getCurrentState();
            const backupData = {
                ...currentState,
                backupType: 'manual',
                backupTimestamp: Date.now(),
                backupId: 'backup_' + Date.now()
            };
            
            // バックアップ用キー
            const backupKey = `${this.enhancedStorageKey}_backup_${Date.now()}`;
            localStorage.setItem(backupKey, JSON.stringify(backupData));
            
            // バックアップ一覧を更新
            this.updateBackupList(backupKey);
            
            this.showTemporaryMessage('📦 バックアップ作成完了', 'success');
            console.log('✅ バックアップ作成完了:', backupKey);
            
        } catch (error) {
            console.error('❌ バックアップ作成エラー:', error);
            this.showTemporaryMessage('❌ バックアップ作成失敗', 'error');
        }
    }
    
    updateBackupList(newBackupKey) {
        try {
            const backupListKey = `${this.enhancedStorageKey}_backup_list`;
            const existingList = JSON.parse(localStorage.getItem(backupListKey) || '[]');
            
            existingList.push({
                key: newBackupKey,
                timestamp: Date.now(),
                type: 'manual'
            });
            
            // 最新10個のバックアップを保持
            if (existingList.length > 10) {
                const oldBackup = existingList.shift();
                localStorage.removeItem(oldBackup.key);
            }
            
            localStorage.setItem(backupListKey, JSON.stringify(existingList));
            
        } catch (error) {
            console.error('❌ バックアップ一覧更新エラー:', error);
        }
    }
    
    getBackupList() {
        try {
            const backupListKey = `${this.enhancedStorageKey}_backup_list`;
            return JSON.parse(localStorage.getItem(backupListKey) || '[]');
        } catch (error) {
            console.error('❌ バックアップ一覧取得エラー:', error);
            return [];
        }
    }
    
    async showRestoreDialog() {
        const backupList = this.getBackupList();
        
        if (backupList.length === 0) {
            this.showTemporaryMessage('📦 バックアップが見つかりません', 'warning');
            return;
        }
        
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'restore-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10002;
            `;
            
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: white;
                border-radius: 8px;
                padding: 20px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            `;
            
            const backupListHtml = backupList.map(backup => {
                const date = new Date(backup.timestamp);
                return `
                    <div class="backup-item" data-backup-key="${backup.key}" style="
                        border: 1px solid #e9ecef;
                        border-radius: 4px;
                        padding: 10px;
                        margin-bottom: 8px;
                        cursor: pointer;
                        transition: background 0.2s ease;
                    ">
                        <div style="font-weight: 600;">${date.toLocaleString()}</div>
                        <div style="font-size: 12px; color: #6c757d;">${backup.type} バックアップ</div>
                    </div>
                `;
            }).join('');
            
            dialog.innerHTML = `
                <h3 style="margin: 0 0 16px 0; color: #007bff;">🔄 復元</h3>
                <p style="margin: 0 0 16px 0; color: #333;">復元するバックアップを選択してください：</p>
                <div class="backup-list">
                    ${backupListHtml}
                </div>
                <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
                    <button id="restore-cancel-btn" style="padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;">キャンセル</button>
                </div>
            `;
            
            modal.appendChild(dialog);
            document.body.appendChild(modal);
            
            const cleanup = () => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            };
            
            // バックアップアイテムクリック
            dialog.querySelectorAll('.backup-item').forEach(item => {
                item.addEventListener('click', async () => {
                    const backupKey = item.dataset.backupKey;
                    cleanup();
                    await this.restoreFromBackup(backupKey);
                    resolve(true);
                });
                
                item.addEventListener('mouseenter', () => {
                    item.style.background = '#f8f9fa';
                });
                
                item.addEventListener('mouseleave', () => {
                    item.style.background = 'white';
                });
            });
            
            const cancelBtn = dialog.querySelector('#restore-cancel-btn');
            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });
        });
    }
    
    async restoreFromBackup(backupKey) {
        console.log('🔄 バックアップから復元中:', backupKey);
        
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                throw new Error('バックアップデータが見つかりません');
            }
            
            const parsedData = JSON.parse(backupData);
            
            // 復元実行
            await this.restoreState(parsedData);
            
            this.showTemporaryMessage('🔄 復元完了', 'success');
            console.log('✅ 復元完了');
            
        } catch (error) {
            console.error('❌ 復元エラー:', error);
            this.showTemporaryMessage('❌ 復元失敗', 'error');
        }
    }
    
    async restoreState(stateData) {
        console.log('🔄 状態復元中...');
        
        // キャラクター状態復元
        if (stateData.character) {
            await this.restoreCharacterState(stateData.character);
        }
        
        // 複製キャラクター復元
        if (stateData.clones && Array.isArray(stateData.clones)) {
            await this.restoreClonesState(stateData.clones);
        }
        
        // アニメーション設定復元
        if (stateData.animations) {
            await this.restoreAnimationState(stateData.animations);
        }
        
        // UI設定復元
        if (stateData.ui) {
            await this.restoreUIState(stateData.ui);
        }
        
        // 現在の状態を更新
        this.lastSavedState = { ...stateData };
        this.hasUnsavedChanges = false;
        this.updateUI();
        
        console.log('✅ 状態復元完了');
    }
    
    async restoreCharacterState(characterData) {
        const character = document.querySelector('#purattokun-canvas') || 
                         document.querySelector('canvas[data-spine-character]') ||
                         document.querySelector('#purattokun-fallback');
        
        if (!character) {
            console.warn('⚠️ 復元対象キャラクター要素が見つかりません');
            return;
        }
        
        // スタイル復元
        if (characterData.left) character.style.left = characterData.left;
        if (characterData.top) character.style.top = characterData.top;
        if (characterData.width) character.style.width = characterData.width;
        if (characterData.height) character.style.height = characterData.height;
        if (characterData.transform) character.style.transform = characterData.transform;
        if (characterData.zIndex) character.style.zIndex = characterData.zIndex;
        
        console.log('✅ キャラクター状態復元完了');
    }
    
    async restoreClonesState(clonesData) {
        // 複製システムとの連携
        if (typeof window.characterCloneManager !== 'undefined') {
            window.characterCloneManager.restoreClones(clonesData);
        }
        
        console.log('✅ 複製状態復元完了');
    }
    
    async restoreAnimationState(animationData) {
        // アニメーションシステムとの連携
        if (typeof window.animationSelector !== 'undefined') {
            window.animationSelector.restoreState(animationData);
        }
        
        console.log('✅ アニメーション状態復元完了');
    }
    
    async restoreUIState(uiData) {
        // パネル位置復元など
        if (uiData.panelPositions) {
            Object.entries(uiData.panelPositions).forEach(([panelId, position]) => {
                const panel = document.querySelector(`#${panelId}`);
                if (panel && position) {
                    if (position.left) panel.style.left = position.left;
                    if (position.top) panel.style.top = position.top;
                }
            });
        }
        
        console.log('✅ UI状態復元完了');
    }
    
    // ========== ページ離脱時の警告システム ========== //
    
    setupBeforeUnloadWarning() {
        this.beforeUnloadHandler = (e) => {
            if (this.hasUnsavedChanges) {
                const message = '未保存の変更があります。ページを離れてもよろしいですか？';
                e.preventDefault();
                e.returnValue = message;
                return message;
            }
        };
        
        window.addEventListener('beforeunload', this.beforeUnloadHandler);
        console.log('✅ ページ離脱時の未保存警告設定完了');
    }
    
    // ========== システム管理・クリーンアップ ========== //
    
    destroy() {
        console.log('🧹 保存機能強化システム終了処理...');
        
        // 自動保存停止
        this.stopAutoSave();
        
        // イベントリスナー削除
        if (this.beforeUnloadHandler) {
            window.removeEventListener('beforeunload', this.beforeUnloadHandler);
        }
        
        // UI削除
        if (this.ui && this.ui.parentNode) {
            this.ui.parentNode.removeChild(this.ui);
        }
        
        // スタイル削除
        const styles = document.querySelector('#enhanced-save-styles');
        if (styles && styles.parentNode) {
            styles.parentNode.removeChild(styles);
        }
        
        // 変更リスナークリア
        this.changeListeners.clear();
        
        console.log('✅ 終了処理完了');
    }
    
    // ========== デバッグ・診断機能 ========== //
    
    async diagnose() {
        console.log('🔍 === 保存機能強化システム診断 ===');
        
        const diagnosis = {
            system: {
                initialized: !!this.spineSystem,
                hasUnsavedChanges: this.hasUnsavedChanges,
                autoSaveEnabled: this.autoSaveEnabled,
                autoSaveInterval: this.autoSaveIntervalMs,
                saveInProgress: this.saveInProgress
            },
            storage: {
                enhancedDataExists: !!this.loadEnhancedData(),
                legacyDataExists: !!this.loadLegacyData(),
                backupCount: this.getBackupList().length
            },
            ui: {
                uiExists: !!this.ui,
                stylesLoaded: !!document.querySelector('#enhanced-save-styles')
            },
            integration: {
                spineSystemDetected: !!this.spineSystem,
                cloneManagerDetected: typeof window.characterCloneManager !== 'undefined',
                animationSelectorDetected: typeof window.animationSelector !== 'undefined'
            }
        };
        
        console.table(diagnosis.system);
        console.table(diagnosis.storage);
        console.table(diagnosis.ui);
        console.table(diagnosis.integration);
        
        console.log('✅ 診断完了');
        return diagnosis;
    }
    
    getStatus() {
        return {
            hasUnsavedChanges: this.hasUnsavedChanges,
            autoSaveEnabled: this.autoSaveEnabled,
            saveInProgress: this.saveInProgress,
            lastSavedTimestamp: this.lastSavedState?.timestamp || null
        };
    }
}

// ========== グローバル初期化・外部API ========== //

// グローバルインスタンス
let enhancedSaveSystem = null;

// 初期化関数
function initializeEnhancedSaveSystem(spineSystem = null) {
    console.log('🚀 保存機能強化システム初期化...');
    
    if (enhancedSaveSystem) {
        console.warn('⚠️ 保存機能強化システムは既に初期化済みです');
        return enhancedSaveSystem;
    }
    
    enhancedSaveSystem = new EnhancedSaveSystem(spineSystem);
    
    // グローバルアクセス用
    window.enhancedSaveSystem = enhancedSaveSystem;
    
    console.log('✅ 保存機能強化システム初期化完了');
    return enhancedSaveSystem;
}

// 外部API関数
window.initializeEnhancedSaveSystem = initializeEnhancedSaveSystem;

// 便利関数
window.manualSave = () => enhancedSaveSystem?.manualSave();
window.toggleAutoSave = () => enhancedSaveSystem?.setAutoSaveEnabled(!enhancedSaveSystem.autoSaveEnabled);
window.createBackup = () => enhancedSaveSystem?.createBackup();
window.diagnoseEnhancedSave = () => enhancedSaveSystem?.diagnose();

// 自動初期化（既存システム検出時）
if (typeof document !== 'undefined') {
    // DOM読み込み後に自動初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                initializeEnhancedSaveSystem();
            }, 1000); // 既存システムの初期化を待つ
        });
    } else {
        // 既にDOM読み込み済み
        setTimeout(() => {
            initializeEnhancedSaveSystem();
        }, 1000);
    }
}

console.log('📦 保存機能強化システム v1.0 読み込み完了');

// ========== エクスポート ========== //

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnhancedSaveSystem, initializeEnhancedSaveSystem };
}