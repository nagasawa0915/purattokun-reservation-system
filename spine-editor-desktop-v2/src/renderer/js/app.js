/**
 * Spine Editor Desktop v2.0 - Main Application (Modularized)
 * モジュール統合制御
 */

import { SpineEditorCore } from './app-core.js';

/**
 * モジュール化されたSpine Editorアプリケーション
 */
class SpineEditorApp {
  constructor() {
    // コアシステム初期化
    this.core = new SpineEditorCore();
    
    // コアシステムのプロパティを継承
    this.currentProject = null;
    this.isProjectModified = false;
    this.selectedCharacter = null;
    
    // モジュール参照（コアから継承）
    this.ui = null;
    this.spine = null;
    this.exporter = null;
    
    // 内部モジュール参照（コアから継承）
    this.eventHandler = null;
    this.fileManager = null;
    this.utils = null;
    
    // デバッグ情報
    this.debug = { mousePos: { x: 0, y: 0 } };
    
    // 自動保存インターバル
    this.autoSaveInterval = null;
    
    // 初期化
    this.init();
  }

  /**
   * アプリケーション初期化（コアに移譲）
   */
  async init() {
    try {
      // コア初期化
      await this.core.init();
      
      // プロパティ同期
      this.syncWithCore();
      
    } catch (error) {
      console.error('❌ Failed to initialize modularized Spine Editor:', error);
      throw error;
    }
  }

  /**
   * コアシステムとのプロパティ同期
   */
  syncWithCore() {
    // コアからプロパティを同期
    this.currentProject = this.core.currentProject;
    this.isProjectModified = this.core.isProjectModified;
    this.selectedCharacter = this.core.selectedCharacter;
    
    // モジュール参照を同期
    this.ui = this.core.ui;
    this.spine = this.core.spine;
    this.exporter = this.core.exporter;
    
    // 内部モジュール参照を同期
    this.eventHandler = this.core.eventHandler;
    this.fileManager = this.core.fileManager;
    this.utils = this.core.utils;
    
    // デバッグ情報を同期
    this.debug = this.core.debug;
    this.autoSaveInterval = this.core.autoSaveInterval;
    this.homepageFolder = this.core.homepageFolder;
  }

  /**
   * プロパティ更新時の同期処理
   */
  updateProjectState(updates) {
    Object.assign(this.core, updates);
    this.syncWithCore();
  }

  /**
   * 主要メソッドをコアに移譲
   */
  async openProject() {
    const result = await this.core.openProject();
    this.syncWithCore();
    return result;
  }

  async saveProject() {
    const result = await this.core.saveProject();
    this.syncWithCore();
    return result;
  }

  async exportPackage() {
    const result = await this.core.exportPackage();
    this.syncWithCore();
    return result;
  }

  selectCharacter(index) {
    const result = this.core.selectCharacter(index);
    this.syncWithCore();
    return result;
  }

  markProjectModified() {
    this.core.markProjectModified();
    this.syncWithCore();
  }

  async loadProject(projectData, filePath) {
    const result = await this.core.loadProject(projectData, filePath);
    this.syncWithCore();
    return result;
  }

  /**
   * 破棄処理
   */
  destroy() {
    if (this.core) {
      this.core.destroy();
    }
    
    // console.log('🔚 Modularized Spine Editor v2.0 destroyed');
  }
}

// アプリケーション起動
let app;

document.addEventListener('DOMContentLoaded', () => {
  // CDN読み込み完了を待ってから初期化（マニュアル準拠）
  setTimeout(() => {
    console.log('🚀 アプリケーション初期化開始 - CDN読み込み待機後');
    app = new SpineEditorApp();
  }, 1000); // 1秒待機でCDN読み込み確保
});

window.addEventListener('beforeunload', () => {
  if (app) {
    app.destroy();
  }
});