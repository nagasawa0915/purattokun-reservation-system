# 🎯 Spine WebGL ベストプラクティス

**最終更新**: 2025年1月29日  
**ステータス**: 確定版（理想構成決定）  
**用途**: 今後のSpine実装における標準ガイドライン

---

## 🚀 座標制御理想構成（確定版）

### 🎯 基本方針
**「今後のSpineに関する座標は2層の理想構成で実装する」**

この構成は、複雑な7層システムから段階的に簡略化し、実用性と保守性を両立した最終形態です。

---

## 📐 2層座標制御システム

### **Layer 1: CSS位置制御システム**
**役割**: Canvas要素の画面上での配置制御

```css
#canvas-element {
    position: absolute;
    left: 35%;  /* 背景画像同期 */
    top: 75%;   /* 背景画像同期 */
    transform: translate(-50%, -50%);  /* 中心点基準配置 */
    width: 120px;   /* 表示サイズ */
    height: 120px;
    z-index: 10;
}
```

### **Layer 2: Spine WebGL座標制御システム**  
**役割**: Canvas内でのSpineキャラクターの配置・スケール制御

```javascript
// Canvas内部解像度設定
canvas.width = 200;   // 最適化済み解像度
canvas.height = 200;

// Skeleton配置（理想構成）
skeleton.x = 0;       // 基本は0,0ベース（重要）
skeleton.y = 0;       // 基本は0,0ベース（重要）
skeleton.scaleX = skeleton.scaleY = 0.55;  // 推奨スケール
```

---

## 💡 重要な技術的知見

### 🔑 確定済みベストプラクティス

1. **Skeleton座標は基本０，０でよい**
   - ユーザー実証済みの重要な発見
   - 複雑な座標計算は不要
   - シンプルな原点基準配置が最適

2. **2層が技術的な最小構成**
   - Spine WebGLの制約上、これ以上の削減は不可能
   - CSS位置制御 + Spine座標制御の組み合わせが必須

3. **大幅簡略化の実現**
   - **開始時**: 7層の複雑な座標制御
   - **最終形**: 2層のシンプル構成
   - **削減率**: 約71%の簡略化達成

---

## 🛠️ 実装ガイドライン

### ✅ 推奨実装パターン

```html
<!-- HTML構造（最小構成） -->
<div id="purattokun-config" style="display: none;"
     data-x="35"     <!-- CSS left値（%） -->
     data-y="75"     <!-- CSS top値（%） -->
     data-scale="0.55"> <!-- Skeletonスケール -->
</div>

<canvas id="purattokun-canvas" 
        data-spine-character="purattokun"
        style="position: absolute; width: 120px; height: 120px; z-index: 10;">
</canvas>
```

```javascript
// JavaScript実装（推奨パターン）
const config = document.getElementById('purattokun-config');
const canvas = document.getElementById('purattokun-canvas');

// Layer 1: CSS位置制御
const x = config.dataset.x;
const y = config.dataset.y;
canvas.style.left = x + '%';
canvas.style.top = y + '%';
canvas.style.transform = 'translate(-50%, -50%)';

// Layer 2: Spine座標制御（シンプル）
canvas.width = 200;
canvas.height = 200;
skeleton.x = 0;  // 基本0,0
skeleton.y = 0;  // 基本0,0
skeleton.scaleX = skeleton.scaleY = parseFloat(config.dataset.scale);
```

### ❌ 避けるべきパターン

```javascript
// ❌ 複雑な座標計算
skeleton.x = canvas.width / 2 + offset.x + adjustment.x;
skeleton.y = canvas.height / 2 + offset.y + adjustment.y;

// ❌ 多層座標変換
const finalX = htmlConfig.x * cssTransform.x * jsCalculation.x;
const finalY = htmlConfig.y * cssTransform.y * jsCalculation.y;

// ❌ 動的座標レイヤー追加
addCoordinateLayer('json-positioning');
addCoordinateLayer('edit-system-override');
```

---

## 📊 既知の実装事例

### ✅ 成功事例

| ファイル | 構成 | 状態 |
|---------|------|------|
| **index.html** | 2層理想構成 | ✅ 実装済み・動作確認済み |
| **spine-sample-simple.html** | 2層理想構成 | ✅ 実装済み・動作確認済み |

### 📋 移行履歴

```
7層複雑システム（2024年前半）
    ↓
段階的簡略化（2024年後半）  
    ↓
2層理想構成（2025年1月確定）← 現在
```

---

## 🔧 トラブルシューティング

### キャラクター切れ問題
```javascript
// 解決策：Canvas解像度調整
canvas.width = 200;   // 適切なサイズ
canvas.height = 200;
skeleton.x = 0;       // シンプルな原点配置
skeleton.y = 0;
```

### 位置ズレ問題
```css
/* 解決策：中心点基準配置 */
transform: translate(-50%, -50%);
```

### スケール問題
```javascript
// 解決策：統一スケール値
skeleton.scaleX = skeleton.scaleY = 0.55;  // 推奨値
```

---

## 🎯 今後の開発指針

### ✅ このベストプラクティスを適用すべき場面
- 新規Spineキャラクター実装
- 既存システムの改修・最適化
- パフォーマンス問題の解決

### ⚠️ 注意事項
- **2層以下への削減は技術的に不可能**
- **Skeleton座標は基本0,0を維持**
- **CSS中心点基準配置は必須**

### 🔄 継続的改善
このドキュメントは新しい知見や最適化技術の発見に応じて更新されます。

---

**📚 関連ドキュメント**
- [🎯 Canvas配置システム（CLAUDE.md）](../CLAUDE.md#🎯-canvas配置システム)
- [⚙️ Spine問題解決（docs/SPINE_TROUBLESHOOTING.md）](./SPINE_TROUBLESHOOTING.md)
- [🏛️ 設計思想（docs/ARCHITECTURE_NOTES.md）](./ARCHITECTURE_NOTES.md)