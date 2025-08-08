// 🎬 タイムライン制御システム - データ管理・永続化モジュール
// 役割: localStorage統合・3段階フォールバック・データ永続化
// Phase 1: 基本データ管理・品質保証実装
// 制約: 250行以内

console.log('💾 Timeline Data Manager モジュール読み込み開始');

// ========== データ管理・永続化システム ========== //

/**
 * タイムライン永続化ストレージクラス
 * 仕様: 3段階フォールバック（localStorage→設定ファイル→デフォルト）
 */
class TimelinePersistentStorage {
    constructor() {
        this.version = '3.0';
        this.storageKey = 'spine-timeline-state-v3';
        
        // 既存システム互換性キー
        this.compatibilityKeys = {
            positioning: 'spine-positioning-state',      // 編集システム
            boundingBox: 'spine-bounding-box-state',     // 境界ボックス設定
            characters: 'spine-character-manager-state'   // キャラクター管理
        };
        
        // デフォルトタイムライン設定
        this.defaultSettings = this.getDefaultTimelineSettings();
        
        console.log('✅ Timeline Persistent Storage 初期化完了');
    }
    
    /**
     * 3段階フォールバック読み込み
     * Phase 1: localStorage→設定ファイル→デフォルト値の順で取得
     */
    loadTimelineState() {
        console.log('📂 タイムライン状態の3段階フォールバック読み込み開始');
        
        try {
            // 1. 統合v3.0データから読み込み
            const v3Data = localStorage.getItem(this.storageKey);
            if (v3Data) {
                const parsed = JSON.parse(v3Data);
                console.log('✅ v3.0統合データから読み込み成功');
                return this.validateAndMigrateData(parsed);
            }
            
            // 2. 既存システムデータから構築
            console.log('🔄 既存システムデータから構築を試行');
            const legacyData = this.buildFromLegacySystems();
            if (legacyData) {
                console.log('✅ 既存システムデータから構築成功');
                // 統合データとして保存
                this.saveTimelineState(legacyData.timeline || {});
                return legacyData;
            }
            
            // 3. デフォルト設定で安全実行
            console.log('💡 デフォルト設定で初期化');
            return this.defaultSettings;
            
        } catch (error) {
            console.error('❌ タイムライン状態読み込みエラー:', error);
            console.log('🛡️ デフォルト設定にフォールバック');
            return this.defaultSettings;
        }
    }
    
    /**
     * 統合データ保存
     * 既存システムとの互換性を保ちつつタイムライン設定を統合保存
     */
    saveTimelineState(timelineData, options = {}) {
        console.log('💾 タイムライン状態の統合保存開始');
        
        try {
            // 既存データを読み込み（他システムの設定を保護）
            const existingPositioning = this.loadExistingData(this.compatibilityKeys.positioning);
            const existingBoundingBox = this.loadExistingData(this.compatibilityKeys.boundingBox);
            const existingCharacters = this.loadExistingData(this.compatibilityKeys.characters);
            
            // 統合データ構造を作成
            const unifiedState = {
                version: this.version,
                timestamp: Date.now(),
                timeline: timelineData,
                
                // 既存システム互換性保証
                positioning: existingPositioning,
                boundingBox: existingBoundingBox,
                characters: existingCharacters,
                
                // メタデータ
                metadata: {
                    lastModified: new Date().toISOString(),
                    modifiedBy: 'timeline-system',
                    saveOptions: options
                }
            };
            
            // 統合データを保存
            localStorage.setItem(this.storageKey, JSON.stringify(unifiedState));
            console.log('✅ 統合タイムライン状態保存完了');
            
            // 個別システム互換性のための重複保存
            if (options.maintainCompatibility !== false) {
                this.maintainSystemCompatibility(unifiedState);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ タイムライン状態保存エラー:', error);
            return false;
        }
    }
    
    /**
     * 既存システムデータから統合データ構築
     * localStorage v3.0システムとの統合処理
     */
    buildFromLegacySystems() {
        console.log('🔧 既存システムから統合データ構築開始');
        
        try {
            const legacyData = {
                version: this.version,
                timeline: {},
                positioning: this.loadExistingData(this.compatibilityKeys.positioning),
                boundingBox: this.loadExistingData(this.compatibilityKeys.boundingBox),
                characters: this.loadExistingData(this.compatibilityKeys.characters),
                metadata: {
                    migrated: true,
                    migratedFrom: 'legacy-systems',
                    migrationDate: new Date().toISOString()
                }
            };
            
            // 有効なデータがあるかチェック
            const hasValidData = legacyData.positioning || legacyData.boundingBox || legacyData.characters;
            
            return hasValidData ? legacyData : null;
            
        } catch (error) {
            console.error('❌ 既存システムデータ構築エラー:', error);
            return null;
        }
    }
    
    /**
     * 既存データ読み込みヘルパー
     */
    loadExistingData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn(`⚠️ ${key} データ読み込み失敗:`, error);
            return null;
        }
    }
    
    /**
     * システム互換性維持
     * 各システムが独立して動作できるよう個別保存も維持
     */
    maintainSystemCompatibility(unifiedState) {
        try {
            // 編集システム互換性
            if (unifiedState.positioning) {
                localStorage.setItem(this.compatibilityKeys.positioning, 
                                   JSON.stringify(unifiedState.positioning));
            }
            
            // 境界ボックス互換性
            if (unifiedState.boundingBox) {
                localStorage.setItem(this.compatibilityKeys.boundingBox, 
                                   JSON.stringify(unifiedState.boundingBox));
            }
            
            // キャラクター管理互換性
            if (unifiedState.characters) {
                localStorage.setItem(this.compatibilityKeys.characters, 
                                   JSON.stringify(unifiedState.characters));
            }
            
            console.log('✅ システム互換性維持保存完了');
            
        } catch (error) {
            console.warn('⚠️ システム互換性維持に失敗:', error);
            // 非致命的エラーなので続行
        }
    }
    
    /**
     * データ検証・マイグレーション
     */
    validateAndMigrateData(data) {
        if (!data || typeof data !== 'object') {
            return this.defaultSettings;
        }
        
        // バージョン互換性チェック
        if (data.version !== this.version) {
            console.log(`🔄 データバージョン変換: ${data.version} → ${this.version}`);
            data = this.migrateDataVersion(data);
        }
        
        // 必須フィールドの補完
        data.timeline = data.timeline || {};
        data.metadata = data.metadata || {};
        
        return data;
    }
    
    /**
     * バージョン間データマイグレーション
     */
    migrateDataVersion(data) {
        const migrated = {
            version: this.version,
            timeline: data.timeline || {},
            positioning: data.positioning || null,
            boundingBox: data.boundingBox || null,
            characters: data.characters || null,
            metadata: {
                ...data.metadata,
                migrated: true,
                originalVersion: data.version,
                migrationDate: new Date().toISOString()
            }
        };
        
        console.log('✅ データマイグレーション完了');
        return migrated;
    }
    
    /**
     * デフォルトタイムライン設定
     */
    getDefaultTimelineSettings() {
        return {
            version: this.version,
            timeline: {
                globalSettings: {
                    frameRate: 60,
                    syncTolerance: 16.67, // 1フレーム精度
                    defaultDuration: 1000
                },
                characters: {
                    purattokun: {
                        sequences: [],
                        syncSettings: {
                            syncGroups: [],
                            syncCapabilities: ['movement', 'animation']
                        }
                    },
                    nezumi: {
                        sequences: [],
                        syncSettings: {
                            syncGroups: [],
                            syncCapabilities: ['movement', 'stealth']
                        }
                    }
                }
            },
            metadata: {
                isDefault: true,
                created: new Date().toISOString(),
                source: 'default-settings'
            }
        };
    }
    
    /**
     * ストレージ状態診断
     * デバッグ・トラブルシューティング用
     */
    diagnosisStorage() {
        const diagnosis = {
            v3Data: !!localStorage.getItem(this.storageKey),
            positioning: !!localStorage.getItem(this.compatibilityKeys.positioning),
            boundingBox: !!localStorage.getItem(this.compatibilityKeys.boundingBox),
            characters: !!localStorage.getItem(this.compatibilityKeys.characters),
            totalKeys: Object.keys(localStorage).filter(k => k.startsWith('spine')).length
        };
        
        console.log('🔍 ストレージ診断結果:', diagnosis);
        return diagnosis;
    }
}

// ========== グローバル公開・初期化 ========== //

// グローバルインスタンス作成
if (!window.TimelineDataManager) {
    window.TimelineDataManager = new TimelinePersistentStorage();
    console.log('✅ Timeline Data Manager グローバル初期化完了');
}

// デバッグ・開発支援関数
window.debugTimelineStorage = () => window.TimelineDataManager.diagnosisStorage();

console.log('✅ Timeline Data Manager モジュール読み込み完了');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimelinePersistentStorage;
}