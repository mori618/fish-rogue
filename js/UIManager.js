// UIマネージャー
// 画面表示、アニメーション、エフェクトを管理

const UIManager = {
    // ========================================
    // 現在の画面
    // ========================================
    currentScreen: 'start',  // start, fishing, harbor, encyclopedia
    lastMoney: null,
    holdRunPanel: false,   // 釣果カード表示中は進捗バーを止め、金額が飛んできてから伸ばす

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
            document.body.dataset.screen = screenId;
        }

        // 竿の描画ループと波の音は釣り画面にいる間だけ動かす
        if (screenId !== 'fishing') {
            RodAnimator.stop();
            SoundManager.stopAmbient();
        } else {
            SoundManager.startAmbient();
        }

        // 画面固有の初期化
        if (screenId === 'start') {
            this.initStartScreen();
        } else if (screenId === 'fishing') {
            RodAnimator.start();
            this.showIdle();
            this.updateStatus();
            this.updateSkyVisuals();
            // 下部HUDの中身が入って高さが決まってから、竿の位置を合わせる
            RodAnimator.resize();
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

        this.updateSoundButtons();

        const record = document.getElementById('start-record');
        if (record) {
            const meta = SaveManager.loadMeta();
            record.textContent = meta.totalRuns > 0
                ? `最高記録: ラウンド${meta.bestRound} クリア${meta.clears > 0 ? ` ／ 釣り旅達成 ${meta.clears}回` : ''}`
                : '';
        }
    },

    // 効果音のオン／オフ表示（タイトルと装備画面のボタン）
    updateSoundButtons() {
        document.querySelectorAll('.rg-sound-btn').forEach(btn => {
            btn.innerHTML = `<span class="material-icons">${SoundManager.enabled ? 'volume_up' : 'volume_off'}</span> 効果音 ${SoundManager.enabled ? 'オン' : 'オフ'}`;
        });
    },

    toggleSound() {
        SoundManager.unlock();
        SoundManager.toggle();
        this.updateSoundButtons();
    },

    // ========================================
    // 釣り画面のステータス表示をまとめて更新
    // ========================================
    updateStatus() {
        this.updateMoney();
        this.updateRunPanel();
        this.updateChips();
        this.updateBaitInfo();
    },
    // 所持金とパワー
    updateMoney() {
        const money = `${GameState.money.toLocaleString()} G`;
        ['money-display', 'shop-money-display'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = money;
        });

        // 増減を数字の横に短く浮かせる
        if (this.lastMoney !== null && GameState.money !== this.lastMoney) {
            this.showMoneyPopup(GameState.money - this.lastMoney);
        }
        this.lastMoney = GameState.money;

        const powerDisplay = document.getElementById('power-display');
        if (powerDisplay) {
            powerDisplay.textContent = `${GameState.getTotalPower()} P`;
        }
    },

    showMoneyPopup(diff) {
        const target = this.currentScreen === 'harbor'
            ? document.getElementById('shop-money-display')
            : document.getElementById('money-display');
        if (!target || !target.parentElement) return;

        if (diff > 0) SoundManager.play('coin', { combo: GameState.run ? GameState.run.combo : 0 });

        const popup = document.createElement('span');
        popup.className = `rg-money-popup ${diff > 0 ? 'plus' : 'minus'}`;
        popup.textContent = `${diff > 0 ? '+' : ''}${diff.toLocaleString()}`;
        target.parentElement.appendChild(popup);
        setTimeout(() => popup.remove(), 1200);
    },
    // ラウンドと目標の進み具合
    updateRunPanel() {
        const run = GameState.run;
        if (!run || this.holdRunPanel) return;

        const label = document.getElementById('round-label');
        const text = document.getElementById('round-progress-text');
        const bar = document.getElementById('round-progress-bar');
        const progress = document.getElementById('round-progress');
        if (label) label.textContent = `R${run.round}`;

        // 達成前は「あと○G」。達成後は次の評価までの残り
        if (text) {
            if (!run.reached && run.earned >= run.target && (!run.nushi || run.nushi.caught)) {
                text.textContent = '目標達成！';
            } else if (!run.reached && run.earned >= run.target && run.nushi && !run.nushi.caught) {
                text.textContent = 'ヌシを釣れ！';
            } else if (!run.reached) {
                text.textContent = `あと ${Math.max(0, run.target - run.earned).toLocaleString()} G`;
            } else {
                const next = [...GAME_DATA.ROGUE_CONFIG.grades].reverse().find(g => run.earned < run.target * g.rate);
                text.textContent = next
                    ? `${next.name}まで ${Math.ceil(run.target * next.rate - run.earned).toLocaleString()} G`
                    : '評価 金';
            }
        }

        // 達成前は目標までのバー。達成後は目標の2倍までに伸ばし、銀・金の目盛りを出す
        const scale = run.reached ? run.target * 2 : run.target;
        if (bar) bar.style.width = `${Math.min(100, (run.earned / scale) * 100)}%`;
        if (progress) progress.classList.toggle('rg-reached', run.reached);
        ['silver', 'gold'].forEach(id => {
            const mark = document.getElementById(`round-mark-${id}`);
            const grade = GAME_DATA.ROGUE_CONFIG.grades.find(g => g.id === id);
            if (!mark || !grade) return;
            mark.classList.toggle('hidden', !run.reached);
            mark.style.left = `${(grade.rate / 2) * 100}%`;
        });

        const returnBtn = document.getElementById('return-btn');
        if (returnBtn) returnBtn.classList.toggle('hidden', !(run.reached && run.phase === 'fishing'));

        this.updateRunWarning();
    },

    // 餌が残り少ないのに目標に届いていないとき、残りの投数と1投あたりの必要額を出し、画面の縁を赤くする
    updateRunWarning() {
        const run = GameState.run;
        const warning = document.getElementById('run-warning');
        const screen = document.getElementById('fishing-screen');
        if (!run || !warning || !screen) return;

        const casts = GameState.getTotalBaitCount();
        const need = run.target - run.earned;
        const danger = run.phase === 'fishing' && !run.reached && casts > 0 && casts <= 5;
        warning.classList.toggle('hidden', !danger);
        screen.classList.toggle('rg-danger', danger);
        if (danger) {
            warning.textContent = need <= 0
                ? `残り${casts}投・ヌシがまだ（${run.nushi.name}）`
                : `残り${casts}投・あと${need.toLocaleString()}G（1投あたり${Math.ceil(need / casts).toLocaleString()}G）`;
        }
    },

    // 目標達成: バーが光って緑に変わり、「宿へ戻る」が右下から出てくる
    celebrateGoal() {
        const progress = document.getElementById('round-progress');
        if (progress) {
            progress.classList.remove('rg-flash');
            void progress.offsetWidth;
            progress.classList.add('rg-flash');
        }
        const returnBtn = document.getElementById('return-btn');
        if (returnBtn) {
            returnBtn.classList.remove('rg-slide-in');
            void returnBtn.offsetWidth;
            returnBtn.classList.add('rg-slide-in');
        }
    },

    // 金額の文字を、釣果カードの位置から進捗バーまで飛ばす
    flyEarnedToBar(text, onArrive) {
        const from = document.querySelector('#result-overlay .rg-earned-value');
        const to = document.getElementById('round-progress');
        if (!from || !to) {
            onArrive();
            return;
        }
        const a = from.getBoundingClientRect();
        const b = to.getBoundingClientRect();
        const fly = document.createElement('div');
        fly.className = 'rg-fly-amount';
        fly.textContent = text;
        fly.style.left = `${a.left + a.width / 2}px`;
        fly.style.top = `${a.top + a.height / 2}px`;
        document.body.appendChild(fly);
        requestAnimationFrame(() => {
            fly.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(0.6)`;
            fly.style.opacity = '0.2';
        });
        setTimeout(() => {
            fly.remove();
            onArrive();
        }, 480);
    },

    // 釣り上げた瞬間、ウキの位置で「×3」が弾ける
    popCombo(combo) {
        if (combo < 2) return;
        const screen = document.getElementById('fishing-screen');
        const bob = RodAnimator.bobber;
        if (!screen || !bob) return;
        const pop = document.createElement('div');
        pop.className = 'rg-combo-pop';
        pop.textContent = `×${combo}`;
        pop.style.left = `${bob.x}px`;
        pop.style.top = `${bob.y - 30}px`;
        screen.appendChild(pop);
        setTimeout(() => pop.remove(), 900);
    },

    // コンボが途切れた: チップが割れて落ちる
    breakCombo(combo) {
        const chip = document.getElementById('combo-chip');
        if (!chip || combo < 2) return;
        const shard = chip.cloneNode(true);
        shard.removeAttribute('id');
        shard.classList.remove('hidden');
        shard.classList.add('rg-chip-break');
        const rect = chip.getBoundingClientRect();
        shard.style.left = `${rect.left}px`;
        shard.style.top = `${rect.top}px`;
        document.body.appendChild(shard);
        setTimeout(() => shard.remove(), 800);
    },
    // パワー以外のチップ（コンボ・釣り場）
    updateChips() {
        const run = GameState.run;
        if (!run) return;

        const combo = document.getElementById('combo-chip');
        if (combo) {
            const bonus = GameState.getComboBonus();
            combo.classList.toggle('hidden', run.combo < 1);
            combo.textContent = `×${run.combo} +${Math.round(bonus * 100)}%`;
        }

        // ヌシ: まだなら「ヌシ」、釣ったら「ヌシ済」
        const nushiChip = document.getElementById('nushi-chip');
        if (nushiChip) {
            nushiChip.classList.toggle('hidden', !run.nushi);
            if (run.nushi) {
                nushiChip.classList.toggle('rg-done', run.nushi.caught);
                nushiChip.innerHTML = `<span class="material-icons">${run.nushi.caught ? 'check_circle' : 'emoji_events'}</span>`;
                nushiChip.title = `ヌシ：${run.nushi.name}${run.nushi.caught ? '（釣った）' : ''}`;
                nushiChip.setAttribute('aria-label', nushiChip.title);
            }
        }

        // まき餌の残り投数
        const chumChip = document.getElementById('chum-chip');
        if (chumChip) {
            chumChip.classList.toggle('hidden', !(run.chum > 0));
            chumChip.textContent = `撒×${run.chum || 0}`;
        }

        const areaChip = document.getElementById('area-chip');
        const weather = GameState.getCurrentWeather();
        if (areaChip && weather) {
            areaChip.innerHTML = `<span class="material-icons">${weather.icon}</span><span>${GameState.getSpotDisplayName()}</span>`;
            areaChip.title = weather.description;
        }
    },

    // ラウンド開始: 画面中央に「ROUND 3 嵐の堤防」を1秒ほど出す
    showRoundIntro() {
        const run = GameState.run;
        if (!run) return;
        const region = GameState.getCurrentRegion();
        const weather = GameState.getCurrentWeather();
        const highValue = GAME_DATA.FISH.find(f => f.id === run.highValue);
        const supply = GAME_DATA.BAITS.find(b => b.id === run.supply.id);

        document.querySelectorAll('.rg-round-intro').forEach(el => el.remove());
        const intro = document.createElement('div');
        intro.className = 'rg-round-intro';
        intro.innerHTML = `
            <div class="rg-intro-region">${region ? region.name : ''}</div>
            <div class="rg-intro-round">ROUND ${run.round}</div>
            <div class="rg-intro-spot">${GameState.getSpotDisplayName()}</div>
            <div class="rg-intro-detail">目標 ${run.target.toLocaleString()} G ／ ${supply.name}×${run.supply.count}</div>
            ${highValue ? `<div class="rg-intro-detail">本日の高値: ${highValue.name}</div>` : ''}
            ${run.nushi ? `<div class="rg-intro-nushi">ヌシ戦：${run.nushi.name}を釣り上げろ</div>` : ''}
            ${weather && weather.tags.length ? `<div class="rg-intro-tags">${weather.tags.map(t => `<span class="rg-tag ${t.good ? 'good' : 'bad'}">${t.text}</span>`).join('')}</div>` : ''}
        `;
        intro.addEventListener('pointerdown', e => {
            e.stopPropagation();
            intro.remove();
        });
        document.getElementById('fishing-screen').appendChild(intro);
        setTimeout(() => intro.classList.add('hide'), 1600);
        setTimeout(() => intro.remove(), 2100);
    },
    // 餌セレクター（所持している餌の切り替えと残り数）
    updateBaitInfo() {
        const slots = document.getElementById('bait-info');
        if (!slots) return;

        // 持っている餌を丸いスロットで並べ、タップで選ぶ
        const owned = GAME_DATA.BAITS.filter(b => GameState.getBaitCount(b.id) > 0);
        slots.innerHTML = owned.map(bait => {
            const count = GameState.getBaitCount(bait.id);
            const selected = bait.id === GameState.baitType;
            return `
                <button class="rg-bait-slot ${selected ? 'selected' : ''}" onclick="UIManager.selectBait('${bait.id}')" aria-label="${bait.name} ${count}個">
                    <span class="rg-bait-rank ${bait.special ? 'rg-bait-special' : `rarity-${bait.rank}`}">${bait.label || bait.rank}</span>
                    <span class="rg-bait-count ${count <= 1 ? 'rg-low' : ''}">×${count}</span>
                </button>
            `;
        }).join('') || '<div class="rg-bait-empty">餌がありません</div>';

        const total = GameState.getTotalBaitCount();
        const totalEl = document.getElementById('bait-total');
        if (totalEl) {
            totalEl.textContent = `残りの餌 ${total}`;
            totalEl.classList.toggle('rg-low', total <= 3);
        }
    },

    selectBait(baitId) {
        if (FishingGame.state !== 'idle' || GameState.getBaitCount(baitId) <= 0) return;
        GameState.baitType = baitId;
        this.updateBaitInfo();
    },
    // ========================================
    // 釣り画面: 待機状態
    // ========================================
    showIdle() {
        const fishingArea = document.getElementById('fishing-area');
        if (!fishingArea) return;

        // 「タップでキャスト」の案内は最初の3投だけ。以降は海と竿だけを見せる
        const firstCasts = SaveManager.loadMeta().casts < 3;
        fishingArea.innerHTML = firstCasts
            ? `<div class="idle-state"><div class="instruction">画面をタップしてキャスト</div></div>`
            : '';

        this.updateRodView('idle');
        this.hideGauge();
    },
    // ========================================
    // 釣り竿の状態更新
    // ========================================
    updateRodView(state, options = {}) {
        // 竿・糸・ウキの描画は RodAnimator が担当する。ここは状態名を渡すだけ
        RodAnimator.setState(state || 'idle', options);
    },
    // ========================================
    // 釣り画面: キャスト
    // ========================================
    showCasting() {
        const fishingArea = document.getElementById('fishing-area');
        if (!fishingArea) return;

        // キャスト中は文字を出さず、竿の振りとウキの飛ぶ様子を見せる
        fishingArea.innerHTML = '';
        this.updateRodView('casting');
    },
    // ========================================
    // 釣り画面: 待機（ウキ静止）
    // ========================================
    showWaiting() {
        const fishingArea = document.getElementById('fishing-area');
        if (!fishingArea) return;

        fishingArea.innerHTML = '';
        this.updateRodView('waiting');
    },
    // ========================================
    // 釣り画面: 予兆（ウキ揺れ）
    // ========================================
    showNibble(scale = 1.0) {
        const fishingArea = document.getElementById('fishing-area');
        if (!fishingArea) return;

        fishingArea.innerHTML = '';
        // 沈みの深さと魚影の大きさに使う（餌より上のランクの魚ほど大きい）
        this.nibbleScale = scale;
        this.updateRodView('nibble');
    },
    // ========================================
    // ウキの揺れを1回分実行
    // ========================================
    triggerBobberShake() {
        RodAnimator.nibble(this.nibbleScale || 1);
    },
    // ========================================
    // 釣り画面: ヒット
    // ========================================
    showHit() {
        const fishingArea = document.getElementById('fishing-area');
        if (!fishingArea) return;

        fishingArea.innerHTML = '';
        const fish = FishingGame.currentFish;
        this.updateRodView('hit', { rarity: fish ? fish.rarity : 'D' });

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
    showGaugeBattle(fish, redZoneWidth, info = null) {
        this.redZoneWidth = redZoneWidth;

        const fishingArea = document.getElementById('fishing-area');
        if (!fishingArea) return;

        // 竿をバトル状態にする（力関係で、しなりの強さと竿先の震えが変わる）
        this.updateRodView('battle', {
            rarity: fish.rarity,
            matchup: info ? info.matchup.id : 'even'
        });

        // ゾーンの位置を計算（中央に赤ゾーン）
        const centerStart = (100 - redZoneWidth) / 2;
        const greenStart1 = centerStart - this.greenZoneWidth;
        const greenStart2 = centerStart + redZoneWidth;

        // 相手の強さと、ゾーンごとの捕獲率（どこを狙うべきかを一目で）
        const pct = v => `${Math.round(v * 100)}%`;
        const phaseDots = info && info.phases > 1
            ? `<div class="rg-phase-dots">${Array.from({ length: info.phases }, (_, i) =>
                `<span class="${i < info.phase ? 'on' : ''}"></span>`).join('')}</div>`
            : '';
        const header = info ? `
                <div class="rg-battle-info">
                    <div class="rg-battle-rank">${fish.isNushi ? `<span class="rg-nushi-tag">ヌシ</span> ${fish.name}` : `<span class="rarity-${fish.rarity}">${fish.rarity}ランク</span>の魚`}</div>
                    <div class="rg-matchup rg-matchup-${info.matchup.id}">${info.matchup.label}</div>
                    <div class="rg-battle-power">自分 ${info.power} ／ 魚 ${fish.power}</div>
                    ${phaseDots}
                </div>` : '';

        fishingArea.innerHTML = `
            <div class="gauge-battle">
                ${header}
                <div class="gauge-container">
                    <div class="gauge-bar">
                        <div class="zone white-zone">${info ? `<span class="rg-zone-label rg-left">${pct(info.rates.white)}</span><span class="rg-zone-label rg-right">${pct(info.rates.white)}</span>` : ''}</div>
                        <div class="zone green-zone" style="left: ${greenStart1}%; width: ${this.greenZoneWidth}%;">${info ? `<span class="rg-zone-label">${pct(info.rates.green)}</span>` : ''}</div>
                        <div class="zone red-zone" style="left: ${centerStart}%; width: ${redZoneWidth}%;">${info ? `<span class="rg-zone-label">${pct(info.rates.red)}</span>` : ''}</div>
                        <div class="zone green-zone" style="left: ${greenStart2}%; width: ${this.greenZoneWidth}%;">${info ? `<span class="rg-zone-label">${pct(info.rates.green)}</span>` : ''}</div>
                        <div class="gauge-indicator" id="gauge-indicator"></div>
                    </div>
                    <div class="rg-stop-label" id="gauge-stop-label"></div>
                </div>
                <div class="gauge-instruction">赤で止めろ！</div>
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
        // 針が赤ゾーンに近いほど竿が大きくしなる
        RodAnimator.setGauge(position);
    },

    // ゲージを止めた瞬間: 針が光り、止めたゾーンの名前を出す
    showGaugeStop(zone) {
        const indicator = document.getElementById('gauge-indicator');
        const label = document.getElementById('gauge-stop-label');
        if (indicator) indicator.classList.add('rg-stopped', `rg-stopped-${zone}`);
        if (label) {
            label.textContent = { red: '赤！', green: '緑', white: '白…' }[zone];
            label.className = `rg-stop-label show rg-stop-${zone}`;
            label.style.left = indicator ? indicator.style.left : '50%';
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
    showCatchSuccess(fish, onClose, count = 1, extraRewards = [], earned = fish.price, options = {}) {
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
                else if (reward.type === 'nushi') icon = 'emoji_events';
                
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
            <div class="result-overlay success rg-light-dim" id="result-overlay" style="--from-x: ${RodAnimator.layout ? RodAnimator.layout.water.x : 0}px; --from-y: ${RodAnimator.layout ? RodAnimator.layout.water.y : 0}px;">
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
                                <span class="value rg-earned-value">+${earned.toLocaleString()} G</span>
                            </div>
                        </div>

                        ${options.comboBonus > 0 ? `<div class="rg-combo-line">コンボ +${Math.round(options.comboBonus * 100)}%</div>` : ''}
                        ${extraRewardsHtml}
                    </div>
                    
                    <div class="tap-hint">${options.autoClose ? 'TAP TO SKIP' : 'TAP TO CLOSE'}</div>
                </div>
            </div>
        `;

        // 閉じるときに金額が上部の進捗バーへ飛び、着いたらバーが伸びる
        this.holdRunPanel = true;
        const closeWithFly = () => {
            this.flyEarnedToBar(`+${earned.toLocaleString()} G`, () => {
                this.holdRunPanel = false;
                this.updateRunPanel();
            });
            if (typeof onClose === 'function') onClose();
        };

        // 通常の釣果は自動で閉じる（称号付き・スキル獲得のときはタップ待ち）
        this.setupResultOverlayClose(closeWithFly, options.autoClose ? 1500 : 0);
    },

    // ========================================
    // 釣り上げ失敗
    // ========================================
    showCatchFailed(fish, onClose, reason = '') {
        this.updateRodView('fail');

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
                        ${reason ? `<p class="rg-fail-reason">${reason}</p>` : ''}
                    </div>
                    
                    <div class="tap-hint">TAP TO CLOSE</div>
                </div>
            </div>
        `;

        // 理由を読める時間だけ出して自動で閉じる
        this.setupResultOverlayClose(onClose, 2000);
    },

    // ========================================
    // 結果オーバーレイのクローズ処理
    // ========================================
    setupResultOverlayClose(onClose, autoCloseMs = 0) {
        const overlay = document.getElementById('result-overlay');
        if (!overlay) return;

        let closed = false;
        let autoTimer = null;

        const handleKeydown = (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                closeOverlay();
            }
        };

        // 二重に閉じないようにする（自動クローズとタップが重なる場合）
        const closeOverlay = () => {
            if (closed) return;
            closed = true;
            clearTimeout(autoTimer);
            overlay.remove();
            document.removeEventListener('keydown', handleKeydown);
            if (typeof onClose === 'function') onClose();
        };

        if (autoCloseMs > 0) autoTimer = setTimeout(closeOverlay, autoCloseMs);

        // 誤操作防止の遅延（自動クローズ時は短め）
        setTimeout(() => {
            overlay.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                closeOverlay();
            });
            document.addEventListener('keydown', handleKeydown);
        }, autoCloseMs > 0 ? 250 : 500);
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

        // 水の色と岸辺の景色は水域ごとに変える（池の緑、川の青、沿岸、外洋の紺）
        const region = GameState.getCurrentRegion();
        const water = region ? region.water : ['#3b82f6', '#1e3a8a'];
        fishingScreen.dataset.region = region ? region.id : '';

        const newGradient = `linear-gradient(180deg, ${skyTop} 0%, ${skyBottom} 29.5%, ${water[0]} 30%, ${water[1]} 100%)`;

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
        this.updateRodView('fail');
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
    showMessage(message, duration = 1500) {
        // 小さなメッセージは画面下の短いトースト（通知バナーはフィーバーとイベント専用）
        document.querySelectorAll('.rg-toast').forEach(el => el.remove());
        const toast = document.createElement('div');
        toast.className = 'rg-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('hide'), Math.max(600, duration - 300));
        setTimeout(() => toast.remove(), duration);
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
