# Spine配置エディター v4.0 MVP仕様書

## 🎯 **目的・範囲**
**「Spineキャラクターの配置だけ」**を最短で完成。タイムライン・高度イベント・マルチウインドウは後フェーズ。

### 📦 **MVPに含む機能**
- [x] **プロジェクト管理**: HPフォルダ・Spineフォルダ選択、project.json保存/読込
- [x] **Spine表示**: 複数キャラクター読み込み・WebGL描画・Z順制御
- [x] **基本配置**: x, y, scaleX, scaleY, rotation, zIndex編集
- [x] **AfterEffects風操作**: バウンディングボックス8ハンドル・直感的ドラッグ移動
- [x] **アニメーション管理**: キャラクター別アニメーション選択・動的リスト更新
- [x] **2段階保存システム**: Quick Save (座標のみ・Ctrl+S) + Project Save (全体)
- [x] **レイヤー管理**: ドラッグ&ドロップによるZ順変更・↑前へ/↓後ろへボタン
- [x] **数値入力**: プロパティパネルでの精密調整・リアルタイム同期
- [x] **スナップ**: グリッド・中央吸着
- [x] **Undo/Redo**: 操作履歴管理（10段階）
- [x] **未保存管理**: 変更検知・ダーティフラグ・視覚的警告
- [x] **エクスポート**: /dist/にローカル実行可能なHTMLパッケージ出力

### 🚫 **MVPに含まない機能**
- ❌ タイムライン編集（Phase 4予定）
- ❌ 複雑なクリックイベント（基本の器のみ用意）
- ❌ マルチウインドウ（Phase 5予定）
- ❌ アニメーションブレンド・高度制御

## ✅ **Definition of Done**

### **品質基準**
1. **座標精度**: DOM↔Spine往復誤差 ≤ **±1px** （10箇所テストポイントで保証）
2. **エクスポート品質**: `dist/index.html`を**ダブルクリックで実行可能**（サーバー不要）
3. **パス管理**: すべて**プロジェクト相対パス**、絶対パス禁止
4. **エラー耐性**: Spineロード失敗時もアプリは落ちず**代替矩形**で継続表示
5. **DPR対応**: 高解像度ディスプレイでも正確な座標制御

### **動作テストケース**
| No | テストケース | 期待結果 |
|----|-------------|----------|
| 1 | nezumi + purattokun読み込み | 複数キャラ WebGL描画・Z順制御 |
| 2 | バウンディングボックスドラッグ移動 | 座標リアルタイム更新・8ハンドル表示 |
| 3 | スケール1.5倍→0.8倍 | 視覚的サイズ変更・ボックス追従 |
| 4 | 45度回転 | 正確な回転・バウンディングボックス回転追従 |
| 5 | アニメーション変更 (idle→walk) | 選択リスト更新・レイヤー表示同期 |
| 6 | Z順ドラッグ&ドロップ | レイヤー一覧でドラッグして前後関係変更 |
| 7 | Quick Save (Ctrl+S) | 座標のみ保存・ダーティフラグクリア |
| 8 | Project Save | 全設定値保存・アニメーション情報含む |
| 9 | レイヤー ↑前へ/↓後ろへボタン | Z値±1・レイヤー順序視覚的変更 |
| 10 | エクスポート→ダブルクリック実行 | 複数キャラ・アニメ・位置完全再現 |
| 11 | 未保存状態管理 | 変更時⚠️表示・保存後クリア |
| 12 | 座標往復変換テスト | 10箇所で±1px以内の精度 |

## 📊 **データスキーマ（project.json v1.0）**

```typescript
interface ProjectV1 {
  version: 1;
  project: { name: string; created: string; modified: string; };
  page: { file: string; canvas: { width: number; height: number; }; };
  folders: { homepage: string; spineAssets: string; };
  characters: Character[];
  editor: {
    grid: { enabled: boolean; size: number; visible: boolean; };
    preview: { backgroundColor: string; showBounds: boolean; };
    autoSaveInterval: number;
  };
}

interface Character {
  id: string;                    // "nezumi#1", "purattokun#1"
  spine: {
    name: string;                // "nezumi"
    skeleton: string;            // "nezumi/nezumi.json" (相対パス)
    atlas: string;               // "nezumi/nezumi.atlas"
  };
  transform: {                   // CSSピクセル単位
    x: number; y: number;        // DOM左上基準座標
    scaleX: number; scaleY: number;  // 1.0 = 100%
    rotation: number;            // 度数法（時計回り）
  };
  zIndex: number;                // レイヤー順序
  animation?: {                  // 基本アニメーション（任意）
    name: string; loop: boolean;
  };
  meta?: Record<string, unknown>; // 将来拡張用（クリックイベント等）
}
```

## 🔧 **技術設計ポイント**

### **座標系管理**
- **保存**: CSSピクセル（DOM左上基準）で統一
- **表示**: Spine WebGL（中央基準・Y軸反転）
- **変換**: `CoordinateUtils`純関数で往復変換
- **DPR**: `window.devicePixelRatio`自動考慮

### **アーキテクチャ境界（A'方式）**
- **WindowAdapter**: 統合UI→マルチウィンドウ段階移行対応
- **AppStore**: 状態管理の単一ソース（Zustand想定）
- **IPC固定チャンネル**:
  - `placement:update` - 座標更新通知
  - `project:save/load` - プロジェクト保存/読込
  - `export:run` - エクスポート実行

### **エクスポート仕様**
- **出力先**: `{project}/dist/`
- **構成**: index.html + spine-webgl.js + assets/ + placement.json
- **実行**: ダブルクリックでブラウザ起動→即座にSpine表示
- **パス**: 全て相対パス、CDN依存なし

## 📅 **実装ロードマップ（4週間）**

### **Week 1**: 基盤・表示・バウンディングボックス移動
- [ ] プロジェクト作成・フォルダ選択UI
- [ ] project.json読込・2段階保存機能
- [ ] 複数Spine WebGL表示・Z順システム
- [ ] AfterEffects風バウンディングボックス・8ハンドルドラッグ
- [ ] アニメーション選択・動的リスト更新

### **Week 2**: レイヤー管理・プロパティ同期
- [ ] スケール・回転制御・リアルタイム同期
- [ ] 数値入力パネル（プロパティ）・バウンディングボックス連動
- [ ] レイヤードラッグ&ドロップ・↑前へ/↓後ろへボタン
- [ ] グリッド・中央スナップ
- [ ] 未保存管理・ダーティフラグ・Ctrl+S

### **Week 3**: 仕上げ・出力・品質向上
- [ ] Undo/Redo システム（バウンディングボックス対応）
- [ ] エクスポートシステム（複数キャラ・アニメーション対応）
- [ ] エラーハンドリング・バリデーション
- [ ] UI磨き・UX改善・操作感最適化

### **Week 4**: 拡張基盤・テスト・完成
- [ ] クリックイベント基盤（metaフィールド活用）
- [ ] 回帰テスト実行（12ケーステストスイート）
- [ ] パフォーマンス最適化・メモリ管理
- [ ] ドキュメント・リリース準備

## 🎯 **成功判定基準**
1. **機能完成度**: 上記DoD 10項目すべて✅
2. **品質基準**: 座標精度・エクスポート品質・エラー耐性すべて満足
3. **実用性**: 実際の制作ワークフローで3つのキャラクターを配置→エクスポートが15分以内で完了
4. **拡張準備**: Phase 4（タイムライン）追加時の改修箇所が全体の15%以下

---

**この仕様でMVP完成後、タイムライン・マルチウィンドウ等の高度機能を段階的に追加予定**