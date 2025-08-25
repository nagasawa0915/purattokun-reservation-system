/**
 * 座標系変換ユーティリティ（純関数群）
 * DOM左上基準 ↔ Spine中央基準の相互変換
 * UIに依存せず、テスト可能な設計
 */

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Transform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

export interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/**
 * 座標系変換クラス（静的メソッドのみ）
 */
export class CoordinateUtils {
  /**
   * DOM座標（左上基準）からSpine座標（中央基準）に変換
   * @param domPoint DOM座標
   * @param canvasSize キャンバスサイズ
   * @returns Spine座標
   */
  static domToSpine(domPoint: Point, canvasSize: Size): Point {
    return {
      x: domPoint.x - canvasSize.width / 2,
      y: canvasSize.height / 2 - domPoint.y, // Y軸反転
    };
  }

  /**
   * Spine座標（中央基準）からDOM座標（左上基準）に変換
   * @param spinePoint Spine座標
   * @param canvasSize キャンバスサイズ
   * @returns DOM座標
   */
  static spineToDom(spinePoint: Point, canvasSize: Size): Point {
    return {
      x: spinePoint.x + canvasSize.width / 2,
      y: canvasSize.height / 2 - spinePoint.y, // Y軸反転
    };
  }

  /**
   * DPR（Device Pixel Ratio）を考慮した座標変換
   * @param cssPoint CSSピクセル座標
   * @param dpr Device Pixel Ratio
   * @returns 物理ピクセル座標
   */
  static cssToPhysical(cssPoint: Point, dpr: number = window.devicePixelRatio || 1): Point {
    return {
      x: cssPoint.x * dpr,
      y: cssPoint.y * dpr,
    };
  }

  /**
   * 物理ピクセルからCSSピクセルに変換
   * @param physicalPoint 物理ピクセル座標
   * @param dpr Device Pixel Ratio
   * @returns CSSピクセル座標
   */
  static physicalToCss(physicalPoint: Point, dpr: number = window.devicePixelRatio || 1): Point {
    return {
      x: physicalPoint.x / dpr,
      y: physicalPoint.y / dpr,
    };
  }

  /**
   * グリッドスナップ
   * @param point スナップ前の座標
   * @param gridSize グリッドサイズ
   * @returns スナップ後の座標
   */
  static snapToGrid(point: Point, gridSize: number): Point {
    if (gridSize <= 0) return point;
    
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    };
  }

  /**
   * 中央スナップ（キャンバス中央への吸着）
   * @param point スナップ前の座標
   * @param canvasSize キャンバスサイズ
   * @param threshold スナップ有効範囲（ピクセル）
   * @returns スナップ後の座標
   */
  static snapToCenter(point: Point, canvasSize: Size, threshold: number = 10): Point {
    const center = {
      x: canvasSize.width / 2,
      y: canvasSize.height / 2,
    };

    const result = { ...point };
    
    // X軸中央スナップ
    if (Math.abs(point.x - center.x) <= threshold) {
      result.x = center.x;
    }
    
    // Y軸中央スナップ
    if (Math.abs(point.y - center.y) <= threshold) {
      result.y = center.y;
    }

    return result;
  }

  /**
   * 回転を考慮したバウンディングボックス計算
   * @param transform 変換情報
   * @param originalSize 元のサイズ
   * @returns 回転後のバウンディングボックス
   */
  static getRotatedBounds(transform: Transform, originalSize: Size): Bounds {
    const { x, y, scaleX, scaleY, rotation } = transform;
    const radians = (rotation * Math.PI) / 180;
    
    // スケール適用後のサイズ
    const scaledWidth = originalSize.width * Math.abs(scaleX);
    const scaledHeight = originalSize.height * Math.abs(scaleY);
    
    // 回転後の4つの頂点を計算
    const halfWidth = scaledWidth / 2;
    const halfHeight = scaledHeight / 2;
    
    const corners = [
      { x: -halfWidth, y: -halfHeight },
      { x: halfWidth, y: -halfHeight },
      { x: halfWidth, y: halfHeight },
      { x: -halfWidth, y: halfHeight },
    ];
    
    // 回転を適用
    const rotatedCorners = corners.map(corner => ({
      x: corner.x * Math.cos(radians) - corner.y * Math.sin(radians) + x,
      y: corner.x * Math.sin(radians) + corner.y * Math.cos(radians) + y,
    }));
    
    // バウンディングボックスを計算
    const xs = rotatedCorners.map(p => p.x);
    const ys = rotatedCorners.map(p => p.y);
    
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    const right = Math.max(...xs);
    const bottom = Math.max(...ys);
    
    return {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top,
    };
  }

  /**
   * 点が矩形内にあるかチェック
   * @param point チェックする点
   * @param bounds 矩形
   * @returns 内部にあるかどうか
   */
  static isPointInBounds(point: Point, bounds: Bounds): boolean {
    return point.x >= bounds.left &&
           point.x <= bounds.right &&
           point.y >= bounds.top &&
           point.y <= bounds.bottom;
  }

  /**
   * 2つの矩形の交差判定
   * @param boundsA 矩形A
   * @param boundsB 矩形B
   * @returns 交差するかどうか
   */
  static boundsIntersect(boundsA: Bounds, boundsB: Bounds): boolean {
    return !(boundsA.right < boundsB.left ||
             boundsB.right < boundsA.left ||
             boundsA.bottom < boundsB.top ||
             boundsB.bottom < boundsA.top);
  }

  /**
   * 距離計算
   * @param pointA 点A
   * @param pointB 点B
   * @returns 距離
   */
  static distance(pointA: Point, pointB: Point): number {
    const dx = pointB.x - pointA.x;
    const dy = pointB.y - pointA.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 角度計算（ラジアンから度数法）
   * @param radians ラジアン
   * @returns 度数法の角度
   */
  static radiansToDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
  }

  /**
   * 角度計算（度数法からラジアン）
   * @param degrees 度数法の角度
   * @returns ラジアン
   */
  static degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * 座標の往復変換精度テスト
   * @param originalPoint 元の座標
   * @param canvasSize キャンバスサイズ
   * @returns 誤差（ピクセル）
   */
  static testRoundTripAccuracy(originalPoint: Point, canvasSize: Size): number {
    const spinePoint = this.domToSpine(originalPoint, canvasSize);
    const backToDom = this.spineToDom(spinePoint, canvasSize);
    return this.distance(originalPoint, backToDom);
  }
}

/**
 * 座標変換の精度保証テストスイート
 */
export class CoordinateTestSuite {
  static runAllTests(): boolean {
    const canvasSize: Size = { width: 1280, height: 720 };
    const testPoints: Point[] = [
      { x: 0, y: 0 },           // 左上
      { x: 640, y: 360 },       // 中央
      { x: 1280, y: 720 },      // 右下
      { x: 100.5, y: 200.7 },   // 小数点
    ];

    console.log('🧪 CoordinateUtils 精度テスト開始');
    
    let allPassed = true;
    
    testPoints.forEach((point, index) => {
      const error = CoordinateUtils.testRoundTripAccuracy(point, canvasSize);
      const passed = error < 0.001; // 0.001px以内の誤差を許容
      
      console.log(`  テスト ${index + 1}: ${passed ? '✅' : '❌'} 誤差: ${error.toFixed(6)}px`);
      
      if (!passed) {
        allPassed = false;
      }
    });
    
    console.log(`🧪 テスト結果: ${allPassed ? '全て成功' : '失敗あり'}`);
    return allPassed;
  }
}