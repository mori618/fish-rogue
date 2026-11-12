// UIマネージャー
// 画面表示、アニメーション、エフェクトを管理

const UIManager = {
    // ========================================
    // ガチャ（スロットマシン）演出
    // ========================================
    showSlotAnimation(results, onComplete) {
        const overlay = document.createElement('div');
        overlay.id = 'gacha-slot-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 2000;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
        `;

        // スロットマシーンの見た目
        const slotContainer = document.createElement('div');
        slotContainer.style.cssText = `
            border: 10px solid #ffd700;
            border-radius: 20px;
            padding: 20px;
            background: linear-gradient(135deg, #1e293b, #0f172a);
            box-shadow: 0 0 50px rgba(255, 215, 0, 0.5);
            display: flex; gap: 10px;
        `;

        // リールの作成 (3つ)
        for (let i = 0; i < 3; i++) {
            const reel = document.createElement('div');
            reel.className = 'slot-reel';
            reel.style.cssText = `
                width: 80px; height: 120px;
                background: #fff;
                border: 4px solid #333;
                border-radius: 10px;
                overflow: hidden;
                position: relative;
            `;

            // 回転するストリップ
            const strip = document.createElement('div');
            strip.className = 'reel-strip';
            strip.style.cssText = `
                position: absolute; top: 0; left: 0; width: 100%;
                display: flex; flex-direction: column; align-items: center;
            `;
            // ダミーアイコン
            const icons = ['auto_awesome', 'stars', 'bolt', 'palette', 'diamond', 'phishing'];
            let stripHtml = '';
            for (let j = 0; j < 20; j++) {
                const icon = icons[Math.floor(Math.random() * icons.length)];
                stripHtml += `<span class="material-icons" style="font-size: 48px; line-height: 120px; color: #333;">${icon}</span>`;
            }
            strip.innerHTML = stripHtml;

            reel.appendChild(strip);
            slotContainer.appendChild(reel);

            // アニメーション (CSS keyframes needed or simple js)
            // Simple JS implementation
            this.animateReel(strip, i * 200 + 1500, results);
        }

        const title = document.createElement('div');
        title.innerHTML = '<h2 style="color: #ffd700; font-size: 2rem; margin-bottom: 20px; text-shadow: 0 0 10px #ffd700;">JACKPOT SLOTS</h2>';

        overlay.appendChild(title);
        overlay.appendChild(slotContainer);
        document.body.appendChild(overlay);

        // 演出全体の時間（全てのリールが止まった後）
        setTimeout(() => {
            overlay.style.transition = 'opacity 0.5s';
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                if (onComplete) onComplete();
            }, 500);
        }, 3000); // 3秒後
    },

    animateReel(element, duration, results) {
        // キーフレームアニメーションを動的に追加
        const keyframes = [
            { transform: 'translateY(0)' },
            { transform: 'translateY(-1000px)' }
        ];

        const animation = element.animate(keyframes, {
            duration: 200,
            iterations: Infinity
        });

        setTimeout(() => {
            animation.cancel();
            // 最後の位置（結果に基づく）を決めるロジックは入れていない（簡易演出）
            // 止まった位置に固定
            element.style.transform = 'translateY(-50px)'; // センター合わせ

            // 輝きエフェクト
            element.parentElement.style.boxShadow = '0 0 20px white';
            element.parentElement.style.borderColor = '#fff';
        }, duration);
    },
    // ========================================
    // 現在の画面
    // ========================================
    currentScreen: 'start',  // start, fishing, shop
    lastMoney: null,

    // ========================================
    // ゲージバトル設定
    // ========================================
    redZoneWidth: 10,
    greenZoneWidth: 15,

    // ========================================
    // 画面切り替え
    // ========================================
    showScreen(screenId) {
        // すべての画面を非表示
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // 指定した画面を表示
        const screen = document.getElementById(`${screenId}-screen`);
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenId;
        }

        // 画面固有の初期化
        if (screenId === 'fishing') {
            this.showIdle();
            this.updateStatus();
            this.updateSkyVisuals();
        } else if (screenId === 'shop') {
            ShopManager.renderShop();
        } else if (screenId === 'encyclopedia') {
            EncyclopediaManager.render();
        } else if (screenId === 'stats') {
            this.renderStats();
        } else if (screenId === 'skills') {
            SkillInventoryManager.render();
        } else if (screenId === 'skills') {
            SkillInventoryManager.render();
        } else if (screenId === 'gacha') {
            this.prepareGachaScreen();
        } else if (screenId === 'port') {
            ShopManager.renderPort();
        } else if (screenId === 'debug') {
            DebugManager.render();
        }
    },

    // ========================================
    // スタート画面
    // ========================================
    initStartScreen() {
        const hasSave = SaveManager.hasSaveData();
        const continueBtn = document.getElementById('continue-btn');

        if (continueBtn) {
            if (hasSave) {
                continueBtn.classList.remove('hidden');
            } else {
                continueBtn.classList.add('hidden');
            }
        }

        /* // デバッグツールバー作成
        // 既存ボタン/ツールバーがあれば削除
        const existingBtn = document.getElementById('debug-money-btn');
        if (existingBtn) existingBtn.remove();
        const existingToolbar = document.getElementById('debug-toolbar');
        if (existingToolbar) existingToolbar.remove();

        const toolbar = document.createElement('div');
        toolbar.id = 'debug-toolbar';
        toolbar.style.position = 'fixed';
        toolbar.style.top = '10px';
        toolbar.style.left = '10px';
        toolbar.style.zIndex = '2147483647';
        toolbar.style.display = 'flex';
        toolbar.style.flexDirection = 'column';
        toolbar.style.gap = '8px';
        toolbar.style.pointerEvents = 'none'; // コンテナ自体はクリック透過

        const createDebugBtn = (text, onClick, color = 'rgba(255, 0, 0, 0.8)') => {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.style.fontSize = '12px';
            btn.style.padding = '6px 10px';
            btn.style.backgroundColor = color;
            btn.style.color = 'white';
            btn.style.border = '1px solid white';
            btn.style.borderRadius = '4px';
            btn.style.cursor = 'pointer';
            btn.style.pointerEvents = 'auto'; // ボタンはクリック有効
            btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                onClick();
                // 共通更新処理
                SaveManager.saveGame();
                if (typeof this.updateMoney === 'function') this.updateMoney();
                if (typeof this.updateFeverVisuals === 'function') this.updateFeverVisuals();
            });
            return btn;
        };

        // 1. お金追加ボタン
        toolbar.appendChild(createDebugBtn('💰 +100万', () => {
            GameState.addMoney(1000000);
            this.showMessage('所持金 +1,000,000 G');
        }));

        // 2. フィーバー +1
        toolbar.appendChild(createDebugBtn('🔥 Fever +1', () => {
            if (!GameState.fever) GameState.fever = { value: 0, isActive: false, type: 'sun' };
            GameState.fever.value = (GameState.fever.value + 1);
            if (GameState.fever.value > 12) GameState.fever.value = 0; // ループ
            if (!GameState.fever.type) GameState.fever.type = 'sun';
            this.showMessage(`Fever Lv: ${GameState.fever.value} (${GameState.fever.type})`);
        }, 'rgba(255, 100, 0, 0.8)'));

        // 3. フィーバー -1
        toolbar.appendChild(createDebugBtn('❄️ Fever -1', () => {
            if (!GameState.fever) GameState.fever = { value: 0, isActive: false, type: 'sun' };
            GameState.fever.value = Math.max(0, GameState.fever.value - 1);
            if (!GameState.fever.type) GameState.fever.type = 'sun';
            this.showMessage(`Fever Lv: ${GameState.fever.value} (${GameState.fever.type})`);
        }, 'rgba(0, 100, 255, 0.8)'));

        // 4. タイプ切り替え
        toolbar.appendChild(createDebugBtn('🌞/🌚 Type', () => {
            if (!GameState.fever) GameState.fever = { value: 0, isActive: false, type: 'sun' };
            GameState.fever.type = GameState.fever.type === 'sun' ? 'moon' : 'sun';
            this.showMessage(`Type: ${GameState.fever.type}`);
        }, 'rgba(100, 0, 200, 0.8)'));

        document.body.appendChild(toolbar); */

        // スワイプ操作の初期化
        this.initSwipeListeners();
    },

    // ========================================
    // スワイプ操作の初期化
    // ========================================
    initSwipeListeners() {
        let touchStartX = 0;
        let touchStartY = 0;
        const minSwipeDistance = 50; // スワイプと判定する最小距離

        const handleTouchStart = (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        };

        const handleTouchEnd = (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            // 横方向のスワイプか判定 (縦方向の移動が大きすぎる場合は無視)
            if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaY) < 100) {
                if (deltaX < 0) {
                    // 左スワイプ (右へ進む)
                    if (this.currentScreen === 'fishing') {
                        // 釣り -> ショップ
                        // 釣り実行中は遷移させない（ステートでチェック）
                        if (FishingGame.state === 'idle') {
                            FishingGame.abort();
                            this.showScreen('shop');
                        }
                    }
                } else {
                    // 右スワイプ (左へ戻る)
                    if (this.currentScreen === 'shop') {
                        // ショップ -> 釣り
                        this.showScreen('fishing');
                    }
                }
            }
        };

        // 釣り画面のスワイプ設定
        const fishingScreen = document.getElementById('fishing-screen');
        if (fishingScreen) {
            fishingScreen.addEventListener('touchstart', handleTouchStart, { passive: true });
            fishingScreen.addEventListener('touchend', handleTouchEnd, { passive: true });
        }

        // ショップ画面のスワイプ設定
        const shopScreen = document.getElementById('shop-screen');
        if (shopScreen) {
            shopScreen.addEventListener('touchstart', handleTouchStart, { passive: true });
            shopScreen.addEventListener('touchend', handleTouchEnd, { passive: true });
        }
    },

    // ========================================
    // 釣り画面: 待機状態
    // ========================================
    showIdle() {
        const fishingArea = document.getElementById('fishing-area');
        if (!fishingArea) return;

        fishingArea.innerHTML = `
            <div class="idle-state">
                <div class="instruction">画面をタップしてキャスト</div>
            </div>
        `;

        // 1人称視点の釣り竿を待機状態に
        this.updateRodView('idle');
        this.hideGauge();
    },

    // ========================================
    // 釣り竿の状態更新
    // ========================================
    updateRodView(state) {
        const rodView = document.getElementById('fishing-rod-view');
        if (!rodView) return;

        rodView.className = 'fishing-rod-view';
        if (state) {
            rodView.classList.add(state);
        }

        // スキル色を適用
        const skin = GameState.getCurrentSkin();
        const rodShaft = rodView.querySelector('.rod-shaft');
        if (rodShaft) {
            rodShaft.style.backgroundColor = skin.rodColor;
            // 枠線の色も少し暗くして調整（簡易的）
            rodShaft.style.borderColor = skin.rodColor;
        }
    },

    // ========================================
    // 釣り画面: キャスト
    // ========================================
    showCasting() {
        const fishingArea = document.getElementById('fishing-area');
        if (!fishingArea) return;

        fishingArea.innerHTML = `
            <div class="casting-state">
                <div class="instruction">キャスト中...</div>
            </div>
        `;

        this.updateRodView('casting');
    },

    // ========================================
    // 釣り画面: 待機（ウキ静止）
    // ========================================
    showWaiting() {
        const fishingArea = document.getElementById('fishing-area');
        if (!fishingArea) return;

        const skin = GameState.getCurrentSkin();

        fishingArea.innerHTML = `
            <div class="waiting-state">
                <div class="water-surface">
                    <div class="bobber waiting">
                        <div class="bobber-stick"></div>
                        <div class="bobber-body" style="background-color: ${skin.bobberColor}"></div>
                    </div>
                    <div class="ripple"></div>
                </div>
            </div>
        `;

        this.updateRodView('waiting');
    },

    // ========================================
    // 釣り画面: 予兆（ウキ揺れ）
    // ========================================
    showNibble(scale = 1.0) {
        const fishingArea = document.getElementById('fishing-area');
        if (!fishingArea) return;

        const skin = GameState.getCurrentSkin();

        fishingArea.innerHTML = `
            <div class="nibble-state">
                <div class="water-surface">
                    <div class="bobber">
                        <div class="bobber-stick"></div>
                        <div class="bobber-body" style="background-color: ${skin.bobberColor}"></div>
                    </div>
                    <div class="ripple active" style="transform: scale(${scale});"></div>
                </div>
            </div>
        `;

        this.updateRodView('nibble');
    },

    // ========================================
    // ウキの揺れを1回分実行
    // ========================================
    triggerBobberShake(durationMs) {
        const bobber = document.querySelector('.bobber');
        if (!bobber) return;

        // アニメーションをリセットして実行
        bobber.classList.remove('nibbling');
        void bobber.offsetWidth; // 強制リフロー

        bobber.style.animationDuration = `${durationMs / 1000}s`;
        bobber.style.animationIterationCount = '1';
        bobber.classList.add('nibbling');
    },

    // ========================================
    // 釣り画面: ヒット
    // ========================================
    showHit() {
        const fishingArea = document.getElementById('fishing-area');
        if (!fishingArea) return;

        const skin = GameState.getCurrentSkin();

        fishingArea.innerHTML = `
            <div class="hit-state">
                <div class="water-surface">
                    <div class="bobber sinking">
                        <div class="bobber-stick"></div>
                        <div class="bobber-body" style="background-color: ${skin.bobberColor}"></div>
                    </div>
                    <div class="splash"></div>
                </div>
            </div>
        `;

        this.updateRodView('hit');

        // 画面シェイクとバイブレーションを発生させる
        this.shakeScreen();
        if (typeof navigator.vibrate === 'function') {
            navigator.vibrate([100]); // 100msのバイブレーション
        }
    },

    // ========================================
    // 画面を一時的に揺らす（スクリーンシェイク）
    // ========================================
    shakeScreen() {
        const screen = document.querySelector('.screen.active');
        if (!screen) return;

        screen.classList.remove('screen-shake');
        void screen.offsetWidth; // 強制リフロー
        screen.classList.add('screen-shake');
    },

    // ========================================
    // 釣り画面: ゲージバトル（インライン）
    // ========================================
    showGaugeBattle(fish, redZoneWidth) {
        this.redZoneWidth = redZoneWidth;

        const fishingArea = document.getElementById('fishing-area');
        if (!fishingArea) return;

        // 竿をバトル状態（奮闘中）にする
        this.updateRodView('battle');

        // ゾーンの位置を計算（中央に赤ゾーン）
        const centerStart = (100 - redZoneWidth) / 2;
        const greenStart1 = centerStart - this.greenZoneWidth;
        const greenStart2 = centerStart + redZoneWidth;

        fishingArea.innerHTML = `
            <div class="gauge-battle">
                <h2 class="gauge-battle-title">キャッチング中！</h2>
                <div class="fish-info">
                    <span class="fish-name rarity-${fish.rarity}"></span>
                    <span class="fish-power">${fish.power}</span>
                </div>
                <div class="gauge-container">
                    <div class="gauge-bar">
                        <div class="zone white-zone"></div>
                        <div class="zone green-zone" style="left: ${greenStart1}%; width: ${this.greenZoneWidth}%;"></div>
                        <div class="zone red-zone" style="left: ${centerStart}%; width: ${redZoneWidth}%;"></div>
                        <div class="zone green-zone" style="left: ${greenStart2}%; width: ${this.greenZoneWidth}%;"></div>
                        <div class="gauge-indicator" id="gauge-indicator"></div>
                    </div>
                </div>
                <div class="gauge-instruction">タイミングよくクリック！</div>
            </div>
        `;
    },

    // ========================================
    // ゲージ位置を更新
    // ========================================
    updateGaugePosition(position) {
        const indicator = document.getElementById('gauge-indicator');
        if (indicator) {
            indicator.style.left = `${position}%`;
        }
    },

    // ========================================
    // ゲージのゾーン判定
    // ========================================
    getGaugeZone(position) {
        const centerStart = (100 - this.redZoneWidth) / 2;
        const centerEnd = centerStart + this.redZoneWidth;
        const greenStart1 = centerStart - this.greenZoneWidth;
        const greenEnd2 = centerEnd + this.greenZoneWidth;

        if (position >= centerStart && position <= centerEnd) {
            return 'red';
        } else if ((position >= greenStart1 && position < centerStart) ||
            (position > centerEnd && position <= greenEnd2)) {
            return 'green';
        } else {
            return 'white';
        }
    },

    // ========================================
    // ゲージを非表示
    // ========================================
    hideGauge() {
        // インライン表示なので特に処理不要
    },

    // ========================================
    // 釣り上げ成功
    // ========================================
    showCatchSuccess(fish, onClose, count = 1, extraRewards = []) {
        const fishingArea = document.getElementById('fishing-area');
        if (!fishingArea) return;

        const fishIcon = fish.icon || 'set_meal';

        let countBadge = '';
        if (count > 1) {
            countBadge = `<div class="multi-catch-badge">${count}匹釣れた！</div>`;
        }

        // 追加報酬のHTML生成
        let extraRewardsHtml = '';
        if (extraRewards && extraRewards.length > 0) {
            const rewardItemsHtml = extraRewards.map(reward => {
                let icon = 'card_giftcard';
                if (reward.type === 'money') icon = 'paid';
                else if (reward.type === 'ticket') icon = 'confirmation_number';
                else if (reward.type === 'skill') icon = 'auto_fix_high';
                else if (reward.type === 'bait') icon = 'set_meal';
                
                return `
                    <div class="extra-reward-pill">
                        <span class="material-icons extra-reward-icon">${icon}</span>
                        <span>${reward.name} ${reward.count > 1 ? 'x' + reward.count : ''}</span>
                    </div>
                `;
            }).join('');

            extraRewardsHtml = `
                <div class="extra-rewards-section">
                    <div class="extra-rewards-title">BONUS REWARDS</div>
                    <div class="extra-rewards-list">
                        ${rewardItemsHtml}
                    </div>
                </div>
            `;
        }

        fishingArea.innerHTML = `
            <div class="result-overlay success" id="result-overlay">
                <div class="result-card rarity-${fish.rarity}">
                    <div class="card-header">NEW CATCH!</div>
                    
                    <div class="result-animation">
                        <div class="icon-circle rarity-${fish.rarity}">
                            <span class="material-icons result-icon">${fishIcon}</span>
                            <span class="material-icons sparkle-icon">auto_awesome</span>
                            <div class="rarity-glow"></div>
                        </div>
                    </div>

                    ${countBadge}

                    <div class="result-content">
                        <div class="rank-display">
                            <span class="rank-label">RANK</span>
                            <span class="rank-char rarity-${fish.rarity}">${fish.rarity}</span>
                        </div>
                        <h2 class="fish-name">${fish.name}</h2>
                        
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="label">POWER</span>
                                <span class="value">${fish.power}</span>
                            </div>
                            <div class="stat-item">
                                <span class="label">VALUE</span>
                                <span class="value">¥${fish.price.toLocaleString()}</span>
                            </div>
                        </div>

                        ${extraRewardsHtml}
                    </div>
                    
                    <div class="tap-hint">TAP TO CLOSE</div>
                </div>
            </div>
        `;

        // クリックとスペースキーで閉じる
        this.setupResultOverlayClose(onClose);
        this.updateInventory();
    },

    // ========================================
    // 釣り上げ失敗
    // ========================================
    showCatchFailed(fish, onClose) {
        const fishingArea = document.getElementById('fishing-area');
        if (!fishingArea) return;

        const fishIcon = fish.icon || 'set_meal';
        fishingArea.innerHTML = `
            <div class="result-overlay failed" id="result-overlay">
                <div class="result-card type-failed">
                    <div class="card-header">ESCAPED...</div>
                    
                    <div class="result-animation">
                        <div class="icon-circle type-failed">
                            <span class="material-icons result-icon escaped">${fishIcon}</span>
                            <span class="material-icons escape-cloud">cloud</span>
                        </div>
                    </div>

                    <div class="result-content">
                        <p class="fail-message">
                            <span class="fish-name-small">${fish.name}</span> は<br>
                            力強く逃げ去ってしまった...
                        </p>
                    </div>
                    
                    <div class="tap-hint">TAP TO CLOSE</div>
                </div>
            </div>
        `;

        // クリックとスペースキーで閉じる
        this.setupResultOverlayClose(onClose);
    },

    // ========================================
    // 結果オーバーレイのクローズ処理
    // ========================================
    setupResultOverlayClose(onClose) {
        const overlay = document.getElementById('result-overlay');
        if (!overlay) return;

        let handleKeydown;

        // クローズ処理
        const closeOverlay = () => {
            overlay.remove();
            if (handleKeydown) {
                document.removeEventListener('keydown', handleKeydown);
            }
            // コールバックを実行
            if (typeof onClose === 'function') {
                onClose();
            }
        };

        handleKeydown = (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                closeOverlay();
            }
        };

        // 誤操作防止の遅延（500ms）
        setTimeout(() => {
            // クリックで閉じる
            overlay.addEventListener('click', (e) => {
                e.stopPropagation();
                closeOverlay();
            });

            // スペースキーで閉じる
            document.addEventListener('keydown', handleKeydown);
        }, 500);
    },

    // ========================================
    // 空のビジュアルを更新
    // ========================================
    updateSkyVisuals() {
        const fishingScreen = document.getElementById('fishing-screen');
        if (!fishingScreen) return;

        const currentSky = GameState.getCurrentSky();
        if (!currentSky) return;

        // Colors are top, bottom of the sky part.
        // The sky part is roughly 0% to 35% of the screen.
        // The original CSS was: linear-gradient(180deg, #87CEEB 0%, #3b82f6 30%, #1e3a8a 100%)
        // We want to replace the top part (0-30%) with our sky gradient, and keep the ocean part (30-100%).

        // Ocean colors (fixed for now, matching original or close to it)
        // Original: #3b82f6 at 30%, #1e3a8a at 100%
        // We will construct a multi-stop gradient.

        const skyTop = currentSky.colors[0];
        const skyBottom = currentSky.colors[1];

        // Construct the new gradient
        // 0% -> skyTop
        // 30% -> skyBottom (Horizon)
        // 30% -> #3b82f6 (Ocean Surface) - slightly hard transition or smooth? 
        // Original was #87CEEB 0%, #3b82f6 30%. It was a smooth transition from sky to light blue ocean.
        // To keep the sky distinct but connected:

        const newGradient = `linear-gradient(180deg, ${skyTop} 0%, ${skyBottom} 30%, #1e3a8a 100%)`;

        fishingScreen.style.background = newGradient;
    },

    // ========================================
    // ガチャ結果表示
    // ========================================
    showGachaResult(items, onClose) {
        // 結果リストのHTML生成
        const itemsHtml = items.map(item => {
            let icon = 'auto_awesome';
            let typeLabel = 'Skill';

            if (item.category === 'skin') {
                icon = 'palette';
                typeLabel = 'Skin';
            } else if (item.category === 'sky') {
                icon = 'cloud';
                typeLabel = 'Sky';
            }

            return `
            <div class="gacha-result-item rarity-${item.tier === 3 ? 'S' : item.tier === 2 ? 'B' : 'D'}">
                <div class="gacha-item-icon">
                    <span class="material-icons">${icon}</span>
                </div>
                <div class="gacha-item-info">
                    <div class="gacha-item-name">${item.name}</div>
                    <div class="gacha-item-tier">Tier ${item.tier} (${typeLabel})</div>
                </div>
                ${item.isNew ? '<span class="new-badge">NEW!</span>' : '<span class="status-badge">済み</span>'}
            </div>
        `}).join('');

        // インベントリに加算
        items.forEach(item => {
            GameState.gainGachaResult(item);
        });

        // 既存のオーバーレイがあれば削除
        const existing = document.getElementById('result-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'result-overlay';
        overlay.className = 'result-overlay gacha-result';
        // オーバーレイのスタイルを強制適用（CSSクラスがfishing-area依存の場合に備えて）
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); z-index: 3000;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            opacity: 0; animation: fadeIn 0.3s forwards;
        `;

        overlay.innerHTML = `
            <div class="result-card gacha-card">
                <div class="card-header">GACHA RESULT</div>
                
                <div class="gacha-items-grid">
                    ${itemsHtml}
                </div>

                <div class="tap-hint">TAP TO CLOSE</div>
            </div>
        `;

        document.body.appendChild(overlay);

        this.setupResultOverlayClose(onClose);
        this.updateStatus();
    },

    // ========================================
    // 宝箱結果表示
    // ========================================
    showTreasureResult(chest, results, onClose) {
        const fishingArea = document.getElementById('fishing-area');
        if (!fishingArea) return;

        // 結果リストのHTML生成
        const itemsHtml = results.map(item => {
            let icon = 'help';
            let className = 'common';

            if (item.type === 'money') {
                icon = 'payments';
                className = 'money';
            } else if (item.type === 'bait') {
                icon = 'set_meal';
                className = 'item';
            } else if (item.type === 'skill') {
                icon = 'school';
                className = 'skill';
            } else if (item.type === 'refund') {
                icon = 'currency_exchange';
                className = 'refund';
            }

            return `
                <div class="loot-item ${className}">
                    <div class="loot-icon">
                        <span class="material-icons">${icon}</span>
                    </div>
                    <div class="loot-info">
                        <div class="loot-name">${item.name}</div>
                        ${item.count ? `<div class="loot-count">x${item.count}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        fishingArea.innerHTML = `
            <div class="result-overlay treasure-result" id="result-overlay">
                <div class="result-card rarity-${chest.treasureType}">
                    <div class="card-header">TREASURE!</div>
                    
                    <div class="result-animation">
                        <div class="icon-circle rarity-${chest.treasureType}">
                            <span class="material-icons result-icon">${chest.icon}</span>
                            <span class="material-icons sparkle-icon">auto_awesome</span>
                            <div class="rarity-glow"></div>
                        </div>
                    </div>

                    <div class="result-content">
                        <h2 class="chest-name">${chest.name}</h2>
                        <div class="loot-list">
                            ${itemsHtml}
                        </div>
                    </div>
                    
                    <div class="tap-hint">TAP TO CLOSE</div>
                </div>
            </div>
        `;

        this.setupResultOverlayClose(onClose);
        this.updateStatus();
    },

    // ========================================
    // ミス表示
    // ========================================
    showMissed(message) {
        const fishingArea = document.getElementById('fishing-area');
        if (!fishingArea) return;

        fishingArea.innerHTML = `
            <div class="result-state missed">
                <div class="missed-text">${message}</div>
            </div>
        `;
    },

    // ========================================
    // ステータス表示更新
    // ========================================
    // ステータスの更新 (お金・チケット)
    updateStatus() {
        this.updateMoney();
        // チケット表示があれば更新
        const ticketDisplay = document.getElementById('gacha-ticket-display');
        if (ticketDisplay) {
            ticketDisplay.textContent = GameState.gachaTickets;
        }
        this.updateInventory();
        this.updateRodInfo();
        this.updateBaitInfo();
        this.updateRankInfo();
    },

    // ========================================
    // 所持金更新
    // ========================================
    // ========================================
    // 所持金変動演出
    // ========================================
    showMoneyPopup(diff) {
        if (diff === 0) return;

        const isPlus = diff > 0;
        const text = isPlus ? `+${diff.toLocaleString()}` : `${diff.toLocaleString()}`;
        const color = isPlus ? '#4ade80' : '#f87171'; // Green : Red

        // Popup targets (Main money display and Casino header)
        const targets = [
            document.querySelector('.shop-money'),
            document.querySelector('#casino-screen .shop-money')
        ];

        targets.forEach(container => {
            if (!container) return;

            const popup = document.createElement('span');
            popup.className = 'money-popup';
            popup.textContent = text;
            popup.style.color = color;

            container.style.position = 'relative'; // Ensure relative positioning
            container.appendChild(popup);

            // Remove after animation
            setTimeout(() => {
                popup.remove();
            }, 1500);
        });
    },

    // ========================================
    // 所持金更新
    // ========================================
    updateMoney() {
        // Delta popup
        if (this.lastMoney !== null && this.lastMoney !== GameState.money) {
            const diff = GameState.money - this.lastMoney;
            this.showMoneyPopup(diff);
        }
        this.lastMoney = GameState.money;

        const moneyDisplay = document.getElementById('money-display');
        if (moneyDisplay) {
            moneyDisplay.textContent = `${GameState.money.toLocaleString()} G`;
        }
        // ショップ画面の所持金も更新
        const shopMoneyDisplay = document.getElementById('shop-money-display');
        if (shopMoneyDisplay) {
            shopMoneyDisplay.textContent = `¥${GameState.money.toLocaleString()}`;
        }
        // カジノ画面の所持金も更新
        const casinoMoneyDisplay = document.getElementById('casino-money-display');
        if (casinoMoneyDisplay) {
            casinoMoneyDisplay.textContent = `¥${GameState.money.toLocaleString()}`;
        }

        // パワー表示も更新
        const powerDisplay = document.getElementById('power-display');
        if (powerDisplay) {
            powerDisplay.textContent = `${GameState.getTotalPower()} P`;
        }
        if (powerDisplay) {
            powerDisplay.textContent = `${GameState.getTotalPower()} P`;
        }
    },

    // ========================================
    // ランク表示更新
    // ========================================
    updateRankInfo() {
        let rankDisplay = document.getElementById('rank-display');
        if (!rankDisplay) {
            // Create if missing, try to place near power-display
            const powerDisplay = document.getElementById('power-display');
            if (powerDisplay && powerDisplay.parentNode) {
                rankDisplay = document.createElement('div');
                rankDisplay.id = 'rank-display';
                rankDisplay.className = 'status-item';
                rankDisplay.style.marginRight = '10px';
                rankDisplay.style.fontWeight = 'bold';
                rankDisplay.style.color = '#fbbf24'; // Goldish
                // Insert before power display
                powerDisplay.parentNode.insertBefore(rankDisplay, powerDisplay);
            } else {
                return; // Can't find place
            }
        }
        const nextExp = GameState.getNextRankExp ? GameState.getNextRankExp() : '-';
        const percent = GameState.getNextRankExp ? Math.floor((GameState.exp / GameState.getNextRankExp()) * 100) : 0;
        rankDisplay.innerHTML = `RANK ${GameState.rank} <span style="font-size:0.8em; opacity:0.8;">(${percent}%)</span>`;
    },

    // ========================================
    // ランクアップ演出
    // ========================================
    // ========================================
    // ランクアップ演出
    // ========================================
    showRankUp(newRank, coinReward, ticketReward) {
        const rewards = [
            { icon: '⭐', name: `Rank ${newRank}!` },
            { icon: '💰', name: `${coinReward.toLocaleString()}G` }
        ];

        if (ticketReward > 0) {
            rewards.push({ icon: '🎫', name: `x${ticketReward}` });
        }

        this.showRewardPopup('RANK UP!', rewards, 'パワーボーナス & 報酬獲得！');

        // エフェクト（紙吹雪などあればベストだが、簡易的にメッセージ）
        this.updateRankInfo();
    },

    // ========================================
    // インベントリ更新
    // ========================================
    updateInventory() {
        const inventoryCount = document.getElementById('inventory-count');
        if (inventoryCount) {
            inventoryCount.textContent = `${GameState.inventory.length} 匹`;
        }
    },

    // ========================================
    // 釣り竿情報更新
    // ========================================
    updateRodInfo() {
        const rodInfo = document.getElementById('rod-info');
        if (!rodInfo) return;

        const rod = GameState.getCurrentRod();
        const stars = GameState.rodStars;
        let starsHtml = '';
        for (let i = 0; i < stars; i++) {
            starsHtml += '<span class="material-icons star-filled">star</span>';
        }
        for (let i = stars; i < 5; i++) {
            starsHtml += '<span class="material-icons star-empty">star_border</span>';
        }

        rodInfo.innerHTML = `
            <span class="rod-name">${rod.name}</span>
            <div class="rod-stars">${starsHtml}</div>
        `;
    },

    // ========================================
    // 餌情報更新（セレクター表示）
    // ========================================
    updateBaitInfo() {
        const baitInfo = document.getElementById('bait-info');
        if (!baitInfo) return;

        const currentBaitId = GameState.baitType;
        const bait = GAME_DATA.BAITS.find(b => b.id === currentBaitId);
        const count = GameState.getCurrentBaitCount();
        const displayCount = count === -1 ? '∞' : count;

        // user's new UI expects: BAIT (pseudo) < content >
        // We inject the buttons and the text.
        baitInfo.innerHTML = `
            <button class="selector-btn prev" onclick="GameState.switchBait(-1); UIManager.updateBaitInfo();"><span class="material-icons">chevron_left</span></button>
            <span class="bait-label-container" onclick="UIManager.showBaitPurchaseDialog('${currentBaitId}')" style="cursor: pointer;">
                <span class="bait-name-text">${bait.name}</span>
                <span class="bait-count-text">× ${displayCount}</span>
            </span>
            <button class="selector-btn next" onclick="GameState.switchBait(1); UIManager.updateBaitInfo();"><span class="material-icons">chevron_right</span></button>
        `;
    },

    // ========================================
    // 餌購入ダイアログを表示
    // ========================================
    showBaitPurchaseDialog(baitId) {
        const bait = GAME_DATA.BAITS.find(b => b.id === baitId);
        if (!bait) return;

        // Dランク（無限）は購入不可
        if (bait.rank === 'D') {
            // 無限なので何もしない
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'bait-purchase-modal';

        // 単価 (セット価格 / 個数)
        const unitPrice = bait.quantity > 0 ? bait.price / bait.quantity : 0;

        overlay.innerHTML = `
            <div class="modal-content">
                <h3>餌を購入</h3>
                <p>${bait.name} が不足しています。</p>
                <p>購入しますか？</p>
                
                <div class="purchase-options">
                    <div class="option" data-amount="${bait.quantity}">
                        <span class="amount">${bait.quantity}個</span>
                        <span class="price">¥${bait.price}</span>
                    </div>
                    <div class="option" data-amount="${bait.quantity * 5}">
                        <span class="amount">${bait.quantity * 5}個</span>
                        <span class="price">¥${bait.price * 5}</span>
                    </div>
                     <div class="option" data-amount="${bait.quantity * 10}">
                        <span class="amount">${bait.quantity * 10}個</span>
                        <span class="price">¥${bait.price * 10}</span>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-cancel" onclick="document.getElementById('bait-purchase-modal').remove()">キャンセル</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // 購入オプションのイベントリスナ
        overlay.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', () => {
                const amount = parseInt(option.dataset.amount);
                if (GameState.buyBait(baitId, amount)) {
                    this.showMessage(`${bait.name}を${amount}個購入しました！`);
                    this.updateStatus(); // お金と餌の表示更新
                    overlay.remove();
                } else {
                    this.showMessage('お金が足りません！');
                }
            });
        });
    },

    // ========================================
    // ボート通過イベント表示
    // ========================================
    showBoatEvent(callback) {
        const fishingArea = document.getElementById('fishing-screen');
        if (!fishingArea) return;

        // コンテナ取得または作成
        let container = fishingArea.querySelector('.event-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'event-container';
            fishingArea.insertBefore(container, fishingArea.firstChild); // 背景の手前
        }

        // ボート要素
        const boat = document.createElement('div');
        boat.className = 'event-boat';
        boat.innerHTML = '<span class="material-icons game-boat">sailing</span>';
        container.appendChild(boat);

        // クリーンアップ
        setTimeout(() => {
            boat.remove();
            if (callback) callback();
        }, 20000); // アニメーション時間に合わせて削除
    },

    // ========================================
    // 鳥通過イベント表示
    // ========================================
    showBirdEvent(callback) {
        const fishingArea = document.getElementById('fishing-screen');
        if (!fishingArea) return;

        // コンテナ取得または作成
        let container = fishingArea.querySelector('.event-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'event-container';
            fishingArea.insertBefore(container, fishingArea.firstChild);
        }

        // 鳥要素 (3羽: ▽フォーメーション)
        const birdsConfig = [
            { id: 1, delay: 0.0, top: 12 },   // 左上 (先頭)
            { id: 2, delay: 0.4, top: 12 },   // 右上 (後方)
            { id: 3, delay: 0.2, top: 16 }    // 下中央
        ];

        birdsConfig.forEach((config, index) => {
            const bird = document.createElement('div');
            bird.className = 'event-bird';
            bird.innerHTML = '<span class="material-icons game-bird">keyboard_arrow_down</span>';

            // ずらし
            bird.style.animationDelay = `${config.delay}s`;
            bird.style.top = `${config.top}%`;

            container.appendChild(bird);

            // クリーンアップ
            setTimeout(() => {
                bird.remove();
                if (index === 2 && callback) callback();
            }, 12000 + (config.delay * 1000));
        });
    },

    // ========================================
    // イベントメッセージ表示
    // ========================================
    // ========================================
    // イベントメッセージ表示
    // ========================================
    showEventMessage(text, icon = 'info') {
        this.showNotification('EVENT', text, icon, 4000);
    },

    // ========================================
    // フィーバー演出の更新
    // ========================================
    updateFeverVisuals() {
        // フィーバーコンテナがなければ作成
        let container = document.querySelector('.fever-container');
        if (!container) {
            const fishingScreen = document.getElementById('fishing-screen');
            if (fishingScreen) {
                container = document.createElement('div');
                container.className = 'fever-container';
                container.innerHTML = `
                <div class="fever-sky-area">
                    <div class="celestial-body sun">
                        <span class="material-icons">wb_sunny</span>
                    </div>
                    <div class="celestial-body moon">
                        <span class="material-icons">nightlight</span>
                    </div>
                </div>
            `;
                // 背景の手前、UIの後ろ
                fishingScreen.insertBefore(container, fishingScreen.firstChild);
            }
        }

        if (!container) return;

        const fever = GameState.fever;
        const sun = container.querySelector('.sun');
        const moon = container.querySelector('.moon');

        // クラスをリセット
        container.className = 'fever-container';
        container.classList.add(`fever-lv-${fever.value}`);

        // タイプ別表示
        if (fever.type === 'sun') {
            container.classList.add('type-sun');
        } else if (fever.type === 'moon') {
            container.classList.add('type-moon');
        }

        // フィーバー中は背景変化などのエフェクト
        if (fever.isActive) {
            container.classList.add('fever-active');
        }
    },

    // ========================================
    // 一時メッセージ表示
    // ========================================
    // ========================================
    // 一時メッセージ表示 (廃止 -> showNotificationへ)
    // ========================================
    showMessage(message, duration = 3000) {
        this.showNotification('INFO', message, 'info', duration);
    },

    // ========================================
    // 通知バナー表示 (New!)
    // ========================================
    showNotification(title, message, icon = 'info', duration = 3000) {
        // 既存のバナーを削除（または積み重ねることもできるが今は入れ替え）
        const existing = document.querySelector('.notification-banner');
        if (existing) existing.remove();

        const banner = document.createElement('div');
        banner.className = 'notification-banner';
        
        banner.innerHTML = `
            <span class="material-icons notification-icon">${icon}</span>
            <div class="notification-content">
                ${title ? `<div class="notification-title">${title}</div>` : ''}
                <div class="notification-message">${message}</div>
            </div>
        `;

        document.body.appendChild(banner);

        // Slide Down
        requestAnimationFrame(() => {
            banner.classList.add('show');
        });

        // Slide Up & Remove
        setTimeout(() => {
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 400); 
        }, duration);
    },

    // ========================================
    // 実績画面のレンダリング
    // ========================================
    renderStats() {
        const container = document.getElementById('stats-container');
        if (!container) return;

        const stats = {
            '累計釣り上げ数': `${GameState.totalFishCaught} 匹`,
            '累計宝箱取得数': `${GameState.totalTreasure} 個`,
            '累計獲得スキル数': `${GameState.totalSkills} 個`,
            '累計獲得コイン': `${GameState.totalCoinsEarned.toLocaleString()} G`,
            '最大釣り上げサイズ': GameState.biggestFish ? `${GameState.biggestFish.name} (${GameState.biggestFish.power})` : 'なし',
            'カジノ累計勝利額': `${GameState.casinoTotalWin.toLocaleString()} G`,
            'カジノ累計敗北額': `${GameState.casinoTotalLoss.toLocaleString()} G`,
            'ガシャチケット所持数': `${GameState.gachaTickets} 枚`
        };

        const rankStats = GameState.caughtByRank;
        const ranksHtml = Object.entries(rankStats).map(([rank, count]) => `
            <div class="stat-row">
                <span class="stat-label rank-label rarity-${rank}">Rank ${rank}</span>
                <span class="stat-value">${count} 匹</span>
            </div>
        `).join('');

        let html = '<div class="stats-group"><h3>総合統計</h3>';
        for (const [label, value] of Object.entries(stats)) {
            html += `
                <div class="stat-row">
                    <span class="stat-label">${label}</span>
                    <span class="stat-value">${value}</span>
                </div>
            `;
        }
        html += '</div>';

        html += '<div class="stats-group"><h3>ランク別釣り上げ数</h3>';
        html += ranksHtml;
        html += '</div>';

        container.innerHTML = html;
    },

    // ========================================
    // ガチャ演出と結果表示
    // ========================================
    prepareGachaScreen() {
        const handle = document.getElementById('gacha-handle');
        const machineContainer = document.getElementById('gacha-machine-container');
        const resultDisplay = document.getElementById('gacha-result-display');

        machineContainer.classList.remove('hidden');
        resultDisplay.classList.add('hidden');
        handle.classList.remove('spinning');

        // カプセルをランダムに配置
        const capsuleContainer = document.getElementById('capsule-container');
        capsuleContainer.innerHTML = '';
        const colors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa'];
        for (let i = 0; i < 20; i++) {
            const cap = document.createElement('div');
            cap.className = 'gacha-capsule';
            cap.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            cap.style.left = Math.random() * 150 + 'px';
            cap.style.top = Math.random() * 130 + 'px';
            capsuleContainer.appendChild(cap);
        }
    },

    startGachaPerformance(results, onComplete) {
        const handle = document.getElementById('gacha-handle');
        const machineContainer = document.getElementById('gacha-machine-container');
        const resultDisplay = document.getElementById('gacha-result-display');

        // ハンドルを回す
        handle.classList.add('spinning');

        // 演出ウェイト
        setTimeout(() => {
            handle.classList.remove('spinning');

            // マシンを隠して結果を表示
            machineContainer.classList.add('hidden');
            resultDisplay.classList.remove('hidden');

            this.renderGachaResults(results);

            // 閉じるボタン
            const closeBtn = document.getElementById('gacha-close-btn');
            closeBtn.onclick = () => {
                this.showScreen('shop'); // ショップに戻る
                if (onComplete) onComplete();
            };
        }, 1500);
    },

    renderGachaResults(results) {
        const container = document.getElementById('gacha-items-container');
        if (!container) return;

        container.innerHTML = '';

        results.forEach(item => {
            // ガチャ結果を GameState に反映（所持数追加）
            GameState.gainGachaResult(item);

            const ownedCount = GameState.getSkillCount(item.id);

            const card = document.createElement('div');
            card.className = `gacha-result-card rarity-${item.rarity || 'C'} ${item.isNew ? 'is-new' : ''}`;

            card.innerHTML = `
                <div class="item-icon">
                    <span class="material-icons">${item.icon || 'auto_awesome'}</span>
                </div>
                <div class="item-name">${item.name}</div>
                <div class="owned-count">所持: ${ownedCount}</div>
            `;
            container.appendChild(card);
        });
    },

    // ========================================
    // ミッションUIの更新
    // ========================================
    updateMissionUI() {
        const missionDisplay = document.getElementById('mission-display');
        const missionText = document.getElementById('mission-text');
        if (!missionDisplay || !missionText) return;

        // 初心者ミッションの場合
        const beginnerTexts = MissionManager.getCurrentMissionTexts();
        if (beginnerTexts !== null) {
            missionDisplay.classList.remove('dynamic-mode');

            // 3つのミッションをリスト表示
            let html = '';
            beginnerTexts.forEach(text => {
                html += `<div class="mission-item-row"><span class="material-icons mission-icon-small">check_circle_outline</span> ${text}</div>`;
            });
            missionText.innerHTML = html;
            return;
        }

        // 動的ミッションの場合
        if (MissionManager.isDynamicMissionActive()) {
            missionDisplay.classList.add('dynamic-mode');
            const missions = GameState.dynamicMissions;
            let html = '';
            ['A', 'B', 'C'].forEach(slot => {
                const m = missions[slot];
                if (!m) return;
                const isTicket = m.reward.type === 'ticket';
                const progressText = `${m.current}/${m.target}`;
                html += `
                    <div class="dynamic-mission-item ${isTicket ? 'ticket-reward' : ''}">
                        <span class="slot-label">${slot}</span>
                        <span class="mission-desc">${m.text} (${progressText})</span>
                        ${isTicket ? '<span class="reward-icon">🎫</span>' : ''}
                    </div>
                `;
            });
            missionText.innerHTML = html;
        } else {
            missionText.textContent = '全てのミッションを達成しました！';
        }
    },

    // = ::::::::::::::::::::::::::::::::::::::::
    // ヘルプの表示
    // ::::::::::::::::::::::::::::::::::::::::
    showHelp() {
        this.showMessage('ヘルプ: 画面をタップしてキャストし、タイミングよくタップして魚を釣りましょう！');
        MissionManager.checkMission('help_click');
    },

    // UIの初期化
    init() {
        // スタート画面の初期化
        this.initStartScreen();

        // ミッションUIの初期更新
        this.updateMissionUI();

        // ボタンのイベントリスナー設定
        document.getElementById('encyclopedia-back-btn')?.addEventListener('click', () => {
            this.showScreen('fishing'); // 釣り画面に戻る
        });

        document.getElementById('stats-back-btn')?.addEventListener('click', () => {
            this.showScreen('encyclopedia');
        });

        document.getElementById('help-btn')?.addEventListener('click', () => {
            this.showHelp();
        });

        // ガチャ画面のハンドルクリックでも回せるようにする
        document.getElementById('gacha-handle')?.addEventListener('click', () => {
            // すでに回っているか結果表示中なら無視
            const handle = document.getElementById('gacha-handle');
            if (handle.classList.contains('spinning')) return;
            const resultDisplay = document.getElementById('gacha-result-display');
            if (!resultDisplay.classList.contains('hidden')) return;

            // FIXME: ここで回すのは ShopManager 経由が良いが、
            // 演出中のハンドルクリックを「確定」などの操作に割り当てることも可能
        });
    },
    // ========================================
    // 報酬獲得ポップアップ
    // ========================================
    // ========================================
    // 報酬獲得ポップアップ (通知バナー版)
    // ========================================
    showRewardPopup(title, items, missionName = '') {
        console.log('🎉 showRewardPopup called:', title, items, missionName);
        
        // 通知バナーに表示するテキストを作成
        let message = '';
        if (missionName) {
            message += `${missionName}\n`;
        }
        
        const rewardsText = items.map(item => `${item.name}`).join(', ');
        if (rewardsText) {
            message += `報酬: ${rewardsText}`;
        }

        // 通知を表示
        this.showNotification(title, message, 'emoji_events', 4000);
    },

    // ========================================
    // ヘルプ画面
    // ========================================
    openHelp() {
        const modal = document.getElementById('help-modal');
        if (modal) {
            modal.style.display = 'flex'; // フレックス表示を確実に
            // requestAnimationFrameで少し遅らせてopacityを適用（transition有効化のため）
            requestAnimationFrame(() => {
                modal.classList.remove('hidden');
            });

            // デフォルトタブをリセット（または前回の状態を記憶するか？今回はリセットで）
            this.switchHelpTab('help-fishing');
        }
    },

    closeHelp() {
        const modal = document.getElementById('help-modal');
        if (modal) {
            modal.classList.add('hidden');
            // transition完了後にdisplay:noneにする（cssで pointer-events:none にしてるのでそのままでもいいが、念のため）
            setTimeout(() => {
                if (modal.classList.contains('hidden')) {
                    modal.style.display = 'none';
                }
            }, 300);
        }
    },

    switchHelpTab(targetId) {
        // タブのアクティブ切り替え
        document.querySelectorAll('.help-tab').forEach(tab => {
            if (tab.dataset.target === targetId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // コンテンツの表示切り替え
        document.querySelectorAll('.help-section').forEach(section => {
            if (section.id === targetId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
    },

    initHelp() {
        // 閉じるボタン
        const closeBtn = document.getElementById('help-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeHelp());
        }

        // タブ切り替え
        document.querySelectorAll('.help-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchHelpTab(e.target.dataset.target);
            });
        });

        // モーダル外クリックで閉じる
        const modal = document.getElementById('help-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeHelp();
                }
            });
        }
    }
};

// CSSを動的に追加（stats-container用）
const statsStyles = document.createElement('style');
statsStyles.textContent = `
    .stats-container {
        padding: 16px;
        color: var(--text-primary);
    }
    .stats-group {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .stats-group h3 {
        margin-top: 0;
        margin-bottom: 12px;
        color: #ffd700;
        font-size: 1.1rem;
        border-bottom: 1px solid rgba(255, 215, 0, 0.3);
        padding-bottom: 4px;
    }
    .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .stat-row:last-child {
        border-bottom: none;
    }
    .stat-label {
        color: var(--text-secondary);
        font-size: 0.9rem;
    }
    .stat-value {
        font-weight: bold;
        color: var(--text-primary);
    }
`;
document.head.appendChild(statsStyles);

// 報酬ポップアップ用CSS
const rewardPopupStyles = document.createElement('style');
rewardPopupStyles.textContent = `
    .reward-popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s;
    }
    .reward-popup-overlay.show {
        opacity: 1;
    }
    .reward-popup {
        background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
        border: 3px solid #ffd700;
        border-radius: 20px;
        padding: 32px 40px;
        text-align: center;
        transform: scale(0.8);
        transition: transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
        box-shadow: 0 0 30px rgba(255, 215, 0, 0.4), 0 10px 40px rgba(0,0,0,0.5);
        min-width: 280px;
        max-width: 90%;
    }
    .reward-popup-overlay.show .reward-popup {
        transform: scale(1);
    }
    .reward-title {
        color: #ffd700;
        font-size: 1.6rem;
        font-weight: bold;
        margin-bottom: 20px;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
        letter-spacing: 2px;
    }
    .reward-content {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 16px;
        margin-bottom: 24px;
    }
    .reward-item {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .reward-icon-container {
        font-size: 3rem;
        margin-bottom: 8px;
        filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.6));
        animation: rewardBounce 0.5s ease-out;
    }
    @keyframes rewardBounce {
        0% { transform: scale(0); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }
    .reward-name {
        color: #fff;
        font-size: 1.1rem;
        font-weight: bold;
    }
    .reward-close-btn {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        border: none;
        padding: 12px 32px;
        border-radius: 25px;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
    }
    .reward-close-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(37, 99, 235, 0.6);
    }
    .reward-mission-name {
        color: #e0e7ff;
        font-size: 1.1rem;
        margin-bottom: 16px;
    }
`;
document.head.appendChild(rewardPopupStyles);

// グローバルに公開
if (typeof window !== 'undefined') {
    window.UIManager = UIManager;
}
UIManager.init();
