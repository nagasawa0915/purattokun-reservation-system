// 🎬 タイムライン制御システム - 統合読み込みエンジン
// 役割: 分割されたモジュールの統合読み込み・既存インターフェース保持
// 依存: timeline-control-core.js, timeline-animation-integration.js, timeline-debug-utilities.js
// 目的: 既存システムの完全保護・500行制限対応

console.log('🎬 Timeline Control Engine 統合モジュール読み込み開始');

// ========== モジュール読み込み順序管理 ========== //

/**
 * 分割モジュール動的読み込みシステム
 * 依存関係を考慮した順次読み込み
 */
class TimelineModuleLoader {
    constructor() {
        this.modules = [
            {
                name: 'Timeline Control Core',
                path: 'assets/spine/timeline-control-core.js',
                required: true,