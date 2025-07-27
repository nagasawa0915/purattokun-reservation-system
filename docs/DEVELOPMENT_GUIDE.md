# 開発詳細ガイド

このファイルは「ぷらっとくんの予約システム」の詳細な技術仕様と実装ガイドです。

> **📘 日常的な作業**: [CLAUDE.md](../CLAUDE.md) を参照  
> **🔧 問題解決**: [LAYER_DEBUGGING.md](./LAYER_DEBUGGING.md) を参照  
> **🏛️ 設計思想**: [ARCHITECTURE_NOTES.md](./ARCHITECTURE_NOTES.md) を参照

---

## アーキテクチャの特徴

### 1. スクロール連動アニメーション システム
- **IntersectionObserver** を使用した要素の表示制御
- サービスカードの順次フェードイン（150ms遅延）
- コンセプト要素の左右スライドイン
- パララックス効果（ヒーローセクション）

### 2. インタラクティブエフェクト
- **浮遊要素システム**: スクロール時に🐾🐱🏠❤️が右から左に流れる
- **マウストレイル**: カーソル移動で🐾の足跡が残る
- **キラキラエフェクト**: サービスカードホバー時に✨が発生
- **猫パレード**: 画面トリプルクリックで猫の絵文字が横断
- **雲の流れるアニメーション**: ヒーローセクションで6つの雲が異なる速度で流れる
- **Spine WebGLキャラクター**: 背景画像上にインタラクティブなキャラクターアニメーション

---

## 🧠 段階的思考システム（Think Tags）

### 概要
開発・デバッグ時の**メリハリのある思考制御**のためのタグシステム。重要箇所で深く考え、それ以外は素早く処理することで効率性と正確性を両立。

### Think タグの種類と使い分け

| タグ | 強度 | 使用場面 | 例 |
|------|------|---------|-----|
| `<think>` | 基本 | ファイル確認、基本分類、通常判断 | 既存ファイル内容確認、診断ツール実行 |
| `<think hard>` | 重要 | 重要な分岐点、詳細分類、リスクのある判断 | 問題分類詳細、解決策選択、複数要因の分析 |
| `<ultrathink>` | 最重要 | 絶対間違ってはいけない判断 | ユーザー評価判定、記録タイミング、破壊的操作前 |

### 適用例

#### 1. デバッグ手順
```markdown
1. <think>F12コンソールでエラー確認</think>
2. <think hard>複数の原因候補から根本原因を特定</think hard>
3. <ultrathink>修正がシステム全体に与える影響を評価</ultrathink>
```

#### 2. 問題解決フロー
```markdown
- <think>既存のトラブルシューティング文書を確認</think>
- <think hard>問題の性質を5つのカテゴリに分類</think hard>
- <ultrathink>新規問題として記録するか判断</ultrathink>
```

#### 3. コード変更時
```markdown
- <think>変更箇所の特定と影響範囲の確認</think>
- <think hard>段階的実装とロールバック戦略の計画</think hard>
- <ultrathink>本番環境への影響とリスク評価</ultrathink>
```

### 効果
- **処理速度向上**: think外の箇所は素早く処理
- **集中力最適化**: 重要箇所にリソースを集中
- **品質保証**: 絶対重要箇所での確実な判断
- **セッション一貫性**: 明確な基準による判断の統一

### 実装ガイドライン
1. **ultrathink**は1つの作業で最大2-3箇所まで
2. **think hard**は全体の20-30%程度
3. **think**は基本的確認として適度に配置
4. タグ外の部分は迅速に処理する

---

## 🎯 効果的なデバッグ手法：シンプルサンプル方式（推奨アプローチ）

### 概要
複雑な問題に対して「最小限のサンプルシーンを作成し、それに近づける」手法が実証済みで非常に有効です。

### 実装された成功事例

#### ケース1：背景画像とSpineキャラクターの同期問題（2024年7月）
**問題**: ウィンドウサイズ変更時に背景画像とぷらっとくんがズレる

**従来のアプローチ（失敗）:**
- 本番コードを直接修正
- 複数の要因が絡み原因特定に時間がかかる
- 修正後も予期しない副作用が発生

**シンプルサンプル方式（成功）:**
1. `test-simple-spine.html` で最小限の成功パターンを作成
2. 構造的差異を分析：
   - 成功版：`position: relative` + `height: auto`
   - 本番版：`position: absolute` + `height: 100%`
3. 段階的修正で本番コードを成功パターンに近づける
4. 結果：完全同期を実現

### 手法の体系化

#### Step 1: 最小限テストファイルの作成
```html
<!-- test-問題名.html -->
<!DOCTYPE html>
<html>
<head>
    <style>
        /* 最小限のCSS */
        .container { position: relative; }
        .element { position: absolute; }
    </style>
</head>
<body>
    <!-- 最小限のHTML構造 -->
    <div class="container">
        <div class="element">テスト要素</div>
    </div>
</body>
</html>
```

#### Step 2: 成功パターンの確立
- 問題が**起きない**最小限の実装を作成
- 動作することを確実に確認
- 成功要因を特定・記録

#### Step 3: 構造的差異の分析
```javascript
// 分析観点
const analysis = {
    html: '構造の違い（ネスト、クラス名、属性）',
    css: 'スタイルの違い（position、サイズ、z-index）',
    javascript: 'ロジックの違い（イベント、タイミング、座標計算）'
};
```

#### Step 4: 段階的修正
1. 一つの差異を修正
2. 動作確認
3. 問題があれば前の状態に戻す
4. 次の差異に進む

#### Step 5: 完了とナレッジ化
- 成功した修正をコミット
- 解決過程をドキュメント化
- 同類問題への応用方法を記録

### 適用指針

#### 優先適用する問題
- **複数要素の連携問題**（位置同期、アニメーション連動など）
- **環境依存の問題**（レスポンシブ、ブラウザ差異など）
- **統合問題**（CSS/JavaScript、フレームワーク間など）

#### 従来手法で十分な問題
- 単純な構文エラー
- 明確な原因がある問題
- 軽微な調整作業

### テンプレートファイル
```bash
# 新しい問題に対するテストファイル作成
cp test-simple-spine.html test-新問題名.html
# 最小限まで簡素化して成功パターンを作成
```

---

## 背景画像とキャラクターの完全同期（2024年7月実装）

### 成功したアプローチ（test-simple-spine.html）

#### HTML構造
```html
<!-- 親コンテナ: position: relative -->
<div class="background-container">
    <!-- 背景画像: <img>タグで配置 -->
    <img src="assets/images/クラウドパートナーTOP.png" class="background-image">
    
    <!-- 雲: position: absolute -->
    <img src="assets/images/kumo1.png" class="cloud cloud1">
    
    <!-- Spineキャラクター: position: absolute -->
    <canvas id="purattokun-canvas"></canvas>
</div>
```

#### CSS設計
```css
/* 親コンテナ */
.background-container {
    position: relative;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
}

/* 背景画像 */
.background-image {
    width: 100%;
    height: auto;
    display: block;
}

/* Spineキャラクター */
#purattokun-canvas {
    position: absolute;
    left: 18%;    /* 背景画像基準 */
    top: 49%;     /* 背景画像基準 */
    width: 16%;   /* レスポンシブサイズ */
    height: 16%;  /* レスポンシブサイズ */
    transform: translate(-50%, -50%);
}
```

#### JavaScript実装
```javascript
// Skeleton座標は固定値
skeleton.x = 0;  // Canvas内での位置
skeleton.y = 0;  // Canvas内での位置
skeleton.scaleX = skeleton.scaleY = 0.3;

// Canvasサイズは動的に調整
const updateCanvasSize = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
};
window.addEventListener('resize', updateCanvasSize);
```

### 重要な設計原則
1. **背景画像は`<img>`タグ** - CSS背景ではなくDOM要素として扱う
2. **親要素は`position: relative`** - 子要素の配置基準点
3. **子要素は`position: absolute`** - 親要素基準で配置  
4. **Canvasサイズは%指定** - レスポンシブ対応
5. **キャラクター座標は固定** - Canvas内での絶対位置

### この方法を選んだ理由
- **問題**: 複数の座標システムが混在し、背景とキャラクターがずれる
- **解決**: すべての要素を同一の親要素基準で配置
- **結果**: ウィンドウサイズ変更時も完全に同期

---

## 重要な実装パターン

### CSS アニメーション制御
```css
/* 初期状態: 非表示 */
.service-card {
    opacity: 0;
    transform: translateY(50px) scale(0.9);
}

/* アニメーション発動時 */
.service-card.animate {
    opacity: 1;
    transform: translateY(0) scale(1);
}
```

### JavaScript 統合パターン
- **単一DOMContentLoadedイベント**内にすべての機能を統合
- 変数重複回避のための関数スコープ管理
- エラーハンドリング付きDOM要素アクセス

### デバッグ機能
- `console.log()`による詳細ログ出力
- ブラウザ開発者ツール（F12）での監視
- Spine統合の段階的ログ確認

---

## スタイリング規約

### カラーパレット
- メインカラー: `#ff6b6b` (猫らしいピンク)
- 背景: `#fafafa` (優しいグレー)
- テキスト: `#333` (ダークグレー)

### レスポンシブ breakpoint
- モバイル: `max-width: 768px`
- 最大幅: `1200px` (コンテナ幅)

---

## 装飾エフェクトシステム

### 雲の絵文字エフェクト
「サービス内容」セクションの見出しに雲の絵文字（☁️）を背景として配置するシステム：

```css
.services h2::before {
    content: '☁️';
    position: absolute;
    top: -190px;  /* 位置調整が重要 */
    left: 50%;
    transform: translateX(-50%);
    font-size: 15rem;  /* 文字を覆うサイズ */
    opacity: 0.4;
    z-index: -1;
    animation: cloudFloat 4s ease-in-out infinite;
}
```

### 雲エフェクトの実装ポイント
- **位置調整**: 絵文字のサイズ変更時は `top` 値の再調整が必要
- **サイズバランス**: h2の文字サイズ（2.2rem）に対して適切な比率を保つ
- **アニメーション**: 上下3pxの微細な浮遊で文字範囲内に維持
- **z-index**: `-1` で文字の背景に配置

### 絵文字エフェクトの注意点
1. **ブラウザ依存**: 絵文字の表示サイズはOS/ブラウザにより異なる可能性
2. **基準点の変化**: `font-size` 変更時は絵文字の基準点（baseline）が変わる
3. **位置計算**: 大きなサイズでは予想以上に下に配置される場合がある

---

## ヒーローセクションの背景画像システム

### 背景画像の実装
トップページのヒーローセクションには `クラウドパートナーTOP.png` を背景画像として使用：

```css
.hero {
    background: url('../images/クラウドパートナーTOP.png') center top/cover no-repeat;
    min-height: 900px;
    align-items: flex-start;
}
```

### ヒーローコンテンツの配置
背景画像の上に半透明の白いカードを配置してテキストの可読性を確保：

```css
.hero-content {
    max-width: 280px;
    background: rgba(255, 255, 255, 0.6);
    padding: 20px;
    border-radius: 12px;
    backdrop-filter: blur(8px);
    margin-left: 40px;
    margin-top: 10px;
}
```

### 背景画像システムの重要ポイント
- **画像配置**: `center top/cover` で画像上部を基準に全画面カバー
- **透明オーバーレイなし**: 画像をクリアに表示するため透明グラデーションは使用しない
- **コンテンツ位置**: `align-items: flex-start` で上寄せ配置
- **可読性確保**: 半透明白背景 + ブラー効果でテキストを読みやすく

### サービスアイコンシステム
各サービスカードには内容に適したアイコンを使用：
- 📅 予約販売システム（カレンダー）
- 💰 給与システム（お金袋）
- 🎓 教育機関向けシステム（卒業帽）
- 🐱 トレーニング教材（猫）

---

## 雲の流れるアニメーションシステム

### アーキテクチャ
ヒーローセクションで6つの雲画像（kumo1.png, kumo2.png, kumo3.png を2セット使用）が画面を横断するアニメーション：

```html
<img src="assets/images/kumo1.png" alt="雲1" class="cloud cloud1">
<img src="assets/images/kumo2.png" alt="雲2" class="cloud cloud2">
<!-- ... 計6つの雲要素 -->
```

### CSS設計パターン
- **共通クラス `.cloud`**: position: absolute, opacity: 0.7, z-index: 0
- **個別クラス `.cloud1-6`**: 各雲のサイズ、位置、速度、初期遅延を個別設定
- **@keyframes**: 各雲専用のアニメーション定義（上下の揺らぎパターンが異なる）

### 調整可能パラメータ
```css
/* 各雲の設定例 */
.cloud1 {
    top: 10%;                           /* 垂直位置: 5%〜20% */
    width: 100px;                       /* サイズ: 50px〜200px */
    animation: cloudFloat1 25s linear infinite;  /* 速度: 20s〜40s */
    animation-delay: -1s;               /* 初期位置: 負の値で途中開始 */
}

@keyframes cloudFloat1 {
    0% { left: -80px; transform: translateY(0px); }
    50% { transform: translateY(-10px); }           /* 上下の揺らぎ: -20px〜20px */
    100% { left: calc(100% + 100px); transform: translateY(0px); }
}
```

### 実装のポイント
- **自然な初期配置**: `animation-delay`の負の値で雲が既に画面内にある状態でスタート
- **パフォーマンス**: `transform`のみでアニメーション、`requestAnimationFrame`不要
- **レスポンシブ**: `calc(100% + 余裕px)`で画面幅に関係なく動作
- **詳細コメント**: CSS内に調整方法の完全ガイドを記載済み

### メンテナンス
雲の追加時は以下3点をセットで実装：
1. HTMLに`<img>`タグ追加
2. CSS個別クラス定義（`.cloud7`等）
3. CSS専用`@keyframes`定義（`cloudFloat7`等）

---

## SEO最適化システム

### 実装済みSEO機能
- **メタタグ最適化**: title, description, keywords, OGP, Twitter Cards
- **構造化データ**: LocalBusiness, WebSite, BreadcrumbList (JSON-LD)
- **セマンティックHTML**: 適切なheading階層、ARIA属性、role属性
- **パフォーマンス**: 画像遅延読み込み、font-display: swap、リソースヒント
- **内部リンク**: サービス間の適切な導線設計

### SEO監視コマンド
```bash
# robots.txt確認
curl http://localhost:8000/robots.txt

# sitemap.xml確認  
curl http://localhost:8000/sitemap.xml

# 構造化データ検証
# Google構造化データテストツールでindex.htmlを確認
```

---

## 注意事項

### パフォーマンス
- `requestAnimationFrame` を使用したスクロール処理の最適化
- 浮遊要素の適切なDOM削除処理
- アニメーション遅延によるCPU負荷分散

### ブラウザ互換性
- Modern browsers (ES6+ features使用)
- IntersectionObserver API 必須
- CSS Grid, Flexbox 使用

### メンテナンス
- 新しいアニメーション追加時は `animationObserver` に要素を登録
- 日本語コメントで可読性を重視
- Spine統合問題は `SPINE_TROUBLESHOOTING.md` を参照

---

## 関連ドキュメント

- **[CLAUDE.md](../CLAUDE.md)**: 日常的な開発作業
- **[LAYER_DEBUGGING.md](./LAYER_DEBUGGING.md)**: レイヤー問題とデバッグ
- **[ARCHITECTURE_NOTES.md](./ARCHITECTURE_NOTES.md)**: 設計思想と詳細仕様
- **[SPINE_TROUBLESHOOTING.md](./SPINE_TROUBLESHOOTING.md)**: Spine関連問題解決