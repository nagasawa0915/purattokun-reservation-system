# spine-editor-desktop-v4 マイクロモジュール設計書

## 🎯 設計哲学：完全独立・外部依存ゼロ

### 基本原則
1. **1モジュール1責務**：絶対に複数の機能を持たせない
2. **外部依存ゼロ**：他のモジュール、グローバル変数、複雑なライブラリに一切依存しない
3. **数値のみ受け渡し**：モジュール間はシンプルな数値・文字列のみでやり取り
4. **完全可逆**：cleanup()で必ず元の状態に戻る
5. **単独テスト可能**：他のモジュールなしでテストできる

---

## 📋 マイクロモジュール一覧

### 🎭 Spine関連モジュール

#### **1. PureSpineLoader**
```
責務: Spineファイルの読み込みのみ
入力: {atlasPath: string, jsonPath: string, pngPath: string}
出力: {loaded: boolean, spineData: object}
依存: Spine WebGLライブラリのみ（内包）
禁止: DOM操作、他モジュール参照、グローバル状態
```

#### **2. PureSpineRenderer** 
```
責務: Spineの描画のみ
入力: {spineData: object, canvasElement: HTMLCanvasElement}
出力: {rendered: boolean, animationList: string[]}
依存: なし（spineDataを受け取るのみ）
禁止: ファイル読み込み、イベント管理、状態管理
```

#### **3. PureSpineAnimationController**
```
責務: アニメーション制御のみ
入力: {animationName: string, loop: boolean, sequence: string[]}
出力: {currentAnimation: string, isPlaying: boolean, progress: number}
依存: なし
禁止: DOM操作、ファイル読み込み、他のアニメーション影響
```

### 🎯 編集関連モジュール

#### **4. PureBoundingBox**
```
責務: バウンディングボックス表示・ドラッグのみ
入力: {targetElement: HTMLElement}
出力: {x: number, y: number, width: number, height: number}
依存: なし
禁止: 座標変換、保存機能、他要素への影響
```

#### **5. PurePositionManager**
```
責務: 座標計算のみ
入力: {x: number, y: number, parentWidth: number, parentHeight: number}
出力: {percentX: number, percentY: number, pxX: number, pxY: number}
依存: なし（純粋な数学計算のみ）
禁止: DOM操作、保存機能、他モジュール参照
```

### 💾 データ関連モジュール

#### **6. PureStorageManager**
```
責務: データ保存・読み込みのみ
入力: {key: string, data: object}
出力: {success: boolean, data: object}
依存: localStorage（ブラウザ標準のみ）
禁止: DOM操作、座標計算、描画処理
```

#### **7. PureProjectManager**
```
責務: プロジェクトファイル管理のみ
入力: {folderPath: string}
出力: {files: string[], structure: object}
依存: Electronファイルシステムのみ
禁止: 描画処理、編集機能、状態管理
```

---

## 🔗 モジュール間通信仕様

### データ交換フォーマット（標準化）
```javascript
// 座標データ
const CoordinateData = {
    x: number,          // px単位
    y: number,          // px単位
    width: number,      // px単位
    height: number,     // px単位
    percentX: number,   // %単位
    percentY: number    // %単位
};

// Spineデータ  
const SpineData = {
    loaded: boolean,
    atlasData: string,
    jsonData: object,
    textureData: ImageData,
    animationList: string[]
};

// アニメーション制御データ
const AnimationControl = {
    name: string,
    loop: boolean,
    duration: number,
    sequence: string[]  // 連続再生リスト
};
```

---

## 🏗️ システム構成

### レイヤー構造
```
┌─────────────────────────────────────┐
│           UI Controller             │  ← 唯一の統合点
├─────────────────────────────────────┤
│  [PureSpineLoader] [PureBoundingBox] │
│  [PureSpineRenderer] [PurePosition] │  ← 完全独立モジュール層
│  [PureAnimation] [PureStorage]      │
├─────────────────────────────────────┤
│          Browser/Electron           │  ← プラットフォーム層
└─────────────────────────────────────┘
```

### 通信ルール
1. **UI Controller**のみが各マイクロモジュールを呼び出し
2. **マイクロモジュール同士は直接通信禁止**
3. **データは数値・文字列のみで受け渡し**
4. **UI Controllerが全ての調整を担当**

---

## 🎯 具体的な実装要件

### 各モジュールの必須メソッド
```javascript
class PureMicroModule {
    constructor(input) {
        // 入力検証
        // 初期状態バックアップ
        // 内部状態初期化（外部依存なし）
    }
    
    execute(params) {
        // 単一責務の実行
        // 結果を数値・文字列で返す
    }
    
    getState() {
        // 現在の状態を数値・文字列で返す
    }
    
    cleanup() {
        // 完全に元の状態に戻す
        // DOM変更、イベント、メモリリークなし
    }
    
    // テスト用
    static test() {
        // 単独動作テスト
        // 外部依存なしで実行可能
    }
}
```

---

## 🚀 開発フロー

### Phase 1: 基盤モジュール（1週間）
1. **PureSpineLoader**: Spineファイル読み込み専用
2. **PureSpineRenderer**: 描画専用
3. **PureBoundingBox**: 編集UI専用

### Phase 2: 制御モジュール（1週間） 
1. **PureAnimationController**: アニメーション制御専用
2. **PurePositionManager**: 座標計算専用
3. **PureStorageManager**: データ管理専用

### Phase 3: 統合（3日）
1. **UI Controller**: 各モジュールを調整する唯一のコントローラー
2. **テスト**: 全モジュールの独立性確認
3. **動作確認**: 実際の使用フロー確認

---

## 📝 AIへの指示テンプレート

### 新規モジュール作成時の標準指示
```
spine-editor-desktop-v4のマイクロモジュールを作成してください。

## 必須チェックリスト
- [ ] 外部依存: ゼロ（他モジュール参照禁止）
- [ ] 単一責務: [具体的な1つの機能のみ]
- [ ] 標準データ形式: CoordinateData/SpineData/AnimationControl使用
- [ ] cleanup()メソッド: 完全復元保証
- [ ] 単独テスト: test()メソッド必須

## 禁止事項
- 他のマイクロモジュール参照
- グローバル変数・window参照
- 複数責務の混在
- DOM操作範囲外への影響

## 期待する成果
- new Module(input)で即座に動作
- module.cleanup()で完全復元
- Module.test()で単独テスト可能
```

---

## 🎯 成功の定義

1. **各モジュールが単独でテスト実行できる**
2. **cleanup()実行後、DOM変更が一切残らない**  
3. **モジュール作成・削除を100回繰り返してもメモリリークなし**
4. **他のモジュール存在を一切知らない状態で動作**
5. **UI Controllerのみで全機能を組み合わせ可能**

---

**💡 この設計に従えば、複雑な依存関係の問題は完全に解決されます。**
**各モジュールは現実世界の部品のように、完全に独立して動作します。**