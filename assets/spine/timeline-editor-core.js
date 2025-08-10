// 🎬 タイムライン編集UI - コアシステム（350行以内）
// 役割: 基本UI構造・パネル管理・基本制御
// 分割元: timeline-editor-ui.js の core 機能のみ抽出

console.log('🎬 Timeline Editor Core モジュール読み込み開始');

/**
 * タイムライン編集UI - コアシステム
 * 基本UI構造・パネル管理・基本制御のみ
 */
class TimelineEditorCore {
    constructor(options = {}) {
        this.containerId = options.containerId || 'timeline-editor-container';
        this.mode = options.mode || 'integrated'; // 'integrated' or 'standalone'
        this.currentTime = 0;
        this.maxTime = options.maxTime || 10;
        this.isPlaying = false;
        this.playbackSpeed = options.playbackSpeed || 1;
        this.isVisible = false;
        
        // 編集システム統合用のコールバック
        this.onTimelineChange = options.onTimelineChange || null;
        this.onKeyframeEdit = options.onKeyframeEdit || null;
        
        console.log('🎨 Timeline Editor Core 初期化完了');
    }
    
    /**
     * タイムライン編集UIを作成・表示
     */
    show(parentContainer = null) {
        if (this.isVisible) return;
        
        const container = parentContainer || document.body;
        const uiElement = this.createTimelineEditorHTML();
        
        // コンテナに追加
        if (parentContainer) {
            parentContainer.appendChild(uiElement);
        } else {
            // 独立表示の場合は画面右側に配置
            uiElement.style.position = 'fixed';
            uiElement.style.right = '20px';
            uiElement.style.top = '50%';
            uiElement.style.transform = 'translateY(-50%)';
            uiElement.style.zIndex = '2000';
            container.appendChild(uiElement);
        }
        
        // 基本イベントリスナー設定
        this.setupBasicEventListeners();
        this.startUpdateLoop();
        
        this.isVisible = true;
        console.log('✅ Timeline Editor Core 表示完了');
    }
    
    /**
     * タイムライン編集UIを非表示
     */
    hide() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.remove();
        }
        this.isVisible = false;
        console.log('➖ Timeline Editor Core 非表示');
    }
    
    /**
     * タイムライン編集UIのHTML構造を作成
     */
    createTimelineEditorHTML() {
        const container = document.createElement('div');
        container.id = this.containerId;
        container.className = 'timeline-editor-panel';
        
        container.innerHTML = `
            <div class="timeline-editor-header">
                <h3>🎬 タイムライン編集</h3>
                <button class="timeline-close-btn" id="timeline-close-btn">✕</button>
            </div>
            
            <div class="timeline-controls-section">
                <div class="timeline-playback-controls">
                    <button class="timeline-btn timeline-play" id="timeline-play">▶️</button>
                    <button class="timeline-btn timeline-pause" id="timeline-pause">⏸️</button>
                    <button class="timeline-btn timeline-stop" id="timeline-stop">⏹️</button>
                    <button class="timeline-btn timeline-reset" id="timeline-reset">🔄</button>
                </div>
                
                <div class="timeline-time-display">
                    <span id="timeline-current-time">0.0s</span> / <span>${this.maxTime}s</span>
                </div>
            </div>
            
            <div class="timeline-track-area">
                <div class="timeline-ruler">
                    <div class="ruler-marks"></div>
                    <div class="playhead" id="timeline-playhead"></div>
                </div>
                
                <div class="character-tracks" id="timeline-character-tracks">
                    <!-- 動的に生成されるトラック - KeyframeUI が管理 -->
                </div>
            </div>
            
            <div class="timeline-scrubber-container">
                <input type="range" id="timeline-scrubber" class="timeline-scrubber" 
                       min="0" max="${this.maxTime}" step="0.1" value="0">
            </div>
        `;
        
        // スタイル適用
        this.applyCoreStyles(container);
        
        return container;
    }
    
    /**
     * 基本スタイルを外部CSSファイルから読み込み
     */
    applyCoreStyles(container) {
        // 軽量化: スタイル定義を別ファイルに移行
        // assets/spine/styles/timeline-core.css で管理
        if (!document.head.querySelector('#timeline-core-styles-link')) {
            const link = document.createElement('link');
            link.id = 'timeline-core-styles-link';
            link.rel = 'stylesheet';
            link.href = 'assets/spine/styles/timeline-core.css';
            document.head.appendChild(link);
        }
    }
    
    /**
     * 基本的なイベントリスナーを設定
     */
    setupBasicEventListeners() {
        // 閉じるボタン
        const closeBtn = document.getElementById('timeline-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
        
        // 再生制御ボタン
        const playBtn = document.getElementById('timeline-play');
        const pauseBtn = document.getElementById('timeline-pause');
        const stopBtn = document.getElementById('timeline-stop');
        const resetBtn = document.getElementById('timeline-reset');
        
        if (playBtn) playBtn.addEventListener('click', () => this.play());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pause());
        if (stopBtn) stopBtn.addEventListener('click', () => this.stop());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        
        // タイムラインスクラバー
        const scrubber = document.getElementById('timeline-scrubber');
        if (scrubber) {
            scrubber.addEventListener('input', (e) => {
                this.currentTime = parseFloat(e.target.value);
                this.updateTimeDisplay();
                this.updatePlayhead();
                
                if (this.onTimelineChange) {
                    this.onTimelineChange(this.currentTime);
                }
            });
        }
    }
    
    /**
     * 再生開始
     */
    play() {
        this.isPlaying = true;
        console.log('▶️ Timeline 再生開始');
    }
    
    /**
     * 再生一時停止
     */
    pause() {
        this.isPlaying = false;
        console.log('⏸️ Timeline 一時停止');
    }
    
    /**
     * 再生停止
     */
    stop() {
        this.isPlaying = false;
        this.currentTime = 0;
        this.updateTimeDisplay();
        this.updatePlayhead();
        console.log('⏹️ Timeline 停止');
    }
    
    /**
     * リセット
     */
    reset() {
        this.stop();
        console.log('🔄 Timeline リセット');
    }
    
    /**
     * 時間表示を更新
     */
    updateTimeDisplay() {
        const timeDisplay = document.getElementById('timeline-current-time');
        if (timeDisplay) {
            timeDisplay.textContent = `${this.currentTime.toFixed(1)}s`;
        }
        
        const scrubber = document.getElementById('timeline-scrubber');
        if (scrubber) {
            scrubber.value = this.currentTime;
        }
    }
    
    /**
     * プレイヘッドを更新
     */
    updatePlayhead() {
        const playhead = document.getElementById('timeline-playhead');
        if (playhead) {
            const progress = (this.currentTime / this.maxTime) * 100;
            playhead.style.left = `${progress}%`;
        }
    }
    
    /**
     * 更新ループ開始
     */
    startUpdateLoop() {
        const update = () => {
            if (this.isPlaying) {
                this.currentTime += 0.1 * this.playbackSpeed;
                
                if (this.currentTime >= this.maxTime) {
                    this.currentTime = this.maxTime;
                    this.pause();
                }
                
                this.updateTimeDisplay();
                this.updatePlayhead();
                
                if (this.onTimelineChange) {
                    this.onTimelineChange(this.currentTime);
                }
            }
            
            if (this.isVisible) {
                requestAnimationFrame(update);
            }
        };
        
        update();
    }
}

// グローバルに公開
window.TimelineEditorCore = TimelineEditorCore;

console.log('✅ Timeline Editor Core モジュール読み込み完了');