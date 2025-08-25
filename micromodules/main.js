// 🎯 Micromodules Integration System - v3.0システム完全移植マイクロモジュール統合
// 設計原則: 4つの独立モジュールを協調動作させるメインシステム

console.log('🚀 Micromodules Integration System 起動');

/**
 * Spineキャラクター管理システム統合制御
 * v3.0の3,590行システムをマイクロモジュール化した統合管理システム
 * 
 * 統合仕様:
 * - CharacterGenerator: キャラクター生成・検出・管理
 * - PositioningSystem: 座標・配置・スワップ技術
 * - AnimationSequencer: アニメーション・タイミング制御
 * - InteractionHandler: ユーザー操作・インタラクション処理
 * 
 * 出力仕様:
 * {
 *   systemId: "sys_001",
 *   modules: ["character-generator", "positioning-system", "animation-sequencer", "interaction-handler"],
 *   integrationLevel: "full",
 *   operationMode: "collaborative"
 * }
 */
class SpineMicromoduleSystem {
    constructor() {
        // 統合システムの基本構成
        this.systemId = `sys_${Date.now()}`;
        this.modules = new Map();
        this.integrationState = new Map();
        this.operationHistory = [];
        this.isInitialized = false;
        
        // モジュール間協調設定
        this.collaborationConfig = {
            autoSync: true,
            errorTolerance: 'graceful',
            fallbackMode: 'independent',
            communicationProtocol: 'event-driven'
        };
        
        // v3.0互換性設定
        this.v3Compatibility = {
            characterSelection: true,
            coordinateSwap: true,
            animationTransition: true,
            keyboardControl: true
        };
    }

    /**
     * システム初期化・4モジュール統合
     * @param {Object} config - 初期化設定
     * @returns {Object} 初期化結果
     */
    async initialize(config = {}) {
        console.log('🔧 Micromodule System 初期化開始', config);

        try {
            // 4つのマイクロモジュール初期化
            await this.initializeModules(config);
            
            // モジュール間協調設定
            this.setupIntermoduleCommunication();
            
            // v3.0互換機能セットアップ
            this.setupV3Compatibility();
            
            // 統合動作テスト
            const testResult = await this.performIntegrationTest();
            
            this.isInitialized = true;
            
            const result = {
                systemId: this.systemId,
                modules: Array.from(this.modules.keys()),
                integrationLevel: 'full',
                operationMode: 'collaborative',
                testResult: testResult,
                initializedAt: Date.now()
            };

            console.log('✅ Micromodule System 初期化完了', result);
            return result;

        } catch (error) {
            console.error('❌ 初期化エラー:', error);
            return null;
        }
    }

    /**
     * 4つのマイクロモジュール初期化
     * @param {Object} config - 設定
     */
    async initializeModules(config) {
        console.log('🎯 4つのマイクロモジュール初期化');

        // 1. Character Generator初期化
        const characterGenerator = new CharacterGenerator();
        this.modules.set('character-generator', characterGenerator);
        console.log('✅ CharacterGenerator 初期化完了');

        // 2. Positioning System初期化
        const positioningSystem = new PositioningSystem();
        this.modules.set('positioning-system', positioningSystem);
        console.log('✅ PositioningSystem 初期化完了');

        // 3. Animation Sequencer初期化
        const animationSequencer = new AnimationSequencer();
        this.modules.set('animation-sequencer', animationSequencer);
        console.log('✅ AnimationSequencer 初期化完了');

        // 4. Interaction Handler初期化
        const interactionHandler = new InteractionHandler();
        this.modules.set('interaction-handler', interactionHandler);
        console.log('✅ InteractionHandler 初期化完了');

        // 統合状態記録
        this.integrationState.set('modules_loaded', Date.now());
    }

    /**
     * v3.0完全互換ワークフロー実行
     * @param {Object} input - ワークフロー設定
     * @returns {Object} 実行結果
     */
    async executeV3Workflow(input) {
        console.log('🎬 v3.0互換ワークフロー実行開始', input);

        const workflowId = `workflow_${Date.now()}`;
        const results = {};

        try {
            // Step 1: キャラクター検出・生成
            if (input.characterOperations) {
                results.characters = await this.processCharacterOperations(input.characterOperations);
            }

            // Step 2: 座標配置・スワップ処理
            if (input.positioningOperations) {
                results.positioning = await this.processPositioningOperations(input.positioningOperations);
            }

            // Step 3: アニメーション実行
            if (input.animationOperations) {
                results.animations = await this.processAnimationOperations(input.animationOperations);
            }

            // Step 4: インタラクション処理
            if (input.interactionOperations) {
                results.interactions = await this.processInteractionOperations(input.interactionOperations);
            }

            // ワークフロー結果統合
            const workflowResult = {
                workflowId: workflowId,
                status: 'completed',
                results: results,
                executedAt: Date.now(),
                v3CompatibilityLevel: 'full'
            };

            this.recordOperation(workflowId, 'workflow', input, workflowResult);

            console.log('✅ v3.0互換ワークフロー実行完了', workflowResult);
            return workflowResult;

        } catch (error) {
            console.error('❌ ワークフロー実行エラー:', error);
            return {
                workflowId: workflowId,
                status: 'failed',
                error: error.message,
                executedAt: Date.now()
            };
        }
    }

    /**
     * キャラクター操作処理
     * @param {Object} operations - キャラクター操作
     * @returns {Object} 処理結果
     */
    async processCharacterOperations(operations) {
        console.log('👥 キャラクター操作処理', operations);

        const characterModule = this.modules.get('character-generator');
        const results = [];

        for (const operation of operations) {
            switch (operation.type) {
                case 'detect':
                    const detected = characterModule.detectExistingCharacters();
                    results.push({ type: 'detect', result: detected });
                    break;
                
                case 'generate':
                    const generated = characterModule.generate(operation.config);
                    results.push({ type: 'generate', result: generated });
                    break;
                
                case 'select':
                    // キャラクター選択（v3.0互換）
                    const selected = this.selectCharacter(operation.characterId);
                    results.push({ type: 'select', result: selected });
                    break;
            }
        }

        return {
            operationType: 'character',
            operations: results,
            processedAt: Date.now()
        };
    }

    /**
     * 座標配置操作処理
     * @param {Object} operations - 座標操作
     * @returns {Object} 処理結果
     */
    async processPositioningOperations(operations) {
        console.log('📐 座標配置操作処理', operations);

        const positioningModule = this.modules.get('positioning-system');
        const results = [];

        for (const operation of operations) {
            switch (operation.type) {
                case 'calculate':
                    const calculated = positioningModule.calculatePosition(operation.config);
                    results.push({ type: 'calculate', result: calculated });
                    break;
                
                case 'enterEdit':
                    // v3.0座標スワップ技術
                    const swapped = positioningModule.enterEditMode(operation.elementData);
                    results.push({ type: 'enterEdit', result: swapped });
                    break;
                
                case 'exitEdit':
                    // v3.0座標復元技術
                    const restored = positioningModule.exitEditMode(operation.characterId, operation.editedData);
                    results.push({ type: 'exitEdit', result: restored });
                    break;
            }
        }

        return {
            operationType: 'positioning',
            operations: results,
            processedAt: Date.now()
        };
    }

    /**
     * アニメーション操作処理
     * @param {Object} operations - アニメーション操作
     * @returns {Object} 処理結果
     */
    async processAnimationOperations(operations) {
        console.log('🎬 アニメーション操作処理', operations);

        const animationModule = this.modules.get('animation-sequencer');
        const results = [];

        for (const operation of operations) {
            switch (operation.type) {
                case 'sequence':
                    const sequence = animationModule.generateSequence(operation.config);
                    const execution = animationModule.executeSequence(sequence.sequenceId);
                    results.push({ 
                        type: 'sequence', 
                        sequence: sequence,
                        execution: execution 
                    });
                    break;
                
                case 'timing':
                    const timing = animationModule.calculateTiming(operation.config);
                    results.push({ type: 'timing', result: timing });
                    break;
                
                case 'transition':
                    // v3.0自然遷移アニメーション
                    const transition = this.processV3Transition(operation.config);
                    results.push({ type: 'transition', result: transition });
                    break;
            }
        }

        return {
            operationType: 'animation',
            operations: results,
            processedAt: Date.now()
        };
    }

    /**
     * インタラクション操作処理
     * @param {Object} operations - インタラクション操作
     * @returns {Object} 処理結果
     */
    async processInteractionOperations(operations) {
        console.log('🖱️ インタラクション操作処理', operations);

        const interactionModule = this.modules.get('interaction-handler');
        const results = [];

        for (const operation of operations) {
            const result = interactionModule.processInteraction(operation.config);
            results.push({ 
                type: operation.type, 
                result: result,
                operationId: operation.id || `op_${Date.now()}`
            });
        }

        return {
            operationType: 'interaction',
            operations: results,
            processedAt: Date.now()
        };
    }

    /**
     * v3.0自然遷移アニメーション処理
     * @param {Object} config - 遷移設定
     * @returns {Object} 遷移結果
     */
    processV3Transition(config) {
        const animationModule = this.modules.get('animation-sequencer');
        
        // v3.0の自然遷移パターン実行
        const transitionSequence = animationModule.generateSequence({
            characterId: config.characterId,
            animationName: config.fromAnimation,
            sequenceType: 'transition',
            timingConfig: {
                delay: config.delay || 0,
                duration: config.duration || 2000,
                loop: false
            }
        });

        return animationModule.executeSequence(transitionSequence.sequenceId);
    }

    /**
     * モジュール間協調通信セットアップ
     */
    setupIntermoduleCommunication() {
        console.log('🔗 モジュール間協調通信セットアップ');

        // キャラクター選択時の自動連携
        this.setupCharacterSelectionSync();
        
        // ドラッグ操作時の座標・アニメーション連携
        this.setupDragOperationSync();
        
        // アニメーション完了時の状態同期
        this.setupAnimationCompletionSync();
        
        console.log('✅ モジュール間協調通信セットアップ完了');
    }

    /**
     * キャラクター選択同期設定
     */
    setupCharacterSelectionSync() {
        // キャラクター選択時に他モジュールに通知
        this.registerEventHandler('character-selected', (characterId) => {
            console.log('🎯 キャラクター選択同期:', characterId);
            
            // アニメーションモジュールに通知
            const animationModule = this.modules.get('animation-sequencer');
            // ポジショニングモジュールに通知
            const positioningModule = this.modules.get('positioning-system');
            // インタラクションモジュールに通知
            const interactionModule = this.modules.get('interaction-handler');
            
            // 選択されたキャラクターの状態を各モジュールで管理
            this.integrationState.set('selectedCharacter', characterId);
        });
    }

    /**
     * ドラッグ操作同期設定
     */
    setupDragOperationSync() {
        // ドラッグ開始時の座標スワップ自動実行
        this.registerEventHandler('drag-start', (dragData) => {
            console.log('🖱️ ドラッグ開始同期:', dragData);
            
            const positioningModule = this.modules.get('positioning-system');
            
            // v3.0座標スワップを自動実行
            const swapped = positioningModule.enterEditMode({
                characterId: dragData.targetId,
                left: dragData.startPosition.x + 'px',
                top: dragData.startPosition.y + 'px',
                width: dragData.elementSize.width + 'px',
                height: dragData.elementSize.height + 'px',
                transform: dragData.transform || 'translate(-50%, -50%)'
            });
            
            this.integrationState.set('dragSwapState', swapped);
        });

        // ドラッグ終了時の座標復元自動実行
        this.registerEventHandler('drag-end', (dragData) => {
            console.log('🖱️ ドラッグ終了同期:', dragData);
            
            const positioningModule = this.modules.get('positioning-system');
            
            // v3.0座標復元を自動実行
            const restored = positioningModule.exitEditMode(dragData.targetId, {
                left: dragData.finalPosition.x,
                top: dragData.finalPosition.y,
                width: dragData.elementSize.width,
                height: dragData.elementSize.height
            });
            
            this.integrationState.delete('dragSwapState');
        });
    }

    /**
     * アニメーション完了同期設定
     */
    setupAnimationCompletionSync() {
        // アニメーション完了時の状態更新
        this.registerEventHandler('animation-completed', (animationData) => {
            console.log('🎬 アニメーション完了同期:', animationData);
            
            // キャラクターの状態を更新
            this.integrationState.set(`character_${animationData.characterId}_animation`, 'idle');
        });
    }

    /**
     * v3.0互換機能セットアップ
     */
    setupV3Compatibility() {
        console.log('🔄 v3.0互換機能セットアップ');

        // v3.0の主要機能マッピング
        this.v3FunctionMapping = {
            // 従来のキャラクター管理
            'MultiCharacterManager': 'character-generator',
            'SpineEditSystem.coordinateSwap': 'positioning-system',
            'SpineAnimationController': 'animation-sequencer',
            'handleMouseDown/Move/Up': 'interaction-handler'
        };

        console.log('✅ v3.0互換機能セットアップ完了');
    }

    /**
     * キャラクター選択（v3.0互換）
     * @param {string} characterId - キャラクターID
     * @returns {Object} 選択結果
     */
    selectCharacter(characterId) {
        console.log('👆 キャラクター選択:', characterId);

        const characterModule = this.modules.get('character-generator');
        
        // キャラクター存在確認
        const existingCharacters = characterModule.detectExistingCharacters();
        const selectedCharacter = existingCharacters.find(char => char.characterId === characterId);

        if (selectedCharacter) {
            // 選択イベント発火
            this.triggerEvent('character-selected', characterId);
            
            return {
                characterId: characterId,
                selected: true,
                character: selectedCharacter,
                selectedAt: Date.now()
            };
        } else {
            return {
                characterId: characterId,
                selected: false,
                error: 'Character not found',
                selectedAt: Date.now()
            };
        }
    }

    /**
     * 統合動作テスト
     * @returns {Object} テスト結果
     */
    async performIntegrationTest() {
        console.log('🧪 統合動作テスト実行');

        const testResults = {};

        try {
            // 各モジュールの単独テスト
            testResults.characterGenerator = CharacterGenerator.test();
            testResults.positioningSystem = PositioningSystem.test();
            testResults.animationSequencer = AnimationSequencer.test();
            testResults.interactionHandler = InteractionHandler.test();

            // 統合協調テスト
            testResults.integration = await this.testModuleIntegration();

            const allPassed = Object.values(testResults).every(result => result === true);

            return {
                allTestsPassed: allPassed,
                individualTests: testResults,
                testedAt: Date.now()
            };

        } catch (error) {
            console.error('❌ 統合テストエラー:', error);
            return {
                allTestsPassed: false,
                error: error.message,
                testedAt: Date.now()
            };
        }
    }

    /**
     * モジュール統合テスト
     * @returns {boolean} テスト結果
     */
    async testModuleIntegration() {
        console.log('🔗 モジュール統合テスト');

        try {
            // テスト1: キャラクター検出→座標計算の連携
            const testCharacters = this.modules.get('character-generator').detectExistingCharacters();
            if (testCharacters.length > 0) {
                const testPosition = this.modules.get('positioning-system').calculatePosition({
                    characterId: testCharacters[0].characterId,
                    baseX: 100,
                    baseY: 100,
                    placementPattern: 'manual'
                });
                
                if (!testPosition) {
                    throw new Error('キャラクター→座標計算連携テスト失敗');
                }
            }

            // テスト2: アニメーション→インタラクション連携
            const testSequence = this.modules.get('animation-sequencer').generateSequence({
                characterId: 'test_integration',
                animationName: 'taiki',
                sequenceType: 'single',
                timingConfig: { duration: 1000, loop: false }
            });

            const testInteraction = this.modules.get('interaction-handler').processInteraction({
                interactionType: 'click',
                targetId: 'test_integration',
                eventData: { clientX: 100, clientY: 100 }
            });

            if (!testSequence || !testInteraction) {
                throw new Error('アニメーション→インタラクション連携テスト失敗');
            }

            console.log('✅ モジュール統合テスト成功');
            return true;

        } catch (error) {
            console.error('❌ モジュール統合テスト失敗:', error);
            return false;
        }
    }

    /**
     * イベントハンドラー登録
     * @param {string} eventName - イベント名
     * @param {Function} handler - ハンドラー関数
     */
    registerEventHandler(eventName, handler) {
        if (!this.eventHandlers) {
            this.eventHandlers = new Map();
        }
        
        if (!this.eventHandlers.has(eventName)) {
            this.eventHandlers.set(eventName, []);
        }
        
        this.eventHandlers.get(eventName).push(handler);
    }

    /**
     * イベント発火
     * @param {string} eventName - イベント名
     * @param {*} data - イベントデータ
     */
    triggerEvent(eventName, data) {
        if (this.eventHandlers && this.eventHandlers.has(eventName)) {
            this.eventHandlers.get(eventName).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`❌ イベントハンドラーエラー (${eventName}):`, error);
                }
            });
        }
    }

    /**
     * 操作記録
     * @param {string} operationId - 操作ID
     * @param {string} type - 操作タイプ
     * @param {Object} input - 入力データ
     * @param {Object} result - 結果データ
     */
    recordOperation(operationId, type, input, result) {
        const record = {
            operationId: operationId,
            type: type,
            input: input,
            result: result,
            timestamp: Date.now()
        };

        this.operationHistory.push(record);

        // 履歴サイズ制限（最新500件まで）
        if (this.operationHistory.length > 500) {
            this.operationHistory.shift();
        }
    }

    /**
     * システム状態取得
     * @returns {Object} システム状態
     */
    getSystemState() {
        const moduleStates = {};
        for (const [name, module] of this.modules) {
            if (typeof module.getState === 'function') {
                moduleStates[name] = module.getState();
            }
        }

        return {
            systemId: this.systemId,
            isInitialized: this.isInitialized,
            modules: Array.from(this.modules.keys()),
            moduleStates: moduleStates,
            integrationState: Object.fromEntries(this.integrationState),
            operationHistoryLength: this.operationHistory.length,
            lastOperation: this.operationHistory[this.operationHistory.length - 1] || null
        };
    }

    /**
     * 完全クリーンアップ
     */
    cleanup() {
        console.log('🧹 Micromodule System クリーンアップ実行');

        // 各モジュールのクリーンアップ
        for (const [name, module] of this.modules) {
            if (typeof module.cleanup === 'function') {
                module.cleanup();
            }
        }

        this.modules.clear();
        this.integrationState.clear();
        this.operationHistory = [];
        this.eventHandlers?.clear();
        this.isInitialized = false;

        console.log('✅ Micromodule System クリーンアップ完了');
    }

    /**
     * 単独テスト（統合システム）
     * @returns {boolean} テスト結果
     */
    static async test() {
        console.log('🧪 Micromodule System 統合テスト開始');
        
        try {
            const system = new SpineMicromoduleSystem();

            // 初期化テスト
            const initResult = await system.initialize();
            if (!initResult || !initResult.testResult.allTestsPassed) {
                throw new Error('システム初期化テスト失敗');
            }

            // v3.0ワークフローテスト
            const workflowResult = await system.executeV3Workflow({
                characterOperations: [
                    { type: 'detect' }
                ],
                positioningOperations: [
                    { 
                        type: 'calculate', 
                        config: { 
                            characterId: 'test_sys', 
                            baseX: 100, 
                            baseY: 100, 
                            placementPattern: 'manual' 
                        } 
                    }
                ],
                animationOperations: [
                    { 
                        type: 'sequence', 
                        config: { 
                            characterId: 'test_sys', 
                            animationName: 'taiki', 
                            sequenceType: 'single',
                            timingConfig: { duration: 1000 }
                        } 
                    }
                ],
                interactionOperations: [
                    { 
                        type: 'click', 
                        config: { 
                            interactionType: 'click', 
                            targetId: 'test_sys', 
                            eventData: { clientX: 100, clientY: 100 } 
                        } 
                    }
                ]
            });

            if (!workflowResult || workflowResult.status !== 'completed') {
                throw new Error('v3.0ワークフローテスト失敗');
            }

            // クリーンアップテスト
            system.cleanup();
            const state = system.getSystemState();
            
            if (state.modules.length !== 0 || state.operationHistoryLength !== 0) {
                throw new Error('クリーンアップテスト失敗');
            }

            console.log('✅ Micromodule System 統合テスト成功');
            return true;

        } catch (error) {
            console.error('❌ Micromodule System 統合テスト失敗:', error);
            return false;
        }
    }
}

// システムエクスポート（環境非依存）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpineMicromoduleSystem;
} else {
    window.SpineMicromoduleSystem = SpineMicromoduleSystem;
}

console.log('✅ Micromodules Integration System 読み込み完了');