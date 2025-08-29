# Spine統合システム アーカイブ

**アーカイブ日**: 2025-08-28  
**理由**: PureSpineLoader v4.0正式版への統一・混乱防止

## 📋 アーカイブされたシステム

### ✅ 現在の推奨アプローチ
**PureSpineLoader v4.0** + **個別描画モジュール**: `micromodules/spine-loader/PureSpineLoader.js`
- **推奨**: マイクロモジュール設計・責務分離・外部依存ゼロ
- **利点**: テスタビリティ・保守性・再利用性

---

## 🗄️ アーカイブ内容

### A. SpineCharacterManager 統合管理版
**場所**: `spine-character-manager/`
- **旧役割**: CDN待機・キャラクター管理・アニメーション制御統合
- **アーカイブ理由**: 
  - 多機能すぎる（CDN + 管理 + 制御）
  - 外部依存（グローバル変数・DOM操作）
  - テストが困難
- **代替**: PureSpineLoader v4.0 + 必要な機能を個別モジュール化

### B. Spine Integration Systems
**場所**: `integration-systems/`

#### spine-integration-v1-backup.js
- **旧役割**: 初期統合システム・v1バックアップ版
- **特徴**: モノリシック設計・基本機能統合

#### spine-integration-v2.js / spine-integration-v2-unused.js  
- **旧役割**: v2統合システム・改良版
- **特徴**: 機能拡張・複雑化が進んだ版

#### spine-integration.js（存在した場合）
- **旧役割**: 最新統合システム
- **特徴**: 各種機能の統合・高機能化

---

## 🔄 移行ガイド

### 旧システムから新設計への移行

#### Before (SpineCharacterManager)
```javascript
const manager = new SpineCharacterManager();
await manager.init();
const character = await manager.loadCharacter('nezumi', {
    basePath: '/assets/spine/characters/nezumi/'
});
manager.playAnimation(character, 'taiki');
```

#### After (マイクロモジュール設計)
```javascript
// 1. 読み込み専用モジュール
const loader = new PureSpineLoader({
    basePath: '/assets/spine/characters/nezumi/',
    atlasPath: 'nezumi.atlas',
    jsonPath: 'nezumi.json'
});
const spineData = await loader.loadSpineAssets();

// 2. 描画モジュール（別途実装）
const renderer = new SpineRenderer(spineData);
renderer.playAnimation('taiki');

// 3. 管理モジュール（必要に応じて）
const characterManager = new CharacterManager();
characterManager.addCharacter('nezumi', renderer);
```

### 設計思想の変化
1. **責務分離**: 読み込み・描画・管理・制御を個別モジュール化
2. **外部依存排除**: DOM・グローバル変数への依存なし
3. **テスタビリティ**: 各モジュール独立テスト可能
4. **組み合わせ自由**: 必要な機能のみ選択利用

---

## ⚠️ 重要な技術的変更点

### CDN待機処理の分離
**旧方式**: SpineCharacterManager内で統合処理
```javascript
// CDN読み込み待機 + キャラクター管理が混在
while (typeof spine === 'undefined') { await delay(100); }
```

**新方式**: CDN待機は別モジュールまたは外部で処理
```javascript
// 純粋な読み込み処理のみ
const loader = new PureSpineLoader(config);
// CDN確認は呼び出し側の責任
```

### エラーハンドリングの改善
**旧方式**: 統合システム内で複雑なエラー処理
**新方式**: 各モジュールが明確なエラー情報を返却

---

## 📚 学習・参考価値

### アーカイブファイルから学べること
1. **spine-character-manager.js**: 
   - 統合システムの設計パターン
   - CDN読み込み待機の実装例
   - Map-based管理システム

2. **spine-integration-v*.js**:
   - 統合システムの進化過程
   - 機能追加による複雑化の経緯
   - リファクタリングの必要性

### 設計上の教訓
- ❌ **Over-Engineering**: 多機能統合は保守性を損なう
- ❌ **外部依存**: グローバル変数・DOM依存は柔軟性を阻害
- ✅ **Single Responsibility**: 単一責任原則の重要性
- ✅ **Composition over Inheritance**: 組み合わせによる柔軟性

---

## 🔍 使用していた場合の移行手順

### 1. 現在の使用箇所特定
```bash
# アーカイブしたファイルの参照を検索
grep -r "SpineCharacterManager\|spine-integration" --include="*.js" --include="*.html" .
```

### 2. 段階的移行
1. **Phase 1**: PureSpineLoader v4.0を並行導入
2. **Phase 2**: 旧システム参照を段階的に新システムに置換
3. **Phase 3**: 旧システム参照を完全削除

### 3. 機能補完
アーカイブされたシステムの機能で必要なものは、個別マイクロモジュールとして再実装

---

**移行支援・技術相談**: 開発チームまでお問い合わせください