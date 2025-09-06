/**
 * script-coordinated.js - 司令塔統制版統合システム
 * 
 * SystemCoordinatorを使用してマイクロモジュールを協調制御
 */

import SystemCoordinator from '../micromodules/core/SystemCoordinator.js';
import { getGlobalEventBus } from '../micromodules/ui-panel-manager/EventBus.js';
import TimelineModule from '../micromodules/ui-timeline/TimelineModule.js';
import LayoutManager from '../micromodules/ui-layout-manager/LayoutManager.js';
import DragSplitManager from '../micromodules/ui-drag-split/DragSplitManager.js';

class CoordinatedSpineEditorApp {
    constructor() {
        this.eventBus = getGlobalEventBus();
        this.coordinator = null;
        
        this.init();
    }
    
    async init() {
        console.log('🎯 協調制御版 Spine Editor WebApp 開始');
        
        try {
            // 司令塔システム初期化
            this.coordinator = new SystemCoordinator({
                eventBus: this.eventBus,
                container: document.body
            });
            
            // モジュール登録（フェーズ・優先順・依存関係を明確に定義）
            this.registerAllModules();
            
            // グローバルアクセス用
            window.coordinator = this.coordinator;
            window.coordinatedApp = this;
            
            // 司令塔主導の初期化開始
            // （SystemCoordinator内で自動的に開始される）
            
        } catch (error) {
            console.error('❌ 協調制御版アプリ初期化失敗:', error);
        }
    }
    
    /**
     * 全モジュールの登録
     */
    registerAllModules() {
        // Phase 1: Core Systems (基礎システム)
        this.coordinator.registerModule('LayoutManager', LayoutManager, {
            phase: 'core-systems',
            priority: 10,
            dependencies: [],
            domTargets: [
                '.resize-handle.resize-handle-left',
                '.resize-handle.resize-handle-right', 
                '.resize-handle.resize-handle-timeline'
            ]
        });
        
        // Phase 2: UI Controllers (UI制御)
        this.coordinator.registerModule('TimelineModule', TimelineModule, {
            phase: 'ui-controllers',
            priority: 20,
            dependencies: [],
            domTargets: [
                '.timeline-panel'
            ]
        });
        
        // Phase 3: Interaction (インタラクション)
        this.coordinator.registerModule('DragSplitManager', DragSplitManager, {
            phase: 'interaction',
            priority: 30,
            dependencies: ['LayoutManager'],
            domTargets: [
                '.panel' // DragSplitManagerが内部で.panel-headerを検索するため
            ]
        });
        
        console.log('📝 全モジュール登録完了');
    }
    
    /**
     * システム状態確認
     */
    getStatus() {
        return this.coordinator.getSystemStatus();
    }
    
    /**
     * 緊急修復
     */
    emergencyRepair() {
        return this.coordinator.emergencyRepair();
    }
    
    shutdown() {
        if (this.coordinator) {
            this.coordinator.destroy();
        }
        console.log('✅ 協調制御版アプリ終了');
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    const app = new CoordinatedSpineEditorApp();
    
    // ページ離脱時の保存
    window.addEventListener('beforeunload', () => {
        app.shutdown();
    });
});

// デバッグ機能
window.debugCoordinator = function() {
    if (window.coordinator) {
        console.log('🎯 SystemCoordinator 状態:');
        console.log(window.coordinator.getSystemStatus());
    } else {
        console.log('❌ SystemCoordinator が見つかりません');
    }
};

// 修復機能
window.repairSystem = function() {
    if (window.coordinatedApp) {
        window.coordinatedApp.emergencyRepair();
    } else {
        console.log('❌ CoordinatedApp が見つかりません');
    }
};

console.log('⌨️ 協調制御版デバッグコマンド:');
console.log('  debugCoordinator() - システム状態確認');
console.log('  repairSystem() - 緊急修復実行');
console.log('🔧 Debug: window.coordinator, window.coordinatedApp');