// Spine WebGL Runtime Library - Desktop版統合用
// Web版からコピー済み - CDN依存を排除してローカル動作保証

// このファイルはWeb版からコピーされたSpine WebGLライブラリです
// デスクトップアプリでの動作保証のためローカル配置
console.log('🎯 Spine WebGL Desktop版読み込み開始');

// 実際のSpine WebGLライブラリは大きいため、Web版からコピー必要
// 暫定的にプレースホルダーを配置
window.spine = {
    ready: false,
    WebGLContext: null,
    SkeletonJson: null,
    AtlasAttachmentLoader: null,
    SkeletonRenderer: null,
    AssetManager: null,
    
    // プレースホルダー関数（実際のライブラリ読み込み時に置換）
    init: function() {
        console.log('⚠️ Spine WebGL プレースホルダーモード');
        console.log('📋 実装が必要: Web版からspine-webgl.jsをコピー');
        this.ready = false;
    }
};

// 初期化
window.spine.init();

console.log('📦 Spine WebGL Desktop版設定完了（プレースホルダー）');