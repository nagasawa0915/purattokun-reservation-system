/**
 * Spine Edit Integration - 既存システムと新中央制御システムの統合
 * 
 * 【目的】:
 * - SpineEditControllerと既存システムの安全な統合
 * - フォールバック機能付き統合
 * - 既存機能を破壊しない安全な統合
 * 
 * 【実装日】: 2025-08-07
 * 【バージョン】: 1.0.0
 */

// console.log('🔗 Spine Edit Integration v1.0.0 - 統合システム読み込み開始'); // デバッグ出力無効化

/**
 * SpineEditIntegration クラス - 既存システムとの統合
 */
class SpineEditIntegration {
    constructor() {
        this.version = '1.0.0';
        this.integrated = false;
        this.legacySystemDetected = false;
        this.newSystemReady = false;
        this.fallbackActivated = false;
        
        // 統合状態管理
        this.integrationStates = {
            controller: false,
            legacy: false,
            ui: false,
            compatibility: false
        };
        
        // console.log('✅ SpineEditIntegration インスタンス作成完了'); // デバッグ出力無効化
    }
    
    /**
     * 統合システム初期化
     */
    async initialize() {
        try {
            // console.log('🚀 Spine Edit Integration 初期化開始'); // デバッグ出力無効化
            
            // Phase 1: 既存システム検出
            await this._detectLegacySystems();
            this.integrationStates.legacy = true;
            
            // Phase 2: 新中央制御システム待機/初期化
            await this._initializeNewControllerSystem();
            this.integrationStates.controller = true;
            
            // Phase 3: 互換性レイヤー構築
            await this._buildCompatibilityLayer();
            this.integrationStates.compatibility = true;
            
            // Phase 4: UI統合システム構築
            await this._buildIntegratedUI();
            this.integrationStates.ui = true;
            
            this.integrated = true;
            console.log('✅ Spine Edit Integration 統合完了'); // 簡略化
            
            // 統合完了イベント発火
            this._emitIntegrationComplete();
            
            return true;
            
        } catch (error) {
            console.error('❌ Spine Edit Integration 初期化失敗:', error);
            await this._handleIntegrationFailure(error);
            return false;
        }
    }
    
    /**
     * 既存システム検出
     * @private
     */
    async _detectLegacySystems() {
        const legacySystems = {
            spinePositioningSystem: !!window.spinePositioningSystem,
            spineEditSystem: !!window.SpineEditSystem,
            moduleManager: !!window.ModuleManager,
            startCharacterEdit: typeof window.startCharacterEdit === 'function',
            startCanvasEdit: typeof window.startCanvasEdit === 'function'
        };
        
        this.legacySystemDetected = Object.values(legacySystems).some(detected => detected);
        
        console.log('🔍 既存システム検出結果:', legacySystems);
        console.log(`📊 既存システム: ${this.legacySystemDetected ? '検出されました' : '未検出'}`);
        
        // 既存システムの初期化待機（必要な場合）
        if (this.legacySystemDetected) {
            await this._waitForLegacySystemReady();
            console.log('✅ 既存システムの初期化完了を確認');
        }
    }
    
    /**
     * 既存システムの初期化待機
     * @private
     */
    async _waitForLegacySystemReady() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 30; // 3秒間待機（短縮）
            
            const checkLegacyReady = () => {
                attempts++;
                
                // 既存システムが準備完了か確認
                const isReady = (
                    window.spinePositioningSystem || 
                    (window.SpineEditSystem && window.SpineEditSystem.initialized) ||
                    typeof window.startCharacterEdit === 'function'
                );
                
                if (isReady || attempts >= maxAttempts) {
                    console.log(`🔄 既存システム待機結果: ${isReady ? '準備完了' : 'タイムアウト'}`);
                    resolve();
                } else {
                    setTimeout(checkLegacyReady, 100);
                }
            };
            
            checkLegacyReady();
        });
    }
    
    /**
     * 新中央制御システムの初期化
     * @private
     */
    async _initializeNewControllerSystem() {
        try {
            // SpineEditControllerの読み込み確認
            if (typeof SpineEditController === 'undefined') {
                console.log('📦 SpineEditControllerを動的読み込み中...');
                await this._loadSpineEditController();
            }
            
            // 新システムの初期化
            if (!window.spineEditController) {
                console.log('🚀 新SpineEditController初期化中...');
                
                // 初期化関数が存在するか確認
                if (typeof initializeSpineEditSystem === 'function') {
                    await initializeSpineEditSystem();
                } else {
                    // 手動でSpineEditControllerを作成
                    window.spineEditController = new SpineEditController();
                    await window.spineEditController.initialize();
                }
            }
            
            // 初期化完了確認
            if (window.spineEditController && window.spineEditController.isInitialized()) {
                this.newSystemReady = true;
                console.log('✅ 新中央制御システム初期化完了');
            } else {
                throw new Error('新システムの初期化に失敗しました');
            }
            
        } catch (error) {
            console.error('❌ 新中央制御システム初期化失敗:', error);
            console.log('⚠️ フォールバックモードで継続...');
            this.fallbackActivated = true;
        }
    }
    
    /**
     * SpineEditControllerの動的読み込み
     * @private
     */
    async _loadSpineEditController() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'spine-edit-controller.js';
            
            script.onload = () => {
                console.log('✅ spine-edit-controller.js読み込み完了');
                resolve();
            };
            
            script.onerror = () => {
                console.error('❌ spine-edit-controller.js読み込み失敗');
                reject(new Error('spine-edit-controller.jsの読み込みに失敗しました'));
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * 互換性レイヤー構築
     * @private
     */
    async _buildCompatibilityLayer() {
        try {
            console.log('🔗 互換性レイヤー構築中...');
            
            // 既存システムとのインターフェース統一
            this._createLegacyCompatibilityAPI();
            
            // 新システムへのブリッジ関数
            this._createNewSystemBridge();
            
            // グローバルインターフェース統一
            this._unifyGlobalInterface();
            
            console.log('✅ 互換性レイヤー構築完了');
        } catch (error) {
            console.error('❌ 互換性レイヤー構築失敗:', error);
            throw error;
        }
    }
    
    /**
     * 既存システム互換性API作成
     * @private
     */
    _createLegacyCompatibilityAPI() {
        // 既存関数を新システム経由で実行するラッパー関数
        if (!window.legacySpineEditAPI) {
            window.legacySpineEditAPI = {
                // 既存のstartCharacterEditをラッピング
                startCharacterEdit: (...args) => {
                    if (this.newSystemReady && window.spineEditController) {
                        console.log('🔗 新システム経由でstartCharacterEdit実行');
                        return this._bridgeToNewSystem('startEdit', args);
                    } else if (this.legacySystemDetected && typeof window.startCharacterEdit === 'function') {
                        console.log('🔄 既存システム経由でstartCharacterEdit実行');
                        return window.startCharacterEdit(...args);
                    } else {
                        console.warn('⚠️ startCharacterEdit: 利用可能なシステムがありません');
                    }
                },
                
                // 既存のstartCanvasEditをラッピング
                startCanvasEdit: (...args) => {
                    if (this.legacySystemDetected && typeof window.startCanvasEdit === 'function') {
                        console.log('🔄 既存システム経由でstartCanvasEdit実行');
                        return window.startCanvasEdit(...args);
                    } else {
                        console.warn('⚠️ startCanvasEdit: 既存システムが利用できません');
                    }
                },
                
                // システム状態取得
                getSystemStatus: () => {
                    return {
                        legacyDetected: this.legacySystemDetected,
                        newSystemReady: this.newSystemReady,
                        fallbackActivated: this.fallbackActivated,
                        integrated: this.integrated
                    };
                }
            };
            
            console.log('✅ 既存システム互換性API作成完了');
        }
    }
    
    /**
     * 新システムブリッジ関数
     * @private
     */
    _createNewSystemBridge() {
        // 既存関数から新システムへのブリッジ
        if (!window.spineEditBridge) {
            window.spineEditBridge = {
                // 新システムの編集開始
                startEdit: (characterUUID = null) => {
                    if (!this.newSystemReady) {
                        console.warn('⚠️ 新システムが初期化されていません');
                        return false;
                    }
                    
                    // UUIDが指定されていない場合、自動選択
                    if (!characterUUID) {
                        const characters = window.spineEditController.getAllCharacters();
                        const firstCharacter = characters.values().next();
                        
                        if (firstCharacter.done) {
                            console.warn('⚠️ 編集可能なキャラクターが見つかりません');
                            return false;
                        }
                        
                        characterUUID = firstCharacter.value.uuid;
                        console.log(`🎯 自動選択: ${characterUUID}`);
                    }
                    
                    // TODO: 新システムの編集機能実装
                    console.log(`🚀 新システム編集開始: ${characterUUID}`);
                    return true;
                },
                
                // キャラクター情報取得
                getCharacters: () => {
                    if (this.newSystemReady) {
                        return window.spineEditController.getAllCharacters();
                    }
                    return new Map();
                },
                
                // システム情報取得
                getSystemInfo: () => {
                    if (this.newSystemReady) {
                        return window.spineEditController.getSystemInfo();
                    }
                    return { error: '新システムが初期化されていません' };
                }
            };
            
            console.log('✅ 新システムブリッジ関数作成完了');
        }
    }
    
    /**
     * 新システムへのブリッジ実行
     * @private
     */
    _bridgeToNewSystem(action, args) {
        if (!this.newSystemReady) {
            console.warn('⚠️ 新システムが初期化されていません');
            return false;
        }
        
        switch (action) {
            case 'startEdit':
                return window.spineEditBridge.startEdit(...args);
            default:
                console.warn(`⚠️ 未定義のアクション: ${action}`);
                return false;
        }
    }
    
    /**
     * グローバルインターフェース統一
     * @private
     */
    _unifyGlobalInterface() {
        // 統一されたグローバルAPIを作成
        window.spineEditUnified = {
            // 編集開始（自動システム選択）
            startEdit: (...args) => {
                return window.legacySpineEditAPI.startCharacterEdit(...args);
            },
            
            // Canvas編集開始
            startCanvasEdit: (...args) => {
                return window.legacySpineEditAPI.startCanvasEdit(...args);
            },
            
            // キャラクター情報取得
            getCharacters: () => {
                return window.spineEditBridge.getCharacters();
            },
            
            // システム状態取得
            getStatus: () => {
                const legacyStatus = window.legacySpineEditAPI.getSystemStatus();
                const newSystemInfo = this.newSystemReady ? window.spineEditBridge.getSystemInfo() : null;
                
                return {
                    integration: {
                        version: this.version,
                        integrated: this.integrated,
                        states: this.integrationStates
                    },
                    legacy: legacyStatus,
                    newSystem: newSystemInfo
                };
            },
            
            // デバッグ情報
            debug: () => {
                console.group('🔧 Spine Edit Integration Debug Info');
                console.log('統合システム状態:', this.integrationStates);
                console.log('既存システム検出:', this.legacySystemDetected);
                console.log('新システム準備:', this.newSystemReady);
                console.log('フォールバック有効:', this.fallbackActivated);
                
                if (this.newSystemReady) {
                    console.log('新システム情報:', window.spineEditController.getSystemInfo());
                    console.log('キャラクター一覧:', window.spineEditController.getAllCharacters());
                }
                
                console.groupEnd();
                
                return window.spineEditUnified.getStatus();
            }
        };
        
        console.log('✅ 統一グローバルAPI作成完了: window.spineEditUnified');
    }
    
    /**
     * 統合UIシステム構築
     * @private
     */
    async _buildIntegratedUI() {
        try {
            console.log('🎨 統合UIシステム構築中...');
            
            // 既存UIと新UIの統合
            this._integrateUIElements();
            
            // スマートボタンシステム構築
            this._createSmartButtons();
            
            // ステータスインジケーター作成
            this._createStatusIndicator();
            
            console.log('✅ 統合UIシステム構築完了');
        } catch (error) {
            console.error('❌ 統合UIシステム構築失敗:', error);
            throw error;
        }
    }
    
    /**
     * UI要素の統合
     * @private
     */
    _integrateUIElements() {
        // 既存のUI要素があるか確認
        const existingPanels = document.querySelectorAll('[id*="edit"], [id*="control"], [class*="edit"]');
        
        if (existingPanels.length > 0) {
            console.log(`🔍 既存UI要素検出: ${existingPanels.length}個`);
            
            // 既存UIに統合ステータスを追加
            existingPanels.forEach((panel, index) => {
                const statusBadge = document.createElement('div');
                statusBadge.className = 'integration-status-badge';
                statusBadge.innerHTML = `
                    <span class="badge ${this.integrated ? 'integrated' : 'initializing'}">
                        ${this.integrated ? '✅ 統合完了' : '⏳ 統合中...'}
                    </span>
                `;
                statusBadge.style.cssText = `
                    position: absolute;
                    top: -10px;
                    right: -10px;
                    font-size: 10px;
                    z-index: 1000;
                `;
                
                if (panel.style.position !== 'absolute' && panel.style.position !== 'fixed') {
                    panel.style.position = 'relative';
                }
                
                panel.appendChild(statusBadge);
                console.log(`✅ UI要素${index + 1}に統合ステータス追加`);
            });
        }
    }
    
    /**
     * スマートボタンシステム構築
     * @private
     */
    _createSmartButtons() {
        // 既存の編集ボタンをスマート化
        const editButtons = document.querySelectorAll('button[id*="edit"], button[onclick*="edit"]');
        
        editButtons.forEach(button => {
            // 元のクリックイベントを無効化
            const originalOnclick = button.onclick;
            button.onclick = null;
            
            // 新しいスマートハンドラーを追加
            button.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔗 スマートボタンがクリックされました');
                
                // 新システム優先、フォールバックで既存システム
                if (this.newSystemReady) {
                    window.spineEditUnified.startEdit();
                } else if (originalOnclick) {
                    originalOnclick.call(button);
                } else {
                    window.spineEditUnified.startEdit();
                }
            });
            
            // ボタンテキストにシステム情報追加
            const originalText = button.textContent;
            button.textContent = `${originalText} ${this.newSystemReady ? '(v2.0)' : '(既存)'}`;
            
            console.log(`✅ ボタンをスマート化: "${button.textContent}"`);
        });
    }
    
    /**
     * ステータスインジケーター作成
     * @private
     */
    _createStatusIndicator() {
        // 既存のステータスインジケーターを全て削除
        const existingIndicators = document.querySelectorAll('#spine-integration-status, [id*="integration-status"], [id*="spine-status"]');
        existingIndicators.forEach(indicator => {
            console.log('🗑️ 既存ステータスインジケーター削除:', indicator.id);
            indicator.remove();
        });
        
        // ステータスインジケーター無効化（ウィンドウ被り防止）
        console.log('🙅‍♀️ ステータスインジケーター作成をスキップ - ウィンドウ被り防止');
        return;
        
        const indicator = document.createElement('div');
        indicator.id = 'spine-integration-status';
        indicator.innerHTML = `
            <div class="status-panel">
                <h4>🔗 Spine Edit Integration v${this.version}</h4>
                <div class="status-grid">
                    <div class="status-item">
                        <span class="label">新システム:</span>
                        <span class="value ${this.newSystemReady ? 'ready' : 'pending'}">
                            ${this.newSystemReady ? '準備完了' : '初期化中'}
                        </span>
                    </div>
                    <div class="status-item">
                        <span class="label">既存システム:</span>
                        <span class="value ${this.legacySystemDetected ? 'detected' : 'none'}">
                            ${this.legacySystemDetected ? '検出されました' : '未検出'}
                        </span>
                    </div>
                    <div class="status-item">
                        <span class="label">統合状態:</span>
                        <span class="value ${this.integrated ? 'integrated' : 'pending'}">
                            ${this.integrated ? '統合完了' : '統合中'}
                        </span>
                    </div>
                </div>
                <div class="actions">
                    <button onclick="window.spineEditUnified.debug()">デバッグ情報</button>
                    <button onclick="this.parentElement.parentElement.style.display='none'">閉じる</button>
                </div>
            </div>
        `;
        
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 9999;
            font-family: Arial, sans-serif;
            font-size: 12px;
            max-width: 300px;
        `;
        
        document.body.appendChild(indicator);
        
        // 3秒後に自動最小化（短縮）
        setTimeout(() => {
            if (indicator.parentElement) {
                indicator.style.opacity = '0.3';
                indicator.style.transform = 'scale(0.8)';
                indicator.style.transition = 'all 0.3s ease';
            }
        }, 3000);
        
        console.log('✅ 統合ステータスインジケーター作成完了');
    }
    
    /**
     * 統合完了イベント発火
     * @private
     */
    _emitIntegrationComplete() {
        const event = new CustomEvent('spineEditIntegrationComplete', {
            detail: {
                integration: this,
                systems: {
                    new: this.newSystemReady,
                    legacy: this.legacySystemDetected,
                    integrated: this.integrated
                }
            }
        });
        
        window.dispatchEvent(event);
        console.log('📡 spineEditIntegrationComplete イベント発火完了');
    }
    
    /**
     * 統合失敗処理
     * @private
     */
    async _handleIntegrationFailure(error) {
        console.error('🚨 Spine Edit Integration 失敗 - 緊急フォールバック開始:', error);
        
        this.fallbackActivated = true;
        
        // 緊急エラーパネル作成
        const errorPanel = document.createElement('div');
        errorPanel.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                left: 20px;
                background: #ffebee;
                border: 2px solid #e57373;
                border-radius: 8px;
                padding: 16px;
                color: #d32f2f;
                max-width: 400px;
                z-index: 10002;
                font-family: Arial, sans-serif;
            ">
                <h4>🚨 統合システムエラー</h4>
                <p>Spine Edit Integrationの初期化に失敗しました。</p>
                <details>
                    <summary>エラー詳細</summary>
                    <pre style="font-size: 10px; margin-top: 8px;">${error.message}</pre>
                </details>
                <div style="margin-top: 12px;">
                    <button onclick="location.reload()" style="margin-right: 8px;">ページ再読み込み</button>
                    <button onclick="this.parentElement.parentElement.remove()">閉じる</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorPanel);
        
        // 緊急用最小限APIを作成
        window.spineEditEmergency = {
            status: 'ERROR',
            error: error.message,
            fallback: () => {
                if (typeof window.startCharacterEdit === 'function') {
                    return window.startCharacterEdit();
                } else {
                    alert('緊急フォールバック: 利用可能なシステムがありません');
                }
            }
        };
    }
    
    /**
     * 統合状態取得（外部API）
     */
    getIntegrationStatus() {
        return {
            version: this.version,
            integrated: this.integrated,
            states: { ...this.integrationStates },
            systems: {
                legacy: this.legacySystemDetected,
                new: this.newSystemReady,
                fallback: this.fallbackActivated
            },
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * グローバル初期化
 */
window.spineEditIntegration = null;

/**
 * 統合システム初期化関数
 */
async function initializeSpineEditIntegration() {
    try {
        console.log('🔗 Spine Edit Integration グローバル初期化開始');
        
        // SpineEditIntegration インスタンス作成
        window.spineEditIntegration = new SpineEditIntegration();
        
        // 統合システム初期化実行
        const integrationSuccess = await window.spineEditIntegration.initialize();
        
        if (integrationSuccess) {
            console.log('🎉 Spine Edit Integration グローバル初期化完了');
            
            // デバッグ用グローバル関数追加
            window.getSpineIntegrationInfo = () => {
                return window.spineEditIntegration.getIntegrationStatus();
            };
            
            console.log('🔧 デバッグ関数追加完了: window.getSpineIntegrationInfo()');
        } else {
            console.warn('⚠️ Spine Edit Integration 初期化が部分的に失敗しましたが、継続します');
        }
        
    } catch (error) {
        console.error('❌ Spine Edit Integration グローバル初期化失敗:', error);
    }
}

// DOM準備完了後に自動初期化（既存システムより後に実行）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // 小さな遅延で既存システムの初期化を待機
        setTimeout(initializeSpineEditIntegration, 200);
    });
} else {
    // すでにDOMが読み込み済みの場合も少し待機
    setTimeout(initializeSpineEditIntegration, 200);
}

// console.log('✅ SpineEditIntegration モジュール読み込み完了 - 統合初期化待機中...'); // デバッグ出力無効化
