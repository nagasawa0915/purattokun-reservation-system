# Animation Sequencer マイクロモジュール

## 📋 概要

Spineアニメーションのタイミング・シーケンス制御を行う完全独立型マイクロモジュールです。v3.0のSpineAnimationControllerからアニメーション制御機能を完全移植しています。

## 🎯 機能

### 主要機能
- **アニメーションシーケンス生成**: 単発・チェーン・ループ・トランジション対応
- **タイミング制御**: 遅延・継続時間・フレームレート管理
- **自動遷移システム**: v3.0の自然遷移アニメーション（syutugen→taiki等）
- **プログレス追跡**: リアルタイム進行状況監視
- **完全独立動作**: 他のモジュール・ライブラリに依存しない

### v3.0からの移植機能
- SpineAnimationController.playSequence() → generateSequence() + executeSequence()
- SpineAnimationController.playAnimation() → executeSingleAnimation()
- アニメーション完了リスナー → 内蔵プログレス追跡システム
- プレースホルダーアニメーション対応

## 🔧 使用方法

### 基本的な使用例

```javascript
// モジュール初期化
const sequencer = new AnimationSequencer();

// 基本アニメーションシーケンス
const sequence = sequencer.generateSequence({
    characterId: "hero_001",
    animationName: "taiki",
    sequenceType: "single",
    timingConfig: {
        delay: 1000,
        duration: 3000,
        loop: true
    }
});

// シーケンス実行
const result = sequencer.executeSequence(sequence.sequenceId);

// タイミング計算
const timing = sequencer.calculateTiming({
    characterId: "hero_001",
    delay: 500,
    duration: 2000,
    fadeIn: true,
    fadeDuration: 1000
});

// クリーンアップ
sequencer.cleanup();
```

## 📥 入力仕様

### generateSequence()メソッド

```javascript
{
    characterId: "hero_001",
    animationName: "taiki",             // アニメーション名
    sequenceType: "single",             // シーケンスタイプ（single/chain/loop/transition）
    timingConfig: {
        delay: 1500,                    // 開始遅延（ms）
        duration: 2000,                 // 継続時間（ms）
        loop: true                      // ループフラグ
    },
    chain: [                            // チェーンシーケンス用（オプション）
        { animationName: "syutugen", duration: 2000 },
        { animationName: "taiki", duration: 3000, loop: true }
    ],
    fadeIn: true,                       // フェードイン効果（オプション）
    fadeDelay: 1000,                    // フェード遅延（オプション）
    fadeDuration: 2000                  // フェード継続時間（オプション）
}
```

### シーケンスタイプ別設定

#### 単発アニメーション
```javascript
{
    sequenceType: "single",
    animationName: "click",
    timingConfig: { duration: 1000, loop: false }
}
```

#### チェーンアニメーション
```javascript
{
    sequenceType: "chain",
    chain: [
        { animationName: "syutugen", duration: 2000 },
        { animationName: "taiki", duration: 3000, loop: true }
    ]
}
```

#### トランジションアニメーション（v3.0自然遷移）
```javascript
{
    sequenceType: "transition",
    animationName: "syutugen",          // 自動的にtaikiに遷移
    timingConfig: { duration: 2000, loop: false }
}
```

### calculateTiming()メソッド

```javascript
{
    characterId: "hero_001",
    delay: 500,                         // 開始遅延（ms）
    duration: 2000,                     // 継続時間（ms）
    interval: 16,                       // 更新間隔（ms、60fps=16ms）
    animationType: "idle",              // アニメーション種別
    fadeIn: true,                       // フェードイン有効
    fadeDelay: 1000,                    // フェード遅延
    fadeDuration: 2000,                 // フェード継続時間
    fadeEasing: "ease-in-out"           // フェードイージング
}
```

## 📤 出力仕様

### generateSequence()の出力

```javascript
{
    sequenceId: "seq_001",
    characterId: "hero_001",
    animationName: "taiki",
    sequenceType: "single",
    timing: {
        delay: 1500,
        duration: 2000,
        loop: true
    },
    createdAt: 1692345678901,
    // トランジション用
    transition: {
        fromAnimation: "syutugen",
        toAnimation: "taiki",
        transitionType: "appearance"
    }
}
```

### executeSequence()の出力

```javascript
{
    sequenceId: "seq_001",
    animationName: "taiki",
    status: "playing",                  // playing/paused/completed/failed
    timingData: {
        startTime: 1692345678901,
        endTime: 1692345680901,
        progress: 0.5                   // 進行率（0.0-1.0）
    },
    executedAt: 1692345678901
}
```

### calculateTiming()の出力

```javascript
{
    characterId: "hero_001",
    timingData: {
        delay: 500,
        duration: 2000,
        interval: 16,
        totalFrames: 125,               // 総フレーム数
        fps: 62.5,                      // フレームレート
        fadeIn: {
            delay: 1000,
            duration: 2000,
            easing: "ease-in-out"
        },
        getProgressAt: function(currentTime, startTime) // プログレス計算関数
    },
    calculatedAt: 1692345678901,
    metadata: {
        animationType: "idle",
        frameRate: 62.5,
        totalDuration: 2500
    }
}
```

## 🧪 テスト

### 単独テスト実行

```javascript
// 単独テスト（他のモジュール不要）
const testResult = AnimationSequencer.test();
console.log('テスト結果:', testResult); // true/false
```

### テスト項目
- [x] 基本シーケンス生成（単発・チェーン・ループ・トランジション）
- [x] タイミング計算（遅延・継続時間・フレームレート）
- [x] プログレス追跡（進行状況監視）
- [x] 自動遷移システム（v3.0移植）
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
- ✅ **自然遷移アニメーション**: 完全移植・改良
- ✅ **アニメーション種別システム**: 完全対応
- ✅ **プレースホルダー対応**: CSS keyframe互換
- ✅ **フェード効果**: 遅延・継続時間制御

## 🔧 技術仕様

### アニメーション種別定義（v3.0移植）

```javascript
animationTypes = {
    'syutugen': { duration: 2000, transition: 'taiki', type: 'appearance' },
    'taiki': { duration: 3000, loop: true, type: 'idle' },
    'yarare': { duration: 1200, transition: 'taiki', type: 'damage' },
    'click': { duration: 1000, transition: 'taiki', type: 'interaction' }
}
```

### 自動遷移アルゴリズム

```javascript
// v3.0の自然遷移パターン
syutugen → taiki   // 出現 → 待機（2秒後）
yarare → taiki     // ダメージ → 待機（1.2秒後）
click → taiki      // クリック → 待機（1秒後）
```

### プログレス計算

```javascript
progress = Math.min((currentTime - startTime - delay) / duration, 1.0)
fps = 1000 / interval
totalFrames = Math.ceil(duration / interval)
```

### タイマー管理システム

```javascript
// プログレス追跡タイマー（100ms間隔）
progressTimer = setInterval(() => {
    updateSequenceProgress(sequenceId, calculateProgress());
}, 100);

// 完了タイマー（1回のみ）
setTimeout(() => {
    completeAnimation(sequence);
}, duration);
```

## 🔄 v3.0との互換性

### 移植された機能
- SpineAnimationController.playSequence() → generateSequence() + executeSequence()
- SpineAnimationController.playAnimation() → executeSingleAnimation()
- SpineAnimationController.setupAnimationCompleteListener() → 内蔵プログレス追跡
- アニメーション種別・遷移定義完全移植

### 改良点
- DOM操作を排除 → 数値計算・制御のみ
- グローバル状態を削除 → インスタンス内完結
- タイマー管理強化 → メモリリーク防止
- エラーハンドリング拡充

## 📁 関連ファイル

```
animation-sequencer/
├── animation-sequencer.js        # メイン処理
├── lib/                          # 内包ライブラリ（将来拡張用）
├── test/
│   ├── test-sequences.json      # テストシーケンス
│   └── expected-timing.json     # 期待タイミング
├── README.md                    # このファイル
└── examples/
    └── sequence-patterns.html   # シーケンスパターン例
```

## 🎬 使用例

### 基本的なアニメーション実行

```javascript
const sequencer = new AnimationSequencer();

// 待機アニメーション開始
const idleSequence = sequencer.generateSequence({
    characterId: "purattokun",
    animationName: "taiki",
    sequenceType: "single",
    timingConfig: { delay: 0, duration: 3000, loop: true }
});

sequencer.executeSequence(idleSequence.sequenceId);
```

### v3.0式自然遷移アニメーション

```javascript
// 出現アニメーション → 自動的に待機アニメーションに遷移
const appearanceSequence = sequencer.generateSequence({
    characterId: "purattokun",
    animationName: "syutugen",
    sequenceType: "transition",
    timingConfig: { delay: 1500, duration: 2000, loop: false }
});

sequencer.executeSequence(appearanceSequence.sequenceId);
// 2秒後に自動的にtaikiアニメーションに切り替わる
```

### チェーンアニメーション

```javascript
// 複数アニメーションの連続実行
const chainSequence = sequencer.generateSequence({
    characterId: "purattokun",
    sequenceType: "chain",
    chain: [
        { animationName: "syutugen", duration: 2000 },
        { animationName: "click", duration: 1000 },
        { animationName: "taiki", duration: 3000, loop: true }
    ]
});

sequencer.executeSequence(chainSequence.sequenceId);
```