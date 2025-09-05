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
    // 🎯 Viewport-Independent（VI）座標系
    // ==========================================
    
    /**
     * Viewport-Independent比率計算
     * ウィンドウサイズに依存しない正規化比率システム
     */
    calculateViewportIndependentRatio(currentContentRect, baseContentRect) {
        // VI基準: 要素自体の内在的比率を基準とする
        // ウィンドウサイズではなく、コンテンツ自体の比率変化を追跡
        
        const VI_STANDARD = {
            // 一般的なWebデザイン基準を採用
            aspectRatio: 16 / 9,  // 16:9比率
            baseSize: 1000        // 仮想基準サイズ
        };
        
        // コンテンツの内在的アスペクト比
        const baseAspectRatio = baseContentRect.width / baseContentRect.height;
        const currentAspectRatio = currentContentRect.width / currentContentRect.height;
        
        // VI正規化係数: アスペクト比の変化を考慮
        const aspectRatioChange = currentAspectRatio / baseAspectRatio;
        
        // VI座標系での正規化サイズ
        const viBaseWidth = VI_STANDARD.baseSize;
        const viBaseHeight = VI_STANDARD.baseSize / baseAspectRatio;
        
        const viCurrentWidth = viBaseWidth * (currentContentRect.width / baseContentRect.width);
        const viCurrentHeight = viBaseHeight * (currentContentRect.height / baseContentRect.height);
        
        console.log('🔍 VI座標系計算:', {
            baseAspectRatio: baseAspectRatio.toFixed(3),
            currentAspectRatio: currentAspectRatio.toFixed(3),
            aspectRatioChange: aspectRatioChange.toFixed(3),
            viSize: `${viCurrentWidth.toFixed(1)}×${viCurrentHeight.toFixed(1)}`,
            scaleChange: {
                width: (currentContentRect.width / baseContentRect.width).toFixed(3),
                height: (currentContentRect.height / baseContentRect.height).toFixed(3)
            }
        });
        
        return {
            viWidth: viCurrentWidth,
            viHeight: viCurrentHeight,
            viScaleX: viCurrentWidth / viBaseWidth,
            viScaleY: viCurrentHeight / viBaseHeight,
            aspectRatioChange: aspectRatioChange,
            isRatioStable: Math.abs(aspectRatioChange - 1.0) < 0.05 // 5%未満の変化
        };
    }
    
    /**
     * VI座標系での位置差分計算
     */
    calculateVIPositionDelta(viRatio, baseAnchorRatioX, baseAnchorRatioY, contentRect, baseContentRect) {
        // VI座標系では、アスペクト比の変化を考慮した位置計算
        if (viRatio.isRatioStable) {
            // アスペクト比が安定している場合は従来の計算を使用
            const expectedCurrentRelativeX = contentRect.x + (contentRect.width * baseAnchorRatioX);
            const expectedCurrentRelativeY = contentRect.y + (contentRect.height * baseAnchorRatioY);
            
            return {
                deltaX: expectedCurrentRelativeX - (baseContentRect.x + (baseContentRect.width * baseAnchorRatioX)),
                deltaY: expectedCurrentRelativeY - (baseContentRect.y + (baseContentRect.height * baseAnchorRatioY)),
                method: 'stable-ratio'
            };
        } else {
            // 重要: ヒーロー画像実質的サイズ変化チェック（レスポンシブ対応）
            const sizeChangeX = Math.abs(contentRect.width - baseContentRect.width);
            const sizeChangeY = Math.abs(contentRect.height - baseContentRect.height);
            const aspectRatioChangeSignificant = Math.abs(viRatio.aspectRatioChange - 1.0) > 0.05; // 5%以上の比率変化
            
            // キーポイント: 高さ変化なし = 背景画像は実際には変わっていない（レスポンシブ幅変更のみ）
            const isResponsiveWidthOnlyChange = sizeChangeY < 10; // 高さがほぼ変わらない = レスポンシブ幅変更のみ
            
            const actualContentSizeChanged = (
                sizeChangeX > 200 || sizeChangeY > 200 || // 200px以上の大きな変化
                (aspectRatioChangeSignificant && !isResponsiveWidthOnlyChange) // アスペクト比変化 かつ 高さも変化
            );
            
            console.log('🔍 サイズ変化判定:', {
                sizeChange: `ΔX:${sizeChangeX.toFixed(1)} ΔY:${sizeChangeY.toFixed(1)}`,
                aspectRatioChange: viRatio.aspectRatioChange.toFixed(3),
                aspectRatioChangeSignificant,
                isResponsiveWidthOnlyChange,
                actualContentSizeChanged,
                reasoning: isResponsiveWidthOnlyChange ? 'レスポンシブ幅変更のみ - VI補正スキップ' : 'VI補正適用候補'
            });
            
            if (!actualContentSizeChanged) {
                // ヒーロー画像のサイズが実質的に変わっていない = ウィンドウリサイズのみ
                // 重要: 移動を完全に防止（deltaX/Y = 0）
                console.log('🔒 ヒーロー画像サイズ不変 - キャラクター移動完全防止（ウィンドウリサイズのみ）');
                
                return {
                    deltaX: 0,  // 移動防止: ゼロ固定
                    deltaY: 0,  // 移動防止: ゼロ固定
                    method: 'movement-blocked-responsive-only'
                };
            }
            
            // ヒーロー画像サイズが実際に変化している場合のみVI座標系補正適用
            const viCompensationX = (viRatio.aspectRatioChange - 1.0) * baseAnchorRatioX * contentRect.width;
            const viCompensationY = (1.0 / viRatio.aspectRatioChange - 1.0) * baseAnchorRatioY * contentRect.height;
            
            const expectedCurrentRelativeX = contentRect.x + (contentRect.width * baseAnchorRatioX) - viCompensationX;
            const expectedCurrentRelativeY = contentRect.y + (contentRect.height * baseAnchorRatioY) - viCompensationY;
            
            console.log('🔄 VI比率補正適用（実際のサイズ変化）:', {
                aspectRatioChange: viRatio.aspectRatioChange.toFixed(3),
                compensation: `ΔX:${viCompensationX.toFixed(1)} ΔY:${viCompensationY.toFixed(1)}`,
                baseAnchorRatio: `${(baseAnchorRatioX * 100).toFixed(1)}%, ${(baseAnchorRatioY * 100).toFixed(1)}%`,
                actualSizeChange: `${(contentRect.width - baseContentRect.width).toFixed(1)} × ${(contentRect.height - baseContentRect.height).toFixed(1)}`
            });
            
            return {
                deltaX: expectedCurrentRelativeX - (baseContentRect.x + (baseContentRect.width * baseAnchorRatioX)),
                deltaY: expectedCurrentRelativeY - (baseContentRect.y + (baseContentRect.height * baseAnchorRatioY)),
                method: 'vi-compensated',
                compensation: { x: viCompensationX, y: viCompensationY }
            };
        }
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