# 🎯 ポジショニングシステム仕様書

## 📋 このドキュメントについて

**目的**: spine-positioning-system-explanation.htmlの編集システムの正確な仕様を記録  
**重要性**: 意図しない変更・バグ修正時の仕様確認とロールバック用  
**最終更新**: 2025年1月（ユーザーとの仕様確定セッション完了）

---

## 🎮 編集システム概要

### 基本構造
- **キャラクター編集モード**: ドラッグ移動 + リサイズ機能
- **Canvas編集モード**: 表示範囲の移動 + リサイズ機能  
- **排他制御**: 2つのモードは同時に有効化されない
- **保存/キャンセル**: localStorage永続化 + ページリロード方式

---

## 🎯 座標系統仕様（重要）

### 中心点基準システム
**絶対要件**: すべてのキャラクター配置は中心点基準で管理

```css
.demo-character {
    position: absolute;
    /* left/topは中心点位置 */
    transform: translate(-50%, -50%);  /* 必須 */
}
```

```javascript
// 正しい初期位置設定
character.style.left = '60px';  // Canvas中心（120px / 2）
character.style.top = '60px';   // Canvas中心（120px / 2）
character.style.transform = 'translate(-50%, -50%)';
```

### 座標系統一ルール
1. **HTMLインライン**: `60px`（中心点位置）
2. **JavaScript設定**: `60px`（中心点位置）
3. **savedState**: `60px`（中心点位置）
4. **境界計算**: 中心点基準での範囲制限

❌ **禁止**: パーセント（`50%`）とピクセル（`60px`）の混在

---

## 🔄 座標系スワップ機能（v3.0新機能）

### 機能概要
**複雑な座標系を編集しやすいシンプルな座標に一時変換する革新的システム**

### 🎯 実行タイミング

#### **編集開始時** (`startEditMode()` - 1161-1163行):
```javascript
// 🔧 座標系を編集モードに切り替え（競合回避の核心）
const targetElement = SpineEditSystem.baseLayer.targetElement;
SpineEditSystem.coordinateSwap.enterEditMode(targetElement);
```

#### **編集終了時** (`stopEditMode()` - 1181-1184行):
```javascript
// 🔧 座標系を元に戻す（編集結果を保存）
if (targetElement) {
    SpineEditSystem.coordinateSwap.exitEditMode(targetElement);
}
```

### 🔧 変換内容

#### **Enter Edit Mode** (複雑座標 → シンプル座標):
```javascript
// 変換前（複雑な座標系）
element.style.left = '35%';
element.style.top = '75%';
element.style.transform = 'translate(-50%, -50%)';

// 変換後（シンプルな絶対座標）
element.style.left = '423px';  // 実際の描画位置
element.style.top = '562px';   // 実際の描画位置
element.style.transform = 'none';  // transform競合を排除
```

#### **Exit Edit Mode** (シンプル座標 → 元座標系):
```javascript
// 編集後のシンプル座標
element.style.left = '450px';
element.style.top = '580px';

// 変換後（元の座標系形式）
element.style.left = '37.5%';
element.style.top = '77.3%';
element.style.transform = 'translate(-50%, -50%)';
```

### 🎯 技術的効果

1. **座標レイヤー競合の完全排除**:
   - 編集中は1つの座標系のみ使用
   - transform重複適用の根本防止

2. **直感的な編集操作**:
   - シンプルな絶対座標での予測可能な動作
   - 画面外飛び出しの数学的防止

3. **既存システムの完全保護**:
   - 元の座標系（35%, 75%）を破壊しない
   - 編集失敗時の安全なロールバック

### 🚨 重要な実装詳細

#### **座標系バックアップ** (`SpineEditSystem.coordinateSwap.backup`):
```javascript
backup: {
    left: element.style.left,      // '35%'
    top: element.style.top,        // '75%'  
    width: element.style.width,    // '25%'
    height: element.style.height,  // '25%'
    transform: element.style.transform  // 'translate(-50%, -50%)'
}
```

#### **緊急復元機能**:
```javascript
// コンソールから実行可能
SpineEditAPI.emergencyRestore();
```

### 📊 修飾キー対応

#### **Shiftキー**: 縦横比保持リサイズ
- 対角固定 + 縦横比保持（位置移動なし）
- マウス移動量の大きい方向に基づいた適切な計算

#### **Ctrl/Altキー**: 中心固定拡縮  
- 中心からマウス位置までの距離を2倍してサイズ計算
- 中心を固定点とした拡縮動作

#### **Ctrl+Shift**: 中心固定 + 縦横比保持
- 両方の修飾キー効果を組み合わせ

---

## 🔄 キャラクターリサイズ仕様

### 対角固定点システム（必須仕様）
**要件**: リサイズハンドルに対する対角の角が固定点として機能

| ハンドル | 固定点 | 動作 |
|---------|--------|------|
| **SE（右下）** | 左上角 | 左上を固定して右下に拡大 |
| **SW（左下）** | 右上角 | 右上を固定して左下に拡大 |
| **NE（右上）** | 左下角 | 左下を固定して右上に拡大 |
| **NW（左上）** | 右下角 | 右下を固定して左上に拡大 |

### 実装ロジック
```javascript
// リサイズ開始時の位置記録（中心点基準）
startElementPos = {
    centerX: parseFloat(character.style.left) || 60,
    centerY: parseFloat(character.style.top) || 60,
    width: rect.width,
    height: rect.height
};

// 対角固定点を維持する中心点調整
switch (resizeDirection) {
    case 'se': // 右下ハンドル: 左上固定
        newCenterX = startElementPos.centerX + widthDiff / 2;
        newCenterY = startElementPos.centerY + heightDiff / 2;
        break;
    // その他の方向...
}
```

❌ **禁止**: 中心からの拡大縮小（transform-originベース）

---

## 💾 保存・キャンセル仕様

### localStorage永続化システム
**設計思想**: 最終的な永続化を前提とした実装

```javascript
// 保存処理
function confirmEdit() {
    // 1. 現在の状態をsavedStateに反映
    savedState.character.left = character.style.left;
    
    // 2. localStorageに永続保存
    localStorage.setItem('spine-positioning-state', JSON.stringify(savedState));
    
    // 3. 編集モード終了
    endEditMode();
}
```

### ページリロード方式キャンセル
**設計思想**: 複雑な状態復元処理を回避し、確実性を優先

```javascript
// キャンセル処理
function cancelEdit() {
    coordinateDisplay.textContent = '🔄 前回保存した状態に戻しています...';
    setTimeout(() => {
        location.reload();  // 確実なロールバック
    }, 500);
}
```

### 初期化時の状態復元
```javascript
window.addEventListener('load', () => {
    const saved = localStorage.getItem('spine-positioning-state');
    if (saved) {
        const loadedState = JSON.parse(saved);
        // 保存された状態を適用
        character.style.left = loadedState.character.left;
        character.style.top = loadedState.character.top;
        // savedStateも更新
        savedState = loadedState;
    }
});
```

---

## 🎨 Canvas編集仕様

### キャラクター位置維持システム
**要件**: Canvasリサイズ時にキャラクターの背景画像基準絶対位置を維持

```javascript
// Canvas編集開始時
startElementPos = {
    charAbsoluteX: charRect.left + charRect.width/2 - demoRect.left,
    charAbsoluteY: charRect.top + charRect.height/2 - demoRect.top,
    charRelativeX: parseFloat(character.style.left) || 60,  // 重要：デフォルト値
    charRelativeY: parseFloat(character.style.top) || 60
};

// リサイズ後の位置調整（中心点基準）
function adjustCharacterPositionAfterCanvasResize() {
    const targetCharCenterX = startElementPos.charAbsoluteX - canvasLeft;
    const targetCharCenterY = startElementPos.charAbsoluteY - canvasTop;
    
    // 中心点基準での境界制限
    const newCharCenterX = Math.max(minX, Math.min(maxX, targetCharCenterX));
    const newCharCenterY = Math.max(minY, Math.min(maxY, targetCharCenterY));
    
    character.style.left = newCharCenterX + 'px';
    character.style.top = newCharCenterY + 'px';
}
```

---

## 🔧 ドラッグシステム仕様

### 座標系変換処理
**要件**: ドラッグ開始時にパーセント→ピクセル変換を実行

```javascript
function startCharacterDrag(e) {
    // 現在の実際の位置を取得（transformを考慮）
    const rect = character.getBoundingClientRect();
    const canvasRect = characterCanvas.getBoundingClientRect();
    
    // Canvas内での相対位置を計算
    const currentX = rect.left + rect.width/2 - canvasRect.left;
    const currentY = rect.top + rect.height/2 - canvasRect.top;
    
    // パーセント指定をピクセルに変換して保存
    character.style.left = currentX + 'px';
    character.style.top = currentY + 'px';
}
```

### 境界制限（中心点基準）
```javascript
// transformを考慮した境界計算
const minX = charWidth / 2;
const maxX = canvasRect.width - charWidth / 2;
const minY = charHeight / 2;
const maxY = canvasRect.height - charHeight / 2;

newX = Math.max(minX, Math.min(maxX, newX));
newY = Math.max(minY, Math.min(maxY, newY));
```

---

## 🚨 重要な修正履歴

### 2025年1月26日: 座標系統一とリサイズ修正
**背景**: 座標系の混在により複数の問題が発生

#### 修正前の問題
1. **キャラクター消失**: パーセントとピクセルの混在
2. **瞬間移動**: Canvas操作時の座標系不一致
3. **中心拡大**: 対角固定点システムの機能停止

#### 修正内容
1. **座標系統一**: すべてピクセル基準（60px = Canvas中心）
2. **対角固定点復元**: 中心点基準での対角固定点ロジック実装
3. **永続化システム**: localStorage + ページリロード方式

#### 重要な数値
- **初期位置**: `60px, 60px`（Canvas 120px × 120px の中心）
- **デフォルト値**: すべて`60`（`20`は旧仕様）
- **transform**: `translate(-50%, -50%)`は必須維持

---

## 📋 検証チェックリスト

### 座標系確認
- [ ] HTML: `style="left: 60px; top: 60px; transform: translate(-50%, -50%);"`
- [ ] JavaScript初期化: `character.style.left = '60px'`
- [ ] savedState: `left: '60px', top: '60px'`
- [ ] デフォルト値: `|| 60`（`|| 20`ではない）

### リサイズ動作確認
- [ ] SE（右下）: 左上角固定で拡大
- [ ] SW（左下）: 右上角固定で拡大
- [ ] NE（右上）: 左下角固定で拡大
- [ ] NW（左上）: 右下角固定で拡大

### 保存・復元確認
- [ ] 保存: localStorageに永続化
- [ ] キャンセル: ページリロードで復元
- [ ] 初期化: localStorage読み込み

### Canvas操作確認
- [ ] キャラクター位置維持: 背景基準絶対位置保持
- [ ] 境界制限: 中心点基準での制限
- [ ] 瞬間移動なし: スムーズな位置調整

---

## 🔗 関連ドキュメント

- **基本トラブルシューティング**: [LAYER_DEBUGGING.md](./LAYER_DEBUGGING.md)
- **Canvas問題**: [CANVAS_SIZE_TROUBLESHOOTING.md](./CANVAS_SIZE_TROUBLESHOOTING.md)
- **技術実装詳細**: [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
- **アーキテクチャ**: [ARCHITECTURE_NOTES.md](./ARCHITECTURE_NOTES.md)

---

## ⚠️ 重要注意事項

### 絶対に変更してはいけない要素
1. **座標系**: 中心点基準（transform: translate(-50%, -50%)）
2. **対角固定点**: リサイズハンドルの対角角固定システム
3. **初期位置**: 60px（Canvas中心）
4. **保存方式**: localStorage + ページリロード

### よくある間違い
1. **初期値20px使用**: 旧仕様のため60pxに修正必要
2. **パーセント混在**: すべてピクセル統一必要
3. **中心拡大実装**: 対角固定点が正しい仕様
4. **複雑な復元処理**: ページリロードがシンプルで確実

**このドキュメントの仕様に従って実装することで、安定した編集システムを維持できます。**