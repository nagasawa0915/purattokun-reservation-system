// Spine WebGL テストスクリプト
class SpineTestApp {
    constructor() {
        this.canvas = null;
        this.gl = null;
        this.shader = null;
        this.batcher = null;
        this.renderer = null;
        this.assetManager = null;
        this.skeleton = null;
        this.animationState = null;
        this.animationStateData = null;
        
        this.lastFrameTime = Date.now() / 1000;
        this.isAnimating = false;
        
        // アセットのパス（既存のデスクトップアプリのアセット参照）
        this.basePath = '../spine-editor-desktop-v2/src/renderer/assets/spine/characters/purattokun/';
        
        this.log('✅ SpineTestApp 初期化完了');
    }
    
    // ログ出力関数
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logElement = document.getElementById('log-output');
        
        let prefix = '📝';
        if (type === 'error') prefix = '❌';
        else if (type === 'success') prefix = '✅';
        else if (type === 'warning') prefix = '⚠️';
        
        const logMessage = `[${timestamp}] ${prefix} ${message}\n`;
        logElement.textContent += logMessage;
        logElement.scrollTop = logElement.scrollHeight;
        
        // コンソールにも出力
        console.log(`[SpineTest] ${message}`);
    }
    
    // ステータス更新
    updateStatus(elementId, message, success = null) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.className = 'status-item ';
            if (success === true) {
                element.className += 'status-success';
            } else if (success === false) {
                element.className += 'status-error';
            } else {
                element.className += 'status-pending';
            }
        }
    }
    
    // 初期化
    async initialize() {
        try {
            this.log('Spine WebGL ライブラリの確認中...');
            
            // Spine WebGL のロード確認
            if (typeof spine === 'undefined') {
                throw new Error('Spine WebGL ライブラリが読み込まれていません');
            }
            
            this.log('Spine WebGL ライブラリを確認しました: ' + spine.webgl.WebGLRenderer.name);
            this.updateStatus('status-spine', '✅ Spine WebGLライブラリ: 読み込み成功', true);
            
            // CanvasとWebGLコンテキストの取得
            this.canvas = document.getElementById('spine-canvas');
            this.gl = this.canvas.getContext('webgl', { alpha: false });
            
            if (!this.gl) {
                throw new Error('WebGLコンテキストの取得に失敗しました');
            }
            
            this.log('WebGLコンテキストを取得しました');
            
            // Spine WebGL コンポーネントの初期化
            this.shader = spine.webgl.Shader.newTwoColoredTextured(this.gl);
            this.batcher = new spine.webgl.PolygonBatcher(this.gl);
            this.renderer = new spine.webgl.SceneRenderer(this.canvas, this.gl, true);
            this.assetManager = new spine.webgl.AssetManager(this.gl);
            
            this.log('Spine WebGLコンポーネントの初期化完了');
            
            // アセット読み込みボタンを有効化
            document.getElementById('btn-load').disabled = false;
            
            this.log('初期化完了 - アセット読み込みボタンが有効になりました', 'success');
            
        } catch (error) {
            this.log(`初期化エラー: ${error.message}`, 'error');
            this.updateStatus('status-spine', '❌ Spine WebGLライブラリ: エラー', false);
            throw error;
        }
    }
    
    // アセット読み込み
    async loadAssets() {
        try {
            this.log('アセット読み込み開始...');
            this.updateStatus('status-assets', '🔄 Spineアセット: 読み込み中...');
            
            // アセットの登録
            this.assetManager.loadTexture(this.basePath + 'purattokun.png');
            this.assetManager.loadTextureAtlas(this.basePath + 'purattokun.atlas');
            this.assetManager.loadBinary(this.basePath + 'purattokun.json');
            
            this.log('アセットをAssetManagerに登録しました');
            
            // アセットの読み込み完了を待機
            return new Promise((resolve, reject) => {
                const checkLoading = () => {
                    if (this.assetManager.isLoadingComplete()) {
                        this.log('アセット読み込み完了', 'success');
                        this.updateStatus('status-assets', '✅ Spineアセット: 読み込み成功', true);
                        
                        // アニメーションボタンを有効化
                        document.getElementById('btn-play-taiki').disabled = false;
                        document.getElementById('btn-play-syutugen').disabled = false;
                        
                        resolve();
                    } else {
                        // 読み込みエラーのチェック
                        const errors = this.assetManager.getErrors();
                        if (errors.length > 0) {
                            this.log('アセット読み込みエラー:', 'error');
                            errors.forEach(error => this.log(`  - ${error}`, 'error'));
                            this.updateStatus('status-assets', '❌ Spineアセット: 読み込みエラー', false);
                            reject(new Error('アセット読み込みエラー: ' + errors.join(', ')));
                            return;
                        }
                        
                        // 100ms後に再チェック
                        setTimeout(checkLoading, 100);
                    }
                };
                
                checkLoading();
            });
            
        } catch (error) {
            this.log(`アセット読み込みエラー: ${error.message}`, 'error');
            this.updateStatus('status-assets', '❌ Spineアセット: エラー', false);
            throw error;
        }
    }
    
    // Spineキャラクターの作成
    createSpineCharacter() {
        try {
            this.log('Spineキャラクター作成中...');
            
            // AtlasとSkeletonデータの取得
            const atlas = this.assetManager.get(this.basePath + 'purattokun.atlas');
            const skeletonJson = this.assetManager.get(this.basePath + 'purattokun.json');
            
            this.log('AtlasとSkeletonデータを取得しました');
            
            // SkeletonJsonのパース
            const jsonParser = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(atlas));
            const skeletonData = jsonParser.readSkeletonData(skeletonJson);
            
            this.log('Skeletonデータをパースしました');
            
            // SkeletonとAnimationStateの作成
            this.skeleton = new spine.Skeleton(skeletonData);
            this.animationStateData = new spine.AnimationStateData(skeletonData);
            this.animationState = new spine.AnimationState(this.animationStateData);
            
            // 初期位置とサイズを設定
            this.skeleton.setToSetupPose();
            this.skeleton.x = this.canvas.width / 2;
            this.skeleton.y = this.canvas.height - 50;
            this.skeleton.scaleX = 0.5;
            this.skeleton.scaleY = 0.5;
            
            this.skeleton.updateWorldTransform();
            
            this.log('Spineキャラクター作成完了', 'success');
            
            // 利用可能なアニメーションをログ出力
            const animations = skeletonData.animations;
            this.log(`利用可能なアニメーション (${animations.length}個):`);
            animations.forEach(anim => {
                this.log(`  - ${anim.name} (${anim.duration.toFixed(2)}秒)`);
            });
            
            return true;
            
        } catch (error) {
            this.log(`Spineキャラクター作成エラー: ${error.message}`, 'error');
            this.log(`スタックトレース: ${error.stack}`, 'error');
            return false;
        }
    }
    
    // アニメーション再生
    playAnimation(animationName) {
        try {
            if (!this.skeleton || !this.animationState) {
                throw new Error('SkeletonまたはAnimationStateが初期化されていません');
            }
            
            this.log(`アニメーション "${animationName}" を再生中...`);
            
            // アニメーションの設定
            const loop = animationName === 'taiki'; // taikiはループ、その他は1回再生
            this.animationState.setAnimation(0, animationName, loop);
            
            this.log(`アニメーション "${animationName}" を設定しました (ループ: ${loop})`, 'success');
            this.updateStatus('status-animation', `▶️ アニメーション: ${animationName} 再生中`, true);
            
            // アニメーションループを開始
            if (!this.isAnimating) {
                this.isAnimating = true;
                this.startAnimationLoop();
            }
            
        } catch (error) {
            this.log(`アニメーション再生エラー: ${error.message}`, 'error');
            this.updateStatus('status-animation', '❌ アニメーション: エラー', false);
        }
    }
    
    // アニメーションループを開始
    startAnimationLoop() {
        const animate = () => {
            if (!this.isAnimating) return;
            
            try {
                const now = Date.now() / 1000;
                const delta = now - this.lastFrameTime;
                this.lastFrameTime = now;
                
                // アニメーション状態を更新
                this.animationState.update(delta);
                this.animationState.apply(this.skeleton);
                this.skeleton.updateWorldTransform();
                
                // 描画
                this.render();
                
                requestAnimationFrame(animate);
                
            } catch (error) {
                this.log(`アニメーションループエラー: ${error.message}`, 'error');
                this.isAnimating = false;
            }
        };
        
        animate();
    }
    
    // 描画
    render() {
        try {
            // キャンバスをクリア
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            
            // レンダラーの設定
            this.renderer.camera.setViewport(this.canvas.width, this.canvas.height);
            this.renderer.camera.position.x = this.canvas.width / 2;
            this.renderer.camera.position.y = this.canvas.height / 2;
            this.renderer.camera.viewportWidth = this.canvas.width;
            this.renderer.camera.viewportHeight = this.canvas.height;
            
            // Skeletonの描画
            this.renderer.begin();
            this.renderer.drawSkeleton(this.skeleton, true);
            this.renderer.end();
            
        } catch (error) {
            this.log(`描画エラー: ${error.message}`, 'error');
        }
    }
}

// グローバルインスタンス
let spineApp = null;

// ブラウザイベントリスナー
window.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 DOMロード完了 - SpineTestAppを初期化中...');
        
        spineApp = new SpineTestApp();
        await spineApp.initialize();
        
    } catch (error) {
        console.error('初期化エラー:', error);
    }
});

// グローバル関数 - HTMLから呼び出される
async function loadSpineCharacter() {
    try {
        if (!spineApp) {
            throw new Error('SpineTestAppが初期化されていません');
        }
        
        // アセット読み込み
        await spineApp.loadAssets();
        
        // Spineキャラクター作成
        const success = spineApp.createSpineCharacter();
        
        if (success) {
            spineApp.log('キャラクター読み込み完了 - アニメーションボタンが有効になりました', 'success');
        }
        
    } catch (error) {
        console.error('キャラクター読み込みエラー:', error);
        if (spineApp) {
            spineApp.log(`キャラクター読み込みエメエラー: ${error.message}`, 'error');
        }
    }
}

function playAnimation(animationName) {
    if (spineApp) {
        spineApp.playAnimation(animationName);
    }
}

function clearLog() {
    const logOutput = document.getElementById('log-output');
    if (logOutput) {
        logOutput.textContent = '';
    }
}

// エラーハンドリング
window.addEventListener('error', (event) => {
    console.error('グローバルエラー:', event.error);
    if (spineApp) {
        spineApp.log(`グローバルエラー: ${event.error.message}`, 'error');
    }
});
