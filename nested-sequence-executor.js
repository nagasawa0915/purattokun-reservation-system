/**
 * 🎭 Nested Sequence Executor
 * ネストシーケンス実行システム・並列処理・条件分岐
 * 
 * 【技術仕様】
 * - ファイルサイズ: 300行以内
 * - 機能: ネスト実行・並列処理・条件分岐・パフォーマンス記録
 * - 依存: complex-sequence-core.js（基本管理）
 * - 統合: timeline-control-engine.js連携
 */

console.log('🎭 Nested Sequence Executor 読み込み開始');

// ========== ネスト実行システム ========== //

/**
 * 階層シーケンス実行エンジン
 * 複雑なネスト実行・並列処理・条件分岐を管理
 */
class NestedSequenceExecutor {
    constructor(sequenceCore) {
        this.sequenceCore = sequenceCore;
        this.executionStack = [];      // ネスト実行スタック
        this.parallelTracks = new Map(); // 並列実行トラック管理
        this.maxStackDepth = 10;        // 最大ネスト深度
        
        console.log('🎬 NestedSequenceExecutor 初期化');
    }
    
    /**
     * ネストシーケンス実行
     */
    async executeNestedSequence(sequenceId, executionContext = {}) {
        const sequence = this.sequenceCore.sequences.get(sequenceId);
        if (!sequence) {
            throw new Error(`シーケンスが見つかりません: ${sequenceId}`);
        }
        
        // スタック深度チェック
        if (this.executionStack.length >= this.maxStackDepth) {
            throw new Error(`最大ネスト深度を超えました: ${this.maxStackDepth}`);
        }
        
        // 実行コンテキスト作成
        const context = {
            sequenceId,
            parentContext: this.getCurrentContext(),
            startTime: Date.now(),
            variables: { ...executionContext },
            stackDepth: this.executionStack.length,
            retryCount: 0
        };
        
        // パフォーマンス監視開始
        this.sequenceCore.performanceMonitor.sequenceStartTimes.set(sequenceId, Date.now());
        
        // スタック管理
        this.executionStack.push(context);
        
        try {
            console.log(`🎬 ネストシーケンス実行開始: ${sequence.name} (深度: ${context.stackDepth})`);
            
            await this.executeSequenceSteps(sequence, context);
            
            console.log(`✅ ネストシーケンス完了: ${sequence.name}`);
            
        } catch (error) {
            console.error(`❌ ネストシーケンス実行エラー: ${sequence.name}`, error);
            await this.handleSequenceError(sequence, error, context);
        } finally {
            // スタッククリーンアップ
            this.executionStack.pop();
            
            // パフォーマンス記録
            this.recordPerformanceMetrics(sequenceId, context);
        }
    }
    
    /**
     * シーケンスステップ実行
     */
    async executeSequenceSteps(sequence, context) {
        switch (sequence.executionMode) {
            case 'linear':
                await this.executeLinearSteps(sequence.steps, context);
                break;
            case 'parallel':
                await this.executeParallelSteps(sequence.steps, context);
                break;
            case 'mixed':
                await this.executeMixedSteps(sequence.steps, context);
                break;
            default:
                await this.executeLinearSteps(sequence.steps, context);
        }
    }
    
    /**
     * 線形ステップ実行
     */
    async executeLinearSteps(steps, context) {
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            await this.executeStep(step, { ...context, stepIndex: i });
        }
    }
    
    /**
     * 並列ステップ実行
     */
    async executeParallelSteps(steps, context) {
        const parallelPromises = steps.map(async (step, index) => {
            const trackId = `${context.sequenceId}_track_${index}`;
            this.parallelTracks.set(trackId, { step, context, startTime: Date.now() });
            
            try {
                return await this.executeStep(step, { ...context, trackId, stepIndex: index });
            } catch (error) {
                console.warn(`並列トラック ${trackId} でエラー:`, error);
                return { success: false, error, trackId };
            } finally {
                this.parallelTracks.delete(trackId);
            }
        });
        
        const results = await Promise.allSettled(parallelPromises);
        return this.processParallelResults(results, context);
    }
    
    /**
     * 混合モード実行（線形＋並列組み合わせ）
     */
    async executeMixedSteps(steps, context) {
        let parallelGroup = [];
        
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            
            if (step.parallel) {
                parallelGroup.push(step);
            } else {
                // 前の並列グループを実行
                if (parallelGroup.length > 0) {
                    await this.executeParallelSteps(parallelGroup, context);
                    parallelGroup = [];
                }
                
                // 線形ステップを実行
                await this.executeStep(step, { ...context, stepIndex: i });
            }
        }
        
        // 最後の並列グループを実行
        if (parallelGroup.length > 0) {
            await this.executeParallelSteps(parallelGroup, context);
        }
    }
    
    /**
     * 個別ステップ実行
     */
    async executeStep(step, context) {
        console.log(`🎭 ステップ実行: ${step.action}`);
        
        // 条件分岐処理
        if (step.conditions) {
            const branchResult = this.evaluateConditions(step.conditions, context);
            if (branchResult) {
                // 分岐先シーケンス実行
                return await this.executeNestedSequence(branchResult, context.variables);
            }
        }
        
        // ネストしたシーケンス実行
        if (step.nested) {
            return await this.executeNestedSequence(step.nested, context.variables);
        }
        
        // 基本アクション実行
        return await this.executeAction(step, context);
    }
    
    /**
     * 条件評価
     */
    evaluateConditions(conditions, context) {
        if (typeof conditions.evaluate === 'function') {
            const evaluationResult = conditions.evaluate(context);
            return conditions.branches[evaluationResult] || null;
        }
        return null;
    }
    
    /**
     * 基本アクション実行
     */
    async executeAction(step, context) {
        try {
            // タイムライン制御システム統合
            if (this.sequenceCore.timelineEngine && typeof this.sequenceCore.timelineEngine.executeAction === 'function') {
                return await this.sequenceCore.timelineEngine.executeAction(step, context);
            }
            
            // 同期制御システム統合
            if (this.sequenceCore.syncController && step.sync) {
                return await this.sequenceCore.syncController.executeSyncAction(step, context);
            }
            
            // デフォルト実行（デモ用）
            return await this.executeDefaultAction(step, context);
            
        } catch (error) {
            console.error(`❌ アクション実行エラー: ${step.action}`, error);
            throw error;
        }
    }
    
    /**
     * デフォルトアクション実行（デモ・フォールバック用）
     */
    async executeDefaultAction(step, context) {
        console.log(`🎭 デフォルトアクション実行: ${step.action} (${step.duration}ms)`);
        
        // シンプルな待機処理
        if (step.duration) {
            await new Promise(resolve => setTimeout(resolve, step.duration));
        }
        
        return { success: true, action: step.action, context: context.sequenceId };
    }
    
    /**
     * 並列実行結果処理
     */
    processParallelResults(results, context) {
        const successful = results.filter(result => result.status === 'fulfilled').length;
        const failed = results.length - successful;
        
        console.log(`📊 並列実行結果: 成功${successful}, 失敗${failed}`);
        
        return {
            total: results.length,
            successful,
            failed,
            results: results.map(r => r.value || r.reason)
        };
    }
    
    // ========== エラーハンドリング・パフォーマンス ========== //
    
    /**
     * 現在の実行コンテキスト取得
     */
    getCurrentContext() {
        return this.executionStack.length > 0 ? 
               this.executionStack[this.executionStack.length - 1] : 
               null;
    }
    
    /**
     * シーケンスエラーハンドリング
     */
    async handleSequenceError(sequence, error, context) {
        console.error(`🚨 シーケンスエラー処理: ${sequence.name}`, error);
        
        // ComplexSequenceCore のエラーハンドラーに委譲
        const recovery = this.sequenceCore.handleSequenceError(error, sequence, context);
        
        // 回復戦略の実行
        switch (recovery.action) {
            case 'retry':
                return await this.executeNestedSequence(sequence.id, context.variables);
                
            case 'fallback':
                if (recovery.targetSequence) {
                    return await this.executeNestedSequence(recovery.targetSequence, context.variables);
                }
                break;
                
            case 'continue':
                return { success: false, error, recovered: true };
                
            case 'isolate':
                console.log('⚠️ エラーシーケンス隔離 - 実行継続');
                return { success: false, error, isolated: true };
                
            case 'abort':
            default:
                throw error;
        }
    }
    
    /**
     * パフォーマンスメトリクス記録
     */
    recordPerformanceMetrics(sequenceId, context) {
        const startTime = this.sequenceCore.performanceMonitor.sequenceStartTimes.get(sequenceId);
        if (startTime) {
            const executionTime = Date.now() - startTime;
            this.sequenceCore.performanceMonitor.executionTime.total += executionTime;
            
            console.log(`📊 シーケンス実行時間: ${sequenceId} = ${executionTime}ms`);
            
            this.sequenceCore.performanceMonitor.sequenceStartTimes.delete(sequenceId);
        }
    }
    
    // ========== 状態管理・デバッグ ========== //
    
    /**
     * 実行スタック状態取得
     */
    getExecutionStack() {
        return this.executionStack.map(context => ({
            sequenceId: context.sequenceId,
            stackDepth: context.stackDepth,
            elapsedTime: Date.now() - context.startTime,
            variables: Object.keys(context.variables)
        }));
    }
    
    /**
     * 並列トラック状態取得
     */
    getParallelTracks() {
        const tracks = [];
        this.parallelTracks.forEach((track, trackId) => {
            tracks.push({
                trackId,
                step: track.step.action,
                elapsedTime: Date.now() - track.startTime
            });
        });
        return tracks;
    }
    
    /**
     * システム状態取得
     */
    getSystemStatus() {
        return {
            executionStack: this.getExecutionStack(),
            parallelTracks: this.getParallelTracks(),
            maxStackDepth: this.maxStackDepth,
            currentDepth: this.executionStack.length
        };
    }
    
    /**
     * 実行統計取得
     */
    getExecutionStats() {
        const coreStatus = this.sequenceCore.getSystemStatus();
        const executorStatus = this.getSystemStatus();
        
        return {
            core: coreStatus,
            executor: executorStatus,
            performance: this.sequenceCore.performanceMonitor
        };
    }
    
    /**
     * クリーンアップ
     */
    cleanup() {
        this.executionStack.length = 0;
        this.parallelTracks.clear();
        console.log('🧹 NestedSequenceExecutor クリーンアップ完了');
    }
}

// ========== グローバル登録 ========== //

window.NestedSequenceExecutor = NestedSequenceExecutor;

console.log('✅ Nested Sequence Executor 読み込み完了');