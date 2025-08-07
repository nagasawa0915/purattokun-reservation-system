# 🛡️ 無限ループ防止チェックリスト

## 📋 開発時の必須確認項目

### ⚡ 緊急確認項目（コンソール開放時）
- [ ] **CPU使用率が15%を超えていないか確認**
- [ ] **同一関数が5秒間に100回以上呼び出されていないか確認**
- [ ] **`setInterval`の間隔が16ms以上であることを確認**
- [ ] **無限ループ防止システムが起動していることを確認**（`window.ilps.status()`）
- [ ] **緊急停止コマンドを覚えている**（`Ctrl+Alt+S` または `window.ilps.emergency()`）

### 🔍 コード実装時チェック項目

#### 1. タイマー関数チェック
```javascript
// ❌ 危険パターン
setInterval(updateCoords, 10); // 10ms間隔は危険
while (condition) { await someAsync(); } // while+await

// ✅ 安全パターン
setInterval(updateCoords, 16); // 最低16ms（60fps）
requestAnimationFrame(updateCoords); // より適切
```

**チェック項目:**
- [ ] `setInterval`の間隔は16ms以上
- [ ] `setTimeout`再帰は適切な終了条件あり
- [ ] タイマーに対応する`clearInterval`/`clearTimeout`あり
- [ ] `while`文内に`await`使用なし

#### 2. イベントリスナーチェック
```javascript
// ❌ 危険パターン
element.addEventListener('mousemove', handler); // 高頻度イベント無制限

// ✅ 安全パターン
let throttled = false;
element.addEventListener('mousemove', (e) => {
    if (throttled) return;
    throttled = true;
    setTimeout(() => throttled = false, 16); // スロットリング
    handler(e);
});
```

**チェック項目:**
- [ ] 高頻度イベント（`mousemove`, `scroll`, `resize`）にスロットリングあり
- [ ] イベントリスナーに対応する`removeEventListener`あり
- [ ] イベントハンドラー内でエラーハンドリングあり
- [ ] DOM要素削除時にリスナー削除

#### 3. 再帰関数チェック
```javascript
// ❌ 危険パターン
function recursive() {
    recursive(); // 終了条件なし
    setTimeout(recursive, 0); // 即座再帰
}

// ✅ 安全パターン
function recursive(depth = 0, maxDepth = 100) {
    if (depth > maxDepth) return; // 終了条件
    setTimeout(() => recursive(depth + 1, maxDepth), 16); // 間隔確保
}
```

**チェック項目:**
- [ ] 明確な終了条件あり
- [ ] 最大再帰深度制限あり
- [ ] スタックオーバーフロー対策あり
- [ ] デバッグ用カウンター実装

### 🏗️ システム統合時チェック項目

#### 1. 無限ループ防止システム統合
```html
<!-- HTMLに追加 -->
<script src="infinite-loop-prevention-system.js"></script>
<script>
    // 起動確認
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Prevention system active:', !!window.loopPreventionSystem);
    });
</script>
```

**チェック項目:**
- [ ] 無限ループ防止システムがHTML内で読み込まれている
- [ ] システム起動の確認コードあり
- [ ] 他のスクリプトより先に読み込まれている
- [ ] 開発環境でデバッグモードON

#### 2. 既存システムとの共存確認
```javascript
// ConsoleManagerとの統合確認
if (window.ConsoleManager && window.loopPreventionSystem) {
    console.log('✅ 両システム正常統合');
}
```

**チェック項目:**
- [ ] 既存console-manager.jsとの競合なし
- [ ] 両システムのCPU監視が重複動作していない
- [ ] 緊急停止コマンドが両方で機能する
- [ ] ログ出力の重複なし

### 🧪 テスト実行チェック項目

#### 1. 負荷テスト
```javascript
// CPU負荷テスト
window.ilps.start({ debug: true, debugLevel: 'DEBUG' });

// 意図的な負荷生成テスト
for (let i = 0; i < 1000; i++) {
    setTimeout(() => console.log('test'), 1);
}
```

**テスト項目:**
- [ ] CPU監視が正常に動作
- [ ] 意図的な負荷で警告が出力される
- [ ] 緊急停止が正常に機能する
- [ ] システム復旧が正常に動作する

#### 2. 実環境テスト
```javascript
// 実際の編集システムでのテスト
window.addEventListener('load', () => {
    // 編集システム起動
    if (typeof startCharacterEdit === 'function') {
        startCharacterEdit();
        // 無限ループ防止システム動作確認
        setTimeout(() => window.ilps.status(), 3000);
    }
});
```

**テスト項目:**
- [ ] 編集システム起動時の動作確認
- [ ] Spine読み込み時の動作確認  
- [ ] 長時間編集セッションでの安定性確認
- [ ] モバイル環境での動作確認

### 📊 運用監視チェック項目

#### 1. 定期確認
```javascript
// 日次確認スクリプト
setInterval(() => {
    if (window.loopPreventionSystem) {
        window.ilps.status();
        const report = window.loopPreventionSystem.debug.reportHistory.slice(-5);
        if (report.length > 0) {
            console.warn('最近の問題:', report);
        }
    }
}, 86400000); // 24時間ごと
```

**確認項目:**
- [ ] CPU使用率履歴の確認
- [ ] 問題発生履歴の確認
- [ ] アクティブタイマー数の確認
- [ ] メモリリーク兆候の確認

#### 2. アラート設定
```javascript
// アラート設定例
window.loopPreventionSystem.monitoring.cpu.threshold = 20; // 20%で警告
```

**アラート項目:**
- [ ] CPU使用率閾値設定
- [ ] 緊急停止発生時の通知設定
- [ ] パフォーマンス劣化時の警告設定
- [ ] システム復旧失敗時の対応設定

### 🔧 トラブルシューティング手順

#### Level 1: 軽度の問題
1. **症状確認**
   ```javascript
   window.ilps.status(); // 現在のステータス確認
   ```

2. **一時的対処**
   ```javascript
   window.ilps.recover(); // システム復旧試行
   ```

3. **原因調査**
   ```javascript
   window.ilps.report(); // 詳細レポート確認
   ```

#### Level 2: 中度の問題（CPU使用率20-40%）
1. **緊急停止実行**
   ```javascript
   window.ilps.emergency(); // 手動緊急停止
   ```

2. **状況記録**
   ```javascript
   window.ilps.report(); // レポート保存
   ```

3. **段階的復旧**
   ```javascript
   window.ilps.recover(); // 復旧実行
   ```

#### Level 3: 重度の問題（CPU使用率40%超）
1. **即座対応**
   - `Ctrl+Alt+S`（キーボードショートカット）
   - ブラウザタブ再読み込み

2. **システム再起動**
   ```javascript
   window.ilps.stop();
   window.ilps.start({ debug: true });
   ```

3. **根本原因調査**
   - F12コンソールでエラー確認
   - パフォーマンスタブで詳細分析

### 📚 参考コマンド集

#### 基本コマンド
```javascript
// システム起動・停止
window.ilps.start();           // システム開始
window.ilps.stop();            // システム停止
window.ilps.status();          // 現在の状態確認
window.ilps.report();          // 詳細レポート表示

// 緊急操作
window.ilps.emergency();       // 緊急停止実行
window.ilps.recover();         // システム復旧
Ctrl+Alt+S                     // キーボード緊急停止
```

#### 高度なコマンド
```javascript
// カスタム設定での起動
window.ilps.start({
    cpuThreshold: 15,          // CPU閾値15%
    debug: true,               // デバッグON
    debugLevel: 'DEBUG'        // 詳細ログ
});

// システム内部アクセス
window.loopPreventionSystem.monitoring.cpu.samples;           // CPU履歴
window.loopPreventionSystem.detection.functionCallCounts;     // 関数呼び出し記録
window.loopPreventionSystem.debug.reportHistory;              // 問題履歴
```

### ✅ チェックリスト完了確認

#### 実装完了時
- [ ] 全ての危険パターンチェックを通過
- [ ] テストで意図的負荷生成→正常検出→復旧を確認
- [ ] 実環境での長時間稼働テストを完了
- [ ] 緊急停止・復旧手順を確認
- [ ] チームメンバーに緊急対応手順を共有

#### 本番運用開始時
- [ ] 監視アラートが正常に動作することを確認
- [ ] 定期確認スクリプトが稼働していることを確認
- [ ] トラブル発生時の対応フローを文書化
- [ ] 障害対応責任者を明確化
- [ ] 緊急連絡先を設定

---

## 🚨 緊急時クイックリファレンス

### 即座実行コマンド
```
Ctrl+Alt+S                    # 緊急停止（キーボード）
window.ilps.emergency()       # 緊急停止（コンソール）  
window.ilps.recover()         # システム復旧
F5                           # ページリロード（最終手段）
```

### 状況確認コマンド
```
window.ilps.status()          # 現在状況
window.ilps.report()          # 詳細分析
console.clear()              # コンソールクリア
```

### 連絡先・エスカレーション
- **Level 1**: 自己対応（上記手順）
- **Level 2**: チームメンバーに相談
- **Level 3**: システム管理者に連絡
- **Level 4**: 開発責任者にエスカレーション

**このチェックリストを印刷して開発デスクに常備することを推奨**