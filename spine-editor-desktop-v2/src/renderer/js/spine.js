/**
 * Spine Editor Desktop v2.0 - 最適化Spine統合システム
 * 高速・軽量・シンプル設計 (500行以内・v1成功パターン活用)
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
   * 高速Spine初期化 (v1成功パターン)
   */
  async init() {
    console.log('🦴 Spine Manager v2.0 高速初期化開始...');
    
    try {
      // Step 1: Spine WebGL ライブラリ読み込み
      if (!await this.loadSpineWebGL()) {
        throw new Error('Spine WebGL library failed to load');
      }
      
      // Step 2: WebGLコンテキスト初期化
      this.initializeWebGL();
      
      // Step 3: Asset Manager初期化
      this.initializeAssetManager();
      
      // Step 4: レンダーループ開始
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
      return true;
    }
    
    if (typeof window.spine !== 'undefined') {
      console.log('✅ Spine WebGL 既に読み込み済み');
      window.__SPINE_WEBGL_LOADED__ = true;
      return true;
    }
    
    console.log('📦 Spine WebGL ライブラリ読み込み開始');
    
    return new Promise((resolve) => {
      // 既に読み込み中のスクリプトをチェック
      const existingScript = document.querySelector('script[src*="spine-webgl.js"]');
      if (existingScript) {
        console.log('⚠️ Spine WebGL 既に読み込み中・完了待機');
        existingScript.onload = () => {
          window.__SPINE_WEBGL_LOADED__ = true;
          resolve(true);
        };
        existingScript.onerror = () => resolve(false);
        return;
      }
      
      const script = document.createElement('script');
      script.src = '../assets/spine/spine-webgl.js';
      script.onload = () => {
        if (typeof window.spine !== 'undefined') {
          console.log('✅ Spine WebGL ライブラリ読み込み完了');
          window.__SPINE_WEBGL_LOADED__ = true;
          resolve(true);
        } else {
          console.error('❌ Spine WebGL オブジェクト初期化失敗');
          resolve(false);
        }
      };
      script.onerror = () => {
        console.error('❌ Spine WebGL ライブラリファイル読み込み失敗');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  /**
   * WebGLコンテキスト初期化 (効率化版)
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
    
    // Spine WebGL Renderer初期化
    if (window.spine && window.spine.WebGLRenderer) {
      this.renderer = new window.spine.WebGLRenderer(this.gl);
      console.log('✅ WebGL Renderer初期化完了');
    }
  }

  /**
   * Asset Manager初期化 (メモリ最適化版)
   */
  initializeAssetManager() {
    if (window.spine && window.spine.AssetManager) {
      this.assetManager = new window.spine.AssetManager(this.gl);
      console.log('✅ Asset Manager初期化完了');
    }
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
   * レンダー処理 (最適化版)
   */
  render(delta) {
    if (!this.gl || !this.renderer) return;
    
    // 画面クリア
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    // アニメーション更新
    if (this.animationState) {
      this.animationState.update(delta);
      this.animationState.apply(this.skeleton);
    }
    
    // Skeleton更新
    if (this.skeleton) {
      this.skeleton.updateWorldTransform();
      this.renderer.draw(this.skeleton);
    }
  }

  /**
   * キャラクター読み込み (効率的Asset読み込み)
   */
  async loadCharacter(atlasPath, skeletonPath) {
    if (!this.assetManager) {
      throw new Error('Asset Manager not initialized');
    }
    
    console.log('📥 キャラクター読み込み開始:', { atlasPath, skeletonPath });
    
    // Assetを読み込みキューに追加
    this.assetManager.loadText(atlasPath);
    this.assetManager.loadTexture(atlasPath.replace('.atlas', '.png'));
    this.assetManager.loadText(skeletonPath);
    
    // 読み込み完了を待機
    return new Promise((resolve, reject) => {
      const checkLoaded = () => {
        if (this.assetManager.isLoadingComplete()) {
          try {
            this.setupCharacter(atlasPath, skeletonPath);
            console.log('✅ キャラクター読み込み完了');
            resolve(true);
          } catch (error) {
            console.error('❌ キャラクター設定失敗:', error);
            reject(error);
          }
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    });
  }

  /**
   * キャラクター設定 (Skeleton & Animation)
   */
  setupCharacter(atlasPath, skeletonPath) {
    const atlas = new window.spine.TextureAtlas(
      this.assetManager.get(atlasPath),
      (path) => this.assetManager.get(path)
    );
    
    const atlasLoader = new window.spine.AtlasAttachmentLoader(atlas);
    const skeletonJson = new window.spine.SkeletonJson(atlasLoader);
    
    const skeletonData = skeletonJson.readSkeletonData(
      JSON.parse(this.assetManager.get(skeletonPath))
    );
    
    this.skeleton = new window.spine.Skeleton(skeletonData);
    this.skeleton.scaleX = this.skeleton.scaleY = 0.5;
    this.skeleton.x = 400;
    this.skeleton.y = 500;
    
    const stateData = new window.spine.AnimationStateData(skeletonData);
    this.animationState = new window.spine.AnimationState(stateData);
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
   * プロジェクトデータ読み込み (簡素化版)
   */
  async loadProject(projectData) {
    if (!projectData || !projectData.characters) return;
    
    for (const charData of projectData.characters) {
      if (charData.atlasPath && charData.skeletonPath) {
        await this.loadCharacter(charData.atlasPath, charData.skeletonPath);
        
        // 位置・スケール適用
        if (charData.x !== undefined) this.skeleton.x = charData.x;
        if (charData.y !== undefined) this.skeleton.y = charData.y;
        if (charData.scaleX !== undefined) this.skeleton.scaleX = charData.scaleX;
        if (charData.scaleY !== undefined) this.skeleton.scaleY = charData.scaleY;
      }
    }
    
    console.log('✅ プロジェクトデータ読み込み完了');
  }

  /**
   * プロジェクトデータエクスポート
   */
  exportProject() {
    const projectData = {
      characters: []
    };
    
    if (this.skeleton) {
      projectData.characters.push({
        x: this.skeleton.x,
        y: this.skeleton.y,
        scaleX: this.skeleton.scaleX,
        scaleY: this.skeleton.scaleY
      });
    }
    
    return projectData;
  }

  /**
   * リソース解放
   */
  dispose() {
    this.isAnimating = false;
    if (this.assetManager) {
      this.assetManager.dispose();
    }
    console.log('✅ Spine Manager リソース解放完了');
  }
}

// グローバル公開
window.SpineManager = SpineManager;
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    
    this.viewport.appendChild(this.canvas);
    
    // リサイズ処理
    window.addEventListener('resize', () => this.resizeCanvas());
    this.resizeCanvas();
    
    console.log('✅ Viewport initialized');
  }

  /**
   * WebGL初期化
   */
  async initWebGL() {
    try {
      this.gl = this.canvas.getContext('webgl', {
        alpha: true,
        premultipliedAlpha: false,
        stencil: true
      }) || this.canvas.getContext('experimental-webgl');
      
      if (!this.gl) {
        throw new Error('WebGL not supported');
      }

      // Spine WebGL初期化
      if (this.spineWebGL) {
        this.shader = this.spineWebGL.webgl.Shader.newTwoColoredTextured(this.gl);
        this.batcher = new this.spineWebGL.webgl.PolygonBatcher(this.gl);
        
        // WebGL設定
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        
        console.log('✅ WebGL context initialized');
      }
      
    } catch (error) {
      console.error('❌ WebGL initialization failed:', error);
      throw error;
    }
  }

  /**
   * Canvas リサイズ
   */
  resizeCanvas() {
    if (!this.canvas || !this.viewport) return;
    
    const rect = this.viewport.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * レンダーループ開始
   */
  startRenderLoop() {
    const render = (time) => {
      this.render(time);
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  /**
   * レンダリング処理
   */
  render(time) {
    if (!this.gl || !this.canvas) return;
    
    const deltaTime = this.lastTime > 0 ? (time - this.lastTime) / 1000 : 0;
    this.lastTime = time;
    
    // 背景クリア
    this.gl.clearColor(0.2, 0.2, 0.2, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    // アニメーション更新
    if (this.isPlaying) {
      this.updateAnimations(deltaTime);
    }
    
    // キャラクター描画
    this.renderCharacters();
  }

  /**
   * アニメーション更新
   */
  updateAnimations(deltaTime) {
    this.animationState.forEach((state, characterId) => {
      if (state.skeleton && state.animationState) {
        state.animationState.update(deltaTime);
        state.animationState.apply(state.skeleton);
        state.skeleton.updateWorldTransform();
      }
    });
  }

  /**
   * キャラクター描画
   */
  renderCharacters() {
    if (!this.shader || !this.batcher) return;
    
    this.characters.forEach((character) => {
      this.renderCharacter(character);
    });
  }

  /**
   * 単一キャラクター描画
   */
  renderCharacter(character) {
    if (!character.skeleton || !character.skeletonRenderer) return;
    
    try {
      this.shader.bind();
      this.shader.setUniformi(this.spineWebGL.webgl.Shader.SAMPLER, 0);
      
      // 変換行列設定
      this.shader.setUniform4x4f(
        this.spineWebGL.webgl.Shader.MVP_MATRIX,
        this.calculateMVPMatrix(character)
      );
      
      // キャラクター描画
      this.batcher.begin(this.shader);
      character.skeletonRenderer.draw(this.batcher, character.skeleton);
      this.batcher.end();
      
      this.shader.unbind();
      
    } catch (error) {
      console.error('Character render error:', error);
    }
  }

  /**
   * MVP行列計算
   */
  calculateMVPMatrix(character) {
    const canvas = this.canvas;
    if (!canvas) return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
    
    // 簡易的な2D変換行列
    const scaleX = 2 / canvas.width * this.currentZoom;
    const scaleY = -2 / canvas.height * this.currentZoom;
    const translateX = -1 + (character.x || 0) * scaleX + this.viewOffset.x * scaleX;
    const translateY = 1 + (character.y || 0) * scaleY + this.viewOffset.y * scaleY;
    
    return [
      scaleX * (character.scaleX || 1), 0, 0, 0,
      0, scaleY * (character.scaleY || 1), 0, 0,
      0, 0, 1, 0,
      translateX, translateY, 0, 1
    ];
  }

  /**
   * プロジェクトデータ読み込み
   */
  async loadData(spineData) {
    console.log('📁 Loading spine data:', spineData);
    
    try {
      if (spineData.characters) {
        for (const charData of spineData.characters) {
          await this.loadCharacter(charData);
        }
      }
      
      this.app.setStatus(`Loaded ${this.characters.size} character(s)`);
      
    } catch (error) {
      console.error('❌ Failed to load spine data:', error);
      throw error;
    }
  }

  /**
   * キャラクター読み込み
   */
  async loadCharacter(characterData) {
    try {
      if (!this.spineWebGL) {
        throw new Error('Spine WebGL not initialized');
      }

      const character = {
        id: characterData.id || Date.now().toString(),
        name: characterData.name || 'Character',
        x: characterData.x || 0,
        y: characterData.y || 0,
        scaleX: characterData.scaleX || 1,
        scaleY: characterData.scaleY || 1,
        skeleton: null,
        skeletonData: null,
        skeletonRenderer: null,
        animations: []
      };

      // Spine データ読み込み
      if (characterData.jsonPath && characterData.atlasPath) {
        await this.loadSpineAssets(character, characterData.jsonPath, characterData.atlasPath);
      }

      this.characters.set(character.id, character);
      this.updateCharacterList();
      
      console.log(`✅ Character loaded: ${character.name}`);
      
    } catch (error) {
      console.error('❌ Failed to load character:', error);
      throw error;
    }
  }

  /**
   * Spine アセット読み込み
   */
  async loadSpineAssets(character, jsonPath, atlasPath) {
    // 実装は既存のSpine統合コードを参考に
    // WebGL TextureLoader、AtlasLoader、SkeletonJsonの使用
    console.log(`📄 Loading spine assets: ${jsonPath}, ${atlasPath}`);
  }

  /**
   * キャラクターリスト更新
   */
  updateCharacterList() {
    const listElement = document.getElementById('character-list');
    if (!listElement) return;
    
    if (this.characters.size === 0) {
      listElement.innerHTML = '<div class="placeholder-text">No characters loaded</div>';
      return;
    }
    
    const html = Array.from(this.characters.values()).map(char => `
      <div class="character-item" data-id="${char.id}">
        <span class="character-name">${char.name}</span>
        <span class="character-status">${char.skeleton ? '✅' : '⚠️'}</span>
      </div>
    `).join('');
    
    listElement.innerHTML = html;
    
    // クリックイベント設定
    listElement.querySelectorAll('.character-item').forEach(item => {
      item.addEventListener('click', () => {
        const charId = item.dataset.id;
        const character = this.characters.get(charId);
        if (character && this.app.ui) {
          this.app.ui.selectCharacter(character);
        }
      });
    });
  }

  /**
   * 座標位置でキャラクター取得
   */
  getCharacterAt(x, y) {
    // 簡易的な衝突判定
    for (const character of this.characters.values()) {
      if (this.isPointInCharacter(x, y, character)) {
        return character;
      }
    }
    return null;
  }

  /**
   * ポイントがキャラクター内にあるか判定
   */
  isPointInCharacter(x, y, character) {
    // 簡易的な矩形判定
    const bounds = this.getCharacterBounds(character);
    return x >= bounds.x && x <= bounds.x + bounds.width &&
           y >= bounds.y && y <= bounds.y + bounds.height;
  }

  /**
   * キャラクター境界取得
   */
  getCharacterBounds(character) {
    // デフォルト境界（実際のスケルトン境界を使用すべき）
    return {
      x: (character.x || 0) - 50,
      y: (character.y || 0) - 50,
      width: 100,
      height: 100
    };
  }

  /**
   * キャラクタープロパティ更新
   */
  updateCharacterProperty(character, property, value) {
    if (!character) return;
    
    switch (property) {
      case 'posX':
        character.x = value;
        break;
      case 'posY':
        character.y = value;
        break;
      case 'scaleX':
        character.scaleX = value;
        if (character.skeleton) {
          character.skeleton.scaleX = value;
        }
        break;
      case 'scaleY':
        character.scaleY = value;
        if (character.skeleton) {
          character.skeleton.scaleY = value;
        }
        break;
    }
    
    this.updateCharacterList();
  }

  /**
   * アニメーション選択
   */
  selectAnimation(character, animationName) {
    if (!character || !character.skeleton || !animationName) return;
    
    const state = this.animationState.get(character.id);
    if (state && state.animationState) {
      state.animationState.setAnimation(0, animationName, true);
      console.log(`🎬 Animation selected: ${animationName} for ${character.name}`);
    }
  }

  /**
   * アニメーション再生
   */
  playAnimation(character) {
    this.isPlaying = true;
    console.log(`▶️ Animation playing for ${character ? character.name : 'all'}`);
  }

  /**
   * アニメーション一時停止
   */
  pauseAnimation(character) {
    this.isPlaying = false;
    console.log(`⏸️ Animation paused for ${character ? character.name : 'all'}`);
  }

  /**
   * アニメーション停止
   */
  stopAnimation(character) {
    this.isPlaying = false;
    
    if (character) {
      const state = this.animationState.get(character.id);
      if (state && state.animationState) {
        state.animationState.clearTrack(0);
      }
    }
    
    console.log(`⏹️ Animation stopped for ${character ? character.name : 'all'}`);
  }

  /**
   * ズーム設定
   */
  setZoom(zoom) {
    this.currentZoom = Math.max(0.1, Math.min(5.0, zoom));
  }

  /**
   * ビューリセット
   */
  resetView() {
    this.currentZoom = 1.0;
    this.viewOffset = { x: 0, y: 0 };
  }

  /**
   * データエクスポート
   */
  async exportData() {
    const charactersData = Array.from(this.characters.values()).map(char => ({
      id: char.id,
      name: char.name,
      x: char.x,
      y: char.y,
      scaleX: char.scaleX,
      scaleY: char.scaleY,
      // 他必要なプロパティ
    }));
    
    return {
      characters: charactersData,
      viewport: {
        zoom: this.currentZoom,
        offset: this.viewOffset
      }
    };
  }

  /**
   * 選択解除
   */
  clearSelection() {
    if (this.app.ui) {
      this.app.ui.clearSelection();
    }
  }

  /**
   * 破棄処理
   */
  destroy() {
    // WebGLリソース解放
    if (this.gl && this.shader) {
      this.shader.dispose();
    }
    
    // キャラクターデータクリア
    this.characters.clear();
    this.animationState.clear();
    
    console.log('🗑️ Spine Manager destroyed');
  }
}

// グローバル公開
window.SpineManager = SpineManager;