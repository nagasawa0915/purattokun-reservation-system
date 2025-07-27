# レイヤー問題診断ガイド

このファイルは「ぷらっとくんの予約システム」でのレイヤー問題の診断と解決に特化したガイドです。

> **📘 日常的な作業**: [CLAUDE.md](../CLAUDE.md) を参照  
> **📖 技術仕様**: [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) を参照  
> **🔧 Spine問題**: [SPINE_TROUBLESHOOTING.md](./SPINE_TROUBLESHOOTING.md) を参照

---

## 🎨 レイヤー構造の基礎理解

### DOM の親子関係とレイヤー構造

HTML/CSSでは **親要素の変形が子要素に継承される** という仕組みがあります：

```html
<section class="hero">  <!-- 親レイヤー -->
    <div class="hero-content">白い枠</div>  <!-- 子レイヤー1 -->
    <canvas>ぷらっとくん</canvas>          <!-- 子レイヤー2 -->
</section>
```

### 📐 座標系の継承メカニズム

**問題のあった構造：**
```
.hero コンテナ（親レイヤー）
├─ 背景画像（background）
├─ 白い枠（hero-content）
└─ ぷらっとくん（canvas） ← 問題！白い枠と同じ動き
```

**解決後の構造：**
```
body（最上位レイヤー）
├─ .hero コンテナ
│   ├─ 背景画像（background）
│   └─ 白い枠（hero-content）
└─ ぷらっとくん（canvas） ← 独立レイヤーに移動！
```

---

## 🔍 問題パターンと症状

### パターン1: 白い枠と同じ動き
**症状**: ウィンドウリサイズ時に、ぷらっとくんが白い枠（hero-content）と一緒に動く

**原因**: Canvas が `.hero` の子要素として配置されている
```javascript
// 問題のあるコード
container.appendChild(canvas); // .hero内に配置
```

**解決策**: Canvas を body に直接配置
```javascript
// 解決コード
document.body.appendChild(canvas); // bodyに直接配置
canvas.style.position = 'absolute';
canvas.style.left = '18vw';
canvas.style.top = '49vh';
```

### パターン2: 座標がずれる・表示されない
**症状**: ぷらっとくんが予期しない位置に表示される、または表示されない

**原因1**: JavaScript と CSS の座標設定が競合
```css
/* CSS側 */
canvas { left: 20px !important; }
```
```javascript
// JavaScript側
canvas.style.left = '18vw'; // CSS の !important で無効化される
```

**原因2**: 親要素の position context の影響
```css
.hero {
    position: relative; /* 子要素の基準点になる */
    max-width: 1200px;  /* サイズ制限 */
    margin: 0 auto;     /* 中央配置で位置が変わる */
}
```

### パターン3: スクロール時の予期しない動作
**症状**: スクロール時にぷらっとくんが画面から消える、または固定されすぎる

**原因**: position の設定ミス
- `position: fixed` → 画面固定（スクロールしても動かない）
- `position: absolute` → 親要素基準（背景画像と同期）

---

## 🛠️ 診断ツールとデバッグコマンド

### 診断コマンド1: 親要素チェーン確認
```javascript
// ブラウザのコンソールで実行
function checkParentChain(element) {
    let parent = element.parentElement;
    let level = 0;
    console.log('=== 親要素チェーン ===');
    while (parent && level < 5) {
        const style = getComputedStyle(parent);
        console.log(`Level ${level}: ${parent.tagName}`);
        console.log(`  position: ${style.position}`);
        console.log(`  transform: ${style.transform}`);
        console.log(`  overflow: ${style.overflow}`);
        console.log(`  max-width: ${style.maxWidth}`);
        parent = parent.parentElement;
        level++;
    }
}

// 使用例
const canvas = document.querySelector('canvas[data-spine-character]');
if (canvas) {
    checkParentChain(canvas);
} else {
    console.log('❌ Canvas要素が見つかりません');
}
```

### 診断コマンド2: 座標系診断
```javascript
function diagnoseCoordinateSystem(element) {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    
    console.log('=== 座標系診断 ===');
    console.log('要素の実際の位置:', rect);
    console.log('CSS設定値:', {
        position: style.position,
        left: style.left,
        top: style.top,
        transform: style.transform,
        zIndex: style.zIndex
    });
    console.log('基準要素:', element.offsetParent?.tagName || 'viewport');
    
    // 期待される位置との比較
    const expectedLeft = window.innerWidth * 0.18;
    const expectedTop = window.innerHeight * 0.49;
    console.log('期待位置 (18vw, 49vh):', { 
        left: expectedLeft, 
        top: expectedTop 
    });
    console.log('位置のずれ:', {
        left: rect.left - expectedLeft,
        top: rect.top - expectedTop
    });
}

// 使用例
const canvas = document.querySelector('canvas[data-spine-character]');
if (canvas) {
    diagnoseCoordinateSystem(canvas);
}
```

### 診断コマンド3: リサイズ時の動作確認
```javascript
function testResizeBehavior(element) {
    const initialRect = element.getBoundingClientRect();
    console.log('=== リサイズテスト開始 ===');
    console.log('初期位置:', initialRect);
    
    let resizeCount = 0;
    const resizeHandler = () => {
        resizeCount++;
        const newRect = element.getBoundingClientRect();
        console.log(`リサイズ ${resizeCount}回目:`, newRect);
        console.log('移動量:', {
            x: newRect.left - initialRect.left,
            y: newRect.top - initialRect.top
        });
        
        // 期待される動作チェック
        const expectedLeft = window.innerWidth * 0.18;
        const expectedTop = window.innerHeight * 0.49;
        const tolerance = 10; // 10px の誤差は許容
        
        const isCorrectX = Math.abs(newRect.left - expectedLeft) < tolerance;
        const isCorrectY = Math.abs(newRect.top - expectedTop) < tolerance;
        
        console.log('位置の正確性:', {
            X軸: isCorrectX ? '✅ 正常' : '❌ ずれ',
            Y軸: isCorrectY ? '✅ 正常' : '❌ ずれ'
        });
    };
    
    window.addEventListener('resize', resizeHandler);
    console.log('ウィンドウをリサイズしてテストしてください');
    
    // 10秒後に自動停止
    setTimeout(() => {
        window.removeEventListener('resize', resizeHandler);
        console.log('=== リサイズテスト終了 ===');
    }, 10000);
}

// 使用例
const canvas = document.querySelector('canvas[data-spine-character]');
if (canvas) {
    testResizeBehavior(canvas);
}
```

### 診断コマンド4: レイヤー整合性チェック
```javascript
function validateLayerIntegrity() {
    const tests = [
        {
            name: 'キャラクターの親要素チェック',
            test: () => {
                const canvas = document.querySelector('canvas[data-spine-character]');
                return canvas && canvas.parentElement === document.body;
            },
            fix: 'Canvas を document.body に直接配置してください'
        },
        {
            name: '座標系の確認',
            test: () => {
                const canvas = document.querySelector('canvas[data-spine-character]');
                if (!canvas) return false;
                const style = getComputedStyle(canvas);
                return style.position === 'absolute';
            },
            fix: 'canvas.style.position = "absolute" を設定してください'
        },
        {
            name: 'ビューポート基準の座標設定',
            test: () => {
                const canvas = document.querySelector('canvas[data-spine-character]');
                if (!canvas) return false;
                const style = getComputedStyle(canvas);
                return style.left.includes('vw') && style.top.includes('vh');
            },
            fix: 'vw/vh 単位で座標を設定してください'
        },
        {
            name: 'z-index の適切な設定',
            test: () => {
                const canvas = document.querySelector('canvas[data-spine-character]');
                if (!canvas) return false;
                const style = getComputedStyle(canvas);
                return parseInt(style.zIndex) >= 10;
            },
            fix: 'z-index: 10 以上を設定してください'
        }
    ];
    
    console.log('=== レイヤー整合性チェック ===');
    tests.forEach(test => {
        const result = test.test();
        console.log(`${test.name}: ${result ? '✅ PASS' : '❌ FAIL'}`);
        if (!result) {
            console.log(`  💡 対処法: ${test.fix}`);
        }
    });
    
    const failedTests = tests.filter(test => !test.test());
    if (failedTests.length === 0) {
        console.log('🎉 すべてのテストが合格しました！');
    } else {
        console.log(`⚠️ ${failedTests.length}個の問題が見つかりました`);
    }
}

// 使用例
validateLayerIntegrity();
```

---

## 📋 問題解決チェックリスト

### Phase 1: 基本確認
- [ ] Canvas要素が存在するか？
- [ ] Canvas の親要素は `document.body` か？
- [ ] `position: absolute` が設定されているか？
- [ ] vw/vh 単位で座標が設定されているか？

### Phase 2: 座標系確認
- [ ] 期待される位置（18vw, 49vh）に表示されているか？
- [ ] ウィンドウリサイズ時に正しく追従するか？
- [ ] 他の要素（白い枠）と独立して動作するか？
- [ ] z-index が適切に設定されているか？

### Phase 3: 深層診断
- [ ] JavaScript と CSS の競合がないか？
- [ ] 親要素の transform や overflow の影響がないか？
- [ ] コンソールエラーが発生していないか？
- [ ] ブラウザキャッシュの問題がないか？

---

## 🚨 緊急時の対処法

### 即座に試す解決策

1. **ブラウザキャッシュクリア**
   ```bash
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

2. **Canvas の親要素を強制変更**
   ```javascript
   const canvas = document.querySelector('canvas[data-spine-character]');
   if (canvas && canvas.parentElement !== document.body) {
       document.body.appendChild(canvas);
       console.log('🔧 Canvas を body に移動しました');
   }
   ```

3. **座標の強制リセット**
   ```javascript
   const canvas = document.querySelector('canvas[data-spine-character]');
   if (canvas) {
       canvas.style.position = 'absolute';
       canvas.style.left = '18vw';
       canvas.style.top = '49vh';
       canvas.style.transform = 'translate(-50%, -50%)';
       canvas.style.zIndex = '10';
       console.log('🔧 座標を強制リセットしました');
   }
   ```

### 最終手段: デバッグモードの実行
```javascript
// 全診断を一括実行
function emergencyDiagnosis() {
    console.log('🚨 緊急診断開始 🚨');
    
    const canvas = document.querySelector('canvas[data-spine-character]');
    if (!canvas) {
        console.log('❌ Canvas要素が見つかりません！');
        return;
    }
    
    // 1. レイヤー整合性チェック
    validateLayerIntegrity();
    
    // 2. 親要素チェーン
    checkParentChain(canvas);
    
    // 3. 座標系診断
    diagnoseCoordinateSystem(canvas);
    
    // 4. 強制修正
    if (canvas.parentElement !== document.body) {
        document.body.appendChild(canvas);
        console.log('🔧 親要素を修正');
    }
    
    canvas.style.position = 'absolute';
    canvas.style.left = '18vw';
    canvas.style.top = '49vh';
    canvas.style.transform = 'translate(-50%, -50%)';
    canvas.style.zIndex = '10';
    
    console.log('🎯 緊急修正完了');
    console.log('ウィンドウをリサイズして動作確認してください');
}

// 使用例
emergencyDiagnosis();
```

---

## 📖 予防策と設計指針

### 設計時の注意点
1. **独立性の原則**: 重要な要素は親要素の制約を受けない設計
2. **座標系の一貫性**: 同じ基準（viewport, container等）で統一
3. **依存関係の最小化**: 他の要素の変更が影響しない構造

### コードレビューのチェック項目
- Canvas の配置先（body推奨）
- position の設定（absolute/fixed の選択理由）
- 座標単位の統一（vw/vh vs px）
- z-index の適切な設定

### 文書化の重要性
- レイヤー構造図の作成
- 座標系の仕様書
- 問題解決手順の記録

---

## 🔗 関連ドキュメント

- **[CLAUDE.md](../CLAUDE.md)**: 日常的な開発作業とぷらっとくん位置調整
- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)**: 技術仕様と実装パターン
- **[ARCHITECTURE_NOTES.md](./ARCHITECTURE_NOTES.md)**: Spine統合と設計思想
- **[SPINE_TROUBLESHOOTING.md](./SPINE_TROUBLESHOOTING.md)**: Spine特有の問題解決

---

## 💡 よくある質問

**Q: なぜ背景画像レイヤーに直接配置できないのか？**
A: CSS の `background` は装飾レイヤーとして扱われ、子要素を配置するコンテンツレイヤーとは別物です。背景画像の座標系に直接アクセスする方法がないため、数学的に位置を合わせる必要があります。

**Q: 白い枠に乗せることができたのに、なぜ背景画像にはできないのか？**
A: 白い枠（`.hero-content`）は実際のHTML要素（コンテンツレイヤー）ですが、背景画像は CSS装飾（装飾レイヤー）だからです。

**Q: 毎回同じ問題が起きるのを防ぐには？**
A: このファイルの診断ツールを定期的に実行し、レイヤー整合性チェックを自動化することを推奨します。また、コード変更時は必ず `validateLayerIntegrity()` を実行してください。