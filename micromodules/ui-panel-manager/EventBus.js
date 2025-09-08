/**
 * EventBus.js - マイクロモジュール間通信システム
 * 
 * シンプルなイベントドリブン通信を提供
 */

class EventBus {
    constructor() {
        this.events = new Map();
        this.onceEvents = new Map();
        this.debug = false;
    }

    /**
     * イベントリスナーを登録
     * @param {string} eventType - イベント名
     * @param {function} listener - リスナー関数
     */
    on(eventType, listener) {
        if (!this.events.has(eventType)) {
            this.events.set(eventType, []);
        }
        this.events.get(eventType).push(listener);
        
        if (this.debug) {
            console.log(`EventBus: Registered listener for '${eventType}'`);
        }
    }

    /**
     * 一度だけ実行されるイベントリスナーを登録
     */
    once(eventType, listener) {
        if (!this.onceEvents.has(eventType)) {
            this.onceEvents.set(eventType, []);
        }
        this.onceEvents.get(eventType).push(listener);
    }

    /**
     * イベントリスナーを削除
     */
    off(eventType, listener) {
        if (this.events.has(eventType)) {
            const listeners = this.events.get(eventType);
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * イベントを発火
     * @param {string} eventType - イベント名
     * @param {any} data - イベントデータ
     */
    emit(eventType, data = {}) {
        if (this.debug) {
            console.log(`EventBus: Emitting '${eventType}'`, data);
        }

        // 通常のリスナー実行
        if (this.events.has(eventType)) {
            const listeners = this.events.get(eventType);
            listeners.forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`EventBus: Error in listener for '${eventType}'`, error);
                }
            });
        }

        // 一度だけのリスナー実行
        if (this.onceEvents.has(eventType)) {
            const onceListeners = this.onceEvents.get(eventType);
            onceListeners.forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`EventBus: Error in once listener for '${eventType}'`, error);
                }
            });
            // 実行後に削除
            this.onceEvents.delete(eventType);
        }
    }

    /**
     * 特定イベントのリスナー数を取得
     */
    listenerCount(eventType) {
        const normalCount = this.events.has(eventType) ? this.events.get(eventType).length : 0;
        const onceCount = this.onceEvents.has(eventType) ? this.onceEvents.get(eventType).length : 0;
        return normalCount + onceCount;
    }

    /**
     * 全てのリスナーをクリア
     */
    removeAllListeners(eventType = null) {
        if (eventType) {
            this.events.delete(eventType);
            this.onceEvents.delete(eventType);
        } else {
            this.events.clear();
            this.onceEvents.clear();
        }
    }

    /**
     * デバッグモードの切り替え
     */
    setDebug(enabled = true) {
        this.debug = enabled;
        if (enabled) {
            console.log('EventBus: Debug mode enabled');
        }
    }

    /**
     * 登録済みイベントの一覧を取得
     */
    getEventTypes() {
        const eventTypes = new Set([...this.events.keys(), ...this.onceEvents.keys()]);
        return Array.from(eventTypes);
    }
}

// グローバルEventBusインスタンス（シングルトン）
let globalEventBus = null;

/**
 * グローバルEventBusインスタンスを取得
 */
export function getGlobalEventBus() {
    if (!globalEventBus) {
        globalEventBus = new EventBus();
        if (window) {
            window.globalEventBus = globalEventBus; // デバッグ用
        }
    }
    return globalEventBus;
}

export default EventBus;