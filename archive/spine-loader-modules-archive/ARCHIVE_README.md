# Spine読み込みモジュール アーカイブ

**アーカイブ日**: 2025-08-28  
**理由**: PureSpineLoader v4.0正式版への統一・混乱防止

## 📋 アーカイブされたモジュール

### ✅ 現在の正式版（継続サポート）
**PureSpineLoader v4.0**: `micromodules/spine-loader/PureSpineLoader.js`
- **推奨**: 新規開発・既存プロジェクト更新に使用
- **特徴**: 外部依存ゼロ・完全復元保証・数値のみ通信

---

## 🗄️ アーカイブ内容

### A. UniversalSpineLoader v3.0 ハイブリッド版
**場所**: `universal-spine-loader/`
- **旧役割**: 読み込み + 描画統合・Canvas生成・イベント処理
- **アーカイブ理由**: 複雑すぎる・責務が曖昧
- **代替**: PureSpineLoader v4.0 + 必要に応じて描画モジュール分離

### B. 実験版PureSpineLoader
**場所**: `experimental/`
- **旧役割**: 初期実験・プロトタイプ版
- **アーカイブ理由**: 正式版（spine-loader/）へ移行済み
- **代替**: PureSpineLoader v4.0正式版

### C. デスクトップアプリ統合版
**場所**: `desktop-versions/`
- **旧役割**: Electron環境でのSpine統合
- **アーカイブ理由**: プラットフォーム固有・一般的でない
- **代替**: PureSpineLoader v4.0 + Electron固有処理分離

---

## 🔄 移行ガイド

### 旧モジュールから PureSpineLoader v4.0 への移行

#### Before (UniversalSpineLoader)
```javascript
const loader = new UniversalSpineLoader({
    containerSelector: '#container',
    spineConfig: { basePath: '/path/', atlasFile: 'nezumi.atlas' }
});
```

#### After (PureSpineLoader v4.0)
```javascript
const loader = new PureSpineLoader({
    basePath: '/path/',
    atlasPath: 'nezumi.atlas',
    jsonPath: 'nezumi.json'
});
const result = await loader.loadSpineAssets();
```

### 主な変更点
1. **責務分離**: 読み込みのみに特化（DOM操作・描画は別モジュール）
2. **数値通信**: オブジェクト参照なし・他モジュールとの協調利用
3. **cleanup保証**: 完全な状態復元・メモリリーク防止
4. **async/await**: 非同期処理の現代的実装

---

## ⚠️ 重要な注意点

### アーカイブファイルの使用について
- ✅ **参考・学習目的**: アーカイブファイルの参照は自由
- ❌ **新規開発での使用禁止**: 混乱・技術負債の原因
- ⚠️ **既存プロジェクト**: PureSpineLoader v4.0への段階的移行を推奨

### サポート状況
- **PureSpineLoader v4.0**: 継続開発・バグ修正・機能追加対象
- **アーカイブモジュール**: サポート終了・修正対象外

---

## 📚 技術参考情報

### 設計思想の変遷
1. **初期版**: 多機能統合型（UniversalSpineLoader等）
2. **実験版**: マイクロモジュール設計試行錯誤
3. **現在**: 単一責任・外部依存ゼロの純粋モジュール

### 学習価値のあるアーカイブファイル
- `universal-spine-loader/UniversalSpineLoader.js`: ハイブリッド設計の参考例
- `experimental/PureSpineLoader.js`: 初期マイクロモジュール設計の変遷

---

**質問・サポート**: PureSpineLoader v4.0に関する技術的質問は開発チームまで