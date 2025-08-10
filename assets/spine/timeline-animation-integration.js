// 🎭 タイムライン制御システム - アニメーション統合モジュール
// 役割: Spineアニメーション統合・キャラクター連携・統一座標システム適用
// 依存: timeline-control-core.js
// 制約: 200行以内

console.log('🎭 Timeline Animation Integration モジュール読み込み開始');

// ========== アニメーション統合システム ========== //

/**
 * タイムラインアニメーション統合クラス
 * コア制御エンジンとSpineアニメーションシステムの橋渡し
 */
class TimelineAnimationIntegration {
    constructor() {
        this.version = '1.0';
        this.initialized = false;
        
        console.log('✅ Timeline Animation Integration 構築完了');
    }
    
    /**
     * キーフレーム実行（Core制御エンジンから呼び出し）
     */
    static executeKeyframe(characterId, keyframe, timelineEngine) {
        try {
            // 統一座標システム適用
            if (keyframe.x !== undefined || keyframe.y !== undefined) {
                TimelineAnimationIntegration.applyPositionKeyframe(characterId, keyframe, timelineEngine);
            }
            
            // アニメーション実行
            if (keyframe.animation) {
                TimelineAnimationIntegration.applyAnimationKeyframe(characterId, keyframe, timelineEngine);
            }
            
            // スケール適用
            if (keyframe.scale) {
                TimelineAnimationIntegration.applyScaleKeyframe(characterId, keyframe, timelineEngine);
            }
            
        } catch (error) {
            console.error('❌ キーフレーム実行エラー:', error);
            
            if (timelineEngine.errorHandler) {
                timelineEngine.errorHandler.handleIntegrationError(error, 'keyframe-execution');
            }
        }
    }
    
    /**
     * 位置キーフレーム適用（統一座標システム準拠）
     */
    static applyPositionKeyframe(characterId, keyframe, timelineEngine) {
        if (!timelineEngine.coordinateSystem) {
            console.warn('⚠️ 統一座標システム未初期化');
            return;
        }
        
        const character = TimelineAnimationIntegration.getCharacter(characterId, timelineEngine);
        if (!character || !character.canvas) {
            console.warn(`⚠️ キャラクター未発見: ${characterId}`);
            return;
        }
        
        // Layer 1: CSS位置制御
        const cssCoords = {
            x: keyframe.x,
            y: keyframe.y,
            scale: keyframe.scale
        };
        
        const cssPositions = timelineEngine.coordinateSystem.convertToCSS(cssCoords);
        
        character.canvas.style.left = cssPositions.left;
        character.canvas.style.top = cssPositions.top;
        
        if (cssPositions.transform) {
            character.canvas.style.transform = cssPositions.transform;
        }
        
        console.log(`📍 位置更新: ${characterId} -> (${keyframe.x}%, ${keyframe.y}%)`);
    }
    
    /**
     * アニメーションキーフレーム適用
     */
    static applyAnimationKeyframe(characterId, keyframe, timelineEngine) {
        const character = TimelineAnimationIntegration.getCharacter(characterId, timelineEngine);
        
        if (!character || !character.animationState) {
            console.warn(`⚠️ キャラクターアニメーション未対応: ${characterId}`);
            return;
        }
        
        try {
            character.animationState.setAnimation(0, keyframe.animation, keyframe.loop || false);
            console.log(`🎭 アニメーション実行: ${characterId} - ${keyframe.animation}`);
            
        } catch (error) {
            console.error(`❌ アニメーション実行エラー (${characterId}):`, error);
        }
    }
    
    /**
     * スケールキーフレーム適用
     */
    static applyScaleKeyframe(characterId, keyframe, timelineEngine) {
        const character = TimelineAnimationIntegration.getCharacter(characterId, timelineEngine);
        
        if (!character) {
            return;
        }
        
        // Layer 2: Spine座標制御でのスケール適用
        if (character.skeleton) {
            character.skeleton.scaleX = keyframe.scale;
            character.skeleton.scaleY = keyframe.scale;
            console.log(`📏 スケール更新: ${characterId} -> ${keyframe.scale}`);
        }
    }
    
    /**
     * キャラクター取得（既存システム統合）
     */
    static getCharacter(characterId, timelineEngine) {
        if (timelineEngine.characterManager && timelineEngine.characterManager.characters) {
            return timelineEngine.characterManager.characters.get(characterId);
        }
        
        return null;
    }
    
    /**
     * キャラクター連携機能
     * 複数キャラクターの同期アニメーション制御
     */
    static executeCharacterGroup(characterIds, groupKeyframe, timelineEngine) {
        console.log(`👥 グループキーフレーム実行: ${characterIds.length}キャラクター`);
        
        characterIds.forEach(characterId => {
            // 個別キャラクター用キーフレーム作成
            const individualKeyframe = {
                ...groupKeyframe,
                // キャラクター固有のオフセット適用（あれば）
                x: groupKeyframe.x + (groupKeyframe.offsets?.[characterId]?.x || 0),
                y: groupKeyframe.y + (groupKeyframe.offsets?.[characterId]?.y || 0)
            };
            
            TimelineAnimationIntegration.executeKeyframe(characterId, individualKeyframe, timelineEngine);
        });
    }
    
    /**
     * スムーズアニメーション制御
     * 位置移動のイージング効果
     */
    static applySmoothTransition(characterId, fromKeyframe, toKeyframe, progress, timelineEngine) {
        const character = TimelineAnimationIntegration.getCharacter(characterId, timelineEngine);
        if (!character || !character.canvas) {
            return;
        }
        
        // イージング関数適用（ease-in-out）
        const easedProgress = TimelineAnimationIntegration.easeInOut(progress);
        
        // 補間計算
        const interpolatedKeyframe = {
            x: fromKeyframe.x + (toKeyframe.x - fromKeyframe.x) * easedProgress,
            y: fromKeyframe.y + (toKeyframe.y - fromKeyframe.y) * easedProgress,
            scale: fromKeyframe.scale + (toKeyframe.scale - fromKeyframe.scale) * easedProgress
        };
        
        TimelineAnimationIntegration.applyPositionKeyframe(characterId, interpolatedKeyframe, timelineEngine);
    }
    
    /**
     * イージング関数（ease-in-out）
     */
    static easeInOut(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
    
    /**
     * アニメーション状態管理
     */
    static getAnimationStatus(characterId, timelineEngine) {
        const character = TimelineAnimationIntegration.getCharacter(characterId, timelineEngine);
        
        if (!character || !character.animationState) {
            return null;
        }
        
        const currentTrack = character.animationState.tracks[0];
        if (!currentTrack || !currentTrack.animation) {
            return null;
        }
        
        return {
            characterId: characterId,
            currentAnimation: currentTrack.animation.name,
            isLooping: currentTrack.loop,
            trackTime: currentTrack.trackTime,
            animationTime: currentTrack.animationTime,
            isComplete: currentTrack.isComplete()
        };
    }
    
    /**
     * 複数キャラクター状態取得
     */
    static getAllAnimationStatus(timelineEngine) {
        if (!timelineEngine.characterManager || !timelineEngine.characterManager.characters) {
            return [];
        }
        
        const statusList = [];
        timelineEngine.characterManager.characters.forEach((character, characterId) => {
            const status = TimelineAnimationIntegration.getAnimationStatus(characterId, timelineEngine);
            if (status) {
                statusList.push(status);
            }
        });
        
        return statusList;
    }
    
    /**
     * アニメーション完了待機
     * 指定キャラクターのアニメーション完了を待機
     */
    static waitForAnimationComplete(characterId, timelineEngine, callback) {
        const checkComplete = () => {
            const status = TimelineAnimationIntegration.getAnimationStatus(characterId, timelineEngine);
            
            if (status && status.isComplete) {
                console.log(`✅ アニメーション完了: ${characterId} - ${status.currentAnimation}`);
                if (callback) callback(characterId, status);
                return;
            }
            
            // 完了していない場合は次フレームで再チェック
            requestAnimationFrame(checkComplete);
        };
        
        checkComplete();
    }
    
    /**
     * バッチアニメーション実行
     * 複数アニメーションの連続実行
     */
    static executeBatchAnimations(animationBatch, timelineEngine) {
        console.log(`🎬 バッチアニメーション開始: ${animationBatch.length}個`);
        
        let currentIndex = 0;
        
        const executeNext = () => {
            if (currentIndex >= animationBatch.length) {
                console.log('✅ バッチアニメーション全完了');
                return;
            }
            
            const batch = animationBatch[currentIndex];
            const { characterId, keyframe, waitForComplete = false } = batch;
            
            TimelineAnimationIntegration.executeKeyframe(characterId, keyframe, timelineEngine);
            
            if (waitForComplete) {
                TimelineAnimationIntegration.waitForAnimationComplete(characterId, timelineEngine, () => {
                    currentIndex++;
                    executeNext();
                });
            } else {
                currentIndex++;
                executeNext();
            }
        };
        
        executeNext();
    }
}

// グローバル公開
if (typeof window !== 'undefined') {
    window.TimelineAnimationIntegration = TimelineAnimationIntegration;
    console.log('✅ Timeline Animation Integration をグローバル公開');
}

console.log('✅ Timeline Animation Integration モジュール読み込み完了');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TimelineAnimationIntegration };
}