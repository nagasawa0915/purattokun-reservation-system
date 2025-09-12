/**
 * SuperSimplePanelSwap.js - 超シンプルパネル入れ替えシステム
 * 機能: DOM要素の物理的交換による確実なパネル入れ替え
 * 設計思想: シンプル・確実・CSS Grid非依存
 */
export class SuperSimplePanelSwap {
    constructor() {
        this.state = 'initializing';
        this.isDragging = false;
        this.draggedElement = null;
        this.panels = new Map();
        
        // 🚨 重複実行防止フラグ
        this.isProcessingSwap = false;
        this.lastDragStartTime = 0;
        this.lastSwapTime = 0;
        this.dragStartCooldown = 200; // 200ms間隔でドラッグ開始制限
        
        console.log('🎯 SuperSimplePanelSwap初期化開始（シンプルDOM交換方式）');
    }

    /**
     * 初期化 - パネル要素を登録
     */
    initialize() {
        const panelSelectors = [
            { id: 'outliner', selector: '.panel-outliner, [data-panel="outliner"]' },
            { id: 'preview', selector: '.panel-preview, [data-panel="preview"]' },
            { id: 'properties', selector: '.panel-properties, [data-panel="properties"]' },
            { id: 'timeline', selector: '.panel-timeline, [data-panel="timeline"]' }
        ];

        let foundCount = 0;
        panelSelectors.forEach(({ id, selector }) => {
            const element = document.querySelector(selector);
            if (element) {
                this.panels.set(id, element);
                foundCount++;
                console.log(`✅ パネル登録: ${id}`);
            } else {
                console.warn(`⚠️ パネル要素が見つかりません: ${id} (${selector})`);
            }
        });

        if (foundCount > 0) {
            this.enableDragDrop();
            this.state = 'ready';
            console.log(`🎯 SuperSimplePanelSwap初期化完了: ${foundCount}個のパネル`);
            return foundCount;
        } else {
            console.error('❌ パネル要素が見つかりませんでした');
            this.state = 'error';
            return 0;
        }
    }

    /**
     * ドラッグ&ドロップ機能有効化
     */
    enableDragDrop() {
        this.panels.forEach((element, panelId) => {
            // ドラッグ可能に設定
            element.draggable = true;
            element.style.cursor = 'move';

            // ドラッグイベント設定
            element.addEventListener('dragstart', (e) => {
                const currentTime = Date.now();
                
                // 🚨 重複ドラッグ開始防止
                if (currentTime - this.lastDragStartTime < this.dragStartCooldown) {
                    console.log(`⚠️ ドラッグ開始クールダウン中: ${panelId} (${currentTime - this.lastDragStartTime}ms)`);
                    e.preventDefault();
                    return;
                }
                
                // 🚨 既にドラッグ中なら無視
                if (this.isDragging) {
                    console.log(`⚠️ 既にドラッグ中のため無視: ${panelId}`);
                    e.preventDefault();
                    return;
                }
                
                this.lastDragStartTime = currentTime;
                this.isDragging = true;
                this.draggedElement = { id: panelId, element: element };
                
                // 視覚フィードバック
                element.style.opacity = '0.5';
                
                console.log(`🚀 ドラッグ開始: ${panelId}`, {
                    element: element,
                    draggedElement: this.draggedElement,
                    timestamp: currentTime
                });
                
                // データ転送設定（HTML5 Drag & Drop API）
                e.dataTransfer.setData('text/plain', panelId);
                e.dataTransfer.effectAllowed = 'move';
            });

            element.addEventListener('dragend', (e) => {
                console.log(`✅ ドラッグ終了: ${panelId}`, {
                    isDragging: this.isDragging,
                    draggedElement: this.draggedElement,
                    isProcessingSwap: this.isProcessingSwap
                });
                
                // 🚨 スワップ処理中でなければ即座にクリア
                if (!this.isProcessingSwap) {
                    this.isDragging = false;
                    element.style.opacity = '1';
                    this.draggedElement = null;
                    console.log('🧹 ドラッグデータ即座クリア完了');
                } else {
                    // スワップ処理中なら少し待ってからクリア
                    setTimeout(() => {
                        if (!this.isProcessingSwap) {
                            this.isDragging = false;
                            element.style.opacity = '1';
                            this.draggedElement = null;
                            console.log('🧹 ドラッグデータ遅延クリア完了');
                        }
                    }, 150);
                }
            });

            // ドロップ受け入れ設定
            element.addEventListener('dragover', (e) => {
                e.preventDefault(); // ドロップを許可
                element.style.backgroundColor = 'rgba(0, 122, 204, 0.1)';
            });

            element.addEventListener('dragleave', (e) => {
                element.style.backgroundColor = '';
            });

            element.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopImmediatePropagation(); // 🚨 イベント重複発火防止
                element.style.backgroundColor = '';

                // 🚨 重複実行防止チェック（さらに強化）
                if (this.isProcessingSwap) {
                    console.log(`⚠️ スワップ処理中のため無視: ${panelId}`);
                    return;
                }
                
                // 🚨 同じタイミングでの処理を防ぐ
                const now = Date.now();
                if (this.lastSwapTime && (now - this.lastSwapTime) < 100) {
                    console.log(`⚠️ 直前のスワップから100ms未満のため無視: ${panelId}`);
                    return;
                }
                this.lastSwapTime = now;

                // ドラッグデータの詳細確認
                console.log('🔍 ドロップイベント詳細:', {
                    draggedElement: this.draggedElement,
                    isDragging: this.isDragging,
                    targetElement: element,
                    targetPanelId: panelId,
                    isProcessingSwap: this.isProcessingSwap
                });

                if (this.draggedElement && this.draggedElement.element !== element) {
                    // 🚨 スワップ処理開始フラグ設定（即座に設定）
                    this.isProcessingSwap = true;
                    
                    console.log(`🔄 パネル入れ替え実行: ${this.draggedElement.id} → ${panelId} (フラグ設定済み)`);
                    
                    const result = this.swapElements(this.draggedElement.element, element);
                    
                    // 🚨 スワップ処理完了後にフラグをクリア（即座にクリア）
                    this.isProcessingSwap = false;
                    console.log('🏁 スワップ処理完了フラグクリア（即座）');
                    
                    if (result.success) {
                        console.log(`✅ パネル入れ替え成功: ${this.draggedElement.id} ↔ ${panelId}`);
                    } else {
                        console.error(`❌ パネル入れ替え失敗: ${result.error}`);
                    }
                } else {
                    if (!this.draggedElement) {
                        console.error('❌ ドラッグデータが見つかりませんでした');
                    } else if (this.draggedElement.element === element) {
                        console.log('ℹ️ 同じパネルにドロップされました（処理スキップ）');
                    }
                }
            });
        });

        console.log('🎯 ドラッグ&ドロップ機能有効化完了');
    }

    /**
     * CSS Grid Area交換（核心機能）
     */
    swapElements(element1, element2) {
        try {
            console.log('🔄 CSS Grid Area交換開始...');
            
            // CSSクラスからパネルタイプを抽出
            const getClassPanel = (element) => {
                const match = element.className.match(/panel-(\w+)/);
                return match ? match[1] : null;
            };
            
            const panel1Type = getClassPanel(element1);
            const panel2Type = getClassPanel(element2);
            
            console.log(`🔍 パネルタイプ特定: ${panel1Type} ↔ ${panel2Type}`);
            
            if (!panel1Type || !panel2Type) {
                throw new Error(`パネルタイプが特定できません: ${panel1Type}, ${panel2Type}`);
            }
            
            // 1. CSSクラスを交換（最重要）
            element1.classList.remove(`panel-${panel1Type}`);
            element1.classList.add(`panel-${panel2Type}`);
            
            element2.classList.remove(`panel-${panel2Type}`);
            element2.classList.add(`panel-${panel1Type}`);
            
            // 2. Grid Area設定を明示的に交換（保険）
            element1.style.setProperty('grid-area', panel2Type, 'important');
            element2.style.setProperty('grid-area', panel1Type, 'important');
            
            // 3. data属性も交換（整合性保持）
            element1.setAttribute('data-panel', panel2Type);
            element2.setAttribute('data-panel', panel1Type);
            
            console.log(`✅ CSS Grid Area交換完了: ${panel1Type} ↔ ${panel2Type}`);
            
            // CSS Grid レイアウトの強制再計算
            this.forceGridRecalculation(element1, element2);
            
            // カスタムイベントを発火
            document.dispatchEvent(new CustomEvent('panelSwapped', {
                detail: { 
                    element1: element1, 
                    element2: element2,
                    panel1Type: panel1Type,
                    panel2Type: panel2Type,
                    method: 'css-grid-area-swap'
                }
            }));

            return { success: true };
            
        } catch (error) {
            console.error('❌ CSS Grid Area交換エラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * CSS Grid レイアウトの強制再計算
     * DOM交換後にGrid系統の再計算を促す複数の手法を適用
     */
    forceGridRecalculation(element1, element2) {
        try {
            console.log('🔧 CSS Grid強制再計算開始...');
            
            // 親要素（Grid Container）を特定
            const gridContainers = new Set();
            
            // 交換した要素の親要素を特定
            [element1, element2].forEach(element => {
                let parent = element.parentElement;
                while (parent) {
                    const computedStyle = window.getComputedStyle(parent);
                    if (computedStyle.display === 'grid' || computedStyle.display === 'inline-grid') {
                        gridContainers.add(parent);
                    }
                    parent = parent.parentElement;
                }
            });

            // Grid Containerが見つからない場合、document.bodyを対象とする
            if (gridContainers.size === 0) {
                gridContainers.add(document.body);
            }

            // 各Grid Containerに対して強制再計算を実行
            gridContainers.forEach(container => {
                this.applyGridRecalculationMethods(container);
            });

            console.log(`✅ CSS Grid強制再計算完了 (${gridContainers.size}個のコンテナ)`);
            
        } catch (error) {
            console.error('⚠️ CSS Grid強制再計算エラー:', error);
        }
    }

    /**
     * Grid再計算の複数手法を適用
     */
    applyGridRecalculationMethods(container) {
        // 手法1: 強制リフロー（getBoundingClientRect読み取り）
        const rect1 = container.getBoundingClientRect();
        
        // 手法2: offsetHeight読み取りによるレイアウトエンジン起動
        const height = container.offsetHeight;
        
        // 手法3: CSS Grid プロパティの一時的な変更→復元
        const originalDisplay = container.style.display;
        if (window.getComputedStyle(container).display.includes('grid')) {
            container.style.display = 'block';
            // 即座に元に戻す（リフローを誘発）
            container.offsetHeight; // 強制リフロー
            container.style.display = originalDisplay || '';
        }

        // 手法4: grid-template-areas の一時的な操作（適用可能な場合のみ）
        const computedStyle = window.getComputedStyle(container);
        if (computedStyle.gridTemplateAreas && computedStyle.gridTemplateAreas !== 'none') {
            const originalAreas = container.style.gridTemplateAreas;
            container.style.gridTemplateAreas = 'none';
            container.offsetHeight; // 強制リフロー
            container.style.gridTemplateAreas = originalAreas;
        }

        // 手法5: transform操作による再描画誘発
        const originalTransform = container.style.transform;
        container.style.transform = 'translateZ(0)';
        container.offsetHeight; // 強制リフロー
        container.style.transform = originalTransform;

        // 手法6: 最終確認のためのgetBoundingClientRect再読み取り
        const rect2 = container.getBoundingClientRect();
        
        console.log(`🔧 Grid再計算適用完了: ${container.tagName}${container.className ? '.' + container.className : ''}`);
    }

    /**
     * パネル配置リセット（NewPanelSwapController互換）
     */
    initializePanelGridAreas() {
        console.log('🔄 パネル配置リセット開始');
        
        // 各パネルを初期状態に戻す
        this.panels.forEach((element, panelId) => {
            // CSSクラスを正規化
            element.className = element.className.replace(/panel-\w+/g, `panel-${panelId}`);
            
            // Grid Area設定をクリア（CSS本来の設定を使用）
            element.style.removeProperty('grid-area');
            
            // data属性を初期値に戻す
            element.setAttribute('data-panel', panelId);
            
            console.log(`✅ パネル初期化: ${panelId}`);
        });
        
        // CSS Grid強制再計算
        this.forceGridRecalculation(document.body);
        
        console.log('✅ パネル配置リセット完了');
        return this.panels.size;
    }

    /**
     * 状態取得
     */
    getDebugInfo() {
        return {
            state: this.state,
            isDragging: this.isDragging,
            isProcessingSwap: this.isProcessingSwap,
            panelCount: this.panels.size,
            lastDragStartTime: this.lastDragStartTime,
            method: 'css-grid-area-swap'
        };
    }

    /**
     * クリーンアップ
     */
    cleanup() {
        this.panels.forEach((element) => {
            element.draggable = false;
            element.style.cursor = '';
            element.style.opacity = '';
            element.style.backgroundColor = '';
            
            // イベントリスナーはブラウザが自動削除
        });
        
        this.panels.clear();
        
        // 🚨 フラグもクリア
        this.isDragging = false;
        this.isProcessingSwap = false;
        this.draggedElement = null;
        this.lastDragStartTime = 0;
        
        this.state = 'cleanup';
        console.log('🧹 SuperSimplePanelSwapクリーンアップ完了');
    }
}

export default SuperSimplePanelSwap;