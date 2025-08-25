# 🚀 3ペイン実装クイックリファレンス

**即座参照用 - 実装時のエッセンシャルガイド**  
**詳細設計**: [📐 3ペイン責務分離設計書](./3-pane-responsibility-separation-design.md)

---

## ⚡ 3ペイン責務の一行サマリー

| ペイン | 責務 | やることA・やらないことX |
|--------|------|----------------------|
| **OutlinerPane** | プロジェクトファイルの階層管理 | A: ファイル選択・フォルダ操作 / X: Spine表示・設定変更 |  
| **PreviewPane** | Spineの表示・リアルタイム編集 | A: ドラッグ・BB表示・WebGL / X: ファイル管理・数値入力 |
| **PropertiesPane** | 数値・設定の詳細編集 | A: 精密入力・メタデータ・履歴 / X: Spine表示・ファイル選択 |

---

## 📡 イベント通信パターン

### 🎯 **全ての通信はApplicationCore経由**
```typescript
// ❌ 禁止: 直接参照
this.previewPane.loadSpine(file);

// ✅ 正解: イベントベース通信
this.applicationCore.handleEvent({
    type: 'file-selected',
    source: 'outliner', 
    data: {filePath: file.path}
});
```

### 🔄 **標準通信フロー**
```
ペインA → ApplicationCore → ペインB
   ↑         (状態管理)         ↓
 イベント送信    中央制御      イベント受信
```

---

## 🗂️ ファイル構造テンプレート

```
src/
├── core/
│   ├── ApplicationCore.ts       # 🎯 中央制御（必須）
│   ├── DataManager.ts          # 💾 データアクセス（必須）
│   └── EventBus.ts             # 📡 イベント管理（必須）
├── panes/
│   ├── OutlinerPane.ts         # 📁 ファイル管理
│   ├── PreviewPane.ts          # 🎮 Spine表示・編集  
│   └── PropertiesPane.ts       # ⚙️ 設定・数値入力
└── shared/
    ├── types/                  # TypeScript型定義
    └── utils/                  # 共通ユーティリティ
```

---

## 🔧 実装の必須パターン

### 1️⃣ **ペインコントローラー基底クラス**
```typescript
abstract class BasePaneController {
    protected abstract paneId: string;
    protected applicationCore: ApplicationCore;
    
    // 必須ライフサイクル
    abstract initialize(): Promise<void>;
    abstract destroy(): void;
    abstract handleEvent(event: SpineEditorEvent): Promise<void>;
}
```

### 2️⃣ **イベント定義**
```typescript
interface SpineEditorEvent {
    type: string;                    // イベント種別
    source: 'outliner' | 'preview' | 'properties';  
    timestamp: number;               // 発生時刻
    data: any;                      // ペイロードデータ
}
```

### 3️⃣ **状態管理**
```typescript
// ApplicationCore内で統合管理
applicationState = {
    project: { /* プロジェクト状態 */ },
    spine: { /* Spine状態 */ },
    ui: { /* UI状態 */ }
}
```

---

## 🎯 実装優先度

### Phase 1: 基盤構築
- [ ] ApplicationCore（中央制御）
- [ ] EventBus（イベントシステム）  
- [ ] BasePaneController（基底クラス）

### Phase 2: ペイン実装
- [ ] OutlinerPane（ファイル管理）
- [ ] PreviewPane（Spine表示）
- [ ] PropertiesPane（設定編集）

### Phase 3: 統合・最適化
- [ ] ペイン間通信テスト
- [ ] データ永続化
- [ ] エラーハンドリング

---

## ⚠️ 実装時の注意事項

### ❌ **やってはいけないこと**
- ペイン間の直接参照・メソッド呼び出し
- 複数ペインでの重複状態管理
- ApplicationCoreを介さないデータ保存

### ✅ **必ず守ること**  
- 全ての通信はイベントベース
- 状態はApplicationCoreで一元管理
- エラーは発生ペイン内で境界処理

### 🚨 **v2成功パターンの継承**
- モジュール単一責任の原則
- 中央制御による依存関係管理
- 段階的初期化とライフサイクル制御

---

## 🌟 成功の指標

### ✅ **設計成功の証明**
- [ ] 任意のペインを削除してもアプリが動作する
- [ ] 新しいペインを追加するのに既存コード変更不要
- [ ] 1つのペインのエラーが他に波及しない
- [ ] Web版→Electron版への移植が容易

### 📊 **品質指標**
- **結合度**: 低い（イベントベース通信のみ）
- **凝集度**: 高い（単一責任の原則）
- **拡張性**: 高い（プラグイン方式でペイン追加可能）
- **保守性**: 高い（責務明確・エラー境界確立）

---

**📖 詳細仕様**: [3ペイン責務分離設計書](./3-pane-responsibility-separation-design.md)（全76章）  
**🎯 次のステップ**: この設計に基づいたプロトタイプ実装の開始