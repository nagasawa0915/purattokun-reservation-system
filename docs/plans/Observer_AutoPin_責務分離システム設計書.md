# Observer+AutoPin責務分離システム 設計書・実装プラン

**作成日**: 2025-09-08  
**目的**: 現在のPureBoundingBoxAutoPin(710行)の複雑化問題を、責務分離により根本的に解決

---

## 1. 🎯 システム概要

### 現在の問題
- **PureBoundingBoxAutoPin**: 710行の複雑モジュール
- **95%座標混入問題**: ウィンドウリサイズ時のBB比率変動が未解決
- **複雑化**: 選択UI + 座標計算 + 保存システムが混在

### 新システムアプローチ
**責務分離による根本的解決**: 
```
PureBoundingBoxAutoPin → 「選択UI専用」に特化（軽量化）
         ↓
    PinContract（契約情報）
         ↓  
Observer → 「正規化・座標計算専用」に特化（高精度）
         ↓
    Spine配置システム
```

---

## 2. 🔧 責務分離設計

### 2.1 AutoPin（選択UI特化）
**やること:**
- ✅ クリック/右クリック/ドラッグで基準要素決定
- ✅ アンカー種類（block/inline/marker）と9アンカー選択
- ✅ 論理座標での基準点保存
- ✅ PinContract生成・Observerへ渡し

**やらないこと:**
- ❌ スケール・px値の固定保存（リサイズで破綻するため）
- ❌ transform: scale()等の見た目調整（Observerに一元化）
- ❌ 複雑な座標計算（Observerの専門領域）

### 2.2 Observer（正規化・計算特化）
**やること:**
- ✅ PinContractを受信・解釈
- ✅ ResizeObserver + MutationObserver + window resize監視
- ✅ object-fit/position完全対応
- ✅ DPR/ズーム補正
- ✅ rAFスロットリング（1フレーム1回更新）
- ✅ 論理座標→実ピクセル変換・Spine配置データ出力

**出力保証:**
- ✅ CSS pxベース統一出力
- ✅ ±0.5px以内の精度
- ✅ content-box基準での正規化

---

## 3. 📋 技術仕様

### 3.1 PinContract（契約情報）
```typescript
type AnchorKind = "block" | "text-start" | "text-end" | "text-center" | "marker";
type ScaleMode = "element-linked" | "fixed-size" | "typography";

type PinContract = {
  refElement: HTMLElement;          // 基準要素（img/div/h2/span等）
  logicalSize: { w: number; h: number }; // 論理座標（例:600×400）
  anchorKind: AnchorKind;           // 取り方指定
  at?: { x: number; y: number };    // 論理座標上の狙い点
  align?: "LT"|"TC"|"RT"|"LC"|"CC"|"RC"|"LB"|"BC"|"RB"; // 9アンカー（Block用）
  fit?: "contain"|"cover"|"fill"|"none"; // object-fit相当
  objectPosition?: string;          // "50% 50%" 等
  scaleMode: ScaleMode;             // スケール基準
  baseFontPx?: number;              // typography用基準フォント
  fixedSize?: { width: number; height: number }; // 固定サイズ用
};
```

### 3.2 要素別最適化UI仕様（🆕 2025-09-10追加）

#### 3.2.1 画像要素（IMG）専用UI
```
配置オプション:
• element-linked: 画像リサイズに連動してSpine要素もスケール
• fixed-size: 固定サイズでSpine要素を維持
• 9アンカーポイント選択（LT/TC/RT/LC/CC/RC/LB/BC/RB）

使用例: 画像が200px→400px(2倍)時、element-linkedでSpine要素も2倍スケール
```

#### 3.2.2 テキスト要素（H1-H6, P, SPAN）専用UI
```
配置オプション:
• text-start: テキストの先頭位置（最初の文字の前）
• text-end: テキストの末尾位置（Range API + getClientRects()使用）
• text-center: テキストの中央位置
• typography: フォントサイズ変更連動スケール

Range API実装: 最終行・最終グリフの画素レベル精密取得
改行対応: ウィンドウリサイズ時の改行位置変更自動追従
```

#### 3.2.3 リスト要素（LI）専用UI  
```
配置オプション:
• marker: リストマーカー位置（• 1. など箇条書き記号位置）
• text-start: リストテキストの先頭位置
• text-end: リストテキストの末尾位置

配置例:
🎯    • 項目1    ← marker位置
      🎯項目1    ← text-start位置  
      項目1🎯    ← text-end位置
```

#### 3.2.4 その他要素（DIV, BUTTON等）汎用UI
```
要素内容による自動判定:
• テキスト含有 → テキスト要素UI表示
• 画像含有 → 画像要素UI表示  
• 混在 → Block + 9アンカー + スケールオプション
```

### 3.3 Observer API
```typescript
export interface ObserveTarget {
  element: HTMLElement;
  logicalSize: LogicalSize;
  anchors?: Record<string, Anchor>;
  fit?: FitMode;
  box?: BoxMode;
  onUpdate: (u: UpdatePayload) => void;
}

export interface UpdatePayload {
  scaleX: number; scaleY: number;   // 論理→実の倍率
  offsetX: number; offsetY: number; // コンテナ原点からのオフセット
  width: number; height: number;    // content実寸（px）
  dpr: number;                      // devicePixelRatio
  resolve(anchor: Anchor): { x: number; y: number }; // 実px座標変換
}

export function register(target: ObserveTarget): Unregister;
```

---

## 4. 📋 ユーザーフロー仕様（2025-09-10追加）

### 4.1 実際の操作手順（9アンカー廃止・シンプル化）

#### 完全なユーザーフロー
```
1. キャラクター選択
2. BB（バウンディングボックス）表示 
3. BBを右クリック → コンテキストメニュー表示
4. 「要素選択」メニューをクリック
5. 要素選択モード開始（ページ全体でハイライト表示）
6. 目的の画像・テキスト・エリアをクリックして選択
7. ↓ AutoPin選択UI が表示 ↓
8. 要素タイプとスケール基準を選択
9. 「この設定でBB配置開始」ボタンをクリック  
10. BBが選択要素付近に移動（初期配置）
11. BBをドラッグして希望の場所に配置
12. リサイズハンドルで微調整
13. 完了
```

### 4.2 AutoPin選択UIの新仕様

#### 4.2.1 UI構成（9アンカー完全廃止）
```
🎯 選択した要素を基準にします

📍 基準要素: 「[要素タイプ] - [要素識別情報]」
     例: 「画像 - hero-image」
     例: 「見出し - サービス概要」
     例: 「段落 - 説明文の一部...」

⚖️ サイズ基準を選んでください:
   ○ この要素のサイズと連動 (おすすめ)
   ○ 文字サイズと連動 (テキスト要素の場合)
   ○ 固定サイズ

📏 基準フォントサイズ: [スライダー] 16px
     (「文字サイズと連動」選択時のみ表示)

[キャンセル] [この設定でBB配置開始]
```

#### 4.2.2 要素タイプ別の最適化
- **テキスト要素**: フォントサイズ連動がデフォルト選択
- **画像要素**: 要素サイズ連動がデフォルト選択
- **エリア要素**: 要素サイズ連動がデフォルト選択

### 4.3 設計思想の変更点

#### 4.3.1 9アンカー廃止の理由
1. **役割の明確化**: AutoPinの目的は「基準要素の選択」であり「細かい位置決め」ではない
2. **作業効率**: 細かい位置調整はBB編集で行うため、AutoPinでは不要
3. **UI簡素化**: 9個の選択肢→3個の選択肢に大幅削減
4. **学習コスト削減**: 「LT, TC, RT...」などの専門用語を排除

#### 4.3.2 新しい責務分担
```
AutoPin選択UI:
- 基準要素の確定
- スケール基準の設定  
- 初期配置（要素付近への大まかな配置）

BB編集システム:
- 正確な位置決定（ドラッグ移動）
- サイズ調整（リサイズハンドル）
- ピクセル単位での微調整
```

### 4.4 実装上の変更点

#### 4.4.1 削除される機能
- **9アンカーグリッド選択UI** → 完全廃止
- **複雑なアンカー選択** → シンプルな要素基準設定のみ
- **初期位置の精密指定** → 要素付近への大まかな配置のみ

#### 4.4.2 新規追加される機能  
- **要素ハイライト表示** → 選択モード時の視覚的フィードバック
- **要素情報表示** → 選択した要素の分かりやすい表示
- **スケール基準選択** → typography/element-linked/fixed-sizeの明確な説明

#### 4.4.3 期待される効果
- **UI操作時間**: 従来の50%以下に短縮
- **学習コスト**: 専門用語削除により大幅削減  
- **作業効率**: BB編集との役割分担によるワークフロー最適化

---

## 5. 🚀 実装プラン（段階別）

### Phase 0: 基盤スパイク実装（🆕 微調整提案反映）
**目標**: 後工程の成功率を上げる2つの核心機能を先行確定

#### 4.0.1 resolveFittedContent単体実装・テスト
- **ファイル**: `micromodules/observer/utils/resolveFittedContent.js`
- **機能**: object-fit/position余白補正の完全実装
- **テスト**: contain/cover/fill/none × object-position 0/50/100%
- **重要性**: ここが外れると後工程が全部ブレる
- **工数**: 0.3日

#### 4.0.2 findContainer単体実装・テスト  
- **ファイル**: `micromodules/observer/utils/findContainer.js`
- **機能**: 原点コンテナ決定（最近接positioned祖先 or body）
- **テスト**: 複雑なネスト構造での正確な原点取得
- **重要性**: 座標計算の基準点決定
- **工数**: 0.2日

### Phase 1: 基盤システム構築
**目標**: Observer核心機能完成・基本テスト通過

#### 4.1.1 TypeScript型定義作成
- **ファイル**: `micromodules/observer/types.ts`
- **内容**: PinContract, AnchorKind, ObserveTarget, UpdatePayload
- **工数**: 0.5日

#### 4.1.2 Observer核心モジュール実装  
- **ファイル**: `micromodules/observer/AutoPinObserver.js`
- **機能**: register(), Phase 0成果物統合、rAFスロットリング
- **重点**: ResizeObserver/MutationObserver/window resize統合、DPR補正
- **工数**: 2日

#### 4.1.3 基本テスト環境構築
- **ファイル**: `test-observer-basic.html`
- **テスト内容**: 
  - 画像%幅・containで左右余白あり → 右下アンカー固定
  - ズーム50-200%・DPR1/2/3で±0.5px以内
- **工数**: 1日

#### 🎯 Phase 1 DoD（完了条件・明文化）
- [ ] **API完全性**: scaleX/scaleY/offsetX/offsetY/resolve()を正確に返す
- [ ] **環境対応**: DPR/ズーム・srcset/sizes・親transform:scale()で一貫動作
- [ ] **パフォーマンス**: rAFスロットリング（1フレーム1回）、イベント合流（RO/MO/resize/fonts）
- [ ] **カバレッジ**: contain/cover/fill/none + object-position(0/50/100%)完全対応

### Phase 2: AutoPin選択UI特化
**目標**: 既存AutoPin機能のシンプル化・Contract生成

#### 4.2.1 Contract仕様拡張（🆕 要素別最適化UI対応）
- **仕様確定**: `PinContract = { refElement, logicalSize, anchorKind, align?, fit, objectPosition, scaleMode, baseFontPx?, fixedSize? }`
- **新AnchorKind**: `text-start | text-end | text-center | marker` 追加
- **新ScaleMode**: `element-linked | fixed-size | typography` 統合
- **重要方針**: AutoPinは**数値保存ではなくContract保存**に徹する（比率破綻防止）
- **工数**: 0.3日（UI最適化分増加）

#### 4.2.2 AutoPin要素別最適化UI実装
- **ファイル**: `micromodules/autopin/AutoPinSelector.js`
- **機能**: 要素タイプ別UI自動生成、Range API統合、Contract生成
- **新機能**: 画像専用UI、テキスト専用UI、リスト専用UI、汎用UI
- **Range API統合**: text-end選択時の最終グリフ位置取得
- **目標行数**: 300行以内（要素別UI分増加、既存710行から大幅削減）
- **工数**: 2.0日（UI最適化・Range API統合）

#### 4.2.3 Contract変換システム
- **ファイル**: `micromodules/autopin/ContractGenerator.js`  
- **機能**: AutoPin選択結果 → PinContract変換
- **工数**: 0.5日

#### 🎯 Phase 2 DoD（完了条件・明文化）
- [ ] **Contract完全性**: 全必須フィールド（refElement, logicalSize, anchorKind, scaleMode）の生成
- [ ] **要素別UI**: 画像・テキスト・リスト・汎用UIの自動切り替え
- [ ] **Range API統合**: text-end選択時の最終グリフ位置精密取得
- [ ] **スケールモード**: element-linked/fixed-size/typography完全対応
- [ ] **数値非保存**: px値・比率の固定値保存を完全排除
- [ ] **軽量化**: 既存710行から300行以内への削減達成（機能向上込み）

### Phase 3: システム統合・総合テスト
**目標**: 責務分離システムの完全動作・既存問題解決確認

#### 4.3.1 Spine統合チェックリスト実装（🆕 微調整提案反映）
- **統合順序**: `state.update→state.apply→（ここでscale/pos）→updateWorldTransform()`
- **rootボーン確認**: スケールキー有無での上書き検証
- **Canvas/WebGL**: DPR設定と二重スケールの排除
- **工数**: 0.5日

#### 4.3.2 統合テスト環境構築
- **ファイル**: `test-observer-autopin-integration.html`
- **テスト内容**:
  - 見出しH2の右肩 → typography相対スケール
  - 段落末尾追従（スマホ改行位置変化対応）
  - サイドバー回り込みレイアウト追従
- **工数**: 0.8日

#### 4.3.3 95%座標混入問題解決確認
- **診断**: 新システムでの座標純度100%達成確認
- **比較**: 既存システムとの精度・パフォーマンス比較
- **回帰テスト**: 95%問題の再現ケースで完全解決確認
- **工数**: 0.2日

#### 🎯 Phase 3 DoD（完了条件・明文化）
- [ ] **Spine統合**: 正しい適用順序・rootボーン対応・DPR二重適用回避
- [ ] **最小テストマトリクス**: 単位系（%/px/vw/vh/em）×画像（contain/cover/fill/none）×レイアウト（親transform/ズーム/DPR）×テキスト（inline-end/typography）×変更系（srcset/フォント/回り込み）完全通過
- [ ] **精度保証**: ±0.5px以内の全テストケース通過
- [ ] **問題解決**: 95%座標混入→100%座標純度達成確認

---

## 5. 🧪 最小テスト項目（受け入れ基準）

### 5.1 精度テスト
- [ ] ズーム（50〜200%）・DPR（1/2/3）で±0.5px以内の誤差
- [ ] `img%幅`、背景`object-fit:contain/cover/fill`でズレなし
- [ ] 親`transform:scale()`適用時の正確な補正

### 5.2 動的対応テスト  
- [ ] `srcset/sizes`切替で1フレーム以内の正しい再配置
- [ ] CSS差し替え（レスポンシブ・ダークモード等）での追従
- [ ] フォント読み込み完了後の再計測

### 5.3 パフォーマンステスト
- [ ] 100要素監視で60fpsを維持
- [ ] ビューポート外要素の更新停止機能
- [ ] rAFスロットリング動作確認

---

## 6. 📂 ファイル構成（予定）

```
micromodules/
├── observer/
│   ├── types.ts                 # 型定義（PinContract等）
│   ├── Observer.js              # 核心モジュール（~500行）
│   └── utils/
│       ├── resolveFittedContent.js
│       ├── findContainer.js
│       └── getObjectPosition.js
├── autopin/
│   ├── AutoPinSelector.js       # 選択UI特化（~200行）
│   └── ContractGenerator.js     # Contract変換（~100行）
└── integration/
    └── ObserverAutoPinBridge.js # 統合制御（~150行）

test-observer-basic.html          # Observer基本テスト
test-observer-autopin-integration.html # 統合テスト
```

---

## 7. 🎯 既存システムとの関係

### 7.1 段階的移行戦略
1. **Phase 1-3**: 新システム並行開発・テスト
2. **Phase 4**: 既存システムとの比較・検証期間
3. **Phase 5**: 既存システムからの移行・統合

### 7.2 既存資産活用
- **PureBoundingBoxUI.js**: 右クリックメニュー部分を流用
- **test-bounding-box-autopin.html**: 比較テスト用として保持
- **localStorage永続化**: 新システムでも継承

---

## 8. 🚨 リスク・対策

### 8.1 技術リスク
- **object-fit計算複雑性**: 段階的実装・詳細テストで対応
- **ブラウザ差異**: Safari・Chrome・Firefox横断テスト実施
- **パフォーマンス**: 早期プロファイリング・最適化

### 8.2 移行リスク  
- **既存機能破綻**: 並行開発期間での十分な検証
- **ユーザー体験変化**: UI部分は最小限変更に抑制

---

## 9. 📅 開発スケジュール（🆕 微調整提案反映）

- **Phase 0**: 0.5日（基盤スパイク・成功率向上）
- **Phase 1**: 4日（基盤システム）
- **Phase 2**: 2日（AutoPin特化）  
- **Phase 3**: 1.5日（統合テスト）
- **予備**: 1日（調整・ドキュメント）
- **合計**: 9日

## 10. 🧩 すぐ使える最小統合コード（要素別最適化対応）

```javascript
// 受け取った Contract（AutoPin出力）
const contract = /* PinContract */;

// スケールモード別処理
function calculateScale(contract, scaleX, scaleY) {
  switch(contract.scaleMode) {
    case "typography":
      return currentFontPx(contract.refElement) / (contract.baseFontPx ?? 16);
    case "fixed-size":
      return 1.0; // 固定サイズ
    case "element-linked":
    default:
      return Math.min(scaleX, scaleY); // 要素リサイズ連動
  }
}

// アンカー位置取得（Range API対応）
function getAnchorPosition(contract) {
  switch(contract.anchorKind) {
    case "text-end":
      return getRangeAPILastGlyph(contract.refElement);
    case "text-start":
      return getRangeAPIFirstGlyph(contract.refElement);
    case "text-center":
      return getRangeAPITextCenter(contract.refElement);
    case "marker":
      return getListMarkerPosition(contract.refElement);
    case "block":
    default:
      return resolve(anchorFromAlign(contract.align));
  }
}

const unreg = observer.register({
  element: contract.refElement,
  logicalSize: contract.logicalSize,
  fit: contract.fit,
  onUpdate: ({ resolve, scaleX, scaleY }) => {
    const pin = getAnchorPosition(contract);
    const s = calculateScale(contract, scaleX, scaleY);

    state.update(dt);
    state.apply(skeleton);
    skeleton.scaleX = s; skeleton.scaleY = s;
    skeleton.x = pin.x;   skeleton.y = pin.y;
    skeleton.updateWorldTransform();
    renderer.draw(skeleton);
  }
});
```

---

**次のステップ**: この設計書・プランでご承認いただけましたら、Phase 1から実装開始いたします。