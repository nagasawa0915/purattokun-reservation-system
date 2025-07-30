---
title: Canvas表示範囲編集でドラッグ時に左上に瞬間移動する問題
status: 解決済み
tags: [編集システム, Canvas, ドラッグ, 座標, UI]
aliases: 
  - Canvas左上瞬間移動
  - 表示範囲編集でドラッグ移動問題
  - オレンジ枠瞬間移動
  - canvas drag jump issue
created: 2025-01-29
updated: 2025-01-29
---

# 🎯 Canvas表示範囲編集でドラッグ時に左上に瞬間移動する問題

> ⚠️ **注意**: この問題は旧編集システム（spine-positioning-system-explanation.js）に関するものです。
> 2025-01-30以降は最小限実装版（spine-positioning-system-minimal.js）を使用しているため、この問題は発生しません。
> 歴史的記録として保存しています。

## 📊 現在の状況
**ステータス**: 解決済み - 座標単位統一（%単位）により完全解決

## ⚡ 有効な解決策・回避策

### 解決策1: 座標単位統一修正（確定済み解決策）
<!-- 🔒 確定済み解決策 - 変更禁止 -->

**修正対象ファイル**: `spine-positioning-system-explanation.js`

**修正箇所1: startCanvasDrag関数 - Canvas位置の%単位での記録**
```javascript
// 修正前：px単位で位置を記録
dragOffset = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
};

// 修正後：%単位で位置を記録
const currentLeft = parseFloat(canvas.style.left) || 50;
const currentTop = parseFloat(canvas.style.top) || 50;

dragOffset = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
    // Canvas位置を%で保存
    canvasLeft: currentLeft,
    canvasTop: currentTop
};
```

**修正箇所2: moveCanvas関数 - px移動量を%移動量に変換**
```javascript
// 修正前：px単位で直接移動
const newLeft = Math.max(0, Math.min(window.innerWidth - canvas.offsetWidth, e.clientX - dragOffset.x));
const newTop = Math.max(0, Math.min(window.innerHeight - canvas.offsetHeight, e.clientY - dragOffset.y));

// 修正後：px移動量を%に変換してから適用
const deltaX = e.clientX - dragOffset.x - canvas.getBoundingClientRect().left;
const deltaY = e.clientY - dragOffset.y - canvas.getBoundingClientRect().top;

// px移動量を%移動量に変換
const deltaXPercent = (deltaX / window.innerWidth) * 100;
const deltaYPercent = (deltaY / window.innerHeight) * 100;

// 元の%位置に%移動量を加算
const newLeftPercent = dragOffset.canvasLeft + deltaXPercent;
const newTopPercent = dragOffset.canvasTop + deltaYPercent;

// 境界制限（10%-90%）
const finalLeft = Math.max(10, Math.min(90, newLeftPercent));
const finalTop = Math.max(10, Math.min(90, newTopPercent));

canvas.style.left = finalLeft + '%';
canvas.style.top = finalTop + '%';
```

**修正箇所3: 境界制限の統一**
```javascript
// Canvas位置を10%-90%の範囲に制限
// これによりCanvas全体が画面内に収まることを保証
const finalLeft = Math.max(10, Math.min(90, newLeftPercent));
const finalTop = Math.max(10, Math.min(90, newTopPercent));
```

### 解決策2: 問題再現・デバッグ方法

**再現手順**:
1. `spine-sample-simple.html?edit=true` を開く
2. 「表示範囲編集」ボタンをクリック
3. Canvas（オレンジ色の枠）をクリック・ドラッグ
4. 修正前：左上に瞬間移動する / 修正後：正常にドラッグできる

**デバッグコマンド（F12コンソール）**:
```javascript
// Canvas位置の確認
const canvas = document.querySelector('#spine-canvas');
console.log('Canvas位置:', {
    left: canvas.style.left,
    top: canvas.style.top,
    rect: canvas.getBoundingClientRect()
});

// ドラッグ中の状態確認
console.log('ドラッグ情報:', window.dragOffset);
```

## 🔍 問題の詳細
### 発生条件
- `spine-sample-simple.html?edit=true` で編集モードを開いた時
- 「表示範囲編集」→Canvas（オレンジ枠）をクリック・ドラッグした時

### 症状
- Canvasをドラッグすると左上（0, 0）位置に瞬間移動する
- ドラッグ操作が正常に機能しない
- オレンジ色のバウンディングボックスが期待と異なる位置に移動する

### 環境情報
- 影響範囲: spine-sample-simple.html の表示範囲編集機能
- ブラウザ: 全ブラウザで発生
- 編集システム: spine-positioning-system-explanation.js

## 📝 試行錯誤の履歴

### ✅ Case #1: 2025-01-29 - 座標単位統一による根本解決

**問題**: Canvas要素のドラッグ時に座標単位の不整合により左上に瞬間移動

**根本原因**: 
- Canvas位置は%単位で管理されている（例: `left: 50%`, `top: 50%`）
- ドラッグ処理では px単位で計算していた
- 単位の不整合により位置計算が破綻していた

**試した方法**: 
1. **ドラッグ開始時（startCanvasDrag）**:
   - Canvas の現在位置を%単位で記録
   - ドラッグ開始点のpx座標も記録

2. **ドラッグ中（moveCanvas）**:
   - px単位の移動量を計算
   - px移動量を%移動量に変換
   - 元の%位置に%移動量を加算
   - 境界制限（10%-90%）を適用

3. **境界制限の統一**:
   - Canvas位置を10%-90%の範囲に制限
   - 画面端での動作を安定化

**結果**: ✅ 完全に解決
- Canvasを正常にドラッグできるようになった
- 左上への瞬間移動が完全に解消
- 境界制限も正常に動作

**学び/予防策**: 
- **座標系の統一は絶対に必要** - %単位で管理される要素は%単位で操作する
- **単位変換の精度** - px→%変換時はwindow.innerWidth/Heightを使用
- **境界制限の重要性** - 10%-90%制限により画面外に出ることを防止
- **デバッグの重要性** - console.logでdragOffsetの内容を確認すると問題が明確になる

**環境**: Chrome/Firefox, Windows, localhost:8000/spine-sample-simple.html?edit=true

**今後の予防策**:
1. 座標操作を行う際は必ず単位を統一する
2. %単位の要素を操作する場合は%単位で計算する
3. ドラッグ操作のテスト時は必ず移動動作を確認する
4. 境界制限は必ず実装する

---

## 🚨 重要な注意事項

### 座標単位統一の原則
- **%単位で管理される要素は%単位で操作すること**
- px単位での直接操作は避ける
- 単位変換時は必ずwindow.innerWidth/Heightを基準とする

### 類似問題の予防
- Canvas位置操作を行う際は必ずこの解決策を参考にする
- ドラッグ機能実装時は座標系の統一を最優先に検討する
- テスト時は必ず実際のドラッグ動作を確認する