// 🎯 Spine編集システム - CSS出力モジュール v1.0
// 役割：制作チーム専用の商用品質CSS生成・出力機能

console.log('📋 CSS出力モジュール読み込み開始');

// ========== CSS出力システム設定 ========== //

const CSS_EXPORT_CONFIG = {
    // 出力形式設定
    formats: {
        'individual': {
            name: '個別セレクター（推奨）',
            description: '各キャラクターに専用CSS',
            extension: '.css'
        },
        'generic': {
            name: '汎用クラス',
            description: '再利用可能なCSS構造',
            extension: '.css'
        },
        'compressed': {
            name: '圧縮（本番用）',
            description: '最小化された本番用CSS',
            extension: '.min.css'
        },
        'commented': {
            name: 'コメント付き（開発用）',
            description: '詳細コメント付きCSS',
            extension: '.dev.css'
        }
    },
    
    // 精度設定
    precision: {
        position: 1, // 位置：小数点1桁（0.1%精度）
        scale: 3,    // スケール：小数点3桁（0.001精度）
        zIndex: 0    // z-index：整数
    },
    
    // ブラウザ互換性
    compatibility: {
        prefixes: true,        // ベンダープレフィックス追加
        fallbacks: true,       // フォールバック値追加
        modernOnly: false      // モダンブラウザ専用モード
    },
    
    // メタデータ設定
    metadata: {
        includeTimestamp: true,
        includeProjectInfo: true,
        includeGeneratorInfo: true,
        includeUsageInstructions: true
    }
};

// ========== CSS生成エンジン ========== //

/**
 * メインCSS生成関数
 * @param {string} format - 出力形式 ('individual'|'generic'|'compressed'|'commented')
 * @param {Object} options - オプション設定
 * @returns {string} 生成されたCSS
 */
function generateCSS(format = 'individual', options = {}) {
    console.log(`🎨 CSS生成開始 - 形式: ${format}`);
    
    // 設定マージ
    const config = {
        ...CSS_EXPORT_CONFIG,
        ...options
    };
    
    try {
        // キャラクターデータの収集・検証
        const charactersData = collectCharacterData();
        if (!charactersData || charactersData.length === 0) {
            throw new Error('キャラクターデータが見つかりません');
        }
        
        // 形式別CSS生成
        let css = '';
        switch (format) {
            case 'individual':
                css = generateIndividualCSS(charactersData, config);
                break;
            case 'generic':
                css = generateGenericCSS(charactersData, config);
                break;
            case 'compressed':
                css = generateCompressedCSS(charactersData, config);
                break;
            case 'commented':
                css = generateCommentedCSS(charactersData, config);
                break;
            default:
                throw new Error(`未対応の出力形式: ${format}`);
        }
        
        // CSS構文検証
        const validation = validateCSS(css);
        if (!validation.isValid) {
            throw new Error(`CSS構文エラー: ${validation.errors.join(', ')}`);
        }
        
        console.log(`✅ CSS生成完了 - ${charactersData.length}キャラクター, ${css.length}文字`);
        return css;
        
    } catch (error) {
        console.error('❌ CSS生成エラー:', error);
        throw error;
    }
}

/**
 * キャラクターデータ収集・検証
 */
function collectCharacterData() {
    console.log('📊 キャラクターデータ収集中...');
    
    if (!window.characters || window.characters.length === 0) {
        console.warn('⚠️ window.charactersが見つかりません');
        return null;
    }
    
    const charactersData = window.characters.map((char, index) => {
        if (!char || !char.element) {
            console.warn(`⚠️ キャラクター${index}のデータが不完全`);
            return null;
        }
        
        // DOM要素から正確な値を取得
        const element = char.element;
        const computedStyle = window.getComputedStyle(element);
        const boundingRect = element.getBoundingClientRect();
        
        // 位置計算（%値への変換）
        const parentElement = element.offsetParent || document.documentElement;
        const parentRect = parentElement.getBoundingClientRect();
        
        // CSS値を直接取得（%値を保持）
        const leftValue = element.style.left || computedStyle.left;
        const topValue = element.style.top || computedStyle.top;
        
        // px値の場合は%に変換
        let leftPercent, topPercent;
        if (leftValue.includes('%')) {
            leftPercent = parseFloat(leftValue);
        } else {
            const leftPx = parseFloat(leftValue) || element.offsetLeft;
            leftPercent = (leftPx / parentRect.width) * 100;
        }
        
        if (topValue.includes('%')) {
            topPercent = parseFloat(topValue);
        } else {
            const topPx = parseFloat(topValue) || element.offsetTop;
            topPercent = (topPx / parentRect.height) * 100;
        }
        
        return {
            // 基本情報
            id: char.id,
            name: char.name,
            selector: char.selector || `#${char.id}`,
            index: index,
            
            // 位置情報（高精度）
            position: {
                left: leftPercent,
                top: topPercent,
                leftRaw: leftValue,
                topRaw: topValue,
                transform: element.style.transform || computedStyle.transform
            },
            
            // スケール情報
            scale: char.scale || 1.0,
            
            // レイヤー情報
            zIndex: char.zIndex || (1000 + index),
            
            // 計算値情報
            computed: {
                width: boundingRect.width,
                height: boundingRect.height,
                actualLeft: boundingRect.left,
                actualTop: boundingRect.top
            },
            
            // 表示状態
            isVisible: element.style.display !== 'none',
            isActive: char.isActive || false,
            
            // CSS関連
            className: `spine-character-${index + 1}`,
            
            // メタデータ
            lastModified: Date.now()
        };
    }).filter(data => data !== null);
    
    console.log(`📊 データ収集完了: ${charactersData.length}キャラクター`);
    return charactersData;
}

/**
 * 個別セレクターCSS生成（推奨形式）
 */
function generateIndividualCSS(charactersData, config) {
    console.log('🎯 個別セレクターCSS生成中...');
    
    let css = generateCSSHeader('individual', config);
    
    charactersData.forEach((char, index) => {
        if (!char.isVisible) return; // 非表示キャラクターはスキップ
        
        const leftStr = formatValue(char.position.left, config.precision.position, '%');
        const topStr = formatValue(char.position.top, config.precision.position, '%');
        const scaleStr = formatValue(char.scale, config.precision.scale);
        
        css += `
/* ${char.name} - キャラクター${index + 1} */
${char.selector} {
    position: absolute;
    left: ${leftStr};
    top: ${topStr};
    transform: translate(-50%, -50%)${char.scale !== 1.0 ? ` scale(${scaleStr})` : ''};
    z-index: ${char.zIndex};${char.computed.width ? `
    /* 元サイズ: ${Math.round(char.computed.width)}×${Math.round(char.computed.height)}px */` : ''}
}
`;
        
        // レスポンシブ対応（必要に応じて）
        if (config.compatibility.responsive) {
            css += generateResponsiveCSS(char, config);
        }
    });
    
    css += generateCSSFooter(config);
    return css;
}

/**
 * 汎用クラスCSS生成
 */
function generateGenericCSS(charactersData, config) {
    console.log('🔧 汎用クラスCSS生成中...');
    
    let css = generateCSSHeader('generic', config);
    
    // 共通ベースクラス
    css += `
/* Spineキャラクター共通ベース */
.spine-character {
    position: absolute;
    transform: translate(-50%, -50%);
}

`;
    
    // 各キャラクター専用クラス
    charactersData.forEach((char, index) => {
        if (!char.isVisible) return;
        
        const leftStr = formatValue(char.position.left, config.precision.position, '%');
        const topStr = formatValue(char.position.top, config.precision.position, '%');
        const scaleStr = formatValue(char.scale, config.precision.scale);
        
        css += `/* ${char.name} */
${char.className} {
    left: ${leftStr};
    top: ${topStr};${char.scale !== 1.0 ? `
    transform: translate(-50%, -50%) scale(${scaleStr});` : ''}
    z-index: ${char.zIndex};
}

`;
    });
    
    css += generateCSSFooter(config);
    return css;
}

/**
 * 圧縮CSS生成（本番用）
 */
function generateCompressedCSS(charactersData, config) {
    console.log('⚡ 圧縮CSS生成中...');
    
    // コメントなしの圧縮形式
    let css = '';
    
    charactersData.forEach((char) => {
        if (!char.isVisible) return;
        
        const leftStr = formatValue(char.position.left, config.precision.position, '%');
        const topStr = formatValue(char.position.top, config.precision.position, '%');
        const scaleStr = formatValue(char.scale, config.precision.scale);
        
        const transform = char.scale !== 1.0 
            ? `translate(-50%,-50%) scale(${scaleStr})`
            : 'translate(-50%,-50%)';
        
        css += `${char.selector}{position:absolute;left:${leftStr};top:${topStr};transform:${transform};z-index:${char.zIndex}}`;
    });
    
    return css;
}

/**
 * コメント付きCSS生成（開発用）
 */
function generateCommentedCSS(charactersData, config) {
    console.log('📝 コメント付きCSS生成中...');
    
    let css = generateCSSHeader('commented', config);
    
    // 詳細なシステム情報
    css += `
/*
===========================================
   Spine キャラクター配置CSS - 詳細版
===========================================

【システム情報】
- 生成時刻: ${new Date().toLocaleString('ja-JP')}
- キャラクター数: ${charactersData.length}
- アクティブキャラクター: ${window.activeCharacterIndex + 1}
- 現在のスケール: ${window.currentScale}

【使用方法】
1. このCSSをプロジェクトに追加
2. HTML要素のIDが正しく設定されていることを確認
3. 必要に応じて値を調整

【注意事項】
- position: absolute が必須です
- 親要素にposition: relative を設定してください
- z-indexは必要に応じて調整してください
===========================================
*/

`;
    
    charactersData.forEach((char, index) => {
        if (!char.isVisible) return;
        
        const leftStr = formatValue(char.position.left, config.precision.position, '%');
        const topStr = formatValue(char.position.top, config.precision.position, '%');
        const scaleStr = formatValue(char.scale, config.precision.scale);
        
        css += `
/*
-------------------------------------------
  ${char.name} - キャラクター ${index + 1}
-------------------------------------------
  セレクター: ${char.selector}
  位置: (${leftStr}, ${topStr})
  スケール: ${scaleStr}
  レイヤー: ${char.zIndex}
  最終更新: ${new Date(char.lastModified).toLocaleString('ja-JP')}
-------------------------------------------
*/
${char.selector} {
    /* 基本配置 */
    position: absolute;
    left: ${leftStr};        /* 水平位置: ${char.position.left.toFixed(1)}% */
    top: ${topStr};         /* 垂直位置: ${char.position.top.toFixed(1)}% */
    
    /* 中央基準変換 + スケーリング */
    transform: translate(-50%, -50%)${char.scale !== 1.0 ? ` scale(${scaleStr})` : ''};
    
    /* レイヤー順序 */
    z-index: ${char.zIndex};   /* 表示優先度 */
    ${char.computed.width ? `
    /* 元サイズ情報: ${Math.round(char.computed.width)} × ${Math.round(char.computed.height)} px */
    /* 実際の表示位置: (${Math.round(char.computed.actualLeft)}, ${Math.round(char.computed.actualTop)}) px */` : ''}
}

`;
    });
    
    css += `
/*
===========================================
   カスタマイズガイド
===========================================

【位置調整】
- left/top値を変更して位置を調整
- %値を使用することでレスポンシブ対応

【サイズ調整】  
- scaleの値を変更してサイズを調整
- 1.0が元のサイズ、0.5で半分、2.0で2倍

【レイヤー調整】
- z-indexの値が大きいほど前面に表示
- 重なり順序を調整する際に使用

【レスポンシブ対応】
@media screen and (max-width: 768px) {
    /* モバイル用の調整をここに記述 */
}
===========================================
*/
`;
    
    css += generateCSSFooter(config);
    return css;
}

/**
 * レスポンシブCSS生成
 */
function generateResponsiveCSS(char, config) {
    return `
@media screen and (max-width: 768px) {
    ${char.selector} {
        /* モバイル用調整が必要な場合はここに記述 */
    }
}`;
}

/**
 * CSSヘッダー生成
 */
function generateCSSHeader(format, config) {
    if (!config.metadata.includeProjectInfo) return '';
    
    const formatInfo = CSS_EXPORT_CONFIG.formats[format];
    const timestamp = new Date().toLocaleString('ja-JP');
    
    return `/*!
 * Spine キャラクター配置CSS
 * 
 * 形式: ${formatInfo.name}
 * 説明: ${formatInfo.description}
 * 生成日時: ${timestamp}
 * 生成元: Spine編集システム v2.0 CSS出力モジュール
 * プロジェクト: ${document.title || 'Spine プロジェクト'}
 * URL: ${window.location.href}
 * 
 * このCSSは制作チーム専用ツールで生成されました。
 * 商用利用において、お客様のサイトに安全に適用できます。
 */

`;
}

/**
 * CSSフッター生成
 */
function generateCSSFooter(config) {
    if (!config.metadata.includeGeneratorInfo) return '';
    
    return `
/* Generated by Spine編集システム v2.0 CSS出力モジュール - ${new Date().toISOString()} */
`;
}

/**
 * 数値フォーマット（精度制御）
 */
function formatValue(value, precision, unit = '') {
    if (typeof value !== 'number') return value;
    return parseFloat(value.toFixed(precision)) + unit;
}

/**
 * CSS構文検証
 */
function validateCSS(css) {
    const errors = [];
    
    // 基本的な構文チェック
    const braceBalance = (css.match(/\{/g) || []).length - (css.match(/\}/g) || []).length;
    if (braceBalance !== 0) {
        errors.push('括弧の数が一致しません');
    }
    
    // セミコロンチェック（圧縮形式以外）
    if (!css.includes('}{')) { // 圧縮形式でない場合
        const propertyLines = css.split('\n').filter(line => 
            line.trim() && 
            !line.trim().startsWith('/*') && 
            !line.trim().startsWith('*/') &&
            line.includes(':') &&
            !line.includes('{') &&
            !line.includes('}')
        );
        
        propertyLines.forEach(line => {
            if (!line.trim().endsWith(';')) {
                errors.push(`セミコロンが不足: ${line.trim()}`);
            }
        });
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// ========== UI統合システム ========== //

/**
 * CSS出力ダイアログ表示
 */
function showCSSExportDialog() {
    console.log('🎨 CSS出力ダイアログを表示');
    
    return new Promise((resolve) => {
        // オーバーレイ作成
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10020;
            display: flex;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease;
        `;
        
        // メインダイアログボックス
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.4);
            max-width: 900px;
            width: 95%;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            font-family: system-ui, -apple-system, sans-serif;
            animation: slideInUp 0.3s ease;
        `;
        
        dialog.innerHTML = `
            <div style="padding: 24px 24px 16px 24px; border-bottom: 2px solid #f0f0f0;">
                <h2 style="margin: 0; color: #333; font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 12px;">
                    <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px;">📋</span>
                    CSS出力・生成ツール
                </h2>
                <p style="margin: 8px 0 0 0; color: #666; font-size: 16px;">
                    現在の配置設定から商用品質のCSSを生成します
                </p>
            </div>
            
            <div style="padding: 24px; flex: 1; overflow-y: auto;">
                <!-- 形式選択 -->
                <div style="margin-bottom: 24px;">
                    <h3 style="margin: 0 0 12px 0; color: #333; font-size: 18px; font-weight: 600;">出力形式</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                        <label style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; transition: all 0.2s;" class="format-option">
                            <input type="radio" name="css-format" value="individual" checked style="margin: 0;">
                            <div>
                                <div style="font-weight: 600; color: #333;">個別セレクター</div>
                                <div style="font-size: 12px; color: #666;">各キャラクター専用CSS</div>
                            </div>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; transition: all 0.2s;" class="format-option">
                            <input type="radio" name="css-format" value="generic" style="margin: 0;">
                            <div>
                                <div style="font-weight: 600; color: #333;">汎用クラス</div>
                                <div style="font-size: 12px; color: #666;">再利用可能な構造</div>
                            </div>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; transition: all 0.2s;" class="format-option">
                            <input type="radio" name="css-format" value="compressed" style="margin: 0;">
                            <div>
                                <div style="font-weight: 600; color: #333;">圧縮（本番用）</div>
                                <div style="font-size: 12px; color: #666;">最小化CSS</div>
                            </div>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; transition: all 0.2s;" class="format-option">
                            <input type="radio" name="css-format" value="commented" style="margin: 0;">
                            <div>
                                <div style="font-weight: 600; color: #333;">コメント付き</div>
                                <div style="font-size: 12px; color: #666;">開発・保守用</div>
                            </div>
                        </label>
                    </div>
                </div>
                
                <!-- プレビュー表示エリア -->
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3 style="margin: 0; color: #333; font-size: 18px; font-weight: 600;">プレビュー</h3>
                        <button id="generate-preview" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
                            🔄 生成
                        </button>
                    </div>
                    <div id="css-preview" style="
                        background: #f8f9fa; 
                        border: 1px solid #e9ecef; 
                        border-radius: 8px; 
                        padding: 16px; 
                        min-height: 200px; 
                        max-height: 300px; 
                        overflow-y: auto; 
                        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; 
                        font-size: 13px; 
                        line-height: 1.5;
                        white-space: pre-wrap;
                        color: #333;
                    ">CSS生成ボタンをクリックしてプレビューを表示</div>
                </div>
                
                <!-- 統計情報 -->
                <div id="css-stats" style="display: none; background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <h4 style="margin: 0 0 8px 0; color: #1565c0; font-size: 16px;">生成統計</h4>
                    <div id="stats-content" style="font-size: 14px; color: #333;"></div>
                </div>
            </div>
            
            <div style="padding: 16px 24px; border-top: 2px solid #f0f0f0; display: flex; gap: 12px; flex-wrap: wrap;">
                <button id="copy-css" disabled style="
                    flex: 1; 
                    min-width: 120px; 
                    padding: 14px 20px; 
                    background: #2196F3; 
                    color: white; 
                    border: none; 
                    border-radius: 8px; 
                    font-size: 16px; 
                    font-weight: 600; 
                    cursor: pointer; 
                    transition: all 0.2s;
                    opacity: 0.5;
                ">📋 クリップボードにコピー</button>
                <button id="download-css" disabled style="
                    flex: 1; 
                    min-width: 120px; 
                    padding: 14px 20px; 
                    background: #4CAF50; 
                    color: white; 
                    border: none; 
                    border-radius: 8px; 
                    font-size: 16px; 
                    font-weight: 600; 
                    cursor: pointer; 
                    transition: all 0.2s;
                    opacity: 0.5;
                ">💾 ファイルダウンロード</button>
                <button id="close-dialog" style="
                    flex: 1; 
                    min-width: 120px; 
                    padding: 14px 20px; 
                    background: #757575; 
                    color: white; 
                    border: none; 
                    border-radius: 8px; 
                    font-size: 16px; 
                    font-weight: 600; 
                    cursor: pointer; 
                    transition: all 0.2s;
                ">❌ 閉じる</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // 変数
        let currentCSS = '';
        let currentFormat = 'individual';
        
        // イベントハンドラ設定
        const formatOptions = dialog.querySelectorAll('.format-option');
        const generateBtn = dialog.querySelector('#generate-preview');
        const previewArea = dialog.querySelector('#css-preview');
        const statsArea = dialog.querySelector('#css-stats');
        const statsContent = dialog.querySelector('#stats-content');
        const copyBtn = dialog.querySelector('#copy-css');
        const downloadBtn = dialog.querySelector('#download-css');
        const closeBtn = dialog.querySelector('#close-dialog');
        
        // 形式選択イベント
        formatOptions.forEach(option => {
            option.addEventListener('click', () => {
                // ラジオボタンの状態更新
                const radio = option.querySelector('input[type="radio"]');
                currentFormat = radio.value;
                
                // 視覚的選択状態
                formatOptions.forEach(opt => {
                    opt.style.borderColor = '#e0e0e0';
                    opt.style.background = 'white';
                });
                option.style.borderColor = '#2196F3';
                option.style.background = '#f3f8ff';
            });
        });
        
        // CSS生成イベント
        generateBtn.addEventListener('click', async () => {
            try {
                generateBtn.textContent = '⏳ 生成中...';
                generateBtn.disabled = true;
                
                // CSS生成
                currentCSS = generateCSS(currentFormat);
                
                // プレビュー表示
                previewArea.textContent = currentCSS;
                previewArea.style.color = '#333';
                
                // 統計情報表示
                const lines = currentCSS.split('\n').length;
                const characters = currentCSS.length;
                const charactersCount = window.characters ? window.characters.length : 0;
                
                statsContent.innerHTML = `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
                        <div><strong>キャラクター数:</strong> ${charactersCount}個</div>
                        <div><strong>CSS行数:</strong> ${lines}行</div>
                        <div><strong>文字数:</strong> ${characters.toLocaleString()}文字</div>
                        <div><strong>ファイルサイズ:</strong> ${(characters / 1024).toFixed(1)}KB</div>
                    </div>
                `;
                statsArea.style.display = 'block';
                
                // ボタン有効化
                copyBtn.disabled = false;
                copyBtn.style.opacity = '1';
                downloadBtn.disabled = false;
                downloadBtn.style.opacity = '1';
                
                generateBtn.textContent = '✅ 生成完了';
                setTimeout(() => {
                    generateBtn.textContent = '🔄 再生成';
                    generateBtn.disabled = false;
                }, 2000);
                
            } catch (error) {
                console.error('CSS生成エラー:', error);
                previewArea.textContent = `エラー: ${error.message}`;
                previewArea.style.color = '#d32f2f';
                
                generateBtn.textContent = '❌ エラー';
                setTimeout(() => {
                    generateBtn.textContent = '🔄 生成';
                    generateBtn.disabled = false;
                }, 3000);
            }
        });
        
        // クリップボードコピー
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(currentCSS);
                copyBtn.textContent = '✅ コピー完了';
                setTimeout(() => {
                    copyBtn.textContent = '📋 クリップボードにコピー';
                }, 2000);
            } catch (error) {
                console.error('コピーエラー:', error);
                copyBtn.textContent = '❌ コピー失敗';
                setTimeout(() => {
                    copyBtn.textContent = '📋 クリップボードにコピー';
                }, 3000);
            }
        });
        
        // ファイルダウンロード
        downloadBtn.addEventListener('click', () => {
            try {
                const formatInfo = CSS_EXPORT_CONFIG.formats[currentFormat];
                const filename = `spine-characters-${currentFormat}-${new Date().toISOString().slice(0, 10)}${formatInfo.extension}`;
                
                const blob = new Blob([currentCSS], { type: 'text/css' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                downloadBtn.textContent = '✅ ダウンロード完了';
                setTimeout(() => {
                    downloadBtn.textContent = '💾 ファイルダウンロード';
                }, 2000);
                
            } catch (error) {
                console.error('ダウンロードエラー:', error);
                downloadBtn.textContent = '❌ ダウンロード失敗';
                setTimeout(() => {
                    downloadBtn.textContent = '💾 ファイルダウンロード';
                }, 3000);
            }
        });
        
        // ダイアログを閉じる
        const closeDialog = () => {
            overlay.style.animation = 'fadeOut 0.2s ease';
            dialog.style.animation = 'slideOutDown 0.2s ease';
            
            setTimeout(() => {
                document.body.removeChild(overlay);
                resolve();
            }, 200);
        };
        
        closeBtn.addEventListener('click', closeDialog);
        
        // ESCキーで閉じる
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleKeyPress);
                closeDialog();
            }
        };
        document.addEventListener('keydown', handleKeyPress);
        
        // オーバーレイクリックで閉じる
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDialog();
            }
        });
        
        // 初期選択を設定
        formatOptions[0].click();
    });
}

// ========== エクスポート ========== //

// グローバルアクセス用の関数をwindowオブジェクトに登録
if (typeof window !== 'undefined') {
    // CSS生成機能
    window.generateCSS = generateCSS;
    window.collectCharacterData = collectCharacterData;
    window.validateCSS = validateCSS;
    
    // UI統合機能
    window.showCSSExportDialog = showCSSExportDialog;
    
    // 設定アクセス
    window.CSS_EXPORT_CONFIG = CSS_EXPORT_CONFIG;
    
    // デバッグ機能
    window.debugCSSExport = () => {
        console.log('🔍 CSS出力機能診断');
        const data = collectCharacterData();
        console.log('キャラクターデータ:', data);
        
        if (data && data.length > 0) {
            console.log('✅ CSS出力準備完了');
            console.log('利用可能な形式:', Object.keys(CSS_EXPORT_CONFIG.formats));
        } else {
            console.log('❌ キャラクターデータが見つかりません');
        }
        
        return data;
    };
}

console.log('✅ CSS出力モジュール読み込み完了');