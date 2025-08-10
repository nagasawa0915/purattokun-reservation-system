/**
 * 🎭 Complex Timeline Sequence Manager
 * 複雑シーケンス管理・ネスト対応システム
 * 
 * 【技術仕様】
 * - ファイルサイズ: 450行以内
 * - 機能: ネストしたタイムラインシーケンス・並列実行・階層管理
 * - 統合: timeline-control-engine.js, timeline-character-sync.js統合
 * - 商用品質: 大規模演出・複雑なシーケンス制御・エラー回復機能
 */

console.log('🎭 Complex Timeline Sequence Manager 読み込み開始');

// ========== 複雑シーケンス管理エンジン ========== //

/**
 * 複雑シーケンス管理エンジン
 * ネストしたタイムラインシーケンス・並列実行・階層管理
 */
class ComplexSequenceManager {
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
        
        console.log('🎭 ComplexSequenceManager 初期化');
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
}

// ========== ネスト実行システム ========== //

/**
 * 階層シーケンス実行エンジン
 */
class NestedSequenceExecutor {
    constructor(sequenceManager) {
        this.sequenceManager = sequenceManager;
        this.executionStack = [];      // ネスト実行スタック
        this.parallelTracks = new Map(); // 並列実行トラック管理
        this.maxStackDepth = 10;        // 最大ネスト深度
        
        console.log('🎬 NestedSequenceExecutor 初期化');
    }
    
    /**
     * ネストシーケンス実行
     */
    async executeNestedSequence(sequenceId, executionContext = {}) {
        const sequence = this.sequenceManager.sequences.get(sequenceId);
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
        this.sequenceManager.performanceMonitor.sequenceStartTimes.set(sequenceId, Date.now());
        
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
            if (this.sequenceManager.timelineEngine && typeof this.sequenceManager.timelineEngine.executeAction === 'function') {
                return await this.sequenceManager.timelineEngine.executeAction(step, context);
            }
            
            // 同期制御システム統合
            if (this.sequenceManager.syncController && step.sync) {
                return await this.sequenceManager.syncController.executeSyncAction(step, context);
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
        
        // エラー回復戦略
        switch (sequence.errorHandling) {
            case 'retry':
                if (context.retryCount < sequence.maxRetries) {
                    context.retryCount++;
                    console.log(`🔄 リトライ ${context.retryCount}/${sequence.maxRetries}: ${sequence.name}`);
                    return await this.executeNestedSequence(sequence.id, context.variables);
                }
                break;
                
            case 'fallback':
                if (sequence.fallbackSequence) {
                    console.log(`🔄 フォールバック実行: ${sequence.fallbackSequence}`);
                    return await this.executeNestedSequence(sequence.fallbackSequence, context.variables);
                }
                break;
                
            case 'continue':
                console.log('⚠️ エラーを無視して継続');
                return { success: false, error, recovered: true };
                
            case 'abort':
            default:
                console.log('🛑 シーケンス中断');
                throw error;
        }
    }
    
    /**
     * パフォーマンスメトリクス記録
     */
    recordPerformanceMetrics(sequenceId, context) {
        const startTime = this.sequenceManager.performanceMonitor.sequenceStartTimes.get(sequenceId);
        if (startTime) {
            const executionTime = Date.now() - startTime;
            this.sequenceManager.performanceMonitor.executionTime.total += executionTime;
            
            console.log(`📊 シーケンス実行時間: ${sequenceId} = ${executionTime}ms`);
            
            this.sequenceManager.performanceMonitor.sequenceStartTimes.delete(sequenceId);
        }
    }
}

// ========== 高度シーケンスパターン実装 ========== //

/**
 * 高度シーケンスパターン集
 */
class AdvancedSequencePatterns {
    constructor(complexSequenceManager) {
        this.manager = complexSequenceManager;
        
        console.log('🎭 AdvancedSequencePatterns 初期化');
    }
    
    /**
     * パターン1: 階層演出シーケンス
     */
    setupHierarchicalPerformances() {
        // メインシーケンス: 歓迎演出
        const welcomeSequence = this.manager.createComplexSequence({
            id: 'welcome_performance',
            name: '歓迎演出',
            type: 'nested',
            executionMode: 'mixed',
            steps: [
                { action: 'entrance', duration: 2000 },
                { 
                    action: 'nested_greeting', 
                    duration: 5000,
                    nested: 'greeting_subsequence'
                },
                { action: 'settle_idle', duration: 1000 }
            ]
        });
        
        // 子シーケンス: 挨拶演出
        const greetingSubsequence = this.manager.createComplexSequence({
            id: 'greeting_subsequence',
            name: '挨拶サブシーケンス',
            type: 'parallel',
            parentSequence: 'welcome_performance',
            steps: [
                { action: 'wave', duration: 2000, parallel: true },
                { action: 'vocal_greeting', duration: 1500, parallel: true },
                { action: 'eye_contact', duration: 3000, parallel: true }
            ]
        });
        
        console.log('✅ 階層演出シーケンスセットアップ完了');
        return { welcomeSequence, greetingSubsequence };
    }
    
    /**
     * パターン2: 条件分岐シーケンス
     */
    setupConditionalSequences() {
        const adaptiveSequence = this.manager.createComplexSequence({
            id: 'adaptive_reaction',
            name: '適応反応シーケンス',
            type: 'conditional',
            executionMode: 'linear',
            steps: [
                {
                    action: 'analyze_context',
                    duration: 100,
                    conditions: {
                        evaluate: (context) => context.variables.userInteractionType || 'gentle_click',
                        branches: {
                            'gentle_click': 'gentle_reaction_sequence',
                            'rapid_click': 'excited_reaction_sequence',
                            'long_press': 'calm_reaction_sequence'
                        }
                    }
                }
            ]
        });
        
        // 分岐先シーケンス群
        const branches = ['gentle_reaction_sequence', 'excited_reaction_sequence', 'calm_reaction_sequence'];
        branches.forEach(branchId => {
            this.manager.createComplexSequence({
                id: branchId,
                name: branchId.replace('_', ' ').toUpperCase(),
                type: 'linear',
                parentSequence: 'adaptive_reaction',
                steps: [
                    { action: branchId.split('_')[0], duration: 1500 },
                    { action: 'return_to_idle', duration: 1000 }
                ]
            });
        });
        
        console.log('✅ 条件分岐シーケンスセットアップ完了');
        return adaptiveSequence;
    }
    
    /**
     * パターン3: 循環・反復シーケンス
     */
    setupLoopingSequences() {
        const ambientSequence = this.manager.createComplexSequence({
            id: 'ambient_behavior',
            name: '環境演出ループ',
            type: 'nested',
            executionMode: 'linear',
            repeatMode: 'loop',
            steps: [
                { action: 'idle_variation_1', duration: 3000 },
                { action: 'look_around', duration: 1500 },
                { action: 'idle_variation_2', duration: 4000 },
                { 
                    action: 'random_micro_action',
                    duration: 1000,
                    nested: 'micro_action_pool'
                }
            ]
        });
        
        // マイクロアクションプール
        const microActionPool = this.manager.createComplexSequence({
            id: 'micro_action_pool',
            name: 'マイクロアクションプール',
            type: 'conditional',
            parentSequence: 'ambient_behavior',
            steps: [
                {
                    action: 'random_selector',
                    conditions: {
                        evaluate: () => ['blink', 'stretch', 'yawn'][Math.floor(Math.random() * 3)],
                        branches: {
                            'blink': 'blink_sequence',
                            'stretch': 'stretch_sequence', 
                            'yawn': 'yawn_sequence'
                        }
                    }
                }
            ]
        });
        
        console.log('✅ 循環・反復シーケンスセットアップ完了');
        return { ambientSequence, microActionPool };
    }
}

// ========== timeline-experiment.html統合機能 ========== //

/**
 * 複雑シーケンステスト機能
 */
function setupComplexSequenceExperiments() {
    console.log('🎭 複雑シーケンス実験環境セットアップ開始');
    
    const complexSequenceControls = `
        <div class="control-section complex-sequence-controls">
            <h4>🎭 複雑シーケンス管理</h4>
            <button class="btn btn-primary" onclick="testNestedSequence()">ネストシーケンステスト</button>
            <button class="btn btn-primary" onclick="testParallelSequence()">並列実行テスト</button>
            <button class="btn btn-secondary" onclick="testConditionalSequence()">条件分岐テスト</button>
            <button class="btn btn-secondary" onclick="testHierarchicalSequence()">階層シーケンステスト</button>
            <button class="btn btn-warning" onclick="testSequenceRecovery()">エラー回復テスト</button>
            <button class="btn" onclick="debugSequenceStack()">🔍 実行スタック確認</button>
            <button class="btn" onclick="showPerformanceMetrics()">📊 パフォーマンス確認</button>
        </div>
        <div class="control-section">
            <h5>🎮 デモシーケンス</h5>
            <button class="btn btn-success" onclick="runWelcomeDemo()">歓迎演出デモ</button>
            <button class="btn btn-success" onclick="runAdaptiveDemo()">適応反応デモ</button>
            <button class="btn btn-success" onclick="runAmbientDemo()">環境演出デモ</button>
        </div>
    `;
    
    const controlSection = document.querySelector('.timeline-controls');
    if (controlSection) {
        controlSection.insertAdjacentHTML('beforeend', complexSequenceControls);
        console.log('✅ 複雑シーケンス制御UI追加完了');
    } else {
        console.log('⚠️ .timeline-controls が見つかりません');
    }
}

// ========== テスト関数群 ========== //

function testNestedSequence() {
    if (window.complexSequenceManager && window.nestedExecutor) {
        window.nestedExecutor.executeNestedSequence('demo_welcome', {
            userInteractionType: 'gentle_click',
            testMode: true
        });
        console.log('🎭 ネストシーケンステスト開始');
    }
}

function testParallelSequence() {
    if (window.advancedPatterns) {
        const parallelDemo = window.complexSequenceManager.createComplexSequence({
            id: 'parallel_demo',
            name: '並列実行デモ',
            type: 'parallel',
            executionMode: 'parallel',
            steps: [
                { action: 'action_1', duration: 2000, parallel: true },
                { action: 'action_2', duration: 1500, parallel: true },
                { action: 'action_3', duration: 2500, parallel: true }
            ]
        });
        
        window.nestedExecutor.executeNestedSequence('parallel_demo');
        console.log('🎭 並列実行テスト開始');
    }
}

function testConditionalSequence() {
    if (window.nestedExecutor) {
        const interactionTypes = ['gentle_click', 'rapid_click', 'long_press'];
        const randomType = interactionTypes[Math.floor(Math.random() * interactionTypes.length)];
        
        window.nestedExecutor.executeNestedSequence('adaptive_reaction', {
            userInteractionType: randomType
        });
        console.log(`🎭 条件分岐テスト開始: ${randomType}`);
    }
}

function runWelcomeDemo() {
    if (window.nestedExecutor) {
        window.nestedExecutor.executeNestedSequence('welcome_performance');
        console.log('🎭 歓迎演出デモ開始');
    }
}

function debugSequenceStack() {
    if (window.nestedExecutor) {
        console.log('🔍 実行スタック状態:', {
            stackDepth: window.nestedExecutor.executionStack.length,
            currentContexts: window.nestedExecutor.executionStack.map(ctx => ({
                sequenceId: ctx.sequenceId,
                stackDepth: ctx.stackDepth,
                elapsedTime: Date.now() - ctx.startTime
            }))
        });
    }
}

function showPerformanceMetrics() {
    if (window.complexSequenceManager) {
        console.log('📊 パフォーマンスメトリクス:', window.complexSequenceManager.performanceMonitor);
    }
}

// ========== グローバル登録・初期化システム ========== //

window.ComplexSequenceManager = ComplexSequenceManager;
window.NestedSequenceExecutor = NestedSequenceExecutor;
window.AdvancedSequencePatterns = AdvancedSequencePatterns;

/**
 * 実験環境初期化関数
 */
window.initializeComplexSequencesForExperiment = function() {
    console.log('🎭 実験環境用複雑シーケンスシステム初期化');
    
    try {
        // 基本システム初期化
        window.complexSequenceManager = new ComplexSequenceManager(
            window.timelineEngine || null,
            window.advancedSyncController || null, 
            window.dynamicController || null
        );
        
        window.nestedExecutor = new NestedSequenceExecutor(window.complexSequenceManager);
        window.advancedPatterns = new AdvancedSequencePatterns(window.complexSequenceManager);
        
        // デモシーケンス作成
        window.advancedPatterns.setupHierarchicalPerformances();
        window.advancedPatterns.setupConditionalSequences();
        window.advancedPatterns.setupLoopingSequences();
        
        // UI追加
        setupComplexSequenceExperiments();
        
        console.log('✅ 複雑シーケンスシステム初期化完了');
        
    } catch (error) {
        console.error('❌ 複雑シーケンスシステム初期化エラー:', error);
    }
};

// 自動初期化
document.addEventListener('DOMContentLoaded', () => {
    if (document.title.includes('タイムライン制御システム')) {
        setTimeout(() => {
            window.initializeComplexSequencesForExperiment?.();
        }, 1500);
    }
});

console.log('✅ Complex Timeline Sequence Manager 読み込み完了');