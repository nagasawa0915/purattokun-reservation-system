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
    async createSpineCanvas(characterData, position, parentElement) {
        try {
            console.log('🎮 新しいSpineキャンバス作成開始:', characterData.name);
            
            // SpineIntegrationが利用可能かチェック
            if (!this.app.spineIntegration) {
                console.warn('⚠️ SpineIntegration未初期化');
                return false;
            }
            
            // Spineデータの準備
            if (!characterData.spineFiles) {
                console.warn('⚠️ Spineファイル情報がありません');
                return false;
            }
            
            // SpineデータをBlobURL形式に変換
            const spineData = {
                jsonURL: characterData.spineFiles.json.startsWith('blob:') ? 
                        characterData.spineFiles.json : 
                        `file://${characterData.spineFiles.json}`,
                atlasURL: characterData.spineFiles.atlas.startsWith('blob:') ? 
                         characterData.spineFiles.atlas : 
                         `file://${characterData.spineFiles.atlas}`,
                imageURLs: characterData.spineFiles.images || []
            };
            
            console.log('📋 Spine データ:', spineData);
            
            // 新しいAssetManager方式でSpineインスタンス作成
            const spineInstance = await this.app.spineIntegration.createSpineInstanceFromAssets(spineData);
            
            if (!spineInstance) {
                console.warn('⚠️ Spineインスタンス作成失敗');
                return false;
            }
            
            console.log('✅ Spineインスタンス作成成功 - Canvas表示開始');
            
            // Spineから提供されたCanvasを使用
            const canvasElement = spineInstance.canvas;
            canvasElement.id = `spine-canvas-${characterData.name}`;
            canvasElement.className = 'spine-canvas-wysiwyg';
            canvasElement.style.cssText = `
                position: absolute;
                left: ${position.x}px;
                top: ${position.y}px;
                width: 200px;
                height: 300px;
                cursor: move;
                z-index: 1000;
                border: 1px solid #4CAF50;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
            `;
            
            // ドラッグ移動機能追加
            this.app.dragDropHandler.makeElementDraggableSimple(canvasElement);
            
            // レンダーループ開始
            this.startSpineRenderLoop(spineInstance, canvasElement);
            
            // クリックでyarareアニメーション（マニュアル準拠）
            canvasElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.playSpineClickAnimation(spineInstance);
            });
            
            parentElement.appendChild(canvasElement);
            
            console.log('✅ Spineキャンバス配置完了:', characterData.name);
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
                console.log('✅ アニメーション対応キャラクター画像読み込み完了:', characterData.name);
                
                // キャラクター名前ラベル追加
                const labelElement = document.createElement('div');
                labelElement.style.cssText = this.getLabelStyles();
                labelElement.textContent = characterData.name;
                containerElement.appendChild(labelElement);
                
                // アニメーション機能を初期化
                this.setupCharacterAnimation(containerElement, imgElement, characterData);
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

    // ========== Spine WebGL専用メソッド ========== //

    /**
     * SpineWebGLレンダーループ開始
     * @param {Object} spineInstance - Spineインスタンス（skeleton, animationState, renderer含む）
     * @param {HTMLCanvasElement} canvasElement - Canvas要素
     */
    startSpineRenderLoop(spineInstance, canvasElement) {
        console.log('🎮 Spineレンダーループ開始');
        
        let lastTime = 0;
        
        const render = (currentTime) => {
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            
            try {
                // WebGLコンテキストとビューポート設定
                const gl = canvasElement.getContext('webgl2') || canvasElement.getContext('webgl');
                if (!gl) {
                    console.error('❌ WebGLコンテキスト取得失敗');
                    return;
                }
                
                // ビューポート設定
                gl.viewport(0, 0, canvasElement.width, canvasElement.height);
                gl.clearColor(0, 0, 0, 0); // 透明背景
                gl.clear(gl.COLOR_BUFFER_BIT);
                
                // アニメーション状態更新
                if (spineInstance.animationState) {
                    spineInstance.animationState.update(deltaTime);
                    spineInstance.animationState.apply(spineInstance.skeleton);
                }
                
                // スケルトン更新
                if (spineInstance.skeleton) {
                    spineInstance.skeleton.updateWorldTransform();
                }
                
                // レンダリング実行
                if (spineInstance.renderer && spineInstance.skeleton) {
                    spineInstance.renderer.draw(spineInstance.skeleton);
                }
                
                // 次のフレームをスケジュール
                requestAnimationFrame(render);
                
            } catch (error) {
                console.error('❌ Spineレンダリングエラー:', error);
                // エラーが発生してもレンダーループを続行
                requestAnimationFrame(render);
            }
        };
        
        // レンダーループ開始
        requestAnimationFrame(render);
        
        console.log('✅ Spineレンダーループ開始完了');
    }

    /**
     * Spineクリックアニメーション再生
     * @param {Object} spineInstance - Spineインスタンス
     */
    playSpineClickAnimation(spineInstance) {
        try {
            console.log('🎭 Spineクリックアニメーション再生開始');
            
            if (!spineInstance.animationState || !spineInstance.skeleton) {
                console.warn('⚠️ Spineアニメーション状態が無効');
                return;
            }
            
            // 現在のアニメーション状態をクリア
            spineInstance.animationState.clearTracks();
            
            // yarare（やられ）アニメーションを再生
            const yarareEntry = spineInstance.animationState.setAnimation(0, 'yarare', false);
            
            if (yarareEntry) {
                console.log('🎯 yarareアニメーション設定完了');
                
                // yarare完了後にtaikiアニメーションに戻る
                yarareEntry.listener = {
                    complete: () => {
                        console.log('🔄 yarare完了 -> taikiに遷移');
                        spineInstance.animationState.setAnimation(0, 'taiki', true);
                    }
                };
                
            } else {
                console.warn('⚠️ yarareアニメーション見つからず - taikiで代用');
                spineInstance.animationState.setAnimation(0, 'taiki', true);
            }
            
            console.log('✅ Spineクリックアニメーション設定完了');
            
        } catch (error) {
            console.error('❌ Spineクリックアニメーション再生エラー:', error);
            
            // フォールバック：とりあえずtaikiアニメーション再生
            try {
                spineInstance.animationState.setAnimation(0, 'taiki', true);
            } catch (fallbackError) {
                console.error('❌ フォールバックアニメーション再生も失敗:', fallbackError);
            }
        }
    }
    
    // ========== アニメーション機能 ========== //
    
    /**
     * キャラクターアニメーション設定
     * @param {HTMLElement} containerElement - コンテナ要素
     * @param {HTMLImageElement} imgElement - 画像要素
     * @param {Object} characterData - キャラクターデータ
     */
    setupCharacterAnimation(containerElement, imgElement, characterData) {
        console.log('🎬 キャラクターアニメーション設定:', characterData.name);
        
        // アニメーション状態管理
        const animationState = {
            isIdle: true,
            currentAnimation: 'taiki',
            animationTimer: null
        };
        
        // アイドルアニメーション（浮遊・呼吸効果）
        const startIdleAnimation = () => {
            containerElement.style.animation = 'character-float 3s ease-in-out infinite';
            imgElement.style.animation = 'character-breathe 4s ease-in-out infinite';
            animationState.isIdle = true;
            animationState.currentAnimation = 'taiki';
            console.log('🌊 アイドルアニメーション開始:', characterData.name);
        };
        
        // クリックアニメーション
        const playClickAnimation = () => {
            console.log('🎭 クリックアニメーション再生:', characterData.name);
            
            // 現在のアニメーション停止
            containerElement.style.animation = 'none';
            imgElement.style.animation = 'none';
            
            // クリックエフェクト
            containerElement.style.animation = 'character-click 0.6s ease-out';
            imgElement.style.animation = 'character-bounce 0.6s ease-out';
            
            animationState.isIdle = false;
            animationState.currentAnimation = 'yarare';
            
            // 1秒後にアイドルに戻る
            clearTimeout(animationState.animationTimer);
            animationState.animationTimer = setTimeout(() => {
                startIdleAnimation();
            }, 1000);
        };
        
        // クリックイベント設定
        containerElement.addEventListener('click', (e) => {
            e.stopPropagation();
            playClickAnimation();
        });
        
        // ホバーエフェクト
        containerElement.addEventListener('mouseenter', () => {
            if (animationState.isIdle) {
                containerElement.style.transform = 'scale(1.05)';
                containerElement.style.filter = 'brightness(1.1)';
            }
        });
        
        containerElement.addEventListener('mouseleave', () => {
            if (animationState.isIdle) {
                containerElement.style.transform = 'scale(1.0)';
                containerElement.style.filter = 'brightness(1.0)';
            }
        });
        
        // アイドルアニメーション開始
        startIdleAnimation();
        
        // CSS animations を動的追加
        this.addAnimationStyles();
        
        console.log('✅ キャラクターアニメーション設定完了:', characterData.name);
    }
    
    /**
     * アニメーションCSSスタイルを追加
     */
    addAnimationStyles() {
        // 既に追加済みかチェック
        if (document.getElementById('character-animations')) return;
        
        const style = document.createElement('style');
        style.id = 'character-animations';
        style.textContent = `
            @keyframes character-float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
            }
            
            @keyframes character-breathe {
                0%, 100% { transform: scale(1.0); }
                50% { transform: scale(1.02); }
            }
            
            @keyframes character-click {
                0% { transform: scale(1.0) rotate(0deg); }
                25% { transform: scale(1.1) rotate(-2deg); }
                50% { transform: scale(0.95) rotate(2deg); }
                75% { transform: scale(1.05) rotate(-1deg); }
                100% { transform: scale(1.0) rotate(0deg); }
            }
            
            @keyframes character-bounce {
                0% { transform: scale(1.0); }
                25% { transform: scale(1.15); }
                50% { transform: scale(0.9); }
                75% { transform: scale(1.05); }
                100% { transform: scale(1.0); }
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            .character-image-display {
                transition: transform 0.3s ease, filter 0.3s ease;
            }
            
            .character-sprite {
                transition: all 0.3s ease;
            }
        `;
        document.head.appendChild(style);
        console.log('✅ キャラクターアニメーションCSS追加完了');
    }
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterRenderer;
}

// Global registration
window.CharacterRenderer = CharacterRenderer;

console.log('✅ Character Renderer Module 読み込み完了');