// 🔧 タイムライン制御システム - デバッグ・開発支援モジュール
// 役割: デバッグ機能・テスト用関数・診断ツール・開発者向けユーティリティ
// 依存: timeline-control-core.js, timeline-animation-integration.js
// 制約: 150行以内

console.log('🔧 Timeline Debug Utilities モジュール読み込み開始');

// ========== デバッグ・開発支援システム ========== //

/**
 * タイムラインデバッグユーティリティ
 * 開発・テスト・診断機能の統合
 */
class TimelineDebugUtilities {
    constructor() {
        this.version = '1.0';
        this.debugMode = false;
        
        console.log('✅ Timeline Debug Utilities 構築完了');
    }
    
    /**
     * システム状態診断情報取得（詳細版）
     */
    static getDiagnosisInfo(timelineEngine) {
        if (!timelineEngine) {
            console.log('⚠️ Timeline Engine インスタンスが未提供');
            return null;
        }
        
        const status = timelineEngine.getSystemStatus();
        
        console.log('🔍 Timeline Control Engine 詳細診断情報:');
        console.log('========================================');
        console.log('📊 基本情報:');
        console.log('  - バージョン:', status.version);
        console.log('  - 初期化状態:', status.initialized ? '✅ 完了' : '❌ 未完了');
        console.log('  - 再生状態:', status.playing ? '▶️ 再生中' : '⏸️ 停止中');
        console.log('  - 現在時間:', status.currentTime.toFixed(2) + 'ms');
        console.log('  - フレームレート:', status.frameRate + 'fps');
        
        console.log('🎬 シーケンス情報:');
        console.log('  - アクティブシーケンス:', status.activeSequences + '/' + status.totalSequences);
        console.log('  - 総キーフレーム数:', status.totalKeyframes);
        
        console.log('🔗 統合状況:');
        Object.keys(status.integrationStatus).forEach(system => {
            const integrated = status.integrationStatus[system];
            console.log(`  - ${system}: ${integrated ? '✅ 統合済み' : '❌ 未統合'}`);
        });
        
        return status;
    }
    
    /**
     * シーケンス詳細情報表示
     */
    static listSequences(timelineEngine) {
        if (!timelineEngine || !timelineEngine.sequences) {
            console.log('⚠️ シーケンス情報取得不可');
            return;
        }
        
        console.log('🎬 登録済みシーケンス一覧:');
        console.log('========================================');
        
        if (timelineEngine.sequences.size === 0) {
            console.log('📝 登録済みシーケンスなし');
            return;
        }
        
        timelineEngine.sequences.forEach((sequence, sequenceId) => {
            console.log(`📹 ${sequence.name} (${sequenceId})`);
            console.log(`  - キャラクター: ${sequence.characterId}`);
            console.log(`  - 継続時間: ${sequence.duration}ms`);
            console.log(`  - キーフレーム数: ${sequence.keyframes.length}`);
            console.log(`  - ループ: ${sequence.looping ? 'Yes' : 'No'}`);
            console.log(`  - 状態: ${sequence.isActive ? '🔴 実行中' : '⚪ 待機中'}`);
            console.log(`  - 進行度: ${sequence.currentTime.toFixed(2)}ms / ${sequence.duration}ms`);
        });
    }
    
    /**
     * キーフレーム詳細情報表示
     */
    static listKeyframes(timelineEngine, sequenceId = null) {
        if (!timelineEngine || !timelineEngine.keyframes) {
            console.log('⚠️ キーフレーム情報取得不可');
            return;
        }
        
        console.log('⚡ キーフレーム一覧:');
        console.log('========================================');
        
        let filteredKeyframes = Array.from(timelineEngine.keyframes.entries());
        
        if (sequenceId) {
            filteredKeyframes = filteredKeyframes.filter(([id, keyframe]) => 
                keyframe.sequenceId === sequenceId
            );
            console.log(`🎯 フィルタ対象: ${sequenceId}`);
        }
        
        if (filteredKeyframes.length === 0) {
            console.log('📝 該当キーフレームなし');
            return;
        }
        
        filteredKeyframes.forEach(([keyframeId, keyframe]) => {
            console.log(`⚡ ${keyframeId}`);
            console.log(`  - 実行時間: ${keyframe.time}ms`);
            if (keyframe.x !== undefined || keyframe.y !== undefined) {
                console.log(`  - 位置: (${keyframe.x || 'null'}%, ${keyframe.y || 'null'}%)`);
            }
            if (keyframe.animation) {
                console.log(`  - アニメーション: ${keyframe.animation}`);
            }
            if (keyframe.scale) {
                console.log(`  - スケール: ${keyframe.scale}`);
            }
        });
    }
    
    /**
     * キャラクター状態診断
     */
    static diagnoseCharacterStates(timelineEngine) {
        console.log('🎭 キャラクター状態診断:');
        console.log('========================================');
        
        const animationStatus = window.TimelineAnimationIntegration ? 
            window.TimelineAnimationIntegration.getAllAnimationStatus(timelineEngine) : [];
        
        if (animationStatus.length === 0) {
            console.log('📝 キャラクター情報なし');
            return;
        }
        
        animationStatus.forEach(status => {
            console.log(`🎭 ${status.characterId}:`);
            console.log(`  - 現在アニメーション: ${status.currentAnimation}`);
            console.log(`  - ループ設定: ${status.isLooping ? 'Yes' : 'No'}`);
            console.log(`  - 再生時間: ${status.trackTime.toFixed(2)}s`);
            console.log(`  - 完了状態: ${status.isComplete ? '✅ 完了' : '🔄 再生中'}`);
        });
    }
    
    /**
     * テスト用シーケンス作成
     */
    static createTestSequence(timelineEngine, characterId = 'test-character') {
        if (!timelineEngine) {
            console.log('⚠️ Timeline Engine が未提供');
            return false;
        }
        
        const testSequence = {
            id: 'debug-test',
            name: 'デバッグテストシーケンス',
            duration: 5000, // 5秒
            looping: false,
            keyframes: [
                { time: 0, x: 20, y: 50, animation: 'taiki' },
                { time: 1000, x: 50, y: 50, animation: 'syutugen' },
                { time: 3000, x: 80, y: 30, scale: 0.8 },
                { time: 4000, animation: 'yarare' },
                { time: 5000, x: 20, y: 50, animation: 'taiki', scale: 1.0 }
            ]
        };
        
        const sequenceId = timelineEngine.addSequence(characterId, testSequence);
        
        console.log('🧪 テストシーケンス作成完了:');
        console.log(`  - シーケンスID: ${sequenceId}`);
        console.log('  - 実行方法: timelineEngine.executeSequence("' + sequenceId + '")');
        
        return sequenceId;
    }
    
    /**
     * パフォーマンス監視開始
     */
    static startPerformanceMonitor(timelineEngine, interval = 1000) {
        if (!timelineEngine) {
            console.log('⚠️ Timeline Engine が未提供');
            return;
        }
        
        console.log('📊 パフォーマンス監視開始 (1秒間隔)');
        
        const monitorId = setInterval(() => {
            const status = timelineEngine.getSystemStatus();
            const memoryUsage = performance.memory ? 
                (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB' : 'N/A';
            
            console.log(`📊 [${new Date().toLocaleTimeString()}] パフォーマンス状況:`);
            console.log(`  - アクティブシーケンス: ${status.activeSequences}/${status.totalSequences}`);
            console.log(`  - フレーム時間: ${status.currentTime.toFixed(2)}ms`);
            console.log(`  - メモリ使用量: ${memoryUsage}`);
            
        }, interval);
        
        // 停止関数をグローバルに設定
        window.stopTimelinePerformanceMonitor = () => {
            clearInterval(monitorId);
            console.log('📊 パフォーマンス監視停止');
            delete window.stopTimelinePerformanceMonitor;
        };
        
        console.log('📊 停止方法: stopTimelinePerformanceMonitor()');
        
        return monitorId;
    }
    
    /**
     * デバッグモード切り替え
     */
    static toggleDebugMode(enabled = null) {
        if (enabled !== null) {
            this.debugMode = enabled;
        } else {
            this.debugMode = !this.debugMode;
        }
        
        console.log(`🔧 デバッグモード: ${this.debugMode ? '🔴 有効' : '⚪ 無効'}`);
        
        if (this.debugMode) {
            console.log('📝 デバッグモード有効化 - 詳細ログ出力します');
        }
        
        return this.debugMode;
    }
}

// ========== グローバル公開・デバッグ支援関数 ========== //

// デバッグ・開発支援関数の公開
if (typeof window !== 'undefined') {
    window.TimelineDebugUtilities = TimelineDebugUtilities;
    
    // 便利関数エイリアス
    window.timelineDebug = (timelineEngine) => {
        return TimelineDebugUtilities.getDiagnosisInfo(timelineEngine || window.timelineEngine);
    };
    
    window.timelineSequences = (timelineEngine) => {
        return TimelineDebugUtilities.listSequences(timelineEngine || window.timelineEngine);
    };
    
    window.timelineKeyframes = (timelineEngine, sequenceId) => {
        return TimelineDebugUtilities.listKeyframes(timelineEngine || window.timelineEngine, sequenceId);
    };
    
    window.timelineCharacters = (timelineEngine) => {
        return TimelineDebugUtilities.diagnoseCharacterStates(timelineEngine || window.timelineEngine);
    };
    
    window.createTestSequence = (characterId) => {
        return TimelineDebugUtilities.createTestSequence(window.timelineEngine, characterId);
    };
    
    window.monitorTimeline = (interval) => {
        return TimelineDebugUtilities.startPerformanceMonitor(window.timelineEngine, interval);
    };
    
    console.log('✅ Timeline Debug Utilities をグローバル公開');
}

console.log('✅ Timeline Debug Utilities モジュール読み込み完了');
console.log('🎯 利用可能なデバッグ関数:');
console.log('  - timelineDebug() : システム状態診断');
console.log('  - timelineSequences() : シーケンス一覧');
console.log('  - timelineKeyframes() : キーフレーム一覧');
console.log('  - timelineCharacters() : キャラクター状態診断');
console.log('  - createTestSequence() : テストシーケンス作成');
console.log('  - monitorTimeline() : パフォーマンス監視開始');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TimelineDebugUtilities };
}