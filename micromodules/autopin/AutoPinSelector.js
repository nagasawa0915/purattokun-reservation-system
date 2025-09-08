/**
 * AutoPinSelector.js - 選択UI特化版
 * 
 * 既存710行のPureBoundingBoxAutoPinから選択機能のみを抽出・軽量化
 * 責務: 要素選択・9アンカー選択・PinContract生成のみ
 * 目標: 200行以内（既存から70%削減）
 * 
 * 仕様書準拠の選択対象:
 * ✅ 見出し要素（h1-h6）: 「見出しH2の右肩」
 * ✅ 段落要素（p）: 「段落末尾追従」  
 * ✅ テキスト要素（span等）: 「基準要素（span等）」
 * ✅ 画像・div要素: 「基準要素（img/div等）」
 * ❌ 極小装飾要素（1-5px）のみ除外
 */

// import { AlignAnchor, AnchorKind, PinContract } from '../observer/types.ts';
// TypeScript型定義はJSDocコメントで代替

/**
 * AutoPin選択UI特化版
 * - 数値保存なし: px値・比率は保存せずContract情報のみ
 * - 軽量化: UI選択機能に特化・複雑計算はObserver側に移譲
 */
export class AutoPinSelector {
    constructor() {
        this.isSelecting = false;
        this.selectedElement = null;
        this.currentContract = null;
        
        // UI状態
        this.highlightOverlay = null;
        this.selectionDialog = null;
        this.anchorSelector = null;
        
        // 設定
        this.config = {
            highlightColor: '#007acc',
            zIndex: 10000,
            minElementSize: 10  // 見出し、段落、テキスト要素も選択可能に（極小装飾要素のみ除外）
        };
        
        this._initializeUI();
        console.log('🎯 AutoPinSelector initialized (lightweight version)');
    }
    
    /**
     * 要素選択モード開始
     * @param {Object} options - 選択オプション
     * @returns {Promise<PinContract>} 選択完了時にContract返却
     */
    async selectElement(options = {}) {
        if (this.isSelecting) {
            throw new Error('Selection already in progress');
        }
        
        this.isSelecting = true;
        
        const defaultOptions = {
            logicalSize: { w: 600, h: 400 },
            anchorKind: 'block',
            fit: 'contain',
            scaleMode: 'container'
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        return new Promise((resolve, reject) => {
            this._startElementSelection(finalOptions, resolve, reject);
        });
    }
    
    /**
     * 要素選択開始（内部実装）
     * @param {Object} options - 選択設定
     * @param {Function} resolve - Promise resolve
     * @param {Function} reject - Promise reject
     * @private
     */
    _startElementSelection(options, resolve, reject) {
        // ドキュメントレベルのイベントリスナー設定
        const mouseOverHandler = (e) => this._handleMouseOver(e);
        const clickHandler = (e) => this._handleElementClick(e, options, resolve, reject);
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this._cancelSelection(reject);
            }
        };
        
        document.addEventListener('mouseover', mouseOverHandler);
        document.addEventListener('click', clickHandler, true); // useCapture
        document.addEventListener('keydown', escapeHandler);
        
        // cleanup function
        this.cleanupSelection = () => {
            document.removeEventListener('mouseover', mouseOverHandler);
            document.removeEventListener('click', clickHandler, true);
            document.removeEventListener('keydown', escapeHandler);
            this._hideHighlight();
            this.isSelecting = false;
        };
        
        console.log('🎯 Element selection started. Click on target element or press Escape to cancel.');
    }
    
    /**
     * マウスオーバー処理 - 要素ハイライト
     * @param {MouseEvent} e - マウスイベント
     * @private
     */
    _handleMouseOver(e) {
        if (!this.isSelecting) return;
        
        const element = e.target;
        
        // 最小サイズチェック
        if (!this._isValidElement(element)) {
            this._hideHighlight();
            return;
        }
        
        this._showHighlight(element);
    }
    
    /**
     * 要素クリック処理 - 選択確定
     * @param {MouseEvent} e - クリックイベント
     * @param {Object} options - 選択設定
     * @param {Function} resolve - Promise resolve
     * @param {Function} reject - Promise reject
     * @private
     */
    _handleElementClick(e, options, resolve, reject) {
        const element = e.target;
        
        // ダイアログが表示中の場合はハンドリングしない（ダイアログのボタンクリックを妨げない）
        if (this.selectionDialog) {
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        if (!this._isValidElement(element)) {
            const rect = element.getBoundingClientRect();
            console.warn('⚠️ Selected element is too small or invalid:', {
                element: element,
                size: `${rect.width}x${rect.height}`,
                minSize: this.config.minElementSize,
                isUIElement: this._isUIElement(element)
            });
            return;
        }
        
        this.selectedElement = element;
        this._hideHighlight();
        
        // アンカー選択UIを表示
        this._showAnchorSelector(element, options, resolve, reject);
    }
    
    /**
     * 要素バリデーション
     * @param {HTMLElement} element - チェック対象要素
     * @returns {boolean} 有効な要素か
     * @private
     */
    _isValidElement(element) {
        if (!element || element === document.body || element === document.documentElement) {
            return false;
        }
        
        // ダイアログ・UI要素を除外
        if (this._isUIElement(element)) {
            return false;
        }
        
        const rect = element.getBoundingClientRect();
        // 見出し（h1-h6）、段落（p）、テキスト（span）、画像（img）、div等も選択可能に
        // 極小装飾要素（1-5px）のみ除外
        return rect.width >= this.config.minElementSize && rect.height >= this.config.minElementSize;
    }
    
    /**
     * UI要素（ダイアログ等）かどうか判定
     * @param {HTMLElement} element - チェック対象要素
     * @returns {boolean} UI要素か
     * @private
     */
    _isUIElement(element) {
        // ハイライトオーバーレイ
        if (element === this.highlightOverlay) {
            return true;
        }
        
        // 選択ダイアログまたはその子要素（選択中のみ除外）
        if (this.selectionDialog && this.isSelecting && (element === this.selectionDialog || this.selectionDialog.contains(element))) {
            return true;
        }
        
        // 高いz-indexを持つ要素（UI要素の可能性が高い）
        const computedStyle = getComputedStyle(element);
        const zIndex = parseInt(computedStyle.zIndex);
        if (zIndex >= this.config.zIndex && zIndex !== this.config.zIndex + 1) {  // ダイアログ自体は除外しない
            return true;
        }
        
        return false;
    }
    
    /**
     * 要素ハイライト表示
     * @param {HTMLElement} element - ハイライト対象
     * @private
     */
    _showHighlight(element) {
        if (!this.highlightOverlay) {
            this._createHighlightOverlay();
        }
        
        const rect = element.getBoundingClientRect();
        const overlay = this.highlightOverlay;
        
        overlay.style.left = rect.left + 'px';
        overlay.style.top = rect.top + 'px';
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';
        overlay.style.display = 'block';
    }
    
    /**
     * ハイライト非表示
     * @private
     */
    _hideHighlight() {
        if (this.highlightOverlay) {
            this.highlightOverlay.style.display = 'none';
        }
    }
    
    /**
     * アンカー選択UI表示
     * @param {HTMLElement} element - 選択された要素
     * @param {Object} options - 選択設定
     * @param {Function} resolve - Promise resolve
     * @param {Function} reject - Promise reject
     * @private
     */
    _showAnchorSelector(element, options, resolve, reject) {
        this._createAnchorSelectorDialog(element, (selectedAlign, selectedAnchorKind) => {
            // PinContract生成
            const contract = this._createContract(element, options, selectedAlign, selectedAnchorKind);
            
            this._completeSelection(contract, resolve);
        }, reject);
    }
    
    /**
     * PinContract生成
     * @param {HTMLElement} element - 基準要素
     * @param {Object} options - 基本設定
     * @param {AlignAnchor} align - 9アンカー選択結果
     * @param {AnchorKind} anchorKind - アンカー種類
     * @returns {PinContract} 生成されたContract
     * @private
     */
    _createContract(element, options, align, anchorKind) {
        return {
            refElement: element,
            logicalSize: options.logicalSize,
            anchorKind: anchorKind || options.anchorKind,
            align: align,
            fit: options.fit,
            objectPosition: options.objectPosition || '50% 50%',
            scaleMode: options.scaleMode,
            baseFontPx: options.baseFontPx || 16
        };
    }
    
    /**
     * UI初期化
     * @private
     */
    _initializeUI() {
        // ハイライトオーバーレイ作成は遅延実行
        this.highlightOverlay = null;
    }
    
    /**
     * ハイライトオーバーレイ作成
     * @private
     */
    _createHighlightOverlay() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            pointer-events: none;
            border: 2px solid ${this.config.highlightColor};
            background: ${this.config.highlightColor}20;
            z-index: ${this.config.zIndex};
            display: none;
            transition: all 0.1s ease;
        `;
        
        document.body.appendChild(overlay);
        this.highlightOverlay = overlay;
    }
    
    /**
     * アンカー選択ダイアログ作成
     * @param {HTMLElement} element - 対象要素
     * @param {Function} onConfirm - 確定コールバック
     * @param {Function} onCancel - キャンセルコールバック
     * @private
     */
    _createAnchorSelectorDialog(element, onConfirm, onCancel) {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 20px;
            z-index: ${this.config.zIndex + 1};
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-family: Arial, sans-serif;
            max-width: 400px;
        `;
        
        dialog.innerHTML = `
            <h3 style="margin-top:0;">📍 Anchor Selection</h3>
            <p><strong>Selected:</strong> ${element.tagName}${element.id ? '#' + element.id : ''}</p>
            
            <div style="margin: 15px 0;">
                <h4>9-Point Anchor:</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; max-width: 200px;">
                    ${this._create9AnchorGrid()}
                </div>
            </div>
            
            <div style="margin: 15px 0;">
                <h4>Anchor Kind:</h4>
                <label style="margin-right: 15px;"><input type="radio" name="anchorKind" value="block" checked> Block</label>
                <label style="margin-right: 15px;"><input type="radio" name="anchorKind" value="inline-end"> Text End</label>
                <label><input type="radio" name="anchorKind" value="marker"> Marker</label>
            </div>
            
            <div style="text-align: right; margin-top: 20px;">
                <button id="cancel-btn" style="margin-right: 10px; padding: 8px 16px;">Cancel</button>
                <button id="confirm-btn" style="padding: 8px 16px; background: #007acc; color: white; border: none; border-radius: 4px;">Confirm</button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        this.selectionDialog = dialog;
        
        // イベントハンドラー設定
        const confirmBtn = dialog.querySelector('#confirm-btn');
        const cancelBtn = dialog.querySelector('#cancel-btn');
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const selectedAlign = dialog.querySelector('input[name="anchor"]:checked')?.value || 'CC';
                const selectedAnchorKind = dialog.querySelector('input[name="anchorKind"]:checked')?.value || 'block';
                
                console.log('✅ Confirm clicked:', { selectedAlign, selectedAnchorKind });
                
                this._removeDialog();
                onConfirm(selectedAlign, selectedAnchorKind);
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('❌ Cancel clicked');
                
                this._removeDialog();
                this._cancelSelection(onCancel);
            });
        }
        
        // デバッグ情報
        console.log('🎯 Dialog created with buttons:', { confirmBtn, cancelBtn });
    }
    
    /**
     * 9アンカーグリッド作成
     * @returns {string} HTML string
     * @private
     */
    _create9AnchorGrid() {
        const anchors = [
            'LT', 'TC', 'RT',
            'LC', 'CC', 'RC', 
            'LB', 'BC', 'RB'
        ];
        
        return anchors.map(anchor => 
            `<label style="text-align: center; padding: 8px; border: 1px solid #ccc; cursor: pointer;">
                <input type="radio" name="anchor" value="${anchor}" ${anchor === 'CC' ? 'checked' : ''} style="display: block; margin: 0 auto 4px;">
                <small>${anchor}</small>
            </label>`
        ).join('');
    }
    
    /**
     * 選択完了処理
     * @param {PinContract} contract - 生成されたContract
     * @param {Function} resolve - Promise resolve
     * @private
     */
    _completeSelection(contract, resolve) {
        this.currentContract = contract;
        this.cleanupSelection();
        
        console.log('✅ Element selection completed:', contract);
        resolve(contract);
    }
    
    /**
     * 選択キャンセル処理
     * @param {Function} reject - Promise reject
     * @private
     */
    _cancelSelection(reject) {
        this.cleanupSelection();
        console.log('❌ Element selection cancelled');
        reject(new Error('Selection cancelled'));
    }
    
    /**
     * 現在のContractを取得
     * @returns {PinContract|null} 現在のContract
     */
    getCurrentContract() {
        return this.currentContract;
    }
    
    /**
     * ダイアログ削除処理
     * @private
     */
    _removeDialog() {
        if (this.selectionDialog && this.selectionDialog.parentNode) {
            this.selectionDialog.parentNode.removeChild(this.selectionDialog);
            this.selectionDialog = null;
        }
    }
    
    /**
     * リソース解放
     */
    destroy() {
        if (this.isSelecting) {
            this.cleanupSelection();
        }
        
        if (this.highlightOverlay && this.highlightOverlay.parentNode) {
            this.highlightOverlay.parentNode.removeChild(this.highlightOverlay);
            this.highlightOverlay = null;
        }
        
        this._removeDialog();
        
        console.log('🗑️ AutoPinSelector destroyed');
    }
}