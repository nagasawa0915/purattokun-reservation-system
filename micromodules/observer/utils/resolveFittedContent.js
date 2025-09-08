/**
 * resolveFittedContent - object-fit/position余白補正の完全実装
 * 
 * object-fit の仕様:
 * - contain: アスペクト比を保持し、要素内に完全に収める（余白発生）
 * - cover: アスペクト比を保持し、要素を完全に覆う（はみ出し発生）  
 * - fill: アスペクト比を無視し、要素サイズに合わせて変形
 * - none: 元サイズのまま配置（中央配置）
 * 
 * object-position の仕様:
 * - パーセンテージ: "0% 0%" = 左上, "50% 50%" = 中央, "100% 100%" = 右下
 * - ピクセル値: "10px 20px" = 左から10px, 上から20px
 * - キーワード: "left top" = 左上, "center" = 中央, "right bottom" = 右下
 */

/**
 * object-fit による content 領域とパディングを計算
 * @param {DOMRect} rect - 要素の getBoundingClientRect() 結果
 * @param {Object} logicalSize - 論理サイズ {w: number, h: number}
 * @param {string} fit - "contain" | "cover" | "fill" | "none"
 * @param {string} objectPosition - object-position 値（例: "50% 50%", "left top"）
 * @returns {Object} { contentW: number, contentH: number, padX: number, padY: number }
 */
export function resolveFittedContent(rect, logicalSize, fit = "contain", objectPosition = "50% 50%") {
    const { w: logicalW, h: logicalH } = logicalSize;
    const { width: rectW, height: rectH } = rect;
    
    let contentW, contentH, padX, padY;
    
    switch (fit) {
        case "contain": {
            // アスペクト比を保持し、要素内に完全に収める
            const scale = Math.min(rectW / logicalW, rectH / logicalH);
            contentW = logicalW * scale;
            contentH = logicalH * scale;
            break;
        }
        
        case "cover": {
            // アスペクト比を保持し、要素を完全に覆う
            const scale = Math.max(rectW / logicalW, rectH / logicalH);
            contentW = logicalW * scale;
            contentH = logicalH * scale;
            break;
        }
        
        case "fill": {
            // アスペクト比を無視し、要素サイズに変形
            contentW = rectW;
            contentH = rectH;
            break;
        }
        
        case "none": {
            // 元サイズのまま配置
            contentW = logicalW;
            contentH = logicalH;
            break;
        }
        
        default:
            throw new Error(`Unsupported fit mode: ${fit}`);
    }
    
    // object-position によるパディング計算
    const { padX: posX, padY: posY } = parseObjectPosition(objectPosition, rectW - contentW, rectH - contentH);
    padX = posX;
    padY = posY;
    
    return { contentW, contentH, padX, padY };
}

/**
 * object-position 文字列をパース・パディング値に変換
 * @param {string} position - object-position 値
 * @param {number} availableW - 水平方向の利用可能余白
 * @param {number} availableH - 垂直方向の利用可能余白
 * @returns {Object} { padX: number, padY: number }
 */
function parseObjectPosition(position, availableW, availableH) {
    // 正規化: 複数スペースを単一スペースに、前後の空白を削除
    const normalized = position.trim().replace(/\s+/g, ' ');
    const parts = normalized.split(' ');
    
    let xValue = "50%", yValue = "50%"; // デフォルト値
    
    if (parts.length === 1) {
        // 単一値の場合
        if (isKeyword(parts[0])) {
            const { x, y } = keywordToPercent(parts[0]);
            xValue = x;
            yValue = y;
        } else {
            xValue = parts[0];
            yValue = "50%"; // Y軸はデフォルト
        }
    } else if (parts.length >= 2) {
        // 2値以上の場合（3値以上は現在非対応、最初の2値を使用）
        xValue = parts[0];
        yValue = parts[1];
        
        // キーワードの場合は変換
        if (isKeyword(xValue)) {
            xValue = keywordToPercent(xValue).x;
        }
        if (isKeyword(yValue)) {
            yValue = keywordToPercent(yValue).y;
        }
    }
    
    // パーセンテージ・ピクセル値をパディング値に変換
    const padX = convertPositionValue(xValue, availableW);
    const padY = convertPositionValue(yValue, availableH);
    
    return { padX, padY };
}

/**
 * 値がキーワード（left, center, right, top, bottom）かチェック
 * @param {string} value - チェックする値
 * @returns {boolean}
 */
function isKeyword(value) {
    const keywords = ["left", "center", "right", "top", "bottom"];
    return keywords.includes(value.toLowerCase());
}

/**
 * キーワードをパーセンテージに変換
 * @param {string} keyword - キーワード
 * @returns {Object} { x: string, y: string }
 */
function keywordToPercent(keyword) {
    const lower = keyword.toLowerCase();
    
    const mapping = {
        "left": { x: "0%", y: "50%" },
        "center": { x: "50%", y: "50%" },
        "right": { x: "100%", y: "50%" },
        "top": { x: "50%", y: "0%" },
        "bottom": { x: "50%", y: "100%" }
    };
    
    return mapping[lower] || { x: "50%", y: "50%" };
}

/**
 * position値（パーセンテージ・ピクセル）を実際のパディング値に変換
 * @param {string} value - position値（例: "50%", "10px"）
 * @param {number} availableSpace - 利用可能な余白サイズ
 * @returns {number} パディング値
 */
function convertPositionValue(value, availableSpace) {
    const trimmed = value.trim();
    
    if (trimmed.endsWith('%')) {
        // パーセンテージの場合
        const percent = parseFloat(trimmed.slice(0, -1));
        return availableSpace * (percent / 100);
    } else if (trimmed.endsWith('px')) {
        // ピクセル値の場合
        return parseFloat(trimmed.slice(0, -2));
    } else if (!isNaN(parseFloat(trimmed))) {
        // 数値のみの場合はピクセル値として扱う
        return parseFloat(trimmed);
    }
    
    // 解析できない場合はデフォルト（中央配置）
    return availableSpace / 2;
}

/**
 * デバッグ用: 計算結果をコンソールに出力
 * @param {DOMRect} rect - 要素サイズ
 * @param {Object} logicalSize - 論理サイズ
 * @param {string} fit - fit モード
 * @param {string} objectPosition - position 値
 * @param {Object} result - 計算結果
 */
export function debugFittedContent(rect, logicalSize, fit, objectPosition, result) {
    console.group(`🔍 resolveFittedContent Debug`);
    console.log(`📦 Element Size: ${rect.width}×${rect.height}`);
    console.log(`📏 Logical Size: ${logicalSize.w}×${logicalSize.h}`);
    console.log(`🎯 Fit Mode: ${fit}`);
    console.log(`📍 Object Position: ${objectPosition}`);
    console.log(`✅ Content Size: ${result.contentW.toFixed(2)}×${result.contentH.toFixed(2)}`);
    console.log(`📐 Padding: X=${result.padX.toFixed(2)}, Y=${result.padY.toFixed(2)}`);
    
    // スケール計算
    const scaleX = result.contentW / logicalSize.w;
    const scaleY = result.contentH / logicalSize.h;
    console.log(`⚖️ Scale: X=${scaleX.toFixed(4)}, Y=${scaleY.toFixed(4)}`);
    
    console.groupEnd();
}

// メイン関数のエクスポート (debugFittedContentは関数宣言時にexport済み)
export { resolveFittedContent };

// 単体テスト用のエクスポート
export { parseObjectPosition, convertPositionValue, keywordToPercent };