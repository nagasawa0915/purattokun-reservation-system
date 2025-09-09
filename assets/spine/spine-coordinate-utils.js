/**
 * Spine 座標変換ユーティリティ v2.0 (レスポンシブ対応版)
 * ビューポート基準 ↔ Canvas座標 ↔ Spine座標の変換を管理
 * 
 * 目的：ウィンドウサイズ変更時のキャラクター位置ズレ問題を解決
 * アプローチ：固定ピクセル座標からビューポート基準（vw/vh）に変換
 */

class SpineCoordinateUtils {
    constructor() {
        this.backgroundImageSelector = '.hero'; // 背景画像の親要素
        this.lastWindowSize = { width: window.innerWidth, height: window.innerHeight };
        this.isDebugMode = window.location.hostname === 'localhost';
        this.cssBasedPositioning = true; // CSS基準配置モード（新機能）
        
        // CSS基準配置モード：JavaScript座標計算を無効化
        console.log('🎨 SpineCoordinateUtils v2.0 初期化（CSS基準配置モード）');
        console.log('📍 キャラクター位置：CSS（.hero基準%）で自動制御');
    }

    /**
     * HTML設定をビューポート基準座標として読み込み
     * HTMLのdata-*属性を%座標として解釈
     */
    loadConfigFromHTML(configElementId) {
        const configElement = document.getElementById(configElementId);
        
        // デフォルト設定（ビューポート基準%）
        const defaultConfig = {
            x: 18,      // 画面幅の18%
            y: 49,      // 画面高さの49%（地面レベル）
            scale: 0.55,
            fadeDelay: 1500,
            fadeDuration: 2000
        };

        if (!configElement) {
            console.warn('⚠️ 座標設定要素が見つかりません、デフォルト設定を使用');
            return defaultConfig;
        }

        // HTMLデータ属性から読み取り（ビューポート%として解釈）
        const config = {
            x: parseFloat(configElement.dataset.x) || defaultConfig.x,
            y: parseFloat(configElement.dataset.y) || defaultConfig.y,
            scale: parseFloat(configElement.dataset.scale) || defaultConfig.scale,
            fadeDelay: parseInt(configElement.dataset.fadeDelay) || defaultConfig.fadeDelay,
            fadeDuration: parseInt(configElement.dataset.fadeDuration) || defaultConfig.fadeDuration
        };

        console.log('📋 レスポンシブ座標をHTMLから読み込み:', config);
        console.log('📐 解釈: x=' + config.x + 'vw, y=' + config.y + 'vh');
        
        return config;
    }

    /**
     * ビューポート基準座標を実際のピクセル座標に変換
     * ウィンドウサイズに応じて動的に計算
     */
    viewportToPixel(vpX, vpY) {
        const pixelX = (vpX / 100) * window.innerWidth;
        const pixelY = (vpY / 100) * window.innerHeight;
        
        if (this.isDebugMode) {
            console.log(`📐 ビューポート→ピクセル変換: (${vpX}vw, ${vpY}vh) → (${pixelX.toFixed(1)}px, ${pixelY.toFixed(1)}px)`);
        }
        
        return { x: pixelX, y: pixelY };
    }

    /**
     * ピクセル座標をビューポート基準座標に変換
     * ドラッグ操作時に使用
     */
    pixelToViewport(pixelX, pixelY) {
        const vpX = (pixelX / window.innerWidth) * 100;
        const vpY = (pixelY / window.innerHeight) * 100;
        
        if (this.isDebugMode) {
            console.log(`📐 ピクセル→ビューポート変換: (${pixelX}px, ${pixelY}px) → (${vpX.toFixed(1)}vw, ${vpY.toFixed(1)}vh)`);
        }
        
        return { x: vpX, y: vpY };
    }

    /**
     * 背景画像のサイズと位置を取得
     * レスポンシブ対応のベースとなる情報
     */
    getBackgroundImageBounds() {
        const heroElement = document.querySelector(this.backgroundImageSelector);
        if (!heroElement) {
            console.warn('⚠️ 背景要素が見つかりません');
            return { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
        }

        const rect = heroElement.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        };
    }

    /**
     * 背景画像基準の相対座標を計算
     * キャラクターが背景画像との相対位置を保つため
     */
    viewportToBackgroundRelative(vpX, vpY) {
        const pixelCoords = this.viewportToPixel(vpX, vpY);
        const bgBounds = this.getBackgroundImageBounds();
        
        const relativeX = pixelCoords.x - bgBounds.x;
        const relativeY = pixelCoords.y - bgBounds.y;
        
        return {
            x: relativeX,
            y: relativeY,
            backgroundBounds: bgBounds
        };
    }

    /**
     * Canvas要素の最適なサイズを計算
     * 背景画像に合わせて動的にサイズを調整
     */
    calculateOptimalCanvasSize(backgroundBounds = null) {
        if (!backgroundBounds) {
            backgroundBounds = this.getBackgroundImageBounds();
        }

        // 背景画像の80%を基準サイズとして使用
        const width = Math.min(backgroundBounds.width * 0.8, 800);
        const height = Math.min(backgroundBounds.height * 0.8, 600);

        return {
            width: Math.round(width),
            height: Math.round(height)
        };
    }

    /**
     * キャラクターの配置情報を計算
     * ヒーローセクション基準での相対位置計算（重要：リサイズ同期のため）
     */
    calculateCharacterPlacement(config) {
        const bgBounds = this.getBackgroundImageBounds();
        
        // ビューポート座標をヒーローセクション内の相対位置に変換
        const pixelCoords = this.viewportToPixel(config.x, config.y);
        const heroRelativeX = pixelCoords.x - bgBounds.x;
        const heroRelativeY = pixelCoords.y - bgBounds.y;
        
        console.log('🧮 座標計算詳細:');
        console.log('  - ビューポート座標:', config.x + 'vw, ' + config.y + 'vh');
        console.log('  - ピクセル座標:', pixelCoords.x + 'px, ' + pixelCoords.y + 'px');
        console.log('  - ヒーロー境界:', bgBounds);
        console.log('  - ヒーロー相対位置:', heroRelativeX + 'px, ' + heroRelativeY + 'px');
        
        const canvasSize = this.calculateOptimalCanvasSize(bgBounds);
        
        // Canvas位置：ヒーローセクション基準で計算
        // Canvasをヒーローセクションの中央に配置
        const canvasX = (bgBounds.width - canvasSize.width) / 2;
        const canvasY = (bgBounds.height - canvasSize.height) / 2;
        
        // キャラクターのCanvas内相対位置を計算
        const charInCanvasX = heroRelativeX - canvasX;
        const charInCanvasY = heroRelativeY - canvasY;
        
        console.log('  - Canvas位置（ヒーロー基準）:', canvasX + 'px, ' + canvasY + 'px');
        console.log('  - キャラクター位置（Canvas内）:', charInCanvasX + 'px, ' + charInCanvasY + 'px');
        
        return {
            canvas: {
                x: canvasX,           // ヒーローセクション内での相対位置
                y: canvasY,           // ヒーローセクション内での相対位置
                width: canvasSize.width,
                height: canvasSize.height
            },
            character: {
                x: charInCanvasX,     // Canvas内での位置
                y: charInCanvasY,     // Canvas内での位置
                scale: config.scale
            },
            backgroundBounds: bgBounds
        };
    }

    /**
     * ウィンドウリサイズ時の座標更新
     * 最重要：ユーザーが報告した位置ズレ問題を解決する関数
     */
    updateOnResize(character, config) {
        // console.log('🔄 ウィンドウリサイズ検出、キャラクター位置を更新中...'); // リサイズログ無効化
        // console.log('📱 現在のウィンドウサイズ:', window.innerWidth + 'x' + window.innerHeight); // リサイズログ無効化
        console.log('⚙️ 設定値:', config);
        
        // 座標計算前の背景画像情報を取得
        const bgBounds = this.getBackgroundImageBounds();
        console.log('🖼️ 背景画像境界（リサイズ後）:', bgBounds);
        
        const placement = this.calculateCharacterPlacement(config);
        console.log('🎯 新しい配置計算結果:', placement);
        
        if (character.canvas) {
            console.log('📍 Canvas位置更新前:', {
                left: character.canvas.style.left,
                top: character.canvas.style.top,
                width: character.canvas.width,
                height: character.canvas.height,
                parentElement: character.canvas.parentElement?.tagName || 'none'
            });
            
            try {
                // CSS基準配置モード：JavaScript座標設定は無効化
                console.log('🎨 CSS制御モード：JavaScript座標設定をスキップ（CSS側で自動制御）');
                // character.canvas.style.left = placement.canvas.x + 'px'; // 無効化
                // character.canvas.style.top = placement.canvas.y + 'px';  // 無効化
                character.canvas.width = placement.canvas.width;
                character.canvas.height = placement.canvas.height;
                
                console.log('📍 Canvas状態確認（CSS制御）:', {
                    cssLeft: 'CSS側で18%設定',
                    cssTop: 'CSS側で49%設定', 
                    width: character.canvas.width,
                    height: character.canvas.height,
                    actualBounds: character.canvas.getBoundingClientRect()
                });
                
                // WebGLビューポート更新
                const gl = character.canvas.getContext('webgl');
                if (gl) {
                    gl.viewport(0, 0, placement.canvas.width, placement.canvas.height);
                    console.log('🎮 WebGLビューポート更新:', placement.canvas.width + 'x' + placement.canvas.height);
                } else {
                    console.warn('⚠️ WebGL context not found');
                }
            } catch (error) {
                console.error('❌ Canvas更新エラー:', error);
            }
        } else {
            console.warn('⚠️ character.canvas が見つかりません');
            console.log('🔍 character object keys:', Object.keys(character));
        }
        
        if (character.skeleton) {
            console.log('🦴 Skeleton位置更新前:', {
                x: character.skeleton.x,
                y: character.skeleton.y,
                scale: character.skeleton.scaleX
            });
            
            // Spine座標を更新
            character.skeleton.x = placement.character.x;
            character.skeleton.y = placement.character.y;
            character.skeleton.scaleX = character.skeleton.scaleY = placement.character.scale;
            
            console.log('🦴 Skeleton位置更新後:', {
                x: character.skeleton.x,
                y: character.skeleton.y,
                scale: character.skeleton.scaleX
            });
        }
        
        if (character.element) {
            // プレースホルダー要素の位置更新
            const pixel = this.viewportToPixel(config.x, config.y);
            character.element.style.left = pixel.x + 'px';
            character.element.style.top = pixel.y + 'px';
            console.log('📝 プレースホルダー位置更新:', pixel);
        }
        
        // console.log('✅ ウィンドウリサイズに対応したキャラクター位置更新完了'); // リサイズログ無効化
        console.log(''); // 空行でログを見やすく
    }

    /**
     * CSS基準配置モードでは座標計算を無効化
     */
    setupResizeHandler(character, config) {
        console.log('🎨 CSS基準配置モード：JavaScript座標計算は無効化');
        console.log('📍 キャラクター位置はCSS（.hero基準の%座標）で自動制御');
        console.log('🚫 リサイズハンドラーは設定しません');
        
        // CSS制御モードでは何もしない
        return null;
    }

    /**
     * 座標変換のデバッグ情報を表示
     * 開発時の確認用
     */
    debugCoordinateTransformation(config) {
        if (!this.isDebugMode) return;
        
        console.group('🔍 座標変換デバッグ情報');
        
        const pixel = this.viewportToPixel(config.x, config.y);
        const bgBounds = this.getBackgroundImageBounds();
        const placement = this.calculateCharacterPlacement(config);
        
        console.log('📊 入力設定:', config);
        console.log('📐 ビューポート→ピクセル:', pixel);
        console.log('🖼️ 背景画像境界:', bgBounds);
        console.log('🎯 最終配置:', placement);
        // console.log('📱 ウィンドウサイズ:', window.innerWidth + 'x' + window.innerHeight); // リサイズログ無効化
        
        console.groupEnd();
    }

    /**
     * HTML設定の更新とライブプレビュー
     * ドラッグ操作時の即座反映用
     */
    updateHTMLConfig(configElementId, newConfig) {
        const configElement = document.getElementById(configElementId);
        if (!configElement) return;
        
        // HTML属性を更新
        Object.keys(newConfig).forEach(key => {
            if (newConfig[key] !== undefined) {
                configElement.dataset[key] = newConfig[key];
            }
        });
        
        console.log('💾 HTML設定を更新:', newConfig);
        
        // 即座に反映（ライブプレビュー）
        const character = window.spineManager?.characterManager?.characters?.get('purattokun');
        if (character) {
            this.updateOnResize(character, this.loadConfigFromHTML(configElementId));
        }
    }

    /**
     * ドラッグ&ドロップ用の座標変換
     * マウスイベントからビューポート座標に変換
     */
    mouseEventToViewport(mouseEvent) {
        return this.pixelToViewport(mouseEvent.clientX, mouseEvent.clientY);
    }

    /**
     * 設定コードジェネレーター
     * ドラッグ完了時のHTML出力用
     */
    generateConfigCode(config) {
        return `<div id="purattokun-config" style="display: none;"
     data-x="${config.x}"
     data-y="${config.y}"
     data-scale="${config.scale}"
     data-fade-delay="${config.fadeDelay}"
     data-fade-duration="${config.fadeDuration}">
</div>`;
    }

    // 既存APIとの互換性維持
    vwvhToPixels(vwValue, vhValue) {
        return this.viewportToPixel(vwValue, vhValue);
    }

    getConfigFromHTML(elementId) {
        return this.loadConfigFromHTML(elementId);
    }

    /**
     * デバッグ用グローバル関数の設定（CSS基準配置対応版）
     */
    setupDebugFunctions() {
        // キャラクター状態確認
        window.debugSpineCharacters = () => {
            const characters = window.spineManager?.characterManager?.characters;
            if (characters) {
                console.group('🔍 Spine Characters Debug（CSS基準配置モード）');
                characters.forEach((character, name) => {
                    console.log(`Character: ${name}`, {
                        type: character.type,
                        hasCanvas: !!character.canvas,
                        hasSkeleton: !!character.skeleton,
                        hasElement: !!character.element,
                        canvasParent: character.canvas?.parentElement?.tagName || 'none',
                        cssPosition: character.canvas ? 'CSS制御（%基準）' : 'no canvas',
                        keys: Object.keys(character)
                    });
                    
                    if (character.canvas) {
                        const bounds = character.canvas.getBoundingClientRect();
                        console.log(`  Canvas bounds:`, bounds);
                    }
                });
                console.groupEnd();
            } else {
                console.warn('⚠️ Characters not found');
            }
        };

        // 既存リサイズハンドラーのクリーンアップ
        window.cleanupOldResizeHandlers = () => {
            const characters = window.spineManager?.characterManager?.characters;
            if (characters) {
                characters.forEach((character, name) => {
                    if (character._resizeHandler) {
                        window.removeEventListener('resize', character._resizeHandler);
                        delete character._resizeHandler;
                        console.log(`🗑️ 古いリサイズハンドラーを削除: ${name}`);
                    }
                });
                console.log('✅ CSS基準配置モード：古いハンドラークリーンアップ完了');
            }
        };

        console.log('🔍 デバッグ関数を設定（CSS基準配置対応）:');
        console.log('  - window.debugSpineCharacters(): キャラクター状態確認');
        // console.log('  - window.cleanupOldResizeHandlers(): 古いリサイズハンドラー削除'); // デバッグログ無効化
    }
}