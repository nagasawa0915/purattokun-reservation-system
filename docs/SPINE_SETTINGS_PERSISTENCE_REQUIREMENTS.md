# SpineSettingsPersistence マイクロモジュール要件定義書

**文書バージョン**: v1.0  
**作成日**: 2025-09-04  
**目的**: Canvas制御システムの永続化機能を独立したマイクロモジュールとして分離

---

## 📋 1. プロジェクト概要

### 1.1 背景・課題
現在のCanvasResizeControllerは以下の問題を抱えている：

- **責任過多**: UI制御 + 永続化 + 通信を1つのモジュールで担当
- **複雑な通信**: iframe ←→ メインページ間の非同期通信でタイミング問題
- **デバッグ困難**: 永続化失敗の原因特定が困難
- **再利用性低**: 他のページ・プロジェクトでの再利用が困難

### 1.2 解決方針
**単一責任の原則**に基づき、永続化機能を独立したマイクロモジュールとして分離する。

---

## 🎯 2. 要件定義

### 2.1 機能要件

#### 2.1.1 基本機能
| 機能ID | 機能名 | 説明 |
|--------|--------|------|
| F001 | Spine設定保存 | キャラクター固有のSpine表示設定をlocalStorageに保存 |
| F002 | Spine設定復元 | 保存された設定を読み込み、SpineRendererに適用 |
| F003 | 設定クリア | 指定キャラクター/全体の保存設定を削除 |
| F004 | 設定存在確認 | 指定キャラクターの設定が保存済みかチェック |

#### 2.1.2 高度機能
| 機能ID | 機能名 | 説明 |
|--------|--------|------|
| F005 | 複数キャラクター対応 | ページ内の複数Spineキャラクターを個別管理 |
| F006 | ページ固有対応 | 異なるHTMLページで独立した設定管理 |
| F007 | バックアップ・復旧 | 設定の一括エクスポート・インポート |
| F008 | 設定バージョン管理 | データ形式変更時の互換性保持 |

### 2.2 非機能要件

#### 2.2.1 性能要件
- **応答時間**: 設定保存・復元は100ms以内
- **メモリ使用量**: 1MB以下（設定データ）
- **ブラウザ対応**: モダンブラウザ（ES6+）

#### 2.2.2 可用性要件
- **localStorage容量制限対応**: 容量不足時の適切なエラー処理
- **データ破損対応**: 不正データ検出時のフォールバック
- **ブラウザ互換性**: localStorage未対応時の代替処理

#### 2.2.3 保守性要件
- **シンプルなAPI**: 直感的で理解しやすいメソッド設計
- **詳細ログ**: デバッグ用の詳細な動作ログ出力
- **設定検証**: 保存・復元時のデータ整合性チェック

---

## 🏗️ 3. アーキテクチャ設計

### 3.1 モジュール構成

```
📦 SpineSettingsPersistence/
├── SpineSettingsPersistence.js  # メインモジュール
├── SpineSettingsValidator.js    # 設定データ検証
├── SpineSettingsStorage.js      # localStorage操作
└── README.md                    # 使用方法・API仕様
```

### 3.2 責任分担

#### 3.2.1 SpineSettingsPersistence (メインクラス)
```javascript
class SpineSettingsPersistence {
    // 基本操作
    save(characterId, settings)
    restore(characterId)
    clear(characterId)
    exists(characterId)
    
    // 高度操作
    saveAll(settingsMap)
    restoreAll()
    exportSettings()
    importSettings(data)
}
```

#### 3.2.2 SpineSettingsValidator (検証)
- 設定データの形式検証
- 必須フィールドチェック
- 数値範囲検証

#### 3.2.3 SpineSettingsStorage (ストレージ)
- localStorage操作の抽象化
- キー生成・管理
- 容量制限・エラーハンドリング

### 3.3 データ設計

#### 3.3.1 設定データ構造
```json
{
    "version": "1.0",
    "timestamp": "2025-09-04T12:00:00Z",
    "pageId": "/test-nezumi-stable-spine-bb.html",
    "characters": {
        "nezumi": {
            "canvasSize": 800,
            "scaleX": 1.0,
            "scaleY": 1.0,
            "positionX": 0,
            "positionY": 0
        },
        "purattokun": {
            "canvasSize": 600,
            "scaleX": 1.2,
            "scaleY": 1.2,
            "positionX": 100,
            "positionY": 50
        }
    }
}
```

#### 3.3.2 localStorage キー設計
```
spineSettings-{pageId}           # ページ全体設定
spineSettings-{pageId}-{charId}  # キャラクター個別設定
spineSettings-backup-{timestamp} # バックアップ
```

---

## 🔄 4. 統合設計

### 4.1 CanvasResizeControllerとの連携

#### 4.1.1 修正後のCanvasResizeController
```javascript
// 永続化機能を削除
class CanvasResizeController {
    // UI制御のみに特化
    handleScaleChange(scaleX, scaleY) {
        // リアルタイムでメインページに送信のみ
        this.sendToParent('scaleChanged', {scaleX, scaleY});
    }
    
    // localStorage操作は完全削除
    // saveSpineSettings() ← 削除
    // restoreSpineSettings() ← 削除
}
```

#### 4.1.2 メインページでの統合
```javascript
// 新しい統合パターン
const persistence = new SpineSettingsPersistence();

// CanvasResizeControllerからの変更を受信
window.addEventListener('message', (event) => {
    if (event.data.type === 'scaleChanged') {
        // 即座にSpineRendererに適用
        spineRenderer.setTransform(null, null, event.data.scaleX, event.data.scaleY);
        
        // 永続化モジュールで保存
        persistence.save('nezumi', {
            scaleX: event.data.scaleX,
            scaleY: event.data.scaleY
        });
    }
});

// ページ読み込み時の復元
window.addEventListener('load', () => {
    const settings = persistence.restore('nezumi');
    if (settings) {
        spineRenderer.setTransform(null, null, settings.scaleX, settings.scaleY);
    }
});
```

### 4.2 利点

#### 4.2.1 CanvasResizeController側
- **責任明確化**: UI制御のみに集中
- **通信シンプル化**: postMessage送信のみ
- **再利用性向上**: 永続化を考えない純粋なUIモジュール

#### 4.2.2 メインページ側
- **制御統一**: SpineRenderer操作と永続化を同じ場所で管理
- **タイミング制御**: iframe通信に依存しない確実な保存・復元
- **デバッグ容易**: 永続化問題の切り分けが簡単

---

## 🚀 5. 実装計画

### 5.1 Phase 1: 基盤実装
- [ ] SpineSettingsPersistence基本クラス実装
- [ ] 基本的なsave/restore/clear機能
- [ ] 単体テスト作成

### 5.2 Phase 2: 高度機能
- [ ] 複数キャラクター対応
- [ ] ページ固有対応
- [ ] データ検証機能

### 5.3 Phase 3: 統合テスト
- [ ] test-nezumi-stable-spine-bb.htmlでの統合
- [ ] CanvasResizeController改修
- [ ] 動作確認・パフォーマンステスト

### 5.4 Phase 4: 展開
- [ ] 他のHTMLページでの利用
- [ ] ドキュメント整備
- [ ] 既存システムからの移行

---

## 📊 6. 成功指標

### 6.1 技術指標
- [ ] **設定保存成功率**: 99%以上
- [ ] **復元正確性**: 100%（保存した値と完全一致）
- [ ] **応答時間**: 保存・復元ともに100ms以内
- [ ] **メモリリーク**: 長時間動作でのメモリ増加なし

### 6.2 開発効率指標
- [ ] **デバッグ時間短縮**: 永続化問題の特定を50%短縮
- [ ] **新ページ対応時間**: 新しいHTMLページへの適用を75%短縮
- [ ] **保守工数削減**: CanvasResizeController保守工数を30%削減

### 6.3 ユーザー体験指標
- [ ] **設定復元**: ページリロード時の設定復元100%成功
- [ ] **複数キャラクター**: 個別設定の混在なし
- [ ] **操作応答性**: UI操作から反映まで体感遅延なし

---

## 🔍 7. リスク分析

### 7.1 技術リスク

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|----------|------|
| localStorage容量制限 | 中 | 低 | 容量監視・古いデータ自動削除 |
| ブラウザ互換性問題 | 中 | 低 | フォールバック機能・graceful degradation |
| 既存データ移行失敗 | 高 | 中 | 段階的移行・ロールバック機能 |

### 7.2 運用リスク

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|----------|------|
| 既存システムとの競合 | 高 | 中 | 段階的置き換え・並行運用期間 |
| 設定データ破損 | 中 | 低 | 自動バックアップ・復旧機能 |
| パフォーマンス劣化 | 低 | 低 | ベンチマーク・監視機能 |

---

## 📝 8. 受け入れ基準

### 8.1 基本機能
- [ ] 1つのキャラクターの設定を保存・復元できる
- [ ] 複数キャラクターの設定を個別に管理できる
- [ ] ページ固有の設定管理ができる
- [ ] 不正データを適切に検出・処理する

### 8.2 統合機能
- [ ] CanvasResizeControllerからの操作が即座に反映される
- [ ] ページリロード時に設定が確実に復元される
- [ ] 既存のCanvasResizeController機能に影響しない
- [ ] test-nezumi-stable-spine-bb.htmlで完全動作する

### 8.3 品質基準
- [ ] 単体テストカバレッジ90%以上
- [ ] 統合テスト全項目パス
- [ ] コードレビュー完了
- [ ] ドキュメント整備完了

---

## 📚 9. 参考資料

### 9.1 既存システム
- `micromodules/canvas-resize/` - 現在のCanvasResizeController
- `test-nezumi-stable-spine-bb.html` - 統合対象ページ
- `micromodules/spine-renderer/StableSpineRenderer.js` - 参考モジュール設計

### 9.2 設計思想
- 単一責任の原則 (Single Responsibility Principle)
- マイクロモジュール設計パターン
- 関心の分離 (Separation of Concerns)

---

**この要件定義書に基づいて、SpineSettingsPersistenceマイクロモジュールの開発を進める。**