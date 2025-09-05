/**
 * BackgroundDetector.js
 * 
 * 🔍 背景要素自動検出マイクロモジュール
 * - 責務: 背景要素検出・内容矩形計算
 * - 外部依存: なし（完全独立）
 * - 行数: 約400行（500行制限遵守）
 * - 作成日: 2025-09-05
 */

class BackgroundDetector {
    constructor(configManager) {
        this.configManager = configManager;
        console.log('🔍 BackgroundDetector初期化完了');
    }
    
    // ==========================================
    // 🔍 背景要素自動検出システム
    // ==========================================
    
    /**
     * 背景要素の自動検出
     */
    detectBackgroundElement(targetElement) {
        console.log('🔍 背景要素検出開始', {
            target: this.getElementInfo(targetElement)
        });
        
        // 検出優先度順リスト (ヒーロー画像要素最優先)
        const detectionStrategies = [
            () => this.findParentWithBackground(targetElement),      // 🎯 ヒーロー画像要素優先検索
            () => this.findSectionContainer(targetElement),         // 🎯 ヒーロー画像コンテナ優先検索  
            () => this.findNearbyImageElement(targetElement),       // 近接画像要素
            () => this.findMainContainer(targetElement)             // 一般コンテナ
        ];
        
        for (let i = 0; i < detectionStrategies.length; i++) {
            const strategy = detectionStrategies[i];
            const result = strategy();
            
            if (result && this.validateBackgroundElement(result)) {
                console.log(`✅ 背景要素検出成功 (戦略${i + 1}):`, this.getElementInfo(result));
                return result;
            }
        }
        
        // 最終フォールバック
        const detectionConfig = this.configManager.getConfig().detection;
        if (detectionConfig.fallbackToBody) {
            console.log('⚠️ フォールバック: document.body を使用');
            return document.body;
        }
        
        return null;
    }
    
    /**
     * 背景画像付き親要素の検出 (ヒーロー画像優先)
     */
    findParentWithBackground(element) {
        // 🎯 最初にヒーロー画像要素を直接検索
        const heroElements = [
            document.querySelector('.hero-section'),
            document.querySelector('.hero-image'),
            document.querySelector('[class*="hero"]')
        ];
        
        for (const heroEl of heroElements) {
            if (heroEl && this.hasBackgroundImage(heroEl)) {
                console.log('🎯 ヒーロー画像要素（背景画像付き）検出:', this.getElementInfo(heroEl));
                return heroEl;
            }
        }
        
        // 従来の親要素検索
        let current = element.parentElement;
        let depth = 0;
        const detectionConfig = this.configManager.getConfig().detection;
        
        while (current && current !== document.body && depth < detectionConfig.maxSearchDepth) {
            // ヒーロー画像関連のクラスを持つ要素は最優先
            if (current.classList.contains('hero-section') || 
                current.classList.contains('hero-image') || 
                current.className.includes('hero')) {
                console.log('🎯 親階層からヒーロー画像要素検出:', this.getElementInfo(current));
                return current;
            }
            
            const style = getComputedStyle(current);
            
            if (style.backgroundImage !== 'none' || 
                style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                return current;
            }
            
            current = current.parentElement;
            depth++;
        }
        
        return null;
    }
    
    /**
     * 要素が背景画像を持っているかチェック
     */
    hasBackgroundImage(element) {
        if (!element) return false;
        const style = getComputedStyle(element);
        return style.backgroundImage !== 'none';
    }
    
    /**
     * 近接画像要素の検出
     */
    findNearbyImageElement(element) {
        const parent = element.parentElement;
        if (!parent) return null;
        
        const detectionConfig = this.configManager.getConfig().detection;
        const siblings = Array.from(parent.children);
        const images = siblings.filter(el => 
            el.tagName === 'IMG' && 
            el.offsetWidth > detectionConfig.minWidth && 
            el.offsetHeight > detectionConfig.minHeight
        );
        
        // 最大の画像を選択
        return images.sort((a, b) => 
            (b.offsetWidth * b.offsetHeight) - (a.offsetWidth * a.offsetHeight)
        )[0] || null;
    }
    
    /**
     * セクションコンテナの検出 (ヒーロー画像優先)
     */
    findSectionContainer(element) {
        // 🎯 ヒーロー画像要素を最優先で検出
        const heroImageContainers = [
            element.closest('.hero-section'),  // ヒーロー画像セクション
            element.closest('.hero-image'),    // ヒーロー画像専用クラス
            document.querySelector('.hero-section'), // グローバル検索
            document.querySelector('.hero-image'),   // グローバル検索
        ];
        
        // ヒーロー画像コンテナを最優先で確認
        for (const container of heroImageContainers) {
            if (container && this.validateBackgroundElement(container)) {
                console.log('🎯 ヒーロー画像コンテナ検出成功:', this.getElementInfo(container));
                return container;
            }
        }
        
        // フォールバック: 一般的なコンテナ検索
        const fallbackContainers = [
            element.closest('section'),
            element.closest('.container'),
            element.closest('main')
        ];
        
        const detectionConfig = this.configManager.getConfig().detection;
        return fallbackContainers.find(el => 
            el && 
            el.offsetWidth > detectionConfig.minWidth && 
            el.offsetHeight > detectionConfig.minHeight
        ) || null;
    }
    
    /**
     * メインコンテナの検出
     */
    findMainContainer(element) {
        const mainSelectors = [
            '#main-content',
            '.main-content',
            '[role="main"]',
            '.page-wrapper',
            '.content-wrapper'
        ];
        
        for (const selector of mainSelectors) {
            const container = document.querySelector(selector);
            if (container && this.validateBackgroundElement(container)) {
                return container;
            }
        }
        
        return null;
    }
    
    /**
     * 背景要素の妥当性検証
     */
    validateBackgroundElement(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const detectionConfig = this.configManager.getConfig().detection;
        
        // サイズ確認
        if (rect.width < detectionConfig.minWidth || 
            rect.height < detectionConfig.minHeight) {
            return false;
        }
        
        // 表示確認
        if (rect.width === 0 || rect.height === 0) {
            return false;
        }
        
        // スタイル確認
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') {
            return false;
        }
        
        return true;
    }
    
    // ==========================================
    // 🎯 内容矩形計算システム (Content Rect Based)
    // ==========================================
    
    /**
     * 要素の内容矩形を計算
     * - IMG要素: naturalSize + object-fit/position から実際の表示矩形
     * - background-image: background-size/position から内容矩形
     * - その他: getBoundingClientRect()をそのまま使用
     */
    calculateContentRect(element) {
        if (!element) {
            console.error('❌ calculateContentRect: 要素がnull');
            return null;
        }
        
        const tagName = element.tagName.toLowerCase();
        const computedStyle = window.getComputedStyle(element);
        const boundingRect = element.getBoundingClientRect();
        
        console.log('🔍 内容矩形計算開始:', {
            tagName: tagName,
            elementId: element.id,
            boundingRect: `${boundingRect.width.toFixed(1)}×${boundingRect.height.toFixed(1)}`
        });
        
        if (tagName === 'img') {
            return this.calculateImageContentRect(element, computedStyle, boundingRect);
        } else if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
            return this.calculateBackgroundImageContentRect(element, computedStyle, boundingRect);
        } else {
            // その他の要素: サイズのみを使用（位置はウィンドウ非依存）
            console.log('🔍 通常要素: サイズベース（ウィンドウ非依存）');
            return {
                x: 0, // 相対位置ベース
                y: 0, // 相対位置ベース  
                width: boundingRect.width,
                height: boundingRect.height,
                scaleX: 1,
                scaleY: 1,
                type: 'normal',
                containerRect: boundingRect // 元の位置情報は参考用として保持
            };
        }
    }
    
    /**
     * IMG要素の内容矩形計算
     */
    calculateImageContentRect(img, computedStyle, boundingRect) {
        const naturalWidth = img.naturalWidth || img.width || 0;
        const naturalHeight = img.naturalHeight || img.height || 0;
        
        if (naturalWidth === 0 || naturalHeight === 0) {
            console.warn('⚠️ 画像の自然サイズが取得できません - 外枠を使用');
            return {
                x: 0, // 相対位置ベース
                y: 0, // 相対位置ベース
                width: boundingRect.width,
                height: boundingRect.height,
                scaleX: 1,
                scaleY: 1,
                type: 'img-fallback',
                containerRect: boundingRect // 元の位置情報は参考用として保持
            };
        }
        
        const objectFit = computedStyle.objectFit || 'fill';
        const containerWidth = boundingRect.width;
        const containerHeight = boundingRect.height;
        
        let contentRect;
        
        switch (objectFit) {
            case 'cover':
                contentRect = this.calculateObjectFitCover(naturalWidth, naturalHeight, containerWidth, containerHeight);
                break;
            case 'contain':
                contentRect = this.calculateObjectFitContain(naturalWidth, naturalHeight, containerWidth, containerHeight);
                break;
            case 'fill':
            default:
                contentRect = { width: containerWidth, height: containerHeight, offsetX: 0, offsetY: 0 };
                break;
        }
        
        const result = {
            x: contentRect.offsetX, // 相対オフセットのみ
            y: contentRect.offsetY, // 相対オフセットのみ
            width: contentRect.width,
            height: contentRect.height,
            scaleX: contentRect.width / naturalWidth,
            scaleY: contentRect.height / naturalHeight,
            type: 'img',
            objectFit: objectFit,
            containerRect: boundingRect // 元の位置情報は参考用として保持
        };
        
        console.log('🎯 IMG内容矩形計算完了:', {
            naturalSize: `${naturalWidth}×${naturalHeight}`,
            containerSize: `${containerWidth.toFixed(1)}×${containerHeight.toFixed(1)}`,
            contentSize: `${result.width.toFixed(1)}×${result.height.toFixed(1)}`,
            scale: `${result.scaleX.toFixed(3)}×${result.scaleY.toFixed(3)}`,
            objectFit: objectFit
        });
        
        return result;
    }
    
    /**
     * object-fit: cover の矩形計算
     */
    calculateObjectFitCover(naturalWidth, naturalHeight, containerWidth, containerHeight) {
        const imageRatio = naturalWidth / naturalHeight;
        const containerRatio = containerWidth / containerHeight;
        
        let width, height, offsetX, offsetY;
        
        if (imageRatio > containerRatio) {
            // 画像の方が横長 → 高さ基準
            height = containerHeight;
            width = height * imageRatio;
            offsetX = (containerWidth - width) / 2;
            offsetY = 0;
        } else {
            // 画像の方が縦長 → 幅基準
            width = containerWidth;
            height = width / imageRatio;
            offsetX = 0;
            offsetY = (containerHeight - height) / 2;
        }
        
        return { width, height, offsetX, offsetY };
    }
    
    /**
     * object-fit: contain の矩形計算
     */
    calculateObjectFitContain(naturalWidth, naturalHeight, containerWidth, containerHeight) {
        const imageRatio = naturalWidth / naturalHeight;
        const containerRatio = containerWidth / containerHeight;
        
        let width, height, offsetX, offsetY;
        
        if (imageRatio > containerRatio) {
            // 画像の方が横長 → 幅基準
            width = containerWidth;
            height = width / imageRatio;
            offsetX = 0;
            offsetY = (containerHeight - height) / 2;
        } else {
            // 画像の方が縦長 → 高さ基準
            height = containerHeight;
            width = height * imageRatio;
            offsetX = (containerWidth - width) / 2;
            offsetY = 0;
        }
        
        return { width, height, offsetX, offsetY };
    }
    
    /**
     * background-image要素の内容矩形計算
     */
    calculateBackgroundImageContentRect(element, computedStyle, boundingRect) {
        const backgroundSize = computedStyle.backgroundSize || 'auto';
        const backgroundPosition = computedStyle.backgroundPosition || '0% 0%';
        
        console.log('🔍 background-image内容矩形計算:', {
            backgroundSize: backgroundSize,
            backgroundPosition: backgroundPosition,
            containerSize: { width: boundingRect.width, height: boundingRect.height }
        });
        
        // 背景画像のURLを取得して画像サイズを推定
        const backgroundImageUrl = this.extractBackgroundImageUrl(computedStyle.backgroundImage);
        
        if (backgroundImageUrl) {
            // 新しい画像オブジェクトで自然サイズを取得
            return this.getBackgroundImageNaturalSize(backgroundImageUrl, backgroundSize, boundingRect, element);
        }
        
        // 画像サイズが取得できない場合の改良されたフォールバック
        console.log('⚠️ 背景画像サイズ取得失敗 - 改良されたフォールバック計算');
        
        if (backgroundSize === 'cover') {
            // cover時の一般的な画像アスペクト比を仮定（16:9, 4:3, 1:1の中から最適を選択）
            const containerRatio = boundingRect.width / boundingRect.height;
            const commonRatios = [
                { ratio: 16/9, name: '16:9' },
                { ratio: 4/3, name: '4:3' },
                { ratio: 1, name: '1:1' },
                { ratio: 3/4, name: '3:4' },
                { ratio: 9/16, name: '9:16' }
            ];
            
            // コンテナ比に最も近いアスペクト比を選択
            const selectedRatio = commonRatios.reduce((prev, curr) => {
                return Math.abs(curr.ratio - containerRatio) < Math.abs(prev.ratio - containerRatio) ? curr : prev;
            });
            
            console.log('📐 推定アスペクト比:', selectedRatio.name, 'コンテナ比:', containerRatio.toFixed(3));
            
            // 推定アスペクト比でcover計算
            return this.calculateBackgroundCover(selectedRatio.ratio * 100, 100, boundingRect.width, boundingRect.height);
        }
        
        // contain または auto の場合はコンテナサイズを返す
        return {
            x: 0,
            y: 0,
            width: boundingRect.width,
            height: boundingRect.height,
            scaleX: 1,
            scaleY: 1,
            type: 'background-fallback',
            containerRect: boundingRect
        };
    }
    
    /**
     * 背景画像のURLを抽出
     */
    extractBackgroundImageUrl(backgroundImage) {
        if (!backgroundImage || backgroundImage === 'none') return null;
        
        const urlMatch = backgroundImage.match(/url\(["']?([^"']+)["']?\)/);
        return urlMatch ? urlMatch[1] : null;
    }
    
    /**
     * 背景画像の自然サイズを取得
     */
    getBackgroundImageNaturalSize(imageUrl, backgroundSize, boundingRect, element) {
        // 既に読み込まれた画像があるかチェック
        const existingImages = document.querySelectorAll('img');
        
        for (const img of existingImages) {
            if (img.src === imageUrl || img.src.endsWith(imageUrl)) {
                console.log('🎯 既存画像から自然サイズ取得:', {
                    naturalSize: `${img.naturalWidth}×${img.naturalHeight}`,
                    src: imageUrl
                });
                
                return this.calculateBackgroundRect(
                    img.naturalWidth, 
                    img.naturalHeight, 
                    backgroundSize, 
                    boundingRect
                );
            }
        }
        
        // フォールバック: コンテナサイズを使用
        console.log('⚠️ 背景画像自然サイズ取得失敗 - コンテナサイズ使用');
        return {
            x: 0,
            y: 0,
            width: boundingRect.width,
            height: boundingRect.height,
            scaleX: 1,
            scaleY: 1,
            type: 'background-container',
            containerRect: boundingRect
        };
    }
    
    /**
     * 背景画像の矩形計算
     */
    calculateBackgroundRect(naturalWidth, naturalHeight, backgroundSize, boundingRect) {
        if (backgroundSize === 'cover') {
            return this.calculateBackgroundCover(naturalWidth, naturalHeight, boundingRect.width, boundingRect.height);
        } else if (backgroundSize === 'contain') {
            return this.calculateBackgroundContain(naturalWidth, naturalHeight, boundingRect.width, boundingRect.height);
        } else {
            // auto または具体的な値の場合はコンテナサイズを使用
            return {
                x: 0,
                y: 0,
                width: boundingRect.width,
                height: boundingRect.height,
                scaleX: boundingRect.width / naturalWidth,
                scaleY: boundingRect.height / naturalHeight,
                type: 'background-auto',
                containerRect: boundingRect
            };
        }
    }
    
    /**
     * background-size: cover の計算
     */
    calculateBackgroundCover(naturalWidth, naturalHeight, containerWidth, containerHeight) {
        const imageRatio = naturalWidth / naturalHeight;
        const containerRatio = containerWidth / containerHeight;
        
        let width, height, offsetX, offsetY;
        
        if (imageRatio > containerRatio) {
            height = containerHeight;
            width = height * imageRatio;
            offsetX = (containerWidth - width) / 2;
            offsetY = 0;
        } else {
            width = containerWidth;
            height = width / imageRatio;
            offsetX = 0;
            offsetY = (containerHeight - height) / 2;
        }
        
        return {
            x: offsetX,
            y: offsetY,
            width: width,
            height: height,
            scaleX: width / naturalWidth,
            scaleY: height / naturalHeight,
            type: 'background-cover',
            containerRect: { width: containerWidth, height: containerHeight }
        };
    }
    
    /**
     * background-size: contain の計算
     */
    calculateBackgroundContain(naturalWidth, naturalHeight, containerWidth, containerHeight) {
        const imageRatio = naturalWidth / naturalHeight;
        const containerRatio = containerWidth / containerHeight;
        
        let width, height, offsetX, offsetY;
        
        if (imageRatio > containerRatio) {
            width = containerWidth;
            height = width / imageRatio;
            offsetX = 0;
            offsetY = (containerHeight - height) / 2;
        } else {
            height = containerHeight;
            width = height * imageRatio;
            offsetX = (containerWidth - width) / 2;
            offsetY = 0;
        }
        
        return {
            x: offsetX,
            y: offsetY,
            width: width,
            height: height,
            scaleX: width / naturalWidth,
            scaleY: height / naturalHeight,
            type: 'background-contain',
            containerRect: { width: containerWidth, height: containerHeight }
        };
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
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.BackgroundDetector = BackgroundDetector;
}