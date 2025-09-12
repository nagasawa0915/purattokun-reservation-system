# UI Properties Micromodule Group

## 概要
キャラクターの位置・回転・スケール・アニメーション設定を管理するマイクロモジュールグループ

## 責務
- キャラクター位置・回転・スケール制御
- アニメーション設定・制御
- バウンディングボックス編集
- レイヤー管理・表示設定

## 外部依存
- EventBus（モジュール間通信）のみ
- PureBoundingBox（内部統合）

## 内部構成
- `PropertiesModule.js` - メインモジュール（外部API）
- `AnimationPanel.js` - アニメーション制御パネル
- `TransformPanel.js` - 位置・回転・スケールパネル  
- `BoundingBoxPanel.js` - バウンディングボックス編集
- `LayerPanel.js` - レイヤー管理パネル
- `PropertyValidator.js` - 入力値検証

## 使用方法
```javascript
import PropertiesModule from './micromodules/ui-properties/PropertiesModule.js';

const properties = new PropertiesModule({
    container: document.querySelector('.panel-properties .panel-content'),
    eventBus: globalEventBus
});

// キャラクター連携
properties.bindCharacter(spineCharacter);

// プロパティ変更
properties.setPosition({ x: 100, y: 200 });
properties.setScale({ x: 1.5, y: 1.5 });
```

## イベント
- `positionChanged` - 位置変更
- `scaleChanged` - スケール変更  
- `rotationChanged` - 回転変更
- `animationChanged` - アニメーション変更
- `boundingBoxUpdated` - バウンディングボックス更新