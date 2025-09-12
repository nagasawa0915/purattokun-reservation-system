# UI Timeline Micromodule

## 概要
Spineアニメーションのタイムライン表示・制御を行うマイクロモジュール

## 責務
- 複数キャラクターのアニメーションタイムライン表示
- トラック管理（追加・削除・並び替え）
- 再生制御（再生・一時停止・停止・シーク）
- アニメーションバーの表示・選択
- 時間ルーラーの表示

## 外部依存
- EventBus（モジュール間通信）のみ
- CSS Variables（ダークテーマ対応）

## 使用方法

```javascript
import TimelineModule from './micromodules/ui-timeline/TimelineModule.js';

const timeline = new TimelineModule({
    container: document.querySelector('.timeline-container'),
    eventBus: globalEventBus,
    config: {
        maxTime: 120,
        pixelsPerSecond: 10,
        trackHeight: 40
    }
});

// キャラクタートラック追加
timeline.addCharacterTrack({
    name: 'nezumi',
    trackData: {
        animations: [
            { name: 'idle', start: 0, duration: 30, color: '#4CAF50' },
            { name: 'walk', start: 30, duration: 15, color: '#FFC107' }
        ]
    }
});

// 再生制御
timeline.play();
timeline.setCurrentTime(45);
```

## 発行イベント
- `timeline:initialized` - 初期化完了
- `timeline:play` - 再生開始
- `timeline:pause` - 一時停止
- `timeline:stop` - 停止
- `timeline:timeChanged` - 再生位置変更
- `timeline:animationSelected` - アニメーション選択
- `timeline:trackAdded` - トラック追加
- `timeline:trackRemoved` - トラック削除

## 受信イベント
- `character:added` - キャラクター追加時のトラック自動作成
- `animation:played` - アニメーション再生時のハイライト

## API

### メソッド
- `play()` - 再生開始
- `pause()` - 一時停止
- `stop()` - 停止
- `setCurrentTime(time)` - 再生位置設定
- `addCharacterTrack(characterData)` - トラック追加
- `removeTrack(characterName)` - トラック削除
- `getCurrentTime()` - 現在時間取得
- `getDuration()` - 最大時間取得

### 設定オプション
- `maxTime`: 最大時間（秒）
- `pixelsPerSecond`: 1秒あたりのピクセル数
- `trackHeight`: トラックの高さ
- `trackSpacing`: トラック間のスペース

## ファイル構成
```
micromodules/ui-timeline/
├── TimelineModule.js     # メインモジュール
├── timeline-styles.css   # スタイルシート
└── README.md            # このファイル
```

## デザイン特徴
- 参考画像「Desktop - 1.png」のタイムライン デザインを再現
- ダークテーマ対応
- 複数キャラクターの並行表示
- アニメーションバーの色分け
- プロフェッショナルな外観

## 互換性
- モダンブラウザ（ES6+ 対応）
- イベントドリブン設計により他モジュールとの疎結合
- CSS Variables による柔軟なテーマ対応