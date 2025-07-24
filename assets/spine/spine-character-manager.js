/**
 * Spine キャラクター管理システム
 * キャラクターの読み込み、管理、アニメーション制御を担当
 */

class SpineCharacterManager {
    constructor() {
        this.characters = new Map();
        this.initialized = false;
    }

    /**
     * Spineランタイムの初期化
     */
    async init() {
        // CDNからの読み込み待機（待機時間を延長）
        let attempts = 0;
        const maxAttempts = 100; // 10秒間待機（延長）
        
        log(LogLevel.INFO, 'initialization', 'Waiting for Spine WebGL CDN to load...');
        
        while (typeof spine === 'undefined' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
            if (attempts % 10 === 0) {
                log(LogLevel.DEBUG, 'initialization', `CDN loading attempt ${attempts}/${maxAttempts}...`);
            }
        }
        
        if (typeof spine === 'undefined') {
            log(LogLevel.ERROR, 'initialization', 'Spine WebGL runtime not loaded from CDN after 10 seconds');
            log(LogLevel.ERROR, 'initialization', 'Check browser Network tab for CDN loading issues');
            return false;
        }

        try {
            this.initialized = true;
            
            log(LogLevel.INFO, 'initialization', '=== Spine Runtime バージョン詳細確認 ===');
            log(LogLevel.INFO, 'initialization', 'Spine WebGL 4.1.* initialized successfully from CDN');
            
            // Runtime情報の詳細ログ（新しいログシステムに移行予定）
            console.log('📋 Spine Runtime Information:');
            console.log('  - Spine object type:', typeof spine);
            console.log('  - Spine constructor:', spine.constructor?.name || 'N/A');
            console.log('  - Spine object keys:', Object.keys(spine));
            console.log('  - Spine webgl exists:', !!spine.webgl);
            
            if (spine.webgl) {
                console.log('  - WebGL object keys:', Object.keys(spine.webgl));
            } else {
                console.log('  - ❌ spine.webgl is missing - this is the root problem!');
            }
            
            return true;
        } catch (error) {
            log(LogLevel.ERROR, 'initialization', 'Failed to initialize Spine WebGL:', error);
            return false;
        }
    }

    /**
     * キャラクターを読み込み
     * @param {string} name - キャラクター名
     * @param {string} basePath - ファイルパス
     * @param {HTMLElement} container - 配置先コンテナ
     */
    async loadCharacter(name, basePath, container) {
        log(LogLevel.INFO, 'animation', `Starting character load: ${name} from ${basePath}`);
        
        if (!this.initialized) {
            log(LogLevel.WARN, 'animation', 'Spine not initialized, using placeholder mode');
            return this.createPlaceholderCharacter(name, basePath, container);
        }

        // CORS/file:// プロトコル検出
        const isFileProtocol = window.location.protocol === 'file:';
        if (isFileProtocol) {
            log(LogLevel.WARN, 'initialization', 'File protocol detected. Spine WebGL requires HTTP server.');
            log(LogLevel.INFO, 'initialization', 'Please run: python -m http.server 8000');
            log(LogLevel.INFO, 'initialization', 'Using placeholder mode for now');
            return this.createPlaceholderCharacter(name, basePath, container);
        }

        // まずプレースホルダーを作成して即座に登録（アニメーション呼び出しエラーを防ぐ）
        const placeholderChar = this.createPlaceholderCharacter(name, basePath, container);
        log(LogLevel.DEBUG, 'animation', `Placeholder created for ${name}, attempting Spine upgrade...`);

        // 非同期でSpine WebGL化を試行
        setTimeout(async () => {
            try {
                await this.upgradeToSpineWebGL(name, basePath, container);
            } catch (error) {
                log(LogLevel.DEBUG, 'animation', `Spine upgrade failed for ${name}, keeping placeholder: ${error.message}`);
            }
        }, 100);

        return placeholderChar;
    }

    /**
     * プレースホルダーキャラクター作成
     */
    createPlaceholderCharacter(name, basePath, container) {
        log(LogLevel.DEBUG, 'animation', `Creating placeholder for ${name}`);
        
        const character = {
            name: name,
            type: 'placeholder',
            element: this.createPlaceholderElement()
        };
        
        // コンテナに追加
        if (container) {
            container.appendChild(character.element);
        } else {
            document.body.appendChild(character.element);
        }
        
        this.characters.set(name, character);
        return character;
    }

    /**
     * プレースホルダーDOM要素作成
     */
    createPlaceholderElement() {
        const element = document.createElement('div');
        element.innerHTML = '🐱';
        element.style.cssText = `
            position: absolute;
            font-size: 40px;
            opacity: 0.7;
            animation: placeholderFloat 3s ease-in-out infinite;
            pointer-events: none;
            z-index: 10;
        `;
        
        return element;
    }

    /**
     * プレースホルダーからSpine WebGLにアップグレード
     */
    async upgradeToSpineWebGL(name, basePath, container) {
        if (typeof spine === 'undefined') {
            throw new Error('Spine runtime not available');
        }

        log(LogLevel.INFO, 'animation', `Upgrading ${name} to Spine WebGL...`);

        // この部分は元のファイルから詳細な実装をコピーする必要があります
        // 現在は基本構造のみ
        
        throw new Error('Full Spine WebGL implementation pending migration');
    }

    /**
     * キャラクターの位置設定
     */
    setPosition(name, x, y) {
        const character = this.characters.get(name);
        if (!character) {
            log(LogLevel.WARN, 'position', `Character ${name} not found for position setting`);
            return;
        }

        log(LogLevel.DEBUG, 'position', `Setting position for ${name}: (${x}, ${y})`);
        
        if (character.type === 'placeholder') {
            character.element.style.left = x + 'px';
            character.element.style.top = y + 'px';
        } else {
            // Spine WebGL character position setting
            // Implementation pending
        }
    }

    /**
     * アニメーション再生
     */
    playSequenceAnimation(name, animationName = 'default') {
        const character = this.characters.get(name);
        if (!character) {
            log(LogLevel.WARN, 'animation', `Character ${name} not found for animation`);
            return;
        }

        log(LogLevel.DEBUG, 'animation', `Playing animation ${animationName} for ${name}`);
        
        if (character.type === 'placeholder') {
            // プレースホルダーアニメーション
            character.element.style.animation = 'placeholderFloat 2s ease-in-out infinite';
        } else {
            // Spine WebGL animation
            // Implementation pending
        }
    }

}