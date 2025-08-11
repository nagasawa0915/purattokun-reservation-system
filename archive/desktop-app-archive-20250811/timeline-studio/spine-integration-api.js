// 🔄 Spine Integration API - 既存システム統合インターフェース
// 目的: spine-bounds-integration.js・座標システムとの統合
// 機能: Where（配置）+ When（タイムライン）の統合制御
// 制約: 500行制限・既存システム保護・依存関係最小化

console.log('🔄 Spine Integration API システム読み込み開始');

/**
 * 🎯 Spine統合APIマネージャー
 * 既存のSpineシステムとTimeline Studioの橋渡し
 */
class SpineIntegrationAPI {
    constructor() {
        this.version = '1.0.0';
        this.name = 'Spine Integration API';
        this.isInitialized = false;
        
        // 🎭 既存システム参照
        this.spineCharacters = null;        // 既存のspineCharacters
        this.boundsManager = null;          // indexBoundsManager
        this.positioningSystem = null;      // 配置システム
        
        // 🎬 Timeline統合データ
        this.timelineCharacters = new Map(); // タイムライン制御中キャラクター
        this.positionCache = new Map();      // 位置データキャッシュ
        this.animationCache = new Map();     // アニメーション状態キャッシュ
        
        // 📡 統合状態管理
        this.integrationStatus = {
            spineSystem: false,
            boundsSystem: false,
            positioningSystem: false,
            ready: false
        };
        
        console.log('✅ Spine Integration API 構築完了');
    }
    
    /**
     * 🚀 統合API初期化
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('⚠️ Spine Integration API 既に初期化済み');
            return this.integrationStatus;
        }
        
        try {
            console.log('🔄 既存Spineシステム統合開始');
            
            // 既存システム検出・統合
            await this.detectExistingSystems();
            
            // 統合状態検証
            this.validateIntegration();
            
            // タイムライン制御用API設定
            this.setupTimelineAPIs();
            
            // イベントハンドラー登録
            this.setupIntegrationEvents();
            
            this.isInitialized = true;
            console.log('✅ Spine Integration API 初期化完了');
            
            return this.integrationStatus;
            
        } catch (error) {
            console.error('❌ Spine Integration API 初期化失敗:', error);
            throw error;
        }
    }
    
    /**
     * 🔍 既存システム検出
     */
    async detectExistingSystems() {
        // 🔒 既存システム検出の安全化
        const maxRetries = 3;
        let retryCount = 0;
        
        // 1. Spine Characters システム検出（リトライ付き）
        while (retryCount < maxRetries && !this.spineCharacters) {
            if (typeof window.spineCharacters !== 'undefined' && window.spineCharacters) {
                this.spineCharacters = window.spineCharacters;
                this.integrationStatus.spineSystem = true;
                console.log('✅ Spine Characters システム統合');
                break;
            } else {
                retryCount++;
                if (retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        }
        
        if (!this.spineCharacters) {
            console.warn('⚠️ Spine Characters システム未検出 - Timeline Studio単体モードで動作');
        }
        
        // 2. Bounds Manager システム検出
        if (typeof window.indexBoundsManager !== 'undefined') {
            this.boundsManager = window.indexBoundsManager;
            this.integrationStatus.boundsSystem = true;
            console.log('✅ Bounds Manager システム統合');
        } else {
            console.warn('⚠️ Bounds Manager システム未検出');
        }
        
        // 3. Positioning System 検出
        if (typeof window.spinePositioningSystem !== 'undefined' || 
            typeof window.spinePositioningV2 !== 'undefined') {
            this.positioningSystem = window.spinePositioningV2 || window.spinePositioningSystem;
            this.integrationStatus.positioningSystem = true;
            console.log('✅ Positioning System 統合');
        } else {
            console.warn('⚠️ Positioning System 未検出');
        }
        
        // 🎯 統合準備完了判定（既存システムがなくても動作可能）
        this.integrationStatus.ready = true; // Timeline Studio単体でも動作
        
        // 🔒 フォールバック: 既存システムなしでも安全動作
        if (!this.integrationStatus.spineSystem) {
            console.log('🎭 Timeline Studio: スタンドアロンモードで動作中');
            this.setupMockCharacters();
        }
        
        console.log('📊 統合状況:', this.integrationStatus);
    }
    
    /**
     * ✅ 統合状態検証
     */
    validateIntegration() {
        const warnings = [];
        
        if (!this.integrationStatus.spineSystem) {
            warnings.push('Spine Characters システム未接続 - スタンドアロンモード');
        }
        
        if (warnings.length > 0) {
            console.info('ℹ️ 統合状況:', warnings);
        } else {
            console.log('✅ 統合検証完了 - 全システム接続済み');
        }
        
        return warnings;
    }
    
    /**
     * 🎭 モックキャラクターシステム（フォールバック用）
     */
    setupMockCharacters() {
        if (!this.spineCharacters) {
            this.spineCharacters = {
                'purattokun': {
                    skeleton: {
                        x: 0, y: 0,
                        scaleX: 1, scaleY: 1,
                        color: { a: 1 }
                    },
                    animationState: {
                        clearTracks: () => console.log('🎭 Mock: clearTracks'),
                        setAnimation: (track, name, loop) => {
                            console.log(`🎭 Mock: setAnimation(${track}, ${name}, ${loop})`);
                            return { animation: { name } };
                        }
                    },
                    animations: { 'idle': true, 'walk': true, 'jump': true }
                }
            };
            console.log('🎭 モックキャラクターシステム準備完了');
        }
    }
    
    /**
     * 🎬 タイムライン制御API設定
     */
    setupTimelineAPIs() {
        // キャラクター制御API
        this.characterControl = {
            // アニメーション制御
            playAnimation: (characterId, animationName, loop = false) => {
                return this.playCharacterAnimation(characterId, animationName, loop);
            },
            
            // 位置制御
            setPosition: (characterId, x, y) => {
                return this.setCharacterPosition(characterId, x, y);
            },
            
            // スケール制御
            setScale: (characterId, scaleX, scaleY = null) => {
                return this.setCharacterScale(characterId, scaleX, scaleY || scaleX);
            },
            
            // 透明度制御
            setAlpha: (characterId, alpha) => {
                return this.setCharacterAlpha(characterId, alpha);
            },
            
            // 状態取得
            getState: (characterId) => {
                return this.getCharacterState(characterId);
            }
        };
        
        // 座標変換API
        this.coordinateAPI = {
            // スクリーン座標 → Spine座標
            screenToSpine: (screenX, screenY, characterId) => {
                return this.convertScreenToSpine(screenX, screenY, characterId);
            },
            
            // Spine座標 → スクリーン座標
            spineToScreen: (spineX, spineY, characterId) => {
                return this.convertSpineToScreen(spineX, spineY, characterId);
            }
        };
        
        console.log('🎬 Timeline制御API設定完了');
    }
    
    /**
     * 🎭 キャラクターアニメーション制御
     */
    playCharacterAnimation(characterId, animationName, loop = false) {
        // 🔒 エラーループ防止: 1回のエラーログのみ
        const errorKey = `char_not_found_${characterId}`;
        
        if (!this.spineCharacters || !this.spineCharacters[characterId]) {
            if (!this.errorLogged) this.errorLogged = new Set();
            
            if (!this.errorLogged.has(errorKey)) {
                console.warn(`⚠️ Character ${characterId} not found (existing system integration required)`);
                this.errorLogged.add(errorKey);
            }
            return false;
        }
        
        const character = this.spineCharacters[characterId];
        
        try {
            if (character.skeleton && character.animationState) {
                // 既存アニメーション停止
                character.animationState.clearTracks();
                
                // 新しいアニメーション開始
                const trackEntry = character.animationState.setAnimation(0, animationName, loop);
                
                console.log(`🎭 Animation started: ${characterId} - ${animationName} (loop: ${loop})`);
                
                // アニメーション状態をキャッシュ
                this.animationCache.set(characterId, {
                    name: animationName,
                    loop: loop,
                    startTime: Date.now(),
                    trackEntry: trackEntry
                });
                
                return true;
            }
        } catch (error) {
            console.error(`❌ Animation playback failed: ${characterId} - ${animationName}`, error);
        }
        
        return false;
    }
    
    /**
     * 📐 キャラクター位置制御
     */
    setCharacterPosition(characterId, x, y) {
        // 🔒 エラーループ防止: 1回のエラーログのみ
        const errorKey = `char_not_found_${characterId}`;
        
        if (!this.spineCharacters || !this.spineCharacters[characterId]) {
            if (!this.errorLogged) this.errorLogged = new Set();
            
            if (!this.errorLogged.has(errorKey)) {
                console.warn(`⚠️ Character ${characterId} not found (existing system integration required)`);
                this.errorLogged.add(errorKey);
            }
            return false;
        }
        
        const character = this.spineCharacters[characterId];
        
        try {
            if (character.skeleton) {
                character.skeleton.x = x;
                character.skeleton.y = y;
                
                // 位置をキャッシュ
                this.positionCache.set(characterId, { x, y });
                
                console.log(`📐 Position updated: ${characterId} (${x}, ${y})`);
                return true;
            }
        } catch (error) {
            console.error(`❌ Position update failed: ${characterId}`, error);
        }
        
        return false;
    }
    
    /**
     * 🔍 キャラクター スケール制御
     */
    setCharacterScale(characterId, scaleX, scaleY) {
        // 🔒 エラーループ防止: 1回のエラーログのみ
        const errorKey = `char_not_found_${characterId}`;
        
        if (!this.spineCharacters || !this.spineCharacters[characterId]) {
            if (!this.errorLogged) this.errorLogged = new Set();
            
            if (!this.errorLogged.has(errorKey)) {
                console.warn(`⚠️ Character ${characterId} not found (existing system integration required)`);
                this.errorLogged.add(errorKey);
            }
            return false;
        }
        
        const character = this.spineCharacters[characterId];
        
        try {
            if (character.skeleton) {
                character.skeleton.scaleX = scaleX;
                character.skeleton.scaleY = scaleY;
                
                console.log(`🔍 Scale updated: ${characterId} (${scaleX}, ${scaleY})`);
                return true;
            }
        } catch (error) {
            console.error(`❌ Scale update failed: ${characterId}`, error);
        }
        
        return false;
    }
    
    /**
     * 👻 キャラクター透明度制御
     */
    setCharacterAlpha(characterId, alpha) {
        // 🔒 エラーループ防止: 1回のエラーログのみ
        const errorKey = `char_not_found_${characterId}`;
        
        if (!this.spineCharacters || !this.spineCharacters[characterId]) {
            if (!this.errorLogged) this.errorLogged = new Set();
            
            if (!this.errorLogged.has(errorKey)) {
                console.warn(`⚠️ Character ${characterId} not found (existing system integration required)`);
                this.errorLogged.add(errorKey);
            }
            return false;
        }
        
        const character = this.spineCharacters[characterId];
        
        try {
            if (character.skeleton) {
                character.skeleton.color.a = Math.max(0, Math.min(1, alpha));
                
                console.log(`👻 Alpha updated: ${characterId} (${alpha})`);
                return true;
            }
        } catch (error) {
            console.error(`❌ Alpha update failed: ${characterId}`, error);
        }
        
        return false;
    }
    
    /**
     * 📊 キャラクター状態取得
     */
    getCharacterState(characterId) {
        if (!this.spineCharacters || !this.spineCharacters[characterId]) {
            return null;
        }
        
        const character = this.spineCharacters[characterId];
        const cachedPosition = this.positionCache.get(characterId);
        const cachedAnimation = this.animationCache.get(characterId);
        
        if (character.skeleton) {
            return {
                position: {
                    x: character.skeleton.x,
                    y: character.skeleton.y
                },
                scale: {
                    x: character.skeleton.scaleX,
                    y: character.skeleton.scaleY
                },
                alpha: character.skeleton.color.a,
                currentAnimation: cachedAnimation ? cachedAnimation.name : 'unknown',
                isPlaying: character.animationState ? 
                           !character.animationState.tracks.length === 0 : false,
                cached: {
                    position: cachedPosition,
                    animation: cachedAnimation
                }
            };
        }
        
        return null;
    }
    
    /**
     * 🔄 座標変換: スクリーン → Spine
     */
    convertScreenToSpine(screenX, screenY, characterId) {
        // 既存の座標変換ロジックを活用
        if (this.boundsManager && typeof this.boundsManager.convertCoordinates === 'function') {
            return this.boundsManager.convertCoordinates(screenX, screenY, 'screen-to-spine');
        }
        
        // フォールバック: 基本的な座標変換
        const canvas = document.getElementById(`${characterId}-canvas`);
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: ((screenX - rect.left) / rect.width) * canvas.width - canvas.width / 2,
                y: ((screenY - rect.top) / rect.height) * canvas.height - canvas.height / 2
            };
        }
        
        return { x: screenX, y: screenY };
    }
    
    /**
     * 🔄 座標変換: Spine → スクリーン
     */
    convertSpineToScreen(spineX, spineY, characterId) {
        // 既存の座標変換ロジックを活用
        if (this.boundsManager && typeof this.boundsManager.convertCoordinates === 'function') {
            return this.boundsManager.convertCoordinates(spineX, spineY, 'spine-to-screen');
        }
        
        // フォールバック: 基本的な座標変換
        const canvas = document.getElementById(`${characterId}-canvas`);
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: rect.left + ((spineX + canvas.width / 2) / canvas.width) * rect.width,
                y: rect.top + ((spineY + canvas.height / 2) / canvas.height) * rect.height
            };
        }
        
        return { x: spineX, y: spineY };
    }
    
    /**
     * 🎯 統合イベントハンドラー設定
     */
    setupIntegrationEvents() {
        // Timeline Engine イベント監視
        window.addEventListener('timelineEngine:clipActivated', (e) => {
            this.handleClipActivation(e.detail);
        });
        
        window.addEventListener('timelineEngine:clipDeactivated', (e) => {
            this.handleClipDeactivation(e.detail);
        });
        
        window.addEventListener('timelineEngine:frameUpdate', (e) => {
            this.handleFrameUpdate(e.detail);
        });
        
        console.log('🎯 統合イベントハンドラー設定完了');
    }
    
    /**
     * 🎪 クリップアクティブ化処理
     */
    handleClipActivation(detail) {
        const { clip } = detail;
        
        if (clip.characterId && clip.animationName) {
            console.log(`🎪 Activating clip: ${clip.characterId} - ${clip.animationName}`);
            
            // アニメーション開始
            this.playCharacterAnimation(clip.characterId, clip.animationName, true);
            
            // プロパティ適用
            if (clip.properties) {
                if (clip.properties.x !== undefined || clip.properties.y !== undefined) {
                    this.setCharacterPosition(
                        clip.characterId, 
                        clip.properties.x || 0, 
                        clip.properties.y || 0
                    );
                }
                
                if (clip.properties.scaleX !== undefined || clip.properties.scaleY !== undefined) {
                    this.setCharacterScale(
                        clip.characterId,
                        clip.properties.scaleX || 1,
                        clip.properties.scaleY || clip.properties.scaleX || 1
                    );
                }
                
                if (clip.properties.alpha !== undefined) {
                    this.setCharacterAlpha(clip.characterId, clip.properties.alpha);
                }
            }
        }
    }
    
    /**
     * 🎪 クリップ非アクティブ化処理
     */
    handleClipDeactivation(detail) {
        const { clip } = detail;
        
        if (clip.characterId) {
            console.log(`🎪 Deactivating clip: ${clip.characterId}`);
            
            // 必要に応じてデフォルトアニメーションに戻す
            // this.playCharacterAnimation(clip.characterId, 'idle', true);
        }
    }
    
    /**
     * 🎬 フレーム更新処理
     */
    handleFrameUpdate(detail) {
        const { currentTime, activeClips } = detail;
        
        // アクティブクリップ中のブレンド処理
        // （この部分は将来のベイクシステムで詳細実装予定）
    }
    
    /**
     * 📋 利用可能なキャラクター一覧取得
     */
    getAvailableCharacters() {
        const characters = [];
        
        if (this.spineCharacters) {
            Object.keys(this.spineCharacters).forEach(characterId => {
                const character = this.spineCharacters[characterId];
                characters.push({
                    id: characterId,
                    name: characterId,
                    available: character && character.skeleton,
                    animations: character && character.animations ? 
                               Object.keys(character.animations) : [],
                    state: this.getCharacterState(characterId)
                });
            });
        }
        
        return characters;
    }
    
    /**
     * 📊 統合API状態取得
     */
    getIntegrationState() {
        return {
            version: this.version,
            initialized: this.isInitialized,
            status: this.integrationStatus,
            availableCharacters: this.getAvailableCharacters().length,
            cachedPositions: this.positionCache.size,
            cachedAnimations: this.animationCache.size
        };
    }
}

// ========== グローバル登録 ========== //

window.SpineIntegrationAPI = SpineIntegrationAPI;

// Timeline Studio 統合用インスタンス
window.spineIntegration = new SpineIntegrationAPI();

// 統合API便利関数
window.initSpineIntegration = async function() {
    try {
        const status = await window.spineIntegration.initialize();
        console.log('🔄 Spine Integration API 準備完了:', status);
        return status;
    } catch (error) {
        console.error('❌ Spine Integration API 初期化失敗:', error);
        return null;
    }
};

console.log('🔄 Spine Integration API システム準備完了');
console.log('✅ initSpineIntegration() で統合開始・window.spineIntegration でAPI利用');