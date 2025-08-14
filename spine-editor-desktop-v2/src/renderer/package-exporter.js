/**
 * パッケージ出力モジュール
 * ZIP生成、HTML作成、プレビュー機能を担当
 */

export class PackageExporter {
    constructor() {
        this.spinePosition = { x: 100, y: 100 };
    }

    /**
     * Spine位置を設定
     * @param {object} position - 位置情報 {x, y}
     */
    setSpinePosition(position) {
        this.spinePosition = { ...position };
    }

    /**
     * パッケージを出力
     * @returns {object} 出力結果
     */
    async exportPackage() {
        try {
            // 出力パスを選択
            const saveResult = await window.electronAPI.saveFileDialog({
                title: 'パッケージを保存',
                defaultPath: `spine-package-${Date.now()}.zip`,
                filters: [
                    { name: 'ZIP Files', extensions: ['zip'] }
                ]
            });
            
            if (saveResult.canceled) {
                return {
                    success: false,
                    canceled: true,
                    message: 'パッケージ出力がキャンセルされました'
                };
            }
            
            const outputPath = saveResult.filePath;
            console.log('📦 出力パス:', outputPath);
            
            // 最小パッケージ作成
            const success = await this.createMinimalPackage(outputPath);
            
            if (success) {
                return {
                    success: true,
                    outputPath,
                    message: `パッケージ出力完了: ${outputPath}`
                };
            } else {
                return {
                    success: false,
                    message: 'パッケージ出力に失敗しました'
                };
            }
            
        } catch (error) {
            console.error('❌ パッケージ出力エラー:', error);
            return {
                success: false,
                message: `パッケージ出力エラー: ${error.message}`
            };
        }
    }

    /**
     * 最小パッケージ作成（Phase 0.2用）
     * @private
     * @param {string} outputPath - 出力パス
     * @returns {boolean} 作成成功可否
     */
    async createMinimalPackage(outputPath) {
        console.log('📦 Creating minimal package...');
        
        try {
            // パッケージ用HTMLを作成
            const packageHTML = this.createPackageHTML();
            
            // パッケージ用CSSを作成
            const packageCSS = this.createPackageCSS();
            
            // JSZip を動的読み込み
            await this.loadJSZip();
            
            const zip = new JSZip();
            
            // ファイルをZIPに追加
            zip.file('index.html', packageHTML);
            zip.file('styles.css', packageCSS);
            zip.file('README.md', this.createPackageReadme());
            
            // ZIP生成
            const content = await zip.generateAsync({ type: 'blob' });
            
            // ファイル書き込み
            const buffer = await content.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);
            
            const writeResult = await window.electronAPI.fs.writeFile(
                outputPath, 
                uint8Array
            );
            
            if (writeResult.success) {
                console.log('✅ Package created successfully');
                return true;
            } else {
                console.error('❌ File write failed:', writeResult.error);
                return false;
            }
            
        } catch (error) {
            console.error('❌ Package creation failed:', error);
            return false;
        }
    }

    /**
     * JSZip動的読み込み
     * @private
     */
    async loadJSZip() {
        if (window.JSZip) return;
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = () => {
                console.log('📜 JSZip loaded');
                resolve();
            };
            script.onerror = () => reject(new Error('JSZip読み込み失敗'));
            document.head.appendChild(script);
        });
    }

    /**
     * パッケージ用HTML作成
     * @private
     */
    createPackageHTML() {
        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spine Character Demo</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Spine Character Demo</h1>
        <div class="spine-area">
            <div id="spine-character" class="spine-placeholder">
                <div class="spine-icon">🎭</div>
                <p>Spine Character</p>
                <p class="position">Position: (${this.spinePosition.x}, ${this.spinePosition.y})</p>
            </div>
        </div>
        <div class="info">
            <p>Generated by Spine Editor Desktop v2.0</p>
            <p>Character positioned at: X=${this.spinePosition.x}, Y=${this.spinePosition.y}</p>
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * パッケージ用CSS作成
     * @private
     */
    createPackageCSS() {
        return `/* Spine Editor Desktop v2.0 - Package CSS */

body {
    margin: 0;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background-color: #f5f5f5;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    padding: 30px;
}

h1 {
    text-align: center;
    color: #333;
    margin-bottom: 30px;
}

.spine-area {
    position: relative;
    width: 100%;
    height: 600px;
    background: linear-gradient(45deg, #f9f9f9 0%, #e8e8e8 100%);
    border: 2px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
}

.spine-placeholder {
    position: absolute;
    left: ${this.spinePosition.x}px;
    top: ${this.spinePosition.y}px;
    width: 120px;
    height: 150px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    text-align: center;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    transform: translate(-50%, -50%);
    transition: all 0.3s ease;
}

.spine-placeholder:hover {
    transform: translate(-50%, -50%) scale(1.05);
}

.spine-icon {
    font-size: 48px;
    margin-bottom: 10px;
}

.spine-placeholder p {
    margin: 5px 0;
    font-size: 14px;
    font-weight: 500;
}

.position {
    font-size: 12px;
    opacity: 0.8;
}

.info {
    margin-top: 30px;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
    text-align: center;
}

.info p {
    margin: 5px 0;
    color: #666;
    font-size: 14px;
}

@media (max-width: 768px) {
    .container {
        margin: 10px;
        padding: 20px;
    }
    
    .spine-area {
        height: 400px;
    }
    
    .spine-placeholder {
        width: 80px;
        height: 100px;
    }
    
    .spine-icon {
        font-size: 32px;
    }
}`;
    }

    /**
     * パッケージ用README作成
     * @private
     */
    createPackageReadme() {
        return `# Spine Character Package

Generated by Spine Editor Desktop v2.0  
Created: ${new Date().toLocaleDateString()}

## Quick Start

1. Extract all files to your web server directory
2. Open \`index.html\` in a web browser
3. View your positioned Spine character

## Files

- \`index.html\` - Main HTML file
- \`styles.css\` - Character positioning styles  
- \`README.md\` - This documentation

## Character Position

- X: ${this.spinePosition.x}px
- Y: ${this.spinePosition.y}px

## Notes

This is a Phase 0.2 minimal package for demonstration purposes.
Future versions will include actual Spine WebGL rendering.

---
Created with Spine Editor Desktop v2.0`;
    }

    /**
     * パッケージプレビュー機能
     * @returns {object} プレビュー結果
     */
    async previewPackage() {
        try {
            // 一時的なHTMLを作成してプレビュー表示
            const previewHTML = this.createPackageHTML();
            const previewCSS = this.createPackageCSS();
            
            // プレビューHTMLに CSS を埋め込み
            const fullPreviewHTML = previewHTML.replace(
                '<link rel="stylesheet" href="styles.css">',
                `<style>${previewCSS}</style>`
            );
            
            // Blob URL を作成
            const blob = new Blob([fullPreviewHTML], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            // Electron API経由で新しいウィンドウを開く
            if (window.electronAPI && window.electronAPI.openURL) {
                await window.electronAPI.openURL(url);
                
                // メモリクリーンアップ
                setTimeout(() => URL.revokeObjectURL(url), 30000);
                
                return {
                    success: true,
                    message: 'プレビューウィンドウを開きました'
                };
            } else {
                // フォールバック: Blob URLを返す
                return {
                    success: true,
                    previewURL: url,
                    html: fullPreviewHTML,
                    message: 'プレビューを準備しました（インライン表示用）'
                };
            }
            
        } catch (error) {
            console.error('❌ プレビューエラー:', error);
            return {
                success: false,
                message: `プレビュー失敗: ${error.message}`
            };
        }
    }

    /**
     * 高度なパッケージ作成（将来拡張用）
     * @param {object} options - パッケージオプション
     * @returns {object} 作成結果
     */
    async createAdvancedPackage(options = {}) {
        const {
            includeSpineFiles = false,
            includeAssets = false,
            compressionLevel = 6,
            outputFormat = 'zip'
        } = options;

        try {
            console.log('📦 Creating advanced package with options:', options);
            
            // 基本パッケージ作成
            const baseResult = await this.createMinimalPackage(options.outputPath);
            
            if (!baseResult) {
                return {
                    success: false,
                    message: 'ベースパッケージの作成に失敗しました'
                };
            }

            // 追加ファイルの処理（将来実装）
            if (includeSpineFiles) {
                console.log('📁 Spineファイルを含める処理（未実装）');
            }

            if (includeAssets) {
                console.log('🎨 アセットファイルを含める処理（未実装）');
            }

            return {
                success: true,
                message: '高度なパッケージが作成されました（基本機能のみ）'
            };

        } catch (error) {
            console.error('❌ 高度なパッケージ作成エラー:', error);
            return {
                success: false,
                message: `高度なパッケージ作成エラー: ${error.message}`
            };
        }
    }

    /**
     * パッケージ設定をエクスポート
     * @returns {object} パッケージ設定
     */
    exportSettings() {
        return {
            spinePosition: { ...this.spinePosition },
            packageVersion: '2.0',
            timestamp: Date.now()
        };
    }

    /**
     * パッケージ設定をインポート
     * @param {object} settings - パッケージ設定
     * @returns {boolean} インポート成功可否
     */
    importSettings(settings) {
        try {
            if (settings.spinePosition) {
                this.spinePosition = { ...settings.spinePosition };
            }
            console.log('✅ パッケージ設定インポート完了');
            return true;
        } catch (error) {
            console.error('❌ パッケージ設定インポートエラー:', error);
            return false;
        }
    }

    /**
     * テンプレートHTML作成（カスタマイズ用）
     * @param {object} templateOptions - テンプレートオプション
     * @returns {string} HTML文字列
     */
    createCustomHTML(templateOptions = {}) {
        const {
            title = 'Spine Character Demo',
            characterName = 'Character',
            backgroundColor = '#f5f5f5',
            characterIcon = '🎭'
        } = templateOptions;

        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body style="background-color: ${backgroundColor};">
    <div class="container">
        <h1>${title}</h1>
        <div class="spine-area">
            <div id="spine-character" class="spine-placeholder">
                <div class="spine-icon">${characterIcon}</div>
                <p>${characterName}</p>
                <p class="position">Position: (${this.spinePosition.x}, ${this.spinePosition.y})</p>
            </div>
        </div>
        <div class="info">
            <p>Generated by Spine Editor Desktop v2.0</p>
            <p>Character positioned at: X=${this.spinePosition.x}, Y=${this.spinePosition.y}</p>
        </div>
    </div>
</body>
</html>`;
    }
}