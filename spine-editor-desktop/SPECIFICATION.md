# 🎯 Spine Editor Desktop - 完全仕様書

**Professional Spine Animation Positioning Tool - Desktop Application**

**Version**: 1.0.0 (Phase 1 MVP Complete)  
**Created**: 2025-08-11  
**Author**: Cloud Partner  
**Target**: 商用制作ワークフロー最適化

---

## 📋 概要

### 🎯 プロジェクトの目的
既存Web版Spine編集システムの制約を解決し、**完全に独立したデスクトップ制作ツール**として再構築。制作チーム専用ツールと顧客納品物の完全分離により、プロフェッショナルな制作ワークフローを実現。

### 💡 コンセプト
**"Import → Display → Edit → Save → Export"**
- **85%既存コード再利用**による高い安定性
- **制作効率最大化**のためのデスクトップ最適化
- **完全パッケージ出力**による顧客満足度向上

---

## 🏗️ システム構成

### 📦 技術スタック
```
🖥️ Desktop Framework
├── Electron v31.0.0          # メインフレームワーク
├── Node.js v18+              # ランタイム
└── IPC通信                   # セキュアプロセス間通信

🎨 Frontend
├── HTML5 + CSS Grid          # 4パネルレイアウト
├── Vanilla JavaScript        # 軽量・高速動作
└── Photoshop風ダークテーマ   # プロ仕様UI

🎭 Spine Integration
├── spine-edit-core.js (85%再利用)
├── VFS + Blob URL システム   # CORS制限回避
└── spine-package-export統合  # 完全パッケージ生成

💾 Data Management
├── placements.json v4.0      # 位置データ
├── timeline.json v1.0        # タイムライン（Phase 3）
└── .sep プロジェクトファイル  # 統合プロジェクト
```

### 🗂️ プロジェクト構造
```
spine-editor-desktop/
├── 📋 package.json                    # Electron設定
├── 📖 SPECIFICATION.md               # この仕様書
├── 📖 DEVELOPMENT.md                 # 開発・テストガイド
└── src/
    ├── main/
    │   └── main.js (1,040+ lines)    # メインプロセス
    └── renderer/
        ├── index.html (255 lines)    # 4パネルUI
        ├── preload.js                # セキュアAPI
        ├── css/main.css              # Photoshop風テーマ
        └── js/
            ├── app.js (882 lines)           # メインロジック
            ├── spine-integration.js (457)    # Spine統合
            └── package-export.js (491)      # エクスポート
```

---

## 🎯 機能仕様

### 🚀 Phase 1 (完成済み)

#### **📁 1. インポート機能**
- **ホームページフォルダ選択**: 顧客サイトのルートディレクトリ
- **Spineキャラクターフォルダ選択**: characters/フォルダ構造対応
- **自動Spine検出**: .json/.atlas/.png セット自動認識
- **VFS統合**: Blob URLによるCORS制限完全回避

```javascript
// 検出される構造例
characters/
├── purattokun/
│   ├── purattokun.json   # Spineデータ
│   ├── purattokun.atlas  # テクスチャ情報
│   └── purattokun.png    # 画像ファイル
└── nezumi/
    ├── nezumi.json
    ├── nezumi.atlas
    └── nezumi.png
```

#### **🎭 2. 表示機能**
- **4パネルUI**: アウトライナー・プレビュー・プロパティ・レイヤー・タイムライン
- **キャラクター一覧**: 自動検出されたSpineキャラクター表示
- **アニメーション一覧**: Spine JSONから自動抽出
- **基本プレビュー**: プレースホルダー表示（Phase 2で実装）

#### **✏️ 3. 編集機能**
- **直接選択**: キャラクタークリックで選択
- **基本ドラッグ移動**: マウス・タッチ対応
- **プロパティパネル**: 
  - 位置（X/Y座標）
  - スケール
  - 回転
  - 不透明度
  - アニメーション選択
- **リアルタイム更新**: プロパティ変更の即座反映

#### **💾 4. 保存機能**
- **プロジェクトファイル**: .sep形式（JSON）
- **placements.json v4.0**: 位置データ標準化
- **メタデータ管理**: 作成日時・更新日時・バージョン管理
- **増分保存**: Ctrl+S 高速保存

```json
// プロジェクトファイル構造例
{
  "version": "4.0",
  "project": {
    "name": "Sample Project",
    "homePageFolder": "/path/to/homepage",
    "spineCharactersFolder": "/path/to/characters",
    "createdAt": "2025-08-11T00:00:00.000Z",
    "updatedAt": "2025-08-11T00:00:00.000Z"
  },
  "characters": {
    "purattokun": {
      "position": { "x": 18, "y": 49 },
      "scale": 0.55,
      "rotation": 0,
      "opacity": 1.0,
      "animation": "taiki",
      "visible": true,
      "locked": false,
      "folderPath": "/path/to/characters/purattokun",
      "animations": ["syutugen", "taiki", "yarare"]
    }
  },
  "timeline": {
    "version": "1.0",
    "duration": 10000,
    "tracks": []
  }
}
```

#### **📦 5. エクスポート機能**
- **完全パッケージ生成**: ZIP形式
- **HTML固定化**: 編集機能完全除去
- **依存ファイル自動収集**: Spine一式・CSS・JavaScript
- **CDN依存排除**: 完全ローカル動作保証
- **商用品質**: お客様納品準備完了

```
📦 出力パッケージ構造
spine-package-2025-08-11/
├── index.html              # クリーンなHTML
├── styles/main.css         # 位置データ埋め込みCSS
└── assets/
    ├── js/
    │   ├── spine-webgl.js  # Spine WebGLランタイム
    │   └── player.js       # 再生専用スクリプト
    └── spine/characters/
        ├── purattokun/     # Spine一式
        └── nezumi/
```

### 🎯 Phase 2 (予定3-4日)

#### **🎭 表示機能の完全化**
- **実際のSpineアニメーション表示**
- **リアルタイムプレビュー**
- **フレームレート表示**
- **ズーム・パン機能**

#### **✏️ 編集機能の強化**
- **本格的なドラッグ&ドロップ**
- **ハンドル操作**
- **複数選択・一括操作**
- **Undo/Redo機能**
- **精密グリッド・スナップ**

#### **📁 ファイル管理の改善**
- **プロジェクト読み込み**
- **最近使用ファイル**
- **本格的なファイルダイアログ**
- **ドラッグ&ドロップインポート**

### 🎬 Phase 3 (予定4-5日)

#### **タイムライン機能**
- **Maya Trax風UI**
- **キーフレーム編集**
- **クリップ管理**
- **再生制御**
- **timeline.json完全対応**

### 🏆 Phase 4 (予定3-4日)

#### **拡張・配布準備**
- **Golden Layoutドッキング**
- **プラグインシステム**
- **配布パッケージ・インストーラー**
- **パフォーマンス最適化**

---

## 🎮 操作方法

### ⌨️ キーボードショートカット
```
📁 ファイル操作
Ctrl+N         新規プロジェクト
Ctrl+O         プロジェクトを開く
Ctrl+S         保存
Ctrl+E         パッケージエクスポート

🎯 編集操作
Enter          編集モード開始
Escape         編集モード終了
Delete         選択要素削除
Space          再生/停止 (Phase 3)
F              フィット表示 (Phase 2)

🔧 システム操作
F12            開発者ツール切り替え
Ctrl+Shift+R   ハードリロード
```

### 🖱️ UI操作フロー
```
1. 起動 → 「🏠 ホームページ」ボタン → フォルダ選択
2. 「🎯 Spine」ボタン → キャラクターフォルダ選択
3. アウトライナーでキャラクター自動表示確認
4. キャラクタークリック → プレビューエリアに表示
5. ドラッグ移動 or プロパティパネルで調整
6. Ctrl+S でプロジェクト保存
7. 「📦 エクスポート」で完成パッケージ生成
```

---

## 💼 ビジネス価値

### 🎯 制作チーム向けメリット
1. **効率化**: 手動編集作業の完全排除
2. **品質保証**: 常にクリーンな納品物
3. **作業時間短縮**: 1クリックエクスポート
4. **エラー削減**: ファイル編集忘れゼロ
5. **プロフェッショナル**: 制作ツールと成果物の完全分離

### 👥 顧客向けメリット
1. **高品質**: 制作コード混入なしの完全パッケージ
2. **軽量**: 不要コードがないため高速表示
3. **安心**: セキュリティリスクなし
4. **独立性**: CDN依存なしの完全ローカル動作

### 📈 ROI (投資対効果)
- **開発期間**: 13-17日（4 Phase構成）
- **学習コスト**: 既存システム85%再利用により最小限
- **保守性**: モジュラー設計による高い拡張性
- **将来性**: Phase段階的拡張対応

---

## 🔧 技術的特徴

### 🚀 パフォーマンス
- **起動時間**: 3秒以内（目標）
- **メモリ使用量**: 200MB以内（基本動作）
- **ファイル処理**: キャラクター検出1秒以内（10体まで）
- **プロジェクト保存**: 2秒以内
- **パッケージエクスポート**: 10秒以内（標準プロジェクト）

### 🛡️ セキュリティ
- **コンテキスト分離**: renderer/mainプロセス完全分離
- **Node.js統合無効**: XSS攻撃対策
- **IPC通信**: セキュアなプロセス間通信のみ
- **ファイルアクセス制限**: 必要最小限のファイル操作

### 🔄 互換性
- **Windows**: Windows 10+ (x64)
- **macOS**: macOS 10.15+ (Intel/Apple Silicon)
- **Linux**: Ubuntu 18.04+ (x64) - 将来対応予定

---

## 🗂️ データ形式仕様

### 📋 プロジェクトファイル (.sep)
```json
{
  "meta": {
    "name": "string",           // プロジェクト名
    "version": "4.0",           // データ形式バージョン
    "created": "ISO8601",       // 作成日時
    "lastModified": "ISO8601"   // 最終更新日時
  },
  "project": {
    "homePageFolder": "string",        // ホームページフォルダパス
    "spineCharactersFolder": "string"  // Spineフォルダパス
  },
  "characters": {
    "キャラクターID": {
      "position": { "x": number, "y": number },  // vw/vh
      "scale": number,                           // 0.1-5.0
      "rotation": number,                        // -360 to 360
      "opacity": number,                         // 0.0-1.0
      "animation": "string",                     // アニメーション名
      "visible": boolean,
      "locked": boolean,
      "folderPath": "string",                    // キャラクターフォルダパス
      "animations": ["string"]                   // アニメーション一覧
    }
  },
  "timeline": {
    "version": "1.0",
    "duration": number,     // ミリ秒
    "tracks": []           // Phase 3で実装
  }
}
```

### 🎭 Spineファイル構造
```
characters/
└── [character-name]/
    ├── [character-name].json   # Spineスケルトンデータ
    ├── [character-name].atlas  # テクスチャアトラス
    └── [character-name].png    # テクスチャ画像
```

---

## 🔍 品質保証

### ✅ テスト項目
1. **起動・UI表示**: 4パネル正常表示
2. **インポート**: フォルダ選択・ファイル検出
3. **表示**: キャラクター一覧・プレビュー
4. **編集**: ドラッグ移動・プロパティ更新
5. **保存**: プロジェクトファイル書き込み
6. **エクスポート**: パッケージ生成・構造確認

### 🐛 既知の制限事項
**Phase 1時点**:
- Spineアニメーション: プレースホルダー表示のみ
- 同時編集: 1キャラクターのみ
- プロジェクト読み込み: 保存機能のみ実装
- タイムライン: UI表示のみ

### 🎯 品質基準
- **エラーなし**: 基本フロー完了
- **直感的操作**: 初回利用でも迷わない
- **適切なフィードバック**: 処理状況の明確表示
- **基本エラーハンドリング**: 予期しない状況への対応

---

## 🚀 開発・配布

### 📅 開発スケジュール
- **Phase 1**: ✅ 完成（2025-08-11）
- **Phase 2**: 3-4日予定
- **Phase 3**: 4-5日予定  
- **Phase 4**: 3-4日予定
- **総期間**: 13-17日

### 📦 配布形式
- **開発版**: `npm run dev` / `npm start`
- **Windows**: .exe (NSIS installer), Portable版
- **macOS**: .dmg, .app
- **自動更新**: Electron-updater統合予定

---

## 📞 サポート・トラブルシューティング

### 🔧 よくある問題
1. **起動しない**: Node.js v18+確認、`npm install`
2. **Spineファイル検出されない**: ファイル名・拡張子確認
3. **編集モードでキャラクター消失**: F12でエラー確認
4. **プロジェクト保存失敗**: ディスク容量・権限確認

### 📋 デバッグ情報
```javascript
// F12コンソールで実行可能
window.spineEditorApp.state                    // アプリ状態
window.spineEditorApp.spineIntegration          // Spine統合状態
[...window.spineEditorApp.state.characters.keys()]  // キャラクター一覧
```

---

## 📜 ライセンス・権利
- **ライセンス**: MIT License
- **開発**: Cloud Partner
- **利用**: 商用制作ツールとして利用可能
- **配布**: 制作チーム内での利用を想定

---

**🎯 Spine Editor Desktop - Version 1.0.0 Specification**  
**既存Web版の制約を完全に解決し、プロフェッショナルな制作ワークフローを実現するデスクトップ制作ツール**

**Phase 1 MVP完成 - 基本ワークフロー動作確認済み**  
**Phase 2以降で実用性・操作性を大幅向上予定**