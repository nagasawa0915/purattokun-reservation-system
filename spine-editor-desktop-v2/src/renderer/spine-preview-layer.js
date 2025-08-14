/**
 * Spine Preview Layer Module
 * プレビューエリアに重なるSpine専用レイヤーを管理
 * 実際のSpine WebGLキャラクターを表示・編集
 */

import { Utils } from './utils.js';

/**
 * 座標系スワップマネージャー（4層→2層削減）
 * 過去の成功実装：編集時はシンプル座標系、保存時は元座標系に復元
 */
class CoordinateSwapManager {
    constructor() {
        this.backup = new Map(); // 元座標系のバックアップ
        this.isSwapped = new Map(); // スワップ状態管理
    }
    
    /**
     * 編集開始：複雑座標 → シンプル座標（競合排除の核心）
     * @param {string} characterId - キャラクターID
     * @param {Element} overlayElement - オーバーレイ要素
     * @param {object} spineCharacter - Spineキャラクターオブジェクト
     */
    enterEditMode(characterId, overlayElement, spineCharacter) {
        if (!overlayElement || !spineCharacter) return;
        
        // 元の座標系をバックアップ
        this.backup.set(characterId, {
            // オーバーレイ要素の元座標
            overlayLeft: overlayElement.style.left,
            overlayTop: overlayElement.style.top,
            overlayTransform: overlayElement.style.transform,
            // Spineキャラクターの元座標
            spineX: spineCharacter.skeleton.x,
            spineY: spineCharacter.skeleton.y
        });
        
        // 実際の描画位置を取得（DOM座標系）
        const rect = overlayElement.getBoundingClientRect();
        const containerRect = overlayElement.parentElement.getBoundingClientRect();
        
        // シンプル絶対座標に変換（競合排除）
        const simpleX = rect.left - containerRect.left;
        const simpleY = rect.top - containerRect.top;
        
        // オーバーレイをシンプル座標系に変換
        overlayElement.style.left = `${simpleX}px`;
        overlayElement.style.top = `${simpleY}px`;
        overlayElement.style.transform = 'translate(-50%, -50%)'; // 統一変換のみ
        
        this.isSwapped.set(characterId, true);
        
        console.log(`🔄 座標系スワップ開始: ${characterId} → シンプル座標(${simpleX.toFixed(1)}, ${simpleY.toFixed(1)})`);
    }
    
    /**
     * 編集終了：シンプル座標 → 元座標系（互換性確保）
     * @param {string} characterId - キャラクターID
     * @param {Element} overlayElement - オーバーレイ要素
     * @param {object} spineCharacter - Spineキャラクターオブジェクト
     */
    exitEditMode(characterId, overlayElement, spineCharacter) {
        if (!overlayElement || !spineCharacter || !this.isSwapped.get(characterId)) return;
        
        const backup = this.backup.get(characterId);
        if (backup) {
            // 元の座標形式に復元
            overlayElement.style.left = backup.overlayLeft;
            overlayElement.style.top = backup.overlayTop;
            overlayElement.style.transform = backup.overlayTransform;
            
            // Spine座標も同期（必要に応じて）
            // spineCharacter.skeleton.x = backup.spineX;
            // spineCharacter.skeleton.y = backup.spineY;
        }
        
        this.isSwapped.delete(characterId);
        this.backup.delete(characterId);
        
        console.log(`✅ 座標系スワップ終了: ${characterId} → 元座標系復元`);
    }
    
    /**
     * 現在編集中かどうかを確認
     * @param {string} characterId - キャラクターID
     * @returns {boolean} 編集中かどうか
     */
    isInEditMode(characterId) {
        return this.isSwapped.get(characterId) || false;
    }
    
    /**
     * 全ての座標系スワップを解除
     */
    clearAll() {
        this.isSwapped.clear();
        this.backup.clear();
    }
}

export class SpinePreviewLayer {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.context = null;
        this.renderer = null;
        this.characters = new Map();
        this.spineLoaded = false;
        this.isRenderingActive = false;
        
        // ドラッグ&ドロップ機能用プロパティ
        this.isDragging = false;
        this.selectedCharacterId = null;
        this.dragStartPoint = { x: 0, y: 0 };
        
        // Phase 2: 視覚的フィードバック機能用プロパティ
        this.hoveredCharacterId = null;
        this.visualOverlays = new Map(); // キャラクター選択状態表示用
        
        // 🎯 座標系スワップ技術（4層→2層削減）
        this.coordinateSwap = new CoordinateSwapManager();
        
    }

    /**
     * Spine専用レイヤーを初期化
     * @param {Element} previewContainer - プレビューコンテナ要素
     */
    async initialize(previewContainer) {
        if (!previewContainer) {
            console.error('❌ Preview container not found');
            return false;
        }

        this.container = previewContainer;
        
        try {
            // Spine WebGL読み込み
            await this.loadSpineWebGL();
            
            // Canvasレイヤー作成
            this.createCanvasLayer();
            
            // Spine初期化
            this.initializeSpineRenderer();
            
            this.spineLoaded = true;
            console.log('✅ SpinePreviewLayer初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ SpinePreviewLayer初期化失敗:', error);
            return false;
        }
    }

    /**
     * Spine WebGLライブラリを読み込み
     */
    async loadSpineWebGL() {
        if (window.spine) {
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@esotericsoftware/spine-webgl@4.1.24/dist/iife/spine-webgl.js';
            script.onload = () => {
                this.waitForSpine().then(resolve).catch(reject);
            };
            script.onerror = () => {
                reject(new Error('Spine WebGL CDN読み込み失敗'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Spine WebGL読み込み待ち
     */
    async waitForSpine() {
        return new Promise((resolve, reject) => {
            let checkCount = 0;
            const maxChecks = 50;

            const checkSpine = () => {
                checkCount++;
                if (typeof spine !== "undefined" && spine.AssetManager) {
                    resolve();
                } else if (checkCount >= maxChecks) {
                    reject(new Error("Spine WebGL読み込みタイムアウト"));
                } else {
                    setTimeout(checkSpine, 100);
                }
            };

            checkSpine();
        });
    }

    /**
     * Canvasレイヤーを作成
     */
    createCanvasLayer() {
        // Canvas要素作成
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'spine-preview-canvas';
        
        // 🎯 座標系統一: 実サイズと表示サイズを一致させる
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;   // 実サイズ = 表示サイズ
        this.canvas.height = rect.height;
        
        // Canvas スタイル設定
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: auto;
            z-index: 10;
            background: transparent;
        `;

        // コンテナに追加
        this.container.style.position = 'relative';
        this.container.appendChild(this.canvas);
        
        // ドラッグ&ドロップイベントハンドラー設定
        this.setupDragAndDropEvents();
        
        // Phase 2: 視覚的フィードバックイベント設定
        this.setupVisualFeedbackEvents();

        // WebGLコンテキスト取得
        this.context = this.canvas.getContext("webgl", { 
            alpha: true, 
            premultipliedAlpha: false 
        });

        if (!this.context) {
            throw new Error("WebGL未対応");
        }

    }

    /**
     * Spineレンダラー初期化
     */
    initializeSpineRenderer() {
        if (!this.context) {
            throw new Error("WebGLコンテキストが未初期化");
        }

        this.renderer = new spine.SceneRenderer(this.canvas, this.context);
    }

    /**
     * Spineキャラクターを追加
     * @param {object} characterData - キャラクターデータ
     * @param {number} x - X座標（マウスクライアント座標）
     * @param {number} y - Y座標（マウスクライアント座標）
     * @returns {Promise<object>} 追加結果
     */
    async addCharacter(characterData, x, y) {
        if (!this.spineLoaded) {
            throw new Error("Spine not loaded");
        }

        try {
            const characterId = Utils.generateId('spine-character');
            
            
            // アセット読み込み
            const spineData = await this.loadSpineAssets(characterData);
            
            // スケルトン作成
            const skeleton = new spine.Skeleton(spineData.skeletonData);
            
            // 🎯 座標変換: マウス座標をCanvas座標系に変換
            let canvasX, canvasY;
            
            if (x && y) {
                // マウス座標をCanvas座標に変換
                const canvasCoords = this.clientToCanvasCoordinates(x, y);
                canvasX = canvasCoords.x;
                canvasY = canvasCoords.y;
            } else {
                // デフォルト位置（Canvas中央）
                canvasX = this.canvas.width / 2;
                canvasY = this.canvas.height / 2;
            }
            
            skeleton.x = canvasX;
            skeleton.y = canvasY;
            skeleton.scaleX = skeleton.scaleY = 0.5;
            
            // アニメーション設定
            const animationStateData = new spine.AnimationStateData(spineData.skeletonData);
            const animationState = new spine.AnimationState(animationStateData);
            
            // 最初のアニメーション設定
            if (spineData.skeletonData.animations.length > 0) {
                const firstAnimation = spineData.skeletonData.animations[0].name;
                animationState.setAnimation(0, firstAnimation, true);
            }

            // キャラクター登録
            const character = {
                id: characterId,
                name: characterData.name,
                skeleton: skeleton,
                animationState: animationState,
                data: characterData,
                position: { x: canvasX, y: canvasY },
                scale: 0.5
            };

            this.characters.set(characterId, character);
            
            // Phase 2: 視覚フィードバック要素作成
            this.createVisualOverlay(characterId);

            // レンダリング開始
            this.startRenderLoop();

            
            return {
                success: true,
                characterId: characterId,
                character: character
            };

        } catch (error) {
            console.error('❌ Spineキャラクター追加失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Spineアセットを読み込み
     * @param {object} characterData - キャラクターデータ
     * @returns {Promise<object>} スケルトンデータ
     */
    async loadSpineAssets(characterData) {
        const basePath = `./assets/spine/characters/${characterData.name}/`;
        const assetManager = new spine.AssetManager(this.context, basePath);
        
        // アセットファイル読み込み
        assetManager.loadTextureAtlas(`${characterData.name}.atlas`);
        assetManager.loadJson(`${characterData.name}.json`);
        
        // 読み込み完了待ち
        await this.waitForAssets(assetManager);
        
        // スケルトンデータ構築
        const atlas = assetManager.get(`${characterData.name}.atlas`);
        const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
        const skeletonJson = new spine.SkeletonJson(atlasLoader);
        const skeletonData = skeletonJson.readSkeletonData(
            assetManager.get(`${characterData.name}.json`)
        );
        
        return { skeletonData, assetManager };
    }

    /**
     * アセット読み込み待ち
     * @param {spine.AssetManager} assetManager - アセットマネージャー
     */
    async waitForAssets(assetManager) {
        return new Promise((resolve, reject) => {
            let checkCount = 0;
            const maxChecks = 100;

            const checkAssets = () => {
                checkCount++;
                if (assetManager.isLoadingComplete()) {
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

    /**
     * レンダリングループを開始
     */
    startRenderLoop() {
        if (this.isRenderingActive || this.characters.size === 0) {
            return;
        }

        this.isRenderingActive = true;
        let lastTime = Date.now() / 1000;

        const render = () => {
            if (this.characters.size === 0) {
                this.isRenderingActive = false;
                return;
            }

            const now = Date.now() / 1000;
            const delta = now - lastTime;
            lastTime = now;

            // Canvas クリア
            this.context.clearColor(0, 0, 0, 0);
            this.context.clear(this.context.COLOR_BUFFER_BIT);
            this.context.viewport(0, 0, this.canvas.width, this.canvas.height);

            this.renderer.begin();

            // 全キャラクターを描画
            this.characters.forEach(character => {
                // アニメーション更新
                character.animationState.update(delta);
                character.animationState.apply(character.skeleton);
                character.skeleton.updateWorldTransform();

                // 描画
                this.renderer.drawSkeleton(character.skeleton, true);
            });

            this.renderer.end();

            requestAnimationFrame(render);
        };

        render();
    }

    /**
     * キャラクター位置更新（Spine座標系統一）
     * @param {string} characterId - キャラクターID
     * @param {number} x - 新しいX座標（Canvas座標系）
     * @param {number} y - 新しいY座標（Canvas座標系）
     */
    updateCharacterPosition(characterId, x, y) {
        if (!characterId) {
            console.error('❌ キャラクターID未指定');
            return;
        }
        
        // 座標の妥当性チェック
        if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
            console.error('❌ 無効な座標値:', { characterId, x, y });
            return;
        }
        
        const character = this.characters.get(characterId);
        if (!character) {
            console.error('❌ キャラクターが見つかりません:', characterId);
            return;
        }
        
        try {
            if (character.skeleton) {
                // 🎯 座標系統一: skeleton(0,0) = Canvas中央として位置更新
                character.skeleton.x = x;
                character.skeleton.y = y;
                console.log("🎯 キャラクター位置更新: " + characterId + " → Spine座標(" + x.toFixed(1) + ", " + y.toFixed(1) + ")");
            }
            
            if (character.position) {
                character.position.x = x;
                character.position.y = y;
            }
            
            // Phase 2: ドラッグ中のオーバーレイ位置更新
            this.updateOverlayPosition(characterId);
            
        } catch (error) {
            console.error('❌ キャラクター位置更新エラー:', characterId, error);
        }
    }

    /**
     * キャラクタースケール更新
     * @param {string} characterId - キャラクターID
     * @param {number} scale - 新しいスケール
     */
    updateCharacterScale(characterId, scale) {
        const character = this.characters.get(characterId);
        if (character) {
            character.skeleton.scaleX = character.skeleton.scaleY = scale;
            character.scale = scale;
        }
    }

    /**
     * キャラクター削除
     * @param {string} characterId - キャラクターID
     */
    removeCharacter(characterId) {
        if (this.characters.has(characterId)) {
            this.characters.delete(characterId);
            
            // Phase 2: 視覚フィードバック要素削除
            this.removeVisualOverlay(characterId);
            
            
            if (this.characters.size === 0) {
                this.clearCanvas();
            }
        }
    }

    /**
     * Canvas クリア
     */
    clearCanvas() {
        if (this.context) {
            this.context.clearColor(0, 0, 0, 0);
            this.context.clear(this.context.COLOR_BUFFER_BIT);
        }
        this.isRenderingActive = false;
    }

    /**
     * 全キャラクター削除
     */
    clearAllCharacters() {
        this.characters.clear();
        
        // Phase 2: 全視覚フィードバック要素削除
        this.clearAllVisualOverlays();
        
        this.clearCanvas();
    }

    /**
     * マウス座標をCanvas座標に変換（Y軸反転対応）
     * @param {number} clientX - マウスのクライアントX座標
     * @param {number} clientY - マウスのクライアントY座標
     * @returns {object} Canvas座標 {x, y}
     */
    /**
     * マウス座標をCanvas座標に変換（Spine WebGL座標系対応）
     * @param {number} clientX - マウスのクライアントX座標
     * @param {number} clientY - マウスのクライアントY座標
     * @returns {object} Canvas座標 {x, y}
     */
    clientToCanvasCoordinates(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        
        // 🚨 緊急修正: Spine WebGL座標系に対応
        const canvasX = clientX - rect.left;
        const canvasY = this.canvas.height - (clientY - rect.top);  // Y軸反転（Spine WebGL形式）
        
        console.log("🎯 座標変換: マウス(" + clientX + ", " + clientY + ") → Canvas(" + canvasX.toFixed(1) + ", " + canvasY.toFixed(1) + ")");
        console.log("🎯 Canvas情報: size(" + this.canvas.width + "x" + this.canvas.height + "), rect(" + rect.left.toFixed(1) + ", " + rect.top.toFixed(1) + ")");
        
        return { x: canvasX, y: canvasY };
    }

    /**
     * ドラッグ&ドロップイベントハンドラーを設定
     */
    setupDragAndDropEvents() {
        if (!this.canvas) {
            console.error('❌ Canvas未初期化: ドラッグイベント設定失敗');
            return;
        }

        // マウスダウンイベント
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        
        // マウスムーブイベント（ドキュメント全体で監視）
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        // マウスアップイベント（ドキュメント全体で監視）
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
    }

    /**
     * マウスダウンイベントハンドラー
     * @param {MouseEvent} event - マウスイベント
     */
    handleMouseDown(event) {
        if (!this.canvas || this.characters.size === 0) {
            return;
        }

        // Canvas座標に変換
        const canvasCoords = this.clientToCanvasCoordinates(event.clientX, event.clientY);
        
        // キャラクター選択判定
        const selectedCharacter = this.getCharacterAtPosition(canvasCoords.x, canvasCoords.y);
        
        if (selectedCharacter) {
            this.isDragging = true;
            this.selectedCharacterId = selectedCharacter.id;
            this.dragStartPoint = {
                x: canvasCoords.x,
                y: canvasCoords.y
            };
            
            // 🎯 座標系スワップ開始（競合排除の核心）
            const overlayElement = this.visualOverlays.get(selectedCharacter.id);
            if (overlayElement) {
                this.coordinateSwap.enterEditMode(
                    selectedCharacter.id, 
                    overlayElement, 
                    selectedCharacter
                );
            }
            
            // カーソル変更
            this.canvas.style.cursor = 'grabbing';
            
            // Phase 2: 選択状態の視覚化
            this.updateVisualFeedback();
            
            console.log(`🎯 DRAG START: ${selectedCharacter.name} at (${canvasCoords.x.toFixed(1)}, ${canvasCoords.y.toFixed(1)})`);
            console.log(`👆 SELECTED: ${selectedCharacter.name} (${selectedCharacter.id})`);
        }
    }

    /**
     * マウスムーブイベントハンドラー（座標系スワップ対応）
     * @param {MouseEvent} event - マウスイベント
     */
    handleMouseMove(event) {
        if (!this.isDragging || !this.selectedCharacterId || !this.canvas) {
            return;
        }

        // 🎯 座標系スワップ適用中：シンプル座標系で操作
        const canvasCoords = this.clientToCanvasCoordinates(event.clientX, event.clientY);
        
        // 選択中キャラクターの位置更新
        this.updateCharacterPosition(this.selectedCharacterId, canvasCoords.x, canvasCoords.y);
        
        // 編集中はオーバーレイもDOM座標系で更新
        if (this.coordinateSwap.isInEditMode(this.selectedCharacterId)) {
            const overlayElement = this.visualOverlays.get(this.selectedCharacterId);
            if (overlayElement) {
                // Spine WebGL座標をDOM座標に変換
                const domY = this.canvas.height - canvasCoords.y;
                overlayElement.style.left = `${canvasCoords.x}px`;
                overlayElement.style.top = `${domY}px`;
                console.log("🎯 オーバーレイ更新: ドラッグ中 → DOM座標(" + canvasCoords.x.toFixed(1) + ", " + domY.toFixed(1) + ")");
            }
        }
    }

    /**
     * マウスアップイベントハンドラー（座標系スワップ解除）
     * @param {MouseEvent} event - マウスイベント
     */
    handleMouseUp(event) {
        if (this.isDragging && this.selectedCharacterId) {
            // Canvas座標に変換してドラッグ終了ログを出力
            const canvasCoords = this.clientToCanvasCoordinates(event.clientX, event.clientY);
            console.log(`✅ DRAG END: ${this.selectedCharacterId} moved to (${canvasCoords.x.toFixed(1)}, ${canvasCoords.y.toFixed(1)})`);
            
            // 🎯 座標系スワップ解除（互換性確保）
            const selectedCharacter = this.characters.get(this.selectedCharacterId);
            const overlayElement = this.visualOverlays.get(this.selectedCharacterId);
            if (overlayElement && selectedCharacter) {
                this.coordinateSwap.exitEditMode(
                    this.selectedCharacterId,
                    overlayElement,
                    selectedCharacter
                );
            }
            
            // ドラッグ状態リセット
            this.isDragging = false;
            this.selectedCharacterId = null;
            this.dragStartPoint = { x: 0, y: 0 };
            
            // カーソルリセット
            if (this.canvas) {
                this.canvas.style.cursor = 'default';
            }
            
            // Phase 2: 選択解除時の視覚フィードバック更新
            this.updateVisualFeedback();
        }
    }

    /**
     * 指定位置にあるキャラクターを取得（円形ヒット判定）
     * @param {number} x - X座標（Canvas座標系）
     * @param {number} y - Y座標（Canvas座標系）
     * @returns {object|null} ヒットしたキャラクター、なければnull
     */
    getCharacterAtPosition(x, y) {
        if (!x && x !== 0 || !y && y !== 0) {
            console.warn('⚠️ 無効な座標:', { x, y });
            return null;
        }

        const hitRadius = 50; // ヒット判定半径（px）
        
        // すべてのキャラクターをチェック（後から追加されたものが優先）
        const characterArray = Array.from(this.characters.values()).reverse();
        
        for (const character of characterArray) {
            try {
                if (!character || !character.skeleton) {
                    continue;
                }
                
                const charX = character.skeleton.x || 0;
                const charY = character.skeleton.y || 0;
                
                // 円形ヒット判定
                const distance = Math.sqrt(
                    Math.pow(x - charX, 2) + Math.pow(y - charY, 2)
                );
                
                if (distance <= hitRadius) {
                    return character;
                }
            } catch (error) {
                console.error('❌ キャラクターヒット判定エラー:', character?.name, error);
                continue;
            }
        }
        
        return null;
    }

    /**
     * リサイズ対応（座標系スワップ技術対応）
     */
    handleResize() {
        if (this.canvas && this.container) {
            const rect = this.container.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            
            if (this.context) {
                this.context.viewport(0, 0, this.canvas.width, this.canvas.height);
            }
            
            // 🎯 座標系スワップ技術：編集中は一時的にスワップ解除→リサイズ→再スワップ
            const editingCharacters = [];
            this.characters.forEach((character, characterId) => {
                if (this.coordinateSwap.isInEditMode(characterId)) {
                    editingCharacters.push({ characterId, character });
                    // 一時的にスワップ解除
                    const overlay = this.visualOverlays.get(characterId);
                    if (overlay) {
                        this.coordinateSwap.exitEditMode(characterId, overlay, character);
                    }
                }
            });
            
            // 全オーバーレイ位置更新
            this.characters.forEach((character, characterId) => {
                this.updateOverlayPosition(characterId);
            });
            
            // 編集中だったキャラクターのスワップを再開
            editingCharacters.forEach(({ characterId, character }) => {
                const overlay = this.visualOverlays.get(characterId);
                if (overlay) {
                    this.coordinateSwap.enterEditMode(characterId, overlay, character);
                }
            });
        }
    }

    /**
     * レイヤーを破棄（座標系スワップ技術対応）
     */
    destroy() {
        this.clearAllCharacters();
        
        // 🎯 座標系スワップ技術：全てのスワップ状態をクリア
        this.coordinateSwap.clearAll();
        
        // イベントリスナー削除
        if (this.canvas) {
            this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        }
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        // ドラッグ状態リセット
        this.isDragging = false;
        this.selectedCharacterId = null;
        this.dragStartPoint = { x: 0, y: 0 };
        
        // Phase 2: 視覚フィードバック要素クリーンアップ
        this.clearAllVisualOverlays();
        this.hoveredCharacterId = null;
        
        // 座標系スワップマネージャークリア
        this.coordinateSwap = null;
        
        this.canvas = null;
        this.context = null;
        this.renderer = null;
        this.container = null;
        this.spineLoaded = false;
        
    }

    // ============================================================================
    // Phase 2: 視覚的フィードバック機能
    // ============================================================================

    /**
     * 視覚的フィードバックイベントを設定
     */
    setupVisualFeedbackEvents() {
        if (!this.canvas) {
            console.error('❌ Canvas未初期化: 視覚フィードバックイベント設定失敗');
            return;
        }

        // マウスホバーイベント（ホバー状態でのカーソル変更）
        this.canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleCanvasMouseLeave.bind(this));
        
    }

    /**
     * Canvas上でのマウスムーブイベントハンドラー（ホバー検出用）
     * @param {MouseEvent} event - マウスイベント
     */
    handleCanvasMouseMove(event) {
        if (this.isDragging) {
            return; // ドラッグ中はホバー処理をスキップ
        }

        const canvasCoords = this.clientToCanvasCoordinates(event.clientX, event.clientY);
        const hoveredCharacter = this.getCharacterAtPosition(canvasCoords.x, canvasCoords.y);
        
        const newHoveredId = hoveredCharacter ? hoveredCharacter.id : null;
        
        if (this.hoveredCharacterId !== newHoveredId) {
            this.hoveredCharacterId = newHoveredId;
            
            // カーソル変更
            if (hoveredCharacter) {
                this.canvas.style.cursor = 'grab';
            } else {
                this.canvas.style.cursor = 'default';
            }
        }
    }

    /**
     * Canvas離脱時のイベントハンドラー
     * @param {MouseEvent} event - マウスイベント
     */
    handleCanvasMouseLeave(event) {
        this.hoveredCharacterId = null;
        if (!this.isDragging) {
            this.canvas.style.cursor = 'default';
        }
    }

    /**
     * 視覚フィードバック用オーバーレイ要素を作成
     * @param {string} characterId - キャラクターID
     */
    createVisualOverlay(characterId) {
        const character = this.characters.get(characterId);
        if (!character || !this.container) {
            return;
        }

        // オーバーレイ要素作成
        const overlay = document.createElement('div');
        overlay.id = `spine-overlay-${characterId}`;
        overlay.className = 'spine-character-overlay';
        
        // 基本スタイル設定
        overlay.style.cssText = `
            position: absolute;
            width: 100px;
            height: 100px;
            border: 2px solid transparent;
            border-radius: 50%;
            pointer-events: none;
            z-index: 15;
            background: transparent;
            transition: border-color 0.2s ease;
            transform: translate(-50%, -50%);
        `;

        this.container.appendChild(overlay);
        this.visualOverlays.set(characterId, overlay);
        
        // 初期位置更新
        this.updateOverlayPosition(characterId);
        
    }

    /**
     * 視覚フィードバック用オーバーレイ要素を削除
     * @param {string} characterId - キャラクターID
     */
    removeVisualOverlay(characterId) {
        const overlay = this.visualOverlays.get(characterId);
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
            this.visualOverlays.delete(characterId);
        }
    }

    /**
     * 全視覚フィードバック要素をクリア
     */
    clearAllVisualOverlays() {
        this.visualOverlays.forEach((overlay, characterId) => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });
        this.visualOverlays.clear();
    }

    /**
     * オーバーレイの位置を更新（座標系スワップ対応）
     * @param {string} characterId - キャラクターID
     */
    updateOverlayPosition(characterId) {
        const character = this.characters.get(characterId);
        const overlay = this.visualOverlays.get(characterId);
        
        if (!character || !overlay || !this.canvas) {
            return;
        }

        // 🎯 座標系スワップ技術：編集中はスキップ（シンプル座標系で直接更新済み）
        if (this.coordinateSwap.isInEditMode(characterId)) {
            return; // 編集中はhandleMouseMoveで直接更新されるため処理不要
        }

        // 🎯 通常時：Spine WebGL座標からDOM座標系に変換
        const x = character.skeleton.x;
        const y = this.canvas.height - character.skeleton.y;  // Y軸をDOM座標系に戻す
        console.log("🎯 オーバーレイ更新: 通常時 " + characterId + " → DOM座標(" + x.toFixed(1) + ", " + y.toFixed(1) + ") from Spine(" + character.skeleton.x.toFixed(1) + ", " + character.skeleton.y.toFixed(1) + ")");

        overlay.style.left = `${x}px`;
        overlay.style.top = `${y}px`;
    }
    /**
     * 視覚的フィードバックを更新
     */
    updateVisualFeedback() {
        // 全てのオーバーレイをデフォルト状態にリセット
        this.visualOverlays.forEach((overlay, characterId) => {
            overlay.style.borderColor = 'transparent';
        });

        // 選択中キャラクターに赤色境界線を適用
        if (this.selectedCharacterId) {
            const selectedOverlay = this.visualOverlays.get(this.selectedCharacterId);
            if (selectedOverlay) {
                selectedOverlay.style.borderColor = '#ff4444';
            }
        }
        
        // 全オーバーレイの位置を更新
        this.characters.forEach((character, characterId) => {
            this.updateOverlayPosition(characterId);
        });
    }
}