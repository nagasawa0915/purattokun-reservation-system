/**
 * Spine Positioning System - Main Integration System
 * Spine配置システム統合版
 * 
 * 作成日: 2024年7月25日
 * 目的: レスポンシブ座標システムとドラッグシステムの統合
 */

class SpinePositioningSystem {
    constructor(config = {}) {
        this.config = {
            debugMode: config.debugMode || false,
            enableDrag: config.enableDrag !== false,
            enableResize: config.enableResize !== false,
            autoInitialize: config.autoInitialize !== false,
            ...config
        };
        
        this.isInitialized = false;
        this.coordinateSystem = null;
        this.dragSystem = null;
        this.characters = new Map();
        
        // ログ用
        this.log = this.config.debugMode ? console.log : () => {};
        
        this.log('🚀 SpinePositioningSystem 初期化開始', this.config);
        
        // 自動初期化
        if (this.config.autoInitialize) {
            this.initialize();
        }
    }
    
    /**
     * システム初期化
     */
    async initialize() {
        if (this.isInitialized) {
            this.log('⚠️ 既に初期化済みです');
            return;
        }
        
        try {
            // 座標システム初期化
            this.coordinateSystem = new ResponsiveCoordinateSystem({
                debugMode: this.config.debugMode,
                autoResize: this.config.enableResize
            });
            this.coordinateSystem.initialize();
            this.log('✅ 座標システム初期化完了');
            
            // ドラッグシステム初期化
            if (this.config.enableDrag) {
                this.dragSystem = new DragPositioningSystem({
                    debugMode: this.config.debugMode,
                    showCoordinates: true
                });
                this.dragSystem.initialize(this.coordinateSystem);
                this.log('✅ ドラッグシステム初期化完了');
            }
            
            // グローバル参照設定
            window.spineCoordinateSystem = this.coordinateSystem;
            window.spineDragSystem = this.dragSystem;
            window.spinePositioningSystem = this;
            
            this.isInitialized = true;
            this.log('🎉 SpinePositioningSystem 初期化完了');
            
            // デバッグ用コマンド登録
            this.registerDebugCommands();
            
        } catch (error) {
            console.error('❌ SpinePositioningSystem 初期化エラー:', error);
            throw error;
        }
    }
    
    /**
     * キャラクターを登録・設定
     */
    registerCharacter(name, config) {
        if (!this.isInitialized) {
            console.warn('⚠️ システムが初期化されていません');
            return false;
        }
        
        const character = {
            name,
            canvas: config.canvas,
            spine: config.spine,
            htmlConfig: config.htmlConfig,
            initialPosition: config.initialPosition,
            registeredAt: Date.now()
        };
        
        // 座標システムに登録
        this.coordinateSystem.registerCharacter(name, {
            element: character.canvas,
            config: character.htmlConfig,
            spine: character.spine
        });
        
        // ドラッグシステムに登録
        if (this.dragSystem && character.canvas) {
            this.dragSystem.enableDragOnCanvas(character.canvas, name);
        }
        
        // HTML設定から初期位置を読み込み
        if (character.htmlConfig) {
            const htmlConfig = this.coordinateSystem.getPositionFromHTMLConfig(character.htmlConfig);
            if (htmlConfig) {
                this.coordinateSystem.updateCharacterPosition(name, htmlConfig.x, htmlConfig.y, htmlConfig.scale);
            }
        }
        
        this.characters.set(name, character);
        this.log(`👤 キャラクター登録完了: ${name}`, character);
        
        return true;
    }
    
    /**
     * 既存のSpine統合システムとの互換性確保
     */
    integrateWithExistingSpine(canvasId, configId, spineName = 'purattokun') {
        const canvas = document.getElementById(canvasId);
        const config = document.getElementById(configId);
        
        if (!canvas) {
            console.warn(`⚠️ Canvas要素が見つかりません: ${canvasId}`);
            return false;
        }
        
        if (!config) {
            console.warn(`⚠️ 設定要素が見つかりません: ${configId}`);
            return false;
        }
        
        // キャラクター登録
        const success = this.registerCharacter(spineName, {
            canvas: canvas,
            htmlConfig: configId,
            spine: null // Spine オブジェクトは後で設定される
        });
        
        if (success) {
            this.log(`🔗 既存Spine統合完了: ${spineName}`);
            
            // 初期位置設定
            const htmlConfig = this.coordinateSystem.getPositionFromHTMLConfig(configId);
            if (htmlConfig) {
                this.coordinateSystem.updateCharacterPosition(spineName, htmlConfig.x, htmlConfig.y, htmlConfig.scale);
                
                // Canvas CSS適用
                canvas.style.left = `${htmlConfig.x}%`;
                canvas.style.top = `${htmlConfig.y}%`;
            }
        }
        
        return success;
    }
    
    /**
     * ポジショニングモード切り替え
     */
    togglePositioningMode() {
        if (!this.dragSystem) {
            console.warn('⚠️ ドラッグシステムが有効になっていません');
            return false;
        }
        
        return this.dragSystem.togglePositioningMode();
    }
    
    /**
     * 現在の設定をエクスポート
     */
    exportSettings() {
        if (!this.coordinateSystem) {
            console.warn('⚠️ 座標システムが初期化されていません');
            return null;
        }
        
        const settings = this.coordinateSystem.exportSettings();
        
        // システム情報追加
        settings.system = {
            version: '2.0',
            created: new Date().toISOString(),
            characters: this.characters.size
        };
        
        this.log('📄 設定エクスポート完了', settings);
        return settings;
    }
    
    /**
     * 設定ファイルから読み込み（将来実装）
     */
    async loadFromConfig(configFile) {
        // TODO: 設定ファイルからの読み込み機能
        console.log('🔄 設定ファイル読み込み機能は今後実装予定:', configFile);
    }
    
    /**
     * デバッグ用コマンド登録
     */
    registerDebugCommands() {
        // ポジショニングモード切り替え
        window.togglePositioning = () => this.togglePositioningMode();
        
        // 設定エクスポート
        window.exportSpineSettings = () => {
            const settings = this.exportSettings();
            console.log('📋 現在の設定:', settings);
            return settings;
        };
        
        // キャラクター情報表示
        window.showSpineCharacters = () => {
            console.log('👥 登録済みキャラクター:');
            this.characters.forEach((char, name) => {
                console.log(`  - ${name}:`, char);
            });
        };
        
        // システム状態表示
        window.showSpineSystemStatus = () => {
            console.log('🔍 システム状態:');
            console.log('  - 初期化:', this.isInitialized);
            console.log('  - キャラクター数:', this.characters.size);
            console.log('  - ポジショニングモード:', window.spinePositioningModeActive || false);
            console.log('  - 座標システム:', !!this.coordinateSystem);
            console.log('  - ドラッグシステム:', !!this.dragSystem);
        };
        
        this.log('🛠️ デバッグコマンド登録完了');
        console.log('🎯 利用可能なコマンド:');
        console.log('  - togglePositioning() : ポジショニングモード切り替え');
        console.log('  - exportSpineSettings() : 設定エクスポート');
        console.log('  - showSpineCharacters() : キャラクター一覧');
        console.log('  - showSpineSystemStatus() : システム状態');
    }
    
    /**
     * デバッグ情報
     */
    debugInfo() {
        return {
            isInitialized: this.isInitialized,
            characterCount: this.characters.size,
            hasCoordinateSystem: !!this.coordinateSystem,
            hasDragSystem: !!this.dragSystem,
            positioningMode: window.spinePositioningModeActive || false,
            config: this.config,
            characters: Array.from(this.characters.keys())
        };
    }
}

// 自動初期化（ページロード後）
document.addEventListener('DOMContentLoaded', () => {
    // 依存関係チェック
    if (typeof ResponsiveCoordinateSystem === 'undefined') {
        console.warn('⚠️ ResponsiveCoordinateSystem が読み込まれていません');
        return;
    }
    
    if (typeof DragPositioningSystem === 'undefined') {
        console.warn('⚠️ DragPositioningSystem が読み込まれていません');
        return;
    }
    
    // システム初期化
    window.spinePositioningSystemInstance = new SpinePositioningSystem({
        debugMode: true, // 開発中はデバッグ有効
        enableDrag: true,
        enableResize: true
    });
    
    // 既存システムとの統合
    setTimeout(() => {
        // ページ上に purattokun-canvas と purattokun-config があれば自動統合
        const canvas = document.getElementById('purattokun-canvas');
        const config = document.getElementById('purattokun-config');
        
        if (canvas && config) {
            window.spinePositioningSystemInstance.integrateWithExistingSpine(
                'purattokun-canvas',
                'purattokun-config',
                'purattokun'
            );
            console.log('🎉 既存 ぷらっとくん との統合完了');
            console.log('💡 togglePositioning() でポジショニングモードを有効にできます');
        }
    }, 1000); // Spineの初期化を待つ
});

// グローバルアクセス用
window.SpinePositioningSystem = SpinePositioningSystem;

console.log('✅ Spine Positioning System Main Integration ロード完了');