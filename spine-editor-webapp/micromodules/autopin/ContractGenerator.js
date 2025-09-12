/**
 * ContractGenerator.js - PinContract変換システム
 * 
 * AutoPin選択結果をObserver対応PinContractに変換
 * JSON設定からのContract生成もサポート
 */

// import { PinContract, PinContractConfig } from '../observer/types.ts';
// TypeScript型定義はJSDocコメントで代替

/**
 * Contract変換・生成ユーティリティ
 */
export class ContractGenerator {
    
    /**
     * AutoPin選択結果からPinContractを生成（要素別最適化対応）
     * @param {Object} selectorResult - AutoPinSelector出力
     * @returns {Object} PinContract
     */
    static generateContract(selectorResult) {
        // デフォルト値設定（新仕様対応）
        const defaults = {
            logicalSize: { w: 600, h: 400 },
            anchorKind: 'block',
            align: 'CC',
            fit: 'contain',
            scaleMode: 'element-linked',  // 新デフォルト：要素サイズ連動
            baseFontPx: 16
        };
        
        // selectorResultとdefaultsをマージ
        const contract = {
            refElement: selectorResult.element || selectorResult.refElement,
            logicalSize: selectorResult.logicalSize || defaults.logicalSize,
            anchorKind: selectorResult.anchorKind || defaults.anchorKind,
            align: selectorResult.align || defaults.align,
            fit: selectorResult.fit || defaults.fit,
            scaleMode: selectorResult.scaleMode || defaults.scaleMode,
            baseFontPx: selectorResult.baseFontPx || defaults.baseFontPx
        };
        
        // alignからat座標への変換
        if (contract.align && !contract.at) {
            contract.at = this.alignToAnchor(contract.align, contract.logicalSize, contract.refElement);
        }
        
        // Contract検証
        this.validateContract(contract);
        
        console.log('📋 PinContract生成完了:', contract);
        return contract;
    }
    
    /**
     * 9アンカー・テキストアンカー・要素別アンカーをAnchor座標に変換
     * @param {AlignAnchor} align - アンカー指定 (9アンカー: LT,TC,RT... / テキスト: text-start,text-end... / 要素: marker)
     * @param {LogicalSize} logicalSize - 論理サイズ
     * @param {HTMLElement} [element] - 要素別アンカー計算用の参照要素
     * @returns {Anchor} 論理座標でのアンカー位置
     */
    static alignToAnchor(align, logicalSize, element) {
        const { w, h } = logicalSize;
        
        // 9アンカー（従来システム）
        const nineAnchorMap = {
            // Top row (論理座標で返す - Observer期待形式に修正)
            'LT': { x: 0, y: 0 },           // Left-Top: 0, 0
            'TC': { x: w * 0.5, y: 0 },     // Top-Center: w/2, 0  
            'RT': { x: w, y: 0 },           // Right-Top: w, 0
            
            // Middle row
            'LC': { x: 0, y: h * 0.5 },     // Left-Center: 0, h/2
            'CC': { x: w * 0.5, y: h * 0.5 }, // Center-Center: w/2, h/2
            'RC': { x: w, y: h * 0.5 },     // Right-Center: w, h/2
            
            // Bottom row  
            'LB': { x: 0, y: h },           // Left-Bottom: 0, h
            'BC': { x: w * 0.5, y: h },     // Bottom-Center: w/2, h
            'RB': { x: w, y: h }            // Right-Bottom: w, h
        };
        
        // 9アンカーの場合は従来ロジック
        if (nineAnchorMap[align]) {
            return nineAnchorMap[align];
        }
        
        // テキスト専用アンカー
        if (align === 'text-start') {
            // 言語方向考慮: LTR言語なら左開始、RTL言語なら右開始
            const isRTL = element && getComputedStyle(element).direction === 'rtl';
            return isRTL ? { x: w, y: 0 } : { x: 0, y: 0 };
        }
        
        if (align === 'text-end') {
            // 言語方向考慮: LTR言語なら右終端、RTL言語なら左終端
            const isRTL = element && getComputedStyle(element).direction === 'rtl';
            return isRTL ? { x: 0, y: 0 } : { x: w, y: 0 };
        }
        
        if (align === 'text-center') {
            // テキスト中央（水平中央・上端基準）
            return { x: w * 0.5, y: 0 };
        }
        
        // リスト要素専用アンカー
        if (align === 'marker') {
            // リストマーカー位置（左端・垂直中央）
            return { x: 0, y: h * 0.5 };
        }
        
        // 不明なalignの場合はデフォルト中央
        return nineAnchorMap['CC'];
    }
    
    /**
     * 要素からフォントサイズを取得
     * @param {HTMLElement} element - 対象要素
     * @returns {number} フォントサイズ（px）
     */
    static getCurrentFontSize(element) {
        const computed = getComputedStyle(element);
        const fontSize = computed.fontSize;
        
        // px値を直接取得
        if (fontSize.endsWith('px')) {
            return parseFloat(fontSize);
        }
        
        // その他の単位の場合は計算（簡素化）
        return 16; // デフォルトフォントサイズ
    }
    
    /**
     * PinContract完全性チェック
     * @param {PinContract} contract - チェック対象Contract
     * @returns {Object} { isValid: boolean, errors: string[] }
     */
    static validateContract(contract) {
        const errors = [];
        
        // 必須フィールドチェック
        if (!contract.refElement || !(contract.refElement instanceof HTMLElement)) {
            errors.push('refElement must be a valid HTMLElement');
        }
        
        if (!contract.logicalSize || typeof contract.logicalSize.w !== 'number' || typeof contract.logicalSize.h !== 'number') {
            errors.push('logicalSize must be an object with numeric w and h properties');
        }
        
        if (!contract.anchorKind) {
            errors.push('anchorKind is required');
        }
        
        // align または at のどちらかが必要
        if (!contract.align && !contract.at) {
            errors.push('Either align or at must be specified');
        }
        
        // 値の範囲チェック
        if (contract.logicalSize) {
            if (contract.logicalSize.w <= 0 || contract.logicalSize.h <= 0) {
                errors.push('logicalSize width and height must be positive numbers');
            }
        }
        
        // AnchorKind妥当性チェック（新仕様対応）
        const validAnchorKinds = ['block', 'text-start', 'text-end', 'text-center', 'marker'];
        if (contract.anchorKind && !validAnchorKinds.includes(contract.anchorKind)) {
            errors.push(`anchorKind must be one of: ${validAnchorKinds.join(', ')}`);
        }
        
        // ScaleMode妥当性チェック（新仕様対応）
        const validScaleModes = ['element-linked', 'fixed-size', 'typography', 'container'];
        if (contract.scaleMode && !validScaleModes.includes(contract.scaleMode)) {
            errors.push(`scaleMode must be one of: ${validScaleModes.join(', ')}`);
        }
        
        // Align妥当性チェック（新仕様対応）
        if (contract.align) {
            const validAlignValues = [
                // 9アンカー
                'LT', 'TC', 'RT', 'LC', 'CC', 'RC', 'LB', 'BC', 'RB',
                // テキスト専用アンカー
                'text-start', 'text-end', 'text-center',
                // リスト要素専用アンカー
                'marker'
            ];
            if (!validAlignValues.includes(contract.align)) {
                errors.push(`align must be one of: ${validAlignValues.join(', ')}`);
            }
        }
        
        // Typography ScaleMode特有の検証
        if (contract.scaleMode === 'typography') {
            if (typeof contract.baseFontPx !== 'number' || contract.baseFontPx <= 0) {
                errors.push('baseFontPx must be a positive number when using typography scaleMode');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * JSON設定からPinContractを生成
     * @param {PinContractConfig} config - JSON設定
     * @returns {PinContract|null} 生成されたContract（要素が見つからない場合はnull）
     */
    static fromConfig(config) {
        // 要素セレクタから要素を取得
        const element = document.querySelector(config.elementSelector);
        if (!element) {
            console.error(`❌ Element not found: ${config.elementSelector}`);
            return null;
        }
        
        const contract = {
            refElement: element,
            logicalSize: config.logicalSize,
            anchorKind: config.anchorKind,
            fit: config.fit || 'contain',
            scaleMode: config.scaleMode || 'container'
        };
        
        // アンカー指定の変換
        if (config.align) {
            contract.align = config.align;
        } else if (config.at) {
            contract.at = config.at;
        } else {
            contract.align = 'CC'; // デフォルト
        }
        
        // オプショナル項目
        if (config.objectPosition) {
            contract.objectPosition = config.objectPosition;
        }
        
        if (config.box) {
            contract.box = config.box;
        }
        
        if (config.baseFontPx) {
            contract.baseFontPx = config.baseFontPx;
        }
        
        return contract;
    }
    
    /**
     * PinContractをJSON設定に変換（保存用）
     * @param {PinContract} contract - 変換対象Contract
     * @returns {PinContractConfig} JSON設定オブジェクト
     */
    static toConfig(contract) {
        // 要素のセレクタを生成（簡易版）
        const element = contract.refElement;
        let elementSelector;
        
        if (element.id) {
            elementSelector = `#${element.id}`;
        } else if (element.className) {
            const firstClass = element.className.split(' ')[0];
            elementSelector = `${element.tagName.toLowerCase()}.${firstClass}`;
        } else {
            elementSelector = element.tagName.toLowerCase();
        }
        
        const config = {
            elementSelector,
            logicalSize: contract.logicalSize,
            anchorKind: contract.anchorKind
        };
        
        // アンカー情報
        if (contract.align) {
            config.align = contract.align;
        } else if (contract.at) {
            config.at = contract.at;
        }
        
        // オプショナル項目
        if (contract.fit && contract.fit !== 'contain') {
            config.fit = contract.fit;
        }
        
        if (contract.objectPosition && contract.objectPosition !== '50% 50%') {
            config.objectPosition = contract.objectPosition;
        }
        
        if (contract.box && contract.box !== 'content-box') {
            config.box = contract.box;
        }
        
        if (contract.scaleMode && contract.scaleMode !== 'container') {
            config.scaleMode = contract.scaleMode;
        }
        
        if (contract.baseFontPx && contract.baseFontPx !== 16) {
            config.baseFontPx = contract.baseFontPx;
        }
        
        return config;
    }
    
    /**
     * AutoPinSelector出力からObserver入力への変換
     * @param {PinContract} selectorContract - AutoPinSelector出力
     * @returns {ObserveTarget} Observer入力形式
     */
    static contractToObserveTarget(selectorContract, onUpdateCallback) {
        // align → at 変換（必要に応じて）
        let resolvedAt = selectorContract.at;
        if (!resolvedAt && selectorContract.align) {
            resolvedAt = this.alignToAnchor(selectorContract.align, selectorContract.logicalSize, selectorContract.refElement);
        }
        
        return {
            element: selectorContract.refElement,
            logicalSize: selectorContract.logicalSize,
            fit: selectorContract.fit || 'contain',
            box: selectorContract.box || 'content-box',
            onUpdate: (payload) => {
                // scaleMode考慮のスケール計算
                let finalScale;
                const scaleMode = selectorContract.scaleMode || 'element-linked';
                
                switch (scaleMode) {
                    case 'typography':
                        // フォントサイズ基準スケール
                        const currentFont = this.getCurrentFontSize(selectorContract.refElement);
                        const baseFontPx = selectorContract.baseFontPx || 16;
                        finalScale = currentFont / baseFontPx;
                        break;
                        
                    case 'element-linked':
                        // 要素サイズ連動（新デフォルト）: min(scaleX, scaleY)でアスペクト比維持
                        finalScale = Math.min(payload.scaleX, payload.scaleY);
                        break;
                        
                    case 'fixed-size':
                        // 固定サイズ（スケールなし）
                        finalScale = 1.0;
                        break;
                        
                    case 'container':
                        // 従来のコンテナ基準（互換性保持）
                        finalScale = Math.min(payload.scaleX, payload.scaleY);
                        break;
                        
                    default:
                        // 不明なscaleModeの場合はelement-linkedにフォールバック
                        console.warn('🔄 Unknown scaleMode:', scaleMode, '→ Using element-linked');
                        finalScale = Math.min(payload.scaleX, payload.scaleY);
                        break;
                }
                
                // 座標解決
                const position = payload.resolve(resolvedAt);
                
                // 拡張ペイロード作成
                const extendedPayload = {
                    ...payload,
                    contract: selectorContract,
                    finalScale,
                    position,
                    scaleMode: scaleMode
                };
                
                onUpdateCallback(extendedPayload);
            }
        };
    }
    
    /**
     * デバッグ情報出力
     * @param {PinContract} contract - 対象Contract
     */
    static debugContract(contract) {
        console.group('🔍 PinContract Debug');
        console.log('📍 Element:', contract.refElement.tagName + (contract.refElement.id ? '#' + contract.refElement.id : ''));
        console.log('📏 Logical Size:', contract.logicalSize);
        console.log('🎯 Anchor Kind:', contract.anchorKind);
        console.log('📌 Alignment:', contract.align || 'Custom at position');
        console.log('🎨 Fit Mode:', contract.fit || 'contain');
        console.log('⚖️ Scale Mode:', contract.scaleMode || 'container');
        
        if (contract.at) {
            console.log('📍 Custom Position:', contract.at);
        }
        
        const validation = this.validateContract(contract);
        if (validation.isValid) {
            console.log('✅ Contract is valid');
        } else {
            console.error('❌ Contract validation errors:', validation.errors);
        }
        
        console.groupEnd();
    }
}