// 🎯 Spine Editor Desktop - Package Export Integration
// 既存spine-package-exportシステムのデスクトップアプリ適応版

console.log('📦 Package Export Integration モジュール読み込み開始');

// ========== デスクトップ版パッケージエクスポートマネージャー ========== //
class DesktopPackageExportManager {
    constructor(app) {
        this.app = app; // SpineEditorApp インスタンス
        this.isProcessing = false;
        this.exportData = null;
        
        console.log('✅ DesktopPackageExportManager 初期化完了');
    }

    // パッケージエクスポート実行
    async exportPackage() {
        if (this.isProcessing) {
            console.warn('⚠️ パッケージ出力処理中です');
            this.app.showNotification('パッケージ出力処理中です', 'warning');
            return false;
        }

        try {
            this.isProcessing = true;
            console.log('📦 デスクトップ版パッケージ出力開始');

            // Step 1: 出力可能性チェック
            if (!this.validateExportConditions()) {
                return false;
            }

            // Step 2: エクスポートデータ準備
            console.log('📋 Step 1: エクスポートデータ準備');
            this.exportData = await this.prepareExportData();
            if (!this.exportData) {
                throw new Error('エクスポートデータの準備に失敗しました');
            }

            // Step 3: HTML固定化処理
            console.log('🔧 Step 2: HTML固定化処理');
            const fixedHTML = await this.generateFixedHTML();
            if (!fixedHTML) {
                throw new Error('HTML固定化処理に失敗しました');
            }

            // Step 4: 依存ファイル収集
            console.log('📁 Step 3: 依存ファイル収集');
            const dependencies = await this.collectDependencyFiles();
            if (!dependencies || dependencies.length === 0) {
                throw new Error('依存ファイル収集に失敗しました');
            }

            // Step 5: パッケージ生成
            console.log('📦 Step 4: パッケージ生成');
            const packageData = await this.generatePackage(fixedHTML, dependencies);
            if (!packageData) {
                throw new Error('パッケージ生成に失敗しました');
            }

            // Step 6: ファイル出力
            console.log('💾 Step 5: ファイル出力');
            const success = await this.savePackageToFile(packageData);
            
            if (success) {
                console.log('✅ デスクトップ版パッケージ出力完了');
                this.app.showNotification('パッケージエクスポートが完了しました', 'success');
                return true;
            } else {
                throw new Error('ファイル出力に失敗しました');
            }

        } catch (error) {
            console.error('❌ パッケージ出力エラー:', error);
            this.app.showNotification(`パッケージ出力に失敗しました: ${error.message}`, 'error');
            return false;
        } finally {
            this.isProcessing = false;
        }
    }

    // エクスポート条件チェック
    validateExportConditions() {
        const { project, characters } = this.app.state;

        // プロジェクト設定チェック
        if (!project.homePageFolder) {
            this.app.showNotification('ホームページフォルダが設定されていません', 'error');
            return false;
        }

        if (!project.spineCharactersFolder) {
            this.app.showNotification('Spineキャラクターフォルダが設定されていません', 'error');
            return false;
        }

        // キャラクターチェック
        if (characters.size === 0) {
            this.app.showNotification('エクスポートするキャラクターがありません', 'error');
            return false;
        }

        console.log('✅ エクスポート条件チェック完了');
        return true;
    }

    // エクスポートデータ準備
    async prepareExportData() {
        try {
            const exportData = {
                version: "4.0",
                generatedAt: new Date().toISOString(),
                project: {
                    name: this.app.state.project.name,
                    homePageFolder: this.app.state.project.homePageFolder,
                    spineCharactersFolder: this.app.state.project.spineCharactersFolder
                },
                placements: {},
                timeline: {
                    version: "1.0",
                    duration: this.app.state.ui.totalTime,
                    tracks: []
                },
                manifest: {
                    toolVersion: "Spine Editor Desktop v1.0.0",
                    exportDate: new Date().toISOString(),
                    characters: Array.from(this.app.state.characters.keys()),
                    fileCount: 0 // 後で設定
                }
            };

            // プレイスメントデータ変換
            for (const [id, character] of this.app.state.characters) {
                exportData.placements[id] = {
                    position: { 
                        x: character.x || 18, 
                        y: character.y || 49 
                    },
                    scale: character.scale || 0.55,
                    rotation: character.rotation || 0,
                    opacity: character.opacity || 1.0,
                    animation: character.animation || 'taiki',
                    visible: character.visible !== false,
                    zIndex: 1000 // デフォルト値
                };
            }

            console.log('✅ エクスポートデータ準備完了:', exportData);
            return exportData;

        } catch (error) {
            console.error('❌ エクスポートデータ準備エラー:', error);
            return null;
        }
    }

    // HTML固定化処理
    async generateFixedHTML() {
        try {
            console.log('🔧 HTML固定化処理開始');

            // ベースHTMLテンプレート（簡易版）
            const fixedHTML = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.exportData.project.name || 'Spine Animation'}</title>
    <link rel="stylesheet" href="styles/main.css">
</head>
<body>
    <!-- Spine Character Display -->
    <div id="spine-container">
        ${this.generateCharacterHTML()}
    </div>
    
    <!-- Package Data -->
    <script id="package-data" type="application/json">
${JSON.stringify(this.exportData, null, 2)}
    </script>
    
    <!-- Spine WebGL Runtime -->
    <script src="assets/js/spine-webgl.js"></script>
    <script src="assets/js/player.js"></script>
</body>
</html>`;

            console.log('✅ HTML固定化処理完了');
            return fixedHTML;

        } catch (error) {
            console.error('❌ HTML固定化処理エラー:', error);
            return null;
        }
    }

    // キャラクターHTML生成
    generateCharacterHTML() {
        let html = '';

        for (const [id, character] of this.app.state.characters) {
            const placement = this.exportData.placements[id];
            html += `
    <canvas id="spine-${id}" 
            style="position: absolute; 
                   left: ${placement.position.x}vw; 
                   top: ${placement.position.y}vh;
                   width: ${placement.scale * 200}px;
                   height: ${placement.scale * 200}px;
                   transform: translate(-50%, -50%);
                   opacity: ${placement.opacity};
                   z-index: ${placement.zIndex};"
            data-character="${id}"
            data-animation="${placement.animation}">
    </canvas>`;
        }

        return html;
    }

    // 依存ファイル収集
    async collectDependencyFiles() {
        console.log('📁 依存ファイル収集開始');

        try {
            const dependencies = [];

            // キャラクター関連ファイル
            for (const [id, character] of this.app.state.characters) {
                // Spineアセット
                if (character.spineFiles.json) {
                    dependencies.push({
                        type: 'spine-json',
                        characterId: id,
                        sourcePath: character.spineFiles.json,
                        targetPath: `assets/spine/characters/${id}/${id}.json`
                    });
                }

                if (character.spineFiles.atlas) {
                    dependencies.push({
                        type: 'spine-atlas',
                        characterId: id,
                        sourcePath: character.spineFiles.atlas,
                        targetPath: `assets/spine/characters/${id}/${id}.atlas`
                    });
                }

                // 画像ファイル
                for (const imagePath of character.spineFiles.images) {
                    const imageName = imagePath.split(/[/\\]/).pop();
                    dependencies.push({
                        type: 'spine-image',
                        characterId: id,
                        sourcePath: imagePath,
                        targetPath: `assets/spine/characters/${id}/${imageName}`
                    });
                }
            }

            // 共通ファイル（TODO: 動的収集に変更）
            dependencies.push({
                type: 'script',
                sourcePath: '/mnt/d/クラウドパートナーHP/spine-edit-core.js',
                targetPath: 'assets/js/spine-webgl.js'
            });

            // プレイヤースクリプト（簡易版）
            dependencies.push({
                type: 'generated-script',
                content: this.generatePlayerScript(),
                targetPath: 'assets/js/player.js'
            });

            // CSS（簡易版）
            dependencies.push({
                type: 'generated-css',
                content: this.generatePlayerCSS(),
                targetPath: 'styles/main.css'
            });

            console.log(`✅ 依存ファイル収集完了: ${dependencies.length}ファイル`);
            return dependencies;

        } catch (error) {
            console.error('❌ 依存ファイル収集エラー:', error);
            return null;
        }
    }

    // プレイヤースクリプト生成
    generatePlayerScript() {
        return `// 🎯 Spine Editor Desktop - Generated Player Script
console.log('🎮 Spine Player 起動');

// パッケージデータ読み込み
const packageData = JSON.parse(document.getElementById('package-data').textContent);

// Spine初期化（Phase 1: 基本実装）
document.addEventListener('DOMContentLoaded', () => {
    console.log('📦 パッケージデータ:', packageData);
    
    // 各キャラクターのCanvas初期化
    for (const characterId of packageData.manifest.characters) {
        const canvas = document.getElementById('spine-' + characterId);
        if (canvas) {
            initializeCharacterCanvas(canvas, characterId, packageData);
        }
    }
});

// キャラクターCanvas初期化（簡易実装）
function initializeCharacterCanvas(canvas, characterId, packageData) {
    console.log('🎭 キャラクター初期化:', characterId);
    
    const ctx = canvas.getContext('2d');
    const placement = packageData.placements[characterId];
    
    // 簡易プレースホルダー表示
    ctx.fillStyle = '#0d47a1';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(characterId, canvas.width/2, canvas.height/2);
    
    // TODO: 実際のSpine WebGL初期化
    // - Spineデータ読み込み
    // - アニメーション再生
    // - タイムライン制御
}

console.log('✅ Spine Player Script 読み込み完了');`;
    }

    // プレイヤーCSS生成
    generatePlayerCSS() {
        return `/* 🎯 Spine Editor Desktop - Generated Player CSS */

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: #f5f5f5;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
}

#spine-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    background: 
        radial-gradient(circle at 25% 25%, #e0e0e0 2px, transparent 2px),
        radial-gradient(circle at 75% 75%, #e0e0e0 2px, transparent 2px);
    background-size: 40px 40px;
}

canvas {
    pointer-events: auto;
    image-rendering: pixelated;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
    #spine-container {
        background-size: 20px 20px;
    }
}

/* フェードインアニメーション */
@keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

canvas {
    animation: fadeIn 0.5s ease-out;
}`;
    }

    // パッケージ生成
    async generatePackage(fixedHTML, dependencies) {
        console.log('📦 パッケージ生成開始');

        try {
            const packageFiles = new Map();

            // メインHTML追加
            packageFiles.set('index.html', {
                type: 'text',
                content: fixedHTML
            });

            // 依存ファイル処理
            for (const dep of dependencies) {
                let content;

                if (dep.type === 'generated-script' || dep.type === 'generated-css') {
                    content = dep.content;
                } else if (dep.sourcePath && typeof electronAPI !== 'undefined') {
                    const result = await electronAPI.readFile(dep.sourcePath);
                    if (result.success) {
                        content = result.content;
                    } else {
                        console.warn(`⚠️ ファイル読み込み失敗: ${dep.sourcePath}`);
                        continue;
                    }
                } else {
                    console.warn(`⚠️ 不明な依存ファイル: ${dep.targetPath}`);
                    continue;
                }

                packageFiles.set(dep.targetPath, {
                    type: dep.type,
                    content: content
                });
            }

            console.log(`✅ パッケージ生成完了: ${packageFiles.size}ファイル`);
            return packageFiles;

        } catch (error) {
            console.error('❌ パッケージ生成エラー:', error);
            return null;
        }
    }

    // パッケージファイル出力
    async savePackageToFile(packageFiles) {
        console.log('💾 パッケージファイル出力開始');

        try {
            if (typeof electronAPI === 'undefined') {
                throw new Error('Electron API が利用できません');
            }

            // 出力ディレクトリ選択
            const outputDir = await electronAPI.selectFolder({
                title: 'パッケージ出力先フォルダを選択'
            });

            if (!outputDir) {
                console.log('👤 ユーザーがキャンセルしました');
                return false;
            }

            // パッケージ名生成
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const packageName = `spine-package-${timestamp}`;
            const packagePath = `${outputDir}/${packageName}`;

            console.log('📁 出力パッケージパス:', packagePath);

            // 各ファイルを保存
            let savedCount = 0;
            for (const [filePath, fileData] of packageFiles) {
                const fullPath = `${packagePath}/${filePath}`;
                const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));

                // ディレクトリ作成（擬似実装）
                console.log(`📄 保存中: ${filePath}`);

                // ファイル保存
                const saveResult = await electronAPI.saveFile(fullPath, fileData.content);
                if (saveResult.success) {
                    savedCount++;
                } else {
                    console.warn(`⚠️ ファイル保存失敗: ${filePath}`);
                }
            }

            console.log(`✅ パッケージ出力完了: ${savedCount}/${packageFiles.size}ファイル保存`);
            return savedCount > 0;

        } catch (error) {
            console.error('❌ パッケージファイル出力エラー:', error);
            return false;
        }
    }
}

// グローバル参照
window.DesktopPackageExportManager = DesktopPackageExportManager;

console.log('✅ Package Export Integration モジュール読み込み完了');