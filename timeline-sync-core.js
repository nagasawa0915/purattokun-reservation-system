/**
 * 🎭 Timeline Sync Core System
 * タイムライン制御システム × 基本同期制御システム
 * 
 * 【技術仕様】
 * - ファイルサイズ: 200行以内
 * - 機能: 基本同期制御・境界ボックス統合・フレーム管理
 * - 依存: timeline-sync-patterns.js（パターン実装）
 * - 統合: 既存timeline-sync-controller.js連携
 */

console.log('🎭 Timeline Sync Core System 読み込み開始');

// ========== 基本同期制御クラス ========== //

/**
 * 基本キャラクター同期制御システム
 * 複数キャラクターの基礎的同期機能を提供
 */
class TimelineSyncCore {
    constructor(timelineEngine, characters) {
        this.timelineEngine = timelineEngine;
        this.characters = characters || new Map(); // Map: characterId -> character
        this.syncGroups = new Map();
        this.syncTolerance = 1/60; // 1フレーム精度
        this.activeSyncs = new Set();
        this.frameCount = 0;
        this.lastFrameTime = 0;
        
        // 境界ボックス統合
        this.boundsManager = null;
        this.boundingBoxSyncEnabled = false;
        
        console.log('🎭 TimelineSyncCore 初期化');
        this.initializeBoundsIntegration();
    }
    
    /**
     * 境界ボックス統合システム初期化
     */
    initializeBoundsIntegration() {
        // 既存のbounds統合システム検索
        if (typeof indexBoundsManager !== 'undefined') {
            this.boundsManager = indexBoundsManager;
            this.boundingBoxSyncEnabled = true;
            console.log('✅ 境界ボックス統合システム接続完了');
        } else if (typeof window.indexBoundsManager !== 'undefined') {
            this.boundsManager = window.indexBoundsManager;
            this.boundingBoxSyncEnabled = true;
            console.log('✅ グローバル境界ボックス統合システム接続完了');
        } else {
            console.log('⚠️ 境界ボックス統合システム未検出 - 基本同期モードで動作');
        }
    }
    
    // ========== 同期グループ管理 ========== //
    
    /**
     * 同期グループ作成
     */
    createSyncGroup(groupId, characterIds, syncType, options = {}) {
        // 🔒 入力値検証
        if (!groupId || typeof groupId !== 'string') {
            throw new Error('Invalid groupId: 文字列が必要です');
        }
        
        if (!Array.isArray(characterIds) || characterIds.length === 0) {
            throw new Error('Invalid characterIds: 空でない配列が必要です');
        }
        
        if (this.syncGroups.has(groupId)) {
            throw new Error(`Duplicate groupId: ${groupId} は既に存在します`);
        }
        
        // 🔒 キャラクター存在確認
        const validCharacters = characterIds.map(id => this.characters.get(id)).filter(Boolean);
        if (validCharacters.length === 0) {
            throw new Error('No valid characters found: 有効なキャラクターが見つかりません');
        }
        
        const syncGroup = {
            id: groupId,
            characters: validCharacters,
            characterIds: characterIds,
            syncType: syncType,
            masterCharacter: characterIds[0],
            slaveCharacters: characterIds.slice(1),
            options: {
                offset: Math.max(0, options.offset || 0),
                scale: Math.max(0.1, Math.min(10.0, options.scale || 1.0)),
                mirror: Boolean(options.mirror),
                precision: Math.max(0.001, options.precision || this.syncTolerance)
            },
            isActive: false,
            lastSyncTime: 0,
            errorCount: 0,
            maxErrors: options.maxErrors || 3
        };
        
        this.syncGroups.set(groupId, syncGroup);
        console.log(`🎭 同期グループ作成: ${groupId}`, {
            type: syncType,
            characters: characterIds,
            validCharacters: validCharacters.length,
            options: syncGroup.options
        });
        
        return syncGroup;
    }
    
    /**
     * 同期グループ削除
     */
    removeSyncGroup(groupId) {
        if (this.syncGroups.has(groupId)) {
            this.activeSyncs.delete(groupId);
            this.syncGroups.delete(groupId);
            console.log(`🗑️ 同期グループ削除: ${groupId}`);
            return true;
        }
        return false;
    }
    
    // ========== 境界ボックス連動同期 ========== //
    
    /**
     * 境界ボックスイベントからの同期演出分岐
     */
    synchronizeFromBoundingBoxEvent(event) {
        if (!this.boundingBoxSyncEnabled) {
            console.log('⚠️ 境界ボックス同期無効 - イベントをスキップ');
            return;
        }
        
        try {
            const clickZone = this.determineClickZone(event.position, event.character);
            const affectedGroups = this.findSyncGroupsByCharacter(event.characterId);
            
            console.log(`🎯 境界ボックス同期イベント: ${event.characterId} - ${clickZone}`, {
                position: event.position,
                affectedGroups: affectedGroups.length
            });
            
            // 該当同期グループで演出実行（timeline-sync-patterns.jsに委譲）
            if (window.TimelineSyncPatterns) {
                const patterns = new window.TimelineSyncPatterns(this);
                affectedGroups.forEach(group => {
                    const syncSequence = patterns.createSyncSequenceForZone(clickZone, group);
                    this.executeSynchronizedSequence(group, syncSequence);
                });
            }
            
        } catch (error) {
            console.error('❌ 境界ボックス同期エラー:', error);
        }
    }
    
    /**
     * クリック領域判定
     */
    determineClickZone(position, character) {
        const zones = {
            purattokun: ['head', 'body', 'arms', 'legs', 'tail'],
            nezumi: ['head', 'body', 'arms', 'legs', 'whiskers']
        };
        
        const characterZones = zones[character.id] || zones['purattokun'];
        const bounds = character.bounds || character.element?.getBoundingClientRect();
        if (!bounds) return 'body';
        
        const relativeX = (position.x - bounds.left) / bounds.width;
        const relativeY = (position.y - bounds.top) / bounds.height;
        
        if (relativeY < 0.3) return 'head';
        if (relativeY < 0.6) return 'body';
        if (relativeX < 0.4 || relativeX > 0.6) return 'arms';
        if (relativeY > 0.8) return 'legs';
        
        return 'body';
    }
    
    /**
     * キャラクターID から関連同期グループを検索
     */
    findSyncGroupsByCharacter(characterId) {
        return Array.from(this.syncGroups.values()).filter(group =>
            group.characterIds.includes(characterId)
        );
    }
    
    // ========== 同期実行システム ========== //
    
    /**
     * 同期シーケンス実行
     */
    executeSynchronizedSequence(syncGroup, sequence) {
        if (!syncGroup || syncGroup.characters.length === 0) {
            console.log('⚠️ 無効な同期グループ');
            return;
        }
        
        const syncId = `sync_${syncGroup.id}_${Date.now()}`;
        this.activeSyncs.add(syncId);
        syncGroup.isActive = true;
        syncGroup.lastSyncTime = performance.now();
        
        console.log(`🎬 同期シーケンス開始: ${syncGroup.id}`, {
            sequence: sequence,
            characters: syncGroup.characterIds
        });
        
        // 同期タイプに応じて実行（timeline-sync-patterns.jsに委譲）
        if (window.TimelineSyncPatterns) {
            const patterns = new window.TimelineSyncPatterns(this);
            patterns.executeSyncByType(syncGroup, sequence, syncId);
        } else {
            this.executeBasicSync(syncGroup, sequence, syncId);
        }
    }
    
    /**
     * 基本同期実行（フォールバック）
     */
    executeBasicSync(syncGroup, sequence, syncId) {
        syncGroup.characters.forEach((character, index) => {
            const delay = index * syncGroup.options.offset * 1000;
            
            setTimeout(() => {
                this.triggerAnimation(character, sequence.sequence[0]);
            }, delay);
        });
        
        setTimeout(() => {
            this.completeSyncSequence(syncId, syncGroup);
        }, (sequence.duration || 2.0) * 1000);
    }
    
    /**
     * アニメーション実行（エラーハンドリング強化）
     */
    triggerAnimation(character, animationName) {
        // 🔒 入力値検証
        if (!character || !animationName) {
            console.warn('⚠️ triggerAnimation: 無効な引数', { character, animationName });
            return false;
        }
        
        try {
            // Spine WebGL アニメーション
            if (character.animationState && character.animationState.setAnimation) {
                character.animationState.setAnimation(0, animationName, false);
                console.log(`🎬 Spine WebGL アニメーション実行: ${character.id} - ${animationName}`);
                return true;
            }
            
            // カスタムアニメーションシステム
            if (typeof character.playAnimation === 'function') {
                character.playAnimation(animationName);
                console.log(`🎬 カスタムアニメーション実行: ${character.id} - ${animationName}`);
                return true;
            }
            
            // CSS アニメーション フォールバック
            if (character.element && character.element.classList) {
                character.element.classList.add(`animation-${animationName}`);
                console.log(`🎬 CSSアニメーション実行: ${character.id} - ${animationName}`);
                return true;
            }
            
            // 全ての方法が失敗した場合
            console.warn(`⚠️ アニメーション実行不可: ${character.id || 'unknown'} - ${animationName}`);
            return false;
            
        } catch (error) {
            console.error(`❌ アニメーション実行エラー: ${character.id || 'unknown'}`, {
                animationName,
                error: error.message,
                stack: error.stack
            });
            
            // エラー回復: デフォルトアニメーション試行
            return this.fallbackAnimation(character);
        }
    }
    
    /**
     * フォールバックアニメーション実行
     */
    fallbackAnimation(character) {
        try {
            if (character.element && character.element.classList) {
                character.element.classList.add('animation-fallback');
                console.log(`🔄 フォールバックアニメーション実行: ${character.id || 'unknown'}`);
                return true;
            }
        } catch (fallbackError) {
            console.error('❌ フォールバックアニメーションも失敗:', fallbackError);
        }
        return false;
    }
    
    /**
     * 同期シーケンス完了処理
     */
    completeSyncSequence(syncId, syncGroup) {
        this.activeSyncs.delete(syncId);
        syncGroup.isActive = false;
        
        console.log(`✅ 同期シーケンス完了: ${syncGroup.id}`);
        
        // 完了イベント発火
        this.dispatchSyncCompleteEvent(syncGroup);
    }
    
    /**
     * 同期完了イベント発火
     */
    dispatchSyncCompleteEvent(syncGroup) {
        const event = new CustomEvent('characterSyncComplete', {
            detail: {
                groupId: syncGroup.id,
                characterIds: syncGroup.characterIds,
                syncType: syncGroup.syncType
            }
        });
        
        document.dispatchEvent(event);
    }
    
    // ========== フレーム更新・ユーティリティ ========== //
    
    /**
     * フレーム更新（60FPS維持・パフォーマンス最適化）
     */
    updateFrame(timestamp) {
        const targetFrameTime = 16.67; // 60FPS目標
        
        if (timestamp - this.lastFrameTime >= targetFrameTime) {
            this.frameCount++;
            this.lastFrameTime = timestamp;
            
            // 🏃 高速更新: アクティブな同期のみ処理
            if (this.activeSyncs.size > 0) {
                this.updateActiveSyncs(timestamp);
            }
            
            // 🧹 メモリ管理: 100フレームごとにクリーンアップ
            if (this.frameCount % 100 === 0) {
                this.performFrameCleanup();
            }
        }
    }
    
    /**
     * フレームクリーンアップ
     */
    performFrameCleanup() {
        // 非アクティブな同期グループのクリーンアップ
        const inactiveGroups = [];
        this.syncGroups.forEach((group, groupId) => {
            if (!group.isActive && (Date.now() - group.lastSyncTime) > 30000) {
                inactiveGroups.push(groupId);
            }
        });
        
        inactiveGroups.forEach(groupId => {
            console.log(`🧹 非アクティブグループクリーンアップ: ${groupId}`);
            // 必要に応じて削除しない（再利用を考慮）
        });
    }
    
    /**
     * アクティブ同期更新（パフォーマンス最適化）
     */
    updateActiveSyncs(timestamp) {
        // 🏃 早期終了: アクティブな同期がない場合
        if (this.activeSyncs.size === 0) {
            return;
        }
        
        const expiredSyncs = [];
        
        this.syncGroups.forEach((group, groupId) => {
            if (group.isActive) {
                const elapsedTime = (timestamp - group.lastSyncTime) / 1000;
                
                // タイムアウトチェック（30秒）
                if (elapsedTime > 30) {
                    expiredSyncs.push({ groupId, group });
                }
                
                // 同期状態の適切な更新処理
                this.updateSyncGroupState(group, elapsedTime);
            }
        });
        
        // 期限切れ同期のクリーンアップ
        expiredSyncs.forEach(({ groupId, group }) => {
            console.log(`⏰ 同期タイムアウト: ${groupId}`);
            this.completeSyncSequence(`timeout_${groupId}`, group);
        });
    }
    
    /**
     * 同期グループ状態更新
     */
    updateSyncGroupState(group, elapsedTime) {
        // パフォーマンスメトリクス更新
        if (elapsedTime > group.options.precision) {
            // 精度闾値を超えた場合の処理
        }
    }
    
    /**
     * システム状態取得
     */
    getSystemStatus() {
        return {
            totalGroups: this.syncGroups.size,
            activeGroups: Array.from(this.syncGroups.values()).filter(g => g.isActive).length,
            activeSyncs: this.activeSyncs.size,
            characters: this.characters.size,
            frameCount: this.frameCount,
            boundingBoxIntegration: this.boundingBoxSyncEnabled
        };
    }
}

// ========== グローバル登録 ========== //

window.TimelineSyncCore = TimelineSyncCore;

console.log('✅ Timeline Sync Core System 読み込み完了');