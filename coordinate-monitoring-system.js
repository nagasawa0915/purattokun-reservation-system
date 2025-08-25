/**
 * 🔍 座標書き込み監視システム - 瞬間移動問題診断用
 * 
 * 目的：バウンディングボックス表示時の座標競合を特定する
 * 機能：
 * 1. Skeleton座標（x/y）への書き込み監視
 * 2. Canvas要素のstyle変更監視  
 * 3. 書き込み元の特定（コールスタック表示）
 * 4. 競合タイミングの可視化
 */
class PureSpineCoordinateMonitor {
    constructor() {
        this.isMonitoring = false;
        this.logs = [];
        this.mutationObserver = null;
        this.originalDescriptors = {};
    }

    startMonitoring(editor) {
        if (this.isMonitoring) {
            console.warn("🔍 監視はすでに開始されています");
            return;
        }

        this.isMonitoring = true;
        this.editor = editor;
        this.logs = [];
        
        console.log("🔍 座標書き込み監視開始");
        this.setupSkeletonMonitoring();
        this.setupCanvasStyleMonitoring();
        console.log("✅ 座標書き込み監視システム設定完了");
    }

    setupSkeletonMonitoring() {
        if (!this.editor?.state?.spine?.skeleton) {
            console.warn("⚠️ Skeleton未初期化のため監視をスキップ");
            return;
        }

        const skeleton = this.editor.state.spine.skeleton;
        const monitor = this;
        
        // x座標監視（直接プロパティアクセス）
        let originalX = skeleton.x;
        Object.defineProperty(skeleton, "_x", {
            value: originalX,
            writable: true,
            configurable: true
        });
        
        Object.defineProperty(skeleton, "x", {
            get: function() {
                return this._x;
            },
            set: function(value) {
                const stack = (new Error()).stack.split("n")[2] || "Unknown";
                monitor.logCoordinateWrite("skeleton.x", value, stack);
                this._x = value;
            },
            configurable: true,
            enumerable: true
        });

        // y座標監視
        let originalY = skeleton.y;
        Object.defineProperty(skeleton, "_y", {
            value: originalY,
            writable: true,
            configurable: true
        });
        
        Object.defineProperty(skeleton, "y", {
            get: function() {
                return this._y;
            },
            set: function(value) {
                const stack = (new Error()).stack.split("n")[2] || "Unknown";
                monitor.logCoordinateWrite("skeleton.y", value, stack);
                this._y = value;
            },
            configurable: true,
            enumerable: true
        });

        console.log("🎯 Skeleton座標監視設定完了");
    }

    setupCanvasStyleMonitoring() {
        if (!this.editor?.config?.canvasElement) {
            console.warn("⚠️ Canvas要素未定義のため監視をスキップ");
            return;
        }

        const canvas = this.editor.config.canvasElement;
        const monitor = this;
        
        this.mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === "attributes" && mutation.attributeName === "style") {
                    const stack = (new Error()).stack.split("n")[2] || "Unknown";
                    monitor.logCoordinateWrite("canvas.style", canvas.style.cssText, stack);
                }
            });
        });

        this.mutationObserver.observe(canvas, {
            attributes: true,
            attributeFilter: ["style"]
        });

        console.log("🎨 Canvas Style監視設定完了");
    }

    logCoordinateWrite(property, value, stack) {
        const timestamp = Date.now();
        const logEntry = {
            timestamp,
            property,
            value,
            stack: stack.trim(),
            deltaTime: this.logs.length > 0 ? timestamp - this.logs[this.logs.length - 1].timestamp : 0
        };

        this.logs.push(logEntry);
        
        const color = this.getLogColor(property);
        console.debug(
            `%c[COORDINATE WRITE] ${property} = ${value}`,
            `color: ${color}; font-weight: bold`,
            `📍 Stack: ${stack}`
        );

        if (this.editor?.state?.editor?.boundingBox?.visible) {
            console.warn(
                `🚨 バウンディングボックス表示中の座標書き込み競合検出: ${property}`,
                { value, stack }
            );
        }
    }

    getLogColor(property) {
        const colors = {
            "skeleton.x": "#ff4444",
            "skeleton.y": "#ff6600", 
            "canvas.style": "#44ff44"
        };
        return colors[property] || "#333333";
    }

    stopMonitoring() {
        this.isMonitoring = false;
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
        console.log("🛑 座標書き込み監視停止");
    }

    generateReport() {
        if (this.logs.length === 0) {
            console.log("📊 分析対象のログが見つかりません");
            return null;
        }

        console.log("📊 座標書き込み分析レポート");
        console.log("==================================================");
        
        const writeFrequency = {};
        this.logs.forEach(log => {
            writeFrequency[log.property] = (writeFrequency[log.property] || 0) + 1;
        });

        console.log("📈 書き込み頻度:");
        Object.entries(writeFrequency).forEach(([prop, count]) => {
            console.log(`  ${prop}: ${count}回`);
        });

        const boundingBoxConflicts = this.logs.filter(log => 
            this.editor?.state?.editor?.boundingBox?.visible && 
            (log.property.includes("skeleton") || log.property.includes("canvas"))
        );

        if (boundingBoxConflicts.length > 0) {
            console.log("🚨 バウンディングボックス表示中の競合:");
            boundingBoxConflicts.forEach(log => {
                console.log(`  ${log.property} = ${log.value}`);
                console.log(`    📍 ${log.stack}`);
            });
        }

        console.log("⏱️ 最新10件の書き込み履歴:");
        this.logs.slice(-10).forEach(log => {
            console.log(`  ${new Date(log.timestamp).toLocaleTimeString()} - ${log.property} = ${log.value}`);
        });

        return {
            totalWrites: this.logs.length,
            frequency: writeFrequency,
            conflicts: boundingBoxConflicts.length,
            logs: this.logs
        };
    }
}

let globalCoordinateMonitor = null;

if (typeof window !== "undefined") {
    window.startCoordinateMonitoring = function(editor) {
        if (!editor) {
            console.error("❌ PureSpineEditorインスタンスが必要です");
            return false;
        }
        
        if (!globalCoordinateMonitor) {
            globalCoordinateMonitor = new PureSpineCoordinateMonitor();
        }
        
        globalCoordinateMonitor.startMonitoring(editor);
        return true;
    };
    
    window.stopCoordinateMonitoring = function() {
        if (globalCoordinateMonitor) {
            globalCoordinateMonitor.stopMonitoring();
            return true;
        }
        return false;
    };
    
    window.getCoordinateReport = function() {
        if (globalCoordinateMonitor) {
            return globalCoordinateMonitor.generateReport();
        }
        return null;
    };

    window.diagnoseCoordinateConflict = function(editor) {
        if (!editor) {
            console.error("❌ PureSpineEditorインスタンスが必要です");
            console.log("💡 使用方法: diagnoseCoordinateConflict(yourEditorInstance)");
            return;
        }

        console.log("🔍 瞬間移動問題診断開始");
        
        window.startCoordinateMonitoring(editor);
        
        console.log("📦 バウンディングボックス表示中... 瞬間移動を監視");
        editor.showBoundingBox();
        
        setTimeout(() => {
            console.log("📊 診断結果:");
            const report = window.getCoordinateReport();
            
            if (report && report.conflicts > 0) {
                console.warn(`🚨 ${report.conflicts}件の座標競合を検出しました`);
                console.log("🔧 競合解決のため、該当コードの修正が必要です");
            } else {
                console.log("✅ 座標競合は検出されませんでした");
            }
            
            window.stopCoordinateMonitoring();
        }, 3000);
    };

    console.log("🔍 座標書き込み監視システム読み込み完了");
    console.log("📖 使用方法:");
    console.log("  - startCoordinateMonitoring(editor) - 監視開始");
    console.log("  - stopCoordinateMonitoring() - 監視停止"); 
    console.log("  - getCoordinateReport() - レポート生成");
    console.log("  - diagnoseCoordinateConflict(editor) - 瞬間移動問題診断");
}
