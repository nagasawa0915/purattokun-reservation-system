# Spine Positioning System 統合ガイド

## 📋 概要

Spine Positioning Systemは、既存のWebページにドラッグ&ドロップによるキャラクター配置機能を簡単に追加できるプラグインシステムです。

### 🎯 主な機能

- **🔍 自動検出**: 既存のSpine/画像要素を自動的に検出
- **🖱️ ドラッグ&ドロップ**: マウス・タッチでキャラクターを直接移動
- **🎛️ 精密調整**: スライダーUIで細かい位置・サイズ調整
- **📍 プリセット**: よく使う位置をワンクリックで適用
- **💾 位置保存**: ブラウザリロード後も位置を記憶
- **📱 レスポンシブ**: PC・タブレット・スマートフォン対応
- **🔧 簡単統合**: たった3行のコードで既存ページに追加

---

## 🚀 クイックスタート

### 1. 基本統合（3行で完了）

```html
<!-- 1. プラグインを読み込み -->
<script src="assets/spine/spine-positioning-plugin.js"></script>

<!-- 2. 初期化 -->
<script>
  SpinePositioning.init();
</script>

<!-- 3. 既存のキャラクター要素（自動検出される） -->
<img src="purattokun.png" alt="ぷらっとくん" id="my-character">
```

### 2. 高度な設定

```html
<script>
  SpinePositioning.init({
    enableUI: true,           // UI表示
    enableDragDrop: true,     // ドラッグ&ドロップ
    enablePresets: true,      // プリセット機能
    autoDetect: true,         // 自動検出
    savePosition: true        // 位置保存
  });
</script>
```

---

## 📁 ファイル構成

```
your-project/
├── assets/spine/
│   └── spine-positioning-plugin.js    # メインプラグイン
├── your-page.html                     # 既存ページ
└── docs/
    └── SPINE_POSITIONING_INTEGRATION_GUIDE.md  # このファイル
```

---

## 🎮 サンプルページ

### 実装例

| ファイル | 説明 | 用途 |
|---------|------|------|
| `spine-test-scene.html` | クリーンなテストシーン | システムなしのベースライン |
| `spine-sample-with-positioning.html` | システム統合版 | フル機能デモ |
| `spine-plugin-demo.html` | プラグイン統合デモ | 外部統合の実証 |

### 動作確認手順

1. **ベースライン確認**: `spine-test-scene.html`
   - Spineキャラクターが正常に表示される
   - クリックでアニメーション再生される

2. **システム統合版**: `spine-sample-with-positioning.html`
   - 右側にコントロールUIが表示される
   - ドラッグ&ドロップで移動できる
   - プリセットボタンが動作する

3. **プラグイン版**: `spine-plugin-demo.html`
   - 複数のデモシーンが表示される
   - 3つの異なる統合パターンを確認

---

## 🔧 詳細な統合方法

### 対応要素の自動検出

プラグインは以下の要素を自動的に検出します：

```html
<!-- 1. ID に "purattokun" を含む要素 -->
<canvas id="main-purattokun-canvas"></canvas>
<img id="hero-purattokun" src="character.png">

<!-- 2. data-spine-* 属性を持つ要素 -->
<canvas data-spine-character="purattokun"></canvas>
<img data-spine-fallback="purattokun" src="fallback.png">

<!-- 3. alt属性に "ぷらっとくん" を含む画像 -->
<img alt="ぷらっとくん" src="character.png">
```

### 手動でキャラクターを登録

```javascript
// プラグイン初期化後に手動登録
SpinePositioning.registerCharacter('my-character', element, 'image');
```

### プリセット位置のカスタマイズ

```javascript
// カスタムプリセットを追加
SpinePositioning.presets.custom1 = {
    x: 30, y: 70, scale: 0.8, name: 'カスタム位置'
};
```

---

## 🎨 UI カスタマイズ

### UI の表示/非表示

```javascript
// UI を非表示で初期化
SpinePositioning.init({ enableUI: false });

// 後からUI表示
SpinePositioning.createUI();

// UI の切り替え
SpinePositioning.toggleUI();
```

### カスタムスタイリング

```css
/* UI のカスタマイズ */
#spine-positioning-ui {
    /* 位置変更 */
    top: 50px;
    left: 20px;
    right: auto;
    
    /* 見た目変更 */
    background: rgba(0, 0, 0, 0.8);
    border-radius: 20px;
}

.sp-header {
    background: linear-gradient(135deg, #your-color1, #your-color2);
}
```

---

## 📱 レスポンシブ対応

### ブレークポイント別設定

```javascript
// モバイル用設定
if (window.innerWidth <= 768) {
    SpinePositioning.init({
        enableUI: false,        // モバイルではUIを非表示
        enableDragDrop: true,   // ドラッグは有効
        enablePresets: false    // プリセットは無効
    });
}
```

### タッチデバイス対応

プラグインは自動的にタッチイベントに対応します：
- `touchstart` → ドラッグ開始
- `touchmove` → ドラッグ中
- `touchend` → ドラッグ終了

---

## 💾 データ永続化

### 位置データの保存

```javascript
// 手動保存
SpinePositioning.savePosition();

// 保存データを確認
const data = localStorage.getItem('spine-positioning-data');
console.log(JSON.parse(data));
```

### カスタム保存キー

```javascript
SpinePositioning.init({
    storageKey: 'my-custom-positioning-data'
});
```

### データのエクスポート/インポート

```javascript
// データをエクスポート
const positions = SpinePositioning.exportPositions();

// データをインポート
SpinePositioning.importPositions(positions);
```

---

## 🔍 デバッグ & トラブルシューティング

### デバッグモード

```javascript
// デバッグ情報を有効化
SpinePositioning.init({ debug: true });

// キャラクター一覧を確認
console.log(SpinePositioning.characters);

// 現在の位置を確認
SpinePositioning.characters.forEach((char, id) => {
    console.log(`${id}:`, char.position);
});
```

### よくある問題

#### 1. キャラクターが検出されない

```javascript
// 手動で検出実行
SpinePositioning.detectSpineCharacters();

// 登録されたキャラクターを確認
console.log('検出数:', SpinePositioning.characters.size);
```

#### 2. ドラッグが効かない

```html
<!-- position:static の要素は動かせません -->
<img style="position: relative;"> <!-- ✅ OK -->
<img style="position: absolute;"> <!-- ✅ OK -->
<img style="position: static;">   <!-- ❌ NG -->
```

#### 3. 位置が保存されない

```javascript
// ローカルストレージの確認
console.log(localStorage.getItem('spine-positioning-data'));

// 手動保存テスト
SpinePositioning.savePosition();
```

---

## 🚀 パフォーマンス最適化

### 大量キャラクター対応

```javascript
// バッチ処理で位置更新
const updates = [
    { id: 'char1', x: 10, y: 20, scale: 1.0 },
    { id: 'char2', x: 30, y: 40, scale: 0.8 }
];

SpinePositioning.batchUpdatePositions(updates);
```

### レンダリング最適化

```javascript
// アニメーション中は位置更新を間引き
SpinePositioning.init({
    throttleUpdate: 16 // 16ms間隔（60fps）
});
```

---

## 🔄 API リファレンス

### 初期化

```javascript
SpinePositioning.init(options)
```

| オプション | 型 | デフォルト | 説明 |
|-----------|----|-----------|----|
| `enableUI` | boolean | `true` | UI表示 |
| `enableDragDrop` | boolean | `true` | ドラッグ&ドロップ |
| `enablePresets` | boolean | `true` | プリセット機能 |
| `autoDetect` | boolean | `true` | 自動検出 |
| `savePosition` | boolean | `true` | 位置保存 |
| `storageKey` | string | `'spine-positioning-data'` | ストレージキー |

### メソッド

```javascript
// キャラクター管理
SpinePositioning.registerCharacter(id, element, type)
SpinePositioning.selectCharacter(id)
SpinePositioning.getCurrentCharacter()

// 位置制御
SpinePositioning.updatePosition()
SpinePositioning.applyPreset(presetKey)
SpinePositioning.resetPosition()

// データ管理
SpinePositioning.savePosition()
SpinePositioning.restorePositions()
SpinePositioning.exportPositions()
SpinePositioning.importPositions(data)

// UI制御
SpinePositioning.createUI()
SpinePositioning.toggleUI()
SpinePositioning.updateUIFromCharacter(character)

// ユーティリティ
SpinePositioning.detectSpineCharacters()
SpinePositioning.destroy()
```

---

## 📈 今後の拡張可能性

### 予定されている機能

- **🎬 アニメーション連携**: 位置変更時のアニメーション
- **🎨 ビジュアルエディター**: GUIでの詳細設定
- **📊 解析機能**: ユーザーの配置パターン分析
- **🔗 外部API連携**: サーバーでの位置データ管理

### カスタム拡張例

```javascript
// カスタム機能の追加
class CustomSpinePositioning extends SpinePositioningPlugin {
    // カスタムプリセットを追加
    initCustomPresets() {
        this.presets.myCustom = { x: 25, y: 75, scale: 1.2 };
    }
    
    // カスタムイベントを追加
    onPositionChanged(character, oldPos, newPos) {
        console.log(`${character.id} moved from ${oldPos.x},${oldPos.y} to ${newPos.x},${newPos.y}`);
    }
}
```

---

## 🎯 ベストプラクティス

### 1. 段階的導入

```javascript
// Phase 1: 基本機能のみ
SpinePositioning.init({ enableUI: false });

// Phase 2: UI追加
SpinePositioning.createUI();

// Phase 3: 高度な機能
SpinePositioning.enableAdvancedFeatures();
```

### 2. ユーザビリティ重視

```javascript
// モバイルファーストな設定
const isMobile = window.innerWidth <= 768;

SpinePositioning.init({
    enableUI: !isMobile,           // モバイルではUIを簡素化
    enableDragDrop: true,          // ドラッグは常に有効
    enablePresets: !isMobile       // モバイルではプリセット無効
});
```

### 3. エラーハンドリング

```javascript
try {
    SpinePositioning.init();
} catch (error) {
    console.error('Spine Positioning 初期化失敗:', error);
    // フォールバック処理
    enableBasicPositioning();
}
```

---

## 🤝 サポート

### 問題報告

1. ブラウザコンソールのエラーメッセージを確認
2. `SpinePositioning.characters` の内容を確認
3. 最小再現コードを作成
4. 環境情報（ブラウザ、OS、デバイス）を記録

### よくある質問

**Q: Internet Explorer で動作しますか？**
A: ES6+ を使用しているため、IE11 以降が必要です。

**Q: 既存のSpineアニメーションに影響しますか？**
A: いいえ。プラグインは位置制御のみを行い、アニメーション再生には影響しません。

**Q: モバイルでの操作性は？**
A: タッチイベントに対応しており、スマートフォンでも快適に操作できます。

---

## 📚 関連ドキュメント

- [📖 DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - 技術仕様・実装詳細
- [🔧 LAYER_DEBUGGING.md](./LAYER_DEBUGGING.md) - レイヤー問題診断
- [⚙️ SPINE_TROUBLESHOOTING.md](./SPINE_TROUBLESHOOTING.md) - Spine問題解決
- [🏛️ ARCHITECTURE_NOTES.md](./ARCHITECTURE_NOTES.md) - 設計思想・アーキテクチャ

---

**🎮 Spine Positioning System で、あなたのWebサイトに次世代のインタラクティブ体験を！**