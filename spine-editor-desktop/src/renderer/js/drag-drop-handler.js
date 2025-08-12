// 🎯 Spine Editor Desktop - Drag & Drop Handler Module
// ドラッグ&ドロップ・WYSIWYG・プレビュー機能

console.log('🎪 Drag & Drop Handler Module 読み込み');

/**
 * ドラッグ&ドロップハンドラークラス
 * 責任範囲:
 * - ドラッグ&ドロップイベント処理
 * - WYSIWYGプレビュー表示
 * - HTMLプレビューの読み込み
 * - ドロップゾーン管理
 */
class DragDropHandler {
    constructor(app) {
        this.app = app;
        console.log('✅ DragDropHandler 初期化完了');
    }

    // ========== ドロップゾーン設定 ========== //

    /**
     * プレビューエリアのドロップゾーンを設定
     */
    bindPreviewDropEvents() {
        const previewArea = document.querySelector('.preview-content');
        if (!previewArea) {
            console.warn('⚠️ プレビューエリアが見つかりません');
            return;
        }
        
        console.log('🎯 プレビューエリアドロップゾーン設定開始');
        
        // ドラッグオーバー
        previewArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            previewArea.style.background = 'rgba(0, 122, 204, 0.1)';
            console.log('🎯 ドラッグオーバー');
        });
        
        // ドラッグリーブ
        previewArea.addEventListener('dragleave', (e) => {
            if (!previewArea.contains(e.relatedTarget)) {
                previewArea.style.background = '';
                console.log('🎯 ドラッグリーブ');
            }
        });
        
        // ドロップ
        previewArea.addEventListener('drop', (e) => {
            e.preventDefault();
            previewArea.style.background = '';
            
            const characterData = e.dataTransfer.getData('application/spine-character');
            console.log('🎭 プレビューエリアドロップ:', characterData);
            
            if (characterData) {
                const data = JSON.parse(characterData);
                console.log('✅ キャラクターデータ解析完了:', data);
                
                // iframe内へのドロップ処理
                this.handleDirectPreviewDrop(data, e);
            }
        });
        
        console.log('✅ プレビューエリアドロップゾーン設定完了');
    }

    /**
     * 直接プレビュードロップを処理
     * @param {Object} draggedData - ドラッグされたデータ
     * @param {Event} event - ドロップイベント
     */
    handleDirectPreviewDrop(draggedData, event) {
        console.log('🎭 直接プレビュードロップ処理:', draggedData.name);
        
        // 完全なキャラクターデータを取得
        const fullCharacterData = this.app.state.characters.get(draggedData.id);
        if (!fullCharacterData) {
            console.error('❌ キャラクターデータが見つかりません:', draggedData.id);
            return;
        }
        
        console.log('📋 完全なキャラクターデータ取得（直接ドロップ）:', {
            name: fullCharacterData.name,
            pngFile: fullCharacterData.pngFile,
            spineFiles: fullCharacterData.spineFiles
        });
        
        // プレビューエリアの座標計算
        const rect = event.currentTarget.getBoundingClientRect();
        const position = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
        
        // キャラクター配置
        this.app.characterManager.addCharacterDirectly(fullCharacterData, position);
    }

    /**
     * キャラクタードロップ処理
     * @param {Object} draggedData - ドラッグされたデータ
     * @param {Event} event - ドロップイベント
     * @param {Document} doc - ドロップ先のドキュメント
     */
    handleCharacterDrop(draggedData, event, doc) {
        console.log('🎭 キャラクタードロップ:', draggedData.name, 'at', event.clientX, event.clientY);
        
        // 完全なキャラクターデータを取得
        const fullCharacterData = this.app.state.characters.get(draggedData.id);
        if (!fullCharacterData) {
            console.error('❌ キャラクターデータが見つかりません:', draggedData.id);
            return;
        }
        
        console.log('📋 完全なキャラクターデータ取得:', {
            name: fullCharacterData.name,
            pngFile: fullCharacterData.pngFile,
            spineFiles: fullCharacterData.spineFiles
        });
        
        // 直接プレビューに配置（SpineIntegration不要）
        const rect = event.currentTarget.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;
        this.app.characterManager.addCharacterDirectly(fullCharacterData, { x: offsetX, y: offsetY });
    }

    // ========== ドラッグ機能 ========== //

    /**
     * 要素をシンプルドラッグ可能にする
     * @param {HTMLElement} element - ドラッグ可能にする要素
     */
    makeElementDraggableSimple(element) {
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        
        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = element.getBoundingClientRect();
            const parentRect = element.parentElement.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            element.style.cursor = 'grabbing';
            element.style.opacity = '0.8';
            console.log('🎯 シンプルドラッグ開始');
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const parentRect = element.parentElement.getBoundingClientRect();
            const newX = e.clientX - parentRect.left - dragOffset.x;
            const newY = e.clientY - parentRect.top - dragOffset.y;
            
            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'move';
                element.style.opacity = '1';
                console.log('✅ シンプルドラッグ完了');
            }
        });
    }

    /**
     * アウトライナーのドラッグイベントを設定
     * @param {HTMLElement} charEl - キャラクター要素
     * @param {Object} character - キャラクターデータ
     * @param {string} id - キャラクターID
     */
    setupOutlinerDragEvents(charEl, character, id) {
        // WYSIWYG: ドラッグ可能設定
        charEl.draggable = true;
        charEl.addEventListener('dragstart', (e) => {
            console.log('🎭 キャラクタードラッグ開始:', character.name);
            e.dataTransfer.setData('application/spine-character', JSON.stringify({
                id: id,
                name: character.name,
                animations: character.animations
            }));
            e.dataTransfer.effectAllowed = 'copy';
            charEl.style.opacity = '0.5';
            
            // デバッグ情報
            console.log('📝 ドラッグデータ設定完了:', {
                id: id,
                name: character.name,
                animations: character.animations
            });
        });
        
        charEl.addEventListener('dragend', (e) => {
            console.log('🎭 キャラクタードラッグ終了:', character.name);
            charEl.style.opacity = '1';
        });
    }

    // ========== HTMLプレビュー ========== //

    /**
     * WYSIWYG: HTMLプレビュー表示
     * @param {string} homepageFolder - ホームページフォルダパス
     */
    async loadHTMLPreview(homepageFolder) {
        try {
            console.log('🎨 WYSIWYG HTMLプレビュー読み込み開始:', homepageFolder);
            
            const indexPath = `${homepageFolder}/index.html`;
            const previewArea = document.querySelector('.preview-content');
            
            if (!previewArea) {
                console.error('❌ プレビューエリアが見つかりません');
                return;
            }
            
            // 既存のコンテンツをクリア
            previewArea.innerHTML = '';
            
            // iframeでindex.htmlを表示（WYSIWYGプレビュー）
            const iframe = document.createElement('iframe');
            
            // Electron用のパス設定
            const normalizedPath = indexPath.replace(/\\/g, '/');
            iframe.src = `file:///${normalizedPath}`;
            
            // セキュリティ設定
            iframe.sandbox = 'allow-scripts allow-same-origin allow-forms';
            iframe.style.cssText = `
                width: 100%;
                height: 100%;
                border: none;
                background: white;
                overflow: hidden;
            `;
            
            console.log('📄 iframe読み込みパス:', iframe.src);
            
            // iframe読み込み完了イベント
            iframe.onload = () => {
                console.log('✅ WYSIWYG HTMLプレビュー表示完了');
                this.setupWYSIWYGEditMode(iframe);
            };
            
            iframe.onerror = (error) => {
                console.error('❌ HTMLプレビュー読み込みエラー:', error);
                this.showFallbackPreview(previewArea);
            };
            
            previewArea.appendChild(iframe);
            
        } catch (error) {
            console.error('❌ HTMLプレビュー読み込み失敗:', error);
        }
    }

    /**
     * WYSIWYG編集モードセットアップ
     * @param {HTMLIFrameElement} iframe - iframe要素
     */
    setupWYSIWYGEditMode(iframe) {
        console.log('🎯 WYSIWYG編集モード初期化開始');
        
        try {
            // iframe内のドキュメントにアクセス
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            // ドラッグ&ドロップエリアとして設定
            this.setupDropZone(iframeDoc);
            
            // 編集可能にするためのスタイル追加
            const style = iframeDoc.createElement('style');
            style.textContent = `
                body { position: relative !important; }
                .spine-character-editing {
                    cursor: move !important;
                    outline: 2px dashed #007acc !important;
                    outline-offset: 2px !important;
                }
                .drop-zone-active {
                    background: rgba(0, 122, 204, 0.1) !important;
                    transition: background 0.2s ease !important;
                }
            `;
            iframeDoc.head.appendChild(style);
            
            console.log('✅ WYSIWYG編集モード初期化完了');
            
        } catch (error) {
            console.warn('⚠️ WYSIWYG編集モード初期化エラー:', error.message);
            console.log('📝 クロスオリジン制限により、簡易モードで動作します');
        }
    }

    /**
     * ドラッグ&ドロップエリア設定
     * @param {Document} doc - 対象のドキュメント
     */
    setupDropZone(doc) {
        const body = doc.body;
        
        // ドラッグオーバーイベント
        body.addEventListener('dragover', (e) => {
            e.preventDefault();
            body.classList.add('drop-zone-active');
        });
        
        // ドラッグリーブイベント
        body.addEventListener('dragleave', (e) => {
            if (!body.contains(e.relatedTarget)) {
                body.classList.remove('drop-zone-active');
            }
        });
        
        // ドロップイベント
        body.addEventListener('drop', (e) => {
            e.preventDefault();
            body.classList.remove('drop-zone-active');
            
            const characterData = e.dataTransfer.getData('application/spine-character');
            if (characterData) {
                this.handleCharacterDrop(JSON.parse(characterData), e, doc);
            }
        });
    }

    /**
     * フォールバックプレビュー表示
     * @param {HTMLElement} previewArea - プレビューエリア
     */
    showFallbackPreview(previewArea) {
        previewArea.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                background: #1a1a1a;
                color: #ccc;
                font-size: 14px;
                flex-direction: column;
            ">
                <div>📄 HTMLプレビューが利用できません</div>
                <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">
                    簡易編集モードで続行します
                </div>
            </div>
        `;
    }

    // ========== プレビュー管理 ========== //

    /**
     * プレビュー表示を更新
     */
    updatePreviewDisplay() {
        const previewCanvas = document.getElementById('preview-canvas');
        if (previewCanvas) {
            // プレースホルダーを非表示にしてSpineコンテンツを表示
            const placeholder = previewCanvas.querySelector('.canvas-placeholder');
            if (placeholder && this.app.state.characters.size > 0) {
                placeholder.style.display = 'none';
            }
        }
        
        // ズーム情報更新
        const zoomLevel = document.querySelector('.zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = Math.round(this.app.state.ui.zoomLevel * 100) + '%';
        }
    }

    /**
     * プレビューエリアをクリア
     */
    clearPreviewArea() {
        const previewArea = document.querySelector('.preview-content');
        if (previewArea) {
            previewArea.innerHTML = `
                <div class="canvas-placeholder" style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    background: #2a2a2a;
                    color: #888;
                    font-size: 16px;
                    flex-direction: column;
                ">
                    <div>🎭 キャラクターをここにドラッグ&ドロップ</div>
                    <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">
                        左のアウトライナーからキャラクターをドラッグしてください
                    </div>
                </div>
            `;
        }
    }

    // ========== ビュー制御 ========== //

    /**
     * ビューをフィット
     */
    fitView() {
        console.log('🔍 ビューフィット');
        
        // プレビューエリア内の全要素を確認
        const previewArea = document.querySelector('.preview-content');
        if (!previewArea) return;
        
        const characterElements = previewArea.querySelectorAll('.spine-canvas-wysiwyg, .character-image-display, .character-canvas-2d, .spine-character-wysiwyg');
        
        if (characterElements.length === 0) {
            console.log('📝 フィット対象の要素がありません');
            return;
        }
        
        // 要素の境界を計算
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        for (const element of characterElements) {
            const rect = element.getBoundingClientRect();
            const previewRect = previewArea.getBoundingClientRect();
            
            const relativeX = rect.left - previewRect.left;
            const relativeY = rect.top - previewRect.top;
            
            minX = Math.min(minX, relativeX);
            minY = Math.min(minY, relativeY);
            maxX = Math.max(maxX, relativeX + rect.width);
            maxY = Math.max(maxY, relativeY + rect.height);
        }
        
        // ビューポートの中央に配置
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        const previewRect = previewArea.getBoundingClientRect();
        
        const centerX = (previewRect.width - contentWidth) / 2;
        const centerY = (previewRect.height - contentHeight) / 2;
        
        const offsetX = centerX - minX;
        const offsetY = centerY - minY;
        
        // 全要素を移動
        for (const element of characterElements) {
            const currentLeft = parseInt(element.style.left) || 0;
            const currentTop = parseInt(element.style.top) || 0;
            
            element.style.left = `${currentLeft + offsetX}px`;
            element.style.top = `${currentTop + offsetY}px`;
        }
        
        console.log(`✅ ビューフィット完了: オフセット(${Math.round(offsetX)}, ${Math.round(offsetY)})`);
    }

    /**
     * ビューをリセット
     */
    resetView() {
        console.log('🎯 ビューリセット');
        
        // ズームレベルをリセット
        this.app.state.ui.zoomLevel = 1.0;
        
        // 全キャラクターを初期位置に戻す
        let index = 0;
        for (const [characterId, character] of this.app.state.characters) {
            character.x = 18 + (index * 100); // 重複しないように横にずらす
            character.y = 49;
            character.scale = 0.55;
            character.rotation = 0;
            character.opacity = 1.0;
            
            index++;
        }
        
        // プレビューエリアの表示を更新
        this.app.updatePreview();
        
        // UI更新
        this.app.uiManager.updateProperties();
        this.updatePreviewDisplay();
        
        console.log('✅ ビューリセット完了');
    }

    // ========== ズーム制御 ========== //

    /**
     * ズームイン
     */
    zoomIn() {
        this.app.state.ui.zoomLevel = Math.min(this.app.state.ui.zoomLevel * 1.2, 5.0);
        this.applyZoom();
    }

    /**
     * ズームアウト
     */
    zoomOut() {
        this.app.state.ui.zoomLevel = Math.max(this.app.state.ui.zoomLevel / 1.2, 0.1);
        this.applyZoom();
    }

    /**
     * ズームを適用
     */
    applyZoom() {
        const previewArea = document.querySelector('.preview-content');
        if (previewArea) {
            previewArea.style.transform = `scale(${this.app.state.ui.zoomLevel})`;
            previewArea.style.transformOrigin = 'center center';
        }
        
        this.updatePreviewDisplay();
        console.log(`🔍 ズーム適用: ${Math.round(this.app.state.ui.zoomLevel * 100)}%`);
    }

    // ========== デバッグ ========== //

    /**
     * ドロップゾーンの状態をデバッグ出力
     */
    debugDropZoneStatus() {
        console.log('🎪 === ドロップゾーン状態 ===');
        
        const previewArea = document.querySelector('.preview-content');
        console.log('プレビューエリア:', previewArea ? '✅' : '❌');
        
        if (previewArea) {
            const hasDropEvents = {
                dragover: previewArea.ondragover !== null,
                dragleave: previewArea.ondragleave !== null,
                drop: previewArea.ondrop !== null
            };
            console.log('ドロップイベント:', hasDropEvents);
        }
        
        const characterElements = document.querySelectorAll('[draggable="true"]');
        console.log(`ドラッグ可能要素: ${characterElements.length}個`);
        
        console.log('🎪 === デバッグ情報終了 ===');
    }
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DragDropHandler;
}

// Global registration
window.DragDropHandler = DragDropHandler;

console.log('✅ Drag & Drop Handler Module 読み込み完了');