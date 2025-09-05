# 🎯 AutoPinキャラクター歪み問題解決設計メモ

**作成日**: 2025-09-05  
**対象**: simple-pin-test.html AutoPinシステム  
**目的**: 実装時のブレ防止・明確な方針記録  

---

## 📋 **確定済み解決方針（変更禁止）**

### 🔍 **問題の特定結果**
1. **右クリック保存後キャラクター歪み**: `syncSpineCharactersToUpdatedPins()`でCSS設定上書きが原因
2. **ウィンドウリサイズ時縦横スケール不一致**: 横だけスケール・縦スケールなし現象
3. **切り替え時位置ジャンプ**: 座標レイヤー切り替え瞬間に大きくなり遠くへ移動

### 🎯 **解決戦略（3段階）**

#### **Phase 1: 座標レイヤースワップシステム**
**BBと同じ仕組みを適用**
```javascript
// ピン追従開始時: 現在設定をバックアップ→AutoPin専用座標系切り替え
this.originalSpineSettings = {
    position: spineCanvas.style.position,
    left: spineCanvas.style.left,
    top: spineCanvas.style.top,
    transform: spineCanvas.style.transform,
    width: spineCanvas.style.width,
    height: spineCanvas.style.height
};

// AutoPin座標系適用
spineCanvas.style.position = 'fixed';
spineCanvas.style.transform = 'none';  // 他システム影響断ち切り

// ピン追従終了時: 完全復元
Object.assign(spineCanvas.style, this.originalSpineSettings);
```

#### **Phase 2: 座標継承システム**
**BB参考: `getBoundingClientRect()`で現在位置継承**
```javascript
// 切り替え時の位置継承（位置ジャンプ防止）
const currentRect = spineCanvas.getBoundingClientRect();
const inheritedPosition = {
    left: currentRect.left + 'px',
    top: currentRect.top + 'px',
    width: currentRect.width + 'px',
    height: currentRect.height + 'px'
};

// 段階的復元: 位置継承→座標系復元
Object.assign(spineCanvas.style, inheritedPosition);
spineCanvas.style.transform = this.originalSpineSettings.transform;
```

#### **Phase 3: 画像横スケール監視→BB統一スケール適用**
**歪み完全防止: 縦横比固定方式**
```javascript
// 元画像の横幅のみ監視
const widthScale = img.offsetWidth / img.naturalWidth;

// BBに統一スケール適用（縦横比固定）
spineCanvas.style.transform = `scale(${widthScale})`;

// ウィンドウ停止時のみ計算（300ms デボウンス）
```

---

## 🚨 **実装時の絶対ルール**

### ✅ **必須要件**
- **座標レイヤー分離**: AutoPin専用座標系で他システム干渉防止
- **位置継承**: `getBoundingClientRect()`で現在位置取得→継承
- **縦横比固定**: 横スケールのみ監視→縦横同値適用
- **デボウンス**: ウィンドウ停止時（300ms）のみスケール計算

### ❌ **禁止事項**
- リアルタイム監視（パフォーマンス劣化）
- 縦と横で異なるスケール値適用（歪み発生）
- CSS transform直接操作（競合発生）
- 座標継承なしの切り替え（位置ジャンプ）

### 🔧 **技術的制約**
- StableSpineRenderer設定保護必須
- localStorage データ保持（削除禁止）
- BB編集中のピン追従無効化維持
- MutationObserver無限ループ防止

---

## 📊 **期待される解決効果**

### ✅ **解決される問題**
1. **右クリック保存後の歪み** → 座標レイヤー分離で解決
2. **切り替え時位置ジャンプ** → 座標継承システムで解決
3. **縦横スケール不一致** → 統一スケール適用で解決
4. **ウィンドウリサイズ対応** → 横スケール監視で解決

### 🎯 **実現される機能**
- 座標レイヤー競合なし
- 切り替え瞬間の滑らかな移行
- 完全な縦横比保持
- レスポンシブ完全対応

---

## 🔄 **実装順序（必須）**

1. **Phase 1実装** → 座標レイヤースワップ確認
2. **Phase 2実装** → 位置継承動作確認  
3. **Phase 3実装** → 統一スケール動作確認
4. **統合テスト** → 全機能連携確認

**🚨 注意**: 段階的実装必須。一度に全て実装すると原因特定困難。

---

## 📝 **実装メモ**

**対象ファイル**:
- `micromodules/bounding-box/PureBoundingBoxAutoPin.js` - メインロジック
- `micromodules/bounding-box/PureBoundingBoxUI.js` - 保存時保護機能  
- `simple-pin-test.html` - テスト環境

**参考実装**:
- BB座標継承: `PureBoundingBoxCore2Layer.js` の `getBoundingClientRect()` 使用例
- スケール取得: `img.offsetWidth / img.naturalWidth` 方式

---

**🔒 このメモは実装完了まで変更禁止**  
**📋 実装時は必ずこの方針に従うこと**