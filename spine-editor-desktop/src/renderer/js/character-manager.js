// 🎯 Spine Editor Desktop - Character Management Module
// キャラクター管理: 検出・データ管理・アニメーション・操作

console.log('🎭 Character Manager Module 読み込み');

/**
 * キャラクター管理クラス
 * 責任範囲:
 * - Spineキャラクターの自動検出
 * - キャラクターデータの管理・操作
 * - アニメーション情報の読み込み
 * - キャラクター選択・プロパティ更新
 */
class CharacterManager {
    constructor(app) {
        this.app = app;
        console.log('✅ CharacterManager 初期化完了');
    }

    // ========== Spineキャラクター自動検出 ========== //

    /**
     * Spineキャラクターを自動検出
     */
    async detectSpineCharacters() {
        console.log('🔍 Spineキャラクター自動検出開始');
        
        if (!this.app.state.project.spineCharactersFolder || typeof spineAPI === 'undefined') {
            return;
        }
        
        try {
            const items = await electronAPI.listDirectory(this.app.state.project.spineCharactersFolder);
            
            for (const item of items) {
                if (item.isDirectory) {
                    // characters/<characterName>/ の構造をチェック
                    const characterPath = item.path;
                    const characterName = item.name;
                    
                    const analysis = await spineAPI.analyzeSpineStructure(characterPath);
                    if (analysis.success && analysis.spineFiles.json && analysis.spineFiles.atlas) {
                        console.log(`✅ 検出: ${characterName}`, analysis.spineFiles);
                        
                        // キャラクターデータを作成
                        const characterData = this.createCharacterData(characterName, characterPath, analysis);
                        
                        this.app.state.characters.set(characterName, characterData);
                        
                        // Spine JSONからアニメーション一覧を取得
                        await this.loadCharacterAnimations(characterName);
                    }
                }
            }
            
            console.log(`✅ Spineキャラクター検出完了: ${this.app.state.characters.size}体`);
            
        } catch (error) {
            console.error('❌ Spineキャラクター検出エラー:', error);
        }
    }

    /**
     * キャラクターデータを作成
     * @param {string} characterName - キャラクター名
     * @param {string} characterPath - キャラクターフォルダパス
     * @param {Object} analysis - Spine構造解析結果
     * @returns {Object} キャラクターデータ
     */
    createCharacterData(characterName, characterPath, analysis) {
        return {
            id: characterName,
            name: characterName,
            folderPath: characterPath,
            spineFiles: analysis.spineFiles,
            // PNG画像ファイルのパスを追加
            pngFile: analysis.spineFiles.images && analysis.spineFiles.images.length > 0 
                ? analysis.spineFiles.images[0] 
                : null,
            // デフォルト位置・トランスフォーム
            x: 18, 
            y: 49, 
            scale: 0.55, 
            rotation: 0, 
            opacity: 1.0,
            // アニメーション設定
            animation: 'taiki',
            animations: [], // JSONから取得予定
            // 状態フラグ
            visible: true,
            locked: false
        };
    }

    /**
     * キャラクターのアニメーション一覧を読み込み
     * @param {string} characterId - キャラクターID
     */
    async loadCharacterAnimations(characterId) {
        const character = this.app.state.characters.get(characterId);
        if (!character || !character.spineFiles.json) return;
        
        try {
            const result = await electronAPI.readFile(character.spineFiles.json);
            if (result.success) {
                const spineData = JSON.parse(result.content);
                if (spineData.animations) {
                    character.animations = Object.keys(spineData.animations);
                    console.log(`📋 ${characterId} アニメーション:`, character.animations);
                }
            }
        } catch (error) {
            console.error(`❌ ${characterId} アニメーション読み込みエラー:`, error);
        }
    }

    // ========== キャラクター操作 ========== //

    /**
     * キャラクターを選択
     * @param {string} characterId - キャラクターID
     */
    selectCharacter(characterId) {
        console.log('🎯 キャラクター選択:', characterId);
        this.app.state.selectedCharacter = characterId;
        
        // Spine統合マネージャーに通知
        if (this.app.spineIntegration) {
            this.app.spineIntegration.onCharacterSelected(characterId);
        }
        
        // UI更新
        this.app.uiManager.updateOutliner();
        this.app.uiManager.updateProperties();
        this.app.uiManager.updateLayers();
    }

    /**
     * キャラクターのプロパティを更新
     * @param {string} property - プロパティ名
     * @param {*} value - 新しい値
     */
    updateCharacterProperty(property, value) {
        if (!this.app.state.selectedCharacter) return;
        
        const character = this.app.state.characters.get(this.app.state.selectedCharacter);
        if (character) {
            character[property] = value;
            console.log(`📐 ${this.app.state.selectedCharacter}.${property} = ${value}`);
            
            // プレビュー更新
            this.app.updatePreview();
        }
    }

    /**
     * アニメーションをプレビュー
     * @param {string} characterId - キャラクターID
     * @param {string} animation - アニメーション名
     */
    previewAnimation(characterId, animation) {
        console.log('🎬 アニメーションプレビュー:', characterId, animation);
        
        // Spine統合システムでアニメーション再生
        if (this.app.spineIntegration) {
            this.app.spineIntegration.playAnimation(characterId, animation);
        }
    }

    /**
     * 選択中のキャラクターを削除
     */
    deleteSelectedCharacter() {
        if (this.app.state.selectedCharacter) {
            console.log('🗑️ 選択キャラクター削除:', this.app.state.selectedCharacter);
            
            const characterId = this.app.state.selectedCharacter;
            
            // Spine統合システムから削除
            if (this.app.spineIntegration) {
                this.app.spineIntegration.removeCharacter(characterId);
            }
            
            // 状態から削除
            this.app.state.characters.delete(characterId);
            
            // 選択状態をクリア
            this.app.state.selectedCharacter = null;
            
            // プレビューエリアから要素を削除
            this.removeCharacterFromPreview(characterId);
            
            // UI更新
            this.app.uiManager.updateOutliner();
            this.app.uiManager.updateProperties();
            this.app.uiManager.updateLayers();
        }
    }

    /**
     * プレビューエリアからキャラクター要素を削除
     * @param {string} characterId - キャラクターID
     */
    removeCharacterFromPreview(characterId) {
        const previewArea = document.querySelector('.preview-content');
        if (!previewArea) return;
        
        // 各種要素IDパターンで検索・削除
        const elementIds = [
            `spine-canvas-${characterId}`,
            `character-img-${characterId}`,
            `canvas-2d-${characterId}`,
            `spine-character-${characterId}`
        ];
        
        for (const elementId of elementIds) {
            const element = previewArea.querySelector(`#${elementId}`);
            if (element) {
                element.remove();
                console.log(`✅ プレビュー要素削除: ${elementId}`);
            }
        }
    }

    // ========== キャラクター配置 ========== //

    /**
     * キャラクターをプレビューエリアに直接追加
     * @param {Object} characterData - キャラクターデータ
     * @param {Object} position - 配置位置 {x, y}
     */
    addCharacterDirectly(characterData, position) {
        console.log('🎭 キャラクター直接配置:', characterData.name, position);
        
        // キャラクターレンダラーに配置処理を委譲
        this.app.characterRenderer.addCharacterDirectly(characterData, position);
        
        // 配置後にキャラクターを選択状態にする
        this.selectCharacter(characterData.id);
    }

    // ========== データ管理 ========== //

    /**
     * すべてのキャラクターをクリア
     */
    clearAllCharacters() {
        console.log('🧹 全キャラクタークリア');
        
        // Spine統合システムからすべて削除
        if (this.app.spineIntegration) {
            for (const [characterId] of this.app.state.characters) {
                this.app.spineIntegration.removeCharacter(characterId);
            }
        }
        
        // プレビューエリアからすべての要素を削除
        for (const [characterId] of this.app.state.characters) {
            this.removeCharacterFromPreview(characterId);
        }
        
        // 状態をクリア
        this.app.state.characters.clear();
        this.app.state.selectedCharacter = null;
        
        // UI更新
        this.app.uiManager.updateOutliner();
        this.app.uiManager.updateProperties();
        this.app.uiManager.updateLayers();
    }

    /**
     * キャラクターが存在するかチェック
     * @param {string} characterId - キャラクターID
     * @returns {boolean} 存在するかどうか
     */
    hasCharacter(characterId) {
        return this.app.state.characters.has(characterId);
    }

    /**
     * キャラクターデータを取得
     * @param {string} characterId - キャラクターID
     * @returns {Object|null} キャラクターデータ
     */
    getCharacter(characterId) {
        return this.app.state.characters.get(characterId) || null;
    }

    /**
     * 選択中のキャラクターデータを取得
     * @returns {Object|null} 選択中のキャラクターデータ
     */
    getSelectedCharacter() {
        if (!this.app.state.selectedCharacter) return null;
        return this.getCharacter(this.app.state.selectedCharacter);
    }

    /**
     * 全キャラクターのIDリストを取得
     * @returns {string[]} キャラクターIDの配列
     */
    getAllCharacterIds() {
        return Array.from(this.app.state.characters.keys());
    }

    /**
     * キャラクター数を取得
     * @returns {number} キャラクター数
     */
    getCharacterCount() {
        return this.app.state.characters.size;
    }

    // ========== バリデーション ========== //

    /**
     * キャラクターデータの妥当性をチェック
     * @param {Object} characterData - キャラクターデータ
     * @returns {{valid: boolean, errors: string[]}} 検証結果
     */
    validateCharacterData(characterData) {
        const errors = [];
        
        // 必須フィールドチェック
        if (!characterData.id || typeof characterData.id !== 'string') {
            errors.push('キャラクターIDが不正です');
        }
        
        if (!characterData.name || typeof characterData.name !== 'string') {
            errors.push('キャラクター名が不正です');
        }
        
        // 数値フィールドチェック
        const numericFields = ['x', 'y', 'scale', 'rotation', 'opacity'];
        for (const field of numericFields) {
            if (characterData[field] !== undefined && typeof characterData[field] !== 'number') {
                errors.push(`${field}の値が不正です`);
            }
        }
        
        // 透明度の範囲チェック
        if (characterData.opacity !== undefined && 
            (characterData.opacity < 0 || characterData.opacity > 1)) {
            errors.push('透明度は0.0-1.0の範囲で指定してください');
        }
        
        // ブール値フィールドチェック
        const booleanFields = ['visible', 'locked'];
        for (const field of booleanFields) {
            if (characterData[field] !== undefined && typeof characterData[field] !== 'boolean') {
                errors.push(`${field}の値が不正です`);
            }
        }
        
        // アニメーション配列チェック
        if (characterData.animations && !Array.isArray(characterData.animations)) {
            errors.push('アニメーション一覧は配列で指定してください');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    // ========== 統計・情報 ========== //

    /**
     * キャラクター統計情報を取得
     * @returns {Object} 統計情報
     */
    getCharacterStatistics() {
        const stats = {
            total: this.app.state.characters.size,
            visible: 0,
            locked: 0,
            hasSpineFiles: 0,
            hasAnimations: 0,
            selectedCharacter: this.app.state.selectedCharacter
        };
        
        for (const [id, character] of this.app.state.characters) {
            if (character.visible !== false) {
                stats.visible++;
            }
            if (character.locked) {
                stats.locked++;
            }
            if (character.spineFiles && character.spineFiles.json && character.spineFiles.atlas) {
                stats.hasSpineFiles++;
            }
            if (character.animations && character.animations.length > 0) {
                stats.hasAnimations++;
            }
        }
        
        return stats;
    }

    /**
     * キャラクター情報をデバッグ出力
     */
    debugCharacterInfo() {
        console.log('🎭 === キャラクター情報デバッグ ===');
        
        const stats = this.getCharacterStatistics();
        console.log('📊 統計:', stats);
        
        for (const [id, character] of this.app.state.characters) {
            console.log(`🎯 ${id}:`, {
                name: character.name,
                position: { x: character.x, y: character.y },
                scale: character.scale,
                animation: character.animation,
                animations: character.animations.length,
                visible: character.visible,
                locked: character.locked,
                hasSpineFiles: !!(character.spineFiles && character.spineFiles.json),
                pngFile: character.pngFile ? '✅' : '❌'
            });
        }
        
        console.log('🎭 === デバッグ情報終了 ===');
    }

    // ========== レイヤー操作 ========== //

    /**
     * レイヤーを追加（新しいキャラクターレイヤー）
     */
    addLayer() {
        console.log('➕ レイヤー追加');
        
        // 実装予定: 新しいキャラクタースロットを作成
        // Phase 2で詳細実装
        this.app.showNotification('レイヤー追加機能は Phase 2 で実装予定です', 'info');
    }

    /**
     * 選択中のレイヤーを削除
     */
    deleteLayer() {
        console.log('🗑️ レイヤー削除');
        
        if (this.app.state.selectedCharacter) {
            this.deleteSelectedCharacter();
        } else {
            this.app.showNotification('削除するキャラクターが選択されていません', 'warning');
        }
    }

    // ========== インポート・エクスポート ========== //

    /**
     * キャラクター設定をエクスポート
     * @param {string} characterId - キャラクターID
     * @returns {Object|null} エクスポートデータ
     */
    exportCharacterSettings(characterId) {
        const character = this.getCharacter(characterId);
        if (!character) {
            console.error(`❌ キャラクター "${characterId}" が見つかりません`);
            return null;
        }
        
        return {
            version: "1.0",
            character: {
                id: character.id,
                name: character.name,
                position: { x: character.x, y: character.y },
                scale: character.scale,
                rotation: character.rotation,
                opacity: character.opacity,
                animation: character.animation,
                visible: character.visible,
                locked: character.locked
            },
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * キャラクター設定をインポート
     * @param {Object} importData - インポートデータ
     * @param {string} targetCharacterId - 対象キャラクターID
     * @returns {boolean} インポート成功かどうか
     */
    importCharacterSettings(importData, targetCharacterId) {
        try {
            const targetCharacter = this.getCharacter(targetCharacterId);
            if (!targetCharacter) {
                console.error(`❌ ターゲットキャラクター "${targetCharacterId}" が見つかりません`);
                return false;
            }
            
            if (!importData.character) {
                console.error('❌ インポートデータにキャラクター情報がありません');
                return false;
            }
            
            const settings = importData.character;
            
            // 位置・トランスフォーム設定を適用
            if (settings.position) {
                targetCharacter.x = settings.position.x;
                targetCharacter.y = settings.position.y;
            }
            
            if (settings.scale !== undefined) targetCharacter.scale = settings.scale;
            if (settings.rotation !== undefined) targetCharacter.rotation = settings.rotation;
            if (settings.opacity !== undefined) targetCharacter.opacity = settings.opacity;
            if (settings.animation) targetCharacter.animation = settings.animation;
            if (settings.visible !== undefined) targetCharacter.visible = settings.visible;
            if (settings.locked !== undefined) targetCharacter.locked = settings.locked;
            
            console.log(`✅ キャラクター設定インポート完了: ${targetCharacterId}`);
            
            // UI更新
            this.app.uiManager.updateProperties();
            this.app.updatePreview();
            
            return true;
            
        } catch (error) {
            console.error('❌ キャラクター設定インポートエラー:', error);
            return false;
        }
    }
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterManager;
}

// Global registration
window.CharacterManager = CharacterManager;

console.log('✅ Character Manager Module 読み込み完了');