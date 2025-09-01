# SpineRenderer汎用モジュール 詳細要件定義書

## 📋 プロジェクト概要

**目標**: drawOrderエラーとレンダリングループ不安定問題を根本解決する、プロジェクト非依存の汎用Spineレンダリングモジュール

**現在の状況**:
- test-background-sync-real.htmlでSceneRenderer使用により安定動作確認済み
- 複数プロジェクトで異なるレンダリング実装が散在（統合が困難）
- WebGLコンテキスト管理・エラー処理が各実装でバラバラ

**最終目標**: 設定駆動型の統一Spineレンダリングシステム確立

---

## 🔍 1. 現在の問題分析

### 1.1 drawOrderエラーの根本原因

#### 問題パターン分析
```javascript
// ❌ 不安定パターン（既存実装）
renderer.drawSkeletonDebug(skeleton);  // drawOrderエラー多発
renderer.drawBounds(skeleton);          // 不安定なbounds描画

// ✅ 安定パターン（test-background-sync-real.html確認済み）
renderer.begin();
renderer.drawSkeleton(skeleton, true);
renderer.end();
```

#### 根本原因特定
1. **描画フロー不統一**: `begin()` - `drawSkeleton()` - `end()` パターンの不徹底
2. **デバッグ描画混在**: `drawSkeletonDebug()`等の不安定API使用
3. **WebGLステート管理不備**: ブレンドモード・テクスチャ設定のコンテキスト汚染

### 1.2 レンダリングループ不安定要因

#### 技術的課題
```javascript
// 現在の問題点
❌ requestAnimationFrame の重複実行
❌ WebGLコンテキストロスト時の復旧処理なし  
❌ Canvas リサイズ時の状態不整合
❌ アニメーション更新とレンダリングの同期問題
```

#### パフォーマンス問題
- フレームレート不安定（30fps ↔ 60fps変動）
- メモリリークによる長時間動作での劣化
- 複数Canvas同時描画時のGPUリソース競合

### 1.3 WebGLコンテキスト管理問題

#### 現在の課題
```javascript
// 既存実装の問題
const gl = canvas.getContext('webgl', { alpha: true });
// ↓ 設定がプロジェクトごとにバラバラ
// ↓ コンテキストロスト処理なし
// ↓ リソース解放処理なし
```

#### PureSpineLoader統合問題
- **WebGLコンテキスト分離問題**: 仮想canvas（読み込み）と実canvas（描画）間でのリソース共有不可
- **アセット管理分散**: AssetManagerが複数インスタンスで重複管理

---

## 🎯 2. SpineRenderer責務定義

### 2.1 核心責務

#### 2.1.1 描画処理の抽象化・安定化
```javascript
// SpineRendererが提供する統一インターフェース
const renderer = new SpineRenderer({
    canvas: canvasElement,
    renderMode: 'stable', // 'stable' | 'debug' | 'performance'
    errorRecovery: true
});

await renderer.initialize();
renderer.render(skeletonData, animationState);
```

#### 2.1.2 WebGL/Canvas統一インターフェース
- **WebGLレンダリング**: メイン描画モード（高パフォーマンス）
- **Canvas2Dフォールバック**: WebGL非対応環境での代替描画
- **自動フォールバック**: WebGLエラー時のCanvas2D自動切り替え

#### 2.1.3 エラー処理・回復機能
```javascript
// 自動エラー回復システム
renderer.on('webglcontextlost', () => {
    // WebGLリソース解放 + Canvas2Dフォールバック
});

renderer.on('webglcontextrestored', () => {
    // WebGLリソース再構築 + 描画再開
});
```

### 2.2 品質保証責務

#### 2.2.1 描画安定性保証
- **drawOrderエラー完全回避**: 検証済みSceneRenderer描画フローの強制適用
- **フレームレート安定化**: 30fps/60fps固定モード提供
- **長時間動作保証**: メモリリーク防止・リソース管理

#### 2.2.2 パフォーマンス最適化
- **GPU負荷分散**: 複数Canvas描画時のレンダリングキュー管理
- **メモリ使用量最小化**: 不要リソースの即座解放
- **バックグラウンド最適化**: 非表示Canvas時の描画停止

---

## 🌐 3. 汎用性要件

### 3.1 プロジェクト非依存設計

#### 3.1.1 設定駆動型実装
```javascript
// プロジェクト固有設定の外部化
const config = {
    project: 'purattokun-system',        // プロジェクト識別
    characters: [
        {
            name: 'purattokun',
            atlasPath: 'characters/purattokun/purattokun.atlas',
            jsonPath: 'characters/purattokun/purattokun.json',
            scale: 0.6,
            position: { x: 0.5, y: 0.8 }  // 相対座標（0-1）
        }
    ],
    rendering: {
        frameRate: 60,
        renderMode: 'stable',
        background: { r: 0, g: 0, b: 0, a: 0.1 }
    }
};

const renderer = new SpineRenderer(config);
```

#### 3.1.2 ゼロ依存原則
```javascript
// 外部依存完全排除
❌ 禁止: window.spinePositioningSystem への依存
❌ 禁止: localStorage 等の永続化機能
❌ 禁止: DOM操作（Canvas外要素）
✅ 許可: spine WebGLライブラリのみ依存
✅ 許可: Canvas要素・WebGLコンテキストへの操作
```

### 3.2 既存システム統合性

#### 3.2.1 段階的導入サポート
```javascript
// 段階1: 既存システムと並列動作
SpineRenderer.compatibilityMode = true;

// 段階2: レガシー描画の段階的置換
renderer.replaceRenderer('old-spine-integration');

// 段階3: 完全移行後の最適化
SpineRenderer.optimizationMode = true;
```

#### 3.2.2 マイクロモジュール統合
```javascript
// PureSpineLoader統合
const spineData = await PureSpineLoader.load({
    atlasPath: config.atlas,
    jsonPath: config.json,
    basePath: config.basePath
});

const renderer = new SpineRenderer({
    canvas: canvas,
    spineData: spineData
});
```

---

## ⚡ 4. 技術仕様

### 4.1 API設計

#### 4.1.1 コンストラクタ設計
```javascript
class SpineRenderer {
    constructor(options = {}) {
        // 必須パラメータ
        this.canvas = options.canvas;           // HTMLCanvasElement
        
        // オプションパラメータ（デフォルト値付き）
        this.renderMode = options.renderMode || 'stable';
        this.frameRate = options.frameRate || 60;
        this.errorRecovery = options.errorRecovery !== false;
        this.debugMode = options.debugMode || false;
        
        // WebGL設定
        this.webglOptions = {
            alpha: true,
            premultipliedAlpha: true,
            antialias: true,
            depth: false,
            stencil: false,
            ...options.webglOptions
        };
    }
}
```

#### 4.1.2 メソッド設計
```javascript
// 初期化API
async initialize(spineData?) : Promise<boolean>
isInitialized() : boolean

// 描画API
render(skeleton, animationState?) : void
setCamera(position, viewport) : void
setBackground(color) : void

// アニメーション制御API
updateAnimation(skeleton, animationState, deltaTime) : void
setAnimation(skeleton, animationName, loop = true) : void

// リソース管理API
dispose() : void
cleanup() : void

// エラー処理・診断API
getStatus() : {webgl: boolean, canvas2d: boolean, error?: string}
enableDebugMode(enabled = true) : void

// イベントAPI
on(eventName, callback) : void
off(eventName, callback) : void
```

### 4.2 WebGL最適化戦略

#### 4.2.1 コンテキスト最適化
```javascript
// WebGLコンテキスト設定最適化
const gl = canvas.getContext('webgl', {
    alpha: true,                  // アルファチャンネル有効
    premultipliedAlpha: true,     // プリマルチプライアルファ（黒枠問題解決）
    antialias: true,              // アンチエイリアシング
    depth: false,                 // デプステスト無効（2D用最適化）
    stencil: false,               // ステンシルテスト無効（2D用最適化）
    preserveDrawingBuffer: false, // 描画バッファ保持無効（パフォーマンス向上）
    failIfMajorPerformanceCaveat: false  // 低性能WebGLでも動作許可
});
```

#### 4.2.2 描画ループ最適化
```javascript
// 安定描画ループパターン
class RenderLoop {
    constructor(frameRate = 60) {
        this.targetFrameTime = 1000 / frameRate;
        this.lastFrameTime = 0;
        this.rafId = 0;
    }
    
    start(renderCallback) {
        const render = (currentTime) => {
            const deltaTime = currentTime - this.lastFrameTime;
            
            if (deltaTime >= this.targetFrameTime) {
                renderCallback(deltaTime / 1000); // 秒単位で渡す
                this.lastFrameTime = currentTime;
            }
            
            this.rafId = requestAnimationFrame(render);
        };
        
        render(performance.now());
    }
}
```

### 4.3 エラーハンドリング戦略

#### 4.3.1 WebGLコンテキストロスト対応
```javascript
// WebGLコンテキスト復旧システム
setupContextLossRecovery() {
    this.canvas.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        this.handleContextLoss();
    });
    
    this.canvas.addEventListener('webglcontextrestored', () => {
        this.handleContextRestore();
    });
}

async handleContextRestore() {
    // WebGLリソース再構築
    this.gl = this.canvas.getContext('webgl', this.webglOptions);
    this.sceneRenderer = new spine.SceneRenderer(this.canvas, this.gl);
    
    // アセット再読み込み
    await this.reloadAssets();
    
    // 描画再開
    this.startRenderLoop();
}
```

#### 4.3.2 グレースフルデグラデーション
```javascript
// WebGL → Canvas2D フォールバック
initializeFallbackRenderer() {
    if (!this.gl || this.webglFailed) {
        this.canvas2d = this.canvas.getContext('2d');
        this.renderMode = 'canvas2d';
        console.warn('🔄 SpineRenderer: Canvas2Dフォールバックモード');
    }
}

renderCanvas2D(skeleton, animationState) {
    // シンプルなSprite描画（最低限の機能保証）
    this.canvas2d.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // Spine slot別描画ロジック
}
```

---

## 🔧 5. 既存システム統合

### 5.1 test-background-sync-real.html適用

#### 5.1.1 現状分析
```javascript
// 現在の成功パターン（test-background-sync-real.html）
✅ 正常動作: SceneRenderer + begin/drawSkeleton/end パターン
✅ 安定性確認: drawOrderエラー発生なし
✅ レンダリングループ: requestAnimationFrame安定動作

// SpineRenderer適用後
const renderer = new SpineRenderer({
    canvas: canvas,
    renderMode: 'stable'
});

await renderer.initialize();
// 既存の initializeSpineAndBB() 処理を SpineRenderer内部に移行
```

#### 5.1.2 移行手順
```javascript
// Phase 1: 既存システムと並列動作（検証用）
// Phase 2: 既存 startRenderLoop() をSpineRenderer.render()で置換
// Phase 3: initializeSpineAndBB() をSpineRenderer.initialize()で統合
// Phase 4: 最適化・クリーンアップ
```

### 5.2 index.html互換性

#### 5.2.1 v3.0システム統合
```javascript
// 既存 spine-positioning-system-explanation.js 統合
SpineRenderer.loadCharacter({
    name: 'purattokun',
    atlasPath: 'assets/spine/characters/purattokun/purattokun.atlas',
    jsonPath: 'assets/spine/characters/purattokun/purattokun.json',
    position: { x: '18vw', y: '49vh' },
    scale: 0.55
});
```

#### 5.2.2 編集システム連携
```javascript
// 編集モード統合
renderer.enableEditMode(true);
renderer.on('characterMoved', (character, position) => {
    // 既存編集システムとの連携
});
```

### 5.3 micromodules統合

#### 5.3.1 PureSpineLoader統合
```javascript
// WebGLコンテキスト統一
class SpineRenderer {
    async loadCharacterWithPureSpineLoader(config) {
        // 統一WebGLコンテキストでPureSpineLoader実行
        const spineData = await PureSpineLoader.loadWithContext(this.gl, config);
        return this.addCharacter(spineData);
    }
}
```

#### 5.3.2 他micromodule連携
```javascript
// ElementObserver統合
renderer.setElementObserver(elementObserver);

// BoundingBox統合  
renderer.setBoundingBoxSystem(boundingBoxSystem);
```

---

## 📅 6. 実装計画

### 6.1 開発フェーズ分割

#### Phase 1: 基盤実装（2週間）
**目標**: 基本SpineRendererクラス実装・test-background-sync-real.html適用

**成果物**:
- `micromodules/spine-renderer/SpineRenderer.js` - 核心クラス
- `micromodules/spine-renderer/RenderLoop.js` - 描画ループ管理
- `micromodules/spine-renderer/WebGLManager.js` - WebGL管理
- test-background-sync-real.htmlでの動作確認

**技術仕様**:
```javascript
// Phase 1 実装範囲
class SpineRenderer {
    constructor(options)
    async initialize(spineData)
    render(skeleton, animationState)
    dispose()
}
```

#### Phase 2: エラー処理・安定性強化（1週間）
**目標**: WebGLコンテキストロスト対応・フォールバック機能

**成果物**:
- WebGLコンテキスト復旧システム
- Canvas2Dフォールバック機能
- エラー診断・ログ機能

#### Phase 3: 汎用化・統合（1週間）
**目標**: 設定駆動型・既存システム統合

**成果物**:
- 設定JSON読み込み機能
- index.html統合
- PureSpineLoader統合

#### Phase 4: 最適化・本格導入（1週間）
**目標**: パフォーマンス最適化・全システム移行

**成果物**:
- GPU負荷最適化
- 複数Canvas描画対応
- レガシーシステム置換完了

### 6.2 テスト戦略

#### 6.2.1 ユニットテスト
```javascript
// 基本機能テスト
test('SpineRenderer初期化', async () => {
    const renderer = new SpineRenderer({canvas: mockCanvas});
    expect(await renderer.initialize()).toBe(true);
});

// エラー処理テスト
test('WebGLコンテキストロスト復旧', async () => {
    renderer.simulateContextLoss();
    expect(renderer.getStatus().webgl).toBe(false);
    
    renderer.simulateContextRestore();
    expect(renderer.getStatus().webgl).toBe(true);
});
```

#### 6.2.2 統合テスト
```javascript
// test-spine-renderer-integration.html作成
// - test-background-sync-real.html成功パターンをSpineRendererで再実装
// - 既存システムと並列動作での動作確認
// - パフォーマンス比較（フレームレート・メモリ使用量）
```

### 6.3 移行計画

#### 6.3.1 段階的移行戦略
```
段階1: 新規開発での優先採用（test-*.htmlファイル）
   ↓
段階2: 既存安定システムでの実証（test-background-sync-real.html）
   ↓  
段階3: 本番システム統合（index.html）
   ↓
段階4: レガシーシステム完全置換
```

#### 6.3.2 リスク軽減策
- **並列実行期間**: 既存システムとSpineRendererを同時動作させ、動作比較
- **ロールバック準備**: 各段階で即座に旧システムに戻せる体制
- **段階的機能移行**: 描画機能のみ→アニメーション制御→編集システム連携の順番で移行

---

## 📊 7. 期待される効果

### 7.1 品質向上効果

#### 7.1.1 安定性向上
- **drawOrderエラー完全解消**: 100%安定描画保証
- **長時間動作安定性**: メモリリーク防止・リソース管理
- **エラー回復力**: WebGLコンテキストロスト等への自動対応

#### 7.1.2 保守性向上  
- **統一実装**: 散在するSpine描画コードの一元化
- **設定駆動**: プロジェクト固有処理の外部化
- **テスタビリティ**: 単体テスト・統合テストの容易化

### 7.2 開発効率向上効果

#### 7.2.1 新規開発効率化
```javascript
// 従来: 複雑な初期化コード（50-100行）
// SpineRenderer: シンプル化（5-10行）
const renderer = new SpineRenderer(config);
await renderer.initialize();
renderer.render(skeleton, animationState);
```

#### 7.2.2 問題解決時間短縮
- **診断機能**: エラー原因の即座特定
- **標準化**: 問題パターンの体系化
- **ドキュメント化**: 解決策の再利用性向上

### 7.3 技術的メリット

#### 7.3.1 パフォーマンス向上
- **GPU最適化**: レンダリングパイプライン効率化
- **メモリ使用量削減**: リソース管理最適化
- **フレームレート安定化**: 30fps/60fps固定制御

#### 7.3.2 拡張性確保
- **プラグイン対応**: 新機能の容易追加
- **バージョン管理**: Spine WebGLライブラリ更新への対応
- **クロスプラットフォーム**: WebGL非対応環境でのフォールバック

---

## 🎯 8. 結論・推奨事項

### 8.1 優先実装項目

**最高優先度**:
1. **基本SpineRendererクラス実装** - drawOrderエラー解消に直結
2. **test-background-sync-real.html適用** - 成功パターン活用による確実な動作検証
3. **WebGL最適化設定統合** - 黒枠問題等の品質問題解決

**高優先度**:
4. **エラー処理・回復システム** - 長時間動作安定性確保
5. **設定駆動型実装** - 汎用性確保・保守性向上

### 8.2 技術的推奨事項

#### 8.2.1 実装アプローチ
```javascript
// 推奨: 成功パターンベース実装
// test-background-sync-real.htmlの安定動作を核心として設計
// 新機能は段階的に追加し、安定性を最優先

class SpineRenderer extends ProvenStablePattern {
    // 実証済み安定パターンを継承
    // 新機能は慎重に段階追加
}
```

#### 8.2.2 品質保証戦略
- **実証主義**: test-background-sync-real.html等の成功事例を基準とする
- **段階実装**: 一度に全機能実装せず、核心機能から段階的に構築
- **テスト駆動**: 各段階で動作検証を徹底実施

### 8.3 期待されるROI

#### 8.3.1 短期効果（1-2ヶ月）
- drawOrderエラーの完全解消
- 新規開発でのSpine実装工数50%削減
- トラブルシューティング時間70%短縮

#### 8.3.2 長期効果（3-6ヶ月）
- Spineシステム保守コスト60%削減
- 新機能追加時の品質安定性向上
- 技術的負債の段階的解消

**結論**: SpineRenderer汎用モジュールは、現在のレンダリング問題を根本解決し、将来の開発効率・品質向上に大きく貢献する重要なインフラストラクチャーとして位置付けられる。test-background-sync-real.htmlでの成功パターンを基盤とし、段階的な実装により確実な品質向上を実現することを強く推奨する。