// 🎯 パッケージ出力システム - ZIP生成・ダウンロードモジュール
// 意味単位: ZIP作成・ブラウザダウンロード
// 複雑度: 中（JSZip操作・Blob処理）

console.log('🗜️ ZIPGenerator モジュール読み込み開始');

/**
 * 🗜️ ZIPパッケージ生成・ダウンロードクラス
 * 
 * 【責務】
 * - JSZipライブラリの動的読み込み
 * - 処理済みHTML・収集ファイルのZIP統合
 * - ZIPファイル生成・ブラウザダウンロード実行
 * 
 * 【機能】
 * - バイナリ・テキストファイル対応
 * - 元パス構造保持
 * - タイムスタンプ付きファイル名生成
 */
export class ZIPGenerator {
    constructor() {
        this.jszip = null;
    }
    
    // 🗜️ メイン処理: ZIPパッケージ生成・ダウンロード
    async generateZIP(processedHTML, collectedFiles) {
        console.log('🗜️ ZIPパッケージ生成開始');
        
        try {
            // 1. JSZipライブラリ読み込み
            const JSZip = await this.loadJSZip();
            const zip = new JSZip();
            
            // 2. HTMLファイル追加
            zip.file('index.html', processedHTML);
            console.log('📄 index.html追加完了');
            
            // 3. 収集したファイルを追加
            console.log(`📁 収集ファイル追加開始: ${collectedFiles.size}個`);
            for (const [filePath, fileData] of collectedFiles) {
                const targetPath = this.getTargetPath(filePath);
                
                if (fileData.type === 'binary') {
                    zip.file(targetPath, fileData.content, { binary: true });
                } else {
                    zip.file(targetPath, fileData.content);
                }
                
                console.log(`📁 ファイル追加: ${filePath} → ${targetPath} (${fileData.type})`);
            }
            
            // 4. ZIPファイル生成
            console.log('🔧 ZIPファイル生成中...');
            const zipBlob = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });
            
            // 5. ダウンロード実行
            const filename = this.generateFilename();
            this.downloadZIP(zipBlob, filename);
            
            console.log(`✅ ZIPパッケージ生成・ダウンロード完了: ${filename}`);
            return true;
            
        } catch (error) {
            console.error('❌ ZIPパッケージ生成エラー:', error);
            return false;
        }
    }
    
    // ターゲットパス取得（パス構造保持）
    getTargetPath(originalPath) {
        // 元のパス構造を維持
        return originalPath;
    }
    
    // ファイル名生成（タイムスタンプ付き）
    generateFilename() {
        const timestamp = new Date().toISOString()
            .slice(0, 19)           // YYYY-MM-DDTHH:mm:ss
            .replace(/:/g, '-')     // コロンをハイフンに変換
            .replace('T', '_');     // TをアンダースコアToに変換
        
        return `spine-project-package-${timestamp}.zip`;
    }
    
    // ZIPファイルダウンロード実行
    downloadZIP(zipBlob, filename) {
        console.log(`📥 ZIPダウンロード実行: ${filename}`);
        
        try {
            // ダウンロードリンク作成
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(zipBlob);
            downloadLink.download = filename;
            
            // 一時的にDOMに追加してクリック実行
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // メモリクリーンアップ
            setTimeout(() => {
                URL.revokeObjectURL(downloadLink.href);
            }, 100);
            
            console.log(`✅ ダウンロード成功: ${filename}`);
            
        } catch (error) {
            console.error('❌ ダウンロード失敗:', error);
            throw error;
        }
    }
    
    // JSZipライブラリ動的読み込み
    async loadJSZip() {
        if (typeof JSZip !== 'undefined') {
            console.log('📚 JSZip既に読み込み済み');
            return JSZip;
        }
        
        console.log('📚 JSZipライブラリ動的読み込み開始');
        
        // JSZipライブラリの動的読み込み
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        
        return new Promise((resolve, reject) => {
            script.onload = () => {
                console.log('✅ JSZipライブラリ読み込み成功');
                resolve(JSZip);
            };
            script.onerror = () => {
                console.error('❌ JSZipライブラリ読み込み失敗');
                reject(new Error('JSZipライブラリの読み込みに失敗しました'));
            };
            document.head.appendChild(script);
        });
    }
    
    // ZIP生成設定取得
    getCompressionConfig() {
        return {
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: {
                level: 6  // 圧縮レベル（0-9, 6=デフォルト）
            }
        };
    }
    
    // ZIP情報取得（生成前）
    async getZIPInfo(processedHTML, collectedFiles) {
        const info = {
            htmlSize: new Blob([processedHTML]).size,
            totalFiles: collectedFiles.size + 1, // +1 for index.html
            estimatedSize: 0,
            filesByType: {}
        };
        
        // HTML サイズ
        info.estimatedSize += info.htmlSize;
        
        // 収集ファイルサイズ計算
        for (const [filePath, fileData] of collectedFiles) {
            const fileSize = fileData.type === 'binary' 
                ? fileData.content.byteLength 
                : new Blob([fileData.content]).size;
            
            info.estimatedSize += fileSize;
            
            const extension = filePath.split('.').pop().toLowerCase();
            if (!info.filesByType[extension]) {
                info.filesByType[extension] = { count: 0, size: 0 };
            }
            info.filesByType[extension].count++;
            info.filesByType[extension].size += fileSize;
        }
        
        return info;
    }
    
    // ZIP生成前情報ログ
    async logZIPInfo(processedHTML, collectedFiles) {
        const info = await this.getZIPInfo(processedHTML, collectedFiles);
        
        console.log('\n📊 ZIP生成情報:');
        console.log(`  📄 HTML サイズ: ${(info.htmlSize / 1024).toFixed(2)} KB`);
        console.log(`  📁 総ファイル数: ${info.totalFiles}個`);
        console.log(`  📊 予想サイズ: ${(info.estimatedSize / 1024).toFixed(2)} KB`);
        
        console.log('\n📋 ファイル種別内訳:');
        for (const [extension, data] of Object.entries(info.filesByType)) {
            console.log(`  .${extension}: ${data.count}個, ${(data.size / 1024).toFixed(2)} KB`);
        }
    }
}

console.log('✅ ZIPGenerator モジュール読み込み完了');