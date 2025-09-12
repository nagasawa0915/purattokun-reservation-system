/**
 * DirectSpineLoader - File APIから直接Spineアセットを読み込む
 * 
 * 🎯 目的
 * - MeshAttachment.updateRegion問題を根本回避
 * - FileToHttpBridgeをバイパスして直接データ処理
 * - 成功実績のある初期化パターンを使用
 * - page.getImage()が確実に動作するTextureAtlas作成
 * 
 * 🔧 技術アプローチ
 * - File System Access API経由でファイル直接読み込み
 * - Blob URLを使わずに直接Image/TextureAtlas初期化
 * - test-stable-spine-basic.htmlの成功パターンを移植
 * - SpineJS 4.1.24の正確な初期化フローに従う
 */

class DirectSpineLoader {
    constructor() {
        this.debug = true;
    }

    /**
     * ログ出力（デバッグ用）
     */
    log(message, type = 'info') {
        if (!this.debug) return;
        
        const emoji = {
            info: '📋',
            success: '✅',
            error: '❌',
            warning: '⚠️'
        };
        
        console.log(`${emoji[type]} DirectSpineLoader: ${message}`);
    }

    /**
     * File System Access APIでSpineファイルを選択
     * @returns {Object} {atlasFile, jsonFile, textureFile}
     */
    async selectSpineFiles() {
        this.log('ファイル選択ダイアログを開始...');
        
        try {
            // File System Access API使用
            const fileHandles = await window.showOpenFilePicker({
                multiple: true,
                types: [{
                    description: 'Spine files',
                    accept: {
                        'text/plain': ['.atlas'],
                        'application/json': ['.json'],
                        'image/png': ['.png'],
                        'image/jpeg': ['.jpg', '.jpeg']
                    }
                }]
            });
            
            this.log(`${fileHandles.length}個のファイルを選択`);
            
            // ファイル種別の分類
            const files = {};
            for (const fileHandle of fileHandles) {
                const file = await fileHandle.getFile();
                const extension = file.name.split('.').pop().toLowerCase();
                
                if (extension === 'atlas') {
                    files.atlasFile = file;
                } else if (extension === 'json') {
                    files.jsonFile = file;
                } else if (['png', 'jpg', 'jpeg'].includes(extension)) {
                    files.textureFile = file;
                }
            }
            
            // 必須ファイルチェック
            const required = ['atlasFile', 'jsonFile', 'textureFile'];
            const missing = required.filter(key => !files[key]);
            
            if (missing.length > 0) {
                throw new Error(`必須ファイルが不足: ${missing.join(', ')}`);
            }
            
            this.log('✅ 必須ファイルの選択完了');
            return files;
            
        } catch (error) {
            this.log(`ファイル選択エラー: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * 画像ファイルからHTMLImageElementを作成
     * @param {File} textureFile 
     * @returns {HTMLImageElement}
     */
    async loadImageFromFile(textureFile) {
        this.log(`画像読み込み開始: ${textureFile.name}`);
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.log(`✅ 画像読み込み完了: ${img.width}x${img.height}`, 'success');
                resolve(img);
            };
            
            img.onerror = (error) => {
                this.log(`画像読み込み失敗: ${error}`, 'error');
                reject(new Error(`画像読み込み失敗: ${textureFile.name}`));
            };
            
            // FileをBlob URLに変換して設定
            const blobUrl = URL.createObjectURL(textureFile);
            img.src = blobUrl;
        });
    }

    /**
     * 成功パターンに基づくTextureAtlas作成
     * @param {string} atlasData - atlasファイルの内容
     * @param {HTMLImageElement} img - 読み込み済み画像
     * @returns {Object} TextureAtlasオブジェクト
     */
    createTextureAtlas(atlasData, img) {
        this.log('TextureAtlas作成開始...');
        
        try {
            // 🚨 重要: TextureLoader.loadが呼ばれるかテスト
            let loadCalled = false;
            
            // test-stable-spine-basic.htmlの成功パターンを使用
            const textureLoader = {
                load: (page, path) => {
                    loadCalled = true;
                    this.log(`✅ TextureLoader.load呼び出し: ${path}`);
                    
                    // WebGLコンテキストを確実に取得（複数の方法でフォールバック）
                    let gl = this.gl;
                    if (!gl) {
                        gl = window.gl;
                    }
                    if (!gl) {
                        const canvas = document.querySelector('canvas') || document.querySelector('#spineCanvas');
                        if (canvas) {
                            gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
                        }
                    }
                    if (!gl) {
                        throw new Error('WebGLコンテキストが見つかりません - Canvas要素を確認してください');
                    }
                    this.log(`✅ WebGLコンテキスト取得成功: ${gl.constructor.name}`);
                    
                    // 🚨 重要: SpineJSが期待する確実な初期化
                    // GLTexture参照のフォールバック
                    const GLTextureClass = window.spine?.webgl?.GLTexture || 
                                          window.spine?.GLTexture || 
                                          (window.spine && window.spine.webgl && window.spine.webgl.GLTexture);
                    
                    if (!GLTextureClass) {
                        this.log('❌ GLTextureクラスが見つかりません！', 'error');
                        this.log('🔍 window.spine:', !!window.spine);
                        this.log('🔍 window.spine.webgl:', !!window.spine?.webgl);
                        throw new Error('SpineJS WebGLライブラリが読み込まれていません');
                    }
                    
                    const glTexture = new GLTextureClass(gl, img);
                    page.rendererObject = glTexture;
                    page.width = img.width;
                    page.height = img.height;
                    
                    // 🎯 重要: getImage()メソッドを確実に設定
                    page.getImage = () => {
                        this.log(`page.getImage()呼び出し - img: ${img ? 'OK' : 'NULL'}`);
                        return img;
                    };
                    
                    this.log(`✅ page初期化完了: ${page.width}x${page.height}`);
                },
                unload: (texture) => {
                    if (texture && texture.dispose) {
                        texture.dispose();
                    }
                }
            };
            
            // TextureAtlas作成
            this.log('🔧 SpineJS TextureAtlas作成開始...');
            this.log(`🔍 atlasData長さ: ${atlasData.length}文字`);
            this.log(`🔍 atlasData内容プレビュー: ${atlasData.substring(0, 200)}...`);
            
            const atlas = new window.spine.TextureAtlas(atlasData, textureLoader);
            
            this.log(`🔍 作成されたAtlas詳細:`);
            this.log(`  pages数: ${atlas.pages?.length || 0}`);
            this.log(`  regions数: ${atlas.regions?.length || 0}`);
            
            // 🔍 重要な診断: TextureLoader.loadが呼ばれたかチェック
            if (!loadCalled) {
                this.log('❌ 重要: TextureLoader.loadが呼ばれませんでした！', 'error');
                this.log('🔧 手動でpage初期化を実行します...', 'warning');
                
                // 手動でpage初期化を実行
                atlas.pages.forEach((page, index) => {
                    this.log(`🔧 手動page[${index}]初期化開始...`);
                    
                    // WebGLコンテキストを確実に取得（手動初期化用）
                    let gl = this.gl;
                    if (!gl) {
                        gl = window.gl;
                    }
                    if (!gl) {
                        const canvas = document.querySelector('canvas') || document.querySelector('#spineCanvas');
                        if (canvas) {
                            gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
                        }
                    }
                    if (!gl) {
                        throw new Error('手動初期化: WebGLコンテキストが見つかりません');
                    }
                    
                    // GLTexture参照のフォールバック
                    const GLTextureClass = window.spine?.webgl?.GLTexture || 
                                          window.spine?.GLTexture || 
                                          (window.spine && window.spine.webgl && window.spine.webgl.GLTexture);
                    
                    if (!GLTextureClass) {
                        this.log('❌ 手動初期化: GLTextureクラスが見つかりません！', 'error');
                        this.log('🔍 window.spine:', !!window.spine);
                        this.log('🔍 window.spine.webgl:', !!window.spine?.webgl);
                        this.log('🔍 available spine objects:', Object.keys(window.spine || {}));
                        throw new Error('SpineJS WebGLライブラリが読み込まれていません（手動初期化）');
                    }
                    
                    // GLTexture作成
                    const glTexture = new GLTextureClass(gl, img);
                    page.rendererObject = glTexture;
                    page.width = img.width;
                    page.height = img.height;
                    
                    // getImage()メソッド設定
                    page.getImage = () => {
                        this.log(`手動page[${index}].getImage()呼び出し - img: ${img ? 'OK' : 'NULL'}`);
                        return img;
                    };
                    
                    this.log(`✅ 手動page[${index}]初期化完了: ${page.width}x${page.height}`);
                });
            }
            
            this.log(`✅ TextureAtlas作成完了: ${atlas.pages.length}ページ`, 'success');
            
            // デバッグ: ページとリージョンの詳細確認
            atlas.pages.forEach((page, index) => {
                this.log(`📄 Page[${index}]: ${page.width}x${page.height}, getImage: ${typeof page.getImage}`);
            });
            
            atlas.regions.forEach((region, index) => {
                this.log(`🖼️ Region[${index}]: ${region.name}, page: ${region.page ? 'OK' : 'NULL'}`);
                if (region.page) {
                    this.log(`    page.width: ${region.page.width}, page.height: ${region.page.height}`);
                    this.log(`    page.getImage: ${typeof region.page.getImage}`);
                    this.log(`    page.rendererObject: ${region.page.rendererObject ? 'OK' : 'NULL'}`);
                } else {
                    this.log(`    ❌ region.page is NULL - これが問題の原因です！`);
                }
            });
            
            return atlas;
            
        } catch (error) {
            this.log(`TextureAtlas作成エラー: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Spineファイル群から完全なアセットデータを作成
     * @param {Object} files - {atlasFile, jsonFile, textureFile}
     * @param {WebGLRenderingContext} gl - WebGLコンテキスト
     * @returns {Object} {atlas, skeletonJsonData, img}
     */
    async loadSpineAssets(files, gl) {
        this.log('🚀 Spineアセット読み込み開始...');
        this.gl = gl; // TextureLoaderで使用
        
        try {
            // 並列でファイル読み込み
            const [atlasText, jsonText, img] = await Promise.all([
                files.atlasFile.text(),
                files.jsonFile.text(),
                this.loadImageFromFile(files.textureFile)
            ]);
            
            this.log('✅ 全ファイル読み込み完了');
            
            // TextureAtlas作成（成功パターン使用）
            const atlas = this.createTextureAtlas(atlasText, img);
            
            // JSONデータパース
            const skeletonJsonData = JSON.parse(jsonText);
            this.log('✅ SkeletonJSONパース完了');
            
            // 最終検証
            this.validateAssets(atlas, skeletonJsonData, img);
            
            return {
                atlas,
                skeletonJsonData,
                img,
                // 追加情報
                files,
                atlasText,
                jsonText
            };
            
        } catch (error) {
            this.log(`アセット読み込みエラー: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * 読み込んだアセットの検証
     */
    validateAssets(atlas, skeletonJsonData, img) {
        this.log('🔍 アセット検証開始...');
        
        // TextureAtlas検証
        if (!atlas || !atlas.pages || atlas.pages.length === 0) {
            throw new Error('TextureAtlasが無効です');
        }
        
        // 各ページのgetImage()メソッド検証
        for (let i = 0; i < atlas.pages.length; i++) {
            const page = atlas.pages[i];
            if (typeof page.getImage !== 'function') {
                throw new Error(`Page[${i}]のgetImage()が未定義です`);
            }
            
            const testImg = page.getImage();
            if (!testImg) {
                throw new Error(`Page[${i}]のgetImage()がnullを返します`);
            }
        }
        
        // SkeletonJSONデータ検証
        if (!skeletonJsonData || !skeletonJsonData.bones) {
            throw new Error('SkeletonJSONデータが無効です');
        }
        
        // 画像検証
        if (!img || img.width === 0 || img.height === 0) {
            throw new Error('画像が無効です');
        }
        
        this.log('✅ 全アセット検証完了', 'success');
    }

    /**
     * デフォルトのSpineファイルを読み込み（テスト用）
     * @param {string} character - キャラクター名（例：'nezumi'）
     * @param {WebGLRenderingContext} gl - WebGLコンテキスト
     * @returns {Object} アセットデータ
     */
    async loadDefaultSpineAssets(character = 'nezumi', gl) {
        this.log(`デフォルトアセット読み込み: ${character}`);
        this.gl = gl;
        
        try {
            // HTTPリクエストで既存アセットを読み込み
            const basePath = `/assets/spine/characters/${character}/`;
            const [atlasResponse, jsonResponse, imgElement] = await Promise.all([
                fetch(`${basePath}${character}.atlas`),
                fetch(`${basePath}${character}.json`),
                this.loadImageFromUrl(`${basePath}${character}.png`)
            ]);
            
            const [atlasText, jsonText] = await Promise.all([
                atlasResponse.text(),
                jsonResponse.text()
            ]);
            
            // TextureAtlas作成
            const atlas = this.createTextureAtlas(atlasText, imgElement);
            const skeletonJsonData = JSON.parse(jsonText);
            
            this.validateAssets(atlas, skeletonJsonData, imgElement);
            
            return {
                atlas,
                skeletonJsonData,
                img: imgElement,
                character
            };
            
        } catch (error) {
            this.log(`デフォルトアセット読み込みエラー: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * URLから画像を読み込み（デフォルトアセット用）
     */
    async loadImageFromUrl(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }
}

// モジュールエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DirectSpineLoader;
}

// ブラウザ環境でグローバルに利用可能にする
if (typeof window !== 'undefined') {
    window.DirectSpineLoader = DirectSpineLoader;
}