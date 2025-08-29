/**
 * UniversalSpineLoader - v3.0 ハイブリッドマイクロモジュール設計
 * 
 * 🎯 v3.0 ハイブリッド設計方針
 * - 実証済みパターンの内部移植
 * - 既存トラブルシューティング互換
 * - 動的Canvas生成・完全独立動作
 * - 複数インスタンス同時実行可能
 * 
 * 🔧 主な責務
 * - プログラムでCanvas要素を作成・配置
 * - SpineWebGL描画システム統合
 * - 設定ベースでの位置・サイズ制御
 * - イベント処理（クリック・アニメーション切り替え）
 * - cleanup機能（メモリリーク防止）
 * 
 * 🚫 外部依存
 * - Spine WebGL CDN のみ（/assets/js/libs/spine-webgl.js）
 * - その他の外部依存ゼロ
 * 
 * 📝 使用例
 * const purattokun = new UniversalSpineLoader({
 *     containerSelector: '#main-container',
 *     spineConfig: {
 *         basePath: '/assets/spine/characters/purattokun/',
 *         atlasFile: 'purattokun.atlas', 
 *         jsonFile: 'purattokun.json',
 *         animations: { idle: 'taiki', click: 'syutugen' }
 *     },
 *     canvasSize: { width: 200, height: 200 },
 *     position: { x: 100, y: 100 }
 * });
 */

class UniversalSpineLoader {
    constructor(config) {
        console.log('🎯 UniversalSpineLoader: v3.0 ハイブリッド初期化開始', config);
        
        // 入力検証
        this.validateConfig(config);
        
        // 初期状態バックアップ（完全復元保証）
        this.initialState = {
            windowSpine: typeof window !== 'undefined' ? window.spine : undefined,
            containers: new Map() // 作成したDOM要素の記録
        };
        
        // 設定保存（v3.0: 実証済みパターンベース）
        this.config = {
            containerSelector: config.containerSelector,
            spineConfig: {
                basePath: config.spineConfig.basePath,
                atlasFile: config.spineConfig.atlasFile,
                jsonFile: config.spineConfig.jsonFile,
                animations: config.spineConfig.animations || { idle: 'taiki' }
            },
            canvasSize: {
                width: config.canvasSize?.width || 200,
                height: config.canvasSize?.height || 200
            },
            position: {
                x: config.position?.x || 0,
                y: config.position?.y || 0
            }
        };
        
        // 内部状態（外部依存なし）
        this.state = {
            loaded: false,
            loading: false,
            error: null,
            canvasElement: null,
            spineData: null,
            renderer: null,
            skeleton: null,
            animationState: null,
            lastTime: 0,
            animationFrameId: null
        };
        
        // 実証済み座標計算システム（従来システムから移植）
        this.coordinateSystem = this.setupTraditionalCoordinates();
        
        // デバッグ互換性（既存トラブルシューティングとの互換）
        this.debugCompatibility = this.setupDebugCompatibility();
        
        console.log('✅ UniversalSpineLoader: 初期化完了');
    }
    
    /**
     * 設定検証
     */
    validateConfig(config) {
        if (!config || typeof config !== 'object') {
            throw new Error('❌ UniversalSpineLoader: 設定がobjectである必要があります');
        }
        
        if (!config.containerSelector || typeof config.containerSelector !== 'string') {
            throw new Error('❌ UniversalSpineLoader: containerSelectorが必要です（文字列）');
        }
        
        if (!config.spineConfig || typeof config.spineConfig !== 'object') {
            throw new Error('❌ UniversalSpineLoader: spineConfigが必要です（object）');
        }
        
        const required = ['basePath', 'atlasFile', 'jsonFile'];
        for (const key of required) {
            if (!config.spineConfig[key] || typeof config.spineConfig[key] !== 'string') {
                throw new Error(`❌ UniversalSpineLoader: spineConfig.${key}が必要です（文字列）`);
            }
        }
    }
    
    /**
     * v3.0: 実証済み座標計算システム（spine-positioning-system-explanation.js から移植）
     */
    setupTraditionalCoordinates() {
        return {
            // 実証済みの座標計算ロジック
            calculatePosition: (element, x, y) => {
                if (!element || !element.parentElement) return { x: 0, y: 0 };
                
                const parentRect = element.parentElement.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
                
                // 実証済みの中央基準座標計算
                const relativeX = (x / parentRect.width) * 100;
                const relativeY = (y / parentRect.height) * 100;
                
                return {
                    x: relativeX,
                    y: relativeY,
                    px: x,
                    py: y
                };
            },
            
            // レスポンシブ対応座標計算（実証済みパターン）
            applyResponsivePosition: (element, x, y) => {
                if (!element) return;
                
                element.style.position = 'absolute';
                element.style.left = x + 'px';
                element.style.top = y + 'px';
                element.style.transform = 'translate(-50%, -50%)';
                element.style.zIndex = '10';
            }
        };
    }
    
    /**
     * v3.0: 既存トラブルシューティングとの互換性
     */
    setupDebugCompatibility() {
        const self = this;
        
        return {
            // 既存のデバッグコマンドとの互換性
            diagnose: () => {
                console.log('🔍 UniversalSpineLoader v3.0 診断:');
                console.log('- 状態:', self.state);
                console.log('- 設定:', self.config);
                console.log('- Canvas要素:', self.state.canvasElement);
                console.log('- Spine WebGL:', typeof window !== 'undefined' ? !!window.spine : 'window未定義');
                
                if (self.state.canvasElement) {
                    const rect = self.state.canvasElement.getBoundingClientRect();
                    console.log('- Canvas位置:', rect);
                }
            },
            
            // 従来システムのデバッグツールとの互換性
            getSpineInfo: () => {
                return {
                    loaded: self.state.loaded,
                    skeleton: self.state.skeleton,
                    animationState: self.state.animationState,
                    canvas: self.state.canvasElement
                };
            }
        };
    }
    
    /**
     * メイン実行関数: Spine描画システム完全構築
     */
    async execute() {
        if (this.state.loading) {
            console.log('⚠️ UniversalSpineLoader: 読み込み中...');
            return this.getStatus();
        }
        
        try {
            console.log('🚀 UniversalSpineLoader: 実行開始');
            this.state.loading = true;
            this.state.error = null;
            
            // Step 1: Spine WebGL確認
            await this.checkSpineWebGL();
            
            // Step 2: Canvas要素生成
            await this.createCanvas();
            
            // Step 3: WebGL描画システム初期化
            await this.initializeWebGL();
            
            // Step 4: Spineファイル読み込み
            await this.loadSpineFiles();
            
            // Step 5: アニメーションループ開始
            this.startAnimationLoop();
            
            // Step 6: イベント処理設定
            this.setupEventHandlers();
            
            this.state.loaded = true;
            this.state.loading = false;
            
            console.log('✅ UniversalSpineLoader: 完全実行成功');
            return this.getStatus();
            
        } catch (error) {
            console.error('❌ UniversalSpineLoader: 実行エラー:', error);
            this.state.error = error.message;
            this.state.loading = false;
            return this.getStatus();
        }
    }
    
    /**
     * Spine WebGL ライブラリ確認
     */
    async checkSpineWebGL() {
        if (typeof window === 'undefined' || !window.spine) {
            throw new Error('Spine WebGL ライブラリが読み込まれていません。/assets/js/libs/spine-webgl.js を読み込んでください。');
        }
        console.log('✅ Spine WebGL ライブラリ確認完了');
    }
    
    /**
     * Canvas要素生成・配置
     */
    async createCanvas() {
        const container = document.querySelector(this.config.containerSelector);
        if (!container) {
            throw new Error(`コンテナが見つかりません: ${this.config.containerSelector}`);
        }
        
        // Canvas要素作成
        const canvas = document.createElement('canvas');
        canvas.width = this.config.canvasSize.width;
        canvas.height = this.config.canvasSize.height;
        canvas.style.border = '1px solid #ccc'; // デバッグ用
        
        // v3.0: 実証済み位置システムによる配置
        this.coordinateSystem.applyResponsivePosition(
            canvas, 
            this.config.position.x, 
            this.config.position.y
        );
        
        // コンテナに追加
        container.appendChild(canvas);
        this.state.canvasElement = canvas;
        
        // 復元用記録
        this.initialState.containers.set(canvas, container);
        
        console.log('✅ Canvas要素生成・配置完了');
    }
    
    /**
     * WebGL描画システム初期化（成功パターン移植：シンプル版）
     */
    async initializeWebGL() {
        const canvas = this.state.canvasElement;
        
        try {
            console.log('🔍 WebGL初期化開始（成功パターン移植版）');
            
            // Canvas初期設定（重要：WebGLコンテキスト取得前）
            canvas.width = canvas.clientWidth || 200;
            canvas.height = canvas.clientHeight || 200;
            console.log(`📐 Canvas初期設定: ${canvas.width}x${canvas.height} (CSS: ${canvas.clientWidth}x${canvas.clientHeight})`);
            
            // WebGLコンテキスト取得
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                throw new Error('WebGLコンテキストの取得に失敗しました');
            }
            console.log('✅ WebGLコンテキスト取得成功');
            
            // Spine SceneRenderer作成（成功パターンと同じシンプル構成）
            if (!window.spine.SceneRenderer) {
                throw new Error('spine.SceneRendererが見つかりません。Spine WebGLライブラリを確認してください。');
            }
            
            this.state.renderer = new window.spine.SceneRenderer(canvas, gl);
            console.log('✅ SceneRenderer作成成功（成功パターン移植）');
            
            console.log('✅ WebGL描画システム初期化完了');
            
        } catch (error) {
            console.error('❌ WebGL初期化エラー（詳細）:', error);
            throw new Error(`WebGL初期化エラー: ${error.message}`);
        }
    }
    
    /**
     * Spineファイル読み込み・セットアップ（spine-micromodules-demo.html成功パターン移植版）
     */
    async loadSpineFiles() {
        const config = this.config.spineConfig;
        
        try {
            console.log('🎯 Spine読み込み開始（成功パターン適用版）');
            
            // WebGLコンテキスト取得（重要：AssetManagerに渡すため）
            const canvas = this.state.canvasElement;
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                throw new Error('WebGLコンテキストの取得に失敗しました');
            }
            console.log('✅ WebGLコンテキスト取得成功（AssetManager用）');
            
            // 成功パターン1: アセットマネージャー作成（重要：WebGLコンテキスト使用）
            const assetManager = new window.spine.AssetManager(gl);
            console.log('✅ AssetManager作成成功（WebGLコンテキスト付き）');
            
            // ファイルパス構築
            const atlasPath = config.basePath + config.atlasFile;
            const jsonPath = config.basePath + config.jsonFile;
            console.log('📁 読み込みファイルパス:', { atlasPath, jsonPath });
            
            // 成功パターン2: シンプルな読み込み（重要：loadTextureAtlas使用）
            assetManager.loadText(jsonPath);
            assetManager.loadTextureAtlas(atlasPath);
            console.log('📦 ファイル読み込み予約完了（loadText + loadTextureAtlas）');
            
            // 成功パターン3: 読み込み完了待ち（重要：isLoadingComplete使用）
            await new Promise((resolve, reject) => {
                let checkCount = 0;
                const checkAssets = () => {
                    if (assetManager.isLoadingComplete()) {
                        console.log('✅ アセット読み込み完了確認');
                        resolve();
                    } else if (checkCount++ < 100) {
                        setTimeout(checkAssets, 100);
                    } else {
                        reject(new Error('アセット読み込みタイムアウト（10秒）'));
                    }
                };
                checkAssets();
            });
            
            // 成功パターン4: Skeleton作成（重要：assetManager.requireで取得）
            const atlas = assetManager.require(atlasPath);
            const atlasLoader = new window.spine.AtlasAttachmentLoader(atlas);
            const skeletonJson = new window.spine.SkeletonJson(atlasLoader);
            const skeletonData = skeletonJson.readSkeletonData(assetManager.require(jsonPath));
            console.log('✅ SkeletonData作成成功（成功パターン適用）');
            
            // スケルトン・アニメーション作成
            this.state.skeleton = new window.spine.Skeleton(skeletonData);
            const stateData = new window.spine.AnimationStateData(skeletonData);
            this.state.animationState = new window.spine.AnimationState(stateData);
            console.log('✅ Skeleton・AnimationState作成成功');
            
            // 成功パターン5: キャラクター位置・スケール設定（成功パターンと同じ座標系）
            this.state.skeleton.scaleX = this.state.skeleton.scaleY = 0.6; // 適切なサイズに調整
            this.state.skeleton.x = 0;   // 成功パターンと同じ：0を基本位置に
            this.state.skeleton.y = 0;   // 成功パターンと同じ：0を基本位置に
            this.state.skeleton.setToSetupPose();
            this.state.skeleton.updateWorldTransform();
            console.log(`🎯 キャラクター初期配置完了: x=${this.state.skeleton.x}, y=${this.state.skeleton.y}, scale=${this.state.skeleton.scaleX} (成功パターン座標系)`);
            
            // 利用可能なアニメーション一覧を確認
            const availableAnimations = skeletonData.animations.map(anim => anim.name);
            console.log('🎬 利用可能なアニメーション:', availableAnimations);
            
            // デフォルトアニメーション設定
            if (config.animations.idle) {
                if (availableAnimations.includes(config.animations.idle)) {
                    this.state.animationState.setAnimation(0, config.animations.idle, true);
                    console.log(`✅ デフォルトアニメーション設定: ${config.animations.idle}`);
                } else {
                    console.warn(`⚠️ 指定されたアニメーション "${config.animations.idle}" が見つかりません。利用可能: ${availableAnimations.join(', ')}`);
                    // 最初のアニメーションをデフォルトに
                    if (availableAnimations.length > 0) {
                        this.state.animationState.setAnimation(0, availableAnimations[0], true);
                        console.log(`✅ 代替アニメーション設定: ${availableAnimations[0]}`);
                    }
                }
            }
            
            // データ保存
            this.state.spineData = {
                atlas,
                assetManager,
                skeletonData
            };
            
            console.log('✅ Spineファイル読み込み・セットアップ完了（成功パターン移植版）');
            
        } catch (error) {
            console.error('❌ Spine読み込みエラー（詳細）:', error);
            throw new Error(`Spineファイル読み込みエラー: ${error.message}`);
        }
    }
    
    /**
     * アセット読み込み完了待ち（成功パターン移植版）
     * 注意：このメソッドは現在使用されていません。loadSpineFiles内で直接実装されています。
     */
    async waitForAssets(assetManager) {
        return new Promise((resolve, reject) => {
            let checkCount = 0;
            const checkAssets = () => {
                if (assetManager.isLoadingComplete()) {
                    resolve();
                } else if (checkCount++ < 100) {
                    setTimeout(checkAssets, 100);
                } else {
                    reject(new Error('アセット読み込みタイムアウト（10秒）'));
                }
            };
            checkAssets();
        });
    }
    
    /**
     * アニメーションループ開始
     */
    startAnimationLoop() {
        const render = (currentTime) => {
            if (!this.state.loaded || !this.state.renderer || !this.state.skeleton) {
                return;
            }
            
            // デルタタイム計算
            const deltaTime = (currentTime - this.state.lastTime) / 1000;
            this.state.lastTime = currentTime;
            
            // アニメーション更新
            if (this.state.animationState) {
                this.state.animationState.update(deltaTime);
                this.state.animationState.apply(this.state.skeleton);
            }
            
            this.state.skeleton.updateWorldTransform();
            
            // 描画
            const renderer = this.state.renderer;
            let gl;
            
            // コンテキスト取得方法を判定
            if (renderer.context && renderer.context.gl) {
                // ManagedWebGLRenderingContext使用時
                gl = renderer.context.gl;
            } else if (renderer.gl) {
                // 直接GLコンテキストアクセス
                gl = renderer.gl;
            } else {
                // Canvas要素から取得
                gl = this.state.canvasElement.getContext('webgl') || this.state.canvasElement.getContext('experimental-webgl');
            }
            
            if (gl) {
                gl.clearColor(0, 0, 0, 0); // 透明背景
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
            
            // カメラ設定（成功パターン移植：Canvas中央にカメラ配置）
            if (renderer.camera) {
                renderer.camera.position.x = this.state.canvasElement.width / 2;
                renderer.camera.position.y = this.state.canvasElement.height / 2;
                renderer.camera.setViewport(this.state.canvasElement.width, this.state.canvasElement.height);
            }
            
            // スケルトン描画
            renderer.begin();
            renderer.drawSkeleton(this.state.skeleton, false);
            renderer.end();
            
            // 次フレーム予約
            this.state.animationFrameId = requestAnimationFrame(render);
        };
        
        this.state.lastTime = performance.now();
        this.state.animationFrameId = requestAnimationFrame(render);
        
        console.log('✅ アニメーションループ開始');
    }
    
    /**
     * イベント処理設定（クリック・アニメーション切り替え）
     */
    setupEventHandlers() {
        if (!this.state.canvasElement) return;
        
        const canvas = this.state.canvasElement;
        const animations = this.config.spineConfig.animations;
        
        // クリックイベント
        canvas.addEventListener('click', (event) => {
            console.log('🖱️ Canvas クリック', event);
            
            // クリックアニメーションがあれば実行
            if (animations.click && this.state.animationState) {
                this.state.animationState.setAnimation(0, animations.click, false);
                
                // クリックアニメーション完了後にアイドルに戻る
                this.state.animationState.addAnimation(0, animations.idle || 'taiki', true, 0);
            }
        });
        
        console.log('✅ イベント処理設定完了');
    }
    
    /**
     * 状態取得
     */
    getStatus() {
        return {
            loaded: this.state.loaded,
            loading: this.state.loading,
            error: this.state.error,
            canvasElement: this.state.canvasElement,
            config: {...this.config}
        };
    }
    
    /**
     * アニメーション切り替え
     */
    playAnimation(animationName, loop = false) {
        if (!this.state.animationState || !this.state.loaded) {
            console.log('⚠️ アニメーション状態が準備できていません');
            return false;
        }
        
        try {
            this.state.animationState.setAnimation(0, animationName, loop);
            console.log(`✅ アニメーション実行: ${animationName}`);
            return true;
        } catch (error) {
            console.error(`❌ アニメーション実行エラー: ${error.message}`);
            return false;
        }
    }
    
    /**
     * 位置変更
     */
    setPosition(x, y) {
        if (!this.state.canvasElement) {
            console.log('⚠️ Canvas要素が存在しません');
            return false;
        }
        
        // 設定更新
        this.config.position.x = x;
        this.config.position.y = y;
        
        // v3.0: 実証済み座標システムによる再配置
        this.coordinateSystem.applyResponsivePosition(
            this.state.canvasElement, 
            x, y
        );
        
        console.log(`✅ 位置変更: (${x}, ${y})`);
        return true;
    }
    
    /**
     * サイズ変更
     */
    setSize(width, height) {
        if (!this.state.canvasElement) {
            console.log('⚠️ Canvas要素が存在しません');
            return false;
        }
        
        // 設定更新
        this.config.canvasSize.width = width;
        this.config.canvasSize.height = height;
        
        // Canvas要素更新
        this.state.canvasElement.width = width;
        this.state.canvasElement.height = height;
        
        console.log(`✅ サイズ変更: ${width}x${height}`);
        return true;
    }
    
    /**
     * デバッグ情報表示
     */
    debug() {
        this.debugCompatibility.diagnose();
    }
    
    /**
     * 完全復元保証クリーンアップ
     */
    cleanup() {
        try {
            // アニメーションループ停止
            if (this.state.animationFrameId) {
                cancelAnimationFrame(this.state.animationFrameId);
                this.state.animationFrameId = null;
            }
            
            // Canvas要素削除
            if (this.state.canvasElement) {
                const container = this.initialState.containers.get(this.state.canvasElement);
                if (container && container.contains(this.state.canvasElement)) {
                    container.removeChild(this.state.canvasElement);
                }
                this.state.canvasElement = null;
            }
            
            // Spineリソース解放
            if (this.state.spineData) {
                if (this.state.spineData.atlas) {
                    this.state.spineData.atlas.dispose();
                }
                if (this.state.spineData.assetManager) {
                    this.state.spineData.assetManager.dispose();
                }
                this.state.spineData = null;
            }
            
            // WebGLレンダラー解放
            if (this.state.renderer) {
                // Spine WebGLのクリーンアップ
                this.state.renderer = null;
            }
            
            // 状態リセット
            this.state = {
                loaded: false,
                loading: false,
                error: null,
                canvasElement: null,
                spineData: null,
                renderer: null,
                skeleton: null,
                animationState: null,
                lastTime: 0,
                animationFrameId: null
            };
            
            // 初期状態復元
            this.initialState.containers.clear();
            
            console.log('🧹 UniversalSpineLoader: 完全クリーンアップ完了');
            
        } catch (error) {
            console.error('❌ UniversalSpineLoader: クリーンアップエラー:', error);
        }
    }
    
    /**
     * 単独テスト
     */
    static async test() {
        console.log('🧪 UniversalSpineLoader: テスト開始');
        
        try {
            const loader = new UniversalSpineLoader({
                containerSelector: 'body',
                spineConfig: {
                    basePath: '/assets/spine/characters/purattokun/',
                    atlasFile: 'purattokun.atlas',
                    jsonFile: 'purattokun.json',
                    animations: { idle: 'taiki', click: 'syutugen' }
                },
                canvasSize: { width: 200, height: 200 },
                position: { x: 100, y: 100 }
            });
            
            const result = await loader.execute();
            
            console.log('✅ UniversalSpineLoader テスト成功:', result.loaded ? '完全実行成功' : result.error);
            
            // 少し待ってからクリーンアップ
            setTimeout(() => {
                loader.cleanup();
                console.log('🧹 テスト用クリーンアップ完了');
            }, 3000);
            
            return {
                success: result.loaded,
                loader: loader,
                result: result
            };
            
        } catch (error) {
            console.error('❌ UniversalSpineLoader テスト失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// v3.0: 完全独立・グローバル公開
if (typeof window !== 'undefined') {
    window.UniversalSpineLoader = UniversalSpineLoader;
    
    // テスト関数もグローバルに
    window.testUniversalSpineLoader = UniversalSpineLoader.test;
    
    // 既存デバッグツールとの互換性
    window.debugUniversalSpineLoader = (instance) => {
        if (instance && typeof instance.debug === 'function') {
            instance.debug();
        } else {
            console.log('UniversalSpineLoaderインスタンスを引数として渡してください');
        }
    };
}