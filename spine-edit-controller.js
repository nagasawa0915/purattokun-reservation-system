/**
 * SpineEditController - 中央制御システム（Phase 1: 基盤構築）
 * 
 * 【目的】:
 * - 初期化順序の厳格管理
 * - モジュール間依存関係の解決
 * - 状態一元管理システム
 * - UUID-based キャラクター識別
 * - 複数キャラクター対応localStorage
 * 
 * 【実装日】: 2025-08-07
 * 【バージョン】: 1.0.0
 */

// console.log('🏗️ SpineEditController v1.0.0 - 中央制御システム読み込み開始'); // デバッグ出力無効化

/**
 * SpineEditController クラス - システム全体の中央制御
 */
class SpineEditController {
    constructor() {
        this.version = '1.0.0';
        this.initialized = false;
        this.modules = new Map();
        this.characters = new Map(); // UUID-based キャラクター管理
        this.localStorage = new SpineEditStorage(); // 複数キャラクター対応storage
        this.initPromise = null; // Promise-based 初期化
        
        // 初期化状態管理
        this.initStates = {
            dom: false,
            spine: false,
            ui: false,
            characters: false,
            storage: false
        };
        
        console.log('✅ SpineEditController インスタンス作成完了');
    }
    
    /**
     * システム全体の同期初期化（Promise-based）
     * @returns {Promise<boolean>} 初期化成功/失敗
     */
    async initialize() {
        if (this.initPromise) {
            console.log('🔄 既存の初期化プロセス待機中...');
            return this.initPromise;
        }
        
        console.log('🚀 SpineEditController システム初期化開始');
        
        this.initPromise = this._performInitialization();
        return this.initPromise;
    }
    
    /**
     * 内部初期化プロセス実行
     * @private
     */
    async _performInitialization() {
        try {
            // Phase 1: DOM準備完了待機
            await this._waitForDOM();
            this.initStates.dom = true;
            console.log('✅ Phase 1: DOM準備完了');
            
            // Phase 2: Spine WebGL システム初期化
            await this._initializeSpineSystem();
            this.initStates.spine = true;
            console.log('✅ Phase 2: Spine システム初期化完了');
            
            // Phase 3: キャラクター検出・UUID付与
            await this._discoverCharacters();
            this.initStates.characters = true;
            console.log('✅ Phase 3: キャラクター検出・識別完了');
            
            // Phase 4: ストレージシステム初期化
            await this._initializeStorage();
            this.initStates.storage = true;
            console.log('✅ Phase 4: ストレージシステム初期化完了');
            
            // Phase 5: UI システム有効化
            await this._initializeUI();
            this.initStates.ui = true;
            console.log('✅ Phase 5: UI システム有効化完了');
            
            this.initialized = true;
            console.log('🎉 SpineEditController 全システム初期化完了');
            
            // 初期化完了イベント発火
            this._emitInitializationComplete();
            
            return true;
            
        } catch (error) {
            console.error('❌ SpineEditController 初期化失敗:', error);
            await this._handleInitializationFailure(error);
            return false;
        }
    }
    
    /**
     * DOM準備完了待機
     * @private
     */
    async _waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve, { once: true });
            } else {
                resolve();
            }
        });
    }
    
    /**
     * Spine WebGL システム初期化
     * @private
     */
    async _initializeSpineSystem() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 最大5秒間（100ms × 50回）
            let timeoutHandled = false;
            
            // Spine関連ファイルの読み込み確認
            const checkSpineSystem = () => {
                if (timeoutHandled) return; // タイムアウト済みの場合は処理しない
                
                attempts++;
                
                if (window.spine && window.SpineWebGL) {
                    console.log('✅ Spine WebGL システム検出');
                    timeoutHandled = true;
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.warn('⚠️ Spine WebGL システム初期化タイムアウト (5秒)');
                    timeoutHandled = true;
                    resolve(); // タイムアウトでも続行（フォールバック）
                } else {
                    setTimeout(checkSpineSystem, 100);
                }
            };
            
            // 安全なタイムアウト処理
            setTimeout(() => {
                if (!timeoutHandled) {
                    console.warn('⚠️ 強制タイムアウト - Spine システム初期化停止');
                    timeoutHandled = true;
                    resolve();
                }
            }, 6000); // 6秒で強制終了
            
            checkSpineSystem();
        });
    }
    
    /**
     * キャラクター自動検出・UUID付与システム
     * @private
     */
    async _discoverCharacters() {
        const selectors = [
            'canvas[id*="canvas"]',
            'canvas[id*="purattokun"]',
            'canvas[class*="spine"]',
            '.spine-canvas',
            '.character-canvas'
        ];
        
        let charactersFound = 0;
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            
            elements.forEach((element, index) => {
                if (!this._isCharacterElement(element)) return;
                
                // UUID生成・付与
                const characterUUID = this._generateCharacterUUID(element, selector, index);
                element.setAttribute('data-character-uuid', characterUUID);
                
                // キャラクター情報登録
                const characterInfo = {
                    uuid: characterUUID,
                    element: element,
                    selector: selector,
                    originalId: element.id,
                    originalClass: element.className,
                    detectedAt: new Date().toISOString(),
                    position: this._getElementPosition(element),
                    scale: this._getElementScale(element)
                };
                
                this.characters.set(characterUUID, characterInfo);
                charactersFound++;
                
                console.log(`🎯 キャラクター検出・UUID付与: ${characterUUID}`, characterInfo);
            });
        }
        
        if (charactersFound === 0) {
            console.warn('⚠️ キャラクター要素が検出されませんでした');
        } else {
            console.log(`✅ ${charactersFound} 個のキャラクターを検出・登録完了`);
        }
    }
    
    /**
     * キャラクター要素判定
     * @private
     */
    _isCharacterElement(element) {
        // Canvas要素のみを対象
        if (element.tagName.toLowerCase() !== 'canvas') return false;
        
        // 非表示要素は除外
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        
        // サイズが極小の要素は除外
        const rect = element.getBoundingClientRect();
        if (rect.width < 10 || rect.height < 10) return false;
        
        return true;
    }
    
    /**
     * UUID生成（キャラクター識別用）
     * @private
     */
    _generateCharacterUUID(element, selector, index) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const elementId = element.id || 'unknown';
        const selectorHash = this._simpleHash(selector);
        
        return `char_${elementId}_${selectorHash}_${index}_${timestamp}_${random}`;
    }
    
    /**
     * 簡単なハッシュ生成
     * @private
     */
    _simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32bit整数に変換
        }
        return Math.abs(hash).toString(36);
    }
    
    /**
     * 要素の位置情報取得
     * @private
     */
    _getElementPosition(element) {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return {
            computed: {
                left: style.left,
                top: style.top,
                position: style.position
            },
            rect: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
            }
        };
    }
    
    /**
     * 要素のスケール情報取得
     * @private
     */
    _getElementScale(element) {
        const style = getComputedStyle(element);
        const transform = style.transform;
        
        // transform: scale(x, y) から値を抽出
        const scaleMatch = transform.match(/scale\(([^,)]+)(?:,\s*([^)]+))?\)/);
        
        if (scaleMatch) {
            return {
                x: parseFloat(scaleMatch[1]) || 1,
                y: parseFloat(scaleMatch[2] || scaleMatch[1]) || 1,
                transform: transform
            };
        }
        
        return {
            x: 1,
            y: 1,
            transform: transform
        };
    }
    
    /**
     * ストレージシステム初期化
     * @private
     */
    async _initializeStorage() {
        try {
            await this.localStorage.initialize();
            
            // 既存データのマイグレーション
            const migrationResult = await this.localStorage.migrateExistingData();
            
            console.log('✅ ストレージシステム初期化完了', migrationResult);
        } catch (error) {
            console.error('❌ ストレージシステム初期化失敗:', error);
            throw error;
        }
    }
    
    /**
     * UI システム有効化
     * @private
     */
    async _initializeUI() {
        // UI要素の作成・有効化
        this._createControlPanel();
        this._enableCharacterSelection();
        this._bindEventHandlers();
        
        console.log('✅ UI システム有効化完了');
    }
    
    /**
     * 制御パネル作成
     * @private
     */
    _createControlPanel() {
        // 既存の全ての編集パネルを削除
        const existingPanels = document.querySelectorAll('#spine-edit-control-panel, [id*="edit-control"], [id*="spine-control"]');
        existingPanels.forEach(panel => {
            console.log('🗑️ 既存パネル削除:', panel.id);
            panel.remove();
        });
        
        // 重複作成防止フラグ
        if (window._spineControlPanelCreating) {
            console.log('⚠️ パネル作成中 - 重複作成をスキップ');
            return;
        }
        window._spineControlPanelCreating = true;
        
        const panel = document.createElement('div');
        panel.id = 'spine-edit-control-panel';
        panel.innerHTML = `
            <div class="control-header">
                <h3>🎯 Spine編集システム v2.0</h3>
                <div class="system-status">
                    <span class="status-indicator ${this.initialized ? 'ready' : 'initializing'}"></span>
                    ${this.initialized ? '準備完了' : '初期化中...'}
                </div>
            </div>
            <div class="character-section">
                <h4>キャラクター選択</h4>
                <div id="character-list"></div>
            </div>
            <div class="actions-section">
                <button id="start-character-edit" ${this.initialized ? '' : 'disabled'}>編集開始</button>
                <button id="save-positions">位置保存</button>
                <button id="export-css">📋 CSS出力</button>
                <button id="reset-positions">リセット</button>
            </div>
        `;
        
        // スタイリング
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        
        document.body.appendChild(panel);
        
        // 作成完了フラグ解除
        setTimeout(() => {
            window._spineControlPanelCreating = false;
        }, 100);
        
        // キャラクターリスト更新
        this._updateCharacterList();
    }
    
    /**
     * キャラクターリスト更新
     * @private
     */
    _updateCharacterList() {
        const listContainer = document.getElementById('character-list');
        if (!listContainer) return;
        
        listContainer.innerHTML = '';
        
        this.characters.forEach((characterInfo, uuid) => {
            const item = document.createElement('div');
            item.className = 'character-item';
            item.innerHTML = `
                <input type="radio" name="character-select" value="${uuid}" id="char_${uuid}">
                <label for="char_${uuid}">
                    <strong>${characterInfo.originalId || 'Unknown'}</strong><br>
                    <small>UUID: ${uuid.substring(0, 12)}...</small>
                </label>
            `;
            
            item.style.cssText = `
                margin: 8px 0;
                padding: 8px;
                border: 1px solid #eee;
                border-radius: 4px;
                cursor: pointer;
            `;
            
            item.addEventListener('click', () => {
                const radio = item.querySelector('input[type="radio"]');
                radio.checked = true;
                this._selectCharacter(uuid);
            });
            
            listContainer.appendChild(item);
        });
    }
    
    /**
     * キャラクター選択処理
     * @private
     */
    _selectCharacter(uuid) {
        const characterInfo = this.characters.get(uuid);
        if (!characterInfo) {
            console.error('❌ 指定されたキャラクターが見つかりません:', uuid);
            return;
        }
        
        console.log('🎯 キャラクター選択:', uuid, characterInfo);
        
        // UI更新
        const editButton = document.getElementById('start-character-edit');
        if (editButton && this.initialized) {
            editButton.disabled = false;
            editButton.textContent = `${characterInfo.originalId} を編集`;
        }
    }
    
    /**
     * キャラクター選択UI有効化
     * @private
     */
    _enableCharacterSelection() {
        // 既に _createControlPanel() で実装済み
        console.log('✅ キャラクター選択UI有効化完了');
    }
    
    /**
     * イベントハンドラー結合
     * @private
     */
    _bindEventHandlers() {
        // 編集開始ボタン
        document.getElementById('start-character-edit')?.addEventListener('click', () => {
            this._handleStartEdit();
        });
        
        // 位置保存ボタン
        document.getElementById('save-positions')?.addEventListener('click', () => {
            this._handleSavePositions();
        });
        
        // CSS出力ボタン
        document.getElementById('export-css')?.addEventListener('click', () => {
            this._handleExportCSS();
        });
        
        // リセットボタン
        document.getElementById('reset-positions')?.addEventListener('click', () => {
            this._handleResetPositions();
        });
        
        console.log('✅ イベントハンドラー結合完了');
    }
    
    /**
     * 編集開始処理
     * @private
     */
    _handleStartEdit() {
        const selectedUUID = document.querySelector('input[name="character-select"]:checked')?.value;
        
        if (!selectedUUID) {
            alert('キャラクターを選択してください');
            return;
        }
        
        const characterInfo = this.characters.get(selectedUUID);
        if (!characterInfo) {
            console.error('❌ 選択されたキャラクター情報が見つかりません:', selectedUUID);
            return;
        }
        
        console.log('🚀 編集開始:', selectedUUID, characterInfo);
        
        // TODO: 実際の編集モード開始処理を実装
        alert(`編集開始: ${characterInfo.originalId}\nUUID: ${selectedUUID}`);
    }
    
    /**
     * 位置保存処理
     * @private
     */
    _handleSavePositions() {
        this.localStorage.saveAllCharacterPositions(this.characters)
            .then(() => {
                console.log('✅ 位置情報保存完了');
                alert('位置情報を保存しました');
            })
            .catch((error) => {
                console.error('❌ 位置情報保存失敗:', error);
                alert('位置情報の保存に失敗しました');
            });
    }
    
    /**
     * CSS出力処理
     * @private
     */
    _handleExportCSS() {
        // TODO: CSS出力機能を実装
        console.log('📋 CSS出力機能 - 実装予定');
        alert('CSS出力機能は今後実装予定です');
    }
    
    /**
     * 位置リセット処理
     * @private
     */
    _handleResetPositions() {
        if (confirm('すべてのキャラクターの位置情報をリセットしますか？')) {
            this.localStorage.resetAllPositions()
                .then(() => {
                    console.log('✅ 位置情報リセット完了');
                    alert('位置情報をリセットしました');
                    location.reload(); // ページを再読み込み
                })
                .catch((error) => {
                    console.error('❌ 位置情報リセット失敗:', error);
                    alert('位置情報のリセットに失敗しました');
                });
        }
    }
    
    /**
     * 初期化完了イベント発火
     * @private
     */
    _emitInitializationComplete() {
        const event = new CustomEvent('spineEditControllerReady', {
            detail: {
                controller: this,
                characters: this.characters,
                initialized: this.initialized
            }
        });
        
        window.dispatchEvent(event);
        console.log('📡 spineEditControllerReady イベント発火完了');
    }
    
    /**
     * 初期化失敗処理
     * @private
     */
    async _handleInitializationFailure(error) {
        console.error('🚨 SpineEditController 初期化失敗 - フォールバック開始:', error);
        
        // 緊急フォールバック: 最小限のシステムを構築
        try {
            await this._initializeFallbackSystem();
            console.log('✅ フォールバックシステム初期化完了');
        } catch (fallbackError) {
            console.error('❌ フォールバックシステムも失敗:', fallbackError);
        }
    }
    
    /**
     * フォールバックシステム初期化
     * @private
     */
    async _initializeFallbackSystem() {
        // 最小限のUI作成
        const errorPanel = document.createElement('div');
        errorPanel.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ffebee;
                border: 1px solid #e57373;
                border-radius: 8px;
                padding: 16px;
                color: #d32f2f;
                max-width: 300px;
                z-index: 10001;
            ">
                <h4>🚨 システム初期化エラー</h4>
                <p>Spine編集システムの初期化に失敗しました。</p>
                <button onclick="location.reload()">ページを再読み込み</button>
            </div>
        `;
        
        document.body.appendChild(errorPanel);
        
        // 5秒後に自動削除
        setTimeout(() => {
            errorPanel.remove();
        }, 5000);
    }
    
    /**
     * キャラクター情報取得（外部API）
     * @param {string} uuid キャラクターUUID
     * @returns {Object|null} キャラクター情報
     */
    getCharacter(uuid) {
        return this.characters.get(uuid) || null;
    }
    
    /**
     * 全キャラクター情報取得（外部API）
     * @returns {Map} 全キャラクター情報
     */
    getAllCharacters() {
        return new Map(this.characters);
    }
    
    /**
     * 初期化状態確認（外部API）
     * @returns {boolean} 初期化完了状態
     */
    isInitialized() {
        return this.initialized;
    }
    
    /**
     * システム情報取得（外部API）
     * @returns {Object} システム情報
     */
    getSystemInfo() {
        return {
            version: this.version,
            initialized: this.initialized,
            characterCount: this.characters.size,
            initStates: { ...this.initStates },
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * SpineEditStorage - 複数キャラクター対応localStorage
 */
class SpineEditStorage {
    constructor() {
        this.storageKey = 'spine-edit-v2-data';
        this.legacyKeys = [
            'spine-positioning-state',
            'spine-positions',
            'purattokun-positions'
        ];
        this.initialized = false;
    }
    
    /**
     * ストレージシステム初期化
     */
    async initialize() {
        try {
            // localStorage利用可能性確認
            if (!this._isLocalStorageAvailable()) {
                throw new Error('localStorage is not available');
            }
            
            // 既存データ構造確認
            const existingData = this._loadRawData();
            console.log('📦 既存ストレージデータ確認:', existingData);
            
            this.initialized = true;
            console.log('✅ SpineEditStorage 初期化完了');
        } catch (error) {
            console.error('❌ SpineEditStorage 初期化失敗:', error);
            throw error;
        }
    }
    
    /**
     * localStorage利用可能性確認
     * @private
     */
    _isLocalStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * 生データ読み込み
     * @private
     */
    _loadRawData() {
        const data = localStorage.getItem(this.storageKey);
        if (!data) return null;
        
        try {
            return JSON.parse(data);
        } catch (error) {
            console.error('❌ ストレージデータ解析失敗:', error);
            return null;
        }
    }
    
    /**
     * 既存データのマイグレーション
     */
    async migrateExistingData() {
        const migrationResults = {
            migrated: false,
            legacyDataFound: false,
            errors: []
        };
        
        try {
            // レガシーデータ確認
            for (const legacyKey of this.legacyKeys) {
                const legacyData = localStorage.getItem(legacyKey);
                
                if (legacyData) {
                    migrationResults.legacyDataFound = true;
                    console.log(`📦 レガシーデータ発見: ${legacyKey}`, legacyData);
                    
                    try {
                        // レガシーデータを新形式に変換
                        const parsedData = JSON.parse(legacyData);
                        await this._convertLegacyData(parsedData, legacyKey);
                        
                        migrationResults.migrated = true;
                        console.log(`✅ ${legacyKey} のマイグレーション完了`);
                    } catch (error) {
                        migrationResults.errors.push(`${legacyKey}: ${error.message}`);
                        console.error(`❌ ${legacyKey} マイグレーション失敗:`, error);
                    }
                }
            }
            
            console.log('✅ データマイグレーション処理完了:', migrationResults);
            return migrationResults;
        } catch (error) {
            console.error('❌ データマイグレーション失敗:', error);
            migrationResults.errors.push(`Migration process: ${error.message}`);
            return migrationResults;
        }
    }
    
    /**
     * レガシーデータを新形式に変換
     * @private
     */
    async _convertLegacyData(legacyData, sourceKey) {
        const newFormatData = {
            version: '2.0.0',
            characters: {},
            metadata: {
                migratedFrom: sourceKey,
                migratedAt: new Date().toISOString(),
                originalData: legacyData
            }
        };
        
        // レガシーデータの構造に応じて変換処理
        if (legacyData.characters) {
            // v1形式のcharacters構造
            Object.entries(legacyData.characters).forEach(([key, data]) => {
                newFormatData.characters[`legacy_${key}`] = {
                    uuid: `legacy_${key}_${Date.now()}`,
                    position: data.position || {},
                    scale: data.scale || {},
                    migratedFrom: sourceKey
                };
            });
        } else if (legacyData.selectedCharacter || legacyData.position) {
            // 単一キャラクター形式
            newFormatData.characters['legacy_single'] = {
                uuid: `legacy_single_${Date.now()}`,
                position: legacyData.position || {},
                scale: legacyData.scale || {},
                selectedCharacter: legacyData.selectedCharacter,
                migratedFrom: sourceKey
            };
        }
        
        // 新形式で保存
        await this._saveData(newFormatData);
        console.log('✅ レガシーデータ変換・保存完了:', newFormatData);
    }
    
    /**
     * データ保存
     * @private
     */
    async _saveData(data) {
        try {
            const jsonString = JSON.stringify(data, null, 2);
            localStorage.setItem(this.storageKey, jsonString);
            console.log('✅ データ保存完了:', this.storageKey);
        } catch (error) {
            console.error('❌ データ保存失敗:', error);
            throw error;
        }
    }
    
    /**
     * 全キャラクター位置保存
     * @param {Map} characters キャラクター情報マップ
     */
    async saveAllCharacterPositions(characters) {
        try {
            const existingData = this._loadRawData() || {
                version: '2.0.0',
                characters: {},
                metadata: {}
            };
            
            // 現在の位置情報を更新
            characters.forEach((characterInfo, uuid) => {
                existingData.characters[uuid] = {
                    uuid: uuid,
                    position: this._getCurrentPosition(characterInfo.element),
                    scale: this._getCurrentScale(characterInfo.element),
                    updatedAt: new Date().toISOString(),
                    originalId: characterInfo.originalId
                };
            });
            
            existingData.metadata.lastSaved = new Date().toISOString();
            
            await this._saveData(existingData);
            console.log('✅ 全キャラクター位置保存完了');
        } catch (error) {
            console.error('❌ 全キャラクター位置保存失敗:', error);
            throw error;
        }
    }
    
    /**
     * 現在の位置情報取得
     * @private
     */
    _getCurrentPosition(element) {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return {
            computed: {
                left: style.left,
                top: style.top,
                position: style.position
            },
            rect: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
            },
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * 現在のスケール情報取得
     * @private
     */
    _getCurrentScale(element) {
        const style = getComputedStyle(element);
        const transform = style.transform;
        
        // transform: scale(x, y) から値を抽出
        const scaleMatch = transform.match(/scale\(([^,)]+)(?:,\s*([^)]+))?\)/);
        
        if (scaleMatch) {
            return {
                x: parseFloat(scaleMatch[1]) || 1,
                y: parseFloat(scaleMatch[2] || scaleMatch[1]) || 1,
                transform: transform,
                timestamp: new Date().toISOString()
            };
        }
        
        return {
            x: 1,
            y: 1,
            transform: transform,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * 全位置情報リセット
     */
    async resetAllPositions() {
        try {
            localStorage.removeItem(this.storageKey);
            
            // レガシーキーも削除
            this.legacyKeys.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log('✅ 全位置情報リセット完了');
        } catch (error) {
            console.error('❌ 全位置情報リセット失敗:', error);
            throw error;
        }
    }
}

/**
 * グローバル初期化関数
 */
window.spineEditController = null;

/**
 * システム初期化実行
 */
async function initializeSpineEditSystem() {
    try {
        console.log('🏗️ SpineEditSystem グローバル初期化開始');
        
        // SpineEditController インスタンス作成
        window.spineEditController = new SpineEditController();
        
        // システム全体の初期化実行
        const initSuccess = await window.spineEditController.initialize();
        
        if (initSuccess) {
            console.log('🎉 SpineEditSystem グローバル初期化完了');
            
            // デバッグ用グローバル関数追加
            window.getSpineEditSystemInfo = () => {
                return window.spineEditController.getSystemInfo();
            };
            
            console.log('🔧 デバッグ関数追加完了: window.getSpineEditSystemInfo()');
        } else {
            console.warn('⚠️ SpineEditSystem 初期化が部分的に失敗しましたが、継続します');
        }
        
    } catch (error) {
        console.error('❌ SpineEditSystem グローバル初期化失敗:', error);
    }
}

// DOM準備完了後に自動初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSpineEditSystem);
} else {
    // すでにDOMが読み込み済みの場合は即座に実行
    initializeSpineEditSystem();
}

console.log('✅ SpineEditController モジュール読み込み完了 - 初期化待機中...');
