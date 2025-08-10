// 🎯 Spine Editor Main - メインアプリケーション統合システム
// すべてのコンポーネントを統合してアプリケーションを管理
// 作成日: 2025-08-10

class SpineEditorApp {
  constructor() {
    this.initialized = false;
    this.api = null;
    this.integration = null;
    this.projectManager = null;
    this.uiManager = null;
    this.spineSystem = null;
    
    console.log('🚀 Spine Editor App コンストラクタ 初期化完了');
  }

  /**
   * アプリケーション初期化
   * @param {Object} spineEditorAPI - Electron APIオブジェクト
   */
  async initialize(spineEditorAPI) {
    if (this.initialized) {
      console.warn('⚠️ Spine Editor App は既に初期化されています');
      return false;
    }
    
    try {
      console.log('🚀 Spine Editor App 本格初期化開始');
      
      this.api = spineEditorAPI;
      
      // 1. コンポーネント初期化
      await this.initializeComponents();
      
      // 2. システム間結合
      await this.connectComponents();
      
      // 3. 初期状態設定
      await this.setupInitialState();
      
      // 4. ユーザーインターフェース有効化
      this.enableUserInterface();
      
      this.initialized = true;
      
      console.log('✅ Spine Editor App 初期化完成');
      return true;
    } catch (error) {
      console.error('❗ Spine Editor App 初期化エラー:', error);
      this.handleInitializationError(error);
      return false;
    }
  }

  /**
   * コンポーネント初期化
   */
  async initializeComponents() {
    console.log('📚 コンポーネント初期化開始');
    
    // 利用可能なコンポーネントの状況確認
    const componentStatus = {
      SpineDesktopIntegration: !!window.SpineDesktopIntegration,
      ProjectManager: !!window.ProjectManager,
      DesktopUIManager: !!window.DesktopUIManager
    };
    
    console.log('🔍 コンポーネント検出状況:', componentStatus);
    
    // 1. Desktop Integration初期化（オプショナル）
    if (window.SpineDesktopIntegration) {
      try {
        console.log('🚀 SpineDesktopIntegration 初期化中...');
        this.integration = new window.SpineDesktopIntegration();
        await this.integration.initialize(this.api);
        console.log('✅ SpineDesktopIntegration 初期化完了');
      } catch (error) {
        console.error('❌ SpineDesktopIntegration 初期化失敗:', error);
        console.error('エラー詳細:', error.stack);
        this.integration = null;
      }
    } else {
      console.log('⚠️ SpineDesktopIntegrationが見つかりません（基本機能は動作します）');
    }
    
    // 2. Project Manager初期化（オプショナル）
    if (window.ProjectManager) {
      try {
        console.log('🚀 ProjectManager 連携中...');
        this.projectManager = window.ProjectManager;
        
        if (typeof this.projectManager.setAPI === 'function') {
          this.projectManager.setAPI(this.api);
          console.log('✅ ProjectManager 連携完了');
        } else {
          console.warn('⚠️ ProjectManager.setAPI メソッドが見つかりません');
          // setAPIメソッドがない場合でも継続
        }
      } catch (error) {
        console.error('❌ ProjectManager 連携失敗:', error);
        console.error('エラー詳細:', error.stack);
        this.projectManager = null;
      }
    } else {
      console.log('⚠️ ProjectManagerが見つかりません（プロジェクト機能は制限されます）');
    }
    
    // 3. UI Manager初期化（オプショナル）
    if (window.DesktopUIManager) {
      try {
        console.log('🚀 DesktopUIManager 連携中...');
        this.uiManager = window.DesktopUIManager;
        console.log('✅ DesktopUIManager 連携完了');
      } catch (error) {
        console.error('❌ DesktopUIManager 連携失敗:', error);
        console.error('エラー詳細:', error.stack);
        this.uiManager = null;
      }
    } else {
      console.log('⚠️ DesktopUIManagerが見つかりません（UI機能は基本モードで動作）');
    }
    
    // 初期化結果の概要
    const initializationResults = {
      integration: !!this.integration,
      projectManager: !!this.projectManager,
      uiManager: !!this.uiManager
    };
    
    console.log('📊 コンポーネント初期化結果:', initializationResults);
    
    // 最低限必要な機能があるかチェック
    if (!this.uiManager && !this.projectManager && !this.integration) {
      console.warn('⚠️ 重要なコンポーネントが全て初期化されていません。基本UIのみ動作します。');
    } else {
      console.log('✅ コンポーネント初期化完了（一部またはすべてのコンポーネントが利用可能）');
    }
  }

  /**
   * システム間結合
   */
  async connectComponents() {
    console.log('🔗 システム間結合開始');
    
    // Project ManagerとUI Managerの結合
    if (this.projectManager && this.uiManager) {
      // プロジェクト変更時のUI更新
      const originalMarkAsModified = this.projectManager.markAsModified.bind(this.projectManager);
      this.projectManager.markAsModified = () => {
        originalMarkAsModified();
        this.uiManager.showStatusMessage('プロジェクトが変更されました', 'info', 2000);
      };
    }
    
    // SpineEditSystemとUI Managerの結合
    if (window.SpineEditSystem && this.uiManager) {
      // 座標情報表示の結合
      window.SpineEditSystem.onCoordinatesChange = (x, y) => {
        this.uiManager.showCoordinates(x, y);
      };
    }
    
    console.log('✅ システム間結合完了');
  }

  /**
   * 初期状態設定
   */
  async setupInitialState() {
    console.log('⚙️ 初期状態設定開始');
    
    // デフォルトプロジェクト読み込み
    if (this.projectManager) {
      // 保存されたプロジェクトがあるか確認
      const lastProject = this.getLastProjectPath();
      if (lastProject) {
        try {
          console.log('📂 前回のプロジェクトを読み込み中:', lastProject);
          // 初期状態では新規プロジェクトを作成
          // 実際のファイル読み込みはユーザー操作で実行
        } catch (error) {
          console.warn('前回のプロジェクト読み込み失敗:', error);
        }
      }
    }
    
    // UI状態初期化
    if (this.uiManager) {
      this.uiManager.showStatusMessage('アプリケーションが準備完了しました', 'success', 3000);
    }
    
    console.log('✅ 初期状態設定完了');
  }

  /**
   * ユーザーインターフェース有効化
   */
  enableUserInterface() {
    // ローディングスクリーンを非表示
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
    
    if (mainContent) {
      mainContent.style.display = 'flex';
      mainContent.classList.add('fade-in');
    }
    
    // UIManagerが利用可能な場合は専用メソッドも使用
    if (this.uiManager && typeof this.uiManager.setLoading === 'function') {
      try {
        this.uiManager.setLoading(false);
      } catch (error) {
        console.warn('UIManager.setLoading エラー:', error);
      }
    }
    
    // イベントリスナー有効化
    this.enableEventListeners();
    
    console.log('✅ ユーザーインターフェース有効化完了');
  }

  /**
   * イベントリスナー有効化
   */
  enableEventListeners() {
    // キャラクターリストイベント
    document.addEventListener('click', (event) => {
      if (event.target.closest('.character-item')) {
        this.handleCharacterSelection(event);
      }
    });
    
    // アセットリストイベント
    document.addEventListener('click', (event) => {
      if (event.target.closest('.asset-item')) {
        this.handleAssetSelection(event);
      }
    });
    
    // ドラッグ&ドロップイベント
    this.setupDragAndDrop();
    
    // グローバルキーボードショートカット
    document.addEventListener('keydown', (event) => {
      this.handleGlobalKeyboardShortcuts(event);
    });
    
    console.log('✅ イベントリスナー有効化完了');
  }

  // =========================
  // イベントハンドラー
  // =========================

  /**
   * キャラクター選択処理
   */
  handleCharacterSelection(event) {
    const characterItem = event.target.closest('.character-item');
    if (!characterItem) return;
    
    const characterId = characterItem.dataset.characterId;
    if (!characterId) return;
    
    // 選択状態更新
    document.querySelectorAll('.character-item').forEach(item => {
      item.classList.remove('active');
    });
    characterItem.classList.add('active');
    
    // キャラクター編集開始
    this.startCharacterEdit(characterId);
    
    console.log('🎭 キャラクター選択:', characterId);
  }

  /**
   * アセット選択処理
   */
  handleAssetSelection(event) {
    const assetItem = event.target.closest('.asset-item');
    if (!assetItem) return;
    
    const assetName = assetItem.querySelector('.asset-name')?.textContent;
    if (assetName) {
      console.log('📄 アセット選択:', assetName);
      
      if (this.uiManager) {
        this.uiManager.showStatusMessage(`アセット選択: ${assetName}`, 'info', 2000);
      }
    }
  }

  /**
   * グローバルキーボードショートカット
   */
  handleGlobalKeyboardShortcuts(event) {
    const { ctrlKey, metaKey, shiftKey, key } = event;
    const cmdOrCtrl = ctrlKey || metaKey;
    
    // Escape: 編集モード終了
    if (key === 'Escape') {
      this.exitEditMode();
    }
    
    // Ctrl/Cmd + E: 編集モードトグル
    if (cmdOrCtrl && key.toLowerCase() === 'e') {
      event.preventDefault();
      this.toggleEditMode();
    }
    
    // Delete: 選択された要素を削除
    if (key === 'Delete' || key === 'Backspace') {
      this.deleteSelectedElement();
    }
  }

  /**
   * ドラッグ&ドロップセットアップ
   */
  setupDragAndDrop() {
    const canvasArea = document.getElementById('spine-canvas-container');
    if (!canvasArea) return;
    
    // ファイルドロップ対応
    canvasArea.addEventListener('dragover', (event) => {
      event.preventDefault();
      canvasArea.classList.add('drag-over');
    });
    
    canvasArea.addEventListener('dragleave', () => {
      canvasArea.classList.remove('drag-over');
    });
    
    canvasArea.addEventListener('drop', (event) => {
      event.preventDefault();
      canvasArea.classList.remove('drag-over');
      
      const files = Array.from(event.dataTransfer.files);
      this.handleFilesDrop(files);
    });
    
    console.log('✅ ドラッグ&ドロップセットアップ完了');
  }

  /**
   * ファイルドロップ処理
   */
  async handleFilesDrop(files) {
    if (files.length === 0) return;
    
    console.log('📁 ファイルドロップ:', files.map(f => f.name));
    
    // Spineプロジェクトファイルの確認
    const spineProjectFiles = files.filter(file => 
      file.name.endsWith('.spine-project') || file.name.endsWith('.json')
    );
    
    if (spineProjectFiles.length > 0) {
      // プロジェクトファイルがある場合は読み込み
      try {
        if (this.projectManager) {
          await this.projectManager.openProject(spineProjectFiles[0].path);
        }
      } catch (error) {
        console.error('プロジェクトファイル読み込みエラー:', error);
      }
      return;
    }
    
    // Spineアセットファイルの確認
    const spineAssets = files.filter(file => 
      file.name.endsWith('.atlas') || 
      file.name.endsWith('.json') || 
      file.name.endsWith('.png')
    );
    
    if (spineAssets.length > 0) {
      console.log('🎆 Spineアセットファイル検出:', spineAssets.map(f => f.name));
      
      if (this.uiManager) {
        this.uiManager.showStatusMessage(
          `Spineアセット${spineAssets.length}件を検出しました`, 
          'info', 
          3000
        );
      }
      
      // アセットインポート処理を実装予定
      this.importSpineAssets(spineAssets);
    }
  }

  // =========================
  // Spine編集機能
  // =========================

  /**
   * キャラクター編集開始
   */
  startCharacterEdit(characterId) {
    if (!this.integration || !window.SpineEditSystem) {
      console.warn('編集システムが初期化されていません');
      return;
    }
    
    // キャラクター要素を取得
    const characterElement = document.getElementById(`${characterId}-canvas`);
    if (!characterElement) {
      console.warn(`キャラクター要素が見つかりません: ${characterId}`);
      return;
    }
    
    // 編集モード開始
    const success = this.integration.enterEditMode(characterElement);
    if (success) {
      this.currentEditingCharacter = characterId;
      
      if (this.uiManager) {
        this.uiManager.showStatusMessage(`${characterId}の編集を開始しました`, 'success', 2000);
      }
    }
  }

  /**
   * 編集モード終了
   */
  exitEditMode() {
    if (!this.currentEditingCharacter || !this.integration) {
      return;
    }
    
    const characterElement = document.getElementById(`${this.currentEditingCharacter}-canvas`);
    if (characterElement) {
      const success = this.integration.exitEditMode(characterElement);
      if (success) {
        this.currentEditingCharacter = null;
        
        if (this.uiManager) {
          this.uiManager.showStatusMessage('編集モードを終了しました', 'info', 2000);
        }
      }
    }
  }

  /**
   * 編集モードトグル
   */
  toggleEditMode() {
    if (this.currentEditingCharacter) {
      this.exitEditMode();
    } else {
      // 選択されたキャラクターがある場合は編集開始
      const selectedCharacter = document.querySelector('.character-item.active');
      if (selectedCharacter) {
        const characterId = selectedCharacter.dataset.characterId;
        if (characterId) {
          this.startCharacterEdit(characterId);
        }
      }
    }
  }

  /**
   * 選択された要素を削除
   */
  deleteSelectedElement() {
    if (!this.currentEditingCharacter) {
      console.log('削除する要素が選択されていません');
      return;
    }
    
    const confirmed = confirm(`${this.currentEditingCharacter}をプロジェクトから削除しますか？`);
    if (confirmed) {
      // キャラクター削除処理を実装予定
      console.log(`🗑️ キャラクター削除: ${this.currentEditingCharacter}`);
      this.removeCharacterFromProject(this.currentEditingCharacter);
    }
  }

  /**
   * プロジェクトからキャラクターを削除
   */
  removeCharacterFromProject(characterId) {
    if (!this.projectManager || !this.projectManager.currentProject) {
      console.warn('プロジェクトが読み込まれていません');
      return;
    }
    
    // プロジェクトからキャラクターを削除
    if (this.projectManager.currentProject.characters[characterId]) {
      delete this.projectManager.currentProject.characters[characterId];
      
      // DOMから要素を削除
      const characterElement = document.getElementById(`${characterId}-canvas`);
      if (characterElement) {
        characterElement.remove();
      }
      
      // プロジェクトを変更状態に
      this.projectManager.markAsModified();
      
      // UI更新
      this.projectManager.updateUI();
      
      // 編集モード終了
      this.currentEditingCharacter = null;
      
      if (this.uiManager) {
        this.uiManager.showStatusMessage(`${characterId}を削除しました`, 'success', 3000);
      }
    }
  }

  // =========================
  // アセット管理
  // =========================

  /**
   * Spineアセットインポート
   */
  async importSpineAssets(assetFiles) {
    console.log('📦 Spineアセットインポート開始:', assetFiles.map(f => f.name));
    
    // アセットの種類別分類
    const assetsByType = {
      atlas: assetFiles.filter(f => f.name.endsWith('.atlas')),
      json: assetFiles.filter(f => f.name.endsWith('.json')),
      png: assetFiles.filter(f => f.name.endsWith('.png'))
    };
    
    // Spineアセットセットを検出
    const characterSets = this.detectSpineCharacterSets(assetsByType);
    
    if (characterSets.length > 0) {
      console.log('🎭 検出されたSpineキャラクター:', characterSets.map(s => s.name));
      
      // キャラクターをプロジェクトに追加
      for (const characterSet of characterSets) {
        await this.addCharacterToProject(characterSet);
      }
      
      if (this.uiManager) {
        this.uiManager.showStatusMessage(
          `${characterSets.length}体のキャラクターをインポートしました`,
          'success',
          3000
        );
      }
    } else {
      if (this.uiManager) {
        this.uiManager.showStatusMessage('有効なSpineアセットセットが見つかりませんでした', 'warning', 3000);
      }
    }
  }

  /**
   * Spineキャラクターセット検出
   */
  detectSpineCharacterSets(assetsByType) {
    const characterSets = [];
    
    // atlasファイルを基準にキャラクターを検出
    assetsByType.atlas.forEach(atlasFile => {
      const baseName = atlasFile.name.replace('.atlas', '');
      
      // 対応するjsonファイルを検索
      const jsonFile = assetsByType.json.find(f => f.name === `${baseName}.json`);
      if (!jsonFile) return;
      
      // 対応するpngファイルを検索
      const pngFiles = assetsByType.png.filter(f => 
        f.name.startsWith(baseName) && f.name.endsWith('.png')
      );
      
      if (pngFiles.length > 0) {
        characterSets.push({
          name: baseName,
          atlas: atlasFile,
          json: jsonFile,
          textures: pngFiles
        });
      }
    });
    
    return characterSets;
  }

  /**
   * キャラクターをプロジェクトに追加
   */
  async addCharacterToProject(characterSet) {
    if (!this.projectManager || !this.projectManager.currentProject) {
      console.warn('プロジェクトが読み込まれていません');
      return;
    }
    
    const characterId = characterSet.name;
    const character = {
      id: characterId,
      name: characterSet.name,
      position: { left: '50%', top: '50%' },
      scale: { x: 1.0, y: 1.0 },
      rotation: 0,
      zIndex: 1000,
      assets: {
        atlas: characterSet.atlas.name,
        json: characterSet.json.name,
        textures: characterSet.textures.map(f => f.name)
      },
      animations: {
        idle: 'idle' // デフォルトアニメーション
      },
      visible: true
    };
    
    // プロジェクトに追加
    this.projectManager.currentProject.characters[characterId] = character;
    
    // プロジェクトを変更状態に
    this.projectManager.markAsModified();
    
    // UI更新
    this.projectManager.updateUI();
    
    console.log(`✅ キャラクター追加: ${characterId}`);
  }

  // =========================
  // ユーティリティメソッド
  // =========================

  /**
   * 前回のプロジェクトパス取得
   */
  getLastProjectPath() {
    try {
      const lastProject = localStorage.getItem('spine-editor-last-project');
      return lastProject || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 初期化エラー処理
   */
  handleInitializationError(error) {
    console.error('🚨 アプリケーション初期化エラー:', error);
    
    // ユーザーにエラーを通知
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
      loadingMessage.textContent = 'アプリケーションの初期化に失敗しました。アプリを再起動してください。';
      loadingMessage.style.color = '#e74c3c';
    }
    
    // フォールバックモードで継続
    setTimeout(() => {
      this.enableUserInterface();
    }, 3000);
  }

  /**
   * アプリケーション終了処理
   */
  shutdown() {
    console.log('🛑 Spine Editor App 終了処理開始');
    
    // コンポーネントのクリーンアップ
    if (this.projectManager) {
      this.projectManager.stopAutosave();
    }
    
    if (this.uiManager) {
      this.uiManager.saveLayout();
    }
    
    // イベントリスナーのクリーンアップ
    if (this.api && this.api.menu) {
      this.api.menu.removeAllListeners();
    }
    
    console.log('✅ Spine Editor App 終了処理完了');
  }
}

// グローバルインスタンス作成
window.SpineEditorApp = new SpineEditorApp();

// アプリケーション終了時のクリーンアップ
window.addEventListener('beforeunload', () => {
  if (window.SpineEditorApp) {
    window.SpineEditorApp.shutdown();
  }
});

console.log('✅ Spine Editor Main - メインアプリケーションモジュール読み込み完了');