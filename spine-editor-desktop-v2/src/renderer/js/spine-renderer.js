// 🎯 Spine Editor Desktop v2.0 - Renderer Module
// Spine Character描画・Animation制御システム
// 設計方針: 200行制限・Character描画・Animation制御の完全実現

console.log('🎨 Spine Renderer v2.0 Module 読み込み');

/**
 * Spine Character Renderer & Animation Controller
 * 責任範囲:
 * - Spineキャラクター描画・レンダリング制御（100行）
 * - アニメーション再生・制御・状態管理（100行）
 * 
 * spine-core.jsとの連携:
 * - WebGLコンテキスト・Canvas共有
 * - 基本レンダリング機能の活用
 */
class SpineRenderer {
    constructor(spineCore) {
        this.spineCore = spineCore;
        this.characters = new Map(); // characterId -> character data
        this.animations = new Map(); // characterId -> animation state
        this.renderLoops = new Map(); // characterId -> render loop function
        
        console.log('✅ SpineRenderer v2.0 初期化完了');
    }

    // ========== Character描画システム（100行制限） ========== //

    /**
     * Spineキャラクター描画・配置
     * @param {string} characterId - キャラクターID
     * @param {Object} characterData - キャラクターデータ
     * @param {Object} position - 配置位置 {x, y}
     * @param {HTMLElement} parent - 親要素
     * @returns {boolean} 成功かどうか
     */
    renderSpineCharacter(characterId, characterData, position, parent) {
        try {
            console.log('🎭 Spineキャラクター描画開始:', characterId);
            
            // Canvas作成（spine-core連携）
            const canvasId = `spine-${characterId}`;
            const canvas = this.spineCore.createSpineCanvas(canvasId, {
                width: 400,
                height: 400,
                position: position,
                parent: parent
            });
            
            if (!canvas) {
                console.error('❌ Canvas作成失敗:', characterId);
                return false;
            }
            
            // WebGLコンテキスト初期化（spine-core連携）
            const gl = this.spineCore.initializeWebGLContext(canvasId);
            if (!gl) {
                console.error('❌ WebGL初期化失敗:', characterId);
                return this.createFallbackDisplay(characterId, characterData, position, parent);
            }
            
            // キャラクターデータ保存
            this.characters.set(characterId, {
                canvas: canvas,
                gl: gl,
                data: characterData,
                position: position,
                scale: 1.0,
                visible: true
            });
            
            // 基本描画実行
            this.drawCharacterSuccess(gl, canvas, characterData.name);
            
            // インタラクション設定
            this.setupCharacterInteraction(canvas, characterId);
            
            console.log('✅ Spineキャラクター描画完了:', characterId);
            return true;
            
        } catch (error) {
            console.error('❌ Spineキャラクター描画エラー:', error);
            return this.createFallbackDisplay(characterId, characterData, position, parent);
        }
    }

    /**
     * キャラクター成功表示描画
     * @param {WebGLRenderingContext} gl - WebGLコンテキスト
     * @param {HTMLCanvasElement} canvas - Canvas要素
     * @param {string} characterName - キャラクター名
     */
    drawCharacterSuccess(gl, canvas, characterName) {
        // WebGL背景色設定（character-renderer.jsパターン継承）
        gl.clearColor(0.0, 0.5, 0.0, 0.8);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // 2Dオーバーレイテキスト（実証済みパターン）
        setTimeout(() => {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#00ff00';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Spine Ready', canvas.width / 2, canvas.height / 2 - 20);
                ctx.fillText(characterName, canvas.width / 2, canvas.height / 2 + 10);
                ctx.fillStyle = '#ffffff';
                ctx.font = '12px Arial';
                ctx.fillText('🎭 Renderer v2.0', canvas.width / 2, canvas.height / 2 + 40);
            }
        }, 100);
    }

    /**
     * フォールバック表示作成（2D/プレースホルダー）
     * @param {string} characterId - キャラクターID
     * @param {Object} characterData - キャラクターデータ
     * @param {Object} position - 配置位置
     * @param {HTMLElement} parent - 親要素
     * @returns {boolean} 作成成功かどうか
     */
    createFallbackDisplay(characterId, characterData, position, parent) {
        console.log('🔄 フォールバック表示作成:', characterId);
        
        const element = document.createElement('div');
        element.id = `fallback-${characterId}`;
        element.className = 'spine-fallback-display';
        element.style.cssText = `
            position: absolute;
            left: ${position.x}px;
            top: ${position.y}px;
            width: 150px;
            height: 200px;
            background: linear-gradient(135deg, #4a90e2, #357abd);
            border: 2px solid #ffffff;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            color: #ffffff;
            font-size: 14px;
            font-weight: bold;
            cursor: move;
            z-index: 1000;
        `;
        
        element.innerHTML = `
            <div style="font-size: 32px;">🎭</div>
            <div style="margin-top: 8px;">${characterData.name}</div>
            <div style="font-size: 10px; opacity: 0.8; margin-top: 4px;">Fallback Mode</div>
        `;
        
        parent.appendChild(element);
        
        // フォールバック用データ保存
        this.characters.set(characterId, {
            element: element,
            data: characterData,
            position: position,
            fallback: true
        });
        
        return true;
    }

    /**
     * キャラクターインタラクション設定
     * @param {HTMLCanvasElement} canvas - Canvas要素
     * @param {string} characterId - キャラクターID
     */
    setupCharacterInteraction(canvas, characterId) {
        // クリックイベント（アニメーション制御と連携）
        canvas.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('🎭 キャラクタークリック:', characterId);
            this.playClickAnimation(characterId);
        });
        
        // ホバーエフェクト
        canvas.addEventListener('mouseenter', () => {
            canvas.style.filter = 'brightness(1.1)';
        });
        
        canvas.addEventListener('mouseleave', () => {
            canvas.style.filter = 'brightness(1.0)';
        });
    }

    // ========== Animation制御システム（100行制限） ========== //

    /**
     * アニメーション状態初期化
     * @param {string} characterId - キャラクターID
     * @param {Object} animationConfig - アニメーション設定
     */
    initializeAnimation(characterId, animationConfig = {}) {
        try {
            console.log('🎬 アニメーション初期化:', characterId);
            
            const character = this.characters.get(characterId);
            if (!character) {
                console.error('❌ キャラクター未登録:', characterId);
                return false;
            }
            
            // アニメーション状態管理
            const animationState = {
                currentAnimation: 'taiki',
                isPlaying: false,
                loop: true,
                speed: 1.0,
                lastTime: 0,
                config: {
                    idle: 'taiki',
                    click: 'yarare',
                    defaultSpeed: 1.0,
                    ...animationConfig
                }
            };
            
            this.animations.set(characterId, animationState);
            
            // デフォルトアニメーション開始
            this.startIdleAnimation(characterId);
            
            console.log('✅ アニメーション初期化完了:', characterId);
            return true;
            
        } catch (error) {
            console.error('❌ アニメーション初期化エラー:', error);
            return false;
        }
    }

    /**
     * アイドルアニメーション開始
     * @param {string} characterId - キャラクターID
     */
    startIdleAnimation(characterId) {
        const animationState = this.animations.get(characterId);
        if (!animationState) return;
        
        console.log('🌊 アイドルアニメーション開始:', characterId);
        
        animationState.currentAnimation = animationState.config.idle;
        animationState.isPlaying = true;
        animationState.loop = true;
        
        this.startRenderLoop(characterId);
    }

    /**
     * クリックアニメーション再生
     * @param {string} characterId - キャラクターID
     */
    playClickAnimation(characterId) {
        const animationState = this.animations.get(characterId);
        if (!animationState) {
            console.warn('⚠️ アニメーション状態なし:', characterId);
            return;
        }
        
        console.log('🎭 クリックアニメーション再生:', characterId);
        
        // クリックアニメーション設定
        animationState.currentAnimation = animationState.config.click;
        animationState.isPlaying = true;
        animationState.loop = false;
        
        // 1.5秒後にアイドルに戻る
        setTimeout(() => {
            this.startIdleAnimation(characterId);
        }, 1500);
    }

    /**
     * レンダーループ開始
     * @param {string} characterId - キャラクターID
     */
    startRenderLoop(characterId) {
        // 既存ループ停止
        this.stopRenderLoop(characterId);
        
        const character = this.characters.get(characterId);
        const animationState = this.animations.get(characterId);
        
        if (!character || !animationState || character.fallback) {
            return; // フォールバック表示はレンダーループ不要
        }
        
        let lastTime = 0;
        
        const renderFrame = (currentTime) => {
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            
            try {
                // WebGL描画更新
                this.updateWebGLRender(character, animationState, deltaTime);
                
                // 継続判定
                if (animationState.isPlaying) {
                    const loopId = requestAnimationFrame(renderFrame);
                    this.renderLoops.set(characterId, loopId);
                }
                
            } catch (error) {
                console.error('❌ レンダーフレームエラー:', error);
                this.stopRenderLoop(characterId);
            }
        };
        
        // レンダーループ開始
        const loopId = requestAnimationFrame(renderFrame);
        this.renderLoops.set(characterId, loopId);
    }

    /**
     * WebGL描画更新
     * @param {Object} character - キャラクターデータ
     * @param {Object} animationState - アニメーション状態
     * @param {number} deltaTime - 経過時間
     */
    updateWebGLRender(character, animationState, deltaTime) {
        const { gl, canvas } = character;
        
        // ビューポート設定
        gl.viewport(0, 0, canvas.width, canvas.height);
        
        // 背景クリア（アニメーション状態に応じた色変更）
        if (animationState.currentAnimation === 'yarare') {
            gl.clearColor(0.8, 0.2, 0.2, 0.8); // 赤系（ダメージ時）
        } else {
            gl.clearColor(0.0, 0.5, 0.0, 0.8); // 緑系（通常時）
        }
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // 簡易アニメーション効果（実際のSpine WebGL実装時に置き換え）
        this.drawAnimationFrame(canvas, animationState, deltaTime);
    }

    /**
     * アニメーションフレーム描画（プレースホルダー）
     * @param {HTMLCanvasElement} canvas - Canvas要素
     * @param {Object} animationState - アニメーション状態
     * @param {number} deltaTime - 経過時間
     */
    drawAnimationFrame(canvas, animationState, deltaTime) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // 簡易アニメーション（実際のSpine WebGL実装時に置き換え）
        const time = performance.now() / 1000;
        const scale = 1.0 + Math.sin(time * 2) * 0.05; // 呼吸効果
        
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scale, scale);
        
        // アニメーション状態表示
        ctx.fillStyle = animationState.currentAnimation === 'yarare' ? '#ff4444' : '#44ff44';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(animationState.currentAnimation, 0, -10);
        ctx.fillText('🎭', 0, 20);
        
        ctx.restore();
    }

    /**
     * レンダーループ停止
     * @param {string} characterId - キャラクターID
     */
    stopRenderLoop(characterId) {
        const loopId = this.renderLoops.get(characterId);
        if (loopId) {
            cancelAnimationFrame(loopId);
            this.renderLoops.delete(characterId);
        }
    }

    /**
     * 全アニメーション停止
     */
    stopAllAnimations() {
        for (const characterId of this.renderLoops.keys()) {
            this.stopRenderLoop(characterId);
        }
        console.log('✅ 全アニメーション停止完了');
    }

    /**
     * キャラクター削除
     * @param {string} characterId - キャラクターID
     */
    removeCharacter(characterId) {
        // レンダーループ停止
        this.stopRenderLoop(characterId);
        
        // Canvas削除（spine-core連携）
        const character = this.characters.get(characterId);
        if (character && character.canvas) {
            this.spineCore.removeCanvas(`spine-${characterId}`);
        } else if (character && character.element) {
            character.element.remove();
        }
        
        // データクリーンアップ
        this.characters.delete(characterId);
        this.animations.delete(characterId);
        
        console.log('✅ キャラクター削除完了:', characterId);
    }

    /**
     * システム状態取得
     * @returns {Object} システム状態
     */
    getSystemStatus() {
        return {
            characterCount: this.characters.size,
            animationCount: this.animations.size,
            activeRenderLoops: this.renderLoops.size,
            characters: Array.from(this.characters.keys())
        };
    }

    /**
     * デバッグ情報出力
     */
    debugSystemInfo() {
        console.log('🎨 === SpineRenderer v2.0 システム情報 ===');
        console.log('状態:', this.getSystemStatus());
        
        for (const [characterId, character] of this.characters) {
            console.log(`Character [${characterId}]:`, {
                fallback: character.fallback || false,
                position: character.position,
                visible: character.visible
            });
        }
        
        console.log('🎨 === システム情報終了 ===');
    }
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpineRenderer;
}

// Global registration
window.SpineRenderer = SpineRenderer;

console.log('✅ Spine Renderer v2.0 Module 読み込み完了');