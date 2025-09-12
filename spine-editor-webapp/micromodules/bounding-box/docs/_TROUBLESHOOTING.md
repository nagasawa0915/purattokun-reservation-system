# PureBoundingBox トラブルシューティング総合ガイド

## 📋 問題別対応表

| 具体的な問題 | 参照ドキュメント | 解決状況 |
|-------------|-----------------|----------|
| **BBドラッグ終了時の瞬間移動** | [BBドラッグ瞬間移動問題](./troubleshooting/BBドラッグ瞬間移動問題.md) | ✅ 解決済み |

---

## 🚨 緊急診断コマンド

### 基本状態確認
```javascript
// BB状態確認
const state = boundingBox.getState();
console.log('Debug Info:', {
    mode: state.swapState.currentMode,
    isDragging: state.dragState.isDragging,
    bounds: state.bounds,
    transform: state.transform,
    uiVisible: state.uiState.visible
});

// 座標系確認
console.log('Element position:', {
    left: getComputedStyle(element).left,
    top: getComputedStyle(element).top,
    transform: getComputedStyle(element).transform
});
```

## 📁 個別問題詳細

個別の問題詳細については、上記の対応表から該当するドキュメントを参照してください。各問題には以下の情報が記録されています：

- **問題の症状**
- **根本原因**
- **解決策**
- **検証手順**
- **予防策**

---

## 🔍 新しい問題の報告

新しい問題を発見した場合：
1. 上記の緊急診断コマンドで状態を確認
2. 問題の詳細を記録
3. 新しい問題ファイルを作成（`troubleshooting/` フォルダ内）
4. この総合ガイドに問題を追加

## 📚 関連ドキュメント

- [SPEC.md](../SPEC.md) - 技術仕様書
- [README.md](../README.md) - 基本使用方法