# 📦 パッケージ出力システム - 基本操作マニュアル

## 🎯 概要

Spineアニメーション制作システムで編集した位置・設定を、**お客様納品用の完全パッケージ（ZIP）** として出力するシステムです。

### 主な用途
- ✅ **商用制作**: お客様サイトへの組み込み用パッケージ作成
- ✅ **バックアップ**: 編集結果の永続保存
- ✅ **配布**: 完全動作する独立パッケージの生成

---

## 🚀 **基本的な使い方**

### Step 1: 編集モードで位置調整

```bash
# 編集システムを起動
http://localhost:8000/index.html?edit=true
```

1. **キャラクター選択**: クリックして編集対象を選択
2. **位置調整**: ドラッグまたは矢印キーで移動
3. **保存**: 位置が決まったら保存

### Step 2: パッケージ出力実行

**方法1: 編集画面のボタン**
- 編集画面の「📦 パッケージ出力」ボタンをクリック

**方法2: ブラウザコンソール**
```javascript
// F12を押してコンソールを開き、以下を実行
await exportPackage();
```

**方法3: カスタムボタン**
```html
<button onclick="exportPackage()">📦 パッケージ出力</button>
```

### Step 3: ダウンロード完了確認

- ZIPファイルが自動ダウンロードされます
- ファイル名例: `spine-project-package-2025-09-05_15-30-45.zip`

---

## 📦 **出力パッケージの内容**

### 含まれるファイル
```
spine-project-package-YYYY-MM-DD_HH-mm-ss.zip
├── index.html                          # 固定化済みメインHTML
├── assets/
│   ├── js/libs/
│   │   └── spine-webgl.js              # Spine WebGLライブラリ
│   ├── spine/
│   │   ├── spine-integration-v2.js     # Spine統合システム  
│   │   ├── spine-character-manager.js  # キャラクター管理
│   │   ├── spine-skeleton-bounds.js    # 境界ボックス基盤
│   │   └── characters/                 # 各キャラクターファイル
│   │       └── [CHARACTER_NAME]/
│   │           ├── [CHARACTER_NAME].json
│   │           ├── [CHARACTER_NAME].atlas  
│   │           └── [CHARACTER_NAME].png
│   └── images/
│       ├── クラウドパートナーTOP.png      # 背景画像
│       └── [CHARACTER_NAME].png         # キャラクター画像
└── spine-bounds-integration.js         # 境界ボックス統合
```

### パッケージの特徴
- ✅ **完全独立**: CDN依存なし・完全ローカル動作
- ✅ **編集機能除去**: 軽量化・お客様向け最適化
- ✅ **位置固定化**: 編集結果をCSS直接埋め込み
- ✅ **境界ボックス統合**: 精密クリック判定機能付き

---

## 🔧 **設定とカスタマイズ**

### 出力対象の変更

**キャラクターの追加・除外**:
システムが自動的に検出しますが、手動で制御する場合：

```javascript
// 特定キャラクターのみ出力
window.MultiCharacterManager = {
    characters: [
        { id: 'purattokun-canvas', name: 'purattokun' }
        // nezumiを除外したい場合はここに含めない
    ]
};
```

**追加ファイルの指定**:
```javascript
// 追加画像を出力に含める場合
const config = PackageExportSystem.getConfig();
const imageFiles = config.get('staticFiles.imageFiles');
imageFiles.push('assets/images/custom-background.png');
config.set('staticFiles.imageFiles', imageFiles);
```

### 圧縮設定の変更

```javascript
// 最高圧縮に変更（ファイルサイズ最小化）
PackageExportSystem.config.set('output.compression.level', 9);

// 高速処理優先（圧縮率低下）
PackageExportSystem.config.set('output.compression.level', 1);

// デフォルト（バランス重視）
PackageExportSystem.config.set('output.compression.level', 6);
```

---

## 🎯 **商用制作での使い方**

### 制作フロー
1. **📝 要件確認**: お客様からキャラクター配置要望
2. **🎨 Spine制作**: 専門ツールでアニメーション作成
3. **⚙️ 位置調整**: 編集システムで最適配置を決定
4. **📦 パッケージ出力**: 本システムで完全パッケージ生成
5. **✅ 納品**: お客様サイトに組み込み可能なZIPファイル提供

### 品質チェック項目
- [ ] **位置確認**: キャラクターが期待位置に表示される
- [ ] **アニメーション**: Spineアニメーションが正常再生
- [ ] **クリック判定**: 境界ボックスが正確に機能
- [ ] **レスポンシブ**: PC・モバイル両対応
- [ ] **表示速度**: 読み込み・表示が3秒以内

### 納品時の説明
**お客様への説明例**:
> 「こちらのZIPファイルを展開し、Webサーバー上に配置してください。index.htmlが完全に独立して動作し、CDN等の外部依存はありません。」

---

## 🐛 **よくある問題と解決策**

### 問題1: パッケージ出力ボタンが見つからない

**症状**: 編集画面にパッケージ出力ボタンがない
**解決策**: 
```javascript
// F12コンソールで実行
await exportPackage();
```

### 問題2: "exportPackage is not defined"

**症状**: コンソールでエラーが出る
**解決策**: 
```html
<!-- HTMLに以下を追加 -->
<script src="spine-package-export.js"></script>
```

### 問題3: ダウンロードされるZIPが空またはエラー

**症状**: ZIPファイルが正常に生成されない
**原因**: 
- HTTPサーバー未起動（file://プロトコル使用）
- 必要ファイルの不足

**解決策**:
```bash
# 必ずHTTPサーバーで起動
python server.py
# または
python -m http.server 8000
```

### 問題4: 一部キャラクターが含まれない

**症状**: 複数キャラクターのうち一部だけパッケージに含まれる
**解決策**: 
```javascript
// 対象キャラクターを手動指定
const detector = new CharacterDetector();
const characters = await detector.detectAllCharacters();
console.log('検出キャラクター:', characters);

// 不足キャラクターがある場合はMultiCharacterManagerを確認
console.log('MultiCharacterManager:', MultiCharacterManager.characters);
```

### 問題5: パッケージサイズが大きすぎる

**症状**: 生成されるZIPファイルが10MB以上
**解決策**: 
```javascript
// 圧縮レベル最大化
PackageExportSystem.config.set('output.compression.level', 9);

// 不要ファイル除外
const config = PackageExportSystem.getConfig();
// 大きな画像ファイルを除外するなど
```

---

## 🔍 **デバッグとトラブルシューティング**

### 基本確認事項
1. **F12コンソール**: エラーメッセージの確認
2. **ネットワークタブ**: ファイル読み込み状況の確認
3. **HTTPサーバー**: `file://` ではなく `http://localhost:8000` で実行

### 詳細ログの有効化
```javascript
// パッケージ出力システムのデバッグログ
PackageExportSystem.logSystemInfo();

// 個別モジュールのテスト
import { CharacterDetector } from './micromodules/package-export/generators/CharacterDetector.js';
const detector = new CharacterDetector();
detector.detectAllCharacters(); // ログでキャラクター検出状況確認
```

### 段階的テスト
```javascript
// Step 1: システム確認
console.log('exportPackage:', typeof exportPackage);

// Step 2: キャラクター検出テスト
console.log('MultiCharacterManager:', typeof MultiCharacterManager);

// Step 3: 位置データ確認  
console.log('localStorage:', localStorage.getItem('spine-positioning-state'));

// Step 4: パッケージ出力実行
await exportPackage();
```

---

## 📞 **サポート**

### 問題報告時に提供してほしい情報
1. **ブラウザ**: Chrome/Firefox等のバージョン
2. **OS**: Windows/Mac/Linux
3. **URL**: 実行時のURL（localhost:8000等）
4. **エラーメッセージ**: F12コンソールのエラー内容
5. **期待動作**: 何を実現したいか
6. **現在の動作**: 実際に何が起きているか

### 追加マニュアル
- **技術詳細**: `micromodules/package-export/README.md`
- **API仕様**: マイクロモジュール版詳細ガイド
- **AI実装者向け**: `PACKAGE_EXPORT_AI_IMPLEMENTATION_GUIDE.md`

---

**🎯 このシステムで、Spineアニメーション制作から商用納品まで完全対応できます！**