/**
 * index.html専用 SkeletonBounds統合システム
 * 既存のSpine初期化コードとSkeletonBoundsシステムを統合
 */

// ログ関数（index.html用簡易版）
function logBounds(level, message, ...args) {
  const prefix =
    {
      ERROR: "❌",
      WARN: "⚠️",
      INFO: "ℹ️",
      DEBUG: "🔍",
    }[level] || "📝";

  console.log(`${prefix} [BOUNDS] ${message}`, ...args);
}

/**
 * デバッグ用：統合状態確認関数
 */
function debugBoundsState() {
  console.log("🔍 [DEBUG] バウンディングボックス統合状態確認:");

  if (typeof indexBoundsManager !== "undefined" && indexBoundsManager) {
    console.log("✅ indexBoundsManager存在");

    // 各キャラクターの統合状態を確認
    ["purattokun", "nezumi"].forEach((characterId) => {
      const canvas = document.getElementById(`${characterId}-canvas`);
      const character =
        typeof spineCharacters !== "undefined"
          ? spineCharacters[characterId]
          : null;

      console.log(`📋 ${characterId}:`, {
        canvas: canvas ? "✅存在" : "❌なし",
        character: character ? "✅存在" : "❌なし",
        animations: character ? character.animations : "N/A",
        skeleton: character && character.skeleton ? "✅存在" : "❌なし",
      });

      // バウンディングボックス検索
      if (character && character.skeleton) {
        const boundingBoxes = [];
        const skeleton = character.skeleton;

        for (
          let slotIndex = 0;
          slotIndex < skeleton.slots.length;
          slotIndex++
        ) {
          const slot = skeleton.slots[slotIndex];
          const attachment = slot.getAttachment();

          if (
            attachment &&
            attachment.type === spine.AttachmentType.BoundingBox
          ) {
            boundingBoxes.push({
              slotName: slot.data.name,
              attachmentName: attachment.name,
              vertexCount: attachment.vertices.length / 2,
            });
          }
        }

        console.log(`📐 ${characterId} バウンディングボックス:`, boundingBoxes);
      }
    });
  } else {
    console.log("❌ indexBoundsManager未初期化");
  }
}

/**
 * index.html専用 SkeletonBounds統合マネージャー
 */
class IndexSkeletonBoundsManager {
  constructor() {
    this.charactersInitialized = false;
    this.boundsManager = null;
  }

  /**
   * SkeletonBoundsシステムの初期化
   */
  async initialize() {
    logBounds("INFO", "Initializing SkeletonBounds for index.html...");

    try {
      // SkeletonBoundsシステムが読み込まれているかチェック
      logBounds("DEBUG", "Checking SpineSkeletonBounds availability...");
      logBounds(
        "DEBUG",
        "typeof SpineSkeletonBounds:",
        typeof SpineSkeletonBounds
      );
      logBounds(
        "DEBUG",
        "window.spineSkeletonBounds:",
        !!window.spineSkeletonBounds
      );

      // 既存のグローバルインスタンスを優先使用
      if (
        window.spineSkeletonBounds &&
        typeof window.spineSkeletonBounds.initializeCharacterBounds ===
          "function"
      ) {
        logBounds("INFO", "Using existing global spineSkeletonBounds instance");
        this.boundsManager = window.spineSkeletonBounds;
      } else if (typeof SpineSkeletonBounds !== "undefined") {
        // 新しいインスタンスを作成
        logBounds("DEBUG", "Creating new SpineSkeletonBounds instance...");
        this.boundsManager = new SpineSkeletonBounds();
        logBounds(
          "DEBUG",
          "New SpineSkeletonBounds instance created:",
          !!this.boundsManager
        );
      } else {
        logBounds(
          "ERROR",
          "SpineSkeletonBounds class not found. Please load spine-skeleton-bounds.js"
        );
        return false;
      }

      // インスタンス検証
      if (!this.boundsManager) {
        logBounds(
          "ERROR",
          "Failed to create SpineSkeletonBounds instance - null result"
        );
        return false;
      }

      // 必要なメソッドの存在確認
      const requiredMethods = [
        "initializeCharacterBounds",
        "checkBoundsHit",
        "setDebugMode",
      ];
      for (const method of requiredMethods) {
        if (typeof this.boundsManager[method] !== "function") {
          logBounds(
            "ERROR",
            `Required method ${method} not found in SpineSkeletonBounds`
          );
          logBounds(
            "ERROR",
            "Available methods:",
            Object.getOwnPropertyNames(this.boundsManager)
          );
          return false;
        }
      }
      logBounds("DEBUG", "All required methods verified");

      // グローバル参照の一意性を確保
      logBounds("DEBUG", "Setting up global references...");
      window.spineSkeletonBounds = this.boundsManager;
      window.boundsManager = this.boundsManager;

      // 強制的な最終検証
      const finalCheck = {
        "this.boundsManager_exists": !!this.boundsManager,
        "this.boundsManager_type": typeof this.boundsManager,
        "this.boundsManager_hasInitMethod":
          typeof this.boundsManager.initializeCharacterBounds === "function",
        "window.boundsManager_exists": !!window.boundsManager,
        "window.boundsManager_equals_this":
          window.boundsManager === this.boundsManager,
        "window.spineSkeletonBounds_exists": !!window.spineSkeletonBounds,
        "window.spineSkeletonBounds_equals_this":
          window.spineSkeletonBounds === this.boundsManager,
      };

      logBounds("DEBUG", "Final verification:", finalCheck);

      // 決定的な成功条件
      const initSuccess =
        !!this.boundsManager &&
        typeof this.boundsManager.initializeCharacterBounds === "function" &&
        window.boundsManager === this.boundsManager;

      if (initSuccess) {
        logBounds("INFO", "SkeletonBounds system initialized successfully");
        return true;
      } else {
        logBounds(
          "ERROR",
          "Final verification failed - SkeletonBounds system not properly initialized"
        );
        return false;
      }
    } catch (error) {
      logBounds("ERROR", "Failed to initialize SkeletonBounds system:", error);
      logBounds("ERROR", "Error details:", {
        message: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  /**
   * キャラクター初期化後の統合処理
   * @param {string} characterId - キャラクターID
   * @param {Object} characterData - キャラクターデータ
   */
  integrateCharacter(characterId, characterData) {
    console.log(`🔍 [統合開始] キャラクター: ${characterId}`);
    console.log("📋 入力データの詳細確認:", {
      characterData存在: !!characterData,
      spine存在: !!characterData?.spine,
      skeleton存在: !!characterData?.spine?.skeleton,
      canvas存在: !!characterData?.canvas,
      boundsManager存在: !!this.boundsManager,
    });

    if (!this.boundsManager || !characterData.spine) {
      console.error(`❌ [統合失敗] ${characterId}: 必要なデータが不足`);
      logBounds(
        "WARN",
        `Cannot integrate ${characterId}: missing bounds manager or Spine data`
      );
      return false;
    }

    // 全キャラクターの詳細ログ出力（nezumi以外も含む）
    console.log(`🎭 [${characterId}] スケルトンデータ詳細:`, {
      skeleton: !!characterData.spine.skeleton,
      slots: characterData.spine.skeleton
        ? characterData.spine.skeleton.slots.length
        : 0,
      skins: characterData.spine.skeleton
        ? characterData.spine.skeleton.data.skins.length
        : 0,
      animationState: !!characterData.spine.animationState,
    });

    // スロット内のアタッチメントをチェック（全キャラクター）
    if (characterData.spine.skeleton && characterData.spine.skeleton.slots) {
      console.log(`🔍 [${characterId}] 全スロットのアタッチメント検査:`);
      let boundingBoxCount = 0;
      characterData.spine.skeleton.slots.forEach((slot, index) => {
        if (slot.attachment) {
          const isBoundingBox = slot.attachment.type === "boundingbox";
          if (isBoundingBox) boundingBoxCount++;
          console.log(
            `  [${index}] ${slot.data.name}: ${slot.attachment.name} (type: ${
              slot.attachment.type
            }) ${isBoundingBox ? "🎯BoundingBox!" : ""}`
          );
          logBounds(
            "DEBUG",
            `${characterId} slot ${index} (${slot.data.name}):`,
            {
              attachmentName: slot.attachment.name,
              attachmentType: slot.attachment.type,
              isBoundingBox: isBoundingBox,
            }
          );
        }
      });
      console.log(
        `📊 [${characterId}] バウンディングボックス数: ${boundingBoxCount}`
      );
    }

    // Spineキャラクターオブジェクト作成（SpineSkeletonBounds用フォーマット）
    const spineCharacter = {
      name: characterId,
      type: "spine",
      canvas: characterData.canvas,
      spine: {
        skeleton: characterData.spine.skeleton,
        animationState: characterData.spine.animationState,
      },
    };

    console.log(`🏗️ [${characterId}] spineCharacterオブジェクト作成完了:`, {
      name: spineCharacter.name,
      type: spineCharacter.type,
      canvas: !!spineCharacter.canvas,
      skeleton: !!spineCharacter.spine.skeleton,
      animationState: !!spineCharacter.spine.animationState,
    });

    // SkeletonBounds初期化（詳細ログ付き）
    console.log(`⚙️ [${characterId}] SkeletonBounds初期化実行中...`);
    const boundsInitialized = this.boundsManager.initializeCharacterBounds(
      characterId,
      spineCharacter
    );
    console.log(
      `📋 [${characterId}] SkeletonBounds初期化結果: ${
        boundsInitialized ? "✅成功" : "❌失敗"
      }`
    );

    if (boundsInitialized) {
      // 統合後の状態確認
      const boundsInfo = this.boundsManager.characters.get(characterId);
      console.log(`✅ [${characterId}] 統合成功 - 状態確認:`, {
        boundsInfo存在: !!boundsInfo,
        boundingBoxes数: boundsInfo?.boundingBoxes?.length || 0,
        integrationSuccess: boundsInfo?.integrationSuccess || false,
      });

      // クリックハンドラー設定
      this.setupClickHandler(characterId, characterData.canvas);

      // 統合成功時にデフォルトでバウンディングボックス視覚表示を作成
      this.createCharacterBoundingBoxVisual(characterId);
      // this.updateBoundingBoxVisual(characterId); // 🚫 編集前の赤枠表示を無効化

      // charactersInitializedフラグを設定
      this.charactersInitialized = true;
      logBounds(
        "INFO",
        `SkeletonBounds integrated for character: ${characterId}`
      );
      logBounds(
        "DEBUG",
        `charactersInitialized flag set to: ${this.charactersInitialized}`
      );
      return true;
    } else {
      console.error(`❌ [${characterId}] SkeletonBounds初期化に失敗`);
      logBounds(
        "ERROR",
        `Failed to initialize SkeletonBounds for: ${characterId}`
      );
      return false;
    }
  }

  /**
   * 強制初期化機能（緊急用）
   * 初期化に失敗した場合の強制的な修復を試行
   */
  async forceInitialize() {
    logBounds("WARN", "Force initialization starting...");

    try {
      // 既存の参照をクリア
      this.boundsManager = null;
      window.boundsManager = null;
      window.spineSkeletonBounds = null;

      logBounds("DEBUG", "Cleared existing references");

      // SpineSkeletonBoundsクラスの再確認
      if (typeof SpineSkeletonBounds === "undefined") {
        logBounds("ERROR", "SpineSkeletonBounds class still not available");

        // spine-skeleton-bounds.jsの動的読み込み試行
        logBounds(
          "INFO",
          "Attempting to dynamically load spine-skeleton-bounds.js..."
        );
        try {
          const script = document.createElement("script");
          script.src = "/spine-skeleton-bounds.js";
          document.head.appendChild(script);

          // 読み込み完了を待つ
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () =>
              reject(new Error("Failed to load spine-skeleton-bounds.js"));
            setTimeout(() => reject(new Error("Script loading timeout")), 5000);
          });

          logBounds("INFO", "spine-skeleton-bounds.js loaded successfully");
        } catch (loadError) {
          logBounds(
            "ERROR",
            "Failed to dynamically load spine-skeleton-bounds.js:",
            loadError
          );
          return false;
        }
      }

      // 強制的な初期化実行
      const initResult = await this.initialize();

      if (initResult) {
        logBounds("INFO", "Force initialization completed successfully");
        this.charactersInitialized = true; // フラグ設定
        return true;
      } else {
        logBounds("ERROR", "Force initialization failed");
        return false;
      }
    } catch (error) {
      logBounds("ERROR", "Force initialization error:", error);
      return false;
    }
  }

  /**
   * キャラクター用クリックハンドラー設定
   * @param {string} characterId - キャラクターID
   * @param {HTMLCanvasElement} canvas - Canvas要素
   */
  setupClickHandler(characterId, canvas) {
    if (!canvas) {
      logBounds(
        "WARN",
        `No canvas found for ${characterId}, skipping click handler setup`
      );
      return;
    }

    const clickHandler = (event) => {
      event.preventDefault();

      const x = event.clientX;
      const y = event.clientY;

      logBounds("DEBUG", `Click event on ${characterId} at (${x}, ${y})`);

      // SkeletonBounds判定
      const hitResult = this.boundsManager.checkBoundsHit(characterId, x, y);

      if (hitResult) {
        logBounds("INFO", `Bounds hit detected for ${characterId}:`, hitResult);

        // 部位別アニメーション実行
        this.executePartAnimation(characterId, hitResult);

        // デバッグ表示更新
        if (this.boundsManager.debugMode) {
          this.boundsManager.debugDrawBounds(characterId);
        }
      } else {
        logBounds(
          "DEBUG",
          `No bounds hit for ${characterId} - ignoring click outside bounds`
        );

        // 境界外クリック時は完全に無反応（フォールバック処理を実行しない）
        // this.executeDefaultClick(characterId); // 無効化
      }
    };

    // 既存のクリックハンドラーを置き換え
    canvas.removeEventListener("click", canvas.originalClickHandler);
    canvas.addEventListener("click", clickHandler);
    canvas.style.pointerEvents = "auto";

    logBounds("INFO", `Click handler setup completed for ${characterId}`);
  }

  /**
   * 部位別アニメーション実行
   * @param {string} characterId - キャラクターID
   * @param {Object} hitResult - ヒット判定結果
   */
  executePartAnimation(characterId, hitResult) {
    if (!hitResult || !hitResult.boundingBox) {
      logBounds("WARN", `Invalid hit result for ${characterId}`);
      return;
    }

    const partName = hitResult.boundingBox.name;
    let animationName = null;
    let loopAnimation = false;

    // キャラクター別部位アニメーション設定
    if (characterId === "purattokun") {
      // ぷらっとくん: 全ての部位でyarareアニメーション
      animationName = "yarare";
    } else if (characterId === "nezumi") {
      // ねずみ: 全ての部位でketteiアニメーション
      animationName = "kettei";
    }

    // フォールバック設定
    if (!animationName) {
      if (characterId === "purattokun") {
        animationName = "taiki";
        loopAnimation = true;
      } else if (characterId === "nezumi") {
        animationName = "search";
        loopAnimation = true;
      }
    }

    if (animationName) {
      // アニメーション実行
      this.playAnimation(characterId, animationName, loopAnimation);
      logBounds(
        "INFO",
        `Part-specific animation played for ${characterId}: ${animationName} (part: ${partName})`
      );
    } else {
      logBounds("WARN", `No part animation available for ${characterId}`);
    }
  }

  /**
   * デフォルトクリック処理（既存動作を維持）
   * @param {string} characterId - キャラクターID
   */
  executeDefaultClick(characterId) {
    // 元のindex.htmlクリックハンドラーを呼び出す
    const canvas = document.getElementById(`${characterId}-canvas`);

    if (canvas && canvas.originalClickHandler) {
      // 最後のクリック位置を使用して元のハンドラーを呼び出す
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const simulatedEvent = {
        clientX: centerX,
        clientY: centerY,
        target: canvas,
      };

      logBounds("INFO", `Calling original click handler for ${characterId}`);
      canvas.originalClickHandler(simulatedEvent);
    } else {
      logBounds("WARN", `No original click handler found for ${characterId}`);

      // フォールバック: アニメーション直接実行
      let clickAnimation = null;
      if (characterId === "purattokun") {
        clickAnimation = "yarare";
      } else if (characterId === "nezumi") {
        clickAnimation = "kettei";
      }

      if (clickAnimation) {
        this.playAnimation(characterId, clickAnimation, false);
        logBounds(
          "INFO",
          `Fallback click animation played for ${characterId}: ${clickAnimation}`
        );
      }
    }
  }

  /**
   * アニメーション実行（index.html互換）
   * @param {string} characterId - キャラクターID
   * @param {string} animationName - アニメーション名
   * @param {boolean} loop - ループするかどうか
   */
  playAnimation(characterId, animationName, loop = false) {
    // グローバルのspineCharactersからキャラクターデータを取得
    if (
      typeof spineCharacters !== "undefined" &&
      spineCharacters[characterId]
    ) {
      const character = spineCharacters[characterId];

      if (character.animationState) {
        try {
          character.animationState.setAnimation(0, animationName, loop);
          logBounds(
            "DEBUG",
            `Animation ${animationName} set for ${characterId} (loop: ${loop})`
          );

          // 非ループアニメーションの場合、完了後の復帰アニメーション設定
          if (!loop) {
            let returnAnimation = null;

            if (characterId === "purattokun") {
              returnAnimation = "taiki";
            } else if (characterId === "nezumi") {
              returnAnimation = "search";
            }

            if (
              returnAnimation &&
              character.skeleton.data.findAnimation(returnAnimation)
            ) {
              character.animationState.addAnimation(
                0,
                returnAnimation,
                true,
                0
              );
              logBounds(
                "DEBUG",
                `Return animation ${returnAnimation} set for ${characterId}`
              );
            }
          }
        } catch (error) {
          logBounds(
            "ERROR",
            `Failed to play animation ${animationName} for ${characterId}:`,
            error
          );
          // フォールバック：デフォルトアニメーション
          try {
            let fallbackAnimation = null;
            if (characterId === "purattokun") {
              fallbackAnimation = "taiki";
            } else if (characterId === "nezumi") {
              fallbackAnimation = "search";
            }

            if (
              fallbackAnimation &&
              character.skeleton.data.findAnimation(fallbackAnimation)
            ) {
              character.animationState.setAnimation(0, fallbackAnimation, true);
              logBounds(
                "DEBUG",
                `Fallback animation ${fallbackAnimation} set for ${characterId}`
              );
            }
          } catch (fallbackError) {
            logBounds(
              "ERROR",
              `Fallback animation also failed for ${characterId}:`,
              fallbackError
            );
          }
        }
      } else {
        logBounds("WARN", `No animation state found for ${characterId}`);
      }
    } else {
      logBounds(
        "WARN",
        `Character ${characterId} not found in spineCharacters`
      );
    }
  }

  /**
   * 全キャラクターの境界ボックスを更新
   */
  updateAllBounds() {
    if (this.boundsManager) {
      this.boundsManager.updateAllBounds();

      // 視覚表示も更新
      if (this.boundsManager.debugMode) {
        ["purattokun", "nezumi"].forEach((characterId) => {
          this.updateBoundingBoxVisual(characterId);
        });
      }

      logBounds("INFO", "All bounds updated");
    }
  }

  /**
   * デバッグモード切り替え
   */
  toggleDebugMode() {
    if (this.boundsManager) {
      const currentMode = this.boundsManager.debugMode;
      this.boundsManager.setDebugMode(!currentMode);
      logBounds("INFO", `Debug mode: ${!currentMode ? "enabled" : "disabled"}`);

      // 視覚表示システムを切り替え
      if (!currentMode) {
        this.createBoundingBoxVisuals();
      } else {
        this.removeBoundingBoxVisuals();
      }

      return !currentMode;
    }
    return false;
  }

  /**
   * バウンディングボックス視覚表示システムの作成
   */
  createBoundingBoxVisuals() {
    logBounds("INFO", "Creating bounding box visual system...");

    this.characters.forEach((boundsInfo, characterId) => {
      this.createCharacterBoundingBoxVisual(characterId);
    });

    // 全キャラクターの境界ボックス更新
    this.updateAllBounds();

    logBounds("INFO", "Bounding box visual system created");
  }

  /**
   * 特定キャラクターのバウンディングボックス視覚表示を作成
   * @param {string} characterId - キャラクターID
   */
  createCharacterBoundingBoxVisual(characterId) {
    const boundsInfo = this.boundsManager?.characters?.get(characterId);
    if (!boundsInfo) {
      logBounds("WARN", `No bounds info found for ${characterId}`);
      return;
    }

    const character = boundsInfo.character;
    const canvas = character.canvas;
    if (!canvas) {
      logBounds("WARN", `No canvas found for ${characterId}`);
      return;
    }

    // 既存の視覚表示要素を削除
    this.removeCharacterBoundingBoxVisual(characterId);

    // バウンディングボックス表示用のオーバーレイを作成
    const overlay = document.createElement("div");
    overlay.id = `${characterId}-bounds-overlay`;
    overlay.style.cssText = `
            position: absolute;
            pointer-events: none;
            z-index: 1000;
            border: none;
            background: transparent;
        `;

    // Canvas位置に合わせてオーバーレイを配置
    const canvasStyle = window.getComputedStyle(canvas);
    overlay.style.left = canvasStyle.left;
    overlay.style.top = canvasStyle.top;
    overlay.style.width = canvasStyle.width;
    overlay.style.height = canvasStyle.height;
    overlay.style.transform = canvasStyle.transform;

    // Canvas親要素に追加
    canvas.parentElement.appendChild(overlay);

    logBounds("DEBUG", `Created bounding box overlay for ${characterId}`);
  }

  /**
   * 特定キャラクターのバウンディングボックス視覚表示を削除
   * @param {string} characterId - キャラクターID
   */
  removeCharacterBoundingBoxVisual(characterId) {
    const overlay = document.getElementById(`${characterId}-bounds-overlay`);
    if (overlay) {
      overlay.remove();
      logBounds("DEBUG", `Removed bounding box overlay for ${characterId}`);
    }
  }

  /**
   * バウンディングボックス視覚表示システムの削除
   */
  removeBoundingBoxVisuals() {
    logBounds("INFO", "Removing bounding box visual system...");

    ["purattokun", "nezumi"].forEach((characterId) => {
      this.removeCharacterBoundingBoxVisual(characterId);
    });

    logBounds("INFO", "Bounding box visual system removed");
  }

  /**
   * バウンディングボックスの描画更新
   * @param {string} characterId - キャラクターID
   */
  updateBoundingBoxVisual(characterId) {
    const overlay = document.getElementById(`${characterId}-bounds-overlay`);
    if (!overlay) return;

    const boundsInfo = this.boundsManager?.characters?.get(characterId);
    if (!boundsInfo) return;

    // 既存の描画をクリア
    overlay.innerHTML = "";

    // バウンディングボックスが存在する場合のみ描画
    if (boundsInfo.boundingBoxes && boundsInfo.boundingBoxes.length > 0) {
      boundsInfo.boundingBoxes.forEach((boundingBox, index) => {
        this.drawBoundingBox(overlay, boundingBox, characterId, index);
      });

      logBounds(
        "DEBUG",
        `Updated ${boundsInfo.boundingBoxes.length} bounding boxes for ${characterId}`
      );
    } else {
      logBounds("WARN", `No bounding boxes to display for ${characterId}`);
    }
  }

  /**
   * 個別のバウンディングボックスを描画（統一座標システム準拠）
   * @param {HTMLElement} overlay - オーバーレイ要素
   * @param {Object} boundingBox - バウンディングボックス情報
   * @param {string} characterId - キャラクターID
   * @param {number} index - バウンディングボックスのインデックス
   */
  drawBoundingBox(overlay, boundingBox, characterId, index) {
    if (!boundingBox.bounds) return;

    const bounds = boundingBox.bounds;

    // バウンディングボックス要素を作成
    const boxElement = document.createElement("div");
    boxElement.className = `bounds-box bounds-${characterId}-${index}`;
    boxElement.style.cssText = `
            position: absolute;
            border: 2px dotted ${
              characterId === "purattokun" ? "#ff0000" : "#0000ff"
            };
            background: ${
              characterId === "purattokun"
                ? "rgba(255, 0, 0, 0.1)"
                : "rgba(0, 0, 255, 0.1)"
            };
            pointer-events: none;
            box-sizing: border-box;
        `;

    // 🎯 統一座標システム（120x120px, 中心：60,60）に基づく位置計算
    // 可変サイズキャンバスに対しても汎用性を保つ
    const canvasSize = 120; // 統一Canvas解像度
    const canvasCenter = 60; // 統一中心位置
    
    const leftPercent = ((bounds.centerX - bounds.width / 2 + canvasCenter) / canvasSize) * 100;
    const topPercent = ((canvasCenter - (bounds.centerY + bounds.height / 2)) / canvasSize) * 100;
    const widthPercent = (bounds.width / canvasSize) * 100;
    const heightPercent = (bounds.height / canvasSize) * 100;

    boxElement.style.left = `${leftPercent}%`;
    boxElement.style.top = `${topPercent}%`;
    boxElement.style.width = `${widthPercent}%`;
    boxElement.style.height = `${heightPercent}%`;
    
    logBounds("DEBUG", `統一座標系でバウンディングボックス配置: ${characterId}-${index}`, {
      bounds,
      calculated: { leftPercent, topPercent, widthPercent, heightPercent },
      system: '120x120px_unified'
    });

    // ラベル要素を作成
    const labelElement = document.createElement("div");
    labelElement.style.cssText = `
            position: absolute;
            top: -20px;
            left: 0;
            background: ${
              characterId === "purattokun"
                ? "rgba(255, 0, 0, 0.8)"
                : "rgba(0, 0, 255, 0.8)"
            };
            color: white;
            padding: 2px 4px;
            font-size: 10px;
            font-family: monospace;
            border-radius: 2px;
            white-space: nowrap;
        `;
    labelElement.textContent = boundingBox.name;

    boxElement.appendChild(labelElement);
    overlay.appendChild(boxElement);

    logBounds(
      "DEBUG",
      `統一座標システムでバウンディングボックス"${boundingBox.name}"を描画: ${characterId}`,
      {
        bounds,
        position: {
          left: leftPercent,
          top: topPercent,
          width: widthPercent,
          height: heightPercent,
        },
        system: '120x120px_unified'
      }
    );
  }

  /**
   * キャラクターの境界ボックス情報を表示
   * @param {string} characterId - キャラクターID
   */
  showBoundsInfo(characterId) {
    if (this.boundsManager) {
      this.boundsManager.debugInfo(characterId);
    } else {
      logBounds("ERROR", "Bounds manager not initialized");
    }
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    if (this.boundsManager) {
      this.boundsManager.cleanup();
    }
    logBounds("INFO", "IndexSkeletonBoundsManager cleanup completed");
  }
}

// グローバルマネージャーインスタンス
window.indexBoundsManager = new IndexSkeletonBoundsManager();

// グローバル関数エクスポート
window.initializeBounds = async () => {
  return await window.indexBoundsManager.initialize();
};

window.debugBoundsState = debugBoundsState;

window.integrateBoundsForCharacter = (characterId, characterData) => {
  return window.indexBoundsManager.integrateCharacter(
    characterId,
    characterData
  );
};

window.toggleBoundsDebug = () => {
  return window.indexBoundsManager.toggleDebugMode();
};

window.showBoundsInfo = (characterId) => {
  window.indexBoundsManager.showBoundsInfo(characterId);
};

// nezumi専用テスト関数を追加
window.testNezumiBounds = () => {
  logBounds("INFO", "Testing nezumi bounds...");

  if (window.indexBoundsManager && window.indexBoundsManager.boundsManager) {
    const boundsInfo =
      window.indexBoundsManager.boundsManager.characters.get("nezumi");
    if (boundsInfo) {
      logBounds("INFO", "Nezumi bounds info found:", {
        boundingBoxes: boundsInfo.boundingBoxes.length,
        character: !!boundsInfo.character,
        skeleton: !!boundsInfo.character.spine.skeleton,
      });

      // 手動で境界ボックスを更新
      window.indexBoundsManager.boundsManager.updateBounds("nezumi");

      // 境界ボックス情報を表示
      window.indexBoundsManager.showBoundsInfo("nezumi");

      return true;
    } else {
      logBounds("ERROR", "Nezumi bounds info not found");
      return false;
    }
  } else {
    logBounds("ERROR", "Bounds manager not initialized");
    return false;
  }
};

window.updateAllBounds = () => {
  window.indexBoundsManager.updateAllBounds();
};

// 強制初期化機能をグローバルに公開
window.forceInitializeBounds = async () => {
  console.log("🔧 強制初期化を開始します...");
  return await window.indexBoundsManager.forceInitialize();
};

// グローバル境界ボックステスト関数（ブラウザコンソール用）
window.testAllBounds = () => {
  logBounds("INFO", "Testing all character bounds...");
  const results = {};

  ["purattokun", "nezumi"].forEach((characterId) => {
    if (window.indexBoundsManager && window.indexBoundsManager.boundsManager) {
      const boundsInfo =
        window.indexBoundsManager.boundsManager.characters.get(characterId);
      results[characterId] = {
        initialized: !!boundsInfo,
        boundingBoxes: boundsInfo ? boundsInfo.boundingBoxes.length : 0,
      };

      if (boundsInfo) {
        window.indexBoundsManager.boundsManager.updateBounds(characterId);
      }
    }
  });

  logBounds("INFO", "Bounds test results:", results);
  return results;
};

/**
 * バウンディングボックスシステム状態確認
 */
function checkBoundsSystemStatus() {
  console.log("🔍 バウンディングボックスシステム状態確認:");
  console.log("boundsManager存在:", !!window.boundsManager);
  console.log("spineSkeletonBounds存在:", !!window.spineSkeletonBounds);
  console.log("indexBoundsManager存在:", !!window.indexBoundsManager);

  if (window.boundsManager) {
    console.log(
      "登録済みキャラクター数:",
      window.boundsManager.characters?.size || 0
    );
    if (window.boundsManager.characters?.size > 0) {
      console.log(
        "登録済みキャラクターID:",
        Array.from(window.boundsManager.characters.keys())
      );
    }
  }

  if (window.indexBoundsManager) {
    console.log("統合システム状態:", {
      初期化済み: window.indexBoundsManager.initialized,
      統合済みキャラクター数: Object.keys(
        window.indexBoundsManager.integratedCharacters || {}
      ).length,
    });
  }
}

/**
 * バウンディングボックス表示切替
 */
function toggleBoundsDebug() {
  if (window.boundsManager) {
    const currentMode = window.boundsManager.debugMode;
    window.boundsManager.setDebugMode(!currentMode);
    console.log(`🎯 バウンディングボックス表示: ${currentMode ? "OFF" : "ON"}`);
  } else {
    console.error("❌ boundsManagerが見つかりません");
  }
}

// 詳細デバッグ関数の追加
window.debugIntegrationDetails = (characterId) => {
  if (!window.indexBoundsManager) {
    console.error("❌ indexBoundsManager not found");
    return null;
  }

  console.log(`🔍 [詳細診断] キャラクター: ${characterId}`);

  const boundsManager = window.indexBoundsManager.boundsManager;
  if (!boundsManager) {
    console.error("❌ boundsManager not found");
    return null;
  }

  // boundsManager状態確認
  console.log("📋 BoundsManager状態:", {
    boundsManager存在: !!boundsManager,
    characters_size: boundsManager?.characters?.size || 0,
    characters_keys: boundsManager?.characters
      ? Array.from(boundsManager.characters.keys())
      : [],
  });

  // 指定キャラクターの詳細情報
  if (boundsManager?.characters?.has(characterId)) {
    const boundsInfo = boundsManager.characters.get(characterId);
    console.log(`🎯 [${characterId}] boundsInfo詳細:`, {
      存在: !!boundsInfo,
      skeletonBounds: !!boundsInfo?.skeletonBounds,
      character: !!boundsInfo?.character,
      boundingBoxes数: boundsInfo?.boundingBoxes?.length || 0,
      attachmentBounds数: boundsInfo?.attachmentBounds?.size || 0,
      integratedAt: boundsInfo?.integratedAt,
      integrationSuccess: boundsInfo?.integrationSuccess,
    });

    // SkeletonBoundsの内部状態
    if (boundsInfo?.skeletonBounds) {
      try {
        console.log(`⚙️ [${characterId}] SkeletonBounds内部状態:`, {
          width: boundsInfo.skeletonBounds.getWidth(),
          height: boundsInfo.skeletonBounds.getHeight(),
          minX: boundsInfo.skeletonBounds.getMinX(),
          maxX: boundsInfo.skeletonBounds.getMaxX(),
          minY: boundsInfo.skeletonBounds.getMinY(),
          maxY: boundsInfo.skeletonBounds.getMaxY(),
        });
      } catch (error) {
        console.error(
          `❌ [${characterId}] SkeletonBounds状態取得エラー:`,
          error
        );
      }
    }

    return boundsInfo;
  } else {
    console.warn(`⚠️ [${characterId}] boundsInfoが見つかりません`);
    return null;
  }
};

window.debugFullSystemState = () => {
  console.log("🔍 統合システム全体診断");
  console.log("=".repeat(50));

  const manager = window.indexBoundsManager;
  const boundsManager = manager?.boundsManager;

  // 基本システム状態
  console.log("📋 基本システム状態:", {
    IndexSkeletonBoundsManager: !!manager,
    boundsManager: !!boundsManager,
    window_boundsManager: !!window.boundsManager,
    charactersInitialized: manager?.charactersInitialized || false,
    SpineSkeletonBounds_class_available:
      typeof SpineSkeletonBounds !== "undefined",
  });

  // 初期化状態の詳細確認
  if (manager) {
    console.log("🔍 初期化状態の詳細:", {
      "manager.boundsManager": !!manager.boundsManager,
      boundsManager_methods: manager.boundsManager
        ? Object.getOwnPropertyNames(manager.boundsManager)
        : "N/A",
      characters_map_size: manager.boundsManager?.characters?.size || 0,
    });
  }

  // 登録キャラクター一覧
  if (boundsManager?.characters) {
    console.log("👥 登録キャラクター一覧:");
    boundsManager.characters.forEach((boundsInfo, characterId) => {
      window.debugIntegrationDetails(characterId);
    });
  }

  // デバッグ機能動作確認
  console.log("🔧 デバッグ機能動作確認:");
  try {
    const debugResult = boundsManager?.toggleBoundsDebug
      ? boundsManager.toggleBoundsDebug()
      : false;
    console.log("toggleBoundsDebug結果:", debugResult);

    // 手動でデバッグモード切り替えを試行
    if (boundsManager?.setDebugMode) {
      boundsManager.setDebugMode(true);
      console.log("setDebugMode(true)実行完了");
    }
  } catch (error) {
    console.error("toggleBoundsDebug実行エラー:", error);
  }

  console.log("=".repeat(50));
};

// 統合処理の詳細ステップ確認
window.debugIntegrationSteps = (characterId) => {
  console.log(`🔍 [統合詳細] ${characterId} の統合処理ステップ確認`);

  const manager = window.indexBoundsManager;
  if (!manager || !manager.boundsManager) {
    console.error("❌ システム初期化されていません");
    return false;
  }

  // Step 1: キャラクターデータの確認
  const characterData = window.spineCharacters?.[characterId];
  console.log(`Step 1 - キャラクターデータ確認:`, {
    spineCharacters存在: !!window.spineCharacters,
    characterData存在: !!characterData,
    spine存在: !!characterData?.spine,
    skeleton存在: !!characterData?.spine?.skeleton,
  });

  if (!characterData) {
    console.error(`❌ ${characterId}のキャラクターデータが見つかりません`);
    return false;
  }

  // Step 2: 統合実行
  console.log(`Step 2 - 統合実行開始...`);
  const result = manager.integrateCharacter(characterId, characterData);
  console.log(`Step 2 - 統合実行結果: ${result ? "✅成功" : "❌失敗"}`);

  // Step 3: 結果確認
  console.log(`Step 3 - 結果確認...`);
  window.debugIntegrationDetails(characterId);

  return result;
};

logBounds("INFO", "IndexSkeletonBoundsManager module loaded and ready");
