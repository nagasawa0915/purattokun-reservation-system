/**
 * 🎭 Complex Sequence Core Manager
 * 複雑シーケンス基本管理・階層システム
 * 
 * 【技術仕様】
 * - ファイルサイズ: 250行以内
 * - 機能: シーケンス作成・階層管理・循環参照検出
 * - 依存: nested-sequence-executor.js（実行システム）
 * - 統合: timeline-control-engine.js連携
 */

console.log('🎭 Complex Sequence Core Manager 読み込み開始');

// ========== 複雑シーケンス管理エンジン ========== //

/**
 * 複雑シーケンス基本管理エンジン
 * シーケンス作成・階層管理・エラーハンドリング基盤
 */
class ComplexSequenceCore {
    constructor(timelineEngine, syncController, dynamicController) {
        this.timelineEngine = timelineEngine;
        this.syncController = syncController;
        this.dynamicController = dynamicController;
        
        this.sequences = new Map();           // sequenceId -> sequence
        this.activeSequences = new Map();     // sequenceId -> executionState
        this.sequenceHierarchy = new Map();   // parentId -> childSequences[]
        
        this.sequenceCallStack = [];          // ネスト管理スタック
        this.executionContext = new Map();    // 実行コンテキスト
        this.errorRecoveryQueue = [];         // エラー回復キュー
        
        console.log('🎭 ComplexSequenceCore 初期化');
        this.initializeSequenceSystem();
    }
    
    /**
     * シーケンスシステム初期化
     */
    initializeSequenceSystem() {
        // デフォルトエラーハンドラー設定
        this.defaultErrorHandler = {
            onSequenceError: (error, sequence, context) => this.handleSequenceError(error, sequence, context),
            onNestedFailure: (error, parentSequence, childSequence) => this.handleNestedFailure(error, parentSequence, childSequence),
            onDeadlockDetection: (circularRef) => this.resolveDeadlock(circularRef)
        };
        
        // パフォーマンス監視
        this.performanceMonitor = {
            sequenceStartTimes: new Map(),
            memoryUsage: { current: 0, peak: 0 },
            executionTime: { total: 0, average: 0 }
        };
        
        console.log('✅ 複雑シーケンスシステム初期化完了');
    }
    
    // ========== 複雑シーケンス作成・管理 ========== //
    
    /**
     * 複雑シーケンス作成
     */
    createComplexSequence(sequenceConfig) {
        const sequence = {
            id: sequenceConfig.id || 'seq_' + Date.now(),
            name: sequenceConfig.name || 'Unknown Sequence',
            type: sequenceConfig.type || 'linear', // 'linear', 'parallel', 'conditional', 'nested'
            
            // シーケンスステップ定義
            steps: sequenceConfig.steps || [],
            
            // 実行制御
            executionMode: sequenceConfig.executionMode || 'linear',
            repeatMode: sequenceConfig.repeatMode || 'once',
            
            // ネスト対応
            parentSequence: sequenceConfig.parentSequence || null,
            childSequences: sequenceConfig.childSequences || [],
            
            // エラーハンドリング
            errorHandling: sequenceConfig.errorHandling || 'continue',
            fallbackSequence: sequenceConfig.fallbackSequence || null,
            maxRetries: sequenceConfig.maxRetries || 3,
            
            // パフォーマンス設定
            priority: sequenceConfig.priority || 1,
            memoryLimit: sequenceConfig.memoryLimit || 10485760, // 10MB
            timeoutMs: sequenceConfig.timeoutMs || 30000 // 30秒
        };
        
        // 循環参照チェック
        if (this.detectCircularReference(sequence)) {
            throw new Error(`循環参照が検出されました: ${sequence.id}`);
        }
        
        this.sequences.set(sequence.id, sequence);
        
        // 階層関係設定
        if (sequence.parentSequence) {
            this.addToHierarchy(sequence.parentSequence, sequence.id);
        }
        
        console.log(`🎬 複雑シーケンス作成: ${sequence.name} [${sequence.type}]`);
        return sequence;
    }
    
    /**
     * シーケンス削除
     */
    removeSequence(sequenceId) {
        if (!this.sequences.has(sequenceId)) {
            return false;
        }
        
        const sequence = this.sequences.get(sequenceId);
        
        // 子シーケンスも削除
        if (this.sequenceHierarchy.has(sequenceId)) {
            const children = this.sequenceHierarchy.get(sequenceId);
            children.forEach(childId => this.removeSequence(childId));
            this.sequenceHierarchy.delete(sequenceId);
        }
        
        // 親階層から削除
        if (sequence.parentSequence && this.sequenceHierarchy.has(sequence.parentSequence)) {
            const siblings = this.sequenceHierarchy.get(sequence.parentSequence);
            const index = siblings.indexOf(sequenceId);
            if (index >= 0) {
                siblings.splice(index, 1);
            }
        }
        
        this.sequences.delete(sequenceId);
        console.log(`🗑️ シーケンス削除: ${sequenceId}`);
        return true;
    }
    
    /**
     * 階層関係管理
     */
    addToHierarchy(parentId, childId) {
        if (!this.sequenceHierarchy.has(parentId)) {
            this.sequenceHierarchy.set(parentId, []);
        }
        this.sequenceHierarchy.get(parentId).push(childId);
    }
    
    /**
     * 循環参照検出
     */
    detectCircularReference(sequence, visited = new Set()) {
        if (visited.has(sequence.id)) {
            return true;
        }
        
        visited.add(sequence.id);
        
        // 子シーケンスの循環参照チェック
        if (sequence.childSequences.length > 0) {
            for (const childId of sequence.childSequences) {
                const childSequence = this.sequences.get(childId);
                if (childSequence && this.detectCircularReference(childSequence, new Set(visited))) {
                    return true;
                }
            }
        }
        
        // ネストされたシーケンス内の循環参照チェック
        for (const step of sequence.steps) {
            if (step.nested && visited.has(step.nested)) {
                return true;
            }
        }
        
        return false;
    }
    
    // ========== エラーハンドリングシステム ========== //
    
    /**
     * シーケンスエラー処理
     */
    handleSequenceError(error, sequence, context) {
        console.error(`🚨 シーケンスエラー: ${sequence.name}`, error);
        
        const errorInfo = {
            sequenceId: sequence.id,
            error: error,
            context: context,
            timestamp: Date.now()
        };
        
        this.errorRecoveryQueue.push(errorInfo);
        
        // エラー回復戦略実行
        return this.executeErrorRecovery(sequence, error, context);
    }
    
    /**
     * ネスト失敗処理
     */
    handleNestedFailure(error, parentSequence, childSequence) {
        console.error(`🚨 ネスト失敗: ${parentSequence.name} -> ${childSequence.name}`, error);
        
        // 親シーケンスへの影響を最小限に抑制
        if (parentSequence.errorHandling === 'isolate') {
            console.log('⚠️ ネスト失敗を隔離 - 親シーケンス継続');
            return { success: false, isolated: true };
        }
        
        return this.handleSequenceError(error, parentSequence, { nestedFailure: true, childSequence });
    }
    
    /**
     * デッドロック解決
     */
    resolveDeadlock(circularRef) {
        console.error('🚨 デッドロック検出:', circularRef);
        
        // 循環参照チェーンを解析
        const chain = this.analyzeCircularChain(circularRef);
        
        // 最も重要度の低いシーケンスを一時停止
        const victimSequence = this.selectDeadlockVictim(chain);
        if (victimSequence) {
            console.log(`⚠️ デッドロック解決: ${victimSequence.id} を一時停止`);
            this.pauseSequence(victimSequence.id);
            return true;
        }
        
        return false;
    }
    
    /**
     * エラー回復実行
     */
    executeErrorRecovery(sequence, error, context) {
        switch (sequence.errorHandling) {
            case 'retry':
                if (!context.retryCount) context.retryCount = 0;
                if (context.retryCount < sequence.maxRetries) {
                    context.retryCount++;
                    console.log(`🔄 シーケンス再試行 ${context.retryCount}/${sequence.maxRetries}: ${sequence.name}`);
                    return { success: true, action: 'retry' };
                }
                break;
                
            case 'fallback':
                if (sequence.fallbackSequence) {
                    console.log(`🔄 フォールバックシーケンス実行: ${sequence.fallbackSequence}`);
                    return { success: true, action: 'fallback', targetSequence: sequence.fallbackSequence };
                }
                break;
                
            case 'continue':
                console.log('⚠️ エラーを無視して継続');
                return { success: true, action: 'continue' };
                
            case 'isolate':
                console.log('⚠️ エラーシーケンスを隔離');
                return { success: true, action: 'isolate' };
                
            case 'abort':
            default:
                console.log('🛑 シーケンス中断');
                return { success: false, action: 'abort' };
        }
        
        return { success: false, action: 'failed' };
    }
    
    // ========== シーケンス制御 ========== //
    
    /**
     * シーケンス一時停止
     */
    pauseSequence(sequenceId) {
        if (this.activeSequences.has(sequenceId)) {
            const state = this.activeSequences.get(sequenceId);
            state.paused = true;
            state.pauseTime = Date.now();
            console.log(`⏸️ シーケンス一時停止: ${sequenceId}`);
        }
    }
    
    /**
     * シーケンス再開
     */
    resumeSequence(sequenceId) {
        if (this.activeSequences.has(sequenceId)) {
            const state = this.activeSequences.get(sequenceId);
            if (state.paused) {
                state.paused = false;
                const pauseDuration = Date.now() - state.pauseTime;
                state.totalPauseTime = (state.totalPauseTime || 0) + pauseDuration;
                console.log(`▶️ シーケンス再開: ${sequenceId} (一時停止期間: ${pauseDuration}ms)`);
            }
        }
    }
    
    /**
     * 全シーケンス停止
     */
    stopAllSequences() {
        this.activeSequences.clear();
        this.sequenceCallStack.length = 0;
        console.log('🛑 全シーケンス停止');
    }
    
    // ========== ユーティリティ ========== //
    
    /**
     * 循環チェーン分析
     */
    analyzeCircularChain(circularRef) {
        // 循環参照チェーンの詳細分析（簡易実装）
        return circularRef.map(id => this.sequences.get(id)).filter(Boolean);
    }
    
    /**
     * デッドロック犠牲シーケンス選択
     */
    selectDeadlockVictim(chain) {
        // 優先度が最も低いシーケンスを選択
        return chain.sort((a, b) => a.priority - b.priority)[0];
    }
    
    /**
     * システム状態取得
     */
    getSystemStatus() {
        return {
            totalSequences: this.sequences.size,
            activeSequences: this.activeSequences.size,
            hierarchyLevels: this.sequenceHierarchy.size,
            errorQueueSize: this.errorRecoveryQueue.length,
            callStackDepth: this.sequenceCallStack.length
        };
    }
    
    /**
     * パフォーマンス監視情報取得
     */
    getPerformanceInfo() {
        return {
            monitor: this.performanceMonitor,
            systemStatus: this.getSystemStatus()
        };
    }
}

// ========== グローバル登録 ========== //

window.ComplexSequenceCore = ComplexSequenceCore;

console.log('✅ Complex Sequence Core Manager 読み込み完了');