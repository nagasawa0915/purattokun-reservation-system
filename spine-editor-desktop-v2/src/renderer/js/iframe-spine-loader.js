/**
 * iframe内でのSpine WebGL読み込み・表示システム
 * プレビューHTML内に動的にSpine環境をセットアップし、
 * postMessage通信でキャラクター追加・編集を行う
 */

class IframeSpineLoader {
    constructor() {
        this.spineLoaded = false;
        this.spineCharacters = new Map();
        this.spineApp = null;
        this.canvas = null;
        this.context = null;
        this.setupMessageListener();
        
        console.log('🎭 IframeSpineLoader initialized');
    }

    /**
     * postMessage通信をセットアップ
     */
    setupMessageListener() {
        window.addEventListener('message', (event) => {
            if (event.origin !== window.location.origin) {
                return; // セキュリティ: 同一オリジンのみ許可
            }
            
            const { type, data } = event.data;
            
            switch (type) {
                case 'SPINE_ADD_CHARACTER':
                    this.handleAddCharacter(data);
                    break;
                case 'SPINE_UPDATE_CHARACTER':
                    this.handleUpdateCharacter(data);
                    break;
                case 'SPINE_REMOVE_CHARACTER':
                    this.handleRemoveCharacter(data);
                    break;
                case 'SPINE_INIT':
                    this.initializeSpineEnvironment();
                    break;
                default:
                    console.log('🎭 Unknown message type:', type);
            }
        });
        
        console.log('✅ PostMessage listener setup complete');
    }

    /**
     * Spine WebGL環境を初期化
     */
    async initializeSpineEnvironment() {
        console.log('🎭 Initializing Spine WebGL environment...');
        
        try {
            // Spine WebGLライブラリを動的読み込み
            await this.loadSpineWebGL();
            
            // Canvas要素を作成・設定
            this.createCanvas();
            
            // Spine applicationを初期化
            this.initializeSpineApp();
            
            this.spineLoaded = true;
            console.log('✅ Spine WebGL environment initialized successfully');
            
            // 親ウィンドウに初期化完了を通知
            this.notifyParent('SPINE_READY', { success: true });
            
        } catch (error) {
            console.error('❌ Spine WebGL initialization failed:', error);
            this.spineLoaded = false;
            
            // 親ウィンドウにエラーを通知
            this.notifyParent('SPINE_ERROR', { 
                error: error.message,
                type: 'initialization_failed'
            });
        }
    }

    /**
     * Spine WebGLライブラリを動的読み込み
     */
    async loadSpineWebGL() {
        if (window.spine) {
            console.log('✅ Spine WebGL already loaded');
            return;
        }
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = '../assets/spine/spine-webgl.js';
            script.onload = () => {
                console.log('✅ Spine WebGL library loaded');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load Spine WebGL library'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Canvas要素を作成・設定
     */
    createCanvas() {
        // 既存のSpineコンテナを検索
        let spineContainer = document.getElementById('spine-container');
        
        if (!spineContainer) {
            // Spineコンテナを作成
            spineContainer = document.createElement('div');
            spineContainer.id = 'spine-container';
            spineContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1000;
            `;
            document.body.appendChild(spineContainer);
        }
        
        // Canvas要素を作成
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'spine-canvas';
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: auto;
        `;
        
        // Canvasサイズを設定
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        spineContainer.appendChild(this.canvas);
        
        console.log('✅ Canvas created and configured');
    }

    /**
     * Spine applicationを初期化
     */
    initializeSpineApp() {
        try {
            // WebGLコンテキストを取得
            this.context = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
            
            if (!this.context) {
                throw new Error('WebGL not supported');
            }
            
            // Spine WebGL applicationを作成
            this.spineApp = new spine.SpineCanvas(this.canvas, {
                pathPrefix: '../', // Spineアセットのベースパス
                premultipliedAlpha: false,
                alpha: true
            });
            
            console.log('✅ Spine application initialized');
            
        } catch (error) {
            console.error('❌ Spine application initialization failed:', error);
            throw error;
        }
    }

    /**
     * キャラクター追加ハンドラ
     * @param {object} data - キャラクターデータ
     */
    async handleAddCharacter(data) {
        console.log('🎭 Adding Spine character:', data);
        
        if (!this.spineLoaded) {
            console.warn('⚠️ Spine not loaded, initializing...');
            await this.initializeSpineEnvironment();
        }
        
        try {
            const characterId = data.characterId || `character_${Date.now()}`;
            const characterData = data.characterData;
            const position = data.position || { x: 200, y: 200 };
            const scale = data.scale || 0.5;
            
            // Spineキャラクターを読み込み・表示
            const spineCharacter = await this.loadSpineCharacter(
                characterData.name,
                characterData.jsonPath,
                characterData.atlasPath,
                position,
                scale
            );
            
            // キャラクターを管理リストに追加
            this.spineCharacters.set(characterId, {
                id: characterId,
                spine: spineCharacter,
                data: characterData,
                position: position,
                scale: scale
            });
            
            console.log(`✅ Character "${characterData.name}" added successfully`);
            
            // 親ウィンドウに成功を通知
            this.notifyParent('SPINE_CHARACTER_ADDED', {
                characterId,
                success: true
            });
            
        } catch (error) {
            console.error('❌ Failed to add character:', error);
            
            // 親ウィンドウにエラーを通知
            this.notifyParent('SPINE_CHARACTER_ERROR', {
                characterId: data.characterId,
                error: error.message,
                type: 'add_failed'
            });
        }
    }

    /**
     * Spineキャラクターを読み込み・表示
     * @param {string} name - キャラクター名
     * @param {string} jsonPath - JSONファイルパス
     * @param {string} atlasPath - Atlasファイルパス
     * @param {object} position - 位置 {x, y}
     * @param {number} scale - スケール
     */
    async loadSpineCharacter(name, jsonPath, atlasPath, position, scale) {
        return new Promise((resolve, reject) => {
            // Spineアセットマネージャーを使用してキャラクターを読み込み
            const assetManager = new spine.AssetManager();
            
            // アセットを追加
            assetManager.loadText(jsonPath);
            assetManager.loadTextureAtlas(atlasPath);
            
            // 読み込み完了後のコールバック
            assetManager.loadAll(() => {
                try {
                    // Skeleton Dataを作成
                    const atlas = assetManager.get(atlasPath);
                    const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
                    const skeletonJson = new spine.SkeletonJson(atlasLoader);
                    const skeletonData = skeletonJson.readSkeletonData(assetManager.get(jsonPath));
                    
                    // Skeletonとアニメーションステートを作成
                    const skeleton = new spine.Skeleton(skeletonData);
                    const animationState = new spine.AnimationState(new spine.AnimationStateData(skeletonData));
                    
                    // 位置とスケールを設定
                    // 🚀 今回実験で証明された最シンプル実装
                    skeleton.x = 0;
                    skeleton.y = 0;
                    skeleton.scaleX = scale;
                    skeleton.scaleY = scale;
                    
                    // デフォルトアニメーションを設定
                    if (skeletonData.animations.length > 0) {
                        animationState.setAnimation(0, skeletonData.animations[0].name, true);
                    }
                    
                    // レンダリングループに追加
                    this.spineApp.loadSkeleton(name, skeleton, animationState);
                    
                    console.log(`✅ Spine character "${name}" loaded successfully`);
                    
                    resolve({
                        skeleton,
                        animationState,
                        skeletonData
                    });
                    
                } catch (error) {
                    console.error(`❌ Failed to create skeleton for "${name}":`, error);
                    reject(error);
                }
            });
        });
    }

    /**
     * キャラクター更新ハンドラ
     * @param {object} data - 更新データ
     */
    handleUpdateCharacter(data) {
        console.log('🎭 Updating character:', data);
        
        const { characterId, position, scale, animation } = data;
        const character = this.spineCharacters.get(characterId);
        
        if (!character) {
            console.warn(`⚠️ Character "${characterId}" not found`);
            return;
        }
        
        try {
            // 位置更新
            if (position) {
                // 🚀 今回実験で証明された最シンプル実装
                character.spine.skeleton.x = 0;
                character.spine.skeleton.y = 0;
                character.position = position;
            }
            
            // スケール更新
            if (scale !== undefined) {
                character.spine.skeleton.scaleX = scale;
                character.spine.skeleton.scaleY = scale;
                character.scale = scale;
            }
            
            // アニメーション更新
            if (animation && character.spine.animationState) {
                character.spine.animationState.setAnimation(0, animation, true);
            }
            
            console.log(`✅ Character "${characterId}" updated successfully`);
            
            // 親ウィンドウに成功を通知
            this.notifyParent('SPINE_CHARACTER_UPDATED', {
                characterId,
                success: true
            });
            
        } catch (error) {
            console.error('❌ Failed to update character:', error);
            
            // 親ウィンドウにエラーを通知
            this.notifyParent('SPINE_CHARACTER_ERROR', {
                characterId,
                error: error.message,
                type: 'update_failed'
            });
        }
    }

    /**
     * キャラクター削除ハンドラ
     * @param {object} data - 削除データ
     */
    handleRemoveCharacter(data) {
        console.log('🎭 Removing character:', data);
        
        const { characterId } = data;
        const character = this.spineCharacters.get(characterId);
        
        if (!character) {
            console.warn(`⚠️ Character "${characterId}" not found`);
            return;
        }
        
        try {
            // Spineアプリケーションからキャラクターを削除
            this.spineApp.removeSkeleton(character.data.name);
            
            // 管理リストから削除
            this.spineCharacters.delete(characterId);
            
            console.log(`✅ Character "${characterId}" removed successfully`);
            
            // 親ウィンドウに成功を通知
            this.notifyParent('SPINE_CHARACTER_REMOVED', {
                characterId,
                success: true
            });
            
        } catch (error) {
            console.error('❌ Failed to remove character:', error);
            
            // 親ウィンドウにエラーを通知
            this.notifyParent('SPINE_CHARACTER_ERROR', {
                characterId,
                error: error.message,
                type: 'remove_failed'
            });
        }
    }

    /**
     * 親ウィンドウにメッセージを送信
     * @param {string} type - メッセージタイプ
     * @param {object} data - メッセージデータ
     */
    notifyParent(type, data) {
        window.parent.postMessage({
            type,
            data,
            source: 'iframe-spine-loader'
        }, window.location.origin);
    }

    /**
     * ウィンドウリサイズ時のCanvasサイズ調整
     */
    handleResize() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            
            if (this.spineApp) {
                this.spineApp.resize();
            }
        }
    }
}

// グローバルインスタンスを作成
window.iframeSpineLoader = new IframeSpineLoader();

// ウィンドウリサイズイベントを設定
window.addEventListener('resize', () => {
    window.iframeSpineLoader.handleResize();
});

// ページ読み込み完了後に自動初期化（必要に応じて）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🎭 DOM loaded, ready for Spine initialization');
    });
} else {
    console.log('🎭 DOM already loaded, ready for Spine initialization');
}

console.log('🎭 IframeSpineLoader script loaded');