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
| **技術仕様・実装詳細** | [📖 docs/DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md) |
| **レイヤー問題診断** | [🔧 docs/LAYER_DEBUGGING.md](./docs/LAYER_DEBUGGING.md) |
| **Spine問題解決** | [⚙️ docs/SPINE_TROUBLESHOOTING.md](./docs/SPINE_TROUBLESHOOTING.md) |
| **設計思想・アーキテクチャ** | [🏛️ docs/ARCHITECTURE_NOTES.md](./docs/ARCHITECTURE_NOTES.md) |

---

## プロジェクト概要

「ぷらっとくんの予約システム」はレスポンシブWebサイトです。ネコヤ（猫と人が幸せに暮らす住まいづくり）をコンセプトとした、スクロール連動アニメーションが豊富な静的サイトです。

## ファイル構造（主要部分）

```
/
├── index.html              - メインサイト（SEO最適化済み、Spine WebGL統合済み）
├── server.py              - Spine対応カスタムHTTPサーバー（.atlas配信対応）
├── docs/                  - 📁 技術ドキュメント集
│   ├── README.md           - ドキュメントナビゲーション
│   ├── DEVELOPMENT_GUIDE.md - 技術仕様・実装詳細
│   ├── LAYER_DEBUGGING.md  - レイヤー問題診断
│   ├── SPINE_TROUBLESHOOTING.md - Spine問題解決
│   └── ARCHITECTURE_NOTES.md - 設計思想・アーキテクチャ
├── assets/
│   ├── css/styles.css      - スタイルシート
│   ├── js/script.js        - JavaScript統合版
│   ├── images/             - 画像ファイル
│   └── spine/              - Spine WebGL関連
│       ├── positioning/     - 📁 Canvas配置システム（モジュール化）
│       │   ├── canvas-positioning-system.js - 配置システム本体
│       │   └── placement-config.json        - 配置設定JSON
│       ├── spine-character-manager.js       - キャラクター管理（統合済み）
│       └── spine-integration-v2.js          - Spine統合システム
└── demos/                 - テスト用ページ
```

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

## 🚨 よくある問題とクイック解決

### 1. ぷらっとくんが表示されない
```bash
# ブラウザキャッシュクリア
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# サーバー確認
python server.py  # カスタムサーバー使用
```

### 2. 白い枠と同じ動きをする
**→ [レイヤー診断ガイド](./docs/LAYER_DEBUGGING.md) を参照**

ブラウザコンソール（F12）で診断実行：
```javascript
// 緊急診断ツール
function emergencyDiagnosis() {
    const canvas = document.querySelector('canvas[data-spine-character]');
    if (!canvas) {
        console.log('❌ Canvas要素が見つかりません！');
        return;
    }
    
    // 親要素チェック
    console.log('親要素:', canvas.parentElement?.tagName);
    
    // 強制修正
    if (canvas.parentElement !== document.body) {
        document.body.appendChild(canvas);
        console.log('🔧 Canvas を body に移動');
    }
    
    canvas.style.position = 'absolute';
    canvas.style.left = '18vw';
    canvas.style.top = '49vh';
    canvas.style.transform = 'translate(-50%, -50%)';
    canvas.style.zIndex = '10';
    
    console.log('🎯 緊急修正完了');
}

emergencyDiagnosis();
```

### 3. ウィンドウリサイズで位置がずれる
**→ [レイヤー診断ガイド](./docs/LAYER_DEBUGGING.md) の「診断ツール」を実行**
**→ [背景同期の成功事例](./docs/DEVELOPMENT_GUIDE.md#背景画像とキャラクターの完全同期2024年7月実装) も参照**

### 4. Spine関連エラー
**→ [Spineトラブルシューティング](./docs/SPINE_TROUBLESHOOTING.md) を参照**

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

| 問題の種類 | 参照ドキュメント |
|-----------|----------------|
| **レイヤー・位置問題** | [🔧 docs/LAYER_DEBUGGING.md](./docs/LAYER_DEBUGGING.md) |
| **Spine表示・エラー** | [⚙️ docs/SPINE_TROUBLESHOOTING.md](./docs/SPINE_TROUBLESHOOTING.md) |
| **新機能・技術仕様** | [📖 docs/DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md) |
| **設計・リファクタリング** | [🏛️ docs/ARCHITECTURE_NOTES.md](./docs/ARCHITECTURE_NOTES.md) |

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