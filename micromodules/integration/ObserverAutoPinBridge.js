/**
 * ObserverAutoPinBridge - 責務分離システム統合制御
 * 
 * AutoPin（選択UI特化） → PinContract → AutoPinObserver（正規化・計算特化） → Spine
 * の統合フローを管理する
 * 
 * 作成日: 2025-09-10
 * 目的: 95%座標混入問題の根本解決・責務分離完成
 */

import { AutoPinSelector } from '../autopin/AutoPinSelector.js';
import { ContractGenerator } from '../autopin/ContractGenerator.js';
import { register as observerRegister } from '../observer/AutoPinObserver.js';

/**
 * 責務分離システムの統合制御クラス
 */
export class ObserverAutoPinBridge {
    constructor() {
        this.activeContracts = new Map(); // targetElement -> { contract, observerUnregister }
        this.spineElements = new Map();   // targetElement -> spineElement
        this.autoPin = new AutoPinSelector();
        
        console.log('🔧 ObserverAutoPinBridge初期化完了');
    }
    
    /**
     * 完全な責務分離フロー実行
     * AutoPin選択 → Contract生成 → Observer監視 → Spine配置
     * @param {HTMLElement} targetElement - 基準要素
     * @param {Object} options - 配置オプション
     */
    async startAutoPinFlow(targetElement, options = {}) {
        try {
            console.log('🚀 責務分離フロー開始:', targetElement.tagName);
            
            // Step 1: AutoPin選択UI（選択UI特化）
            // targetElementを直接使用して簡易selectorResultを作成
            const selectorResult = {
                element: targetElement,
                refElement: targetElement,
                logicalSize: options.logicalSize || { w: 600, h: 400 },
                align: options.align || 'CC',
                anchorKind: options.anchorKind || 'block',
                fit: options.fit || 'contain',
                scaleMode: options.scaleMode || 'container',
                baseFontPx: options.baseFontPx || 16
            };
            console.log('✅ Step 1 - AutoPin選択完了:', selectorResult);
            
            // Step 2: PinContract生成（契約情報）
            const contract = ContractGenerator.generateContract(selectorResult);
            console.log('✅ Step 2 - PinContract生成完了:', contract);
            
            // Step 3: AutoPinObserver監視開始（正規化・計算特化）
            const observeTarget = ContractGenerator.contractToObserveTarget(
                contract,
                (payload) => this.handleObserverUpdate(targetElement, payload, contract, options)
            );
            
            const observerUnregister = observerRegister(observeTarget);
            console.log('✅ Step 3 - AutoPinObserver監視開始');
            
            // Step 4: Spine要素作成・配置準備
            const spineElement = this.createSpineElement(targetElement, options);
            
            // 管理情報の保存
            this.activeContracts.set(targetElement, { 
                contract, 
                observerUnregister,
                selectorResult 
            });
            this.spineElements.set(targetElement, spineElement);
            
            console.log('🎯 責務分離フロー完了 - 座標混入問題解決済み');
            return {
                success: true,
                contract,
                spineElement,
                observerUnregister
            };
            
        } catch (error) {
            console.error('❌ 責務分離フロー失敗:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Observer更新ハンドリング（Spine配置システム）
     * @param {HTMLElement} targetElement - 基準要素
     * @param {Object} payload - Observer出力データ
     * @param {Object} contract - PinContract
     * @param {Object} options - 配置オプション
     */
    handleObserverUpdate(targetElement, payload, contract, options) {
        const spineElement = this.spineElements.get(targetElement);
        if (!spineElement) {
            console.warn('⚠️ Spine要素が見つかりません:', targetElement);
            return;
        }
        
        try {
            // 要素の中心座標を基準とした配置（論理座標は使わずに実座標で計算）
            const targetRect = targetElement.getBoundingClientRect();
            const centerX = targetRect.left + (targetRect.width / 2);
            const centerY = targetRect.top + (targetRect.height / 2);
            
            // position: fixedなので、getBoundingClientRect()の値をそのまま使用
            const position = { x: centerX, y: centerY };
            
            // スケール計算（scaleMode考慮済み）
            const finalScale = this.calculateFinalScale(contract, payload);
            
            // position: fixed での座標適用（座標系統一済み）
            const spineWidth = parseFloat(spineElement.style.width) || 100;
            const spineHeight = parseFloat(spineElement.style.height) || 100;
            
            // スケール時の位置ずれ防止: 中心基準配置
            const finalX = position.x - (spineWidth / 2);
            const finalY = position.y - (spineHeight / 2);
            
            // CSS適用（transform-origin確実設定）
            spineElement.style.left = finalX + 'px';
            spineElement.style.top = finalY + 'px';
            spineElement.style.transform = `scale(${finalScale})`;
            spineElement.style.transformOrigin = 'center center'; // 明示的設定
            
            // 詳細デバッグ情報出力
            console.log('🎯 修正後座標デバッグ:', {
                target: targetElement.tagName,
                targetRect: { 
                    left: targetRect.left, 
                    top: targetRect.top, 
                    width: targetRect.width, 
                    height: targetRect.height 
                },
                centerCalculated: { x: centerX, y: centerY },
                finalPosition: { x: finalX, y: finalY },
                spineSize: { width: spineWidth, height: spineHeight },
                scale: finalScale,
                cssApplied: { left: spineElement.style.left, top: spineElement.style.top },
                computedStyle: { 
                    left: getComputedStyle(spineElement).left, 
                    top: getComputedStyle(spineElement).top 
                },
                viewport: { width: window.innerWidth, height: window.innerHeight }
            });
            
        } catch (error) {
            console.error('❌ Spine配置エラー:', error);
        }
    }
    
    /**
     * scaleMode考慮のスケール計算
     * @param {Object} contract - PinContract
     * @param {Object} payload - Observer出力データ
     * @returns {number} 最終スケール値
     */
    calculateFinalScale(contract, payload) {
        if (contract.scaleMode === 'typography') {
            const currentFont = ContractGenerator.getCurrentFontSize(contract.refElement);
            const baseFontPx = contract.baseFontPx || 16;
            return currentFont / baseFontPx;
        } else {
            // container: min(scaleX, scaleY)でアスペクト比維持
            return Math.min(payload.scaleX, payload.scaleY);
        }
    }
    
    /**
     * Spine要素作成
     * @param {HTMLElement} targetElement - 基準要素
     * @param {Object} options - 作成オプション
     * @returns {HTMLElement} 作成されたSpine要素
     */
    createSpineElement(targetElement, options = {}) {
        const spine = document.createElement('div');
        spine.className = 'spine-display-area';
        spine.style.cssText = `
            position: fixed;
            width: ${options.width || 100}px;
            height: ${options.height || 100}px;
            background: rgba(255, 107, 107, 0.8);
            border: 2px solid #ff6b6b;
            border-radius: 4px;
            z-index: 9999;
            pointer-events: none;
            transform-origin: center center;
            box-sizing: border-box;
        `;
        
        // 基準要素のタイプに応じた色分け
        if (targetElement.tagName.toLowerCase().startsWith('h')) {
            spine.style.background = 'rgba(255, 107, 107, 0.8)'; // 見出し: 赤系
        } else if (targetElement.tagName.toLowerCase() === 'p') {
            spine.style.background = 'rgba(78, 205, 196, 0.8)'; // 段落: 青系
        } else {
            spine.style.background = 'rgba(255, 193, 7, 0.8)'; // その他: 黄系
        }
        
        document.body.appendChild(spine);
        
        console.log('🎨 Spine要素作成完了:', {
            target: targetElement.tagName,
            size: `${spine.style.width} x ${spine.style.height}`,
            position: spine.style.position
        });
        
        return spine;
    }
    
    /**
     * 責務分離システム停止
     * @param {HTMLElement} targetElement - 対象要素
     */
    stopAutoPinFlow(targetElement) {
        const contractInfo = this.activeContracts.get(targetElement);
        const spineElement = this.spineElements.get(targetElement);
        
        if (contractInfo) {
            contractInfo.observerUnregister();
            this.activeContracts.delete(targetElement);
            console.log('✅ Observer監視停止:', targetElement.tagName);
        }
        
        if (spineElement) {
            spineElement.remove();
            this.spineElements.delete(targetElement);
            console.log('✅ Spine要素削除:', targetElement.tagName);
        }
    }
    
    /**
     * 全ての責務分離システム停止
     */
    stopAll() {
        for (const targetElement of this.activeContracts.keys()) {
            this.stopAutoPinFlow(targetElement);
        }
        console.log('🛑 全ての責務分離システム停止完了');
    }
    
    /**
     * アクティブな契約情報取得
     * @returns {Array} アクティブな契約の配列
     */
    getActiveContracts() {
        return Array.from(this.activeContracts.entries()).map(([element, info]) => ({
            element,
            contract: info.contract,
            selectorResult: info.selectorResult
        }));
    }
    
    /**
     * デバッグ情報出力
     */
    debugInfo() {
        console.group('🔍 ObserverAutoPinBridge デバッグ情報');
        console.log('アクティブ契約数:', this.activeContracts.size);
        console.log('Spine要素数:', this.spineElements.size);
        
        for (const [element, info] of this.activeContracts) {
            console.log(`${element.tagName}:`, {
                contract: info.contract,
                hasSpine: this.spineElements.has(element)
            });
        }
        console.groupEnd();
    }
}

// グローバル利用向けシングルトンインスタンス
export const bridgeInstance = new ObserverAutoPinBridge();

// ウィンドウオブジェクトに登録（デバッグ用）
if (typeof window !== 'undefined') {
    window.ObserverAutoPinBridge = ObserverAutoPinBridge;
    window.autoPinBridge = bridgeInstance;
}