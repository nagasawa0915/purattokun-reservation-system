/**
 * Spine Outliner UI v1.0.0
 * SpineキャラクターアウトライナーUI表示システム
 * 
 * 📋 機能概要:
 * - 左パネルでのSpineキャラクター一覧表示
 * - キャラクター情報表示（サムネイル・名前・アニメーション数）
 * - ドラッグ可能要素の作成
 * - フォルダ選択ボタン・空状態表示
 * - SpineFileDetectorとの完全連携
 * 
 * 🔧 技術制約:
 * - ファイルサイズ: 200行以内（v3.0哲学準拠）
 * - CSS名前空間（.spine-outliner-*）
 * - ドラッグ&ドロップ準備（draggable="true"）
 * - 既存デスクトップアプリとの統合
 * 
 * @author Spine Editor Desktop v2.0
 * @version 1.0.0
 * @date 2025-08-13
 */

import { SpineFileDetector } from './spine-outliner-file-detector.js';

export class SpineOutlinerUI {
  constructor(container) {
    this.container = container;
    this.characters = new Map();
    this.fileDetector = new SpineFileDetector();
    this.dragData = null;
    this.isLoading = false;
    
    this.init();
  }

  /**
   * 初期化処理
   */
  init() {
    this.render([]);
    this.attachEventHandlers();
    console.log('🎭 SpineOutlinerUI initialized');
  }

  /**
   * UI描画メイン処理
   * @param {Array} characters - 表示するキャラクターデータ配列
   */
  render(characters = []) {
    this.characters.clear();
    
    // キャラクターデータをMapに格納
    characters.forEach(char => this.characters.set(char.id, char));
    
    this.container.innerHTML = this.createHTML(characters);
    this.attachItemEventHandlers();
  }

  /**
   * HTML生成
   * @param {Array} characters - キャラクターデータ配列
   * @return {string} 生成されたHTML文字列
   */
  createHTML(characters) {
    const headerHTML = this.createHeaderHTML();
    const contentHTML = characters.length > 0 
      ? this.createCharacterListHTML(characters)
      : this.createEmptyStateHTML();
    
    return `
      <div class="spine-outliner-container">
        ${headerHTML}
        ${contentHTML}
      </div>
    `;
  }

  /**
   * ヘッダー部分のHTML生成
   */
  createHeaderHTML() {
    return `
      <div class="spine-outliner-header">
        <h3 class="spine-outliner-title">🎭 Spineキャラクター</h3>
        <button class="spine-outliner-load-btn" data-action="load-spine-folder">
          📂 フォルダ選択
        </button>
      </div>
    `;
  }

  /**
   * キャラクターリストHTML生成
   * @param {Array} characters - キャラクターデータ配列
   */
  createCharacterListHTML(characters) {
    const characterItems = characters.map(char => this.createCharacterItemHTML(char)).join('');
    
    return `
      <div class="spine-outliner-content">
        <div class="spine-asset-list">
          ${characterItems}
        </div>
      </div>
    `;
  }

  /**
   * 個別キャラクターアイテムHTML生成
   * @param {Object} character - キャラクターデータ
   */
  createCharacterItemHTML(character) {
    const animationCount = character.animations?.length || 0;
    const thumbnailPath = character.thumbnailPath || 'assets/images/purattokunn.png';
    
    return `
      <div class="spine-asset-item" 
           draggable="true" 
           data-character-id="${character.id}"
           data-character-type="spine-character">
        <div class="asset-thumbnail">
          <img src="${thumbnailPath}" 
               alt="${character.name}" 
               width="40" 
               height="40"
               loading="lazy">
        </div>
        <div class="asset-info">
          <div class="asset-name" title="${character.name}">${character.name}</div>
          <div class="asset-details">${animationCount} animations</div>
          <div class="asset-path" title="${character.folderPath}">${this.truncatePath(character.folderPath)}</div>
        </div>
        <div class="asset-actions">
          <button class="asset-preview-btn" 
                  data-action="preview" 
                  data-character-id="${character.id}"
                  title="プレビュー">
            👁️
          </button>
        </div>
      </div>
    `;
  }

  /**
   * 空状態HTML生成
   */
  createEmptyStateHTML() {
    return `
      <div class="spine-outliner-content">
        <div class="spine-outliner-empty">
          <div class="empty-icon">📂</div>
          <div class="empty-title">Spineフォルダを選択してください</div>
          <div class="empty-description">
            フォルダ選択ボタンをクリックして、<br>
            Spineキャラクターを含むフォルダを選択してください。
          </div>
          <button class="spine-outliner-load-btn secondary" data-action="load-spine-folder">
            📂 フォルダを選択
          </button>
        </div>
      </div>
    `;
  }

  /**
   * イベントハンドラー設定（メイン）
   */
  attachEventHandlers() {
    // フォルダ選択ボタンイベント
    this.container.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="load-spine-folder"]')) {
        this.handleLoadSpineFolder();
      } else if (e.target.matches('[data-action="preview"]')) {
        const characterId = e.target.dataset.characterId;
        this.handlePreviewCharacter(characterId);
      }
    });
  }

  /**
   * 個別アイテムイベントハンドラー設定
   */
  attachItemEventHandlers() {
    // ドラッグ開始イベント
    const dragItems = this.container.querySelectorAll('.spine-asset-item[draggable="true"]');
    
    dragItems.forEach(item => {
      item.addEventListener('dragstart', (e) => this.handleDragStart(e));
      item.addEventListener('dragend', (e) => this.handleDragEnd(e));
    });
  }

  /**
   * ドラッグ開始処理
   * @param {DragEvent} e - ドラッグイベント
   */
  handleDragStart(e) {
    const item = e.target.closest('.spine-asset-item');
    if (!item) return;
    
    const characterId = item.dataset.characterId;
    const character = this.characters.get(characterId);
    
    if (character) {
      const dragData = {
        type: 'spine-character',
        characterId: characterId,
        character: character,
        sourceUI: 'spine-outliner'
      };
      
      e.dataTransfer.setData('application/json', JSON.stringify(dragData));
      e.dataTransfer.effectAllowed = 'copy';
      
      // 視覚的フィードバック
      item.style.opacity = '0.7';
      item.classList.add('dragging');
      
      console.log('🎮 Drag started:', character.name);
    }
  }

  /**
   * ドラッグ終了処理
   * @param {DragEvent} e - ドラッグイベント
   */
  handleDragEnd(e) {
    const item = e.target.closest('.spine-asset-item');
    if (item) {
      item.style.opacity = '1';
      item.classList.remove('dragging');
    }
  }

  /**
   * フォルダ選択処理
   */
  async handleLoadSpineFolder() {
    if (this.isLoading) return;
    
    try {
      this.setLoadingState(true);
      
      // AppFileManagerとの統合（既存システム活用）
      if (window.appFileManager && window.appFileManager.homepageFolder) {
        const characters = await this.fileDetector.integrateWithAppFileManager(window.appFileManager);
        this.render(characters);
        
        // 成功メッセージ
        this.showMessage(`✅ ${characters.length}個のSpineキャラクターを検出しました`, 'success');
      } else {
        // 直接フォルダ選択（フォールバック）
        const folderResult = await window.electronAPI.dialog.selectFolder();
        if (folderResult.success && folderResult.path) {
          const characters = await this.fileDetector.scanSpineAssets(folderResult.path);
          this.render(characters);
          
          this.showMessage(`✅ ${characters.length}個のSpineキャラクターを検出しました`, 'success');
        }
      }
      
    } catch (error) {
      console.error('🚨 Spine folder load error:', error);
      this.showMessage(`❌ フォルダの読み込みに失敗しました: ${error.message}`, 'error');
    } finally {
      this.setLoadingState(false);
    }
  }

  /**
   * キャラクタープレビュー処理
   * @param {string} characterId - キャラクターID
   */
  handlePreviewCharacter(characterId) {
    const character = this.characters.get(characterId);
    if (!character) return;
    
    console.log('👁️ Preview character:', character.name);
    
    // プレビューイベントを発行（他のシステムで処理）
    const event = new CustomEvent('spine-character-preview', {
      detail: { character }
    });
    
    document.dispatchEvent(event);
  }

  /**
   * ローディング状態設定
   * @param {boolean} isLoading - ローディング状態
   */
  setLoadingState(isLoading) {
    this.isLoading = isLoading;
    
    const loadBtns = this.container.querySelectorAll('[data-action="load-spine-folder"]');
    loadBtns.forEach(btn => {
      btn.disabled = isLoading;
      btn.textContent = isLoading ? '🔄 読み込み中...' : '📂 フォルダ選択';
    });
  }

  /**
   * メッセージ表示
   * @param {string} message - メッセージ内容
   * @param {string} type - メッセージタイプ（success, error, info）
   */
  showMessage(message, type = 'info') {
    // 簡易メッセージ表示（将来的にトースト通知等に拡張可能）
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // UI通知機能があれば統合
    if (window.uiNotification) {
      window.uiNotification.show(message, type);
    }
  }

  /**
   * パス文字列省略表示
   * @param {string} path - ファイルパス
   * @return {string} 省略されたパス
   */
  truncatePath(path) {
    if (!path || path.length <= 30) return path;
    
    const parts = path.split('/');
    if (parts.length <= 2) return path;
    
    return `.../${parts.slice(-2).join('/')}`;
  }

  /**
   * 公開API: キャラクターデータ更新
   * @param {Array} characters - 新しいキャラクターデータ
   */
  updateCharacters(characters) {
    this.render(characters);
  }

  /**
   * 公開API: 特定キャラクターの選択状態設定
   * @param {string} characterId - キャラクターID
   */
  selectCharacter(characterId) {
    // 既存選択解除
    const selectedItems = this.container.querySelectorAll('.spine-asset-item.selected');
    selectedItems.forEach(item => item.classList.remove('selected'));
    
    // 新しい選択設定
    const targetItem = this.container.querySelector(`[data-character-id="${characterId}"]`);
    if (targetItem) {
      targetItem.classList.add('selected');
    }
  }

  /**
   * 公開API: 現在のキャラクターデータ取得
   * @return {Array} キャラクターデータ配列
   */
  getCharacters() {
    return Array.from(this.characters.values());
  }

  /**
   * 破棄処理
   */
  destroy() {
    this.container.innerHTML = '';
    this.characters.clear();
    this.fileDetector = null;
    console.log('🗑️ SpineOutlinerUI destroyed');
  }
}

// デフォルトエクスポート
export default SpineOutlinerUI;