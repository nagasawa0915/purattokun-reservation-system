/**
 * Spine WebGL座標系診断ツール
 * 
 * 目的: ドロップ位置とキャラクター表示位置のズレの根本原因解明
 */

export class SpineCoordinateDiagnostic {
    constructor() {
        this.diagnosticResults = {};
        this.testCanvas = null;
        this.testRenderer = null;
        this.testContext = null;
    }

    /**
     * 診断を開始
     */
    async startDiagnosis(container = document.body) {
        console.log('🔍 Spine WebGL座標系診断開始...');
        
        try {
            await this.setupTestEnvironment(container);
            await this.diagnoseCoordinateSystem();
            await this.diagnoseCanvasRelationship();
            await this.diagnoseViewportEffect();
            this.generateReport();
            
            return this.diagnosticResults;
            
        } catch (error) {
            console.error('❌ 座標系診断エラー:', error);
            throw error;
        }
    }

    /**
     * テスト環境準備
     */
    async setupTestEnvironment(container) {
        console.log('🔧 テスト環境準備中...');
        
        this.testCanvas = document.createElement('canvas');
        this.testCanvas.id = 'spine-coordinate-test';
        this.testCanvas.width = 400;
        this.testCanvas.height = 300;
        this.testCanvas.style.cssText = `
            position: absolute;
            border: 2px solid red;
            background: rgba(255,255,255,0.1);
            z-index: 9999;
            top: 50px;
            left: 50px;
        `;
        container.appendChild(this.testCanvas);

        this.testContext = this.testCanvas.getContext('webgl', {
            alpha: true,
            premultipliedAlpha: false
        });

        if (!this.testContext) {
            throw new Error('WebGLコンテキスト作成失敗');
        }

        // Spine WebGL確認
        if (typeof spine === 'undefined') {
            console.log('⏳ Spine WebGL読み込み待機中...');
            await this.waitForSpineWebGL();
        }

        this.testRenderer = new spine.SceneRenderer(this.testCanvas, this.testContext);
        console.log('✅ テスト環境準備完了');
    }

    /**
     * Spine WebGL読み込み待機
     */
    async waitForSpineWebGL() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100;
            
            const check = () => {
                if (typeof spine !== 'undefined' && spine.SceneRenderer) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Spine WebGL読み込みタイムアウト'));
                } else {
                    attempts++;
                    setTimeout(check, 100);
                }
            };
            
            check();
        });
    }

    /**
     * 座標系仕様診断
     */
    async diagnoseCoordinateSystem() {
        console.log('🔍 座標系仕様診断中...');
        
        const results = {
            canvasDimensions: {
                width: this.testCanvas.width,
                height: this.testCanvas.height,
                displayWidth: this.testCanvas.clientWidth,
                displayHeight: this.testCanvas.clientHeight
            },
            webglViewport: null,
            sceneRendererInfo: {}
        };

        this.testContext.viewport(0, 0, this.testCanvas.width, this.testCanvas.height);
        const viewport = this.testContext.getParameter(this.testContext.VIEWPORT);
        results.webglViewport = Array.from(viewport);

        if (this.testRenderer.camera) {
            results.sceneRendererInfo.camera = {
                viewportWidth: this.testRenderer.camera.viewportWidth,
                viewportHeight: this.testRenderer.camera.viewportHeight
            };
        }

        this.diagnosticResults.coordinateSystem = results;
        console.log('📊 座標系仕様:', results);
    }

    /**
     * Canvas座標系との関係診断
     */
    async diagnoseCanvasRelationship() {
        console.log('🔍 Canvas座標系関係診断中...');
        
        const results = {
            coordinateTests: []
        };

        const testPoints = [
            { name: '左上', canvas: {x: 0, y: 0} },
            { name: '中央', canvas: {x: this.testCanvas.width/2, y: this.testCanvas.height/2} },
            { name: '右下', canvas: {x: this.testCanvas.width, y: this.testCanvas.height} }
        ];

        for (const point of testPoints) {
            const test = {
                name: point.name,
                canvasCoords: point.canvas,
                webglCoords: this.canvasToWebGLCoords(point.canvas.x, point.canvas.y),
                spineCoords: this.canvasToSpineCoords(point.canvas.x, point.canvas.y)
            };
            
            results.coordinateTests.push(test);
        }

        this.diagnosticResults.canvasRelationship = results;
        console.log('📊 Canvas関係:', results);
    }

    canvasToWebGLCoords(canvasX, canvasY) {
        return {
            x: canvasX,
            y: this.testCanvas.height - canvasY
        };
    }

    canvasToSpineCoords(canvasX, canvasY) {
        return {
            x: canvasX - this.testCanvas.width / 2,
            y: this.testCanvas.height / 2 - canvasY
        };
    }

    /**
     * Viewport効果診断
     */
    async diagnoseViewportEffect() {
        console.log('🔍 Viewport効果診断中...');
        
        const results = {
            defaultViewport: Array.from(
                this.testContext.getParameter(this.testContext.VIEWPORT)
            )
        };

        this.diagnosticResults.viewportEffect = results;
        console.log('📊 Viewport効果:', results);
    }

    /**
     * 診断レポート生成
     */
    generateReport() {
        console.log('\n🔍 === Spine WebGL座標系診断レポート ===');
        
        const coordSys = this.diagnosticResults.coordinateSystem;
        console.log('📐 座標系仕様:');
        console.log(`  Canvas実サイズ: ${coordSys.canvasDimensions.width}x${coordSys.canvasDimensions.height}`);
        console.log(`  Canvas表示サイズ: ${coordSys.canvasDimensions.displayWidth}x${coordSys.canvasDimensions.displayHeight}`);
        console.log('  WebGL Viewport:', coordSys.webglViewport);

        const canvasRel = this.diagnosticResults.canvasRelationship;
        console.log('\n🎯 座標系変換テスト:');
        canvasRel.coordinateTests.forEach(test => {
            console.log(`  ${test.name}:`);
            console.log(`    Canvas: (${test.canvasCoords.x}, ${test.canvasCoords.y})`);
            console.log(`    WebGL推測: (${test.webglCoords.x}, ${test.webglCoords.y})`);
            console.log(`    Spine推測: (${test.spineCoords.x}, ${test.spineCoords.y})`);
        });

        this.analyzeFindings();
        console.log('\n🔚 === 診断完了 ===');
    }

    analyzeFindings() {
        console.log('\n🔍 重要な発見:');
        
        const coordSys = this.diagnosticResults.coordinateSystem;
        
        if (coordSys.canvasDimensions.width !== coordSys.canvasDimensions.displayWidth ||
            coordSys.canvasDimensions.height !== coordSys.canvasDimensions.displayHeight) {
            console.log('⚠️  Canvas実サイズと表示サイズが不一致 - 座標ズレの原因可能性');
        }

        console.log('📝 Y軸方向の推測:');
        console.log('   - Canvas: Y軸下向き（DOM標準）');
        console.log('   - WebGL: Y軸上向き（OpenGL標準）');
        console.log('   - Spine: 実装依存（調査が必要）');

        console.log('\n✅ 推奨座標変換式:');
        console.log('   マウス→Canvas: clientX - rect.left, clientY - rect.top');
        console.log('   Canvas→WebGL: x, canvas.height - y');
        console.log('   Canvas→Spine: 要実験（実際のSkeleton配置で検証必要）');
    }

    cleanup() {
        if (this.testCanvas && this.testCanvas.parentNode) {
            this.testCanvas.parentNode.removeChild(this.testCanvas);
        }
        this.testCanvas = null;
        this.testRenderer = null;
        this.testContext = null;
    }
}

// グローバル関数として公開
window.startSpineCoordinateDiagnosis = async function(container) {
    const diagnostic = new SpineCoordinateDiagnostic();
    
    try {
        const results = await diagnostic.startDiagnosis(container);
        window.spineCoordinateDiagnosticResults = results;
        return results;
    } catch (error) {
        console.error('❌ 座標系診断失敗:', error);
        throw error;
    }
};

console.log('🔧 Spine座標系診断ツール読み込み完了');
console.log('使用方法: await startSpineCoordinateDiagnosis()');
