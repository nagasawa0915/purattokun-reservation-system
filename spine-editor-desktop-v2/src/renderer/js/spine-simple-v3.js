// 🎮 Spine Editor Desktop v2.0 - 薄いSpineファサード（軽量版）
// Web版成功パターンベース: createSkeleton特化・責務分離

console.log('🎮 薄いSpineファサード初期化開始');
console.log('🔍 現在のspine状態:', typeof spine !== 'undefined' ? 'loaded' : 'not loaded');

// ========== 薄いSpineファサード ========== //

class SpineSimpleV3Facade {
    constructor() {
        this.isSpineReady = false;
        this.loadedSkeletons = new Map(); // characterId -> skeleton
        
        this.checkSpineAvailability();
    }

    // Spine WebGL利用可能性確認
    checkSpineAvailability() {
        if (typeof spine !== 'undefined') {
            this.isSpineReady = true;
            console.log('✅ Spine WebGL利用可能');
        } else {
            console.warn('⚠️ Spine WebGL未読み込み');
            this.waitForSpine();
        }
    }

    // Spine読み込み待機
    async waitForSpine(maxRetries = 50) {
        for (let i = 0; i < maxRetries; i++) {
            if (typeof spine !== 'undefined' && spine.TextureAtlas && spine.AssetManager) {
                this.isSpineReady = true;
                console.log('✅ Spine WebGL読み込み完了');
                return true;
            }
            if (i % 10 === 0) {
                console.log(`🔄 Spine読み込み待機中... (${i}/${maxRetries})`);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.error('❌ Spine WebGL読み込みタイムアウト');
        return false;
    }

    // 🎯 核心機能: Skeleton作成（Web版パターン）
    async createSkeleton(atlasPath, jsonPath, scale = 1.0) {
        try {
            if (!this.isSpineReady) {
                console.warn('⚠️ Spine WebGL未準備');
                return null;
            }

            console.log(`🎯 Skeleton作成開始: ${atlasPath}`);
            
            // Web版成功パターン: AssetManager使用
            const assetManager = new spine.AssetManager();
            
            // アセット読み込み
            assetManager.loadTextureAtlas(atlasPath);
            assetManager.loadText(jsonPath);
            
            // 読み込み完了待機
            await this.waitForAssetLoading(assetManager);
            
            // Skeleton作成
            const atlas = assetManager.require(atlasPath);
            const skeletonJson = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(atlas));
            const skeletonData = skeletonJson.readSkeletonData(assetManager.require(jsonPath));
            const skeleton = new spine.Skeleton(skeletonData);
            
            // スケール適用
            skeleton.scaleX = skeleton.scaleY = scale;
            
            // アニメーション準備
            const animationStateData = new spine.AnimationStateData(skeleton.data);
            const animationState = new spine.AnimationState(animationStateData);
            
            // デフォルトアニメーション設定
            this.setupDefaultAnimation(skeleton, animationState);
            
            console.log(`✅ Skeleton作成完了: ${atlasPath}`);
            return { skeleton, animationState, assetManager };
            
        } catch (error) {
            console.error(`❌ Skeleton作成エラー: ${atlasPath}`, error);
            return null;
        }
    }

    // 組み込みキャラクター作成（簡略版）
    async createBuiltInCharacter(characterName) {
        try {
            console.log(`🎭 組み込みキャラクター作成: ${characterName}`);
            
            // アセットパス構築
            const basePath = `assets/spine/characters/${characterName}/`;
            const atlasPath = `${basePath}${characterName}.atlas`;
            const jsonPath = `${basePath}${characterName}.json`;
            const scale = characterName === 'nezumi' ? 0.8 : 1.0;
            
            // Skeleton作成（核心機能）
            const result = await this.createSkeleton(atlasPath, jsonPath, scale);
            if (!result) {
                console.warn(`⚠️ ${characterName} Skeleton作成失敗`);
                return false;
            }
            
            // 簡単な登録
            this.loadedSkeletons.set(characterName, result);
            
            console.log(`✅ ${characterName}作成完了`);
            return true;
            
        } catch (error) {
            console.error(`❌ ${characterName}作成エラー:`, error);
            return false;
        }
    }

    // 🎯 アセット読み込み完了待機（Web版パターン）
    async waitForAssetLoading(assetManager, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkAssets = () => {
                if (assetManager.isLoadingComplete()) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Asset loading timeout'));
                } else {
                    setTimeout(checkAssets, 100);
                }
            };
            
            checkAssets();
        });
    }

    // 🎯 デフォルトアニメーション設定（Web版パターン）
    setupDefaultAnimation(skeleton, animationState) {
        const animationPriority = ['taiki', 'idle', 'syutugen', 'appear'];
        
        for (const animName of animationPriority) {
            if (skeleton.data.findAnimation(animName)) {
                if (animName === 'syutugen' || animName === 'appear') {
                    animationState.setAnimation(0, animName, false);
                    animationState.addAnimation(0, 'taiki', true, 0);
                } else {
                    animationState.setAnimation(0, animName, true);
                }
                console.log(`🎬 アニメーション設定: ${animName}`);
                return;
            }
        }
        
        // フォールバック：最初のアニメーション
        if (skeleton.data.animations.length > 0) {
            const firstAnim = skeleton.data.animations[0].name;
            animationState.setAnimation(0, firstAnim, true);
            console.log(`🎬 フォールバックアニメーション: ${firstAnim}`);
        }
    }

    // 🎯 Skeleton取得
    getSkeleton(characterName) {
        return this.loadedSkeletons.get(characterName);
    }

    // 🎯 全Skeleton取得
    getAllSkeletons() {
        return Array.from(this.loadedSkeletons.values());
    }

    // 🎯 Skeleton削除
    removeSkeleton(characterName) {
        this.loadedSkeletons.delete(characterName);
        console.log(`🗑️ Skeleton削除: ${characterName}`);
    }

    // 🎯 全Skeleton削除
    clearAllSkeletons() {
        this.loadedSkeletons.clear();
        console.log('🗑️ 全Skeleton削除完了');
    }

}

// ========== 軽量グローバル初期化 ========== //

// 薄いSpineファサードインスタンス作成
const spineSimpleFacade = new SpineSimpleV3Facade();

// グローバル参照
window.spineSimpleFacade = spineSimpleFacade;

// 🔄 互換性エイリアス（Phase 2薄いファサード化対応）
window.simpleSpineManagerV3 = spineSimpleFacade;

// 🎯 v2アプリ統合用関数（最小限）
window.createPurattokun = async () => {
    return await spineSimpleFacade.createBuiltInCharacter('purattokun');
};

window.createNezumi = async () => {
    return await spineSimpleFacade.createBuiltInCharacter('nezumi');
};

window.clearAllSpineCharacters = () => {
    spineSimpleFacade.clearAllSkeletons();
};

// 🎯 デバッグ用テスト関数（簡略版）
window.testSpineSimpleFacade = function() {
    console.log('🔍 薄いSpineファサード テスト開始');
    console.log('🔍 Spine WebGL状態:', typeof spine !== 'undefined' ? '利用可能' : '未読み込み');
    console.log('🔍 ファサード:', !!window.spineSimpleFacade);
    
    // テストSkeleton作成
    console.log('🎭 テストSkeleton作成開始...');
    window.createPurattokun().then(result => {
        if (result) {
            console.log('✅ テストSkeleton作成成功');
        } else {
            console.error('❌ テストSkeleton作成失敗');
        }
    });
};

console.log('✅ 薄いSpineファサード初期化完了');
console.log('🔍 window.spineSimpleFacade:', !!window.spineSimpleFacade);
console.log('🔍 利用可能な関数:', {
    spineSimpleFacade: !!window.spineSimpleFacade,
    createPurattokun: !!window.createPurattokun,
    createNezumi: !!window.createNezumi,
    clearAllSpineCharacters: !!window.clearAllSpineCharacters,
    testSpineSimpleFacade: !!window.testSpineSimpleFacade
});