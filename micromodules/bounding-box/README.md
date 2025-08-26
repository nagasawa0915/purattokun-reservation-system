# PureBoundingBox v5.0 マイクロモジュール

## 概要

🎯 **DOM要素のバウンディングボックス編集システダ**

任意の箱HTML要素に対して、リアルタイムでドラッグ編集可能なバウンディングボックスUIを提供します。

### 主要機能
- ✨ **ドラッグ移動**: 中央ハンドルで要素移動
- ↔️ **リサイズ**: 8方向ハンドルでサイズ調整
- ⌨️ **修飾キー対応**: Shift(等比), Alt(中心基準), Ctrl
- 📱 **タッチサポート**: モバイルデバイス完全対応
- 🎨 **Spine Canvas特化**: WebGL Spineキャラクター編集対応

### アーキテクチャ

🧩 **マイクロモジュール設計** - 4つの独立したモジュールが協調動作

```
PureBoundingBox.js          ← 統合インターフェース
├─ PureBoundingBoxCore.js     ← データ・状態管理
├─ PureBoundingBoxBounds.js   ← 座標計算ロジック
├─ PureBoundingBoxUI.js       ← UI生成・表示制御
└─ PureBoundingBoxEvents.js   ← イベント処理
```

## 📁 ファイル構造

```
micromodules/bounding-box/
├── PureBoundingBoxCore.js     # データ・状態管理コア
├── PureBoundingBoxBounds.js   # 座標計算ロジック
├── PureBoundingBoxUI.js       # UI生成・表示制御  
├── PureBoundingBoxEvents.js   # イベント処理
├── PureBoundingBox.js         # 統合インターフェース
├── README.md                  # 使い方・API・実例
└── SPEC.md                    # 技術仕様・入出力データ
```

## 使い方

### 1. ファイル読み込み

```html
<!-- 全ファイルを順序通り読み込み -->
<script src="micromodules/bounding-box/PureBoundingBoxCore.js"></script>
<script src="micromodules/bounding-box/PureBoundingBoxBounds.js"></script>
<script src="micromodules/bounding-box/PureBoundingBoxUI.js"></script>
<script src="micromodules/bounding-box/PureBoundingBoxEvents.js"></script>
<script src="micromodules/bounding-box/PureBoundingBox.js"></script>
```

### 2. 基本使用例

```javascript
// ターゲット要素を取得
const targetElement = document.querySelector('#my-element');

// バウンディングボックス作成
const boundingBox = new PureBoundingBox({
    targetElement: targetElement
});

// 編集開始
const result = await boundingBox.execute();

if (result.success) {
    console.log('編集モード開始成功');
} else {
    console.error('エラー:', result.error);
}
```

### 3. 詳細設定例

```javascript
const boundingBox = new PureBoundingBox({
    targetElement: targetElement,
    nodeId: 'custom-bb-001',           // 独自のID指定
    minWidth: 50,                      // 最小幅
    minHeight: 30                      // 最小高さ
});

// 表示オプション付きで実行
await boundingBox.execute({
    visible: true  // 初期状態で表示する
});
```

### 4. 手動制御

```javascript
// 表示・非表示切り替え
boundingBox.show();    // 表示
boundingBox.hide();    // 非表示

// 状態取得
const state = boundingBox.getState();
console.log('現在の状態:', state);

// クリーンアップ
boundingBox.cleanup();
```

## テスト方法

### ブラウザコンソールでテスト

```javascript
// 統合テスト実行
const testResult = await PureBoundingBox.test();
console.log('テスト結果:', testResult);

// またはショートカット
const testResult = await testBoundingBox();

// テスト完了後はクリーンアップ
testResult.boundingBox.cleanup();
```

## イベント・コールバック

本モジュールはコールバック機能を持たない軽量設計です。

状態監視が必要な場合は、定期的に`getState()`で確認してください。

```javascript
// 定期監視例
const monitor = setInterval(() => {
    const state = boundingBox.getState();
    if (state.dragState.isDragging) {
        console.log('ドラッグ中:', state.bounds);
    }
}, 100);

// 監視終了
clearInterval(monitor);
```

## 注意事項

### ❗ 重要な依存関係

- 全て4つのサブモジュールが必要です
- 読み込み順序を必ず守ってください
- Core → Bounds → UI → Events → PureBoundingBox

### ⚠️ 既知の制限

- 一度に1つの要素のみ編集可能
- `position: absolute`要素のみ対応
- 親要素が`transform`を持つ場合は座標がズレる可能性

## 📋 関連ドキュメント・実用例

### 📖 技術仕様
- [SPEC.md](./SPEC.md) - 完全技術仕様・API詳細・データ構造

### 🎯 実用例・デモ
- [micromodules/experimental/bounding-box-modular-demo.html](../experimental/bounding-box-modular-demo.html) - v5.0マイクロモジュール版デモ
- [micromodules/experimental/bounding-box-demo-v3.html](../experimental/bounding-box-demo-v3.html) - v3.0デモ
- [micromodules/experimental/bounding-box-demo.html](../experimental/bounding-box-demo.html) - 基本デモ

### 🔧 バージョン履歴参照
- [micromodules/experimental/PureBoundingBox_v4_BBSwap.js](../experimental/PureBoundingBox_v4_BBSwap.js) - v4.0 BBSwap版
- [micromodules/experimental/PureBoundingBox_v3.js](../experimental/PureBoundingBox_v3.js) - v3.0モノリス版
- [micromodules/experimental/PureBoundingBox_v2.js](../experimental/PureBoundingBox_v2.js) - v2.0レガシー版

## ✅ PureBoundingBox v5.0整理完了

🎯 **新フォルダ構造確立**
- `/micromodules/bounding-box/`に5つのファイル + ドキュメント統合完了
- マイクロモジュール設計による高い保守性・拡張性を実現
- 完全なドキュメント整備（使い方・技術仕様・実例）完了