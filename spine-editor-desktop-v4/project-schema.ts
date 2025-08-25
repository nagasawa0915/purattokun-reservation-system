/**
 * Spine配置エディター - プロジェクトデータスキーマ v1.0
 * 将来の機能拡張を見越した拡張可能な設計
 */

export interface ProjectSchema {
  /** スキーマバージョン（後方互換性のため） */
  version: 1;
  
  /** プロジェクト基本情報 */
  project: {
    name: string;
    created: string; // ISO 8601
    modified: string; // ISO 8601
    author?: string;
  };
  
  /** 対象HTMLページ情報 */
  page: {
    /** メインHTMLファイル名（プロジェクトルート相対） */
    file: string;
    /** プレビュー用キャンバスサイズ */
    canvas: {
      width: number;
      height: number;
      /** DPR対応フラグ（将来用） */
      devicePixelRatio?: number;
    };
  };
  
  /** フォルダ設定 */
  folders: {
    /** HPフォルダパス（絶対パス） */
    homepage: string;
    /** Spineアセットフォルダパス（絶対パス） */
    spineAssets: string;
    /** 最後に使用したエクスポート先（任意） */
    lastExportPath?: string;
  };
  
  /** 配置されたキャラクター一覧 */
  characters: SpineCharacter[];
  
  /** エディター設定（UI状態） */
  editor: {
    /** グリッドスナップ設定 */
    grid: {
      enabled: boolean;
      size: number; // ピクセル
      visible: boolean;
    };
    /** プレビュー設定 */
    preview: {
      backgroundColor: string; // CSS color
      showBounds: boolean;
      showGrid: boolean;
    };
    /** 自動保存間隔（分） */
    autoSaveInterval: number;
  };
  
  /** 将来拡張用メタデータ */
  meta: Record<string, any>;
}

export interface SpineCharacter {
  /** 一意識別子（nezumi#1, purattokun#1など） */
  id: string;
  
  /** Spine設定 */
  spine: {
    /** Spineプロジェクト名 */
    name: string;
    /** skeletonファイルパス（Spineフォルダ相対） */
    skeleton: string; // "nezumi/nezumi.json"
    /** atlasファイルパス（Spineフォルダ相対） */
    atlas: string;    // "nezumi/nezumi.atlas"
    /** テクスチャファイルパス（任意、atlasから自動解析可能） */
    texture?: string; // "nezumi/nezumi.png"
  };
  
  /** 変換情報（CSSピクセル単位） */
  transform: {
    /** X座標（DOM左上基準） */
    x: number;
    /** Y座標（DOM左上基準） */
    y: number;
    /** X方向スケール（1.0 = 100%） */
    scaleX: number;
    /** Y方向スケール（1.0 = 100%） */
    scaleY: number;
    /** 回転角度（度数法、時計回り） */
    rotation: number;
  };
  
  /** レイヤー順序（大きいほど手前） */
  zIndex: number;
  
  /** アニメーション設定（基本のみ、タイムライン拡張は別JSON予定） */
  animation: {
    /** 初期アニメーション名 */
    name: string;
    /** ループ再生フラグ */
    loop: boolean;
    /** 再生速度倍率（1.0 = 通常速度） */
    speed?: number;
  };
  
  /** インタラクション設定（将来用） */
  interaction?: {
    /** クリックイベント */
    onClick?: {
      type: 'animation' | 'url' | 'custom';
      target: string;
    };
    /** ホバーエフェクト */
    onHover?: {
      scale?: number;
      alpha?: number;
    };
  };
  
  /** 表示設定 */
  display: {
    /** 表示フラグ */
    visible: boolean;
    /** 透明度（0.0-1.0） */
    alpha: number;
    /** ブレンドモード（CSS対応値） */
    blendMode?: string;
  };
  
  /** 将来拡張用メタデータ */
  meta: Record<string, any>;
}

/** プロジェクトの作成用ファクトリー */
export function createEmptyProject(
  homepagePath: string,
  spineAssetsPath: string,
  pageName: string = 'index.html'
): ProjectSchema {
  const now = new Date().toISOString();
  
  return {
    version: 1,
    project: {
      name: 'Untitled Project',
      created: now,
      modified: now,
    },
    page: {
      file: pageName,
      canvas: {
        width: 1280,
        height: 720,
      },
    },
    folders: {
      homepage: homepagePath,
      spineAssets: spineAssetsPath,
    },
    characters: [],
    editor: {
      grid: {
        enabled: true,
        size: 20,
        visible: true,
      },
      preview: {
        backgroundColor: '#f0f0f0',
        showBounds: true,
        showGrid: true,
      },
      autoSaveInterval: 3, // 3分
    },
    meta: {},
  };
}

/** キャラクター追加用ファクトリー */
export function createSpineCharacter(
  id: string,
  spineName: string,
  x: number = 0,
  y: number = 0
): SpineCharacter {
  return {
    id,
    spine: {
      name: spineName,
      skeleton: `${spineName}/${spineName}.json`,
      atlas: `${spineName}/${spineName}.atlas`,
    },
    transform: {
      x,
      y,
      scaleX: 1.0,
      scaleY: 1.0,
      rotation: 0,
    },
    zIndex: 0,
    animation: {
      name: 'idle',
      loop: true,
    },
    display: {
      visible: true,
      alpha: 1.0,
    },
    meta: {},
  };
}