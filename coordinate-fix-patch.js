// 🔧 位置データ不整合問題の修正パッチ
// 問題: v2.0編集システムの%座標 ≠ HTML設定システムのvw/vh座標

// 修正案1: 正確なvw/vh変換関数
function convertPercentToVwVh(percentValue, axis) {
    // axis: 'x' for horizontal, 'y' for vertical
    
    // パーセント値からvw/vh値への変換
    // 編集システム: left: 18% (中心点基準)
    // → HTML設定: data-x="18" (vw基準、左端基準)
    
    const numericValue = parseFloat(percentValue);
    
    if (axis === 'x') {
        // 横軸: %値をvw値に変換
        // 中心点基準の18% → 左端基準のvw値に変換が必要
        return numericValue;  // 暫定: 1:1変換（要調整）
    } else if (axis === 'y') {
        // 縦軸: %値をvh値に変換
        return numericValue;  // 暫定: 1:1変換（要調整）
    }
}

// 修正案2: data-*属性正確生成
function generateCorrectDataAttributes(element, char) {
    const leftPercent = parseFloat(element.style.left) || 0;
    const topPercent = parseFloat(element.style.top) || 0;
    
    return {
        'data-x': convertPercentToVwVh(leftPercent, 'x'), 
        'data-y': convertPercentToVwVh(topPercent, 'y'),
        'data-scale': char.scale || 1.0,
        'data-z-index': char.zIndex || 1000
    };
}
EOF < /dev/null
