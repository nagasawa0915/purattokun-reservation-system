// 🎯 Spine編集システム - パッケージ出力システム
// 意味単位: 独立機能（ZIP生成・ダウンロード・ファイル統合）
// 複雑度: 高（HTML処理・ファイル収集・CDN解決）

console.log('📦 Spine Package Export System モジュール読み込み開始');

// ========== パッケージ出力システム（独立機能） ========== //

/**
 * 🎯 HTML固定化処理と依存ファイル収集を統合したパッケージ出力システム
 * 
 * 【機能概要】
 * - HTML固定化：編集システム除去、localStorage位置データをCSS直接埋め込み
 * - 依存ファイル収集：Spine一式、画像、ライブラリの自動収集
 * - CDN依存解決：spine-webgl.jsをローカル化
 * - ZIP生成：完全パッケージとしてダウンロード可能
 * 
 * 【技術要件】
 * - 2層座標システム対応
 * - エラーハンドリング完備
 * - 既存システムに影響なし
 */

// パッケージ出力システムの状態管理
const PackageExportSystem = {
    isProcessing: false,
    collectedFiles: new Map(),
    htmlTemplate: null,
    positionData: null,
    
    // 設定
    config: {
        spineWebGLCDN: 'https://unpkg.com/@esotericsoftware/spine-webgl@4.1.24/dist/iife/spine-webgl.js',
        spineFiles: [
            'assets/spine/characters/purattokun/purattokun.json',
            'assets/spine/characters/purattokun/purattokun.atlas', 
            'assets/spine/characters/purattokun/purattokun.png'
        ],
        imageFiles: [
            'assets/images/クラウドパートナーTOP.png',
            'assets/images/purattokunn.png'
        ],
        integrationFiles: [
            'assets/spine/spine-integration-v2.js',
            'assets/spine/spine-character-manager.js'
        ]
    },

    // メイン関数：パッケージ出力実行
    async exportPackage() {
        if (this.isProcessing) {
            console.warn('⚠️ パッケージ出力処理中です');
            return;
        }
        
        try {
            this.isProcessing = true;
            console.log('📦 パッケージ出力開始');
            
            // ステップ1: 現在の位置データ取得
            console.log('📋 Step 1: 位置データ収集');
            if (!await this.collectPositionData()) {
                throw new Error('位置データの収集に失敗しました');
            }
            
            // ステップ2: HTML固定化処理
            console.log('🔧 Step 2: HTML固定化処理');
            if (!await this.processHTMLTemplate()) {
                throw new Error('HTML固定化処理に失敗しました');
            }
            
            // ステップ3: 依存ファイル収集
            console.log('📁 Step 3: 依存ファイル収集');
            if (!await this.collectDependencyFiles()) {
                throw new Error('依存ファイル収集に失敗しました');
            }
            
            // ステップ4: CDN依存解決
            console.log('🌐 Step 4: CDN依存解決');
            if (!await this.resolveCDNDependencies()) {
                throw new Error('CDN依存解決に失敗しました');
            }
            
            // ステップ5: ZIPパッケージ生成
            console.log('🗜️ Step 5: ZIPパッケージ生成');
            if (!await this.generateZIPPackage()) {
                throw new Error('ZIPパッケージ生成に失敗しました');
            }
            
            console.log('✅ パッケージ出力完了');
            
        } catch (error) {
            console.error('❌ パッケージ出力失敗:', error);
            alert(`パッケージ出力に失敗しました：${error.message}`);
        } finally {
            this.isProcessing = false;
        }
    },

    // Step 1: 現在の位置データ収集（確実性向上版）
    async collectPositionData() {
        console.log('📊 位置データ収集開始 - 複数ソースからの確実な取得');
        
        try {
            let positionData = null;
            
            // === 1. localStorage優先取得 ===
            console.log('💾 Step 1.1: localStorage位置データ取得');
            const savedStateString = localStorage.getItem('spine-positioning-state');
            
            if (savedStateString) {
                try {
                    const savedState = JSON.parse(savedStateString);
                    if (savedState && savedState.character) {
                        positionData = savedState.character;
                        console.log('✅ localStorage位置データ取得成功:', positionData);
                    }
                } catch (parseError) {
                    console.warn('⚠️ localStorage解析エラー:', parseError);
                }
            } else {
                console.log('💡 localStorage未保存 - DOM状態から取得');
            }
            
            // === 2. 現在のDOM状態から取得（詳細セレクター + 座標変換）===
            console.log('🎯 Step 1.2: 現在のDOM位置データ取得（複数セレクター対応）');
            const selectors = [
                '#character-canvas',
                '#purattokun-canvas', 
                'canvas[data-spine-character]',
                '.spine-character',
                '.demo-character'
            ];
            
            let targetElement = null;
            for (const selector of selectors) {
                targetElement = document.querySelector(selector);
                if (targetElement) {
                    console.log(`✅ 対象要素発見: ${selector}`);
                    break;
                }
            }
            
            if (targetElement) {
                const rect = targetElement.getBoundingClientRect();
                const parentRect = targetElement.parentElement?.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(targetElement);
                
                // DOM状態から精密な位置データを構築
                const domPosition = {
                    // インライン style 優先、なければ computed style
                    left: targetElement.style.left || 
                          (parentRect ? SpineEditSystem.coords.pxToPercent(rect.left - parentRect.left, parentRect.width) + '%' : computedStyle.left),
                    top: targetElement.style.top || 
                         (parentRect ? SpineEditSystem.coords.pxToPercent(rect.top - parentRect.top, parentRect.height) + '%' : computedStyle.top),
                    width: targetElement.style.width || 
                           (parentRect ? SpineEditSystem.coords.pxToPercent(rect.width, parentRect.width) + '%' : computedStyle.width),
                    height: targetElement.style.height || computedStyle.height,
                    transform: targetElement.style.transform || computedStyle.transform
                };
                
                console.log('🎯 DOM位置データ詳細:', {
                    rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
                    parentRect: parentRect ? { left: parentRect.left, top: parentRect.top, width: parentRect.width, height: parentRect.height } : null,
                    domPosition
                });
                
                // localStorageデータがない、または不完全な場合はDOM状態を使用
                if (!positionData || !positionData.left || !positionData.top) {
                    positionData = domPosition;
                    console.log('📋 DOM状態をベースとして採用');
                } else {
                    console.log('📋 localStorage状態を優先、DOM状態をフォールバック用に保持');
                }
            }
            
            // === 3. 最終フォールバック（デフォルト値）===
            if (!positionData || !positionData.left || !positionData.top) {
                console.warn('⚠️ 全ての位置データソースが無効 - SPINE_BEST_PRACTICES準拠デフォルト値を使用');
                positionData = {
                    left: '35%',      // Layer 1: CSS基本配置（中心基準）
                    top: '75%',       // Layer 1: CSS基本配置（地面レベル）
                    width: '25%',     // Layer 1: CSS基本配置（レスポンシブ対応）
                    height: 'auto',   // Layer 1: CSS基本配置（縦横比保持）
                    transform: 'translate(-50%, -50%)'  // Layer 2: transform制御（中心点基準）
                };
            }
            
            // === 4. 位置データの正規化・検証 ===
            console.log('🔧 Step 1.3: 位置データ正規化・検証');
            positionData = this.normalizePositionData(positionData);
            
            this.positionData = positionData;
            console.log('✅ 位置データ収集完了（確実性向上版）:', positionData);
            return true;
            
        } catch (error) {
            console.error('❌ 位置データ収集エラー:', error);
            return false;
        }
    },

    // 位置データの正規化・検証
    normalizePositionData(data) {
        const normalized = { ...data };
        
        // %値の正規化（px値が混じっている場合の対応）
        ['left', 'top', 'width', 'height'].forEach(prop => {
            if (normalized[prop] && typeof normalized[prop] === 'string') {
                // px値を%値に変換する必要があるかチェック
                if (normalized[prop].includes('px') && !normalized[prop].includes('%')) {
                    console.log(`🔧 ${prop}: px値検出、%値への変換が必要: ${normalized[prop]}`);
                    // この場合はそのまま保持（embedPositionDataで適切に処理される）
                }
            }
        });
        
        // transformの正規化
        if (!normalized.transform || normalized.transform === 'none') {
            normalized.transform = 'translate(-50%, -50%)';
            console.log('🔧 transform正規化: translate(-50%, -50%)を設定');
        }
        
        console.log('🔧 位置データ正規化完了:', normalized);
        return normalized;
    },

    // Step 2: HTML固定化処理
    async processHTMLTemplate() {
        console.log('🔧 HTML固定化処理開始');
        
        try {
            // 現在のindex.htmlを取得
            const response = await fetch('index.html');
            if (!response.ok) {
                throw new Error(`HTMLファイル取得失敗: ${response.status}`);
            }
            
            let htmlContent = await response.text();
            console.log('📋 index.html取得完了');
            
            // 編集システム関連のコードを除去
            htmlContent = this.removeEditingSystem(htmlContent);
            
            // CDN依存をローカル参照に変更
            htmlContent = this.localizeSpineWebGL(htmlContent);
            
            // 位置データをCSS値として埋め込み
            htmlContent = this.embedPositionData(htmlContent);
            
            this.htmlTemplate = htmlContent;
            console.log('✅ HTML固定化処理完了');
            return true;
            
        } catch (error) {
            console.error('❌ HTML固定化処理エラー:', error);
            return false;
        }
    },

    // 編集システム関連コードの除去（精密削除）
    removeEditingSystem(htmlContent) {
        console.log('🚮 編集システムコード除去（精密削除）');
        
        // 1. URLパラメータ処理（editMode変数定義とデバッグ出力）を完全除去
        const urlParamsPattern = /\/\/ 🎯 URLパラメータで編集モード起動[\s\S]*?const editMode = urlParams\.get\('edit'\) === 'true';[\s\S]*?editMode: editMode[\s\S]*?\}\);/;
        htmlContent = htmlContent.replace(urlParamsPattern, '// URLパラメータ処理・editMode変数除去済み');
        
        // 2. 編集モード検出とCSS/JS動的読み込み処理を除去し、Spine初期化を直接実行に変更
        const editModeDetectionPattern = /if \(editMode\) \{[\s\S]*?document\.body\.appendChild\(editJS\);[\s\S]*?\} else \{[\s\S]*?initializeSpineSystem\(\);[\s\S]*?\}/;
        htmlContent = htmlContent.replace(editModeDetectionPattern, 'initializeSpineSystem(); // パッケージ用：Spine直接初期化');
        
        // 3. 編集システムの初期化関数呼び出しのみ除去
        const editInitPattern = /\/\/ 編集システム初期化[\s\S]*?initializeSpineEditSystem\(\);/;
        htmlContent = htmlContent.replace(editInitPattern, '// 編集システム初期化除去済み');
        
        // 4. 編集用CSS/JSファイル参照のみ除去（spine-positioning-system-explanation.*)
        const editCSSPattern = /<link[^>]*spine-positioning-system-explanation\.css[^>]*>/g;
        const editJSPattern = /<script[^>]*spine-positioning-system-explanation\.js[^>]*><\/script>/g;
        htmlContent = htmlContent.replace(editCSSPattern, '<!-- 編集用CSS除去済み -->');
        htmlContent = htmlContent.replace(editJSPattern, '<!-- 編集用JS除去済み -->');
        
        // ✅ 保持すべき重要なコード（削除してはいけない）
        console.log('✅ 以下のコードは保持されます：');
        console.log('  - Spine WebGL読み込み: <script src="...spine-webgl.js">');
        console.log('  - Spine統合処理: spine-integration-v2.js読み込み');
        console.log('  - キャラクター初期化: loadCharacter(), setupSpineCharacter()');
        console.log('  - アニメーション開始: playAnimation()');
        console.log('  - 基本HTML構造とSpine表示システム');
        
        console.log('✅ 編集システムコード精密除去完了');
        return htmlContent;
    },

    // CDN依存をローカル参照に変更
    localizeSpineWebGL(htmlContent) {
        console.log('🌐 Spine WebGL CDN→ローカル変更');
        
        const cdnPattern = /<script src="https:\/\/unpkg\.com\/@esotericsoftware\/spine-webgl@[\d\.]+\/dist\/iife\/spine-webgl\.js"><\/script>/;
        const localReference = '<script src="assets/js/libs/spine-webgl.js"></script>';
        
        htmlContent = htmlContent.replace(cdnPattern, localReference);
        
        console.log('✅ CDN→ローカル変更完了');
        return htmlContent;
    },

    // 位置データのCSS埋め込み（確実性向上・2層座標システム対応）
    embedPositionData(htmlContent) {
        console.log('📐 位置データCSS埋め込み - 確実性向上版');
        
        const positionData = this.positionData;
        if (!positionData) {
            console.error('❌ 位置データがありません - 埋め込み処理を中断');
            return htmlContent;
        }
        
        console.log('📋 埋め込み対象位置データ:', positionData);
        
        // === 1. 2層座標システム準拠CSS生成 ===
        const coordinateCSS = this.generateCoordinateCSS(positionData);
        console.log('🔧 生成されたCSS:', coordinateCSS);
        
        // === 2. 複数パターン対応での確実な埋め込み ===
        let embedSuccess = false;
        
        // パターン1: #character-canvas スタイル定義に埋め込み
        console.log('🎯 パターン1: #character-canvas スタイル定義検索');
        const canvasStylePatterns = [
            /#character-canvas\s*\{[^}]*\}/g,
            /#purattokun-canvas\s*\{[^}]*\}/g,
            /\.spine-character\s*\{[^}]*\}/g
        ];
        
        for (const pattern of canvasStylePatterns) {
            const matches = htmlContent.match(pattern);
            if (matches && matches.length > 0) {
                for (const match of matches) {
                    const originalStyle = match;
                    const enhancedStyle = originalStyle.replace(
                        /\}$/,
                        `    /* === 保存された位置データ（固定化済み・2層座標システム） === */\n${coordinateCSS}        }`
                    );
                    htmlContent = htmlContent.replace(originalStyle, enhancedStyle);
                    console.log(`✅ パターン1成功: ${pattern.source} - CSS埋め込み完了`);
                    embedSuccess = true;
                }
            }
        }
        
        // パターン3: 新規<style>ブロック追加（最終フォールバック）
        if (!embedSuccess) {
            console.log('🎯 パターン3: 新規<style>ブロック追加（最終フォールバック）');
            const newStyleBlock = `
    <style>
        /* === Spine位置データ（パッケージ固定化・自動追加） === */
        #character-canvas,
        #purattokun-canvas,
        .spine-character {
${coordinateCSS}        }
    </style>`;
            
            const headCloseIndex = htmlContent.lastIndexOf('</head>');
            if (headCloseIndex !== -1) {
                htmlContent = htmlContent.slice(0, headCloseIndex) + newStyleBlock + '\n' + htmlContent.slice(headCloseIndex);
                console.log('✅ パターン3成功: 新規<style>ブロック追加完了');
                embedSuccess = true;
            }
        }
        
        if (embedSuccess) {
            console.log('✅ 位置データCSS埋め込み成功（確実性向上版）');
        } else {
            console.error('❌ 位置データCSS埋め込み失敗');
        }
        
        return htmlContent;
    },

    // 2層座標システム準拠のCSS生成
    generateCoordinateCSS(positionData) {
        console.log('🎨 2層座標システム準拠CSS生成', positionData);
        
        const cssLines = [];
        
        // Layer 1: CSS基本配置（position, left, top, width, height）
        if (positionData.left) cssLines.push(`            left: ${positionData.left};`);
        if (positionData.top) cssLines.push(`            top: ${positionData.top};`);
        if (positionData.width) cssLines.push(`            width: ${positionData.width};`);
        if (positionData.height && positionData.height !== 'auto') cssLines.push(`            height: ${positionData.height};`);
        
        // Layer 2: transform制御（中心点基準の微調整）
        if (positionData.transform) {
            cssLines.push(`            transform: ${positionData.transform};`);
        }
        
        // 品質保証：重要なCSS属性も含める
        cssLines.push(`            position: absolute;`);
        cssLines.push(`            /* パッケージ固定化: localStorage位置データより生成 */`);
        
        const coordinateCSS = cssLines.join('\n') + '\n';
        console.log('🔧 生成CSS:', coordinateCSS);
        
        return coordinateCSS;
    },

    // Step 3: 依存ファイル収集
    async collectDependencyFiles() {
        console.log('📁 依存ファイル収集開始');
        
        try {
            this.collectedFiles.clear();
            
            // Spineファイル収集
            for (const filePath of this.config.spineFiles) {
                if (!await this.collectFile(filePath)) {
                    console.warn(`⚠️ Spineファイル収集失敗（継続）: ${filePath}`);
                }
            }
            
            // 画像ファイル収集
            for (const filePath of this.config.imageFiles) {
                if (!await this.collectFile(filePath)) {
                    console.warn(`⚠️ 画像ファイル収集失敗（継続）: ${filePath}`);
                }
            }
            
            // 統合ファイル収集
            for (const filePath of this.config.integrationFiles) {
                if (!await this.collectFile(filePath)) {
                    console.warn(`⚠️ 統合ファイル収集失敗（継続）: ${filePath}`);
                }
            }
            
            console.log(`✅ 依存ファイル収集完了: ${this.collectedFiles.size}個`);
            return true;
            
        } catch (error) {
            console.error('❌ 依存ファイル収集エラー:', error);
            return false;
        }
    },

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
    },

    // ファイルタイプ判定
    getFileType(filePath) {
        const extension = filePath.split('.').pop().toLowerCase();
        
        const binaryExtensions = ['png', 'jpg', 'jpeg', 'gif', 'ico', 'atlas'];
        const textExtensions = ['js', 'json', 'html', 'css', 'txt'];
        
        if (binaryExtensions.includes(extension)) return 'binary';
        if (textExtensions.includes(extension)) return 'text';
        
        return 'text'; // デフォルトはテキスト
    },

    // Step 4: CDN依存解決
    async resolveCDNDependencies() {
        console.log('🌐 CDN依存解決開始');
        
        try {
            // Spine WebGL ライブラリのダウンロード
            const response = await fetch(this.config.spineWebGLCDN);
            if (!response.ok) {
                throw new Error(`Spine WebGL CDN取得失敗: ${response.status}`);
            }
            
            const spineWebGLContent = await response.text();
            this.collectedFiles.set('assets/js/libs/spine-webgl.js', { content: spineWebGLContent, type: 'text' });
            
            console.log('✅ CDN依存解決完了');
            return true;
            
        } catch (error) {
            console.error('❌ CDN依存解決エラー:', error);
            return false;
        }
    },

    // Step 5: ZIPパッケージ生成
    async generateZIPPackage() {
        console.log('🗜️ ZIPパッケージ生成開始');
        
        try {
            const JSZip = await this.loadJSZip();
            const zip = new JSZip();
            
            // HTMLファイル追加
            zip.file('index.html', this.htmlTemplate);
            console.log('📄 index.html追加完了');
            
            // 収集したファイルを追加
            for (const [filePath, fileData] of this.collectedFiles) {
                const targetPath = this.getTargetPath(filePath);
                
                if (fileData.type === 'binary') {
                    zip.file(targetPath, fileData.content, { binary: true });
                } else {
                    zip.file(targetPath, fileData.content);
                }
                
                console.log(`📁 ファイル追加: ${filePath} → ${targetPath}`);
            }
            
            // ZIPファイル生成
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            // ダウンロード実行
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(zipBlob);
            downloadLink.download = `spine-project-package-${new Date().toISOString().slice(0, 19).replace(/:/g, '')}.zip`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            console.log('✅ ZIPパッケージ生成・ダウンロード完了');
            return true;
            
        } catch (error) {
            console.error('❌ ZIPパッケージ生成エラー:', error);
            return false;
        }
    },

    // ターゲットパス取得
    getTargetPath(originalPath) {
        // 元のパス構造を維持
        return originalPath;
    },

    // JSZipライブラリ動的読み込み
    async loadJSZip() {
        if (typeof JSZip !== 'undefined') {
            return JSZip;
        }
        
        // JSZipライブラリの動的読み込み
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        
        return new Promise((resolve, reject) => {
            script.onload = () => resolve(JSZip);
            script.onerror = () => reject(new Error('JSZipライブラリの読み込みに失敗しました'));
            document.head.appendChild(script);
        });
    }
};

// ========== 外部インターフェース ========== //

/**
 * パッケージ出力実行関数（外部インターフェース）
 */
async function exportPackage() {
    return await PackageExportSystem.exportPackage();
}

console.log('✅ Spine Package Export System モジュール読み込み完了');

// Global exports
window.PackageExportSystem = PackageExportSystem;
window.exportPackage = exportPackage;