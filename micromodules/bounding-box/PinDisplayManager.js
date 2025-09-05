/**
 * PinDisplayManager.js
 * 
 * 🎯 ピン表示管理マイクロモジュール
 * - 責務: UI表示・アンカーマーカー・ドラッグハンドル
 * - 外部依存: なし（完全独立）
 * - 行数: 約450行（500行制限遵守）
 * - 作成日: 2025-09-05
 */

class PinDisplayManager {
    constructor() {
        this.activeMarkers = new Map(); // nodeId -> marker info
        this.stylesInjected = false;
        
        console.log('🎯 PinDisplayManager初期化完了');
    }
    
    // ==========================================
    // 📍 アンカーポイント表示機能
    // ==========================================
    
    /**
     * アンカーポイント表示（デバッグ用）
     * 設定されたアンカーポイントを常時表示する
     */
    showAnchorPoint(nodeId) {
        try {
            // 既存のアンカーマーカーをクリア
            this.hideAnchorPoint(nodeId);
            
            // 保存データからアンカー情報を取得
            const storageKey = `autopin-${nodeId}`;
            const savedData = localStorage.getItem(storageKey);
            
            if (!savedData) {
                console.log('📍 アンカーポイント表示: 保存データなし');
                return;
            }
            
            const pinData = JSON.parse(savedData);
            if (!pinData.anchor || !pinData.backgroundElement) {
                console.log('📍 アンカーポイント表示: アンカー/背景データなし');
                return;
            }
            
            // 背景要素を取得 (ヒーロー画像要素優先)
            let backgroundElement;
            
            if (pinData.backgroundElement.id) {
                backgroundElement = document.getElementById(pinData.backgroundElement.id);
            } else {
                // ヒーロー画像要素を優先して検索
                const selector = pinData.backgroundElement.selector;
                if (selector) {
                    backgroundElement = document.querySelector(selector);
                } else {
                    // フォールバック: ヒーロー画像要素を順番に検索
                    const heroSelectors = ['.hero-section', '.hero-image', '[class*="hero"]'];
                    for (const heroSelector of heroSelectors) {
                        backgroundElement = document.querySelector(heroSelector);
                        if (backgroundElement) break;
                    }
                }
            }
                
            if (!backgroundElement) {
                console.warn('⚠️ アンカーポイント表示: 背景要素が見つかりません');
                return;
            }
            
            // アンカーポイント位置を計算
            const backgroundRect = backgroundElement.getBoundingClientRect();
            const anchorRatios = this.getAnchorRatios(pinData.anchor);
            
            const anchorX = backgroundRect.left + (backgroundRect.width * anchorRatios.x);
            const anchorY = backgroundRect.top + (backgroundRect.height * anchorRatios.y);
            
            // アンカーマーカー要素を作成
            const marker = document.createElement('div');
            marker.className = `autopin-marker anchor-${pinData.anchor}`;
            marker.id = `anchor-marker-${nodeId}`;
            marker.style.cssText = `
                position: fixed;
                left: ${anchorX}px;
                top: ${anchorY}px;
                width: 16px;
                height: 16px;
                background: #ff4757;
                border: 2px solid #fff;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(255, 71, 87, 0.6);
                z-index: 10000;
                pointer-events: none;
                transform: translate(-50%, -50%);
            `;
            
            // ラベルを追加
            const label = document.createElement('div');
            label.style.cssText = `
                position: absolute;
                bottom: -25px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 10px;
                color: #fff;
                background: rgba(0, 0, 0, 0.8);
                padding: 2px 6px;
                border-radius: 3px;
                white-space: nowrap;
                font-weight: bold;
            `;
            label.textContent = pinData.anchor;
            marker.appendChild(label);
            
            // ドキュメントに追加
            document.body.appendChild(marker);
            
            // マーカー情報を記録
            this.activeMarkers.set(`anchor-${nodeId}`, {
                type: 'anchor',
                nodeId: nodeId,
                element: marker,
                anchor: pinData.anchor
            });
            
            console.log('📍 アンカーポイント表示完了:', {
                nodeId,
                anchor: pinData.anchor,
                position: `${anchorX.toFixed(1)}, ${anchorY.toFixed(1)}`,
                backgroundElement: pinData.backgroundElement.tagName || 'unknown'
            });
            
        } catch (error) {
            console.error('❌ アンカーポイント表示エラー:', error);
        }
    }
    
    /**
     * アンカーポイント非表示
     */
    hideAnchorPoint(nodeId) {
        const markerId = `anchor-marker-${nodeId}`;
        const existingMarker = document.getElementById(markerId);
        if (existingMarker) {
            existingMarker.remove();
            this.activeMarkers.delete(`anchor-${nodeId}`);
            console.log('📍 アンカーマーカー削除:', markerId);
        }
    }
    
    /**
     * アンカー比率取得
     */
    getAnchorRatios(anchor) {
        const anchorMap = {
            'TL': { x: 0, y: 0 },     'TC': { x: 0.5, y: 0 },   'TR': { x: 1, y: 0 },
            'ML': { x: 0, y: 0.5 },   'MC': { x: 0.5, y: 0.5 }, 'MR': { x: 1, y: 0.5 },
            'BL': { x: 0, y: 1 },     'BC': { x: 0.5, y: 1 },   'BR': { x: 1, y: 1 }
        };
        return anchorMap[anchor] || { x: 0.5, y: 0.5 };
    }
    
    // ==========================================
    // 📌 ユーザーピン表示機能
    // ==========================================
    
    /**
     * ユーザー設定ピン表示機能（TwoStageSelector結果）
     * ドラッグで設定された正確なピン位置を表示する
     */
    showUserPin(nodeId) {
        try {
            // 既存のピンマーカーをクリア
            this.hideUserPin(nodeId);
            
            // TwoStageSelectorで保存されたピン情報を取得
            const storageKey = `user-pin-${nodeId}`;
            let pinData = localStorage.getItem(storageKey);
            
            if (!pinData) {
                // AutoPinデータからも確認
                const autoPinKey = `autopin-${nodeId}`;
                const autoPinData = localStorage.getItem(autoPinKey);
                if (autoPinData) {
                    const parsed = JSON.parse(autoPinData);
                    if (parsed.userPinPosition) {
                        pinData = JSON.stringify(parsed.userPinPosition);
                    }
                }
            }
            
            if (!pinData) {
                console.log('📍 ユーザーピン表示: 保存データなし');
                return;
            }
            
            const userPin = JSON.parse(pinData);
            console.log('📍 ユーザーピンデータ:', userPin);
            
            // 対象要素を特定
            let targetElement = null;
            if (userPin.element && userPin.element.id) {
                targetElement = document.getElementById(userPin.element.id);
            } else if (userPin.element && userPin.element.selector) {
                targetElement = document.querySelector(userPin.element.selector);
            }
            
            if (!targetElement) {
                console.warn('⚠️ ユーザーピン表示: 対象要素が見つかりません');
                return;
            }
            
            // ピン位置を計算（TwoStageSelector形式）
            const rect = targetElement.getBoundingClientRect();
            const anchorPoint = userPin.anchorPoints ? userPin.anchorPoints[0] : userPin;
            
            const pinX = rect.left + (rect.width * anchorPoint.ratioX) + (anchorPoint.offsetX || 0);
            const pinY = rect.top + (rect.height * anchorPoint.ratioY) + (anchorPoint.offsetY || 0);
            
            // ユーザーピンスタイルを注入
            this.injectUserPinStyles();
            
            // ピンマーカー要素を作成（青色で区別）
            const marker = document.createElement('div');
            marker.className = 'user-pin-marker';
            marker.id = `user-pin-marker-${nodeId}`;
            marker.style.cssText = `
                position: fixed;
                left: ${pinX}px;
                top: ${pinY}px;
                width: 20px;
                height: 20px;
                background: #007bff;
                border: 3px solid #fff;
                border-radius: 50%;
                box-shadow: 0 3px 12px rgba(0, 123, 255, 0.7);
                z-index: 10001;
                pointer-events: none;
                transform: translate(-50%, -50%);
                animation: user-pin-pulse 2s infinite;
            `;
            
            // ピンアイコンを追加
            const icon = document.createElement('div');
            icon.style.cssText = `
                position: absolute;
                top: -30px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 16px;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
            `;
            icon.textContent = '📌';
            marker.appendChild(icon);
            
            // ラベルを追加
            const label = document.createElement('div');
            label.style.cssText = `
                position: absolute;
                bottom: -30px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 11px;
                color: #fff;
                background: rgba(0, 123, 255, 0.9);
                padding: 3px 8px;
                border-radius: 4px;
                white-space: nowrap;
                font-weight: bold;
            `;
            label.textContent = 'USER PIN';
            marker.appendChild(label);
            
            // ドキュメントに追加
            document.body.appendChild(marker);
            
            // マーカー情報を記録
            this.activeMarkers.set(`user-${nodeId}`, {
                type: 'user',
                nodeId: nodeId,
                element: marker,
                position: { x: pinX, y: pinY }
            });
            
            console.log('📍 ユーザーピン表示完了:', {
                nodeId,
                position: `${pinX.toFixed(1)}, ${pinY.toFixed(1)}`,
                ratio: `${(anchorPoint.ratioX * 100).toFixed(1)}%, ${(anchorPoint.ratioY * 100).toFixed(1)}%`,
                offset: `${anchorPoint.offsetX || 0}, ${anchorPoint.offsetY || 0}`,
                element: targetElement.tagName
            });
            
        } catch (error) {
            console.error('❌ ユーザーピン表示エラー:', error);
        }
    }
    
    /**
     * ユーザー設定ピン非表示
     */
    hideUserPin(nodeId) {
        const markerId = `user-pin-marker-${nodeId}`;
        const existingMarker = document.getElementById(markerId);
        if (existingMarker) {
            existingMarker.remove();
            this.activeMarkers.delete(`user-${nodeId}`);
            console.log('📍 ユーザーピンマーカー削除:', markerId);
        }
    }
    
    /**
     * ユーザーピン用スタイルの注入
     */
    injectUserPinStyles() {
        if (!document.getElementById('user-pin-styles')) {
            const style = document.createElement('style');
            style.id = 'user-pin-styles';
            style.textContent = `
                @keyframes user-pin-pulse {
                    0% { box-shadow: 0 3px 12px rgba(0, 123, 255, 0.7); }
                    50% { box-shadow: 0 3px 12px rgba(0, 123, 255, 1), 0 0 0 8px rgba(0, 123, 255, 0.3); }
                    100% { box-shadow: 0 3px 12px rgba(0, 123, 255, 0.7); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // ==========================================
    // 🖱️ ドラッグハンドル表示機能
    // ==========================================
    
    /**
     * ドラッグハンドル表示機能（ElementSelector風）
     * TwoStageSelectorで設定されたピン位置にドラッグハンドルを表示
     */
    showDragHandle(nodeId, onDragCallback = null) {
        try {
            // 既存のドラッグハンドルをクリア
            this.hideDragHandle(nodeId);
            
            // ユーザーピンデータを取得
            const storageKey = `user-pin-${nodeId}`;
            let pinData = localStorage.getItem(storageKey);
            
            if (!pinData) {
                // AutoPinデータからも確認
                const autoPinKey = `autopin-${nodeId}`;
                const autoPinData = localStorage.getItem(autoPinKey);
                if (autoPinData) {
                    const parsed = JSON.parse(autoPinData);
                    if (parsed.userPinPosition) {
                        pinData = JSON.stringify(parsed.userPinPosition);
                    }
                }
            }
            
            if (!pinData) {
                console.log('🖱️ ドラッグハンドル表示: 保存データなし');
                return;
            }
            
            const userPin = JSON.parse(pinData);
            console.log('🖱️ ドラッグハンドルデータ:', userPin);
            
            // 対象要素を特定
            let targetElement = null;
            if (userPin.element && userPin.element.id) {
                targetElement = document.getElementById(userPin.element.id);
            } else if (userPin.element && userPin.element.selector) {
                targetElement = document.querySelector(userPin.element.selector);
            }
            
            if (!targetElement) {
                console.warn('⚠️ ドラッグハンドル表示: 対象要素が見つかりません');
                return;
            }
            
            // ピン位置を計算
            const rect = targetElement.getBoundingClientRect();
            const anchorPoint = userPin.anchorPoints ? userPin.anchorPoints[0] : userPin;
            
            const handleX = rect.left + (rect.width * anchorPoint.ratioX) + (anchorPoint.offsetX || 0);
            const handleY = rect.top + (rect.height * anchorPoint.ratioY) + (anchorPoint.offsetY || 0);
            
            // ドラッグハンドルスタイルを注入
            this.injectDragHandleStyles();
            
            // ドラッグハンドル要素を作成
            const handle = document.createElement('div');
            handle.className = 'persistent-drag-handle';
            handle.id = `persistent-drag-handle-${nodeId}`;
            handle.title = 'ドラッグして位置調整';
            handle.style.cssText = `
                left: ${handleX}px;
                top: ${handleY}px;
            `;
            
            // 情報ラベルを追加
            const infoLabel = document.createElement('div');
            infoLabel.style.cssText = `
                position: absolute;
                top: -35px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 10px;
                color: #fff;
                background: rgba(255, 107, 53, 0.9);
                padding: 2px 6px;
                border-radius: 3px;
                white-space: nowrap;
                font-weight: bold;
                pointer-events: none;
            `;
            infoLabel.textContent = 'DRAG PIN';
            handle.appendChild(infoLabel);
            
            // ドラッグ機能の追加
            let isDragging = false;
            handle.addEventListener('mousedown', (e) => {
                isDragging = true;
                handle.classList.add('dragging');
                e.preventDefault();
            });
            
            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    handle.style.left = e.clientX + 'px';
                    handle.style.top = e.clientY + 'px';
                    
                    // コールバック実行
                    if (onDragCallback) {
                        onDragCallback({
                            nodeId: nodeId,
                            x: e.clientX,
                            y: e.clientY
                        });
                    }
                }
            });
            
            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    handle.classList.remove('dragging');
                }
            });
            
            // ドキュメントに追加
            document.body.appendChild(handle);
            
            // マーカー情報を記録
            this.activeMarkers.set(`drag-${nodeId}`, {
                type: 'drag',
                nodeId: nodeId,
                element: handle,
                position: { x: handleX, y: handleY }
            });
            
            console.log('🖱️ ドラッグハンドル表示完了:', {
                nodeId,
                position: `${handleX.toFixed(1)}, ${handleY.toFixed(1)}`,
                ratio: `${(anchorPoint.ratioX * 100).toFixed(1)}%, ${(anchorPoint.ratioY * 100).toFixed(1)}%`,
                offset: `${anchorPoint.offsetX || 0}, ${anchorPoint.offsetY || 0}`,
                element: targetElement.tagName
            });
            
        } catch (error) {
            console.error('❌ ドラッグハンドル表示エラー:', error);
        }
    }
    
    /**
     * ドラッグハンドル非表示
     */
    hideDragHandle(nodeId) {
        const handleId = `persistent-drag-handle-${nodeId}`;
        const existingHandle = document.getElementById(handleId);
        if (existingHandle) {
            existingHandle.remove();
            this.activeMarkers.delete(`drag-${nodeId}`);
            console.log('🖱️ ドラッグハンドル削除:', handleId);
        }
    }
    
    /**
     * ドラッグハンドル用スタイルの注入
     */
    injectDragHandleStyles() {
        if (!document.getElementById('drag-handle-styles')) {
            const style = document.createElement('style');
            style.id = 'drag-handle-styles';
            style.textContent = `
                .persistent-drag-handle {
                    position: fixed;
                    width: 20px;
                    height: 20px;
                    background: #ff6b35;
                    border: 3px solid white;
                    border-radius: 50%;
                    cursor: grab;
                    z-index: 10011;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                    transition: all 0.2s ease;
                    transform: translate(-50%, -50%);
                }
                .persistent-drag-handle:hover {
                    transform: translate(-50%, -50%) scale(1.2);
                    background: #ff8c35;
                }
                .persistent-drag-handle.dragging {
                    cursor: grabbing;
                    transform: translate(-50%, -50%) scale(1.3);
                    background: #ff4500;
                    box-shadow: 0 4px 16px rgba(255, 107, 53, 0.4);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // ==========================================
    // 🧹 マーカー管理機能
    // ==========================================
    
    /**
     * 全てのマーカーを非表示
     */
    hideAllMarkers(nodeId = null) {
        if (nodeId) {
            // 特定nodeIdのマーカーのみ削除
            this.hideAnchorPoint(nodeId);
            this.hideUserPin(nodeId);
            this.hideDragHandle(nodeId);
        } else {
            // 全てのマーカーを削除
            this.activeMarkers.forEach((marker, key) => {
                if (marker.element && marker.element.parentNode) {
                    marker.element.remove();
                }
            });
            this.activeMarkers.clear();
            console.log('🧹 全マーカー削除完了');
        }
    }
    
    /**
     * マーカー情報の取得
     */
    getActiveMarkers() {
        return Array.from(this.activeMarkers.entries()).map(([key, marker]) => ({
            key: key,
            type: marker.type,
            nodeId: marker.nodeId,
            position: marker.position,
            anchor: marker.anchor
        }));
    }
    
    /**
     * マーカーの存在確認
     */
    hasMarker(nodeId, type) {
        return this.activeMarkers.has(`${type}-${nodeId}`);
    }
    
    /**
     * 全マーカーの位置を更新（ウィンドウリサイズ対応）
     */
    updateAllMarkerPositions() {
        this.activeMarkers.forEach((marker, key) => {
            const [type, nodeId] = key.split('-', 2);
            
            // 各タイプに応じて再表示
            try {
                switch (type) {
                    case 'anchor':
                        this.showAnchorPoint(nodeId);
                        break;
                    case 'user':
                        this.showUserPin(nodeId);
                        break;
                    case 'drag':
                        this.showDragHandle(nodeId);
                        break;
                }
            } catch (error) {
                console.warn(`⚠️ マーカー位置更新失敗 (${key}):`, error.message);
            }
        });
        
        console.log('🔄 全マーカー位置更新完了');
    }
    
    // ==========================================
    // 🔧 ユーティリティメソッド
    // ==========================================
    
    /**
     * デバッグ情報の取得
     */
    getDebugInfo() {
        return {
            version: '1.0',
            className: 'PinDisplayManager',
            activeMarkersCount: this.activeMarkers.size,
            activeMarkers: this.getActiveMarkers(),
            stylesInjected: {
                userPin: !!document.getElementById('user-pin-styles'),
                dragHandle: !!document.getElementById('drag-handle-styles')
            },
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * クリーンアップ
     */
    cleanup() {
        // 全マーカー削除
        this.hideAllMarkers();
        
        // 注入したスタイルを削除
        const userPinStyles = document.getElementById('user-pin-styles');
        if (userPinStyles) {
            userPinStyles.remove();
        }
        
        const dragHandleStyles = document.getElementById('drag-handle-styles');
        if (dragHandleStyles) {
            dragHandleStyles.remove();
        }
        
        console.log('🧹 PinDisplayManager完全クリーンアップ完了');
    }
}

// フォルダ内完結: グローバル公開
if (typeof window !== 'undefined') {
    window.PinDisplayManager = PinDisplayManager;
}