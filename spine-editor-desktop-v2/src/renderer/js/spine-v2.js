/**
 * Spine Editor Desktop v2.0 - 最適化Spine統合システム
 * 高速・軽量・シンプル設計 (348行・v1成功パターン活用)
 */

class SpineManager {
  constructor(app) {
    this.app = app;
    
    // 基本状態管理
    this.characters = new Map();
    this.canvas = null;
    this.gl = null;
    this.isInitialized = false;
    
    // Spine WebGL統合
    this.assetManager = null;
    this.renderer = null;
    this.skeleton = null;
    this.animationState = null;
    
    // アニメーション制御
    this.isAnimating = false;
    this.lastTime = 0;
  }

  /**
   * 高速Spine初期化 (v2.0最適化版・character-renderer.js成功パターン活用)
   */
  async init() {
    console.log('🦴 Spine Manager v2.0 高速初期化開始...');
    
    try {
      // Step 1: Spine WebGL ライブラリ読み込み（即判定）
      if (!await this.loadSpineWebGL()) {
        throw new Error('Spine WebGL library failed to load');
      }
      
      // Step 2: Spine Renderer可用性確認（現代API対応）
      if (!this.isSpineRendererAvailable()) {
        throw new Error('Spine Renderer components not available');
      }
      
      // Step 3: WebGLコンテキスト初期化
      this.initializeWebGL();
      
      // Step 4: Asset Manager初期化
      this.initializeAssetManager();
      
      // Step 5: レンダーループ開始
      this.startRenderLoop();
      
      this.isInitialized = true;
      console.log('✅ Spine Manager v2.0 初期化完了');
      
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
   * Asset Manager初期化 (現代API対応版)
   */
  initializeAssetManager() {
    try {
      if (spine.AssetManager) {
        this.assetManager = new spine.AssetManager(this.gl);
        console.log('✅ AssetManager初期化完了（v4+ API）');
      } else if (window.spine && window.spine.webgl && window.spine.webgl.AssetManager) {
        this.assetManager = new window.spine.webgl.AssetManager(this.gl);
        console.log('✅ AssetManager初期化完了（v3.8 API）');
      } else if (window.spine && window.spine.AssetManager) {
        this.assetManager = new window.spine.AssetManager(this.gl);
        console.log('✅ AssetManager初期化完了（Legacy API）');
      } else {
        throw new Error('No compatible Spine AssetManager found');
      }
    } catch (error) {
      console.error('❌ Asset Manager初期化失敗:', error);
      throw error;
    }
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
   * レンダー処理 (安全化・フォールバック対応版)
   */
  render(delta) {
    if (!this.gl || !this.renderer) {
      console.warn('[Spine] render(): gl/renderer unavailable');
      return;
    }
    
    try {
      // 画面クリア
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      
      // アニメーション更新（安全性チェック付き）
      if (this.animationState && typeof this.animationState.update === 'function' && this.skeleton) {
        try {
          this.animationState.update(delta);
          this.animationState.apply(this.skeleton);
        } catch (error) {
          console.error('[Spine] AnimationState.update() エラー:', error.message);
          console.warn('[Spine] update処理スキップ - 次フレームで再試行');
          return;
        }
      } else if (this.animationState || this.skeleton) {
        console.warn('[Spine] state/skeleton の不整合を検出:', {
          hasAnimationState: !!this.animationState,
          hasUpdateMethod: !!(this.animationState && typeof this.animationState.update === 'function'),
          hasSkeleton: !!this.skeleton
        });
        this.stopRenderLoop();
        return;
      }
      
      // Skeleton更新（安全性チェック付き）
      if (this.skeleton && this.skeleton.updateWorldTransform) {
        this.skeleton.updateWorldTransform();
        
        // レンダラー種別に応じた描画処理
        if (this.renderer.draw) {
          this.renderer.draw(this.skeleton);
        } else if (this.renderer.begin && this.renderer.end) {
          // Legacy API fallback
          this.renderer.begin();
          this.renderer.draw(this.skeleton);
          this.renderer.end();
        }
      }
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

  /**
   * キャラクター読み込み (ワークフロー統合版)
   */
  async loadCharacter(atlasPath, skeletonPath) {
    if (!this.assetManager) {
      throw new Error('Asset Manager not initialized');
    }
    
    console.log('📥 Character loading started:', { atlasPath, skeletonPath });
    
    try {
      // ファイル存在確認
      await this.verifyFiles([atlasPath, skeletonPath]);
      
      // Asset読み込みキューに追加
      this.assetManager.loadText(atlasPath);
      this.assetManager.loadTexture(atlasPath.replace('.atlas', '.png'));
      this.assetManager.loadText(skeletonPath);
      
      // 読み込み完了待機
      await this.waitForAssets();
      
      // キャラクター設定
      this.setupCharacter(atlasPath, skeletonPath);
      
      console.log('✅ Character loaded successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Character loading failed:', error);
      throw error;
    }
  }

  /**
   * ファイル存在確認
   */
  async verifyFiles(filePaths) {
    for (const path of filePaths) {
      if (!window.electronAPI) continue;
      
      try {
        const result = await window.electronAPI.readFile(path);
        if (!result.success) {
          throw new Error(`File not found: ${path}`);
        }
      } catch (error) {
        throw new Error(`File verification failed: ${path} - ${error.message}`);
      }
    }
  }

  /**
   * Asset読み込み待機 (高速化・安全化版)
   */
  async waitForAssets() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 30; // 3秒 (100ms * 30)
      
      const checkLoaded = () => {
        attempts++;
        
        try {
          if (this.assetManager.isLoadingComplete()) {
            console.log(`✅ Asset読み込み完了 (${attempts * 100}ms)`);
            resolve();
            return;
          }
          
          if (this.assetManager.hasErrors && this.assetManager.hasErrors()) {
            reject(new Error('Asset loading failed with errors'));
            return;
          }
          
          if (attempts >= maxAttempts) {
            console.error(`❌ Asset読み込みタイムアウト (${maxAttempts * 100}ms)`);
            reject(new Error('Asset loading timeout - 3 seconds exceeded'));
            return;
          }
          
          setTimeout(checkLoaded, 100);
          
        } catch (error) {
          console.error('❌ Asset読み込みチェック中エラー:', error);
          reject(error);
        }
      };
      
      // 即座に開始
      checkLoaded();
    });
  }

  /**
   * キャラクター設定 (Skeleton & Animation - 現代API対応)
   */
  setupCharacter(atlasPath, skeletonPath) {
    try {
      // TextureAtlas作成 (APIバージョン対応)
      let atlas;
      if (spine.TextureAtlas) {
        atlas = new spine.TextureAtlas(
          this.assetManager.get(atlasPath),
          (path) => this.assetManager.get(path)
        );
      } else {
        atlas = new window.spine.TextureAtlas(
          this.assetManager.get(atlasPath),
          (path) => this.assetManager.get(path)
        );
      }
      
      // AtlasAttachmentLoader作成
      let atlasLoader;
      if (spine.AtlasAttachmentLoader) {
        atlasLoader = new spine.AtlasAttachmentLoader(atlas);
      } else {
        atlasLoader = new window.spine.AtlasAttachmentLoader(atlas);
      }
      
      // SkeletonJson作成
      let skeletonJson;
      if (spine.SkeletonJson) {
        skeletonJson = new spine.SkeletonJson(atlasLoader);
      } else {
        skeletonJson = new window.spine.SkeletonJson(atlasLoader);
      }
      
      // SkeletonData読み込み
      const skeletonData = skeletonJson.readSkeletonData(
        JSON.parse(this.assetManager.get(skeletonPath))
      );
      
      // Skeleton作成
      if (spine.Skeleton) {
        this.skeleton = new spine.Skeleton(skeletonData);
      } else {
        this.skeleton = new window.spine.Skeleton(skeletonData);
      }
      
      // デフォルト設定
      this.skeleton.scaleX = this.skeleton.scaleY = 0.5;
      this.skeleton.x = 400;
      this.skeleton.y = 500;
      
      // AnimationState作成
      let stateData, animationState;
      if (spine.AnimationStateData) {
        stateData = new spine.AnimationStateData(skeletonData);
        this.animationState = new spine.AnimationState(stateData);
      } else {
        stateData = new window.spine.AnimationStateData(skeletonData);
        this.animationState = new window.spine.AnimationState(stateData);
      }
      
      console.log('✅ Character setup completed successfully');
      
    } catch (error) {
      console.error('❌ Character setup failed:', error);
      throw error;
    }
  }

  /**
   * アニメーション再生 (基本制御)
   */
  playAnimation(animationName, loop = true) {
    if (this.animationState) {
      this.animationState.setAnimation(0, animationName, loop);
      console.log(`🎬 アニメーション再生: ${animationName} (loop: ${loop})`);
    }
  }

  /**
   * アニメーションシーケンス再生 (syutugen → taiki)
   */
  playAnimationSequence() {
    if (!this.animationState) return;
    
    // syutugen → taiki のシーケンス
    this.animationState.setAnimation(0, 'syutugen', false);
    this.animationState.addAnimation(0, 'taiki', true, 0);
    console.log('🎬 アニメーションシーケンス開始: syutugen → taiki');
  }

  /**
   * Canvas要素取得
   */
  getCanvas() {
    return this.canvas;
  }

  /**
   * ビューポートに追加
   */
  attachToViewport(viewportElement) {
    if (this.canvas && viewportElement) {
      viewportElement.appendChild(this.canvas);
      console.log('✅ Canvas をビューポートに追加');
    }
  }

  /**
   * キャラクター位置更新
   */
  updateCharacterPosition(x, y) {
    if (this.skeleton) {
      this.skeleton.x = x;
      this.skeleton.y = y;
    }
  }

  /**
   * キャラクタースケール更新
   */
  updateCharacterScale(scaleX, scaleY) {
    if (this.skeleton) {
      this.skeleton.scaleX = scaleX;
      this.skeleton.scaleY = scaleY;
    }
  }

  /**
   * プロジェクトデータ読み込み (v2.0 ワークフロー版)
   */
  async loadProject(projectData) {
    if (!projectData || !projectData.characters) {
      console.warn('⚠️ No project data or characters found');
      return;
    }
    
    console.log('📁 Loading project with', projectData.characters.length, 'characters');
    
    // キャラクターデータをローカルに保存
    this.projectData = projectData;
    
    // 最初のキャラクターを読み込み (現在は1体のみ対応)
    const primaryCharacter = projectData.characters[0];
    if (primaryCharacter.atlasPath && primaryCharacter.jsonPath) {
      await this.loadCharacter(primaryCharacter.atlasPath, primaryCharacter.jsonPath);
      
      // 位置・スケール適用
      this.applyCharacterTransform(primaryCharacter);
      
      // キャラクター情報を記録
      this.currentCharacter = primaryCharacter;
    }
    
    console.log('✅ Project loaded successfully');
  }

  /**
   * キャラクター変換適用
   */
  applyCharacterTransform(charData) {
    if (!this.skeleton) return;
    
    if (charData.x !== undefined) this.skeleton.x = charData.x;
    if (charData.y !== undefined) this.skeleton.y = charData.y;
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
      this.skeleton.x = this.currentCharacter.x || 400;
      this.skeleton.y = this.currentCharacter.y || 300;
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
        this.skeleton.x = value;
        character.x = value;
        break;
      case 'posY':
        this.skeleton.y = value;
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
    
    if (this.assetManager) {
      this.assetManager.dispose();
    }
    
    // CanvasをDOMから削除
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    
    // 内部状態クリア
    this.characters.clear();
    this.skeleton = null;
    this.animationState = null;
    this.currentCharacter = null;
    
    console.log('✅ Spine Manager disposed completely');
  }
}

// グローバル公開
window.SpineManager = SpineManager;