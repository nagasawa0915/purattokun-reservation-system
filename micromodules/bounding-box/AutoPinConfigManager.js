/**
 * AutoPinConfigManager.js
 * 
 * 🎯 自動ピンシステム設定管理モジュール
 * - 責務: 設定管理・初期化・パフォーマンス監視
 * - 外部依存: なし（完全独立）
 * - 行数: 約300行（500行制限遵守）
 * - 作成日: 2025-09-05
 */

class AutoPinConfigManager {
    constructor() {
        // 背景検出設定
        this.detectionConfig = {
            minWidth: 200,
            minHeight: 200,
            maxSearchDepth: 5,
            fallbackToBody: true
        };
        
        // アンカーポイント設定
        this.anchorConfig = {
            gridX: [0.33, 0.67], // 3分割の境界線
            gridY: [0.33, 0.67],
            defaultAnchor: 'MC'
        };
        
        // スケーリング設定
        this.scalingConfig = {
            // 'contain': 縦横比保持、全体が見える（Math.min）
            // 'cover': 縦横比保持、領域を満たす（Math.max）
            mode: 'contain', // 歪み防止のためcontain推奨
            uniformOnly: true // 常に uniform scaling を使用
        };
        
        // パフォーマンス監視
        this.performanceMetrics = {
            totalProcessingTime: 0,
            successCount: 0,
            failureCount: 0,
            averageTime: 0
        };
        
        console.log('⚙️ AutoPinConfigManager初期化完了');
    }
    
    // ==========================================
    // ⚙️ 設定管理メソッド
    // ==========================================
    
    /**
     * スケーリングモードを変更
     * @param {string} mode - 'contain' または 'cover'
     */
    setScalingMode(mode) {
        if (mode === 'contain' || mode === 'cover') {
            this.scalingConfig.mode = mode;
            console.log(`🎯 スケーリングモード変更: ${mode}`);
        } else {
            console.warn('⚠️ 無効なスケーリングモード:', mode);
        }
    }
    
    /**
     * 現在の設定を取得
     */
    getConfig() {
        return {
            scaling: { ...this.scalingConfig },
            anchor: { ...this.anchorConfig },
            detection: { ...this.detectionConfig }
        };
    }
    
    /**
     * 背景検出設定の更新
     * @param {Object} newConfig - 新しい検出設定
     */
    updateDetectionConfig(newConfig) {
        Object.assign(this.detectionConfig, newConfig);
        console.log('🔍 背景検出設定更新:', this.detectionConfig);
    }
    
    /**
     * アンカー設定の更新
     * @param {Object} newConfig - 新しいアンカー設定
     */
    updateAnchorConfig(newConfig) {
        Object.assign(this.anchorConfig, newConfig);
        console.log('📍 アンカー設定更新:', this.anchorConfig);
    }
    
    /**
     * スケーリング設定の更新
     * @param {Object} newConfig - 新しいスケーリング設定
     */
    updateScalingConfig(newConfig) {
        Object.assign(this.scalingConfig, newConfig);
        console.log('🎯 スケーリング設定更新:', this.scalingConfig);
    }
    
    /**
     * 設定の一括更新
     * @param {Object} newConfig - 新しい設定
     */
    updateConfig(newConfig) {
        if (newConfig.detection) {
            this.updateDetectionConfig(newConfig.detection);
        }
        
        if (newConfig.anchor) {
            this.updateAnchorConfig(newConfig.anchor);
        }
        
        if (newConfig.scaling) {
            this.updateScalingConfig(newConfig.scaling);
        }
        
        console.log('⚙️ AutoPin設定一括更新完了');
    }
    
    // ==========================================
    // 📊 パフォーマンス監視メソッド
    // ==========================================
    
    /**
     * パフォーマンスメトリクスの更新
     * @param {number} processingTime - 処理時間（ms）
     * @param {boolean} success - 成功フラグ
     */
    updatePerformanceMetrics(processingTime, success) {
        this.performanceMetrics.totalProcessingTime += processingTime;
        
        if (success) {
            this.performanceMetrics.successCount++;
        } else {
            this.performanceMetrics.failureCount++;
        }
        
        const totalOperations = this.performanceMetrics.successCount + this.performanceMetrics.failureCount;
        this.performanceMetrics.averageTime = totalOperations > 0 
            ? this.performanceMetrics.totalProcessingTime / totalOperations 
            : 0;
        
        console.log('📊 パフォーマンス更新:', {
            processingTime: `${processingTime.toFixed(2)}ms`,
            success,
            averageTime: `${this.performanceMetrics.averageTime.toFixed(2)}ms`,
            totalOperations
        });
    }
    
    /**
     * パフォーマンスメトリクスの取得
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }
    
    /**
     * パフォーマンスメトリクスのリセット
     */
    resetPerformanceMetrics() {
        this.performanceMetrics = {
            totalProcessingTime: 0,
            successCount: 0,
            failureCount: 0,
            averageTime: 0
        };
        console.log('📊 パフォーマンスメトリクスリセット完了');
    }
    
    // ==========================================
    // 🔧 ユーティリティメソッド
    // ==========================================
    
    /**
     * 設定の妥当性検証
     * @returns {Object} 検証結果
     */
    validateConfig() {
        const issues = [];
        
        // 検出設定の検証
        if (this.detectionConfig.minWidth < 50) {
            issues.push('最小幅が小さすぎます（推奨: 50px以上）');
        }
        
        if (this.detectionConfig.minHeight < 50) {
            issues.push('最小高さが小さすぎます（推奨: 50px以上）');
        }
        
        if (this.detectionConfig.maxSearchDepth > 10) {
            issues.push('最大検索深度が大きすぎます（推奨: 10以下）');
        }
        
        // アンカー設定の検証
        if (this.anchorConfig.gridX.some(val => val < 0 || val > 1)) {
            issues.push('X軸グリッド値が範囲外です（0.0-1.0）');
        }
        
        if (this.anchorConfig.gridY.some(val => val < 0 || val > 1)) {
            issues.push('Y軸グリッド値が範囲外です（0.0-1.0）');
        }
        
        // スケーリング設定の検証
        if (!['contain', 'cover'].includes(this.scalingConfig.mode)) {
            issues.push('無効なスケーリングモードです');
        }
        
        const isValid = issues.length === 0;
        console.log('🔧 設定妥当性検証:', { isValid, issues });
        
        return {
            isValid,
            issues,
            config: this.getConfig()
        };
    }
    
    /**
     * デバッグ情報の取得
     */
    getDebugInfo() {
        return {
            version: '1.0',
            className: 'AutoPinConfigManager',
            config: this.getConfig(),
            performance: this.getPerformanceMetrics(),
            validation: this.validateConfig(),
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * 設定のエクスポート（JSON）
     */
    exportConfig() {
        return JSON.stringify({
            version: '1.0',
            timestamp: new Date().toISOString(),
            config: this.getConfig()
        }, null, 2);
    }
    
    /**
     * 設定のインポート（JSON）
     * @param {string} configJson - JSON形式の設定
     */
    importConfig(configJson) {
        try {
            const imported = JSON.parse(configJson);
            if (imported.config) {
                this.updateConfig(imported.config);
                console.log('📥 設定インポート完了:', imported.version);
                return { success: true };
            } else {
                throw new Error('無効な設定フォーマット');
            }
        } catch (error) {
            console.error('❌ 設定インポートエラー:', error.message);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }
    
    /**
     * 完全リセット
     */
    reset() {
        // デフォルト設定に戻す
        this.detectionConfig = {
            minWidth: 200,
            minHeight: 200,
            maxSearchDepth: 5,
            fallbackToBody: true
        };
        
        this.anchorConfig = {
            gridX: [0.33, 0.67],
            gridY: [0.33, 0.67],
            defaultAnchor: 'MC'
        };
        
        this.scalingConfig = {
            mode: 'contain',
            uniformOnly: true
        };
        
        this.resetPerformanceMetrics();
        
        console.log('🔄 AutoPinConfigManager完全リセット完了');
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.AutoPinConfigManager = AutoPinConfigManager;
}