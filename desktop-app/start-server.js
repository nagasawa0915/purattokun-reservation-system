// サーバー自動起動ヘルパー
// デスクトップアプリからHTMLビュー用のローカルサーバーを自動起動

const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

class LocalServerManager {
  constructor() {
    this.serverProcess = null;
    this.serverPort = 8001; // 競合回避のため8001を使用
    this.projectRoot = path.resolve(__dirname, '..');
  }
  
  // ポートが使用可能か確認
  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.once('close', () => resolve(true));
        server.close();
      });
      server.on('error', () => resolve(false));
    });
  }
  
  // サーバー起動
  async startServer() {
    try {
      console.log('🔍 ローカルサーバー起動チェック...');
      
      // ポート確認
      const portAvailable = await this.isPortAvailable(this.serverPort);
      if (!portAvailable) {
        console.log(`✅ ポート${this.serverPort}は既に使用中（サーバー起動済みの可能性）`);
        return { success: true, message: 'サーバーは既に起動済みです', port: this.serverPort };
      }
      
      console.log(`🚀 ローカルサーバー起動開始 - ポート: ${this.serverPort}`);
      
      // Python実行ファイルを探す
      const pythonCommands = ['python3', 'python', 'py'];
      let pythonCmd = null;
      
      for (const cmd of pythonCommands) {
        try {
          const testProcess = spawn(cmd, ['--version'], { stdio: 'pipe' });
          await new Promise((resolve) => {
            testProcess.on('close', (code) => {
              if (code === 0) pythonCmd = cmd;
              resolve();
            });
            testProcess.on('error', () => resolve());
          });
          if (pythonCmd) break;
        } catch (error) {
          continue;
        }
      }
      
      if (!pythonCmd) {
        throw new Error('Pythonが見つかりません。server.pyを手動で起動してください。');
      }
      
      console.log(`✅ Python発見: ${pythonCmd}`);
      
      // server.py起動（ポートを引数で指定）
      const serverPath = path.join(this.projectRoot, 'server.py');
      this.serverProcess = spawn(pythonCmd, [serverPath, this.serverPort.toString()], {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      
      // サーバーログを監視
      this.serverProcess.stdout.on('data', (data) => {
        console.log(`[Server] ${data.toString().trim()}`);
      });
      
      this.serverProcess.stderr.on('data', (data) => {
        console.error(`[Server Error] ${data.toString().trim()}`);
      });
      
      this.serverProcess.on('close', (code) => {
        console.log(`🛑 ローカルサーバー停止 - コード: ${code}`);
        this.serverProcess = null;
      });
      
      // サーバー起動待機
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // 起動確認
      const isRunning = !await this.isPortAvailable(this.serverPort);
      if (isRunning) {
        console.log(`✅ ローカルサーバー起動完了 - http://localhost:${this.serverPort}`);
        return { 
          success: true, 
          message: 'サーバーが正常に起動しました', 
          port: this.serverPort,
          url: `http://localhost:${this.serverPort}`
        };
      } else {
        throw new Error('サーバーの起動確認に失敗しました');
      }
      
    } catch (error) {
      console.error('❌ ローカルサーバー起動エラー:', error);
      return { 
        success: false, 
        error: error.message,
        fallbackMessage: '手動でサーバーを起動してください：\n1. ターミナルでプロジェクトルートに移動\n2. python server.py を実行'
      };
    }
  }
  
  // サーバー停止
  stopServer() {
    if (this.serverProcess) {
      console.log('🛑 ローカルサーバー停止中...');
      this.serverProcess.kill('SIGTERM');
      this.serverProcess = null;
    }
  }
  
  // サーバー状態確認
  async checkServerStatus() {
    const isRunning = !await this.isPortAvailable(this.serverPort);
    return {
      isRunning,
      port: this.serverPort,
      url: `http://localhost:${this.serverPort}`,
      message: isRunning ? 'サーバー稼働中' : 'サーバー停止中'
    };
  }
}

module.exports = LocalServerManager;