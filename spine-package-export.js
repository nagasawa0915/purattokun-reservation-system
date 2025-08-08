// 🎯 Spine編集システム - パッケージ出力システム
// 意味単位: 独立機能（ZIP生成・ダウンロード・ファイル統合）
// 複雑度: 高（HTML処理・ファイル収集・CDN解決）

console.log('📦 Spine Package Export System モジュール読み込み開始');
console.log('🔍 読み込み状況:', {
    windowExists: typeof window !== 'undefined',
    documentExists: typeof document !== 'undefined'
});

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

// パッケージ出力システムの状態管理（重複宣言チェック）
if (typeof window.PackageExportSystem === 'undefined') {
    const PackageExportSystem = {
    isProcessing: false,
    collectedFiles: new Map(),
    htmlTemplate: null,
    positionData: null,
    
    // 設定（汎用化済み - 動的キャラクター検出対応）
    config: {
        spineWebGLCDN: 'https://unpkg.com/@esotericsoftware/spine-webgl@4.1.24/dist/iife/spine-webgl.js',
        // 🎯 汎用設定: キャラクター固有ファイルは動的生成
        staticFiles: {
            imageFiles: [
                'assets/images/クラウドパートナーTOP.png'  // 背景画像（共通）
            ],
            integrationFiles: [
                'assets/spine/spine-integration-v2.js',
                'assets/spine/spine-character-manager.js'
            ]
        }
    },
    
    // 🎯 全キャラクター検出（完全パッケージ版）
    async detectAllCharacters() {
        console.log('🔍 全キャラクター検出開始（お客様納品用）');
        
        const detectedCharacters = [];
        
        // 1. MultiCharacterManagerから全キャラクター取得（最優先）
        if (typeof MultiCharacterManager !== 'undefined' && MultiCharacterManager.characters) {
            console.log('🐈 MultiCharacterManagerから全キャラクター取得');
            MultiCharacterManager.characters.forEach(char => {
                const characterName = char.id.replace('-canvas', '') || char.name;
                if (characterName && !detectedCharacters.includes(characterName)) {
                    detectedCharacters.push(characterName);
                    console.log(`  ✅ 登録: ${characterName} (ID: ${char.id})`);
                }
            });
        }
        
        // 2. DOMから直接検索（フォールバック）
        if (detectedCharacters.length === 0) {
            console.log('🔍 DOMから直接キャラクター検索');
            const selectors = [
                'canvas[id$="-canvas"]',      // 標準命名規則
                'canvas[data-spine-character]',
                '.spine-character'
            ];
            
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    if (element.id) {
                        const characterName = element.id.replace('-canvas', '');
                        if (characterName && !detectedCharacters.includes(characterName)) {
                            detectedCharacters.push(characterName);
                            console.log(`  ✅ DOM検出: ${characterName}`);
                        }
                    }
                });
            });
        }
        
        // 3. 最終フォールバック
        if (detectedCharacters.length === 0) {
            console.warn('⚠️ キャラクター未検出 - デフォルトを追加');
            detectedCharacters.push('purattokun');  // 既存プロジェクト互換性
        }
        
        console.log(`✅ 全キャラクター検出完了: [${detectedCharacters.join(', ')}]`);
        return detectedCharacters;
    },
    
    // 🎯 動的キャラクターファイル生成
    async generateCharacterFiles(characterName) {
        console.log(`📁 ${characterName}用ファイルパス生成`);
        
        const characterFiles = {
            spineFiles: [
                `assets/spine/characters/${characterName}/${characterName}.json`,
                `assets/spine/characters/${characterName}/${characterName}.atlas`,
                `assets/spine/characters/${characterName}/${characterName}.png`
            ],
            characterImageFiles: [
                `assets/images/${characterName}.png`,      // 標準命名
                `assets/images/${characterName}n.png`      // purattokunnパターン対応
            ]
        };
        
        console.log('📋 生成されたファイルパス:', characterFiles);
        return characterFiles;
    },

    // メイン関数：パッケージ出力実行
    async exportPackage() {
        if (this.isProcessing) {
            console.warn('⚠️ パッケージ出力処理中です');
            return;
        }
        
        try {
            this.isProcessing = true;
            console.log('📦 パッケージ出力開始（汎用化版）');
            
            // 🎯 Step 0: 全キャラクター検出（完全パッケージ版）
            console.log('🔍 Step 0: 全キャラクター検出（お客様納品用完全版）');
            this.allCharacters = await this.detectAllCharacters();
            if (!this.allCharacters || this.allCharacters.length === 0) {
                throw new Error('キャラクターの検出に失敗しました');
            }
            console.log(`✅ 検出した全キャラクター: [${this.allCharacters.join(', ')}]`);
            
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

    // Step 1: 全キャラクター位置データ収集（完全パッケージ版）
    async collectPositionData() {
        console.log('📊 全キャラクター位置データ収集開始（完全パッケージ版）');
        
        try {
            // ✅ 前提条件確認: allCharactersが設定されていない場合は事前検出
            if (!this.allCharacters || this.allCharacters.length === 0) {
                console.log('🔍 allCharacters未設定 - 事前検出実行');
                this.allCharacters = await this.detectAllCharacters();
            }
            
            this.allPositionData = {};
            
            // === 1. localStorage v3.0全キャラクター位置データ取得 ===
            console.log('💾 Step 1.1: localStorage v3.0全キャラクター位置データ取得');
            const savedStateString = localStorage.getItem('spine-positioning-state');
            
            if (savedStateString) {
                try {
                    const savedState = JSON.parse(savedStateString);
                    
                    // v3.0形式: { characters: { "nezumi-canvas": {...}, "purattokun-canvas": {...} } }
                    if (savedState && savedState.characters) {
                        console.log('💾 localStorage v3.0形式検出 - 全キャラクター位置データあり');
                        
                        for (const [characterId, positionData] of Object.entries(savedState.characters)) {
                            const characterName = characterId.replace('-canvas', '');
                            // ✅ 安全チェック: allCharactersが配列であることを確認
                            if (Array.isArray(this.allCharacters) && this.allCharacters.includes(characterName)) {
                                this.allPositionData[characterName] = positionData;
                                console.log(`  ✅ ${characterName}: localStorage位置データ取得成功`);
                            }
                        }
                    }
                    // v2.0形式互換性: { character: {...} }
                    else if (savedState && savedState.character) {
                        console.log('💾 localStorage v2.0形式検出 - 単一キャラクター位置データ');
                        // 🔧 修正: v2.0データを全キャラクターに適用（既存プロジェクト互換性）
                        // MultiCharacterManagerが利用できない場合も考慮
                        let targetCharacterName = null;
                        
                        // 1. MultiCharacterManagerから現在のキャラクター取得を試行
                        if (typeof MultiCharacterManager !== 'undefined' && MultiCharacterManager.activeCharacter) {
                            targetCharacterName = MultiCharacterManager.activeCharacter.id.replace('-canvas', '');
                        }
                        // 2. フォールバック: allCharactersの最初のキャラクター
                        else if (Array.isArray(this.allCharacters) && this.allCharacters.length > 0) {
                            targetCharacterName = this.allCharacters[0];
                            console.log(`💡 フォールバック: ${targetCharacterName} にv2.0データを適用`);
                        }
                        
                        if (targetCharacterName && this.allCharacters.includes(targetCharacterName)) {
                            this.allPositionData[targetCharacterName] = savedState.character;
                            console.log(`  ✅ ${targetCharacterName}: v2.0互換性データ適用成功`);
                        } else {
                            console.warn('⚠️ v2.0データの適用対象キャラクターが見つかりません');
                        }
                    }
                } catch (parseError) {
                    console.warn('⚠️ localStorage解析エラー:', parseError);
                }
            } else {
                console.log('💡 localStorage未保存 - DOM状態から全キャラクター位置を取得');
            }
            
            // === 2. localStorageデータがないキャラクターのDOM状態から取得 ===
            console.log('🎯 Step 1.2: 未保存キャラクターのDOM位置データ取得');
            
            // ✅ 安全チェック: allCharactersが配列であることを確認
            if (Array.isArray(this.allCharacters)) {
                for (const characterName of this.allCharacters) {
                    if (!this.allPositionData[characterName]) {
                        console.log(`🔍 ${characterName}: localStorageデータなし - DOMから取得`);
                        
                        const element = document.getElementById(`${characterName}-canvas`);
                        if (element) {
                            const rect = element.getBoundingClientRect();
                            const parentRect = element.parentElement?.getBoundingClientRect();
                            const computedStyle = window.getComputedStyle(element);
                            
                            const domPosition = {
                                left: element.style.left || computedStyle.left || '35%',
                                top: element.style.top || computedStyle.top || '75%',
                                width: element.style.width || computedStyle.width || '25%',
                                height: element.style.height || computedStyle.height || 'auto',
                                transform: element.style.transform || computedStyle.transform || 'translate(-50%, -50%)'
                            };
                            
                            this.allPositionData[characterName] = domPosition;
                            console.log(`  ✅ ${characterName}: DOM位置データ取得成功`);
                        } else {
                            console.warn(`  ⚠️ ${characterName}: DOM要素が見つからない - デフォルト値使用`);
                            this.allPositionData[characterName] = {
                                left: '35%', top: '75%', width: '25%', height: 'auto',
                                transform: 'translate(-50%, -50%)'
                            };
                        }
                    }
                }
            } else {
                console.warn('⚠️ allCharactersが配列ではありません:', this.allCharacters);
            }
            
            // === 3. 全キャラクター位置データ正規化 ===
            console.log('🔧 Step 1.3: 全キャラクター位置データ正規化');
            
            for (const [characterName, positionData] of Object.entries(this.allPositionData)) {
                this.allPositionData[characterName] = this.normalizePositionData(positionData);
            }
            
            console.log('✅ 全キャラクター位置データ収集完了:', this.allPositionData);
            
            // 🔍 品質保証: データ整合性の詳細確認
            console.log('🔍 品質保証チェック:');
            for (const [characterName, positionData] of Object.entries(this.allPositionData)) {
                console.log(`  📊 ${characterName}:`, {
                    left: positionData.left,
                    top: positionData.top,
                    width: positionData.width,
                    height: positionData.height,
                    transform: positionData.transform
                });
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ 全キャラクター位置データ収集エラー:', error);
            return false;
        }
    },

    // 位置データの正規化・検証（精度保持改善版）
    normalizePositionData(data) {
        const normalized = { ...data };
        
        // 🔧 精度保持: 不必要な変換を回避し、元のデータをそのまま保持
        ['left', 'top', 'width', 'height'].forEach(prop => {
            if (normalized[prop] && typeof normalized[prop] === 'string') {
                // 既に適切な形式の場合はそのまま保持（精度誤差防止）
                if (normalized[prop].includes('%') || normalized[prop].includes('px') || normalized[prop] === 'auto') {
                    console.log(`✅ ${prop}: 適切な形式を保持: ${normalized[prop]}`);
                } else {
                    console.log(`🔧 ${prop}: 形式が不明、そのまま保持: ${normalized[prop]}`);
                }
            }
        });
        
        // transformの正規化（デフォルト値設定のみ）
        if (!normalized.transform || normalized.transform === 'none') {
            normalized.transform = 'translate(-50%, -50%)';
            console.log('🔧 transform正規化: translate(-50%, -50%)を設定');
        }
        
        console.log('🔧 位置データ正規化完了（精度保持版）:', normalized);
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

    // 位置データのCSS埋め込み（全キャラクター対応版）
    embedPositionData(htmlContent) {
        console.log('📐 全キャラクター位置データCSS埋め込み開始');
        
        if (!this.allPositionData || Object.keys(this.allPositionData).length === 0) {
            console.error('❌ 全キャラクター位置データがありません - 埋め込み処理を中断');
            return htmlContent;
        }
        
        console.log('📋 埋め込み対象位置データ:', this.allPositionData);
        
        // === 1. 全キャラクター用CSS生成 ===
        const allCharactersCSS = this.generateAllCharactersCSS(this.allPositionData);
        console.log('🔧 生成されたCSS:', allCharactersCSS);
        
        // === 2. <style>ブロック作成・埋め込み ===
        const newStyleBlock = `    <style>
        /* 📦 パッケージ固定化: localStorage位置データより生成（全キャラクター対応） */
${allCharactersCSS}    </style>`;
        
        console.log('📦 生成されたスタイルブロック:', newStyleBlock);
        
        // === 3. </head>の直前に埋め込み ===
        const headCloseIndex = htmlContent.lastIndexOf('</head>');
        if (headCloseIndex !== -1) {
            htmlContent = htmlContent.slice(0, headCloseIndex) + newStyleBlock + '\n' + htmlContent.slice(headCloseIndex);
            console.log('✅ 全キャラクター対応<style>ブロック追加完了');
        } else {
            console.warn('⚠️ </head>タグが見つからない - 埋め込み失敗');
            return htmlContent;
        }
        
        // === 4. Canvas要素のinlineスタイル属性を削除（CSS優先度問題解決） ===
        console.log('🔧 Canvas要素inlineスタイル属性削除開始');
        
        // ✅ 安全チェック: allCharactersが配列であることを確認
        if (Array.isArray(this.allCharacters)) {
            for (const characterName of this.allCharacters) {
                // Canvas要素のstyle属性を削除
                const canvasStylePattern = new RegExp(`(<canvas[^>]*id="${characterName}-canvas"[^>]*?)\\s*style="[^"]*"([^>]*>)`, 'g');
                htmlContent = htmlContent.replace(canvasStylePattern, '$1$2');
                
                // フォールバック要素のstyle属性も削除
                const fallbackStylePattern = new RegExp(`(<div[^>]*id="${characterName}-fallback"[^>]*?)\\s*style="[^"]*"([^>]*>)`, 'g');
                htmlContent = htmlContent.replace(fallbackStylePattern, '$1$2');
                
                console.log(`  ✅ ${characterName}: inlineスタイル属性削除完了`);
            }
        } else {
            console.warn('⚠️ allCharactersが配列ではありません - inlineスタイル削除をスキップ:', this.allCharacters);
        }
        
        console.log('✅ 全キャラクター位置データCSS埋め込み成功（inlineスタイル競合解決済み）');
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
    
    // 🎯 全キャラクター用CSS生成（完全パッケージ版）
    generateAllCharactersCSS(allPositionData) {
        console.log('🎨 全キャラクター用CSS生成開始', Object.keys(allPositionData));
        
        let allCSS = '';
        
        for (const [characterName, positionData] of Object.entries(allPositionData)) {
            console.log(`🎨 ${characterName}用CSS生成`);
            
            const cssLines = [];
            
            // Layer 1: CSS基本配置
            if (positionData.left) cssLines.push(`            left: ${positionData.left};`);
            if (positionData.top) cssLines.push(`            top: ${positionData.top};`);
            if (positionData.width) cssLines.push(`            width: ${positionData.width};`);
            if (positionData.height && positionData.height !== 'auto') cssLines.push(`            height: ${positionData.height};`);
            
            // Layer 2: transform制御
            if (positionData.transform) {
                cssLines.push(`            transform: ${positionData.transform};`);
            }
            
            // 品質保証：重要なCSS属性も含める
            cssLines.push(`            position: absolute;`);
            cssLines.push(`            /* ${characterName}位置データ（パッケージ固定化） */`);
            
            const characterCSS = cssLines.join('\n') + '\n';
            
            // キャラクター固有セレクターでスタイルを定義
            allCSS += `        #${characterName}-canvas {\n${characterCSS}        }\n\n`;
            
            console.log(`  ✅ ${characterName}: CSS生成完了`);
        }
        
        console.log('✅ 全キャラクター用CSS生成完了');
        return allCSS;
    },

    // Step 3: 依存ファイル収集（完全パッケージ版）
    async collectDependencyFiles() {
        console.log('📁 依存ファイル収集開始（完全パッケージ版）');
        
        try {
            this.collectedFiles.clear();
            
            // 🎯 全キャラクター用ファイル収集
            console.log(`🐈 全キャラクターファイル収集: [${this.allCharacters.join(', ')}]`);
            
            for (const characterName of this.allCharacters) {
                console.log(`\n🎯 === ${characterName}キャラクターファイル収集開始 ===`);
                
                const characterFiles = await this.generateCharacterFiles(characterName);
                
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
            
            // 3. 共通画像ファイル収集（背景等）
            console.log('🖼️ 共通画像ファイル収集');
            for (const filePath of this.config.staticFiles.imageFiles) {
                if (!await this.collectFileWithFallback(filePath)) {
                    console.warn(`⚠️ 共通画像ファイル収集失敗（継続）: ${filePath}`);
                }
            }
            
            // 4. 統合ファイル収集
            console.log('📚 統合ファイル収集');
            for (const filePath of this.config.staticFiles.integrationFiles) {
                if (!await this.collectFileWithFallback(filePath)) {
                    console.warn(`⚠️ 統合ファイル収集失敗（継続）: ${filePath}`);
                }
            }
            
            console.log(`✅ 依存ファイル収集完了（汎用化版）: ${this.collectedFiles.size}個`);
            return true;
            
        } catch (error) {
            console.error('❌ 依存ファイル収集エラー:', error);
            return false;
        }
    },
    
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

    // Global export
    window.PackageExportSystem = PackageExportSystem;
}

// ========== 外部インターフェース ========== //

/**
 * パッケージ出力実行関数（外部インターフェース）
 */
async function exportPackage() {
    return await PackageExportSystem.exportPackage();
}

console.log('✅ Spine Package Export System モジュール読み込み完了');
console.log('🔍 Global exports確認:', {
    PackageExportSystem: typeof window.PackageExportSystem,
    exportPackage: typeof window.exportPackage
});

// Global exports（重複チェック）
if (typeof window.exportPackage === 'undefined') {
    window.exportPackage = exportPackage;
    console.log('✅ window.exportPackage関数をexport');
}

// 読み込み完了のイベント発火
if (typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('PackageExportSystemLoaded', {
        detail: { PackageExportSystem, exportPackage }
    }));
    console.log('✅ PackageExportSystemLoadedイベント発火');
}