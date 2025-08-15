/**
 * 統一座標変換システム v2.0 - 🚀 最大シンプル化版
 * 
 * 目的: 今回実験で証明された skeleton.x = 0; skeleton.y = 0; の最簡実装
 * 教訓: 複雑な座標変換は不要、シンプルが最強
 * 
 * 新特徴:
 * - 座標変換をほぼ廃止
 * - skeleton.x = 0; skeleton.y = 0; で固定
 * - DPR、中央原点、Y軸反転などの複雑処理を削除
 * - デバッグ情報のみ保持
 * 
 * 作成日: 2025-08-15 (シンプル化リファクタリング)
 * 基盤実装: 今回の実験成果 (skeleton.x = 0; skeleton.y = 0;)
 */

export class UnifiedCoordinateSystem {
    constructor(options = {}) {
        this.debugMode = options.debug || false;
        this.canvas = null;
        this.context = null;
        
        // デバッグ用統計情報
        this.transformCount = 0;
        this.lastTransform = null;
    }
    
    /**
     * Canvas要素を設定
     * @param {HTMLCanvasElement} canvas - Canvas要素
     */
    setCanvas(canvas) {
        if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
            console.error('❌ 無効なCanvas要素');
            return false;
        }
        
        this.canvas = canvas;
        this.context = canvas.getContext('webgl') || canvas.getContext('webgl2');
        
        if (this.debugMode) {
            console.log('✅ 統一座標システム: Canvas設定完了');
            console.log(`  - Canvas実サイズ: ${canvas.width}x${canvas.height}`);
            console.log(`  - Canvas表示サイズ: ${canvas.clientWidth}x${canvas.clientHeight}`);
        }
        
        return true;
    }
    
    /**
     * 🚀 最シンプル座標変換 - 今回実験の知見適用
     * 
     * 教訓: skeleton.x = 0; skeleton.y = 0; で固定するため、座標変換はほぼ不要
     * マウスクライアント座標 → シンプルログ用座標
     * 
     * @param {number} clientX - マウスのX座標
     * @param {number} clientY - マウスのY座標
     * @returns {object} シンプル座標 {x, y} (ログ用のみ)
     */
    clientToSpineCoordinates(clientX, clientY) {
        if (!this.canvas) {
            console.error('❌ Canvas未設定: 座標変換失敗');
            return null;
        }
        
        // 🚀 最シンプル実装: skeletonは常に(0,0)で固定のため、座標変換不要
        const rect = this.canvas.getBoundingClientRect();
        const simpleX = clientX - rect.left;
        const simpleY = clientY - rect.top;
        
        // 統計更新
        this.transformCount++;
        this.lastTransform = {
            input: { clientX, clientY },
            output: { x: simpleX, y: simpleY },
            timestamp: Date.now(),
            note: 'skeleton固定(0,0)'
        };
        
        if (this.debugMode) {
            console.log('🚀 シンプル座標変換:');
            console.log(`  Client: (${clientX}, ${clientY}) → Simple: (${simpleX.toFixed(1)}, ${simpleY.toFixed(1)})`);
            console.log(`  注意: skeletonは常に(0,0)で固定されています`);
        }
        
        return { x: simpleX, y: simpleY };
    }
    
    /**
     * 逆変換: Spine座標 → クライアント座標
     * 
     * @param {number} spineX - SpineのX座標
     * @param {number} spineY - SpineのY座標
     * @returns {object} クライアント座標 {x, y} または null（エラー時）
     */
    spineToClientCoordinates(spineX, spineY) {
        if (!this.canvas) {
            console.error('❌ Canvas未設定: 逆座標変換失敗');
            return null;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // 1. 中央原点座標系への逆変換
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // 2. Spine座標 → Canvas中央原点座標系（Y軸反転）
        const centerOriginX = spineX + centerX;
        const centerOriginY = centerY - spineY; // Y軸反転
        
        // 3. DPR逆補正
        const canvasX = centerOriginX / dpr;
        const canvasY = centerOriginY / dpr;
        
        // 4. Canvas座標 → クライアント座標
        const clientX = canvasX + rect.left;
        const clientY = canvasY + rect.top;
        
        if (this.debugMode) {
            console.log('🔄 逆座標変換プロセス:');
            console.log(`  1. Spine: (${spineX.toFixed(1)}, ${spineY.toFixed(1)})`);
            console.log(`  2. 中央原点座標系: (${centerOriginX.toFixed(1)}, ${centerOriginY.toFixed(1)})`);
            console.log(`  3. DPR逆補正: (${canvasX.toFixed(1)}, ${canvasY.toFixed(1)})`);
            console.log(`  4. Client: (${clientX.toFixed(1)}, ${clientY.toFixed(1)})`);
        }
        
        return { x: clientX, y: clientY };
    }
    
    /**
     * Canvasサイズに基づく正規化座標を取得
     * 
     * @param {number} spineX - SpineのX座標
     * @param {number} spineY - SpineのY座標
     * @returns {object} 正規化座標 {x, y} (-1.0 ～ 1.0)
     */
    spineToNormalizedCoordinates(spineX, spineY) {
        if (!this.canvas) {
            console.error('❌ Canvas未設定: 正規化座標変換失敗');
            return null;
        }
        
        const halfWidth = this.canvas.width / 2;
        const halfHeight = this.canvas.height / 2;
        
        return {
            x: spineX / halfWidth,
            y: spineY / halfHeight
        };
    }
    
    /**
     * 座標系診断情報を取得
     * 
     * @returns {object} 診断情報
     */
    getDiagnosticInfo() {
        if (!this.canvas) {
            return { error: 'Canvas未設定' };
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        return {
            canvas: {
                width: this.canvas.width,
                height: this.canvas.height,
                displayWidth: this.canvas.clientWidth,
                displayHeight: this.canvas.clientHeight,
                centerX: this.canvas.width / 2,
                centerY: this.canvas.height / 2
            },
            viewport: {
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height
            },
            system: {
                devicePixelRatio: dpr,
                debugMode: this.debugMode,
                transformCount: this.transformCount
            },
            lastTransform: this.lastTransform
        };
    }
    
    /**
     * デバッグモードの切り替え
     * 
     * @param {boolean} enabled - デバッグモード有効/無効
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`🔧 統一座標システム デバッグモード: ${enabled ? 'ON' : 'OFF'}`);
    }
    
    /**
     * 統計情報をリセット
     */
    resetStats() {
        this.transformCount = 0;
        this.lastTransform = null;
        
        if (this.debugMode) {
            console.log('📊 統計情報をリセットしました');
        }
    }
    
    /**
     * テスト関数: 座標変換の一貫性を検証
     * 
     * @param {number} clientX - テスト用クライアントX座標
     * @param {number} clientY - テスト用クライアントY座標
     * @returns {object} テスト結果
     */
    testCoordinateConsistency(clientX, clientY) {
        if (!this.canvas) {
            return { error: 'Canvas未設定' };
        }
        
        // Forward変換
        const spineCoords = this.clientToSpineCoordinates(clientX, clientY);
        if (!spineCoords) {
            return { error: 'Forward変換失敗' };
        }
        
        // Reverse変換
        const backToClient = this.spineToClientCoordinates(spineCoords.x, spineCoords.y);
        if (!backToClient) {
            return { error: 'Reverse変換失敗' };
        }
        
        // 誤差計算
        const errorX = Math.abs(clientX - backToClient.x);
        const errorY = Math.abs(clientY - backToClient.y);
        const maxError = Math.max(errorX, errorY);
        
        return {
            input: { x: clientX, y: clientY },
            spine: spineCoords,
            output: backToClient,
            error: { x: errorX, y: errorY, max: maxError },
            isConsistent: maxError < 0.1 // 0.1px以下なら一貫性あり
        };
    }
}

/**
 * グローバル関数として座標システムインスタンスを提供
 */
window.UnifiedCoordinateSystem = UnifiedCoordinateSystem;

/**
 * シンプルなファクトリ関数
 * 
 * @param {HTMLCanvasElement} canvas - Canvas要素
 * @param {object} options - オプション設定
 * @returns {UnifiedCoordinateSystem} 座標システムインスタンス
 */
export function createCoordinateSystem(canvas, options = {}) {
    const system = new UnifiedCoordinateSystem(options);
    if (canvas) {
        system.setCanvas(canvas);
    }
    return system;
}

/**
 * デバッグ用グローバル関数
 */
window.testUnifiedCoordinates = function(canvas, x = 200, y = 150) {
    if (!canvas) {
        console.error('❌ Canvas要素が必要です');
        return;
    }
    
    const system = createCoordinateSystem(canvas, { debug: true });
    const result = system.testCoordinateConsistency(x, y);
    
    console.log('🔍 統一座標システム テスト結果:');
    console.log(result);
    
    return result;
};

console.log('✅ 統一座標変換システム読み込み完了');
console.log('使用方法: const system = createCoordinateSystem(canvas, {debug: true})');
console.log('テスト方法: testUnifiedCoordinates(canvas)');