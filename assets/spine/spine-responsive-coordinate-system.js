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
        
        // ログ用
        this.log = this.config.debugMode ? console.log : () => {};
        
        this.log('📐 ResponsiveCoordinateSystem 初期化開始', this.config);
    }
    
    /**
     * システム初期化
     */
    initialize() {
        if (this.isInitialized) {
            this.log('⚠️ 既に初期化済みです');
            return;
        }
        
        // ウィンドウリサイズイベント
        if (this.config.autoResize) {
            window.addEventListener('resize', this.handleResize.bind(this));
            this.log('🔄 ウィンドウリサイズ監視開始');
        }
        
        this.isInitialized = true;
        this.log('✅ ResponsiveCoordinateSystem 初期化完了');
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
     * HTML設定からキャラクター位置を取得
     */
    getPositionFromHTMLConfig(configElementId) {
        const configElement = document.getElementById(configElementId);
        if (!configElement) {
            console.warn(`⚠️ 設定要素が見つかりません: ${configElementId}`);
            return null;
        }
        
        const config = {
            x: parseFloat(configElement.dataset.x) || 50,
            y: parseFloat(configElement.dataset.y) || 50,
            scale: parseFloat(configElement.dataset.scale) || 1.0,
            fadeDelay: parseInt(configElement.dataset.fadeDelay) || 0,
            fadeDuration: parseInt(configElement.dataset.fadeDuration) || 1000
        };
        
        this.log(`⚙️ HTML設定取得: ${configElementId}`, config);
        return config;
    }
    
    /**
     * キャラクター位置を更新
     */
    updateCharacterPosition(characterName, vpX, vpY, scale = null) {
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
            timestamp: Date.now()
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
     * デバッグ情報表示
     */
    debugInfo() {
        return {
            isInitialized: this.isInitialized,
            characterCount: this.characters.size,
            viewportSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            characters: Array.from(this.characters.entries()).map(([name, char]) => ({
                name,
                hasElement: !!char.element,
                lastPosition: char.lastPosition
            }))
        };
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

// デバッグ用ヘルパー関数
window.debugCoordinateSystem = function() {
    if (window.spineCoordinateSystem) {
        console.log('🔍 座標システム デバッグ情報:', window.spineCoordinateSystem.debugInfo());
    } else {
        console.log('⚠️ 座標システムが初期化されていません');
    }
};

console.log('✅ Spine Responsive Coordinate System ロード完了');