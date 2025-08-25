// 🎬 Animation Sequencer - Spineアニメーションタイミング・シーケンス制御マイクロモジュール
// 設計原則: 完全独立・外部依存ゼロ・数値のみ入出力

console.log('🚀 Animation Sequencer マイクロモジュール読み込み');

/**
 * Spineアニメーションシーケンス・タイミング制御モジュール
 * v3.0のSpineAnimationControllerからアニメーション制御機能を完全移植
 * 
 * 入力仕様:
 * {
 *   characterId: "hero_001",
 *   animationName: "taiki",             // アニメーション名
 *   sequenceType: "single",             // シーケンスタイプ（single/chain/loop）
 *   timingConfig: {
 *     delay: 1500,                      // 開始遅延（ms）
 *     duration: 2000,                   // 継続時間（ms）
 *     loop: true                        // ループフラグ
 *   }
 * }
 * 
 * 出力仕様:
 * {
 *   sequenceId: "seq_001",
 *   animationName: "taiki",
 *   status: "playing",                  // playing/paused/completed/failed
 *   timingData: {
 *     startTime: 1692345678901,
 *     endTime: 1692345680901,
 *     progress: 0.5
 *   }
 * }
 */
class AnimationSequencer {
    constructor() {
        // 完全独立：外部依存ゼロ
        this.sequences = new Map();
        this.timers = new Map();
        this.animationQueue = new Map();
        this.sequenceCounter = 0;
        this.isInitialized = false;
        
        // アニメーション種別設定（v3.0移植）
        this.animationTypes = {
            'syutugen': { duration: 2000, transition: 'taiki', type: 'appearance' },
            'taiki': { duration: 3000, loop: true, type: 'idle' },
            'yarare': { duration: 1200, transition: 'taiki', type: 'damage' },
            'click': { duration: 1000, transition: 'taiki', type: 'interaction' }
        };
        
        // プレースホルダーアニメーション定義（v3.0移植）
        this.placeholderAnimations = {
            'syutugen': 'placeholderAppear 1s ease-out',
            'taiki': 'placeholderFloat 3s ease-in-out infinite',
            'yarare': 'placeholderDamage 1.2s ease-out',
            'click': 'placeholderBounce 0.5s ease-out'
        };
    }

    /**
     * アニメーションシーケンス生成・実行メイン関数
     * @param {Object} input - アニメーション設定
     * @returns {Object} 生成されたシーケンスデータ
     */
    generateSequence(input) {
        console.log('🎬 アニメーションシーケンス生成開始', input);

        // 入力検証
        const validatedInput = this.validateInput(input);
        if (!validatedInput) {
            return null;
        }

        // シーケンスIDを生成
        const sequenceId = `seq_${++this.sequenceCounter}`;

        // シーケンスタイプに応じた処理
        const sequenceData = this.createSequenceData(sequenceId, validatedInput);
        
        // シーケンスを実行キューに追加
        this.sequences.set(sequenceId, sequenceData);

        console.log('✅ アニメーションシーケンス生成完了', sequenceData);
        return sequenceData;
    }

    /**
     * アニメーションシーケンスの実行
     * @param {string} sequenceId - シーケンスID
     * @returns {Object} 実行結果
     */
    executeSequence(sequenceId) {
        console.log('🎯 アニメーションシーケンス実行開始', sequenceId);

        const sequence = this.sequences.get(sequenceId);
        if (!sequence) {
            console.error('❌ シーケンスが見つかりません:', sequenceId);
            return null;
        }

        // シーケンスタイプに応じた実行
        switch (sequence.sequenceType) {
            case 'single':
                return this.executeSingleAnimation(sequence);
            case 'chain':
                return this.executeChainedAnimation(sequence);
            case 'loop':
                return this.executeLoopAnimation(sequence);
            case 'transition':
                return this.executeTransitionSequence(sequence);
            default:
                return this.executeSingleAnimation(sequence);
        }
    }

    /**
     * 単発アニメーション実行
     * @param {Object} sequence - シーケンスデータ
     * @returns {Object} 実行結果
     */
    executeSingleAnimation(sequence) {
        console.log('🎯 単発アニメーション実行', sequence.animationName);

        const startTime = Date.now();
        
        // 遅延がある場合は待機
        if (sequence.timing.delay > 0) {
            setTimeout(() => {
                this.startAnimation(sequence, startTime);
            }, sequence.timing.delay);
        } else {
            this.startAnimation(sequence, startTime);
        }

        // 実行結果データ
        const result = {
            sequenceId: sequence.sequenceId,
            animationName: sequence.animationName,
            status: 'playing',
            timingData: {
                startTime: startTime + sequence.timing.delay,
                endTime: startTime + sequence.timing.delay + sequence.timing.duration,
                progress: 0.0
            },
            executedAt: startTime
        };

        return result;
    }

    /**
     * チェインアニメーション実行（syutugen→taiki等）
     * @param {Object} sequence - シーケンスデータ
     * @returns {Object} 実行結果
     */
    executeChainedAnimation(sequence) {
        console.log('🔗 チェインアニメーション実行', sequence.chain);

        const startTime = Date.now();
        let currentTime = startTime;

        // チェーン実行計画を作成
        const executionPlan = sequence.chain.map((step, index) => {
            const stepStartTime = currentTime + (index > 0 ? sequence.chain[index - 1].duration : 0);
            currentTime = stepStartTime + step.duration;
            
            return {
                ...step,
                startTime: stepStartTime,
                endTime: stepStartTime + step.duration
            };
        });

        // チェーン実行開始
        this.executeChainSteps(sequence.sequenceId, executionPlan, 0);

        const result = {
            sequenceId: sequence.sequenceId,
            animationName: sequence.chain[0].animationName,
            status: 'playing',
            timingData: {
                startTime: startTime,
                endTime: currentTime,
                progress: 0.0,
                chain: executionPlan
            },
            executedAt: startTime
        };

        return result;
    }

    /**
     * トランジションシーケンス実行（v3.0の自然遷移アニメーション）
     * @param {Object} sequence - シーケンスデータ
     * @returns {Object} 実行結果
     */
    executeTransitionSequence(sequence) {
        console.log('🌊 トランジションシーケンス実行', sequence.transition);

        const { fromAnimation, toAnimation } = sequence.transition;
        
        // 第1段階：開始アニメーション（1回のみ）
        const firstResult = this.executeSingleAnimation({
            ...sequence,
            animationName: fromAnimation,
            timing: { ...sequence.timing, loop: false }
        });

        // 第2段階：遷移アニメーション（完了後に自動実行）
        const transitionDelay = this.animationTypes[fromAnimation]?.duration || 2000;
        
        setTimeout(() => {
            console.log(`🔄 ${fromAnimation} → ${toAnimation} 遷移実行`);
            this.executeSingleAnimation({
                ...sequence,
                animationName: toAnimation,
                timing: { ...sequence.timing, delay: 0, loop: true }
            });
        }, transitionDelay);

        const result = {
            sequenceId: sequence.sequenceId,
            animationName: fromAnimation,
            status: 'playing',
            timingData: {
                startTime: Date.now(),
                transitionTime: Date.now() + transitionDelay,
                progress: 0.0
            },
            transition: { from: fromAnimation, to: toAnimation },
            executedAt: Date.now()
        };

        return result;
    }

    /**
     * アニメーション開始処理
     * @param {Object} sequence - シーケンスデータ
     * @param {number} startTime - 開始時刻
     */
    startAnimation(sequence, startTime) {
        console.log('🎬 アニメーション開始', sequence.animationName);

        // プログレス追跡タイマーを設定
        if (sequence.timing.duration > 0) {
            this.setupProgressTracking(sequence, startTime);
        }

        // アニメーション完了タイマーを設定
        if (!sequence.timing.loop) {
            setTimeout(() => {
                this.completeAnimation(sequence);
            }, sequence.timing.duration);
        }
    }

    /**
     * チェーンステップの実行
     * @param {string} sequenceId - シーケンスID
     * @param {Array} steps - 実行ステップ
     * @param {number} currentIndex - 現在のインデックス
     */
    executeChainSteps(sequenceId, steps, currentIndex) {
        if (currentIndex >= steps.length) {
            console.log('✅ チェーンアニメーション完了');
            return;
        }

        const currentStep = steps[currentIndex];
        console.log(`🔗 チェーンステップ ${currentIndex + 1}/${steps.length}: ${currentStep.animationName}`);

        // 現在のステップを実行
        setTimeout(() => {
            // プログレス追跡
            this.setupProgressTracking({
                sequenceId: sequenceId,
                timing: currentStep
            }, currentStep.startTime);

            // 次のステップへ
            if (currentIndex + 1 < steps.length) {
                const nextDelay = currentStep.duration;
                setTimeout(() => {
                    this.executeChainSteps(sequenceId, steps, currentIndex + 1);
                }, nextDelay);
            } else {
                // 最終ステップ完了
                setTimeout(() => {
                    this.completeSequence(sequenceId);
                }, currentStep.duration);
            }
        }, Math.max(0, currentStep.startTime - Date.now()));
    }

    /**
     * プログレス追跡セットアップ
     * @param {Object} sequence - シーケンスデータ
     * @param {number} startTime - 開始時刻
     */
    setupProgressTracking(sequence, startTime) {
        const updateInterval = 100; // 100ms間隔
        
        const progressTimer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / sequence.timing.duration, 1.0);
            
            // プログレス更新（実際の実装では外部にコールバック）
            this.updateSequenceProgress(sequence.sequenceId, progress);
            
            if (progress >= 1.0) {
                clearInterval(progressTimer);
                this.timers.delete(`progress_${sequence.sequenceId}`);
            }
        }, updateInterval);

        this.timers.set(`progress_${sequence.sequenceId}`, progressTimer);
    }

    /**
     * シーケンスデータ作成
     * @param {string} sequenceId - シーケンスID
     * @param {Object} config - 設定
     * @returns {Object} シーケンスデータ
     */
    createSequenceData(sequenceId, config) {
        const animationType = this.animationTypes[config.animationName];
        
        // 基本シーケンスデータ
        const baseSequence = {
            sequenceId: sequenceId,
            characterId: config.characterId,
            animationName: config.animationName,
            sequenceType: config.sequenceType,
            timing: {
                delay: config.timingConfig?.delay || 0,
                duration: config.timingConfig?.duration || animationType?.duration || 1000,
                loop: config.timingConfig?.loop !== undefined ? config.timingConfig.loop : animationType?.loop || false
            },
            createdAt: Date.now()
        };

        // シーケンスタイプ別の拡張
        switch (config.sequenceType) {
            case 'chain':
                return this.createChainSequence(baseSequence, config.chain);
            case 'transition':
                return this.createTransitionSequence(baseSequence, config);
            default:
                return baseSequence;
        }
    }

    /**
     * チェーンシーケンス作成
     * @param {Object} baseSequence - 基本シーケンス
     * @param {Array} chainConfig - チェーン設定
     * @returns {Object} チェーンシーケンス
     */
    createChainSequence(baseSequence, chainConfig) {
        const chain = chainConfig || [
            { animationName: baseSequence.animationName, duration: baseSequence.timing.duration }
        ];

        return {
            ...baseSequence,
            chain: chain.map(step => ({
                animationName: step.animationName,
                duration: step.duration || this.animationTypes[step.animationName]?.duration || 1000,
                loop: step.loop || false
            }))
        };
    }

    /**
     * トランジションシーケンス作成（v3.0の自然遷移）
     * @param {Object} baseSequence - 基本シーケンス
     * @param {Object} config - 設定
     * @returns {Object} トランジションシーケンス
     */
    createTransitionSequence(baseSequence, config) {
        // v3.0の自然遷移パターンを検出
        const animationType = this.animationTypes[baseSequence.animationName];
        const transitionTo = animationType?.transition || 'taiki';

        return {
            ...baseSequence,
            sequenceType: 'transition',
            transition: {
                fromAnimation: baseSequence.animationName,
                toAnimation: transitionTo,
                transitionType: animationType?.type || 'general'
            }
        };
    }

    /**
     * タイミング計算（Spine座標系対応）
     * @param {Object} input - タイミング設定
     * @returns {Object} 計算されたタイミングデータ
     */
    calculateTiming(input) {
        console.log('⏱️ タイミング計算開始', input);

        const validatedInput = this.validateTimingInput(input);
        if (!validatedInput) {
            return null;
        }

        // 基本タイミング計算
        const timing = {
            delay: validatedInput.delay,
            duration: validatedInput.duration,
            interval: validatedInput.interval || 16, // 60fps基準
            totalFrames: Math.ceil(validatedInput.duration / (validatedInput.interval || 16)),
            fps: 1000 / (validatedInput.interval || 16)
        };

        // フェード効果タイミング（v3.0移植）
        if (validatedInput.fadeIn) {
            timing.fadeIn = {
                delay: validatedInput.fadeDelay || 0,
                duration: validatedInput.fadeDuration || 2000,
                easing: validatedInput.fadeEasing || 'ease-in-out'
            };
        }

        // シーケンス進行率計算関数を生成
        timing.getProgressAt = (currentTime, startTime) => {
            const elapsed = currentTime - startTime - timing.delay;
            return Math.max(0, Math.min(elapsed / timing.duration, 1.0));
        };

        const result = {
            characterId: validatedInput.characterId,
            timingData: timing,
            calculatedAt: Date.now(),
            metadata: {
                animationType: validatedInput.animationType,
                frameRate: timing.fps,
                totalDuration: timing.delay + timing.duration
            }
        };

        console.log('✅ タイミング計算完了', result);
        return result;
    }

    /**
     * シーケンス進行状況更新
     * @param {string} sequenceId - シーケンスID
     * @param {number} progress - 進行率（0.0-1.0）
     */
    updateSequenceProgress(sequenceId, progress) {
        const sequence = this.sequences.get(sequenceId);
        if (sequence) {
            sequence.currentProgress = progress;
            // 実際の実装では外部コールバックや状態更新を行う
        }
    }

    /**
     * アニメーション完了処理
     * @param {Object} sequence - シーケンス
     */
    completeAnimation(sequence) {
        console.log('✅ アニメーション完了', sequence.animationName);
        
        // 自動遷移の処理
        const animationType = this.animationTypes[sequence.animationName];
        if (animationType?.transition && !sequence.timing.loop) {
            console.log(`🔄 自動遷移: ${sequence.animationName} → ${animationType.transition}`);
            
            // 遷移アニメーション開始
            const transitionSequence = this.generateSequence({
                characterId: sequence.characterId,
                animationName: animationType.transition,
                sequenceType: 'single',
                timingConfig: {
                    delay: 0,
                    duration: this.animationTypes[animationType.transition]?.duration || 3000,
                    loop: true
                }
            });
            
            this.executeSequence(transitionSequence.sequenceId);
        }
        
        this.completeSequence(sequence.sequenceId);
    }

    /**
     * シーケンス完了処理
     * @param {string} sequenceId - シーケンスID
     */
    completeSequence(sequenceId) {
        const sequence = this.sequences.get(sequenceId);
        if (sequence) {
            sequence.status = 'completed';
            sequence.completedAt = Date.now();
        }
    }

    /**
     * 全シーケンス停止
     * @param {string} characterId - キャラクターID
     */
    stopAllSequences(characterId) {
        console.log('🛑 全シーケンス停止', characterId);
        
        for (const [sequenceId, sequence] of this.sequences) {
            if (sequence.characterId === characterId) {
                sequence.status = 'stopped';
                
                // タイマーをクリア
                const progressTimer = this.timers.get(`progress_${sequenceId}`);
                if (progressTimer) {
                    clearInterval(progressTimer);
                    this.timers.delete(`progress_${sequenceId}`);
                }
            }
        }
    }

    /**
     * 入力検証
     * @param {Object} input - 入力データ
     * @returns {Object|null} 検証済み入力またはnull
     */
    validateInput(input) {
        if (!input || typeof input !== 'object') {
            console.error('❌ 無効な入力: オブジェクトが必要');
            return null;
        }

        return {
            characterId: input.characterId || 'unknown',
            animationName: input.animationName || 'taiki',
            sequenceType: input.sequenceType || 'single',
            timingConfig: {
                delay: parseInt(input.timingConfig?.delay) || 0,
                duration: parseInt(input.timingConfig?.duration) || 1000,
                loop: input.timingConfig?.loop !== undefined ? input.timingConfig.loop : false
            },
            chain: input.chain || null,
            fadeIn: input.fadeIn || false,
            fadeDelay: parseInt(input.fadeDelay) || 0,
            fadeDuration: parseInt(input.fadeDuration) || 2000
        };
    }

    /**
     * タイミング入力検証
     * @param {Object} input - 入力データ
     * @returns {Object|null} 検証済み入力またはnull
     */
    validateTimingInput(input) {
        if (!input || typeof input !== 'object') {
            console.error('❌ 無効なタイミング入力');
            return null;
        }

        return {
            characterId: input.characterId || 'unknown',
            delay: parseInt(input.delay) || 0,
            duration: parseInt(input.duration) || 1000,
            interval: parseInt(input.interval) || 16,
            animationType: input.animationType || 'general',
            fadeIn: input.fadeIn || false,
            fadeDelay: parseInt(input.fadeDelay) || 0,
            fadeDuration: parseInt(input.fadeDuration) || 2000,
            fadeEasing: input.fadeEasing || 'ease-in-out'
        };
    }

    /**
     * モジュール状態取得
     * @returns {Object} 現在の状態
     */
    getState() {
        return {
            activeSequences: this.sequences.size,
            runningTimers: this.timers.size,
            queuedAnimations: this.animationQueue.size,
            isInitialized: this.isInitialized
        };
    }

    /**
     * 完全クリーンアップ
     * マイクロモジュール設計の必須メソッド
     */
    cleanup() {
        console.log('🧹 Animation Sequencer クリーンアップ実行');
        
        // 全タイマーをクリア
        for (const timer of this.timers.values()) {
            clearInterval(timer);
        }
        
        this.sequences.clear();
        this.timers.clear();
        this.animationQueue.clear();
        this.sequenceCounter = 0;
        this.isInitialized = false;
        
        console.log('✅ Animation Sequencer クリーンアップ完了');
    }

    /**
     * 単独テスト（マイクロモジュール設計の必須メソッド）
     * @returns {boolean} テスト結果
     */
    static test() {
        console.log('🧪 Animation Sequencer 単独テスト開始');
        
        try {
            const sequencer = new AnimationSequencer();

            // テスト1: 基本シーケンス生成
            const sequence1 = sequencer.generateSequence({
                characterId: "test_001",
                animationName: "taiki",
                sequenceType: "single",
                timingConfig: {
                    delay: 0,
                    duration: 1000,
                    loop: true
                }
            });

            if (!sequence1 || sequence1.animationName !== "taiki") {
                throw new Error('基本シーケンス生成テスト失敗');
            }

            // テスト2: タイミング計算
            const timing = sequencer.calculateTiming({
                characterId: "test_002",
                delay: 500,
                duration: 2000,
                interval: 16,
                fadeIn: true,
                fadeDuration: 1000
            });

            if (!timing || timing.timingData.duration !== 2000) {
                throw new Error('タイミング計算テスト失敗');
            }

            // テスト3: トランジションシーケンス
            const transition = sequencer.generateSequence({
                characterId: "test_003",
                animationName: "syutugen",
                sequenceType: "transition",
                timingConfig: { duration: 2000, loop: false }
            });

            if (!transition || transition.sequenceType !== "transition") {
                throw new Error('トランジションシーケンステスト失敗');
            }

            // テスト4: クリーンアップ
            sequencer.cleanup();
            const state = sequencer.getState();
            
            if (state.activeSequences !== 0 || state.runningTimers !== 0) {
                throw new Error('クリーンアップテスト失敗');
            }

            console.log('✅ Animation Sequencer 単独テスト成功');
            return true;

        } catch (error) {
            console.error('❌ Animation Sequencer 単独テスト失敗:', error);
            return false;
        }
    }
}

// モジュールエクスポート（環境非依存）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationSequencer;
} else {
    window.AnimationSequencer = AnimationSequencer;
}

console.log('✅ Animation Sequencer マイクロモジュール読み込み完了');