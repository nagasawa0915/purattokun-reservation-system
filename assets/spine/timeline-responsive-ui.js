// 📱 タイムライン レスポンシブ UI（250行以内）
// 役割: レスポンシブ対応・モバイル最適化・デバイス別UI
// 依存: timeline-editor-core.js

console.log('📱 Timeline Responsive UI モジュール読み込み開始');

/**
 * タイムライン レスポンシブUI管理システム
 * デバイス別最適化・レスポンシブ対応を担当
 */
class TimelineResponsiveUI {
    constructor(coreInstance) {
        this.core = coreInstance;
        this.isMobile = false;
        this.isTablet = false;
        this.currentBreakpoint = 'desktop';
        
        this.detectDevice();
        console.log(`📱 Timeline Responsive UI 初期化完了 (${this.currentBreakpoint})`);
    }
    
    /**
     * レスポンシブUIを初期化
     */
    init() {
        this.applyResponsiveStyles();
        this.setupResponsiveEventListeners();
        this.adjustUIForDevice();
        
        console.log('✅ Responsive UI 初期化完了');
    }
    
    /**
     * デバイス検出
     */
    detectDevice() {
        const userAgent = navigator.userAgent;
        const width = window.innerWidth;
        
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || width < 768;
        this.isTablet = width >= 768 && width < 1024;
        
        if (this.isMobile) {
            this.currentBreakpoint = 'mobile';
        } else if (this.isTablet) {
            this.currentBreakpoint = 'tablet';
        } else {
            this.currentBreakpoint = 'desktop';
        }
    }
    
    /**
     * レスポンシブ対応スタイルを適用
     */
    applyResponsiveStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* タブレット対応 (768px - 1023px) */
            @media (min-width: 768px) and (max-width: 1023px) {
                .timeline-editor-panel {
                    width: 400px;
                    padding: 18px;
                }
                
                .timeline-playback-controls {
                    justify-content: space-between;
                }
                
                .timeline-btn {
                    padding: 10px 14px;
                    font-size: 0.9rem;
                }
                
                .track-label {
                    width: 90px;
                    font-size: 0.85rem;
                }
                
                .keyframe {
                    width: 14px;
                    height: 18px;
                }
                
                .timeline-scrubber {
                    height: 8px;
                }
                
                .timeline-scrubber::-webkit-slider-thumb {
                    width: 18px;
                    height: 18px;
                }
            }
            
            /* モバイル対応 (767px以下) */
            @media (max-width: 767px) {
                .timeline-editor-panel {
                    width: calc(100vw - 20px);
                    max-width: 350px;
                    padding: 15px;
                    margin: 10px;
                    position: fixed !important;
                    top: 10px !important;
                    right: 10px !important;
                    left: 10px !important;
                    transform: none !important;
                    bottom: auto;
                    max-height: calc(100vh - 60px);
                    overflow-y: auto;
                }
                
                .timeline-editor-header h3 {
                    font-size: 1rem;
                }
                
                .timeline-close-btn {
                    width: 28px;
                    height: 28px;
                    font-size: 1rem;
                }
                
                .timeline-playback-controls {
                    flex-wrap: wrap;
                    gap: 6px;
                }
                
                .timeline-btn {
                    flex: 1;
                    min-width: 60px;
                    padding: 12px 8px;
                    font-size: 0.8rem;
                }
                
                .timeline-time-display {
                    font-size: 0.8rem;
                    padding: 8px;
                    margin: 8px 0;
                }
                
                .timeline-track-area {
                    padding: 12px;
                    margin: 12px 0;
                }
                
                .timeline-ruler {
                    height: 30px;
                }
                
                .character-track {
                    margin-bottom: 8px;
                    padding: 6px;
                }
                
                .track-label {
                    width: 60px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                
                .track-timeline {
                    height: 24px;
                    margin-left: 6px;
                }
                
                .keyframe {
                    width: 16px;
                    height: 20px;
                    top: 2px;
                    border-width: 1px;
                }
                
                .keyframe:hover {
                    transform: scale(1.05);
                }
                
                .keyframe.selected {
                    transform: scale(1.1);
                }
                
                .keyframe-editing-controls {
                    flex-direction: column;
                    gap: 8px;
                    margin: 12px 0;
                }
                
                .animation-selector {
                    width: 100%;
                    padding: 12px;
                    font-size: 1rem;
                    border-radius: 6px;
                }
                
                .timeline-btn-secondary,
                .timeline-btn-danger {
                    width: 100%;
                    padding: 12px;
                    font-size: 1rem;
                    border-radius: 6px;
                }
                
                .timeline-scrubber {
                    height: 10px;
                    margin: 15px 0;
                }
                
                .timeline-scrubber::-webkit-slider-thumb {
                    width: 20px;
                    height: 20px;
                }
                
                /* モバイル向けタッチ最適化 */
                .timeline-editor-panel * {
                    touch-action: manipulation;
                }
                
                .keyframe {
                    touch-action: none;
                }
                
                /* スクロール最適化 */
                .timeline-track-area {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }
                
                .character-tracks {
                    min-width: 300px;
                }
            }
            
            /* 横向きモバイル対応 */
            @media (max-width: 767px) and (orientation: landscape) {
                .timeline-editor-panel {
                    max-height: calc(100vh - 40px);
                    width: calc(100vw - 40px);
                    max-width: 500px;
                    top: 20px !important;
                    right: 20px !important;
                    left: 20px !important;
                }
                
                .timeline-playback-controls {
                    flex-wrap: nowrap;
                }
                
                .timeline-btn {
                    min-width: 50px;
                    padding: 8px 6px;
                    font-size: 0.75rem;
                }
                
                .keyframe-editing-controls {
                    flex-direction: row;
                    flex-wrap: wrap;
                }
                
                .animation-selector {
                    flex: 1;
                    width: auto;
                }
                
                .timeline-btn-secondary,
                .timeline-btn-danger {
                    width: auto;
                    flex: none;
                    padding: 8px 12px;
                    font-size: 0.85rem;
                }
            }
            
            /* 小さなモバイル対応 (320px以下) */
            @media (max-width: 320px) {
                .timeline-editor-panel {
                    padding: 12px;
                    margin: 5px;
                }
                
                .timeline-editor-header h3 {
                    font-size: 0.9rem;
                }
                
                .timeline-btn {
                    padding: 10px 6px;
                    font-size: 0.7rem;
                }
                
                .track-label {
                    width: 50px;
                    font-size: 0.7rem;
                }
                
                .keyframe {
                    width: 14px;
                    height: 18px;
                }
            }
        `;
        
        if (!document.head.querySelector('#timeline-responsive-styles')) {
            style.id = 'timeline-responsive-styles';
            document.head.appendChild(style);
        }
    }
    
    /**
     * レスポンシブイベントリスナー設定
     */
    setupResponsiveEventListeners() {
        // ウィンドウリサイズ対応
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
        
        // オリエンテーション変更対応
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
        
        // タッチ最適化
        if (this.isMobile) {
            this.setupTouchOptimization();
        }
    }
    
    /**
     * デバイス別UI調整
     */
    adjustUIForDevice() {
        const container = document.getElementById(this.core.containerId);
        if (!container) return;
        
        // デバイス固有のクラス追加
        container.classList.add(`timeline-${this.currentBreakpoint}`);
        
        if (this.isMobile) {
            // モバイル固有の調整
            this.adjustMobileUI(container);
        } else if (this.isTablet) {
            // タブレット固有の調整
            this.adjustTabletUI(container);
        } else {
            // デスクトップ固有の調整
            this.adjustDesktopUI(container);
        }
    }
    
    /**
     * モバイルUI調整
     */
    adjustMobileUI(container) {
        // タッチフレンドリーなボタンサイズ確保
        const buttons = container.querySelectorAll('.timeline-btn, .timeline-btn-secondary, .timeline-btn-danger');
        buttons.forEach(button => {
            button.style.minHeight = '44px';
            button.style.minWidth = '44px';
        });
        
        // キーフレームのタッチ領域拡大
        const keyframes = container.querySelectorAll('.keyframe');
        keyframes.forEach(keyframe => {
            keyframe.style.touchAction = 'none';
        });
        
        console.log('📱 モバイルUI調整完了');
    }
    
    /**
     * タブレットUI調整
     */
    adjustTabletUI(container) {
        // タブレット向けの中間サイズ調整
        container.style.fontSize = '0.9rem';
        
        console.log('📱 タブレットUI調整完了');
    }
    
    /**
     * デスクトップUI調整
     */
    adjustDesktopUI(container) {
        // デスクトップ向けホバー効果強化
        const keyframes = container.querySelectorAll('.keyframe');
        keyframes.forEach(keyframe => {
            keyframe.addEventListener('mouseenter', () => {
                keyframe.style.transform = 'scale(1.1)';
            });
            keyframe.addEventListener('mouseleave', () => {
                if (!keyframe.classList.contains('selected')) {
                    keyframe.style.transform = 'scale(1)';
                }
            });
        });
        
        console.log('🖥️ デスクトップUI調整完了');
    }
    
    /**
     * タッチ最適化設定
     */
    setupTouchOptimization() {
        // ダブルタップズーム無効化
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
        
        // スクロール競合回避
        const container = document.getElementById(this.core.containerId);
        if (container) {
            container.addEventListener('touchmove', (e) => {
                if (e.target.classList.contains('keyframe') || 
                    e.target.classList.contains('timeline-scrubber')) {
                    e.preventDefault();
                }
            }, { passive: false });
        }
    }
    
    /**
     * ウィンドウリサイズハンドラー
     */
    handleResize() {
        const oldBreakpoint = this.currentBreakpoint;
        this.detectDevice();
        
        if (oldBreakpoint !== this.currentBreakpoint) {
            console.log(`📱 ブレークポイント変更: ${oldBreakpoint} → ${this.currentBreakpoint}`);
            this.adjustUIForDevice();
        }
        
        // プレイヘッドとキーフレーム位置の再計算
        this.recalculatePositions();
    }
    
    /**
     * オリエンテーション変更ハンドラー
     */
    handleOrientationChange() {
        this.detectDevice();
        this.adjustUIForDevice();
        this.recalculatePositions();
        
        console.log(`📱 オリエンテーション変更対応完了 (${this.currentBreakpoint})`);
    }
    
    /**
     * 位置再計算
     */
    recalculatePositions() {
        // プレイヘッド位置更新
        if (this.core.updatePlayhead) {
            this.core.updatePlayhead();
        }
        
        // キーフレーム位置再計算
        const keyframes = document.querySelectorAll('.keyframe');
        keyframes.forEach(keyframe => {
            const time = parseFloat(keyframe.dataset.time);
            const percentage = (time / this.core.maxTime) * 100;
            keyframe.style.left = `${percentage}%`;
        });
    }
    
    /**
     * 現在のデバイス情報を取得
     */
    getDeviceInfo() {
        return {
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            currentBreakpoint: this.currentBreakpoint,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight
        };
    }
}

// グローバルに公開
window.TimelineResponsiveUI = TimelineResponsiveUI;

console.log('✅ Timeline Responsive UI モジュール読み込み完了');