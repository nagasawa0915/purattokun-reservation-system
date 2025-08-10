// 🎬 Timeline Control Engine - タイムライン制御システム
// 目的: クリップ管理・トラック階層・再生制御・フレーム管理
// 設計: 2つのSpineアニメーション結合・ブレンド処理対応
// 制約: 500行制限・既存システム影響ゼロ

console.log('🎬 Timeline Control Engine システム読み込み開始');

/**
 * 🎯 タイムライン制御エンジン
 * クリップ・トラック・再生の統合制御
 */
class TimelineControlEngine {
    constructor() {
        this.version = '1.0.0';
        this.name = 'Timeline Control Engine';
        this.isActive = false;
        
        // 🎬 タイムライン基本設定
        this.timeline = {
            duration: 10000,     // 10秒（ms）
            frameRate: 60,       // 60fps
            currentTime: 0,      // 現在の再生位置
            playbackRate: 1.0,   // 再生速度
            isPlaying: false,
            isLooping: false
        };
        
        // 🎭 トラック管理システム
        this.tracks = new Map();
        this.trackOrder = [];
        
        // 🎪 クリップ管理システム
        this.clips = new Map();
        this.activeClips = new Set();
        
        // ⏰ 再生制御
        this.playbackTimer = null;
        this.lastFrameTime = 0;
        
        // 📡 イベント管理
        this.eventListeners = new Map();
        
        console.log('✅ Timeline Control Engine 構築完了');
    }
    
    /**
     * 🚀 エンジン初期化
     */
    initialize(theaterStudio) {
        if (this.isActive) {
            console.warn('⚠️ Timeline Control Engine 既に初期化済み');
            return;
        }
        
        try {
            this.theaterStudio = theaterStudio;
            
            // 基本トラック作成
            this.createDefaultTracks();
            
            // 再生制御設定
            this.setupPlaybackControl();
            
            // イベントリスナー登録
            this.setupEventHandlers();
            
            this.isActive = true;
            console.log('✅ Timeline Control Engine 初期化完了');
            
            return true;
        } catch (error) {
            console.error('❌ Timeline Control Engine 初期化失敗:', error);
            return false;
        }
    }
    
    /**
     * 🎭 デフォルトトラック作成
     */
    createDefaultTracks() {
        const defaultTracks = [
            {
                id: 'scene-control',
                name: 'Scene Control',
                type: 'scene',
                enabled: true,
                muted: false,
                solo: false,
                height: 60,
                color: '#d4af37'
            },
            {
                id: 'character-1',
                name: 'Character Track 1',
                type: 'character',
                enabled: true,
                muted: false,
                solo: false,
                height: 80,
                color: '#4a6f8a',
                characterId: null
            },
            {
                id: 'character-2',
                name: 'Character Track 2',
                type: 'character',
                enabled: true,
                muted: false,
                solo: false,
                height: 80,
                color: '#6a8faa',
                characterId: null
            },
            {
                id: 'effects',
                name: 'Effects & Lighting',
                type: 'effects',
                enabled: true,
                muted: false,
                solo: false,
                height: 60,
                color: '#8faa4a'
            }
        ];
        
        defaultTracks.forEach(trackConfig => {
            this.createTrack(trackConfig);
        });
        
        console.log(`📋 ${defaultTracks.length} デフォルトトラック作成完了`);
    }
    
    /**
     * 🛠️ トラック作成
     */
    createTrack(config) {
        const track = {
            id: config.id,
            name: config.name,
            type: config.type,
            enabled: config.enabled !== false,
            muted: config.muted || false,
            solo: config.solo || false,
            height: config.height || 60,
            color: config.color || '#4a6f8a',
            clips: new Map(),
            characterId: config.characterId || null,
            blendMode: config.blendMode || 'normal',
            volume: config.volume || 1.0
        };
        
        this.tracks.set(config.id, track);
        this.trackOrder.push(config.id);
        
        // UI更新イベント発火
        this.dispatchEvent('trackCreated', { track });
        
        return track;
    }
    
    /**
     * 🎪 クリップ作成
     */
    createClip(trackId, clipConfig) {
        const track = this.tracks.get(trackId);
        if (!track) {
            console.error(`❌ Track ${trackId} not found`);
            return null;
        }
        
        const clipId = clipConfig.id || this.generateClipId();
        const clip = {
            id: clipId,
            trackId: trackId,
            name: clipConfig.name || 'New Clip',
            startTime: clipConfig.startTime || 0,
            duration: clipConfig.duration || 1000,
            endTime: (clipConfig.startTime || 0) + (clipConfig.duration || 1000),
            animationName: clipConfig.animationName || 'idle',
            blendInDuration: clipConfig.blendInDuration || 200,
            blendOutDuration: clipConfig.blendOutDuration || 200,
            playbackRate: clipConfig.playbackRate || 1.0,
            enabled: clipConfig.enabled !== false,
            characterId: clipConfig.characterId || null,
            color: clipConfig.color || track.color,
            properties: clipConfig.properties || {}
        };
        
        // クリップ時間範囲検証
        if (clip.endTime > this.timeline.duration) {
            console.warn(`⚠️ Clip ${clipId} exceeds timeline duration`);
        }
        
        // トラックとグローバル両方に登録
        track.clips.set(clipId, clip);
        this.clips.set(clipId, clip);
        
        console.log(`✅ Clip ${clipId} created on track ${trackId}`);
        this.dispatchEvent('clipCreated', { clip, track });
        
        return clip;
    }
    
    /**
     * 🎬 キャラクタークリップ作成（専用メソッド）
     */
    createCharacterClip(trackId, characterId, animationName, startTime = 0, duration = 3000) {
        const clipConfig = {
            name: `${characterId} - ${animationName}`,
            startTime: startTime,
            duration: duration,
            animationName: animationName,
            characterId: characterId,
            blendInDuration: 300,
            blendOutDuration: 300,
            properties: {
                x: 0,
                y: 0,
                scaleX: 1,
                scaleY: 1,
                rotation: 0,
                alpha: 1
            }
        };
        
        return this.createClip(trackId, clipConfig);
    }
    
    /**
     * ▶️ タイムライン再生開始
     */
    play() {
        if (this.timeline.isPlaying) {
            console.log('⚠️ Timeline is already playing');
            return;
        }
        
        this.timeline.isPlaying = true;
        this.lastFrameTime = performance.now();
        
        // アクティブクリップを更新
        this.updateActiveClips();
        
        // 再生ループ開始
        this.startPlaybackLoop();
        
        console.log(`▶️ Timeline playback started at ${this.timeline.currentTime}ms`);
        this.dispatchEvent('playbackStarted', { 
            currentTime: this.timeline.currentTime 
        });
    }
    
    /**
     * ⏸️ タイムライン一時停止
     */
    pause() {
        if (!this.timeline.isPlaying) return;
        
        this.timeline.isPlaying = false;
        
        if (this.playbackTimer) {
            cancelAnimationFrame(this.playbackTimer);
            this.playbackTimer = null;
        }
        
        console.log(`⏸️ Timeline paused at ${this.timeline.currentTime}ms`);
        this.dispatchEvent('playbackPaused', { 
            currentTime: this.timeline.currentTime 
        });
    }
    
    /**
     * ⏹️ タイムライン停止
     */
    stop() {
        this.pause();
        this.timeline.currentTime = 0;
        
        // 全クリップをリセット
        this.activeClips.clear();
        
        console.log('⏹️ Timeline stopped and reset');
        this.dispatchEvent('playbackStopped');
    }
    
    /**
     * 🔄 ループ再生設定
     */
    setLooping(enabled) {
        this.timeline.isLooping = enabled;
        console.log(`🔄 Timeline looping: ${enabled}`);
    }
    
    /**
     * ⚡ 再生ループ処理
     */
    startPlaybackLoop() {
        const loop = (currentTime) => {
            if (!this.timeline.isPlaying) return;
            
            // フレーム間隔計算
            const deltaTime = currentTime - this.lastFrameTime;
            const frameInterval = 1000 / this.timeline.frameRate;
            
            if (deltaTime >= frameInterval) {
                // タイムライン時間更新
                this.timeline.currentTime += deltaTime * this.timeline.playbackRate;
                
                // 終端チェック
                if (this.timeline.currentTime >= this.timeline.duration) {
                    if (this.timeline.isLooping) {
                        this.timeline.currentTime = 0;
                        console.log('🔄 Timeline looped');
                    } else {
                        this.stop();
                        return;
                    }
                }
                
                // アクティブクリップ更新
                this.updateActiveClips();
                
                // フレーム更新イベント
                this.dispatchEvent('frameUpdate', {
                    currentTime: this.timeline.currentTime,
                    deltaTime: deltaTime,
                    activeClips: Array.from(this.activeClips)
                });
                
                this.lastFrameTime = currentTime;
            }
            
            // 次フレーム予約
            this.playbackTimer = requestAnimationFrame(loop);
        };
        
        this.playbackTimer = requestAnimationFrame(loop);
    }
    
    /**
     * 📋 アクティブクリップ更新
     */
    updateActiveClips() {
        const currentTime = this.timeline.currentTime;
        const newActiveClips = new Set();
        
        // 全クリップをチェック
        this.clips.forEach((clip, clipId) => {
            if (clip.enabled && 
                currentTime >= clip.startTime && 
                currentTime < clip.endTime) {
                newActiveClips.add(clipId);
            }
        });
        
        // アクティブクリップの変化をチェック
        const added = Array.from(newActiveClips).filter(id => !this.activeClips.has(id));
        const removed = Array.from(this.activeClips).filter(id => !newActiveClips.has(id));
        
        // 新規アクティブクリップ
        added.forEach(clipId => {
            const clip = this.clips.get(clipId);
            console.log(`🎪 Clip activated: ${clip.name}`);
            this.dispatchEvent('clipActivated', { clip });
        });
        
        // 非アクティブ化クリップ
        removed.forEach(clipId => {
            const clip = this.clips.get(clipId);
            console.log(`🎪 Clip deactivated: ${clip.name}`);
            this.dispatchEvent('clipDeactivated', { clip });
        });
        
        this.activeClips = newActiveClips;
    }
    
    /**
     * ⏱️ 時間位置設定
     */
    seekTo(timeMs) {
        const clampedTime = Math.max(0, Math.min(timeMs, this.timeline.duration));
        this.timeline.currentTime = clampedTime;
        
        // 再生中の場合はアクティブクリップを更新
        if (this.timeline.isPlaying) {
            this.updateActiveClips();
        }
        
        console.log(`⏱️ Timeline seek to ${clampedTime}ms`);
        this.dispatchEvent('timelineSeek', { 
            currentTime: clampedTime 
        });
    }
    
    /**
     * 🎯 再生制御設定
     */
    setupPlaybackControl() {
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            
            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    this.timeline.isPlaying ? this.pause() : this.play();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.seekTo(0);
                    break;
                case 'End':
                    e.preventDefault();
                    this.seekTo(this.timeline.duration);
                    break;
            }
        });
        
        console.log('🎯 Playback controls configured');
    }
    
    /**
     * 🔍 クリップID生成
     */
    generateClipId() {
        return `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * 📡 イベント発火
     */
    dispatchEvent(eventType, data = {}) {
        const event = new CustomEvent(`timelineEngine:${eventType}`, {
            detail: {
                engine: this.name,
                timestamp: Date.now(),
                ...data
            }
        });
        
        window.dispatchEvent(event);
        
        // 内部リスナー処理
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(event.detail);
                } catch (error) {
                    console.error(`❌ Event listener error for ${eventType}:`, error);
                }
            });
        }
    }
    
    /**
     * 👂 イベントリスナー登録
     */
    addEventListener(eventType, callback) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType).push(callback);
    }
    
    /**
     * 🎯 イベントハンドラー設定
     */
    setupEventHandlers() {
        // Theater Studio イベント監視
        window.addEventListener('theaterStudio:timelinePlay', () => {
            this.play();
        });
        
        window.addEventListener('theaterStudio:timelinePause', () => {
            this.pause();
        });
        
        window.addEventListener('theaterStudio:timelineStop', () => {
            this.stop();
        });
        
        console.log('🎯 Event handlers configured');
    }
    
    /**
     * 📊 システム状態取得
     */
    getEngineState() {
        return {
            version: this.version,
            active: this.isActive,
            timeline: {
                duration: this.timeline.duration,
                currentTime: this.timeline.currentTime,
                isPlaying: this.timeline.isPlaying,
                frameRate: this.timeline.frameRate
            },
            tracks: this.tracks.size,
            clips: this.clips.size,
            activeClips: this.activeClips.size
        };
    }
    
    /**
     * 🧹 リソースクリーンアップ
     */
    cleanup() {
        this.stop();
        this.tracks.clear();
        this.clips.clear();
        this.activeClips.clear();
        this.eventListeners.clear();
        this.isActive = false;
        
        console.log('🧹 Timeline Control Engine cleanup completed');
    }
}

// ========== グローバル登録 ========== //

window.TimelineControlEngine = TimelineControlEngine;

// Theater Studio 統合用インスタンス
window.timelineEngine = new TimelineControlEngine();

console.log('🎬 Timeline Control Engine システム準備完了');
console.log('✅ window.timelineEngine でエンジンアクセス可能');