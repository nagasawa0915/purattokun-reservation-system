/**
 * Spine デバッグウィンドウシステム
 * 開発時のデバッグ情報表示とモニタリング機能
 */

class SpineDebugWindow {
    constructor() {
        this.debugWindow = null;
        this.isVisible = false;
        this.updateInterval = null;
        
        // 本番モードでは作成しない
        if (DEBUG_CONFIG.categories.debug_ui) {
            this.createDebugWindow();
        }
    }

    createDebugWindow() {
        log(LogLevel.DEBUG, 'debug_ui', 'Creating Spine Debug Window');
        
        // デバッグウィンドウ作成
        this.debugWindow = document.createElement('div');
        this.debugWindow.id = 'spine-debug-window';
        this.debugWindow.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 350px;
            max-height: 400px;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 15px;
            border-radius: 8px;
            border: 2px solid #00ff00;
            z-index: 9999;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3);
            backdrop-filter: blur(5px);
            display: none;
        `;

        // ヘッダー作成
        const header = document.createElement('div');
        header.style.cssText = `
            border-bottom: 1px solid #00ff00;
            padding-bottom: 8px;
            margin-bottom: 10px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        header.innerHTML = `
            <span>🔍 Spine Debug Monitor</span>
            <button id="debug-close" style="
                background: #ff4444;
                color: white;
                border: none;
                padding: 2px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 10px;
            ">✕</button>
        `;

        // コンテンツ領域
        const content = document.createElement('div');
        content.id = 'debug-content';
        content.style.cssText = `
            line-height: 1.4;
            white-space: pre-wrap;
        `;

        this.debugWindow.appendChild(header);
        this.debugWindow.appendChild(content);
        document.body.appendChild(this.debugWindow);

        // 閉じるボタンのイベント
        document.getElementById('debug-close').addEventListener('click', () => {
            this.hide();
        });

        log(LogLevel.INFO, 'debug_ui', 'Spine Debug Window created - Press F12 then type "spineDebug.show()" to display');
    }

    show() {
        if (!this.debugWindow) return;
        
        this.debugWindow.style.display = 'block';
        this.isVisible = true;
        this.startMonitoring();
        log(LogLevel.INFO, 'debug_ui', 'Spine Debug Window shown');
    }

    hide() {
        if (!this.debugWindow) return;
        
        this.debugWindow.style.display = 'none';
        this.isVisible = false;
        this.stopMonitoring();
        log(LogLevel.INFO, 'debug_ui', 'Spine Debug Window hidden');
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    startMonitoring() {
        if (!this.debugWindow) return;
        
        this.stopMonitoring(); // 重複防止
        
        this.updateInterval = setInterval(() => {
            this.updateDebugInfo();
        }, 500); // 0.5秒ごとに更新
        
        log(LogLevel.DEBUG, 'debug_ui', 'Debug monitoring started');
    }

    stopMonitoring() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            log(LogLevel.DEBUG, 'debug_ui', 'Debug monitoring stopped');
        }
    }

    updateDebugInfo() {
        if (!this.debugWindow || !this.isVisible) return;
        
        const content = document.getElementById('debug-content');
        if (!content) return;
        
        try {
            // 基本情報収集
            const info = this.gatherDebugInfo();
            
            // 表示用フォーマット
            const debugText = this.formatDebugInfo(info);
            content.textContent = debugText;
            
        } catch (error) {
            content.textContent = `Debug info gathering failed: ${error.message}`;
        }
    }

    gatherDebugInfo() {
        const info = {
            timestamp: new Date().toLocaleTimeString(),
            spine: {
                loaded: typeof spine !== 'undefined',
                initialized: window.spineManager?.initialized || false,
                characters: window.spineManager?.characters?.size || 0
            },
            page: {
                protocol: window.location.protocol,
                hostname: window.location.hostname,
                url: window.location.href
            },
            performance: {
                memory: performance.memory ? {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
                } : 'Not available'
            }
        };
        
        return info;
    }

    formatDebugInfo(info) {
        return `Last Update: ${info.timestamp}

🎯 Spine Status:
  - Runtime Loaded: ${info.spine.loaded ? '✅' : '❌'}
  - Manager Init: ${info.spine.initialized ? '✅' : '❌'}
  - Characters: ${info.spine.characters}

🌐 Environment:
  - Protocol: ${info.page.protocol}
  - Host: ${info.page.hostname}
  - URL: ${info.page.url.substring(0, 50)}...

📊 Performance:
  - Memory Used: ${info.performance.memory.used || 'N/A'} MB
  - Memory Total: ${info.performance.memory.total || 'N/A'} MB
  - Memory Limit: ${info.performance.memory.limit || 'N/A'} MB

💡 Debug Level: ${DEBUG_CONFIG.level}
🔧 Categories: ${Object.entries(DEBUG_CONFIG.categories)
    .filter(([k, v]) => v)
    .map(([k]) => k)
    .join(', ')}`;
    }
}