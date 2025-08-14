/**
 * iframe間Spine通信ブリッジ
 * メインアプリからプレビューiframe内のSpineシステムを制御
 */

export class IframeSpineBridge {
    constructor() {
        this.iframe = null;
        this.messageHandlers = new Map();
        this.isSpineReady = false;
        this.pendingMessages = [];
        
        this.setupMessageListener();
        console.log('🌉 IframeSpineBridge initialized');
    }

    /**
     * プレビューiframeを設定
     * @param {HTMLIFrameElement} iframe - プレビューiframe要素
     */
    setIframe(iframe) {
        this.iframe = iframe;
        
        // iframeロード完了時にSpine環境を初期化
        if (iframe) {
            iframe.addEventListener('load', () => {
                console.log('🖼️ Iframe loaded, initializing Spine environment...');
                this.initializeSpineEnvironment();
            });
        }
        
        console.log('🖼️ Iframe set:', iframe?.src);
    }

    /**
     * postMessage通信をセットアップ
     */
    setupMessageListener() {
        window.addEventListener('message', (event) => {
            if (event.origin !== window.location.origin) {
                return; // セキュリティ: 同一オリジンのみ許可
            }
            
            if (event.data.source !== 'iframe-spine-loader') {
                return; // iframe-spine-loaderからのメッセージのみ処理
            }
            
            const { type, data } = event.data;
            
            switch (type) {
                case 'SPINE_READY':
                    this.handleSpineReady(data);
                    break;
                case 'SPINE_ERROR':
                    this.handleSpineError(data);
                    break;
                case 'SPINE_CHARACTER_ADDED':
                    this.handleCharacterAdded(data);
                    break;
                case 'SPINE_CHARACTER_UPDATED':
                    this.handleCharacterUpdated(data);
                    break;
                case 'SPINE_CHARACTER_REMOVED':
                    this.handleCharacterRemoved(data);
                    break;
                case 'SPINE_CHARACTER_ERROR':
                    this.handleCharacterError(data);
                    break;
                default:
                    console.log('🌉 Unknown message from iframe:', type, data);
            }
        });
        
        console.log('✅ Message listener setup complete');
    }

    /**
     * iframe内Spine環境を初期化
     */
    initializeSpineEnvironment() {
        if (!this.iframe || !this.iframe.contentWindow) {
            console.warn('⚠️ Iframe not available for Spine initialization');
            return;
        }
        
        this.sendMessage('SPINE_INIT', {});
        console.log('🚀 Spine initialization message sent');
    }

    /**
     * Spineキャラクターをiframe内に追加
     * @param {object} characterData - キャラクターデータ
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} scale - スケール
     * @returns {string} キャラクターID
     */
    addSpineCharacter(characterData, x = 200, y = 200, scale = 0.5) {
        const characterId = `spine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const message = {
            characterId,
            characterData,
            position: { x, y },
            scale
        };
        
        this.sendMessage('SPINE_ADD_CHARACTER', message);
        
        console.log(`🎭 Add character message sent: ${characterData.name} (ID: ${characterId})`);
        return characterId;
    }

    /**
     * Spineキャラクターを更新
     * @param {string} characterId - キャラクターID
     * @param {object} updates - 更新データ {position, scale, animation}
     */
    updateSpineCharacter(characterId, updates) {
        const message = {
            characterId,
            ...updates
        };
        
        this.sendMessage('SPINE_UPDATE_CHARACTER', message);
        
        console.log(`🎭 Update character message sent: ${characterId}`, updates);
    }

    /**
     * Spineキャラクターを削除
     * @param {string} characterId - キャラクターID
     */
    removeSpineCharacter(characterId) {
        this.sendMessage('SPINE_REMOVE_CHARACTER', { characterId });
        
        console.log(`🎭 Remove character message sent: ${characterId}`);
    }

    /**
     * iframe内にメッセージを送信
     * @param {string} type - メッセージタイプ
     * @param {object} data - メッセージデータ
     */
    sendMessage(type, data) {
        if (!this.iframe || !this.iframe.contentWindow) {
            console.warn('⚠️ Iframe not available, queuing message:', type);
            this.pendingMessages.push({ type, data });
            return;
        }
        
        // Spine環境が準備できていない場合はメッセージをキューに保存
        if (!this.isSpineReady && type !== 'SPINE_INIT') {
            console.log('⏳ Spine not ready, queuing message:', type);
            this.pendingMessages.push({ type, data });
            return;
        }
        
        try {
            this.iframe.contentWindow.postMessage({
                type,
                data,
                source: 'iframe-spine-bridge'
            }, window.location.origin);
            
            console.log(`📤 Message sent to iframe: ${type}`);
            
        } catch (error) {
            console.error('❌ Failed to send message to iframe:', error);
        }
    }

    /**
     * Spine準備完了ハンドラ
     * @param {object} data - 準備完了データ
     */
    handleSpineReady(data) {
        console.log('✅ Spine environment ready in iframe:', data);
        this.isSpineReady = true;
        
        // ペンディングメッセージを送信
        if (this.pendingMessages.length > 0) {
            console.log(`📤 Sending ${this.pendingMessages.length} pending messages`);
            
            this.pendingMessages.forEach(({ type, data }) => {
                this.sendMessage(type, data);
            });
            
            this.pendingMessages = [];
        }
        
        // 準備完了イベントを発火
        this.emit('spineReady', data);
    }

    /**
     * Spineエラーハンドラ
     * @param {object} data - エラーデータ
     */
    handleSpineError(data) {
        console.error('❌ Spine error in iframe:', data);
        this.isSpineReady = false;
        
        // エラーイベントを発火
        this.emit('spineError', data);
    }

    /**
     * キャラクター追加完了ハンドラ
     * @param {object} data - 追加完了データ
     */
    handleCharacterAdded(data) {
        console.log('✅ Character added in iframe:', data);
        
        // キャラクター追加イベントを発火
        this.emit('characterAdded', data);
    }

    /**
     * キャラクター更新完了ハンドラ
     * @param {object} data - 更新完了データ
     */
    handleCharacterUpdated(data) {
        console.log('✅ Character updated in iframe:', data);
        
        // キャラクター更新イベントを発火
        this.emit('characterUpdated', data);
    }

    /**
     * キャラクター削除完了ハンドラ
     * @param {object} data - 削除完了データ
     */
    handleCharacterRemoved(data) {
        console.log('✅ Character removed in iframe:', data);
        
        // キャラクター削除イベントを発火
        this.emit('characterRemoved', data);
    }

    /**
     * キャラクター操作エラーハンドラ
     * @param {object} data - エラーデータ
     */
    handleCharacterError(data) {
        console.error('❌ Character operation error in iframe:', data);
        
        // キャラクターエラーイベントを発火
        this.emit('characterError', data);
    }

    /**
     * イベントリスナー登録
     * @param {string} event - イベント名
     * @param {Function} handler - ハンドラ関数
     */
    on(event, handler) {
        if (!this.messageHandlers.has(event)) {
            this.messageHandlers.set(event, []);
        }
        this.messageHandlers.get(event).push(handler);
    }

    /**
     * イベントリスナー削除
     * @param {string} event - イベント名
     * @param {Function} handler - ハンドラ関数
     */
    off(event, handler) {
        if (this.messageHandlers.has(event)) {
            const handlers = this.messageHandlers.get(event);
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * イベントを発火
     * @param {string} event - イベント名
     * @param {object} data - イベントデータ
     */
    emit(event, data) {
        if (this.messageHandlers.has(event)) {
            this.messageHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`❌ Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    /**
     * 状態をリセット
     */
    reset() {
        this.isSpineReady = false;
        this.pendingMessages = [];
        this.iframe = null;
        
        console.log('🔄 IframeSpineBridge reset');
    }

    /**
     * デバッグ情報を取得
     * @returns {object} デバッグ情報
     */
    getDebugInfo() {
        return {
            isSpineReady: this.isSpineReady,
            pendingMessagesCount: this.pendingMessages.length,
            hasIframe: !!this.iframe,
            iframeSrc: this.iframe?.src || 'none',
            handlersCount: this.messageHandlers.size
        };
    }
}