// 🎯 パッケージ出力システム - ファイル収集・依存関係解決モジュール
// 意味単位: ファイル収集・CDN解決
// 複雑度: 中（HTTP通信・ファイル種別判定）

console.log('📁 FileCollector モジュール読み込み開始');

/**
 * 📁 ファイル収集・依存関係解決クラス
 * 
 * 【責務】
 * - 全キャラクター用ファイルの自動収集
 * - 共通ファイル（画像・統合・境界ボックス）の収集
 * - CDN依存ファイルのローカル化
 * - ファイル存在確認・フォールバック処理
 * 
 * 【収集対象】
 * 1. キャラクター固有: Spineファイル・キャラクター画像
 * 2. 共通ファイル: 背景画像・統合システム
 * 3. 境界ボックス: 精密クリック判定システム
 * 4. CDNファイル: Spine WebGL ライブラリ
 */
export class FileCollector {
    constructor() {
        this.collectedFiles = new Map();
        this.config = this.getDefaultConfig();
    }
    
    // デフォルト設定取得
    getDefaultConfig() {
        return {
            spineWebGLCDN: 'https://unpkg.com/@esotericsoftware/spine-webgl@4.1.24/dist/iife/spine-webgl.js',
            staticFiles: {
                imageFiles: [
                    'assets/images/クラウドパートナーTOP.png'  // 背景画像（共通）
                ],
                integrationFiles: [
                    // Note: spine-integration-v2.js と spine-character-manager.js は
                    // アーカイブ済みのため削除 (2025-09-05)
                ],
                boundingBoxFiles: [
                    'assets/spine/spine-skeleton-bounds.js',
                    'spine-bounds-integration.js'
                ]
            }
        };
    }
    
    // 🎯 全ファイル収集（完全パッケージ版）
    async collectAllFiles(detectedCharacters) {
        console.log('📁 依存ファイル収集開始（完全パッケージ版）');
        
        try {
            this.collectedFiles.clear();
            
            // 🎯 全キャラクター用ファイル収集
            console.log(`🐈 全キャラクターファイル収集: [${detectedCharacters.join(', ')}]`);
            await this.collectCharacterFiles(detectedCharacters);
            
            // 3. 共通画像ファイル収集（背景等）
            console.log('🖼️ 共通画像ファイル収集');
            await this.collectStaticFiles(this.config.staticFiles.imageFiles);
            
            // 4. 統合ファイル収集
            console.log('📚 統合ファイル収集');
            await this.collectStaticFiles(this.config.staticFiles.integrationFiles);
            
            // 5. 境界ボックス精密クリック判定システム収集
            console.log('🎯 境界ボックス精密クリック判定システム収集');
            await this.collectStaticFiles(this.config.staticFiles.boundingBoxFiles);
            
            console.log(`✅ 依存ファイル収集完了（汎用化版）: ${this.collectedFiles.size}個`);
            return this.collectedFiles;
            
        } catch (error) {
            console.error('❌ 依存ファイル収集エラー:', error);
            throw error;
        }
    }
    
    // キャラクター固有ファイル収集
    async collectCharacterFiles(detectedCharacters) {
        const { CharacterDetector } = await import('../generators/CharacterDetector.js');
        const characterDetector = new CharacterDetector();
        
        for (const characterName of detectedCharacters) {
            console.log(`\n🎯 === ${characterName}キャラクターファイル収集開始 ===`);
            
            const characterFiles = characterDetector.generateCharacterFiles(characterName);
            
            // 1. キャラクター固有Spineファイル収集
            console.log(`🎨 ${characterName} Spineファイル収集`);
            for (const filePath of characterFiles.spineFiles) {
                if (!await this.collectFileWithFallback(filePath)) {
                    console.warn(`⚠️ ${characterName} Spineファイル収集失敗（継続）: ${filePath}`);
                }
            }
            
            // 2. キャラクター固有画像ファイル収集
            console.log(`🖼️ ${characterName} 画像ファイル収集`);
            for (const filePath of characterFiles.characterImageFiles) {
                if (!await this.collectFileWithFallback(filePath)) {
                    console.log(`ℹ️ ${characterName} 画像ファイルスキップ: ${filePath}`);
                }
            }
            
            console.log(`✅ ${characterName}ファイル収集完了`);
        }
    }
    
    // 静的ファイル収集
    async collectStaticFiles(filePaths) {
        for (const filePath of filePaths) {
            if (!await this.collectFileWithFallback(filePath)) {
                console.warn(`⚠️ 静的ファイル収集失敗（継続）: ${filePath}`);
            }
        }
    }
    
    // 🛡️ フォールバック付きファイル収集（存在確認付き）
    async collectFileWithFallback(filePath) {
        try {
            const success = await this.collectFile(filePath);
            if (success) {
                console.log(`✅ ファイル収集成功: ${filePath}`);
                return true;
            } else {
                console.log(`🔄 ファイルが見つからないためスキップ: ${filePath}`);
                return false;
            }
        } catch (error) {
            console.log(`🔄 ファイル収集エラー、継続: ${filePath}`, error.message);
            return false;
        }
    }
    
    // 個別ファイル収集
    async collectFile(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                console.warn(`⚠️ ファイル取得失敗: ${filePath} (${response.status})`);
                return false;
            }
            
            const fileType = this.getFileType(filePath);
            let content;
            
            if (fileType === 'binary') {
                content = await response.arrayBuffer();
            } else {
                content = await response.text();
            }
            
            this.collectedFiles.set(filePath, { content, type: fileType });
            console.log(`✅ ファイル収集成功: ${filePath} (${fileType})`);
            return true;
            
        } catch (error) {
            console.warn(`⚠️ ファイル収集エラー: ${filePath}`, error);
            return false;
        }
    }
    
    // ファイルタイプ判定
    getFileType(filePath) {
        const extension = filePath.split('.').pop().toLowerCase();
        
        const binaryExtensions = ['png', 'jpg', 'jpeg', 'gif', 'ico', 'atlas'];
        const textExtensions = ['js', 'json', 'html', 'css', 'txt'];
        
        if (binaryExtensions.includes(extension)) return 'binary';
        if (textExtensions.includes(extension)) return 'text';
        
        return 'text'; // デフォルトはテキスト
    }
    
    // 🌐 CDN依存解決
    async resolveCDNDependencies() {
        console.log('🌐 CDN依存解決開始');
        
        try {
            // Spine WebGL ライブラリのダウンロード
            const response = await fetch(this.config.spineWebGLCDN);
            if (!response.ok) {
                throw new Error(`Spine WebGL CDN取得失敗: ${response.status}`);
            }
            
            const spineWebGLContent = await response.text();
            const cdnFiles = new Map();
            cdnFiles.set('assets/js/libs/spine-webgl.js', { content: spineWebGLContent, type: 'text' });
            
            console.log('✅ CDN依存解決完了');
            return cdnFiles;
            
        } catch (error) {
            console.error('❌ CDN依存解決エラー:', error);
            throw error;
        }
    }
    
    // ターゲットパス取得（ZIPGenerator用）
    getTargetPath(originalPath) {
        // 元のパス構造を維持
        return originalPath;
    }
    
    // 収集ファイル情報取得
    getCollectionReport() {
        const report = {
            totalFiles: this.collectedFiles.size,
            filesByType: {},
            filePaths: []
        };
        
        for (const [filePath, fileData] of this.collectedFiles) {
            const type = fileData.type;
            if (!report.filesByType[type]) {
                report.filesByType[type] = 0;
            }
            report.filesByType[type]++;
            report.filePaths.push(filePath);
        }
        
        return report;
    }
    
    // 収集状況ログ出力
    logCollectionStatus() {
        const report = this.getCollectionReport();
        
        console.log('\n📊 ファイル収集状況レポート:');
        console.log(`  📁 総ファイル数: ${report.totalFiles}個`);
        console.log('  📊 種別内訳:', report.filesByType);
        
        console.log('\n📋 収集ファイル一覧:');
        report.filePaths.forEach((filePath, index) => {
            console.log(`  ${index + 1}. ${filePath}`);
        });
    }
}

console.log('✅ FileCollector モジュール読み込み完了');