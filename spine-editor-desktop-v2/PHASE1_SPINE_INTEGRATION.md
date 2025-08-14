# Phase 1: Spine WebGL統合実装

## 🎯 実装概要

Phase 1では、ドロップされたSpineキャラクターを実際にプレビューiframe内でSpine WebGLを使用して表示する機能を実装しました。

## 📋 実装内容

### 1. iframe内Spine WebGL環境セットアップ

**ファイル**: `src/renderer/js/iframe-spine-loader.js`

- 動的なSpine WebGLライブラリ読み込み機能
- Spineキャラクター表示用のcanvas要素作成
- 基本的なSpine WebGL初期化
- postMessage APIを使用した双方向通信

**主要機能**:
- `initializeSpineEnvironment()` - Spine WebGL環境の初期化
- `loadSpineWebGL()` - ライブラリの動的読み込み
- `createCanvas()` - Canvas要素の作成と設定
- `handleAddCharacter()` - キャラクター追加処理
- `handleUpdateCharacter()` - キャラクター更新処理
- `handleRemoveCharacter()` - キャラクター削除処理

### 2. iframe通信システム

**ファイル**: `src/renderer/js/iframe-spine-bridge.js`

- メインアプリからiframeへのSpineキャラクター操作メッセージ
- 双方向通信とイベント管理
- エラーハンドリングとフォールバック機能

**主要機能**:
- `addSpineCharacter()` - iframe内にSpineキャラクターを追加
- `updateSpineCharacter()` - iframe内のSpineキャラクターを更新
- `removeSpineCharacter()` - iframe内のSpineキャラクターを削除
- `sendMessage()` - iframe通信メッセージ送信
- イベントリスナー管理（on/off/emit）

### 3. SpineCharacterManager改良

**ファイル**: `src/renderer/spine-character-manager.js`

- `addSpineCharacterToPreview`メソッドをダミー表示から実際のSpine表示に変更
- iframe通信ブリッジとの統合
- ドラッグ操作時のiframe内Spineキャラクター位置同期

**新機能**:
- `setPreviewIframe()` - プレビューiframeの設定
- `setupBridgeEventHandlers()` - ブリッジイベントハンドラのセットアップ
- `updateDummyToSpineDisplay()` - ダミー要素をSpine表示に更新
- ドラッグ操作でのリアルタイム位置同期

### 4. メインアプリ統合

**ファイル**: `src/renderer/app.js`

- SpineCharacterManagerにプレビューiframeを設定する処理を追加
- 初期化フローにSpine統合機能を組み込み

### 5. テンプレートHTML

**ファイル**: 
- `src/renderer/templates/spine-enhanced-preview.html` - Spine機能強化プレビューテンプレート
- `src/renderer/templates/test-spine-integration.html` - Spine統合テストページ

## 🔧 技術仕様

### 通信プロトコル

**メインアプリ → iframe**:
- `SPINE_INIT` - Spine環境初期化
- `SPINE_ADD_CHARACTER` - キャラクター追加
- `SPINE_UPDATE_CHARACTER` - キャラクター更新
- `SPINE_REMOVE_CHARACTER` - キャラクター削除

**iframe → メインアプリ**:
- `SPINE_READY` - Spine環境準備完了
- `SPINE_ERROR` - Spineエラー
- `SPINE_CHARACTER_ADDED` - キャラクター追加完了
- `SPINE_CHARACTER_UPDATED` - キャラクター更新完了
- `SPINE_CHARACTER_REMOVED` - キャラクター削除完了
- `SPINE_CHARACTER_ERROR` - キャラクター操作エラー

### データ構造

**キャラクターデータ**:
```javascript
{
    name: "character_name",
    jsonPath: "path/to/character.json",
    atlasPath: "path/to/character.atlas",
    texturePath: "path/to/character.png",
    folderPath: "path/to/character/folder"
}
```

**位置・スケール情報**:
```javascript
{
    position: { x: 200, y: 200 },
    scale: 0.5
}
```

## 🚀 使用方法

### 1. 基本的な使い方

1. Spineフォルダを選択してキャラクターを読み込み
2. HTMLファイルを選択してプレビューを表示
3. Spineキャラクターをプレビューエリアにドラッグ&ドロップ
4. ダミー表示と同時にiframe内に実際のSpineキャラクターが表示される
5. ダミー要素をドラッグすると、iframe内のSpineキャラクターの位置も同期更新される

### 2. 動作確認

**テスト用HTMLファイル**:
- `templates/test-spine-integration.html` - Spine統合機能のテスト
- `templates/spine-enhanced-preview.html` - 実際のプレビュー

**デバッグ方法**:
1. ブラウザのF12開発者ツールを開く
2. Consoleでログを確認
3. NetworkタブでSpineファイル読み込みを確認
4. Elementsタブでcanvas要素作成を確認

## 📊 実装状況

### ✅ 完了済み機能

- [x] iframe内Spine WebGL環境の動的セットアップ
- [x] postMessage通信システム
- [x] キャラクター追加・更新・削除のbasic機能
- [x] メインアプリとの統合
- [x] エラーハンドリング基盤
- [x] テスト用HTML作成

### 🔄 次のPhaseで実装予定

- [ ] 実際のSpineアニメーション表示テスト
- [ ] パフォーマンス最適化
- [ ] 詳細な編集機能（アニメーション切り替え、詳細なスケール調整等）
- [ ] エラー発生時のフォールバック改良

## ⚠️ 注意事項

### 1. 既存機能への影響

- 既存のダミー表示機能は完全に保持
- Spine機能でエラーが発生してもダミー表示にフォールバック
- 既存のドラッグ&ドロップ機能は変更なし

### 2. エラーハンドリング

- Spine WebGL読み込み失敗時は自動でダミー表示に切り替え
- iframe通信エラー時はローカル処理を継続
- 各操作でエラー発生時はユーザーにトースト通知表示

### 3. パフォーマンス考慮

- Spine WebGLライブラリは使用時のみ動的読み込み
- iframe通信は必要最小限のデータのみ送信
- キャラクター追加時のみSpine環境を初期化

## 🔍 トラブルシューティング

### よくある問題

1. **Spine WebGLライブラリが読み込まれない**
   - パスが正しいか確認: `../assets/spine/spine-webgl.js`
   - HTTPサーバーが起動しているか確認

2. **iframe通信ができない**
   - 同一オリジンでアクセスしているか確認
   - コンソールでpostMessageログを確認

3. **キャラクターが表示されない**
   - Spineファイル（.json/.atlas/.png）が全て存在するか確認
   - ファイルパスが正しいか確認
   - WebGLがブラウザでサポートされているか確認

### デバッグコマンド

**ブラウザコンソールで実行**:
```javascript
// Spine統合状況確認
app.spineCharacterManager.iframeSpineBridge.getDebugInfo()

// iframe内Spine状況確認（iframe内で実行）
window.iframeSpineLoader

// テスト用Spine統合実行（テストページで実行）
window.testSpineIntegration()
```

## 📈 次のPhaseへの準備

Phase 2では以下の実装を予定:
1. 実際のSpineファイルでの動作テスト
2. アニメーション制御機能
3. 高度な編集機能（複数アニメーション、ブレンドモード等）
4. パフォーマンス最適化
5. UIの改良（プログレスバー、詳細ステータス表示等）