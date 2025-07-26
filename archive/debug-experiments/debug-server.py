#!/usr/bin/env python3
"""
デバッグ用シンプルサーバー
"""

import http.server
import socketserver
import os

class DebugHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        print(f"🔍 REQUEST: {self.path}")
        
        if self.path.endswith('.atlas'):
            print(f"🎯 ATLAS FILE REQUESTED: {self.path}")
            try:
                file_path = self.path.lstrip('/')
                print(f"📁 Looking for file: {file_path}")
                
                with open(file_path, 'rb') as f:
                    content = f.read()
                
                print(f"✅ File found, size: {len(content)} bytes")
                
                self.send_response(200)
                self.send_header('Content-type', 'text/plain')
                self.send_header('Content-Length', str(len(content)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(content)
                
                print(f"📤 Atlas file sent successfully")
                
            except Exception as e:
                print(f"❌ Error: {e}")
                self.send_error(500, str(e))
        else:
            print(f"🌐 Regular file request")
            super().do_GET()

if __name__ == "__main__":
    port = 8001  # 異なるポートを使用
    print(f"🚀 Debug server starting on port {port}")
    print(f"📍 Current directory: {os.getcwd()}")
    
    with socketserver.TCPServer(("", port), DebugHandler) as httpd:
        print(f"🌐 http://localhost:{port}")
        print("⏹️  Ctrl+C to stop")
        httpd.serve_forever()