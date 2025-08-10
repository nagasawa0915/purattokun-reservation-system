/**
 * 🎭 Timeline Sync Patterns System
 * 高度同期パターン実装・演出制御システム
 * 
 * 【技術仕様】
 * - ファイルサイズ: 250行以内
 * - 機能: 反応同期・連携演出・追従システム実装
 * - 依存: timeline-sync-core.js（基本制御）
 * - 統合: timeline-sync-experiments.js（UI）
 */

console.log('🎭 Timeline Sync Patterns System 読み込み開始');

// ========== 高度同期パターン実装 ========== //

/**
 * 高度同期パターン制御システム
 * 複雑な同期演出パターンを実装
 */
class TimelineSyncPatterns {
    constructor(syncCore) {
        this.syncCore = syncCore;
        console.log('🎭 TimelineSyncPatterns 初期化');
    }
    
    // ========== パターン1: 反応同期 ========== //
    
    /**
     * 反応同期セットアップ（一方の動作に他方が反応）
     */
    setupReactionSync(masterCharacterId, slaveCharacterId, reactionMapping) {
        const reactionOptions = {
            type: 'reaction',
            master: masterCharacterId,
            slave: slaveCharacterId,
            mapping: reactionMapping, // { 'wave': 'surprised', 'jump': 'cheer' }
            delay: 0.2
        };
        
        const groupId = `reaction_${masterCharacterId}_${slaveCharacterId}_${Date.now()}`;
        return this.syncCore.createSyncGroup(groupId, [masterCharacterId, slaveCharacterId], 'reaction', reactionOptions);
    }
    
    /**
     * パターン2: 連携演出（複数キャラクターの協調動作）
     */
    setupCoordinatedPerformance(characterIds, performanceScript) {
        const coordinatedOptions = {
            type: 'coordinated',
            timeline: performanceScript,
            roles: characterIds.map((id, index) => ({ 
                character: id, 
                role: `performer_${index}`,
                offset: index * 0.5
            }))
        };
        
        const groupId = `coordinated_${Date.now()}`;
        return this.syncCore.createSyncGroup(groupId, characterIds, 'coordinated', coordinatedOptions);
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
            followDistance: 0.1,
            maxDelay: 0.5
        };
        
        const groupId = `follow_${leaderCharacterId}_${Date.now()}`;
        return this.syncCore.createSyncGroup(groupId, [leaderCharacterId, ...followerCharacterIds], 'follow', followOptions);
    }
    
    // ========== 領域別同期シーケンス生成 ========== //
    
    /**
     * 領域別同期シーケンス生成
     */
    createSyncSequenceForZone(clickZone, syncGroup) {
        const sequences = {
            head: ['surprised', 'look_around', 'nod'],
            body: ['wave', 'dance', 'bow'],
            arms: ['stretch', 'flex', 'clap'],
            legs: ['jump', 'kick', 'step'],
            tail: ['wag', 'curl', 'swish'],
            whiskers: ['twitch', 'sniff', 'alert']
        };
        
        const sequence = sequences[clickZone] || sequences['body'];
        
        return {
            zone: clickZone,
            sequence: sequence,
            duration: 2.0,
            syncType: syncGroup.syncType
        };
    }
    
    // ========== 同期タイプ別実行システム ========== //
    
    /**
     * 同期タイプ別実行分岐
     */
    executeSyncByType(syncGroup, sequence, syncId) {
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
                this.syncCore.executeBasicSync(syncGroup, sequence, syncId);
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
        this.syncCore.triggerAnimation(master, sequence.sequence[0]);
        
        // スレーブ反応（遅延実行）
        setTimeout(() => {
            slaves.forEach(slave => {
                const reactionAnim = mapping[sequence.sequence[0]] || 'surprised';
                this.syncCore.triggerAnimation(slave, reactionAnim);
            });
            
            this.syncCore.completeSyncSequence(syncId, syncGroup);
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
                            this.syncCore.triggerAnimation(character, anim);
                        }, animIndex * 800);
                    });
                }, delay);
            }
        });
        
        // 全体完了タイミング計算
        const totalDuration = Math.max(...roles.map(r => r.offset)) + sequence.sequence.length * 0.8;
        setTimeout(() => {
            this.syncCore.completeSyncSequence(syncId, syncGroup);
        }, totalDuration * 1000);
    }
    
    /**
     * 追従同期実行
     */
    executeFollowSync(syncGroup, sequence, syncId) {
        const leader = syncGroup.characters[0];
        const followers = syncGroup.characters.slice(1);
        
        // リーダーアニメーション開始
        this.syncCore.triggerAnimation(leader, sequence.sequence[0]);
        
        // フォロワー追従（段階的遅延）
        followers.forEach((follower, index) => {
            const delay = (index + 1) * (syncGroup.options.followDistance || 0.1) * 1000;
            
            setTimeout(() => {
                this.syncCore.triggerAnimation(follower, sequence.sequence[0]);
            }, delay);
        });
        
        setTimeout(() => {
            this.syncCore.completeSyncSequence(syncId, syncGroup);
        }, sequence.duration * 1000);
    }
    
    // ========== 高度演出パターン ========== //
    
    /**
     * 複雑演出チェーン
     */
    executeComplexChain(characterIds, chainDefinition) {
        console.log(`🎭 複雑演出チェーン開始: ${chainDefinition.name}`);
        
        chainDefinition.steps.forEach((step, index) => {
            setTimeout(() => {
                const targetCharacter = this.syncCore.characters.get(step.characterId);
                if (targetCharacter) {
                    // 条件チェック
                    if (!step.condition || step.condition()) {
                        this.syncCore.triggerAnimation(targetCharacter, step.animation);
                        
                        // 連鎖トリガー
                        if (step.triggers) {
                            step.triggers.forEach(trigger => {
                                setTimeout(() => {
                                    this.executeTriggeredAction(trigger);
                                }, trigger.delay || 0);
                            });
                        }
                    }
                }
            }, step.delay || 0);
        });
    }
    
    /**
     * トリガーアクション実行
     */
    executeTriggeredAction(trigger) {
        switch (trigger.type) {
            case 'animation':
                const character = this.syncCore.characters.get(trigger.characterId);
                if (character) {
                    this.syncCore.triggerAnimation(character, trigger.animation);
                }
                break;
            case 'sync':
                // 他の同期グループをトリガー
                const group = this.syncCore.syncGroups.get(trigger.syncGroupId);
                if (group) {
                    this.syncCore.executeSynchronizedSequence(group, trigger.sequence);
                }
                break;
            case 'event':
                // カスタムイベント発火
                document.dispatchEvent(new CustomEvent(trigger.eventName, {
                    detail: trigger.eventData
                }));
                break;
        }
    }
    
    // ========== 状態管理・ユーティリティ ========== //
    
    /**
     * 同期状態の分析・最適化
     */
    analyzeSyncPerformance() {
        const status = this.syncCore.getSystemStatus();
        const analysis = {
            efficiency: this.calculateSyncEfficiency(),
            conflicts: this.detectSyncConflicts(),
            recommendations: this.generateOptimizationRecommendations()
        };
        
        console.log('📊 同期パフォーマンス分析:', analysis);
        return analysis;
    }
    
    /**
     * 同期効率計算
     */
    calculateSyncEfficiency() {
        const totalGroups = this.syncCore.syncGroups.size;
        const activeGroups = Array.from(this.syncCore.syncGroups.values()).filter(g => g.isActive).length;
        
        return totalGroups > 0 ? (activeGroups / totalGroups) * 100 : 0;
    }
    
    /**
     * 同期競合検出
     */
    detectSyncConflicts() {
        const conflicts = [];
        const characterUsage = new Map();
        
        // 各キャラクターの使用状況を分析
        this.syncCore.syncGroups.forEach((group, groupId) => {
            if (group.isActive) {
                group.characterIds.forEach(charId => {
                    if (!characterUsage.has(charId)) {
                        characterUsage.set(charId, []);
                    }
                    characterUsage.get(charId).push(groupId);
                });
            }
        });
        
        // 競合検出
        characterUsage.forEach((groups, charId) => {
            if (groups.length > 1) {
                conflicts.push({
                    character: charId,
                    conflictingGroups: groups
                });
            }
        });
        
        return conflicts;
    }
    
    /**
     * 最適化推奨事項生成
     */
    generateOptimizationRecommendations() {
        const recommendations = [];
        const status = this.syncCore.getSystemStatus();
        
        if (status.activeGroups > 3) {
            recommendations.push('アクティブ同期グループ数が多いため、優先度による制限を検討してください');
        }
        
        if (this.detectSyncConflicts().length > 0) {
            recommendations.push('キャラクター競合が検出されました。同期グループの調整を推奨します');
        }
        
        return recommendations;
    }
}

// ========== グローバル登録 ========== //

window.TimelineSyncPatterns = TimelineSyncPatterns;

console.log('✅ Timeline Sync Patterns System 読み込み完了');