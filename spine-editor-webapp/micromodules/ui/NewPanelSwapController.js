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
     * 🚀 パネル入れ替えシステム初期化
     */
    async initialize() {
        console.log('🔧 新しいパネル入れ替えシステム初期化');
        
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
        
        console.log(`🚀 パネルドラッグ開始: ${panelId}`);
    }

    /**
     * 🔄 パネルドラッグ処理
     */
    handlePanelDrag(event) {
        if (!this.isDragging || !this.draggedPanel) return;
        
        // マウス下の要素を取得
        const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
        const targetPanel = elementBelow?.closest('.panel[data-panel]');
        
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
        
        console.log(`🎯 ドロップエリア検出: ${dropArea.type} on ${dropArea.panel.dataset.panel}`);
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
        console.log(`🔄 パネル入れ替え: ${draggedId} ↔ ${targetId}`);
        
        const draggedPanel = this.panelManager.findPanel(draggedId);
        const targetPanel = this.panelManager.findPanel(targetId);
        
        if (!draggedPanel || !targetPanel) {
            return { success: false, reason: 'Panel not found' };
        }
        
        // CSS Grid Area を入れ替え
        const draggedArea = getComputedStyle(draggedPanel.element).gridArea;
        const targetArea = getComputedStyle(targetPanel.element).gridArea;
        
        draggedPanel.element.style.gridArea = targetArea;
        targetPanel.element.style.gridArea = draggedArea;
        
        return { 
            success: true, 
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
     * 🎨 新しいレイアウト適用
     */
    applyNewLayout(layout) {
        if (!layout) {
            return { success: false, reason: 'No layout generated' };
        }
        
        try {
            // CSS Grid設定更新
            document.body.style.setProperty('grid-template-areas', layout.areas.join(' '), 'important');
            document.body.style.setProperty('grid-template-columns', layout.columns, 'important');
            document.body.style.setProperty('grid-template-rows', layout.rows, 'important');
            
            // パネル要素のgrid-area更新
            this.updatePanelGridAreas(layout);
            
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
        // 各パネルのgrid-areaを新しいレイアウトに合わせて更新
        this.panelManager.getAllPanels().forEach(panelId => {
            const panel = this.panelManager.findPanel(panelId);
            if (panel) {
                panel.element.style.gridArea = panelId;
            }
        });
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
    }

    /**
     * ❌ ドラッグキャンセル
     */
    cancelDrag() {
        console.log('❌ ドラッグキャンセル');
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
}

export default NewPanelSwapController;