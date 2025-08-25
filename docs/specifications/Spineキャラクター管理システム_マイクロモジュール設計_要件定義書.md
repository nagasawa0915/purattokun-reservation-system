# Spineキャラクター管理システム マイクロモジュール設計 要件定義書

## 1. プロジェクト概要

### 1.1 目的
Spineアニメーションキャラクターの配置・アニメーション・インタラクションを、マイクロモジュール設計により環境非依存で管理できるシステムを構築する。

### 1.2 背景
- 従来の移植作業において、環境差異により動作不良が頻発
- Spine特有の座標系ルール（0.0中心配置）の見落とし
- 複雑な座標レイヤー管理による移植困難
- AIコーディング時の仕様見落とし問題

### 1.3 設計原則
- **完全自己完結**: 他モジュールへの依存関係ゼロ
- **数値のみの入出力**: オブジェクト参照を排除
- **環境非依存**: どの環境でも同じ動作を保証

---

## 2. システム構成

### 2.1 マイクロモジュール構成

```
/micromodules/
├── character-generator/     # キャラクター生成
├── positioning-system/      # 配置管理
├── animation-sequencer/     # アニメーション制御
└── interaction-handler/     # インタラクション管理
```

### 2.2 データフロー
```
キャラクター生成 → 配置設定 → アニメーション設定 → インタラクション設定 → 描画
```

---

## 3. 機能要件

### 3.1 キャラクター生成モジュール

#### 3.1.1 機能概要
Spineキャラクターの生成と複製を管理

#### 3.1.2 入力仕様
```javascript
{
  characterType: "hero",           // キャラクタータイプ
  spineFilePath: "assets/hero.json", // Spineファイルパス
  count: 3,                        // 生成数
  namePrefix: "hero"               // ID接頭辞（オプション）
}
```

#### 3.1.3 出力仕様
```javascript
[
  {
    characterId: "hero_001",
    characterType: "hero",
    spineData: {
      filePath: "assets/hero.json",
      defaultAnimation: "idle"
    }
  },
  // ... 複製分
]
```

#### 3.1.4 内部処理
- Spineファイルの読み込み
- ユニークIDの自動生成
- 初期設定の適用

---

### 3.2 配置システムモジュール

#### 3.2.1 機能概要
キャラクターの座標とレイヤー配置を管理

#### 3.2.2 入力仕様
```javascript
{
  characterId: "hero_001",
  baseX: 100,                      // 基準X座標
  baseY: 200,                      // 基準Y座標
  placementPattern: "grid",        // 配置パターン（grid/random/manual）
  spacing: 50,                     // 間隔（gridパターン時）
  zIndex: 5                        // レイヤー順序
}
```

#### 3.2.3 出力仕様
```javascript
{
  characterId: "hero_001",
  x: 0.0,                          // Spine座標系準拠（中心基準）
  y: 0.0,                          // Spine座標系準拠（中心基準）
  zIndex: 5,
  scale: 1.0
}
```

#### 3.2.4 内部処理
- 一般座標系からSpine座標系への変換
- 配置パターンの計算（グリッド、ランダム等）
- 座標レイヤーの複雑化回避処理
- スワップ処理による座標管理

---

### 3.3 アニメーションシーケンサーモジュール

#### 3.3.1 機能概要
アニメーションのタイミングとシーケンスを管理

#### 3.3.2 入力仕様
```javascript
{
  characterId: "hero_001",
  startDelay: 3000,                // 開始遅延（ミリ秒）
  sequence: [
    {
      animation: "idle",
      duration: 2000,
      loop: false
    },
    {
      animation: "walk",
      duration: -1,                 // -1は無限
      loop: true
    }
  ],
  defaultAnimation: "idle"         // 初期・復帰アニメーション
}
```

#### 3.3.3 出力仕様
```javascript
{
  characterId: "hero_001",
  timeline: [
    {
      startTime: 3000,
      animation: "idle",
      duration: 2000,
      loop: false
    },
    {
      startTime: 5000,
      animation: "walk",
      duration: -1,
      loop: true
    }
  ],
  currentAnimation: "idle"
}
```

#### 3.3.4 内部処理
- タイムライン計算
- アニメーション切り替えタイミング制御
- ループ処理の管理

---

### 3.4 インタラクションハンドラーモジュール

#### 3.4.1 機能概要
クリック等のユーザーインタラクションを管理

#### 3.4.2 入力仕様
```javascript
{
  characterId: "hero_001",
  interactions: {
    click: {
      animation: "attack",
      duration: 1500,
      returnToDefault: true
    },
    hover: {
      animation: "alert",
      duration: 500,
      returnToDefault: true
    }
  }
}
```

#### 3.4.3 出力仕様
```javascript
{
  characterId: "hero_001",
  eventHandlers: {
    click: {
      triggerAnimation: "attack",
      duration: 1500,
      returnAnimation: "idle"
    },
    hover: {
      triggerAnimation: "alert", 
      duration: 500,
      returnAnimation: "idle"
    }
  }
}
```

#### 3.4.4 内部処理
- イベントタイプの検証
- アニメーション切り替え制御
- デフォルトアニメーションへの復帰処理

---

## 4. 非機能要件

### 4.1 環境非依存性
- 各モジュールは他のモジュール・ライブラリに依存しない
- 必要なライブラリは各モジュール内に内包
- 設定値はハードコードまたは引数で完結

### 4.2 移植性
- フォルダごとのコピーで完全移植可能
- 環境差異による動作変更なし
- テストデータによる動作検証可能

### 4.3 テスト性
- 各モジュールの独立テスト可能
- 入力・出力の明確な仕様
- モックデータによる検証

### 4.4 保守性
- 機能追加は該当モジュール内のみ
- 他モジュールへの影響なし
- 視覚的なフォルダ構造による管理

---

## 5. ファイル構成

### 5.1 各モジュールフォルダ構成
```
/micromodules/[module-name]/
├── [module-name].js           # メイン処理
├── lib/                       # 内包ライブラリ
├── test/
│   ├── test-data.json        # テストデータ
│   └── expected-output.json  # 期待する出力
├── README.md                 # 使用方法・仕様
└── examples/                 # 使用例
```

### 5.2 統合例
```
/project-root/
├── micromodules/
│   ├── character-generator/
│   ├── positioning-system/
│   ├── animation-sequencer/
│   └── interaction-handler/
└── main.js                   # 統合処理
```

---

## 6. 使用フロー例

### 6.1 基本的な使用手順
```javascript
// 1. キャラクター生成
const characters = characterGenerator({
  characterType: "hero",
  spineFilePath: "assets/hero.json",
  count: 3
});

// 2. 配置設定
const positions = characters.map(char => 
  positioningSystem({
    characterId: char.characterId,
    baseX: 100,
    baseY: 200,
    placementPattern: "grid"
  })
);

// 3. アニメーション設定
const animations = characters.map(char =>
  animationSequencer({
    characterId: char.characterId,
    startDelay: Math.random() * 3000,
    sequence: [
      { animation: "idle", duration: 2000 },
      { animation: "walk", duration: -1, loop: true }
    ]
  })
);

// 4. インタラクション設定
const interactions = characters.map(char =>
  interactionHandler({
    characterId: char.characterId,
    interactions: {
      click: { animation: "attack", duration: 1500 }
    }
  })
);
```

---

## 7. 成功基準

### 7.1 技術的成功基準
- [ ] 各モジュールが完全に独立して動作する
- [ ] 環境を変えても同じ出力が得られる
- [ ] フォルダコピーによる移植が成功する
- [ ] AIコーディング時の見落としが発生しない

### 7.2 運用面での成功基準
- [ ] 新機能追加時の影響範囲が単一モジュール内に限定される
- [ ] Spine仕様変更への対応が該当モジュールのみで完了する
- [ ] 開発者が直感的にモジュール構造を理解できる

---

## 8. 今後の拡張予定

### 8.1 追加予定モジュール
- サウンド制御モジュール
- エフェクト管理モジュール
- データ永続化モジュール

### 8.2 機能拡張
- 複数キャラクター間の連携アニメーション
- 動的配置変更機能
- パフォーマンス最適化機能

---

## 9. 関連ドキュメント

### 9.1 既存システムとの関係
- **v3.0システム**: 現行のモノリス設計から段階的移行
- **Phase 10完了**: デスクトップアプリv2.0の6モジュール統合システムを参考
- **マイクロモジュール設計**: spine-editor-desktop-v4/MICRO_MODULE_ARCHITECTURE.mdの原則適用

### 9.2 技術基盤
- **座標系管理**: SPINE_COORDINATE_SYSTEM_ANALYSIS.mdの知見活用
- **完全移植**: 完全移植専門エージェント統合設計書の手法適用
- **品質保証**: 既存のトラブルシューティング体系を継承

---

**📋 この要件定義書は、v3.0システムの成果を基に、より安定で移植性の高いマイクロモジュール設計への進化を目指すものです。**