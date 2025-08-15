/**
 * Spine WebGL Renderer v2.0 - デスクトップアプリ統合版
 * 
 * 目的: 実際のSpineキャラクター（ぷらっとくん等）の表示・アニメーション再生
 * 技術: Spine WebGL 4.1.24固定・フォールバック機能・メモリ管理
 * 統合: デスクトップアプリ spine-stage でのCanvas管理
 */

export class SpineWebGLRenderer {
    constructor() {
        this.spineVersion = '4.1.24';
        this.maxInitAttempts = 100;
        this.loadedCharacters = new Map();
        this.renderingContexts = new Map();
        this.isInitialized = false;
        this.globalRenderer = null;
        
        console.log('🎭 SpineWebGLRenderer v2.0 初期化中...');
    }

    /**
     * 初期化: Spine WebGL CDN読み込み確認・WebGLサポート検証
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('✅ SpineWebGLRenderer 既に初期化済み');
            return true;
        }

        try {
            // Spine WebGL読み込み待機
            await this.waitForSpineWebGL();
            
            // WebGLサポート確認
            this.verifyWebGLSupport();
            
            this.isInitialized = true;
            console.log('✅ SpineWebGLRenderer 初期化完了');
            
            // グローバル関数公開（デバッグ用）
            this.exposeGlobalFunctions();
            
            return true;
            
        } catch (error) {
            console.error('❌ SpineWebGLRenderer 初期化失敗:', error.message);
            throw error;
        }
    }

    /**
     * Spine WebGL CDN読み込み待機（最大10秒）
     */
    async waitForSpineWebGL() {
        let attempts = 0;
        
        while (typeof spine === 'undefined' && attempts < this.maxInitAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof spine === 'undefined') {
            throw new Error(`Spine WebGL ${this.spineVersion}の読み込みタイムアウト (10秒)`);
        }
        
        // バージョン・必要クラス確認
        if (!spine.SceneRenderer || !spine.AssetManager) {
            throw new Error('Spine WebGL 必要クラスが見つかりません');
        }
        
        console.log(`✅ Spine WebGL ${this.spineVersion} 読み込み完了`);
    }

    /**
     * WebGLサポート検証
     */
    verifyWebGLSupport() {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
        
        if (!gl) {
            throw new Error('WebGLがサポートされていません');
        }
        
        console.log('✅ WebGLサポート確認完了');
    }

    /**
     * キャラクター読み込み・Canvas作成
     * @param {Object} character - キャラクター情報
     * @param {HTMLElement} targetContainer - 配置先要素（.spine-stage）
     * @param {number} x - 配置X座標
     * @param {number} y - 配置Y座標
     */
    async loadCharacter(character, targetContainer, x = 200, y = 200) {
        try {
            console.log(`🎭 キャラクター読み込み開始: ${character.name}`);
            
            // Canvas要素作成
            const canvas = this.createCanvas(character, x, y);
            
            // WebGLコンテキスト作成
            const gl = this.createWebGLContext(canvas);
            
            // Spine WebGL レンダラー初期化
            const renderer = await this.createSpineRenderer(canvas, gl, character);
            
            // アセット読み込み・表示
            await this.loadCharacterAssets(renderer, character);
            
            // Container に追加
            targetContainer.appendChild(canvas);
            
            // レンダリング開始
            this.startRendering(renderer, character.id);
            
            // 状態保存
            this.loadedCharacters.set(character.id, {
                character,
                canvas,
                renderer,
                isActive: true
            });
            
            console.log(`✅ キャラクター読み込み完了: ${character.name}`);
            
            // カスタムイベント発火
            this.dispatchCharacterEvent('spine-character-loaded', {
                character,
                canvas,
                renderer
            });
            
            return { canvas, renderer };
            
        } catch (error) {
            console.error(`❌ キャラクター読み込み失敗: ${character.name}`, error);
            
            // フォールバック: プレースホルダー作成
            return this.createPlaceholder(character, targetContainer, x, y);
        }
    }

    /**
     * Canvas要素作成
     */
    createCanvas(character, x, y) {
        const canvas = document.createElement('canvas');
        canvas.id = `spine-${character.id}-${Date.now()}`;
        canvas.className = 'spine-character-canvas';
        canvas.width = 400;
        canvas.height = 400;
        
        // デスクトップアプリ用スタイル
        canvas.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 400px;
            height: 400px;
            border: 2px solid transparent;
            border-radius: 8px;
            cursor: pointer;
            z-index: 1050;
            transition: border-color 0.2s;
        `;
        
        // ホバー効果
        canvas.addEventListener('mouseenter', () => {
            canvas.style.borderColor = '#667eea';
        });
        
        canvas.addEventListener('mouseleave', () => {
            canvas.style.borderColor = 'transparent';
        });
        
        return canvas;
    }

    /**
     * WebGLコンテキスト作成
     */
    createWebGLContext(canvas) {
        const gl = canvas.getContext('webgl2', {
            alpha: false,
            antialias: true,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false
        }) || canvas.getContext('webgl', {
            alpha: false,
            antialias: true
        });
        
        if (!gl) {
            throw new Error('WebGLコンテキストの作成に失敗');
        }
        
        return gl;
    }

    /**
     * Spine レンダラー作成
     */
    async createSpineRenderer(canvas, gl, character) {
        try {
            // Spine SceneRenderer初期化
            const renderer = new spine.SceneRenderer(canvas, gl);
            
            console.log(`✅ Spine SceneRenderer作成完了: ${character.name}`);
            return renderer;
            
        } catch (error) {
            console.error('Spine SceneRenderer作成失敗:', error);
            throw error;
        }
    }

    /**
     * アセット読み込み・Skeleton初期化
     */
    async loadCharacterAssets(renderer, character) {
        try {
            // アセットパス構築
            const basePath = `./assets/spine/characters/${character.id}/`;
            const atlasPath = `${basePath}${character.id}.atlas`;
            const jsonPath = `${basePath}${character.id}.json`;
            
            console.log(`📦 アセット読み込み: ${character.name}`);
            console.log(`Atlas: ${atlasPath}`);
            console.log(`JSON: ${jsonPath}`);
            
            // AssetManager使用
            const assetManager = new spine.AssetManager(renderer.context);
            
            // アセット登録
            assetManager.loadTextureAtlas(atlasPath);
            assetManager.loadText(jsonPath);
            
            // 読み込み完了待機
            await this.waitForAssetLoading(assetManager);
            
            // Skeleton作成
            const atlas = assetManager.require(atlasPath);
            const skeletonJson = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(atlas));
            const skeletonData = skeletonJson.readSkeletonData(assetManager.require(jsonPath));
            const skeleton = new spine.Skeleton(skeletonData);
            
            // 🚀 今回実験で証明された最シンプル座標配置
            skeleton.x = 0;
            skeleton.y = 0;
            skeleton.scaleX = skeleton.scaleY = 1.0;
            
            // AnimationState作成
            const animationState = new spine.AnimationState(new spine.AnimationStateData(skeletonData));
            
            // デフォルトアニメーション設定
            this.setDefaultAnimation(animationState, skeletonData);
            
            // レンダラーに設定
            renderer.skeleton = skeleton;
            renderer.animationState = animationState;
            
            console.log(`✅ アセット読み込み完了: ${character.name}`);
            
        } catch (error) {
            console.error(`❌ アセット読み込み失敗: ${character.name}`, error);
            throw error;
        }
    }

    /**
     * アセット読み込み完了待機
     */
    async waitForAssetLoading(assetManager) {
        const maxWaitTime = 10000; // 10秒
        const startTime = Date.now();
        
        while (!assetManager.isLoadingComplete()) {
            if (Date.now() - startTime > maxWaitTime) {
                throw new Error('アセット読み込みタイムアウト');
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    /**
     * デフォルトアニメーション設定
     */
    setDefaultAnimation(animationState, skeletonData) {
        const animations = skeletonData.animations;
        
        // 優先順位: idle → taiki → 最初のアニメーション
        const defaultNames = ['idle', 'taiki'];
        let defaultAnimation = null;
        
        for (const name of defaultNames) {
            defaultAnimation = animations.find(anim => anim.name === name);
            if (defaultAnimation) break;
        }
        
        if (!defaultAnimation && animations.length > 0) {
            defaultAnimation = animations[0];
        }
        
        if (defaultAnimation) {
            animationState.setAnimation(0, defaultAnimation.name, true);
            console.log(`🎬 デフォルトアニメーション設定: ${defaultAnimation.name}`);
        }
    }

    /**
     * レンダリング開始（60FPS）
     */
    startRendering(renderer, characterId) {
        let lastTime = 0;
        
        const renderLoop = (currentTime) => {
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            
            // キャラクターが削除されていたら停止
            if (!this.loadedCharacters.has(characterId)) {
                return;
            }
            
            try {
                // アニメーション更新
                renderer.animationState.update(deltaTime);
                renderer.animationState.apply(renderer.skeleton);
                renderer.skeleton.updateWorldTransform();
                
                // 描画
                renderer.camera.viewportWidth = renderer.canvas.width;
                renderer.camera.viewportHeight = renderer.canvas.height;
                renderer.resize();
                
                renderer.begin();
                renderer.drawSkeleton(renderer.skeleton, true);
                renderer.end();
                
            } catch (error) {
                console.error(`レンダリングエラー: ${characterId}`, error);
                return;
            }
            
            // 次フレーム
            requestAnimationFrame(renderLoop);
        };
        
        requestAnimationFrame(renderLoop);
        console.log(`🎬 レンダリング開始: ${characterId}`);
    }

    /**
     * プレースホルダー作成（WebGL失敗時）
     */
    createPlaceholder(character, targetContainer, x, y) {
        console.warn(`📋 プレースホルダー作成: ${character.name}`);
        
        const placeholder = document.createElement('div');
        placeholder.className = 'spine-placeholder';
        placeholder.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 200px;
            height: 200px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: Arial, sans-serif;
            cursor: pointer;
            z-index: 1050;
        `;
        
        placeholder.innerHTML = `
            <div style="font-size: 40px; margin-bottom: 10px;">🎭</div>
            <div style="font-weight: bold;">${character.name}</div>
            <div style="font-size: 12px; opacity: 0.8;">WebGL Placeholder</div>
        `;
        
        targetContainer.appendChild(placeholder);
        
        return { canvas: placeholder, renderer: null };
    }

    /**
     * カスタムイベント発火
     */
    dispatchCharacterEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    /**
     * グローバル関数公開（デバッグ用）
     */
    exposeGlobalFunctions() {
        window.spineWebGLRenderer = this;
        
        window.playSpineAnimation = (characterId, animationName, loop = true) => {
            const charData = this.loadedCharacters.get(characterId);
            if (charData && charData.renderer.animationState) {
                charData.renderer.animationState.setAnimation(0, animationName, loop);
                console.log(`🎬 アニメーション再生: ${characterId} → ${animationName}`);
            }
        };
        
        window.getSpineDebugInfo = () => {
            return {
                loadedCharacters: Array.from(this.loadedCharacters.keys()),
                spineVersion: this.spineVersion,
                isInitialized: this.isInitialized
            };
        };
        
        window.removeSpineCharacter = (characterId) => {
            const charData = this.loadedCharacters.get(characterId);
            if (charData) {
                charData.canvas.remove();
                this.loadedCharacters.delete(characterId);
                console.log(`🗑️ キャラクター削除: ${characterId}`);
            }
        };
        
        console.log('🔧 グローバル関数公開完了 (playSpineAnimation, getSpineDebugInfo, removeSpineCharacter)');
    }

    /**
     * リソース解放
     */
    dispose() {
        this.loadedCharacters.forEach((charData, characterId) => {
            if (charData.canvas) {
                charData.canvas.remove();
            }
        });
        
        this.loadedCharacters.clear();
        this.renderingContexts.clear();
        this.isInitialized = false;
        
        console.log('🧹 SpineWebGLRenderer リソース解放完了');
    }
}

// シングルトンインスタンス（デスクトップアプリ用）
let globalSpineRenderer = null;

export async function getSpineRenderer() {
    if (!globalSpineRenderer) {
        globalSpineRenderer = new SpineWebGLRenderer();
        await globalSpineRenderer.initialize();
    }
    return globalSpineRenderer;
}

console.log('📦 SpineWebGLRenderer v2.0 モジュール読み込み完了');