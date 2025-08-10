// 🎯 タイムライン キーフレーム UI（300行以内）
// 役割: キーフレーム表示・編集・ドラッグ&ドロップ機能
// 依存: timeline-editor-core.js

console.log('🎯 Timeline Keyframe UI モジュール読み込み開始');

/**
 * タイムライン キーフレーム編集システム
 * キーフレームの作成・編集・操作を担当
 */
class TimelineKeyframeUI {
    constructor(coreInstance) {
        this.core = coreInstance;
        this.selectedKeyframe = null;
        this.characterTracks = new Map();
        this.keyframes = new Map();
        
        console.log('🎯 Timeline Keyframe UI 初期化完了');
    }
    
    /**
     * キーフレームUIを初期化
     */
    init() {
        this.setupKeyframeEventListeners();
        this.createSampleTracks();
        this.applyKeyframeStyles();
        
        console.log('✅ Keyframe UI 初期化完了');
    }
    
    /**
     * キーフレーム編集用スタイルを適用
     */
    applyKeyframeStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .keyframe-editing-controls {
                display: flex;
                gap: 8px;
                margin: 15px 0;
                align-items: center;
            }
            
            .animation-selector {
                flex: 1;
                padding: 6px;
                border: 1px solid #e2e8f0;
                border-radius: 4px;
                font-size: 0.85rem;
            }
            
            .timeline-btn-secondary {
                padding: 8px 12px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.85rem;
                transition: all 0.2s;
                background: #48bb78;
                color: white;
            }
            
            .timeline-btn-secondary:hover {
                background: #38a169;
            }
            
            .timeline-btn-danger {
                padding: 8px 12px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.85rem;
                transition: all 0.2s;
                background: #e53e3e;
                color: white;
            }
            
            .timeline-btn-danger:hover {
                background: #c53030;
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
                width: 80px;
                font-weight: 500;
                color: #667eea;
                font-size: 0.8rem;
            }
            
            .track-timeline {
                flex: 1;
                position: relative;
                height: 20px;
                background: rgba(102, 126, 234, 0.1);
                border-radius: 2px;
                margin-left: 8px;
            }
            
            .keyframe {
                position: absolute;
                top: 2px;
                width: 12px;
                height: 16px;
                background: #48bb78;
                border-radius: 2px;
                cursor: move;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                transition: all 0.2s;
                user-select: none;
                z-index: 10;
            }
            
            .keyframe:hover {
                background: #38a169;
                transform: scale(1.1);
                box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            }
            
            .keyframe.selected {
                background: #e53e3e;
                border-color: #c53030;
                transform: scale(1.15);
                z-index: 15;
            }
            
            .keyframe.dragging {
                background: #667eea;
                transform: scale(1.2);
                z-index: 20;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            }
            
            /* モバイル対応 */
            @media (max-width: 768px) {
                .keyframe {
                    width: 16px;
                    height: 16px;
                    top: 2px;
                }
                
                .keyframe-editing-controls {
                    flex-direction: column;
                    gap: 8px;
                }
                
                .animation-selector {
                    width: 100%;
                }
                
                .timeline-btn-secondary,
                .timeline-btn-danger {
                    width: 100%;
                }
                
                .track-label {
                    width: 60px;
                    font-size: 0.75rem;
                }
            }
        `;
        
        if (!document.head.querySelector('#timeline-keyframe-styles')) {
            style.id = 'timeline-keyframe-styles';
            document.head.appendChild(style);
        }
    }
    
    /**
     * キーフレーム編集用のイベントリスナー設定
     */
    setupKeyframeEventListeners() {
        // キーフレーム編集コントロールを追加
        this.addKeyframeControls();
        
        // キーフレーム追加ボタン
        document.addEventListener('click', (e) => {
            if (e.target.id === 'timeline-add-keyframe') {
                this.addKeyframe();
            } else if (e.target.id === 'timeline-delete-keyframe') {
                this.deleteSelectedKeyframe();
            }
        });
    }
    
    /**
     * キーフレーム編集コントロールをUIに追加
     */
    addKeyframeControls() {
        const container = document.getElementById('timeline-editor-container');
        if (!container) return;
        
        // 既存のスクラバーコンテナの前に挿入
        const scrubberContainer = container.querySelector('.timeline-scrubber-container');
        if (!scrubberContainer) return;
        
        const controlsHTML = `
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
        `;
        
        scrubberContainer.insertAdjacentHTML('beforebegin', controlsHTML);
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
     * キーフレーム作成（モバイル対応完全版）
     */
    createKeyframe(time, characterId, animation = 'idle') {
        const keyframe = document.createElement('div');
        keyframe.className = 'keyframe';
        keyframe.style.left = `${(time / this.core.maxTime) * 100}%`;
        keyframe.dataset.time = time;
        keyframe.dataset.characterId = characterId;
        keyframe.dataset.animation = animation;
        keyframe.title = `${time}s - ${animation}`;
        
        // クリック・タッチ選択
        keyframe.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectKeyframe(keyframe);
        });
        
        // マウス・タッチドラッグ対応
        this.setupKeyframeDrag(keyframe);
        
        // ダブルタップ・ダブルクリック対応
        this.setupKeyframeEdit(keyframe);
        
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
     * キーフレームドラッグ機能設定
     */
    setupKeyframeDrag(keyframe) {
        const startDrag = (startEvent) => {
            keyframe.classList.add('dragging');
            const timeline = keyframe.parentElement;
            const timelineRect = timeline.getBoundingClientRect();
            
            const onMove = (moveEvent) => {
                const clientX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX);
                const relativeX = clientX - timelineRect.left;
                const percentage = Math.max(0, Math.min(100, (relativeX / timelineRect.width) * 100));
                const newTime = (percentage / 100) * this.core.maxTime;
                
                keyframe.style.left = `${percentage}%`;
                keyframe.dataset.time = newTime.toFixed(1);
                keyframe.title = `${newTime.toFixed(1)}s - ${keyframe.dataset.animation}`;
            };
            
            const onEnd = () => {
                keyframe.classList.remove('dragging');
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onEnd);
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('touchend', onEnd);
                
                console.log(`🎯 キーフレーム移動完了: ${keyframe.dataset.time}s`);
            };
            
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onEnd);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onEnd);
        };
        
        keyframe.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startDrag(e);
        });
        
        keyframe.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startDrag(e.touches[0]);
        }, { passive: false });
    }
    
    /**
     * キーフレーム編集機能設定
     */
    setupKeyframeEdit(keyframe) {
        let lastTap = 0;
        
        // モバイル：ダブルタップ
        keyframe.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 500 && tapLength > 0) {
                e.preventDefault();
                this.editKeyframeAnimation(keyframe);
            }
            
            lastTap = currentTime;
        });
        
        // PC：ダブルクリック
        keyframe.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.editKeyframeAnimation(keyframe);
        });
    }
    
    /**
     * キーフレーム選択
     */
    selectKeyframe(keyframe) {
        if (this.selectedKeyframe) {
            this.selectedKeyframe.classList.remove('selected');
        }
        this.selectedKeyframe = keyframe;
        keyframe.classList.add('selected');
        
        console.log(`🎯 キーフレーム選択: ${keyframe.dataset.characterId} at ${keyframe.dataset.time}s`);
    }
    
    /**
     * キーフレームアニメーション編集
     */
    editKeyframeAnimation(keyframe) {
        const animations = ['idle', 'walk', 'jump', 'wave', 'dance'];
        const currentAnimation = keyframe.dataset.animation;
        
        if (this.isMobileDevice()) {
            this.showMobileAnimationSelector(keyframe, animations, currentAnimation);
        } else {
            // PC版: セレクトボックス使用
            const selector = document.getElementById('timeline-animation-selector');
            if (selector) {
                selector.value = currentAnimation;
                selector.focus();
                
                const onChange = () => {
                    this.updateKeyframeAnimation(keyframe, selector.value);
                    selector.removeEventListener('change', onChange);
                };
                selector.addEventListener('change', onChange);
            }
        }
    }
    
    /**
     * モバイルデバイス判定
     */
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    /**
     * モバイル向けアニメーション選択UI
     */
    showMobileAnimationSelector(keyframe, animations, currentAnimation) {
        const modal = document.createElement('div');
        modal.className = 'mobile-animation-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); z-index: 3000;
            display: flex; align-items: center; justify-content: center;
        `;
        
        const selector = document.createElement('div');
        selector.className = 'mobile-animation-selector';
        selector.style.cssText = `
            background: white; border-radius: 10px; padding: 20px;
            max-width: 80vw; width: 300px;
        `;
        
        selector.innerHTML = `
            <h4 style="margin-top: 0; color: #667eea;">アニメーション選択</h4>
            <div class="mobile-animation-options"></div>
            <button class="mobile-cancel-btn">キャンセル</button>
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
    
    /**
     * キーフレームアニメーション更新
     */
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
    
    /**
     * キーフレーム追加
     */
    addKeyframe() {
        const activeTrack = Array.from(this.characterTracks.keys())[0];
        if (!activeTrack) return;
        
        const selector = document.getElementById('timeline-animation-selector');
        const selectedAnimation = selector ? selector.value : 'idle';
        
        const trackData = this.characterTracks.get(activeTrack);
        const timeline = trackData.element.querySelector('.track-timeline');
        
        const keyframe = this.createKeyframe(this.core.currentTime, activeTrack, selectedAnimation);
        timeline.appendChild(keyframe);
        this.selectKeyframe(keyframe);
        
        console.log(`➕ キーフレーム追加: ${activeTrack} at ${this.core.currentTime}s`);
    }
    
    /**
     * 選択キーフレーム削除
     */
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
window.TimelineKeyframeUI = TimelineKeyframeUI;

console.log('✅ Timeline Keyframe UI モジュール読み込み完了');