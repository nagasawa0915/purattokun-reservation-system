/**
 * TwoStageSelector.js
 * 
 * 🎯 2段階ピン設定UI統合システム
 * - 責務: Stage 1 (ElementHighlighter) + Stage 2 (ElementSelector) の統合制御
 * - 戦略: シームレスな2段階ワークフロー + 効率的ピンシステムv2.0統合
 * - 目標: 最高のユーザー体験・プロフェッショナルピン設定ツール
 */

class TwoStageSelector {
    constructor() {
        console.log('🎯 TwoStageSelector 統合システム初期化開始');
        
        // ステージ管理
        this.currentStage = 'idle'; // 'idle' | 'selecting' | 'positioning'
        this.selectedElement = null;
        
        // モジュール管理
        this.elementHighlighter = null;
        this.elementSelector = null;
        this.efficientPinSystem = null;
        
        // 設定
        this.config = {
            enableAutoTransition: true,   // 自動ステージ遷移
            showStageIndicator: true,     // ステージインジケーター表示
            enableKeyboardShortcuts: true, // キーボードショートカット
            debugMode: false              // デバッグモード
        };
        
        // コールバック
        this.onPinCompleted = null;
        this.onProcessCancelled = null;
        
        // ステージインジケーター
        this.stageIndicator = null;
        
        this.initializeSystem();
        console.log('✅ TwoStageSelector 統合システム初期化完了');
    }
    
    /**
     * 🏗️ システム初期化
     */
    initializeSystem() {
        // 必要なモジュールの存在確認
        this.checkModuleAvailability();
        
        // ステージインジケーター作成
        if (this.config.showStageIndicator) {
            this.createStageIndicator();
        }
        
        // キーボードショートカット設定
        if (this.config.enableKeyboardShortcuts) {
            this.setupKeyboardShortcuts();
        }
        
        // スタイル初期化
        this.initializeStyles();
    }
    
    /**
     * 🔍 モジュール利用可能性チェック
     */
    checkModuleAvailability() {
        const modules = {
            ElementHighlighter: typeof window.ElementHighlighter !== 'undefined',
            ElementSelector: typeof window.ElementSelector !== 'undefined',
            EfficientObserver: typeof window.EfficientObserver !== 'undefined',
            ElementCalculator: typeof window.ElementCalculator !== 'undefined',
            PinRenderer: typeof window.PinRenderer !== 'undefined'
        };
        
        console.log('🔍 モジュール利用可能性:', modules);
        
        // 必須モジュール確認
        if (!modules.ElementHighlighter || !modules.ElementSelector) {
            throw new Error('必須モジュール（ElementHighlighter, ElementSelector）が見つかりません');
        }
        
        // 効率的ピンシステム初期化（利用可能な場合）
        if (modules.EfficientObserver && modules.ElementCalculator && modules.PinRenderer) {
            this.initializeEfficientPinSystem();
        } else {
            console.warn('⚠️ 効率的ピンシステムv2.0が利用できません（フォールバック対応）');
        }
    }
    
    /**
     * 🚀 効率的ピンシステム初期化
     */
    initializeEfficientPinSystem() {
        try {
            const calculator = new window.ElementCalculator();
            const renderer = new window.PinRenderer();
            this.efficientPinSystem = {
                calculator: calculator,
                renderer: renderer,
                observer: new window.EfficientObserver(calculator, renderer)
            };
            console.log('✅ 効率的ピンシステムv2.0 統合完了');
        } catch (error) {
            console.error('❌ 効率的ピンシステム初期化失敗:', error);
            this.efficientPinSystem = null;
        }
    }
    
    /**
     * 🎨 スタイル初期化
     */
    initializeStyles() {
        if (document.getElementById('two-stage-selector-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'two-stage-selector-styles';
        styles.textContent = `
            .two-stage-indicator {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 12px 24px;
                border-radius: 24px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 14px;
                z-index: 10020;
                display: none;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            }
            
            .stage-progress {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            
            .stage-step {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 4px 0;
                transition: all 0.3s ease;
            }
            
            .stage-step.active {
                color: #00d4ff;
                font-weight: 600;
            }
            
            .stage-step.completed {
                color: #4caf50;
            }
            
            .stage-number {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.1);
                font-size: 12px;
                font-weight: 600;
            }
            
            .stage-step.active .stage-number {
                background: #00d4ff;
                color: #000;
            }
            
            .stage-step.completed .stage-number {
                background: #4caf50;
                color: white;
            }
            
            .stage-arrow {
                color: rgba(255, 255, 255, 0.5);
                font-size: 12px;
            }
            
            .two-stage-controls {
                position: fixed;
                bottom: 20px;
                right: 20px;
                display: none;
                flex-direction: column;
                gap: 8px;
                z-index: 10019;
            }
            
            .stage-control-button {
                background: rgba(0, 0, 0, 0.9);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 10px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
                backdrop-filter: blur(10px);
            }
            
            .stage-control-button:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: #00d4ff;
            }
            
            .stage-control-button.danger {
                border-color: #ff6b6b;
                color: #ff6b6b;
            }
            
            .stage-control-button.danger:hover {
                background: rgba(255, 107, 107, 0.1);
            }
            
            @keyframes stageTransition {
                0% { transform: translateX(-50%) scale(0.9); opacity: 0; }
                100% { transform: translateX(-50%) scale(1); opacity: 1; }
            }
            
            .stage-transition {
                animation: stageTransition 0.3s ease-out;
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    /**
     * 🎯 2段階ピン設定プロセス開始
     * @param {Function} onCompleted - 完了時コールバック
     * @param {Function} onCancelled - キャンセル時コールバック
     */
    startTwoStageProcess(onCompleted, onCancelled) {
        if (this.currentStage !== 'idle') {
            console.warn('⚠️ 2段階プロセスは既に実行中です');
            return;
        }
        
        console.log('🎯 2段階ピン設定プロセス開始');
        
        this.onPinCompleted = onCompleted;
        this.onProcessCancelled = onCancelled;
        
        // Stage 1: 要素選択開始
        this.startStage1();
    }
    
    /**
     * 🎯 Stage 1: 要素選択開始
     */
    startStage1() {
        console.log('🎯 Stage 1: 要素選択開始');
        
        this.currentStage = 'selecting';
        this.updateStageIndicator();
        this.showStageControls();
        
        // ElementHighlighter初期化
        if (!this.elementHighlighter) {
            this.elementHighlighter = new window.ElementHighlighter();
        }
        
        // 要素選択開始
        this.elementHighlighter.startHighlighting((selectedElement) => {
            console.log('✅ Stage 1完了 - 選択要素:', selectedElement);
            this.selectedElement = selectedElement;
            
            if (this.config.enableAutoTransition) {
                this.startStage2();
            }
        });
    }
    
    /**
     * 🎯 Stage 2: 位置調整開始
     */
    startStage2() {
        if (!this.selectedElement) {
            console.error('❌ Stage 2開始失敗: 選択要素なし');
            return;
        }
        
        console.log('🎯 Stage 2: 位置調整開始');
        
        this.currentStage = 'positioning';
        this.updateStageIndicator();
        
        // ElementSelector初期化
        if (!this.elementSelector) {
            this.elementSelector = new window.ElementSelector();
        }
        
        // 位置調整開始
        this.elementSelector.startPositionAdjustment(this.selectedElement, async (pinRequest) => {
            console.log('✅ Stage 2完了 - ピン設定:', pinRequest);
            await this.completeTwoStageProcess(pinRequest);
        });
    }
    
    /**
     * ✅ 2段階プロセス完了
     */
    async completeTwoStageProcess(pinRequest) {
        console.log('✅ 2段階ピン設定プロセス完了', pinRequest);
        
        // 効率的ピンシステムでのピン配置実行
        if (this.efficientPinSystem) {
            await this.executeEfficientPinPlacement(pinRequest);
        }
        
        // プロセス終了
        this.endTwoStageProcess(true);
        
        // コールバック実行
        if (this.onPinCompleted) {
            // pinRequest.elementを使用して確実に要素を渡す
            const targetElement = this.selectedElement || pinRequest.element;
            this.onPinCompleted(pinRequest, targetElement);
        }
    }
    
    /**
     * 🚀 効率的ピンシステムでのピン配置実行
     */
    async executeEfficientPinPlacement(pinRequest) {
        try {
            console.log('🚀 効率的ピンシステムv2.0でピン配置実行');
            
            // Observer監視開始
            this.efficientPinSystem.observer.observe(pinRequest.element, pinRequest);
            
            // 初回計算・描画実行（非同期）
            const calculationResults = await this.efficientPinSystem.calculator.calculate(pinRequest);
            console.log('🔧 計算結果の完全構造:', JSON.stringify(calculationResults, null, 2));
            console.log('🔧 計算結果のタイプ:', typeof calculationResults);
            console.log('🔧 calculationResults.pins:', calculationResults?.pins);
            console.log('🔧 pins配列かどうか:', Array.isArray(calculationResults?.pins));
            
            // 計算結果の検証
            if (calculationResults && calculationResults.pins && Array.isArray(calculationResults.pins)) {
                console.log('✅ 計算結果正常 - ピン数:', calculationResults.pins.length);
                console.log('🔧 ピン詳細:', calculationResults.pins);
                this.efficientPinSystem.renderer.render(calculationResults.pins);
            } else {
                console.warn('⚠️ 計算結果が期待された形式ではありません:', calculationResults);
                
                // ElementCalculatorが正常に実行されない場合のフォールバック
                if (calculationResults === undefined) {
                    console.error('❌ ElementCalculator.calculate()がundefinedを返しました');
                    // フォールバック: 基本的なピン表示
                    this.fallbackPinDisplay(pinRequest);
                    return;
                }
                
                // 直接calculationResultsがピン配列の可能性をチェック
                if (Array.isArray(calculationResults)) {
                    console.log('🔧 計算結果自体が配列 - 直接渡します');
                    this.efficientPinSystem.renderer.render(calculationResults);
                } else {
                    console.log('🔧 フォールバック表示に切り替えます');
                    this.fallbackPinDisplay(pinRequest);
                }
            }
            
            console.log('✅ 効率的ピンシステムでのピン配置完了');
            
        } catch (error) {
            console.error('❌ 効率的ピンシステムでのピン配置失敗:', error);
            
            // フォールバック: 基本的なピン表示
            this.fallbackPinDisplay(pinRequest);
        }
    }
    
    /**
     * 🔄 フォールバックピン表示
     */
    fallbackPinDisplay(pinRequest) {
        console.log('🔄 フォールバックピン表示実行');
        
        const element = pinRequest.element;
        const anchorPoint = pinRequest.anchorPoints[0];
        const rect = element.getBoundingClientRect();
        
        // 基本的なピン要素作成
        const pin = document.createElement('div');
        pin.style.cssText = `
            position: fixed;
            left: ${rect.left + (rect.width * anchorPoint.ratioX) + anchorPoint.offsetX}px;
            top: ${rect.top + (rect.height * anchorPoint.ratioY) + anchorPoint.offsetY}px;
            width: 20px;
            height: 20px;
            background: #4caf50;
            border: 2px solid white;
            border-radius: 50%;
            z-index: 10000;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(pin);
        
        // 5秒後に自動削除
        setTimeout(() => {
            if (pin.parentNode) {
                pin.parentNode.removeChild(pin);
            }
        }, 5000);
    }
    
    /**
     * ❌ 2段階プロセスキャンセル
     */
    cancelTwoStageProcess() {
        console.log('❌ 2段階ピン設定プロセスキャンセル');
        
        this.endTwoStageProcess(false);
        
        if (this.onProcessCancelled) {
            this.onProcessCancelled();
        }
    }
    
    /**
     * 🛑 2段階プロセス終了
     */
    endTwoStageProcess(completed = false) {
        // ハイライター停止
        if (this.elementHighlighter) {
            this.elementHighlighter.stopHighlighting();
        }
        
        // セレクター停止
        if (this.elementSelector) {
            this.elementSelector.stopPositionAdjustment();
        }
        
        // ステート更新
        this.currentStage = 'idle';
        this.selectedElement = null;
        
        // UI更新
        this.updateStageIndicator();
        this.hideStageControls();
        
        console.log(completed ? '✅ 2段階プロセス正常終了' : '🛑 2段階プロセス中断終了');
    }
    
    /**
     * 📊 ステージインジケーター作成
     */
    createStageIndicator() {
        this.stageIndicator = document.createElement('div');
        this.stageIndicator.className = 'two-stage-indicator';
        
        this.stageIndicator.innerHTML = `
            <div class="stage-progress">
                <div class="stage-step" id="stage-1">
                    <div class="stage-number">1</div>
                    <span>要素選択</span>
                </div>
                <div class="stage-arrow">→</div>
                <div class="stage-step" id="stage-2">
                    <div class="stage-number">2</div>
                    <span>位置調整</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.stageIndicator);
        
        // コントロールボタン作成
        this.stageControls = document.createElement('div');
        this.stageControls.className = 'two-stage-controls';
        this.stageControls.innerHTML = `
            <button class="stage-control-button danger" id="cancel-process">プロセスキャンセル</button>
        `;
        
        document.body.appendChild(this.stageControls);
        
        // イベントリスナー
        this.stageControls.querySelector('#cancel-process').addEventListener('click', () => {
            this.cancelTwoStageProcess();
        });
    }
    
    /**
     * 🔄 ステージインジケーター更新
     */
    updateStageIndicator() {
        if (!this.stageIndicator) return;
        
        const stage1 = this.stageIndicator.querySelector('#stage-1');
        const stage2 = this.stageIndicator.querySelector('#stage-2');
        
        // 全ステージをリセット
        [stage1, stage2].forEach(stage => {
            stage.classList.remove('active', 'completed');
        });
        
        // 現在のステージに応じて更新
        switch (this.currentStage) {
            case 'selecting':
                stage1.classList.add('active');
                this.stageIndicator.style.display = 'block';
                this.stageIndicator.classList.add('stage-transition');
                break;
                
            case 'positioning':
                stage1.classList.add('completed');
                stage2.classList.add('active');
                break;
                
            case 'idle':
            default:
                this.stageIndicator.style.display = 'none';
                break;
        }
    }
    
    /**
     * 👁️ ステージコントロール表示
     */
    showStageControls() {
        if (this.stageControls) {
            this.stageControls.style.display = 'flex';
        }
    }
    
    /**
     * 🚫 ステージコントロール非表示
     */
    hideStageControls() {
        if (this.stageControls) {
            this.stageControls.style.display = 'none';
        }
    }
    
    /**
     * ⌨️ キーボードショートカット設定
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // 2段階プロセス中のみ有効
            if (this.currentStage === 'idle') return;
            
            switch (event.key) {
                case 'Escape':
                    event.preventDefault();
                    this.cancelTwoStageProcess();
                    break;
                    
                case 'F1':
                    event.preventDefault();
                    if (this.config.debugMode) {
                        this.showDebugInfo();
                    }
                    break;
            }
        });
    }
    
    /**
     * 🔧 デバッグ情報表示
     */
    showDebugInfo() {
        const debugInfo = {
            currentStage: this.currentStage,
            selectedElement: this.selectedElement ? {
                tagName: this.selectedElement.tagName,
                id: this.selectedElement.id,
                className: this.selectedElement.className
            } : null,
            systemsAvailable: {
                elementHighlighter: !!this.elementHighlighter,
                elementSelector: !!this.elementSelector,
                efficientPinSystem: !!this.efficientPinSystem
            },
            config: this.config
        };
        
        console.table(debugInfo);
        return debugInfo;
    }
    
    /**
     * ⚙️ 設定更新
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('⚙️ TwoStageSelector設定更新:', this.config);
    }
    
    /**
     * 🧹 クリーンアップ
     */
    destroy() {
        // プロセス停止
        this.endTwoStageProcess(false);
        
        // モジュールクリーンアップ
        if (this.elementHighlighter) {
            this.elementHighlighter.destroy();
        }
        if (this.elementSelector) {
            this.elementSelector.destroy();
        }
        if (this.efficientPinSystem && this.efficientPinSystem.observer) {
            this.efficientPinSystem.observer.destroy();
        }
        
        // UI削除
        if (this.stageIndicator && this.stageIndicator.parentNode) {
            this.stageIndicator.parentNode.removeChild(this.stageIndicator);
        }
        if (this.stageControls && this.stageControls.parentNode) {
            this.stageControls.parentNode.removeChild(this.stageControls);
        }
        
        // スタイル削除
        const styles = document.getElementById('two-stage-selector-styles');
        if (styles) {
            styles.remove();
        }
        
        console.log('🧹 TwoStageSelector クリーンアップ完了');
    }
}

// グローバル公開
if (typeof window !== 'undefined') {
    window.TwoStageSelector = TwoStageSelector;
    console.log('✅ TwoStageSelector グローバル公開完了');
}

// AMD/CommonJS対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TwoStageSelector;
}