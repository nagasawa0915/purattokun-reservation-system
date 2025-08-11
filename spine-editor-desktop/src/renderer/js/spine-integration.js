// 🎯 Spine Editor Desktop - Spine Integration Module
// 既存spine-edit-coreシステムとの統合

console.log('🔗 Spine Integration Module 読み込み開始');

// ========== 既存システム統合管理 ========== //
class SpineIntegrationManager {
    constructor(app) {
        this.app = app; // SpineEditorApp インスタンス
        this.spineInstances = new Map(); // characterId -> spineInstance
        this.canvasElements = new Map(); // characterId -> canvasElement
        this.editSystems = new Map(); // characterId -> editSystemInstance
        
        this.previewContainer = null;
        this.isSpineLoaded = false;
        
        console.log('✅ SpineIntegrationManager 初期化完了');
    }

    // Spine WebGL ライブラリ読み込み
    async loadSpineWebGL() {
        if (this.isSpineLoaded) return true;
        
        console.log('📦 Spine WebGL ライブラリ読み込み開始');
        
        try {
            // 既存システムのSpine WebGLファイルをコピー
            const spineLibPath = '../../../spine-edit-core.js';
            
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = spineLibPath;
                script.onload = () => {
                    console.log('✅ spine-edit-core.js 読み込み完了');
                    this.isSpineLoaded = true;
                    resolve(true);
                };
                script.onerror = () => {
                    console.warn('⚠️ spine-edit-core.js 読み込み失敗 - 代替方法を試行');
                    // 代替: 直接コピーした内容を読み込み
                    this.loadSpineEditCoreDirect().then(resolve).catch(reject);
                };
                document.head.appendChild(script);
            });
            
        } catch (error) {
            console.error('❌ Spine WebGL 読み込みエラー:', error);
            return false;
        }
    }

    // spine-edit-coreの直接読み込み（代替方法）
    async loadSpineEditCoreDirect() {
        console.log('🔄 spine-edit-core 直接読み込み');
        
        try {
            if (typeof electronAPI !== 'undefined') {
                const result = await electronAPI.readFile('/mnt/d/クラウドパートナーHP/spine-edit-core.js');
                if (result.success) {
                    // コードを直接評価
                    eval(result.content);
                    console.log('✅ spine-edit-core 直接読み込み成功');
                    this.isSpineLoaded = true;
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('❌ spine-edit-core 直接読み込みエラー:', error);
            return false;
        }
    }

    // プレビューコンテナ初期化
    initializePreviewContainer() {
        this.previewContainer = document.getElementById('preview-canvas');
        if (!this.previewContainer) {
            console.error('❌ プレビューコンテナが見つかりません');
            return false;
        }
        
        // プレースホルダーを非表示
        const placeholder = this.previewContainer.querySelector('.canvas-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        // Spineキャンバス用コンテナ作成
        const spineContainer = document.createElement('div');
        spineContainer.id = 'spine-container';
        spineContainer.style.cssText = `
            position: relative;
            width: 100%;
            height: 100%;
            background: transparent;
        `;
        
        this.previewContainer.appendChild(spineContainer);
        
        console.log('✅ プレビューコンテナ初期化完了');
        return true;
    }

    // キャラクターのSpineインスタンス作成
    async createSpineInstance(characterId) {
        const character = this.app.state.characters.get(characterId);
        if (!character) {
            console.error(`❌ キャラクター ${characterId} が見つかりません`);
            return null;
        }
        
        console.log(`🎭 ${characterId} Spineインスタンス作成開始`);
        
        try {
            // Spine WebGL確認
            if (!this.isSpineLoaded) {
                await this.loadSpineWebGL();
            }
            
            // キャンバス要素作成
            const canvas = document.createElement('canvas');
            canvas.id = `spine-canvas-${characterId}`;
            canvas.style.cssText = `
                position: absolute;
                left: ${character.x || 18}vw;
                top: ${character.y || 49}vh;
                width: ${(character.scale || 0.55) * 200}px;
                height: ${(character.scale || 0.55) * 200}px;
                transform: translate(-50%, -50%);
                z-index: 1000;
                pointer-events: auto;
            `;
            
            // プレビューコンテナに追加
            const spineContainer = document.getElementById('spine-container');
            if (spineContainer) {
                spineContainer.appendChild(canvas);
                this.canvasElements.set(characterId, canvas);
            }
            
            // Spineアセット読み込み（VFS使用）
            const spineData = await this.loadSpineAssets(character);
            if (!spineData) {
                console.error(`❌ ${characterId} アセット読み込み失敗`);
                return null;
            }
            
            // SpineEditSystemとの統合
            await this.integrateWithSpineEditSystem(characterId, canvas, spineData);
            
            console.log(`✅ ${characterId} Spineインスタンス作成完了`);
            return true;
            
        } catch (error) {
            console.error(`❌ ${characterId} Spineインスタンス作成エラー:`, error);
            return null;
        }
    }

    // Spineアセット読み込み（VFS使用）
    async loadSpineAssets(character) {
        console.log(`📁 ${character.id} アセット読み込み開始`);
        
        try {
            const assets = {};
            
            // JSONファイル読み込み
            if (character.spineFiles.json) {
                const jsonResult = await vfsAPI.loadFileAsBlob(character.spineFiles.json);
                if (jsonResult.success) {
                    assets.jsonURL = jsonResult.blobURL;
                    console.log(`✅ ${character.id} JSON読み込み完了`);
                }
            }
            
            // Atlasファイル読み込み
            if (character.spineFiles.atlas) {
                const atlasResult = await vfsAPI.loadFileAsBlob(character.spineFiles.atlas);
                if (atlasResult.success) {
                    assets.atlasURL = atlasResult.blobURL;
                    console.log(`✅ ${character.id} Atlas読み込み完了`);
                }
            }
            
            // 画像ファイル読み込み
            assets.imageURLs = [];
            for (const imagePath of character.spineFiles.images) {
                const imageResult = await vfsAPI.loadFileAsBlob(imagePath);
                if (imageResult.success) {
                    assets.imageURLs.push(imageResult.blobURL);
                }
            }
            
            console.log(`✅ ${character.id} 全アセット読み込み完了:`, assets);
            return assets;
            
        } catch (error) {
            console.error(`❌ ${character.id} アセット読み込みエラー:`, error);
            return null;
        }
    }

    // SpineEditSystemとの統合
    async integrateWithSpineEditSystem(characterId, canvas, spineData) {
        console.log(`🔗 ${characterId} SpineEditSystem統合開始`);
        
        try {
            // SpineEditSystemが利用可能かチェック
            if (typeof SpineEditSystem === 'undefined') {
                console.warn('⚠️ SpineEditSystemが利用できません - 基本表示モードで動作');
                return this.createBasicSpineDisplay(characterId, canvas, spineData);
            }
            
            // SpineEditSystemとの統合
            const editSystemInstance = {
                characterId: characterId,
                canvas: canvas,
                spineData: spineData,
                isActive: false
            };
            
            // 編集システム初期化（選択時に実行）
            editSystemInstance.initialize = () => {
                console.log(`🎯 ${characterId} 編集システム初期化`);
                
                // SpineEditSystemの基本状態設定
                SpineEditSystem.baseLayer.targetElement = canvas;
                SpineEditSystem.baseLayer.initialPosition = {
                    left: canvas.style.left,
                    top: canvas.style.top,
                    width: canvas.style.width,
                    height: canvas.style.height
                };
                
                // 編集モード有効化
                SpineEditSystem.controlLayer.isEditMode = true;
                editSystemInstance.isActive = true;
                
                // プロパティ変更監視
                this.bindPropertyUpdates(characterId, editSystemInstance);
            };
            
            // 編集終了
            editSystemInstance.finalize = () => {
                console.log(`🔒 ${characterId} 編集システム終了`);
                SpineEditSystem.controlLayer.isEditMode = false;
                editSystemInstance.isActive = false;
            };
            
            this.editSystems.set(characterId, editSystemInstance);
            
            console.log(`✅ ${characterId} SpineEditSystem統合完了`);
            return editSystemInstance;
            
        } catch (error) {
            console.error(`❌ ${characterId} SpineEditSystem統合エラー:`, error);
            return null;
        }
    }

    // 基本Spine表示（SpineEditSystemなし）
    async createBasicSpineDisplay(characterId, canvas, spineData) {
        console.log(`🎨 ${characterId} 基本Spine表示作成`);
        
        // 簡易プレースホルダー表示
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#0d47a1';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(characterId, canvas.width/2, canvas.height/2);
        }
        
        // 基本操作イベント
        this.addBasicInteractionEvents(characterId, canvas);
        
        return { characterId, canvas, mode: 'basic' };
    }

    // 基本インタラクションイベント
    addBasicInteractionEvents(characterId, canvas) {
        let isDragging = false;
        let dragStart = { x: 0, y: 0 };
        let elementStart = { x: 0, y: 0 };
        
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // 左クリック
                isDragging = true;
                dragStart = { x: e.clientX, y: e.clientY };
                
                // 現在の位置を取得
                const rect = canvas.getBoundingClientRect();
                const containerRect = canvas.parentElement.getBoundingClientRect();
                elementStart = {
                    x: rect.left - containerRect.left,
                    y: rect.top - containerRect.top
                };
                
                // キャラクター選択
                this.app.selectCharacter(characterId);
                
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - dragStart.x;
                const deltaY = e.clientY - dragStart.y;
                
                const newX = elementStart.x + deltaX;
                const newY = elementStart.y + deltaY;
                
                // 要素位置更新
                canvas.style.left = newX + 'px';
                canvas.style.top = newY + 'px';
                
                // キャラクターデータ更新（vw/vh変換）
                const container = canvas.parentElement;
                const xVw = (newX / container.offsetWidth) * 100;
                const yVh = (newY / container.offsetHeight) * 100;
                
                this.updateCharacterPosition(characterId, xVw, yVh);
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // 右クリックメニュー（後で実装）
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            console.log(`🖱️ ${characterId} 右クリック`);
        });
    }

    // キャラクター位置更新
    updateCharacterPosition(characterId, x, y) {
        const character = this.app.state.characters.get(characterId);
        if (character) {
            character.x = x;
            character.y = y;
            
            // プロパティパネル更新
            if (this.app.state.selectedCharacter === characterId) {
                this.app.updateProperties();
            }
            
            console.log(`📐 ${characterId} 位置更新: (${x.toFixed(1)}, ${y.toFixed(1)})`);
        }
    }

    // プロパティ変更の統合
    bindPropertyUpdates(characterId, editSystemInstance) {
        // プロパティパネルからの変更をSpineEditSystemに反映
        const originalUpdateProperty = this.app.updateCharacterProperty.bind(this.app);
        
        this.app.updateCharacterProperty = (property, value) => {
            // 元の処理実行
            originalUpdateProperty(property, value);
            
            // SpineEditSystemに反映（選択中のキャラクターの場合）
            if (this.app.state.selectedCharacter === characterId && editSystemInstance.isActive) {
                this.syncToSpineEditSystem(characterId, property, value);
            }
        };
    }

    // SpineEditSystemへの同期
    syncToSpineEditSystem(characterId, property, value) {
        const canvas = this.canvasElements.get(characterId);
        if (!canvas) return;
        
        switch (property) {
            case 'x':
                canvas.style.left = value + 'vw';
                break;
            case 'y':
                canvas.style.top = value + 'vh';
                break;
            case 'scale':
                const size = value * 200;
                canvas.style.width = size + 'px';
                canvas.style.height = size + 'px';
                break;
            case 'opacity':
                canvas.style.opacity = value;
                break;
        }
        
        console.log(`🔄 ${characterId}.${property} = ${value} SpineEditSystemに同期`);
    }

    // キャラクター選択時の処理
    onCharacterSelected(characterId) {
        console.log(`🎯 キャラクター選択: ${characterId}`);
        
        // 既存の編集システムを無効化
        for (const [id, editSystem] of this.editSystems) {
            if (id !== characterId && editSystem.isActive) {
                editSystem.finalize();
            }
        }
        
        // 選択キャラクターの編集システムを有効化
        const editSystem = this.editSystems.get(characterId);
        if (editSystem && !editSystem.isActive) {
            editSystem.initialize();
        }
    }

    // 全キャラクターのSpineインスタンス作成
    async initializeAllCharacters() {
        console.log('🎭 全キャラクターSpineインスタンス初期化開始');
        
        if (!this.initializePreviewContainer()) {
            return false;
        }
        
        for (const [characterId, character] of this.app.state.characters) {
            await this.createSpineInstance(characterId);
        }
        
        console.log('✅ 全キャラクターSpineインスタンス初期化完了');
        return true;
    }

    // クリーンアップ
    cleanup() {
        console.log('🧹 SpineIntegrationManager クリーンアップ');
        
        // VFS Blob URLクリーンアップ
        if (typeof vfsAPI !== 'undefined') {
            vfsAPI.clearCache();
        }
        
        // Canvas要素削除
        for (const canvas of this.canvasElements.values()) {
            canvas.remove();
        }
        
        this.spineInstances.clear();
        this.canvasElements.clear();
        this.editSystems.clear();
        
        console.log('✅ SpineIntegrationManager クリーンアップ完了');
    }
}

// グローバル参照
window.SpineIntegrationManager = SpineIntegrationManager;

console.log('✅ Spine Integration Module 読み込み完了');