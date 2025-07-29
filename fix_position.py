# ファイルを読み込み
with open('spine-positioning-system-explanation.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 修正対象の行を特定して置換
old_code = '''        } else {
            // 新規ラッパー作成
            const actualRect = character.getBoundingClientRect();
            const actualWidth = actualRect.width;
            const actualHeight = actualRect.height;
            
            const characterWrapper = document.createElement('div');
            characterWrapper.className = 'character-wrapper demo-character';
            characterWrapper.style.cssText = `
                position: absolute;
                left: ${character.style.left || '35%'};
                top: ${character.style.top || '75%'};
                width: ${actualWidth}px;
                height: ${actualHeight}px;'''

new_code = '''        } else {
            // 🎯 修正: 実際のCSS計算値を正確に取得
            const computedStyle = window.getComputedStyle(character);
            const parentRect = character.parentElement.getBoundingClientRect();
            
            const actualLeftPx = parseFloat(computedStyle.left);
            const actualTopPx = parseFloat(computedStyle.top);
            const actualWidthPx = parseFloat(computedStyle.width);
            const actualHeightPx = parseFloat(computedStyle.height);
            
            const actualLeftPercent = ((actualLeftPx / parentRect.width) * 100).toFixed(1);
            const actualTopPercent = ((actualTopPx / parentRect.height) * 100).toFixed(1);
            
            console.log('🔧 ラッパー位置計算（修正版）:', {
                computed_left: actualLeftPx + 'px → ' + actualLeftPercent + '%',
                computed_top: actualTopPx + 'px → ' + actualTopPercent + '%',
                width: actualWidthPx + 'px',
                height: actualHeightPx + 'px'
            });
            
            const characterWrapper = document.createElement('div');
            characterWrapper.className = 'character-wrapper demo-character';
            characterWrapper.style.cssText = `
                position: absolute;
                left: ${actualLeftPercent}%;
                top: ${actualTopPercent}%;
                width: ${actualWidthPx}px;
                height: ${actualHeightPx}px;'''

# 置換実行
content = content.replace(old_code, new_code)

# ファイルに書き戻し
with open('spine-positioning-system-explanation.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 位置ジャンプ修正完了")
EOF < /dev/null
