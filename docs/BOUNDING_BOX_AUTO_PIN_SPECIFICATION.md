# PureBoundingBox 自動ピン適用システム仕様書

**バージョン**: 1.0  
**対象**: PureBoundingBox + ElementObserver Phase 1統合  
**作成日**: 2025-08-29  

---

## 🎯 概要

PureBoundingBox 自動ピン適用システムは、**「保存 = 自動ピン留め」**により、ユーザーがピン機能を意識することなく、キャラクターの自動追従機能を利用できるシームレスなシステムです。

### 🚀 設計思想
- **透明性**: ユーザーはピン機能を意識しない
- **直感性**: 既存の「保存」操作がそのまま自動追従を有効化
- **互換性**: 従来のバウンディングボックス操作は完全保持
- **安定性**: ElementObserver Phase 1 の環境揺れ吸収技術活用

---

## 🎮 ユーザー操作フロー

### 従来のフロー（変更なし）
1. キャラクターをクリック → バウンディングボックス表示
2. ドラッグ・リサイズで位置・サイズ調整
3. **「保存」ボタンをクリック**
4. 設定確定・バウンディングボックス非表示

### 新しいフロー（透明な拡張）
1. キャラクターをクリック → バウンディングボックス表示
2. ドラッグ・リサイズで位置・サイズ調整
3. **「保存」ボタンをクリック**
4. 🔄 **システムが自動実行**:
   - 背景要素の自動検出
   - 最適なアンカーポイントの計算
   - ピン留めの自動設定
   - ElementObserver Phase 1 による追従開始
5. 設定確定・バウンディングボックス非表示
6. 🎯 **以後、自動追従が有効**（ユーザー透明）

---

## 🔧 技術仕様

### システム構成
```
PureBoundingBox (既存)
├── PureBoundingBoxCore.js
├── PureBoundingBoxBounds.js  
├── PureBoundingBoxUI.js      ← 保存処理拡張
├── PureBoundingBoxEvents.js
└── PureBoundingBoxAutoPin.js ← 新規追加

ElementObserver Phase 1 (連携)
├── ElementObserver.js
├── ElementObserverCore.js
└── 環境揺れ吸収・親要素監視システム
```

### 新規モジュール: PureBoundingBoxAutoPin.js
```javascript
/**
 * PureBoundingBoxAutoPin.js
 * 
 * 🎯 自動ピン適用マイクロモジュール
 * - 外部依存: ElementObserver, PureBoundingBoxCore
 * - 責務: 保存時の自動ピン設定のみ
 */
class PureBoundingBoxAutoPin {
    constructor(core, observer) {
        this.core = core;
        this.observer = observer; // ElementObserver instance
        this.activePins = new Map(); // nodeId -> pinConfig
    }
    
    /**
     * 🎯 保存時自動ピン適用（メイン機能）
     */
    async applyAutoPinOnSave(saveData) {
        try {
            console.log('🎯 保存時自動ピン適用開始');
            
            // 1. 背景要素の自動検出
            const backgroundElement = this.detectBackgroundElement(saveData.targetElement);
            
            // 2. 最適アンカーポイントの計算
            const optimalAnchor = this.calculateOptimalAnchor(saveData.bounds, backgroundElement);
            
            // 3. 既存ピンのクリーンアップ
            this.cleanupExistingPin(this.core.config.nodeId);
            
            // 4. 新しいピンの設定
            const pinConfig = await this.createAutoPin({
                targetElement: backgroundElement,
                spineElement: saveData.targetElement,
                anchor: optimalAnchor,
                bounds: saveData.bounds
            });
            
            // 5. ピン情報の記録
            this.activePins.set(this.core.config.nodeId, pinConfig);
            
            console.log('✅ 自動ピン適用完了:', pinConfig);
            
            return {
                success: true,
                pinConfig: pinConfig,
                message: `自動追従機能が有効になりました (${optimalAnchor})`
            };
            
        } catch (error) {
            console.error('❌ 自動ピン適用エラー:', error);
            
            return {
                success: false,
                error: error.message,
                fallback: 'ピン機能なしで保存完了'
            };
        }
    }
}
```

---

## 🎯 背景要素自動検出システム

### 検出アルゴリズム
```javascript
detectBackgroundElement(targetElement) {
    // 検出優先度順リスト
    const detectionStrategies = [
        () => this.findParentWithBackground(targetElement),
        () => this.findNearbyImageElement(targetElement),
        () => this.findSectionContainer(targetElement),
        () => this.findMainContainer(targetElement),
        () => targetElement.parentElement // フォールバック
    ];
    
    for (const strategy of detectionStrategies) {
        const result = strategy();
        if (result && this.validateBackgroundElement(result)) {
            return result;
        }
    }
    
    // 最終フォールバック
    return document.body;
}
```

### 検出戦略詳細

#### 1. 背景画像付き親要素の検出
```javascript
findParentWithBackground(element) {
    let current = element.parentElement;
    while (current && current !== document.body) {
        const style = getComputedStyle(current);
        if (style.backgroundImage !== 'none' || 
            style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            return current;
        }
        current = current.parentElement;
    }
    return null;
}
```

#### 2. 近接画像要素の検出
```javascript
findNearbyImageElement(element) {
    const siblings = Array.from(element.parentElement.children);
    const images = siblings.filter(el => 
        el.tagName === 'IMG' && 
        el.offsetWidth > 200 && 
        el.offsetHeight > 200
    );
    
    // 最大の画像を選択
    return images.sort((a, b) => 
        (b.offsetWidth * b.offsetHeight) - (a.offsetWidth * a.offsetHeight)
    )[0] || null;
}
```

#### 3. セクションコンテナの検出
```javascript
findSectionContainer(element) {
    const containers = [
        element.closest('section'),
        element.closest('.hero'),
        element.closest('.container'),
        element.closest('main')
    ];
    
    return containers.find(el => 
        el && el.offsetWidth > 300 && el.offsetHeight > 200
    ) || null;
}
```

---

## 📍 最適アンカーポイント計算システム

### 計算アルゴリズム
```javascript
calculateOptimalAnchor(bounds, backgroundElement) {
    // 背景要素内での相対位置を計算
    const bgRect = backgroundElement.getBoundingClientRect();
    const spineRect = {
        x: bounds.left,
        y: bounds.top,
        width: bounds.width,
        height: bounds.height,
        centerX: bounds.left + bounds.width / 2,
        centerY: bounds.top + bounds.height / 2
    };
    
    // 正規化座標（0.0-1.0）
    const normalizedX = (spineRect.centerX - bgRect.left) / bgRect.width;
    const normalizedY = (spineRect.centerY - bgRect.top) / bgRect.height;
    
    // アンカーポイントマッピング
    return this.mapToAnchorPoint(normalizedX, normalizedY);
}

mapToAnchorPoint(x, y) {
    // 9分割グリッドでアンカー決定
    const xZone = x < 0.33 ? 'L' : x > 0.67 ? 'R' : 'C';
    const yZone = y < 0.33 ? 'T' : y > 0.67 ? 'B' : 'M';
    
    const anchorMap = {
        'TL': 'TL', 'TC': 'TC', 'TR': 'TR',
        'ML': 'ML', 'MC': 'MC', 'MR': 'MR', 
        'BL': 'BL', 'BC': 'BC', 'BR': 'BR'
    };
    
    return anchorMap[yZone + xZone] || 'MC'; // デフォルト: 中央
}
```

### 特殊ケース対応
```javascript
// レスポンシブ考慮
if (this.isResponsiveLayout(backgroundElement)) {
    return this.adjustAnchorForResponsive(calculatedAnchor);
}

// 小さな要素の場合
if (bgRect.width < 400 || bgRect.height < 300) {
    return 'MC'; // 中央固定
}

// 縦長レイアウト
if (bgRect.height / bgRect.width > 1.5) {
    return normalizedY < 0.5 ? 'TC' : 'BC';
}

// 横長レイアウト  
if (bgRect.width / bgRect.height > 2.0) {
    return normalizedX < 0.5 ? 'ML' : 'MR';
}
```

---

## 🔄 システム統合

### PureBoundingBoxUI.js 拡張
```javascript
class PureBoundingBoxUI {
    constructor(core) {
        this.core = core;
        // 🎯 自動ピンシステム統合
        this.autoPin = null;
        this.initializeAutoPin();
    }
    
    async initializeAutoPin() {
        try {
            // ElementObserver Phase 1 初期化
            const observer = new ElementObserver();
            // Phase 1はシンプルなコンストラクタのみ
            
            // 自動ピンシステム初期化
            this.autoPin = new PureBoundingBoxAutoPin(this.core, observer);
            
            console.log('🎯 自動ピンシステム統合完了 (ElementObserver Phase 1)');
        } catch (error) {
            console.warn('⚠️ 自動ピンシステム無効 - 基本機能のみ利用:', error.message);
            this.autoPin = null;
        }
    }
    
    /**
     * 保存処理拡張（既存メソッドの拡張）
     */
    async handleSave() {
        // 既存の保存処理
        const saveData = {
            targetElement: this.core.config.targetElement,
            bounds: this.core.bounds.getCurrentBounds(),
            timestamp: Date.now()
        };
        
        // localStorage保存
        this.core.saveToLocalStorage(saveData);
        
        // 🎯 自動ピン適用
        if (this.autoPin) {
            const pinResult = await this.autoPin.applyAutoPinOnSave(saveData);
            
            if (pinResult.success) {
                // 成功時の視覚フィードバック
                this.showAutoPinFeedback(pinResult.pinConfig);
                console.log('🎯 自動追従機能が有効になりました:', pinResult.pinConfig.anchor);
            } else {
                // 失敗時は通常の保存のみ
                console.log('📝 基本保存完了 (自動追従なし):', pinResult.fallback);
            }
        }
        
        // UI非表示
        this.hide();
        
        // 保存完了イベント
        this.core.events.trigger('save-completed', {
            saveData,
            autoPinEnabled: !!this.autoPin
        });
    }
}
```

### 視覚的フィードバック
```javascript
showAutoPinFeedback(pinConfig) {
    // ピンアイコンの一時表示
    const pinIndicator = document.createElement('div');
    pinIndicator.innerHTML = '📍';
    pinIndicator.style.cssText = `
        position: fixed;
        z-index: 10001;
        font-size: 24px;
        pointer-events: none;
        animation: pin-success 2s ease-out forwards;
    `;
    
    // アンカーポイント位置に表示
    const targetRect = pinConfig.targetElement.getBoundingClientRect();
    const anchorPos = this.calculateAnchorPosition(targetRect, pinConfig.anchor);
    
    pinIndicator.style.left = anchorPos.x + 'px';
    pinIndicator.style.top = anchorPos.y + 'px';
    
    document.body.appendChild(pinIndicator);
    
    // 2秒後に自動削除
    setTimeout(() => pinIndicator.remove(), 2000);
}
```

---

## 📊 パフォーマンス仕様

### 処理時間目標
- **背景要素検出**: < 10ms
- **アンカーポイント計算**: < 5ms  
- **ピン設定処理**: < 20ms
- **合計追加時間**: < 50ms (保存処理への影響最小化)

### メモリ使用量
- **AutoPinモジュール**: < 100KB
- **アクティブピン1個**: < 30KB
- **最大同時ピン数**: 10個 (既存キャラクター分)

### ElementObserver Phase 1技術活用
```javascript
// 環境揺れ吸収技術の活用
class PureBoundingBoxAutoPin {
    async createAutoPin(config) {
        // ElementObserver Phase 1 機能利用
        const observer = this.observer;
        
        // 親要素サイズ監視開始
        const startTime = performance.now();
        
        // 基本的な要素監視機能を利用
        const unobserve = observer.observe(
            config.targetElement,
            (rect, changeType) => {
                // 背景要素の変化に応じてSpine要素を追従
                this.updateSpinePosition(config.spineElement, rect, config.anchor);
            }
        );
        
        const processingTime = performance.now() - startTime;
        
        console.log(`⚡ 自動ピン作成: ${processingTime.toFixed(4)}ms`);
        
        return {
            id: `auto-pin-${Date.now()}`,
            anchor: config.anchor,
            targetElement: config.targetElement,
            spineElement: config.spineElement,
            unobserve: unobserve,
            processingTime
        };
    }
    
    /**
     * 🎯 Spine要素の位置更新処理
     */
    updateSpinePosition(spineElement, backgroundRect, anchor) {
        // アンカーポイントに基づいた位置計算
        const anchorPos = this.calculateAnchorPosition(backgroundRect, anchor);
        
        // CSSスタイル適用
        spineElement.style.left = anchorPos.x + 'px';
        spineElement.style.top = anchorPos.y + 'px';
    }
    
    /**
     * 📍 アンカーポイントの座標計算
     */
    calculateAnchorPosition(backgroundRect, anchor) {
        const { left, top, width, height } = backgroundRect;
        
        // アンカーポイントの座標マッピング
        const anchorMap = {
            'TL': { x: left, y: top },                                    // Top-Left
            'TC': { x: left + width / 2, y: top },                       // Top-Center  
            'TR': { x: left + width, y: top },                           // Top-Right
            'ML': { x: left, y: top + height / 2 },                      // Middle-Left
            'MC': { x: left + width / 2, y: top + height / 2 },          // Middle-Center
            'MR': { x: left + width, y: top + height / 2 },              // Middle-Right
            'BL': { x: left, y: top + height },                          // Bottom-Left
            'BC': { x: left + width / 2, y: top + height },              // Bottom-Center
            'BR': { x: left + width, y: top + height }                   // Bottom-Right
        };
        
        return anchorMap[anchor] || anchorMap['MC']; // デフォルト: 中央
    }
}
```

---

## 🚨 エラーハンドリング・フォールバック

### エラー分類と対処
| エラータイプ | 原因 | 対処法 |
|-------------|------|--------|
| `BackgroundNotFound` | 適切な背景要素が見つからない | document.bodyをフォールバック使用 |
| `ElementObserverUnavailable` | ElementObserver Phase 1が利用不可 | 基本保存のみ実行 |
| `AnchorCalculationFailed` | アンカー計算エラー | デフォルトMC（中央）使用 |
| `PinCreationFailed` | ピン設定処理失敗 | 基本保存のみ・警告ログ出力 |

### グレースフルデグラデーション
```javascript
async applyAutoPinOnSave(saveData) {
    try {
        // フル機能での自動ピン適用
        return await this.fullAutoPinProcess(saveData);
        
    } catch (primaryError) {
        console.warn('⚠️ 自動ピン適用失敗 - 簡易モードで再試行:', primaryError.message);
        
        try {
            // 簡易モード（最小限の機能）
            return await this.fallbackAutoPinProcess(saveData);
            
        } catch (fallbackError) {
            console.warn('⚠️ 簡易モードも失敗 - 基本保存のみ:', fallbackError.message);
            
            // 完全フォールバック（ピンなし保存）
            return {
                success: false,
                error: 'AutoPin disabled',
                fallback: '基本保存完了 (自動追従機能なし)'
            };
        }
    }
}
```

---

## 🧪 テスト仕様

### 単体テスト
```javascript
describe('PureBoundingBoxAutoPin', () => {
    test('背景要素の自動検出', () => {
        const autoPin = new PureBoundingBoxAutoPin(mockCore, mockObserver);
        const background = autoPin.detectBackgroundElement(testSpineElement);
        
        expect(background).toBeTruthy();
        expect(background.offsetWidth).toBeGreaterThan(0);
    });
    
    test('最適アンカーポイント計算', () => {
        const bounds = { left: 100, top: 50, width: 50, height: 50 };
        const bgElement = mockBackgroundElement; // 300x200
        
        const anchor = autoPin.calculateOptimalAnchor(bounds, bgElement);
        expect(anchor).toMatch(/^[TMB][LCR]$/); // 正規表現: 2文字のアンカー
    });
    
    test('保存時自動ピン適用', async () => {
        const saveData = { targetElement: mockSpine, bounds: mockBounds };
        const result = await autoPin.applyAutoPinOnSave(saveData);
        
        expect(result.success).toBe(true);
        expect(result.pinConfig).toBeDefined();
        expect(result.pinConfig.anchor).toMatch(/^[TMB][LCR]$/);
    });
});
```

### 統合テスト
```javascript
describe('BoundingBox + AutoPin Integration', () => {
    test('保存ボタンクリック → 自動ピン適用', async () => {
        const boundingBox = new PureBoundingBox(config);
        await boundingBox.execute();
        
        // 位置調整
        const moveHandle = document.querySelector('[data-handle-type="move"]');
        simulateMouseDrag(moveHandle, { x: 100, y: 50 });
        
        // 保存ボタンクリック
        const saveButton = document.querySelector('.save-button');
        saveButton.click();
        
        await waitForAsyncOperations();
        
        // ピン適用確認
        const activePins = boundingBox.autoPin.activePins;
        expect(activePins.size).toBe(1);
        
        // 追従動作確認
        const backgroundElement = activePins.get(config.nodeId).targetElement;
        simulateResize(backgroundElement, { width: 400, height: 300 });
        
        await waitForFrameUpdate();
        
        const spinePosition = getElementPosition(config.targetElement);
        expect(spinePosition).toEqual(expectedPositionAfterResize);
    });
});
```

### E2Eテスト
```javascript
describe('User Experience Flow', () => {
    test('完全な操作フロー', async () => {
        // キャラクタークリック
        await page.click('#spine-character');
        await page.waitForSelector('.bb-container');
        
        // 位置調整
        await page.drag('.bb-container [data-handle-type="move"]', { x: 150, y: 100 });
        
        // 保存クリック
        await page.click('.save-button');
        
        // バウンディングボックス消失確認
        await page.waitForSelector('.bb-container', { state: 'hidden' });
        
        // ピンフィードバック確認
        await page.waitForSelector('div:has-text("📍")', { timeout: 3000 });
        
        // 自動追従テスト：ブラウザリサイズ
        const originalPosition = await page.evaluate(() => {
            const spine = document.getElementById('spine-character');
            return { x: spine.offsetLeft, y: spine.offsetTop };
        });
        
        await page.setViewportSize({ width: 1200, height: 800 });
        await page.waitForTimeout(100); // 追従処理待機
        
        const newPosition = await page.evaluate(() => {
            const spine = document.getElementById('spine-character');
            return { x: spine.offsetLeft, y: spine.offsetTop };
        });
        
        // 位置が追従して変化していることを確認
        expect(newPosition).not.toEqual(originalPosition);
    });
});
```

---

## 📈 成功指標

### ユーザビリティ指標
- **操作変更なし**: 既存操作フローの100%保持
- **自動適用率**: 95%以上のケースで自動ピン適用成功
- **エラー発生率**: < 2% (グレースフルデグラデーション含む)
- **処理追加時間**: < 50ms (保存処理への影響最小化)

### 技術指標
- **背景検出精度**: 90%以上の適切な要素検出
- **アンカー最適性**: 80%以上のケースで最適なアンカー選択
- **追従精度**: ±2px以内の位置追従精度
- **メモリ効率**: 基準値の110%以内に収める

### ElementObserver Phase 1活用指標
- **環境揺れ吸収率**: 95%以上
- **平均処理時間**: 30ms以下
- **親要素サイズ0問題解決率**: 100%

---

## 🚀 将来拡張

### Phase 2 拡張機能
- **手動ピン選択モード**: 「詳細設定」ボタンで手動アンカー選択
- **複数背景対応**: 複数の背景候補から最適選択
- **プレビューモード**: 保存前の追従動作プレビュー
- **ピン管理UI**: アクティブピンの一覧・編集・無効化

### Phase 3 高度機能  
- **学習システム**: ユーザーの配置パターン学習・予測
- **コンテキスト認識**: ページ種別に応じたアンカー最適化
- **パフォーマンス分析**: 追従負荷の監視・自動最適化
- **チーム共有**: ピン設定のエクスポート・インポート機能

---

## 📋 実装チェックリスト

### Phase 1: 基本実装
- [ ] PureBoundingBoxAutoPin.js モジュール作成
- [ ] PureBoundingBoxUI.js の保存処理拡張
- [ ] 背景要素検出アルゴリズム実装
- [ ] アンカーポイント計算ロジック実装
- [ ] ElementObserver Phase 1 との統合

### Phase 2: エラーハンドリング
- [ ] グレースフルデグラデーション実装
- [ ] エラー分類・対処ロジック実装
- [ ] フォールバック機能実装
- [ ] 詳細ログ・デバッグ機能追加

### Phase 3: テスト・最適化
- [ ] 単体テスト実装
- [ ] 統合テスト実装
- [ ] E2Eテスト実装
- [ ] パフォーマンス最適化
- [ ] ドキュメント・コメント完備

### Phase 4: ユーザーエクスペリエンス
- [ ] 視覚的フィードバック実装
- [ ] エラーメッセージ・通知システム
- [ ] レスポンシブ対応確認
- [ ] アクセシビリティ対応

---

**🎯 PureBoundingBox 自動ピン適用システムにより、ユーザーは従来通りの「配置→保存」操作だけで、透明かつ自動的に高性能な追従機能を利用できる革新的なシステムを実現します。**