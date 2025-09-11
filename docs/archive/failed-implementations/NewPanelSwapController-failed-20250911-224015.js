/**
 * NewPanelSwapController.js - 新しいパネル入れ替えシステム
 * 
 * 🎯 仕様書準拠の正しいパネル入れ替え機能
 * - 4つのドロップエリア（上下左右の辺 + 中央の面）
 * - 空白ゼロ原則（自動拡張による空間埋め）
 * - 隣接チェック（隣り合うエリアは無効）
 * - 直感的配置（ドロップした位置にそのまま配置）
 */
export class NewPanelSwapController {
    constructor(panelManager, layoutManager = null) {
        console.log('🚨 NewPanelSwapController 2024-09-11 14:40 最新版ロード確認');
        this.panelManager = panelManager;
        this.layoutManager = layoutManager;
        this.isDragging = false;
        this.draggedPanel = null;
        this.state = 'initializing';
        this.isUpdatingGridAreas = false;  // 🚨 重複実行防止フラグ
        
        // ドロップエリア設定
        this.dropAreaConfig = {
            edgeThreshold: 0.2,      // 辺エリアの幅（パネルの20%）
            centerThreshold: 0.6,    // 面エリアの幅（パネルの60%）
            highlightOpacity: 0.8,   // ハイライト透明度
            animationDuration: 200,  // アニメーション時間
            borderZoneWidth: 8,      // 境界線ドロップゾーンの幅
            borderTolerance: 4       // 境界線検出の許容範囲
        };
        
        // ドロップエリア状態
        this.dropAreas = {
            current: null,      // 現在のドロップエリア
            available: [],      // 利用可能なドロップエリア
            highlights: [],     // ハイライト要素
            borderZones: []     // 境界線ドロップゾーン
        };
        
        console.log('🎯 NewPanelSwapController初期化開始');
    }

    /**
     * 🎯 初期パネル配置設定
     */
    initializePanelGridAreas() {
        console.log('📍 初期パネル配置を設定中...');
        
        // 各パネルに初期のgrid-areaを設定
        this.panelManager.getAllPanels().forEach(panelId => {
            const panel = this.panelManager.findPanel(panelId);
            if (panel) {
                panel.element.style.gridArea = panelId;
                console.log(`  ${panelId}: grid-area設定完了`);
            }
        });
        
        console.log('✅ 初期パネル配置設定完了');
    }

    /**
     * 🚀 パネル入れ替えシステム初期化
     */
    async initialize() {
        console.log('🔧 新しいパネル入れ替えシステム初期化');
        
        // 初期パネル配置を設定（CSS削除対応）
        this.initializePanelGridAreas();
        
        try {
            // パネルにドラッグ機能を追加
            let initializedCount = 0;
            this.panelManager.getAllPanels().forEach(panelId => {
                const panel = this.panelManager.findPanel(panelId);
                if (panel) {
                    const header = panel.element.querySelector('.panel-header');
                    if (header) {
                        this.setupPanelDragEvents(header, panelId);
                        initializedCount++;
                    }
                }
            });
            
            // グローバルイベントリスナー設定
            this.setupGlobalEventListeners();
            
            // ドロップハイライト要素作成
            this.createDropHighlights();
            
            this.state = 'ready';
            console.log(`✅ 新しいパネル入れ替えシステム初期化完了: ${initializedCount}個のパネル`);
            return initializedCount;
            
        } catch (error) {
            console.error('❌ パネル入れ替えシステム初期化エラー:', error);
            this.state = 'error';
            return 0;
        }
    }

    /**
     * 🖱️ パネルドラッグイベント設定
     */
    setupPanelDragEvents(header, panelId) {
        console.log(`🔧 ドラッグイベント設定: ${panelId}`, header);
        header.addEventListener('mousedown', (e) => this.startPanelDrag(e, panelId));
        header.style.cursor = 'grab';
        
        // ホバー効果
        header.addEventListener('mouseenter', () => {
            if (!this.isDragging) {
                header.style.background = '#4a4a4a';
                header.style.transform = 'scale(1.02)';
            }
        });
        
        header.addEventListener('mouseleave', () => {
            if (!this.isDragging) {
                header.style.background = '';
                header.style.transform = '';
            }
        });
    }

    /**
     * 🌐 グローバルイベントリスナー設定
     */
    setupGlobalEventListeners() {
        document.addEventListener('mousemove', (e) => this.handlePanelDrag(e));
        document.addEventListener('mouseup', () => this.endPanelDrag());
        
        // ESCキーでドラッグキャンセル
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDragging) {
                this.cancelDrag();
            }
        });
    }

    /**
     * 🎨 ドロップハイライト要素作成
     */
    createDropHighlights() {
        // 4つのドロップエリア用ハイライト要素を作成
        const areaTypes = ['top', 'right', 'bottom', 'left', 'center'];
        
        areaTypes.forEach(type => {
            const highlight = document.createElement('div');
            highlight.className = `panel-drop-highlight panel-drop-${type}`;
            highlight.style.cssText = this.getHighlightStyle(type);
            document.body.appendChild(highlight);
            this.dropAreas.highlights.push({ type, element: highlight });
        });
        
        // 境界線ドロップエリア用ハイライト要素を作成
        const borderTypes = ['border-top', 'border-right', 'border-bottom', 'border-left'];
        
        borderTypes.forEach(type => {
            const highlight = document.createElement('div');
            highlight.className = `panel-drop-highlight panel-drop-${type}`;
            highlight.style.cssText = this.getBorderHighlightStyle(type);
            document.body.appendChild(highlight);
            this.dropAreas.highlights.push({ type, element: highlight });
        });
        
        console.log('🎨 ドロップハイライト要素作成完了');
    }

    /**
     * 🎨 境界線ドロップゾーンハイライト作成
     */
    createBorderZoneHighlights() {
        const borderTypes = ['horizontal', 'vertical'];
        
        borderTypes.forEach(type => {
            const borderZone = document.createElement('div');
            borderZone.className = `panel-border-zone panel-border-${type}`;
            borderZone.style.cssText = this.getBorderZoneStyle(type);
            document.body.appendChild(borderZone);
            this.dropAreas.borderZones.push({ type, element: borderZone });
        });
        
        console.log('🎨 境界線ドロップゾーンハイライト作成完了');
    }

    /**
     * 🎨 境界線ゾーンスタイル取得
     */
    getBorderZoneStyle(type) {
        const baseStyle = `
            position: fixed;
            pointer-events: none;
            opacity: 0;
            transition: all ${this.dropAreaConfig.animationDuration}ms ease;
            z-index: 1700;
            border-radius: 2px;
        `;
        
        const typeStyles = {
            'horizontal': `
                background: linear-gradient(90deg, 
                    rgba(0, 122, 204, 0.2) 0%, 
                    rgba(0, 122, 204, 0.6) 50%, 
                    rgba(0, 122, 204, 0.2) 100%);
                border: 1px solid #007acc;
                box-shadow: 0 0 8px rgba(0, 122, 204, 0.4);
                animation: borderPulse 1.5s ease-in-out infinite;
            `,
            'vertical': `
                background: linear-gradient(180deg, 
                    rgba(0, 122, 204, 0.2) 0%, 
                    rgba(0, 122, 204, 0.6) 50%, 
                    rgba(0, 122, 204, 0.2) 100%);
                border: 1px solid #007acc;
                box-shadow: 0 0 8px rgba(0, 122, 204, 0.4);
                animation: borderPulse 1.5s ease-in-out infinite;
            `
        };
        
        return baseStyle + typeStyles[type];
    }

    /**
     * 🎨 ハイライトスタイル取得
     */
    getHighlightStyle(type) {
        const baseStyle = `
            position: fixed;
            pointer-events: none;
            opacity: 0;
            transition: all ${this.dropAreaConfig.animationDuration}ms ease;
            z-index: 1600;
            border-radius: 4px;
        `;
        
        const typeStyles = {
            'top': `
                background: rgba(0, 255, 136, 0.3);
                border: 2px solid #00ff88;
                border-bottom: 3px solid #00ff88;
            `,
            'right': `
                background: rgba(0, 122, 204, 0.3);
                border: 2px solid #007acc;
                border-left: 3px solid #007acc;
            `,
            'bottom': `
                background: rgba(255, 187, 0, 0.3);
                border: 2px solid #ffbb00;
                border-top: 3px solid #ffbb00;
            `,
            'left': `
                background: rgba(255, 107, 107, 0.3);
                border: 2px solid #ff6b6b;
                border-right: 3px solid #ff6b6b;
            `,
            'center': `
                background: rgba(138, 43, 226, 0.3);
                border: 2px solid #8a2be2;
            `
        };
        
        return baseStyle + typeStyles[type];
    }

    /**
     * 🎨 境界線ハイライトスタイル取得
     */
    getBorderHighlightStyle(type) {
        const baseStyle = `
            position: fixed;
            pointer-events: none;
            opacity: 0;
            transition: all ${this.dropAreaConfig.animationDuration}ms ease;
            z-index: 1700;
            border-radius: 4px;
        `;
        
        const borderStyles = {
            'border-top': `
                background: linear-gradient(90deg, 
                    rgba(0, 122, 204, 0.2) 0%, 
                    rgba(0, 122, 204, 0.8) 50%, 
                    rgba(0, 122, 204, 0.2) 100%);
                border: 2px solid #007acc;
                box-shadow: 0 0 12px rgba(0, 122, 204, 0.6);
                animation: borderPulse 1.5s ease-in-out infinite;
            `,
            'border-right': `
                background: linear-gradient(180deg, 
                    rgba(0, 122, 204, 0.2) 0%, 
                    rgba(0, 122, 204, 0.8) 50%, 
                    rgba(0, 122, 204, 0.2) 100%);
                border: 2px solid #007acc;
                box-shadow: 0 0 12px rgba(0, 122, 204, 0.6);
                animation: borderPulse 1.5s ease-in-out infinite;
            `,
            'border-bottom': `
                background: linear-gradient(90deg, 
                    rgba(0, 122, 204, 0.2) 0%, 
                    rgba(0, 122, 204, 0.8) 50%, 
                    rgba(0, 122, 204, 0.2) 100%);
                border: 2px solid #007acc;
                box-shadow: 0 0 12px rgba(0, 122, 204, 0.6);
                animation: borderPulse 1.5s ease-in-out infinite;
            `,
            'border-left': `
                background: linear-gradient(180deg, 
                    rgba(0, 122, 204, 0.2) 0%, 
                    rgba(0, 122, 204, 0.8) 50%, 
                    rgba(0, 122, 204, 0.2) 100%);
                border: 2px solid #007acc;
                box-shadow: 0 0 12px rgba(0, 122, 204, 0.6);
                animation: borderPulse 1.5s ease-in-out infinite;
            `
        };
        
        return baseStyle + borderStyles[type];
    }

    /**
     * 🚀 パネルドラッグ開始
     */
    startPanelDrag(event, panelId) {
        console.log(`🚀 パネルドラッグ開始: ${panelId}`, event);
        event.preventDefault();
        
        this.isDragging = true;
        this.draggedPanel = panelId;
        this.state = 'dragging';
        
        const header = event.currentTarget;
        header.classList.add('dragging');
        header.style.cursor = 'grabbing';
        
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        
        // ドラッグ中は全プレビューコンテンツのpointer-eventsを無効化
        this.disablePreviewPointerEvents();
        
        console.log(`🚀 パネルドラッグ開始: ${panelId}`);
    }

    /**
     * 🔄 パネルドラッグ処理
     */
    handlePanelDrag(event) {
        if (!this.isDragging || !this.draggedPanel) return;
        
        // マウス下の要素を取得（プレビューコンテンツ対策）
        let elementBelow = document.elementFromPoint(event.clientX, event.clientY);
        let targetPanel = elementBelow?.closest('.panel[data-panel]');
        
        // プレビューコンテンツ（iframe、canvas等）が邪魔をしている場合の対策
        if (!targetPanel) {
            // 一時的にpointer-eventsを無効化してパネルを検出
            const contentElements = document.querySelectorAll('.panel-content iframe, .panel-content canvas, .panel-content video, .panel-content embed');
            contentElements.forEach(el => el.style.pointerEvents = 'none');
            
            elementBelow = document.elementFromPoint(event.clientX, event.clientY);
            targetPanel = elementBelow?.closest('.panel[data-panel]');
            
            // pointer-eventsを復元
            contentElements.forEach(el => el.style.pointerEvents = '');
            
            console.log('🔍 プレビューコンテンツ対策によるパネル検出:', {
                found: !!targetPanel,
                panelId: targetPanel?.dataset?.panel,
                element: elementBelow
            });
        }
        
        if (targetPanel && targetPanel.dataset.panel !== this.draggedPanel) {
            // ドロップエリア判定
            const dropArea = this.detectDropArea(event, targetPanel);
            this.updateDropHighlight(dropArea, targetPanel);
        } else {
            // ハイライト非表示
            this.hideAllHighlights();
            this.dropAreas.current = null;
        }
    }

    /**
     * 🎯 境界線ドロップゾーン検出
     */
    detectBorderZone(event) {
        const allPanels = this.panelManager.getAllPanels()
            .map(id => this.panelManager.findPanel(id))
            .filter(panel => panel && panel.element && panel.id !== this.draggedPanel);
            
        // 隣接パネルペアを検出
        const adjacentPairs = this.findAdjacentPanelPairs(allPanels);
        
        for (const pair of adjacentPairs) {
            const borderLine = this.calculateBorderLine(pair.panel1, pair.panel2, pair.direction);
            if (this.isMouseOnBorderLine(event, borderLine)) {
                return {
                    type: 'border',
                    direction: pair.direction,
                    panel1: pair.panel1,
                    panel2: pair.panel2,
                    borderLine: borderLine
                };
            }
        }
        
        return null;
    }

    /**
     * 🔍 隣接パネルペア検出
     */
    findAdjacentPanelPairs(panels) {
        const pairs = [];
        
        for (let i = 0; i < panels.length; i++) {
            for (let j = i + 1; j < panels.length; j++) {
                const panel1 = panels[i];
                const panel2 = panels[j];
                
                const adjacency = this.calculateCurrentAdjacency(panel1.id, panel2.id);
                
                // 隣接している場合、方向を特定してペアに追加
                if (adjacency.right) {
                    pairs.push({ panel1, panel2, direction: 'vertical' }); // panel1の右辺 = panel2の左辺
                }
                if (adjacency.bottom) {
                    pairs.push({ panel1, panel2, direction: 'horizontal' }); // panel1の下辺 = panel2の上辺
                }
                if (adjacency.left) {
                    pairs.push({ panel1: panel2, panel2: panel1, direction: 'vertical' }); // panel2の右辺 = panel1の左辺
                }
                if (adjacency.top) {
                    pairs.push({ panel1: panel2, panel2: panel1, direction: 'horizontal' }); // panel2の下辺 = panel1の上辺
                }
            }
        }
        
        return pairs;
    }

    /**
     * 📏 境界線座標計算
     */
    calculateBorderLine(panel1, panel2, direction) {
        const rect1 = panel1.element.getBoundingClientRect();
        const rect2 = panel2.element.getBoundingClientRect();
        
        if (direction === 'vertical') {
            // 縦の境界線（panel1の右辺とpanel2の左辺の中央）
            const borderX = (rect1.right + rect2.left) / 2;
            const topY = Math.max(rect1.top, rect2.top);
            const bottomY = Math.min(rect1.bottom, rect2.bottom);
            
            return {
                direction: 'vertical',
                x: borderX,
                y1: topY,
                y2: bottomY,
                width: this.dropAreaConfig.borderZoneWidth,
                height: bottomY - topY
            };
        } else {
            // 横の境界線（panel1の下辺とpanel2の上辺の中央）
            const borderY = (rect1.bottom + rect2.top) / 2;
            const leftX = Math.max(rect1.left, rect2.left);
            const rightX = Math.min(rect1.right, rect2.right);
            
            return {
                direction: 'horizontal',
                x1: leftX,
                x2: rightX,
                y: borderY,
                width: rightX - leftX,
                height: this.dropAreaConfig.borderZoneWidth
            };
        }
    }

    /**
     * 🎯 マウスが境界線上にあるかチェック
     */
    isMouseOnBorderLine(event, borderLine) {
        const tolerance = this.dropAreaConfig.borderTolerance;
        
        if (borderLine.direction === 'vertical') {
            const isWithinX = Math.abs(event.clientX - borderLine.x) <= tolerance;
            const isWithinY = event.clientY >= borderLine.y1 && event.clientY <= borderLine.y2;
            return isWithinX && isWithinY;
        } else {
            const isWithinY = Math.abs(event.clientY - borderLine.y) <= tolerance;
            const isWithinX = event.clientX >= borderLine.x1 && event.clientX <= borderLine.x2;
            return isWithinY && isWithinX;
        }
    }

    /**
     * 🎯 ドロップエリア判定
     */
    detectDropArea(event, targetPanel) {
        const rect = targetPanel.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const width = rect.width;
        const height = rect.height;
        
        // エリア境界値計算
        const edgeW = width * this.dropAreaConfig.edgeThreshold;
        const edgeH = height * this.dropAreaConfig.edgeThreshold;
        const centerW = width * this.dropAreaConfig.centerThreshold;
        const centerH = height * this.dropAreaConfig.centerThreshold;
        const centerStartX = (width - centerW) / 2;
        const centerStartY = (height - centerH) / 2;
        
        // 隣接チェック
        const isAdjacent = this.checkAdjacency(this.draggedPanel, targetPanel.dataset.panel);
        
        // 境界線検出（隣接する辺の場合は統合ハイライト表示）
        if (x >= width - edgeW && isAdjacent.right) {
            return { type: 'right', panel: targetPanel, rect, adjacent: true, isBoundary: true };
        }
        if (x <= edgeW && isAdjacent.left) {
            return { type: 'left', panel: targetPanel, rect, adjacent: true, isBoundary: true };
        }
        if (y <= edgeH && isAdjacent.top) {
            return { type: 'top', panel: targetPanel, rect, adjacent: true, isBoundary: true };
        }
        if (y >= height - edgeH && isAdjacent.bottom) {
            return { type: 'bottom', panel: targetPanel, rect, adjacent: true, isBoundary: true };
        }
        
        // 通常のドロップエリア判定（非隣接の場合のみ）
        if (y <= edgeH && !isAdjacent.top) {
            return { type: 'top', panel: targetPanel, rect, adjacent: false };
        }
        if (x >= width - edgeW && !isAdjacent.right) {
            return { type: 'right', panel: targetPanel, rect, adjacent: false };
        }
        if (y >= height - edgeH && !isAdjacent.bottom) {
            return { type: 'bottom', panel: targetPanel, rect, adjacent: false };
        }
        if (x <= edgeW && !isAdjacent.left) {
            return { type: 'left', panel: targetPanel, rect, adjacent: false };
        }
        if (x >= centerStartX && x <= centerStartX + centerW && 
            y >= centerStartY && y <= centerStartY + centerH) {
            // CENTER検出ログは大量出力を防ぐためコメントアウト
            // console.log(`🎯 CENTER検出: ${targetPanel.dataset.panel}`);
            return { type: 'center', panel: targetPanel, rect, adjacent: false };
        }
        
        return null;
    }

    /**
     * 🔍 隣接チェック
     */
    checkAdjacency(draggedPanelId, targetPanelId) {
        // 現在のCSS Gridレイアウトから隣接関係を動的に判定
        return this.calculateCurrentAdjacency(draggedPanelId, targetPanelId);
    }

    /**
     * 🧮 現在のレイアウトから隣接関係を計算
     */
    calculateCurrentAdjacency(draggedPanelId, targetPanelId) {
        // 各パネルの現在の位置を取得
        const draggedElement = this.panelManager.findPanel(draggedPanelId)?.element;
        const targetElement = this.panelManager.findPanel(targetPanelId)?.element;
        
        if (!draggedElement || !targetElement) {
            return { top: false, right: false, bottom: false, left: false };
        }
        
        const draggedRect = draggedElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        
        // 隣接判定の許容誤差（1px）
        const tolerance = 1;
        
        // 各方向での隣接チェック
        const adjacency = {
            top: this.isAdjacent(draggedRect.bottom, targetRect.top, tolerance),      // ドラッグパネルの下辺 = ターゲットの上辺
            right: this.isAdjacent(draggedRect.left, targetRect.right, tolerance),   // ドラッグパネルの左辺 = ターゲットの右辺
            bottom: this.isAdjacent(draggedRect.top, targetRect.bottom, tolerance),  // ドラッグパネルの上辺 = ターゲットの下辺
            left: this.isAdjacent(draggedRect.right, targetRect.left, tolerance)     // ドラッグパネルの右辺 = ターゲットの左辺
        };
        
        // console.log(`🔍 隣接チェック: ${draggedPanelId} → ${targetPanelId}`, adjacency);
        return adjacency;
    }

    /**
     * 📏 座標の隣接判定
     */
    isAdjacent(coord1, coord2, tolerance) {
        const isAdj = Math.abs(coord1 - coord2) <= tolerance;
        // console.log(`📏 座標判定: ${coord1.toFixed(1)} vs ${coord2.toFixed(1)} = ${isAdj ? '隣接' : '非隣接'} (差: ${Math.abs(coord1 - coord2).toFixed(1)}px)`);
        return isAdj;
    }

    /**
     * 🎨 境界線ゾーンハイライト更新
     */
    updateBorderZoneHighlight(borderZone) {
        // 全てのハイライトを非表示
        this.hideAllHighlights();
        
        if (!borderZone) {
            this.dropAreas.current = null;
            return;
        }
        
        // 境界線ハイライトを表示
        const borderHighlight = this.dropAreas.borderZones.find(
            h => h.type === borderZone.direction
        );
        
        if (borderHighlight) {
            this.showBorderZoneHighlight(borderHighlight.element, borderZone);
            this.dropAreas.current = borderZone;
        }
        
        console.log(`🎯 境界線ドロップゾーン検出: ${borderZone.direction} between ${borderZone.panel1.id} and ${borderZone.panel2.id}`);
    }

    /**
     * 🎨 境界線ゾーンハイライト表示
     */
    showBorderZoneHighlight(highlight, borderZone) {
        const borderLine = borderZone.borderLine;
        
        if (borderLine.direction === 'vertical') {
            // 縦の境界線
            highlight.style.left = `${borderLine.x - borderLine.width / 2}px`;
            highlight.style.top = `${borderLine.y1}px`;
            highlight.style.width = `${borderLine.width}px`;
            highlight.style.height = `${borderLine.height}px`;
        } else {
            // 横の境界線
            highlight.style.left = `${borderLine.x1}px`;
            highlight.style.top = `${borderLine.y - borderLine.height / 2}px`;
            highlight.style.width = `${borderLine.width}px`;
            highlight.style.height = `${borderLine.height}px`;
        }
        
        highlight.style.opacity = this.dropAreaConfig.highlightOpacity;
    }

    /**
     * 🎨 ドロップハイライト更新
     */
    updateDropHighlight(dropArea, targetPanel) {
        // 全てのハイライトを非表示
        this.hideAllHighlights();
        
        if (!dropArea) {
            this.dropAreas.current = null;
            return;
        }
        
        // 重複ドロップエリアのフィルタリング（一時的に無効化 - 緊急修正）
        // const filteredDropArea = this.filterDuplicateDropAreas(dropArea, targetPanel);
        // if (!filteredDropArea) {
        //     this.dropAreas.current = null;
        //     return;
        // }
        
        // 対象のハイライトを表示（フィルタリング無効化）
        const highlight = this.dropAreas.highlights.find(h => h.type === dropArea.type);
        if (highlight) {
            this.showHighlight(highlight.element, dropArea);
            this.dropAreas.current = dropArea;
        }
        
        // ドロップエリア検出ログは大量出力を防ぐためコメントアウト
        // console.log(`🎯 ドロップエリア検出: ${dropArea.type} on ${dropArea.panel.dataset.panel}`);
    }

    /**
     * 🔍 重複ドロップエリアフィルタリング
     */
    filterDuplicateDropAreas(dropArea, targetPanel) {
        // 境界線ドロップゾーンが既に表示されている場合、通常のドロップエリアを隠す
        if (this.dropAreas.current && this.dropAreas.current.type === 'border') {
            return null;
        }
        
        // 隣接する辺のドロップエリアを統合処理
        const targetPanelId = targetPanel.dataset.panel;
        const adjacency = this.calculateCurrentAdjacency(this.draggedPanel, targetPanelId);
        
        // 隣接チェック結果に基づいて重複を回避
        if (dropArea.type === 'right' && adjacency.right) {
            // 既に隣接している右側は境界線として処理済み
            return null;
        }
        if (dropArea.type === 'left' && adjacency.left) {
            // 既に隣接している左側は境界線として処理済み
            return null;
        }
        if (dropArea.type === 'top' && adjacency.top) {
            // 既に隣接している上側は境界線として処理済み
            return null;
        }
        if (dropArea.type === 'bottom' && adjacency.bottom) {
            // 既に隣接している下側は境界線として処理済み
            return null;
        }
        
        return dropArea;
    }

    /**
     * 🎨 ハイライト表示
     */
    showHighlight(highlight, dropArea) {
        const rect = dropArea.rect;
        const edgeThickness = dropArea.isBoundary ? 60 : 40; // 境界線の場合は太く表示
        
        switch (dropArea.type) {
            case 'top':
                highlight.style.left = `${rect.left}px`;
                highlight.style.top = `${rect.top}px`;
                highlight.style.width = `${rect.width}px`;
                highlight.style.height = `${edgeThickness}px`;
                break;
                
            case 'right':
                highlight.style.left = `${rect.right - edgeThickness}px`;
                highlight.style.top = `${rect.top}px`;
                highlight.style.width = `${edgeThickness}px`;
                highlight.style.height = `${rect.height}px`;
                break;
                
            case 'bottom':
                highlight.style.left = `${rect.left}px`;
                highlight.style.top = `${rect.bottom - edgeThickness}px`;
                highlight.style.width = `${rect.width}px`;
                highlight.style.height = `${edgeThickness}px`;
                break;
                
            case 'left':
                highlight.style.left = `${rect.left}px`;
                highlight.style.top = `${rect.top}px`;
                highlight.style.width = `${edgeThickness}px`;
                highlight.style.height = `${rect.height}px`;
                break;
                
            case 'center':
                const centerSize = 0.6;
                const centerWidth = rect.width * centerSize;
                const centerHeight = rect.height * centerSize;
                highlight.style.left = `${rect.left + (rect.width - centerWidth) / 2}px`;
                highlight.style.top = `${rect.top + (rect.height - centerHeight) / 2}px`;
                highlight.style.width = `${centerWidth}px`;
                highlight.style.height = `${centerHeight}px`;
                break;
        }
        
        // 境界線の場合は特別なスタイルを適用
        if (dropArea.isBoundary) {
            highlight.style.background = 'linear-gradient(90deg, rgba(0, 122, 204, 0.3) 0%, rgba(138, 43, 226, 0.6) 50%, rgba(0, 122, 204, 0.3) 100%)';
            highlight.style.border = '3px solid #007acc';
            highlight.style.boxShadow = '0 0 15px rgba(0, 122, 204, 0.8)';
            highlight.style.animation = 'borderPulse 1.5s ease-in-out infinite';
        }
        
        highlight.style.opacity = this.dropAreaConfig.highlightOpacity;
    }

    /**
     * 🚫 全ハイライト非表示
     */
    hideAllHighlights() {
        // 通常のドロップエリアハイライトを非表示
        this.dropAreas.highlights.forEach(highlight => {
            highlight.element.style.opacity = '0';
        });
        
        // 境界線ドロップゾーンハイライトを非表示
        this.dropAreas.borderZones.forEach(borderZone => {
            borderZone.element.style.opacity = '0';
        });
    }

    /**
     * ✅ パネルドラッグ終了
     */
    endPanelDrag() {
        if (!this.isDragging) return;
        
        console.log('✅ パネルドラッグ終了処理開始');
        
        // ドロップ処理実行
        const dropResult = this.executeDrop();
        
        // クリーンアップ
        this.cleanupDragState();
        
        console.log('✅ パネルドラッグ完了', dropResult);
    }

    /**
     * 🎯 ドロップ実行
     */
    executeDrop() {
        if (!this.dropAreas.current) {
            return { success: false, reason: 'No valid drop area' };
        }
        
        const dropArea = this.dropAreas.current;
        
        console.log(`🎯 ドロップ実行: ${this.draggedPanel} (${dropArea.type})`);
        
        try {
            // 境界線ドロップの場合
            if (dropArea.type.startsWith('border-')) {
                return this.executeBorderDrop(dropArea);
            }
            
            // 通常のドロップエリアの場合
            const targetPanelId = dropArea.panel.dataset.panel;
            
            switch (dropArea.type) {
                case 'center':
                    console.log(`🔄 CENTER型ドロップ実行: ${this.draggedPanel} → ${targetPanelId}`);
                    console.log('🎯 CENTER入れ替え処理を開始します');
                    return this.executeSwap(this.draggedPanel, targetPanelId);
                    
                case 'top':
                    return this.executeVerticalSplit(this.draggedPanel, targetPanelId, 'top');
                    
                case 'bottom':
                    return this.executeVerticalSplit(this.draggedPanel, targetPanelId, 'bottom');
                    
                case 'left':
                    return this.executeHorizontalSplit(this.draggedPanel, targetPanelId, 'left');
                    
                case 'right':
                    return this.executeHorizontalSplit(this.draggedPanel, targetPanelId, 'right');
                    
                default:
                    return { success: false, reason: 'Unknown drop type' };
            }
        } catch (error) {
            console.error('❌ ドロップ実行エラー:', error);
            return { success: false, reason: error.message };
        }
    }

    /**
     * 🎯 境界線ドロップ実行
     */
    executeBorderDrop(dropArea) {
        const targetPanelId = dropArea.panel.dataset.panel;
        console.log(`🎯 境界線ドロップ実行: ${this.draggedPanel} → ${targetPanelId} (${dropArea.type})`);
        
        // 境界線ドロップは隣接パネル間への挿入として処理
        switch (dropArea.type) {
            case 'border-top':
                return this.executeVerticalSplit(this.draggedPanel, targetPanelId, 'top');
            case 'border-bottom':
                return this.executeVerticalSplit(this.draggedPanel, targetPanelId, 'bottom');
            case 'border-left':
                return this.executeHorizontalSplit(this.draggedPanel, targetPanelId, 'left');
            case 'border-right':
                return this.executeHorizontalSplit(this.draggedPanel, targetPanelId, 'right');
            default:
                return { success: false, reason: 'Unknown border drop type' };
        }
    }

    /**
     * 🔄 パネル入れ替え実行
     */
    executeSwap(draggedId, targetId) {
        console.log(`🔄 パネル入れ替え開始: ${draggedId} ↔ ${targetId}`);
        
        // CSS変更監視を開始
        this.startCSSMonitoring();
        
        // 実行前の状態を診断
        console.log('📋 実行前の状態:');
        this.diagnoseGridState();
        
        // 🎯 新アプローチ: Split方式のapplyNewLayoutを使用
        const newLayout = this.generateSwapLayout(draggedId, targetId);
        
        // Split方式と同じレイアウト適用メソッドを使用
        const result = this.applyNewLayout(newLayout);
        
        // 実行後の状態を診断（少し待ってから）
        setTimeout(() => {
            console.log('📋 実行後の状態:');
            this.diagnoseGridState();
            
            // 監視を停止
            setTimeout(() => {
                this.stopCSSMonitoring();
            }, 1000);
        }, 200);
        
        return result;
    }
    
    /**
     * 🔄 Swap用レイアウト生成
     */
    generateSwapLayout(draggedId, targetId) {
        console.log(`🔄 Swapレイアウト生成: ${draggedId} ↔ ${targetId}`);
        
        // 現在のgrid-template-areasを取得
        const bodyStyle = getComputedStyle(document.body);
        const currentAreas = bodyStyle.gridTemplateAreas;
        
        // grid-template-areasを汎用的に入れ替え
        const tempToken = `TEMP_${Date.now()}`;
        const newAreas = currentAreas
            .replace(new RegExp(draggedId, 'g'), tempToken)
            .replace(new RegExp(targetId, 'g'), draggedId)
            .replace(new RegExp(tempToken, 'g'), targetId);
        
        // Grid Template Areas文字列を正しい配列形式に変換
        const areasArray = newAreas.trim().split(/\s+/).reduce((acc, part, index, array) => {
            // 引用符で囲まれた行ごとにグループ化
            if (part.startsWith('"') && part.endsWith('"')) {
                acc.push(part);
            } else if (part.startsWith('"')) {
                // 引用符開始
                let line = part;
                let i = index + 1;
                while (i < array.length && !array[i].endsWith('"')) {
                    line += ' ' + array[i];
                    i++;
                }
                if (i < array.length) {
                    line += ' ' + array[i];
                }
                acc.push(line);
            }
            return acc;
        }, []);
        
        console.log('🔍 Swap詳細:', {
            元のAreas: bodyStyle.gridTemplateAreas,
            新しいAreas: newAreas,
            配列形式: areasArray
        });
        
        return {
            action: 'swap',
            areas: areasArray,
            columns: getComputedStyle(document.body).gridTemplateColumns,
            rows: getComputedStyle(document.body).gridTemplateRows,
            swapInfo: { draggedId, targetId }
        };
    }
    
    /**
     * 🔄 旧executeSwap実装（バックアップ用）
     */
    executeSwapOLD(draggedId, targetId) {
        console.log(`🔄 パネル入れ替え開始: ${draggedId} ↔ ${targetId}`);
        
        const draggedPanel = this.panelManager.findPanel(draggedId);
        const targetPanel = this.panelManager.findPanel(targetId);
        
        console.log('🔍 パネル検索結果:', {
            draggedPanel: draggedPanel ? draggedPanel.id : 'NOT_FOUND',
            targetPanel: targetPanel ? targetPanel.id : 'NOT_FOUND'
        });
        
        if (!draggedPanel || !targetPanel) {
            console.error('❌ パネルが見つかりません:', { draggedId, targetId });
            return { success: false, reason: 'Panel not found' };
        }
        
        // CSS Grid Area を入れ替え
        const draggedArea = getComputedStyle(draggedPanel.element).gridArea;
        const targetArea = getComputedStyle(targetPanel.element).gridArea;
        
        console.log('🔍 Grid Area情報:', {
            draggedPanel: { id: draggedId, currentArea: draggedArea, willBecome: targetArea },
            targetPanel: { id: targetId, currentArea: targetArea, willBecome: draggedArea }
        });
        
        console.log('🔍 実際のCSS設定前:', {
            draggedElement: draggedPanel.element.style.gridArea,
            targetElement: targetPanel.element.style.gridArea
        });
        
        // 🎯 新アプローチ: body のgrid-template-areasを直接変更
        console.log(`🔄 Grid レイアウト変更: ${draggedId} ↔ ${targetId}`);
        
        // 現在のgrid-template-areasを取得
        const bodyStyle = getComputedStyle(document.body);
        const currentAreas = bodyStyle.gridTemplateAreas;
        
        // grid-template-areasを汎用的に入れ替え
        const tempToken = `TEMP_${Date.now()}`;
        const newAreas = currentAreas
            .replace(new RegExp(draggedId, 'g'), tempToken)
            .replace(new RegExp(targetId, 'g'), draggedId)
            .replace(new RegExp(tempToken, 'g'), targetId);
        
        console.log('🔍 Grid変更詳細:', {
            変更前: currentAreas,
            変更後: newAreas,
            draggedId: draggedId,
            targetId: targetId
        });
        
        // bodyのgrid-template-areasを更新
        document.body.style.setProperty('grid-template-areas', newAreas, 'important');
        
        // 実際の適用確認
        const appliedAreas = getComputedStyle(document.body).gridTemplateAreas;
        console.log('✅ 適用結果:', appliedAreas === newAreas ? '成功' : '失敗');
        
        // 🎯 重要: 個別DOM要素のgrid-areaプロパティを直接更新
        console.log('🔧 個別要素のgrid-areaプロパティを直接更新...');
        console.log('🔍 更新前状態:', {
            [`${draggedId}.style.gridArea`]: draggedPanel.element.style.gridArea,
            [`${targetId}.style.gridArea`]: targetPanel.element.style.gridArea
        });
        
        // 🔧 連続入れ替え対応: Grid Template Areasの配置に要素を同期
        // 新しいGrid Template Areasの定義に合わせて要素を配置
        // newAreas例: "preview outliner properties" なら
        // - draggedPanelId の位置にいる要素 → targetPanel
        // - targetId の位置にいる要素 → draggedPanel
        
        // 🎯 重要: シンプルな入れ替え - 要素のgrid-areaを相手のIDに設定
        draggedPanel.element.style.gridArea = targetId;
        targetPanel.element.style.gridArea = draggedId;
        
        console.log('🔄 シンプル入れ替え実行:', {
            [`${draggedId}要素`]: `grid-area = "${targetId}"`,
            [`${targetId}要素`]: `grid-area = "${draggedId}"`
        });
        
        console.log('✅ 個別要素更新完了:', {
            [`${draggedId}.style.gridArea`]: draggedPanel.element.style.gridArea,
            [`${targetId}.style.gridArea`]: targetPanel.element.style.gridArea
        });
        
        // 変更後の確認
        const newDraggedArea = getComputedStyle(draggedPanel.element).gridArea;
        const newTargetArea = getComputedStyle(targetPanel.element).gridArea;
        
        console.log('✅ 入れ替え実行結果:', {
            draggedPanel: { id: draggedId, newArea: newDraggedArea, expected: targetArea },
            targetPanel: { id: targetId, newArea: newTargetArea, expected: draggedArea }
        });
        
        console.log('🔍 実際のCSS設定後:', {
            draggedElement: draggedPanel.element.style.gridArea,
            targetElement: targetPanel.element.style.gridArea
        });
        
        // より詳細な状態確認
        console.log('🔍 要素詳細確認:');
        console.log('  Dragged Panel:', {
            id: draggedId,
            element: draggedPanel.element,
            className: draggedPanel.element.className,
            computedGridArea: getComputedStyle(draggedPanel.element).gridArea,
            styleGridArea: draggedPanel.element.style.gridArea
        });
        console.log('  Target Panel:', {
            id: targetId,
            element: targetPanel.element,
            className: targetPanel.element.className,
            computedGridArea: getComputedStyle(targetPanel.element).gridArea,
            styleGridArea: targetPanel.element.style.gridArea
        });
        
        // 実際のDOM要素を直接確認
        console.log('🔧 DOM要素検証:');
        console.log(`  ${draggedId} element:`, draggedPanel.element);
        console.log(`  ${targetId} element:`, targetPanel.element);
        console.log(`  ${draggedId} computed style:`, getComputedStyle(draggedPanel.element));
        console.log(`  ${targetId} computed style:`, getComputedStyle(targetPanel.element));
        
        // 成功判定（Grid Template Areasアプローチ用）
        const finalAreas = getComputedStyle(document.body).gridTemplateAreas;
        const success = finalAreas === newAreas;
        console.log(`${success ? '✅' : '❌'} 入れ替え${success ? '成功' : '失敗'}`);
        console.log('🔍 成功判定詳細:', {
            期待値: newAreas,
            実際値: finalAreas,
            一致: success
        });
        
        // 手動確認用のテストコマンド表示
        console.log('🧪 手動テスト用コマンド（コンソールに貼り付けて実行）:');
        console.log(`  document.querySelector('[data-panel="${draggedId}"]').style.gridArea`);
        console.log(`  document.querySelector('[data-panel="${targetId}"]').style.gridArea`);
        console.log(`  getComputedStyle(document.querySelector('[data-panel="${draggedId}"]')).gridArea`);
        console.log(`  getComputedStyle(document.querySelector('[data-panel="${targetId}"]')).gridArea`);
        
        return { 
            success: success, 
            action: 'swap', 
            panels: [draggedId, targetId] 
        };
    }

    /**
     * 📐 縦分割実行
     */
    executeVerticalSplit(draggedId, targetId, position) {
        console.log(`📐 縦分割実行: ${draggedId} → ${targetId} (${position})`);
        
        // 新しいCSS Gridテンプレートを生成
        const newLayout = this.generateVerticalSplitLayout(draggedId, targetId, position);
        
        // レイアウト適用
        return this.applyNewLayout(newLayout);
    }

    /**
     * 📐 横分割実行
     */
    executeHorizontalSplit(draggedId, targetId, position) {
        console.log(`📐 横分割実行: ${draggedId} → ${targetId} (${position})`);
        
        // 新しいCSS Gridテンプレートを生成
        const newLayout = this.generateHorizontalSplitLayout(draggedId, targetId, position);
        
        // レイアウト適用
        return this.applyNewLayout(newLayout);
    }

    /**
     * 🎨 縦分割レイアウト生成
     */
    generateVerticalSplitLayout(draggedId, targetId, position) {
        // 基本的な実装：対象パネルの位置に応じてgrid-template-areasを動的生成
        const currentAreas = this.getCurrentGridAreas();
        
        // プレビューエリアでの分割（空白ゼロ原則適用）
        if (targetId === 'preview') {
            if (position === 'top') {
                // ドラッグパネルがプレビューの上に配置される場合
                if (draggedId === 'outliner') {
                    // outliner→previewの場合：左側を完全に埋める
                    return {
                        areas: [
                            '"header header header"',
                            `"${draggedId} ${draggedId} properties"`,
                            `"${targetId} ${targetId} properties"`,
                            '"timeline timeline timeline"'
                        ],
                        columns: '1fr 2fr var(--properties-width, 300px)',
                        rows: '60px auto 1fr var(--timeline-height, 200px)'
                    };
                } else {
                    // 他のパネル→previewの場合
                    return {
                        areas: [
                            '"header header header"',
                            `"outliner ${draggedId} properties"`,
                            `"outliner ${targetId} properties"`,
                            '"timeline timeline timeline"'
                        ],
                        columns: 'var(--outliner-width, 300px) 1fr var(--properties-width, 300px)',
                        rows: '60px auto 1fr var(--timeline-height, 200px)'
                    };
                }
            } else { // bottom
                // ドラッグパネルがプレビューの下に配置される場合
                if (draggedId === 'outliner') {
                    // outliner→previewの場合：左側を完全に埋める
                    return {
                        areas: [
                            '"header header header"',
                            `"${targetId} ${targetId} properties"`,
                            `"${draggedId} ${draggedId} properties"`,
                            '"timeline timeline timeline"'
                        ],
                        columns: '1fr 2fr var(--properties-width, 300px)',
                        rows: '60px 1fr auto var(--timeline-height, 200px)'
                    };
                } else {
                    // 他のパネル→previewの場合
                    return {
                        areas: [
                            '"header header header"',
                            `"outliner ${targetId} properties"`,
                            `"outliner ${draggedId} properties"`,
                            '"timeline timeline timeline"'
                        ],
                        columns: 'var(--outliner-width, 300px) 1fr var(--properties-width, 300px)',
                        rows: '60px 1fr auto var(--timeline-height, 200px)'
                    };
                }
            }
        }
        
        // プロパティパネルでの分割（空白ゼロ原則適用）
        if (targetId === 'properties') {
            if (position === 'top') {
                // アウトライナーがプロパティの上に配置される場合
                // 空白を作らず、プレビューを下に拡張
                return {
                    areas: [
                        '"header header header"',
                        `"${draggedId} ${draggedId} ${targetId}"`,
                        `"preview preview ${targetId}"`,
                        '"timeline timeline timeline"'
                    ],
                    columns: 'var(--outliner-width, 300px) 1fr var(--properties-width, 300px)',
                    rows: '60px auto 1fr var(--timeline-height, 200px)'
                };
            } else { // bottom
                // アウトライナーがプロパティの下に配置される場合
                // 空白を作らず、プレビューを上に拡張
                return {
                    areas: [
                        '"header header header"',
                        `"preview preview ${targetId}"`,
                        `"${draggedId} ${draggedId} ${targetId}"`,
                        '"timeline timeline timeline"'
                    ],
                    columns: 'var(--outliner-width, 300px) 1fr var(--properties-width, 300px)',
                    rows: '60px 1fr auto var(--timeline-height, 200px)'
                };
            }
        }
        
        // アウトライナーでの分割（空白ゼロ原則適用）
        if (targetId === 'outliner') {
            if (position === 'top') {
                // ドラッグパネルがアウトライナーの上に配置される場合
                // 空白を作らず、プレビューとプロパティを横に拡張
                return {
                    areas: [
                        '"header header header"',
                        `"${draggedId} preview properties"`,
                        `"${targetId} preview properties"`,
                        '"timeline timeline timeline"'
                    ],
                    columns: 'var(--outliner-width, 300px) 1fr var(--properties-width, 300px)',
                    rows: '60px auto 1fr var(--timeline-height, 200px)'
                };
            } else { // bottom
                // ドラッグパネルがアウトライナーの下に配置される場合
                // 空白を作らず、プレビューとプロパティを横に拡張
                return {
                    areas: [
                        '"header header header"',
                        `"${targetId} preview properties"`,
                        `"${draggedId} preview properties"`,
                        '"timeline timeline timeline"'
                    ],
                    columns: 'var(--outliner-width, 300px) 1fr var(--properties-width, 300px)',
                    rows: '60px 1fr auto var(--timeline-height, 200px)'
                };
            }
        }
        
        // タイムラインでの分割（新規実装）
        if (targetId === 'timeline') {
            if (position === 'top') {
                // ドラッグパネルがタイムラインの上に配置される場合
                return {
                    areas: [
                        '"header header header"',
                        '"outliner preview properties"',
                        `"${draggedId} ${draggedId} ${draggedId}"`,
                        `"${targetId} ${targetId} ${targetId}"`
                    ],
                    columns: 'var(--outliner-width, 300px) 1fr var(--properties-width, 300px)',
                    rows: '60px 1fr auto var(--timeline-height, 200px)'
                };
            } else { // bottom
                // ドラッグパネルがタイムラインの下に配置される場合
                return {
                    areas: [
                        '"header header header"',
                        '"outliner preview properties"',
                        `"${targetId} ${targetId} ${targetId}"`,
                        `"${draggedId} ${draggedId} ${draggedId}"`
                    ],
                    columns: 'var(--outliner-width, 300px) 1fr var(--properties-width, 300px)',
                    rows: '60px 1fr var(--timeline-height, 200px) auto'
                };
            }
        }
        
        // デフォルト（変更なし）
        return null;
    }

    /**
     * 🎨 横分割レイアウト生成
     */
    generateHorizontalSplitLayout(draggedId, targetId, position) {
        // 横分割の場合、空白エリアを埋める必要がある
        const currentAreas = this.getCurrentGridAreas();
        
        // アウトライナーでの横分割
        if (targetId === 'outliner') {
            if (position === 'left') {
                // 左にドラッグパネル、右にアウトライナー
                return {
                    areas: [
                        '"header header header header"',
                        `"${draggedId} ${targetId} preview properties"`,
                        '"timeline timeline timeline timeline"'
                    ],
                    columns: 'var(--outliner-width, 150px) var(--outliner-width, 150px) 1fr var(--properties-width, 300px)',
                    rows: '60px 1fr var(--timeline-height, 200px)'
                };
            } else if (position === 'right') {
                // 左にアウトライナー、右にドラッグパネル
                return {
                    areas: [
                        '"header header header header"',
                        `"${targetId} ${draggedId} preview properties"`,
                        '"timeline timeline timeline timeline"'
                    ],
                    columns: 'var(--outliner-width, 150px) var(--outliner-width, 150px) 1fr var(--properties-width, 300px)',
                    rows: '60px 1fr var(--timeline-height, 200px)'
                };
            }
        }
        
        // プレビューでの横分割
        if (targetId === 'preview') {
            if (position === 'left') {
                // 左にドラッグパネル、右にプレビューが拡張
                return {
                    areas: [
                        '"header header header header"',
                        `"outliner ${draggedId} ${targetId} properties"`,
                        '"timeline timeline timeline timeline"'
                    ],
                    columns: 'var(--outliner-width, 300px) auto 1fr var(--properties-width, 300px)',
                    rows: '60px 1fr var(--timeline-height, 200px)'
                };
            } else if (position === 'right') {
                // 左にプレビューが拡張、右にドラッグパネル
                return {
                    areas: [
                        '"header header header header"',
                        `"outliner ${targetId} ${draggedId} properties"`,
                        '"timeline timeline timeline timeline"'
                    ],
                    columns: 'var(--outliner-width, 300px) 1fr auto var(--properties-width, 300px)',
                    rows: '60px 1fr var(--timeline-height, 200px)'
                };
            }
        }
        
        // プロパティパネルでの横分割
        if (targetId === 'properties') {
            if (position === 'left') {
                // 左にドラッグパネル、右にプロパティ
                return {
                    areas: [
                        '"header header header header"',
                        `"outliner preview ${draggedId} ${targetId}"`,
                        '"timeline timeline timeline timeline"'
                    ],
                    columns: 'var(--outliner-width, 300px) 1fr var(--properties-width, 150px) var(--properties-width, 150px)',
                    rows: '60px 1fr var(--timeline-height, 200px)'
                };
            } else if (position === 'right') {
                // 左にプロパティ、右にドラッグパネル
                return {
                    areas: [
                        '"header header header header"',
                        `"outliner preview ${targetId} ${draggedId}"`,
                        '"timeline timeline timeline timeline"'
                    ],
                    columns: 'var(--outliner-width, 300px) 1fr var(--properties-width, 150px) var(--properties-width, 150px)',
                    rows: '60px 1fr var(--timeline-height, 200px)'
                };
            }
        }
        
        // タイムラインでの横分割（新規実装）
        if (targetId === 'timeline') {
            if (position === 'left') {
                // 左にドラッグパネル、右にタイムライン
                return {
                    areas: [
                        '"header header header header"',
                        '"outliner preview preview properties"',
                        `"${draggedId} ${draggedId} ${targetId} ${targetId}"`
                    ],
                    columns: 'var(--outliner-width, 300px) 1fr 1fr var(--properties-width, 300px)',
                    rows: '60px 1fr var(--timeline-height, 200px)'
                };
            } else if (position === 'right') {
                // 左にタイムライン、右にドラッグパネル
                return {
                    areas: [
                        '"header header header header"',
                        '"outliner preview preview properties"',
                        `"${targetId} ${targetId} ${draggedId} ${draggedId}"`
                    ],
                    columns: 'var(--outliner-width, 300px) 1fr 1fr var(--properties-width, 300px)',
                    rows: '60px 1fr var(--timeline-height, 200px)'
                };
            }
        }
        
        return null;
    }

    /**
     * 📋 現在のグリッドエリア取得
     */
    getCurrentGridAreas() {
        const computedStyle = getComputedStyle(document.body);
        return computedStyle.gridTemplateAreas;
    }

    /**
     * 🔍 CSS変更監視開始
     */
    startCSSMonitoring() {
        if (this.cssObserver) {
            this.cssObserver.disconnect();
        }
        
        this.cssObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const newAreas = getComputedStyle(document.body).gridTemplateAreas;
                    
                    // 🚨 干渉システム特定：呼び出し元を追跡
                    const stack = new Error().stack;
                    const stackLines = stack ? stack.split('\n') : [];
                    
                    console.log('🔍 CSS変更検出:', {
                        timestamp: new Date().toLocaleTimeString(),
                        newAreas: newAreas,
                        target: mutation.target.tagName,
                        stack: stackLines.slice(0, 8) // より詳細なスタックを表示
                    });
                    
                    // 🚨 最重要：どのファイル・関数が変更を行ったかを特定
                    const relevantStackLine = stackLines.find(line => 
                        line.includes('.js') && 
                        !line.includes('MutationObserver') && 
                        !line.includes('HTMLElement')
                    );
                    
                    if (relevantStackLine) {
                        console.log('🎯 変更実行元特定:', relevantStackLine.trim());
                    }
                }
            });
        });
        
        this.cssObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['style']
        });
        
        console.log('🔍 CSS変更監視を開始しました');
    }

    /**
     * 🔍 CSS変更監視停止
     */
    stopCSSMonitoring() {
        if (this.cssObserver) {
            this.cssObserver.disconnect();
            this.cssObserver = null;
            console.log('🔍 CSS変更監視を停止しました');
        }
    }

    /**
     * 🔍 CSS Grid詳細診断
     */
    diagnoseGridState() {
        console.log('🔍 ===== CSS Grid詳細診断 =====');
        
        // document.bodyのCSS Grid関連プロパティをすべて確認
        const bodyStyle = getComputedStyle(document.body);
        const inlineStyle = document.body.style;
        
        console.log('📋 Computed Style (実際に適用されている値):');
        console.log('  display:', bodyStyle.display);
        console.log('  grid-template-areas:', bodyStyle.gridTemplateAreas);
        console.log('  grid-template-columns:', bodyStyle.gridTemplateColumns);
        console.log('  grid-template-rows:', bodyStyle.gridTemplateRows);
        
        console.log('📋 Inline Style (直接設定された値):');
        console.log('  grid-template-areas:', inlineStyle.gridTemplateAreas);
        console.log('  grid-template-columns:', inlineStyle.gridTemplateColumns);
        console.log('  grid-template-rows:', inlineStyle.gridTemplateRows);
        
        // 各パネル要素の状態を確認
        console.log('📋 パネル要素の状態:');
        this.panelManager.getAllPanels().forEach(panelId => {
            const panel = this.panelManager.findPanel(panelId);
            if (panel) {
                const elementStyle = getComputedStyle(panel.element);
                console.log(`  ${panelId}:`, {
                    gridArea: elementStyle.gridArea,
                    display: elementStyle.display,
                    visibility: elementStyle.visibility,
                    opacity: elementStyle.opacity
                });
            }
        });
        
        console.log('🔍 ===== 診断完了 =====');
    }

    /**
     * 🎨 新しいレイアウト適用
     */
    applyNewLayout(layout) {
        if (!layout) {
            return { success: false, reason: 'No layout generated' };
        }
        
        try {
            console.log('🎨 レイアウト適用開始:', layout);
            
            // 適用前の状態を確認
            const beforeAreas = getComputedStyle(document.body).gridTemplateAreas;
            const beforeColumns = getComputedStyle(document.body).gridTemplateColumns;
            const beforeRows = getComputedStyle(document.body).gridTemplateRows;
            
            console.log('📋 適用前の状態:');
            console.log('  Areas:', beforeAreas);
            console.log('  Columns:', beforeColumns);
            console.log('  Rows:', beforeRows);
            
            // 🚨 実験的アプローチ: Swap時はパネル要素のgrid-area設定をせずにGrid Template Areasのみ変更
            const newAreas = layout.areas.join(' ');
            
            if (layout.action === 'swap') {
                console.log('🎯 完全Swap処理: Grid Template Areas + パネル要素grid-area同時設定');
                
                // 🚨 最強対策：競合システムを一時無効化
                this.disableConflictingSystems();
                
                // Grid Template Areas設定
                document.body.style.setProperty('grid-template-areas', newAreas, 'important');
                document.body.style.setProperty('grid-template-columns', layout.columns, 'important');
                document.body.style.setProperty('grid-template-rows', layout.rows, 'important');
                
                // 🚨 最重要：パネル要素のgrid-areaを同時に入れ替え
                if (layout.swapInfo) {
                    const { draggedId, targetId } = layout.swapInfo;
                    const panel1 = this.panelManager.findPanel(draggedId);
                    const panel2 = this.panelManager.findPanel(targetId);
                    
                    if (panel1 && panel2) {
                        // 🚨 最強CSS設定: cssTextを使った直接書き換え
                        console.log('🔧 CSS優先度問題対策: cssText直接書き換え実行');
                        
                        // 既存のgrid-area設定を完全に削除
                        panel1.element.style.removeProperty('grid-area');
                        panel2.element.style.removeProperty('grid-area');
                        
                        // 強制レンダリング
                        panel1.element.offsetHeight;
                        panel2.element.offsetHeight;
                        document.body.offsetHeight;
                        
                        // cssTextで直接設定（最高優先度）
                        const panel1CurrentCss = panel1.element.style.cssText;
                        const panel2CurrentCss = panel2.element.style.cssText;
                        
                        panel1.element.style.cssText = panel1CurrentCss + `grid-area: ${targetId} !important;`;
                        panel2.element.style.cssText = panel2CurrentCss + `grid-area: ${draggedId} !important;`;
                        
                        // 設定確認
                        const panel1Applied = getComputedStyle(panel1.element).gridArea;
                        const panel2Applied = getComputedStyle(panel2.element).gridArea;
                        
                        console.log('🔄 最強CSS設定結果:', {
                            [draggedId]: {
                                設定値: targetId,
                                適用値: panel1Applied,
                                成功: panel1Applied === targetId
                            },
                            [targetId]: {
                                設定値: draggedId,
                                適用値: panel2Applied,
                                成功: panel2Applied === draggedId
                            }
                        });
                    }
                }
                
                // 結果確認
                setTimeout(() => {
                    const finalAreas = getComputedStyle(document.body).gridTemplateAreas;
                    console.log('🎯 Swap完了確認:', {
                        設定値: newAreas,
                        最終結果: finalAreas,
                        Grid成功: finalAreas === newAreas,
                        視覚的入れ替え: '✅ パネル要素grid-areaも変更済み'
                    });
                }, 50);
                
                // 🚨 最強対策：競合システムを再有効化（遅延）
                setTimeout(() => {
                    this.enableConflictingSystems();
                }, 1000);
                
                return { 
                    success: true, 
                    action: 'complete_swap',
                    layout: layout
                };
            }
            
            // 従来処理（Split時）
            // CSS Grid設定更新
            document.body.style.setProperty('grid-template-areas', newAreas, 'important');
            document.body.style.setProperty('grid-template-columns', layout.columns, 'important');
            document.body.style.setProperty('grid-template-rows', layout.rows, 'important');
            
            console.log('🔧 CSS適用完了:');
            console.log('  設定したAreas:', newAreas);
            console.log('  設定したColumns:', layout.columns);
            console.log('  設定したRows:', layout.rows);
            
            // 🚨 即座に確認（設定直後）
            const immediateAreas = getComputedStyle(document.body).gridTemplateAreas;
            const immediateColumns = getComputedStyle(document.body).gridTemplateColumns;
            const immediateInlineAreas = document.body.style.gridTemplateAreas;
            
            console.log('🚨 設定直後の即座確認:');
            console.log('  即座のComputedAreas:', immediateAreas);
            console.log('  即座のInlineAreas:', immediateInlineAreas);
            console.log('  設定値との一致:', immediateAreas === newAreas ? '✅ 一致' : '❌ 不一致');
            
            if (immediateAreas !== newAreas) {
                console.error('🚨 CSS設定が即座に無効化されています');
                console.log('期待:', newAreas);
                console.log('実際:', immediateAreas);
            }
            
            // 少し待ってから適用後の状態を確認
            setTimeout(() => {
                const afterAreas = getComputedStyle(document.body).gridTemplateAreas;
                const afterColumns = getComputedStyle(document.body).gridTemplateColumns;
                const afterRows = getComputedStyle(document.body).gridTemplateRows;
                
                console.log('✅ 適用後の実際の状態:');
                console.log('  実際のAreas:', afterAreas);
                console.log('  実際のColumns:', afterColumns);
                console.log('  実際のRows:', afterRows);
                
                // Swap時は特別処理：パネル要素のgrid-areaも確認
                if (layout.action === 'swap') {
                    console.log('🔄 Swap処理結果確認:');
                    console.log('  Grid Template Areas適用:', newAreas);
                    console.log('  最終結果:', afterAreas);
                    console.log('  Swap処理:', newAreas === afterAreas ? '✅ 成功' : '⚠️ CSS上書きが発生');
                } else {
                    // Split時のみ従来の変更検証を実行
                    const areasChanged = beforeAreas !== afterAreas;
                    const columnsChanged = beforeColumns !== afterColumns;
                    const rowsChanged = beforeRows !== afterRows;
                    
                    console.log('🔍 変更検証結果:');
                    console.log('  Areas変更:', areasChanged ? '✅ 成功' : '❌ 変更されていない');
                    console.log('  Columns変更:', columnsChanged ? '✅ 成功' : '❌ 変更されていない');
                    console.log('  Rows変更:', rowsChanged ? '✅ 成功' : '❌ 変更されていない');
                }
            }, 100);
            
            // 🎯 重要: CSS上書き回避のため、パネル要素のgrid-area更新を遅延実行
            // 🚨 重複実行防止フラグ
            if (this.isUpdatingGridAreas) {
                console.log('⚠️ パネルgrid-area更新が既に実行中のためスキップ');
                return { success: true, action: 'layout_change', layout: layout };
            }
            
            setTimeout(() => {
                this.isUpdatingGridAreas = true;
                console.log('🔒 パネルgrid-area更新開始（重複防止フラグ設定）');
                this.updatePanelGridAreas(layout);
                
                // 🚨 継続的な上書き対策：積極的監視・ブロックシステム
                let cssOverrideCounter = 0;
                const maxOverrideAttempts = 15;
                let monitoringInterval = null;
                
                const aggressiveMonitor = () => {
                    const currentAreas = getComputedStyle(document.body).gridTemplateAreas;
                    if (currentAreas !== newAreas) {
                        cssOverrideCounter++;
                        
                        // 🎯 上書き実行元を特定
                        const overrideStack = new Error().stack;
                        const overrideStackLines = overrideStack ? overrideStack.split('\n') : [];
                        const overrideSource = overrideStackLines.find(line => 
                            line.includes('.js') && 
                            !line.includes('aggressiveMonitor') &&
                            !line.includes('NewPanelSwapController')
                        );
                        
                        console.log(`🚨 CSS上書き検出 #${cssOverrideCounter}:`, {
                            現在: currentAreas,
                            期待: newAreas,
                            検出時刻: new Date().toLocaleTimeString(),
                            上書き実行元: overrideSource ? overrideSource.trim() : '特定不可',
                            詳細スタック: overrideStackLines.slice(0, 6)
                        });
                        
                        if (cssOverrideCounter <= maxOverrideAttempts) {
                            // 即座に強制再適用
                            document.body.style.setProperty('grid-template-areas', newAreas, 'important');
                            document.body.style.setProperty('grid-template-columns', layout.columns, 'important');
                            document.body.style.setProperty('grid-template-rows', layout.rows, 'important');
                            
                            // パネル要素も強制的に再設定
                            if (layout.swapInfo) {
                                const { draggedId, targetId } = layout.swapInfo;
                                const panel1 = this.panelManager.findPanel(draggedId);
                                const panel2 = this.panelManager.findPanel(targetId);
                                if (panel1 && panel2) {
                                    panel1.element.style.setProperty('grid-area', targetId, 'important');
                                    panel2.element.style.setProperty('grid-area', draggedId, 'important');
                                    console.log(`🔧 パネル要素grid-area強制再設定: ${draggedId}↔${targetId}`);
                                }
                            }
                            
                            // 次回チェックを続ける
                            setTimeout(aggressiveMonitor, 25);
                        } else {
                            console.error(`❌ CSS上書きブロック失敗: ${maxOverrideAttempts}回試行後も上書きが続いています`);
                            if (monitoringInterval) {
                                clearInterval(monitoringInterval);
                                monitoringInterval = null;
                            }
                        }
                    } else {
                        console.log('✅ CSS設定が維持されています');
                    }
                };
                
                // 即座開始と継続監視
                setTimeout(aggressiveMonitor, 10);
                setTimeout(aggressiveMonitor, 30);
                setTimeout(aggressiveMonitor, 60);
                
                // 継続的な監視を開始（1秒間）
                monitoringInterval = setInterval(() => {
                    aggressiveMonitor();
                }, 100);
                
                // 1秒後に監視終了とフラグリセット
                setTimeout(() => {
                    if (monitoringInterval) {
                        clearInterval(monitoringInterval);
                        monitoringInterval = null;
                    }
                    // 🔓 重複防止フラグをリセット
                    this.isUpdatingGridAreas = false;
                    console.log(`🔓 積極的監視完了（${cssOverrideCounter}回上書き検出・ブロック）`);
                }, 1000);
            }, 10);
            
            return { 
                success: true, 
                action: 'layout_change',
                layout: layout
            };
        } catch (error) {
            console.error('❌ レイアウト適用エラー:', error);
            return { success: false, reason: error.message };
        }
    }

    /**
     * 📍 パネルgrid-area更新
     */
    updatePanelGridAreas(layout) {
        console.log('📍 パネルgrid-area更新開始');
        console.log('📍 レイアウトアクション:', layout.action);
        
        if (layout.action === 'swap') {
            // Swap時は特別処理：パネル要素のgrid-areaを実際に入れ替える
            this.updateSwapPanelGridAreas(layout);
        } else {
            // Split時は通常処理：各パネルを自分のIDに設定
            this.panelManager.getAllPanels().forEach(panelId => {
                const panel = this.panelManager.findPanel(panelId);
                if (panel) {
                    const beforeGridArea = getComputedStyle(panel.element).gridArea;
                    panel.element.style.gridArea = panelId;
                    
                    setTimeout(() => {
                        const afterGridArea = getComputedStyle(panel.element).gridArea;
                        console.log(`📍 ${panelId}:`, {
                            before: beforeGridArea,
                            set: panelId,
                            after: afterGridArea,
                            changed: beforeGridArea !== afterGridArea
                        });
                    }, 50);
                } else {
                    console.warn(`⚠️ パネルが見つかりません: ${panelId}`);
                }
            });
        }
        
        console.log('📍 パネルgrid-area更新完了');
    }

    /**
     * 🔄 Swap専用grid-area更新
     */
    updateSwapPanelGridAreas(layout) {
        console.log('🔄 Swap専用grid-area更新開始');
        
        // layoutから入れ替えられた2つのパネルを特定
        // layout.swapInfo があれば使用、なければ推測
        if (layout.swapInfo) {
            const { draggedId, targetId } = layout.swapInfo;
            this.performPanelGridAreaSwap(draggedId, targetId);
        } else {
            // layoutから推測（現在のgrid-template-areasと比較）
            const currentAreas = getComputedStyle(document.body).gridTemplateAreas;
            const newAreas = layout.areas.join(' ');
            
            console.log('🔍 Swap推測分析:');
            console.log('  現在:', currentAreas);
            console.log('  新規:', newAreas);
            
            // 簡単な推測：outliner と preview の入れ替えと仮定
            this.performPanelGridAreaSwap('outliner', 'preview');
        }
        
        console.log('🔄 Swap専用grid-area更新完了');
    }

    /**
     * 🔄 パネルgrid-area入れ替え実行
     */
    performPanelGridAreaSwap(panelId1, panelId2) {
        console.log(`🔄 パネルgrid-area入れ替え実行: ${panelId1} ↔ ${panelId2}`);
        
        const panel1 = this.panelManager.findPanel(panelId1);
        const panel2 = this.panelManager.findPanel(panelId2);
        
        if (!panel1 || !panel2) {
            console.error('❌ 入れ替え対象パネルが見つかりません:', { panel1: !!panel1, panel2: !!panel2 });
            return;
        }
        
        // 入れ替え前の現在のgrid-area値を取得
        const currentGridArea1 = getComputedStyle(panel1.element).gridArea;
        const currentGridArea2 = getComputedStyle(panel2.element).gridArea;
        
        console.log('🔄 入れ替え前の現在の状態:', {
            [`${panelId1}要素`]: currentGridArea1,
            [`${panelId2}要素`]: currentGridArea2
        });
        
        // 🎯 重要: 現在のgrid-area値を相互に交換する
        panel1.element.style.gridArea = currentGridArea2;  // panel1 → panel2の現在値
        panel2.element.style.gridArea = currentGridArea1;  // panel2 → panel1の現在値
        
        console.log('🔄 入れ替え設定完了:', {
            [`${panelId1}要素`]: `grid-area: ${currentGridArea2}`,
            [`${panelId2}要素`]: `grid-area: ${currentGridArea1}`
        });
        
        // 結果を確認
        setTimeout(() => {
            const after1 = getComputedStyle(panel1.element).gridArea;
            const after2 = getComputedStyle(panel2.element).gridArea;
            
            console.log('🔄 入れ替え結果確認:', {
                [`${panelId1}要素`]: { 
                    before: currentGridArea1, 
                    after: after1, 
                    success: after1 === currentGridArea2,
                    expected: currentGridArea2
                },
                [`${panelId2}要素`]: { 
                    before: currentGridArea2, 
                    after: after2, 
                    success: after2 === currentGridArea1,
                    expected: currentGridArea1
                }
            });
        }, 50);
    }

    /**
     * 🧹 ドラッグ状態クリーンアップ
     */
    cleanupDragState() {
        this.isDragging = false;
        this.draggedPanel = null;
        this.state = 'ready';
        this.dropAreas.current = null;
        
        // ハイライト非表示
        this.hideAllHighlights();
        
        // ドラッグ中のスタイルリセット
        const draggedHeader = document.querySelector('.panel-header.dragging');
        if (draggedHeader) {
            draggedHeader.classList.remove('dragging');
            draggedHeader.style.cursor = 'grab';
        }
        
        // ボディスタイルリセット
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        // ドラッグ終了時にproto-eventsを復元
        this.enablePreviewPointerEvents();
    }

    /**
     * 🔧 プレビューコンテンツのpointer-events無効化
     */
    disablePreviewPointerEvents() {
        const contentElements = document.querySelectorAll('.panel-content iframe, .panel-content canvas, .panel-content video, .panel-content embed, .panel-content object');
        contentElements.forEach(el => {
            el.dataset.originalPointerEvents = el.style.pointerEvents || '';
            el.style.pointerEvents = 'none';
        });
        console.log('🔧 プレビューコンテンツのpointer-events無効化:', contentElements.length, '個');
    }
    
    /**
     * 🔧 プレビューコンテンツのpointer-events復元
     */
    enablePreviewPointerEvents() {
        const contentElements = document.querySelectorAll('.panel-content iframe, .panel-content canvas, .panel-content video, .panel-content embed, .panel-content object');
        contentElements.forEach(el => {
            el.style.pointerEvents = el.dataset.originalPointerEvents || '';
            delete el.dataset.originalPointerEvents;
        });
        console.log('✅ プレビューコンテンツのpointer-events復元:', contentElements.length, '個');
    }

    /**
     * ❌ ドラッグキャンセル
     */
    cancelDrag() {
        console.log('❌ ドラッグキャンセル');
        this.enablePreviewPointerEvents();  // pointer-events復元
        this.cleanupDragState();
    }

    /**
     * 📊 デバッグ情報取得
     */
    getDebugInfo() {
        return {
            state: this.state,
            isDragging: this.isDragging,
            draggedPanel: this.draggedPanel,
            currentDropArea: this.dropAreas.current?.type || 'none',
            highlightCount: this.dropAreas.highlights.length,
            config: this.dropAreaConfig
        };
    }

    /**
     * 🧹 クリーンアップ
     */
    cleanup() {
        if (this.isDragging) {
            this.cancelDrag();
        }
        
        // ハイライト要素削除
        this.dropAreas.highlights.forEach(highlight => {
            if (highlight.element && highlight.element.parentNode) {
                highlight.element.parentNode.removeChild(highlight.element);
            }
        });
        
        // 境界線ドロップゾーン要素削除
        this.dropAreas.borderZones.forEach(borderZone => {
            if (borderZone.element && borderZone.element.parentNode) {
                borderZone.element.parentNode.removeChild(borderZone.element);
            }
        });
        
        this.state = 'cleanup';
        console.log('🧹 NewPanelSwapController クリーンアップ完了');
    }

    /**
     * 🚨 競合システム一時無効化
     */
    disableConflictingSystems() {
        console.log('🚨 競合システム無効化開始');
        
        // LayoutManager無効化
        if (window.systemCoordinator?.layoutManager) {
            this._originalLayoutManagerUpdate = window.systemCoordinator.layoutManager.switchLayout;
            window.systemCoordinator.layoutManager.switchLayout = () => {
                console.log('⚠️ LayoutManager.switchLayout無効化中');
                return false;
            };
            console.log('✅ LayoutManager一時無効化');
        }
        
        // PanelSwapCoordinator無効化
        if (window.panelSwapCoordinator) {
            this._originalPanelSwapUpdate = window.panelSwapCoordinator.applyLayout;
            window.panelSwapCoordinator.applyLayout = () => {
                console.log('⚠️ PanelSwapCoordinator.applyLayout無効化中');
                return { success: false, reason: 'Temporarily disabled' };
            };
            console.log('✅ PanelSwapCoordinator一時無効化');
        }
        
        // ResizeController無効化（完全停止）
        if (window.systemCoordinator?.resizeController) {
            this._originalResizeHandlerUpdate = window.systemCoordinator.resizeController.handleResize;
            
            // 🚨 最強対策: ResizeControllerのhandleResizeを安全な空関数で置き換え
            window.systemCoordinator.resizeController.handleResize = () => {
                console.log('🚫 ResizeController.handleResize ブロック中（NewPanelSwap作業中）');
            };
            
            // ResizeObserver も一時停止
            if (window.systemCoordinator.resizeController._resizeObserver) {
                this._originalResizeObserver = window.systemCoordinator.resizeController._resizeObserver;
                window.systemCoordinator.resizeController._resizeObserver.disconnect();
                window.systemCoordinator.resizeController._resizeObserver = null;
            }
            
            console.log('🚨 ResizeController完全停止（無限ループ対策）');
        }
        
        // 🚨 最強対策: window.resizeイベントも一時ブロック
        this._blockedResizeEvents = [];
        this._originalWindowResize = window.onresize;
        
        window.onresize = (event) => {
            console.log('🚫 resize イベントブロック中');
            this._blockedResizeEvents.push(event);
            return false;
        };
        
        // addEventListener形式のresizeリスナーもブロック
        this._originalAddEventListener = window.addEventListener;
        window.addEventListener = function(type, listener, options) {
            if (type === 'resize') {
                console.log('🚫 resize addEventListener ブロック中');
                return;
            }
            return this._originalAddEventListener.call(this, type, listener, options);
        }.bind(this);
        
        console.log('🎯 全競合システム無効化完了（resize イベントもブロック）');
    }
    
    /**
     * ✅ 競合システム再有効化
     */
    enableConflictingSystems() {
        console.log('✅ 競合システム再有効化開始');
        
        // LayoutManager復元
        if (window.systemCoordinator?.layoutManager && this._originalLayoutManagerUpdate) {
            window.systemCoordinator.layoutManager.switchLayout = this._originalLayoutManagerUpdate;
            delete this._originalLayoutManagerUpdate;
            console.log('🔄 LayoutManager再有効化');
        }
        
        // PanelSwapCoordinator復元
        if (window.panelSwapCoordinator && this._originalPanelSwapUpdate) {
            window.panelSwapCoordinator.applyLayout = this._originalPanelSwapUpdate;
            delete this._originalPanelSwapUpdate;
            console.log('🔄 PanelSwapCoordinator再有効化');
        }
        
        // ResizeController復元
        if (window.systemCoordinator?.resizeController && this._originalResizeHandlerUpdate) {
            window.systemCoordinator.resizeController.handleResize = this._originalResizeHandlerUpdate;
            delete this._originalResizeHandlerUpdate;
            
            // ResizeObserver も復元
            if (this._originalResizeObserver) {
                window.systemCoordinator.resizeController._resizeObserver = this._originalResizeObserver;
                delete this._originalResizeObserver;
            }
            
            console.log('🔄 ResizeController完全復元');
        }
        
        // resize イベントも復元
        if (this._originalWindowResize !== undefined) {
            window.onresize = this._originalWindowResize;
            delete this._originalWindowResize;
        }
        
        if (this._originalAddEventListener) {
            window.addEventListener = this._originalAddEventListener;
            delete this._originalAddEventListener;
        }
        
        // ブロックしたイベントは破棄（復元不要）
        if (this._blockedResizeEvents) {
            console.log(`🗑️ ブロックしたresizeイベント ${this._blockedResizeEvents.length}個を破棄`);
            delete this._blockedResizeEvents;
        }
        
        console.log('🎯 全競合システム再有効化完了（resize イベントも復元）');
    }
}

export default NewPanelSwapController;