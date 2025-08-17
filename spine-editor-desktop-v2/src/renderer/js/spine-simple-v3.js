// 🎮 Spine Editor Desktop v2.0 - シンプルSpine統合システム (v3ベース)
// v3の正常動作機能をベースに、シンプルで確実に動作するSpine表示機能

console.log('🎮 シンプルSpine統合システム (v3ベース) 初期化開始');
console.log('🔍 現在のspine状態:', typeof spine !== 'undefined' ? 'loaded' : 'not loaded');

// ========== シンプルSpineキャラクター管理 ========== //

class SimpleSpineManagerV3 {
    constructor() {
        this.characters = new Map();
        this.loadedAssets = new Map();
        this.isSpineReady = false;
        
        this.checkSpineAvailability();
    }

    // Spine WebGL利用可能性確認（v3同様）
    checkSpineAvailability() {
        if (typeof spine !== 'undefined') {
            this.isSpineReady = true;
            console.log('✅ Spine WebGL利用可能');
        } else {
            console.warn('⚠️ Spine WebGL未読み込み - フォールバック表示');
            this.waitForSpine();
        }
    }

    // Spine読み込み待機（v3同様）
    async waitForSpine(maxRetries = 50) {
        for (let i = 0; i < maxRetries; i++) {
            if (typeof spine !== 'undefined' && spine.TextureAtlas && spine.AssetManager) {
                this.isSpineReady = true;
                console.log('✅ Spine WebGL読み込み完了');
                return true;
            }
            if (i % 10 === 0) {
                console.log(`🔄 Spine読み込み待機中... (${i}/${maxRetries})`);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.error('❌ Spine WebGL読み込みタイムアウト');
        return false;
    }

    // 組み込みキャラクター作成（シンプル版）
    async createBuiltInCharacter(characterName) {
        try {
            console.log(`🎭 組み込みキャラクター作成開始: ${characterName}`);
            
            const characterData = {
                name: characterName,
                position: { x: 50, y: 60 }, // 画面中央やや下
                scale: characterName === 'nezumi' ? 0.8 : 1.0
            };
            
            // Canvas要素作成
            const canvas = this.createCanvasElement(characterData);
            
            // フォールバック画像作成
            const fallback = this.createFallbackElement(characterData);
            
            // v2のspine-stageに追加
            const spineStage = document.getElementById('spine-stage');
            if (spineStage) {
                spineStage.appendChild(canvas);
                spineStage.appendChild(fallback);
                console.log('✅ v2 spine-stageに追加完了');
            } else {
                console.warn('⚠️ spine-stage要素が見つかりません');
                return false;
            }
            
            // Spine WebGL初期化
            if (this.isSpineReady) {
                try {
                    await this.initializeSpineCharacter(characterData, canvas, fallback);
                } catch (error) {
                    console.warn(`⚠️ Spine初期化失敗、フォールバックに切り替え: ${characterData.name}`, error);
                    this.showFallbackCharacter(canvas, fallback);
                }
            } else {
                // Spine WebGL利用不可時はフォールバック表示
                this.showFallbackCharacter(canvas, fallback);
            }
            
            // キャラクター登録
            this.characters.set(characterData.name, {
                data: characterData,
                canvas,
                fallback,
                isLoaded: this.isSpineReady
            });
            
            console.log(`✅ 組み込みキャラクター作成完了: ${characterData.name}`);
            return true;
            
        } catch (error) {
            console.error(`❌ 組み込みキャラクター作成エラー: ${characterName}`, error);
            return false;
        }
    }

    // Canvas要素作成（v3ベース、v2対応）
    createCanvasElement(characterData) {
        const canvas = document.createElement('canvas');
        canvas.id = `${characterData.name}-canvas`;
        canvas.width = characterData.name === 'nezumi' ? 150 : 300;
        canvas.height = characterData.name === 'nezumi' ? 180 : 200;
        canvas.setAttribute('data-character-name', characterData.name);
        canvas.setAttribute('data-spine-character', 'true');
        
        // スタイル設定
        Object.assign(canvas.style, {
            position: 'absolute',
            left: `${characterData.position.x}%`,
            top: `${characterData.position.y}%`,
            transform: 'translate(-50%, -50%)',
            width: `${(characterData.scale || 1) * (characterData.name === 'nezumi' ? 20 : 30)}%`,
            aspectRatio: characterData.name === 'nezumi' ? '5/6' : '3/2',
            zIndex: '10',
            cursor: 'pointer',
            opacity: '0', // 初期は非表示
            transition: 'opacity 0.3s ease'
        });
        
        return canvas;
    }

    // フォールバック画像要素作成（v3ベース、v2対応）
    createFallbackElement(characterData) {
        const fallback = document.createElement('img');
        fallback.id = `${characterData.name}-fallback`;
        fallback.src = `assets/images/${characterData.name === 'purattokun' ? 'purattokunn' : characterData.name}.png`;
        fallback.alt = characterData.name;
        fallback.setAttribute('data-character-name', characterData.name);
        fallback.setAttribute('data-spine-character', 'true');
        
        // スタイル設定
        Object.assign(fallback.style, {
            position: 'absolute',
            left: `${characterData.position.x}%`,
            top: `${characterData.position.y}%`,
            transform: 'translate(-50%, -50%)',
            width: `${(characterData.scale || 1) * 10}%`,
            aspectRatio: '1/1',
            objectFit: 'contain',
            zIndex: '10',
            opacity: '1', // 初期表示
            transition: 'opacity 0.3s ease'
        });
        
        return fallback;
    }

    // Spineキャラクター初期化（v3移植、組み込みアセット用）
    async initializeSpineCharacter(characterData, canvas, fallback) {
        try {
            console.log(`🎮 v3移植パターンでSpine初期化: ${characterData.name}`);
            
            // WebGLコンテキスト取得
            const gl = canvas.getContext('webgl', { 
                alpha: true, 
                premultipliedAlpha: false 
            });
            
            if (!gl) {
                throw new Error('WebGL context creation failed');
            }

            // AssetManagerを使用
            const assetManager = new spine.AssetManager(gl);
            
            // 組み込みアセット読み込み（デスクトップアプリ用）
            const basePath = `assets/spine/characters/${characterData.name}/`;
            const atlasPath = `${basePath}${characterData.name}.atlas`;
            const jsonPath = `${basePath}${characterData.name}.json`;
            const imagePath = `${basePath}${characterData.name}.png`;
            
            console.log('📁 組み込みアセット読み込み:', { atlasPath, jsonPath, imagePath });
            
            // 標準読み込み
            assetManager.loadTextureAtlas(atlasPath);
            assetManager.loadText(jsonPath);
            assetManager.loadTexture(imagePath);
            
            // 読み込み完了待機
            await this.waitForAssetLoading(assetManager);
            
            // Skeleton作成
            const atlas = assetManager.require(atlasPath);
            const skeletonJson = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(atlas));
            const skeletonData = skeletonJson.readSkeletonData(assetManager.require(jsonPath));
            const skeleton = new spine.Skeleton(skeletonData);
            
            // キャラクター別座標調整
            if (characterData.name === 'nezumi') {
                skeleton.x = 0;
                skeleton.y = -25;
                skeleton.scaleX = skeleton.scaleY = (characterData.scale || 1) * 0.8;
            } else {
                skeleton.x = 0;
                skeleton.y = 0;
                skeleton.scaleX = skeleton.scaleY = 1.0;
            }
            
            console.log(`🚀 座標設定: ${characterData.name} → skeleton(${skeleton.x}, ${skeleton.y}, ${skeleton.scaleX})`);
            
            // アニメーション設定
            const animationStateData = new spine.AnimationStateData(skeleton.data);
            const animationState = new spine.AnimationState(animationStateData);
            
            // デフォルトアニメーション
            this.setDefaultAnimation(skeleton, animationState);
            
            // レンダラー作成
            const renderer = new spine.SceneRenderer(canvas, gl);
            
            // 描画ループ開始
            this.startRenderLoop(canvas, gl, renderer, skeleton, animationState);
            
            // キャラクタークリックイベント
            this.setupCharacterEvents(canvas, characterData);
            
            // 表示切り替え
            canvas.style.opacity = '1';
            fallback.style.opacity = '0';
            
            // アセット情報保存
            this.loadedAssets.set(characterData.name, {
                assetManager,
                skeleton,
                animationState,
                renderer
            });
            
            console.log(`✅ v3移植パターンでSpine初期化完了: ${characterData.name}`);
            
        } catch (error) {
            console.error(`❌ v3移植パターンSpine初期化エラー: ${characterData.name}`, error);
            this.showFallbackCharacter(canvas, fallback);
            throw error;
        }
    }

    // アセット読み込み完了待機（v3同様）
    async waitForAssetLoading(assetManager, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkAssets = () => {
                if (assetManager.isLoadingComplete()) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Asset loading timeout'));
                } else {
                    setTimeout(checkAssets, 100);
                }
            };
            
            checkAssets();
        });
    }

    // デフォルトアニメーション設定（v3同様）
    setDefaultAnimation(skeleton, animationState) {
        const animationPriority = ['taiki', 'idle', 'syutugen', 'appear'];
        
        for (const animName of animationPriority) {
            if (skeleton.data.findAnimation(animName)) {
                if (animName === 'syutugen' || animName === 'appear') {
                    animationState.setAnimation(0, animName, false);
                    animationState.addAnimation(0, 'taiki', true, 0);
                } else {
                    animationState.setAnimation(0, animName, true);
                }
                console.log(`🎬 アニメーション設定: ${animName}`);
                return;
            }
        }
        
        // フォールバック：最初のアニメーション
        if (skeleton.data.animations.length > 0) {
            const firstAnim = skeleton.data.animations[0].name;
            animationState.setAnimation(0, firstAnim, true);
            console.log(`🎬 フォールバックアニメーション: ${firstAnim}`);
        }
    }

    // 描画ループ開始（v3同様）
    startRenderLoop(canvas, gl, renderer, skeleton, animationState) {
        let lastTime = Date.now() / 1000;
        
        const render = () => {
            const now = Date.now() / 1000;
            const delta = now - lastTime;
            lastTime = now;

            // アニメーション更新
            animationState.update(delta);
            animationState.apply(skeleton);
            skeleton.updateWorldTransform();

            // レンダリング
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.viewport(0, 0, canvas.width, canvas.height);

            renderer.begin();
            renderer.drawSkeleton(skeleton, true);
            renderer.end();

            requestAnimationFrame(render);
        };
        
        render();
    }

    // キャラクターイベント設定（v3ベース）
    setupCharacterEvents(canvas, characterData) {
        canvas.addEventListener('click', (event) => {
            console.log(`🎯 キャラクタークリック: ${characterData.name}`);
            this.playClickAnimation(characterData.name);
        });
        
        // マウスオーバーエフェクト
        canvas.addEventListener('mouseenter', () => {
            canvas.style.filter = 'brightness(1.1)';
        });
        
        canvas.addEventListener('mouseleave', () => {
            canvas.style.filter = 'none';
        });
    }

    // クリックアニメーション再生（v3同様）
    playClickAnimation(characterName) {
        const assetData = this.loadedAssets.get(characterName);
        if (!assetData) return;
        
        const { skeleton, animationState } = assetData;
        
        if (skeleton.data.findAnimation('yarare')) {
            animationState.setAnimation(0, 'yarare', false);
            animationState.addAnimation(0, 'taiki', true, 0);
            console.log(`🎬 クリックアニメーション: yarare → taiki`);
        } else if (skeleton.data.findAnimation('click')) {
            animationState.setAnimation(0, 'click', false);
            animationState.addAnimation(0, 'taiki', true, 0);
            console.log(`🎬 クリックアニメーション: click → taiki`);
        }
    }

    // フォールバック表示（v3同様）
    showFallbackCharacter(canvas, fallback) {
        canvas.style.opacity = '0';
        fallback.style.opacity = '1';
        console.log('📷 フォールバック画像表示');
    }

    // キャラクター削除
    removeCharacter(characterName) {
        const character = this.characters.get(characterName);
        if (character) {
            character.canvas.remove();
            character.fallback.remove();
            this.loadedAssets.delete(characterName);
            this.characters.delete(characterName);
            console.log(`🗑️ キャラクター削除: ${characterName}`);
        }
    }

    // 全キャラクター削除
    clearAllCharacters() {
        for (const characterName of this.characters.keys()) {
            this.removeCharacter(characterName);
        }
        console.log('🗑️ 全キャラクター削除完了');
    }

    // キャラクター位置設定
    async setCharacterPosition(characterName, x, y) {
        try {
            const character = this.characters.get(characterName);
            if (!character) {
                console.warn(`⚠️ キャラクター '${characterName}' が見つかりません`);
                return false;
            }

            console.log(`🎯 ${characterName}の位置を (${x}, ${y}) に設定中...`);

            // Canvas要素の位置をパーセンテージで設定
            if (character.canvas) {
                character.canvas.style.left = `${x}%`;
                character.canvas.style.top = `${y}%`;
                
                // キャラクターデータ更新
                character.position = { x: x, y: y };
                
                console.log(`✅ ${characterName}の位置設定完了: (${x}%, ${y}%)`);
                return true;
            } else {
                console.warn(`⚠️ ${characterName}のCanvas要素が見つかりません`);
                return false;
            }
        } catch (error) {
            console.error(`❌ ${characterName}の位置設定エラー:`, error);
            return false;
        }
    }

    // キャラクター取得
    getCharacter(characterName) {
        return this.characters.get(characterName);
    }

    // 全キャラクター取得
    getAllCharacters() {
        return Array.from(this.characters.values());
    }

    // ========== バウンディングボックス編集システム ========== //

    // バウンディングボックス編集モード開始
    startBoundingBoxEdit(characterName) {
        try {
            console.log(`🔍 startBoundingBoxEdit呼び出し - characterName: ${characterName}`);
            console.log(`🔍 this.characters:`, this.characters);
            
            const character = this.characters.get(characterName);
            console.log(`🔍 取得したキャラクター:`, character);
            
            if (!character) {
                console.warn(`⚠️ キャラクター '${characterName}' が見つかりません`);
                console.log(`🔍 利用可能なキャラクター:`, Array.from(this.characters.keys()));
                return false;
            }

            console.log(`📦 ${characterName}のバウンディングボックス編集開始`);

            // 既存のバウンディングボックスを削除
            this.clearBoundingBoxes();

            // バウンディングボックス作成
            console.log(`🔍 createBoundingBox呼び出し中...`);
            const bbox = this.createBoundingBox(character);
            console.log(`🔍 createBoundingBox結果:`, bbox);
            
            if (bbox) {
                character.boundingBox = bbox;
                character.isEditing = true;
                console.log(`✅ ${characterName}のバウンディングボックス表示完了`);
                return true;
            }

            console.warn(`⚠️ バウンディングボックス作成に失敗`);
            return false;
        } catch (error) {
            console.error(`❌ ${characterName}のバウンディングボックス編集開始エラー:`, error);
            return false;
        }
    }

    // バウンディングボックス作成
    createBoundingBox(character) {
        console.log(`🔍 createBoundingBox開始 - character:`, character);
        
        if (!character.canvas) {
            console.warn('⚠️ キャラクターのCanvas要素が見つかりません');
            console.log(`🔍 character内容:`, character);
            return null;
        }

        const canvas = character.canvas;
        console.log(`🔍 canvas:`, canvas);
        console.log(`🔍 canvas.style:`, canvas.style);
        
        const rect = canvas.getBoundingClientRect();
        console.log(`🔍 rect:`, rect);
        
        const container = canvas.parentElement;
        console.log(`🔍 container:`, container);

        // バウンディングボックス要素作成
        const bbox = document.createElement('div');
        bbox.className = 'spine-bounding-box';
        bbox.style.cssText = `
            position: absolute;
            border: 2px solid #00ff00;
            border-radius: 4px;
            background: rgba(0, 255, 0, 0.1);
            pointer-events: none;
            z-index: 1000;
            left: ${canvas.style.left};
            top: ${canvas.style.top};
            width: ${canvas.style.width};
            height: ${canvas.style.height};
            transform-origin: center center;
        `;

        // リサイズハンドル追加
        this.addResizeHandles(bbox);

        // コンテナに追加
        container.appendChild(bbox);

        console.log('📦 バウンディングボックス作成完了');
        return bbox;
    }

    // リサイズハンドル追加
    addResizeHandles(bbox) {
        const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'];
        
        handles.forEach(position => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${position}`;
            handle.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: #00ff00;
                border: 1px solid #fff;
                border-radius: 50%;
                pointer-events: auto;
                cursor: ${this.getCursorForHandle(position)};
            `;

            // ハンドル位置設定
            this.setHandlePosition(handle, position);
            bbox.appendChild(handle);
        });
    }

    // ハンドル位置設定
    setHandlePosition(handle, position) {
        const positions = {
            'nw': { top: '-4px', left: '-4px' },
            'ne': { top: '-4px', right: '-4px' },
            'sw': { bottom: '-4px', left: '-4px' },
            'se': { bottom: '-4px', right: '-4px' },
            'n': { top: '-4px', left: '50%', transform: 'translateX(-50%)' },
            's': { bottom: '-4px', left: '50%', transform: 'translateX(-50%)' },
            'e': { top: '50%', right: '-4px', transform: 'translateY(-50%)' },
            'w': { top: '50%', left: '-4px', transform: 'translateY(-50%)' }
        };

        Object.assign(handle.style, positions[position]);
    }

    // カーソル取得
    getCursorForHandle(position) {
        const cursors = {
            'nw': 'nw-resize', 'ne': 'ne-resize',
            'sw': 'sw-resize', 'se': 'se-resize',
            'n': 'n-resize', 's': 's-resize',
            'e': 'e-resize', 'w': 'w-resize'
        };
        return cursors[position] || 'default';
    }

    // 全バウンディングボックス削除
    clearBoundingBoxes() {
        const boxes = document.querySelectorAll('.spine-bounding-box');
        boxes.forEach(box => box.remove());
        
        // キャラクター状態更新
        this.characters.forEach(character => {
            character.boundingBox = null;
            character.isEditing = false;
        });
        
        console.log('🗑️ 全バウンディングボックス削除完了');
    }

    // バウンディングボックス編集終了
    endBoundingBoxEdit() {
        this.clearBoundingBoxes();
        console.log('📦 バウンディングボックス編集終了');
    }

    // ========== 保存・復元システム ========== //

    // バウンディングボックス状態保存
    saveBoundingBoxState() {
        try {
            console.log('💾 バウンディングボックス状態保存開始');
            
            const state = {};
            
            // 全キャラクターの状態を保存
            this.characters.forEach((character, characterName) => {
                if (character.canvas) {
                    const canvas = character.canvas;
                    const container = canvas.parentElement;
                    const rect = canvas.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    
                    // 座標系スワップ技術対応（編集座標→元座標系→保存）
                    state[characterName] = {
                        left: ((rect.left - containerRect.left) / containerRect.width * 100).toFixed(4),
                        top: ((rect.top - containerRect.top) / containerRect.height * 100).toFixed(4),
                        width: (rect.width / containerRect.width * 100).toFixed(4),
                        height: (rect.height / containerRect.height * 100).toFixed(4),
                        position: character.position
                    };
                }
            });
            
            // localStorage に保存（v3と同じキー使用）
            localStorage.setItem('spine-positioning-state', JSON.stringify(state));
            
            console.log('💾 保存完了:', state);
            this.showFeedback('💾 保存完了！');
            return true;
            
        } catch (error) {
            console.error('❌ 保存エラー:', error);
            this.showFeedback('❌ 保存に失敗しました');
            return false;
        }
    }

    // バウンディングボックス編集キャンセル
    cancelBoundingBoxEdit() {
        const confirmCancel = confirm('編集をキャンセルして前回保存した状態に戻しますか？');
        if (confirmCancel) {
            console.log('↶ バウンディングボックス編集キャンセル');
            // ページリロード方式による確実なロールバック
            location.reload();
        }
    }

    // バウンディングボックス状態復元
    restoreBoundingBoxState() {
        try {
            const savedState = localStorage.getItem('spine-positioning-state');
            if (!savedState) {
                console.log('📂 保存された状態がありません');
                return false;
            }
            
            console.log('🔄 バウンディングボックス状態復元開始');
            const state = JSON.parse(savedState);
            
            // 各キャラクターの状態を復元
            Object.keys(state).forEach(characterName => {
                const character = this.characters.get(characterName);
                if (character && character.canvas && state[characterName]) {
                    const config = state[characterName];
                    
                    // CSSスタイル直接適用による確実な復元
                    character.canvas.style.left = config.left + '%';
                    character.canvas.style.top = config.top + '%';
                    character.canvas.style.width = config.width + '%';
                    character.canvas.style.height = config.height + '%';
                    
                    // 位置情報も復元
                    if (config.position) {
                        character.position = config.position;
                    }
                    
                    console.log(`🔄 ${characterName}の状態復元完了:`, config);
                }
            });
            
            console.log('✅ 状態復元完了');
            return true;
            
        } catch (error) {
            console.error('❌ 状態復元エラー:', error);
            return false;
        }
    }

    // 視覚的フィードバック表示
    showFeedback(message) {
        // 既存のフィードバック要素を削除
        const existing = document.querySelector('.bbox-feedback');
        if (existing) existing.remove();
        
        // フィードバック要素作成
        const feedback = document.createElement('div');
        feedback.className = 'bbox-feedback';
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 9999;
            font-weight: bold;
            animation: fadeInOut 3s ease-in-out;
        `;
        
        // CSS アニメーション追加
        if (!document.querySelector('#bbox-feedback-styles')) {
            const style = document.createElement('style');
            style.id = 'bbox-feedback-styles';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateX(100%); }
                    15%, 85% { opacity: 1; transform: translateX(0); }
                    100% { opacity: 0; transform: translateX(100%); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(feedback);
        
        // 3秒後に自動削除
        setTimeout(() => {
            if (feedback && feedback.parentElement) {
                feedback.remove();
            }
        }, 3000);
    }
}

// ========== グローバル初期化 ========== //

// シンプルSpineマネージャーインスタンス作成
const simpleSpineManagerV3 = new SimpleSpineManagerV3();

// グローバル関数公開
window.simpleSpineManagerV3 = simpleSpineManagerV3;

// ページ読み込み時の状態復元
document.addEventListener('DOMContentLoaded', () => {
    console.log('📂 ページ読み込み完了 - 状態復元を実行');
    simpleSpineManagerV3.restoreBoundingBoxState();
});

// v2アプリ統合用関数
window.createPurattokun = async () => {
    return await simpleSpineManagerV3.createBuiltInCharacter('purattokun');
};

window.createNezumi = async () => {
    return await simpleSpineManagerV3.createBuiltInCharacter('nezumi');
};

window.clearAllSpineCharacters = () => {
    simpleSpineManagerV3.clearAllCharacters();
};

// ========== マニュアル準拠: グローバル関数公開 ========== //

// バウンディングボックス編集システム（マニュアル準拠）
window.startBoundingBoxEdit = () => {
    console.log('🔍 グローバル startBoundingBoxEdit 呼び出し');
    
    // 現在存在するキャラクターを取得
    const characters = simpleSpineManagerV3.getAllCharacters();
    console.log('🔍 キャラクター数:', characters.length);
    
    if (characters.length === 0) {
        alert('編集可能なキャラクターがありません。まずキャラクターを追加してください。');
        return false;
    }

    // 最初のキャラクターに対してバウンディングボックス編集を開始
    const firstCharacter = Array.from(simpleSpineManagerV3.characters.keys())[0];
    console.log('🔍 選択されたキャラクター:', firstCharacter);
    
    const success = simpleSpineManagerV3.startBoundingBoxEdit(firstCharacter);
    
    if (success) {
        // UI状態更新（編集コントロール表示）
        const startBtn = document.getElementById('btn-start-bbox-edit');
        const controls = document.getElementById('bbox-edit-controls');
        
        if (startBtn) startBtn.style.display = 'none';
        if (controls) controls.style.display = 'block';
        
        console.log(`✅ ${firstCharacter}のバウンディングボックス編集開始完了`);
        return true;
    } else {
        alert('バウンディングボックス編集の開始に失敗しました');
        return false;
    }
};

// 保存機能（マニュアル準拠）
window.saveBoundingBoxState = () => {
    console.log('🔍 グローバル saveBoundingBoxState 呼び出し');
    return simpleSpineManagerV3.saveBoundingBoxState();
};

// キャンセル機能（マニュアル準拠）
window.cancelBoundingBoxEdit = () => {
    console.log('🔍 グローバル cancelBoundingBoxEdit 呼び出し');
    return simpleSpineManagerV3.cancelBoundingBoxEdit();
};

// 編集終了機能（マニュアル準拠）
window.endBoundingBoxEdit = () => {
    console.log('🔍 グローバル endBoundingBoxEdit 呼び出し');
    
    simpleSpineManagerV3.endBoundingBoxEdit();
    
    // UI状態更新
    const startBtn = document.getElementById('btn-start-bbox-edit');
    const controls = document.getElementById('bbox-edit-controls');
    
    if (startBtn) startBtn.style.display = 'block';
    if (controls) controls.style.display = 'none';
    
    console.log('✅ バウンディングボックス編集終了完了');
};

// デバッグ用テスト関数
window.testSimpleSpineV3 = function() {
    console.log('🔍 シンプルSpine統合システム (v3ベース) テスト開始');
    console.log('🔍 Spine WebGL状態:', typeof spine !== 'undefined' ? '利用可能' : '未読み込み');
    console.log('🔍 spine-stage要素:', document.getElementById('spine-stage') ? '発見' : '未発見');
    console.log('🔍 シンプルマネージャー:', !!window.simpleSpineManagerV3);
    
    // テストキャラクター作成
    console.log('🎭 テストキャラクター作成開始...');
    window.createPurattokun().then(result => {
        if (result) {
            console.log('✅ テストキャラクター作成成功');
        } else {
            console.error('❌ テストキャラクター作成失敗');
        }
    });
};

console.log('✅ シンプルSpine統合システム (v3ベース) 初期化完了');
console.log('🔍 window.simpleSpineManagerV3:', !!window.simpleSpineManagerV3);
console.log('🔍 利用可能な関数:', {
    simpleSpineManagerV3: !!window.simpleSpineManagerV3,
    createPurattokun: !!window.createPurattokun,
    createNezumi: !!window.createNezumi,
    clearAllSpineCharacters: !!window.clearAllSpineCharacters,
    testSimpleSpineV3: !!window.testSimpleSpineV3
});