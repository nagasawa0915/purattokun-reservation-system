/**
 * Spine SkeletonBounds 境界ボックス認識システム
 * 公式のspine.SkeletonBoundsを使用した正確な境界ボックス検出
 */

// ログレベル定義
const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

// ログ関数
function log(level, category, message) {
    const prefix = `[SPINE-BOUNDS]`;
    const categoryStr = category ? ` ${category.toUpperCase()}:` : '';
    const levelStr = Object.keys(LogLevel)[level] || 'INFO';
    
    switch(level) {
        case LogLevel.ERROR:
            console.error(`${prefix}${categoryStr} ${message}`);
            break;
        case LogLevel.WARN:
            console.warn(`${prefix}${categoryStr} ${message}`);
            break;
        case LogLevel.DEBUG:
            console.debug(`${prefix}${categoryStr} ${message}`);
            break;
        default:
            console.log(`${prefix}${categoryStr} ${message}`);
            break;
    }
}

class SpineSkeletonBounds {
    constructor() {
        this.characters = new Map(); // キャラクター名 -> SkeletonBounds情報
        this.debugMode = false;
        this.debugCanvas = null;
        this.initialized = false;
        
        // デバッグ用カラー設定
        this.debugColors = {
            bounds: 'rgba(255, 0, 0, 0.3)',
            boundingBox: 'rgba(0, 255, 0, 0.5)',
            clickPoint: 'rgba(255, 255, 0, 1.0)',
            text: '#ffffff'
        };
        
        log(LogLevel.INFO, 'initialization', 'SpineSkeletonBounds initialized');
    }

    /**
     * Spineキャラクターの境界ボックスシステム初期化
     * @param {string} name - キャラクター名
     * @param {Object} character - Spineキャラクターオブジェクト
     */
    initializeCharacterBounds(name, character) {
        console.log(`🔧 [SkeletonBounds初期化] キャラクター: ${name} - 開始`);
        console.log('🔍 入力キャラクターオブジェクトの検証:', {
            character存在: !!character,
            character_spine存在: !!character?.spine,
            character_spine_skeleton存在: !!character?.spine?.skeleton,
            character_canvas存在: !!character?.canvas,
            spine_skeleton_data存在: !!character?.spine?.skeleton?.data,
            spine_globalAPI存在: !!window.spine,
            spine_SkeletonBounds存在: !!window.spine?.SkeletonBounds
        });
        
        // キャラクターオブジェクトの検証を緩和（spine.skeletonがあれば有効とする）
        if (!character || !character.spine || !character.spine.skeleton) {
            console.error(`❌ [SkeletonBounds初期化失敗] ${name}: 必要なspine.skeletonが不足`);
            log(LogLevel.WARN, 'initialization', `Cannot initialize bounds for ${name}: missing spine.skeleton`);
            return false;
        }

        try {
            console.log(`🏗️ [${name}] spine.SkeletonBoundsインスタンス作成中...`);
            
            if (!window.spine || !window.spine.SkeletonBounds) {
                console.error(`❌ [${name}] spine.SkeletonBoundsクラスが利用できません`);
                throw new Error('spine.SkeletonBounds is not available');
            }
            
            // spine.SkeletonBounds インスタンス作成
            const skeletonBounds = new spine.SkeletonBounds();
            console.log(`✅ [${name}] spine.SkeletonBoundsインスタンス作成成功`);
            
            // 境界ボックス情報をキャラクター情報として保存
            const boundsInfo = {
                skeletonBounds: skeletonBounds,
                character: character,
                lastClickPoint: null,
                attachmentBounds: new Map(), // 部位別境界ボックス
                boundingBoxes: [], // 現在の境界ボックス一覧
                integratedAt: new Date().toISOString(), // 統合日時
                integrationSuccess: true // 統合成功フラグ
            };
            
            console.log(`📦 [${name}] boundsInfo作成完了:`, {
                skeletonBounds: !!boundsInfo.skeletonBounds,
                character: !!boundsInfo.character,
                integratedAt: boundsInfo.integratedAt
            });
            
            // キャラクター登録
            this.characters.set(name, boundsInfo);
            console.log(`✅ [${name}] キャラクター登録完了 - 現在の登録数: ${this.characters.size}`);
            
            // スケルトンを初期ポーズに設定（境界ボックスアタッチメントを確実に設定）
            console.log(`🎯 [${name}] スケルトンを初期ポーズに設定中...`);
            character.spine.skeleton.setToSetupPose();
            console.log(`✅ [${name}] 初期ポーズ設定完了`);
            
            // 初期境界ボックス更新
            console.log(`🔄 [${name}] 初期境界ボックス更新開始...`);
            this.updateBounds(name);
            
            // 更新後の結果確認
            const updatedBoundsInfo = this.characters.get(name);
            console.log(`📊 [${name}] 更新後の境界ボックス状況:`, {
                boundingBoxes数: updatedBoundsInfo?.boundingBoxes?.length || 0,
                attachmentBounds数: updatedBoundsInfo?.attachmentBounds?.size || 0
            });
            
            log(LogLevel.INFO, 'initialization', `SkeletonBounds initialized for character: ${name}`);
            console.log(`✅ [${name}] SkeletonBounds初期化完了`);
            return true;
            
        } catch (error) {
            console.error(`❌ [${name}] SkeletonBounds初期化でエラー発生:`, error);
            console.error(`❌ [${name}] エラーの詳細:`, {
                message: error.message,
                stack: error.stack
            });
            log(LogLevel.ERROR, 'initialization', `Failed to initialize SkeletonBounds for ${name}:`, error);
            return false;
        }
    }

    /**
     * 境界ボックスの動的更新
     * @param {string} name - キャラクター名
     */
    updateBounds(name) {
        console.log(`🔄 [境界ボックス更新] キャラクター: ${name} - 開始`);
        
        const boundsInfo = this.characters.get(name);
        if (!boundsInfo) {
            console.error(`❌ [${name}] boundsInfo が見つかりません - 登録されているキャラクター:`, Array.from(this.characters.keys()));
            log(LogLevel.WARN, 'bounds', `No bounds info found for character: ${name}`);
            return;
        }
        
        console.log(`✅ [${name}] boundsInfo 取得成功:`, {
            skeletonBounds: !!boundsInfo.skeletonBounds,
            character: !!boundsInfo.character,
            currentBoundingBoxes: boundsInfo.boundingBoxes?.length || 0
        });

        const { skeletonBounds, character } = boundsInfo;
        // character.spine.skeletonからskeletonを取得
        const skeleton = character.spine ? character.spine.skeleton : character.skeleton;
        
        if (!skeleton) {
            console.error(`❌ [${name}] skeleton が見つかりません`);
            log(LogLevel.ERROR, 'bounds', `No skeleton found for character: ${name}`);
            return;
        }
        
        console.log(`✅ [${name}] skeleton 取得成功:`, {
            slots数: skeleton.slots.length,
            skeletonName: skeleton.data.name || 'unknown'
        });

        try {
            console.log(`⚙️ [${name}] スケルトンのワールド変換を更新中...`);
            // スケルトンのワールド変換を更新
            skeleton.updateWorldTransform();
            console.log(`✅ [${name}] ワールド変換更新完了`);
            
            console.log(`⚙️ [${name}] SkeletonBounds.update実行中...`);
            // Spine公式API使用：境界ボックスを更新
            skeletonBounds.update(skeleton, true);
            console.log(`✅ [${name}] SkeletonBounds.update完了`);
            
            // バウンディングボックス一覧を取得
            boundsInfo.boundingBoxes = [];
            boundsInfo.attachmentBounds.clear();
            console.log(`🧹 [${name}] 既存の境界ボックス情報をクリア`);
            
            console.log(`🔍 [${name}] スロット走査開始 (${skeleton.slots.length}個のスロット)`);
            
            // スケルトンのスロットを走査して境界ボックスを収集
            for (let i = 0; i < skeleton.slots.length; i++) {
                const slot = skeleton.slots[i];
                const attachment = slot.attachment;
                
                // 全キャラクターの全スロットの詳細情報をログ出力
                const attachmentInfo = {
                    slotIndex: i,
                    slotName: slot.data.name,
                    hasAttachment: !!attachment,
                    attachmentName: attachment ? attachment.name : 'none',
                    attachmentType: attachment ? attachment.type : 'none',
                    attachmentConstructor: attachment ? attachment.constructor.name : 'none',
                    isBoundingBox: attachment ? this.isBoundingBoxAttachment(attachment) : false
                };
                
                // さらに詳細なプロパティ確認
                if (attachment) {
                    attachmentInfo.hasComputeWorldVertices = typeof attachment.computeWorldVertices === 'function';
                    attachmentInfo.hasVertexCount = typeof attachment.vertexCount === 'number';
                    attachmentInfo.worldVerticesLength = attachment.worldVerticesLength;
                    
                    // アタッチメント名にboundingが含まれるかチェック
                    attachmentInfo.nameContainsBounding = attachment.name && attachment.name.toLowerCase().includes('bound');
                    
                    // 全プロパティのキー一覧
                    attachmentInfo.allProperties = Object.getOwnPropertyNames(attachment);
                }
                
                if (attachmentInfo.isBoundingBox || attachmentInfo.hasAttachment) {
                    console.log(`🔍 [${name}] Slot ${i} (${slot.data.name}):`, attachmentInfo);
                    if (name === 'nezumi') {
                        log(LogLevel.DEBUG, 'bounds', `Nezumi slot ${i} (${slot.data.name}):`, attachmentInfo);
                    }
                }
                
                // 境界ボックスかどうかをより確実に判定
                if (attachment && this.isBoundingBoxAttachment(attachment)) {
                    console.log(`🎯 [${name}] バウンディングボックス発見! スロット${i}: ${attachment.name}`);
                    
                    try {
                        // 境界ボックスアタッチメントの座標を取得
                        const vertices = [];
                        attachment.computeWorldVertices(slot, 0, attachment.worldVerticesLength, vertices, 0, 2);
                        
                        const boundingBox = {
                            name: attachment.name,
                            slotName: slot.data.name,
                            vertices: vertices,
                            bounds: this.calculateBounds(vertices)
                        };
                        
                        boundsInfo.boundingBoxes.push(boundingBox);
                        boundsInfo.attachmentBounds.set(attachment.name, boundingBox);
                        
                        console.log(`✅ [${name}] バウンディングボックス登録成功:`, {
                            name: boundingBox.name,
                            slotName: boundingBox.slotName,
                            verticesLength: vertices.length,
                            bounds: boundingBox.bounds
                        });
                        
                    } catch (vertexError) {
                        console.error(`❌ [${name}] バウンディングボックスの座標取得エラー:`, vertexError);
                    }
                }
            }
            
            const finalBoundingBoxCount = boundsInfo.boundingBoxes.length;
            console.log(`📊 [${name}] 境界ボックス更新完了:`, {
                検出数: finalBoundingBoxCount,
                境界ボックス名一覧: boundsInfo.boundingBoxes.map(bb => bb.name),
                attachmentBounds数: boundsInfo.attachmentBounds.size
            });
            
            log(LogLevel.DEBUG, 'bounds', `Updated bounds for ${name}: ${boundsInfo.boundingBoxes.length} bounding boxes found`);
            
            // 詳細ログを出力（全キャラクター対象に拡張）
            log(LogLevel.INFO, 'bounds', `${name} bounds update details:`, {
                totalSlots: skeleton.slots.length,
                boundingBoxesFound: boundsInfo.boundingBoxes.length,
                boundingBoxNames: boundsInfo.boundingBoxes.map(bb => bb.name)
            });
            
            // 全スロットの状態をログ出力
            skeleton.slots.forEach((slot, index) => {
                const attachment = slot.attachment;
                if (attachment) {
                    log(LogLevel.DEBUG, 'bounds', `${name} slot ${index} (${slot.data.name}): ${attachment.name} (type: ${attachment.type})`);
                }
            });
            
        } catch (error) {
            console.error(`❌ [${name}] 境界ボックス更新でエラー発生:`, error);
            console.error(`❌ [${name}] エラーの詳細:`, {
                message: error.message,
                stack: error.stack
            });
            log(LogLevel.WARN, 'bounds', `Failed to update bounds for ${name}: ${error.message}`);
            // エラーが発生してもシステムを停止しない
        }
    }

    /**
     * 頂点配列から境界を計算
     * @param {number[]} vertices - 頂点座標配列 [x1, y1, x2, y2, ...]
     * @return {Object} 境界情報 {minX, minY, maxX, maxY, width, height}
     */
    calculateBounds(vertices) {
        if (vertices.length < 4) return null;
        
        let minX = vertices[0], maxX = vertices[0];
        let minY = vertices[1], maxY = vertices[1];
        
        for (let i = 2; i < vertices.length; i += 2) {
            const x = vertices[i];
            const y = vertices[i + 1];
            
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
        
        return {
            minX, minY, maxX, maxY,
            width: maxX - minX,
            height: maxY - minY,
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2
        };
    }

    /**
     * Canvas座標をSpine内部座標に変換
     * @param {string} name - キャラクター名
     * @param {number} canvasX - Canvas上のX座標
     * @param {number} canvasY - Canvas上のY座標
     * @return {Object} Spine座標 {x, y} または null
     */
    canvasToSpineCoords(name, canvasX, canvasY) {
        const boundsInfo = this.characters.get(name);
        if (!boundsInfo) return null;

        const { character } = boundsInfo;
        const { canvas, skeleton } = character;
        
        if (!canvas || !skeleton) return null;

        try {
            // Canvas要素の境界を取得
            const canvasRect = canvas.getBoundingClientRect();
            
            // Canvas相対座標を計算
            const relativeX = canvasX - canvasRect.left;
            const relativeY = canvasY - canvasRect.top;
            
            // Canvas内部座標系に正規化（0-canvas.width, 0-canvas.height）
            const normalizedX = (relativeX / canvasRect.width) * canvas.width;
            const normalizedY = (relativeY / canvasRect.height) * canvas.height;
            
            // Spine座標系に変換（Skeletonの位置とスケールを考慮）
            const spineX = (normalizedX - skeleton.x) / skeleton.scaleX;
            const spineY = (canvas.height - normalizedY - skeleton.y) / skeleton.scaleY; // Y軸反転
            
            log(LogLevel.DEBUG, 'coords', `Coordinate conversion for ${name}:`, {
                canvas: { x: canvasX, y: canvasY },
                relative: { x: relativeX, y: relativeY },
                normalized: { x: normalizedX, y: normalizedY },
                spine: { x: spineX, y: spineY }
            });
            
            return { x: spineX, y: spineY };
            
        } catch (error) {
            log(LogLevel.ERROR, 'coords', `Coordinate conversion failed for ${name}:`, error);
            return null;
        }
    }

    /**
     * 指定座標での境界ボックス判定
     * @param {string} name - キャラクター名
     * @param {number} canvasX - Canvas上のX座標
     * @param {number} canvasY - Canvas上のY座標
     * @return {Object|null} ヒットした境界ボックス情報または null
     */
    checkBoundsHit(name, canvasX, canvasY) {
        const boundsInfo = this.characters.get(name);
        if (!boundsInfo) {
            log(LogLevel.WARN, 'bounds', `No bounds info for character: ${name}`);
            return null;
        }

        // 座標変換
        const spineCoords = this.canvasToSpineCoords(name, canvasX, canvasY);
        if (!spineCoords) return null;

        // 最新の境界ボックス情報に更新
        this.updateBounds(name);

        // 境界ボックスでの判定
        const { skeletonBounds } = boundsInfo;
        
        try {
            // Spine公式API使用：点が境界内にあるかチェック
            const isContained = skeletonBounds.containsPoint(spineCoords.x, spineCoords.y);
            
            if (isContained) {
                // どの境界ボックスにヒットしたかを詳細判定
                const hitBoundingBox = this.findHitBoundingBox(boundsInfo, spineCoords.x, spineCoords.y);
                
                // クリック位置を記録
                boundsInfo.lastClickPoint = { 
                    canvas: { x: canvasX, y: canvasY },
                    spine: spineCoords 
                };
                
                const result = {
                    hit: true,
                    characterName: name,
                    spineCoords: spineCoords,
                    boundingBox: hitBoundingBox,
                    timestamp: Date.now()
                };
                
                log(LogLevel.INFO, 'bounds', `Bounds hit detected for ${name}:`, result);
                return result;
                
            } else {
                log(LogLevel.DEBUG, 'bounds', `No bounds hit for ${name} at spine coords:`, spineCoords);
                return null;
            }
            
        } catch (error) {
            log(LogLevel.ERROR, 'bounds', `Bounds hit check failed for ${name}:`, error);
            return null;
        }
    }

    /**
     * 特定の境界ボックスでの詳細ヒット判定
     * @param {Object} boundsInfo - 境界ボックス情報
     * @param {number} spineX - Spine座標X
     * @param {number} spineY - Spine座標Y
     * @return {Object|null} ヒットした境界ボックス
     */
    findHitBoundingBox(boundsInfo, spineX, spineY) {
        const { boundingBoxes } = boundsInfo;
        
        // 全境界ボックスをチェックして最適なヒットを探す
        for (const boundingBox of boundingBoxes) {
            if (this.pointInPolygon(spineX, spineY, boundingBox.vertices)) {
                return boundingBox;
            }
        }
        
        // 特定の境界ボックスが見つからない場合は、最初の境界ボックスを返す
        return boundingBoxes.length > 0 ? boundingBoxes[0] : null;
    }

    /**
     * 多角形内の点判定
     * @param {number} x - 点のX座標
     * @param {number} y - 点のY座標
     * @param {number[]} vertices - 多角形の頂点配列 [x1, y1, x2, y2, ...]
     * @return {boolean} 点が多角形内にあるかどうか
     */
    pointInPolygon(x, y, vertices) {
        if (vertices.length < 6) return false; // 最低3つの点が必要
        
        let inside = false;
        const vertexCount = vertices.length / 2;
        
        for (let i = 0, j = vertexCount - 1; i < vertexCount; j = i++) {
            const xi = vertices[i * 2];
            const yi = vertices[i * 2 + 1];
            const xj = vertices[j * 2];
            const yj = vertices[j * 2 + 1];
            
            if (((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        
        return inside;
    }

    /**
     * 部位名に基づくアニメーション実行
     * @param {string} characterName - キャラクター名
     * @param {Object} hitResult - ヒット判定結果
     */
    executePartAnimation(characterName, hitResult) {
        if (!hitResult || !hitResult.boundingBox) return;
        
        const partName = hitResult.boundingBox.name;
        let animationName = 'taiki'; // デフォルトアニメーション
        
        // 部位名からアニメーション名を推定
        if (partName.includes('head') || partName.includes('atama')) {
            animationName = 'syutugen'; // 喜びアニメーション
        } else if (partName.includes('chest') || partName.includes('mune')) {
            animationName = 'yarare'; // 怒りアニメーション
        } else if (partName.includes('hand') || partName.includes('te')) {
            animationName = 'syutugen'; // 握手アニメーション
        } else if (partName.includes('foot') || partName.includes('ashi')) {
            animationName = 'yarare'; // 痛がりアニメーション
        }
        
        // アニメーション実行
        if (window.spineManager && window.spineManager.animationController) {
            log(LogLevel.INFO, 'animation', `Playing part-specific animation for ${characterName}: ${animationName} (part: ${partName})`);
            window.spineManager.animationController.playSequence(characterName, [animationName, 'taiki']);
        }
    }

    /**
     * デバッグモードの切り替え
     * @param {boolean} enable - デバッグモードを有効にするか
     */
    setDebugMode(enable) {
        this.debugMode = enable;
        
        if (enable && !this.debugCanvas) {
            this.createDebugCanvas();
        } else if (!enable && this.debugCanvas) {
            this.destroyDebugCanvas();
        }
        
        log(LogLevel.INFO, 'debug', `Debug mode ${enable ? 'enabled' : 'disabled'}`);
    }

    /**
     * デバッグモードの切り替え（トグル）
     * @returns {boolean} - 切り替え後のデバッグモード状態
     */
    toggleBoundsDebug() {
        const newState = !this.debugMode;
        this.setDebugMode(newState);
        return newState;
    }

    /**
     * デバッグ用Canvasの作成
     */
    createDebugCanvas() {
        this.debugCanvas = document.createElement('canvas');
        this.debugCanvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 999999;
            border: 2px solid red;
            background: transparent;
        `;
        
        this.debugCanvas.width = window.innerWidth;
        this.debugCanvas.height = window.innerHeight;
        
        document.body.appendChild(this.debugCanvas);
        
        // リサイズイベント
        window.addEventListener('resize', () => {
            if (this.debugCanvas) {
                this.debugCanvas.width = window.innerWidth;
                this.debugCanvas.height = window.innerHeight;
            }
        });
        
        log(LogLevel.INFO, 'debug', 'Debug canvas created');
    }

    /**
     * 境界ボックスアタッチメントかどうかを判定
     * @param {Object} attachment - アタッチメント
     * @returns {boolean} 境界ボックスの場合true
     */
    isBoundingBoxAttachment(attachment) {
        // 複数の判定方法でBoundingBoxを確認
        if (!attachment) return false;
        
        // 1. typeプロパティで判定（文字列）
        if (attachment.type === 'boundingbox') return true;
        
        // 2. コンストラクター名で判定
        if (attachment.constructor && attachment.constructor.name === 'BoundingBoxAttachment') return true;
        
        // 3. computeWorldVerticesメソッドの存在とvertexCountプロパティで判定
        if (attachment.computeWorldVertices && typeof attachment.vertexCount === 'number') return true;
        
        // 4. Spine WebGL APIでのtype番号判定（安全な方法）
        if (typeof attachment.type === 'number') {
            // BoundingBoxのtype値は通常4または5
            // ただし、これは不安定なので最後の手段
            try {
                if (window.spine && window.spine.AttachmentType && typeof window.spine.AttachmentType.BoundingBox !== 'undefined') {
                    return attachment.type === window.spine.AttachmentType.BoundingBox;
                }
            } catch (e) {
                // AttachmentTypeが利用できない場合は無視
                log(LogLevel.DEBUG, 'bounds', 'AttachmentType.BoundingBox not available, using alternative detection');
            }
        }
        
        return false;
    }
    
    /**
     * ねずみのバウンディングボックス詳細診断
     * デバッグ用のコンソール実行関数
     */
    debugNezumiBoundingBoxes() {
        console.log('🔍 ねずみのバウンディングボックス詳細診断開始');
        
        // まず全登録キャラクターを確認
        console.log('📋 現在登録されているキャラクター一覧:');
        console.log('   キャラクター数:', this.characters.size);
        this.characters.forEach((info, name) => {
            console.log(`   - ${name}: ${info ? '✅ 存在' : '❌ null'}`);
        });
        
        const nezumiInfo = this.characters.get('nezumi');
        if (!nezumiInfo) {
            console.error('❌ ねずみのキャラクター情報が見つかりません');
            console.log('💡 登録されているキーの確認:', Array.from(this.characters.keys()));
            return;
        }
        
        const skeleton = nezumiInfo.character.spine ? nezumiInfo.character.spine.skeleton : nezumiInfo.character.skeleton;
        if (!skeleton) {
            console.error('❌ ねずみのスケルトンが見つかりません');
            return;
        }
        
        console.log(`📊 ねずみの基本情報:`);
        console.log(`  - スロット数: ${skeleton.slots.length}`);
        console.log(`  - スケルトン名: ${skeleton.data.name || 'unknown'}`);
        
        // 全スロットをチェック
        let boundingBoxCount = 0;
        skeleton.slots.forEach((slot, index) => {
            const attachment = slot.attachment;
            if (attachment) {
                const isBoundingBox = this.isBoundingBoxAttachment(attachment);
                console.log(`  [${index}] スロット: ${slot.data.name}`);
                console.log(`      アタッチメント: ${attachment.name}`);
                console.log(`      タイプ: ${attachment.type} (${typeof attachment.type})`);
                console.log(`      コンストラクター: ${attachment.constructor.name}`);
                console.log(`      バウンディングボックス判定: ${isBoundingBox}`);
                
                if (isBoundingBox) {
                    boundingBoxCount++;
                    console.log(`      ✅ バウンディングボックス検出!`);
                }
            }
        });
        
        console.log(`📈 結果: ${boundingBoxCount}個のバウンディングボックスを検出`);
        console.log(`現在の登録済みバウンディングボックス数: ${nezumiInfo.boundingBoxes.length}`);
        
        return {
            totalSlots: skeleton.slots.length,
            boundingBoxCount: boundingBoxCount,
            registeredBoundingBoxes: nezumiInfo.boundingBoxes.length
        };
    }

    /**
     * デバッグ用Canvasの削除
     */
    destroyDebugCanvas() {
        if (this.debugCanvas) {
            this.debugCanvas.remove();
            this.debugCanvas = null;
        }
        
        log(LogLevel.INFO, 'debug', 'Debug canvas destroyed');
    }

    /**
     * 境界ボックスのデバッグ表示
     * @param {string} name - キャラクター名
     */
    debugDrawBounds(name) {
        if (!this.debugMode || !this.debugCanvas) return;
        
        const boundsInfo = this.characters.get(name);
        if (!boundsInfo) return;
        
        const ctx = this.debugCanvas.getContext('2d');
        const { character } = boundsInfo;
        const { canvas } = character;
        
        if (!canvas) return;
        
        // Canvas位置を取得
        const canvasRect = canvas.getBoundingClientRect();
        
        // Canvas全体をクリア
        ctx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
        
        // 境界ボックスを描画
        ctx.strokeStyle = this.debugColors.bounds;
        ctx.lineWidth = 2;
        
        log(LogLevel.DEBUG, 'debug', `Drawing ${boundsInfo.boundingBoxes.length} bounding boxes for ${name}`);
        
        boundsInfo.boundingBoxes.forEach((boundingBox, index) => {
            const { vertices, bounds } = boundingBox;
            
            if (vertices.length >= 6) {
                ctx.beginPath();
                
                // 多角形描画
                for (let i = 0; i < vertices.length; i += 2) {
                    const x = canvasRect.left + (vertices[i] + character.skeleton.x) * canvasRect.width / canvas.width;
                    const y = canvasRect.top + canvasRect.height - (vertices[i + 1] + character.skeleton.y) * canvasRect.height / canvas.height;
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                
                ctx.closePath();
                ctx.stroke();
                
                // 境界ボックス名を表示
                if (bounds) {
                    const textX = canvasRect.left + (bounds.centerX + character.skeleton.x) * canvasRect.width / canvas.width;
                    const textY = canvasRect.top + canvasRect.height - (bounds.centerY + character.skeleton.y) * canvasRect.height / canvas.height;
                    
                    ctx.fillStyle = this.debugColors.text;
                    ctx.font = '12px Arial';
                    ctx.fillText(boundingBox.name, textX, textY);
                }
            }
        });
        
        // 最後のクリック点を表示
        if (boundsInfo.lastClickPoint) {
            const { canvas: clickPoint } = boundsInfo.lastClickPoint;
            ctx.fillStyle = this.debugColors.clickPoint;
            ctx.beginPath();
            ctx.arc(clickPoint.x, clickPoint.y, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    /**
     * 全キャラクターの境界ボックスを更新
     */
    updateAllBounds() {
        this.characters.forEach((boundsInfo, name) => {
            this.updateBounds(name);
        });
    }

    /**
     * デバッグ情報の出力
     * @param {string} name - キャラクター名
     */
    debugInfo(name) {
        const boundsInfo = this.characters.get(name);
        if (!boundsInfo) {
            console.log(`❌ No bounds info for character: ${name}`);
            return;
        }
        
        console.group(`📊 SkeletonBounds Debug Info for ${name}`);
        console.log('📦 Bounding boxes:', boundsInfo.boundingBoxes.length);
        
        boundsInfo.boundingBoxes.forEach((bb, index) => {
            console.log(`  ${index + 1}. ${bb.name} (slot: ${bb.slotName})`);
            console.log(`     Bounds:`, bb.bounds);
            console.log(`     Vertices count:`, bb.vertices.length / 2);
        });
        
        if (boundsInfo.lastClickPoint) {
            console.log('🎯 Last click point:', boundsInfo.lastClickPoint);
        }
        
        console.groupEnd();
    }

    /**
     * 全登録キャラクター情報の表示
     * デバッグ用のコンソール実行関数
     */
    debugAllCharacters() {
        console.log('📋 SpineSkeletonBounds - 全キャラクター情報');
        console.log(`キャラクター数: ${this.characters.size}`);
        
        if (this.characters.size === 0) {
            console.log('⚠️ 登録されているキャラクターがありません');
            return;
        }
        
        this.characters.forEach((info, characterName) => {
            console.group(`🎭 キャラクター: ${characterName}`);
            console.log('基本情報:', {
                存在: info ? '✅' : '❌',
                スケルトンBounds: info?.skeletonBounds ? '✅' : '❌',
                キャラクターデータ: info?.character ? '✅' : '❌',
                バウンディングボックス数: info?.boundingBoxes?.length || 0
            });
            
            if (info?.character) {
                const skeleton = info.character.spine ? info.character.spine.skeleton : info.character.skeleton;
                console.log('スケルトン情報:', {
                    スケルトン存在: skeleton ? '✅' : '❌',
                    スロット数: skeleton?.slots?.length || 0,
                    スケルトン名: skeleton?.data?.name || 'unknown'
                });
            }
            
            if (info?.boundingBoxes) {
                console.log('バウンディングボックス一覧:');
                info.boundingBoxes.forEach((bb, index) => {
                    console.log(`  [${index}] ${bb.name} (スロット: ${bb.slotName})`);
                });
            }
            
            console.groupEnd();
        });
    }

    /**
     * キャラクター統合状況の確認
     * @param {string} characterName - 確認するキャラクター名（省略時は全キャラクター）
     */
    debugIntegrationStatus(characterName = null) {
        console.log('🔗 キャラクター統合状況の確認');
        
        if (characterName) {
            const info = this.characters.get(characterName);
            console.log(`キャラクター "${characterName}":`, {
                登録済み: !!info,
                統合日時: info?.integratedAt || '未統合',
                統合成功: info?.integrationSuccess || false
            });
            return !!info;
        } else {
            this.characters.forEach((info, name) => {
                console.log(`${name}:`, {
                    登録: '✅',
                    統合日時: info.integratedAt || '未統合',
                    統合成功: info.integrationSuccess || false
                });
            });
        }
    }

    /**
     * システムのクリーンアップ
     */
    cleanup() {
        this.characters.clear();
        this.destroyDebugCanvas();
        this.initialized = false;
        
        log(LogLevel.INFO, 'cleanup', 'SpineSkeletonBounds cleanup completed');
    }
}

// グローバルインスタンス
window.spineSkeletonBounds = new SpineSkeletonBounds();

// デバッグ関数をグローバルアクセス可能にする
window.debugNezumiBounds = function() {
    if (window.spineSkeletonBounds && window.spineSkeletonBounds.debugNezumiBoundingBoxes) {
        return window.spineSkeletonBounds.debugNezumiBoundingBoxes();
    }
    console.error('❌ spineSkeletonBoundsまたはdebugNezumiBoundingBoxes関数が利用できません');
};

// 全キャラクター情報表示のグローバル関数
window.debugAllCharacters = function() {
    if (window.spineSkeletonBounds && window.spineSkeletonBounds.debugAllCharacters) {
        return window.spineSkeletonBounds.debugAllCharacters();
    }
    console.error('❌ spineSkeletonBoundsまたはdebugAllCharacters関数が利用できません');
};

// キャラクター統合状況確認のグローバル関数
window.debugIntegrationStatus = function(characterName = null) {
    if (window.spineSkeletonBounds && window.spineSkeletonBounds.debugIntegrationStatus) {
        return window.spineSkeletonBounds.debugIntegrationStatus(characterName);
    }
    console.error('❌ spineSkeletonBoundsまたはdebugIntegrationStatus関数が利用できません');
};

log(LogLevel.INFO, 'initialization', 'SpineSkeletonBounds module loaded');