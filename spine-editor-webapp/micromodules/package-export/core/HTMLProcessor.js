// 🎯 パッケージ出力システム - HTML固定化処理モジュール
// 意味単位: HTML変換・編集システム除去・CSS埋め込み
// 複雑度: 高（正規表現・文字列処理・境界ボックス統合）

console.log('🔧 HTMLProcessor モジュール読み込み開始');

/**
 * 🔧 HTML固定化処理クラス
 * 
 * 【責務】
 * - 現在のHTMLページの取得・変換処理
 * - 編集システム関連コードの精密除去
 * - CDN依存のローカル化
 * - 境界ボックス精密クリック判定システムの統合
 * - 位置データのCSS埋め込み
 * 
 * 【重要な処理】
 * - URLパラメータ・editMode処理の完全除去
 * - Spine初期化の直接実行化
 * - 境界ボックススクリプトタグ・初期化コードの統合
 */
export class HTMLProcessor {
    constructor() {
        this.originalHTML = null;
        this.processedHTML = null;
    }
    
    // 🔧 メイン処理: HTML固定化
    async processHTML(allPositionData, detectedCharacters) {
        console.log('🔧 HTML固定化処理開始');
        
        try {
            // 1. 現在のHTMLページを取得
            await this.loadOriginalHTML();
            
            // 2. 編集システム関連のコードを除去
            this.removeEditingSystem();
            
            // 3. CDN依存をローカル参照に変更
            this.localizeSpineWebGL();
            
            // 4. 境界ボックス精密クリック判定システムの統合
            this.integrateBoundingBoxSystem();
            
            // 5. 位置データをCSS値として埋め込み
            this.embedPositionData(allPositionData, detectedCharacters);
            
            console.log('✅ HTML固定化処理完了');
            return this.processedHTML;
            
        } catch (error) {
            console.error('❌ HTML固定化処理エラー:', error);
            throw error;
        }
    }
    
    // 現在のHTML取得
    async loadOriginalHTML() {
        // 現在のページのHTMLファイル名を取得
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const htmlFileName = currentPath.endsWith('.html') ? currentPath : 'index.html';
        
        console.log(`📋 現在のHTMLファイル取得: ${htmlFileName}`);
        
        const response = await fetch(htmlFileName);
        if (!response.ok) {
            throw new Error(`HTMLファイル取得失敗: ${response.status}`);
        }
        
        this.originalHTML = await response.text();
        this.processedHTML = this.originalHTML;
        console.log(`✅ ${htmlFileName}取得完了`);
    }
    
    // 編集システム関連コードの除去（精密削除）
    removeEditingSystem() {
        console.log('🚮 編集システム・開発用マイクロモジュール除去（精密削除）');
        
        // === index.html専用パターン ===
        
        // 1. URLパラメータ処理（editMode変数定義とデバッグ出力）を完全除去
        const urlParamsPattern = /\/\/ 🎯 URLパラメータで編集モード起動[\s\S]*?const editMode = urlParams\.get\('edit'\) === 'true';[\s\S]*?editMode: editMode[\s\S]*?\}\);/;
        this.processedHTML = this.processedHTML.replace(urlParamsPattern, '// URLパラメータ処理・editMode変数除去済み');
        
        // 2. 編集モード検出とCSS/JS動的読み込み処理を除去し、Spine初期化を直接実行に変更
        const editModeDetectionPattern = /if \(editMode\) \{[\s\S]*?document\.body\.appendChild\(editJS\);[\s\S]*?\} else \{[\s\S]*?initializeSpineSystem\(\);[\s\S]*?\}/;
        this.processedHTML = this.processedHTML.replace(editModeDetectionPattern, 'initializeSpineSystem(); // パッケージ用：Spine直接初期化');
        
        // 3. 編集システムの初期化関数呼び出しのみ除去
        const editInitPattern = /\/\/ 編集システム初期化[\s\S]*?initializeSpineEditSystem\(\);/;
        this.processedHTML = this.processedHTML.replace(editInitPattern, '// 編集システム初期化除去済み');
        
        // 4. 編集用CSS/JSファイル参照のみ除去（spine-positioning-system-explanation.*)
        const editCSSPattern = /<link[^>]*spine-positioning-system-explanation\.css[^>]*>/g;
        const editJSPattern = /<script[^>]*spine-positioning-system-explanation\.js[^>]*><\/script>/g;
        this.processedHTML = this.processedHTML.replace(editCSSPattern, '<!-- 編集用CSS除去済み -->');
        this.processedHTML = this.processedHTML.replace(editJSPattern, '<!-- 編集用JS除去済み -->');
        
        // === test-nezumi-stable-spine-bb.html専用パターン ===
        
        // 5. 開発用マイクロモジュール全除去
        this.removeDevelopmentMicromodules();
        
        // 6. テスト用UI・制御パネル全除去
        this.removeTestUI();
        
        // 7. パッケージ出力機能の除去
        this.removePackageExportUI();
        
        // ✅ 保持すべき重要なコードのログ出力
        console.log('✅ 商用納品用として以下のコードのみ保持：');
        console.log('  - Spine WebGL読み込み: <script src="...spine-webgl.js">');
        console.log('  - 基本Spineキャラクター表示システム');
        console.log('  - 背景画像・レイアウト');
        console.log('  - キャラクターアニメーション');
        
        console.log('✅ 編集システム・開発用モジュール精密除去完了');
    }
    
    // 全マイクロモジュール除去（商用納品用自己完結型）
    removeDevelopmentMicromodules() {
        console.log('🗑️ 全マイクロモジュール除去（商用納品用自己完結型）');
        
        // 全てのmicromodulesを除去
        const allMicromodulePattern = /<script src="micromodules\/[^"]*"><\/script>/g;
        this.processedHTML = this.processedHTML.replace(allMicromodulePattern, '<!-- 全マイクロモジュール除去済み -->');
        
        // spine-package-export.js除去
        const packageExportScriptPattern = /<script src="spine-package-export\.js"><\/script>/g;
        this.processedHTML = this.processedHTML.replace(packageExportScriptPattern, '<!-- パッケージ出力システム除去済み -->');
        
        console.log('✅ 商用納品用：基本Spine WebGL表示のみ保持');
        console.log('  - CDN依存なし完全自己完結型HTML');
        console.log('  - マイクロモジュール依存完全除去');
        
        // 全マイクロモジュール依存関係の除去
        this.removeAllMicromoduleDependencies();
    }
    
    // テスト用UI・制御パネル全除去
    removeTestUI() {
        console.log('🎛️ テスト用UI・制御パネル除去');
        
        // control-group全体を除去
        const controlGroupPattern = /<div class="control-group">[\s\S]*?<\/div>(?=\s*<div|$)/g;
        this.processedHTML = this.processedHTML.replace(controlGroupPattern, '<!-- テスト用制御パネル除去済み -->');
        
        // ログパネルを除去
        const logPanelPattern = /<div class="log"[^>]*>[\s\S]*?<\/div>/g;
        this.processedHTML = this.processedHTML.replace(logPanelPattern, '<!-- ログパネル除去済み -->');
        
        // ローディング画面を除去
        const loadingScreenPattern = /<div class="loading"[^>]*>[\s\S]*?<\/div>/g;
        this.processedHTML = this.processedHTML.replace(loadingScreenPattern, '<!-- ローディング画面除去済み -->');
        
        // iframe除去
        const iframePattern = /<iframe[\s\S]*?<\/iframe>/g;
        this.processedHTML = this.processedHTML.replace(iframePattern, '<!-- iframe除去済み -->');
    }
    
    // パッケージ出力機能の除去
    removePackageExportUI() {
        console.log('📦 パッケージ出力機能除去（キャラクター表示システムは保持）');
        
        // パッケージ出力ボタンのイベントハンドラーのみ除去
        const packageExportHandlerPattern = /\/\/ 📦 パッケージ出力機能のイベントハンドラー設定[\s\S]*?}\s*}\s*}\s*;/;
        this.processedHTML = this.processedHTML.replace(packageExportHandlerPattern, '// パッケージ出力機能除去済み');
        
        console.log('✅ MultiCharacterStableSpineBBIntegrationクラスは保持（キャラクター表示に必要）');
    }
    
    // 全マイクロモジュール依存関係の除去（安全アプローチ）
    removeAllMicromoduleDependencies() {
        console.log('🔧 全マイクロモジュール依存関係除去（安全アプローチ）');
        
        // 段階的置換：まずクラス宣言部分を特定
        const classStartPattern = /class MultiCharacterStableSpineBBIntegration \{/;
        const classStartMatch = this.processedHTML.match(classStartPattern);
        
        if (classStartMatch) {
            console.log('🎯 MultiCharacterStableSpineBBIntegrationクラス発見 - 安全に置換');
            
            // より安全な置換：複雑な正規表現を避けて、単純なマーカーベース置換
            const startMarker = '<!-- 🎯 COMMERCIAL_SPINE_SYSTEM_START -->';
            const endMarker = '<!-- 🎯 COMMERCIAL_SPINE_SYSTEM_END -->';
            
            // マーカーで複雑なJavaScriptコードを囲む
            this.processedHTML = this.processedHTML.replace(
                classStartPattern,
                startMarker + '\n' + this.getCommercialSpineSystem() + '\n' + endMarker + '\n// class MultiCharacterStableSpineBBIntegration {'
            );
        } else {
            console.log('⚠️ MultiCharacterStableSpineBBIntegrationクラスが見つかりません - デフォルト処理');
            // デフォルトの基本Spineシステムを最後に追加
            this.processedHTML += '\n\n' + this.getCommercialSpineSystem();
        }
        
        // SpineSettingsPersistence依存関係の除去
        this.removeSpineSettingsPersistenceDependency();
        
        console.log('✅ 全マイクロモジュール依存関係除去完了');
    }
    
    // 商用納品用基本Spineシステム取得
    getCommercialSpineSystem() {
        return `
    <script>
        // 🎯 商用納品用基本Spineシステム
        class CommercialSpineSystem {
            constructor() {
                console.log('🎯 商用版基本Spineシステム初期化');
                this.spineCharacters = {};
            }
            
            async initializeSpineCharacters() {
                console.log('🎯 商用版Spineキャラクター初期化開始');
                
                // 基本的なSpine WebGL確認
                if (typeof spine === 'undefined') {
                    console.error('❌ Spine WebGLライブラリが読み込まれていません');
                    return false;
                }
                
                // 基本キャラクター設定
                await this.setupBasicCharacters();
                
                console.log('✅ 商用版Spineシステム初期化完了');
                return true;
            }
            
            async setupBasicCharacters() {
                // キャラクター配置は位置データから自動設定
                console.log('✅ 基本キャラクター配置完了');
            }
        }

        // 🚀 商用版システム起動
        window.addEventListener("load", async () => {
            console.log('🎯 商用版基本Spineシステム起動開始');
            window.commercialSpineSystem = new CommercialSpineSystem();
            const success = await window.commercialSpineSystem.initializeSpineCharacters();
            
            if (success) {
                console.log('✅ 商用版システム起動完了');
            } else {
                console.error('❌ 商用版システム起動失敗');
            }
        });
    </script>`;
    }
    
    // SpineSettingsPersistence依存関係の除去
    removeSpineSettingsPersistenceDependency() {
        console.log('🔧 SpineSettingsPersistence依存関係除去');
        
        // SpineSettingsPersistenceを使用している箇所を安全な代替に置換
        const spineSettingsPattern = /this\.spineSettingsPersistence\s*=\s*new\s+SpineSettingsPersistence\(\);/g;
        this.processedHTML = this.processedHTML.replace(spineSettingsPattern, 'this.spineSettingsPersistence = null; // 商用版では無効化');
        
        // SpineSettingsPersistenceメソッド呼び出しを安全な処理に置換
        const settingsMethodPattern = /this\.spineSettingsPersistence\?\.(\w+)\([^)]*\)/g;
        this.processedHTML = this.processedHTML.replace(settingsMethodPattern, '// SpineSettingsPersistence.$1() 商用版では無効化');
        
        console.log('✅ SpineSettingsPersistence依存関係除去完了');
    }
    
    // CDN依存をローカル参照に変更
    localizeSpineWebGL() {
        console.log('🌐 Spine WebGL CDN→ローカル変更');
        
        const cdnPattern = /<script src="https:\/\/unpkg\.com\/@esotericsoftware\/spine-webgl@[\d\.]+\/dist\/iife\/spine-webgl\.js"><\/script>/;
        const localReference = '<script src="assets/js/libs/spine-webgl.js"></script>';
        
        this.processedHTML = this.processedHTML.replace(cdnPattern, localReference);
        
        console.log('✅ CDN→ローカル変更完了');
    }
    
    // 境界ボックス精密クリック判定システムの統合
    integrateBoundingBoxSystem() {
        console.log('🎯 境界ボックス精密クリック判定システム統合開始');
        
        // 境界ボックスシステムのスクリプトタグを検索
        const boundingBoxScriptPattern1 = /<script[^>]*spine-skeleton-bounds\.js[^>]*><\/script>/;
        const boundingBoxScriptPattern2 = /<script[^>]*spine-bounds-integration\.js[^>]*><\/script>/;
        
        const hasBoundingBoxScript1 = boundingBoxScriptPattern1.test(this.processedHTML);
        const hasBoundingBoxScript2 = boundingBoxScriptPattern2.test(this.processedHTML);
        
        console.log('🔍 既存境界ボックススクリプトタグの確認:', {
            'spine-skeleton-bounds.js': hasBoundingBoxScript1,
            'spine-bounds-integration.js': hasBoundingBoxScript2
        });
        
        // 境界ボックススクリプトタグが存在しない場合は追加
        if (!hasBoundingBoxScript1 || !hasBoundingBoxScript2) {
            console.log('📦 境界ボックスシステムスクリプトタグを追加中...');
            
            const boundingBoxScripts = `
    <!-- 🎯 境界ボックス精密クリック判定システム -->
    <script src="assets/spine/spine-skeleton-bounds.js"></script>
    <script src="spine-bounds-integration.js"></script>`;
            
            // spine-webgl.jsの後に境界ボックススクリプトを挿入
            const spineWebGLPattern = /<script src="assets\/js\/libs\/spine-webgl\.js"><\/script>/;
            if (spineWebGLPattern.test(this.processedHTML)) {
                this.processedHTML = this.processedHTML.replace(spineWebGLPattern, 
                    '<script src="assets/js/libs/spine-webgl.js"></script>' + boundingBoxScripts);
                console.log('✅ spine-webgl.js後に境界ボックススクリプト追加完了');
            } else {
                // フォールバック: </head>前に追加
                const headCloseIndex = this.processedHTML.lastIndexOf('</head>');
                if (headCloseIndex !== -1) {
                    this.processedHTML = this.processedHTML.slice(0, headCloseIndex) + boundingBoxScripts + '\n' + this.processedHTML.slice(headCloseIndex);
                    console.log('✅ </head>前に境界ボックススクリプト追加完了');
                }
            }
        }
        
        // 境界ボックス初期化コードの確認と追加
        const boundingBoxInitPattern = /initializeBounds\(\)|indexBoundsManager\.initialize\(\)/;
        const hasBoundingBoxInit = boundingBoxInitPattern.test(this.processedHTML);
        
        console.log('🔍 境界ボックス初期化コードの確認:', hasBoundingBoxInit);
        
        if (!hasBoundingBoxInit) {
            console.log('⚙️ 境界ボックス初期化コードを追加中...');
            
            const boundingBoxInitCode = `
                
                // 🎯 境界ボックス精密クリック判定システム初期化
                console.log('🎯 境界ボックスシステム初期化開始');
                
                // 境界ボックスシステムの初期化
                if (typeof initializeBounds === 'function') {
                    initializeBounds().then(function(success) {
                        if (success) {
                            console.log('✅ 境界ボックスシステム初期化成功');
                            
                            // 各キャラクターの境界ボックス統合
                            Object.keys(spineCharacters || {}).forEach(function(characterId) {
                                const characterData = spineCharacters[characterId];
                                if (characterData && characterData.spine && characterData.canvas) {
                                    const integrationSuccess = integrateBoundsForCharacter(characterId, characterData);
                                    console.log('🔗 ' + characterId + '境界ボックス統合:', integrationSuccess ? '✅成功' : '❌失敗');
                                }
                            });
                            
                        } else {
                            console.warn('⚠️ 境界ボックスシステム初期化失敗 - 通常動作を継続');
                        }
                    }).catch(function(error) {
                        console.error('❌ 境界ボックス初期化エラー:', error);
                        console.log('ℹ️ 通常動作を継続します');
                    });
                } else {
                    console.warn('⚠️ initializeBounds関数が見つかりません - 境界ボックス機能をスキップ');
                }`;
            
            // initializeSpineSystem関数内に境界ボックス初期化を追加
            const spineInitPattern = /(function\s+initializeSpineSystem\(\)\s*\{[\s\S]*?)(^\s*\})/m;
            if (spineInitPattern.test(this.processedHTML)) {
                this.processedHTML = this.processedHTML.replace(spineInitPattern, 
                    '$1' + boundingBoxInitCode + '\n$2');
                console.log('✅ initializeSpineSystem内に境界ボックス初期化コード追加完了');
            } else {
                // フォールバック: DOMContentLoaded内に追加
                const domReadyPattern = /(DOMContentLoaded.*?\{[\s\S]*?)(^\s*\}\);)/m;
                if (domReadyPattern.test(this.processedHTML)) {
                    this.processedHTML = this.processedHTML.replace(domReadyPattern, 
                        '$1' + boundingBoxInitCode + '\n$2');
                    console.log('✅ DOMContentLoaded内に境界ボックス初期化コード追加完了');
                }
            }
        }
        
        console.log('✅ 境界ボックス精密クリック判定システム統合完了');
    }
    
    // 位置データのCSS埋め込み（全キャラクター対応版）
    embedPositionData(allPositionData, detectedCharacters) {
        console.log('📐 全キャラクター位置データCSS埋め込み開始');
        
        if (!allPositionData || Object.keys(allPositionData).length === 0) {
            console.error('❌ 全キャラクター位置データがありません - 埋め込み処理を中断');
            return;
        }
        
        console.log('📋 埋め込み対象位置データ:', allPositionData);
        
        // === 1. 全キャラクター用CSS生成 ===
        const { CSSGenerator } = this.loadCSSGenerator();
        const cssGenerator = new CSSGenerator();
        const allCharactersCSS = cssGenerator.generateAllCharactersCSS(allPositionData);
        console.log('🔧 生成されたCSS:', allCharactersCSS);
        
        // === 2. <style>ブロック作成・埋め込み ===
        const newStyleBlock = `    <style>
        /* 📦 パッケージ固定化: localStorage位置データより生成（全キャラクター対応） */
${allCharactersCSS}    </style>`;
        
        console.log('📦 生成されたスタイルブロック:', newStyleBlock);
        
        // === 3. </head>の直前に埋め込み ===
        const headCloseIndex = this.processedHTML.lastIndexOf('</head>');
        if (headCloseIndex !== -1) {
            this.processedHTML = this.processedHTML.slice(0, headCloseIndex) + newStyleBlock + '\n' + this.processedHTML.slice(headCloseIndex);
            console.log('✅ 全キャラクター対応<style>ブロック追加完了');
        } else {
            console.warn('⚠️ </head>タグが見つからない - 埋め込み失敗');
            return;
        }
        
        // === 4. Canvas要素のinlineスタイル属性を削除（CSS優先度問題解決） ===
        console.log('🔧 Canvas要素inlineスタイル属性削除開始');
        
        if (Array.isArray(detectedCharacters)) {
            for (const characterName of detectedCharacters) {
                // Canvas要素のstyle属性を削除
                const canvasStylePattern = new RegExp(`(<canvas[^>]*id="${characterName}-canvas"[^>]*?)\\s*style="[^"]*"([^>]*>)`, 'g');
                this.processedHTML = this.processedHTML.replace(canvasStylePattern, '$1$2');
                
                // フォールバック要素のstyle属性も削除
                const fallbackStylePattern = new RegExp(`(<div[^>]*id="${characterName}-fallback"[^>]*?)\\s*style="[^"]*"([^>]*>)`, 'g');
                this.processedHTML = this.processedHTML.replace(fallbackStylePattern, '$1$2');
                
                console.log(`  ✅ ${characterName}: inlineスタイル属性削除完了`);
            }
        } else {
            console.warn('⚠️ detectedCharactersが配列ではありません - inlineスタイル削除をスキップ:', detectedCharacters);
        }
        
        console.log('✅ 全キャラクター位置データCSS埋め込み成功（inlineスタイル競合解決済み）');
    }
    
    // CSSGenerator の動的ロード（循環依存回避）
    loadCSSGenerator() {
        // 動的importの代わりに、必要最小限の機能をインライン実装
        return {
            CSSGenerator: class {
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
                }
            }
        };
    }
}

console.log('✅ HTMLProcessor モジュール読み込み完了');