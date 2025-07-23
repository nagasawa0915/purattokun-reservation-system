#!/usr/bin/env python3
"""
シンプルなAtlas対応HTTPサーバー
最小限の設定でエラーを回避
"""

import http.server
import socketserver
import os

class SimpleAtlasHandler(http.server.SimpleHTTPRequestHandler):
    """シンプルなAtlas対応ハンドラー"""
    
    def end_headers(self):
        # CORS対応
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()
    
    def do_GET(self):
        """GETリクエストの処理をカスタマイズ"""
        try:
            # .atlasファイルの特別処理
            if self.path.endswith('.atlas'):
                self.send_atlas_file()
            else:
                # 通常のファイル処理
                super().do_GET()
        except Exception as e:
            print(f"❌ Error serving {self.path}: {e}")
            self.send_error(500, f"Internal server error: {e}")
    
    def send_atlas_file(self):
        """Atlasファイルの送信"""
        try:
            # ファイルパスの処理
            path = self.path.lstrip('/')
            if os.path.exists(path):
                print(f"🔧 Serving Atlas file: {path}")
                
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # レスポンス送信
                self.send_response(200)
                self.send_header('Content-Type', 'text/plain; charset=utf-8')
                self.send_header('Content-Length', str(len(content.encode('utf-8'))))
                self.end_headers()
                self.wfile.write(content.encode('utf-8'))
                
                print(f"✅ Atlas file served successfully: {len(content)} characters")
            else:
                print(f"❌ Atlas file not found: {path}")
                self.send_error(404, f"Atlas file not found: {path}")
                
        except Exception as e:
            print(f"❌ Error serving atlas file: {e}")
            self.send_error(500, f"Error serving atlas file: {e}")
    
    def log_message(self, format, *args):
        """ログメッセージ"""
        message = format % args
        print(f"🌐 {message}")

def run_simple_server(port=8000):
    """シンプルサーバーを起動"""
    try:
        with socketserver.TCPServer(("", port), SimpleAtlasHandler) as httpd:
            print(f"🚀 シンプルAtlas対応サーバー起動:")
            print(f"   📡 ポート: {port}")
            print(f"   🌐 URL: http://localhost:{port}")
            print(f"   🔧 Atlas対応: 手動処理")
            print(f"   📝 エラー回避: 最大限")
            print(f"   ⏹️  停止: Ctrl+C")
            print("-" * 40)
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 サーバーを停止しました")
    except Exception as e:
        print(f"❌ サーバー起動エラー: {e}")

if __name__ == "__main__":
    run_simple_server()