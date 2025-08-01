// 🔗 保存機能強化システム - 既存システム統合例
// SpinePositioningV2とenhanced-save-systemの連携サンプル

console.log('🔗 保存機能強化システム統合例読み込み');

// ========== 既存システムとの統合例 ========== //

/**
 * SpinePositioningV2システムとEnhanced Save Systemの統合例
 * 既存システムを壊すことなく、保存機能を強化する
 */
class EnhancedSaveIntegration {
    constructor() {
        this.spineSystem = null;
        this.saveSystem = null;
        this.initialized = false;
        
        console.log('🔧 統合システム初期化中...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // 既存システムの初期化を待つ
            await this.waitForExistingSystems();
            
            // Enhanced Save Systemを初期化
            await this.initializeEnhancedSaveSystem();
            
            // 既存システムとの連携設定
            this.setupIntegration();
            
            this.initialized = true;
            console.log('✅ 統合システム初期化完了');
            
        } catch (error) {
            console.error('❌ 統合システム初期化エラー:', error);
        }
    }
    
    async waitForExistingSystems() {
        console.log('⌛ 既存システムの初期化を待機中...');
        
        // 最大10秒間待機
        const maxWaitTime = 10000;
        const checkInterval = 100;
        let elapsed = 0;
        
        return new Promise((resolve, reject) => {
            const checkSystem = () => {
                // SpinePositioningV2の検出
                if (typeof window.spinePositioningV2 !== 'undefined' ||
                    typeof window.spinePositioningSystem !== 'undefined') {
                    
                    this.spineSystem = window.spinePositioningV2 || window.spinePositioningSystem;
                    console.log('✅ 既存Spineシステム検出:', this.spineSystem.constructor?.name || 'Unknown');
                    resolve();
                    return;
                }
                
                elapsed += checkInterval;
                if (elapsed >= maxWaitTime) {
                    console.warn('⚠️ 既存システムが見つかりませんでした（スタンドアロンモード）');
                    resolve(); // スタンドアロンでも継続
                } else {
                    setTimeout(checkSystem, checkInterval);
                }
            };
            
            checkSystem();
        });
    }
    
    async initializeEnhancedSaveSystem() {
        console.log('🚀 Enhanced Save System初期化...');
        
        // Enhanced Save Systemが既に読み込まれているか確認
        if (typeof window.initializeEnhancedSaveSystem === 'function') {
            this.saveSystem = window.initializeEnhancedSaveSystem(this.spineSystem);
            console.log('✅ Enhanced Save System初期化完了');
        } else {
            throw new Error('Enhanced Save Systemが読み込まれていません');
        }
    }
    
    setupIntegration() {
        console.log('🔗 システム間連携設定...');
        
        // 既存システムのイベントにフック
        this.hookExistingSystemEvents();
        
        // 保存システムのイベントリスナー設定
        this.setupSaveSystemListeners();
        
        // 既存システムの拡張
        this.extendExistingSystem();
        
        console.log('✅ システム間連携設定完了');
    }
    
    hookExistingSystemEvents() {
        if (!this.spineSystem) return;
        
        // 既存システムの保存関数をラップ
        this.wrapExistingSaveFunctions();
        
        // DOMイベントの監視
        this.setupDOMEventListeners();
    }
    
    wrapExistingSaveFunctions() {
        // 既存の保存関数をバックアップ
        const originalSaveFunction = window.savePositionV2 || window.savePosition;
        
        if (originalSaveFunction) {
            // 既存の保存関数をラップして強化
            window.savePositionV2 = async (...args) => {
                console.log('🔄 既存保存関数呼び出し検出');
                
                // 既存の保存処理を実行
                const result = await originalSaveFunction.apply(this, args);
                
                // Enhanced Save Systemにも保存
                if (this.saveSystem && result) {
                    await this.saveSystem.autoSave();
                }
                
                return result;
            };
            
            console.log('✅ 既存保存関数のラップ完了');
        }
    }
    
    setupDOMEventListeners() {
        // キャラクター操作の監視
        document.addEventListener('mouseup', (e) => {
            // ドラッグ終了時の変更検知
            if (e.target && (e.target.id === 'purattokun-canvas' || 
                           e.target.classList.contains('spine-character'))) {
                this.notifyChange('character-drag-end');
            }
        });
        
        // キーボード操作の監視
        document.addEventListener('keyup', (e) => {
            // 矢印キー操作終了時
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                this.notifyChange('keyboard-move-end');
            }
        });
        
        console.log('✅ DOMイベントリスナー設定完了');
    }
    
    setupSaveSystemListeners() {
        if (!this.saveSystem) return;
        
        // 保存システムの変更リスナーを追加
        this.saveSystem.addChangeListener((source) => {
            console.log(`🔄 変更検出: ${source}`);
            
            // 既存システムに通知
            this.notifyExistingSystem(source);
        });
        
        console.log('✅ 保存システムリスナー設定完了');
    }
    
    extendExistingSystem() {
        // 既存システムに新しい機能を追加
        if (typeof window.spinePositioningV2 !== 'undefined') {
            // v2.0システムの拡張
            window.spinePositioningV2.enhancedSave = this.saveSystem;
            window.spinePositioningV2.manualSave = () => this.saveSystem?.manualSave();
            window.spinePositioningV2.createBackup = () => this.saveSystem?.createBackup();
            
            console.log('✅ SpinePositioningV2システム拡張完了');
        }
        
        // グローバル関数の追加
        this.addGlobalFunctions();
    }
    
    addGlobalFunctions() {
        // 便利なグローバル関数を追加
        window.enhancedManualSave = async () => {
            if (this.saveSystem) {
                return await this.saveSystem.manualSave();
            }
            console.warn('⚠️ Enhanced Save Systemが初期化されていません');
            return false;
        };
        
        window.enhancedCreateBackup = async () => {
            if (this.saveSystem) {
                return await this.saveSystem.createBackup();
            }
            console.warn('⚠️ Enhanced Save Systemが初期化されていません');
            return false;
        };
        
        window.enhancedToggleAutoSave = () => {
            if (this.saveSystem) {
                this.saveSystem.setAutoSaveEnabled(!this.saveSystem.autoSaveEnabled);
                return this.saveSystem.autoSaveEnabled;
            }
            console.warn('⚠️ Enhanced Save Systemが初期化されていません');
            return false;
        };
        
        window.enhancedSaveStatus = () => {
            if (this.saveSystem) {
                return this.saveSystem.getStatus();
            }
            return null;
        };
        
        window.enhancedSaveDiagnose = async () => {
            if (this.saveSystem) {
                return await this.saveSystem.diagnose();
            }
            console.warn('⚠️ Enhanced Save Systemが初期化されていません');
            return null;
        };
        
        console.log('✅ グローバル関数追加完了');
    }
    
    notifyChange(source) {
        if (this.saveSystem) {
            // 保存システムに変更を通知
            this.saveSystem.onChangeDetected(`integration-${source}`);
        }
    }
    
    notifyExistingSystem(source) {
        // 既存システムに変更を通知（必要に応じて）
        if (this.spineSystem && typeof this.spineSystem.onSaveSystemChange === 'function') {
            this.spineSystem.onSaveSystemChange(source);
        }
    }
    
    // ========== デバッグ・診断機能 ========== //
    
    async diagnose() {
        console.log('🔍 === 統合システム診断 ===');
        
        const diagnosis = {
            integration: {
                initialized: this.initialized,
                spineSystemDetected: !!this.spineSystem,
                saveSystemDetected: !!this.saveSystem,
                spineSystemType: this.spineSystem?.constructor?.name || 'Unknown'
            },
            functions: {
                enhancedManualSave: typeof window.enhancedManualSave === 'function',
                enhancedCreateBackup: typeof window.enhancedCreateBackup === 'function',
                enhancedToggleAutoSave: typeof window.enhancedToggleAutoSave === 'function',
                enhancedSaveStatus: typeof window.enhancedSaveStatus === 'function',
                enhancedSaveDiagnose: typeof window.enhancedSaveDiagnose === 'function'
            },
            systems: {
                spinePositioningV2: typeof window.spinePositioningV2 !== 'undefined',
                spinePositioningSystem: typeof window.spinePositioningSystem !== 'undefined',
                enhancedSaveSystem: typeof window.enhancedSaveSystem !== 'undefined'
            }
        };
        
        console.table(diagnosis.integration);
        console.table(diagnosis.functions);
        console.table(diagnosis.systems);
        
        // 個別システムの診断も実行
        if (this.saveSystem && typeof this.saveSystem.diagnose === 'function') {
            console.log('
--- Enhanced Save System 詳細診断 ---');
            await this.saveSystem.diagnose();
        }
        
        console.log('✅ 統合システム診断完了');
        return diagnosis;
    }
    
    getStatus() {
        return {
            initialized: this.initialized,
            spineSystem: !!this.spineSystem,
            saveSystem: !!this.saveSystem,
            saveSystemStatus: this.saveSystem?.getStatus() || null
        };
    }
}

// ========== 使用例・デモンストレーション ========== //

/**
 * 使用例: 統合システムの初期化と利用
 */
function demonstrateEnhancedSaveIntegration() {
    console.log('🎆 === Enhanced Save System 統合デモ ===');
    
    // 1. 統合システムを初期化
    const integration = new EnhancedSaveIntegration();
    
    // 2. 初期化完了を待つ
    setTimeout(async () => {
        if (!integration.initialized) {
            console.warn('⚠️ 統合システムの初期化が完了していません');
            return;
        }
        
        console.log('
--- 使用例デモンストレーション ---');
        
        // 3. 状態確認
        console.log('📊 統合システム状態:', integration.getStatus());
        
        // 4. 手動保存のテスト
        console.log('💾 手動保存テスト...');
        const saveResult = await window.enhancedManualSave();
        console.log('保存結果:', saveResult ? '✅ 成功' : '❌ 失敗');
        
        // 5. バックアップ作成のテスト
        console.log('📦 バックアップ作成テスト...');
        await window.enhancedCreateBackup();
        
        // 6. 自動保存のトグルテスト
        console.log('⚡ 自動保存トグルテスト...');
        const autoSaveStatus = window.enhancedToggleAutoSave();
        console.log('自動保存状態:', autoSaveStatus ? '有効' : '無効');
        
        // 7. 診断情報の表示
        console.log('🔍 診断情報表示...');
        await integration.diagnose();
        
        console.log('✅ デモンストレーション完了');
        
    }, 2000); // 2秒待機
}

// ========== グローバル初期化 ========== //

// グローバルインスタンス
let enhancedSaveIntegration = null;

// 自動初期化（DOM読み込み後）
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                enhancedSaveIntegration = new EnhancedSaveIntegration();
                window.enhancedSaveIntegration = enhancedSaveIntegration;
            }, 1500); // 他のシステムの初期化を待つ
        });
    } else {
        setTimeout(() => {
            enhancedSaveIntegration = new EnhancedSaveIntegration();
            window.enhancedSaveIntegration = enhancedSaveIntegration;
        }, 1500);
    }
}

// デモンストレーション関数をグローバルに公開
window.demonstrateEnhancedSaveIntegration = demonstrateEnhancedSaveIntegration;

console.log('✅ 保存機能強化システヤ統合例読み込み完了');

// ========== エクスポート ========== //

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        EnhancedSaveIntegration, 
        demonstrateEnhancedSaveIntegration 
    };
}