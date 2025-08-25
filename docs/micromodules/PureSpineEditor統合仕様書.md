# PureSpineEditor.js 統合仕様書
## v2.0機能モジュール設計

**作成日**: 2025-08-25  
**分類**: Type B 機能モジュール (500-800行)  
**目標**: 実用的なSpine編集機能の完全実装

---

## 🎯 統合目的

### 解決する問題
- **v1.0の課題**: PureSpineLoader + PureBoundingBox組み合わせが必要
- **移植性の問題**: 2ファイル依存により移植時の設定が複雑
- **機能の不完全性**: バウンディングボックス操作してもSpineキャラクターが動かない

### 達成目標
- **機能完結**: 1つで「Spine読み込み→表示→編集→保存」完結
- **移植性**: 1ファイルコピーで即座に動作
- **実用性**: 実際にSpineキャラクターを操作可能

---

## 📊 統合対象モジュール分析

### PureSpineLoader.js (308行)
**統合する機能**:
- ✅ WebGLコンテキスト管理
- ✅ アセットマネージャー（.atlas, .json読み込み）
- ✅ スケルトン・アニメーション初期化
- ✅ エラーハンドリング・cleanup()

**統合しない機能**:
- ❌ 過度な設定検証（簡略化）
- ❌ 複雑なログ出力（最小限に）

### PureBoundingBox.js (582行)
**統合する機能**:
- ✅ バウンディングボックス表示
- ✅ 8点ハンドルシステム
- ✅ ドラッグ&ドロップ操作
- ✅ リサイズ操作
- ✅ マウス・タッチイベント

**統合しない機能**:
- ❌ 独立したDOM要素管理（簡略化）
- ❌ 複雑な状態管理（統合状態管理に集約）

---

## 🏗️ 統合アーキテクチャ

### クラス構造
```javascript
class PureSpineEditor {
    // 🎯 統合された責務
    constructor(config)     // Spine設定 + Canvas要素 + 編集設定
    
    // Spine関連
    async loadSpine()       // Spine読み込み・初期化
    renderSpine()           // Spineレンダリング
    
    // 編集UI関連  
    showBoundingBox()       // バウンディングボックス表示
    hideBoundingBox()       // バウンディングボックス非表示
    
    // 統合制御（新機能）
    syncBoundingToSpine()   // バウンディング → Spine位置更新
    syncSpineToBounding()   // Spine位置 → バウンディング更新
    
    // 状態管理
    getState()              // 現在状態取得
    setState(state)         // 状態復元
    cleanup()               // 完全クリーンアップ
}
```

### データフロー
```
ユーザー操作 → バウンディングボックス → 統合制御 → Spineキャラクター → 画面更新
     ↑                                                          ↓
   状態保存 ←─────────── 統合状態管理 ←──────────── リアルタイム同期
```

---

## ⚙️ 技術仕様

### 入力仕様
```javascript
const config = {
    // Spine設定
    basePath: "assets/spine/characters/purattokun/",
    atlasPath: "purattokun.atlas",
    jsonPath: "purattokun.json",
    
    // Canvas設定
    canvasElement: document.getElementById('canvas'),
    
    // 編集設定
    initialPosition: {x: 100, y: 100},
    initialScale: 1.0,
    showBoundingBox: true,
    
    // アニメーション設定
    defaultAnimation: "taiki",
    animationLoop: true
};
```

### 出力仕様
```javascript
const state = {
    // Spine状態
    spine: {
        loaded: true,
        position: {x: 150, y: 120},
        scale: 1.2,
        currentAnimation: "taiki"
    },
    
    // 編集状態
    editor: {
        boundingBox: {visible: true, bounds: {...}},
        dragState: {isDragging: false},
        history: [...]
    },
    
    // システム状態
    success: true,
    error: null
};
```

---

## 🚀 実装計画

### Phase 1: 基盤統合 (200行)
- PureSpineLoaderの簡略統合
- WebGLコンテキスト・基本レンダリング
- cleanup()基盤

### Phase 2: UI統合 (250行)
- PureBoundingBoxの簡略統合
- 8点ハンドル・ドラッグ操作
- イベントハンドリング

### Phase 3: 同期機能 (150行)
- バウンディングボックス ↔ Spine位置同期
- リアルタイム更新システム
- 状態管理統合

### Phase 4: 完成・最適化 (100行)
- エラーハンドリング強化
- パフォーマンス最適化
- テスト機能・デバッグ支援

**合計目標**: 700行以内

---

## ✅ 品質基準

### 機能要件
- [ ] Spine読み込み・表示が正常動作
- [ ] バウンディングボックスが正常表示
- [ ] ドラッグ操作でSpineキャラクターが移動
- [ ] リサイズ操作でSpineキャラクターがスケール変更
- [ ] cleanup()で完全復元
- [ ] 1ファイルで独立動作

### パフォーマンス要件
- [ ] 初期化: 2秒以内
- [ ] ドラッグ操作: 60fps維持
- [ ] メモリリーク: cleanup()後に0MB

### 移植性要件
- [ ] 外部依存: Spine WebGLのみ
- [ ] 環境依存コード: なし
- [ ] 設定ファイル依存: なし

---

## 🧪 テスト仕様

### 単体テスト
```javascript
// 基本機能テスト
PureSpineEditor.test()

// 統合テスト（実際のキャラクターで）
const editor = new PureSpineEditor(testConfig);
await editor.loadSpine();
editor.showBoundingBox();
// ドラッグ操作テスト
// 位置同期テスト
editor.cleanup();
```

### 実験環境統合
- index2-micromodule-experiment.html に統合
- F12コンソールで `microExperiment.testSpineEditor()` 実行
- 既存v1.0モジュールとの比較テスト

---

## 📈 成功指標

### 定量指標
- **行数**: 700行以内
- **依存**: Spine WebGL 1つのみ  
- **移植時間**: 5分以内（1ファイルコピー）
- **初期化時間**: 2秒以内

### 定性指標
- **実用性**: 実際にSpineキャラクターが操作できる
- **直感性**: ドラッグ操作で即座にキャラクター移動
- **安定性**: エラー無しで継続動作
- **移植性**: 環境変更時も即座に動作

---

**統合方針**: 実用性と移植性を両立する適度な統合  
**キーワード**: 機能完結・1ファイル移植・リアルタイム同期・AIプログラミング最適化