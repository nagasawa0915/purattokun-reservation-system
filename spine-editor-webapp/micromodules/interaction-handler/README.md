# Interaction Handler マイクロモジュール

## 📋 概要

ユーザーインタラクション（マウス・キーボード・タッチ）の処理・管理を行う完全独立型マイクロモジュールです。v3.0のマウス・キーボード・タッチ操作機能を完全移植しています。

## 🎯 機能

### 主要機能
- **ドラッグ操作処理**: マウス・タッチドラッグ操作の計算・境界チェック
- **キーボード操作処理**: 矢印キー移動・制御キー処理（v3.0移植）
- **クリック・タップ処理**: 単発・ダブル・ジェスチャー判定
- **タッチジェスチャー**: スワイプ・ピンチ・タップ認識
- **インタラクション履歴**: 操作履歴・パターン分析
- **完全独立動作**: 他のモジュール・ライブラリに依存しない

### v3.0からの移植機能
- handleMouseDown/Move/Up → processDragInteraction()
- handleKeyDown → processKeyboardInteraction()
- キーボード矢印キー移動システム（0.1%/1%刻み）
- バウンディングボックス操作・競合回避システム
- タッチイベント対応・レスポンシブ操作

## 🔧 使用方法

### 基本的な使用例

```javascript
// モジュール初期化
const handler = new InteractionHandler();

// ドラッグ操作処理
const dragResult = handler.processInteraction({
    interactionType: "drag",
    targetId: "hero_001",
    eventData: {
        startPosition: { x: 100, y: 100 },
        clientX: 150,
        clientY: 120,
        deltaX: 50,
        deltaY: 20
    },
    config: {
        sensitivity: 1.0,
        boundaries: { minX: 0, maxX: 1200, minY: 0, maxY: 800 }
    }
});

// キーボード操作処理
const keyResult = handler.processInteraction({
    interactionType: "keyboard",
    targetId: "hero_001",
    eventData: {
        key: "ArrowLeft",
        shiftKey: true,
        currentPosition: { x: 200, y: 150 }
    },
    config: {
        sensitivity: 1.0,
        moveAmount: 5
    }
});

// クリーンアップ
handler.cleanup();
```

## 📥 入力仕様

### processInteraction()メソッド

```javascript
{
    interactionType: "drag",             // インタラクションタイプ（drag/click/keyboard/touch）
    targetId: "hero_001",                // 対象ID
    eventData: {
        clientX: 150,                    // マウス座標
        clientY: 200,
        key: "ArrowLeft",                // キー名（keyboard時）
        deltaX: 10,                      // 移動量（drag時）
        deltaY: 5,
        shiftKey: true,                  // 修飾キー（keyboard時）
        currentPosition: { x: 100, y: 100 } // 現在位置
    },
    config: {
        sensitivity: 1.0,                // 感度調整
        boundaries: {                    // 境界設定
            minX: 0, maxX: 1200, 
            minY: 0, maxY: 800 
        },
        moveAmount: 5,                   // キーボード移動量
        containerSize: { width: 1200, height: 800 } // コンテナサイズ
    }
}
```

### インタラクションタイプ別設定

#### ドラッグ操作
```javascript
{
    interactionType: "drag",
    eventData: {
        startPosition: { x: 100, y: 100 },
        clientX: 150,
        clientY: 120,
        deltaX: 50,
        deltaY: 20
    },
    config: {
        sensitivity: 1.0,               // ドラッグ感度
        boundaries: { minX: 0, maxX: 1200, minY: 0, maxY: 800 }
    }
}
```

#### キーボード操作（v3.0移植）
```javascript
{
    interactionType: "keyboard",
    eventData: {
        key: "ArrowLeft",               // ArrowLeft/Right/Up/Down, Escape, Enter, Space
        shiftKey: true,                 // Shift押下でx10移動
        currentPosition: { x: 200, y: 150 }
    },
    config: {
        sensitivity: 1.0,
        moveAmount: 5,                  // 基本移動量（Shift時は x10）
        boundaries: { minX: 0, maxX: 1200, minY: 0, maxY: 800 }
    }
}
```

#### クリック・タップ操作
```javascript
{
    interactionType: "click",
    eventData: {
        clientX: 300,
        clientY: 250,
        button: 0,                      // マウスボタン（0=左, 1=中, 2=右）
        timestamp: 1692345678901
    },
    config: {
        containerSize: { width: 1200, height: 800 },
        intensity: 1.0,                 // エフェクト強度
        effectDuration: 500             // エフェクト継続時間
    }
}
```

#### タッチジェスチャー
```javascript
{
    interactionType: "touch",
    eventData: {
        clientX: 400,
        clientY: 300,
        deltaX: 100,                    // スワイプ量
        deltaY: 50,
        pressure: 0.8,                  // タッチ圧力
        startTime: 1692345678000
    }
}
```

## 📤 出力仕様

### processInteraction()の出力

```javascript
{
    interactionId: "int_001",
    targetId: "hero_001", 
    type: "drag",                       // 処理されたインタラクションタイプ
    result: {
        deltaX: 45,                     // 実際の移動量（境界・感度調整後）
        deltaY: 18,
        newPosition: { x: 145, y: 118 }, // 新しい位置
        isValid: true,                   // 境界チェック結果
        dragState: {                     // ドラッグ状態（drag時のみ）
            isDragging: true,
            startPosition: { x: 100, y: 100 },
            currentPosition: { x: 145, y: 118 }
        }
    },
    processedAt: 1692345678901
}
```

### インタラクションタイプ別出力

#### ドラッグ操作結果
```javascript
{
    type: "drag",
    result: {
        deltaX: 45,
        deltaY: 18,
        newPosition: { x: 145, y: 118 },
        isValid: true,
        dragState: {
            isDragging: true,
            startPosition: { x: 100, y: 100 },
            updatedAt: 1692345678901
        }
    }
}
```

#### キーボード操作結果
```javascript
{
    type: "keyboard",
    result: {
        key: "ArrowLeft",
        deltaX: -10,                    // Shift押下で大きな移動
        deltaY: 0,
        newPosition: { x: 190, y: 150 },
        moveAmount: 10,                 // 実際の移動量
        isShiftPressed: true,
        isValid: true
    }
}
```

#### クリック操作結果
```javascript
{
    type: "click",
    result: {
        position: {
            x: 0.25,                    // 正規化座標（0.0-1.0）
            y: 0.3125,
            absoluteX: 300,             // 絶対座標
            absoluteY: 250
        },
        clickType: "single_click",      // single_click/double_click
        effect: {
            action: "select",
            intensity: 1.0,
            duration: 500
        },
        timestamp: 1692345678901,
        isValid: true
    }
}
```

#### タッチジェスチャー結果
```javascript
{
    type: "swipe",
    result: {
        direction: "right",             // up/down/left/right
        velocity: 2.5,                  // スワイプ速度
        deltaX: 100,
        deltaY: 50,
        distance: 111.8,                // スワイプ距離
        isValid: true
    }
}
```

## 🧪 テスト

### 単独テスト実行

```javascript
// 単独テスト（他のモジュール不要）
const testResult = InteractionHandler.test();
console.log('テスト結果:', testResult); // true/false
```

### テスト項目
- [x] ドラッグ操作処理（境界チェック・感度調整）
- [x] キーボード操作処理（矢印キー・制御キー）
- [x] クリック・タップ処理（単発・ダブル判定）
- [x] タッチジェスチャー（スワイプ・タップ認識）
- [x] 境界チェック・位置クランプ
- [x] インタラクション履歴管理
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
- ✅ **キーボード矢印キー移動**: 完全移植・0.1%/1%精密移動
- ✅ **ドラッグ操作システム**: 境界チェック・競合回避
- ✅ **タッチ対応**: レスポンシブ・ジェスチャー認識
- ✅ **モジュール競合回避**: バウンディングボックス等との排他制御

## 🔧 技術仕様

### キーボードマッピング（v3.0移植）

```javascript
keyboardMapping = {
    'ArrowLeft': { deltaX: -1, deltaY: 0, type: 'movement' },
    'ArrowRight': { deltaX: 1, deltaY: 0, type: 'movement' },
    'ArrowUp': { deltaX: 0, deltaY: -1, type: 'movement' },
    'ArrowDown': { deltaX: 0, deltaY: 1, type: 'movement' },
    'Escape': { action: 'cancel', type: 'control' },
    'Enter': { action: 'confirm', type: 'control' },
    'Space': { action: 'toggle', type: 'control' }
}
```

### タッチジェスチャー設定

```javascript
gestureConfig = {
    swipeThreshold: 50,         // スワイプ判定距離
    pinchThreshold: 10,         // ピンチ判定距離
    tapTimeout: 300,            // タップタイムアウト
    doubleTapInterval: 500      // ダブルタップ間隔
}
```

### 境界チェックアルゴリズム

```javascript
clampToBoundaries(position, boundaries) {
    return {
        x: Math.max(boundaries.minX, Math.min(position.x, boundaries.maxX)),
        y: Math.max(boundaries.minY, Math.min(position.y, boundaries.maxY))
    };
}
```

### ドラッグ感度調整

```javascript
adjustedDeltaX = originalDeltaX * sensitivity
adjustedDeltaY = originalDeltaY * sensitivity
```

### キーボード移動量計算（v3.0仕様）

```javascript
// 基本移動量（Shift押下で x10）
baseMoveAmount = isShiftPressed ? (moveAmount * 10) : moveAmount
finalDeltaX = keyMapping.deltaX * baseMoveAmount * sensitivity
finalDeltaY = keyMapping.deltaY * baseMoveAmount * sensitivity
```

## 🔄 v3.0との互換性

### 移植された機能
- handleMouseDown/Move/Up → processDragInteraction()
- handleKeyDown → processKeyboardInteraction()
- キーボード矢印キー移動（0.1%/1%刻み精密移動）
- バウンディングボックス競合回避システム
- タッチイベント・レスポンシブ対応

### 改良点
- DOM操作を排除 → 数値計算・状態管理のみ
- イベントリスナー管理を削除 → インスタンス内完結
- インタラクション履歴機能追加
- ジェスチャー認識機能拡充
- マルチタッチ対応準備

## 📁 関連ファイル

```
interaction-handler/
├── interaction-handler.js       # メイン処理
├── lib/                         # 内包ライブラリ（将来拡張用）
├── test/
│   ├── test-interactions.json  # テストインタラクション
│   └── expected-results.json   # 期待結果
├── README.md                   # このファイル
└── examples/
    └── interaction-patterns.html # インタラクションパターン例
```

## 🖱️ 使用例

### ドラッグ操作の処理

```javascript
const handler = new InteractionHandler();

// マウスドラッグ開始
const dragStart = handler.processInteraction({
    interactionType: "drag",
    targetId: "purattokun",
    eventData: {
        startPosition: { x: 100, y: 100 },
        clientX: 100,
        clientY: 100,
        deltaX: 0,
        deltaY: 0
    },
    config: {
        sensitivity: 1.0,
        boundaries: { minX: 0, maxX: 1200, minY: 0, maxY: 800 }
    }
});

// マウス移動中
const dragMove = handler.processInteraction({
    interactionType: "drag",
    targetId: "purattokun",
    eventData: {
        startPosition: { x: 100, y: 100 },
        clientX: 150,
        clientY: 120,
        deltaX: 50,
        deltaY: 20
    },
    config: {
        sensitivity: 1.0,
        boundaries: { minX: 0, maxX: 1200, minY: 0, maxY: 800 }
    }
});

console.log('新しい位置:', dragMove.result.newPosition);
```

### v3.0式キーボード操作

```javascript
// 矢印キー左移動（Shift押下で大きな移動）
const keyLeft = handler.processInteraction({
    interactionType: "keyboard",
    targetId: "purattokun",
    eventData: {
        key: "ArrowLeft",
        shiftKey: true,        // 大きな移動
        currentPosition: { x: 200, y: 150 }
    },
    config: {
        sensitivity: 1.0,
        moveAmount: 1,         // 基本移動量（%）
        boundaries: { minX: 0, maxX: 1200, minY: 0, maxY: 800 }
    }
});

console.log('移動量:', keyLeft.result.deltaX); // -10（Shift押下で x10）
console.log('新しい位置:', keyLeft.result.newPosition);
```

### タッチジェスチャー処理

```javascript
// スワイプ右操作
const swipeRight = handler.processInteraction({
    interactionType: "touch",
    targetId: "purattokun",
    eventData: {
        clientX: 400,
        clientY: 300,
        deltaX: 120,
        deltaY: 10,
        pressure: 0.8,
        startTime: Date.now() - 200
    }
});

console.log('スワイプ方向:', swipeRight.result.direction); // "right"
console.log('スワイプ速度:', swipeRight.result.velocity);
```