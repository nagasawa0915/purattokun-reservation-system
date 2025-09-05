// 🎯 パッケージ出力システム - 設定管理モジュール
// 意味単位: 設定データ・CDN設定・ファイルマッピング
// 複雑度: 低（データ構造・設定値）

console.log('⚙️ ExportConfig モジュール読み込み開始');

/**
 * ⚙️ パッケージ出力システム設定管理クラス
 * 
 * 【責務】
 * - パッケージ出力に関する全設定の一元管理
 * - CDN URL・バージョン管理
 * - ファイルパス・拡張子マッピング
 * - 環境別設定対応
 * 
 * 【設定項目】
 * - CDN依存ライブラリ（Spine WebGL等）
 * - 静的ファイルパス（画像・統合・境界ボックス）
 * - 出力設定（ZIP圧縮・ファイル名）
 */
export class ExportConfig {
    constructor() {
        this.config = this.getDefaultConfig();
    }
    
    // デフォルト設定取得
    getDefaultConfig() {
        return {
            // CDN依存ライブラリ
            cdn: {
                spineWebGL: {
                    url: 'https://unpkg.com/@esotericsoftware/spine-webgl@4.1.24/dist/iife/spine-webgl.js',
                    localPath: 'assets/js/libs/spine-webgl.js',
                    version: '4.1.24'
                },
                jszip: {
                    url: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
                    version: '3.10.1'
                }
            },
            
            // 静的ファイル設定
            staticFiles: {
                // 共通画像ファイル
                imageFiles: [
                    'assets/images/クラウドパートナーTOP.png'
                ],
                
                // Spine統合システムファイル
                integrationFiles: [
                    'assets/spine/spine-integration-v2.js',
                    'assets/spine/spine-character-manager.js'
                ],
                
                // 境界ボックス精密クリック判定システム
                boundingBoxFiles: [
                    'assets/spine/spine-skeleton-bounds.js',
                    'spine-bounds-integration.js'
                ]
            },
            
            // キャラクターファイル命名規則
            characterFiles: {
                spinePattern: 'assets/spine/characters/{CHARACTER_NAME}/{CHARACTER_NAME}.{EXTENSION}',
                spineExtensions: ['json', 'atlas', 'png'],
                imagePattern: 'assets/images/{CHARACTER_NAME}{SUFFIX}.png',
                imageSuffixes: ['', 'n'] // purattokun.png, purattokun.png 対応
            },
            
            // ZIP出力設定
            output: {
                filenamePrefix: 'spine-project-package',
                compression: {
                    type: 'blob',
                    algorithm: 'DEFLATE',
                    level: 6
                },
                includePaths: true // 元パス構造保持
            },
            
            // ファイルタイプマッピング
            fileTypes: {
                binary: ['png', 'jpg', 'jpeg', 'gif', 'ico', 'atlas'],
                text: ['js', 'json', 'html', 'css', 'txt', 'md']
            },
            
            // HTML固定化設定
            htmlProcessing: {
                // 除去対象パターン
                removePatterns: {
                    urlParams: /\/\/ 🎯 URLパラメータで編集モード起動[\s\S]*?const editMode = urlParams\.get\('edit'\) === 'true';[\s\S]*?editMode: editMode[\s\S]*?\}\);/,
                    editModeDetection: /if \(editMode\) \{[\s\S]*?document\.body\.appendChild\(editJS\);[\s\S]*?\} else \{[\s\S]*?initializeSpineSystem\(\);[\s\S]*?\}/,
                    editInit: /\/\/ 編集システム初期化[\s\S]*?initializeSpineEditSystem\(\);/,
                    editCSS: /<link[^>]*spine-positioning-system-explanation\.css[^>]*>/g,
                    editJS: /<script[^>]*spine-positioning-system-explanation\.js[^>]*><\/script>/g
                },
                
                // 置換設定
                replacements: {
                    cdnToLocal: {
                        pattern: /<script src="https:\/\/unpkg\.com\/@esotericsoftware\/spine-webgl@[\d\.]+\/dist\/iife\/spine-webgl\.js"><\/script>/,
                        replacement: '<script src="assets/js/libs/spine-webgl.js"></script>'
                    },
                    editModeToSpineInit: {
                        pattern: null, // 上記removePatterns.editModeDetectionと連動
                        replacement: 'initializeSpineSystem(); // パッケージ用：Spine直接初期化'
                    }
                },
                
                // 境界ボックス統合設定
                boundingBoxIntegration: {
                    scriptTemplate: `
    <!-- 🎯 境界ボックス精密クリック判定システム -->
    <script src="assets/spine/spine-skeleton-bounds.js"></script>
    <script src="spine-bounds-integration.js"></script>`,
                    initTemplate: `
                
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
                }`
                }
            }
        };
    }
    
    // 設定値取得
    get(path) {
        const keys = path.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    }
    
    // 設定値設定
    set(path, newValue) {
        const keys = path.split('.');
        let current = this.config;
        
        // 最後のキー以外を辿る
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        // 最後のキーに値を設定
        const lastKey = keys[keys.length - 1];
        current[lastKey] = newValue;
    }
    
    // キャラクターファイルパス生成
    generateCharacterFilePaths(characterName) {
        const spinePattern = this.get('characterFiles.spinePattern');
        const spineExtensions = this.get('characterFiles.spineExtensions');
        const imagePattern = this.get('characterFiles.imagePattern');
        const imageSuffixes = this.get('characterFiles.imageSuffixes');
        
        const characterFiles = {
            spineFiles: [],
            imageFiles: []
        };
        
        // Spineファイルパス生成
        for (const extension of spineExtensions) {
            const filePath = spinePattern
                .replace('{CHARACTER_NAME}', characterName)
                .replace('{EXTENSION}', extension);
            characterFiles.spineFiles.push(filePath);
        }
        
        // 画像ファイルパス生成
        for (const suffix of imageSuffixes) {
            const filePath = imagePattern
                .replace('{CHARACTER_NAME}', characterName)
                .replace('{SUFFIX}', suffix);
            characterFiles.imageFiles.push(filePath);
        }
        
        return characterFiles;
    }
    
    // ファイルタイプ判定
    getFileType(filePath) {
        const extension = filePath.split('.').pop().toLowerCase();
        const binaryExtensions = this.get('fileTypes.binary');
        const textExtensions = this.get('fileTypes.text');
        
        if (binaryExtensions.includes(extension)) return 'binary';
        if (textExtensions.includes(extension)) return 'text';
        
        return 'text'; // デフォルト
    }
    
    // CDN URL取得
    getCDNUrl(libraryName) {
        return this.get(`cdn.${libraryName}.url`);
    }
    
    // ローカルパス取得
    getLocalPath(libraryName) {
        return this.get(`cdn.${libraryName}.localPath`);
    }
    
    // 静的ファイル一覧取得
    getStaticFiles() {
        return {
            imageFiles: this.get('staticFiles.imageFiles') || [],
            integrationFiles: this.get('staticFiles.integrationFiles') || [],
            boundingBoxFiles: this.get('staticFiles.boundingBoxFiles') || []
        };
    }
    
    // ZIP出力設定取得
    getOutputConfig() {
        return {
            filenamePrefix: this.get('output.filenamePrefix'),
            compression: this.get('output.compression'),
            includePaths: this.get('output.includePaths')
        };
    }
    
    // HTML処理設定取得
    getHTMLProcessingConfig() {
        return this.get('htmlProcessing');
    }
    
    // 設定情報ログ出力
    logConfig() {
        console.log('⚙️ パッケージ出力設定情報:');
        console.log('  📚 CDN設定:', Object.keys(this.get('cdn')));
        console.log('  📁 静的ファイル数:', {
            images: this.get('staticFiles.imageFiles').length,
            integration: this.get('staticFiles.integrationFiles').length,
            boundingBox: this.get('staticFiles.boundingBoxFiles').length
        });
        console.log('  🗜️ 圧縮設定:', this.get('output.compression.algorithm'), 'level', this.get('output.compression.level'));
        console.log('  🔧 ファイルタイプ設定:', {
            binary: this.get('fileTypes.binary').length + '種類',
            text: this.get('fileTypes.text').length + '種類'
        });
    }
    
    // 設定検証
    validateConfig() {
        const required = [
            'cdn.spineWebGL.url',
            'staticFiles.imageFiles',
            'staticFiles.integrationFiles',
            'output.filenamePrefix'
        ];
        
        const missing = [];
        for (const path of required) {
            if (this.get(path) === undefined) {
                missing.push(path);
            }
        }
        
        if (missing.length > 0) {
            console.warn('⚠️ 必須設定が不足しています:', missing);
            return false;
        }
        
        console.log('✅ 設定検証完了');
        return true;
    }
}

console.log('✅ ExportConfig モジュール読み込み完了');