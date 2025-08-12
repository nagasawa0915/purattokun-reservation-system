// 🎯 Spine Editor Desktop - UI Manager Module
// UI更新・イベント処理・パネル管理

console.log('🖥️ UI Manager Module 読み込み');

/**
 * UI管理クラス
 * 責任範囲:
 * - UI要素の更新・描画
 * - イベントリスナーの管理
 * - パネル・ダイアログの制御
 * - 通知システム
 */
class UIManager {
    constructor(app) {
        this.app = app;
        console.log('✅ UIManager 初期化完了');
    }

    // ========== UI更新メソッド ========== //

    /**
     * プロジェクト状態を更新
     */
    updateProjectStatus() {
        const statusEl = document.getElementById('project-status');
        if (!statusEl) return;
        
        const { project } = this.app.state;
        let status = 'プロジェクト未設定';
        
        if (project.name) {
            status = project.name;
            if (project.homePageFolder && project.spineCharactersFolder) {
                status += ' (設定完了)';
            } else if (project.homePageFolder || project.spineCharactersFolder) {
                status += ' (設定中...)';
            } else {
                status += ' (未設定)';
            }
        }
        
        statusEl.textContent = status;
    }

    /**
     * アウトライナーを更新
     */
    updateOutliner() {
        const treeEl = document.getElementById('project-tree');
        if (!treeEl) return;
        
        // 既存コンテンツをクリア
        treeEl.innerHTML = '';
        
        if (this.app.state.characters.size === 0) {
            treeEl.innerHTML = this.getWelcomeMessageHTML();
            return;
        }
        
        // プロジェクト階層を構築
        this.buildProjectHierarchy(treeEl);
        
        // キャラクター一覧を追加
        this.buildCharacterList(treeEl);
    }

    /**
     * ウェルカムメッセージHTMLを取得
     * @returns {string} HTML文字列
     */
    getWelcomeMessageHTML() {
        return `
            <div class="tree-item welcome-message">
                <span>🎯 プロジェクトフォルダを選択してください</span>
                <br><br>
                <small>
                1. 「🏠 ホームページ」ボタンでWebサイトのルートフォルダを選択<br>
                2. 「🎯 Spine」ボタンでキャラクターフォルダを選択
                </small>
            </div>
        `;
    }

    /**
     * プロジェクト階層を構築
     * @param {HTMLElement} treeEl - ツリー要素
     */
    buildProjectHierarchy(treeEl) {
        const projectRoot = document.createElement('div');
        projectRoot.className = 'tree-item project-root';
        projectRoot.innerHTML = `📁 ${this.app.state.project.name || 'Project'}`;
        treeEl.appendChild(projectRoot);
    }

    /**
     * キャラクター一覧を構築
     * @param {HTMLElement} treeEl - ツリー要素
     */
    buildCharacterList(treeEl) {
        // キャラクター一覧ヘッダー
        const charactersRoot = document.createElement('div');
        charactersRoot.className = 'tree-item characters-root';
        charactersRoot.innerHTML = `📚 Characters (${this.app.state.characters.size})`;
        treeEl.appendChild(charactersRoot);
        
        // 各キャラクター
        for (const [id, character] of this.app.state.characters) {
            this.addCharacterToOutliner(treeEl, id, character);
        }
    }

    /**
     * キャラクターをアウトライナーに追加
     * @param {HTMLElement} treeEl - ツリー要素
     * @param {string} id - キャラクターID
     * @param {Object} character - キャラクターデータ
     */
    addCharacterToOutliner(treeEl, id, character) {
        const charEl = document.createElement('div');
        charEl.className = 'tree-item character-item';
        charEl.dataset.characterId = id;
        charEl.innerHTML = `🎭 ${character.name}`;
        
        // ドラッグ&ドロップ機能を設定
        this.app.dragDropHandler.setupOutlinerDragEvents(charEl, character, id);
        
        // 選択状態の反映
        if (this.app.state.selectedCharacter === id) {
            charEl.classList.add('selected');
        }
        
        treeEl.appendChild(charEl);
        
        // アニメーション一覧を追加
        this.addAnimationListToOutliner(treeEl, id, character);
    }

    /**
     * アニメーション一覧をアウトライナーに追加
     * @param {HTMLElement} treeEl - ツリー要素
     * @param {string} id - キャラクターID
     * @param {Object} character - キャラクターデータ
     */
    addAnimationListToOutliner(treeEl, id, character) {
        if (character.animations.length > 0) {
            for (const anim of character.animations) {
                const animEl = document.createElement('div');
                animEl.className = 'tree-item animation-item';
                animEl.dataset.characterId = id;
                animEl.dataset.animation = anim;
                animEl.innerHTML = `　🎬 ${anim}`;
                animEl.style.marginLeft = '20px';
                treeEl.appendChild(animEl);
            }
        }
    }

    /**
     * プロパティパネルを更新
     */
    updateProperties() {
        const character = this.app.state.selectedCharacter ? 
            this.app.state.characters.get(this.app.state.selectedCharacter) : null;
        
        const transformSection = document.getElementById('transform-section');
        const animationSection = document.getElementById('animation-section');
        
        if (character) {
            this.updatePropertiesWithCharacter(character, transformSection, animationSection);
        } else {
            this.updatePropertiesWithoutCharacter(transformSection, animationSection);
        }
        
        this.updateOpacityDisplay(character);
    }

    /**
     * キャラクターが選択されている場合のプロパティ更新
     * @param {Object} character - 選択中のキャラクター
     * @param {HTMLElement} transformSection - トランスフォームセクション
     * @param {HTMLElement} animationSection - アニメーションセクション
     */
    updatePropertiesWithCharacter(character, transformSection, animationSection) {
        // プロパティ値を設定
        this.setPropertyValue('pos-x', character.x);
        this.setPropertyValue('pos-y', character.y);
        this.setPropertyValue('scale', character.scale);
        this.setPropertyValue('rotation', character.rotation);
        this.setPropertyValue('opacity', character.opacity);
        
        // アニメーション選択肢を更新
        this.updateAnimationSelect(character);
        
        // セクションを表示・有効化
        this.enableSection(transformSection);
        this.enableSection(animationSection);
        
        // 選択情報表示
        this.updateSelectionInfo(`${character.name} が選択されています`);
    }

    /**
     * キャラクターが未選択の場合のプロパティ更新
     * @param {HTMLElement} transformSection - トランスフォームセクション
     * @param {HTMLElement} animationSection - アニメーションセクション
     */
    updatePropertiesWithoutCharacter(transformSection, animationSection) {
        // セクションを非表示・無効化
        this.disableSection(transformSection);
        this.disableSection(animationSection);
        
        // 未選択メッセージ表示
        this.updateSelectionInfo('キャラクターが選択されていません');
    }

    /**
     * アニメーション選択を更新
     * @param {Object} character - キャラクターデータ
     */
    updateAnimationSelect(character) {
        const animSelect = document.getElementById('animation-select');
        if (animSelect && character.animations) {
            animSelect.innerHTML = '<option value="">選択してください</option>';
            for (const anim of character.animations) {
                const option = document.createElement('option');
                option.value = anim;
                option.textContent = anim;
                option.selected = anim === character.animation;
                animSelect.appendChild(option);
            }
        }
    }

    /**
     * セクションを有効化
     * @param {HTMLElement} section - 対象セクション
     */
    enableSection(section) {
        if (section) {
            section.style.display = 'block';
            section.querySelectorAll('input, select').forEach(el => el.disabled = false);
        }
    }

    /**
     * セクションを無効化
     * @param {HTMLElement} section - 対象セクション
     */
    disableSection(section) {
        if (section) {
            section.style.display = 'none';
        }
    }

    /**
     * 選択情報を更新
     * @param {string} text - 表示テキスト
     */
    updateSelectionInfo(text) {
        const noSelection = document.querySelector('.no-selection');
        if (noSelection) {
            noSelection.textContent = text;
        }
    }

    /**
     * 不透明度表示を更新
     * @param {Object|null} character - キャラクターデータ
     */
    updateOpacityDisplay(character) {
        const opacityValue = document.getElementById('opacity-value');
        if (opacityValue && character) {
            opacityValue.textContent = Math.round((character.opacity || 1.0) * 100) + '%';
        }
    }

    /**
     * レイヤーパネルを更新
     */
    updateLayers() {
        const layersEl = document.getElementById('layers-list');
        if (!layersEl) return;
        
        layersEl.innerHTML = '';
        
        if (this.app.state.characters.size === 0) {
            layersEl.innerHTML = this.getEmptyLayersHTML();
            return;
        }
        
        // キャラクター順序でレイヤー表示
        for (const [id, character] of this.app.state.characters) {
            this.addLayerItem(layersEl, id, character);
        }
    }

    /**
     * 空のレイヤーHTMLを取得
     * @returns {string} HTML文字列
     */
    getEmptyLayersHTML() {
        return `
            <div class="layer-item placeholder">
                <span>レイヤーがありません</span>
                <small>キャラクターを追加するとレイヤーが作成されます</small>
            </div>
        `;
    }

    /**
     * レイヤーアイテムを追加
     * @param {HTMLElement} layersEl - レイヤー要素
     * @param {string} id - キャラクターID
     * @param {Object} character - キャラクターデータ
     */
    addLayerItem(layersEl, id, character) {
        const layerEl = document.createElement('div');
        layerEl.className = 'layer-item';
        layerEl.dataset.characterId = id;
        
        if (this.app.state.selectedCharacter === id) {
            layerEl.classList.add('selected');
        }
        
        layerEl.innerHTML = `
            <span class="layer-visibility" data-character="${id}">👁️</span>
            <span class="layer-lock" data-character="${id}">🔓</span>
            <span class="layer-name">${character.name}</span>
        `;
        
        layersEl.appendChild(layerEl);
    }

    /**
     * プレビュー表示を更新
     */
    updatePreviewDisplay() {
        this.app.dragDropHandler.updatePreviewDisplay();
    }

    // ========== イベント処理 ========== //

    /**
     * プロパティイベントをバインド
     */
    bindPropertyEvents() {
        const posX = document.getElementById('pos-x');
        const posY = document.getElementById('pos-y');
        const scale = document.getElementById('scale');
        const rotation = document.getElementById('rotation');
        const opacity = document.getElementById('opacity');
        
        if (posX) posX.addEventListener('input', (e) => this.app.characterManager.updateCharacterProperty('x', parseFloat(e.target.value)));
        if (posY) posY.addEventListener('input', (e) => this.app.characterManager.updateCharacterProperty('y', parseFloat(e.target.value)));
        if (scale) scale.addEventListener('input', (e) => this.app.characterManager.updateCharacterProperty('scale', parseFloat(e.target.value)));
        if (rotation) rotation.addEventListener('input', (e) => this.app.characterManager.updateCharacterProperty('rotation', parseFloat(e.target.value)));
        if (opacity) {
            opacity.addEventListener('input', (e) => {
                this.app.characterManager.updateCharacterProperty('opacity', parseFloat(e.target.value));
                document.getElementById('opacity-value').textContent = Math.round(e.target.value * 100) + '%';
            });
        }
        
        // アニメーション選択
        const animSelect = document.getElementById('animation-select');
        if (animSelect) {
            animSelect.addEventListener('change', (e) => this.app.characterManager.updateCharacterProperty('animation', e.target.value));
        }
    }

    /**
     * レイヤーイベントをバインド
     */
    bindLayerEvents() {
        document.getElementById('add-layer')?.addEventListener('click', () => this.app.characterManager.addLayer());
        document.getElementById('delete-layer')?.addEventListener('click', () => this.app.characterManager.deleteLayer());
    }

    /**
     * アウトライナーイベントをバインド
     */
    bindOutlinerEvents() {
        // 動的に追加される要素用のイベント委任
        document.getElementById('project-tree')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('character-item')) {
                this.app.characterManager.selectCharacter(e.target.dataset.characterId);
            } else if (e.target.classList.contains('animation-item')) {
                this.app.characterManager.previewAnimation(e.target.dataset.characterId, e.target.dataset.animation);
            }
        });
    }

    // ========== タイムライン制御 ========== //

    /**
     * タイムライン再生
     */
    playTimeline() {
        console.log('▶️ タイムライン再生');
        this.app.state.ui.isPlaying = !this.app.state.ui.isPlaying;
        const btn = document.getElementById('play-timeline');
        if (btn) {
            btn.textContent = this.app.state.ui.isPlaying ? '⏸️ 一時停止' : '▶️ 再生';
        }
    }

    /**
     * タイムライン停止
     */
    stopTimeline() {
        console.log('⏹️ タイムライン停止');
        this.app.state.ui.isPlaying = false;
        this.app.state.ui.currentTime = 0;
        const btn = document.getElementById('play-timeline');
        if (btn) {
            btn.textContent = '▶️ 再生';
        }
    }

    /**
     * 再生切り替え
     */
    togglePlayback() {
        this.playTimeline();
    }

    // ========== 通知システム ========== //

    /**
     * 通知を表示
     * @param {string} message - 通知メッセージ
     * @param {string} type - 通知タイプ（'info', 'success', 'warning', 'error'）
     */
    showNotification(message, type = 'info') {
        console.log(`📢 [${type.toUpperCase()}] ${message}`);
        
        // 簡易通知実装（ステータスバーに表示）
        const statusElement = document.getElementById('selection-info');
        if (statusElement) {
            const originalText = statusElement.textContent;
            statusElement.textContent = `${message}`;
            
            // スタイル適用
            statusElement.className = `notification notification-${type}`;
            
            // 3秒後に元に戻す
            setTimeout(() => {
                statusElement.textContent = originalText;
                statusElement.className = '';
            }, 3000);
        }
        
        // Phase 2以降で本格的な通知システムを実装予定
        // - トースト通知
        // - ダイアログ表示
        // - アニメーション効果
    }

    /**
     * 確認ダイアログを表示
     * @param {string} message - 確認メッセージ
     * @param {string} title - ダイアログタイトル
     * @returns {boolean} ユーザーの選択結果
     */
    showConfirmDialog(message, title = '確認') {
        return confirm(`${title}\n\n${message}`);
    }

    /**
     * 情報ダイアログを表示
     * @param {string} message - 情報メッセージ
     * @param {string} title - ダイアログタイトル
     */
    showInfoDialog(message, title = '情報') {
        alert(`${title}\n\n${message}`);
    }

    // ========== ユーティリティ ========== //

    /**
     * プロパティ値を設定
     * @param {string} elementId - 要素ID
     * @param {*} value - 設定する値
     */
    setPropertyValue(elementId, value) {
        const el = document.getElementById(elementId);
        if (el && value !== undefined) {
            el.value = value;
        }
    }

    /**
     * 要素の表示・非表示を切り替え
     * @param {string} elementId - 要素ID
     * @param {boolean} visible - 表示するかどうか
     */
    toggleElementVisibility(elementId, visible) {
        const el = document.getElementById(elementId);
        if (el) {
            el.style.display = visible ? 'block' : 'none';
        }
    }

    /**
     * 要素の有効・無効を切り替え
     * @param {string} elementId - 要素ID
     * @param {boolean} enabled - 有効にするかどうか
     */
    toggleElementEnabled(elementId, enabled) {
        const el = document.getElementById(elementId);
        if (el) {
            el.disabled = !enabled;
        }
    }

    /**
     * CSSクラスを切り替え
     * @param {string} elementId - 要素ID
     * @param {string} className - CSSクラス名
     * @param {boolean} add - 追加するかどうか
     */
    toggleCSSClass(elementId, className, add) {
        const el = document.getElementById(elementId);
        if (el) {
            if (add) {
                el.classList.add(className);
            } else {
                el.classList.remove(className);
            }
        }
    }

    // ========== パフォーマンス最適化 ========== //

    /**
     * UI更新をバッチ処理で実行
     * @param {Function[]} updateFunctions - 更新関数の配列
     */
    batchUIUpdate(updateFunctions) {
        // requestAnimationFrame を使用してUI更新を最適化
        requestAnimationFrame(() => {
            for (const updateFunction of updateFunctions) {
                try {
                    updateFunction();
                } catch (error) {
                    console.error('❌ UI更新エラー:', error);
                }
            }
        });
    }

    /**
     * 全UI要素を更新（パフォーマンス最適化版）
     */
    updateAllUIOptimized() {
        console.log('🔄 最適化UI全体更新開始');
        
        const updateFunctions = [
            () => this.updateProjectStatus(),
            () => this.updateOutliner(),
            () => this.updateProperties(),
            () => this.updateLayers(),
            () => this.updatePreviewDisplay()
        ];
        
        this.batchUIUpdate(updateFunctions);
        
        console.log('✅ 最適化UI全体更新完了');
    }

    /**
     * UI更新頻度を制限するデバウンス機能
     * @param {Function} func - 実行する関数
     * @param {number} delay - 遅延時間（ミリ秒）
     * @returns {Function} デバウンスされた関数
     */
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // ========== デバッグ ========== //

    /**
     * UI状態をデバッグ出力
     */
    debugUIState() {
        console.log('🖥️ === UI状態デバッグ ===');
        
        // プロジェクト状態
        const projectStatus = document.getElementById('project-status');
        console.log('プロジェクト状態:', projectStatus ? projectStatus.textContent : 'なし');
        
        // アウトライナー
        const projectTree = document.getElementById('project-tree');
        console.log('アウトライナー:', projectTree ? `${projectTree.children.length}個の要素` : 'なし');
        
        // プロパティパネル
        const transformSection = document.getElementById('transform-section');
        const animationSection = document.getElementById('animation-section');
        console.log('プロパティパネル:', {
            transform: transformSection ? transformSection.style.display : 'なし',
            animation: animationSection ? animationSection.style.display : 'なし'
        });
        
        // レイヤーパネル
        const layersList = document.getElementById('layers-list');
        console.log('レイヤーパネル:', layersList ? `${layersList.children.length}個のレイヤー` : 'なし');
        
        // 選択状態
        console.log('選択中キャラクター:', this.app.state.selectedCharacter);
        
        console.log('🖥️ === デバッグ情報終了 ===');
    }
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}

// Global registration
window.UIManager = UIManager;

console.log('✅ UI Manager Module 読み込み完了');