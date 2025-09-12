# Position Manager - 座標計算・位置管理マイクロモジュール

> **🎯 責務**: 座標変換・位置計算・スケール計算の専用モジュール  
> **⚡ 特徴**: 外部依存ゼロ・数値のみ入出力・完全独立動作  
> **🔧 設計**: v4マイクロモジュール設計準拠

## 📋 概要

Position Managerは、Spineキャラクターや要素の座標変換・位置計算を担う純粋計算モジュールです。DOM操作やCanvas描画は行わず、数値計算のみに特化しています。

### ✨ 主要機能

- **座標変換**: パーセント ⇔ ピクセル変換
- **位置計算**: 中心基準・絶対座標・相対座標変換
- **スケール計算**: 要素サイズの拡大縮小計算
- **配置システム**: グリッド・ランダム・手動配置
- **座標系スワップ**: v3.0技術移植による複雑座標系対応

## 🚀 使用方法

### 基本的な座標変換

```javascript
// 1. PurePositionManager - 基本座標変換
const manager = new PurePositionManager({
    containerWidth: 800,
    containerHeight: 600,
    scale: 1.0,
    offsetX: 0,
    offsetY: 0
});

// 座標変換実行
const result = manager.execute({
    x: 50,  // 50% または 50px
    y: 75   // 75% または 75px
});

console.log(result.pixelPosition);    // ピクセル値
console.log(result.percentPosition);  // パーセント値
console.log(result.scaledPosition);   // スケール適用値
console.log(result.centeredPosition); // 中心基準値
```

### Spine専用座標系変換

```javascript
// 2. SpinePositioningSystem - Spine座標系対応
const spinePositioner = new SpinePositioningSystem();

// Spine配置計算
const spineResult = spinePositioner.calculatePosition({
    characterId: "hero_001",
    baseX: 100,
    baseY: 200,
    placementPattern: "manual",
    zIndex: 5,
    scale: 0.8
});

console.log(spineResult.x, spineResult.y); // Spine座標系（-0.5 ～ +0.5）
```

### 座標系スワップ（v3.0技術）

```javascript
// 複雑座標系 → シンプル絶対座標への変換
const editCoords = spinePositioner.enterEditMode({
    characterId: "hero_001",
    left: "50%",
    top: "60%", 
    width: "100px",
    height: "80px",
    transform: "translate(-50%, -50%)"
});

// 編集後の復元
const restored = spinePositioner.exitEditMode("hero_001", {
    left: 150,
    top: 200,
    width: 120,
    height: 100
});
```

## 📚 API リファレンス

### PurePositionManager

| メソッド | 説明 | 戻り値 |
|---------|------|--------|
| `execute(coords)` | 座標変換メイン処理 | `{pixelPosition, percentPosition, scaledPosition, centeredPosition, transformedPosition, calculations}` |
| `getState()` | 現在の状態取得 | `{config, lastCalculation, matrixValues}` |
| `setScale(scale)` | スケール設定更新 | `void` |
| `setContainer(w, h)` | コンテナサイズ設定 | `void` |
| `setOffset(x, y)` | オフセット設定 | `void` |
| `cleanup()` | 完全リセット | `boolean` |

### SpinePositioningSystem

| メソッド | 説明 | 戻り値 |
|---------|------|--------|
| `calculatePosition(input)` | Spine座標計算 | `{characterId, x, y, zIndex, scale, metadata}` |
| `enterEditMode(elementData)` | 座標系スワップ（編集開始） | `{left, top, width, height, transform}` |
| `exitEditMode(id, editedData)` | 座標系復元（編集終了） | `{left, top, width, height, transform}` |
| `getState()` | モジュール状態取得 | `{swappedElements, placedElements, isInitialized}` |
| `cleanup()` | 完全クリーンアップ | `void` |

## 🔄 座標変換関数

### パーセント ⇔ ピクセル変換

```javascript
// パーセント → ピクセル
percentToPixel({x: 25, y: 50})
// → {x: 200, y: 300} (800x600コンテナの場合)

// ピクセル → パーセント  
pixelToPercent({x: 200, y: 300})
// → {x: 25, y: 50}
```

### スケール計算

```javascript
applyScale({x: 100, y: 200}) // scale: 0.5の場合
// → {x: 50, y: 100}
```

### 中心点基準変換

```javascript
toCenterOrigin({x: 400, y: 300}) // 800x600コンテナの場合
// → {x: 0, y: 0} (中心点)
```

### 2D変換行列適用

```javascript
applyTransform({x: 100, y: 200})
// → 変換行列 + オフセット適用座標
```

## 🧪 テスト・検証

### 単体テスト実行

```javascript
// PurePositionManager テスト
PurePositionManager.test();

// SpinePositioningSystem テスト  
SpinePositioningSystem.test();
```

### 手動テスト例

```javascript
// 基本テスト
const manager = new PurePositionManager({
    containerWidth: 1200,
    containerHeight: 800,
    scale: 0.8
});

const testResult = manager.execute({x: 50, y: 50});
console.assert(testResult.pixelPosition.x === 600, 'パーセント変換失敗');
console.assert(testResult.pixelPosition.y === 400, 'パーセント変換失敗');
```

## 🎯 配置パターン

### グリッド配置

```javascript
calculatePosition({
    placementPattern: "grid",
    baseX: 100,
    baseY: 100,
    spacing: 50,
    gridIndex: 2,      // 配置インデックス
    gridColumns: 3     // 列数
});
```

### ランダム配置

```javascript
calculatePosition({
    placementPattern: "random",
    baseX: 500,
    baseY: 300,
    randomRange: 200  // ランダム範囲
});
```

### 手動配置

```javascript
calculatePosition({
    placementPattern: "manual",
    baseX: 200,       // 直接指定
    baseY: 150
});
```

## ⚙️ 設定オプション

### PurePositionManager 設定

```javascript
const config = {
    containerWidth: 1200,     // コンテナ幅（px）
    containerHeight: 800,     // コンテナ高さ（px）
    scale: 1.0,               // 全体スケール
    offsetX: 0,               // X軸オフセット
    offsetY: 0                // Y軸オフセット
};
```

### SpinePositioningSystem 設定

```javascript
const spineConfig = {
    characterId: "hero_001",          // キャラクター識別子
    baseX: 100,                       // 基準X座標
    baseY: 200,                       // 基準Y座標
    placementPattern: "manual",       // 配置パターン
    spacing: 50,                      // グリッド間隔
    zIndex: 5,                        // レイヤー順序
    scale: 1.0,                       // キャラクタースケール
    parentWidth: 1200,                // 親要素幅
    parentHeight: 800                 // 親要素高さ
};
```

## 🚨 重要な制約・注意点

### 設計原則
- **外部依存禁止**: 他のモジュールやグローバル変数に依存しない
- **純粋計算**: DOM操作・Canvas描画・アニメーション制御は行わない
- **数値のみ**: 入出力は数値のみで、副作用を起こさない
- **完全復元**: `cleanup()`で必ず元の状態に戻る

### 座標系の理解
- **一般座標系**: 左上原点（0,0）、右下が正の方向
- **Spine座標系**: 中心原点（0,0）、-0.5～+0.5の範囲
- **パーセント座標**: 0～100の範囲、親要素基準
- **ピクセル座標**: 絶対値、画面ピクセル単位

### パフォーマンス
- キャッシュ機能により同一計算の高速化
- 単位行列による効率的な変換計算
- メモリリーク防止のための適切なクリーンアップ

## 🔗 関連モジュール

- **spine-loader**: Spineローダー（座標設定に使用）
- **ui-manager**: UI管理（位置情報表示に使用）
- **bounding-box**: 境界ボックス（座標検証に使用）

## 📈 バージョン履歴

- **v4.0**: マイクロモジュール設計対応、外部依存ゼロ化
- **v3.0**: 座標系スワップ技術追加、複雑座標系対応
- **v2.0**: Spine座標系専用機能追加
- **v1.0**: 基本座標変換機能