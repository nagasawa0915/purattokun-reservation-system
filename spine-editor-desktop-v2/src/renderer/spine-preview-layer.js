/**
 * Spine Preview Layer Module
 * プレビューエリアに重なるSpine専用レイヤーを管理
 * 実際のSpine WebGLキャラクターを表示・編集
 */

import { Utils } from './utils.js';


/**
 * 座標系スワップマネージャー（4層→2層削減）
 * Spine WebGL座標系対応強化版
 * 過去の成功実装：編集時はシンプル座標系、保存時は元座標系に復元
 */
class CoordinateSwapManager {
    constructor() {
        this.backup = new Map(); // 元座標系のバックアップ
        this.isSwapped = new Map(); // スワップ状態管理
        this.debugMode = false; // デバッグモード（開発時のみ）
    }
    
    /**
     * 編集開始：複雑座標 → シンプル座標（競合排除の核心）
     * @param {string} characterId - キャラクターID
     * @param {Element} overlayElement - オーバーレイ要素
     * @param {object} spineCharacter - Spineキャラクターオブジェクト
     */
    enterEditMode(characterId, overlayElement, spineCharacter) {
        try {
            if (!this.validateInputs(characterId, overlayElement, spineCharacter)) {
                return false;
            }
            
            // 既にスワップ状態の場合はスキップ
            if (this.isSwapped.get(characterId)) {
                if (this.debugMode) console.log(`⚠️ 既にスワップ状態: ${characterId}`);
                return true;
            }
            
            // 元の座標系をバックアップ
            this.backup.set(characterId, {
                // オーバーレイ要素の元座標
                overlayLeft: overlayElement.style.left,
                overlayTop: overlayElement.style.top,
                overlayTransform: overlayElement.style.transform,
                // Spineキャラクターの元座標（重要）
                spineX: spineCharacter.skeleton.x,
                spineY: spineCharacter.skeleton.y,
                spineScaleX: spineCharacter.skeleton.scaleX,
                spineScaleY: spineCharacter.skeleton.scaleY
            });
            
            // 実際の描画位置を取得（DOM座標系）
            const rect = overlayElement.getBoundingClientRect();
            const containerRect = overlayElement.parentElement.getBoundingClientRect();
            
            // シンプル絶対座標に変換（競合排除）
            const simpleX = rect.left - containerRect.left;
            const simpleY = rect.top - containerRect.top;
            
            if (this.debugMode) {
                console.log(`🔄 座標系スワップ開始: ${characterId}`);
                console.log(`  元座標: overlay(${overlayElement.style.left}, ${overlayElement.style.top})`);
                console.log(`  Spine座標: (${spineCharacter.skeleton.x.toFixed(1)}, ${spineCharacter.skeleton.y.toFixed(1)})`);
                console.log(`  変換後: (${simpleX.toFixed(1)}, ${simpleY.toFixed(1)})`);
            }
            
            // オーバーレイをシンプル座標系に変換
            overlayElement.style.left = `${simpleX}px`;
            overlayElement.style.top = `${simpleY}px`;
            overlayElement.style.transform = 'translate(-50%, -50%)'; // 統一変換のみ
            
            this.isSwapped.set(characterId, true);
            
            if (this.debugMode) {
                console.log(`✅ 座標系スワップ完了: ${characterId}`);
            }
            
            return true;
            
        } catch (error) {
            console.error(`❌ 座標系スワップ開始エラー: ${characterId}`, error);
            return false;
        }
    }
    
    /**
     * 編集終了：シンプル座標 → 元座標系（互換性確保）
     * @param {string} characterId - キャラクターID
     * @param {Element} overlayElement - オーバーレイ要素
     * @param {object} spineCharacter - Spineキャラクターオブジェクト
     */
    exitEditMode(characterId, overlayElement, spineCharacter) {
        try {
            if (!this.validateInputs(characterId, overlayElement, spineCharacter)) {
                return false;
            }
            
            if (!this.isSwapped.get(characterId)) {
                if (this.debugMode) console.log(`⚠️ スワップ状態ではありません: ${characterId}`);
                return true;
            }
            
            const backup = this.backup.get(characterId);
            if (!backup) {
                console.error(`❌ バックアップデータが見つかりません: ${characterId}`);
                return false;
            }
            
            if (this.debugMode) {
                console.log(`🔄 座標系復元開始: ${characterId}`);
                console.log(`  現在: overlay(${overlayElement.style.left}, ${overlayElement.style.top})`);
                console.log(`  復元先: overlay(${backup.overlayLeft}, ${backup.overlayTop})`);
                console.log(`  Spine座標: (${backup.spineX.toFixed(1)}, ${backup.spineY.toFixed(1)})`);
            }
            
            // オーバーレイ要素を元の座標系に復元
            overlayElement.style.left = backup.overlayLeft;
            overlayElement.style.top = backup.overlayTop;
            overlayElement.style.transform = backup.overlayTransform;
            
            // Spine座標も復元（重要：編集中の変更を保持）
            // 注意：ここでは現在のSpine座標を保持し、座標系のみ復元
            
            this.isSwapped.delete(characterId);
            this.backup.delete(characterId);
            
            if (this.debugMode) {
                console.log(`✅ 座標系復元完了: ${characterId}`);
            }
            
            return true;
            
        } catch (error) {
            console.error(`❌ 座標系復元エラー: ${characterId}`, error);
            return false;
        }
    }
    
    /**
     * 現在編集中かどうかを確認
     * @param {string} characterId - キャラクターID
     * @returns {boolean} 編集中かどうか
     */
    isInEditMode(characterId) {
        return this.isSwapped.get(characterId) || false;
    }
    
    /**
     * 緊急復元：全ての座標系スワップを強制解除
     * @param {Map} characterMap - キャラクターマップ
     * @param {Map} overlayMap - オーバーレイマップ
     */
    emergencyRestore(characterMap, overlayMap) {
        try {
            console.log(`🚨 緊急復元実行: ${this.isSwapped.size}個のスワップを復元`);
            
            this.isSwapped.forEach((_, characterId) => {
                const character = characterMap.get(characterId);
                const overlay = overlayMap.get(characterId);
                
                if (character && overlay) {
                    this.exitEditMode(characterId, overlay, character);
                } else {
                    console.warn(`⚠️ 緊急復元対象が見つかりません: ${characterId}`);
                    // 強制クリア
                    this.isSwapped.delete(characterId);
                    this.backup.delete(characterId);
                }
            });
            
            console.log(`✅ 緊急復元完了`);
            
        } catch (error) {
            console.error(`❌ 緊急復元エラー:`, error);
            // 最終手段：全クリア
            this.clearAll();
        }
    }
    
    /**
     * 全ての座標系スワップを解除
     */
    clearAll() {
        const count = this.isSwapped.size;
        this.isSwapped.clear();
        this.backup.clear();
        
        if (this.debugMode && count > 0) {
            console.log(`🗑️ 座標系スワップ全クリア: ${count}個`);
        }
    }
    
    /**
     * 入力値検証
     * @private
     */
    validateInputs(characterId, overlayElement, spineCharacter) {
        if (!characterId) {
            console.error('❌ CharacterID未指定');
            return false;
        }
        
        if (!overlayElement) {
            console.error(`❌ OverlayElement未指定: ${characterId}`);
            return false;
        }
        
        if (!spineCharacter || !spineCharacter.skeleton) {
            console.error(`❌ SpineCharacter/Skeleton未指定: ${characterId}`);
            return false;
        }
        
        return true;
    }
    
    /**
     * デバッグモード設定
     * @param {boolean} enabled - デバッグモード有効/無効
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`🔧 座標系スワップデバッグモード: ${enabled ? '有効' : '無効'}`);
    }
    
    /**
     * 現在の状態を取得（デバッグ用）
     */
    getStatus() {
        return {
            swappedCount: this.isSwapped.size,
            backupCount: this.backup.size,
            swappedIds: Array.from(this.isSwapped.keys()),
            debugMode: this.debugMode
        };
    }
}

export class SpinePreviewLayer {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.context = null;
        this.renderer = null;
        this.characters = new Map();
        this.spineLoaded = false;
        this.isRenderingActive = false;
        
        // ドラッグ&ドロップ機能用プロパティ
        this.isDragging = false;
        this.selectedCharacterId = null;
        this.dragStartPoint = { x: 0, y: 0 };
        
        // リサイズ機能用ドラッグ状態管理
        this.dragState = {
            operation: null,        // null | 'move' | 'resize-corner'
            activeHandle: null,     // リサイズ時のアクティブハンドル要素
            resizeData: {           // リサイズ開始時のデータ
                startRect: null,    // 開始時の要素矩形
                position: null,     // ハンドル位置 ('nw', 'ne', 'sw', 'se')
                modifiers: null     // 修飾キー状態
            }
        };
        
        // Phase 2: 視覚的フィードバック機能用プロパティ
        this.hoveredCharacterId = null;
        this.visualOverlays = new Map(); // キャラクター選択状態表示用
        
        // 🎯 座標系スワップ技術（4層→2層削減）
        this.coordinateSwap = new CoordinateSwapManager();
        
        // 🔧 オフセット補正システム
        this.visualOffset = { x: 0, y: 0 }; // 視覚的ズレ補正値
        
        // 🔧 バインド済みイベントハンドラー（参照一致確保）
        this.boundHandleMouseDown = this.handleMouseDown.bind(this);
        this.boundHandleMouseMove = this.handleMouseMove.bind(this);
        this.boundHandleMouseUp = this.handleMouseUp.bind(this);
        
    }

    /**
     * Spine専用レイヤーを初期化
     * @param {Element} previewContainer - プレビューコンテナ要素
     */
    async initialize(previewContainer) {
        if (!previewContainer) {
            console.error('❌ Preview container not found');
            return false;
        }

        this.container = previewContainer;
        
        try {
            // Spine WebGL読み込み
            await this.loadSpineWebGL();
            
            // Canvasレイヤー作成
            this.createCanvasLayer();
            
            // Spine初期化
            this.initializeSpineRenderer();
            
            this.spineLoaded = true;
            
            // 🔧 デバッグ用グローバルアクセス（開発モード限定）
            if (Utils.isDevelopmentMode()) {
                window.spinePreviewLayer = this;
                
                // 🔧 よくあるオフセットパターンの便利メソッド
                window.fixRightUpOffset = (rightPx = 25, upPx = 15) => {
                    this.setVisualOffset(-rightPx, -upPx);
                };
                
                window.resetOffset = () => {
                    this.setVisualOffset(0, 0);
                };
                
                // 🔧 座標系スワップデバッグコントロール
                window.enableCoordinateSwapDebug = () => {
                    this.coordinateSwap.setDebugMode(true);
                };
                
                window.disableCoordinateSwapDebug = () => {
                    this.coordinateSwap.setDebugMode(false);
                };
                
                window.getCoordinateSwapStatus = () => {
                    const status = this.coordinateSwap.getStatus();
                    console.log('🔧 座標系スワップ状態:', status);
                    return status;
                };
                
                // 🚨 緊急復元機能
                window.emergencyRestoreCoordinates = () => {
                    console.log('🚨 座標系緊急復元を実行します...');
                    this.coordinateSwap.emergencyRestore(this.characters, this.visualOverlays);
                };
                
                // 🔧 バウンディングボックス用デバッグコマンド
                window.debugBoundingBox = () => {
                    const status = {
                        isDragging: this.isDragging,
                        operation: this.dragState.operation,
                        selectedId: this.selectedCharacterId,
                        activeHandle: this.dragState.activeHandle?.dataset?.position,
                        overlayCount: this.visualOverlays.size,
                        coordinateSwapStatus: this.coordinateSwap.getStatus()
                    };
                    console.log('🔧 バウンディングボックス状態:', status);
                    return status;
                };
                
                // 🚨 緊急ドラッグ停止
                window.emergencyStopDragging = () => {
                    console.log('🚨 緊急ドラッグ停止を実行します...');
                    this.emergencyStopDragging();
                };
                
                // 🧪 リサイズテスト機能
                window.testBoundingBoxResize = (deltaX = 50, deltaY = 50) => {
                    if (!this.selectedCharacterId) {
                        console.log('⚠️ テスト用にキャラクターを選択してください');
                        return;
                    }
                    console.log(`🧪 リサイズテスト実行: delta(${deltaX}, ${deltaY})`);
                    const modifiers = { shift: false, ctrl: false, alt: false, meta: false };
                    this.performCornerResize(deltaX, deltaY, modifiers);
                };
                
                // 🔍 座標レイヤー診断システム（簡易版）
                window.diagnoseCoordinateLayers = (clientX, clientY) => {
                    const rect = this.canvas.getBoundingClientRect();
                    const canvasDomX = clientX - rect.left;
                    const canvasDomY = clientY - rect.top;
                    const spineX = canvasDomX;
                    const spineY = this.canvas.height - canvasDomY;
                    
                    console.log(`🗺️ Mouse: (${clientX}, ${clientY}) → Canvas: (${canvasDomX.toFixed(1)}, ${canvasDomY.toFixed(1)}) → Spine: (${spineX.toFixed(1)}, ${spineY.toFixed(1)})`);
                };
            }
            
            // 🔍 自動マウス位置診断システム（開発モード限定）
            if (Utils.isDevelopmentMode()) {
                window.diagnoseCurrentMousePosition = () => {
                    console.log(`🎯 マウスをクリックして座標診断を開始してください...`);
                    
                    const handleClick = (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        
                        // 一度だけ実行してイベント削除
                        document.removeEventListener('click', handleClick, true);
                        
                        // 診断実行
                        window.diagnoseCoordinateLayers(event.clientX, event.clientY);
                        
                        console.log(`✅ 診断完了！マウス位置: (${event.clientX}, ${event.clientY})`);
                    };
                    
                    // 次回クリックで診断実行
                    document.addEventListener('click', handleClick, true);
                };
            }
            
            // 🔧 デバッグモードコントロール（常時利用可能 - デスクトップアプリ対応）
            window.enableSpineDebugMode = () => {
                window.spineDebugMode = true;
                console.log(`🔍 Spineデバッグモード: 有効`);
                console.log(`📊 開発モード判定: ${Utils.isDevelopmentMode()}`);
            };
            
            window.disableSpineDebugMode = () => {
                window.spineDebugMode = false;
                console.log(`🔇 Spineデバッグモード: 無効`);
                console.log(`📊 開発モード判定: ${Utils.isDevelopmentMode()}`);
            };
            
            // 🔍 キャラクター一覧表示（常時利用可能）
            window.listAllCharacters = () => {
                console.log(`📊 登録キャラクター一覧 (${this.characters.size}体):`);
                this.characters.forEach((character, characterId) => {
                    console.log(`👾 ${character.name}(${characterId}):`);
                    console.log(`  - Spine座標: (${character.skeleton?.x?.toFixed?.(1) || 'N/A'}, ${character.skeleton?.y?.toFixed?.(1) || 'N/A'})`);
                    console.log(`  - スケール: ${character.scale || 'N/A'}`);
                    console.log(`  - skeleton状態: ${!!character.skeleton}`);
                });
            };
            
            // 🚀 デスクトップアプリ専用デバッグ機能起動（開発モード判定をバイパス）
            if (window.electronAPI || window.process?.type === 'renderer' || navigator.userAgent.includes('Electron')) {
                // 🔧 デスクトップアプリでは常にデバッグ機能を利用可能にする
                window.spinePreviewLayer = this;
                
                // 🔧 基本デバッグ関数（デスクトップアプリ用）
                window.fixRightUpOffset = (rightPx = 25, upPx = 15) => {
                    this.setVisualOffset(-rightPx, -upPx);
                };
                
                window.resetOffset = () => {
                    this.setVisualOffset(0, 0);
                };
                
                window.enableCoordinateSwapDebug = () => {
                    this.coordinateSwap.setDebugMode(true);
                };
                
                window.disableCoordinateSwapDebug = () => {
                    this.coordinateSwap.setDebugMode(false);
                };
                
                window.getCoordinateSwapStatus = () => {
                    const status = this.coordinateSwap.getStatus();
                    console.log('🔧 座標系スワップ状態:', status);
                    return status;
                };
                
                window.debugBoundingBox = () => {
                    const status = {
                        isDragging: this.isDragging,
                        operation: this.dragState.operation,
                        selectedId: this.selectedCharacterId,
                        activeHandle: this.dragState.activeHandle?.dataset?.position,
                        overlayCount: this.visualOverlays.size,
                        coordinateSwapStatus: this.coordinateSwap.getStatus()
                    };
                    console.log('🔧 バウンディングボックス状態:', status);
                    return status;
                };
                
                // 🔍 座標レイヤー診断システム（デスクトップアプリ用）
                window.diagnoseCoordinateLayers = (clientX, clientY) => {
                    const rect = this.canvas.getBoundingClientRect();
                    const canvasDomX = clientX - rect.left;
                    const canvasDomY = clientY - rect.top;
                    const spineX = canvasDomX;
                    const spineY = this.canvas.height - canvasDomY;
                    
                    console.log(`🗺️ Mouse: (${clientX}, ${clientY}) → Canvas: (${canvasDomX.toFixed(1)}, ${canvasDomY.toFixed(1)}) → Spine: (${spineX.toFixed(1)}, ${spineY.toFixed(1)})`);
                };
                
                console.log('🖥️ デスクトップアプリ向けデバッグ機能が有効になりました');
                console.log('🔧 利用可能なコマンド:');
                console.log('  - window.enableSpineDebugMode() // デバッグモードON');
                console.log('  - window.listAllCharacters() // キャラクター一覧');
                console.log('  - window.diagnoseCoordinateLayers(x, y) // 座標診断');
                console.log('  - window.fixRightUpOffset(25, 15) // オフセット修正');
            }
            
            if (Utils.isDevelopmentMode()) {
                console.log('✅ SpinePreviewLayer初期化完了');
                console.log('🔧 デバッグコマンド使用可能:');
                console.log('  【オフセット修正】');
                console.log('  - window.fixRightUpOffset(右px, 上px) // マウス-ハンドル修正');
                console.log('  - window.resetOffset() // リセット');
                console.log('  【座標系診断】');
                console.log('  - window.diagnoseCoordinateLayers(clientX, clientY) // 5層座標診断');
                console.log('  - window.diagnoseCurrentMousePosition() // 自動マウス位置診断');
                console.log('  【座標系スワップ】');
                console.log('  - window.enableCoordinateSwapDebug() // スワップデバッグON');
                console.log('  - window.disableCoordinateSwapDebug() // スワップデバッグOFF');
                console.log('  - window.getCoordinateSwapStatus() // スワップ状態確認');
                console.log('  - window.emergencyRestoreCoordinates() // 緊急復元');
                console.log('  【バウンディングボックス】');
                console.log('  - window.debugBoundingBox() // バウンディングボックス状態確認');
                console.log('  - window.emergencyStopDragging() // 緊急ドラッグ停止');
                console.log('  - window.testBoundingBoxResize(deltaX, deltaY) // リサイズテスト');
                console.log('  【Spineデバッグ】');
                console.log('  - window.enableSpineDebugMode() // 詳細ログON');
                console.log('  - window.disableSpineDebugMode() // 詳細ログOFF'); 
                console.log('  - window.listAllCharacters() // キャラクター一覧');
            } else {
                console.log('✅ SpinePreviewLayer初期化完了');
            }
            
            // 🚨 緊急座標系テスト機能（開発モード限定）
            if (Utils.isDevelopmentMode()) {
                window.testDirectCoordinate = function(x, y) {
                    console.log('🧪 直接座標テスト:', x, y);
                    const character = Object.values(window.spinePreviewLayer.characters)[0];
                    if (character && character.skeleton) {
                        const dx = Math.abs(character.skeleton.x - x);
                        const dy = Math.abs(character.skeleton.y - y);
                        const distance = Math.sqrt(dx*dx + dy*dy);
                        console.log('🎯 距離計算: キャラ(' + character.skeleton.x.toFixed(1) + ', ' + character.skeleton.y.toFixed(1) + ') vs テスト(' + x + ', ' + y + ') = ' + distance.toFixed(1) + 'px');
                        return distance < 100;
                    } else {
                        console.log('❌ キャラクターが見つからない');
                        return false;
                    }
                };

                // Y軸変換テスト
                window.testYAxisConversion = function(clientX, clientY) {
                    const rect = window.spinePreviewLayer.canvas.getBoundingClientRect();
                    const rawY = clientY - rect.top;
                    const spineY = window.spinePreviewLayer.canvas.height - rawY;
                    const domY = window.spinePreviewLayer.canvas.height - spineY; // 逆変換
                    
                    console.log('🔄 Y軸変換テスト:');
                    console.log('  Client Y: ' + clientY);
                    console.log('  Raw Canvas Y: ' + rawY);
                    console.log('  Spine Y: ' + spineY);
                    console.log('  DOM Y (逆変換): ' + domY);
                    console.log('  元のRaw Yと一致?: ' + (Math.abs(rawY - domY) < 0.1));
                };

                // 座標変換無効化テスト
                window.testNoYAxisFlip = function(clientX, clientY) {
                    const rect = window.spinePreviewLayer.canvas.getBoundingClientRect();
                    const rawCanvasX = clientX - rect.left;
                    const rawCanvasY = clientY - rect.top; // Y軸変換なし
                    
                    console.log('🚨 Y軸変換なしテスト:');
                    console.log('  Client: (' + clientX + ', ' + clientY + ')');
                    console.log('  Raw Canvas (変換なし): (' + rawCanvasX.toFixed(1) + ', ' + rawCanvasY.toFixed(1) + ')');
                    
                    // キャラクター検索
                    const character = Object.values(window.spinePreviewLayer.characters)[0];
                    if (character && character.skeleton) {
                        const dx = Math.abs(character.skeleton.x - rawCanvasX);
                        const dy = Math.abs(character.skeleton.y - rawCanvasY);
                        const distance = Math.sqrt(dx*dx + dy*dy);
                        console.log('  距離 (変換なし): ' + distance.toFixed(1) + 'px');
                        return distance < 100;
                    }
                    return false;
                };
                console.log("🚨 緊急座標テスト関数:");
                console.log("  - window.testDirectCoordinate(76, 258) // nezumi位置直接テスト");
                console.log("  - window.testNoYAxisFlip(clientX, clientY) // Y軸変換無効化テスト");
                console.log('📋 使用例: 1) window.enableSpineDebugMode() 2) キャラクタークリック → 詳細ログ確認');
            }
            return true;
            
        } catch (error) {
            console.error('❌ SpinePreviewLayer初期化失敗:', error);
            return false;
        }
    }

    /**
     * Spine WebGLライブラリを読み込み
     */
    async loadSpineWebGL() {
        if (window.spine) {
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@esotericsoftware/spine-webgl@4.1.24/dist/iife/spine-webgl.js';
            script.onload = () => {
                this.waitForSpine().then(resolve).catch(reject);
            };
            script.onerror = () => {
                reject(new Error('Spine WebGL CDN読み込み失敗'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Spine WebGL読み込み待ち
     */
    async waitForSpine() {
        return new Promise((resolve, reject) => {
            let checkCount = 0;
            const maxChecks = 50;

            const checkSpine = () => {
                checkCount++;
                if (typeof spine !== "undefined" && spine.AssetManager) {
                    resolve();
                } else if (checkCount >= maxChecks) {
                    reject(new Error("Spine WebGL読み込みタイムアウト"));
                } else {
                    setTimeout(checkSpine, 100);
                }
            };

            checkSpine();
        });
    }

    /**
     * Canvasレイヤーを作成
     */
    createCanvasLayer() {
        // Canvas要素作成
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'spine-preview-canvas';
        
        // WebGL描画用の内部解像度を設定（パーセンテージ対応・実際のサイズベース）
        const rect = this.container.getBoundingClientRect();
        // 🚨 緊急修正: 正方形強制を削除、実際のコンテナサイズを使用
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        console.log(`🎨 Canvas初期化: 内部解像度 ${this.canvas.width}x${this.canvas.height}, コンテナサイズ ${rect.width.toFixed(1)}x${rect.height.toFixed(1)}`);
        
        // Canvas スタイル設定（パーセンテージベース・レスポンシブ対応）
        this.canvas.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 30%;
            aspect-ratio: 1/1;
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            pointer-events: auto;
            z-index: 10;
            background: transparent;
        `;

        // コンテナに追加
        this.container.style.position = 'relative';
        this.container.appendChild(this.canvas);
        
        // ドラッグ&ドロップイベントハンドラー設定
        this.setupDragAndDropEvents();
        
        // Phase 2: 視覚的フィードバックイベント設定
        this.setupVisualFeedbackEvents();

        // WebGLコンテキスト取得
        this.context = this.canvas.getContext("webgl", { 
            alpha: true, 
            premultipliedAlpha: false 
        });

        if (!this.context) {
            throw new Error("WebGL未対応");
        }

    }

    /**
     * Spineレンダラー初期化
     */
    initializeSpineRenderer() {
        if (!this.context) {
            throw new Error("WebGLコンテキストが未初期化");
        }

        this.renderer = new spine.SceneRenderer(this.canvas, this.context);
    }

    /**
     * Spineキャラクターを追加
     * @param {object} characterData - キャラクターデータ
     * @param {number} x - X座標（マウスクライアント座標）
     * @param {number} y - Y座標（マウスクライアント座標）
     * @returns {Promise<object>} 追加結果
     */
    async addCharacter(characterData, x, y) {
        if (!this.spineLoaded) {
            throw new Error("Spine not loaded");
        }

        try {
            const characterId = Utils.generateId('spine-character');
            
            // アセット読み込み
            const spineData = await this.loadSpineAssets(characterData);
            
            // スケルトン作成
            const skeleton = new spine.Skeleton(spineData.skeletonData);
            
            // 座標変換（オフセット補正込み）
            let canvasX, canvasY;
            if (x && y) {
                const canvasCoords = this.clientToCanvasCoordinates(x, y);
                canvasX = canvasCoords.x + this.visualOffset.x;
                canvasY = canvasCoords.y + this.visualOffset.y;
            } else {
                canvasX = this.canvas.width / 2;
                canvasY = this.canvas.height / 2;
            }
            
            skeleton.x = canvasX;
            skeleton.y = canvasY;
            skeleton.scaleX = skeleton.scaleY = 3.0;
            
            // アニメーション設定
            const animationStateData = new spine.AnimationStateData(spineData.skeletonData);
            const animationState = new spine.AnimationState(animationStateData);
            
            // 最初のアニメーション設定
            if (spineData.skeletonData.animations.length > 0) {
                const firstAnimation = spineData.skeletonData.animations[0].name;
                animationState.setAnimation(0, firstAnimation, true);
            }

            // キャラクター登録
            const character = {
                id: characterId,
                name: characterData.name,
                skeleton: skeleton,
                animationState: animationState,
                data: characterData,
                position: { x: canvasX, y: canvasY },
                scale: 3.0
            };

            this.characters.set(characterId, character);
            
            // 視覚フィードバック要素作成
            this.createVisualOverlay(characterId);

            // レンダリング開始
            this.startRenderLoop();
            
            return {
                success: true,
                characterId: characterId,
                character: character
            };

        } catch (error) {
            console.error('❌ Spineキャラクター追加失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Spineアセットを読み込み
     * @param {object} characterData - キャラクターデータ
     * @returns {Promise<object>} スケルトンデータ
     */
    async loadSpineAssets(characterData) {
        const basePath = `./assets/spine/characters/${characterData.name}/`;
        const assetManager = new spine.AssetManager(this.context, basePath);
        
        // アセットファイル読み込み
        assetManager.loadTextureAtlas(`${characterData.name}.atlas`);
        assetManager.loadJson(`${characterData.name}.json`);
        
        // 読み込み完了待ち
        await this.waitForAssets(assetManager);
        
        // スケルトンデータ構築
        const atlas = assetManager.get(`${characterData.name}.atlas`);
        const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
        const skeletonJson = new spine.SkeletonJson(atlasLoader);
        const skeletonData = skeletonJson.readSkeletonData(
            assetManager.get(`${characterData.name}.json`)
        );
        
        return { skeletonData, assetManager };
    }

    /**
     * アセット読み込み待ち
     * @param {spine.AssetManager} assetManager - アセットマネージャー
     */
    async waitForAssets(assetManager) {
        return new Promise((resolve, reject) => {
            let checkCount = 0;
            const maxChecks = 100;

            const checkAssets = () => {
                checkCount++;
                if (assetManager.isLoadingComplete()) {
                    resolve();
                } else if (checkCount >= maxChecks) {
                    reject(new Error("アセット読み込みタイムアウト"));
                } else {
                    setTimeout(checkAssets, 100);
                }
            };

            checkAssets();
        });
    }

    /**
     * レンダリングループを開始
     */
    startRenderLoop() {
        if (this.isRenderingActive || this.characters.size === 0) {
            return;
        }

        this.isRenderingActive = true;
        let lastTime = Date.now() / 1000;

        const render = () => {
            if (this.characters.size === 0) {
                this.isRenderingActive = false;
                return;
            }

            const now = Date.now() / 1000;
            const delta = now - lastTime;
            lastTime = now;

            // Canvas クリア
            this.context.clearColor(0, 0, 0, 0);
            this.context.clear(this.context.COLOR_BUFFER_BIT);
            this.context.viewport(0, 0, this.canvas.width, this.canvas.height);

            this.renderer.begin();

            // 全キャラクターを描画
            this.characters.forEach(character => {
                // アニメーション更新
                character.animationState.update(delta);
                character.animationState.apply(character.skeleton);
                character.skeleton.updateWorldTransform();

                // 描画
                this.renderer.drawSkeleton(character.skeleton, true);
            });

            this.renderer.end();

            requestAnimationFrame(render);
        };

        render();
    }

    /**
     * キャラクター位置更新（Spine座標系統一）
     * @param {string} characterId - キャラクターID
     * @param {number} x - 新しいX座標（Canvas座標系）
     * @param {number} y - 新しいY座標（Canvas座標系）
     */
    updateCharacterPosition(characterId, x, y) {
        if (!characterId) {
            console.error('❌ キャラクターID未指定');
            return;
        }
        
        // 座標の妥当性チェック
        if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
            console.error('❌ 無効な座標値:', { characterId, x, y });
            return;
        }
        
        const character = this.characters.get(characterId);
        if (!character) {
            console.error('❌ キャラクターが見つかりません:', characterId);
            return;
        }
        
        try {
            if (character.skeleton) {
                character.skeleton.x = x;
                character.skeleton.y = y;
            }
            
            if (character.position) {
                character.position.x = x;
                character.position.y = y;
            }
            
            this.updateOverlayPosition(characterId);
            
        } catch (error) {
            console.error('❌ キャラクター位置更新エラー:', characterId, error);
        }
    }

    /**
     * キャラクタースケール更新
     * @param {string} characterId - キャラクターID
     * @param {number} scale - 新しいスケール
     */
    updateCharacterScale(characterId, scale) {
        const character = this.characters.get(characterId);
        if (character) {
            character.skeleton.scaleX = character.skeleton.scaleY = scale;
            character.scale = scale;
        }
    }

    /**
     * キャラクター削除
     * @param {string} characterId - キャラクターID
     */
    removeCharacter(characterId) {
        if (this.characters.has(characterId)) {
            this.characters.delete(characterId);
            
            this.removeVisualOverlay(characterId);
            
            if (this.characters.size === 0) {
                this.clearCanvas();
            }
        }
    }

    /**
     * Canvas クリア
     */
    clearCanvas() {
        if (this.context) {
            this.context.clearColor(0, 0, 0, 0);
            this.context.clear(this.context.COLOR_BUFFER_BIT);
        }
        this.isRenderingActive = false;
    }

    /**
     * 全キャラクター削除
     */
    clearAllCharacters() {
        this.characters.clear();
        
        this.clearAllVisualOverlays();
        
        this.clearCanvas();
    }

    /**
     * マウス座標をCanvas座標に変換（Spine WebGL座標系対応）- 強化版
     * @param {number} clientX - マウスのクライアントX座標
     * @param {number} clientY - マウスのクライアントY座標
     * @returns {object} Canvas座標 {x, y}
     */

    /**
     * 🚨 完全修正版座標変換 - DPR・中央原点・Spine座標系完全対応
     */
    clientToCanvasCoordinates(clientX, clientY) {
        if (!this.canvas) {
            console.error('❌ Canvas未初期化: 座標変換失敗');
            return { x: 0, y: 0 };
        }
        
        const rect = this.canvas.getBoundingClientRect();
        
        // 1. DPR（デバイス座標比率）補正
        const dpr = window.devicePixelRatio || 1;
        
        // 2. 基本Canvas座標計算
        const rawCanvasX = clientX - rect.left;
        const rawCanvasY = clientY - rect.top;
        
        // 3. DPR補正適用
        const dprCorrectedX = rawCanvasX * dpr;
        const dprCorrectedY = rawCanvasY * dpr;
        
        // 4. 画面中央原点補正（最重要）
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // 5. Spineワールド座標系への変換（中央原点 + Y軸反転）
        const canvasX = dprCorrectedX - centerX;
        const canvasY = centerY - dprCorrectedY; // Y軸反転 + 中央原点
        
        // 🔍 変換プロセスの詳細ログ（デバッグ時のみ）
        if (Utils.isDevelopmentMode() || this.selectedCharacterId || window.spineDebugMode) {
            console.log('🔄 座標変換プロセス（パーセンテージCanvas対応版）:');
            console.log('  1. Client: (' + clientX + ', ' + clientY + ')');
            console.log('  2. Canvas Rect: (' + rect.left.toFixed(1) + ', ' + rect.top.toFixed(1) + ') ' + rect.width.toFixed(1) + 'x' + rect.height.toFixed(1));
            console.log('  3. Canvas内部: ' + this.canvas.width + 'x' + this.canvas.height + ' (WebGL解像度)');
            console.log('  4. Raw Canvas: (' + rawCanvasX.toFixed(1) + ', ' + rawCanvasY.toFixed(1) + ')');
            console.log('  5. DPR(' + dpr + ') 補正: (' + dprCorrectedX.toFixed(1) + ', ' + dprCorrectedY.toFixed(1) + ')');
            console.log('  6. 中央原点(' + centerX.toFixed(1) + ', ' + centerY.toFixed(1) + ')');
            console.log('  7. Final Spine: (' + canvasX.toFixed(1) + ', ' + canvasY.toFixed(1) + ')');
        }
        
        return { x: canvasX, y: canvasY };
    }
    /**
     * 視覚的オフセット補正値を設定
     * @param {number} offsetX - X軸のオフセット補正値（右にずれている場合は負の値）
     * @param {number} offsetY - Y軸のオフセット補正値（上にずれている場合は負の値）
     */
    setVisualOffset(offsetX, offsetY) {
        this.visualOffset.x = offsetX;
        this.visualOffset.y = offsetY;
        console.log(`🔧 視覚オフセット設定: X=${offsetX}px, Y=${offsetY}px`);
    }

    /**
     * ドラッグ&ドロップイベントハンドラーを設定
     */
    setupDragAndDropEvents() {
        if (!this.canvas) {
            console.error('❌ Canvas未初期化: ドラッグイベント設定失敗');
            return;
        }

        if (Utils.isDevelopmentMode()) {
            console.log(`🔧 マウスイベントハンドラー設定開始 - Canvas ID: ${this.canvas.id}`);
        }

        // マウスダウンイベント
        this.canvas.addEventListener('mousedown', this.boundHandleMouseDown);
        
        // マウスムーブイベント（ドキュメント全体で監視）
        document.addEventListener('mousemove', this.boundHandleMouseMove);
        
        // マウスアップイベント（ドキュメント全体で監視）
        document.addEventListener('mouseup', this.boundHandleMouseUp);

        if (Utils.isDevelopmentMode()) {
            console.log(`✅ mousedown イベント設定完了 - Canvas`);
            console.log(`✅ mousemove イベント設定完了 - Document`);
            console.log(`✅ mouseup イベント設定完了 - Document`);

            // 🔍 イベントハンドラー設定確認のためのテスト
            this.canvas.addEventListener('click', (event) => {
                console.log(`🔍 TEST CLICK FIRED - Canvas正常動作確認済み`);
            });
            console.log(`✅ テスト用clickイベント設定完了`);
        }
        
    }

    /**
     * マウスダウンイベントハンドラー（排他制御・最適化版）
     * @param {MouseEvent} event - マウスイベント
     */
    handleMouseDown(event) {
        // 🚨 イベント処理の最適化 - 優先順位明確化
        if (Utils.isDevelopmentMode() || this.selectedCharacterId || window.spineDebugMode) {
            console.log(`🔍 MOUSE DOWN FIRED on canvas - Client(${event.clientX}, ${event.clientY})`);
        }
        
        // 🔧 基本条件チェック（早期リターン）
        if (!this.canvas || this.characters.size === 0) {
            if (Utils.isDevelopmentMode()) {
                console.log(`❌ No canvas or no characters: canvas=${!!this.canvas}, chars=${this.characters.size}`);
            }
            return;
        }
        
        // 🚨 操作中の排他制御チェック
        if (this.isDragging || this.dragState.operation !== null) {
            console.warn('⚠️ 操作実行中のため新しい操作を拒否:', {
                isDragging: this.isDragging,
                operation: this.dragState.operation,
                selectedId: this.selectedCharacterId
            });
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        // 🔧 リサイズハンドルクリック判定（最優先・排他制御強化）
        const clickedHandle = event.target.closest('.resize-handle');
        if (clickedHandle) {
            // 不要なイベント伝播を即座に停止
            event.preventDefault();
            event.stopPropagation();
            this.handleResizeHandleClick(event, clickedHandle);
            return;
        }

        // Canvas座標に変換（詳細診断版）
        const canvasCoords = this.clientToCanvasCoordinates(event.clientX, event.clientY);
        
        if (Utils.isDevelopmentMode() || this.selectedCharacterId || window.spineDebugMode) {
            console.log(`🎯 Canvas座標変換完了: Client(${event.clientX}, ${event.clientY}) → Canvas(${canvasCoords.x.toFixed(1)}, ${canvasCoords.y.toFixed(1)})`);
            
            // 🔍 Canvas情報の詳細確認（パーセンテージベース対応）
            const rect = this.canvas.getBoundingClientRect();
            console.log(`📊 Canvas詳細情報（パーセンテージベース）:`);
            console.log(`  - Canvas内部解像度: ${this.canvas.width}x${this.canvas.height}px (WebGL描画用)`);
            console.log(`  - Canvas表示サイズ: ${rect.width.toFixed(1)}x${rect.height.toFixed(1)}px (30%パーセンテージ)`);
            console.log(`  - Canvas DOM矩形: (${rect.left.toFixed(1)}, ${rect.top.toFixed(1)}) 表示位置`);
            console.log(`  - 解像度比率: ${(this.canvas.width / rect.width).toFixed(2)}x (内部/表示)`);
            console.log(`  - 変換計算: Raw(${event.clientX - rect.left}, ${event.clientY - rect.top}) → Spine(${canvasCoords.x.toFixed(1)}, ${this.canvas.height - (event.clientY - rect.top)})`);
        }
        
        // キャラクター選択判定
        const selectedCharacter = this.getCharacterAtPosition(canvasCoords.x, canvasCoords.y);
        
        if (selectedCharacter) {
            if (Utils.isDevelopmentMode() || window.spineDebugMode) {
                console.log(`🎯 CHARACTER SELECTED: ${selectedCharacter.name} (${selectedCharacter.id})`);
                console.log(`🎯 キャラクター現在位置: Spine(${selectedCharacter.skeleton.x.toFixed(1)}, ${selectedCharacter.skeleton.y.toFixed(1)})`);
                
                // 🔍 初期オフセット測定
                const initialOffsetX = canvasCoords.x - selectedCharacter.skeleton.x;
                const initialOffsetY = canvasCoords.y - selectedCharacter.skeleton.y;
                console.log(`🔍 初期オフセット測定: Mouse vs Spine = (${initialOffsetX.toFixed(1)}, ${initialOffsetY.toFixed(1)})`);
            }
            
            this.isDragging = true;
            this.selectedCharacterId = selectedCharacter.id;
            this.dragStartPoint = {
                x: canvasCoords.x,
                y: canvasCoords.y
            };
            
            // ドラッグ状態を移動モードに設定
            this.dragState.operation = 'move';
            this.dragState.activeHandle = null;
            
            const overlayElement = this.visualOverlays.get(selectedCharacter.id);
            if (overlayElement) {
                this.coordinateSwap.enterEditMode(
                    selectedCharacter.id, 
                    overlayElement, 
                    selectedCharacter
                );
            }
            
            this.canvas.style.cursor = 'grabbing';
            this.updateVisualFeedback();
        } else {
            if (Utils.isDevelopmentMode() || window.spineDebugMode) {
                console.log(`❌ キャラクター未発見: 検索座標(${canvasCoords.x.toFixed(1)}, ${canvasCoords.y.toFixed(1)})`);
            }
        }
    }

    /**
     * リサイズハンドルクリック処理（瞬間移動問題修正版）
     * @param {MouseEvent} event - マウスイベント
     * @param {Element} handle - クリックされたハンドル要素
     */
    handleResizeHandleClick(event, handle) {
        event.preventDefault();
        event.stopPropagation();
        
        const overlay = handle.closest('.spine-character-overlay');
        if (!overlay) {
            return;
        }
        
        // オーバーレイIDからキャラクターIDを取得
        const characterId = overlay.id.replace('spine-overlay-', '');
        const character = this.characters.get(characterId);
        
        if (!character) {
            return;
        }
        
        if (Utils.isDevelopmentMode()) {
            console.log(`🔧 Resize handle clicked: ${handle.dataset.position} for ${character.name}`);
        }
        
        // 🔧 座標系スワップ前のオーバーレイ位置を記録（重要）
        const overlayRectBeforeSwap = overlay.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        // 座標系スワップ開始（最初に実行）
        this.coordinateSwap.enterEditMode(characterId, overlay, character);
        
        // 🚨 スワップ後のオーバーレイ位置を取得（修正の核心）
        const overlayRectAfterSwap = overlay.getBoundingClientRect();
        
        // 🔧 座標系スワップによる位置変化を検出・補正
        const positionShiftX = overlayRectAfterSwap.left - overlayRectBeforeSwap.left;
        const positionShiftY = overlayRectAfterSwap.top - overlayRectBeforeSwap.top;
        
        if (Utils.isDevelopmentMode()) {
            console.log(`🔧 座標系スワップ変化検出:`);
            console.log(`  - スワップ前位置: (${overlayRectBeforeSwap.left.toFixed(1)}, ${overlayRectBeforeSwap.top.toFixed(1)})`);
            console.log(`  - スワップ後位置: (${overlayRectAfterSwap.left.toFixed(1)}, ${overlayRectAfterSwap.top.toFixed(1)})`);
            console.log(`  - 位置変化: (${positionShiftX.toFixed(1)}, ${positionShiftY.toFixed(1)})`);
        }
        
        // リサイズモード開始
        this.isDragging = true;
        this.selectedCharacterId = characterId;
        
        // ドラッグ状態をリサイズモードに設定
        this.dragState.operation = 'resize-corner';
        this.dragState.activeHandle = handle;
        this.dragState.resizeData = {
            startRect: overlayRectAfterSwap,  // 🚨 修正: スワップ後の矩形を使用
            position: handle.dataset.position,
            modifiers: this.getModifierKeys(event),
            // 🔧 座標系スワップ補正情報を記録
            positionShift: { x: positionShiftX, y: positionShiftY }
        };
        
        // 🚨 修正: ドラッグ開始点をスワップ後のハンドル実際位置に補正
        const handleRect = handle.getBoundingClientRect();
        const handleCenterX = handleRect.left + handleRect.width / 2;
        const handleCenterY = handleRect.top + handleRect.height / 2;
        
        this.dragStartPoint = {
            x: handleCenterX,  // 🔧 ハンドル中心位置を使用
            y: handleCenterY   // 🔧 ハンドル中心位置を使用
        };
        
        if (Utils.isDevelopmentMode()) {
            console.log(`🔧 修正後ドラッグ開始点:`);
            console.log(`  - マウス位置: (${event.clientX}, ${event.clientY})`);
            console.log(`  - ハンドル中心: (${handleCenterX.toFixed(1)}, ${handleCenterY.toFixed(1)})`);
            console.log(`  - オフセット: (${(event.clientX - handleCenterX).toFixed(1)}, ${(event.clientY - handleCenterY).toFixed(1)})`);
        }
        
        // カーソル設定
        document.body.style.cursor = handle.style.cursor;
        
        this.updateVisualFeedback();
    }

    /**
     * マウスムーブイベントハンドラー（排他制御・最適化版）
     * @param {MouseEvent} event - マウスイベント
     */
    handleMouseMove(event) {
        // 🚨 排他制御 - 基本条件チェック
        if (!this.isDragging || !this.selectedCharacterId || !this.canvas) {
            return;
        }
        
        // 🚨 異常状態検出・緊急停止
        if (this.dragState.operation === null) {
            console.error('❌ 異常状態検出: ドラッグ中だが操作タイプが未設定');
            this.emergencyStopDragging();
            return;
        }

        // 🔧 リサイズモード（排他制御強化）
        if (this.dragState.operation === 'resize-corner') {
            // リサイズ中は通常移動を完全無効化
            event.preventDefault();
            
            const deltaX = event.clientX - this.dragStartPoint.x;
            const deltaY = event.clientY - this.dragStartPoint.y;
            const modifiers = this.getModifierKeys(event);
            
            // 異常なリサイズ値の検出
            if (Math.abs(deltaX) > 2000 || Math.abs(deltaY) > 2000) {
                console.warn('⚠️ 異常なリサイズ値検出:', { deltaX, deltaY });
                return;
            }
            
            this.performCornerResize(deltaX, deltaY, modifiers);
            return;
        }

        // 🔧 移動モード（リサイズ操作中は実行されない）
        if (this.dragState.operation === 'move') {
            const canvasCoords = this.clientToCanvasCoordinates(event.clientX, event.clientY);
            
            // 🔧 オフセット補正値を適用
            const correctedX = canvasCoords.x + this.visualOffset.x;
            const correctedY = canvasCoords.y + this.visualOffset.y;
            
            // 座標値の妥当性チェック
            if (isNaN(correctedX) || isNaN(correctedY) || !isFinite(correctedX) || !isFinite(correctedY)) {
                console.warn('⚠️ 無効な座標値:', { correctedX, correctedY });
                return;
            }
            
            this.updateCharacterPosition(this.selectedCharacterId, correctedX, correctedY);
            
            if (this.coordinateSwap.isInEditMode(this.selectedCharacterId)) {
                const overlayElement = this.visualOverlays.get(this.selectedCharacterId);
                if (overlayElement) {
                    const domY = this.canvas.height - correctedY;
                    overlayElement.style.left = `${correctedX}px`;
                    overlayElement.style.top = `${domY}px`;
                }
            }
        }
    }

    /**
     * マウスアップイベントハンドラー（リサイズ終了処理 + 座標系スワップ解除）
     * @param {MouseEvent} event - マウスイベント
     */
    handleMouseUp(event) {
        if (Utils.isDevelopmentMode() || window.spineDebugMode) {
            console.log(`🔍 MOUSE UP FIRED: dragging=${this.isDragging}, operation=${this.dragState.operation}, selected=${this.selectedCharacterId}, client(${event.clientX}, ${event.clientY})`);
            console.log(`🔧 バインド関数参照確認: mouseUp=${typeof this.boundHandleMouseUp}, mouseMove=${typeof this.boundHandleMouseMove}, mouseDown=${typeof this.boundHandleMouseDown}`);
        }
        
        if (this.isDragging && this.selectedCharacterId) {
            const character = this.characters.get(this.selectedCharacterId);
            
            // リサイズモード終了処理
            if (this.dragState.operation === 'resize-corner') {
                if (Utils.isDevelopmentMode()) {
                    console.log(`🔧 Resize operation completed for ${character?.name}`);
                }
                
                // カーソルリセット
                document.body.style.cursor = '';
                
            } else if (this.dragState.operation === 'move') {
                // 移動モード終了処理（既存の診断ロジック）
                const canvasCoords = this.clientToCanvasCoordinates(event.clientX, event.clientY);
                
                if (Utils.isDevelopmentMode() || window.spineDebugMode) {
                    console.log(`🎯 ドロップ時詳細診断:`);
                    console.log(`  - マウス位置(Canvas): (${canvasCoords.x.toFixed(1)}, ${canvasCoords.y.toFixed(1)})`);
                    
                    if (character && character.skeleton) {
                        const offsetX = canvasCoords.x - character.skeleton.x;
                        const offsetY = canvasCoords.y - character.skeleton.y;
                        const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
                        
                        console.log(`  - キャラ位置(Spine): (${character.skeleton.x.toFixed(1)}, ${character.skeleton.y.toFixed(1)})`);
                        console.log(`  - オフセット: (${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);
                        console.log(`  - 距離: ${distance.toFixed(1)}px`);
                        
                        // 🚨 右上ズレの具体的判定
                        if (Math.abs(offsetX) > 5 || Math.abs(offsetY) > 5) {
                            console.log(`🚨 POSITION MISMATCH DETECTED!`);
                            console.log(`  右ズレ: ${offsetX.toFixed(1)}px (${offsetX > 0 ? '右' : '左'})`);
                            console.log(`  上ズレ: ${offsetY.toFixed(1)}px (${offsetY > 0 ? '上' : '下'})`);
                        } else {
                            console.log(`✅ 位置精度良好: ${distance.toFixed(1)}px以内`);
                        }
                    } else {
                        console.log(`❌ キャラクター取得失敗: ${this.selectedCharacterId}`);
                    }
                }
            }
            
            // 共通終了処理
            const overlay = this.visualOverlays.get(this.selectedCharacterId);
            if (overlay && character) {
                this.coordinateSwap.exitEditMode(this.selectedCharacterId, overlay, character);
            }
            
            // ドラッグ状態リセット
            this.isDragging = false;
            this.selectedCharacterId = null;
            this.dragStartPoint = { x: 0, y: 0 };
            
            // ドラッグ状態オブジェクトリセット
            this.dragState.operation = null;
            this.dragState.activeHandle = null;
            this.dragState.resizeData = {
                startRect: null,
                position: null,
                modifiers: null
            };
            
            if (this.canvas) {
                this.canvas.style.cursor = 'default';
            }
            
            if (Utils.isDevelopmentMode() || window.spineDebugMode) {
                console.log(`✅ ドラッグ終了処理完了 - isDragging=${this.isDragging}, selectedCharacterId=${this.selectedCharacterId}`);
            }
            
            this.updateVisualFeedback();
        } else {
            if (Utils.isDevelopmentMode()) {
                console.log(`❌ マウスアップ処理スキップ: dragging=${this.isDragging}, operation=${this.dragState.operation}, selected=${this.selectedCharacterId}`);
            }
        }
    }

    /**
     * 指定位置にあるキャラクターを取得（円形ヒット判定）- 強化版
     * @param {number} x - X座標（Canvas座標系）
     * @param {number} y - Y座標（Canvas座標系）
     * @returns {object|null} ヒットしたキャラクター、なければnull
     */
    getCharacterAtPosition(x, y) {
        if (Utils.isDevelopmentMode() || window.spineDebugMode) {
            console.log(`🔍 === キャラクター検索開始 ===`);
            console.log(`🎯 検索座標: Canvas(${x?.toFixed?.(1) || x}, ${y?.toFixed?.(1) || y})`);
        }
        
        if (!x && x !== 0 || !y && y !== 0) {
            if (Utils.isDevelopmentMode()) {
                console.warn('⚠️ 無効な座標:', { x, y });
            }
            return null;
        }

        // 🔧 検索範囲を拡大（50px → 100px）
        const hitRadius = 100; // ヒット判定半径（px）
        
        if (Utils.isDevelopmentMode() || window.spineDebugMode) {
            console.log(`🔍 ヒット判定範囲: ${hitRadius}px`);
            
            // 🔍 全キャラクター情報をログ出力
            console.log(`📊 登録キャラクター数: ${this.characters.size}`);
            this.characters.forEach((character, characterId) => {
                if (character && character.skeleton) {
                    console.log(`👾 ${character.name}(${characterId}): Spine(${character.skeleton.x?.toFixed?.(1) || character.skeleton.x}, ${character.skeleton.y?.toFixed?.(1) || character.skeleton.y})`);
                } else {
                    console.log(`❌ 破損キャラクター: ${character?.name || 'Unknown'}(${characterId}) - skeleton: ${!!character?.skeleton}`);
                }
            });
        }
        
        // すべてのキャラクターをチェック（後から追加されたものが優先）
        const characterArray = Array.from(this.characters.values()).reverse();
        
        if (Utils.isDevelopmentMode() || window.spineDebugMode) {
            console.log(`🔍 検索対象配列: ${characterArray.length}個のキャラクター`);
        }
        
        for (const character of characterArray) {
            try {
                if (!character) {
                    if (Utils.isDevelopmentMode()) {
                        console.log(`❌ nullキャラクタースキップ`);
                    }
                    continue;
                }
                
                if (!character.skeleton) {
                    if (Utils.isDevelopmentMode()) {
                        console.log(`❌ skeletonなしキャラクタースキップ: ${character.name}`);
                    }
                    continue;
                }
                
                const charX = character.skeleton.x || 0;
                const charY = character.skeleton.y || 0;
                
                // 円形ヒット判定
                const deltaX = x - charX;
                const deltaY = y - charY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                if (Utils.isDevelopmentMode() || window.spineDebugMode) {
                    console.log(`🔍 ${character.name}: 座標差分(${deltaX.toFixed(1)}, ${deltaY.toFixed(1)}) 距離=${distance.toFixed(1)}px (判定範囲${hitRadius}px)`);
                }
                
                if (distance <= hitRadius) {
                    if (Utils.isDevelopmentMode() || window.spineDebugMode) {
                        console.log(`✅ キャラクター発見: ${character.name} - 距離${distance.toFixed(1)}px <= ${hitRadius}px`);
                    }
                    return character;
                } else {
                    if (Utils.isDevelopmentMode() || window.spineDebugMode) {
                        console.log(`❌ 範囲外: ${character.name} - 距離${distance.toFixed(1)}px > ${hitRadius}px`);
                    }
                }
            } catch (error) {
                console.error('❌ キャラクターヒット判定エラー:', character?.name, error);
                continue;
            }
        }
        
        if (Utils.isDevelopmentMode() || window.spineDebugMode) {
            console.log(`❌ キャラクター検索結果: 見つからませんでした`);
            console.log(`🔍 === キャラクター検索終了 ===`);
        }
        return null;
    }

    /**
     * 修飾キー状態を取得
     * @param {MouseEvent} event - マウスイベント
     * @returns {object} 修飾キー状態
     */
    getModifierKeys(event) {
        return {
            shift: event.shiftKey,
            ctrl: event.ctrlKey || event.metaKey,  // Cmd+Ctrl両対応
            alt: event.altKey,
            meta: event.metaKey
        };
    }

    /**
     * 4角ハンドルによるリサイズ処理（境界制限・最適化版）
     * @param {number} deltaX - X軸移動量
     * @param {number} deltaY - Y軸移動量 
     * @param {object} modifiers - 修飾キー状態
     */
    performCornerResize(deltaX, deltaY, modifiers) {
        if (!this.dragState.activeHandle || !this.selectedCharacterId) {
            return;
        }

        const character = this.characters.get(this.selectedCharacterId);
        const overlay = this.visualOverlays.get(this.selectedCharacterId);
        
        if (!character || !overlay || !this.container) {
            return;
        }

        try {
            const handle = this.dragState.activeHandle;
            const position = handle.dataset.position;
            const resizeData = this.dragState.resizeData;
            
            if (Utils.isDevelopmentMode()) {
                console.log(`🔧 Corner Resize: position=${position}, delta=(${deltaX.toFixed(1)}, ${deltaY.toFixed(1)}), modifiers:`, modifiers);
                // 🔧 座標系スワップ補正値をデバッグ表示
                if (resizeData.positionShift) {
                    console.log(`🔧 座標系スワップ補正値: (${resizeData.positionShift.x.toFixed(1)}, ${resizeData.positionShift.y.toFixed(1)})`);
                }
            }

            // 現在のオーバーレイ矩形取得
            const rect = overlay.getBoundingClientRect();
            const parentRect = this.container.getBoundingClientRect();
            
            // Canvas境界情報取得
            const canvasRect = this.canvas ? this.canvas.getBoundingClientRect() : parentRect;
            const maxWidth = canvasRect.width;
            const maxHeight = canvasRect.height;
            
            // 親要素基準の座標
            const currentMouseX = (resizeData.startRect.left + deltaX) - parentRect.left;
            const currentMouseY = (resizeData.startRect.top + deltaY) - parentRect.top;
            
            // 現在の要素位置（親要素基準）
            const currentLeft = rect.left - parentRect.left;
            const currentTop = rect.top - parentRect.top;
            const currentWidth = rect.width;
            const currentHeight = rect.height;
            
            let newWidth, newHeight, newLeft, newTop;
            
            // 🔧 最小サイズ制限強化（20px → 30px）
            const minSize = 30;
            
            // Ctrl/Altキー: 中心固定拡縮（優先処理）
            if (modifiers.ctrl || modifiers.alt) {
                const centerX = currentLeft + currentWidth / 2;
                const centerY = currentTop + currentHeight / 2;
                
                // 中心からマウス位置までの距離を2倍
                const deltaFromCenterX = Math.abs(currentMouseX - centerX);
                const deltaFromCenterY = Math.abs(currentMouseY - centerY);
                
                newWidth = Math.max(minSize, deltaFromCenterX * 2);
                newHeight = Math.max(minSize, deltaFromCenterY * 2);
                
                // Shift併用: 縦横比保持
                if (modifiers.shift) {
                    const aspectRatio = currentWidth / currentHeight;
                    if (deltaFromCenterX / currentWidth > deltaFromCenterY / currentHeight) {
                        newHeight = newWidth / aspectRatio;
                    } else {
                        newWidth = newHeight * aspectRatio;
                    }
                }
                
                // 中心固定なので位置は中心から計算
                newLeft = centerX - newWidth / 2;
                newTop = centerY - newHeight / 2;
                
            } else {
                // 通常の対角固定拡縮
                
                // 対角固定点
                let fixedX, fixedY;
                switch(position) {
                    case 'nw': fixedX = currentLeft + currentWidth; fixedY = currentTop + currentHeight; break;
                    case 'ne': fixedX = currentLeft; fixedY = currentTop + currentHeight; break;
                    case 'sw': fixedX = currentLeft + currentWidth; fixedY = currentTop; break;
                    case 'se': fixedX = currentLeft; fixedY = currentTop; break;
                }
                
                newWidth = Math.max(minSize, Math.abs(currentMouseX - fixedX));
                newHeight = Math.max(minSize, Math.abs(currentMouseY - fixedY));
                
                // Shiftキー: 縦横比保持
                if (modifiers.shift) {
                    const aspectRatio = currentWidth / currentHeight;
                    const deltaXRatio = Math.abs(currentMouseX - fixedX) / currentWidth;
                    const deltaYRatio = Math.abs(currentMouseY - fixedY) / currentHeight;
                    
                    if (deltaXRatio > deltaYRatio) {
                        newHeight = newWidth / aspectRatio;
                    } else {
                        newWidth = newHeight * aspectRatio;
                    }
                }
                
                // 対角固定での位置計算
                newLeft = Math.min(currentMouseX, fixedX);
                newTop = Math.min(currentMouseY, fixedY);
                
                // Shift使用時の位置補正
                if (modifiers.shift) {
                    switch(position) {
                        case 'nw': newLeft = fixedX - newWidth; newTop = fixedY - newHeight; break;
                        case 'ne': newLeft = fixedX; newTop = fixedY - newHeight; break;
                        case 'sw': newLeft = fixedX - newWidth; newTop = fixedY; break;
                        case 'se': newLeft = fixedX; newTop = fixedY; break;
                    }
                }
            }
            
            // 🚨 Canvas外リサイズの境界制限強化
            const canvasMargin = 10; // Canvas端からのマージン
            const effectiveMaxWidth = maxWidth - canvasMargin;
            const effectiveMaxHeight = maxHeight - canvasMargin;
            
            // 境界制限チェック（強化版）
            if (newLeft < canvasMargin || newTop < canvasMargin || 
                newLeft + newWidth > effectiveMaxWidth || 
                newTop + newHeight > effectiveMaxHeight) {
                if (Utils.isDevelopmentMode()) {
                    console.log(`⚠️ Canvas境界制限: pos=(${newLeft.toFixed(1)}, ${newTop.toFixed(1)}), size=(${newWidth.toFixed(1)}, ${newHeight.toFixed(1)}), canvas=(${effectiveMaxWidth}, ${effectiveMaxHeight})`);
                }
                return; // Canvas境界外の場合は適用しない
            }
            
            // オーバーレイスタイル適用
            overlay.style.left = newLeft + 'px';
            overlay.style.top = newTop + 'px';
            overlay.style.width = newWidth + 'px';
            overlay.style.height = newHeight + 'px';
            
            // DOM更新を確実に反映（パフォーマンス最適化）
            overlay.offsetHeight;
            
            // 🔧 スケール制限確認（0.1x～3.0x）
            const baseSize = 100;
            const calculatedScale = (newWidth + newHeight) / (baseSize * 2);
            const clampedScale = Math.max(0.1, Math.min(3.0, calculatedScale));
            
            // Spineキャラクタースケール更新
            this.updateCharacterScaleFromOverlay(this.selectedCharacterId, newWidth, newHeight);
            
            if (Utils.isDevelopmentMode()) {
                console.log(`✅ Resize applied: pos=(${newLeft.toFixed(1)}, ${newTop.toFixed(1)}), size=(${newWidth.toFixed(1)}, ${newHeight.toFixed(1)}), scale=${clampedScale.toFixed(2)}x`);
            }
            
        } catch (error) {
            console.error('❌ Corner resize error:', error);
            // エラー時のロールバック機能
            this.rollbackResize();
        }
    }

    /**
     * オーバーレイサイズからSpineキャラクタースケールを更新
     * @param {string} characterId - キャラクターID
     * @param {number} overlayWidth - オーバーレイ幅
     * @param {number} overlayHeight - オーバーレイ高さ
     */
    updateCharacterScaleFromOverlay(characterId, overlayWidth, overlayHeight) {
        const character = this.characters.get(characterId);
        if (!character) {
            return;
        }

        try {
            // オーバーレイサイズ（100x100px基準）からスケール計算
            const baseSize = 100;
            const averageScale = (overlayWidth + overlayHeight) / (baseSize * 2);
            
            // 最小・最大スケール制限
            const clampedScale = Math.max(0.1, Math.min(3.0, averageScale));
            
            // Spineキャラクタースケール更新
            this.updateCharacterScale(characterId, clampedScale);
            
            if (Utils.isDevelopmentMode()) {
                console.log(`🔧 Scale updated: ${character.name} → ${clampedScale.toFixed(2)}x (overlay: ${overlayWidth.toFixed(1)}x${overlayHeight.toFixed(1)})`);
            }
            
        } catch (error) {
            console.error('❌ Character scale update error:', characterId, error);
        }
    }

    /**
     * リサイズ対応（座標系スワップ技術対応）
     */
    handleResize() {
        if (this.canvas && this.container) {
            // WebGL描画用の内部解像度を更新（パーセンテージベース対応・実際の表示サイズに合わせる）
            const canvasRect = this.canvas.getBoundingClientRect();
            
            // 🚨 緊急修正: 正方形強制ではなく実際の表示サイズを使用
            this.canvas.width = canvasRect.width;
            this.canvas.height = canvasRect.height;
            
            console.log(`📏 Canvas内部解像度更新: ${this.canvas.width}x${this.canvas.height} (表示サイズ: ${canvasRect.width.toFixed(1)}x${canvasRect.height.toFixed(1)})`);
            
            // CSSサイズは既にパーセンテージで設定済みのため更新不要
            // WebGLビューポートのみ更新
            if (this.context) {
                this.context.viewport(0, 0, this.canvas.width, this.canvas.height);
            }
            
            // リサイズ時の座標系スワップ対応
            const editingCharacters = [];
            this.characters.forEach((character, characterId) => {
                if (this.coordinateSwap.isInEditMode(characterId)) {
                    editingCharacters.push({ characterId, character });
                    // スワップ解除
                    const overlay = this.visualOverlays.get(characterId);
                    if (overlay) {
                        this.coordinateSwap.exitEditMode(characterId, overlay, character);
                    }
                }
            });
            
            // オーバーレイ位置更新
            this.characters.forEach((character, characterId) => {
                this.updateOverlayPosition(characterId);
            });
            
            // スワップ再開
            editingCharacters.forEach(({ characterId, character }) => {
                const overlay = this.visualOverlays.get(characterId);
                if (overlay) {
                    this.coordinateSwap.enterEditMode(characterId, overlay, character);
                }
            });
        }
    }

    /**
     * レイヤーを破棄（座標系スワップ技術対応）
     */
    destroy() {
        try {
            // 🚨 座標系スワップの緊急復元
            if (this.coordinateSwap && this.coordinateSwap.getStatus().swappedCount > 0) {
                console.log('🚨 破棄時の座標系緊急復元を実行');
                this.coordinateSwap.emergencyRestore(this.characters, this.visualOverlays);
            }
            
            this.clearAllCharacters();
            
            if (this.coordinateSwap) {
                this.coordinateSwap.clearAll();
            }
            
            // イベントリスナー削除（バインド済み関数使用）
            if (this.canvas) {
                this.canvas.removeEventListener('mousedown', this.boundHandleMouseDown);
            }
            document.removeEventListener('mousemove', this.boundHandleMouseMove);
            document.removeEventListener('mouseup', this.boundHandleMouseUp);
            
            if (Utils.isDevelopmentMode()) {
                console.log('🔧 イベントリスナー削除完了 - バインド済み関数使用');
            }
            
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
            
            // ドラッグ状態リセット
            this.isDragging = false;
            this.selectedCharacterId = null;
            this.dragStartPoint = { x: 0, y: 0 };
            
            // ドラッグ状態オブジェクトリセット
            if (this.dragState) {
                this.dragState.operation = null;
                this.dragState.activeHandle = null;
                this.dragState.resizeData = {
                    startRect: null,
                    position: null,
                    modifiers: null
                };
            }
            
            this.clearAllVisualOverlays();
            this.hoveredCharacterId = null;
            this.coordinateSwap = null;
            
            this.canvas = null;
            this.context = null;
            this.renderer = null;
            this.container = null;
            this.spineLoaded = false;
            
            if (Utils.isDevelopmentMode()) {
                console.log('✅ SpinePreviewLayer破棄完了（座標系復元済み）');
            }
            
        } catch (error) {
            console.error('❌ SpinePreviewLayer破棄エラー:', error);
        }
    }
    
    /**
     * 緊急ドラッグ停止機能
     */
    emergencyStopDragging() {
        try {
            console.log('🚨 緊急ドラッグ停止開始');
            
            // 座標系スワップの緊急復元
            if (this.selectedCharacterId) {
                const character = this.characters.get(this.selectedCharacterId);
                const overlay = this.visualOverlays.get(this.selectedCharacterId);
                
                if (character && overlay && this.coordinateSwap.isInEditMode(this.selectedCharacterId)) {
                    this.coordinateSwap.exitEditMode(this.selectedCharacterId, overlay, character);
                }
            }
            
            // ドラッグ状態の完全リセット
            this.isDragging = false;
            this.selectedCharacterId = null;
            this.dragStartPoint = { x: 0, y: 0 };
            
            // ドラッグ状態オブジェクトリセット
            this.dragState.operation = null;
            this.dragState.activeHandle = null;
            this.dragState.resizeData = {
                startRect: null,
                position: null,
                modifiers: null
            };
            
            // カーソルリセット
            if (this.canvas) {
                this.canvas.style.cursor = 'default';
            }
            document.body.style.cursor = '';
            
            // 視覚的フィードバック更新
            this.updateVisualFeedback();
            
            console.log('✅ 緊急ドラッグ停止完了');
            
        } catch (error) {
            console.error('❌ 緊急ドラッグ停止エラー:', error);
        }
    }
    
    /**
     * リサイズのロールバック機能
     */
    rollbackResize() {
        try {
            if (!this.selectedCharacterId || !this.dragState.resizeData.startRect) {
                return;
            }
            
            const overlay = this.visualOverlays.get(this.selectedCharacterId);
            if (!overlay) {
                return;
            }
            
            const startRect = this.dragState.resizeData.startRect;
            const parentRect = this.container.getBoundingClientRect();
            
            // 開始時の状態に復元
            const originalLeft = startRect.left - parentRect.left;
            const originalTop = startRect.top - parentRect.top;
            
            overlay.style.left = originalLeft + 'px';
            overlay.style.top = originalTop + 'px';
            overlay.style.width = startRect.width + 'px';
            overlay.style.height = startRect.height + 'px';
            
            console.log('🔄 リサイズをロールバックしました');
            
        } catch (error) {
            console.error('❌ リサイズロールバックエラー:', error);
        }
    }

    // 視覚的フィードバック機能

    /**
     * 視覚的フィードバックイベントを設定
     */
    setupVisualFeedbackEvents() {
        if (!this.canvas) {
            console.error('❌ Canvas未初期化: 視覚フィードバックイベント設定失敗');
            return;
        }

        // マウスホバーイベント（ホバー状態でのカーソル変更）
        this.canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleCanvasMouseLeave.bind(this));
        
    }

    /**
     * Canvas上でのマウスムーブイベントハンドラー（ホバー検出用）
     * @param {MouseEvent} event - マウスイベント
     */
    handleCanvasMouseMove(event) {
        if (this.isDragging) {
            return; // ドラッグ中はホバー処理をスキップ
        }

        const canvasCoords = this.clientToCanvasCoordinates(event.clientX, event.clientY);
        const hoveredCharacter = this.getCharacterAtPosition(canvasCoords.x, canvasCoords.y);
        
        const newHoveredId = hoveredCharacter ? hoveredCharacter.id : null;
        
        if (this.hoveredCharacterId !== newHoveredId) {
            this.hoveredCharacterId = newHoveredId;
            
            // カーソル変更
            if (hoveredCharacter) {
                this.canvas.style.cursor = 'grab';
            } else {
                this.canvas.style.cursor = 'default';
            }
        }
    }

    /**
     * Canvas離脱時のイベントハンドラー
     * @param {MouseEvent} event - マウスイベント
     */
    handleCanvasMouseLeave(event) {
        this.hoveredCharacterId = null;
        if (!this.isDragging) {
            this.canvas.style.cursor = 'default';
        }
    }

    /**
     * 視覚フィードバック用オーバーレイ要素を作成（4角ハンドル付きバウンディングボックス）
     * @param {string} characterId - キャラクターID
     */
    createVisualOverlay(characterId) {
        const character = this.characters.get(characterId);
        if (!character || !this.container) {
            return;
        }

        // バウンディングボックス要素作成
        const overlay = document.createElement('div');
        overlay.id = `spine-overlay-${characterId}`;
        overlay.className = 'spine-character-overlay';
        
        // バウンディングボックス基本スタイル設定
        overlay.style.cssText = `
            position: absolute;
            width: 100px;
            height: 100px;
            border: 2px solid #007acc;
            background: rgba(0, 122, 204, 0.1);
            pointer-events: none;
            z-index: 15;
            transition: border-color 0.2s ease;
            transform: translate(-50%, -50%);
        `;

        // 4角ハンドル作成
        const handleConfigs = [
            { position: 'nw', cursor: 'nw-resize' },
            { position: 'ne', cursor: 'ne-resize' },
            { position: 'sw', cursor: 'sw-resize' },
            { position: 'se', cursor: 'se-resize' }
        ];

        handleConfigs.forEach(config => {
            const handle = document.createElement('div');
            handle.className = 'bounding-box-handle resize-handle';
            handle.dataset.position = config.position;
            handle.style.cssText = `
                position: absolute;
                width: 12px;
                height: 12px;
                background: #007acc;
                border: 2px solid white;
                border-radius: 50%;
                cursor: ${config.cursor};
                pointer-events: all;
                z-index: 16;
            `;
            
            // ハンドル位置設定
            this.positionHandle(handle, config.position);
            overlay.appendChild(handle);
        });

        this.container.appendChild(overlay);
        this.visualOverlays.set(characterId, overlay);
        
        // 初期位置更新
        this.updateOverlayPosition(characterId);
        
    }

    /**
     * バウンディングボックスハンドルの位置を設定
     * @param {Element} handle - ハンドル要素
     * @param {string} position - ハンドル位置 ('nw', 'ne', 'sw', 'se')
     */
    positionHandle(handle, position) {
        switch(position) {
            case 'nw':
                handle.style.top = '0';
                handle.style.left = '0';
                handle.style.transform = 'translate(-50%, -50%)';
                break;
            case 'ne':
                handle.style.top = '0';
                handle.style.right = '0';
                handle.style.transform = 'translate(50%, -50%)';
                break;
            case 'sw':
                handle.style.bottom = '0';
                handle.style.left = '0';
                handle.style.transform = 'translate(-50%, 50%)';
                break;
            case 'se':
                handle.style.bottom = '0';
                handle.style.right = '0';
                handle.style.transform = 'translate(50%, 50%)';
                break;
        }
    }

    /**
     * 視覚フィードバック用オーバーレイ要素を削除
     * @param {string} characterId - キャラクターID
     */
    removeVisualOverlay(characterId) {
        const overlay = this.visualOverlays.get(characterId);
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
            this.visualOverlays.delete(characterId);
        }
    }

    /**
     * 全視覚フィードバック要素をクリア
     */
    clearAllVisualOverlays() {
        this.visualOverlays.forEach((overlay, characterId) => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });
        this.visualOverlays.clear();
    }

    /**
     * オーバーレイの位置を更新（座標系スワップ対応 + DPR補正統一・瞬間移動防止強化）
     * @param {string} characterId - キャラクターID
     */
    updateOverlayPosition(characterId) {
        const character = this.characters.get(characterId);
        const overlay = this.visualOverlays.get(characterId);
        
        if (!character || !overlay || !this.canvas) {
            return;
        }

        if (this.coordinateSwap.isInEditMode(characterId)) {
            return;
        }

        // 🔧 キャラクター実体位置からハンドル位置を正確計算
        const rawSpineX = character.skeleton.x;
        const rawSpineY = character.skeleton.y;
        
        // ✅ 重要修正: visualOffset を逆算（設定時に加算されたoffsetを減算）
        const spineX = rawSpineX - this.visualOffset.x;
        const spineY = rawSpineY - this.visualOffset.y;
        
        if (Utils.isDevelopmentMode() || window.spineDebugMode) {
            console.log(`🔧 ハンドル計算前: Raw Spine(${rawSpineX.toFixed(1)}, ${rawSpineY.toFixed(1)}) → offset補正後 Spine(${spineX.toFixed(1)}, ${spineY.toFixed(1)})`);
            console.log(`🔧 visualOffset: (${this.visualOffset.x}, ${this.visualOffset.y})`);
        }
        
        // 🚨 重要: clientToCanvasCoordinatesの逆変換を正確に実行（統一性確保）
        const canvasRect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Spine座標系 → Canvas中央原点座標系への逆変換（完全版）
        const centerOriginX = spineX + centerX;
        const centerOriginY = centerY - spineY; // Y軸反転
        
        // Canvas座標 → DPR補正逆変換 → DOM座標
        const rawCanvasX = centerOriginX / dpr;
        const rawCanvasY = centerOriginY / dpr;
        
        // Canvas矩形相対位置 → 絶対クライアント座標
        const clientX = canvasRect.left + rawCanvasX;
        const clientY = canvasRect.top + rawCanvasY;
        
        // 🔧 コンテナ基準座標への変換（正確性強化）
        const containerRect = this.container.getBoundingClientRect();
        const containerRelativeX = clientX - containerRect.left;
        const containerRelativeY = clientY - containerRect.top;
        
        // 🚨 transform: translate(-50%, -50%) を考慮したハンドル位置計算
        const overlayWidth = 100; // バウンディングボックス基本サイズ
        const overlayHeight = 100;
        const handleDomX = containerRelativeX - (overlayWidth / 2);
        const handleDomY = containerRelativeY - (overlayHeight / 2);
        
        if (Utils.isDevelopmentMode() || window.spineDebugMode) {
            console.log(`🔧 ハンドル位置統一変換（パーセンテージCanvas対応版）:`);
            console.log(`  - Spine座標: (${spineX.toFixed(1)}, ${spineY.toFixed(1)})`);
            console.log(`  - Canvas内部: ${this.canvas.width}x${this.canvas.height} (WebGL解像度)`);
            console.log(`  - Canvas表示: ${canvasRect.width.toFixed(1)}x${canvasRect.height.toFixed(1)} (DOM表示サイズ)`);
            console.log(`  - Canvas中央原点: (${centerOriginX.toFixed(1)}, ${centerOriginY.toFixed(1)})`);
            console.log(`  - DPR補正: (${rawCanvasX.toFixed(1)}, ${rawCanvasY.toFixed(1)})`);
            console.log(`  - クライアント座標: (${clientX.toFixed(1)}, ${clientY.toFixed(1)})`);
            console.log(`  - コンテナ相対: (${containerRelativeX.toFixed(1)}, ${containerRelativeY.toFixed(1)})`);
            console.log(`  - 最終Handle DOM: (${handleDomX.toFixed(1)}, ${handleDomY.toFixed(1)})`);
        }

        // 🚨 座標精度保証のための検証（パーセンテージCanvas対応強化）
        const coordinateValidation = {
            isValidX: isFinite(handleDomX) && !isNaN(handleDomX),
            isValidY: isFinite(handleDomY) && !isNaN(handleDomY),
            isReasonableX: Math.abs(handleDomX) < 10000,
            isReasonableY: Math.abs(handleDomY) < 10000,
            // パーセンテージCanvas特有の検証
            canvasDisplaySizeValid: canvasRect.width > 0 && canvasRect.height > 0,
            canvasInternalSizeValid: this.canvas.width > 0 && this.canvas.height > 0,
            resolutionRatioReasonable: Math.abs((this.canvas.width / canvasRect.width) - 1) < 3 // 3倍以内の解像度差
        };
        
        if (!coordinateValidation.isValidX || !coordinateValidation.isValidY || 
            !coordinateValidation.isReasonableX || !coordinateValidation.isReasonableY ||
            !coordinateValidation.canvasDisplaySizeValid || !coordinateValidation.canvasInternalSizeValid) {
            console.warn('⚠️ ハンドル座標異常値検出（パーセンテージCanvas）:', {
                handleDomX, handleDomY, spineX, spineY, 
                canvasDisplay: `${canvasRect.width}x${canvasRect.height}`,
                canvasInternal: `${this.canvas.width}x${this.canvas.height}`,
                validation: coordinateValidation
            });
            return; // 異常値の場合は更新をスキップ
        }

        overlay.style.left = `${handleDomX}px`;
        overlay.style.top = `${handleDomY}px`;
    }
    /**
     * 視覚的フィードバックを更新
     */
    updateVisualFeedback() {
        // 全てのオーバーレイをデフォルト状態にリセット
        this.visualOverlays.forEach((overlay, characterId) => {
            overlay.style.borderColor = 'transparent';
        });

        // 選択中キャラクターに青色境界線を適用
        if (this.selectedCharacterId) {
            const selectedOverlay = this.visualOverlays.get(this.selectedCharacterId);
            if (selectedOverlay) {
                selectedOverlay.style.borderColor = '#007acc';
            }
        }
        
        // 全オーバーレイの位置を更新
        this.characters.forEach((character, characterId) => {
            this.updateOverlayPosition(characterId);
        });
    }
}