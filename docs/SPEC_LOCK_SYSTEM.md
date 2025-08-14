# 🔒 仕様逸脱防止システム（Spec Lock System）

**Version**: 1.0.0  
**作成日**: 2025-08-13  
**目的**: 実務で"絶対に外さない仕組み"の構築

---

## 📋 三段階防止システム + 実務強化版

### **基本三段階**
1. **Stage 1**: 事前確認（実装前必須）
2. **Stage 2**: サブエージェント指示（実行時必須）  
3. **Stage 3**: 実装後確認（完了時必須）

### **実務強化追補**（①-⑦）

---

## 🔐 追補① 仕様"ロック"と変更管理

### **仕様ロック（Spec Lock）**
```bash
# Phaseごとに仕様書のコミットハッシュを固定
SPEC_COMMIT=a1b2c3d4  # Phase 1開始時点
SPEC_COMMIT=e5f6g7h8  # Phase 2開始時点
```

### **PRテンプレート必須項目**
```markdown
## 仕様準拠
- SPEC_COMMIT=xxxxxxxx （未記入ならCIでブロック）
- 仕様書: docs/SPINE_OUTLINER_DESIGN_SPECIFICATION.md @ xxxxxxxx
```

### **Change Request（CR）プロセス**
```
仕様書更新の手順:
1. Change Request申請（理由・影響範囲明記）
2. 承認後にSPEC_COMMITを更新
3. ADRファイル作成（重要判断の記録）
```

### **ADR（Architecture Decision Record）**
```markdown
# ADR-0003: Desktop統合必須化

## 目的
Spineアウトライナー機能をデスクトップアプリ内でのみ動作させる

## 選択肢
- A案: 独立HTMLファイル（rejected）
- B案: デスクトップアプリ統合（adopted）

## 決定
B案を採用。理由: 既存基盤活用・Phase計画準拠

## 影響
- 全実装はspine-editor-desktop-v2内に配置
- 独立HTMLテストは禁止

## 代替案
独立テスト環境が必要な場合はデスクトップアプリ内で実現
```

---

## 🛡️ 追補② 実装場所の"ガードレール"をコードで強制

### **起動時アサーション**
```javascript
// app.js - アプリ起動時チェック
function validateEnvironment() {
    // Electron環境必須
    assert(process.versions.electron, 'Electron環境が必要です');
    
    // 専用環境変数必須
    assert(window.SPINERUN_ENV === 'desktop', 'Desktop統合環境が必要です');
    
    console.log('✅ 環境検証OK - Desktop統合モード');
}
```

### **ランタイム自己診断**
```javascript
// runtime-diagnostics.js
class RuntimeDiagnostics {
    static displayStartupBanner() {
        const banner = `
🎭 Spine Editor Desktop v2.0
Desktop統合: ✅ OK
Spec: ${SPEC_COMMIT}
Spine: 4.1.24
Environment: ${window.SPINERUN_ENV}
        `;
        console.log(banner);
        
        // 必須要素チェック
        this.checkRequirements();
    }
    
    static checkRequirements() {
        const checks = [
            { name: '.spine-stage検出', test: () => document.querySelector('.spine-stage') },
            { name: 'Spine CDN読込', test: () => typeof spine !== 'undefined' },
            { name: 'Electron権限', test: () => window.electronAPI }
        ];
        
        const failed = checks.filter(check => !check.test());
        if (failed.length > 0) {
            console.error('🚨 必須要件未達:', failed.map(f => f.name));
            this.showRedAlert(failed);
        }
    }
}
```

---

## 🧪 追補③ 最低限の自動テスト（重くしない）

### **Pre-push スモークテスト（30-60秒）**
```javascript
// tests/smoke-test.js
describe('Desktop統合スモークテスト', () => {
    test('デスクトップアプリ起動 + ダミーSpine描画', async () => {
        // 1. ヘッドレス起動
        const app = await startDesktopApp({ headless: true });
        
        // 2. テンプレページロード
        await app.loadPage('index_.html');
        
        // 3. ダミーSpine自動ドロップ
        const dummyCharacter = createDummySpineData();
        await app.dragDrop('#spine-outliner', '.spine-stage', dummyCharacter);
        
        // 4. 1フレーム描画検知（2秒以内）
        const rendered = await app.waitForRender(2000);
        expect(rendered).toBe(true);
        
        await app.close();
    }, 60000);
});
```

### **契約テスト（Component I/O検証）**
```javascript
// tests/contract-test.js
describe('コンポーネント間契約テスト', () => {
    test('SpineFileDetector → CanvasManager I/O', () => {
        const mockCharacter = { id: 'test', name: 'Test' };
        const detector = new SpineFileDetector();
        const manager = new SpineCanvasManager();
        
        // 出力形式の契約確認
        expect(detector.output).toMatchSchema(CharacterSchema);
        expect(manager.accepts).toMatchSchema(CharacterSchema);
    });
});
```

---

## 📝 追補④ PRテンプレの"強制"項目

```markdown
## 目的
- 関連仕様: docs/SPINE_OUTLINER_DESIGN_SPECIFICATION.md @ SPEC_COMMIT=xxxxxxxx
- 対象Phase: Phase 1 / Day 2

## 実装場所
- [ ] desktop内（Electron）でのみ動作
- [ ] 独立HTMLは禁止

## 必須確認
- [ ] .spine-stage 検出OK
- [ ] Spine 4.1.24 の初期化OK
- [ ] ランタイム自己診断(緑)を確認

## 動作証拠
- [ ] 起動ログ添付（環境表示/Specハッシュ）
- [ ] 1体表示のスクリーンショット or GIF

## リスクと回避
- 例）Web実行の誤用 → ランタイムアサートで遮断
```

---

## ✅ 追補⑤ 定義済"合格ライン"のチェックリスト

### **環境チェック**
- ✅ Electron起動でランタイムバナーが「緑」
- ✅ SPEC_COMMIT表示・環境変数確認

### **表示チェック**  
- ✅ テンプレに1体をドラッグ→2秒以内に描画
- ✅ アニメーション再生確認

### **エラーハンドリング**
- ✅ 条件未達時は"赤メッセージ＋対処法リンク"表示
- ✅ フォールバック機能動作確認

### **座標精度**
- ✅ リサイズ後の誤差±1-2px
- ✅ 編集px/出力%変換の精度確認

---

## 📊 追補⑥ 作業の見える化

### **デイリースナップショット**
```
日報例：
「Spec@abcd123 / Desktop:OK / 1体描画:OK / 誤差+1px / 次：%変換」
```

### **看板（Kanban）管理**
```
TODO → 進行中 → 仕様外提案 → 承認待ち → 完了
              ↑
         必ずここを通る
```

---

## 🚦 追補⑦ フェーズ別"DO/DON'T"

### **Phase 1（基盤）**
**DO:**
- Desktop統合前提の実装
- Spine 4.1.24固定
- 1ページ1レンダラー

**DON'T:**
- 独立HTMLでの検証
- バージョン横断対応
- 汎用化の先取り実装

### **Phase 2（座標分離）**
**DO:**
- 編集px/出力%の往復変換テスト
- 座標精度の厳密確認

**DON'T:**
- DOM自動探索の汎用化を同時実装
- 複数機能の同時開発

### **Phase 3（統合テスト）**
**DO:**
- E2E（起動→1体描画→保存）を動画保存
- 全機能の統合確認
- パフォーマンス測定

**DON'T:**
- 新機能の追加
- アーキテクチャの大幅変更

---

## 🔄 運用開始

### **即座実装可能項目**
1. **ランタイム自己診断** - app.js起動時チェック
2. **PRテンプレート** - GitHub PR template設定
3. **SPEC_COMMIT管理** - 現在のコミットハッシュ固定

### **段階実装項目**
1. **スモークテスト** - テスト環境構築後
2. **契約テスト** - コンポーネント完成後
3. **ADRシステム** - 重要判断発生時

---

**この仕様逸脱防止システムにより、今後は確実に仕様書準拠の実装が保証されます。**

---

**最終更新**: 2025-08-13  
**SPEC_COMMIT**: 未設定（次回Phase開始時に設定）  
**承認**: 実務強化版として採用