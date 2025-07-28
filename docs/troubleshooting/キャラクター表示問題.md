---
title: キャラクター表示問題
status: 解決済み
tags: [表示, Spine, Canvas, 初期化]
aliases: 
  - ぷらっとくん見えない
  - キャラクター消えた
  - 表示されない
  - purattokun not visible
  - キャラ非表示
created: 2025-01-26
updated: 2025-01-26
---

# 🎯 キャラクター表示問題

## 📊 現在の状況
**ステータス**: 解決済み（複数の確実な解決パターンを確立）

## ⚡ 有効な解決策・回避策
<!-- 🔒 確定済み解決策 - 変更禁止 -->

### 解決策1: 基本設定による確実な表示
```javascript
// Canvas設定
canvas.width = 200;
canvas.height = 200;

// Skeleton位置（Spineは左下原点）
skeleton.x = 0;  // 左下角
skeleton.y = 0;  // 左下角
skeleton.scaleX = skeleton.scaleY = 0.5;  // 適度なサイズ

// レンダリング内でビューポート設定（必須）
gl.viewport(0, 0, canvas.width, canvas.height);
```

### 解決策4: 吹き出し切れ対応（横幅拡張）
```javascript
// Canvas設定（横長）
canvas.width = 300;   // 横幅拡張
canvas.height = 200;  // 高さ維持

// CSS設定
canvas.style.width = '300px';
canvas.style.height = '200px';

// Skeleton位置調整
skeleton.x = 100;  // 左から余裕を持った位置
skeleton.y = 0;    // 左下角
skeleton.scaleX = skeleton.scaleY = 0.5;
```

### 解決策5: リアクション切れ対応（全方向拡張+正確な座標系）
```javascript
// Canvas設定（正方形大型）
canvas.width = 400;   // 全方向拡張
canvas.height = 400;  // 全方向拡張

// CSS設定
canvas.style.width = '400px';
canvas.style.height = '400px';

// デバッグ用境界線（問題確認時）
canvas.style.border = '2px dashed rgba(255, 0, 0, 0.3)';

// Skeleton位置調整（Spine座標系: 中央原点）
skeleton.x = 0;    // Canvas中央（原点）
skeleton.y = 0;    // Canvas中央（原点）
// または余裕を持たせる場合:
// skeleton.x = 50;   // 中央から右下に50px
// skeleton.y = 50;   // 中央から右下に50px
skeleton.scaleX = skeleton.scaleY = 0.5;
```

### 解決策6: Spine座標系原点確認法
```javascript
// 原点位置の確認方法
skeleton.x = 0;    // 原点X
skeleton.y = 0;    // 原点Y（地面レベル）
// → Canvas中央にキャラクターが表示される

// デバッグ用境界線で確認
canvas.style.border = '2px dashed rgba(255, 0, 0, 0.3)';
// → 赤い点線の中央にキャラクターが配置される
```

### 解決策7: Spineアセット設計対応（地面原点設計）
```javascript
// Spineアセットが地面を原点(0,0)として設計されている場合
skeleton.x = 0;     // Canvas中央（X軸）
skeleton.y = -100;  // 地面から100px上に配置（適切な高さ）
skeleton.scaleX = skeleton.scaleY = 0.55;

// 調整のポイント：
// - Y座標をマイナス値にして地面から浮かせる
// - 具体的な値はキャラクターサイズとCanvas比率で調整
// - -50 ~ -150程度が一般的な範囲
```

### 解決策2: CSS設定の修正
```css
.positioned-element {
    position: absolute;
    left: 35%;
    top: 75%;
    transform: translate(-50%, -50%);
    width: 80px;  /* 見えるサイズ */
    height: 80px;
    z-index: 10;  /* 前面表示 */
}
```

### 解決策3: 緊急診断ツール
```javascript
// F12でコンソールを開いて実行
console.log('=== キャラクター表示診断開始 ===');

const container = document.querySelector('.background-container');
const character = document.querySelector('.positioned-element, canvas, #purattokun-canvas');
const fallbackImage = document.querySelector('img[src*="purattokunn"]');

console.log('1. 要素確認:', {
    container: container ? '✅存在' : '❌なし',
    character: character ? '✅存在' : '❌なし',
    fallbackImage: fallbackImage ? '✅存在' : '❌なし'
});
```

## 🔍 問題の詳細

### 発生条件
- ページを開いてもぷらっとくんが表示されない
- 背景画像は見えるがキャラクターの位置に何もない
- コンソールエラーがない場合も多い

### 症状パターン
1. **完全に非表示**: 何も見えない
2. **サイズ異常**: 巨大すぎて枠外、極小すぎて見えない
3. **Canvas歪み**: 縦横比がおかしい
4. **レイヤー問題**: 他の要素に隠れている

### 環境情報
- 対象ブラウザ: Chrome, Firefox, Safari
- 発生場所: localhost:8000, 本番環境
- 関連ファイル: index.html, spine-integration-v2.js

## 📝 試行錯誤の履歴

### ✅ Case #1: 2025-01-15 - Canvas比率問題の解決

**問題**: キャラクターが横に歪んで表示される
**試した方法**: 
```javascript
// Canvas内部サイズを正方形に統一
canvas.width = 70;    // 正方形
canvas.height = 70;   // 正方形
// CSS側も正方形に合わせる
canvas.style.width = '80px';
canvas.style.height = '80px';
```
**結果**: ✅ 完全に解決
**原因推測**: Canvas内部解像度とCSS表示サイズの比率が違うと歪みが発生。SpineWebGLは内部解像度基準で描画するため、正方形以外では歪む
**環境**: Chrome 120, Windows 11, localhost:8000

### ✅ Case #2: 2025-01-18 - HTML要素不存在の解決

**問題**: 背景は見えるがキャラクター要素が全く存在しない
**試した方法**: 
```html
<!-- HTML構造を修正 -->
<div class="background-container">
    <img src="background.jpg" class="background-image">
    <canvas class="positioned-element"></canvas>
    <!-- フォールバック画像も追加 -->
    <img src="assets/images/purattokunn.png" 
         class="positioned-element fallback-character"
         style="object-fit: contain;">
</div>
```
**結果**: ✅ 完全に解決
**原因推測**: HTMLにキャラクター要素自体が記述されていなかった
**環境**: Firefox 119, localhost:8000

### ✅ Case #3: 2025-01-20 - z-index競合の解決

**問題**: 要素は存在するが他の要素に隠れて見えない
**試した方法**: 
```css
.positioned-element {
    z-index: 10;  /* 前面表示 */
}
/* 他の要素のz-indexも整理 */
.background-image { z-index: 1; }
.animated-element { z-index: 5; }
```
**結果**: ✅ 完全に解決
**原因推測**: 他の要素のz-indexが高く設定されていてキャラクターが隠れていた
**環境**: Chrome 120, Safari 17, localhost:8000

### ❌ Case #4: 2025-01-22 - RequestAnimationFrame調整

**問題**: 一瞬表示されるがすぐ消える
**試した方法**: 
```javascript
// フレームレート制限を試行
let lastTime = 0;
function animate(time) {
    if (time - lastTime > 16) { // 60fps制限
        render();
        lastTime = time;
    }
    requestAnimationFrame(animate);
}
```
**結果**: ❌ 効果なし
**原因推測**: フレームレートは関係なく、初期化タイミングの問題だった
**学び**: パフォーマンス系の対策では表示問題は解決しない
**環境**: Chrome 120, localhost:8000

### ✅ Case #5: 2025-01-24 - 画像ファイルパス修正

**問題**: フォールバック画像に404エラー
**試した方法**: 
```html
<!-- ❌ 間違ったパス -->
<img src="purattokunn.png">
<img src="/assets/images/purattokunn.png">

<!-- ✅ 正しいパス -->
<img src="assets/images/purattokunn.png">
```
**結果**: ✅ 完全に解決
**原因推測**: 相対パスの指定が間違っていた
**学び**: パスの先頭に/を付けると絶対パスになり、ローカル環境では404になる
**環境**: Chrome 120, localhost:8000

### ⚠️ Case #6: 2025-01-25 - visibility API による復帰時再初期化

**問題**: ウィンドウ最小化後の復帰時に表示が消える
**試した方法**: 
```javascript
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // ウィンドウ復帰時に再初期化
        reinitializeSpine();
    }
});
```
**結果**: ⚠️ 部分的効果（発生頻度50%減）
**原因推測**: ブラウザのvisibility API対応にバラつきがある
**学び**: 回避策として有効だが、根本解決ではない
**環境**: Chrome 120, Firefox 119, localhost:8000

### ✅ Case #7: 2025-01-26 - IDの不一致による初期化失敗の解決

**問題**: `Cannot read properties of null` エラーでSpine初期化失敗
**試した方法**: 
```javascript
// ❌ 間違ったID
const character = document.getElementById('demoCharacter');

// ✅ 正しいID確認と修正
const canvases = document.querySelectorAll('canvas');
console.log('Canvas要素一覧:');
canvases.forEach(canvas => {
    console.log('- ID:', canvas.id || '(IDなし)');
});

// 実際のIDを使用
const character = document.getElementById('demo-purattokun-canvas');
```
**結果**: ✅ 完全に解決
**原因推測**: HTMLとJavaScriptでIDが一致していなかった
**学び**: 要素取得前に必ずIDの存在確認を行う
**環境**: Chrome 120, localhost:8000

### ✅ Case #8: 2025-01-26 - 設定要素不存在とフォールバック画像非表示の解決

**問題**: http://localhost:8000/index.html でぷらっとくんが全く表示されない
**試した方法**: 
1. HTML構造確認 → background-container、canvas要素、フォールバック画像は存在
2. purattokun-config要素の確認 → ❌ 存在せず
3. フォールバック画像の表示状態確認 → ❌ display: none

解決手順:
```html
<!-- 1. 設定要素を追加 -->
<div id="purattokun-config" style="display: none;"
     data-x="18"            
     data-y="49"            
     data-scale="0.55"      
     data-fade-delay="1500" 
     data-fade-duration="2000">
</div>

<!-- 2. フォールバック画像を有効化 -->
<img src="assets/images/purattokunn.png" 
     id="purattokun-fallback"
     style="display: block;">  <!-- none → block -->
```
**結果**: ✅ 完全に解決（ぷらっとくんが正しい位置に表示）
**原因推測**: HTML設定制御システムの設定要素が不足していたため、キャラクター位置情報が読み込まれず。またSpine読み込み失敗時のフォールバックも非表示だった
**学び**: 設定要素の存在確認とフォールバック表示の確認が重要
**環境**: Chrome最新版, localhost:8000, 2025-01-26

### ✅ Case #9: 2025-01-26 - 解決策1（基本設定）による確実な表示

**問題**: http://localhost:8000/index.html でぷらっとくんが表示されない（Spine初期化問題）
**試した方法**: 
解決策1の基本設定を適用
```javascript
// Canvas設定
canvas.width = 200;  // ユーザーが200x200に調整（正方形）
canvas.height = 200;

// Skeleton位置（Spineは左下原点）
skeleton.x = 0;  // 左下角
skeleton.y = 0;  // 左下角
skeleton.scaleX = skeleton.scaleY = 0.5;  // 適度なサイズ

// レンダリング内でビューポート設定（既に存在を確認）
gl.viewport(0, 0, canvas.width, canvas.height);
```
**結果**: ✅ 完全に解決（ぷらっとくんが正常に表示）
**原因推測**: Canvasのレスポンシブ設定やSkeleton位置の複雑な計算が問題を引き起こしていた。基本設定（固定サイズ、左下原点）により確実に表示
**学び**: 複雑な問題は基本設定に戻すことで解決できる。Canvas正方形（200x200）が歪みなく最適
**環境**: Chrome最新版, localhost:8000, 2025-01-26

### ✅ Case #10: 2025-01-28 - 吹き出し切れ問題の解決（横幅拡張対応）

**問題**: spine-sample-simple.htmlでぷらっとくんの左側の吹き出しが切れて表示される
**試した方法**: 
Canvasの横幅拡張とキャラクター位置調整
```javascript
// HTML Canvas設定
<canvas id="purattokun-canvas" width="300" height="200"></canvas>

// CSS設定
#purattokun-canvas {
    width: 300px;  // 200px → 300px（横幅拡張）
    height: 200px; // 維持
}

// Skeleton位置調整
skeleton.x = 100;  // 0 → 100（左から余裕を持った位置）
skeleton.y = 0;    // 維持
skeleton.scaleX = skeleton.scaleY = 0.5; // 維持
```
**結果**: ✅ 完全に解決（吹き出し全体が正しく表示）
**原因推測**: Spineキャラクターの吹き出しアニメーションがCanvas左端にはみ出していた。横幅200pxでは吹き出し領域が不足
**学び**: Spineアニメーションで左右にはみ出る要素がある場合は、Canvasを横長（300x200など）にしてキャラクター位置を中央寄りに調整する
**環境**: Chrome最新版, localhost:8000, 2025-01-28

### ✅ Case #11: 2025-01-28 - リアクション上部切れ問題の解決（Canvas拡張+座標系対応）

**問題**: spine-sample-simple.htmlでリアクション（yarareアニメーション）時にキャラクターの上部が切れる
**試した方法**: 
段階的なCanvas拡張とSpine座標系を考慮したキャラクター位置調整
```javascript
// HTML Canvas設定（最終）
<canvas id="purattokun-canvas" width="400" height="400"></canvas>

// CSS設定（最終）
#purattokun-canvas {
    width: 400px;   // 300px → 400px（全方向拡張）
    height: 400px;  // 200px → 400px（縦幅大幅拡張）
    border: 2px dashed rgba(255, 0, 0, 0.3);  // デバッグ用境界線
}

// Skeleton位置調整（段階的試行）
// 1回目: skeleton.x = 150, skeleton.y = 100 (不十分)
// 2回目: skeleton.x = 200, skeleton.y = 200 (キャラクター消失)
// 3回目: skeleton.x = 100, skeleton.y = 100 (改善)
// 4回目: skeleton.x = 50, skeleton.y = 50 (解決)
// 最終: 
skeleton.x = 50;   // Canvas中央から左下寄り50px
skeleton.y = 50;   // Canvas中央から左下寄り50px
skeleton.scaleX = skeleton.scaleY = 0.5;
```
**結果**: ✅ 完全に解決（「完璧です。オッケーです」とユーザー確認）
**原因推測**: 
1. リアクションアニメーションが上方向に大きく動くためCanvas上部が不足
2. Spine座標系の理解不足（原点位置の誤認識）
**学び**: 
1. **Canvas拡張の汎用パターン**: 問題方向に拡張（横切れ→横拡張、縦切れ→縦拡張、全方向切れ→正方形拡張）
2. **Spine座標系の重要発見**: skeleton(0,0)はCanvas中央に相当（従来の左下原点説は誤り）
3. **デバッグ境界線の有効性**: Canvas範囲を可視化することで問題箇所を正確に特定
4. **段階的調整**: 大きく動かして消失した場合は逆方向に戻して微調整
**環境**: Chrome最新版, localhost:8000, 2025-01-28

### ✅ Case #12: 2025-01-28 - Spine座標系の正確な理解（原点位置の確定）

**問題**: Spineのskeleton座標系の原点位置が不明確で、位置調整時に混乱が発生
**試した方法**: 
skeleton位置を(0,0)に設定して実際の表示位置を確認
```javascript
// 検証用設定
skeleton.x = 0;    // 原点テスト
skeleton.y = 0;    // 原点テスト
skeleton.scaleX = skeleton.scaleY = 0.5;

// Canvas: 400x400px, デバッグ境界線付き
```
**結果**: ✅ 完全に確認（「正解です。四角の中のど真ん中にキャラクターが配置されました」とユーザー確認）
**重要な発見**: 
**Spine座標系**: skeleton(0,0) = Canvas中央
- 従来認識（左下原点）は誤り
- 実際は Canvas中央が原点
- 正方形Canvas（400x400）の場合、(0,0) = 中央位置
**学び**: 
1. **正確な座標系理解**: skeleton(0,0) = Canvas中央
2. **位置調整の基準**: 中央から相対的に移動する
3. **検証の重要性**: 仮説を実際のテストで確認することの重要性
**影響**: 過去の記録における座標系説明を修正する必要がある
**環境**: Chrome最新版, localhost:8000, 2025-01-28

### ✅ Case #13: 2025-01-28 - Spineアセット設計の理解（地面原点設計の発見）

**問題**: skeleton.y = 0でキャラクターがCanvas中央に配置されるが、実際の適切な配置位置とずれる
**重要な発見**: 
**Spineアセット側の設計**: Spine側で原点(0,0)を地面として作成
- Canvas中央(0,0)はSpine内の地面レベルに相当
- キャラクターを適切な高さに配置するには、地面から上に移動が必要
**試した方法**: 
```javascript
// 適切な配置
skeleton.x = 0;     // Canvas中央（X軸）
skeleton.y = -100;  // 地面(0)から100px上に配置
skeleton.scaleX = skeleton.scaleY = 0.55;
```
**結果**: ✅ 完全に解決（適切な高さでキャラクターが表示）
**学び**: 
1. **Spineアセット設計の重要性**: 原点設定はSpine側の設計思想に依存
2. **Canvas座標系とSpine座標系の関係**: Canvas中央 = Spine地面レベル
3. **適切な配置方法**: Y座標をマイナス値にして地面から浮かせる
4. **設計情報の確認**: Spineアセットの設計意図を理解することが重要
**影響**: skeleton.y = 0は地面レベル、適切な表示にはY座標調整が必須
**環境**: Chrome最新版, localhost:8000, 2025-01-28