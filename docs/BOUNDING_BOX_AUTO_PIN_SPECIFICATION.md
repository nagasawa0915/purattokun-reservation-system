# PureBoundingBox 2段階ピン設定システム仕様書

**バージョン**: 2.0  
**対象**: PureBoundingBox + F12風要素選択 + ElementObserver Phase 1統合  
**作成日**: 2025-09-04  
**更新**: 2段階ピン設定システムへの全面改訂

---

## 🎯 概要

PureBoundingBox 2段階ピン設定システムは、**「要素選択 + 位置微調整」**の2段階アプローチにより、ユーザーが任意のページ要素に対してキャラクターを精密にピン留めできる高度なシステムです。

### 🚀 設計思想
- **精密性**: ユーザーが意図した要素に確実にピン設定
- **直感性**: F12開発者ツール風の馴染みあるUI
- **柔軟性**: テキスト・画像・ボタンなど任意要素が対象
- **相対性**: 選択要素の拡大縮小・移動に完全追従

---

## 🎮 新しい2段階ユーザー操作フロー

### Stage 1: ピン対象要素選択
1. キャラクターをクリック → バウンディングボックス表示
2. **「📍 ピン設定」ボタンをクリック**
3. **F12風要素選択モード起動**
4. マウスホバー → リアルタイム要素ハイライト表示
   ```
   ヒーローイメージ → 青枠ハイライト
   「ようこそ」テキスト → 青枠ハイライト
   ボタン要素 → 青枠ハイライト
   アイコン要素 → 青枠ハイライト
   ```
5. **対象要素をクリック** → 要素確定
6. 確認ダイアログ: 「この要素にピン設定しますか？」

### Stage 2: キャラクター位置微調整
7. 選択要素が **基準として視覚的に表示** (薄い枠線)
8. キャラクターのバウンディングボックスで **相対位置調整**
   - ドラッグ移動 (選択要素基準の相対座標)
   - スケール調整
   - 9点アンカー選択 (TL,TC,TR,ML,MC,MR,BL,BC,BR)
9. **リアルタイムプレビュー**: 選択要素との位置関係表示
10. **「保存」ボタンクリック** → ピン設定完成
11. **以後、自動追従が有効**: 選択要素の移動・拡大縮小にキャラクターが追従

---

## 🔧 技術仕様

### システム構成
```
PureBoundingBox (既存)
├── PureBoundingBoxCore.js
├── PureBoundingBoxBounds.js  
├── PureBoundingBoxUI.js      ← 📍ピン設定ボタン・Stage 2 UI追加
├── PureBoundingBoxEvents.js
└── PureBoundingBoxAutoPin.js ← 大幅拡張

新規モジュール (F12風要素選択)
├── ElementHighlighter.js    ← Stage 1: リアルタイム要素ハイライト
├── ElementSelector.js       ← Stage 1: 要素選択・確定処理
└── RelativeCoordinator.js   ← Stage 2: 相対座標計算・追従処理

ElementObserver Phase 1 (連携)
├── ElementObserver.js
├── ElementObserverCore.js
└── 環境揺れ吸収・親要素監視システム
```

### Stage 1モジュール: ElementHighlighter.js
```javascript
/**
 * ElementHighlighter.js
 * 
 * 🎯 F12風リアルタイム要素ハイライトシステム
 * - 責務: マウスホバーでの要素検出・ハイライト表示
 */
class ElementHighlighter {
    constructor() {
        this.isActive = false;
        this.highlightOverlay = null;
        this.currentTarget = null;
        this.excludeSelectors = ['.pure-bounding-box', '.bb-handle'];
    }
    
    /**
     * 🎯 F12風ハイライトモード開始
     */
    startHighlightMode(callback) {
        this.isActive = true;
        this.onElementSelected = callback;
        
        // オーバーレイ作成
        this.createHighlightOverlay();
        
        // マウス追跡開始
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('click', this.handleElementClick);
        
        // エスケープで終了
        document.addEventListener('keydown', this.handleKeyDown);
        
        console.log('🎯 F12風要素選択モード開始');
    }
    
    /**
     * リアルタイム要素ハイライト更新
     */
    handleMouseMove = (event) => {
        if (!this.isActive) return;
        
        const target = document.elementFromPoint(event.clientX, event.clientY);
        
        if (this.shouldExcludeElement(target)) return;
        if (target === this.currentTarget) return;
        
        this.currentTarget = target;
        this.updateHighlight(target);
    }
    
    /**
     * ハイライト表示更新
     */
    updateHighlight(element) {
        if (!element || !this.highlightOverlay) return;
        
        const rect = element.getBoundingClientRect();
        
        this.highlightOverlay.style.cssText = `
            position: fixed;
            left: ${rect.left}px;
            top: ${rect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            border: 2px solid #007bff;
            background: rgba(0, 123, 255, 0.1);
            pointer-events: none;
            z-index: 10001;
            transition: all 0.1s ease;
        `;
        
        // 要素情報表示
        this.showElementInfo(element, rect);
    }
}
```

### Stage 2モジュール: RelativeCoordinator.js
```javascript
/**
 * RelativeCoordinator.js
 * 
 * 🎯 相対座標計算・追従処理システム
 * - 責務: 選択要素基準の相対位置計算・レスポンシブ追従
 */
class RelativeCoordinator {
    constructor(observer) {
        this.observer = observer;
        this.activePins = new Map(); // nodeId -> pinConfig
    }
    
    /**
     * 🎯 相対ピン設定作成
     */
    async createRelativePin(config) {
        const {
            selectedElement,  // Stage 1で選択された要素
            characterElement, // キャラクター要素
            anchor,          // 9点アンカー (TL,TC,TR,ML,MC,MR,BL,BC,BR)
            relativeOffset   // 選択要素からの相対位置
        } = config;
        
        try {
            console.log('🎯 相対ピン設定開始', {
                selectedElement: this.getElementInfo(selectedElement),
                anchor: anchor,
                offset: relativeOffset
            });
            
            // 相対座標計算
            const relativePosition = this.calculateRelativePosition(
                selectedElement, 
                characterElement, 
                anchor, 
                relativeOffset
            );
            
            // ElementObserver監視開始
            const unobserve = this.observer.observe(selectedElement, (rect, changeType) => {
                console.log('📐 選択要素変化検出:', {
                    changeType,
                    size: `${rect.width}x${rect.height}`,
                    anchor: anchor
                });
                
                // 相対位置を維持したキャラクター位置更新
                this.updateCharacterPosition(characterElement, rect, relativePosition);
            });
            
            // ピン設定保存
            const pinConfig = {
                id: this.generatePinId(),
                selectedElement,
                characterElement,
                anchor,
                relativeOffset,
                unobserve,
                createdAt: Date.now()
            };
            
            this.activePins.set(characterElement.id, pinConfig);
            
            console.log('✅ 相対ピン設定完了:', pinConfig);
            
            return {
                success: true,
                pinConfig: pinConfig,
                activePinCount: this.activePins.size
            };
            
        } catch (error) {
            console.error('❌ 相対ピン設定エラー:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
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

## 🎯 実装例: 2段階ピン設定の実際の動作

### 実用シナリオ例
```
📋 シナリオ: 「ようこそ」テキストの右下にキャラクター配置

Stage 1: 要素選択
1. キャラクター「ぷらっとくん」をクリック → BB表示
2. 「📍 ピン設定」ボタンクリック
3. F12風モード起動 → 青色ハイライト表示開始
4. 「ようこそ」テキストにマウスホバー → ハイライト
5. 「ようこそ」テキストをクリック → 確認ダイアログ
6. 「はい」をクリック → 要素確定

Stage 2: 位置微調整  
7. 「ようこそ」テキストに薄い枠線表示 (基準表示)
8. ぷらっとくんのBBで位置調整
   - テキスト右下に移動
   - アンカー「BR」(Bottom-Right)選択
   - スケール 0.8 に調整
9. 「保存」クリック → ピン設定完成

結果: 追従動作
- ウィンドウリサイズ時
- 「ようこそ」テキストが移動 → ぷらっとくんも追従
- 「ようこそ」テキストが拡大 → ぷらっとくんも比例拡大
```

### UI統合仕様
```javascript
// PureBoundingBoxUI.js 拡張部分
createPinSettingButton() {
    const pinButton = document.createElement('button');
    pinButton.innerHTML = '📍 ピン設定';
    pinButton.className = 'bb-pin-button';
    pinButton.onclick = () => this.startPinSetting();
    
    // 既存ボタン群に追加
    this.buttonContainer.appendChild(pinButton);
}

async startPinSetting() {
    console.log('🎯 2段階ピン設定開始');
    
    // Stage 1: 要素選択
    const selectedElement = await this.selectTargetElement();
    if (!selectedElement) return;
    
    // Stage 2: 位置微調整UI表示
    this.showRelativePositioningUI(selectedElement);
}
```

### パフォーマンス仕様

#### 処理時間目標
- **F12風ハイライト**: < 16ms (60fps維持)
- **要素選択処理**: < 10ms
- **相対座標計算**: < 5ms  
- **ピン設定処理**: < 20ms
- **合計追加時間**: < 50ms (既存BB操作への影響最小化)

#### メモリ使用量
- **ElementHighlighter**: < 50KB
- **RelativeCoordinator**: < 80KB  
- **アクティブピン1個**: < 40KB (相対情報含む)
- **最大同時ピン数**: 10個 (既存キャラクター分)

#### レスポンシブ対応
```javascript
// 選択要素の変化に応じた高速追従
updateCharacterPosition(characterElement, selectedRect, relativeConfig) {
    const anchorPosition = this.calculateAnchorPosition(selectedRect, relativeConfig.anchor);
    const finalPosition = {
        x: anchorPosition.x + relativeConfig.offset.x,
        y: anchorPosition.y + relativeConfig.offset.y,
        scale: selectedRect.scale * relativeConfig.scaleRatio
    };
    
    // CSS Transformで高速更新
    characterElement.style.transform = `translate(${finalPosition.x}px, ${finalPosition.y}px) scale(${finalPosition.scale})`;
}
```

---

## 🚀 実装フェーズ

### Phase 1: F12風要素選択システム (Stage 1)
- [ ] ElementHighlighter.js - リアルタイム要素ハイライト
- [ ] ElementSelector.js - 要素選択・確定処理
- [ ] 📍ピン設定ボタンをPureBoundingBoxUIに統合
- [ ] F12風モードの起動・終了UI

### Phase 2: 相対座標システム (Stage 2)  
- [ ] RelativeCoordinator.js - 相対位置計算・追従処理
- [ ] 選択要素基準の座標系実装
- [ ] 9点アンカーシステム統合
- [ ] リアルタイムプレビュー機能

### Phase 3: ElementObserver統合・完全動作
- [ ] ElementObserver Phase 1との完全統合
- [ ] アクティブピン管理システム
- [ ] ウィンドウリサイズ時の自動追従動作
- [ ] localStorage永続化対応

### Phase 4: UI/UX最適化・完成
- [ ] F12風ハイライトの視覚的改良
- [ ] Stage切り替えの自然な流れ
- [ ] エラーハンドリング・フォールバック
- [ ] パフォーマンス最適化・テスト

---

## ✅ 期待される完成状態

**ユーザー体験**:
```
「ぷらっとくん」クリック → BB表示
↓
「📍ピン設定」クリック → F12風モード起動  
↓
「ようこそ」テキストを選択 → 要素確定
↓ 
テキスト基準でキャラクター位置微調整
↓
「保存」 → ピン完成
↓
レスポンシブ時に完全追従 → 🎯完成！
```

**技術的成果**:
- ✅ アクティブピン数: 1 (または設定数)
- ✅ F12風要素選択の直感的操作
- ✅ 任意要素への精密ピン設定
- ✅ レスポンシブ完全対応・自動追従
- ✅ 既存BBシステムとの完全統合