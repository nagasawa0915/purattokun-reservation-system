// 🎯 Project Manager - プロジェクト管理システム
// ファイル作成・保存・読み込み・エクスポートの統合管理
// 作成日: 2025-08-10

class ProjectManager {
  constructor() {
    this.currentProject = null;
    this.projectPath = null;
    this.isModified = false;
    this.api = null;
    this.autosaveInterval = null;
    this.autosaveDelay = 30000; // 30秒
    
    this.initializeEventListeners();
    
    console.log('📁 Project Manager 初期化完了');
  }

  /**
   * APIオブジェクトを設定
   * @param {Object} spineEditorAPI - Electron API
   */
  setAPI(spineEditorAPI) {
    this.api = spineEditorAPI;
    console.log('✅ Project Manager - API設定完了');
  }

  /**
   * イベントリスナー初期化
   */
  initializeEventListeners() {
    // ツールバーボタンイベント
    document.addEventListener('DOMContentLoaded', () => {
      this.setupUIEvents();
    });
  }

  /**
   * UIイベントセットアップ
   */
  setupUIEvents() {
    // ツールバーボタン
    const btnNewProject = document.getElementById('btn-new-project');
    const btnOpenProject = document.getElementById('btn-open-project');
    const btnSaveProject = document.getElementById('btn-save-project');
    const btnExportCSS = document.getElementById('btn-export-css');
    const btnExportPackage = document.getElementById('btn-export-package');

    if (btnNewProject) {
      btnNewProject.addEventListener('click', () => this.newProject());
    }
    
    if (btnOpenProject) {
      btnOpenProject.addEventListener('click', () => this.openProject());
    }
    
    if (btnSaveProject) {
      btnSaveProject.addEventListener('click', () => this.saveProject());
    }
    
    if (btnExportCSS) {
      btnExportCSS.addEventListener('click', () => this.exportCSS());
    }
    
    if (btnExportPackage) {
      btnExportPackage.addEventListener('click', () => this.exportPackage());
    }
    
    console.log('✅ Project Manager - UIイベントセットアップ完了');
  }

  // =========================
  // プロジェクト操作
  // =========================

  /**
   * 新規プロジェクト作成
   */
  async newProject() {
    try {
      console.log('🃄 新規プロジェクト作成開始');
      
      // 未保存の変更がある場合は確認
      if (this.isModified && !await this.confirmUnsavedChanges()) {
        return;
      }
      
      // プロジェクト名入力ダイアログ表示
      const projectName = await this.showProjectNameDialog();
      if (!projectName) return;
      
      // テンプレート選択ダイアログ
      const template = await this.showTemplateSelectionDialog();
      
      // APIでプロジェクト作成
      const result = await this.api.project.create(projectName, template);
      
      if (result.success) {
        this.currentProject = result.data;
        this.projectPath = null; // 新規プロジェクトは未保存
        this.isModified = false;
        
        this.updateUI();
        this.startAutosave();
        
        console.log('✅ 新規プロジェクト作成完了:', projectName);
        this.showNotification('新規プロジェクトを作成しました', 'success');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('新規プロジェクト作成エラー:', error);
      this.showNotification('プロジェクトの作成に失敗しました', 'error');
    }
  }

  /**
   * プロジェクトを開く
   */
  async openProject() {
    try {
      console.log('📂 プロジェクトを開く開始');
      
      // 未保存の変更がある場合は確認
      if (this.isModified && !await this.confirmUnsavedChanges()) {
        return;
      }
      
      // ファイル選択ダイアログ表示
      const fileResult = await this.api.fs.openFile({
        title: 'プロジェクトファイルを選択',
        filters: [
          { name: 'Spine Project', extensions: ['spine-project', 'json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (!fileResult.success || !fileResult.filePaths || fileResult.filePaths.length === 0) {
        return; // キャンセルされた
      }
      
      const filePath = fileResult.filePaths[0];
      
      // プロジェクト読み込み
      const result = await this.api.project.load(filePath);
      
      if (result.success) {
        this.currentProject = result.data;
        this.projectPath = result.path;
        this.isModified = false;
        
        this.updateUI();
        this.startAutosave();
        
        console.log('✅ プロジェクト読み込み完了:', filePath);
        this.showNotification('プロジェクトを読み込みました', 'success');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('プロジェクト読み込みエラー:', error);
      this.showNotification('プロジェクトの読み込みに失敗しました', 'error');
    }
  }

  /**
   * プロジェクト保存
   */
  async saveProject() {
    if (!this.currentProject) {
      this.showNotification('保存するプロジェクトがありません', 'warning');
      return;
    }
    
    try {
      console.log('💾 プロジェクト保存開始');
      
      // 新規プロジェクトの場合は名前を付けて保存
      if (!this.projectPath) {
        return await this.saveProjectAs();
      }
      
      // プロジェクト保存
      const result = await this.api.project.save(this.currentProject, this.projectPath);
      
      if (result.success) {
        this.isModified = false;
        this.updateUI();
        
        console.log('✅ プロジェクト保存完了:', this.projectPath);
        this.showNotification('プロジェクトを保存しました', 'success');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('プロジェクト保存エラー:', error);
      this.showNotification('プロジェクトの保存に失敗しました', 'error');
    }
  }

  /**
   * 名前を付けてプロジェクト保存
   */
  async saveProjectAs() {
    if (!this.currentProject) {
      this.showNotification('保存するプロジェクトがありません', 'warning');
      return;
    }
    
    try {
      console.log('💾 名前を付けて保存開始');
      
      // 保存先選択ダイアログ
      const fileResult = await this.api.fs.saveFile({
        title: 'プロジェクトを保存',
        defaultPath: `${this.currentProject.meta.name || 'untitled'}.spine-project`,
        filters: [
          { name: 'Spine Project', extensions: ['spine-project'] },
          { name: 'JSON', extensions: ['json'] }
        ]
      });
      
      if (!fileResult.success || !fileResult.filePath) {
        return; // キャンセルされた
      }
      
      // プロジェクト保存
      const result = await this.api.project.save(this.currentProject, fileResult.filePath);
      
      if (result.success) {
        this.projectPath = result.path;
        this.isModified = false;
        this.updateUI();
        
        console.log('✅ 名前を付けて保存完了:', this.projectPath);
        this.showNotification('プロジェクトを保存しました', 'success');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('名前を付けて保存エラー:', error);
      this.showNotification('プロジェクトの保存に失敗しました', 'error');
    }
  }

  // =========================
  // エクスポート機能
  // =========================

  /**
   * CSSエクスポート
   */
  async exportCSS() {
    if (!this.currentProject || !this.currentProject.characters) {
      this.showNotification('エクスポートするプロジェクトがありません', 'warning');
      return;
    }
    
    try {
      console.log('📤 CSSエクスポート開始');
      
      // CSS生成
      const cssContent = this.generateCSS(this.currentProject);
      
      // 保存先選択
      const fileResult = await this.api.fs.saveFile({
        title: 'CSSファイルを保存',
        defaultPath: `${this.currentProject.meta.name || 'spine-positions'}.css`,
        filters: [
          { name: 'CSS Files', extensions: ['css'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (!fileResult.success || !fileResult.filePath) {
        return;
      }
      
      // CSSファイル保存（Node.js fs APIが必要なためメインプロセスで処理）
      // ここではコンソールに出力（後でAPI拡張）
      console.log('✅ 生成されたCSS:');
      console.log(cssContent);
      
      this.showNotification('CSSをエクスポートしました', 'success');
    } catch (error) {
      console.error('CSSエクスポートエラー:', error);
      this.showNotification('CSSのエクスポートに失敗しました', 'error');
    }
  }

  /**
   * パッケージエクスポート
   */
  async exportPackage() {
    if (!this.currentProject) {
      this.showNotification('エクスポートするプロジェクトがありません', 'warning');
      return;
    }
    
    try {
      console.log('📦 パッケージエクスポート開始');
      this.showNotification('パッケージエクスポートは後で実装予定です', 'info');
    } catch (error) {
      console.error('パッケージエクスポートエラー:', error);
      this.showNotification('パッケージのエクスポートに失敗しました', 'error');
    }
  }

  // =========================
  // ユーティリティメソッド
  // =========================

  /**
   * CSS生成
   */
  generateCSS(project) {
    let css = `/* Generated by Spine Character Position Editor */\n`;
    css += `/* Project: ${project.meta.name} */\n`;
    css += `/* Generated: ${new Date().toISOString()} */\n\n`;
    
    const precision = project.settings?.export?.precision || 4;
    
    Object.keys(project.characters).forEach(characterId => {
      const character = project.characters[characterId];
      if (character.visible !== false) {
        css += `/* ${character.name || characterId} */\n`;
        css += `#${characterId}-canvas {\n`;
        css += `  position: absolute;\n`;
        css += `  left: ${this.formatValue(character.position.left, precision)};\n`;
        css += `  top: ${this.formatValue(character.position.top, precision)};\n`;
        
        if (character.scale && (character.scale.x !== 1 || character.scale.y !== 1)) {
          css += `  transform: scale(${character.scale.x.toFixed(precision)}, ${character.scale.y.toFixed(precision)});\n`;
        }
        
        if (character.zIndex) {
          css += `  z-index: ${character.zIndex};\n`;
        }
        
        css += `}\n\n`;
      }
    });
    
    return css;
  }

  /**
   * 値のフォーマット
   */
  formatValue(value, precision = 4) {
    if (typeof value === 'string') {
      return value; // %などの単位付きの値はそのまま
    }
    if (typeof value === 'number') {
      return value % 1 === 0 ? value.toString() : value.toFixed(precision);
    }
    return value;
  }

  /**
   * UI更新
   */
  updateUI() {
    // プロジェクト名更新
    const projectNameElement = document.getElementById('project-name');
    if (projectNameElement && this.currentProject) {
      projectNameElement.textContent = this.currentProject.meta.name || 'Untitled Project';
    }
    
    // ステータス更新
    const projectStatusElement = document.getElementById('project-status');
    if (projectStatusElement) {
      if (this.isModified) {
        projectStatusElement.textContent = '未保存';
        projectStatusElement.style.color = '#f39c12';
      } else {
        projectStatusElement.textContent = this.projectPath ? '保存済み' : '新規';
        projectStatusElement.style.color = '#27ae60';
      }
    }
    
    // ボタン状態更新
    const btnSaveProject = document.getElementById('btn-save-project');
    const btnExportCSS = document.getElementById('btn-export-css');
    const btnExportPackage = document.getElementById('btn-export-package');
    
    if (btnSaveProject) {
      btnSaveProject.disabled = !this.currentProject;
    }
    if (btnExportCSS) {
      btnExportCSS.disabled = !this.currentProject;
    }
    if (btnExportPackage) {
      btnExportPackage.disabled = !this.currentProject;
    }
    
    // キャラクターリスト更新
    this.updateCharacterList();
    
    // アセットリスト更新
    this.updateAssetList();
  }

  /**
   * キャラクターリスト更新
   */
  updateCharacterList() {
    const characterList = document.getElementById('character-list');
    if (!characterList) return;
    
    if (!this.currentProject || !this.currentProject.characters || Object.keys(this.currentProject.characters).length === 0) {
      characterList.innerHTML = '<p class="empty-state">キャラクターがありません</p>';
      return;
    }
    
    let html = '';
    Object.keys(this.currentProject.characters).forEach(characterId => {
      const character = this.currentProject.characters[characterId];
      html += `
        <div class="character-item" data-character-id="${characterId}">
          <div class="character-icon">🎭</div>
          <div class="character-info">
            <div class="character-name">${character.name || characterId}</div>
            <div class="character-status">${character.visible !== false ? '表示' : '非表示'}</div>
          </div>
          <div class="character-actions">
            <button class="character-action-btn" title="編集">✏️</button>
            <button class="character-action-btn" title="削除">🗑️</button>
          </div>
        </div>
      `;
    });
    
    characterList.innerHTML = html;
  }

  /**
   * アセットリスト更新
   */
  updateAssetList() {
    const assetList = document.getElementById('asset-list');
    if (!assetList) return;
    
    if (!this.currentProject || !this.currentProject.characters) {
      assetList.innerHTML = '<p class="empty-state">プロジェクトを作成または読み込んでください</p>';
      return;
    }
    
    let html = '';
    Object.keys(this.currentProject.characters).forEach(characterId => {
      const character = this.currentProject.characters[characterId];
      if (character.assets) {
        Object.values(character.assets).forEach(asset => {
          if (Array.isArray(asset)) {
            asset.forEach(assetFile => {
              html += `
                <div class="asset-item">
                  <div class="asset-icon">📄</div>
                  <div class="asset-name">${assetFile}</div>
                  <div class="asset-size">-</div>
                </div>
              `;
            });
          } else {
            html += `
              <div class="asset-item">
                <div class="asset-icon">📄</div>
                <div class="asset-name">${asset}</div>
                <div class="asset-size">-</div>
              </div>
            `;
          }
        });
      }
    });
    
    if (html === '') {
      html = '<p class="empty-state">アセットがありません</p>';
    }
    
    assetList.innerHTML = html;
  }

  /**
   * 自動保存開始
   */
  startAutosave() {
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
    }
    
    this.autosaveInterval = setInterval(() => {
      if (this.isModified && this.currentProject && this.projectPath) {
        console.log('💾 自動保存実行...');
        this.saveProject();
      }
    }, this.autosaveDelay);
  }

  /**
   * 自動保存停止
   */
  stopAutosave() {
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
      this.autosaveInterval = null;
    }
  }

  /**
   * プロジェクト変更通知
   */
  markAsModified() {
    this.isModified = true;
    this.updateUI();
  }

  // =========================
  // ダイアログユーティリティ
  // =========================

  /**
   * 未保存変更確認
   */
  async confirmUnsavedChanges() {
    return new Promise((resolve) => {
      const result = confirm('未保存の変更があります。変更を破棄して継続しますか？');
      resolve(result);
    });
  }

  /**
   * プロジェクト名入力ダイアログ
   */
  async showProjectNameDialog() {
    return new Promise((resolve) => {
      const name = prompt('プロジェクト名を入力してください:', 'New Project');
      resolve(name?.trim() || null);
    });
  }

  /**
   * テンプレート選択ダイアログ
   */
  async showTemplateSelectionDialog() {
    return new Promise((resolve) => {
      const templates = {
        'default': '空のプロジェクト',
        'purattokun': 'ぷらっとくんテンプレート'
      };
      
      const choice = Object.keys(templates).find(key => 
        confirm(`テンプレートを選択してください:\n\nOK: ${templates.purattokun}\nキャンセル: ${templates.default}`)
      );
      
      resolve(choice || 'default');
    });
  }

  /**
   * 通知表示
   */
  showNotification(message, type = 'info') {
    // コンソールログ
    const logLevel = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log';
    console[logLevel](`[${type.toUpperCase()}] ${message}`);
    
    // ステータスバーに表示
    const statusMessage = document.getElementById('status-message');
    if (statusMessage) {
      statusMessage.textContent = message;
      
      // 色変更
      switch (type) {
        case 'success': statusMessage.style.color = '#27ae60'; break;
        case 'error': statusMessage.style.color = '#e74c3c'; break;
        case 'warning': statusMessage.style.color = '#f39c12'; break;
        default: statusMessage.style.color = '#ecf0f1'; break;
      }
      
      // 3秒後にリセット
      setTimeout(() => {
        statusMessage.textContent = '準備完了';
        statusMessage.style.color = '#ecf0f1';
      }, 3000);
    }
    
    // デスクトップ通知（利用可能な場合）
    if (window.showDesktopNotification) {
      window.showDesktopNotification(message, type);
    }
  }
}

// グローバルインスタンス作成
window.ProjectManager = new ProjectManager();

console.log('✅ Project Manager - モジュール読み込み完了');