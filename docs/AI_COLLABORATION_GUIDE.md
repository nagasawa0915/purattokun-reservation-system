# 🤖 AI協働効率化マニュアル

## 概要

AIとの効果的な協働方法・コミュニケーション手法のガイドです。AIの特性を理解し、より正確で効率的な開発を実現するためのベストプラクティスを提供します。

## 🧠 AIの「先入観」現象について

### AIも人間と同様に先入観的な現象が起こります

**発生メカニズム**:
1. **コンテキストの重み付け**: 過去の会話内容が後の判断に影響
2. **パターンマッチング**: よく見るAPIパターン（`load()`等）への自動的な傾向
3. **注意の分散**: 複数の情報源（マニュアル、既存コード、会話履歴）の混在

**具体例**:
```
会話履歴: 「load()メソッドのエラー」
既存コード: 多くのAPIで`load()`パターン
マニュアル: `execute()`が正解
→ 結果: 会話履歴の「load()」が優先されてしまう
```

## 🚨 よくある失敗パターンと対策

### 失敗例1: APIメソッド名の間違い
**症状**: `load()` vs `execute()` のような基本的なメソッド名ミス
```javascript
// 間違い: マニュアルを見たはずなのに...
const result = await spineLoader.load();

// 正解: README.mdには execute() と記載されている
const result = await spineLoader.execute();
```

**原因**: 
- 会話履歴や類似API名への先入観
- マニュアル確認の不徹底
- 複数情報源の混在

**対策**: 実装前の必須確認プロセス（後述）

### 失敗例2: async/await構文エラー
**症状**: `await is only valid in async functions`
```javascript
// 間違い: awaitを使っているのに関数がasyncでない
function loadSpineBasic() {
    const result = await spineLoader.execute(); // エラー！
}

// 正解: async function で宣言
async function loadSpineBasic() {
    const result = await spineLoader.execute(); // 正常
}
```

**原因**: 
- 関数定義時のasyncキーワード忘れ
- 戻り値の型（Promise）の見落とし

**対策**: 段階的確認チェックリスト（後述）

### 失敗例3: 情報源の混同
**症状**: 正しいマニュアルがあるのに古い方法や類似例を参照
```javascript
// 間違い: 古いSpine初期化方法
shader = spine.webgl.Shader.newTwoColoredTextured(gl);

// 正解: 現在のindex.htmlで成功している方法  
const renderer = new spine.SceneRenderer(canvas, gl);
```

**原因**: 
- 複数の実装パターンの存在
- 情報源の優先順位が不明確

**対策**: 情報源の優先度指定（後述）

## ❌ 効果の薄い指示パターン

以下のような抽象的な指示は効果が薄いことが実証されています：

- "慎重に実装してください"
- "マニュアルを見て実装してください"
- "先入観をなくしてください"
- "ミスしないように注意してください"

**理由**: AIは具体的な手順や確認項目がないと、従来パターンに従ってしまう傾向があります。

## ✅ 効果的な指示方法

### パターン1: 段階的確認プロセス
```
実装前に以下を確認・報告してください：
□ 参照マニュアル: [ファイル名]
□ 使用メソッド: [メソッド名] 
□ 情報源: [ファイル名:行番号]
□ 構文確認: [async function / function]
□ 戻り値: [Promise / 値]

この理解で実装してよろしいですか？
```

### パターン2: 情報源の優先度指定
```
「[ファイル名]を最優先情報源とし、
会話履歴や類似例より優先してください」
```

### パターン3: 具体的な検証ステップ
```
「以下の順序で実装してください：
1. まず[ファイル名]の[セクション名]を読み上げてください
2. 正確なメソッド名を確認してください  
3. その後、そのメソッド名のみを使用して実装してください」
```

### パターン4: チェックリスト形式
```
「以下をすべて確認してから実装：
□ README.mdのメソッド名を確認済み
□ async/await使用有無を確認済み
□ 構文エラーチェック実行済み」
```

## 📚 実践例

### PureSpineLoader使用時の効果的な指示

#### ❌ 悪い例
```
「PureSpineLoaderを使ったテストファイルを作成してください」
```

**結果**: AIが先入観で`load()`メソッドを使用し、エラーが発生

#### ✅ 良い例
```
「以下の手順でPureSpineLoaderのテストファイルを作成してください：

1. 最初に micromodules/spine-loader/README.md の使用例セクションを確認してください
2. 正確なメソッド名とその使用方法を報告してください
3. async/awaitの必要性を確認してください
4. 確認完了後に実装を開始してください

情報源の優先度：
- 最優先: micromodules/spine-loader/README.md
- 参考: 既存の成功例（index.html等）
- 除外: 会話履歴の類似API名
```

**結果**: AIが正しく`execute()`メソッドを使用し、正常に動作

### 複雑な統合作業での効果的な指示

#### ❌ 悪い例
```
「既存のシステムと統合してください」
```

#### ✅ 良い例
```
「以下の段階的アプローチで統合してください：

Phase 1: 情報収集
□ 既存システムのAPI仕様を確認（[ファイル名]）
□ 新システムのAPI仕様を確認（[ファイル名]）
□ 統合ポイントを特定・報告

Phase 2: 統合計画
□ データフローを設計
□ エラーハンドリング方針を決定
□ テスト方法を計画

Phase 3: 実装
□ 最小限の統合から開始
□ 各段階で動作確認
□ 問題発生時は即座に報告

各Phaseの完了時に確認を求めてください。」
```

## 🛠️ システマティックなアプローチ

### 推奨開発フロー
```
1. 📖 情報源の特定・読み込み
   ↓
2. 🔍 重要情報の抽出・報告
   ↓  
3. 📝 実装計画の提示
   ↓
4. ✅ ユーザー確認
   ↓
5. 🚀 実装実行
```

### 実装前確認テンプレート
```
「実装前に確認させてください：

📚 参照資料:
- メインマニュアル: [ファイル名]
- 参考実装: [ファイル名]

🔧 技術仕様:
- 使用メソッド: [メソッド名]
- 戻り値の型: [Promise/Object等]
- 必要な構文: [async/await等]

💡 実装方針:
- [具体的なアプローチ]

この理解で実装を開始してよろしいですか？」
```

## 🎯 プロジェクト固有の注意点

### マイクロモジュール使用時
- 各モジュールのREADME.mdを最優先情報源とする
- `execute()` vs `load()` のようなAPI差異に注意
- cleanup() の実行を忘れずに

### Spine WebGL関連
- CDN版とローカル版でAPI構造が異なる場合がある
- index.htmlの成功パターンを参考にする
- WebGL初期化の順序に注意

### エラーハンドリング
- async/awaitの構文エラーが頻発
- try-catch文の適切な配置
- 詳細なログ出力でデバッグを容易にする

## 📝 継続的改善

このマニュアルは、実際の開発経験に基づいて継続的に更新されます。新しい失敗パターンや効果的な手法を発見した場合は、随時追加してください。

## 🎯 実証済み成功事例: Spineテストファイル修正

### 事例概要
**タスク**: PureSpineLoaderを使用したSpineテストファイル作成  
**初期問題**: APIメソッド名間違い、async/await構文エラー、描画API誤用、位置設定ミス  
**最終結果**: 完全に動作するSpineキャラクター表示システム  

### 段階的修正プロセス（100%再現手順）

#### **Phase 1: 基本的なAPI修正**
**問題**: `spineLoader.load()` メソッドが存在しない  
**診断プロセス**:
1. `micromodules/spine-loader/README.md` の54行目を確認
2. 正しいメソッド名: `execute()` を発見
3. `await` 使用のため `async function` が必要と判断

**修正内容**:
```javascript
// ❌ 間違い
const result = await spineLoader.load();

// ✅ 正解 (README.md:54に記載)
const result = await spineLoader.execute();
```

**修正手順**:
```javascript
// ❌ 間違い
function loadSpineBasic() {

// ✅ 正解
async function loadSpineBasic() {
```

#### **Phase 2: 描画API修正**
**問題**: `renderer.render(skeleton)` メソッドが存在しない  
**診断プロセス**:
1. `index.html` の507-509行目を確認
2. 正しい3段階描画方式を発見
3. WebGL設定も同時に修正が必要と判断

**修正内容**:
```javascript
// ❌ 間違い
renderer.render(skeleton);

// ✅ 正解 (index.html:507-509の実績パターン)
// 画面クリア・ビューポート設定
gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.viewport(0, 0, canvas.width, canvas.height);

// 3段階描画
renderer.begin();
renderer.drawSkeleton(skeleton, true);
renderer.end();
```

#### **Phase 3: 位置・スケール修正**
**問題**: キャラクターが読み込まれるが表示されない  
**診断プロセス**:
1. `index.html` の478-480行目を確認
2. 成功している位置・スケール設定を発見
3. Canvasサイズ相対ではなく固定値が正解と判断

**修正内容**:
```javascript
// ❌ 間違い（画面外配置）
skeleton.x = 0;
skeleton.y = canvas.height * 0.8;  // 320など大きすぎる値
skeleton.scaleX = skeleton.scaleY = 0.4;

// ✅ 正解 (index.html:478-480の実績値)
skeleton.x = 0;
skeleton.y = -100;  // 固定値（マイナス値で画面内配置）
skeleton.scaleX = skeleton.scaleY = 0.55;  // 実績あるスケール値
```

### 完全版実装テンプレート

#### **実装前必須確認チェックリスト**
```
□ PureSpineLoader使用時: micromodules/spine-loader/README.md:54 を確認
□ メソッド名: execute() （load()ではない）
□ 関数定義: async function （awaitを使うため）
□ 描画方式: index.html:507-509 の3段階方式
□ 位置設定: index.html:478-480 の固定値方式
□ 情報源優先度: 実績あるファイル > 推測・類似例
```

#### **コピー&ペースト用完全版コード**
```javascript
// 正しいSpine読み込み・表示テンプレート
async function loadSpineBasic() {
    try {
        // Canvas・WebGL初期化
        canvas = document.getElementById('spine-canvas');
        gl = canvas.getContext('webgl', {
            alpha: true,
            premultipliedAlpha: true,
            antialias: true,
            depth: false,
            stencil: false
        });

        // アセットマネージャ初期化（index.htmlと同じ方式）
        assetManager = new spine.AssetManager(gl, 'assets/spine/characters/purattokun/');
        
        // ファイル読み込み（ベースパス相対）
        assetManager.loadTextureAtlas('purattokun.atlas');
        assetManager.loadJson('purattokun.json');
        
        // 読み込み完了待機
        await waitForAssets(assetManager);
        
        // スケルトン初期化
        const atlas = assetManager.get('purattokun.atlas');
        const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
        const skeletonJson = new spine.SkeletonJson(atlasLoader);
        const skeletonData = skeletonJson.readSkeletonData(assetManager.get('purattokun.json'));
        
        skeleton = new spine.Skeleton(skeletonData);
        
        // ⭐ 重要: index.htmlと同じ位置・スケール設定
        skeleton.x = 0;
        skeleton.y = -100;  // 固定値
        skeleton.scaleX = skeleton.scaleY = 0.55;  // 実績値
        
        // アニメーション初期化
        const animationStateData = new spine.AnimationStateData(skeleton.data);
        animationState = new spine.AnimationState(animationStateData);
        animationState.setAnimation(0, 'taiki', true);
        
        // レンダラー初期化
        const renderer = new spine.SceneRenderer(canvas, gl);
        
        // 描画ループ
        let lastTime = Date.now() / 1000;
        function render() {
            const now = Date.now() / 1000;
            const delta = now - lastTime;
            lastTime = now;
            
            // アニメーション更新
            animationState.update(delta);
            animationState.apply(skeleton);
            skeleton.updateWorldTransform();
            
            // ⭐ 重要: index.htmlと同じ3段階描画
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.viewport(0, 0, canvas.width, canvas.height);
            
            renderer.begin();
            renderer.drawSkeleton(skeleton, true);
            renderer.end();
            
            requestAnimationFrame(render);
        }
        
        requestAnimationFrame(render);
        
    } catch (error) {
        console.error('エラー:', error);
    }
}

// 必須ヘルパー関数
function waitForAssets(assetManager) {
    return new Promise((resolve, reject) => {
        function check() {
            if (assetManager.isLoadingComplete()) {
                resolve();
            } else if (assetManager.hasErrors()) {
                reject(new Error('Asset loading failed'));
            } else {
                setTimeout(check, 100);
            }
        }
        check();
    });
}
```

### 失敗要因分析と対策

#### **失敗パターン1: メソッド名の思い込み**
**原因**: `load()` は一般的なAPIパターンなので無意識に使用  
**対策**: 必ずREADME.mdの実例を確認してからコーディング  

#### **失敗パターン2: 描画APIの推測**
**原因**: `render()` は直感的だが、Spine WebGLでは3段階方式  
**対策**: 既存の動作実績がある実装を必ず参照する  

#### **失敗パターン3: 位置計算の複雑化**
**原因**: Canvas相対計算が論理的に見えるが、実際は固定値が正解  
**対策**: 複雑な計算より、動作している実績値を優先する  

### 今後の実装指針

#### **情報源の信頼性ランキング**
1. **最優先**: 動作確認済みの既存実装（index.html等）
2. **高優先**: 該当モジュールのREADME.md
3. **参考程度**: 類似API・一般的パターン
4. **除外**: 会話履歴・推測・思い込み

#### **実装前必須プロセス**
```
1. 📖 既存の成功実装を特定
2. 🔍 該当部分のコードを正確に確認
3. 📝 使用するAPI・値を明確に記録
4. ✅ ユーザーに確認を求める
5. 🚀 確認後に実装開始
```

#### **エラー対応プロセス**
```
1. 🚨 エラー発生時は実装を中断
2. 📖 成功している既存実装を再確認
3. 🔍 差異を特定（API・値・構造）
4. 📝 修正計画をユーザーに報告
5. ✅ 承認後に修正実行
```

### 更新履歴
- 2025-01-31: 初版作成（PureSpineLoader事例を基に）
- 2025-01-31: Spine実装完全成功事例を追加（3段階修正プロセス・完全版テンプレート・失敗要因分析）

## 🔗 関連資料

- [サブエージェント利用ガイド](./SUBAGENT_GUIDE.md)
- [開発チェックリスト](./DEVELOPMENT_CHECKLIST.md)
- [トラブルシューティング総合ガイド](./_TROUBLESHOOTING.md)

---

**このマニュアルを活用することで、AIとのより効率的で正確な協働が実現できます。**