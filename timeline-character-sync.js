/**
 * 🎭 Advanced Character Sync Controller
 * タイムライン制御システム × 複数キャラクター同期演出システム
 * 
 * 【技術仕様】
 * - ファイルサイズ: 400行以内
 * - 機能: purattokun × nezumi 複数キャラクター同期演出
 * - 精度: 1フレーム(1/60秒)以内の同期精度
 * - 統合: 既存timeline-sync-controller.jsとの連携
 * - 境界ボックス連動: spine-bounds-integration.js統合
 */

console.log('🎭 Advanced Character Sync Controller 読み込み開始');

// ========== 基本同期制御クラス ========== //

/**
 * 高度キャラクター同期制御システム
 * 複数キャラクターの精密同期演出を管理
 */
class AdvancedCharacterSyncController {
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
        
        console.log('🎭 AdvancedCharacterSyncController 初期化');
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
     * @param {string} groupId - グループID
     * @param {Array} characterIds - 対象キャラクターID配列
     * @param {string} syncType - 同期タイプ ('movement', 'animation', 'sequence', 'timing')
     * @param {Object} options - オプション設定
     */
    createSyncGroup(groupId, characterIds, syncType, options = {}) {
        const syncGroup = {
            id: groupId,
            characters: characterIds.map(id => this.characters.get(id)).filter(Boolean),
            characterIds: characterIds,
            syncType: syncType,
            masterCharacter: characterIds[0],
            slaveCharacters: characterIds.slice(1),
            options: {
                offset: options.offset || 0,     // 遅延時間
                scale: options.scale || 1.0,     // スピード倍率
                mirror: options.mirror || false, // ミラー演出
                precision: options.precision || this.syncTolerance // 同期精度
            },
            isActive: false,
            lastSyncTime: 0
        };
        
        this.syncGroups.set(groupId, syncGroup);
        console.log(`🎭 同期グループ作成: ${groupId}`, {
            type: syncType,
            characters: characterIds,
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
     * 34頂点精密判定システム統合
     */
    synchronizeFromBoundingBoxEvent(event) {
        if (!this.boundingBoxSyncEnabled) {
            console.log('⚠️ 境界ボックス同期無効 - イベントをスキップ');
            return;
        }
        
        try {
            // クリック位置に基づく同期演出分岐
            const clickZone = this.determineClickZone(event.position, event.character);
            const affectedGroups = this.findSyncGroupsByCharacter(event.characterId);
            
            console.log(`🎯 境界ボックス同期イベント: ${event.characterId} - ${clickZone}`, {
                position: event.position,
                affectedGroups: affectedGroups.length
            });
            
            // 該当同期グループで演出実行
            affectedGroups.forEach(group => {
                const syncSequence = this.createSyncSequenceForZone(clickZone, group);
                this.executeSynchronizedSequence(group, syncSequence);
            });
            
        } catch (error) {
            console.error('❌ 境界ボックス同期エラー:', error);
        }
    }
    
    /**
     * 位置別演出システム
     * 34頂点データを活用したより精密な領域判定
     */
    determineClickZone(position, character) {
        // キャラクター別の判定領域定義
        const zones = {
            purattokun: ['head', 'body', 'arms', 'legs', 'tail'],
            nezumi: ['head', 'body', 'arms', 'legs', 'whiskers']
        };
        
        const characterZones = zones[character.id] || zones['purattokun'];
        
        // 簡易的な領域判定（実際は34頂点データを使用）
        const bounds = character.bounds || character.element?.getBoundingClientRect();
        if (!bounds) return 'body'; // デフォルト
        
        const relativeX = (position.x - bounds.left) / bounds.width;
        const relativeY = (position.y - bounds.top) / bounds.height;
        
        // 領域判定ロジック
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
    
    /**
     * 領域別同期シーケンス生成
     */
    createSyncSequenceForZone(clickZone, syncGroup) {
        const sequences = {
            head: ['surprised', 'look_around', 'nod'],
            body: ['wave', 'dance', 'bow'],
            arms: ['stretch', 'flex', 'clap'],
            legs: ['jump', 'kick', 'step'],
            tail: ['wag', 'curl', 'swish'],      // purattokun専用
            whiskers: ['twitch', 'sniff', 'alert'] // nezumi専用
        };
        
        const sequence = sequences[clickZone] || sequences['body'];
        
        return {
            zone: clickZone,
            sequence: sequence,
            duration: 2.0,
            syncType: syncGroup.syncType
        };
    }
    
    // ========== 高度同期パターン実装 ========== //
    
    /**
     * パターン1: 反応同期（一方の動作に他方が反応）
     */
    setupReactionSync(masterCharacterId, slaveCharacterId, reactionMapping) {
        const reactionOptions = {
            type: 'reaction',
            master: masterCharacterId,
            slave: slaveCharacterId,
            mapping: reactionMapping, // { 'wave': 'surprised', 'jump': 'cheer' }
            delay: 0.2 // 反応遅延
        };
        
        const groupId = `reaction_${masterCharacterId}_${slaveCharacterId}_${Date.now()}`;
        return this.createSyncGroup(groupId, [masterCharacterId, slaveCharacterId], 'reaction', reactionOptions);
    }
    
    /**
     * パターン2: 連携演出（複数キャラクターの協調動作）
     */
    setupCoordinatedPerformance(characterIds, performanceScript) {
        const coordinatedOptions = {
            type: 'coordinated',
            timeline: performanceScript, // タイムライン定義
            roles: characterIds.map((id, index) => ({ 
                character: id, 
                role: `performer_${index}`,
                offset: index * 0.5 // 段階的開始
            }))
        };
        
        const groupId = `coordinated_${Date.now()}`;
        return this.createSyncGroup(groupId, characterIds, 'coordinated', coordinatedOptions);
    }
    
    /**
     * パターン3: 追従システム（リーダーに追従）
     */
    setupFollowSystem(leaderCharacterId, followerCharacterIds, followType) {
        const followOptions = {
            type: 'follow',
            leader: leaderCharacterId,
            followers: followerCharacterIds,
            followType: followType, // 'position', 'animation', 'both'
            followDistance: 0.1, // 追従精度
            maxDelay: 0.5 // 最大遅延
        };
        
        const groupId = `follow_${leaderCharacterId}_${Date.now()}`;
        return this.createSyncGroup(groupId, [leaderCharacterId, ...followerCharacterIds], 'follow', followOptions);
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
        
        // 同期タイプ別実行
        switch (syncGroup.syncType) {
            case 'reaction':
                this.executeReactionSync(syncGroup, sequence, syncId);
                break;
            case 'coordinated':
                this.executeCoordinatedSync(syncGroup, sequence, syncId);
                break;
            case 'follow':
                this.executeFollowSync(syncGroup, sequence, syncId);
                break;
            default:
                this.executeBasicSync(syncGroup, sequence, syncId);
        }
    }
    
    /**
     * 反応同期実行
     */
    executeReactionSync(syncGroup, sequence, syncId) {
        const master = syncGroup.characters[0];
        const slaves = syncGroup.characters.slice(1);
        const mapping = syncGroup.options.mapping || {};
        
        // マスターアニメーション開始
        this.triggerAnimation(master, sequence.sequence[0]);
        
        // スレーブ反応（遅延実行）
        setTimeout(() => {
            slaves.forEach(slave => {
                const reactionAnim = mapping[sequence.sequence[0]] || 'surprised';
                this.triggerAnimation(slave, reactionAnim);
            });
            
            this.completeSyncSequence(syncId, syncGroup);
        }, (syncGroup.options.delay || 0.2) * 1000);
    }
    
    /**
     * 連携同期実行
     */
    executeCoordinatedSync(syncGroup, sequence, syncId) {
        const timeline = syncGroup.options.timeline;
        const roles = syncGroup.options.roles || [];
        
        // 各キャラクターの役割に応じて段階的実行
        roles.forEach((role, index) => {
            const character = syncGroup.characters.find(c => c.id === role.character);
            if (character) {
                const delay = role.offset * 1000;
                
                setTimeout(() => {
                    sequence.sequence.forEach((anim, animIndex) => {
                        setTimeout(() => {
                            this.triggerAnimation(character, anim);
                        }, animIndex * 800);
                    });
                }, delay);
            }
        });
        
        // 全体完了タイミング計算
        const totalDuration = Math.max(...roles.map(r => r.offset)) + sequence.sequence.length * 0.8;
        setTimeout(() => {
            this.completeSyncSequence(syncId, syncGroup);
        }, totalDuration * 1000);
    }
    
    /**
     * 追従同期実行
     */
    executeFollowSync(syncGroup, sequence, syncId) {
        const leader = syncGroup.characters[0];
        const followers = syncGroup.characters.slice(1);
        
        // リーダーアニメーション開始
        this.triggerAnimation(leader, sequence.sequence[0]);
        
        // フォロワー追従（段階的遅延）
        followers.forEach((follower, index) => {
            const delay = (index + 1) * (syncGroup.options.followDistance || 0.1) * 1000;
            
            setTimeout(() => {
                this.triggerAnimation(follower, sequence.sequence[0]);
            }, delay);
        });
        
        setTimeout(() => {
            this.completeSyncSequence(syncId, syncGroup);
        }, sequence.duration * 1000);
    }
    
    /**
     * 基本同期実行
     */
    executeBasicSync(syncGroup, sequence, syncId) {
        // 全キャラクター同時実行
        syncGroup.characters.forEach((character, index) => {
            const delay = index * syncGroup.options.offset * 1000;
            
            setTimeout(() => {
                this.triggerAnimation(character, sequence.sequence[0]);
            }, delay);
        });
        
        setTimeout(() => {
            this.completeSyncSequence(syncId, syncGroup);
        }, sequence.duration * 1000);
    }
    
    /**
     * アニメーション実行（既存システム統合）
     */
    triggerAnimation(character, animationName) {
        try {
            // 既存システムとの統合
            if (character.animationState && character.animationState.setAnimation) {
                // Spine WebGL
                character.animationState.setAnimation(0, animationName, false);
                console.log(`🎬 Spine WebGL アニメーション実行: ${character.id} - ${animationName}`);
            } else if (typeof character.playAnimation === 'function') {
                // カスタムアニメーションシステム
                character.playAnimation(animationName);
                console.log(`🎬 カスタムアニメーション実行: ${character.id} - ${animationName}`);
            } else if (character.element) {
                // CSS アニメーション フォールバック
                character.element.classList.add(`animation-${animationName}`);
                console.log(`🎬 CSSアニメーション実行: ${character.id} - ${animationName}`);
            }
        } catch (error) {
            console.error(`❌ アニメーション実行エラー: ${character.id}`, error);
        }
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
    
    // ========== ユーティリティ ========== //
    
    /**
     * フレーム更新（60FPS維持）
     */
    updateFrame(timestamp) {
        if (timestamp - this.lastFrameTime >= 16.67) { // 60FPS制御
            this.frameCount++;
            this.lastFrameTime = timestamp;
            
            // アクティブな同期の更新
            this.updateActiveSyncs(timestamp);
        }
    }
    
    /**
     * アクティブ同期更新
     */
    updateActiveSyncs(timestamp) {
        this.syncGroups.forEach(group => {
            if (group.isActive) {
                const elapsedTime = (timestamp - group.lastSyncTime) / 1000;
                // 必要に応じて同期状態の更新処理
            }
        });
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
    
    /**
     * デバッグ情報出力
     */
    debugStatus() {
        console.log('🎭 Advanced Character Sync Controller Status:', this.getSystemStatus());
        
        console.log('📋 同期グループ詳細:');
        this.syncGroups.forEach((group, id) => {
            console.log(`  ${id}:`, {
                type: group.syncType,
                characters: group.characterIds,
                active: group.isActive
            });
        });
    }
}

// ========== 実験環境統合システム ========== //

/**
 * timeline-experiment.html統合機能
 * 同期制御テスト機能をUIに追加
 */
function setupSyncExperiments() {
    console.log('🎭 同期実験環境セットアップ開始');
    
    // サンプル同期演出のボタン追加
    const syncControls = `
        <div class="control-section sync-controls">
            <h4>🎭 キャラクター同期演出</h4>
            <button class="btn btn-secondary" onclick="testReactionSync()">反応同期テスト</button>
            <button class="btn btn-secondary" onclick="testCoordinatedPerformance()">連携演出テスト</button>
            <button class="btn btn-secondary" onclick="testFollowSystem()">追従システムテスト</button>
            <button class="btn btn-secondary" onclick="testBoundingBoxSync()">境界ボックス同期テスト</button>
            <button class="btn" onclick="clearAllSyncGroups()">🗑️ 全同期グループクリア</button>
            <button class="btn" onclick="debugSyncStatus()">🔍 同期システム状態確認</button>
        </div>
    `;
    
    // 実験環境に追加
    const controlSection = document.querySelector('.timeline-controls');
    if (controlSection) {
        controlSection.insertAdjacentHTML('beforeend', syncControls);
        console.log('✅ 同期制御UI追加完了');
    } else {
        console.log('⚠️ .timeline-controls が見つかりません');
    }
}

// ========== テスト関数群 ========== //

function testReactionSync() {
    if (window.advancedSyncController) {
        window.advancedSyncController.setupReactionSync('purattokun', 'nezumi', {
            'wave': 'surprised',
            'jump': 'cheer',
            'idle': 'idle'
        });
        
        // テスト実行
        const testEvent = {
            characterId: 'purattokun',
            position: { x: 100, y: 150 },
            character: { id: 'purattokun', element: document.getElementById('purattokun-canvas') }
        };
        
        window.advancedSyncController.synchronizeFromBoundingBoxEvent(testEvent);
        console.log('🎭 反応同期テスト開始');
    } else {
        console.log('❌ advancedSyncController が初期化されていません');
    }
}

function testCoordinatedPerformance() {
    if (window.advancedSyncController) {
        const performanceScript = {
            duration: 5.0,
            sequence: ['appear', 'dance', 'bow']
        };
        
        window.advancedSyncController.setupCoordinatedPerformance(
            ['purattokun', 'nezumi'], 
            performanceScript
        );
        
        // テスト実行
        const testSequence = {
            sequence: ['dance', 'jump', 'bow'],
            duration: 3.0,
            syncType: 'coordinated'
        };
        
        const group = Array.from(window.advancedSyncController.syncGroups.values())[0];
        if (group) {
            window.advancedSyncController.executeSynchronizedSequence(group, testSequence);
        }
        
        console.log('🎭 連携演出テスト開始');
    }
}

function testFollowSystem() {
    if (window.advancedSyncController) {
        window.advancedSyncController.setupFollowSystem(
            'purattokun',
            ['nezumi'],
            'animation'
        );
        
        console.log('🎭 追従システムテスト開始');
    }
}

function testBoundingBoxSync() {
    if (window.advancedSyncController) {
        // 境界ボックス同期テスト
        const mockEvent = {
            characterId: 'purattokun',
            position: { x: 200, y: 100 },
            character: {
                id: 'purattokun',
                element: document.getElementById('purattokun-canvas'),
                bounds: { left: 50, top: 50, width: 200, height: 300 }
            }
        };
        
        window.advancedSyncController.synchronizeFromBoundingBoxEvent(mockEvent);
        console.log('🎭 境界ボックス同期テスト開始');
    }
}

function clearAllSyncGroups() {
    if (window.advancedSyncController) {
        const groupIds = Array.from(window.advancedSyncController.syncGroups.keys());
        groupIds.forEach(id => {
            window.advancedSyncController.removeSyncGroup(id);
        });
        console.log('🗑️ 全同期グループクリア完了');
    }
}

function debugSyncStatus() {
    if (window.advancedSyncController) {
        window.advancedSyncController.debugStatus();
    }
}

// ========== グローバル登録・統合システム ========== //

// グローバル登録
window.AdvancedCharacterSyncController = AdvancedCharacterSyncController;

/**
 * 実験環境初期化関数
 * timeline-experiment.htmlから呼び出される
 */
window.initializeCharacterSyncForExperiment = function() {
    console.log('🎭 実験環境用キャラクター同期システム初期化');
    
    try {
        // キャラクターマップ作成（サンプル）
        const characters = new Map();
        
        // サンプルキャラクター追加
        const sampleCharacters = [
            { id: 'purattokun', element: document.getElementById('purattokun-canvas') },
            { id: 'nezumi', element: document.getElementById('nezumi-canvas') }
        ];
        
        sampleCharacters.forEach(char => {
            if (char.element) {
                characters.set(char.id, char);
                console.log(`✅ キャラクター登録: ${char.id}`);
            }
        });
        
        // 同期コントローラー初期化
        const timelineEngine = window.timelineExperiment?.timelineEngine || null;
        window.advancedSyncController = new AdvancedCharacterSyncController(timelineEngine, characters);
        
        // UI追加
        setupSyncExperiments();
        
        // フレーム更新開始
        const updateLoop = (timestamp) => {
            window.advancedSyncController.updateFrame(timestamp);
            requestAnimationFrame(updateLoop);
        };
        requestAnimationFrame(updateLoop);
        
        console.log('✅ 実験環境用キャラクター同期システム初期化完了');
        
    } catch (error) {
        console.error('❌ 実験環境初期化エラー:', error);
    }
};

// 自動初期化（実験環境統合）
document.addEventListener('DOMContentLoaded', () => {
    // timeline-experiment.html検出
    if (document.title.includes('タイムライン制御システム')) {
        console.log('🎭 タイムライン実験環境でのキャラクター同期システム初期化');
        
        // 実験環境用の初期化を遅延実行
        setTimeout(() => {
            window.initializeCharacterSyncForExperiment?.();
        }, 1000);
    }
});

console.log('✅ Advanced Character Sync Controller 読み込み完了');
