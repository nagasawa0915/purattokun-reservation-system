# 🎭 Spineアウトライナー機能 詳細設計仕様書

**Version**: 1.0.0  
**作成日**: 2025-08-13  
**設計方針**: A案（シンプル・特定テンプレート前提）採用  
**目的**: v3.0哲学（シンプル・軽量・複雑化回避）準拠の確実な実装

---

## 📋 設計方針確定

### 基本戦略
- **A案（シンプル・特定テンプレート前提）を先行実装**
- **段階的汎用化**: 実運用ログから優先度決定
- **v3.0哲学厳守**: 必要最小限・シンプル設計・軽量性維持

### 実装優先順位
1. **Phase 1**: 基盤実装（2-3日） - 既存設計80%完成部分の実装
2. **Phase 2**: 座標系分離（1日） - 編集px/出力%基準システム
3. **Phase 3**: 統合テスト（1日） - デスクトップアプリ統合

---

## 🎯 技術仕様・制約条件

### HTML構造前提（必須）
```html
<!-- 固定ラッパー要素（必須） -->
<div class="spine-stage" data-spine-container="main">
  <!-- ここにCanvas要素を動的挿入 -->
</div>
```

### 技術制約
| 項目 | 制約内容 | 理由 |
|------|----------|------|
| **Spineバージョン** | 4.1.24固定 | 安定性重視・Physics問題回避 |
| **WebGLコンテキスト** | 1ページ1レンダラ規約 | コンテキスト競合防止 |
| **Z-index予約帯** | 1000-1999（Spine専用） | レイヤー競合回避 |
| **座標基準** | 編集時ピクセル・出力時%基準 | 操作性と背景同期の両立 |

---

## 🔧 座標系分離設計（重要）

### 過去の問題と解決策
**過去の失敗**: 複数座標レイヤー混在 → 操作性低下  
**解決策**: 座標モード分離（編集時/出力時で切り替え）

### 編集時：ピクセル基準（操作性優先）
```javascript
// 編集モード座標（シンプル・直感的）
const editCoords = {
    x: 423,        // ピクセル値（直接操作）
    y: 562,        // ピクセル値（直接操作）
    scale: 1.0     // 基準スケール
};

// 編集用Canvas配置
canvas.style.cssText = `
    position: absolute;
    left: ${editCoords.x}px;
    top: ${editCoords.y}px;
    transform: scale(${editCoords.scale});
`;
```

### 出力時：%基準（背景同期）
```javascript
// 出力座標（背景画像同期・レスポンシブ対応）
const outputCoords = {
    left: '35%',   // 背景ズレ回避
    top: '75%',    // レスポンシブ対応
    scale: 0.55    // 表示サイズ調整
};

// CSS出力形式
const cssOutput = `
#spine-${characterId} {
    position: absolute;
    left: ${outputCoords.left};
    top: ${outputCoords.top};
    transform: scale(${outputCoords.scale});
}
`;
```

### 座標変換システム
```javascript
// 編集→出力座標変換
class CoordinateConverter {
    static editToOutput(editCoords, containerSize) {
        return {
            left: `${(editCoords.x / containerSize.width) * 100}%`,
            top: `${(editCoords.y / containerSize.height) * 100}%`,
            scale: editCoords.scale
        };
    }
    
    static outputToEdit(outputCoords, containerSize) {
        return {
            x: (parseFloat(outputCoords.left) / 100) * containerSize.width,
            y: (parseFloat(outputCoords.top) / 100) * containerSize.height,
            scale: outputCoords.scale
        };
    }
}
```

---

## 🎮 軽量WebGL統合仕様

### Canvas生成・配置（最小限実装）
```javascript
class SpineCanvasManager {
    constructor() {
        this.characterCount = 0;
        this.activeCanvases = new Map();
    }
    
    async addCharacterToPage(character, dropX, dropY) {
        // 1. 固定ラッパー要素の確認
        const stageContainer = this.findStageContainer();
        if (!stageContainer) {
            throw new Error('必須要素 .spine-stage が見つかりません');
        }
        
        // 2. Canvas要素作成（最小限設定）
        const canvas = this.createCanvas(character);
        
        // 3. 初期位置設定（ドロップ位置基準）
        this.setInitialPosition(canvas, dropX, dropY);
        
        // 4. Spine WebGL初期化
        await this.initializeSpineWebGL(canvas, character);
        
        // 5. 編集機能統合
        this.attachEditSystem(canvas);
        
        stageContainer.appendChild(canvas);
        return canvas;
    }
    
    createCanvas(character) {
        const canvas = document.createElement('canvas');
        canvas.id = `spine-${character.id}-${Date.now()}`;
        canvas.className = 'spine-character-canvas';
        canvas.width = 400;
        canvas.height = 400;
        
        // Z-index予約帯使用
        const zIndex = 1000 + this.characterCount++;
        canvas.style.cssText = `
            position: absolute;
            z-index: ${zIndex};
            pointer-events: auto;
            cursor: move;
        `;
        
        return canvas;
    }
    
    findStageContainer() {
        // iframe内のdocument対象
        const iframe = document.querySelector('.html-preview-iframe');
        const doc = iframe?.contentDocument || document;
        return doc.querySelector('.spine-stage');
    }
}
```

### Spine WebGL初期化（4.1.24固定）
```javascript
class SpineWebGLRenderer {
    constructor() {
        this.spineVersion = '4.1.24';  // 固定バージョン
        this.maxInitAttempts = 100;    // 10秒間待機
    }
    
    async initialize(canvas, character) {
        // 1. Spine WebGL CDN読み込み確認
        await this.waitForSpineWebGL();
        
        // 2. WebGLコンテキスト作成
        const gl = this.createWebGLContext(canvas);
        
        // 3. Spine レンダラー初期化
        const renderer = new spine.SceneRenderer(canvas, gl);
        
        // 4. アセット読み込み
        await this.loadCharacterAssets(renderer, character);
        
        // 5. アニメーション開始
        this.startDefaultAnimation(renderer, character);
        
        return renderer;
    }
    
    async waitForSpineWebGL() {
        let attempts = 0;
        while (typeof spine === 'undefined' && attempts < this.maxInitAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof spine === 'undefined') {
            throw new Error('Spine WebGL 4.1.24の読み込みに失敗しました');
        }
    }
    
    createWebGLContext(canvas) {
        const gl = canvas.getContext('webgl2', {
            alpha: false,
            antialias: true,
            powerPreference: 'high-performance'
        }) || canvas.getContext('webgl', {
            alpha: false,
            antialias: true
        });
        
        if (!gl) {
            throw new Error('WebGLコンテキストの作成に失敗しました');
        }
        
        return gl;
    }
}
```

---

## 📂 ファイル自動検出・アウトライナー

### Spineファイル検出システム
```javascript
class SpineFileDetector {
    constructor() {
        this.supportedExtensions = ['.json', '.atlas', '.png'];
        this.requiredFiles = ['json', 'atlas', 'png'];  // 3ファイルセット必須
    }
    
    async scanSpineAssets(folderPath) {
        const allFiles = await this.getAllFilesRecursively(folderPath);
        const spineGroups = this.groupSpineFiles(allFiles);
        const validCharacters = this.validateCharacters(spineGroups);
        
        return validCharacters.map(group => this.createCharacterData(group));
    }
    
    groupSpineFiles(allFiles) {
        const jsonFiles = allFiles.filter(f => f.endsWith('.json'));
        const groups = new Map();
        
        for (const jsonFile of jsonFiles) {
            const baseName = path.basename(jsonFile, '.json');
            const baseDir = path.dirname(jsonFile);
            
            // 対応する.atlas/.pngファイルを検索
            const atlasFile = path.join(baseDir, `${baseName}.atlas`);
            const pngFile = path.join(baseDir, `${baseName}.png`);
            
            if (allFiles.includes(atlasFile) && allFiles.includes(pngFile)) {
                groups.set(baseName, {
                    id: baseName,
                    name: baseName,
                    jsonPath: jsonFile,
                    atlasPath: atlasFile,
                    texturePath: pngFile,
                    folderPath: baseDir
                });
            }
        }
        
        return Array.from(groups.values());
    }
    
    validateCharacters(spineGroups) {
        return spineGroups.filter(group => {
            // ファイル存在確認
            const files = [group.jsonPath, group.atlasPath, group.texturePath];
            return files.every(file => this.fileExists(file));
        });
    }
}
```

### アウトライナーUI仕様
```javascript
class SpineOutlinerUI {
    constructor(container) {
        this.container = container;
        this.characters = new Map();
    }
    
    render(characters) {
        this.container.innerHTML = this.createHTML(characters);
        this.attachEventHandlers();
    }
    
    createHTML(characters) {
        const characterItems = characters.map(char => `
            <div class="spine-asset-item" 
                 draggable="true" 
                 data-character-id="${char.id}">
                <div class="asset-thumbnail">
                    <img src="${char.thumbnailPath || 'assets/default-spine.png'}" 
                         alt="${char.name}" width="40" height="40">
                </div>
                <div class="asset-info">
                    <div class="asset-name">${char.name}</div>
                    <div class="asset-animations">${char.animations.length} animations</div>
                </div>
                <div class="asset-actions">
                    <button class="preview-btn" data-character-id="${char.id}">👁️</button>
                </div>
            </div>
        `).join('');
        
        return `
            <div class="spine-outliner-header">
                <h3>🎭 Spineキャラクター</h3>
                <button class="load-spine-btn">📂 フォルダ選択</button>
            </div>
            <div class="spine-asset-list">
                ${characterItems || '<div class="no-assets">Spineフォルダを選択してください</div>'}
            </div>
        `;
    }
}
```

---

## 🎨 CSS・名前空間設計

### Spine専用名前空間
```css
/* spine-outliner.css */

/* アウトライナーUI */
.spine-outliner-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #e0e0e0;
}

.spine-asset-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid #f0f0f0;
    cursor: grab;
    transition: background-color 0.2s;
}

.spine-asset-item:hover {
    background-color: #f5f5f5;
}

.spine-asset-item:active {
    cursor: grabbing;
}

/* Spineキャラクター表示 */
.spine-character-canvas {
    /* 基本スタイル（名前空間内） */
    border: 2px solid transparent;
    border-radius: 4px;
    transition: border-color 0.2s;
}

.spine-character-canvas:hover {
    border-color: #667eea;
}

.spine-character-canvas.editing {
    border-color: #ff6b6b;
    box-shadow: 0 0 10px rgba(255, 107, 107, 0.3);
}

/* 編集ハンドル */
.spine-edit-handle {
    position: absolute;
    width: 10px;
    height: 10px;
    background: #667eea;
    border: 2px solid white;
    border-radius: 50%;
    cursor: pointer;
    z-index: 1100;
}

/* ドラッグ&ドロップ視覚効果 */
.spine-stage.drag-over {
    border: 2px dashed #667eea;
    background: rgba(102, 126, 234, 0.1);
}
```

---

## 🔄 ドラッグ&ドロップ仕様

### ドラッグ開始処理
```javascript
class DragDropHandler {
    constructor() {
        this.dragData = null;
    }
    
    setupDragEvents(outlinerContainer) {
        outlinerContainer.addEventListener('dragstart', (e) => {
            const item = e.target.closest('.spine-asset-item');
            if (!item) return;
            
            const characterId = item.dataset.characterId;
            const character = this.characters.get(characterId);
            
            if (character) {
                const dragData = {
                    type: 'spine-character',
                    characterId: characterId,
                    character: character
                };
                
                e.dataTransfer.setData('application/json', JSON.stringify(dragData));
                e.dataTransfer.effectAllowed = 'copy';
                
                // 視覚的フィードバック
                item.style.opacity = '0.7';
            }
        });
        
        outlinerContainer.addEventListener('dragend', (e) => {
            const item = e.target.closest('.spine-asset-item');
            if (item) {
                item.style.opacity = '1';
            }
        });
    }
    
    setupDropZone(previewContainer) {
        previewContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            previewContainer.classList.add('drag-over');
        });
        
        previewContainer.addEventListener('dragleave', (e) => {
            if (!previewContainer.contains(e.relatedTarget)) {
                previewContainer.classList.remove('drag-over');
            }
        });
        
        previewContainer.addEventListener('drop', async (e) => {
            e.preventDefault();
            previewContainer.classList.remove('drag-over');
            
            try {
                const data = JSON.parse(e.dataTransfer.getData('application/json'));
                if (data.type === 'spine-character') {
                    const rect = previewContainer.getBoundingClientRect();
                    const dropX = e.clientX - rect.left;
                    const dropY = e.clientY - rect.top;
                    
                    await this.addCharacterToPage(data.character, dropX, dropY);
                }
            } catch (error) {
                console.error('ドロップ処理エラー:', error);
            }
        });
    }
}
```

---

## 📊 実装計画・段階設計

### Phase 1: 基盤実装（2-3日）
```javascript
// 実装優先順序
Day 1: 
├── SpineFileDetector実装
├── SpineOutlinerUI基本表示
└── 基本ドラッグ&ドロップ

Day 2:
├── SpineCanvasManager実装
├── WebGLRenderer基本統合
└── .spine-stage連携

Day 3:
├── 座標変換システム
├── 編集機能統合
└── 基本テスト・調整
```

### Phase 2: 座標系分離（1日）
```javascript
Day 4:
├── CoordinateConverter実装
├── 編集px/出力%変換テスト
└── 背景同期確認
```

### Phase 3: 統合テスト（1日）
```javascript
Day 5:
├── デスクトップアプリ統合
├── 既存spine-edit-core.js連携
└── エラーハンドリング・最終調整
```

---

## 🚨 制約事項・注意点

### 必須前提条件
1. **HTMLに `.spine-stage` 要素が存在すること**
2. **Spine WebGL 4.1.24 CDNが読み込み済みであること**
3. **デスクトップアプリのファイル選択機能が動作していること**

### 制限事項
1. **Spine バージョン**: 4.1.24以外は非対応（明示エラー表示）
2. **同時レンダラー数**: 1ページ1レンダラー（複数は非対応）
3. **ファイル形式**: .json/.atlas/.png 3ファイルセットのみ対応

### エラーハンドリング
```javascript
// 主要エラーパターンと対応
const ErrorHandler = {
    SPINE_STAGE_NOT_FOUND: '.spine-stage要素が見つかりません',
    SPINE_WEBGL_LOAD_FAILED: 'Spine WebGL 4.1.24の読み込みに失敗',
    INVALID_FILE_SET: '必要なファイル(.json/.atlas/.png)が不足',
    WEBGL_CONTEXT_FAILED: 'WebGLコンテキストの作成に失敗',
    CHARACTER_LOAD_FAILED: 'キャラクターデータの読み込みに失敗'
};
```

---

## 📈 成功指標・品質基準

### 定量的指標
| 指標 | 目標値 | 測定方法 |
|------|--------|----------|
| ファイル検出速度 | 1秒以内 | Performance API |
| Canvas生成時間 | 500ms以内 | Performance API |
| WebGL初期化時間 | 1秒以内 | Performance API |
| メモリ使用量 | 100MB以内 | Chrome DevTools |
| ファイルサイズ | 各ファイル500行以内 | wc -l |

### 定性的指標
- ✅ 直感的なドラッグ&ドロップ操作
- ✅ エラー時の明確なフィードバック
- ✅ 既存システムとの完全統合
- ✅ v3.0哲学（シンプル・軽量）の維持

---

## 🔄 将来拡張計画

### Phase 2拡張候補（実運用ログで判断）
1. **汎用HTML対応**: 任意HTML構造への対応
2. **複数Spineバージョン対応**: 4.2.x系統への拡張
3. **高度な競合回避**: 複雑なCSS・JS環境での動作
4. **アニメーション制御**: より細かい演出制御

### 拡張時の判断基準
- **実運用での要望頻度**
- **v3.0哲学との整合性**
- **実装・保守コストとの比較**

---

**最終更新**: 2025-08-13  
**承認**: A案（シンプル・特定テンプレート前提）採用確定  
**実装開始**: Phase 1より着手可能