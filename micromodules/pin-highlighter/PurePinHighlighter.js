/**
 * PurePinHighlighter - ElementObserver Phase 3-B Micromodule
 * 
 * 【責務】: 要素ハイライト表示のみ
 * 【特化】: F12開発者ツール風のバウンディングボックス表示
 * 【依存】: DOM操作のみ
 * 【禁止】: 監視機能、計算処理、データ保存、他モジュール通信
 * 
 * マイクロモジュール設計原則:
 * - 単一責務: ハイライト表示機能のみ
 * - 完全独立: 他モジュール参照なし
 * - 数値のみ入出力: オブジェクト参照排除
 * - 単独テスト: 独立でテスト実行可能
 * - cleanup保証: 完全状態復元・メモリリーク防止
 * 
 * @version Phase 3-B v1.0
 * @created 2025-08-29
 */

class PurePinHighlighter {
    constructor(options = {}) {
        // スタイル設定（F12開発者ツール風）
        this.defaultStyle = {
            borderColor: '#007acc',             // F12風ブルー
            backgroundColor: 'rgba(0,122,204,0.1)', // 半透明背景
            borderWidth: '2px',
            borderStyle: 'solid',
            showElementInfo: true,              // 要素情報表示
            showPinPreview: true,              // ピン予定位置表示
            throttle: 16,                      // 60fps制御 (16ms)
            zIndex: 10000,                     // 最上位表示
            pointerEvents: 'none'              // イベント透過
        };
        
        // ユーザー設定をマージ
        this.style = { ...this.defaultStyle, ...options.style };
        
        // 内部状態
        this.overlays = new Map();           // element -> overlay要素のマップ
        this.highlightMode = false;          // マウスオーバーハイライトモード
        this.currentHighlight = null;        // 現在ハイライト中の要素
        this.mouseHandlers = new Map();      // イベントハンドラ管理
        this.throttleTimers = new Map();     // throttle制御用タイマー
        
        // DOM要素バックアップ（cleanup用）
        this.originalState = new Map();
        
        // DOM準備
        this.initializeDOM();
    }
    
    /**
     * DOM初期化処理
     * オーバーレイコンテナを準備
     */
    initializeDOM() {
        // オーバーレイコンテナが存在しない場合のみ作成
        if (!document.getElementById('pin-highlighter-container')) {
            this.container = document.createElement('div');
            this.container.id = 'pin-highlighter-container';
            this.container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: ${this.style.zIndex};
            `;
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('pin-highlighter-container');
        }
    }
    
    /**
     * 要素をハイライト表示
     * @param {HTMLElement} element - ハイライト対象要素
     * @param {Object} customStyle - カスタムスタイル（オプション）
     * @returns {Object} { overlayElement, cleanup }
     */
    highlight(element, customStyle = {}) {
        if (!element || !element.getBoundingClientRect) {
            console.warn('PurePinHighlighter: Invalid element for highlight');
            return { overlayElement: null, cleanup: () => {} };
        }
        
        // 既存のハイライトを削除
        this.unhighlight(element);
        
        // 要素の位置・サイズを取得
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
            console.warn('PurePinHighlighter: Element has zero dimensions');
            return { overlayElement: null, cleanup: () => {} };
        }
        
        // ハイライトオーバーレイを作成
        const overlay = this.createOverlay(element, rect, customStyle);
        if (!overlay) {
            return { overlayElement: null, cleanup: () => {} };
        }
        
        // オーバーレイをマップに登録
        this.overlays.set(element, overlay);
        
        // クリーンアップ関数を生成
        const cleanup = () => this.unhighlight(element);
        
        return { overlayElement: overlay, cleanup };
    }
    
    /**
     * オーバーレイ要素を作成
     * @param {HTMLElement} element - 対象要素
     * @param {DOMRect} rect - 要素の矩形情報
     * @param {Object} customStyle - カスタムスタイル
     * @returns {HTMLElement} オーバーレイ要素
     */
    createOverlay(element, rect, customStyle) {
        try {
            // スタイルをマージ
            const style = { ...this.style, ...customStyle };
            
            // メインオーバーレイ要素を作成
            const overlay = document.createElement('div');
            overlay.className = 'pin-highlighter-overlay';
            
            // 位置・サイズスタイルを設定
            overlay.style.cssText = `
                position: fixed;
                left: ${rect.left}px;
                top: ${rect.top}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
                border: ${style.borderWidth} ${style.borderStyle} ${style.borderColor};
                background-color: ${style.backgroundColor};
                pointer-events: ${style.pointerEvents};
                z-index: ${style.zIndex};
                box-sizing: border-box;
            `;
            
            // 要素情報表示
            if (style.showElementInfo) {
                const infoElement = this.createElementInfo(element, rect);
                if (infoElement) {
                    overlay.appendChild(infoElement);
                }
            }
            
            // ピン予定位置プレビュー
            if (style.showPinPreview) {
                const pinPreview = this.createPinPreview(rect);
                if (pinPreview) {
                    overlay.appendChild(pinPreview);
                }
            }
            
            // コンテナに追加
            this.container.appendChild(overlay);
            
            return overlay;
            
        } catch (error) {
            console.error('PurePinHighlighter: Failed to create overlay', error);
            return null;
        }
    }
    
    /**
     * 要素情報ツールチップを作成
     * @param {HTMLElement} element - 対象要素
     * @param {DOMRect} rect - 要素の矩形情報
     * @returns {HTMLElement} 情報表示要素
     */
    createElementInfo(element, rect) {
        try {
            const info = document.createElement('div');
            info.className = 'pin-highlighter-info';
            
            // 要素情報を取得
            const tagName = element.tagName.toLowerCase();
            const className = element.className || '';
            const id = element.id || '';
            const size = `${Math.round(rect.width)}×${Math.round(rect.height)}`;
            
            // 情報テキストを生成
            let infoText = tagName;
            if (id) infoText += `#${id}`;
            if (className && typeof className === 'string') {
                const classNames = className.split(' ').filter(c => c.trim());
                if (classNames.length > 0) {
                    infoText += `.${classNames[0]}`;
                    if (classNames.length > 1) {
                        infoText += `...+${classNames.length - 1}`;
                    }
                }
            }
            infoText += ` ${size}`;
            
            // スタイル設定
            info.style.cssText = `
                position: absolute;
                top: -24px;
                left: 0;
                background: #333;
                color: white;
                padding: 2px 6px;
                font-size: 11px;
                font-family: monospace;
                border-radius: 3px;
                white-space: nowrap;
                pointer-events: none;
            `;
            
            info.textContent = infoText;
            return info;
            
        } catch (error) {
            console.error('PurePinHighlighter: Failed to create element info', error);
            return null;
        }
    }
    
    /**
     * ピン配置予定位置プレビューを作成
     * @param {DOMRect} rect - 要素の矩形情報
     * @returns {HTMLElement} ピンプレビュー要素
     */
    createPinPreview(rect) {
        try {
            const pinPreview = document.createElement('div');
            pinPreview.className = 'pin-highlighter-pin-preview';
            
            // 中央位置に配置
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            pinPreview.style.cssText = `
                position: absolute;
                left: ${centerX - 4}px;
                top: ${centerY - 4}px;
                width: 8px;
                height: 8px;
                background: #ff6b6b;
                border: 1px solid white;
                border-radius: 50%;
                pointer-events: none;
            `;
            
            return pinPreview;
            
        } catch (error) {
            console.error('PurePinHighlighter: Failed to create pin preview', error);
            return null;
        }
    }
    
    /**
     * 要素のハイライトを削除
     * @param {HTMLElement} element - ハイライト解除対象要素
     */
    unhighlight(element) {
        if (!element) return;
        
        const overlay = this.overlays.get(element);
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        
        this.overlays.delete(element);
        
        // 現在のハイライト状態をクリア
        if (this.currentHighlight === element) {
            this.currentHighlight = null;
        }
    }
    
    /**
     * マウスオーバーハイライトモード開始
     * @param {Object} options - ハイライトオプション
     */
    startHighlightMode(options = {}) {
        if (this.highlightMode) {
            console.warn('PurePinHighlighter: Highlight mode already active');
            return;
        }
        
        this.highlightMode = true;
        const settings = { ...this.style, ...options };
        
        // throttled マウスオーバーハンドラを作成
        const throttledMouseOver = this.createThrottledHandler(
            (event) => this.handleMouseOver(event, settings),
            settings.throttle
        );
        
        const throttledMouseOut = this.createThrottledHandler(
            (event) => this.handleMouseOut(event),
            settings.throttle
        );
        
        // イベントリスナーを追加
        document.addEventListener('mouseover', throttledMouseOver, true);
        document.addEventListener('mouseout', throttledMouseOut, true);
        
        // ハンドラを保存（cleanup用）
        this.mouseHandlers.set('mouseover', throttledMouseOver);
        this.mouseHandlers.set('mouseout', throttledMouseOut);
    }
    
    /**
     * throttled イベントハンドラを作成
     * @param {Function} handler - 実行する関数
     * @param {number} throttleMs - throttle間隔（ms）
     * @returns {Function} throttled ハンドラ
     */
    createThrottledHandler(handler, throttleMs) {
        let isThrottled = false;
        
        return function(event) {
            if (isThrottled) return;
            
            isThrottled = true;
            handler(event);
            
            setTimeout(() => {
                isThrottled = false;
            }, throttleMs);
        };
    }
    
    /**
     * マウスオーバー処理
     * @param {MouseEvent} event - マウスイベント
     * @param {Object} settings - ハイライト設定
     */
    handleMouseOver(event, settings) {
        try {
            const target = event.target;
            
            // オーバーレイ要素は無視
            if (target.closest('#pin-highlighter-container')) {
                return;
            }
            
            // 既にハイライト中の要素と同じ場合は処理しない
            if (this.currentHighlight === target) {
                return;
            }
            
            // 前のハイライトをクリア
            if (this.currentHighlight) {
                this.unhighlight(this.currentHighlight);
            }
            
            // 新しい要素をハイライト
            this.highlight(target, settings);
            this.currentHighlight = target;
            
        } catch (error) {
            console.error('PurePinHighlighter: Mouse over handler error', error);
        }
    }
    
    /**
     * マウスアウト処理
     * @param {MouseEvent} event - マウスイベント
     */
    handleMouseOut(event) {
        try {
            // 実際に要素を離れたかチェック
            const relatedTarget = event.relatedTarget;
            const currentTarget = event.currentTarget;
            
            // relatedTargetがオーバーレイ内の場合は処理しない
            if (relatedTarget && relatedTarget.closest && relatedTarget.closest('#pin-highlighter-container')) {
                return;
            }
            
            // ハイライトをクリア（少し遅延させて誤動作を防ぐ）
            setTimeout(() => {
                if (this.currentHighlight && this.highlightMode) {
                    this.unhighlight(this.currentHighlight);
                    this.currentHighlight = null;
                }
            }, 50);
            
        } catch (error) {
            console.error('PurePinHighlighter: Mouse out handler error', error);
        }
    }
    
    /**
     * ハイライトモード終了・完全復元
     */
    stopHighlightMode() {
        if (!this.highlightMode) {
            return;
        }
        
        this.highlightMode = false;
        
        // イベントリスナーを削除
        const mouseOverHandler = this.mouseHandlers.get('mouseover');
        const mouseOutHandler = this.mouseHandlers.get('mouseout');
        
        if (mouseOverHandler) {
            document.removeEventListener('mouseover', mouseOverHandler, true);
        }
        
        if (mouseOutHandler) {
            document.removeEventListener('mouseout', mouseOutHandler, true);
        }
        
        // ハンドラマップをクリア
        this.mouseHandlers.clear();
        
        // 現在のハイライトをクリア
        if (this.currentHighlight) {
            this.unhighlight(this.currentHighlight);
            this.currentHighlight = null;
        }
    }
    
    /**
     * 全オーバーレイ削除・完全復元
     */
    cleanup() {
        try {
            // ハイライトモードを停止
            this.stopHighlightMode();
            
            // 全オーバーレイを削除
            this.overlays.forEach((overlay, element) => {
                if (overlay && overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            });
            
            // マップをクリア
            this.overlays.clear();
            
            // throttle タイマーをクリア
            this.throttleTimers.forEach((timer) => {
                clearTimeout(timer);
            });
            this.throttleTimers.clear();
            
            // コンテナを削除
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
                this.container = null;
            }
            
            // 状態をリセット
            this.currentHighlight = null;
            this.originalState.clear();
            
        } catch (error) {
            console.error('PurePinHighlighter: Cleanup failed', error);
        }
    }
    
    /**
     * DOM操作テスト・メモリリークテスト
     * 単独テスト機能（他モジュール不要）
     */
    static test() {
        console.log('🧪 PurePinHighlighter.test() - DOM操作・メモリリークテスト開始');
        const results = {
            passed: 0,
            failed: 0,
            errors: []
        };
        
        function assert(condition, message) {
            if (condition) {
                results.passed++;
                console.log(`✅ ${message}`);
            } else {
                results.failed++;
                results.errors.push(message);
                console.error(`❌ ${message}`);
            }
        }
        
        try {
            // テスト用要素を作成
            const testElement = document.createElement('div');
            testElement.id = 'pin-highlighter-test';
            testElement.style.cssText = 'width: 100px; height: 100px; position: absolute; top: 0; left: 0;';
            document.body.appendChild(testElement);
            
            // 1. インスタンス作成テスト
            const highlighter = new PurePinHighlighter();
            assert(highlighter instanceof PurePinHighlighter, 'インスタンス作成成功');
            
            // 2. コンテナ作成テスト
            const container = document.getElementById('pin-highlighter-container');
            assert(container !== null, 'オーバーレイコンテナ作成成功');
            
            // 3. ハイライト表示テスト
            const { overlayElement, cleanup } = highlighter.highlight(testElement);
            assert(overlayElement !== null, 'ハイライト表示成功');
            assert(highlighter.overlays.has(testElement), 'オーバーレイマップ登録成功');
            
            // 4. ハイライト解除テスト
            highlighter.unhighlight(testElement);
            assert(!highlighter.overlays.has(testElement), 'ハイライト解除成功');
            
            // 5. ハイライトモードテスト
            highlighter.startHighlightMode();
            assert(highlighter.highlightMode === true, 'ハイライトモード開始成功');
            
            highlighter.stopHighlightMode();
            assert(highlighter.highlightMode === false, 'ハイライトモード停止成功');
            
            // 6. 完全クリーンアップテスト
            const initialOverlayCount = document.querySelectorAll('.pin-highlighter-overlay').length;
            highlighter.highlight(testElement);
            highlighter.cleanup();
            
            const finalOverlayCount = document.querySelectorAll('.pin-highlighter-overlay').length;
            const cleanedContainer = document.getElementById('pin-highlighter-container');
            
            assert(finalOverlayCount === initialOverlayCount, 'オーバーレイ完全削除成功');
            assert(cleanedContainer === null, 'コンテナ完全削除成功');
            
            // 7. エラーハンドリングテスト
            const newHighlighter = new PurePinHighlighter();
            const { overlayElement: nullOverlay } = newHighlighter.highlight(null);
            assert(nullOverlay === null, 'null要素エラーハンドリング成功');
            
            // テスト用要素をクリーンアップ
            document.body.removeChild(testElement);
            newHighlighter.cleanup();
            
        } catch (error) {
            results.failed++;
            results.errors.push(`テスト実行エラー: ${error.message}`);
            console.error('❌ テスト実行エラー:', error);
        }
        
        // テスト結果サマリー
        console.log(`\n📊 テスト結果: ${results.passed}件成功, ${results.failed}件失敗`);
        if (results.errors.length > 0) {
            console.log('❌ 失敗した項目:');
            results.errors.forEach(error => console.log(`  - ${error}`));
        }
        
        return results;
    }
}

// モジュールとしてエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PurePinHighlighter;
}

// グローバル環境での利用をサポート
if (typeof window !== 'undefined') {
    window.PurePinHighlighter = PurePinHighlighter;
}

// 使用例・API説明コメント
/*
使用例:

// 1. 基本的なハイライト表示
const highlighter = new PurePinHighlighter();
const element = document.getElementById('target');
const { overlayElement, cleanup } = highlighter.highlight(element);

// 2. カスタムスタイルでハイライト
const customHighlighter = new PurePinHighlighter({
    style: {
        borderColor: '#ff6b6b',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        showElementInfo: false
    }
});

// 3. マウスオーバーハイライトモード
highlighter.startHighlightMode({
    borderColor: '#00ff00',
    showPinPreview: true
});

// モード終了
highlighter.stopHighlightMode();

// 4. 完全クリーンアップ
highlighter.cleanup();

// 5. 単独テスト実行
PurePinHighlighter.test();

// API仕様:
// - highlight(element, customStyle): 要素をハイライト表示
// - unhighlight(element): ハイライトを削除
// - startHighlightMode(options): マウスオーバーハイライト開始
// - stopHighlightMode(): ハイライトモード終了
// - cleanup(): 全オーバーレイ削除・完全復元
// - static test(): DOM操作・メモリリークテスト

// マイクロモジュール設計原則遵守:
// ✅ 単一責務: ハイライト表示のみ
// ✅ 完全独立: 他モジュール参照なし
// ✅ 数値のみ入出力: DOM要素以外はプリミティブ値
// ✅ 単独テスト: PurePinHighlighter.test()で完全テスト
// ✅ cleanup保証: 全リソース解放・メモリリーク防止
*/