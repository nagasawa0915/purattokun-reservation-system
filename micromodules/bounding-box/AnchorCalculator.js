/**
 * AnchorCalculator.js
 * 
 * 📍 最適アンカーポイント計算マイクロモジュール
 * - 責務: アンカーポイント計算・VI座標系・レスポンシブ対応
 * - 外部依存: ConfigManager, BackgroundDetector
 * - 行数: 約400行（500行制限遵守）
 * - 作成日: 2025-09-05
 */

class AnchorCalculator {
    constructor(configManager) {
        this.configManager = configManager;
        console.log('📍 AnchorCalculator初期化完了');
    }
    
    // ==========================================
    // 📍 最適アンカーポイント計算システム
    // ==========================================
    
    /**
     * 最適アンカーポイント計算
     */
    calculateOptimalAnchor(bounds, backgroundElement) {
        console.log('📍 最適アンカー計算開始', {
            bounds,
            background: this.getElementInfo(backgroundElement)
        });
        
        // 背景要素内での相対位置を計算
        const bgRect = backgroundElement.getBoundingClientRect();
        const spineRect = {
            x: bounds.left || bounds.x || 0,
            y: bounds.top || bounds.y || 0,
            width: bounds.width || 100,
            height: bounds.height || 100,
            centerX: (bounds.left || bounds.x || 0) + (bounds.width || 100) / 2,
            centerY: (bounds.top || bounds.y || 0) + (bounds.height || 100) / 2
        };
        
        // 正規化座標（0.0-1.0）
        const normalizedX = Math.max(0, Math.min(1, (spineRect.centerX - bgRect.left) / bgRect.width));
        const normalizedY = Math.max(0, Math.min(1, (spineRect.centerY - bgRect.top) / bgRect.height));
        
        console.log('📊 正規化座標:', { x: normalizedX, y: normalizedY });
        
        // 特殊ケース対応
        const specialCaseAnchor = this.checkSpecialCases(bgRect, spineRect, normalizedX, normalizedY);
        if (specialCaseAnchor) {
            return specialCaseAnchor;
        }
        
        // アンカーポイントマッピング
        return this.mapToAnchorPoint(normalizedX, normalizedY);
    }
    
    /**
     * アンカーポイントマッピング
     */
    mapToAnchorPoint(x, y) {
        const anchorConfig = this.configManager.getConfig().anchor;
        
        // 9分割グリッドでアンカー決定
        const xZone = x < anchorConfig.gridX[0] ? 'L' : 
                      x > anchorConfig.gridX[1] ? 'R' : 'C';
        const yZone = y < anchorConfig.gridY[0] ? 'T' : 
                      y > anchorConfig.gridY[1] ? 'B' : 'M';
        
        const anchorMap = {
            'TL': 'TL', 'TC': 'TC', 'TR': 'TR',
            'ML': 'ML', 'MC': 'MC', 'MR': 'MR', 
            'BL': 'BL', 'BC': 'BC', 'BR': 'BR'
        };
        
        const anchor = anchorMap[yZone + xZone] || anchorConfig.defaultAnchor;
        console.log('🎯 アンカー決定:', { x, y, xZone, yZone, anchor });
        
        return anchor;
    }
    
    /**
     * 特殊ケースの確認
     */
    checkSpecialCases(bgRect, spineRect, normalizedX, normalizedY) {
        // レスポンシブ考慮
        if (this.isResponsiveLayout(bgRect)) {
            return this.adjustAnchorForResponsive(normalizedX, normalizedY);
        }
        
        // 小さな要素の場合
        if (bgRect.width < 400 || bgRect.height < 300) {
            console.log('📐 小さな背景要素 → 中央固定');
            return 'MC';
        }
        
        // 縦長レイアウト
        if (bgRect.height / bgRect.width > 1.5) {
            const anchor = normalizedY < 0.5 ? 'TC' : 'BC';
            console.log('📐 縦長レイアウト →', anchor);
            return anchor;
        }
        
        // 横長レイアウト
        if (bgRect.width / bgRect.height > 2.0) {
            const anchor = normalizedX < 0.5 ? 'ML' : 'MR';
            console.log('📐 横長レイアウト →', anchor);
            return anchor;
        }
        
        return null;
    }
    
    /**
     * レスポンシブレイアウトの確認
     */
    isResponsiveLayout(rect) {
        // ウィンドウサイズではなく、要素自体の特性で判定
        // - 大きなサイズの要素（おそらく背景要素）
        // - 一般的なアスペクト比（16:9, 4:3等）を持つ
        const isLargeElement = rect.width > 500 && rect.height > 300;
        const aspectRatio = rect.width / rect.height;
        const hasFlexibleAspectRatio = Math.abs(aspectRatio - 16/9) < 0.5 || 
                                      Math.abs(aspectRatio - 4/3) < 0.3 ||
                                      Math.abs(aspectRatio - 1) < 0.3;
        
        console.log('🔍 レスポンシブ判定（ウィンドウ非依存）:', {
            size: `${rect.width.toFixed(1)}×${rect.height.toFixed(1)}`,
            aspectRatio: aspectRatio.toFixed(2),
            isLarge: isLargeElement,
            hasFlexibleRatio: hasFlexibleAspectRatio,
            判定結果: isLargeElement && hasFlexibleAspectRatio
        });
        
        return isLargeElement && hasFlexibleAspectRatio;
    }
    
    /**
     * レスポンシブ用アンカー調整
     */
    adjustAnchorForResponsive(normalizedX, normalizedY) {
        // レスポンシブでは中央系のアンカーを推奨
        if (normalizedX > 0.3 && normalizedX < 0.7) {
            if (normalizedY < 0.4) return 'TC';
            if (normalizedY > 0.6) return 'BC';
            return 'MC';
        }
        
        // サイドアンカー
        return normalizedX < 0.5 ? 'ML' : 'MR';
    }
    
    // ==========================================
    // 🎯 シンプル位置計算システム（許容範囲内誤差方式）
    // ==========================================
    
    /**
     * 🆕 Tolerance対応の位置差分計算
     * 複雑なVI座標系を削除し、シンプルな比率計算のみに変更
     */
    calculateSimplePositionDelta(currentContentRect, baseContentRect, baseAnchorRatioX, baseAnchorRatioY, tolerancePx = 5) {
        // 基本比率計算: 現在の位置を背景要素に対する比率で表現
        const currentCenterX = currentContentRect.x + currentContentRect.width / 2;
        const currentCenterY = currentContentRect.y + currentContentRect.height / 2;
        
        const baseCenterX = baseContentRect.x + baseContentRect.width / 2;
        const baseCenterY = baseContentRect.y + baseContentRect.height / 2;
        
        // アンカーポイント基準での期待位置計算
        const expectedCurrentX = currentContentRect.x + (currentContentRect.width * baseAnchorRatioX);
        const expectedCurrentY = currentContentRect.y + (currentContentRect.height * baseAnchorRatioY);
        
        const expectedBaseX = baseContentRect.x + (baseContentRect.width * baseAnchorRatioX);
        const expectedBaseY = baseContentRect.y + (baseContentRect.height * baseAnchorRatioY);
        
        // シンプルな差分計算
        const deltaX = expectedCurrentX - expectedBaseX;
        const deltaY = expectedCurrentY - expectedBaseY;
        
        // 許容範囲内チェック
        const isWithinToleranceX = Math.abs(deltaX) <= tolerancePx;
        const isWithinToleranceY = Math.abs(deltaY) <= tolerancePx;
        const isWithinTolerance = isWithinToleranceX && isWithinToleranceY;
        
        // サイズ変化の判定（200px以上の大きな変化のみ考慮）
        const sizeChangeX = Math.abs(currentContentRect.width - baseContentRect.width);
        const sizeChangeY = Math.abs(currentContentRect.height - baseContentRect.height);
        const hasSignificantSizeChange = sizeChangeX > 200 || sizeChangeY > 200;
        
        console.log('🎯 シンプル位置差分計算:', {
            delta: `ΔX:${deltaX.toFixed(1)}px ΔY:${deltaY.toFixed(1)}px`,
            tolerance: `${tolerancePx}px`,
            withinTolerance: isWithinTolerance,
            sizeChange: `ΔW:${sizeChangeX.toFixed(1)}px ΔH:${sizeChangeY.toFixed(1)}px`,
            significantSizeChange: hasSignificantSizeChange,
            anchorRatio: `${(baseAnchorRatioX * 100).toFixed(1)}%, ${(baseAnchorRatioY * 100).toFixed(1)}%`
        });
        
        // 位置補正の判定
        if (isWithinTolerance && !hasSignificantSizeChange) {
            // 許容範囲内かつサイズ変化なし → 補正不要
            return {
                deltaX: 0,
                deltaY: 0,
                method: 'within-tolerance',
                withinTolerance: true,
                actualDelta: { x: deltaX, y: deltaY }
            };
        } else if (hasSignificantSizeChange) {
            // 大きなサイズ変化 → 補正実行
            return {
                deltaX: deltaX,
                deltaY: deltaY,
                method: 'size-change-correction',
                withinTolerance: false,
                actualDelta: { x: deltaX, y: deltaY }
            };
        } else {
            // 許容範囲外だが小さなサイズ変化 → 微調整
            return {
                deltaX: deltaX * 0.5, // 50%の補正で穏やかに調整
                deltaY: deltaY * 0.5,
                method: 'gentle-correction',
                withinTolerance: false,
                actualDelta: { x: deltaX, y: deltaY }
            };
        }
    }
    
    /**
     * 🆕 簡単な比率計算
     * 複雑な座標変換を削除し、基本的な比率のみを計算
     */
    calculateSimpleRatio(currentContentRect, baseContentRect) {
        const scaleX = currentContentRect.width / baseContentRect.width;
        const scaleY = currentContentRect.height / baseContentRect.height;
        const avgScale = (scaleX + scaleY) / 2;
        
        return {
            scaleX: scaleX,
            scaleY: scaleY,
            avgScale: avgScale,
            isUniformScale: Math.abs(scaleX - scaleY) < 0.1, // 10%未満の差は均等スケール
            sizeChanged: Math.abs(avgScale - 1.0) > 0.1 // 10%以上の変化でサイズ変更と判定
        };
    }
    
    // ==========================================
    // 🔧 アンカー計算ユーティリティ
    // ==========================================
    
    /**
     * アンカーポイント間の距離計算
     */
    calculateAnchorDistance(anchor1, anchor2, rectWidth, rectHeight) {
        const anchorPositions = {
            'TL': { x: 0, y: 0 },
            'TC': { x: 0.5, y: 0 },
            'TR': { x: 1, y: 0 },
            'ML': { x: 0, y: 0.5 },
            'MC': { x: 0.5, y: 0.5 },
            'MR': { x: 1, y: 0.5 },
            'BL': { x: 0, y: 1 },
            'BC': { x: 0.5, y: 1 },
            'BR': { x: 1, y: 1 }
        };
        
        const pos1 = anchorPositions[anchor1];
        const pos2 = anchorPositions[anchor2];
        
        if (!pos1 || !pos2) return null;
        
        const pixelX1 = pos1.x * rectWidth;
        const pixelY1 = pos1.y * rectHeight;
        const pixelX2 = pos2.x * rectWidth;
        const pixelY2 = pos2.y * rectHeight;
        
        const distance = Math.sqrt(
            Math.pow(pixelX2 - pixelX1, 2) + Math.pow(pixelY2 - pixelY1, 2)
        );
        
        return distance;
    }
    
    /**
     * 最も近いアンカーポイントを検索
     */
    findNearestAnchor(normalizedX, normalizedY) {
        const anchorConfig = this.configManager.getConfig().anchor;
        const anchors = ['TL', 'TC', 'TR', 'ML', 'MC', 'MR', 'BL', 'BC', 'BR'];
        
        const anchorPositions = {
            'TL': { x: 0, y: 0 },
            'TC': { x: 0.5, y: 0 },
            'TR': { x: 1, y: 0 },
            'ML': { x: 0, y: 0.5 },
            'MC': { x: 0.5, y: 0.5 },
            'MR': { x: 1, y: 0.5 },
            'BL': { x: 0, y: 1 },
            'BC': { x: 0.5, y: 1 },
            'BR': { x: 1, y: 1 }
        };
        
        let nearestAnchor = anchorConfig.defaultAnchor;
        let minDistance = Infinity;
        
        for (const anchor of anchors) {
            const pos = anchorPositions[anchor];
            const distance = Math.sqrt(
                Math.pow(normalizedX - pos.x, 2) + 
                Math.pow(normalizedY - pos.y, 2)
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestAnchor = anchor;
            }
        }
        
        console.log('🔍 最近傍アンカー検索:', {
            target: `${(normalizedX * 100).toFixed(1)}%, ${(normalizedY * 100).toFixed(1)}%`,
            nearest: nearestAnchor,
            distance: minDistance.toFixed(3)
        });
        
        return nearestAnchor;
    }
    
    /**
     * アンカーポイントの妥当性検証
     */
    validateAnchor(anchor) {
        const validAnchors = ['TL', 'TC', 'TR', 'ML', 'MC', 'MR', 'BL', 'BC', 'BR'];
        const isValid = validAnchors.includes(anchor);
        
        if (!isValid) {
            console.warn('⚠️ 無効なアンカーポイント:', anchor);
            return this.configManager.getConfig().anchor.defaultAnchor;
        }
        
        return anchor;
    }
    
    /**
     * アンカーポイントの位置比率を取得
     */
    getAnchorRatio(anchor) {
        const anchorRatios = {
            'TL': { x: 0, y: 0 },
            'TC': { x: 0.5, y: 0 },
            'TR': { x: 1, y: 0 },
            'ML': { x: 0, y: 0.5 },
            'MC': { x: 0.5, y: 0.5 },
            'MR': { x: 1, y: 0.5 },
            'BL': { x: 0, y: 1 },
            'BC': { x: 0.5, y: 1 },
            'BR': { x: 1, y: 1 }
        };
        
        return anchorRatios[anchor] || anchorRatios['MC'];
    }
    
    // ==========================================
    // 🔧 ユーティリティメソッド
    // ==========================================
    
    /**
     * 要素情報取得
     */
    getElementInfo(element) {
        if (!element) return 'null';
        
        return {
            tagName: element.tagName,
            id: element.id || '(no id)',
            className: element.className || '(no class)',
            size: `${element.offsetWidth}×${element.offsetHeight}`
        };
    }
    
    /**
     * デバッグ情報の取得
     */
    getDebugInfo() {
        return {
            version: '1.0',
            className: 'AnchorCalculator',
            config: this.configManager.getConfig(),
            timestamp: new Date().toISOString()
        };
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.AnchorCalculator = AnchorCalculator;
}