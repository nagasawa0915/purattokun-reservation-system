/**
 * Simple Spine Manager v2.0
 * v3のシンプル設計を踏襲したSpineキャラクター管理システム
 * iframe通信を使わずダイレクト統合
 */

export class SimpleSpineManager {
    constructor() {
        this.characters = [];
        this.isInitialized = false;
        
        console.log('🎭 SimpleSpineManager initialized');
    }

    /**
     * Spineフォルダを選択してキャラクターを読み込み
     */
    async loadSpineFolder() {
        try {
            console.log('🎭 Spineフォルダ選択開始');
            
            // Electronダイアログでフォルダ選択
            const result = await window.electronAPI.fs.selectFolder({
                title: 'Spineキャラクターフォルダを選択',
                properties: ['openDirectory'],
                buttonLabel: 'Spineフォルダを選択'
            });
            
            if (result.canceled || !result.filePaths?.length) {
                return { 
                    success: false, 
                    canceled: true, 
                    message: 'フォルダ選択がキャンセルされました' 
                };
            }
            
            const folderPath = result.filePaths[0];
            console.log('📁 選択されたSpineフォルダ:', folderPath);
            
            // フォルダ内のSpineキャラクターをスキャン
            const characters = await this.scanSpineCharacters(folderPath);
            
            this.characters = characters;
            
            return {
                success: true,
                characters: characters,
                message: `${characters.length}個のSpineキャラクターを検出しました`
            };
            
        } catch (error) {
            console.error('❌ Spineフォルダ選択エラー:', error);
            return {
                success: false,
                error: error.message,
                message: 'Spineフォルダの選択に失敗しました'
            };
        }
    }

    /**
     * Spineキャラクターをスキャン
     */
    async scanSpineCharacters(folderPath) {
        try {
            // ディレクトリ内のファイルを再帰的にスキャン
            const scanResult = await window.electronAPI.fs.scanDirectory(
                folderPath, 
                ['.json', '.atlas', '.png']
            );
            
            if (!scanResult.success) {
                throw new Error(scanResult.error);
            }
            
            const files = scanResult.files || { json: [], atlas: [], png: [] };
            
            // Spineキャラクターをグループ化
            const characters = this.groupSpineFiles(files);
            
            console.log(`✅ ${characters.length}個のSpineキャラクターを検出:`, characters.map(c => c.name));
            
            return characters;
            
        } catch (error) {
            console.error('❌ Spineキャラクタースキャンエラー:', error);
            throw error;
        }
    }

    /**
     * Spineファイルをキャラクター単位でグループ化
     */
    groupSpineFiles(files) {
        const characters = [];
        const jsonFiles = files.json || [];
        
        for (const jsonFile of jsonFiles) {
            const baseName = this.getBaseName(jsonFile);
            const baseDir = this.getDirectoryPath(jsonFile);
            
            // 対応する.atlas/.pngファイルを探す
            const atlasFile = this.findMatchingFile(files.atlas || [], baseName, baseDir);
            const pngFile = this.findMatchingFile(files.png || [], baseName, baseDir);
            
            if (atlasFile && pngFile) {
                characters.push({
                    id: baseName,
                    name: baseName,
                    jsonPath: jsonFile,
                    atlasPath: atlasFile,
                    texturePath: pngFile,
                    folderPath: baseDir,
                    type: 'spine-character'
                });
            }
        }
        
        return characters;
    }

    /**
     * ファイル名からベース名を取得
     */
    getBaseName(filePath) {
        const fileName = filePath.split(/[/\\]/).pop() || filePath;
        return fileName.replace(/\.[^.]+$/, '');
    }

    /**
     * ファイルパスからディレクトリパスを取得
     */
    getDirectoryPath(filePath) {
        const parts = filePath.split(/[/\\]/);
        parts.pop();
        return parts.join('/');
    }

    /**
     * マッチングファイルを検索
     */
    findMatchingFile(fileList, baseName, baseDir) {
        return fileList.find(file => {
            const fileBaseName = this.getBaseName(file);
            const fileDir = this.getDirectoryPath(file);
            return fileBaseName === baseName && fileDir === baseDir;
        });
    }

    /**
     * キャラクター一覧を取得
     */
    getCharacters() {
        return this.characters;
    }

    /**
     * 特定キャラクターを取得
     */
    getCharacter(name) {
        return this.characters.find(c => c.name === name);
    }

    /**
     * キャラクター一覧をUIに表示
     */
    displayCharacters(containerElement) {
        if (!containerElement) {
            console.warn('⚠️ Character container element not found');
            return;
        }

        containerElement.innerHTML = '';
        
        this.characters.forEach(character => {
            const characterElement = this.createCharacterElement(character);
            containerElement.appendChild(characterElement);
        });
        
        console.log(`✅ ${this.characters.length}個のキャラクターをUIに表示`);
    }

    /**
     * キャラクター要素を作成
     */
    createCharacterElement(character) {
        const element = document.createElement('div');
        element.className = 'spine-character-item';
        element.draggable = true;
        element.dataset.characterId = character.id;
        
        element.innerHTML = `
            <div class="character-icon">🎭</div>
            <div class="character-info">
                <div class="character-name">${character.name}</div>
                <div class="character-path">${this.truncatePath(character.folderPath)}</div>
            </div>
        `;
        
        // ドラッグイベント設定
        element.addEventListener('dragstart', (e) => {
            const dragData = {
                type: 'spine-character',
                character: character
            };
            
            e.dataTransfer.setData('application/json', JSON.stringify(dragData));
            e.dataTransfer.effectAllowed = 'copy';
            
            element.style.opacity = '0.7';
            console.log('🎮 ドラッグ開始:', character.name, 'データ:', dragData);
        });
        
        element.addEventListener('dragend', () => {
            element.style.opacity = '1';
        });
        
        return element;
    }

    /**
     * パス文字列を省略表示
     */
    truncatePath(path) {
        if (!path || path.length <= 30) return path;
        
        const parts = path.split(/[/\\]/);
        if (parts.length <= 2) return path;
        
        return `.../${parts.slice(-2).join('/')}`;
    }
}

// デフォルトエクスポート
export default SimpleSpineManager;