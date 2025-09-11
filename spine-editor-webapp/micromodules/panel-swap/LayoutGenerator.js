/**
 * LayoutGenerator.js - レイアウト生成マイクロモジュール
 * 
 * 🎯 責務：CSS Grid レイアウトの生成のみに専念
 * - ドロップタイプに基づくレイアウト計算
 * - 空白ゼロ原則の適用
 * - シンプルな設定オブジェクトの返却
 */
export class LayoutGenerator {
    constructor(config = {}) {
        this.config = {
            defaultColumns: 'var(--outliner-width, 300px) 1fr var(--properties-width, 300px)',
            defaultRows: '60px 1fr var(--timeline-height, 200px)',
            headerHeight: '60px',
            timelineHeight: 'var(--timeline-height, 200px)',
            ...config
        };
    }

    /**
     * 🎨 レイアウト生成メイン関数
     */
    generateLayout(dropData) {
        if (!dropData) return null;

        const { type, target } = dropData;
        const draggedId = dropData.draggedPanel;
        const targetId = target.id;

        console.log(`🎨 レイアウト生成: ${draggedId} → ${targetId} (${type})`);

        switch (type) {
            case 'center':
                return this.generateSwapLayout(draggedId, targetId);
            case 'top':
            case 'bottom':
                return this.generateVerticalSplitLayout(draggedId, targetId, type);
            case 'left':
            case 'right':
                return this.generateHorizontalSplitLayout(draggedId, targetId, type);
            default:
                return null;
        }
    }

    /**
     * 🔄 スワップレイアウト生成
     */
    generateSwapLayout(draggedId, targetId) {
        return {
            type: 'swap',
            action: 'swap_panels',
            panels: [draggedId, targetId],
            // CSS Grid変更なし（パネル要素のgrid-areaのみ入れ替え）
            areas: null,
            columns: null,
            rows: null
        };
    }

    /**
     * 📐 縦分割レイアウト生成
     */
    generateVerticalSplitLayout(draggedId, targetId, position) {
        const layouts = {
            // プレビューエリアでの分割
            preview: {
                top: {
                    outliner: {
                        areas: [
                            '"header header header"',
                            `"${draggedId} ${draggedId} properties"`,
                            `"${targetId} ${targetId} properties"`,
                            '"timeline timeline timeline"'
                        ],
                        columns: '1fr 2fr var(--properties-width, 300px)',
                        rows: '60px auto 1fr var(--timeline-height, 200px)'
                    },
                    default: {
                        areas: [
                            '"header header header"',
                            `"outliner ${draggedId} properties"`,
                            `"outliner ${targetId} properties"`,
                            '"timeline timeline timeline"'
                        ],
                        columns: this.config.defaultColumns,
                        rows: '60px auto 1fr var(--timeline-height, 200px)'
                    }
                },
                bottom: {
                    outliner: {
                        areas: [
                            '"header header header"',
                            `"${targetId} ${targetId} properties"`,
                            `"${draggedId} ${draggedId} properties"`,
                            '"timeline timeline timeline"'
                        ],
                        columns: '1fr 2fr var(--properties-width, 300px)',
                        rows: '60px 1fr auto var(--timeline-height, 200px)'
                    },
                    default: {
                        areas: [
                            '"header header header"',
                            `"outliner ${targetId} properties"`,
                            `"outliner ${draggedId} properties"`,
                            '"timeline timeline timeline"'
                        ],
                        columns: this.config.defaultColumns,
                        rows: '60px 1fr auto var(--timeline-height, 200px)'
                    }
                }
            },

            // プロパティパネルでの分割
            properties: {
                top: {
                    areas: [
                        '"header header header"',
                        `"${draggedId} ${draggedId} ${targetId}"`,
                        `"preview preview ${targetId}"`,
                        '"timeline timeline timeline"'
                    ],
                    columns: this.config.defaultColumns,
                    rows: '60px auto 1fr var(--timeline-height, 200px)'
                },
                bottom: {
                    areas: [
                        '"header header header"',
                        `"preview preview ${targetId}"`,
                        `"${draggedId} ${draggedId} ${targetId}"`,
                        '"timeline timeline timeline"'
                    ],
                    columns: this.config.defaultColumns,
                    rows: '60px 1fr auto var(--timeline-height, 200px)'
                }
            },

            // アウトライナーでの分割
            outliner: {
                top: {
                    areas: [
                        '"header header header"',
                        `"${draggedId} preview properties"`,
                        `"${targetId} preview properties"`,
                        '"timeline timeline timeline"'
                    ],
                    columns: this.config.defaultColumns,
                    rows: '60px auto 1fr var(--timeline-height, 200px)'
                },
                bottom: {
                    areas: [
                        '"header header header"',
                        `"${targetId} preview properties"`,
                        `"${draggedId} preview properties"`,
                        '"timeline timeline timeline"'
                    ],
                    columns: this.config.defaultColumns,
                    rows: '60px 1fr auto var(--timeline-height, 200px)'
                }
            },

            // タイムラインでの分割
            timeline: {
                top: {
                    areas: [
                        '"header header header"',
                        '"outliner preview properties"',
                        `"${draggedId} ${draggedId} ${draggedId}"`,
                        `"${targetId} ${targetId} ${targetId}"`
                    ],
                    columns: this.config.defaultColumns,
                    rows: '60px 1fr auto var(--timeline-height, 200px)'
                },
                bottom: {
                    areas: [
                        '"header header header"',
                        '"outliner preview properties"',
                        `"${targetId} ${targetId} ${targetId}"`,
                        `"${draggedId} ${draggedId} ${draggedId}"`
                    ],
                    columns: this.config.defaultColumns,
                    rows: '60px 1fr var(--timeline-height, 200px) auto'
                }
            }
        };

        const targetLayouts = layouts[targetId];
        if (!targetLayouts) return null;

        const positionLayouts = targetLayouts[position];
        if (!positionLayouts) return null;

        // draggedIdが特定のパネルの場合は専用レイアウト、そうでなければデフォルト
        const layout = positionLayouts[draggedId] || positionLayouts.default || positionLayouts;

        return {
            type: 'vertical_split',
            action: 'split_vertical',
            draggedPanel: draggedId,
            targetPanel: targetId,
            position: position,
            ...layout
        };
    }

    /**
     * 📐 横分割レイアウト生成
     */
    generateHorizontalSplitLayout(draggedId, targetId, position) {
        const layouts = {
            // アウトライナーでの横分割
            outliner: {
                left: {
                    areas: [
                        '"header header header header"',
                        `"${draggedId} ${targetId} preview properties"`,
                        '"timeline timeline timeline timeline"'
                    ],
                    columns: 'var(--outliner-width, 150px) var(--outliner-width, 150px) 1fr var(--properties-width, 300px)',
                    rows: this.config.defaultRows
                },
                right: {
                    areas: [
                        '"header header header header"',
                        `"${targetId} ${draggedId} preview properties"`,
                        '"timeline timeline timeline timeline"'
                    ],
                    columns: 'var(--outliner-width, 150px) var(--outliner-width, 150px) 1fr var(--properties-width, 300px)',
                    rows: this.config.defaultRows
                }
            },

            // プレビューでの横分割
            preview: {
                left: {
                    areas: [
                        '"header header header header"',
                        `"outliner ${draggedId} ${targetId} properties"`,
                        '"timeline timeline timeline timeline"'
                    ],
                    columns: 'var(--outliner-width, 300px) auto 1fr var(--properties-width, 300px)',
                    rows: this.config.defaultRows
                },
                right: {
                    areas: [
                        '"header header header header"',
                        `"outliner ${targetId} ${draggedId} properties"`,
                        '"timeline timeline timeline timeline"'
                    ],
                    columns: 'var(--outliner-width, 300px) 1fr auto var(--properties-width, 300px)',
                    rows: this.config.defaultRows
                }
            },

            // プロパティパネルでの横分割
            properties: {
                left: {
                    areas: [
                        '"header header header header"',
                        `"outliner preview ${draggedId} ${targetId}"`,
                        '"timeline timeline timeline timeline"'
                    ],
                    columns: 'var(--outliner-width, 300px) 1fr var(--properties-width, 150px) var(--properties-width, 150px)',
                    rows: this.config.defaultRows
                },
                right: {
                    areas: [
                        '"header header header header"',
                        `"outliner preview ${targetId} ${draggedId}"`,
                        '"timeline timeline timeline timeline"'
                    ],
                    columns: 'var(--outliner-width, 300px) 1fr var(--properties-width, 150px) var(--properties-width, 150px)',
                    rows: this.config.defaultRows
                }
            },

            // タイムラインでの横分割
            timeline: {
                left: {
                    areas: [
                        '"header header header header"',
                        '"outliner preview preview properties"',
                        `"${draggedId} ${draggedId} ${targetId} ${targetId}"`
                    ],
                    columns: 'var(--outliner-width, 300px) 1fr 1fr var(--properties-width, 300px)',
                    rows: this.config.defaultRows
                },
                right: {
                    areas: [
                        '"header header header header"',
                        '"outliner preview preview properties"',
                        `"${targetId} ${targetId} ${draggedId} ${draggedId}"`
                    ],
                    columns: 'var(--outliner-width, 300px) 1fr 1fr var(--properties-width, 300px)',
                    rows: this.config.defaultRows
                }
            }
        };

        const targetLayouts = layouts[targetId];
        if (!targetLayouts) return null;

        const layout = targetLayouts[position];
        if (!layout) return null;

        return {
            type: 'horizontal_split',
            action: 'split_horizontal',
            draggedPanel: draggedId,
            targetPanel: targetId,
            position: position,
            ...layout
        };
    }

    /**
     * 📊 デバッグ情報
     */
    getDebugInfo() {
        return {
            config: this.config,
            supportedDropTypes: ['center', 'top', 'bottom', 'left', 'right'],
            supportedTargets: ['outliner', 'preview', 'properties', 'timeline']
        };
    }
}

export default LayoutGenerator;