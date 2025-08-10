// 🔗 タイムライン編集システム - コア統合（200行以内）
// 役割: 基本統合機能・モード切り替え・既存システム連携
// 分割元: timeline-edit-integration.js のコア機能のみ抽出

console.log('🔗 Timeline Edit Core モジュール読み込み開始');

/**
 * タイムライン編集システム - コア統合クラス
 * 基本統合機能・モード切り替えのみ担当
 */
class TimelineEditCore {
    constructor() {
        this.timelineEditor = null;
        this.isTimelineMode = false;
        this.editSystemActive = false;
        
        console.log('🔗 Timeline Edit Core 初期化');
    }
    
    /**
     * 編集システム統合を初期化
     */
    init() {
        // 既存編集システムの存在確認
        if (!this.checkEditSystemAvailable()) {
            console.warn('⚠️ 既存編集システムが見つかりません');
            return false;
        }
        
        // タイムライン編集ボタンを編集UIに追加
        this.addTimelineEditButton();
        
        console.log('✅ Timeline Edit Core 初期化完了');
        return true;
    }
    
    /**
     * 既存編集システムの利用可能性をチェック
     */
    checkEditSystemAvailable() {
        // spine-positioning-system-explanation.js の関数確認
        return (
            typeof window.startCharacterEdit === 'function' ||
            typeof window.startCanvasEdit === 'function' ||
            document.querySelector('.edit-panel') !== null
        );
    }
    
    /**
     * タイムライン編集ボタンを追加
     */
    addTimelineEditButton() {
        // 既存の編集パネルを探す
        const editPanel = document.querySelector('.edit-panel') || 
                         document.querySelector('[id*="edit"]') ||
                         document.querySelector('.control-panel');
        
        if (!editPanel) {
            console.warn('⚠️ 編集パネルが見つかりません - ボタン追加をスキップ');
            return;
        }
        
        // タイムライン編集ボタンを作成
        const timelineButton = document.createElement('button');
        timelineButton.className = 'timeline-edit-btn edit-btn';
        timelineButton.innerHTML = '🎬 タイムライン編集';
        timelineButton.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            margin: 5px;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        // ホバー効果
        timelineButton.addEventListener('mouseenter', () => {
            timelineButton.style.transform = 'translateY(-2px)';
            timelineButton.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
        });
        
        timelineButton.addEventListener('mouseleave', () => {
            timelineButton.style.transform = 'translateY(0)';
            timelineButton.style.boxShadow = 'none';
        });
        
        // クリックイベント
        timelineButton.addEventListener('click', () => {
            this.toggleTimelineEditMode();
        });
        
        // 編集パネルに追加
        editPanel.appendChild(timelineButton);
        
        console.log('✅ タイムライン編集ボタン追加完了');
    }
    
    /**
     * タイムライン編集モードの切り替え
     */
    toggleTimelineEditMode() {
        if (this.isTimelineMode) {
            this.exitTimelineEditMode();
        } else {
            this.enterTimelineEditMode();
        }
    }
    
    /**
     * タイムライン編集モードに入る
     */
    enterTimelineEditMode() {
        this.isTimelineMode = true;
        
        // 既存編集モードを一時停止
        this.pauseExistingEditMode();
        
        // タイムライン編集UIを表示
        this.showTimelineEditor();
        
        // ボタン状態を更新
        this.updateButtonState();
        
        // モード変更を通知
        this.notifyModeChange('timeline');
        
        console.log('🎬 タイムライン編集モードに切り替え');
    }
    
    /**
     * タイムライン編集モードを終了
     */
    exitTimelineEditMode() {
        this.isTimelineMode = false;
        
        // タイムライン編集UIを非表示
        this.hideTimelineEditor();
        
        // 既存編集モードを復元
        this.resumeExistingEditMode();
        
        // ボタン状態を更新
        this.updateButtonState();
        
        // モード変更を通知
        this.notifyModeChange('normal');
        
        console.log('⬅️ 通常編集モードに復帰');
    }
    
    /**
     * 既存編集モードを一時停止
     */
    pauseExistingEditMode() {
        // 編集ハンドルを非表示
        const editHandles = document.querySelectorAll('.edit-handle, .resize-handle');
        editHandles.forEach(handle => {
            handle.style.display = 'none';
        });
        
        // 既存編集ボタンを無効化
        const editButtons = document.querySelectorAll('.edit-btn:not(.timeline-edit-btn)');
        editButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        });
        
        console.log('⏸️ 既存編集モードを一時停止');
    }
    
    /**
     * 既存編集モードを復元
     */
    resumeExistingEditMode() {
        // 編集ハンドルを再表示
        const editHandles = document.querySelectorAll('.edit-handle, .resize-handle');
        editHandles.forEach(handle => {
            handle.style.display = '';
        });
        
        // 既存編集ボタンを復元
        const editButtons = document.querySelectorAll('.edit-btn:not(.timeline-edit-btn)');
        editButtons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '';
        });
        
        console.log('▶️ 既存編集モードを復元');
    }
    
    /**
     * タイムライン編集UIを表示
     */
    showTimelineEditor() {
        if (!this.timelineEditor) {
            // モジュール統合読み込み
            this.loadTimelineEditorModules(() => {
                this.createTimelineEditor();
            });
        } else {
            this.timelineEditor.show();
        }
    }
    
    /**
     * タイムライン編集モジュール読み込み
     */
    loadTimelineEditorModules(callback) {
        const modules = [
            'timeline-editor-core.js',
            'timeline-keyframe-ui.js', 
            'timeline-responsive-ui.js',
            'timeline-visual-effects.js'
        ];
        
        let loadedCount = 0;
        
        modules.forEach(module => {
            const script = document.createElement('script');
            script.src = `assets/spine/${module}`;
            script.onload = () => {
                loadedCount++;
                if (loadedCount === modules.length) {
                    callback();
                }
            };
            document.head.appendChild(script);
        });
    }
    
    /**
     * タイムライン編集インスタンス作成
     */
    createTimelineEditor() {
        if (typeof TimelineEditorCore === 'undefined') {
            console.error('❌ TimelineEditorCore が読み込まれていません');
            return;
        }
        
        // コアインスタンス作成
        const core = new TimelineEditorCore({
            mode: 'integrated',
            maxTime: 15,
            onTimelineChange: this.onTimelineChange.bind(this),
            onKeyframeEdit: this.onKeyframeEdit.bind(this)
        });
        
        // 拡張機能インスタンス作成
        const keyframeUI = new TimelineKeyframeUI(core);
        const responsiveUI = new TimelineResponsiveUI(core);
        const visualEffects = new TimelineVisualEffects(core);
        
        // 統合インスタンス作成
        this.timelineEditor = {
            core,
            keyframeUI,
            responsiveUI,
            visualEffects,
            show() {
                core.show();
                keyframeUI.init();
                responsiveUI.init();
                visualEffects.init();
            },
            hide() {
                core.hide();
                visualEffects.clearAllEffects();
            }
        };
        
        this.timelineEditor.show();
        console.log('✅ タイムライン編集インスタンス作成完了');
    }
    
    /**
     * タイムライン編集UIを非表示
     */
    hideTimelineEditor() {
        if (this.timelineEditor) {
            this.timelineEditor.hide();
        }
    }
    
    /**
     * ボタンの状態を更新
     */
    updateButtonState() {
        const button = document.querySelector('.timeline-edit-btn');
        if (button) {
            if (this.isTimelineMode) {
                button.innerHTML = '⬅️ 通常編集に戻る';
                button.style.background = 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
            } else {
                button.innerHTML = '🎬 タイムライン編集';
                button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }
        }
    }
    
    /**
     * モード変更の通知
     */
    notifyModeChange(mode) {
        // カスタムイベントを発火
        const event = new CustomEvent('timelineEditModeChange', {
            detail: { mode: mode, isTimelineMode: this.isTimelineMode }
        });
        document.dispatchEvent(event);
        
        // 既存システムとの連携用コールバック
        if (window.onTimelineEditModeChange) {
            window.onTimelineEditModeChange(mode, this.isTimelineMode);
        }
        
        console.log(`📡 モード変更通知: ${mode}`);
    }
    
    /**
     * タイムライン変更時のコールバック
     */
    onTimelineChange(currentTime) {
        // 既存システムの時間同期処理など
        console.log(`⏰ タイムライン時間変更: ${currentTime}s`);
    }
    
    /**
     * キーフレーム編集時のコールバック
     */
    onKeyframeEdit(keyframeData) {
        // 既存システムのアニメーション制御など
        console.log('🎯 キーフレーム編集:', keyframeData);
    }
    
    /**
     * 統合システムを破棄
     */
    destroy() {
        if (this.isTimelineMode) {
            this.exitTimelineEditMode();
        }
        
        // タイムライン編集ボタンを削除
        const button = document.querySelector('.timeline-edit-btn');
        if (button) {
            button.remove();
        }
        
        // タイムライン編集UIを破棄
        if (this.timelineEditor) {
            this.timelineEditor.hide();
            this.timelineEditor = null;
        }
        
        console.log('🗑️ Timeline Edit Core 破棄完了');
    }
}

// グローバルに公開
window.TimelineEditCore = TimelineEditCore;

console.log('✅ Timeline Edit Core モジュール読み込み完了');