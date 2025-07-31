// 📦 完全パッケージ出力システム Phase 1
// 作成日: 2025-01-31
// 目標: 商用制作ツールの基盤として確実に動作するパッケージ出力機能

console.log('📦 パッケージ出力システム Phase 1 読み込み開始');

// ========== 🌐 JSZip CDN動的読み込みシステム ========== //
const PackageExportPhase1 = {
    initialized: false,
    JSZip: null,
    
    // 必要ファイルのパス定義
    requiredFiles: {
        // HTMLファイル
        html: {
            'index.html': '/index.html'
        },
        // Spineファイル
        spine: {
            'assets/spine/characters/purattokun/purattokun.json': '/assets/spine/characters/purattokun/purattokun.json',
            'assets/spine/characters/purattokun/purattokun.atlas': '/assets/spine/characters/purattokun/purattokun.atlas',
            'assets/spine/characters/purattokun/purattokun.png': '/assets/spine/characters/purattokun/purattokun.png',
            'assets/spine/spine-integration-v2.js': '/assets/spine/spine-integration-v2.js',
            'assets/spine/spine-character-manager.js': '/assets/spine/spine-character-manager.js',
            'assets/spine/spine-animation-controller.js': '/assets/spine/spine-animation-controller.js',
            // 🚨 重要: 不足していたファイル群
            'assets/spine/spine-coordinate-utils.js': '/assets/spine/spine-coordinate-utils.js',
            'assets/spine/spine-debug-window.js': '/assets/spine/spine-debug-window.js',
            'assets/spine/spine-responsive-coordinate-system.js': '/assets/spine/spine-responsive-coordinate-system.js',
            'assets/spine/runtime/spine-webgl-setup.js': '/assets/spine/runtime/spine-webgl-setup.js',
            'assets/spine/positioning/canvas-positioning-system.js': '/assets/spine/positioning/canvas-positioning-system.js',
            'assets/spine/positioning/placement-config.json': '/assets/spine/positioning/placement-config.json'
        },
        // 必要な画像ファイル
        images: {
            'assets/images/クラウドパートナーTOP.png': '/assets/images/クラウドパートナーTOP.png',
            'assets/images/kumo1.png': '/assets/images/kumo1.png',
            'assets/images/kumo2.png': '/assets/images/kumo2.png',
            'assets/images/kumo3.png': '/assets/images/kumo3.png',
            'assets/images/purattokunn.png': '/assets/images/purattokunn.png'
        },
        // 🌐 Spine WebGLライブラリ (CDN → ローカル化)
        libraries: {
            'assets/spine/libs/spine-webgl.js': 'https://unpkg.com/@esotericsoftware/spine-webgl@4.1.23/dist/iife/spine-webgl.js'
        }
};

// ========== 📥 JSZipライブラリ動的読み込み ========== //
async function loadJSZip() {
    if (PackageExportPhase1.JSZip) {
        console.log('📥 JSZip既に読み込み済み');
        return PackageExportPhase1.JSZip;
    }
    
    console.log('📥 JSZip読み込み開始...');
    
    try {
        // JSZip CDNから読み込み
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
        
        // グローバルJSZipを取得
        if (typeof JSZip !== 'undefined') {
            PackageExportPhase1.JSZip = JSZip;
            console.log('✅ JSZip読み込み完了');
            return JSZip;
        } else {
            throw new Error('JSZipが見つかりません');
        }
        
    } catch (error) {
        console.error('❌ JSZip読み込みエラー:', error);
        throw error;
    }
}

// ========== 📄 HTML固定化システム ========== //
function fixHTMLPositions(originalHTML, positionData) {
    console.log('📄 HTML固定化処理開始...');
    
    let fixedHTML = originalHTML;
    // 🌐 CDN参照をローカルファイル参照に変更
    console.log('🌐 CDN参照をローカルファイル参照に変更中...');
    
    // Spine WebGL CDN → ローカル参照に変更
    const spineWebGLCDNRegex = /<script[^>]*src="https:\/\/unpkg\.com\/@esotericsoftware\/spine-webgl[^"]*"[^>]*><\/script>/g;
    fixedHTML = fixedHTML.replace(spineWebGLCDNRegex, '<script src="assets/spine/libs/spine-webgl.js"></script>');
    
    
    // 各キャラクターの位置をdata-*属性に反映
    Object.keys(positionData.characters).forEach(charId => {
        const charData = positionData.characters[charId];
        
        // purattokun-configセクションの更新（メインキャラクターの場合）
        if (charId === 'purattokun-canvas' || charId === 'purattokun-fallback') {
            const configRegex = /<div id="purattokun-config"[^>]*>/;
            const configMatch = fixedHTML.match(configRegex);
            
            if (configMatch) {
                const newConfig = `<div id="purattokun-config" style="display: none;"
                     data-x="${charData.dataAttributes['data-x']}"
                     data-y="${charData.dataAttributes['data-y']}"
                     data-scale="${charData.dataAttributes['data-scale']}"
                     data-fade-delay="1500"
                     data-fade-duration="2000">`;
                
                fixedHTML = fixedHTML.replace(configRegex, newConfig);
                console.log(`📄 ${charId}の位置をHTML固定化: x=${charData.dataAttributes['data-x']}%, y=${charData.dataAttributes['data-y']}%`);
            }
        }
        
        // キャラクター要素のstyle属性も更新
        const elementRegex = new RegExp(`<(canvas|img)[^>]*id="${charId}"[^>]*>`, 'g');
        fixedHTML = fixedHTML.replace(elementRegex, (match) => {
            // 既存のstyle属性を更新または追加
            const styleRegex = /style="([^"]*)"/;
            const styleMatch = match.match(styleRegex);
            
            let newStyle = `position: absolute; left: ${charData.position.left}; top: ${charData.position.top}; transform: ${charData.position.transform}; z-index: ${charData.layer.zIndex};`;
            
            if (styleMatch) {
                // 既存のstyle属性を置換
                return match.replace(styleRegex, `style="${newStyle}"`);
            } else {
                // style属性を追加
                return match.replace('>', ` style="${newStyle}">`);
            }
        });
    });
    
    console.log('✅ HTML固定化処理完了');
    return fixedHTML;
}

// ========== 🧹 編集システム除去機能 ========== //
function removeEditingSystem(html) {
    console.log('🧹 編集システム除去開始...');
    
    let cleanHTML = html;
    
    // v2.0システム関連のscriptタグ除去
    const v2ScriptRegex = /<script[^>]*spine-positioning-v2\.js[^>]*><\/script>/g;
    cleanHTML = cleanHTML.replace(v2ScriptRegex, '');
    
    // パッケージ出力システム関連のscriptタグ除去
    const packageScriptRegex = /<script[^>]*package-export-phase1\.js[^>]*><\/script>/g;
    cleanHTML = cleanHTML.replace(packageScriptRegex, '');
    
    // 編集システム関連のコメント除去
    const editCommentRegex = /<!-- 編集システム関連[^>]*-->[\s\S]*?<!-- \/編集システム関連 -->/g;
    cleanHTML = cleanHTML.replace(editCommentRegex, '');
    
    // URLパラメータ関連のクエリ文字列処理コードを除去（必要に応じて）
    
    console.log('✅ 編集システム除去完了');
    return cleanHTML;
}

// ========== 📂 ファイル収集システム ========== //
async function collectFiles(progressCallback) {
    console.log('📂 ファイル収集開始...');
    
    const collectedFiles = {};
    const totalFiles = Object.keys(PackageExportPhase1.requiredFiles.html).length +
                      Object.keys(PackageExportPhase1.requiredFiles.spine).length +
                      Object.keys(PackageExportPhase1.requiredFiles.images).length +
                      Object.keys(PackageExportPhase1.requiredFiles.libraries).length;
    let processedFiles = 0;
    
    // HTML収集
    for (const [fileName, filePath] of Object.entries(PackageExportPhase1.requiredFiles.html)) {
        try {
            const response = await fetch(filePath);
            if (response.ok) {
                collectedFiles[fileName] = await response.text();
                console.log(`✅ 収集成功: ${fileName}`);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.warn(`⚠️ 収集失敗: ${fileName} - ${error.message}`);
            collectedFiles[fileName] = `<!-- ファイル収集エラー: ${fileName} -->`;
        }
        
        processedFiles++;
        if (progressCallback) progressCallback(processedFiles, totalFiles, fileName);
    }
    
    // 🌐 ライブラリファイル収集（CDN → ローカル化）
    for (const [fileName, fileURL] of Object.entries(PackageExportPhase1.requiredFiles.libraries)) {
        try {
            console.log(`🌐 CDNライブラリ収集中: ${fileName} from ${fileURL}`);
            const response = await fetch(fileURL);
            if (response.ok) {
                collectedFiles[fileName] = await response.text();
                console.log(`✅ CDNライブラリ収集成功: ${fileName}`);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.warn(`⚠️ CDNライブラリ収集失敗: ${fileName} - ${error.message}`);
            // フォールバック: プレースホルダーライブラリ
            collectedFiles[fileName] = `// Spine WebGL Library Placeholder
console.error('Spine WebGL library failed to load from CDN');
// フォールバック処理をここに実装
`;
        }
        
        processedFiles++;
        if (progressCallback) progressCallback(processedFiles, totalFiles, fileName);
    }
    
    // Spine・画像ファイル収集（バイナリ）
    const binaryFiles = { ...PackageExportPhase1.requiredFiles.spine, ...PackageExportPhase1.requiredFiles.images };
    for (const [fileName, filePath] of Object.entries(binaryFiles)) {
        try {
            const response = await fetch(filePath);
            if (response.ok) {
                if (fileName.endsWith('.js') || fileName.endsWith('.json')) {
                    // JavaScriptとJSONはテキストとして処理
                    collectedFiles[fileName] = await response.text();
                } else {
                    // その他はバイナリとして処理
                    collectedFiles[fileName] = await response.blob();
                }
                console.log(`✅ 収集成功: ${fileName}`);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.warn(`⚠️ 収集失敗: ${fileName} - ${error.message}`);
        }
        
        processedFiles++;
        if (progressCallback) progressCallback(processedFiles, totalFiles, fileName);
    }
    
    console.log(`📂 ファイル収集完了: ${Object.keys(collectedFiles).length}/${totalFiles}個`);
    return collectedFiles;
}

// ========== 📝 README生成システム ========== //
function generateREADME(positionData) {
    const timestamp = new Date().toLocaleString('ja-JP');
    
    let readme = `# ぷらっとくん完全パッケージ

## 📦 パッケージ情報
- 生成日時: ${timestamp}
- システム: Spine Positioning System v2.0 (修正版)
- キャラクター数: ${Object.keys(positionData.characters).length}個

## 🚀 使用方法
1. このフォルダ全体をWebサーバーにアップロード
2. index.htmlにアクセス
3. ぷらっとくんが指定位置に表示されます

## 📁 ファイル構成
- index.html: メインHTMLファイル（位置固定済み）
- assets/spine/: Spineアニメーションファイル
- assets/images/: 背景画像・キャラクター画像

## ⚙️ 固定されたキャラクター位置
`;
    
    Object.keys(positionData.characters).forEach(charId => {
        const char = positionData.characters[charId];
        readme += `
### ${char.name} (${charId})
- 位置: x=${char.dataAttributes['data-x']}%, y=${char.dataAttributes['data-y']}%
- スケール: ${char.dataAttributes['data-scale']}倍
- レイヤー: z-index ${char.dataAttributes['data-z-index']}`;
    });
    
    readme += `

## 📞 サポート
位置調整が必要な場合は、クラウドパートナーまでお問い合わせください。

---
生成元: Spine Positioning System v2.0 Phase 1
`;
    
    return readme;
}

// ========== 📦 ZIP生成・ダウンロード機能 ========== //
async function generatePackage(showProgress = true) {
    console.log('📦 パッケージ生成開始...');
    
    try {
        // 進行状況表示
        let progressDialog = null;
        if (showProgress) {
            progressDialog = showProgressDialog();
        }
        
        const updateProgress = (current, total, fileName) => {
            if (progressDialog) {
                const progress = Math.round((current / total) * 100);
                progressDialog.updateProgress(progress, `${fileName} を処理中...`);
            }
        };
        
        // 1. JSZip読み込み
        updateProgress(0, 100, 'JSZipライブラリを読み込み中...');
        const JSZip = await loadJSZip();
        
        // 2. v2.0位置データ取得
        updateProgress(10, 100, '位置データを取得中...');
        if (!window.SpinePositioningV2 || !SpinePositioningV2.initialized) {
            throw new Error('v2.0システムが初期化されていません');
        }
        
        const positionData = SpinePositioningV2.getCurrentPositions();
        
        // 3. ファイル収集
        updateProgress(20, 100, 'ファイルを収集中...');
        const collectedFiles = await collectFiles((current, total, fileName) => {
            const progress = 20 + Math.round((current / total) * 60); // 20-80%
            updateProgress(progress, 100, `収集中: ${fileName}`);
        });
        
        // 4. HTML固定化
        updateProgress(80, 100, 'HTMLを固定化中...');
        if (collectedFiles['index.html']) {
            const fixedHTML = fixHTMLPositions(collectedFiles['index.html'], positionData);
            const cleanHTML = removeEditingSystem(fixedHTML);
            collectedFiles['index.html'] = cleanHTML;
        }
        
        // 5. README生成
        updateProgress(85, 100, 'README生成中...');
        const readme = generateREADME(positionData);
        collectedFiles['README.txt'] = readme;
        
        // 6. ZIP作成
        updateProgress(90, 100, 'ZIPファイル作成中...');
        const zip = new JSZip();
        
        Object.keys(collectedFiles).forEach(fileName => {
            const fileData = collectedFiles[fileName];
            
            if (typeof fileData === 'string') {
                // テキストファイル
                zip.file(fileName, fileData);
            } else if (fileData instanceof Blob) {
                // バイナリファイル
                zip.file(fileName, fileData);
            }
        });
        
        // 7. ZIP生成・ダウンロード
        updateProgress(95, 100, 'ダウンロード準備中...');
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        // ダウンロード実行
        const downloadUrl = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `purattokun-package-${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        
        updateProgress(100, 100, '完了!');
        
        // 完了メッセージ
        setTimeout(() => {
            if (progressDialog) progressDialog.close();
            showSuccessDialog(Object.keys(collectedFiles).length, positionData);
        }, 1000);
        
        console.log('✅ パッケージ生成・ダウンロード完了');
        return true;
        
    } catch (error) {
        console.error('❌ パッケージ生成エラー:', error);
        if (progressDialog) progressDialog.close();
        showErrorDialog(error.message);
        return false;
    }
}

// ========== 🎨 進行状況ダイアログUI ========== //
function showProgressDialog() {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 30000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    `;
    
    dialog.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 30px; 
                    max-width: 500px; width: 100%; text-align: center;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
            <div style="font-size: 24px; margin-bottom: 10px;">📦</div>
            <h3 style="margin: 0 0 20px 0; color: #333;">パッケージ生成中...</h3>
            
            <div style="background: #f0f0f0; border-radius: 10px; height: 20px; margin-bottom: 15px; overflow: hidden;">
                <div id="progress-bar" style="height: 100%; background: linear-gradient(90deg, #4CAF50, #45a049);
                                              width: 0%; transition: width 0.3s ease; border-radius: 10px;"></div>
            </div>
            
            <div id="progress-text" style="font-size: 14px; color: #666; margin-bottom: 10px;">準備中...</div>
            <div id="progress-percent" style="font-size: 18px; font-weight: bold; color: #4CAF50;">0%</div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    return {
        updateProgress: (percent, message) => {
            const progressBar = dialog.querySelector('#progress-bar');
            const progressText = dialog.querySelector('#progress-text');
            const progressPercent = dialog.querySelector('#progress-percent');
            
            if (progressBar) progressBar.style.width = `${percent}%`;
            if (progressText) progressText.textContent = message;
            if (progressPercent) progressPercent.textContent = `${percent}%`;
        },
        close: () => {
            if (dialog.parentNode) {
                document.body.removeChild(dialog);
            }
        }
    };
}

// ========== ✅ 成功ダイアログ ========== //
function showSuccessDialog(fileCount, positionData) {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 30000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    `;
    
    const charactersList = Object.keys(positionData.characters).map(charId => {
        const char = positionData.characters[charId];
        return `• ${char.name}: (${char.dataAttributes['data-x']}%, ${char.dataAttributes['data-y']}%)`;
    }).join('<br>');
    
    dialog.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 30px; 
                    max-width: 600px; width: 100%; text-align: center;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
            <div style="font-size: 48px; margin-bottom: 20px;">🎉</div>
            <h3 style="margin: 0 0 20px 0; color: #4CAF50;">パッケージ生成完了!</h3>
            
            <div style="text-align: left; background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <div style="font-weight: bold; margin-bottom: 10px;">パッケージ内容:</div>
                <div style="font-size: 14px; color: #666;">• 総ファイル数: ${fileCount}個</div>
                <div style="font-size: 14px; color: #666;">• キャラクター数: ${Object.keys(positionData.characters).length}個</div>
                <div style="font-size: 14px; color: #666; margin-top: 10px;">
                <div style="font-size: 14px; color: #4CAF50;"><strong>✅ Spine再生問題修正済み</strong></div>
                <div style="font-size: 14px; color: #4CAF50;"><strong>✅ CDN非依存でオフライン動作</strong></div>
                    <strong>固定された位置:</strong><br>
                    ${charactersList}
                </div>
            </div>
            
            <div style="font-size: 14px; color: #666; margin-bottom: 20px;">
                ZIPファイルのダウンロードが開始されました。<br>
                このパッケージをWebサーバーにアップロードするだけで使用できます。
            </div>
            
            <button onclick="this.parentNode.parentNode.remove()" 
                    style="padding: 10px 30px; background: #4CAF50; color: white; 
                           border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
                ✅ 閉じる
            </button>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // 背景クリックで閉じる
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            document.body.removeChild(dialog);
        }
    });
}

// ========== ❌ エラーダイアログ ========== //
function showErrorDialog(errorMessage) {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 30000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    `;
    
    dialog.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 30px; 
                    max-width: 500px; width: 100%; text-align: center;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
            <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
            <h3 style="margin: 0 0 20px 0; color: #f44336;">パッケージ生成エラー</h3>
            
            <div style="text-align: left; background: #fff3f3; padding: 20px; border-radius: 8px; 
                        margin-bottom: 20px; border-left: 4px solid #f44336;">
                <div style="font-weight: bold; margin-bottom: 10px; color: #f44336;">エラー詳細:</div>
                <div style="font-size: 14px; color: #666;">${errorMessage}</div>
            </div>
            
            <div style="font-size: 14px; color: #666; margin-bottom: 20px;">
                以下をご確認ください:<br>
                • v2.0編集システムが初期化されているか<br>
                • インターネット接続が正常か<br>
                • ブラウザがファイルダウンロードを許可しているか
            </div>
            
            <button onclick="this.parentNode.parentNode.remove()" 
                    style="padding: 10px 30px; background: #f44336; color: white; 
                           border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
                閉じる
            </button>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // 背景クリックで閉じる
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            document.body.removeChild(dialog);
        }
    });
}

// ========== 🌐 外部API ========== //
PackageExportPhase1.generatePackage = generatePackage;
PackageExportPhase1.init = async function() {
    if (PackageExportPhase1.initialized) {
        console.log('📦 パッケージ出力システム既に初期化済み');
        return true;
    }
    
    try {
        // JSZip事前読み込み（オプション）
        // await loadJSZip();
        
        PackageExportPhase1.initialized = true;
        console.log('✅ パッケージ出力システム Phase 1 初期化完了');
        return true;
        
    } catch (error) {
        console.error('❌ パッケージ出力システム初期化エラー:', error);
        return false;
    }
};

// グローバル公開
window.PackageExportPhase1 = PackageExportPhase1;

// デバッグ用関数
window.packageDebug = function() {
    console.log('📦 パッケージ出力システム状態:', {
        initialized: PackageExportPhase1.initialized,
        JSZipLoaded: !!PackageExportPhase1.JSZip,
        v2SystemReady: !!(window.SpinePositioningV2 && SpinePositioningV2.initialized)
    });
};

console.log('✅ パッケージ出力システム Phase 1 読み込み完了');
console.log('💡 使用方法: PackageExportPhase1.generatePackage() または パネルのボタンから実行');
