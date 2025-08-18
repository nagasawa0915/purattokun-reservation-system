/**
 * 🚀 Phase 1: 最小構成Spineシステム - デスクトップアプリ版
 * 
 * 完璧実装ガイド準拠の最小構成実装
 * - skeleton.x = 0, skeleton.y = 0 (シンプル化革命)
 * - 2層座標制御システム
 * - 段階的実装・テスト
 */

class SimpleSpineManager {
    constructor() {
        this.characters = new Map();
        this.isSpineReady = false;
        this.spineStage = null;
        
        console.log('🚀 SimpleSpineManager 初期化開始');
        this.initialize();
    }
    
    /**
     * Phase 1.1: 基本初期化
     */
    async initialize() {
        console.log('🔍 Phase 1.1: Spine WebGL 利用可能性確認');
        
        // Spine WebGL 利用可能性確認
        if (typeof spine === 'undefined') {
            console.error('❌ Spine WebGL ライブラリが読み込まれていません');
            return;
        }
        
        console.log('✅ Spine WebGL 利用可能:', {
            version: spine.VERSION || 'unknown',
            AssetManager: !!spine.AssetManager,
            SkeletonRenderer: !!spine.SkeletonRenderer,
            AnimationStateData: !!spine.AnimationStateData
        });
        
        // Spine Stage要素確認
        this.spineStage = document.getElementById('spine-stage');
        if (!this.spineStage) {
            console.error('❌ spine-stage 要素が見つかりません');
            return;
        }
        
        console.log('✅ spine-stage 要素確認完了');
        this.isSpineReady = true;
        
        // グローバル参照設定（デバッグパネル用）
        window.simpleSpineManager = this;
        
        console.log('🎯 SimpleSpineManager 初期化完了');
    }
    
    /**
     * Phase 1.2: Spineテスト実行
     */
    testSpineLoad() {
        console.log('🔍 Phase 1.2: Spine読み込みテスト実行');
        
        if (!this.isSpineReady) {
            console.error('❌ Spine システムが初期化されていません');
            return;
        }
        
        try {
            // AssetManager テスト
            const assetManager = new spine.AssetManager();
            console.log('✅ AssetManager 作成成功:', assetManager);
            
            // WebGLコンテキスト テスト
            const testCanvas = document.createElement('canvas');
            testCanvas.width = 200;
            testCanvas.height = 200;
            
            const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
            if (!gl) {
                console.error('❌ WebGLコンテキスト取得失敗');
                return;
            }
            
            console.log('✅ WebGLコンテキスト取得成功');
            
            // SkeletonRenderer テスト
            const renderer = new spine.SkeletonRenderer(gl);
            console.log('✅ SkeletonRenderer 作成成功:', renderer);
            
            console.log('🎯 Spine読み込みテスト完了 - 全て正常');
            
        } catch (error) {
            console.error('❌ Spine読み込みテストエラー:', error);
        }
    }
    
    /**
     * Phase 1.3: シンプルなキャラクター作成（完璧実装ガイド準拠）
     */
    async createCharacter(characterName) {
        console.log(`🎭 Phase 1.3: ${characterName} キャラクター作成開始`);
        
        if (!this.isSpineReady) {
            console.error('❌ Spine システムが初期化されていません');
            return null;
        }
        
        // 既存キャラクターチェック
        if (this.characters.has(characterName)) {
            console.log(`⚠️ ${characterName} は既に存在します`);
            return this.characters.get(characterName);
        }
        
        try {
            // Phase 1.3.1: Canvas要素作成
            const canvas = this.createCanvas(characterName);
            
            // Phase 1.3.2: AssetManager作成
            const assetManager = new spine.AssetManager();
            
            // Phase 1.3.3: WebGLコンテキスト取得
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                throw new Error('WebGLコンテキスト取得失敗');
            }
            
            // Phase 1.3.4: SkeletonRenderer作成
            const renderer = new spine.SkeletonRenderer(gl);
            
            const character = {
                name: characterName,
                canvas: canvas,
                gl: gl,
                assetManager: assetManager,
                renderer: renderer,
                skeleton: null,
                animationState: null
            };
            
            // Phase 1.3.5: アセット読み込み開始
            await this.loadCharacterAssets(character);
            
            this.characters.set(characterName, character);
            console.log(`✅ ${characterName} キャラクター作成完了`);
            
            return character;
            
        } catch (error) {
            console.error(`❌ ${characterName} キャラクター作成エラー:`, error);
            return null;
        }
    }
    
    /**
     * Canvas要素作成（2層座標制御システム Layer 1）
     */
    createCanvas(characterName) {
        console.log(`📐 ${characterName} Canvas要素作成`);
        
        const canvas = document.createElement('canvas');
        canvas.id = `${characterName}-canvas`;
        canvas.className = 'spine-character-canvas';
        
        // 完璧実装ガイド準拠: 内部解像度設定
        canvas.width = 200;   // 内部解像度（固定推奨）
        canvas.height = 200;
        
        // CSS スタイル設定（Layer 1: CSS位置制御）
        canvas.style.cssText = `
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 120px;
            height: 120px;
            z-index: 10;
            border: 2px solid #4CAF50;
            border-radius: 4px;
        `;
        
        // spine-stage に追加
        this.spineStage.appendChild(canvas);
        
        console.log(`✅ ${characterName} Canvas要素作成完了`);
        return canvas;
    }
    
    /**
     * キャラクターアセット読み込み
     */
    async loadCharacterAssets(character) {
        console.log(`📦 ${character.name} アセット読み込み開始`);
        
        // Phase 1実装: ダミーデータでのテスト
        // 実際のアセット読み込みは Phase 2で実装
        
        try {
            // ダミーのSkeleton作成（テスト用）
            const dummySkeleton = this.createDummySkeleton(character);
            character.skeleton = dummySkeleton;
            
            // アニメーションループ開始
            this.startRenderLoop(character);
            
            console.log(`✅ ${character.name} アセット読み込み完了（ダミー）`);
            
        } catch (error) {
            console.error(`❌ ${character.name} アセット読み込みエラー:`, error);
            throw error;
        }
    }
    
    /**
     * ダミーSkeleton作成（Phase 1テスト用）
     */
    createDummySkeleton(character) {
        console.log(`🎭 ${character.name} ダミーSkeleton作成`);
        
        // Phase 1: 完璧実装ガイド準拠のシンプル座標設定
        const dummySkeleton = {
            x: 0,        // 基本は0,0ベース（重要）
            y: 0,        // 基本は0,0ベース（重要）
            scaleX: 1.0, // 基本スケール
            scaleY: 1.0,
            name: character.name
        };
        
        console.log(`✅ ${character.name} ダミーSkeleton作成完了:`, dummySkeleton);
        return dummySkeleton;
    }
    
    /**
     * レンダリングループ開始
     */
    startRenderLoop(character) {
        console.log(`🔄 ${character.name} レンダリングループ開始`);
        
        const render = () => {
            if (!character.canvas || !character.gl) return;
            
            const gl = character.gl;
            
            // 画面クリア
            gl.clearColor(0.0, 0.0, 0.0, 0.0); // 透明背景
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            // Phase 1: ダミー描画（緑色の四角形）
            this.renderDummyCharacter(character);
            
            // 次フレーム
            requestAnimationFrame(render);
        };
        
        render();
        console.log(`✅ ${character.name} レンダリングループ開始完了`);
    }
    
    /**
     * ダミーキャラクター描画（Phase 1テスト用）
     */
    renderDummyCharacter(character) {
        const gl = character.gl;
        
        // シンプルな緑色四角形を描画
        gl.clearColor(0.2, 0.8, 0.2, 1.0); // 緑色
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // キャラクター名を Canvas 上に描画（デバッグ用）
        const ctx = character.canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(character.name, character.canvas.width / 2, character.canvas.height / 2);
        }
    }
    
    /**
     * 全キャラクター削除
     */
    clearAll() {
        console.log('🗑️ 全キャラクター削除開始');
        
        for (const [name, character] of this.characters) {
            if (character.canvas && character.canvas.parentNode) {
                character.canvas.parentNode.removeChild(character.canvas);
            }
            console.log(`✅ ${name} 削除完了`);
        }
        
        this.characters.clear();
        console.log('🎯 全キャラクター削除完了');
    }
}

// DOMContentLoaded 後に初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOMContentLoaded: SimpleSpineManager 初期化開始');
    
    // Spine WebGL ライブラリの読み込み待機
    if (typeof spine !== 'undefined') {
        new SimpleSpineManager();
    } else {
        // Spine WebGL ライブラリ読み込み待機
        console.log('⏳ Spine WebGL ライブラリ読み込み待機中...');
        
        const checkSpine = () => {
            if (typeof spine !== 'undefined') {
                console.log('✅ Spine WebGL ライブラリ読み込み完了');
                new SimpleSpineManager();
            } else {
                setTimeout(checkSpine, 100);
            }
        };
        
        setTimeout(checkSpine, 100);
    }
});