/**
 * TimelineModule.js - タイムライン表示・制御マイクロモジュール
 * 
 * 責務:
 * - 複数キャラクターのアニメーションタイムライン表示
 * - トラック管理
 * - 再生制御
 * 
 * 依存: EventBusのみ
 */

export default class TimelineModule {
    constructor(options = {}) {
        this.container = options.container;
        this.eventBus = options.eventBus;
        
        // タイムライン設定
        this.config = {
            maxTime: 120, // 最大時間（秒）
            pixelsPerSecond: 10, // 1秒あたりのピクセル数
            trackHeight: 40, // トラックの高さ
            trackSpacing: 2, // トラック間のスペース
            ...options.config
        };
        
        // 状態管理
        this.tracks = new Map(); // キャラクター別トラック
        this.currentTime = 0;
        this.isPlaying = false;
        this.selectedTracks = new Set();
        
        this.init();
    }
    
    init() {
        this.createTimelineContainer();
        this.createTimeRuler();
        this.createTracksContainer();
        this.createPlaybackControls();
        this.bindEvents();
        
        this.emit('timeline:initialized');
        console.log('✅ TimelineModule 初期化完了');
    }
    
    createTimelineContainer() {
        this.container.innerHTML = `
            <div class="timeline-container">
                <div class="timeline-header">
                    <div class="timeline-controls">
                        <button class="timeline-btn play-btn" title="再生/停止">
                            <span class="icon">▶️</span>
                        </button>
                        <button class="timeline-btn stop-btn" title="停止">
                            <span class="icon">⏹️</span>
                        </button>
                        <span class="timeline-time">00:00 / ${this.formatTime(this.config.maxTime)}</span>
                    </div>
                    <div class="timeline-options">
                        <label class="timeline-checkbox">
                            <input type="checkbox" checked>
                            <span>Loop</span>
                        </label>
                    </div>
                </div>
                <div class="timeline-content">
                    <div class="timeline-ruler"></div>
                    <div class="timeline-tracks"></div>
                    <div class="timeline-playhead" style="left: 0px;"></div>
                </div>
            </div>
        `;
        
        // 要素参照を保存
        this.timelineContent = this.container.querySelector('.timeline-content');
        this.ruler = this.container.querySelector('.timeline-ruler');
        this.tracksContainer = this.container.querySelector('.timeline-tracks');
        this.playhead = this.container.querySelector('.timeline-playhead');
        this.playBtn = this.container.querySelector('.play-btn');
        this.timeDisplay = this.container.querySelector('.timeline-time');
    }
    
    createTimeRuler() {
        const rulerWidth = this.config.maxTime * this.config.pixelsPerSecond;
        this.ruler.style.width = `${rulerWidth}px`;
        
        // 時間目盛りを作成
        let rulerHTML = '';
        for (let i = 0; i <= this.config.maxTime; i += 10) {
            const position = i * this.config.pixelsPerSecond;
            rulerHTML += `
                <div class="ruler-mark major" style="left: ${position}px;">
                    <span class="ruler-label">${i}s</span>
                </div>
            `;
            
            // 5秒間隔の細かい目盛り
            if (i + 5 <= this.config.maxTime) {
                const minorPosition = (i + 5) * this.config.pixelsPerSecond;
                rulerHTML += `
                    <div class="ruler-mark minor" style="left: ${minorPosition}px;"></div>
                `;
            }
        }
        this.ruler.innerHTML = rulerHTML;
    }
    
    createTracksContainer() {
        // サンプルトラックを作成（後でEventBusで動的に追加）
        this.addTrack('nezumi', {
            animations: [
                { name: 'syutugen', start: 26, duration: 27, color: '#4CAF50' },
                { name: 'taiki', start: 54, duration: 20, color: '#FFC107' }
            ]
        });
        
        this.addTrack('purattokun 1', {
            animations: [
                { name: 'syutugen', start: 15, duration: 59, color: '#4CAF50' },
                { name: 'taiki', start: 74, duration: 16, color: '#FFC107' }
            ]
        });
        
        this.addTrack('purattokun 2', {
            animations: [
                { name: 'syutugen', start: 15, duration: 27, color: '#4CAF50' },
                { name: 'taiki', start: 42, duration: 27, color: '#FFC107' }
            ]
        });
        
        this.addTrack('purattokun 3', {
            animations: [
                { name: 'syutugen', start: 32, duration: 74, color: '#4CAF50' }
            ]
        });
    }
    
    addTrack(characterName, trackData) {
        const trackElement = document.createElement('div');
        trackElement.className = 'timeline-track';
        trackElement.dataset.character = characterName;
        
        const trackWidth = this.config.maxTime * this.config.pixelsPerSecond;
        
        let animationsHTML = '';
        trackData.animations.forEach(animation => {
            const startPos = animation.start * this.config.pixelsPerSecond;
            const width = animation.duration * this.config.pixelsPerSecond;
            
            animationsHTML += `
                <div class="animation-bar" 
                     style="left: ${startPos}px; width: ${width}px; background-color: ${animation.color};"
                     data-animation="${animation.name}"
                     title="${animation.name} (${animation.start}s - ${animation.start + animation.duration}s)">
                    <span class="animation-label">${animation.name}</span>
                </div>
            `;
        });
        
        trackElement.innerHTML = `
            <div class="track-header">
                <span class="track-name">${characterName}</span>
                <div class="track-controls">
                    <button class="track-btn mute-btn" title="ミュート">🔇</button>
                    <button class="track-btn solo-btn" title="ソロ">S</button>
                </div>
            </div>
            <div class="track-content" style="width: ${trackWidth}px;">
                ${animationsHTML}
            </div>
        `;
        
        this.tracksContainer.appendChild(trackElement);
        this.tracks.set(characterName, trackElement);
        
        // トラック高さを更新
        this.updateTracksHeight();
    }
    
    createPlaybackControls() {
        // 再生制御は createTimelineContainer で作成済み
    }
    
    bindEvents() {
        // 再生ボタン
        this.playBtn?.addEventListener('click', () => {
            this.togglePlayback();
        });
        
        // 停止ボタン
        this.container.querySelector('.stop-btn')?.addEventListener('click', () => {
            this.stop();
        });
        
        // タイムライン クリックで再生位置変更
        this.timelineContent?.addEventListener('click', (e) => {
            if (e.target.classList.contains('timeline-content')) {
                const rect = this.timelineContent.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const time = clickX / this.config.pixelsPerSecond;
                this.setCurrentTime(Math.max(0, Math.min(time, this.config.maxTime)));
            }
        });
        
        // アニメーションバー クリック
        this.tracksContainer?.addEventListener('click', (e) => {
            if (e.target.classList.contains('animation-bar')) {
                const character = e.target.closest('.timeline-track').dataset.character;
                const animation = e.target.dataset.animation;
                this.emit('timeline:animationSelected', { character, animation });
            }
        });
        
        // EventBus リスナー
        if (this.eventBus) {
            this.eventBus.on('character:added', (data) => {
                this.addCharacterTrack(data);
            });
            
            this.eventBus.on('animation:played', (data) => {
                this.highlightAnimation(data.character, data.animation);
            });
        }
    }
    
    togglePlayback() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    play() {
        this.isPlaying = true;
        this.playBtn.innerHTML = '<span class="icon">⏸️</span>';
        this.playBtn.title = '一時停止';
        
        // 再生ループ開始
        this.playbackLoop();
        this.emit('timeline:play', { time: this.currentTime });
    }
    
    pause() {
        this.isPlaying = false;
        this.playBtn.innerHTML = '<span class="icon">▶️</span>';
        this.playBtn.title = '再生';
        
        this.emit('timeline:pause', { time: this.currentTime });
    }
    
    stop() {
        this.isPlaying = false;
        this.setCurrentTime(0);
        this.playBtn.innerHTML = '<span class="icon">▶️</span>';
        this.playBtn.title = '再生';
        
        this.emit('timeline:stop');
    }
    
    playbackLoop() {
        if (!this.isPlaying) return;
        
        // 60FPS で更新
        setTimeout(() => {
            this.currentTime += 1/60; // 1フレーム分進める
            
            if (this.currentTime >= this.config.maxTime) {
                // ループ設定確認
                const loopCheckbox = this.container.querySelector('input[type="checkbox"]');
                if (loopCheckbox?.checked) {
                    this.currentTime = 0;
                } else {
                    this.stop();
                    return;
                }
            }
            
            this.updatePlayhead();
            this.updateTimeDisplay();
            
            this.playbackLoop();
        }, 1000/60);
    }
    
    setCurrentTime(time) {
        this.currentTime = Math.max(0, Math.min(time, this.config.maxTime));
        this.updatePlayhead();
        this.updateTimeDisplay();
        
        this.emit('timeline:timeChanged', { time: this.currentTime });
    }
    
    updatePlayhead() {
        const position = this.currentTime * this.config.pixelsPerSecond;
        if (this.playhead) {
            this.playhead.style.left = `${position}px`;
        }
    }
    
    updateTimeDisplay() {
        if (this.timeDisplay) {
            const current = this.formatTime(this.currentTime);
            const max = this.formatTime(this.config.maxTime);
            this.timeDisplay.textContent = `${current} / ${max}`;
        }
    }
    
    updateTracksHeight() {
        const trackCount = this.tracks.size;
        const totalHeight = trackCount * (this.config.trackHeight + this.config.trackSpacing);
        this.tracksContainer.style.height = `${totalHeight}px`;
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    highlightAnimation(character, animation) {
        const track = this.tracks.get(character);
        if (track) {
            // 既存のハイライトをクリア
            track.querySelectorAll('.animation-bar.playing').forEach(bar => {
                bar.classList.remove('playing');
            });
            
            // 新しいハイライト
            const animationBar = track.querySelector(`[data-animation="${animation}"]`);
            if (animationBar) {
                animationBar.classList.add('playing');
            }
        }
    }
    
    // 外部API
    addCharacterTrack(characterData) {
        this.addTrack(characterData.name, characterData.trackData || { animations: [] });
        this.emit('timeline:trackAdded', characterData);
    }
    
    removeTrack(characterName) {
        const track = this.tracks.get(characterName);
        if (track) {
            track.remove();
            this.tracks.delete(characterName);
            this.updateTracksHeight();
            this.emit('timeline:trackRemoved', { character: characterName });
        }
    }
    
    getCurrentTime() {
        return this.currentTime;
    }
    
    getDuration() {
        return this.config.maxTime;
    }
    
    // EventBus ヘルパー
    emit(eventType, data = {}) {
        if (this.eventBus) {
            this.eventBus.emit(eventType, data);
        }
    }
    
    on(eventType, handler) {
        if (this.eventBus) {
            this.eventBus.on(eventType, handler);
        }
    }
    
    destroy() {
        this.pause();
        this.tracks.clear();
        
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        console.log('✅ TimelineModule 終了');
    }
}