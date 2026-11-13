// 釣り宿（ラウンド間）画面と、釣り旅まわりのモーダルの描画
// 状態の変更はすべて RunManager 経由で行い、ここは表示と入力の受け渡しだけを担当する。
//
// 釣り宿は1画面: 上に常時表示のビルド帯、その下に「結果と報酬3択」→「ショップ」、
// フッターの釣り場カードがそのまま出発ボタンになる。

const HarborUI = {
    TIER_LABELS: { 0: '特別', 1: 'I', 2: 'II', 3: 'III', 4: '極' },

    // ========================================
    // 釣り宿画面
    // ========================================
    render() {
        const run = GameState.run;
        const main = document.getElementById('harbor-main');
        if (!main || !run || !run.harbor) return;

        const harbor = run.harbor;
        document.getElementById('harbor-title').textContent = `釣り宿 ― R${run.round} クリア`;
        UIManager.updateMoney();

        main.innerHTML = this.buildHtml() + (harbor.rewardTaken
            ? this.shopHtml(harbor)
            : this.summaryHtml(harbor.summary) + this.rewardHtml(harbor));

        document.getElementById('harbor-next').innerHTML = this.areaHtml(harbor);
    },

    // ----------------------------------------
    // ビルド帯（竿・パワー・スキル。アイコンをタップで詳細）
    // ----------------------------------------
    buildHtml() {
        const slots = GameState.getSkillSlots();
        const equipped = GameState.equippedSkills;

        const icon = (id, extra = '') => {
            const skill = GameState.getSkillData(id);
            return `<button class="rg-skill-chip rg-tier-${skill.tier} ${extra}" onclick="HarborUI.showSkill('${id}', ${extra ? 'false' : 'true'})" title="${skill.name}">
                <span class="material-icons">${skill.icon || 'auto_fix_high'}</span>
            </button>`;
        };

        const equippedIcons = equipped.map(id => icon(id)).join('');
        const emptyIcons = Array.from({ length: Math.max(0, slots - equipped.length) },
            () => `<span class="rg-skill-chip rg-empty"></span>`).join('');

        // 装備していない分（所持数 − 装備数）を控えとして並べる
        const benchIds = [];
        Object.keys(GameState.skillInventory).forEach(id => {
            const spare = GameState.getSkillCount(id) - GameState.getEquippedSkillCount(id);
            for (let i = 0; i < spare; i++) benchIds.push(id);
        });
        const bench = benchIds.length
            ? `<div class="rg-bench"><span class="rg-bench-label">控え</span>${benchIds.map(id => icon(id, 'rg-benched')).join('')}</div>`
            : '';

        return `
            <section class="rg-build">
                <div class="rg-build-head">
                    <span title="${GameState.getRodType().description}">${GameState.getRodDisplayName()} <span class="rg-stars">${'★'.repeat(GameState.rodStars)}</span></span>
                    <span>パワー <strong>${GameState.getTotalPower()}</strong></span>
                    <span>スロット ${equipped.length}/${slots}</span>
                </div>
                <div class="rg-skill-row">${equippedIcons}${emptyIcons}</div>
                ${bench}
            </section>
        `;
    },

    // ----------------------------------------
    // ラウンド結果と報酬3択
    // ----------------------------------------
    summaryHtml(summary) {
        const grade = GAME_DATA.ROGUE_CONFIG.grades.find(g => g.id === summary.grade);
        const gradeNote = { gold: '報酬4択・Tier1段階上・入れ替え1回無料', silver: '報酬4択', bronze: '' }[grade.id];
        const banner = summary.isFinalClear
            ? `<div class="rg-banner"><span class="material-icons">emoji_events</span> 釣り旅達成！ ここから先はエンドレスです</div>`
            : '';

        return `
            ${banner}
            <div class="rg-summary">
                <div class="rg-summary-row"><span>評価</span><strong class="rg-grade rg-grade-${grade.id}">${grade.name}${gradeNote ? `<small>${gradeNote}</small>` : ''}</strong></div>
                <div class="rg-summary-row"><span>水揚げ</span><strong>${summary.earned.toLocaleString()} / ${summary.target.toLocaleString()} G</strong></div>
                <div class="rg-summary-row"><span>クリアボーナス</span><strong class="rg-plus">+${summary.clearBonus.toLocaleString()} G</strong></div>
                <div class="rg-summary-row"><span>余った支給餌 ×${summary.leftover}</span><strong class="rg-plus">+${summary.leftoverBonus.toLocaleString()} G</strong></div>
            </div>
        `;
    },

    rewardHtml(harbor) {
        const cards = harbor.rewardOptions.map((id, index) => {
            const skill = GameState.getSkillData(id);
            return `
                <button class="rg-reward-card rg-tier-${skill.tier}" onclick="HarborUI.onChooseReward(${index})">
                    <span class="material-icons rg-reward-icon">${skill.icon || 'auto_fix_high'}</span>
                    <span class="rg-tier-badge rg-tier-${skill.tier}">${this.TIER_LABELS[skill.tier]}</span>
                    <span class="rg-reward-name">${skill.name}</span>
                    <span class="rg-reward-desc">${skill.description}</span>
                </button>
            `;
        }).join('');

        return `
            <h3 class="rg-section-title"><span class="material-icons">redeem</span> 報酬スキルを1つ選ぶ</h3>
            <div class="rg-reward-list rg-count-${harbor.rewardOptions.length}">${cards}</div>
            <button class="btn-nav rg-skip-btn" onclick="HarborUI.onSkipReward()">
                受け取らずに +${RunManager.getRewardSkipBonus().toLocaleString()} G もらう
            </button>
        `;
    },

    // ----------------------------------------
    // ショップ（スキル・餌・竿を1画面に）
    // ----------------------------------------
    shopHtml(harbor) {
        const money = GameState.money;

        const skillCards = harbor.shopSkills.map((offer, index) => {
            const skill = GameState.getSkillData(offer.id);
            const price = RunManager.getSkillPrice(offer.id);
            return `
                <button class="rg-card rg-skill-card rg-tier-${skill.tier} ${offer.sold ? 'sold' : ''}"
                    onclick="HarborUI.onBuySkill(${index})" ${offer.sold ? 'disabled' : ''}>
                    <span class="rg-card-top">
                        <span class="material-icons rg-skill-icon">${skill.icon || 'auto_fix_high'}</span>
                        <span class="rg-tier-badge rg-tier-${skill.tier}">${this.TIER_LABELS[skill.tier]}</span>
                    </span>
                    <span class="rg-card-name">${skill.name}</span>
                    <span class="rg-card-desc">${skill.description}</span>
                    ${offer.sold ? '<span class="rg-price">購入済み</span>' : this.priceHtml(price, money)}
                </button>
            `;
        }).join('');

        const rerollCost = RunManager.getRerollCost();
        const rerollLabel = rerollCost === 0 ? '無料' : `${rerollCost.toLocaleString()} G`;

        const power = GameState.getTotalPower();
        const offers = RunManager.getBaitOffers();
        const baitTiles = GAME_DATA.ROGUE_CONFIG.baitShop.map(item => {
            const bait = GAME_DATA.BAITS.find(b => b.id === item.id);
            const offer = offers.find(o => o.id === item.id);
            if (!offer) {
                return `<div class="rg-card rg-bait-tile locked">
                    <span class="rg-rank-chip rarity-${bait.rank}">${bait.rank}</span>
                    <span class="rg-card-desc">R${item.fromRound}から</span>
                </div>`;
            }
            const rate = FishingGame.estimateBaitSuccess(item.id, power);
            return `
                <button class="rg-card rg-bait-tile ${offer.stock <= 0 ? 'sold' : ''}"
                    onclick="HarborUI.onBuyBait('${item.id}')" ${offer.stock <= 0 ? 'disabled' : ''}>
                    <span class="rg-rank-chip rarity-${bait.rank}">${bait.rank}</span>
                    <span class="rg-card-name">×${offer.quantity}</span>
                    <span class="rg-rate ${rate < 0.5 ? 'rg-low' : ''}">成功 ${Math.round(rate * 100)}%</span>
                    <span class="rg-card-desc">所持${GameState.getBaitCount(item.id)}・在庫${offer.stock}</span>
                    ${offer.stock <= 0 ? '<span class="rg-price">売り切れ</span>' : this.priceHtml(offer.price, money)}
                </button>
            `;
        }).join('');

        return `
            <div class="rg-section-head">
                <h3 class="rg-section-title"><span class="material-icons">auto_fix_high</span> スキル</h3>
                <button class="btn rg-reroll-btn ${money < rerollCost ? 'disabled' : ''}" onclick="HarborUI.onReroll()">
                    <span class="material-icons">refresh</span> 入れ替え ${rerollLabel}
                </button>
            </div>
            <div class="rg-card-row rg-cols-3">${skillCards}</div>

            <h3 class="rg-section-title"><span class="material-icons">set_meal</span> 餌 <small>成功率は今のパワーでの目安。買った餌は持ち越せます</small></h3>
            <div class="rg-card-row rg-cols-4">${baitTiles}</div>

            <h3 class="rg-section-title"><span class="material-icons">phishing</span> 竿 <small>購入・強化のたびにスキルスロット+1</small></h3>
            ${this.rodHtml(money)}
        `;
    },

    rodHtml(money) {
        const rod = GameState.getCurrentRod();
        const power = rod.basePower + rod.starPowerBonus * GameState.rodStars;

        // 星強化（今の竿のまま）
        const upgradeCost = GameState.getUpgradeCost();
        const upgrade = upgradeCost === null
            ? `<div class="rg-card rg-rod-card sold"><span class="rg-card-name">${GameState.getRodDisplayName()} 星強化</span><span class="rg-card-desc">最大まで強化済み</span></div>`
            : `<button class="rg-card rg-rod-card rg-rod-row" onclick="HarborUI.onUpgradeRod()">
                    <span class="rg-rod-row-text">
                        <span class="rg-card-name">${GameState.getRodDisplayName()} 星強化 ★${GameState.rodStars + 1}</span>
                        <span class="rg-card-desc">竿パワー ${power}→${power + rod.starPowerBonus}、スロット+1</span>
                    </span>
                    ${this.priceHtml(upgradeCost, money)}
               </button>`;

        // 次の素材の竿（タイプ違いで2本並ぶ。買えるのは1本）
        const nextIndex = GameState.rodRankIndex + 1;
        const nextRod = GAME_DATA.RODS[nextIndex];
        const offers = GameState.run.harbor.rodOffers || [];
        let shelf = '';
        if (!nextRod) {
            shelf = '<div class="rg-empty-slot">最上位の素材の竿です</div>';
        } else if (offers.length === 0) {
            shelf = '<div class="rg-empty-slot">この宿の竿は売り切れました</div>';
        } else {
            shelf = `<div class="rg-card-row rg-cols-2">${offers.map((typeId, index) => `
                <button class="rg-card rg-rod-card" onclick="HarborUI.onBuyRod(${index})">
                    ${RodAnimator.previewSvg(typeId, nextIndex)}
                    <span class="rg-card-name">${GameState.getRodDisplayName(nextIndex, typeId)}</span>
                    <span class="rg-card-desc">${GameState.getRodType(typeId).description}</span>
                    <span class="rg-card-desc">竿パワー ${power}→${nextRod.basePower}（星は0から）</span>
                    ${this.priceHtml(GameState.getRodPrice(nextIndex, typeId), money)}
                </button>`).join('')}</div>`;
        }
        return `<div class="rg-card-row">${upgrade}</div>${shelf}`;
    },
    // 価格。足りないときは不足額を出す
    priceHtml(price, money) {
        if (money >= price) return `<span class="rg-price">${price.toLocaleString()} G</span>`;
        return `<span class="rg-price rg-short">あと ${(price - money).toLocaleString()} G</span>`;
    },

    // ----------------------------------------
    // フッター: 釣り場カード（タップでそのまま出発）
    // ----------------------------------------
    areaHtml(harbor) {
        const run = GameState.run;
        const nextRound = run.round + 1;
        const region = RunManager.getRegion(nextRound);
        const supply = GAME_DATA.BAITS.find(b => b.id === RunManager.getSupplyBait(nextRound));
        const locked = !harbor.rewardTaken;

        const cards = harbor.spotOffers.map((offer, index) => {
            const spot = region.spots.find(s => s.id === offer.spot);
            const weather = RunManager.getWeather(offer.weather);
            const highValue = GAME_DATA.FISH.find(f => f.id === offer.highValue);
            const isNew = RunManager.spotHasNewFish(nextRound, offer.spot);
            const tags = weather.tags.map(t => `<span class="rg-tag ${t.good ? 'good' : 'bad'}">${t.text}</span>`).join('');
            return `
                <button class="rg-area-card rg-weather-${weather.id}" onclick="HarborUI.onDepart(${index})" ${locked ? 'disabled' : ''}>
                    ${isNew ? '<span class="rg-new-badge">未登録あり</span>' : ''}
                    <span class="rg-area-name"><span class="material-icons">${weather.icon}</span>${GameState.getSpotDisplayName(spot, weather)}</span>
                    <span class="rg-area-target">目標 ${RunManager.getTarget(nextRound, weather.id).toLocaleString()} G</span>
                    <span class="rg-area-high">高値: ${highValue ? highValue.name : '―'}</span>
                    ${tags ? `<span class="rg-tags">${tags}</span>` : ''}
                </button>
            `;
        }).join('');

        return `
            <div class="rg-next-label">${locked ? '報酬を選ぶと出発できます' : `R${nextRound} ${region.name}：釣り場を選んで出発`}
                <span class="rg-next-supply">支給: ${supply.name}×${RunManager.config.baitPerRound}</span></div>
            <div class="rg-area-row rg-cols-${harbor.spotOffers.length}">${cards}</div>
        `;
    },
    // ========================================
    // 釣り宿: 入力ハンドラ
    // ========================================
    _after(success, failMessage = 'お金が足りません') {
        SoundManager.play(success ? 'buy' : 'deny');
        if (!success) UIManager.showMessage(failMessage, 1500);
        this.render();
    },

    onChooseReward(index) {
        SoundManager.play('select');
        const skillId = GameState.run.harbor.rewardOptions[index];
        if (RunManager.chooseReward(index)) {
            const equippedNow = GameState.getEquippedSkillCount(skillId) > 0;
            UIManager.showNotification('スキル獲得', equippedNow
                ? `${GameState.getSkillData(skillId).name} を装備しました`
                : `${GameState.getSkillData(skillId).name} を控えに入れました（スロットが一杯です）`, 'auto_fix_high', 2500);
        }
        this.render();
    },

    onSkipReward() {
        RunManager.skipReward();
        this.render();
    },

    onBuySkill(index) { this._after(RunManager.buySkill(index)); },
    onReroll() { this._after(RunManager.rerollSkills()); },
    onBuyBait(baitId) { this._after(RunManager.buyBait(baitId)); },
    onUpgradeRod() { this._after(RunManager.upgradeRod()); },
    onBuyRod(index) { this._after(RunManager.buyNextRod(index)); },

    onDepart(index) {
        if (!RunManager.depart(index)) {
            UIManager.showMessage('先に報酬スキルを選んでください', 1500);
        }
    },

    // ========================================
    // スキル詳細（釣り宿では装備の付け替え・売却もここで行う）
    // ========================================
    showSkill(skillId, isEquipped) {
        const skill = GameState.getSkillData(skillId);
        const inHarbor = GameState.run && GameState.run.phase === 'harbor';

        let actions = '';
        if (inHarbor) {
            const sell = `<button class="btn rg-sell-btn" onclick="HarborUI.onSellSkill('${skillId}')">売る +${RunManager.getSkillSellPrice(skillId).toLocaleString()} G</button>`;
            actions = isEquipped
                ? `<button class="btn btn-unequip" onclick="HarborUI.onToggleSkill('${skillId}', false)">外す</button>${sell}`
                : `<button class="btn btn-equip" onclick="HarborUI.onToggleSkill('${skillId}', true)">装備する</button>${sell}`;
        }

        const overlay = this.openModal('skill-modal', `
            <div class="modal-header">
                <h2><span class="material-icons rg-skill-icon rg-tier-${skill.tier}">${skill.icon || 'auto_fix_high'}</span> ${skill.name}</h2>
                <button class="btn-close" onclick="HarborUI.closeModal('skill-modal')"><span class="material-icons">close</span></button>
            </div>
            <p class="rg-skill-detail"><span class="rg-tier-badge rg-tier-${skill.tier}">Tier ${this.TIER_LABELS[skill.tier]}</span> ${isEquipped ? '装備中' : '控え'}</p>
            <p class="rg-skill-detail">${skill.description}</p>
            ${actions ? `<div class="rg-modal-actions">${actions}</div>` : ''}
        `);
        overlay.addEventListener('click', e => {
            if (e.target === overlay) this.closeModal('skill-modal');
        });
    },

    onToggleSkill(skillId, equip) {
        const result = RunManager.toggleSkill(skillId, equip);
        this.closeModal('skill-modal');
        this._after(result.can, result.reason);
    },

    onSellSkill(skillId) {
        this.closeModal('skill-modal');
        this._after(RunManager.sellSkill(skillId), '売却できませんでした');
    },

    // ========================================
    // モーダル共通
    // ========================================
    openModal(id, innerHtml) {
        this.closeModal(id);
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = id;
        overlay.innerHTML = `<div class="modal-content rg-modal">${innerHtml}</div>`;
        // 釣り画面のタップ判定（キャスト）に流れないようにする
        overlay.addEventListener('pointerdown', e => e.stopPropagation());
        document.body.appendChild(overlay);
        return overlay;
    },

    closeModal(id) {
        const existing = document.getElementById(id);
        if (existing) existing.remove();
    },

    // ========================================
    // 釣り中の装備確認（閲覧のみ。変更は釣り宿で行う）
    // ========================================
    showBuild() {
        const run = GameState.run;
        if (!run) return;

        const weather = GameState.getCurrentWeather();
        const region = GameState.getCurrentRegion();
        const highValue = GAME_DATA.FISH.find(f => f.id === run.highValue);
        const skills = GameState.equippedSkills.map(id => this.skillRow(id)).join('')
            || '<div class="rg-empty-slot">スキルを装備していません</div>';

        const overlay = this.openModal('build-modal', `
            <div class="modal-header">
                <h2><span class="material-icons">backpack</span> 装備</h2>
                <button class="btn-close" onclick="HarborUI.closeModal('build-modal')"><span class="material-icons">close</span></button>
            </div>
            <div class="rg-modal-body">
                <div class="rg-summary">
                    <div class="rg-summary-row"><span>竿</span><strong>${GameState.getRodDisplayName()} ${'★'.repeat(GameState.rodStars)}</strong></div>
                    <div class="rg-summary-row"><span></span><span class="rg-area-desc">${GameState.getRodType().description}</span></div>
                    <div class="rg-summary-row"><span>釣りパワー</span><strong>${GameState.getTotalPower()}</strong></div>
                    <div class="rg-summary-row"><span>スキルスロット</span><strong>${GameState.equippedSkills.length} / ${GameState.getSkillSlots()}</strong></div>
                    ${weather ? `<div class="rg-summary-row"><span>釣り場</span><strong>${region.name}・${GameState.getSpotDisplayName()}</strong></div>
                    <div class="rg-summary-row"><span>天候：${weather.name}</span><span class="rg-area-desc">${weather.description}</span></div>` : ''}
                    ${highValue ? `<div class="rg-summary-row"><span>本日の高値</span><strong>${highValue.name}（売値${RunManager.config.highValueMult}倍）</strong></div>` : ''}
                </div>
                <div class="shop-items">${skills}</div>
                <p class="rg-note">装備の変更と買い物は、ラウンドをクリアした後の釣り宿で行えます。</p>
                <button class="rg-sound-btn" onclick="UIManager.toggleSound()"></button>
                <button class="btn-nav rg-retire-btn" onclick="HarborUI.onRetire()">この釣り旅をリタイアする</button>
            </div>
        `);
        overlay.addEventListener('click', e => {
            if (e.target === overlay) this.closeModal('build-modal');
        });
        UIManager.updateSoundButtons();
    },

    // ========================================
    // 釣り旅の最初の竿選び（万能竿＋ランダム2タイプ）
    // ========================================
    showRodChoice() {
        const run = GameState.run;
        if (!run || run.phase !== 'setup') return;
        const rod = GAME_DATA.RODS[0];

        const cards = run.startRods.map(typeId => `
            <button class="rg-card rg-rod-card rg-start-rod" onclick="HarborUI.onChooseStartRod('${typeId}')">
                ${RodAnimator.previewSvg(typeId, 0)}
                <span class="rg-card-name">${GameState.getRodDisplayName(0, typeId)}</span>
                <span class="rg-card-desc">${GameState.getRodType(typeId).description}</span>
            </button>
        `).join('');

        this.openModal('rod-choice-modal', `
            <div class="modal-header">
                <h2><span class="material-icons">phishing</span> 最初の竿を選ぶ</h2>
            </div>
            <p class="rg-note">竿パワー ${rod.basePower} の木の竿です。タイプで得意なことが変わります。</p>
            <div class="rg-start-rod-list">${cards}</div>
        `);
    },

    onChooseStartRod(typeId) {
        SoundManager.play('select');
        if (RunManager.chooseStartRod(typeId)) this.closeModal('rod-choice-modal');
    },

    skillRow(skillId) {
        const skill = GameState.getSkillData(skillId);
        return `
            <div class="shop-item">
                <span class="material-icons rg-skill-icon rg-tier-${skill.tier}">${skill.icon || 'auto_fix_high'}</span>
                <div class="item-info">
                    <div class="item-name">${skill.name} <span class="rg-tier-badge rg-tier-${skill.tier}">${this.TIER_LABELS[skill.tier]}</span></div>
                    <div class="item-desc">${skill.description}</div>
                </div>
            </div>
        `;
    },

    onRetire() {
        if (!window.confirm('この釣り旅を終了しますか？（進行状況は失われます）')) return;
        this.closeModal('build-modal');
        RunManager.retire();
    },

    // ========================================
    // ゲームオーバー
    // ========================================
    showGameOver(isBest) {
        const run = GameState.run;
        const cleared = run.round - 1;
        const biggest = GameState.biggestFish ? GameState.biggestFish.name : '―';
        const st = run.stats;
        const pct = (a, b) => b > 0 ? `${Math.round(a / b * 100)}%` : '―';
        const stops = st.zones.red + st.zones.green + st.zones.white;

        this.openModal('gameover-modal', `
            <div class="rg-gameover">
                <div class="rg-gameover-title">GAME OVER</div>
                <p class="rg-gameover-lead">ラウンド${run.round}で餌が尽きた…<br>
                    水揚げ ${run.earned.toLocaleString()} / ${run.target.toLocaleString()} G</p>
                ${isBest ? '<div class="rg-banner"><span class="material-icons">military_tech</span> 最高記録を更新！</div>' : ''}
                <div class="rg-summary">
                    <div class="rg-summary-row"><span>クリアしたラウンド</span><strong>${cleared}</strong></div>
                    <div class="rg-summary-row"><span>釣り上げ成功率</span><strong>${pct(st.catches, st.casts)}（${st.catches}/${st.casts}投）</strong></div>
                    <div class="rg-summary-row"><span>赤ゾーンで止めた割合</span><strong>${pct(st.zones.red, stops)}</strong></div>
                    <div class="rg-summary-row"><span>逃げられた魚の平均パワー</span><strong>${st.escapes > 0 ? Math.round(st.escapedPower / st.escapes) : '―'}（自分 ${GameState.getTotalPower()}）</strong></div>
                    <div class="rg-summary-row"><span>稼いだ総額</span><strong>${GameState.totalMoneyEarned.toLocaleString()} G</strong></div>
                    <div class="rg-summary-row"><span>一番の大物</span><strong>${biggest}</strong></div>
                </div>
                <div class="rg-gameover-actions">
                    <button class="btn-main" onclick="HarborUI.onRestart()">もう一度</button>
                    <button class="btn-nav" onclick="HarborUI.onBackToTitle()">タイトルへ</button>
                </div>
            </div>
        `);
    },

    onRestart() {
        this.closeModal('gameover-modal');
        RunManager.startNewRun();
    },

    onBackToTitle() {
        this.closeModal('gameover-modal');
        GameState.run = null;
        UIManager.showScreen('start');
    }
};

// グローバルに公開
if (typeof window !== 'undefined') {
    window.HarborUI = HarborUI;
}
