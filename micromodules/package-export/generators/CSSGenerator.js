// 🎯 パッケージ出力システム - CSS生成モジュール
// 意味単位: 位置データ→CSS変換
// 複雑度: 中（CSS生成・2層座標システム対応）

console.log('🎨 CSSGenerator モジュール読み込み開始');

/**
 * 🎨 CSS生成クラス
 * 
 * 【責務】
 * - 位置データから2層座標システム準拠のCSS生成
 * - 全キャラクター対応CSS統合
 * - CSS優先度・競合問題の解決
 * 
 * 【2層座標システム対応】
 * - Layer 1: CSS基本配置（position, left, top, width, height）
 * - Layer 2: transform制御（中心点基準の微調整）
 */
export class CSSGenerator {
    constructor() {
        this.generatedCSS = '';
    }
    
    // 🎨 全キャラクター用CSS生成（完全パッケージ版）
    generateAllCharactersCSS(allPositionData) {
        console.log('🎨 全キャラクター用CSS生成開始', Object.keys(allPositionData));
        
        let allCSS = '';
        
        for (const [characterName, positionData] of Object.entries(allPositionData)) {
            console.log(`🎨 ${characterName}用CSS生成`);
            
            const characterCSS = this.generateCharacterCSS(characterName, positionData);
            allCSS += characterCSS + '\n';
            
            console.log(`  ✅ ${characterName}: CSS生成完了`);
        }
        
        console.log('✅ 全キャラクター用CSS生成完了');
        return allCSS;
    }
    
    // 個別キャラクターCSS生成
    generateCharacterCSS(characterName, positionData) {
        const cssLines = [];
        
        // Layer 1: CSS基本配置
        if (positionData.left) cssLines.push(`            left: ${positionData.left};`);
        if (positionData.top) cssLines.push(`            top: ${positionData.top};`);
        if (positionData.width) cssLines.push(`            width: ${positionData.width};`);
        if (positionData.height && positionData.height !== 'auto') {
            cssLines.push(`            height: ${positionData.height};`);
        }
        
        // Layer 2: transform制御
        if (positionData.transform) {
            cssLines.push(`            transform: ${positionData.transform};`);
        }
        
        // 品質保証：重要なCSS属性
        cssLines.push(`            position: absolute;`);
        cssLines.push(`            /* ${characterName}位置データ（パッケージ固定化） */`);
        
        const characterCSS = cssLines.join('\n') + '\n';
        
        // キャラクター固有セレクターでスタイルを定義
        return `        #${characterName}-canvas {\n${characterCSS}        }`;
    }
    
    // 2層座標システム準拠のCSS生成（汎用版）
    generateCoordinateCSS(positionData) {
        console.log('🎨 2層座標システム準拠CSS生成', positionData);
        
        const cssLines = [];
        
        // Layer 1: CSS基本配置（position, left, top, width, height）
        if (positionData.left) cssLines.push(`            left: ${positionData.left};`);
        if (positionData.top) cssLines.push(`            top: ${positionData.top};`);
        if (positionData.width) cssLines.push(`            width: ${positionData.width};`);
        if (positionData.height && positionData.height !== 'auto') {
            cssLines.push(`            height: ${positionData.height};`);
        }
        
        // Layer 2: transform制御（中心点基準の微調整）
        if (positionData.transform) {
            cssLines.push(`            transform: ${positionData.transform};`);
        }
        
        // 品質保証：重要なCSS属性も含める
        cssLines.push(`            position: absolute;`);
        cssLines.push(`            /* パッケージ固定化: localStorage位置データより生成 */`);
        
        const coordinateCSS = cssLines.join('\n') + '\n';
        console.log('🔧 生成CSS:', coordinateCSS);
        
        return coordinateCSS;
    }
    
    // CSSスタイルブロック生成
    generateStyleBlock(allPositionData) {
        const allCharactersCSS = this.generateAllCharactersCSS(allPositionData);
        
        const styleBlock = `    <style>
        /* 📦 パッケージ固定化: localStorage位置データより生成（全キャラクター対応） */
${allCharactersCSS}    </style>`;
        
        return styleBlock;
    }
    
    // レスポンシブ対応CSS生成
    generateResponsiveCSS(characterName, positionData, breakpoints = {}) {
        let responsiveCSS = this.generateCharacterCSS(characterName, positionData);
        
        // メディアクエリ対応（必要に応じて拡張）
        if (breakpoints.mobile && Object.keys(breakpoints.mobile).length > 0) {
            const mobileCSS = this.generateCharacterCSS(characterName, breakpoints.mobile);
            responsiveCSS += `\n\n        @media (max-width: 768px) {\n${mobileCSS}\n        }`;
        }
        
        return responsiveCSS;
    }
    
    // CSS値の正規化・検証
    normalizeCSS(cssValue, property) {
        if (!cssValue || typeof cssValue !== 'string') {
            return this.getDefaultCSSValue(property);
        }
        
        // 既に適切な形式かチェック
        if (cssValue.includes('%') || cssValue.includes('px') || cssValue === 'auto') {
            return cssValue;
        }
        
        // 数値のみの場合はpxを追加
        if (/^\d+(\.\d+)?$/.test(cssValue)) {
            return cssValue + 'px';
        }
        
        return cssValue; // その他はそのまま
    }
    
    // デフォルトCSS値取得
    getDefaultCSSValue(property) {
        const defaults = {
            left: '35%',
            top: '75%',
            width: '25%',
            height: 'auto',
            transform: 'translate(-50%, -50%)'
        };
        
        return defaults[property] || 'auto';
    }
    
    // CSS生成統計取得
    getGenerationStats(allPositionData) {
        const stats = {
            totalCharacters: Object.keys(allPositionData).length,
            propertiesUsed: new Set(),
            cssLines: 0
        };
        
        for (const [characterName, positionData] of Object.entries(allPositionData)) {
            Object.keys(positionData).forEach(prop => {
                stats.propertiesUsed.add(prop);
            });
            
            // 推定行数計算（大まかな見積もり）
            stats.cssLines += Object.keys(positionData).length + 3; // +3 for selector and comments
        }
        
        stats.propertiesUsed = Array.from(stats.propertiesUsed);
        
        return stats;
    }
    
    // CSS生成レポート出力
    logGenerationReport(allPositionData) {
        const stats = this.getGenerationStats(allPositionData);
        
        console.log('📊 CSS生成レポート:');
        console.log(`  🎯 対象キャラクター数: ${stats.totalCharacters}個`);
        console.log(`  📐 使用CSS属性: [${stats.propertiesUsed.join(', ')}]`);
        console.log(`  📝 推定CSS行数: ${stats.cssLines}行`);
        
        // 各キャラクターの詳細
        console.log('\n📋 キャラクター別CSS属性:');
        for (const [characterName, positionData] of Object.entries(allPositionData)) {
            const props = Object.keys(positionData).filter(prop => positionData[prop]);
            console.log(`  🐈 ${characterName}: [${props.join(', ')}]`);
        }
    }
    
    // CSSファイル出力用フォーマット（将来拡張用）
    formatAsFile(allPositionData, filename = 'spine-positions.css') {
        const fileHeader = `/* 🎯 Spine位置固定化CSS - 自動生成 */
/* 生成日時: ${new Date().toISOString()} */
/* キャラクター数: ${Object.keys(allPositionData).length}個 */

`;
        
        const cssContent = this.generateAllCharactersCSS(allPositionData);
        
        return {
            filename,
            content: fileHeader + cssContent,
            size: (fileHeader + cssContent).length
        };
    }
}

console.log('✅ CSSGenerator モジュール読み込み完了');