// Spine Editor Desktop v2.0 - Optimized HTTP Server
const express = require('express');
const path = require('path');
const { createServer } = require('http');

/**
 * 軽量Spineサーバー - 200行以内の最適化実装
 * 目標: 3秒以内起動・最小メモリ使用・必要最小機能
 */
class SpineServer {
  constructor(port = 8081) {
    this.port = port;
    this.app = express();
    this.server = null;
    this.setupFastMiddleware();
    this.setupCoreRoutes();
  }

  /**
   * 高速ミドルウェア設定 - パフォーマンス優先
   */
  setupFastMiddleware() {
    // 基本的なレスポンス最適化
    
    // 統合CORS + MIME設定(パフォーマンス最適化)
    this.app.use((req, res, next) => {
      // CORSヘッダー
      res.header('Access-Control-Allow-Origin', 'http://localhost:*');
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Cache-Control', 'public, max-age=3600');
      
      // Spine専用MIMEタイプ
      const url = req.url;
      if (url.endsWith('.atlas')) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      } else if (url.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      } else if (url.endsWith('.js')) {
        res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      }
      
      req.method === 'OPTIONS' ? res.sendStatus(200) : next();
    });

    // 高速静的ファイル配信
    this.app.use(express.static(path.join(__dirname, '../renderer'), {
      maxAge: '1h',
      etag: false,
      lastModified: false,
      index: ['index.html']
    }));
  }

  /**
   * コアAPIルート - 必要最小限
   */
  setupCoreRoutes() {
    // シンプルヘルスチェック
    this.app.get('/health', (req, res) => 
      res.json({ status: 'ok', v: '2.0.0' })
    );

    // API情報(デバッグ用)
    this.app.get('/api/info', (req, res) => 
      res.json({ 
        name: 'Spine Editor v2.0', 
        status: 'running',
        uptime: process.uptime()
      })
    );

    // シンプルエラーハンドリング
    this.app.use((req, res) => res.status(404).end());
  }

  /**
   * 高速サーバー起動 - 3秒以内目標
   */
  async start() {
    return new Promise((resolve, reject) => {
      // ポート自動検出ロジック
      const tryPort = (port) => {
        this.server = createServer(this.app);
        
        this.server.listen(port, () => {
          this.port = port;
          console.log(`⚡ Spine Server v2.0 ready on :${port}`);
          resolve(`http://localhost:${port}`);
        });
        
        this.server.on('error', (err) => {
          if (err.code === 'EADDRINUSE' && port < this.port + 10) {
            tryPort(port + 1); // ポート自動インクリメント
          } else {
            reject(err);
          }
        });
      };
      
      tryPort(this.port);
    });
  }

  /**
   * サーバー停止
   */
  async stop() {
    if (this.server) {
      return new Promise(resolve => {
        this.server.close(() => {
          console.log('✅ Server stopped');
          resolve();
        });
      });
    }
  }

  getUrl() { return `http://localhost:${this.port}`; }
}
module.exports = SpineServer;