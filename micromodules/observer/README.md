# AutoPinObserver - 責務分離システム

**作成日**: 2025-09-08  
**目的**: 座標混入問題解決用Observer（責務分離システム）

## 🎯 このシステムの役割

**AutoPin（選択UI） → Observer（座標計算特化）の責務分離アーキテクチャ**

- **AutoPinObserver.js**: PinContractを受信し、ResizeObserver監視・座標計算に特化
- **用途**: 95%座標混入問題の根本解決
- **設計思想**: UIと座標計算の完全分離による高精度・軽量化実現

## 🔧 主要機能

- ✅ PinContract受信・解釈
- ✅ ResizeObserver + MutationObserver + window resize監視
- ✅ object-fit/position完全対応
- ✅ DPR/ズーム補正
- ✅ rAFスロットリング（1フレーム1回更新）
- ✅ 論理座標→実ピクセル変換・Spine配置データ出力

## 📋 API

```javascript
import { register } from './micromodules/observer/AutoPinObserver.js';

const unreg = register({
  element: HTMLElement,
  logicalSize: { w: number, h: number },
  onUpdate: ({ resolve, scaleX, scaleY, dpr }) => {
    // 座標更新処理
  }
});
```

## 🚨 重要

- **他のObserverシステムとは用途が異なります**
- **レガシーElementObserverとは併用禁止**
- **AutoPinSelectorと組み合わせて使用**

## 関連ファイル

- `utils/resolveFittedContent.js` - object-fit計算
- `utils/findContainer.js` - 原点コンテナ決定
- `../autopin/AutoPinSelector.js` - UI選択システム
- `../autopin/ContractGenerator.js` - Contract生成