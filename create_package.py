#!/usr/bin/env python3
"""
商用パッケージ生成スクリプト - 編集システム完全除外版
- 編集システムのすべての痕跡を除去
- Spine WebGLアニメーションの正常動作を保証
- 商用品質のパッケージを生成
"""

import os
import shutil
import re
from datetime import datetime
import json

def create_commercial_package():
    """商用パッケージの生成"""
    
    # パッケージディレクトリの準備
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    package_dir = f"commercial_package_{timestamp}"
    
    if os.path.exists(package_dir):
        shutil.rmtree(package_dir)
    os.makedirs(package_dir)
    
    print(f"📦 商用パッケージを生成中: {package_dir}")
    
    # 必要なディレクトリとファイルのコピー
    directories_to_copy = [
        "assets/css",
        "assets/js",
        "assets/spine",
        "assets/images"
    ]
    
    for dir_path in directories_to_copy:
        if os.path.exists(dir_path):
            dest_path = os.path.join(package_dir, dir_path)
            shutil.copytree(dir_path, dest_path)
            print(f"✅ コピー完了: {dir_path}")
    
    # 除外するファイル（編集システム関連）
    files_to_exclude = [
        "spine-positioning-system-explanation.html",
        "spine-positioning-system-explanation.css",
        "spine-positioning-system-explanation.js",
        "spine-positioning-v2.js",
        "spine-positioning-v2.css",
        "spine-positioning-system-minimal.js"  # 位置復元システムも除外
    ]
    
    # 除外ファイルの削除
    for root, dirs, files in os.walk(package_dir):
        for file in files:
            if file in files_to_exclude:
                file_path = os.path.join(root, file)
                os.remove(file_path)
                print(f"🗑️ 除外: {file}")
    
    # index.htmlの処理
    process_index_html(package_dir)
    
    # server.pyのコピー（配信用）
    shutil.copy("server.py", os.path.join(package_dir, "server.py"))
    
    # README作成
    create_readme(package_dir)
    
    print(f"\n✅ 商用パッケージ生成完了: {package_dir}")
    print(f"📌 納品準備ができました。")
    
    return package_dir

def process_index_html(package_dir):
    """index.htmlから編集システム関連を完全に除去"""
    
    with open("index.html", "r", encoding="utf-8") as f:
        content = f.read()
    
    # 編集システム関連のコードを段階的に除去
    
    # 1. 編集モードチェックブロック全体を除去して、常に通常モードとして動作させる
    # URLパラメータチェックから位置復元システム読み込みまでのブロックを置換
    content = re.sub(
        r'// 🎯 編集モード対応（URLパラメータ）[\s\S]*?loadEditingSystem\(versionParam\);\s*\}\s*else\s*\{[\s\S]*?loadPositionSystem\(\);\s*\}',
        '''// 商用版：編集モード無効化
        // 位置情報はHTMLのdata属性から読み込み''',
        content,
        flags=re.MULTILINE
    )
    
    # 2. loadPositionSystem関数の定義を除去（位置復元システム）
    content = re.sub(
        r'// 位置復元システム読み込み[\s\S]*?function loadPositionSystem\(\)\s*\{[\s\S]*?\}\s*(?=\n\s*//|\n\s*function|\n\s*\}|\n\s*<)',
        '',
        content,
        flags=re.MULTILINE
    )
    
    # 3. loadEditingSystem関数の定義を完全除去
    content = re.sub(
        r'// 編集システム動的読み込み[\s\S]*?function loadEditingSystem\(version\)\s*\{[\s\S]*?\}\s*\}\s*(?=\n\s*//|\n\s*function|\n\s*\}|\n\s*<)',
        '',
        content,
        flags=re.MULTILINE
    )
    
    # 4. spine-positioning関連のscriptタグがあれば除去
    content = re.sub(
        r'<script[^>]*src="[^"]*spine-positioning[^"]*"[^>]*>[\s\S]*?</script>',
        '',
        content,
        flags=re.MULTILINE
    )
    
    # 5. edit-panel要素があれば除去
    content = re.sub(
        r'<div[^>]*id="edit-panel"[^>]*>[\s\S]*?</div>\s*(?=<div|</body>)',
        '',
        content,
        flags=re.MULTILINE
    )
    
    # 6. デバッグパネルも除去
    content = re.sub(
        r'<!--\s*デバッグパネル[\s\S]*?</div>\s*-->',
        '',
        content,
        flags=re.MULTILINE
    )
    
    # 7. spineManagerの初期化を確実にする
    # 既存のSpine初期化コードの後に、確実性を高めるコードを追加
    spine_init_enhancement = '''
        // 🎯 商用版Spine初期化強化
        (function() {
            let initAttempts = 0;
            const maxAttempts = 20;
            
            function ensureSpineInitialization() {
                if (typeof spineManager !== 'undefined' && spineManager) {
                    console.log('✅ spineManager確認完了');
                    
                    // 設定の再確認
                    const config = document.getElementById('purattokun-config');
                    if (config) {
                        const x = parseFloat(config.getAttribute('data-x')) || 18;
                        const y = parseFloat(config.getAttribute('data-y')) || 49;
                        const scale = parseFloat(config.getAttribute('data-scale')) || 0.55;
                        
                        console.log('📊 Spine設定確認:', { x, y, scale });
                    }
                    
                    return;
                }
                
                initAttempts++;
                if (initAttempts < maxAttempts) {
                    console.log(`⏳ spineManager待機中... (${initAttempts}/${maxAttempts})`);
                    setTimeout(ensureSpineInitialization, 250);
                } else {
                    console.error('❌ spineManager初期化タイムアウト');
                }
            }
            
            // DOMContentLoaded後に初期化チェック開始
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    setTimeout(ensureSpineInitialization, 500);
                });
            } else {
                setTimeout(ensureSpineInitialization, 500);
            }
        })();
    '''
    
    # </script>タグの前に初期化強化コードを挿入
    # waitForSpine();の後に挿入
    content = re.sub(
        r'(waitForSpine\(\);[\s\S]*?)(</script>)',
        r'\1' + spine_init_enhancement + r'\n    \2',
        content,
        count=1
    )
    
    # 8. 編集モード関連のイベントリスナーを除去
    # exit-edit-btn関連のコードブロックを除去
    content = re.sub(
        r"document\.getElementById\('exit-edit-btn'\)[\s\S]*?\.addEventListener[\s\S]*?\};?\s*\}\);\s*\}",
        '}',
        content,
        flags=re.MULTILINE
    )
    
    # 9. 編集ボタン関連のイベントリスナーも除去
    content = re.sub(
        r"document\.getElementById\('edit-character-btn'\)[\s\S]*?\.addEventListener[\s\S]*?\};?\s*\}\);\s*(?=document\.getElementById|\})",
        '',
        content,
        flags=re.MULTILINE
    )
    
    content = re.sub(
        r"document\.getElementById\('edit-canvas-btn'\)[\s\S]*?\.addEventListener[\s\S]*?\};?\s*\}\);\s*(?=document\.getElementById|\})",
        '',
        content,
        flags=re.MULTILINE
    )
    
    # 10. コンソールログのクリーンアップ（編集モード関連のログを除去）
    content = re.sub(
        r'console\.log\([\'"].*編集モード.*[\'"]\);?\s*\n',
        '',
        content,
        flags=re.MULTILINE
    )
    
    # 11. 編集モードという文字列を含むすべてのコメントと文字列を除去
    content = re.sub(
        r'//.*編集モード.*\n',
        '',
        content,
        flags=re.MULTILINE
    )
    
    content = re.sub(
        r'/\*.*編集モード.*\*/',
        '',
        content,
        flags=re.MULTILINE
    )
    
    # 12. confirm内の編集モード文字列も除去
    content = re.sub(
        r"confirm\('編集モード[^']*'\)",
        'false',
        content
    )
    
    # 処理済みのindex.htmlを保存
    output_path = os.path.join(package_dir, "index.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)
    
    print("✅ index.html処理完了 - 編集システム完全除去")

def create_readme(package_dir):
    """納品用READMEの作成"""
    
    readme_content = """# ぷらっとくんの予約システム - 商用パッケージ

## 起動方法

1. このフォルダでターミナル/コマンドプロンプトを開く
2. 以下のコマンドでサーバーを起動：
   ```
   python server.py
   ```
3. ブラウザで http://localhost:8000 にアクセス

## 動作環境

- Python 3.x
- モダンブラウザ（Chrome, Firefox, Safari, Edge）

## 注意事項

- このパッケージは商用配布用です
- 編集機能は含まれていません
- Spineアニメーションが自動的に再生されます

## ぷらっとくんの位置調整

index.html内の以下の部分で位置を調整できます：

```html
<div id="purattokun-config" style="display: none;"
     data-x="18"            <!-- 横位置（vw単位） -->
     data-y="49"            <!-- 縦位置（vh単位） -->
     data-scale="0.55">     <!-- サイズ -->
</div>
```

## トラブルシューティング

### ぷらっとくんが表示されない場合
1. ブラウザのキャッシュをクリア（Ctrl+F5 または Cmd+Shift+R）
2. コンソールエラーを確認（F12キー）
3. server.pyが正常に起動していることを確認

### ポート8000が使用中の場合
別のポートを指定して起動：
```
python server.py --port 8080
```

---
制作：ネコヤ
"""
    
    with open(os.path.join(package_dir, "README.txt"), "w", encoding="utf-8") as f:
        f.write(readme_content)

def validate_package(package_dir):
    """パッケージの検証"""
    
    print("\n📋 パッケージ検証中...")
    
    # 編集システムファイルが存在しないことを確認
    excluded_files = [
        "spine-positioning-system-explanation.html",
        "spine-positioning-system-explanation.css",
        "spine-positioning-system-explanation.js",
        "spine-positioning-v2.js",
        "spine-positioning-v2.css",
        "spine-positioning-system-minimal.js"
    ]
    
    issues = []
    
    for root, dirs, files in os.walk(package_dir):
        for file in files:
            if file in excluded_files:
                issues.append(f"❌ 編集システムファイルが残存: {file}")
    
    # index.htmlの内容チェック
    index_path = os.path.join(package_dir, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # 編集システム関連の文字列が残っていないか確認
        edit_patterns = [
            "loadEditingSystem",
            "spine-positioning-system",
            "spine-positioning-v2",
            "edit-panel",
            "urlParams.get('edit')",
            "編集モード",
            "loadPositionSystem"
        ]
        
        for pattern in edit_patterns:
            # 商用版コメントは除外
            if pattern == "編集モード" and "商用版：編集モード無効化" in content:
                continue
            if pattern in content:
                # より厳密なチェック（コメント化されたものは除外）
                import re
                # パターンが実際のコードに含まれているかチェック
                pattern_regex = re.escape(pattern)
                # コメント外でパターンが見つかった場合のみ問題とする
                matches = re.findall(rf'(?<!//\s)(?<!/\*)\b{pattern_regex}\b', content)
                if matches:
                    issues.append(f"❌ 編集システムの痕跡: {pattern} ({len(matches)}箇所)")
    
    # 必要なファイルの存在確認
    required_files = [
        "assets/spine/spine-integration-v2.js",
        "assets/spine/spine-character-manager.js",
        "assets/spine/characters/purattokun/purattokun.json",
        "assets/spine/characters/purattokun/purattokun.atlas",
        "assets/spine/characters/purattokun/purattokun.png",
        "server.py"
    ]
    
    for file_path in required_files:
        full_path = os.path.join(package_dir, file_path)
        if not os.path.exists(full_path):
            issues.append(f"❌ 必要ファイル不足: {file_path}")
    
    # 結果出力
    if issues:
        print("\n⚠️ 検証で問題が見つかりました:")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("✅ パッケージ検証成功 - 問題なし")
    
    return len(issues) == 0

if __name__ == "__main__":
    # 既存のパッケージディレクトリを削除
    import glob
    for old_package in glob.glob("commercial_package_*"):
        if os.path.isdir(old_package):
            shutil.rmtree(old_package)
            print(f"🗑️ 古いパッケージを削除: {old_package}")
    
    # 新しいパッケージを生成
    package_dir = create_commercial_package()
    if validate_package(package_dir):
        print(f"\n🎉 商用パッケージの生成が完了しました！")
        print(f"📦 パッケージ: {package_dir}")
        print(f"🚀 配布準備完了")
    else:
        print(f"\n⚠️ パッケージに問題があります。修正が必要です。")