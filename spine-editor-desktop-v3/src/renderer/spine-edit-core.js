// 🎯 Spine Editor Desktop v3.0 - Edit Core Module
// 編集システムコアモジュール（Electron専用）

console.log('🎯 Spine Edit Core Module 初期化開始');

// ========== 編集システムコア ========== //

class SpineEditCore {
    constructor() {
        this.isEditMode = false;
        this.selectedCharacter = null;
        this.editHandles = null;
        this.dragState = {
            isDragging: false,
            startX: 0,
            startY: 0,
            element: null
        };
        
        console.log('🎯 SpineEditCore 初期化完了');
    }

    // ========== 編集モード管理 ========== //
    
    // 編集モード開始
    startEditMode() {
        this.isEditMode = true;
        console.log('📝 編集モード開始');
        
        // 編集UIの初期化
        this.initializeEditUI();
        
        // キャラクター選択イベント設定
        this.setupCharacterSelection();
        
        return true;
    }
    
    // 編集モード終了
    endEditMode() {
        this.isEditMode = false;
        this.selectedCharacter = null;
        
        // 編集ハンドル削除
        if (this.editHandles) {
            this.editHandles.remove();
            this.editHandles = null;
        }
        
        console.log('📝 編集モード終了');
        return true;
    }

    // ========== 編集UI ========== //
    
    // 編集UI初期化
    initializeEditUI() {
        // 編集用CSS追加
        this.addEditStyles();
        
        // 終了ボタン作成
        this.createExitButton();
    }
    
    // 編集用スタイル追加
    addEditStyles() {
        if (document.getElementById('spine-edit-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'spine-edit-styles';
        styles.innerHTML = `
            .spine-character-selected {
                box-shadow: 0 0 10px #667eea !important;
                border: 2px solid #667eea !important;
                border-radius: 8px !important;
            }
            
            .spine-edit-handles {
                position: absolute;
                pointer-events: none;
                z-index: 1000;
            }
            
            .spine-edit-handle {
                position: absolute;
                width: 12px;
                height: 12px;
                background: #667eea;
                border: 2px solid white;
                border-radius: 50%;
                cursor: move;
                pointer-events: all;
                transform: translate(-50%, -50%);
            }
            
            .spine-edit-handle:hover {
                background: #5a6fd8;
                transform: translate(-50%, -50%) scale(1.2);
            }
            
            .spine-exit-edit {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 2000;
                background: #ff6b6b;
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
            
            .spine-exit-edit:hover {
                background: #ff5252;
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    // 終了ボタン作成
    createExitButton() {
        if (document.getElementById('spine-exit-edit-btn')) return;
        
        const exitBtn = document.createElement('button');
        exitBtn.id = 'spine-exit-edit-btn';
        exitBtn.className = 'spine-exit-edit';
        exitBtn.innerHTML = '✕ 編集終了';
        
        exitBtn.addEventListener('click', () => {
            this.endEditMode();
            // Electronアプリの編集モード終了通知
            if (window.electronAPI) {
                window.electronAPI.log('info', '編集モード終了');
            }
        });
        
        document.body.appendChild(exitBtn);
    }

    // ========== キャラクター選択 ========== //
    
    // キャラクター選択イベント設定
    setupCharacterSelection() {
        const characters = document.querySelectorAll('[data-spine-character="true"]');
        
        characters.forEach(character => {
            character.style.cursor = 'pointer';
            
            character.addEventListener('click', (event) => {
                event.stopPropagation();
                this.selectCharacter(character);
            });
        });
    }
    
    // キャラクター選択
    selectCharacter(character) {
        // 既存選択をクリア
        document.querySelectorAll('.spine-character-selected').forEach(el => {
            el.classList.remove('spine-character-selected');
        });
        
        // 新しい選択
        character.classList.add('spine-character-selected');
        this.selectedCharacter = character;
        
        // 編集ハンドル作成
        this.createEditHandles(character);
        
        const characterName = character.getAttribute('data-character-name');
        console.log('🎯 キャラクター選択:', characterName);
        
        // Electronアプリに通知
        if (window.electronAPI) {
            window.electronAPI.log('info', `キャラクター選択: ${characterName}`);
        }
    }

    // ========== 編集ハンドル ========== //
    
    // 編集ハンドル作成
    createEditHandles(character) {
        // 既存ハンドル削除
        if (this.editHandles) {
            this.editHandles.remove();
        }
        
        const rect = character.getBoundingClientRect();
        const container = document.getElementById('scene-container');
        const containerRect = container.getBoundingClientRect();
        
        // ハンドルコンテナ作成
        this.editHandles = document.createElement('div');
        this.editHandles.className = 'spine-edit-handles';
        
        // コンテナ相対位置
        const relativeLeft = rect.left - containerRect.left;
        const relativeTop = rect.top - containerRect.top;
        
        Object.assign(this.editHandles.style, {
            left: `${relativeLeft}px`,
            top: `${relativeTop}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`
        });
        
        // 中央ハンドル（ドラッグ用）
        const centerHandle = this.createHandle('center', 50, 50);
        this.editHandles.appendChild(centerHandle);
        
        // コーナーハンドル
        const corners = [
            { name: 'nw', x: 0, y: 0 },
            { name: 'ne', x: 100, y: 0 },
            { name: 'sw', x: 0, y: 100 },
            { name: 'se', x: 100, y: 100 }
        ];
        
        corners.forEach(corner => {
            const handle = this.createHandle(corner.name, corner.x, corner.y);
            this.editHandles.appendChild(handle);
        });
        
        container.appendChild(this.editHandles);
    }
    
    // ハンドル要素作成
    createHandle(type, x, y) {
        const handle = document.createElement('div');
        handle.className = 'spine-edit-handle';
        handle.setAttribute('data-handle-type', type);
        
        Object.assign(handle.style, {
            left: `${x}%`,
            top: `${y}%`
        });
        
        // ドラッグイベント設定
        this.setupHandleDrag(handle, type);
        
        return handle;
    }
    
    // ハンドルドラッグ設定
    setupHandleDrag(handle, type) {
        handle.addEventListener('mousedown', (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            this.dragState.isDragging = true;
            this.dragState.startX = event.clientX;
            this.dragState.startY = event.clientY;
            this.dragState.element = this.selectedCharacter;
            this.dragState.handleType = type;
            
            document.addEventListener('mousemove', this.handleDrag.bind(this));
            document.addEventListener('mouseup', this.handleDragEnd.bind(this));
        });
    }
    
    // ドラッグ処理
    handleDrag(event) {
        if (!this.dragState.isDragging || !this.dragState.element) return;
        
        const deltaX = event.clientX - this.dragState.startX;
        const deltaY = event.clientY - this.dragState.startY;
        
        if (this.dragState.handleType === 'center') {
            // 位置移動
            this.moveCharacter(deltaX, deltaY);
        }
        
        // ハンドル位置更新
        this.updateHandlePosition();
    }
    
    // ドラッグ終了
    handleDragEnd() {
        this.dragState.isDragging = false;
        this.dragState.element = null;
        
        document.removeEventListener('mousemove', this.handleDrag.bind(this));
        document.removeEventListener('mouseup', this.handleDragEnd.bind(this));
        
        console.log('📐 キャラクター移動完了');
    }
    
    // キャラクター移動
    moveCharacter(deltaX, deltaY) {
        const character = this.dragState.element;
        const container = document.getElementById('scene-container');
        const containerRect = container.getBoundingClientRect();
        
        const currentLeft = parseFloat(character.style.left) || 0;
        const currentTop = parseFloat(character.style.top) || 0;
        
        const newLeft = currentLeft + (deltaX / containerRect.width) * 100;
        const newTop = currentTop + (deltaY / containerRect.height) * 100;
        
        // 境界チェック
        const clampedLeft = Math.max(0, Math.min(100, newLeft));
        const clampedTop = Math.max(0, Math.min(100, newTop));
        
        character.style.left = `${clampedLeft}%`;
        character.style.top = `${clampedTop}%`;
        
        // ドラッグ開始点更新
        this.dragState.startX = event.clientX;
        this.dragState.startY = event.clientY;
    }
    
    // ハンドル位置更新
    updateHandlePosition() {
        if (!this.editHandles || !this.selectedCharacter) return;
        
        const rect = this.selectedCharacter.getBoundingClientRect();
        const container = document.getElementById('scene-container');
        const containerRect = container.getBoundingClientRect();
        
        const relativeLeft = rect.left - containerRect.left;
        const relativeTop = rect.top - containerRect.top;
        
        Object.assign(this.editHandles.style, {
            left: `${relativeLeft}px`,
            top: `${relativeTop}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`
        });
    }

    // ========== 座標取得・保存 ========== //
    
    // 現在の座標取得
    getCurrentPositions() {
        const characters = document.querySelectorAll('[data-spine-character="true"]');
        const positions = {};
        
        characters.forEach(character => {
            const name = character.getAttribute('data-character-name');
            const left = parseFloat(character.style.left) || 0;
            const top = parseFloat(character.style.top) || 0;
            
            positions[name] = { x: left, y: top };
        });
        
        return positions;
    }
    
    // 座標データ保存
    savePositions() {
        const positions = this.getCurrentPositions();
        
        // Electronアプリに保存要求
        if (window.electronAPI) {
            window.electronAPI.log('info', '座標データ保存', positions);
            
            // プロジェクトデータ更新
            if (window.projectManager && window.projectManager.currentProject) {
                Object.keys(positions).forEach((name, index) => {
                    const pos = positions[name];
                    window.updateCharacterData(index, {
                        position: { x: pos.x, y: pos.y }
                    });
                });
            }
        }
        
        console.log('💾 座標データ保存:', positions);
        return positions;
    }
}

// ========== グローバル初期化 ========== //

// SpineEditCoreインスタンス作成
const spineEditCore = new SpineEditCore();

// グローバル関数公開
window.spineEditCore = spineEditCore;
window.startEditMode = () => spineEditCore.startEditMode();
window.endEditMode = () => spineEditCore.endEditMode();
window.saveCharacterPositions = () => spineEditCore.savePositions();

console.log('✅ Spine Edit Core Module 初期化完了');