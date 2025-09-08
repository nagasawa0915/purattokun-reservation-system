/**
 * findContainer - 原点コンテナ決定（最近接positioned祖先 or body）
 * 
 * 座標計算の原点となる安定した親要素を特定する。
 * CSS position が static でない要素（relative, absolute, fixed, sticky）を
 * 祖先から順に探し、見つからない場合は body を返す。
 * 
 * この関数が重要な理由:
 * - getBoundingClientRect() はビューポート基準だが、実際の配置は親要素基準
 * - position: relative/absolute の親要素が座標系の原点になる
 * - 間違った原点を選ぶと、後の座標計算が全てずれる
 */

/**
 * 指定要素の座標原点となるコンテナ要素を特定
 * @param {HTMLElement} element - 対象要素
 * @returns {HTMLElement} 原点コンテナ要素
 */
export function findContainer(element) {
    if (!element || !(element instanceof HTMLElement)) {
        console.warn('⚠️ findContainer: Invalid element provided, using document.body');
        return document.body;
    }
    
    let current = element.parentElement;
    
    while (current && current !== document.body) {
        const computedStyle = getComputedStyle(current);
        const position = computedStyle.position;
        
        // positioned要素（static以外）を発見
        if (position !== 'static') {
            console.log(`🎯 Container found: ${current.tagName}${current.id ? '#' + current.id : ''}${current.className ? '.' + current.className.split(' ')[0] : ''} (position: ${position})`);
            return current;
        }
        
        current = current.parentElement;
    }
    
    // positioned要素が見つからない場合はbodyを返す
    console.log('🎯 Container: document.body (no positioned ancestor found)');
    return document.body;
}

/**
 * コンテナとして適切な要素かチェック
 * @param {HTMLElement} element - チェック対象要素
 * @returns {boolean} コンテナとして適切か
 */
export function isValidContainer(element) {
    if (!element || !(element instanceof HTMLElement)) {
        return false;
    }
    
    const computedStyle = getComputedStyle(element);
    const position = computedStyle.position;
    
    // positioned要素、またはbody/html要素の場合は有効
    return position !== 'static' || element === document.body || element === document.documentElement;
}

/**
 * 要素の階層パスを取得（デバッグ用）
 * @param {HTMLElement} element - 対象要素
 * @returns {string} 階層パス
 */
export function getElementPath(element) {
    const path = [];
    let current = element;
    
    while (current && current !== document) {
        let selector = current.tagName.toLowerCase();
        
        if (current.id) {
            selector += '#' + current.id;
        } else if (current.className) {
            const classList = current.className.trim().split(/\s+/);
            selector += '.' + classList[0];
        }
        
        path.unshift(selector);
        current = current.parentElement;
    }
    
    return path.join(' > ');
}

/**
 * 座標系診断情報を取得
 * @param {HTMLElement} element - 対象要素
 * @returns {Object} 診断情報
 */
export function diagnoseCoordinateSystem(element) {
    const container = findContainer(element);
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    const diagnosis = {
        element: {
            path: getElementPath(element),
            position: getComputedStyle(element).position,
            rect: {
                x: elementRect.x,
                y: elementRect.y,
                width: elementRect.width,
                height: elementRect.height
            }
        },
        container: {
            path: getElementPath(container),
            position: getComputedStyle(container).position,
            rect: {
                x: containerRect.x,
                y: containerRect.y,
                width: containerRect.width,
                height: containerRect.height
            }
        },
        offset: {
            x: elementRect.x - containerRect.x,
            y: elementRect.y - containerRect.y
        }
    };
    
    return diagnosis;
}

/**
 * デバッグ用: 座標系診断結果をコンソールに出力
 * @param {HTMLElement} element - 診断対象要素
 */
export function debugCoordinateSystem(element) {
    const diagnosis = diagnoseCoordinateSystem(element);
    
    console.group('🔍 Coordinate System Diagnosis');
    console.log('📍 Element:', diagnosis.element.path);
    console.log('  Position:', diagnosis.element.position);
    console.log('  Rect:', diagnosis.element.rect);
    console.log('📦 Container:', diagnosis.container.path);
    console.log('  Position:', diagnosis.container.position);
    console.log('  Rect:', diagnosis.container.rect);
    console.log('📐 Relative Offset:', diagnosis.offset);
    console.groupEnd();
    
    return diagnosis;
}

/**
 * 複雑なネスト構造での原点取得テスト用ヘルパー
 * @param {HTMLElement} element - テスト対象要素
 * @returns {Object} テスト結果
 */
export function testNestedContainerSearch(element) {
    const results = [];
    let current = element;
    
    while (current && current !== document.body) {
        const computedStyle = getComputedStyle(current);
        const position = computedStyle.position;
        const rect = current.getBoundingClientRect();
        
        results.push({
            element: current,
            tagName: current.tagName,
            id: current.id || null,
            className: current.className || null,
            position: position,
            isPositioned: position !== 'static',
            rect: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
            }
        });
        
        current = current.parentElement;
    }
    
    // body も追加
    if (document.body) {
        const bodyRect = document.body.getBoundingClientRect();
        results.push({
            element: document.body,
            tagName: 'BODY',
            id: null,
            className: document.body.className || null,
            position: getComputedStyle(document.body).position,
            isPositioned: true, // body は常に有効なコンテナ
            rect: {
                x: bodyRect.x,
                y: bodyRect.y,
                width: bodyRect.width,
                height: bodyRect.height
            }
        });
    }
    
    return {
        hierarchyChain: results,
        selectedContainer: findContainer(element),
        totalLevels: results.length
    };
}

// メイン関数のエクスポート
export { findContainer, isValidContainer, getElementPath, diagnoseCoordinateSystem, debugCoordinateSystem, testNestedContainerSearch };