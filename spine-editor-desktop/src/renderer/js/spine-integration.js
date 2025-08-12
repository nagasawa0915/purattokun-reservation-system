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
            // Step 1: Spine WebGL ライブラリ読み込み（直接）
            const spineLibPath = '../../../assets/js/libs/spine-webgl.js';
            
            const coreLoaded = await new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = spineLibPath;
                script.onload = () => {
                    console.log('✅ Spine WebGL ライブラリ読み込み完了');
                    resolve(true);
                };
                script.onerror = () => {
                    console.warn('⚠️ Spine WebGL ライブラリ読み込み失敗 - 代替方法を試行');
                    this.loadSpineEditCoreDirect().then(resolve).catch(() => resolve(false));
                };
                document.head.appendChild(script);
            });
            
            if (!coreLoaded) {
                console.warn('⚠️ Spine WebGL ライブラリ読み込み失敗 - 基本モードで続行');
                return false;
            }
            
            // Step 2: 軽量Spine WebGL Runtime読み込み（段階的フォールバック）
            await this.loadSpineWebGLRuntime();
            
            this.isSpineLoaded = true;
            console.log('✅ Spine WebGL システム読み込み完了');
            return true;
            
        } catch (error) {
            console.error('❌ Spine WebGL 読み込みエラー:', error);
            console.warn('⚠️ フォールバックモードで続行します');
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
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('❌ spine-edit-core 直接読み込みエラー:', error);
            return false;
        }
    }

    // 軽量Spine WebGL Runtime読み込み
    async loadSpineWebGLRuntime() {
        console.log('🎮 Spine WebGL Runtime 読み込み開始');
        
        // 軽量Spine Runtime実装（基本的なアニメーション再生機能）
        if (typeof window.spine === 'undefined') {
            window.spine = {
                // 基本的なSpineクラス構造
                WebGLRenderer: class {
                    constructor(gl) {
                        this.gl = gl;
                        this.isInitialized = false;
                    }
                    
                    initialize() {
                        this.isInitialized = true;
                        return true;
                    }
                    
                    render(skeleton) {
                        // 基本的な描画処理（プレースホルダー）
                        console.log('🎨 Spine描画実行:', skeleton?.data?.name || 'unknown');
                    }
                },
                
                Skeleton: class {
                    constructor(data) {
                        this.data = data;
                        this.scaleX = 1;
                        this.scaleY = 1;
                        this.x = 0;
                        this.y = 0;
                    }
                    
                    updateWorldTransform() {
                        console.log('🔄 Skeleton座標更新');
                    }
                },
                
                AnimationState: class {
                    constructor(stateData) {
                        this.stateData = stateData;
                        this.tracks = [];
                        this.listeners = [];
                    }
                    
                    setAnimation(trackIndex, animationName, loop) {
                        console.log(`🎬 アニメーション設定: ${animationName} (loop: ${loop})`);
                        return { animation: { name: animationName } };
                    }
                    
                    update(delta) {
                        console.log('⏱️ アニメーション更新:', delta);
                    }
                    
                    apply(skeleton) {
                        console.log('🎭 アニメーション適用:', skeleton?.data?.name);
                    }
                },
                
                AtlasAttachmentLoader: class {
                    constructor(atlas) {
                        this.atlas = atlas;
                    }
                },
                
                SkeletonJson: class {
                    constructor(attachmentLoader) {
                        this.attachmentLoader = attachmentLoader;
                        this.scale = 1;
                    }
                    
                    readSkeletonData(skeletonData) {
                        console.log('📖 Skeleton データ読み込み');
                        return {
                            name: 'character',
                            animations: {
                                taiki: { name: 'taiki', duration: 2.0 },
                                syutugen: { name: 'syutugen', duration: 1.0 }
                            }
                        };
                    }
                },
                
                TextureAtlas: class {
                    constructor(atlasText, textureLoader) {
                        this.pages = [];
                        this.regions = [];
                        console.log('📋 TextureAtlas 初期化');
                    }
                }
            };
            
            console.log('✅ 軽量Spine WebGL Runtime 初期化完了');
        }
    }

    // プレビューコンテナ初期化
    initializePreviewContainer() {
        this.previewContainer = document.querySelector('.preview-content');
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
                console.warn('⚠️ SpineEditSystemが利用できません - 実際Spine表示モードで動作');
                return this.createActualSpineDisplay(characterId, canvas, spineData);
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

    // 実際Spine表示（WebGLレンダリング）
    async createActualSpineDisplay(characterId, canvas, spineData) {
        console.log(`🎮 ${characterId} 実際Spine表示作成開始`);
        
        try {
            // WebGLコンテキスト取得
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                console.warn('⚠️ WebGLがサポートされていません - 2Dフォールバック');
                return this.createCanvas2DFallback(characterId, canvas);
            }
            
            // Spineライブラリチェック
            if (typeof window.spine === 'undefined') {
                console.warn('⚠️ Spineライブラリが利用できません - 2Dフォールバック');
                return this.createCanvas2DFallback(characterId, canvas);
            }
            
            // Spine WebGL Renderer作成（API名前空間修正）
            let renderer = null;
            
            // 新しいAPI（spine-webgl 4.0+）
            if (window.spine.webgl && window.spine.webgl.SceneRenderer) {
                renderer = new window.spine.webgl.SceneRenderer(canvas, gl);
                console.log('✅ 新API使用: spine.webgl.SceneRenderer');
            }
            // 旧API（spine-webgl 3.8系）
            else if (window.spine.WebGLRenderer) {
                renderer = new window.spine.WebGLRenderer(gl);
                console.log('✅ 旧API使用: spine.WebGLRenderer');
            }
            // 代替API
            else if (window.spine.SceneRenderer) {
                renderer = new window.spine.SceneRenderer(canvas, gl);
                console.log('✅ 代替API使用: spine.SceneRenderer');
            }
            else {
                console.error('❌ 利用可能なSpine WebGL Rendererが見つかりません');
                console.log('🔍 利用可能なSpine API:', Object.keys(window.spine || {}));
                return this.createCanvas2DFallback(characterId, canvas);
            }
            
            // レンダラー初期化試行
            if (renderer && typeof renderer.initialize === 'function') {
                if (!renderer.initialize()) {
                    console.warn('⚠️ Spineレンダラー初期化失敗 - 2Dフォールバック');
                    return this.createCanvas2DFallback(characterId, canvas);
                }
            }
            
            // Spineアセットからスケルトン作成
            const spineInstance = await this.createSpineInstanceFromAssets(spineData);
            if (!spineInstance) {
                console.warn('⚠️ Spineインスタンス作成失敗 - 2Dフォールバック');
                return this.createCanvas2DFallback(characterId, canvas);
            }
            
            // アニメーション開始
            spineInstance.state.setAnimation(0, 'taiki', true);
            
            // レンダーループ開始（メモリ管理付き）
            let isRendering = true;
            let lastTime = performance.now();
            
            const renderLoop = (currentTime) => {
                if (!isRendering) return;
                
                try {
                    // WebGLクリア
                    gl.clearColor(0, 0, 0, 0);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    
                    // フレームレート制御
                    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.033); // 最大30fps制限
                    lastTime = currentTime;
                    
                    // アニメーション更新
                    spineInstance.state.update(deltaTime);
                    spineInstance.state.apply(spineInstance.skeleton);
                    spineInstance.skeleton.updateWorldTransform();
                    
                    // 描画
                    renderer.render(spineInstance.skeleton);
                    
                    requestAnimationFrame(renderLoop);
                    
                } catch (error) {
                    console.error(`❌ ${characterId} レンダリングエラー:`, error);
                    console.warn(`⚠️ ${characterId} レンダリングを停止し、フォールバックに切り替えます`);
                    isRendering = false;
                    return this.createCanvas2DFallback(characterId, canvas);
                }
            };
            
            renderLoop(lastTime);
            
            // クリーンアップ機能追加
            const cleanupRender = () => {
                isRendering = false;
                console.log(`🧹 ${characterId} レンダリング停止`);
            };
            
            // インスタンスにクリーンアップ機能を追加
            const instanceData = { 
                characterId, 
                canvas, 
                spineInstance, 
                renderer, 
                mode: 'spine-webgl',
                cleanup: cleanupRender
            };
            
            this.spineInstances.set(characterId, instanceData);
            
            // 基本操作イベント追加
            this.addBasicInteractionEvents(characterId, canvas);
            
            console.log(`✅ ${characterId} Spine WebGL表示完了`);
            return instanceData;
            
        } catch (error) {
            console.error(`❌ ${characterId} Spine表示エラー:`, error);
            return this.createCanvas2DFallback(characterId, canvas);
        }
    }

    // 2D Canvas フォールバック表示（SpineWebGL失敗時）
    createCanvas2DFallback(characterId, canvas) {
        console.log(`🎨 ${characterId} 2D Canvas フォールバック表示作成`);
        
        // Canvas 2D表示
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // キャラクター風の表示
            ctx.fillStyle = '#1976d2';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 簡易アニメーション効果
            let animationFrame = 0;
            const animate = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // 背景
                const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#1976d2');
                gradient.addColorStop(1, '#1565c0');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // 脈動効果
                const pulse = Math.sin(animationFrame * 0.1) * 0.1 + 1;
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                
                // キャラクター名表示
                ctx.fillStyle = '#ffffff';
                ctx.font = `${14 * pulse}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(characterId, centerX, centerY - 10);
                
                // 「Spine Loading...」表示
                ctx.font = '10px Arial';
                ctx.fillStyle = '#bbdefb';
                ctx.fillText('Spine Loading...', centerX, centerY + 15);
                
                animationFrame++;
                requestAnimationFrame(animate);
            };
            
            animate();
        }
        
        // 基本操作イベント
        this.addBasicInteractionEvents(characterId, canvas);
        
        return { characterId, canvas, mode: 'fallback-2d' };
    }

    // プロフェッショナル編集システム（Phase 2 Stage 2）
    addBasicInteractionEvents(characterId, canvas) {
        // 編集モード管理
        const editState = {
            isDragging: false,
            isResizing: false,
            isSelected: false,
            dragStart: { x: 0, y: 0 },
            elementStart: { x: 0, y: 0 },
            resizeHandle: null,
            originalSize: { width: 0, height: 0 },
            snapEnabled: true,
            snapGrid: 5 // 5px単位スナップ
        };
        
        // プロフェッショナル編集ツールバー初期化（初回のみ）
        this.initializeProfessionalToolbar();
        
        // ハンドル操作システム初期化
        this.initializeHandleSystem(characterId, canvas, editState);
        
        // メイン編集イベント
        this.bindEditingEvents(characterId, canvas, editState);
        
        // 右クリックメニューシステム
        this.initializeContextMenu(characterId, canvas, editState);
    }

    // プロフェッショナル編集ツールバー初期化
    initializeProfessionalToolbar() {
        // ツールバーが既に存在する場合はスキップ
        if (document.getElementById('professional-toolbar')) return;
        
        const toolbar = document.createElement('div');
        toolbar.id = 'professional-toolbar';
        toolbar.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(33, 150, 243, 0.95);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            display: flex;
            gap: 8px;
            z-index: 10006;
            font-size: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
        `;
        
        // ツール項目定義
        const tools = [
            { 
                icon: '🎯', 
                text: '選択', 
                action: () => this.setEditMode('select'),
                active: true 
            },
            { 
                icon: '📐', 
                text: 'グリッド', 
                action: () => this.toggleGrid(),
                toggle: true 
            },
            { 
                icon: '🧲', 
                text: 'スナップ', 
                action: () => this.toggleGlobalSnap(),
                toggle: true,
                active: true 
            },
            { 
                icon: '↗️', 
                text: '前面', 
                action: () => this.bringSelectedToFront() 
            },
            { 
                icon: '↙️', 
                text: '背面', 
                action: () => this.sendSelectedToBack() 
            },
            { 
                icon: '⚡', 
                text: '整列', 
                action: () => this.showAlignmentTools() 
            },
            { 
                icon: '📏', 
                text: 'サイズ', 
                action: () => this.showSizeTools() 
            },
            { 
                icon: '🔄', 
                text: 'リセット', 
                action: () => this.resetSelectedCharacters() 
            }
        ];
        
        // ツールボタン作成
        tools.forEach(tool => {
            const button = document.createElement('button');
            button.className = `toolbar-btn${tool.active ? ' active' : ''}`;
            button.innerHTML = `${tool.icon}<br><span style="font-size: 10px;">${tool.text}</span>`;
            button.style.cssText = `
                background: ${tool.active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'};
                color: white;
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 4px;
                padding: 6px 8px;
                cursor: pointer;
                font-size: 10px;
                line-height: 1.2;
                min-width: 45px;
                text-align: center;
                transition: all 0.2s ease;
            `;
            
            // ホバー効果
            button.addEventListener('mouseenter', () => {
                button.style.background = 'rgba(255,255,255,0.3)';
                button.style.transform = 'translateY(-1px)';
                button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            });
            
            button.addEventListener('mouseleave', () => {
                const isActive = button.classList.contains('active');
                button.style.background = isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)';
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = 'none';
            });
            
            // クリックイベント
            button.addEventListener('click', () => {
                if (tool.toggle) {
                    button.classList.toggle('active');
                    const isActive = button.classList.contains('active');
                    button.style.background = isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)';
                }
                tool.action();
            });
            
            toolbar.appendChild(button);
        });
        
        // ステータス表示エリア
        const status = document.createElement('div');
        status.id = 'toolbar-status';
        status.style.cssText = `
            margin-left: 15px;
            padding-left: 15px;
            border-left: 1px solid rgba(255,255,255,0.3);
            font-size: 11px;
            display: flex;
            align-items: center;
            min-width: 120px;
        `;
        status.textContent = 'Phase 2 Stage 2 Ready';
        
        toolbar.appendChild(status);
        
        // DOM追加
        document.body.appendChild(toolbar);
        
        // グローバル参照設定
        this.professionalToolbar = toolbar;
        this.toolbarStatus = status;
        
        console.log('✅ プロフェッショナル編集ツールバー初期化完了');
    }

    // 編集モード設定
    setEditMode(mode) {
        this.editMode = mode;
        this.updateToolbarStatus(`編集モード: ${mode}`);
        console.log(`🎯 編集モード変更: ${mode}`);
    }

    // グローバルスナップ切り替え
    toggleGlobalSnap() {
        this.globalSnapEnabled = !this.globalSnapEnabled;
        
        // 全キャラクターのスナップ設定を更新
        // 実装は既存のeditStateを介して行う
        
        this.updateToolbarStatus(`スナップ: ${this.globalSnapEnabled ? 'ON' : 'OFF'}`);
        console.log(`🧲 グローバルスナップ: ${this.globalSnapEnabled ? 'ON' : 'OFF'}`);
    }

    // 選択キャラクターを前面に
    bringSelectedToFront() {
        if (!this.multiSelectSystem || this.multiSelectSystem.selectedCharacters.size === 0) {
            this.showTemporaryMessage('キャラクターを選択してください', '#f44336');
            return;
        }
        
        this.multiSelectSystem.selectedCharacters.forEach(characterId => {
            this.bringToFront(characterId);
        });
        
        const count = this.multiSelectSystem.selectedCharacters.size;
        this.updateToolbarStatus(`${count}個のキャラクターを前面に移動`);
    }

    // 選択キャラクターを背面に
    sendSelectedToBack() {
        if (!this.multiSelectSystem || this.multiSelectSystem.selectedCharacters.size === 0) {
            this.showTemporaryMessage('キャラクターを選択してください', '#f44336');
            return;
        }
        
        this.multiSelectSystem.selectedCharacters.forEach(characterId => {
            this.sendToBack(characterId);
        });
        
        const count = this.multiSelectSystem.selectedCharacters.size;
        this.updateToolbarStatus(`${count}個のキャラクターを背面に移動`);
    }

    // 整列ツール表示
    showAlignmentTools() {
        if (!this.multiSelectSystem || this.multiSelectSystem.selectedCharacters.size < 2) {
            this.showTemporaryMessage('2個以上のキャラクターを選択してください', '#f44336');
            return;
        }
        
        // 整列ミニツールバー表示
        this.showQuickToolbar('alignment', [
            { text: '←左揃え', action: () => this.alignLeft() },
            { text: '→右揃え', action: () => this.alignRight() },
            { text: '↑上揃え', action: () => this.alignTop() },
            { text: '↓下揃え', action: () => this.alignBottom() },
            { text: '↔中央', action: () => this.alignCenter() },
            { text: '🔄等間隔', action: () => this.distributeSelected() }
        ]);
        
        this.updateToolbarStatus('整列ツール表示中');
    }

    // サイズツール表示
    showSizeTools() {
        if (!this.multiSelectSystem || this.multiSelectSystem.selectedCharacters.size === 0) {
            this.showTemporaryMessage('キャラクターを選択してください', '#f44336');
            return;
        }
        
        // サイズミニツールバー表示
        this.showQuickToolbar('size', [
            { text: '同一サイズ', action: () => this.uniformSize() },
            { text: '拡大(+10%)', action: () => this.scaleSelected(1.1) },
            { text: '縮小(-10%)', action: () => this.scaleSelected(0.9) },
            { text: 'サイズリセット', action: () => this.resetSelectedSize() }
        ]);
        
        this.updateToolbarStatus('サイズツール表示中');
    }

    // クイックツールバー表示
    showQuickToolbar(type, actions) {
        // 既存削除
        const existing = document.getElementById('quick-toolbar');
        if (existing) existing.remove();
        
        const quickBar = document.createElement('div');
        quickBar.id = 'quick-toolbar';
        quickBar.style.cssText = `
            position: fixed;
            top: 70px;
            left: 10px;
            background: rgba(33, 150, 243, 0.95);
            color: white;
            padding: 8px;
            border-radius: 6px;
            display: flex;
            gap: 5px;
            z-index: 10007;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        
        actions.forEach(({ text, action }) => {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.style.cssText = `
                background: rgba(255,255,255,0.2);
                color: white;
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 3px;
                padding: 4px 8px;
                cursor: pointer;
                font-size: 11px;
                white-space: nowrap;
            `;
            
            btn.addEventListener('click', () => {
                action();
                quickBar.remove();
            });
            
            quickBar.appendChild(btn);
        });
        
        document.body.appendChild(quickBar);
        
        // 自動削除タイマー
        setTimeout(() => {
            if (quickBar.parentElement) {
                quickBar.remove();
                this.updateToolbarStatus('Ready');
            }
        }, 5000);
    }

    // 整列機能詳細実装
    alignLeft() {
        const selected = Array.from(this.multiSelectSystem.selectedCharacters);
        const leftmostX = Math.min(...selected.map(id => this.app.state.characters.get(id).x));
        
        selected.forEach(characterId => {
            const character = this.app.state.characters.get(characterId);
            character.x = leftmostX;
            this.syncToSpineEditSystem(characterId, 'x', leftmostX);
        });
        
        this.updateToolbarStatus(`${selected.length}個を左揃え`);
    }

    alignRight() {
        const selected = Array.from(this.multiSelectSystem.selectedCharacters);
        const rightmostX = Math.max(...selected.map(id => this.app.state.characters.get(id).x));
        
        selected.forEach(characterId => {
            const character = this.app.state.characters.get(characterId);
            character.x = rightmostX;
            this.syncToSpineEditSystem(characterId, 'x', rightmostX);
        });
        
        this.updateToolbarStatus(`${selected.length}個を右揃え`);
    }

    alignTop() {
        const selected = Array.from(this.multiSelectSystem.selectedCharacters);
        const topmostY = Math.min(...selected.map(id => this.app.state.characters.get(id).y));
        
        selected.forEach(characterId => {
            const character = this.app.state.characters.get(characterId);
            character.y = topmostY;
            this.syncToSpineEditSystem(characterId, 'y', topmostY);
        });
        
        this.updateToolbarStatus(`${selected.length}個を上揃え`);
    }

    alignBottom() {
        const selected = Array.from(this.multiSelectSystem.selectedCharacters);
        const bottommostY = Math.max(...selected.map(id => this.app.state.characters.get(id).y));
        
        selected.forEach(characterId => {
            const character = this.app.state.characters.get(characterId);
            character.y = bottommostY;
            this.syncToSpineEditSystem(characterId, 'y', bottommostY);
        });
        
        this.updateToolbarStatus(`${selected.length}個を下揃え`);
    }

    alignCenter() {
        const selected = Array.from(this.multiSelectSystem.selectedCharacters);
        const avgX = selected.reduce((sum, id) => sum + this.app.state.characters.get(id).x, 0) / selected.length;
        const avgY = selected.reduce((sum, id) => sum + this.app.state.characters.get(id).y, 0) / selected.length;
        
        selected.forEach(characterId => {
            const character = this.app.state.characters.get(characterId);
            character.x = avgX;
            character.y = avgY;
            this.syncToSpineEditSystem(characterId, 'x', avgX);
            this.syncToSpineEditSystem(characterId, 'y', avgY);
        });
        
        this.updateToolbarStatus(`${selected.length}個を中央整列`);
    }

    // 選択キャラクタースケール調整
    scaleSelected(factor) {
        if (!this.multiSelectSystem || this.multiSelectSystem.selectedCharacters.size === 0) return;
        
        this.multiSelectSystem.selectedCharacters.forEach(characterId => {
            const character = this.app.state.characters.get(characterId);
            if (character) {
                character.scale = Number((character.scale * factor).toFixed(3));
                this.syncToSpineEditSystem(characterId, 'scale', character.scale);
            }
        });
        
        const count = this.multiSelectSystem.selectedCharacters.size;
        const percentage = ((factor - 1) * 100).toFixed(0);
        this.updateToolbarStatus(`${count}個を${percentage > 0 ? '+' : ''}${percentage}% スケール`);
    }

    // 選択キャラクターサイズリセット
    resetSelectedSize() {
        if (!this.multiSelectSystem || this.multiSelectSystem.selectedCharacters.size === 0) return;
        
        this.multiSelectSystem.selectedCharacters.forEach(characterId => {
            this.resetSize(characterId);
        });
        
        const count = this.multiSelectSystem.selectedCharacters.size;
        this.updateToolbarStatus(`${count}個のサイズをリセット`);
    }

    // 選択キャラクターリセット
    resetSelectedCharacters() {
        if (!this.multiSelectSystem || this.multiSelectSystem.selectedCharacters.size === 0) {
            this.showTemporaryMessage('キャラクターを選択してください', '#f44336');
            return;
        }
        
        if (confirm('選択中のキャラクターをデフォルト位置・サイズにリセットしますか？')) {
            this.multiSelectSystem.selectedCharacters.forEach(characterId => {
                this.resetPosition(characterId);
                this.resetSize(characterId);
            });
            
            const count = this.multiSelectSystem.selectedCharacters.size;
            this.updateToolbarStatus(`${count}個をリセット完了`);
        }
    }

    // ツールバーステータス更新
    updateToolbarStatus(message) {
        if (this.toolbarStatus) {
            this.toolbarStatus.textContent = message;
            
            // 自動リセットタイマー
            clearTimeout(this.statusResetTimer);
            this.statusResetTimer = setTimeout(() => {
                if (this.toolbarStatus) {
                    this.toolbarStatus.textContent = 'Phase 2 Stage 2 Ready';
                }
            }, 3000);
        }
    }

    // ハンドル操作システム初期化
    initializeHandleSystem(characterId, canvas, editState) {
        // ハンドルコンテナ作成
        const handleContainer = document.createElement('div');
        handleContainer.id = `handles-${characterId}`;
        handleContainer.style.cssText = `
            position: absolute;
            display: none;
            pointer-events: none;
            z-index: 10001;
            width: 0;
            height: 0;
        `;
        
        // 9点ハンドル作成（中央・4角・4辺）
        const handleTypes = [
            { pos: 'center', cursor: 'move', color: '#2196f3' },
            { pos: 'nw', cursor: 'nw-resize', color: '#f44336' },
            { pos: 'n', cursor: 'n-resize', color: '#4caf50' },
            { pos: 'ne', cursor: 'ne-resize', color: '#f44336' },
            { pos: 'e', cursor: 'e-resize', color: '#4caf50' },
            { pos: 'se', cursor: 'se-resize', color: '#f44336' },
            { pos: 's', cursor: 's-resize', color: '#4caf50' },
            { pos: 'sw', cursor: 'sw-resize', color: '#f44336' },
            { pos: 'w', cursor: 'w-resize', color: '#4caf50' }
        ];
        
        const handles = {};
        
        handleTypes.forEach(({ pos, cursor, color }) => {
            const handle = document.createElement('div');
            handle.className = `edit-handle edit-handle-${pos}`;
            handle.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: ${color};
                border: 2px solid white;
                border-radius: 50%;
                cursor: ${cursor};
                pointer-events: auto;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            `;
            
            // ハンドル位置設定
            this.setHandlePosition(handle, pos);
            
            // ハンドルインタラクション
            this.bindHandleEvents(handle, pos, characterId, canvas, editState);
            
            handles[pos] = handle;
            handleContainer.appendChild(handle);
        });
        
        // DOM追加
        document.body.appendChild(handleContainer);
        
        // 参照保存
        this.handleContainers = this.handleContainers || new Map();
        this.handleContainers.set(characterId, { container: handleContainer, handles });
        
        console.log(`✅ ${characterId} ハンドルシステム初期化完了`);
    }

    // ハンドル位置設定
    setHandlePosition(handle, position) {
        const positions = {
            'center': { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' },
            'nw': { left: '0%', top: '0%', transform: 'translate(-50%, -50%)' },
            'n': { left: '50%', top: '0%', transform: 'translate(-50%, -50%)' },
            'ne': { left: '100%', top: '0%', transform: 'translate(-50%, -50%)' },
            'e': { left: '100%', top: '50%', transform: 'translate(-50%, -50%)' },
            'se': { left: '100%', top: '100%', transform: 'translate(-50%, -50%)' },
            's': { left: '50%', top: '100%', transform: 'translate(-50%, -50%)' },
            'sw': { left: '0%', top: '100%', transform: 'translate(-50%, -50%)' },
            'w': { left: '0%', top: '50%', transform: 'translate(-50%, -50%)' }
        };
        
        const pos = positions[position];
        if (pos) {
            Object.assign(handle.style, pos);
        }
    }

    // ハンドルイベントバインド
    bindHandleEvents(handle, position, characterId, canvas, editState) {
        let startData = null;
        
        // ハンドル操作開始
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const canvasRect = canvas.getBoundingClientRect();
            startData = {
                mouseX: e.clientX,
                mouseY: e.clientY,
                canvasX: canvasRect.left,
                canvasY: canvasRect.top,
                canvasWidth: canvasRect.width,
                canvasHeight: canvasRect.height,
                position: position
            };
            
            if (position === 'center') {
                editState.isDragging = true;
                editState.dragStart = { x: e.clientX, y: e.clientY };
                const containerRect = canvas.parentElement.getBoundingClientRect();
                editState.elementStart = {
                    x: canvasRect.left - containerRect.left,
                    y: canvasRect.top - containerRect.top
                };
            } else {
                editState.isResizing = true;
                editState.resizeHandle = position;
                editState.originalSize = {
                    width: canvasRect.width,
                    height: canvasRect.height
                };
            }
            
            // ハンドルハイライト
            handle.style.background = '#ffc107';
            handle.style.transform = 'translate(-50%, -50%) scale(1.3)';
            
            console.log(`🎯 ${characterId} ${position}ハンドル操作開始`);
        });
        
        // ハンドル操作終了
        document.addEventListener('mouseup', () => {
            if (startData) {
                // ハンドル元に戻す
                const originalColor = position === 'center' ? '#2196f3' : 
                                    ['nw', 'ne', 'se', 'sw'].includes(position) ? '#f44336' : '#4caf50';
                handle.style.background = originalColor;
                handle.style.transform = 'translate(-50%, -50%) scale(1)';
                
                startData = null;
            }
        });
    }

    // 編集イベント統合バインド（複数選択対応）
    bindEditingEvents(characterId, canvas, editState) {
        // 複数選択システム初期化
        if (!this.multiSelectSystem) {
            this.initializeMultiSelectSystem();
        }
        
        // キャラクター選択（複数選択対応）
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0 && !editState.isDragging && !editState.isResizing) {
                
                // 複数選択モード判定
                if (this.multiSelectSystem.isMultiSelectMode) {
                    // Ctrlクリック：複数選択追加/削除
                    this.toggleCharacterMultiSelect(characterId);
                } else {
                    // 通常クリック：単一選択
                    this.clearMultiSelection();
                    this.selectCharacterWithHandles(characterId, true);
                }
                
                e.preventDefault();
            }
        });
        
        // グローバル移動・リサイズイベント（一括移動対応）
        document.addEventListener('mousemove', (e) => {
            if (editState.isDragging) {
                // 一括移動チェック
                if (this.multiSelectSystem.selectedCharacters.size > 1 && 
                    this.multiSelectSystem.selectedCharacters.has(characterId)) {
                    this.handleBulkDragMove(e, characterId, canvas, editState);
                } else {
                    this.handleDragMove(e, characterId, canvas, editState);
                }
            } else if (editState.isResizing) {
                this.handleResizeMove(e, characterId, canvas, editState);
            }
        });
        
        // 編集終了
        document.addEventListener('mouseup', () => {
            if (editState.isDragging || editState.isResizing) {
                console.log(`🔒 ${characterId} 編集操作終了`);
                editState.isDragging = false;
                editState.isResizing = false;
                editState.resizeHandle = null;
                
                // 一括移動完了通知
                if (this.multiSelectSystem.selectedCharacters.size > 1) {
                    const count = this.multiSelectSystem.selectedCharacters.size;
                    this.showTemporaryMessage(`${count}個のキャラクターを移動完了`, '#4caf50');
                }
            }
        });
    }

    // 一括ドラッグ移動処理
    handleBulkDragMove(e, activeCharacterId, activeCanvas, editState) {
        const deltaX = e.clientX - editState.dragStart.x;
        const deltaY = e.clientY - editState.dragStart.y;
        
        // 選択された全キャラクターを同じ量だけ移動
        this.multiSelectSystem.selectedCharacters.forEach(characterId => {
            const canvas = this.canvasElements.get(characterId);
            if (!canvas) return;
            
            // 各キャラクターの初期位置取得
            const character = this.app.state.characters.get(characterId);
            if (!character) return;
            
            // 基準となるキャラクターとの位置差を計算
            let targetDeltaX = deltaX;
            let targetDeltaY = deltaY;
            
            // 現在の位置計算
            const rect = canvas.getBoundingClientRect();
            const containerRect = canvas.parentElement.getBoundingClientRect();
            let newX = rect.left - containerRect.left + targetDeltaX;
            let newY = rect.top - containerRect.top + targetDeltaY;
            
            // スナップ処理
            if (editState.snapEnabled) {
                newX = Math.round(newX / editState.snapGrid) * editState.snapGrid;
                newY = Math.round(newY / editState.snapGrid) * editState.snapGrid;
            }
            
            // 要素位置更新
            canvas.style.left = newX + 'px';
            canvas.style.top = newY + 'px';
            
            // ハンドル位置更新
            this.updateHandlesPosition(characterId);
            
            // キャラクターデータ更新（vw/vh変換）
            const container = canvas.parentElement;
            const xVw = (newX / container.offsetWidth) * 100;
            const yVh = (newY / container.offsetHeight) * 100;
            
            this.updateCharacterPosition(characterId, xVw, yVh);
            
            // 整列ガイド表示（アクティブキャラクターのみ）
            if (characterId === activeCharacterId) {
                this.showAlignmentGuides(characterId, xVw, yVh);
            }
        });
        
        // 一括移動フィードバック表示
        const count = this.multiSelectSystem.selectedCharacters.size;
        this.showPositionFeedback(`一括移動(${count}個)`, 0, 0);
    }

    // キャラクター選択（ハンドル表示）
    selectCharacterWithHandles(characterId, showHandles = true) {
        // 既存選択をクリア
        this.clearAllHandles();
        
        // 新しい選択
        this.app.selectCharacter(characterId);
        
        if (showHandles) {
            const handleData = this.handleContainers?.get(characterId);
            if (handleData) {
                this.updateHandlesPosition(characterId);
                handleData.container.style.display = 'block';
                console.log(`✅ ${characterId} 選択・ハンドル表示`);
            }
        }
    }

    // 全ハンドル非表示
    clearAllHandles() {
        if (this.handleContainers) {
            for (const [id, handleData] of this.handleContainers) {
                handleData.container.style.display = 'none';
            }
        }
    }

    // ハンドル位置更新
    updateHandlesPosition(characterId) {
        const canvas = this.canvasElements.get(characterId);
        const handleData = this.handleContainers?.get(characterId);
        
        if (!canvas || !handleData) return;
        
        const rect = canvas.getBoundingClientRect();
        const container = handleData.container;
        
        container.style.left = rect.left + 'px';
        container.style.top = rect.top + 'px';
        container.style.width = rect.width + 'px';
        container.style.height = rect.height + 'px';
    }

    // ドラッグ移動処理（スナップ対応）
    handleDragMove(e, characterId, canvas, editState) {
        const deltaX = e.clientX - editState.dragStart.x;
        const deltaY = e.clientY - editState.dragStart.y;
        
        let newX = editState.elementStart.x + deltaX;
        let newY = editState.elementStart.y + deltaY;
        
        // スナップ処理
        if (editState.snapEnabled) {
            newX = Math.round(newX / editState.snapGrid) * editState.snapGrid;
            newY = Math.round(newY / editState.snapGrid) * editState.snapGrid;
        }
        
        // 要素位置更新
        canvas.style.left = newX + 'px';
        canvas.style.top = newY + 'px';
        
        // ハンドル位置更新
        this.updateHandlesPosition(characterId);
        
        // キャラクターデータ更新（vw/vh変換）
        const container = canvas.parentElement;
        const xVw = (newX / container.offsetWidth) * 100;
        const yVh = (newY / container.offsetHeight) * 100;
        
        this.updateCharacterPosition(characterId, xVw, yVh);
        
        // リアルタイム座標表示
        this.showPositionFeedback(characterId, xVw, yVh);
        
        // 整列ガイド表示
        this.showAlignmentGuides(characterId, xVw, yVh);
    }

    // リサイズ移動処理
    handleResizeMove(e, characterId, canvas, editState) {
        if (!editState.resizeHandle) return;
        
        const rect = canvas.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        let newWidth = editState.originalSize.width;
        let newHeight = editState.originalSize.height;
        
        // ハンドル位置に応じてリサイズ
        const handle = editState.resizeHandle;
        const deltaX = e.clientX - editState.dragStart?.x || 0;
        const deltaY = e.clientY - editState.dragStart?.y || 0;
        
        if (handle.includes('e')) newWidth += deltaX;
        if (handle.includes('w')) newWidth -= deltaX;
        if (handle.includes('s')) newHeight += deltaY;
        if (handle.includes('n')) newHeight -= deltaY;
        
        // 最小サイズ制限
        newWidth = Math.max(newWidth, 50);
        newHeight = Math.max(newHeight, 50);
        
        // スナップ処理
        if (editState.snapEnabled) {
            newWidth = Math.round(newWidth / editState.snapGrid) * editState.snapGrid;
            newHeight = Math.round(newHeight / editState.snapGrid) * editState.snapGrid;
        }
        
        // サイズ更新
        canvas.style.width = newWidth + 'px';
        canvas.style.height = newHeight + 'px';
        
        // ハンドル位置更新
        this.updateHandlesPosition(characterId);
        
        // スケール値計算・更新
        const baseSize = 200; // 基準サイズ
        const newScale = Math.min(newWidth, newHeight) / baseSize;
        
        const character = this.app.state.characters.get(characterId);
        if (character) {
            character.scale = Number(newScale.toFixed(3));
            if (this.app.state.selectedCharacter === characterId) {
                this.app.updateProperties();
            }
        }
        
        console.log(`📏 ${characterId} リサイズ: ${newWidth}x${newHeight} (scale: ${newScale.toFixed(3)})`);
    }

    // リアルタイム座標フィードバック
    showPositionFeedback(characterId, x, y) {
        // フィードバック要素取得・作成
        let feedback = document.getElementById('position-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'position-feedback';
            feedback.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(33, 150, 243, 0.95);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-family: monospace;
                z-index: 10002;
                pointer-events: none;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(feedback);
        }
        
        // 座標値表示
        feedback.textContent = `${characterId}: (${x.toFixed(1)}vw, ${y.toFixed(1)}vh)`;
        feedback.style.opacity = '1';
        
        // 自動非表示タイマー
        clearTimeout(feedback.hideTimer);
        feedback.hideTimer = setTimeout(() => {
            feedback.style.opacity = '0';
        }, 2000);
    }

    // 右クリックメニューシステム
    initializeContextMenu(characterId, canvas, editState) {
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            // 既存メニュー削除
            const existingMenu = document.getElementById('context-menu');
            if (existingMenu) {
                existingMenu.remove();
            }
            
            // メニュー作成
            const menu = document.createElement('div');
            menu.id = 'context-menu';
            menu.style.cssText = `
                position: fixed;
                left: ${e.clientX}px;
                top: ${e.clientY}px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                z-index: 10003;
                min-width: 150px;
                font-size: 14px;
            `;
            
            // メニュー項目
            const menuItems = [
                { text: 'スナップ ON/OFF', action: () => this.toggleSnap(characterId, editState) },
                { text: '中央に配置', action: () => this.centerCharacter(characterId) },
                { text: '原点に戻す', action: () => this.resetPosition(characterId) },
                { text: 'サイズリセット', action: () => this.resetSize(characterId) },
                { text: '前面に移動', action: () => this.bringToFront(characterId) },
                { text: '背面に移動', action: () => this.sendToBack(characterId) }
            ];
            
            menuItems.forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.textContent = item.text;
                menuItem.style.cssText = `
                    padding: 8px 12px;
                    cursor: pointer;
                    border-bottom: 1px solid #eee;
                `;
                
                menuItem.addEventListener('mouseenter', () => {
                    menuItem.style.background = '#f0f0f0';
                });
                
                menuItem.addEventListener('mouseleave', () => {
                    menuItem.style.background = 'transparent';
                });
                
                menuItem.addEventListener('click', () => {
                    item.action();
                    menu.remove();
                });
                
                menu.appendChild(menuItem);
            });
            
            // メニュー表示
            document.body.appendChild(menu);
            
            // 外部クリックで閉じる
            setTimeout(() => {
                document.addEventListener('click', function closeMenu() {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }, 100);
            }, 100);
            
            console.log(`🖱️ ${characterId} 右クリックメニュー表示`);
        });
    }

    // スナップ切り替え
    toggleSnap(characterId, editState) {
        editState.snapEnabled = !editState.snapEnabled;
        console.log(`📏 ${characterId} スナップ: ${editState.snapEnabled ? 'ON' : 'OFF'}`);
        
        // フィードバック表示
        this.showTemporaryMessage(`スナップ: ${editState.snapEnabled ? 'ON' : 'OFF'}`, '#4caf50');
    }

    // キャラクター中央配置
    centerCharacter(characterId) {
        const canvas = this.canvasElements.get(characterId);
        if (!canvas) return;
        
        const container = canvas.parentElement;
        const centerX = container.offsetWidth / 2;
        const centerY = container.offsetHeight / 2;
        
        canvas.style.left = centerX + 'px';
        canvas.style.top = centerY + 'px';
        
        // データ更新
        const xVw = (centerX / container.offsetWidth) * 100;
        const yVh = (centerY / container.offsetHeight) * 100;
        this.updateCharacterPosition(characterId, xVw, yVh);
        
        // ハンドル位置更新
        this.updateHandlesPosition(characterId);
        
        console.log(`🎯 ${characterId} 中央配置完了`);
        this.showTemporaryMessage(`${characterId} を中央に配置しました`, '#2196f3');
    }

    // 位置リセット
    resetPosition(characterId) {
        const character = this.app.state.characters.get(characterId);
        if (!character) return;
        
        // デフォルト位置
        character.x = 18;
        character.y = 49;
        
        // 表示更新
        this.syncToSpineEditSystem(characterId, 'x', character.x);
        this.syncToSpineEditSystem(characterId, 'y', character.y);
        
        // プロパティパネル更新
        if (this.app.state.selectedCharacter === characterId) {
            this.app.updateProperties();
        }
        
        // ハンドル位置更新
        this.updateHandlesPosition(characterId);
        
        console.log(`🔄 ${characterId} 位置リセット完了`);
        this.showTemporaryMessage(`${characterId} の位置をリセットしました`, '#ff9800');
    }

    // サイズリセット
    resetSize(characterId) {
        const character = this.app.state.characters.get(characterId);
        if (!character) return;
        
        character.scale = 0.55;
        
        // 表示更新
        this.syncToSpineEditSystem(characterId, 'scale', character.scale);
        
        // プロパティパネル更新
        if (this.app.state.selectedCharacter === characterId) {
            this.app.updateProperties();
        }
        
        // ハンドル位置更新
        this.updateHandlesPosition(characterId);
        
        console.log(`📐 ${characterId} サイズリセット完了`);
        this.showTemporaryMessage(`${characterId} のサイズをリセットしました`, '#9c27b0');
    }

    // 前面移動
    bringToFront(characterId) {
        const canvas = this.canvasElements.get(characterId);
        if (!canvas) return;
        
        // Z-index調整
        const maxZ = Math.max(...Array.from(this.canvasElements.values()).map(c => parseInt(c.style.zIndex) || 1000));
        canvas.style.zIndex = maxZ + 1;
        
        console.log(`⬆️ ${characterId} 前面移動 (z-index: ${maxZ + 1})`);
        this.showTemporaryMessage(`${characterId} を前面に移動しました`, '#4caf50');
    }

    // 背面移動
    sendToBack(characterId) {
        const canvas = this.canvasElements.get(characterId);
        if (!canvas) return;
        
        // Z-index調整
        const minZ = Math.min(...Array.from(this.canvasElements.values()).map(c => parseInt(c.style.zIndex) || 1000));
        canvas.style.zIndex = Math.max(minZ - 1, 999); // 最低値保証
        
        console.log(`⬇️ ${characterId} 背面移動 (z-index: ${Math.max(minZ - 1, 999)})`);
        this.showTemporaryMessage(`${characterId} を背面に移動しました`, '#ff5722');
    }

    // 一時メッセージ表示
    showTemporaryMessage(message, color = '#2196f3') {
        const msg = document.createElement('div');
        msg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${color};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 10004;
            pointer-events: none;
            animation: fadeInOut 2s ease-in-out;
        `;
        
        // アニメーション追加
        if (!document.getElementById('temp-message-style')) {
            const style = document.createElement('style');
            style.id = 'temp-message-style';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }
        
        msg.textContent = message;
        document.body.appendChild(msg);
        
        // 自動削除
        setTimeout(() => msg.remove(), 2000);
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
        
        // パフォーマンス最適化システム初期化
        this.initializePerformanceOptimization();
        
        for (const [characterId, character] of this.app.state.characters) {
            await this.createSpineInstance(characterId);
        }
        
        console.log('✅ 全キャラクターSpineインスタンス初期化完了');
        return true;
    }
    
    // AssetManager アセット読み込み完了待機（マニュアル準拠）
    waitForAssets(assetManager) {
        return new Promise((resolve, reject) => {
            let checkCount = 0;
            const maxChecks = 50;

            const checkAssets = () => {
                checkCount++;
                if (assetManager.isLoadingComplete()) {
                    console.log("✅ アセット読み込み完了");
                    resolve();
                } else if (checkCount >= maxChecks) {
                    reject(new Error("アセット読み込みタイムアウト"));
                } else {
                    setTimeout(checkAssets, 100);
                }
            };

            checkAssets();
        });
    }

    // Spineアセットからインスタンス作成
    async createSpineInstanceFromAssets(spineData) {
        console.log('🏗️ 新しいAssetManager方式でSpineインスタンス作成開始');
        
        try {
            if (!spineData || !spineData.jsonURL || !spineData.atlasURL) {
                console.warn('⚠️ 必要なSpineアセットが不足しています');
                return null;
            }
            
            // WebGLコンテキスト取得
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 300;
            const gl = canvas.getContext('webgl', { alpha: true });
            if (!gl) {
                console.warn('⚠️ WebGLが利用できません');
                return null;
            }
            
            // Spine WebGLライブラリの確認
            await this.waitForSpine();
            
            // AssetManagerを使用した正しいSpine読み込み（マニュアル準拠）
            console.log('📦 AssetManager初期化開始');
            
            // ベースパスを設定（URLからパスを推測）
            const atlasURL = new URL(spineData.atlasURL, window.location.href);
            const basePath = atlasURL.pathname.substring(0, atlasURL.pathname.lastIndexOf('/') + 1);
            console.log('📁 ベースパス:', basePath);
            
            // AssetManager作成
            const assetManager = new window.spine.AssetManager(gl, basePath);
            
            // アセット読み込み（ファイル名のみ指定）
            const atlasFileName = atlasURL.pathname.split('/').pop();
            const jsonURL = new URL(spineData.jsonURL, window.location.href);
            const jsonFileName = jsonURL.pathname.split('/').pop();
            
            console.log('📋 読み込み対象:', { atlasFileName, jsonFileName });
            
            // AssetManager経由で読み込み
            assetManager.loadTextureAtlas(atlasFileName);
            assetManager.loadJson(jsonFileName);
            
            // アセット読み込み完了待機
            await this.waitForAssets(assetManager);
            
            // スケルトン構築（マニュアル準拠）
            const atlas = assetManager.get(atlasFileName);
            const atlasLoader = new window.spine.AtlasAttachmentLoader(atlas);
            const skeletonJson = new window.spine.SkeletonJson(atlasLoader);
            const skeletonData = skeletonJson.readSkeletonData(assetManager.get(jsonFileName));
            
            // Skeleton作成
            const skeleton = new window.spine.Skeleton(skeletonData);
            
            // キャラクター位置設定（マニュアル準拠）
            skeleton.x = 0;              // Canvas中央（X軸）
            skeleton.y = -100;           // 地面から100px上
            skeleton.scaleX = skeleton.scaleY = 0.55; // スケール調整
            
            // 最新Spine WebGL Runtime対応初期化
            try {
                // 現代的なSpine Runtime（4.0+）では setToSetupPose() が標準
                if (typeof skeleton.setToSetupPose === 'function') {
                    skeleton.setToSetupPose();
                    console.log('✅ 最新API使用: setToSetupPose()');
                } 
                // 古いSpine Runtime（3.8系）の場合
                else if (typeof skeleton.setSlotsToSetupPose === 'function' && typeof skeleton.setBonesToSetupPose === 'function') {
                    skeleton.setSlotsToSetupPose();
                    skeleton.setBonesToSetupPose();
                    console.log('✅ 旧API使用: setSlotsToSetupPose() + setBonesToSetupPose()');
                }
                // 手動初期化（最後の手段）
                else {
                    console.log('⚠️ 手動Skeleton初期化モード - データ検証中');
                    
                    // Skeletonオブジェクトの構造を検証
                    if (skeleton && skeleton.bones && skeleton.slots) {
                        console.log('✅ Skeleton構造確認: bones=' + skeleton.bones.length + ', slots=' + skeleton.slots.length);
                        
                        // 手動でセットアップポーズ適用（可能な範囲で）
                        if (skeleton.bones) {
                            for (let bone of skeleton.bones) {
                                if (bone.data) {
                                    bone.x = bone.data.x;
                                    bone.y = bone.data.y;
                                    bone.rotation = bone.data.rotation;
                                    bone.scaleX = bone.data.scaleX;
                                    bone.scaleY = bone.data.scaleY;
                                }
                            }
                        }
                        console.log('✅ 手動初期化完了');
                    }
                }
            } catch (initError) {
                console.warn('⚠️ Skeleton初期化エラー - 基本状態で続行:', initError.message);
            }
            
            // AnimationState作成（修正版）
            const stateData = new window.spine.AnimationStateData(skeletonData);
            const state = new window.spine.AnimationState(stateData);
            
            // アニメーションシーケンス設定（マニュアル準拠）
            console.log('🎬 アニメーションシーケンス設定開始');
            
            // 利用可能なアニメーション一覧を取得
            const animations = [];
            if (skeletonData.animations) {
                for (let i = 0; i < skeletonData.animations.length; i++) {
                    animations.push(skeletonData.animations[i].name);
                }
            }
            console.log('📋 利用可能アニメーション:', animations);
            
            // syutugen → taiki シーケンス設定
            if (animations.includes('syutugen') && animations.includes('taiki')) {
                console.log('🎬 syutugen（登場）→ taiki（待機）シーケンス開始');
                state.setAnimation(0, 'syutugen', false); // 1回のみ再生
                state.addAnimation(0, 'taiki', true, 0);   // 完了後に待機ループ
            } else if (animations.includes('taiki')) {
                console.log('🎬 taiki（待機）アニメーション開始（syutugenなし）');
                state.setAnimation(0, 'taiki', true);
            } else {
                console.log('⚠️ 既知のアニメーションが見つかりません - 最初のアニメーション使用');
                if (animations.length > 0) {
                    state.setAnimation(0, animations[0], true);
                }
            }
            
            console.log('✅ Spineインスタンス作成完了（AssetManager方式）');
            return { skeleton, state, data: skeletonData, canvas, gl };
            
        } catch (error) {
            console.error('❌ Spineインスタンス作成エラー:', error);
            return null;
        }
    }

    // === スナップ・グリッド機能システム === //

    // グリッド表示システム初期化
    initializeGridSystem() {
        if (this.gridSystem) return; // 既に初期化済み
        
        this.gridSystem = {
            visible: false,
            size: 20, // 20px グリッド
            snapSize: 5, // 5px スナップ
            container: null
        };
        
        // グリッドコンテナ作成
        const gridContainer = document.createElement('div');
        gridContainer.id = 'grid-overlay';
        gridContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999;
            display: none;
        `;
        
        // グリッドSVG作成
        const gridSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        gridSvg.style.cssText = `
            width: 100%;
            height: 100%;
            opacity: 0.3;
        `;
        
        // グリッドパターン定義
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        pattern.id = 'grid-pattern';
        pattern.setAttribute('width', this.gridSystem.size);
        pattern.setAttribute('height', this.gridSystem.size);
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');
        
        // グリッド線
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${this.gridSystem.size} 0 L 0 0 0 ${this.gridSystem.size}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#2196f3');
        path.setAttribute('stroke-width', '1');
        
        pattern.appendChild(path);
        defs.appendChild(pattern);
        gridSvg.appendChild(defs);
        
        // グリッド矩形
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', 'url(#grid-pattern)');
        
        gridSvg.appendChild(rect);
        gridContainer.appendChild(gridSvg);
        
        // DOM追加
        const previewContainer = document.getElementById('preview-canvas');
        if (previewContainer) {
            previewContainer.appendChild(gridContainer);
            this.gridSystem.container = gridContainer;
            console.log('✅ グリッドシステム初期化完了');
        }
    }

    // グリッド表示切り替え
    toggleGrid() {
        if (!this.gridSystem) {
            this.initializeGridSystem();
        }
        
        this.gridSystem.visible = !this.gridSystem.visible;
        
        if (this.gridSystem.container) {
            this.gridSystem.container.style.display = this.gridSystem.visible ? 'block' : 'none';
        }
        
        console.log(`📐 グリッド表示: ${this.gridSystem.visible ? 'ON' : 'OFF'}`);
        this.showTemporaryMessage(`グリッド: ${this.gridSystem.visible ? 'ON' : 'OFF'}`, '#ff9800');
    }

    // ガイドライン表示（オブジェクト整列支援）
    showAlignmentGuides(characterId, x, y) {
        if (!this.gridSystem?.visible) return;
        
        // 既存ガイド削除
        const existingGuides = document.querySelectorAll('.alignment-guide');
        existingGuides.forEach(guide => guide.remove());
        
        // 他のキャラクターとの整列をチェック
        const alignments = this.findAlignments(characterId, x, y);
        
        if (alignments.length > 0) {
            alignments.forEach(alignment => {
                this.createAlignmentGuide(alignment);
            });
            
            // 自動削除タイマー
            setTimeout(() => {
                const guides = document.querySelectorAll('.alignment-guide');
                guides.forEach(guide => guide.remove());
            }, 1000);
        }
    }

    // 整列検出
    findAlignments(targetId, targetX, targetY) {
        const alignments = [];
        const tolerance = 2; // 2vw/vh 許容誤差
        
        for (const [characterId, character] of this.app.state.characters) {
            if (characterId === targetId) continue;
            
            const deltaX = Math.abs(character.x - targetX);
            const deltaY = Math.abs(character.y - targetY);
            
            // 垂直整列
            if (deltaX < tolerance) {
                alignments.push({
                    type: 'vertical',
                    position: character.x,
                    source: characterId,
                    target: targetId
                });
            }
            
            // 水平整列
            if (deltaY < tolerance) {
                alignments.push({
                    type: 'horizontal',
                    position: character.y,
                    source: characterId,
                    target: targetId
                });
            }
        }
        
        return alignments;
    }

    // 整列ガイド作成
    createAlignmentGuide(alignment) {
        const guide = document.createElement('div');
        guide.className = 'alignment-guide';
        
        if (alignment.type === 'vertical') {
            guide.style.cssText = `
                position: absolute;
                left: ${alignment.position}vw;
                top: 0;
                width: 1px;
                height: 100%;
                background: #ff5722;
                z-index: 1001;
                pointer-events: none;
                box-shadow: 0 0 3px #ff5722;
            `;
        } else {
            guide.style.cssText = `
                position: absolute;
                left: 0;
                top: ${alignment.position}vh;
                width: 100%;
                height: 1px;
                background: #ff5722;
                z-index: 1001;
                pointer-events: none;
                box-shadow: 0 0 3px #ff5722;
            `;
        }
        
        const previewContainer = document.getElementById('preview-canvas');
        if (previewContainer) {
            previewContainer.appendChild(guide);
        }
    }

    // === 複数選択・一括操作機能システム === //

    // 複数選択システム初期化
    initializeMultiSelectSystem() {
        if (this.multiSelectSystem) return;
        
        this.multiSelectSystem = {
            selectedCharacters: new Set(),
            isMultiSelectMode: false,
            dragSelection: false,
            selectionBox: null
        };
        
        // キーボードイベント監視
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Control' || e.key === 'Meta') {
                this.multiSelectSystem.isMultiSelectMode = true;
                console.log('🎯 複数選択モード ON');
            }
            
            // 全選択 (Ctrl+A)
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                this.selectAllCharacters();
            }
            
            // 選択解除 (Escape)
            if (e.key === 'Escape') {
                this.clearMultiSelection();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Control' || e.key === 'Meta') {
                this.multiSelectSystem.isMultiSelectMode = false;
                console.log('🎯 複数選択モード OFF');
            }
        });
        
        // ドラッグ選択エリア初期化
        this.initializeDragSelection();
        
        console.log('✅ 複数選択システム初期化完了');
    }

    // ドラッグ選択初期化
    initializeDragSelection() {
        const previewContainer = document.getElementById('preview-canvas');
        if (!previewContainer) return;
        
        let dragStart = null;
        let selectionBox = null;
        
        previewContainer.addEventListener('mousedown', (e) => {
            // 空白エリアでの選択開始
            if (e.target === previewContainer || e.target.id === 'spine-container') {
                if (!this.multiSelectSystem.isMultiSelectMode) {
                    this.clearMultiSelection();
                }
                
                dragStart = {
                    x: e.clientX,
                    y: e.clientY
                };
                
                this.multiSelectSystem.dragSelection = true;
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.multiSelectSystem.dragSelection && dragStart) {
                // 選択ボックス表示
                if (!selectionBox) {
                    selectionBox = document.createElement('div');
                    selectionBox.style.cssText = `
                        position: fixed;
                        border: 2px dashed #2196f3;
                        background: rgba(33, 150, 243, 0.1);
                        z-index: 10000;
                        pointer-events: none;
                    `;
                    document.body.appendChild(selectionBox);
                }
                
                const rect = {
                    left: Math.min(dragStart.x, e.clientX),
                    top: Math.min(dragStart.y, e.clientY),
                    width: Math.abs(e.clientX - dragStart.x),
                    height: Math.abs(e.clientY - dragStart.y)
                };
                
                selectionBox.style.left = rect.left + 'px';
                selectionBox.style.top = rect.top + 'px';
                selectionBox.style.width = rect.width + 'px';
                selectionBox.style.height = rect.height + 'px';
                
                // リアルタイム範囲選択
                this.updateDragSelection(rect);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (this.multiSelectSystem.dragSelection) {
                this.multiSelectSystem.dragSelection = false;
                dragStart = null;
                
                if (selectionBox) {
                    selectionBox.remove();
                    selectionBox = null;
                }
            }
        });
    }

    // ドラッグ範囲選択更新
    updateDragSelection(selectionRect) {
        const newSelection = new Set();
        
        for (const [characterId, canvas] of this.canvasElements) {
            const canvasRect = canvas.getBoundingClientRect();
            
            // 交差判定
            if (this.rectsIntersect(selectionRect, canvasRect)) {
                newSelection.add(characterId);
            }
        }
        
        // 選択状態更新
        this.multiSelectSystem.selectedCharacters = newSelection;
        this.updateMultiSelectionVisual();
    }

    // 矩形交差判定
    rectsIntersect(rect1, rect2) {
        return !(rect1.left > rect2.right || 
                rect2.left > rect1.left + rect1.width || 
                rect1.top > rect2.bottom || 
                rect2.top > rect1.top + rect1.height);
    }

    // キャラクター複数選択追加/削除
    toggleCharacterMultiSelect(characterId) {
        if (!this.multiSelectSystem) {
            this.initializeMultiSelectSystem();
        }
        
        if (this.multiSelectSystem.selectedCharacters.has(characterId)) {
            this.multiSelectSystem.selectedCharacters.delete(characterId);
            this.hideCharacterSelection(characterId);
            console.log(`➖ ${characterId} 選択解除`);
        } else {
            this.multiSelectSystem.selectedCharacters.add(characterId);
            this.showCharacterSelection(characterId);
            console.log(`➕ ${characterId} 選択追加`);
        }
        
        this.updateMultiSelectionVisual();
        
        // 選択状況表示
        const count = this.multiSelectSystem.selectedCharacters.size;
        this.showTemporaryMessage(`${count}個のキャラクターを選択中`, '#4caf50');
    }

    // 全選択
    selectAllCharacters() {
        if (!this.multiSelectSystem) {
            this.initializeMultiSelectSystem();
        }
        
        this.multiSelectSystem.selectedCharacters.clear();
        
        for (const characterId of this.app.state.characters.keys()) {
            this.multiSelectSystem.selectedCharacters.add(characterId);
            this.showCharacterSelection(characterId);
        }
        
        this.updateMultiSelectionVisual();
        
        const count = this.multiSelectSystem.selectedCharacters.size;
        console.log(`🎯 全${count}個のキャラクターを選択`);
        this.showTemporaryMessage(`全${count}個のキャラクターを選択`, '#2196f3');
    }

    // 複数選択解除
    clearMultiSelection() {
        if (!this.multiSelectSystem) return;
        
        for (const characterId of this.multiSelectSystem.selectedCharacters) {
            this.hideCharacterSelection(characterId);
        }
        
        this.multiSelectSystem.selectedCharacters.clear();
        this.updateMultiSelectionVisual();
        
        console.log('🔄 複数選択解除');
        this.showTemporaryMessage('選択解除', '#ff9800');
    }

    // キャラクター選択表示
    showCharacterSelection(characterId) {
        const canvas = this.canvasElements.get(characterId);
        if (!canvas) return;
        
        // 選択境界線追加
        canvas.style.outline = '3px solid #2196f3';
        canvas.style.outlineOffset = '2px';
        canvas.style.filter = 'drop-shadow(0 0 10px rgba(33, 150, 243, 0.6))';
    }

    // キャラクター選択非表示
    hideCharacterSelection(characterId) {
        const canvas = this.canvasElements.get(characterId);
        if (!canvas) return;
        
        canvas.style.outline = '';
        canvas.style.outlineOffset = '';
        canvas.style.filter = '';
    }

    // 複数選択視覚更新
    updateMultiSelectionVisual() {
        // 全ハンドル非表示
        this.clearAllHandles();
        
        // 複数選択時は個別ハンドルを非表示にして、統合操作UIを表示
        if (this.multiSelectSystem.selectedCharacters.size > 1) {
            this.showMultiSelectionUI();
        } else if (this.multiSelectSystem.selectedCharacters.size === 1) {
            // 単一選択時はハンドル表示
            const characterId = Array.from(this.multiSelectSystem.selectedCharacters)[0];
            this.selectCharacterWithHandles(characterId, true);
        }
    }

    // 複数選択UI表示
    showMultiSelectionUI() {
        // 既存UI削除
        const existingUI = document.getElementById('multi-selection-ui');
        if (existingUI) {
            existingUI.remove();
        }
        
        // 統合操作パネル作成
        const ui = document.createElement('div');
        ui.id = 'multi-selection-ui';
        ui.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(33, 150, 243, 0.95);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            display: flex;
            gap: 10px;
            z-index: 10005;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        // 操作ボタン
        const actions = [
            { text: '一括移動', action: () => this.enableBulkMove() },
            { text: '整列', action: () => this.alignSelected() },
            { text: '等間隔配置', action: () => this.distributeSelected() },
            { text: '同一サイズ', action: () => this.uniformSize() },
            { text: '削除', action: () => this.deleteSelected() }
        ];
        
        actions.forEach(({ text, action }) => {
            const button = document.createElement('button');
            button.textContent = text;
            button.style.cssText = `
                background: rgba(255,255,255,0.2);
                color: white;
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 4px;
                padding: 6px 12px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.2s ease;
            `;
            
            button.addEventListener('mouseenter', () => {
                button.style.background = 'rgba(255,255,255,0.3)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.background = 'rgba(255,255,255,0.2)';
            });
            
            button.addEventListener('click', action);
            ui.appendChild(button);
        });
        
        document.body.appendChild(ui);
        
        console.log(`🎛️ 複数選択UI表示 (${this.multiSelectSystem.selectedCharacters.size}個選択)`);
    }

    // 一括移動モード
    enableBulkMove() {
        console.log('📦 一括移動モード開始');
        this.showTemporaryMessage('一括移動: 任意のキャラクターをドラッグしてください', '#4caf50');
        
        // 一括移動用のイベントハンドラーを設定
        this.bulkMoveEnabled = true;
    }

    // 選択キャラクター整列
    alignSelected() {
        const selected = Array.from(this.multiSelectSystem.selectedCharacters);
        if (selected.length < 2) return;
        
        // 最初のキャラクターのY座標に揃える
        const baseCharacter = this.app.state.characters.get(selected[0]);
        const targetY = baseCharacter.y;
        
        selected.forEach(characterId => {
            const character = this.app.state.characters.get(characterId);
            if (character) {
                character.y = targetY;
                this.syncToSpineEditSystem(characterId, 'y', targetY);
            }
        });
        
        // プロパティパネル更新
        if (this.app.state.selectedCharacter && selected.includes(this.app.state.selectedCharacter)) {
            this.app.updateProperties();
        }
        
        console.log(`↔️ ${selected.length}個のキャラクターを水平整列`);
        this.showTemporaryMessage(`${selected.length}個のキャラクターを整列しました`, '#9c27b0');
    }

    // 等間隔配置
    distributeSelected() {
        const selected = Array.from(this.multiSelectSystem.selectedCharacters);
        if (selected.length < 3) {
            this.showTemporaryMessage('等間隔配置には3個以上の選択が必要です', '#f44336');
            return;
        }
        
        // X座標でソート
        selected.sort((a, b) => {
            const charA = this.app.state.characters.get(a);
            const charB = this.app.state.characters.get(b);
            return charA.x - charB.x;
        });
        
        const firstChar = this.app.state.characters.get(selected[0]);
        const lastChar = this.app.state.characters.get(selected[selected.length - 1]);
        const totalWidth = lastChar.x - firstChar.x;
        const interval = totalWidth / (selected.length - 1);
        
        // 中間キャラクターを等間隔配置
        selected.forEach((characterId, index) => {
            if (index === 0 || index === selected.length - 1) return; // 両端は維持
            
            const character = this.app.state.characters.get(characterId);
            if (character) {
                character.x = firstChar.x + (interval * index);
                this.syncToSpineEditSystem(characterId, 'x', character.x);
            }
        });
        
        console.log(`📐 ${selected.length}個のキャラクターを等間隔配置`);
        this.showTemporaryMessage(`${selected.length}個のキャラクターを等間隔配置しました`, '#673ab7');
    }

    // 同一サイズ調整
    uniformSize() {
        const selected = Array.from(this.multiSelectSystem.selectedCharacters);
        if (selected.length < 2) return;
        
        // 最初のキャラクターのスケールに合わせる
        const baseCharacter = this.app.state.characters.get(selected[0]);
        const targetScale = baseCharacter.scale;
        
        selected.forEach(characterId => {
            const character = this.app.state.characters.get(characterId);
            if (character && character !== baseCharacter) {
                character.scale = targetScale;
                this.syncToSpineEditSystem(characterId, 'scale', targetScale);
            }
        });
        
        console.log(`📏 ${selected.length}個のキャラクターを同一サイズ調整 (scale: ${targetScale})`);
        this.showTemporaryMessage(`同一サイズに調整しました (${targetScale})`, '#3f51b5');
    }

    // 選択キャラクター削除
    deleteSelected() {
        const selected = Array.from(this.multiSelectSystem.selectedCharacters);
        if (selected.length === 0) return;
        
        // 確認ダイアログ
        if (confirm(`選択中の${selected.length}個のキャラクターを削除しますか？`)) {
            selected.forEach(characterId => {
                // キャラクターデータ削除
                this.app.state.characters.delete(characterId);
                
                // Canvas要素削除
                const canvas = this.canvasElements.get(characterId);
                if (canvas) {
                    canvas.remove();
                    this.canvasElements.delete(characterId);
                }
                
                // ハンドル削除
                const handleData = this.handleContainers?.get(characterId);
                if (handleData) {
                    handleData.container.remove();
                    this.handleContainers.delete(characterId);
                }
                
                // Spineインスタンス削除
                const instance = this.spineInstances.get(characterId);
                if (instance && instance.cleanup) {
                    instance.cleanup();
                }
                this.spineInstances.delete(characterId);
            });
            
            // 選択クリア
            this.clearMultiSelection();
            
            // リスト更新
            if (this.app.updateCharacterList) {
                this.app.updateCharacterList();
            }
            
            console.log(`🗑️ ${selected.length}個のキャラクターを削除完了`);
            this.showTemporaryMessage(`${selected.length}個のキャラクターを削除しました`, '#f44336');
        }
    }

    // === パフォーマンス最適化・メモリ管理システム === //

    // フレームレート制御システム
    initializePerformanceOptimization() {
        if (this.performanceSystem) return;
        
        this.performanceSystem = {
            targetFPS: 30, // 30fps制限でパフォーマンス向上
            frameSkipThreshold: 16.67, // 16.67ms (60fps) より遅い場合はフレームスキップ
            renderQueue: new Set(),
            isRenderingPaused: false,
            memoryMonitorInterval: null,
            lastMemoryCheck: 0,
            performanceMetrics: {
                frameCount: 0,
                totalRenderTime: 0,
                avgRenderTime: 0,
                droppedFrames: 0
            }
        };
        
        // レンダリング最適化
        this.optimizeRenderingPerformance();
        
        // メモリ監視開始
        this.startMemoryMonitoring();
        
        // DOM観察最適化
        this.optimizeDOMUpdates();
        
        console.log('✅ パフォーマンス最適化システム初期化完了');
    }

    // レンダリング最適化
    optimizeRenderingPerformance() {
        const system = this.performanceSystem;
        
        // レンダリングキュー管理
        this.processRenderQueue = () => {
            if (system.isRenderingPaused || system.renderQueue.size === 0) return;
            
            const startTime = performance.now();
            let processedCount = 0;
            const maxProcessPerFrame = 5; // 1フレームで最大5つの要素まで処理
            
            for (const characterId of system.renderQueue) {
                if (processedCount >= maxProcessPerFrame) break;
                
                // ハンドル位置更新の最適化実行
                this.updateHandlesPosition(characterId);
                system.renderQueue.delete(characterId);
                processedCount++;
            }
            
            const renderTime = performance.now() - startTime;
            
            // パフォーマンスメトリクス更新
            system.performanceMetrics.frameCount++;
            system.performanceMetrics.totalRenderTime += renderTime;
            system.performanceMetrics.avgRenderTime = 
                system.performanceMetrics.totalRenderTime / system.performanceMetrics.frameCount;
            
            // フレーム時間が閾値を超える場合
            if (renderTime > system.frameSkipThreshold) {
                system.performanceMetrics.droppedFrames++;
                console.warn(`⚡ フレーム処理時間超過: ${renderTime.toFixed(2)}ms`);
            }
            
            // 次のフレームでの処理をスケジュール
            if (system.renderQueue.size > 0) {
                requestAnimationFrame(this.processRenderQueue);
            }
        };
        
        // 最適化されたハンドル更新
        this.optimizedUpdateHandles = (characterId) => {
            system.renderQueue.add(characterId);
            if (system.renderQueue.size === 1) {
                requestAnimationFrame(this.processRenderQueue);
            }
        };
    }

    // メモリ監視システム
    startMemoryMonitoring() {
        const system = this.performanceSystem;
        
        system.memoryMonitorInterval = setInterval(() => {
            // メモリ使用量チェック（利用可能な場合のみ）
            if (performance.memory) {
                const memory = performance.memory;
                const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
                const limitMB = (memory.jsHeapSizeLimit / 1048576).toFixed(2);
                const usage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
                
                // メモリ使用率が80%を超える場合の警告
                if (usage > 80) {
                    console.warn(`⚠️ メモリ使用率高: ${usage.toFixed(1)}% (${usedMB}MB/${limitMB}MB)`);
                    this.performGarbageCollection();
                }
                
                // ツールバーに表示（5秒ごと）
                const now = Date.now();
                if (now - system.lastMemoryCheck > 5000) {
                    this.updateToolbarStatus(`Mem: ${usedMB}MB (${usage.toFixed(0)}%)`);
                    system.lastMemoryCheck = now;
                }
            }
            
            // 非アクティブな要素のクリーンアップ
            this.cleanupInactiveElements();
            
        }, 2000); // 2秒ごとにチェック
    }

    // ガベージコレクション実行
    performGarbageCollection() {
        console.log('🧹 メモリ最適化実行中...');
        
        // 未使用のBlobURLクリーンアップ
        if (typeof vfsAPI !== 'undefined') {
            vfsAPI.clearUnusedCache();
        }
        
        // DOM要素の不要な参照削除
        const unusedElements = document.querySelectorAll('.alignment-guide');
        unusedElements.forEach(el => el.remove());
        
        // 非表示ハンドルの最適化
        if (this.handleContainers) {
            for (const [characterId, handleData] of this.handleContainers) {
                if (handleData.container.style.display === 'none') {
                    // 非表示の場合はDOMから一時的に削除（必要時に再作成）
                    if (handleData.container.parentElement) {
                        handleData.container.remove();
                        handleData.detached = true;
                    }
                }
            }
        }
        
        // パフォーマンスメトリクスリセット
        this.performanceSystem.performanceMetrics = {
            frameCount: 0,
            totalRenderTime: 0,
            avgRenderTime: 0,
            droppedFrames: 0
        };
        
        console.log('✅ メモリ最適化完了');
    }

    // DOM更新最適化
    optimizeDOMUpdates() {
        // 頻繁な DOM 更新をバッチ化
        this.pendingDOMUpdates = new Map();
        this.domUpdateScheduled = false;
        
        this.batchDOMUpdate = (elementId, property, value) => {
            if (!this.pendingDOMUpdates.has(elementId)) {
                this.pendingDOMUpdates.set(elementId, {});
            }
            
            this.pendingDOMUpdates.get(elementId)[property] = value;
            
            if (!this.domUpdateScheduled) {
                this.domUpdateScheduled = true;
                requestAnimationFrame(() => {
                    this.flushDOMUpdates();
                    this.domUpdateScheduled = false;
                });
            }
        };
        
        this.flushDOMUpdates = () => {
            for (const [elementId, updates] of this.pendingDOMUpdates) {
                const element = document.getElementById(elementId);
                if (element) {
                    for (const [property, value] of Object.entries(updates)) {
                        if (property.startsWith('style.')) {
                            const styleProp = property.substring(6);
                            element.style[styleProp] = value;
                        } else {
                            element[property] = value;
                        }
                    }
                }
            }
            this.pendingDOMUpdates.clear();
        };
    }

    // 非アクティブ要素クリーンアップ
    cleanupInactiveElements() {
        // 5分間操作がない要素を一時的に非アクティブ化
        const inactiveThreshold = 5 * 60 * 1000; // 5分
        const now = Date.now();
        
        if (this.handleContainers) {
            for (const [characterId, handleData] of this.handleContainers) {
                if (handleData.lastActivity && (now - handleData.lastActivity) > inactiveThreshold) {
                    if (handleData.container.style.display !== 'none') {
                        // 非アクティブなハンドルを非表示
                        handleData.container.style.display = 'none';
                        console.log(`😴 ${characterId} ハンドル非アクティブ化`);
                    }
                }
            }
        }
        
        // 古いフィードバック要素削除
        const feedbacks = document.querySelectorAll('#position-feedback');
        feedbacks.forEach(feedback => {
            if (feedback.hideTimer && (now - feedback.created) > 10000) { // 10秒経過
                feedback.remove();
            }
        });
    }

    // 最適化されたハンドル位置更新
    updateHandlesPosition(characterId, force = false) {
        const canvas = this.canvasElements.get(characterId);
        const handleData = this.handleContainers?.get(characterId);
        
        if (!canvas || !handleData) return;
        
        // パフォーマンス最適化：フォース更新でない場合はキューに追加
        if (!force && this.performanceSystem && !this.performanceSystem.isRenderingPaused) {
            this.optimizedUpdateHandles(characterId);
            return;
        }
        
        // 分離されたハンドルの再接続
        if (handleData.detached && handleData.container.parentElement === null) {
            document.body.appendChild(handleData.container);
            handleData.detached = false;
        }
        
        const rect = canvas.getBoundingClientRect();
        const container = handleData.container;
        
        // バッチDOM更新使用
        if (this.batchDOMUpdate) {
            this.batchDOMUpdate(container.id, 'style.left', rect.left + 'px');
            this.batchDOMUpdate(container.id, 'style.top', rect.top + 'px');
            this.batchDOMUpdate(container.id, 'style.width', rect.width + 'px');
            this.batchDOMUpdate(container.id, 'style.height', rect.height + 'px');
        } else {
            // フォールバック：直接更新
            container.style.left = rect.left + 'px';
            container.style.top = rect.top + 'px';
            container.style.width = rect.width + 'px';
            container.style.height = rect.height + 'px';
        }
        
        // 最終アクティビティ時間更新
        handleData.lastActivity = Date.now();
    }

    // パフォーマンス一時停止/再開
    pausePerformanceOptimization() {
        if (this.performanceSystem) {
            this.performanceSystem.isRenderingPaused = true;
            console.log('⏸️ パフォーマンス最適化一時停止');
        }
    }

    resumePerformanceOptimization() {
        if (this.performanceSystem) {
            this.performanceSystem.isRenderingPaused = false;
            if (this.performanceSystem.renderQueue.size > 0) {
                requestAnimationFrame(this.processRenderQueue);
            }
            console.log('▶️ パフォーマンス最適化再開');
        }
    }

    // パフォーマンス統計取得
    getPerformanceStats() {
        if (!this.performanceSystem) return null;
        
        const stats = { ...this.performanceSystem.performanceMetrics };
        stats.renderQueueSize = this.performanceSystem.renderQueue.size;
        stats.activeHandles = this.handleContainers ? this.handleContainers.size : 0;
        stats.memoryUsage = performance.memory ? 
            `${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)}MB` : 'N/A';
        
        return stats;
    }

    // パフォーマンスレポート表示
    showPerformanceReport() {
        const stats = this.getPerformanceStats();
        if (!stats) {
            this.showTemporaryMessage('パフォーマンス統計が利用できません', '#f44336');
            return;
        }
        
        const report = `
パフォーマンス統計:
• 平均レンダリング時間: ${stats.avgRenderTime.toFixed(2)}ms
• 処理フレーム数: ${stats.frameCount}
• ドロップフレーム: ${stats.droppedFrames}
• レンダリングキュー: ${stats.renderQueueSize}
• アクティブハンドル: ${stats.activeHandles}
• メモリ使用量: ${stats.memoryUsage}
        `.trim();
        
        console.log('📊 パフォーマンスレポート:\n' + report);
        this.updateToolbarStatus('パフォーマンスレポートをコンソールで確認');
    }

    // クリーンアップ
    cleanup() {
        console.log('🧹 SpineIntegrationManager クリーンアップ開始');
        
        // パフォーマンス最適化システムクリーンアップ
        if (this.performanceSystem) {
            if (this.performanceSystem.memoryMonitorInterval) {
                clearInterval(this.performanceSystem.memoryMonitorInterval);
            }
            clearTimeout(this.statusResetTimer);
            this.performanceSystem = null;
            console.log('🧹 パフォーマンス最適化システムクリーンアップ完了');
        }
        
        // Spineインスタンスのレンダリング停止
        for (const [characterId, instance] of this.spineInstances) {
            if (instance.cleanup) {
                console.log(`🛑 ${characterId} レンダリング停止`);
                instance.cleanup();
            }
        }
        
        // VFS Blob URLクリーンアップ
        if (typeof vfsAPI !== 'undefined') {
            vfsAPI.clearCache();
            console.log('🗂️ VFS キャッシュクリア完了');
        }
        
        // Canvas要素削除
        for (const [characterId, canvas] of this.canvasElements) {
            console.log(`🗑️ ${characterId} Canvas削除`);
            canvas.remove();
        }
        
        // ハンドルシステムクリーンアップ
        if (this.handleContainers) {
            for (const [characterId, handleData] of this.handleContainers) {
                handleData.container.remove();
            }
            this.handleContainers.clear();
        }
        
        // グリッドシステムクリーンアップ
        if (this.gridSystem && this.gridSystem.container) {
            this.gridSystem.container.remove();
        }
        
        // 複数選択UIクリーンアップ
        const multiUI = document.getElementById('multi-selection-ui');
        if (multiUI) {
            multiUI.remove();
        }
        
        // プロフェッショナルツールバークリーンアップ
        if (this.professionalToolbar) {
            this.professionalToolbar.remove();
        }
        
        const quickToolbar = document.getElementById('quick-toolbar');
        if (quickToolbar) {
            quickToolbar.remove();
        }
        
        // フィードバック要素クリーンアップ
        const feedback = document.getElementById('position-feedback');
        if (feedback) {
            feedback.remove();
        }
        
        // 整列ガイドクリーンアップ
        const guides = document.querySelectorAll('.alignment-guide');
        guides.forEach(guide => guide.remove());
        
        // スタイル要素クリーンアップ
        const tempStyle = document.getElementById('temp-message-style');
        if (tempStyle) {
            tempStyle.remove();
        }
        
        // データ構造クリア
        this.spineInstances.clear();
        this.canvasElements.clear();
        this.editSystems.clear();
        
        if (this.multiSelectSystem) {
            this.multiSelectSystem.selectedCharacters.clear();
            this.multiSelectSystem = null;
        }
        
        // WebGLコンテキストの解放
        if (this.previewContainer) {
            const canvases = this.previewContainer.querySelectorAll('canvas');
            canvases.forEach(canvas => {
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (gl && gl.getExtension('WEBGL_lose_context')) {
                    gl.getExtension('WEBGL_lose_context').loseContext();
                    console.log('🔌 WebGLコンテキスト解放');
                }
            });
        }
        
        console.log('✅ SpineIntegrationManager クリーンアップ完了');
    }
    
    // WYSIWYG: プレビューにキャラクター追加
    addCharacterToPreview(characterName, position, targetDoc) {
        console.log('🎭 WYSIWYG キャラクター配置:', characterName, position);
        
        try {
            const characterData = this.characters.get(characterName);
            if (!characterData) {
                console.error('❌ キャラクターデータが見つかりません:', characterName);
                return;
            }
            
            // HTML内にSpineキャラクター要素を作成
            const characterElement = targetDoc.createElement('div');
            characterElement.id = `spine-character-${characterName}`;
            characterElement.className = 'spine-character-wysiwyg';
            characterElement.style.cssText = `
                position: absolute;
                left: ${position.x}px;
                top: ${position.y}px;
                width: 200px;
                height: 300px;
                z-index: 1000;
                cursor: move;
                border: 2px dashed #007acc;
                background: rgba(0, 122, 204, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
                color: #007acc;
                font-weight: bold;
            `;
            
            characterElement.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 16px;">🎭</div>
                    <div style="font-size: 12px; margin-top: 4px;">${characterName}</div>
                    <div style="font-size: 10px; opacity: 0.7; margin-top: 2px;">WYSIWYG Mode</div>
                </div>
            `;
            
            // ドラッグ移動機能
            this.makeElementDraggable(characterElement);
            
            // HTML body に追加
            targetDoc.body.appendChild(characterElement);
            
            console.log('✅ WYSIWYG キャラクター配置完了');
            
        } catch (error) {
            console.error('❌ WYSIWYG キャラクター配置エラー:', error);
        }
    }
    
    // 要素をドラッグ可能にする
    makeElementDraggable(element) {
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        
        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = element.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            element.style.cursor = 'grabbing';
            element.style.opacity = '0.8';
            
            console.log('🎯 WYSIWYG ドラッグ開始');
        });
        
        element.ownerDocument.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            
            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
        });
        
        element.ownerDocument.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'move';
                element.style.opacity = '1';
                console.log('✅ WYSIWYG ドラッグ完了');
            }
        });
    }
    
    // WYSIWYG: 特定のキャンバスにキャラクターレンダリング
    renderCharacterToCanvas(characterName, canvasElement) {
        console.log('🎮 キャンバスレンダリング開始:', characterName);
        
        try {
            const characterData = this.characters.get(characterName);
            if (!characterData) {
                console.error('❌ キャラクターデータが見つかりません:', characterName);
                return false;
            }
            
            // WebGLコンテキスト取得
            const gl = canvasElement.getContext('webgl') || canvasElement.getContext('experimental-webgl');
            if (!gl) {
                console.warn('⚠️ WebGL未対応 - 2Dフォールバック');
                return this.render2DFallback(characterName, canvasElement);
            }
            
            console.log('✅ WebGL対応確認済み');
            
            // Spine WebGL レンダラー初期化
            if (window.spine && characterData.spineInstance) {
                this.initializeSpineRenderer(gl, characterData.spineInstance, canvasElement);
                return true;
            } else {
                console.warn('⚠️ Spineインスタンス未準備 - 2Dフォールバック');
                return this.render2DFallback(characterName, canvasElement);
            }
            
        } catch (error) {
            console.error('❌ キャンバスレンダリングエラー:', error);
            return this.render2DFallback(characterName, canvasElement);
        }
    }
    
    // 2Dフォールバックレンダリング
    render2DFallback(characterName, canvasElement) {
        console.log('🎨 2Dフォールバックレンダリング:', characterName);
        
        const ctx = canvasElement.getContext('2d');
        if (!ctx) {
            console.error('❌ 2Dコンテキスト取得失敗');
            return false;
        }
        
        // キャンバスクリア
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        
        // 背景
        ctx.fillStyle = 'rgba(0, 122, 204, 0.1)';
        ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        
        // キャラクター表示（2D）
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 絵文字
        ctx.font = '48px Arial';
        ctx.fillStyle = '#007acc';
        ctx.fillText('🎭', canvasElement.width/2, canvasElement.height/2 - 30);
        
        // キャラクター名
        ctx.font = '14px Arial';
        ctx.fillStyle = '#007acc';
        ctx.fillText(characterName, canvasElement.width/2, canvasElement.height/2 + 20);
        
        // ステータス
        ctx.font = '10px Arial';
        ctx.fillStyle = 'rgba(0, 122, 204, 0.7)';
        ctx.fillText('2D Mode', canvasElement.width/2, canvasElement.height/2 + 40);
        
        console.log('✅ 2Dフォールバック完了');
        return true;
    }
    
    // Spine WebGL レンダラー初期化
    initializeSpineRenderer(gl, spineInstance, canvasElement) {
        console.log('⚡ Spine WebGL レンダラー初期化');
        
        try {
            let renderer = null;
            
            // 新しいAPI（spine-webgl 4.0+）
            if (window.spine.webgl && window.spine.webgl.SceneRenderer) {
                renderer = new window.spine.webgl.SceneRenderer(canvasElement, gl);
                console.log('✅ 新WYSIWYG API使用: spine.webgl.SceneRenderer');
            }
            // 旧API（spine-webgl 3.8系）
            else if (window.spine.WebGLRenderer) {
                renderer = new window.spine.WebGLRenderer(gl);
                console.log('✅ 旧WYSIWYG API使用: spine.WebGLRenderer');
            }
            // 代替API
            else if (window.spine.SceneRenderer) {
                renderer = new window.spine.SceneRenderer(canvasElement, gl);
                console.log('✅ 代替WYSIWYG API使用: spine.SceneRenderer');
            }
            else {
                console.error('❌ WYSIWYG: 利用可能なSpine WebGL Rendererが見つかりません');
                console.log('🔍 WYSIWYG利用可能なSpine API:', Object.keys(window.spine || {}));
                return false;
            }
            
            // シーン設定
            if (renderer.scene) {
                renderer.scene.skeleton = spineInstance.skeleton;
                renderer.scene.animationState = spineInstance.state;
            } else if (renderer.drawSkeletons) {
                // 旧API用の設定
                renderer.skeletonRenderer.premultipliedAlpha = true;
            }
            
            // 描画ループ開始
            this.startRenderLoop(renderer, canvasElement);
            
            console.log('✅ Spine WebGL レンダラー初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ Spine WebGL 初期化エラー:', error);
            return false;
        }
    }
    
    // 描画ループ
    startRenderLoop(renderer, canvasElement) {
        const renderFrame = (timestamp) => {
            if (!canvasElement.isConnected) {
                console.log('🔚 キャンバス削除 - 描画ループ終了');
                return;
            }
            
            try {
                // 新API用の描画
                if (renderer.camera && renderer.draw) {
                    renderer.camera.setViewport(canvasElement.width, canvasElement.height);
                    renderer.draw();
                }
                // 旧API用の描画
                else if (renderer.drawSkeletons) {
                    const gl = renderer.gl;
                    gl.viewport(0, 0, canvasElement.width, canvasElement.height);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    
                    // 必要に応じてスケルトン描画
                    if (renderer.scene && renderer.scene.skeleton) {
                        renderer.drawSkeletons([renderer.scene.skeleton]);
                    }
                }
                
                requestAnimationFrame(renderFrame);
            } catch (error) {
                console.error('❌ 描画エラー:', error);
            }
        };
        
        requestAnimationFrame(renderFrame);
        console.log('🔄 描画ループ開始');
    }
}

// グローバル参照
window.SpineIntegrationManager = SpineIntegrationManager;

console.log('✅ Spine Integration Module 読み込み完了');