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
            
            // 既存登録チェック・クリーンアップ
            if (this.activeContracts.has(targetElement)) {
                console.log('⚠️ 既存登録を検出 - クリーンアップ実行');
                this.stopAutoPinFlow(targetElement);
            }
            
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
            // 要素の基準座標を align 設定に応じて計算
            const targetRect = targetElement.getBoundingClientRect();
            const rawPosition = this.calculateAlignPosition(targetRect, contract.align || 'CC', targetElement);
            
            // 画面外配置を防ぐ安全装置
            const position = this.constrainToViewport(rawPosition, options);
            
            console.log('🎯 align配置計算:', {
                align: contract.align,
                targetRect: { left: targetRect.left, top: targetRect.top, width: targetRect.width, height: targetRect.height },
                rawPosition: rawPosition,
                constrainedPosition: position,
                viewport: { width: window.innerWidth, height: window.innerHeight }
            });
            
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
                align: contract.align,
                targetRect: { 
                    left: targetRect.left, 
                    top: targetRect.top, 
                    width: targetRect.width, 
                    height: targetRect.height 
                },
                alignCalculated: position,
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
     * align設定に応じた配置座標計算（9アンカーポイント対応）
     * @param {DOMRect} targetRect - 要素のBoundingClientRect
     * @param {string} align - LT/TC/RT/LC/CC/RC/LB/BC/RB
     * @param {HTMLElement} targetElement - 対象要素（テキスト幅測定用）
     * @returns {Object} {x, y} 配置座標
     */
    calculateAlignPosition(targetRect, align, targetElement = null) {
        const { left, top, width, height } = targetRect;
        
        // RC (Right Center) でテキスト要素の場合はRange APIで最終グリフ位置を使用
        if (align === 'RC' && targetElement && this.isTextElement(targetElement)) {
            const glyphPosition = this.getLastGlyphPosition(targetElement);
            
            if (glyphPosition) {
                // Range APIで取得した最終グリフの右端位置
                console.log('📍 Range API配置:', {
                    element: targetElement.tagName,
                    glyphPosition: glyphPosition,
                    elementRect: { left, top, width, height }
                });
                
                return {
                    x: glyphPosition.x,  // 最終グリフの右端
                    y: glyphPosition.y   // 最終グリフの垂直中央
                };
            } else {
                console.warn('⚠️ Range API取得失敗 - フォールバック');
                // フォールバック: 従来方式
                return { x: left + width * 0.9, y: top + height * 0.5 };
            }
        }
        
        // 通常の要素配置（従来通り）
        const alignMap = {
            'LT': { x: left, y: top },                                    // Left Top
            'TC': { x: left + width * 0.5, y: top },                     // Top Center  
            'RT': { x: left + width, y: top },                           // Right Top
            'LC': { x: left, y: top + height * 0.5 },                   // Left Center
            'CC': { x: left + width * 0.5, y: top + height * 0.5 },     // Center Center
            'RC': { x: left + width, y: top + height * 0.5 },           // Right Center
            'LB': { x: left, y: top + height },                         // Left Bottom
            'BC': { x: left + width * 0.5, y: top + height },           // Bottom Center
            'RB': { x: left + width, y: top + height }                  // Right Bottom
        };
        
        return alignMap[align] || alignMap['CC']; // デフォルトはCenter Center
    }
    
    /**
     * テキスト要素かどうか判定
     * @param {HTMLElement} element - 判定対象要素
     * @returns {boolean} テキスト要素か
     */
    isTextElement(element) {
        const textTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div'];
        return textTags.includes(element.tagName.toLowerCase()) && element.textContent.trim().length > 0;
    }
    
    /**
     * Range APIで最終グリフの位置を取得（オーバーレイ方式）
     * @param {HTMLElement} element - テキスト要素
     * @returns {Object} {x, y, width, height} 最終グリフの矩形
     */
    getLastGlyphPosition(element) {
        try {
            const range = document.createRange();
            const textNode = this.getLastTextNode(element);
            
            if (!textNode || textNode.textContent.trim().length === 0) {
                console.warn('⚠️ テキストノードが見つかりません:', element);
                return null;
            }
            
            const text = textNode.textContent;
            const lastCharIndex = text.length - 1;
            
            // 最後の文字（グリフ）を選択
            range.setStart(textNode, lastCharIndex);
            range.setEnd(textNode, lastCharIndex + 1);
            
            // getClientRects()で最終グリフの矩形を取得
            const rects = range.getClientRects();
            if (rects.length === 0) {
                console.warn('⚠️ 最終グリフの矩形が取得できません');
                return null;
            }
            
            // 最後の矩形（最終行の最終グリフ）
            const lastRect = rects[rects.length - 1];
            
            const glyphInfo = {
                x: lastRect.right,  // グリフの右端（次の文字が来る位置）
                y: lastRect.top + (lastRect.height / 2),  // グリフの垂直中央
                width: lastRect.width,
                height: lastRect.height,
                left: lastRect.left,
                right: lastRect.right,
                top: lastRect.top,
                bottom: lastRect.bottom
            };
            
            console.log('📍 Range API最終グリフ取得:', {
                element: element.tagName,
                textContent: text.substring(Math.max(0, text.length - 10)),
                lastChar: text.charAt(lastCharIndex),
                glyphRect: glyphInfo,
                totalRects: rects.length
            });
            
            return glyphInfo;
            
        } catch (error) {
            console.error('❌ Range API取得エラー:', error);
            return null;
        }
    }
    
    /**
     * 要素内の最後のテキストノードを取得
     * @param {HTMLElement} element - 検索対象要素
     * @returns {Text|null} 最後のテキストノード
     */
    getLastTextNode(element) {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // 空白のみのノードは除外
                    return node.textContent.trim().length > 0 ? 
                        NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }
            }
        );
        
        let lastTextNode = null;
        let node;
        while (node = walker.nextNode()) {
            lastTextNode = node;
        }
        
        return lastTextNode;
    }
    
    /**
     * ビューポート内に配置を制約（簡素化版）
     * @param {Object} position - 配置座標 {x, y}
     * @param {Object} options - Spine要素のオプション
     * @returns {Object} 制約された座標 {x, y}
     */
    constrainToViewport(position, options) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const spineWidth = options.width || 100;
        const spineHeight = options.height || 100;
        const margin = 20; // 画面端からのマージン
        
        // シンプルな画面内制約のみ（テストエリア制約は一時無効化）
        const constrained = {
            x: Math.max(margin, Math.min(position.x, viewportWidth - spineWidth - margin)),
            y: position.y // Y座標は制約しない（元の位置を維持）
        };
        
        // X座標制約が発生した場合のみ警告
        if (constrained.x !== position.x) {
            console.warn('⚠️ X座標制約適用:', {
                originalX: position.x,
                constrainedX: constrained.x,
                viewport: { width: viewportWidth },
                reason: position.x > viewportWidth - spineWidth - margin ? 'right-overflow' : 'left-overflow'
            });
        }
        
        return constrained;
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