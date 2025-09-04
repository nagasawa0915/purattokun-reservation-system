/**
 * ElementSelector.js
 * 
 * 🎯 要素選択・確定処理システム
 * - PureBoundingBox 2段階ピン設定システム Stage 1後半
 * - 責務: 選択要素の確認・検証・Stage 2への橋渡し
 * - 外部依存: ElementHighlighter (連携)
 */

class ElementSelector {
    constructor() {
        console.log('🎯 ElementSelector 初期化開始');
        
        // 状態管理
        this.selectedElement = null;
        this.isConfirming = false;
        this.onElementConfirmed = null;
        this.highlighter = null; // ElementHighlighterインスタンスの参照
        
        // UI要素
        this.confirmDialog = null;
        
        // 設定
        this.config = {
            zIndex: 10005,
            minElementSize: 20, // 最小要素サイズ（px）
            maxElements: 1      // 同時選択可能数
        };
        
        console.log('✅ ElementSelector 初期化完了');
    }
    
    /**
     * 🎯 要素選択確認開始
     */
    async selectElement(callback) {
        console.log('🎯 要素選択プロセス開始');
        
        this.onElementConfirmed = callback;
        
        return new Promise((resolve, reject) => {
            // ElementHighlighter初期化
            if (!window.ElementHighlighter) {
                reject(new Error('ElementHighlighter が見つかりません'));
                return;
            }
            
            this.highlighter = new window.ElementHighlighter();
            window.highlighterInstance = this.highlighter; // 🎯 グローバル参照を設定
            
            // ハイライトモード開始
            const success = this.highlighter.startHighlightMode((element) => {
                // 要素選択時のコールバック
                this.handleElementSelected(element, resolve, reject);
            });
            
            if (!success) {
                reject(new Error('ハイライトモード開始に失敗しました'));
                return;
            }
            
            console.log('✅ F12風要素選択モード アクティブ');
        });
    }
    
    /**
     * 要素選択時の処理
     */
    async handleElementSelected(element, resolve, reject) {
        console.log('🎯 要素選択検出:', this.getElementInfo(element));
        
        // 要素検証
        const validation = this.validateSelectedElement(element);
        if (!validation.isValid) {
            console.warn('⚠️ 選択要素が無効:', validation.reason);
            this.showValidationError(validation.reason);
            reject(new Error(`無効な要素: ${validation.reason}`));
            return;
        }
        
        this.selectedElement = element;
        
        // 確認ダイアログ表示
        try {
            const confirmed = await this.showConfirmationDialog(element);
            
            // ハイライトモード終了（確認ダイアログ処理完了後）
            if (this.highlighter) {
                this.highlighter.stopHighlightMode();
                window.highlighterInstance = null; // 🎯 グローバル参照をクリア
            }
            
            if (confirmed) {
                console.log('✅ 要素選択確定:', this.getElementInfo(element));
                
                // Stage 2へ進む
                if (this.onElementConfirmed) {
                    this.onElementConfirmed(element);
                }
                
                resolve(element);
            } else {
                console.log('🔄 要素選択をキャンセル');
                this.selectedElement = null;
                reject(new Error('ユーザーが選択をキャンセルしました'));
            }
        } catch (error) {
            console.error('❌ 確認ダイアログエラー:', error);
            // エラー時もハイライトモード終了
            if (this.highlighter) {
                this.highlighter.stopHighlightMode();
                window.highlighterInstance = null; // 🎯 グローバル参照をクリア
            }
            reject(error);
        }
    }
    
    /**
     * 選択要素の検証
     */
    validateSelectedElement(element) {
        if (!element) {
            return { isValid: false, reason: '要素が存在しません' };
        }
        
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        // サイズチェック
        if (rect.width < this.config.minElementSize || rect.height < this.config.minElementSize) {
            return { 
                isValid: false, 
                reason: `要素が小さすぎます (${Math.round(rect.width)}×${Math.round(rect.height)}px)` 
            };
        }
        
        // 表示状態チェック
        if (style.display === 'none') {
            return { isValid: false, reason: '非表示の要素です' };
        }
        
        if (style.visibility === 'hidden') {
            return { isValid: false, reason: '不可視の要素です' };
        }
        
        if (parseFloat(style.opacity) < 0.1) {
            return { isValid: false, reason: '透明度が低すぎます' };
        }
        
        // 特殊要素チェック
        const tagName = element.tagName.toLowerCase();
        const restrictedTags = ['html', 'head', 'body', 'script', 'style', 'meta', 'link'];
        
        if (restrictedTags.includes(tagName)) {
            return { isValid: false, reason: `${tagName}要素は選択できません` };
        }
        
        return { isValid: true };
    }
    
    /**
     * 確認ダイアログ表示
     */
    async showConfirmationDialog(element) {
        console.log('🎯 要素選択確認ダイアログ表示');
        
        return new Promise((resolve) => {
            this.isConfirming = true;
            const info = this.getElementInfo(element);
            
            // ダイアログHTML作成
            const dialogHTML = `
                <div id="element-selection-dialog" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    z-index: ${this.config.zIndex};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: Arial, sans-serif;
                ">
                    <div style="
                        background: white;
                        border-radius: 12px;
                        padding: 24px;
                        max-width: 500px;
                        width: 90%;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                        position: relative;
                    ">
                        <h3 style="
                            margin: 0 0 16px 0;
                            color: #333;
                            font-size: 18px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            📍 この要素にピンを設定しますか？
                        </h3>
                        
                        <div style="
                            background: #f8f9fa;
                            border: 1px solid #dee2e6;
                            border-radius: 8px;
                            padding: 16px;
                            margin-bottom: 20px;
                        ">
                            <div style="margin-bottom: 8px;">
                                <strong>要素情報:</strong>
                            </div>
                            <div style="font-family: monospace; font-size: 13px; line-height: 1.6;">
                                <div>タグ: &lt;${info.tagName.toLowerCase()}&gt;</div>
                                ${info.id ? `<div>ID: #${info.id}</div>` : ''}
                                ${info.className ? `<div>クラス: .${info.className.split(' ').join(', .')}</div>` : ''}
                                <div>サイズ: ${info.width}×${info.height}px</div>
                                ${info.hasBackground ? '<div style="color: #28a745;">✅ 背景あり</div>' : '<div style="color: #6c757d;">背景なし</div>'}
                            </div>
                            ${this.generateElementPreview(element)}
                        </div>
                        
                        <div style="
                            background: #e3f2fd;
                            border: 1px solid #2196f3;
                            border-radius: 6px;
                            padding: 12px;
                            margin-bottom: 20px;
                            font-size: 14px;
                        ">
                            <strong>🎯 次のステップ:</strong><br>
                            この要素を基準として、キャラクターの相対位置を微調整できます。
                        </div>
                        
                        <div style="
                            display: flex;
                            gap: 12px;
                            justify-content: flex-end;
                        ">
                            <button id="element-selection-cancel" style="
                                padding: 10px 20px;
                                border: 1px solid #ccc;
                                background: white;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 14px;
                            ">
                                🔄 再選択
                            </button>
                            <button id="element-selection-confirm" style="
                                padding: 10px 20px;
                                border: none;
                                background: #007bff;
                                color: white;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 14px;
                                font-weight: bold;
                            ">
                                ✅ この要素でOK
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // ダイアログを DOM に追加
            const dialogContainer = document.createElement('div');
            dialogContainer.innerHTML = dialogHTML;
            this.confirmDialog = dialogContainer.firstElementChild;
            document.body.appendChild(this.confirmDialog);
            
            // 選択要素のハイライト表示
            this.highlightSelectedElement(element);
            
            // ボタンイベント設定
            const confirmButton = document.getElementById('element-selection-confirm');
            const cancelButton = document.getElementById('element-selection-cancel');
            
            confirmButton.addEventListener('click', () => {
                this.closeConfirmationDialog();
                resolve(true);
            });
            
            cancelButton.addEventListener('click', () => {
                this.closeConfirmationDialog();
                resolve(false);
            });
            
            // ESCキーでキャンセル
            const handleKeyDown = (event) => {
                if (event.key === 'Escape') {
                    document.removeEventListener('keydown', handleKeyDown);
                    this.closeConfirmationDialog();
                    resolve(false);
                }
            };
            document.addEventListener('keydown', handleKeyDown);
        });
    }
    
    /**
     * 要素プレビュー生成
     */
    generateElementPreview(element) {
        const textContent = element.textContent?.trim();
        if (textContent && textContent.length > 0) {
            const preview = textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent;
            return `
                <div style="
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid #dee2e6;
                ">
                    <div style="font-size: 12px; color: #666; margin-bottom: 4px;">テキスト内容:</div>
                    <div style="
                        font-size: 13px;
                        color: #333;
                        font-style: italic;
                        line-height: 1.4;
                        max-height: 60px;
                        overflow-y: auto;
                    ">"${preview}"</div>
                </div>
            `;
        }
        return '';
    }
    
    /**
     * 選択要素のハイライト表示
     */
    highlightSelectedElement(element) {
        const rect = element.getBoundingClientRect();
        
        const highlight = document.createElement('div');
        highlight.id = 'selected-element-highlight';
        highlight.style.cssText = `
            position: fixed;
            left: ${rect.left}px;
            top: ${rect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            border: 3px solid #28a745;
            background: rgba(40, 167, 69, 0.1);
            pointer-events: none;
            z-index: ${this.config.zIndex - 1};
            animation: selected-pulse 2s infinite;
        `;
        
        // CSS アニメーション定義
        if (!document.getElementById('selected-element-animation')) {
            const style = document.createElement('style');
            style.id = 'selected-element-animation';
            style.textContent = `
                @keyframes selected-pulse {
                    0% { border-color: #28a745; background-color: rgba(40, 167, 69, 0.1); }
                    50% { border-color: #20c997; background-color: rgba(32, 201, 151, 0.2); }
                    100% { border-color: #28a745; background-color: rgba(40, 167, 69, 0.1); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(highlight);
    }
    
    /**
     * 確認ダイアログ閉じる
     */
    closeConfirmationDialog() {
        if (this.confirmDialog) {
            this.confirmDialog.remove();
            this.confirmDialog = null;
        }
        
        // 選択要素ハイライト削除
        const highlight = document.getElementById('selected-element-highlight');
        if (highlight) {
            highlight.remove();
        }
        
        this.isConfirming = false;
    }
    
    /**
     * 検証エラー表示
     */
    showValidationError(message) {
        const errorDialog = document.createElement('div');
        errorDialog.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 14px;
            z-index: ${this.config.zIndex + 1};
            box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
        `;
        errorDialog.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">❌ 選択できない要素です</div>
            <div>${message}</div>
        `;
        
        document.body.appendChild(errorDialog);
        
        // 3秒後に自動削除
        setTimeout(() => {
            errorDialog.remove();
        }, 3000);
    }
    
    /**
     * 要素情報取得
     */
    getElementInfo(element) {
        if (!element) return null;
        
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        
        return {
            tagName: element.tagName,
            id: element.id || null,
            className: element.className || null,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            hasBackground: computedStyle.backgroundImage !== 'none' || 
                          computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)',
            textContent: element.textContent?.trim() || null,
            element: element
        };
    }
    
    /**
     * 現在の選択状態取得
     */
    getSelectedElement() {
        return this.selectedElement;
    }
    
    /**
     * 選択状態リセット
     */
    resetSelection() {
        this.selectedElement = null;
        this.isConfirming = false;
        this.onElementConfirmed = null;
        
        // UI クリーンアップ
        this.closeConfirmationDialog();
        
        console.log('✅ ElementSelector 状態リセット完了');
    }
    
    /**
     * 現在の状態取得
     */
    getState() {
        return {
            hasSelection: !!this.selectedElement,
            isConfirming: this.isConfirming,
            selectedElement: this.selectedElement ? this.getElementInfo(this.selectedElement) : null
        };
    }
}

// グローバル公開
if (typeof window !== 'undefined') {
    window.ElementSelector = ElementSelector;
    console.log('✅ ElementSelector グローバル公開完了');
}

// AMD/CommonJS対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElementSelector;
}