/**
 * プロジェクトローダーモジュール
 * フォルダ選択、ファイル管理、localStorage連携を担当
 */

import { Utils } from './utils.js';

export class ProjectLoader {
    constructor() {
        this.currentProject = null;
        this.savedPaths = {
            project: localStorage.getItem('spine-editor-project-path'),
            spine: localStorage.getItem('spine-editor-spine-path')
        };
    }

    /**
     * 保存されたパス自動読み込み
     */
    async loadSavedPaths() {
        console.log('🔧 localStorage状態確認:');
        console.log('  - project:', localStorage.getItem('spine-editor-project-path'));
        console.log('  - spine:', localStorage.getItem('spine-editor-spine-path'));
        console.log('🔧 this.savedPaths:', this.savedPaths);
        
        if (this.savedPaths.project) {
            console.log('🔄 Auto-loading saved project path:', this.savedPaths.project);
            // プロジェクトパスを自動設定（ファイル一覧は表示しない）
            this.currentProject = this.savedPaths.project;
        }
        
        if (this.savedPaths.spine) {
            console.log('🔄 Auto-loading saved spine path:', this.savedPaths.spine);
            // Spineパスから自動検出（UI更新は行わない、次回のボタンクリック時に使用）
        }
    }

    /**
     * プロジェクトフォルダを開く
     * @returns {object} 結果オブジェクト {success, path, files, canceled, error}
     */
    async openFolder() {
        console.log('📁 プロジェクトフォルダを選択中...');
        
        // 詳細デバッグ: localStorage直接確認
        const directProject = localStorage.getItem('spine-editor-project-path');
        console.log('🔧 localStorage直接確認 project:', directProject);
        console.log('🔧 this.savedPaths.project:', this.savedPaths.project);
        console.log('🔧 値が同じか:', directProject === this.savedPaths.project);
        
        try {
            // 保存されたパスを初期フォルダとして使用（有効な場合のみ）
            const initialPath = this.savedPaths.project || null;
            console.log('🔧 Project initial path:', initialPath);
            console.log('🔧 initialPathタイプ:', typeof initialPath, '長さ:', initialPath?.length);
            
            const result = await window.projectLoader.selectFolder(initialPath);
            
            if (result.success) {
                this.currentProject = result.path;
                
                // プロジェクトパスを保存
                localStorage.setItem('spine-editor-project-path', result.path);
                console.log('💾 Project path saved:', result.path);
                
                // this.savedPathsも更新
                this.savedPaths.project = result.path;
                console.log('🔄 this.savedPaths.project updated:', this.savedPaths.project);
                
                // サーバーにプロジェクトパスを設定
                if (window.electronAPI && window.electronAPI.server) {
                    const serverResult = await window.electronAPI.server.setProjectPath(result.path);
                    console.log('🔧 Server project path set:', serverResult);
                }
                
                return {
                    success: true,
                    path: result.path,
                    files: result.files
                };
            } else if (result.canceled) {
                return {
                    success: false,
                    canceled: true,
                    message: 'フォルダ選択がキャンセルされました'
                };
            } else {
                return {
                    success: false,
                    error: 'フォルダ選択に失敗しました'
                };
            }
        } catch (error) {
            console.error('❌ フォルダ選択エラー:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * プロジェクトファイルを処理
     * @param {Array} files - ファイルリスト
     * @returns {Array} 処理されたHTMLファイルリスト
     */
    processProjectFiles(files) {
        console.log('🔧 loadProjectFiles受信:', files);
        console.log('🔧 最初のファイルサンプル:', files[0]);
        
        // ファイル形式を安全にチェック（より寛容な判定）
        const safeFiles = files.filter(f => {
            if (!f) {
                console.log('🔧 Null file detected');
                return false;
            }
            
            // nameプロパティまたはpathプロパティを取得
            const name = f.name || f.path || f.toString();
            
            if (!name || typeof name !== 'string') {
                console.log('🔧 Invalid name for file:', f);
                return false;
            }
            
            const isHTML = name.toLowerCase().endsWith('.html') || name.toLowerCase().endsWith('.htm');
            return isHTML;
        });
        
        console.log('🔧 安全なHTMLファイル:', safeFiles.length, '個');
        console.log('🎯 プロジェクトファイル読み込み完了:', safeFiles.length, '個');
        
        return safeFiles;
    }

    /**
     * ファイルを階層別に整理
     * @param {Array} files - ファイルリスト
     * @returns {object} 階層化されたファイル構造
     */
    organizeFilesHierarchy(files) {
        const hierarchy = {
            root: [],
            folders: {}
        };
        
        files.forEach(file => {
            const path = file.path || file.name || '';
            const pathParts = path.split(/[\/\\]/);
            
            if (pathParts.length === 1) {
                // ルート直下のファイル
                hierarchy.root.push(file);
            } else {
                // サブフォルダ内のファイル
                const topLevelFolder = pathParts[0];
                if (!hierarchy.folders[topLevelFolder]) {
                    hierarchy.folders[topLevelFolder] = [];
                }
                hierarchy.folders[topLevelFolder].push(file);
            }
        });
        
        return hierarchy;
    }

    /**
     * 現在のプロジェクトパスを取得
     * @returns {string|null} プロジェクトパス
     */
    getCurrentProject() {
        return this.currentProject;
    }

    /**
     * 保存されたパスを取得
     * @returns {object} 保存されたパス情報
     */
    getSavedPaths() {
        return { ...this.savedPaths };
    }

    /**
     * プロジェクトパスを設定
     * @param {string} path - プロジェクトパス
     */
    setCurrentProject(path) {
        this.currentProject = path;
        localStorage.setItem('spine-editor-project-path', path);
        this.savedPaths.project = path;
        console.log('🔄 Project path updated:', path);
    }

    /**
     * Spineパスを設定
     * @param {string} path - Spineパス
     */
    setSpinePath(path) {
        localStorage.setItem('spine-editor-spine-path', path);
        this.savedPaths.spine = path;
        console.log('🔄 Spine path updated:', path);
    }

    /**
     * 保存されたパスをクリア
     * @param {string} type - クリアするパスタイプ（'project' | 'spine' | 'all'）
     */
    clearSavedPaths(type = 'all') {
        switch (type) {
            case 'project':
                localStorage.removeItem('spine-editor-project-path');
                this.savedPaths.project = null;
                this.currentProject = null;
                console.log('🧹 Project path cleared');
                break;
            case 'spine':
                localStorage.removeItem('spine-editor-spine-path');
                this.savedPaths.spine = null;
                console.log('🧹 Spine path cleared');
                break;
            case 'all':
                localStorage.removeItem('spine-editor-project-path');
                localStorage.removeItem('spine-editor-spine-path');
                this.savedPaths.project = null;
                this.savedPaths.spine = null;
                this.currentProject = null;
                console.log('🧹 All paths cleared');
                break;
        }
    }

    /**
     * プロジェクト設定をエクスポート
     * @returns {object} プロジェクト設定
     */
    exportSettings() {
        return {
            currentProject: this.currentProject,
            savedPaths: { ...this.savedPaths },
            timestamp: Date.now()
        };
    }

    /**
     * プロジェクト設定をインポート
     * @param {object} settings - プロジェクト設定
     * @returns {boolean} インポート成功可否
     */
    importSettings(settings) {
        try {
            if (settings.currentProject) {
                this.setCurrentProject(settings.currentProject);
            }
            if (settings.savedPaths) {
                if (settings.savedPaths.project) {
                    this.setCurrentProject(settings.savedPaths.project);
                }
                if (settings.savedPaths.spine) {
                    this.setSpinePath(settings.savedPaths.spine);
                }
            }
            console.log('✅ プロジェクト設定インポート完了');
            return true;
        } catch (error) {
            console.error('❌ プロジェクト設定インポートエラー:', error);
            return false;
        }
    }

    /**
     * プロジェクトの有効性をチェック
     * @param {string} projectPath - プロジェクトパス
     * @returns {Promise<boolean>} 有効かどうか
     */
    async validateProject(projectPath) {
        try {
            if (!projectPath) return false;
            
            // Electron API経由でパスの存在確認
            if (window.electronAPI && window.electronAPI.fs) {
                const result = await window.electronAPI.fs.pathExists(projectPath);
                return result.exists;
            }
            
            return false;
        } catch (error) {
            console.error('❌ プロジェクト検証エラー:', error);
            return false;
        }
    }

    /**
     * 最近使用したプロジェクトリストを管理
     */
    addToRecentProjects(projectPath) {
        const recent = Utils.storage.get('recent-projects', []);
        const filtered = recent.filter(p => p !== projectPath);
        filtered.unshift(projectPath);
        
        // 最大10件まで保持
        const trimmed = filtered.slice(0, 10);
        Utils.storage.set('recent-projects', trimmed);
        
        console.log('📝 Recent projects updated:', trimmed);
    }

    getRecentProjects() {
        return Utils.storage.get('recent-projects', []);
    }
}