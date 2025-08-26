# PureBoundingBox v5.0 技術仕様書

## 📁 フォルダ構造

```
/Users/seiichinagasawa/purattokun-reservation-system/micromodules/bounding-box/
├── PureBoundingBoxCore.js     # データ・状態管理（~170行）
├── PureBoundingBoxBounds.js   # 座標計算ロジック（~240行）
├── PureBoundingBoxUI.js       # UI生成・表示制御（~160行）
├── PureBoundingBoxEvents.js   # イベント処理（~180行）
├── PureBoundingBox.js         # 統合インターフェース（~200行）
├── README.md                  # 使い方・API・実例
└── SPEC.md                    # 技術仕様・入出力データ（このファイル）
```

## 技術アーキテクチャ

### モジュール構成

| モジュール名 | 責務 | 依存関係 | サイズ |
|--------------|------|------------|------|
| **PureBoundingBox** | 統合インターフェース・API提供 | 他三4モジュール | ~200行 |
| **PureBoundingBoxCore** | データ構造・状態管理 | なし | ~170行 |
| **PureBoundingBoxBounds** | 座標計算ロジック | Core | ~240行 |
| **PureBoundingBoxUI** | DOM操作・UI生成 | Core | ~160行 |
| **PureBoundingBoxEvents** | イベント処理 | Core, Bounds, UI | ~180行 |

### データフロー

```
ユーザー操作
      ↓
PureBoundingBoxEvents  ←→  PureBoundingBoxUI
      ↓                        ↓
PureBoundingBoxBounds  →  PureBoundingBoxCore
      ↓                        ↓
  DOM更新                 状態保存
```

## API仕様

### コンストラクタ

```typescript
new PureBoundingBox(config: {
    targetElement: HTMLElement,     // 必須: 編集対象要素
    nodeId?: string,               // オプション: 独自ID
    minWidth?: number,             // オプション: 最小幅(デフォルト:20)
    minHeight?: number             // オプション: 最小高さ(デフォルト:20)
})
```

### メインAPI

#### `async execute(options?)`

**入力パラメータ**
```typescript
options?: {
    visible?: boolean  // 初期表示状態(デフォルト: true)
}
```

**出力データ**
```typescript
{
    success: boolean,
    bounds?: {
        x: number,
        y: number,
        width: number,
        height: number
    },
    nodeId?: string,
    error?: string
}
```

#### 制御API

```typescript
show(): void                    // 表示
hide(): void                    // 非表示
cleanup(): void                 // リソース解放
getState(): StateObject         // 現在状態取得
updateConfig(config): void      // 設定更新
getBounds(): BoundsObject       // 座標情報取得
```

## 内部データ構造

### Coreデータ構造

```typescript
interface CoreState {
    config: {
        targetElement: HTMLElement,
        nodeId: string,
        minWidth: number,
        minHeight: number
    },
    
    // Transform座標系（通常時）
    transform: {
        x: number,
        y: number,
        scaleX: number,
        scaleY: number,
        rotation: number
    },
    
    // Bounds座標系（編集時）
    bounds: {
        x: number,
        y: number,
        width: number,
        height: number
    },
    
    // スワップ状態
    swapState: {
        currentMode: 'idle' | 'editing',
        originalTransform: TransformObject | null
    },
    
    // ドラッグ状態
    dragState: {
        isDragging: boolean,
        dragType: string | null,
        startMouseX: number,
        startMouseY: number,
        startBoundsX: number,
        startBoundsY: number,
        startBoundsWidth: number,
        startBoundsHeight: number,
        modifierKeys: {
            shift: boolean,
            alt: boolean,
            ctrl: boolean
        }
    },
    
    // UI状態
    uiState: {
        visible: boolean,
        container: HTMLElement | null,
        handles: HTMLElement[]
    }
}
```

## 座標系スワップ機構

### 🎯 v2互換機構

✨ **2つの座標系を動的切り替え**

1. **Transform座標系** (通常時)
   - CSS transform プロパティベース
   - `translate()`, `scale()`, `rotate()` 対応
   - 高パフォーマンスアニメーション

2. **Bounds座標系** (編集時)
   - `left`, `top`, `width`, `height` ベース
   - 精密なピクセル単位編集
   - v2バウンディングボックス完全互換

### スワップタイミング

```javascript
// 編集開始時: Transform → Bounds
core.enterEditingMode();
  → transform値を保存
  → 要素のcomputedStyleからboundsを取得
  → 編集モードフラグON

// 編集終了時: Bounds → Transform  
core.exitEditingMode();
  → bounds結果をtransformに反映
  → 要素のスタイルを更新
  → 編集モードフラグOFF
```

## ハンドル系統

### ハンドル配置

```
nw    n     ne
 □ ── ● ── □
 |           |
 w ●         ● e
 |           |
 □ ── ● ── □
sw    s     se
```

### ハンドルタイプ別動作

| ハンドル | 動作 | カーソル |
|--------|------|----------|
| `move` | 移動 | `move` |
| `nw` | 左上リサイズ | `nw-resize` |
| `n` | 上辺リサイズ | `n-resize` |
| `ne` | 右上リサイズ | `ne-resize` |
| `e` | 右辺リサイズ | `e-resize` |
| `se` | 右下リサイズ | `se-resize` |
| `s` | 下辺リサイズ | `s-resize` |
| `sw` | 左下リサイズ | `sw-resize` |
| `w` | 左辺リサイズ | `w-resize` |

## 修飾キー動作

### Shiftキー: 等比スケール

- **角ハンドル**: 縦横比保持でリサイズ
- **辺ハンドル**: 反対辺を固定点とした等比スケール

```javascript
// 例: 上辺ハンドル + Shift
// → 下辺を固定点として等比スケール
// → 幅も自動調整される
```

### Altキー: 中心基準スケール

- 元の中心点を保持したままリサイズ
- 全方向に同時拡大・縮小

### Ctrlキー

- 現在未実装 (将来拡張用)

## タッチサポート

### サポートイベント

| マウスイベント | タッチイベント | 動作 |
|---------------|----------------|------|
| `mousedown` | `touchstart` | ドラッグ開始 |
| `mousemove` | `touchmove` | ドラッグ中 |
| `mouseup` | `touchend` | ドラッグ終了 |

### マルチタッチ

現在はシングルタッチのみ対応。複数指タッチ時は最初のタッチポイントを使用。

## Spine Canvas特化機能

### 自動検出

```javascript
// Canvas要素で、IDにspineまたはcanvasを含む場合、
// 自動的にSpine Canvasと認識
const isSpineCanvas = element.tagName === 'CANVAS' && 
                     (element.id.includes('spine') || 
                      element.id.includes('canvas'));
```

### 座標系の違い

| 要素タイプ | 座標系 | 単位 |
|------------|-------|------|
| **通常要素** | ピクセル | px |
| **Spine Canvas** | 親要素基準相対 | % |

### Spine専用処理

```javascript
// Spine Canvasの場合の座標計算
const parentRect = element.parentElement.getBoundingClientRect();
const relativeX = ((bounds.x / parentRect.width) * 100).toFixed(2);
const relativeY = ((bounds.y / parentRect.height) * 100).toFixed(2);

// CSS適用
element.style.left = relativeX + '%';
element.style.top = relativeY + '%';
```

## パフォーマンス特性

### メモリ使用量

- **基本メモリ**: ~5KB (全モジュール統合)
- **UIアクティブ時**: +2KB (DOMノード・イベントリスナー)
- **cleanup()後**: 0KB (完全リセット)

### CPU負荷

- **アイドル時**: 0% CPU
- **ドラッグ操作時**: 1-3% CPU (60fps相当)
- **最適化**: requestAnimationFrame不使用で軽量

## エラーハンドリング

### 主要エラーケース

| エラー | 原因 | 対処法 |
|--------|------|--------|
| **必要モジュール不足** | サブモジュール未読み込み | 全4ファイルを正しい順序で読み込み |
| **targetElementエラー** | 存在しない要素を指定 | 有効なDOM要素を渡す |
| **ドラッグ中エラー** | 要素が消去、または変更された | cleanup()でリセット |

### デバッグ情報

```javascript
// 状態デバッグ
const state = boundingBox.getState();
console.log('Debug Info:', {
    mode: state.swapState.currentMode,
    isDragging: state.dragState.isDragging,
    bounds: state.bounds,
    transform: state.transform,
    uiVisible: state.uiState.visible
});
```

## ブラウザサポート

### サポートブラウザ

- Chrome 80+ ✅
- Firefox 75+ ✅  
- Safari 13+ ✅
- Edge 80+ ✅
- iOS Safari 13+ ✅
- Chrome Android 80+ ✅

### 非サポート

- Internet Explorer ❌ (全バージョン)
- 古いAndroidブラウザ (<5.0) ❌

## バージョン履歴

### v5.0 (現在)
- マイクロモジュール設計で再設計
- 4モジュールへの分割
- タッチサポート追加
- Spine Canvas特化

### v4.x
- BBSwap機構導入
- v2互換性確保

### v3.x
- フルリライト版

### v2.x
- レガシーバウンディングボックス版