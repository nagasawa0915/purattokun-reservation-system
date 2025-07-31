# 📋 CSS出力機能 使用ガイド

## 🎯 概要

Spine編集システムv2.0のCSS出力機能は、制作チーム専用の商用品質CSS生成ツールです。ドラッグ&ドロップで調整したキャラクター配置を、お客様のサイトに適用可能なCSSとして出力できます。

## 🚀 基本的な使用方法

### 1. **編集モードの開始**
```
1. ページを開く（http://localhost:8000/index.html?edit=true）
2. 右上の「位置編集」ボタンをクリック
3. 編集UI（キャラクター選択・スケール調整・プレビュー）が表示される
```

### 2. **キャラクター配置の調整**
```
・ドラッグ移動: キャラクターを直接ドラッグ
・スケール調整: 右側スケールパネルで倍率変更
・レイヤー順序: キャラクター選択パネルで並び替え
・リアルタイムプレビュー: 座標・サイズ・z-indexを即座表示
```

### 3. **CSS出力の実行**
```
1. 配置調整完了後、「📋 CSS出力」ボタンをクリック
2. CSS出力ダイアログが表示される
3. 出力形式を選択（個別セレクター/汎用クラス/圧縮/コメント付き）
4. 「🔄 生成」ボタンでCSSを生成
5. プレビュー確認後、「📋 クリップボードにコピー」または「💾 ファイルダウンロード」
```

## 🎨 出力形式の種類

### 1. **個別セレクター（推奨）**
各キャラクターに専用のCSSセレクターを生成。最も直感的で保守しやすい形式。

```css
/* キャラA - キャラクター1 */
#character-1 {
    position: absolute;
    left: 25.5%;
    top: 60.2%;
    transform: translate(-50%, -50%) scale(0.8);
    z-index: 1001;
}

/* キャラB - キャラクター2 */
#character-2 {
    position: absolute;
    left: 75.3%;
    top: 40.1%;
    transform: translate(-50%, -50%) scale(1.2);
    z-index: 1002;
}
```

### 2. **汎用クラス**
再利用可能なクラス構造。複数プロジェクトで共通化したい場合に最適。

```css
/* Spineキャラクター共通ベース */
.spine-character {
    position: absolute;
    transform: translate(-50%, -50%);
}

/* キャラA */
.spine-character-1 {
    left: 25.5%;
    top: 60.2%;
    transform: translate(-50%, -50%) scale(0.8);
    z-index: 1001;
}
```

### 3. **圧縮（本番用）**
最小化された本番用CSS。ファイルサイズを重視する場合。

```css
#character-1{position:absolute;left:25.5%;top:60.2%;transform:translate(-50%,-50%) scale(0.8);z-index:1001}#character-2{position:absolute;left:75.3%;top:40.1%;transform:translate(-50%,-50%) scale(1.2);z-index:1002}
```

### 4. **コメント付き（開発用）**
詳細なコメントと設定値説明付き。開発・保守・引き継ぎに最適。

```css
/*
===========================================
   Spine キャラクター配置CSS - 詳細版
===========================================

【システム情報】
- 生成時刻: 2025-01-31 14:30:25
- キャラクター数: 3
- アクティブキャラクター: 1
- 現在のスケール: 1.0

【使用方法】
1. このCSSをプロジェクトに追加
2. HTML要素のIDが正しく設定されていることを確認
3. 必要に応じて値を調整
===========================================
*/

/*
-------------------------------------------
  キャラA - キャラクター 1
-------------------------------------------
  セレクター: #character-1
  位置: (25.5%, 60.2%)
  スケール: 0.80
  レイヤー: 1001
  最終更新: 2025-01-31 14:30:25
-------------------------------------------
*/
#character-1 {
    /* 基本配置 */
    position: absolute;
    left: 25.5%;        /* 水平位置: 25.5% */
    top: 60.2%;         /* 垂直位置: 60.2% */
    
    /* 中央基準変換 + スケーリング */
    transform: translate(-50%, -50%) scale(0.80);
    
    /* レイヤー順序 */
    z-index: 1001;   /* 表示優先度 */
    
    /* 元サイズ情報: 120 × 120 px */
    /* 実際の表示位置: (382, 301) px */
}
```

## ⚙️ 技術仕様

### **精度設定**
- **位置精度**: 小数点1桁（0.1%精度）
- **スケール精度**: 小数点3桁（0.001精度）
- **z-index**: 整数値

### **ブラウザ互換性**
- 主要モダンブラウザ対応（Chrome, Firefox, Safari, Edge）
- CSS Grid/Flexbox使用
- transform, position: absolute使用

### **座標系**
- **基準点**: 中央基準（transform: translate(-50%, -50%)）
- **単位系**: パーセント（%）推奨、px対応
- **親要素**: position: relative必須

## 🛠️ 導入・統合方法

### **新規プロジェクトへの導入**

1. **モジュールファイルを追加**
```html
<!-- 基本システム（v2.0） -->
<script src="spine-positioning-system.js"></script>
<script src="spine-state-manager.js"></script>
<script src="spine-character-manager.js"></script>
<script src="spine-ui-panels.js"></script>
<script src="spine-drag-system.js"></script>

<!-- CSS出力機能 -->
<script src="spine-css-export.js"></script>
```

2. **HTMLマークアップ準備**
```html
<div class="spine-container" style="position: relative;">
    <div id="purattokun-canvas" class="spine-character"></div>
    <div id="character-2" class="spine-character"></div>
    <!-- 追加キャラクターは適宜 -->
</div>
```

3. **編集モード起動**
```
URLに ?edit=true を追加
例: http://localhost:8000/index.html?edit=true
```

### **既存プロジェクトへの統合**

1. **spine-css-export.js を追加**
2. **既存のUIパネル統合済みの場合は自動で「📋 CSS出力」ボタンが表示**
3. **手動統合の場合**:
```javascript
// CSS出力ボタンを手動で追加
const cssButton = document.createElement('button');
cssButton.textContent = '📋 CSS出力';
cssButton.onclick = () => window.showCSSExportDialog();
document.body.appendChild(cssButton);
```

## 📊 品質保証

### **CSS構文検証**
- 括弧の対応チェック
- セミコロン漏れチェック
- プロパティ値の妥当性確認

### **商用利用での信頼性**
- **小数点処理**: 適切な精度で四捨五入
- **ブラウザ互換**: 主要ブラウザでテスト済み
- **エラーハンドリング**: 異常時の適切な処理
- **メタデータ**: 生成情報・トレーサビリティ確保

## 🔧 トラブルシューティング

### **よくある問題と解決策**

#### 1. **「CSS出力」ボタンが表示されない**
```
原因: CSS出力モジュール未読み込み
解決: <script src="spine-css-export.js"></script> を確認
```

#### 2. **キャラクターが検出されない**
```
原因: キャラクター管理モジュール未読み込み、またはHTML構造の問題
解決: 
- spine-character-manager.js の読み込み確認
- HTML要素にID属性が正しく設定されているか確認
```

#### 3. **生成されたCSSが空**
```
原因: キャラクターデータの収集失敗
解決:
- ブラウザF12コンソールで window.collectCharacterData() を実行
- エラーメッセージを確認
```

#### 4. **位置がずれる**
```
原因: 親要素のposition設定漏れ
解決: 親要素に position: relative を設定
```

### **デバッグ方法**

#### **コンソールコマンド**
```javascript
// システム全体の診断
debugSystemInfo();

// CSS出力機能の診断
debugCSSExport();

// キャラクターデータの確認
console.log(window.characters);

// CSS生成テスト（個別セレクター）
const css = generateCSS('individual');
console.log(css);
```

#### **テストページ利用**
```
css-export-test.html を開いて自動テスト実行
http://localhost:8000/css-export-test.html
```

## 💡 応用例・ベストプラクティス

### **複数ページでの共通CSS利用**
```css
/* 全ページ共通 */
.spine-character-base {
    position: absolute;
    transform: translate(-50%, -50%);
}

/* ページ別調整 */
.page-top .spine-character-1 { left: 20%; top: 30%; }
.page-about .spine-character-1 { left: 80%; top: 60%; }
```

### **レスポンシブ対応**
```css
/* デスクトップ */
#purattokun-canvas {
    left: 25%;
    top: 50%;
    transform: translate(-50%, -50%) scale(1.0);
}

/* モバイル */
@media (max-width: 768px) {
    #purattokun-canvas {
        left: 50%;
        top: 20%;
        transform: translate(-50%, -50%) scale(0.7);
    }
}
```

### **アニメーション連携**
```css
#purattokun-canvas {
    position: absolute;
    left: 25%;
    top: 50%;
    transform: translate(-50%, -50%) scale(1.0);
    
    /* CSS出力後に追加 */
    transition: all 0.3s ease;
    animation: float 3s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { transform: translate(-50%, -50%) scale(1.0) translateY(0); }
    50% { transform: translate(-50%, -50%) scale(1.0) translateY(-10px); }
}
```

## 🎯 制作フロー推奨手順

### **標準的な制作フロー**
```
1. 【企画】キャラクター配置の大まかなイメージ決定
2. 【編集】Spine編集システムで詳細配置を調整
3. 【確認】リアルタイムプレビューで位置・サイズを確認
4. 【出力】CSS出力機能で商用品質CSSを生成
5. 【適用】お客様のサイトにCSSを適用
6. 【検証】各ブラウザ・デバイスで表示確認
7. 【納品】完成したCSSファイルを納品
```

### **品質チェックリスト**
```
□ 各キャラクターが意図した位置に配置されている
□ レスポンシブ表示で崩れがない
□ z-indexによる重なり順序が正しい
□ CSS構文にエラーがない
□ ファイルサイズが適切（圧縮版の選択）
□ コメントが十分（保守性の確保）
```

## 📈 パフォーマンス・最適化

### **CSS最適化Tips**
- **圧縮版使用**: 本番環境では圧縮版を推奨
- **不要プロパティ削除**: 使用しないキャラクターのCSSは削除
- **値の丸め**: 不要な小数点以下は手動で丸める

### **読み込み最適化**
- **遅延読み込み**: 編集機能は edit=true 時のみ読み込み
- **CDN配信**: CSS出力結果はCDN経由で配信推奨

---

**🎯 制作チーム専用ツールとして、効率的で高品質なCSS出力をサポートします。**

お客様への納品時には、生成されたCSSファイルのみ提供すれば完了です。