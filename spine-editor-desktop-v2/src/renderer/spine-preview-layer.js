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
            overlayElement.style.left = backup.overlayLeft;
            overlayElement.style.top = backup.overlayTop;
            overlayElement.style.transform = backup.overlayTransform;
        }
        
        this.isSwapped.delete(characterId);
        this.backup.delete(characterId);
        
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
        
        // 🔧 オフセット補正システム
        this.visualOffset = { x: 0, y: 0 }; // 視覚的ズレ補正値
        
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
            
            // 🔧 デバッグ用グローバルアクセス（開発モード限定）
            if (Utils.isDevelopmentMode()) {
                window.spinePreviewLayer = this;
                
                // 🔧 よくあるオフセットパターンの便利メソッド
                window.fixRightUpOffset = (rightPx = 25, upPx = 15) => {
                    this.setVisualOffset(-rightPx, -upPx);
                };
                
                window.resetOffset = () => {
                    this.setVisualOffset(0, 0);
                };
                
                // 🔍 座標レイヤー診断システム（簡易版）
                window.diagnoseCoordinateLayers = (clientX, clientY) => {
                    const rect = this.canvas.getBoundingClientRect();
                    const canvasDomX = clientX - rect.left;
                    const canvasDomY = clientY - rect.top;
                    const spineX = canvasDomX;
                    const spineY = this.canvas.height - canvasDomY;
                    
                    console.log(`🗺️ Mouse: (${clientX}, ${clientY}) → Canvas: (${canvasDomX.toFixed(1)}, ${canvasDomY.toFixed(1)}) → Spine: (${spineX.toFixed(1)}, ${spineY.toFixed(1)})`);
                };
            }
            
            // 🔍 自動マウス位置診断システム（開発モード限定）
            if (Utils.isDevelopmentMode()) {
                window.diagnoseCurrentMousePosition = () => {
                    console.log(`🎯 マウスをクリックして座標診断を開始してください...`);
                    
                    const handleClick = (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        
                        // 一度だけ実行してイベント削除
                        document.removeEventListener('click', handleClick, true);
                        
                        // 診断実行
                        window.diagnoseCoordinateLayers(event.clientX, event.clientY);
                        
                        console.log(`✅ 診断完了！マウス位置: (${event.clientX}, ${event.clientY})`);
                    };
                    
                    // 次回クリックで診断実行
                    document.addEventListener('click', handleClick, true);
                };
            }
            
            // 🔧 デバッグモードコントロール（開発モード限定）
            if (Utils.isDevelopmentMode()) {
                window.enableSpineDebugMode = () => {
                    window.spineDebugMode = true;
                    console.log(`🔍 Spineデバッグモード: 有効`);
                };
                
                window.disableSpineDebugMode = () => {
                    window.spineDebugMode = false;
                    console.log(`🔇 Spineデバッグモード: 無効`);
                };
                
                // 🔍 キャラクター一覧表示
                window.listAllCharacters = () => {
                    console.log(`📊 登録キャラクター一覧 (${this.characters.size}体):`);
                    this.characters.forEach((character, characterId) => {
                        console.log(`👾 ${character.name}(${characterId}):`);
                        console.log(`  - Spine座標: (${character.skeleton?.x?.toFixed?.(1) || 'N/A'}, ${character.skeleton?.y?.toFixed?.(1) || 'N/A'})`);
                        console.log(`  - スケール: ${character.scale || 'N/A'}`);
                        console.log(`  - skeleton状態: ${!!character.skeleton}`);
                    });
                };
            }
            
            if (Utils.isDevelopmentMode()) {
                console.log('✅ SpinePreviewLayer初期化完了');
                console.log('🔧 デバッグコマンド使用可能:');
                console.log('  - window.fixRightUpOffset(右px, 上px) // マウス-ハンドル修正');
                console.log('  - window.resetOffset() // リセット');
                console.log('  - window.diagnoseCoordinateLayers(clientX, clientY) // 5層座標診断');
                console.log('  - window.diagnoseCurrentMousePosition() // 自動マウス位置診断');
                console.log('  - window.enableSpineDebugMode() // 詳細ログON');
                console.log('  - window.disableSpineDebugMode() // 詳細ログOFF'); 
                console.log('  - window.listAllCharacters() // キャラクター一覧');
            } else {
                console.log('✅ SpinePreviewLayer初期化完了');
            }
            
            // 🚨 緊急座標系テスト機能（開発モード限定）
            if (Utils.isDevelopmentMode()) {
                window.testDirectCoordinate = function(x, y) {
                    console.log('🧪 直接座標テスト:', x, y);
                    const character = Object.values(window.spinePreviewLayer.characters)[0];
                    if (character && character.skeleton) {
                        const dx = Math.abs(character.skeleton.x - x);
                        const dy = Math.abs(character.skeleton.y - y);
                        const distance = Math.sqrt(dx*dx + dy*dy);
                        console.log('🎯 距離計算: キャラ(' + character.skeleton.x.toFixed(1) + ', ' + character.skeleton.y.toFixed(1) + ') vs テスト(' + x + ', ' + y + ') = ' + distance.toFixed(1) + 'px');
                        return distance < 100;
                    } else {
                        console.log('❌ キャラクターが見つからない');
                        return false;
                    }
                };

                // Y軸変換テスト
                window.testYAxisConversion = function(clientX, clientY) {
                    const rect = window.spinePreviewLayer.canvas.getBoundingClientRect();
                    const rawY = clientY - rect.top;
                    const spineY = window.spinePreviewLayer.canvas.height - rawY;
                    const domY = window.spinePreviewLayer.canvas.height - spineY; // 逆変換
                    
                    console.log('🔄 Y軸変換テスト:');
                    console.log('  Client Y: ' + clientY);
                    console.log('  Raw Canvas Y: ' + rawY);
                    console.log('  Spine Y: ' + spineY);
                    console.log('  DOM Y (逆変換): ' + domY);
                    console.log('  元のRaw Yと一致?: ' + (Math.abs(rawY - domY) < 0.1));
                };

                // 座標変換無効化テスト
                window.testNoYAxisFlip = function(clientX, clientY) {
                    const rect = window.spinePreviewLayer.canvas.getBoundingClientRect();
                    const rawCanvasX = clientX - rect.left;
                    const rawCanvasY = clientY - rect.top; // Y軸変換なし
                    
                    console.log('🚨 Y軸変換なしテスト:');
                    console.log('  Client: (' + clientX + ', ' + clientY + ')');
                    console.log('  Raw Canvas (変換なし): (' + rawCanvasX.toFixed(1) + ', ' + rawCanvasY.toFixed(1) + ')');
                    
                    // キャラクター検索
                    const character = Object.values(window.spinePreviewLayer.characters)[0];
                    if (character && character.skeleton) {
                        const dx = Math.abs(character.skeleton.x - rawCanvasX);
                        const dy = Math.abs(character.skeleton.y - rawCanvasY);
                        const distance = Math.sqrt(dx*dx + dy*dy);
                        console.log('  距離 (変換なし): ' + distance.toFixed(1) + 'px');
                        return distance < 100;
                    }
                    return false;
                };
                console.log("🚨 緊急座標テスト関数:");
                console.log("  - window.testDirectCoordinate(76, 258) // nezumi位置直接テスト");
                console.log("  - window.testNoYAxisFlip(clientX, clientY) // Y軸変換無効化テスト");
                console.log('📋 使用例: 1) window.enableSpineDebugMode() 2) キャラクタークリック → 詳細ログ確認');
            }
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
        
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
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
            
            // 座標変換（オフセット補正込み）
            let canvasX, canvasY;
            if (x && y) {
                const canvasCoords = this.clientToCanvasCoordinates(x, y);
                canvasX = canvasCoords.x + this.visualOffset.x;
                canvasY = canvasCoords.y + this.visualOffset.y;
            } else {
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
            
            // 視覚フィードバック要素作成
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
                character.skeleton.x = x;
                character.skeleton.y = y;
            }
            
            if (character.position) {
                character.position.x = x;
                character.position.y = y;
            }
            
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
        
        this.clearAllVisualOverlays();
        
        this.clearCanvas();
    }

    /**
     * マウス座標をCanvas座標に変換（Spine WebGL座標系対応）- 強化版
     * @param {number} clientX - マウスのクライアントX座標
     * @param {number} clientY - マウスのクライアントY座標
     * @returns {object} Canvas座標 {x, y}
     */

    /**
     * 🚨 完全修正版座標変換 - DPR・中央原点・Spine座標系完全対応
     */
    clientToCanvasCoordinates(clientX, clientY) {
        if (!this.canvas) {
            console.error('❌ Canvas未初期化: 座標変換失敗');
            return { x: 0, y: 0 };
        }
        
        const rect = this.canvas.getBoundingClientRect();
        
        // 1. DPR（デバイス座標比率）補正
        const dpr = window.devicePixelRatio || 1;
        
        // 2. 基本Canvas座標計算
        const rawCanvasX = clientX - rect.left;
        const rawCanvasY = clientY - rect.top;
        
        // 3. DPR補正適用
        const dprCorrectedX = rawCanvasX * dpr;
        const dprCorrectedY = rawCanvasY * dpr;
        
        // 4. 画面中央原点補正（最重要）
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // 5. Spineワールド座標系への変換（中央原点 + Y軸反転）
        const canvasX = dprCorrectedX - centerX;
        const canvasY = centerY - dprCorrectedY; // Y軸反転 + 中央原点
        
        // 🔍 変換プロセスの詳細ログ（デバッグ時のみ）
        if (Utils.isDevelopmentMode() || this.selectedCharacterId || window.spineDebugMode) {
            console.log('🔄 座標変換プロセス（完全修正版）:');
            console.log('  1. Client: (' + clientX + ', ' + clientY + ')');
            console.log('  2. Canvas Rect: (' + rect.left.toFixed(1) + ', ' + rect.top.toFixed(1) + ') ' + rect.width.toFixed(1) + 'x' + rect.height.toFixed(1));
            console.log('  3. Raw Canvas: (' + rawCanvasX.toFixed(1) + ', ' + rawCanvasY.toFixed(1) + ')');
            console.log('  4. DPR(' + dpr + ') 補正: (' + dprCorrectedX.toFixed(1) + ', ' + dprCorrectedY.toFixed(1) + ')');
            console.log('  5. 中央原点(' + centerX.toFixed(1) + ', ' + centerY.toFixed(1) + ')');
            console.log('  6. Final Spine: (' + canvasX.toFixed(1) + ', ' + canvasY.toFixed(1) + ')');
        }
        
        return { x: canvasX, y: canvasY };
    }
    /**
     * 視覚的オフセット補正値を設定
     * @param {number} offsetX - X軸のオフセット補正値（右にずれている場合は負の値）
     * @param {number} offsetY - Y軸のオフセット補正値（上にずれている場合は負の値）
     */
    setVisualOffset(offsetX, offsetY) {
        this.visualOffset.x = offsetX;
        this.visualOffset.y = offsetY;
        console.log(`🔧 視覚オフセット設定: X=${offsetX}px, Y=${offsetY}px`);
    }

    /**
     * ドラッグ&ドロップイベントハンドラーを設定
     */
    setupDragAndDropEvents() {
        if (!this.canvas) {
            console.error('❌ Canvas未初期化: ドラッグイベント設定失敗');
            return;
        }

        if (Utils.isDevelopmentMode()) {
            console.log(`🔧 マウスイベントハンドラー設定開始 - Canvas ID: ${this.canvas.id}`);
        }

        // マウスダウンイベント
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        
        // マウスムーブイベント（ドキュメント全体で監視）
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        // マウスアップイベント（ドキュメント全体で監視）
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));

        if (Utils.isDevelopmentMode()) {
            console.log(`✅ mousedown イベント設定完了 - Canvas`);
            console.log(`✅ mousemove イベント設定完了 - Document`);
            console.log(`✅ mouseup イベント設定完了 - Document`);

            // 🔍 イベントハンドラー設定確認のためのテスト
            this.canvas.addEventListener('click', (event) => {
                console.log(`🔍 TEST CLICK FIRED - Canvas正常動作確認済み`);
            });
            console.log(`✅ テスト用clickイベント設定完了`);
        }
        
    }

    /**
     * マウスダウンイベントハンドラー
     * @param {MouseEvent} event - マウスイベント
     */
    handleMouseDown(event) {
        if (Utils.isDevelopmentMode() || this.selectedCharacterId || window.spineDebugMode) {
            console.log(`🔍 MOUSE DOWN FIRED on canvas - Client(${event.clientX}, ${event.clientY})`);
        }
        
        if (!this.canvas || this.characters.size === 0) {
            if (Utils.isDevelopmentMode()) {
                console.log(`❌ No canvas or no characters: canvas=${!!this.canvas}, chars=${this.characters.size}`);
            }
            return;
        }

        // Canvas座標に変換（詳細診断版）
        const canvasCoords = this.clientToCanvasCoordinates(event.clientX, event.clientY);
        
        if (Utils.isDevelopmentMode() || this.selectedCharacterId || window.spineDebugMode) {
            console.log(`🎯 Canvas座標変換完了: Client(${event.clientX}, ${event.clientY}) → Canvas(${canvasCoords.x.toFixed(1)}, ${canvasCoords.y.toFixed(1)})`);
            
            // 🔍 Canvas情報の詳細確認
            const rect = this.canvas.getBoundingClientRect();
            console.log(`📊 Canvas詳細情報:`);
            console.log(`  - Canvas実サイズ: ${this.canvas.width}x${this.canvas.height}px`);
            console.log(`  - Canvas DOM矩形: (${rect.left.toFixed(1)}, ${rect.top.toFixed(1)}) ${rect.width.toFixed(1)}x${rect.height.toFixed(1)}px`);
            console.log(`  - 変換計算: Raw(${event.clientX - rect.left}, ${event.clientY - rect.top}) → Spine(${canvasCoords.x.toFixed(1)}, ${this.canvas.height - (event.clientY - rect.top)})`);
        }
        
        // キャラクター選択判定
        const selectedCharacter = this.getCharacterAtPosition(canvasCoords.x, canvasCoords.y);
        
        if (selectedCharacter) {
            if (Utils.isDevelopmentMode() || window.spineDebugMode) {
                console.log(`🎯 CHARACTER SELECTED: ${selectedCharacter.name} (${selectedCharacter.id})`);
                console.log(`🎯 キャラクター現在位置: Spine(${selectedCharacter.skeleton.x.toFixed(1)}, ${selectedCharacter.skeleton.y.toFixed(1)})`);
                
                // 🔍 初期オフセット測定
                const initialOffsetX = canvasCoords.x - selectedCharacter.skeleton.x;
                const initialOffsetY = canvasCoords.y - selectedCharacter.skeleton.y;
                console.log(`🔍 初期オフセット測定: Mouse vs Spine = (${initialOffsetX.toFixed(1)}, ${initialOffsetY.toFixed(1)})`);
            }
            
            this.isDragging = true;
            this.selectedCharacterId = selectedCharacter.id;
            this.dragStartPoint = {
                x: canvasCoords.x,
                y: canvasCoords.y
            };
            
            const overlayElement = this.visualOverlays.get(selectedCharacter.id);
            if (overlayElement) {
                this.coordinateSwap.enterEditMode(
                    selectedCharacter.id, 
                    overlayElement, 
                    selectedCharacter
                );
            }
            
            this.canvas.style.cursor = 'grabbing';
            this.updateVisualFeedback();
        } else {
            if (Utils.isDevelopmentMode() || window.spineDebugMode) {
                console.log(`❌ キャラクター未発見: 検索座標(${canvasCoords.x.toFixed(1)}, ${canvasCoords.y.toFixed(1)})`);
            }
        }
    }

    /**
     * マウスムーブイベントハンドラー（座標系スワップ対応 + オフセット補正）
     * @param {MouseEvent} event - マウスイベント
     */
    handleMouseMove(event) {
        if (!this.isDragging || !this.selectedCharacterId || !this.canvas) {
            return;
        }

        const canvasCoords = this.clientToCanvasCoordinates(event.clientX, event.clientY);
        
        // 🔧 オフセット補正値を適用
        const correctedX = canvasCoords.x + this.visualOffset.x;
        const correctedY = canvasCoords.y + this.visualOffset.y;
        
        this.updateCharacterPosition(this.selectedCharacterId, correctedX, correctedY);
        
        if (this.coordinateSwap.isInEditMode(this.selectedCharacterId)) {
            const overlayElement = this.visualOverlays.get(this.selectedCharacterId);
            if (overlayElement) {
                const domY = this.canvas.height - correctedY;
                overlayElement.style.left = `${correctedX}px`;
                overlayElement.style.top = `${domY}px`;
            }
        }
    }

    /**
     * マウスアップイベントハンドラー（座標系スワップ解除）
     * @param {MouseEvent} event - マウスイベント
     */
    handleMouseUp(event) {
        if (Utils.isDevelopmentMode() || window.spineDebugMode) {
            console.log(`🔍 MOUSE UP FIRED: dragging=${this.isDragging}, selected=${this.selectedCharacterId}, client(${event.clientX}, ${event.clientY})`);
        }
        
        if (this.isDragging && this.selectedCharacterId) {
            // 🎯 右上ズレ診断：マウス位置 vs Spine位置の正確な差分測定
            const canvasCoords = this.clientToCanvasCoordinates(event.clientX, event.clientY);
            const character = this.characters.get(this.selectedCharacterId);
            
            if (Utils.isDevelopmentMode() || window.spineDebugMode) {
                console.log(`🎯 ドロップ時詳細診断:`);
                console.log(`  - マウス位置(Canvas): (${canvasCoords.x.toFixed(1)}, ${canvasCoords.y.toFixed(1)})`);
                
                if (character && character.skeleton) {
                    const offsetX = canvasCoords.x - character.skeleton.x;
                    const offsetY = canvasCoords.y - character.skeleton.y;
                    const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
                    
                    console.log(`  - キャラ位置(Spine): (${character.skeleton.x.toFixed(1)}, ${character.skeleton.y.toFixed(1)})`);
                    console.log(`  - オフセット: (${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);
                    console.log(`  - 距離: ${distance.toFixed(1)}px`);
                    
                    // 🚨 右上ズレの具体的判定
                    if (Math.abs(offsetX) > 5 || Math.abs(offsetY) > 5) {
                        console.log(`🚨 POSITION MISMATCH DETECTED!`);
                        console.log(`  右ズレ: ${offsetX.toFixed(1)}px (${offsetX > 0 ? '右' : '左'})`);
                        console.log(`  上ズレ: ${offsetY.toFixed(1)}px (${offsetY > 0 ? '上' : '下'})`);
                    } else {
                        console.log(`✅ 位置精度良好: ${distance.toFixed(1)}px以内`);
                    }
                } else {
                    console.log(`❌ キャラクター取得失敗: ${this.selectedCharacterId}`);
                }
            }
            
            const overlay = this.visualOverlays.get(this.selectedCharacterId);
            if (overlay && character) {
                this.coordinateSwap.exitEditMode(this.selectedCharacterId, overlay, character);
            }
            
            this.isDragging = false;
            this.selectedCharacterId = null;
            this.dragStartPoint = { x: 0, y: 0 };
            
            if (this.canvas) {
                this.canvas.style.cursor = 'default';
            }
            
            this.updateVisualFeedback();
        } else {
            if (Utils.isDevelopmentMode()) {
                console.log(`❌ マウスアップ処理スキップ: dragging=${this.isDragging}, selected=${this.selectedCharacterId}`);
            }
        }
    }

    /**
     * 指定位置にあるキャラクターを取得（円形ヒット判定）- 強化版
     * @param {number} x - X座標（Canvas座標系）
     * @param {number} y - Y座標（Canvas座標系）
     * @returns {object|null} ヒットしたキャラクター、なければnull
     */
    getCharacterAtPosition(x, y) {
        if (Utils.isDevelopmentMode() || window.spineDebugMode) {
            console.log(`🔍 === キャラクター検索開始 ===`);
            console.log(`🎯 検索座標: Canvas(${x?.toFixed?.(1) || x}, ${y?.toFixed?.(1) || y})`);
        }
        
        if (!x && x !== 0 || !y && y !== 0) {
            if (Utils.isDevelopmentMode()) {
                console.warn('⚠️ 無効な座標:', { x, y });
            }
            return null;
        }

        // 🔧 検索範囲を拡大（50px → 100px）
        const hitRadius = 100; // ヒット判定半径（px）
        
        if (Utils.isDevelopmentMode() || window.spineDebugMode) {
            console.log(`🔍 ヒット判定範囲: ${hitRadius}px`);
            
            // 🔍 全キャラクター情報をログ出力
            console.log(`📊 登録キャラクター数: ${this.characters.size}`);
            this.characters.forEach((character, characterId) => {
                if (character && character.skeleton) {
                    console.log(`👾 ${character.name}(${characterId}): Spine(${character.skeleton.x?.toFixed?.(1) || character.skeleton.x}, ${character.skeleton.y?.toFixed?.(1) || character.skeleton.y})`);
                } else {
                    console.log(`❌ 破損キャラクター: ${character?.name || 'Unknown'}(${characterId}) - skeleton: ${!!character?.skeleton}`);
                }
            });
        }
        
        // すべてのキャラクターをチェック（後から追加されたものが優先）
        const characterArray = Array.from(this.characters.values()).reverse();
        
        if (Utils.isDevelopmentMode() || window.spineDebugMode) {
            console.log(`🔍 検索対象配列: ${characterArray.length}個のキャラクター`);
        }
        
        for (const character of characterArray) {
            try {
                if (!character) {
                    if (Utils.isDevelopmentMode()) {
                        console.log(`❌ nullキャラクタースキップ`);
                    }
                    continue;
                }
                
                if (!character.skeleton) {
                    if (Utils.isDevelopmentMode()) {
                        console.log(`❌ skeletonなしキャラクタースキップ: ${character.name}`);
                    }
                    continue;
                }
                
                const charX = character.skeleton.x || 0;
                const charY = character.skeleton.y || 0;
                
                // 円形ヒット判定
                const deltaX = x - charX;
                const deltaY = y - charY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                if (Utils.isDevelopmentMode() || window.spineDebugMode) {
                    console.log(`🔍 ${character.name}: 座標差分(${deltaX.toFixed(1)}, ${deltaY.toFixed(1)}) 距離=${distance.toFixed(1)}px (判定範囲${hitRadius}px)`);
                }
                
                if (distance <= hitRadius) {
                    if (Utils.isDevelopmentMode() || window.spineDebugMode) {
                        console.log(`✅ キャラクター発見: ${character.name} - 距離${distance.toFixed(1)}px <= ${hitRadius}px`);
                    }
                    return character;
                } else {
                    if (Utils.isDevelopmentMode() || window.spineDebugMode) {
                        console.log(`❌ 範囲外: ${character.name} - 距離${distance.toFixed(1)}px > ${hitRadius}px`);
                    }
                }
            } catch (error) {
                console.error('❌ キャラクターヒット判定エラー:', character?.name, error);
                continue;
            }
        }
        
        if (Utils.isDevelopmentMode() || window.spineDebugMode) {
            console.log(`❌ キャラクター検索結果: 見つからませんでした`);
            console.log(`🔍 === キャラクター検索終了 ===`);
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
            
            // リサイズ時の座標系スワップ対応
            const editingCharacters = [];
            this.characters.forEach((character, characterId) => {
                if (this.coordinateSwap.isInEditMode(characterId)) {
                    editingCharacters.push({ characterId, character });
                    // スワップ解除
                    const overlay = this.visualOverlays.get(characterId);
                    if (overlay) {
                        this.coordinateSwap.exitEditMode(characterId, overlay, character);
                    }
                }
            });
            
            // オーバーレイ位置更新
            this.characters.forEach((character, characterId) => {
                this.updateOverlayPosition(characterId);
            });
            
            // スワップ再開
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
        
        this.clearAllVisualOverlays();
        this.hoveredCharacterId = null;
        this.coordinateSwap = null;
        
        this.canvas = null;
        this.context = null;
        this.renderer = null;
        this.container = null;
        this.spineLoaded = false;
        
    }

    // 視覚的フィードバック機能

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
            border: 2px solid #ff4444;
            border-radius: 50%;
            pointer-events: none;
            z-index: 15;
            background: rgba(255, 68, 68, 0.1);
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
     * オーバーレイの位置を更新（座標系スワップ対応 + DPR補正統一）
     * @param {string} characterId - キャラクターID
     */
    updateOverlayPosition(characterId) {
        const character = this.characters.get(characterId);
        const overlay = this.visualOverlays.get(characterId);
        
        if (!character || !overlay || !this.canvas) {
            return;
        }

        if (this.coordinateSwap.isInEditMode(characterId)) {
            return;
        }

        // 🔧 キャラクター実体位置からハンドル位置を正確計算
        const spineX = character.skeleton.x;
        const spineY = character.skeleton.y;
        
        if (Utils.isDevelopmentMode() || window.spineDebugMode) {
            console.log(`🔧 ハンドル計算前: キャラクター位置 Spine(${spineX.toFixed(1)}, ${spineY.toFixed(1)}), Canvas size: ${this.canvas.width}x${this.canvas.height}`);
        }
        
        // 🚨 重要: ドラッグ時と同じ座標変換を適用（DPR補正統一）
        const dpr = window.devicePixelRatio || 1;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Spine座標系 → 中央原点座標系への逆変換
        const centerOriginX = spineX + centerX;
        const centerOriginY = centerY - spineY; // Y軸反転
        
        // DPR補正の逆変換（描画座標 → DOM座標）
        const domX = centerOriginX / dpr;
        const domY = centerOriginY / dpr;
        
        // ハンドル中心調整（100x100pxハンドルの中央に配置）
        const handleDomX = domX - 50;
        const handleDomY = domY - 50;
        
        if (Utils.isDevelopmentMode() || window.spineDebugMode) {
            console.log(`🔧 ハンドル位置統一変換: Spine(${spineX.toFixed(1)}, ${spineY.toFixed(1)}) → 中央原点(${centerOriginX.toFixed(1)}, ${centerOriginY.toFixed(1)}) → DPR補正(${domX.toFixed(1)}, ${domY.toFixed(1)}) → Handle DOM(${handleDomX.toFixed(1)}, ${handleDomY.toFixed(1)})`);
        }

        overlay.style.left = `${handleDomX}px`;
        overlay.style.top = `${handleDomY}px`;
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