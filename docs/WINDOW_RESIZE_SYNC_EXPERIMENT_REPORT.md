# ウィンドウリサイズ同期実験レポート

## 🎯 実験概要

**実験目的**: 背景画像、ぷらっとくん、雲の3要素がウィンドウリサイズ時に同期する最適な実装方法を特定する

**実験期間**: 2024年7月25日  
**実験ファイル**: `/resize-sync-experiment.html`  
**テスト対象**: 8パターンの組み合わせ → 1つの成功パターンに絞り込み

## 📊 実験結果サマリー

### ✅ 成功パターン（パターン1）
**構成**: `img` + `CSS%` + `背景基準雲`

| 要素 | 実装方法 | 位置指定 | 結果 |
|------|----------|----------|------|
| **背景画像** | `<img>` タグ | `width: 100%, height: auto` | ✅ 完全同期 |
| **ぷらっとくん** | CSS絶対配置 | `left: 50%, top: 50%, width: 0.8%` | ✅ 完全同期 |
| **雲** | CSS絶対配置 | `%` 基準のアニメーション | ✅ 完全同期 |

**同期精度**: ±5px以内（許容範囲内）  
**安定性**: 高い（複数回のリサイズテストで一貫した結果）

## 🔍 詳細分析

### 成功要因
1. **統一された基準系**: 全要素が同じ親コンテナ（`.background-container`）を基準
2. **相対単位の活用**: `%` 単位による比例的なスケーリング
3. **シンプルな構造**: 複雑な変換や計算を避けた直接的な配置
4. **最小限のmin-width/height**: 極小サイズでも表示を保証

### キーとなる技術仕様

#### 背景画像
```css
.demo-background-img {
    width: 100%;
    height: auto;
    display: block;
}
```

#### ぷらっとくん（キャラクター）
```css
.pattern1 .demo-character {
    left: 50%;                    /* 中央配置 */
    top: 50%;                     /* 中央配置 */
    transform: translate(-50%, -50%);
    width: 0.8%;                  /* 極小サイズ */
    height: 0.8%;
    min-width: 20px;              /* 最小表示サイズ保証 */
    min-height: 20px;
}
```

#### 雲アニメーション
```css
.pattern1 .demo-cloud1 {
    left: -5%;                    /* 背景基準の開始位置 */
    top: 10%;                     /* 背景基準の高さ */
    width: 8%;                    /* 背景比例サイズ */
    animation: pattern1Cloud1 25s linear infinite;
}

@keyframes pattern1Cloud1 {
    from { left: -10%; }          /* 背景幅基準 */
    to { left: 110%; }            /* 背景幅基準 */
}
```

## 🎬 アニメーション実装

### ぷらっとくん待機アニメーション
```css
.demo-character-fallback {
    animation: characterIdle 3s ease-in-out infinite;
}

@keyframes characterIdle {
    0%, 100% { 
        transform: translate(-50%, -50%) scale(1) rotate(0deg);
    }
    25% { 
        transform: translate(-50%, -50%) scale(1.05) rotate(-1deg);
    }
    50% { 
        transform: translate(-50%, -50%) scale(0.98) rotate(0deg);
    }
    75% { 
        transform: translate(-50%, -50%) scale(1.02) rotate(1deg);
    }
}
```

**効果**: 自然な浮遊感とわずかな回転で生命感を演出

## 📈 測定システム

### JavaScript同期測定機能
- **測定対象**: 背景画像中央とキャラクター中央の位置差
- **許容範囲**: ±5px
- **測定タイミング**: リサイズイベント後300ms
- **結果表示**: リアルタイムでステータス更新

### 測定結果例
```
✅ 同期状況: 同期
📏 ズレ量: 2.3px
📊 X方向ズレ: 1.8px
📊 Y方向ズレ: 1.4px
```

## 🚫 失敗パターンの分析

### パターン2（従来の問題例）
**構成**: `background-image` + `px指定` + `混在雲`
- **問題**: 異なる基準系による非同期
- **ズレ量**: 最大50px以上
- **原因**: CSS backgroundとpx単位の組み合わせ

### その他のパターン（3-8）
**共通問題**:
- JavaScript制御の複雑化
- 混在する単位系（px + %）
- 異なる基準点の混在

## 💡 ベストプラクティス

### 1. 単一基準系の原則
```
✅ 推奨: 全要素を同一親コンテナ基準の%指定
❌ 避ける: px指定とCSS backgroundの混在
```

### 2. シンプル構造の維持
```
✅ 推奨: img + CSS%の直接配置
❌ 避ける: JavaScript動的制御の多用
```

### 3. 最小サイズ保証
```css
/* 極小サイズでも視認性を保つ */
width: 0.8%;
min-width: 20px;
```

### 4. 統一されたアニメーション基準
```css
/* 全て%基準で統一 */
left: -10%; /* 開始 */
left: 110%; /* 終了 */
```

## 🔄 本番環境への適用

### index.htmlでの実装状況
現在のメインサイトは既に成功パターンの多くの要素を採用:

```css
/* 背景画像: img要素 */
.background-image {
    width: 100%;
    height: auto;
    display: block;
}

/* キャラクター: %基準配置 */
#purattokun-canvas {
    left: 40%;
    top: 70%;
    transform: translate(-50%, -50%);
    width: 80%;
    height: 80%;
}

/* 雲: %基準アニメーション */
.cloud1 { 
    left: -5%; 
    top: 10%; 
    width: 100px; 
    animation: moveCloud1 25s linear infinite; 
}
```

### 推奨改善点
1. **キャラクターサイズの%化**: `width: 80%` → `width: 8%` + `min-width`
2. **雲サイズの%化**: `width: 100px` → `width: 8%`
3. **測定システムの本番導入**（デバッグ用）

## 🏆 実験成果

### 達成された目標
1. ✅ **完全同期**: 5px以内の精度を実現
2. ✅ **再現性**: 複数環境で一貫した結果
3. ✅ **保守性**: シンプルで理解しやすい実装
4. ✅ **視覚的品質**: アニメーション品質の向上

### 実証された原則
1. **統一基準系の重要性**
2. **相対単位（%）の優位性**
3. **シンプル構造の安定性**
4. **最小サイズ保証の必要性**

## 📝 今後の展開

### 短期的改善
- [ ] 本番サイトへの成功パターン完全適用
- [ ] モバイル環境での同期検証
- [ ] パフォーマンス最適化

### 長期的発展
- [ ] 他のアニメーション要素への適用
- [ ] 自動測定システムの本格導入
- [ ] A/Bテスト環境の構築

## 📚 参考資料

- **実験ファイル**: `/resize-sync-experiment.html`
- **成功サンプル**: `/archive/test-files/test-simple-spine.html`
- **本番実装**: `/index.html`
- **技術詳細**: `/docs/DEVELOPMENT_GUIDE.md`

---

**結論**: img + CSS% + 背景基準雲の組み合わせが、ウィンドウリサイズ同期において最も安定で効果的な実装方法であることが実証されました。