/**
 * CanvasResizeController UI JavaScript
 * iframe内で動作するUI制御システム
 * postMessage通信で親ページと連携
 */

class CanvasResizeUI {
  constructor() {
    // 状態管理
    this.state = {
      canvasSize: 800,
      scaleX: 1.0,
      scaleY: 1.0,
      positionX: 0,    // 中央座標に修正
      positionY: 0,    // 中央座標に修正
      scaleLock: true,    // デフォルトでロック有効
      scaleRatio: 1.0 / 1.0    // Y/X の初期比率を設定 (1:1の理想比率)
    };

    // 初期化
    this.initializeUI();
    this.setupEventListeners();
    this.setupParentCommunication();
    
    this.log('🎯 CanvasResizeController UI 初期化完了');
  }

  /**
   * UI初期化
   */
  initializeUI() {
    // 初期値設定
    this.updateDisplayValues();
    
    // Canvas サイズ表示を初期化
    this.updateCanvasSizeDisplay();
    
    // スケールロックの初期状態をログに記録
    if (this.state.scaleLock) {
      this.log(`🔒 スケール比率ロック初期化: Y/X = ${this.state.scaleRatio.toFixed(3)} (デフォルト有効)`);
    }
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
    // 不要機能削除により、このセクションは空になりました
    // 将来的に必要なボタンがあればここに追加
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
    
    this.sendToParent('scaleReset', {
      scaleX: this.state.scaleX,
      scaleY: this.state.scaleY
    });
    
    this.log('🔄 スケールを理想的な比率に戻しました（X=1.0, Y=1.0）');
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
    
    this.sendToParent('centerCharacter', {
      x: this.state.positionX,
      y: this.state.positionY
    });
    
    this.log('🎯 キャラクターを中央に配置');
  }

  // resetPositionメソッドは削除（centerCharacterと重複のため）

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
        
      case 'characterSelected':
        this.handleCharacterSelection(data);
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
   * キャラクター選択通知の処理
   */
  handleCharacterSelection(data) {
    const { characterId, canvasId, currentScale, currentPosition } = data;
    
    // 現在のターゲットキャラクターを更新
    this.state.currentCharacter = characterId;
    this.state.currentCanvasId = canvasId;
    
    // UIを選択されたキャラクターの状態に更新
    this.updateUIForSelectedCharacter(data);
    
    this.log(`🎯 ターゲットキャラクター変更: ${characterId} (Canvas: ${canvasId})`);
  }

  /**
   * 選択キャラクターに応じてUIを更新
   */
  updateUIForSelectedCharacter(data) {
    const { currentScale, currentPosition, characterId } = data;
    
    // スケール値を更新
    if (currentScale) {
      this.state.scaleX = currentScale.x;
      this.state.scaleY = currentScale.y;
      
      document.getElementById('character-scale-x').value = currentScale.x;
      document.getElementById('character-scale-y').value = currentScale.y;
      document.getElementById('character-scale-x-input').value = currentScale.x;
      document.getElementById('character-scale-y-input').value = currentScale.y;
    }
    
    // 位置値を更新
    if (currentPosition) {
      this.state.positionX = currentPosition.x;
      this.state.positionY = currentPosition.y;
      
      document.getElementById('character-x').value = currentPosition.x;
      document.getElementById('character-y').value = currentPosition.y;
      document.getElementById('character-x-input').value = currentPosition.x;
      document.getElementById('character-y-input').value = currentPosition.y;
    }
    
    // 表示値を更新
    this.updateDisplayValues();
    
    // 視覚的フィードバック（キャラクター名表示など）
    this.showCharacterIndicator(characterId);
    
    this.log(`🔄 UI状態を${characterId}に同期完了`);
  }

  /**
   * 現在のターゲットキャラクターを表示
   */
  showCharacterIndicator(characterId) {
    // キャラクター表示エリアがあれば更新
    let indicator = document.getElementById('current-character-indicator');
    if (!indicator) {
      // 表示エリアを作成
      indicator = document.createElement('div');
      indicator.id = 'current-character-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(255, 107, 53, 0.9);
        color: white;
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 12px;
        font-weight: bold;
        z-index: 9999;
      `;
      document.body.appendChild(indicator);
    }
    
    // キャラクター名を表示
    const displayName = characterId === 'purattokun' ? '🐱 ぷらっとくん' : '🐭 ねずみちゃん';
    indicator.textContent = `制御中: ${displayName}`;
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