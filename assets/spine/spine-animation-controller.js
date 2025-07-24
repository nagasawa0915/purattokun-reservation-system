/**
 * Spine アニメーション制御システム
 * アニメーションシーケンス、フェード効果、タイミング制御を管理
 */

class SpineAnimationController {
    constructor() {
        this.animations = new Map();
        this.fadeEffects = new Map();
        this.animationQueue = new Map();
    }

    /**
     * フェードイン効果の実行
     * @param {string} characterName - キャラクター名
     * @param {HTMLElement|Canvas} element - アニメーション対象要素
     * @param {object} config - フェード設定
     */
    async executeHtmlFadeIn(characterName, element, config) {
        log(LogLevel.DEBUG, 'animation', `Starting HTML fade-in for ${characterName}`, config);

        if (!element) {
            log(LogLevel.WARN, 'animation', `Element not found for ${characterName} fade-in`);
            return;
        }

        // 初期状態設定
        element.style.opacity = '0';
        element.style.transition = 'none';

        // 遅延待機
        if (config.fadeDelay > 0) {
            log(LogLevel.DEBUG, 'animation', `Waiting ${config.fadeDelay}ms before fade-in`);
            await this.delay(config.fadeDelay);
        }

        // フェードイン実行
        element.style.transition = `opacity ${config.fadeDuration}ms ease-in-out`;
        element.style.opacity = '1';

        log(LogLevel.INFO, 'animation', `Fade-in completed for ${characterName}`);

        // フェード完了後のコールバック
        setTimeout(() => {
            this.onFadeComplete(characterName);
        }, config.fadeDuration);
    }

    /**
     * フェード完了時の処理
     * @param {string} characterName - キャラクター名
     */
    onFadeComplete(characterName) {
        log(LogLevel.DEBUG, 'animation', `Fade complete callback for ${characterName}`);
        
        // キューに入っているアニメーションがあれば実行
        const queuedAnimation = this.animationQueue.get(characterName);
        if (queuedAnimation) {
            this.playAnimation(characterName, queuedAnimation.name, queuedAnimation.loop);
            this.animationQueue.delete(characterName);
        }
    }

    /**
     * アニメーション再生
     * @param {string} characterName - キャラクター名
     * @param {string} animationName - アニメーション名
     * @param {boolean} loop - ループフラグ
     */
    playAnimation(characterName, animationName = 'taiki', loop = true) {
        log(LogLevel.DEBUG, 'animation', `Playing animation ${animationName} for ${characterName}, loop: ${loop}`);

        // v2.0では characterManager.characters が正しいパス
        const character = window.spineManager?.characterManager?.characters?.get(characterName);
        if (!character) {
            log(LogLevel.WARN, 'animation', `Character ${characterName} not found for animation`);
            console.log('🔍 DEBUG: Available characters:', window.spineManager?.characterManager?.characters?.keys());
            return;
        }

        if (character.type === 'placeholder') {
            this.playPlaceholderAnimation(character, animationName);
        } else if (character.type === 'spine') {
            this.playSpineAnimation(character, animationName, loop);
        }
    }

    /**
     * プレースホルダーアニメーション再生
     * @param {object} character - キャラクターオブジェクト
     * @param {string} animationName - アニメーション名
     */
    playPlaceholderAnimation(character, animationName) {
        if (!character.element) return;

        const animations = {
            'syutugen': 'placeholderAppear 1s ease-out',
            'taiki': 'placeholderFloat 3s ease-in-out infinite',
            'click': 'placeholderBounce 0.5s ease-out'
        };

        const animationCSS = animations[animationName] || animations['taiki'];
        character.element.style.animation = animationCSS;

        log(LogLevel.DEBUG, 'animation', `Placeholder animation applied: ${animationCSS}`);
    }

    /**
     * Spine WebGLアニメーション再生
     * @param {object} character - キャラクターオブジェクト
     * @param {string} animationName - アニメーション名
     * @param {boolean} loop - ループフラグ
     */
    playSpineAnimation(character, animationName, loop) {
        if (!character.skeleton || !character.animationState) {
            log(LogLevel.WARN, 'animation', 'Spine character missing skeleton or animation state');
            return;
        }

        try {
            // アニメーション設定
            character.animationState.setAnimation(0, animationName, loop);
            log(LogLevel.INFO, 'animation', `Spine animation ${animationName} set with loop: ${loop}`);

        } catch (error) {
            log(LogLevel.ERROR, 'animation', `Failed to set Spine animation: ${error.message}`);
            // フォールバックとしてプレースホルダーアニメーション
            this.playPlaceholderAnimation(character, animationName);
        }
    }

    /**
     * アニメーションシーケンス実行
     * @param {string} characterName - キャラクター名
     * @param {Array} sequence - アニメーションシーケンス
     */
    async playSequence(characterName, sequence = ['syutugen', 'taiki']) {
        log(LogLevel.INFO, 'animation', `Starting animation sequence for ${characterName}:`, sequence);

        for (let i = 0; i < sequence.length; i++) {
            const animationName = sequence[i];
            const isLast = i === sequence.length - 1;
            const shouldLoop = isLast; // 最後のアニメーションはループ

            this.playAnimation(characterName, animationName, shouldLoop);

            // 最後以外のアニメーションは完了まで待機
            if (!isLast) {
                await this.waitForAnimationComplete(characterName, animationName);
            }
        }

        log(LogLevel.INFO, 'animation', `Animation sequence completed for ${characterName}`);
    }

    /**
     * アニメーション完了待機
     * @param {string} characterName - キャラクター名
     * @param {string} animationName - アニメーション名
     * @returns {Promise} 完了Promise
     */
    waitForAnimationComplete(characterName, animationName) {
        return new Promise((resolve) => {
            // アニメーション種別による待機時間
            const waitTimes = {
                'syutugen': 2000,  // 出現アニメーション
                'click': 1000,     // クリックアニメーション
                'default': 1500    // その他
            };

            const waitTime = waitTimes[animationName] || waitTimes['default'];
            
            setTimeout(() => {
                log(LogLevel.DEBUG, 'animation', `Animation ${animationName} wait completed for ${characterName}`);
                resolve();
            }, waitTime);
        });
    }

    /**
     * アニメーションをキューに追加
     * @param {string} characterName - キャラクター名
     * @param {string} animationName - アニメーション名
     * @param {boolean} loop - ループフラグ
     */
    queueAnimation(characterName, animationName, loop = true) {
        this.animationQueue.set(characterName, {
            name: animationName,
            loop: loop
        });
        
        log(LogLevel.DEBUG, 'animation', `Animation queued for ${characterName}: ${animationName}`);
    }

    /**
     * すべてのアニメーション停止
     * @param {string} characterName - キャラクター名
     */
    stopAllAnimations(characterName) {
        const character = window.spineManager?.characterManager?.characters?.get(characterName);
        if (!character) return;

        if (character.type === 'placeholder' && character.element) {
            character.element.style.animation = 'none';
        } else if (character.type === 'spine' && character.animationState) {
            character.animationState.clearTracks();
        }

        // キューもクリア
        this.animationQueue.delete(characterName);
        
        log(LogLevel.DEBUG, 'animation', `All animations stopped for ${characterName}`);
    }

    /**
     * 遅延ユーティリティ
     * @param {number} ms - 遅延時間（ミリ秒）
     * @returns {Promise} 遅延Promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * CSS keyframe アニメーション定義の追加
     */
    addPlaceholderAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes placeholderFloat {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                25% { transform: translateY(-5px) rotate(2deg); }
                50% { transform: translateY(-3px) rotate(0deg); }
                75% { transform: translateY(-7px) rotate(-2deg); }
            }

            @keyframes placeholderAppear {
                0% { 
                    opacity: 0; 
                    transform: scale(0.5) translateY(20px); 
                }
                50% { 
                    opacity: 0.7; 
                    transform: scale(1.1) translateY(-5px); 
                }
                100% { 
                    opacity: 1; 
                    transform: scale(1) translateY(0px); 
                }
            }

            @keyframes placeholderBounce {
                0%, 100% { transform: scale(1); }
                25% { transform: scale(1.2) rotate(5deg); }
                50% { transform: scale(0.9) rotate(-3deg); }
                75% { transform: scale(1.1) rotate(2deg); }
            }
        `;
        
        document.head.appendChild(style);
        log(LogLevel.DEBUG, 'animation', 'Placeholder animation CSS keyframes added');
    }
}