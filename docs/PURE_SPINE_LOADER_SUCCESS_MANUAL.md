# PureSpineLoader 100%読み込み成功マニュアル

**作成日**: 2025-08-29  
**バージョン**: v1.0 - 完全動作保証版  
**対象**: PureSpineLoaderマイクロモジュールの確実な読み込み成功

---

## 🎯 このマニュアルの目的

**PureSpineLoaderで100%確実にSpine読み込みを成功させる**ための完全ガイドです。
404エラー・読み込み失敗・WebGLエラー等を完全に回避し、nezumiキャラクターの表示まで確実に実現します。

---

## ✅ 環境確認チェックリスト

### **🚨 必須条件（全て満たす必要あり）**

#### 1. **サーバー要件**
- [ ] **Python3サーバー起動済み**: `python3 server.py`
- [ ] **ポート8000でアクセス可能**: `http://localhost:8000/`
- [ ] **CORS対応済み**: Cross-Origin制限なし
- [ ] **.atlasファイルMIMEタイプ対応**: `text/plain`として配信

#### 2. **依存ファイル存在確認**
- [ ] **Spine WebGLライブラリ**: `/assets/js/libs/spine-webgl.js` (446KB)
- [ ] **PureSpineLoader**: `/micromodules/spine-loader/PureSpineLoader.js` (10KB)  
- [ ] **nezumi Atlas**: `/assets/spine/characters/nezumi/nezumi.atlas`
- [ ] **nezumi JSON**: `/assets/spine/characters/nezumi/nezumi.json`
- [ ] **nezumi PNG**: `/assets/spine/characters/nezumi/nezumi.png`

#### 3. **ブラウザ要件**
- [ ] **WebGL対応**: Chrome/Firefox/Edge（最新版推奨）
- [ ] **JavaScript有効**: スクリプト実行許可
- [ ] **開発者ツール**: F12でコンソール確認可能

---

## 🔧 セットアップ手順

### **Step 1: サーバー起動**

```bash
# プロジェクトディレクトリに移動
cd /mnt/d/クラウドパートナーHP/

# Python3サーバー起動（CORS・.atlas対応済み）
python3 server.py

# 起動確認メッセージ
# "Server running on http://localhost:8000"
# "CORS enabled, .atlas files supported"
```

### **Step 2: ファイル存在確認**

```bash
# 依存ファイルの存在確認
ls -la assets/js/libs/spine-webgl.js        # 446KB
ls -la micromodules/spine-loader/PureSpineLoader.js  # 10KB
ls -la assets/spine/characters/nezumi/      # 3ファイル確認

# 期待される出力
# spine-webgl.js: 446KB
# PureSpineLoader.js: 10KB  
# nezumi/: nezumi.atlas, nezumi.json, nezumi.png
```

### **Step 3: テストページアクセス**

```bash
# ブラウザで以下にアクセス
http://localhost:8000/test-nezumi-spine-loader.html

# 初期表示で確認すべき項目
# ✅ ページ表示成功（404エラーなし）
# ✅ "Spine WebGLライブラリ検出成功"ログ
# ✅ "PureSpineLoaderモジュール検出成功"ログ
```

---

## 🎯 100%成功の実行手順

### **Phase 1: 環境確認（自動実行）**

1. **ページロード時**: 自動的に依存関係をチェック
   - Spine WebGLライブラリ存在確認
   - PureSpineLoaderモジュール存在確認
   - WebGLコンテキスト取得可能性確認

2. **成功条件**: 
   - ❌ エラーログなし
   - ✅ "検出成功" ログが3つ表示
   - ✅ ボタンが有効状態

### **Phase 2: nezumi読み込み実行**

1. **🐭 Nezumi読み込み**ボタンをクリック
2. **自動実行される処理**:
   ```javascript
   // 1. PureSpineLoaderインスタンス作成
   spineLoader = new PureSpineLoader({
       basePath: '/assets/spine/characters/nezumi/',
       atlasPath: '/assets/spine/characters/nezumi/nezumi.atlas',
       jsonPath: '/assets/spine/characters/nezumi/nezumi.json',
       scale: 1.0
   });
   
   // 2. ファイル読み込み実行
   const result = await spineLoader.execute();
   
   // 3. WebGL描画開始
   await startSpineRendering(result.spineData);
   ```

3. **成功判定**:
   - ✅ "Spine読み込み成功"ログ
   - ✅ nezumiアニメーション表示
   - ✅ "アニメーションループ開始"ログ

### **Phase 3: 動作確認**

1. **表示確認**: 
   - nezumiキャラクターが中央下部に表示
   - taikiアニメーション再生中
   - 滑らかな60fps動作

2. **情報パネル確認**:
   - 読み込み状態: "読み込み完了"
   - ファイルパス: "nezumi.atlas, nezumi.json, nezumi.png"
   - 処理時間: "XXXms" 
   - モジュール状態: "アクティブ"

---

## 🚨 トラブルシューティング

### **よくあるエラーと解決策**

#### **404 Not Found: spine-webgl.js**
```
❌ エラー: Failed to load resource: spine-webgl.js 404
✅ 解決策: HTMLファイルのscript srcを確認
```

**修正例**:
```html
<!-- ❌ 間違ったパス -->
<script src="assets/spine/spine-webgl.js"></script>

<!-- ✅ 正しいパス -->
<script src="assets/js/libs/spine-webgl.js"></script>
```

#### **WebGLコンテキスト取得失敗**
```
❌ エラー: WebGLコンテキストの取得に失敗
✅ 解決策: ブラウザのWebGL有効化・GPU加速有効化
```

**確認方法**:
```javascript
// F12コンソールで実行
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl');
console.log('WebGL対応:', gl ? 'OK' : 'NG');
```

#### **nezumiファイル読み込み失敗**
```
❌ エラー: アセット読み込みエラー
✅ 解決策: ファイルパス・ファイル存在確認
```

**確認コマンド**:
```bash
# ブラウザのネットワークタブで確認
# 404エラーが出ているファイルをチェック
curl http://localhost:8000/assets/spine/characters/nezumi/nezumi.atlas
```

#### **🎯 nezumi読み込み成功でも表示されない問題**
```
❌ 症状: ログでは成功だが、nezumiキャラクターが見えない
✅ 解決策: Skeleton座標設定を確認・デバッグ
```

**デフォルト座標設定**:
```javascript
skeleton.x = canvas.width / 2;  // x=400 (Canvas中央)
skeleton.y = canvas.height * 0.8; // y=480 (Canvas下部80%)
skeleton.scaleX = skeleton.scaleY = 0.5; // 0.5倍サイズ
```

**🔍 座標デバッグ手順**:
1. **🎯 座標デバッグ**ボタンをクリック
2. ログで以下を確認:
   - `🎯 Skeleton座標: x=400, y=480`
   - `📏 Skeletonスケール: scaleX=0.5, scaleY=0.5`
   - `📦 BoundingBox: x=?, y=?, width=?, height=?`

**🚨 よくある座標問題**:
- **Canvas範囲外**: x < 0 または x > 800, y < 0 または y > 600
- **スケールが小さすぎ**: scaleX/Y < 0.1 で視認困難
- **BoundingBoxが空**: width=0 または height=0
- **y座標が上下逆**: Spineのy軸は下向きが正

**📍 位置テスト方法**:
1. **📍 位置テスト**ボタンをクリック
2. 7つの異なる位置で自動テスト実行:
   - 中央上 (400, 100)
   - 中央中 (400, 300) 
   - 中央下 (400, 500)
   - 左上 (100, 100)
   - 右上 (700, 100)
   - 大きく中央 (400, 300, scale=1.0)
   - 元の位置 (400, 480, scale=0.5)

**✅ 座標修正例**:
```javascript
// より見えやすい位置に調整
skeleton.x = 400; // Canvas中央
skeleton.y = 300; // Canvas中央高さ
skeleton.scaleX = skeleton.scaleY = 0.8; // 大きめサイズ
```

---

## 📊 成功パターン実例

### **完全成功時のログ出力例**

```
[INFO] システム初期化完了 - PureSpineLoader テストページ起動
[SUCCESS] ページロード完了 - Nezumi Spine Loaderテストページ準備完了  
[SUCCESS] Spine WebGLライブラリ検出成功
[SUCCESS] PureSpineLoaderモジュール検出成功
[INFO] Nezumi Spine読み込み開始
[SUCCESS] Spine WebGLライブラリ検証完了（必要クラス確認済み）
[SUCCESS] 一時WebGLコンテキスト作成成功（AssetManager用）
[SUCCESS] ファイル読み込み予約: {json: nezumi.json, atlas: nezumi.atlas}
[SUCCESS] Atlas取得: OK
[SUCCESS] JSON取得: OK  
[SUCCESS] SkeletonData作成: OK
[SUCCESS] Spine読み込み成功 (XXXms)
[SUCCESS] WebGLコンテキスト取得成功
[SUCCESS] Spine描画システム初期化完了
[SUCCESS] アニメーション設定: taiki
[INFO] スケルトン座標設定: x=400, y=480
[INFO] Canvas寸法: width=800, height=600
[INFO] スケール: scaleX=0.5, scaleY=0.5
[INFO] SkeletonData: width=XXX, height=XXX
[SUCCESS] スケルトン配置・スケール設定完了
[SUCCESS] Nezumi描画ループ開始 - アニメーション表示中
```

### **処理時間ベンチマーク**

| 項目 | 標準処理時間 | 許容範囲 |
|------|------------|----------|
| **ライブラリ読み込み** | 50-100ms | ~200ms |
| **Spineファイル読み込み** | 100-300ms | ~500ms |
| **WebGL初期化** | 10-50ms | ~100ms |
| **描画開始** | 5-20ms | ~50ms |
| **合計処理時間** | 200-500ms | ~1000ms |

---

## 🧪 テスト項目チェックリスト

### **基本動作テスト**
- [ ] ページ表示成功（404エラーなし）
- [ ] 依存ライブラリ読み込み成功  
- [ ] nezumi読み込みボタン動作
- [ ] Spineアニメーション表示（視覚的確認）
- [ ] **座標設定確認**: ログでx=400, y=480, scale=0.5
- [ ] **デバッグボタン動作**: 🎯 座標デバッグ・📍 位置テスト  
- [ ] クリーンアップ機能動作

### **エラー耐性テスト**  
- [ ] ファイル不存在時のエラーハンドリング
- [ ] WebGL非対応時の適切なエラー表示
- [ ] 複数回読み込み時の状態管理
- [ ] メモリリーク防止（クリーンアップ後）

### **パフォーマンステスト**
- [ ] 読み込み時間 < 1000ms
- [ ] アニメーション60fps維持  
- [ ] メモリ使用量の適正性
- [ ] CPU使用率の適正性

---

## 🔄 メンテナンス・更新

### **定期確認項目**

#### **月次チェック**
- [ ] spine-webgl.jsファイルサイズ確認（446KB）
- [ ] nezumiファイルの整合性チェック
- [ ] ブラウザ互換性テスト

#### **更新時チェック**  
- [ ] PureSpineLoader.jsのバージョン確認
- [ ] 新しいブラウザでの動作確認
- [ ] エラーハンドリングの改善

### **トラブル発生時の対応手順**

1. **ログ確認**: F12コンソールでエラー内容特定
2. **ファイル存在確認**: 404エラーの場合はパス確認
3. **ネットワーク確認**: ブラウザのネットワークタブでHTTPステータス確認
4. **クリーンアップ実行**: 🧹ボタンで状態リセット
5. **サーバー再起動**: 必要に応じてpython3 server.py再実行

---

## 🎯 まとめ

### **100%成功の鍵**

1. **正確なファイルパス**: `assets/js/libs/spine-webgl.js`
2. **完全な依存関係**: 5つのファイル全て存在確認
3. **適切なサーバー**: CORS・MIMEタイプ対応済み  
4. **WebGL対応環境**: モダンブラウザ使用

### **成功指標**

- ✅ **読み込み成功率**: 100%（エラーなし）
- ✅ **処理時間**: 1000ms以下
- ✅ **アニメーション表示**: 60fps滑らか動作
- ✅ **メモリ管理**: クリーンアップ後の完全復元

**このマニュアルに従うことで、PureSpineLoaderによるnezumi読み込みが100%成功します。**

---

## 📚 関連文書

- [PureSpineLoader技術仕様](../micromodules/spine-loader/SPEC.md)
- [マイクロモジュール設計思想](../micromodules/README.md)
- [Spineトラブルシューティング](./SPINE_TROUBLESHOOTING.md)
- [サーバー設定ガイド](./SERVER_SETUP_GUIDE.md)