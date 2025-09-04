/**
 * CanvasResizeController UI JavaScript
 * iframe内で動作するUI制御システム
 * postMessage通信で親ページと連携
 */

class CanvasResizeUI {
  constructor() {
    // 状態管理（localStorage から復元）
    this.state = this.loadState();
    
    // デフォルト状態（他のメソッドで使用）
    this.defaultState = {
      canvasSize: 800,
      scaleX: 1.0,
      scaleY: 1.0,
      positionX: 0,
      positionY: 0,
      scaleLock: true,
      scaleRatio: 1.0
    };

    // SpineRenderer初期化待機フラグ
    this.spineRendererReady = false;
    this.pendingSpineRestore = false;
    
    // 現在のキャラクターID
    this.currentCharacterId = null;

    // 初期化
    this.initializeUI();
    this.setupEventListeners();
    this.setupParentCommunication();
    
    this.log('🎯 CanvasResizeController UI 初期化完了 (設定復元済み)');
  }

  /**
   * ページIDを取得
   */
  getPageId() {
    try {
      return window.parent.location.pathname || 'default';
    } catch (error) {
      return 'default';
    }
  }

  /**
   * ページ固有のキーを生成
   */
  getPageSpecificKey(keyName) {
    try {
      const pageId = this.getPageId();
      const key = `${keyName}-${pageId}`;
      console.log('[CanvasResizeUI] 🔑 生成されたキー:', key, '(pageId:', pageId, ')');
      return key;
    } catch (error) {
      // iframe内からのアクセスでエラーの場合はデフォルト
      const defaultKey = `${keyName}-default`;
      console.log('[CanvasResizeUI] 🔑 デフォルトキー使用:', defaultKey, '(エラー:', error.message, ')');
      return defaultKey;
    }
  }

  /**
   * localStorage から状態を読み込み（ページ固有）
   */
  loadState() {
    const defaultState = {
      canvasSize: 800,
      scaleX: 1.35,
      scaleY: 1.0,
      positionX: 0,
      positionY: 0,
      scaleLock: true,
      scaleRatio: 1.0 / 1.35
    };

    try {
      // UI設定を読み込み
      const uiKey = this.getPageSpecificKey('canvasResizeSettings');
      const uiSaved = localStorage.getItem(uiKey);
      
      // Spine設定を読み込み
      const spineKey = this.getPageSpecificKey('spineSettings');
      const spineSaved = localStorage.getItem(spineKey);
      
      let loadedState = {...defaultState};
      
      if (uiSaved) {
        loadedState = {...loadedState, ...JSON.parse(uiSaved)};
        console.log('[CanvasResizeUI] 💾 UI設定をlocalStorageから復元しました');
      }
      
      if (spineSaved) {
        const spineData = JSON.parse(spineSaved);
        loadedState = {...loadedState, ...spineData};
        console.log('[CanvasResizeUI] 💾 Spine設定をlocalStorageから復元しました');
      }
      
      return loadedState;
    } catch (error) {
      console.log(`[CanvasResizeUI] ⚠️ localStorage読み込みエラー: ${error.message}`);
    }
    
    console.log('[CanvasResizeUI] 🆕 デフォルト設定を使用');
    return {...defaultState};
  }

  /**
   * localStorage に状態を保存（ページ固有）
   */
  saveState() {
    try {
      const uiKey = this.getPageSpecificKey('canvasResizeSettings');
      localStorage.setItem(uiKey, JSON.stringify(this.state));
      this.log('💾 設定をlocalStorageに保存しました');
    } catch (error) {
      this.log(`❌ localStorage保存エラー: ${error.message}`);
    }
  }

  /**
   * Spine設定を保存（キャラクター固有）
   */
  saveSpineSettings(spineData, characterId = null) {
    try {
      // キャラクター固有キーを生成
      let spineKey;
      const finalCharacterId = characterId || this.currentCharacterId;
      
      if (finalCharacterId) {
        const pageId = this.getPageId();
        spineKey = `spineSettings-${pageId}-${finalCharacterId}`;
        console.log('[CanvasResizeUI] 🔑 キャラクター固有キーで保存:', spineKey, 'キャラクターID:', finalCharacterId);
      } else {
        spineKey = this.getPageSpecificKey('spineSettings');
        console.log('[CanvasResizeUI] ⚠️ キャラクターID未設定 - ページ固有キーで保存:', spineKey);
      }
      
      console.log('[CanvasResizeUI] 🔍 保存時の状態:', {
        characterId: characterId,
        currentCharacterId: this.currentCharacterId,
        finalCharacterId: finalCharacterId,
        spineKey: spineKey
      });
      
      const existing = localStorage.getItem(spineKey);
      let savedData = {};
      
      if (existing) {
        savedData = JSON.parse(existing);
        console.log('[CanvasResizeUI] 📂 既存データ:', savedData);
      }
      
      // 新しいデータをマージ
      Object.assign(savedData, spineData);
      console.log('[CanvasResizeUI] 💾 保存データ:', savedData);
      
      localStorage.setItem(spineKey, JSON.stringify(savedData));
      this.log('💾 Spine設定をlocalStorageに保存しました');
    } catch (error) {
      this.log(`❌ Spine設定保存エラー: ${error.message}`);
    }
  }

  /**
   * UI初期化
   */
  initializeUI() {
    // デバッグ：復元された状態をログ出力
    console.log('[CanvasResizeUI] 🔍 復元された状態:', this.state);
    
    // 復元した状態を全UI要素に反映
    this.updateAllUIElements();
    
    // スケールロックの初期状態をログに記録
    if (this.state.scaleLock) {
      this.log(`🔒 スケール比率ロック復元: Y/X = ${this.state.scaleRatio.toFixed(3)}`);
    }
    
    // デバッグ：UI要素の値を確認
    console.log('[CanvasResizeUI] 🔍 UI初期化後の確認:', {
      canvasSize: document.getElementById('canvas-size')?.value,
      scaleX: document.getElementById('character-scale-x')?.value,
      scaleY: document.getElementById('character-scale-y')?.value,
      positionX: document.getElementById('character-x')?.value,
      positionY: document.getElementById('character-y')?.value
    });
  }

  /**
   * イベントリスナー設定
   */
  setupEventListeners() {
    // Canvas解像度変更
    this.setupCanvasSizeEvents();
    
    // キャラクタースケール調整
    this.setupScaleEvents();
    
    // キャラクター位置調整  
    this.setupPositionEvents();
    
    // ボタンイベント
    this.setupButtonEvents();
  }

  /**
   * Canvas サイズ関連イベント
   */
  setupCanvasSizeEvents() {
    const canvasSizeInput = document.getElementById('canvas-size');
    const resizeBtn = document.getElementById('resize-canvas');
    const resetBtn = document.getElementById('reset-canvas');

    // リアルタイム表示更新
    canvasSizeInput.oninput = () => {
      this.state.canvasSize = parseInt(canvasSizeInput.value);
      this.updateCanvasSizeDisplay();
      this.saveState();
      
      // Canvas設定も保存
      this.saveSpineSettings({
        canvasSize: this.state.canvasSize
      }, this.currentCharacterId);
    };

    // 解像度適用
    resizeBtn.onclick = () => {
      this.sendToParent('canvasResize', {
        size: this.state.canvasSize
      });
      this.log(`📐 Canvas解像度変更: ${this.state.canvasSize}x${this.state.canvasSize}`);
    };

    // デフォルトリセット
    resetBtn.onclick = () => {
      this.state.canvasSize = 800;
      canvasSizeInput.value = 800;
      this.updateCanvasSizeDisplay();
      this.saveState();
      this.sendToParent('canvasReset', {});
      this.log('🔄 Canvas解像度をデフォルトにリセット');
    };
  }

  /**
   * スケール関連イベント
   */
  setupScaleEvents() {
    const scaleXInput = document.getElementById('character-scale-x');
    const scaleYInput = document.getElementById('character-scale-y');
    const scaleXInputNumber = document.getElementById('character-scale-x-input');
    const scaleYInputNumber = document.getElementById('character-scale-y-input');
    const scaleLock = document.getElementById('scale-lock');
    const resetScaleBtn = document.getElementById('reset-scale');

    // スライダー → 数値入力 同期
    scaleXInput.oninput = () => {
      scaleXInputNumber.value = scaleXInput.value;
      this.updateScaleRealtime('x');
    };
    scaleYInput.oninput = () => {
      scaleYInputNumber.value = scaleYInput.value;
      this.updateScaleRealtime('y');
    };

    // 数値入力 → スライダー 同期
    scaleXInputNumber.oninput = () => {
      scaleXInput.value = scaleXInputNumber.value;
      this.updateScaleRealtime('x');
    };
    scaleYInputNumber.oninput = () => {
      scaleYInput.value = scaleYInputNumber.value;
      this.updateScaleRealtime('y');
    };

    // スケールロック
    scaleLock.onchange = () => {
      this.state.scaleLock = scaleLock.checked;
      if (this.state.scaleLock) {
        // ロック開始時に現在の比率を記録
        this.state.scaleRatio = this.state.scaleY / this.state.scaleX;
        this.log(`🔒 スケール比率ロック開始: Y/X = ${this.state.scaleRatio.toFixed(3)}`);
      } else {
        this.state.scaleRatio = null;
        this.log('🔓 スケール比率ロック解除');
      }
      this.saveState();
    };

    // スケールリセット
    resetScaleBtn.onclick = () => {
      this.resetScale();
    };
  }

  /**
   * 位置関連イベント
   */
  setupPositionEvents() {
    const positionXInput = document.getElementById('character-x');
    const positionYInput = document.getElementById('character-y');
    const positionXInputNumber = document.getElementById('character-x-input');
    const positionYInputNumber = document.getElementById('character-y-input');
    const centerBtn = document.getElementById('center-character');

    // スライダー → 数値入力 同期
    positionXInput.oninput = () => {
      positionXInputNumber.value = positionXInput.value;
      this.updatePositionRealtime('x');
    };
    positionYInput.oninput = () => {
      positionYInputNumber.value = positionYInput.value;
      this.updatePositionRealtime('y');
    };

    // 数値入力 → スライダー 同期
    positionXInputNumber.oninput = () => {
      positionXInput.value = positionXInputNumber.value;
      this.updatePositionRealtime('x');
    };
    positionYInputNumber.oninput = () => {
      positionYInput.value = positionYInputNumber.value;
      this.updatePositionRealtime('y');
    };

    // 中央配置
    centerBtn.onclick = () => {
      this.centerCharacter();
    };
  }

  /**
   * その他ボタンイベント
   */
  setupButtonEvents() {
    // 全設定リセット
    const resetAllBtn = document.getElementById('reset-all-settings');
    if (resetAllBtn) {
      resetAllBtn.onclick = () => {
        this.resetAllSettings();
      };
    }

    // 保存データクリア
    const clearStorageBtn = document.getElementById('clear-storage');
    if (clearStorageBtn) {
      clearStorageBtn.onclick = () => {
        this.clearStorageData();
      };
    }
  }

  /**
   * リアルタイムスケール更新（比率ロック対応）
   */
  updateScaleRealtime(axis) {
    const scaleXInput = document.getElementById('character-scale-x');
    const scaleYInput = document.getElementById('character-scale-y');
    const scaleXInputNumber = document.getElementById('character-scale-x-input');
    const scaleYInputNumber = document.getElementById('character-scale-y-input');

    // 比率ロック処理
    if (this.state.scaleLock && this.state.scaleRatio !== null) {
      if (axis === 'x') {
        // Xを変更した場合、Yを比率に従って自動調整
        const newX = parseFloat(scaleXInput.value);
        const newY = newX * this.state.scaleRatio;
        scaleYInput.value = newY.toFixed(2);
        scaleYInputNumber.value = newY.toFixed(2);
        this.state.scaleX = newX;
        this.state.scaleY = newY;
        this.log(`🔄 比率保持: X=${newX} → Y=${newY.toFixed(2)} (比率${this.state.scaleRatio.toFixed(3)})`);
      } else if (axis === 'y') {
        // Yを変更した場合、Xを比率に従って自動調整
        const newY = parseFloat(scaleYInput.value);
        const newX = newY / this.state.scaleRatio;
        scaleXInput.value = newX.toFixed(2);
        scaleXInputNumber.value = newX.toFixed(2);
        this.state.scaleX = newX;
        this.state.scaleY = newY;
        this.log(`🔄 比率保持: Y=${newY} → X=${newX.toFixed(2)} (比率${this.state.scaleRatio.toFixed(3)})`);
      }
    } else {
      // 通常の更新
      this.state.scaleX = parseFloat(scaleXInput.value);
      this.state.scaleY = parseFloat(scaleYInput.value);
    }

    // 表示値更新
    this.updateScaleDisplay();

    // UI設定を保存
    this.saveState();
    
    // Spine設定も保存
    this.saveSpineSettings({
      scaleX: this.state.scaleX,
      scaleY: this.state.scaleY
    }, this.currentCharacterId);

    // 親ページに通知
    this.sendToParent('scaleChanged', {
      axis: axis,
      scaleX: this.state.scaleX,
      scaleY: this.state.scaleY
    });
  }

  /**
   * リアルタイム位置更新
   */
  updatePositionRealtime(axis) {
    this.state.positionX = parseInt(document.getElementById('character-x').value);
    this.state.positionY = parseInt(document.getElementById('character-y').value);

    // 表示値更新
    this.updatePositionDisplay();

    // UI設定を保存
    this.saveState();
    
    // Spine設定も保存
    this.saveSpineSettings({
      positionX: this.state.positionX,
      positionY: this.state.positionY
    }, this.currentCharacterId);

    // 親ページに通知
    this.sendToParent('positionChanged', {
      axis: axis,
      x: this.state.positionX,
      y: this.state.positionY
    });
  }

  /**
   * スケールリセット
   */
  resetScale() {
    this.state.scaleX = 1.0;
    this.state.scaleY = 1.0;
    
    document.getElementById('character-scale-x').value = 1.0;
    document.getElementById('character-scale-y').value = 1.0;
    document.getElementById('character-scale-x-input').value = 1.0;
    document.getElementById('character-scale-y-input').value = 1.0;
    
    this.updateScaleDisplay();
    
    // 設定を保存
    this.saveState();
    
    this.sendToParent('scaleReset', {
      scaleX: this.state.scaleX,
      scaleY: this.state.scaleY
    });
    
    this.log('🔄 スケールを1:1比率に戻しました（X=1.0, Y=1.0）');
  }


  /**
   * キャラクター中央配置
   */
  centerCharacter() {
    // 🎯 真の中央座標を計算
    // X軸: -400〜1200の中央 = (1200 + (-400)) / 2 = 400 ✅
    // Y軸: -400〜800の中央 = (800 + (-400)) / 2 = 200
    // ただし、Spine座標系では(0,0)が理想的な中央
    this.state.positionX = 0;   // Canvas中央のX座標
    this.state.positionY = 0;   // Canvas中央のY座標
    
    document.getElementById('character-x').value = this.state.positionX;
    document.getElementById('character-y').value = this.state.positionY;
    document.getElementById('character-x-input').value = this.state.positionX;
    document.getElementById('character-y-input').value = this.state.positionY;
    
    this.updatePositionDisplay();
    
    // 設定を保存
    this.saveState();
    
    this.sendToParent('centerCharacter', {
      x: this.state.positionX,
      y: this.state.positionY
    });
    
    this.log('🎯 キャラクターを中央に配置');
  }

  /**
   * 全設定をデフォルトにリセット
   */
  resetAllSettings() {
    // デフォルト状態に戻す
    this.state = {...this.defaultState};
    
    // UIを更新
    this.updateAllUIElements();
    
    // 設定を保存
    this.saveState();
    
    // 親ページに全ての変更を通知
    this.sendToParent('canvasReset', {});
    this.sendToParent('scaleReset', {
      scaleX: this.state.scaleX,
      scaleY: this.state.scaleY
    });
    this.sendToParent('centerCharacter', {
      x: this.state.positionX,
      y: this.state.positionY
    });
    
    this.log('🔄 全ての設定をデフォルトにリセットしました');
  }

  /**
   * localStorage の保存データをクリア（ページ固有）
   */
  clearStorageData() {
    try {
      const uiKey = this.getPageSpecificKey('canvasResizeSettings');
      const spineKey = this.getPageSpecificKey('spineSettings');
      
      localStorage.removeItem(uiKey);
      localStorage.removeItem(spineKey);
      
      this.log('🗑️ localStorage の保存データをクリアしました');
      this.log('💡 次回リロード時にデフォルト設定が適用されます');
    } catch (error) {
      this.log(`❌ localStorage クリアエラー: ${error.message}`);
    }
  }

  /**
   * Spine設定が存在するかチェック
   */
  hasSpineSettings() {
    try {
      const spineKey = this.getPageSpecificKey('spineSettings');
      const spineData = localStorage.getItem(spineKey);
      return spineData && spineData !== 'null';
    } catch (error) {
      return false;
    }
  }

  /**
   * 親ページにSpine設定復元を指示
   */
  restoreSpineSettings() {
    try {
      // キャラクター固有キーを使用
      let spineKey;
      if (this.currentCharacterId) {
        const pageId = this.getPageId();
        spineKey = `spineSettings-${pageId}-${this.currentCharacterId}`;
        console.log('[CanvasResizeUI] 🔑 キャラクター固有キーで設定復元:', spineKey);
      } else {
        spineKey = this.getPageSpecificKey('spineSettings');
        console.log('[CanvasResizeUI] ⚠️ キャラクターID未設定 - ページ固有キーで復元:', spineKey);
      }
      
      const spineData = localStorage.getItem(spineKey);
      
      if (spineData) {
        const settings = JSON.parse(spineData);
        
        // Canvas解像度の復元
        if (settings.canvasSize !== undefined) {
          this.sendToParent('canvasResize', {
            size: settings.canvasSize
          });
        }
        
        // スケールの復元
        if (settings.scaleX !== undefined && settings.scaleY !== undefined) {
          this.sendToParent('scaleChanged', {
            axis: 'both',
            scaleX: settings.scaleX,
            scaleY: settings.scaleY
          });
        }
        
        // 位置の復元
        if (settings.positionX !== undefined && settings.positionY !== undefined) {
          this.sendToParent('positionChanged', {
            axis: 'both',
            x: settings.positionX,
            y: settings.positionY
          });
        }
        
        this.log('🔄 保存されたSpine設定を親ページに復元指示しました');
      }
    } catch (error) {
      this.log(`❌ Spine設定復元エラー: ${error.message}`);
    }
  }

  /**
   * 全てのUI要素をstateに同期
   */
  updateAllUIElements() {
    console.log('[CanvasResizeUI] 🔧 UI要素更新開始 - state:', this.state);
    
    // Canvas サイズ
    const canvasSizeElem = document.getElementById('canvas-size');
    if (canvasSizeElem) {
      canvasSizeElem.value = this.state.canvasSize;
      console.log('[CanvasResizeUI] ✅ Canvas Size 設定:', this.state.canvasSize);
    }
    
    // スケール
    const scaleXElem = document.getElementById('character-scale-x');
    const scaleYElem = document.getElementById('character-scale-y');
    const scaleXInputElem = document.getElementById('character-scale-x-input');
    const scaleYInputElem = document.getElementById('character-scale-y-input');
    
    if (scaleXElem) scaleXElem.value = this.state.scaleX;
    if (scaleYElem) scaleYElem.value = this.state.scaleY;
    if (scaleXInputElem) scaleXInputElem.value = this.state.scaleX;
    if (scaleYInputElem) scaleYInputElem.value = this.state.scaleY;
    console.log('[CanvasResizeUI] ✅ Scale 設定:', this.state.scaleX, this.state.scaleY);
    
    // 位置
    const posXElem = document.getElementById('character-x');
    const posYElem = document.getElementById('character-y');
    const posXInputElem = document.getElementById('character-x-input');
    const posYInputElem = document.getElementById('character-y-input');
    
    if (posXElem) posXElem.value = this.state.positionX;
    if (posYElem) posYElem.value = this.state.positionY;
    if (posXInputElem) posXInputElem.value = this.state.positionX;
    if (posYInputElem) posYInputElem.value = this.state.positionY;
    console.log('[CanvasResizeUI] ✅ Position 設定:', this.state.positionX, this.state.positionY);
    
    // スケールロック
    const scaleLockCheckbox = document.getElementById('scale-lock');
    if (scaleLockCheckbox) {
      scaleLockCheckbox.checked = this.state.scaleLock;
      console.log('[CanvasResizeUI] ✅ Scale Lock 設定:', this.state.scaleLock);
    }
    
    // 表示値を更新
    this.updateDisplayValues();
    console.log('[CanvasResizeUI] 🔧 UI要素更新完了');
  }

  /**
   * 表示値更新
   */
  updateDisplayValues() {
    this.updateCanvasSizeDisplay();
    this.updateScaleDisplay();
    this.updatePositionDisplay();
  }

  updateCanvasSizeDisplay() {
    const display = document.getElementById('canvas-size-display');
    if (display) {
      display.textContent = `${this.state.canvasSize}x${this.state.canvasSize}`;
    }
  }

  updateScaleDisplay() {
    const scaleXValue = document.getElementById('scale-x-value');
    const scaleYValue = document.getElementById('scale-y-value');
    
    if (scaleXValue) scaleXValue.textContent = this.state.scaleX.toFixed(2);
    if (scaleYValue) scaleYValue.textContent = this.state.scaleY.toFixed(2);
  }

  updatePositionDisplay() {
    const xValue = document.getElementById('x-value');
    const yValue = document.getElementById('y-value');
    
    if (xValue) xValue.textContent = this.state.positionX;
    if (yValue) yValue.textContent = this.state.positionY;
  }

  /**
   * 親ページとの通信
   */
  setupParentCommunication() {
    // 親ページからのメッセージを受信
    window.addEventListener('message', (event) => {
      this.handleParentMessage(event);
    });

    // 初期化完了を親に通知
    this.sendToParent('uiReady', {
      state: this.state
    });

    // Spine設定の復元待機状態を設定
    console.log('[CanvasResizeUI] 🔍 Spine設定存在チェック:', this.hasSpineSettings());
    if (this.hasSpineSettings()) {
      this.pendingSpineRestore = true;
      console.log('[CanvasResizeUI] 📋 Spine設定復元待機状態に設定 - SpineRenderer初期化完了を待機中');
      
      // バックアップ復元を一時的に無効化 - 通知ベースに集中
      // setTimeout(() => {
      //   if (this.pendingSpineRestore) {
      //     console.log('[CanvasResizeUI] ⏰ バックアップ復元実行（3秒タイムアウト）');
      //     this.restoreSpineSettings();
      //     this.pendingSpineRestore = false;
      //   }
      // }, 3000);
    } else {
      console.log('[CanvasResizeUI] 📝 Spine設定が見つかりませんでした - 初回起動またはクリア済み');
    }
  }

  /**
   * 親ページからのメッセージ処理
   */
  handleParentMessage(event) {
    const { type, data } = event.data;

    switch (type) {
      case 'updateUIState':
        this.updateUIFromParent(data);
        break;
        
      case 'showBBFeedback':
        this.showBBVisualFeedback(data);
        break;
        
      case 'logMessage':
        this.receiveLogFromParent(data.message);
        break;
        
      case 'spineRendererReady':
        this.handleSpineRendererReady(data);
        break;
        
      default:
        // 不明なメッセージタイプ
        break;
    }
  }

  /**
   * 親ページからの状態更新
   */
  updateUIFromParent(data) {
    if (data.canvasSize !== undefined) {
      this.state.canvasSize = data.canvasSize;
      document.getElementById('canvas-size').value = data.canvasSize;
      this.updateCanvasSizeDisplay();
    }

    if (data.scaleX !== undefined) {
      this.state.scaleX = data.scaleX;
      document.getElementById('character-scale-x').value = data.scaleX;
      document.getElementById('character-scale-x-input').value = data.scaleX;
    }

    if (data.scaleY !== undefined) {
      this.state.scaleY = data.scaleY;
      document.getElementById('character-scale-y').value = data.scaleY;
      document.getElementById('character-scale-y-input').value = data.scaleY;
    }

    if (data.positionX !== undefined) {
      this.state.positionX = data.positionX;
      document.getElementById('character-x').value = data.positionX;
      document.getElementById('character-x-input').value = data.positionX;
    }

    if (data.positionY !== undefined) {
      this.state.positionY = data.positionY;
      document.getElementById('character-y').value = data.positionY;
      document.getElementById('character-y-input').value = data.positionY;
    }

    // 表示値更新
    this.updateDisplayValues();
    
    // 親ページからの更新も保存
    this.saveState();
    
    this.log('🔄 親ページからUI状態を更新');
  }

  /**
   * BBビジュアルフィードバック表示
   */
  showBBVisualFeedback(data) {
    // UIに視覚的フィードバックを追加
    // 例：一時的にボタンをハイライト
    if (data.type === 'scale') {
      this.highlightScaleControls();
    } else if (data.type === 'position') {
      this.highlightPositionControls();
    }
  }

  highlightScaleControls() {
    const scaleGroup = document.querySelector('.control-group:nth-child(4)'); // スケール調整グループ
    if (scaleGroup) {
      scaleGroup.style.borderColor = '#FF6B35';
      scaleGroup.style.backgroundColor = 'rgba(255, 107, 53, 0.1)';
      
      setTimeout(() => {
        scaleGroup.style.borderColor = '';
        scaleGroup.style.backgroundColor = '';
      }, 2000);
    }
  }

  highlightPositionControls() {
    const positionGroup = document.querySelector('.control-group:nth-child(5)'); // 位置調整グループ
    if (positionGroup) {
      positionGroup.style.borderColor = '#FF6B35';
      positionGroup.style.backgroundColor = 'rgba(255, 107, 53, 0.1)';
      
      setTimeout(() => {
        positionGroup.style.borderColor = '';
        positionGroup.style.backgroundColor = '';
      }, 2000);
    }
  }

  /**
   * 親ページからのログメッセージ受信
   */
  receiveLogFromParent(message) {
    console.log(`[親ページより] ${message}`);
  }

  /**
   * SpineRenderer初期化完了通知の処理
   */
  handleSpineRendererReady(data) {
    console.log('[CanvasResizeUI] 🎉 SpineRenderer初期化完了通知を受信', data);
    this.spineRendererReady = true;
    
    // キャラクターIDを設定
    if (data && data.characterId) {
      this.currentCharacterId = data.characterId;
      console.log('[CanvasResizeUI] 🎭 現在のキャラクターID設定:', this.currentCharacterId);
    }
    
    // 待機中のSpine設定復元を実行
    if (this.pendingSpineRestore) {
      console.log('[CanvasResizeUI] 🔄 待機中のSpine設定復元を実行します');
      this.restoreSpineSettings();
      this.pendingSpineRestore = false;
    }
  }

  /**
   * 親ページにメッセージ送信
   */
  sendToParent(type, data) {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: type,
        data: data,
        timestamp: Date.now(),
        source: 'CanvasResizeUI'
      }, '*');
    }
  }

  /**
   * ログ出力
   */
  log(message) {
    console.log(`[CanvasResizeUI] ${message}`);
    
    // 親ページにもログを送信
    this.sendToParent('uiLog', {
      message: message
    });
  }
}

// ページ読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', () => {
  window.canvasResizeUI = new CanvasResizeUI();
});