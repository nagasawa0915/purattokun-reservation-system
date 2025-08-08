// 🎬 タイムライン制御システム - 基本制御エンジン
// 役割: フレーム精度制御・シーケンス管理・既存システム統合
// Phase 1: 基本タイムライン制御エンジン実装
// 制約: 450行以内・仕様書準拠

console.log('🎬 Timeline Control Engine モジュール読み込み開始');

// ========== TimelineControlEngine基本クラス ========== //

/**
 * タイムライン制御エンジン
 * 仕様: 60fps精度・既存システム統合・統一座標システム活用
 */
class TimelineControlEngine {
    constructor(characterManager = null, coordinateSystem = null) {
        this.version = '1.0';
        
        // 既存システム統合
        this.characterManager = characterManager || window.SpineCharacterManager || null;
        this.coordinateSystem = coordinateSystem || this.getUnifiedCoordinateSystem();
        
        // 核心システム
        this.sequences = new Map();                    // シーケンス管理
        this.keyframes = new Map();                   // キーフレーム管理 
        this.syncController = new SyncController();   // 同期制御
        
        // フレーム制御（60fps精度）
        this.frameRate = 60;
        this.frameDuration = 1000 / this.frameRate; // 16.67ms
        this.isPlaying = false;
        this.currentTime = 0;
        this.lastFrameTime = 0;
        this.animationFrameId = null;
        
        // エラーハンドリング統合
        this.errorHandler = window.TimelineErrorHandler || null;
        
        // データ管理統合
        this.dataManager = window.TimelineDataManager || null;
        
        // 品質保証フラグ
        this.initialized = false;
        this.integrationStatus = {
            characterManager: false,
            coordinateSystem: false,
            errorHandler: false,
            dataManager: false
        };
        
        console.log('✅ Timeline Control Engine 構築完了');
        this.init();
    }
    
    /**
     * エンジン初期化
     * 既存システム統合・品質保証実行
     */
    async init() {
        console.log('🚀 Timeline Control Engine 初期化開始');
        
        try {
            // 1. 既存システム統合確認
            await this.integrateExistingSystems();
            
            // 2. 統一座標システム初期化
            this.initializeCoordinateSystem();
            
            // 3. データ管理システム初期化
            await this.initializeDataSystem();
            
            // 4. 同期制御システム初期化
            this.initializeSyncController();
            
            // 5. 品質保証チェック
            this.validateSystemIntegrity();
            
            this.initialized = true;
            console.log('✅ Timeline Control Engine 初期化完了');
            
            return true;
            
        } catch (error) {
            console.error('❌ Timeline Control Engine 初期化エラー:', error);
            
            if (this.errorHandler) {
                this.errorHandler.handleCriticalError(error, 'engine-initialization');
            }
            
            return false;
        }
    }
    
    /**
     * 既存システム統合
     * 境界ボックス統合の教訓適用: 安全な統合・影響ゼロ保証
     */
    async integrateExistingSystems() {
        console.log('🔗 既存システム統合開始');
        
        // キャラクター管理システム統合
        if (!this.characterManager) {
            console.log('⚠️ キャラクター管理システム未検出 - 自動検索中...');
            this.characterManager = this.findCharacterManager();
        }
        
        if (this.characterManager) {
            console.log('✅ キャラクター管理システム統合成功');
            this.integrationStatus.characterManager = true;
        } else {
            console.log('⚠️ キャラクター管理システム未統合 - プレースホルダーモード');
        }
        
        // エラーハンドリング統合
        if (this.errorHandler) {
            console.log('✅ エラーハンドリングシステム統合成功');
            this.integrationStatus.errorHandler = true;
        }
        
        // データ管理統合
        if (this.dataManager) {
            console.log('✅ データ管理システム統合成功');
            this.integrationStatus.dataManager = true;
        }
        
        console.log('🔗 既存システム統合完了:', this.integrationStatus);
    }
    
    /**
     * キャラクター管理システム検索
     * 既存システム自動検出
     */
    findCharacterManager() {
        const candidates = [
            'spineCharacterManager',
            'characterManager', 
            'spineManager',
            'SpineCharacterManager'
        ];
        
        for (const candidate of candidates) {
            if (window[candidate]) {
                console.log(`✅ キャラクター管理システム発見: ${candidate}`);
                return window[candidate];
            }
        }
        
        return null;
    }
    
    /**
     * 統一座標システム取得
     * SPINE_BEST_PRACTICES.md準拠
     */
    getUnifiedCoordinateSystem() {
        return {
            // 2層座標制御システム準拠
            layer1: {
                name: 'CSS位置制御',
                properties: ['left', 'top', 'transform', 'width', 'height', 'z-index']
            },
            layer2: {
                name: 'Spine座標制御', 
                properties: ['skeleton.x', 'skeleton.y', 'skeleton.scaleX', 'skeleton.scaleY']
            },
            // 統一座標変換関数
            convertToCSS: (spineCoords) => {
                return {
                    left: spineCoords.x + '%',
                    top: spineCoords.y + '%',
                    transform: 'translate(-50%, -50%)'
                };
            },
            convertToSpine: (cssCoords, canvasSize) => {
                return {
                    x: canvasSize.width / 2,  // 常にcanvas中央（推奨）
                    y: canvasSize.height / 2,
                    scaleX: cssCoords.scale || 1.0,
                    scaleY: cssCoords.scale || 1.0
                };
            }
        };
    }
    
    /**
     * 統一座標システム初期化
     */
    initializeCoordinateSystem() {
        console.log('📐 統一座標システム初期化開始');
        
        if (this.coordinateSystem) {
            console.log('✅ 統一座標システム設定完了');
            console.log('  - Layer 1:', this.coordinateSystem.layer1.name);
            console.log('  - Layer 2:', this.coordinateSystem.layer2.name);
            this.integrationStatus.coordinateSystem = true;
        } else {
            console.log('⚠️ 統一座標システム初期化失敗');
        }
    }
    
    /**
     * データ管理システム初期化
     */
    async initializeDataSystem() {
        console.log('💾 データ管理システム初期化開始');
        
        if (this.dataManager) {
            try {
                // 3段階フォールバックでタイムライン設定読み込み
                const timelineData = this.dataManager.loadTimelineState();
                console.log('✅ タイムライン設定読み込み成功');
                
                // 既存キャラクター設定があれば適用
                if (timelineData.timeline && timelineData.timeline.characters) {
                    this.loadCharacterTimelines(timelineData.timeline.characters);
                }
                
                return true;
                
            } catch (error) {
                console.error('❌ データ管理システム初期化エラー:', error);
                
                if (this.errorHandler) {
                    this.errorHandler.handleDataLoadError(error, 'timeline-settings');
                }
                
                return false;
            }
        } else {
            console.log('⚠️ データ管理システム未統合 - デフォルト設定使用');
            return true;
        }
    }
    
    /**
     * キャラクタータイムライン読み込み
     */
    loadCharacterTimelines(charactersData) {
        console.log('🎭 キャラクタータイムライン読み込み開始');
        
        Object.keys(charactersData).forEach(characterId => {
            const characterData = charactersData[characterId];
            
            if (characterData.sequences) {
                characterData.sequences.forEach(sequence => {
                    this.addSequence(characterId, sequence);
                });
                
                console.log(`✅ ${characterId} タイムライン読み込み: ${characterData.sequences.length}シーケンス`);
            }
        });
        
        console.log('🎭 キャラクタータイムライン読み込み完了');
    }
    
    /**
     * 同期制御システム初期化
     */
    initializeSyncController() {
        console.log('🔄 同期制御システム初期化開始');
        
        if (this.syncController) {
            this.syncController.setFrameRate(this.frameRate);
            this.syncController.setSyncTolerance(this.frameDuration);
            console.log('✅ 同期制御システム初期化完了');
        }
    }
    
    /**
     * システム整合性検証
     */
    validateSystemIntegrity() {
        console.log('🔍 システム整合性検証開始');
        
        const checks = [
            { name: 'フレーム制御', valid: this.frameRate === 60 },
            { name: 'シーケンス管理', valid: this.sequences instanceof Map },
            { name: 'キーフレーム管理', valid: this.keyframes instanceof Map },
            { name: '同期制御', valid: !!this.syncController },
            { name: '統一座標システム', valid: this.integrationStatus.coordinateSystem }
        ];
        
        const failedChecks = checks.filter(check => !check.valid);
        
        if (failedChecks.length === 0) {
            console.log('✅ システム整合性検証 - 全項目クリア');
        } else {
            console.warn('⚠️ システム整合性検証 - 問題検出:');
            failedChecks.forEach(check => {
                console.warn(`  - ${check.name}: 失敗`);
            });
        }
        
        return failedChecks.length === 0;
    }
    
    // ========== フレーム制御システム（60fps精度） ========== //
    
    /**
     * フレーム更新（60fps精度制御）
     * Phase 1核心機能
     */
    updateFrame(deltaTime) {
        if (!this.isPlaying || !this.initialized) {
            return;
        }
        
        try {
            // 現在時間更新
            this.currentTime += deltaTime;
            
            // アクティブシーケンス更新
            this.sequences.forEach((sequence, sequenceId) => {
                if (sequence.isActive) {
                    this.updateSequence(sequence, deltaTime);
                }
            });
            
            // 同期制御実行
            if (this.syncController) {
                this.syncController.synchronizeCharacters(this.currentTime);
            }
            
            // キャラクター位置・アニメーション適用
            this.applyTimelineUpdates();
            
        } catch (error) {
            console.error('❌ フレーム更新エラー:', error);
            
            if (this.errorHandler) {
                this.errorHandler.handleCoordinateSystemError(error, {
                    currentTime: this.currentTime,
                    deltaTime: deltaTime
                });
            }
        }
    }
    
    /**
     * タイムライン再生開始
     */
    play() {
        if (!this.initialized) {
            console.warn('⚠️ タイムラインエンジン未初期化');
            return false;
        }
        
        console.log('▶️ タイムライン再生開始');
        
        this.isPlaying = true;
        this.lastFrameTime = performance.now();
        
        this.startFrameLoop();
        return true;
    }
    
    /**
     * タイムライン一時停止
     */
    pause() {
        console.log('⏸️ タイムライン一時停止');
        
        this.isPlaying = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    /**
     * タイムライン停止・リセット
     */
    stop() {
        console.log('⏹️ タイムライン停止・リセット');
        
        this.pause();
        this.currentTime = 0;
        
        // 全シーケンスをリセット
        this.sequences.forEach(sequence => {
            sequence.currentTime = 0;
            sequence.isActive = false;
        });
        
        // キャラクター状態リセット
        this.resetCharacterStates();
    }
    
    /**
     * フレームループ開始
     */
    startFrameLoop() {
        const frameUpdate = (currentTime) => {
            if (!this.isPlaying) {
                return;
            }
            
            const deltaTime = currentTime - this.lastFrameTime;
            
            // 60fps制御（フレーム間隔調整）
            if (deltaTime >= this.frameDuration) {
                this.updateFrame(deltaTime);
                this.lastFrameTime = currentTime - (deltaTime % this.frameDuration);
            }
            
            this.animationFrameId = requestAnimationFrame(frameUpdate);
        };
        
        this.animationFrameId = requestAnimationFrame(frameUpdate);
    }
    
    // ========== シーケンス・キーフレーム管理 ========== //
    
    /**
     * シーケンス追加
     */
    addSequence(characterId, sequenceConfig) {
        const sequenceId = `${characterId}_${sequenceConfig.id || Date.now()}`;
        
        const sequence = {
            id: sequenceId,
            characterId: characterId,
            name: sequenceConfig.name || 'Unnamed Sequence',
            keyframes: sequenceConfig.keyframes || [],
            duration: sequenceConfig.duration || 1000,
            looping: sequenceConfig.looping || false,
            isActive: false,
            currentTime: 0,
            currentKeyframeIndex: 0
        };
        
        this.sequences.set(sequenceId, sequence);
        
        // キーフレーム個別登録
        sequence.keyframes.forEach((keyframe, index) => {
            const keyframeId = `${sequenceId}_kf_${index}`;
            this.keyframes.set(keyframeId, {
                ...keyframe,
                sequenceId: sequenceId,
                index: index
            });
        });
        
        console.log(`✅ シーケンス追加: ${sequence.name} (${sequence.keyframes.length}キーフレーム)`);
        return sequenceId;
    }
    
    /**
     * シーケンス実行
     */
    executeSequence(sequenceId) {
        const sequence = this.sequences.get(sequenceId);
        
        if (!sequence) {
            console.warn(`⚠️ シーケンス未発見: ${sequenceId}`);
            return false;
        }
        
        console.log(`🎬 シーケンス実行開始: ${sequence.name}`);
        
        sequence.isActive = true;
        sequence.currentTime = 0;
        sequence.currentKeyframeIndex = 0;
        
        // まだ再生していなければ自動開始
        if (!this.isPlaying) {
            this.play();
        }
        
        return true;
    }
    
    /**
     * シーケンス更新
     */
    updateSequence(sequence, deltaTime) {
        sequence.currentTime += deltaTime;
        
        // キーフレーム実行チェック
        while (sequence.currentKeyframeIndex < sequence.keyframes.length) {
            const keyframe = sequence.keyframes[sequence.currentKeyframeIndex];
            
            if (sequence.currentTime >= keyframe.time) {
                this.executeKeyframe(sequence.characterId, keyframe);
                sequence.currentKeyframeIndex++;
            } else {
                break;
            }
        }
        
        // シーケンス完了チェック
        if (sequence.currentTime >= sequence.duration) {
            if (sequence.looping) {
                sequence.currentTime = 0;
                sequence.currentKeyframeIndex = 0;
                console.log(`🔄 シーケンスループ: ${sequence.name}`);
            } else {
                sequence.isActive = false;
                console.log(`✅ シーケンス完了: ${sequence.name}`);
            }
        }
    }
    
    /**
     * キーフレーム実行
     */
    executeKeyframe(characterId, keyframe) {
        console.log(`⚡ キーフレーム実行: ${characterId} - ${keyframe.animation || 'position'} @ ${keyframe.time}ms`);
        
        try {
            // 統一座標システム適用
            if (keyframe.x !== undefined || keyframe.y !== undefined) {
                this.applyPositionKeyframe(characterId, keyframe);
            }
            
            // アニメーション実行
            if (keyframe.animation) {
                this.applyAnimationKeyframe(characterId, keyframe);
            }
            
            // スケール適用
            if (keyframe.scale) {
                this.applyScaleKeyframe(characterId, keyframe);
            }
            
        } catch (error) {
            console.error('❌ キーフレーム実行エラー:', error);
            
            if (this.errorHandler) {
                this.errorHandler.handleIntegrationError(error, 'keyframe-execution');
            }
        }
    }
    
    /**
     * 位置キーフレーム適用（統一座標システム準拠）
     */
    applyPositionKeyframe(characterId, keyframe) {
        if (!this.coordinateSystem) {
            console.warn('⚠️ 統一座標システム未初期化');
            return;
        }
        
        const character = this.getCharacter(characterId);
        if (!character || !character.canvas) {
            console.warn(`⚠️ キャラクター未発見: ${characterId}`);
            return;
        }
        
        // Layer 1: CSS位置制御
        const cssCoords = {
            x: keyframe.x,
            y: keyframe.y,
            scale: keyframe.scale
        };
        
        const cssPositions = this.coordinateSystem.convertToCSS(cssCoords);
        
        character.canvas.style.left = cssPositions.left;
        character.canvas.style.top = cssPositions.top;
        
        if (cssPositions.transform) {
            character.canvas.style.transform = cssPositions.transform;
        }
        
        console.log(`📍 位置更新: ${characterId} -> (${keyframe.x}%, ${keyframe.y}%)`);
    }
    
    /**
     * アニメーションキーフレーム適用
     */
    applyAnimationKeyframe(characterId, keyframe) {
        const character = this.getCharacter(characterId);
        
        if (!character || !character.animationState) {
            console.warn(`⚠️ キャラクターアニメーション未対応: ${characterId}`);
            return;
        }
        
        try {
            character.animationState.setAnimation(0, keyframe.animation, keyframe.loop || false);
            console.log(`🎭 アニメーション実行: ${characterId} - ${keyframe.animation}`);
            
        } catch (error) {
            console.error(`❌ アニメーション実行エラー (${characterId}):`, error);
        }
    }
    
    /**
     * スケールキーフレーム適用
     */
    applyScaleKeyframe(characterId, keyframe) {
        const character = this.getCharacter(characterId);
        
        if (!character) {
            return;
        }
        
        // Layer 2: Spine座標制御でのスケール適用
        if (character.skeleton) {
            character.skeleton.scaleX = keyframe.scale;
            character.skeleton.scaleY = keyframe.scale;
            console.log(`📏 スケール更新: ${characterId} -> ${keyframe.scale}`);
        }
    }
    
    /**
     * キャラクター取得（既存システム統合）
     */
    getCharacter(characterId) {
        if (this.characterManager && this.characterManager.characters) {
            return this.characterManager.characters.get(characterId);
        }
        
        return null;
    }
    
    /**
     * タイムライン更新適用
     */
    applyTimelineUpdates() {
        // 現在は個別キーフレームで処理済み
        // Phase 2でより高度な更新システムを実装予定
    }
    
    /**
     * キャラクター状態リセット
     */
    resetCharacterStates() {
        if (!this.characterManager) {
            return;
        }
        
        // 全キャラクターを初期状態に戻す
        if (this.characterManager.characters) {
            this.characterManager.characters.forEach((character, characterId) => {
                if (character.animationState) {
                    // デフォルトアニメーション（通常は「taiki」）に戻す
                    character.animationState.setAnimation(0, 'taiki', true);
                }
                
                console.log(`🔄 キャラクター状態リセット: ${characterId}`);
            });
        }
    }
    
    // ========== デバッグ・開発支援機能 ========== //
    
    /**
     * システム状態取得
     */
    getSystemStatus() {
        return {
            version: this.version,
            initialized: this.initialized,
            playing: this.isPlaying,
            currentTime: this.currentTime,
            frameRate: this.frameRate,
            activeSequences: Array.from(this.sequences.values()).filter(s => s.isActive).length,
            totalSequences: this.sequences.size,
            totalKeyframes: this.keyframes.size,
            integrationStatus: this.integrationStatus
        };
    }
    
    /**
     * 診断情報取得
     */
    getDiagnosisInfo() {
        const status = this.getSystemStatus();
        
        console.log('🔍 Timeline Control Engine 診断情報:');
        console.log('  - バージョン:', status.version);
        console.log('  - 初期化状態:', status.initialized);
        console.log('  - 再生状態:', status.playing);
        console.log('  - 現在時間:', status.currentTime.toFixed(2) + 'ms');
        console.log('  - フレームレート:', status.frameRate + 'fps');
        console.log('  - アクティブシーケンス:', status.activeSequences + '/' + status.totalSequences);
        console.log('  - 総キーフレーム数:', status.totalKeyframes);
        console.log('  - 統合状況:', status.integrationStatus);
        
        return status;
    }
}

// ========== 同期制御システム ========== //

/**
 * 同期制御クラス
 * キャラクター間の演出同期・連携制御
 */
class SyncController {
    constructor() {
        this.syncGroups = new Map();
        this.frameRate = 60;
        this.syncTolerance = 16.67; // 1フレーム精度
    }
    
    setFrameRate(frameRate) {
        this.frameRate = frameRate;
        this.syncTolerance = 1000 / frameRate;
    }
    
    setSyncTolerance(tolerance) {
        this.syncTolerance = tolerance;
    }
    
    synchronizeCharacters(currentTime) {
        // Phase 1では基本機能のみ
        // Phase 3で本格的な同期制御を実装予定
        
        this.syncGroups.forEach((group, groupId) => {
            // 基本的な同期チェック
            this.checkGroupSync(group, currentTime);
        });
    }
    
    checkGroupSync(group, currentTime) {
        // 同期グループ内のキャラクター状態チェック
        // 実装はPhase 3で完成予定
    }
    
    createSyncGroup(groupId, characterIds) {
        this.syncGroups.set(groupId, {
            characters: characterIds,
            lastSyncTime: 0
        });
        
        console.log(`🔄 同期グループ作成: ${groupId} (${characterIds.length}キャラクター)`);
    }
}

// ========== グローバル公開・初期化 ========== //

// グローバルインスタンス作成
if (!window.TimelineControlEngine) {
    window.TimelineControlEngine = TimelineControlEngine;
    console.log('✅ Timeline Control Engine クラスをグローバル公開');
}

// デバッグ・開発支援関数
window.createTimelineEngine = () => {
    if (!window.timelineEngine) {
        window.timelineEngine = new TimelineControlEngine();
        console.log('✅ Timeline Engine インスタンス作成完了');
    }
    return window.timelineEngine;
};

window.getTimelineStatus = () => {
    if (window.timelineEngine) {
        return window.timelineEngine.getDiagnosisInfo();
    } else {
        console.log('⚠️ Timeline Engine未作成 - createTimelineEngine()を実行してください');
    }
};

// 実験環境統合用初期化
if (window.location.pathname.includes('timeline-experiment.html')) {
    console.log('🧪 実験環境検出 - 自動初期化実行');
    
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.createTimelineEngine();
        }, 1000);
    });
}

console.log('✅ Timeline Control Engine モジュール読み込み完了');
console.log('🎯 利用可能な機能:');
console.log('  - createTimelineEngine() : エンジンインスタンス作成');
console.log('  - getTimelineStatus() : システム状態診断');
console.log('  - window.timelineEngine : 作成されたエンジンインスタンス');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TimelineControlEngine, SyncController };
}