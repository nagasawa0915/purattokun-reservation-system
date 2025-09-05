// 🎯 パッケージ出力システム - キャラクター検出・位置データ収集モジュール
// 意味単位: キャラクター検出・位置情報処理
// 複雑度: 中（DOM解析・データ変換）

console.log('🔍 CharacterDetector モジュール読み込み開始');

/**
 * 🔍 キャラクター自動検出・位置データ収集クラス
 * 
 * 【責務】
 * - 全キャラクターの自動検出
 * - localStorage・DOM状態からの位置データ収集
 * - 位置データの正規化・検証
 * 
 * 【検出戦略】
 * 1. MultiCharacterManager優先取得
 * 2. DOM要素検索フォールバック
 * 3. デフォルト値適用
 */
export class CharacterDetector {
    constructor() {
        this.detectedCharacters = [];
        this.allPositionData = {};
    }
    
    // 🔍 全キャラクター検出（完全パッケージ版）
    async detectAllCharacters() {
        console.log('🔍 全キャラクター検出開始（お客様納品用）');
        
        this.detectedCharacters = [];
        
        // 1. MultiCharacterManagerから全キャラクター取得（最優先）
        if (typeof MultiCharacterManager !== 'undefined' && MultiCharacterManager.characters) {
            console.log('🐈 MultiCharacterManagerから全キャラクター取得');
            MultiCharacterManager.characters.forEach(char => {
                const characterName = char.id.replace('-canvas', '') || char.name;
                if (characterName && !this.detectedCharacters.includes(characterName)) {
                    this.detectedCharacters.push(characterName);
                    console.log(`  ✅ 登録: ${characterName} (ID: ${char.id})`);
                }
            });
        }
        
        // 2. DOMから直接検索（フォールバック）
        if (this.detectedCharacters.length === 0) {
            console.log('🔍 DOMから直接キャラクター検索');
            const selectors = [
                'canvas[id$="-canvas"]',      // 標準命名規則
                'canvas[data-spine-character]',
                '.spine-character'
            ];
            
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    if (element.id) {
                        const characterName = element.id.replace('-canvas', '');
                        if (characterName && !this.detectedCharacters.includes(characterName)) {
                            this.detectedCharacters.push(characterName);
                            console.log(`  ✅ DOM検出: ${characterName}`);
                        }
                    }
                });
            });
        }
        
        // 3. 最終フォールバック
        if (this.detectedCharacters.length === 0) {
            console.warn('⚠️ キャラクター未検出 - デフォルトを追加');
            this.detectedCharacters.push('purattokun');  // 既存プロジェクト互換性
        }
        
        console.log(`✅ 全キャラクター検出完了: [${this.detectedCharacters.join(', ')}]`);
        return this.detectedCharacters;
    }
    
    // 📊 全キャラクター位置データ収集（完全パッケージ版）
    async collectAllPositionData(characters) {
        console.log('📊 全キャラクター位置データ収集開始（完全パッケージ版）');
        
        if (!characters || characters.length === 0) {
            console.warn('⚠️ キャラクターリストが空です');
            return {};
        }
        
        this.allPositionData = {};
        
        try {
            // === 1. localStorage v3.0全キャラクター位置データ取得 ===
            console.log('💾 Step 1: localStorage全キャラクター位置データ取得');
            await this.loadPositionDataFromStorage(characters);
            
            // === 2. localStorageデータがないキャラクターのDOM状態から取得 ===
            console.log('🎯 Step 2: 未保存キャラクターのDOM位置データ取得');
            await this.loadPositionDataFromDOM(characters);
            
            // === 3. 全キャラクター位置データ正規化 ===
            console.log('🔧 Step 3: 全キャラクター位置データ正規化');
            this.normalizeAllPositionData();
            
            console.log('✅ 全キャラクター位置データ収集完了:', this.allPositionData);
            
            // 🔍 品質保証: データ整合性の詳細確認
            this.logPositionDataQualityCheck();
            
            return this.allPositionData;
            
        } catch (error) {
            console.error('❌ 全キャラクター位置データ収集エラー:', error);
            throw error;
        }
    }
    
    // localStorage から位置データ読み込み
    async loadPositionDataFromStorage(characters) {
        const savedStateString = localStorage.getItem('spine-positioning-state');
        
        if (savedStateString) {
            try {
                const savedState = JSON.parse(savedStateString);
                
                // v3.0形式: { characters: { "nezumi-canvas": {...}, "purattokun-canvas": {...} } }
                if (savedState && savedState.characters) {
                    console.log('💾 localStorage v3.0形式検出 - 全キャラクター位置データあり');
                    
                    for (const [characterId, positionData] of Object.entries(savedState.characters)) {
                        const characterName = characterId.replace('-canvas', '');
                        if (characters.includes(characterName)) {
                            this.allPositionData[characterName] = positionData;
                            console.log(`  ✅ ${characterName}: localStorage位置データ取得成功`);
                        }
                    }
                }
                // v2.0形式互換性: { character: {...} }
                else if (savedState && savedState.character) {
                    console.log('💾 localStorage v2.0形式検出 - 単一キャラクター位置データ');
                    
                    // v2.0データを適用可能なキャラクターを特定
                    let targetCharacterName = null;
                    
                    // 1. MultiCharacterManagerから現在のキャラクター取得を試行
                    if (typeof MultiCharacterManager !== 'undefined' && MultiCharacterManager.activeCharacter) {
                        targetCharacterName = MultiCharacterManager.activeCharacter.id.replace('-canvas', '');
                    }
                    // 2. フォールバック: charactersの最初のキャラクター
                    else if (characters.length > 0) {
                        targetCharacterName = characters[0];
                        console.log(`💡 フォールバック: ${targetCharacterName} にv2.0データを適用`);
                    }
                    
                    if (targetCharacterName && characters.includes(targetCharacterName)) {
                        this.allPositionData[targetCharacterName] = savedState.character;
                        console.log(`  ✅ ${targetCharacterName}: v2.0互換性データ適用成功`);
                    } else {
                        console.warn('⚠️ v2.0データの適用対象キャラクターが見つかりません');
                    }
                }
            } catch (parseError) {
                console.warn('⚠️ localStorage解析エラー:', parseError);
            }
        } else {
            console.log('💡 localStorage未保存 - DOM状態から全キャラクター位置を取得');
        }
    }
    
    // DOM から位置データ読み込み
    async loadPositionDataFromDOM(characters) {
        for (const characterName of characters) {
            if (!this.allPositionData[characterName]) {
                console.log(`🔍 ${characterName}: localStorageデータなし - DOMから取得`);
                
                const element = document.getElementById(`${characterName}-canvas`);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const computedStyle = window.getComputedStyle(element);
                    
                    const domPosition = {
                        left: element.style.left || computedStyle.left || '35%',
                        top: element.style.top || computedStyle.top || '75%',
                        width: element.style.width || computedStyle.width || '25%',
                        height: element.style.height || computedStyle.height || 'auto',
                        transform: element.style.transform || computedStyle.transform || 'translate(-50%, -50%)'
                    };
                    
                    this.allPositionData[characterName] = domPosition;
                    console.log(`  ✅ ${characterName}: DOM位置データ取得成功`);
                } else {
                    console.warn(`  ⚠️ ${characterName}: DOM要素が見つからない - デフォルト値使用`);
                    this.allPositionData[characterName] = {
                        left: '35%', top: '75%', width: '25%', height: 'auto',
                        transform: 'translate(-50%, -50%)'
                    };
                }
            }
        }
    }
    
    // 全キャラクター位置データ正規化
    normalizeAllPositionData() {
        for (const [characterName, positionData] of Object.entries(this.allPositionData)) {
            this.allPositionData[characterName] = this.normalizePositionData(positionData);
        }
    }
    
    // 位置データの正規化・検証（精度保持改善版）
    normalizePositionData(data) {
        const normalized = { ...data };
        
        // 🔧 精度保持: 不必要な変換を回避し、元のデータをそのまま保持
        ['left', 'top', 'width', 'height'].forEach(prop => {
            if (normalized[prop] && typeof normalized[prop] === 'string') {
                // 既に適切な形式の場合はそのまま保持（精度誤差防止）
                if (normalized[prop].includes('%') || normalized[prop].includes('px') || normalized[prop] === 'auto') {
                    console.log(`✅ ${prop}: 適切な形式を保持: ${normalized[prop]}`);
                } else {
                    console.log(`🔧 ${prop}: 形式が不明、そのまま保持: ${normalized[prop]}`);
                }
            }
        });
        
        // transformの正規化（デフォルト値設定のみ）
        if (!normalized.transform || normalized.transform === 'none') {
            normalized.transform = 'translate(-50%, -50%)';
            console.log('🔧 transform正規化: translate(-50%, -50%)を設定');
        }
        
        console.log('🔧 位置データ正規化完了（精度保持版）:', normalized);
        return normalized;
    }
    
    // 品質保証ログ出力
    logPositionDataQualityCheck() {
        console.log('🔍 品質保証チェック:');
        for (const [characterName, positionData] of Object.entries(this.allPositionData)) {
            console.log(`  📊 ${characterName}:`, {
                left: positionData.left,
                top: positionData.top,
                width: positionData.width,
                height: positionData.height,
                transform: positionData.transform
            });
        }
    }
    
    // 🎯 動的キャラクターファイル生成（他モジュール用）
    generateCharacterFiles(characterName) {
        console.log(`📁 ${characterName}用ファイルパス生成`);
        
        const characterFiles = {
            spineFiles: [
                `assets/spine/characters/${characterName}/${characterName}.json`,
                `assets/spine/characters/${characterName}/${characterName}.atlas`,
                `assets/spine/characters/${characterName}/${characterName}.png`
            ],
            characterImageFiles: []
        };
        
        // キャラクター別実ファイル名マッピング
        if (characterName === 'purattokun') {
            characterFiles.characterImageFiles = [
                'assets/images/purattokunn.png'  // 実際のファイル名（nが2個）
            ];
        } else if (characterName === 'nezumi') {
            characterFiles.characterImageFiles = [
                'assets/images/nezumi.png'       // 標準命名
            ];
        } else {
            // その他のキャラクターは標準命名
            characterFiles.characterImageFiles = [
                `assets/images/${characterName}.png`
            ];
        }
        
        console.log('📋 生成されたファイルパス:', characterFiles);
        return characterFiles;
    }
}

console.log('✅ CharacterDetector モジュール読み込み完了');