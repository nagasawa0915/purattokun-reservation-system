# Positioning System マイクロモジュール

## 📋 概要

Spineキャラクターの座標・配置管理を行う完全独立型マイクロモジュールです。v3.0の座標系スワップ技術を完全移植しています。

## 🎯 機能

### 主要機能
- **座標・配置計算**: グリッド・ランダム・手動配置パターン対応
- **座標系スワップ**: v3.0技術移植（複雑座標→シンプル座標→復元）
- **Spine座標系変換**: 一般座標系からSpine座標系（0.0中心）への変換
- **完全独立動作**: 他のモジュール・ライブラリに依存しない

### v3.0からの移植機能
- SpineEditSystem.coordinateSwap.enterEditMode() → enterEditMode()
- SpineEditSystem.coordinateSwap.exitEditMode() → exitEditMode()
- 座標レイヤー競合回避技術
- transform競合排除システム

## 🔧 使用方法

### 基本的な使用例

```javascript
// モジュール初期化
const positioner = new PositioningSystem();

// 基本配置計算
const position = positioner.calculatePosition({
    characterId: "hero_001",
    baseX: 100,
    baseY: 200,
    placementPattern: "grid",
    spacing: 50,
    zIndex: 5
});

// 座標系スワップ（編集開始）
const swappedCoords = positioner.enterEditMode({
    characterId: "hero_001",
    left: "50%",
    top: "60%",
    width: "100px",
    height: "80px",
    transform: "translate(-50%, -50%)"
});

// 座標系復元（編集終了）
const restoredCoords = positioner.exitEditMode("hero_001", {
    left: 150,
    top: 200,
    width: 120,
    height: 100
});

// クリーンアップ
positioner.cleanup();
```

## 📥 入力仕様

### calculatePosition()メソッド

```javascript
{
    characterId: "hero_001",
    baseX: 100,                      // 基準X座標
    baseY: 200,                      // 基準Y座標
    placementPattern: "grid",        // 配置パターン（grid/random/manual）
    spacing: 50,                     // 間隔（gridパターン時）
    zIndex: 5,                       // レイヤー順序
    scale: 1.0,                      // スケール（オプション）
    parentWidth: 1200,               // 親要素幅（オプション）
    parentHeight: 800                // 親要素高（オプション）
}
```

### 配置パターン別設定

#### グリッド配置
```javascript
{
    placementPattern: "grid",
    gridIndex: 0,                    // グリッド内位置
    gridColumns: 3,                  // 列数
    spacing: 50                      // 間隔
}
```

#### ランダム配置
```javascript
{
    placementPattern: "random",
    randomRange: 100                 // ランダム範囲
}
```

#### 手動配置
```javascript
{
    placementPattern: "manual",
    baseX: 100,                      // 直接指定
    baseY: 200
}
```

### enterEditMode()メソッド

```javascript
{
    characterId: "hero_001",
    left: "50%",                     // CSS left値
    top: "60%",                      // CSS top値
    width: "100px",                  // CSS width値
    height: "80px",                  // CSS height値
    transform: "translate(-50%, -50%)" // CSS transform値
}
```

## 📤 出力仕様

### calculatePosition()の出力

```javascript
{
    characterId: "hero_001",
    x: 0.0,                          // Spine座標系準拠（中心基準）
    y: 0.0,                          // Spine座標系準拠（中心基準）
    zIndex: 5,
    scale: 1.0,
    metadata: {
        pattern: "grid",
        calculatedAt: 1692345678901,
        baseCoordinates: {
            x: 100,
            y: 200,
            pattern: "grid"
        }
    }
}
```

### enterEditMode()の出力

```javascript
{
    left: 150,                       // 絶対座標（px）
    top: 200,                        // 絶対座標（px）
    width: 100,                      // 絶対サイズ（px）
    height: 80,                      // 絶対サイズ（px）
    transform: "none"                // transform競合排除
}
```

### exitEditMode()の出力

```javascript
{
    left: "52.5%",                   // 中心基準%値
    top: "65.0%",                    // 中心基準%値
    width: "8.3%",                   // %値
    height: "10.0%",                 // %値
    transform: "translate(-50%, -50%)" // v3.0標準transform
}
```

## 🧪 テスト

### 単独テスト実行

```javascript
// 単独テスト（他のモジュール不要）
const testResult = PositioningSystem.test();
console.log('テスト結果:', testResult); // true/false
```

### テスト項目
- [x] 基本配置計算（手動・グリッド・ランダム）
- [x] 座標系スワップ（複雑→シンプル）
- [x] 座標系復元（シンプル→元形式）
- [x] Spine座標系変換（一般→Spine）
- [x] 入力検証・エラーハンドリング
- [x] クリーンアップ動作

## 📊 設計原則

### マイクロモジュール原則遵守
- ✅ **完全独立**: 外部依存ゼロ
- ✅ **数値のみ入出力**: オブジェクト参照排除
- ✅ **cleanup保証**: 完全復元可能
- ✅ **単独テスト**: 他モジュール不要
- ✅ **環境非依存**: どの環境でも同一動作

### v3.0技術継承
- ✅ **座標系スワップ技術**: 完全移植・改良
- ✅ **transform競合排除**: 完全対応
- ✅ **中心基準座標**: Spine仕様準拠
- ✅ **小数点精度**: 4桁精度維持

## 🔧 技術仕様

### 座標系変換アルゴリズム

#### 1. 一般座標→Spine座標
```javascript
spineX = (generalX / parentWidth) - 0.5    // -0.5 ～ +0.5
spineY = (generalY / parentHeight) - 0.5   // -0.5 ～ +0.5
```

#### 2. 複雑座標→シンプル座標（v3.0移植）
```javascript
// CSS複雑形式: 50% + translate(-50%, -50%)
// ↓
// 絶対座標形式: 150px (transform: none)
```

#### 3. シンプル座標→元座標（v3.0移植）
```javascript
// 絶対座標: left=150px, top=200px
// ↓
// 元形式: left=52.5%, top=65.0%, transform=translate(-50%, -50%)
```

### 配置パターンアルゴリズム

#### グリッド配置
```javascript
gridX = baseX + (index % columns) * spacing
gridY = baseY + Math.floor(index / columns) * spacing
```

#### ランダム配置
```javascript
randomX = baseX + (Math.random() - 0.5) * range
randomY = baseY + (Math.random() - 0.5) * range
```

## 🔄 v3.0との互換性

### 移植された機能
- coordinateSwap.enterEditMode() → enterEditMode()
- coordinateSwap.exitEditMode() → exitEditMode()
- coords.pxToPercent(), percentToPx() → 内部ユーティリティ
- バックアップ・復元機能完全移植

### 改良点
- DOM操作を排除 → 数値計算のみ
- グローバル状態を削除 → インスタンス内完結
- エラーハンドリング強化
- テスタビリティ向上

## 📁 関連ファイル

```
positioning-system/
├── positioning-system.js       # メイン処理
├── lib/                        # 内包ライブラリ（将来拡張用）
├── test/
│   ├── test-data.json         # テストデータ
│   └── expected-output.json   # 期待出力
├── README.md                  # このファイル
└── examples/
    └── coordinate-conversion.html # 座標変換例
```