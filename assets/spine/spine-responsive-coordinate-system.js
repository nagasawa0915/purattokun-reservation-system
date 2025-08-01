/**
 * Spine Positioning System - Responsive Coordinate System
 * レスポンシブ対応座標変換システム
 * 
 * 作成日: 2024年7月25日
 * 目的: ビューポート基準座標とSpine座標の相互変換
 */

class ResponsiveCoordinateSystem {
    constructor(config = {}) {
        this.config = {
            debugMode: config.debugMode || false,
            autoResize: config.autoResize !== false, // デフォルトで有効
            baseViewport: config.baseViewport || { width: 1200, height: 800 },
            ...config
        };
        
        this.isInitialized = false;
        this.characters = new Map();
        this.resizeTimeout = null;
        
        // 🔒 Phase 2: 位置変更ロックシステム
        this.positionLock = {
            enabled: false,
            reason: null,
            lockedAt: null,
            allowedOperations: new Set()
        };
        
        // 初期化制御システム
        this.initializationState = {
            completed: false,
            inProgress: false,
            startedAt: null,
            errors: []
        };
        
        // ログ用
        this.log = this.config.debugMode ? console.log : () => {};
        
        this.log('📐 ResponsiveCoordinateSystem Phase 2 初期化開始', this.config);
    }
    
    /**
     * システム初期化（Phase 2改良版）
     */
    initialize() {
        if (this.isInitialized) {
            this.log('⚠️ 既に初期化済みです');
            return;
        }
        
        this.initializationState.inProgress = true;
        this.initializationState.startedAt = Date.now();
        
        try {
            // 🔒 グローバル位置変更ロック状態をチェック
            this.checkGlobalPositionLock();
            
            // ウィンドウリサイズイベント
            if (this.config.autoResize && !this.positionLock.enabled) {
                window.addEventListener('resize', this.handleResize.bind(this));
                this.log('🔄 ウィンドウリサイズ監視開始');
            } else if (this.positionLock.enabled) {
                this.log('🔒 位置ロック中のためリサイズ監視を無効化');
            }
            
            this.isInitialized = true;
            this.initializationState.completed = true;
            this.initializationState.inProgress = false;
            
            this.log('✅ ResponsiveCoordinateSystem Phase 2 初期化完了');
            
        } catch (error) {
            this.initializationState.errors.push(error);
            this.initializationState.inProgress = false;
            this.log('❌ 初期化エラー:', error);
            throw error;
        }
    }
    
    /**
     * グローバル位置変更ロック状態をチェック（Phase 2）
     */
    checkGlobalPositionLock() {
        if (window.SPINE_POSITION_LOCK) {
            this.enablePositionLock(
                window.SPINE_POSITION_LOCK.reason || 'global-lock',
                window.SPINE_POSITION_LOCK.timestamp
            );
            this.log('🔒 グローバル位置ロックを検出・適用:', window.SPINE_POSITION_LOCK);
        }
    }
    
    /**
     * 位置変更ロックを有効化（Phase 2）
     */
    enablePositionLock(reason, timestamp = null) {
        this.positionLock = {
            enabled: true,
            reason: reason,
            lockedAt: timestamp || new Date().toISOString(),
            allowedOperations: new Set(['read', 'debug'])
        };
        
        this.log(`🔒 位置変更ロック有効化: ${reason} at ${this.positionLock.lockedAt}`);
    }
    
    /**
     * 位置変更ロックを解除（Phase 2）
     */
    disablePositionLock() {
        if (!this.positionLock.enabled) {
            this.log('⚠️ 位置ロックは既に無効です');
            return;
        }
        
        const previousReason = this.positionLock.reason;
        this.positionLock = {
            enabled: false,
            reason: null,
            lockedAt: null,
            allowedOperations: new Set()
        };
        
        this.log(`🔓 位置変更ロック解除完了 (前回理由: ${previousReason})`);
    }
    
    /**
     * 位置変更が許可されているかチェック（Phase 2）
     */
    isPositionChangeAllowed(operation = 'update') {
        if (!this.positionLock.enabled) {
            return true;
        }
        
        const allowed = this.positionLock.allowedOperations.has(operation);
        if (!allowed) {
            this.log(`🚫 位置変更拒否: ${operation} (理由: ${this.positionLock.reason})`);
        }
        
        return allowed;
    }
    
    /**
     * キャラクターを登録
     */
    registerCharacter(name, characterData) {
        const character = {
            name,
            element: characterData.element,
            config: characterData.config,
            spine: characterData.spine,
            lastPosition: null,
            ...characterData
        };
        
        this.characters.set(name, character);
        this.log(`👤 キャラクター登録: ${name}`, character);
        
        return character;
    }
    
    /**
     * ビューポート基準座標（%）→ 実際のピクセル座標
     */
    viewportToPixel(vpX, vpY) {
        const result = {
            x: (vpX / 100) * window.innerWidth,
            y: (vpY / 100) * window.innerHeight
        };
        
        this.log(`📍 座標変換 VP→PX: (${vpX}%, ${vpY}%) → (${result.x.toFixed(1)}px, ${result.y.toFixed(1)}px)`);
        return result;
    }
    
    /**
     * ピクセル座標 → ビューポート基準座標（%）
     */
    pixelToViewport(pixelX, pixelY) {
        const result = {
            x: (pixelX / window.innerWidth) * 100,
            y: (pixelY / window.innerHeight) * 100
        };
        
        this.log(`📍 座標変換 PX→VP: (${pixelX}px, ${pixelY}px) → (${result.x.toFixed(1)}%, ${result.y.toFixed(1)}%)`);
        return result;
    }
    
    /**
     * Canvas内相対座標 → Spine座標
     */
    canvasToSpineCoordinate(canvasX, canvasY, canvasElement) {
        if (!canvasElement) {
            console.warn('⚠️ Canvas要素が指定されていません');
            return { x: canvasX, y: canvasY };
        }
        
        const rect = canvasElement.getBoundingClientRect();
        
        // Canvas中央を原点(0,0)とする座標系に変換
        const spineX = canvasX - (rect.width / 2);
        const spineY = (rect.height / 2) - canvasY; // Y軸を反転
        
        this.log(`🎯 Canvas→Spine座標: (${canvasX}, ${canvasY}) → (${spineX.toFixed(1)}, ${spineY.toFixed(1)})`);
        
        return { x: spineX, y: spineY };
    }
    
    /**
     * Spine座標 → Canvas内相対座標
     */
    spineToCanvasCoordinate(spineX, spineY, canvasElement) {
        if (!canvasElement) {
            console.warn('⚠️ Canvas要素が指定されていません');
            return { x: spineX, y: spineY };
        }
        
        const rect = canvasElement.getBoundingClientRect();
        
        // Spine座標系からCanvas座標系に変換
        const canvasX = spineX + (rect.width / 2);
        const canvasY = (rect.height / 2) - spineY; // Y軸を反転
        
        this.log(`🎯 Spine→Canvas座標: (${spineX}, ${spineY}) → (${canvasX.toFixed(1)}, ${canvasY.toFixed(1)})`);
        
        return { x: canvasX, y: canvasY };
    }
    
    /**
     * HTML設定からキャラクター位置を取得（v2.0座標系統一対応）
     */
    getPositionFromHTMLConfig(configElementId) {
        const configElement = document.getElementById(configElementId);
        if (!configElement) {
            console.warn(`⚠️ 設定要素が見つかりません: ${configElementId}`);
            return null;
        }
        
        // 🚨 Phase 2修正: パッケージ出力モード検出
        const isPackageMode = this.detectPackageMode();
        
        // 🔧 v2.0編集システムの位置データが存在する場合は最優先
        const v2PositionData = this.getV2PositionData(configElementId);
        if (v2PositionData && !isPackageMode) {
            this.log(`🎯 v2.0編集システム位置データを使用: ${configElementId}`, v2PositionData);
            return v2PositionData;
        }
        
        // 🚨 HTML設定システム無効化チェック
        const xValue = configElement.dataset.x;
        const yValue = configElement.dataset.y;
        const scaleValue = configElement.dataset.scale;
        
        if (xValue === 'disabled' || yValue === 'disabled' || scaleValue === 'disabled') {
            console.log(`🚨 HTML設定システムが無効化されています: ${configElementId} - v2.0座標系を使用`);
            
            // localStorage から v2.0 位置データを取得
            const savedV2Data = this.loadV2PositionFromStorage(configElementId);
            if (savedV2Data) {
                this.log(`💾 localStorage からv2.0位置データを復元: ${configElementId}`, savedV2Data);
                return savedV2Data;
            }
            
            // フォールバック: デフォルト中央配置（編集システム座標系）
            return {
                x: 50, y: 50, scale: 1.0,
                fadeDelay: parseInt(configElement.dataset.fadeDelay) || 0,
                fadeDuration: parseInt(configElement.dataset.fadeDuration) || 1000,
                coordinateSystem: 'v2.0-unified'
            };
        }
        
        // 🔄 従来のHTML設定システム値を読み込み（後方互換性保持）
        const config = {
            x: parseFloat(xValue) || 50,
            y: parseFloat(yValue) || 50,
            scale: parseFloat(scaleValue) || 1.0,
            fadeDelay: parseInt(configElement.dataset.fadeDelay) || 0,
            fadeDuration: parseInt(configElement.dataset.fadeDuration) || 1000,
            coordinateSystem: 'html-legacy'
        };
        
        this.log(`⚙️ HTML設定取得（従来システム）: ${configElementId}`, config);
        return config;
    }
    
    /**
     * パッケージ出力モード検出（Phase 2修正）
     */
    detectPackageMode() {
        // v2.0編集システムが無効でHTML設定が"disabled"の場合はパッケージモード
        const isEditSystemDisabled = !window.SpinePositioningV2 || !window.SpinePositioningV2.initialized;
        const hasDisabledConfig = document.querySelector('[data-positioning-system="v2.0-direct-css"]');
        
        return isEditSystemDisabled && hasDisabledConfig;
    }
    
    /**
     * v2.0編集システムの位置データを取得（Phase 2修正）
     */
    getV2PositionData(configElementId) {
        if (!window.SpinePositioningV2 || !window.SpinePositioningV2.initialized) {
            return null;
        }
        
        // キャラクターIDをconfigElementIdから推定
        const characterId = configElementId.replace('-config', '-canvas');
        const positionData = window.SpinePositioningV2.getCurrentPositions();
        
        if (positionData && positionData.characters && positionData.characters[characterId]) {
            const charData = positionData.characters[characterId];
            
            // 編集システム座標系から%座標に変換
            return {
                x: this.parsePercentValue(charData.position.left),
                y: this.parsePercentValue(charData.position.top),
                scale: parseFloat(charData.position.scale) || 1.0,
                fadeDelay: 0,
                fadeDuration: 1000,
                coordinateSystem: 'v2.0-unified'
            };
        }
        
        return null;
    }
    
    /**
     * localStorage からv2.0位置データを読み込み（Phase 2修正）
     */
    loadV2PositionFromStorage(configElementId) {
        try {
            const savedData = localStorage.getItem('spine-positioning-state-v2');
            if (!savedData) return null;
            
            const parsedData = JSON.parse(savedData);
            const characterId = configElementId.replace('-config', '-canvas');
            
            if (parsedData.characters && parsedData.characters[characterId]) {
                const charData = parsedData.characters[characterId];
                
                return {
                    x: this.parsePercentValue(charData.position.left),
                    y: this.parsePercentValue(charData.position.top),
                    scale: parseFloat(charData.position.scale) || 1.0,
                    fadeDelay: 0,
                    fadeDuration: 1000,
                    coordinateSystem: 'v2.0-storage'
                };
            }
        } catch (error) {
            this.log('⚠️ localStorage からのv2.0データ読み込みエラー:', error);
        }
        
        return null;
    }
    
    /**
     * パーセント値をパース（"50%" → 50）
     */
    parsePercentValue(value) {
        if (typeof value === 'string' && value.endsWith('%')) {
            return parseFloat(value.replace('%', ''));
        }
        return parseFloat(value) || 50;
    }
    
    /**
     * キャラクター位置を更新（Phase 2: 位置ロック対応）
     */
    updateCharacterPosition(characterName, vpX, vpY, scale = null) {
        // 🔒 Phase 2: 位置変更許可チェック
        if (!this.isPositionChangeAllowed('update')) {
            this.log(`🚫 位置更新拒否: ${characterName} (ロック理由: ${this.positionLock.reason})`);
            return false;
        }
        
        const character = this.characters.get(characterName);
        if (!character) {
            console.warn(`⚠️ 未登録のキャラクター: ${characterName}`);
            return false;
        }
        
        // ビューポート座標をピクセル座標に変換
        const pixelPos = this.viewportToPixel(vpX, vpY);
        
        // Canvas要素に位置を適用
        if (character.element) {
            character.element.style.left = `${vpX}%`;
            character.element.style.top = `${vpY}%`;
            
            if (scale !== null && character.spine) {
                character.spine.scaleX = character.spine.scaleY = scale;
            }
        }
        
        // 位置情報を保存
        character.lastPosition = {
            viewport: { x: vpX, y: vpY },
            pixel: pixelPos,
            scale: scale || character.lastPosition?.scale || 1.0,
            timestamp: Date.now(),
            lockedStatus: this.positionLock.enabled
        };
        
        this.log(`🔄 キャラクター位置更新: ${characterName}`, character.lastPosition);
        
        return true;
    }
    
    /**
     * すべてのキャラクター位置を更新（ウィンドウリサイズ時）
     */
    updateAllCharacterPositions() {
        let updateCount = 0;
        
        this.characters.forEach((character, name) => {
            if (character.lastPosition && character.lastPosition.viewport) {
                const { x, y } = character.lastPosition.viewport;
                const scale = character.lastPosition.scale;
                
                this.updateCharacterPosition(name, x, y, scale);
                updateCount++;
            }
        });
        
        this.log(`🔄 一括位置更新完了: ${updateCount}個のキャラクター`);
        return updateCount;
    }
    
    /**
     * Canvas要素のサイズを背景に合わせて調整
     */
    resizeCanvasToBackground(canvasElement, backgroundElement) {
        if (!canvasElement || !backgroundElement) {
            console.warn('⚠️ Canvas または背景要素が指定されていません');
            return false;
        }
        
        const bgRect = backgroundElement.getBoundingClientRect();
        
        // CSSサイズの更新
        canvasElement.style.width = `${bgRect.width}px`;
        canvasElement.style.height = `${bgRect.height}px`;
        
        // 内部解像度の更新
        canvasElement.width = bgRect.width;
        canvasElement.height = bgRect.height;
        
        this.log(`📐 Canvas サイズ更新: ${bgRect.width}×${bgRect.height}`);
        
        return true;
    }
    
    /**
     * ウィンドウリサイズ処理（デバウンス付き）
     */
    handleResize() {
        // 連続したリサイズイベントをデバウンス
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => {
            this.log('🔄 ウィンドウリサイズ処理開始');
            
            // すべてのキャラクター位置を更新
            const updateCount = this.updateAllCharacterPositions();
            
            // Canvas サイズ調整（CSS相対サイズ使用のため無効化を継続）
            // Note: CSS で 16% 相対サイズを使用するため、JavaScript による動的リサイズは不要
            // this.characters.forEach((character) => {
            //     if (character.element && character.element.tagName === 'CANVAS') {
            //         const backgroundElement = document.querySelector('.background-image');
            //         if (backgroundElement) {
            //             this.resizeCanvasToBackground(character.element, backgroundElement);
            //         }
            //     }
            // });
            
            this.log(`✅ ウィンドウリサイズ処理完了: ${updateCount}個更新`);
        }, 150); // 150ms のデバウンス
    }
    
    /**
     * デバッグ情報表示（Phase 2拡張版）
     */
    debugInfo() {
        return {
            version: 'Phase 2',
            isInitialized: this.isInitialized,
            characterCount: this.characters.size,
            positionLock: {
                enabled: this.positionLock.enabled,
                reason: this.positionLock.reason,
                lockedAt: this.positionLock.lockedAt,
                allowedOperations: Array.from(this.positionLock.allowedOperations)
            },
            initializationState: this.initializationState,
            viewportSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            globalLockStatus: window.SPINE_POSITION_LOCK || null,
            characters: Array.from(this.characters.entries()).map(([name, char]) => ({
                name,
                hasElement: !!char.element,
                lastPosition: char.lastPosition
            }))
        };
    }
    
    /**
     * Phase 2システム状態診断（商用制作ツール用）
     */
    diagnosePhase2Status() {
        console.log('🔍 Phase 2システム状態診断開始...');
        
        const diagnosis = {
            timestamp: new Date().toISOString(),
            system: {
                initialized: this.isInitialized,
                positionLockEnabled: this.positionLock.enabled,
                lockReason: this.positionLock.reason
            },
            compatibility: {
                v2EditingSystem: !!(window.SpinePositioningV2 && window.SpinePositioningV2.initialized),
                packageMode: this.detectPackageMode(),
                globalLock: !!(window.SPINE_POSITION_LOCK && window.SPINE_POSITION_LOCK.enabled)
            },
            coordination: {
                htmlConfigDisabled: document.querySelectorAll('[data-x="locked-by-phase2"]').length > 0,
                directCSSApplied: document.querySelectorAll('[data-positioning-system="v2.0-phase2-locked"]').length > 0
            },
            recommendation: this.getPhase2Recommendation()
        };
        
        console.log('📊 Phase 2診断結果:', diagnosis);
        
        // 商用制作ツールとしての稼働状態評価
        if (diagnosis.system.initialized && diagnosis.coordination.htmlConfigDisabled) {
            console.log('✅ Phase 2システム: 商用制作ツールとして正常稼働中');
        } else {
            console.log('⚠️ Phase 2システム: 設定の確認が必要です');
        }
        
        return diagnosis;
    }
    
    /**
     * Phase 2推奨アクション
     */
    getPhase2Recommendation() {
        if (!this.isInitialized) {
            return 'システム初期化が必要';
        }
        
        if (this.positionLock.enabled) {
            return 'パッケージ出力モード - 位置は完全に固定済み';
        }
        
        if (window.SpinePositioningV2 && window.SpinePositioningV2.initialized) {
            return 'v2.0編集システム連携中 - 編集可能';
        }
        
        return '通常モード - HTML設定システムを使用中';
    }
    
    /**
     * 設定をエクスポート（将来の設定ファイル保存用）
     */
    exportSettings() {
        const settings = {
            version: '2.0',
            timestamp: new Date().toISOString(),
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            characters: {}
        };
        
        this.characters.forEach((character, name) => {
            if (character.lastPosition) {
                settings.characters[name] = {
                    position: character.lastPosition.viewport,
                    scale: character.lastPosition.scale
                };
            }
        });
        
        this.log('📄 設定エクスポート', settings);
        return settings;
    }
}

// グローバルアクセス用
window.ResponsiveCoordinateSystem = ResponsiveCoordinateSystem;

// デバッグ用ヘルパー関数（Phase 2拡張版）
window.debugCoordinateSystem = function() {
    if (window.spineCoordinateSystem) {
        console.log('🔍 座標システム デバッグ情報:', window.spineCoordinateSystem.debugInfo());
        
        // Phase 2診断も実行
        if (typeof window.spineCoordinateSystem.diagnosePhase2Status === 'function') {
            window.spineCoordinateSystem.diagnosePhase2Status();
        }
    } else {
        console.log('⚠️ 座標システムが初期化されていません');
    }
};

// Phase 2専用診断関数
window.diagnosePhase2 = function() {
    console.log('🚀 Phase 2 完全診断開始...');
    
    // 1. 座標システム診断
    if (window.spineCoordinateSystem && typeof window.spineCoordinateSystem.diagnosePhase2Status === 'function') {
        window.spineCoordinateSystem.diagnosePhase2Status();
    }
    
    // 2. パッケージ出力システム統合テスト
    if (typeof window.phase2IntegratedTest === 'function') {
        window.phase2IntegratedTest();
    }
    
    // 3. v2.0編集システム状態確認
    if (window.SpinePositioningV2) {
        console.log('📝 v2.0編集システム状態:', {
            initialized: window.SpinePositioningV2.initialized,
            selectedCharacter: window.SpinePositioningV2.selectedCharacter,
            editMode: window.SpinePositioningV2.editMode
        });
    }
    
    console.log('✅ Phase 2 完全診断完了');
};

console.log('✅ Spine Responsive Coordinate System ロード完了');