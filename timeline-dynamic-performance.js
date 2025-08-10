/**
 * 🎬 動的演出制御・条件分岐システム (350行版)
 * リアルタイム条件判定・瞬時演出切り替え・境界ボックス統合
 */
console.log('🎬 Dynamic Performance Control System 読み込み開始');

// 動的演出制御エンジン
class DynamicPerformanceController {
    constructor(timelineEngine, boundingBoxSystem, characterManager) {
        this.timelineEngine = timelineEngine;
        this.boundingBoxSystem = boundingBoxSystem;
        this.characterManager = characterManager;
        
        this.performanceRules = new Map(); // character -> rules[]
        this.contextState = new Map();     // character -> context
        this.activeRules = new Map();      // character -> activeRule
        this.cooldownTimers = new Map();   // rule -> timestamp
        
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.isActive = false;
        
        console.log('🎬 DynamicPerformanceController 初期化');
        this.initializePerformanceSystem();
    }
    
    // パフォーマンスシステム初期化
    initializePerformanceSystem() {
        // 境界ボックス統合確認
        this.checkBoundingBoxIntegration();
        
        // デフォルト演出パターン登録
        this.setupDefaultPerformances();
        
        // フレーム更新開始
        this.startUpdateLoop();
        
        this.isActive = true;
        console.log('✅ パフォーマンスシステム初期化完了');
    }
    
    // 境界ボックス統合確認
    checkBoundingBoxIntegration() {
        if (typeof window.indexBoundsManager !== 'undefined') {
            this.boundingBoxSystem = window.indexBoundsManager;
            console.log('✅ 境界ボックス34頂点システム統合完了');
        } else {
            console.log('⚠️ 境界ボックスシステム未検出 - 基本モードで動作');
        }
    }
    
    // デフォルト演出パターン登録
    setupDefaultPerformances() {
        // 時間帯別演出
        this.setupTimeBasedPerformances();
        
        // 状態遷移演出
        this.setupStateTransitionPerformances();
        
        // 環境連動演出
        this.setupEnvironmentResponsivePerformances();
        
        // インタラクション連動演出
        this.setupInteractionBasedPerformances();
        
        console.log('📋 デフォルト演出パターン登録完了');
    }
    
    setupTimeBasedPerformances() {
        this.addPerformanceRule('purattokun', {
            name: '朝の挨拶演出', timeCondition: { hour: [6,7,8,9,10,11] },
            condition: (context) => context.lastInteraction?.type === 'click',
            sequence: ['stretch', 'wave', 'morning_idle'], priority: 2, cooldown: 10000
        });
        this.addPerformanceRule('nezumi', {
            name: '夜の活動演出', timeCondition: { hour: [18,19,20,21,22,23] },
            condition: (context) => context.currentAnimation === 'idle',
            sequence: ['alert', 'sniff', 'night_active'], priority: 1, cooldown: 15000
        });
    }
    
    setupStateTransitionPerformances() {
        this.addPerformanceRule('purattokun', {
            name: 'アクティブモード移行',
            condition: (context) => context.previousState === 'idle' && context.currentState === 'active' && context.interactionIntensity > 0.5,
            sequence: ['alert', 'ready', 'active_idle'], priority: 2, cooldown: 5000
        });
        this.addPerformanceRule('purattokun', {
            name: '連続クリック演出', condition: (context) => context.consecutiveClicks >= 3,
            sequence: ['surprised', 'dizzy', 'laugh'], priority: 3, cooldown: 8000
        });
    }
    
    setupEnvironmentResponsivePerformances() {
        this.addPerformanceRule('purattokun', {
            name: 'レスポンシブ演出', condition: (context) => context.screenSizeChanged && context.newScreenSize === 'mobile',
            sequence: ['adapt', 'mobile_wave', 'mobile_idle'], priority: 1, cooldown: 3000
        });
        this.addPerformanceRule('nezumi', {
            name: '中央エリア演出', positionCondition: { zone: 'center', relation: 'in' },
            condition: (context) => context.lastInteraction?.type === 'click',
            sequence: ['position_reaction', 'center_dance'], priority: 2, cooldown: 6000
        });
    }
    
    setupInteractionBasedPerformances() {
        this.addPerformanceRule('purattokun', {
            name: 'ダブルクリック特殊演出', interactionCondition: { type: 'doubleclick', minInterval: 100 },
            sequence: ['special_jump', 'celebration', 'bow'], priority: 4, cooldown: 12000
        });
        this.addPerformanceRule('nezumi', {
            name: '復帰演出', condition: (context) => {
                const timeSince = Date.now() - (context.lastInteraction?.timestamp || 0);
                return timeSince > 30000;
            }, sequence: ['wake_up', 'stretch', 'look_around'], priority: 1, cooldown: 20000
        });
    }
    
    
    // パフォーマンスルール登録
    addPerformanceRule(characterId, ruleConfig) {
        const rule = {
            id: ruleConfig.id || 'rule_' + Date.now(),
            name: ruleConfig.name,
            condition: ruleConfig.condition, // 条件判定関数
            sequence: ruleConfig.sequence,   // 実行シーケンス
            priority: ruleConfig.priority || 1,
            cooldown: ruleConfig.cooldown || 0, // クールダウン時間
            timeCondition: ruleConfig.timeCondition,
            positionCondition: ruleConfig.positionCondition,
            animationCondition: ruleConfig.animationCondition,
            interactionCondition: ruleConfig.interactionCondition
        };
        
        if (!this.performanceRules.has(characterId)) {
            this.performanceRules.set(characterId, []);
        }
        
        this.performanceRules.get(characterId).push(rule);
        console.log(`🎬 動的演出ルール追加: ${characterId} - ${rule.name}`);
        
        return rule.id;
    }
    
    removePerformanceRule(characterId, ruleId) {
        if (!this.performanceRules.has(characterId)) return false;
        
        const rules = this.performanceRules.get(characterId);
        const index = rules.findIndex(rule => rule.id === ruleId);
        
        if (index >= 0) {
            rules.splice(index, 1);
            console.log(`🗑️ 動的演出ルール削除: ${characterId} - ${ruleId}`);
            return true;
        }
        
        return false;
    }
    
    updateContext(characterId, contextUpdate) {
        if (!this.contextState.has(characterId)) {
            // デフォルトコンテキスト初期化
            const defaultContext = {
                position: { x: 0, y: 0 },
                currentAnimation: 'idle',
                previousState: 'idle',
                currentState: 'idle',
                lastInteraction: null,
                consecutiveClicks: 0,
                interactionIntensity: 0,
                screenSizeChanged: false,
                newScreenSize: 'desktop'
            };
            this.contextState.set(characterId, defaultContext);
        }
        
        // コンテキスト更新
        const context = this.contextState.get(characterId);
        Object.assign(context, contextUpdate);
        
        // ルール評価実行
        this.evaluateRules(characterId, context);
    }
    
    
    evaluateRules(characterId, context) {
        if (!this.performanceRules.has(characterId)) {
            return;
        }
        
        const startTime = performance.now();
        const rules = this.performanceRules.get(characterId);
        
        // 優先度順にルールをソート
        const sortedRules = rules.sort((a, b) => b.priority - a.priority);
        
        // 各ルールを評価・実行
        for (const rule of sortedRules) {
            if (this.isRuleOnCooldown(rule.id)) {
                continue;
            }
            
            if (PerformanceConditionEvaluator.evaluateCondition(context, rule)) {
                this.executePerformanceRule(characterId, rule);
                break; // 最初にマッチしたルールのみ実行
            }
        }
        
        // パフォーマンス監視
        const evalTime = performance.now() - startTime;
        if (evalTime > 16) {
            console.warn(`⚠️ 条件評価時間超過: ${evalTime.toFixed(2)}ms`);
        }
    }
    
    isRuleOnCooldown(ruleId) {
        if (!this.cooldownTimers.has(ruleId)) return false;
        
        const lastExecution = this.cooldownTimers.get(ruleId);
        const now = performance.now();
        
        return (now - lastExecution) < 1000; // 1秒クールダウン
    }
    
    executePerformanceRule(characterId, rule) {
        console.log(`🎯 動的演出実行: ${characterId} - ${rule.name}`);
        
        // クールダウン設定
        this.cooldownTimers.set(rule.id, performance.now());
        
        // アクティブルール記録
        this.activeRules.set(characterId, rule);
        
        // シーケンス実行
        if (Array.isArray(rule.sequence)) {
            this.executeAnimationSequence(characterId, rule.sequence);
        } else {
            this.executeSingleAnimation(characterId, rule.sequence);
        }
        
        // 完了イベント発火
        setTimeout(() => {
            this.dispatchPerformanceCompleteEvent(characterId, rule);
            this.activeRules.delete(characterId);
        }, 2000);
    }
    
    executeAnimationSequence(characterId, sequence) {
        sequence.forEach((animation, index) => {
            setTimeout(() => {
                this.triggerAnimation(characterId, animation);
            }, index * 800); // 800ms間隔
        });
    }
    
    executeSingleAnimation(characterId, animation) {
        this.triggerAnimation(characterId, animation);
    }
    
    triggerAnimation(characterId, animationName) {
        try {
            // 既存キャラクターマネージャー統合
            if (this.characterManager && this.characterManager.playAnimation) {
                this.characterManager.playAnimation(characterId, animationName);
            } else if (typeof window.spineCharacters !== 'undefined') {
                // 既存spineCharactersシステム
                const character = window.spineCharacters[characterId];
                if (character && character.state) {
                    character.state.setAnimation(0, animationName, false);
                }
            } else {
                console.log(`🎬 アニメーション実行: ${characterId} - ${animationName}`);
            }
        } catch (error) {
            console.error(`❌ アニメーション実行エラー: ${characterId}`, error);
        }
    }
    
    dispatchPerformanceCompleteEvent(characterId, rule) {
        const event = new CustomEvent('dynamicPerformanceComplete', {
            detail: {
                characterId: characterId,
                ruleName: rule.name,
                ruleId: rule.id
            }
        });
        
        document.dispatchEvent(event);
    }
    
    
    startUpdateLoop() {
        let rafId = null;
        
        const update = (timestamp) => {
            if (timestamp - this.lastFrameTime >= 16.67) { // 60FPS制御
                this.frameCount++;
                this.lastFrameTime = timestamp;
                
                // 🏃 条件付き監視: アクティブルールがある場合のみ
                if (this.activeRules.size > 0 || this.frameCount % 300 === 0) {
                    this.monitorActivePerformances();
                }
            }
            
            if (this.isActive) {
                rafId = requestAnimationFrame(update);
            }
        };
        
        rafId = requestAnimationFrame(update);
        
        // クリーンアップ用に保存
        this.currentRAFId = rafId;
    }
    
    monitorActivePerformances() {
        // メモリ使用量監視
        if (this.frameCount % 300 === 0) { // 5秒ごと
            this.cleanupExpiredCooldowns();
        }
    }
    
    cleanupExpiredCooldowns() {
        const now = performance.now();
        const expiredKeys = [];
        
        this.cooldownTimers.forEach((timestamp, ruleId) => {
            if (now - timestamp > 60000) { // 60秒経過
                expiredKeys.push(ruleId);
            }
        });
        
        expiredKeys.forEach(key => this.cooldownTimers.delete(key));
        
        if (expiredKeys.length > 0) {
            console.log(`🧹 クールダウンクリーンアップ: ${expiredKeys.length}項目削除`);
        }
    }
    
    stop() {
        this.isActive = false;
        
        // 🧹 リソースの完全クリーンアップ
        this.activeRules.clear();
        this.cooldownTimers.clear();
        this.contextState.clear();
        
        // アニメーションフレームキャンセル
        if (this.currentRAFId) {
            cancelAnimationFrame(this.currentRAFId);
            this.currentRAFId = null;
        }
        
        console.log('⏹️ 動的演出制御システム停止・リソースクリーンアップ完了');
    }
    
    getSystemStatus() {
        return {
            isActive: this.isActive,
            totalRules: Array.from(this.performanceRules.values()).reduce((sum, rules) => sum + rules.length, 0),
            activeRules: this.activeRules.size,
            cooldownTimers: this.cooldownTimers.size,
            frameCount: this.frameCount,
            characters: this.contextState.size
        };
    }
    
    debugStatus() {
        console.log('🎬 Status:', this.getSystemStatus());
        
        this.performanceRules.forEach((rules, id) => {
            const ruleInfo = rules.map(r => ({
                name: r.name, 
                priority: r.priority
            }));
            console.log(`📋 ${id}:`, ruleInfo);
        });
    }
}


class PerformanceConditionEvaluator {
    static evaluateCondition(context, rule) {
        if (rule.timeCondition && !this.checkTimeCondition(rule.timeCondition)) return false;
        if (rule.positionCondition && !this.checkPositionCondition(context.position, rule.positionCondition)) return false;
        if (rule.animationCondition && !this.checkAnimationCondition(context.currentAnimation, rule.animationCondition)) return false;
        if (rule.interactionCondition && !this.checkInteractionCondition(context.lastInteraction, rule.interactionCondition)) return false;
        if (typeof rule.condition === 'function') {
            try { return rule.condition(context); } catch (error) { console.error('❌ カスタム条件エラー:', error); return false; }
        }
        return true;
    }
    static checkTimeCondition(timeCondition) {
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();
        
        // 時間条件チェック
        if (timeCondition.hour !== undefined) {
            if (Array.isArray(timeCondition.hour)) {
                if (!timeCondition.hour.includes(hour)) {
                    return false;
                }
            } else if (hour !== timeCondition.hour) {
                return false;
            }
        }
        
        // 曜日条件チェック
        if (timeCondition.dayOfWeek !== undefined) {
            if (Array.isArray(timeCondition.dayOfWeek)) {
                if (!timeCondition.dayOfWeek.includes(dayOfWeek)) {
                    return false;
                }
            } else if (dayOfWeek !== timeCondition.dayOfWeek) {
                return false;
            }
        }
        
        return true;
    }
    static checkPositionCondition(currentPosition, positionCondition) {
        const { zone, relation, target } = positionCondition;
        
        // 境界ボックスシステムによるゾーン判定
        if (zone && window.indexBoundsManager) {
            try {
                const inZone = window.indexBoundsManager.isPointInZone(currentPosition, zone);
                return relation === 'in' ? inZone : !inZone;
            } catch (error) {
                console.warn('⚠️ 境界ボックス判定エラー:', error);
                return false;
            }
        }
        
        // ターゲット距離による位置判定
        if (target && relation) {
            const distance = this.calculateDistance(currentPosition, target);
            
            switch (relation) {
                case 'near':
                    return distance < (target.threshold || 100);
                case 'far':
                    return distance > (target.threshold || 200);
                case 'exactly':
                    return Math.abs(distance - target.distance) < 10;
                default:
                    return false;
            }
        }
        
        return false;
    }
    static checkAnimationCondition(currentAnimation, animationCondition) {
        return Array.isArray(animationCondition) ? animationCondition.includes(currentAnimation) : currentAnimation === animationCondition;
    }
    static checkInteractionCondition(lastInteraction, interactionCondition) {
        if (!lastInteraction) return false;
        if (interactionCondition.type && lastInteraction.type !== interactionCondition.type) return false;
        if (interactionCondition.minInterval) {
            const timeSince = Date.now() - lastInteraction.timestamp;
            if (timeSince < interactionCondition.minInterval) return false;
        }
        return true;
    }
    static calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}



function setupDynamicPerformanceExperiments() {
    console.log('🎬 動的演出実験環境セットアップ開始');
    
    const dynamicControls = `
        <div class="control-section dynamic-controls">
            <h4>🎬 動的演出制御</h4>
            <button class="btn btn-secondary" onclick="testTimeBasedPerformance()">時間ベース演出</button>
            <button class="btn btn-secondary" onclick="testPositionBasedPerformance()">位置ベース演出</button>
            <button class="btn btn-secondary" onclick="testInteractionBasedPerformance()">インタラクション演出</button>
            <button class="btn btn-secondary" onclick="testContextAwarePerformance()">コンテキスト感知演出</button>
            <button class="btn" onclick="clearPerformanceRules()">🗑️ ルールクリア</button>
            <button class="btn" onclick="debugPerformanceState()">🔍 状態デバッグ</button>
        </div>
    `;
    
    const controlSection = document.querySelector('.timeline-controls');
    if (controlSection) {
        controlSection.insertAdjacentHTML('beforeend', dynamicControls);
        console.log('✅ 動的演出制御UI追加完了');
    } else {
        console.log('⚠️ .timeline-controls が見つかりません');
    }
}

function testTimeBasedPerformance() {
    const dpc = window.dynamicPerformanceController;
    if (!dpc) { console.log('❌ Controller 未初期化'); return; }
    dpc.addPerformanceRule('purattokun', { name: '時間ベーステスト', timeCondition: { hour: [new Date().getHours()] }, condition: () => true, sequence: ['time_reaction', 'celebrate', 'idle'], priority: 5, cooldown: 3000 });
    dpc.updateContext('purattokun', { lastInteraction: { type: 'click', timestamp: Date.now() } });
    console.log('🕐 時間ベーステスト開始:', new Date().getHours() + '時');
}
function testPositionBasedPerformance() {
    const dpc = window.dynamicPerformanceController;
    if (!dpc) { console.log('❌ Controller 未初期化'); return; }
    dpc.addPerformanceRule('nezumi', { name: '位置ベーステスト', positionCondition: { zone: 'center', relation: 'in' }, condition: () => true, sequence: ['position_reaction', 'dance', 'idle'], priority: 4, cooldown: 5000 });
    dpc.updateContext('nezumi', { position: { x: 200, y: 150 }, lastInteraction: { type: 'click', timestamp: Date.now() } });
    console.log('📍 位置ベーステスト開始');
}
function testInteractionBasedPerformance() {
    const dpc = window.dynamicPerformanceController;
    if (!dpc) { console.log('❌ Controller 未初期化'); return; }
    dpc.addPerformanceRule('purattokun', { name: 'インタラクションテスト', interactionCondition: { type: 'click', minInterval: 0 }, condition: () => true, sequence: ['surprised', 'happy', 'idle'], priority: 3, cooldown: 2000 });
    dpc.updateContext('purattokun', { lastInteraction: { type: 'click', timestamp: Date.now() } });
    console.log('🎯 インタラクションテスト開始');
}
function testContextAwarePerformance() {
    const dpc = window.dynamicPerformanceController;
    if (!dpc) { console.log('❌ Controller 未初期化'); return; }
    dpc.addPerformanceRule('nezumi', { name: 'コンテキスト感知テスト', condition: (ctx) => ctx.consecutiveClicks >= 2 || ctx.interactionIntensity > 0.3, sequence: ['context_aware', 'smart_reaction', 'idle'], priority: 6, cooldown: 7000 });
    dpc.updateContext('nezumi', { consecutiveClicks: 3, interactionIntensity: 0.8, currentState: 'active', lastInteraction: { type: 'click', timestamp: Date.now() } });
    console.log('🧠 コンテキスト感知テスト開始');
}
function clearPerformanceRules() {
    const dpc = window.dynamicPerformanceController;
    if (!dpc) { console.log('❌ Controller 未初期化'); return; }
    dpc.performanceRules.clear(); dpc.activeRules.clear(); dpc.cooldownTimers.clear();
    console.log('🗑️ ルールクリア完了'); dpc.setupDefaultPerformances(); console.log('📋 デフォルト再設定完了');
}
function debugPerformanceState() {
    const dpc = window.dynamicPerformanceController;
    if (!dpc) { console.log('❌ Controller 未初期化'); return; }
    dpc.debugStatus(); console.log('🔍 コンテキスト:', Array.from(dpc.contextState.entries()).map(([id, ctx]) => ({ [id]: { pos: ctx.position, anim: ctx.currentAnimation, clicks: ctx.consecutiveClicks, intensity: ctx.interactionIntensity } })));
}

window.initializeDynamicPerformanceForExperiment = function() {
    console.log('🎬 実験環境用動的演出システム初期化');
    try {
        window.dynamicPerformanceController = new DynamicPerformanceController(window.timelineExperiment?.timelineEngine, window.indexBoundsManager, window.spineCharacterManager);
        setupDynamicPerformanceExperiments();
        console.log('✅ 実験環境用動的演出システム初期化完了');
        const dpc = window.dynamicPerformanceController;
        dpc.updateContext('purattokun', { position: { x: 150, y: 200 }, currentAnimation: 'idle', consecutiveClicks: 0, interactionIntensity: 0.0 });
        dpc.updateContext('nezumi', { position: { x: 250, y: 180 }, currentAnimation: 'idle', consecutiveClicks: 0, interactionIntensity: 0.0 });
    } catch (error) { console.error('❌ 実験環境初期化エラー:', error); }
};
document.addEventListener('DOMContentLoaded', () => {
    if (document.title.includes('タイムライン制御システム')) {
        console.log('🎬 タイムライン実験環境での動的演出システム初期化');
        setTimeout(() => window.initializeDynamicPerformanceForExperiment?.(), 1500);
    }
});

// グローバル登録
window.DynamicPerformanceController = DynamicPerformanceController;
window.PerformanceConditionEvaluator = PerformanceConditionEvaluator;

console.log('✅ Dynamic Performance Control System 読み込み完了');
