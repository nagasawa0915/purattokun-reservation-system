# ElementObserver Phase 3-B要件定義書：マイクロモジュール分割システム

**正式名称**: ElementObserver Phase 3-B Micromodule System  
**策定日**: 2025-08-28  
**更新日**: 2025-08-29 - マイクロモジュール分割仕様に更新  
**バージョン**: Phase 3-B 要件定義 v2.0 - マイクロモジュール分割版

---

## 🚨 重要: マイクロモジュール分割設計への変更

**変更理由**: 統合仕様はマイクロモジュール設計原則に違反（複数責務混在・単独テスト困難）  
**新方針**: 4つの純粋なマイクロモジュール分割による実装  
**詳細設計**: [📋 マイクロモジュール分割設計書](./ELEMENT_OBSERVER_PHASE3B_MICROMODULE_DESIGN.md)

## 1. 目的（マイクロモジュール分割版）

DOM・CSS・WebGL の環境差異を4つの専門モジュールで分担処理し、単一責務・完全独立・単独テスト可能な次世代システムを提供する。

### 用語補足
- **DPR** = Device Pixel Ratio。高解像度ディスプレイの倍率。
- **矩形（くけい）** = x, y, width, height（必要に応じ centerX, centerY）。

---

## 2. マイクロモジュール分割構成

### 🏗️ 4つの専門モジュール

#### **1️⃣ PureEnvironmentObserver**
- **責務**: 環境変化の監視のみ
- **対象**: DOM要素・テキスト範囲の矩形監視
- **出力**: 位置・サイズ・DPR・タイムスタンプ

#### **2️⃣ PureScaleCalculator**  
- **責務**: スケール値計算のみ
- **対象**: 5つのスケールモード（fixed/proportional/fontSize/imageSize/custom）
- **出力**: スケール値・比率・モード情報

#### **3️⃣ PurePinHighlighter**
- **責務**: 要素ハイライト表示のみ  
- **対象**: F12風バウンディングボックス表示・ピン設定UI
- **出力**: オーバーレイ要素・クリーンアップ関数

#### **4️⃣ PinSystemIntegrator**
- **責務**: 上記3モジュールの統合制御のみ
- **対象**: モジュール間協調・数値のみ受け渡し
- **出力**: 統合結果・ElementObserver互換API

### 非対象（変更なし）
- Spineの描画・配置そのもの
- WebGL描画ループの実装  
- 画像ロード・フォントロード待機制御

---

## 3. 機能要件

### 3.1 監視対象の登録・解除
- 単一/複数の要素を登録可能（背景、画像、見出し末尾のspan等）
- `observe(target, options)` / `unobserve(target)` / `disconnect()`

### 3.2 取得する値
- **DOM座標系の矩形**：x, y, width, height（左上基準、Y下向き）
- **実ピクセルの矩形**（DPR補正後）：オプションで選択
- **任意の基準点**（center / top-left / bottom-right / ％指定アンカー）を同時に算出
- **変更イベントには前回との差分（delta）を含める**
- **🆕 スケール情報**：ピン対象要素のサイズに基づく比例スケール値を算出

### 3.3 変化検知と安定化
- **ResizeObserver＋getBoundingClientRect()** で変動を検知
- **requestAnimationFrame** で1フレームに集約してから通知
- **スロットリング**：同一値の連続通知を抑制（数値誤差の許容閾値＝デフォルト ±0.5px）

### 3.4 イベント
- **onChange(cb)**：変化した時のみ呼ぶ
- **onError(cb)**：対象が非表示/未マウント/サイズ0などの異常時に通知
- **onReady(cb)**：初回の安定値が取得できた時点で1度だけ通知

### 3.5 座標系・スケールオプション
出力座標とスケールの種類を指定可能：
- **mode**: `'dom'` | `'devicePixels'`（DPR補正なし / あり）
- **anchor**: `'center'` | `'tl'` | `'tr'` | `'bl'` | `'br'` | `{xPct:number,yPct:number}`
- **🆕 scaleMode**: `'fixed'` | `'proportional'` | `'fontSize'` | `'imageSize'` | `'custom'`
- **🆕 scaleOptions**: `{ baseScale: number, minScale?: number, maxScale?: number, scaleRatio?: number }`

### 3.6 テキスト対応
- テキスト終端や特定語を**Range**で指定して監視可能
- 内部で不可視span（`<span class="pin-anchor">`）を使う方式にも対応

---

## 4. 非機能要件

- **性能**：100要素監視で60fps維持（軽微な変動時）
- **安定性**：DPR変更、ズーム、DevTools開閉、リサイズでも値が破綻しない
- **再現性**：同レイアウト・同DPRで同一値を返す（誤差 ±0.5px 以内）
- **依存**：ブラウザ標準APIのみ（Polyfill不要／可能なら任意）
- **セキュリティ**：DOM読み取りのみ。外部I/Oなし

---

## 5. インターフェース（概要・擬似シグネチャ）

### 基本API
```javascript
createObserver(globalOptions?): ElementObserver

observer.observe(target: HTMLElement | Range, options?: {
    id?: string, 
    mode?: 'dom'|'devicePixels', 
    anchor?: AnchorSpec, 
    epsilon?: number,
    🆕 scaleMode?: 'fixed'|'proportional'|'fontSize'|'imageSize'|'custom',
    🆕 scaleOptions?: ScaleOptions
})

observer.unobserve(targetOrId)
observer.onChange((payload: RectPayload) => void)
observer.onReady((payload: RectPayload) => void)
observer.onError((err: ObserverError) => void)
observer.disconnect()
```

### RectPayload（出力例）
```javascript
{ 
    id, 
    targetType: 'element'|'range', 
    rect: { x, y, width, height }, 
    anchor: { x, y }, 
    🆕 scale: { value: number, mode: string, ratio?: number },
    mode, 
    dpr, 
    timestamp 
}
```

---

## 6. 振る舞い（ユースケース適用）

### 6.1 背景画像とSpineの同期
- 背景コンテナを observe
- 通知の rect と anchor を唯一の参照にして、Spineの座標を更新
- 背景が%で拡縮しても、Spineの立ち位置は一致

### 6.2 見出し文字の末尾にピン（🆕スケール連動）
- 見出しテキスト末尾を Range で指定して observe
- 改行・フォントサイズ変化で末尾位置が移動しても追従
- **🆕 フォントサイズ連動**: `scaleMode: 'fontSize'` でキャラクターサイズが文字サイズに比例
- Spineキャラの座標・スケールは Range の rect・scale に基づき自動調整

### 6.3 画像にピン（🆕サイズ連動）
- 画像要素を observe、anchor:'br'（右下）等で基準点を指定
- **🆕 画像サイズ連動**: `scaleMode: 'imageSize'` でキャラクターが画像サイズに比例拡縮
- 画像のレスポンシブ変形に対しキャラの位置・スケール両方が連動
- **用途例**: 画像上に立っているような表現・画像に対する比例サイズ表現

### 🆕 6.4 スケールモード詳細仕様

#### fixed（固定スケール）
- 常に `baseScale` 値を使用（デフォルト: 1.0）
- 要素サイズに関係なく一定サイズ

#### proportional（比例スケール）
- ピン対象の width または height に比例
- `scale = baseScale * (currentSize / referenceSize) * scaleRatio`
- レスポンシブ対応・コンテナサイズに完全追従

#### fontSize（フォントサイズ連動）
- テキスト要素の computed font-size に基づく
- `scale = baseScale * (currentFontSize / referenceFontSize) * scaleRatio`
- 見出し・本文のフォントサイズ変更に自動追従

#### imageSize（画像サイズ連動） 
- 画像の表示サイズ（width × height の面積）に基づく
- `scale = baseScale * sqrt(currentArea / referenceArea) * scaleRatio`
- 画像のアスペクト比保持リサイズに対応

#### custom（カスタム関数）
- ユーザー定義の計算ロジック
- `scale = customFunction(rect, element, options)`
- 複雑な条件・複数要素組み合わせに対応

---

## 7. 例外・エラー処理

- **サイズ0/非表示**：onError('ZeroSize')、値は更新せず最後の正常値を保持
- **ターゲット消失**：onError('Detached')、自動再アタッチはしない（再度 observe 必要）
- **極端なレイアウト揺れ**：内部で1フレームに集約、安定後に1回通知

---

## 8. 受入れ基準（Acceptance Criteria）

- **レスポンシブ**：%・aspect-ratio・リサイズで 背景とSpineの位置ズレが±1px以内
- **DPR/ズーム**：DPR変更/ブラウザズームで連続通知の嵐が起きず、安定値のみ通知
- **テキスト**：見出し末尾のピンが折返しで移動しても追従
- **性能**：100監視時にログ洪水なし、UI操作でカクつかない
- **一意性**：同じレイアウト・同設定で同じ矩形値を返す（誤差±0.5px）

---

## 9. 拡張（任意）

- **MutationObserver連携**：DOM構造変化時の自動再計測
- **Scroll同期**：スクロール量を含めた相対座標出力
- **座標変換ユーティリティ**：dom↔spine 変換のオプション提供

### 🆕 9.1 ピン設定UI機能（開発者ツール風インターフェース）

#### 要素選択ハイライトモード
- **マウスオーバーハイライト**: 要素上にマウスを置くと半透明の境界ボックス表示
- **要素情報表示**: tagName、class、size、位置情報をツールチップで表示
- **ピン配置プレビュー**: 選択中要素にピン予定位置をリアルタイム表示

#### 技術仕様
- **イベント処理**: throttled mouseover/mouseout (16ms間隔、60fps)
- **オーバーレイ描画**: fixed position、pointer-events: none
- **パフォーマンス**: CPU 1-2ms/event、メモリ 0.5KB/overlay
- **スタイル**: F12開発者ツール風のブルー系ハイライト（#007acc）

#### API拡張
```javascript
// ピン設定モード開始
observer.startPinSetupMode({
    highlightColor: '#007acc',
    showElementInfo: true,
    previewPinPosition: true
});

// 要素選択イベント
observer.onElementSelect((element, rect, previewData) => {
    // ピン設定UI表示
});

// ピン設定モード終了
observer.stopPinSetupMode();
```

---

## 10. 成果物（マイクロモジュール分割版）

### 必須成果物
1. **4つのマイクロモジュール**:
   - PureEnvironmentObserver.js（300-400行）
   - PureScaleCalculator.js（200-300行）
   - PurePinHighlighter.js（200-300行）
   - PinSystemIntegrator.js（300-400行）

2. **各モジュールのドキュメント**:
   - 各モジュール：README.md + SPEC.md
   - 統合利用ガイド・API仕様書

3. **デモ・テストシステム**:
   - 各モジュール単独テスト（.test()メソッド）
   - 統合動作デモ（画像ピン・テキストピン・背景追従）
   - パフォーマンステスト（DPR/ズーム/リサイズ）

4. **品質保証**:
   - 単独テスト100%成功
   - メモリリーク0件保証
   - cleanup()完全復元確認

---

## 🎯 Phase 3-B実装戦略（マイクロモジュール分割版）

### 既存Phase 3-Aとの統合
- **Phase 3-A成果活用**：99.9-100%高速化されたsetUnifiedPosition()をPinSystemIntegratorで統合
- **統合制御システム**：ElementObserverAdvanced.js との完全互換性
- **パフォーマンス保証**：0.01ms処理時間 + マイクロモジュールの軽量性

### マイクロモジュール実装順序
#### Phase 1: 基盤モジュール（1週間）
1. **PureEnvironmentObserver** - Phase 2実証技術活用
2. **PureScaleCalculator** - 純粋数値計算・独立実装

#### Phase 2: UI・統合（3日）
3. **PurePinHighlighter** - F12風ハイライト・DOM操作専門
4. **PinSystemIntegrator** - v3.0ハイブリッド統合制御

#### Phase 3: テスト・統合（2日）
- 各モジュール単独テスト・統合動作確認
- Phase 3-A互換性検証・パフォーマンステスト

### 期待される進化
**ElementObserver Phase 3-A（超高速化）+ Phase 3-B（4モジュール分割）= マイクロモジュール設計準拠の次世代統合システム**

---

**この要件であれば、環境（DOM/CSS/WebGL）の揺れを"観測モジュール1つ"に閉じ込め、各機能はその出力だけを参照する構成が実現できます。**

---

**策定者**: Claude Code  
**承認待ち**: Phase 3-B マイクロモジュール分割実装開始承認  
**詳細設計**: [📋 マイクロモジュール分割設計書](./ELEMENT_OBSERVER_PHASE3B_MICROMODULE_DESIGN.md)  
**関連文書**: 
- [ElementObserver Phase 3-A成功記録](./ELEMENT_OBSERVER_PHASE3A_SUCCESS.md)
- [ElementObserver Phase 2設計書](./ELEMENT_OBSERVER_PHASE2_DESIGN.md)
- [ElementObserver要件定義書](./ELEMENT_OBSERVER_REQUIREMENTS.md)
- [マイクロモジュール設計思想v3-ハイブリッド](./micromodules/マイクロモジュール設計思想v3-ハイブリッド.md)