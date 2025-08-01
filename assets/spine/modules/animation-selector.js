/**
 * Animation Selector Module
 * アニメーション選択システム - 完全モジュール化版
 * 
 * 作成日: 2025-01-31
 * 目的: キャラクターアニメーションの選択・制御・プレビュー機能を提供
 * 統合: spine-animation-controller.js との協調動作
 * 
 * 【主要機能】
 * 1. アニメーション選択機能 - syutugen, taiki, yarare, click の選択・設定
 * 2. ループ制御機能 - アニメーション別ループON/OFF制御
 * 3. プレビュー機能 - 即座アニメーション再生・リアルタイム変更反映
 * 4. 既存システム統合 - SpinePositioningV2, AnimationController との協調
 * 
 * 【統合仕様】
 * - 自動システム検出・統合機能
 * - v2.0編集パネルへの自動UI統合
 * - 既存アニメーション機能を破壊しない設計
 * - 完全独立動作・テスト可能
 */

class AnimationSelector {
    constructor(config = {}) {
        this.config = {
            debugMode: config.debugMode || false,
            defaultAnimation: config.defaultAnimation || 'taiki',
            autoIntegrate: config.autoIntegrate !== false,
            ...config
        };

        // アニメーション定義
        this.availableAnimations = [
            { id: 'syutugen', name: '出現', description: '登場アニメーション（1回再生→待機遷移）' },
            { id: 'taiki', name: '待機', description: 'アイドル状態（無限ループ）' },
            { id: 'yarare', name: 'やられ', description: 'ダメージアニメーション（1回再生→待機遷移）' },
            { id: 'click', name: 'クリック', description: 'クリック反応アニメーション' }
        ];

        // 内部状態管理
        this.characterAnimations = new Map(); // キャラクター別アニメーション設定
        this.loopSettings = new Map();        // ループ設定
        this.uiElements = new Map();          // UI要素管理
        this.previewCallbacks = new Map();    // プレビューコールバック

        // システム参照
        this.animationController = null;
        this.characterManager = null;
        this.positioningSystem = null;

        // ログ用
        this.log = this.config.debugMode ? console.log.bind(console, '[AnimationSelector]') : () => {};

        this.log('🎯 AnimationSelector 初期化開始', this.config);

        // 自動統合
        if (this.config.autoIntegrate) {
            this.waitForSystemsAndIntegrate();
        }
    }

    /**
     * システム統合待機・自動統合
     * 既存システム（AnimationController, CharacterManager, SpinePositioningV2）の
     * 検出・統合を段階的に実行
     */
    async waitForSystemsAndIntegrate() {
        let attempts = 0;
        const maxAttempts = 50; // 5秒間のタイムアウト
        const checkInterval = 100; // 100ms間隔でチェック

        const checkSystems = () => {
            return new Promise((resolve) => {
                const check = () => {
                    attempts++;
                    
                    // システム参照の確認（優先度順）
                    const controller = window.spineManager?.animationController;
                    const manager = window.spineManager?.characterManager;
                    const v2System = window.spinePositioningV2;

                    this.log(`🔍 システム検出チェック ${attempts}/${maxAttempts}:`, {
                        controller: !!controller,
                        manager: !!manager,
                        v2System: !!v2System
                    });

                    // 最低限必要なシステム（AnimationController + CharacterManager）が揃った場合
                    if (controller && manager) {
                        this.log('✅ 必要なシステム検出完了、統合開始');
                        this.integrateWithExistingSystems(controller, manager, v2System);
                        resolve(true);
                        return;
                    }

                    // タイムアウト時の処理
                    if (attempts >= maxAttempts) {
                        this.log('⚠️ システム統合タイムアウト、スタンドアロンモードで動作');
                        this.createStandaloneUI();
                        resolve(false);
                        return;
                    }

                    // 再チェック予約
                    setTimeout(check, checkInterval);
                };
                check();
            });
        };

        const integrationResult = await checkSystems();
        this.log(`🎯 統合プロセス完了:`, integrationResult ? '成功' : 'スタンドアロン');
        return integrationResult;
    }

    /**
     * 既存システムとの統合
     */
    integrateWithExistingSystems(controller, manager, positioningSystem) {
        this.animationController = controller;
        this.characterManager = manager;
        this.positioningSystem = positioningSystem;

        this.log('🔗 既存システムとの統合完了');
        this.log('  - AnimationController:', !!controller);
        this.log('  - CharacterManager:', !!manager);
        this.log('  - PositioningSystemV2:', !!positioningSystem);

        // 利用可能なキャラクターを検出
        this.scanAvailableCharacters();

        // v2.0システムへの統合
        if (positioningSystem) {
            this.integrateWithV2System();
        }

        // グローバル参照の設定
        window.animationSelector = this;
    }

    /**
     * 利用可能なキャラクターのスキャン
     */
    scanAvailableCharacters() {
        if (!this.characterManager) return;

        const characters = this.characterManager.characters;
        if (characters) {
            for (const [characterId, character] of characters) {
                this.initializeCharacterSettings(characterId, character);
            }
            this.log(`📊 ${characters.size}個のキャラクターを検出・初期化完了`);
        }
    }

    /**
     * キャラクター設定の初期化
     */
    initializeCharacterSettings(characterId, character) {
        // デフォルト設定
        this.characterAnimations.set(characterId, {
            current: this.config.defaultAnimation,
            previous: null,
            character: character
        });

        this.loopSettings.set(characterId, {
            'syutugen': false,  // 出現は1回のみ
            'taiki': true,      // 待機は無限ループ
            'yarare': false,    // やられは1回のみ
            'click': false      // クリックは1回のみ
        });

        this.log(`⚙️ キャラクター設定初期化: ${characterId}`);
    }

    /**
     * v2.0システムとの統合
     */
    integrateWithV2System() {
        if (!this.positioningSystem) return;

        this.log('🚀 SpinePositioningV2 との統合開始');

        // v2.0システムのUIに統合
        const editPanel = document.querySelector('.positioning-v2-panel');
        if (editPanel) {
            this.createV2IntegratedUI(editPanel);
        } else {
            // パネルが後から作成される場合の対応
            this.observeV2PanelCreation();
        }
    }

    /**
     * v2.0パネル作成の監視
     */
    observeV2PanelCreation() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const panel = node.querySelector?.('.positioning-v2-panel') || 
                                     (node.classList?.contains('positioning-v2-panel') ? node : null);
                        if (panel) {
                            this.log('🎯 v2.0パネル検出、UI統合実行');
                            this.createV2IntegratedUI(panel);
                            observer.disconnect();
                            return;
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * v2.0統合UI作成
     */
    createV2IntegratedUI(parentPanel) {
        const animationSection = document.createElement('div');
        animationSection.className = 'animation-selector-section';
        animationSection.innerHTML = `
            <div class="animation-selector-header">
                <h4>🎬 アニメーション選択</h4>
                <button class="animation-selector-toggle" type="button">
                    <span class="toggle-icon">▼</span>
                </button>
            </div>
            <div class="animation-selector-content" style="display: none;">
                <div class="character-animation-controls">
                    <!-- キャラクター別制御がここに動的生成される -->
                </div>
            </div>
        `;

        // 適切な位置に挿入（編集ボタンの下）
        const editControls = parentPanel.querySelector('.positioning-v2-edit-controls');
        if (editControls) {
            editControls.parentNode.insertBefore(animationSection, editControls.nextSibling);
        } else {
            parentPanel.appendChild(animationSection);
        }

        // イベントリスナーの設定
        this.setupV2UIEvents(animationSection);

        // キャラクター制御UI生成
        this.generateCharacterControls(animationSection.querySelector('.character-animation-controls'));

        // UI要素の記録
        this.uiElements.set('v2-integration', animationSection);

        this.log('✅ v2.0統合UI作成完了');
    }

    /**
     * v2.0 UI イベント設定
     */
    setupV2UIEvents(sectionElement) {
        const toggleButton = sectionElement.querySelector('.animation-selector-toggle');
        const content = sectionElement.querySelector('.animation-selector-content');
        const toggleIcon = sectionElement.querySelector('.toggle-icon');

        if (toggleButton && content) {
            toggleButton.addEventListener('click', () => {
                const isVisible = content.style.display !== 'none';
                content.style.display = isVisible ? 'none' : 'block';
                toggleIcon.textContent = isVisible ? '▼' : '▲';
                
                this.log(`🎛️ アニメーション選択パネル: ${isVisible ? '非表示' : '表示'}`);
            });
        }
    }

    /**
     * キャラクター制御UI生成
     */
    generateCharacterControls(container) {
        if (!container || !this.characterManager) return;

        container.innerHTML = ''; // 既存内容をクリア

        const characters = this.characterManager.characters;
        if (!characters || characters.size === 0) {
            container.innerHTML = '<p class="no-characters">利用可能なキャラクターがありません</p>';
            return;
        }

        for (const [characterId, character] of characters) {
            const controlElement = this.createCharacterControl(characterId, character);
            container.appendChild(controlElement);
        }

        this.log(`🎛️ ${characters.size}個のキャラクター制御UI生成完了`);
    }

    /**
     * 個別キャラクター制御UI作成
     */
    createCharacterControl(characterId, character) {
        const controlDiv = document.createElement('div');
        controlDiv.className = 'character-animation-control';
        controlDiv.dataset.characterId = characterId;

        const currentSettings = this.characterAnimations.get(characterId);
        const loopSettings = this.loopSettings.get(characterId);

        controlDiv.innerHTML = `
            <div class="character-info">
                <span class="character-name">${characterId}</span>
                <span class="character-type">(${character.type || 'unknown'})</span>
            </div>
            <div class="animation-controls">
                <div class="animation-selector-dropdown">
                    <label>アニメーション:</label>
                    <select class="animation-select" data-character="${characterId}">
                        ${this.availableAnimations.map(anim => 
                            `<option value="${anim.id}" ${anim.id === currentSettings?.current ? 'selected' : ''}>
                                ${anim.name}
                            </option>`
                        ).join('')}
                    </select>
                </div>
                <div class="loop-control">
                    <label>
                        <input type="checkbox" class="loop-checkbox" data-character="${characterId}" 
                               ${loopSettings?.[currentSettings?.current] ? 'checked' : ''}>
                        ループ再生
                    </label>
                </div>
                <div class="preview-controls">
                    <button class="preview-button" data-character="${characterId}" type="button">
                        🎬 プレビュー
                    </button>
                    <button class="stop-button" data-character="${characterId}" type="button">
                        ⏹️ 停止
                    </button>
                </div>
            </div>
        `;

        // イベントリスナーの設定
        this.setupCharacterControlEvents(controlDiv, characterId);

        return controlDiv;
    }

    /**
     * キャラクター制御イベント設定
     */
    setupCharacterControlEvents(controlElement, characterId) {
        // アニメーション選択
        const animationSelect = controlElement.querySelector('.animation-select');
        if (animationSelect) {
            animationSelect.addEventListener('change', (e) => {
                this.setCharacterAnimation(characterId, e.target.value);
                this.updateLoopCheckbox(controlElement, characterId, e.target.value);
            });
        }

        // ループ設定
        const loopCheckbox = controlElement.querySelector('.loop-checkbox');
        if (loopCheckbox) {
            loopCheckbox.addEventListener('change', (e) => {
                this.setCharacterLoop(characterId, e.target.checked);
            });
        }

        // プレビューボタン
        const previewButton = controlElement.querySelector('.preview-button');
        if (previewButton) {
            previewButton.addEventListener('click', () => {
                this.playPreview(characterId);
            });
        }

        // 停止ボタン
        const stopButton = controlElement.querySelector('.stop-button');
        if (stopButton) {
            stopButton.addEventListener('click', () => {
                this.stopCharacterAnimation(characterId);
            });
        }
    }

    /**
     * ループチェックボックスの状態更新
     */
    updateLoopCheckbox(controlElement, characterId, animationId) {
        const loopCheckbox = controlElement.querySelector('.loop-checkbox');
        const loopSettings = this.loopSettings.get(characterId);
        
        if (loopCheckbox && loopSettings) {
            const shouldLoop = loopSettings[animationId];
            loopCheckbox.checked = shouldLoop;
            
            // syutugen, yarare は通常1回再生なので、チェックボックスを無効化
            if (animationId === 'syutugen' || animationId === 'yarare') {
                loopCheckbox.disabled = true;
                loopCheckbox.title = 'このアニメーションは通常1回再生後、自動的に待機に遷移します';
            } else {
                loopCheckbox.disabled = false;
                loopCheckbox.title = '';
            }
        }
    }

    /**
     * キャラクターアニメーション設定
     */
    setCharacterAnimation(characterId, animationId, loop = null) {
        const settings = this.characterAnimations.get(characterId);
        const loopSettings = this.loopSettings.get(characterId);
        
        if (!settings || !loopSettings) {
            this.log(`⚠️ キャラクター設定が見つかりません: ${characterId}`);
            return false;
        }

        // 設定更新
        settings.previous = settings.current;
        settings.current = animationId;

        // ループ設定（指定がない場合はデフォルト値を使用）
        if (loop !== null) {
            loopSettings[animationId] = loop;
        }

        this.characterAnimations.set(characterId, settings);
        this.loopSettings.set(characterId, loopSettings);

        this.log(`⚙️ アニメーション設定更新: ${characterId} → ${animationId} (loop: ${loopSettings[animationId]})`);
        return true;
    }

    /**
     * キャラクターループ設定
     */
    setCharacterLoop(characterId, loop) {
        const settings = this.characterAnimations.get(characterId);
        const loopSettings = this.loopSettings.get(characterId);
        
        if (!settings || !loopSettings) return false;

        const currentAnimation = settings.current;
        loopSettings[currentAnimation] = loop;
        this.loopSettings.set(characterId, loopSettings);

        this.log(`🔄 ループ設定更新: ${characterId}[${currentAnimation}] → ${loop}`);
        return true;
    }

    /**
     * プレビュー再生 - アニメーション即座実行・リアルタイム変更反映
     * 
     * @param {string} characterId - 対象キャラクターID
     * @param {string} animationId - アニメーションID（指定なしの場合は現在設定を使用）
     * @param {boolean} loop - ループ設定（指定なしの場合は現在設定を使用）
     * @returns {boolean} 再生成功/失敗
     */
    playPreview(characterId, animationId = null, loop = null) {
        if (!this.animationController) {
            this.log('❌ AnimationController が利用できません');
            return false;
        }

        const settings = this.characterAnimations.get(characterId);
        const loopSettings = this.loopSettings.get(characterId);
        
        if (!settings || !loopSettings) {
            this.log(`⚠️ キャラクター設定が見つかりません: ${characterId}`);
            return false;
        }

        // パラメータの決定（優先度: 指定値 > 現在設定 > デフォルト）
        const targetAnimation = animationId || settings.current;
        const shouldLoop = loop !== null ? loop : loopSettings[targetAnimation];

        this.log(`🎬 プレビュー再生開始: ${characterId} → ${targetAnimation} (loop: ${shouldLoop})`);

        // アニメーション再生実行
        try {
            // 特別処理：自動遷移アニメーション
            if (targetAnimation === 'syutugen' || targetAnimation === 'yarare') {
                // 出現・やられアニメーションは1回再生後、自動的に待機に遷移
                this.log(`🔄 自動遷移シーケンス: ${targetAnimation} → taiki`);
                this.animationController.playSequence(characterId, [targetAnimation, 'taiki']);
            } else {
                // 通常アニメーション（taiki, click）
                this.animationController.playAnimation(characterId, targetAnimation, shouldLoop);
            }
            
            this.log(`✅ プレビュー再生成功: ${characterId}`);
            return true;
            
        } catch (error) {
            this.log(`❌ アニメーション再生エラー: ${characterId} - ${error.message}`);
            console.error('AnimationSelector プレビューエラー詳細:', error);
            return false;
        }
    }

    /**
     * キャラクターアニメーション停止
     */
    stopCharacterAnimation(characterId) {
        if (!this.animationController) {
            this.log('❌ AnimationController が利用できません');
            return false;
        }

        try {
            this.animationController.stopAllAnimations(characterId);
            this.log(`⏹️ アニメーション停止: ${characterId}`);
            return true;
        } catch (error) {
            this.log(`❌ アニメーション停止エラー: ${error.message}`);
            return false;
        }
    }

    /**
     * 全キャラクターアニメーション停止
     */
    stopAllAnimations() {
        if (!this.characterManager) return false;

        let stoppedCount = 0;
        for (const characterId of this.characterManager.characters.keys()) {
            if (this.stopCharacterAnimation(characterId)) {
                stoppedCount++;
            }
        }

        this.log(`⏹️ 全アニメーション停止完了: ${stoppedCount}個`);
        return stoppedCount > 0;
    }

    /**
     * アニメーション情報取得
     */
    getCharacterAnimationInfo(characterId) {
        const settings = this.characterAnimations.get(characterId);
        const loopSettings = this.loopSettings.get(characterId);
        
        if (!settings || !loopSettings) return null;

        return {
            current: settings.current,
            previous: settings.previous,
            loop: loopSettings[settings.current],
            availableAnimations: this.availableAnimations,
            loopSettings: { ...loopSettings }
        };
    }

    /**
     * 全キャラクター情報取得
     */
    getAllCharacterAnimations() {
        const result = {};
        for (const characterId of this.characterAnimations.keys()) {
            result[characterId] = this.getCharacterAnimationInfo(characterId);
        }
        return result;
    }
    
    /**
     * アニメーション状態復元 - Enhanced Save Systemとの統合用
     * 
     * @param {Object} animationData - 復元するアニメーションデータ
     * @returns {boolean} 復元成功/失敗
     */
    restoreState(animationData) {
        if (!animationData || typeof animationData !== 'object') {
            console.warn('⚠️ 無効なアニメーションデータ:', animationData);
            return false;
        }
        
        console.log('🔄 アニメーション状態復元開始:', animationData);
        
        let restoredCount = 0;
        
        try {
            // 個別キャラクター設定の復元
            if (animationData.characters && typeof animationData.characters === 'object') {
                for (const [characterId, settings] of Object.entries(animationData.characters)) {
                    if (this.characterAnimations.has(characterId) && settings.current) {
                        const success = this.setCharacterAnimation(
                            characterId, 
                            settings.current, 
                            settings.loop
                        );
                        if (success) {
                            restoredCount++;
                            this.log(`✅ キャラクター設定復元: ${characterId} → ${settings.current}`);
                        }
                    }
                }
            }
            
            // 現在のアニメーション設定復元（後方互換性）
            if (animationData.currentAnimation && typeof animationData.currentAnimation === 'string') {
                // アクティブなキャラクターに適用
                for (const characterId of this.characterAnimations.keys()) {
                    this.setCharacterAnimation(characterId, animationData.currentAnimation);
                    restoredCount++;
                    break; // 最初のキャラクターのみ
                }
            }
            
            // 利用可能アニメーション設定復元（必要に応じて）
            if (animationData.availableAnimations && Array.isArray(animationData.availableAnimations)) {
                // 現在の実装では availableAnimations は固定だが、将来の拡張に備えて処理を残す
                console.log('📋 利用可能アニメーション情報確認済み');
            }
            
            console.log(`✅ アニメーション状態復元完了: ${restoredCount}項目`);
            return restoredCount > 0;
            
        } catch (error) {
            console.error('❌ アニメーション状態復元エラー:', error);
            return false;
        }
    }

    /**
     * スタンドアロンUI作成（統合システムがない場合）
     */
    createStandaloneUI() {
        const container = document.createElement('div');
        container.className = 'animation-selector-standalone';
        container.innerHTML = `
            <div class="animation-selector-panel">
                <h3>🎬 アニメーション選択システム</h3>
                <div class="standalone-controls">
                    <p>統合システムが検出されませんでした。</p>
                    <p>手動でキャラクターを登録してください。</p>
                    <button id="scan-characters">キャラクター再スキャン</button>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        this.uiElements.set('standalone', container);

        // 再スキャンボタン
        const scanButton = container.querySelector('#scan-characters');
        if (scanButton) {
            scanButton.addEventListener('click', () => {
                this.waitForSystemsAndIntegrate();
            });
        }

        this.log('📋 スタンドアロンUI作成完了');
    }

    /**
     * システムの状態確認・診断
     */
    diagnoseSystem() {
        console.group('🔍 AnimationSelector システム診断');
        
        console.log('📊 基本情報:');
        console.log('  - 初期化済み:', !!this.animationController);
        console.log('  - AnimationController:', !!this.animationController);
        console.log('  - CharacterManager:', !!this.characterManager);
        console.log('  - PositioningSystemV2:', !!this.positioningSystem);
        
        console.log('📋 キャラクター情報:');
        console.log('  - 登録済みキャラクター数:', this.characterAnimations.size);
        console.log('  - キャラクター設定:', Object.fromEntries(this.characterAnimations));
        console.log('  - ループ設定:', Object.fromEntries(this.loopSettings));
        
        console.log('🎛️ UI要素:');
        console.log('  - UI要素数:', this.uiElements.size);
        for (const [key, element] of this.uiElements) {
            console.log(`  - ${key}:`, element);
        }
        
        console.log('🔗 システム参照:');
        console.log('  - window.spineManager:', !!window.spineManager);
        console.log('  - window.spinePositioningV2:', !!window.spinePositioningV2);
        console.log('  - window.animationSelector:', window.animationSelector === this);
        
        console.groupEnd();
    }

    /**
     * クリーンアップ
     */
    destroy() {
        this.log('🧹 AnimationSelector クリーンアップ開始');

        // UI要素の削除
        for (const [key, element] of this.uiElements) {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
                this.log(`🗑️ UI要素削除: ${key}`);
            }
        }

        // 内部状態のクリア
        this.characterAnimations.clear();
        this.loopSettings.clear();
        this.uiElements.clear();
        this.previewCallbacks.clear();

        // グローバル参照の削除
        if (window.animationSelector === this) {
            delete window.animationSelector;
        }

        this.log('✅ AnimationSelector クリーンアップ完了');
    }
}

// デバッグ用グローバル関数・開発支援機能
if (typeof window !== 'undefined') {
    // AnimationSelector インスタンス作成
    window.createAnimationSelector = (config) => {
        const selector = new AnimationSelector(config);
        console.log('🎬 AnimationSelector 作成完了:', selector);
        return selector;
    };
    
    // システム診断
    window.diagnoseAnimationSelector = () => {
        if (window.animationSelector) {
            window.animationSelector.diagnoseSystem();
        } else {
            console.warn('⚠️ AnimationSelector が初期化されていません');
            console.log('💡 作成方法: window.createAnimationSelector()');
        }
    };
    
    // 高速テスト用関数
    window.testAnimationSelector = () => {
        console.group('🧪 AnimationSelector テスト開始');
        
        // 基本システム確認
        console.log('1. システム確認:');
        console.log('  - spineManager:', !!window.spineManager);
        console.log('  - animationController:', !!window.spineManager?.animationController);
        console.log('  - characterManager:', !!window.spineManager?.characterManager);
        console.log('  - spinePositioningV2:', !!window.spinePositioningV2);
        
        // AnimationSelector 確認
        console.log('2. AnimationSelector 確認:');
        if (window.animationSelector) {
            console.log('  - インスタンス:', window.animationSelector);
            console.log('  - キャラクター数:', window.animationSelector.characterAnimations.size);
            console.log('  - UI要素数:', window.animationSelector.uiElements.size);
        } else {
            console.log('  - ❌ 未初期化');
        }
        
        // 自動作成テスト
        if (!window.animationSelector) {
            console.log('3. 自動作成テスト:');
            const testSelector = new AnimationSelector({ debugMode: true });
            console.log('  - 作成結果:', testSelector);
        }
        
        console.groupEnd();
    };
    
    // 緊急リセット
    window.resetAnimationSelector = () => {
        if (window.animationSelector) {
            window.animationSelector.destroy();
            delete window.animationSelector;
            console.log('🧹 AnimationSelector リセット完了');
        } else {
            console.log('ℹ️ リセット対象なし');
        }
    };
}

// CSSスタイルの追加
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        /* AnimationSelector v2.0統合UI スタイル */
        .animation-selector-section {
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 5px;
            background: #f9f9f9;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .animation-selector-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: #f0f0f0;
            border-bottom: 1px solid #ddd;
            cursor: pointer;
        }
        
        .animation-selector-header h4 {
            margin: 0;
            font-size: 14px;
            color: #333;
        }
        
        .animation-selector-toggle {
            background: none;
            border: none;
            font-size: 12px;
            cursor: pointer;
            padding: 2px 6px;
        }
        
        .animation-selector-content {
            padding: 10px;
        }
        
        .character-animation-control {
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #eee;
            border-radius: 4px;
            background: white;
        }
        
        .character-info {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            font-weight: bold;
        }
        
        .character-name {
            color: #2c3e50;
            margin-right: 8px;
        }
        
        .character-type {
            color: #7f8c8d;
            font-size: 12px;
            font-weight: normal;
        }
        
        .animation-controls {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            align-items: center;
        }
        
        .animation-selector-dropdown {
            display: flex;
            flex-direction: column;
        }
        
        .animation-selector-dropdown label {
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
        }
        
        .animation-select {
            padding: 4px 8px;
            border: 1px solid #ddd;
            border-radius: 3px;
            font-size: 12px;
        }
        
        .loop-control {
            display: flex;
            align-items: center;
        }
        
        .loop-control label {
            display: flex;
            align-items: center;
            font-size: 12px;
            cursor: pointer;
        }
        
        .loop-checkbox {
            margin-right: 6px;
        }
        
        .preview-controls {
            grid-column: 1 / -1;
            display: flex;
            gap: 8px;
        }
        
        .preview-button, .stop-button {
            padding: 6px 12px;
            border: 1px solid #ddd;
            border-radius: 3px;
            background: white;
            cursor: pointer;
            font-size: 11px;
            transition: background-color 0.2s;
        }
        
        .preview-button:hover {
            background: #e8f4f8;
            border-color: #3498db;
        }
        
        .stop-button:hover {
            background: #fee8e8;
            border-color: #e74c3c;
        }
        
        .no-characters {
            text-align: center;
            color: #999;
            font-style: italic;
            margin: 20px 0;
        }
        
        .animation-selector-standalone {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
        }
        
        .animation-selector-panel {
            background: white;
            border: 2px solid #3498db;
            border-radius: 8px;
            padding: 15px;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .animation-selector-panel h3 {
            margin: 0 0 15px 0;
            color: #2c3e50;
        }
        
        .standalone-controls button {
            background: #3498db;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        }
        
        .standalone-controls button:hover {
            background: #2980b9;
        }
    `;
    
    document.head.appendChild(style);
}

// モジュールエクスポート（Node.js環境対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationSelector;
}