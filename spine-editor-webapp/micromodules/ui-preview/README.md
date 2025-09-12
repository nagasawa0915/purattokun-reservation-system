# UI Preview Micromodule Group

## 概要
Spineアニメーションの表示・制御を行うマイクロモジュールグループ

## 責務
- Spineキャラクターの描画
- アニメーション再生制御
- Canvas・Viewport管理
- プレビュー表示設定

## 外部依存
- EventBus（モジュール間通信）のみ
- StableSpineRenderer（内部統合）

## 内部構成
- `PreviewModule.js` - メインモジュール（外部API）
- `SpineRenderer.js` - Spine描画エンジン
- `CanvasController.js` - Canvas制御
- `ViewportManager.js` - 表示領域管理
- `AnimationController.js` - アニメーション制御

## 使用方法
```javascript
import PreviewModule from './micromodules/ui-preview/PreviewModule.js';

const preview = new PreviewModule({
    container: document.querySelector('.panel-preview .panel-content'),
    eventBus: globalEventBus
});

// キャラクター表示
await preview.loadCharacter('/path/to/character.json');

// アニメーション再生
preview.playAnimation('idle', { loop: true });
```

## イベント
- `characterLoaded` - キャラクター読み込み完了
- `animationStarted` - アニメーション開始
- `animationEnded` - アニメーション終了
- `canvasResized` - Canvas サイズ変更