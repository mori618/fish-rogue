// UIマネージャー
// 画面表示、アニメーション、エフェクトを管理

const UIManager = {
    // ========================================
    // 現在の画面
    // ========================================
    currentScreen: 'start',  // start, fishing, harbor, encyclopedia

    // ========================================
    // ゲージバトル設定
    // ========================================
    redZoneWidth: 10,
    greenZoneWidth: 15,

    // ========================================
    // 画面切り替え
    // ========================================
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        const screen = document.getElementById(`${screenId}-screen`);
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenId;
        }

        // 画面固有の初期化
        if (screenId === 'start') {
            this.initStartScreen();
        } else if (screenId === 'fishing') {
            this.showIdle();
            this.updateStatus();
            this.updateSkyVisuals();
        } else if (screenId === 'harbor') {
            HarborUI.render();
        } else if (screenId === 'encyclopedia') {
            EncyclopediaManager.render();
        }
    },

    // ========================================
    // スタート画面（つづきからボタンと最高記録）
    // ========================================
    initStartScreen() {
        const continueBtn = document.getElementById('continue-btn');
        if (continueBtn) {
            continueBtn.classList.toggle('hidden', !SaveManager.hasSaveData());
        }

        const record = document.getElementById('start-record');
        if (record) {
            const meta = SaveManager.loadMeta();
            record.textContent = meta.totalRuns > 0
                ? `最高記録: ラウンド${meta.bestRound} クリア${meta.clears > 0 ? ` ／ 航海達成 ${meta.clears}回` : ''}`
                : '';
        }
    },

    // ========================================
    // 釣り画面のステータス表示をまとめて更新
    // ========================================
    updateStatus() {
        this.updateMoney();
        this.updateRunPanel();
        this.updateRodInfo();
        this.updateBaitInfo();
    },

    // 所持金とパワー
    updateMoney() {
        const money = `${GameState.money.toLocaleString()} G`;
        ['money-display', 'shop-money-display'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = money;
        });

        const powerDisplay = document.getElementById('power-display');
        if (powerDisplay) {
            powerDisplay.textContent = `${GameState.getTotalPower()} P`;
        }
    },

    // ラウンドと目標の進み具合
    updateRunPanel() {
        const run = GameState.run;
        if (!run) return;

        const finalRound = GAME_DATA.ROGUE_CONFIG.finalRound;
        const label = document.getElementById('round-label');
        const text = document.getElementById('round-progress-text');
        const bar = document.getElementById('round-progress-bar');

        if (label) label.textContent = run.round <= finalRound ? `ROUND ${run.round} / ${finalRound}` : `ROUND ${run.round}（エンドレス）`;
        if (text) text.textContent = `${run.earned.toLocaleString()} / ${run.target.toLocaleString()} G`;
        if (bar) bar.style.width = `${Math.min(100, (run.earned / run.target) * 100)}%`;
    },

    // 餌セレクター（所持している餌の切り替えと残り数）
    updateBaitInfo() {
        const baitInfo = document.getElementById('bait-info');
        if (!baitInfo) return;

        const bait = GAME_DATA.BAITS.find(b => b.id === GameState.baitType) || GAME_DATA.BAITS[0];
        const count = GameState.getBaitCount(bait.id);
        const total = GameState.getTotalBaitCount();
        const ownedTypes = GAME_DATA.BAITS.filter(b => GameState.getBaitCount(b.id) > 0).length;
        const arrowsHidden = ownedTypes <= 1 ? 'style="visibility: hidden;"' : '';

        baitInfo.innerHTML = `
            <button class="selector-btn prev" ${arrowsHidden} onclick="GameState.switchBait(-1); UIManager.updateBaitInfo();"><span class="material-icons">chevron_left</span></button>
            <span class="bait-label-container">
                <span class="bait-name-text">${bait.name}</span>
                <span class="bait-count-text">× ${count}</span>
            </span>
            <button class="selector-btn next" ${arrowsHidden} onclick="GameState.switchBait(1); UIManager.updateBaitInfo();"><span class="material-icons">chevron_right</span></button>
        `;

        const totalEl = document.getElementById('bait-total');
        if (totalEl) {
            totalEl.textContent = `残りの餌 合計 ${total}`;
            totalEl.classList.toggle('rg-low', total <= 3);
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
    showCatchSuccess(fish, onClose, count = 1, extraRewards = [], earned = fish.price) {
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
                                <span class="label">水揚げ</span>
                                <span class="value">+${earned.toLocaleString()} G</span>
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


// グローバルに公開
if (typeof window !== 'undefined') {
    window.UIManager = UIManager;
}
