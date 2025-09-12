# 📋 マイクロモジュール分離型パネル入れ替えシステム仕様書

## 🎯 概要

従来の複雑な一体型システムを「単一責任の原則」に基づいて分離し、保守性・テスト容易性・再利用性を向上させたパネル入れ替えシステムの設計仕様書。

### 📊 設計方針

| 従来方式 | マイクロモジュール方式 |
|---------|----------------------|
| 1つの大きなファイル | 複数の小さな専門モジュール |
| 全機能が密結合 | 各モジュールが独立 |
| 1箇所の故障で全停止 | 部分的な故障に強い |
| デバッグが困難 | 原因特定が容易 |
| テストが複雑 | 単体テストが簡単 |

---

## 🏗️ アーキテクチャ設計

### 🎪 システム構成

```
┌─────────────────────────┐
│   ModularPanelSwap      │  ← 統合管理
│   (Coordinator)         │
└─────────┬───────────────┘
          │
    ┌─────┴─────┐
    │           │
┌───▼────┐  ┌──▼─────┐
│ Drag   │  │ Panel  │
│Detector│  │Switcher│  ← 2つの専門モジュール
└────────┘  └────────┘
```

### 📦 モジュール分離戦略

#### **1. DragDetector.js（ドラッグ検出専門）**
- **責任範囲**: HTML5 Drag & Drop API の処理のみ
- **入力**: DOM要素、ユーザーのドラッグ操作
- **出力**: ドラッグイベント情報（どこから、どこへ）
- **知らないこと**: パネルが何か、CSSがどうなるか

#### **2. PanelSwitcher.js（パネル切り替え専門）**
- **責任範囲**: CSS クラスとGrid Area の変更のみ
- **入力**: 切り替え指示（パネルA ↔ パネルB）
- **出力**: 切り替え結果（成功/失敗）
- **知らないこと**: どうやって指示が来たか

#### **3. ModularPanelSwap.js（統合管理）**
- **責任範囲**: 2つのモジュールの連携のみ
- **機能**: DragDetector → PanelSwitcher への橋渡し
- **サイズ**: 50行程度の軽量クラス

---

## 🔧 詳細設計仕様

### 📍 **DragDetector.js 仕様**

#### **🎯 基本機能**
- HTML5 Drag & Drop イベントの検出
- ドラッグ元・ドラッグ先の特定
- 有効なドロップ先の判定

#### **📋 API設計**
```javascript
class DragDetector {
    constructor(targetSelector) 
    enableDrag()
    disableDrag()
    onDragComplete(callback)    // コールバック登録
}

// イベント形式
{
    from: 'outliner',      // ドラッグ元パネル
    to: 'preview',         // ドラッグ先パネル
    fromElement: DOMNode,  // 元要素
    toElement: DOMNode,    // 先要素
    timestamp: 1234567890
}
```

#### **🚫 責任範囲外**
- CSSの変更は行わない
- パネルの種類は関知しない
- 重複防止機能は持たない
- エラーハンドリングは最小限

#### **⚡ 技術仕様**
- **サイズ**: 100行以下
- **依存関係**: なし（Pure JavaScript）
- **ブラウザ対応**: HTML5 Drag & Drop サポート必須
- **パフォーマンス**: イベント登録のみ、計算処理なし

---

### 🔄 **PanelSwitcher.js 仕様**

#### **🎯 基本機能**
- パネル要素のCSSクラス交換
- Grid Area プロパティの更新
- 初期状態への復元

#### **📋 API設計**
```javascript
class PanelSwitcher {
    constructor()
    switchPanels(panel1Type, panel2Type)    // 'outliner' ↔ 'preview'
    resetAllPanels()                        // 全パネルを初期状態に
    getPanelElement(panelType)              // パネル要素取得
}

// 戻り値形式
{
    success: true/false,
    fromPanel: 'outliner',
    toPanel: 'preview',
    message: '切り替え完了' | エラー詳細
}
```

#### **🔍 動作詳細**
1. **要素検索**: `document.querySelector('.panel-${panelType}')` でパネル検索
2. **クラス交換**: `panel-outliner` ↔ `panel-preview`
3. **Grid設定**: `style.setProperty('grid-area', newType, 'important')`
4. **属性更新**: `data-panel` 属性も同期更新

#### **🚫 責任範囲外**
- ドラッグイベントは処理しない
- どのパネルを切り替えるかの判断はしない
- ユーザーインターフェースは持たない

#### **⚡ 技術仕様**
- **サイズ**: 80行以下
- **依存関係**: なし（Pure JavaScript）
- **エラーハンドリング**: パネル要素が見つからない場合の処理
- **テスト容易性**: 引数 → 戻り値の単純な関数型

---

### 🎪 **ModularPanelSwap.js 仕様（統合管理）**

#### **🎯 基本機能**
- DragDetector と PanelSwitcher の初期化
- イベント連携の設定
- システム全体の状態管理

#### **📋 API設計**
```javascript
class ModularPanelSwap {
    constructor()
    initialize()                    // 両モジュール初期化
    enableDrag()                   // ドラッグ機能有効化
    disableDrag()                  // ドラッグ機能無効化
    switchPanels(type1, type2)     // プログラムからの切り替え
    resetLayout()                  // レイアウトリセット
    getDebugInfo()                 // デバッグ情報取得
}
```

#### **🔄 連携フロー**
```javascript
// DragDetector からのイベント受信
dragDetector.onDragComplete((event) => {
    const result = panelSwitcher.switchPanels(event.from, event.to);
    if (result.success) {
        console.log('✅ パネル切り替え成功');
        this.dispatchEvent('panelSwapped', result);
    }
});
```

#### **⚡ 技術仕様**
- **サイズ**: 50-70行
- **役割**: 薄い連携レイヤー
- **エラー処理**: 各モジュールのエラーを統合して報告

---

## 📂 ファイル構成

```
micromodules/ui/modular-panel-swap/
├── ModularPanelSwap.js      # 統合管理（50行）
├── DragDetector.js          # ドラッグ検出専門（100行）
├── PanelSwitcher.js         # パネル切り替え専門（80行）
└── README.md               # 使用方法
```

**総行数**: 約230行（従来の1/5以下）

---

## 🧪 テスト戦略

### **単体テスト**

#### **DragDetector.js**
```javascript
// モック DOM でドラッグイベント発生
// → 正しいイベント情報が出力されるかテスト
test('outliner から preview へのドラッグを検出', () => {
    // テストコード
});
```

#### **PanelSwitcher.js**
```javascript
// 関数呼び出し → DOM変更をテスト
test('outliner と preview のクラスが交換される', () => {
    panelSwitcher.switchPanels('outliner', 'preview');
    // CSS クラスの変更を検証
});
```

### **統合テスト**
```javascript
test('ドラッグ操作で実際にパネルが切り替わる', () => {
    // DragDetector + PanelSwitcher の連携テスト
});
```

---

## 🎯 実装メリット

### ✅ **保守性の向上**
- 問題発生時の原因特定が容易
- 修正範囲が局所化
- コードレビューが簡単

### ✅ **再利用性の向上**
- PanelSwitcher → ボタン操作、キーボード操作でも利用可能
- DragDetector → 他のドラッグ機能でも利用可能

### ✅ **テスト容易性**
- 各モジュールの単体テストが簡単
- モックを使った分離テストが可能

### ✅ **開発効率**
- 並行開発が可能（ドラッグ担当・切り替え担当を分離）
- デバッグ時間の短縮

---

## 🚀 段階的実装計画

### **Phase 1: PanelSwitcher.js（1日目）**
- 最も重要で確実な部分から実装
- UltraSimplePanelSwap の成功ロジックを移植
- 十分なテストで動作確認

### **Phase 2: DragDetector.js（2日目）**
- HTML5 Drag & Drop の基本実装
- PanelSwitcher との連携確認

### **Phase 3: ModularPanelSwap.js（3日目）**
- 統合管理クラス実装
- SystemCoordinator との統合

### **Phase 4: テスト・改良（4日目）**
- 単体テスト・統合テスト実装
- パフォーマンス調整

---

## 📊 成功指標

### ✅ **技術指標**
- 各モジュールが100行以下
- 単体テストカバレッジ 90%以上
- 統合テストでの完全動作

### ✅ **ユーザビリティ指標**
- ドラッグ操作での確実なパネル切り替え
- エラー発生時の適切な回復
- レスポンス時間 100ms以下

### ✅ **保守性指標**
- 新規開発者が各モジュールを30分以内で理解可能
- バグ修正時の影響範囲を1モジュールに限定

---

## 🎭 従来システムとの比較

| 項目 | 従来システム | マイクロモジュール |
|------|-------------|-------------------|
| **ファイル数** | 1つ | 3つ |
| **総行数** | 400+行 | 230行 |
| **複雑度** | 高（全機能が絡み合い） | 低（各モジュール独立） |
| **テスト性** | 困難（統合テストのみ） | 容易（単体+統合） |
| **デバッグ性** | 困難（原因特定に時間） | 容易（モジュール別分析） |
| **再利用性** | 低（全機能セット） | 高（部分的な利用可能） |
| **修正影響** | 全体に波及リスク | 局所化 |
| **並行開発** | 不可 | 可能 |

---

この設計により、今日経験した複雑さの問題を根本的に解決し、保守しやすく拡張可能なシステムが実現できます。

いかがでしょうか？この仕様で実装を進めてみますか？