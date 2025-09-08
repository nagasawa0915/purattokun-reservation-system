# UI Outliner Micromodule Group

## 概要
SpineプロジェクトのファイルツリーとProject管理を行うマイクロモジュールグループ

## 責務
- Spineプロジェクトフォルダの読み込み
- .atlas/.json/.pngファイルの検出・解析  
- ファイルツリーUI表示・操作
- プロジェクト状態の永続化

## 外部依存
- EventBus（モジュール間通信）のみ

## 内部構成
- `OutlinerModule.js` - メインモジュール（外部API）
- `FileSystemManager.js` - ファイル/フォルダ操作
- `SpineProjectDetector.js` - Spineファイル検出
- `SpineAtlasParser.js` - .atlasファイル解析
- `SpineJsonParser.js` - .jsonファイル解析  
- `TreeViewBuilder.js` - HTMLツリーUI構築
- `ProjectStateManager.js` - 状態管理・永続化

## 使用方法
```javascript
import OutlinerModule from './micromodules/ui-outliner/OutlinerModule.js';

const outliner = new OutlinerModule({
    container: document.querySelector('.panel-outliner .panel-content'),
    eventBus: globalEventBus
});

// プロジェクト読み込み
await outliner.loadProject('/path/to/spine/project');

// イベント受信
outliner.on('fileSelected', (fileData) => {
    console.log('ファイル選択:', fileData);
});
```

## イベント
- `fileSelected` - ファイル選択時
- `characterSelected` - キャラクター選択時
- `animationSelected` - アニメーション選択時
- `projectLoaded` - プロジェクト読み込み完了
- `projectStateChanged` - プロジェクト状態変更