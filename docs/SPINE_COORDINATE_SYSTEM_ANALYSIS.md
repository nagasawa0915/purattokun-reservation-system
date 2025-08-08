# Spine座標処理システム完全分析報告

## 📋 調査概要

**目的**: 境界ボックス描画の座標ずれ問題を解決するため、既存の正常動作する座標処理ロジックの完全理解と境界ボックス描画修正のための具体的設計方針策定

**調査日**: 2025-08-08
**対象システム**: Spineキャラクター座標処理システム v3.0 (purattokun・nezumi両対応)

---

## 🎯 1. 座標処理システム全体アーキテクチャ

### 1.1 レイヤー構成（座標問題防止設計）

```
🏗️ 座標制御アーキテクチャ（4レイヤー → 1レイヤー統一）
├── レイヤー1: CSS基本配置（静的・メインレイヤー）
│   ├── HTML位置制御: left: 35%, top: 75%, transform: translate(-50%, -50%)  
│   ├── レスポンシブ対応: width: 25%, aspect-ratio: 3/2
│   └── Z-index管理: z-index: 10-11（複数キャラクター対応）
├── レイヤー2: JavaScript基本制御（動的・最小限）
│   ├── Canvas内部解像度: width: 120px, height: 120px
│   ├── Skeleton固定位置: x: canvas.width/2, y: canvas.height/2
│   └── スケール固定: scaleX: 1.0, scaleY: 1.0（CSS側でサイズ制御）
└── 拡張モジュール（使用時のみ）
    ├── 編集時座標系スワップ機能
    ├── 境界ボックス描画システム
    └── ドラッグ・リサイズハンドル
```

### 1.2 設計原則

**🔑 統一座標システム（2025-08実装）**:
- **CSS制御優先**: JavaScript座標計算を最小化
- **固定Skeleton位置**: 常にCanvas中央固定
- **%基準配置**: .heroを基準とした相対配置
- **座標競合防止**: 複数レイヤーからの同時制御を禁止

---

## 🚀 2. Spineキャラクター初期化・配置システム

### 2.1 初期化フロー

```javascript
// 🎯 spine-character-manager.js (行441-454)
async upgradeToSpineWebGL(name, basePath, container) {
    // Step 1: Canvas統一解像度設定
    const defaultDisplaySize = 120;
    canvas.width = defaultDisplaySize;   // 内部解像度 = CSS表示サイズ
    canvas.height = defaultDisplaySize;
    
    // Step 2: Skeleton固定位置（統一座標システム）
    skeleton.x = canvas.width / 2;    // Canvas中央X（60px）
    skeleton.y = canvas.height / 2;   // Canvas中央Y（60px）
    skeleton.scaleX = skeleton.scaleY = 1.0; // スケール固定
    
    // Step 3: CSS基準配置（JavaScript座標設定なし）
    // CSSで left: 35%, top: 75% による自動配置
}
```

### 2.2 purattokun・nezumi両対応の汎用初期化

**汎用検出システム**（spine-multi-character-manager.js 29-54行）:
```javascript
const selectors = [
    'canvas[id$="-canvas"]',     // 最優先：標準命名規則
    'canvas[data-spine-character="true"]',  // データ属性対応
    'canvas[id*="spine"]',       // spine含む名前（汎用）
    'canvas[id*="character"]'    // character含む名前（汎用）
];

// 固有名詞不要の自動検出
selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
        characters.push({
            id: element.id,
            element: element,
            name: element.id.replace(/[^a-zA-Z]/g, '') // purattokun, nezumi等を自動抽出
        });
    });
});
```

### 2.3 Canvas配置システム（既存システムの統合）

**従来方式との統合配置**（spine-character-manager.js 206-283行）:
```javascript
fallbackPositioning(canvas, name) {
    // 統一座標システム: 既存Canvas要素の位置を保持
    const existingCanvas = document.getElementById('purattokun-canvas');
    if (existingCanvas) {
        // 既存位置情報を完全保持
        canvas.style.left = existingCanvas.style.left;
        canvas.style.top = existingCanvas.style.top;
        canvas.style.transform = existingCanvas.style.transform;
    } else {
        // localStorage保存位置を優先使用
        const savedPosition = JSON.parse(localStorage.getItem('spine-positioning-state'));
        if (savedPosition?.character) {
            canvas.style.left = savedPosition.character.left;
            canvas.style.top = savedPosition.character.top;
        } else {
            // デフォルト位置
            canvas.style.left = '20%';   
            canvas.style.top = '70%';
        }
        canvas.style.transform = 'translate(-50%, -50%)';
    }
}
```

---

## 📐 3. 座標変換・管理システム

### 3.1 座標系定義

| 座標系 | 原点 | 単位 | 用途 | 責任範囲 |
|--------|------|------|------|----------|
| **HTML/CSS座標系** | 親要素左上 | %/px | UI配置 | CSS（メイン制御） |
| **Canvas描画座標系** | Canvas左上 | px | Canvas内部 | JavaScript（最小限） |
| **Spine座標系** | Canvas中央 | Spine単位 | キャラクター描画 | 固定値（60,60） |
| **編集座標系** | ブラウザ左上 | px | ドラッグ操作 | 一時的変換 |

### 3.2 座標変換ロジック

**SpineCoordinateUtils（spine-coordinate-utils.js）**:
```javascript
class SpineCoordinateUtils {
    // 基本：ビューポート（%）↔ ピクセル座標
    viewportToPixel(vpX, vpY) {
        return {
            x: (vpX / 100) * window.innerWidth,
            y: (vpY / 100) * window.innerHeight
        };
    }
    
    // 背景画像基準の相対座標計算（レスポンシブ対応）
    calculateCharacterPlacement(config) {
        const bgBounds = this.getBackgroundImageBounds();
        const pixelCoords = this.viewportToPixel(config.x, config.y);
        
        // ヒーローセクション内での相対位置
        return {
            canvas: { x: canvasX, y: canvasY, width, height },
            character: { x: charInCanvasX, y: charInCanvasY, scale }
        };
    }
}
```

**ResponsiveCoordinateSystem（spine-responsive-coordinate-system.js）**:
```javascript
// Canvas内相対座標 → Spine座標変換
canvasToSpineCoordinate(canvasX, canvasY, canvasElement) {
    const rect = canvasElement.getBoundingClientRect();
    const spineX = canvasX - (rect.width / 2);     // 中央原点
    const spineY = (rect.height / 2) - canvasY;    // Y軸反転
    return { x: spineX, y: spineY };
}
```

---

## ⚙️ 4. 位置変更・更新システム

### 4.1 座標系スワップシステム（核心技術）

**問題**: 編集時の座標競合（CSS %座標 + transform vs 絶対px座標）
**解決**: 編集開始時に座標系を一時的にシンプル化

**SpineEditCore（spine-edit-core.js 43-142行）**:
```javascript
coordinateSwap: {
    // 編集開始時：複雑座標系 → シンプル絶対座標
    enterEditMode: function(element) {
        const rect = element.getBoundingClientRect();
        
        // 元座標系をバックアップ
        this.backup = {
            left: element.style.left,      // "35%"
            top: element.style.top,        // "75%"
            transform: element.style.transform  // "translate(-50%, -50%)"
        };
        
        // シンプル絶対座標に変換（transform除去）
        element.style.left = rect.left + 'px';      // "420px"
        element.style.top = rect.top + 'px';        // "300px"
        element.style.transform = 'none';           // 競合を完全排除
    },
    
    // 編集終了時：シンプル座標 → 元座標系
    exitEditMode: function(element) {
        const editedRect = element.getBoundingClientRect();
        const parentRect = element.parentElement.getBoundingClientRect();
        
        // 元座標系形式（%値 + transform）に変換
        const newLeftPercent = ((editedRect.left + editedRect.width/2 - parentRect.left) 
                               / parentRect.width) * 100;
        const newTopPercent = ((editedRect.top + editedRect.height/2 - parentRect.top) 
                              / parentRect.height) * 100;
        
        element.style.left = newLeftPercent.toFixed(1) + '%';
        element.style.top = newTopPercent.toFixed(1) + '%';
        element.style.transform = 'translate(-50%, -50%)'; // 元のtransform復元
    }
}
```

### 4.2 localStorage永続化システム

**spine-state-manager.js**:
```javascript
// 複数キャラクター対応のデータ構造
savedState = {
    characters: {
        "purattokun-canvas": { left: "35%", top: "75%", width: "25%", height: "auto" },
        "nezumi-canvas": { left: "60%", top: "45%", width: "20%", height: "auto" }
    },
    timestamp: "2025-08-08T12:00:00.000Z"
};

// 座標系スワップと組み合わせた安全な保存
function saveCurrentState() {
    // 🔧 座標系を一時的に元に戻して正確な値を取得
    SpineEditSystem.coordinateSwap.exitEditMode(targetElement);
    
    // 編集中キャラクターのデータのみ更新
    existingData[targetElement.id] = {
        left: targetElement.style.left,
        top: targetElement.style.top,
        width: targetElement.style.width,
        height: targetElement.style.height,
        transform: targetElement.style.transform
    };
    
    localStorage.setItem('spine-positioning-state', JSON.stringify(savedState));
    
    // 🔧 座標系を編集モードに戻す
    SpineEditSystem.coordinateSwap.enterEditMode(targetElement);
}
```

---

## 🔧 5. 汎用性確保の設計・API設計

### 5.1 汎用キャラクター対応アーキテクチャ

**設計原則**:
- **固有名詞排除**: purattokun, nezumi等のハードコーディング禁止
- **パターンベース検出**: 命名規則・データ属性による自動検出
- **プラグイン方式**: 新キャラクター追加時のコード変更最小化

**汎用API設計**:
```javascript
// 🎯 汎用座標処理API（境界ボックス描画用）
class UniversalSpineCoordinateAPI {
    // 任意キャラクターの現在座標取得
    getCurrentCoordinates(characterId) {
        const element = document.getElementById(characterId);
        const rect = element.getBoundingClientRect();
        
        return {
            // HTML/CSS座標系
            css: {
                left: element.style.left,
                top: element.style.top,
                width: element.style.width,
                height: element.style.height
            },
            // 実際の描画座標
            screen: {
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height
            },
            // Canvas内座標
            canvas: this.screenToCanvasCoordinates(rect, element),
            // Spine座標
            spine: this.getSpineCoordinates(characterId)
        };
    }
    
    // 境界ボックス描画用の統一座標変換
    getUnifiedBoundingBoxCoordinates(characterId) {
        const coords = this.getCurrentCoordinates(characterId);
        const character = window.spineManager?.characterManager?.characters?.get(
            characterId.replace('-canvas', '')
        );
        
        if (!character?.skeleton) return null;
        
        // Spine SkeletonBoundsとCanvas座標の同期
        return {
            skeletonBounds: character.skeleton.getBounds(),
            canvasTransform: {
                offsetX: coords.canvas.centerX,
                offsetY: coords.canvas.centerY,
                scale: character.skeleton.scaleX
            },
            screenPosition: coords.screen
        };
    }
    
    // 座標系間の変換
    convertCoordinates(fromSystem, toSystem, coordinates, characterId) {
        // fromSystem: 'css'|'screen'|'canvas'|'spine'
        // toSystem: 'css'|'screen'|'canvas'|'spine'
        // 実装: 各座標系間の相互変換
    }
}
```

### 5.2 境界ボックス描画修正用の具体的設計方針

**問題分析**: 境界ボックスが正確な位置に描画されない
**原因**: 既存座標処理ロジックの部分適用・座標系の不整合

**解決設計**:
```javascript
// 🎯 境界ボックス描画の座標ずれ修正設計
class BoundingBoxCoordinateFix {
    // 既存の正常座標処理ロジックを完全適用
    drawAccurateBoundingBox(characterId) {
        // Step 1: 既存システムと同じ座標計算ロジックを使用
        const coords = this.universalAPI.getCurrentCoordinates(characterId);
        
        // Step 2: 既存のSkeleton位置計算を正確に適用
        const character = this.getCharacterObject(characterId);
        if (!character?.skeleton) return;
        
        // Step 3: 統一座標システムの座標変換を適用
        const screenCoords = this.applyUnifiedCoordinateTransform({
            skeletonX: character.skeleton.x,        // 60 (Canvas中央)
            skeletonY: character.skeleton.y,        // 60 (Canvas中央)
            canvasRect: coords.screen,              // 実際のCanvas位置
            canvasScale: coords.css.width           // CSSサイズスケール
        });
        
        // Step 4: 境界ボックス描画（正確な座標適用）
        this.drawBoundingBox({
            x: screenCoords.x,
            y: screenCoords.y,
            width: screenCoords.width,
            height: screenCoords.height
        });
    }
    
    // 🔑 既存システムと同じ座標変換ロジック
    applyUnifiedCoordinateTransform({ skeletonX, skeletonY, canvasRect, canvasScale }) {
        // spine-character-manager.js の座標計算と同一ロジック
        const scaleRatio = parseFloat(canvasScale) / 100; // CSS % → 実数変換
        
        return {
            x: canvasRect.left + (skeletonX * scaleRatio),
            y: canvasRect.top + (skeletonY * scaleRatio),
            width: canvasRect.width,
            height: canvasRect.height
        };
    }
}
```

### 5.3 新キャラクター追加時の拡張性

**自動対応システム**:
```javascript
// 新キャラクター（例：tori-canvas）追加時
// 1. HTML追加のみ（コード変更不要）
<canvas id="tori-canvas" width="300" height="200" 
        data-spine-character="true" 
        data-character-name="tori"
        style="position: absolute; left: 80%; top: 30%; 
               transform: translate(-50%, -50%); 
               width: 15%; aspect-ratio: 3/2; z-index: 12;"></canvas>

// 2. 自動検出・管理（既存システムで自動対応）
// - MultiCharacterManager.detectAllCharacters() で自動検出
// - spine-character-manager.js で自動初期化
// - 座標処理・永続化システムで自動管理
```

---

## 📊 6. 実装優先度・修正方針

### 6.1 境界ボックス座標ずれ修正の実装順序

**Phase 1**: 座標取得の統一（最優先）
```javascript
// 既存システムの座標計算ロジックを境界ボックスシステムに完全適用
function getUnifiedCharacterCoordinates(characterId) {
    // spine-character-manager.js fallbackPositioning() と同じロジック
    // spine-coordinate-utils.js calculateCharacterPlacement() と同じロジック
    // 統一座標システムの計算を完全適用
}
```

**Phase 2**: 座標変換の統一（高優先）
```javascript
// SpineEditCore の座標系スワップ技術を境界ボックスに適用
function applyCoordinateSwapToBounds(element) {
    // 編集時：座標系を一時的にシンプル化
    // 描画時：元座標系での正確な位置計算
    // 既存の座標競合回避技術を活用
}
```

**Phase 3**: 汎用API整備（中優先）
```javascript
// 複数キャラクター・将来のキャラクター追加に対応
const BoundingBoxUniversalAPI = {
    forAnyCharacter: (characterId) => { /* 汎用処理 */ },
    autoDetectAndApply: () => { /* 自動検出・適用 */ }
};
```

### 6.2 期待される修正効果

**修正前**:
- 境界ボックスが実際のキャラクター位置とずれる
- purattokun・nezumi で異なる座標ずれパターン
- 新キャラクター追加時の座標問題

**修正後**:
- 境界ボックスが正確なキャラクター位置に表示
- 全キャラクター統一の座標処理
- 新キャラクター自動対応・座標問題なし

---

## ✅ 7. 実装推奨事項

### 7.1 既存システム保護

**絶対に変更禁止**:
- spine-character-manager.js の統一座標システム（441-454行）
- SpineEditCore の座標系スワップ機能（54-142行）
- CSS基準配置システム（index.html 40-65行）

**追加・拡張のみ**:
- 境界ボックス描画システムに既存ロジックを適用
- 汎用API として既存システムをラップ
- 新キャラクター対応の自動検出機能強化

### 7.2 コード品質保証

**座標計算の原則**:
1. **単一責任**: 1つの座標系変換につき1つの関数
2. **一貫性**: 既存システムと同じ計算式・順序を使用
3. **検証可能**: 各段階での座標値をログ出力
4. **エラー安全**: 座標取得失敗時のフォールバック

**テスト推奨**:
```javascript
// 座標計算の検証用テストケース
function validateCoordinateCalculations() {
    const testCharacters = ['purattokun-canvas', 'nezumi-canvas'];
    testCharacters.forEach(characterId => {
        const coords = getUnifiedCharacterCoordinates(characterId);
        console.log(`${characterId} 座標検証:`, coords);
        // 期待値との比較・差異チェック
    });
}
```

---

## 🎯 8. まとめ・次のアクション

### 8.1 調査で明らかになった設計

**座標処理の核心技術**:
1. **統一座標システム**: CSS制御中心・JavaScript最小化
2. **座標系スワップ**: 編集時の競合回避技術
3. **汎用キャラクター対応**: 固有名詞不要の自動検出

**境界ボックス修正の方針**:
- 既存の正常動作する座標計算ロジックの完全適用
- 新規座標計算システムの作成は不要
- 既存システムとの統合・一貫性確保

### 8.2 実装推奨手順

1. **既存座標計算ロジックの抽出・統一API作成**
2. **境界ボックス描画に統一座標計算を適用**
3. **purattokun・nezumi両方での動作検証**
4. **新キャラクター追加時の自動対応確認**

### 8.3 長期的な設計目標

**完全統一座標システム**:
- 全Spineキャラクター機能で同一座標計算
- 座標競合・ずれ問題の根本解決
- 新機能追加時の座標問題予防

**プラグイン化・モジュール化**:
- キャラクター依存の硬直化解消
- 機能追加時のコード影響最小化
- 保守・拡張性の向上

---

**📋 調査完了**: Spineキャラクター座標処理システムの完全理解達成
**🎯 次のステップ**: 境界ボックス描画システムに統一座標計算ロジックを適用実装