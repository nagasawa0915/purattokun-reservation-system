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

## キャラクター選択システム連携  ← 新規追加
### 動作仕様
1. **通常状態**: キャラ周辺に薄いCanvas境界表示（%座標系）
2. **薄いCanvas境界クリック**: 
   - % → px スワップ実行
   - ハンドル付きBB表示
3. **他キャラ/BB外クリック**: 
   - px → % スワップ実行
   - 薄いCanvas境界に戻る

### 実装要件
- PureBoundingBoxは「BB操作部分」を担当
- キャラ選択・表示制御は外部システムが実装
- スワップは `enterEditingMode()` / `exitEditingMode()` で自動実行

### 現在の実装状況（2025-08-27）
- ✅ **基本BB機能**: ドラッグ移動・8方向リサイズ・完全動作確認済み
- ✅ **`enterEditingMode()`**: 座標系スワップ(%→px)処理実装済み
- ⚠️ **`exitEditingMode()`**: 座標系スワップ(px→%)処理実装済みだが不安定
- 🔧 **技術的課題**: 
  - 親要素サイズ0問題による`commitToPercent()`失敗
  - spine-micromodules-demo.htmlでのレスポンシブ座標連動問題
  - Canvas%サイズ指定時のWebGLログ洪水問題
- 📝 **正常動作環境**: index.html(?edit=true)では完全動作
- 🎯 **動作確認済み機能**: BB表示・ハンドル操作・選択解除・BB外クリック検出

### 既知の制限・対応状況
- **レスポンシブ対応**: index.htmlでは正常、マイクロモジュール版で課題あり
- **WebGL Canvas**: 固定サイズ(300px)では安定、%サイズでログ洪水発生
- **座標変換**: 理論上の設計は完成、実装の細部調整が必要



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

## 🔄 座標系スワップ技術の設計経緯

### 背景となった技術的課題

**レスポンシブWebサイトでの座標制御問題**:
- **背景画像**: 画面サイズに応じて伸縮（%単位での位置制御）
- **Spineキャラクター**: 背景画像と同じ動きをするため%単位で配置
- **複数座標レイヤーの競合**: %座標系とpx座標系が混在し、制御が不安定化

### 問題の具体的な症状

1. **座標レイヤー競合**:
   ```css
   /* 背景画像連動の%座標系 */
   left: 25%;
   top: 50%;
   transform: translate(-50%, -50%);
   
   /* バウンディングボックス用のpx座標系 */
   left: 300px;
   top: 200px;
   width: 200px;
   height: 200px;
   ```

2. **制御不能状態**:
   - 編集中に要素が意図しない位置に移動
   - ドラッグ操作が正確に反映されない
   - レスポンシブ対応との競合

### スワップ技術による解決策

**編集時の座標系統一**:
```javascript
// 編集モード進入時: % → px へスワップ
enterEditingMode() {
    // %座標を一時的にpx座標に変換
    // シンプルな座標レイヤーで確実な制御を実現
}

// 編集モード終了時: px → % へ復元スワップ  
exitEditingMode() {
    // 編集結果を%座標に変換して復元
    // 背景画像との同期を維持
}
```

**技術的メリット**:
- ✅ **編集時**: px座標系のシンプルで確実な制御
- ✅ **通常時**: %座標系による背景画像との完全同期
- ✅ **レスポンシブ対応**: 画面サイズ変更への自動追従

### 実装の核心技術

**座標レイヤー分離による制御安定化**:
- 編集時は余計な座標変換を排除し、直感的なpx制御を実現
- 編集完了時に計算された結果を元の%座標系に正確に変換
- 複数座標系の競合を時系列で分離することで制御安定性を確保

この技術により、**レスポンシブWebサイトでの精密なキャラクター配置編集**と**背景画像との完全な位置同期**の両立を実現しています。

## ⚠️ 座標変換処理における重要な注意事項

### commitToPercent()メソッドでの座標計算

**❌ 問題のあるアプローチ**:
```javascript
// ページ全体座標系を使用（誤差が生じやすい）
const anchorRect = element.getBoundingClientRect();
const visualCenterX = anchorRect.left + anchorRect.width/2 + tx;
const leftPct = ((visualCenterX - parentRect.left) / parentRect.width) * 100;
```

**✅ 推奨アプローチ**:
```javascript
// CSS値を直接取得（安定性が高い）
const currentLeft = parseFloat(getComputedStyle(element).left) || 0;
const leftIsPercent = getComputedStyle(element).left.includes('%');

if (leftIsPercent) {
    leftPct = currentLeft + (tx / parentRect.width * 100);
} else {
    leftPct = (currentLeft / parentRect.width) * 100 + (tx / parentRect.width * 100);
}
```

**重要なポイント**:
- **ページ座標系（getBoundingClientRect）は絶対位置**のため、相対座標変換で誤差が生じやすい
- **CSS getComputedStyleによる直接取得**の方が安定
- **%値とpx値の混在**に注意が必要
- **CSS変数（--tx, --ty）の正確な統合処理**が重要

### トラブルシューティング

座標関連の問題が発生した場合は、[docs/troubleshooting/](./docs/troubleshooting/)を参照してください。

## ✅ PureBoundingBox v5.0整理完了

🎯 **新フォルダ構造確立**
- `/micromodules/bounding-box/`に5つのファイル + ドキュメント統合完了
- マイクロモジュール設計による高い保守性・拡張性を実現
- 完全なドキュメント整備（使い方・技術仕様・実例）完了