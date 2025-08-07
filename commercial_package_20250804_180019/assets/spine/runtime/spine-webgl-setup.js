/**
 * Spine WebGL Runtime Setup v4.2
 * 
 * インストール手順:
 * 1. https://github.com/EsotericSoftware/spine-runtimes/tree/4.2/spine-ts/spine-webgl/dist
 * 2. spine-webgl.js をダウンロード
 * 3. このファイル（spine-webgl-setup.js）と置き換え
 * 
 * または、以下のCDNリンクをHTMLに追加:
 * <script src="https://unpkg.com/@esotericsoftware/spine-webgl@4.2.29/dist/spine-webgl.js"></script>
 */

// CDNからの動的読み込み試行
function loadSpineWebGLFromCDN() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@esotericsoftware/spine-webgl@4.2.29/dist/spine-webgl.js';
        script.onload = () => {
            console.log('✅ Spine WebGL Runtime loaded from CDN');
            resolve(true);
        };
        script.onerror = () => {
            console.warn('❌ CDN loading failed. Please download spine-webgl.js manually');
            reject(false);
        };
        document.head.appendChild(script);
    });
}

// 初期化
if (typeof spine === 'undefined') {
    console.log('🔄 Attempting to load Spine WebGL from CDN...');
    loadSpineWebGLFromCDN().catch(() => {
        // CDN失敗時のフォールバック
        window.SpineWebGL = {
            ready: false,
            init: function() {
                console.log('Spine WebGL not available. Manual installation required.');
                console.log('Download: https://github.com/EsotericSoftware/spine-runtimes/tree/4.2/spine-ts/spine-webgl/dist/spine-webgl.js');
                return false;
            }
        };
    });
} else {
    console.log('✅ Spine WebGL Runtime already loaded');
}