/**
 * PureBoundingBox.js
 * 
 * 🎯 統合インターフェースマイクロモジュール
 * - 外部依存: 同フォルダ内の4つのモジュール
 * - 責務: モジュール統合・公開API提供のみ
 */

class PureBoundingBox {
    constructor(config) {
        // 必要モジュールの存在確認
        if (!window.PureBoundingBoxCore || !window.PureBoundingBoxBounds || 
            !window.PureBoundingBoxUI || !window.PureBoundingBoxEvents) {
            throw new Error('❌ 必要なマイクロモジュールが不足しています。bounding-boxフォルダ内の全ファイルを読み込んでください。');
        }
        
        // 🎯 マイクロモジュール統合
        this.core = new window.PureBoundingBoxCore(config);
        this.bounds = new window.PureBoundingBoxBounds(this.core);
        this.ui = new window.PureBoundingBoxUI(this.core);
        this.events = new window.PureBoundingBoxEvents(this.core, this.bounds, this.ui);
        
        console.log('🚀 PureBoundingBox v5.0 マイクロモジュール版 初期化完了');
    }
    
    /**
     * 実行開始
     */
    async execute(options = {}) {
        try {
            // v2互換: 初期bounds設定
            this.initializeBounds();
            
            // UI作成
            this.ui.createBoundingBoxUI();
            
            // イベント登録
            this.events.attachEvents();
            this.events.attachTouchEvents();
            
            // 表示制御
            if (options.visible !== false) {
                this.ui.show();
            }
            
            // 初期位置同期
            this.ui.syncPosition();
            
            console.log('✅ PureBoundingBox 実行開始完了');
            
            return {
                success: true,
                bounds: {...this.core.bounds},
                nodeId: this.core.config.nodeId
            };
            
        } catch (error) {
            console.error('❌ PureBoundingBox 実行エラー:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 表示制御
     */
    show() {
        this.ui.show();
    }
    
    hide() {
        this.ui.hide();
    }
    
    /**
     * 完全クリーンアップ
     */
    cleanup() {
        try {
            // イベント削除
            this.events.detachEvents();
            
            // UI削除
            this.ui.remove();
            
            // 状態リセット
            this.core.dragState.isDragging = false;
            this.core.swapState.currentMode = 'idle';
            
            console.log('✅ PureBoundingBox クリーンアップ完了');
            
        } catch (error) {
            console.error('❌ PureBoundingBox クリーンアップエラー:', error);
        }
    }
    
    /**
     * v2互換: 初期bounds設定
     */
    initializeBounds() {
        const element = this.core.config.targetElement;
        const computedStyle = window.getComputedStyle(element);
        
        // v2正確パターン: 要素の現在のスタイル値を使用
        this.core.bounds = {
            x: parseInt(computedStyle.left) || 0,
            y: parseInt(computedStyle.top) || 0,
            width: parseInt(computedStyle.width) || 100,
            height: parseInt(computedStyle.height) || 100
        };
        
        console.log('📎 初期bounds設定:', this.core.bounds);
    }
    
    /**
     * 状態取得
     */
    getState() {
        return this.core.getState();
    }
    
    /**
     * 設定更新
     */
    updateConfig(newConfig) {
        Object.assign(this.core.config, newConfig);
    }
    
    /**
     * bounds取得
     */
    getBounds() {
        return {...this.core.bounds};
    }
    
    /**
     * transform取得
     */
    getTransform() {
        return {...this.core.transform};
    }
    
    /**
     * 単独テスト
     */
    static async test() {
        console.log('🧪 PureBoundingBox v5.0 マイクロモジュール版テスト開始');
        
        try {
            // テスト要素作成
            const testElement = document.createElement('div');
            testElement.style.cssText = `
                position: absolute;
                left: 200px;
                top: 150px;
                width: 150px;
                height: 100px;
                background: rgba(0, 150, 255, 0.3);
                border: 1px solid #0096ff;
            `;
            document.body.appendChild(testElement);
            
            // バウンディングボックス作成
            const boundingBox = new PureBoundingBox({
                targetElement: testElement
            });
            
            // 実行
            const result = await boundingBox.execute({visible: true});
            
            console.log('✅ テスト成功:', result);
            
            return {
                success: true,
                boundingBox: boundingBox,
                element: testElement
            };
            
        } catch (error) {
            console.error('❌ テスト失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.PureBoundingBox = PureBoundingBox;
    
    // テスト関数もグローバルに
    window.testBoundingBox = PureBoundingBox.test;
}