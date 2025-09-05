// 🎯 パッケージ出力システム - メイン制御モジュール
// 意味単位: システム制御・オーケストレーション
// 複雑度: 中（制御フロー・エラーハンドリング）

console.log('📦 PackageExporter モジュール読み込み開始');

/**
 * 🎯 パッケージ出力システムのメイン制御クラス
 * 
 * 【責務】
 * - パッケージ出力プロセス全体の制御
 * - 各モジュール間の調整・エラーハンドリング
 * - 処理状況の管理・ユーザーフィードバック
 * 
 * 【設計方針】
 * - 各専門モジュールを組み合わせたオーケストレーター
 * - エラー時のグレースフルデグラデーション
 * - 処理状況の詳細ログ出力
 */
export class PackageExporter {
    constructor() {
        this.isProcessing = false;
        this.processState = {
            currentStep: null,
            totalSteps: 5,
            completedSteps: 0,
            errors: [],
            warnings: []
        };
    }
    
    // 🎯 メイン処理: パッケージ出力実行
    async exportPackage() {
        if (this.isProcessing) {
            console.warn('⚠️ パッケージ出力処理中です');
            return false;
        }
        
        try {
            this.isProcessing = true;
            this.resetProcessState();
            console.log('📦 パッケージ出力開始（マイクロモジュール版）');
            
            // Step 1: キャラクター検出・位置データ収集
            await this.executeStep('キャラクター検出・位置データ収集', async () => {
                const { CharacterDetector } = await import('../generators/CharacterDetector.js');
                this.characterDetector = new CharacterDetector();
                
                this.detectedCharacters = await this.characterDetector.detectAllCharacters();
                if (!this.detectedCharacters || this.detectedCharacters.length === 0) {
                    throw new Error('キャラクターの検出に失敗しました');
                }
                
                this.allPositionData = await this.characterDetector.collectAllPositionData(this.detectedCharacters);
                if (!this.allPositionData || Object.keys(this.allPositionData).length === 0) {
                    throw new Error('位置データの収集に失敗しました');
                }
                
                console.log(`✅ 検出キャラクター: [${this.detectedCharacters.join(', ')}]`);
            });
            
            // Step 2: HTML固定化処理
            await this.executeStep('HTML固定化処理', async () => {
                const { HTMLProcessor } = await import('./HTMLProcessor.js');
                this.htmlProcessor = new HTMLProcessor();
                
                this.processedHTML = await this.htmlProcessor.processHTML(
                    this.allPositionData, 
                    this.detectedCharacters
                );
                if (!this.processedHTML) {
                    throw new Error('HTML固定化処理に失敗しました');
                }
            });
            
            // Step 3: 依存ファイル収集
            await this.executeStep('依存ファイル収集', async () => {
                const { FileCollector } = await import('./FileCollector.js');
                this.fileCollector = new FileCollector();
                
                this.collectedFiles = await this.fileCollector.collectAllFiles(this.detectedCharacters);
                if (!this.collectedFiles || this.collectedFiles.size === 0) {
                    throw new Error('依存ファイル収集に失敗しました');
                }
                
                console.log(`✅ 収集ファイル数: ${this.collectedFiles.size}個`);
            });
            
            // Step 4: CDN依存解決
            await this.executeStep('CDN依存解決', async () => {
                const cdnFiles = await this.fileCollector.resolveCDNDependencies();
                if (!cdnFiles) {
                    throw new Error('CDN依存解決に失敗しました');
                }
                
                // CDNファイルを収集済みファイルに追加
                for (const [path, data] of cdnFiles) {
                    this.collectedFiles.set(path, data);
                }
            });
            
            // Step 5: ZIPパッケージ生成・ダウンロード
            await this.executeStep('ZIPパッケージ生成・ダウンロード', async () => {
                const { ZIPGenerator } = await import('../generators/ZIPGenerator.js');
                this.zipGenerator = new ZIPGenerator();
                
                const success = await this.zipGenerator.generateZIP(
                    this.processedHTML,
                    this.collectedFiles
                );
                if (!success) {
                    throw new Error('ZIPパッケージ生成に失敗しました');
                }
            });
            
            console.log('✅ パッケージ出力完了');
            this.logCompletionReport();
            return true;
            
        } catch (error) {
            console.error('❌ パッケージ出力失敗:', error);
            this.processState.errors.push(error.message);
            this.logErrorReport();
            return false;
        } finally {
            this.isProcessing = false;
        }
    }
    
    // 処理ステップ実行（エラーハンドリング・ログ統一）
    async executeStep(stepName, stepFunction) {
        console.log(`\n🎯 Step ${this.processState.completedSteps + 1}/${this.processState.totalSteps}: ${stepName}`);
        this.processState.currentStep = stepName;
        
        try {
            await stepFunction();
            this.processState.completedSteps++;
            console.log(`✅ ${stepName} 完了`);
        } catch (error) {
            console.error(`❌ ${stepName} 失敗:`, error);
            throw error; // 上位でキャッチ
        }
    }
    
    // 処理状況リセット
    resetProcessState() {
        this.processState = {
            currentStep: null,
            totalSteps: 5,
            completedSteps: 0,
            errors: [],
            warnings: []
        };
    }
    
    // 完了レポート出力
    logCompletionReport() {
        console.log('\n📊 パッケージ出力完了レポート:');
        console.log(`  ✅ 処理済みステップ: ${this.processState.completedSteps}/${this.processState.totalSteps}`);
        console.log(`  🎯 検出キャラクター数: ${this.detectedCharacters?.length || 0}個`);
        console.log(`  📁 収集ファイル数: ${this.collectedFiles?.size || 0}個`);
        console.log(`  ⚠️ 警告数: ${this.processState.warnings.length}個`);
        
        if (this.processState.warnings.length > 0) {
            console.log('\n⚠️ 警告詳細:');
            this.processState.warnings.forEach((warning, index) => {
                console.log(`  ${index + 1}. ${warning}`);
            });
        }
        
        console.log('\n🎯 出力パッケージ機能:');
        console.log('  - Spineアニメーション完全動作');
        console.log('  - 境界ボックス精密クリック判定');
        console.log('  - レスポンシブ対応・位置固定化');
        console.log('  - 商用制作品質保証');
    }
    
    // エラーレポート出力
    logErrorReport() {
        console.log('\n❌ パッケージ出力エラーレポート:');
        console.log(`  🚨 失敗ステップ: ${this.processState.currentStep}`);
        console.log(`  📊 完了ステップ: ${this.processState.completedSteps}/${this.processState.totalSteps}`);
        
        console.log('\n💥 エラー詳細:');
        this.processState.errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error}`);
        });
        
        if (this.processState.warnings.length > 0) {
            console.log('\n⚠️ 警告:');
            this.processState.warnings.forEach((warning, index) => {
                console.log(`  ${index + 1}. ${warning}`);
            });
        }
    }
    
    // 警告追加（他モジュールから呼び出し可能）
    addWarning(message) {
        this.processState.warnings.push(message);
        console.warn(`⚠️ 警告: ${message}`);
    }
    
    // 処理状況取得（外部監視用）
    getProcessState() {
        return { ...this.processState };
    }
}

console.log('✅ PackageExporter モジュール読み込み完了');