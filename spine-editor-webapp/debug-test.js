// FileToHttpBridge統合テストデバッグスクリプト
// ブラウザのF12コンソールで実行

async function runDebugTest() {
    console.log("🚀 FileToHttpBridge統合デバッグテスト開始");
    
    try {
        // Spineリソースファイル読み込み（デフォルト）
        const basePath = '../assets/spine/characters/nezumi/';
        const fileNames = {
            atlas: 'nezumi.atlas',
            json: 'nezumi.json', 
            texture: 'nezumi.png'
        };
        
        console.log("📂 リソースファイル読み込み中...");
        const fileHandles = {};
        
        for (const [type, fileName] of Object.entries(fileNames)) {
            try {
                const response = await fetch(basePath + fileName);
                if (!response.ok) {
                    throw new Error(`${fileName}: ${response.status} ${response.statusText}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                const blob = new Blob([arrayBuffer]);
                
                fileHandles[type] = {
                    name: fileName,
                    getFile: async () => new File([blob], fileName, { 
                        type: type === 'texture' ? 'image/png' : 'text/plain' 
                    })
                };
                console.log(`✅ ${fileName}読み込み成功`);
            } catch (error) {
                console.error(`❌ ${fileName}読み込み失敗: ${error.message}`);
                return;
            }
        }
        
        // FileToHttpBridge変換
        console.log("🔄 FileToHttpBridge変換開始...");
        if (!window.bridge) {
            window.bridge = new FileToHttpBridge({
                debug: true,
                tempBasePath: '/temp/spine/',
                logCallback: (message) => console.log(`[Bridge] ${message}`)
            });
        }
        
        const conversionResult = await bridge.convertCharacterFiles('nezumi', fileHandles);
        console.log("✅ 変換完了:", conversionResult);
        
        // StableSpineRenderer統合テスト
        console.log("🎮 StableSpineRenderer統合テスト開始...");
        const spineConfig = {
            canvas: '#spine-canvas',
            character: 'nezumi',
            basePath: conversionResult.basePath,
            blobUrls: conversionResult.blobUrls,
            debug: true,
            logCallback: (message) => console.log(`[Spine] ${message}`)
        };
        
        if (window.spineRenderer) {
            console.log("⚠️ 既存のrenderer停止");
            window.spineRenderer = null;
        }
        
        window.spineRenderer = new StableSpineRenderer(spineConfig);
        await window.spineRenderer.initialize();
        
        console.log("🎉 統合テスト完了！");
        
    } catch (error) {
        console.error("❌ デバッグテスト失敗:", error);
        console.error("スタックトレース:", error.stack);
    }
}

// テスト実行
runDebugTest();
