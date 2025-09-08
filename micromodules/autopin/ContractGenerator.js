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
     * 9アンカーをAnchor座標に変換
     * @param {AlignAnchor} align - 9アンカー指定 
     * @param {LogicalSize} logicalSize - 論理サイズ
     * @returns {Anchor} 論理座標でのアンカー位置
     */
    static alignToAnchor(align, logicalSize) {
        const { w, h } = logicalSize;
        
        const anchorMap = {
            // Top row (パーセント値で返す - 呼び出し側が (value/100) * width を期待)
            'LT': { x: 0, y: 0 },           // Left-Top: 0%, 0%
            'TC': { x: 50, y: 0 },          // Top-Center: 50%, 0%  
            'RT': { x: 100, y: 0 },         // Right-Top: 100%, 0%
            
            // Middle row
            'LC': { x: 0, y: 50 },          // Left-Center: 0%, 50%
            'CC': { x: 50, y: 50 },         // Center-Center: 50%, 50%
            'RC': { x: 100, y: 50 },        // Right-Center: 100%, 50%
            
            // Bottom row  
            'LB': { x: 0, y: 100 },         // Left-Bottom: 0%, 100%
            'BC': { x: 50, y: 100 },        // Bottom-Center: 50%, 100%
            'RB': { x: 100, y: 100 }        // Right-Bottom: 100%, 100%
        };
        
        return anchorMap[align] || anchorMap['CC']; // デフォルト中央
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
            resolvedAt = this.alignToAnchor(selectorContract.align, selectorContract.logicalSize);
        }
        
        return {
            element: selectorContract.refElement,
            logicalSize: selectorContract.logicalSize,
            fit: selectorContract.fit || 'contain',
            box: selectorContract.box || 'content-box',
            onUpdate: (payload) => {
                // scaleMode考慮のスケール計算
                let finalScale;
                if (selectorContract.scaleMode === 'typography') {
                    const currentFont = this.getCurrentFontSize(selectorContract.refElement);
                    const baseFontPx = selectorContract.baseFontPx || 16;
                    finalScale = currentFont / baseFontPx;
                } else {
                    // container: min(scaleX, scaleY)でアスペクト比維持
                    finalScale = Math.min(payload.scaleX, payload.scaleY);
                }
                
                // 座標解決
                const position = payload.resolve(resolvedAt);
                
                // 拡張ペイロード作成
                const extendedPayload = {
                    ...payload,
                    contract: selectorContract,
                    finalScale,
                    position
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