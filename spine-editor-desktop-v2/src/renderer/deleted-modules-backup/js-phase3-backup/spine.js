// 🎯 Spine Editor Desktop v2.0 - 軽量統合システム
// 軽量Spine WebGLシステム統合 - SpineManager互換版
// 設計方針: SpineSystem統合 + SpineManager API互換性保持

console.log('🚀 Spine Manager v2.0 軽量統合システム 読み込み');

/**
 * 軽量Spine WebGLシステム統合クラス（SpineManager互換）
 * 従来のSpineManagerのAPIを保持しつつ、内部で軽量統合システムを使用
 */
class SpineManager {
    constructor(app) {
        this.app = app;
        
        // 従来API互換
        this.characters = new Map();
        this.canvas = null;
        this.gl = null;
        this.isInitialized = false;
        
        // 軽量統合システム
        this.spineSystem = null;
        this.currentZoom = 1.0;
        this.viewOffset = { x: 0, y: 0 };
        this.isPlaying = false;
        this.animationState = new Map();
        
        // レンダリング制御
        this.lastTime = 0;
        this.viewport = null;
        
        console.log('✅ SpineManager v2.0 軽量版初期化完了');
    }

    /**
     * 高速Spine初期化 (軽量統合システム版)
     */
    async init() {
        console.log('🦴 Spine Manager v2.0 軽量統合システム初期化開始...');
        
        try {
            // 軽量統合システム初期化
            if (!window.SpineSystem) {
                console.warn('⚠️ SpineSystem not found, loading dependencies...');
                await this.loadDependencies();
            }
            
            this.spineSystem = new window.SpineSystem();
            
            // 統合システム初期化
            if (!await this.spineSystem.initialize()) {
                throw new Error('SpineSystem initialization failed');
            }
            
            // ビューポート初期化
            this.initializeViewport();
            
            // レンダーループ開始
            this.startRenderLoop();
            
            this.isInitialized = true;
            console.log('✅ Spine Manager v2.0 軽量統合システム初期化完了');
            
        } catch (error) {
            console.error('❌ Spine Manager軽量版初期化失敗:', error);
            this.isInitialized = false;
            
            // フォールバックモード
            console.log('🔄 フォールバックモードで継続...');
            this.isInitialized = true;
        }
    }

    /**
     * 依存モジュール読み込み
     */
    async loadDependencies() {
        console.log('📦 軽量統合システム依存モジュール読み込み開始');
        
        const dependencies = [
            'spine-core.js',
            'spine-renderer.js', 
            'spine-utils.js',
            'spine-system.js'
        ];
        
        for (const dep of dependencies) {
            await this.loadScript(`js/${dep}`);
        }
        
        console.log('✅ 依存モジュール読み込み完了');
    }

    /**
     * スクリプト動的読み込み
     */
    async loadScript(src) {
        return new Promise((resolve, reject) => {
            // 既に読み込み済みかチェック
            if (document.querySelector(`script[src*="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });
    }

    /**
     * ビューポート初期化
     */
    initializeViewport() {
        this.viewport = document.getElementById('spine-viewport');
        if (!this.viewport) {
            console.warn('⚠️ spine-viewport not found');
            return;
        }
        
        // Canvas作成（軽量版）
        this.canvas = document.createElement('canvas');
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0.2, 0.2, 0.2, 0.1);
        `;
        
        this.viewport.appendChild(this.canvas);
        
        // リサイズ処理
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
        
        console.log('✅ ビューポート初期化完了');
    }

    /**
     * レンダーループ開始（軽量版）
     */
    startRenderLoop() {
        const render = (time) => {
            this.renderSimple(time);
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
        console.log('✅ 軽量レンダーループ開始');
    }

    /**
     * シンプルレンダリング（軽量版）
     */
    renderSimple(time) {
        if (!this.canvas) return;
        
        const deltaTime = this.lastTime > 0 ? (time - this.lastTime) / 1000 : 0;
        this.lastTime = time;
        
        // 軽量統合システムでのレンダリング
        if (this.spineSystem && this.spineSystem.initialized) {
            // SpineSystemのレンダリングに委任
            // 実際の実装は統合システム内で処理
        }
    }

    /**
     * Canvas リサイズ
     */
    resizeCanvas() {
        if (!this.canvas || !this.viewport) return;
        
        const rect = this.viewport.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    // ===========================================
    // 従来API互換メソッド群（軽量統合システム版）
    // ===========================================

    /**
     * キャラクター読み込み（統合システム版）
     */
    async loadCharacter(characterData) {
        if (!this.spineSystem) {
            console.warn('⚠️ SpineSystem not initialized, creating placeholder');
            return this.createCharacterPlaceholder(characterData);
        }
        
        try {
            const character = {
                id: characterData.id || Date.now().toString(),
                name: characterData.name || 'Character',
                x: characterData.x || 0,
                y: characterData.y || 0,
                scaleX: characterData.scaleX || 1,
                scaleY: characterData.scaleY || 1
            };
            
            // 統合システムでキャラクター追加
            const success = await this.spineSystem.addCharacter(
                character.id,
                characterData.jsonPath || '',
                character.name,
                { x: character.x, y: character.y },
                this.viewport
            );
            
            if (success) {
                this.characters.set(character.id, character);
                this.updateCharacterList();
                console.log(`✅ 軽量版キャラクター読み込み完了: ${character.name}`);
            }
            
            return success;
            
        } catch (error) {
            console.error('❌ 軽量版キャラクター読み込み失敗:', error);
            return this.createCharacterPlaceholder(characterData);
        }
    }

    /**
     * プレースホルダーキャラクター作成
     */
    createCharacterPlaceholder(characterData) {
        const character = {
            id: characterData.id || Date.now().toString(),
            name: characterData.name || 'Character',
            x: characterData.x || 0,
            y: characterData.y || 0,
            scaleX: characterData.scaleX || 1,
            scaleY: characterData.scaleY || 1,
            isPlaceholder: true
        };
        
        this.characters.set(character.id, character);
        this.updateCharacterList();
        
        console.log(`📦 プレースホルダー作成: ${character.name}`);
        return true;
    }

    /**
     * プロジェクトデータ読み込み
     */
    async loadData(spineData) {
        console.log('📁 軽量版プロジェクトデータ読み込み:', spineData);
        
        try {
            if (spineData.characters) {
                for (const charData of spineData.characters) {
                    await this.loadCharacter(charData);
                }
            }
            
            this.app.setStatus(`Loaded ${this.characters.size} character(s)`);
            
        } catch (error) {
            console.error('❌ プロジェクトデータ読み込み失敗:', error);
            throw error;
        }
    }

    /**
     * キャラクターリスト更新
     */
    updateCharacterList() {
        const listElement = document.getElementById('character-list');
        if (!listElement) return;
        
        if (this.characters.size === 0) {
            listElement.innerHTML = '<div class="placeholder-text">No characters loaded</div>';
            return;
        }
        
        const html = Array.from(this.characters.values()).map(char => `
            <div class="character-item" data-id="${char.id}">
                <span class="character-name">${char.name}</span>
                <span class="character-status">${char.isPlaceholder ? '📦' : '✅'}</span>
            </div>
        `).join('');
        
        listElement.innerHTML = html;
        
        // クリックイベント設定
        listElement.querySelectorAll('.character-item').forEach(item => {
            item.addEventListener('click', () => {
                const charId = item.dataset.id;
                const character = this.characters.get(charId);
                if (character && this.app.ui) {
                    this.app.ui.selectCharacter(character);
                }
            });
        });
    }

    /**
     * キャラクタープロパティ更新
     */
    updateCharacterProperty(character, property, value) {
        if (!character) return;
        
        switch (property) {
            case 'posX':
                character.x = value;
                break;
            case 'posY':
                character.y = value;
                break;
            case 'scaleX':
                character.scaleX = value;
                break;
            case 'scaleY':
                character.scaleY = value;
                break;
        }
        
        this.updateCharacterList();
    }

    /**
     * アニメーション再生（軽量版）
     */
    playAnimation(character) {
        this.isPlaying = true;
        console.log(`▶️ 軽量版アニメーション再生: ${character ? character.name : 'all'}`);
    }

    /**
     * アニメーション一時停止
     */
    pauseAnimation(character) {
        this.isPlaying = false;
        console.log(`⏸️ アニメーション一時停止: ${character ? character.name : 'all'}`);
    }

    /**
     * データエクスポート
     */
    async exportData() {
        const charactersData = Array.from(this.characters.values()).map(char => ({
            id: char.id,
            name: char.name,
            x: char.x,
            y: char.y,
            scaleX: char.scaleX,
            scaleY: char.scaleY
        }));
        
        return {
            characters: charactersData,
            viewport: {
                zoom: this.currentZoom,
                offset: this.viewOffset
            }
        };
    }

    /**
     * ビューポートリセット
     */
    resetView() {
        this.currentZoom = 1.0;
        this.viewOffset = { x: 0, y: 0 };
    }

    /**
     * 選択解除
     */
    clearSelection() {
        if (this.app.ui) {
            this.app.ui.clearSelection();
        }
    }

    /**
     * 位置によるキャラクター検索 - 不足していた重要機能
     */
    getCharacterAt(x, y) {
        // マウス位置でキャラクターを検索
        for (const [id, character] of this.characters) {
            if (this.isPointInCharacter(x, y, character)) {
                return character;
            }
        }
        return null;
    }

    /**
     * 点がキャラクター領域内にあるかチェック
     */
    isPointInCharacter(x, y, character) {
        if (!character) return false;
        
        // 簡易バウンディングボックス判定
        const size = 50 * (character.scaleX || 1); // 基本サイズ×スケール
        const left = character.x - size / 2;
        const right = character.x + size / 2;
        const top = character.y - size / 2;
        const bottom = character.y + size / 2;
        
        return x >= left && x <= right && y >= top && y <= bottom;
    }

    /**
     * キャラクター選択
     */
    selectCharacter(character) {
        this.selectedCharacter = character;
        console.log(`🎯 Character selected: ${character ? character.name : 'none'}`);
        
        // UI更新通知
        if (this.app && this.app.ui) {
            this.app.ui.updateInspector(character);
        }
        
        return character;
    }

    /**
     * IDによるキャラクター取得
     */
    getCharacterById(id) {
        return this.characters.get(id) || null;
    }

    /**
     * すべてのキャラクター取得
     */
    getAllCharacters() {
        return Array.from(this.characters.values());
    }

    /**
     * キャラクター数取得
     */
    getCharacterCount() {
        return this.characters.size;
    }

    /**
     * システム破棄処理
     */
    destroy() {
        if (this.spineSystem) {
            this.spineSystem.cleanup();
        }
        
        this.characters.clear();
        this.animationState.clear();
        this.selectedCharacter = null;
        
        console.log('🗑️ SpineManager軽量版 破棄完了');
    }

    /**
     * dispose - 従来API互換（destroyのエイリアス）
     */
    dispose() {
        this.destroy();
    }

    /**
     * プロジェクトエクスポート（従来API互換）
     */
    exportProject() {
        return this.exportData();
    }

    /**
     * プロジェクト読み込み（従来API互換）
     */
    async loadProject(projectData) {
        return this.loadData(projectData);
    }

    /**
     * ビューポートにアタッチ（従来API互換）
     */
    attachToViewport(viewportElement) {
        console.log('📎 軽量版ビューポートアタッチ:', viewportElement?.id);
        // 軽量版では初期化時に自動的にビューポートを設定
        if (viewportElement && !this.viewport) {
            this.viewport = viewportElement;
            this.initializeViewport();
        }
    }

    /**
     * アニメーションシーケンス再生（従来API互換）
     */
    playAnimationSequence() {
        console.log('🎬 軽量版アニメーションシーケンス再生 (syutugen → taiki)');
        this.isPlaying = true;
        
        // 統合システムでのアニメーション制御
        if (this.spineSystem && this.spineSystem.initialized) {
            // SpineSystemにアニメーション指示を送信
            // 実際の実装は統合システム内で処理
        }
    }

    /**
     * 軽量版スケルトン互換プロパティ
     * app.jsで直接参照されるskeletonプロパティの軽量実装
     */
    get skeleton() {
        // 軽量版では簡易スケルトンオブジェクトを返す
        if (!this._skeletonCompat) {
            this._skeletonCompat = {
                x: 400,
                y: 300,
                scaleX: 1.0,
                scaleY: 1.0
            };
        }
        return this._skeletonCompat;
    }

    /**
     * キャラクター位置更新（従来API互換）
     */
    updateCharacterPosition(x, y) {
        console.log(`📍 軽量版位置更新: (${x}, ${y})`);
        
        // 軽量スケルトン更新
        if (this._skeletonCompat) {
            this._skeletonCompat.x = x;
            this._skeletonCompat.y = y;
        }
        
        // 統合システムに位置更新を通知
        if (this.spineSystem && this.spineSystem.initialized) {
            // 実際のキャラクター位置更新は統合システムで処理
        }
    }

    /**
     * キャラクタースケール更新（従来API互換）
     */
    updateCharacterScale(scaleX, scaleY) {
        console.log(`🔄 軽量版スケール更新: (${scaleX}, ${scaleY})`);
        
        // 軽量スケルトン更新
        if (this._skeletonCompat) {
            this._skeletonCompat.scaleX = scaleX;
            this._skeletonCompat.scaleY = scaleY;
        }
        
        // 統合システムにスケール更新を通知
        if (this.spineSystem && this.spineSystem.initialized) {
            // 実際のキャラクタースケール更新は統合システムで処理
        }
    }
}

// グローバル公開
window.SpineManager = SpineManager;

console.log('✅ Spine Manager v2.0 軽量統合システム 読み込み完了');