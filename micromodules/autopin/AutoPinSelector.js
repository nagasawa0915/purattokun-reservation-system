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
            minElementSize: 10,  // 見出し、段落、テキスト要素も選択可能に（極小装飾要素のみ除外）
            pinAnimationDuration: 1500  // ピンアニメーション表示時間（ms）
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
        
        // クリック位置を保存（テキスト要素とリスト要素で使用）
        this.clickPosition = {
            offsetX: e.offsetX,
            offsetY: e.offsetY,
            clientX: e.clientX,
            clientY: e.clientY
        };
        
        // 要素別最適化UIを表示
        this._showElementOptimizedUI(element, options, resolve, reject);
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
     * ピンアニメーション表示（テキスト要素用）
     * @param {number} x - 画面上のX座標
     * @param {number} y - 画面上のY座標
     * @private
     */
    _showPinAnimation(x, y) {
        const pinIcon = document.createElement('div');
        pinIcon.innerHTML = '📌';
        pinIcon.style.cssText = `
            position: fixed;
            left: ${x - 12}px;
            top: ${y - 24}px;
            font-size: 24px;
            z-index: ${this.config.zIndex + 10};
            pointer-events: none;
            user-select: none;
            transform-origin: center bottom;
            animation: pinAnimation ${this.config.pinAnimationDuration}ms ease-out;
        `;
        
        // CSSアニメーションを追加
        if (!document.getElementById('pin-animation-styles')) {
            const styles = document.createElement('style');
            styles.id = 'pin-animation-styles';
            styles.textContent = `
                @keyframes pinAnimation {
                    0% { 
                        transform: scale(0) rotate(-45deg);
                        opacity: 0;
                    }
                    20% { 
                        transform: scale(1.2) rotate(0deg);
                        opacity: 1;
                    }
                    60% { 
                        transform: scale(1) rotate(0deg);
                        opacity: 1;
                    }
                    100% { 
                        transform: scale(1) rotate(0deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(pinIcon);
        
        // アニメーション終了後に削除
        setTimeout(() => {
            if (pinIcon.parentNode) {
                pinIcon.parentNode.removeChild(pinIcon);
            }
        }, this.config.pinAnimationDuration);
        
        console.log('📌 Pin animation shown at:', { x, y });
    }
    
    /**
     * リスト要素のクリック位置検出（マーカー/テキスト判定）
     * @param {HTMLElement} element - リスト要素
     * @returns {string} 'marker' | 'text-start' | 'text-end'
     * @private
     */
    _detectListClickPosition(element) {
        const rect = element.getBoundingClientRect();
        const clickX = this.clickPosition.offsetX;
        const elementWidth = rect.width;
        
        // 左端20%以内はマーカー、それ以外はテキスト
        if (clickX < elementWidth * 0.2) {
            return 'marker';
        } else if (clickX > elementWidth * 0.8) {
            return 'text-end';
        } else {
            return 'text-start';
        }
    }
    
    /**
     * テキスト要素用イベントハンドラー設定
     * @param {HTMLElement} dialog - ダイアログ要素
     * @param {HTMLElement} element - 選択された要素
     * @param {Object} options - 選択設定
     * @param {Function} resolve - Promise resolve
     * @param {Function} reject - Promise reject
     * @private
     */
    _setupTextElementHandlers(dialog, element, options, resolve, reject) {
        const confirmBtn = dialog.querySelector('#confirm-btn');
        const cancelBtn = dialog.querySelector('#cancel-btn');
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // テキスト要素はクリック位置を使用
                const settings = {
                    anchorKind: 'click-position',
                    clickPosition: this.clickPosition,
                    scaleMode: dialog.querySelector('input[name="scaleMode"]:checked')?.value || 'typography'
                };
                
                console.log('✅ テキスト要素設定確定:', { element: element.tagName, settings });
                
                // PinContract生成
                const contract = this._createElementOptimizedContract(element, options, settings);
                
                this._removeDialog();
                this._completeSelection(contract, resolve);
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('❌ テキスト要素設定キャンセル');
                
                this._removeDialog();
                this._cancelSelection(reject);
            });
        }
    }
    
    /**
     * 要素別最適化UI表示
     * @param {HTMLElement} element - 選択された要素
     * @param {Object} options - 選択設定
     * @param {Function} resolve - Promise resolve
     * @param {Function} reject - Promise reject
     * @private
     */
    _showElementOptimizedUI(element, options, resolve, reject) {
        const elementType = this._detectElementType(element);
        
        switch (elementType) {
            case 'image':
                this._createImageElementDialog(element, options, resolve, reject);
                break;
            case 'text':
                this._createTextElementDialog(element, options, resolve, reject);
                break;
            case 'list':
                this._createListElementDialog(element, options, resolve, reject);
                break;
            default:
                this._createGenericElementDialog(element, options, resolve, reject);
                break;
        }
    }
    
    /**
     * 要素タイプ検出
     * @param {HTMLElement} element - 検出対象要素
     * @returns {string} 'image'|'text'|'list'|'generic'
     * @private
     */
    _detectElementType(element) {
        const tagName = element.tagName.toLowerCase();
        
        // 画像要素
        if (tagName === 'img') {
            return 'image';
        }
        
        // リスト要素
        if (tagName === 'li') {
            return 'list';
        }
        
        // テキスト要素
        const textTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span'];
        if (textTags.includes(tagName)) {
            return 'text';
        }
        
        // DIV・BUTTONなどの汎用要素 - 内容に応じて判定
        if (tagName === 'div' || tagName === 'button' || tagName === 'section') {
            // テキスト含有チェック
            if (element.textContent.trim().length > 0) {
                // 画像も含有している場合
                if (element.querySelector('img')) {
                    return 'generic'; // 混在 → 汎用UI
                }
                return 'text'; // テキストのみ
            }
            // 画像含有チェック
            if (element.querySelector('img')) {
                return 'image';
            }
        }
        
        return 'generic';
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
     * テキスト要素専用ダイアログ作成（クリック位置使用）
     * @param {HTMLElement} element - 対象要素
     * @param {Object} options - 選択設定
     * @param {Function} resolve - Promise resolve
     * @param {Function} reject - Promise reject
     * @private
     */
    _createTextElementDialog(element, options, resolve, reject) {
        // クリック位置にピンアニメーションを表示
        this._showPinAnimation(this.clickPosition.clientX, this.clickPosition.clientY);
        
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
        
        const textContent = element.textContent || '';
        const truncatedText = textContent.length > 30 ? textContent.substring(0, 30) + '...' : textContent;
        
        dialog.innerHTML = `
            <h3 style="margin-top:0;">📝 テキスト要素選択完了</h3>
            <p><strong>選択要素:</strong> ${element.tagName}${element.id ? '#' + element.id : ''}</p>
            <p style="font-size: 0.9em; color: #666;">「${truncatedText}」</p>
            
            <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <div style="font-size: 1.1em; margin-bottom: 8px;">📌 クリック位置で自動配置</div>
                <div style="font-size: 0.9em; color: #666;">
                    配置位置: クリック位置 (${this.clickPosition.offsetX}, ${this.clickPosition.offsetY})
                </div>
            </div>
            
            <details style="margin: 15px 0;">
                <summary style="cursor: pointer; font-weight: bold; margin-bottom: 10px;">⚙️ 詳細設定</summary>
                <div style="margin: 10px 0;">
                    <h4>サイズ連動:</h4>
                    <label style="display: block; margin: 8px 0;"><input type="radio" name="scaleMode" value="typography" checked> 🔤 フォントサイズ連動</label>
                    <label style="display: block; margin: 8px 0;"><input type="radio" name="scaleMode" value="element-linked"> 🔗 要素サイズ連動</label>
                    <label style="display: block; margin: 8px 0;"><input type="radio" name="scaleMode" value="fixed-size"> 📏 固定サイズ</label>
                </div>
            </details>
            
            <div style="text-align: right; margin-top: 20px;">
                <button id="cancel-btn" style="margin-right: 10px; padding: 8px 16px;">キャンセル</button>
                <button id="confirm-btn" style="padding: 8px 16px; background: #007acc; color: white; border: none; border-radius: 4px;">確定</button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        this.selectionDialog = dialog;
        
        // イベントハンドラー設定
        this._setupTextElementHandlers(dialog, element, options, resolve, reject);
    }
    
    /**
     * 画像要素専用ダイアログ作成（シンプル選択）
     * @param {HTMLElement} element - 対象要素
     * @param {Object} options - 選択設定
     * @param {Function} resolve - Promise resolve
     * @param {Function} reject - Promise reject
     * @private
     */
    _createImageElementDialog(element, options, resolve, reject) {
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
        
        const imageSrc = element.src ? element.src.substring(element.src.lastIndexOf('/') + 1) : '(画像なし)';
        
        dialog.innerHTML = `
            <h3 style="margin-top:0;">🖼️ 画像要素選択完了</h3>
            <p><strong>選択要素:</strong> ${element.tagName}${element.id ? '#' + element.id : ''}</p>
            <p style="font-size: 0.9em; color: #666;">画像: ${imageSrc}</p>
            
            <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <div style="font-size: 1.1em; margin-bottom: 8px;">🖼️ 画像中央で自動配置</div>
                <div style="font-size: 0.9em; color: #666;">
                    画像要素の中心を基準に配置されます
                </div>
            </div>
            
            <details style="margin: 15px 0;">
                <summary style="cursor: pointer; font-weight: bold; margin-bottom: 10px;">⚙️ 詳細設定</summary>
                <div style="margin: 10px 0;">
                    <h4>サイズ連動:</h4>
                    <label style="display: block; margin: 8px 0;"><input type="radio" name="scaleMode" value="element-linked" checked> 🔗 画像サイズ連動</label>
                    <label style="display: block; margin: 8px 0;"><input type="radio" name="scaleMode" value="fixed-size"> 📏 固定サイズ</label>
                </div>
            </details>
            
            <div style="text-align: right; margin-top: 20px;">
                <button id="cancel-btn" style="margin-right: 10px; padding: 8px 16px;">キャンセル</button>
                <button id="confirm-btn" style="padding: 8px 16px; background: #007acc; color: white; border: none; border-radius: 4px;">確定</button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        this.selectionDialog = dialog;
        
        // イベントハンドラー設定
        this._setupDialogEventHandlers(dialog, element, options, resolve, reject);
    }
    
    /**
     * リスト要素専用ダイアログ作成（クリック位置検出）
     * @param {HTMLElement} element - 対象要素
     * @param {Object} options - 選択設定
     * @param {Function} resolve - Promise resolve
     * @param {Function} reject - Promise reject
     * @private
     */
    _createListElementDialog(element, options, resolve, reject) {
        // クリック位置からマーカー/テキスト判定
        const detectedPosition = this._detectListClickPosition(element);
        
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
        
        const textContent = element.textContent || '';
        const truncatedText = textContent.length > 30 ? textContent.substring(0, 30) + '...' : textContent;
        
        dialog.innerHTML = `
            <h3 style="margin-top:0;">📋 リスト要素選択完了</h3>
            <p><strong>選択要素:</strong> ${element.tagName}${element.id ? '#' + element.id : ''}</p>
            <p style="font-size: 0.9em; color: #666;">「${truncatedText}」</p>
            
            <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <div style="font-size: 1.1em; margin-bottom: 8px;">🎯 ${detectedPosition === 'marker' ? 'マーカー位置' : 'テキスト位置'}で自動配置</div>
                <div style="font-size: 0.9em; color: #666;">
                    クリック位置: (${this.clickPosition.offsetX}, ${this.clickPosition.offsetY}) → ${detectedPosition === 'marker' ? 'マーカー' : 'テキスト'}エリア
                </div>
            </div>
            
            <details style="margin: 15px 0;">
                <summary style="cursor: pointer; font-weight: bold; margin-bottom: 10px;">⚙️ 詳細設定</summary>
                <div style="margin: 10px 0;">
                    <h4>配置位置を変更:</h4>
                    <label style="display: block; margin: 8px 0;"><input type="radio" name="textPosition" value="marker" ${detectedPosition === 'marker' ? 'checked' : ''}> 🎯 マーカー位置（• 1.）</label>
                    <label style="display: block; margin: 8px 0;"><input type="radio" name="textPosition" value="text-start" ${detectedPosition === 'text-start' ? 'checked' : ''}> 📍 テキスト先頭</label>
                    <label style="display: block; margin: 8px 0;"><input type="radio" name="textPosition" value="text-end" ${detectedPosition === 'text-end' ? 'checked' : ''}> 📍 テキスト末尾</label>
                </div>
                <div style="margin: 10px 0;">
                    <h4>サイズ連動:</h4>
                    <label style="display: block; margin: 8px 0;"><input type="radio" name="scaleMode" value="typography" checked> 🔤 フォントサイズ連動</label>
                    <label style="display: block; margin: 8px 0;"><input type="radio" name="scaleMode" value="fixed-size"> 📏 固定サイズ</label>
                </div>
            </details>
            
            <div style="text-align: right; margin-top: 20px;">
                <button id="cancel-btn" style="margin-right: 10px; padding: 8px 16px;">キャンセル</button>
                <button id="confirm-btn" style="padding: 8px 16px; background: #007acc; color: white; border: none; border-radius: 4px;">確定</button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        this.selectionDialog = dialog;
        
        // イベントハンドラー設定
        this._setupDialogEventHandlers(dialog, element, options, resolve, reject);
    }
    
    /**
     * 汎用要素ダイアログ作成（中央基準 + オプション）
     * @param {HTMLElement} element - 対象要素
     * @param {Object} options - 選択設定
     * @param {Function} resolve - Promise resolve
     * @param {Function} reject - Promise reject
     * @private
     */
    _createGenericElementDialog(element, options, resolve, reject) {
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
        
        const hasText = (element.textContent || '').trim().length > 0;
        const hasImage = element.querySelector('img') !== null;
        const contentType = hasImage && hasText ? '画像+テキスト' : hasText ? 'テキスト' : hasImage ? '画像' : 'その他';
        
        dialog.innerHTML = `
            <h3 style="margin-top:0;">⚙️ 汎用要素選択完了</h3>
            <p><strong>選択要素:</strong> ${element.tagName}${element.id ? '#' + element.id : ''}</p>
            <p style="font-size: 0.9em; color: #666;">内容: ${contentType}</p>
            
            <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <div style="font-size: 1.1em; margin-bottom: 8px;">📦 要素中央で自動配置</div>
                <div style="font-size: 0.9em; color: #666;">
                    要素の中心を基準に配置されます
                </div>
            </div>
            
            <details style="margin: 15px 0;">
                <summary style="cursor: pointer; font-weight: bold; margin-bottom: 10px;">⚙️ 詳細設定</summary>
                <div style="margin: 10px 0;">
                    <h4>配置方式:</h4>
                    <label style="display: block; margin: 8px 0;"><input type="radio" name="anchorKind" value="block" checked> 📦 要素全体（Block）</label>
                    ${hasText ? '<label style="display: block; margin: 8px 0;"><input type="radio" name="anchorKind" value="text-end"> 📝 テキスト末尾</label>' : ''}
                </div>
                <div style="margin: 10px 0;">
                    <h4>サイズ連動:</h4>
                    <label style="display: block; margin: 8px 0;"><input type="radio" name="scaleMode" value="element-linked" checked> 🔗 要素サイズ連動</label>
                    <label style="display: block; margin: 8px 0;"><input type="radio" name="scaleMode" value="fixed-size"> 📏 固定サイズ</label>
                    ${hasText ? '<label style="display: block; margin: 8px 0;"><input type="radio" name="scaleMode" value="typography"> 🔤 フォントサイズ連動</label>' : ''}
                </div>
            </details>
            
            <div style="text-align: right; margin-top: 20px;">
                <button id="cancel-btn" style="margin-right: 10px; padding: 8px 16px;">キャンセル</button>
                <button id="confirm-btn" style="padding: 8px 16px; background: #007acc; color: white; border: none; border-radius: 4px;">確定</button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        this.selectionDialog = dialog;
        
        // イベントハンドラー設定
        this._setupDialogEventHandlers(dialog, element, options, resolve, reject);
    }
    
    /**
     * ダイアログ共通イベントハンドラー設定
     * @param {HTMLElement} dialog - ダイアログ要素
     * @param {HTMLElement} element - 選択された要素
     * @param {Object} options - 選択設定
     * @param {Function} resolve - Promise resolve
     * @param {Function} reject - Promise reject
     * @private
     */
    _setupDialogEventHandlers(dialog, element, options, resolve, reject) {
        const confirmBtn = dialog.querySelector('#confirm-btn');
        const cancelBtn = dialog.querySelector('#cancel-btn');
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // 選択された設定を収集
                const settings = this._collectDialogSettings(dialog);
                
                console.log('✅ 要素別UI設定確定:', { element: element.tagName, settings });
                
                // PinContract生成
                const contract = this._createElementOptimizedContract(element, options, settings);
                
                this._removeDialog();
                this._completeSelection(contract, resolve);
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('❌ 要素別UI設定キャンセル');
                
                this._removeDialog();
                this._cancelSelection(reject);
            });
        }
    }
    
    /**
     * ダイアログ設定収集
     * @param {HTMLElement} dialog - ダイアログ要素
     * @returns {Object} 収集された設定
     * @private
     */
    _collectDialogSettings(dialog) {
        const settings = {};
        
        // テキスト位置選択
        const textPosition = dialog.querySelector('input[name="textPosition"]:checked');
        if (textPosition) {
            settings.anchorKind = textPosition.value;
        }
        
        // 9アンカー選択
        const anchor = dialog.querySelector('input[name="anchor"]:checked');
        if (anchor) {
            settings.align = anchor.value;
        }
        
        // スケールモード選択
        const scaleMode = dialog.querySelector('input[name="scaleMode"]:checked');
        if (scaleMode) {
            settings.scaleMode = scaleMode.value;
        }
        
        // 汎用：配置方式
        const anchorKind = dialog.querySelector('input[name="anchorKind"]:checked');
        if (anchorKind) {
            settings.anchorKind = anchorKind.value;
        }
        
        return settings;
    }
    
    /**
     * 要素別最適化PinContract生成
     * @param {HTMLElement} element - 基準要素
     * @param {Object} options - 基本設定
     * @param {Object} settings - UI設定
     * @returns {PinContract} 生成されたContract
     * @private
     */
    _createElementOptimizedContract(element, options, settings) {
        const contract = {
            refElement: element,
            logicalSize: options.logicalSize,
            anchorKind: settings.anchorKind || 'block',
            align: settings.align || 'CC',  // デフォルト中央
            fit: options.fit,
            objectPosition: options.objectPosition || '50% 50%',
            scaleMode: settings.scaleMode || 'element-linked',
            baseFontPx: options.baseFontPx || 16
        };
        
        // クリック位置情報を追加（テキスト・リスト要素）
        if (settings.clickPosition) {
            contract.clickPosition = settings.clickPosition;
        }
        
        // 固定サイズ設定
        if (settings.scaleMode === 'fixed-size') {
            contract.fixedSize = { width: options.width || 100, height: options.height || 100 };
        }
        
        return contract;
    }
    
    /**
     * アンカー選択ダイアログ作成（従来互換用）
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