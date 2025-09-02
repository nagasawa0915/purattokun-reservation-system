# Canvas品質設定システム完全ガイド

**最終更新**: 2025-09-02  
**発見者**: ユーザー実験による重要な知見  
**対象**: デスクトップアプリ統合・商用制作ツール  

---

## 🎯 重要な発見

### Canvas内部解像度 ≠ 見える範囲

```html
<!-- 表示サイズ（見える範囲）: CSS制御 -->
<canvas style="width: 400px; height: 300px;" 
        width="800" height="600"></canvas>
        ↑内部解像度（描画品質）
```

#### 📐 2つの独立したサイズ
1. **Canvas width/height属性** = **内部描画解像度**（品質に影響）
2. **CSS width/height** = **実際の見える範囲**（表示サイズ）

#### 🎨 品質への影響
- **小さい値** → **低解像度** → ガビガビ（荒い）
- **大きい値** → **高解像度** → きれい・滑らか

---

## ⚙️ デスクトップアプリ統合仕様

### 🎮 4段階品質設定システム

```javascript
const qualitySettings = {
    low: { 
        width: 400, 
        height: 300,
        description: '軽い・荒い（プレビュー用）',
        performance: '⚡ 最高速',
        quality: '⭐ 低品質'
    },
    medium: { 
        width: 800, 
        height: 600,
        description: 'バランス（標準）',
        performance: '🔥 高速',
        quality: '⭐⭐ 中品質'
    },
    high: { 
        width: 1200, 
        height: 900,
        description: '重い・きれい（高品質出力）',
        performance: '⏳ 普通',
        quality: '⭐⭐⭐ 高品質'
    },
    ultra: { 
        width: 1600, 
        height: 1200,
        description: '最重・最高品質（商用出力）',
        performance: '🐌 低速',
        quality: '⭐⭐⭐⭐ 最高品質'
    }
};
```

### 🎯 用途別推奨設定

#### 💼 制作ワークフロー
```javascript
const workflowSettings = {
    // プレビュー・編集時
    preview: 'low',      // 400x300 - サクサク編集
    
    // 調整・確認時
    adjustment: 'medium', // 800x600 - バランス
    
    // 最終確認時
    finalCheck: 'high',   // 1200x900 - 高品質
    
    // 商用出力時
    commercial: 'ultra'   // 1600x1200 - 最高品質
};
```

#### 📱 デバイス別自動選択
```javascript
const deviceOptimization = {
    // モバイル・タブレット
    mobile: {
        default: 'low',     // バッテリー・性能考慮
        max: 'medium'       // 上限設定
    },
    
    // デスクトップPC
    desktop: {
        default: 'medium',  // 標準品質
        max: 'ultra'        // 制限なし
    },
    
    // 高性能ワークステーション
    workstation: {
        default: 'high',    // 高品質標準
        max: 'ultra'        // 最高品質対応
    }
};
```

---

## 🔧 実装仕様（デスクトップアプリ）

### 🎮 UI設計

#### 品質選択ドロップダウン
```html
<select id="quality-selector">
    <option value="low">⚡ 低品質 (400x300) - 最高速</option>
    <option value="medium" selected>🔥 中品質 (800x600) - バランス</option>
    <option value="high">⏳ 高品質 (1200x900) - きれい</option>
    <option value="ultra">🐌 最高品質 (1600x1200) - 商用</option>
</select>
```

#### 動的品質切り替え
```javascript
function changeQuality(qualityLevel) {
    const setting = qualitySettings[qualityLevel];
    
    // Canvas内部解像度変更
    canvas.width = setting.width;
    canvas.height = setting.height;
    
    // WebGL viewport更新
    gl.viewport(0, 0, setting.width, setting.height);
    
    // UI表示更新
    updateQualityDisplay(setting);
    
    // StableSpineRenderer再初期化（必要に応じて）
    if (spineRenderer) {
        spineRenderer.resize(setting.width, setting.height);
    }
}
```

### ⚙️ 自動最適化機能

#### パフォーマンス監視
```javascript
const performanceMonitor = {
    // FPS監視
    checkFrameRate() {
        if (this.fps < 30) {
            // 自動的に品質を下げる
            suggestQualityDowngrade();
        }
    },
    
    // メモリ監視
    checkMemoryUsage() {
        if (this.memoryUsage > 80) {
            // メモリ不足警告
            showMemoryWarning();
        }
    }
};
```

#### 自動推奨機能
```javascript
function getRecommendedQuality() {
    const systemSpec = getSystemSpecs();
    
    if (systemSpec.gpu === 'integrated') {
        return 'low';
    } else if (systemSpec.ram < 8) {
        return 'medium';
    } else {
        return 'high';
    }
}
```

---

## 🎯 商用制作ツール統合

### 💼 制作フロー最適化

#### Phase別品質設定
```javascript
const productionPhases = {
    // Phase 1: 配置・構成作業
    layout: {
        quality: 'low',
        reason: '高速プレビューでサクサク配置調整'
    },
    
    // Phase 2: 詳細調整
    refinement: {
        quality: 'medium',
        reason: 'バランス良く詳細確認'
    },
    
    // Phase 3: 最終確認
    finalCheck: {
        quality: 'high',
        reason: '高品質で最終仕上がり確認'
    },
    
    // Phase 4: 商用出力
    export: {
        quality: 'ultra',
        reason: '最高品質でお客様納品データ作成'
    }
};
```

#### 出力時自動切り替え
```javascript
function exportCommercialPackage() {
    // 一時的に最高品質に切り替え
    const originalQuality = currentQuality;
    changeQuality('ultra');
    
    try {
        // 高品質で出力実行
        const package = generatePackage();
        return package;
    } finally {
        // 元の品質設定に戻す
        changeQuality(originalQuality);
    }
}
```

---

## 📊 実装優先度

### 🚀 Phase 1: 基本機能（高優先度）
- [ ] 4段階品質選択ドロップダウン
- [ ] 動的品質切り替え機能
- [ ] 品質説明・推奨表示

### ⚡ Phase 2: 自動最適化（中優先度）
- [ ] デバイス別自動推奨
- [ ] パフォーマンス監視
- [ ] 自動品質調整提案

### 💼 Phase 3: 商用統合（中優先度）
- [ ] 制作フロー別自動切り替え
- [ ] 出力時最高品質自動選択
- [ ] 品質設定の保存・復元

### 🔧 Phase 4: 高度機能（低優先度）
- [ ] カスタム品質設定
- [ ] 品質プロファイル管理
- [ ] リアルタイムパフォーマンス表示

---

## 🎯 期待される効果

### 💼 制作効率化
- **編集時**: 低品質で高速プレビュー → 作業速度向上
- **確認時**: 高品質で正確な仕上がり確認
- **出力時**: 最高品質で商用レベル品質保証

### ⚙️ システム最適化
- **自動切り替え**: Phase別最適品質で無駄なリソース消費削減
- **デバイス対応**: スペックに応じた最適設定で快適動作
- **メモリ効率**: 品質調整でメモリ使用量コントロール

### 🎨 品質保証
- **商用出力**: 最高品質での納品データ作成
- **プレビュー**: 用途に応じた適切な品質選択
- **パフォーマンス**: 品質とスピードのバランス最適化

---

## 📝 技術メモ

### 🔍 重要な発見
1. **Canvas属性 ≠ 表示サイズ**: 内部解像度と表示サイズは独立
2. **品質 ∝ 内部解像度**: 大きいほど高品質、重い処理
3. **WebGL viewport**: Canvas属性変更時は必ずgl.viewport()更新
4. **実用的価値**: 制作効率と品質のトレードオフを自由にコントロール

### 🚨 注意事項
- 高品質設定は大幅にメモリを消費する
- WebGL context再初期化が必要な場合がある
- devicePixelRatioとの関係も考慮が必要
- モバイルデバイスでの ultra設定は避けるべき

---

**🎉 この品質設定システムにより、デスクトップアプリは制作効率と品質の両立を実現します**