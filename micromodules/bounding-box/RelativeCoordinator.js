/**
 * RelativeCoordinator.js
 * 
 * 🎯 相対座標計算・追従処理システム
 * - PureBoundingBox 2段階ピン設定システム Stage 2
 * - 責務: 選択要素基準の相対位置計算・レスポンシブ追従
 * - 外部依存: ElementObserver (Phase 1)
 */

class RelativeCoordinator {
    constructor(observer) {
        console.log('🎯 RelativeCoordinator 初期化開始');
        
        this.observer = observer; // ElementObserver instance
        this.activePins = new Map(); // characterId -> pinConfig
        
        // 設定
        this.config = {
            precision: 4,           // 座標精度（小数点以下桁数）
            throttleMs: 16,         // 追従処理の間隔（60fps）
            maxPins: 10,            // 最大ピン数
            minElementSize: 20      // 最小要素サイズ
        };
        
        // アンカーポイント定義
        this.anchorPoints = {
            'TL': { x: 0, y: 0, name: 'Top-Left' },
            'TC': { x: 0.5, y: 0, name: 'Top-Center' },
            'TR': { x: 1, y: 0, name: 'Top-Right' },
            'ML': { x: 0, y: 0.5, name: 'Middle-Left' },
            'MC': { x: 0.5, y: 0.5, name: 'Middle-Center' },
            'MR': { x: 1, y: 0.5, name: 'Middle-Right' },
            'BL': { x: 0, y: 1, name: 'Bottom-Left' },
            'BC': { x: 0.5, y: 1, name: 'Bottom-Center' },
            'BR': { x: 1, y: 1, name: 'Bottom-Right' }
        };
        
        // デバッグフラグ
        this.debugMode = false;
        
        console.log('✅ RelativeCoordinator 初期化完了');
    }
    
    /**
     * 🎯 相対ピン設定作成
     */
    async createRelativePin(config) {
        console.log('🎯 相対ピン設定開始', {
            selectedElement: this.getElementInfo(config.selectedElement),
            characterElement: this.getElementInfo(config.characterElement),
            anchor: config.anchor
        });
        
        try {
            // 設定検証
            const validation = this.validatePinConfig(config);
            if (!validation.isValid) {
                throw new Error(`設定検証失敗: ${validation.reason}`);
            }
            
            // 既存ピンのクリーンアップ
            const characterId = this.getElementId(config.characterElement);
            if (this.activePins.has(characterId)) {
                await this.removePin(characterId);
                console.log('🔄 既存ピンを削除:', characterId);
            }
            
            // 相対座標計算
            const relativePosition = this.calculateRelativePosition(
                config.selectedElement,
                config.characterElement,
                config.anchor,
                config.offset || { x: 0, y: 0 }
            );
            
            // ElementObserver監視開始
            if (!this.observer || typeof this.observer.observe !== 'function') {
                throw new Error('ElementObserver が利用できません');
            }
            
            const unobserve = this.observer.observe(config.selectedElement, 
                this.createUpdateHandler(config.characterElement, relativePosition)
            );
            
            // ピン設定保存
            const pinConfig = {
                id: this.generatePinId(),
                selectedElement: config.selectedElement,
                characterElement: config.characterElement,
                anchor: config.anchor,
                relativePosition: relativePosition,
                offset: config.offset || { x: 0, y: 0 },
                unobserve: unobserve,
                createdAt: Date.now(),
                lastUpdate: Date.now()
            };
            
            this.activePins.set(characterId, pinConfig);
            
            console.log('✅ 相対ピン設定完了:', {
                pinId: pinConfig.id,
                anchor: config.anchor,
                relativePosX: relativePosition.x,
                relativePosY: relativePosition.y,
                activePinCount: this.activePins.size
            });
            
            return {
                success: true,
                pinConfig: pinConfig,
                activePinCount: this.activePins.size
            };
            
        } catch (error) {
            console.error('❌ 相対ピン設定エラー:', error);
            return {
                success: false,
                error: error.message,
                activePinCount: this.activePins.size
            };
        }
    }
    
    /**
     * 相対位置計算
     */
    calculateRelativePosition(selectedElement, characterElement, anchor, offset) {
        const selectedRect = selectedElement.getBoundingClientRect();
        const characterRect = characterElement.getBoundingClientRect();
        
        // 🎯 画像の実スケール値を取得
        const imageScaleInfo = this.getImageScaleInfo(selectedElement);
        
        // アンカーポイント座標計算
        const anchorPoint = this.anchorPoints[anchor] || this.anchorPoints['MC'];
        const anchorX = selectedRect.left + selectedRect.width * anchorPoint.x;
        const anchorY = selectedRect.top + selectedRect.height * anchorPoint.y;
        
        // キャラクターの中心座標
        const characterCenterX = characterRect.left + characterRect.width / 2;
        const characterCenterY = characterRect.top + characterRect.height / 2;
        
        // 相対位置計算（アンカーポイントからの相対位置）
        const relativeX = characterCenterX - anchorX + offset.x;
        const relativeY = characterCenterY - anchorY + offset.y;
        
        // 🎯 画像の実寸法基準での比率計算（レスポンシブ対応改良）
        const baseWidth = imageScaleInfo.naturalWidth * imageScaleInfo.scaleX;
        const baseHeight = imageScaleInfo.naturalHeight * imageScaleInfo.scaleY;
        
        const relativeRatioX = relativeX / baseWidth;
        const relativeRatioY = relativeY / baseHeight;
        
        const result = {
            x: this.round(relativeX, this.config.precision),
            y: this.round(relativeY, this.config.precision),
            ratioX: this.round(relativeRatioX, this.config.precision),
            ratioY: this.round(relativeRatioY, this.config.precision),
            anchor: anchor,
            selectedElement: selectedElement, // 🎯 選択要素の参照を保存
            selectedElementSize: {
                width: selectedRect.width,
                height: selectedRect.height
            },
            // 🎯 画像スケール連動情報を追加
            imageScaleInfo: imageScaleInfo,
            characterScale: {
                recommended: imageScaleInfo.totalScale,
                scaleX: imageScaleInfo.scaleX,
                scaleY: imageScaleInfo.scaleY
            }
        };
        
        if (this.debugMode) {
            console.log('📐 相対位置計算結果:', result);
        }
        
        return result;
    }
    
    /**
     * 更新ハンドラー生成
     */
    createUpdateHandler(characterElement, relativePosition) {
        let lastUpdate = 0;
        
        return (rect, changeType) => {
            const now = Date.now();
            
            // スロットリング
            if (now - lastUpdate < this.config.throttleMs) {
                return;
            }
            lastUpdate = now;
            
            try {
                if (this.debugMode) {
                    console.log('📐 要素変化検出:', {
                        changeType,
                        size: `${rect.width}×${rect.height}`,
                        anchor: relativePosition.anchor
                    });
                }
                
                // 新しい位置計算
                this.updateCharacterPosition(characterElement, rect, relativePosition);
                
                // ピン設定の更新時刻記録
                const characterId = this.getElementId(characterElement);
                const pinConfig = this.activePins.get(characterId);
                if (pinConfig) {
                    pinConfig.lastUpdate = now;
                }
                
            } catch (error) {
                console.error('❌ ピン位置更新エラー:', error);
            }
        };
    }
    
    /**
     * キャラクター位置更新
     */
    updateCharacterPosition(characterElement, selectedRect, relativePosition) {
        // アンカーポイント座標計算
        const anchorPoint = this.anchorPoints[relativePosition.anchor];
        const anchorX = selectedRect.left + selectedRect.width * anchorPoint.x;
        const anchorY = selectedRect.top + selectedRect.height * anchorPoint.y;
        
        // 相対位置適用（比率ベースとピクセルベースの2通りを検討）
        let finalX, finalY;
        
        // 🎯 画像実スケール基準での位置計算（ウィンドウサイズ非依存）
        if (relativePosition.imageScaleInfo && relativePosition.imageScaleInfo.isImage) {
            // 画像の実スケールベース計算（選択要素の参照を使用）
            const selectedElement = relativePosition.selectedElement;
            if (!selectedElement) {
                console.error('❌ 選択要素の参照が見つかりません');
                return;
            }
            
            const currentImageScale = this.getImageScaleInfo(selectedElement);
            const currentBaseWidth = currentImageScale.naturalWidth * currentImageScale.scaleX;
            const currentBaseHeight = currentImageScale.naturalHeight * currentImageScale.scaleY;
            
            // 実寸法基準での相対位置計算
            finalX = anchorX + currentBaseWidth * relativePosition.ratioX;
            finalY = anchorY + currentBaseHeight * relativePosition.ratioY;
            
            console.log('🎯 画像スケール基準位置計算:', {
                currentScale: currentImageScale.totalScale.toFixed(3),
                baseSize: `${currentBaseWidth.toFixed(1)}×${currentBaseHeight.toFixed(1)}`,
                ratio: `${relativePosition.ratioX.toFixed(3)}, ${relativePosition.ratioY.toFixed(3)}`,
                position: `${finalX.toFixed(1)}, ${finalY.toFixed(1)}`
            });
        } else {
            // 非画像要素：サイズ変化判定による自動切り替え
            const sizeChangeRatio = Math.abs(selectedRect.width - relativePosition.selectedElementSize.width) / 
                                   relativePosition.selectedElementSize.width;
            
            if (sizeChangeRatio > 0.1) {
                // 大きなサイズ変化：比率ベース
                finalX = anchorX + selectedRect.width * relativePosition.ratioX;
                finalY = anchorY + selectedRect.height * relativePosition.ratioY;
            } else {
                // 小さなサイズ変化：ピクセルベース
                finalX = anchorX + relativePosition.x;
                finalY = anchorY + relativePosition.y;
            }
        }
        
        // キャラクター要素の中心座標として適用
        const characterRect = characterElement.getBoundingClientRect();
        const targetLeft = finalX - characterRect.width / 2;
        const targetTop = finalY - characterRect.height / 2;
        
        // 🎯 画像スケールに連動したキャラクタースケール計算
        let characterScale = 1;
        if (relativePosition.imageScaleInfo && relativePosition.imageScaleInfo.isImage) {
            const currentImageScale = this.getImageScaleInfo(selectedElement);
            const scaleRatio = currentImageScale.totalScale / relativePosition.imageScaleInfo.totalScale;
            characterScale = relativePosition.characterScale.recommended * scaleRatio;
            
            console.log('🎯 キャラクタースケール連動:', {
                originalImageScale: relativePosition.imageScaleInfo.totalScale.toFixed(3),
                currentImageScale: currentImageScale.totalScale.toFixed(3),
                scaleRatio: scaleRatio.toFixed(3),
                characterScale: characterScale.toFixed(3)
            });
        }
        
        // スムーズな移動＋スケール連動のためCSS Transformを使用
        const transform = `translate(${this.round(targetLeft)}px, ${this.round(targetTop)}px) scale(${characterScale.toFixed(3)})`;
        
        // 既存のtransformプロパティを保持
        const currentTransform = characterElement.style.transform;
        const transformRegex = /(translate\([^)]+\)|scale\([^)]+\))/g;
        
        // 既存のtranslateとscaleを置換
        let newTransform = currentTransform.replace(transformRegex, '').trim();
        newTransform = (newTransform + ' ' + transform).trim();
        
        characterElement.style.transform = newTransform;
        
        // 代替手段：position プロパティでの設定
        if (window.getComputedStyle(characterElement).position === 'absolute' || 
            window.getComputedStyle(characterElement).position === 'fixed') {
            characterElement.style.left = this.round(targetLeft) + 'px';
            characterElement.style.top = this.round(targetTop) + 'px';
        }
        
        if (this.debugMode) {
            console.log('📐 位置更新:', {
                anchor: relativePosition.anchor,
                anchorPos: `${anchorX}, ${anchorY}`,
                finalPos: `${finalX}, ${finalY}`,
                transform: transform
            });
        }
    }
    
    /**
     * ピン設定削除
     */
    async removePin(characterId) {
        const pinConfig = this.activePins.get(characterId);
        if (!pinConfig) {
            console.warn('⚠️ 指定されたピンが見つかりません:', characterId);
            return false;
        }
        
        try {
            // ElementObserver監視停止
            if (pinConfig.unobserve && typeof pinConfig.unobserve === 'function') {
                pinConfig.unobserve();
            }
            
            // ピン削除
            this.activePins.delete(characterId);
            
            console.log('✅ ピン削除完了:', characterId);
            return true;
            
        } catch (error) {
            console.error('❌ ピン削除エラー:', error);
            return false;
        }
    }
    
    /**
     * 全ピン削除
     */
    async removeAllPins() {
        const pinIds = Array.from(this.activePins.keys());
        let removedCount = 0;
        
        for (const pinId of pinIds) {
            if (await this.removePin(pinId)) {
                removedCount++;
            }
        }
        
        console.log(`✅ 全ピン削除完了: ${removedCount}/${pinIds.length}個`);
        return removedCount;
    }
    
    /**
     * ピン設定の検証
     */
    validatePinConfig(config) {
        if (!config.selectedElement) {
            return { isValid: false, reason: '選択要素が指定されていません' };
        }
        
        if (!config.characterElement) {
            return { isValid: false, reason: 'キャラクター要素が指定されていません' };
        }
        
        if (!config.anchor || !this.anchorPoints[config.anchor]) {
            return { isValid: false, reason: '無効なアンカーポイントです' };
        }
        
        // 要素サイズチェック
        const selectedRect = config.selectedElement.getBoundingClientRect();
        const characterRect = config.characterElement.getBoundingClientRect();
        
        if (selectedRect.width < this.config.minElementSize || selectedRect.height < this.config.minElementSize) {
            return { isValid: false, reason: '選択要素が小さすぎます' };
        }
        
        if (characterRect.width < this.config.minElementSize || characterRect.height < this.config.minElementSize) {
            return { isValid: false, reason: 'キャラクター要素が小さすぎます' };
        }
        
        // 最大ピン数チェック
        if (this.activePins.size >= this.config.maxPins) {
            return { isValid: false, reason: '最大ピン数に達しています' };
        }
        
        return { isValid: true };
    }
    
    /**
     * 最適なアンカーポイント推奨
     */
    recommendAnchorPoint(selectedElement, characterElement) {
        const selectedRect = selectedElement.getBoundingClientRect();
        const characterRect = characterElement.getBoundingClientRect();
        
        // キャラクター要素の中心座標
        const characterCenterX = characterRect.left + characterRect.width / 2;
        const characterCenterY = characterRect.top + characterRect.height / 2;
        
        // 選択要素内での正規化座標
        const normalizedX = (characterCenterX - selectedRect.left) / selectedRect.width;
        const normalizedY = (characterCenterY - selectedRect.top) / selectedRect.height;
        
        // 9分割グリッドでアンカー決定
        const xZone = normalizedX < 0.33 ? 'L' : normalizedX > 0.67 ? 'R' : 'C';
        const yZone = normalizedY < 0.33 ? 'T' : normalizedY > 0.67 ? 'B' : 'M';
        
        const recommendedAnchor = yZone + xZone;
        
        return {
            anchor: recommendedAnchor,
            confidence: this.calculateConfidence(normalizedX, normalizedY),
            reason: `キャラクター位置に基づく推奨 (${normalizedX.toFixed(2)}, ${normalizedY.toFixed(2)})`
        };
    }
    
    /**
     * 推奨度計算
     */
    calculateConfidence(normalizedX, normalizedY) {
        // 中心に近いほど信頼度が低い（境界が曖昧）
        const centerDistance = Math.sqrt(
            Math.pow(normalizedX - 0.5, 2) + Math.pow(normalizedY - 0.5, 2)
        );
        
        return Math.min(centerDistance * 2, 1);
    }
    
    /**
     * アクティブピン統計取得
     */
    getStatistics() {
        const pins = Array.from(this.activePins.values());
        
        const stats = {
            totalPins: pins.length,
            maxPins: this.config.maxPins,
            anchorDistribution: {},
            averageAge: 0,
            oldestPin: null,
            newestPin: null
        };
        
        if (pins.length === 0) {
            return stats;
        }
        
        // アンカー分布
        pins.forEach(pin => {
            stats.anchorDistribution[pin.anchor] = (stats.anchorDistribution[pin.anchor] || 0) + 1;
        });
        
        // 年齢計算
        const now = Date.now();
        const ages = pins.map(pin => now - pin.createdAt);
        stats.averageAge = Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length);
        
        // 最古・最新
        const sortedPins = pins.sort((a, b) => a.createdAt - b.createdAt);
        stats.oldestPin = sortedPins[0];
        stats.newestPin = sortedPins[sortedPins.length - 1];
        
        return stats;
    }
    
    /**
     * デバッグモード切り替え
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`🐛 RelativeCoordinator デバッグモード: ${enabled ? 'ON' : 'OFF'}`);
    }
    
    /**
     * ヘルパー関数群
     */
    
    generatePinId() {
        return `pin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getElementId(element) {
        return element.id || `element-${element.tagName}-${Date.now()}`;
    }
    
    getElementInfo(element) {
        if (!element) return null;
        
        const rect = element.getBoundingClientRect();
        
        return {
            tagName: element.tagName,
            id: element.id || null,
            className: element.className || null,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            left: Math.round(rect.left),
            top: Math.round(rect.top)
        };
    }
    
    /**
     * 🎯 画像の実スケール情報取得
     */
    getImageScaleInfo(element) {
        const result = {
            isImage: false,
            naturalWidth: 0,
            naturalHeight: 0,
            scaleX: 1,
            scaleY: 1,
            totalScale: 1
        };
        
        // 画像要素かチェック
        if (element.tagName === 'IMG') {
            result.isImage = true;
            result.naturalWidth = element.naturalWidth || element.width;
            result.naturalHeight = element.naturalHeight || element.height;
        } else {
            // 画像以外の場合は表示サイズを使用
            const rect = element.getBoundingClientRect();
            result.naturalWidth = rect.width;
            result.naturalHeight = rect.height;
        }
        
        // CSS Transform スケール値を取得
        const computedStyle = window.getComputedStyle(element);
        const transform = computedStyle.transform;
        
        if (transform && transform !== 'none') {
            const matrixMatch = transform.match(/matrix\(([^)]+)\)/);
            if (matrixMatch) {
                const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()));
                if (values.length >= 6) {
                    result.scaleX = Math.abs(values[0]); // a値
                    result.scaleY = Math.abs(values[3]); // d値
                }
            }
        }
        
        // 追加のCSS width/height スケール検出
        if (result.isImage && result.naturalWidth > 0) {
            const rect = element.getBoundingClientRect();
            const cssScaleX = rect.width / result.naturalWidth;
            const cssScaleY = rect.height / result.naturalHeight;
            
            result.scaleX *= cssScaleX;
            result.scaleY *= cssScaleY;
        }
        
        result.totalScale = Math.sqrt(result.scaleX * result.scaleY);
        
        console.log('🎯 画像スケール情報:', {
            element: element.tagName,
            naturalSize: `${result.naturalWidth}×${result.naturalHeight}`,
            scale: `${result.scaleX.toFixed(3)}×${result.scaleY.toFixed(3)}`,
            totalScale: result.totalScale.toFixed(3)
        });
        
        return result;
    }
    
    round(value, precision = 2) {
        const factor = Math.pow(10, precision);
        return Math.round(value * factor) / factor;
    }
    
    /**
     * 現在の状態取得
     */
    getState() {
        return {
            activePinCount: this.activePins.size,
            maxPins: this.config.maxPins,
            debugMode: this.debugMode,
            hasObserver: !!this.observer,
            statistics: this.getStatistics()
        };
    }
    
    /**
     * ピン一覧取得
     */
    getActivePins() {
        return Array.from(this.activePins.values()).map(pin => ({
            id: pin.id,
            anchor: pin.anchor,
            selectedElement: this.getElementInfo(pin.selectedElement),
            characterElement: this.getElementInfo(pin.characterElement),
            createdAt: pin.createdAt,
            lastUpdate: pin.lastUpdate
        }));
    }
}

// グローバル公開
if (typeof window !== 'undefined') {
    window.RelativeCoordinator = RelativeCoordinator;
    console.log('✅ RelativeCoordinator グローバル公開完了');
}

// AMD/CommonJS対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RelativeCoordinator;
}