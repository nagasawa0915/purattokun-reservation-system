// 🎭 Timeline Studio Core - Theater Studioコンセプトタイムラインシステム
// 設計思想: 劇場・舞台演出をモチーフとした完全独自UIシステム
// 目的: Maya Trax/Unityタイムライン模倣回避・著作権対応
// 依存: spine-skeleton-bounds.js, spine-bounds-integration.js
// 品質: 500行制限・既存システム影響ゼロ

console.log('🎭 Timeline Studio Core システム読み込み開始');

/**
 * 🎭 Theater Studio タイムラインシステム
 * 完全独自デザイン・劇場演出モチーフ
 */
class TheaterStudioCore {
    constructor() {
        this.version = '1.0.0';
        this.studioName = 'Theater Studio';
        this.isInitialized = false;
        
        // 🎬 Director's Timeline (監督タイムライン)
        this.timeline = {
            totalDuration: 10000,  // 10秒（ms）
            currentTime: 0,
            isPlaying: false,
            scenes: new Map(),
            acts: new Map()
        };
        
        // 🎭 Cast Management (出演者管理)
        this.cast = {
            performers: new Map(),  // キャラクター管理
            stages: new Map(),      // ステージ領域管理
            currentFocus: null      // 現在の選択演者
        };
        
        // 🎨 Stage Design (舞台設計)
        this.stageDesign = {
            background: '#1a1a2e',
            lighting: 'stage-spotlight',
            viewportWidth: 800,
            viewportHeight: 600
        };
        
        this.bindMethods();
        console.log('✅ Theater Studio Core 基盤構築完了');
    }
    
    bindMethods() {
        this.initialize = this.initialize.bind(this);
        this.setupStagePreview = this.setupStagePreview.bind(this);
        this.setupDirectorTimeline = this.setupDirectorTimeline.bind(this);
        this.setupCastPanel = this.setupCastPanel.bind(this);
    }
    
    /**
     * 🚀 Theater Studio システム初期化
     * 既存システムと完全分離・独立動作
     */
    async initialize(container) {
        if (this.isInitialized) {
            console.warn('⚠️ Theater Studio 既に初期化済み');
            return;
        }
        
        try {
            console.log('🎭 Theater Studio レイアウト構築開始');
            
            // メインレイアウト構築
            this.setupMainLayout(container);
            
            // 3つの主要エリア初期化
            await this.setupStagePreview();
            await this.setupDirectorTimeline();
            await this.setupCastPanel();
            
            // イベントハンドラー登録
            this.setupEventHandlers();
            
            this.isInitialized = true;
            console.log('✅ Theater Studio 初期化完了');
            
            // 初期化完了イベント発火
            this.dispatchStudioEvent('studioReady', {
                studio: this.studioName,
                version: this.version
            });
            
        } catch (error) {
            console.error('❌ Theater Studio 初期化失敗:', error);
            throw error;
        }
    }
    
    /**
     * 🏗️ メインレイアウト構築
     * 劇場風3分割レイアウト
     */
    setupMainLayout(container) {
        const layout = `
            <div id="theater-studio-main" class="theater-studio">
                <!-- 🎭 Studio Header -->
                <div class="studio-header">
                    <div class="studio-title">
                        <span class="studio-icon">🎭</span>
                        <h2>Theater Studio</h2>
                        <span class="studio-subtitle">Spine Timeline Editor</span>
                    </div>
                    <div class="studio-controls">
                        <button id="studio-new-scene" class="btn-stage">New Scene</button>
                        <button id="studio-save" class="btn-stage">Save Project</button>
                    </div>
                </div>
                
                <!-- 🎬 Main Performance Area -->
                <div class="performance-layout">
                    <!-- 左: Stage Preview -->
                    <div class="stage-preview-container">
                        <div id="stage-preview" class="stage-preview">
                            <div class="performance-area" id="performance-area">
                                <!-- Spine characters preview -->
                            </div>
                            <div class="stage-controls">
                                <div class="stage-info">Stage 1</div>
                                <div class="viewport-controls">
                                    <button class="btn-viewport">🔍 Zoom</button>
                                    <button class="btn-viewport">🎯 Focus</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 右: Cast & Settings Panel -->
                    <div class="cast-panel-container">
                        <div id="cast-panel" class="cast-panel">
                            <div class="panel-header">
                                <h3>🎭 Cast & Crew</h3>
                            </div>
                            <div class="performers-list" id="performers-list">
                                <!-- キャラクター一覧 -->
                            </div>
                            <div class="timeline-settings" id="timeline-settings">
                                <h4>Timeline Settings</h4>
                                <div class="setting-group">
                                    <label>Duration:</label>
                                    <input type="number" id="total-duration" value="10" step="0.1">
                                    <span>seconds</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 下: Director's Timeline -->
                <div class="timeline-container">
                    <div id="directors-timeline" class="directors-timeline">
                        <div class="timeline-header">
                            <h3>🎬 Director's Timeline</h3>
                            <div class="timeline-controls" id="timeline-controls">
                                <button class="btn-control" id="play-btn">▶️</button>
                                <button class="btn-control" id="pause-btn">⏸️</button>
                                <button class="btn-control" id="stop-btn">⏹️</button>
                                <button class="btn-control" id="loop-btn">🔄</button>
                            </div>
                        </div>
                        <div class="timeline-tracks" id="timeline-tracks">
                            <!-- タイムライントラック -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = layout;
        console.log('🏗️ Theater Studio レイアウト構築完了');
    }
    
    /**
     * 🎬 舞台プレビューエリア設定
     */
    async setupStagePreview() {
        const stagePreview = document.getElementById('stage-preview');
        const performanceArea = document.getElementById('performance-area');
        
        if (!stagePreview || !performanceArea) {
            throw new Error('Stage Preview エリア要素が見つかりません');
        }
        
        // 舞台風スタイリング適用
        this.applyStageDesign(stagePreview);
        
        // パフォーマンスエリア初期化
        performanceArea.style.width = this.stageDesign.viewportWidth + 'px';
        performanceArea.style.height = this.stageDesign.viewportHeight + 'px';
        
        console.log('🎬 Stage Preview セットアップ完了');
    }
    
    /**
     * 🎭 監督タイムライン設定
     */
    async setupDirectorTimeline() {
        const timelineContainer = document.getElementById('timeline-tracks');
        
        if (!timelineContainer) {
            throw new Error('Timeline Tracks コンテナが見つかりません');
        }
        
        // 初期トラック作成
        this.createInitialTracks(timelineContainer);
        
        console.log('🎭 Director Timeline セットアップ完了');
    }
    
    /**
     * 🎨 出演者パネル設定
     */
    async setupCastPanel() {
        const performersList = document.getElementById('performers-list');
        
        if (!performersList) {
            throw new Error('Performers List が見つかりません');
        }
        
        // 利用可能なキャラクター検出
        await this.detectAvailablePerformers(performersList);
        
        console.log('🎨 Cast Panel セットアップ完了');
    }
    
    /**
     * 🎨 舞台デザイン適用
     */
    applyStageDesign(stageElement) {
        stageElement.style.background = `linear-gradient(45deg, ${this.stageDesign.background}, #16213e)`;
        stageElement.style.border = '3px solid #0f3460';
        stageElement.style.borderRadius = '15px';
        stageElement.style.boxShadow = 'inset 0 0 50px rgba(15, 52, 96, 0.3)';
        stageElement.classList.add('stage-lighting');
    }
    
    /**
     * 📋 初期トラック作成
     */
    createInitialTracks(container) {
        const tracks = [
            { id: 'scene-track', name: '🎬 Scene', type: 'scene' },
            { id: 'character-1', name: '🎭 Cast #1', type: 'character' },
            { id: 'character-2', name: '🎭 Cast #2', type: 'character' },
            { id: 'effects', name: '✨ FX & Lighting', type: 'effects' }
        ];
        
        tracks.forEach(track => {
            const trackElement = this.createTrackElement(track);
            container.appendChild(trackElement);
        });
    }
    
    /**
     * 🛠️ トラック要素作成
     */
    createTrackElement(trackConfig) {
        const track = document.createElement('div');
        track.className = 'timeline-track';
        track.id = trackConfig.id;
        track.dataset.trackType = trackConfig.type;
        
        track.innerHTML = `
            <div class="track-header">
                <span class="track-name">${trackConfig.name}</span>
                <div class="track-controls">
                    <button class="btn-track-mute">🔇</button>
                    <button class="btn-track-solo">S</button>
                </div>
            </div>
            <div class="track-timeline">
                <div class="track-clips" data-track="${trackConfig.id}">
                    <!-- クリップがここに追加される -->
                </div>
            </div>
        `;
        
        return track;
    }
    
    /**
     * 🔍 利用可能な演者検出
     */
    async detectAvailablePerformers(container) {
        // 既存システムとの統合チェック
        const availableCharacters = [];
        
        // spine-skeleton-bounds.js 統合チェック
        if (window.SkeletonBoundsManager) {
            console.log('✅ SkeletonBoundsManager 統合可能');
            availableCharacters.push({
                id: 'purattokun',
                name: 'ぷらっとくん',
                icon: '🐱',
                available: true
            });
        }
        
        // nezumi キャラクター検出
        const nezumiAssets = document.querySelector('[data-character="nezumi"]');
        if (nezumiAssets) {
            availableCharacters.push({
                id: 'nezumi', 
                name: 'ねずみ',
                icon: '🐭',
                available: true
            });
        }
        
        // 演者リスト表示
        this.renderPerformersList(container, availableCharacters);
    }
    
    /**
     * 📋 演者リスト表示
     */
    renderPerformersList(container, performers) {
        container.innerHTML = performers.map(performer => `
            <div class="performer-item ${performer.available ? 'available' : 'unavailable'}" 
                 data-performer="${performer.id}">
                <span class="performer-icon">${performer.icon}</span>
                <span class="performer-name">${performer.name}</span>
                <div class="performer-controls">
                    <button class="btn-add-to-timeline" data-character="${performer.id}">
                        Add to Timeline
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * 🎯 イベントハンドラー設定
     */
    setupEventHandlers() {
        // タイムライン制御
        const playBtn = document.getElementById('play-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const stopBtn = document.getElementById('stop-btn');
        
        if (playBtn) playBtn.addEventListener('click', () => this.playTimeline());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pauseTimeline());
        if (stopBtn) stopBtn.addEventListener('click', () => this.stopTimeline());
        
        // 演者追加ボタン
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-add-to-timeline')) {
                const characterId = e.target.dataset.character;
                this.addCharacterToTimeline(characterId);
            }
        });
        
        console.log('🎯 Event Handlers 設定完了');
    }
    
    /**
     * ▶️ タイムライン再生
     */
    playTimeline() {
        if (this.timeline.isPlaying) return;
        
        this.timeline.isPlaying = true;
        console.log('▶️ Timeline 再生開始');
        
        this.dispatchStudioEvent('timelinePlay', {
            currentTime: this.timeline.currentTime
        });
    }
    
    /**
     * ⏸️ タイムライン一時停止
     */
    pauseTimeline() {
        this.timeline.isPlaying = false;
        console.log('⏸️ Timeline 一時停止');
        
        this.dispatchStudioEvent('timelinePause', {
            currentTime: this.timeline.currentTime
        });
    }
    
    /**
     * ⏹️ タイムライン停止
     */
    stopTimeline() {
        this.timeline.isPlaying = false;
        this.timeline.currentTime = 0;
        console.log('⏹️ Timeline 停止');
        
        this.dispatchStudioEvent('timelineStop');
    }
    
    /**
     * 🎭 キャラクターをタイムラインに追加
     */
    addCharacterToTimeline(characterId) {
        console.log(`🎭 Adding ${characterId} to timeline`);
        
        // 空いているトラックを探す
        const availableTrack = this.findAvailableTrack();
        if (availableTrack) {
            this.createCharacterClip(availableTrack, characterId);
        }
    }
    
    /**
     * 🔍 利用可能なトラック検索
     */
    findAvailableTrack() {
        const characterTracks = document.querySelectorAll('[data-track-type="character"]');
        for (let track of characterTracks) {
            const clips = track.querySelector('.track-clips');
            if (clips.children.length === 0) {
                return clips;
            }
        }
        return null;
    }
    
    /**
     * 🎬 キャラクタークリップ作成
     */
    createCharacterClip(trackContainer, characterId) {
        const clip = document.createElement('div');
        clip.className = 'timeline-clip character-clip';
        clip.dataset.character = characterId;
        clip.dataset.startTime = '0';
        clip.dataset.duration = '3000';  // 3秒
        
        clip.innerHTML = `
            <div class="clip-content">
                <span class="clip-label">${characterId}</span>
                <span class="clip-duration">3.0s</span>
            </div>
        `;
        
        clip.style.width = '120px';  // 3秒分の幅
        clip.style.left = '0px';
        
        trackContainer.appendChild(clip);
        
        console.log(`✅ ${characterId} clip created`);
    }
    
    /**
     * 📡 Studio イベント発火
     */
    dispatchStudioEvent(eventType, data = {}) {
        const event = new CustomEvent(`theaterStudio:${eventType}`, {
            detail: {
                studio: this.studioName,
                timestamp: Date.now(),
                ...data
            }
        });
        
        window.dispatchEvent(event);
    }
    
    /**
     * 🔄 既存システム統合API
     */
    integrateBoundsSystem() {
        if (window.SkeletonBoundsManager) {
            console.log('🔄 Skeleton Bounds System 統合');
            this.boundsManager = window.SkeletonBoundsManager;
            return true;
        }
        return false;
    }
    
    /**
     * 📊 システム状態取得
     */
    getStudioState() {
        return {
            version: this.version,
            initialized: this.isInitialized,
            timeline: {
                duration: this.timeline.totalDuration,
                currentTime: this.timeline.currentTime,
                isPlaying: this.timeline.isPlaying
            },
            cast: {
                performerCount: this.cast.performers.size,
                currentFocus: this.cast.currentFocus
            }
        };
    }
}

// ========== グローバル登録 ========== //

// Theater Studio インスタンス作成
window.TheaterStudio = new TheaterStudioCore();

// 初期化ヘルパー関数
window.initTheaterStudio = function(containerId = 'timeline-studio-container') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`❌ Container #${containerId} not found`);
        return false;
    }
    
    return window.TheaterStudio.initialize(container);
};

console.log('🎭 Theater Studio Core システム準備完了');
console.log('✅ initTheaterStudio() 関数でシステム開始');