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
    this.currentProjectPath = null; // 動的プロジェクトパス
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
      
      // 開発時はキャッシュ無効化、本番時はキャッシュ有効
      const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
      if (isDev) {
        res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.header('Pragma', 'no-cache');
        res.header('Expires', '0');
      } else {
        res.header('Cache-Control', 'public, max-age=3600');
      }
      
      // Spine専用MIMEタイプ
      const url = req.url;
      if (url.endsWith('.atlas')) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      } else if (url.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      } else if (url.endsWith('.js') || url.endsWith('.html')) {
        res.setHeader('Content-Type', url.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8');
      }
      
      req.method === 'OPTIONS' ? res.sendStatus(200) : next();
    });

    // 高速静的ファイル配信
    const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
    this.app.use(express.static(path.join(__dirname, '../renderer'), {
      maxAge: isDev ? 0 : '1h',
      etag: isDev ? false : true,
      lastModified: isDev ? false : true,
      index: false // indexファイル自動配信を無効化してstart.htmlを確実に配信
    }));
  }

  /**
   * コアAPIルート - 必要最小限
   */
  setupCoreRoutes() {
    // ルートパス（/）をstart.htmlにリダイレクト - より確実な処理
    this.app.get('/', (req, res) => {
      console.log('🏠 Root path accessed, redirecting to start.html');
      
      // リダイレクトの代わりに直接start.htmlの内容を配信
      const startHtmlPath = path.join(__dirname, '../renderer/start.html');
      const fs = require('fs');
      
      if (fs.existsSync(startHtmlPath)) {
        res.sendFile(startHtmlPath, (err) => {
          if (err) {
            console.error('❌ Failed to serve start.html from root:', err);
            res.redirect('/start.html'); // フォールバック: リダイレクト
          } else {
            console.log('✅ start.html served from root path');
          }
        });
      } else {
        console.error('❌ start.html not found, using redirect fallback');
        res.redirect('/start.html');
      }
    });

    // start.htmlの明示的な配信 - ファイル存在確認付き
    this.app.get('/start.html', (req, res) => {
      const startHtmlPath = path.join(__dirname, '../renderer/start.html');
      
      // ファイル存在確認
      const fs = require('fs');
      if (!fs.existsSync(startHtmlPath)) {
        console.error('❌ start.html not found at:', startHtmlPath);
        res.status(404).send(`<!DOCTYPE html>
<html><head><title>File Not Found</title></head>
<body><h1>start.html not found</h1><p>Expected path: ${startHtmlPath}</p></body></html>`);
        return;
      }
      
      console.log('📄 Serving start.html from:', startHtmlPath);
      res.sendFile(startHtmlPath, (err) => {
        if (err) {
          console.error('❌ Failed to serve start.html:', err);
          res.status(500).send('Failed to load start page');
        } else {
          console.log('✅ start.html served successfully');
        }
      });
    });

    // editor.htmlの明示的な配信
    this.app.get('/editor.html', (req, res) => {
      const editorHtmlPath = path.join(__dirname, '../renderer/editor.html');
      res.sendFile(editorHtmlPath, (err) => {
        if (err) {
          console.error('❌ Failed to serve editor.html:', err);
          res.status(500).send('Failed to load editor page');
        }
      });
    });

    // シンプルヘルスチェック
    this.app.get('/health', (req, res) => 
      res.json({ status: 'ok', v: '2.0.0' })
    );
    
    // 動的プロジェクトファイル配信ミドルウェア
    this.app.use((req, res, next) => {
      // プロジェクトパスが設定されている場合、そこから配信
      if (this.currentProjectPath && req.path !== '/health') {
        // URLパスをファイルパスに正規化（/ → \）
        const normalizedPath = req.path.replace(/^\//, '').replace(/\//g, path.sep);
        const projectFilePath = path.join(this.currentProjectPath, normalizedPath);
        const fs = require('fs');
        
        console.log('🔧 Request path:', req.path);
        console.log('🔧 Normalized path:', normalizedPath);
        console.log('🔧 Full project file path:', projectFilePath);
        
        if (fs.existsSync(projectFilePath) && fs.statSync(projectFilePath).isFile()) {
          console.log('📁 Serving from project:', projectFilePath);
          res.sendFile(projectFilePath);
          return;
        } else {
          console.log('⚠️ File not found:', projectFilePath);
        }
      }
      next();
    });

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
      // タイムアウト設定（10秒）
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 10000);

      // ポート自動検出ロジック
      const tryPort = (port) => {
        console.log(`🔍 Trying to start server on port ${port}...`);
        
        this.server = createServer(this.app);
        
        this.server.listen(port, '127.0.0.1', () => {
          clearTimeout(timeout);
          this.port = port;
          console.log(`⚡ Spine Server v2.0 ready on 127.0.0.1:${port}`);
          
          // サーバー起動確認のための簡単なテスト
          setTimeout(() => {
            resolve(`http://localhost:${port}`);
          }, 100);
        });
        
        this.server.on('error', (err) => {
          console.warn(`❌ Port ${port} failed:`, err.message);
          if (err.code === 'EADDRINUSE' && port < this.port + 10) {
            tryPort(port + 1); // ポート自動インクリメント
          } else {
            clearTimeout(timeout);
            reject(err);
          }
        });
      };
      
      tryPort(this.port);
    });
  }

  /**
   * プロジェクトパス設定
   */
  setProjectPath(projectPath) {
    this.currentProjectPath = projectPath;
    console.log('📁 Project path set to:', projectPath);
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