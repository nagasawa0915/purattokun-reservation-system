/**
 * Observer+AutoPin責務分離システム - TypeScript型定義
 * 
 * PinContract: AutoPin選択結果をObserverに渡す契約情報
 * - 数値ではなく「再現方法」を保存（リサイズ耐性）
 * - 論理座標・fit・position・scale基準を統一定義
 */

// =============================================================================
// Core Types - 基本型定義
// =============================================================================

/**
 * アンカー種類 - 要素のどの部分を基準とするか
 */
export type AnchorKind = 
  | "block"        // 要素枠（img/div/section等のblock要素）
  | "inline-end"   // テキスト行末（段落最終行の末尾）
  | "inline-start" // テキスト行頭（段落最初の行の開始）
  | "marker";      // マーカー位置（不可視<span data-anchor>等）

/**
 * 9アンカーポイント - 要素枠内のどこに結ぶか
 * 
 * LT -- TC -- RT
 * |     |     |
 * LC -- CC -- RC  
 * |     |     |
 * LB -- BC -- RB
 */
export type AlignAnchor = 
  | "LT" | "TC" | "RT"  // Top: Left, Center, Right
  | "LC" | "CC" | "RC"  // Center: Left, Center, Right  
  | "LB" | "BC" | "RB"; // Bottom: Left, Center, Right

/**
 * object-fit 相当の配置モード
 */
export type FitMode = 
  | "contain"  // アスペクト比保持・要素内完全収納（余白発生）
  | "cover"    // アスペクト比保持・要素完全被覆（はみ出し発生）
  | "fill"     // アスペクト比無視・要素サイズに変形
  | "none";    // 元サイズで配置

/**
 * ボックスモード - どの境界を基準とするか
 */
export type BoxMode = 
  | "content-box"  // paddingを除いた中身領域（デフォルト）
  | "padding-box"  // paddingを含む領域
  | "border-box";  // borderを含む領域

/**
 * スケールモード - 拡大縮小の基準
 */
export type ScaleMode = 
  | "container"    // コンテナサイズ基準（画像・背景等）
  | "typography"; // フォントサイズ基準（テキスト相対）

/**
 * 論理サイズ - viewBox的な仮想座標系
 */
export interface LogicalSize {
  w: number;  // 論理幅（例: 600）
  h: number;  // 論理高さ（例: 400）
}

/**
 * アンカー座標 - 論理座標系での点
 */
export interface Anchor {
  x: number;  // 論理X座標
  y: number;  // 論理Y座標
}

// =============================================================================
// Contract Types - AutoPin ⟷ Observer 間の契約
// =============================================================================

/**
 * PinContract - AutoPinからObserverに渡す契約情報
 * 
 * 重要: 数値（px/比率）は保存せず、「再現方法」のみ保存
 * これによりリサイズ・ズーム・DPR変化に完全対応
 */
export interface PinContract {
  // 必須フィールド
  refElement: HTMLElement;     // 基準要素（img/div/h2/span等）
  logicalSize: LogicalSize;    // 論理座標系サイズ（例: 600×400）
  anchorKind: AnchorKind;      // 取り方指定
  
  // アンカー指定（どちらか必須）
  at?: Anchor;                 // 論理座標での狙い点（椅子の中心等）
  align?: AlignAnchor;         // 9アンカーでの指定
  
  // 配置・スタイル指定
  fit?: FitMode;               // object-fit相当（デフォルト: "contain"）
  objectPosition?: string;     // object-position値（例: "50% 50%"）
  box?: BoxMode;               // ボックス基準（デフォルト: "content-box"）
  
  // スケール指定
  scaleMode?: ScaleMode;       // スケール基準（デフォルト: "container"）
  baseFontPx?: number;         // typography用基準フォントサイズ
}

// =============================================================================
// Observer Types - Observer側の型定義
// =============================================================================

/**
 * 監視対象設定
 */
export interface ObserveTarget {
  element: HTMLElement;                    // 監視要素
  logicalSize: LogicalSize;                // 論理サイズ
  anchors?: Record<string, Anchor>;        // 名前付きアンカー（任意）
  fit?: FitMode;                          // 配置モード
  box?: BoxMode;                          // ボックスモード
  onUpdate: (payload: UpdatePayload) => void; // 更新コールバック
}

/**
 * 更新ペイロード - Observer からコールバックに渡される情報
 */
export interface UpdatePayload {
  // スケール・オフセット情報
  scaleX: number;    // 論理→実の倍率X
  scaleY: number;    // 論理→実の倍率Y  
  offsetX: number;   // コンテナ原点からのオフセットX（px）
  offsetY: number;   // コンテナ原点からのオフセットY（px）
  
  // サイズ・環境情報
  width: number;     // content実寸幅（px）
  height: number;    // content実寸高さ（px）
  dpr: number;       // devicePixelRatio
  
  // 座標変換関数
  resolve(anchor: Anchor): { x: number; y: number }; // 論理→実px座標変換
}

/**
 * 監視解除関数型
 */
export type Unregister = () => void;

// =============================================================================
// Utility Types - 内部実装用
// =============================================================================

/**
 * フィット計算結果
 */
export interface FittedContentResult {
  contentW: number;  // content領域幅
  contentH: number;  // content領域高さ  
  padX: number;      // 水平パディング
  padY: number;      // 垂直パディング
}

/**
 * 座標系診断情報
 */
export interface CoordinateDiagnosis {
  element: {
    path: string;
    position: string;
    rect: DOMRect;
  };
  container: {
    path: string;
    position: string;
    rect: DOMRect;
  };
  offset: {
    x: number;
    y: number;
  };
}

/**
 * ネスト構造テスト結果
 */
export interface NestedContainerTestResult {
  hierarchyChain: Array<{
    element: HTMLElement;
    tagName: string;
    id: string | null;
    className: string | null;
    position: string;
    isPositioned: boolean;
    rect: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  selectedContainer: HTMLElement;
  totalLevels: number;
}

// =============================================================================
// Configuration Types - 設定・構成用
// =============================================================================

/**
 * Observer設定
 */
export interface ObserverConfig {
  // パフォーマンス設定
  throttleMs?: number;           // スロットリング間隔（ms）
  maxElements?: number;          // 最大監視要素数
  
  // 精度設定
  snapToPixel?: boolean;         // ピクセルスナップ有効化
  tolerance?: number;            // 計算許容誤差（px）
  
  // デバッグ設定
  debugMode?: boolean;           // デバッグログ有効化
  logPerformance?: boolean;      // パフォーマンス計測ログ
}

/**
 * JSON設定用のPinContract（シリアライズ対応）
 */
export interface PinContractConfig {
  elementSelector: string;       // 要素セレクタ（例: "#heroImage"）
  logicalSize: LogicalSize;
  anchorKind: AnchorKind;
  at?: Anchor;
  align?: AlignAnchor;
  fit?: FitMode;
  objectPosition?: string;
  box?: BoxMode;
  scaleMode?: ScaleMode;
  baseFontPx?: number;
}

// =============================================================================
// Event Types - イベント・コールバック用
// =============================================================================

/**
 * Observer内部イベント型
 */
export type ObserverEvent = 
  | "element-added"
  | "element-removed"  
  | "update-triggered"
  | "error-occurred";

/**
 * エラーイベントペイロード
 */
export interface ObserverErrorPayload {
  type: "calculation-error" | "element-error" | "performance-warning";
  element: HTMLElement;
  message: string;
  details?: any;
}

// =============================================================================
// Export Helpers - 便利関数用型
// =============================================================================

/**
 * アンカー変換関数の結果型
 */
export interface AnchorConversionResult {
  anchor: Anchor;
  source: "align" | "at" | "computed";
}

/**
 * フォントサイズ取得結果
 */
export interface FontSizeResult {
  fontSize: number;
  unit: "px" | "em" | "rem" | "%";
  computedPx: number;
}