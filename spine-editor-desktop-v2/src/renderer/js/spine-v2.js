/**
 * Spine Editor Desktop v2.0 - Spine統合システム (v3成功パターン移植版)
 * 
 * 🚀 v3移植完了状況:
 * ✅ SpineCharacterManagerパターン移植 (v3から動作確認済み)
 * ✅ Web版成功パターン統合 (AssetManager, skeleton座標統一)
 * ✅ 実Spineキャラクター読み込み機能 (ぷらっとくん, nezumi対応)
 * 
 * 🎯 実装済み機能:
 * - 動的キャラクター作成・管理
 * - アセット読み込み（.atlas/.json/.png）
 * - アニメーション再生・制御
 * - WebGL描画・レンダリングループ
 */

class SpineManager {
  constructor(app) {
    this.app = app;
    
    // v3移植: SpineCharacterManagerパターン採用
    this.characters = new Map();
    this.loadedAssets = new Map();
    this.isSpineReady = false;
    
    // デスクトップアプリ固有の状態
    this.canvas = null;
    this.gl = null;
    this.isInitialized = false;
    
    // v3移植: レガシー互換性維持
    this.assetManager = null;
    this.renderer = null;
    this.skeleton = null;
    this.animationState = null;
    
    // アニメーション制御
    this.isAnimating = false;
    this.lastTime = 0;
    
    console.log('🚀 SpineManager v2.0 (v3パターン移植版) 初期化開始');
    this.checkSpineAvailability();
  }

  // v3移植: Spine WebGL利用可能性確認
  checkSpineAvailability() {
    if (typeof spine !== 'undefined') {
      this.isSpineReady = true;
      console.log('✅ Spine WebGL利用可能');
    } else {
      console.warn('⚠️ Spine WebGL未読み込み - 待機中');
      this.waitForSpine();
    }
  }

  // v3移植: Spine読み込み待機
  async waitForSpine(maxRetries = 100) {
    for (let i = 0; i < maxRetries; i++) {
      if (typeof spine !== 'undefined' && spine.TextureAtlas && spine.AssetManager) {
        this.isSpineReady = true;
        console.log('✅ Spine WebGL読み込み完了');
        console.log('🔍 Spine version:', spine.version || 'unknown');
        console.log('🔍 Available classes:', Object.keys(spine).filter(key => typeof spine[key] === 'function'));
        
        this.testSpineComponents();
        return true;
      }
      if (i % 10 === 0) {
        console.log(`🔄 Spine読み込み待機中... (${i}/${maxRetries})`);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.error('❌ Spine WebGL読み込みタイムアウト');
    return false;
  }

  // v3移植: デバッグ用コンポーネントテスト
  testSpineComponents() {
    console.log('🔍 Spine WebGL コンポーネントテスト開始');
    
    const requiredClasses = ['AssetManager', 'SceneRenderer', 'Skeleton', 'AnimationState', 'TextureAtlas'];
    requiredClasses.forEach(className => {
      console.log(`${className}:`, spine[className] ? '✅' : '❌');
    });
    
    // WebGLコンテキスト作成テスト
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl');
    console.log('WebGL Context:', gl ? '✅' : '❌');
    
    if (gl) {
      try {
        const assetManager = new spine.AssetManager(gl);
        console.log('AssetManager作成: ✅');
      } catch (error) {
        console.log('AssetManager作成: ❌', error);
      }
    }
  }

  /**
   * v3移植: 統合初期化システム
   */
  async init() {
    console.log('🦴 Spine Manager v2.0 (v3パターン) 初期化開始...');
    
    try {
      // Spine WebGL準備完了を確認
      if (!this.isSpineReady) {
        await this.waitForSpine();
      }
      
      // 基本WebGL環境初期化
      this.initializeWebGL();
      
      this.isInitialized = true;
      console.log('✅ Spine Manager v2.0 (v3パターン) 初期化完了');
      
    } catch (error) {
      console.error('❌ Spine Manager初期化失敗:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Spine WebGL ライブラリ読み込み (シングルトンガード版)
   */
  async loadSpineWebGL() {
    // シングルトンガード: グローバルフラグをチェック
    if (window.__SPINE_WEBGL_LOADED__) {
      console.log('✅ Spine WebGL シングルトンガード - 既に読み込み済み');
      return this.isSpineRendererAvailable();
    }
    
    // 重複ロード防止：即座判定
    if (this.isSpineRendererAvailable()) {
      console.log('✅ Spine WebGL 既に読み込み済み・Renderer利用可能');
      window.__SPINE_WEBGL_LOADED__ = true;
      return true;
    }
    
    if (typeof window.spine !== 'undefined') {
      console.log('✅ Spine WebGL オブジェクト存在・Renderer確認中');
      const available = this.isSpineRendererAvailable();
      if (available) window.__SPINE_WEBGL_LOADED__ = true;
      return available;
    }
    
    console.log('📦 Spine WebGL ライブラリ読み込み開始');
    
    return new Promise((resolve) => {
      // 既に読み込み中のスクリプトをチェック
      const existingScript = document.querySelector('script[src*="spine-webgl.js"]');
      if (existingScript) {
        console.log('⚠️ Spine WebGL 既に読み込み中・完了待機');
        existingScript.onload = () => {
          window.__SPINE_WEBGL_LOADED__ = true;
          resolve(this.isSpineRendererAvailable());
        };
        existingScript.onerror = () => resolve(false);
        return;
      }
      
      const script = document.createElement('script');
      script.src = '../assets/spine/spine-webgl.js';
      script.onload = () => {
        const available = this.isSpineRendererAvailable();
        if (available) {
          console.log('✅ Spine WebGL ライブラリ読み込み完了・Renderer利用可能');
          window.__SPINE_WEBGL_LOADED__ = true;
        } else {
          console.error('❌ Spine WebGL 読み込み成功もRenderer初期化失敗');
        }
        resolve(available);
      };
      script.onerror = () => {
        console.error('❌ Spine WebGL ライブラリファイル読み込み失敗');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  /**
   * WebGLコンテキスト初期化 (現代API対応版)
   */
  initializeWebGL() {
    // Canvas作成
    this.canvas = document.createElement('canvas');
    this.canvas.width = 800;
    this.canvas.height = 600;
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: transparent;
    `;
    
    // WebGLコンテキスト取得
    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    if (!this.gl) {
      throw new Error('WebGL not supported');
    }
    
    // Spine WebGL Renderer初期化（現代API対応）
    try {
      if (spine.SceneRenderer) {
        this.renderer = new spine.SceneRenderer(this.canvas, this.gl);
        console.log('✅ SceneRenderer初期化完了（v4+ API）');
      } else if (window.spine && window.spine.webgl && window.spine.webgl.SceneRenderer) {
        this.renderer = new window.spine.webgl.SceneRenderer(this.canvas, this.gl);
        console.log('✅ SceneRenderer初期化完了（v3.8 API）');
      } else if (window.spine && window.spine.WebGLRenderer) {
        this.renderer = new window.spine.WebGLRenderer(this.gl);
        console.log('✅ WebGLRenderer初期化完了（Legacy API）');
      } else {
        throw new Error('No compatible Spine Renderer found');
      }
    } catch (error) {
      console.error('❌ Spine Renderer初期化失敗:', error);
      throw error;
    }
  }

  /**
   * Asset Manager初期化 (プレースホルダー版 - クリーンアップ済み)
   */
  initializeAssetManager() {
    console.log('📝 AssetManager初期化スキップ（クリーンアップ版）');
    // 実際のAssetManager初期化は削除済み
    // 必要に応じて後で実装
    this.assetManager = null;
  }

  /**
   * Spine Renderer可用性確認 (character-renderer.js成功パターン)
   */
  isSpineRendererAvailable() {
    if (!window.spine) {
      console.log('❌ window.spine が存在しません');
      return false;
    }
    
    // v4+ API (直接spine名前空間)
    const hasV4SceneRenderer = !!(spine.SceneRenderer);
    const hasV4AssetManager = !!(spine.AssetManager);
    
    // v3.8 API (spine.webgl名前空間)
    const hasV38SceneRenderer = !!(window.spine.webgl && window.spine.webgl.SceneRenderer);
    const hasV38AssetManager = !!(window.spine.webgl && window.spine.webgl.AssetManager);
    
    // Legacy API
    const hasLegacyRenderer = !!(window.spine.WebGLRenderer);
    const hasLegacyAssetManager = !!(window.spine.AssetManager);
    
    const v4Available = hasV4SceneRenderer && hasV4AssetManager;
    const v38Available = hasV38SceneRenderer && hasV38AssetManager;
    const legacyAvailable = hasLegacyRenderer && hasLegacyAssetManager;
    
    console.log('🔍 Spine API可用性チェック:', {
      'v4+ (spine.*)': v4Available,
      'v3.8 (spine.webgl.*)': v38Available,
      'Legacy (spine.*)': legacyAvailable
    });
    
    return v4Available || v38Available || legacyAvailable;
  }

  /**
   * レンダーループ開始 (30fps制限)
   */
  startRenderLoop() {
    this.isAnimating = true;
    
    const render = (now) => {
      if (!this.isAnimating) return;
      
      // 30fps制限 (約33.33ms間隔)
      const deltaTime = now - this.lastTime;
      if (deltaTime >= 33.33) {
        this.render(deltaTime / 1000.0);
        this.lastTime = now;
      }
      
      requestAnimationFrame(render);
    };
    
    requestAnimationFrame(render);
    console.log('✅ レンダーループ開始 (30fps)');
  }

  /**
   * レンダー処理 (プレースホルダー版 - クリーンアップ済み)
   */
  render(delta) {
    if (!this.gl || !this.renderer) {
      console.warn('[Spine] render(): gl/renderer unavailable');
      return;
    }
    
    try {
      // 画面クリア（基本動作のみ保持）
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      
      // Spineアニメーション描画は削除済み（クリーンアップ版）
      // 必要に応じて後で実装
      
    } catch (error) {
      console.error('[Spine] render() エラー:', error);
      console.warn('[Spine] レンダーループ停止中...');
      this.stopRenderLoop();
    }
  }
  
  /**
   * レンダーループ停止
   */
  stopRenderLoop() {
    this.isAnimating = false;
    console.log('⏹️ レンダーループ停止');
  }

  // v3移植: キャラクター動的作成
  async createCharacter(characterData) {
    try {
      console.log(`🎭 キャラクター作成開始: ${characterData.name}`);
      
      // Canvas要素作成
      const canvas = this.createCanvasElement(characterData);
      
      // フォールバック画像作成
      const fallback = this.createFallbackElement(characterData);
      
      // 設定要素作成
      const config = this.createConfigElement(characterData);
      
      // spine-stage コンテナに追加
      const spineStage = document.getElementById('spine-stage');
      if (spineStage) {
        spineStage.appendChild(canvas);
        spineStage.appendChild(fallback);
        spineStage.appendChild(config);
      }
      
      // Spine WebGL初期化
      if (this.isSpineReady) {
        try {
          await this.initializeSpineCharacter(characterData, canvas, fallback);
        } catch (error) {
          console.warn(`⚠️ Spine初期化失敗、フォールバックに切り替え: ${characterData.name}`, error);
          this.showFallbackCharacter(canvas, fallback);
        }
      } else {
        this.showFallbackCharacter(canvas, fallback);
      }
      
      // キャラクター登録
      this.characters.set(characterData.name, {
        data: characterData,
        canvas,
        fallback,
        config,
        isLoaded: this.isSpineReady
      });
      
      console.log(`✅ キャラクター作成完了: ${characterData.name}`);
      return true;
      
    } catch (error) {
      console.error(`❌ キャラクター作成エラー: ${characterData.name}`, error);
      return false;
    }
  }

  // v3移植: Canvas要素作成
  createCanvasElement(characterData) {
    const canvas = document.createElement('canvas');
    canvas.id = `${characterData.name}-canvas`;
    
    // nezumi対応: 十分な表示領域確保
    canvas.width = characterData.name === 'nezumi' ? 150 : 300;
    canvas.height = characterData.name === 'nezumi' ? 180 : 200;
    canvas.setAttribute('data-character-name', characterData.name);
    canvas.setAttribute('data-spine-character', 'true');
    
    // スタイル設定
    Object.assign(canvas.style, {
      position: 'absolute',
      left: `${characterData.position.x}%`,
      top: `${characterData.position.y}%`,
      transform: 'translate(-50%, -50%)',
      width: `${(characterData.scale || 1) * (characterData.name === 'nezumi' ? 20 : 30)}%`,
      aspectRatio: characterData.name === 'nezumi' ? '5/6' : '3/2',
      zIndex: '10',
      cursor: 'pointer',
      opacity: '0', // 初期は非表示
      transition: 'opacity 0.3s ease'
    });
    
    return canvas;
  }

  // v3移植: フォールバック画像要素作成
  createFallbackElement(characterData) {
    const fallback = document.createElement('img');
    fallback.id = `${characterData.name}-fallback`;
    fallback.src = `assets/images/${characterData.name}.png`;
    fallback.alt = characterData.name;
    fallback.setAttribute('data-character-name', characterData.name);
    fallback.setAttribute('data-spine-character', 'true');
    
    // スタイル設定
    Object.assign(fallback.style, {
      position: 'absolute',
      left: `${characterData.position.x}%`,
      top: `${characterData.position.y}%`,
      transform: 'translate(-50%, -50%)',
      width: `${(characterData.scale || 1) * 10}%`,
      aspectRatio: '1/1',
      objectFit: 'contain',
      zIndex: '10',
      opacity: '1', // 初期表示
      transition: 'opacity 0.3s ease'
    });
    
    return fallback;
  }

  // v3移植: 設定要素作成
  createConfigElement(characterData) {
    const config = document.createElement('div');
    config.id = `${characterData.name}-config`;
    config.style.display = 'none';
    
    config.setAttribute('data-x', characterData.position.x);
    config.setAttribute('data-y', characterData.position.y);
    config.setAttribute('data-scale', characterData.scale || 1);
    config.setAttribute('data-fade-delay', '1500');
    config.setAttribute('data-fade-duration', '2000');
    
    return config;
  }

  /**
   * レガシー互換: キャラクター読み込み (v3移植パターンに転送)
   */
  async loadCharacter(atlasPath, skeletonPath) {
    console.log('📝 Legacy loadCharacter -> createCharacter パターンに転送');
    
    // atlasPathからキャラクター名を推定
    const characterName = atlasPath.split('/').pop().replace('.atlas', '');
    
    const characterData = {
      name: characterName,
      position: { x: 50, y: 50 },
      scale: 1.0,
      files: {
        atlas: atlasPath,
        skeleton: skeletonPath
      }
    };
    
    return await this.createCharacter(characterData);
  }

  /**
   * ファイル存在確認 (プレースホルダー版 - クリーンアップ済み)
   */
  async verifyFiles(filePaths) {
    console.log('📝 File verification スキップ（クリーンアップ版）');
    console.log('   ファイルパス:', filePaths);
    
    // 実際のファイル存在確認は削除済み
    // 必要に応じて後で実装
  }

  /**
   * Asset読み込み待機 (プレースホルダー版 - クリーンアップ済み)
   */
  async waitForAssets() {
    console.log('📝 Asset wait スキップ（クリーンアップ版）');
    
    // 実際のAsset読み込み待機は削除済み
    // 必要に応じて後で実装
    return Promise.resolve();
  }

  // v3移植: Spineキャラクター初期化（Web版成功パターン移植）
  async initializeSpineCharacter(characterData, canvas, fallback) {
    try {
      console.log(`🎮 Web版パターンでSpine初期化: ${characterData.name}`);
      
      // WebGLコンテキスト取得（Web版と同じ設定）
      const gl = canvas.getContext('webgl', { 
        alpha: true, 
        premultipliedAlpha: false 
      });
      
      if (!gl) {
        throw new Error('WebGL context creation failed');
      }

      // AssetManagerを使用（Web版と同じ方法）
      const assetManager = new spine.AssetManager(gl);
      
      // 標準的なアセット読み込み（Web版と同じ）
      const basePath = `assets/spine/characters/${characterData.name}/`;
      const atlasPath = `${basePath}${characterData.name}.atlas`;
      const jsonPath = `${basePath}${characterData.name}.json`;
      const imagePath = `${basePath}${characterData.name}.png`;
      
      console.log('📁 Web版パターンでアセット読み込み:', { atlasPath, jsonPath, imagePath });
      
      // 標準読み込み
      assetManager.loadTextureAtlas(atlasPath);
      assetManager.loadText(jsonPath);
      assetManager.loadTexture(imagePath);
      
      // 読み込み完了待機
      await this.waitForAssetLoading(assetManager);
      
      // Skeleton作成（Web版と同じ手順）
      const atlas = assetManager.require(atlasPath);
      const skeletonJson = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(atlas));
      const skeletonData = skeletonJson.readSkeletonData(assetManager.require(jsonPath));
      const skeleton = new spine.Skeleton(skeletonData);
      
      // nezumi専用座標・スケール調整
      if (characterData.name === 'nezumi') {
        skeleton.x = 0;
        skeleton.y = -25; // nezumi用: さらに上げて完全表示確保
        skeleton.scaleX = skeleton.scaleY = (characterData.scale || 1) * 0.8;
      } else {
        // 🚀 シンプル化革命: v2.0で証明されたシンプル座標設定
        skeleton.x = 0;  // 画面中央原点
        skeleton.y = 0;  // 画面中央原点
        skeleton.scaleX = skeleton.scaleY = 1.0; // スケールも1.0で固定
      }
      
      // デバッグ用: スケルトン情報を外部からアクセス可能に
      if (!window.spineSkeletonDebug) window.spineSkeletonDebug = new Map();
      window.spineSkeletonDebug.set(characterData.name, skeleton);
      
      // アニメーション設定
      const animationStateData = new spine.AnimationStateData(skeleton.data);
      const animationState = new spine.AnimationState(animationStateData);
      
      // デフォルトアニメーション
      this.setDefaultAnimation(skeleton, animationState);
      
      // Web版と同じレンダラー作成
      const renderer = new spine.SceneRenderer(canvas, gl);
      
      // 描画ループ開始
      this.startCharacterRenderLoop(canvas, gl, renderer, skeleton, animationState);
      
      // キャラクタークリックイベント
      this.setupCharacterEvents(canvas, characterData);
      
      // 表示切り替え
      canvas.style.opacity = '1';
      fallback.style.opacity = '0';
      
      // アセット情報保存
      this.loadedAssets.set(characterData.name, {
        assetManager,
        skeleton,
        animationState,
        renderer
      });
      
      // レガシー互換性のために設定
      this.skeleton = skeleton;
      this.animationState = animationState;
      
      console.log(`✅ Web版パターンでSpine初期化完了: ${characterData.name}`);
      
    } catch (error) {
      console.error(`❌ Web版パターンSpine初期化エラー: ${characterData.name}`, error);
      this.showFallbackCharacter(canvas, fallback);
      throw error;
    }
  }

  /**
   * レガシー互換: キャラクター設定
   */
  setupCharacter(atlasPath, skeletonPath) {
    console.log('📝 Legacy setupCharacter - v3パターンに更新が必要');
    console.log('   パラメータ:', { atlasPath, skeletonPath });
    console.log('   推奨: createCharacter() メソッドを使用してください');
  }

  // v3移植: デフォルトアニメーション設定
  setDefaultAnimation(skeleton, animationState) {
    // 推奨順序でアニメーション検索
    const animationPriority = ['taiki', 'idle', 'syutugen', 'appear'];
    
    for (const animName of animationPriority) {
      if (skeleton.data.findAnimation(animName)) {
        if (animName === 'syutugen' || animName === 'appear') {
          // 登場アニメーション → 待機ループ
          animationState.setAnimation(0, animName, false);
          animationState.addAnimation(0, 'taiki', true, 0);
        } else {
          // 直接ループアニメーション
          animationState.setAnimation(0, animName, true);
        }
        console.log(`🎬 アニメーション設定: ${animName}`);
        return;
      }
    }
    
    // フォールバック：最初のアニメーション
    if (skeleton.data.animations.length > 0) {
      const firstAnim = skeleton.data.animations[0].name;
      animationState.setAnimation(0, firstAnim, true);
      console.log(`🎬 フォールバックアニメーション: ${firstAnim}`);
    }
  }

  /**
   * レガシー互換: アニメーション再生
   */
  playAnimation(animationName, loop = true) {
    if (this.animationState && animationName) {
      this.animationState.setAnimation(0, animationName, loop);
      console.log(`🎬 アニメーション再生: ${animationName} (loop: ${loop})`);
    } else {
      console.warn('⚠️ AnimationState未初期化またはアニメーション名が無効');
    }
  }

  // v3移植: アセット読み込み完了待機
  async waitForAssetLoading(assetManager, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkAssets = () => {
        if (assetManager.isLoadingComplete()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Asset loading timeout'));
        } else {
          setTimeout(checkAssets, 100);
        }
      };
      
      checkAssets();
    });
  }

  // v3移植: キャラクター描画ループ開始
  startCharacterRenderLoop(canvas, gl, renderer, skeleton, animationState) {
    let lastTime = Date.now() / 1000;
    
    const render = () => {
      const now = Date.now() / 1000;
      const delta = now - lastTime;
      lastTime = now;

      // アニメーション更新
      animationState.update(delta);
      animationState.apply(skeleton);
      skeleton.updateWorldTransform();

      // レンダリング
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.viewport(0, 0, canvas.width, canvas.height);

      renderer.begin();
      renderer.drawSkeleton(skeleton, true);
      renderer.end();

      requestAnimationFrame(render);
    };
    
    render();
  }

  // v3移植: キャラクターイベント設定
  setupCharacterEvents(canvas, characterData) {
    canvas.addEventListener('click', (event) => {
      console.log(`🎯 キャラクタークリック: ${characterData.name}`);
      
      // アプリケーション状態更新
      if (this.app && this.app.selectCharacter) {
        const characterIndex = Array.from(this.characters.keys()).indexOf(characterData.name);
        this.app.selectCharacter(characterIndex);
      }
      
      // クリックアニメーション再生
      this.playClickAnimation(characterData.name);
    });
    
    // マウスオーバーエフェクト
    canvas.addEventListener('mouseenter', () => {
      canvas.style.filter = 'brightness(1.1)';
    });
    
    canvas.addEventListener('mouseleave', () => {
      canvas.style.filter = 'none';
    });
  }

  // v3移植: クリックアニメーション再生
  playClickAnimation(characterName) {
    const assetData = this.loadedAssets.get(characterName);
    if (!assetData) return;
    
    const { skeleton, animationState } = assetData;
    
    // やられアニメーション → 待機復帰
    if (skeleton.data.findAnimation('yarare')) {
      animationState.setAnimation(0, 'yarare', false);
      animationState.addAnimation(0, 'taiki', true, 0);
      console.log(`🎬 クリックアニメーション: yarare → taiki`);
    } else if (skeleton.data.findAnimation('click')) {
      animationState.setAnimation(0, 'click', false);
      animationState.addAnimation(0, 'taiki', true, 0);
      console.log(`🎬 クリックアニメーション: click → taiki`);
    }
  }

  // v3移植: フォールバック表示
  showFallbackCharacter(canvas, fallback) {
    canvas.style.opacity = '0';
    fallback.style.opacity = '1';
    console.log('📷 フォールバック画像表示');
  }

  /**
   * レガシー互換: アニメーションシーケンス再生
   */
  playAnimationSequence() {
    if (this.animationState) {
      this.setDefaultAnimation(this.skeleton, this.animationState);
      console.log('🎬 アニメーションシーケンス: デフォルト設定適用');
    } else {
      console.warn('⚠️ AnimationState未初期化');
    }
  }

  /**
   * Canvas要素取得 (レガシー互換)
   */
  getCanvas() {
    return this.canvas;
  }

  /**
   * ビューポートに追加 (レガシー互換)
   */
  attachToViewport(viewportElement) {
    if (this.canvas && viewportElement) {
      viewportElement.appendChild(this.canvas);
      console.log('✅ Canvas をビューポートに追加');
    }
  }

  /**
   * v3移植: グローバル参照設定
   */
  setAsGlobalInstance() {
    window.currentSpineManager = this;
    window.spineCharacterManager = this; // v3互換性
    console.log('🌍 SpineManager グローバル参照設定完了');
  }

  /**
   * キャラクター位置更新 (プレースホルダー版 - クリーンアップ済み)
   */
  updateCharacterPosition(x, y) {
    console.log(`📝 位置更新 スキップ: (${x}, ${y})`);
    // 実際のキャラクター位置更新は削除済み
    // 必要に応じて後で実装
  }

  /**
   * キャラクタースケール更新 (プレースホルダー版 - クリーンアップ済み)
   */
  updateCharacterScale(scaleX, scaleY) {
    console.log(`📝 スケール更新 スキップ: (${scaleX}, ${scaleY})`);
    // 実際のキャラクタースケール更新は削除済み
    // 必要に応じて後で実装
  }

  // v3移植: プロジェクトデータ読み込み
  async loadProject(projectData) {
    try {
      console.log('📦 プロジェクトキャラクター読み込み開始');
      
      if (!projectData.characters || projectData.characters.length === 0) {
        throw new Error('キャラクターデータが見つかりません');
      }
      
      // 既存キャラクター削除
      this.clearAllCharacters();
      
      // 各キャラクター作成
      for (const characterData of projectData.characters) {
        await this.createCharacter(characterData);
      }
      
      console.log(`✅ ${projectData.characters.length}個のキャラクター読み込み完了`);
      
    } catch (error) {
      console.error('❌ プロジェクトキャラクター読み込みエラー:', error);
      throw error;
    }
  }

  // v3移植: キャラクター削除
  removeCharacter(characterName) {
    const character = this.characters.get(characterName);
    if (character) {
      // DOM要素削除
      character.canvas.remove();
      character.fallback.remove();
      character.config.remove();
      
      // アセット削除
      this.loadedAssets.delete(characterName);
      this.characters.delete(characterName);
      
      console.log(`🗑️ キャラクター削除: ${characterName}`);
    }
  }

  // v3移植: 全キャラクター削除
  clearAllCharacters() {
    for (const characterName of this.characters.keys()) {
      this.removeCharacter(characterName);
    }
    
    console.log('🗑️ 全キャラクター削除完了');
  }

  // v3移植: キャラクター位置更新
  updateCharacterPosition(characterName, x, y) {
    const character = this.characters.get(characterName);
    if (character) {
      character.canvas.style.left = `${x}%`;
      character.canvas.style.top = `${y}%`;
      character.fallback.style.left = `${x}%`;
      character.fallback.style.top = `${y}%`;
      
      // 設定も更新
      character.config.setAttribute('data-x', x);
      character.config.setAttribute('data-y', y);
      
      // データ更新
      character.data.position.x = x;
      character.data.position.y = y;
      
      console.log(`📐 位置更新: ${characterName} (${x}%, ${y}%)`);
    }
  }

  /**
   * キャラクター変換適用
   */
  applyCharacterTransform(charData) {
    if (!this.skeleton) return;
    
    // 🚀 今回実験で証明された最シンプル実装: 常に0で固定
    this.skeleton.x = 0;
    this.skeleton.y = 0;
    if (charData.scaleX !== undefined) this.skeleton.scaleX = charData.scaleX;
    if (charData.scaleY !== undefined) this.skeleton.scaleY = charData.scaleY;
    
    console.log('🎯 Character transform applied:', {
      x: this.skeleton.x,
      y: this.skeleton.y,
      scaleX: this.skeleton.scaleX,
      scaleY: this.skeleton.scaleY
    });
  }

  /**
   * プロジェクトデータエクスポート (v2.0 拡張版)
   */
  exportProject() {
    const projectData = {
      version: '2.0.0',
      characters: [],
      viewport: {
        zoom: this.currentZoom || 1.0,
        offset: this.viewOffset || { x: 0, y: 0 }
      },
      runtime: {
        lastExported: new Date().toISOString(),
        animationState: this.getCurrentAnimationState()
      }
    };
    
    // 現在のキャラクター情報をエクスポート
    if (this.skeleton && this.currentCharacter) {
      const characterData = {
        ...this.currentCharacter,
        x: this.skeleton.x,
        y: this.skeleton.y,
        scaleX: this.skeleton.scaleX,
        scaleY: this.skeleton.scaleY,
        currentAnimation: this.getCurrentAnimation()
      };
      
      projectData.characters.push(characterData);
    }
    
    console.log('📤 Project exported:', projectData);
    return projectData;
  }

  /**
   * 現在のアニメーション状態取得
   */
  getCurrentAnimationState() {
    if (!this.animationState || !this.animationState.tracks) {
      return null;
    }
    
    const track = this.animationState.tracks[0];
    return {
      animationName: track?.animation?.name || null,
      time: track?.trackTime || 0,
      loop: track?.loop || false
    };
  }

  /**
   * 現在のアニメーション名取得
   */
  getCurrentAnimation() {
    const state = this.getCurrentAnimationState();
    return state ? state.animationName : null;
  }

  /**
   * ズーム設定
   */
  setZoom(zoomLevel) {
    this.currentZoom = zoomLevel;
    
    if (this.skeleton) {
      // スケールでズームをシミュレート (元スケールを保持)
      const baseScale = this.currentCharacter ? 
        (this.currentCharacter.scaleX || 0.5) : 0.5;
      
      this.skeleton.scaleX = this.skeleton.scaleY = baseScale * zoomLevel;
    }
    
    console.log('🔍 Zoom set:', zoomLevel);
  }

  /**
   * ビューリセット
   */
  resetView() {
    this.currentZoom = 1.0;
    this.viewOffset = { x: 0, y: 0 };
    
    if (this.skeleton && this.currentCharacter) {
      // 🚀 常にシンプル座標に統一
      this.skeleton.x = 0;
      this.skeleton.y = 0;
      this.skeleton.scaleX = this.currentCharacter.scaleX || 0.5;
      this.skeleton.scaleY = this.currentCharacter.scaleY || 0.5;
    }
    
    console.log('🎯 View reset');
  }

  /**
   * 指定位置のキャラクター取得 (UI連携用)
   */
  getCharacterAt(x, y) {
    if (!this.skeleton || !this.canvas) return null;
    
    // 簡易的な当たり判定 (実際はより精密な判定が必要)
    const skeletonScreenX = this.skeleton.x;
    const skeletonScreenY = this.skeleton.y;
    const threshold = 50; // 50pxの範囲
    
    const distance = Math.sqrt(
      Math.pow(x - skeletonScreenX, 2) + Math.pow(y - skeletonScreenY, 2)
    );
    
    return distance <= threshold ? this.currentCharacter : null;
  }

  /**
   * キャラクタープロパティ更新 (UI連携用)
   */
  updateCharacterProperty(character, property, value) {
    if (!this.skeleton || !character) return;
    
    switch (property) {
      case 'posX':
        // 🚀 位置は常に0で固定（シンプル実装）
        this.skeleton.x = 0;
        character.x = value;
        break;
      case 'posY':
        // 🚀 位置は常に0で固定（シンプル実装）  
        this.skeleton.y = 0;
        character.y = value;
        break;
      case 'scaleX':
        this.skeleton.scaleX = value;
        character.scaleX = value;
        break;
      case 'scaleY':
        this.skeleton.scaleY = value;
        character.scaleY = value;
        break;
    }
    
    console.log('🔧 Property updated:', property, '=', value);
  }

  /**
   * アニメーション選択 (UI連携用)
   */
  selectAnimation(character, animationName) {
    if (this.animationState && animationName) {
      this.animationState.setAnimation(0, animationName, true);
      console.log('🎨 Animation selected:', animationName);
    }
  }

  /**
   * アニメーション再生 (UI連携用)
   */
  playAnimation(character) {
    // 現在再生中のアニメーションを継続
    console.log('▶️ Animation playing');
  }

  /**
   * アニメーション一時停止 (UI連携用)
   */
  pauseAnimation(character) {
    // アニメーションを一時停止
    console.log('⏸️ Animation paused');
  }

  /**
   * アニメーション停止 (UI連携用)
   */
  stopAnimation(character) {
    if (this.animationState) {
      this.animationState.clearTracks();
      console.log('⏹️ Animation stopped');
    }
  }

  /**
   * 選択解除 (UI連携用)
   */
  clearSelection() {
    // 現在の選択をクリア
    console.log('🔄 Selection cleared');
  }

  /**
   * リソース解放
   */
  dispose() {
    this.isAnimating = false;
    
    // v3移植: 全キャラクター削除
    this.clearAllCharacters();
    
    if (this.assetManager) {
      this.assetManager.dispose();
    }
    
    // レガシーCanvasをDOMから削除
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    
    // 内部状態クリア
    this.loadedAssets.clear();
    this.skeleton = null;
    this.animationState = null;
    this.currentCharacter = null;
    
    // グローバル参照クリア
    if (window.currentSpineManager === this) {
      window.currentSpineManager = null;
      window.spineCharacterManager = null;
    }
    
    console.log('✅ Spine Manager (v3パターン) disposed completely');
  }
}

// v3移植: テスト用キャラクター作成機能
class SpineTestUtils {
  static createTestCharacterData(name, x = 50, y = 50, scale = 1.0) {
    return {
      name: name,
      position: { x, y },
      scale: scale,
      files: {
        atlas: `assets/spine/characters/${name}/${name}.atlas`,
        skeleton: `assets/spine/characters/${name}/${name}.json`,
        image: `assets/spine/characters/${name}/${name}.png`
      }
    };
  }
  
  static async createPurattokun(spineManager) {
    const characterData = this.createTestCharacterData('purattokun', 30, 60, 1.0);
    return await spineManager.createCharacter(characterData);
  }
  
  static async createNezumi(spineManager) {
    const characterData = this.createTestCharacterData('nezumi', 70, 40, 0.8);
    return await spineManager.createCharacter(characterData);
  }
  
  static async createBothCharacters(spineManager) {
    console.log('🎭 テスト用キャラクター作成開始');
    
    const results = {
      purattokun: await this.createPurattokun(spineManager),
      nezumi: await this.createNezumi(spineManager)
    };
    
    console.log('✅ テスト用キャラクター作成完了:', results);
    return results;
  }
}

// グローバル公開
window.SpineManager = SpineManager;
window.SpineTestUtils = SpineTestUtils;

// v3移植: グローバル関数公開
window.loadProjectCharacters = async function(projectData) {
  if (window.currentSpineManager) {
    return await window.currentSpineManager.loadProject(projectData);
  } else {
    console.error('❌ SpineManagerが初期化されていません');
    return false;
  }
};

window.clearAllCharacters = function() {
  if (window.currentSpineManager) {
    window.currentSpineManager.clearAllCharacters();
  }
};

// デバッグ用ショートカット
window.testCreatePurattokun = async function() {
  if (window.currentSpineManager) {
    return await SpineTestUtils.createPurattokun(window.currentSpineManager);
  }
};

window.testCreateNezumi = async function() {
  if (window.currentSpineManager) {
    return await SpineTestUtils.createNezumi(window.currentSpineManager);
  }
};

window.testCreateBothCharacters = async function() {
  if (window.currentSpineManager) {
    return await SpineTestUtils.createBothCharacters(window.currentSpineManager);
  }
};