# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

※重要　やり取りは日本語でお願いします。
深く考えてください。

## 🚨 このファイルの管理方針（Claude向け）

1. **このファイルは簡潔に保つ** - 詳細はdocs/フォルダへ
2. **構造を変更しない** - 既存の構造を維持して追記のみ
3. **新しい情報の追加先**:
   - 技術的詳細 → docs/DEVELOPMENT_GUIDE.md
   - 問題解決 → docs/SPINE_TROUBLESHOOTING.md または docs/LAYER_DEBUGGING.md
   - 設計思想 → docs/ARCHITECTURE_NOTES.md
4. **このファイルには参照リンクのみ追加**

---

## 📚 ドキュメント構成

**このファイル**: 日常的な開発作業用のクイックリファレンス  
**詳細情報**: [📁 docs フォルダ](./docs/) に整理済み

| 目的 | ドキュメント |
|------|-------------|
| **📋 編集システム仕様書** | [🎯 docs/POSITIONING_SYSTEM_SPECIFICATIONS.md](./docs/POSITIONING_SYSTEM_SPECIFICATIONS.md) |
| **📊 実装進捗管理** | [📈 docs/POSITIONING_SYSTEM_PROGRESS.md](./docs/POSITIONING_SYSTEM_PROGRESS.md) |
| **技術仕様・実装詳細** | [📖 docs/DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md) |
| **レイヤー問題診断** | [🔧 docs/LAYER_DEBUGGING.md](./docs/LAYER_DEBUGGING.md) |
| **Spine問題解決** | [⚙️ docs/SPINE_TROUBLESHOOTING.md](./docs/SPINE_TROUBLESHOOTING.md) |
| **Canvasサイズ変更問題** | [🎯 docs/CANVAS_SIZE_TROUBLESHOOTING.md](./docs/CANVAS_SIZE_TROUBLESHOOTING.md) |
| **設計思想・アーキテクチャ** | [🏛️ docs/ARCHITECTURE_NOTES.md](./docs/ARCHITECTURE_NOTES.md) |

---

## プロジェクト概要

「ぷらっとくんの予約システム」はレスポンシブWebサイトです。ネコヤ（猫と人が幸せに暮らす住まいづくり）をコンセプトとした、スクロール連動アニメーションが豊富な静的サイトです。

## コアアーキテクチャ

### メインファイル
- **index.html** - 本番サイト（SEO最適化、Spine WebGL統合、**編集モード統合済み**）
- **spine-positioning-system-explanation.html** - 編集システムデモ（localStorage永続化対応）
- **server.py** - Spine対応カスタムHTTPサーバー（.atlas配信、CORS対応）

### 編集システムファイル（本番統合用）
- **spine-positioning-system-explanation.css** - 編集UI専用スタイル（3.8KB）
- **spine-positioning-system-explanation.js** - 編集機能統合版（12.1KB）

### Spine WebGLシステム（assets/spine/）
```
spine/
├── characters/purattokun/   - Spine WebGLアセット（.atlas, .json, .png）
├── spine-integration-v2.js  - メイン統合システム
├── spine-character-manager.js - キャラクター管理
└── positioning/            - Canvas配置システム（JSON設定）
```

### 編集システム仕様（**本番統合完了**）
- **起動方法**: URLパラメータ `?edit=true` で編集モード有効化
- **動的読み込み**: 編集時のみCSS/JSファイルを読み込み（パフォーマンス最適化）
- **座標系**: 中心点基準（transform: translate(-50%, -50%)）
- **永続化**: localStorage + ページリロードキャンセル
- **リサイズ**: 対角固定点システム（SE/SW/NE/NW）
- **排他制御**: キャラクター・Canvas編集の同時実行防止

---

## 🚀 開発コマンド

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

### 編集システム開発・デバッグ
```bash
# 本番サイトの編集モードを起動（推奨）
python server.py
# → http://localhost:8000/index.html?edit=true

# 編集システムデモページを起動（開発・テスト用）
python server.py
# → http://localhost:8000/spine-positioning-system-explanation.html

# localStorage状態確認（ブラウザF12コンソール）
localStorage.getItem('spine-positioning-state')

# localStorage状態クリア（開発時）
localStorage.removeItem('spine-positioning-state')

# 編集モードアクセス例
# 通常表示: http://localhost:8000/index.html
# 編集モード: http://localhost:8000/index.html?edit=true
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

---

## 🎯 ぷらっとくん位置調整（HTML設定制御システム）

### 簡単調整方法
**ぷらっとくんの位置・演出設定をHTMLから直接制御可能**

#### 設定場所
`index.html`内の`#purattokun-config`セクション：

```html
<div id="purattokun-config" style="display: none;"
     data-x="18"            <!-- 横位置：18vw（背景画像同期） -->
     data-y="49"            <!-- 縦位置：49vh（地面レベル） -->
     data-scale="0.55"      <!-- サイズ：0.55倍 -->
     data-fade-delay="1500" <!-- 出現遅延（ms） -->
     data-fade-duration="2000"> <!-- フェード時間（ms） -->
</div>
```

#### 調整手順
1. `index.html`の`#purattokun-config`を見つける
2. `data-*`属性の数値を変更
3. ファイル保存 → ブラウザリロード（F5）
4. 変更を即座に確認

#### よく使う設定値
**横位置（data-x）:**
- 道路側: 8vw
- お店の入口: 15vw  
- **お店付近: 18vw（推奨・現在の設定）**
- 右寄り: 25vw

**縦位置（data-y）:**
- 上の方: 40vh
- **地面レベル: 49vh（推奨・現在の設定）**
- 下の方: 55vh

**サイズ（data-scale）:**
- 大きめ: 1.0
- **普通: 0.55（現在の設定）**
- 小さめ: 0.25

> ⚠️ **重要**: Spineキャラクターのサイズは**Canvas要素のCSS設定**と**Skeletonオブジェクトのscale値**の**両方**が影響します。どちらか一方だけでは変更できません。
> - CSS側: `width`, `height`属性
> - JS側: `skeleton.scaleX`, `skeleton.scaleY`値
> 両方を同時に調整する必要があります。

---

## 🎯 Canvas配置システム（モジュール化・2024年7月24日導入）

### 新配置システムの特徴
**JSON設定による宣言的配置管理** - 設定とコードの分離により保守性向上

#### システム構成
```
assets/spine/positioning/
├── canvas-positioning-system.js - 配置システム本体
└── placement-config.json        - 配置設定（JSON）
```

#### 利用可能な調整機能
ブラウザコンソール（F12）で以下のコマンドが利用可能：

```javascript
// 【新配置システム】
adjustCanvasPosition("hero-purattokun", "25%", "65%");  // 位置調整
getCanvasPlacement("hero-purattokun");                   // 配置情報確認
getAllCanvasPlacements();                                // 全配置情報確認

// 【従来システム（互換性保持）】
adjustCanvas(25, 65);            // 直接位置調整
testBackgroundAlignment();       // 背景画像との位置関係確認
```

#### JSON設定による位置制御
`assets/spine/positioning/placement-config.json` で詳細設定：

```json
{
  "placements": {
    "hero-purattokun": {
      "positioning": {
        "desktop": { "left": "20%", "top": "70%" },
        "mobile": { "left": "50%", "top": "75%" }
      }
    }
  }
}
```

### フォールバック機能
- 新システム読み込み失敗時は自動的に従来方式で動作
- 既存機能の完全保持を保証

---

## 🎯 本番編集システム（2025年1月26日統合完了）

### 編集モード起動方法
```bash
# 本番サイトで編集モード起動
http://localhost:8000/index.html?edit=true

# 通常モードに戻る
http://localhost:8000/index.html
```

### 編集UI操作
1. **編集モード起動**: URLに `?edit=true` を追加
2. **右上パネル表示**: 編集・Canvas・終了ボタンが表示
3. **キャラクター編集**: ドラッグ移動、リサイズハンドル操作
4. **Canvas編集**: 表示範囲の移動・リサイズ
5. **保存/キャンセル**: 確定パネルで設定永続化またはロールバック

### 技術仕様
- **動的読み込み**: 編集時のみ `spine-positioning-system-explanation.css/js` を読み込み
- **パフォーマンス**: 通常表示に影響なし（0オーバーヘッド）
- **永続化**: localStorage + ページリロード方式
- **互換性**: 既存システムとの完全共存

### デバッグコマンド（ブラウザF12コンソール）
```javascript
// 編集システム読み込み状態確認
typeof startCharacterEdit === 'function'
typeof startCanvasEdit === 'function'

// 保存状態確認
localStorage.getItem('spine-positioning-state')

// 編集モード強制終了
if (typeof endEditMode === 'function') endEditMode();
```

---

## 🚨 よくある問題とクイック解決

### 1. ぷらっとくんが表示されない
**→ [Spineトラブルシューティング](./docs/SPINE_TROUBLESHOOTING.md) を参照**

クイック対処法：
```bash
# ブラウザキャッシュクリア
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# サーバー確認
python server.py  # カスタムサーバー使用
```

**詳細診断が必要な場合は上記ドキュメントの「クイック診断チェックリスト」を実行してください**

### 2. 白い枠と同じ動きをする
**→ [レイヤー診断ガイド](./docs/LAYER_DEBUGGING.md) を参照**

上記ドキュメントの「緊急診断ツール」をブラウザコンソール（F12）で実行してください。

### 3. ウィンドウリサイズで位置がずれる
**→ [レイヤー診断ガイド](./docs/LAYER_DEBUGGING.md) の「診断ツール」を実行**
**→ [背景同期の成功事例](./docs/DEVELOPMENT_GUIDE.md#背景画像とキャラクターの完全同期2024年7月実装) も参照**

### 4. Canvasのサイズが変更できない
**→ [Canvasサイズ変更トラブルシューティング](./docs/CANVAS_SIZE_TROUBLESHOOTING.md) を参照**

上記ドキュメントの診断ツールをブラウザコンソール（F12）で実行してください。

### 5. Spine関連エラー
**→ [Spineトラブルシューティング](./docs/SPINE_TROUBLESHOOTING.md) を参照**

### 6. 編集モードが起動しない
**→ [本番編集システム](#🎯-本番編集システム2025年1月26日統合完了) の「デバッグコマンド」を参照**

クイック確認：
```bash
# URLパラメータ確認
http://localhost:8000/index.html?edit=true

# F12コンソールでファイル読み込み確認
typeof startCharacterEdit === 'function'
```

### 7. 編集システムの保存・復元ができない
**→ [編集システム仕様書](./docs/POSITIONING_SYSTEM_SPECIFICATIONS.md) を参照**

localStorage関連の問題は上記ドキュメントの「永続化システム」セクションを確認してください。

### 8. 編集モードでキャラクターが消える
**→ [編集システム仕様書](./docs/POSITIONING_SYSTEM_SPECIFICATIONS.md) の「重要な修正履歴」を参照**

座標系統一に関する既知の問題と解決策が記載されています。

---

## 📋 段階的実装記録（2024年7月24日）

### 問題：白い枠との動きの同期
**症状**: Canvas要素が`.hero-content`（白い枠）と同じ動きをしてしまう

### 解決アプローチ：段階的モジュール化
❌ **避けた手法**: いきなりのフル構造変更（リスク大）  
✅ **採用した手法**: 段階的なモジュール化戦略（リスク分散）

#### Phase 1: 基盤構築（30分）
- `CanvasPositioningSystem`クラス作成
- JSON設定による配置管理システム
- **既存システム影響なし**

#### Phase 2: 段階的統合（15分）
- 既存`spine-character-manager.js`との統合
- フォールバック機能による安全性確保
- **既存機能完全保持**

#### Phase 3: 動作検証（完了）
- 新旧システムの並行動作確認
- ブラウザテストと調整機能確認

### 実装ルール（今後のガイドライン）
1. **最小変更の原則**: 問題解決に必要最小限の変更
2. **段階的実装**: 各段階でテスト・ロールバック準備
3. **フォールバック必須**: 新機能失敗時の安全機能
4. **ドキュメント化**: 解決プロセスの記録と予防策策定

### 将来拡張可能機能
- 動的キャラクター切り替え
- ページ遷移連動演出  
- 管理画面からの設定変更
- A/Bテスト対応

---

## 🎬 Spineアニメーション改良システム（2024年7月24日実装）

### アニメーションシーケンスの実装
ぷらっとくんのアニメーションを「登場→待機モーション」の自然な流れに改良しました。

#### 実装内容
- **syutugen（出現）**: キャラクターの登場アニメーション（1回のみ再生）
- **taiki（待機）**: アイドル状態のループアニメーション（無限ループ）
- **自動遷移**: syutugen完了後、自動的にtaikiに移行

#### 技術仕様
```javascript
// アニメーションシーケンスの開始
this.animationController.playSequence(name, ['syutugen', 'taiki']);

// Spine WebGL: AnimationState完了イベントで自動遷移
// Placeholder: タイマーベースで1秒後に遷移（1000ms）
```

#### クリック動作の変更
- **旧仕様**: クリック→click アニメーション→taiki復帰
- **更新仕様**:クリック→syutugen→taiki のフルシーケンス再生
- **最新仕様**: クリック→yarare（やられ）→taiki のダメージシーケンス再生

#### プレースホルダー対応
SpineWebGL読み込み失敗時もCSS keyframeアニメーションで同様の動作を実現：
- `placeholderAppear`: 出現アニメーション（1秒）
- `placeholderFloat`: 浮遊アニメーション（3秒ループ）

#### デバッグ確認方法
```javascript
// コンソールで確認できるログ
// "Playing syutugen (appearance) animation once for purattokun"
// "Syutugen animation completed, transitioning to taiki"
```

---

## 💡 開発時の注意事項

### 必須事項
- **HTTPサーバー必須**: file://プロトコルでは動作しません
- **ブラウザキャッシュ**: Spineファイル更新時は必ずハードリフレッシュ
- **F12コンソール**: エラー確認の習慣化

### パフォーマンス
- 画像遅延読み込み使用
- CSS Grid, Flexbox 使用
- モダンブラウザ対応（ES6+）

### デバッグ
- F12開発者ツールでコンソール確認
- 右上デバッグパネル（開発時のみ表示）
- レスポンシブ表示確認（デベロッパーツール）

---

## 🎯 効果的なデバッグ手法：シンプルサンプル方式

### 実証済みの問題解決アプローチ
複雑な問題に対して「最小限のサンプルシーンを作成し、それに近づける」手法が非常に有効でした。

#### 成功事例：背景画像とSpineキャラクターの同期問題
1. **test-simple-spine.html** で最小限の成功パターンを作成
2. 成功パターンと本番コードの**構造的差異**を分析
3. 本番コードを成功パターンに段階的に近づける

#### この手法の利点
- **根本原因の特定**: 複雑な要因を排除して核心を見つける
- **安全な修正**: 成功パターンがあるため確実に動作する
- **学習効果**: 「なぜ動くのか」が明確になる
- **再現性**: 同様の問題に対して再利用可能

#### 適用すべき場面
- 複数要素が絡む位置ズレ問題
- レスポンシブ動作の不具合
- CSS/JavaScript統合の問題
- アニメーション同期の問題

#### 実装手順
1. **最小限のテストファイル作成** (`test-*.html`)
2. **成功パターンの確立** (動作することを確認)
3. **構造的差異の分析** (成功版 vs 本番版)
4. **段階的修正** (一つずつ差異を埋める)
5. **動作確認** (各段階でテスト実行)

**→ 今後の複雑な問題はこの手法を優先的に適用すること**

---

## 🔗 問題発生時の参照先

### 📋 問題別対応表

| 具体的な問題 | 参照ドキュメント | セクション |
|-------------|----------------|-----------|
| **🚨 ぷらっとくんが表示されない** | [⚙️ docs/SPINE_TROUBLESHOOTING.md](./docs/SPINE_TROUBLESHOOTING.md) | クイック診断チェックリスト |
| **🔄 白い枠と同じ動きをする** | [🔧 docs/LAYER_DEBUGGING.md](./docs/LAYER_DEBUGGING.md) | 緊急診断ツール |
| **📐 ウィンドウリサイズで位置ズレ** | [🔧 docs/LAYER_DEBUGGING.md](./docs/LAYER_DEBUGGING.md) | 診断ツール |
| **🎯 Canvasサイズ変更できない** | [🎯 docs/CANVAS_SIZE_TROUBLESHOOTING.md](./docs/CANVAS_SIZE_TROUBLESHOOTING.md) | 全セクション |
| **⚙️ Spine関連エラー全般** | [⚙️ docs/SPINE_TROUBLESHOOTING.md](./docs/SPINE_TROUBLESHOOTING.md) | 症状に応じたセクション |
| **🎮 編集モードが起動しない** | [この文書](#🎯-本番編集システム2025年1月26日統合完了) | デバッグコマンド |
| **💾 編集システム保存・復元問題** | [📋 docs/POSITIONING_SYSTEM_SPECIFICATIONS.md](./docs/POSITIONING_SYSTEM_SPECIFICATIONS.md) | 永続化システム |
| **👻 編集でキャラクター消失** | [📋 docs/POSITIONING_SYSTEM_SPECIFICATIONS.md](./docs/POSITIONING_SYSTEM_SPECIFICATIONS.md) | 重要な修正履歴 |

### 📚 技術分野別参照表

| 技術分野 | 参照ドキュメント |
|---------|----------------|
| **🎯 編集システム仕様・設計** | [📋 docs/POSITIONING_SYSTEM_SPECIFICATIONS.md](./docs/POSITIONING_SYSTEM_SPECIFICATIONS.md) |
| **📊 実装進捗・計画管理** | [📈 docs/POSITIONING_SYSTEM_PROGRESS.md](./docs/POSITIONING_SYSTEM_PROGRESS.md) |
| **🔧 レイヤー・位置関連問題** | [🔧 docs/LAYER_DEBUGGING.md](./docs/LAYER_DEBUGGING.md) |
| **⚙️ Spine WebGL関連問題** | [⚙️ docs/SPINE_TROUBLESHOOTING.md](./docs/SPINE_TROUBLESHOOTING.md) |
| **🎯 Canvas操作関連問題** | [🎯 docs/CANVAS_SIZE_TROUBLESHOOTING.md](./docs/CANVAS_SIZE_TROUBLESHOOTING.md) |
| **📖 新機能・技術実装詳細** | [📖 docs/DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md) |
| **🏛️ 設計思想・アーキテクチャ** | [🏛️ docs/ARCHITECTURE_NOTES.md](./docs/ARCHITECTURE_NOTES.md) |
| **📋 開発時品質チェック** | [📋 docs/DEVELOPMENT_CHECKLIST.md](./docs/DEVELOPMENT_CHECKLIST.md) |
| **🚨 失敗事例・予防策** | [🚨 docs/FAILURE_ANALYSIS_CANVAS_SIZE.md](./docs/FAILURE_ANALYSIS_CANVAS_SIZE.md) |

---

## 🎨 基本的なスタイリング

### カラーパレット
- メインカラー: `#ff6b6b` (猫らしいピンク)
- 背景: `#fafafa` (優しいグレー)
- テキスト: `#333` (ダークグレー)

### レスポンシブ breakpoint
- モバイル: `max-width: 768px`
- コンテナ最大幅: `1200px`

---

## 🔄 メンテナンス

### 新しい問題を解決した時
1. 問題の種類を判断（レイヤー/Spine/一般）
2. 適切なdocsファイルに解決策を記録
3. このCLAUDE.mdのクイック解決に追加（必要に応じて）

### 新機能を追加した時
1. [DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md) に技術詳細を記録
2. このCLAUDE.mdに日常操作方法を記録
3. [ARCHITECTURE_NOTES.md](./docs/ARCHITECTURE_NOTES.md) に設計思想を記録（必要に応じて）

---

**📚 詳細な技術情報は [docs フォルダ](./docs/) を参照してください**