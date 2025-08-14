/**
 * Spineキャラクター管理モジュール
 * Spineファイル検出、表示、ドラッグ&ドロップ、キャラクター配置を担当
 */

import { Utils } from './utils.js';
import { IframeSpineBridge } from './js/iframe-spine-bridge.js';

export class SpineCharacterManager {
    constructor() {
        this.spineCharacters = [];
        this.savedSpinePath = localStorage.getItem('spine-editor-spine-path');
        this.iframeSpineBridge = new IframeSpineBridge();
        this.setupBridgeEventHandlers();
    }

    /**
     * iframe通信ブリッジのイベントハンドラをセットアップ
     * @private
     */
    setupBridgeEventHandlers() {
        // Spine環境準備完了
        this.iframeSpineBridge.on('spineReady', (data) => {
            console.log('🎭 Spine environment ready for character operations');
        });

        // キャラクター追加成功
        this.iframeSpineBridge.on('characterAdded', (data) => {
            console.log(`✅ Character added to iframe: ${data.characterId}`);
            
            // ダミー要素を実際のSpine表示に置き換える処理をここに追加可能
            this.updateDummyToSpineDisplay(data.characterId);
        });

        // エラーハンドリング
        this.iframeSpineBridge.on('spineError', (data) => {
            console.error('❌ Spine error:', data);
            Utils.showToastNotification(`Spineエラー: ${data.error}`, 'error');
        });

        this.iframeSpineBridge.on('characterError', (data) => {
            console.error('❌ Character operation error:', data);
            Utils.showToastNotification(`キャラクター操作エラー: ${data.error}`, 'error');
        });
    }

    /**
     * プレビューiframeを設定
     * @param {HTMLIFrameElement} iframe - プレビューiframe要素
     */
    setPreviewIframe(iframe) {
        this.iframeSpineBridge.setIframe(iframe);
        console.log('🖼️ Preview iframe set for Spine integration');
    }

    /**
     * ダミー要素を実際のSpine表示に更新
     * @private
     * @param {string} characterId - キャラクターID
     */
    updateDummyToSpineDisplay(characterId) {
        // 必要に応じて、ダミー要素を非表示にするなどの処理
        const character = this.spineCharacters.find(c => c.id === characterId);
        if (character && character.element) {
            // ダミー要素に「実際のSpine表示中」の表示を追加
            const statusDiv = character.element.querySelector('.spine-status') || document.createElement('div');
            statusDiv.className = 'spine-status';
            statusDiv.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                background: #28a745;
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: bold;
            `;
            statusDiv.textContent = 'LIVE';
            
            if (!character.element.contains(statusDiv)) {
                character.element.appendChild(statusDiv);
            }
        }
    }

    /**
     * Spineフォルダを選択・読み込み
     * @returns {object} 結果オブジェクト {success, spineFiles, message}
     */
    async loadSpineFolder() {
        console.log('🎭 loadSpineFolder() method called!');
        
        // デバッグ: 関数存在確認
        console.log('🔧 window.projectLoader:', window.projectLoader);
        console.log('🔧 selectSpineFolder exists:', typeof window.projectLoader?.selectSpineFolder);
        
        try {
            // 関数存在チェック
            if (!window.projectLoader || typeof window.projectLoader.selectSpineFolder !== 'function') {
                console.error('❌ selectSpineFolder function not found, falling back to selectFolder');
                // フォールバック: 元の関数を使用
                const initialSpinePath = this.savedSpinePath || null;
                console.log('🔧 Spine initial path (fallback):', initialSpinePath);
                const result = await window.projectLoader.selectFolder(initialSpinePath);
                
                if (result.success && result.path) {
                    return await this.procesSpineFolder(result.path);
                } else if (result.canceled) {
                    return {
                        success: false,
                        canceled: true,
                        message: 'Spineフォルダ選択がキャンセルされました'
                    };
                } else {
                    return {
                        success: false,
                        message: 'Spineフォルダ選択に失敗しました'
                    };
                }
            }
            
            // 詳細デバッグ: localStorage直接確認
            const directSpine = localStorage.getItem('spine-editor-spine-path');
            console.log('🔧 localStorage直接確認 spine:', directSpine);
            console.log('🔧 this.savedSpinePath:', this.savedSpinePath);
            console.log('🔧 値が同じか:', directSpine === this.savedSpinePath);
            
            // Spine専用フォルダ選択関数を使用・保存されたSpineパスを初期フォルダとして使用（有効な場合のみ）
            const initialSpinePath = this.savedSpinePath || null;
            console.log('🔧 Spine initial path:', initialSpinePath);
            console.log('🔧 initialSpinePathタイプ:', typeof initialSpinePath, '長さ:', initialSpinePath?.length);
            const result = await window.projectLoader.selectSpineFolder(initialSpinePath);
            
            if (result.success && result.path) {
                return await this.procesSpineFolder(result.path);
            } else if (result.canceled) {
                return {
                    success: false,
                    canceled: true,
                    message: 'Spineフォルダ選択がキャンセルされました'
                };
            } else {
                return {
                    success: false,
                    message: 'Spineフォルダ選択に失敗しました'
                };
            }
        } catch (error) {
            console.error('🚨 Spineフォルダ選択エラー:', error);
            return {
                success: false,
                message: 'Spineフォルダ選択に失敗しました',
                error: error.message
            };
        }
    }

    /**
     * Spineフォルダを処理
     * @private
     * @param {string} folderPath - Spineフォルダパス
     * @returns {object} 処理結果
     */
    async procesSpineFolder(folderPath) {
        console.log('🎭 Selected Spine folder:', folderPath);
        
        // Spineパスを保存
        localStorage.setItem('spine-editor-spine-path', folderPath);
        console.log('💾 Spine path saved:', folderPath);
        
        // this.savedSpinePathも更新
        this.savedSpinePath = folderPath;
        console.log('🔄 this.savedSpinePath updated:', this.savedSpinePath);
        
        console.log('🔧 Starting Spine file detection...');
        
        // Spineファイル検出処理（例: .json/.atlas/.png）
        const spineFiles = await this.detectSpineFiles(folderPath);
        console.log('🔧 Detection completed. Found files:', spineFiles);
        
        if (spineFiles.length > 0) {
            console.log('🎭 Detected Spine files:', spineFiles);
            return {
                success: true,
                spineFiles,
                message: `Spineファイル検出: ${spineFiles.length}個のキャラクター`
            };
        } else {
            return {
                success: true,
                spineFiles: [],
                message: 'Spineファイルが見つかりませんでした'
            };
        }
    }

    /**
     * Spineファイルを検出
     * @param {string} folderPath - フォルダパス
     * @returns {Array} Spineキャラクターリスト
     */
    async detectSpineFiles(folderPath) {
        try {
            console.log('🔍 Scanning folder:', folderPath);
            
            // ElectronAPIでフォルダ内のファイルをスキャン
            const scanResult = await window.electronAPI.fs.scanDirectory(
                folderPath, 
                ['.json', '.atlas', '.png']
            );
            
            console.log('📋 Scan result:', scanResult);
            
            if (!scanResult.success) {
                console.warn('🚨 Spine folder scan failed:', scanResult.error);
                return [];
            }
            
            // .json/.atlas/.pngのセットを検出
            const jsonFiles = scanResult.files?.json || [];
            const atlasFiles = scanResult.files?.atlas || [];
            const pngFiles = scanResult.files?.png || [];
            
            console.log('📁 Found files:');
            console.log('  JSON files:', jsonFiles);
            console.log('  Atlas files:', atlasFiles);
            console.log('  PNG files:', pngFiles);
            
            const spineCharacters = [];
            
            for (const jsonFile of jsonFiles) {
                // バックアップフォルダを除外
                if (Utils.isBackupPath(jsonFile)) {
                    console.log('🚫 Skipping backup file:', jsonFile);
                    continue;
                }
                
                // Windows/Unixパス両対応でファイル名のみ取得
                const baseName = Utils.getBaseName(jsonFile);
                const atlasFile = atlasFiles.find(f => f.includes(baseName + '.atlas') && !Utils.isBackupPath(f));
                const pngFile = pngFiles.find(f => f.includes(baseName + '.png') && !Utils.isBackupPath(f));
                
                console.log('🔧 Processing:', jsonFile);
                console.log('🔧 Extracted baseName:', baseName);
                
                if (atlasFile && pngFile) {
                    const characterFolder = Utils.getCharacterFolder(jsonFile);
                    spineCharacters.push({
                        name: baseName, // キャラクター名のみ
                        jsonPath: jsonFile,
                        atlasPath: atlasFile,
                        texturePath: pngFile,
                        folderPath: characterFolder // 正しいフォルダパス
                    });
                    console.log('🔧 Created character:', baseName, 'folder:', characterFolder);
                }
            }
            
            return spineCharacters;
        } catch (error) {
            console.error('🚨 Spine detection error:', error);
            return [];
        }
    }

    /**
     * Spineキャラクターリストを表示
     * @param {Array} spineFiles - Spineファイルリスト
     * @param {Element} containerElement - 表示先コンテナ要素
     */
    displaySpineCharacters(spineFiles, containerElement) {
        console.log('🎭 Displaying Spine characters:', spineFiles);
        
        // 別ウィンドウ風のトースト通知を表示
        Utils.showToastNotification(`${spineFiles.length}個のキャラクターが見つかりました`);
        
        // リストをクリア
        containerElement.innerHTML = '';
        
        // 各キャラクターをリストに追加
        spineFiles.forEach((character, index) => {
            console.log('🔧 Creating character item for:', character.name);
            console.log('🔧 Character data:', character);
            
            const item = document.createElement('div');
            item.className = 'spine-character-simple'; // 新しいクラス名
            item.draggable = true; // ドラッグ可能に設定
            item.dataset.characterId = character.name;
            item.dataset.characterPath = character.jsonPath;
            
            // 名前のみをテキストノードとして設定
            item.textContent = character.name;
            console.log('🔧 Set textContent to:', item.textContent);
            
            // マウスオーバーでフルパス表示
            item.title = character.folderPath;
            console.log('🔧 Set title to:', item.title);
            
            // 確実にツールチップを表示するため、追加の属性も設定
            item.setAttribute('data-tooltip', character.folderPath);
            item.setAttribute('aria-label', character.folderPath);
            
            // 既存CSSを無効化して確実にシンプル表示
            item.style.cssText = `
                padding: 10px 15px !important;
                margin: 5px 0 !important;
                background: #f8f9fa !important;
                border: 1px solid #dee2e6 !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                font-size: 14px !important;
                color: #495057 !important;
                display: block !important;
                text-align: left !important;
                transition: all 0.2s ease !important;
                user-select: none !important;
            `;
            
            // ホバー効果とツールチップ確認
            item.addEventListener('mouseenter', (e) => {
                item.style.background = '#e9ecef !important';
                item.style.borderColor = '#007bff !important';
                console.log('🔧 Mouse enter - title:', e.target.title);
                console.log('🔧 Mouse enter - data-tooltip:', e.target.getAttribute('data-tooltip'));
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.background = '#f8f9fa !important';
                item.style.borderColor = '#dee2e6 !important';
            });
            
            // クリックイベント（詳細表示用）
            item.addEventListener('click', () => {
                console.log('🎭 Selected character:', character.name);
                // TODO: キャラクター詳細表示
            });
            
            // ドラッグ開始イベント
            item.addEventListener('dragstart', (e) => {
                console.log('🎭 Drag started:', character.name);
                e.dataTransfer.setData('application/json', JSON.stringify(character));
                e.dataTransfer.effectAllowed = 'copy';
                item.classList.add('dragging');
            });
            
            // ドラッグ終了イベント
            item.addEventListener('dragend', (e) => {
                item.classList.remove('dragging');
            });
            
            containerElement.appendChild(item);
        });
        
        console.log('✅ Spine character list displayed');
    }

    /**
     * プレビューエリアにSpineキャラクターを追加
     * @param {object} characterData - キャラクターデータ
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {Element} containerElement - コンテナ要素
     * @returns {object} 追加結果
     */
    addSpineCharacterToPreview(characterData, x, y, containerElement) {
        try {
            // 一意のIDを生成
            const characterId = Utils.generateId('spine-character');
            
            // Spineキャラクター要素を作成（ダミー表示用）
            const characterElement = document.createElement('div');
            characterElement.id = characterId;
            characterElement.className = 'spine-character-element';
            characterElement.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: 200px;
                height: 200px;
                border: 2px dashed #007ACC;
                background: rgba(0, 122, 204, 0.1);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: move;
                pointer-events: auto;
                user-select: none;
                opacity: 0.8;
            `;
            
            // キャラクター情報を表示
            characterElement.innerHTML = `
                <div style="text-align: center; color: #007ACC;">
                    <div style="font-size: 24px;">🎭</div>
                    <div style="font-size: 14px; font-weight: bold;">${characterData.name}</div>
                    <div style="font-size: 12px; opacity: 0.7;">Loading Spine...</div>
                </div>
            `;
            
            // キャラクター要素にドラッグ機能を追加
            this.setupCharacterDrag(characterElement, characterData, characterId);
            
            // コンテナに追加
            containerElement.appendChild(characterElement);
            
            // キャラクターリストに登録
            this.spineCharacters.push({
                id: characterId,
                element: characterElement,
                data: characterData,
                position: { x, y },
                spineCharacterId: null // iframe内のSpineキャラクターIDを後で設定
            });
            
            // 🚀 iframe内に実際のSpineキャラクターを追加
            const spineCharacterId = this.iframeSpineBridge.addSpineCharacter(
                characterData,
                x,
                y,
                0.5 // デフォルトスケール
            );
            
            // iframe内のSpineキャラクターIDを記録
            const characterEntry = this.spineCharacters.find(c => c.id === characterId);
            if (characterEntry) {
                characterEntry.spineCharacterId = spineCharacterId;
            }
            
            console.log(`✅ Spineキャラクター「${characterData.name}」をプレビューに追加開始 (ID: ${characterId}, SpineID: ${spineCharacterId})`);
            
            return {
                success: true,
                characterId,
                spineCharacterId,
                element: characterElement
            };
            
        } catch (error) {
            console.error('❌ Spineキャラクター追加エラー:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * キャラクター要素のドラッグ機能設定（プレビュー内での移動）
     * @private
     * @param {Element} element - キャラクター要素
     * @param {object} characterData - キャラクターデータ
     * @param {string} characterId - キャラクターID
     */
    setupCharacterDrag(element, characterData, characterId) {
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let elementStartX = 0;
        let elementStartY = 0;
        
        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            elementStartX = parseInt(element.style.left) || 0;
            elementStartY = parseInt(element.style.top) || 0;
            
            element.style.opacity = '0.8';
            element.style.transform = 'scale(1.05)';
            element.style.zIndex = '1000';
            
            e.preventDefault();
            e.stopPropagation();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;
            
            const newX = elementStartX + deltaX;
            const newY = elementStartY + deltaY;
            
            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.opacity = '1';
                element.style.transform = 'scale(1)';
                element.style.zIndex = '';
                
                // 位置を保存
                const characterEntry = this.spineCharacters?.find(c => c.element === element);
                if (characterEntry) {
                    const newX = parseInt(element.style.left) || 0;
                    const newY = parseInt(element.style.top) || 0;
                    
                    characterEntry.position.x = newX;
                    characterEntry.position.y = newY;
                    
                    console.log(`📍 キャラクター「${characterData.name}」位置更新:`, characterEntry.position);
                    
                    // 🚀 iframe内のSpineキャラクターの位置も同期更新
                    if (characterEntry.spineCharacterId) {
                        this.iframeSpineBridge.updateSpineCharacter(characterEntry.spineCharacterId, {
                            position: { x: newX, y: newY }
                        });
                        console.log(`🎭 Spine character position synced: ${characterEntry.spineCharacterId}`);
                    }
                }
            }
        });
    }

    /**
     * 配置されたキャラクターリストを取得
     * @returns {Array} キャラクターリスト
     */
    getPlacedCharacters() {
        return [...this.spineCharacters];
    }

    /**
     * キャラクターを削除
     * @param {string} characterId - キャラクターID
     * @returns {boolean} 削除成功可否
     */
    removeCharacter(characterId) {
        const index = this.spineCharacters.findIndex(c => c.id === characterId);
        if (index !== -1) {
            const character = this.spineCharacters[index];
            
            // DOM要素を削除
            if (character.element && character.element.parentNode) {
                character.element.parentNode.removeChild(character.element);
            }
            
            // リストから削除
            this.spineCharacters.splice(index, 1);
            
            console.log(`🗑️ キャラクター「${character.data.name}」を削除しました`);
            return true;
        }
        
        console.warn(`⚠️ キャラクター「${characterId}」が見つかりません`);
        return false;
    }

    /**
     * すべてのキャラクターをクリア
     */
    clearAllCharacters() {
        this.spineCharacters.forEach(character => {
            if (character.element && character.element.parentNode) {
                character.element.parentNode.removeChild(character.element);
            }
        });
        
        this.spineCharacters = [];
        console.log('🧹 すべてのキャラクターを削除しました');
    }

    /**
     * 保存されたSpineパスを取得
     * @returns {string|null} 保存されたパス
     */
    getSavedSpinePath() {
        return this.savedSpinePath;
    }

    /**
     * Spineパスをクリア
     */
    clearSpinePath() {
        localStorage.removeItem('spine-editor-spine-path');
        this.savedSpinePath = null;
        console.log('🧹 Spineパスをクリアしました');
    }
}