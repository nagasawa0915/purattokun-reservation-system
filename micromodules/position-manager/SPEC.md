# Position Manager - 技術仕様書

> **🎯 Purpose**: 座標計算・位置管理の入出力仕様詳細定義  
> **📋 Version**: v4.0 マイクロモジュール設計準拠  
> **🔧 Type**: 純粋計算モジュール（副作用なし）

## 📊 入出力仕様概要

| モジュール | 入力形式 | 出力形式 | 責務 |
|-----------|---------|---------|------|
| `PurePositionManager` | 座標データ + 設定 | 変換済み座標セット | 基本座標変換 |
| `SpinePositioningSystem` | 配置設定 + 要素データ | Spine座標 + メタデータ | Spine専用座標系 |

## 🎯 PurePositionManager 仕様

### コンストラクタ入力

```typescript
interface PositionManagerConfig {
    containerWidth?: number;    // デフォルト: 800
    containerHeight?: number;   // デフォルト: 600  
    scale?: number;             // デフォルト: 1.0
    offsetX?: number;           // デフォルト: 0
    offsetY?: number;           // デフォルト: 0
}
```

**入力例:**
```javascript
const config = {
    containerWidth: 1200,
    containerHeight: 800,
    scale: 0.8,
    offsetX: 10,
    offsetY: 20
};
```

### execute() メソッド仕様

#### 入力仕様

```typescript
interface CoordinateInput {
    x: number | string;    // 数値、パーセント文字列対応
    y: number | string;    // 数値、パーセント文字列対応
    width?: number;        // 要素幅（オプション）
    height?: number;       // 要素高さ（オプション）
}
```

**有効な入力パターン:**
```javascript
// パターン1: 数値座標
{x: 100, y: 200}

// パターン2: パーセント文字列  
{x: "25%", y: "50%"}

// パターン3: 小数座標
{x: 0.25, y: 0.5}

// パターン4: サイズ込み
{x: 100, y: 200, width: 80, height: 60}
```

#### 出力仕様

```typescript
interface PositionResult {
    // 基本変換結果
    pixelPosition: {x: number, y: number};      // ピクセル座標
    percentPosition: {x: number, y: number};    // パーセント座標  
    scaledPosition: {x: number, y: number};     // スケール適用座標
    centeredPosition: {x: number, y: number};   // 中心基準座標
    transformedPosition: {x: number, y: number}; // 変換行列適用座標
    
    // メタデータ
    calculations: {
        inputType: string;           // "percent" | "pixel" | "decimal" | "unknown"
        scale: number;               // 適用されたスケール
        containerSize: {             // コンテナサイズ
            width: number;
            height: number;
        };
    };
}
```

**出力例:**
```javascript
{
    pixelPosition: {x: 300, y: 400},
    percentPosition: {x: 25, y: 50}, 
    scaledPosition: {x: 240, y: 320},
    centeredPosition: {x: -300, y: 0},
    transformedPosition: {x: 310, y: 420},
    calculations: {
        inputType: "percent",
        scale: 0.8,
        containerSize: {width: 1200, height: 800}
    }
}
```

#### エラー出力仕様

```typescript
interface PositionError {
    error: string;              // エラーメッセージ
    inputCoordinates: object;   // 入力データ
    config: object;             // 現在の設定
}
```

### ヘルパーメソッド仕様

#### setScale(scale: number) → void
- **入力**: `0`より大きい数値
- **例外**: `TypeError` - 無効な値の場合

#### setContainer(width: number, height: number) → void  
- **入力**: 正の数値のペア
- **例外**: `TypeError` - 無効な値の場合

#### setOffset(offsetX: number, offsetY: number) → void
- **入力**: 数値のペア（負値も可）
- **例外**: なし（parseFloat()で自動変換）

## 🎮 SpinePositioningSystem 仕様

### calculatePosition() メソッド仕様

#### 入力仕様

```typescript
interface SpinePositionInput {
    characterId: string;              // 必須: キャラクター識別子
    baseX: number;                    // 必須: 基準X座標
    baseY: number;                    // 必須: 基準Y座標
    placementPattern: PlacementType;  // "grid" | "random" | "manual"
    
    // 共通オプション
    zIndex?: number;                  // レイヤー順序（デフォルト: 1）
    scale?: number;                   // スケール（デフォルト: 1.0）
    parentWidth?: number;             // 親要素幅（デフォルト: 1200）
    parentHeight?: number;            // 親要素高さ（デフォルト: 800）
    
    // グリッド専用
    spacing?: number;                 // 間隔（デフォルト: 50）
    gridIndex?: number;               // 配置インデックス（デフォルト: 0）
    gridColumns?: number;             // 列数（デフォルト: 3）
    
    // ランダム専用
    randomRange?: number;             // ランダム範囲（デフォルト: 100）
}
```

**入力例:**
```javascript
// 手動配置
{
    characterId: "hero_001",
    baseX: 100,
    baseY: 200,
    placementPattern: "manual",
    zIndex: 5
}

// グリッド配置
{
    characterId: "enemy_001", 
    baseX: 50,
    baseY: 50,
    placementPattern: "grid",
    spacing: 80,
    gridIndex: 2,
    gridColumns: 4
}

// ランダム配置
{
    characterId: "item_001",
    baseX: 500,
    baseY: 300, 
    placementPattern: "random",
    randomRange: 150
}
```

#### 出力仕様

```typescript
interface SpinePositionResult {
    characterId: string;        // キャラクター識別子
    x: number;                  // Spine X座標（-0.5 ～ +0.5）
    y: number;                  // Spine Y座標（-0.5 ～ +0.5）
    zIndex: number;             // レイヤー順序
    scale: number;              // 最終スケール値
    
    metadata: {
        pattern: string;            // 使用された配置パターン
        calculatedAt: number;       // 計算タイムスタンプ
        baseCoordinates: {          // 基本座標
            x: number;
            y: number;
            pattern: string;
        };
    };
}
```

**出力例:**
```javascript
{
    characterId: "hero_001",
    x: -0.1667,              // Spine座標系
    y: 0.0,                  // Spine座標系
    zIndex: 5,
    scale: 1.0,
    metadata: {
        pattern: "manual",
        calculatedAt: 1693920000000,
        baseCoordinates: {
            x: 100,
            y: 400,
            pattern: "manual"
        }
    }
}
```

### 座標系スワップメソッド仕様

#### enterEditMode() 入力

```typescript
interface EditModeInput {
    characterId: string;         // 必須: 識別子
    left: string;                // CSS left値
    top: string;                 // CSS top値 
    width: string;               // CSS width値
    height: string;              // CSS height値
    transform?: string;          // CSS transform値
}
```

**入力例:**
```javascript
{
    characterId: "hero_001",
    left: "50%",
    top: "60%",
    width: "100px", 
    height: "80px",
    transform: "translate(-50%, -50%)"
}
```

#### enterEditMode() 出力

```typescript
interface EditModeResult {
    left: number;       // 絶対座標（px）
    top: number;        // 絶対座標（px）
    width: number;      // 幅（px）
    height: number;     // 高さ（px）
    transform: string;  // "none" 固定
}
```

#### exitEditMode() 入力

```typescript
interface ExitEditInput {
    left: number;       // 編集後の絶対X座標
    top: number;        // 編集後の絶対Y座標
    width: number;      // 編集後の幅
    height: number;     // 編集後の高さ
}
```

#### exitEditMode() 出力

```typescript
interface ExitEditResult {
    left: string;       // パーセント値（例: "25.0%"）
    top: string;        // パーセント値（例: "50.0%"）
    width: string;      // パーセント値（例: "8.3%"）
    height: string;     // パーセント値（例: "10.0%"）
    transform: string;  // "translate(-50%, -50%)" 固定
}
```

## ⚙️ 座標系変換仕様

### 座標系の定義

| 座標系 | 原点 | 単位 | 範囲 | 用途 |
|-------|------|------|------|------|
| **一般座標系** | 左上(0,0) | px | 0～コンテナサイズ | DOM要素配置 |
| **パーセント座標系** | 左上(0,0) | % | 0～100 | レスポンシブ配置 |
| **中心座標系** | 中央(0,0) | px | ±コンテナサイズ/2 | 回転・拡縮 |
| **Spine座標系** | 中央(0,0) | 正規化 | -0.5～+0.5 | Spine配置 |

### 変換計算式

#### パーセント → ピクセル
```
pixelX = (percentX / 100) * containerWidth
pixelY = (percentY / 100) * containerHeight
```

#### ピクセル → パーセント
```
percentX = (pixelX / containerWidth) * 100
percentY = (pixelY / containerHeight) * 100  
```

#### 一般座標系 → 中心座標系
```
centerX = pixelX - (containerWidth / 2)
centerY = pixelY - (containerHeight / 2)
```

#### 一般座標系 → Spine座標系  
```
spineX = (pixelX / containerWidth) - 0.5
spineY = (pixelY / containerHeight) - 0.5
```

#### 2D変換行列適用
```javascript
// 変換行列: [a, b, c, d, e, f]
transformedX = matrix[0] * x + matrix[2] * y + matrix[4] + offsetX
transformedY = matrix[1] * x + matrix[3] * y + matrix[5] + offsetY
```

## 🔧 内部状態管理

### PurePositionManager 内部状態

```typescript
interface InternalState {
    config: {
        containerWidth: number;
        containerHeight: number; 
        scale: number;
        offsetX: number;
        offsetY: number;
    };
    calculations: {
        lastResult: PositionResult | null;
        transformMatrix: number[];     // [a,b,c,d,e,f]
    };
}
```

### SpinePositioningSystem 内部状態

```typescript
interface SpineInternalState {
    coordinateSwapCache: Map<string, SwapData>;
    placementCache: Map<string, SpinePositionResult>;
    isInitialized: boolean;
}

interface SwapData {
    backup: EditModeInput;          // 元の座標系データ
    swapped: EditModeResult;        // スワップ後データ
    isSwapped: boolean;             // スワップ状態フラグ
    swappedAt: number;              // スワップタイムスタンプ
}
```

## 🚨 エラーハンドリング

### 例外の種類

| エラータイプ | 発生条件 | 対処法 |
|-------------|---------|--------|
| `TypeError` | 数値型以外の設定値 | 正しい型で再入力 |
| `RangeError` | 範囲外の値（スケール≤0等） | 有効範囲の値で再入力 |
| `ValidationError` | 必須フィールド不足 | 必要なフィールドを追加 |

### エラーメッセージ例

```javascript
// 設定エラー
"PurePositionManager: containerWidthは数値である必要があります"
"スケールは正の数値である必要があります"

// 座標エラー  
"座標データが無効です"
"x座標が必要です"

// スワップエラー
"無効な要素データ"
"スワップされていない要素"
```

## 🧪 品質保証・テスト仕様

### 単体テスト項目

#### PurePositionManager テスト
- [ ] コンストラクタ正常系・異常系
- [ ] 各座標変換メソッドの精度テスト
- [ ] スケール・オフセット設定テスト
- [ ] クリーンアップ完全性テスト
- [ ] 変換行列計算精度テスト

#### SpinePositioningSystem テスト  
- [ ] 各配置パターンの計算精度テスト
- [ ] 座標系スワップの往復精度テスト
- [ ] キャッシュ機能の正常動作テスト
- [ ] マルチキャラクター管理テスト
- [ ] エラーハンドリング動作テスト

### 精度要求仕様

| 計算項目 | 精度要求 | 許容誤差 |
|---------|---------|---------|
| 座標変換 | 小数点4桁 | ±0.0001 |
| パーセント計算 | 小数点1桁 | ±0.1% |
| Spine座標 | 小数点4桁 | ±0.0001 |
| スケール適用 | 小数点2桁 | ±0.01 |

### パフォーマンス要求

| 処理項目 | 最大処理時間 | メモリ使用量 |
|---------|-------------|-------------|
| 基本座標変換 | 1ms以下 | 1KB以下 |
| Spine座標計算 | 5ms以下 | 2KB以下 |  
| 座標系スワップ | 10ms以下 | 5KB以下 |
| 大量キャラクター（100体） | 100ms以下 | 50KB以下 |

## 📋 互換性・依存関係

### ブラウザ対応
- **Chrome**: 60+
- **Firefox**: 55+
- **Safari**: 12+
- **Edge**: 79+

### JavaScript環境
- **ES2018+**: 必須
- **Node.js**: 12+（オプション）
- **TypeScript**: 4.0+（オプション）

### 外部依存
- **なし**: 完全独立動作
- **Web API**: 使用しない（純粋計算のみ）
- **DOM API**: 使用しない（数値計算のみ）

## 🔄 バージョン管理・互換性

### セマンティックバージョニング

- **Major**: 互換性のない仕様変更
- **Minor**: 後方互換性のある機能追加  
- **Patch**: バグ修正・内部改善

### 現在のバージョン: v4.0.0

#### 破壊的変更（v3→v4）
- モジュール名変更: `PositioningSystem` → `SpinePositioningSystem`
- 設定オブジェクト構造変更
- 戻り値フォーマット変更

#### 移行ガイド
```javascript
// v3.x での使用方法
const old = new PositioningSystem();

// v4.x での使用方法  
const new = new SpinePositioningSystem();
```