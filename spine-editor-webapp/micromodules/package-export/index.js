// 🎯 パッケージ出力システム - メインエントリポイント
// 意味単位: モジュール統合・外部インターフェース
// 複雑度: 低（統合・エクスポート）

console.log('📦 PackageExportSystem メインモジュール読み込み開始');

// === メインクラスのインポート ===
import { PackageExporter } from './core/PackageExporter.js';
import { ExportConfig } from './config/ExportConfig.js';

/**
 * 🎯 パッケージ出力システム - 統合インターフェース
 * 
 * 【提供機能】
 * - シンプルAPI: exportPackage() 一発実行
 * - 詳細制御: PackageExporter, ExportConfig クラス直接利用
 * - 設定カスタマイズ: config経由での詳細設定変更
 * - 状況監視: 処理状況・エラー情報の取得
 * 
 * 【使用例】
 * // 基本使用
 * await PackageExportSystem.exportPackage();
 * 
 * // 詳細制御
 * const exporter = new PackageExportSystem.PackageExporter();
 * const success = await exporter.exportPackage();
 * 
 * // 設定変更
 * PackageExportSystem.config.set('output.compression.level', 9);
 */
class PackageExportSystem {
    constructor() {
        this.packageExporter = null;
        this.config = new ExportConfig();
        this.isInitialized = false;
    }
    
    // 初期化
    async initialize() {
        if (this.isInitialized) {
            return true;
        }
        
        try {
            console.log('🔧 PackageExportSystem 初期化開始');
            
            // 設定検証
            if (!this.config.validateConfig()) {
                throw new Error('設定検証に失敗しました');
            }
            
            // PackageExporter インスタンス作成
            this.packageExporter = new PackageExporter();
            
            this.isInitialized = true;
            console.log('✅ PackageExportSystem 初期化完了');
            
            // 設定情報ログ出力
            this.config.logConfig();
            
            return true;
            
        } catch (error) {
            console.error('❌ PackageExportSystem 初期化失敗:', error);
            return false;
        }
    }
    
    // 🎯 メイン機能: パッケージ出力実行
    async exportPackage() {
        try {
            // 自動初期化
            if (!this.isInitialized) {
                const success = await this.initialize();
                if (!success) {
                    throw new Error('システム初期化に失敗しました');
                }
            }
            
            console.log('📦 パッケージ出力開始（マイクロモジュール版）');
            
            // PackageExporter経由で実行
            const success = await this.packageExporter.exportPackage();
            
            if (success) {
                console.log('✅ パッケージ出力成功');
                this.logSuccessReport();
            } else {
                console.error('❌ パッケージ出力失敗');
                this.logFailureReport();
            }
            
            return success;
            
        } catch (error) {
            console.error('❌ パッケージ出力エラー:', error);
            this.logFailureReport(error);
            return false;
        }
    }
    
    // 処理状況取得
    getProcessState() {
        if (!this.packageExporter) {
            return { status: 'not_initialized' };
        }
        
        return {
            status: 'initialized',
            ...this.packageExporter.getProcessState()
        };
    }
    
    // 設定取得
    getConfig() {
        return this.config;
    }
    
    // 成功レポート出力
    logSuccessReport() {
        console.log('\n🎉 パッケージ出力成功レポート:');
        console.log('  📦 マイクロモジュール版による出力完了');
        console.log('  🎯 含まれる機能:');
        console.log('    - Spineアニメーション完全動作');
        console.log('    - 境界ボックス精密クリック判定');
        console.log('    - レスポンシブ対応・位置固定化');
        console.log('    - 商用制作品質保証');
        console.log('  ⚡ マイクロモジュール化の効果:');
        console.log('    - コード保守性向上');
        console.log('    - 機能別テスト・デバッグ容易化');
        console.log('    - 再利用性・拡張性確保');
    }
    
    // 失敗レポート出力
    logFailureReport(error = null) {
        console.log('\n❌ パッケージ出力失敗レポート:');
        if (error) {
            console.log('  🚨 エラー詳細:', error.message);
        }
        
        const processState = this.getProcessState();
        if (processState.errors && processState.errors.length > 0) {
            console.log('  💥 発生したエラー:');
            processState.errors.forEach((err, index) => {
                console.log(`    ${index + 1}. ${err}`);
            });
        }
        
        console.log('  🔧 デバッグ情報:');
        console.log('    - F12コンソールで詳細ログを確認');
        console.log('    - 各モジュールの個別状況を確認');
        console.log('    - ネットワーク状況・ファイル存在確認');
    }
    
    // システム情報出力
    logSystemInfo() {
        console.log('\n📋 PackageExportSystem システム情報:');
        console.log(`  🔧 初期化状況: ${this.isInitialized ? '✅完了' : '❌未完了'}`);
        console.log(`  ⚙️ 設定検証: ${this.config.validateConfig() ? '✅正常' : '❌異常'}`);
        console.log('  📦 利用可能モジュール:');
        console.log('    - PackageExporter: パッケージ出力制御');
        console.log('    - CharacterDetector: キャラクター検出・位置データ収集');
        console.log('    - HTMLProcessor: HTML固定化処理');
        console.log('    - FileCollector: ファイル収集・依存関係解決');
        console.log('    - ZIPGenerator: ZIP生成・ダウンロード');
        console.log('    - CSSGenerator: 位置データCSS変換');
        console.log('    - ExportConfig: 設定管理');
    }
}

// === グローバルインスタンス作成・エクスポート ===
const packageExportSystemInstance = new PackageExportSystem();

// === 外部インターフェース ===

/**
 * パッケージ出力実行関数（簡易API）
 * 既存システムとの互換性保持
 */
async function exportPackage() {
    return await packageExportSystemInstance.exportPackage();
}

// === グローバルエクスポート ===
// 既存システムとの互換性確保
if (typeof window !== 'undefined') {
    window.PackageExportSystem = packageExportSystemInstance;
    window.exportPackage = exportPackage;
    
    console.log('✅ グローバルオブジェクト設定完了:', {
        PackageExportSystem: typeof window.PackageExportSystem,
        exportPackage: typeof window.exportPackage
    });
}

// ES6 モジュールエクスポート
export { 
    packageExportSystemInstance as default,
    PackageExporter,
    ExportConfig,
    exportPackage
};

// === 読み込み完了イベント発火 ===
if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('PackageExportSystemLoaded', {
        detail: { 
            PackageExportSystem: packageExportSystemInstance, 
            exportPackage,
            version: '2.0.0-micromodule'
        }
    }));
    console.log('✅ PackageExportSystemLoaded イベント発火');
}

console.log('✅ PackageExportSystem メインモジュール読み込み完了');
console.log('🎯 マイクロモジュール版 - モジュール化による保守性・拡張性向上');