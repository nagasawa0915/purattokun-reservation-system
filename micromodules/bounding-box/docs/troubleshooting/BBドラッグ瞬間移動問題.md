# BBドラッグ終了時瞬間移動問題

## 📋 問題の概要

**問題名**: BBドラッグ終了時の瞬間移動問題  
**発生日**: 記録日前  
**解決日**: 2025-08-28  
**影響範囲**: PureBoundingBox ドラッグ操作全般  
**重要度**: ⚠️ 高（基本操作に影響）

## 🎯 症状

### 問題の動作
- ✅ クリック: 正常（動かない）
- ✅ ドラッグ中: 正常（スムーズに追従）
- ✅ ハンドル操作: 正常
- ❌ **ドラッグして離す**: 右斜め下に瞬間移動

### 具体的な現象
1. BBをドラッグ開始 → 正常に動作
2. ドラッグ中の要素追従 → 正常に動作
3. マウスアップでドラッグ終了 → **意図しない位置に瞬間移動**

## 🔍 根本原因分析

<!-- 🔒 確定済み解決策 - 変更禁止 -->

### 技術的な根本原因
**座標変換処理での座標系混在による誤差発生**

#### 問題のあった処理フロー
1. `commitToPercent()` メソッドでドラッグ結果の座標変換実行
2. **ページ全体座標系**（`getBoundingClientRect().left`）を使用
3. **親要素基準相対座標**への変換で累積誤差発生
4. 瞬間移動として可視化

#### 問題コードの詳細
```javascript
// 修正前の問題コード（PureBoundingBoxCore.js 327-365行目）
const visualCenterX = anchorRect.left + anchorRect.width/2 + tx;
const visualCenterY = anchorRect.top + anchorRect.height/2 + ty;
const leftPct = ((visualCenterX - parentRect.left) / parentRect.width) * 100;
const topPct = ((visualCenterY - parentRect.top) / parentRect.height) * 100;

// 問題点:
// - anchorRect.left: ページ全体座標系
// - tx/ty: CSS変数オフセット
// - 複数座標系の混在により変換精度低下
```

## ⚡ 確定済み解決策

<!-- 🔒 確定済み解決策 - 変更禁止 -->

### 解決アプローチ
**直接的な親要素基準計算による座標変換の安定化**

### 修正内容
1. **直接的な親要素基準計算**: `getComputedStyle(element).left` で現在位置を直接取得
2. **%値とpx値の適切な処理**: 既に%値の場合とpx値の場合で処理を分岐
3. **CSS変数の正確な統合**: tx/tyオフセットを親要素サイズ基準で正確に%値に変換

### 修正後の安定コード
```javascript
// 修正後の安定コード（PureBoundingBoxCore.js 327-365行目）
const currentLeft = parseFloat(getComputedStyle(element).left) || 0;
const currentTop = parseFloat(getComputedStyle(element).top) || 0;
const leftIsPercent = getComputedStyle(element).left.includes('%');
const topIsPercent = getComputedStyle(element).top.includes('%');

let leftPct, topPct;

if (leftIsPercent) {
    // 既に%値の場合: オフセットのみ%値に変換して加算
    leftPct = currentLeft + (tx / parentRect.width * 100);
} else {
    // px値の場合: 現在位置を%値に変換してからオフセット加算
    leftPct = (currentLeft / parentRect.width) * 100 + (tx / parentRect.width * 100);
}

if (topIsPercent) {
    topPct = currentTop + (ty / parentRect.height * 100);
} else {
    topPct = (currentTop / parentRect.height) * 100 + (ty / parentRect.height * 100);
}
```

### 修正箇所
- **ファイル**: `/mnt/d/クラウドパートナーHP/micromodules/bounding-box/PureBoundingBoxCore.js`
- **行数**: 327-365行目
- **メソッド**: `commitToPercent()`

## ✅ 検証手順

### テスト環境
1. `python server.py` でローカルサーバー起動
2. `http://localhost:8000/test-element-observer-bb-integration.html` にアクセス

### テストケース
1. **基本ドラッグテスト**:
   - BB要素をクリックしてドラッグ開始
   - 任意の位置までドラッグ
   - マウスを離してドラッグ終了
   - **期待結果**: ドラッグ終了位置に要素が留まる

2. **連続ドラッグテスト**:
   - 複数回連続でドラッグ操作実行
   - **期待結果**: 毎回正確な位置で停止

3. **ハンドル操作確認**:
   - 各種ハンドル（角・辺）での操作確認
   - **期待結果**: リサイズ操作も正常動作

### 検証結果
- ✅ **ドラッグして離す操作**: 瞬間移動解消・正常動作確認済み
- ✅ **既存機能保持**: クリック、ハンドル操作等に影響なし
- ✅ **安定性向上**: 座標変換精度向上により予期しない動作を防止

## 🎯 重要なポイント・教訓

### 座標系処理の重要原則
1. **ページ座標系の危険性**: `getBoundingClientRect()` は絶対位置のため、相対座標変換で誤差が生じやすい
2. **CSS 直接取得の安定性**: `getComputedStyle()` による現在値直接取得の方が変換処理が安定
3. **単位統一の重要性**: %値とpx値の混在に注意が必要
4. **CSS変数統合**: `--tx`, `--ty` 等のCSS変数を正確に統合処理する重要性

### 予防策
- 座標変換処理では常に単一座標系での計算を心がける
- 複数座標系が混在する場合は適切な変換処理を実装
- CSS変数を使用する場合は親要素基準での正確な単位変換を実装

## 📊 修正効果

### Before（修正前）
- ❌ ドラッグ終了時に右斜め下に瞬間移動
- ❌ 座標変換精度の低下
- ❌ ユーザビリティの大幅低下

### After（修正後）
- ✅ ドラッグ終了位置で正確に停止
- ✅ 座標変換の高精度化
- ✅ 直感的なドラッグ操作の実現
- ✅ 既存機能の完全保持

---

## 🔗 関連情報

### 関連ファイル
- `PureBoundingBoxCore.js` - メインの修正箇所
- `test-element-observer-bb-integration.html` - テストファイル

### 関連技術
- CSS座標系（%値・px値変換）
- CSS変数（--tx, --ty）の統合処理
- DOM要素の座標取得（`getComputedStyle()`）

### 類似問題への対策
同様の座標変換問題が他の箇所で発生した場合、このパターンを参考に:
1. 直接的なCSS値取得を優先
2. 複数座標系の混在を避ける
3. 単位変換の精度を確保

---

**記録者**: Claude Code  
**最終更新**: 2025-08-28  
**ステータス**: ✅ 解決済み