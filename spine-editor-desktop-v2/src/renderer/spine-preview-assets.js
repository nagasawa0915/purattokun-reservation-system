/**
 * Spine Preview Assets Module - Phase 2: アセット管理・AssetRegistry連携独立モジュール
 * 
 * 機能範囲:
 * - AssetRegistry統合・絶対URL化・decode完了待機
 * - キャラクター追加・削除・管理制御
 * - テクスチャ復旧システム（Context Lost対応）
 * - アセット読み込み待機・パス変換・解決
 * - 軽量化D&D（assetId参照）システム
 * 
 * Phase 2最適化:
 * - AssetRegistry連携機能の完全移譲・集約
 * - Context復旧時のアセット再構築自動化
 * - キャラクター管理の責務集約・独立化
 * - アセット状態管理・キャッシュ最適化
 */

export class SpinePreviewAssets {
    constructor(parentLayer) {
        this.parentLayer = parentLayer;
        
        // 🚀 Phase 2: AssetRegistry連携強化
        this._assetRegistry = null; // window.assetRegistryへの参照
        this._assetReadyCache = new Set(); // 準備完了済みアセットID
        this._contextRecoveryQueue = new Map(); // 復旧待ちアセット
        
        // 🚀 Phase 1保持: テクスチャ復旧用のアセット記録（下位互換性）
        this._textureAssets = new Map(); // characterId -> { atlas, json, pngs }
        
        // 🚀 Phase 2: キャラクター管理状態
        this._characterStates = new Map(); // characterId -> 詳細状態
        
        // 🔧 メソッドバインディング確保（エラー回避）
        this.recoverCharacterAsset = this.recoverCharacterAsset.bind(this);
        this.addCharacter = this.addCharacter.bind(this);
        this.removeCharacter = this.removeCharacter.bind(this);
        
        console.log('📦 SpinePreviewAssets初期化完了');
    }
    
    /**
     * 🚀 Phase 2: AssetRegistry連携確立
     */
    setupAssetRegistryIntegration() {
        if (typeof window !== 'undefined' && window.assetRegistry) {
            this._assetRegistry = window.assetRegistry;
            
            // Context管理モジュールにAssetRegistry参照を更新
            if (this.parentLayer.contextManager) {
                this.parentLayer.contextManager._assetRegistry = this._assetRegistry;
            }
            
            console.log('✅ AssetRegistry連携確立完了（assets module）');
        } else {
            console.warn('⚠️ AssetRegistry未検出 - 基本機能のみで動作（assets module）');
        }
        
        return this._assetRegistry !== null;
    }

    /**
     * 🚀 Phase 2: AssetRegistry単一真実源 - get処理（絶対URLのみ）
     * @param {string} assetId - アセットID
     * @returns {object} アセットデータ（絶対URL化済み）
     */
    get(assetId) {
        if (!this._assetRegistry) {
            console.warn('⚠️ AssetRegistry未接続');
            return null;
        }
        
        const assetData = this._assetRegistry.getAssetById(assetId);
        if (!assetData) {
            console.warn(`⚠️ アセット未登録: ${assetId}`);
            return null;
        }
        
        // 絶対URL化処理（pathToFileURL相当）
        const absoluteData = this.ensureAbsoluteUrls(assetData);
        
        console.log(`📦 AssetRegistry取得（絶対URL化済み）: ${assetId}`, absoluteData);
        return absoluteData;
    }

    /**
     * 🚀 Phase 2: 絶対URL化保証システム（pathToFileURL相当）
     * @param {object} assetData - 元アセットデータ
     * @returns {object} 絶対URL化済みアセットデータ
     */
    ensureAbsoluteUrls(assetData) {
        if (!assetData) return null;
        
        const result = { ...assetData };
        
        // ファイルパス → 絶対URL変換
        if (result.atlas && !result.atlas.startsWith('http') && !result.atlas.startsWith('file://')) {
            result.atlas = new URL(result.atlas, window.location.origin).href;
        }
        if (result.json && !result.json.startsWith('http') && !result.json.startsWith('file://')) {
            result.json = new URL(result.json, window.location.origin).href;
        }
        if (result.pngs && Array.isArray(result.pngs)) {
            result.pngs = result.pngs.map(png => {
                if (!png.startsWith('http') && !png.startsWith('file://')) {
                    return new URL(png, window.location.origin).href;
                }
                return png;
            });
        }
        
        // 単一テクスチャパス対応
        if (result.texturePath && !result.texturePath.startsWith('http') && !result.texturePath.startsWith('file://')) {
            result.texturePath = new URL(result.texturePath, window.location.origin).href;
        }
        
        return result;
    }
    
    /**
     * 🚀 Phase 2: AssetRegistry統合キャラクター復旧
     * @param {string} assetId - アセットID
     * @param {object} assetData - AssetRegistryからの復旧用データ
     */
    async recoverCharacterAsset(assetId, assetData) {
        try {
            console.log(`🔄 Phase 2: ${assetId} 復旧開始（assets module）`);
            
            if (!this.parentLayer.gl || this.parentLayer.contextManager.isContextLost()) {
                throw new Error('WebGLコンテキストが利用できません');
            }
            
            // AssetRegistryからの絶対URL化済みデータを使用
            const assetManager = new spine.AssetManager(this.parentLayer.gl);
            
            if (assetData.atlas) {
                assetManager.loadTextureAtlas(assetData.atlas);
            }
            if (assetData.json) {
                assetManager.loadText(assetData.json);
            }
            if (assetData.pngs && Array.isArray(assetData.pngs)) {
                assetData.pngs.forEach(png => {
                    assetManager.loadTexture(png);
                });
            }
            
            // 読み込み完了待機
            await this.waitForAssetsSimple(assetManager);
            
            // キャラクター状態復旧
            const character = this.parentLayer.characters.get(assetId);
            if (character && assetData.atlas && assetData.json) {
                const atlas = assetManager.require(assetData.atlas);
                const skeletonJson = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(atlas));
                const skeletonData = skeletonJson.readSkeletonData(assetManager.require(assetData.json));
                
                character.skeleton = new spine.Skeleton(skeletonData);
                character.animationState = new spine.AnimationState(new spine.AnimationStateData(skeletonData));
                
                // アニメーション復旧
                if (skeletonData.animations.length > 0) {
                    character.animationState.setAnimation(0, skeletonData.animations[0].name, true);
                }
                
                console.log(`✅ Phase 2: ${assetId} 復旧完了（assets module）`);
            }
            
        } catch (error) {
            console.error(`❌ Phase 2: ${assetId} 復旧失敗（assets module）:`, error);
        }
    }
    
    /**
     * 🚀 Phase 1保持: 全テクスチャ再アップロード（フォールバック用）
     */
    async _reuploadAllTextures() {
        console.log('🔄 Phase 1フォールバック: 全テクスチャ再アップロード開始（assets module）');
        
        let reuploadCount = 0;
        
        // 記録されたテクスチャアセットを再アップロード
        for (const [characterId, assets] of this._textureAssets) {
            try {
                console.log(`🔄 ${characterId} のテクスチャを再アップロード中...`);
                
                // 各キャラクターのアセットを再読み込み
                if (assets.atlas && assets.json && assets.pngs) {
                    const assetManager = new spine.AssetManager(this.parentLayer.gl);
                    
                    // 再読み込み
                    assetManager.loadTextureAtlas(assets.atlas);
                    assetManager.loadText(assets.json);
                    assets.pngs.forEach(png => {
                        assetManager.loadTexture(png);
                    });
                    
                    // 読み込み完了待機
                    await this.waitForAssetsSimple(assetManager);
                    
                    // キャラクター状態を復旧
                    const character = this.parentLayer.characters.get(characterId);
                    if (character) {
                        // Skeleton再構築
                        const atlas = assetManager.require(assets.atlas);
                        const skeletonJson = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(atlas));
                        const skeletonData = skeletonJson.readSkeletonData(assetManager.require(assets.json));
                        
                        character.skeleton = new spine.Skeleton(skeletonData);
                        character.animationState = new spine.AnimationState(new spine.AnimationStateData(skeletonData));
                        
                        // アニメーション復旧
                        if (skeletonData.animations.length > 0) {
                            character.animationState.setAnimation(0, skeletonData.animations[0].name, true);
                        }
                        
                        reuploadCount++;
                        console.log(`✅ ${characterId} テクスチャ復旧完了`);
                    }
                }
            } catch (error) {
                console.error(`❌ ${characterId} テクスチャ復旧失敗:`, error);
            }
        }
        
        console.log(`✅ Phase 1フォールバック: テクスチャ再アップロード完了 (${reuploadCount}件)`);
    }
    
    /**
     * 🚀 Phase 2: AssetRegistry連携Spineキャラクター追加
     * @param {Object} characterData - キャラクターデータ（AssetRegistryからの引数可能）
     * @param {number} x - X座標
     * @param {number} y - Y座標
     */
    async addCharacter(characterData, x, y) {
        // 🔧 安定化修正: 初期化完了確認
        if (!this.parentLayer.isReadyForCharacters()) {
            console.error('❌ SpinePreviewLayer初期化未完了（assets module）');
            return { success: false, error: 'SpinePreviewLayer初期化未完了' };
        }
        
        // データ整合性チェック
        if (!characterData) {
            console.error('❌ キャラクターデータが空です（assets module）');
            return { success: false, error: 'キャラクターデータが空です' };
        }
        
        const characterName = characterData.name || characterData.id;
        console.log('🔍 characterName確認:', { 
            characterName, 
            characterDataName: characterData.name, 
            characterDataId: characterData.id,
            type: typeof characterName
        });
        if (!characterName) {
            console.error('❌ キャラクター名が空です（assets module）:', characterData);
            return { success: false, error: 'キャラクター名が空です' };
        }
        
        // 🚀 Phase 2: AssetRegistry連携チェック
        let useAssetRegistry = false;
        let preparedAssetData = null;
        
        if (this._assetRegistry && characterName) {
            try {
                // AssetRegistryから準備済みデータを取得
                preparedAssetData = await this._assetRegistry.prepareAssetForRender(characterName);
                if (preparedAssetData) {
                    useAssetRegistry = true;
                    console.log(`🚀 Phase 2: ${characterName} AssetRegistry統合モードで読み込み（assets module）`);
                }
            } catch (error) {
                console.warn(`⚠️ ${characterName} AssetRegistry取得失敗 - フォールバックモード（assets module）:`, error);
            }
        }
        
        try {
            console.log(`🎭 Phase 2: ${characterName} 読み込み中...（AssetRegistry: ${useAssetRegistry}）（assets module）`);
            
            // 🚀 Phase 2: characterName有効性の最終確認
            if (!characterName || typeof characterName !== 'string') {
                throw new Error(`無効なキャラクター名: ${characterName} (型: ${typeof characterName})`);
            }
            
            // 🚀 Phase 2: パス変数初期化（必ず文字列を保証）
            let atlasPath = '';
            let jsonPath = '';
            let imagePath = '';
            
            // 🔄 フォールバックモード: 常に標準パス構成を使用（シンプル化）
            console.log('🔍 標準パス生成モード開始');
            console.log('🔍 characterName確認:', { characterName, type: typeof characterName });
            
            const basePath = `assets/spine/characters/${characterName}/`;
            atlasPath = `${basePath}${characterName}.atlas`;
            jsonPath = `${basePath}${characterName}.json`;
            imagePath = `${basePath}${characterName}.png`;
            
            console.log('🔄 標準パス生成完了:', { atlasPath, jsonPath, imagePath });
            console.log('🔍 生成されたパスの型確認:', {
                atlasPathType: typeof atlasPath,
                jsonPathType: typeof jsonPath,
                imagePathType: typeof imagePath
            });
            
            // v3成功パターン移植: AssetManager使用方法
            const assetManager = new spine.AssetManager(this.parentLayer.gl);
            
            // 🚀 デバッグ: パス検証
            console.log('📁 アセット読み込み開始:', { atlasPath, jsonPath, imagePath });
            console.log('🔍 パス検証:', {
                atlasPathType: typeof atlasPath,
                atlasPathValue: atlasPath,
                jsonPathType: typeof jsonPath,
                jsonPathValue: jsonPath,
                imagePathType: typeof imagePath,
                imagePathValue: imagePath
            });
            
            // 🚀 Phase 2: 最終パス安全性チェック（強化版）
            console.log('🔍 最終パス安全性チェック開始');
            console.log('🔍 atlasPath完全検証:', { 
                value: atlasPath, 
                type: typeof atlasPath, 
                length: atlasPath ? atlasPath.length : 'N/A',
                isString: typeof atlasPath === 'string',
                hasValue: atlasPath && atlasPath.length > 0
            });
            
            // 型と値の強制確認
            if (typeof atlasPath !== 'string' || !atlasPath || atlasPath.length === 0) {
                console.error('❌ atlasPath検証失敗:', { 
                    atlasPath, 
                    type: typeof atlasPath, 
                    characterName,
                    basePath: `assets/spine/characters/${characterName}/`
                });
                throw new Error(`atlasPath生成失敗 - characterName: ${characterName}`);
            }
            if (typeof jsonPath !== 'string' || !jsonPath || jsonPath.length === 0) {
                console.error('❌ jsonPath検証失敗:', { jsonPath, type: typeof jsonPath });
                throw new Error(`jsonPath生成失敗 - characterName: ${characterName}`);
            }
            if (typeof imagePath !== 'string' || !imagePath || imagePath.length === 0) {
                console.error('❌ imagePath検証失敗:', { imagePath, type: typeof imagePath });
                throw new Error(`imagePath生成失敗 - characterName: ${characterName}`);
            }
            
            console.log('✅ 全パス検証完了:', { atlasPath, jsonPath, imagePath });
            
            // 🚀 Phase 1保持: テクスチャアセット記録（Context Lost復旧用フォールバック）
            this._textureAssets.set(characterName, {
                atlas: atlasPath,
                json: jsonPath,
                pngs: [imagePath]
            });
            
            // 🚀 Phase 2: AssetRegistryにアセット登録（未登録の場合）
            if (this._assetRegistry && !this._assetRegistry.has(characterName)) {
                this._assetRegistry.registerAsset(characterName, {
                    id: characterName,
                    name: characterName,
                    atlas: atlasPath,
                    json: jsonPath,
                    pngs: [imagePath],
                    atlasPath: atlasPath,
                    jsonPath: jsonPath,
                    texturePath: imagePath
                });
                console.log(`🚀 Phase 2: ${characterName} をAssetRegistryに登録完了（assets module）`);
            }
            
            // v3成功パターン移植: 標準読み込み
            assetManager.loadTextureAtlas(atlasPath);
            assetManager.loadText(jsonPath);
            assetManager.loadTexture(imagePath);
            
            console.log('📁 アセットファイル読み込み開始...');
            // 🚀 v3シンプル化: 複雑な待機を削除、基本待機のみ
            await this.waitForAssetsSimple(assetManager);
            
            // v3成功パターン移植: Skeleton作成
            console.log('🔍 require前のパス確認:', { atlasPath, jsonPath });
            
            const atlas = assetManager.require(atlasPath);
            console.log('✅ atlas取得成功:', atlas);
            
            const skeletonJson = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(atlas));
            
            const jsonData = assetManager.require(jsonPath);
            console.log('✅ JSON取得成功:', jsonData);
            
            const skeletonData = skeletonJson.readSkeletonData(jsonData);
            console.log('✅ skeletonData作成成功:', skeletonData);
            
            console.log('🦴 スケルトンデータ構築完了');
            
            // スケルトン作成（シンプルシーン成功座標）
            const skeleton = new spine.Skeleton(skeletonData);
            skeleton.x = 0; // 🚀 シンプル化革命: v3成功パターン
            skeleton.y = 0; // 🚀 シンプル化革命: v3成功パターン  
            skeleton.scaleX = skeleton.scaleY = 1.0; // 🚀 シンプル化革命: v3成功パターン
            
            // アニメーション設定
            const animationStateData = new spine.AnimationStateData(skeletonData);
            const animationState = new spine.AnimationState(animationStateData);
            
            // 利用可能なアニメーション確認
            console.log('📋 利用可能なアニメーション:');
            for (let i = 0; i < skeletonData.animations.length; i++) {
                console.log(`  - ${skeletonData.animations[i].name}`);
            }
            
            // 最初のアニメーション設定（あれば）
            if (skeletonData.animations.length > 0) {
                const firstAnimation = skeletonData.animations[0].name;
                animationState.setAnimation(0, firstAnimation, true);
                console.log(`🎬 アニメーション設定: ${firstAnimation}`);
            }
            
            // スケルトン初期化（レンダリング準備完了まで確実に待機）
            skeleton.updateWorldTransform();
            
            // キャラクター登録
            this.parentLayer.characters.set(characterName, {
                skeleton,
                animationState,
                skeletonData
            });
            
            // 🚀 Phase 2: キャラクター状態記録
            this._characterStates.set(characterName, {
                useAssetRegistry,
                preparedAssetData,
                atlasPath,
                jsonPath,
                imagePath,
                addedAt: Date.now()
            });
            
            console.log('🎭 キャラクター構築完了（assets module）');
            
            // 🚀 Context管理モジュール: 初期化完了待機
            if (this.parentLayer.contextManager) {
                await this.parentLayer.contextManager.waitForCompleteInitialization(characterName);
            }
            
            // 🚀 Phase 2: 準備完了キャッシュに追加
            this._assetReadyCache.add(characterName);
            if (this.parentLayer.renderModule && this.parentLayer.renderModule.updateAssetRegistryCache) {
                this.parentLayer.renderModule.updateAssetRegistryCache(characterName, true);
            }
            
            console.log(`✅ Phase 2: ${characterName} 即座読み込み完了（AssetRegistry: ${useAssetRegistry}）（assets module）`);
            return { success: true, characterId: characterName, usedAssetRegistry: useAssetRegistry };
            
        } catch (error) {
            console.error(`❌ ${characterName} 読み込み失敗（assets module）: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 🚀 Phase 2: キャラクター削除機能
     * @param {string} characterId - 削除するキャラクターID
     */
    removeCharacter(characterId) {
        if (!characterId) {
            console.error('❌ キャラクターID指定なし（assets module）');
            return { success: false, error: 'キャラクターID指定なし' };
        }
        
        try {
            // キャラクターデータ削除
            if (this.parentLayer.characters.has(characterId)) {
                this.parentLayer.characters.delete(characterId);
                console.log(`🗑️ キャラクター削除: ${characterId}`);
            }
            
            // アセット管理状態クリア
            this._textureAssets.delete(characterId);
            this._characterStates.delete(characterId);
            this._assetReadyCache.delete(characterId);
            this._contextRecoveryQueue.delete(characterId);
            
            // AssetRegistry連携クリア
            if (this._assetRegistry && this._assetRegistry.has && this._assetRegistry.has(characterId)) {
                // AssetRegistryからも削除するかは設計次第
                console.log(`📦 AssetRegistry内の${characterId}は保持`);
            }
            
            // レンダリングキャッシュクリア
            if (this.parentLayer.renderModule && this.parentLayer.renderModule.updateAssetRegistryCache) {
                this.parentLayer.renderModule.updateAssetRegistryCache(characterId, false);
            }
            
            console.log(`✅ Phase 2: ${characterId} 削除完了（assets module）`);
            return { success: true, characterId };
            
        } catch (error) {
            console.error(`❌ ${characterId} 削除失敗（assets module）:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 絶対パスを相対パスへ変換
     * @param {string} absolutePath - 絶対パス
     * @returns {string} 相対パス
     */
    convertToRelativePath(absolutePath) {
        if (!absolutePath) return '';
        
        // WindowsパスをUnixパスへ正規化
        const normalizedPath = absolutePath.replace(/\\/g, '/');
        
        // プロジェクトルートからの相対パスを生成
        // 例: "C:/project/assets/spine/characters/nezumi/nezumi.atlas" → "assets/spine/characters/nezumi/nezumi.atlas"
        const assetsIndex = normalizedPath.indexOf('assets/');
        if (assetsIndex !== -1) {
            return normalizedPath.substring(assetsIndex);
        }
        
        // フォールバック: ファイル名のみを使用
        const fileName = normalizedPath.split('/').pop();
        return fileName || normalizedPath;
    }
    
    /**
     * 🚀 フリッカリング根本修正: テクスチャロード完了の確実な待機
     * assetManager.isLoadingComplete()だけでなく個別テクスチャの完了状態も確認
     */
    async waitForAssets(assetManager) {
        return new Promise((resolve, reject) => {
            let checkCount = 0;
            const maxChecks = 100;
            
            const checkAssets = () => {
                checkCount++;
                console.log(`🔄 アセット読み込み確認 ${checkCount}/${maxChecks}（assets module）`);
                
                // 基本的な読み込み完了確認
                if (!assetManager.isLoadingComplete()) {
                    if (checkCount >= maxChecks) {
                        reject(new Error("アセット読み込みタイムアウト"));
                    } else {
                        setTimeout(checkAssets, 100);
                    }
                    return;
                }
                
                // 🚀 追加確認: 個別テクスチャの完了状態を確認
                let allTexturesReady = true;
                const textureChecks = [];
                
                try {
                    // AssetManagerに登録されたテクスチャを確認
                    const assetPaths = Object.keys(assetManager.assets || {});
                    
                    assetPaths.forEach(path => {
                        const asset = assetManager.assets[path];
                        
                        // テクスチャアセットの確認
                        if (asset && asset.constructor && asset.constructor.name === 'GLTexture') {
                            const textureComplete = asset.texture && asset.texture.image && 
                                                  (asset.texture.image.complete === true || 
                                                   asset.texture.image.naturalWidth > 0);
                            
                            textureChecks.push({
                                path: path,
                                complete: textureComplete,
                                hasImage: !!(asset.texture && asset.texture.image),
                                imageComplete: asset.texture?.image?.complete,
                                naturalWidth: asset.texture?.image?.naturalWidth
                            });
                            
                            if (!textureComplete) {
                                allTexturesReady = false;
                            }
                        }
                        
                        // 画像アセットの確認
                        if (asset && asset.complete !== undefined) {
                            const imageComplete = asset.complete === true || asset.naturalWidth > 0;
                            
                            textureChecks.push({
                                path: path,
                                complete: imageComplete,
                                imageComplete: asset.complete,
                                naturalWidth: asset.naturalWidth
                            });
                            
                            if (!imageComplete) {
                                allTexturesReady = false;
                            }
                        }
                    });
                    
                    console.log('🔍 テクスチャ完了状態（assets module）:', textureChecks);
                    
                } catch (error) {
                    console.warn('⚠️ テクスチャ確認エラー（assets module）:', error);
                    // エラー時は基本確認のみ実行
                }
                
                if (allTexturesReady) {
                    console.log('✅ アセット＋テクスチャ読み込み完全完了（assets module）');
                    resolve();
                } else if (checkCount >= maxChecks) {
                    console.warn('⚠️ テクスチャ完了タイムアウト、基本読み込み完了で続行（assets module）');
                    resolve(); // 基本読み込み完了なら続行
                } else {
                    console.log('⏳ テクスチャ完了待機中...（assets module）');
                    setTimeout(checkAssets, 100);
                }
            };
            
            checkAssets();
        });
    }
    
    /**
     * 🚀 v3シンプル化: 基本的なアセット読み込み待機のみ
     */
    async waitForAssetsSimple(assetManager) {
        return new Promise((resolve, reject) => {
            const maxWaitTime = 10000; // 10秒
            const startTime = Date.now();
            
            const checkAssets = () => {
                if (assetManager.isLoadingComplete()) {
                    console.log('✅ 基本アセット読み込み完了（assets module）');
                    resolve();
                } else if (Date.now() - startTime > maxWaitTime) {
                    reject(new Error('アセット読み込みタイムアウト（assets module）'));
                } else {
                    setTimeout(checkAssets, 100);
                }
            };
            
            checkAssets();
        });
    }
    
    /**
     * 🚀 Phase 2: アセット状態管理・統計情報
     */
    getAssetStatistics() {
        return {
            totalCharacters: this.parentLayer.characters.size,
            textureAssets: this._textureAssets.size,
            characterStates: this._characterStates.size,
            assetReadyCache: this._assetReadyCache.size,
            recoveryQueue: this._contextRecoveryQueue.size,
            assetRegistryConnected: !!this._assetRegistry
        };
    }
    
    /**
     * 🚀 Phase 2: アセット準備状態確認
     * @param {string} characterId - キャラクターID
     */
    isAssetReady(characterId) {
        return this._assetReadyCache.has(characterId);
    }
    
    /**
     * 🚀 Phase 2: 準備完了キャッシュ更新
     * @param {string} characterId - キャラクターID
     * @param {boolean} isReady - 準備完了状態
     */
    updateAssetReadyCache(characterId, isReady = true) {
        if (isReady) {
            this._assetReadyCache.add(characterId);
        } else {
            this._assetReadyCache.delete(characterId);
        }
    }
    
    /**
     * 🧹 Phase 2: リソース解放（AssetRegistry連携最適化版）
     */
    dispose() {
        console.log('🧹 Phase 2: SpinePreviewAssets リソース解放開始');
        
        // 🚀 Phase 2: AssetRegistry連携クリーンアップ
        if (this._assetReadyCache) {
            this._assetReadyCache.clear();
        }
        if (this._contextRecoveryQueue) {
            this._contextRecoveryQueue.clear();
        }
        if (this._characterStates) {
            this._characterStates.clear();
        }
        
        // 🚀 Phase 1保持: テクスチャアセット記録クリア（フォールバック用）
        this._textureAssets.clear();
        
        // 🚀 Phase 2: AssetRegistry参照クリア
        this._assetRegistry = null;
        
        // 親レイヤー参照クリア
        this.parentLayer = null;
        
        console.log('✅ Phase 2: SpinePreviewAssets 解放完了');
    }
}