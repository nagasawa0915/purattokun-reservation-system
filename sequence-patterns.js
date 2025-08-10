/**
 * 🎭 Sequence Patterns & Experiments
 * 高度シーケンスパターン集・実験環境・UI統合
 * 
 * 【技術仕様】
 * - ファイルサイズ: 200行以内
 * - 機能: 高度パターン実装・実験UI・timeline-experiment.html統合
 * - 依存: complex-sequence-core.js + nested-sequence-executor.js
 */

console.log('🎭 Sequence Patterns & Experiments 読み込み開始');

// ========== 高度シーケンスパターン実装 ========== //

/**
 * 高度シーケンスパターン集
 * 階層演出・条件分岐・循環パターンを提供
 */
class AdvancedSequencePatterns {
    constructor(complexSequenceCore) {
        this.manager = complexSequenceCore;
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
                { action: 'nested_greeting', duration: 5000, nested: 'greeting_subsequence' },
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
                { action: 'random_micro_action', duration: 1000, nested: 'micro_action_pool' }
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
    if (window.complexSequenceCore && window.nestedExecutor) {
        window.nestedExecutor.executeNestedSequence('demo_welcome', {
            userInteractionType: 'gentle_click',
            testMode: true
        });
        console.log('🎭 ネストシーケンステスト開始');
    }
}

function testParallelSequence() {
    if (window.advancedPatterns) {
        const parallelDemo = window.complexSequenceCore.createComplexSequence({
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
    if (window.complexSequenceCore) {
        console.log('📊 パフォーマンスメトリクス:', window.complexSequenceCore.performanceMonitor);
    }
}

// ========== グローバル初期化システム ========== //

/**
 * 実験環境初期化関数
 */
window.initializeComplexSequencesForExperiment = function() {
    console.log('🎭 実験環境用複雑シーケンスシステム初期化');
    
    try {
        // 基本システム初期化
        window.complexSequenceCore = new window.ComplexSequenceCore(
            window.timelineEngine || null,
            window.timelineSyncCore || null, 
            window.dynamicController || null
        );
        
        window.nestedExecutor = new window.NestedSequenceExecutor(window.complexSequenceCore);
        window.advancedPatterns = new AdvancedSequencePatterns(window.complexSequenceCore);
        
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

// ========== グローバル登録 ========== //

window.AdvancedSequencePatterns = AdvancedSequencePatterns;

// テスト関数をグローバルに公開
window.testNestedSequence = testNestedSequence;
window.testParallelSequence = testParallelSequence;
window.testConditionalSequence = testConditionalSequence;
window.runWelcomeDemo = runWelcomeDemo;
window.debugSequenceStack = debugSequenceStack;
window.showPerformanceMetrics = showPerformanceMetrics;

console.log('✅ Sequence Patterns & Experiments 読み込み完了');