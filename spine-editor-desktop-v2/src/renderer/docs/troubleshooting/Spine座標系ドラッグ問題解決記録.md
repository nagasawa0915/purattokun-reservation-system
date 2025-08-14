# Spine座標系ドラッグ問題 完全解決記録

**ステータス**: ✅ 完全解決済み  
**解決日**: 2025-08-14  
**影響範囲**: Spineキャラクターのドラッグ機能全般  
**技術レベル**: 高度（座標系・WebGL・高解像度ディスプレイ対応）

---

## 🚨 問題の症状

### 主要な症状
1. **Y軸動作逆転**: マウスを上に動かすとキャラクターが下に移動
2. **キャラクター選択失敗**: マウスクリック位置とキャラクター実体位置の不一致
3. **ハンドル位置ズレ**: 編集ハンドルがキャラクター位置からズレて表示
4. **高解像度ディスプレイで顕著**: 4Kやレティーナディスプレイで特に問題が深刻

### 再現条件
- Canvas上でSpineキャラクターをドラッグ
- 高解像度ディスプレイ使用時（DPR > 1.0）
- Spine WebGL環境での座標系混在

---

## 🔍 根本原因分析

### 1. 座標系の混在問題
Spineエディターでは以下3つの座標系が混在していた：

```
1. DOM座標系（マウスイベント）
   - 左上原点 (0,0)
   - Y軸: 下向き
   - 単位: CSS pixels

2. Canvas座標系（HTML5 Canvas）
   - 左上原点 (0,0) 
   - Y軸: 下向き
   - 単位: Device pixels
   - DPR補正の影響を受ける

3. Spine WebGL座標系
   - 画面中央原点 (0,0)
   - Y軸: 上向き（OpenGL準拠）
   - 単位: World units
```

### 2. DPR（Device Pixel Ratio）補正の欠落
高解像度ディスプレイでは`window.devicePixelRatio`による補正が必要だったが、座標変換で考慮されていなかった。

### 3. 中央原点補正の不統一
Spine WebGLは画面中央を原点とするが、DOM/Canvasは左上原点のため、変換処理が不統一だった。

---

## ✅ 解決策: 6段階座標変換プロセス

### 統一座標変換システム

```javascript
/**
 * 完全修正版座標変換 - DPR・中央原点・Spine座標系完全対応
 */
clientToCanvasCoordinates(clientX, clientY) {
    // 1. DPR（デバイス座標比率）補正
    const dpr = window.devicePixelRatio || 1;
    
    // 2. 基本Canvas座標計算
    const rect = this.canvas.getBoundingClientRect();
    const rawCanvasX = clientX - rect.left;
    const rawCanvasY = clientY - rect.top;
    
    // 3. DPR補正適用
    const dprCorrectedX = rawCanvasX * dpr;
    const dprCorrectedY = rawCanvasY * dpr;
    
    // 4. 画面中央原点補正
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // 5. Spineワールド座標系への変換（中央原点 + Y軸反転）
    const canvasX = dprCorrectedX - centerX;
    const canvasY = centerY - dprCorrectedY; // Y軸反転が重要
    
    return { x: canvasX, y: canvasY };
}
```

### 逆変換（表示位置計算）

```javascript
/**
 * オーバーレイの位置を更新（座標系スワップ対応 + DPR補正統一）
 */
updateOverlayPosition(characterId) {
    const character = this.characters.get(characterId);
    const spineX = character.skeleton.x;
    const spineY = character.skeleton.y;
    
    // 逆変換プロセス
    const dpr = window.devicePixelRatio || 1;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // Spine座標系 → 中央原点座標系への逆変換
    const centerOriginX = spineX + centerX;
    const centerOriginY = centerY - spineY; // Y軸反転
    
    // DPR補正の逆変換（描画座標 → DOM座標）
    const domX = centerOriginX / dpr;
    const domY = centerOriginY / dpr;
    
    // ハンドル配置
    overlay.style.left = `${domX - 50}px`; // 50px = ハンドル中心調整
    overlay.style.top = `${domY - 50}px`;
}
```

---

## 🔧 解決手順

### Phase 1: 問題分析（診断ツール作成）
1. **座標診断ツール作成** (`spine-coordinate-diagnostic.js`)
   ```javascript
   // 座標系解析
   window.diagnoseSpineCoordinates();
   ```

2. **症状の体系化**
   - Y軸動作逆転の確認
   - DPR値とズレ量の相関確認
   - キャラクター選択精度の測定

### Phase 2: 座標変換統一
1. **clientToCanvasCoordinates()関数の完全修正**
   - 6段階座標変換プロセスの実装
   - DPR補正の追加
   - Y軸反転処理の修正

2. **updateOverlayPosition()関数の同期修正**
   - 逆変換プロセスの実装
   - ハンドル位置の統一計算

### Phase 3: 検証・テスト
1. **多環境テスト**
   - 標準解像度（DPR = 1.0）
   - 高解像度（DPR = 2.0, 3.0）
   - 異なるCanvas サイズ

2. **動作確認**
   ```javascript
   // テスト用デバッグコマンド
   window.spineDebugMode = true; // 詳細ログ有効
   window.fixRightUpOffset(0, 0); // 微調整テスト
   ```

---

## 🎯 学習事項・重要な発見

### 1. Spine WebGL座標系の特殊性
- **中央原点**: 画面中央が(0,0)
- **Y軸上向き**: OpenGL準拠で一般的なDOM座標系と逆
- **ワールド単位**: ピクセル単位ではない

### 2. 高解像度ディスプレイ対応の重要性
```javascript
const dpr = window.devicePixelRatio || 1;
// DPR = 1.0: 標準解像度
// DPR = 2.0: Retina等高解像度
// DPR = 3.0: 4K等超高解像度
```

### 3. 座標変換の一貫性
- 前方変換（マウス→Spine）と逆変換（Spine→DOM）は完全に対称である必要
- 1つでも処理が抜けると位置ズレが発生
- デバッグログによる変換プロセスの可視化が重要

### 4. Canvas要素のサイズ管理
```javascript
// Canvas実サイズ（描画解像度）
canvas.width, canvas.height

// Canvas表示サイズ（CSS）
canvas.style.width, canvas.style.height

// 両者が異なる場合、座標変換でDPR補正が必須
```

---

## 🛡️ 予防策・保守ガイドライン

### 1. 座標変換テスト方法
```javascript
// === 座標変換テストコマンド ===

// 1. 診断ツール実行
window.diagnoseSpineCoordinates();

// 2. デバッグモード有効
window.spineDebugMode = true;

// 3. 手動座標テスト
const testCoords = spinePreviewLayer.clientToCanvasCoordinates(400, 300);
console.log('Test conversion:', testCoords);

// 4. キャラクター選択精度テスト
// キャラクター上で右クリック → 位置情報出力確認
```

### 2. 新環境での動作確認
```
✅ テスト項目:
□ キャラクタークリック選択
□ ドラッグ移動（上下左右）
□ ハンドル表示位置
□ 異なる解像度での動作
□ Canvas リサイズ後の動作
```

### 3. コード変更時の注意点
- **座標変換関数は一体で修正**: clientToCanvasCoordinates()とupdateOverlayPosition()は必ずペアで更新
- **DPR補正の一貫性**: 前方・逆変換で同じDPR値を使用
- **Y軸反転の確認**: centerY - Y の処理が正しく行われているか
- **デバッグログの活用**: 変換プロセスの各段階を可視化

---

## 📊 解決結果・効果

### ✅ 解決された問題
- ✅ Y軸動作逆転 → 正常な方向に修正
- ✅ キャラクター選択失敗 → 正確な位置検出
- ✅ ハンドル位置ズレ → 完全に一致
- ✅ 高解像度対応 → 全DPR値で正常動作

### 📈 技術的成果
1. **統一座標変換システム確立**
2. **高解像度ディスプレイ完全対応**
3. **座標診断ツール整備**
4. **包括的なテスト環境構築**

### 🔄 継続メンテナンス
- 定期的な座標変換テスト実行
- 新機能追加時の座標系統合確認
- 異なるCanvas構成での動作検証

---

## 🔍 デバッグツール・コマンド集

### 座標診断コマンド
```javascript
// === 基本診断 ===
window.diagnoseSpineCoordinates();

// === デバッグモード ===
window.spineDebugMode = true;  // 詳細ログ有効
window.spineDebugMode = false; // ログ無効

// === 手動座標変換テスト ===
const coords = spinePreviewLayer.clientToCanvasCoordinates(clientX, clientY);
console.log('Converted:', coords);

// === 微調整テスト ===
window.fixRightUpOffset(右px, 上px); // マウス-ハンドル位置微調整

// === キャラクター情報取得 ===
spinePreviewLayer.characters.forEach((char, id) => {
    console.log(`${id}:`, char.skeleton.x, char.skeleton.y);
});

// === Canvas情報確認 ===
console.log('Canvas実サイズ:', spinePreviewLayer.canvas.width, spinePreviewLayer.canvas.height);
console.log('Canvas表示サイズ:', spinePreviewLayer.canvas.getBoundingClientRect());
console.log('DPR:', window.devicePixelRatio);
```

### 問題発生時の緊急診断
```javascript
// === 緊急診断フロー ===

// 1. 基本情報確認
console.log('=== 基本情報 ===');
console.log('DPR:', window.devicePixelRatio);
console.log('Canvas:', spinePreviewLayer.canvas?.width, 'x', spinePreviewLayer.canvas?.height);

// 2. 座標変換テスト
console.log('=== 座標変換テスト ===');
const testResult = spinePreviewLayer.clientToCanvasCoordinates(400, 300);
console.log('(400,300) →', testResult);

// 3. キャラクター位置確認
console.log('=== キャラクター位置 ===');
spinePreviewLayer.characters.forEach((char, id) => {
    console.log(`${id}: Spine(${char.skeleton.x}, ${char.skeleton.y})`);
});

// 4. ハンドル位置確認
console.log('=== ハンドル位置 ===');
spinePreviewLayer.visualOverlays.forEach((overlay, id) => {
    const rect = overlay.getBoundingClientRect();
    console.log(`${id}: DOM(${rect.left}, ${rect.top})`);
});
```

---

## 📚 関連技術資料

### 参考実装ファイル
- `spine-preview-layer.js` - メイン座標変換ロジック
- `spine-coordinate-diagnostic.js` - 診断ツール
- `app.js` - マウスイベント処理統合

### 重要な技術概念
- **Device Pixel Ratio (DPR)**: 高解像度ディスプレイ対応
- **Canvas座標系**: HTML5 Canvas の座標管理
- **Spine WebGL座標系**: Spine Runtime の世界座標
- **座標系変換**: 異なる座標系間の相互変換

---

**最終更新**: 2025-08-14  
**ステータス**: ✅ 完全解決・本番稼働中  
**メンテナンス**: 定期テスト実施中