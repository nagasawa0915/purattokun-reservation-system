# CanvasResizeController設定保存問題

## 📋 問題概要

**症状**: test-bounding-box-autopin.htmlでCanvasResizeControllerの設定値（Canvas解像度・スケール）が保存されない、または復元されない問題

**発生箇所**: test-bounding-box-autopin.html + SpineSettingsPersistence統合システム

**タグ**: `#CanvasResizeController` `#SpineSettingsPersistence` `#設定保存` `#部分保存` `#localStorage` `#完全解決`

**別名**: Canvas設定保存失敗、SpineSettingsPersistence部分保存問題、canvasSize保存されない、スケール設定復元されない

## 🔍 根本原因

**SpineSettingsPersistence.jsの`validateSettings`関数**が部分保存（例：`canvasSize`のみの更新）に対応していなかった。

### 具体的な問題

1. **厳格すぎる必須フィールド検証**
   ```javascript
   // 問題のあった実装（修正前）
   const requiredFields = ['scaleX', 'scaleY']; // ← canvasSize単独保存時に失敗
   for (const field of requiredFields) {
       if (!(field in settings)) {
           this.log(`❌ 必須フィールドが不足: ${field}`, 'error');
           return false; // ← ここで部分保存が失敗
       }
   }
   ```

2. **部分保存時の統合処理不備**
   - CanvasResizeController → `{ canvasSize: 512 }` のみ送信
   - 既存の`scaleX`/`scaleY`との統合処理が不完全

## ⚡ 有効な解決策・回避策

<!-- 🔒 確定済み解決策 - 変更禁止 -->

### ✅ **解決策1: validateSettings関数の部分保存対応**（完全解決）

**実行日**: 2025-09-05  
**ファイル**: `micromodules/spine-settings-persistence/SpineSettingsPersistence.js`

```javascript
// 修正後の実装
validateSettings(settings) {
    if (!settings || typeof settings !== 'object') {
        this.log('❌ 設定データが無効: オブジェクトではありません', 'error');
        return false;
    }
    
    // 存在するフィールドのみ検証（部分保存対応）
    const scaleRange = { min: 0.1, max: 5.0 };
    
    // scaleX検証（存在する場合のみ）
    if ("scaleX" in settings) {
        if (typeof settings.scaleX !== "number") {
            this.log(`❌ scaleX型が無効: ${typeof settings.scaleX}`, "error");
            return false;
        }
        if (settings.scaleX < scaleRange.min || settings.scaleX > scaleRange.max) {
            this.log(`❌ scaleX範囲外: ${settings.scaleX} (${scaleRange.min}-${scaleRange.max})`, "error");
            return false;
        }
    }
    
    // scaleY検証（存在する場合のみ）
    if ("scaleY" in settings) {
        // 同様の検証
    }
    
    // canvasSize検証（存在する場合のみ）
    if ("canvasSize" in settings && settings.canvasSize !== null && settings.canvasSize !== undefined) {
        if (typeof settings.canvasSize !== "number") {
            this.log(`❌ canvasSize型が無効: ${typeof settings.canvasSize}`, "error");
            return false;
        }
        if (settings.canvasSize <= 0 || settings.canvasSize > 4096) {
            this.log(`❌ canvasSize範囲外: ${settings.canvasSize} (1-4096)`, "error");
            return false;
        }
    }
    
    this.log("✅ 設定データ検証完了（部分保存対応）");
    return true;
}
```

### ✅ **解決策2: save関数の統合保存対応**（完全解決）

```javascript
// 修正後のsave関数実装
save(characterId, settings) {
    // ... 基本検証 ...
    
    try {
        const key = this.generateKey(characterId);
        
        // 既存データを取得して統合保存（部分保存対応）
        let existingData = null;
        try {
            const existingJson = localStorage.getItem(key);
            if (existingJson) {
                existingData = JSON.parse(existingJson);
            }
        } catch (error) {
            this.log(`⚠️ 既存データ取得エラー（新規作成）: ${error.message}`, "warn");
        }
        
        // 統合保存データ構造
        const mergedSettings = {
            scaleX: settings.scaleX !== undefined ? settings.scaleX : (existingData?.settings?.scaleX || 1.0),
            scaleY: settings.scaleY !== undefined ? settings.scaleY : (existingData?.settings?.scaleY || 1.0),
            positionX: settings.positionX !== undefined ? settings.positionX : (existingData?.settings?.positionX || 0),
            positionY: settings.positionY !== undefined ? settings.positionY : (existingData?.settings?.positionY || 0),
            canvasSize: settings.canvasSize !== undefined ? settings.canvasSize : (existingData?.settings?.canvasSize || null)
        };
        
        const saveData = {
            version: this.options.version,
            timestamp: new Date().toISOString(),
            characterId: characterId,
            settings: mergedSettings
        };
        
        // localStorage保存
        const jsonData = JSON.stringify(saveData);
        localStorage.setItem(key, jsonData);
        
        return true;
    } catch (error) {
        this.log(`❌ 保存エラー: ${error.message}`, 'error');
        return false;
    }
}
```

## 🧪 テスト・検証方法

### **1. 修正効果確認テスト**
```bash
# 専用テストページでの確認
http://localhost:8000/test-spine-settings-persistence-fix.html
```

### **2. 実際のCanvasResizeController統合テスト**
```bash
# 実際の統合環境でのテスト
http://localhost:8000/test-bounding-box-autopin.html

# F12コンソールで実行
debugLocalStorageForCanvasResize()
testCanvasResizeSaveRestore()
```

### **3. 診断機能**
test-bounding-box-autopin.htmlに追加された診断機能：
- `debugLocalStorageForCanvasResize()` - ローカルストレージ状況確認
- `testCanvasResizeSaveRestore()` - 保存・復元テスト

## 📊 修正効果

### **修正前の問題**
- CanvasResizeControllerで解像度変更 → 保存失敗（validateSettings検証で落ちる）
- スケール変更 → 部分的に保存失敗
- 復元時にデフォルト値に戻る

### **修正後の効果**
- ✅ **部分保存完全対応**: `canvasSize`単独更新、`scaleX`/`scaleY`単独更新が可能
- ✅ **統合保存**: 既存データと新しい変更の自動統合
- ✅ **完全復元**: 全ての設定値が確実に復元
- ✅ **後方互換性**: 既存の完全保存も継続動作

## 🔄 関連問題・予防策

### **予防策1: 部分保存テストの追加**
新しい設定項目を追加する際は、部分保存テストを必ず実行：
```javascript
// 新しい設定項目のテスト例
testPersistence.save('test-id', { newField: 'value' }); // 他の設定を破壊しないか確認
```

### **予防策2: 検証ロジックの拡張**
新しい設定フィールド追加時は、validateSettings関数にも対応する検証ロジックを追加。

### **予防策3: 統合テストの継続実行**
CanvasResizeController変更時は、必ずtest-bounding-box-autopin.htmlでの統合テストを実行。

## 📝 試行錯誤の履歴

### **Case 1: 根本原因特定（成功）**
**日時**: 2025-09-05  
**実行者**: Claude  
**症状確認**: CanvasResizeController設定が保存されない  
**調査方法**: 
1. SpineSettingsPersistence.jsのvalidateSettings関数確認
2. 必須フィールド検証の問題特定
3. 部分保存時の動作フロー分析

**結果**: ✅ **成功**  
**解決内容**: 
- validateSettings関数の部分保存対応
- save関数の統合保存対応
- 診断機能追加

**重要な発見**: 
- 部分保存時に`scaleX`/`scaleY`が必須扱いされて失敗していた
- test-bounding-box-autopin.htmlの`saveSpineSettingsIntegrated`は全設定を送るが、タイミングによっては不完全データが送られる場合があった

**教訓**: 
- localStorage関連の問題は、実際の保存データ形式を確認することが重要
- 必須フィールド検証は、部分保存の要件と矛盾する場合がある
- 統合保存（既存データ + 新規変更）の実装が部分保存では必須

## 🚀 この問題の解決により実現されること

1. **CanvasResizeController完全統合**: iframe UIでの解像度・スケール変更が確実に保存・復元される
2. **PureBoundingBoxAutoPin + CanvasResizeController連携**: バウンディングボックス設定とCanvas設定の両方が永続化される
3. **制作効率向上**: 設定の再入力不要、作業継続性の確保
4. **システム信頼性向上**: 設定保存の確実性保証

---

**🎯 最終確認**: この修正により、test-bounding-box-autopin.htmlでのCanvasResizeController設定保存問題は**完全解決**されました。
