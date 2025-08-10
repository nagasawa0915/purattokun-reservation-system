// 🧪 Timeline Sequence テスト・デバッグ機能モジュール
// 分離理由: timeline-sequence-manager.js サイズ制限遵守（400行以内）
// 機能: テストシーケンス作成・デバッグ支援・開発用ユーティリティ

console.log('🧪 Timeline Sequence Tests 読み込み開始');

// ========== テストシーケンス作成 ========== //

/**
 * テストシーケンス作成関数
 * デバッグ・開発用の標準的なシーケンス構成を提供
 */
window.createTestTimelineSequence = function(characterId = 'purattokun') {
    if (!window.TimelineSequence) {
        console.error('❌ TimelineSequence クラスが見つかりません。timeline-sequence-manager.js を先に読み込んでください');
        return null;
    }
    
    const testConfig = {
        id: 'test_sequence',
        name: 'テストシーケンス',
        duration: 3000,
        looping: false,
        keyframes: [
            { time: 0, animation: 'syutugen', position: { x: 35, y: 75 } },
            { time: 1000, animation: 'taiki', position: { x: 35, y: 75 } },
            { time: 2000, animation: 'yarare', position: { x: 30, y: 75 } }
        ],
        boundingBoxTriggers: [
            {
                id: 'click_trigger',
                name: 'クリックトリガー',
                area: { left: 0, top: 0, right: 1, bottom: 1 },
                sequenceId: 'test_sequence',
                keyframeIndex: 2
            }
        ]
    };
    
    const sequence = new window.TimelineSequence(characterId, testConfig);
    console.log('✅ テストシーケンス作成完了:', sequence.getInfo());
    return sequence;
};

/**
 * 複数キャラクター用テストシーケンス作成
 */
window.createMultiCharacterTestSequences = function(characterIds = ['purattokun', 'nezumi']) {
    const sequences = {};
    
    characterIds.forEach(characterId => {
        sequences[characterId] = window.createTestTimelineSequence(characterId);
    });
    
    console.log(`✅ 複数キャラクターテストシーケンス作成完了: ${Object.keys(sequences).join(', ')}`);
    return sequences;
};

// ========== デバッグ支援機能 ========== //

/**
 * シーケンス情報表示
 */
window.debugTimelineSequence = function(sequence) {
    if (!sequence) {
        console.log('❌ 対象シーケンスがありません');
        return;
    }
    
    const info = sequence.getInfo();
    console.log('🔍 シーケンス詳細情報:', info);
    
    // キーフレーム詳細
    if (sequence.keyframes.length > 0) {
        console.log('📋 キーフレーム一覧:');
        sequence.keyframes.forEach((keyframe, index) => {
            console.log(`  [${index}] ${keyframe.time}ms: ${keyframe.animation || 'アニメーションなし'}`, keyframe);
        });
    }
    
    // 境界ボックストリガー詳細
    if (sequence.boundingBoxTriggers.length > 0) {
        console.log('🎯 境界ボックストリガー一覧:');
        sequence.boundingBoxTriggers.forEach((trigger, index) => {
            console.log(`  [${index}] ${trigger.name || trigger.id}`, trigger);
        });
    }
    
    return info;
};

/**
 * 全てのTimelineSequenceインスタンスをデバッグ表示
 */
window.debugAllTimelineSequences = function() {
    console.log('🔍 全TimelineSequence デバッグ情報');
    
    // グローバルに保存されているsequencesを探索
    if (window.timelineSequences) {
        Object.entries(window.timelineSequences).forEach(([key, sequence]) => {
            console.log(`\n--- ${key} ---`);
            window.debugTimelineSequence(sequence);
        });
    } else {
        console.log('⚠️ アクティブなTimelineSequenceが見つかりません');
    }
};

// ========== パフォーマンステスト ========== //

/**
 * シーケンス実行時間測定
 */
window.measureSequencePerformance = function(sequence, iterations = 10) {
    if (!sequence) {
        console.error('❌ 測定対象シーケンスがありません');
        return;
    }
    
    console.log(`⏱️ パフォーマンステスト開始: ${iterations}回実行`);
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
        sequence.restart();
        sequence.updateKeyframes(16.67); // 60fps相当
        sequence.stop();
    }
    
    const endTime = performance.now();
    const averageTime = (endTime - startTime) / iterations;
    
    console.log(`✅ パフォーマンステスト完了:`);
    console.log(`  - 総実行時間: ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`  - 平均実行時間: ${averageTime.toFixed(2)}ms`);
    console.log(`  - 60fps基準適合: ${averageTime < 16.67 ? '✅' : '❌'} (${averageTime < 16.67 ? '適合' : '不適合'})`);
    
    return {
        totalTime: endTime - startTime,
        averageTime: averageTime,
        iterations: iterations,
        sixtyFpsCompliant: averageTime < 16.67
    };
};

// ========== 統合テストシナリオ ========== //

/**
 * 境界ボックス連動テスト
 */
window.testBoundingBoxIntegration = function(characterId = 'purattokun') {
    console.log('🎯 境界ボックス連動テスト開始');
    
    const sequence = window.createTestTimelineSequence(characterId);
    if (!sequence) return;
    
    // テスト用境界ボックスイベント作成
    const testEvent = {
        characterId: characterId,
        position: { x: 0.5, y: 0.5 }, // 画面中央
        vertices: [
            { x: 0.4, y: 0.4 }, { x: 0.6, y: 0.4 },
            { x: 0.6, y: 0.6 }, { x: 0.4, y: 0.6 }
        ],
        canvasRect: { width: 800, height: 600 }
    };
    
    // 連動テスト実行
    const result = sequence.triggerFromBoundingBox(testEvent);
    
    console.log(`✅ 境界ボックス連動テスト結果: ${result ? '成功' : '失敗'}`);
    
    if (result) {
        console.log('🔍 シーケンス状態:', sequence.getInfo());
    }
    
    return result;
};

/**
 * フレーム精度テスト
 */
window.testFramePrecisionControl = function() {
    console.log('⚡ フレーム精度テスト開始');
    
    const sequence = window.createTestTimelineSequence();
    if (!sequence) return;
    
    sequence.play();
    
    // 16.67ms間隔での更新シミュレーション（60fps）
    const frameUpdates = [];
    let currentTime = 0;
    
    for (let frame = 0; frame < 180; frame++) { // 3秒間のテスト
        currentTime += 16.67;
        sequence.updateKeyframes(16.67);
        
        frameUpdates.push({
            frame: frame,
            time: currentTime,
            keyframe: sequence.currentKeyframe,
            elapsedTime: sequence.elapsedTime
        });
    }
    
    console.log('✅ フレーム精度テスト完了');
    console.log('📊 更新履歴サマリ:');
    console.log(`  - 総フレーム数: ${frameUpdates.length}`);
    console.log(`  - キーフレーム遷移回数: ${new Set(frameUpdates.map(f => f.keyframe)).size}`);
    console.log(`  - 最終キーフレーム: ${sequence.currentKeyframe}`);
    
    return frameUpdates;
};

console.log('✅ Timeline Sequence Tests 読み込み完了');
console.log('🧪 テスト機能: createTestTimelineSequence, debugTimelineSequence, testBoundingBoxIntegration');