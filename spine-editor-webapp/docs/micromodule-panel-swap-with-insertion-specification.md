# 📋 マイクロモジュール分離型パネル操作システム仕様書 v2.0
## 🚀 入れ替え・挿入・レイアウト変更統合システム

## 🎯 概要

従来のパネル入れ替え機能に加えて、**パネル挿入**と**動的レイアウト変更**機能を追加したマイクロモジュール分離型システムの包括的設計仕様書。

### 📊 機能比較表

| 機能 | v1.0（入れ替えのみ） | v2.0（統合システム） |
|------|---------------------|---------------------|
| **入れ替え** | 1↔2 位置交換 | ✅ 継承・改良 |
| **挿入** | ❌ なし | ✅ 横・縦方向対応 |
| **レイアウト変更** | ❌ なし | ✅ 動的サイズ調整 |
| **操作方式** | ドラッグ&ドロップ | ✅ ドラッグ位置で自動判定 |
| **視覚フィードバック** | 基本のみ | ✅ リアルタイムプレビュー |

---

## 🏗️ システムアーキテクチャ

### 🎪 マイクロモジュール構成

```
┌─────────────────────────────┐
│   ModularPanelSystem        │  ← 統合管理・操作判定
│   (Operation Coordinator)   │
└─────────┬───────────────────┘
          │
    ┌─────┴─────────────┐
    │                   │
┌───▼─────┐        ┌────▼────┐
│ Drag    │        │ Panel   │
│Detector │        │Operator │  ← 操作実行
│         │        │         │
└─────────┘        └─┬───┬─┬─┘
                     │   │ │
           ┌─────────▼┐ ┌▼┐▼──────┐
           │Panel    │ │ │Layout  │
           │Switcher │ │ │Manager │
           └─────────┘ │ └────────┘
                      │
              ┌───────▼────┐
              │Panel       │
              │Inserter    │
              └────────────┘
```

### 📦 4つの専門モジュール

#### **1. DragDetector.js（ドラッグ検出・操作判定）**
- HTML5 Drag & Drop イベント処理
- **NEW**: 挿入位置検出（境界線判定）
- **NEW**: 操作タイプ自動判定（入れ替え/挿入/レイアウト変更）

#### **2. PanelSwitcher.js（パネル入れ替え専門）** 
- CSSクラス・Grid Area交換
- 従来機能をそのまま継承

#### **3. PanelInserter.js（パネル挿入専門）**
- **NEW**: 横方向挿入（1-2間に3を挿入）
- **NEW**: 縦方向挿入（3の上に1を挿入）
- Grid Template Areas の動的生成

#### **4. LayoutManager.js（レイアウト管理専門）**
- **NEW**: パネルサイズ調整（3を縦長に拡張）
- **NEW**: Grid Template Rows/Columns 管理
- 複雑なレイアウトパターンの制御

#### **5. ModularPanelSystem.js（統合管理）**
- 操作タイプに応じた適切なモジュール選択
- 4つのモジュール間の連携制御

---

## 🎨 対応レイアウトパターン

### 📐 基本レイアウト
```
┌─────┬─────┬─────┐
│  1  │  2  │  3  │  ← outliner, preview, properties
│     │     │     │
└─────┴─────┴─────┘
┌───────────────────┐
│         4         │  ← timeline
└───────────────────┘
```

### 🔄 **操作パターン1: 入れ替え（Swap）**
```
Before: │ 1 │ 2 │ 3 │    After: │ 1 │ 3 │ 2 │
        │   │   │   │           │   │   │   │
        └───┴───┴───┘           └───┴───┴───┘
```
**トリガー**: パネル中央部へのドロップ

### ➡️ **操作パターン2: 横挿入（Horizontal Insert）**
```
Before: │ 1 │ 2 │ 3 │    After: │ 3 │ 1 │ 2 │
        │   │   │   │           │   │   │   │
        └───┴───┴───┘           └───┴───┴───┘
```
**トリガー**: パネル境界線（縦線）へのドロップ

### ⬇️ **操作パターン3: 縦挿入（Vertical Insert）**
```
Before: │ 1 │ 2 │ 3 │    After: │ 2 │ 2 │ 1 │
        │   │   │   │           │   │   │   │
        └───┴───┴───┘           │   │   ├───┤
        │       4       │       │   │   │ 3 │
        └───────────────┘       └───┴───┴───┘
                                │       4       │
                                └───────────────┘
```
**トリガー**: パネル境界線（横線）へのドロップ

### 📏 **操作パターン4: レイアウト拡張（Layout Expansion）**
```
Before: │ 1 │ 2 │ 3 │    After: │ 1 │ 2 │ 3 │
        │   │   │   │           │   │   │   │
        └───┴───┴───┘           │   │   ├───┤
        │       4       │       │   │   │ 3 │
        └───────────────┘       └───┴───┴───┘
                                │       4       │
                                └───────────────┘
```
**トリガー**: 特定の拡張ゾーンへのドロップ

---

## 🔧 詳細設計仕様

### 📍 **DragDetector.js 拡張仕様**

#### **🎯 操作判定アルゴリズム**
```javascript
class DragDetector {
    detectOperationType(dropX, dropY, targetElement) {
        const bounds = targetElement.getBoundingClientRect();
        const relativeX = (dropX - bounds.left) / bounds.width;
        const relativeY = (dropY - bounds.top) / bounds.height;
        
        // 中央部（0.2-0.8）→ 入れ替え
        if (relativeX > 0.2 && relativeX < 0.8 && 
            relativeY > 0.2 && relativeY < 0.8) {
            return { type: 'swap' };
        }
        
        // 左右端（0-0.2, 0.8-1.0）→ 横挿入
        if (relativeX <= 0.2 || relativeX >= 0.8) {
            return { 
                type: 'horizontal-insert',
                position: relativeX <= 0.2 ? 'before' : 'after'
            };
        }
        
        // 上下端（0-0.2, 0.8-1.0）→ 縦挿入
        if (relativeY <= 0.2 || relativeY >= 0.8) {
            return {
                type: 'vertical-insert', 
                position: relativeY <= 0.2 ? 'above' : 'below'
            };
        }
    }
}
```

#### **🎨 視覚的フィードバック**
```javascript
showOperationPreview(operationType, position) {
    switch(operationType) {
        case 'swap':
            this.highlightSwapTarget(targetPanel);
            break;
        case 'horizontal-insert':
            this.showVerticalInsertLine(position);
            break;
        case 'vertical-insert':
            this.showHorizontalInsertLine(position);
            break;
    }
}
```

### 🔄 **PanelSwitcher.js（従来機能継承）**

#### **📋 API仕様（変更なし）**
```javascript
class PanelSwitcher {
    switchPanels(panel1Type, panel2Type)
    resetAllPanels()
    getPanelElement(panelType)
}
```

### ➡️ **PanelInserter.js（新規実装）**

#### **🎯 基本機能**
```javascript
class PanelInserter {
    insertHorizontally(panelToMove, targetPanel, position)
    insertVertically(panelToMove, targetPanel, position)
    calculateInsertionLayout(insertParams)
    applyInsertionLayout(newLayout)
}
```

#### **📐 横挿入の実装例**
```javascript
insertHorizontally(panelToMove, targetPanel, position) {
    const currentAreas = this.getCurrentGridAreas();
    // "outliner preview properties" → "properties outliner preview"
    
    const newAreas = this.reorderHorizontally(currentAreas, {
        move: panelToMove,        // 'properties'
        target: targetPanel,      // 'outliner'  
        position: position        // 'before'
    });
    
    this.applyGridAreas(newAreas);
}
```

#### **🔄 縦挿入の実装例**
```javascript
insertVertically(panelToMove, targetPanel, position) {
    // 現在の2行レイアウトを3行に拡張
    const newLayout = {
        areas: [
            `"${targetPanel} ${targetPanel} ${panelToMove}"`,  // 新しい行
            `"preview preview properties"`,                     // 既存行調整
            `"timeline timeline timeline"`                      // timeline維持
        ],
        rows: ["1fr", "1fr", "auto"]
    };
    
    this.applyComplexLayout(newLayout);
}
```

### 📏 **LayoutManager.js（新規実装）**

#### **🎯 レイアウト管理機能**
```javascript
class LayoutManager {
    expandPanel(panelType, direction, size)        // パネル拡張
    createCustomLayout(layoutSpec)                 // カスタムレイアウト生成
    optimizeLayout(constraints)                    // レイアウト最適化
    previewLayoutChange(change)                    // 変更プレビュー
}
```

#### **📊 レイアウトパターン定義**
```javascript
const LAYOUT_PATTERNS = {
    'default': {
        areas: [
            "outliner preview properties",
            "timeline timeline timeline"
        ],
        columns: "300px 1fr 300px",
        rows: "1fr auto"
    },
    
    'properties-expanded': {
        areas: [
            "outliner preview properties",
            "outliner preview properties", 
            "timeline timeline timeline"
        ],
        columns: "300px 1fr 300px",
        rows: "1fr 1fr auto"
    },
    
    'outliner-top': {
        areas: [
            "outliner outliner outliner",
            "preview timeline properties"
        ],
        columns: "1fr auto 300px", 
        rows: "1fr 1fr"
    }
};
```

### 🎪 **ModularPanelSystem.js（統合管理）**

#### **🔄 操作フロー制御**
```javascript
class ModularPanelSystem {
    handleDragComplete(dragEvent) {
        const operation = this.dragDetector.detectOperationType(dragEvent);
        
        switch(operation.type) {
            case 'swap':
                return this.panelSwitcher.switchPanels(
                    operation.from, operation.to
                );
                
            case 'horizontal-insert':
                return this.panelInserter.insertHorizontally(
                    operation.panel, operation.target, operation.position
                );
                
            case 'vertical-insert':
                return this.panelInserter.insertVertically(
                    operation.panel, operation.target, operation.position
                );
                
            case 'layout-change':
                return this.layoutManager.expandPanel(
                    operation.panel, operation.direction, operation.size
                );
        }
    }
}
```

---

## 📂 ファイル構成

```
micromodules/ui/modular-panel-system/
├── ModularPanelSystem.js       # 統合管理（70行）
├── DragDetector.js             # ドラッグ検出・操作判定（150行）
├── PanelSwitcher.js            # パネル入れ替え（80行）
├── PanelInserter.js            # パネル挿入（120行）
├── LayoutManager.js            # レイアウト管理（100行）
├── layout-patterns/            # レイアウト定義ファイル群
│   ├── default-layouts.js
│   ├── insertion-patterns.js
│   └── expansion-patterns.js
└── README.md                   # 使用方法
```

**総行数**: 約520行（複雑な機能を含むが、モジュール分離により管理可能）

---

## 🧪 段階的実装計画

### **Phase 1: 基本挿入機能（週1）**
- **目標**: 横方向挿入の実装
- **実装範囲**: 
  - DragDetector の境界検出機能
  - PanelInserter の基本横挿入
  - ModularPanelSystem の基本統合

```
実装順序:
1. PanelInserter.js基本実装（横挿入のみ）
2. DragDetector拡張（境界検出）
3. ModularPanelSystem統合
4. 基本テスト
```

### **Phase 2: 縦方向挿入対応（週2）**
- **目標**: 縦方向挿入の実装
- **実装範囲**:
  - 縦挿入アルゴリズム
  - Grid Template Rows 動的変更
  - 複雑なレイアウトパターン

```
実装順序:
1. LayoutManager.js基本実装
2. 縦挿入パターン定義
3. Grid Rows動的変更機能
4. 統合テスト
```

### **Phase 3: レイアウト拡張機能（週3）**
- **目標**: パネル拡張・縦長化
- **実装範囲**:
  - パネルサイズ調整
  - カスタムレイアウトパターン
  - 視覚的フィードバック改善

### **Phase 4: 最適化・完成（週4）**
- **目標**: パフォーマンス最適化とUX改善
- **実装範囲**:
  - アニメーション効果
  - エラーハンドリング強化
  - ユーザビリティテスト

---

## 🎯 操作例と期待動作

### **例1: 基本挿入操作**
```
ユーザー操作: propertiesパネルを outliner の左境界にドラッグ

システム動作:
1. DragDetector が境界検出 → horizontal-insert
2. PanelInserter が実行 → properties を outliner の前に挿入
3. 結果: "outliner preview properties" → "properties outliner preview"
```

### **例2: 縦方向挿入操作**  
```
ユーザー操作: outliner を properties の上境界にドラッグ

システム動作:
1. DragDetector が上境界検出 → vertical-insert  
2. PanelInserter が実行 → outliner を properties の上に配置
3. LayoutManager がレイアウト調整 → 3行レイアウトに変更
4. 結果: propertiesの上にoutlinerが配置される
```

### **例3: パネル拡張操作**
```
ユーザー操作: properties を下方向拡張ゾーンにドラッグ

システム動作: 
1. DragDetector が拡張操作検出 → layout-change
2. LayoutManager が実行 → properties を縦長に拡張
3. 結果: properties が2行分の高さに拡張
```

---

## 🚀 技術的実現性

### ✅ **CSS Grid による完全対応**
- **Grid Template Areas**: 任意のパネル配置が可能
- **Grid Template Rows/Columns**: 動的サイズ調整対応  
- **レスポンシブ**: 画面サイズに応じた自動調整

### ✅ **マイクロモジュールの利点**
- **独立開発**: 各モジュールの並行実装が可能
- **段階的実装**: 機能を段階的に追加、リスク管理
- **テスト容易**: 各モジュールの単体テストが簡単
- **保守性**: 問題発生時の原因特定と修正が容易

### ✅ **パフォーマンス最適化**
- **遅延初期化**: 使用する機能のみロード
- **キャッシュ機能**: レイアウトパターンの再利用
- **最適化アルゴリズム**: Grid計算の効率化

---

## 📊 成功指標

### ✅ **機能指標**
- **基本挿入**: 100%成功率（横方向）
- **縦挿入**: 100%成功率（縦方向） 
- **レイアウト変更**: 主要パターン対応
- **操作精度**: 意図した操作の95%以上正確に実行

### ✅ **技術指標**
- **各モジュール**: 150行以下を維持
- **レスポンス時間**: 操作から反映まで100ms以下
- **テストカバレッジ**: 各モジュール90%以上

### ✅ **ユーザビリティ指標**
- **操作の直感性**: 初回使用でも意図した操作が可能
- **視覚フィードバック**: 操作中のプレビューが明確
- **エラー回復**: 誤操作時の簡単な復旧

---

## 💡 まとめ

このマイクロモジュール分離設計により、**入れ替え**・**挿入**・**レイアウト変更**の3つの複雑な機能を、シンプルで保守しやすい形で実現できます。

各モジュールが独立しているため、段階的な実装が可能で、1つの機能が完成すれば即座に使用開始でき、残りの機能は並行して開発できます。

この設計で進めてよろしいでしょうか？どの機能から実装を開始したいでしょうか？