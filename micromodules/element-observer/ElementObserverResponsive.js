/**
 * ElementObserverResponsive.js - Phase 2 アーカイブ済み
 * 
 * このファイルは archive/element-observer-phase2-complete/modules/ に移動されました
 * AutoPin開発に集中するためPhase 1 BB特化版に戻します
 * 
 * 復元方法:
 * cp archive/element-observer-phase2-complete/modules/ElementObserverResponsive.js ./
 */

// Phase 2機能が必要な場合は、アーカイブから復元してください
console.warn('ElementObserverResponsive は Phase 2完全アーカイブ済みです。');
console.info('復元方法: archive/element-observer-phase2-complete/modules/ から復元');

// 軽量なダミークラス（エラー防止用）
class ElementObserverResponsive {
    constructor() {
        console.warn('ElementObserverResponsive: Phase 2機能はアーカイブ済みです。Phase 1のElementObserverまたはElementObserverCoreをご利用ください。');
    }

    // 基本的なAPI互換性（エラー回避用）
    updateCanvasSize() { return false; }
    getActualSizes() { return { css: { width: 0, height: 0 } }; }
    cleanup() {}
}

if (typeof window !== 'undefined') {
    window.ElementObserverResponsive = ElementObserverResponsive;
}