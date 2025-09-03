# ElementObserver実験ファイル アーカイブ

## 概要
ElementObserverシステムの開発過程で作成された実験的・開発途中のファイルをアーカイブしています。

## アーカイブ理由
- Phase 3実験的機能（開発途中・未完成）
- 重複・古いテストファイル
- 混乱の原因となる実験コード
- AI開発時の判断を明確化するため

## アーカイブファイル一覧

### Phase 3実験ファイル（未完成・実験段階）
- `test-element-observer-phase3b-integration.html` - Phase 3-B統合テスト（メインディレクトリ版）
- `test-element-observer-phase3b-integration-root.html` - Phase 3-B統合テスト（ルートディレクトリ版・アーカイブ用プレースホルダ）
- `test-element-observer-phase3b-integration-micromodules.html` - Phase 3-B統合テスト（micromodules版・環境揺れ吸収モジュール）
- `test-element-observer-phase3a-phase3b-integration.html` - Phase 3-A/3-B統合テスト
- `demo-element-observer-phase3b-complete.html` - Phase 3-B完成デモ
- `performance-test-element-observer-phase3b.html` - パフォーマンステスト

### 開発時混乱原因
- 同じ名前のファイルが複数箇所に存在
- Phase 3機能が実験段階で本格実装前
- テストファイルが散在して保守困難

## 保持されるファイル（メインシステム）

### micromodules/element-observer/ （コアシステム）
- `ElementObserverCore.js` - Phase 1基盤システム
- `ElementObserver.js` - Phase 1 PureBoundingBox特化版
- `ElementObserverAdvanced.js` - Phase 2メインシステム
- `ElementObserverTransform.js` - CSS Transform統合
- `ElementObserverWebGL.js` - WebGL座標変換
- `ElementObserverResponsive.js` - レスポンシブ管理

### テストファイル（動作確認済み）
- `test-element-observer-phase2-integration.html` - Phase 2統合テスト（完成版）

## 利用方針
- **Phase 1-2システム**: 安定稼働中・推奨利用
- **Phase 3アーカイブ**: 実験段階・参考用のみ
- **新規開発**: Phase 2基盤を使用・Phase 3は要件明確化後に再検討

---

作成日: 2025-09-03
目的: AI開発時の混乱防止・明確な構成維持
