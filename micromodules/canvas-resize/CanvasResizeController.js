/**
 * 🎯 CanvasResizeController.js v2.0
 * 
 * 統合編集機能付きCanvas制御マイクロモジュール
 * - Canvas解像度制御（正方形リサイズ）
 * - キャラクタースケール・位置調整  
 * - BB統合操作（Canvas+キャラクター一体制御）
 * - 完全透明背景対応
 * 
 * 要件: REQUIREMENTS.md v1.0
 * 技術仕様: TECHNICAL_SPEC.md v1.0
 * v3.0システム開発哲学準拠：シンプル・軽量・単一責任
 * 
 * @author StableSpineRenderer プロジェクト
 * @version 2.0.0
 * @since 2025-09-02
 */

// ========================================
// 🔧 CanvasManager - Canvas制御専門クラス
// ========================================
class CanvasManager {
  constructor(parent) {
    this.parent = parent;
    this.canvas = parent.canvas;
    this.config = parent.config;
  }

  /**
   * 📐 Canvas解像度変更（正方形）
   * @param {number} size - 正方形のサイズ（px）
   * @returns {boolean} 成功/失敗
   */
  resizeToSquare(size) {
    try {
      if (!size || size < 100 || size > 1200) {
        this.parent.log(`❌ 無効なサイズです (100-1200px): ${size}`);
        return false;
      }

      this.parent.log(`🔄 Canvas解像度変更: ${this.canvas.width}x${this.canvas.height} → ${size}x${size}`);

      // Canvas物理サイズ変更
      this.canvas.width = size;
      this.canvas.height = size;

      this.parent.log(`✅ Canvas解像度変更完了: ${size}x${size}`);

      // WebGL対応
      this.updateWebGLViewport();
      
      return true;
    } catch (error) {
      this.parent.error(`❌ Canvas解像度変更エラー: ${error.message}`);
      return false;
    }
  }

  /**
   * 🎨 完全透明背景設定
   */
  setTransparentBackground() {
    try {
      // CSS透明背景
      this.canvas.style.background = 'transparent';
      this.canvas.style.backgroundColor = 'transparent';

      // WebGL透明設定
      const gl = this.canvas.getContext('webgl') || this.canvas.getContext('webgl2');
      if (gl) {
        gl.clearColor(0, 0, 0, 0); // 完全透明
        this.parent.log('✅ WebGL透明背景設定完了');
      }

      this.parent.log('✅ Canvas透明背景設定完了');
    } catch (error) {
      this.parent.error(`⚠️ 透明背景設定警告: ${error.message}`);
    }
  }

  /**
   * 📐 固定表示サイズ設定
   * @param {number} size - 表示サイズ（px）
   */
  setFixedDisplaySize(size = null) {
    try {
      const displaySize = size || this.config.fixedDisplaySize;
      
      this.canvas.style.width = `${displaySize}px`;
      this.canvas.style.height = `${displaySize}px`;

      this.parent.log(`📐 Canvas表示サイズ設定: ${displaySize}x${displaySize}px`);
    } catch (error) {
      this.parent.error(`❌ 表示サイズ設定エラー: ${error.message}`);
    }
  }

  /**
   * 🔧 WebGLビューポート更新
   */
  updateWebGLViewport() {
    try {
      const gl = this.canvas.getContext('webgl') || this.canvas.getContext('webgl2');
      if (gl) {
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.parent.log(`✅ WebGLビューポート更新: ${this.canvas.width}x${this.canvas.height}`);
      }
    } catch (error) {
      this.parent.error(`⚠️ WebGLビューポート更新警告: ${error.message}`);
    }
  }

  /**
   * 🔄 デフォルトサイズにリセット
   */
  resetToDefault() {
    const defaultSize = this.config.defaultSize;
    const result = this.resizeToSquare(defaultSize);
    
    if (result) {
      this.setFixedDisplaySize();
      this.parent.log(`🔄 デフォルトサイズリセット完了: ${defaultSize}x${defaultSize}`);
    }
    
    return result;
  }
}

// ========================================
// ⚖️ CharacterController - キャラクター制御専門クラス  
// ========================================
class CharacterController {
  constructor(parent) {
    this.parent = parent;
    this.spineRenderer = parent.spineRenderer;
    this.config = parent.config;
  }

  /**
   * ⚖️ キャラクタースケール設定
   * @param {number} scale - スケール値（0.1-3.0）
   */
  setScale(scale) {
    try {
      if (!this.spineRenderer || !this.spineRenderer.skeleton) {
        this.parent.log('⚠️ Spineキャラクターが読み込まれていません');
        return false;
      }

      if (scale < 0.1 || scale > 3.0) {
        this.parent.log(`❌ 無効なスケール値 (0.1-3.0): ${scale}`);
        return false;
      }

      this.spineRenderer.skeleton.scaleX = scale;
      this.spineRenderer.skeleton.scaleY = scale;

      this.parent.log(`⚖️ キャラクタースケール設定: ${scale}`);
      return true;
    } catch (error) {
      this.parent.error(`❌ スケール設定エラー: ${error.message}`);
      return false;
    }
  }

  /**
   * 📍 キャラクター位置設定
   * @param {number} x - X座標
   * @param {number} y - Y座標  
   */
  setPosition(x, y) {
    try {
      if (!this.spineRenderer || !this.spineRenderer.skeleton) {
        this.parent.log('⚠️ Spineキャラクターが読み込まれていません');
        return false;
      }

      this.spineRenderer.skeleton.x = x;
      this.spineRenderer.skeleton.y = y;

      this.parent.log(`📍 キャラクター位置設定: (${x}, ${y})`);
      return true;
    } catch (error) {
      this.parent.error(`❌ 位置設定エラー: ${error.message}`);
      return false;
    }
  }

  /**
   * 🎯 キャラクター中央配置
   */
  centerCharacter() {
    try {
      const canvas = this.parent.canvas;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      const result = this.setPosition(centerX, centerY);
      
      if (result) {
        this.parent.log(`🎯 キャラクター中央配置完了: (${centerX}, ${centerY})`);
      }
      
      return result;
    } catch (error) {
      this.parent.error(`❌ 中央配置エラー: ${error.message}`);
      return false;
    }
  }

  /**
   * 📊 現在のキャラクター状態取得
   * @returns {Object} キャラクター状態
   */
  getCharacterState() {
    if (!this.spineRenderer || !this.spineRenderer.skeleton) {
      return null;
    }

    const skeleton = this.spineRenderer.skeleton;
    return {
      scale: { x: skeleton.scaleX, y: skeleton.scaleY },
      position: { x: skeleton.x, y: skeleton.y },
      bounds: this.getCharacterBounds()
    };
  }

  /**
   * 📏 キャラクター境界取得
   * @returns {Object} 境界情報
   */
  getCharacterBounds() {
    try {
      if (!this.spineRenderer || !this.spineRenderer.skeleton) {
        return null;
      }

      const skeleton = this.spineRenderer.skeleton;
      const offset = new spine.Vector2();
      const size = new spine.Vector2();
      const temp = [];

      skeleton.getBounds(offset, size, temp);

      return {
        offset: { x: offset.x, y: offset.y },
        size: { width: size.x, height: size.y }
      };
    } catch (error) {
      this.parent.error(`❌ 境界取得エラー: ${error.message}`);
      return null;
    }
  }
}

// ========================================
// 🎨 UIController - UI制御専門クラス
// ========================================
class UIController {
  constructor(parent) {
    this.parent = parent;
    this.config = parent.config;
    this.controlPanel = null;
  }

  /**
   * 🎨 操作パネル作成
   * @param {HTMLElement} container - パネルを配置するコンテナ
   */
  createControlPanel(container) {
    try {
      this.controlPanel = document.createElement('div');
      this.controlPanel.className = 'canvas-resize-controller';
      this.controlPanel.innerHTML = this.getControlPanelHTML();

      // コンテナに追加
      if (container) {
        container.appendChild(this.controlPanel);
      } else {
        document.body.appendChild(this.controlPanel);
      }

      // イベントリスナー設定
      this.setupEventListeners();

      this.parent.log('🎨 操作パネル作成完了');
      return this.controlPanel;
    } catch (error) {
      this.parent.error(`❌ パネル作成エラー: ${error.message}`);
      return null;
    }
  }

  /**
   * 🏗️ 操作パネルHTML生成
   * @returns {string} HTML文字列
   */
  getControlPanelHTML() {
    return `
      <div class="control-header">
        <h3>🎯 Canvas統合制御</h3>
        <div class="status-display">
          <span>状態: </span>
          <span id="controller-status">正常</span>
        </div>
      </div>

      <!-- Canvas解像度制御 -->
      <div class="control-section">
        <h4>📐 Canvas解像度</h4>
        <div class="input-group">
          <label>サイズ (px):</label>
          <input type="number" id="canvas-size" value="${this.config.defaultSize}" min="100" max="1200" step="10">
        </div>
        <div class="button-group">
          <button class="btn primary" id="apply-size">適用</button>
          <button class="btn" id="reset-size">リセット</button>
        </div>
      </div>

      <!-- キャラクター制御 -->
      <div class="control-section">
        <h4>⚖️ キャラクター制御</h4>
        <div class="input-group">
          <label>スケール: <span id="scale-value">1.0</span></label>
          <input type="range" id="char-scale" min="0.1" max="3.0" step="0.1" value="1.0">
        </div>
        <div class="input-group">
          <label>X座標:</label>
          <input type="number" id="char-x" value="0" step="10">
        </div>
        <div class="input-group">
          <label>Y座標:</label>
          <input type="number" id="char-y" value="0" step="10">
        </div>
        <div class="button-group">
          <button class="btn success" id="apply-character">適用</button>
          <button class="btn" id="center-character">中央配置</button>
        </div>
      </div>

      <!-- 情報表示 -->
      <div class="control-section">
        <h4>📊 情報</h4>
        <div class="info-display" id="canvas-info">
          Canvas: -<br>
          キャラクター: -
        </div>
      </div>

      <!-- Phase 2で実装予定 -->
      <div class="control-section disabled">
        <h4>🔗 統合BB操作 <small>(Phase 2)</small></h4>
        <div class="button-group">
          <button class="btn" disabled>BB作成</button>
          <button class="btn" disabled>表示切替</button>
        </div>
      </div>
    `;
  }

  /**
   * 🔧 イベントリスナー設定
   */
  setupEventListeners() {
    if (!this.controlPanel) return;

    // Canvas解像度制御
    const applySize = this.controlPanel.querySelector('#apply-size');
    const resetSize = this.controlPanel.querySelector('#reset-size');
    const canvasSizeInput = this.controlPanel.querySelector('#canvas-size');

    applySize?.addEventListener('click', () => {
      const size = parseInt(canvasSizeInput.value);
      const result = this.parent.resizeCanvas(size);
      if (result) {
        this.updateInfo();
      }
    });

    resetSize?.addEventListener('click', () => {
      const result = this.parent.resetCanvas();
      if (result) {
        canvasSizeInput.value = this.config.defaultSize;
        this.updateInfo();
      }
    });

    // キャラクター制御
    const charScale = this.controlPanel.querySelector('#char-scale');
    const scaleValue = this.controlPanel.querySelector('#scale-value');
    const charX = this.controlPanel.querySelector('#char-x');
    const charY = this.controlPanel.querySelector('#char-y');
    const applyChar = this.controlPanel.querySelector('#apply-character');
    const centerChar = this.controlPanel.querySelector('#center-character');

    // スケールスライダー
    charScale?.addEventListener('input', () => {
      scaleValue.textContent = charScale.value;
    });

    // キャラクター設定適用
    applyChar?.addEventListener('click', () => {
      const scale = parseFloat(charScale.value);
      const x = parseInt(charX.value);
      const y = parseInt(charY.value);
      
      this.parent.setCharacterScale(scale);
      this.parent.setCharacterPosition(x, y);
      this.updateInfo();
    });

    // キャラクター中央配置
    centerChar?.addEventListener('click', () => {
      const result = this.parent.centerCharacter();
      if (result) {
        // UI更新
        const state = this.parent.characterController.getCharacterState();
        if (state) {
          charX.value = Math.round(state.position.x);
          charY.value = Math.round(state.position.y);
        }
        this.updateInfo();
      }
    });

    this.parent.log('🔧 イベントリスナー設定完了');
  }

  /**
   * 📊 情報表示更新
   */
  updateInfo() {
    if (!this.controlPanel) return;

    try {
      const infoDisplay = this.controlPanel.querySelector('#canvas-info');
      if (!infoDisplay) return;

      const canvas = this.parent.canvas;
      const charState = this.parent.characterController.getCharacterState();

      let canvasInfo = `Canvas解像度: ${canvas.width}x${canvas.height}px`;
      canvasInfo += `\nCanvas表示: ${canvas.style.width} x ${canvas.style.height}`;

      let charInfo = 'キャラクター: 未読み込み';
      if (charState) {
        charInfo = `スケール: ${charState.scale.x.toFixed(1)}`;
        charInfo += `\n位置: (${Math.round(charState.position.x)}, ${Math.round(charState.position.y)})`;
      }

      infoDisplay.innerHTML = `${canvasInfo}<br><br>${charInfo}`;
    } catch (error) {
      this.parent.error(`⚠️ 情報更新エラー: ${error.message}`);
    }
  }

  /**
   * 📊 ステータス更新
   * @param {string} status - ステータス文字列
   */
  updateStatus(status) {
    if (!this.controlPanel) return;

    const statusElement = this.controlPanel.querySelector('#controller-status');
    if (statusElement) {
      statusElement.textContent = status;
    }
  }

  /**
   * 🗑️ パネル削除
   */
  destroy() {
    if (this.controlPanel && this.controlPanel.parentNode) {
      this.controlPanel.parentNode.removeChild(this.controlPanel);
      this.controlPanel = null;
      this.parent.log('🗑️ 操作パネル削除完了');
    }
  }
}

// ========================================
// 🎯 CanvasResizeController - メインクラス
// ========================================
class CanvasResizeController {
  constructor(options = {}) {
    // 基本設定
    this.canvas = options.canvas;
    this.spineRenderer = options.spineRenderer;
    
    this.config = {
      defaultSize: 400,           // デフォルト解像度（正方形）
      fixedDisplaySize: 350,      // 固定表示サイズ
      enableBB: true,            // BB統合機能（Phase 2で実装）
      transparentBackground: true, // 透明背景
      enableLogging: options.enableLogging !== false,
      ...options.config
    };

    // コールバック
    this.callbacks = {
      onLog: options.onLog || console.log,
      onError: options.onError || console.error,
    };

    // サブシステム初期化
    this.canvasManager = new CanvasManager(this);
    this.characterController = new CharacterController(this);
    this.uiController = new UIController(this);

    // 初期設定適用
    this.initialize();

    this.log('🚀 CanvasResizeController v2.0 初期化完了');
  }

  /**
   * 🚀 初期化処理
   */
  initialize() {
    try {
      if (this.canvas) {
        // 透明背景設定
        if (this.config.transparentBackground) {
          this.canvasManager.setTransparentBackground();
        }
        
        // 固定表示サイズ設定
        this.canvasManager.setFixedDisplaySize();
      }

      this.log('✅ 初期設定適用完了');
    } catch (error) {
      this.error(`❌ 初期化エラー: ${error.message}`);
    }
  }

  // ========================================
  // 🔗 公開API - Canvas制御系
  // ========================================

  /**
   * 📐 Canvas解像度変更（正方形）
   * @param {number} size - サイズ（px）
   * @returns {boolean} 成功/失敗
   */
  resizeCanvas(size) {
    return this.canvasManager.resizeToSquare(size);
  }

  /**
   * 🔄 Canvas デフォルトリセット
   * @returns {boolean} 成功/失敗
   */
  resetCanvas() {
    return this.canvasManager.resetToDefault();
  }

  // ========================================
  // 🔗 公開API - キャラクター制御系  
  // ========================================

  /**
   * ⚖️ キャラクタースケール設定
   * @param {number} scale - スケール値
   * @returns {boolean} 成功/失敗
   */
  setCharacterScale(scale) {
    return this.characterController.setScale(scale);
  }

  /**
   * 📍 キャラクター位置設定
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @returns {boolean} 成功/失敗
   */
  setCharacterPosition(x, y) {
    return this.characterController.setPosition(x, y);
  }

  /**
   * 🎯 キャラクター中央配置
   * @returns {boolean} 成功/失敗
   */
  centerCharacter() {
    return this.characterController.centerCharacter();
  }

  // ========================================
  // 🔗 公開API - UI制御系
  // ========================================

  /**
   * 🎨 操作パネル作成
   * @param {HTMLElement} container - コンテナ要素
   * @returns {HTMLElement} 作成されたパネル
   */
  createControlPanel(container) {
    return this.uiController.createControlPanel(container);
  }

  /**
   * 📊 情報表示更新
   */
  updateInfo() {
    this.uiController.updateInfo();
  }

  // ========================================
  // 🔗 公開API - ユーティリティ
  // ========================================

  /**
   * 📊 現在の状態取得
   * @returns {Object} システム状態
   */
  getState() {
    return {
      canvas: {
        width: this.canvas.width,
        height: this.canvas.height,
        displayWidth: this.canvas.style.width,
        displayHeight: this.canvas.style.height
      },
      character: this.characterController.getCharacterState(),
      config: { ...this.config }
    };
  }

  /**
   * ⚙️ 設定更新
   * @param {Object} newConfig - 新しい設定
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.log('⚙️ 設定更新完了');
  }

  /**
   * 🗑️ リソース削除
   */
  destroy() {
    this.uiController.destroy();
    this.log('🗑️ CanvasResizeController 削除完了');
  }

  // ========================================
  // 🔧 内部メソッド
  // ========================================

  log(message) {
    if (this.config.enableLogging) {
      this.callbacks.onLog(message);
    }
  }

  error(message) {
    this.callbacks.onError(message);
  }
}

// ========================================
// 🌐 モジュールエクスポート（ES6 + Global 両対応）
// ========================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CanvasResizeController;
} else if (typeof define === 'function' && define.amd) {
  define([], function() {
    return CanvasResizeController;
  });
} else {
  window.CanvasResizeController = CanvasResizeController;
}

/**
 * 🎯 Phase 1 実装完了
 * 
 * ✅ 実装済み機能:
 * - Canvas解像度制御（正方形）
 * - キャラクタースケール・位置調整
 * - 基本UI操作パネル
 * - 透明背景対応
 * - 固定表示サイズ
 * 
 * 📋 使用例:
 * const controller = new CanvasResizeController({
 *   canvas: document.getElementById('spine-canvas'),
 *   spineRenderer: spineRenderer
 * });
 * 
 * // 操作パネル作成
 * controller.createControlPanel(document.body);
 * 
 * // Canvas解像度変更
 * controller.resizeCanvas(400);
 * 
 * // キャラクター制御
 * controller.setCharacterScale(1.5);
 * controller.centerCharacter();
 */