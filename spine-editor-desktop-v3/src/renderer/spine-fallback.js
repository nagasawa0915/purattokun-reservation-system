// 🔄 Spine Editor Desktop v3.0 - Fallback System
// Spine WebGL読み込み失敗時のフォールバックシステム

console.log('🔄 Spine Fallback System 初期化');

// ========== フォールバック表示システム ========== //

class SpineFallbackManager {
    constructor() {
        this.fallbackCharacters = new Map();
        console.log('🔄 Spine Fallback Manager 初期化完了');
    }

    // フォールバックキャラクター作成
    createFallbackCharacter(characterData) {
        console.log(`📷 フォールバックキャラクター作成: ${characterData.name}`);
        
        try {
            // Canvas要素（非表示）
            const canvas = this.createHiddenCanvas(characterData);
            
            // フォールバック画像（表示）
            const fallback = this.createFallbackImage(characterData);
            
            // 設定要素
            const config = this.createConfigElement(characterData);
            
            // シーンコンテナに追加
            const sceneContainer = document.getElementById('scene-container');
            if (sceneContainer) {
                // プレースホルダーを非表示
                const placeholder = document.getElementById('background-placeholder');
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
                
                sceneContainer.appendChild(canvas);
                sceneContainer.appendChild(fallback);
                sceneContainer.appendChild(config);
            }
            
            // イベント設定
            this.setupFallbackEvents(fallback, characterData);
            
            // キャラクター登録
            this.fallbackCharacters.set(characterData.name, {
                data: characterData,
                canvas,
                fallback,
                config,
                isLoaded: false,
                isFallback: true
            });
            
            console.log(`✅ フォールバックキャラクター作成完了: ${characterData.name}`);
            return true;
            
        } catch (error) {
            console.error(`❌ フォールバックキャラクター作成エラー: ${characterData.name}`, error);
            return false;
        }
    }

    // 非表示Canvas作成
    createHiddenCanvas(characterData) {
        const canvas = document.createElement('canvas');
        canvas.id = `${characterData.name}-canvas`;
        canvas.width = 300;
        canvas.height = 200;
        canvas.setAttribute('data-character-name', characterData.name);
        canvas.setAttribute('data-spine-character', 'true');
        
        // 非表示スタイル
        Object.assign(canvas.style, {
            position: 'absolute',
            left: `${characterData.position.x}%`,
            top: `${characterData.position.y}%`,
            transform: 'translate(-50%, -50%)',
            width: `${(characterData.scale || 1) * 30}%`,
            aspectRatio: '3/2',
            zIndex: '10',
            opacity: '0',
            pointerEvents: 'none'
        });
        
        return canvas;
    }

    // フォールバック画像作成
    createFallbackImage(characterData) {
        const fallback = document.createElement('img');
        fallback.id = `${characterData.name}-fallback`;
        fallback.setAttribute('data-character-name', characterData.name);
        fallback.setAttribute('data-spine-character', 'true');
        fallback.alt = characterData.name;
        
        // 画像パス設定
        const imageName = characterData.name === 'purattokun' ? 'purattokunn.png' : `${characterData.name}.png`;
        fallback.src = `assets/images/${imageName}`;
        
        // 表示スタイル
        Object.assign(fallback.style, {
            position: 'absolute',
            left: `${characterData.position.x}%`,
            top: `${characterData.position.y}%`,
            transform: 'translate(-50%, -50%)',
            width: `${(characterData.scale || 1) * 10}%`,
            aspectRatio: '1/1',
            objectFit: 'contain',
            zIndex: '10',
            opacity: '1',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: '2px solid transparent',
            borderRadius: '8px'
        });
        
        // ホバーエフェクト
        fallback.addEventListener('mouseenter', () => {
            fallback.style.transform = 'translate(-50%, -50%) scale(1.05)';
            fallback.style.border = '2px solid #667eea';
            fallback.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
        });
        
        fallback.addEventListener('mouseleave', () => {
            fallback.style.transform = 'translate(-50%, -50%) scale(1)';
            fallback.style.border = '2px solid transparent';
            fallback.style.boxShadow = 'none';
        });
        
        // 画像読み込みエラー時の処理
        fallback.addEventListener('error', () => {
            console.warn(`⚠️ フォールバック画像読み込み失敗: ${imageName}`);
            fallback.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+4oaqPC90ZXh0Pjwvc3ZnPg==';
            fallback.alt = 'キャラクター画像';
        });
        
        return fallback;
    }

    // 設定要素作成
    createConfigElement(characterData) {
        const config = document.createElement('div');
        config.id = `${characterData.name}-config`;
        config.style.display = 'none';
        
        config.setAttribute('data-x', characterData.position.x);
        config.setAttribute('data-y', characterData.position.y);
        config.setAttribute('data-scale', characterData.scale || 1);
        config.setAttribute('data-fade-delay', '1500');
        config.setAttribute('data-fade-duration', '2000');
        
        return config;
    }

    // フォールバックイベント設定
    setupFallbackEvents(fallback, characterData) {
        fallback.addEventListener('click', (event) => {
            console.log(`🎯 フォールバックキャラクタークリック: ${characterData.name}`);
            
            // クリックアニメーション
            this.playFallbackClickAnimation(fallback);
            
            // アプリケーション状態更新
            if (window.selectCharacter) {
                const characterIndex = Array.from(this.fallbackCharacters.keys()).indexOf(characterData.name);
                window.selectCharacter(characterIndex);
            }
        });
    }

    // フォールバッククリックアニメーション
    playFallbackClickAnimation(fallback) {
        // シンプルなバウンスアニメーション
        fallback.style.transition = 'transform 0.1s ease';
        fallback.style.transform = 'translate(-50%, -50%) scale(0.95)';
        
        setTimeout(() => {
            fallback.style.transform = 'translate(-50%, -50%) scale(1.05)';
        }, 100);
        
        setTimeout(() => {
            fallback.style.transition = 'all 0.3s ease';
            fallback.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 200);
    }

    // キャラクター位置更新
    updateCharacterPosition(characterName, x, y) {
        const character = this.fallbackCharacters.get(characterName);
        if (character) {
            character.canvas.style.left = `${x}%`;
            character.canvas.style.top = `${y}%`;
            character.fallback.style.left = `${x}%`;
            character.fallback.style.top = `${y}%`;
            
            // 設定も更新
            character.config.setAttribute('data-x', x);
            character.config.setAttribute('data-y', y);
            
            // データ更新
            character.data.position.x = x;
            character.data.position.y = y;
            
            console.log(`📐 フォールバック位置更新: ${characterName} (${x}%, ${y}%)`);
        }
    }

    // キャラクター削除
    removeCharacter(characterName) {
        const character = this.fallbackCharacters.get(characterName);
        if (character) {
            character.canvas.remove();
            character.fallback.remove();
            character.config.remove();
            
            this.fallbackCharacters.delete(characterName);
            console.log(`🗑️ フォールバックキャラクター削除: ${characterName}`);
        }
    }

    // 全キャラクター削除
    clearAllCharacters() {
        for (const characterName of this.fallbackCharacters.keys()) {
            this.removeCharacter(characterName);
        }
        
        // プレースホルダー表示
        const placeholder = document.getElementById('background-placeholder');
        if (placeholder) {
            placeholder.style.display = 'flex';
        }
        
        console.log('🗑️ 全フォールバックキャラクター削除完了');
    }

    // 既存キャラクターをフォールバックに変換
    convertToFallback(characterName) {
        const character = this.fallbackCharacters.get(characterName);
        if (character) {
            character.canvas.style.opacity = '0';
            character.fallback.style.opacity = '1';
            character.isLoaded = false;
            character.isFallback = true;
            
            console.log(`🔄 キャラクターをフォールバックに変換: ${characterName}`);
        }
    }
}

// ========== グローバル初期化 ========== //

// フォールバックマネージャーインスタンス作成
const spineFallbackManager = new SpineFallbackManager();

// グローバル関数公開
window.spineFallbackManager = spineFallbackManager;
window.createFallbackCharacter = (characterData) => spineFallbackManager.createFallbackCharacter(characterData);

console.log('✅ Spine Fallback System 初期化完了');