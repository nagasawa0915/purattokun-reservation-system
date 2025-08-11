// 📦 Bake Output System - ベイク出力システム
// 目的: 2つのSpineアニメーション結合・ブレンド処理・軽量JavaScript出力
// 機能: タイムライン → 統合アニメーション → 軽量再生パッケージ
// 制約: 500行制限・お客様納品用軽量化・複雑性回避

console.log('📦 Bake Output System 読み込み開始');

/**
 * 🏭 ベイク出力システム
 * タイムライン編集結果を軽量な再生パッケージに変換
 */
class BakeOutputSystem {
    constructor() {
        this.version = '1.0.0';
        this.name = 'Bake Output System';
        this.isInitialized = false;
        
        // 🎬 ベイクプロジェクト管理
        this.currentProject = null;
        this.bakeQueue = [];
        this.outputCache = new Map();
        
        // 📊 ベイク設定
        this.bakeSettings = {
            frameRate: 60,           // 出力フレームレート
            quality: 'high',         // high, medium, low
            optimization: true,      // 軽量化最適化
            includeEffects: true,    // エフェクト含む
            compressionLevel: 0.8    // 圧縮レベル
        };
        
        // 🔧 ブレンド処理設定
        this.blendSettings = {
            defaultTransitionTime: 300,  // ms
            blendMode: 'linear',         // linear, smooth, sharp
            overlapHandling: 'crossfade' // crossfade, cut, overlay
        };
        
        // 📤 出力形式設定
        this.outputFormats = {
            javascript: true,        // 軽量JavaScript出力
            json: false,            // JSONデータ出力
            css: false,             // CSS Animations出力
            webm: false             // 動画出力（将来拡張）
        };
        
        console.log('✅ Bake Output System 構築完了');
    }
    
    /**
     * 🚀 ベイクシステム初期化
     */
    async initialize(timelineEngine, spineIntegration) {
        if (this.isInitialized) {
            console.warn('⚠️ Bake Output System 既に初期化済み');
            return;
        }
        
        try {
            this.timelineEngine = timelineEngine;
            this.spineIntegration = spineIntegration;
            
            // 依存システム検証
            if (!this.timelineEngine || !this.spineIntegration) {
                throw new Error('必要なシステムが不足しています');
            }
            
            // ベイク処理パイプライン設定
            this.setupBakePipeline();
            
            // イベントハンドラー登録
            this.setupBakeEvents();
            
            this.isInitialized = true;
            console.log('✅ Bake Output System 初期化完了');
            
        } catch (error) {
            console.error('❌ Bake Output System 初期化失敗:', error);
            throw error;
        }
    }
    
    /**
     * 🏭 ベイク処理パイプライン設定
     */
    setupBakePipeline() {
        // ベイク処理ステップ定義
        this.bakePipeline = [
            { name: 'データ収集', handler: this.collectTimelineData },
            { name: 'クリップ解析', handler: this.analyzeClips },
            { name: 'ブレンド計算', handler: this.calculateBlends },
            { name: 'キーフレーム生成', handler: this.generateKeyframes },
            { name: '最適化処理', handler: this.optimizeOutput },
            { name: 'パッケージ生成', handler: this.generatePackage }
        ];
        
        console.log('🏭 ベイク処理パイプライン設定完了');
    }
    
    /**
     * 🎬 プロジェクトベイク開始
     */
    async startBake(projectName = 'timeline-project') {
        if (!this.isInitialized) {
            throw new Error('Bake Output System が初期化されていません');
        }
        
        console.log(`🎬 ベイク処理開始: ${projectName}`);
        
        try {
            // プロジェクト初期化
            this.currentProject = {
                name: projectName,
                startTime: Date.now(),
                timeline: null,
                clips: [],
                keyframes: [],
                output: null,
                status: 'processing'
            };
            
            // パイプライン実行
            for (let i = 0; i < this.bakePipeline.length; i++) {
                const step = this.bakePipeline[i];
                console.log(`🔄 ${i + 1}/${this.bakePipeline.length}: ${step.name}`);
                
                await step.handler.call(this, this.currentProject);
                
                // 進捗イベント発火
                this.dispatchBakeEvent('bakeProgress', {
                    step: i + 1,
                    total: this.bakePipeline.length,
                    stepName: step.name,
                    project: projectName
                });
            }
            
            // ベイク完了
            this.currentProject.status = 'completed';
            this.currentProject.endTime = Date.now();
            this.currentProject.duration = this.currentProject.endTime - this.currentProject.startTime;
            
            console.log(`✅ ベイク処理完了: ${projectName} (${this.currentProject.duration}ms)`);
            
            this.dispatchBakeEvent('bakeCompleted', {
                project: this.currentProject,
                output: this.currentProject.output
            });
            
            return this.currentProject;
            
        } catch (error) {
            console.error(`❌ ベイク処理失敗: ${projectName}`, error);
            
            if (this.currentProject) {
                this.currentProject.status = 'failed';
                this.currentProject.error = error.message;
            }
            
            this.dispatchBakeEvent('bakeFailed', {
                project: projectName,
                error: error.message
            });
            
            throw error;
        }
    }
    
    /**
     * 📊 Step 1: タイムラインデータ収集
     */
    async collectTimelineData(project) {
        if (!this.timelineEngine) {
            throw new Error('Timeline Engine が利用できません');
        }
        
        // タイムライン基本情報取得
        const timelineState = this.timelineEngine.getEngineState();
        project.timeline = {
            duration: timelineState.timeline.duration,
            frameRate: this.bakeSettings.frameRate,
            tracks: Array.from(this.timelineEngine.tracks.values()),
            totalClips: timelineState.clips
        };
        
        console.log('📊 タイムラインデータ収集完了:', {
            duration: project.timeline.duration,
            tracks: project.timeline.tracks.length,
            clips: project.timeline.totalClips
        });
    }
    
    /**
     * 🔍 Step 2: クリップ解析
     */
    async analyzeClips(project) {
        project.clips = [];
        
        // 全クリップを解析
        this.timelineEngine.clips.forEach((clip, clipId) => {
            const analyzedClip = {
                id: clipId,
                trackId: clip.trackId,
                characterId: clip.characterId,
                animationName: clip.animationName,
                startTime: clip.startTime,
                endTime: clip.endTime,
                duration: clip.duration,
                properties: { ...clip.properties },
                blendIn: clip.blendInDuration,
                blendOut: clip.blendOutDuration,
                
                // 解析結果
                hasOverlap: false,
                overlappingClips: [],
                blendPoints: []
            };
            
            // 重複クリップ検出
            this.detectClipOverlaps(analyzedClip);
            
            project.clips.push(analyzedClip);
        });
        
        console.log(`🔍 ${project.clips.length} クリップ解析完了`);
    }
    
    /**
     * 🔄 Step 3: ブレンド計算
     */
    async calculateBlends(project) {
        // 重複するクリップ間のブレンド処理計算
        project.clips.forEach(clip => {
            if (clip.hasOverlap) {
                clip.overlappingClips.forEach(overlapClip => {
                    const blendRegion = this.calculateBlendRegion(clip, overlapClip);
                    clip.blendPoints.push(blendRegion);
                });
            }
        });
        
        console.log('🔄 ブレンド計算完了');
    }
    
    /**
     * ⚡ Step 4: キーフレーム生成
     */
    async generateKeyframes(project) {
        const frameInterval = 1000 / this.bakeSettings.frameRate;
        const totalFrames = Math.ceil(project.timeline.duration / frameInterval);
        
        project.keyframes = [];
        
        for (let frame = 0; frame < totalFrames; frame++) {
            const timeMs = frame * frameInterval;
            
            const keyframe = {
                frame: frame,
                time: timeMs,
                characters: {}
            };
            
            // この時点でアクティブなクリップを検索
            const activeClips = project.clips.filter(clip => 
                timeMs >= clip.startTime && timeMs < clip.endTime
            );
            
            // 各キャラクターの状態を計算
            activeClips.forEach(clip => {
                if (!keyframe.characters[clip.characterId]) {
                    keyframe.characters[clip.characterId] = {
                        animation: clip.animationName,
                        properties: { ...clip.properties },
                        blendWeight: 1.0
                    };
                } else {
                    // ブレンド処理
                    keyframe.characters[clip.characterId] = 
                        this.blendCharacterStates(keyframe.characters[clip.characterId], {
                            animation: clip.animationName,
                            properties: { ...clip.properties },
                            blendWeight: 1.0
                        });
                }
            });
            
            project.keyframes.push(keyframe);
        }
        
        console.log(`⚡ ${project.keyframes.length} キーフレーム生成完了`);
    }
    
    /**
     * 🚀 Step 5: 最適化処理
     */
    async optimizeOutput(project) {
        if (!this.bakeSettings.optimization) {
            console.log('🚀 最適化をスキップ');
            return;
        }
        
        // 重複フレーム除去
        const optimizedKeyframes = [];
        let lastKeyframe = null;
        
        project.keyframes.forEach(keyframe => {
            if (!lastKeyframe || this.isKeyframeDifferent(keyframe, lastKeyframe)) {
                optimizedKeyframes.push(keyframe);
                lastKeyframe = keyframe;
            }
        });
        
        const reduction = project.keyframes.length - optimizedKeyframes.length;
        project.keyframes = optimizedKeyframes;
        
        console.log(`🚀 最適化完了: ${reduction} フレーム削減`);
    }
    
    /**
     * 📦 Step 6: パッケージ生成
     */
    async generatePackage(project) {
        const packageData = {
            metadata: {
                name: project.name,
                version: this.version,
                generated: new Date().toISOString(),
                duration: project.timeline.duration,
                frameRate: this.bakeSettings.frameRate,
                totalFrames: project.keyframes.length
            },
            timeline: project.timeline,
            keyframes: project.keyframes,
            settings: {
                bake: { ...this.bakeSettings },
                blend: { ...this.blendSettings }
            }
        };
        
        // JavaScript形式出力
        if (this.outputFormats.javascript) {
            project.output = this.generateJavaScriptOutput(packageData);
        }
        
        // 出力キャッシュに保存
        this.outputCache.set(project.name, project.output);
        
        console.log('📦 パッケージ生成完了');
    }
    
    /**
     * 📄 JavaScript出力生成
     */
    generateJavaScriptOutput(packageData) {
        const jsCode = `
// 🎬 Timeline Studio ベイク出力
// Generated: ${packageData.metadata.generated}
// Project: ${packageData.metadata.name}

class TimelineBakedPlayer {
    constructor() {
        this.metadata = ${JSON.stringify(packageData.metadata, null, 2)};
        this.keyframes = ${JSON.stringify(packageData.keyframes, null, 2)};
        this.currentFrame = 0;
        this.isPlaying = false;
        this.startTime = 0;
    }
    
    play() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.startTime = performance.now();
        this.playLoop();
    }
    
    playLoop() {
        if (!this.isPlaying) return;
        
        const elapsed = performance.now() - this.startTime;
        const targetFrame = Math.floor(elapsed * this.metadata.frameRate / 1000);
        
        if (targetFrame < this.keyframes.length) {
            this.applyKeyframe(this.keyframes[targetFrame]);
            requestAnimationFrame(() => this.playLoop());
        } else {
            this.isPlaying = false;
            console.log('🎬 再生完了');
        }
    }
    
    applyKeyframe(keyframe) {
        Object.keys(keyframe.characters).forEach(characterId => {
            const characterState = keyframe.characters[characterId];
            
            // Spine統合API経由でキャラクター制御
            if (window.spineIntegration && window.spineIntegration.characterControl) {
                const control = window.spineIntegration.characterControl;
                
                // アニメーション適用
                control.playAnimation(characterId, characterState.animation);
                
                // プロパティ適用
                if (characterState.properties) {
                    const props = characterState.properties;
                    if (props.x !== undefined || props.y !== undefined) {
                        control.setPosition(characterId, props.x || 0, props.y || 0);
                    }
                    if (props.scaleX !== undefined || props.scaleY !== undefined) {
                        control.setScale(characterId, props.scaleX || 1, props.scaleY || 1);
                    }
                    if (props.alpha !== undefined) {
                        control.setAlpha(characterId, props.alpha);
                    }
                }
            }
        });
    }
}

// インスタンス作成・グローバル登録
window.timelineBakedPlayer = new TimelineBakedPlayer();
console.log('🎬 Timeline Baked Player 準備完了');
`;
        
        return {
            format: 'javascript',
            code: jsCode,
            size: jsCode.length,
            compressed: this.bakeSettings.optimization
        };
    }
    
    /**
     * 🔍 クリップ重複検出
     */
    detectClipOverlaps(clip) {
        // 他のクリップとの時間的重複をチェック
        this.timelineEngine.clips.forEach((otherClip, otherClipId) => {
            if (otherClip.id !== clip.id && 
                otherClip.trackId === clip.trackId &&
                this.isTimeOverlapping(clip, otherClip)) {
                
                clip.hasOverlap = true;
                clip.overlappingClips.push(otherClip);
            }
        });
    }
    
    /**
     * ⏰ 時間重複判定
     */
    isTimeOverlapping(clip1, clip2) {
        return !(clip1.endTime <= clip2.startTime || clip2.endTime <= clip1.startTime);
    }
    
    /**
     * 🔄 ブレンド領域計算
     */
    calculateBlendRegion(clip1, clip2) {
        const overlapStart = Math.max(clip1.startTime, clip2.startTime);
        const overlapEnd = Math.min(clip1.endTime, clip2.endTime);
        
        return {
            startTime: overlapStart,
            endTime: overlapEnd,
            duration: overlapEnd - overlapStart,
            clip1Weight: 0.5,  // 基本的な50/50ブレンド
            clip2Weight: 0.5,
            blendMode: this.blendSettings.blendMode
        };
    }
    
    /**
     * 🎭 キャラクター状態ブレンド
     */
    blendCharacterStates(state1, state2) {
        // 簡単なブレンド処理（将来詳細実装予定）
        return {
            animation: state2.animation,  // 後のアニメーションを優先
            properties: { ...state1.properties, ...state2.properties },
            blendWeight: (state1.blendWeight + state2.blendWeight) / 2
        };
    }
    
    /**
     * ⚡ キーフレーム差異判定
     */
    isKeyframeDifferent(keyframe1, keyframe2) {
        return JSON.stringify(keyframe1.characters) !== JSON.stringify(keyframe2.characters);
    }
    
    /**
     * 📡 ベイクイベント発火
     */
    dispatchBakeEvent(eventType, data = {}) {
        const event = new CustomEvent(`bakeSystem:${eventType}`, {
            detail: {
                system: this.name,
                timestamp: Date.now(),
                ...data
            }
        });
        
        window.dispatchEvent(event);
    }
    
    /**
     * 🎯 ベイクイベントハンドラー設定
     */
    setupBakeEvents() {
        // Theater Studio からのベイク要求監視
        window.addEventListener('theaterStudio:requestBake', (e) => {
            const { projectName } = e.detail;
            this.startBake(projectName || 'theater-project');
        });
        
        console.log('🎯 ベイクイベントハンドラー設定完了');
    }
    
    /**
     * 📊 ベイクシステム状態取得
     */
    getBakeState() {
        return {
            version: this.version,
            initialized: this.isInitialized,
            currentProject: this.currentProject ? {
                name: this.currentProject.name,
                status: this.currentProject.status
            } : null,
            queueLength: this.bakeQueue.length,
            outputCacheSize: this.outputCache.size,
            settings: {
                bake: { ...this.bakeSettings },
                blend: { ...this.blendSettings },
                formats: { ...this.outputFormats }
            }
        };
    }
}

// ========== グローバル登録 ========== //

window.BakeOutputSystem = BakeOutputSystem;

// Timeline Studio 統合用インスタンス
window.bakeSystem = new BakeOutputSystem();

console.log('📦 Bake Output System 準備完了');
console.log('✅ window.bakeSystem でベイクシステムアクセス可能');