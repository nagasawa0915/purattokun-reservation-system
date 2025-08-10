// 🗂️ DEPRECATED: タイムライン編集UI (Phase 2.5でモジュール分割済み)
// 📋 新モジュール:
//   - timeline-editor-core.js (コア機能)
//   - timeline-keyframe-ui.js (キーフレーム編集)
//   - timeline-responsive-ui.js (レスポンシブ対応)
//   - timeline-visual-effects.js (視覚効果)
// 🔒 このファイルは互換性のため残存 - 新規開発では新モジュールを使用
// 🎬 タイムライン編集UI - Phase 2実装（350行以内）
// 役割: 視覚的タイムライン編集インターフェース・既存編集システム統合用
// 統合: spine-positioning-system-explanation.js との連携
// 目的: 編集システムにタイムライン制御機能を追加

console.log('🎬 Timeline Editor UI モジュール読み込み開始');

/**
 * 視覚的タイムライン編集UI
 * 既存編集システムとの統合対応
 */
class TimelineEditorUI {
    constructor(options = {}) {
        this.containerId = options.containerId || 'timeline-editor-container';
        this.mode = options.mode || 'integrated'; // 'integrated' or 'standalone'
        this.currentTime = 0;
        this.maxTime = options.maxTime || 10;
        this.isPlaying = false;
        this.playbackSpeed = options.playbackSpeed || 1;
        this.selectedKeyframe = null;
        this.characterTracks = new Map();
        this.keyframes = new Map();
        this.isVisible = false;
        
        // 編集システム統合用のコールバック
        this.onTimelineChange = options.onTimelineChange || null;
        this.onKeyframeEdit = options.onKeyframeEdit || null;
        
        console.log('🎨 Timeline Editor UI 初期化完了');
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
        
        // イベントリスナー設定
        this.setupEventListeners();
        this.createSampleTracks();
        this.startUpdateLoop();
        
        this.isVisible = true;
        console.log('✅ Timeline Editor UI 表示完了');
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
        console.log('➖ Timeline Editor UI 非表示');
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
                    <!-- 動的に生成されるトラック -->
                </div>
            </div>
            
            <div class="keyframe-editing-controls">
                <select id="timeline-animation-selector" class="animation-selector">
                    <option value="idle">待機</option>
                    <option value="walk">歩行</option>
                    <option value="jump">ジャンプ</option>
                    <option value="wave">手振り</option>
                    <option value="dance">ダンス</option>
                </select>
                <button class="timeline-btn-secondary" id="timeline-add-keyframe">➕ キーフレーム</button>
                <button class="timeline-btn-danger" id="timeline-delete-keyframe">🗑️ 削除</button>
            </div>
            
            <div class="timeline-scrubber-container">
                <input type="range" id="timeline-scrubber" class="timeline-scrubber" 
                       min="0" max="${this.maxTime}" step="0.1" value="0">
            </div>
        `;
        
        // スタイル適用
        this.applyStyles(container);
        
        return container;
    }
    
    /**
     * タイムライン編集UIのスタイルを適用
     */
    applyStyles(container) {
        const style = document.createElement('style');
        style.textContent = `
            .timeline-editor-panel {
                width: 350px;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 15px;
                padding: 20px;
                box-shadow: 0 15px 35px rgba(0,0,0,0.15);
                backdrop-filter: blur(10px);
                border: 2px solid rgba(102, 126, 234, 0.2);
                font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif;
            }
            
            .timeline-editor-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 2px solid rgba(102, 126, 234, 0.1);
            }
            
            .timeline-editor-header h3 {
                color: #667eea;
                margin: 0;
                font-size: 1.1rem;
            }
            
            .timeline-close-btn {
                background: #e53e3e;
                color: white;
                border: none;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 0.8rem;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .timeline-close-btn:hover {
                background: #c53030;
            }
            
            .timeline-controls-section {
                margin-bottom: 15px;
            }
            
            .timeline-playback-controls {
                display: flex;
                gap: 8px;
                margin-bottom: 10px;
            }
            
            .timeline-btn, .timeline-btn-secondary, .timeline-btn-danger {
                padding: 8px 12px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.85rem;
                transition: all 0.2s;
            }
            
            .timeline-btn {
                background: #667eea;
                color: white;
            }
            
            .timeline-btn:hover {
                background: #5a67d8;
                transform: translateY(-1px);
            }
            
            .timeline-btn-secondary {
                background: #48bb78;
                color: white;
            }
            
            .timeline-btn-secondary:hover {
                background: #38a169;
            }
            
            .timeline-btn-danger {
                background: #e53e3e;
                color: white;
            }
            
            .timeline-btn-danger:hover {
                background: #c53030;
            }
            
            .timeline-time-display {
                font-family: monospace;
                font-size: 0.9rem;
                color: #667eea;
                text-align: center;
                background: rgba(102, 126, 234, 0.1);
                padding: 5px;
                border-radius: 4px;
            }
            
            .timeline-track-area {
                background: #f8f9ff;
                border-radius: 8px;
                padding: 15px;
                margin: 15px 0;
                border: 1px solid #e2e8f0;
                min-height: 120px;
            }
            
            .timeline-ruler {
                position: relative;
                height: 25px;
                background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                border-radius: 4px;
                margin-bottom: 10px;
                overflow: hidden;
            }
            
            .ruler-marks {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 100%;
                background: repeating-linear-gradient(
                    90deg,
                    rgba(255,255,255,0.3) 0px,
                    rgba(255,255,255,0.3) 1px,
                    transparent 1px,
                    transparent 15px
                );
            }
            
            .playhead {
                position: absolute;
                top: 0;
                bottom: 0;
                width: 2px;
                background: #e53e3e;
                left: 0%;
                transition: left 0.1s ease;
                box-shadow: 0 0 8px rgba(229, 62, 62, 0.6);
            }
            
            .character-tracks {
                min-height: 60px;
            }
            
            .character-track {
                display: flex;
                align-items: center;
                margin-bottom: 6px;
                padding: 4px;
                background: rgba(255, 255, 255, 0.8);
                border-radius: 4px;
                border-left: 3px solid #667eea;
                font-size: 0.85rem;
            }
            
            .track-label {
                width: 70px;
                font-weight: bold;
                color: #667eea;
                font-size: 0.75rem;
            }
            
            .track-timeline {
                flex: 1;
                height: 16px;
                position: relative;
                background: rgba(102, 126, 234, 0.1);
                border-radius: 2px;
            }
            
            .keyframe {
                position: absolute;
                width: 10px;
                height: 10px;
                background: #48bb78;
                border-radius: 50%;
                top: 50%;
                transform: translateY(-50%);
                cursor: pointer;
                border: 1px solid #fff;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                transition: all 0.2s;
            }
            
            .keyframe:hover {
                transform: translateY(-50%) scale(1.2);
                background: #38a169;
            }
            
            .keyframe.selected {
                background: #e53e3e;
                transform: translateY(-50%) scale(1.3);
            }
            
            .keyframe-editing-controls {
                display: flex;
                gap: 8px;
                margin-bottom: 15px;
                align-items: center;
            }
            
            .animation-selector {
                padding: 4px 8px;
                border: 1px solid #e2e8f0;
                border-radius: 4px;
                background: white;
                color: #667eea;
                font-size: 0.8rem;
                cursor: pointer;
                outline: none;
            }
            
            .animation-selector:focus {
                border-color: #667eea;
            }
            
            .timeline-scrubber {
                width: 100%;
                height: 4px;
                border-radius: 2px;
                background: #e2e8f0;
                outline: none;
                cursor: pointer;
            }
            
            .timeline-scrubber::-webkit-slider-thumb {
                appearance: none;
                width: 14px;
                height: 14px;
                background: #667eea;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }
            
            .timeline-scrubber::-moz-range-thumb {
                width: 14px;
                height: 14px;
                background: #667eea;
                border-radius: 50%;
                cursor: pointer;
                border: none;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }
            
            /* レスポンシブ対応・モバイル最適化 */
            @media (max-width: 768px) {
                .timeline-editor-panel {
                    position: fixed !important;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    top: auto;
                    transform: none !important;
                    width: 100%;
                    max-height: 60vh;
                    border-radius: 15px 15px 0 0;
                    overflow-y: auto;
                    z-index: 2500;
                }
                
                .timeline-editor-header {
                    position: sticky;
                    top: 0;
                    background: rgba(255, 255, 255, 0.98);
                    z-index: 10;
                    margin: 0 -20px 15px -20px;
                    padding: 15px 20px 10px 20px;
                }
                
                .timeline-playback-controls {
                    justify-content: center;
                    flex-wrap: wrap;
                    gap: 6px;
                }
                
                .timeline-btn, .timeline-btn-secondary, .timeline-btn-danger {
                    padding: 12px 16px;
                    font-size: 0.9rem;
                    min-width: 44px;
                    min-height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .keyframe-editing-controls {
                    flex-wrap: wrap;
                    gap: 10px;
                    justify-content: center;
                }
                
                .animation-selector {
                    min-width: 120px;
                    padding: 8px 12px;
                    font-size: 0.9rem;
                    touch-action: manipulation;
                }
                
                .timeline-track-area {
                    padding: 10px;
                    margin: 10px 0;
                    min-height: 100px;
                }
                
                .timeline-ruler {
                    height: 30px;
                    margin-bottom: 12px;
                }
                
                .character-track {
                    margin-bottom: 8px;
                    padding: 6px;
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .track-label {
                    width: 100%;
                    margin-bottom: 4px;
                    text-align: center;
                }
                
                .track-timeline {
                    width: 100%;
                    height: 24px;
                }
                
                .keyframe {
                    width: 14px;
                    height: 14px;
                    touch-action: manipulation;
                }
                
                .keyframe:hover {
                    transform: translateY(-50%) scale(1.3);
                }
                
                .timeline-scrubber {
                    height: 8px;
                    touch-action: manipulation;
                }
                
                .timeline-scrubber::-webkit-slider-thumb {
                    width: 20px;
                    height: 20px;
                }
                
                .timeline-scrubber::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                }
                
                .timeline-time-display {
                    padding: 8px;
                    font-size: 1rem;
                }
            }
            
            @media (max-width: 480px) {
                .timeline-editor-panel {
                    max-height: 70vh;
                }
                
                .timeline-playback-controls {
                    gap: 4px;
                }
                
                .timeline-btn, .timeline-btn-secondary, .timeline-btn-danger {
                    padding: 10px 12px;
                    font-size: 0.8rem;
                    min-width: 40px;
                    min-height: 40px;
                }
                
                .timeline-editor-header h3 {
                    font-size: 1rem;
                }
                
                .keyframe-editing-controls {
                    gap: 8px;
                }
                
                .animation-selector {
                    min-width: 100px;
                    padding: 6px 10px;
                }
            }
            
            /* タッチデバイス対応 */
            @media (hover: none) and (pointer: coarse) {
                .keyframe {
                    width: 16px;
                    height: 16px;
                }
                
                .keyframe:hover {
                    transform: translateY(-50%);
                }
                
                .keyframe:active {
                    transform: translateY(-50%) scale(1.2);
                    background: #38a169;
                }
                
                .timeline-btn:hover, 
                .timeline-btn-secondary:hover, 
                .timeline-btn-danger:hover {
                    transform: none;
                }
                
                .timeline-btn:active, 
                .timeline-btn-secondary:active, 
                .timeline-btn-danger:active {
                    transform: scale(0.95);
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // 閉じるボタン
        const closeBtn = document.getElementById('timeline-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
        
        // 再生制御
        const playBtn = document.getElementById('timeline-play');
        const pauseBtn = document.getElementById('timeline-pause');
        const stopBtn = document.getElementById('timeline-stop');
        const resetBtn = document.getElementById('timeline-reset');
        
        if (playBtn) playBtn.addEventListener('click', () => this.play());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pause());
        if (stopBtn) stopBtn.addEventListener('click', () => this.stop());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        
        // スクラバー
        const scrubber = document.getElementById('timeline-scrubber');
        if (scrubber) {
            scrubber.addEventListener('input', (e) => {
                this.currentTime = parseFloat(e.target.value);
                this.updateTimeDisplay();
                this.updatePlayhead();
            });
        }
        
        // キーフレーム編集
        const addBtn = document.getElementById('timeline-add-keyframe');
        const deleteBtn = document.getElementById('timeline-delete-keyframe');
        
        if (addBtn) addBtn.addEventListener('click', () => this.addKeyframe());
        if (deleteBtn) deleteBtn.addEventListener('click', () => this.deleteSelectedKeyframe());
    }
    
    /**
     * サンプルトラック作成
     */
    createSampleTracks() {
        const tracksContainer = document.getElementById('timeline-character-tracks');
        if (!tracksContainer) return;
        
        const sampleTracks = [
            { id: 'purattokun', label: '🐱ぷらっと', keyframes: [0, 2, 5, 8] },
            { id: 'nezumi', label: '🐭ねずみ', keyframes: [1, 3, 6, 9] }
        ];
        
        sampleTracks.forEach(trackData => {
            const track = this.createCharacterTrack(trackData);
            tracksContainer.appendChild(track);
        });
    }
    
    /**
     * キャラクタートラック作成
     */
    createCharacterTrack(trackData) {
        const track = document.createElement('div');
        track.className = 'character-track';
        track.dataset.characterId = trackData.id;
        
        const label = document.createElement('div');
        label.className = 'track-label';
        label.textContent = trackData.label;
        
        const timeline = document.createElement('div');
        timeline.className = 'track-timeline';
        
        // キーフレーム追加
        trackData.keyframes.forEach(time => {
            const keyframe = this.createKeyframe(time, trackData.id);
            timeline.appendChild(keyframe);
        });
        
        track.appendChild(label);
        track.appendChild(timeline);
        
        this.characterTracks.set(trackData.id, {
            element: track,
            keyframes: trackData.keyframes
        });
        
        return track;
    }
    
    /**
     * キーフレーム作成（モバイル対応改良版）
     */
    createKeyframe(time, characterId, animation = 'idle') {
        const keyframe = document.createElement('div');
        keyframe.className = 'keyframe';
        keyframe.style.left = `${(time / this.maxTime) * 100}%`;
        keyframe.dataset.time = time;
        keyframe.dataset.characterId = characterId;
        keyframe.dataset.animation = animation;
        keyframe.title = `${time}s - ${animation}`;
        
        // クリック・タッチ選択
        keyframe.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectKeyframe(keyframe);
        });
        
        // マウスドラッグ対応
        keyframe.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startKeyframeDrag(keyframe, e);
        });
        
        // タッチドラッグ対応
        keyframe.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startKeyframeDrag(keyframe, e.touches[0]);
        }, { passive: false });
        
        // ダブルタップでアニメーション編集（モバイル対応）
        let lastTap = 0;
        keyframe.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 500 && tapLength > 0) {
                // ダブルタップ
                e.preventDefault();
                this.editKeyframeAnimation(keyframe);
            }
            
            lastTap = currentTime;
        });
        
        // PC版ダブルクリック
        keyframe.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.editKeyframeAnimation(keyframe);
        });
        
        const keyframeId = `${characterId}-${time}`;
        this.keyframes.set(keyframeId, {
            element: keyframe,
            time: time,
            characterId: characterId,
            animation: animation
        });
        
        return keyframe;
    }
    
    /**
     * 基本制御メソッド
     */
    play() {
        this.isPlaying = true;
        console.log('▶️ タイムライン再生');
    }
    
    pause() {
        this.isPlaying = false;
        console.log('⏸️ タイムライン一時停止');
    }
    
    stop() {
        this.isPlaying = false;
        this.currentTime = 0;
        this.updateTimeDisplay();
        this.updatePlayhead();
        const scrubber = document.getElementById('timeline-scrubber');
        if (scrubber) scrubber.value = 0;
        console.log('⏹️ タイムライン停止');
    }
    
    reset() {
        this.stop();
        console.log('🔄 タイムライン完全リセット');
    }
    
    /**
     * UI更新メソッド
     */
    updateTimeDisplay() {
        const timeDisplay = document.getElementById('timeline-current-time');
        if (timeDisplay) {
            timeDisplay.textContent = `${this.currentTime.toFixed(1)}s`;
        }
    }
    
    updatePlayhead() {
        const playhead = document.getElementById('timeline-playhead');
        if (playhead) {
            const percentage = (this.currentTime / this.maxTime) * 100;
            playhead.style.left = `${Math.max(0, Math.min(100, percentage))}%`;
        }
    }
    
    /**
     * 更新ループ開始
     */
    startUpdateLoop() {
        const update = () => {
            if (this.isVisible && this.isPlaying) {
                this.currentTime += 0.016 * this.playbackSpeed;
                if (this.currentTime >= this.maxTime) {
                    this.currentTime = this.maxTime;
                    this.isPlaying = false;
                }
                
                const scrubber = document.getElementById('timeline-scrubber');
                if (scrubber) scrubber.value = this.currentTime;
                this.updateTimeDisplay();
                this.updatePlayhead();
                
                // コールバック実行
                if (this.onTimelineChange) {
                    this.onTimelineChange(this.currentTime);
                }
            }
            
            requestAnimationFrame(update);
        };
        
        update();
    }
    
    // その他の必要なメソッド（モバイル対応完全版）
    selectKeyframe(keyframe) {
        if (this.selectedKeyframe) {
            this.selectedKeyframe.classList.remove('selected');
        }
        this.selectedKeyframe = keyframe;
        keyframe.classList.add('selected');
        
        console.log(`🎯 キーフレーム選択: ${keyframe.dataset.characterId} at ${keyframe.dataset.time}s`);
    }
    
    startKeyframeDrag(keyframe, startEvent) {
        const timeline = keyframe.parentElement;
        const timelineRect = timeline.getBoundingClientRect();
        
        const onMove = (e) => {
            // タッチとマウスの座標取得を統一
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            if (!clientX) return;
            
            const x = clientX - timelineRect.left;
            const percentage = Math.max(0, Math.min(100, (x / timelineRect.width) * 100));
            const newTime = (percentage / 100) * this.maxTime;
            
            keyframe.style.left = `${percentage}%`;
            keyframe.dataset.time = newTime.toFixed(1);
            keyframe.title = `${newTime.toFixed(1)}s - ${keyframe.dataset.animation}`;
        };
        
        const onEnd = () => {
            // イベントリスナー削除（マウス）
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onEnd);
            
            // イベントリスナー削除（タッチ）
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            
            const newTime = parseFloat(keyframe.dataset.time);
            const characterId = keyframe.dataset.characterId;
            
            console.log(`✅ キーフレーム移動完了: ${characterId} to ${newTime}s`);
        };
        
        // マウスドラッグリスナー
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        
        // タッチドラッグリスナー
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }
    
    editKeyframeAnimation(keyframe) {
        const currentAnimation = keyframe.dataset.animation || 'idle';
        
        // モバイルでの選択UI（プロンプトの代替案）
        if (this.isMobileDevice()) {
            this.showMobileAnimationSelector(keyframe);
        } else {
            // PC版のプロンプト
            const newAnimation = prompt(`アニメーション変更 (現在: ${currentAnimation})`, currentAnimation);
            
            if (newAnimation && newAnimation !== currentAnimation) {
                this.updateKeyframeAnimation(keyframe, newAnimation);
            }
        }
    }
    
    isMobileDevice() {
        return window.innerWidth <= 768 || 'ontouchstart' in window;
    }
    
    showMobileAnimationSelector(keyframe) {
        // モバイル用のアニメーション選択UI
        const animations = ['idle', 'walk', 'jump', 'wave', 'dance'];
        const currentAnimation = keyframe.dataset.animation || 'idle';
        
        // 簡易的なモーダル選択UI
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
        `;
        
        const selector = document.createElement('div');
        selector.style.cssText = `
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 300px;
            width: 90%;
        `;
        
        selector.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #667eea;">アニメーション選択</h3>
            <div class="mobile-animation-options"></div>
            <button class="mobile-cancel-btn" style="
                background: #e53e3e; color: white; border: none;
                padding: 10px 20px; border-radius: 5px; margin-top: 15px;
                width: 100%; cursor: pointer;
            ">キャンセル</button>
        `;
        
        const optionsContainer = selector.querySelector('.mobile-animation-options');
        animations.forEach(animation => {
            const button = document.createElement('button');
            button.textContent = animation;
            button.style.cssText = `
                background: ${animation === currentAnimation ? '#48bb78' : '#667eea'};
                color: white; border: none;
                padding: 12px 20px; border-radius: 5px; margin: 5px;
                cursor: pointer; font-size: 1rem;
                display: block; width: calc(100% - 10px);
            `;
            
            button.addEventListener('click', () => {
                this.updateKeyframeAnimation(keyframe, animation);
                modal.remove();
            });
            
            optionsContainer.appendChild(button);
        });
        
        selector.querySelector('.mobile-cancel-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.appendChild(selector);
        document.body.appendChild(modal);
    }
    
    updateKeyframeAnimation(keyframe, newAnimation) {
        keyframe.dataset.animation = newAnimation;
        keyframe.title = `${keyframe.dataset.time}s - ${newAnimation}`;
        
        // キーフレームデータ更新
        const keyframeId = `${keyframe.dataset.characterId}-${keyframe.dataset.time}`;
        const keyframeData = this.keyframes.get(keyframeId);
        if (keyframeData) {
            keyframeData.animation = newAnimation;
        }
        
        console.log(`🎨 アニメーション変更: ${keyframe.dataset.characterId} -> ${newAnimation}`);
    }
    
    addKeyframe() {
        const activeTrack = Array.from(this.characterTracks.keys())[0];
        if (!activeTrack) return;
        
        const selector = document.getElementById('timeline-animation-selector');
        const selectedAnimation = selector ? selector.value : 'idle';
        
        const trackData = this.characterTracks.get(activeTrack);
        const timeline = trackData.element.querySelector('.track-timeline');
        
        const keyframe = this.createKeyframe(this.currentTime, activeTrack, selectedAnimation);
        timeline.appendChild(keyframe);
        this.selectKeyframe(keyframe);
        
        console.log(`➕ キーフレーム追加: ${activeTrack} at ${this.currentTime}s`);
    }
    
    deleteSelectedKeyframe() {
        if (!this.selectedKeyframe) return;
        
        const time = this.selectedKeyframe.dataset.time;
        const characterId = this.selectedKeyframe.dataset.characterId;
        
        this.selectedKeyframe.remove();
        this.keyframes.delete(`${characterId}-${time}`);
        this.selectedKeyframe = null;
        
        console.log(`🗑️ キーフレーム削除: ${characterId} at ${time}s`);
    }
}

// グローバルに公開
window.TimelineEditorUI = TimelineEditorUI;

console.log('✅ Timeline Editor UI モジュール読み込み完了');