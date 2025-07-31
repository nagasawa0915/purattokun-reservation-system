// 🎯 Spine編集システム - モジュラー版メインエントリーファイル
// 役割: 既存互換性維持、モジュール統合、初期化制御

console.log('🚀 Spine編集システム モジュラー版 読み込み開始');

// ========== モジュール読み込み確認 ========== //

function checkModuleLoaded(moduleName, testFunction) {
    if (typeof testFunction === 'function') {
        console.log(`✅ ${moduleName} モジュール読み込み済み`);
        return true;
    } else {
        console.error(`❌ ${moduleName} モジュールが読み込まれていません`);
        return false;
    }
}

// モジュール読み込み確認
function verifyModules() {
    console.log('🔍 モジュール読み込み確認開始');
    
    const modules = [
        { name: 'core-system', test: window.initializeDOMElements },
        { name: 'ui-components', test: window.createCoordinateDisplay },
        { name: 'character-editing', test: window.createHandles },
        { name: 'event-handlers', test: window.setupEventListeners },
        { name: 'debug-utilities', test: window.emergencyDiagnostic }
    ];
    
    let allLoaded = true;
    modules.forEach(module => {
        if (!checkModuleLoaded(module.name, module.test)) {
            allLoaded = false;
        }
    });
    
    if (allLoaded) {
        console.log('✅ 全モジュール読み込み確認完了');
    } else {
        console.error('❌ 一部モジュールの読み込みに失敗しています');
    }
    
    return allLoaded;
}

// ========== 互換性維持のための統合関数 ========== //

// 既存のspine-positioning-system-explanation.jsと同じインターフェースを提供
function initializeSpinePositioning() {
    console.log('🔧 Spine編集システム初期化開始（モジュラー版）');
    
    // モジュール読み込み確認
    if (!verifyModules()) {
        console.error('❌ モジュール読み込み不完全のため初期化を中止');
        return false;
    }
    
    // DOM初期化（core-systemモジュール）
    if (typeof window.initializeDOMElements === 'function') {
        const success = window.initializeDOMElements();
        if (!success) {
            console.error('❌ DOM初期化に失敗');
            return false;
        }
    }
    
    console.log('✅ Spine編集システム初期化完了（モジュラー版）');
    return true;
}

// ========== 自動初期化システム ========== //

// DOMContentLoaded時の自動初期化
function autoInitialize() {
    // spine-positioning-system-explanation.jsと同じタイミングで初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                console.log('📅 DOMContentLoaded後の自動初期化開始');
                initializeSpinePositioning();
            }, 100);
        });
    } else {
        // すでにDOMが読み込まれている場合は即座に実行
        setTimeout(() => {
            console.log('📅 即座の自動初期化開始');
            initializeSpinePositioning();
        }, 100);
    }
}

// ========== 既存関数の互換性確保 ========== //

// spine-positioning-system-explanation.jsの主要関数がすべて利用可能か確認
function ensureCompatibility() {
    const requiredFunctions = [
        'startCharacterEdit',
        'endEditMode',
        'confirmEdit',
        'cancelEdit',
        'showConfirmPanel',
        'hideConfirmPanel',
        'emergencyDiagnostic',
        'debugPositioningSystem',
        'clearAllPositionData',
        'forceRestoreState',
        'ultimatePositionFix'
    ];
    
    let missingFunctions = [];
    requiredFunctions.forEach(funcName => {
        if (typeof window[funcName] !== 'function') {
            missingFunctions.push(funcName);
        }
    });
    
    if (missingFunctions.length > 0) {
        console.warn('⚠️ 互換性問題: 以下の関数が見つかりません:', missingFunctions);
        return false;
    } else {
        console.log('✅ 既存互換性確認完了 - 全関数利用可能');
        return true;
    }
}

// ========== グローバル関数として公開 ========== //

// メイン初期化関数
window.initializeSpinePositioning = initializeSpinePositioning;
window.verifyModules = verifyModules;
window.ensureCompatibility = ensureCompatibility;

// ========== 初期化実行 ========== //

// 自動初期化を開始
autoInitialize();

// 初期化完了後の互換性確認
setTimeout(() => {
    console.log('🔍 互換性確認実行');
    ensureCompatibility();
    
    // 最終確認メッセージ
    console.log('🚨 Spine編集システム モジュラー版 読み込み完了');
    console.log('🔧 新機能: モジュール化による保守性向上・デバッグ機能強化');
    console.log('💡 使用方法: 従来と同じ - startCharacterEdit() で編集開始');
    console.log('💡 デバッグ: ultimatePositionFix() で一括診断・修正');
    console.log('📋 モジュール構成:');
    console.log('  - core-system.js: 状態管理・DOM初期化');
    console.log('  - ui-components.js: UI要素管理');
    console.log('  - character-editing.js: 編集機能');
    console.log('  - event-handlers.js: イベント処理');
    console.log('  - debug-utilities.js: デバッグ・診断');
}, 500);