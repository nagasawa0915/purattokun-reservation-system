// 🚀 Spine Editor Desktop v3.0 - Main Application
// メインアプリケーションロジック・UIコントロール・状態管理

console.log('🚀 Spine Editor Desktop v3.0 初期化開始');

// ========== グローバル状態管理 ========== //
const AppState = {
    currentProject: null,
    editMode: false,
    selectedCharacter: null,
    hasUnsavedChanges: false,
    
    // UI状態
    ui: {
        projectPanelOpen: true,
        editPanelOpen: false
    }
};

// ========== DOM要素参照 ========== //
let elements = {};

// ========== アプリケーション初期化 ========== //
document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 DOM読み込み完了 - アプリケーション初期化');
    
    initializeElements();
    setupEventListeners();
    setupMenuHandlers();
    updateAppStatus('準備完了');
    
    console.log('✅ Spine Editor Desktop v3.0 初期化完了');
});

// DOM要素参照初期化
function initializeElements() {
    elements = {
        // ヘッダー
        toggleEditMode: document.getElementById('toggle-edit-mode'),
        exportProject: document.getElementById('export-project'),
        
        // プロジェクトパネル
        projectPanel: document.getElementById('project-panel'),
        panelToggle: document.getElementById('panel-toggle'),
        panelContent: document.getElementById('panel-content'),
        
        // プロジェクト状態
        noProjectState: document.getElementById('no-project-state'),
        loadingState: document.getElementById('loading-state'),
        projectInfo: document.getElementById('project-info'),
        
        // プロジェクト情報
        projectName: document.getElementById('project-name'),
        projectPath: document.getElementById('project-path'),
        charactersContainer: document.getElementById('characters-container'),
        
        // ボタン
        openFolderBtn: document.getElementById('open-folder-btn'),
        saveProjectBtn: document.getElementById('save-project-btn'),
        closeProjectBtn: document.getElementById('close-project-btn'),
        
        // メインエディタ
        mainEditor: document.getElementById('main-editor'),
        sceneContainer: document.getElementById('scene-container'),
        backgroundPlaceholder: document.getElementById('background-placeholder'),
        
        // ステータスバー
        appStatus: document.getElementById('app-status'),
        coordinatesDisplay: document.getElementById('coordinates-display'),
        appVersion: document.getElementById('app-version')
    };
    
    console.log('📋 DOM要素参照初期化完了');
}

// イベントリスナー設定
function setupEventListeners() {
    console.log('🔘 イベントリスナー設定中...');
    
    // プロジェクト管理
    elements.openFolderBtn.addEventListener('click', selectSpineFolder);
    elements.saveProjectBtn.addEventListener('click', saveCurrentProject);
    elements.closeProjectBtn.addEventListener('click', closeCurrentProject);
    
    // UI制御
    elements.panelToggle.addEventListener('click', toggleProjectPanel);
    elements.toggleEditMode.addEventListener('click', toggleEditMode);
    elements.exportProject.addEventListener('click', exportCurrentProject);
    
    console.log('✅ イベントリスナー設定完了');
}

// メニューハンドラー設定
function setupMenuHandlers() {
    if (!window.electronAPI) {
        console.warn('⚠️ electronAPI が利用できません（開発環境）');
        return;
    }
    
    // メニューアクション受信
    window.electronAPI.onMenuAction((action) => {
        console.log('📱 メニューアクション受信:', action);
        
        switch (action) {
            case 'new-project':
                newProject();
                break;
            case 'save-project':
                saveCurrentProject();
                break;
            case 'export-project':
                exportCurrentProject();
                break;
            case 'toggle-edit-mode':
                toggleEditMode();
                break;
            case 'undo':
                performUndo();
                break;
            case 'redo':
                performRedo();
                break;
            default:
                console.warn('未知のメニューアクション:', action);
        }
    });
    
    console.log('📱 メニューハンドラー設定完了');
}

// ========== プロジェクト管理機能 ========== //

// Spineフォルダ選択
async function selectSpineFolder() {
    if (!window.electronAPI) {
        alert('Electron環境でのみ利用可能です');
        return;
    }
    
    try {
        updateAppStatus('フォルダ選択中...');
        
        const folderPath = await window.electronAPI.selectFolder();
        
        if (folderPath) {
            console.log('📁 選択されたフォルダ:', folderPath);
            await loadSpineProject(folderPath);
        } else {
            updateAppStatus('フォルダ選択がキャンセルされました');
        }
    } catch (error) {
        console.error('❌ フォルダ選択エラー:', error);
        updateAppStatus('フォルダ選択エラー');
        alert('フォルダ選択に失敗しました: ' + error.message);
    }
}

// Spineプロジェクト読み込み
async function loadSpineProject(folderPath) {
    try {
        console.log('📦 プロジェクト読み込み開始:', folderPath);
        
        // ローディング状態表示
        showLoadingState();
        updateAppStatus('プロジェクトを読み込み中...');
        
        // プロジェクトデータ読み込み
        const projectData = await window.electronAPI.loadSpineProject(folderPath);
        
        if (!projectData || projectData.characters.length === 0) {
            throw new Error('有効なSpineファイルが見つかりませんでした');
        }
        
        // プロジェクト状態更新
        AppState.currentProject = projectData;
        AppState.hasUnsavedChanges = false;
        
        // UI更新
        displayProjectInfo(projectData);
        await loadProjectCharacters(projectData);
        
        // ボタン状態更新
        elements.toggleEditMode.disabled = false;
        elements.exportProject.disabled = false;
        
        updateAppStatus(`プロジェクト読み込み完了: ${projectData.characters.length}個のキャラクター`);
        console.log('✅ プロジェクト読み込み完了');
        
    } catch (error) {
        console.error('❌ プロジェクト読み込みエラー:', error);
        showNoProjectState();
        updateAppStatus('プロジェクト読み込みエラー');
        alert('プロジェクトの読み込みに失敗しました: ' + error.message);
    }
}

// プロジェクト情報表示
function displayProjectInfo(projectData) {
    elements.projectName.textContent = projectData.projectName;
    elements.projectPath.textContent = projectData.folderPath;
    
    // キャラクター一覧表示
    elements.charactersContainer.innerHTML = '';
    
    projectData.characters.forEach((character, index) => {
        const characterItem = document.createElement('div');
        characterItem.className = 'character-item';
        characterItem.dataset.characterIndex = index;
        
        characterItem.innerHTML = `
            <div class="character-name">🎭 ${character.name}</div>
            <div class="character-status">Ready</div>
        `;
        
        characterItem.addEventListener('click', () => {
            selectCharacter(index);
        });
        
        elements.charactersContainer.appendChild(characterItem);
    });
    
    showProjectInfo();
}

// キャラクター選択
function selectCharacter(index) {
    // 既存の選択解除
    elements.charactersContainer.querySelectorAll('.character-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 新しい選択
    const selectedItem = elements.charactersContainer.querySelector(`[data-character-index="${index}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
        AppState.selectedCharacter = index;
        
        console.log(`🎯 キャラクター選択: ${AppState.currentProject.characters[index].name}`);
        updateAppStatus(`選択: ${AppState.currentProject.characters[index].name}`);
    }
}

// ========== UI状態制御 ========== //

function showNoProjectState() {
    elements.noProjectState.style.display = 'block';
    elements.loadingState.style.display = 'none';
    elements.projectInfo.style.display = 'none';
}

function showLoadingState() {
    elements.noProjectState.style.display = 'none';
    elements.loadingState.style.display = 'block';
    elements.projectInfo.style.display = 'none';
}

function showProjectInfo() {
    elements.noProjectState.style.display = 'none';
    elements.loadingState.style.display = 'none';
    elements.projectInfo.style.display = 'block';
}

function toggleProjectPanel() {
    const isOpen = elements.panelContent.style.display !== 'none';
    
    if (isOpen) {
        elements.panelContent.style.display = 'none';
        elements.panelToggle.textContent = '+';
        AppState.ui.projectPanelOpen = false;
    } else {
        elements.panelContent.style.display = 'block';
        elements.panelToggle.textContent = '−';
        AppState.ui.projectPanelOpen = true;
    }
}

// ========== 編集モード制御 ========== //

function toggleEditMode() {
    if (!AppState.currentProject) {
        alert('プロジェクトを開いてください');
        return;
    }
    
    AppState.editMode = !AppState.editMode;
    
    if (AppState.editMode) {
        startEditMode();
    } else {
        stopEditMode();
    }
}

async function startEditMode() {
    try {
        console.log('🎯 編集モード開始');
        updateAppStatus('編集モード開始中...');
        
        // 編集システム読み込み
        await loadEditingSystem();
        
        // UI更新
        elements.toggleEditMode.textContent = '✅ 編集モード';
        elements.toggleEditMode.classList.add('btn-success');
        elements.toggleEditMode.classList.remove('btn-primary');
        
        updateAppStatus('編集モード: 有効');
        console.log('✅ 編集モード開始完了');
        
    } catch (error) {
        console.error('❌ 編集モード開始エラー:', error);
        AppState.editMode = false;
        updateAppStatus('編集モード開始エラー');
        alert('編集モードの開始に失敗しました: ' + error.message);
    }
}

function stopEditMode() {
    console.log('🛑 編集モード終了');
    
    // 編集システムクリーンアップ
    if (window.cleanupEditingSystem) {
        window.cleanupEditingSystem();
    }
    
    // UI更新
    elements.toggleEditMode.textContent = '📝 編集モード';
    elements.toggleEditMode.classList.add('btn-primary');
    elements.toggleEditMode.classList.remove('btn-success');
    
    updateAppStatus('編集モード: 無効');
    console.log('✅ 編集モード終了完了');
}

// 編集システム動的読み込み
async function loadEditingSystem() {
    return new Promise((resolve, reject) => {
        console.log('📦 編集システム読み込み中...');
        
        // CSS読み込み
        if (!document.getElementById('spine-edit-css')) {
            const editCSS = document.createElement('link');
            editCSS.id = 'spine-edit-css';
            editCSS.rel = 'stylesheet';
            editCSS.href = 'spine-edit/spine-positioning-system-explanation.css';
            document.head.appendChild(editCSS);
        }
        
        // JavaScript読み込み
        if (!document.getElementById('spine-edit-js')) {
            const editJS = document.createElement('script');
            editJS.id = 'spine-edit-js';
            editJS.src = 'spine-edit/spine-positioning-system-explanation.js';
            editJS.onload = () => {
                console.log('✅ 編集システム読み込み完了');
                
                // 編集システム初期化
                if (window.initializeSpineEditSystem) {
                    window.initializeSpineEditSystem();
                }
                
                resolve();
            };
            editJS.onerror = () => {
                reject(new Error('編集システムファイルの読み込みに失敗しました'));
            };
            document.head.appendChild(editJS);
        } else {
            // 既に読み込み済み
            resolve();
        }
    });
}

// ========== プロジェクト操作 ========== //

function newProject() {
    if (AppState.hasUnsavedChanges) {
        if (!confirm('未保存の変更があります。新しいプロジェクトを作成しますか？')) {
            return;
        }
    }
    
    console.log('🆕 新規プロジェクト作成');
    closeCurrentProject();
    updateAppStatus('新規プロジェクト');
}

async function saveCurrentProject() {
    if (!AppState.currentProject) {
        alert('保存するプロジェクトがありません');
        return;
    }
    
    try {
        console.log('💾 プロジェクト保存開始');
        updateAppStatus('プロジェクト保存中...');
        
        // プロジェクトデータ構築
        const projectData = {
            ...AppState.currentProject,
            savedAt: new Date().toISOString(),
            version: '3.0.0'
        };
        
        // ファイル保存
        const savedPath = await window.electronAPI.saveProjectData(projectData);
        
        if (savedPath) {
            AppState.hasUnsavedChanges = false;
            updateAppStatus(`プロジェクト保存完了: ${savedPath}`);
            console.log('✅ プロジェクト保存完了:', savedPath);
        }
        
    } catch (error) {
        console.error('❌ プロジェクト保存エラー:', error);
        updateAppStatus('プロジェクト保存エラー');
        alert('プロジェクトの保存に失敗しました: ' + error.message);
    }
}

function closeCurrentProject() {
    if (AppState.hasUnsavedChanges) {
        if (!confirm('未保存の変更があります。プロジェクトを閉じますか？')) {
            return;
        }
    }
    
    console.log('✕ プロジェクトクローズ');
    
    // 編集モード終了
    if (AppState.editMode) {
        stopEditMode();
    }
    
    // 状態リセット
    AppState.currentProject = null;
    AppState.selectedCharacter = null;
    AppState.hasUnsavedChanges = false;
    AppState.editMode = false;
    
    // UI更新
    showNoProjectState();
    elements.toggleEditMode.disabled = true;
    elements.exportProject.disabled = true;
    
    // キャラクター削除
    if (window.clearAllCharacters) {
        window.clearAllCharacters();
    }
    
    updateAppStatus('プロジェクトクローズ');
}

async function exportCurrentProject() {
    if (!AppState.currentProject) {
        alert('エクスポートするプロジェクトがありません');
        return;
    }
    
    try {
        console.log('📦 プロジェクトエクスポート開始');
        updateAppStatus('エクスポート中...');
        
        // エクスポート処理はproject-manager.jsで実装
        if (window.exportProject) {
            await window.exportProject(AppState.currentProject);
        } else {
            throw new Error('エクスポート機能が利用できません');
        }
        
        updateAppStatus('エクスポート完了');
        console.log('✅ プロジェクトエクスポート完了');
        
    } catch (error) {
        console.error('❌ プロジェクトエクスポートエラー:', error);
        updateAppStatus('エクスポートエラー');
        alert('プロジェクトのエクスポートに失敗しました: ' + error.message);
    }
}

// ========== 編集操作 ========== //

function performUndo() {
    console.log('↶ Undo実行');
    if (window.performUndo) {
        window.performUndo();
    }
    updateAppStatus('Undo実行');
}

function performRedo() {
    console.log('↷ Redo実行');
    if (window.performRedo) {
        window.performRedo();
    }
    updateAppStatus('Redo実行');
}

// ========== ユーティリティ ========== //

function updateAppStatus(message) {
    if (elements.appStatus) {
        elements.appStatus.textContent = message;
    }
    console.log('📊 Status:', message);
}

function updateCoordinates(x, y) {
    if (elements.coordinatesDisplay) {
        elements.coordinatesDisplay.textContent = `座標: ${x}, ${y}`;
    }
}

// ========== グローバル関数公開 ========== //

// 他のスクリプトから呼び出し可能な関数
window.AppState = AppState;
window.updateAppStatus = updateAppStatus;
window.updateCoordinates = updateCoordinates;
window.selectCharacter = selectCharacter;

console.log('✅ Main Application 初期化完了');