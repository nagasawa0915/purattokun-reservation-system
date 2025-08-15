/**
 * ユーティリティ関数集
 * 位置管理、トースト通知、ファイルパス処理など
 */

export class Utils {
    /**
     * トースト通知表示（別ウィンドウ風）
     */
    static showToastNotification(message) {
        // 既存のトーストがあれば削除
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        
        // トースト要素を作成
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        
        // スタイル設定
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // ページに追加
        document.body.appendChild(toast);
        
        // フワッと現れるアニメーション
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        // 2秒後にフェードアウトして削除
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            
            // アニメーション完了後に要素削除
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 2000);
    }

    /**
     * 位置データを保存
     * @param {string} characterId - キャラクターID
     * @param {object} position - 位置情報 {x, y}
     */
    static savePosition(characterId, position) {
        const positionData = {
            characterId,
            position,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('spine-desktop-position', JSON.stringify(positionData));
            console.log('💾 位置保存完了:', positionData);
            return { success: true, data: positionData };
        } catch (error) {
            console.error('❌ 位置保存エラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 保存された位置を復元
     * @returns {object|null} 復元された位置データまたはnull
     */
    static restorePosition() {
        try {
            const saved = localStorage.getItem('spine-desktop-position');
            if (!saved) return null;
            
            const positionData = JSON.parse(saved);
            console.log('📍 位置復元:', positionData.position);
            return positionData;
            
        } catch (error) {
            console.error('❌ 位置復元エラー:', error);
            return null;
        }
    }

    /**
     * バックアップパス判定（バックアップフォルダ除外）
     * @param {string} filePath - ファイルパス
     * @returns {boolean} バックアップパスかどうか
     */
    static isBackupPath(filePath) {
        const backupKeywords = ['backup', 'bak', 'バックアップ', 'archive', 'old'];
        const pathLower = filePath.toLowerCase();
        return backupKeywords.some(keyword => pathLower.includes(keyword));
    }

    /**
     * キャラクターフォルダパス取得（Windows/Unix両対応）
     * @param {string} jsonPath - JSONファイルパス
     * @returns {string} キャラクターフォルダパス
     */
    static getCharacterFolder(jsonPath) {
        const parts = jsonPath.split(/[/\\]/);
        parts.pop(); // ファイル名を除去
        return parts.join('/');
    }

    /**
     * パスの正規化（Windows区切り文字対応）
     * @param {string} path - ファイルパス
     * @returns {string} 正規化されたパス
     */
    static normalizePath(path) {
        return path.replace(/\\/g, '/');
    }

    /**
     * ファイル名のみ取得（Windows/Unix両対応）
     * @param {string} path - ファイルパス
     * @returns {string} ファイル名
     */
    static getFileName(path) {
        return path.split(/[/\\]/).pop();
    }

    /**
     * ファイル拡張子を取得
     * @param {string} fileName - ファイル名
     * @returns {string} 拡張子（ドット付き）
     */
    static getFileExtension(fileName) {
        const lastDot = fileName.lastIndexOf('.');
        return lastDot !== -1 ? fileName.substring(lastDot) : '';
    }

    /**
     * ベース名取得（拡張子なし）
     * @param {string} fileName - ファイル名
     * @returns {string} ベース名
     */
    static getBaseName(fileName) {
        const name = this.getFileName(fileName);
        const lastDot = name.lastIndexOf('.');
        return lastDot !== -1 ? name.substring(0, lastDot) : name;
    }

    /**
     * 遅延実行ユーティリティ
     * @param {number} ms - 待機時間（ミリ秒）
     * @returns {Promise} 遅延Promise
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * デバウンス関数作成
     * @param {Function} func - 実行する関数
     * @param {number} wait - 待機時間（ミリ秒）
     * @returns {Function} デバウンスされた関数
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * スロットル関数作成
     * @param {Function} func - 実行する関数
     * @param {number} limit - 実行間隔（ミリ秒）
     * @returns {Function} スロットルされた関数
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * ユニークIDの生成
     * @param {string} prefix - プレフィックス
     * @returns {string} ユニークID
     */
    static generateId(prefix = 'id') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 開発モード判定
     * @returns {boolean} 開発モードかどうか
     */
    static isDevelopmentMode() {
        // Electronアプリ（デスクトップアプリ）の場合は本番モード扱い
        if (window.electronAPI || window.process?.type === 'renderer' || navigator.userAgent.includes('Electron')) {
            // 明示的なデバッグフラグが設定されている場合のみ開発モード
            return window.spineDebugMode === true;
        }
        
        // URLパラメータで dev=true が指定されている場合
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('dev') === 'true') return true;
        
        // localhost または 127.0.0.1 の場合
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // ポート8080-8099は開発モード扱い（ただしElectronアプリ除く）
            const port = parseInt(window.location.port);
            if (port >= 8080 && port <= 8099) return true;
        }
        
        // デバッグフラグが設定されている場合
        if (window.spineDebugMode) return true;
        
        // その他の場合は本番モード
        return false;
    }

    /**
     * デバッグモード手動切り替え（デスクトップアプリ用）
     * @param {boolean} enabled - デバッグモードを有効にするかどうか
     */
    static setDebugMode(enabled) {
        window.spineDebugMode = enabled;
        console.log(`🔧 デバッグモード: ${enabled ? 'ON' : 'OFF'}`);
        console.log(`📊 開発モード判定: ${this.isDevelopmentMode()}`);
        
        if (enabled) {
            console.log('💡 デバッグモードが有効になりました。キャラクター検索ログが表示されます。');
        } else {
            console.log('💡 デバッグモードが無効になりました。ログ出力が停止されます。');
        }
    }

    /**
     * LocalStorage操作のラッパー
     */
    static storage = {
        /**
         * アイテムを保存
         * @param {string} key - キー
         * @param {any} value - 値
         * @returns {boolean} 成功したかどうか
         */
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('❌ LocalStorage保存エラー:', error);
                return false;
            }
        },

        /**
         * アイテムを取得
         * @param {string} key - キー
         * @param {any} defaultValue - デフォルト値
         * @returns {any} 取得した値
         */
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item !== null ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('❌ LocalStorage取得エラー:', error);
                return defaultValue;
            }
        },

        /**
         * アイテムを削除
         * @param {string} key - キー
         * @returns {boolean} 成功したかどうか
         */
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('❌ LocalStorage削除エラー:', error);
                return false;
            }
        },

        /**
         * すべてクリア
         * @returns {boolean} 成功したかどうか
         */
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('❌ LocalStorageクリアエラー:', error);
                return false;
            }
        }
    };
}

// デスクトップアプリでのデバッグ用にUtilsをグローバルに公開
if (typeof window !== 'undefined') {
    window.Utils = Utils;
}