# Spine配置エディター v4.0 MVP仕様書

## 🎯 **目的・範囲**
**「Spineキャラクターの配置だけ」**を最短で完成。タイムライン・高度イベント・マルチウインドウは後フェーズ。

### 📦 **MVPに含む機能**
- [x] **プロジェクト管理**: HPフォルダ・Spineフォルダ選択、project.json保存/読込
- [x] **Spine表示**: 1体以上のキャラクター読み込み・WebGL描画
- [x] **基本配置**: x, y, scaleX, scaleY, rotation, zIndex編集
- [x] **直接操作**: プレビューエリアでドラッグ移動・バウンディングボックス編集
- [x] **数値入力**: プロパティパネルでの精密調整
- [x] **スナップ**: グリッド・中央吸着
- [x] **Undo/Redo**: 操作履歴管理（10段階）
- [x] **自動保存**: 3分間隔（設定可能）
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
| 1 | nezumi.json読み込み | WebGL描画成功・エラーなし |
| 2 | ドラッグで(100,100)移動 | 座標値リアルタイム更新・保存後も維持 |
| 3 | スケール1.5倍→0.8倍 | 視覚的サイズ変更・数値入力と同期 |
| 4 | 45度回転 | 正確な回転・バウンディングボックス追従 |
| 5 | グリッドスナップ(20px) | 20の倍数座標に吸着 |
| 6 | 中央スナップ | 中央±10pxで自動吸着 |
| 7 | Undo/Redo(5回) | 操作履歴正確に復元 |
| 8 | project.json保存/読込 | 全設定値完全復元 |
| 9 | エクスポート→ダブルクリック実行 | ブラウザで正常表示・Spine動作 |
| 10 | 座標往復変換テスト | 10箇所で±1px以内の精度 |

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

### **Week 1**: 基盤・表示・移動
- [ ] プロジェクト作成・フォルダ選択UI
- [ ] project.json読込・保存機能
- [ ] Spine WebGL表示システム
- [ ] ドラッグ&ドロップ移動
- [ ] リアルタイム座標表示

### **Week 2**: 変形・制御・履歴
- [ ] スケール・回転制御
- [ ] 数値入力パネル（プロパティ）
- [ ] グリッド・中央スナップ
- [ ] zIndex制御（レイヤー順序）
- [ ] Undo/Redo システム

### **Week 3**: 仕上げ・出力
- [ ] 自動保存機能
- [ ] エクスポートシステム
- [ ] エラーハンドリング・バリデーション
- [ ] UI磨き・UX改善

### **Week 4**: 拡張基盤・テスト
- [ ] クリックイベント基盤（metaフィールド活用）
- [ ] 回帰テスト実行・品質確認
- [ ] パフォーマンス最適化
- [ ] ドキュメント・リリース準備

## 🎯 **成功判定基準**
1. **機能完成度**: 上記DoD 10項目すべて✅
2. **品質基準**: 座標精度・エクスポート品質・エラー耐性すべて満足
3. **実用性**: 実際の制作ワークフローで3つのキャラクターを配置→エクスポートが15分以内で完了
4. **拡張準備**: Phase 4（タイムライン）追加時の改修箇所が全体の15%以下

---

**この仕様でMVP完成後、タイムライン・マルチウィンドウ等の高度機能を段階的に追加予定**