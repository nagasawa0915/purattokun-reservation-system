// 🎯 Spine Editor Desktop - Project Management Module
// プロジェクト管理: 作成・保存・読み込み・エクスポート・バリデーション

console.log('📁 Project Manager Module 読み込み');

/**
 * プロジェクト管理クラス
 * 責任範囲:
 * - プロジェクトファイルの作成・保存・読み込み
 * - フォルダ選択・VFS管理
 * - プロジェクトデータのバリデーション・復元
 * - パッケージエクスポート
 */
class ProjectManager {
    constructor(app) {
        this.app = app;
        console.log('✅ ProjectManager 初期化完了');
    }

    // ========== プロジェクト基本操作 ========== //

    /**
     * 新規プロジェクトを作成
     */
    async newProject() {
        console.log('📝 新規プロジェクト作成');
        
        // 現在の状態をクリア
        this.app.state.project = {
            homePageFolder: null,
            spineCharactersFolder: null,
            name: 'Untitled Project',
            filePath: null
        };
        
        this.app.state.characters.clear();
        this.app.state.selectedCharacter = null;
        
        // UIを更新
        this.app.uiManager.updateProjectStatus();
        this.app.uiManager.updateOutliner();
        this.app.uiManager.updateProperties();
        this.app.uiManager.updateLayers();
        
        console.log('✅ 新規プロジェクト作成完了');
    }

    /**
     * プロジェクトファイルを読み込み
     * @param {string} filePath - 読み込むプロジェクトファイルのパス
     */
    async openProject(filePath) {
        console.log('📂 プロジェクト読み込み:', filePath);
        
        try {
            // ファイルパスが指定されていない場合は選択ダイアログを表示
            if (!filePath && typeof electronAPI !== 'undefined') {
                const result = await electronAPI.showOpenDialog({
                    title: 'Spine Editor Projectファイルを選択',
                    filters: [
                        { name: 'Spine Editor Project', extensions: ['sep'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });
                
                if (result.success && result.filePath) {
                    filePath = result.filePath;
                } else {
                    console.log('📂 プロジェクト読み込みがキャンセルされました');
                    return false;
                }
            }
            
            if (!filePath) {
                console.error('❌ ファイルパスが指定されていません');
                this.app.showNotification('プロジェクトファイルが選択されていません', 'error');
                return false;
            }
            
            console.log('📂 プロジェクトファイル読み込み開始:', filePath);
            
            // プロジェクトファイルを読み込み
            const result = await electronAPI.readFile(filePath);
            if (!result || !result.success) {
                console.error('❌ プロジェクトファイル読み込み失敗:', result?.error);
                this.app.showNotification('プロジェクトファイルの読み込みに失敗しました', 'error');
                return false;
            }
            
            // JSONデータを解析
            let projectData;
            try {
                projectData = JSON.parse(result.content);
            } catch (parseError) {
                console.error('❌ プロジェクトファイルの解析に失敗:', parseError);
                this.app.showNotification('プロジェクトファイルの形式が不正です', 'error');
                return false;
            }
            
            // データ形式をバリデーション
            const validationResult = this.validateProjectData(projectData);
            if (!validationResult.valid) {
                console.error('❌ プロジェクトデータ検証失敗:', validationResult.errors);
                this.app.showNotification(`プロジェクトデータが不正です: ${validationResult.errors.join(', ')}`, 'error');
                return false;
            }
            
            // 既存状態をクリア
            await this.clearCurrentProject();
            
            // プロジェクト情報を復元
            this.restoreProjectInfo(projectData, filePath);
            
            // キャラクターデータを復元
            await this.restoreCharactersData(projectData);
            
            // UI状態を復元
            await this.restoreUIState(projectData);
            
            // Spine統合システムを初期化（キャラクターが存在する場合）
            if (this.app.state.characters.size > 0) {
                await this.app.initializeSpineIntegration();
            }
            
            // UI全体を更新
            this.updateAllUI();
            
            console.log('✅ プロジェクト読み込み完了:', this.app.state.project.name);
            this.app.showNotification(`プロジェクト「${this.app.state.project.name}」を読み込みました`, 'success');
            
            return true;
            
        } catch (error) {
            console.error('❌ プロジェクト読み込みエラー:', error);
            this.app.showNotification(`プロジェクトの読み込み中にエラーが発生しました: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * プロジェクトファイルを保存
     */
    async saveProject() {
        console.log('💾 プロジェクト保存');
        
        try {
            // placements.json形式でデータ作成
            const projectData = this.createProjectData();
            
            console.log('📋 プロジェクトデータ:', projectData);
            
            // 現在のファイルパスがある場合は直接保存、ない場合はダイアログ表示
            let targetFilePath = this.app.state.project.filePath;
            
            if (!targetFilePath && typeof electronAPI !== 'undefined') {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
                const defaultName = `${this.app.state.project.name || 'spine-project'}-${timestamp}.sep`;
                
                const result = await electronAPI.showSaveDialog({
                    title: 'プロジェクトを保存',
                    filters: [
                        { name: 'Spine Editor Project', extensions: ['sep'] },
                        { name: 'All Files', extensions: ['*'] }
                    ],
                    defaultPath: defaultName
                });
                
                if (result.success && result.filePath) {
                    targetFilePath = result.filePath;
                } else {
                    console.log('💾 プロジェクト保存がキャンセルされました');
                    return false;
                }
            }
            
            if (targetFilePath && typeof electronAPI !== 'undefined') {
                return await this.saveProjectToFile(targetFilePath, projectData);
            } else {
                console.warn('⚠️ Electron API が利用できません');
                this.app.showNotification('保存機能が利用できません', 'warning');
                return false;
            }
            
        } catch (error) {
            console.error('❌ プロジェクト保存エラー:', error);
            this.app.showNotification('プロジェクトの保存中にエラーが発生しました', 'error');
            return false;
        }
    }

    /**
     * プロジェクトデータを生成
     */
    createProjectData() {
        const projectData = {
            version: "4.0",
            project: {
                name: this.app.state.project.name || 'Untitled Project',
                homePageFolder: this.app.state.project.homePageFolder,
                spineCharactersFolder: this.app.state.project.spineCharactersFolder,
                createdAt: this.app.state.project.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            characters: {},
            timeline: {
                version: "1.0",
                duration: this.app.state.ui.totalTime,
                tracks: []
            }
        };
        
        // キャラクターデータを変換
        for (const [id, character] of this.app.state.characters) {
            projectData.characters[id] = {
                position: { x: character.x || 18, y: character.y || 49 },
                scale: character.scale || 0.55,
                rotation: character.rotation || 0,
                opacity: character.opacity || 1.0,
                animation: character.animation || 'taiki',
                visible: character.visible !== false,
                locked: character.locked || false,
                // 追加情報
                folderPath: character.folderPath,
                animations: character.animations || []
            };
        }
        
        return projectData;
    }

    /**
     * プロジェクトファイル保存の実際の処理
     * @param {string} filePath - 保存先ファイルパス
     * @param {Object} projectData - 保存するプロジェクトデータ
     */
    async saveProjectToFile(filePath, projectData = null) {
        try {
            if (!projectData) {
                projectData = this.createProjectData();
            }
            
            const jsonContent = JSON.stringify(projectData, null, 2);
            const saveResult = await electronAPI.saveFile(filePath, jsonContent);
            
            if (saveResult.success) {
                this.app.state.project.filePath = filePath;
                this.app.state.project.name = this.extractProjectName(filePath);
                
                console.log('✅ プロジェクト保存成功:', filePath);
                this.app.uiManager.updateProjectStatus();
                this.app.showNotification('プロジェクトを保存しました', 'success');
                
                return true;
            } else {
                console.error('❌ プロジェクト保存失敗:', saveResult.error);
                this.app.showNotification('プロジェクトの保存に失敗しました', 'error');
                return false;
            }
            
        } catch (error) {
            console.error('❌ プロジェクトファイル保存エラー:', error);
            this.app.showNotification(`プロジェクト保存エラー: ${error.message}`, 'error');
            return false;
        }
    }

    // ========== フォルダ選択・VFS ========== //

    /**
     * ホームページフォルダを選択
     */
    async selectHomepageFolder() {
        console.log('🏠 ホームページフォルダ選択');
        
        if (typeof electronAPI === 'undefined') {
            console.error('❌ Electron API が利用できません');
            return;
        }
        
        try {
            const folder = await electronAPI.selectFolder({
                title: 'ホームページフォルダを選択'
            });
            
            if (folder) {
                this.setHomepageFolder(folder);
            }
        } catch (error) {
            console.error('❌ フォルダ選択エラー:', error);
        }
    }

    /**
     * Spineキャラクターフォルダを選択
     */
    async selectSpineFolder() {
        console.log('🎯 Spineキャラクターフォルダ選択');
        
        if (typeof electronAPI === 'undefined') {
            console.error('❌ Electron API が利用できません');
            return;
        }
        
        try {
            const folder = await electronAPI.selectFolder({
                title: 'Spineキャラクターフォルダを選択'
            });
            
            if (folder) {
                this.setSpineFolder(folder);
            }
        } catch (error) {
            console.error('❌ フォルダ選択エラー:', error);
        }
    }

    /**
     * ホームページフォルダを設定
     * @param {string} folder - フォルダパス
     */
    async setHomepageFolder(folder) {
        console.log('🏠 ホームページフォルダ設定:', folder);
        this.app.state.project.homePageFolder = folder;
        this.app.uiManager.updateProjectStatus();
        
        // 🚨 緊急修正: iframe制約によるCanvas作成失敗を回避
        // HTMLプレビュー機能を無効化し、直接Canvas作成方式に変更
        console.log('🎯 HTMLプレビュー無効化 - 直接Canvas作成方式に切り替え');
        this.app.dragDropHandler.initializeDirectPreview();
    }

    /**
     * Spineフォルダを設定
     * @param {string} folder - フォルダパス
     */
    async setSpineFolder(folder) {
        console.log('🎯 Spineフォルダ設定:', folder);
        this.app.state.project.spineCharactersFolder = folder;
        
        // Spineキャラクターを自動検出
        await this.app.characterManager.detectSpineCharacters();
        
        // Spine統合システム初期化
        if (this.app.state.characters.size > 0) {
            await this.app.initializeSpineIntegration();
        }
        
        this.app.uiManager.updateProjectStatus();
        this.app.uiManager.updateOutliner();
    }

    // ========== パッケージエクスポート ========== //

    /**
     * パッケージをエクスポート
     */
    async exportPackage() {
        console.log('📦 パッケージエクスポート');
        
        // レンダラープロセスにエクスポートダイアログ表示イベントを送信
        return await this.showExportPackageDialog();
    }

    /**
     * パッケージエクスポートの実際の処理
     * @param {string} filePath - エクスポート先ファイルパス
     */
    async exportPackageToFile(filePath) {
        try {
            // パッケージエクスポートマネージャー確認
            if (typeof DesktopPackageExportManager === 'undefined') {
                console.error('❌ DesktopPackageExportManager が利用できません');
                this.app.showNotification('エクスポート機能が利用できません', 'error');
                return false;
            }
            
            // パッケージエクスポートマネージャー作成・実行
            const exportManager = new DesktopPackageExportManager(this.app);
            const success = await exportManager.exportPackageToPath(filePath);
            
            if (success) {
                console.log('✅ パッケージエクスポート完了:', filePath);
                this.app.showNotification('パッケージをエクスポートしました', 'success');
                return true;
            } else {
                console.error('❌ パッケージエクスポート失敗');
                this.app.showNotification('パッケージのエクスポートに失敗しました', 'error');
                return false;
            }
            
        } catch (error) {
            console.error('❌ パッケージエクスポートファイルエラー:', error);
            this.app.showNotification(`エクスポートエラー: ${error.message}`, 'error');
            return false;
        }
    }

    // ========== プロフェッショナルダイアログ ========== //

    /**
     * プロフェッショナル保存ダイアログ（プロジェクト専用）
     */
    async showSaveProjectDialog() {
        if (typeof electronAPI === 'undefined') return null;
        
        try {
            console.log('💾 プロジェクト保存ダイアログ表示');
            
            // 履歴付きダイアログを表示
            const recentFiles = await this.getFileHistoryWithPreview('project');
            
            // 保存ダイアログオプション設定
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const defaultName = `${this.app.state.project.name || 'spine-project'}-${timestamp}.sep`;
            
            const result = await electronAPI.showSaveDialog({
                title: 'プロジェクトを保存',
                filters: [
                    { name: 'Spine Editor Project', extensions: ['sep'] },
                    { name: 'All Files', extensions: ['*'] }
                ],
                defaultPath: defaultName
            });
            
            if (result.success && result.filePath) {
                // 実際の保存処理を実行
                return await this.saveProjectToFile(result.filePath);
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ プロジェクト保存ダイアログエラー:', error);
            this.app.showNotification('プロジェクト保存ダイアログでエラーが発生しました', 'error');
            return false;
        }
    }

    /**
     * プロフェッショナル開くダイアログ（プロジェクト専用）
     */
    async showOpenProjectDialog() {
        if (typeof electronAPI === 'undefined') return null;
        
        try {
            console.log('📂 プロジェクト開くダイアログ表示');
            
            // 履歴付きダイアログを表示
            const recentFiles = await this.getFileHistoryWithPreview('project');
            
            const result = await electronAPI.showOpenDialog({
                title: 'プロジェクトを開く',
                filters: [
                    { name: 'Spine Editor Project', extensions: ['sep'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });
            
            if (result.success && result.filePath) {
                return await this.openProject(result.filePath);
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ プロジェクト開くダイアログエラー:', error);
            this.app.showNotification('プロジェクト開くダイアログでエラーが発生しました', 'error');
            return false;
        }
    }

    /**
     * プロフェッショナルエクスポートダイアログ
     */
    async showExportPackageDialog() {
        if (typeof electronAPI === 'undefined') return null;
        
        try {
            console.log('📦 パッケージエクスポートダイアログ表示');
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const defaultName = `${this.app.state.project.name || 'spine-package'}-${timestamp}.zip`;
            
            const result = await electronAPI.showExportDialog({
                title: 'パッケージをエクスポート',
                filters: [
                    { name: 'ZIP Archive', extensions: ['zip'] },
                    { name: 'All Files', extensions: ['*'] }
                ],
                defaultPath: defaultName
            });
            
            if (result.success && result.filePath) {
                return await this.exportPackageToFile(result.filePath);
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ パッケージエクスポートダイアログエラー:', error);
            this.app.showNotification('パッケージエクスポートダイアログでエラーが発生しました', 'error');
            return false;
        }
    }

    // ========== ファイル履歴・関連ファイル ========== //

    /**
     * Phase 2強化：履歴付きファイル情報取得（プロフェッショナル版）
     * @param {string} type - ファイルタイプ（'project' など）
     */
    async getFileHistoryWithPreview(type = 'project') {
        if (typeof electronAPI === 'undefined') return [];
        
        try {
            console.log(`📋 Phase 2履歴取得開始: ${type}`);
            
            // Phase 2: Main processで強化された履歴情報を直接取得
            const enhancedHistory = await electronAPI.getFileHistory(type);
            
            // Phase 2: 既に詳細情報が含まれているため、追加処理は最小限
            const processedHistory = enhancedHistory.map(item => {
                // Phase 2: Dialog Utils APIを使用して表示用文字列を生成
                if (typeof dialogUtilsAPI !== 'undefined') {
                    return {
                        ...item,
                        displaySize: item.sizeFormatted || dialogUtilsAPI.formatFileSize(item.size || 0),
                        displayDate: item.modifiedFormatted || dialogUtilsAPI.formatDate(item.modified),
                        displayIcon: dialogUtilsAPI.getFileTypeIcon(item.extension, item.type),
                        displayStatus: dialogUtilsAPI.generateStatusBadge(item),
                        displaySummary: item.preview ? dialogUtilsAPI.generateProjectSummary(item.preview) : null
                    };
                }
                
                return item;
            });
            
            console.log(`✅ Phase 2履歴取得完了: ${processedHistory.length}件`);
            return processedHistory;
            
        } catch (error) {
            console.error('❌ Phase 2履歴取得エラー:', error);
            return [];
        }
    }

    /**
     * Phase 2追加：関連ファイル表示機能
     * @param {string} filePath - 対象ファイルパス
     */
    async showRelatedFiles(filePath) {
        if (typeof electronAPI === 'undefined') return;
        
        try {
            const relatedFiles = await electronAPI.findRelatedFiles(filePath);
            
            if (relatedFiles.length > 0) {
                console.log(`🔗 関連ファイル発見: ${relatedFiles.length}件`, relatedFiles);
                
                // 将来的にはUIに表示予定
                // Phase 3でリレーションシップビューを実装予定
            }
        } catch (error) {
            console.error('❌ 関連ファイル検索エラー:', error);
        }
    }

    // ========== プロジェクトデータ処理 ========== //

    /**
     * プロジェクトデータバリデーション
     * @param {Object} projectData - 検証するプロジェクトデータ
     * @returns {{valid: boolean, errors: string[]}} 検証結果
     */
    validateProjectData(projectData) {
        const errors = [];
        
        try {
            // 基本構造チェック
            if (!projectData || typeof projectData !== 'object') {
                errors.push('プロジェクトデータが不正です');
                return { valid: false, errors };
            }
            
            // バージョンチェック
            if (!projectData.version) {
                errors.push('バージョン情報がありません');
            } else {
                const version = parseFloat(projectData.version);
                if (isNaN(version) || version < 1.0 || version > 5.0) {
                    errors.push(`サポートされていないバージョンです: ${projectData.version}`);
                }
            }
            
            // プロジェクト情報チェック
            if (!projectData.project || typeof projectData.project !== 'object') {
                errors.push('プロジェクト情報がありません');
            } else {
                const project = projectData.project;
                
                if (!project.name || typeof project.name !== 'string') {
                    errors.push('プロジェクト名が不正です');
                }
                
                // フォルダパスは省略可能だが、文字列である必要がある
                if (project.homePageFolder && typeof project.homePageFolder !== 'string') {
                    errors.push('ホームページフォルダパスが不正です');
                }
                
                if (project.spineCharactersFolder && typeof project.spineCharactersFolder !== 'string') {
                    errors.push('Spineキャラクターフォルダパスが不正です');
                }
                
                // 日付は省略可能
                if (project.createdAt && typeof project.createdAt !== 'string') {
                    errors.push('作成日時が不正です');
                }
                
                if (project.updatedAt && typeof project.updatedAt !== 'string') {
                    errors.push('更新日時が不正です');
                }
            }
            
            // キャラクターデータチェック
            if (!projectData.characters) {
                // キャラクターデータは省略可能
                projectData.characters = {};
            } else if (typeof projectData.characters !== 'object') {
                errors.push('キャラクターデータが不正です');
            } else {
                // 各キャラクターデータを検証
                for (const [characterId, characterData] of Object.entries(projectData.characters)) {
                    const characterErrors = this.validateCharacterData(characterId, characterData);
                    errors.push(...characterErrors);
                }
            }
            
            // タイムラインデータチェック（省略可能）
            if (projectData.timeline) {
                const timelineErrors = this.validateTimelineData(projectData.timeline);
                errors.push(...timelineErrors);
            }
            
        } catch (validationError) {
            errors.push(`バリデーション処理エラー: ${validationError.message}`);
        }
        
        const valid = errors.length === 0;
        
        if (valid) {
            console.log('✅ プロジェクトデータバリデーション成功');
        } else {
            console.log('❌ プロジェクトデータバリデーション失敗:', errors);
        }
        
        return { valid, errors };
    }

    /**
     * キャラクターデータのバリデーション
     * @param {string} characterId - キャラクターID
     * @param {Object} characterData - キャラクターデータ
     * @returns {string[]} エラー配列
     */
    validateCharacterData(characterId, characterData) {
        const errors = [];
        
        if (!characterData || typeof characterData !== 'object') {
            errors.push(`キャラクター "${characterId}" のデータが不正です`);
            return errors;
        }
        
        // 位置情報チェック
        if (characterData.position) {
            const pos = characterData.position;
            if (typeof pos.x !== 'number' || typeof pos.y !== 'number') {
                errors.push(`キャラクター "${characterId}" の位置データが不正です`);
            }
        }
        
        // 数値プロパティチェック
        if (characterData.scale !== undefined && typeof characterData.scale !== 'number') {
            errors.push(`キャラクター "${characterId}" のスケールが不正です`);
        }
        
        if (characterData.rotation !== undefined && typeof characterData.rotation !== 'number') {
            errors.push(`キャラクター "${characterId}" の回転が不正です`);
        }
        
        if (characterData.opacity !== undefined && 
            (typeof characterData.opacity !== 'number' || characterData.opacity < 0 || characterData.opacity > 1)) {
            errors.push(`キャラクター "${characterId}" の透明度が不正です`);
        }
        
        // 文字列プロパティチェック
        if (characterData.animation && typeof characterData.animation !== 'string') {
            errors.push(`キャラクター "${characterId}" のアニメーション名が不正です`);
        }
        
        // ブール値プロパティチェック
        if (characterData.visible !== undefined && typeof characterData.visible !== 'boolean') {
            errors.push(`キャラクター "${characterId}" の表示フラグが不正です`);
        }
        
        if (characterData.locked !== undefined && typeof characterData.locked !== 'boolean') {
            errors.push(`キャラクター "${characterId}" のロックフラグが不正です`);
        }
        
        // アニメーション配列チェック
        if (characterData.animations && !Array.isArray(characterData.animations)) {
            errors.push(`キャラクター "${characterId}" のアニメーション一覧が不正です`);
        }
        
        return errors;
    }

    /**
     * タイムラインデータのバリデーション
     * @param {Object} timeline - タイムラインデータ
     * @returns {string[]} エラー配列
     */
    validateTimelineData(timeline) {
        const errors = [];
        
        if (typeof timeline !== 'object') {
            errors.push('タイムラインデータが不正です');
            return errors;
        }
        
        if (timeline.duration !== undefined && typeof timeline.duration !== 'number') {
            errors.push('タイムライン継続時間が不正です');
        }
        
        if (timeline.tracks && !Array.isArray(timeline.tracks)) {
            errors.push('タイムライントラックが不正です');
        }
        
        return errors;
    }

    /**
     * 現在のプロジェクトをクリア
     */
    async clearCurrentProject() {
        console.log('🧹 現在のプロジェクト状態をクリア');
        
        try {
            // Spine統合システムのクリーンアップ
            if (this.app.spineIntegration) {
                await this.app.spineIntegration.cleanup();
                this.app.spineIntegration = null;
            }
            
            // 状態をリセット
            this.app.state.project = {
                homePageFolder: null,
                spineCharactersFolder: null,
                name: null,
                filePath: null
            };
            
            this.app.state.characters.clear();
            this.app.state.selectedCharacter = null;
            
            this.app.state.ui = {
                isPlaying: false,
                currentTime: 0,
                totalTime: 10000,
                zoomLevel: 1.0
            };
            
            // VFSキャッシュをクリア
            this.app.state.vfs.blobCache.clear();
            this.app.state.vfs.characterAssets.clear();
            
            console.log('✅ プロジェクト状態クリア完了');
            
        } catch (error) {
            console.error('❌ プロジェクト状態クリア中にエラー:', error);
            throw error;
        }
    }

    /**
     * プロジェクト情報を復元
     * @param {Object} projectData - プロジェクトデータ
     * @param {string} filePath - プロジェクトファイルパス
     */
    restoreProjectInfo(projectData, filePath) {
        console.log('📋 プロジェクト情報復元開始');
        
        try {
            const project = projectData.project || {};
            
            this.app.state.project = {
                name: project.name || 'Untitled Project',
                homePageFolder: project.homePageFolder || null,
                spineCharactersFolder: project.spineCharactersFolder || null,
                filePath: filePath,
                createdAt: project.createdAt || null,
                updatedAt: project.updatedAt || null
            };
            
            // UI状態の一部を復元
            if (projectData.timeline && projectData.timeline.duration) {
                this.app.state.ui.totalTime = projectData.timeline.duration;
            }
            
            console.log('✅ プロジェクト情報復元完了:', this.app.state.project.name);
            
        } catch (error) {
            console.error('❌ プロジェクト情報復元エラー:', error);
            throw error;
        }
    }

    /**
     * キャラクターデータを復元
     * @param {Object} projectData - プロジェクトデータ
     */
    async restoreCharactersData(projectData) {
        console.log('🎭 キャラクターデータ復元開始');
        
        try {
            const characters = projectData.characters || {};
            
            for (const [characterId, characterData] of Object.entries(characters)) {
                console.log(`📂 キャラクター復元: ${characterId}`);
                
                // キャラクターデータを正規化
                const restoredCharacter = this.normalizeCharacterData(characterId, characterData);
                
                // キャラクターをMapに登録
                this.app.state.characters.set(characterId, restoredCharacter);
                
                // Spineファイルが指定されていない場合、フォルダから自動検出を試行
                if (!restoredCharacter.spineFiles && this.app.state.project.spineCharactersFolder) {
                    await this.tryRestoreSpineFiles(characterId, restoredCharacter);
                }
                
                // アニメーション一覧が空の場合、Spineファイルから読み込み
                if (restoredCharacter.animations.length === 0 && restoredCharacter.spineFiles) {
                    await this.app.characterManager.loadCharacterAnimations(characterId);
                }
            }
            
            console.log(`✅ キャラクターデータ復元完了: ${this.app.state.characters.size}体`);
            
        } catch (error) {
            console.error('❌ キャラクターデータ復元エラー:', error);
            throw error;
        }
    }

    /**
     * キャラクターデータの正規化
     * @param {string} characterId - キャラクターID
     * @param {Object} characterData - 元のキャラクターデータ
     * @returns {Object} 正規化されたキャラクターデータ
     */
    normalizeCharacterData(characterId, characterData) {
        return {
            id: characterId,
            name: characterId,
            // 位置情報
            x: characterData.position ? characterData.position.x : 18,
            y: characterData.position ? characterData.position.y : 49,
            // トランスフォーム
            scale: characterData.scale !== undefined ? characterData.scale : 0.55,
            rotation: characterData.rotation !== undefined ? characterData.rotation : 0,
            opacity: characterData.opacity !== undefined ? characterData.opacity : 1.0,
            // アニメーション
            animation: characterData.animation || 'taiki',
            animations: characterData.animations || [],
            // 状態フラグ
            visible: characterData.visible !== false,
            locked: characterData.locked || false,
            // ファイルパス（保存されていた場合）
            folderPath: characterData.folderPath || null,
            spineFiles: characterData.spineFiles || null
        };
    }

    /**
     * Spineファイル自動検出を試行
     * @param {string} characterId - キャラクターID
     * @param {Object} character - キャラクターデータ
     */
    async tryRestoreSpineFiles(characterId, character) {
        try {
            if (!this.app.state.project.spineCharactersFolder) {
                return;
            }
            
            // Electron APIを使用してファイル構造を確認
            if (typeof electronAPI !== 'undefined') {
                // characters/<characterName>/ の構造を仮定
                const characterPath = `${this.app.state.project.spineCharactersFolder}/${characterId}`;
                
                try {
                    const items = await electronAPI.listDirectory(characterPath);
                    
                    // Spineファイルを検出
                    let jsonFile = null, atlasFile = null;
                    for (const item of items) {
                        if (!item.isDirectory) {
                            if (item.name.endsWith('.json')) {
                                jsonFile = item.path;
                            } else if (item.name.endsWith('.atlas')) {
                                atlasFile = item.path;
                            }
                        }
                    }
                    
                    if (jsonFile && atlasFile) {
                        character.folderPath = characterPath;
                        character.spineFiles = {
                            json: jsonFile,
                            atlas: atlasFile
                        };
                        console.log(`✅ ${characterId} のSpineファイルを自動検出:`, character.spineFiles);
                    }
                } catch (dirError) {
                    console.warn(`⚠️ ${characterId} のディレクトリ確認に失敗:`, dirError);
                }
            }
            
            // spineAPI が利用可能な場合の高度な解析
            if (typeof spineAPI !== 'undefined' && character.folderPath) {
                const analysis = await spineAPI.analyzeSpineStructure(character.folderPath);
                if (analysis.success && analysis.spineFiles.json && analysis.spineFiles.atlas) {
                    character.spineFiles = analysis.spineFiles;
                    console.log(`✅ ${characterId} のSpineファイル詳細解析完了:`, analysis.spineFiles);
                }
            }
            
        } catch (error) {
            console.warn(`⚠️ ${characterId} のSpineファイル自動検出に失敗:`, error);
        }
    }

    /**
     * UI状態を復元
     * @param {Object} projectData - プロジェクトデータ
     */
    async restoreUIState(projectData) {
        console.log('🖥️ UI状態復元開始');
        
        try {
            // 最初のキャラクターを選択状態にする（存在する場合）
            if (this.app.state.characters.size > 0) {
                const firstCharacterId = this.app.state.characters.keys().next().value;
                this.app.state.selectedCharacter = firstCharacterId;
                console.log('🎯 初期選択キャラクター:', firstCharacterId);
            }
            
            // タイムライン状態の復元
            if (projectData.timeline) {
                if (projectData.timeline.duration) {
                    this.app.state.ui.totalTime = projectData.timeline.duration;
                }
                // その他のタイムライン状態があれば復元
            }
            
            console.log('✅ UI状態復元完了');
            
        } catch (error) {
            console.error('❌ UI状態復元エラー:', error);
            // UI状態の復元エラーは致命的ではないので、エラーをログに記録するだけ
        }
    }

    /**
     * UI全体を更新
     */
    updateAllUI() {
        console.log('🔄 UI全体更新開始');
        
        try {
            this.app.uiManager.updateProjectStatus();
            this.app.uiManager.updateOutliner();
            this.app.uiManager.updateProperties();
            this.app.uiManager.updateLayers();
            this.app.uiManager.updatePreviewDisplay();
            
            console.log('✅ UI全体更新完了');
            
        } catch (error) {
            console.error('❌ UI更新エラー:', error);
            // UI更新エラーは致命的ではないが、ユーザーに通知
            this.app.showNotification('UI更新中にエラーが発生しました', 'warning');
        }
    }

    // ========== ユーティリティ ========== //

    /**
     * プロジェクト名をファイルパスから抽出
     * @param {string} filePath - ファイルパス
     * @returns {string} プロジェクト名
     */
    extractProjectName(filePath) {
        try {
            const fileName = filePath.split(/[/\\]/).pop();
            const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
            return nameWithoutExt;
        } catch (error) {
            return 'Unknown Project';
        }
    }
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectManager;
}

// Global registration
window.ProjectManager = ProjectManager;

console.log('✅ Project Manager Module 読み込み完了');