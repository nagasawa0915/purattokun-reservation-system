/**
 * ウインドウ管理アダプター
 * 統合UI → 独立ウインドウへの段階的移行を支援
 */

export type WindowType = 'main' | 'outliner' | 'preview' | 'properties' | 'timeline';

export interface WindowConfig {
  id: WindowType;
  title: string;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  resizable: boolean;
  position?: { x: number; y: number };
}

export interface WindowState {
  id: WindowType;
  isOpen: boolean;
  bounds: { x: number; y: number; width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
}

/**
 * IPC通信チャンネル定義（将来のマルチウインドウ用）
 */
export const IPC_CHANNELS = {
  // プロジェクト関連
  PROJECT_LOAD: 'project:load',
  PROJECT_SAVE: 'project:save',
  PROJECT_UPDATED: 'project:updated',
  
  // キャラクター操作
  CHARACTER_ADD: 'character:add',
  CHARACTER_UPDATE: 'character:update',
  CHARACTER_DELETE: 'character:delete',
  CHARACTER_SELECT: 'character:select',
  
  // プレビュー制御
  PREVIEW_REFRESH: 'preview:refresh',
  PREVIEW_PLAY: 'preview:play',
  PREVIEW_STOP: 'preview:stop',
  
  // UI状態同期
  UI_STATE_SYNC: 'ui:state:sync',
  UI_SELECTION_SYNC: 'ui:selection:sync',
  
  // ウインドウ管理
  WINDOW_OPEN: 'window:open',
  WINDOW_CLOSE: 'window:close',
  WINDOW_FOCUS: 'window:focus',
  
  // エクスポート
  EXPORT_START: 'export:start',
  EXPORT_COMPLETE: 'export:complete',
} as const;

/**
 * WindowAdapterインターフェース
 * 統合UI時とマルチウインドウ時で実装を切り替え可能
 */
export interface IWindowAdapter {
  /** 初期化 */
  init(): Promise<void>;
  
  /** ウインドウを開く */
  openWindow(type: WindowType, config?: Partial<WindowConfig>): Promise<void>;
  
  /** ウインドウを閉じる */
  closeWindow(type: WindowType): Promise<void>;
  
  /** ウインドウにメッセージを送信 */
  sendToWindow(type: WindowType, channel: string, data: any): void;
  
  /** 全ウインドウに一斉送信 */
  broadcast(channel: string, data: any): void;
  
  /** ウインドウ状態を取得 */
  getWindowState(type: WindowType): WindowState | null;
  
  /** 終了処理 */
  destroy(): Promise<void>;
}

/**
 * 統合UI実装（Phase 1用）
 */
export class IntegratedWindowAdapter implements IWindowAdapter {
  private eventTarget = new EventTarget();
  private windowStates: Map<WindowType, WindowState> = new Map();
  
  async init(): Promise<void> {
    console.log('🖥️  統合UIモードで初期化');
    
    // メインウインドウの状態を初期化
    this.windowStates.set('main', {
      id: 'main',
      isOpen: true,
      bounds: { x: 0, y: 0, width: 1400, height: 900 },
      isMinimized: false,
      isMaximized: false,
    });
  }
  
  async openWindow(type: WindowType, config?: Partial<WindowConfig>): Promise<void> {
    console.log(`📂 ウインドウ開く: ${type} (統合UI内で表示)`);
    
    // 統合UI内でパネルの表示/非表示を切り替え
    const event = new CustomEvent('panel:show', { 
      detail: { type, config } 
    });
    this.eventTarget.dispatchEvent(event);
  }
  
  async closeWindow(type: WindowType): Promise<void> {
    console.log(`❌ ウインドウ閉じる: ${type}`);
    
    const event = new CustomEvent('panel:hide', { 
      detail: { type } 
    });
    this.eventTarget.dispatchEvent(event);
  }
  
  sendToWindow(type: WindowType, channel: string, data: any): void {
    // 統合UI内での内部イベントとして処理
    const event = new CustomEvent('message', {
      detail: { target: type, channel, data }
    });
    this.eventTarget.dispatchEvent(event);
  }
  
  broadcast(channel: string, data: any): void {
    // 全パネルに一斉送信
    const event = new CustomEvent('broadcast', {
      detail: { channel, data }
    });
    this.eventTarget.dispatchEvent(event);
  }
  
  getWindowState(type: WindowType): WindowState | null {
    return this.windowStates.get(type) || null;
  }
  
  /** イベントリスナー登録 */
  on(event: string, handler: (event: CustomEvent) => void): void {
    this.eventTarget.addEventListener(event, handler as EventListener);
  }
  
  /** イベントリスナー削除 */
  off(event: string, handler: (event: CustomEvent) => void): void {
    this.eventTarget.removeEventListener(event, handler as EventListener);
  }
  
  async destroy(): Promise<void> {
    console.log('🗑️  統合UIアダプター終了');
    this.windowStates.clear();
  }
}

/**
 * マルチウインドウ実装（Phase 5用）
 */
export class MultiWindowAdapter implements IWindowAdapter {
  private windows: Map<WindowType, Electron.BrowserWindow> = new Map();
  private ipcMain: any; // Electron.ipcMain
  
  constructor(ipcMain: any) {
    this.ipcMain = ipcMain;
  }
  
  async init(): Promise<void> {
    console.log('🖥️  マルチウインドウモードで初期化');
    
    // IPC通信の設定
    this.setupIPCHandlers();
  }
  
  async openWindow(type: WindowType, config?: Partial<WindowConfig>): Promise<void> {
    console.log(`🆕 新しいウインドウを開く: ${type}`);
    
    const defaultConfigs: Record<WindowType, WindowConfig> = {
      main: { id: 'main', title: 'Spine Editor', width: 1400, height: 900, resizable: true },
      outliner: { id: 'outliner', title: 'Outliner', width: 300, height: 600, resizable: true },
      preview: { id: 'preview', title: 'Preview', width: 800, height: 600, resizable: true },
      properties: { id: 'properties', title: 'Properties', width: 300, height: 800, resizable: true },
      timeline: { id: 'timeline', title: 'Timeline', width: 1200, height: 300, resizable: true },
    };
    
    const windowConfig = { ...defaultConfigs[type], ...config };
    
    // Electronウインドウ作成（実装は省略）
    // const window = new BrowserWindow({ ... });
    // this.windows.set(type, window);
  }
  
  async closeWindow(type: WindowType): Promise<void> {
    const window = this.windows.get(type);
    if (window) {
      window.close();
      this.windows.delete(type);
    }
  }
  
  sendToWindow(type: WindowType, channel: string, data: any): void {
    const window = this.windows.get(type);
    if (window) {
      window.webContents.send(channel, data);
    }
  }
  
  broadcast(channel: string, data: any): void {
    this.windows.forEach(window => {
      window.webContents.send(channel, data);
    });
  }
  
  getWindowState(type: WindowType): WindowState | null {
    const window = this.windows.get(type);
    if (!window) return null;
    
    const bounds = window.getBounds();
    return {
      id: type,
      isOpen: !window.isDestroyed(),
      bounds,
      isMinimized: window.isMinimized(),
      isMaximized: window.isMaximized(),
    };
  }
  
  private setupIPCHandlers(): void {
    // IPC通信ハンドラーの設定（実装は省略）
    Object.values(IPC_CHANNELS).forEach(channel => {
      this.ipcMain.handle(channel, async (event: any, ...args: any[]) => {
        // チャンネルごとの処理
      });
    });
  }
  
  async destroy(): Promise<void> {
    console.log('🗑️  マルチウインドウアダプター終了');
    
    // 全ウインドウを閉じる
    for (const [type, window] of this.windows) {
      if (!window.isDestroyed()) {
        window.close();
      }
    }
    this.windows.clear();
  }
}

/**
 * WindowAdapter ファクトリー
 */
export class WindowAdapterFactory {
  /**
   * 適切なアダプターを作成
   * @param mode 'integrated' | 'multi'
   * @param ipcMain ElectronのipcMain（マルチウインドウ時のみ）
   */
  static create(mode: 'integrated' | 'multi', ipcMain?: any): IWindowAdapter {
    switch (mode) {
      case 'integrated':
        return new IntegratedWindowAdapter();
      case 'multi':
        if (!ipcMain) {
          throw new Error('マルチウインドウモードにはipcMainが必要です');
        }
        return new MultiWindowAdapter(ipcMain);
      default:
        throw new Error(`未対応のモード: ${mode}`);
    }
  }
}

/**
 * アプリケーション設定
 */
export interface AppConfig {
  windowMode: 'integrated' | 'multi';
  windows: {
    [K in WindowType]?: {
      enabled: boolean;
      defaultConfig: Partial<WindowConfig>;
    };
  };
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  windowMode: 'integrated', // Phase 1は統合UI
  windows: {
    main: {
      enabled: true,
      defaultConfig: { width: 1400, height: 900 },
    },
    outliner: {
      enabled: true,
      defaultConfig: { width: 300, height: 600 },
    },
    preview: {
      enabled: true,
      defaultConfig: { width: 800, height: 600 },
    },
    properties: {
      enabled: true,
      defaultConfig: { width: 300, height: 800 },
    },
    timeline: {
      enabled: false, // Phase 4まで無効
      defaultConfig: { width: 1200, height: 300 },
    },
  },
};