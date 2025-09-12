# 📦 Package Export System - マイクロモジュール版

## 🎯 概要

Spineアニメーション制作システムで編集された位置・設定を、お客様納品用の完全パッケージ（ZIP）として出力するマイクロモジュール化システムです。

## ✨ 主要機能

- **🎨 全キャラクター自動検出**: MultiCharacterManager・DOM解析による自動検出
- **📐 位置データ固定化**: localStorage・DOM状態からCSS埋め込み
- **🔧 HTML固定化処理**: 編集システム除去・Spine直接初期化
- **🎯 境界ボックス統合**: 精密クリック判定システム自動統合
- **🗜️ ZIP完全パッケージ**: 依存ファイル・CDN解決済み完全版

## 📂 モジュール構造

```
micromodules/package-export/
├── core/                    # 核機能モジュール
│   ├── PackageExporter.js  # メイン制御・オーケストレーション
│   ├── HTMLProcessor.js    # HTML固定化・編集システム除去
│   └── FileCollector.js    # ファイル収集・依存関係解決
├── generators/              # 生成・変換モジュール
│   ├── CharacterDetector.js # キャラクター検出・位置データ収集
│   ├── CSSGenerator.js     # 位置データ→CSS変換
│   └── ZIPGenerator.js     # ZIP作成・ダウンロード
├── config/                  # 設定管理モジュール
│   └── ExportConfig.js     # システム設定・CDN設定
├── index.js                # メインエントリポイント
└── README.md               # このファイル
```

## 🚀 使用方法

### 基本使用（推奨）

```javascript
// 既存システムと完全互換
await exportPackage();
```

### 詳細制御

```javascript
// マイクロモジュール版の直接利用
import PackageExportSystem from './micromodules/package-export/index.js';

// 基本使用
await PackageExportSystem.exportPackage();

// 設定カスタマイズ
PackageExportSystem.config.set('output.compression.level', 9); // 最高圧縮
await PackageExportSystem.exportPackage();

// 処理状況監視
const state = PackageExportSystem.getProcessState();
console.log('処理状況:', state);
```

### 個別モジュール利用

```javascript
// 特定機能のみ利用する場合
import { CharacterDetector } from './generators/CharacterDetector.js';
import { CSSGenerator } from './generators/CSSGenerator.js';

const detector = new CharacterDetector();
const characters = await detector.detectAllCharacters();
const positionData = await detector.collectAllPositionData(characters);

const cssGenerator = new CSSGenerator();
const css = cssGenerator.generateAllCharactersCSS(positionData);
```

## ⚙️ 設定カスタマイズ

### CDN設定変更

```javascript
const config = PackageExportSystem.getConfig();

// Spine WebGL バージョン変更
config.set('cdn.spineWebGL.version', '4.2.0');
config.set('cdn.spineWebGL.url', 'https://unpkg.com/@esotericsoftware/spine-webgl@4.2.0/dist/iife/spine-webgl.js');
```

### 出力設定変更

```javascript
// 圧縮レベル変更（0-9、デフォルト6）
config.set('output.compression.level', 9); // 最高圧縮

// ファイル名プレフィックス変更
config.set('output.filenamePrefix', 'my-spine-project');
```

### 静的ファイル追加

```javascript
// 追加画像ファイル
const imageFiles = config.get('staticFiles.imageFiles');
imageFiles.push('assets/images/custom-background.png');
config.set('staticFiles.imageFiles', imageFiles);
```

## 🔧 処理フロー

1. **キャラクター検出** (`CharacterDetector`)
   - MultiCharacterManager優先取得
   - DOM要素検索フォールバック
   - localStorage・DOM位置データ収集

2. **HTML固定化** (`HTMLProcessor`)
   - 編集システムコード精密除去
   - CDN→ローカル参照変更
   - 境界ボックスシステム統合
   - 位置データCSS埋め込み

3. **ファイル収集** (`FileCollector`)
   - キャラクター固有ファイル
   - 共通画像・統合システム
   - 境界ボックスファイル
   - CDN依存解決

4. **ZIP生成** (`ZIPGenerator`)
   - JSZip動的読み込み
   - ファイル統合・圧縮
   - ブラウザダウンロード実行

## 📊 出力パッケージ内容

### 含まれるファイル

- `index.html` - 固定化済みメインHTML
- `assets/js/libs/spine-webgl.js` - Spine WebGL（CDNローカル化）
- `assets/spine/spine-integration-v2.js` - Spine統合システム
- `assets/spine/spine-character-manager.js` - キャラクター管理
- `assets/spine/spine-skeleton-bounds.js` - 境界ボックス基盤
- `spine-bounds-integration.js` - 境界ボックス統合
- `assets/spine/characters/{CHARACTER}/` - 各キャラクターSpineファイル
- `assets/images/` - 背景・キャラクター画像

### 完全動作保証

- ✅ **Spineアニメーション**: 完全動作・自動再生
- ✅ **境界ボックス精密判定**: 34頂点クリック判定
- ✅ **位置固定化**: 編集結果の完全再現
- ✅ **レスポンシブ対応**: PC・モバイル両対応
- ✅ **商用品質**: エラーハンドリング・安定性保証

## 🛠️ デバッグ・トラブルシューティング

### ログ確認

```javascript
// システム情報確認
PackageExportSystem.logSystemInfo();

// 設定確認
const config = PackageExportSystem.getConfig();
config.logConfig();

// 処理状況確認
const state = PackageExportSystem.getProcessState();
console.log('処理状況:', state);
```

### よくある問題

1. **キャラクターが検出されない**
   ```javascript
   import { CharacterDetector } from './generators/CharacterDetector.js';
   const detector = new CharacterDetector();
   const characters = await detector.detectAllCharacters();
   console.log('検出キャラクター:', characters);
   ```

2. **ファイル収集失敗**
   ```javascript
   import { FileCollector } from './core/FileCollector.js';
   const collector = new FileCollector();
   collector.logCollectionStatus(); // 収集状況確認
   ```

3. **HTML処理失敗**
   ```javascript
   // 編集システムが正しく除去されているか確認
   const processor = new HTMLProcessor();
   // 処理前後のHTMLサイズ比較等
   ```

## 🔄 既存システムとの互換性

- ✅ **完全互換**: `exportPackage()` 関数は既存と同一
- ✅ **グローバル変数**: `window.PackageExportSystem` 利用可能
- ✅ **イベント**: `PackageExportSystemLoaded` イベント発火
- ✅ **設定保持**: 既存設定ファイルとの完全整合性

## 📈 マイクロモジュール化の効果

### 保守性向上
- 🔧 **機能別修正**: 問題箇所の特定・修正が容易
- 🧪 **単体テスト**: モジュール個別のテスト実行可能
- 📋 **責務明確化**: 各モジュール500行以内・責務分離

### 拡張性確保
- ➕ **機能追加**: 新モジュール追加が容易
- 🔄 **部分利用**: 必要機能のみの利用可能
- 🌐 **他プロジェクト**: モジュール単位での再利用可能

### 開発効率化
- 👥 **チーム開発**: 並行開発・コンフリクト削減
- 📚 **理解容易性**: 新規参加者のコード理解支援
- 🔍 **デバッグ効率**: 問題範囲の限定・特定容易化

## 📝 バージョン情報

- **Version**: 2.0.0-micromodule
- **基盤**: 既存 spine-package-export.js (943行) のマイクロモジュール化
- **互換性**: 既存システムとの完全後方互換性保持
- **品質**: 商用制作品質・全機能保持

---

**🎯 商用制作ツールとして、お客様納品用完全パッケージの確実な生成を保証します。**