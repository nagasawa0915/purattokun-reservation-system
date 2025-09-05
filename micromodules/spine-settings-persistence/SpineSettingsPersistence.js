/**
 * SpineSettingsPersistence - Spine設定永続化専用マイクロモジュール
 * 
 * 【設計思想】
 * - 単一責任の原則: 永続化のみに特化
 * - シンプルなAPI: 直感的で理解しやすい
 * - 確実性: localStorage操作を安全に実行
 * - 汎用性: 任意のSpineキャラクター・ページで利用可能
 * 
 * 【主な機能】
 * - save(): キャラクター設定保存
 * - restore(): 設定復元
 * - clear(): 設定削除
 * - exists(): 設定存在確認
 * 
 * @version 1.0.0
 * @author Generated with Claude Code
 */
class SpineSettingsPersistence {
    
    /**
     * コンストラクタ
     * @param {Object} options 設定オプション
     * @param {boolean} options.debug デバッグログ出力フラグ
     * @param {string} options.version データバージョン
     */
    constructor(options = {}) {
        this.options = {
            debug: options.debug || false,
            version: options.version || '1.0',
            keyPrefix: 'spineSettings'
        };
        
        this.log('🎯 SpineSettingsPersistence initialized', 'info');
    }
    
    /**
     * デバッグログ出力
     * @param {string} message ログメッセージ
     * @param {string} level ログレベル (info, warn, error)
     */
    log(message, level = 'info') {
        if (!this.options.debug) return;
        
        const prefix = '[SpineSettingsPersistence]';
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        
        switch (level) {
            case 'error':
                console.error(`${prefix} ${timestamp} ❌ ${message}`);
                break;
            case 'warn':
                console.warn(`${prefix} ${timestamp} ⚠️ ${message}`);
                break;
            default:
                console.log(`${prefix} ${timestamp} ℹ️ ${message}`);
        }
    }
    
    /**
     * 現在のページIDを取得
     * @returns {string} ページ識別子
     */
    getPageId() {
        // URLパスをページIDとして使用
        let pageId = window.location.pathname;
        if (pageId === '/') pageId = 'index';
        
        // ファイル名のみ抽出（パスの最後の部分）
        const pathParts = pageId.split('/');
        const fileName = pathParts[pathParts.length - 1];
        
        // 拡張子を除去
        const finalPageId = fileName.replace(/\.[^/.]+$/, '') || 'default';
        
        this.log(`📋 ページID決定: ${pageId} → ${finalPageId}`);
        return finalPageId;
    }
    
    /**
     * localStorageキーを生成
     * @param {string} characterId キャラクターID
     * @returns {string} localStorage用キー
     */
    generateKey(characterId) {
        const pageId = this.getPageId();
        const key = `${this.options.keyPrefix}-${pageId}-${characterId}`;
        
        this.log(`🔑 キー生成: ${key}`);
        return key;
    }
    
    /**
     * 設定データの検証
     * @param {Object} settings 設定データ
     * @returns {boolean} 検証結果
     */
    validateSettings(settings) {
        if (!settings || typeof settings !== 'object') {
            this.log('❌ 設定データが無効: オブジェクトではありません', 'error');
            return false;
        }
        
        // 存在するフィールドのみ検証（部分保存対応）
        const scaleRange = { min: 0.1, max: 5.0 };
        
        // scaleX検証（存在する場合のみ）
        if ("scaleX" in settings) {
            if (typeof settings.scaleX !== "number") {
                this.log(`❌ scaleX型が無効: ${typeof settings.scaleX}`, "error");
                return false;
            }
            if (settings.scaleX < scaleRange.min || settings.scaleX > scaleRange.max) {
                this.log(`❌ scaleX範囲外: ${settings.scaleX} (${scaleRange.min}-${scaleRange.max})`, "error");
                return false;
            }
        }
        
        // scaleY検証（存在する場合のみ）
        if ("scaleY" in settings) {
            if (typeof settings.scaleY !== "number") {
                this.log(`❌ scaleY型が無効: ${typeof settings.scaleY}`, "error");
                return false;
            }
            if (settings.scaleY < scaleRange.min || settings.scaleY > scaleRange.max) {
                this.log(`❌ scaleY範囲外: ${settings.scaleY} (${scaleRange.min}-${scaleRange.max})`, "error");
                return false;
            }
        }
        
        // canvasSize検証（存在する場合のみ）
        if ("canvasSize" in settings && settings.canvasSize !== null && settings.canvasSize !== undefined) {
            if (typeof settings.canvasSize !== "number") {
                this.log(`❌ canvasSize型が無効: ${typeof settings.canvasSize}`, "error");
                return false;
            }
            if (settings.canvasSize <= 0 || settings.canvasSize > 4096) {
                this.log(`❌ canvasSize範囲外: ${settings.canvasSize} (1-4096)`, "error");
                return false;
            }
        }
        
        // positionX検証（存在する場合のみ）
        if ("positionX" in settings && settings.positionX !== null && settings.positionX !== undefined) {
            if (typeof settings.positionX !== "number") {
                this.log(`❌ positionX型が無効: ${typeof settings.positionX}`, "error");
                return false;
            }
        }
        
        // positionY検証（存在する場合のみ）
        if ("positionY" in settings && settings.positionY !== null && settings.positionY !== undefined) {
            if (typeof settings.positionY !== "number") {
                this.log(`❌ positionY型が無効: ${typeof settings.positionY}`, "error");
                return false;
            }
        }
        
        this.log("✅ 設定データ検証完了（部分保存対応）");
        return true;
    }
    
    /**
     * localStorage容量チェック
     * @returns {boolean} 容量に余裕があるか
     */
    checkStorageCapacity() {
        try {
            const testKey = '_capacityTest';
            const testData = 'x'.repeat(1024); // 1KB
            
            localStorage.setItem(testKey, testData);
            localStorage.removeItem(testKey);
            
            return true;
        } catch (error) {
            this.log(`⚠️ localStorage容量不足: ${error.message}`, 'warn');
            return false;
        }
    }
    
    /**
     * キャラクター設定を保存
     * @param {string} characterId キャラクターID
     * @param {Object} settings 保存する設定
     * @param {number} settings.scaleX X軸スケール
     * @param {number} settings.scaleY Y軸スケール
     * @param {number} [settings.positionX] X座標
     * @param {number} [settings.positionY] Y座標
     * @param {number} [settings.canvasSize] Canvasサイズ
     * @returns {boolean} 保存成功フラグ
     */
    save(characterId, settings) {
        this.log(`💾 設定保存開始: ${characterId}`);
        
        // 入力検証
        if (!characterId || typeof characterId !== 'string') {
            this.log('❌ 無効なキャラクターID', 'error');
            return false;
        }
        
        if (!this.validateSettings(settings)) {
            return false;
        }
        
        // 容量チェック
        if (!this.checkStorageCapacity()) {
            this.log('❌ localStorage容量不足のため保存失敗', 'error');
            return false;
        }
        
        try {
            const key = this.generateKey(characterId);
            
            // 既存データを取得して統合保存（部分保存対応）
            let existingData = null;
            try {
                const existingJson = localStorage.getItem(key);
                if (existingJson) {
                    existingData = JSON.parse(existingJson);
                }
            } catch (error) {
                this.log(`⚠️ 既存データ取得エラー（新規作成）: ${error.message}`, "warn");
            }
            
            // 統合保存データ構造
            const mergedSettings = {
                scaleX: settings.scaleX !== undefined ? settings.scaleX : (existingData?.settings?.scaleX || 1.0),
                scaleY: settings.scaleY !== undefined ? settings.scaleY : (existingData?.settings?.scaleY || 1.0),
                positionX: settings.positionX !== undefined ? settings.positionX : (existingData?.settings?.positionX || 0),
                positionY: settings.positionY !== undefined ? settings.positionY : (existingData?.settings?.positionY || 0),
                canvasSize: settings.canvasSize !== undefined ? settings.canvasSize : (existingData?.settings?.canvasSize || null)
            };
            
            const saveData = {
                version: this.options.version,
                timestamp: new Date().toISOString(),
                characterId: characterId,
                settings: mergedSettings
            };
            
            const jsonData = JSON.stringify(saveData);
            localStorage.setItem(key, jsonData);
            
            this.log(`✅ 設定保存完了: ${characterId} (${jsonData.length}bytes)`);
            return true;
            
        } catch (error) {
            this.log(`❌ 保存エラー: ${error.message}`, 'error');
            return false;
        }
    }
    
    /**
     * キャラクター設定を復元
     * @param {string} characterId キャラクターID
     * @returns {Object|null} 復元された設定、または null
     */
    restore(characterId) {
        this.log(`📂 設定復元開始: ${characterId}`);
        
        if (!characterId || typeof characterId !== 'string') {
            this.log('❌ 無効なキャラクターID', 'error');
            return null;
        }
        
        try {
            const key = this.generateKey(characterId);
            const jsonData = localStorage.getItem(key);
            
            if (!jsonData) {
                this.log(`ℹ️ 保存データなし: ${characterId}`);
                return null;
            }
            
            const saveData = JSON.parse(jsonData);
            
            // データ形式検証
            if (!saveData || !saveData.settings) {
                this.log('❌ 無効な保存データ形式', 'error');
                return null;
            }
            
            if (!this.validateSettings(saveData.settings)) {
                this.log('❌ 保存データの検証失敗', 'error');
                return null;
            }
            
            this.log(`✅ 設定復元完了: ${characterId}`);
            this.log(`📊 復元データ: scaleX=${saveData.settings.scaleX}, scaleY=${saveData.settings.scaleY}`);
            
            return saveData.settings;
            
        } catch (error) {
            this.log(`❌ 復元エラー: ${error.message}`, 'error');
            return null;
        }
    }
    
    /**
     * キャラクター設定を削除
     * @param {string} characterId キャラクターID
     * @returns {boolean} 削除成功フラグ
     */
    clear(characterId) {
        this.log(`🗑️ 設定削除開始: ${characterId}`);
        
        if (!characterId || typeof characterId !== 'string') {
            this.log('❌ 無効なキャラクターID', 'error');
            return false;
        }
        
        try {
            const key = this.generateKey(characterId);
            
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                this.log(`✅ 設定削除完了: ${characterId}`);
                return true;
            } else {
                this.log(`ℹ️ 削除対象なし: ${characterId}`);
                return true; // 削除対象がない場合も成功とみなす
            }
            
        } catch (error) {
            this.log(`❌ 削除エラー: ${error.message}`, 'error');
            return false;
        }
    }
    
    /**
     * キャラクター設定の存在確認
     * @param {string} characterId キャラクターID
     * @returns {boolean} 設定が存在するか
     */
    exists(characterId) {
        if (!characterId || typeof characterId !== 'string') {
            return false;
        }
        
        try {
            const key = this.generateKey(characterId);
            const exists = localStorage.getItem(key) !== null;
            
            this.log(`🔍 存在確認: ${characterId} → ${exists ? 'あり' : 'なし'}`);
            return exists;
            
        } catch (error) {
            this.log(`❌ 存在確認エラー: ${error.message}`, 'error');
            return false;
        }
    }
    
    /**
     * 現在ページの全キャラクター設定を取得
     * @returns {Object} キャラクターIDをキーとした設定オブジェクト
     */
    getAllForCurrentPage() {
        this.log('📋 現在ページの全設定取得');
        
        const pageId = this.getPageId();
        const prefix = `${this.options.keyPrefix}-${pageId}-`;
        const results = {};
        
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    const characterId = key.replace(prefix, '');
                    const settings = this.restore(characterId);
                    if (settings) {
                        results[characterId] = settings;
                    }
                }
            }
            
            const count = Object.keys(results).length;
            this.log(`✅ 全設定取得完了: ${count}キャラクター`);
            return results;
            
        } catch (error) {
            this.log(`❌ 全設定取得エラー: ${error.message}`, 'error');
            return {};
        }
    }
    
    /**
     * デバッグ情報を出力
     */
    debug() {
        console.log('🔧 SpineSettingsPersistence Debug Info');
        console.log('Version:', this.options.version);
        console.log('Page ID:', this.getPageId());
        
        const allSettings = this.getAllForCurrentPage();
        console.log('Current Page Settings:', allSettings);
        
        // localStorage使用状況
        try {
            const usage = JSON.stringify(localStorage).length;
            console.log('localStorage Usage:', `${usage} bytes`);
        } catch (error) {
            console.log('localStorage Usage: Cannot calculate');
        }
    }
}

// グローバル使用可能にする（オプション）
if (typeof window !== 'undefined') {
    window.SpineSettingsPersistence = SpineSettingsPersistence;
}

// Node.js環境での使用（テスト用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpineSettingsPersistence;
}