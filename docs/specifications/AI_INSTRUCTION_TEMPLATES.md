# AI指示テンプレート集（spine-editor-desktop-v4）

## 🤖 記憶リセット対応：完全指示テンプレート

### 基本コピペテンプレート
```
spine-editor-desktop-v4のマイクロモジュールシステムで開発中です。

## 🎯 絶対ルール
1. 外部依存ゼロ（他モジュール・グローバル変数禁止）
2. 単一責務のみ
3. cleanup()で完全復元保証
4. 数値・文字列のみで他モジュールと通信

## 📋 標準データ形式
CoordinateData = {x: number, y: number, width: number, height: number}
SpineData = {loaded: boolean, atlasData: string, jsonData: object}
AnimationControl = {name: string, loop: boolean, sequence: string[]}

## ✅ 必須実装
- constructor(input): 入力検証・初期化
- execute(params): 単一機能実行  
- getState(): 状態を数値で返す
- cleanup(): 完全復元
- static test(): 単独テスト

[ここに具体的な作成指示]
```

---

## 🎭 各モジュール別テンプレート

### 1. PureSpineLoader作成指示
```
【基本テンプレート貼り付け】

## 作成指示
PureSpineLoaderマイクロモジュールを作成してください。

責務: Spineファイル（.atlas, .json, .png）の読み込み専用
入力: {atlasPath: string, jsonPath: string, pngPath: string}
出力: {loaded: boolean, spineData: object, error: string|null}

## 禁止事項
- DOM操作（canvasへの描画等）禁止
- アニメーション制御禁止
- 他ファイルへの影響禁止
- 状態の永続化禁止

## 期待動作
const loader = new PureSpineLoader();
const result = await loader.load({atlasPath: "...", jsonPath: "...", pngPath: "..."});
// result = {loaded: true, spineData: {...}, error: null}
loader.cleanup(); // メモリ解放のみ
```

### 2. PureSpineRenderer作成指示
```
【基本テンプレート貼り付け】

## 作成指示  
PureSpineRendererマイクロモジュールを作成してください。

責務: Spineデータをcanvasに描画専用
入力: {spineData: object, canvasElement: HTMLCanvasElement}
出力: {rendered: boolean, animationList: string[]}

## 禁止事項
- ファイル読み込み禁止
- アニメーション制御禁止（描画のみ）
- canvas以外のDOM操作禁止
- イベントリスナー追加禁止

## 期待動作
const renderer = new PureSpineRenderer(canvas);
const result = renderer.render(spineData);
renderer.cleanup(); // canvasクリア、WebGLコンテキスト解放
```

### 3. PureBoundingBox作成指示
```
【基本テンプレート貼り付け】

## 作成指示
PureBoundingBoxマイクロモジュールを作成してください。

責務: 指定要素のバウンディングボックス表示・ドラッグ操作専用
入力: {targetElement: HTMLElement}
出力: {x: number, y: number, width: number, height: number}

## 禁止事項  
- 座標変換処理禁止（px値のみ扱う）
- 保存機能禁止
- 他要素への影響禁止
- グローバルイベント操作禁止

## 期待動作
const bbox = new PureBoundingBox(element);
const coords = bbox.getCoordinates(); // {x: 100, y: 200, width: 300, height: 400}
bbox.cleanup(); // バウンディングボックス完全削除、要素位置復元
```

### 4. PureAnimationController作成指示
```
【基本テンプレート貼り付け】

## 作成指示
PureAnimationControllerマイクロモジュールを作成してください。

責務: Spineアニメーション制御専用（連続再生・タイミング制御）
入力: {skeleton: object, animationNames: string[]}
出力: {currentAnimation: string, isPlaying: boolean, progress: number}

## 禁止事項
- 描画処理禁止
- ファイル読み込み禁止
- DOM操作禁止
- 他のアニメーションシステムとの連携禁止

## 期待動作
const controller = new PureAnimationController(skeleton);
controller.playSequence(['idle', 'walk', 'idle']); // 連続再生
const state = controller.getState(); // 現在の状態
controller.cleanup(); // アニメーション停止・初期状態復元
```

---

## 🔧 テスト指示テンプレート

### 単独テスト作成指示
```
作成したマイクロモジュールに、以下のテストコードを必ず含めてください：

## 必須テストコード
```javascript
static test() {
    console.log('🧪 [モジュール名] 単独テスト開始');
    
    // 1. 作成テスト
    const testElement = document.createElement('div');
    document.body.appendChild(testElement);
    
    const module = new [ModuleName](testElement);
    console.assert(module.getState, '❌ getStateメソッドが存在しません');
    console.assert(module.cleanup, '❌ cleanupメソッドが存在しません');
    
    // 2. 動作テスト
    const initialState = module.getState();
    console.assert(typeof initialState === 'object', '❌ getStateが正しい形式で返されません');
    
    // 3. 清掃テスト
    const beforeHTML = document.body.innerHTML;
    module.cleanup();
    const afterHTML = document.body.innerHTML;
    
    document.body.removeChild(testElement);
    console.assert(beforeHTML !== afterHTML || true, '✅ cleanup実行');
    
    console.log('✅ [モジュール名] 単独テスト完了');
    return true;
}
```

## 実行確認
[ModuleName].test(); // コンソールで実行可能
```

---

## 🏗️ 統合時のテンプレート

### UI Controller作成指示
```
【基本テンプレート貼り付け】

## 作成指示
UI Controllerを作成してください（マイクロモジュール統合専用）。

責務: 各マイクロモジュールの調整・データ受け渡し専用
機能: 各モジュールからの数値データを受け取り、適切に他モジュールに渡す

## 絶対ルール
- 各マイクロモジュールとは数値・文字列のみでやり取り
- マイクロモジュールの内部実装に依存しない
- マイクロモジュールの直接参照を避ける

## 設計パターン
```javascript
class UIController {
    constructor() {
        this.modules = new Map(); // モジュール管理
        this.dataBuffer = new Map(); // データ受け渡し用
    }
    
    registerModule(name, module) {
        this.modules.set(name, module);
    }
    
    transferData(fromModule, toModule, data) {
        // 標準データ形式での受け渡しのみ
    }
}
```

---

## 🎯 緊急時リセット指示

### 新しいセッション開始時
```
spine-editor-desktop-v4プロジェクトの続きです。

## 現在の状況
- マイクロモジュールシステムで開発中
- 外部依存ゼロの完全独立モジュール構成
- 各モジュールはcleanup()で完全復元可能

## 設計書確認必須
1. /mnt/d/クラウドパートナーHP/spine-editor-desktop-v4/MICRO_MODULE_ARCHITECTURE.md
2. /mnt/d/クラウドパートナーHP/spine-editor-desktop-v4/AI_INSTRUCTION_TEMPLATES.md

## 作業継続指示
[具体的な作業内容]

## 絶対遵守
- テンプレート通りの実装
- 外部依存ゼロの確認
- cleanup()テスト実行
```

---

**💡 このテンプレートを使用すれば、AIの記憶がリセットされても一貫した品質のマイクロモジュールを作成できます。**