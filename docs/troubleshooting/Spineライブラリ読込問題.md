---
title: Spineライブラリ読込問題
status: 解決済み
tags: [Spine, ライブラリ, エラー, 初期化]
aliases: 
  - spine undefined
  - ライブラリエラー
  - CDN読込失敗
  - Spine WebGL読み込めない
  - spine is undefined
created: 2025-01-26
updated: 2025-01-26
---

# 🎯 Spineライブラリ読込問題

## 📊 現在の状況
**ステータス**: 解決済み（複数の確実な診断・解決方法を確立）

## ⚡ 有効な解決策・回避策

### 解決策1: Spine読み込み状態の確認
```javascript
// F12でコンソールを開いて実行
console.log('Spine状態確認:');
console.log('- spine定義:', typeof spine);
console.log('- AssetManager:', typeof spine?.AssetManager);
console.log('- WebGL対応:', !!document.querySelector('canvas').getContext('webgl'));
```

### 解決策2: フォールバック画像への切り替え
```javascript
// Spine失敗時の緊急対応
const canvas = document.getElementById('purattokun-canvas');
const fallback = document.getElementById('purattokun-fallback');

if (canvas && fallback) {
    canvas.style.display = 'none';
    fallback.style.display = 'block';
    console.log('✅ フォールバック画像に切り替え完了');
}
```

### 解決策3: Spine初期化の強制再実行
```javascript
// Spine初期化の手動実行
if (typeof initSpineCharacter === 'function') {
    initSpineCharacter().catch(error => {
        console.error('Spine初期化失敗:', error);
        // フォールバック画像に切り替え
        document.getElementById('purattokun-canvas').style.display = 'none';
        document.getElementById('purattokun-fallback').style.display = 'block';
    });
}
```

## 🔍 問題の詳細

### 発生条件
- ページ読み込み時にSpine WebGLライブラリが読み込まれない
- CDNからのライブラリ取得に失敗
- WebGLがブラウザでサポートされていない
- アセットファイル（.atlas, .json）の読み込み失敗

### 症状パターン
1. **ライブラリ未定義**: `spine is undefined` エラー
2. **WebGL非対応**: WebGLコンテキスト取得失敗
3. **アセット読み込み失敗**: 404エラーでファイルが見つからない
4. **初期化タイムアウト**: 読み込み完了を待機中にタイムアウト

### 環境情報
- 対象ブラウザ: Chrome, Firefox, Safari（WebGL対応必須）
- CDN: https://unpkg.com/@esotericsoftware/spine-webgl@4.1.23/
- 必要ファイル: purattokun.atlas, purattokun.json, purattokun.png

## 📝 試行錯誤の履歴

### ✅ Case #1: 2025-01-26 - ライブラリ読み込み確認システムの確立

**問題**: Spineライブラリが読み込まれているかわからない
**試した方法**: 
```javascript
// 読み込み状態確認スクリプト
function waitForSpine() {
    if (typeof spine !== 'undefined' && spine.AssetManager) {
        console.log('✅ Spine読み込み完了');
        initSpineCharacter();
    } else {
        console.log('⏳ Spine読み込み中... (spine:', typeof spine, ')');
        setTimeout(waitForSpine, 200);
    }
}
```
**結果**: ✅ 完全に解決
**原因推測**: Spineライブラリの読み込み完了タイミングが不定期
**学び**: ポーリングによる読み込み完了確認が確実
**環境**: Chrome 120, Firefox 119, localhost:8000

### ✅ Case #2: 2025-01-26 - WebGL対応チェック機能

**問題**: ブラウザのWebGL対応状況が不明
**試した方法**: 
```javascript
// WebGL対応確認
const canvas = document.getElementById('purattokun-canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

if (!gl) {
    console.error('❌ WebGL非対応ブラウザ');
    // フォールバック画像に切り替え
    document.getElementById('purattokun-fallback').style.display = 'block';
} else {
    console.log('✅ WebGL対応確認');
}
```
**結果**: ✅ 完全に解決
**原因推測**: 古いブラウザや設定でWebGLが無効化されている場合がある
**学び**: WebGL対応チェックとフォールバック処理が重要
**環境**: 全ブラウザで検証済み

### ❌ Case #3: 2025-01-26 - CDNバージョンの変更試行

**問題**: Spine WebGL CDNの特定バージョンで読み込み失敗
**試した方法**: 
```html
<!-- 異なるバージョンを試行 -->
<script src="https://unpkg.com/@esotericsoftware/spine-webgl@4.1.*/dist/iife/spine-webgl.js"></script>
<script src="https://unpkg.com/@esotericsoftware/spine-webgl@4.1.23/dist/iife/spine-webgl.js"></script>
<script src="https://unpkg.com/@esotericsoftware/spine-webgl@4.0.*/dist/iife/spine-webgl.js"></script>
```
**結果**: ❌ 効果なし（バージョンは問題ではなかった）
**原因推測**: バージョンではなく、ネットワークやタイミングの問題
**学び**: バージョン変更よりも読み込み確認機能の方が重要
**環境**: Chrome 120, localhost:8000

### ⚠️ Case #4: 2025-01-26 - アセットファイルパスの確認

**問題**: Spineアセット読み込み時に404エラー
**試した方法**: 
ファイル存在確認とパス修正
```javascript
// ベースパス確認
const basePath = 'assets/spine/characters/purattokun/';
console.log('📁 ベースパス:', basePath);

// ファイル存在確認
fetch(basePath + 'purattokun.atlas')
    .then(response => {
        if (response.ok) {
            console.log('✅ Atlas file found');
        } else {
            console.error('❌ Atlas file not found');
        }
    });
```
**結果**: ⚠️ 部分的効果（ファイル存在は確認、読み込みは別問題）
**原因推測**: ファイルは存在するが、CORS設定やサーバー設定の問題
**学び**: ファイル存在とアクセス可能性は別問題
**環境**: localhost:8000, python server.py使用

### ✅ Case #5: 2025-01-26 - 初期化エラーハンドリングの強化

**問題**: Spine初期化失敗時にフォールバック処理が動作しない
**試した方法**: 
```javascript
async function initSpineCharacter() {
    try {
        // Spine初期化処理
        // ... 省略 ...
    } catch (error) {
        console.error('❌ Spine初期化失敗:', error);
        
        // フォールバック画像に切り替え
        const canvas = document.getElementById('purattokun-canvas');
        const fallback = document.getElementById('purattokun-fallback');
        
        if (canvas && fallback) {
            canvas.style.display = 'none';
            fallback.style.display = 'block';
            console.log('✅ フォールバック画像に切り替え');
        }
    }
}
```
**結果**: ✅ 完全に解決
**原因推測**: try-catch でエラーをキャッチしてフォールバック処理が確実に実行
**学び**: エラーハンドリングとフォールバック処理の重要性
**環境**: 全ブラウザで安定動作確認

### ✅ Case #6: 2025-08-28 - PureSpineLoader WebGL検証条件修正による完全解決

**問題**: 「Spine WebGLライブラリが読み込まれていません」エラーでぷらっとくんが表示されない
**症状**: ローカルspine-webgl.jsファイル使用時にライブラリ読み込み検証が失敗
**試した方法**:
```javascript
// 修正前（誤った検証条件）
if (!window.spine || !spine.webgl) {
    console.error('❌ Spine WebGLライブラリが読み込まれていません');
    return false;
}

// 修正後（正しい検証条件）
if (!window.spine || !spine.AssetManager || !spine.SkeletonRenderer || 
    !spine.PolygonBatcher || !spine.Skeleton || !spine.AnimationState || 
    !spine.AtlasAttachmentLoader) {
    console.error('❌ Spine WebGLライブラリが読み込まれていません');
    return false;
}
```
**結果**: ✅ 完全に解決（ぷらっとくんが正常な黒いキャラクターで表示）
**根本原因**: 
- ローカルspine-webgl.jsは `spine.webgl` オブジェクトを作成しない構造
- 実際には `spine` オブジェクトに直接クラス群（AssetManager等）が含まれる
- CDN版とローカル版でオブジェクト構造が異なる

**技術詳細**:
- **検証すべきクラス**: AssetManager, SkeletonRenderer, PolygonBatcher, Skeleton, AnimationState, AtlasAttachmentLoader
- **診断関数との統一**: `checkSpineWebGLAvailability()` と PureSpineLoader の検証条件を統一
- **対象ファイル**: `micromodules/spine-loader/PureSpineLoader.js`

**学び**: 
- ライブラリの実装詳細に依存しない汎用的な検証が重要
- CDN版とローカル版の構造差異を考慮した実装が必要
- 診断システムとローダーシステムの検証条件統一が効果的

**環境**: test-element-observer-bb-integration.html, Chrome, python server.py, ローカルspine-webgl.js