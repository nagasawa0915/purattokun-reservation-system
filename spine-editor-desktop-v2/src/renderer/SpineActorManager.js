/**
 * SpineActorManager.js - Phase 2統合モジュール
 * SpineDisplayController + SpineCharacterManager の機能統合
 * 
 * 新機能:
 * - actors[]配列で複数キャラクター管理
 * - attach/detach API（IDベース管理）
 * - Z順は配列順（必要時zでソート）
 * - アセットキャッシュ強化（二重アップロード防止）
 */

import { Utils } from './utils.js';
import { IframeSpineBridge } from './js/iframe-spine-bridge.js';

/**
 * SpineActorManager - 統合キャラクター管理システム
 * Phase 2: actors[]配列管理・attach/detach API・Z順制御
 */
export class SpineActorManager {
    constructor(appCore) {
        this.appCore = appCore;
        
        // 🚀 Phase 2: actors[]配列管理システム
        this.actors = [];  // メインの配列管理
        this.actorsById = new Map();  // ID検索用高速アクセス
        this.nextId = 1;  // ID自動生成カウンター
        
        // 🚀 Phase 2: アセットキャッシュシステム（二重アップロード防止）
        this.assetCache = new Map();  // atlas/textureをキーで共有
        this.textureCache = new Map(); // テクスチャキャッシュ
        
        // 🔧 既存機能継承: SpineDisplayController機能
        this.assetManager = null;
        this.renderManager = null;
        
        // 🔧 既存機能継承: SpineCharacterManager機能
        this.spineCharacters = []; // 既存配列（互換性維持）
        this.savedSpinePath = localStorage.getItem('spine-editor-spine-path');
        this.iframeSpineBridge = new IframeSpineBridge();
        
        // 初期化
        this.setupBridgeEventHandlers();
        
        console.log('🎯 SpineActorManager初期化完了（Phase 2統合版）');
    }

    // =============================================
    // 🚀 Phase 2新機能: actors[]配列管理システム
    // =============================================

    /**
     * キャラクターをシステムにアタッチ（新API）
     * @param {string} assetId - アセットID（nezumi, purattokun等）
     * @param {object} assetData - アセットデータ（atlas, json, png等）
     * @param {object} options - オプション {x, y, z, scale}
     * @returns {number} 生成されたアクターID
     */
    async attach(assetId, assetData, options = {}) {
        try {
            console.log(`🔗 SpineActor attach開始: ${assetId}`, options);
            
            // 🚀 二重アップロード防止チェック
            if (this.assetCache.has(assetId)) {
                console.log(`♻️ アセットキャッシュ利用: ${assetId}`);
                assetData = this.assetCache.get(assetId);
            } else {
                // 新規アセット: キャッシュに保存
                this.assetCache.set(assetId, assetData);
                console.log(`💾 アセットキャッシュ保存: ${assetId}`);
            }
            
            // アクター生成（Spine標準座標系）
            const actorId = this.nextId++;
            const actor = {
                id: actorId,
                assetId: assetId,
                assetData: assetData,
                position: { x: 0, y: 0 }, // Spine標準: skeleton.x = 0, skeleton.y = 0
                scale: options.scale || 1.0,
                zIndex: options.z || this.actors.length,
                isVisible: true,
                createdAt: Date.now(),
                displayOptions: { x: options.x || 100, y: options.y || 100 } // UI表示位置は別管理
            };
            
            // 🚀 actors[]配列に追加（Z順は配列順）
            this.actors.push(actor);
            this.actorsById.set(actorId, actor);
            
            // 既存システム連携（Spine標準座標系）
            await this.loadCharacterLegacy(assetId, null); // Spine標準: x=0, y=0
            
            console.log(`✅ SpineActor attach完了: ID=${actorId}, assetId=${assetId}`);
            return actorId;
            
        } catch (error) {
            console.error(`❌ SpineActor attach失敗: ${assetId}`, error);
            throw error;
        }
    }

    /**
     * キャラクターをシステムからデタッチ（新API）
     * @param {number} actorId - アクターID
     * @returns {boolean} 成功/失敗
     */
    detach(actorId) {
        try {
            console.log(`🔌 SpineActor detach開始: ID=${actorId}`);
            
            // アクター検索
            const actor = this.actorsById.get(actorId);
            if (!actor) {
                console.warn(`⚠️ アクター未発見: ID=${actorId}`);
                return false;
            }
            
            // 配列から削除
            const index = this.actors.findIndex(a => a.id === actorId);
            if (index !== -1) {
                this.actors.splice(index, 1);
            }
            
            // Map から削除
            this.actorsById.delete(actorId);
            
            // 既存システム連携（下位互換性）
            // TODO: レンダリング系からの削除処理
            
            console.log(`✅ SpineActor detach完了: ID=${actorId}`);
            return true;
            
        } catch (error) {
            console.error(`❌ SpineActor detach失敗: ID=${actorId}`, error);
            return false;
        }
    }

    /**
     * アクター取得（新API）
     * @param {number} actorId - アクターID
     * @returns {object|null} アクターオブジェクト
     */
    getActor(actorId) {
        return this.actorsById.get(actorId) || null;
    }

    /**
     * 全アクター取得（新API）
     * @returns {array} actors配列のコピー
     */
    getAllActors() {
        return [...this.actors];
    }

    // =============================================
    // 🚀 Phase 2新機能: Z順管理システム
    // =============================================

    /**
     * アクターを最前面に移動
     * @param {number} actorId - アクターID
     */
    moveToFront(actorId) {
        const actor = this.actorsById.get(actorId);
        if (!actor) return false;
        
        // 配列から削除して末尾に追加（最前面）
        const index = this.actors.findIndex(a => a.id === actorId);
        if (index !== -1) {
            this.actors.splice(index, 1);
            this.actors.push(actor);
            this.updateZIndices();
            console.log(`📋 アクター最前面移動: ID=${actorId}`);
            return true;
        }
        return false;
    }

    /**
     * アクターを最背面に移動
     * @param {number} actorId - アクターID
     */
    moveToBack(actorId) {
        const actor = this.actorsById.get(actorId);
        if (!actor) return false;
        
        // 配列から削除して先頭に追加（最背面）
        const index = this.actors.findIndex(a => a.id === actorId);
        if (index !== -1) {
            this.actors.splice(index, 1);
            this.actors.unshift(actor);
            this.updateZIndices();
            console.log(`📋 アクター最背面移動: ID=${actorId}`);
            return true;
        }
        return false;
    }

    /**
     * Z値でソート（必要時のみ）
     */
    sortByZ() {
        this.actors.sort((a, b) => a.zIndex - b.zIndex);
        console.log('📋 actors[]配列 Z値ソート完了');
    }

    /**
     * Z-Indexを配列順に更新（内部使用）
     * @private
     */
    updateZIndices() {
        this.actors.forEach((actor, index) => {
            actor.zIndex = index;
        });
    }

    // =============================================
    // 🔧 既存機能継承: SpineDisplayController
    // =============================================

    /**
     * 初期化システム（既存機能）
     */
    async init() {
        try {
            console.log('🔧 SpineActorManager統合初期化開始');
            
            // spine-preview-assets参照確立
            if (this.appCore.spinePreviewLayer && this.appCore.spinePreviewLayer.assetsManager) {
                this.assetManager = this.appCore.spinePreviewLayer.assetsManager;
                console.log('✅ spine-preview-assets参照確立');
            }
            
            // spine-preview-render参照確立
            if (this.appCore.spinePreviewLayer && this.appCore.spinePreviewLayer.renderModule) {
                this.renderManager = this.appCore.spinePreviewLayer.renderModule;
                console.log('✅ spine-preview-render参照確立');
            }
            
            console.log('✅ SpineActorManager統合初期化完了');
            
        } catch (error) {
            console.error('❌ SpineActorManager統合初期化エラー:', error);
        }
    }

    /**
     * キャラクター読み込み（既存API - 下位互換性）
     * @param {string} assetId - アセットID
     * @param {object} dropPos - ドロップ位置
     */
    async loadCharacterLegacy(assetId, dropPos = null) {
        if (!assetId) {
            console.warn('⚠️ SpineActorManager: assetId が指定されていません');
            return;
        }
        
        try {
            console.log(`🎭 キャラクター読み込み開始: ${assetId}`, dropPos);
            
            // 🚀 Spine正規座標系（マニュアル準拠: skeleton.x = 0, skeleton.y = 0）
            let finalPosition = { x: 0, y: 0 }; // Spine標準座標
            console.log(`📐 Spine座標設定: skeleton.x = 0, skeleton.y = 0 (マニュアル準拠)`);
            
            // AssetManagerが利用可能な場合の処理（優先）
            if (this.assetManager && typeof this.assetManager.addCharacter === 'function') {
                console.log(`🎯 AssetManager.addCharacter使用: ${assetId}`);
                
                // 🚀 適切なcharacterData構造を作成（spine-preview-assetsが期待する形式）
                const characterData = {
                    name: assetId,
                    id: assetId,
                    assetId: assetId,
                    position: finalPosition
                };
                
                console.log(`📋 送信データ構造:`, characterData);
                await this.assetManager.addCharacter(characterData, finalPosition);
                console.log(`✅ AssetManager経由でキャラクター追加完了: ${assetId}`);
                return;
            }
            
            // 🔄 フォールバック1: getAssetById → RenderManager
            if (this.assetManager && typeof this.assetManager.getAssetById === 'function') {
                const assetData = this.assetManager.getAssetById(assetId);
                
                if (assetData) {
                    console.log(`✅ アセット発見: ${assetId}`, assetData);
                    
                    // レンダーマネージャーチェック（複数メソッド試行）
                    if (this.renderManager) {
                        if (typeof this.renderManager.addCharacter === 'function') {
                            await this.renderManager.addCharacter(assetId, assetData, finalPosition);
                            console.log(`✅ RenderManager.addCharacter完了: ${assetId}`);
                        } else if (typeof this.renderManager.loadCharacter === 'function') {
                            await this.renderManager.loadCharacter(assetId, finalPosition);
                            console.log(`✅ RenderManager.loadCharacter完了: ${assetId}`);
                        } else {
                            console.warn('⚠️ RenderManager利用可能メソッドなし');
                            console.log('🔍 利用可能メソッド:', Object.getOwnPropertyNames(this.renderManager));
                        }
                    } else {
                        console.warn('⚠️ RenderManager未初期化');
                    }
                } else {
                    console.warn(`⚠️ アセット未発見: ${assetId}`);
                    
                    // 🔄 フォールバック2: 直接キャラクター作成試行
                    if (this.renderManager && typeof this.renderManager.createCharacter === 'function') {
                        await this.renderManager.createCharacter(assetId, finalPosition);
                        console.log(`✅ RenderManager.createCharacter完了: ${assetId}`);
                    }
                }
            } else {
                console.warn('⚠️ AssetManager.getAssetById利用不可');
                
                // 🔄 フォールバック3: SpinePreviewLayer直接アクセス
                if (this.appCore?.spinePreviewLayer) {
                    const spineLayer = this.appCore.spinePreviewLayer;
                    if (typeof spineLayer.addCharacter === 'function') {
                        await spineLayer.addCharacter(assetId, finalPosition);
                        console.log(`✅ SpinePreviewLayer.addCharacter完了: ${assetId}`);
                    }
                }
            }
            
            console.log(`📋 キャラクター読み込み処理完了: ${assetId} at ${JSON.stringify(finalPosition)}`);
            
        } catch (error) {
            console.error(`❌ キャラクター読み込みエラー: ${assetId}`, error);
            console.error('🔍 エラー詳細:', error.stack);
        }
    }

    // =============================================
    // 🔧 既存機能継承: SpineCharacterManager
    // =============================================

    /**
     * iframe通信ブリッジのイベントハンドラをセットアップ（既存機能）
     * @private
     */
    setupBridgeEventHandlers() {
        // Spine環境準備完了
        this.iframeSpineBridge.on('spineReady', (data) => {
            console.log('🎭 Spine environment ready for character operations');
        });

        // キャラクター追加成功
        this.iframeSpineBridge.on('characterAdded', (data) => {
            console.log(`✅ Character added: ${data.characterId}`);
            this.updateDummyToSpineDisplay(data.characterId);
        });

        // エラーハンドリング
        this.iframeSpineBridge.on('spineError', (data) => {
            console.error('❌ Spine error:', data);
            Utils.showToastNotification(`Spineエラー: ${data.error}`, 'error');
        });

        this.iframeSpineBridge.on('characterError', (data) => {
            console.error('❌ Character operation error:', data);
            Utils.showToastNotification(`キャラクター操作エラー: ${data.error}`, 'error');
        });
    }

    /**
     * プレビューiframeを設定（既存機能）
     * @param {HTMLIFrameElement} iframe - プレビューiframe要素
     */
    setPreviewIframe(iframe) {
        this.iframeSpineBridge.setIframe(iframe);
        console.log('🎭 Preview iframe set for SpineActorManager');
    }

    /**
     * ダミー要素を実際のSpine表示に置き換える（既存機能）
     * @param {string} characterId - キャラクターID
     */
    updateDummyToSpineDisplay(characterId) {
        // TODO: ダミー要素からSpine表示への変換処理
        console.log(`🔄 Updating dummy to Spine display: ${characterId}`);
    }

    // =============================================
    // 🔧 既存機能継承: SpineDisplayController互換メソッド
    // =============================================

    /**
     * ドロップゾーンセットアップ（既存API互換）
     */
    setupDropZone() {
        console.log('🎯 SpineActorManager: setupDropZone実行開始');
        
        const previewContent = document.getElementById('preview-content');
        const spineContainer = document.getElementById('spine-character-container');
        
        if (!previewContent || !spineContainer) {
            console.warn('⚠️ ドロップゾーン要素が見つかりません', {
                previewContent: !!previewContent,
                spineContainer: !!spineContainer
            });
            return;
        }
        
        // PreviewManagerのsetupDropZoneを呼び出し（削除前と同じ処理）
        if (this.appCore.previewManager && typeof this.appCore.previewManager.setupDropZone === 'function') {
            console.log('✅ PreviewManager.setupDropZone呼び出し');
            this.appCore.previewManager.setupDropZone(previewContent, (characterData, x, y) => {
                console.log('🎭 ドロップイベント受信:', { characterData, x, y });
                this.addSpineCharacterToPreview(characterData, x, y);
            });
            console.log('✅ SpineActorManager: setupDropZone完了');
        } else {
            console.warn('⚠️ PreviewManager.setupDropZone利用不可');
            
            // フォールバック: 直接ドロップイベントを設定
            this.setupDirectDropEvents(previewContent);
        }
    }

    /**
     * 直接ドロップイベント設定（フォールバック）
     * @private
     */
    setupDirectDropEvents(previewContent) {
        console.log('🔄 直接ドロップイベント設定開始');
        
        previewContent.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📥 dragenter');
        });
        
        previewContent.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
            console.log('📥 dragover');
        });
        
        previewContent.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                const transferData = e.dataTransfer.getData('text/plain');
                if (transferData) {
                    const characterData = JSON.parse(transferData);
                    const rect = previewContent.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    console.log('📥 drop受信:', { characterData, x, y });
                    this.addSpineCharacterToPreview(characterData, x, y);
                }
            } catch (error) {
                console.error('❌ ドロップ処理エラー:', error);
            }
        });
        
        console.log('✅ 直接ドロップイベント設定完了');
    }

    /**
     * キャラクターをプレビューに追加（既存API互換）
     * @param {object} characterData - キャラクターデータ
     * @param {number} x - X座標
     * @param {number} y - Y座標
     */
    async addSpineCharacterToPreview(characterData, x, y) {
        console.log('🎭 SpineActorManager: addSpineCharacterToPreview実行', { characterData, x, y });
        
        // 🚀 characterData構造正規化
        const normalizedData = {
            name: characterData.name || characterData.id || characterData.assetId,
            id: characterData.id || characterData.name || characterData.assetId,
            assetId: characterData.assetId || characterData.name || characterData.id,
            ...characterData
        };
        
        console.log('📋 正規化されたcharacterData:', normalizedData);
        
        const assetId = normalizedData.name || normalizedData.id;
        if (!assetId) {
            console.error('❌ SpineActorManager: 有効なassetIdが見つかりません', characterData);
            return null;
        }
        
        return await this.attach(assetId, normalizedData, { x, y });
    }

    /**
     * Spineキャラクター追加（既存API互換）
     */
    addSpineCharacter() {
        console.log('🎭 SpineActorManager: addSpineCharacter実行');
        return true;
    }

    /**
     * Spine位置更新（既存API互換）
     * @param {object} position - 位置情報
     */
    updateSpinePosition(position) {
        console.log('📍 SpineActorManager: updateSpinePosition実行', position);
        // actors配列の最新アクターの位置を更新
        if (this.actors.length > 0) {
            const lastActor = this.actors[this.actors.length - 1];
            lastActor.position = { ...lastActor.position, ...position };
        }
    }

    /**
     * プロジェクトからSpineキャラクター作成（既存API互換）
     * @param {object} characterData - キャラクターデータ
     * @param {number} x - X座標  
     * @param {number} y - Y座標
     */
    async createSpineCharacterFromProject(characterData, x, y) {
        console.log('🏗️ SpineActorManager: createSpineCharacterFromProject実行', { characterData, x, y });
        return await this.attach(characterData.assetId || characterData.name, characterData, { x, y });
    }

    /**
     * キャラクターをドロップ位置に配置（既存API互換）
     * @param {string} characterName - キャラクター名
     * @param {number} x - X座標
     * @param {number} y - Y座標
     */
    async positionCharacterAtDropLocation(characterName, x, y) {
        console.log('📍 SpineActorManager: positionCharacterAtDropLocation実行', { characterName, x, y });
        return await this.attach(characterName, { name: characterName }, { x, y });
    }

    /**
     * 内蔵キャラクター追加（既存API互換）
     * @param {string} characterName - キャラクター名
     */
    async addBuiltInCharacter(characterName) {
        console.log('🎭 SpineActorManager: addBuiltInCharacter実行', characterName);
        return await this.attach(characterName, { name: characterName, builtin: true });
    }

    /**
     * 全キャラクタークリア（既存API互換）
     */
    clearAllCharacters() {
        console.log('🧹 SpineActorManager: clearAllCharacters実行');
        // 全アクターを削除
        const actorIds = this.actors.map(actor => actor.id);
        actorIds.forEach(id => this.detach(id));
        return true;
    }

    /**
     * リセット（既存API互換）
     */
    reset() {
        console.log('🔄 SpineActorManager: reset実行');
        this.clearAllCharacters();
        this.clearAssetCache();
    }

    // =============================================
    // 🚀 Phase 2新機能: アセットキャッシュ管理
    // =============================================

    /**
     * アセットキャッシュクリア
     */
    clearAssetCache() {
        this.assetCache.clear();
        this.textureCache.clear();
        console.log('🧹 アセットキャッシュクリア完了');
    }

    /**
     * アセットキャッシュ統計
     * @returns {object} キャッシュ統計情報
     */
    getCacheStats() {
        return {
            assetCacheSize: this.assetCache.size,
            textureCacheSize: this.textureCache.size,
            actorsCount: this.actors.length
        };
    }
}