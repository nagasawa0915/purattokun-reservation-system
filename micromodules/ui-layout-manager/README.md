# UI Layout Manager Micromodule

## 概要
Spine Editor WebAppのレイアウト管理を行うマイクロモジュール

## 責務
- レイアウトプリセットの提供（デフォルト、フォーカス、デバッグ、ミニマル）
- カスタムレイアウトの保存・管理
- レイアウト切り替えUI
- レイアウト設定のエクスポート・インポート
- デフォルト配置への復元

## 外部依存
- EventBus（モジュール間通信）のみ
- PanelManager（レイアウト適用時の連携）

## 機能

### プリセットレイアウト
1. **デフォルト** 🏠 - 標準3パネル構成
2. **フォーカス** 🎯 - プレビュー重視、サイドパネル最小化
3. **デバッグ** 🔧 - すべてのパネルを表示、デバッグ作業最適
4. **ミニマル** 📱 - プレビューとタイムラインのみ

### カスタムレイアウト
- 現在のパネル配置を名前付きで保存
- カスタムレイアウトの削除
- レイアウト設定のエクスポート・インポート（JSON形式）

### キーボードショートカット
- `Ctrl+Shift+R` - デフォルトレイアウトに戻す
- `Ctrl+Shift+S` - レイアウト保存ダイアログ表示

## 使用方法

```javascript
import LayoutManager from './micromodules/ui-layout-manager/LayoutManager.js';

const layoutManager = new LayoutManager({
    container: document.body,
    eventBus: globalEventBus,
    panelManager: panelManagerInstance
});

// レイアウト切り替え
layoutManager.applyLayout('focus');

// カスタムレイアウト保存
layoutManager.saveCustomLayout('マイレイアウト', '作業用カスタム配置');

// 現在のレイアウト取得
console.log(layoutManager.getCurrentLayout());
```

## API

### メソッド
- `applyLayout(layoutKey, isCustom)` - レイアウト適用
- `saveCustomLayout(name, description)` - カスタムレイアウト保存
- `deleteCustomLayout(layoutKey)` - カスタムレイアウト削除
- `exportLayouts()` - レイアウト設定エクスポート
- `getCurrentLayout()` - 現在のレイアウト取得
- `getAvailableLayouts()` - 利用可能なレイアウト一覧

### 発行イベント
- `layoutManager:initialized` - 初期化完了
- `layout:applied` - レイアウト適用完了
- `layout:saved` - カスタムレイアウト保存完了
- `layout:deleted` - カスタムレイアウト削除完了

### 受信イベント
- `panel:resized` - パネルリサイズ時の現在レイアウト記録
- `panel:moved` - パネル移動時の現在レイアウト記録

## UI コンポーネント

### レイアウトドロップダウンメニュー
- トップバー右側に配置
- 現在のレイアウト名表示
- プリセット・カスタムレイアウト一覧
- 管理機能（保存、削除、エクスポート、インポート）

### レイアウト保存ダイアログ
- レイアウト名入力
- 説明文入力（任意）
- バリデーション機能

## データ構造

### レイアウト設定
```javascript
{
    name: 'レイアウト名',
    description: '説明',
    config: {
        panels: {
            'outliner': { 
                visible: true, 
                width: 200, 
                position: 'left',
                order: 1
            },
            // ... 他のパネル設定
        },
        gridTemplate: {
            columns: '200px 1fr 280px',
            rows: '1fr 200px'
        }
    }
}
```

### 永続化
- カスタムレイアウト: `localStorage: spine-editor-custom-layouts`
- 現在のレイアウト: `localStorage: spine-editor-current-layout`

## ファイル構成
```
micromodules/ui-layout-manager/
├── LayoutManager.js              # メインモジュール
├── layout-manager-styles.css     # スタイルシート
└── README.md                     # このファイル
```

## デザイン特徴
- ダークテーマ対応
- プロフェッショナルなドロップダウンUI
- アニメーション効果（フェードイン、スライド）
- レスポンシブ対応
- 直感的なアイコンとカラーコーディング

## 互換性
- モダンブラウザ（ES6+ 対応）
- EventBus設計による疎結合
- ローカルストレージ対応
- JSON形式でのデータ互換性