// 📁 Spine Editor Desktop v3.0 - Project Manager
// プロジェクト管理・ファイル操作・エクスポート機能

console.log('📁 Project Manager 初期化開始');

// ========== プロジェクト管理クラス ========== //

class SpineProjectManager {
    constructor() {
        this.currentProject = null;
        this.projectHistory = [];
        this.maxHistorySize = 10;
        
        console.log('📁 SpineProjectManager 初期化完了');
    }

    // ========== プロジェクト操作 ========== //

    // プロジェクトデータ検証
    validateProjectData(projectData) {
        if (!projectData) {
            throw new Error('プロジェクトデータが無効です');
        }

        if (!projectData.characters || !Array.isArray(projectData.characters)) {
            throw new Error('キャラクターデータが見つかりません');
        }

        if (projectData.characters.length === 0) {
            throw new Error('キャラクターが含まれていません');
        }

        // 各キャラクターのファイル存在確認
        for (const character of projectData.characters) {
            if (!character.files || !character.files.json || !character.files.atlas || !character.files.png) {
                throw new Error(`キャラクター "${character.name}" の必要ファイルが不足しています`);
            }
        }

        return true;
    }

    // プロジェクト履歴管理
    addToHistory(action, data) {
        const historyEntry = {
            timestamp: Date.now(),
            action,
            data: JSON.parse(JSON.stringify(data)) // ディープコピー
        };

        this.projectHistory.unshift(historyEntry);

        // 履歴サイズ制限
        if (this.projectHistory.length > this.maxHistorySize) {
            this.projectHistory = this.projectHistory.slice(0, this.maxHistorySize);
        }

        console.log('📝 プロジェクト履歴追加:', action);
    }

    // プロジェクト設定更新
    updateProjectSettings(settings) {
        if (!this.currentProject) {
            throw new Error('開いているプロジェクトがありません');
        }

        this.currentProject.settings = {
            ...this.currentProject.settings,
            ...settings,
            lastModified: new Date().toISOString()
        };

        this.addToHistory('settings-update', settings);
        console.log('⚙️ プロジェクト設定更新:', settings);
    }

    // キャラクターデータ更新
    updateCharacterData(characterIndex, newData) {
        if (!this.currentProject) {
            throw new Error('開いているプロジェクトがありません');
        }

        if (characterIndex < 0 || characterIndex >= this.currentProject.characters.length) {
            throw new Error('無効なキャラクターインデックス');
        }

        const character = this.currentProject.characters[characterIndex];
        const oldData = JSON.parse(JSON.stringify(character));

        // データ更新
        Object.assign(character, newData);

        this.addToHistory('character-update', {
            index: characterIndex,
            oldData,
            newData
        });

        console.log(`🎭 キャラクターデータ更新: ${character.name}`);
        return character;
    }
}

// ========== エクスポート機能 ========== //

class SpineProjectExporter {
    constructor() {
        this.exportTemplates = {
            html: this.generateHTMLTemplate.bind(this),
            json: this.generateJSONExport.bind(this),
            css: this.generateCSSExport.bind(this)
        };
    }

    // HTMLテンプレート生成
    generateHTMLTemplate(projectData) {
        const charactersHTML = projectData.characters.map(character => {
            return `
    <!-- ${character.name} -->
    <canvas id="${character.name}-canvas" 
            width="300" height="200" 
            data-character-name="${character.name}"
            data-spine-character="true"
            style="
                position: absolute;
                left: ${character.position.x}%;
                top: ${character.position.y}%;
                transform: translate(-50%, -50%);
                width: ${(character.scale || 1) * 30}%;
                aspect-ratio: 3/2;
                z-index: 10;
                cursor: pointer;
            "></canvas>
    
    <img src="assets/images/${character.name}.png" 
         alt="${character.name}" 
         id="${character.name}-fallback"
         data-character-name="${character.name}"
         data-spine-character="true"
         style="
             position: absolute;
             left: ${character.position.x}%;
             top: ${character.position.y}%;
             transform: translate(-50%, -50%);
             width: ${(character.scale || 1) * 10}%;
             aspect-ratio: 1/1;
             object-fit: contain;
             z-index: 10;
             opacity: 0;
         ">
            `.trim();
        }).join('\n\n');

        const configHTML = projectData.characters.map(character => {
            return `
    <div id="${character.name}-config" style="display: none;"
         data-x="${character.position.x}"
         data-y="${character.position.y}"
         data-scale="${character.scale || 1}"
         data-fade-delay="1500"
         data-fade-duration="2000">
    </div>`;
        }).join('\n');

        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectData.projectName || 'Spine Project'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: #f0f0f0;
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .scene-container {
            position: relative;
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .background-image {
            width: 100%;
            height: auto;
            display: block;
        }

        /* レスポンシブ対応 */
        @media (max-width: 768px) {
            body { padding: 10px; }
            .scene-container { border-radius: 5px; }
        }
    </style>
</head>
<body>
    <div class="scene-container">
        <!-- 背景画像 -->
        <img src="assets/images/background.png" 
             alt="背景" 
             class="background-image">

        <!-- Spineキャラクター -->
${charactersHTML}

        <!-- キャラクター設定 -->
${configHTML}
    </div>

    <!-- Spine WebGL Runtime -->
    <script src="assets/spine/spine-webgl.js"></script>
    
    <!-- Spine統合システム -->
    <script src="assets/spine/spine-integration.js"></script>
    
    <script>
        // プロジェクト初期化
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 ${projectData.projectName} 初期化開始');
            
            // Spine WebGL待機
            if (typeof spine !== 'undefined') {
                initializeSpineCharacters();
            } else {
                console.warn('⚠️ Spine WebGL未読み込み - フォールバック表示');
            }
        });

        async function initializeSpineCharacters() {
            const characters = ${JSON.stringify(projectData.characters, null, 12)};
            
            for (const character of characters) {
                try {
                    await loadSpineCharacter(character);
                } catch (error) {
                    console.error(\`❌ \${character.name} 読み込みエラー:\`, error);
                }
            }
        }

        async function loadSpineCharacter(characterData) {
            const canvas = document.getElementById(\`\${characterData.name}-canvas\`);
            const fallback = document.getElementById(\`\${characterData.name}-fallback\`);
            
            if (!canvas || !fallback) return;
            
            try {
                // Spine WebGL初期化
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (!gl) throw new Error('WebGL not supported');
                
                // アセット読み込み
                const assetManager = new spine.AssetManager(gl);
                assetManager.loadTextureAtlas(\`assets/spine/\${characterData.name}.atlas\`);
                assetManager.loadJson(\`assets/spine/\${characterData.name}.json\`);
                
                await new Promise((resolve) => {
                    const checkAssets = () => {
                        if (assetManager.isLoadingComplete()) {
                            resolve();
                        } else {
                            setTimeout(checkAssets, 100);
                        }
                    };
                    checkAssets();
                });
                
                // アセット取得（Spine 4.1+ require方式）
                const atlas = assetManager.require(\`assets/spine/\${characterData.name}.atlas\`);
                const skeletonJsonData = assetManager.require(\`assets/spine/\${characterData.name}.json\`);
                
                // Skeleton作成
                const atlasAttachmentLoader = new spine.AtlasAttachmentLoader(atlas);
                const skeletonJson = new spine.SkeletonJson(atlasAttachmentLoader);
                const skeletonData = skeletonJson.readSkeletonData(skeletonJsonData);
                const skeleton = new spine.Skeleton(skeletonData);
                
                // アニメーション設定
                const animationStateData = new spine.AnimationStateData(skeleton.data);
                const animationState = new spine.AnimationState(animationStateData);
                
                // デフォルトアニメーション設定
                if (skeleton.data.findAnimation('taiki')) {
                    animationState.setAnimation(0, 'taiki', true);
                } else if (skeleton.data.animations.length > 0) {
                    animationState.setAnimation(0, skeleton.data.animations[0].name, true);
                }
                
                // レンダラー
                const renderer = new spine.SceneRenderer(canvas, gl);
                
                // 描画ループ
                let lastTime = Date.now() / 1000;
                function render() {
                    const now = Date.now() / 1000;
                    const delta = now - lastTime;
                    lastTime = now;

                    animationState.update(delta);
                    animationState.apply(skeleton);
                    skeleton.updateWorldTransform();

                    gl.clearColor(0, 0, 0, 0);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    gl.viewport(0, 0, canvas.width, canvas.height);

                    renderer.begin();
                    renderer.drawSkeleton(skeleton, true);
                    renderer.end();

                    requestAnimationFrame(render);
                }
                render();
                
                // 成功時の表示切り替え
                canvas.style.opacity = '1';
                fallback.style.opacity = '0';
                
                console.log(\`✅ \${characterData.name} 初期化完了\`);
                
            } catch (error) {
                console.error(\`❌ \${characterData.name} 初期化失敗:\`, error);
                // エラー時はフォールバック表示
                canvas.style.opacity = '0';
                fallback.style.opacity = '1';
            }
        }
    </script>
</body>
</html>`;
    }

    // JSON設定エクスポート
    generateJSONExport(projectData) {
        return JSON.stringify({
            projectName: projectData.projectName,
            version: '3.0.0',
            exportDate: new Date().toISOString(),
            characters: projectData.characters.map(character => ({
                name: character.name,
                position: character.position,
                scale: character.scale || 1,
                animations: character.animations || []
            })),
            settings: projectData.settings || {}
        }, null, 2);
    }

    // CSS設定エクスポート
    generateCSSExport(projectData) {
        const cssRules = projectData.characters.map(character => {
            return `
/* ${character.name} */
#${character.name}-canvas,
#${character.name}-fallback {
    position: absolute;
    left: ${character.position.x}%;
    top: ${character.position.y}%;
    transform: translate(-50%, -50%);
    z-index: 10;
}

#${character.name}-canvas {
    width: ${(character.scale || 1) * 30}%;
    aspect-ratio: 3/2;
    cursor: pointer;
}

#${character.name}-fallback {
    width: ${(character.scale || 1) * 10}%;
    aspect-ratio: 1/1;
    object-fit: contain;
    opacity: 0;
}`;
        }).join('\n');

        return `/* Spine Project CSS Export */
/* Generated by Spine Editor Desktop v3.0 */
/* Project: ${projectData.projectName} */
/* Export Date: ${new Date().toISOString()} */

/* Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

.scene-container {
    position: relative;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    border-radius: 10px;
    overflow: hidden;
}

.background-image {
    width: 100%;
    height: auto;
    display: block;
}

/* Character Positions */
${cssRules}

/* Responsive Design */
@media (max-width: 768px) {
    .scene-container {
        border-radius: 5px;
        margin: 10px;
    }
}`;
    }

    // プロジェクトエクスポート実行
    async exportProject(projectData, format = 'html') {
        try {
            console.log('📦 プロジェクトエクスポート開始:', format);
            
            if (!this.exportTemplates[format]) {
                throw new Error(`未対応のエクスポート形式: ${format}`);
            }
            
            const content = this.exportTemplates[format](projectData);
            
            // ファイル拡張子決定
            const extensions = {
                html: 'html',
                json: 'json',
                css: 'css'
            };
            
            const defaultPath = `${projectData.projectName || 'spine-project'}.${extensions[format]}`;
            
            // ファイル保存
            const savedPath = await window.electronAPI.saveFile({
                content,
                defaultPath,
                filters: [
                    { name: `${format.toUpperCase()}ファイル`, extensions: [extensions[format]] },
                    { name: 'すべてのファイル', extensions: ['*'] }
                ]
            });
            
            if (savedPath) {
                console.log(`✅ エクスポート完了: ${savedPath}`);
                return savedPath;
            }
            
        } catch (error) {
            console.error('❌ エクスポートエラー:', error);
            throw error;
        }
    }
}

// ========== グローバル初期化 ========== //

// インスタンス作成
const projectManager = new SpineProjectManager();
const projectExporter = new SpineProjectExporter();

// グローバル関数公開
window.projectManager = projectManager;
window.projectExporter = projectExporter;

// エクスポート関数
window.exportProject = async (projectData, format = 'html') => {
    return await projectExporter.exportProject(projectData, format);
};

// プロジェクト操作関数
window.updateCharacterData = (index, data) => {
    return projectManager.updateCharacterData(index, data);
};

window.updateProjectSettings = (settings) => {
    return projectManager.updateProjectSettings(settings);
};

console.log('✅ Project Manager 初期化完了');