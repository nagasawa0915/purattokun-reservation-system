# 🎯 PureBoundingBoxシステム 論理座標系統合設計書

## 📋 現状問題の根本原因

### 🚨 従来システムの不安定要因
1. **可変サイズ依存**: ウィンドウサイズに依存した座標計算
2. **複雑な座標変換**: DOM→CSS→WebGL→Spine→Canvas の5座標系混在
3. **リサイズ時の比率変動**: パーセンテージベース要素の実ピクセルサイズ変化
4. **非統一スケール**: 背景とキャラクターで異なるスケール処理

### ⚡ 椅子テスト成功パターンから抽出した確実性要因
```
🎯 論理座標系統一: 120px基準の固定サイズシステム
📐 強制縦横比: aspect-ratio: 1/1 による歪み根本防止
🎨 統一スケール: CSS・Canvas・Spine で同一基準適用
🪑 接地基準: 足元座標での配置（地面レベル統一）
```

## 🚀 新設計: 論理座標系統合システム

### 🎯 Phase 1: 論理座標基盤確立

#### 1.1 論理座標系の導入
```javascript
// PureBoundingBoxCore.js 追加設定
class PureBoundingBoxCore {
    constructor(config) {
        // 🎯 論理座標系設定（椅子テスト成功パターン基準）
        this.logicalCoordinate = {
            baseSize: config.baseSize || 120,  // 椅子テスト基準サイズ
            aspectRatio: '1 / 1',              // 強制正方形
            unit: 'logical-px',                // 論理ピクセル単位
            coordinateOrigin: 'ground-center'  // 足元中心基準
        };
        
        // 🔒 椅子テスト統合設定（変更禁止）
        this.chairTestSettings = {
            fixedSize: '120px',
            forceAspectRatio: true,
            groundBasedPositioning: true,
            unifiedScaling: true
        };
    }
}
```

#### 1.2 足元基準配置システム
```javascript
// 足元基準座標変換関数
convertToGroundBasedPosition(x, y, elementHeight) {
    return {
        // 足元を基準とした座標計算
        groundX: x,
        groundY: y + (elementHeight * 0.85), // 足元位置補正
        displayX: x,
        displayY: y - (elementHeight * 0.15) // 表示位置（頭上余白確保）
    };
}

// 接地レベル統一関数
ensureGroundAlignment(element, targetGroundY = 62) {
    const logicalHeight = this.logicalCoordinate.baseSize;
    const groundBasedTop = targetGroundY - (logicalHeight * 0.85);
    
    element.style.top = groundBasedTop + '%';
    element.style.left = '50%'; // 中央基準
    
    return {
        groundLevel: targetGroundY,
        displayTop: groundBasedTop,
        logicalAlignment: true
    };
}
```

### 🎨 Phase 2: スケール統一化システム

#### 2.1 背景・キャラクター統一スケール
```javascript
// 統一スケールマネージャー
class UnifiedScaleManager {
    constructor(baseSize = 120) {
        this.baseSize = baseSize;
        this.currentScale = 1.0;
        this.dpr = window.devicePixelRatio || 1;
    }
    
    // 椅子テスト方式: 統一スケール適用
    applyUnifiedScale(elements) {
        elements.forEach(element => {
            // CSS統一設定（椅子テスト成功パターン）
            element.style.width = this.baseSize + 'px';
            element.style.height = this.baseSize + 'px';
            element.style.aspectRatio = '1 / 1';
            element.style.objectFit = 'contain';
            
            // Canvas内部解像度統一
            if (element.tagName === 'CANVAS') {
                const internalRes = Math.round(this.baseSize * this.dpr);
                element.width = internalRes;
                element.height = internalRes;
            }
        });
        
        console.log('🎨 統一スケール適用完了', {
            baseSize: this.baseSize,
            aspectRatio: '1:1 固定',
            internalRes: Math.round(this.baseSize * this.dpr),
            椅子テスト準拠: '✅ 成功パターン適用'
        });
    }
}
```

#### 2.2 レスポンシブ対応統一化
```javascript
// レスポンシブ時も論理座標維持
maintainLogicalCoordinates() {
    // ウィンドウサイズが変わっても論理座標は固定
    const elements = this.getManagedElements();
    
    elements.forEach(element => {
        // 🔒 論理座標固定（椅子テストと同じ）
        element.style.width = this.logicalCoordinate.baseSize + 'px';
        element.style.height = this.logicalCoordinate.baseSize + 'px';
        
        // パーセンテージ位置のみ維持（サイズは固定）
        // この方式により確実な位置保持を実現
    });
    
    return {
        coordinateStability: 'fixed-logical-size',
        responsiveMethod: 'position-percentage-only',
        椅子テスト適用: '✅ 固定サイズによる安定性確保'
    };
}
```

### 🎯 Phase 3: StableSpineRenderer統合

#### 3.1 StableSpineRenderer論理座標対応
```javascript
// StableSpineRenderer.js 拡張
class StableSpineRenderer {
    constructor(config = {}) {
        // 🎯 論理座標系統合設定
        this.logicalCoordinate = {
            enabled: config.logicalCoordinate?.enabled ?? true,
            baseSize: config.logicalCoordinate?.baseSize ?? 120,
            groundBasedPositioning: true,
            chairTestCompatible: true
        };
        
        // 椅子テスト成功パターン適用
        if (this.logicalCoordinate.enabled) {
            this.applyChairTestPattern();
        }
    }
    
    applyChairTestPattern() {
        // Canvas設定を椅子テストと完全に同じに
        const canvas = this.getCanvas();
        canvas.style.width = this.logicalCoordinate.baseSize + 'px';
        canvas.style.height = this.logicalCoordinate.baseSize + 'px';
        canvas.style.aspectRatio = '1 / 1';
        canvas.style.objectFit = 'contain';
        
        // 内部解像度も椅子テストと同じ計算式
        const dpr = window.devicePixelRatio || 1;
        const internalRes = Math.round(this.logicalCoordinate.baseSize * dpr);
        canvas.width = internalRes;
        canvas.height = internalRes;
        
        console.log('🪑 椅子テスト成功パターン適用完了', {
            displaySize: `${this.logicalCoordinate.baseSize}px × ${this.logicalCoordinate.baseSize}px`,
            internalRes: `${canvas.width} × ${canvas.height}`,
            aspectRatio: '1:1 強制固定',
            椅子テスト互換: '✅ 完全準拠'
        });
    }
}
```

### 🔧 Phase 4: 既存システム統合方法

#### 4.1 段階的移行戦略
```javascript
// 既存PureBoundingBoxCore.js への統合
enterEditingMode() {
    // 🔄 従来機能保持
    if (this.swapState.currentMode === 'editing') return;
    
    // 🆕 論理座標系適用判定
    if (this.config.enableLogicalCoordinate) {
        this.applyLogicalCoordinateSystem();
    } else {
        // 従来システムそのまま実行（後方互換性）
        this.legacyEnterEditingMode();
    }
}

applyLogicalCoordinateSystem() {
    const element = this.config.targetElement;
    
    console.log('🎯 論理座標系適用開始 - 椅子テスト成功パターン');
    
    // 椅子テスト統合: 固定サイズ + aspect-ratio
    element.style.width = '120px';
    element.style.height = '120px';
    element.style.aspectRatio = '1 / 1';
    element.style.objectFit = 'contain';
    
    // 足元基準配置
    if (this.config.groundBasedPositioning) {
        this.alignToGroundLevel(element);
    }
    
    console.log('✅ 論理座標系適用完了', {
        椅子テスト準拠: '✅ 固定サイズ・縦横比固定',
        座標安定性: '✅ リサイズ時も位置関係維持',
        歪み防止: '✅ aspect-ratio強制適用'
    });
}

alignToGroundLevel(element) {
    // 足元基準の配置（椅子テストと同じ62%基準）
    const groundLevel = 62; // 椅子テストの成功値
    const elementHeight = 120; // 論理座標系固定サイズ
    const displayTop = groundLevel - (elementHeight * 0.85 / window.innerHeight * 100);
    
    element.style.top = displayTop + '%';
    element.style.left = '50%';
    element.style.transform = 'translate(-50%, -50%)';
    
    console.log('🪑 足元基準配置完了', {
        groundLevel: groundLevel + '%',
        displayTop: displayTop.toFixed(1) + '%',
        椅子テスト準拠: '✅ 同じ接地レベル'
    });
}
```

#### 4.2 設定フラグによる段階導入
```javascript
// test-bounding-box-autopin.html での使用例
const boundingBox = new PureBoundingBox({
    targetElement: document.getElementById('purattokun-canvas'),
    
    // 🆕 論理座標系有効化（段階導入）
    enableLogicalCoordinate: true,        // true = 新システム, false = 従来
    logicalBaseSize: 120,                 // 椅子テスト基準
    groundBasedPositioning: true,         // 足元基準配置
    chairTestCompatible: true,            // 椅子テスト完全準拠
    
    // 従来設定も保持（後方互換）
    minWidth: 20,
    minHeight: 20,
    tolerancePx: 5
});
```

## 📋 実装優先度とロードマップ

### 🚀 Phase 1（即座実装）: 基盤確立
- [ ] PureBoundingBoxCore.js に論理座標系設定追加
- [ ] 椅子テスト成功パターンの設定値統合
- [ ] 設定フラグによる段階導入機能

### 🎯 Phase 2（重要）: 座標統一化
- [ ] UnifiedScaleManager 実装
- [ ] 足元基準配置システム実装
- [ ] レスポンシブ対応統一化

### 🎨 Phase 3（統合）: StableSpineRenderer連携
- [ ] StableSpineRenderer論理座標対応
- [ ] Canvas内部解像度統一化
- [ ] 椅子テスト完全準拠モード

### 🔧 Phase 4（完成）: 既存統合・テスト
- [ ] test-bounding-box-autopin.html 統合テスト
- [ ] 従来システムとの互換性確認
- [ ] 実用性能測定・最適化

## 🎯 期待される効果

### ✅ 確実性向上
- **位置ズレ根絶**: 論理座標系により絶対的な位置関係保持
- **歪み完全防止**: aspect-ratio強制による縦横比固定
- **リサイズ安定性**: 固定サイズによる計算誤差解消

### 🚀 実装簡素化
- **座標計算単純化**: 5座標系→1論理座標系に統合
- **デバッグ容易化**: 椅子テスト同等の分かりやすい設定
- **保守性向上**: 成功パターン固定化による予測可能性

### 🎨 汎用性確保
- **設定フラグ制御**: 段階導入・従来システム共存
- **椅子テスト準拠**: 実証済み成功パターンの活用
- **拡張性**: 他のキャラクターシステムへの適用可能性

---

**🎯 結論**: 椅子テストの「120px固定 + aspect-ratio: 1/1 + 足元基準」成功パターンをPureBoundingBoxシステムに統合することで、**確実にズレない**配置システムを実現できます。