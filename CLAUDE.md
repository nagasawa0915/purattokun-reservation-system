# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

※重要　深く考えてください。

## プロジェクト概要

「ぷらっとくんの予約システム」はレスポンシブWebサイトです。ネコヤ（猫と人が幸せに暮らす住まいづくり）をコンセプトとした、スクロール連動アニメーションが豊富な静的サイトです。

## ファイル構造

```
/
├── index.html              - メインサイト（SEO最適化済み、Spine WebGL統合済み）
├── server.py              - Spine対応カスタムHTTPサーバー（.atlas配信対応）
├── simple-server.py       - バックアップ用シンプルサーバー
├── test-atlas-fix.html    - Atlas読み込み問題診断ツール
├── robots.txt             - SEO：クローラー制御
├── sitemap.xml           - SEO：サイトマップ
├── assets/
│   ├── css/
│   │   └── styles.css      - スタイルシート（猫テーマ + 雲アニメーション + SEO対応）
│   ├── js/
│   │   └── script.js       - JavaScript統合版（全機能 + Spine統合 + SEO対応）
│   ├── images/
│   │   ├── クラウドパートナーTOP.png - ヒーロー背景画像
│   │   ├── kumo1-3.png     - 雲アニメーション画像セット
│   │   ├── nezumi.png       - ネズミ画像
│   │   └── purattokunn.png - ぷらっとくん画像
│   └── spine/
│       ├── spine-integration.js    - Spine統合管理システム（エラーハンドリング強化）
│       └── characters/
│           ├── README.md           - キャラクター配置ガイド
│           ├── demo/               - デモ用キャラクターデータ
│           └── purattokun/        - メインキャラクター（修正済みデータ）
│               ├── purattokun.json
│               ├── purattokun.atlas
│               └── purattokun.png
└── demos/
    ├── demo.html           - スクロール効果テスト専用ページ
    └── test.html           - エフェクト個別テスト用ページ
```

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

### 3. デバッグシステム（削除済み）
- デバッグパネルは本番仕様のため削除済み
- コンソールログによる詳細な動作追跡は継続
- **Spine統合監視**: 初期化→WebGL準備→キャラクター読み込み→アニメーション実行の各段階を表示
- F12開発者ツールでの監視を推奨

## 開発コマンド

### ローカルサーバー起動（重要）
このサイトは**HTTPサーバー経由での実行が必須**です。file://プロトコルでは多くの機能が制限されます。

**推奨順序：**
```bash
# 1. Spine対応カスタムサーバー（.atlasファイル配信対応）
python server.py

# 2. シンプルサーバー（バックアップ）
python simple-server.py

# 3. 標準Pythonサーバー
python -m http.server 8000

# 4. NPX Serve（Node.js環境）
npx serve . -p 8000
```

### Git/GitHub管理
```bash
# 変更をコミット・プッシュ
git add .
git commit -m "変更内容の説明"
git push

# リポジトリ状況確認
git status
git log --oneline
```

### Atlas読み込み問題の診断
```bash
# 診断ツールでSpineファイルの読み込み状況を確認
# ブラウザで http://localhost:8000/test-atlas-fix.html にアクセス
```

### 動作確認手順
1. **メイン機能**: `index.html` を開く
2. **エフェクトテスト**: `demos/demo.html` で個別機能確認
3. **デバッグ**: F12でコンソール確認、右上パネルで数値監視
4. **レスポンシブ**: デベロッパーツールでモバイル表示確認

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

## スタイリング規約

### カラーパレット
- メインカラー: `#ff6b6b` (猫らしいピンク)
- 背景: `#fafafa` (優しいグレー)
- テキスト: `#333` (ダークグレー)

### レスポンシブ breakpoint
- モバイル: `max-width: 768px`
- 最大幅: `1200px` (コンテナ幅)

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

## トラブルシューティング

### よくある問題

#### 一般的な問題
1. **アニメーションが動かない**: CSS の `opacity: 0` 初期状態を確認
2. **浮遊要素が表示されない**: スクロール位置200px以上で確認
3. **変数重複エラー**: `script.js` の統合版使用を確認

#### サーバー関連
4. **ERR_EMPTY_RESPONSE**: カスタムサーバーのguess_typeエラー → 修正版`server.py`使用
5. **file://プロトコル問題**: 必ずHTTPサーバー経由で実行
6. **CORS エラー**: CDNからのSpine読み込み失敗 → サーバー使用必須

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

## Spine WebGLアニメーションシステム

### HTML設定制御システム（重要）
**ぷらっとくんの位置・演出設定をHTMLから直接制御可能**

#### 設定方法
`index.html`内の`#purattokun-config`セクションで設定：
```html
<!-- ぷらっとくん設定（このセクションで位置や演出を調整できます） -->
<div id="purattokun-config" style="display: none;"
     data-x="220"           <!-- 横位置：お店付近=220, 入口=200, 道路側=100 -->
     data-y="180"           <!-- 縦位置：地面=180, 上=150, 下=220 -->
     data-scale="0.75"      <!-- サイズ：1.0=等倍, 0.75=普通, 0.6=小さめ -->
     data-fade-delay="1500" <!-- 出現遅延（ms）：早い=500, 普通=1500, 遅い=3000 -->
     data-fade-duration="2000"> <!-- フェード時間（ms）：早い=1000, 普通=2000, 遅い=3000 -->
</div>
```

#### 調整手順
1. `index.html`の`#purattokun-config`を見つける
2. `data-*`属性の数値を変更
3. ファイル保存 → ブラウザリロード（F5）
4. 変更を即座に確認

#### 主要設定項目
- **位置調整**: `data-x`, `data-y` で画面上の配置
- **サイズ調整**: `data-scale` でキャラクターサイズ
- **演出調整**: `data-fade-delay`, `data-fade-duration` で出現タイミング

### アーキテクチャとバージョン管理
CDN経由でSpine WebGLランタイムを読み込み、背景画像上にキャラクターアニメーションを配置：

#### **重要：バージョン一致の原則**
**Spine Runtime と データファイルのバージョンは必ず一致させること**

```html
<!-- 現在の推奨構成 -->
<!-- Runtime: 4.1.* -->
<script src="https://unpkg.com/@esotericsoftware/spine-webgl@4.1.*/dist/iife/spine-webgl.js"></script>
<!-- Data: 4.1.24 -->
assets/spine/characters/purattokun/purattokun.json ("spine":"4.1.24")
```

#### **バージョン選択指針**

| Runtime版 | データ版 | 互換性 | 特徴 |
|----------|---------|--------|------|
| 4.1.* | 4.1.24 | ✅完全一致 | シンプル、安定、Physics制約なし |
| 4.2.* | 4.1.24 | ❌Physics Error | Runtime側がphysics配列を要求するが、データに存在しない |
| 4.2.* | 4.2.* | ✅完全一致 | 高度なPhysics制約、最新機能 |

**推奨**: 現在の4.1.*構成を維持（安定性重視）

### 統合管理システム
`SpineCharacterManager`クラスが全てのキャラクターを統合管理：

- **初期化**: CDNからの非同期読み込み完了まで最大5秒待機
- **キャラクター管理**: Map()によるキャラクターインスタンス管理
- **デバッグ統合**: 右上パネルにSpineキャラクター数とステータスを表示
- **エラーハンドリング**: Spine未読み込み時はプレースホルダー表示
- **Physics多層防御**: バージョン不一致に対応した段階的初期化システム

### 現在のキャラクター配置
```javascript
// メインキャラクター：ぷらっとくん（修正済みデータ）
spineManager.loadCharacter('purattokun', 'assets/spine/characters/purattokun/', heroSection);
spineManager.setPosition('purattokun', 180, 250);  // 左側の山近く
spineManager.playSequenceAnimation('purattokun');  // syutugen → taiki loop
```

### Spineファイル構造
```
assets/spine/characters/キャラクター名/
├── キャラクター名.json    # スケルトンデータ
├── キャラクター名.atlas   # テクスチャアトラス情報  
└── キャラクター名.png     # テクスチャ画像
```

### HTML設定制御システム

#### HTMLからの直接制御機能
`index.html`内の設定セクションでぷらっとくんの表示を簡単に調整可能：

```html
<!-- ぷらっとくん設定（このセクションで位置や演出を調整できます） -->
<div id="purattokun-config" style="display: none;"
     data-x="220"
     data-y="180" 
     data-scale="0.75"
     data-fade-delay="1500"
     data-fade-duration="2000">
</div>
```

#### 設定パラメータの詳細

**位置設定（data-x, data-y）** - ビューポート基準（vw/vh）
- `data-x`: 横位置の調整（画面幅の%）
  - 道路側: 8vw
  - お店の入口付近: 15vw
  - お店付近: 18vw（推奨・背景画像同期）
  - 右寄り: 25vw（吹き出しが切れる可能性あり）

- `data-y`: 縦位置の調整（画面高さの%）
  - 上の方: 15vh
  - 地面レベル: 49vh（推奨・背景画像同期）
  - 下の方: 55vh

**サイズ設定（data-scale）**
- 大きめ: 1.0
- 普通: 0.55（現在の設定）
- 小さめ: 0.25

**演出タイミング設定**
- `data-fade-delay`: 出現までの待機時間（ミリ秒）
  - すぐ出現: 500
  - 普通: 1500（推奨）
  - ゆっくり出現: 3000

- `data-fade-duration`: フェードイン時間（ミリ秒）
  - 早い: 1000
  - 普通: 2000（推奨）
  - ゆっくり: 3000

#### 調整手順
1. `index.html`を開く
2. `#purattokun-config`のdata-*属性を変更
3. ブラウザをリロード（F5）
4. F12開発者ツールのコンソールで結果確認

### 透明度ベース演出システム

#### 実装の特徴
- **位置移動なし**: キャラクターは最初から最終位置に配置
- **透明度のみ**: `opacity: 0 → 1` のフェードインアニメーション
- **自然な出現**: 移動による不自然さを排除
- **Canvas最適化**: 600x500pxで吹き出し表示に対応

#### 演出フロー
1. **初期配置**: 透明状態で最終位置に配置
2. **遅延待機**: `data-fade-delay`で指定した時間待機
3. **フェードイン**: `data-fade-duration`で透明から不透明に
4. **Spineアニメーション**: syutugen → taiki ループ開始

### 実装の重要ポイント
- **バージョン管理**: Runtime と データの完全一致が必須（4.1.* + 4.1.24）
- **HTML制御**: プログラム知識不要でdata-*属性による簡単設定
- **CDN依存**: 手動インストール不要、CDNから自動読み込み
- **背景同期**: position: absolute でスクロールと連動、背景画像と同期
- **白い枠から独立**: Canvas要素をdocument.bodyに配置、.heroから独立
- **クリック機能**: キャラクタークリックで出現アニメーション再生
- **パフォーマンス**: WebGL活用でCPU負荷を軽減

### Physics初期化システム（多層防御）
バージョン不一致に対応した段階的初期化：
```javascript
// 1. SkeletonDataレベル確認
if (skeleton.data.physicsConstraints) { /* 制約無効化 */ }

// 2. Skeletonオブジェクトレベル強制初期化
Object.defineProperty(skeleton, 'physics', { value: [] });

// 3. updateWorldTransform()実行前最終チェック
if (typeof skeleton.physics === 'undefined') { skeleton.physics = []; }

// 4. try-catch with retry mechanism
```

### デバッグとモニタリング
- **コンソールログ**: `✅ Spine WebGL 4.1.* initialized successfully from CDN`
- **ブラウザ開発者ツール**: F12でSpineステータス監視（初期化中→WebGL準備完了→アニメーション実行中）
- **プレースホルダーモード**: Spine未読み込み時も動作確認可能（🐱浮遊表示）
- **位置検証ログ**: Canvas position verification でBEFORE/AFTER位置確認
- **Physics詳細ログ**: 初期化の各段階とエラーハンドリング状況を詳細表示

### Spine関連のトラブルシューティング

#### よくある問題と解決策

**0. キャラクターの体（karada）が見えない問題（解決済み）**
- **症状**: Spineデータ更新後、キャラクターの体部分のみが表示されない
- **原因**: ブラウザがSpineファイル（JSON/Atlas/PNG）を古いバージョンでキャッシュ
- **解決策**: ブラウザキャッシュのクリア
  ```bash
  # 方法1: ハードリフレッシュ
  Ctrl+Shift+R (Windows/Linux)
  Cmd+Shift+R (Mac)
  
  # 方法2: キャッシュクリア（推奨）
  Shift+Ctrl+Delete → すべてのキャッシュをクリア
  
  # 方法3: 開発者向け
  F12 → Network タブ → "Disable cache"にチェック
  ```
- **予防策**: 
  - 開発時は自動キャッシュバスティング機能が有効（localhost検出時）
  - Spineファイル更新後は必ずハードリフレッシュを実行
- **確認方法**: 
  - F12コンソールで「💡 Cache busting active」メッセージを確認
  - Network タブで304（キャッシュ）ではなく200（新規取得）を確認

**1. Physics Initialization Error（解決済み）**
- **症状**: `Error: physics is undefined` at `Skeleton.updateWorldTransform()`
- **原因**: Spine Runtime 4.2.*とData 4.1.24のバージョン不一致
- **解決策**: CDN URLを`4.1.*`に変更（現在の設定）
  ```bash
  # 修正済み設定
  # Runtime: 4.1.* (CDN)
  # Data: 4.1.24 (ローカルファイル)
  # → 完全互換性確保
  ```
- **確認方法**: 
  - コンソールで `"spine":"4.1.24"` を確認
  - `✅ Spine WebGL 4.1.* initialized successfully` ログを確認

**2. Atlas読み込み404エラー**
- **症状**: `purattokun.atlas` が404エラーで読み込めない
- **原因**: サーバーが`.atlas`拡張子を認識していない
- **解決策**: `python server.py`（カスタムサーバー）を使用

**3. プレースホルダーモード（🐱が浮遊）**
- **症状**: 本物のSpineアニメーションではなく、CSS基盤の代替表示
- **確認方法**: 右上デバッグパネルで "📝Placeholder" と表示
- **解決手順**:
  1. コンソールで404エラー確認
  2. `test-atlas-fix.html`で詳細診断
  3. カスタムサーバー使用

**4. キャラクター切れ（解決済み）**
- **症状**: ぷらっとくんの一部が画面外に切れて表示される
- **原因**: Canvas サイズが小さすぎる（200x200px）
- **解決策**: Canvas サイズを600x500pxに拡張（現在の設定）

**5. 吹き出し切れ（解決済み）**
- **症状**: 「予約完了」の吹き出しが画面右端で切れる
- **解決策**: キャラクター位置を左寄り（x=220）に調整

**6. WebGL getContext エラー**
- **原因**: Atlas読み込み失敗の副次的効果
- **解決**: Atlas問題を先に解決

#### 診断ツール
- **専用テストページ**: `test-console.html`でSpine 4.1.24互換性確認
- **詳細診断**: `test-atlas-fix.html`でファイル読み込み状況確認

#### 診断コマンド
```bash
# サーバー起動確認
netstat -an | grep :8000  # Windows
lsof -i :8000             # macOS/Linux

# 直接ファイルアクセステスト
curl -I http://localhost:8000/assets/spine/characters/purattokun/purattokun.atlas
```

#### バージョン互換性
- **Runtime**: Spine WebGL 4.1.*（CDNから自動取得）
- **Data**: 4.1.24（Physicsなし）
- **推奨組み合わせ**: 完全互換性のため4.1.*系で統一

### ライセンス要件
- **Spine Essential**: 無料（個人・教育用）
- **Spine Professional**: 有料（商用利用）
- 使用前に適切なライセンスの確認が必要

### Spine WebGL ベストプラクティス

#### 1. バージョン管理
- **絶対ルール**: Runtime と データバージョンを一致させる
- **推奨**: CDN URLでバージョンを固定（@4.1.*, @4.2.*）
- **避ける**: @latest や @* での自動更新

#### 2. トラブルシューティング優先順位
1. **Physics Error** → バージョン不一致確認
2. **Atlas 404** → カスタムサーバー使用
3. **Placeholder mode** → コンソールログ確認
4. **WebGL Error** → 上記問題の解決後に対処

#### 3. 開発フロー
1. `python server.py` でカスタムサーバー起動
2. F12開発者ツールでSpineステータス監視
3. コンソールログでエラー詳細確認
4. バージョン一致確認（JSON内の"spine"フィールド）

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

## サーバー設定アーキテクチャ

### MIMEタイプ処理システム
カスタムサーバー(`server.py`)は以下のファイルタイプを適切に処理：

```python
# .atlasファイルの特別処理
if path.endswith('.atlas'):
    return 'text/plain', None

# エラーハンドリング付きguess_type実装
try:
    result = super().guess_type(path)
    # 複数の戻り値形式に対応
except Exception:
    # フォールバック処理
```

### プレースホルダーシステム  
Spine読み込み失敗時の段階的フォールバック：
1. **WebGL Spine**: 正常時の本格アニメーション
2. **Placeholder**: CSS基盤の代替表示（🐱浮遊）
3. **Error Mode**: 赤い❌で明確なエラー表示

## 重要なドキュメント

### SPINE_TROUBLESHOOTING.md
Spine WebGL統合で遭遇した全問題の詳細記録：
- バージョン互換性問題の解決策
- Canvas位置指定問題の段階的解決
- サーバー設定とアセット読み込み問題
- クイック診断チェックリスト
- **新しい問題はこのファイルに記録すること**

```bash
# Spine関連の問題発生時は必ずこのファイルを参照
cat SPINE_TROUBLESHOOTING.md
```

### 重要：Spine関連修正時の記録ルール
**Spine WebGL統合に関する修正を行った場合は、必ずSPINE_TROUBLESHOOTING.mdに記録すること**

#### 記録すべき内容
1. **問題の症状**: 何が起きていたか
2. **原因分析**: なぜその問題が発生したか
3. **解決策**: 具体的にどのように修正したか
4. **影響範囲**: 他の機能への影響はないか
5. **テスト結果**: 修正後の動作確認結果

#### 記録のタイミング
- Spine関連のファイル修正時（spine-integration.js、関連CSS、HTML設定）
- 位置調整システムの変更時
- バージョン互換性に関する変更時
- 新しいSpine関連エラーの解決時

これにより、将来同様の問題が発生した際の迅速な解決と、ナレッジの蓄積が可能になります。