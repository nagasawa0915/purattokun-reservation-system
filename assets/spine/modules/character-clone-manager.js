// 🔄 Character Clone Manager - キャラクター複製システム
// 作成日: 2025-01-31
// 目標: 完全モジュール化・SpinePositioningV2との軽やかな統合

console.log('🔄 Character Clone Manager 読み込み開始');

// ========== 📦 キャラクター複製管理クラス ========== //

class CharacterCloneManager {
    constructor(spineSystem = null) {
        this.spineSystem = spineSystem; // SpinePositioningV2への参照（オプション）
        this.cloneCounter = 1;
        this.clonedCharacters = new Map(); // cloneId -> cloneData
        this.clonePrefix = 'clone-';
        this.initialized = false;
        
        console.log('🔄 CharacterCloneManager 初期化完了');
    }
    
    // ========== 🔧 初期化 ========== //
    init(spineSystem) {
        if (this.initialized) {
            console.log('⚠️ 複製システムは既に初期化済み');
            return;
        }
        
        this.spineSystem = spineSystem;
        this.initialized = true;
        console.log('✅ 複製システム初期化完了');
    }
    
    // ========== 🎯 メイン複製機能 ========== //
    cloneActiveCharacter(offsetX = 50, offsetY = 50) {
        if (!this.spineSystem || !this.spineSystem.characters) {
            console.error('❌ SpinePositioningV2システムが利用できません');
            return null;
        }
        
        const activeIndex = this.spineSystem.activeIndex;
        const activeChar = this.spineSystem.characters[activeIndex];
        
        if (!activeChar) {
            console.error('❌ アクティブキャラクターが見つかりません');
            return null;
        }
        
        console.log('🔄 キャラクター複製開始:', activeChar.name);
        
        try {
            // 新しい複製ID生成
            const cloneId = this.generateCloneId(activeChar.id);
            
            // DOM要素の複製
            const clonedElement = this.cloneDOMElement(activeChar.element, cloneId);
            if (!clonedElement) {
                throw new Error('DOM要素の複製に失敗');
            }
            
            // 位置オフセット適用
            this.applyPositionOffset(clonedElement, activeChar.element, offsetX, offsetY);
            
            // キャラクターデータの作成
            const cloneData = this.createCloneData(activeChar, clonedElement, cloneId);
            
            // 複製リストに追加
            this.clonedCharacters.set(cloneId, cloneData);
            
            // SpineSystem配列に追加
            this.spineSystem.characters.push(cloneData.characterData);
            
            console.log('✅ 複製完了:', cloneId);
            return cloneData;
            
        } catch (error) {
            console.error('❌ 複製処理エラー:', error);
            return null;
        }
    }
    
    // ========== 🔧 ID生成システム ========== //
    generateCloneId(originalId) {
        let cloneId;
        do {
            cloneId = `${originalId}-${this.clonePrefix}${this.cloneCounter}`;
            this.cloneCounter++;
        } while (document.getElementById(cloneId) || this.clonedCharacters.has(cloneId));
        
        return cloneId;
    }
    
    // ========== 🎨 DOM要素複製 ========== //
    cloneDOMElement(originalElement, cloneId) {
        try {
            // 要素の深いクローン作成
            const clonedElement = originalElement.cloneNode(true);
            
            // 新しいIDを設定
            clonedElement.id = cloneId;
            
            // data属性の更新
            if (clonedElement.dataset.characterName) {
                clonedElement.dataset.characterName += ' (複製)';
            }
            
            // クローンマーク追加
            clonedElement.dataset.cloned = 'true';
            clonedElement.dataset.originalId = originalElement.id;
            
            // DOM挿入
            originalElement.parentNode.appendChild(clonedElement);
            
            console.log('🎨 DOM要素複製完了:', cloneId);
            return clonedElement;
            
        } catch (error) {
            console.error('❌ DOM複製エラー:', error);
            return null;
        }
    }
    
    // ========== 📐 位置オフセット適用 ========== //
    applyPositionOffset(clonedElement, originalElement, offsetX, offsetY) {
        try {
            // 元要素の位置取得
            const originalStyle = getComputedStyle(originalElement);
            const originalLeft = parseFloat(originalStyle.left) || 0;
            const originalTop = parseFloat(originalStyle.top) || 0;
            
            // オフセット適用
            const newLeft = originalLeft + offsetX;
            const newTop = originalTop + offsetY;
            
            // 新しい位置を設定
            clonedElement.style.position = 'absolute';
            clonedElement.style.left = `${newLeft}px`;
            clonedElement.style.top = `${newTop}px`;
            
            console.log(`📐 位置オフセット適用: (${newLeft}, ${newTop})`);
            
        } catch (error) {
            console.error('❌ 位置オフセット適用エラー:', error);
        }
    }
    
    // ========== 📋 キャラクターデータ作成 ========== //
    createCloneData(originalChar, clonedElement, cloneId) {
        const characterData = {
            element: clonedElement,
            id: cloneId,
            name: `${originalChar.name} (複製)`,
            selector: `#${cloneId}`,
            scale: originalChar.scale || 1.0,
            isActive: false,
            zIndex: (originalChar.zIndex || 1000) + this.clonedCharacters.size + 1,
            originalOrder: this.spineSystem.characters.length,
            isClone: true, // 複製マーク
            originalId: originalChar.id
        };
        
        const cloneData = {
            cloneId: cloneId,
            originalId: originalChar.id,
            characterData: characterData,
            createdAt: new Date().toISOString(),
            element: clonedElement
        };
        
        return cloneData;
    }
    
    // ========== 🗑️ 複製削除機能 ========== //
    deleteClone(cloneId) {
        const cloneData = this.clonedCharacters.get(cloneId);
        if (!cloneData) {
            console.error('❌ 複製が見つかりません:', cloneId);
            return false;
        }
        
        try {
            // DOM要素を削除
            if (cloneData.element && cloneData.element.parentNode) {
                cloneData.element.parentNode.removeChild(cloneData.element);
            }
            
            // SpineSystem配列から削除
            if (this.spineSystem && this.spineSystem.characters) {
                const index = this.spineSystem.characters.findIndex(
                    char => char.id === cloneId
                );
                if (index !== -1) {
                    this.spineSystem.characters.splice(index, 1);
                }
            }
            
            // 複製リストから削除
            this.clonedCharacters.delete(cloneId);
            
            console.log('✅ 複製削除完了:', cloneId);
            return true;
            
        } catch (error) {
            console.error('❌ 複製削除エラー:', error);
            return false;
        }
    }
    
    // ========== 📊 情報取得機能 ========== //
    getCloneList() {
        return Array.from(this.clonedCharacters.entries()).map(([cloneId, cloneData]) => ({
            cloneId,
            originalId: cloneData.originalId,
            name: cloneData.characterData.name,
            createdAt: cloneData.createdAt
        }));
    }
    
    getCloneCount() {
        return this.clonedCharacters.size;
    }
    
    getCloneById(cloneId) {
        return this.clonedCharacters.get(cloneId) || null;
    }
    
    isClone(elementOrId) {
        const id = typeof elementOrId === 'string' ? elementOrId : elementOrId.id;
        return this.clonedCharacters.has(id);
    }
    
    // ========== 🧹 全複製削除 ========== //
    deleteAllClones() {
        const cloneIds = Array.from(this.clonedCharacters.keys());
        let deletedCount = 0;
        
        cloneIds.forEach(cloneId => {
            if (this.deleteClone(cloneId)) {
                deletedCount++;
            }
        });
        
        console.log(`🧹 全複製削除完了: ${deletedCount}個`);
        return deletedCount;
    }
    
    // ========== 🔄 複製状態復元機能 ========== //
    restoreClones(clonesData) {
        if (!Array.isArray(clonesData)) {
            console.error('❌ 無効な複製データ:', clonesData);
            return false;
        }
        
        console.log(`🔄 複製状態復元開始: ${clonesData.length}個`);
        
        // 既存の複製を全て削除
        this.deleteAllClones();
        
        let restoredCount = 0;
        
        clonesData.forEach(cloneInfo => {
            try {
                // 複製データに必要な情報があるかチェック
                if (!cloneInfo.cloneId || !cloneInfo.originalId) {
                    console.warn('⚠️ 不完全な複製データをスキップ:', cloneInfo);
                    return;
                }
                
                // 元キャラクターを探す
                const originalChar = this.spineSystem?.characters?.find(
                    char => char.id === cloneInfo.originalId
                );
                
                if (originalChar) {
                    // 複製を作成（位置情報があれば使用）
                    const offsetX = cloneInfo.style?.left ? parseFloat(cloneInfo.style.left) : 50;
                    const offsetY = cloneInfo.style?.top ? parseFloat(cloneInfo.style.top) : 50;
                    
                    const cloneData = this.cloneActiveCharacter(offsetX, offsetY);
                    
                    if (cloneData) {
                        // 複製のIDを復元データに合わせて更新（必要に応じて）
                        restoredCount++;
                        console.log(`✅ 複製復元: ${cloneInfo.cloneId} → ${cloneData.cloneId}`);
                    }
                } else {
                    console.warn(`⚠️ 元キャラクターが見つかりません: ${cloneInfo.originalId}`);
                }
                
            } catch (error) {
                console.error('❌ 複製復元エラー:', error, cloneInfo);
            }
        });
        
        console.log(`✅ 複製状態復元完了: ${restoredCount}/${clonesData.length}個`);
        return restoredCount > 0;
    }
    
    // ========== 🔧 UI統合準備機能 ========== //
    createCloneButton(containerId = 'character-controls') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('❌ UI容器が見つかりません:', containerId);
            return null;
        }
        
        const button = document.createElement('button');
        button.id = 'clone-character-btn';
        button.textContent = '🔄 複製';
        button.className = 'clone-btn';
        button.onclick = () => this.handleCloneButtonClick();
        
        container.appendChild(button);
        console.log('✅ 複製ボタン作成完了');
        return button;
    }
    
    handleCloneButtonClick() {
        const cloneData = this.cloneActiveCharacter();
        if (cloneData) {
            this.notifyUI('clone-created', cloneData);
        }
    }
    
    // UI更新通知
    notifyUI(eventType, data) {
        const event = new CustomEvent('characterCloneManager', {
            detail: { type: eventType, data: data }
        });
        document.dispatchEvent(event);
    }
    
    // ========== 📊 デバッグ・統計機能 ========== //
    getStatistics() {
        return {
            totalClones: this.clonedCharacters.size,
            cloneCounter: this.cloneCounter - 1,
            initialized: this.initialized,
            spineSystemConnected: !!this.spineSystem
        };
    }
    
    debugLog() {
        console.group('🔄 Character Clone Manager Debug');
        console.log('統計:', this.getStatistics());
        console.log('複製リスト:', this.getCloneList());
        console.log('複製データ:', Array.from(this.clonedCharacters.entries()));
        console.groupEnd();
    }
}

// ========== 🌐 グローバル公開 ========== //

// モジュールをグローバルに公開
window.CharacterCloneManager = CharacterCloneManager;

// デフォルトインスタンス作成
if (!window.characterCloneManager) {
    window.characterCloneManager = new CharacterCloneManager();
    console.log('🔄 デフォルトCloneManager作成完了');
}

// SpinePositioningV2との自動統合
if (typeof SpinePositioningV2 !== 'undefined' && SpinePositioningV2.characters) {
    window.characterCloneManager.init(SpinePositioningV2);
    console.log('🔗 SpinePositioningV2と自動統合完了');
}

// 統合確認用デバッグ関数
window.debugCloneManager = () => {
    if (window.characterCloneManager) {
        window.characterCloneManager.debugLog();
    } else {
        console.error('❌ CharacterCloneManager が利用できません');
    }
};

console.log('✅ Character Clone Manager 読み込み完了');

// ========== 📖 使用例コメント ========== //
/*
使用例:

// 基本的な複製
window.characterCloneManager.cloneActiveCharacter();

// カスタムオフセット付き複製
window.characterCloneManager.cloneActiveCharacter(100, 100);

// 複製削除
window.characterCloneManager.deleteClone('purattokun-canvas-clone-1');

// 全複製削除
window.characterCloneManager.deleteAllClones();

// 複製リスト取得
console.log(window.characterCloneManager.getCloneList());

// 状態復元
window.characterCloneManager.restoreClones(savedClonesData);

// デバッグ情報
window.debugCloneManager();

// UI統合
window.characterCloneManager.createCloneButton('my-controls');

// イベントリスナー
document.addEventListener('characterCloneManager', (event) => {
    console.log('複製イベント:', event.detail);
});
*/