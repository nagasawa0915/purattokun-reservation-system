# Spine Positioning System v2 - Phase 1

**作成日**: 2024年7月25日  
**状態**: Phase 1 完了（基盤構築）  
**対応**: レスポンシブ問題解決 + 基本ドラッグ機能

---

## 🎯 Phase 1 で実装された機能

### ✅ 完了機能

1. **レスポンシブ座標システム復活**
   - ビューポート基準座標（%）とピクセル座標の相互変換
   - ウィンドウリサイズ時の自動位置調整
   - HTML設定との互換性維持

2. **基本ドラッグ&ドロップ配置**
   - Canvas内でのリアルタイムドラッグ機能
   - 座標の自動取得・保存
   - HTML設定コードの自動生成

3. **既存システムとの統合**
   - 既存のSpine統合システムとの完全互換性
   - index.htmlでの自動認識・統合
   - 既存機能への影響なし

---

## 🛠️ ファイル構成

```
assets/spine/
├── spine-responsive-coordinate-system.js  # 座標変換システム
├── spine-drag-positioning-v2.js          # ドラッグ機能
├── spine-positioning-system.js           # 統合システム
└── README_POSITIONING_SYSTEM.md          # このファイル

/ (ルート)
├── test-positioning-system.html          # テストページ
└── index.html                           # メインページ（統合済み）
```

---

## 🚀 使用方法

### 1. 基本的な使用（既存サイト）

**index.html では自動的に統合されます。追加の設定は不要です。**

#### ポジショニングモード有効化
```javascript
// ブラウザコンソール（F12）で実行
togglePositioning()
```

#### ドラッグで位置調整
1. `togglePositioning()` でポジショニングモード有効化
2. ぷらっとくんをドラッグして位置調整
3. ドラッグ完了時に自動的にHTML設定コードが生成される

#### 生成されたコードをHTML設定に反映
```html
<!-- 自動生成されたコード例 -->
<div id="purattokun-config" style="display: none;"
     data-x="25.5"
     data-y="67.3"
     data-scale="1.0"
     data-fade-delay="1500"
     data-fade-duration="2000">
</div>
```

### 2. 新しいページでの使用

#### HTML準備
```html
<!DOCTYPE html>
<html>
<head>
    <script src="assets/spine/spine-responsive-coordinate-system.js"></script>
    <script src="assets/spine/spine-drag-positioning-v2.js"></script>
    <script src="assets/spine/spine-positioning-system.js"></script>
</head>
<body>
    <div class="hero-section">
        <canvas id="character-canvas"></canvas>
    </div>
    
    <div id="character-config" style="display: none;"
         data-x="50" data-y="50" data-scale="1.0">
    </div>
</body>
</html>
```

#### JavaScript初期化
```javascript
// システム初期化
const positioningSystem = new SpinePositioningSystem({
    debugMode: true,
    enableDrag: true,
    enableResize: true
});

await positioningSystem.initialize();

// キャラクター登録
positioningSystem.registerCharacter('myCharacter', {
    canvas: document.getElementById('character-canvas'),
    htmlConfig: 'character-config'
});

// ポジショニングモード有効化
positioningSystem.togglePositioningMode();
```

---

## 🔧 利用可能なコマンド

### グローバルコマンド（ブラウザコンソール）

```javascript
// ポジショニングモード切り替え
togglePositioning()

// 設定エクスポート
exportSpineSettings()

// キャラクター一覧表示
showSpineCharacters()

// システム状態表示
showSpineSystemStatus()

// デバッグ情報表示
debugCoordinateSystem()
debugDragSystem()
```

### プログラム内での使用

```javascript
// システムアクセス
const system = window.spinePositioningSystemInstance;
const coords = window.spineCoordinateSystem;
const drag = window.spineDragSystem;

// 座標変換
const pixelPos = coords.viewportToPixel(25, 75); // (25%, 75%) → (px, px)
const viewportPos = coords.pixelToViewport(300, 400); // (300px, 400px) → (%, %)

// キャラクター位置更新
coords.updateCharacterPosition('character1', 30, 60, 1.2);

// 設定エクスポート
const settings = system.exportSettings();
```

---

## 🧪 テスト方法

### 1. テストページでの動作確認

```bash
# サーバー起動
python server.py

# ブラウザで開く
http://localhost:8000/test-positioning-system.html
```

### 2. テスト手順

1. **システム初期化**: 「システム初期化」ボタンをクリック
2. **キャラクター登録**: 「キャラクター登録」ボタンをクリック
3. **ポジショニングモード**: 「ポジショニングモード切替」ボタンをクリック
4. **ドラッグテスト**: 白枠をドラッグして位置を変更
5. **設定確認**: 「設定エクスポート」で生成されたコードを確認

### 3. 本番サイトでのテスト

```bash
# index.html で確認
http://localhost:8000/

# ブラウザコンソール（F12）で実行
togglePositioning()

# ぷらっとくんをドラッグして位置調整
# コンソールに出力されたHTMLコードを確認
```

---

## 🐛 トラブルシューティング

### よくある問題

#### 1. ポジショニングモードが有効にならない
```javascript
// システム状態確認
showSpineSystemStatus()

// 再初期化
window.spinePositioningSystemInstance.initialize()
```

#### 2. ドラッグできない
```javascript
// ドラッグシステム状態確認
debugDragSystem()

// ポジショニングモードを確認
console.log('ポジショニングモード:', window.spinePositioningModeActive)
```

#### 3. 座標が正しく変換されない
```javascript
// 座標システム確認
debugCoordinateSystem()

// 手動での座標変換テスト
const coords = window.spineCoordinateSystem;
coords.viewportToPixel(50, 50); // 中央位置のテスト
```

#### 4. レスポンシブが機能しない
```javascript
// 手動リサイズ処理実行
window.spineCoordinateSystem.handleResize()

// キャラクター位置更新
window.spineCoordinateSystem.updateAllCharacterPositions()
```

---

## 📊 Phase 1 の成果

### 解決された問題
- ✅ ウィンドウリサイズ時の位置ズレ問題
- ✅ 手動座標調整の煩雑さ
- ✅ レスポンシブ対応の欠如

### 新しく利用可能になった機能
- ✅ ビジュアルドラッグ&ドロップ配置
- ✅ 自動HTML設定コード生成
- ✅ リアルタイム座標表示
- ✅ 既存システムとの完全互換性

### パフォーマンス向上
- ✅ デバウンス付きリサイズ処理
- ✅ 効率的な座標変換キャッシュ
- ✅ 最小限のDOM操作

---

## 🔮 今後の拡張予定（Phase 2+）

### Phase 2: Visual Editor（予定）
- GIMP風バウンディングボックス
- 8方向リサイズハンドル
- 背景画像認識システム

### Phase 3: Advanced UI（予定）
- ツールパレット
- プロパティパネル
- カスタムクリック範囲設定

### Phase 4: Production Ready（予定）
- 設定ファイルベース運用
- 汎用ライブラリ化
- プラグイン形式での提供

---

## 💡 開発者向けメモ

### システム設計のポイント
1. **段階的実装**: Phase 1 では基盤のみに集中
2. **後方互換性**: 既存機能への影響を最小限に
3. **テスト可能性**: 独立したテストページの提供
4. **デバッグ機能**: 充実したコンソールコマンド

### 拡張する際の注意点
1. **座標システム**: ResponsiveCoordinateSystem を基盤として使用
2. **イベント処理**: DragPositioningSystem のパターンを参考に
3. **グローバル変数**: window.spine* プレフィックスを使用
4. **エラーハンドリング**: 詳細なログ出力を心がける

---

**Phase 1 完了**: 基盤構築とレスポンシブ問題解決 ✅  
**次回**: Phase 2 Visual Editor の実装を検討