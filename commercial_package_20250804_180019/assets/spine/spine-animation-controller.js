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
     * プレースホルダーアニメーション再生（シーケンス対応版）
     * @param {object} character - キャラクターオブジェクト
     * @param {string} animationName - アニメーション名
     */
    playPlaceholderAnimation(character, animationName) {
        if (!character.element) return;

        const animations = {
            'syutugen': 'placeholderAppear 1s ease-out',
            'taiki': 'placeholderFloat 3s ease-in-out infinite',
            'yarare': 'placeholderDamage 1.2s ease-out',
            'click': 'placeholderBounce 0.5s ease-out'
        };

        const animationCSS = animations[animationName] || animations['taiki'];
        character.element.style.animation = animationCSS;

        log(LogLevel.DEBUG, 'animation', `Placeholder animation applied: ${animationCSS}`);

        // アニメーションシーケンス処理（プレースホルダー用）
        if (animationName === 'syutugen') {
            setTimeout(() => {
                character.element.style.animation = animations['taiki'];
                log(LogLevel.DEBUG, 'animation', 'Placeholder: syutugen → taiki transition completed');
            }, 1000); // syutugen アニメーション時間後にtaikiに切り替え
        } else if (animationName === 'yarare') {
            setTimeout(() => {
                character.element.style.animation = animations['taiki'];
                log(LogLevel.DEBUG, 'animation', 'Placeholder: yarare → taiki transition completed');
            }, 1200); // yarare アニメーション時間後にtaikiに切り替え
        }
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

            // アニメーション完了イベントの設定（→ taiki遷移用）
            if ((animationName === 'syutugen' || animationName === 'yarare') && !loop) {
                this.setupAnimationCompleteListener(character, () => {
                    const transitionType = animationName === 'syutugen' ? 'appearance' : 'damage';
                    log(LogLevel.INFO, 'animation', `${animationName} animation completed (${transitionType}), transitioning to taiki`);
                    this.playSpineAnimation(character, 'taiki', true);
                });
            }

        } catch (error) {
            log(LogLevel.ERROR, 'animation', `Failed to set Spine animation: ${error.message}`);
            // フォールバックとしてプレースホルダーアニメーション
            this.playPlaceholderAnimation(character, animationName);
        }
    }

    /**
     * アニメーション完了リスナーを設定
     * @param {object} character - キャラクターオブジェクト
     * @param {function} callback - 完了時のコールバック
     */
    setupAnimationCompleteListener(character, callback) {
        if (!character.animationState) return;

        try {
            // Spine AnimationStateの完了イベントを監視
            const listener = {
                complete: (entry) => {
                    log(LogLevel.DEBUG, 'animation', `Animation ${entry.animation.name} completed`);
                    callback();
                    // リスナーを削除してメモリリークを防ぐ
                    character.animationState.removeListener(listener);
                }
            };

            character.animationState.addListener(listener);
            log(LogLevel.DEBUG, 'animation', 'Animation complete listener set up');

        } catch (error) {
            log(LogLevel.WARN, 'animation', 'Failed to set up animation listener, using timeout fallback');
            // フォールバック：タイマーベースの完了判定
            setTimeout(() => {
                callback();
            }, 2000); // syutugenアニメーションの推定時間
        }
    }

    /**
     * アニメーションシーケンス実行（改良版：自然な遷移対応）
     * @param {string} characterName - キャラクター名
     * @param {Array} sequence - アニメーションシーケンス
     */
    async playSequence(characterName, sequence = ['syutugen', 'taiki']) {
        log(LogLevel.INFO, 'animation', `Starting enhanced animation sequence for ${characterName}:`, sequence);

        // 特別処理：自然な遷移アニメーション
        if (sequence.length === 2 && sequence[1] === 'taiki') {
            const firstAnim = sequence[0];
            
            if (firstAnim === 'syutugen') {
                // 出現→待機の遷移
                this.playAnimation(characterName, 'syutugen', false);
                log(LogLevel.INFO, 'animation', `Playing syutugen (appearance) animation once for ${characterName}`);
            } else if (firstAnim === 'yarare') {
                // やられ→待機の遷移
                this.playAnimation(characterName, 'yarare', false);
                log(LogLevel.INFO, 'animation', `Playing yarare (damage) animation once for ${characterName}`);
            }
            
            // アニメーション完了は playSpineAnimation 内で自動的にtaikiに遷移
            return;
        }

        // 通常のシーケンス処理（旧来互換性）
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

            @keyframes placeholderDamage {
                0% { 
                    transform: scale(1) rotate(0deg); 
                    opacity: 1; 
                }
                15% { 
                    transform: scale(0.8) rotate(-10deg); 
                    opacity: 0.7; 
                }
                30% { 
                    transform: scale(1.1) rotate(8deg); 
                    opacity: 0.9; 
                }
                45% { 
                    transform: scale(0.9) rotate(-5deg); 
                    opacity: 0.6; 
                }
                60% { 
                    transform: scale(1.05) rotate(3deg); 
                    opacity: 0.8; 
                }
                80% { 
                    transform: scale(0.95) rotate(-2deg); 
                    opacity: 0.9; 
                }
                100% { 
                    transform: scale(1) rotate(0deg); 
                    opacity: 1; 
                }
            }
        `;
        
        document.head.appendChild(style);
        log(LogLevel.DEBUG, 'animation', 'Placeholder animation CSS keyframes added');
    }
}