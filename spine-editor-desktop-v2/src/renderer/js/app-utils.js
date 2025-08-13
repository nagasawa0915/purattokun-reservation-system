/**
 * Spine Editor Desktop v2.0 - Utilities Module
 * ユーティリティ関数・ステータス管理・UI更新
 */

export class AppUtils {
  constructor(app) {
    this.app = app;
    this.statusUpdateInterval = null;
  }

  /**
   * ステータス更新
   */
  setStatus(message, type = 'info') {
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `status-${type}`;
    }
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  /**
   * エラーモーダル表示
   */
  showErrorModal(title, message) {
    if (this.app.ui) {
      this.app.ui.showModal(title, message, 'error');
    } else {
      alert(`${title}: ${message}`);
    }
  }

  /**
   * 成功メッセージ表示
   */
  showSuccessMessage(message) {
    this.setStatus(message, 'success');
    
    // 3秒後に通常状態に戻す
    setTimeout(() => {
      this.setStatus('Ready');
    }, 3000);
  }

  /**
   * 警告メッセージ表示
   */
  showWarningMessage(message) {
    this.setStatus(message, 'warning');
    
    // 5秒後に通常状態に戻す
    setTimeout(() => {
      this.setStatus('Ready');
    }, 5000);
  }

  /**
   * 軽量ステータス更新開始
   */
  startLightweightStatusUpdate() {
    // 3秒間隔で軽量更新
    this.statusUpdateInterval = setInterval(() => {
      this.updateEssentialStatus();
    }, 3000);
    
    console.log('✅ Lightweight status update started');
  }

  /**
   * 軽量ステータス更新停止
   */
  stopLightweightStatusUpdate() {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
    }
  }

  /**
   * 必要最小限のステータス更新
   */
  updateEssentialStatus() {
    // マウス座標更新
    this.updateMouseCoords();
    
    // メモリ使用量更新
    this.updateMemoryUsage();
    
    // プロジェクト状態更新
    this.updateProjectStatus();
  }

  /**
   * マウス座標更新
   */
  updateMouseCoords() {
    const coordsEl = document.getElementById('mouse-coords');
    if (coordsEl) {
      coordsEl.textContent = `Mouse: (${this.app.debug.mousePos.x}, ${this.app.debug.mousePos.y})`;
    }
  }

  /**
   * メモリ使用量更新
   */
  updateMemoryUsage() {
    // 簡易メモリ使用量（利用可能な場合のみ）
    if (performance.memory) {
      const memoryEl = document.getElementById('memory-usage');
      if (memoryEl) {
        const mb = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        memoryEl.textContent = `Memory: ${mb}MB`;
      }
    }
  }

  /**
   * プロジェクト状態更新
   */
  updateProjectStatus() {
    const statusEl = document.getElementById('project-status-indicator');
    if (statusEl) {
      if (this.app.isProjectModified) {
        statusEl.classList.add('modified');
        statusEl.title = 'Project has unsaved changes';
      } else {
        statusEl.classList.remove('modified');
        statusEl.title = 'Project saved';
      }
    }
  }

  /**
   * プロジェクト情報更新
   */
  updateProjectInfo() {
    const nameEl = document.getElementById('project-name');
    const statusEl = document.getElementById('project-status');
    
    if (nameEl && statusEl) {
      if (this.app.currentProject) {
        nameEl.textContent = this.app.currentProject.name || 'Untitled Project';
        statusEl.className = 'status-indicator active';
        statusEl.title = `Modified: ${this.app.isProjectModified ? 'Yes' : 'No'}`;
      } else {
        nameEl.textContent = 'No Project';
        statusEl.className = 'status-indicator';
        statusEl.title = 'No project loaded';
      }
    }

    // ボタンの有効/無効切り替え
    this.updateButtonStates();
  }

  /**
   * ボタン状態更新
   */
  updateButtonStates() {
    const saveBtn = document.getElementById('btn-save-project');
    const exportBtn = document.getElementById('btn-export-package');
    const closeBtn = document.getElementById('btn-close-project');
    
    const hasProject = !!this.app.currentProject;
    
    if (saveBtn) saveBtn.disabled = !hasProject;
    if (exportBtn) exportBtn.disabled = !hasProject;
    if (closeBtn) closeBtn.disabled = !hasProject;

    // 保存ボタンの表示状態
    if (saveBtn && this.app.isProjectModified) {
      saveBtn.classList.add('modified');
    } else if (saveBtn) {
      saveBtn.classList.remove('modified');
    }
  }

  /**
   * アウトライナーUI更新
   */
  updateOutlinerUI() {
    const characterList = document.getElementById('character-list');
    if (!characterList || !this.app.currentProject?.spineData?.characters) return;
    
    characterList.innerHTML = '';
    
    this.app.currentProject.spineData.characters.forEach((char, index) => {
      const item = this.createCharacterListItem(char, index);
      characterList.appendChild(item);
    });
  }

  /**
   * キャラクターリストアイテム作成
   */
  createCharacterListItem(char, index) {
    const item = document.createElement('div');
    item.className = 'character-item';
    item.dataset.characterIndex = index;
    
    // 選択状態の反映
    if (this.app.selectedCharacter === char) {
      item.classList.add('selected');
    }
    
    item.innerHTML = `
      <div class="character-icon">🦴</div>
      <div class="character-info">
        <div class="character-name">${char.name}</div>
        <div class="character-details">
          <span class="position">x: ${char.x.toFixed(1)}, y: ${char.y.toFixed(1)}</span>
          <span class="scale">scale: ${char.scaleX.toFixed(2)}</span>
        </div>
      </div>
      <div class="character-controls">
        <button class="btn-select" onclick="app.selectCharacter(${index})">Select</button>
        <button class="btn-visibility" onclick="app.toggleCharacterVisibility(${index})" title="Toggle Visibility">👁</button>
      </div>
    `;
    
    return item;
  }

  /**
   * インスペクターパネル更新
   */
  updateInspectorPanel() {
    if (!this.app.spine || !this.app.spine.skeleton) return;
    
    const posX = document.getElementById('pos-x');
    const posY = document.getElementById('pos-y');
    const scaleX = document.getElementById('scale-x');
    const scaleY = document.getElementById('scale-y');
    const rotation = document.getElementById('rotation');
    
    if (posX) posX.value = this.app.spine.skeleton.x.toFixed(2);
    if (posY) posY.value = this.app.spine.skeleton.y.toFixed(2);
    if (scaleX) scaleX.value = this.app.spine.skeleton.scaleX.toFixed(3);
    if (scaleY) scaleY.value = this.app.spine.skeleton.scaleY.toFixed(3);
    if (rotation) rotation.value = this.app.spine.skeleton.rotation?.toFixed(1) || '0.0';
  }

  /**
   * ツールバー更新
   */
  updateToolbar() {
    const tools = ['select', 'move', 'scale', 'rotate'];
    const currentTool = this.app.ui?.currentTool || 'select';
    
    tools.forEach(tool => {
      const btn = document.getElementById(`btn-tool-${tool}`);
      if (btn) {
        btn.classList.toggle('active', tool === currentTool);
      }
    });
  }

  /**
   * ズームレベル更新
   */
  updateZoomLevel(zoomLevel) {
    const zoomEl = document.getElementById('zoom-level');
    if (zoomEl) {
      zoomEl.textContent = `${Math.round(zoomLevel * 100)}%`;
    }
    
    const zoomSlider = document.getElementById('zoom-slider');
    if (zoomSlider) {
      zoomSlider.value = zoomLevel;
    }
  }

  /**
   * ローディング表示
   */
  showLoading(message = 'Loading...') {
    const loadingEl = document.getElementById('loading-overlay');
    const loadingMessage = document.getElementById('loading-message');
    
    if (loadingEl) {
      loadingEl.style.display = 'flex';
    }
    
    if (loadingMessage) {
      loadingMessage.textContent = message;
    }
    
    this.setStatus(message, 'loading');
  }

  /**
   * ローディング非表示
   */
  hideLoading() {
    const loadingEl = document.getElementById('loading-overlay');
    
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
    
    this.setStatus('Ready');
  }

  /**
   * 進捗バー更新
   */
  updateProgress(percent, message = '') {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    if (progressBar) {
      progressBar.style.width = `${percent}%`;
      progressBar.setAttribute('aria-valuenow', percent);
    }
    
    if (progressText && message) {
      progressText.textContent = message;
    }
  }

  /**
   * 通知表示
   */
  showNotification(message, type = 'info', duration = 3000) {
    const notification = this.createNotificationElement(message, type);
    document.body.appendChild(notification);
    
    // アニメーション表示
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // 自動削除
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  }

  /**
   * 通知要素作成
   */
  createNotificationElement(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = this.getNotificationIcon(type);
    
    notification.innerHTML = `
      <div class="notification-icon">${icon}</div>
      <div class="notification-message">${message}</div>
      <button class="notification-close" onclick="this.parentNode.remove()">×</button>
    `;
    
    return notification;
  }

  /**
   * 通知アイコン取得
   */
  getNotificationIcon(type) {
    const icons = {
      'info': 'ℹ️',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌'
    };
    
    return icons[type] || icons['info'];
  }

  /**
   * 確認ダイアログ表示
   */
  showConfirmDialog(message, onConfirm, onCancel = null) {
    if (this.app.ui && this.app.ui.showConfirmModal) {
      this.app.ui.showConfirmModal('Confirm', message, onConfirm, onCancel);
    } else {
      // フォールバック
      const result = confirm(message);
      if (result && onConfirm) {
        onConfirm();
      } else if (!result && onCancel) {
        onCancel();
      }
    }
  }

  /**
   * 文字列の安全なHTML化
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 数値フォーマット
   */
  formatNumber(num, precision = 2) {
    if (typeof num !== 'number' || isNaN(num)) {
      return '0';
    }
    
    return num.toFixed(precision);
  }

  /**
   * ファイルサイズフォーマット
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 時間フォーマット
   */
  formatTime(date) {
    if (!date) return 'Unknown';
    
    const d = new Date(date);
    return d.toLocaleString();
  }

  /**
   * 相対時間フォーマット
   */
  formatRelativeTime(date) {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const target = new Date(date);
    const diff = now.getTime() - target.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    if (minutes > 0) return `${minutes} minutes ago`;
    return 'Just now';
  }

  /**
   * カラーヘックス変換
   */
  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * カラーHEX→RGB変換
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * デバッグ情報表示
   */
  showDebugInfo() {
    const debugInfo = {
      project: this.app.currentProject ? 'Loaded' : 'None',
      modified: this.app.isProjectModified,
      mousePos: this.app.debug.mousePos,
      memory: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB' : 'Unknown'
    };
    
    console.table(debugInfo);
    return debugInfo;
  }

  /**
   * 破棄処理
   */
  destroy() {
    this.stopLightweightStatusUpdate();
    console.log('🔚 App Utils destroyed');
  }
}