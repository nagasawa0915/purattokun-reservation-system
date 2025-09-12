// 🎯 Character Generator - Spineキャラクター生成・管理マイクロモジュール
// 設計原則: 完全独立・外部依存ゼロ・数値のみ入出力

console.log('🚀 Character Generator マイクロモジュール読み込み');

/**
 * Spineキャラクター生成・複製管理モジュール
 * 
 * 入力仕様:
 * {
 *   characterType: "hero",           // キャラクタータイプ
 *   spineFilePath: "assets/hero.json", // Spineファイルパス（オプション）
 *   count: 3,                        // 生成数
 *   namePrefix: "hero"               // ID接頭辞（オプション）
 * }
 * 
 * 出力仕様:
 * [
 *   {
 *     characterId: "hero_001",
 *     characterType: "hero",
 *     spineData: {
 *       filePath: "assets/hero.json",
 *       defaultAnimation: "idle"
 *     }
 *   }
 * ]
 */
class CharacterGenerator {
    constructor() {
        // 完全独立：外部依存ゼロ
        this.generatedCharacters = [];
        this.characterIdCounter = 0;
        this.isInitialized = false;
    }

    /**
     * キャラクター生成メイン関数
     * @param {Object} input - 生成設定
     * @returns {Array} 生成されたキャラクターデータ配列
     */
    generate(input) {
        console.log('🎯 キャラクター生成開始', input);

        // 入力検証
        const validatedInput = this.validateInput(input);
        if (!validatedInput) {
            return [];
        }

        const results = [];

        // 指定された数だけキャラクター生成
        for (let i = 0; i < validatedInput.count; i++) {
            const character = this.createSingleCharacter(validatedInput, i);
            if (character) {
                results.push(character);
                this.generatedCharacters.push(character);
            }
        }

        console.log(`✅ ${results.length}個のキャラクター生成完了`);
        return results;
    }

    /**
     * 既存Spineキャラクター検出・標準化
     * v3.0のMultiCharacterManager.detectAllCharacters()機能を移植
     * @returns {Array} 検出されたキャラクターデータ配列
     */
    detectExistingCharacters() {
        console.log('🔍 既存Spineキャラクター検出開始');

        const detectedCharacters = [];

        // 🎯 汎用的なSpineキャラクター検出（v3.0移植版）
        const selectors = [
            'canvas[id$="-canvas"]',     // 最優先：標準命名規則
            'canvas[id*="spine"]',       // spine含む名前
            'canvas[id*="character"]',   // character含む名前
            'canvas.spine-canvas',       // クラス指定
            'div[id*="spine"] canvas',   // 親要素がspine
            'canvas[data-spine-character="true"]'  // データ属性対応
        ];

        selectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    if (element && element.id && !detectedCharacters.find(c => c.characterId === element.id)) {
                        const characterData = this.standardizeCharacterData(element);
                        if (characterData) {
                            detectedCharacters.push(characterData);
                        }
                    }
                });
            } catch (error) {
                console.warn(`キャラクター検出エラー (${selector}):`, error);
            }
        });

        console.log(`🔍 検出されたキャラクター数: ${detectedCharacters.length}`, detectedCharacters);
        return detectedCharacters;
    }

    /**
     * 単一キャラクター作成
     * @param {Object} config - 生成設定
     * @param {number} index - インデックス
     * @returns {Object} キャラクターデータ
     */
    createSingleCharacter(config, index) {
        // ユニークID生成
        const characterId = this.generateUniqueId(config.namePrefix || config.characterType, index);

        // Spineファイルパス決定
        const spineFilePath = config.spineFilePath || this.getDefaultSpineFilePath(config.characterType);

        // 標準キャラクターデータ作成
        const characterData = {
            characterId: characterId,
            characterType: config.characterType,
            spineData: {
                filePath: spineFilePath,
                defaultAnimation: "idle",
                animationList: ["idle", "walk", "attack"] // デフォルト
            },
            metadata: {
                generatedAt: Date.now(),
                index: index
            }
        };

        console.log(`📝 キャラクター作成: ${characterId}`, characterData);
        return characterData;
    }

    /**
     * 既存DOM要素のキャラクターデータ標準化
     * @param {HTMLElement} element - DOM要素
     * @returns {Object} 標準化されたキャラクターデータ
     */
    standardizeCharacterData(element) {
        const elementId = element.id;
        
        // キャラクタータイプ推定
        const characterType = this.inferCharacterType(elementId);
        
        // 表示名決定
        const displayName = this.generateDisplayName(elementId);

        // Spineファイルパス推定
        const spineFilePath = this.inferSpineFilePath(elementId, characterType);

        return {
            characterId: elementId,
            characterType: characterType,
            displayName: displayName,
            spineData: {
                filePath: spineFilePath,
                defaultAnimation: "idle",
                animationList: [] // 実際のSpineファイルから読み込む場合は後で更新
            },
            domElement: {
                id: elementId,
                tagName: element.tagName,
                className: element.className
            },
            metadata: {
                detectedAt: Date.now(),
                source: "existing"
            }
        };
    }

    /**
     * 入力検証
     * @param {Object} input - 入力データ
     * @returns {Object|null} 検証済み入力またはnull
     */
    validateInput(input) {
        if (!input || typeof input !== 'object') {
            console.error('❌ 無効な入力: オブジェクトが必要');
            return null;
        }

        const validated = {
            characterType: input.characterType || 'character',
            count: Math.max(1, Math.min(100, parseInt(input.count) || 1)), // 1-100の範囲
            namePrefix: input.namePrefix || input.characterType || 'char',
            spineFilePath: input.spineFilePath || null
        };

        console.log('✅ 入力検証完了', validated);
        return validated;
    }

    /**
     * ユニークID生成
     * @param {string} prefix - 接頭辞
     * @param {number} index - インデックス
     * @returns {string} ユニークID
     */
    generateUniqueId(prefix, index) {
        const timestamp = Date.now().toString().slice(-6); // 末尾6桁
        const paddedIndex = String(index + 1).padStart(3, '0');
        return `${prefix}_${paddedIndex}_${timestamp}`;
    }

    /**
     * キャラクタータイプ推定
     * @param {string} elementId - 要素ID
     * @returns {string} 推定されたキャラクタータイプ
     */
    inferCharacterType(elementId) {
        const id = elementId.toLowerCase();
        
        // 既知のキャラクター名マッピング
        const typeMap = {
            'purattokun': 'hero',
            'nezumi': 'animal',
            'character': 'character',
            'player': 'hero',
            'enemy': 'enemy',
            'npc': 'npc'
        };

        for (const [key, type] of Object.entries(typeMap)) {
            if (id.includes(key)) {
                return type;
            }
        }

        return 'character'; // デフォルト
    }

    /**
     * 表示名生成
     * @param {string} elementId - 要素ID
     * @returns {string} 表示名
     */
    generateDisplayName(elementId) {
        const name = elementId.replace(/[^a-zA-Z]/g, '') || 'character';
        
        // 特別な表示名マッピング
        const displayMap = {
            'purattokun': '🐱 ぷらっとくん',
            'nezumi': '🐭 ねずみ'
        };

        return displayMap[name.toLowerCase()] || `🎯 ${name}`;
    }

    /**
     * Spineファイルパス推定
     * @param {string} elementId - 要素ID
     * @param {string} characterType - キャラクタータイプ
     * @returns {string} Spineファイルパス
     */
    inferSpineFilePath(elementId, characterType) {
        const characterName = elementId.replace(/[^a-zA-Z]/g, '').toLowerCase();
        return `assets/spine/characters/${characterName}/${characterName}.json`;
    }

    /**
     * デフォルトSpineファイルパス取得
     * @param {string} characterType - キャラクタータイプ
     * @returns {string} デフォルトパス
     */
    getDefaultSpineFilePath(characterType) {
        return `assets/spine/characters/${characterType}/${characterType}.json`;
    }

    /**
     * モジュール状態取得
     * @returns {Object} 現在の状態
     */
    getState() {
        return {
            generatedCount: this.generatedCharacters.length,
            isInitialized: this.isInitialized,
            lastGeneratedId: this.characterIdCounter
        };
    }

    /**
     * 完全クリーンアップ
     * マイクロモジュール設計の必須メソッド
     */
    cleanup() {
        console.log('🧹 Character Generator クリーンアップ実行');
        
        this.generatedCharacters = [];
        this.characterIdCounter = 0;
        this.isInitialized = false;
        
        console.log('✅ Character Generator クリーンアップ完了');
    }

    /**
     * 単独テスト（マイクロモジュール設計の必須メソッド）
     * @returns {boolean} テスト結果
     */
    static test() {
        console.log('🧪 Character Generator 単独テスト開始');
        
        try {
            const generator = new CharacterGenerator();

            // テスト1: 基本生成
            const result1 = generator.generate({
                characterType: "hero",
                count: 2,
                namePrefix: "test"
            });

            if (result1.length !== 2) {
                throw new Error('基本生成テスト失敗');
            }

            // テスト2: 既存キャラクター検出（DOM要素が存在する場合）
            const result2 = generator.detectExistingCharacters();
            
            // テスト3: クリーンアップ
            generator.cleanup();
            const state = generator.getState();
            
            if (state.generatedCount !== 0) {
                throw new Error('クリーンアップテスト失敗');
            }

            console.log('✅ Character Generator 単独テスト成功');
            return true;

        } catch (error) {
            console.error('❌ Character Generator 単独テスト失敗:', error);
            return false;
        }
    }
}

// モジュールエクスポート（環境非依存）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterGenerator;
} else {
    window.CharacterGenerator = CharacterGenerator;
}

console.log('✅ Character Generator マイクロモジュール読み込み完了');