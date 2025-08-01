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

### パーセンテージ統一システム（2025年1月統一完了）
**絶対要件**: すべてのキャラクター配置はパーセンテージ基準で管理

```css
#purattokun-canvas {
    position: absolute;
    left: 35%;               /* パーセンテージ使用（確定済み解決策） */
    top: 75%;                /* パーセンテージ使用（確定済み解決策） */
    width: 25%;              /* パーセンテージ使用（確定済み解決策） */
    aspect-ratio: 3/2;       /* 縦横比固定 */
    transform: translate(-50%, -50%);  /* 中心点基準（必須） */
}
```

```html
<!-- HTML設定制御システム -->
<div id="purattokun-config" style="display: none;"
     data-x="35"            <!-- 横位置：35%（パーセンテージ値） -->
     data-y="75"            <!-- 縦位置：75%（パーセンテージ値） -->
</div>
```

### 2レイヤー統一システム（2025年1月29日統一完了）
1. **HTMLレイヤー**: `data-x="35"` → パーセンテージ値（35%として使用）
2. **CSSレイヤー**: `left: 35%; top: 75%; width: 25%` → パーセンテージ統一

### 座標系統一ルール
✅ **統一完了**: パーセンテージ（%）による完全統一
❌ **禁止**: ピクセル（`px`）の使用（旧仕様）

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

### 2025年1月29日: パーセンテージ統一システム完成
**背景**: レスポンシブ対応とウィンドウリサイズ問題の根本解決

#### 修正前の問題
1. **ウィンドウリサイズでの位置ズレ**: viewport units (vw/vh) が不安定
2. **座標系の複雑化**: 複数の座標ルールが混在
3. **レスポンシブ対応困難**: 固定ピクセル値による制約

#### 修正内容（Git履歴ベース）
1. **パーセンテージ統一**: すべてパーセンテージ基準（35%, 75%, 25%）
2. **2レイヤー設計**: HTMLレイヤー + CSSレイヤーの明確な分離
3. **aspect-ratio導入**: 縦横比固定による安定した表示

#### 統一完了仕様
- **HTMLレイヤー**: `data-x="35"` → 35%として使用
- **CSSレイヤー**: `left: 35%; top: 75%; width: 25%`
- **レスポンシブ**: パーセンテージ統一によりウィンドウサイズ変更に完全対応
- **transform**: `translate(-50%, -50%)`による中心点基準を維持

---

## 📋 検証チェックリスト

### パーセンテージ統一システム確認
- [ ] HTML設定: `data-x="35" data-y="75"`（パーセンテージ値）
- [ ] CSS設定: `left: 35%; top: 75%; width: 25%;`
- [ ] aspect-ratio: `aspect-ratio: 3/2;`（縦横比固定）
- [ ] transform: `transform: translate(-50%, -50%);`（中心点基準）

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
1. **座標系**: パーセンテージ統一（35%, 75%, 25%）
2. **中心点基準**: transform: translate(-50%, -50%)
3. **2レイヤー設計**: HTMLレイヤー + CSSレイヤーの分離
4. **aspect-ratio**: 縦横比固定による安定表示

### よくある間違い
1. **ピクセル値使用**: 旧仕様のためパーセンテージに統一必要
2. **viewport units使用**: vw/vhは不安定なためパーセンテージを使用
3. **固定幅指定**: width固定ではなくパーセンテージ指定
4. **座標系混在**: すべてパーセンテージで統一必要

### パーセンテージ統一の利点
1. **完全レスポンシブ対応**: ウィンドウサイズ変更に自動追従
2. **シンプルな設計**: 2レイヤーのみによる明確な構造
3. **安定した表示**: aspect-ratioによる縦横比維持
4. **保守性向上**: 統一されたルールによる理解しやすさ

**このパーセンテージ統一仕様に従って実装することで、レスポンシブ対応と安定した動作を保証できます。**