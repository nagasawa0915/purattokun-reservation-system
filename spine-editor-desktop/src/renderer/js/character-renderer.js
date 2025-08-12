// 🎯 Spine Editor Desktop - Character Renderer Module
// キャラクター表示・レンダリング・配置処理

console.log('🎨 Character Renderer Module 読み込み');

/**
 * キャラクターレンダラークラス
 * 責任範囲:
 * - キャラクターの表示・レンダリング
 * - Canvas・画像表示の作成
 * - プレースホルダー・フォールバック表示
 * - 表示形式の自動選択
 */
class CharacterRenderer {
    constructor(app) {
        this.app = app;
        console.log('✅ CharacterRenderer 初期化完了');
    }

    // ========== メイン配置処理 ========== //

    /**
     * キャラクターをプレビューエリアに直接追加
     * @param {Object} characterData - キャラクターデータ
     * @param {Object} position - 配置位置 {x, y}
     */
    addCharacterDirectly(characterData, position) {
        console.log('🎭 直接キャラクター配置:', characterData.name, position);
        console.log('📋 キャラクターデータ詳細:', {
            name: characterData.name,
            pngFile: characterData.pngFile,
            spineFiles: characterData.spineFiles
        });
        
        const previewArea = document.querySelector('.preview-content');
        if (!previewArea) {
            console.error('❌ プレビューエリアが見つかりません');
            return;
        }
        
        // 初回配置時にプレースホルダーをクリア
        if (previewArea.querySelector('.canvas-placeholder')) {
            previewArea.innerHTML = '';
        }
        
        // 表示方式を自動選択
        if (this.createSpineCanvas(characterData, position, previewArea)) {
            console.log('✅ Spineキャンバス配置完了');
        } else if (this.create2DCanvas(characterData, position, previewArea)) {
            console.log('✅ 2D Canvas配置完了');
        } else {
            // 最終フォールバック：プレースホルダー表示
            this.createPlaceholderElement(characterData, position, previewArea);
            console.log('✅ プレースホルダー配置完了（最終フォールバック）');
        }
    }

    // ========== Spineキャンバス作成 ========== //

    /**
     * Spineキャンバス作成
     * @param {Object} characterData - キャラクターデータ
     * @param {Object} position - 配置位置
     * @param {HTMLElement} parentElement - 親要素
     * @returns {boolean} 作成成功かどうか
     */
    createSpineCanvas(characterData, position, parentElement) {
        try {
            console.log('🎮 Spineキャンバス作成開始:', characterData.name);
            
            // SpineIntegrationが利用可能かチェック
            if (!this.app.spineIntegration || !this.app.spineIntegration.characters) {
                console.warn('⚠️ SpineIntegration未初期化 - プレースホルダーで代替');
                return false;
            }
            
            // キャンバス要素作成
            const canvasElement = document.createElement('canvas');
            canvasElement.id = `spine-canvas-${characterData.name}`;
            canvasElement.className = 'spine-canvas-wysiwyg';
            canvasElement.width = 200;
            canvasElement.height = 300;
            canvasElement.style.cssText = `
                position: absolute;
                left: ${position.x}px;
                top: ${position.y}px;
                width: 200px;
                height: 300px;
                cursor: move;
                z-index: 1000;
                border: 1px solid #007acc;
                border-radius: 4px;
                background: rgba(0, 0, 0, 0.05);
            `;
            
            // ドラッグ移動機能追加
            this.app.dragDropHandler.makeElementDraggableSimple(canvasElement);
            
            // SpineIntegrationでアニメーション初期化
            this.app.spineIntegration.renderCharacterToCanvas(characterData.name, canvasElement);
            
            parentElement.appendChild(canvasElement);
            
            return true;
            
        } catch (error) {
            console.error('❌ Spineキャンバス作成エラー:', error);
            return false;
        }
    }

    // ========== 2Dキャンバス・画像表示 ========== //

    /**
     * 2D Canvas作成（実際のキャラクター画像表示）
     * @param {Object} characterData - キャラクターデータ
     * @param {Object} position - 配置位置
     * @param {HTMLElement} parentElement - 親要素
     * @returns {boolean} 作成成功かどうか
     */
    create2DCanvas(characterData, position, parentElement) {
        try {
            console.log('🎨 実際のキャラクター画像表示開始:', characterData.name);
            
            // 実際のキャラクター画像があるか確認
            if (characterData.pngFile) {
                return this.createCharacterImageDisplay(characterData, position, parentElement);
            } else {
                return this.createCanvasFallback(characterData, position, parentElement);
            }
            
        } catch (error) {
            console.error('❌ キャラクター表示作成エラー:', error);
            return false;
        }
    }

    /**
     * 実際のキャラクター画像表示
     * @param {Object} characterData - キャラクターデータ
     * @param {Object} position - 配置位置
     * @param {HTMLElement} parentElement - 親要素
     * @returns {boolean} 作成成功かどうか
     */
    createCharacterImageDisplay(characterData, position, parentElement) {
        try {
            console.log('🖼️ キャラクター画像表示作成:', characterData.pngFile);
            
            // コンテナ作成
            const containerElement = document.createElement('div');
            containerElement.id = `character-img-${characterData.name}`;
            containerElement.className = 'character-image-display';
            containerElement.style.cssText = this.getContainerStyles(position);
            
            // 実際のキャラクター画像
            const imgElement = document.createElement('img');
            imgElement.style.cssText = this.getImageStyles();
            
            // 画像読み込み完了時の処理
            imgElement.onload = () => {
                console.log('✅ キャラクター画像読み込み完了:', characterData.name);
                
                // キャラクター名前ラベル追加
                const labelElement = document.createElement('div');
                labelElement.style.cssText = this.getLabelStyles();
                labelElement.textContent = characterData.name;
                containerElement.appendChild(labelElement);
            };
            
            // 画像読み込みエラー時のフォールバック
            imgElement.onerror = () => {
                console.error('❌ キャラクター画像読み込み失敗:', characterData.pngFile);
                containerElement.innerHTML = this.getImageErrorHTML(characterData.name);
            };
            
            // 画像ファイルパスから画像URL作成
            imgElement.src = this.createImageURL(characterData.pngFile);
            
            containerElement.appendChild(imgElement);
            
            // ドラッグ移動機能追加
            this.app.dragDropHandler.makeElementDraggableSimple(containerElement);
            
            // 親要素に追加
            parentElement.appendChild(containerElement);
            
            console.log('✅ キャラクター画像表示作成完了:', characterData.name);
            return true;
            
        } catch (error) {
            console.error('❌ キャラクター画像表示作成エラー:', error);
            return false;
        }
    }

    /**
     * Canvasフォールバック表示
     * @param {Object} characterData - キャラクターデータ
     * @param {Object} position - 配置位置
     * @param {HTMLElement} parentElement - 親要素
     * @returns {boolean} 作成成功かどうか
     */
    createCanvasFallback(characterData, position, parentElement) {
        const canvasElement = document.createElement('canvas');
        canvasElement.id = `canvas-2d-${characterData.name}`;
        canvasElement.className = 'character-canvas-2d';
        canvasElement.width = 120;
        canvasElement.height = 160;
        canvasElement.style.cssText = this.getCanvasStyles(position);
        
        const ctx = canvasElement.getContext('2d');
        
        // 背景グラデーション
        const gradient = ctx.createLinearGradient(0, 0, 0, 160);
        gradient.addColorStop(0, '#4a90e2');
        gradient.addColorStop(1, '#357abd');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 120, 160);
        
        // キャラクター名前表示
        this.drawCanvasText(ctx, characterData.name);
        
        // ドラッグ移動機能追加
        this.app.dragDropHandler.makeElementDraggableSimple(canvasElement);
        
        // 親要素に追加
        parentElement.appendChild(canvasElement);
        
        console.log('✅ Canvasフォールバック表示作成完了:', characterData.name);
        return true;
    }

    /**
     * プレースホルダー要素作成（フォールバック）
     * @param {Object} characterData - キャラクターデータ
     * @param {Object} position - 配置位置
     * @param {HTMLElement} parentElement - 親要素
     */
    createPlaceholderElement(characterData, position, parentElement) {
        const characterElement = document.createElement('div');
        characterElement.id = `spine-character-${characterData.name}`;
        characterElement.className = 'spine-character-wysiwyg';
        characterElement.style.cssText = this.getPlaceholderStyles(position);
        
        characterElement.innerHTML = this.getPlaceholderHTML(characterData.name);
        
        // ドラッグ移動機能追加
        this.app.dragDropHandler.makeElementDraggableSimple(characterElement);
        
        parentElement.appendChild(characterElement);
    }

    // ========== スタイル・HTML生成 ========== //

    /**
     * コンテナ要素のスタイルを取得
     * @param {Object} position - 配置位置
     * @returns {string} CSSスタイル文字列
     */
    getContainerStyles(position) {
        return `
            position: absolute;
            left: ${position.x}px;
            top: ${position.y}px;
            cursor: move;
            z-index: 1000;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            padding: 8px;
            border: 2px solid rgba(255,255,255,0.2);
        `;
    }

    /**
     * 画像要素のスタイルを取得
     * @returns {string} CSSスタイル文字列
     */
    getImageStyles() {
        return `
            max-width: 150px;
            max-height: 200px;
            display: block;
            border-radius: 6px;
        `;
    }

    /**
     * ラベル要素のスタイルを取得
     * @returns {string} CSSスタイル文字列
     */
    getLabelStyles() {
        return `
            text-align: center;
            margin-top: 8px;
            color: #ffffff;
            font-size: 12px;
            font-weight: bold;
            text-shadow: 0 1px 2px rgba(0,0,0,0.8);
            background: rgba(0,0,0,0.6);
            padding: 4px 8px;
            border-radius: 4px;
        `;
    }

    /**
     * Canvas要素のスタイルを取得
     * @param {Object} position - 配置位置
     * @returns {string} CSSスタイル文字列
     */
    getCanvasStyles(position) {
        return `
            position: absolute;
            left: ${position.x}px;
            top: ${position.y}px;
            cursor: move;
            z-index: 1000;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
    }

    /**
     * プレースホルダー要素のスタイルを取得
     * @param {Object} position - 配置位置
     * @returns {string} CSSスタイル文字列
     */
    getPlaceholderStyles(position) {
        return `
            position: absolute;
            left: ${position.x}px;
            top: ${position.y}px;
            width: 120px;
            height: 160px;
            border: 2px dashed #007acc;
            background: rgba(0, 122, 204, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            color: #007acc;
            font-size: 12px;
            font-weight: bold;
            cursor: move;
            z-index: 1000;
            border-radius: 4px;
        `;
    }

    /**
     * 画像エラー時のHTMLを取得
     * @param {string} characterName - キャラクター名
     * @returns {string} HTML文字列
     */
    getImageErrorHTML(characterName) {
        return `
            <div style="
                width: 150px;
                height: 200px;
                background: linear-gradient(135deg, #ff6b6b, #ff8e53);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                color: white;
                font-size: 14px;
                font-weight: bold;
                text-align: center;
                border-radius: 6px;
            ">
                <div style="font-size: 32px;">🎭</div>
                <div style="margin-top: 8px;">${characterName}</div>
                <div style="font-size: 10px; opacity: 0.8; margin-top: 4px;">画像読み込み失敗</div>
            </div>
        `;
    }

    /**
     * プレースホルダーのHTMLを取得
     * @param {string} characterName - キャラクター名
     * @returns {string} HTML文字列
     */
    getPlaceholderHTML(characterName) {
        return `
            <div style="font-size: 24px;">🎭</div>
            <div style="margin-top: 4px;">${characterName}</div>
            <div style="font-size: 10px; opacity: 0.7; margin-top: 2px;">Loading...</div>
        `;
    }

    // ========== ユーティリティ ========== //

    /**
     * 画像URLを作成
     * @param {string} pngFilePath - PNGファイルパス
     * @returns {string} 画像URL
     */
    createImageURL(pngFilePath) {
        if (typeof electronAPI !== 'undefined') {
            // Electronの場合、ファイルパスから直接読み込み
            return 'file://' + pngFilePath.replace(/\\/g, '/');
        } else {
            // ウェブブラウザの場合、相対パス変換
            const relativePath = pngFilePath.replace(/\\/g, '/');
            return relativePath;
        }
    }

    /**
     * Canvasにテキストを描画
     * @param {CanvasRenderingContext2D} ctx - Canvas描画コンテキスト
     * @param {string} characterName - キャラクター名
     */
    drawCanvasText(ctx, characterName) {
        // キャラクター名前表示
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎭', 60, 40);
        
        ctx.font = '12px Arial';
        ctx.fillText(characterName, 60, 70);
        
        ctx.font = '10px Arial';
        ctx.fillStyle = '#e6f3ff';
        ctx.fillText('画像なし', 60, 90);
    }

    // ========== 表示管理 ========== //

    /**
     * キャラクターの表示状態を更新
     * @param {string} characterId - キャラクターID
     * @param {Object} properties - 更新するプロパティ
     */
    updateCharacterDisplay(characterId, properties) {
        const elementIds = [
            `spine-canvas-${characterId}`,
            `character-img-${characterId}`,
            `canvas-2d-${characterId}`,
            `spine-character-${characterId}`
        ];
        
        for (const elementId of elementIds) {
            const element = document.getElementById(elementId);
            if (element) {
                this.applyPropertiesToElement(element, properties);
                break; // 最初に見つかった要素のみ更新
            }
        }
    }

    /**
     * 要素にプロパティを適用
     * @param {HTMLElement} element - 対象要素
     * @param {Object} properties - 適用するプロパティ
     */
    applyPropertiesToElement(element, properties) {
        if (properties.x !== undefined || properties.y !== undefined) {
            const currentLeft = parseInt(element.style.left) || 0;
            const currentTop = parseInt(element.style.top) || 0;
            
            element.style.left = `${properties.x !== undefined ? properties.x : currentLeft}px`;
            element.style.top = `${properties.y !== undefined ? properties.y : currentTop}px`;
        }
        
        if (properties.scale !== undefined) {
            const transform = element.style.transform;
            const scaleRegex = /scale\([^)]*\)/g;
            const newTransform = transform.replace(scaleRegex, '') + ` scale(${properties.scale})`;
            element.style.transform = newTransform.trim();
        }
        
        if (properties.rotation !== undefined) {
            const transform = element.style.transform;
            const rotateRegex = /rotate\([^)]*\)/g;
            const newTransform = transform.replace(rotateRegex, '') + ` rotate(${properties.rotation}deg)`;
            element.style.transform = newTransform.trim();
        }
        
        if (properties.opacity !== undefined) {
            element.style.opacity = properties.opacity;
        }
        
        if (properties.visible !== undefined) {
            element.style.display = properties.visible ? 'block' : 'none';
        }
    }

    /**
     * キャラクター表示を削除
     * @param {string} characterId - キャラクターID
     */
    removeCharacterDisplay(characterId) {
        const elementIds = [
            `spine-canvas-${characterId}`,
            `character-img-${characterId}`,
            `canvas-2d-${characterId}`,
            `spine-character-${characterId}`
        ];
        
        for (const elementId of elementIds) {
            const element = document.getElementById(elementId);
            if (element) {
                element.remove();
                console.log(`✅ キャラクター表示削除: ${elementId}`);
            }
        }
    }

    /**
     * 全キャラクター表示をクリア
     */
    clearAllCharacterDisplays() {
        const previewArea = document.querySelector('.preview-content');
        if (!previewArea) return;
        
        const characterElements = previewArea.querySelectorAll(
            '.spine-canvas-wysiwyg, .character-image-display, .character-canvas-2d, .spine-character-wysiwyg'
        );
        
        for (const element of characterElements) {
            element.remove();
        }
        
        console.log(`✅ 全キャラクター表示クリア: ${characterElements.length}個の要素を削除`);
    }

    /**
     * 表示統計情報を取得
     * @returns {Object} 統計情報
     */
    getDisplayStatistics() {
        const previewArea = document.querySelector('.preview-content');
        if (!previewArea) {
            return {
                total: 0,
                byType: {}
            };
        }
        
        const stats = {
            total: 0,
            byType: {
                spine: 0,
                image: 0,
                canvas: 0,
                placeholder: 0
            }
        };
        
        // 各タイプの要素数をカウント
        stats.byType.spine = previewArea.querySelectorAll('.spine-canvas-wysiwyg').length;
        stats.byType.image = previewArea.querySelectorAll('.character-image-display').length;
        stats.byType.canvas = previewArea.querySelectorAll('.character-canvas-2d').length;
        stats.byType.placeholder = previewArea.querySelectorAll('.spine-character-wysiwyg').length;
        
        stats.total = stats.byType.spine + stats.byType.image + stats.byType.canvas + stats.byType.placeholder;
        
        return stats;
    }

    /**
     * 表示情報をデバッグ出力
     */
    debugDisplayInfo() {
        console.log('🎨 === 表示情報デバッグ ===');
        
        const stats = this.getDisplayStatistics();
        console.log('📊 表示統計:', stats);
        
        const previewArea = document.querySelector('.preview-content');
        if (previewArea) {
            console.log('プレビューエリア:', {
                width: previewArea.clientWidth,
                height: previewArea.clientHeight,
                children: previewArea.children.length
            });
            
            for (const child of previewArea.children) {
                console.log('- 要素:', {
                    id: child.id,
                    className: child.className,
                    position: {
                        left: child.style.left,
                        top: child.style.top
                    }
                });
            }
        }
        
        console.log('🎨 === デバッグ情報終了 ===');
    }
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterRenderer;
}

// Global registration
window.CharacterRenderer = CharacterRenderer;

console.log('✅ Character Renderer Module 読み込み完了');