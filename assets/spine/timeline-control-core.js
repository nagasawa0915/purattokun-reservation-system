// 🎬 タイムライン制御システム - コア制御エンジン
console.log('🎬 Timeline Control Core モジュール読み込み開始');

/**
 * タイムライン制御エンジン
 * 仕様: 60fps精度・既存システム統合・統一座標システム活用
 */
class TimelineControlEngine {
    constructor(characterManager = null, coordinateSystem = null) {
        this.version = '1.0';
        
        this.characterManager = characterManager || window.SpineCharacterManager || null;
        this.coordinateSystem = coordinateSystem || this.getUnifiedCoordinateSystem();
        this.sequences = new Map();
        this.keyframes = new Map();
        this.syncController = null;
        this.frameRate = 60;
        this.frameDuration = 1000 / this.frameRate;
        this.isPlaying = false;
        this.currentTime = 0;
        this.lastFrameTime = 0;
        this.animationFrameId = null;
        this.errorHandler = window.TimelineErrorHandler || null;
        this.dataManager = window.TimelineDataManager || null;
        this.initialized = false;
        this.integrationStatus = { characterManager: false, coordinateSystem: false, errorHandler: false, dataManager: false };
        console.log('✅ Timeline Control Engine 構築完了');
        this.init();
    }
    
    // エンジン初期化
    async init() {
        console.log('🚀 Timeline Control Engine 初期化開始');
        try {
            await this.integrateExistingSystems();
            this.initializeCoordinateSystem();
            await this.initializeDataSystem();
            this.initializeSyncController();
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
    
    // 既存システム統合
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
    
    // キャラクター管理システム検索
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
    
    // 統一座標システム取得
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
    
    // 統一座標システム初期化
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
    
    // データ管理システム初期化
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
    
    // キャラクタータイムライン読み込み
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
    
    // 同期制御システム初期化
    initializeSyncController() {
        console.log('🔄 同期制御システム初期化開始');
        
        // SyncControllerクラスが読み込まれている場合のみ初期化
        if (window.SyncController) {
            this.syncController = new window.SyncController();
            this.syncController.setFrameRate(this.frameRate);
            this.syncController.setSyncTolerance(this.frameDuration);
            console.log('✅ 同期制御システム初期化完了');
        } else {
            console.log('⚠️ SyncController未読み込み - 同期機能無効');
        }
    }
    
    // システム整合性検証
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
    
    // フレーム制御システム
    
    // フレーム更新
    updateFrame(deltaTime) {
        if (!this.isPlaying || !this.initialized) {
            return;
        }
        
        try {
            this.currentTime += deltaTime;
            this.sequences.forEach((sequence, sequenceId) => {
                if (sequence.isActive) {
                    this.updateSequence(sequence, deltaTime);
                }
            });
            
            if (this.syncController) {
                this.syncController.synchronizeCharacters(this.currentTime);
            }
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
    
    // タイムライン再生開始
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
    
    // タイムライン一時停止
    pause() {
        console.log('⏸️ タイムライン一時停止');
        
        this.isPlaying = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    // タイムライン停止・リセット
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
    
    // フレームループ開始
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
    
    // シーケンス・キーフレーム管理
    
    // シーケンス追加
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
    
    // シーケンス実行
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
    
    // シーケンス更新
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
    
    // キーフレーム実行
    executeKeyframe(characterId, keyframe) {
        console.log(`⚡ キーフレーム実行: ${characterId} - ${keyframe.animation || 'position'} @ ${keyframe.time}ms`);
        
        // この処理はtimeline-animation-integration.jsに委譲
        if (window.TimelineAnimationIntegration) {
            window.TimelineAnimationIntegration.executeKeyframe(characterId, keyframe, this);
        } else {
            console.warn('⚠️ アニメーション統合モジュール未読み込み');
        }
    }
    
    // タイムライン更新適用
    applyTimelineUpdates() {
        // 現在は個別キーフレームで処理済み
        // Phase 2でより高度な更新システムを実装予定
    }
    
    // キャラクター状態リセット
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
    
    // システム状態取得
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
    
    // 診断情報取得
    getDiagnosisInfo() {
        if (window.TimelineDebugUtilities) {
            return window.TimelineDebugUtilities.getDiagnosisInfo(this);
        } else {
            const status = this.getSystemStatus();
            console.log('🔍 Timeline Control Engine 基本診断:', status);
            return status;
        }
    }
}

// Export classes for other modules
if (typeof window !== 'undefined') {
    window.TimelineControlEngine = TimelineControlEngine;
    console.log('✅ Timeline Control Core クラスをグローバル公開');
}

console.log('✅ Timeline Control Core モジュール読み込み完了');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TimelineControlEngine };
}