# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

※重要　やり取りは日本語でお願いします。
深く考えてください。

## 🚨 作業時の判断基準（Claude必須確認）

### 🟢 確認不要（すぐ実行）
- 明らかなバグ修正
- ドキュメントの誤字脱字修正
- コメント追加・改善
- ログ出力の追加
- 既存機能の動作確認
- テストコードの実行

### 🔴 確認必須（質問する）
- 既存機能の変更・削除
- ファイル構造の変更
- 新規機能の実装方針
- 「1行追加」「プラグイン」などキーワードが出た時
- 実装規模の判断が必要な時
- 複数の解釈が可能な要件

### 💭 判断フロー
1. これは既存機能を変更するか？ → YES なら確認
2. 実装規模が要求と異なる可能性があるか？ → YES なら確認
3. 過去に同じ失敗をしたパターンか？ → YES なら確認

すべて NO → そのまま進める

### 🚫 よくある失敗パターン（繰り返し禁止）
- 既存システムを理解せずに新規作成
- 1行追加の要望に対して大きなファイル作成
- 確認なしに既存機能を変更
- **🚨 技術仕様書の複雑UIを本実装と誤認**（2024-09-04追加）
- **マニュアル未確認での既存モジュール実装**（🆕 2025-09-04追加）

### 🚨 **マニュアル確認絶対必須**（実装前必須チェック）
以下に該当する場合は、**実装前に必ずマニュアル・README・仕様書を確認**：

- ✅ **既存モジュール・システムの統合や呼び出し**
- ✅ **API・メソッド・クラスの使用**
- ✅ **ライブラリ・フレームワークの利用**
- ✅ **設定ファイル・設定項目の変更**
- ✅ **新しいツール・機能の導入**

**⚠️ 絶対ルール**: マニュアル確認なしの実装は**禁止**

#### **実装前チェックリスト（必須）**:
```
🚨 実装開始前に以下を必ず確認：
- [ ] 既存モジュール・システムを使用する？ → YES: マニュアル確認必須
- [ ] API・メソッド・クラスを呼び出す？ → YES: マニュアル確認必須  
- [ ] ライブラリ・フレームワークを利用する？ → YES: マニュアル確認必須
- [ ] 関連するマニュアル・README・仕様書を確認済み？
- [ ] 正しい使用方法をユーザーに確認済み？
- [ ] 推測ではなくマニュアル通りの実装方針？
```

#### **マニュアル確認手順**:
1. **Glob・Bashでマニュアル・README検索** → 関連ドキュメント特定
2. **Readでマニュアル内容確認** → 正しい使用方法理解
3. **実装前に使用方法をユーザーに確認** → 間違った推測を防止
4. **マニュアル通りに実装** → 推測による独自実装禁止

#### **失敗事例（具体例・繰り返し禁止）**:
```
❌ CanvasResizeController失敗例1（2025-09-04）:
   推測：「new CanvasResizeController()で使えるだろう」
   実装：直接クラス呼び出しで統合
   結果：完全に間違った実装（iframe+postMessageが正解）

❌ CanvasResizeController失敗例2（2025-09-04）:
   間違った参照：TECHNICAL_SPEC.mdの複雑UI仕様
   実装：複雑なステータス・テスト機能付きUI
   結果：シンプルなUIが複雑化（README基本使用方法が正解）
   根本原因：技術仕様書を本実装マニュアルと誤認
   
✅ 正しい対処：
   1. マニュアル確認 → iframe統合が正しい方法と判明
   2. 基本使用方法最優先 → シンプルなui.html参照
   3. 技術仕様書はあくまで参考資料として扱う
   4. ユーザーに確認 → 正しい実装方針決定
```

### 🎯 **v3.0システム開発哲学（絶対遵守）**
**コンセプト**: 「シンプル・軽量・複雑化回避」

#### 🚨 **最重要原則**（全Claude必須記憶）
- **過去の失敗教訓**: 機能追加による複雑化でシステム破綻
- **v3.0の絶対方針**: 必要最小限・シンプル設計・軽量性維持
- **禁止事項**: 「良かれと思って」の機能提案・実装

#### **Claude行動指針**:
1. **機能提案禁止**: ユーザーから明確な要求がない限り新機能提案しない
2. **シンプル性最優先**: 複雑な解決策より単純な解決策を選択
3. **軽量性厳守**: ファイルサイズ・処理負荷を常に意識
4. **既存機能重視**: 新機能より既存機能の安定化・シンプル化

#### **判断基準**:
- 提案前に自問: 「これは本当に必要最小限か？」
- 実装前に確認: 「これはv3.0のシンプル哲学に反しないか？」
- 「便利そう」「あったら良い」は実装理由にならない

---

## 📏 ファイルサイズ管理ルール（2025-08-07追加）

### 🎯 **500行制限ルール**
**基本方針**: 500行を超えたファイルは**検討対象**として扱う

#### **運用ルール**:
- **500行超過 = 自動的にリファクタリング対象**として記録
- **機能要件によっては500行超過を許可**（ただし要検討・要記録）
- **1,000行以上 = 緊急分割対象**として優先的に処理

#### **例外基準**:
- 外部ライブラリ（Spine WebGL等）は除外
- 設定ファイル・データファイルは除外
- 分割により複雑度が増加する場合は例外検討

### 🗂️ **大容量ファイル整理状況（2025-08-18更新・Phase 3完成）**

#### **✅ 完了した整理成果**
1. **デスクトップアプリv2.0モジュール分割**: 8つの独立モジュール・500行制限75%達成
2. **spine-preview-layer 4分割システム**: 1,200行超→287+603+559+252行（責務明確化）
3. **ApplicationCore統合制御**: 488行・全モジュール統合管理システム確立

#### **🚨 継続中の整理対象**
1. **Spine WebGLライブラリ重複**: 47,520行→11,880行（4重複→1本化・完了済み）
2. **旧v3.0アーカイブ**: 5,437行（圧縮・アーカイブ化予定）
3. **現v3.0メインシステム**: 3,867行（モジュール分割予定）

#### **📊 Phase 3整理効果実績**
- **デスクトップアプリv2.0**: 500行制限75%達成・平均350行（70%軽量化）
- **保守性向上**: モジュール分離によるデバッグ・修正容易性大幅向上
- **拡張性確保**: 8つの独立モジュール・Phase 4統合開発基盤確立
- **機能保持**: Phase 2機能（AssetRegistry・WebGL安定性）100%保持

---

## 🎯 現在の作業状況（2025-09-01更新）

### ✅ **StableSpineRenderer完成・黒枠問題完全解決（2025-09-02）**
**現状**: StableSpineRenderer完成・黒枠問題完全解決・安定版モジュール運用開始 ✅

**✅ 今日の達成成果（2025-09-02）**:
- **StableSpineRenderer完成**: `test-spine-basic-loading.html` の成功パターンを基準とした安定版モジュール
- **黒枠問題完全解決**: `premultipliedAlpha: true` 固定化により口周りの黒枠根本解決
- **毎回確実動作実現**: AIセッション間での実装ばらつき問題の完全解決
- **完全マニュアル作成**: 133セクションの詳細マニュアル・API仕様書完成
- **🎯 自動アニメーション検出機能実装**: キャラクター固有アニメーション名の自動検出・完全汎用性実現
- **🎨 縦横比問題完全解決**: HTMLCanvasサイズ優先による歪み問題根本解決

**🎯 StableSpineRenderer完成成果**:
1. **⭐ StableSpineRenderer.js**: 黒枠問題完全解決・安定動作保証の最高推奨モジュール
2. **📚 STABLE_SPINE_RENDERER_GUIDE.md**: 133セクション完全マニュアル・実用サンプル豊富
3. **🔧 test-stable-spine-renderer.html**: 動作確認・機能テスト用ファイル

**🔍 重要な技術的発見**:
- **黒枠問題の根本原因**: `premultipliedAlpha: false` がSpine口周りの黒枠原因と特定
- **成功パターン移植戦略**: `test-spine-basic-loading.html` の動作確認済み設定を完全移植
- **AI実装ばらつき解決**: 設定固定化により毎回同じ結果を保証するモジュール設計
- **🎯 完全汎用性の実現**: 自動アニメーション検出により任意のSpineキャラクター対応
- **🎨 縦横比問題の根本原因**: Canvas強制リサイズ（400x400）による歪み発生と解決策確立

**📋 StableSpineRenderer設計方針**:
1. **成功パターン固定化**: 動作確認済みの設定を変更禁止として固定
2. **汎用性重視設計**: 任意のSpineキャラクター・プロジェクトで利用可能
3. **シンプルAPI**: `createForCharacter()` でワンライン初期化
4. **確実性保証**: 毎回エラーなく動作・黒枠なしを保証

**📂 実装ファイル**: `micromodules/spine-renderer/StableSpineRenderer.js`
**📋 完成資料**: 
- **モジュール本体**: `micromodules/spine-renderer/StableSpineRenderer.js`
- **完全マニュアル**: `docs/manuals/STABLE_SPINE_RENDERER_GUIDE.md`
- **Canvas品質設定**: `docs/manuals/CANVAS_QUALITY_SETTINGS_GUIDE.md` - デスクトップアプリ統合用4段階品質システム
- **テストファイル**: `test-stable-spine-renderer.html`
- **解決記録**: `docs/troubleshooting/Spine口周り黒枠問題完全解決記録.md`

**🚀 StableSpineRenderer使用方針**:
- **最高推奨**: 新規Spine実装時の第一選択肢
- **黒枠解決**: 口周りの黒枠問題を根本的に解決
- **確実性**: 毎回エラーなく安定動作を保証

**🔧 完成モジュール構造**:
```
micromodules/spine-renderer/
├── StableSpineRenderer.js     # ⭐ 最高推奨・黒枠問題完全解決版
├── requirements/              # 要件定義書（完成済み）
└── [アーカイブ済み]
    ├── UniversalSpineRenderer.js → archive/universal-spine-renderer-archive/
    └── PureSpineLoader.js → archive/pure-spine-loader-archive/
```

### 🚀 **バウンディングボックス自動ピンシステム開発Phase 1完了・Phase 2課題継続中（2025-08-30）**
**現状**: 基本実装完了・レスポンシブ比率保持に技術的課題あり ⚠️

**✅ Phase 1完了成果**:
- PureBoundingBoxAutoPin.js実装完了（710行）
- 右クリックコンテキストメニューUI実装
- 保存時の自動ピン適用機能
- localStorage永続化システム
- 背景要素自動検出・9アンカーポイント最適化

**🔴 Phase 2未解決課題**:
- **ウィンドウリサイズ時のBB比率変動問題**
- **問題詳細**: ウィンドウサイズ変更後、要素の実ピクセルサイズが変化し、次回BB編集時に異なる比率として認識される
- **試行した解決策**: 
  - 真の初期サイズ基準でのパーセンテージ計算 → 副作用でBB編集不可
  - 編集結果優先 + 実サイズ保存システム → 部分的改善
  - ResizeObserver による heroSection監視 → 動作せず
- **技術的課題**: パーセンテージベースの要素が親要素リサイズ時に実ピクセルサイズが変化するため、編集時の比率情報が失われる

**📋 次回継続タスク**:
1. **根本的アプローチの見直し**: パーセンテージ vs ピクセル基準の設計再検討
2. **比率保持システムの再設計**: ウィンドウリサイズに対応する根本的解決策
3. **実用性重視の代替案検討**: 完璧な比率保持よりも実用的な妥協案

**🔧 技術実装状況**:
- **主要ファイル**: 
  - `micromodules/bounding-box/PureBoundingBoxAutoPin.js` (710行) - 自動ピン機能
  - `micromodules/bounding-box/PureBoundingBoxCore.js` - 座標変換システム（編集結果優先に修正済み）
  - `micromodules/bounding-box/PureBoundingBoxUI.js` - 右クリックメニュー + パーセンテージ表示機能
  - `micromodules/bounding-box/PureBoundingBoxEvents.js` - 実サイズ保存機能追加済み
  - `test-bounding-box-autopin.html` - テスト環境 + 位置復元機能 + ResizeObserver監視

**🧪 継続用テスト環境**: `test-bounding-box-autopin.html`
- BB編集・保存・復元機能: ✅動作中
- 右クリックメニュー: ✅動作中
- パーセンテージ表示: ✅動作中
- 比率保持機能: ❌未解決（ResizeObserver検出されない）

### 🧪 **ElementObserver Phase 2実装完了！（2025-08-27）**
**現状**: Phase 2高度座標システム統合・完全実装達成・テスト準備完了 ✅

**🎯 重要: 透明自動ピンシステム継続案内**
- **仕様書完成**: [📋 BOUNDING_BOX_AUTO_PIN_SPECIFICATION.md](./docs/BOUNDING_BOX_AUTO_PIN_SPECIFICATION.md) - 完全な設計仕様
- **実装対象**: PureBoundingBoxAutoPin.js + UI拡張 + 背景検出システム
- **次回作業**: PureBoundingBoxAutoPin.jsモジュール実装から開始
- **キーワード**: バウンディングボックス、自動ピン、保存=ピン適用、背景要素検出

**✅ 仕様書完成成果（2025-08-29）**:

1. **🎯 透明自動ピンシステム設計**:
   - **保存=自動ピン適用**: ユーザーはピンを意識せずに保存するだけ
   - **9アンカーポイント最適化**: TL,TC,TR,ML,MC,MR,BL,BC,BR から最適選択
   - **背景要素自動検出**: ResizeObserver による動的検出機構
   - **ElementObserver Phase 1 BB特化版統合**: 高性能座標システムとの連携

2. **🚀 実装フェーズ設計**:
   - **Phase 1**: PureBoundingBoxAutoPin.js基盤モジュール
   - **Phase 2**: 背景検出・最適化計算システム  
   - **Phase 3**: ElementObserver Phase 1 BB特化版統合テスト
   - **配置自由度**: 9箇所制限なし・任意座標配置可能

3. **🔧 技術仕様確立**:
   - **座標変換アルゴリズム**: 絶対座標→アンカー相対座標
   - **レスポンシブ対応**: 画面リサイズ時の位置関係維持
   - **グレースフルデグラデーション**: 検出失敗時の安全動作
   - **パフォーマンス目標**: ElementObserver Phase 1品質継承

**📋 実装準備完了タスクリスト**:
- [ ] **PureBoundingBoxAutoPin.js** - 自動ピン機能核モジュール
- [ ] **PureBoundingBoxUI.js拡張** - 保存ボタン統合
- [ ] **背景要素自動検出** - ResizeObserver基盤システム
- [ ] **最適アンカー計算** - 9ポイント選択アルゴリズム
- [ ] **Phase 1 BB特化版統合テスト** - 高性能座標連携確認

**✅ Phase 2完全実装成果（2025-08-27）**:

1. **🎯 4つの専門モジュール実装達成**:
   - **ElementObserverTransform.js**: CSS Transform統合システム（565行）
   - **ElementObserverWebGL.js**: DOM⟷WebGL座標変換システム（503行）
   - **ElementObserverResponsive.js**: レスポンシブWebGL管理（713行）
   - **ElementObserver.js**: Phase 1統合制御システム（767行）

2. **🚀 技術実装成果**:
   - **5座標系統合**: DOM・CSS Transform・WebGL・Spine Skeleton・Canvas座標の統一
   - **統合API**: `setUnifiedPosition()` による一元制御システム
   - **リアルタイム同期**: 60fps/120fps対応の座標同期機能
   - **CSS変数管理**: --tx, --ty, --scale, --rotation自動更新
   - **デバイス対応**: DPR補正・レスポンシブ品質制御

3. **🔧 高度PureBoundingBox統合**:
   - Phase 1完全互換性保持
   - 次世代座標制御システム基盤確立
   - 複雑な座標変換の自動処理

4. **🧪 包括的テスト環境構築**:
   - **test-element-observer-phase2-integration.html**: Phase 2統合テストファイル（620行）
   - 統合座標テスト・変換精度テスト・レスポンシブ品質テスト対応
   - 統合モジュール設計準備完了

**📊 実装統計**:
- **総コード量**: 2,548行（4モジュール）
- **Git保存**: コミット87bd585でリモート保存済み
- **拡張性**: Phase 3準備完了・モジュール分離設計

**🎯 明日のテスト手順**:
```bash
# サーバー起動
python server.py

# テストファイル開く
http://localhost:8000/test-element-observer-phase2-integration.html

# テスト項目
1. 統合座標テスト: setUnifiedPosition() API動作確認
2. 座標変換テスト: DOM⟷WebGL変換精度確認  
3. レスポンシブテスト: DPR・品質制御確認
4. PureBoundingBox統合テスト: 高度統合機能確認
```

**🔄 Phase 3準備状況**:
- Phase 2基盤による高度機能実装準備完了
- 統合API安定化・パフォーマンス最適化対応
- ElementObserver最終進化形への発展基盤確立

### ✅ 完了済み主要システム（詳細は[アーカイブ](./docs/archive/)参照）

- **Spine編集システムv2.0**: 完全実装済み・商用制作ツール完成 → [詳細](./docs/archive/SPINE_EDITING_HISTORICAL_RECORD.md)
- **完全パッケージ出力機能**: Phase A/B/C完了・商用品質達成 → [詳細](./docs/archive/SPINE_EDITING_HISTORICAL_RECORD.md)
- **従来システム**: 完全保持・レガシー対応 → [詳細](./docs/archive/LEGACY_SYSTEMS_RECORD.md)
- **バウンディングボックス編集システム**: Phase 1完了 → [詳細](./docs/archive/LEGACY_SYSTEMS_RECORD.md)

## 🚨 **明日最優先継続作業（2025-09-06開始時）**

### 🔍 **AutoPin座標混入95%問題の根本診断実行**
**現状**: BB編集中のAutoPin座標レイヤー分離システムを実装したが、依然として95%の座標混入が検出される重大な問題が未解決

#### **🎯 明日開始時の作業指示**
```
1. サーバー起動: python server.py
2. 診断ページ開く: http://localhost:8000/simple-pin-test-fixed.html
3. 以下の診断フローを実行:
   - 「📋 DOM状態キャプチャ」→ BB編集前状態保存
   - 「🕵️ 高度監視開始」→ リアルタイム変更監視開始  
   - 「📦 BB編集開始」→ AutoPin座標レイヤー削除処理実行
   - 「🔄 編集前後比較」→ 何が変更されたか詳細確認
   - 「🧪 座標純度チェック」→ なぜ95%なのかの内訳確認
```

#### **🔍 実装済み診断システム**
- **DOM状態詳細確認** - spine-canvasの全属性・CSS・computed style確認
- **編集前後比較** - BB編集処理による実際の変更内容追跡
- **高度監視システム** - MutationObserverによるリアルタイム変更検出
- **座標純度チェック詳細化** - 95%判定の具体的内訳表示

#### **🎯 期待される発見**
- AutoPin座標レイヤー削除処理が本当に実行されているか
- spine-canvasのDOM状態が実際に変更されているか  
- 座標純度チェック機能の判定基準が適切か
- BB編集中に意図しないAutoPin処理が実行されていないか

#### **📋 解決戦略候補**
診断結果に基づき以下のいずれかを実行:
1. **座標レイヤー削除処理の強化** - より確実な削除方法
2. **DOM置換方式** - spine-canvas要素の完全置換
3. **AutoPin無効化方式** - AutoPinシステムの完全削除
4. **判定基準見直し** - 座標純度チェックの調整

### 🔄 次回継続すべき作業（優先順）

#### 🚀 **デスクトップアプリv2.0開発Phase 10完全達成！** → [詳細は実装記録参照](./docs/archive/IMPLEMENTATION_METHODOLOGIES.md)

**現状**: 6モジュール統合システム完成・商用品質アーキテクチャ確立 ✅

**🎯 Phase 11-14開始準備（次期優先課題）**:
1. **フォルダ機能完全統合**: プロフェッショナルファイル管理システム
2. **商用制作ツール機能統合**: 完全制作ワークフロー・効率最大化
3. **パフォーマンス最適化**: プロフェッショナルツール完成度向上

#### 🎬 **タイムライン統合方法検討（継続）**
**現状**: 技術実装完了 → 統合方法の意思決定待ち

**3つのアプローチ**:
1. **Edit Mode統合** - 既存`?edit=true`追加（安全）
2. **Normal Mode統合** - 通常ページ直接統合（高機能・高リスク）  
3. **外部アプリ + パッケージ出力** - 独立制作ツール（商用最適）

### 🤖 開発スタイル推奨事項
- **🚀 サブエージェント優先**: 基本的に全ての作業でサブエージェントを積極活用
- **⚡ 並列処理推奨**: 複数タスクがある場合は必ずサブエージェントで並列実行
- **🎯 適切なエージェント選択**: タスクの性質に応じて最適なサブエージェントを選択
- **📋 段階的実装**: 大きな機能は Phase 分けで安全に実装
- **🛡️ 既存システム保護**: 既存機能への影響ゼロ保証を最優先
- **📝 記録の徹底**: 問題解決時は必ずトラブルシューティング記録を作成

#### 🤖 サブエージェント選択指針

**基本方針**: 「1つのタスク = 1つのサブエージェント」を原則

**📋 エージェント選択フロー**:
```
1. 緊急度・複雑度の判定
   ├─ 緊急 & 単純 → 高速修正エージェント
   ├─ 緊急 & 複雑 → トラブル診断エージェント
   └─ 計画 & 新機能 → 設計レビュー → 慎重編集エージェント

2. 作業スコープの判定
   ├─ 単一ファイル & 明確 → 高速修正エージェント
   ├─ 複数ファイル or 影響範囲大 → 慎重編集エージェント
   └─ 調査・分析中心 → General-Purpose エージェント
```

**📚 詳細な選択指針・評価基準**: [サブエージェント利用ガイド](./docs/subagents/DAILY_SUBAGENT_USAGE.md)

### 📍 現在の技術状況（2025-09-01更新）

#### 🎯 **v3.0モジュール化システム（商用制作用）**
- **アクセス**: `http://localhost:8000/index.html?edit=true`
- **操作方法**: キャラクター直接クリック選択・ドラッグ移動・矢印キー精密移動
- **商用機能**: 「📋 CSS出力」「📦 パッケージ出力」ボタン
- **システム機能**: 複数キャラクター管理・完全モバイル対応・localStorage v3.0

#### 🎮 利用方法
- **編集作業**: v3.0モジュール化システム（拡張性・安定性重視）
- **開発・デバッグ**: F12コンソールで各種診断関数利用可能
- **レガシー情報**: [アーカイブシステム](./docs/archive/LEGACY_SYSTEMS_RECORD.md)参照

## 🚨 このファイルの管理方針（Claude向け）

1. **このファイルは簡潔に保つ** - 詳細はdocs/フォルダへ
2. **構造を変更しない** - 既存の構造を維持して追記のみ  
3. **新しい情報の追加先**:
   - 技術的詳細 → docs/DEVELOPMENT_GUIDE.md
   - **問題解決 → [📋 docs/_TROUBLESHOOTING.md](./docs/_TROUBLESHOOTING.md) から適切なファイルを検索**
   - 設計思想 → docs/ARCHITECTURE_NOTES.md
   - **歴史的記録 → [📁 docs/archive/](./docs/archive/) 各ファイル**
4. **このファイルには参照リンクのみ追加**

### 📚 **2025-09-04 アーカイブ作成完了**
- [📋 Spine編集システム歴史記録](./docs/archive/SPINE_EDITING_HISTORICAL_RECORD.md)
- [📁 レガシーシステム記録](./docs/archive/LEGACY_SYSTEMS_RECORD.md)  
- [⚙️ 実装方法論記録](./docs/archive/IMPLEMENTATION_METHODOLOGIES.md)
- [🤖 日常的なサブエージェント利用ガイド](./docs/subagents/DAILY_SUBAGENT_USAGE.md)

---

## 📚 ドキュメント構成

**このファイル**: 日常的な開発作業用のクイックリファレンス  
**詳細情報**: [📁 docs フォルダ](./docs/) に整理済み

| 目的 | ドキュメント |
|------|-------------|
| **📋 編集システム仕様書** | [🎯 docs/POSITIONING_SYSTEM_SPECIFICATIONS.md](./docs/POSITIONING_SYSTEM_SPECIFICATIONS.md) |
| **📊 実装進捗管理** | [📈 docs/POSITIONING_SYSTEM_PROGRESS.md](./docs/POSITIONING_SYSTEM_PROGRESS.md) |
| **🎯 Spine初期セットアップガイド** | [🚀 docs/SPINE_SETUP_GUIDE.md](./docs/SPINE_SETUP_GUIDE.md) |
| **📋 実装チェックリスト** | [✅ docs/IMPLEMENTATION_CHECKLIST.md](./docs/IMPLEMENTATION_CHECKLIST.md) |
| **技術仕様・実装詳細** | [📖 docs/DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md) |
| **レイヤー問題診断** | [🔧 docs/LAYER_DEBUGGING.md](./docs/LAYER_DEBUGGING.md) |
| **Spine問題解決** | [⚙️ docs/SPINE_TROUBLESHOOTING.md](./docs/SPINE_TROUBLESHOOTING.md) |
| **Canvasサイズ変更問題** | [🎯 docs/CANVAS_SIZE_TROUBLESHOOTING.md](./docs/CANVAS_SIZE_TROUBLESHOOTING.md) |
| **設計思想・アーキテクチャ** | [🏛️ docs/ARCHITECTURE_NOTES.md](./docs/ARCHITECTURE_NOTES.md) |
| **🤖 ClaudeCode自動化アルゴリズム** | [🤖 docs/CLAUDECODE_AUTOMATION_ALGORITHM.md](./docs/CLAUDECODE_AUTOMATION_ALGORITHM.md) |
| **🤖 サブエージェント利用ガイド** | [🤖 docs/SUBAGENT_GUIDE.md](./docs/SUBAGENT_GUIDE.md) |
| **📝 記録マスターエージェント** | [📝 docs/subagents/記録マスター.md](./docs/subagents/記録マスター.md) |
| **🚀 高速修正エージェント設計書** | [🚀 docs/subagents/高速修正エージェント.md](./docs/subagents/高速修正エージェント.md) |
| **🔧 慎重編集エージェント設計書** | [🔧 docs/subagents/慎重編集エージェント.md](./docs/subagents/慎重編集エージェント.md) |
| **🤖 エージェント統合運用ガイド** | [🤖 docs/subagents/エージェント統合運用ガイド.md](./docs/subagents/エージェント統合運用ガイド.md) |
| **🎯 Spine座標制御理想構成** | [🎯 docs/SPINE_BEST_PRACTICES.md](./docs/SPINE_BEST_PRACTICES.md) |

### 🎯 システム設計原則
- **座標レイヤー管理**: [📋 docs/ARCHITECTURE_NOTES.md](./docs/ARCHITECTURE_NOTES.md#座標レイヤー管理アーキテクチャ) - 2レイヤー + モジュール化による座標競合防止

---

## 🏢 プロジェクト概要・業務背景

### 💼 業務の全体像（商用制作ツール）
**Spineアニメーション制作→HTMLサイト納品までの完全ワークフロー**

1. **🎨 お客様依頼** → Spineアニメーション作成依頼を受注
2. **⚙️ Spine制作** → 専門ツールでアニメーションキャラクター制作  
3. **🎯 配置システム調整** → **制作チーム内専用ツール**で最適な位置・スケール決定
4. **📤 CSS出力・抽出** → 配置データを軽量なCSSファイル形式で抽出
5. **✅ 納品** → お客様サイトに適用するCSSファイルとして提供

### 🔑 重要なビジネス判断基準

#### 🚨 最重要原則
- **🔒 配置システムはお客様に渡さない** - 制作チーム専用の内部ツール
- **⚡ お客様サイトの軽量性確保** - 重いツールではなく軽量CSSのみ提供
- **🎯 制作効率の最大化** - 内部ツールとして使いやすさ・作業速度を最優先
- **💎 納品品質の保証** - 単なる位置調整ではなく、商用レベルの精度・安定性

#### 📊 開発優先度の判断基準
1. **制作効率化** - 作業時間短縮・操作性向上（最高優先度）
2. **品質向上** - 精密な位置調整・安定した動作（高優先度）  
3. **保守性** - トラブル対応・システム理解性（中優先度）
4. **拡張性** - 将来機能・汎用性（低優先度・要望次第）

### 🚀 今後の開発方針指針

#### ✅ 積極推進すべき機能
- **CSS出力機能** - 顧客要望確認後、高優先度で実装
- **制作効率化ツール** - 複数キャラクター一括調整、テンプレート機能等
- **品質保証機能** - プレビュー精度向上、エラー検出強化

#### ⚠️ 慎重検討すべき機能  
- **UI複雑化** - 制作効率を損なう可能性がある高機能化
- **パフォーマンス劣化** - 内部ツールとしての快適性を損なう重い処理
- **汎用化過多** - 特定用途に最適化された専用ツールとしての価値低下

### 🎯 サイト概要
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

#### 🚨 重要：汎用性設計思想
**編集システムは複数Spineシーン対応のため、固定値に依存しない設計が必須**

- **❌ 禁止**: 特定の数値（35%, 75%, 25%等）をハードコーディング
- **✅ 必須**: `getComputedStyle()`による動的CSS値取得
- **目的**: spine-sample-simple.html、index.html、その他任意のSpineシーンで共通利用
- **実装**: 実行時にCSS定義から位置・サイズを自動検出する仕組み

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

### 編集システム開発・デバッグ（v2.0完全実装版）
```bash
# 本番サイトの編集モード起動
python server.py

# 🆕 v2.0軽量システム（推奨）
# → http://localhost:8000/index.html?edit=true&version=v2

# 🔄 従来システム（互換性確保）
# → http://localhost:8000/index.html?edit=true

# 編集システムデモページを起動（開発・テスト用）
# → http://localhost:8000/spine-positioning-system-explanation.html

# v2.0システム状態確認（ブラウザF12コンソール）
if (window.spinePositioningV2) {
    console.log('v2.0システム動作中');
    console.log('選択中キャラクター:', window.spinePositioningV2.selectedCharacter);
}

# 従来システム状態確認
if (window.spinePositioningSystem) {
    console.log('従来システム動作中'); 
}

# localStorage状態確認・クリア
localStorage.getItem('spine-positioning-state')
localStorage.removeItem('spine-positioning-state')

# システム選択ガイド
# v2.0版: 軽量・高速・シンプル操作
# 従来版: 詳細設定・高機能・複雑UI
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

**問題が発生した場合 → [📋 トラブルシューティング総合ガイド](./docs/_TROUBLESHOOTING.md)**

### 🤖 問題解決時の自動記録

#### 📌 自動記録トリガー（🚨 最重要ルール）
**絶対ルール**: ユーザーからの実際の評価を受信してから記録すること

**<ultrathink>ユーザー評価パターンの慎重判定</ultrathink>**

**✅ 成功パターン**（解決済みとして記録）:
- 「できました」「なりました」「解決しました」  
- 「うまくいきました」「動きました」「直りました」
- 「正しく表示される」「期待通り」「OK」「良い」

**❌ 失敗パターン**（失敗事例として記録）:
- 「できません」「だめです」「うまくいきません」
- 「変わりません」「同じです」「効果なし」
- 「まだずれてる」「直ってない」「NG」

**⚠️ 部分成功パターン**（部分解決として記録）:
- 「一部」「ほぼ」「だいたい」「少し良くなった」
- 「改善したが」「マシになったが」

#### 📝 記録実行フロー（必須チェックリスト）
- [ ] 1. 問題報告を受ける
- [ ] 1.5. **問題分類判断（必須）**:
  - [ ] <think>既存ファイルの内容を確認（aliasesセクションをチェック）</think>
  - [ ] <think hard>問題の性質を分類：
    - **位置・レイアウト**: Canvas/要素の配置がずれる
    - **表示**: キャラクター・要素が見えない
    - **機能・UI**: ボタン・ハンドル・操作が効かない
    - **Spine技術**: WebGL・アニメーション・読み込み
    - **システム**: サーバー・ファイル・環境</think hard>
  - [ ] <think>類似問題がないか`docs/_TROUBLESHOOTING.md`で確認</think>
  - [ ] <think hard>**新規問題の場合のみ新ファイル作成**</think hard>
- [ ] 2. 調査・修正を実施
- [ ] 3. **修正完了をユーザーに報告**
- [ ] 4. <ultrathink>ユーザーからの実際の評価を待つ（推測禁止）</ultrathink>
- [ ] 5. <ultrathink>評価受信後 → 適切なステータスで記録</ultrathink>
- [ ] 6. 記録完了を報告

**🚨 禁止事項**:
- 修正実装直後の「解決済み」記録
- ユーザー確認なしの状態更新
- 推測による成功/失敗判定

#### 💡 実践例
**成功例**:
```
ユーザー: 編集モードで枠がずれます
Claude: [調査・修正実施]
ユーザー: 正しい位置に表示されるようになりました
Claude: ✅ 問題解決を確認しました。トラブルシューティング記録を作成中...
[自動的に「編集モード位置ずれ問題.md」を作成/更新]
Claude: 📝 記録完了: docs/troubleshooting/編集モード位置ずれ問題.md
```

**失敗例**:
```
ユーザー: キャラクターが表示されません
Claude: [修正試行]
ユーザー: まだ表示されません
Claude: ❌ 修正が効果なかったことを確認。失敗事例として記録中...
[自動的に失敗Caseを追加]
Claude: 📝 失敗事例を記録しました。別の解決策を試します...
```

**曖昧な場合**:
```
ユーザー: 微妙です
Claude: 具体的な状況を確認させてください：
- 問題は完全に解決しましたか？
- 部分的に改善しましたか？
- それとも変化はありませんか？
ユーザー: 少し良くなったけど、完全じゃない
Claude: ⚠️ 部分的な改善を確認。部分解決として記録します...
```

#### 🔄 既存問題の解決手順（🚨 必須プロセス）
**問題解決時は以下を自動実行**（新しいセッションでも必ず参照）：

##### Step 1: 強制トラブルシューティング参照
- [ ] <think>`docs/_TROUBLESHOOTING.md`から関連ファイルを特定（必須）</think>
- [ ] 該当ファイルを開く（飛ばし禁止）
- [ ] <think>`<!-- 🔒 確定済み解決策 - 変更禁止 -->`マーク確認</think>

##### Step 2: 解決策の実行
- [ ] <think>「⚡ 有効な解決策・回避策」セクションを探す</think>
- [ ] <think>セクション存在しない場合: まず「⚠️ 現在調査中」として作成</think>
- [ ] <think hard>セクション存在する場合: **解決策1から順番に実行**</think hard>
- [ ] 診断結果をユーザーに確認

##### Step 3: 記録（最重要）
- [ ] **🚨 絶対禁止**: 推測や独自修正は禁止
- [ ] 修正実装完了をユーザーに報告
- [ ] <ultrathink>ユーザーからの実際の評価を待つ</ultrathink>
- [ ] <ultrathink>評価受信後、適切なステータスでCase記録</ultrathink>

**🚨 絶対ルール**: 
- Step 1を飛ばして直接修正することは禁止
- ユーザー評価なしに「解決済み」記録は禁止
- 新しいセッションでも必ずこの手順を参照すること

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

### 9. 🎯 レスポンシブで位置がズレる（PC版のみ）
**→ [レスポンシブ版位置ズレ問題](./docs/troubleshooting/レスポンシブ版位置ズレ問題.md) を参照**

**即効解決策**：デスクトップ版CSSに`width: 30%`を追加（モバイル版と同じ値）
```css
#purattokun-canvas {
    width: 30%;  /* これを追加 */
}
```

### 10. 🎯 PC版で大きなウィンドウ時に位置ズレ（v2.0編集システム）
**→ [ウィンドウリサイズ問題](./docs/troubleshooting/ウィンドウリサイズ問題.md) を参照**

**即効解決策**：完璧な位置のGitコミットにリセット
```bash
git reset --hard e24f2eb
```

**症状の特徴**：
- モバイル版は完璧、PC版で大きなウィンドウ時のみ位置ズレ
- 小さなウィンドウでは完璧、ウィンドウが大きくなると徐々にズレる

**重要な教訓**：
- CSSでwidth未指定 → JavaScriptの値が適用されて位置ズレ
- モバイル版が正常 = その設定（width: 30%）をコピーすれば解決
- 位置計算は要素サイズに依存する
- **座標計算でwindow.innerWidth/innerHeightを使用してはいけない**
- **親要素基準の座標計算が必須**
- **Git履歴分析による根本原因特定が有効**

**📚 歴史的実装記録**: [実装方法論アーカイブ](./docs/archive/IMPLEMENTATION_METHODOLOGIES.md)参照
- 段階的実装戦略（2024年7月24日）
- Spineアニメーション改良システム
- 効果的なデバッグ手法：シンプルサンプル方式

---

## 🔗 問題発生時の参照先

### 📋 問題別対応表

| 具体的な問題 | 参照ドキュメント | セクション |
|-------------|----------------|-----------|
| **🚨 ぷらっとくんが表示されない** | [👁️ docs/CHARACTER_DISPLAY_TROUBLESHOOTING.md](./docs/CHARACTER_DISPLAY_TROUBLESHOOTING.md) | 緊急診断 → 問題パターン別解決 |
| **🔄 白い枠と同じ動きをする** | [🔧 docs/LAYER_DEBUGGING.md](./docs/LAYER_DEBUGGING.md) | 緊急診断ツール |
| **📐 ウィンドウリサイズで位置ズレ** | [🔧 docs/LAYER_DEBUGGING.md](./docs/LAYER_DEBUGGING.md) | 診断ツール |
| **🎯 Canvasサイズ変更できない** | [🎯 docs/CANVAS_SIZE_TROUBLESHOOTING.md](./docs/CANVAS_SIZE_TROUBLESHOOTING.md) | 全セクション |
| **⚙️ Spine関連エラー全般** | [⚙️ docs/SPINE_TROUBLESHOOTING.md](./docs/SPINE_TROUBLESHOOTING.md) | 症状に応じたセクション |

### 📋 ドキュメント参照整合性確保

**重要**: 参照先変更時は必ず `docs/README.md` の対応表と整合性を確認してください。
- [📁 docs/README.md 問題別対応表](./docs/README.md#📁-問題別対応表) が**マスタ参照表**です
- CLAUDE.mdの参照はこれと必ず一致させる必要があります
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