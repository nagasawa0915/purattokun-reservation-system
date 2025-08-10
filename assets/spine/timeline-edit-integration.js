// 🗂️ DEPRECATED: タイムライン編集統合 (Phase 2.5でモジュール分割済み)
// 📋 新モジュール:
//   - timeline-edit-core.js (コア統合機能)
//   - timeline-edit-compatibility.js (互換性保証)
// 🔒 このファイルは互換性のため残存 - 新規開発では新モジュールを使用
// 🔗 タイムライン編集システム統合 - Phase 2実装（200行以内）
// 役割: 既存編集システムにタイムライン編集UI統合
// 統合: spine-positioning-system-explanation.js + timeline-editor-ui.js
// 目的: シームレスなタイムライン編集モード切り替え

console.log('🔗 Timeline Edit Integration モジュール読み込み開始');

/**
 * タイムライン編集システム統合クラス
 * 既存の編集システムにタイムライン機能を統合
 */
class TimelineEditIntegration {
    constructor() {
        this.timelineEditor = null;
        this.isTimelineMode = false;
        this.editSystemActive = false;
        this.originalEditButtons = null;
        
        console.log('🔗 Timeline Edit Integration 初期化');
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
        
        console.log('✅ Timeline Edit Integration 初期化完了');
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
     * タイムライン編集ボタンを既存編集UIに追加
     */
    addTimelineEditButton() {
        // 既存の編集パネルを探す
        let editPanel = document.querySelector('.edit-panel');
        
        // パネルが存在しない場合は作成
        if (!editPanel) {
            editPanel = this.createEditPanel();
        }
        
        // タイムライン編集ボタンを追加
        const timelineButton = this.createTimelineEditButton();
        editPanel.appendChild(timelineButton);
        
        console.log('➕ タイムライン編集ボタンを追加しました');
    }
    
    /**
     * 編集パネルを作成（存在しない場合）
     */
    createEditPanel() {
        const panel = document.createElement('div');
        panel.className = 'edit-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.95);
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            backdrop-filter: blur(10px);
            z-index: 1500;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        
        document.body.appendChild(panel);
        return panel;
    }
    
    /**
     * タイムライン編集ボタンを作成
     */
    createTimelineEditButton() {
        const button = document.createElement('button');
        button.textContent = '🎬 タイムライン編集';
        button.className = 'timeline-edit-btn';
        button.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: bold;
            transition: all 0.3s;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        
        // ホバーエフェクト
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        });
        
        // クリックイベント
        button.addEventListener('click', () => {
            this.toggleTimelineEditMode();
        });
        
        return button;
    }
    
    /**
     * タイムライン編集モードを切り替え
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
        console.log('🎬 タイムライン編集モードに切り替え');
        
        // 既存の編集モードを一時停止
        this.pauseExistingEditMode();
        
        // タイムライン編集UIを表示
        this.showTimelineEditor();
        
        // 状態更新
        this.isTimelineMode = true;
        this.updateButtonState();
        
        // 統合通知
        this.notifyModeChange('timeline');
    }
    
    /**
     * タイムライン編集モードから退出
     */
    exitTimelineEditMode() {
        console.log('⬅️ タイムライン編集モードを終了');
        
        // タイムライン編集UIを非表示
        this.hideTimelineEditor();
        
        // 既存の編集モードを復元
        this.resumeExistingEditMode();
        
        // 状態更新
        this.isTimelineMode = false;
        this.updateButtonState();
        
        // 統合通知
        this.notifyModeChange('standard');
    }
    
    /**
     * 既存編集モードを一時停止
     */
    pauseExistingEditMode() {
        // 既存の編集ハンドルや機能を一時的に無効化
        const editHandles = document.querySelectorAll('.edit-handle, .resize-handle');
        editHandles.forEach(handle => {
            handle.style.display = 'none';
        });
        
        // 既存編集ボタンを無効化
        const editButtons = document.querySelectorAll('.edit-btn:not(.timeline-edit-btn)');
        this.originalEditButtons = Array.from(editButtons).map(btn => ({
            element: btn,
            disabled: btn.disabled
        }));
        
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
        if (this.originalEditButtons) {
            this.originalEditButtons.forEach(btnData => {
                btnData.element.disabled = btnData.disabled;
                btnData.element.style.opacity = '';
            });
            this.originalEditButtons = null;
        }
        
        console.log('▶️ 既存編集モードを復元');
    }
    
    /**
     * タイムライン編集UIを表示
     */
    showTimelineEditor() {
        if (!this.timelineEditor) {
            if (typeof TimelineEditorUI === 'undefined') {
                console.error('❌ TimelineEditorUI が読み込まれていません');
                return;
            }
            
            this.timelineEditor = new TimelineEditorUI({
                mode: 'integrated',
                maxTime: 15,
                onTimelineChange: this.onTimelineChange.bind(this),
                onKeyframeEdit: this.onKeyframeEdit.bind(this)
            });
        }
        
        this.timelineEditor.show();
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
                button.textContent = '⬅️ 通常編集に戻る';
                button.style.background = 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
            } else {
                button.textContent = '🎬 タイムライン編集';
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
        
        console.log('🗑️ Timeline Edit Integration 破棄完了');
    }
}

// 自動初期化（編集モード時）
document.addEventListener('DOMContentLoaded', () => {
    // URLパラメータで編集モードかチェック
    const urlParams = new URLSearchParams(window.location.search);
    const isEditMode = urlParams.get('edit') === 'true';
    
    if (isEditMode) {
        // 既存システムの読み込み完了を待つ
        setTimeout(() => {
            const integration = new TimelineEditIntegration();
            if (integration.init()) {
                window.timelineEditIntegration = integration;
                console.log('🎬 タイムライン編集統合システム自動起動完了');
            }
        }, 1000); // 1秒後に初期化
    }
});

// グローバルに公開
window.TimelineEditIntegration = TimelineEditIntegration;

console.log('✅ Timeline Edit Integration モジュール読み込み完了');