// 🎯 Positioning System - Spine座標・配置管理マイクロモジュール
// 設計原則: 完全独立・外部依存ゼロ・数値のみ入出力

console.log('🚀 Positioning System マイクロモジュール読み込み');

/**
 * Spine座標・配置管理モジュール
 * v3.0の座標系スワップ技術を完全移植
 * 
 * 入力仕様:
 * {
 *   characterId: "hero_001",
 *   baseX: 100,                      // 基準X座標
 *   baseY: 200,                      // 基準Y座標
 *   placementPattern: "grid",        // 配置パターン（grid/random/manual）
 *   spacing: 50,                     // 間隔（gridパターン時）
 *   zIndex: 5                        // レイヤー順序
 * }
 * 
 * 出力仕様:
 * {
 *   characterId: "hero_001",
 *   x: 0.0,                          // Spine座標系準拠（中心基準）
 *   y: 0.0,                          // Spine座標系準拠（中心基準）
 *   zIndex: 5,
 *   scale: 1.0
 * }
 */
class PositioningSystem {
    constructor() {
        // 完全独立：外部依存ゼロ
        this.coordinateSwapCache = new Map();
        this.placementCache = new Map();
        this.isInitialized = false;
    }

    /**
     * 座標・配置計算メイン関数
     * @param {Object} input - 配置設定
     * @returns {Object} 計算されたSpine座標データ
     */
    calculatePosition(input) {
        console.log('🎯 座標・配置計算開始', input);

        // 入力検証
        const validatedInput = this.validateInput(input);
        if (!validatedInput) {
            return null;
        }

        // 配置パターンに応じた座標計算
        const baseCoordinates = this.calculateBaseCoordinates(validatedInput);
        
        // Spine座標系（0.0中心）への変換
        const spineCoordinates = this.convertToSpineCoordinates(baseCoordinates, validatedInput);

        // 結果データ構築
        const result = {
            characterId: validatedInput.characterId,
            x: spineCoordinates.x,
            y: spineCoordinates.y,
            zIndex: validatedInput.zIndex,
            scale: spineCoordinates.scale || 1.0,
            metadata: {
                pattern: validatedInput.placementPattern,
                calculatedAt: Date.now(),
                baseCoordinates: baseCoordinates
            }
        };

        // キャッシュに保存
        this.placementCache.set(validatedInput.characterId, result);

        console.log('✅ 座標・配置計算完了', result);
        return result;
    }

    /**
     * v3.0座標系スワップ技術移植
     * 複雑座標系→シンプル絶対座標への変換
     * @param {Object} elementData - 要素データ
     * @returns {Object} スワップされた座標データ
     */
    enterEditMode(elementData) {
        console.log('🔄 座標系スワップ開始 - 複雑座標→シンプル座標', elementData);

        // 入力検証
        if (!elementData || !elementData.characterId) {
            console.error('❌ 無効な要素データ');
            return null;
        }

        // 現在の座標系をバックアップ
        const backup = {
            left: elementData.left || '0px',
            top: elementData.top || '0px',
            width: elementData.width || '100px',
            height: elementData.height || '100px',
            transform: elementData.transform || 'none'
        };

        // 描画位置を数値として計算（getBoundingClientRect相当）
        const computedPosition = this.computeElementPosition(elementData);

        // シンプルな絶対座標に変換
        const swappedCoordinates = {
            left: computedPosition.left,
            top: computedPosition.top,
            width: computedPosition.width,
            height: computedPosition.height,
            transform: 'none' // transform競合を完全排除
        };

        // スワップ状態をキャッシュ
        this.coordinateSwapCache.set(elementData.characterId, {
            backup: backup,
            swapped: swappedCoordinates,
            isSwapped: true,
            swappedAt: Date.now()
        });

        console.log('✅ シンプル座標に変換完了', swappedCoordinates);
        return swappedCoordinates;
    }

    /**
     * v3.0座標系復元技術移植
     * シンプル絶対座標→元の複雑座標系への変換
     * @param {string} characterId - キャラクターID
     * @param {Object} editedData - 編集後の座標データ
     * @returns {Object} 復元された座標データ
     */
    exitEditMode(characterId, editedData) {
        console.log('🔄 座標系復元開始 - シンプル座標→元座標系', { characterId, editedData });

        // スワップ状態確認
        const swapData = this.coordinateSwapCache.get(characterId);
        if (!swapData || !swapData.isSwapped) {
            console.warn('⚠️ スワップされていない要素');
            return null;
        }

        // 編集後の絶対座標を取得
        const editedPosition = this.extractPosition(editedData);

        // 親要素サイズを仮定（実際の実装では動的取得）
        const parentSize = { width: 1200, height: 800 }; // デフォルト値

        // 元の座標系形式（%値 + transform）に変換
        const restoredCoordinates = this.convertToOriginalCoordinateSystem(editedPosition, parentSize);

        // スワップ状態をクリア
        this.coordinateSwapCache.delete(characterId);

        console.log('✅ 元座標系に復元完了', restoredCoordinates);
        return restoredCoordinates;
    }

    /**
     * 配置パターンに応じた基本座標計算
     * @param {Object} config - 配置設定
     * @returns {Object} 基本座標
     */
    calculateBaseCoordinates(config) {
        switch (config.placementPattern) {
            case 'grid':
                return this.calculateGridPosition(config);
            case 'random':
                return this.calculateRandomPosition(config);
            case 'manual':
                return this.calculateManualPosition(config);
            default:
                return this.calculateManualPosition(config);
        }
    }

    /**
     * グリッド配置計算
     * @param {Object} config - 配置設定
     * @returns {Object} グリッド座標
     */
    calculateGridPosition(config) {
        const gridX = config.baseX + (config.gridIndex % config.gridColumns) * config.spacing;
        const gridY = config.baseY + Math.floor(config.gridIndex / config.gridColumns) * config.spacing;

        return {
            x: gridX,
            y: gridY,
            pattern: 'grid'
        };
    }

    /**
     * ランダム配置計算
     * @param {Object} config - 配置設定
     * @returns {Object} ランダム座標
     */
    calculateRandomPosition(config) {
        const randomX = config.baseX + (Math.random() - 0.5) * config.randomRange;
        const randomY = config.baseY + (Math.random() - 0.5) * config.randomRange;

        return {
            x: randomX,
            y: randomY,
            pattern: 'random'
        };
    }

    /**
     * 手動配置計算
     * @param {Object} config - 配置設定
     * @returns {Object} 手動座標
     */
    calculateManualPosition(config) {
        return {
            x: config.baseX,
            y: config.baseY,
            pattern: 'manual'
        };
    }

    /**
     * 一般座標系からSpine座標系への変換
     * Spine特有の0.0中心配置ルールに準拠
     * @param {Object} coordinates - 基本座標
     * @param {Object} config - 設定
     * @returns {Object} Spine座標
     */
    convertToSpineCoordinates(coordinates, config) {
        // 親要素サイズ（実際の実装では動的取得）
        const parentWidth = config.parentWidth || 1200;
        const parentHeight = config.parentHeight || 800;

        // Spine座標系：中心基準（-0.5 ～ +0.5）
        const spineX = (coordinates.x / parentWidth) - 0.5;
        const spineY = (coordinates.y / parentHeight) - 0.5;

        return {
            x: parseFloat(spineX.toFixed(4)), // 小数点4桁精度
            y: parseFloat(spineY.toFixed(4)),
            scale: config.scale || 1.0
        };
    }

    /**
     * 要素位置計算（getBoundingClientRect相当）
     * @param {Object} elementData - 要素データ
     * @returns {Object} 計算された位置
     */
    computeElementPosition(elementData) {
        // CSS値をパース
        const left = this.parsePixelValue(elementData.left || '0px');
        const top = this.parsePixelValue(elementData.top || '0px');
        const width = this.parsePixelValue(elementData.width || '100px');
        const height = this.parsePixelValue(elementData.height || '100px');

        // transform考慮の位置計算
        let computedLeft = left;
        let computedTop = top;

        if (elementData.transform && elementData.transform.includes('translate')) {
            const translateValues = this.parseTransformTranslate(elementData.transform);
            computedLeft += translateValues.x;
            computedTop += translateValues.y;
        }

        return {
            left: computedLeft,
            top: computedTop,
            width: width,
            height: height
        };
    }

    /**
     * 元の座標系形式への変換
     * @param {Object} position - 編集後位置
     * @param {Object} parentSize - 親要素サイズ
     * @returns {Object} 元座標系データ
     */
    convertToOriginalCoordinateSystem(position, parentSize) {
        // 中心基準の%値に変換
        const leftPercent = ((position.left + position.width/2) / parentSize.width) * 100;
        const topPercent = ((position.top + position.height/2) / parentSize.height) * 100;
        const widthPercent = (position.width / parentSize.width) * 100;
        const heightPercent = (position.height / parentSize.height) * 100;

        return {
            left: leftPercent.toFixed(1) + '%',
            top: topPercent.toFixed(1) + '%',
            width: widthPercent.toFixed(1) + '%',
            height: heightPercent.toFixed(1) + '%',
            transform: 'translate(-50%, -50%)' // v3.0標準transform
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
            characterId: input.characterId || 'unknown',
            baseX: parseFloat(input.baseX) || 0,
            baseY: parseFloat(input.baseY) || 0,
            placementPattern: input.placementPattern || 'manual',
            spacing: parseFloat(input.spacing) || 50,
            zIndex: parseInt(input.zIndex) || 1,
            scale: parseFloat(input.scale) || 1.0,
            parentWidth: parseInt(input.parentWidth) || 1200,
            parentHeight: parseInt(input.parentHeight) || 800
        };

        // グリッド用設定
        if (validated.placementPattern === 'grid') {
            validated.gridIndex = parseInt(input.gridIndex) || 0;
            validated.gridColumns = parseInt(input.gridColumns) || 3;
        }

        // ランダム用設定
        if (validated.placementPattern === 'random') {
            validated.randomRange = parseFloat(input.randomRange) || 100;
        }

        return validated;
    }

    /**
     * ユーティリティ: px値をパース
     * @param {string} value - CSS値
     * @returns {number} 数値
     */
    parsePixelValue(value) {
        return parseFloat(value.toString().replace('px', '')) || 0;
    }

    /**
     * ユーティリティ: transform translateをパース
     * @param {string} transform - transformCSS値
     * @returns {Object} x, y値
     */
    parseTransformTranslate(transform) {
        const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (match) {
            return {
                x: this.parsePixelValue(match[1]),
                y: this.parsePixelValue(match[2])
            };
        }
        return { x: 0, y: 0 };
    }

    /**
     * 位置データ抽出
     * @param {Object} data - データオブジェクト
     * @returns {Object} 位置データ
     */
    extractPosition(data) {
        return {
            left: this.parsePixelValue(data.left || data.x || 0),
            top: this.parsePixelValue(data.top || data.y || 0),
            width: this.parsePixelValue(data.width || 100),
            height: this.parsePixelValue(data.height || 100)
        };
    }

    /**
     * モジュール状態取得
     * @returns {Object} 現在の状態
     */
    getState() {
        return {
            swappedElements: this.coordinateSwapCache.size,
            placedElements: this.placementCache.size,
            isInitialized: this.isInitialized
        };
    }

    /**
     * 完全クリーンアップ
     * マイクロモジュール設計の必須メソッド
     */
    cleanup() {
        console.log('🧹 Positioning System クリーンアップ実行');
        
        this.coordinateSwapCache.clear();
        this.placementCache.clear();
        this.isInitialized = false;
        
        console.log('✅ Positioning System クリーンアップ完了');
    }

    /**
     * 単独テスト（マイクロモジュール設計の必須メソッド）
     * @returns {boolean} テスト結果
     */
    static test() {
        console.log('🧪 Positioning System 単独テスト開始');
        
        try {
            const positioner = new PositioningSystem();

            // テスト1: 基本配置計算
            const result1 = positioner.calculatePosition({
                characterId: "test_001",
                baseX: 100,
                baseY: 200,
                placementPattern: "manual",
                zIndex: 5
            });

            if (!result1 || result1.characterId !== "test_001") {
                throw new Error('基本配置計算テスト失敗');
            }

            // テスト2: 座標系スワップ
            const swapResult = positioner.enterEditMode({
                characterId: "test_002",
                left: "50%",
                top: "60%",
                width: "100px",
                height: "80px",
                transform: "translate(-50%, -50%)"
            });

            if (!swapResult) {
                throw new Error('座標系スワップテスト失敗');
            }

            // テスト3: 座標系復元
            const restoreResult = positioner.exitEditMode("test_002", {
                left: 150,
                top: 200,
                width: 120,
                height: 100
            });

            if (!restoreResult) {
                throw new Error('座標系復元テスト失敗');
            }

            // テスト4: クリーンアップ
            positioner.cleanup();
            const state = positioner.getState();
            
            if (state.swappedElements !== 0 || state.placedElements !== 0) {
                throw new Error('クリーンアップテスト失敗');
            }

            console.log('✅ Positioning System 単独テスト成功');
            return true;

        } catch (error) {
            console.error('❌ Positioning System 単独テスト失敗:', error);
            return false;
        }
    }
}

// モジュールエクスポート（環境非依存）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PositioningSystem;
} else {
    window.PositioningSystem = PositioningSystem;
}

console.log('✅ Positioning System マイクロモジュール読み込み完了');