/**
 * 🎭 Timeline Sync Experiments UI
 * 同期システム実験環境・テストUI・統合システム
 * 
 * 【技術仕様】
 * - ファイルサイズ: 200行以内
 * - 機能: 実験UI・テスト関数・timeline-experiment.html統合
 * - 依存: timeline-sync-core.js + timeline-sync-patterns.js
 */

console.log('🎭 Timeline Sync Experiments UI 読み込み開始');

// ========== 実験環境統合システム ========== //

/**
 * timeline-experiment.html統合機能
 * 同期制御テスト機能をUIに追加
 */
function setupSyncExperiments() {
    console.log('🎭 同期実験環境セットアップ開始');
    
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
    if (window.timelineSyncCore && window.TimelineSyncPatterns) {
        const patterns = new window.TimelineSyncPatterns(window.timelineSyncCore);
        patterns.setupReactionSync('purattokun', 'nezumi', {
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
        
        window.timelineSyncCore.synchronizeFromBoundingBoxEvent(testEvent);
        console.log('🎭 反応同期テスト開始');
    } else {
        console.log('❌ timelineSyncCore または TimelineSyncPatterns が初期化されていません');
    }
}

function testCoordinatedPerformance() {
    if (window.timelineSyncCore && window.TimelineSyncPatterns) {
        const patterns = new window.TimelineSyncPatterns(window.timelineSyncCore);
        const performanceScript = {
            duration: 5.0,
            sequence: ['appear', 'dance', 'bow']
        };
        
        patterns.setupCoordinatedPerformance(['purattokun', 'nezumi'], performanceScript);
        
        // テスト実行
        const testSequence = {
            sequence: ['dance', 'jump', 'bow'],
            duration: 3.0,
            syncType: 'coordinated'
        };
        
        const group = Array.from(window.timelineSyncCore.syncGroups.values())[0];
        if (group) {
            window.timelineSyncCore.executeSynchronizedSequence(group, testSequence);
        }
        
        console.log('🎭 連携演出テスト開始');
    }
}

function testFollowSystem() {
    if (window.timelineSyncCore && window.TimelineSyncPatterns) {
        const patterns = new window.TimelineSyncPatterns(window.timelineSyncCore);
        patterns.setupFollowSystem('purattokun', ['nezumi'], 'animation');
        
        console.log('🎭 追従システムテスト開始');
    }
}

function testBoundingBoxSync() {
    if (window.timelineSyncCore) {
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
        
        window.timelineSyncCore.synchronizeFromBoundingBoxEvent(mockEvent);
        console.log('🎭 境界ボックス同期テスト開始');
    }
}

function clearAllSyncGroups() {
    if (window.timelineSyncCore) {
        const groupIds = Array.from(window.timelineSyncCore.syncGroups.keys());
        groupIds.forEach(id => {
            window.timelineSyncCore.removeSyncGroup(id);
        });
        console.log('🗑️ 全同期グループクリア完了');
    }
}

function debugSyncStatus() {
    if (window.timelineSyncCore) {
        const status = window.timelineSyncCore.getSystemStatus();
        console.log('🎭 同期システム状態:', status);
        
        console.log('📋 同期グループ詳細:');
        window.timelineSyncCore.syncGroups.forEach((group, id) => {
            console.log(`  ${id}:`, {
                type: group.syncType,
                characters: group.characterIds,
                active: group.isActive
            });
        });
    }
}

// ========== 高度テスト機能 ========== //

function testComplexChain() {
    if (window.timelineSyncCore && window.TimelineSyncPatterns) {
        const patterns = new window.TimelineSyncPatterns(window.timelineSyncCore);
        
        const chainDefinition = {
            name: 'sample_complex_chain',
            steps: [
                {
                    characterId: 'purattokun',
                    animation: 'wave',
                    delay: 0,
                    condition: () => true,
                    triggers: [
                        {
                            type: 'animation',
                            characterId: 'nezumi',
                            animation: 'surprised',
                            delay: 500
                        }
                    ]
                },
                {
                    characterId: 'nezumi',
                    animation: 'wave_back',
                    delay: 1000
                }
            ]
        };
        
        patterns.executeComplexChain(['purattokun', 'nezumi'], chainDefinition);
        console.log('🎭 複雑演出チェーンテスト開始');
    }
}

function analyzeSyncPerformance() {
    if (window.timelineSyncCore && window.TimelineSyncPatterns) {
        const patterns = new window.TimelineSyncPatterns(window.timelineSyncCore);
        return patterns.analyzeSyncPerformance();
    }
    return null;
}

// ========== グローバル初期化・統合システム ========== //

/**
 * 実験環境初期化関数
 * timeline-experiment.htmlから呼び出される
 */
window.initializeCharacterSyncForExperiment = function() {
    console.log('🎭 実験環境用キャラクター同期システム初期化');
    
    try {
        // キャラクターマップ作成
        const characters = new Map();
        
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
        window.timelineSyncCore = new window.TimelineSyncCore(timelineEngine, characters);
        
        // UI追加
        setupSyncExperiments();
        
        // フレーム更新開始
        const updateLoop = (timestamp) => {
            window.timelineSyncCore.updateFrame(timestamp);
            requestAnimationFrame(updateLoop);
        };
        requestAnimationFrame(updateLoop);
        
        console.log('✅ 実験環境用キャラクター同期システム初期化完了');
        
    } catch (error) {
        console.error('❌ 実験環境初期化エラー:', error);
    }
};

// ========== 自動初期化 ========== //

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

// ========== グローバル関数登録 ========== //

// テスト関数をグローバルに公開
window.testReactionSync = testReactionSync;
window.testCoordinatedPerformance = testCoordinatedPerformance;
window.testFollowSystem = testFollowSystem;
window.testBoundingBoxSync = testBoundingBoxSync;
window.clearAllSyncGroups = clearAllSyncGroups;
window.debugSyncStatus = debugSyncStatus;
window.testComplexChain = testComplexChain;
window.analyzeSyncPerformance = analyzeSyncPerformance;

console.log('✅ Timeline Sync Experiments UI 読み込み完了');