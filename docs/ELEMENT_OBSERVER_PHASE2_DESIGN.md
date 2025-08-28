# ElementObserver Phase 2設計書：高度座標系統合機能

## 🎯 Phase 2目標

**複雑な座標変換の完全自動化**により、PureBoundingBoxの座標スワップ処理を次世代レベルに高度化

### 解決対象の高度課題

#### 1. CSS Transform複雑性の完全解決
**現状の課題**:
```css
.layout-anchor {
    transform: translate(-50%, -50%);  /* 固定transform */
}
.interactive {
    transform: translate(var(--tx, 0), var(--ty, 0));  /* 動的offset */
}
```

**Phase 2解決**:
- CSS Transform統合監視システム
- 複数transform値の自動合成・分解
- CSS変数とtransformの完全同期

#### 2. WebGL Canvas座標系との統合
**現状の課題**:
```javascript
// DOM座標系（%・px混在）
element.style.left = "30%";
element.style.top = "60%";

// WebGL座標系（独立・ピクセル固定）
skeleton.x = canvas.width / 2;
skeleton.y = canvas.height / 2;
```

**Phase 2解決**:
- DOM座標⟷WebGL座標の自動同期
- Canvas Matrix変換の統合管理
- Skeleton位置の自動追従

#### 3. レスポンシブ座標の完全対応
**現状の課題**:
```css
#canvas { width: 300px; height: 300px; }  /* 固定 - WebGL安定 */
#canvas { width: 25%; height: 25%; }      /* レスポンシブ - WebGL不安定 */
```

**Phase 2解決**:
- WebGL描画バッファとCSS表示サイズの分離管理
- レスポンシブ対応WebGLシステム
- DPR・ズーム変化の完全対応

## 🏗️ アーキテクチャ設計

### システム構成
```
ElementObserver Phase 2 (高度座標系統合)
├── ElementObserverTransform.js     # CSS Transform統合監視
├── ElementObserverWebGL.js         # WebGL座標系統合
├── ElementObserverResponsive.js    # レスポンシブ完全対応
└── ElementObserverAdvanced.js      # 統合制御・高級API
```

### 設計原則

#### 1. **座標系統一レイヤー**
5つの独立座標系を統一管理:
```
1. CSS %座標系    (30%, 60%)
2. CSS px座標系   (240px, 300px)  
3. CSS Transform  (translate(-50%, -50%) + translate(var(--tx), var(--ty)))
4. WebGL Canvas座標 (canvas.width/2, canvas.height/2)
5. Skeleton座標    (skeleton.x, skeleton.y)
```

#### 2. **自動同期システム**
変更イベント→自動伝播→全座標系同期:
```javascript
// 1つの座標系変更が全てに自動反映
observer.setDOMPosition("35%", "65%");  
// ↓ 自動同期
// CSS: left:35%, top:65%
// WebGL: skeleton.x = newX, skeleton.y = newY
// Transform: 合成値自動更新
```

#### 3. **環境非依存設計**
レスポンシブ・デバイス・ブラウザ差異の完全吸収:
```javascript
// 環境に依存しない統一API
observer.responsive.setCanvasSize("25%", "25%");  // WebGL安定動作
observer.responsive.setViewport(viewport);        // 自動DPR補正
```

## 📋 技術仕様

### ElementObserverTransform.js

#### CSS Transform統合監視
```javascript
class ElementObserverTransform {
    constructor(targetElement) {
        this.transforms = {
            static: 'translate(-50%, -50%)',     // 固定transform
            dynamic: 'translate(0px, 0px)',     // CSS変数由来
            combined: null                       // 合成結果
        };
        
        this.cssVariables = {
            tx: 0,
            ty: 0,
            scale: 1,
            rotation: 0
        };
    }
    
    // Transform値の自動合成
    combineTransforms() {
        const combined = this.composeTransformMatrix(
            this.transforms.static,
            this.transforms.dynamic
        );
        this.transforms.combined = combined;
        return combined;
    }
    
    // CSS変数↔Transform同期
    syncCSSVariables() {
        const element = this.targetElement.querySelector('.interactive');
        element.style.setProperty('--tx', this.cssVariables.tx + 'px');
        element.style.setProperty('--ty', this.cssVariables.ty + 'px');
        
        this.transforms.dynamic = `translate(${this.cssVariables.tx}px, ${this.cssVariables.ty}px)`;
        return this.combineTransforms();
    }
}
```

#### Transform Matrix計算
```javascript
// Transform行列の合成・分解
composeTransformMatrix(staticTransform, dynamicTransform) {
    const staticMatrix = this.parseTransform(staticTransform);
    const dynamicMatrix = this.parseTransform(dynamicTransform);
    return this.multiplyMatrices(staticMatrix, dynamicMatrix);
}

parseTransform(transformString) {
    // CSS transform文字列 → 4x4行列変換
}

multiplyMatrices(matrix1, matrix2) {
    // 4x4行列の乗算
}
```

### ElementObserverWebGL.js

#### DOM↔WebGL座標同期
```javascript
class ElementObserverWebGL {
    constructor(canvas, skeleton, renderer) {
        this.canvas = canvas;
        this.skeleton = skeleton;
        this.renderer = renderer;
        
        // 座標変換パラメータ
        this.coordinateSystem = {
            domToWebGL: this.createDOMToWebGLConverter(),
            webGLToDOM: this.createWebGLToDOMConverter()
        };
    }
    
    // DOM座標 → WebGL座標変換
    domToWebGL(domX, domY) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const webglX = (domX - canvasRect.left) * this.getDevicePixelRatio();
        const webglY = (domY - canvasRect.top) * this.getDevicePixelRatio();
        
        // Spine座標系補正（Y軸反転など）
        return {
            x: webglX,
            y: this.canvas.height - webglY  // WebGL Y軸反転
        };
    }
    
    // WebGL座標 → DOM座標変換
    webGLToDOM(webglX, webglY) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const domX = canvasRect.left + (webglX / this.getDevicePixelRatio());
        const domY = canvasRect.top + ((this.canvas.height - webglY) / this.getDevicePixelRatio());
        
        return { x: domX, y: domY };
    }
    
    // Skeleton位置の自動同期
    syncSkeletonPosition(domPosition) {
        const webglPos = this.domToWebGL(domPosition.x, domPosition.y);
        this.skeleton.x = webglPos.x;
        this.skeleton.y = webglPos.y;
        this.skeleton.updateWorldTransform();
    }
}
```

#### Canvas Matrix統合
```javascript
// Canvas描画行列とDOM座標の統合管理
updateCanvasMatrix(domTransform) {
    const camera = this.renderer.camera;
    const matrix = this.domTransformToCanvasMatrix(domTransform);
    
    camera.setTransformMatrix(matrix);
    camera.setViewport(this.canvas.width, this.canvas.height);
}
```

### ElementObserverResponsive.js

#### レスポンシブWebGL管理
```javascript
class ElementObserverResponsive {
    constructor(canvas) {
        this.canvas = canvas;
        this.responsiveConfig = {
            cssSize: { width: '25%', height: '25%' },      // CSS表示サイズ
            bufferSize: { width: 512, height: 512 },       // WebGL描画バッファ
            dpr: window.devicePixelRatio || 1
        };
        
        this.setupResponsiveCanvas();
    }
    
    // レスポンシブCanvas設定
    setupResponsiveCanvas() {
        // CSS表示サイズ（レスポンシブ）
        this.canvas.style.width = this.responsiveConfig.cssSize.width;
        this.canvas.style.height = this.responsiveConfig.cssSize.height;
        
        // WebGL描画バッファサイズ（固定・高解像度）
        this.canvas.width = this.responsiveConfig.bufferSize.width * this.responsiveConfig.dpr;
        this.canvas.height = this.responsiveConfig.bufferSize.height * this.responsiveConfig.dpr;
        
        console.log('📐 レスポンシブCanvas設定:', {
            cssSize: `${this.responsiveConfig.cssSize.width} × ${this.responsiveConfig.cssSize.height}`,
            bufferSize: `${this.canvas.width} × ${this.canvas.height}`,
            dpr: this.responsiveConfig.dpr
        });
    }
    
    // 画面サイズ変更対応
    onViewportChange() {
        const newDPR = window.devicePixelRatio || 1;
        if (newDPR !== this.responsiveConfig.dpr) {
            this.responsiveConfig.dpr = newDPR;
            this.setupResponsiveCanvas();
            this.notifyCanvasSizeChange();
        }
    }
    
    // Canvas実際のピクセルサイズ取得
    getRealCanvasSize() {
        const rect = this.canvas.getBoundingClientRect();
        return {
            displayWidth: rect.width,
            displayHeight: rect.height,
            bufferWidth: this.canvas.width,
            bufferHeight: this.canvas.height,
            scaleRatio: this.canvas.width / rect.width
        };
    }
}
```

### ElementObserverAdvanced.js（統合制御）

#### 統一API提供
```javascript
class ElementObserverAdvanced extends ElementObserver {
    constructor() {
        super();
        
        // Phase 2専用モジュール
        this.transform = null;      // ElementObserverTransform
        this.webgl = null;          // ElementObserverWebGL  
        this.responsive = null;     // ElementObserverResponsive
        
        // 高度座標管理
        this.coordinateSystems = {
            dom: { x: 0, y: 0, unit: '%' },
            transform: { tx: 0, ty: 0, scale: 1, rotation: 0 },
            webgl: { x: 0, y: 0, scale: 1 },
            canvas: { width: 512, height: 512 }
        };
    }
    
    // Phase 2初期化（WebGL対応要素用）
    initializeAdvanced(targetElement, canvas, skeleton, renderer) {
        // Phase 1基本機能
        super.observeParentSize(targetElement, this.onParentSizeChange.bind(this));
        
        // Phase 2高度機能
        this.transform = new ElementObserverTransform(targetElement);
        this.webgl = new ElementObserverWebGL(canvas, skeleton, renderer);
        this.responsive = new ElementObserverResponsive(canvas);
        
        // 座標系統合監視開始
        this.startAdvancedCoordinateMonitoring();
        
        console.log('🚀 ElementObserver Phase 2初期化完了');
    }
    
    // 🎯 統一座標設定API
    setUnifiedPosition(x, y, unit = '%') {
        console.log('🎯 統一座標設定:', { x, y, unit });
        
        // 1. DOM座標更新
        this.coordinateSystems.dom = { x, y, unit };
        this.updateDOMPosition(x, y, unit);
        
        // 2. Transform更新
        const transformUpdate = this.calculateTransformUpdate(x, y, unit);
        this.transform.cssVariables.tx = transformUpdate.tx;
        this.transform.cssVariables.ty = transformUpdate.ty;
        this.transform.syncCSSVariables();
        
        // 3. WebGL座標同期
        const webglPosition = this.convertToWebGLCoordinates(x, y, unit);
        this.webgl.syncSkeletonPosition(webglPosition);
        this.coordinateSystems.webgl = webglPosition;
        
        // 4. Canvas Matrix更新
        this.webgl.updateCanvasMatrix(this.transform.transforms.combined);
        
        console.log('✅ 全座標系同期完了:', this.coordinateSystems);
    }
    
    // 🔄 座標系間変換
    convertBetweenCoordinateSystems(fromSystem, toSystem, coordinates) {
        const converters = {
            'dom->webgl': (coords) => this.webgl.domToWebGL(coords.x, coords.y),
            'webgl->dom': (coords) => this.webgl.webGLToDOM(coords.x, coords.y),
            'percent->pixel': (coords) => this.convertPercentToPixel(coords.x, coords.y),
            'pixel->percent': (coords) => this.convertPixelToPercent(coords.x, coords.y)
        };
        
        const converterKey = `${fromSystem}->${toSystem}`;
        const converter = converters[converterKey];
        
        if (converter) {
            return converter(coordinates);
        } else {
            throw new Error(`座標系変換未対応: ${converterKey}`);
        }
    }
    
    // 🎮 PureBoundingBox高度統合
    integratePureBoundingBox(boundingBox) {
        // commitToPercent高度版に置き換え
        boundingBox.core._originalCommitToPercent = boundingBox.core.commitToPercent;
        boundingBox.core.commitToPercent = this.advancedCommitToPercent.bind(this, boundingBox);
        
        // enterEditingMode高度版に置き換え  
        boundingBox.core._originalEnterEditingMode = boundingBox.core.enterEditingMode;
        boundingBox.core.enterEditingMode = this.advancedEnterEditingMode.bind(this, boundingBox);
        
        console.log('🔧 PureBoundingBox高度統合完了');
    }
    
    // 🌊 高度commitToPercent
    advancedCommitToPercent(boundingBox) {
        console.log('🌊 ElementObserver Phase 2高度版commitToPercent開始');
        
        // Phase 1安全性チェック
        const safetyCheck = this.isSafeForCoordinateSwap(boundingBox.config.targetElement);
        if (!safetyCheck.safe) {
            console.warn('⚠️ Phase 2座標スワップ不安全:', safetyCheck.reason);
            return false;
        }
        
        // Phase 2統合座標計算
        const currentTransform = this.transform.combineTransforms();
        const currentWebGL = { x: this.webgl.skeleton.x, y: this.webgl.skeleton.y };
        const targetPercent = this.calculateOptimalPercentPosition(currentTransform, currentWebGL);
        
        // 統一座標更新実行
        this.setUnifiedPosition(targetPercent.x, targetPercent.y, '%');
        
        console.log('✅ Phase 2高度版commitToPercent完了:', targetPercent);
        return true;
    }
}
```

## 📊 Phase 2 API設計

### 基本初期化
```javascript
// Phase 2対応初期化
const observer = new ElementObserverAdvanced();
await observer.initializeAdvanced(targetElement, canvas, skeleton, renderer);
```

### 統一座標API
```javascript
// 全座標系統一設定
observer.setUnifiedPosition(35, 65, '%');  // DOM 35%, 65% → 全座標系自動同期

// 座標系間変換
const webglPos = observer.convertBetweenCoordinateSystems('dom', 'webgl', {x: 35, y: 65});
const domPos = observer.convertBetweenCoordinateSystems('webgl', 'dom', webglPos);
```

### Transform管理API
```javascript
// CSS Transform統合制御
observer.transform.setCSSVariable('tx', 50);  // CSS変数設定 → transform自動更新
observer.transform.combineTransforms();       // transform値合成
```

### WebGL統合API
```javascript  
// WebGL座標同期
observer.webgl.syncSkeletonPosition({x: 300, y: 200});  // DOM座標でSkeleton位置設定
observer.webgl.updateCanvasMatrix(transformMatrix);      // Canvas描画行列更新
```

### レスポンシブAPI
```javascript
// レスポンシブCanvas設定
observer.responsive.setCanvasSize('25%', '25%');  // CSS表示サイズ
observer.responsive.setBufferSize(1024, 1024);   // WebGL描画バッファサイズ
observer.responsive.setDPR(2.0);                 // デバイスピクセル比
```

## 🎯 PureBoundingBox統合強化

### 高度統合方法
```javascript
// Phase 2統合初期化
const observer = ElementObserverAdvanced.createForAdvancedBoundingBox(
    targetElement, canvas, skeleton, renderer
);

// PureBoundingBox作成・統合
const boundingBox = new PureBoundingBox({
    targetElement: targetElement,
    nodeId: 'advanced-bb'
});

observer.integratePureBoundingBox(boundingBox);  // 高度機能統合

// BB実行（Phase 2機能自動適用）
const result = await boundingBox.execute({ visible: true });
```

### 期待される動作改善
```javascript
❌ Phase 1: 基本的な座標スワップ
✅ Phase 2: 5つの座標系の完全統合・自動同期

❌ Phase 1: CSS変数の手動管理
✅ Phase 2: Transform統合監視・自動合成

❌ Phase 1: WebGL座標系の独立性
✅ Phase 2: DOM⟷WebGL完全同期・Matrix統合

❌ Phase 1: レスポンシブ対応制限
✅ Phase 2: WebGL安定・レスポンシブ両立
```

## 📈 実装ロードマップ

### Step 1: ElementObserverTransform.js (1週間)
- CSS Transform解析・合成機能
- CSS変数同期システム  
- Transform Matrix計算

### Step 2: ElementObserverWebGL.js (1週間)
- DOM⟷WebGL座標変換
- Skeleton位置同期
- Canvas Matrix統合

### Step 3: ElementObserverResponsive.js (1週間)
- レスポンシブCanvas管理
- DPR・ズーム対応
- 描画バッファ分離

### Step 4: ElementObserverAdvanced.js (1週間)
- 統合制御API
- PureBoundingBox高度統合
- 統合テスト・デバッグ

## 🧪 検証・テスト計画

### 統合テスト項目
1. **5座標系統合テスト**: DOM・Transform・WebGL・Canvas・Skeletonの完全同期確認
2. **レスポンシブテスト**: 画面サイズ変更・DPR変化への対応確認
3. **PureBoundingBox統合テスト**: BB操作での全座標系自動更新確認
4. **パフォーマンステスト**: 座標変換処理の負荷測定・最適化

### デバッグ支援機能
- 全座標系の可視化表示
- 座標変換過程のリアルタイム監視
- Transform Matrix・WebGL状態のデバッグ出力

**Phase 2により、PureBoundingBoxは次世代の高度座標制御システムに進化します！**