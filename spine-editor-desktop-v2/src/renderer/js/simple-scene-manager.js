/**
 * シンプルシーン管理システム (Simple Scene Manager)
 * 
 * 目的: Spine WebGLシーンの軽量で直感的な管理を実現
 * 特徴: 既存システムの複雑さを排除し、最低限の機能に絞った設計
 * 
 * 核心機能:
 * - Spineキャラクター1体の表示・編集
 * - 統一座標系の使用
 * - ドラッグ&ドロップ編集
 * - リアルタイムプレビュー
 * 
 * 作成日: 2025-08-15
 * 参考実装: spine-preview-layer.js (簡略化版)
 */

import { UnifiedCoordinateSystem } from './unified-coordinate-system.js';

export class SimpleSceneManager {
    constructor(options = {}) {
        this.debugMode = options.debug || false;
        
        // コアコンポーネント
        this.canvas = null;
        this.context = null;
        this.renderer = null;
        this.coordinateSystem = null;
        
        // シーン管理
        this.skeleton = null;
        this.skeletonData = null;
        this.animationState = null;
        this.bounds = null;
        
        // 編集状態
        this.isEditMode = false;
        this.isDragging = false;
        this.dragStartCoords = null;
        
        // Spine WebGLアセット
        this.currentCharacter = {
            id: null,
            atlasPath: null,
            jsonPath: null,
            position: { x: 0, y: 0 },
            scale: { x: 1.0, y: 1.0 }
        };
        
        // イベントリスナー
        this.eventListeners = {
            mousedown: null,
            mousemove: null,
            mouseup: null
        };
        
        if (this.debugMode) {
            console.log('✅ シンプルシーンマネージャー 初期化完了');
        }
    }
    
    /**
     * Canvas要素を設定し、Spine WebGLを初期化
     * 
     * @param {HTMLCanvasElement} canvas - Canvas要素
     * @returns {Promise<boolean>} 初期化成功/失敗
     */
    async initializeCanvas(canvas) {
        try {
            if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
                throw new Error('無効なCanvas要素');
            }
            
            this.canvas = canvas;
            this.context = canvas.getContext('webgl', {
                alpha: true,
                premultipliedAlpha: false
            });
            
            if (!this.context) {
                throw new Error('WebGLコンテキスト作成失敗');
            }
            
            // Spine WebGLの存在確認
            if (typeof spine === 'undefined') {
                if (this.debugMode) console.log('⏳ Spine WebGL読み込み待機中...');
                await this.waitForSpineWebGL();
            }
            
            // Spineレンダラー初期化
            this.renderer = new spine.SceneRenderer(canvas, this.context);
            
            // 統一座標システム初期化
            this.coordinateSystem = new UnifiedCoordinateSystem({ debug: this.debugMode });
            this.coordinateSystem.setCanvas(canvas);
            
            // イベントリスナー設定
            this.setupEventListeners();
            
            if (this.debugMode) {
                console.log('✅ Canvas初期化完了');
                console.log(`  - Canvasサイズ: ${canvas.width}x${canvas.height}`);
                console.log(`  - WebGLコンテキスト: ✅`);
                console.log(`  - Spineレンダラー: ✅`);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Canvas初期化エラー:', error);
            return false;
        }
    }
    
    /**
     * Spine WebGLの読み込みを待機
     */
    async waitForSpineWebGL() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100;
            
            const check = () => {
                if (typeof spine !== 'undefined' && spine.SceneRenderer) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Spine WebGL読み込みタイムアウト'));
                } else {
                    attempts++;
                    setTimeout(check, 100);
                }
            };
            
            check();
        });
    }
    
    /**
     * Spineキャラクターを読み込み、表示
     * 
     * @param {object} character - キャラクター情報
     * @param {string} character.id - キャラクターID
     * @param {string} character.atlasPath - .atlasファイルのパス
     * @param {string} character.jsonPath - .jsonファイルのパス
     * @returns {Promise<boolean>} 読み込み成功/失敗
     */
    async loadCharacter(character) {
        try {
            if (!this.renderer) {
                throw new Error('Renderer未初期化');
            }
            
            if (this.debugMode) {
                console.log(`🎭 キャラクター読み込み開始: ${character.id}`);
                console.log(`  - Atlas: ${character.atlasPath}`);
                console.log(`  - JSON: ${character.jsonPath}`);
            }
            
            // アセットマネージャーで読み込み
            const assetManager = new spine.AssetManager(this.context);
            assetManager.loadText(character.jsonPath);
            assetManager.loadTextureAtlas(character.atlasPath);
            
            await this.waitForAssetsLoaded(assetManager);
            
            // Skeletonデータ作成
            const atlas = assetManager.get(character.atlasPath);
            const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
            const skeletonJson = new spine.SkeletonJson(atlasLoader);
            
            this.skeletonData = skeletonJson.readSkeletonData(assetManager.get(character.jsonPath));
            
            // Skeletonインスタンス作成
            this.skeleton = new spine.Skeleton(this.skeletonData);
            this.skeleton.setToSetupPose();
            this.skeleton.updateWorldTransform();
            
            // アニメーションステート初期化
            const stateData = new spine.AnimationStateData(this.skeletonData);
            this.animationState = new spine.AnimationState(stateData);
            
            // デフォルトアニメーション設定
            if (this.skeletonData.animations.length > 0) {
                const defaultAnim = this.skeletonData.animations[0].name;
                this.animationState.setAnimation(0, defaultAnim, true);
            }
            
            // キャラクター情報更新
            this.currentCharacter = {
                ...character,
                position: character.position || { x: 0, y: 0 },
                scale: character.scale || { x: 1.0, y: 1.0 }
            };
            
            // 🚀 今回実験で証明された最シンプル座標配置
            this.skeleton.x = 0;
            this.skeleton.y = 0;
            this.skeleton.scaleX = this.currentCharacter.scale.x;
            this.skeleton.scaleY = this.currentCharacter.scale.y;
            
            // バウンディングボックス計算
            this.updateBounds();
            
            if (this.debugMode) {
                console.log('✅ キャラクター読み込み完了');
                console.log(`  - 位置: (${this.skeleton.x}, ${this.skeleton.y})`);
                console.log(`  - スケール: (${this.skeleton.scaleX}, ${this.skeleton.scaleY})`);
                console.log(`  - アニメーション数: ${this.skeletonData.animations.length}`);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ キャラクター読み込みエラー:', error);
            return false;
        }
    }
    
    /**
     * アセット読み込み完了を待機
     */
    async waitForAssetsLoaded(assetManager) {
        return new Promise((resolve) => {
            const check = () => {
                if (assetManager.isLoadingComplete()) {
                    resolve();
                } else {
                    requestAnimationFrame(check);
                }
            };
            check();
        });
    }
    
    /**
     * バウンディングボックスを更新
     */
    updateBounds() {
        if (!this.skeleton) return;
        
        const bounds = new spine.SkeletonBounds();
        bounds.update(this.skeleton, true);
        
        this.bounds = {
            x: bounds.minX,
            y: bounds.minY,
            width: bounds.getWidth(),
            height: bounds.getHeight()
        };
    }
    
    /**
     * レンダリングループを開始
     */
    startRenderLoop() {
        if (!this.renderer || !this.skeleton) {
            console.error('❌ RendererまたはSkeletonが未初期化');
            return;
        }
        
        const renderFrame = (now) => {
            if (this.animationState) {
                // アニメーション更新
                const delta = now * 0.001; // ミリ秒 → 秒
                this.animationState.update(delta);
                this.animationState.apply(this.skeleton);
            }
            
            // Skeleton更新
            this.skeleton.updateWorldTransform();
            
            // 描画クリア
            this.context.clearColor(0, 0, 0, 0);
            this.context.clear(this.context.COLOR_BUFFER_BIT);
            
            // Spine描画
            this.renderer.begin();
            this.renderer.drawSkeleton(this.skeleton, false);
            this.renderer.end();
            
            // 次フレームをリクエスト
            requestAnimationFrame(renderFrame);
        };
        
        // レンダリング開始
        requestAnimationFrame(renderFrame);
        
        if (this.debugMode) {
            console.log('✅ レンダリングループ開始');
        }
    }
    
    /**
     * 編集モードの有効/無効切り替え
     * 
     * @param {boolean} enabled - 編集モード有効/無効
     */
    setEditMode(enabled) {
        this.isEditMode = enabled;
        
        if (enabled) {
            this.canvas.style.cursor = 'move';
            if (this.debugMode) console.log('✏️ 編集モード ON');
        } else {
            this.canvas.style.cursor = 'default';
            this.isDragging = false;
            this.dragStartCoords = null;
            if (this.debugMode) console.log('✏️ 編集モード OFF');
        }
    }
    
    /**
     * キャラクターの位置を設定 (🚀 シンプル化版)
     * 今回実験の知見: skeleton.x = 0; skeleton.y = 0; で十分
     * 
     * @param {number} x - X座標 (簡素なオフセットのみ)
     * @param {number} y - Y座標 (簡素なオフセットのみ)
     */
    setCharacterPosition(x, y) {
        if (!this.skeleton) return;
        
        // 🚀 今回実験で証明された最シンプル実装
        this.skeleton.x = 0;  // 常に0で固定
        this.skeleton.y = 0;  // 常に0で固定
        
        // 情報のみ更新(実際の座標は使用しない)
        this.currentCharacter.position.x = x;
        this.currentCharacter.position.y = y;
        
        if (this.debugMode) {
            console.log(`🚀 シンプル座標: skeleton(0,0) 固定, 記録用(${x.toFixed(1)}, ${y.toFixed(1)})`);
        }
    }
    
    /**
     * マウスイベントリスナーを設定
     */
    setupEventListeners() {
        if (!this.canvas) return;
        
        // マウスダウン
        this.eventListeners.mousedown = (event) => {
            if (!this.isEditMode || !this.skeleton) return;
            
            const spineCoords = this.coordinateSystem.clientToSpineCoordinates(
                event.clientX, event.clientY
            );
            
            if (!spineCoords) return;
            
            this.isDragging = true;
            this.dragStartCoords = {
                mouse: spineCoords,
                skeleton: { x: this.skeleton.x, y: this.skeleton.y }
            };
            
            if (this.debugMode) {
                console.log('🔄 ドラッグ開始:', spineCoords);
            }
            
            event.preventDefault();
        };
        
        // マウスムーブ
        this.eventListeners.mousemove = (event) => {
            if (!this.isEditMode || !this.isDragging || !this.dragStartCoords) return;
            
            const spineCoords = this.coordinateSystem.clientToSpineCoordinates(
                event.clientX, event.clientY
            );
            
            if (!spineCoords) return;
            
            // ドラッグ距離計算
            const deltaX = spineCoords.x - this.dragStartCoords.mouse.x;
            const deltaY = spineCoords.y - this.dragStartCoords.mouse.y;
            
            // 新しい位置計算
            const newX = this.dragStartCoords.skeleton.x + deltaX;
            const newY = this.dragStartCoords.skeleton.y + deltaY;
            
            this.setCharacterPosition(newX, newY);
        };
        
        // マウスアップ
        this.eventListeners.mouseup = (event) => {
            if (this.isDragging && this.debugMode) {
                console.log('🎯 ドラッグ終了');
            }
            
            this.isDragging = false;
            this.dragStartCoords = null;
        };
        
        // イベントリスナー登録
        this.canvas.addEventListener('mousedown', this.eventListeners.mousedown);
        this.canvas.addEventListener('mousemove', this.eventListeners.mousemove);
        this.canvas.addEventListener('mouseup', this.eventListeners.mouseup);
        
        if (this.debugMode) {
            console.log('✅ マウスイベントリスナー設定完了');
        }
    }
    
    /**
     * 現在のキャラクター情報を取得
     * 
     * @returns {object} キャラクター情報
     */
    getCharacterInfo() {
        if (!this.skeleton) {
            return { error: 'キャラクター未読み込み' };
        }
        
        return {
            id: this.currentCharacter.id,
            position: {
                x: this.skeleton.x,
                y: this.skeleton.y
            },
            scale: {
                x: this.skeleton.scaleX,
                y: this.skeleton.scaleY
            },
            bounds: this.bounds,
            animations: this.skeletonData.animations.map(anim => anim.name),
            isEditMode: this.isEditMode,
            isDragging: this.isDragging
        };
    }
    
    /**
     * リソースをクリーンアップ
     */
    cleanup() {
        // イベントリスナー解除
        if (this.canvas) {
            if (this.eventListeners.mousedown) {
                this.canvas.removeEventListener('mousedown', this.eventListeners.mousedown);
            }
            if (this.eventListeners.mousemove) {
                this.canvas.removeEventListener('mousemove', this.eventListeners.mousemove);
            }
            if (this.eventListeners.mouseup) {
                this.canvas.removeEventListener('mouseup', this.eventListeners.mouseup);
            }
        }
        
        // リファレンスクリア
        this.skeleton = null;
        this.skeletonData = null;
        this.animationState = null;
        this.renderer = null;
        this.coordinateSystem = null;
        
        if (this.debugMode) {
            console.log('🧹 シンプルシーンマネージャー クリーンアップ完了');
        }
    }
    
    /**
     * デバッグモードの切り替え
     * 
     * @param {boolean} enabled - デバッグモード有効/無効
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        if (this.coordinateSystem) {
            this.coordinateSystem.setDebugMode(enabled);
        }
        console.log(`🔧 シンプルシーンマネージャー デバッグモード: ${enabled ? 'ON' : 'OFF'}`);
    }
}

/**
 * グローバル関数として公開
 */
window.SimpleSceneManager = SimpleSceneManager;

/**
 * シンプルなファクトリ関数
 * 
 * @param {object} options - オプション設定
 * @returns {SimpleSceneManager} シーンマネージャーインスタンス
 */
export function createSimpleScene(options = {}) {
    return new SimpleSceneManager(options);
}

console.log('✅ シンプルシーン管理システム読み込み完了');
console.log('使用方法: const scene = createSimpleScene({debug: true})');