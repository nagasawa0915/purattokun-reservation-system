#!/usr/bin/env python3
"""
Spine対応カスタムHTTPサーバー
.atlasファイルのMIMEタイプ問題を解決
"""

import http.server
import socketserver
import mimetypes
import os

# .atlasファイルをtext/plainとして認識させる
mimetypes.add_type('text/plain', '.atlas')
mimetypes.add_type('application/json', '.json')

class SpineHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Spine WebGL用のカスタムHTTPハンドラー - 修正版"""
    
    def end_headers(self):
        # CORS対応
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        """GET リクエストの処理をオーバーライド"""
        # .atlasファイルの特別処理
        if self.path.endswith('.atlas'):
            self.send_atlas_file()
        else:
            super().do_GET()
    
    def do_HEAD(self):
        """HEAD リクエストの処理をオーバーライド"""
        # .atlasファイルの特別処理
        if self.path.endswith('.atlas'):
            self.send_atlas_head()
        else:
            super().do_HEAD()
    
    def send_atlas_file(self):
        """Atlasファイル専用送信処理"""
        try:
            # ファイルパスを正規化
            file_path = self.path.lstrip('/')
            
            print(f"[SERVE] Serving .atlas file: {file_path}")
            
            with open(file_path, 'rb') as f:
                content = f.read()
            
            # 正常なHTTPレスポンス送信
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.send_header('Content-Length', str(len(content)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            self.wfile.write(content)
            print(f"[OK] Successfully served .atlas file: {file_path} ({len(content)} bytes)")
            
        except FileNotFoundError:
            print(f"[ERROR] Atlas file not found: {file_path}")
            self.send_error(404, "Atlas file not found")
        except Exception as e:
            print(f"[ERROR] Error serving atlas file: {e}")
            self.send_error(500, f"Server error: {e}")
    
    def send_atlas_head(self):
        """Atlasファイル専用HEADレスポンス処理"""
        try:
            # ファイルパスを正規化
            file_path = self.path.lstrip('/')
            
            print(f"[HEAD] HEAD request for .atlas file: {file_path}")
            
            # ファイルサイズ取得
            file_size = os.path.getsize(file_path)
            
            # HEAD レスポンス送信（内容は送らない）
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.send_header('Content-Length', str(file_size))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            print(f"[OK] Successfully sent HEAD response for .atlas file: {file_path} ({file_size} bytes)")
            
        except FileNotFoundError:
            print(f"[ERROR] Atlas file not found: {file_path}")
            self.send_error(404, "Atlas file not found")
        except Exception as e:
            print(f"[ERROR] Error in HEAD request for atlas file: {e}")
            self.send_error(500, f"Server error: {e}")
    
    def log_message(self, format, *args):
        """ログメッセージをより詳細に"""
        message = format % args
        print(f"[HTTP] HTTP: {message}")
        
        # .atlasファイルのリクエストを特別に監視
        if '.atlas' in message:
            print(f"[ATLAS] ATLAS REQUEST DETECTED: {message}")

def run_server(port=8000):
    """Spineファイル対応サーバーを起動"""
    try:
        with socketserver.TCPServer(("", port), SpineHTTPRequestHandler) as httpd:
            print(f"[SERVER] Spine対応HTTPサーバー起動:")
            print(f"   [PORT] ポート: {port}")
            print(f"   [URL] URL: http://localhost:{port}")
            print(f"   [ATLAS] .atlasファイルサポート: 有効")
            print(f"   [MIME] MIMEタイプ設定: .atlas -> text/plain")
            print(f"   [READY] ぷらっとくん用サーバー準備完了!")
            print(f"   [STOP] 停止: Ctrl+C")
            print()
            
            # 現在のディレクトリ確認
            current_dir = os.getcwd()
            print(f"[DIR] 作業ディレクトリ: {current_dir}")
            
            # Spineファイルの存在確認
            spine_path = "assets/spine/characters/purattokun/"
            if os.path.exists(spine_path):
                files = os.listdir(spine_path)
                print(f"[FILES] Spineファイル確認: {files}")
            else:
                print(f"[WARNING] Spineパスが見つかりません: {spine_path}")
            
            print("-" * 50)
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n[STOP] サーバーを停止しました")
    except OSError as e:
        print(f"[ERROR] サーバー起動エラー: {e}")
        print(f"[INFO] ポート {port} が既に使用中の可能性があります")

if __name__ == "__main__":
    import sys
    
    # ポート番号を引数から取得（デフォルト8000）
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
            print(f"[INFO] コマンドライン引数でポート指定: {port}")
        except ValueError:
            print(f"[WARNING] 無効なポート番号: {sys.argv[1]} (デフォルト8000を使用)")
    
    run_server(port)