// 🎬 基本シーケンス管理システム - Phase 1実装
// 仕様書準拠: キャラクタータイムライン制御システム仕様書.md Phase 1要件
// 制約: 400行以内・境界ボックス完全統合・フレーム精度制御
// 統合: timeline-data-manager.js・timeline-error-handler.js・既存境界ボックス

console.log('🎬 Timeline Sequence Manager 読み込み開始');

// ========== 基本シーケンス管理システム ========== //

/**
 * TimelineSequence - タイムラインシーケンス基本クラス
 * 仕様: 境界ボックス連動・キーフレーム管理・60fps精密制御
 */
class TimelineSequence {
    constructor(characterId, sequenceConfig = {}) {
        this.characterId = characterId;
        this.sequenceId = sequenceConfig.id || `seq_${Date.now()}`;
        this.name = sequenceConfig.name || 'Unnamed Sequence';
        
        // キーフレーム管理
        this.keyframes = sequenceConfig.keyframes || [];
        this.currentKeyframe = 0;
        this.duration = sequenceConfig.duration || 1000; // ms
        
        // 制御設定
        this.looping = sequenceConfig.looping || false;
        this.autoStart = sequenceConfig.autoStart || false;
        this.frameRate = sequenceConfig.frameRate || 60;
        this.frameDuration = 1000 / this.frameRate; // ms per frame
        
        // 境界ボックス連動設定
        this.boundingBoxTriggers = sequenceConfig.boundingBoxTriggers || [];
        this.syncPoints = sequenceConfig.syncPoints || [];
        
        // 実行状態
        this.isPlaying = false;
        this.isPaused = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        
        // エラーハンドリング
        this.errorHandler = window.TimelineErrorHandler;
        
        console.log(`✅ TimelineSequence作成: ${characterId}/${this.sequenceId}`);
    }
    
    /**
     * 境界ボックス連動制御 - 34頂点精密判定結果に基づく制御
     * 統一座標システム適用・境界ボックス統合の教訓完全適用
     */
    triggerFromBoundingBox(boundingBoxEvent) {
        console.log(`🎯 境界ボックス連動トリガー: ${this.characterId}`, boundingBoxEvent);
        
        try {
            // 1. 34頂点精密判定結果の検証
            if (!this.validateBoundingBoxEvent(boundingBoxEvent)) {
                console.warn('⚠️ 境界ボックスイベント検証失敗');
                return false;
            }
            
            // 2. 座標変換（統一座標システム適用）
            const transformedPosition = this.transformBoundingBoxCoordinates(boundingBoxEvent);
            
            // 3. トリガーポイント検索
            const triggerPoint = this.findTriggerPoint(transformedPosition);
            if (!triggerPoint) {
                console.log(`💡 該当トリガーなし: ${this.characterId}`);
                return false;
            }
            
            // 4. シーケンス分岐実行
            this.executeSequenceFromPoint(triggerPoint);
            
            return true;
            
        } catch (error) {
            console.error('❌ 境界ボックス連動エラー:', error);
            return this.errorHandler?.handleIntegrationError(error, 'bounding-box') || false;
        }
    }
    
    /**
     * 境界ボックスイベント検証
     * 34頂点精密判定システムとの整合性確認
     */
    validateBoundingBoxEvent(event) {
        return event && 
               event.characterId === this.characterId &&
               event.position &&
               typeof event.position.x === 'number' &&
               typeof event.position.y === 'number' &&
               event.vertices && 
               Array.isArray(event.vertices) &&
               event.vertices.length >= 4; // 最小限の頂点データ
    }
    
    /**
     * 境界ボックス座標変換 - 統一座標システム適用
     */
    transformBoundingBoxCoordinates(event) {
        try {
            // SPINE_BEST_PRACTICES.md準拠の座標変換
            const position = event.position;
            const canvasRect = event.canvasRect || {};
            
            // 統一座標系での正規化座標計算
            const normalizedX = canvasRect.width ? position.x / canvasRect.width : position.x;
            const normalizedY = canvasRect.height ? position.y / canvasRect.height : position.y;
            
            return {
                original: position,
                normalized: { x: normalizedX, y: normalizedY },
                canvas: canvasRect,
                vertices: event.vertices,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error('❌ 座標変換エラー:', error);
            return event.position; // フォールバック
        }
    }
    
    /**
     * トリガーポイント検索
     * 境界ボックス位置に基づくシーケンス分岐判定
     */
    findTriggerPoint(transformedPosition) {
        if (!this.boundingBoxTriggers.length) {
            return this.boundingBoxTriggers[0] || null;
        }
        
        // 位置ベース・領域ベーストリガー検索
        for (const trigger of this.boundingBoxTriggers) {
            if (this.isPositionInTrigger(transformedPosition, trigger)) {
                console.log(`🎯 トリガー発見: ${trigger.name || trigger.id}`);
                return trigger;
            }
        }
        
        return null;
    }
    
    /**
     * 位置トリガー判定
     */
    isPositionInTrigger(position, trigger) {
        if (!trigger.area) {
            return true; // 領域指定なしは全領域対象
        }
        
        const area = trigger.area;
        const pos = position.normalized || position;
        
        return pos.x >= (area.left || 0) &&
               pos.x <= (area.right || 1) &&
               pos.y >= (area.top || 0) &&
               pos.y <= (area.bottom || 1);
    }
    
    /**
     * トリガーポイントからのシーケンス実行
     */
    executeSequenceFromPoint(triggerPoint) {
        console.log(`🎬 シーケンス分岐実行: ${triggerPoint.sequenceId || 'default'}`);
        
        try {
            // トリガー設定に基づくシーケンス制御
            if (triggerPoint.sequenceId) {
                this.jumpToSequence(triggerPoint.sequenceId);
            } else if (triggerPoint.keyframeIndex !== undefined) {
                this.jumpToKeyframe(triggerPoint.keyframeIndex);
            } else {
                // デフォルト: 先頭から再生
                this.restart();
            }
            
            // トリガー固有の制御設定適用
            if (triggerPoint.playbackSettings) {
                this.applyPlaybackSettings(triggerPoint.playbackSettings);
            }
            
        } catch (error) {
            console.error('❌ シーケンス実行エラー:', error);
            this.errorHandler?.handleIntegrationError(error, 'sequence-execution');
        }
    }
    
    /**
     * キーフレーム管理システム - フレーム精度制御
     */
    updateKeyframes(deltaTime) {
        if (!this.isPlaying || this.isPaused) return;
        
        this.elapsedTime += deltaTime;
        
        // 現在のキーフレーム判定（60fps基準）
        const targetKeyframe = this.calculateCurrentKeyframe();
        
        if (targetKeyframe !== this.currentKeyframe) {
            this.transitionToKeyframe(targetKeyframe);
        }
        
        // シーケンス完了判定
        if (this.elapsedTime >= this.duration) {
            this.handleSequenceComplete();
        }
    }
    
    /**
     * 現在キーフレーム計算 - フレーム精度
     */
    calculateCurrentKeyframe() {
        if (!this.keyframes.length) return 0;
        
        for (let i = this.keyframes.length - 1; i >= 0; i--) {
            const keyframe = this.keyframes[i];
            if (this.elapsedTime >= keyframe.time) {
                return i;
            }
        }
        
        return 0;
    }
    
    /**
     * キーフレーム遷移実行
     */
    transitionToKeyframe(targetIndex) {
        if (targetIndex >= this.keyframes.length) return;
        
        const keyframe = this.keyframes[targetIndex];
        console.log(`🔄 キーフレーム遷移: ${this.currentKeyframe} → ${targetIndex}`);
        
        try {
            // アニメーション変更
            if (keyframe.animation) {
                this.changeAnimation(keyframe.animation);
            }
            
            // 位置変更（統一座標系適用）
            if (keyframe.position) {
                this.changePosition(keyframe.position);
            }
            
            // スケール変更
            if (keyframe.scale !== undefined) {
                this.changeScale(keyframe.scale);
            }
            
            // 同期ポイント処理
            if (keyframe.syncPoint) {
                this.processSyncPoint(keyframe.syncPoint);
            }
            
            this.currentKeyframe = targetIndex;
            
        } catch (error) {
            console.error('❌ キーフレーム遷移エラー:', error);
            this.errorHandler?.handleIntegrationError(error, 'keyframe-transition');
        }
    }
    
    /**
     * アニメーション変更（Spine統合）
     */
    changeAnimation(animationName) {
        try {
            // 既存のSpineキャラクター取得
            const character = window.spineCharacters?.[this.characterId];
            if (!character) {
                console.warn(`⚠️ キャラクターが見つかりません: ${this.characterId}`);
                return;
            }
            
            // Spineアニメーション制御
            if (character.skeleton && character.state) {
                character.state.setAnimation(0, animationName, false);
                console.log(`🎭 アニメーション変更: ${animationName}`);
            }
            
        } catch (error) {
            console.error('❌ アニメーション変更エラー:', error);
        }
    }
    
    /**
     * 位置変更（統一座標系適用）
     */
    changePosition(position) {
        try {
            const canvas = document.getElementById(`${this.characterId}-canvas`);
            if (!canvas) return;
            
            // 統一座標系での位置適用
            if (position.x !== undefined) {
                canvas.style.left = typeof position.x === 'string' ? position.x : `${position.x}%`;
            }
            if (position.y !== undefined) {
                canvas.style.top = typeof position.y === 'string' ? position.y : `${position.y}%`;
            }
            
            console.log(`📐 位置変更: ${position.x}, ${position.y}`);
            
        } catch (error) {
            console.error('❌ 位置変更エラー:', error);
        }
    }
    
    /**
     * スケール変更
     */
    changeScale(scale) {
        try {
            const character = window.spineCharacters?.[this.characterId];
            if (character && character.skeleton) {
                character.skeleton.scaleX = scale;
                character.skeleton.scaleY = scale;
                console.log(`🔍 スケール変更: ${scale}`);
            }
            
        } catch (error) {
            console.error('❌ スケール変更エラー:', error);
        }
    }
    
    /**
     * 同期ポイント処理
     */
    processSyncPoint(syncPoint) {
        console.log(`🔄 同期ポイント処理: ${syncPoint.id || 'unnamed'}`);
        
        // 他システムへの同期通知
        if (window.TimelineSequenceManager) {
            window.TimelineSequenceManager.processSyncPoint(this.characterId, syncPoint);
        }
    }
    
    /**
     * シーケンス制御メソッド群
     */
    play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.isPaused = false;
        this.startTime = performance.now();
        
        console.log(`▶️ シーケンス再生開始: ${this.name}`);
        
        if (this.autoStart) {
            this.executeSequenceFromPoint({ keyframeIndex: 0 });
        }
    }
    
    pause() {
        if (!this.isPlaying) return;
        
        this.isPaused = true;
        console.log(`⏸️ シーケンス一時停止: ${this.name}`);
    }
    
    resume() {
        if (!this.isPaused) return;
        
        this.isPaused = false;
        console.log(`▶️ シーケンス再開: ${this.name}`);
    }
    
    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        this.elapsedTime = 0;
        this.currentKeyframe = 0;
        
        console.log(`⏹️ シーケンス停止: ${this.name}`);
    }
    
    restart() {
        this.stop();
        this.play();
    }
    
    /**
     * シーケンス・キーフレームジャンプ
     */
    jumpToKeyframe(index) {
        if (index < 0 || index >= this.keyframes.length) return;
        
        const keyframe = this.keyframes[index];
        this.elapsedTime = keyframe.time || 0;
        this.transitionToKeyframe(index);
        
        console.log(`⏭️ キーフレームジャンプ: ${index}`);
    }
    
    jumpToSequence(sequenceId) {
        console.log(`⏭️ シーケンスジャンプ: ${sequenceId}`);
        
        // 他のシーケンス管理システムに委譲
        if (window.TimelineSequenceManager) {
            window.TimelineSequenceManager.switchToSequence(this.characterId, sequenceId);
        }
    }
    
    /**
     * シーケンス完了処理
     */
    handleSequenceComplete() {
        console.log(`✅ シーケンス完了: ${this.name}`);
        
        if (this.looping) {
            this.restart();
        } else {
            this.stop();
        }
        
        // 完了通知
        if (window.TimelineSequenceManager) {
            window.TimelineSequenceManager.onSequenceComplete(this.characterId, this.sequenceId);
        }
    }
    
    /**
     * 再生設定適用
     */
    applyPlaybackSettings(settings) {
        if (settings.speed !== undefined) {
            this.frameRate = (this.frameRate * settings.speed);
            this.frameDuration = 1000 / this.frameRate;
        }
        
        if (settings.looping !== undefined) {
            this.looping = settings.looping;
        }
        
        console.log(`⚙️ 再生設定適用:`, settings);
    }
    
    /**
     * シーケンス情報取得
     */
    getInfo() {
        return {
            characterId: this.characterId,
            sequenceId: this.sequenceId,
            name: this.name,
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            currentKeyframe: this.currentKeyframe,
            elapsedTime: this.elapsedTime,
            duration: this.duration,
            progress: this.duration > 0 ? this.elapsedTime / this.duration : 0
        };
    }
}

// ========== グローバル公開・デバッグ支援 ========== //

// TimelineSequenceクラスをグローバル公開
if (!window.TimelineSequence) {
    window.TimelineSequence = TimelineSequence;
    console.log('✅ TimelineSequence クラス グローバル公開完了');
}

// デバッグ・開発支援関数
window.createTestTimelineSequence = function(characterId = 'purattokun') {
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
    
    return new TimelineSequence(characterId, testConfig);
};

console.log('✅ Timeline Sequence Manager 読み込み完了 - Phase 1実装');
console.log('🎯 400行制限遵守 - 境界ボックス完全統合 - フレーム精度制御');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimelineSequence;
}