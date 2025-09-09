/**
 * StableSpineRenderer - v1.0 安定版Spineレンダリングモジュール
 *
 * 🎯 設計思想
 * - test-spine-basic-loading.html の成功パターンを基準とした確実な実装
 * - AIの「さじ加減」による問題を排除するため、動作確認済みの設定を固定化
 * - 汎用性を保ちつつ、毎回エラー無く読み込める安定性を最優先
 *
 * 🔧 成功パターンからの抽出要素
 * 1. WebGL設定: premultipliedAlpha: true（黒枠解決に重要）
 * 2. AssetManager: ベースパス + 相対パス方式
 * 3. SceneRenderer: 高レベルAPI使用（低レベル操作回避）
 * 4. 位置・スケール: 動作確認済みの値をデフォルト設定
 * 5. エラーハンドリング: 既知の問題パターンへの対応
 *
 * 🚀 使用方法
 * ```javascript
 * const renderer = new StableSpineRenderer({
 *     canvas: '#my-canvas',
 *     character: 'purattokun',
 *     basePath: '/assets/spine/characters/'
 * });
 *
 * await renderer.initialize();
 * renderer.playAnimation('taiki');
 * ```
 */

class StableSpineRenderer {
  constructor(config = {}) {
    // 設定のマージ（デフォルト値は成功パターンから抽出）
    this.config = {
      // Canvas設定（サイズはHTMLの設定を優先）
      canvas: config.canvas || "#spine-canvas",
      canvasWidth: config.canvasWidth, // undefined可（HTMLサイズ使用）
      canvasHeight: config.canvasHeight, // undefined可（HTMLサイズ使用）

      // キャラクター設定（デフォルトなし - 必須パラメータ）
      character: config.character,
      basePath: config.basePath || "/assets/spine/characters/",

      // 位置・スケール設定（自然な比率・横歪み防止）
      position: {
        x: config.position?.x ?? 100,
        y: config.position?.y ?? -100,
        scaleX: config.position?.scaleX ?? 1.0,
        scaleY: config.position?.scaleY ?? 1.0,
      },

      // アニメーション設定（自動検出対応）
      defaultAnimation: config.defaultAnimation, // undefined可能（自動検出される）

      // デバッグ設定
      debug: config.debug || false,
      logCallback: config.logCallback || console.log,
    };

    // 🔒 成功パターン固定設定（変更禁止）
    this.STABLE_WEBGL_CONFIG = {
      alpha: true,
      premultipliedAlpha: true, // 🔥 黒枠解決の重要設定
      antialias: true,
      depth: false,
      stencil: false,
    };

    // 内部状態
    this.canvas = null;
    this.gl = null;
    this.assetManager = null;
    this.skeleton = null;
    this.animationState = null;
    this.renderer = null;
    this.isAnimationRunning = false;

    // 初期化状態
    this.initialized = false;
    this.loading = false;

    // 必須パラメータの検証
    this.validateRequiredConfig();

    this.log("🎯 StableSpineRenderer 初期化", "info");
    this.log(`📋 使用キャラクター: ${this.config.character}`, "info");
    this.log(`📁 ベースパス: ${this.config.basePath}`, "info");
  }

  /**
   * 必須設定パラメータの検証
   */
  validateRequiredConfig() {
    if (!this.config.character || typeof this.config.character !== "string") {
      throw new Error(
        "❌ StableSpineRenderer: character パラメータが必要です（文字列）"
      );
    }

    if (this.config.character.trim() === "") {
      throw new Error("❌ StableSpineRenderer: character パラメータが空です");
    }
  }

  /**
   * ログ出力（デバッグ対応）
   */
  log(message, type = "info") {
    if (this.config.debug) {
      const timestamp = new Date().toLocaleTimeString();
      const prefix =
        type === "error"
          ? "❌"
          : type === "success"
          ? "✅"
          : type === "warning"
          ? "⚠️"
          : "ℹ️";

      const logMessage = `[${timestamp}] ${prefix} StableSpineRenderer: ${message}`;

      if (this.config.logCallback) {
        this.config.logCallback(logMessage);
      } else {
        console.log(logMessage);
      }
    }
  }

  /**
   * 初期化（メイン処理）
   */
  async initialize() {
    if (this.initialized) {
      this.log("⚠️ 既に初期化済みです", "warning");
      return true;
    }

    if (this.loading) {
      this.log("⚠️ 初期化処理中です", "warning");
      return false;
    }

    try {
      this.loading = true;
      this.log("🚀 初期化開始", "info");

      // Step 1: Canvas初期化
      await this.initializeCanvas();

      // Step 2: WebGL初期化（成功パターン固定設定）
      await this.initializeWebGL();

      // Step 3: Spine WebGLライブラリ確認
      await this.checkSpineLibrary();

      // Step 4: アセット読み込み
      await this.loadAssets();

      // Step 5: スケルトン初期化
      await this.initializeSkeleton();

      // Step 6: レンダラー初期化
      await this.initializeRenderer();

      // Step 7: アニメーション開始
      this.startAnimation();

      this.initialized = true;
      this.loading = false;

      this.log("🎉 初期化完了！", "success");
      return true;
    } catch (error) {
      this.loading = false;
      this.log(`❌ 初期化エラー: ${error.message}`, "error");
      console.error("StableSpineRenderer 初期化エラー:", error);
      throw error;
    }
  }

  /**
   * Canvas初期化
   */
  async initializeCanvas() {
    this.log("📐 Canvas初期化開始", "info");

    // Canvas要素の取得
    if (typeof this.config.canvas === "string") {
      this.canvas = document.querySelector(this.config.canvas);
    } else {
      this.canvas = this.config.canvas;
    }

    if (!this.canvas) {
      throw new Error(`Canvas要素が見つかりません: ${this.config.canvas}`);
    }

    // Canvas属性設定（DPR対応・正方形統一）
    const dpr = window.devicePixelRatio || 1;
    
    if (this.config.canvasWidth && this.config.canvasHeight) {
      // 🚨 横歪み修正: Canvas解像度を正方形に強制統一
      const cssSquareSize = Math.max(this.config.canvasWidth, this.config.canvasHeight);
      const bufferSquareSize = Math.round(cssSquareSize * dpr);
      
      // CSS表示サイズ設定（正方形統一）
      this.canvas.style.width = `${cssSquareSize}px`;
      this.canvas.style.height = `${cssSquareSize}px`;
      this.canvas.style.aspectRatio = '1 / 1';
      
      // 内部バッファサイズ設定（DPR対応）
      this.canvas.width = bufferSquareSize;
      this.canvas.height = bufferSquareSize;
      
      this.log(
        `📏 Canvasサイズ変更（DPR対応）: CSS ${cssSquareSize}×${cssSquareSize}px, バッファ ${bufferSquareSize}×${bufferSquareSize}px (DPR: ${dpr.toFixed(3)})`,
        "info"
      );
    } else {
      // 既存のHTMLサイズを使用（DPR対応・正方形統一）
      const rect = this.canvas.getBoundingClientRect();
      const cssSquareSize = Math.max(rect.width, rect.height);
      const bufferSquareSize = Math.round(cssSquareSize * dpr);
      
      // CSS表示サイズ設定（正方形統一）
      this.canvas.style.width = `${cssSquareSize}px`;
      this.canvas.style.height = `${cssSquareSize}px`;
      this.canvas.style.aspectRatio = '1 / 1';
      
      // 内部バッファサイズ設定（DPR対応）
      this.canvas.width = bufferSquareSize;
      this.canvas.height = bufferSquareSize;
      
      this.log(
        `📏 既存Canvasサイズ使用（DPR対応）: CSS ${cssSquareSize}×${cssSquareSize}px, バッファ ${bufferSquareSize}×${bufferSquareSize}px (DPR: ${dpr.toFixed(3)})`,
        "info"
      );
    }

    this.log("✅ Canvas初期化成功", "success");
  }

  /**
   * WebGL初期化（成功パターン固定設定）
   */
  async initializeWebGL() {
    this.log("🔧 WebGL初期化開始（成功パターン設定適用）", "info");

    // 🔒 成功パターンの設定を使用（変更禁止）
    this.gl = this.canvas.getContext("webgl", this.STABLE_WEBGL_CONFIG);

    if (!this.gl) {
      throw new Error("WebGL初期化失敗");
    }

    this.log("✅ WebGL初期化成功", "success");
    this.log(
      `🔍 WebGL設定: ${JSON.stringify(this.STABLE_WEBGL_CONFIG)}`,
      "info"
    );
  }

  /**
   * Spine WebGLライブラリ確認
   */
  async checkSpineLibrary() {
    this.log("📚 Spine WebGLライブラリ確認開始", "info");

    if (!window.spine) {
      throw new Error("Spine WebGLライブラリが読み込まれていません");
    }

    // 必要なクラスの存在確認
    const requiredClasses = [
      "AssetManager",
      "SkeletonJson",
      "AtlasAttachmentLoader",
      "Skeleton",
      "AnimationState",
      "AnimationStateData",
      "SceneRenderer",
    ];

    const missingClasses = requiredClasses.filter(
      (className) => !window.spine[className]
    );

    if (missingClasses.length > 0) {
      throw new Error(
        `Spine WebGLに必要なクラスが不足: ${missingClasses.join(", ")}`
      );
    }

    this.log("✅ Spine WebGLライブラリ確認済み", "success");
    this.log(`📋 利用可能クラス: ${requiredClasses.join(", ")}`, "info");
  }

  /**
   * アセット読み込み（成功パターンの方式）
   */
  async loadAssets() {
    this.log("📁 アセット読み込み開始", "info");

    // AssetManager初期化（成功パターンと同じベースパス方式）
    const characterPath = `${this.config.basePath}${this.config.character}/`;
    this.assetManager = new window.spine.AssetManager(this.gl, characterPath);

    this.log(`📂 キャラクターパス: ${characterPath}`, "info");

    // ファイル読み込み（成功パターンと同じ相対パス）
    this.assetManager.loadTextureAtlas(`${this.config.character}.atlas`);
    this.assetManager.loadJson(`${this.config.character}.json`);

    this.log("⏳ アセット読み込み中...", "info");

    // 読み込み完了待機（成功パターンと同じヘルパー関数）
    await this.waitForAssets();

    this.log("✅ アセット読み込み完了", "success");
  }

  /**
   * アセット読み込み完了待機（成功パターンから移植）
   */
  waitForAssets() {
    return new Promise((resolve, reject) => {
      const check = () => {
        if (this.assetManager.isLoadingComplete()) {
          resolve();
        } else if (this.assetManager.hasErrors()) {
          reject(
            new Error("Asset loading failed: " + this.assetManager.getErrors())
          );
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  /**
   * スケルトン初期化（成功パターンと同じ手順）
   */
  async initializeSkeleton() {
    this.log("🦴 スケルトン初期化開始", "info");

    // アトラス・スケルトンデータ取得（成功パターンと同じ）
    const atlas = this.assetManager.get(`${this.config.character}.atlas`);
    const atlasLoader = new window.spine.AtlasAttachmentLoader(atlas);
    const skeletonJson = new window.spine.SkeletonJson(atlasLoader);

    const skeletonData = skeletonJson.readSkeletonData(
      this.assetManager.get(`${this.config.character}.json`)
    );

    // スケルトン作成（成功パターンと同じ）
    this.skeleton = new window.spine.Skeleton(skeletonData);

    // 位置・スケール設定（成功パターンと同じデフォルト値・横歪み防止）
    this.skeleton.x = this.config.position.x;
    this.skeleton.y = this.config.position.y;
    
    // 🚨 横歪み修正: スケールを統一して歪みを防止
    const unifiedScale = Math.min(this.config.position.scaleX, this.config.position.scaleY);
    this.skeleton.scaleX = unifiedScale;
    this.skeleton.scaleY = unifiedScale;

    this.log(`📍 位置設定: (${this.skeleton.x}, ${this.skeleton.y})`, "info");
    this.log(`🔍 スケール設定: ${this.skeleton.scaleX}`, "info");

    // アニメーションステート初期化
    const animationStateData = new window.spine.AnimationStateData(
      this.skeleton.data
    );
    this.animationState = new window.spine.AnimationState(animationStateData);

    // 🎯 自動アニメーション検出（汎用性確保）
    const finalAnimation = this.autoDetectDefaultAnimation();

    // デフォルトアニメーション設定
    this.animationState.setAnimation(0, finalAnimation, true);

    this.log("✅ スケルトン初期化完了", "success");
    this.log(`🎬 使用アニメーション: ${finalAnimation}`, "info");
  }

  /**
   * 🎯 自動アニメーション検出機能（汎用性確保）
   *
   * キャラクター固有のアニメーション名を知らなくても自動的に適切なアニメーションを選択
   * 優先順位:
   * 1. ユーザー指定（config.defaultAnimation）
   * 2. 一般的な待機アニメーション（taiki, search, idle, default）
   * 3. 最初に見つかったアニメーション
   */
  autoDetectDefaultAnimation() {
    // 利用可能アニメーション取得
    const availableAnimations = this.skeleton.data.animations.map(
      (anim) => anim.name
    );
    this.log(
      `🔍 検出されたアニメーション: [${availableAnimations.join(", ")}]`,
      "info"
    );

    // 1. ユーザー指定がある場合は優先
    if (
      this.config.defaultAnimation &&
      availableAnimations.includes(this.config.defaultAnimation)
    ) {
      this.log(
        `✅ ユーザー指定アニメーション使用: ${this.config.defaultAnimation}`,
        "success"
      );
      return this.config.defaultAnimation;
    } else if (
      this.config.defaultAnimation &&
      !availableAnimations.includes(this.config.defaultAnimation)
    ) {
      this.log(
        `⚠️ 指定されたアニメーション '${this.config.defaultAnimation}' が見つかりません`,
        "warning"
      );
    }

    // 2. 優先順位付きの候補リスト
    const candidates = [
      "taiki", // purattokun標準
      "search", // nezumi標準
      "idle", // 一般的な待機
      "default", // デフォルト名
      "animation", // よくある名前
      "loop", // ループアニメーション
    ];

    // 最初に見つかった候補を使用
    for (const candidate of candidates) {
      if (availableAnimations.includes(candidate)) {
        this.log(`🎯 自動検出成功: ${candidate}`, "success");
        return candidate;
      }
    }

    // 3. 最後の手段：最初のアニメーション
    if (availableAnimations.length > 0) {
      const firstAnimation = availableAnimations[0];
      this.log(
        `🔄 フォールバック: 最初のアニメーション '${firstAnimation}' を使用`,
        "warning"
      );
      return firstAnimation;
    }

    // 4. アニメーションが全く無い場合（エラー）
    throw new Error(
      `❌ アニメーションが見つかりません。キャラクター '${this.config.character}' のSpineファイルを確認してください。`
    );
  }

  /**
   * レンダラー初期化（成功パターンと同じSceneRenderer）
   */
  async initializeRenderer() {
    this.log("🎨 レンダラー初期化開始", "info");

    // SceneRenderer使用（成功パターンと同じ高レベルAPI）
    this.renderer = new window.spine.SceneRenderer(this.canvas, this.gl);

    this.log("✅ レンダラー初期化完了", "success");
  }

  /**
   * アニメーション開始（成功パターンと同じレンダーループ）
   */
  startAnimation() {
    this.log("🎬 アニメーション開始", "info");

    this.isAnimationRunning = true;
    let lastTime = Date.now() / 1000;

    const render = () => {
      if (!this.isAnimationRunning || !this.skeleton || !this.animationState) {
        return;
      }

      try {
        const now = Date.now() / 1000;
        const delta = now - lastTime;
        lastTime = now;

        // アニメーション更新（成功パターンと同じ）
        this.animationState.update(delta);
        this.animationState.apply(this.skeleton);
        this.skeleton.updateWorldTransform();

        // 画面クリア・ビューポート設定（成功パターンと同じ）
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // 描画（成功パターンと同じ3段階）
        this.renderer.begin();
        this.renderer.drawSkeleton(this.skeleton, true);
        this.renderer.end();
      } catch (error) {
        this.log(`❌ 描画エラー: ${error.message}`, "error");
        console.error("描画エラー:", error);
        this.isAnimationRunning = false;
        return;
      }

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
    this.log("✅ アニメーションループ開始", "success");
  }

  /**
   * アニメーション再生
   */
  playAnimation(animationName, loop = null) {
    if (!this.animationState) {
      this.log("❌ アニメーション未初期化", "error");
      return false;
    }

    try {
      // ループ判定（デフォルト: taikiはループ、その他は単発）
      if (loop === null) {
        loop = animationName === "taiki";
      }

      this.animationState.setAnimation(0, animationName, loop);
      this.log(
        `🎬 アニメーション再生: ${animationName} (ループ: ${loop})`,
        "info"
      );
      return true;
    } catch (error) {
      this.log(`❌ アニメーション再生エラー: ${error.message}`, "error");
      return false;
    }
  }

  /**
   * アニメーションシーケンス再生（出現→待機など）
   */
  playSequence(animations) {
    if (
      !this.animationState ||
      !Array.isArray(animations) ||
      animations.length === 0
    ) {
      this.log("❌ シーケンス再生: 無効な引数", "error");
      return false;
    }

    try {
      // 最初のアニメーション設定
      this.animationState.setAnimation(0, animations[0], false);

      // 後続のアニメーション追加
      for (let i = 1; i < animations.length; i++) {
        const loop = i === animations.length - 1 && animations[i] === "taiki";
        this.animationState.addAnimation(0, animations[i], loop, 0);
      }

      this.log(`🎬 シーケンス再生: ${animations.join(" → ")}`, "info");
      return true;
    } catch (error) {
      this.log(`❌ シーケンス再生エラー: ${error.message}`, "error");
      return false;
    }
  }

  /**
   * 位置・スケール変更
   */
  setTransform(x = null, y = null, scaleX = null, scaleY = null) {
    if (!this.skeleton) {
      this.log("❌ スケルトン未初期化", "error");
      return false;
    }

    if (x !== null) this.skeleton.x = x;
    if (y !== null) this.skeleton.y = y;
    
    // 🚨 横歪み修正: スケールを統一して歪みを防止
    if (scaleX !== null || scaleY !== null) {
      const currentScaleX = scaleX !== null ? scaleX : this.skeleton.scaleX;
      const currentScaleY = scaleY !== null ? scaleY : this.skeleton.scaleY;
      const unifiedScale = Math.min(currentScaleX, currentScaleY);
      
      this.skeleton.scaleX = unifiedScale;
      this.skeleton.scaleY = unifiedScale;
    }

    this.log(
      `📍 位置・スケール更新: (${this.skeleton.x}, ${this.skeleton.y}) scale: ${this.skeleton.scaleX}（統一値）`,
      "info"
    );
    return true;
  }

  /**
   * 停止・クリーンアップ
   */
  stop() {
    this.log("⏹️ アニメーション停止・クリーンアップ開始", "info");

    this.isAnimationRunning = false;

    if (this.assetManager) {
      this.assetManager.dispose();
    }

    // 状態リセット
    this.initialized = false;
    this.skeleton = null;
    this.animationState = null;
    this.renderer = null;
    this.assetManager = null;
    this.gl = null;
    this.canvas = null;

    this.log("✅ クリーンアップ完了", "success");
  }

  /**
   * 状態取得（デバッグ用）
   */
  getStatus() {
    return {
      initialized: this.initialized,
      loading: this.loading,
      isAnimationRunning: this.isAnimationRunning,
      hasCanvas: !!this.canvas,
      hasWebGL: !!this.gl,
      hasSkeleton: !!this.skeleton,
      hasAnimationState: !!this.animationState,
      hasRenderer: !!this.renderer,
      config: { ...this.config },
    };
  }

  /**
   * 汎用ファクトリーメソッド（よく使うパターン）
   */
  static createForCharacter(
    characterName,
    canvasSelector = "#spine-canvas",
    options = {}
  ) {
    return new StableSpineRenderer({
      canvas: canvasSelector,
      character: characterName,
      basePath: "/assets/spine/characters/",
      debug: true,
      ...options,
    });
  }

  /**
   * 複数キャラクター対応ファクトリー
   */
  static async createMultiple(
    characters,
    containerSelector = ".spine-container"
  ) {
    const renderers = [];
    const container = document.querySelector(containerSelector);

    if (!container) {
      throw new Error(`Container not found: ${containerSelector}`);
    }

    for (const character of characters) {
      // Canvas要素を動的作成（DPR対応・正方形統一）
      const canvas = document.createElement("canvas");
      const dpr = window.devicePixelRatio || 1;
      const cssSquareSize = 400;
      const bufferSquareSize = Math.round(cssSquareSize * dpr);
      
      // CSS表示サイズ設定（正方形統一）
      canvas.style.width = `${cssSquareSize}px`;
      canvas.style.height = `${cssSquareSize}px`;
      canvas.style.aspectRatio = '1 / 1';
      
      // 内部バッファサイズ設定（DPR対応）
      canvas.width = bufferSquareSize;
      canvas.height = bufferSquareSize;
      
      canvas.id = `spine-canvas-${character}`;
      container.appendChild(canvas);

      // レンダラー作成
      const renderer = new StableSpineRenderer({
        canvas: canvas,
        character: character,
        debug: true,
      });

      await renderer.initialize();
      renderers.push(renderer);
    }

    return renderers;
  }
}

// グローバル公開（後方互換性）
if (typeof window !== "undefined") {
  window.StableSpineRenderer = StableSpineRenderer;
}

// モジュールエクスポート（CommonJS対応）
if (typeof module !== "undefined" && module.exports) {
  module.exports = StableSpineRenderer;
}
