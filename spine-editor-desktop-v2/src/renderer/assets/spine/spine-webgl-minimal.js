/**
 * Spine WebGL Minimal v2.0
 * Spine Editor Desktop v2.0 専用軽量版
 * 
 * 注意: これは開発用のプレースホルダーです
 * 実際の運用では既存のspine-webgl.jsをコピーしてください
 */

console.log('🦴 Spine WebGL Minimal v2.0 loading...');

// グローバルspineオブジェクト作成
window.spine = window.spine || {};

// 基本的なSpineクラスの軽量実装
(function() {
  'use strict';
  
  // Spine WebGL Context
  const spine = window.spine;
  
  /**
   * 基本Vector2クラス
   */
  class Vector2 {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
    
    set(x, y) {
      this.x = x;
      this.y = y;
      return this;
    }
    
    copy(v) {
      this.x = v.x;
      this.y = v.y;
      return this;
    }
  }
  
  /**
   * 基本Colorクラス
   */
  class Color {
    constructor(r = 1, g = 1, b = 1, a = 1) {
      this.r = r;
      this.g = g;
      this.b = b;
      this.a = a;
    }
    
    set(r, g, b, a) {
      this.r = r;
      this.g = g;
      this.b = b;
      this.a = a;
      return this;
    }
  }
  
  /**
   * 基本Skeletonクラス
   */
  class Skeleton {
    constructor(data) {
      this.data = data;
      this.bones = [];
      this.slots = [];
      this.drawOrder = [];
      this.x = 0;
      this.y = 0;
      this.scaleX = 1;
      this.scaleY = 1;
      this.color = new Color();
    }
    
    updateWorldTransform() {
      // ワールド変換更新（簡易実装）
      console.log('Skeleton world transform updated');
    }
    
    setToSetupPose() {
      // セットアップポーズ適用
      console.log('Skeleton set to setup pose');
    }
  }
  
  /**
   * 基本AnimationStateクラス
   */
  class AnimationState {
    constructor(data) {
      this.data = data;
      this.tracks = [];
      this.timeScale = 1;
    }
    
    update(delta) {
      // アニメーション更新
      console.log('Animation state updated:', delta);
    }
    
    apply(skeleton) {
      // スケルトンにアニメーション適用
      console.log('Animation applied to skeleton');
    }
    
    setAnimation(trackIndex, animationName, loop) {
      console.log('Animation set:', animationName, 'loop:', loop);
      return { animation: { name: animationName } };
    }
    
    clearTrack(trackIndex) {
      console.log('Track cleared:', trackIndex);
    }
  }
  
  /**
   * WebGL Shader基本実装
   */
  class Shader {
    constructor(gl) {
      this.gl = gl;
      this.program = null;
      this.uniforms = {};
      this.attributes = {};
    }
    
    bind() {
      if (this.program) {
        this.gl.useProgram(this.program);
      }
    }
    
    unbind() {
      this.gl.useProgram(null);
    }
    
    setUniformi(uniform, value) {
      console.log('Shader uniform set:', uniform, value);
    }
    
    setUniform4x4f(uniform, matrix) {
      console.log('Shader matrix set:', uniform);
    }
    
    dispose() {
      if (this.program) {
        this.gl.deleteProgram(this.program);
        this.program = null;
      }
    }
    
    static newTwoColoredTextured(gl) {
      console.log('Creating two colored textured shader');
      return new Shader(gl);
    }
  }
  
  // Shader定数
  Shader.SAMPLER = 'u_texture';
  Shader.MVP_MATRIX = 'u_mvp';
  
  /**
   * WebGL PolygonBatcher基本実装
   */
  class PolygonBatcher {
    constructor(gl) {
      this.gl = gl;
      this.mesh = null;
    }
    
    begin(shader) {
      console.log('Polygon batcher begin');
    }
    
    end() {
      console.log('Polygon batcher end');
    }
    
    flush() {
      console.log('Polygon batcher flush');
    }
  }
  
  /**
   * SkeletonRenderer基本実装
   */
  class SkeletonRenderer {
    constructor(gl) {
      this.gl = gl;
      this.premultipliedAlpha = false;
    }
    
    draw(batcher, skeleton) {
      console.log('Skeleton rendered');
    }
  }
  
  /**
   * TextureAtlas基本実装
   */
  class TextureAtlas {
    constructor() {
      this.pages = [];
      this.regions = [];
    }
    
    findRegion(name) {
      console.log('Finding atlas region:', name);
      return { name: name };
    }
  }
  
  /**
   * AssetManager基本実装
   */
  class AssetManager {
    constructor(gl) {
      this.gl = gl;
      this.assets = {};
    }
    
    loadText(path) {
      console.log('Loading text asset:', path);
      return Promise.resolve('');
    }
    
    loadTexture(path) {
      console.log('Loading texture asset:', path);
      return Promise.resolve(null);
    }
    
    get(path) {
      return this.assets[path];
    }
  }
  
  // WebGLネームスペース
  spine.webgl = {
    Shader: Shader,
    PolygonBatcher: PolygonBatcher
  };
  
  // 基本クラスをエクスポート
  spine.Vector2 = Vector2;
  spine.Color = Color;
  spine.Skeleton = Skeleton;
  spine.AnimationState = AnimationState;
  spine.SkeletonRenderer = SkeletonRenderer;
  spine.TextureAtlas = TextureAtlas;
  spine.AssetManager = AssetManager;
  
  // 便利な定数
  spine.BlendMode = {
    Normal: 0,
    Additive: 1,
    Multiply: 2,
    Screen: 3
  };
  
  console.log('✅ Spine WebGL Minimal v2.0 loaded');
  
})();

// 開発用デバッグ情報
if (typeof window !== 'undefined' && window.debugAPI) {
  window.debugAPI.log('Spine WebGL Minimal loaded - classes available:', Object.keys(window.spine));
}