// ✨ タイムライン ビジュアル エフェクト（200行以内）
// 役割: アニメーション・エフェクト・視覚的フィードバック・UI演出
// 依存: timeline-editor-core.js

console.log('✨ Timeline Visual Effects モジュール読み込み開始');

/**
 * タイムライン ビジュアルエフェクト管理システム
 * UI演出・アニメーション・視覚的フィードバックを担当
 */
class TimelineVisualEffects {
    constructor(coreInstance) {
        this.core = coreInstance;
        this.animationQueue = [];
        this.currentEffects = new Set();
        
        console.log('✨ Timeline Visual Effects 初期化完了');
    }
    
    /**
     * ビジュアルエフェクトを初期化
     */
    init() {
        this.applyEffectStyles();
        this.setupEffectTriggers();
        
        console.log('✅ Visual Effects 初期化完了');
    }
    
    /**
     * エフェクト用スタイルを適用
     */
    applyEffectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* アニメーション定義 */
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            @keyframes glow {
                0%, 100% { box-shadow: 0 0 5px rgba(102, 126, 234, 0.3); }
                50% { box-shadow: 0 0 15px rgba(102, 126, 234, 0.8); }
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
            }
            
            @keyframes sparkle {
                0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
                50% { opacity: 1; transform: scale(1) rotate(180deg); }
            }
            
            @keyframes ripple {
                0% { transform: scale(0); opacity: 1; }
                100% { transform: scale(2); opacity: 0; }
            }
            
            /* エフェクトクラス */
            .effect-pulse { animation: pulse 1s ease-in-out infinite; }
            .effect-glow { animation: glow 2s ease-in-out infinite; }
            .effect-slide-in { animation: slideIn 0.3s ease-out; }
            .effect-slide-out { animation: slideOut 0.3s ease-in; }
            .effect-bounce { animation: bounce 0.6s ease-out; }
            
            .effect-playing .playhead {
                animation: glow 1s ease-in-out infinite;
                box-shadow: 0 0 12px rgba(229, 62, 62, 0.8);
            }
            
            .effect-hover-enhance:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                transition: all 0.2s ease;
            }
            
            .effect-button-press {
                transform: scale(0.95);
                transition: transform 0.1s ease;
            }
            
            .sparkle-container {
                position: absolute;
                pointer-events: none;
                z-index: 100;
            }
            
            .sparkle {
                position: absolute;
                width: 4px;
                height: 4px;
                background: #ffeb3b;
                border-radius: 50%;
                animation: sparkle 1s ease-in-out;
            }
            
            .ripple-effect {
                position: absolute;
                border: 2px solid rgba(102, 126, 234, 0.6);
                border-radius: 50%;
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            }
            
            /* 成功/エラーフィードバック */
            .feedback-success {
                background: linear-gradient(45deg, #48bb78, #68d391) !important;
                animation: bounce 0.6s ease-out;
            }
            
            .feedback-error {
                background: linear-gradient(45deg, #e53e3e, #fc8181) !important;
                animation: pulse 0.5s ease-in-out 3;
            }
            
            /* プログレスバー効果 */
            .progress-bar {
                position: absolute;
                top: 0;
                left: 0;
                height: 2px;
                background: linear-gradient(90deg, #667eea, #764ba2);
                transition: width 0.1s ease;
                border-radius: 1px;
            }
            
            /* 粒子エフェクト */
            .particle {
                position: absolute;
                width: 2px;
                height: 2px;
                background: rgba(102, 126, 234, 0.8);
                border-radius: 50%;
                pointer-events: none;
                animation: sparkle 1.5s ease-out forwards;
            }
        `;
        
        if (!document.head.querySelector('#timeline-effects-styles')) {
            style.id = 'timeline-effects-styles';
            document.head.appendChild(style);
        }
    }
    
    /**
     * エフェクトトリガーを設定
     */
    setupEffectTriggers() {
        // パネル表示時のアニメーション
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.id === this.core.containerId) {
                        this.playPanelEntrance(node);
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // ボタンエフェクト
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('timeline-btn') ||
                e.target.classList.contains('timeline-btn-secondary') ||
                e.target.classList.contains('timeline-btn-danger')) {
                this.playButtonPressEffect(e.target);
            }
        });
        
        // キーフレーム選択エフェクト
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('keyframe')) {
                this.playKeyframeSelectEffect(e.target);
            }
        });
    }
    
    /**
     * パネル登場アニメーション
     */
    playPanelEntrance(panel) {
        panel.classList.add('effect-slide-in');
        this.createSparkleEffect(panel);
        
        setTimeout(() => {
            panel.classList.remove('effect-slide-in');
        }, 300);
        
        console.log('✨ パネル登場エフェクト再生');
    }
    
    /**
     * パネル退場アニメーション
     */
    playPanelExit(panel, callback) {
        panel.classList.add('effect-slide-out');
        
        setTimeout(() => {
            if (callback) callback();
        }, 300);
        
        console.log('✨ パネル退場エフェクト再生');
    }
    
    /**
     * ボタン押下エフェクト
     */
    playButtonPressEffect(button) {
        button.classList.add('effect-button-press');
        this.createRippleEffect(button);
        
        setTimeout(() => {
            button.classList.remove('effect-button-press');
        }, 150);
    }
    
    /**
     * キーフレーム選択エフェクト
     */
    playKeyframeSelectEffect(keyframe) {
        keyframe.classList.add('effect-bounce');
        this.createParticleEffect(keyframe);
        
        setTimeout(() => {
            keyframe.classList.remove('effect-bounce');
        }, 600);
    }
    
    /**
     * 再生開始エフェクト
     */
    playStartEffect() {
        const container = document.getElementById(this.core.containerId);
        if (container) {
            container.classList.add('effect-playing');
            this.createProgressBar();
        }
        
        console.log('▶️ 再生開始エフェクト');
    }
    
    /**
     * 再生停止エフェクト
     */
    playStopEffect() {
        const container = document.getElementById(this.core.containerId);
        if (container) {
            container.classList.remove('effect-playing');
            this.removeProgressBar();
        }
        
        console.log('⏹️ 再生停止エフェクト');
    }
    
    /**
     * 成功フィードバック
     */
    showSuccessFeedback(element, message = '成功!') {
        element.classList.add('feedback-success');
        this.showTooltip(element, message, 'success');
        
        setTimeout(() => {
            element.classList.remove('feedback-success');
        }, 600);
    }
    
    /**
     * エラーフィードバック
     */
    showErrorFeedback(element, message = 'エラー!') {
        element.classList.add('feedback-error');
        this.showTooltip(element, message, 'error');
        
        setTimeout(() => {
            element.classList.remove('feedback-error');
        }, 1500);
    }
    
    /**
     * キラキラエフェクト作成
     */
    createSparkleEffect(element) {
        const rect = element.getBoundingClientRect();
        const sparkleCount = 6;
        
        for (let i = 0; i < sparkleCount; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'sparkle';
                sparkle.style.left = `${Math.random() * rect.width}px`;
                sparkle.style.top = `${Math.random() * rect.height}px`;
                
                element.appendChild(sparkle);
                
                setTimeout(() => sparkle.remove(), 1000);
            }, i * 100);
        }
    }
    
    /**
     * リップルエフェクト作成
     */
    createRippleEffect(element) {
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        ripple.style.transform = 'translate(-50%, -50%)';
        
        element.style.position = 'relative';
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
    
    /**
     * パーティクルエフェクト作成
     */
    createParticleEffect(element) {
        const rect = element.getBoundingClientRect();
        const particleCount = 8;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = 20;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            particle.style.left = `${rect.width / 2 + x}px`;
            particle.style.top = `${rect.height / 2 + y}px`;
            
            element.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1500);
        }
    }
    
    /**
     * プログレスバー作成
     */
    createProgressBar() {
        const ruler = document.querySelector('.timeline-ruler');
        if (!ruler || ruler.querySelector('.progress-bar')) return;
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        ruler.appendChild(progressBar);
        
        this.updateProgressBar();
    }
    
    /**
     * プログレスバー更新
     */
    updateProgressBar() {
        const progressBar = document.querySelector('.progress-bar');
        if (!progressBar) return;
        
        const progress = (this.core.currentTime / this.core.maxTime) * 100;
        progressBar.style.width = `${progress}%`;
    }
    
    /**
     * プログレスバー削除
     */
    removeProgressBar() {
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.remove();
        }
    }
    
    /**
     * ツールチップ表示
     */
    showTooltip(element, message, type = 'info') {
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip-${type}`;
        tooltip.textContent = message;
        tooltip.style.cssText = `
            position: absolute;
            background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#e53e3e' : '#667eea'};
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            z-index: 1000;
            pointer-events: none;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            animation: bounce 0.3s ease-out;
        `;
        
        element.style.position = 'relative';
        element.appendChild(tooltip);
        
        setTimeout(() => tooltip.remove(), 2000);
    }
    
    /**
     * カスタムエフェクト実行
     */
    playCustomEffect(element, effectName, duration = 1000) {
        element.classList.add(`effect-${effectName}`);
        
        setTimeout(() => {
            element.classList.remove(`effect-${effectName}`);
        }, duration);
        
        console.log(`✨ カスタムエフェクト: ${effectName}`);
    }
    
    /**
     * エフェクトクリア
     */
    clearAllEffects() {
        this.currentEffects.clear();
        
        // 全てのエフェクトクラスを削除
        const elements = document.querySelectorAll('[class*="effect-"]');
        elements.forEach(element => {
            element.className = element.className.replace(/\beffect-\S+/g, '');
        });
        
        // プログレスバー削除
        this.removeProgressBar();
        
        console.log('✨ 全エフェクトクリア');
    }
}

// グローバルに公開
window.TimelineVisualEffects = TimelineVisualEffects;

console.log('✅ Timeline Visual Effects モジュール読み込み完了');